/* main.js: data binding, nav, chart rendering and motion. */
(function () {
  'use strict';

  const F = window.FINDINGS;
  const C = window.Charts;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap;
  const motion = !!gsap && !reduceMotion;
  if (motion && window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  /* ---------- 1. Bind numbers ---------- */
  // <span data-f="dropoff.never_back_after_day0_pct" data-fmt="pct0">45%</span>
  // The static text is the fallback; it must equal the formatted value.
  function bindNumbers() {
    if (!F) return;
    document.querySelectorAll('[data-f]').forEach(function (node) {
      const path = node.getAttribute('data-f');
      const kind = node.getAttribute('data-fmt') || 'int';
      const v = C.get(F, path);
      const f = C.fmt[kind];
      if (v === undefined || !f) {
        console.warn('[bind] missing value or format:', path, kind);
        return;
      }
      const text = f(v);
      if (node.textContent.trim() !== text) {
        console.warn('[bind] fallback "' + node.textContent.trim() + '" differs from data "' + text + '" at', path);
      }
      node.textContent = text;
    });
  }

  /* ---------- 2. Nav: progress, current section, band colour, mobile menu ---------- */
  function setupNav() {
    const nav = document.getElementById('nav');
    const bar = nav.querySelector('.nav-progress span');
    const toggle = nav.querySelector('.nav-toggle');
    const menu = document.getElementById('nav-menu');
    const links = Array.from(menu.querySelectorAll('a'));
    const sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    const bands = Array.from(document.querySelectorAll('[data-band]'));
    const curN = toggle.querySelector('.n');
    const curT = toggle.querySelector('.t');
    let ticking = false;

    function update() {
      ticking = false;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = 'scaleX(' + p + ')';

      // the band behind the middle of the nav decides light or dark nav
      const probeY = nav.offsetHeight / 2;
      let dark = true; // above the first band the page behind the nav is navy
      for (const b of bands) {
        const r = b.getBoundingClientRect();
        if (r.top <= probeY && r.bottom > probeY) { dark = b.getAttribute('data-band') === 'dark'; break; }
      }
      nav.classList.toggle('is-dark', dark);

      // current section: the last one whose top has passed 40% of the viewport
      const probe = window.innerHeight * 0.4;
      let current = -1;
      sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= probe) current = i; });
      links.forEach(function (a, i) {
        if (i === current) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
      if (current >= 0) {
        curN.textContent = links[current].querySelector('.n').textContent;
        curT.textContent = links[current].textContent.replace(/^\s*\d+\s*/, '');
      } else {
        curN.textContent = '';
        curT.textContent = 'Sections';
      }
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
    }
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    links.forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) setOpen(false);
    });
  }

  /* ---------- 3. Charts ---------- */
  const charts = [];

  function renderChart(fig) {
    const fn = C.registry[fig.getAttribute('data-chart')];
    const plot = fig.querySelector('.chart-plot, .dotfield-plot');
    if (!fn || !plot || !F) return;
    const api = fn(plot, F, fig) || {};
    fig.classList.add('is-rendered');
    charts.push({ fig: fig, fn: fn, plot: plot, api: api, width: plot.clientWidth });
  }

  // The hero chart draws immediately; the others in short batches, then `done` runs.
  function renderCharts(done) {
    const figs = Array.from(document.querySelectorAll('[data-chart]'));
    figs.filter(function (f) { return f.closest('.hero'); }).forEach(renderChart);
    const queue = figs.filter(function (f) { return !f.closest('.hero'); });
    (function step() {
      const t0 = performance.now();
      while (queue.length && performance.now() - t0 < 30) renderChart(queue.shift());
      if (queue.length) setTimeout(step, 0); else if (done) done();
    })();
  }

  // Redraw (no animation) when a chart's width changes.
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      charts.forEach(function (c) {
        const w = c.plot.clientWidth;
        if (w !== c.width) {
          if (c.tl) { c.tl.progress(1).kill(); c.tl = null; }
          c.width = w;
          c.api = c.fn(c.plot, F, c.fig) || {};
        }
      });
    }, 150);
  });

  // Simple data meters: <span class="meter-fill" data-meter="cleaning.imports_from_spam_pct">
  function setMeters() {
    document.querySelectorAll('[data-meter]').forEach(function (m) {
      const v = C.get(F, m.getAttribute('data-meter'));
      if (typeof v === 'number') m.style.width = Math.max(0, Math.min(100, v)) + '%';
    });
  }

  /* ---------- 4. Motion ---------- */
  function countUp(tl, node, at, duration) {
    const kind = node.getAttribute('data-fmt') || 'int';
    const target = C.get(F, node.getAttribute('data-f'));
    const f = C.fmt[kind];
    const decimals = kind === 'pct1' ? 1 : 0;
    const o = { v: 0 };
    tl.fromTo(o, { v: 0 }, {
      v: target, duration: duration, ease: 'power2.out',
      onUpdate: function () {
        const v = decimals ? Math.round(o.v * 10) / 10 : Math.round(o.v);
        node.textContent = f(v);
      },
      onComplete: function () { node.textContent = f(target); },
    }, at);
  }

  function heroIntro() {
    const hero = charts.find(function (c) { return c.fig.closest('.hero'); });
    const tl = gsap.timeline({ delay: 0.15 });
    if (hero && hero.api.cssIntro) hero.api.cssIntro();
    document.querySelectorAll('.hero [data-count]').forEach(function (n) { countUp(tl, n, 0.2, 1.5); });
  }

  // Every other chart plays its entrance once, when it scrolls into view.
  function scrollIntros() {
    charts.forEach(function (c) {
      if (c.fig.closest('.hero') || !c.api.intro) return;
      // Set the start state just before the chart reaches the screen, then play it once it is in view.
      function build() {
        if (c.tl) return c.tl;
        const tl = gsap.timeline({ paused: true });
        c.api.intro(gsap, tl);
        const meters = c.fig.querySelectorAll('.meter-fill');
        if (meters.length) tl.fromTo(meters, { scaleX: 0, transformOrigin: '0 50%' }, { scaleX: 1, duration: 0.7, ease: 'power2.out', stagger: 0.12 }, '>-0.2');
        c.tl = tl;
        return tl;
      }
      window.ScrollTrigger.create({ trigger: c.fig, start: 'top bottom+=400', once: true, onEnter: build });
      window.ScrollTrigger.create({ trigger: c.fig, start: 'top 78%', once: true, onEnter: function () { build().play(); } });
    });
  }

  /* ---------- 5. Journey: map connectors and step-through ---------- */
  function setupJourney() {
    const map = document.querySelector('[data-jmap]');
    const steps = Array.from(document.querySelectorAll('.jstep'));
    if (!map || !steps.length) return;
    const order = steps.map(function (s) { return s.getAttribute('data-step'); });
    const stepOf = function (node) { return node === 'hold' ? 0 : order.indexOf(node); };
    // on = the step index from which a connector counts as travelled
    const links = [
      { from: 'entry', to: 'hold', label: '50%', kind: 'h', on: 0 },
      { from: 'entry', to: 'email1', label: 'the other 50%', kind: 'v', on: stepOf('email1') },
      { from: 'email1', to: 'inapp', label: 'logs back in', kind: 'v', on: stepOf('inapp') },
      { from: 'email1', to: 'email3', label: 'no return by day 4', kind: 'elbow', on: stepOf('email3') },
      { from: 'email3', to: 'inapp', label: 'logs in', kind: 'back', on: stepOf('email3') },
      { from: 'inapp', to: 'email2', label: 'uses the scribe', kind: 'v', on: stepOf('email2') },
      { from: 'email2', to: 'exit', label: 'books or invoices', kind: 'v', on: stepOf('exit') },
    ];
    const NS = 'http://www.w3.org/2000/svg';
    const mk = function (name, attrs, parent) {
      const n = document.createElementNS(NS, name);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      parent.appendChild(n);
      return n;
    };
    let svg = null, drawn = [], active = -1;

    function draw() {
      if (map.offsetParent === null) return; // the map is hidden on small screens
      if (!svg) svg = mk('svg', { class: 'jmap-lines', 'aria-hidden': 'true' }, map);
      svg.textContent = '';
      drawn = [];
      const box = map.getBoundingClientRect();
      const r = function (name) {
        const n = map.querySelector('[data-node="' + name + '"]').getBoundingClientRect();
        return { l: n.left - box.left, r: n.right - box.left, t: n.top - box.top, b: n.bottom - box.top, cx: (n.left + n.right) / 2 - box.left, cy: (n.top + n.bottom) / 2 - box.top };
      };
      links.forEach(function (L) {
        const a = r(L.from), b = r(L.to);
        let d, head, lx, ly, anchor = 'start';
        if (L.kind === 'v') {
          d = 'M' + a.cx + ',' + a.b + 'V' + (b.t - 6);
          head = [[a.cx - 4, b.t - 7], [a.cx + 4, b.t - 7], [a.cx, b.t]];
          lx = a.cx + 10; ly = (a.b + b.t) / 2 + 4;
        } else if (L.kind === 'h') {
          d = 'M' + a.r + ',' + a.cy + 'H' + (b.l - 6);
          head = [[b.l - 7, a.cy - 4], [b.l - 7, a.cy + 4], [b.l, a.cy]];
          lx = (a.r + b.l) / 2; ly = a.cy - 8; anchor = 'middle';
        } else if (L.kind === 'elbow') {
          d = 'M' + a.r + ',' + a.cy + 'H' + b.cx + 'V' + (b.t - 6);
          head = [[b.cx - 4, b.t - 7], [b.cx + 4, b.t - 7], [b.cx, b.t]];
          lx = a.r + 12; ly = a.cy - 8;
        } else { // back: from the side branch into the left column
          d = 'M' + a.l + ',' + a.cy + 'H' + (b.r + 6);
          head = [[b.r + 7, a.cy - 4], [b.r + 7, a.cy + 4], [b.r, a.cy]];
          lx = (a.l + b.r) / 2; ly = a.cy - 8; anchor = 'middle';
        }
        const line = mk('path', { d: d, class: 'jline' }, svg);
        const arrow = mk('path', { d: 'M' + head.map(function (p) { return p.join(','); }).join('L') + 'Z', class: 'jarrow' }, svg);
        const label = mk('text', { x: lx, y: ly, class: 'jlabel', 'text-anchor': anchor }, svg);
        label.textContent = L.label;
        drawn.push({ L: L, els: [line, arrow, label] });
      });
      paint();
    }

    function paint() {
      steps.forEach(function (s, i) { s.classList.toggle('is-active', i === active); });
      map.querySelectorAll('[data-node]').forEach(function (n) {
        const i = stepOf(n.getAttribute('data-node'));
        n.classList.toggle('is-active', active >= 0 && i === active);
        n.classList.toggle('is-done', active >= 0 && i < active);
      });
      drawn.forEach(function (d) {
        const on = active >= 0 && active >= d.L.on;
        d.els.forEach(function (e) { e.classList.toggle('is-on', on); });
      });
    }

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { active = steps.indexOf(e.target); paint(); }
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    steps.forEach(function (s) { io.observe(s); });

    let timer;
    window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(draw, 120); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    draw();
  }

  /* ---------- 6. Message: notes light up their phrase in the phone ---------- */
  function setupMessage() {
    const msg = document.querySelector('.message');
    if (!msg) return;
    const items = Array.from(msg.querySelectorAll('.annotations li'));
    function set(n) {
      msg.querySelectorAll('[data-ann]').forEach(function (e) {
        e.classList.toggle('is-on', n !== null && e.getAttribute('data-ann') === n);
      });
    }
    items.forEach(function (li) {
      const n = li.getAttribute('data-ann');
      li.addEventListener('mouseenter', function () { set(n); });
      li.addEventListener('mouseleave', function () { set(null); });
    });
    msg.querySelectorAll('.phone .ann').forEach(function (b) {
      const n = b.getAttribute('data-ann');
      b.addEventListener('mouseenter', function () { set(n); });
      b.addEventListener('mouseleave', function () { set(null); });
    });
  }

  // The phone slides up and settles, then the numbered badges pop in order.
  function messageIntro() {
    const phone = document.querySelector('[data-intro="phone"]');
    if (!phone) return;
    const badges = phone.querySelectorAll('.ann');
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(phone, { y: 70, rotation: 2.5, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 1, ease: 'power3.out' }, 0);
    tl.fromTo(badges, { scale: 0 }, { scale: 1, duration: 0.35, ease: 'back.out(2.2)', stagger: 0.14 }, 0.7);
    tl.add(function () { gsap.set(phone, { clearProps: 'transform,opacity' }); gsap.set(badges, { clearProps: 'transform' }); });
    window.ScrollTrigger.create({ trigger: phone, start: 'top 80%', once: true, onEnter: function () { tl.play(); } });
  }

  /* ---------- 7. Open Slot demo: auto height, capped preview, copy toasts ---------- */
  function setupDemo() {
    const frame = document.getElementById('openslot-frame');
    if (!frame) return;
    const view = frame.parentElement;
    const more = document.getElementById('demo-more');
    const toast = document.getElementById('toast');
    let expanded = false, toastTimer;

    // Show the top of the tool with a "show the whole kit" button, so the pitch below stays in reach.
    view.classList.add('is-capped');
    more.hidden = false;
    function setExpanded(open) {
      expanded = open;
      view.classList.toggle('is-capped', !open);
      more.setAttribute('aria-expanded', String(open));
      more.textContent = open ? 'Show less' : 'Show the whole kit';
    }
    more.addEventListener('click', function () {
      setExpanded(!expanded);
      if (!expanded) view.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    // Keyboard users tabbing into the tool get all of it.
    window.addEventListener('blur', function () {
      setTimeout(function () { if (document.activeElement === frame && !expanded) setExpanded(true); }, 0);
    });

    window.addEventListener('message', function (e) {
      if (e.source !== frame.contentWindow || !e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'open-slot:height' && typeof e.data.height === 'number' && e.data.height > 200) {
        frame.style.height = Math.ceil(e.data.height) + 'px';
      }
      if (e.data.type === 'open-slot:status' && typeof e.data.text === 'string') {
        toast.textContent = e.data.text.slice(0, 160);
        toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.hidden = true; }, 2600);
      }
    });
  }

  /* ---------- go ---------- */
  bindNumbers();
  setMeters();
  setupNav();
  renderCharts(function () {
    if (motion && window.ScrollTrigger) { scrollIntros(); messageIntro(); window.ScrollTrigger.refresh(); }
  });
  setupJourney();
  setupMessage();
  setupDemo();
  if (motion) heroIntro();
})();
