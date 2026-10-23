// App shell: hash router, views, local persistence.
(function () {
  'use strict';
  const OA = window.OA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const view = $('#view');
  const titleEl = $('#title');
  const backBtn = $('#backBtn');
  const APP = '期权学堂';
  const ST = OA.strategy;
  const MK = ST.markets;

  // ---------- storage ----------
  const KEY = 'options-academy.v1';
  const defaults = () => ({ read: {}, answered: {}, wrong: [], wrongGen: [], genStats: { n: 0, c: 0 }, track: 'us', simMarket: 'us', sims: {} });
  let store = (() => {
    try {
      const s = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}'));
      // migrate v1 single-market simulator state
      if (s.sim && !s.sims.us) s.sims.us = s.sim;
      delete s.sim;
      return s;
    } catch (e) { return defaults(); }
  })();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage full or disabled */ }
  }

  // ---------- helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v, d = 2) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const signed = (v, d = 2) => (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), d);
  const opt = (val, label, cur) => `<option value="${val}"${String(val) === String(cur) ? ' selected' : ''}>${label}</option>`;
  // Market-aware number formatting
  function fmt(mk) {
    const c = mk.cur;
    const amtDp = (v) => (Math.abs(v) >= 1000 ? 0 : 2);
    return {
      px: (v) => (v < 0 ? '−' : '') + c + num(Math.abs(v), mk.dp),
      money: (v) => (v < 0 ? '−' : '') + c + num(Math.abs(v), amtDp(v)),
      pl: (v) => (Math.abs(v) < 0.005 ? c + '0' : (v > 0 ? '+' : '−') + c + num(Math.abs(v), amtDp(v))),
      inVal: (v) => String(ST.roundTo(v, mk.dp)),
    };
  }

  let backHandler = null;
  function setHeader(title, back) {
    titleEl.textContent = title;
    document.title = title === APP ? APP : title + ' · ' + APP;
    backHandler = back || null;
    backBtn.hidden = !back;
  }
  backBtn.addEventListener('click', () => backHandler && backHandler());

  function setTab(name) {
    $$('.tabbar a').forEach((a) => (a.dataset.tab === name ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  }
  const go = (hash) => { location.hash = hash; };
  let onResize = null;

  function segHtml(items, cur, label) {
    return `<div class="seg" role="tablist" aria-label="${label}">${items.map(([k, t]) => `<button role="tab" data-seg="${k}" aria-selected="${k === cur}">${t}</button>`).join('')}</div>`;
  }
  function bindSeg(host, onPick) {
    $$('[data-seg]', host).forEach((b) => (b.onclick = () => {
      $$('[data-seg]', host).forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      onPick(b.dataset.seg);
    }));
  }

  // ---------- router ----------
  function route() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    const params = new URLSearchParams(qs || '');
    const name = parts[0] || 'learn';
    onResize = null;
    const routes = { learn: renderLearn, lesson: renderLesson, quiz: renderQuizHome, sim: renderSim, me: renderMe, glossary: renderGlossary };
    (routes[name] || renderLearn)(parts.slice(1), params);
    window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', route);
  // Tapping the active tab again (e.g. mid-quiz) should return to that tab's home.
  $$('.tabbar a').forEach((a) => a.addEventListener('click', () => {
    if (location.hash === a.getAttribute('href')) route();
  }));
  window.addEventListener('resize', () => onResize && onResize());

  // ---------- learn ----------
  const lessonsOf = (track) => OA.lessons.filter((l) => l.track === track);

  const lessonItem = (l) => `<li><a class="list-item" href="#/lesson/${l.id}">
    <span class="num" aria-hidden="true">${l.no}</span>
    <span class="grow"><strong>${esc(l.title)}</strong><span class="small muted block">${esc(l.summary)}</span></span>
    ${store.read[l.id] ? '<span class="check" aria-label="已完成">✓</span>' : ''}
  </a></li>`;

  function renderLearn() {
    setHeader(APP);
    setTab('learn');
    const all = OA.lessons;
    const done = all.filter((l) => store.read[l.id]).length;
    const nextL = all.find((l) => !store.read[l.id]);
    view.innerHTML = `
<section class="card hero">
  <h2>期权学习路线</h2>
  <p class="muted">共 ${all.length} 章：先学通用概念和美股实务，再学 A 股 ETF 期权的规则。每章配练习题，策略可以直接在模拟器里试。</p>
  <div class="progress" role="progressbar" aria-label="学习进度" aria-valuemin="0" aria-valuemax="${all.length}" aria-valuenow="${done}"><div style="width:${(done / all.length) * 100}%"></div></div>
  <p class="small muted">已完成 ${done} / ${all.length} 章</p>
  ${nextL ? `<a class="btn primary block" href="#/lesson/${nextL.id}">${done ? '继续学习' : '开始学习'}：第 ${nextL.no} 章 ${esc(nextL.title)}</a>` : '<p class="small">全部章节已学完，可以去题库巩固。</p>'}
  <a class="btn block" href="#/glossary">📚 术语表：${(OA.glossary || []).length} 个术语的大白话解释</a>
</section>
${OA.tracks.map((t) => {
    const L = lessonsOf(t.id);
    const d = L.filter((l) => store.read[l.id]).length;
    return `<h3 class="section-title">${esc(t.title)} <span class="small">${d}/${L.length}</span></h3>
<p class="small muted part-desc">${esc(t.desc)}</p>
<ol class="list">${L.map(lessonItem).join('')}</ol>`;
  }).join('')}`;
  }

  function renderLesson(args) {
    const l = OA.lessons.find((x) => x.id === Number(args[0]));
    if (!l) return go('#/learn');
    const L = OA.lessons;
    const idx = L.indexOf(l);
    const prev = L[idx - 1], next = L[idx + 1];
    setHeader(`第 ${l.no} 章 · ${l.track === 'cn' ? 'A股ETF' : '基础与美股'}`, () => go('#/learn'));
    setTab('learn');
    const qs = OA.questions.bank.filter((q) => q.ch === l.id);
    view.innerHTML = `
<article class="card lesson"><h2>${esc(l.title)}</h2>
  ${l.easy ? `<section class="easy" aria-label="大白话"><p class="easy-tag">💡 大白话</p>${l.easy}</section>` : ''}
  <p class="small muted term-hint">文中带下划线的词，点一下就能看解释。</p>
  ${l.html}
  ${l.cases ? `<section class="cases" aria-label="案例"><h3>📖 案例</h3>${l.cases}</section>` : ''}
</article>
<div class="btn-row">
  ${qs.length ? `<button class="btn" id="practice">本章练习（${qs.length} 题）</button>` : ''}
  <button class="btn primary" id="done">${store.read[l.id] ? '已学完 ✓ 下一章' : '标记已学完'}</button>
</div>
<nav class="pager" aria-label="章节导航">
  ${prev ? `<a href="#/lesson/${prev.id}">‹ ${esc(prev.title)}</a>` : '<span></span>'}
  ${next ? `<a href="#/lesson/${next.id}">${esc(next.title)} ›</a>` : '<span></span>'}
</nav>`;
    $('#done').onclick = () => {
      store.read[l.id] = true;
      save();
      go(next ? '#/lesson/' + next.id : '#/learn');
    };
    if (qs.length) $('#practice').onclick = () => startQuiz(() => qs, `第 ${l.no} 章练习`, () => renderLesson(args));
    linkTerms($('.lesson'));
  }

  // ---------- glossary ----------
  const gloss = OA.glossary || [];
  // Longest patterns first so "Covered Call" wins over "Call", "买卖价差" over "价差".
  const NO_AUTO_LINK = new Set(['期权']); // too common to underline in every lesson
  const glossPatterns = gloss
    .flatMap((g, i) => (NO_AUTO_LINK.has(g.term) ? [] : [g.term, ...g.aliases].map((p) => ({ p, i }))))
    .sort((a, b) => b.p.length - a.p.length);
  const SKIP = new Set(['CODE', 'A', 'BUTTON', 'H2', 'H3', 'H4', 'TH', 'SCRIPT']);
  const isAscii = (s) => /^[\x20-\x7e]+$/.test(s);
  // For each pattern, the longer glossary patterns that contain it (e.g. 行权 -> 行权价)
  const longerOf = new Map(glossPatterns.map(({ p }) => [p, glossPatterns.map((x) => x.p).filter((q) => q.length > p.length && q.includes(p))]));
  function insideLonger(t, at, p) {
    return longerOf.get(p).some((q) => {
      for (let o = q.indexOf(p); o >= 0; o = q.indexOf(p, o + 1)) if (t.substr(at - o, q.length) === q) return true;
      return false;
    });
  }

  // Wrap the first occurrence of each glossary term in a tappable button.
  function linkTerms(rootEl) {
    if (!rootEl || !gloss.length) return;
    const used = new Set();
    const accept = (node) => {
      for (let el = node.parentElement; el && el !== rootEl; el = el.parentElement) {
        if (SKIP.has(el.tagName) || el.classList.contains('formula') || el.classList.contains('term')) return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    };
    for (const { p, i } of glossPatterns) {
      if (used.has(i)) continue;
      const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, { acceptNode: accept });
      let node;
      while ((node = walker.nextNode())) {
        const t = node.nodeValue;
        let at = t.indexOf(p);
        // ASCII terms must not sit inside a longer word (e.g. "Put" in "Output").
        const bad = (k) => insideLonger(t, k, p) ||
          (isAscii(p) && (/[A-Za-z0-9]/.test(t[k - 1] || '') || /[A-Za-z0-9]/.test(t[k + p.length] || '')));
        while (at >= 0 && bad(at)) at = t.indexOf(p, at + 1);
        if (at < 0) continue;
        const after = node.splitText(at);
        after.splitText(p.length);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'term';
        btn.dataset.g = String(i);
        btn.setAttribute('aria-haspopup', 'dialog');
        btn.textContent = p;
        after.parentNode.replaceChild(btn, after);
        used.add(i);
        break;
      }
    }
  }

  const sheet = $('#termSheet');
  function openTerm(i) {
    const g = gloss[i];
    if (!g || !sheet) return;
    $('#termTitle').textContent = g.term + (g.aliases.length ? `（${g.aliases.join(' / ')}）` : '');
    $('#termDef').textContent = g.def;
    if (sheet.showModal) sheet.showModal(); else sheet.setAttribute('open', '');
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.term');
    if (b) openTerm(Number(b.dataset.g));
  });
  if (sheet) {
    $('#termClose').addEventListener('click', () => sheet.close ? sheet.close() : sheet.removeAttribute('open'));
    sheet.addEventListener('click', (e) => { if (e.target === sheet && sheet.close) sheet.close(); }); // tap backdrop
  }

  function renderGlossary() {
    setHeader('术语表', () => go('#/learn'));
    setTab('learn');
    view.innerHTML = `
<section class="card">
  <label class="field"><span>搜索术语</span><input type="search" id="gq" placeholder="例如：保证金、Delta、价外" autocomplete="off"></label>
  <p class="small muted">共 ${gloss.length} 个常用术语，每个都用一两句话解释。</p>
</section>
<dl class="gloss" id="glist"></dl>`;
    const list = $('#glist'), q = $('#gq');
    const draw = () => {
      const k = q.value.trim().toLowerCase();
      const hits = gloss.filter((g) => !k || [g.term, ...g.aliases, g.def].some((s) => s.toLowerCase().includes(k)));
      list.innerHTML = hits.length
        ? hits.map((g) => `<div class="gloss-item"><dt>${esc(g.term)}${g.aliases.length ? ` <span class="small muted">${esc(g.aliases.join(' / '))}</span>` : ''}</dt><dd>${esc(g.def)}</dd></div>`).join('')
        : '<p class="small muted">没有找到相关术语。</p>';
    };
    q.addEventListener('input', draw);
    draw();
  }

  // ---------- quiz ----------
  const bankById = Object.fromEntries(OA.questions.bank.map((q) => [q.id, q]));
  function chapterName(ch) {
    if (ch === 'calc') return '计算题 · 美股';
    if (ch === 'calc-cn') return '计算题 · A股';
    const l = OA.lessons.find((x) => x.id === ch);
    return l ? `第 ${l.no} 章` : '';
  }
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function prepare(q) {
    const idx = q.o.map((_, k) => k);
    if (!q.noShuffle) shuffle(idx);
    return Object.assign({}, q, { opts: idx.map((k) => q.o[k]), ans: idx.indexOf(q.a) });
  }
  function record(q, ok) {
    if (q.gen) {
      store.genStats.n++;
      if (ok) {
        store.genStats.c++;
        store.wrongGen = store.wrongGen.filter((x) => x.id !== q.id);
      } else if (!store.wrongGen.some((x) => x.id === q.id)) {
        store.wrongGen.push({ id: q.id, ch: q.ch, q: q.q, o: q.o, a: q.a, e: q.e, gen: true });
        if (store.wrongGen.length > 50) store.wrongGen.shift();
      }
    } else {
      store.answered[q.id] = { c: ok };
      if (ok) store.wrong = store.wrong.filter((x) => x !== q.id);
      else if (!store.wrong.includes(q.id)) store.wrong.push(q.id);
    }
    save();
  }
  function quizStats() {
    const ids = Object.keys(store.answered);
    const n = ids.length + store.genStats.n;
    const c = ids.filter((k) => store.answered[k].c).length + store.genStats.c;
    return { n, c, wrong: store.wrong.length + store.wrongGen.length };
  }
  const wrongList = () => [...store.wrong.map((id) => bankById[id]).filter(Boolean), ...store.wrongGen];
  // Mixed calc drill: alternate US and CN generators
  function mixedCalc(n) {
    const us = OA.questions.generate(Math.ceil(n / 2)), cn = OA.questions.generateCn(Math.floor(n / 2));
    return shuffle(us.concat(cn));
  }

  function renderQuizHome() {
    setHeader('题库');
    setTab('quiz');
    const bank = OA.questions.bank;
    const st = quizStats();
    const wrongN = wrongList().length;
    const chapterRow = (l) => {
      const qs = bank.filter((q) => q.ch === l.id);
      if (!qs.length) return '';
      const done = qs.filter((q) => store.answered[q.id]).length;
      return `<li><button class="list-item" data-ch="${l.id}">
      <span class="num" aria-hidden="true">${l.no}</span>
      <span class="grow"><strong>${esc(l.title)}</strong><span class="small muted block">${qs.length} 题 · 已做 ${done}</span></span>
      <span aria-hidden="true" class="muted">›</span></button></li>`;
    };
    view.innerHTML = `
<section class="card"><div class="stats3">
  <div><b>${st.n}</b><span>已答题次</span></div>
  <div><b>${st.n ? Math.round((st.c / st.n) * 100) : 0}%</b><span>正确率</span></div>
  <div><b>${wrongN}</b><span>错题</span></div>
</div></section>
<div class="tiles">
  <button class="tile" id="qRandom"><strong>随机 10 题</strong><span>全部 ${bank.length} 道概念题中抽取</span></button>
  <button class="tile" id="qCalc"><strong>计算题训练</strong><span>美股 + A股，随机生成</span></button>
  <button class="tile" id="qWrong"${wrongN ? '' : ' disabled'}><strong>错题本</strong><span>${wrongN ? wrongN + ' 道，答对自动移出' : '暂无错题'}</span></button>
  <button class="tile" id="qAll"><strong>全部概念题</strong><span>${bank.length} 道，按章节顺序</span></button>
</div>
${OA.tracks.map((t) => `<h3 class="section-title">${esc(t.title)}</h3><ul class="list">${lessonsOf(t.id).map(chapterRow).join('')}</ul>`).join('')}`;
    const home = () => renderQuizHome();
    const ordered = () => OA.lessons.flatMap((l) => bank.filter((q) => q.ch === l.id));
    $('#qRandom').onclick = () => startQuiz(() => shuffle(bank.slice()).slice(0, 10), '随机 10 题', home);
    $('#qCalc').onclick = () => startQuiz(() => mixedCalc(10), '计算题训练', home);
    $('#qWrong').onclick = () => startQuiz(wrongList, '错题本', home);
    $('#qAll').onclick = () => startQuiz(ordered, '全部概念题', home);
    $$('[data-ch]').forEach((b) => (b.onclick = () => {
      const ch = Number(b.dataset.ch);
      startQuiz(() => bank.filter((q) => q.ch === ch), `${chapterName(ch)}练习`, home);
    }));
  }

  function startQuiz(factory, title, onBack) {
    const list = factory();
    if (!list.length) return onBack();
    const qs = list.map(prepare);
    let i = 0, right = 0;

    function show() {
      setHeader(title, onBack);
      const q = qs[i];
      view.innerHTML = `
<p class="small muted">第 ${i + 1} / ${qs.length} 题 · ${chapterName(q.ch)}</p>
<div class="progress thin" aria-hidden="true"><div style="width:${(i / qs.length) * 100}%"></div></div>
<section class="card">
  <p class="q" id="qText">${esc(q.q)}</p>
  <div class="opts" role="group" aria-labelledby="qText">
    ${q.opts.map((o, k) => `<button class="opt" data-k="${k}"><span class="key" aria-hidden="true">${'ABCD'[k]}</span><span>${esc(o)}</span></button>`).join('')}
  </div>
  <div id="fb" aria-live="polite"></div>
</section>`;
      $$('.opt').forEach((b) => (b.onclick = () => answer(Number(b.dataset.k))));
      window.scrollTo(0, 0);
    }

    function answer(k) {
      const q = qs[i];
      const ok = k === q.ans;
      if (ok) right++;
      record(q, ok);
      $$('.opt').forEach((b, j) => {
        b.disabled = true;
        if (j === q.ans) { b.classList.add('correct'); b.setAttribute('aria-label', '正确答案：' + q.opts[j]); }
        else if (j === k) { b.classList.add('wrong'); b.setAttribute('aria-label', '你的选择：' + q.opts[j]); }
      });
      $('#fb').innerHTML = `
<div class="feedback ${ok ? 'ok' : 'no'}"><strong>${ok ? '回答正确' : '回答错误，正确答案是 ' + 'ABCD'[q.ans]}</strong><p>${esc(q.e)}</p></div>
<button class="btn primary block" id="next">${i + 1 < qs.length ? '下一题' : '查看结果'}</button>`;
      const nextBtn = $('#next');
      nextBtn.onclick = () => { i++; if (i < qs.length) show(); else finish(); };
      nextBtn.focus({ preventScroll: true });
      nextBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function finish() {
      setHeader(title, onBack);
      const pct = Math.round((right / qs.length) * 100);
      view.innerHTML = `
<section class="card center">
  <p class="muted">本轮结果</p>
  <h2 class="score">${right} / ${qs.length}</h2>
  <p class="muted">正确率 ${pct}%</p>
  <p>${pct >= 80 ? '掌握得不错，可以继续下一章或去模拟器动手。' : '建议回看相关章节，再刷一遍错题本。'}</p>
</section>
<div class="btn-row">
  <button class="btn" id="again">再来一轮</button>
  <button class="btn primary" id="back">返回</button>
</div>`;
      $('#again').onclick = () => startQuiz(factory, title, onBack);
      $('#back').onclick = onBack;
    }
    show();
  }

  // ---------- simulator ----------
  function defaultSim(market) {
    const mk = MK[market], d = mk.defaults;
    const s = {
      market, mode: 'strategy', tpl: 'long_call', S: d.S, iv: d.iv, r: d.r, q: d.q, days: d.days, whatDays: 0, ivShift: 0, legs: [],
      calc: { type: 'call', S: d.S, K: ST.roundStrike(d.S, 0, market), days: d.days, iv: d.iv, r: d.r, q: d.q, mkt: '' },
    };
    s.legs = ST.template(s.tpl, envOf(s), market);
    return s;
  }
  function envOf(p) {
    return { S: p.S, sigma: Math.max(p.iv, 0.1) / 100, r: p.r / 100, q: p.q / 100, T: Math.max(p.days, 0) / 365, mult: MK[p.market].mult };
  }
  function loadSim(market) {
    const base = defaultSim(market);
    const saved = store.sims[market];
    const sim = saved && Array.isArray(saved.legs)
      ? Object.assign(base, saved, { market, calc: Object.assign(base.calc, saved.calc) })
      : base;
    store.sims[market] = sim;
    return sim;
  }

  function renderSim(args, params) {
    const pm = params.get('m');
    if (pm && MK[pm]) store.simMarket = pm;
    else if (params.get('t')) store.simMarket = 'us'; // US lesson links carry no market
    const market = MK[store.simMarket] ? store.simMarket : 'us';
    const sim = loadSim(market);
    const t = params.get('t');
    if (t && ST.templates[t]) {
      sim.mode = 'strategy';
      sim.tpl = t;
      sim.whatDays = 0;
      sim.ivShift = 0;
      sim.legs = ST.template(t, envOf(sim), market);
    }
    if (params.toString()) history.replaceState(null, '', '#/sim');
    save();

    setHeader('模拟器');
    setTab('sim');
    view.innerHTML = `
<div id="mkSeg">${segHtml([['us', '美股'], ['cn', 'A股ETF']], market, '市场')}</div>
<div id="modeSeg">${segHtml([['strategy', '策略模拟'], ['calc', '单个期权计算器']], sim.mode, '模拟器模式')}</div>
<div id="simBody"></div>`;
    bindSeg($('#mkSeg'), (m) => { store.simMarket = m; save(); renderSim([], new URLSearchParams()); });
    bindSeg($('#modeSeg'), (m) => { sim.mode = m; save(); body(); });
    const body = () => (sim.mode === 'calc' ? renderCalc(sim) : renderStrategy(sim));
    body();
  }

  const numField = (attr, key, label, val, step) =>
    `<label class="field"><span>${label}</span><input type="number" inputmode="decimal" ${attr}="${key}" value="${val}" step="${step}" min="0"></label>`;

  function renderStrategy(sim) {
    const mk = MK[sim.market], F = fmt(mk), cn = sim.market === 'cn';
    const strikeStepIn = cn ? 0.05 : 0.5, premStep = cn ? 0.0001 : 0.01, spotStep = cn ? 0.001 : 0.5;
    const host = $('#simBody');
    host.innerHTML = `
<section class="card">
  <label class="field"><span>策略模板</span>
    <select id="tpl">${Object.keys(ST.templates).map((k) => opt(k, esc(ST.templateName(k, sim.market)), sim.tpl)).join('')}${opt('custom', '自定义', sim.tpl)}</select>
  </label>
  <p class="small muted" id="tplDesc"></p>
</section>
<section class="card">
  <h3>市场参数</h3>
  <div class="grid2">
    ${numField('data-p', 'S', `${cn ? 'ETF' : '标的'}价格 (${mk.cur})`, sim.S, spotStep)}
    ${numField('data-p', 'iv', '隐含波动率 (%)', sim.iv, 1)}
    ${numField('data-p', 'days', '到期天数', sim.days, 1)}
    ${numField('data-p', 'r', '无风险利率 (%)', sim.r, 0.1)}
    ${numField('data-p', 'q', '股息率 (%)', sim.q, 0.1)}
  </div>
</section>
<section class="card">
  <h3>持仓 <span class="small muted">1 张 = ${num(mk.mult, 0)} ${mk.unit}</span></h3>
  <div id="legs"></div>
  <div class="btn-row">
    <button class="btn" id="addLeg">+ 添加一腿</button>
    <button class="btn" id="reprice">按理论价重算</button>
  </div>
</section>
<section class="card">
  <h3>盈亏图</h3>
  <div class="chart-wrap"><canvas id="chart" role="img" aria-label="策略盈亏图"></canvas></div>
  <p class="small readout" id="readout">点按或拖动图表，查看任意价格下的盈亏。</p>
  <p class="legend small"><span class="lg exp" aria-hidden="true"></span>到期盈亏　<span class="lg now" aria-hidden="true"></span>第 <b id="wdLabel"></b> 天理论盈亏　<span class="lg spot" aria-hidden="true"></span>当前价</p>
  <label class="field"><span>时间推移：距今 <output id="wdOut"></output> 天</span>
    <input type="range" id="whatDays" min="0" max="${sim.days}" step="1" value="${Math.min(sim.whatDays, sim.days)}"></label>
  <label class="field"><span>IV 变化：<output id="ivOut"></output></span>
    <input type="range" id="ivShift" min="-20" max="20" step="1" value="${sim.ivShift}"></label>
</section>
<section class="card"><h3>分析</h3><div id="stats"></div></section>
<p class="note small muted">理论价基于 Black-Scholes 模型（欧式、连续股息率）。${cn ? 'A 股 ETF 期权本身是欧式的。保证金按交易所最低标准估算，用理论价代替前结算价，券商实际收取通常更高。' : '美式期权的实际价格可能略高。'}结果未计入佣金和买卖价差。仅用于学习，不构成投资建议。</p>`;

    const legsEl = $('#legs'), tplSel = $('#tpl'), wd = $('#whatDays'), ivs = $('#ivShift');
    const canvas = $('#chart'), readout = $('#readout');
    const env = () => envOf(sim);
    let cursor = null, chartApi = null, chartData = null;
    const persist = () => save();
    const roundP = (v) => ST.roundTo(v, mk.dp);

    function showDesc() {
      const t = ST.templates[sim.tpl];
      $('#tplDesc').textContent = t ? `${t.desc} 适用观点：${t.view}。` : '自定义组合：可自由添加、删除和修改每一腿。';
    }
    function setCustom() {
      sim.tpl = 'custom';
      tplSel.value = 'custom';
      showDesc();
    }
    function repriceAuto() {
      const e = env();
      sim.legs.forEach((l) => { if (l.auto) l.premium = roundP(ST.theoPrice(l, e)); });
      $$('.leg', legsEl).forEach((div) => {
        const l = sim.legs[Number(div.dataset.i)];
        const inp = $('[data-f="premium"]', div);
        if (l && l.auto && inp && document.activeElement !== inp) inp.value = F.inVal(l.premium);
      });
    }

    function legHtml(l, i) {
      const stock = l.type === 'stock';
      const priceLabel = stock ? (l.side > 0 ? '买入价' : '卖出价') : '权利金';
      const sideNames = cn ? (stock ? ['买入', '卖出'] : ['买入开仓', '卖出开仓']) : ['买入', '卖出'];
      return `
<div class="leg ${l.side > 0 ? 'long' : 'short'}" data-i="${i}">
  <div class="leg-row">
    <span class="leg-no" aria-hidden="true">${i + 1}</span>
    <select data-f="side" aria-label="第 ${i + 1} 腿方向">${opt(1, sideNames[0], l.side)}${opt(-1, sideNames[1], l.side)}</select>
    <select data-f="type" aria-label="第 ${i + 1} 腿类型">${opt('call', mk.callName, l.type)}${opt('put', mk.putName, l.type)}${opt('stock', mk.underlying, l.type)}</select>
    <button class="icon-btn del" data-act="del" aria-label="删除第 ${i + 1} 腿">✕</button>
  </div>
  <div class="leg-row">
    ${stock ? '' : `<label class="mini"><span>行权价</span><input type="number" inputmode="decimal" step="${strikeStepIn}" min="0" data-f="strike" value="${l.strike}"></label>`}
    <label class="mini"><span>${stock ? mk.lotLabel : '张数'}</span><input type="number" inputmode="numeric" step="1" min="1" data-f="qty" value="${l.qty}"></label>
    <label class="mini"><span>${priceLabel} <em class="badge" data-badge>${l.auto ? '理论' : '手动'}</em></span><input type="number" inputmode="decimal" step="${premStep}" min="0" data-f="premium" value="${F.inVal(l.premium)}"></label>
  </div>
</div>`;
    }
    function renderLegs() {
      legsEl.innerHTML = sim.legs.length ? sim.legs.map(legHtml).join('') : '<p class="small muted">还没有持仓。点击“添加一腿”，或选择一个策略模板。</p>';
    }

    legsEl.addEventListener('input', (e) => {
      const el = e.target, f = el.dataset.f;
      if (!f || el.tagName === 'SELECT') return;
      const leg = sim.legs[Number(el.closest('.leg').dataset.i)];
      const v = parseFloat(el.value);
      if (!isFinite(v) || v < 0) return;
      if (f === 'qty') { if (v < 1) return; leg.qty = Math.round(v); }
      else if (f === 'strike') { if (v <= 0) return; leg.strike = v; }
      else if (f === 'premium') {
        leg.premium = v;
        leg.auto = false;
        $('[data-badge]', el.closest('.leg')).textContent = '手动';
      }
      if (f !== 'premium') repriceAuto();
      update();
      persist();
    });
    legsEl.addEventListener('change', (e) => {
      const el = e.target;
      if (el.tagName !== 'SELECT') return;
      const leg = sim.legs[Number(el.closest('.leg').dataset.i)];
      if (el.dataset.f === 'side') leg.side = Number(el.value);
      if (el.dataset.f === 'type') {
        leg.type = el.value;
        if (leg.type === 'stock') leg.strike = 0;
        else if (!leg.strike) leg.strike = ST.roundStrike(sim.S, 0, sim.market);
        leg.auto = true;
      }
      setCustom();
      repriceAuto();
      renderLegs();
      update();
      persist();
    });
    legsEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act="del"]');
      if (!b) return;
      sim.legs.splice(Number(b.closest('.leg').dataset.i), 1);
      setCustom();
      renderLegs();
      update();
      persist();
    });

    tplSel.onchange = () => {
      sim.tpl = tplSel.value;
      if (sim.tpl !== 'custom') sim.legs = ST.template(sim.tpl, env(), sim.market);
      showDesc();
      renderLegs();
      update();
      persist();
    };
    $('#addLeg').onclick = () => {
      const leg = { type: 'call', side: 1, strike: ST.roundStrike(sim.S, 0, sim.market), qty: 1, premium: 0, auto: true };
      leg.premium = roundP(ST.theoPrice(leg, env()));
      sim.legs.push(leg);
      setCustom();
      renderLegs();
      update();
      persist();
    };
    $('#reprice').onclick = () => {
      sim.legs.forEach((l) => (l.auto = true));
      repriceAuto();
      renderLegs();
      update();
      persist();
    };

    $$('[data-p]', host).forEach((inp) => inp.addEventListener('input', () => {
      const k = inp.dataset.p, v = parseFloat(inp.value);
      if (!isFinite(v) || v < 0) return;
      if ((k === 'S' || k === 'iv') && v <= 0) return;
      sim[k] = k === 'days' ? Math.round(v) : v;
      if (k === 'days') {
        wd.max = String(sim.days);
        if (sim.whatDays > sim.days) { sim.whatDays = sim.days; wd.value = String(sim.days); }
      }
      repriceAuto();
      update();
      persist();
    }));
    wd.addEventListener('input', () => { sim.whatDays = Number(wd.value); update(); persist(); });
    ivs.addEventListener('input', () => { sim.ivShift = Number(ivs.value); update(); persist(); });

    function curveParams() {
      return { tLeft: Math.max(sim.days - sim.whatDays, 0) / 365, sig: Math.max(sim.iv + sim.ivShift, 1) / 100 };
    }
    function showCursor() {
      if (cursor == null || !sim.legs.length) return;
      const e = env(), c = curveParams();
      const a = ST.pnl(sim.legs, cursor, 0, e.r, e.sigma, e.q, e.mult);
      const b = ST.pnl(sim.legs, cursor, c.tLeft, e.r, c.sig, e.q, e.mult);
      readout.innerHTML = `标的 <b>${F.px(cursor)}</b>：到期 <b class="${a >= 0 ? 'pos' : 'neg'}">${F.pl(a)}</b>，第 ${sim.whatDays} 天理论 <b class="${b >= 0 ? 'pos' : 'neg'}">${F.pl(b)}</b>`;
    }
    function draw() {
      if (!chartData) return;
      chartData.cursor = cursor;
      chartApi = OA.chart.draw(canvas, chartData);
    }
    function pointer(e) {
      if (!chartApi) return;
      const rect = canvas.getBoundingClientRect();
      cursor = ST.roundTo(chartApi.priceAt(e.clientX - rect.left), mk.dp === 4 ? 3 : 2);
      draw();
      showCursor();
    }
    canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); pointer(e); });
    canvas.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'mouse') pointer(e); });
    onResize = draw;

    function update() {
      $('#wdOut').textContent = sim.whatDays;
      $('#wdLabel').textContent = sim.whatDays;
      $('#ivOut').textContent = `${sim.ivShift > 0 ? '+' : ''}${sim.ivShift} 个百分点（IV ${Math.max(sim.iv + sim.ivShift, 1)}%）`;
      const stats = $('#stats');
      if (!sim.legs.length) {
        chartData = null;
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        stats.innerHTML = '<p class="small muted">添加持仓后显示分析结果。</p>';
        return;
      }
      const e = env(), c = curveParams();
      const strikes = sim.legs.filter((l) => l.type !== 'stock').map((l) => l.strike);
      const lo = Math.max(0, Math.min(sim.S * 0.7, ...strikes.map((k) => k * 0.9)));
      const hi = Math.max(sim.S * 1.3, ...strikes.map((k) => k * 1.1));
      const N = 200, xs = [];
      for (let i = 0; i <= N; i++) xs.push(lo + ((hi - lo) * i) / N);
      const exp = xs.map((x) => ST.pnl(sim.legs, x, 0, e.r, e.sigma, e.q, e.mult));
      const now = xs.map((x) => ST.pnl(sim.legs, x, c.tLeft, e.r, c.sig, e.q, e.mult));
      const a = ST.analyze(sim.legs, e);
      chartData = {
        xs, S: sim.S, marks: a.breakevens, cur: mk.cur,
        series: [{ ys: exp, color: '--chart-exp', dash: false }, { ys: now, color: '--chart-now', dash: true }],
      };
      if (cursor != null && (cursor < lo || cursor > hi)) cursor = null;
      draw();
      if (cursor != null) showCursor();
      else readout.textContent = '点按或拖动图表，查看任意价格下的盈亏。';

      const g = a.greeks;
      const maxP = a.maxProfit === Infinity ? '理论无限' : F.pl(a.maxProfit);
      const maxL = a.maxLoss === -Infinity ? '理论无限' : F.pl(a.maxLoss);
      const bes = a.breakevens.length ? a.breakevens.map((b) => F.px(b)).join('、') : '无';
      canvas.setAttribute('aria-label', `策略盈亏图。最大盈利 ${maxP}，最大亏损 ${maxL}，盈亏平衡点 ${bes}。`);
      const rows = [
        [a.net >= 0 ? '净收入' : '净支出', F.money(Math.abs(a.net)), a.net >= 0 ? `开仓时收到的权利金（${mk.underlying}腿按买入金额计为支出）` : `开仓时付出的资金（含${mk.underlying}腿）`],
        ['最大盈利', maxP, '到期时'],
        ['最大亏损', maxL, '到期时'],
        ['盈亏平衡点', bes, '到期时'],
        ['理论盈利概率', a.pop == null ? '—' : (a.pop * 100).toFixed(1) + '%', '对数正态、风险中性假设下的估算'],
      ];
      if (cn) {
        const m = ST.cnMargin(sim.legs, e);
        if (m.naked || m.covered) {
          rows.push(['卖出开仓保证金', m.naked ? F.money(m.total) : F.money(0),
            `交易所最低标准估算${m.covered ? `；其中 ${m.covered} 张认购由持有的 ETF 备兑，不需现金保证金` : ''}${m.naked > 1 ? '；未计组合保证金优惠' : ''}`]);
        }
      }
      const grows = [
        ['Delta', signed(g.delta, cn ? 0 : 1) + ' ' + mk.unit, `标的涨 ${mk.cur}1，组合约变化 ${F.pl(g.delta)}`],
        ['Gamma', signed(g.gamma, cn ? 0 : 2) + ' ' + mk.unit, `标的涨 ${mk.cur}1，Delta 的变化`],
        ['Theta', F.pl(g.theta) + ' / 天', '其他不变，每过一天的价值变化'],
        ['Vega', F.pl(g.vega) + ' / 1%', 'IV 每升 1 个百分点的价值变化'],
      ];
      if (cn) grows[0][2] = `标的涨 ¥0.01，组合约变化 ${F.pl(g.delta * 0.01)}`;
      if (cn) grows[1][2] = '标的涨 ¥0.01，Delta 约变化 ' + signed(g.gamma * 0.01, 0) + ' 份';
      const tbl = (rs) => `<table class="kv">${rs.map(([k, v, h]) => `<tr><th scope="row">${k}</th><td><b>${v}</b><span class="small muted block">${h}</span></td></tr>`).join('')}</table>`;
      stats.innerHTML = tbl(rows) + '<h4>组合 Greeks（当前）</h4>' + tbl(grows);
    }

    showDesc();
    renderLegs();
    update();
  }

  function renderCalc(sim) {
    const c = sim.calc, mk = MK[sim.market], F = fmt(mk), cn = sim.market === 'cn';
    const host = $('#simBody');
    const spotStep = cn ? 0.001 : 0.5, kStep = cn ? 0.05 : 0.5, pStep = cn ? 0.0001 : 0.01;
    host.innerHTML = `
<section class="card">
  <h3>参数</h3>
  <div class="grid2">
    <label class="field"><span>类型</span><select data-c="type">${opt('call', mk.callName, c.type)}${opt('put', mk.putName, c.type)}</select></label>
    ${numField('data-c', 'S', `${cn ? 'ETF' : '标的'}价格 (${mk.cur})`, c.S, spotStep)}
    ${numField('data-c', 'K', `行权价 (${mk.cur})`, c.K, kStep)}
    ${numField('data-c', 'days', '到期天数', c.days, 1)}
    ${numField('data-c', 'iv', '波动率 (%)', c.iv, 1)}
    ${numField('data-c', 'r', '无风险利率 (%)', c.r, 0.1)}
    ${numField('data-c', 'q', '股息率 (%)', c.q, 0.1)}
  </div>
</section>
<section class="card"><h3>理论价与 Greeks</h3><div id="calcOut" aria-live="polite"></div></section>
<section class="card">
  <h3>由市场价反推隐含波动率</h3>
  ${numField('data-c', 'mkt', `期权市场价（每${mk.unit} ${mk.cur}）`, c.mkt, pStep)}
  <p id="ivRes" aria-live="polite"></p>
</section>
<p class="note small muted">Black-Scholes 欧式模型。Theta 按日历日计，Vega 和 Rho 按 1 个百分点计。仅用于学习。</p>`;

    function out() {
      const BS = OA.bs;
      const T = Math.max(c.days, 0) / 365, sig = Math.max(c.iv, 0.1) / 100, r = c.r / 100, q = c.q / 100;
      const p = BS.price(c.type, c.S, c.K, T, r, sig, q);
      const intr = BS.intrinsic(c.type, c.S, c.K);
      const g = BS.greeks(c.type, c.S, c.K, T, r, sig, q);
      const money = c.type === 'call' ? (c.S > c.K ? '实值（价内）' : c.S < c.K ? '虚值（价外）' : '平值') : (c.S < c.K ? '实值（价内）' : c.S > c.K ? '虚值（价外）' : '平值');
      const d = cn ? 4 : 3;
      const rows = [
        ['理论价', `${F.px(p)} / ${mk.unit}`, `每张 ${F.money(p * mk.mult)} · ${money}`],
        ['内在价值', F.px(intr), ''],
        ['时间价值', F.px(p - intr), p - intr < -0.00005 ? '欧式深度实值认沽的时间价值可能为负' : ''],
        ['Delta', signed(g.delta, 3), `标的涨 ${mk.cur}1，期权价格约变化（每${mk.unit}）`],
        ['Gamma', num(g.gamma, 4), `标的涨 ${mk.cur}1，Delta 约变化`],
        ['Theta', signed(g.theta, d), `每过一天，每${mk.unit}价格约变化；每张 ${F.pl(g.theta * mk.mult)}`],
        ['Vega', signed(g.vega, d), `IV 升 1 个百分点，每${mk.unit}价格约变化；每张 ${F.pl(g.vega * mk.mult)}`],
        ['Rho', signed(g.rho, d), `利率升 1 个百分点，每${mk.unit}价格约变化`],
      ];
      $('#calcOut').innerHTML = `<table class="kv">${rows.map(([k, v, h]) => `<tr><th scope="row">${k}</th><td><b>${v}</b>${h ? `<span class="small muted block">${h}</span>` : ''}</td></tr>`).join('')}</table>`;
      const m = parseFloat(c.mkt);
      const res = $('#ivRes');
      if (!(m > 0)) res.innerHTML = `<span class="small muted">输入期权的市场报价（每${mk.unit}），计算它隐含的波动率。</span>`;
      else if (!(T > 0)) res.textContent = '到期天数需大于 0。';
      else {
        const iv = BS.impliedVol(c.type, m, c.S, c.K, T, r, q);
        res.innerHTML = isFinite(iv)
          ? `隐含波动率 ≈ <b>${(iv * 100).toFixed(2)}%</b><span class="small muted block">把它填进上面的“波动率”，理论价就会等于市场价。</span>`
          : '该价格超出模型可解范围（可能低于内在价值下限或过高），请检查输入。';
      }
    }

    $$('[data-c]', host).forEach((el) => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
      const k = el.dataset.c;
      if (k === 'type') c.type = el.value;
      else if (k === 'mkt') c.mkt = el.value;
      else {
        const v = parseFloat(el.value);
        if (!isFinite(v) || v < 0) return;
        if ((k === 'S' || k === 'K' || k === 'iv') && v <= 0) return;
        c[k] = k === 'days' ? Math.round(v) : v;
      }
      save();
      out();
    }));
    out();
  }

  // ---------- me ----------
  function renderMe() {
    setHeader('我的');
    setTab('me');
    const st = quizStats();
    const done = OA.lessons.filter((l) => store.read[l.id]).length;
    view.innerHTML = `
<section class="card"><div class="stats3">
  <div><b>${done}/${OA.lessons.length}</b><span>已学章节</span></div>
  <div><b>${st.n}</b><span>已答题次</span></div>
  <div><b>${st.n ? Math.round((st.c / st.n) * 100) : 0}%</b><span>正确率</span></div>
</div></section>
<section class="card">
  <h3>添加到手机桌面</h3>
  <ul class="small">
    <li>iPhone（Safari）：点底部“分享”按钮 → “添加到主屏幕”。</li>
    <li>Android（Chrome）：点右上角菜单 → “添加到主屏幕”或“安装应用”。</li>
  </ul>
  <p class="small muted">通过 HTTPS 访问时支持离线使用。</p>
</section>
<section class="card">
  <h3>数据</h3>
  <p class="small">学习进度、答题记录和模拟器设置只保存在本机浏览器里，不会上传。清除浏览器数据会一并清除这些记录。</p>
  <button class="btn danger" id="reset">清除全部学习记录</button>
</section>
<p class="note small muted">本应用仅用于学习期权知识。内容和计算结果均不构成投资建议。期权交易存在亏损全部本金乃至更多的风险。规则以交易所和券商最新规定为准。</p>`;
    $('#reset').onclick = () => {
      if (!confirm('确定清除全部学习进度、答题记录和模拟器设置吗？此操作无法撤销。')) return;
      store = defaults();
      save();
      renderMe();
    };
  }

  // ---------- boot ----------
  if (!location.hash) history.replaceState(null, '', '#/learn');
  route();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
