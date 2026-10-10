/* Charts: one function per chart. Every value comes from window.FINDINGS.
   Each chart function draws its final state into `plot` and returns
   { intro(gsap) } — the optional entrance, only called when motion is allowed. */
(function () {
  'use strict';

  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- shared helpers (also used by main.js) ---------- */

  // Path lookup: "a.b.c". In arrays, a segment matches an index or an item's `key`.
  function get(obj, path) {
    return path.split('.').reduce(function (node, seg) {
      if (node == null) return undefined;
      if (Array.isArray(node)) {
        if (/^\d+$/.test(seg)) return node[Number(seg)];
        return node.find(function (x) { return x && x.key === seg; });
      }
      return node[seg];
    }, obj);
  }

  const fmt = {
    pct0: function (v) { return Math.round(v) + '%'; },
    pct1: function (v) { return v.toFixed(1) + '%'; },
    int: function (v) { return String(Math.round(v)); },
    'int,': function (v) { return Math.round(v).toLocaleString('en-US'); },
    // odds ratios: two significant figures, so 0.98 stays 0.98 and 2.42 reads 2.4
    or: function (v) { return v.toPrecision(2); },
    // one decimal, trailing ".0" dropped: 2.6 days, 3 days, 15.2
    d1: function (v) { return String(Number(v.toFixed(1))); },
    ci: function (v) { return v[0].toFixed(1) + '–' + v[1].toFixed(1) + '%'; },
    // nearest ten, for 'about 100 minutes'
    r10: function (v) { return String(Math.round(v / 10) * 10); },
    // odds-ratio interval, two significant figures, trailing zeros dropped (0.39-2.5, 0.09-1.7)
    cir: function (v) { return String(Number(v[0].toPrecision(2))) + '–' + String(Number(v[1].toPrecision(2))); },
    // nearest hundred with commas, for 'about 1,000 entrants'
    r100: function (v) { return (Math.round(v / 100) * 100).toLocaleString('en-US'); },
  };

  function el(name, attrs, parent) {
    const node = document.createElementNS(SVGNS, name);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function svgRoot(plot, w, h, label) {
    plot.textContent = '';
    const svg = el('svg', { viewBox: '0 0 ' + w + ' ' + h, role: 'img', 'aria-label': label, focusable: 'false' });
    plot.appendChild(svg);
    return svg;
  }

  function lin(d0, d1, r0, r1) {
    return function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); };
  }

  function text(parent, x, y, str, cls, attrs) {
    const t = el('text', Object.assign({ x: x, y: y, class: cls || '' }, attrs || {}), parent);
    t.textContent = str;
    return t;
  }

  // Multi-line text: lines is an array of strings or [string, class] pairs.
  function lines(parent, x, y, rows, lineH, cls, attrs) {
    const t = el('text', Object.assign({ x: x, y: y, class: cls || '' }, attrs || {}), parent);
    rows.forEach(function (row, i) {
      const s = el('tspan', { x: x, dy: i === 0 ? 0 : lineH }, t);
      if (Array.isArray(row)) { s.textContent = row[0]; s.setAttribute('class', row[1]); } else s.textContent = row;
    });
    return t;
  }

  // Greedy word wrap by an approximate character width (good enough for short labels).
  function wrap(str, maxPx, charPx) {
    const out = [];
    let line = '';
    str.split(' ').forEach(function (w) {
      const next = line ? line + ' ' + w : w;
      if (next.length * charPx > maxPx && line) { out.push(line); line = w; } else line = next;
    });
    if (line) out.push(line);
    return out;
  }

  function title(node, str) {
    const t = el('title', null, node);
    t.textContent = str;
    return node;
  }

  // Deterministic shuffle, so the cleaning chart looks the same on every load.
  function seededPick(n, k, seed) {
    let s = seed;
    const rand = function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
    const idx = Array.from({ length: n }, function (_, i) { return i; });
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    return new Set(idx.slice(0, k));
  }

  /* ---------- Hero: 518 practices as dots ---------- */
  function heroDots(plot, F) {
    const total = F.base.practices;
    const paid = F.base.paid;
    const gone = F.dropoff.never_back_after_day0;
    const cols = plot.clientWidth < 420 ? 22 : 28;
    const rows = Math.ceil(total / cols);
    const pitch = 12;
    const r = 4.1;

    const label = total + ' dots, one per trial practice: ' + paid + ' paid within 30 days; ' +
      gone + ' never came back after day 0, and ' + F.dropoff.never_back_after_day0_paid + ' of those paid.';
    const svg = svgRoot(plot, cols * pitch, rows * pitch, label);

    const groups = { paid: [], other: [], gone: [] };
    for (let i = 0; i < total; i++) {
      // Order: paid first, then the rest who came back, then the day-0 leavers at the bottom.
      const kind = i < paid ? 'paid' : (i >= total - gone ? 'gone' : 'other');
      const c = el('circle', {
        class: 'd d-' + kind,
        cx: (i % cols) * pitch + pitch / 2,
        cy: Math.floor(i / cols) * pitch + pitch / 2,
        r: r,
        'vector-effect': 'non-scaling-stroke',
      }, svg);
      groups[kind].push(c);
    }

    return {
      // CSS transitions with per-dot delays: far cheaper than tweening 518 elements in JavaScript.
      cssIntro: function () {
        // Dots are drawn from the start; the intro only empties the 235 leavers and lights the 64 payers.
        svg.classList.add('is-pre');
        svg.getBoundingClientRect(); // commit the start state before any transition is set
        groups.gone.forEach(function (d, i) {
          d.style.transition = 'fill .5s ease ' + (0.35 + i * 0.0018).toFixed(3) + 's, stroke .5s ease ' + (0.35 + i * 0.0018).toFixed(3) + 's';
        });
        groups.paid.forEach(function (d) {
          const delay = (0.95 + Math.random() * 0.35).toFixed(3);
          d.style.transition = 'fill .5s ease ' + delay + 's';
        });
        requestAnimationFrame(function () { requestAnimationFrame(function () { svg.classList.remove('is-pre'); }); });
      },
    };
  }

  /* ---------- 01 · Beat 1: 552 sign-ups, 34 removed ---------- */
  function cleaning(plot, F) {
    const c = F.cleaning;
    const raw = c.workspaces_raw, spam = c.spam_accounts, qa = c.qa_accounts, kept = F.base.practices;
    const W = plot.clientWidth;
    const narrow = W < 560;
    const mainCols = narrow ? 22 : 28;
    const pitch = Math.min(18, W / (narrow ? mainCols : mainCols + 9));
    const r = pitch * 0.34;
    const top = 26;
    const keptRows = Math.ceil(kept / mainCols);
    let spamX, spamY, qaX, qaY, H;
    if (narrow) {
      spamX = 0; spamY = top + keptRows * pitch + 44;
      qaX = Math.round(W / 2); qaY = spamY;
      H = spamY + 5 * pitch;
    } else {
      // clusters sit against the right edge, so their labels (anchored at the right) never overflow
      spamX = W - 5 * pitch; spamY = top;
      qaX = spamX; qaY = spamY + 5 * pitch + 44;
      H = Math.max(top + keptRows * pitch, qaY + 2 * pitch);
    }
    const label = raw + ' sign-ups: ' + spam + ' spam or phishing accounts and ' + qa +
      ' internal QA accounts removed, leaving ' + kept + ' real practices.';
    const svg = svgRoot(plot, W, H, label);

    const g = el('g', null, svg);
    const removed = seededPick(raw, spam + qa, 7);
    const pos = function (i, x0, y0, cols) { return [x0 + (i % cols) * pitch + pitch / 2, y0 + Math.floor(i / cols) * pitch + pitch / 2]; };
    const keptDots = [], spamDots = [], qaDots = [];
    let k = 0, s = 0, q = 0;
    for (let i = 0; i < raw; i++) {
      const start = pos(i, 0, top, mainCols);
      let end, cls, list;
      if (removed.has(i)) {
        if (s < spam) { end = pos(s++, spamX, spamY, 5); cls = 'cl-removed'; list = spamDots; }
        else { end = pos(q++, qaX, qaY, 5); cls = 'cl-removed cl-qa'; list = qaDots; }
      } else { end = pos(k++, 0, top, mainCols); cls = 'cl-kept'; list = keptDots; }
      const dot = el('circle', { class: cls, cx: end[0], cy: end[1], r: r }, g);
      dot._start = start;
      list.push(dot);
    }
    const labels = el('g', { class: 'cl-labels' }, svg);
    text(labels, 0, top - 10, kept + ' real practices', 't-label t-strong');
    const anchor = narrow ? {} : { 'text-anchor': 'end' };
    text(labels, narrow ? spamX : W, spamY - 10, spam + ' spam or phishing', 't-label t-strong t-caution', anchor);
    text(labels, narrow ? qaX : W, qaY - 10, qa + ' internal QA', 't-label', anchor);

    return {
      intro: function (gsap, tl) {
        const all = keptDots.concat(spamDots, qaDots);
        const gone = spamDots.concat(qaDots);
        const keptFill = getComputedStyle(keptDots[0]).fill;
        const goneFill = gone.map(function (d) { return getComputedStyle(d).fill; });
        const goneStroke = gone.map(function (d) { return getComputedStyle(d).stroke; });
        all.forEach(function (d) { d._end = [d.getAttribute('cx'), d.getAttribute('cy')]; });
        tl.set(all, { attr: { cx: function (i, d) { return d._start[0]; }, cy: function (i, d) { return d._start[1]; } } }, 0);
        tl.set(gone, { fill: keptFill, stroke: 'rgba(0,0,0,0)' }, 0);
        tl.fromTo(labels, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 1.9);
        tl.fromTo(all, { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: { amount: 0.5 } }, 0);
        tl.to(gone, { fill: function (i) { return goneFill[i]; }, stroke: function (i) { return goneStroke[i]; }, duration: 0.3, stagger: { amount: 0.25 } }, 0.8);
        tl.to(all, {
          attr: { cx: function (i, d) { return d._end[0]; }, cy: function (i, d) { return d._end[1]; } },
          duration: 0.9, ease: 'power3.inOut', stagger: { amount: 0.3 },
        }, 1.2);
        tl.add(function () { gsap.set(all, { clearProps: 'fill,stroke,opacity' }); });
        return tl;
      },
    };
  }

  /* ---------- 01 · Beat 2: the retention cliff ---------- */
  function retention(plot, F) {
    const pts = F.dropoff.retention_curve_pct.map(function (p) { return [p.day, p.pct_active_on_or_after]; });
    const W = plot.clientWidth;
    const narrow = W < 560;
    const H = narrow ? 250 : 300;
    const m = { t: 12, r: 12, b: 46, l: 42 };
    const x = lin(0, 14, m.l, W - m.r);
    const y = lin(0, 100, H - m.b, m.t);
    const gone = F.dropoff.never_back_after_day0_pct;
    const label = 'Share of practices with any activity on or after each day: 100% on day 0, ' +
      fmt.pct1(pts[1][1]) + ' on day 1, ' + fmt.pct1(pts[pts.length - 1][1]) + ' on day 14. ' +
      fmt.pct0(gone) + ' never came back after day 0.';
    const svg = svgRoot(plot, W, H, label);

    const grid = el('g', { class: 'grid' }, svg);
    [0, 25, 50, 75, 100].forEach(function (v) {
      el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }, grid);
      text(grid, m.l - 8, y(v) + 4, v + '%', 't-axis', { 'text-anchor': 'end' });
    });
    const ticks = narrow ? [0, 7, 14] : pts.map(function (p) { return p[0]; });
    ticks.forEach(function (d) { text(grid, x(d), H - m.b + 18, String(d), 't-axis', { 'text-anchor': 'middle' }); });
    text(grid, m.l, H - 6, 'Days since sign-up', 't-note');

    let d = 'M' + x(pts[0][0]) + ',' + y(pts[0][1]);
    for (let i = 1; i < pts.length; i++) d += 'H' + x(pts[i][0]) + 'V' + y(pts[i][1]);
    const clipId = 'clip-ret-' + Math.random().toString(36).slice(2, 7);
    const clip = el('rect', { x: 0, y: 0, width: W, height: H }, el('clipPath', { id: clipId }, el('defs', null, svg)));
    // The one annotation: the band of practices that never came back after day 0.
    const ann = el('g', { class: 'ret-ann' }, svg);
    el('rect', { x: x(1), y: y(100), width: x(14) - x(1), height: y(pts[1][1]) - y(100), class: 'ret-gone' }, ann);
    const n = F.dropoff.never_back_after_day0, total = F.base.practices;
    const room = W - m.r - (x(1) + 14) - 6;
    const annRows = wrap(fmt.pct0(gone) + ' never came back after day 0', room, 7.9).map(function (l) { return [l, 't-value']; })
      .concat(wrap('(' + n + ' of ' + total + '). None of them paid.', room, 6.3).map(function (l) { return [l, 't-note']; }));
    lines(ann, x(1) + 14, y(100) + 24, annRows, 17, 't-label');
    const body = el('g', { 'clip-path': 'url(#' + clipId + ')' }, svg);
    el('path', { d: d, class: 'ret-line' }, body);
    el('circle', { cx: x(1), cy: y(pts[1][1]), r: 4, class: 'ret-dot' }, body);

    return {
      intro: function (gsap, tl) {
        tl.fromTo(clip, { attr: { width: x(0) } }, { attr: { width: W }, duration: 1.4, ease: 'power2.inOut' }, 0);
        tl.fromTo(ann, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.35);
        return tl;
      },
    };
  }

  /* ---------- 01 · Beat 3: came back on days 1–3 vs didn't ---------- */
  function returnBars(plot, F) {
    const rows = [
      { label: 'Came back on days 1–3', d: F.dropoff.returned_day1to3, cls: 'bar-strong' },
      { label: "Didn't come back on days 1–3", d: F.dropoff.not_returned_day1to3, cls: 'bar-soft' },
    ];
    const W = plot.clientWidth;
    const rowH = 78, axisH = 24;
    const H = rows.length * rowH + axisH;
    const x = lin(0, 50, 0, W - 64);
    const label = rows.map(function (r) {
      return r.label + ': ' + fmt.pct1(r.d.conversion_pct) + ' paid (' + r.d.paid + ' of ' + r.d.practices + ', 95% interval ' + fmt.ci(r.d.conversion_ci) + ')';
    }).join('; ');
    const svg = svgRoot(plot, W, H, label);

    const grid = el('g', { class: 'grid' }, svg);
    [0, 10, 20, 30, 40, 50].forEach(function (v) {
      el('line', { x1: x(v), x2: x(v), y1: 24, y2: H - axisH }, grid);
      text(grid, x(v), H - 6, v + '%', 't-axis', { 'text-anchor': v === 0 ? 'start' : 'middle' });
    });

    const bars = [], extras = [];
    rows.forEach(function (r, i) {
      const y0 = i * rowH;
      const t = lines(svg, 0, y0 + 14, [r.label], 0, 't-label t-strong');
      const sub = el('tspan', { class: 't-note', dx: 4 }, t);
      sub.textContent = ' ' + r.d.paid + ' of ' + r.d.practices + ' paid';
      const bar = title(el('rect', { x: x(0), y: y0 + 24, width: x(r.d.conversion_pct) - x(0), height: 30, class: r.cls }, svg),
        fmt.pct1(r.d.conversion_pct) + ' (' + fmt.ci(r.d.conversion_ci) + ')');
      bars.push(bar);
      const cy = y0 + 39;
      const lo = x(r.d.conversion_ci[0]), hi = x(r.d.conversion_ci[1]);
      const w = el('path', { d: 'M' + lo + ',' + (cy - 6) + 'V' + (cy + 6) + 'M' + lo + ',' + cy + 'H' + hi + 'M' + hi + ',' + (cy - 6) + 'V' + (cy + 6), class: 'whisker' }, svg);
      const v = text(svg, hi + 8, cy + 5, fmt.pct1(r.d.conversion_pct), 't-value');
      extras.push(w, v);
    });

    return {
      intro: function (gsap, tl) {
        const widths = bars.map(function (b) { return b.getAttribute('width'); });
        tl.fromTo(bars, { attr: { width: 0 } }, {
          attr: { width: function (i) { return widths[i]; } }, duration: 0.9, ease: 'power3.out', stagger: 0.15,
        }, 0);
        tl.fromTo(extras, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.05 }, 0.7);
        return tl;
      },
    };
  }

  /* ---------- 01 · Beat 4: all 13 actions, did vs didn't ---------- */
  function signals(plot, F) {
    const byDid = function (a, b) { return b.conversion_did_pct - a.conversion_did_pct; };
    const keyRows = F.signals.filter(function (s) { return s.holds_after_activity; }).sort(byDid);
    const restRows = F.signals.filter(function (s) { return !s.holds_after_activity; }).sort(byDid);
    const notes = {
      video_call_started: 'Only ' + F.signals.find(function (s) { return s.key === 'video_call_started'; }).practices_did +
        " practices; can't be told apart from chance",
      client_created_import: 'No link of its own once the three are counted (odds ratio ' + fmt.or(F.joint_model.client_created_import.odds_ratio) + ')',
    };
    const W = plot.clientWidth;
    const narrow = W < 640;
    const labelW = narrow ? 0 : 196, nW = narrow ? 0 : 72;
    const x0 = labelW + 8, x1 = W - nW - (narrow ? 46 : 52);
    const x = lin(0, 50, x0, x1);
    const base = F.base.conversion_pct;

    // Layout pass: compute each row's y.
    const items = [];
    let yy = 26;
    const keyBand = {};
    const addGroup = function (name, cls, rows) {
      const top = yy;
      items.push({ type: 'group', y: yy + 14, name: name, cls: cls });
      yy += 30;
      rows.forEach(function (s) {
        const note = notes[s.key];
        const noteLines = note ? wrap(note, narrow ? W : labelW - 14, 6.2) : [];
        const h = narrow ? 46 + noteLines.length * 15 : 30 + noteLines.length * 15;
        items.push({ type: 'row', s: s, y: yy, key: s.holds_after_activity, noteLines: noteLines,
          cy: narrow ? yy + 30 : yy + 15 });
        yy += h;
      });
      if (cls.indexOf('t-key') >= 0) { keyBand.top = top - 2; keyBand.bottom = yy + 4; }
      yy += 10;
    };
    addGroup('Still goes with paying after allowing for activity', 't-group t-key', keyRows);
    addGroup("Doesn't, once activity is allowed for", 't-group', restRows);
    const H = yy + 22;
    const label = 'Paid rate for practices that did each of 13 actions vs those that did not. ' +
      keyRows.map(function (s) { return s.action + ': ' + fmt.pct1(s.conversion_did_pct) + ' vs ' + fmt.pct1(s.conversion_not_pct); }).join('; ') +
      '. All trials: ' + fmt.pct1(base) + '.';
    const svg = svgRoot(plot, W, H, label);
    // A soft mint band behind the three key actions (teal means the key actions everywhere)
    el('rect', { x: -10, y: keyBand.top, width: W + 20, height: keyBand.bottom - keyBand.top, rx: 4, class: 'key-band' }, svg);

    // Gridlines and the 12.4% reference: full height on desktop (labels sit in their own column);
    // on narrow screens only across each row's marks, so they never strike through a label.
    const grid = el('g', { class: 'grid' }, svg);
    const ticksX = [0, 10, 20, 30, 40, 50];
    ticksX.forEach(function (v) { text(grid, x(v), H - 4, v + '%', 't-axis', { 'text-anchor': 'middle' }); });
    if (!narrow) {
      ticksX.forEach(function (v) { el('line', { x1: x(v), x2: x(v), y1: 20, y2: H - 22 }, grid); });
      el('line', { x1: x(base), x2: x(base), y1: 14, y2: H - 22, class: 'ref' }, svg);
    } else {
      items.forEach(function (it) {
        if (it.type !== 'row') return;
        ticksX.forEach(function (v) { el('line', { x1: x(v), x2: x(v), y1: it.cy - 9, y2: it.cy + 9 }, grid); });
        el('line', { x1: x(base), x2: x(base), y1: it.cy - 11, y2: it.cy + 11, class: 'ref' }, svg);
      });
    }
    text(svg, x(base), 10, 'All trials ' + fmt.pct1(base), 't-note', { 'text-anchor': 'middle' });

    const moving = [];
    const fades = [];
    items.forEach(function (it) {
      if (it.type === 'group') { text(svg, 0, it.y, it.name, it.cls); return; }
      const s = it.s;
      const ly = narrow ? it.y + 12 : it.cy + 4;
      text(svg, 0, ly, s.action, 't-label' + (it.key ? ' t-strong' : ''));
      text(svg, narrow ? W : W, ly, s.practices_did + ' did it', 't-axis', { 'text-anchor': 'end' });
      if (it.noteLines.length) {
        const ny = narrow ? it.cy + 22 : it.cy + 20;
        lines(svg, 0, ny, it.noteLines, 15, 't-note');
      }
      const cy = it.cy;
      const ci = title(el('rect', {
        x: x(s.conversion_did_ci[0]), y: cy - 4, width: x(s.conversion_did_ci[1]) - x(s.conversion_did_ci[0]), height: 8, rx: 4,
        class: it.key ? 'ci ci-key' : 'ci',
      }, svg), s.action + ': 95% interval ' + fmt.ci(s.conversion_did_ci));
      const conn = el('line', { x1: x(s.conversion_not_pct), x2: x(s.conversion_did_pct), y1: cy, y2: cy, class: 'conn' }, svg);
      title(el('circle', { cx: x(s.conversion_not_pct), cy: cy, r: 4.5, class: 'dot-not' }, svg),
        s.action + ": didn't, " + fmt.pct1(s.conversion_not_pct) + ' paid');
      const did = title(el('circle', { cx: x(s.conversion_did_pct), cy: cy, r: 5.5, class: it.key ? 'dot-did dot-key' : 'dot-did' }, svg),
        s.action + ': did, ' + fmt.pct1(s.conversion_did_pct) + ' paid (' + s.paid_did + ' of ' + s.practices_did + ')');
      moving.push({ conn: conn, did: did, from: x(s.conversion_not_pct) });
      fades.push(ci);
      if (it.key) fades.push(text(svg, x(s.conversion_did_ci[1]) + 8, cy + 4, fmt.pct1(s.conversion_did_pct), 't-value'));
    });

    return {
      intro: function (gsap, tl) {
        moving.forEach(function (m, i) {
          tl.fromTo(m.did, { attr: { cx: m.from } }, { attr: { cx: m.did.getAttribute('cx') }, duration: 0.8, ease: 'power3.out' }, i * 0.06);
          tl.fromTo(m.conn, { attr: { x2: m.from } }, { attr: { x2: m.conn.getAttribute('x2') }, duration: 0.8, ease: 'power3.out' }, i * 0.06);
        });
        tl.fromTo(fades, { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.03 }, 0.6);
        return tl;
      },
    };
  }

  /* ---------- 01 · Beat 5: 0, 1, 2, 3 key actions ---------- */
  function dose(plot, F) {
    const D = F.dose_response;
    const names = ['None', 'One', 'Two', 'All three'];
    const W = plot.clientWidth;
    const narrow = W < 560;
    const H = narrow ? 270 : 310;
    const m = { t: 16, r: 4, b: 54, l: 38 };
    const y = lin(0, 75, H - m.b, m.t);
    const band = (W - m.l - m.r) / D.length;
    const colW = Math.min(76, band * 0.56);
    const label = 'Paid within 30 days by number of key actions: ' +
      D.map(function (d, i) { return names[i] + ' ' + fmt.pct1(d.conversion_pct) + ' (' + d.paid + ' of ' + d.practices + ')'; }).join(', ') + '.';
    const svg = svgRoot(plot, W, H, label);

    const grid = el('g', { class: 'grid' }, svg);
    [0, 25, 50, 75].forEach(function (v) {
      el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }, grid);
      text(grid, m.l - 8, y(v) + 4, v + '%', 't-axis', { 'text-anchor': 'end' });
    });

    const cols = [], extras = [];
    D.forEach(function (d, i) {
      const cx = m.l + band * (i + 0.5);
      cols.push(title(el('rect', {
        x: cx - colW / 2, y: y(d.conversion_pct), width: colW, height: y(0) - y(d.conversion_pct), class: 'dose dose-' + i,
      }, svg), names[i] + ': ' + fmt.pct1(d.conversion_pct) + ' (' + fmt.ci(d.conversion_ci) + ')'));
      const lo = y(d.conversion_ci[0]), hi = y(d.conversion_ci[1]);
      extras.push(el('path', { d: 'M' + (cx - 6) + ',' + lo + 'H' + (cx + 6) + 'M' + cx + ',' + lo + 'V' + hi + 'M' + (cx - 6) + ',' + hi + 'H' + (cx + 6), class: 'whisker' }, svg));
      extras.push(text(svg, cx, hi - 8, fmt.pct1(d.conversion_pct), 't-value', { 'text-anchor': 'middle' }));
      text(svg, cx, H - m.b + 20, names[i], 't-label t-strong', { 'text-anchor': 'middle' });
      text(svg, cx, H - m.b + 38, (i === D.length - 1 ? 'only ' : '') + d.practices + ' practices', 't-note', { 'text-anchor': 'middle' });
    });

    return {
      intro: function (gsap, tl) {
        tl.fromTo(cols, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.8, ease: 'power3.out', stagger: 0.14 }, 0);
        tl.fromTo(extras, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.05 }, 0.7);
        tl.add(function () { gsap.set(cols, { clearProps: 'transform' }); });
        return tl;
      },
    };
  }

  /* ---------- 01 · Beat 6: the 64 payers ---------- */
  function payerDots(plot, F, fig) {
    const total = F.base.paid;
    const variant = fig.getAttribute('data-variant');
    const marked = variant === 'late' ? F.caveats.payers_paid_after_day14 : F.caveats.payers_without_key_actions;
    const W = plot.clientWidth;
    const cols = W >= 520 ? 32 : 16;
    const pitch = Math.min(17, W / cols);
    const H = Math.ceil(total / cols) * pitch;
    const label = variant === 'late'
      ? marked + ' of ' + total + ' payers paid after day 14.'
      : marked + ' of ' + total + ' payers did none of the three key actions before paying.';
    const svg = svgRoot(plot, cols * pitch, H, label);
    svg.style.maxWidth = cols * pitch + 'px'; // never scale the dots up
    const dots = [];
    for (let i = 0; i < total; i++) {
      // late: the marked group comes last; decided: the key-action payers come first
      const isMarked = i >= total - marked;
      const cls = variant === 'late' ? (isMarked ? 'pd-ink' : 'pd-grey') : (isMarked ? 'pd-grey' : 'pd-key');
      dots.push(el('circle', { cx: (i % cols) * pitch + pitch / 2, cy: Math.floor(i / cols) * pitch + pitch / 2, r: pitch * 0.34, class: cls }, svg));
    }
    return {
      intro: function (gsap, tl) {
        tl.fromTo(dots, { opacity: 0, scale: 0.3, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.35, stagger: { amount: 0.6 } }, 0);
        tl.add(function () { gsap.set(dots, { clearProps: 'opacity,transform' }); });
        return tl;
      },
    };
  }

  function countryBars(plot, F) {
    const rows = [['US', 'US'], ['AU', 'Australia'], ['GB', 'UK'], ['CA', 'Canada']];
    const C = F.caveats.country;
    const W = plot.clientWidth;
    const labelW = 70, valueW = 112;
    const x = lin(0, 20, labelW, W - valueW);
    const rowH = 26;
    const H = rows.length * rowH;
    const label = 'Paid within 30 days by country: ' + rows.map(function (r) {
      const c = C[r[0]]; return r[1] + ' ' + fmt.pct1(c.conversion_pct) + ' (' + c.paid + ' of ' + c.practices + ')';
    }).join(', ') + '.';
    const svg = svgRoot(plot, W, H, label);
    const bars = [];
    rows.forEach(function (r, i) {
      const c = C[r[0]];
      const cy = i * rowH + rowH / 2;
      const focus = r[0] === 'GB' || r[0] === 'CA';
      text(svg, 0, cy + 4, r[1], 't-label' + (focus ? ' t-strong' : ''));
      bars.push(el('rect', { x: labelW, y: cy - 6, width: Math.max(1, x(c.conversion_pct) - labelW), height: 12, class: focus ? 'bar-strong' : 'bar-soft' }, svg));
      const t = text(svg, x(c.conversion_pct) + 8, cy + 4, fmt.pct1(c.conversion_pct), 't-value');
      const sub = el('tspan', { class: 't-note', dx: 2 }, t);
      sub.textContent = ' ' + c.paid + ' of ' + c.practices;
    });
    return {
      intro: function (gsap, tl) {
        const widths = bars.map(function (b) { return b.getAttribute('width'); });
        tl.fromTo(bars, { attr: { width: 0 } }, { attr: { width: function (i) { return widths[i]; } }, duration: 0.7, ease: 'power3.out', stagger: 0.1 }, 0);
        return tl;
      },
    };
  }

  /* ---------- 04 · Ship: the 56 of 518 trials with an online booking ---------- */
  function bookingDots(plot, F) {
    const total = F.base.practices;
    const s = F.signals.find(function (x) { return x.key === 'client_booked_online'; });
    const booked = s.practices_did;
    const W = plot.clientWidth;
    const cols = W < 480 ? 22 : 37;
    const rows = Math.ceil(total / cols);
    const pitch = Math.min(17, W / cols);
    const label = booked + ' of ' + total + ' trials (' + fmt.pct0(s.share_of_trials_pct) + ') had a client book online.';
    const svg = svgRoot(plot, cols * pitch, rows * pitch, label);
    const dots = [], keys = [];
    for (let i = 0; i < total; i++) {
      const k = i < booked;
      const d = el('circle', { cx: (i % cols) * pitch + pitch / 2, cy: Math.floor(i / cols) * pitch + pitch / 2, r: pitch * 0.34, class: k ? 'bd-key' : 'bd-grey' }, svg);
      dots.push(d);
      if (k) keys.push(d);
    }
    return {
      intro: function (gsap, tl) {
        const grey = getComputedStyle(dots[dots.length - 1]).fill;
        const key = getComputedStyle(keys[0]).fill;
        tl.fromTo(dots, { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: { amount: 0.6, grid: [rows, cols], from: 'start' } }, 0);
        tl.fromTo(keys, { fill: grey, scale: 1, transformOrigin: '50% 50%' }, { fill: key, scale: 1, duration: 0.4, stagger: { amount: 0.5 } }, 0.8);
        tl.add(function () { gsap.set(dots, { clearProps: 'fill,opacity,transform' }); });
        return tl;
      },
    };
  }

  /* ---------- 05 · The big catch: importers vs not, before and after fixing the window ---------- */
  function importPair(plot, F, fig) {
    const A = F.ai_story;
    const first = fig.getAttribute('data-variant') === 'first';
    const rows = first
      ? [['Imported clients', A.first_pass_import_conversion_pct, 'bar-strong'], ["Didn't", A.first_pass_no_import_conversion_pct, 'bar-soft']]
      : [['Imported clients', A.corrected_window_import_conversion_pct, 'bar-strong'], ["Didn't", A.corrected_window_no_import_conversion_pct, 'bar-soft']];
    const W = plot.clientWidth;
    const labelW = 118, rowH = 30, axisH = 22;
    // the same 0–40% scale on both cards, so the drop is honest
    const x = lin(0, 40, labelW, W - 52);
    const H = rows.length * rowH + axisH;
    const label = (first ? 'First pass' : 'Re-run') + ': ' + rows.map(function (r) { return r[0] + ' ' + fmt.pct1(r[1]); }).join(', ') + ' paid.';
    const svg = svgRoot(plot, W, H, label);
    const grid = el('g', { class: 'grid' }, svg);
    [0, 20, 40].forEach(function (v) {
      el('line', { x1: x(v), x2: x(v), y1: 0, y2: H - axisH }, grid);
      text(grid, x(v), H - 6, v + '%', 't-axis', { 'text-anchor': v === 0 ? 'start' : 'middle' });
    });
    const bars = [], vals = [];
    rows.forEach(function (r, i) {
      const cy = i * rowH + rowH / 2;
      text(svg, 0, cy + 4, r[0], 't-label');
      bars.push(el('rect', { x: labelW, y: cy - 8, width: x(r[1]) - labelW, height: 16, class: r[2] }, svg));
      vals.push(text(svg, x(r[1]) + 8, cy + 4, fmt.pct1(r[1]), 't-value'));
    });
    return {
      intro: function (gsap, tl) {
        const widths = bars.map(function (b) { return b.getAttribute('width'); });
        tl.fromTo(bars, { attr: { width: 0 } }, { attr: { width: function (i) { return widths[i]; } }, duration: 0.8, ease: 'power3.out', stagger: 0.12, delay: first ? 0 : 0.5 }, 0);
        tl.fromTo(vals, { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.1 }, first ? 0.6 : 1.1);
        return tl;
      },
    };
  }

  /* ---------- 02 · Journey sizing: months to read the primary measure ---------- */
  function splitMonths(plot, F) {
    const J = F.journey;
    const rows = [
      { label: '50/50 holdout', n: J.sample_size.primary_plus8pts_50_50, m: J.months_at_dataset_volume.primary_plus8pts_50_50, cls: 'bar-ink' },
      { label: '80/20 holdout', n: J.sample_size.primary_plus8pts_80_20, m: J.months_at_dataset_volume.primary_plus8pts_80_20, cls: 'bar-soft' },
    ];
    const W = plot.clientWidth;
    const rowH = 66, axisH = 24;
    const H = rows.length * rowH + axisH;
    const max = Math.ceil(Math.max.apply(null, rows.map(function (r) { return r.m; })) / 2) * 2;
    const x = lin(0, max, 0, W - 92);
    const label = rows.map(function (r) { return r.label + ': about ' + fmt.r100(r.n) + ' entrants, ' + fmt.d1(r.m) + ' months'; }).join('; ');
    const svg = svgRoot(plot, W, H, label);
    const grid = el('g', { class: 'grid' }, svg);
    for (let v = 0; v <= max; v += 2) {
      el('line', { x1: x(v), x2: x(v), y1: 22, y2: H - axisH }, grid);
      text(grid, x(v), H - 6, String(v), 't-axis', { 'text-anchor': v === 0 ? 'start' : 'middle' });
    }
    text(grid, W, H - 6, 'months', 't-axis', { 'text-anchor': 'end' });
    const bars = [], extras = [];
    rows.forEach(function (r, i) {
      const y0 = i * rowH;
      const t = text(svg, 0, y0 + 14, r.label, 't-label t-strong');
      const sub = el('tspan', { class: 't-note', dx: 4 }, t);
      sub.textContent = ' about ' + fmt.r100(r.n) + ' entrants';
      bars.push(el('rect', { x: 0, y: y0 + 24, width: x(r.m), height: 26, class: r.cls }, svg));
      extras.push(text(svg, x(r.m) + 8, y0 + 42, fmt.d1(r.m) + ' months', 't-value'));
    });
    return {
      intro: function (gsap, tl) {
        const widths = bars.map(function (b) { return b.getAttribute('width'); });
        tl.fromTo(bars, { attr: { width: 0 } }, { attr: { width: function (i) { return widths[i]; } }, duration: 0.9, ease: 'power3.out', stagger: 0.15 }, 0);
        tl.fromTo(extras, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.1 }, 0.6);
        return tl;
      },
    };
  }

  window.Charts = {
    get: get,
    fmt: fmt,
    registry: {
      heroDots: heroDots,
      cleaning: cleaning,
      retention: retention,
      returnBars: returnBars,
      signals: signals,
      dose: dose,
      payerDots: payerDots,
      countryBars: countryBars,
      splitMonths: splitMonths,
      bookingDots: bookingDots,
      importPair: importPair,
    },
  };
})();
