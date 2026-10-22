// Multi-leg strategy P/L, analysis and templates. Single expiry; 1 contract = 100 shares.
// Leg: { type: 'call'|'put'|'stock', side: 1|-1, strike, qty, premium, auto }
// For stock legs, premium is the entry price and qty is in lots of 100 shares.
(function (root) {
  'use strict';
  const OA = (root.OA = root.OA || {});
  const BS = OA.bs;
  const MULT = 100;
  const round2 = (v) => Math.round(v * 100) / 100;

  function unitValue(leg, s, T, r, sigma, q) {
    if (leg.type === 'stock') return s;
    return BS.price(leg.type, s, leg.strike, T, r, sigma, q);
  }

  function pnl(legs, s, T, r, sigma, q) {
    let total = 0;
    for (const l of legs) total += l.side * l.qty * MULT * (unitValue(l, s, T, r, sigma, q) - l.premium);
    return total;
  }

  const expiryPnl = (legs, s) => pnl(legs, s, 0, 0, 0.2, 0);

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
    const net = legs.reduce((a, l) => a - l.side * l.qty * MULT * l.premium, 0); // >0 = net credit
    // Expiry P/L is piecewise linear with kinks at strikes, so extrema sit on kinks or at the ends.
    const strikes = legs.filter((l) => l.type !== 'stock').map((l) => l.strike);
    const kinks = Array.from(new Set([0, ...strikes])).sort((a, b) => a - b);
    const top = Math.max(kinks[kinks.length - 1], env.S) * 2 + 1;
    const pts = [...kinks, top];
    const vals = pts.map((s) => expiryPnl(legs, s));
    const upSlope = legs.reduce((a, l) => a + (l.type === 'put' ? 0 : l.side * l.qty * MULT), 0);

    let maxProfit = Math.max(...vals);
    let maxLoss = Math.min(...vals);
    if (upSlope > 1e-9) maxProfit = Infinity;
    if (upSlope < -1e-9) maxLoss = -Infinity;

    const bes = [];
    const pushBe = (x) => {
      if (x > 1e-9 && !bes.some((b) => Math.abs(b - x) < 1e-6)) bes.push(x);
    };
    for (let i = 0; i < pts.length - 1; i++) {
      const a = vals[i], b = vals[i + 1];
      if (Math.abs(a) < 1e-9) pushBe(pts[i]);
      else if (a * b < 0) pushBe(pts[i] + ((pts[i + 1] - pts[i]) * a) / (a - b));
    }
    const last = vals[vals.length - 1];
    if (Math.abs(last) < 1e-9) pushBe(top);
    else if (Math.abs(upSlope) > 1e-9 && last * upSlope < 0) pushBe(top - last / upSlope);
    bes.sort((a, b) => a - b);

    // Probability of profit at expiry: sum probability mass of intervals where P/L > 0
    let pop = null;
    if (env.T > 0) {
      const bounds = [0, ...bes, Infinity];
      pop = 0;
      for (let i = 0; i < bounds.length - 1; i++) {
        const a = bounds[i], b = bounds[i + 1];
        const mid = isFinite(b) ? (a + b) / 2 : a + Math.max(env.S, a) * 0.5 + 1;
        if (expiryPnl(legs, mid) > 1e-9) pop += probAbove(a, env) - probAbove(b, env);
      }
    }

    return { net, maxProfit, maxLoss, breakevens: bes, pop, greeks: greeks(legs, env) };
  }

  // Position Greeks: delta/gamma in share equivalents, theta $/day, vega $/vol point
  function greeks(legs, env) {
    const g = { delta: 0, gamma: 0, theta: 0, vega: 0 };
    for (const l of legs) {
      const m = l.side * l.qty * MULT;
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

  function strikeStep(S) {
    if (S < 50) return 1;
    if (S < 200) return 5;
    return 10;
  }
  function roundStrike(S, k = 0) {
    const st = strikeStep(S);
    return Math.max(st, Math.round(S / st) * st + k * st);
  }

  // legs: [type, side, strikeOffsetInSteps, qty]
  const templates = {
    long_call: { name: '买入看涨 Long Call', view: '看涨', desc: '支付权利金，标的涨过盈亏平衡点后开始获利。最大亏损是权利金。', legs: [['call', 1, 0]] },
    long_put: { name: '买入看跌 Long Put', view: '看跌', desc: '支付权利金，标的跌破盈亏平衡点后开始获利。最大亏损是权利金。', legs: [['put', 1, 0]] },
    short_call: { name: '卖出看涨 Short Call（裸卖）', view: '不涨', desc: '收取权利金，标的不涨过行权价则保留全部权利金。上涨亏损理论上无限，风险最高。', legs: [['call', -1, 1]] },
    cash_secured_put: { name: '现金担保卖 Put', view: '不跌 / 愿意低价接股', desc: '收取权利金。若到期跌破行权价，将按行权价买入股票。', legs: [['put', -1, -1]] },
    covered_call: { name: '备兑看涨 Covered Call', view: '温和看涨 / 横盘', desc: '持有 100 股同时卖出一张价外 Call，用上涨空间换权利金收入。', legs: [['stock', 1, 0], ['call', -1, 1]] },
    protective_put: { name: '保护性看跌 Protective Put', view: '持股但担心下跌', desc: '持有 100 股并买入一张 Put，为持仓设定下跌保护。', legs: [['stock', 1, 0], ['put', 1, -1]] },
    bull_call_spread: { name: '牛市看涨价差 Bull Call Spread', view: '温和看涨', desc: '买入低行权价 Call、卖出高行权价 Call。降低成本，同时封顶收益。', legs: [['call', 1, 0], ['call', -1, 2]] },
    bear_put_spread: { name: '熊市看跌价差 Bear Put Spread', view: '温和看跌', desc: '买入高行权价 Put、卖出低行权价 Put。成本和收益都有限。', legs: [['put', 1, 0], ['put', -1, -2]] },
    bull_put_spread: { name: '牛市看跌价差 Bull Put Spread（收入型）', view: '不跌', desc: '卖出较高行权价 Put、买入更低行权价 Put，收取净权利金，最大亏损有限。', legs: [['put', -1, -1], ['put', 1, -3]] },
    long_straddle: { name: '买入跨式 Long Straddle', view: '大幅波动，方向不确定', desc: '同时买入同一行权价的 Call 和 Put。需要大幅波动才能覆盖两份权利金。', legs: [['call', 1, 0], ['put', 1, 0]] },
    long_strangle: { name: '买入宽跨式 Long Strangle', view: '大幅波动，方向不确定', desc: '买入价外 Call 和价外 Put，比跨式便宜，但需要更大的波动。', legs: [['call', 1, 2], ['put', 1, -2]] },
    iron_condor: { name: '铁鹰 Iron Condor', view: '区间震荡', desc: '卖出价外 Put 价差和价外 Call 价差，标的留在区间内则获利，两侧亏损有限。', legs: [['put', 1, -4], ['put', -1, -2], ['call', -1, 2], ['call', 1, 4]] },
    long_butterfly: { name: '买入蝶式 Long Call Butterfly', view: '到期价格贴近中间行权价', desc: '买 1 低、卖 2 中、买 1 高行权价 Call。成本低，盈利区间窄。', legs: [['call', 1, -2], ['call', -1, 0, 2], ['call', 1, 2]] },
  };

  function template(key, env) {
    const t = templates[key];
    if (!t) return [];
    return t.legs.map(([type, side, k, qty = 1]) => {
      const leg = { type, side, qty, strike: type === 'stock' ? 0 : roundStrike(env.S, k), premium: 0, auto: true };
      leg.premium = round2(theoPrice(leg, env));
      return leg;
    });
  }

  OA.strategy = { MULT, pnl, expiryPnl, theoPrice, analyze, greeks, probAbove, roundStrike, strikeStep, templates, template, round2 };
})(typeof window !== 'undefined' ? window : globalThis);
