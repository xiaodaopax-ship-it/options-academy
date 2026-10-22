// Question bank + randomized calculation questions.
// Shape: { id, ch, q, o: [options], a: correctIndex, e: explanation, noShuffle?, gen? }
(function (root) {
  'use strict';
  const OA = (root.OA = root.OA || {});

  const bank = [
    // ch1
    { id: 'q101', ch: 1, q: '买入一张看涨期权（Call），买方获得的是？', o: ['在约定条件下按行权价买入标的的权利，没有义务', '按行权价买入标的的义务', '按行权价卖出标的的权利', '收取权利金的权利'], a: 0, e: 'Call 赋予买方按行权价买入的权利。买方可以选择不行权，最多损失权利金。' },
    { id: 'q102', ch: 1, q: '看跌期权（Put）的卖方承担什么义务？', o: ['买方行权时，按行权价买入标的', '买方行权时，按行权价卖出标的', '向买方支付权利金', '没有任何义务'], a: 0, e: 'Put 买方有权按行权价卖出，对应地，卖方必须按行权价买入。' },
    { id: 'q103', ch: 1, q: '以下哪个头寸理论上亏损无限？', o: ['裸卖看涨期权', '买入看涨期权', '买入看跌期权', '卖出看跌期权'], a: 0, e: '标的价格理论上没有上限，未持股的 Call 卖方在标的大涨时亏损没有上限。卖出 Put 的最大亏损发生在标的跌到 0 时，是有限的。' },
    { id: 'q104', ch: 1, q: '买入期权（Call 或 Put）的最大亏损是？', o: ['支付的全部权利金', '理论上无限', '行权价 × 100', '0'], a: 0, e: '买方最坏情况是期权到期作废，损失全部权利金。' },
    { id: 'q105', ch: 1, q: '卖出看跌期权（Short Put）通常对应什么观点？', o: ['认为标的不会大幅下跌', '预期标的大涨', '预期标的大跌', '预期波动会大幅放大'], a: 0, e: '只要到期时标的不跌破行权价，Put 卖方就保留全部权利金。' },
    // ch2
    { id: 'q201', ch: 2, q: '一张标准美股期权合约对应多少股标的？', o: ['100 股', '10 股', '1,000 股', '1 股'], a: 0, e: '标准合约乘数为 100。' },
    { id: 'q202', ch: 2, q: '某期权报价 $1.85，买入 3 张需支付的权利金（不含费用）是？', o: ['$555', '$185', '$5.55', '$1,850'], a: 0, e: '1.85 × 100 × 3 = $555。' },
    { id: 'q203', ch: 2, q: '标的价格 $50，行权价 $45 的 Put 属于？', o: ['价外（OTM）', '价内（ITM）', '平值（ATM）', '无法判断'], a: 0, e: 'Put 在标的价格低于行权价时才是价内。50 > 45，所以是价外。' },
    { id: 'q204', ch: 2, q: '标的价格 $50，行权价 $45 的 Call 属于？', o: ['价内（ITM）', '价外（OTM）', '平值（ATM）', '无法判断'], a: 0, e: 'Call 在标的价格高于行权价时是价内，内在价值为 $5。' },
    { id: 'q205', ch: 2, q: '美式期权与欧式期权的区别是？', o: ['美式可在到期前任意交易日行权，欧式只能在到期时行权', '美式只在美国交易，欧式只在欧洲交易', '美式只能在到期时行权', '两者没有区别'], a: 0, e: '名称与交易地点无关，区别在于行权时间。美股个股和 ETF 期权是美式的。' },
    { id: 'q206', ch: 2, q: 'SPX 指数期权的行权与交割方式是？', o: ['欧式、现金交割', '美式、实物交割股票', '美式、现金交割', '不能行权'], a: 0, e: 'SPX 期权是欧式的，按差价现金交割。SPY（ETF）期权则是美式、实物交割。' },
    { id: 'q207', ch: 2, q: '美股标准月度期权通常在什么时候到期？', o: ['每月第三个星期五', '每月最后一个交易日', '每月第一个星期一', '每季度最后一天'], a: 0, e: '标准月度合约在每月第三个星期五到期，此外还有周度和每日到期的合约。' },
    { id: 'q208', ch: 2, q: '期权代码 AAPL261218C00200000 表示？', o: ['AAPL 2026-12-18 到期、行权价 $200 的 Call', 'AAPL 2026-12-18 到期、行权价 $2,000 的 Call', 'AAPL 2026-12-18 到期、行权价 $200 的 Put', 'AAPL 2018-12-26 到期、行权价 $200 的 Call'], a: 0, e: '格式为 标的 + YYMMDD + C/P + 行权价×1000（8 位）。00200000 / 1000 = 200。' },
    { id: 'q209', ch: 2, q: '期权链中的 Open Interest 表示？', o: ['当前尚未平仓的合约总数', '当日成交量', '买卖价差', '隐含波动率'], a: 0, e: 'Open Interest 是存量指标，Volume 是当日成交的流量指标。' },
    // ch3
    { id: 'q301', ch: 3, q: '标的 $105，行权价 $100 的 Call 报价 $7.20，它的时间价值是？', o: ['$2.20', '$5.00', '$7.20', '$12.20'], a: 0, e: '内在价值 = 105 − 100 = 5，时间价值 = 7.20 − 5 = 2.20。' },
    { id: 'q302', ch: 3, q: '价外期权的内在价值是？', o: ['0', '等于权利金', '等于行权价', '为负数'], a: 0, e: '内在价值最低为 0，价外期权的价格全部是时间价值。' },
    { id: 'q303', ch: 3, q: '其他条件不变，隐含波动率上升，Call 和 Put 的价格会？', o: ['都上升', 'Call 上升，Put 下降', '都下降', '不变'], a: 0, e: '波动率越大，期权到期获利的可能越大，而期权买方的亏损有限，所以 Call 和 Put 都变贵。' },
    { id: 'q304', ch: 3, q: '其他条件不变，随着到期日临近，期权的时间价值通常会？', o: ['减少', '增加', '保持不变', '先增后减'], a: 0, e: '时间价值随时间流逝衰减，到期归零。平值期权在最后几周衰减最快。' },
    { id: 'q305', ch: 3, q: '欧式、无股息情况下的 Put-Call 平价关系是？', o: ['C − P = S − K·e^(−rT)', 'C + P = S + K', 'C − P = K − S', 'C = P'], a: 0, e: '同标的、同行权价、同到期日的 Call 和 Put 价格之差，等于标的价格减去行权价的现值。' },
    { id: 'q306', ch: 3, q: '其他条件不变，标的预期派发更高的股息，Call 价格通常会？', o: ['下降', '上升', '不变', '先升后降'], a: 0, e: '除息日股价会下调约等于股息的金额，这对 Call 不利，对 Put 有利。' },
    // ch4
    { id: 'q401', ch: 4, q: '买入 1 张行权价 $100 的 Call，权利金 $3。到期标的 $110，盈亏是？', o: ['+$700', '+$1,000', '+$1,300', '+$7'], a: 0, e: '(110 − 100 − 3) × 100 = $700。' },
    { id: 'q402', ch: 4, q: '买入行权价 $50 的 Put，权利金 $2，盈亏平衡点是？', o: ['$48', '$52', '$50', '$2'], a: 0, e: 'Put 买方的平衡点 = 行权价 − 权利金 = 48。' },
    { id: 'q403', ch: 4, q: '卖出 1 张行权价 $100 的 Call，收取 $4。到期标的 $98，盈亏是？', o: ['+$400', '−$200', '+$200', '$0'], a: 0, e: '到期价外，Call 作废，卖方保留全部权利金 4 × 100 = $400。' },
    { id: 'q404', ch: 4, q: '卖出 1 张行权价 $60 的 Put，收取 $1.50。到期标的 $55，盈亏是？', o: ['−$350', '−$500', '+$150', '−$650'], a: 0, e: '被行权亏损 (60 − 55) × 100 = 500，减去收取的 150，净亏 $350。' },
    { id: 'q405', ch: 4, q: '买入 Call 的到期盈亏图是什么形状？', o: ['行权价以下是水平线（亏损权利金），行权价以上向右上倾斜', '一条向右上倾斜的直线', '倒 V 形', '一条水平线'], a: 0, e: '低于行权价时期权作废，亏损固定为权利金；高于行权价后，标的每涨 $1，每张盈利增加 $100。' },
    // ch5
    { id: 'q501', ch: 5, q: 'Black-Scholes 模型的输入中，无法直接从市场观察到的是？', o: ['波动率', '标的价格', '行权价', '剩余时间'], a: 0, e: '其余输入都能直接得到，波动率只能估计，或者从期权价格反推（隐含波动率）。' },
    { id: 'q502', ch: 5, q: '以下哪一项不是 Black-Scholes 模型的原始假设？', o: ['波动率随行权价不同而不同', '标的价格服从对数正态分布', '没有交易成本', '欧式行权'], a: 0, e: 'BS 假设波动率恒定。现实中不同行权价的 IV 不同（偏斜或微笑），这正是模型的局限之一。' },
    { id: 'q503', ch: 5, q: '对于不派息股票的美式 Call，提前行权通常？', o: ['不划算，其价值等于同条件的欧式 Call', '总是比持有更划算', '必须提前行权', '不允许行权'], a: 0, e: '提前行权会放弃剩余的时间价值。不派息时，直接卖出期权总是不差于提前行权。' },
    { id: 'q504', ch: 5, q: 'S = K = 100，T = 1 年，r = 5%，σ = 20%，无股息。BS 模型下 Call 价格约为？', o: ['$10.45', '$5.57', '$20.00', '$4.88'], a: 0, e: 'Call ≈ 10.45，Put ≈ 5.57，两者之差 4.88 = 100 − 100·e^(−0.05)，符合 Put-Call 平价。' },
    // ch6
    { id: 'q601', ch: 6, q: '平值 Call 的 Delta 大约是？', o: ['0.5', '0', '1', '−0.5'], a: 0, e: '平值 Call 的 Delta 约为 0.5，深度价内趋近 1，深度价外趋近 0。' },
    { id: 'q602', ch: 6, q: '持有 5 张 Delta 为 0.40 的 Call，头寸大约等效于多少股？', o: ['200 股', '2 股', '40 股', '500 股'], a: 0, e: '0.40 × 100 × 5 = 200 股。' },
    { id: 'q603', ch: 6, q: 'Gamma 在什么情况下最大？', o: ['平值附近且临近到期', '深度价内的长期期权', '深度价外的期权', 'Gamma 与时间无关'], a: 0, e: '临近到期的平值期权，Delta 会在 0 和 1 之间快速切换，所以 Gamma 最大。' },
    { id: 'q604', ch: 6, q: '期权买方的 Theta 通常是？', o: ['负值，时间流逝让期权贬值', '正值', '0', '无法确定正负'], a: 0, e: '买方持有的时间价值每天都在衰减，Theta 为负，卖方则为正。' },
    { id: 'q605', ch: 6, q: '某期权 Vega 为 0.12，IV 从 30% 升到 33%，其他不变，每股价格约变化？', o: ['+$0.36', '+$0.12', '+$3.60', '−$0.36'], a: 0, e: 'Vega 表示 IV 每变化 1 个百分点的价格变化：0.12 × 3 = 0.36，每张约 $36。' },
    { id: 'q606', ch: 6, q: 'Put 的 Delta 取值范围是？', o: ['−1 到 0', '0 到 1', '−1 到 1', '0 到 100'], a: 0, e: '标的上涨时 Put 贬值，所以 Delta 为负，范围在 −1 到 0。' },
    { id: 'q607', ch: 6, q: 'Call 价格 $3.00，Delta 0.55。只用 Delta 估算，标的涨 $1 后期权约为？', o: ['$3.55', '$3.00', '$4.00', '$2.45'], a: 0, e: '3.00 + 0.55 = 3.55。考虑 Gamma 后会略高一些。' },
    // ch7
    { id: 'q701', ch: 7, q: '隐含波动率（IV）是？', o: ['由期权市场价格代入模型反推出的波动率', '过去 30 天的实际波动率', '公司公告的波动率', '交易所规定的固定值'], a: 0, e: 'IV 反映的是市场对未来波动的预期，不是历史数据。' },
    { id: 'q702', ch: 7, q: '某股票 IV 为 32%，一个交易日约一个标准差的波动幅度大约是？', o: ['2%', '32%', '0.32%', '8%'], a: 0, e: 'IV / √252 ≈ IV / 16，32% / 16 ≈ 2%。' },
    { id: 'q703', ch: 7, q: 'IV Crush 通常在什么时候发生？', o: ['财报等重大事件公布之后', '重大事件公布之前', '每天开盘时', '不会发生'], a: 0, e: '事件公布后不确定性消失，事件前抬高的 IV 会快速回落。' },
    { id: 'q704', ch: 7, q: '财报前买入 Call，财报后股价小涨，但期权仍然亏损。最可能的原因是？', o: ['IV 回落，Vega 损失超过了 Delta 带来的收益', '期权代码填错', 'Call 的 Gamma 为负', '无风险利率上升'], a: 0, e: '这是典型的 IV Crush。买方 Gamma 为正，利率上升对 Call 反而略有利。' },
    { id: 'q705', ch: 7, q: '股指期权常见的波动率偏斜形态是？', o: ['低行权价 Put 的 IV 通常更高', '高行权价 Call 的 IV 通常更高', '所有行权价的 IV 相同', '没有规律'], a: 0, e: '市场对下跌保护的需求更大，低行权价 Put 的 IV 通常更高。' },
    // ch8
    { id: 'q801', ch: 8, q: '备兑看涨（Covered Call）的构成是？', o: ['持有 100 股 + 卖出 1 张 Call', '买入 Call + 买入 Put', '卖空股票 + 买入 Call', '买入 2 张 Call'], a: 0, e: '用持有的股票为卖出的 Call 做担保，换取权利金，代价是放弃行权价以上的收益。' },
    { id: 'q802', ch: 8, q: '牛市看涨价差：买入 K = 100 Call 付 $4，卖出 K = 110 Call 收 $1.50。每组最大盈利是？', o: ['$750', '$250', '$1,000', '理论上无限'], a: 0, e: '净支出 2.50，最大盈利 = (110 − 100 − 2.5) × 100 = $750。' },
    { id: 'q803', ch: 8, q: '接上题，这个牛市看涨价差每组的最大亏损是？', o: ['$250', '$750', '$400', '$1,000'], a: 0, e: '最大亏损就是净支出：(4 − 1.5) × 100 = $250。' },
    { id: 'q804', ch: 8, q: '买入跨式（Long Straddle）适合什么预期？', o: ['预期大幅波动，但方向不确定', '预期长期横盘', '预期小幅上涨', '预期小幅下跌'], a: 0, e: '同时持有 Call 和 Put，向任一方向大幅波动都可能获利，横盘会亏两份权利金。' },
    { id: 'q805', ch: 8, q: '铁鹰（Iron Condor）卖方的最大盈利是？', o: ['收取的净权利金', '单侧价差宽度', '理论上无限', '0'], a: 0, e: '到期时标的留在两个卖出行权价之间，四腿期权全部作废，保留净权利金。' },
    { id: 'q806', ch: 8, q: '保护性看跌（Protective Put）的作用是？', o: ['为持股设定下跌保护，代价是支付权利金', '增加持股的收入', '放大下跌时的收益', '没有实际作用'], a: 0, e: '股价跌破 Put 行权价后，Put 的收益抵消股票的亏损。' },
    { id: 'q807', ch: 8, q: '现金担保卖 Put 被指派后会发生什么？', o: ['按行权价买入股票（每张 100 股）', '按行权价卖出股票', '收到行权价对应的现金', '合约作废，没有影响'], a: 0, e: 'Put 卖方被指派时，有义务按行权价买入股票，所以需要预留现金。' },
    // ch9
    { id: 'q901', ch: 9, q: '美式期权的卖方什么时候可能被指派？', o: ['到期前任何时候', '只在到期日', '永远不会', '只在除息日'], a: 0, e: '美式期权买方随时可以行权，卖方也就随时可能被指派。' },
    { id: 'q902', ch: 9, q: '按 OCC 的规则，到期时期权会如何处理？', o: ['价内 $0.01 及以上默认自动行权，除非持有人另行指示', '价内 $1 以上才自动行权', '从不自动行权', '只有价外期权会自动行权'], a: 0, e: '这是 OCC 的"例外行权"规则，券商可能还有附加规定。' },
    { id: 'q903', ch: 9, q: '价内 Call 最常在什么时点被提前行权？', o: ['除息日前', '财报公布后', '每月第一天', '每天开盘时'], a: 0, e: '剩余时间价值小于即将派发的股息时，提前行权拿到股息可能更划算。' },
    { id: 'q904', ch: 9, q: 'Pin risk 指的是？', o: ['到期时标的收在行权价附近，难以确定是否会被行权或指派', '买卖价差过大', '利率变化的风险', '标的停牌的风险'], a: 0, e: '收盘价贴近行权价时，买方是否行权不确定，盘后价格变动也可能改变结果。' },
    { id: 'q905', ch: 9, q: '账户只有 $2,000，持有 1 张到期价内的 K = 150 Call 且不处理，可能发生什么？', o: ['自动行权需约 $15,000 买入 100 股，资金不足可能被券商强制处理', '自动获得差价现金，没有其他影响', '合约自动作废', '没有任何影响'], a: 0, e: '个股期权是实物交割，行权要真的买入股票。持有价内期权到期前，要准备好资金或主动平仓。' },
    // ch10
    { id: 'q1001', ch: 10, q: '以下哪项是期权流动性差的典型表现？', o: ['买卖价差宽、未平仓量低', '隐含波动率高', 'Delta 接近 1', '到期时间长'], a: 0, e: '价差宽意味着进出成本高，未平仓量低意味着交易对手少。' },
    { id: 'q1002', ch: 10, q: '交易流动性一般的期权，通常更推荐使用哪种订单？', o: ['限价单', '市价单', '止损市价单', '订单类型没有影响'], a: 0, e: '限价单可以避免在宽价差中以不利价格成交。' },
    { id: 'q1003', ch: 10, q: '关于裸卖 Call 的风险，正确的说法是？', o: ['标的大涨时亏损理论上无限，保证金要求也可能上升', '最大亏损就是权利金', '没有风险', '只有时间价值风险'], a: 0, e: '裸卖 Call 是风险最高的头寸之一，券商通常要求最高级别的期权权限。' },
    { id: 'q1004', ch: 10, q: '期权买方方向判断正确，却仍然亏损。可能的原因是？', o: ['时间价值衰减', '隐含波动率下降', '涨跌幅不足以覆盖权利金', '以上都有可能'], a: 3, noShuffle: true, e: 'Theta、Vega 和盈亏平衡点都会影响结果，光判断对方向是不够的。' },
  ];

  // ---------- generated calculation questions ----------
  const r2 = (v) => Math.round(v * 100) / 100;
  const rnd = (a, b, step) => r2(Math.round((a + Math.random() * (b - a)) / step) * step);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const fmt = (v) => {
    const a = Math.abs(r2(v));
    const d = Number.isInteger(a) ? 0 : 2;
    return a.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  };
  const usd = (v) => (v < 0 ? '−$' : '$') + fmt(v);
  const pl = (v) => (Math.abs(v) < 0.005 ? '$0' : (v > 0 ? '+$' : '−$') + fmt(v));
  let seq = 0;
  const newId = () => 'g' + Date.now().toString(36) + (seq++).toString(36);

  // Builds a 4-option question; dedupes distractors and pads with nearby values if needed.
  function mcq(q, correct, distractors, e, format, padStep) {
    const seen = new Set([format(correct)]);
    const opts = [format(correct)];
    for (const d of distractors) {
      const s = format(r2(d));
      if (!seen.has(s)) { seen.add(s); opts.push(s); }
      if (opts.length === 4) break;
    }
    let k = 1;
    while (opts.length < 4) {
      const s = format(r2(correct + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * padStep));
      if (!seen.has(s)) { seen.add(s); opts.push(s); }
      k++;
    }
    return { id: newId(), ch: 'calc', gen: true, q, o: opts, a: 0, e };
  }

  const generators = [
    function longCallPnl() {
      const K = rnd(20, 200, 5), prem = rnd(0.5, 8, 0.05), qty = pick([1, 2, 3, 5]);
      const ST = r2(K + rnd(-10, 20, 1));
      const intr = Math.max(ST - K, 0);
      const ans = r2((intr - prem) * 100 * qty);
      return mcq(
        `买入 ${qty} 张行权价 $${K} 的 Call，权利金 $${prem.toFixed(2)}。到期标的价格 $${ST}，总盈亏是？`,
        ans,
        [intr * 100 * qty, (intr - prem) * qty, (ST - K - prem) * 100 * qty, (intr - prem) * 100, (intr + prem) * 100 * qty],
        `内在价值 max(${ST} − ${K}, 0) = ${fmt(intr)}；(${fmt(intr)} − ${prem.toFixed(2)}) × 100 × ${qty} = ${pl(ans)}。`,
        pl, 100 * qty
      );
    },
    function shortPutPnl() {
      const K = rnd(20, 200, 5), prem = rnd(0.5, 6, 0.05), qty = pick([1, 2, 3]);
      const ST = r2(K + rnd(-15, 10, 1));
      const intr = Math.max(K - ST, 0);
      const ans = r2((prem - intr) * 100 * qty);
      return mcq(
        `卖出 ${qty} 张行权价 $${K} 的 Put，收取权利金 $${prem.toFixed(2)}。到期标的价格 $${ST}，总盈亏是？`,
        ans,
        [-intr * 100 * qty, prem * 100 * qty, (prem + intr) * 100 * qty, (prem - intr) * qty, -(prem - intr) * 100 * qty],
        `Put 内在价值 max(${K} − ${ST}, 0) = ${fmt(intr)}；卖方盈亏 = (${prem.toFixed(2)} − ${fmt(intr)}) × 100 × ${qty} = ${pl(ans)}。`,
        pl, 100 * qty
      );
    },
    function breakeven() {
      const kinds = [
        ['买入', 'Call', 1], ['卖出', 'Call', 1], ['买入', 'Put', -1], ['卖出', 'Put', -1],
      ];
      const [side, type, sign] = pick(kinds);
      const K = rnd(20, 300, 5), prem = rnd(0.5, 10, 0.05);
      const ans = r2(K + sign * prem);
      return mcq(
        `${side}行权价 $${K} 的 ${type}，权利金 $${prem.toFixed(2)}。到期盈亏平衡点是？`,
        ans,
        [K - sign * prem, K, K + sign * 2 * prem, prem],
        `${type} 的盈亏平衡点 = 行权价 ${sign > 0 ? '+' : '−'} 权利金 = ${K} ${sign > 0 ? '+' : '−'} ${prem.toFixed(2)} = $${ans.toFixed(2)}。买方和卖方的平衡点相同。`,
        (v) => usd(v), 1
      );
    },
    function timeValue() {
      const type = pick(['Call', 'Put']);
      const K = rnd(20, 200, 5);
      const S = r2(K + rnd(-12, 12, 0.5));
      const intr = r2(type === 'Call' ? Math.max(S - K, 0) : Math.max(K - S, 0));
      const tv = rnd(0.3, 5, 0.05);
      const price = r2(intr + tv);
      return mcq(
        `标的价格 $${S}，行权价 $${K} 的 ${type} 报价 $${price.toFixed(2)}。它的时间价值是？`,
        tv,
        [intr, price, price + intr, Math.abs(S - K)],
        `内在价值 = ${type === 'Call' ? `max(${S} − ${K}, 0)` : `max(${K} − ${S}, 0)`} = ${fmt(intr)}；时间价值 = ${price.toFixed(2)} − ${fmt(intr)} = $${tv.toFixed(2)}。`,
        (v) => usd(v), 0.25
      );
    },
    function bullSpread() {
      const K1 = rnd(30, 200, 5), w = pick([5, 10]);
      const p1 = rnd(2, w * 0.7, 0.05);
      const p2 = r2(Math.max(0.1, p1 - rnd(0.5, Math.min(p1 - 0.1, w * 0.6), 0.05)));
      const debit = r2(p1 - p2);
      const askLoss = Math.random() < 0.4;
      const maxP = r2((w - debit) * 100), maxL = r2(debit * 100);
      const ans = askLoss ? maxL : maxP;
      return mcq(
        `牛市看涨价差：买入 K = ${K1} 的 Call 付 $${p1.toFixed(2)}，卖出 K = ${K1 + w} 的 Call 收 $${p2.toFixed(2)}。每组最大${askLoss ? '亏损' : '盈利'}是？`,
        ans,
        askLoss ? [maxP, w * 100, p1 * 100, (w + debit) * 100] : [maxL, w * 100, (w + debit) * 100, p1 * 100],
        `净支出 = ${p1.toFixed(2)} − ${p2.toFixed(2)} = ${debit.toFixed(2)}。最大亏损 = 净支出 × 100 = $${fmt(maxL)}；最大盈利 = (行权价差 ${w} − ${debit.toFixed(2)}) × 100 = $${fmt(maxP)}。`,
        (v) => usd(v), 50
      );
    },
    function contractCost() {
      const prem = rnd(0.2, 15, 0.05), qty = pick([1, 2, 3, 4, 5, 10]);
      const ans = r2(prem * 100 * qty);
      return mcq(
        `期权报价 $${prem.toFixed(2)}，买入 ${qty} 张需要支付多少权利金（不含费用）？`,
        ans,
        [prem * qty, prem * 10 * qty, prem * 1000 * qty, prem * 100],
        `期权按每股报价，1 张 = 100 股：${prem.toFixed(2)} × 100 × ${qty} = $${fmt(ans)}。`,
        (v) => usd(v), 100
      );
    },
    function positionDelta() {
      const delta = rnd(0.1, 0.9, 0.05), qty = pick([1, 2, 3, 4, 5, 10]);
      const isPut = Math.random() < 0.5;
      const short = Math.random() < 0.4;
      const d = isPut ? -delta : delta;
      const ans = Math.round(d * 100 * qty * (short ? -1 : 1));
      const f = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(Math.round(v)) + ' 股';
      return mcq(
        `${short ? '卖出' : '买入'} ${qty} 张 Delta 为 ${d.toFixed(2)} 的 ${isPut ? 'Put' : 'Call'}，头寸 Delta 约等效于多少股？`,
        ans,
        [-ans, d * qty * (short ? -1 : 1), ans / qty, d * 100 * (short ? -1 : 1) * qty * 10],
        `头寸 Delta = ${d.toFixed(2)} × 100 × ${qty} × ${short ? '(−1，卖出)' : '(+1，买入)'} = ${f(ans)}。正数相当于持有多头股票，负数相当于空头。`,
        f, 10
      );
    },
  ];

  function generate(n) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(generators[i % generators.length]());
    // shuffle order so types are mixed
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  OA.questions = { bank, generate, generators };
})(typeof window !== 'undefined' ? window : globalThis);
