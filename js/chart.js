// Minimal canvas line chart for P/L curves.
(function (root) {
  'use strict';
  const OA = (root.OA = root.OA || {});

  function niceStep(range, n) {
    const raw = range / n;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / mag;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
  }
  function ticks(min, max, n) {
    const st = niceStep(max - min || 1, n);
    const out = [];
    for (let v = Math.ceil(min / st) * st; v <= max + 1e-9; v += st) out.push(Math.round(v * 1e6) / 1e6);
    return out;
  }
  function short(v) {
    const a = Math.abs(v);
    const s = a >= 1000 ? (a / 1000).toFixed(a >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(Math.round(a));
    return (v < 0 ? '−' : '') + '$' + s;
  }

  // d = { xs, series: [{ ys, color, dash }], S, marks: [x...], cursor: x|null }
  function draw(canvas, d) {
    const dpr = root.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return null;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const css = getComputedStyle(document.documentElement);
    const c = (n) => css.getPropertyValue(n).trim();
    const pad = { l: 52, r: 10, t: 10, b: 24 };

    let ymin = 0, ymax = 0;
    for (const s of d.series) for (const y of s.ys) { if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
    if (ymax - ymin < 1) { ymax += 1; ymin -= 1; }
    const span = ymax - ymin;
    ymax += span * 0.08;
    ymin -= span * 0.08;
    const x0 = d.xs[0], x1 = d.xs[d.xs.length - 1];
    const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    const X = (v) => pad.l + ((v - x0) / (x1 - x0)) * pw;
    const Y = (v) => pad.t + ((ymax - v) / (ymax - ymin)) * ph;

    ctx.font = '11px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.lineWidth = 1;
    // grid + labels
    ctx.strokeStyle = c('--chart-grid');
    ctx.fillStyle = c('--muted');
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const t of ticks(ymin, ymax, 5)) {
      const y = Math.round(Y(t)) + 0.5;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
      ctx.fillText(short(t), pad.l - 6, y);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const t of ticks(x0, x1, Math.max(3, Math.floor(pw / 70)))) {
      const x = Math.round(X(t)) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + ph); ctx.stroke();
      ctx.fillText('$' + t, x, pad.t + ph + 6);
    }

    // profit / loss fill under the first series
    const main = d.series[0];
    if (main) {
      const y0 = Y(0);
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(X(d.xs[0]), y0);
        d.xs.forEach((x, i) => ctx.lineTo(X(x), Y(main.ys[i])));
        ctx.lineTo(X(x1), y0);
        ctx.closePath();
      };
      ctx.save(); ctx.beginPath(); ctx.rect(pad.l, pad.t, pw, y0 - pad.t); ctx.clip();
      path(); ctx.fillStyle = c('--good-fill'); ctx.fill(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(pad.l, y0, pw, pad.t + ph - y0); ctx.clip();
      path(); ctx.fillStyle = c('--bad-fill'); ctx.fill(); ctx.restore();
    }

    // zero line
    ctx.strokeStyle = c('--chart-zero');
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.l, Y(0)); ctx.lineTo(w - pad.r, Y(0)); ctx.stroke();

    // current price marker
    if (d.S >= x0 && d.S <= x1) {
      ctx.strokeStyle = c('--muted');
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(d.S), pad.t); ctx.lineTo(X(d.S), pad.t + ph); ctx.stroke();
      ctx.setLineDash([]);
    }

    // series (draw in reverse so the expiry line sits on top)
    for (const s of d.series.slice().reverse()) {
      ctx.strokeStyle = c(s.color);
      ctx.lineWidth = 2;
      ctx.setLineDash(s.dash ? [6, 4] : []);
      ctx.beginPath();
      d.xs.forEach((x, i) => (i ? ctx.lineTo(X(x), Y(s.ys[i])) : ctx.moveTo(X(x), Y(s.ys[i]))));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // breakeven marks
    ctx.fillStyle = c('--text');
    for (const m of d.marks || []) {
      if (m < x0 || m > x1) continue;
      ctx.beginPath(); ctx.arc(X(m), Y(0), 3.5, 0, Math.PI * 2); ctx.fill();
    }

    // cursor
    if (d.cursor != null && d.cursor >= x0 && d.cursor <= x1) {
      ctx.strokeStyle = c('--accent');
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(d.cursor), pad.t); ctx.lineTo(X(d.cursor), pad.t + ph); ctx.stroke();
    }

    return {
      priceAt: (px) => Math.min(x1, Math.max(x0, x0 + ((px - pad.l) / pw) * (x1 - x0))),
    };
  }

  OA.chart = { draw };
})(typeof window !== 'undefined' ? window : globalThis);
