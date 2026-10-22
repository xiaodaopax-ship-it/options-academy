// Course content: US equity options. Plain HTML strings, rendered as-is (trusted, bundled content).
(function (root) {
  'use strict';
  const OA = (root.OA = root.OA || {});

  OA.lessons = [
    {
      id: 1,
      title: '期权是什么',
      summary: '权利与义务、Call 与 Put、四种基本头寸',
      html: `
<p>期权（Option）是一份<strong>标准化合约</strong>。买方支付一笔费用，叫<b>权利金</b>（Premium），换来一项<strong>权利</strong>：在约定日期或之前，按约定价格买入或卖出某个资产。约定价格叫<b>行权价</b>（Strike），这个资产叫<b>标的</b>。买方可以不行使这项权利。卖方收下权利金，承担对应的<strong>义务</strong>。</p>
<h3>两种期权</h3>
<ul>
<li><b>看涨期权 Call</b>：按行权价<strong>买入</strong>标的的权利。</li>
<li><b>看跌期权 Put</b>：按行权价<strong>卖出</strong>标的的权利。</li>
</ul>
<div class="tip"><b>类比</b>：Put 有点像给股票买保险。付一笔保费，股价跌破某个价格时，你仍能按约定价卖出。这只是帮助理解，期权和保险在法律与定价上都不同。</div>
<h3>四种基本头寸</h3>
<table>
<thead><tr><th>头寸</th><th>观点</th><th>最大盈利</th><th>最大亏损</th></tr></thead>
<tbody>
<tr><td>买入 Call</td><td>看涨</td><td>理论上无限</td><td>权利金</td></tr>
<tr><td>卖出 Call</td><td>不涨</td><td>权利金</td><td>理论上无限（未持股时）</td></tr>
<tr><td>买入 Put</td><td>看跌</td><td>行权价 − 权利金（标的跌到 0）</td><td>权利金</td></tr>
<tr><td>卖出 Put</td><td>不跌</td><td>权利金</td><td>行权价 − 权利金（标的跌到 0）</td></tr>
</tbody>
</table>
<p class="small muted">表中金额按每股计，美股期权一张合约再乘以 100。</p>
<p>注意这里的不对称：买方的最大亏损是确定的，就是权利金；卖方的最大盈利是确定的，也是权利金。卖方用有限的收益换取承担较大的风险，所以券商会要求卖方缴纳保证金或用持股、现金做担保。</p>
<h3>期权常见的用途</h3>
<ul>
<li><b>方向性交易</b>：用较少资金表达看涨或看跌观点。这是杠杆，亏损同样会被放大。</li>
<li><b>对冲</b>：为已有持仓设置保护。</li>
<li><b>增加收入</b>：在持股上卖出 Call，收取权利金。</li>
<li><b>交易波动率</b>：不判断方向，只判断波动会变大还是变小。</li>
</ul>
<a class="try" href="#/sim?t=long_call">在模拟器里看买入 Call 的盈亏 →</a>`,
    },
    {
      id: 2,
      title: '美股期权合约要素',
      summary: '乘数、到期日、美式与欧式、期权代码、价内价外',
      html: `
<h3>合约乘数</h3>
<p>标准美股期权<strong>1 张合约对应 100 股</strong>。期权按每股报价：报价 $2.50 表示每张合约权利金为 2.50 × 100 = <b>$250</b>。</p>
<h3>标的</h3>
<p>常见标的有个股（AAPL、MSFT）、ETF（SPY、QQQ）和指数（SPX、NDX）。</p>
<h3>到期日</h3>
<ul>
<li>标准月度合约在每月<b>第三个星期五</b>到期。</li>
<li>很多标的还有周度合约。SPY、QQQ、SPX 等热门标的每个交易日都有合约到期，0DTE（当天到期）指的就是这类合约。</li>
</ul>
<h3>行权方式与交割</h3>
<table>
<thead><tr><th></th><th>个股 / ETF 期权</th><th>SPX 等指数期权</th></tr></thead>
<tbody>
<tr><td>行权方式</td><td>美式：到期前任意交易日可行权</td><td>欧式：只能在到期时行权</td></tr>
<tr><td>交割</td><td>实物交割（交付股票）</td><td>现金交割（按差价结算）</td></tr>
</tbody>
</table>
<h3>期权代码（OCC 格式）</h3>
<p>例如 <code>AAPL261218C00200000</code>：</p>
<ul>
<li><code>AAPL</code>：标的</li>
<li><code>261218</code>：到期日 2026-12-18（YYMMDD）</li>
<li><code>C</code>：Call（Put 为 <code>P</code>）</li>
<li><code>00200000</code>：行权价 × 1000，即 $200.000</li>
</ul>
<h3>价内、平值、价外</h3>
<table>
<thead><tr><th></th><th>Call</th><th>Put</th></tr></thead>
<tbody>
<tr><td>价内 ITM</td><td>标的价 &gt; 行权价</td><td>标的价 &lt; 行权价</td></tr>
<tr><td>平值 ATM</td><td colspan="2">标的价 ≈ 行权价</td></tr>
<tr><td>价外 OTM</td><td>标的价 &lt; 行权价</td><td>标的价 &gt; 行权价</td></tr>
</tbody>
</table>
<h3>怎么看期权链</h3>
<ul>
<li><b>Bid / Ask</b>：买价和卖价，两者的差就是价差，它是隐性交易成本。</li>
<li><b>Last</b>：最近成交价。流动性差时可能已经过时。</li>
<li><b>Volume</b>：当日成交量。</li>
<li><b>Open Interest</b>：未平仓合约数，衡量这个合约的存量规模。</li>
<li><b>IV、Delta</b>：隐含波动率和 Delta，后面章节会讲。</li>
</ul>
<div class="tip">券商通常按级别审批期权交易权限，例如先开放备兑和现金担保卖 Put，再开放买入期权、价差，最后才是裸卖。具体级别以券商规定为准。</div>`,
    },
    {
      id: 3,
      title: '内在价值与时间价值',
      summary: '权利金的构成、影响期权价格的因素、Put-Call 平价',
      html: `
<div class="formula">权利金 = 内在价值 + 时间价值</div>
<h3>内在价值</h3>
<ul>
<li>Call：max(标的价 − 行权价, 0)</li>
<li>Put：max(行权价 − 标的价, 0)</li>
</ul>
<p>例：标的 $105，行权价 $100 的 Call 报价 $7.20。内在价值 = 5，时间价值 = 7.20 − 5 = <b>2.20</b>。</p>
<p>同一行权价的 Put 报价 $1.80：它是价外期权，内在价值为 0，$1.80 全部是时间价值。</p>
<h3>时间价值</h3>
<p>时间价值反映"到期前还可能变得更有利"的可能性。越临近到期，时间价值越少，到期那一刻归零。衰减不是匀速的：平值期权在最后几周衰减最快。</p>
<h3>影响期权价格的因素</h3>
<table>
<thead><tr><th>因素（单独上升）</th><th>Call</th><th>Put</th></tr></thead>
<tbody>
<tr><td>标的价格</td><td>↑</td><td>↓</td></tr>
<tr><td>行权价</td><td>↓</td><td>↑</td></tr>
<tr><td>剩余时间</td><td>通常 ↑</td><td>通常 ↑</td></tr>
<tr><td>波动率</td><td>↑</td><td>↑</td></tr>
<tr><td>无风险利率</td><td>↑</td><td>↓</td></tr>
<tr><td>股息</td><td>↓</td><td>↑</td></tr>
</tbody>
</table>
<p class="small muted">股息的影响来自除息日股价会下调约等于股息的金额。</p>
<h3>Put-Call 平价</h3>
<p>对于同一标的、同一行权价、同一到期日的欧式期权（无股息）：</p>
<div class="formula">C − P = S − K·e<sup>−rT</sup></div>
<p>它说明 Call 和 Put 的价格不是相互独立的。如果偏离太多，就会出现无风险套利机会，市场会很快把它拉回来。</p>
<a class="try" href="#/sim">打开计算器，调整剩余天数看时间价值的变化 →</a>`,
    },
    {
      id: 4,
      title: '到期盈亏图',
      summary: '四种基本头寸的到期盈亏与盈亏平衡点',
      html: `
<p>盈亏图的横轴是到期时标的价格，纵轴是盈亏，这是理解任何期权策略的起点。</p>
<h3>买入 Call</h3>
<div class="formula">盈亏 = (max(S<sub>T</sub> − K, 0) − 权利金) × 100 × 张数</div>
<p>盈亏平衡点 = 行权价 + 权利金。</p>
<p>例：买入 1 张 K = 100 的 Call，权利金 $3。</p>
<ul>
<li>到期 S<sub>T</sub> = 110：(10 − 3) × 100 = <b class="pos">+$700</b></li>
<li>到期 S<sub>T</sub> = 95：期权作废，亏损权利金 <b class="neg">−$300</b></li>
<li>盈亏平衡点：$103</li>
</ul>
<h3>买入 Put</h3>
<p>盈亏平衡点 = 行权价 − 权利金。</p>
<p>例：买入 K = 50 的 Put，权利金 $2。平衡点 $48；到期 S<sub>T</sub> = 40 时，盈利 (10 − 2) × 100 = <b class="pos">+$800</b>。</p>
<h3>卖出 Call / 卖出 Put</h3>
<p>卖方的盈亏图就是买方的镜像。</p>
<ul>
<li>卖出 Call 平衡点 = 行权价 + 权利金</li>
<li>卖出 Put 平衡点 = 行权价 − 权利金</li>
</ul>
<p>例：卖出 K = 60 的 Put，收取 $1.50。到期 S<sub>T</sub> = 55 时，亏损 (5 − 1.5) × 100 = <b class="neg">−$350</b>。</p>
<div class="tip">盈亏图只描述<strong>到期那一刻</strong>。到期前期权还有时间价值，实际盈亏曲线会更平滑。模拟器里的虚线就是"到期前某一天"的理论盈亏。</div>
<a class="try" href="#/sim?t=long_put">买入 Put →</a>
<a class="try" href="#/sim?t=cash_secured_put">卖出 Put →</a>
<a class="try" href="#/sim?t=short_call">卖出 Call →</a>`,
    },
    {
      id: 5,
      title: 'Black-Scholes 与定价直觉',
      summary: '模型输入、假设与局限、美式期权',
      html: `
<p>Black-Scholes（BS）模型给出欧式期权的理论价格。不需要会推导，但要知道它的输入和局限。</p>
<h3>六个输入</h3>
<ul>
<li>S：标的价格</li>
<li>K：行权价</li>
<li>T：剩余时间（年）</li>
<li>r：无风险利率</li>
<li>q：股息率</li>
<li>σ：波动率</li>
</ul>
<p>前五个都能直接观察到，<strong>只有波动率不能</strong>。所以期权交易在很大程度上是在交易"对未来波动的预期"。</p>
<div class="formula">C = S·e<sup>−qT</sup>·N(d<sub>1</sub>) − K·e<sup>−rT</sup>·N(d<sub>2</sub>)<br>P = K·e<sup>−rT</sup>·N(−d<sub>2</sub>) − S·e<sup>−qT</sup>·N(−d<sub>1</sub>)</div>
<p class="small muted">d<sub>1</sub> = [ln(S/K) + (r − q + σ²/2)T] / (σ√T)，d<sub>2</sub> = d<sub>1</sub> − σ√T，N(·) 为标准正态分布函数。</p>
<p>例：S = K = 100，T = 1 年，r = 5%，σ = 20%，无股息。Call ≈ <b>$10.45</b>，Put ≈ <b>$5.57</b>，可以用 Put-Call 平价验证。</p>
<h3>主要假设与局限</h3>
<ul>
<li>标的价格服从对数正态分布，波动率恒定。现实中不同行权价的隐含波动率不同（波动率偏斜或微笑）。</li>
<li>没有交易成本，可以连续交易。</li>
<li>欧式行权。美股个股期权是美式的。</li>
</ul>
<h3>美式期权怎么办</h3>
<p>不派息股票的美式 Call，提前行权不会比继续持有或直接卖出更好，所以它的价值等于欧式 Call。美式 Put 和派息股票的 Call 可能存在提前行权价值，价格会略高于 BS 结果。实务中常用二叉树等方法定价。</p>
<a class="try" href="#/sim">打开单个期权计算器 →</a>`,
    },
    {
      id: 6,
      title: '希腊字母 Greeks',
      summary: 'Delta、Gamma、Theta、Vega、Rho',
      html: `
<p>Greeks 衡量期权价格对各个因素的敏感度，是管理期权风险的核心工具。</p>
<h3>Delta Δ：对标的价格的敏感度</h3>
<ul>
<li>标的涨 $1，期权价格大约变化 Delta。</li>
<li>Call 的 Delta 在 0 到 1 之间，Put 在 −1 到 0 之间。平值期权约为 ±0.5。</li>
<li>头寸 Delta = Delta × 100 × 张数，可以理解为等效股数。持有 5 张 Delta 0.40 的 Call ≈ 持有 200 股。</li>
<li>Delta 有时被粗略当作"到期价内概率"的参考。这只是近似，并不严格。</li>
</ul>
<h3>Gamma Γ：Delta 的变化速度</h3>
<ul>
<li>标的涨 $1，Delta 大约变化 Gamma。</li>
<li>平值附近、临近到期时 Gamma 最大，此时 Delta 变化剧烈。</li>
<li>买入期权的 Gamma 为正，卖出为负。</li>
</ul>
<h3>Theta Θ：时间衰减</h3>
<ul>
<li>其他条件不变，每过一天期权价格的变化。</li>
<li>买方 Theta 通常为负，卖方为正。Theta −0.05 意味着每张每天约损失 $5。</li>
</ul>
<h3>Vega ν：对波动率的敏感度</h3>
<ul>
<li>隐含波动率每变化 1 个百分点，期权价格的变化。</li>
<li>剩余时间越长，Vega 越大。</li>
<li>例：Vega 0.12，IV 从 30% 升到 33%，价格约 +0.36，每张约 +$36。</li>
</ul>
<h3>Rho ρ：对利率的敏感度</h3>
<p>短期期权里通常影响最小，长期期权（LEAPS）里才比较明显。</p>
<h3>组合起来估算</h3>
<p>Call 价格 $3.00，Delta 0.55，Gamma 0.04。标的涨 $1：</p>
<ul>
<li>只用 Delta：≈ 3.00 + 0.55 = $3.55</li>
<li>加上 Gamma 修正：≈ 3.00 + 0.55 + ½ × 0.04 = $3.57</li>
</ul>
<div class="tip"><b>Gamma 与 Theta 的权衡</b>：买方享受正 Gamma（大波动时有利），代价是每天支付 Theta；卖方每天收 Theta，但承担负 Gamma，大波动时会受伤。</div>
<a class="try" href="#/sim?t=long_straddle">看跨式的 Greeks →</a>`,
    },
    {
      id: 7,
      title: '隐含波动率 IV',
      summary: '历史波动率与隐含波动率、预期波动、IV Crush、偏斜',
      html: `
<h3>两种波动率</h3>
<ul>
<li><b>历史波动率（HV）</b>：根据过去的价格算出来的实际波动。</li>
<li><b>隐含波动率（IV）</b>：把期权的市场价格代入定价模型，反推出来的波动率，代表市场对未来波动的预期。</li>
</ul>
<h3>IV 的直观含义</h3>
<p>IV 是年化数值。用 IV / √252 ≈ IV / 16 粗估一个交易日约一个标准差的波动幅度。</p>
<p>例：IV 32% → 日波动约 2%。</p>
<p>对一段时间的预期波动（约一个标准差）：</p>
<div class="formula">S × IV × √(天数 / 365)</div>
<p>例：S = $100，IV = 32%，30 天：100 × 0.32 × √(30/365) ≈ $9.2，即约 ±$9.2。这是基于正态近似的粗估。</p>
<h3>IV Crush</h3>
<p>财报、重要发布会等事件前，不确定性高，IV 往往上升。事件公布后不确定性消失，IV 会快速回落。期权买方即使方向判断对了，也可能因为 IV 下降（Vega 损失）而亏钱。</p>
<h3>IV Rank / IV Percentile</h3>
<p>单看 IV 数值不知道它是高还是低。IV Rank 把当前 IV 放在过去一年的区间中比较，帮助判断它相对自己历史水平的位置。</p>
<h3>波动率偏斜</h3>
<p>同一到期日、不同行权价的 IV 并不相同。股指期权通常是低行权价的 Put IV 更高，反映市场对下跌保护的需求。</p>
<a class="try" href="#/sim">在计算器里由市场价反推 IV →</a>`,
    },
    {
      id: 8,
      title: '常见策略',
      summary: '备兑、保护性 Put、价差、跨式、铁鹰、蝶式',
      html: `
<p>多个期权（和股票）组合起来，可以塑造出想要的盈亏形状。下面每个策略都可以在模拟器里直接打开。</p>
<h3>收入与保护</h3>
<table>
<thead><tr><th>策略</th><th>构成</th><th>适用观点</th></tr></thead>
<tbody>
<tr><td><a href="#/sim?t=covered_call">备兑 Covered Call</a></td><td>持 100 股 + 卖 1 张价外 Call</td><td>温和看涨或横盘，愿意封顶上涨</td></tr>
<tr><td><a href="#/sim?t=protective_put">保护性 Put</a></td><td>持 100 股 + 买 1 张 Put</td><td>持股但担心下跌</td></tr>
<tr><td><a href="#/sim?t=cash_secured_put">现金担保卖 Put</a></td><td>卖 Put + 预留行权所需现金</td><td>愿意在更低价格买入股票</td></tr>
</tbody>
</table>
<h3>垂直价差</h3>
<p>买卖同一到期日、不同行权价的同类期权，成本和风险都有限。</p>
<p>例：<a href="#/sim?t=bull_call_spread">牛市看涨价差</a>。买 K = 100 Call 付 $4，卖 K = 110 Call 收 $1.50。</p>
<ul>
<li>净支出 = $2.50</li>
<li>最大盈利 = (10 − 2.5) × 100 = <b class="pos">$750</b></li>
<li>最大亏损 = <b class="neg">$250</b></li>
<li>平衡点 = $102.50</li>
</ul>
<p>同理还有<a href="#/sim?t=bear_put_spread">熊市看跌价差</a>（支出型）和<a href="#/sim?t=bull_put_spread">牛市看跌价差</a>（收入型）。</p>
<h3>波动率策略</h3>
<ul>
<li><a href="#/sim?t=long_straddle">买入跨式</a>：同时买平值 Call 和 Put。押注大幅波动，方向不限，但需要波动覆盖两份权利金。</li>
<li><a href="#/sim?t=long_strangle">买入宽跨式</a>：用价外 Call 和价外 Put，更便宜，需要更大的波动。</li>
</ul>
<h3>区间策略</h3>
<p><a href="#/sim?t=iron_condor">铁鹰 Iron Condor</a>：卖 95 Put（收 1.20）、买 90 Put（付 0.50）、卖 105 Call（收 1.10）、买 110 Call（付 0.40）。</p>
<ul>
<li>净收入 $1.40 → 最大盈利 <b class="pos">$140</b></li>
<li>最大亏损 = (5 − 1.4) × 100 = <b class="neg">$360</b></li>
<li>盈亏平衡点 $93.60 和 $106.40</li>
</ul>
<p><a href="#/sim?t=long_butterfly">蝶式</a>：成本低，到期价格越接近中间行权价，收益越高，盈利区间窄。</p>
<div class="tip">策略的盈亏形状只是一面。还要看胜率、盈亏比、交易成本（多腿意味着多次价差），以及提前指派的可能。</div>`,
    },
    {
      id: 9,
      title: '行权、指派与到期',
      summary: '自动行权、提前指派、Pin risk、资金准备',
      html: `
<h3>行权与指派</h3>
<p>买方提出行权后，OCC（美国期权清算公司）会把行权随机分配给持有空头头寸的券商，券商再按自己的规则分配给客户。这叫<b>指派</b>（Assignment）。</p>
<ul>
<li>美式期权的卖方<strong>在到期前任何时候都可能被指派</strong>。</li>
<li>被指派 Call：按行权价卖出 100 股/张（没有持股则形成空头股票头寸）。</li>
<li>被指派 Put：按行权价买入 100 股/张。</li>
</ul>
<h3>到期自动行权</h3>
<p>按 OCC 的"例外行权"规则，到期时价内 $0.01 及以上的期权默认自动行权，除非持有人另行指示。券商可能有自己的附加规定。</p>
<h3>提前行权的常见情形</h3>
<ul>
<li>价内 Call 在<b>除息日前</b>，剩余时间价值小于即将派发的股息时。</li>
<li>深度价内 Put，时间价值接近 0 时。</li>
</ul>
<h3>Pin risk</h3>
<p>到期时标的收盘价非常接近行权价，卖方难以确定会不会被指派。到期日收盘后，持有人通常仍有一段时间提交行权或放弃指示，盘后价格变动可能带来意外的行权或指派结果（截止时间以券商为准）。</p>
<h3>资金准备</h3>
<p>账户只有 $2,000，却持有 1 张到期价内的 K = 150 Call。自动行权需要约 150 × 100 = <b>$15,000</b> 买入股票。资金不足时，券商可能在到期前强制平仓，或在行权后强制卖出。</p>
<div class="tip">多数散户更常见的做法是<strong>在到期前平仓</strong>，而不是持有到期行权。</div>`,
    },
    {
      id: 10,
      title: '风险管理与实务',
      summary: '仓位、流动性、订单类型、交易计划',
      html: `
<h3>仓位与杠杆</h3>
<ul>
<li>期权的杠杆意味着标的小幅不利波动，就可能让权利金损失很大比例，甚至全部。</li>
<li>控制单笔交易的最大可能亏损占账户的比例，并提前定好这个上限。</li>
</ul>
<h3>流动性</h3>
<ul>
<li>优先选择买卖价差窄、未平仓量大的合约。</li>
<li>价差本身就是成本：Bid 1.00 / Ask 1.20，买入后立刻按 Bid 卖出，每张损失 $20。</li>
<li>更推荐使用<b>限价单</b>，避免市价单在宽价差中成交在不利价格。</li>
</ul>
<h3>卖方风险</h3>
<ul>
<li>裸卖 Call 在标的大涨时亏损理论上无限。</li>
<li>市场剧烈波动时保证金要求可能上升，可能导致追加保证金或被强制平仓。</li>
</ul>
<h3>事件风险</h3>
<p>财报、FDA 决定、宏观数据公布等事件可能造成跳空，也会伴随 IV 的大幅变化。</p>
<h3>交易成本</h3>
<p>佣金通常按每张合约收费，多腿策略要付多次佣金和多次价差。</p>
<h3>写一份交易计划</h3>
<ol>
<li>入场理由：方向、波动率，还是时间？</li>
<li>最大可承受亏损与止损条件</li>
<li>止盈目标</li>
<li>到期前怎么处理：平仓、展期还是持有</li>
</ol>
<h3>建议的学习路径</h3>
<p>先学概念，再刷题，然后在模拟器里看懂盈亏和 Greeks，再用券商模拟账户练实盘流程。准备充分后，再考虑小仓位尝试。</p>
<div class="tip">本应用仅用于学习，内容不构成任何投资建议。</div>`,
    },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
