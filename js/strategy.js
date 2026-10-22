// Multi-leg strategy P/L, analysis and templates. Single expiry.
// Leg: { type: 'call'|'put'|'stock', side: 1|-1, strike, qty, premium, auto }
// For stock/ETF legs, premium is the entry price and qty is in lots of one contract multiplier.
// env: { S, sigma, r, q, T, mult } — mult is the contract multiplier (US 100, A-share ETF 10000).
(function (root) {
  'use strict';
  const OA = (root.OA = root.OA || {});
  const BS = OA.bs;
  const roundTo = (v, dp) => { const f = Math.pow(10, dp); return Math.round(v * f) / f; };
  const round2 = (v) => roundTo(v, 2);

  // Market conventions
  const markets = {
    us: {
      id: 'us', name: '美股', cur: '$', mult: 100, dp: 2, unit: '股', lotLabel: '手数（×100股）', underlying: '股票',
      callName: 'Call 看涨', putName: 'Put 看跌',
      defaults: { S: 100, iv: 30, r: 4, q: 0, days: 30 },
      strikeStep(S) { return S < 50 ? 1 : S < 200 ? 5 : 10; },
    },
    cn: {
      id: 'cn', name: 'A股ETF', cur: '¥', mult: 10000, dp: 4, unit: '份', lotLabel: 'ETF（×10000份）', underlying: 'ETF',
      callName: '认购（Call）', putName: '认沽（Put）',
      defaults: { S: 3, iv: 20, r: 1.5, q: 0, days: 30 },
      // SSE/SZSE ETF option strike spacing
      strikeStep(S) {
        if (S <= 3) return 0.05;
        if (S <= 5) return 0.1;
        if (S <= 10) return 0.25;
        if (S <= 20) return 0.5;
        if (S <= 50) return 1;
        if (S <= 100) return 2.5;
        return 5;
      },
    },
  };
  const multOf = (env) => (env && env.mult) || 100;

  function unitValue(leg, s, T, r, sigma, q) {
    if (leg.type === 'stock') return s;
    return BS.price(leg.type, s, leg.strike, T, r, sigma, q);
  }

  function pnl(legs, s, T, r, sigma, q, mult = 100) {
    let total = 0;
    for (const l of legs) total += l.side * l.qty * mult * (unitValue(l, s, T, r, sigma, q) - l.premium);
    return total;
  }

  const expiryPnl = (legs, s, mult = 100) => pnl(legs, s, 0, 0, 0.2, 0, mult);

  function theoPrice(leg, env) {
    if (leg.type === 'stock') return env.S;
    return BS.price(leg.type, env.S, leg.strike, env.T, env.r, env.sigma, env.q);
  }

  // P(S_T > x) under risk-neutral lognormal assumption
  function probAbove(x, env) {
    if (x <= 0) return 1;
    if (!isFinite(x)) return 0;
    if (env.T <= 0) return env.S > x ? 1 : 0;
    const sd = env.sigma * Math.sqrt(env.T);
    const d2 = (Math.log(env.S / x) + (env.r - env.q - 0.5 * env.sigma * env.sigma) * env.T) / sd;
    return BS.normCdf(d2);
  }

  function analyze(legs, env) {
    const M = multOf(env);
    const net = legs.reduce((a, l) => a - l.side * l.qty * M * l.premium, 0); // >0 = net credit
    // Expiry P/L is piecewise linear with kinks at strikes, so extrema sit on kinks or at the ends.
    const strikes = legs.filter((l) => l.type !== 'stock').map((l) => l.strike);
    const kinks = Array.from(new Set([0, ...strikes])).sort((a, b) => a - b);
    const top = Math.max(kinks[kinks.length - 1], env.S) * 2 + 1;
    const pts = [...kinks, top];
    const vals = pts.map((s) => expiryPnl(legs, s, M));
    const upSlope = legs.reduce((a, l) => a + (l.type === 'put' ? 0 : l.side * l.qty * M), 0);
    const eps = 1e-9 * M;

    let maxProfit = Math.max(...vals);
    let maxLoss = Math.min(...vals);
    if (upSlope > eps) maxProfit = Infinity;
    if (upSlope < -eps) maxLoss = -Infinity;

    const bes = [];
    const pushBe = (x) => {
      if (x > 1e-9 && !bes.some((b) => Math.abs(b - x) < 1e-7)) bes.push(x);
    };
    for (let i = 0; i < pts.length - 1; i++) {
      const a = vals[i], b = vals[i + 1];
      if (Math.abs(a) < eps) pushBe(pts[i]);
      else if (a * b < 0) pushBe(pts[i] + ((pts[i + 1] - pts[i]) * a) / (a - b));
    }
    const last = vals[vals.length - 1];
    if (Math.abs(last) < eps) pushBe(top);
    else if (Math.abs(upSlope) > eps && last * upSlope < 0) pushBe(top - last / upSlope);
    bes.sort((a, b) => a - b);

    // Probability of profit at expiry: sum probability mass of intervals where P/L > 0
    let pop = null;
    if (env.T > 0) {
      const bounds = [0, ...bes, Infinity];
      pop = 0;
      for (let i = 0; i < bounds.length - 1; i++) {
        const a = bounds[i], b = bounds[i + 1];
        const mid = isFinite(b) ? (a + b) / 2 : a + Math.max(env.S, a) * 0.5 + 1;
        if (expiryPnl(legs, mid, M) > eps) pop += probAbove(a, env) - probAbove(b, env);
      }
    }

    return { net, maxProfit, maxLoss, breakevens: bes, pop, greeks: greeks(legs, env) };
  }

  // Position Greeks: delta/gamma in underlying units, theta per day, vega per vol point (currency)
  function greeks(legs, env) {
    const M = multOf(env);
    const g = { delta: 0, gamma: 0, theta: 0, vega: 0 };
    for (const l of legs) {
      const m = l.side * l.qty * M;
      if (l.type === 'stock') {
        g.delta += m;
        continue;
      }
      const x = BS.greeks(l.type, env.S, l.strike, env.T, env.r, env.sigma, env.q);
      g.delta += m * x.delta;
      g.gamma += m * x.gamma;
      g.theta += m * x.theta;
      g.vega += m * x.vega;
    }
    return g;
  }

  function strikeStep(S, market = 'us') {
    return markets[market].strikeStep(S);
  }
  // ATM strike on the spot's grid, then walk k listed strikes up/down.
  // Spacing follows the band of each strike (e.g. CN: 2.95, 3.00, 3.10, 3.20).
  function roundStrike(S, k = 0, market = 'us') {
    const step = markets[market].strikeStep;
    const st0 = step(S);
    let x = roundTo(Math.max(st0, Math.round(S / st0) * st0), 4);
    for (let i = 0; i < Math.abs(k); i++) {
      const up = k > 0;
      const st = step(up ? x + 1e-9 : x - 1e-9);
      const nx = roundTo(x + (up ? st : -st), 4);
      if (nx <= 0) break;
      x = nx;
    }
    return x;
  }

  // legs: [type, side, strikeOffsetInSteps, qty]
  const templates = {
    long_call: { name: '买入看涨 Long Call', cn: '买入认购', view: '看涨', desc: '支付权利金，标的涨过盈亏平衡点后开始获利。最大亏损是权利金。', legs: [['call', 1, 0]] },
    long_put: { name: '买入看跌 Long Put', cn: '买入认沽', view: '看跌', desc: '支付权利金，标的跌破盈亏平衡点后开始获利。最大亏损是权利金。', legs: [['put', 1, 0]] },
    short_call: { name: '卖出看涨 Short Call（裸卖）', cn: '卖出认购（保证金开仓）', view: '不涨', desc: '收取权利金，标的不涨过行权价则保留全部权利金。上涨亏损理论上无限，风险最高。', legs: [['call', -1, 1]] },
    cash_secured_put: { name: '现金担保卖 Put', cn: '卖出认沽（保证金开仓）', view: '不跌 / 愿意低价买入标的', desc: '收取权利金。若到期跌破行权价，将按行权价买入标的。', legs: [['put', -1, -1]] },
    covered_call: { name: '备兑看涨 Covered Call', cn: '备兑开仓（持有ETF + 卖出认购）', view: '温和看涨 / 横盘', desc: '持有标的同时卖出一张价外 Call，用上涨空间换权利金收入。', legs: [['stock', 1, 0], ['call', -1, 1]] },
    protective_put: { name: '保护性看跌 Protective Put', cn: '保险策略（持有ETF + 买入认沽）', view: '持有标的但担心下跌', desc: '持有标的并买入一张 Put，为持仓设定下跌保护。', legs: [['stock', 1, 0], ['put', 1, -1]] },
    bull_call_spread: { name: '牛市看涨价差 Bull Call Spread', cn: '认购牛市价差', view: '温和看涨', desc: '买入低行权价 Call、卖出高行权价 Call。降低成本，同时封顶收益。', legs: [['call', 1, 0], ['call', -1, 2]] },
    bear_put_spread: { name: '熊市看跌价差 Bear Put Spread', cn: '认沽熊市价差', view: '温和看跌', desc: '买入高行权价 Put、卖出低行权价 Put。成本和收益都有限。', legs: [['put', 1, 0], ['put', -1, -2]] },
    bull_put_spread: { name: '牛市看跌价差 Bull Put Spread（收入型）', cn: '认沽牛市价差（收入型）', view: '不跌', desc: '卖出较高行权价 Put、买入更低行权价 Put，收取净权利金，最大亏损有限。', legs: [['put', -1, -1], ['put', 1, -3]] },
    long_straddle: { name: '买入跨式 Long Straddle', cn: '买入跨式', view: '大幅波动，方向不确定', desc: '同时买入同一行权价的 Call 和 Put。需要大幅波动才能覆盖两份权利金。', legs: [['call', 1, 0], ['put', 1, 0]] },
    long_strangle: { name: '买入宽跨式 Long Strangle', cn: '买入宽跨式', view: '大幅波动，方向不确定', desc: '买入价外 Call 和价外 Put，比跨式便宜，但需要更大的波动。', legs: [['call', 1, 2], ['put', 1, -2]] },
    iron_condor: { name: '铁鹰 Iron Condor', cn: '铁鹰', view: '区间震荡', desc: '卖出价外 Put 价差和价外 Call 价差，标的留在区间内则获利，两侧亏损有限。', legs: [['put', 1, -4], ['put', -1, -2], ['call', -1, 2], ['call', 1, 4]] },
    long_butterfly: { name: '买入蝶式 Long Call Butterfly', cn: '认购蝶式', view: '到期价格贴近中间行权价', desc: '买 1 低、卖 2 中、买 1 高行权价 Call。成本低，盈利区间窄。', legs: [['call', 1, -2], ['call', -1, 0, 2], ['call', 1, 2]] },
  };

  function templateName(key, market) {
    const t = templates[key];
    return market === 'cn' ? t.cn : t.name;
  }

  // Template strikes: uniform offsets (the wider spacing around ATM) so spreads stay symmetric,
  // then snapped to each strike's own listed grid.
  function templateStrike(S, k, market) {
    const step = markets[market].strikeStep;
    const atm = roundStrike(S, 0, market);
    const u = Math.max(step(atm - 1e-9), step(atm + 1e-9));
    let x = atm + k * u;
    const st = step(x);
    x = Math.round(x / st) * st;
    return roundTo(Math.max(x, st), 4);
  }

  function template(key, env, market = 'us') {
    const t = templates[key];
    if (!t) return [];
    const dp = markets[market].dp;
    return t.legs.map(([type, side, k, qty = 1]) => {
      const leg = { type, side, qty, strike: type === 'stock' ? 0 : templateStrike(env.S, k, market), premium: 0, auto: true };
      leg.premium = roundTo(theoPrice(leg, env), dp);
      return leg;
    });
  }

  // SSE/SZSE exchange-minimum opening margin for short ETF option legs.
  // Theoretical price stands in for the prior settlement price, env.S for the prior close.
  // Short calls up to the number of long ETF lots are treated as covered (no cash margin).
  function cnMargin(legs, env) {
    const M = multOf(env), S = env.S;
    let coverLots = legs.filter((l) => l.type === 'stock' && l.side > 0).reduce((a, l) => a + l.qty, 0);
    let total = 0, covered = 0, naked = 0;
    for (const l of legs) {
      if (l.type === 'stock' || l.side > 0) continue;
      let n = l.qty;
      if (l.type === 'call' && coverLots > 0) {
        const c = Math.min(coverLots, n);
        coverLots -= c;
        n -= c;
        covered += c;
      }
      if (!n) continue;
      naked += n;
      const settle = theoPrice(l, env), K = l.strike;
      const per = l.type === 'call'
        ? (settle + Math.max(0.12 * S - Math.max(K - S, 0), 0.07 * S)) * M
        : Math.min(settle + Math.max(0.12 * S - Math.max(S - K, 0), 0.07 * K), K) * M;
      total += per * n;
    }
    return { total, covered, naked };
  }

  OA.strategy = {
    markets, cnMargin, pnl, expiryPnl, theoPrice, analyze, greeks, probAbove, roundStrike, strikeStep,
    templates, templateName, template, round2, roundTo,
  };
})(typeof window !== 'undefined' ? window : globalThis);
