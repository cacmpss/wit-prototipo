/* Summer holiday · AI savings plan — clickable prototype
   Phase 0–1: foundation, every screen of the core journey.
   Phase 2:   AI motion — FAB container transform, message send, loading,
              line streaming, action sheet (spring, paging, collapse, drag),
              thinking steps → tool call, chart draw and month slider.
   Copy, numbers and motion specs follow the Figma file "Camille's Challenge". */
(() => {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const icon = (name, cls = '') =>
    `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(window.ICONS || {})[name] || ''}</svg>`;
  const eur = (n) => '€' + Math.round(n).toLocaleString('en-GB');
  const eur2 = (n) => '€' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstElementChild; };
  // icon/house-filled exported from the Figma bottom nav (selected Account tab)
  const HOUSE_FILLED = '<svg class="icon" viewBox="0 0 17 16" aria-hidden="true"><path fill="currentColor" d="M7.29102 2.6718C7.68154 2.28127 8.31455 2.28128 8.70508 2.6718L13.291 7.25774C13.5359 7.50262 13.6165 7.81491 13.5732 8.10539C13.5875 8.20159 13.5977 8.30017 13.5977 8.40031V12.7997C13.5976 13.9042 12.7021 14.7996 11.5977 14.7997H9.70117V10.2997C9.70111 9.80272 9.2978 9.40031 8.80078 9.40031H7.20117C6.70415 9.40031 6.30084 9.80272 6.30078 10.2997V14.7997H4.39746C3.29292 14.7997 2.3975 13.9043 2.39746 12.7997V8.40031C2.39746 8.29916 2.40738 8.19958 2.42188 8.10246C2.37963 7.81284 2.46107 7.50178 2.70508 7.25774L7.29102 2.6718Z"/></svg>';

  /* ------------------------------------------------------------------ *
   * Motion foundations (Figma "Motion · Foundations")
   * ------------------------------------------------------------------ */
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Reduce Motion: follows iOS/OS setting, or the presenter toggle (remembered per viewer)
  let forceRM = false;
  try { forceRM = localStorage.getItem('reduce-motion') === '1'; } catch (e) { /* storage blocked */ }
  const reduced = () => RM.matches || forceRM;
  const calm = () => S.instant || reduced();
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (t) => ((ax * t + bx) * t + cx) * t;
    const Y = (t) => ((ay * t + by) * t + cy) * t;
    const dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) { const e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-5 || !d) break; t -= e / d; }
      return Y(Math.min(1, Math.max(0, t)));
    };
  }
  const EASE = { standard: bezier(0.2, 0, 0, 1), enter: bezier(0.05, 0.7, 0.1, 1), exit: bezier(0.3, 0, 0.8, 0.15), sheet: bezier(0.32, 0.72, 0, 1) };
  // Action sheet: iOS sheet curve (critically damped, no overshoot); closing ≈ 80% of opening
  const SHEET_IN = 440, SHEET_OUT = 360;
  const CSSE = {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    enter: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    exit: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
    spring: 'linear(0, 0.2 4%, 0.55 10%, 0.8 16%, 0.94 22%, 1.01 29%, 1.02 35%, 1.008 47%, 1)',
    sheet: 'cubic-bezier(0.32, 0.72, 0, 1)',
  };
  const anim = (el, frames, opts) =>
    (calm() || !el ? Promise.resolve() : settle(el.animate(frames, opts)));
  // Never let the journey wait forever on an animation (e.g. a throttled background tab)
  function settle(a) {
    const t = a.effect?.getTiming?.() || {};
    const ms = (Number(t.duration) || 0) + (Number(t.delay) || 0) + 120;
    const run = S; // a restart or jump abandons flows started before it
    return new Promise((res) => {
      const done = () => { if (S === run) res(); };
      a.finished.then(done, done);
      setTimeout(done, ms);
    });
  }
  function haptic(kind = 'selection') {
    try { navigator.vibrate?.(kind === 'success' ? [12, 60, 18] : kind === 'warning' ? [20, 40, 20] : kind === 'light' ? 8 : 5); } catch (e) { /* not supported */ }
  }
  // rAF tween keyed by target; a timer guarantees the final frame even if rAF is paused.
  const tweens = new Map();
  function tween(key, dur, onFrame, ease = EASE.standard) {
    tweens.get(key)?.cancel();
    if (calm() || dur <= 0) { onFrame(1); return; }
    let done = false, raf = 0, timer = 0;
    const finish = () => { done = true; cancelAnimationFrame(raf); clearTimeout(timer); tweens.delete(key); };
    const t0 = performance.now();
    const step = (t) => {
      if (done) return;
      const p = Math.min(1, (t - t0) / dur);
      onFrame(ease(p));
      if (p < 1) raf = requestAnimationFrame(step); else finish();
    };
    timer = setTimeout(() => { if (!done) { onFrame(1); finish(); } }, dur + 120);
    tweens.set(key, { cancel: finish });
    raf = requestAnimationFrame(step);
  }
  // Money values never "jump": short tween (250ms standard)
  function tweenNumber(el, to, dur = 250, fmt = eur, from) {
    if (!el) return;
    const start = from ?? Number(el.dataset.val ?? to);
    el.dataset.val = to;
    if (calm() || start === to) { tweens.get(el)?.cancel(); el.textContent = fmt(to); return; }
    el.textContent = fmt(start);
    tween(el, dur, (e) => { el.textContent = fmt(start + (to - start) * e); });
  }
  /* Odometer: each digit is a vertical strip that rolls to the new digit — up when the value
     grows (slider to the right), down when it shrinks — following the slider like a counter. */
  const ODO_REPS = 10, ODO_BASE = 50;
  function odoBuild(el, str) {
    el.innerHTML = [...str].map((c) => (/\d/.test(c)
      ? `<span class="odo-d" aria-hidden="true"><span class="odo-s">${'0123456789'.repeat(ODO_REPS).split('').map((d) => `<span>${d}</span>`).join('')}</span></span>`
      : `<span class="odo-c" aria-hidden="true">${c}</span>`)).join('');
    el._odoH = parseFloat(getComputedStyle(el).lineHeight) || 32;
    el.style.setProperty('--odo-h', el._odoH + 'px');
    el._odo = { str, pos: [...str].map((c) => (/\d/.test(c) ? ODO_BASE + Number(c) : null)) };
    odoPaint(el, 0);
  }
  function odoPaint(el, dur) {
    const strips = $$('.odo-s', el);
    let k = 0;
    el._odo.pos.forEach((p) => {
      if (p === null) return;
      const s = strips[k++];
      s.style.transition = dur ? `transform ${dur}ms ${CSSE.standard}` : 'none';
      s.style.transform = `translateY(${-p * el._odoH}px)`;
    });
  }
  function odometer(el, value, dir, dur = 260) {
    const str = eur(value);
    el.setAttribute('aria-label', str);
    const prev = el._odo;
    const same = prev && prev.str.length === str.length && [...str].every((c, i) => /\d/.test(c) === /\d/.test(prev.str[i]));
    if (!same || calm()) {
      // Different number of digits (e.g. €270 → €715 is fine, €90 → €180 is not): rebuild and roll in
      odoBuild(el, str);
      if (prev && dir && !calm()) anim(el, [{ opacity: 0.3, transform: `translateY(${dir * 8}px)` }, { opacity: 1, transform: 'none' }], { duration: 200, easing: CSSE.standard });
      return;
    }
    prev.pos = prev.pos.map((p, i) => {
      if (p === null) return null;
      const b = Number(str[i]), cur = ((p % 10) + 10) % 10;
      if (b === cur) return p;
      return dir >= 0 ? p + ((b - cur + 10) % 10) : p - ((cur - b + 10) % 10);
    });
    prev.str = str;
    odoPaint(el, dur);
    // Once settled, move each strip back to the middle copy of its digit (invisible jump)
    clearTimeout(el._odoT);
    el._odoT = setTimeout(() => {
      if (el._odo !== prev) return;
      prev.pos = prev.pos.map((p) => (p === null ? null : ODO_BASE + (((p % 10) + 10) % 10)));
      odoPaint(el, 0);
    }, dur + 60);
  }

  function setNumber(el, v, fmt = eur) {
    if (!el) return;
    tweens.get(el)?.cancel();
    el.dataset.val = v;
    el.textContent = fmt(v);
  }

  /* ------------------------------------------------------------------ *
   * Scenario data (proto-persona, see viagem-content-prototype-v2.md)
   * ------------------------------------------------------------------ */
  const SURPLUS = 445;          // estimated monthly surplus from February
  const BUFFER = 90;            // what is left today, used as the minimum free
  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const TRIP_MONTHS = { Jun: 5, Jul: 6, Aug: 7, Sep: 8 }; // index in MONTHS_* = deposits from Feb
  const SURPLUS_MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const SURPLUS_FULL = ['November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July'];
  const monthSurplus = (i) => (i < 3 ? 90 : SURPLUS);
  const monthCard = (i) => (i < 3 ? 567 : 211);
  const FIXED = 694;
  const ordinal = (n) => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');

  const fresh = () => ({
    instant: false, busy: false, step: 'home', view: 'home', tab: 'balance',
    chatStarted: false, anchor: null, userScrolled: false, origin: null, originView: 'home',
    goal: 3000, trip: 'Aug', saved: 300, sources: { current: true, card: true }, period: 3,
    sheetPage: 1, sheetOpen: false, permissionMsgShown: false,
    surplusMonth: 8, deposit: 350, day: 5,
    reviewed: false, planned: false, potInserted: false, paused: false, clock: 31,
    fabPos: null, // where the person dropped the AI button this session (reset on reopen)
    kb: false, typing: false, typedText: '', // composer keyboard + typing animation
  });
  let S = fresh();

  function plan(d = S.deposit) {
    const deposits = TRIP_MONTHS[S.trip];
    const needed = Math.max(0, S.goal - S.saved);
    const scheduled = Math.min(needed, deposits * d);
    const total = S.saved + scheduled;
    const free = SURPLUS - d;
    return {
      deposits, needed, scheduled, total, free,
      toGo: S.goal - total,
      bufferOk: free >= BUFFER,
      hits: Math.ceil(needed / deposits),
      keeps: Math.floor((SURPLUS - BUFFER) / 10) * 10,
      tripFull: MONTHS_FULL[TRIP_MONTHS[S.trip]],
    };
  }

  // Timed steps belong to one run: after Restart / jump, stale flows never resume.
  const wait = (ms) => {
    if (S.instant) return Promise.resolve();
    const run = S;
    return new Promise((r) => setTimeout(() => { if (S === run) r(); }, ms));
  };
  const clock = (add = 0) => { S.clock += add; return `14:${String(S.clock).padStart(2, '0')}`; };

  /* ------------------------------------------------------------------ *
   * Views
   * ------------------------------------------------------------------ */
  const screen = $('#screen');
  const views = { home: $('#viewHome'), chat: $('#viewChat'), pot: $('#viewPot') };
  let DEVICE_SCALE = 1;

  function showView(name, animName = 'fade') {
    Object.entries(views).forEach(([k, v]) => {
      v.hidden = k !== name;
      v.classList.remove('enter-fade', 'enter-push', 'enter-pop');
      v.style.zIndex = '';
    });
    if (!S.instant && animName) {
      void views[name].offsetWidth;
      views[name].classList.add('enter-' + animName);
    }
    $('#statusbar').classList.toggle('on-dark', name === 'home');
    S.view = name;
    placeFabs();
  }

  /* ------------------------------------------------------------------ *
   * AI button: hold and drag it anywhere; it starts at its default spot
   * every time the interface opens (Restart / reload).
   * ------------------------------------------------------------------ */
  function placeFabs() {
    $$('.fab', screen).forEach((f) => {
      if (!S.fabPos) { f.style.left = f.style.top = f.style.right = f.style.bottom = ''; return; }
      Object.assign(f.style, { left: S.fabPos.x + 'px', top: S.fabPos.y + 'px', right: 'auto', bottom: 'auto' });
    });
  }
  /* Compact header with search (scroll-linked): appears as the large header leaves the viewport.
     Opacity 0→1 and translateY −8→0 follow the scroll offset over 48px, linear, no timer; if the
     scroll stops halfway it snaps in 150ms standard. Reduce Motion: direct opacity swap. */
  const COMPACT_START = 40, COMPACT_RANGE = 48;
  let compactTimer = 0;
  function setCompact(p, snap) {
    const c = $('#homeCompact');
    if (!c) return;
    const v = reduced() ? (p >= 0.5 ? 1 : 0) : p;
    c.classList.toggle('snap', !!snap && !reduced());
    c.style.opacity = v;
    c.style.transform = reduced() ? 'none' : `translateY(${-8 * (1 - v)}px)`;
    c.classList.toggle('live', v > 0.5);
    c.setAttribute('aria-hidden', String(v <= 0.5));
  }
  views.home.addEventListener('scroll', (e) => {
    if (e.target.id !== 'homeScroll') return;
    const p = Math.min(1, Math.max(0, (e.target.scrollTop - COMPACT_START) / COMPACT_RANGE));
    setCompact(p, false);
    clearTimeout(compactTimer);
    if (p > 0 && p < 1) compactTimer = setTimeout(() => setCompact(p >= 0.5 ? 1 : 0, true), 120);
  }, true);

  /* Pull to refresh on Home. Indicator = Astryx icon/loader-circle (the spinning icon of
     Chat / Thinking step "Running"). The header stays put; the card and sections follow the
     finger with resistance; the arc draws as you pull; past the threshold "Release to refresh"
     appears (+ selection haptic). On release it holds, spins ~1.2s, fades (150ms) and the
     content springs back (350ms). Reduce Motion: no spring, no spin, "Updating…". */
  const PTR_THRESH = 72, PTR_HOLD = 52;
  const ptr = { active: false, pulling: false, startY: 0, dist: 0, refreshing: false, armed: false };
  let suppressPtrClick = false;
  const ptrTargets = () => $$('#homeScroll .overview, #homeScroll .home-sections');
  function ptrRender(dist, transition = '') {
    ptr.dist = dist;
    ptrTargets().forEach((el) => {
      el.style.transition = transition ? `transform ${transition}` : 'none';
      el.style.transform = dist ? `translateY(${dist}px)` : '';
    });
    const box = $('#ptr');
    if (!box) return;
    const p = Math.min(1, dist / PTR_THRESH);
    box.style.opacity = ptr.refreshing ? 1 : Math.min(1, dist / 28);
    if (!ptr.refreshing) box.querySelector('path').style.strokeDashoffset = String(1 - p);
    const armed = p >= 1 && !ptr.refreshing;
    if (armed !== ptr.armed) {
      ptr.armed = armed;
      box.classList.toggle('armed', armed);
      if (armed) haptic();
    }
  }
  function ptrStart(y, target) {
    const sc = $('#homeScroll');
    if (ptr.refreshing || S.view !== 'home' || !sc || !sc.contains(target) || target.closest('.fab') || sc.scrollTop > 0) return;
    Object.assign(ptr, { active: true, pulling: false, startY: y });
  }
  function ptrMove(y, e) {
    if (!ptr.active) return;
    const dy = (y - ptr.startY) / (DEVICE_SCALE || 1);
    if (!ptr.pulling) {
      if (dy < -6) ptr.active = false; // scrolling up: not a pull
      if (dy < 6) return;
      ptr.pulling = true;
    }
    if (e.cancelable) e.preventDefault();
    ptrRender(120 * (1 - Math.exp(-Math.max(0, dy) / 200))); // follows the finger with resistance
  }
  const springOut = () => (reduced() ? '' : `350ms ${CSSE.spring}`);
  async function ptrEnd() {
    if (!ptr.active) return;
    ptr.active = false;
    if (!ptr.pulling) return;
    ptr.pulling = false;
    suppressPtrClick = true;
    setTimeout(() => { suppressPtrClick = false; }, 60);
    if (ptr.dist >= PTR_THRESH) await ptrRefresh();
    else ptrRender(0, springOut());
  }
  async function ptrRefresh() {
    const box = $('#ptr');
    ptr.refreshing = true;
    ptr.armed = false;
    box.classList.remove('armed');
    box.classList.add('loading');
    box.querySelector('.ptr-label').textContent = reduced() ? 'Updating…' : 'Release to refresh';
    box.querySelector('path').style.strokeDashoffset = '0';
    ptrRender(PTR_HOLD, springOut());
    await wait(1200);
    box.classList.remove('loading');
    box.style.transition = reduced() ? '' : `opacity 150ms ${CSSE.standard}`;
    box.style.opacity = 0;
    await wait(150);
    ptr.refreshing = false;
    box.querySelector('.ptr-label').textContent = 'Release to refresh';
    box.style.transition = '';
    ptrRender(0, springOut());
  }
  views.home.addEventListener('touchstart', (e) => ptrStart(e.touches[0].clientY, e.target), { passive: true });
  views.home.addEventListener('touchmove', (e) => ptrMove(e.touches[0].clientY, e), { passive: false });
  views.home.addEventListener('touchend', ptrEnd);
  views.home.addEventListener('touchcancel', ptrEnd);
  views.home.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button === 0) ptrStart(e.clientY, e.target); });
  window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') ptrMove(e.clientY, e); });
  window.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse') ptrEnd(); });

  let fabDrag = null;
  let suppressFabClick = false;
  screen.addEventListener('pointerdown', (e) => {
    const fab = e.target.closest('.fab');
    if (!fab || e.button > 0) return;
    const r = rectIn(fab);
    fabDrag = { fab, sx: e.clientX, sy: e.clientY, ox: r.x, oy: r.y, active: false };
    try { fab.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
    fabDrag.timer = setTimeout(liftFab, 280); // hold to pick it up
  });
  function liftFab() {
    if (!fabDrag || fabDrag.active) return;
    fabDrag.active = true;
    fabDrag.fab.classList.add('dragging');
    haptic('light');
  }
  screen.addEventListener('pointermove', (e) => {
    if (!fabDrag) return;
    const k = DEVICE_SCALE || 1;
    const dx = (e.clientX - fabDrag.sx) / k, dy = (e.clientY - fabDrag.sy) / k;
    if (!fabDrag.active && Math.hypot(dx, dy) > 8) liftFab();
    if (!fabDrag.active) return;
    const f = fabDrag.fab;
    const W = screen.clientWidth, H = screen.clientHeight;
    const x = Math.min(Math.max(fabDrag.ox + dx, 8), W - f.offsetWidth - 8);
    const y = Math.min(Math.max(fabDrag.oy + dy, 56), H - f.offsetHeight - 24);
    S.fabPos = { x, y };
    Object.assign(f.style, { left: x + 'px', top: y + 'px', right: 'auto', bottom: 'auto' });
  });
  const dropFab = () => {
    if (!fabDrag) return;
    clearTimeout(fabDrag.timer);
    if (fabDrag.active) {
      suppressFabClick = true; // a hold or drag is not a tap
      fabDrag.fab.classList.remove('dragging');
      placeFabs();
    }
    fabDrag = null;
  };
  screen.addEventListener('pointerup', dropFab);
  screen.addEventListener('pointercancel', dropFab);
  // No native drag-and-drop of images or links inside the phone
  screen.addEventListener('dragstart', (e) => e.preventDefault());

  function setStep(id) {
    S.step = id;
    $$('#stepList li').forEach((li) => li.classList.toggle('active', li.dataset.step === id));
    const cue = $('#cue');
    const st = typeof STEPS !== 'undefined' && STEPS.find((s) => s.id === id);
    if (cue && st) {
      cue.querySelector('p').textContent = st.cue;
      cue.querySelector('.cue-step').textContent = st.label;
    }
  }

  // Rect of an element in screen coordinates (device scale removed)
  function rectIn(el) {
    const s = screen.getBoundingClientRect(), r = el.getBoundingClientRect(), k = DEVICE_SCALE || 1;
    return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k };
  }
  const screenRadius = () => parseFloat(getComputedStyle(screen).borderTopLeftRadius) || 0;
  function clipFor(r) {
    const W = screen.clientWidth, H = screen.clientHeight;
    return `inset(${r.y}px ${W - r.x - r.w}px ${H - r.y - r.h}px ${r.x}px round ${r.radius ?? Math.min(r.w, r.h) / 2}px)`;
  }

  /* ------------------------------------------------------------------ *
   * HOME
   * ------------------------------------------------------------------ */
  function renderHome() {
    views.home.innerHTML = homeHtml();
    placeFabs();
  }

  // Tabs Balance / Pots: the underline slides (250ms standard), content crossfades with a 12px
  // shift in the tab direction (200ms, exit 120ms), and the card height follows with a spring.
  function switchTab(to) {
    if (S.tab === to) return;
    const from = S.tab;
    S.tab = to;
    const ov = $('.overview', views.home);
    const t = document.createElement('template');
    t.innerHTML = homeHtml();
    // homeHtml() has already consumed the one-time insert flag, so reuse its markup as is
    if (calm() || !ov || S.pendingInsert) { views.home.innerHTML = t.innerHTML; placeFabs(); playHomeInsert(); return; }
    haptic();
    const dir = ['balance', 'pots'].indexOf(to) > ['balance', 'pots'].indexOf(from) ? 1 : -1;

    // Underline
    const tabs = $('.tabs', ov);
    const oldBtn = tabs.querySelector(`[data-tab="${from}"]`);
    const newBtn = tabs.querySelector(`[data-tab="${to}"]`);
    const ind = html('<span class="tab-ind"></span>');
    tabs.appendChild(ind);
    tabs.classList.add('moving');
    oldBtn.classList.remove('on');
    newBtn.classList.add('on');
    const at = (b) => ({ left: b.offsetLeft + 12 + 'px', width: b.offsetWidth - 24 + 'px' });
    anim(ind, [at(oldBtn), at(newBtn)], { duration: 250, easing: CSSE.standard, fill: 'forwards' })
      .then(() => { ind.remove(); tabs.classList.remove('moving'); });

    // Content + card height
    const oldPanel = $('.panel', ov);
    const newPanel = t.content.querySelector('.overview .panel');
    const h0 = ov.offsetHeight;
    Object.assign(oldPanel.style, {
      position: 'absolute', top: oldPanel.offsetTop + 'px', left: oldPanel.offsetLeft + 'px', width: oldPanel.offsetWidth + 'px',
    });
    ov.appendChild(newPanel);
    const h1 = ov.offsetHeight;
    ov.style.overflow = 'hidden';
    anim(oldPanel, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-12 * dir}px)` }],
      { duration: 120, easing: CSSE.exit, fill: 'forwards' }).then(() => oldPanel.remove());
    anim(newPanel, [{ opacity: 0, transform: `translateX(${12 * dir}px)` }, { opacity: 1, transform: 'none' }],
      { duration: 200, delay: 60, easing: CSSE.standard, fill: 'backwards' });
    anim(ov, [{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 350, easing: CSSE.spring })
      .then(() => { ov.style.overflow = ''; });
  }

  function homeHtml() {
    const pots = [
      ...(S.planned ? [{ key: 'holiday', name: 'Summer holiday', img: 'pot-holiday.png', badge: S.paused ? ['paused', 'Paused'] : ['success', `Scheduled · ${S.day} Feb`], amount: S.saved }] : []),
      { key: 'gizmo', name: 'Gizmo treatment', img: 'pot-gizmo.png', badge: ['yellow', '↑ 140% of base rate'], amount: 2010.91 },
      { key: 'newyear', name: 'New year fund', img: 'pot-newyear.png', badge: ['blue', '↑ 130% of base rate'], amount: 2691.71 },
    ];
    const potsTotal = pots.reduce((a, p) => a + p.amount, 0);
    const insertNow = S.planned && !S.potInserted && S.tab === 'pots' && !calm();
    if (S.planned && S.tab === 'pots') S.potInserted = true;
    S.pendingInsert = insertNow ? { from: potsTotal - S.saved, to: potsTotal } : null;
    const ins = (on, inner) => (on ? `<div class="ins-wrap pending">${inner}</div>` : inner);

    const balancePanel = `
      <div class="panel">
        <div>
          <div class="balance-row">
            <div class="value"><span class="amount">€842.50</span><button class="icon-btn sm ghost" aria-label="Hide balance">${icon('eye')}</button></div>
            <span class="link">Statement →</span>
          </div>
          <div class="earn">${icon('trending-up')}Earning 105% of the base rate</div>
        </div>
        <div class="plus-banner">
          <div class="banner success">${icon('circle-check', 'md')}<div class="b-body">Your balance grows with Plus<span class="b-sub">Add money and it earns 105% from today.</span></div></div>
          <div class="content"><button class="btn sm secondary">Deposit</button></div>
        </div>
        <div class="benefits"><span class="t-body">Corporate benefits</span><span class="t-strong">€28.21</span></div>
      </div>`;

    const potsPanel = `
      <div class="panel">
        <div>
          <div class="balance-row">
            <div class="value"><span class="amount" id="potsTotal">${eur2(insertNow ? potsTotal - S.saved : potsTotal)}</span><button class="icon-btn sm ghost" aria-label="Hide balance">${icon('eye')}</button></div>
            <span class="link">All pots (${pots.length}/3) →</span>
          </div>
          <div class="earn">${icon('trending-up')}Earned €455.30 in the last 12 months</div>
        </div>
        <div class="activity" style="gap:8px">
          ${pots.map((p) => ins(p.key === 'holiday' && insertNow, `
            <button class="pot-row" data-act="${p.key === 'holiday' ? 'open-pot' : ''}">
              <img src="assets/img/${p.img}" alt="" />
              <span class="name"><span class="t-body">${p.name}</span><span class="badge ${p.badge[0]}">${p.badge[1]}</span></span>
              <span class="t-strong">${eur2(p.amount)}</span>
            </button>`)).join('')}
        </div>
      </div>`;

    const activity = [
      ...(S.planned ? [{ ic: 'piggy-bank', t: 'Summer holiday pot', s: 'Pot created · Plan scheduled', a: '+' + eur2(S.saved), d: '16 Nov', ins: insertNow, pos: true }] : []),
      { ic: 'repeat', t: 'Plus membership', s: 'Automatic payment · Visa credit', a: '−€9.90', d: '01:33', neg: true },
      { ic: 'arrow-up-right', t: 'Maria Silva', s: 'Transfer sent · Account balance', a: '−€612.74', d: '13 Nov', neg: true },
      { ic: 'arrow-up-from-line', t: 'Emergency pot', s: 'Money withdrawn', a: '+€611.86', d: '13 Nov', pos: true },
    ];

    return `
      <div class="scroll" id="homeScroll">
        <div class="home-top">
          <div class="home-header">
            <div class="profile">
              <img class="avatar" src="assets/img/avatar.jpg" alt="" />
              <div class="greeting"><span class="t-h3">Hi, Alex</span><span class="badge green">Plus member</span></div>
            </div>
            <div class="quick-actions">
              <button class="qa-btn" aria-label="Search">${icon('search')}</button>
              <button class="qa-btn" aria-label="Pay contactless">${icon('nfc')}</button>
              <button class="qa-btn" aria-label="Notifications">${icon('bell')}<span class="badge red count">3</span></button>
            </div>
          </div>
          <div class="ptr" id="ptr" aria-hidden="true">
            <svg class="ptr-ring" viewBox="0 0 24 24" aria-hidden="true">${((window.ICONS || {})['loader-circle'] || '').replace('<path ', '<path pathLength="1" ')}</svg>
            <span class="ptr-label">Release to refresh</span>
          </div>
          <div class="overview">
            <div class="tabs" role="tablist">
              <button class="tab ${S.tab === 'balance' ? 'on' : ''}" data-act="tab" data-tab="balance" role="tab">Balance</button>
              <button class="tab ${S.tab === 'pots' ? 'on' : ''}" data-act="tab" data-tab="pots" role="tab">Pots</button>
              <button class="tab" role="tab">Investments</button>
              <button class="tab" role="tab">Crypto</button>
            </div>
            ${S.tab === 'pots' ? potsPanel : balancePanel}
          </div>
        </div>
        <div class="home-sections">
          <div class="section">
            <div class="section-head"><span class="t-h3">Credit card</span><span class="link">Manage →</span></div>
            <div class="stat-row">
              <div class="stat"><span class="t-sup">Available credit</span><span class="t-h3">€721</span><span class="t-sup">of €2,000</span></div>
              <div class="stat"><span class="t-sup">Bill so far</span><span class="t-h3">€567</span><span class="t-sup">Closes on 5 Dec</span></div>
            </div>
          </div>
          <div class="section">
            <div class="section-head"><span class="t-h3">Recent activity</span><span class="link">See all →</span></div>
            <div class="activity">
              ${activity.map((t) => ins(t.ins, `
                <div class="tx">
                  <span class="ic">${icon(t.ic)}</span>
                  <span class="txt"><span class="t-body">${t.t}</span><span class="t-sup">${t.s}</span></span>
                  <span class="amt"><span class="t-strong" style="${t.pos ? 'color:var(--success)' : t.neg ? 'color:var(--error)' : ''}">${t.a}</span><span class="t-sup">${t.d}</span></span>
                </div>`)).join('')}
            </div>
          </div>
          <div class="section">
            <div class="section-head"><span class="t-h3">Suggestions</span></div>
            <div class="suggestion">
              <div class="behind" style="left:24px;right:24px;top:0"></div>
              <div class="behind" style="left:12px;right:12px;top:8px"></div>
              <div class="front">
                <div style="flex:1;display:flex;flex-direction:column;gap:8px"><span class="t-h3">Scratch &amp; win on your next purchase</span><span class="link">Shop now →</span></div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between">${icon('x')}${icon('gift', 'md')}</div>
              </div>
            </div>
          </div>
          <div class="section help-footer">
            <button class="btn md secondary block">${icon('search')}Search other options</button>
            <div class="support-links">
              ${['Help center', 'Accessibility', 'Terms of use'].map((l) => `<button class="support-link"><span>${l}</span>${icon('chevron-right')}</button>`).join('')}
            </div>
          </div>
        </div>
      </div>
      <div class="home-compact" id="homeCompact" aria-hidden="true">
        <button class="search-field" tabindex="-1">${icon('search')}<span>Search “Help”, “QR code”, etc.</span></button>
      </div>
      ${S.planned
        // End of the flow: the AI button is shown for context only (not tappable)
        ? '<button class="fab is-display" type="button" tabindex="-1" aria-disabled="true" aria-label="Assistant"><img src="assets/img/ai-logo.png" alt="" draggable="false" /></button>'
        : '<button class="fab" data-act="open-chat" aria-label="Open the assistant"><img src="assets/img/ai-logo.png" alt="" draggable="false" /></button>'}
      <nav class="bottom-nav">
        <span class="nav-item on"><span class="ind"></span>${HOUSE_FILLED}Account</span>
        <span class="nav-item"><span class="ind"></span>${icon('credit-card')}Cards</span>
        <span class="nav-item nav-pay"><span class="pay-btn">${icon('qr-code')}</span>Pay</span>
        <span class="nav-item"><span class="ind"></span>${icon('receipt-text')}Bills</span>
        <span class="nav-item"><span class="ind"></span>${icon('layout-grid')}More</span>
      </nav>`;
  }

  /* ------------------------------------------------------------------ *
   * CHAT — scaffold, scrolling, composer
   * ------------------------------------------------------------------ */
  function renderChatScaffold() {
    views.chat.innerHTML = `
      <header class="chat-header">
        <div class="topnav">
          <div><button class="icon-btn muted" data-act="close-chat" aria-label="Back">${icon('arrow-left')}</button></div>
          <div class="center"><img src="assets/img/ai-logo.png" alt="Assistant" /></div>
          <div class="end">
            <button class="icon-btn muted" aria-label="New chat">${icon('square-pen')}</button>
            <button class="icon-btn muted" aria-label="Chat history">${icon('menu')}</button>
          </div>
        </div>
      </header>
      <div class="messages" id="messages"><div class="msg-list" id="msgList"></div></div>
      <div class="composer-area" id="composerArea"></div>
      <div class="sticky-bar" id="stickyBar"><button class="btn primary block" data-act="review-plan" data-review-label>Review the €350 plan</button></div>
      <div class="sheet glass" id="sheet" role="dialog" aria-modal="false"></div>
      <button class="scroll-btn" id="scrollBtn" data-act="scroll-bottom" aria-label="Scroll to latest" tabindex="-1">${icon('chevron-down')}</button>
      ${keyboardHtml()}`;
    const m = $('#messages');
    m.addEventListener('scroll', updateScrollBtn, { passive: true });
    ['wheel', 'touchstart', 'touchmove'].forEach((t) => m.addEventListener(t, markGesture, { passive: true }));
    // Interacting with something in the conversation (buttons, chips, sliders…) hides it
    m.addEventListener('pointerdown', (e) => { if (e.target.closest('button, input, label, [data-act], .slider')) setScrollBtn(false); });
    const stopAuto = () => { if (m.classList.contains('locked')) return; cancelAnimationFrame(scrollRaf); S.userScrolled = true; };
    m.addEventListener('wheel', stopAuto, { passive: true });
    m.addEventListener('touchstart', stopAuto, { passive: true });
    bindSheetDrag();
    renderComposer('idle');
  }

  // Auto-scroll anchors the TOP of the new content (350ms, standard); any user scroll cancels it.
  let scrollRaf = 0;
  function scrollToY(m, target, dur = 350) {
    cancelAnimationFrame(scrollRaf);
    const from = m.scrollTop;
    if (calm() || Math.abs(target - from) < 2) { m.scrollTop = target; return; }
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      m.scrollTop = from + (target - from) * EASE.standard(p);
      if (p < 1) scrollRaf = requestAnimationFrame(step);
    };
    scrollRaf = requestAnimationFrame(step);
  }
  function reveal(el, force = false) {
    const m = $('#messages');
    if (!m || !el || !el.isConnected) return;
    if (S.userScrolled && !force) return;
    const target = Math.max(0, Math.min(el.offsetTop - 16, m.scrollHeight - m.clientHeight));
    scrollToY(m, target);
  }
  const follow = () => reveal(S.anchor);

  const GOAL_MSG = 'I want to save €3,000 for a holiday next summer, but I don’t know how much I can afford to save each month.';

  /* ---------- iOS keyboard (Figma "Chat · 1 — Opening (alt)") + typing animation ---------- */
  function keyboardHtml() {
    const keys = (s) => [...s].map((k) => `<span class="key" data-k="${k}">${k}</span>`).join('');
    return `
      <div class="kb" id="kb" aria-hidden="true">
        <div class="kb-suggest"><span>“The”</span><i></i><span>the</span><i></i><span>to</span></div>
        <div class="kb-keys">
          <div class="kb-row">${keys('qwertyuiop')}</div>
          <div class="kb-row r2">${keys('asdfghjkl')}</div>
          <div class="kb-row r3"><span class="key fn" data-k="shift">${icon('arrow-big-up', 'md')}</span><div class="kb-mid">${keys('zxcvbnm')}</div><span class="key fn">${icon('delete', 'md')}</span></div>
          <div class="kb-row r4"><span class="key wide">ABC</span><span class="key space" data-k=" "></span><span class="key wide ret" role="button" aria-label="Send" data-act="send-typed">${icon('corner-down-left', 'md')}</span></div>
        </div>
        <div class="kb-bottom">${icon('smile')}${icon('mic')}</div>
      </div>`;
  }
  const kbLift = () => (S.kb ? $('#kb').offsetHeight - 26 : 0);
  function showKeyboard() {
    S.kb = true;
    $('#kb').classList.add('up');
    $('#composerArea').style.bottom = kbLift() + 'px'; // composer and list follow the keyboard
    syncBottomSpace(true);
  }
  function hideKeyboard() {
    if (!S.kb) return;
    S.kb = false;
    $('#kb').classList.remove('up');
    $('#composerArea').style.bottom = '';
    syncBottomSpace(true);
  }
  function pressKey(ch) {
    const kb = $('#kb');
    const k = ch === ' ' ? ' ' : ch.toLowerCase();
    const hit = [...kb.querySelectorAll('[data-k]')].filter((el) => el.dataset.k === k);
    if (ch !== ch.toLowerCase()) hit.push(kb.querySelector('[data-k="shift"]'));
    hit.forEach((el) => { el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 90); });
  }
  const typeDelay = (ch) => (ch === ' ' ? 70 : /[,.’]/.test(ch) ? 140 : 32 + (ch.charCodeAt(0) % 5) * 6);

  // Tap the composer: the keyboard opens, the goal message types itself, then the person taps Send.
  async function focusComposer() {
    if (S.busy || S.step !== 'chat' || S.kb || S.typing) return;
    renderComposer('typing');
    showKeyboard();
    if (S.typedText === GOAL_MSG) return;
    await wait(calm() ? 0 : 420);
    S.typing = true;
    for (const ch of GOAL_MSG.slice(S.typedText.length)) {
      if (!S.kb || S.step !== 'chat') break; // keyboard dismissed: stop, keep what was typed
      S.typedText += ch;
      const t = $('#typedText');
      if (t) t.textContent = S.typedText;
      if (S.typedText.length === 1) $('#sendTyped')?.removeAttribute('disabled'); // 150ms crossfade (CSS)
      if (!calm()) pressKey(ch);
      syncBottomSpace();
      await wait(calm() ? 0 : typeDelay(ch));
    }
    S.typing = false;
  }
  async function sendTyped(el) {
    if (S.busy || S.typing || !S.typedText) return;
    haptic('light');
    el?.classList.add('pressed');
    hideKeyboard();
    await wait(calm() ? 0 : 120);
    S.typedText = '';
    sendGoal();
  }

  function renderComposer(mode) {
    S.composer = mode;
    const area = $('#composerArea');
    if (!area) return;
    const bar = (m) => {
      if (m === 'busy') {
        return `<div class="chat-bar">
          <span class="input">Ask the assistant</span>
          <button class="icon-btn sm ghost" aria-label="Dictation">${icon('mic')}</button>
          <button class="icon-btn round-dark" aria-label="Stop">${icon('square', 'sm')}</button>
        </div>`;
      }
      if (m === 'typing' || (m === 'typed' && S.typedText)) {
        // Focused composer: text + caret while the keyboard is up; Send enabled on the first character
        const focused = m === 'typing';
        return `<div class="chat-bar ${focused ? 'focused' : ''}">
          <button class="icon-btn sm ghost" aria-label="Add attachment">${icon('plus')}</button>
          <div class="input filled typing" data-act="type-goal"><span id="typedText">${S.typedText}</span>${focused ? '<span class="caret"></span>' : ''}</div>
          <button class="icon-btn round-dark send-btn" id="sendTyped" data-act="send-typed" aria-label="Send" ${S.typedText ? '' : 'disabled'}>${icon('arrow-up')}</button>
        </div>`;
      }
      return `<div class="chat-bar">
        <button class="icon-btn sm ghost" aria-label="Add attachment">${icon('plus')}</button>
        <button class="input" data-act="type-goal">Ask the assistant</button>
        <button class="icon-btn sm ghost" aria-label="Open camera">${icon('camera')}</button>
        <button class="icon-btn round-dark" aria-label="Start dictation">${icon('mic')}</button>
      </div>`;
    };
    if (mode === 'question') {
      const title = S.sheetPage === 1 ? 'Here’s what I got' : 'Can I take a look at your spending?';
      area.innerHTML = `<div class="qbar glass">
          <div class="q">${icon('circle-question-mark')}<span>${title}</span></div>
          <div style="padding-left:16px"><button class="btn sm ghost" data-act="show-questions">Show questions</button></div>
          ${bar('busy')}
        </div>`;
      area.style.paddingTop = '8px';
    } else if (mode !== 'hidden') {
      area.innerHTML = bar(mode);
      area.style.paddingTop = '';
    }
    area.classList.toggle('hidden', mode === 'hidden');
    syncBottomSpace();
  }

  // Keep the message list scrollable above whatever sits at the bottom.
  // Only the keyboard animates this (the list follows it); everywhere else the new size applies
  // at once, so scroll targets (e.g. "last AI message above the sheet") are measured correctly.
  function syncBottomSpace(animated = false) {
    const m = $('#messages');
    if (!m) return;
    const sheet = $('#sheet'), area = $('#composerArea');
    const h = S.sheetOpen ? sheet.offsetHeight + 32 : area.classList.contains('hidden') ? 0 : area.offsetHeight + kbLift();
    if (!animated) m.style.transition = 'none';
    m.style.bottom = Math.max(h, 0) + 'px';
    if (!animated) { void m.offsetHeight; m.style.transition = ''; }
    // The sticky review bar rests on top of the composer, so the chat stays visible below it
    const sticky = $('#stickyBar');
    if (sticky) sticky.style.bottom = (area.classList.contains('hidden') ? 0 : area.offsetHeight + kbLift()) + 'px';
    updateScrollBtn();
  }

  // Chat / ChatLayoutScrollButton (icon-only): appears, centred just above the composer, only
  // when the person scrolls UP themselves (wheel / touch), away from the latest message. It hides
  // when they scroll down, reach the end, interact with something in the conversation, or when
  // the app scrolls on its own. Tapping it scrolls to the end (350ms).
  let lastScrollTop = 0, lastGesture = -Infinity;
  const markGesture = () => { lastGesture = performance.now(); };
  function setScrollBtn(show) {
    const m = $('#messages'), btn = $('#scrollBtn');
    if (!m || !btn) return;
    show = show && !S.sheetOpen && S.view === 'chat';
    const sticky = $('#stickyBar');
    const lift = sticky?.classList.contains('show') ? sticky.offsetHeight : 0; // stay above the review bar
    btn.style.bottom = (parseFloat(m.style.bottom) || 0) + lift + 12 + 'px';
    if (btn.classList.contains('show') !== show) {
      btn.classList.toggle('show', show);
      btn.tabIndex = show ? 0 : -1;
    }
  }
  function updateScrollBtn() {
    const m = $('#messages'), btn = $('#scrollBtn');
    if (!m || !btn) return;
    const st = m.scrollTop, delta = st - lastScrollTop;
    lastScrollTop = st;
    const fromEnd = m.scrollHeight - m.clientHeight - st;
    const byPerson = performance.now() - lastGesture < 400;
    if (fromEnd < 40 || S.sheetOpen) setScrollBtn(false);
    else if (byPerson && delta < -2 && fromEnd > 160) setScrollBtn(true);
    else if (byPerson && delta > 2) setScrollBtn(false);
    else setScrollBtn(btn.classList.contains('show')); // keep state, refresh position
  }
  function scrollToEnd() {
    const m = $('#messages');
    haptic('light');
    S.userScrolled = false;
    setScrollBtn(false);
    scrollToY(m, m.scrollHeight - m.clientHeight, 350);
  }

  /* ------------------------------------------------------------------ *
   * Messages
   * ------------------------------------------------------------------ */
  function add(node, animName = 'enter') {
    const el = typeof node === 'string' ? html(node) : node;
    if (!S.instant && animName) el.classList.add(animName);
    $('#msgList').appendChild(el);
    return el;
  }
  function leave(el) {
    if (!el) return;
    if (calm()) { el.remove(); return; }
    el.classList.add('leave');
    setTimeout(() => el.remove(), 160);
  }
  // User message: leaves the composer and rises into the list. Starts a new turn.
  function addUser(text, time) {
    S.userScrolled = false;
    const u = add(`<div class="user"><div class="bubble">${text}</div><span class="time">${time}</span></div>`);
    S.anchor = u;
    follow();
    return u;
  }
  const aiMsg = ({ dot, ident, heading, text, cls = '' }) => `
    <div class="ai ${cls}">
      ${ident ? `<div class="ident"><span class="dot ${dot || 'info'}"></span>${ident}</div>` : ''}
      ${heading ? `<p class="t-h3">${heading}</p>` : ''}
      ${text ? `<p class="t-body">${text}</p>` : ''}
    </div>`;

  // AI response streams by sentence with a 100ms fade (no per-character typewriter).
  const sentences = (t) => t.match(/[^.!?…]+[.!?…:]*[”’)"]*\s*|.+$/gu) || [t];
  // `working`: a transient status shown only while the answer streams (pulsing dot + label,
  // e.g. "Reasoning…"); when the text is complete it fades and collapses away.
  async function say({ dot, ident, heading, text, cls = '', working }) {
    const status = working
      ? `<div class="ident working"><span class="dot ${dot || 'info'} pulse"></span><span>${working}</span></div>`
      : ident ? `<div class="ident"><span class="dot ${dot || 'info'}"></span>${ident}</div>` : '';
    const el = add(`<div class="ai ${cls}">
        ${status}
        ${heading ? '<p class="t-h3"></p>' : ''}
        ${text ? '<p class="t-body"></p>' : ''}
      </div>`, 'enter-fade');
    if (!S.anchor) S.anchor = el;
    for (const [p, t] of [[el.querySelector('.t-h3'), heading], [el.querySelector('.t-body'), text]]) {
      if (!p || !t) continue;
      for (const s of sentences(t)) {
        const span = document.createElement('span');
        span.textContent = s;
        if (!calm()) span.className = 'chunk';
        p.appendChild(span);
        // With the sheet open, keep the message being written just above it
        if (S.sheetOpen) revealAbove(el); else follow();
        await wait(Math.min(650, 140 + s.length * 9));
      }
    }
    const live = el.querySelector('.ident.working');
    if (live) {
      if (calm()) live.remove();
      else {
        await settle(live.animate(
          [{ opacity: 1, height: live.offsetHeight + 'px', marginBottom: '0px' }, { opacity: 0, height: '0px', marginBottom: '-12px' }],
          { duration: 220, easing: CSSE.standard, fill: 'forwards' }));
        live.remove();
      }
    }
    return el;
  }

  const responseActions = () => `
    <div class="response-actions">
      <button class="icon-btn ghost" data-act="react" aria-label="Copy">${icon('copy')}</button>
      <button class="icon-btn ghost" data-act="react" data-toggle aria-label="Good response">${icon('thumbs-up')}</button>
      <button class="icon-btn ghost" data-act="react" data-toggle aria-label="Bad response">${icon('thumbs-down')}</button>
    </div>`;

  /* ---------- Thinking steps (real progress, each visible ≥400ms) ---------- */
  const stepRow = (label, state) =>
    `<div class="step ${state}">${icon(state === 'done' ? 'circle-check' : state === 'active' ? 'loader-circle' : 'circle-dashed')}<span>${label}</span></div>`;

  async function runSteps(container, labels, per = 600, onFirstDone) {
    for (let i = 0; i < labels.length; i++) {
      const row = html(stepRow(labels[i], 'active'));
      if (!calm()) row.classList.add('step-in');
      container.appendChild(row);
      follow();
      await wait(Math.max(400, per));
      row.className = 'step done';
      row.querySelector('svg').outerHTML = icon('circle-check', 'pop');
      if (i === 0 && onFirstDone) onFirstDone();
    }
  }

  // Thinking block collapses into a tool-call chip: height 250ms standard + crossfade.
  async function collapseInto(nodes, newEl) {
    const list = $('#msgList');
    const wrap = document.createElement('div');
    wrap.className = 'collapse-wrap';
    list.insertBefore(wrap, nodes[0]);
    const inner = document.createElement('div');
    inner.className = 'collapse-inner';
    nodes.forEach((n) => inner.appendChild(n));
    wrap.appendChild(inner);
    if (calm()) { wrap.replaceWith(newEl); return newEl; }
    const h0 = inner.offsetHeight;
    newEl.classList.add('collapse-new');
    wrap.appendChild(newEl);
    const h1 = newEl.offsetHeight;
    inner.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
    newEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, delay: 100, fill: 'backwards' });
    await settle(wrap.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 250, easing: CSSE.standard }));
    newEl.classList.remove('collapse-new');
    wrap.replaceWith(newEl);
    return newEl;
  }
  async function collapseAway(nodes) {
    if (calm()) { nodes.forEach((n) => n.remove()); return; }
    await Promise.all(nodes.map((n) => settle(n.animate(
      [{ opacity: 1, height: n.offsetHeight + 'px' }, { opacity: 0, height: '0px', marginBottom: '-16px' }],
      { duration: 250, easing: CSSE.standard, fill: 'forwards' }))));
    nodes.forEach((n) => n.remove());
  }

  /* ------------------------------------------------------------------ *
   * FAB → Chat (container transform)
   * ------------------------------------------------------------------ */
  async function openChat(fromEl) {
    const fromName = S.view;
    if (fromName === 'chat') return;
    const fromView = views[fromName];
    // Origin of the container transform: the FAB, or the card that holds the CTA ("Show me ways")
    const origin = (fromEl && fromEl.closest && (fromEl.closest('.fab') || fromEl.closest('.card') || fromEl.closest('.btn'))) || fromView.querySelector('.fab');
    S.originView = fromName;

    if (calm() || !origin) {
      showView('chat', S.instant ? null : 'fade');
      S.origin = null;
    } else {
      haptic('light');
      const r = rectIn(origin);
      r.radius = origin.classList.contains('fab') ? 24 : 12;
      S.origin = r;
      const chat = views.chat;
      chat.hidden = false;
      chat.style.zIndex = 5;
      fromView.style.zIndex = 1;
      $('#statusbar').classList.remove('on-dark');
      const veil = html('<div class="veil"></div>');
      chat.appendChild(veil);
      const grow = chat.animate(
        [{ clipPath: clipFor(r) }, { clipPath: `inset(0px round ${screenRadius()}px)` }],
        { duration: 400, easing: CSSE.enter });
      veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, delay: 110, easing: CSSE.standard, fill: 'forwards' });
      fromView.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0.4, transform: 'scale(0.98)' }],
        { duration: 400, easing: CSSE.enter, fill: 'forwards' });
      await settle(grow);
      veil.remove();
      fromView.getAnimations().forEach((a) => a.cancel());
      showView('chat', null);
    }
    if (S.chatStarted) return;
    S.chatStarted = true;
    await wait(100);
    const g = add(aiMsg({ heading: 'Hi, Alex. What would you like to sort out today?', cls: 'pad24' }));
    S.anchor = g;
    add(`
      <div class="starters" id="starters">
        <div class="starter"><img src="assets/img/starter-goal.png" alt="" /><span class="txt"><span class="t1">Plan a goal</span><span class="t2">Work out how much to save a month</span></span>${icon('chevron-right')}</div>
        <div class="starter"><img src="assets/img/starter-spending.png" alt="" /><span class="txt"><span class="t1">Understand my spending</span><span class="t2">See where your money’s going</span></span>${icon('chevron-right')}</div>
        <div class="starter"><img src="assets/img/starter-card.png" alt="" /><span class="txt"><span class="t1">Look at my card</span><span class="t2">Balance, limit and instalments</span></span>${icon('chevron-right')}</div>
      </div>`, 'stagger');
    setStep('chat');
  }

  async function closeChat() {
    if (S.busy) return;
    hideKeyboard();
    const to = S.originView === 'pot' ? 'pot' : 'home';
    if (to === 'home') { if (S.planned) S.tab = 'pots'; renderHome(); } else renderPot();
    const target = views[to];
    const r = S.origin;
    if (calm() || !r) {
      showView(to, 'fade');
    } else {
      const chat = views.chat;
      target.hidden = false;
      target.style.zIndex = 1;
      chat.style.zIndex = 5;
      $('#statusbar').classList.toggle('on-dark', to === 'home');
      const veil = html('<div class="veil"></div>');
      chat.appendChild(veil);
      veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: CSSE.exit, fill: 'forwards' });
      target.animate([{ opacity: 0.4, transform: 'scale(0.98)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 300, easing: CSSE.standard });
      await settle(chat.animate(
        [{ clipPath: `inset(0px round ${screenRadius()}px)` }, { clipPath: clipFor(r) }],
        { duration: 300, easing: CSSE.exit, fill: 'forwards' }));
      chat.getAnimations().forEach((a) => a.cancel());
      veil.remove();
      showView(to, null);
    }
    if (to === 'home') playHomeInsert();
    setStep(to === 'pot' ? 'pot' : S.planned ? 'home2' : 'home');
  }

  /* ------------------------------------------------------------------ *
   * Journey · goal
   * ------------------------------------------------------------------ */
  async function sendGoal() {
    if (S.busy) return;
    S.busy = true;
    hideKeyboard();
    S.typedText = '';
    haptic('light');
    leave($('#starters'));
    renderComposer('busy');
    const u = addUser(GOAL_MSG, clock(0));
    // Loading shows only if the answer takes longer than 300ms (avoids a flash)
    let loading = null;
    const lt = S.instant ? null : setTimeout(() => {
      loading = add(`<div class="ai pad24"><div class="ident"><span class="dot accent pulse"></span><span class="shimmer">One moment, I’m on it ✨</span></div></div>`, 'enter-fade');
      follow();
    }, 300);
    await wait(1400);
    clearTimeout(lt);
    if (loading) { loading.classList.add('leave'); await wait(150); loading.remove(); }
    await say({
      dot: 'warning pulse awaiting', ident: 'Asking for a few details',
      heading: 'Got it, a €3,000 holiday next summer. 🌴',
      text: 'I’ve filled in what I understood. Can you check it’s right and add anything that’s missing?',
    });
    await wait(250);
    await openSheet(1);
    S.busy = false;
    setStep('goal');
  }

  /* ---------- Action sheet ---------- */
  function sheetPage1() {
    const left = Math.max(0, S.goal - S.saved);
    const savedOpts = [['0', 'Not yet'], ['100', '€100'], ['300', '€300']];
    return `
      <div class="field">
        <span class="t-label">How much do you want to save?</span>
        <div class="input-box">${eur(S.goal)}</div>
      </div>
      <div class="field">
        <span class="t-label">When are you travelling?</span>
        <div class="chips">${Object.keys(TRIP_MONTHS).map((m) => `<button class="chip ${S.trip === m ? 'on' : ''}" data-act="trip" data-v="${m}">${m}</button>`).join('')}</div>
      </div>
      <div class="field">
        <span class="t-label">Anything already put aside?</span>
        <div class="chips">${savedOpts.map(([v, l]) => `<button class="chip ${String(S.saved) === v ? 'on' : ''}" data-act="saved" data-v="${v}">${l}</button>`).join('')}<button class="chip">Other amount</button></div>
      </div>
      <div class="field">
        <div class="row-between"><span class="t-body muted">Left to save</span><span class="t-strong" id="leftToSave" data-val="${left}">${eur(left)}</span></div>
        <div class="progressbar"><span id="leftBar" style="width:${(S.saved / S.goal) * 100}%"></span></div>
        <span class="t-sup" id="savedNote">${savedNote()}</span>
      </div>`;
  }
  const savedNote = () => (S.saved > 0 ? `Nice, ${eur(S.saved)} is already a head start 🙌` : 'We’ll start from zero, that’s fine.');

  function sheetPage2() {
    return `
      <div class="icon-line" style="font-size:12px;line-height:20px">${icon('lock')}<span>I only use this to work out your monthly savings. Nothing is shared, and you can change any number later.</span></div>
      <div style="display:flex;flex-direction:column;gap:4px">
        <button class="check ${S.sources.current ? 'on' : ''}" data-act="source" data-v="current"><span class="box">${icon('check', 'sm')}</span><span style="display:flex;flex-direction:column"><span class="t-label">Current account</span><span class="t-sup">Your income and everyday spending</span></span></button>
        <button class="check ${S.sources.card ? 'on' : ''}" data-act="source" data-v="card"><span class="box">${icon('check', 'sm')}</span><span style="display:flex;flex-direction:column"><span class="t-label">Credit card</span><span class="t-sup">Your bills and instalments</span></span></button>
      </div>
      <div class="field">
        <span class="t-label">How far back should I look?</span>
        <div class="segmented" id="periodSeg"><span class="pill"></span>${[1, 3, 6].map((p) => `<button class="chip ${S.period === p ? 'on' : ''}" data-act="period" data-v="${p}">${p} month${p > 1 ? 's' : ''}</button>`).join('')}</div>
        <span class="t-sup">3 months gives the most accurate estimate.</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn primary block" id="calcBtn" data-act="calculate" ${S.sources.current || S.sources.card ? '' : 'disabled'}>Yes, calculate my plan</button>
        <button class="btn ghost block is-inert" type="button" tabindex="-1" aria-disabled="true">No thanks, I’ll enter it myself</button>
      </div>`;
  }

  function renderSheet(dir) {
    const p = S.sheetPage;
    const title = p === 1 ? 'Here’s what I got' : 'Can I take a look at your spending?';
    const sub = p === 1 ? 'Tap anything to change it' : 'You decide what I can see.';
    $('#sheet').innerHTML = `
      <div class="grabber"></div>
      <div class="s-head">
        <div class="s-title">
          <h2>${title}</h2>
          <div class="s-nav">
            <button class="icon-btn sm" data-act="sheet-prev" aria-label="Previous step" ${p === 1 ? 'disabled' : ''}>${icon('chevron-left')}</button>
            <span>${p} of 2</span>
            <button class="icon-btn sm" data-act="sheet-next" aria-label="Next step" ${p === 2 ? 'disabled' : ''}>${icon('chevron-right')}</button>
          </div>
          <button class="icon-btn sm" data-act="sheet-close" aria-label="Close">${icon('x')}</button>
        </div>
        <span class="s-sub">${sub}</span>
      </div>
      <div class="pages"><div class="page ${dir && !calm() ? 'in-' + dir : ''}">${p === 1 ? sheetPage1() : sheetPage2()}</div></div>`;
    movePill(false);
    if (S.sheetOpen) syncBottomSpace();
  }

  // Targeted updates keep the 150ms chip / 250ms value transitions alive.
  function syncSheet() {
    const sh = $('#sheet');
    $$('[data-act="trip"]', sh).forEach((b) => b.classList.toggle('on', b.dataset.v === S.trip));
    $$('[data-act="saved"]', sh).forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === S.saved));
    $$('[data-act="source"]', sh).forEach((b) => b.classList.toggle('on', S.sources[b.dataset.v]));
    $$('[data-act="period"]', sh).forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === S.period));
    const left = $('#leftToSave');
    if (left) {
      tweenNumber(left, Math.max(0, S.goal - S.saved));
      $('#leftBar').style.width = (S.saved / S.goal) * 100 + '%';
      $('#savedNote').textContent = savedNote();
    }
    const calc = $('#calcBtn');
    if (calc) calc.disabled = !(S.sources.current || S.sources.card);
    movePill(true);
  }

  function movePill(animated) {
    const seg = $('#periodSeg');
    if (!seg) return;
    const b = seg.querySelector(`[data-v="${S.period}"]`);
    const pill = seg.querySelector('.pill');
    if (!animated || calm()) pill.style.transition = 'none';
    pill.style.left = b.offsetLeft + 'px';
    pill.style.width = b.offsetWidth + 'px';
    if (!animated || calm()) { void pill.offsetWidth; pill.style.transition = ''; }
  }

  // Content behind the sheet comes first: make room for the sheet, scroll so the assistant's
  // last message sits fully visible above it, and only then slide the sheet in.
  // While the sheet is open the conversation behind it stays fixed (no user scroll);
  // scrolling comes back once the sheet closes or collapses. Programmatic scroll still works.
  const lockList = (on) => $('#messages')?.classList.toggle('locked', on);

  async function openSheet(page) {
    S.sheetPage = page || S.sheetPage;
    S.sheetOpen = true;
    lockList(true);
    const sh = $('#sheet');
    renderSheet();
    renderComposer('hidden'); // the composer slides out underneath
    syncBottomSpace();
    const lastAi = $$('#msgList .ai').pop();
    if (lastAi) {
      revealAbove(lastAi);
      await wait(calm() ? 0 : 380);
      if (!S.sheetOpen) return;
    }
    void sh.offsetWidth; // commit the closed position so the spring transition runs
    sh.classList.add('open');
    syncBottomSpace();
  }

  // Scroll so `el` ends just above whatever covers the bottom (sheet / composer);
  // if it is taller than the visible area, show its top instead.
  function scrollTargetAbove(el) {
    const m = $('#messages');
    if (!m || !el || !el.isConnected) return m ? m.scrollTop : 0;
    const max = m.scrollHeight - m.clientHeight;
    const fits = el.offsetHeight + 32 <= m.clientHeight;
    const target = fits ? el.offsetTop + el.offsetHeight + 16 - m.clientHeight : el.offsetTop - 16;
    return Math.max(0, Math.min(max, target));
  }
  function revealAbove(el) {
    const m = $('#messages');
    if (!m || !el || !el.isConnected) return;
    scrollToY(m, scrollTargetAbove(el));
  }

  // Answer sent: the sheet slides down (250ms, exit).
  function dismissSheet() {
    const sh = $('#sheet');
    S.sheetOpen = false;
    lockList(false);
    sh.classList.add('closing');
    sh.classList.remove('open');
    setTimeout(() => sh.classList.remove('closing'), 260);
    renderComposer('busy');
  }

  // Close (X, "No thanks", or a drag past the threshold) — iOS sheet behaviour: the whole sheet
  // keeps sliding down from where the finger left it, at the release velocity (no fade, no shrink).
  // Once it is out, the pending-question bar ("Show questions") rises above the composer.
  async function collapseSheet(fromY = 0, velocity = 0) {
    const sh = $('#sheet');
    S.sheetOpen = false;
    lockList(false);
    if (calm()) { sh.classList.remove('open'); sh.style.transform = ''; sh.style.transition = ''; renderComposer('question'); return; }
    const H = sh.offsetHeight;
    const dist = Math.max(1, H + 40 - fromY);
    // Velocity-matched duration: a flick finishes faster, a slow release eases out (clamped 220–360ms)
    const dur = Math.round(Math.max(220, Math.min(SHEET_OUT, velocity > 0.05 ? (dist / velocity) * 1.6 : SHEET_OUT)));
    const m = $('#messages');
    const b0 = parseFloat(m.style.bottom) || 0, s0 = m.scrollTop;
    renderComposer('question'); // sizes the list for the collapsed bar (b1)
    const b1 = parseFloat(m.style.bottom) || 0;
    moveHistory(b0, s0, b1, Math.max(0, s0 - (b0 - b1)), dur, EASE.sheet); // the history follows the sheet down
    const area = $('#composerArea');
    area.style.opacity = '0';
    sh.style.transition = 'none';
    await settle(sh.animate(
      [{ transform: `translateY(${fromY}px)` }, { transform: `translateY(${H + 40}px)` }],
      { duration: dur, easing: 'cubic-bezier(0.25, 0.8, 0.3, 1)', fill: 'forwards' }));
    sh.classList.remove('open');
    sh.style.transform = '';
    sh.getAnimations().forEach((a) => a.cancel());
    void sh.offsetWidth;
    sh.style.transition = '';
    area.style.opacity = '';
    const bar = area.querySelector('.qbar');
    anim(bar, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: CSSE.enter });
  }

  // "Show questions": the reverse — the bar grows back into the sheet and, on the same spring,
  // pushes the conversation up so the assistant's last message stays visible above it.
  async function expandSheet() {
    const area = $('#composerArea');
    const qb = area.querySelector('.qbar');
    const h0 = qb ? qb.offsetHeight : 150;
    const m = $('#messages');
    const b0 = parseFloat(m.style.bottom) || 0, s0 = m.scrollTop;
    S.sheetOpen = true;
    lockList(true);
    renderSheet();
    const sh = $('#sheet');
    if (calm()) { sh.classList.add('open'); renderComposer('hidden'); revealAbove($$('#msgList .ai').pop()); return; }
    sh.style.transition = 'none';
    sh.classList.add('open');
    const h1 = sh.offsetHeight;
    const kids = $$(':scope > *', sh);
    kids.forEach((k) => (k.style.opacity = '0'));
    renderComposer('hidden'); // sizes the list for the open sheet (b1)
    const b1 = parseFloat(m.style.bottom) || 0;
    const s1 = scrollTargetAbove($$('#msgList .ai').pop());
    moveHistory(b0, s0, b1, s1, SHEET_IN, EASE.sheet);
    // Content fades in during the last part of the growth so it never looks squashed
    kids.forEach((k) => {
      k.style.opacity = '';
      k.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: SHEET_IN * 0.55, easing: CSSE.standard, fill: 'backwards' });
    });
    await settle(sh.animate(
      [{ height: h0 + 'px', transform: 'translateY(-6px)' }, { height: h1 + 'px', transform: 'translateY(0)' }],
      { duration: SHEET_IN, easing: CSSE.sheet }));
    sh.style.transition = '';
    movePill(false);
  }

  // The conversation's visible area and scroll move together, so the sheet visibly pushes
  // (or releases) the history instead of the list jumping.
  const springEase = (() => {
    const pts = [[0, 0], [0.04, 0.2], [0.1, 0.55], [0.16, 0.8], [0.22, 0.94], [0.29, 1.01], [0.35, 1.02], [0.47, 1.008], [1, 1]];
    return (t) => {
      for (let i = 1; i < pts.length; i++) {
        if (t <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + ((t - x0) / (x1 - x0)) * (y1 - y0); }
      }
      return 1;
    };
  })();
  function moveHistory(b0, s0, b1, s1, dur, ease = springEase) {
    const m = $('#messages');
    m.style.transition = 'none';
    m.style.bottom = b0 + 'px';
    m.scrollTop = s0;
    tween('history', dur, (e) => {
      m.style.bottom = b0 + (b1 - b0) * e + 'px';
      m.scrollTop = s0 + (s1 - s0) * e;
      if (e === 1) m.style.transition = '';
    }, ease);
  }

  // Drag down follows the finger 1:1; on release, distance / velocity decide.
  function bindSheetDrag() {
    // iOS sheet interaction: drag from anywhere that is not a control; down follows the finger
    // 1:1, up rubber-bands; on release the position projected by the velocity (UIScrollView
    // deceleration, rate 0.998) decides: past half the sheet height it dismisses, otherwise it
    // settles back with a critically damped curve (no bounce).
    const sh = $('#sheet');
    const rubber = (x, d) => (1 - 1 / ((x * 0.55) / d + 1)) * d;
    const project = (v) => (v * 0.998) / (1 - 0.998); // v in px/ms → px
    let y0 = null, dy = 0, moved = false, samples = [];
    sh.addEventListener('pointerdown', (e) => {
      if (!S.sheetOpen || e.button > 0) return;
      if (e.target.closest('button, input, label, [data-act]')) return; // controls keep working
      y0 = e.clientY; dy = 0; moved = false;
      samples = [{ y: e.clientY, t: performance.now() }];
      try { sh.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
    });
    sh.addEventListener('pointermove', (e) => {
      if (y0 == null) return;
      const raw = (e.clientY - y0) / DEVICE_SCALE;
      if (!moved && Math.abs(raw) < 4) return;
      if (!moved) { moved = true; sh.style.transition = 'none'; }
      dy = raw >= 0 ? raw : -rubber(-raw, 60);
      sh.style.transform = `translateY(${dy}px)`;
      const now = performance.now();
      samples.push({ y: e.clientY, t: now });
      samples = samples.filter((s) => now - s.t <= 100);
    });
    const end = () => {
      if (y0 == null) return;
      y0 = null;
      if (!moved) return;
      const a = samples[0], b = samples[samples.length - 1];
      const v = a && b && b.t > a.t ? (b.y - a.y) / DEVICE_SCALE / (b.t - a.t) : 0; // px/ms, + = down
      const H = sh.offsetHeight;
      if (dy > 0 && dy + project(Math.max(0, v)) > H * 0.5) {
        collapseSheet(dy, Math.max(0, v));
      } else {
        // Settle back to the detent
        sh.style.transition = reduced() ? 'none' : `transform 420ms ${CSSE.sheet}`;
        sh.style.transform = '';
        setTimeout(() => { sh.style.transition = ''; }, 440);
      }
    };
    sh.addEventListener('pointerup', end);
    sh.addEventListener('pointercancel', end);
  }

  // Paging 1 ↔ 2: content slides 24px + crossfade, height adjusts with a spring.
  // Paging 1 ↔ 2 as one continuous move: the old step slides out (−24px, fade, 160ms) while the
  // new one slides in from the other side (+24px, fade, 260ms), the sheet height eases to the new
  // size on the sheet curve, and the conversation above follows on the same curve — no jumps.
  const SHEET_PAGE = 420;
  function pageSheet(dir) {
    const sh = $('#sheet'), m = $('#messages');
    const sign = dir === 'left' ? -1 : 1;
    const h0 = sh.offsetHeight;
    const b0 = parseFloat(m.style.bottom) || 0, s0 = m.scrollTop;
    const ghost = document.createElement('div');
    ghost.className = 'sheet-ghost';
    [...sh.children].filter((n) => !n.classList.contains('grabber')).forEach((n) => ghost.appendChild(n.cloneNode(true)));
    renderSheet(); // new content (also sizes the list for the new height)
    if (calm()) return;
    const h1 = sh.offsetHeight;
    const b1 = parseFloat(m.style.bottom) || 0;
    const s1 = scrollTargetAbove($$('#msgList .ai').pop());
    sh.appendChild(ghost);
    ghost.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-24 * sign}px)` }],
      { duration: 160, easing: CSSE.exit, fill: 'forwards' });
    settle(ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 170, fill: 'forwards' })).then(() => ghost.remove());
    [...sh.children].filter((n) => !n.classList.contains('grabber') && n !== ghost).forEach((n) =>
      n.animate([{ opacity: 0, transform: `translateX(${24 * sign}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 260, delay: 90, easing: CSSE.standard, fill: 'backwards' }));
    if (h0 !== h1) anim(sh, [{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: SHEET_PAGE, easing: CSSE.sheet });
    moveHistory(b0, s0, b1, s1, SHEET_PAGE, EASE.sheet);
  }

  async function sheetNext() {
    if (S.sheetPage === 2) return;
    if (!S.sheetOpen) await openSheet(1);
    S.sheetPage = 2;
    pageSheet('right');
    setStep('permission');
    if (!S.permissionMsgShown) {
      S.permissionMsgShown = true;
      await wait(calm() ? 0 : SHEET_PAGE); // let the page change land before the assistant writes
      const msg = await say({ dot: 'warning pulse awaiting', ident: 'Asking for a few details', text: 'Nice, now let’s see what fits your month. To do that, I’d like to look at your spending. You decide what I can see.' });
      revealAbove(msg); // the new message stays readable above the sheet
    } else {
      revealAbove($$('#msgList .ai').pop());
    }
  }
  function sheetPrev() {
    if (S.sheetPage === 1) return;
    S.sheetPage = 1;
    pageSheet('left');
  }

  function replySummary() {
    const p = plan();
    const src = [S.sources.current && 'current account', S.sources.card && 'credit card'].filter(Boolean).join(' and ');
    const saved = S.saved > 0 ? `with ${eur(S.saved)} already saved` : 'with nothing saved yet';
    const period = S.period === 1 ? 'the last month' : `the last ${S.period} months`;
    return `${eur(S.goal)} for ${p.tripFull} 2027, ${saved}. Use my ${src} from ${period}.`;
  }

  /* ------------------------------------------------------------------ *
   * Journey · thinking → monthly surplus
   * ------------------------------------------------------------------ */
  const THINK_STEPS = () => [
    'Reading your current account and card',
    'Finding what’s left each month',
    `Matching it to your ${eur(S.goal)} goal`,
    'Building your savings strategy',
  ];

  async function calculate() {
    if (S.busy) return;
    if (!S.permissionMsgShown) await sheetNext();
    S.busy = true;
    dismissSheet();
    // The questions are answered: "Asking for a few details" becomes a record of what was asked
    recordQuestions();
    await wait(150);
    addUser(replySummary(), clock(2));
    await wait(450);
    const think = add(`
      <div class="ai" style="padding-bottom:0">
        <div class="ident" id="thinkIdent"><span class="dot warning pulse"></span><span class="shimmer">Thinking…</span></div>
        <p class="t-body">Using what you shared to build your strategy…</p>
      </div>`, 'enter-fade');
    const steps = add('<div class="steps"></div>', null);
    follow();
    await wait(300);
    await runSteps(steps, THINK_STEPS(), 650, () => {
      // "Thinking…" disappears when the first step completes
      const id = $('#thinkIdent');
      if (!id) return;
      if (calm()) { id.remove(); return; }
      id.animate([{ opacity: 1, height: '20px', marginBottom: '0px' }, { opacity: 0, height: '0px', marginBottom: '-12px' }],
        { duration: 200, easing: CSSE.standard, fill: 'forwards' }).finished.then(() => id.remove()).catch(() => {});
    });
    await wait(250);
    await collapseInto([think, steps], toolCallEl());
    await showSurplus();
    renderComposer('idle');
    S.busy = false;
    setStep('surplus');
  }

  /* Like ChatGPT / Claude / Perplexity leave a past-tense trace of a finished step ("Thought for
     9s", "Searched the web ›", "User answered the questions"), the pending "Asking for a few
     details" status turns into a collapsed, expandable record of the questions and answers. */
  function recordQuestions() {
    const idents = $$('#msgList .ident').filter((d) => d.querySelector('.dot.awaiting'));
    if (!idents.length) return;
    const p = plan();
    const src = [S.sources.current && 'Current account', S.sources.card && 'Credit card'].filter(Boolean).join(', ');
    const qa = [
      ['How much do you want to save?', eur(S.goal)],
      ['When are you travelling?', `${p.tripFull} 2027`],
      ['Anything already put aside?', S.saved > 0 ? eur(S.saved) : 'Not yet'],
      ['What can I look at?', src],
      ['How far back?', `${S.period} month${S.period > 1 ? 's' : ''}`],
    ];
    const rec = html(`
      <div class="toolcall record">
        <button class="row" data-act="toggle-tool" aria-expanded="false">
          <span class="ok">${icon('check', 'sm')}</span>
          <span>Asked for a few details</span>
          <span class="sub">2 questions · answered</span>
          <span class="meta">${icon('chevron-down', 'chev')}</span>
        </button>
        <div class="tool-body" hidden>
          <div class="qa">${qa.map(([q, a]) => `<div class="qa-row"><span class="q">${q}</span><span class="a">${a}</span></div>`).join('')}</div>
        </div>
      </div>`);
    // First status becomes the record (crossfade); the second one folds away
    const [first, ...rest] = idents;
    first.replaceWith(rec);
    anim(rec, [{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: CSSE.standard });
    rest.forEach((d) => {
      if (calm()) { d.remove(); return; }
      settle(d.animate([{ opacity: 1, height: d.offsetHeight + 'px', marginBottom: '0px' }, { opacity: 0, height: '0px', marginBottom: '-12px' }],
        { duration: 200, easing: CSSE.standard, fill: 'forwards' })).then(() => d.remove());
    });
  }

  function toolCallEl() {
    const el = html(`
      <div class="toolcall" id="toolcall">
        <button class="row" data-act="toggle-tool" aria-expanded="false">
          <span class="ok">${icon('check', 'sm')}</span>
          <span>Reading transactions</span>
          <span class="sub">${[S.sources.current && 'Current account', S.sources.card && 'Credit card'].filter(Boolean).join(' · ')} · ${S.period} month${S.period > 1 ? 's' : ''}</span>
          <span class="meta">2.8s <span style="display:flex;gap:2px;align-items:center">${icon('wrench', 'sm')}4</span>${icon('chevron-down', 'chev')}</span>
        </button>
        <div class="tool-body" hidden><div class="steps">${THINK_STEPS().map((l) => stepRow(l, 'done')).join('')}</div></div>
      </div>`);
    return el;
  }

  function surplusChart(sel) {
    const W = 346, H = 124, base = 112;
    const xs = SURPLUS_MONTHS.map((_, i) => ((i + 0.5) * W) / SURPLUS_MONTHS.length);
    const acc = []; SURPLUS_MONTHS.reduce((a, _, i) => { a += monthSurplus(i); acc.push(a); return a; }, 0);
    const y = (v) => base - (v / 3000) * 80; // headroom at the top for the value label
    const line = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y(acc[i]).toFixed(1)}`).join(' ');
    const area = `${line} L${xs[xs.length - 1].toFixed(1)},${base} L${xs[0].toFixed(1)},${base} Z`;
    const cx = xs[sel], cy = y(acc[sel]);
    // Selected-month label: never on top of the line. Try centred above the dot, left of it and
    // right of it; for each, lift it above the highest point of the line under its width; keep
    // the one that stays closest to the dot. It sits on a white halo for legibility.
    const text = `${SURPLUS_FULL[sel]} · ${eur(acc[sel])}`;
    const lw = textWidth(text, '600 12px Figtree, system-ui, sans-serif') + 8, lh = 18;
    const lineY = (x) => {
      if (x <= xs[0]) return y(acc[0]);
      for (let i = 1; i < xs.length; i++) {
        if (x <= xs[i]) return y(acc[i - 1]) + ((x - xs[i - 1]) / (xs[i] - xs[i - 1])) * (y(acc[i]) - y(acc[i - 1]));
      }
      return y(acc[acc.length - 1]);
    };
    const place = (left) => {
      left = Math.max(0, Math.min(W - lw, left));
      let minY = Infinity;
      for (let x = left; x <= left + lw; x += 3) minY = Math.min(minY, lineY(x));
      return { left, top: Math.min(cy - 12 - lh, minY - 6 - lh) };
    };
    const lbl = [place(cx - lw / 2), place(cx - 10 - lw), place(cx + 10)]
      .filter((c) => c.top >= 0)
      .sort((a, b) => b.top - a.top)[0] || { left: Math.max(0, Math.min(W - lw, cx - lw / 2)), top: 0 };
    const febLeft = xs[3] + 6, febW = textWidth('Feb: pace rises', '400 12px Figtree, system-ui, sans-serif');
    const febHidden = lbl.left < febLeft + febW && lbl.left + lw > febLeft && lbl.top < 22 + 16 && lbl.top + lh > 22;
    return {
      acc,
      svg: `
        <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
          <path class="s-area" d="${area}" fill="var(--accent-muted)"/>
          <line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="var(--border-default)"/>
          <line x1="${xs[3]}" x2="${xs[3]}" y1="18" y2="${base}" stroke="var(--border-emphasized)" stroke-dasharray="3 3"/>
          <path class="s-line" d="${line}" fill="none" stroke="var(--inverted)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
          <line class="s-cursor" x1="${cx}" x2="${cx}" y1="${cy}" y2="${base}" stroke="var(--inverted)" stroke-width="1"/>
          <circle class="s-dot" cx="${cx}" cy="${cy}" r="5" fill="#fff" stroke="var(--inverted)" stroke-width="2"/>
        </svg>
        <span class="lbl s-feb" style="left:${febLeft}px;top:22px;${febHidden ? 'visibility:hidden' : ''}">Feb: pace rises</span>
        <span class="lbl strong s-sel halo" style="left:${lbl.left}px;top:${lbl.top}px">${text}</span>`,
    };
  }

  // Width of a string in a given CSS font (canvas measurement, cached context)
  let measureCtx;
  function textWidth(str, font) {
    measureCtx = measureCtx || document.createElement('canvas').getContext('2d');
    measureCtx.font = font;
    return Math.ceil(measureCtx.measureText(str).width);
  }

  function surplusCardHtml() {
    return `
      <div class="card" id="surplusCard">
        <div>
          <p class="t-sup" id="sAccLabel"></p>
          <p class="t-h1" id="sAcc"></p>
          <p class="t-sup" id="sMonth"></p>
        </div>
        <div class="chart" id="sChart"></div>
        <div class="months" id="sMonths">${SURPLUS_MONTHS.map((m) => `<span>${m[0]}</span>`).join('')}</div>
        <div class="slider" id="sSlider">
          <div class="track"></div><div class="fill"></div><div class="thumb"></div>
          <input type="range" min="0" max="8" step="0.01" value="${S.surplusMonth}" data-input="surplus-month" aria-label="Month" />
        </div>
        <div class="row-between">
          <span class="t-body muted">Goal by ${plan().tripFull}</span>
          <button class="btn sm secondary">${icon('square-pen')}${eur(Math.max(0, S.goal - S.saved))}</button>
        </div>
        <div class="banner success">${icon('circle-check', 'md')}<span class="b-body">Feb 2027: 2 card instalments end (−€356 per month)</span></div>
        <div class="divider"></div>
        <p class="t-label" id="sGoesLabel"></p>
        <div class="stacked" id="sStack"><span style="background:var(--chart-fixed)"></span><span style="background:var(--chart-card)"></span><span style="background:var(--chart-surplus)"></span></div>
        <div class="legend" id="sLegend"></div>
      </div>`;
  }

  function setSurplusThumb(v) {
    const sl = $('#sSlider');
    if (!sl) return;
    const pct = v / 8;
    sl.querySelector('.fill').style.width = `calc((100% - 16px) * ${pct})`;
    sl.querySelector('.thumb').style.left = `calc(8px + (100% - 16px) * ${pct})`;
  }

  function updateSurplus(intro = false) {
    const i = S.surplusMonth;
    const ch = surplusChart(i);
    $('#sChart').innerHTML = ch.svg;
    $('#sAccLabel').textContent = `Accumulated by ${SURPLUS_FULL[i]}`;
    const acc = $('#sAcc');
    const dir = Math.sign(i - (acc._month ?? i));
    acc._month = i;
    if (intro && !calm()) {
      // First time: every digit rolls up from 0 alongside the line drawing (600ms)
      odoBuild(acc, eur(ch.acc[i]).replace(/\d/g, '0'));
      setTimeout(() => odometer(acc, ch.acc[i], 1, 600), 30);
    } else {
      odometer(acc, ch.acc[i], dir);
    }
    $('#sMonth').textContent = `This month: +${eur(monthSurplus(i))}`;
    $$('#sMonths span').forEach((s, k) => s.classList.toggle('on', k === i));
    const card = monthCard(i), surplus = monthSurplus(i) === 90 ? 89 : SURPLUS;
    $('#sGoesLabel').textContent = `Where the €1,350 goes in ${SURPLUS_FULL[i]}`;
    const st = $$('#sStack span');
    st[0].style.flexGrow = FIXED; st[1].style.flexGrow = card; st[2].style.flexGrow = surplus;
    $('#sLegend').innerHTML = `
      <div class="legend-row"><span class="sw" style="background:var(--chart-fixed)"></span>Fixed<span class="v">${eur(FIXED)}</span></div>
      <div class="legend-row"><span class="sw" style="background:var(--chart-card)"></span>Card<span class="v">${eur(card)}</span></div>
      <div class="legend-row"><span class="sw" style="background:var(--chart-surplus)"></span>Surplus<span class="v" style="color:var(--inverted)">${eur(surplus)}</span></div>`;
    if (intro) drawSurplusIntro();
  }

  // Data moment: line draws left→right (600ms), area fades in at the end, end dot springs in.
  function drawSurplusIntro() {
    if (calm()) return;
    const line = $('#sChart .s-line');
    const len = line.getTotalLength();
    line.style.strokeDasharray = `${len}`;
    line.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 600, easing: CSSE.enter, fill: 'backwards' })
      .finished.then(() => { line.style.strokeDasharray = ''; }).catch(() => {});
    $('#sChart .s-area').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 600, fill: 'backwards' });
    $('#sChart .s-dot').animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 300, delay: 600, easing: CSSE.spring, fill: 'backwards' });
    ['.s-cursor', '.s-sel', '.s-feb'].forEach((s) =>
      $('#sChart ' + s).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 600, fill: 'backwards' }));
  }

  async function showSurplus() {
    await say({ text: 'Right now you have about €90 left over a month. In February two instalments finish and the surplus rises to about €445. Drag the slider to see how it builds up.', cls: 'pad24' });
    await wait(150);
    add(surplusCardHtml(), 'enter-card');
    updateSurplus(true);
    setSurplusThumb(S.surplusMonth);
    follow();
    await wait(300 + 100); // banner enters 100ms after the card settles
    add(`<div class="banner info">${icon('info', 'md')}<div class="b-body">First deposit on ${S.day} Feb 2027<span class="b-sub">Then on the ${ordinal(S.day)} of each month.</span></div><button class="btn sm ghost">Change</button></div>`);
    await wait(500);
    add(responseActions(), 'enter-fade');
    add(`<div class="inline-actions" id="surplusActions">
        <button class="btn primary" data-act="accept">Accept plan</button>
        <button class="btn secondary" data-act="modify">${icon('square-pen')}Modify</button>
      </div>`, 'enter-fade');
    follow();
  }

  /* ------------------------------------------------------------------ *
   * Journey · interactive plan (the decision)
   * ------------------------------------------------------------------ */
  function planScale() {
    const W = 346, H = 130, base = 118;
    const labels = ['Today', ...MONTHS_SHORT.slice(1, TRIP_MONTHS[S.trip] + 1)];
    const xs = labels.map((_, i) => ((i + 0.5) * W) / labels.length);
    const y = (v) => base - (v / S.goal) * 96;
    return { W, H, base, labels, xs, y };
  }
  const planValues = (d) => planScale().labels.map((_, i) => Math.min(S.goal, S.saved + i * d));
  function planGeom(vals) {
    const { xs, y, base } = planScale();
    const line = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y(vals[i]).toFixed(1)}`).join(' ');
    const area = `${line} L${xs[xs.length - 1].toFixed(1)},${base} L${xs[0].toFixed(1)},${base} Z`;
    return { line, area, last: [xs[xs.length - 1], y(vals[vals.length - 1])] };
  }
  function planChart(d) {
    const sc = planScale();
    const vals = planValues(d);
    const path = `M${sc.xs[0].toFixed(1)},${sc.y(S.saved).toFixed(1)} L${sc.xs[sc.xs.length - 1].toFixed(1)},${sc.y(S.goal).toFixed(1)}`;
    return { ...sc, ...planGeom(vals), vals, path, goalY: sc.y(S.goal), p: plan(d) };
  }
  // The chart line interpolates from the old plan to the new one (300ms standard), no redraw.
  let chartVals = null;
  function applyPlanGeom(vals) {
    const g = planGeom(vals);
    $('#pLine')?.setAttribute('d', g.line);
    $('#pArea')?.setAttribute('d', g.area);
    $('#pDot')?.setAttribute('cx', g.last[0]);
    $('#pDot')?.setAttribute('cy', g.last[1]);
  }
  function morphPlan(to, animate) {
    const from = chartVals || to;
    chartVals = to;
    if (!animate) { tweens.get('plan-chart')?.cancel(); applyPlanGeom(to); return; }
    tween('plan-chart', 300, (e) => applyPlanGeom(from.map((v, i) => v + (to[i] - v) * e)));
  }

  function planSummaryHtml() {
    const c = planChart(S.deposit);
    return `
      <div class="card" id="planSummary">
        <div class="row-between"><span class="t-label">Your plan</span><span class="t-sup">Nov to ${S.trip} 2027</span></div>
        <div style="display:flex;flex-direction:column;gap:4px">
          <span class="t-sup">By ${c.p.tripFull} you’ll have</span>
          <div class="row-between"><span class="t-h1" id="pTotal"></span><span class="badge neutral" id="pBadge"></span></div>
        </div>
        <div class="chart" style="height:${c.H}px">
          <svg viewBox="0 0 ${c.W} ${c.H}" width="${c.W}" height="${c.H}" aria-hidden="true">
            <path id="pArea" fill="var(--accent-muted)" d="${c.area}"/>
            <line x1="0" x2="${c.W}" y1="${c.base}" y2="${c.base}" stroke="var(--border-default)"/>
            <line x1="0" x2="${c.W}" y1="${c.goalY}" y2="${c.goalY}" stroke="var(--text-primary)" stroke-dasharray="2 3"/>
            <path d="${c.path}" fill="none" stroke="var(--text-secondary)" stroke-dasharray="4 4" stroke-width="1.5"/>
            <path id="pLine" d="${c.line}" fill="none" stroke="var(--inverted)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
            <circle id="pDot" cx="${c.last[0]}" cy="${c.last[1]}" r="5" fill="#fff" stroke="var(--inverted)" stroke-width="2"/>
          </svg>
          <span class="lbl goal" style="left:0;top:${c.goalY - 20}px">Goal ${eur(S.goal)}</span>
        </div>
        <div class="months">${c.labels.map((m, i) => `<span class="${i === c.labels.length - 1 ? 'on' : ''}">${m}</span>`).join('')}</div>
        <div class="chart-legend"><span><i></i>Your plan</span><span><i class="dash"></i>Path to goal</span></div>
      </div>`;
  }

  function planControlsHtml() {
    const p = plan();
    const opts = [[p.keeps, 'keeps the buffer'], [p.hits, 'hits the goal'], [SURPLUS, 'whole surplus']];
    return `
      <div class="card" id="planControls">
        <span class="t-label">Shortcuts</span>
        <div class="shortcuts">${opts.map(([v, l]) => `<button class="shortcut" data-act="deposit" data-v="${v}"><span class="t-strong">${eur(v)}</span><span class="t-sup">${l}</span></button>`).join('')}</div>
        <div class="row-between">
          <span class="t-label">Monthly deposit</span>
          <div class="stepper">
            <button class="icon-btn secondary" data-act="step" data-v="-10" aria-label="Decrease">${icon('minus')}</button>
            <span class="val" id="pDeposit"></span>
            <button class="icon-btn secondary" data-act="step" data-v="10" aria-label="Increase">${icon('plus')}</button>
          </div>
        </div>
        <div class="slider" id="pSlider">
          <div class="track"></div><div class="fill"></div>
          <div class="mark" style="left:calc(8px + (100% - 16px) * ${p.keeps / SURPLUS})" title="Buffer"></div>
          <div class="mark" style="left:calc(8px + (100% - 16px) * ${p.hits / SURPLUS})" title="Goal"></div>
          <div class="thumb outline"></div>
          <input type="range" min="0" max="${SURPLUS}" step="1" value="${S.deposit}" data-input="deposit" aria-label="Monthly deposit" />
        </div>
        <div class="divider"></div>
        <span class="t-label">From a surplus of about ${eur(SURPLUS)} a month</span>
        <div class="stacked" id="pStack"><span style="background:var(--inverted)"></span><span style="background:var(--border-emphasized)"></span></div>
        <div class="legend">
          <div class="legend-row"><span class="sw" style="background:var(--inverted)"></span>Deposit<span class="v" id="pLegDeposit"></span></div>
          <div class="legend-row"><span class="sw" style="background:var(--border-emphasized)"></span>Free<span class="v" id="pLegFree"></span></div>
        </div>
        <div class="banner success" id="pBanner"></div>
      </div>`;
  }

  function dayCardHtml() {
    return `
      <div class="card" id="dayCard">
        <span class="t-label">Deposit day</span>
        <span class="t-sup">Pick the day each month the deposit leaves your current account.</span>
        <div class="chips">${[5, 10, 15, 25].map((d) => `<button class="chip ${S.day === d ? 'on' : ''}" data-act="day" data-v="${d}">${ordinal(d)}</button>`).join('')}<button class="btn sm ghost">${icon('calendar-days')}Other day</button></div>
        <div class="icon-line" style="font-size:12px;line-height:20px">${icon('calendar-days')}<span id="dayNote"></span></div>
      </div>`;
  }

  /* mode: 'init' (first paint, no motion) · 'drag' (slider, follows the finger, no easing)
           'tap' (shortcut) · 'step' (stepper −/+) */
  function updatePlan(mode = 'tap') {
    const d = S.deposit;
    const p = plan(d);
    const still = mode === 'init' || mode === 'drag';
    const num = (el, v, fmt = eur) => (still ? setNumber(el, v, fmt) : tweenNumber(el, v, 250, fmt));

    // Summary: total and "to go" badge tween 250ms; reaching the goal crossfades the badge (200ms)
    num($('#pTotal'), p.total);
    const badge = $('#pBadge');
    const reached = p.toGo <= 0;
    const flipped = badge.dataset.reached !== undefined && badge.dataset.reached !== String(reached);
    badge.dataset.reached = String(reached);
    badge.className = 'badge ' + (reached ? 'success' : 'neutral');
    if (reached || flipped || mode === 'init') {
      setNumber(badge, Math.max(p.toGo, 0), (v) => (reached ? 'Goal reached' : `${eur(v)} to go`));
      if (flipped && mode !== 'init') anim(badge, [{ opacity: 0.2 }, { opacity: 1 }], { duration: 200, easing: CSSE.standard });
    } else {
      num(badge, p.toGo, (v) => `${eur(v)} to go`);
    }
    morphPlan(planValues(d), !still);

    // Controls
    $$('#planControls .shortcut').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === d));
    const dv = $('#pDeposit');
    const prev = Number(dv.dataset.val ?? d);
    dv.dataset.val = d;
    if (mode === 'step' && prev !== d && !calm()) {
      // Stepper: the number rolls 8px in the direction of change (150ms)
      dv.innerHTML = `<span class="roll ${d > prev ? 'up' : 'down'}">${eur(d)}</span>`;
    } else if (mode === 'tap' && prev !== d) {
      tweenNumber(dv, d, 250, eur, prev);
    } else {
      setNumber(dv, d);
    }
    const sl = $('#pSlider');
    if ((mode === 'tap' || mode === 'step') && !calm()) {
      // Slider animates to the chosen value (spring 250ms)
      sl.classList.add('snap');
      clearTimeout(sl._t);
      sl._t = setTimeout(() => sl.classList.remove('snap'), 270);
    }
    const pct = d / SURPLUS;
    sl.querySelector('.fill').style.width = `calc((100% - 16px) * ${pct})`;
    sl.querySelector('.thumb').style.left = `calc(8px + (100% - 16px) * ${pct})`;
    if (mode !== 'drag') sl.querySelector('input').value = d;

    // Deposit / free bar follows the value (250ms standard, CSS) and its legend tweens
    const st = $$('#pStack span');
    st[0].style.flexGrow = Math.max(d, 1); st[1].style.flexGrow = Math.max(p.free, 1);
    num($('#pLegDeposit'), d);
    num($('#pLegFree'), p.free);

    // Buffer banner: success ↔ warning swaps colour + icon with a 200ms crossfade, warning haptic, no shake
    const b = $('#pBanner');
    const state = p.bufferOk ? 'ok' : 'warn';
    const changed = b.dataset.state !== state;
    b.className = 'banner ' + (p.bufferOk ? 'success' : 'warning');
    if (changed) {
      b.innerHTML = `${icon(p.bufferOk ? 'circle-check' : 'triangle-alert', 'md')}<span class="b-body"></span>`;
      if (b.dataset.state && mode !== 'init') {
        anim(b, [{ opacity: 0.35 }, { opacity: 1 }], { duration: 200, easing: CSSE.standard });
        if (state === 'warn') haptic('warning');
      }
      b.dataset.state = state;
    }
    b.querySelector('.b-body').textContent = p.bufferOk
      ? `Keeps today’s buffer (${eur(BUFFER)}): ${eur(p.free)} a month left over.`
      : `About ${eur(p.free)} a month left over, below the ${eur(BUFFER)} you keep today.`;

    setReviewLabel(d, mode === 'drag');
    const note = $('#dayNote');
    if (note) note.textContent = `First deposit on ${S.day} Feb 2027, then on the ${ordinal(S.day)} of each month. If the ${ordinal(S.day)} falls on a weekend or holiday, it moves to the next working day.`;
  }

  // "Review the €X plan" swaps with a 150ms crossfade (150ms debounce while dragging)
  let labelTimer = 0;
  function setReviewLabel(d, debounce) {
    clearTimeout(labelTimer);
    const apply = () => $$('[data-review-label]').forEach((el) => {
      const t = `Review the ${eur(d)} plan`;
      if (el.textContent === t) return;
      el.textContent = t;
      if (el.offsetParent) anim(el, [{ opacity: 0.25 }, { opacity: 1 }], { duration: 150, easing: CSSE.standard });
    });
    if (debounce && !calm()) labelTimer = setTimeout(apply, 150);
    else apply();
  }

  async function chooseAccept() {
    if (S.busy) return;
    S.busy = true;
    leave($('#surplusActions'));
    renderComposer('busy');
    addUser('Accept plan', clock(1));
    await prepareReview();
  }

  async function chooseModify() {
    if (S.busy) return;
    S.busy = true;
    leave($('#surplusActions'));
    renderComposer('busy');
    addUser('Modify', clock(1));
    await wait(500);
    const p = plan();
    S.deposit = p.keeps;
    await presentPlan(`To hit ${eur(S.goal)} it would be ${eur(p.hits)} a month, but you’d only have about ${eur(SURPLUS - p.hits)} free. I’ve started at ${eur(p.keeps)}, which keeps your current buffer of about ${eur(BUFFER)}. Try it and see what changes:`);
  }

  // The assistant's message + the interactive plan (summary, controls, deposit day, review button)
  async function presentPlan(text) {
    await say({ dot: 'info', working: 'Reasoning…', cls: 'pad24', text });
    await wait(150);
    // Cards come in after the text, 120ms apart
    [planSummaryHtml(), planControlsHtml(), dayCardHtml()].forEach((h, i) => {
      const el = add(h, 'enter-card');
      el.style.animationDelay = `${i * 120}ms`;
    });
    chartVals = null;
    updatePlan('init');
    follow();
    await wait(450);
    add(`<button class="btn primary block" id="inlineReview" data-act="review-plan" data-review-label>Review the plan</button>`, 'enter-fade');
    add(responseActions(), 'enter-fade');
    setReviewLabel(S.deposit, false);
    follow();
    watchInlineReview();
    renderComposer('idle');
    S.busy = false;
    setStep('plan');
  }

  // Earlier copies of the plan stay in the history as read-only (no ids, no controls)
  function retirePlanCards() {
    ['#planSummary', '#planControls', '#dayCard'].forEach((s) => {
      const card = $(s);
      if (!card) return;
      card.classList.add('is-frozen');
      card.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
      card.querySelectorAll('[data-act], [data-input]').forEach((n) => { n.removeAttribute('data-act'); n.removeAttribute('data-input'); });
      card.removeAttribute('id');
    });
    const btn = $('#inlineReview');
    if (btn) btn.remove();
    $$('[data-review-label]').forEach((n) => { if (!n.closest('#stickyBar')) n.removeAttribute('data-review-label'); });
    reviewObserver?.disconnect();
    $('#stickyBar').classList.remove('show');
  }

  // Sticky action bar appears when the inline button leaves the screen
  let reviewObserver;
  function watchInlineReview() {
    reviewObserver?.disconnect();
    const btn = $('#inlineReview');
    if (!btn) return;
    reviewObserver = new IntersectionObserver(([e]) => {
      const show = !e.isIntersecting && !S.reviewed && !btn.hidden && S.view === 'chat';
      $('#stickyBar').classList.toggle('show', show);
      updateScrollBtn(); // re-place the scroll button above or below the bar
    }, { root: $('#messages'), threshold: 0 });
    reviewObserver.observe(btn);
  }

  function setPlanFrozen(frozen) {
    ['#planSummary', '#planControls', '#dayCard'].forEach((s) => $(s)?.classList.toggle('is-frozen', frozen));
    const btn = $('#inlineReview');
    if (btn) btn.hidden = frozen;
    if (frozen) $('#stickyBar').classList.remove('show');
  }

  async function reviewPlan() {
    if (S.busy) return;
    S.busy = true;
    S.reviewed = true;
    setPlanFrozen(true);
    renderComposer('busy');
    const p = plan();
    const why = p.bufferOk ? `keeping my ${eur(BUFFER)} buffer` : `to reach ${eur(S.goal)}`;
    addUser(`Review the plan: ${eur(S.deposit)} a month from Feb to ${S.trip} 2027, ${why}.`, clock(2));
    await prepareReview();
  }

  async function prepareReview() {
    const p = plan();
    await wait(400);
    const m = await say({ text: 'Got it. Preparing your review to double-check…' });
    const steps = add('<div class="steps"></div>', null);
    await runSteps(steps, [
      `Checking ${eur(S.deposit)} a month from Feb to ${S.trip} 2027`,
      `Confirming the ${eur(S.saved)} saved and the ${eur(BUFFER)} buffer`,
      `Calculating your total: ${eur(p.total)} by ${p.tripFull}`,
      'Preparing your review',
    ], 450);
    await wait(200);
    await collapseAway([m, steps]);
    await showReview();
    renderComposer('idle');
    S.busy = false;
    setStep('review');
  }

  /* ------------------------------------------------------------------ *
   * Journey · review, confirm, scheduled
   * ------------------------------------------------------------------ */
  async function showReview() {
    const p = plan();
    await say({ text: 'Here’s your plan, ready for a last look. Nothing is deducted until you confirm.', cls: 'compact' });
    await wait(150);
    add(`
      <div class="card review" id="reviewCard">
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="head"><span class="thumb"><img src="assets/img/pot-holiday.png" alt="" /></span><span class="badge success late">Ready to confirm</span></div>
          <p class="t-h3">Your plan: ${eur(S.deposit)} a month for your summer holiday</p>
          <p class="t-body">${p.bufferOk ? `Your buffer stays safe: about ${eur(p.free)} free a month.` : `About ${eur(p.free)} free a month, below your ${eur(BUFFER)} buffer.`}</p>
          <div class="icon-line">${icon('shield-check')}<span>Pause or change it any time, no fees</span></div>
        </div>
        <div class="icon-line">${icon('calendar-days')}<span>First deposit on ${S.day} Feb 2027, then every ${ordinal(S.day)}</span></div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="detail"><span class="t-body">From</span><span class="t-sup">Current account ending 0372</span></div>
          <div class="detail"><span class="t-body">Deposits</span><span class="t-sup">${eur(S.deposit)} a month · ${p.deposits} deposits · Feb to ${S.trip}</span></div>
          <div class="detail"><span class="t-body">By ${p.tripFull}</span><span class="t-sup">${eur(p.total)} with your ${eur(S.saved)} saved · ${p.toGo > 0 ? `${eur(p.toGo)} short of the goal` : 'goal reached'}</span></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <p class="t-body">You’ll confirm with Face ID. By confirming, you agree to the savings plan terms.</p>
          <button class="btn md primary block" data-act="confirm">Confirm with Face ID</button>
          <button class="btn md secondary block" data-act="change-plan">Change plan</button>
        </div>
      </div>`, 'enter-scale');
    await wait(300);
    add(responseActions(), 'enter-fade');
    follow();
  }

  async function confirmPlan() {
    if (S.busy) return;
    S.busy = true;
    renderComposer('busy');
    const card = $('#reviewCard');
    if (!S.instant) {
      // 100ms press, then the button shows a spinner (150ms label crossfade) while Face ID validates
      const btn = card?.querySelector('[data-act="confirm"]');
      if (btn) { btn.innerHTML = '<span class="spinner"></span>'; btn.classList.add('validating'); }
      await wait(250);
      const ov = html(`<div class="faceid"><div class="box">${icon('scan-face')}<span>Face ID</span></div></div>`);
      screen.appendChild(ov);
      await wait(1000);
      ov.querySelector('.box').innerHTML = `${icon('check')}<span>Confirmed</span>`;
      haptic('success');
      await wait(600);
      ov.remove();
    }
    $$('#reviewCard .btn').forEach((b) => (b.disabled = true));
    const cbtn = card?.querySelector('[data-act="confirm"]');
    if (cbtn) { cbtn.classList.remove('validating'); cbtn.innerHTML = `${icon('check')}Confirmed`; }
    card?.querySelector('.badge')?.replaceWith(html('<span class="badge neutral">Confirmed</span>'));
    S.planned = true;
    await showScheduled();
    renderComposer('idle');
    S.busy = false;
    setStep('scheduled');
  }

  async function showScheduled() {
    const p = plan();
    S.userScrolled = false;
    const c = add(`<div class="biometric">Confirmed with Face ID · 16 Nov 2026</div>`, 'enter-fade');
    S.anchor = c;
    follow();
    await say({ text: `Done, your plan is set! Your first ${eur(S.deposit)} leaves your current account on ${S.day} Feb 2027, and I’ll check in with you in January.`, cls: 'compact' });
    await wait(150);
    const pct = (v) => `${(v / S.goal) * 100}%`;
    add(`
      <div class="card" id="scheduledCard">
        <div class="row-between"><span class="t-strong">Summer holiday</span><span class="badge success pop-in">Scheduled</span></div>
        <div class="row-between"><span class="t-body muted">By ${p.tripFull}</span><span class="t-strong">${eur(p.total)} of ${eur(S.goal)}</span></div>
        <div class="progress">
          <span class="grow" style="width:${pct(S.saved)};background:var(--inverted);animation-delay:300ms"></span>
          <span class="grow" style="width:${pct(p.scheduled)};background:var(--accent);animation-delay:400ms"></span>
          ${p.toGo > 0 ? `<span style="flex:1;background:var(--body-bg)"></span>` : ''}
        </div>
        <div class="chart-legend" style="gap:12px">
          <span><i style="width:8px;height:8px;border:0;border-radius:6px;background:var(--inverted)"></i>Saved ${eur(S.saved)}</span>
          <span><i style="width:8px;height:8px;border:0;border-radius:6px;background:var(--accent)"></i>Scheduled ${eur(p.scheduled)}</span>
          ${p.toGo > 0 ? `<span><i style="width:8px;height:8px;border:0;border-radius:6px;background:var(--body-bg)"></i>To go ${eur(p.toGo)}</span>` : ''}
        </div>
        <div class="timeline tl-stagger">
          ${[
            ['Jan 2027', 'I’ll check if your surplus has changed'],
            [`${S.day} Feb 2027`, `First deposit of ${eur(S.deposit)} from your current account`],
            [`Every ${ordinal(S.day)} · ${p.deposits} deposits`, 'We’ll remind you the day before each one'],
            [`${S.day} ${S.trip} 2027`, `Last deposit, ${eur(p.total)} saved for your holiday`],
          ].map(([a, b]) => `<div class="tl-item"><span class="mk"></span><span class="txt"><span class="t-body">${a}</span><span class="t-sup">${b}</span></span></div>`).join('')}
        </div>
      </div>`, 'enter-card');
    await wait(300);
    add(`<div style="display:flex;gap:8px">
        <button class="btn sm primary" data-act="view-pot">View pot</button>
        <button class="btn sm secondary" data-act="change-plan">Change or pause</button>
      </div>`, 'enter-fade');
    add(responseActions(), 'enter-fade');
    follow();
  }

  // "Change plan" / "Change or pause" is a turn of its own: the choice becomes the person's
  // message and the assistant brings a fresh interactive plan at the end of the conversation
  // (no jump back up to the old one).
  async function changePlan(el) {
    if (S.busy) return;
    S.busy = true;
    // A review that is being changed can no longer be confirmed
    const old = $('#reviewCard');
    if (old && !S.planned) {
      old.removeAttribute('id');
      old.classList.add('is-frozen');
      $$('.btn', old).forEach((b) => (b.disabled = true));
    }
    renderComposer('busy');
    retirePlanCards();
    addUser(el?.textContent.trim() || 'Change plan', clock(1));
    S.reviewed = false;
    await wait(500);
    await presentPlan(`Sure. Here’s your plan at ${eur(S.deposit)} a month. Adjust the deposit or the day, and I’ll prepare a new review:`);
  }

  /* ------------------------------------------------------------------ *
   * POT DETAIL
   * ------------------------------------------------------------------ */
  function renderPot({ intro = false } = {}) {
    const p = plan();
    const pct = (v) => `${(v / S.goal) * 100}%`;
    // First open after creating the plan: the bar fills (saved → scheduled). Later opens: static.
    const fill = intro && !S.potOpened && !calm();
    S.potOpened = true;
    const g = (delay) => (fill ? ` class="grow" style="animation-delay:${delay}ms;` : ' style="');
    views.pot.innerHTML = `
      <div class="scroll"><div class="content">
        <div><button class="icon-btn secondary" data-act="pot-back" aria-label="Back">${icon('chevron-left')}</button></div>
        <div class="hero">
          <span class="pic"><img src="assets/img/pot-holiday.png" alt="" /></span>
          <div><h2>Summer holiday</h2><span class="t-sup">Goal ${eur(S.goal)} by ${S.trip} 2027</span></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div class="row-between"><span class="t-h1">${eur2(S.saved)}</span><span class="badge ${S.paused ? 'paused' : 'info'} ${intro ? 'late' : ''}" id="potBadge">${potBadgeText()}</span></div>
          <div class="progress">
            <span${g(400)}width:${pct(S.saved)};background:var(--text-primary);border-radius:99px"></span>
            <span${g(500)}width:${pct(p.scheduled)};background:var(--accent);border-radius:99px"></span>
            ${p.toGo > 0 ? `<span style="flex:1;background:var(--border-default);border-radius:99px"></span>` : ''}
          </div>
          <div class="chart-legend">
            <span><i style="width:8px;height:8px;border:0;border-radius:6px;background:var(--text-primary)"></i>Saved ${eur(S.saved)}</span>
            <span><i style="width:8px;height:8px;border:0;border-radius:6px;background:var(--accent)"></i>Scheduled ${eur(p.scheduled)}</span>
            ${p.toGo > 0 ? `<span><i style="width:8px;height:8px;border:0;border-radius:6px;background:var(--border-default)"></i>To go ${eur(p.toGo)}</span>` : ''}
          </div>
        </div>
        <div class="pot-actions">
          <button>${icon('arrow-down-to-line')}Deposit</button>
          <button>${icon('arrow-up-from-line')}Withdraw</button>
          <button>${icon('settings')}Modify</button>
        </div>
        ${p.toGo > 0 ? `
        <div class="card soft">
          <div style="display:flex;gap:8px;align-items:center">${icon('sparkles')}<span class="t-label">You’re ${eur(p.toGo)} short of your ${eur(S.goal)} goal</span></div>
          <span class="t-sup">Want to see ways to close the gap?</span>
          <button class="btn md primary block" data-act="open-chat">${icon('sparkles')}Show me ways</button>
        </div>` : ''}
        <div class="card soft" id="scheduleCard">
          <span class="t-label">How it’s scheduled</span>
          <div class="sched-row"><span class="t-sup">Deposit</span><span class="t-body">${eur(S.deposit)} a month · ${p.deposits} deposits</span></div>
          <div class="sched-row"><span class="t-sup">Day</span><span class="t-body">Every ${ordinal(S.day)}, Feb to ${S.trip} 2027</span></div>
          <div class="sched-row"><span class="t-sup">From</span><span class="t-body">Current account ending 0372</span></div>
          <div class="sched-row"><span class="t-sup">Good to know</span><span class="t-body">If the ${ordinal(S.day)} falls on a weekend or holiday, it moves to the next working day. We’ll remind you the day before.</span></div>
          <div style="display:flex;gap:8px">
            <button class="btn md secondary">Change day</button>
            <button class="btn md ghost" data-act="pause" id="pauseBtn">${S.paused ? 'Resume plan' : 'Pause plan'}</button>
          </div>
        </div>
        <div class="row-between"><span class="t-strong">Activity</span><button class="btn sm ghost">See all</button></div>
        <div class="list-card">
          <div class="tx"><span class="ic">${icon('calendar-clock')}</span><span class="txt"><span class="t-body">Scheduled deposit</span><span class="t-sup" id="potTxStatus">${S.paused ? 'Paused' : 'Upcoming'}</span></span><span class="amt"><span class="t-strong" style="color:var(--text-secondary)">${eur2(S.deposit)}</span><span class="t-sup">${S.day} Feb</span></span></div>
          <div class="tx"><span class="ic">${icon('piggy-bank')}</span><span class="txt"><span class="t-body">Pot created</span><span class="t-sup">Initial amount</span></span><span class="amt"><span class="t-strong">+${eur2(S.saved)}</span><span class="t-sup">16 Nov</span></span></div>
        </div>
      </div></div>
      <button class="fab is-display" type="button" tabindex="-1" aria-disabled="true" aria-label="Assistant"><img src="assets/img/ai-logo.png" alt="" draggable="false" /></button>`;
  }

  const potBadgeText = () => (S.paused ? 'Paused' : `Scheduled · ${eur(S.deposit)} · ${S.day} Feb`);

  // Shared element: the chat card (400ms) or the Home pot row (350ms) becomes the pot hero.
  async function viewPot(el) {
    const fromName = S.view;
    const src = el?.closest?.('.pot-row') || (el && $('#scheduledCard')) || null;
    renderPot({ intro: true });
    if (calm() || !src || fromName === 'pot') {
      showView('pot', S.instant ? null : 'push');
      setStep('pot');
      return;
    }
    const dur = fromName === 'chat' ? 400 : 350;
    const fromView = views[fromName];
    const pot = views.pot;
    const a = rectIn(src);
    pot.hidden = false;
    pot.style.zIndex = 6;
    fromView.style.zIndex = 1;
    $('#statusbar').classList.remove('on-dark');
    const hero = pot.querySelector('.hero');
    const b = rectIn(hero);
    hero.style.visibility = 'hidden';
    const cs = getComputedStyle(src);
    // no-anim: the clones must not replay their own entrance animations mid-flight
    const ghost = html('<div class="shared-ghost no-anim"><div class="sg-from"></div><div class="sg-to"></div></div>');
    const fromClone = src.cloneNode(true);
    fromClone.removeAttribute('id');
    fromClone.style.width = a.w + 'px';
    ghost.querySelector('.sg-from').appendChild(fromClone);
    const toClone = hero.cloneNode(true);
    toClone.style.visibility = 'visible';
    toClone.style.width = b.w + 'px';
    ghost.querySelector('.sg-to').appendChild(toClone);
    screen.appendChild(ghost);
    const box = (r) => ({ left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
    const flight = ghost.animate([
      { ...box(a), borderRadius: cs.borderRadius, backgroundColor: cs.backgroundColor, borderColor: 'rgba(0,0,0,0.12)' },
      { ...box(b), borderRadius: '0px', backgroundColor: 'rgba(255,255,255,0)', borderColor: 'rgba(0,0,0,0)' },
    ], { duration: dur, easing: CSSE.enter, fill: 'forwards' });
    ghost.querySelector('.sg-from').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
    ghost.querySelector('.sg-to').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 100, fill: 'backwards' });
    pot.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: CSSE.standard });
    $$('.content > *:not(.hero)', pot).forEach((n) => n.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 250, delay: 150, easing: CSSE.enter, fill: 'backwards' }));
    fromView.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    await settle(flight);
    ghost.remove();
    hero.style.visibility = '';
    fromView.getAnimations().forEach((x) => x.cancel());
    showView('pot', null);
    setStep('pot');
  }

  // Pause: schedule card content crossfades (200ms); hero badge → "Paused" (150ms crossfade) + light haptic
  function togglePause() {
    S.paused = !S.paused;
    haptic('light');
    const badge = $('#potBadge');
    badge.className = 'badge ' + (S.paused ? 'paused' : 'info');
    badge.textContent = potBadgeText();
    anim(badge, [{ opacity: 0.2 }, { opacity: 1 }], { duration: 150, easing: CSSE.standard });
    $('#pauseBtn').textContent = S.paused ? 'Resume plan' : 'Pause plan';
    $('#potTxStatus').textContent = S.paused ? 'Paused' : 'Upcoming';
    anim($('#scheduleCard'), [{ opacity: 0.3 }, { opacity: 1 }], { duration: 200, easing: CSSE.standard });
  }

  async function backFromPot() {
    S.tab = 'pots';
    renderHome();
    showView('home', S.instant ? null : 'pop');
    playHomeInsert();
    setStep('home2');
  }

  // New pot on Home: the row's height expands (250ms standard), content fades in (200ms, 100ms delay),
  // a one-time tint fades over 1000ms; the transaction expands with no highlight; the total tweens (400ms).
  async function playHomeInsert() {
    const job = S.pendingInsert;
    if (!job) return;
    S.pendingInsert = null;
    await wait(250);
    $$('.ins-wrap.pending', views.home).forEach((wrap) => {
      wrap.classList.remove('pending');
      const h = wrap.scrollHeight;
      const isPot = !!wrap.querySelector('.pot-row');
      anim(wrap, [{ height: '0px' }, { height: h + 'px' }], { duration: 250, easing: CSSE.standard });
      anim(wrap.firstElementChild, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 100, fill: 'backwards' });
      if (isPot) wrap.firstElementChild.classList.add('highlight');
    });
    tweenNumber($('#potsTotal'), job.to, 400, eur2, job.from);
  }

  /* ------------------------------------------------------------------ *
   * Events
   * ------------------------------------------------------------------ */
  const actions = {
    'open-chat': (el) => openChat(el),
    'close-chat': closeChat,
    'scroll-bottom': scrollToEnd,
    'type-goal': focusComposer,
    'send-typed': (el) => sendTyped(el),
    'send-goal': sendGoal,
    'tab': (el) => switchTab(el.dataset.tab),
    'open-pot': (el) => viewPot(el),
    'pot-back': backFromPot,
    'sheet-next': sheetNext,
    'sheet-prev': sheetPrev,
    'sheet-close': () => collapseSheet(),
    'show-questions': expandSheet,
    'trip': (el) => { S.trip = el.dataset.v; haptic(); syncSheet(); },
    'saved': async (el) => {
      // Answering the last question of step 1 moves on to step 2 after a beat
      // (time to see "Left to save" update)
      S.saved = Number(el.dataset.v);
      haptic();
      syncSheet();
      const tap = (S.savedTap = (S.savedTap || 0) + 1);
      await wait(calm() ? 300 : 700);
      if (tap === S.savedTap && S.sheetOpen && S.sheetPage === 1) sheetNext();
    },
    'source': (el) => { const k = el.dataset.v; S.sources[k] = !S.sources[k]; haptic(); syncSheet(); },
    'period': (el) => { S.period = Number(el.dataset.v); haptic(); syncSheet(); },
    'calculate': calculate,
    'toggle-tool': (el) => toggleTool(el.closest('.toolcall')),
    'accept': chooseAccept,
    'modify': chooseModify,
    'deposit': (el) => { if (S.reviewed) return; S.deposit = Number(el.dataset.v); haptic(); updatePlan('tap'); },
    'step': (el) => { if (S.reviewed) return; S.deposit = Math.max(0, Math.min(SURPLUS, S.deposit + Number(el.dataset.v))); haptic(); updatePlan('step'); },
    'day': (el) => { S.day = Number(el.dataset.v); haptic(); $$('#dayCard .chip').forEach((c) => c.classList.toggle('on', Number(c.dataset.v) === S.day)); updatePlan('init'); },
    'review-plan': reviewPlan,
    'confirm': confirmPlan,
    'change-plan': (el) => changePlan(el),
    'view-pot': (el) => viewPot(el),
    'pause': togglePause,
    'react': (el) => {
      if (el.hasAttribute('data-toggle')) {
        const was = el.classList.contains('on');
        $$('[data-toggle]', el.parentElement).forEach((b) => b.classList.remove('on'));
        el.classList.toggle('on', !was);
      }
    },
  };

  // Tool call chip expands / collapses its steps (height 250ms standard + crossfade)
  function toggleTool(tc) {
    const body = tc.querySelector('.tool-body');
    const open = !tc.classList.contains('open');
    tc.classList.toggle('open', open);
    tc.querySelector('.row').setAttribute('aria-expanded', String(open));
    if (open) {
      body.hidden = false;
      anim(body, [{ height: '0px', opacity: 0 }, { height: body.offsetHeight + 'px', opacity: 1 }], { duration: 250, easing: CSSE.standard });
    } else if (calm()) {
      body.hidden = true;
    } else {
      anim(body, [{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 250, easing: CSSE.standard })
        .then(() => { if (!tc.classList.contains('open')) body.hidden = true; });
    }
  }

  screen.addEventListener('click', (e) => {
    if (suppressFabClick) { suppressFabClick = false; if (e.target.closest('.fab')) return; }
    if (suppressPtrClick) { suppressPtrClick = false; return; } // a pull is not a tap
    // Tapping the conversation dismisses the keyboard (the typed text stays in the composer)
    if (S.kb && e.target.closest('#messages') && !e.target.closest('[data-act]')) {
      hideKeyboard();
      renderComposer(S.typedText ? 'typed' : 'idle');
      return;
    }
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled || !el.dataset.act) return;
    const fn = actions[el.dataset.act];
    if (fn) fn(el);
  });

  screen.addEventListener('input', (e) => {
    const k = e.target.dataset.input;
    if (k === 'surplus-month') {
      // Thumb follows the finger 1:1; the chart switches month live
      const v = Number(e.target.value);
      setSurplusThumb(v);
      const m = Math.round(v);
      if (m !== S.surplusMonth) { S.surplusMonth = m; updateSurplus(); haptic(); }
    }
    if (k === 'deposit') {
      // Thumb 1:1 with the finger; selection haptic every €10
      S.deposit = Number(e.target.value);
      const ten = Math.floor(S.deposit / 10);
      if (ten !== S.lastTen) { S.lastTen = ten; haptic(); }
      updatePlan('drag');
    }
  });
  screen.addEventListener('change', (e) => {
    if (e.target.dataset.input !== 'surplus-month') return;
    // On release, snap to the month (spring 200ms)
    e.target.value = S.surplusMonth;
    const sl = $('#sSlider');
    if (!calm()) sl.classList.add('snap');
    setSurplusThumb(S.surplusMonth);
    setTimeout(() => sl.classList.remove('snap'), 220);
  });

  /* ------------------------------------------------------------------ *
   * Presenter: step list, restart, jump to step
   * ------------------------------------------------------------------ */
  // `cue` is the moderator prompt for that step (kept for reference; the tasks live in ROTEIRO-TESTE.md)
  const STEPS = [
    { id: 'home', label: 'Home', run: async () => {},
      cue: 'Task: “You want to save €3,000 for a trip next summer. Show me how you’d start.” Watch whether they find the assistant button.' },
    { id: 'chat', label: 'Assistant opens', run: () => openChat(),
      cue: 'Observe: do they find the text field? Tapping it opens the keyboard and types the goal; they tap Send. (The suggestions above are examples, not buttons.)' },
    { id: 'goal', label: 'Goal · action sheet', run: sendGoal,
      cue: 'Do they check the summary and correct anything? Answering “Anything already put aside?” moves the sheet to step 2 on its own: do they follow the change?' },
    { id: 'permission', label: 'Data permission', run: sheetNext,
      cue: 'Ask: “What will the assistant look at if you allow this, and what won’t it do?”' },
    { id: 'surplus', label: 'Monthly surplus', run: calculate,
      cue: 'Ask: “How much is left each month today, and when does that change?”' },
    { id: 'plan', label: 'Interactive plan · decision', run: chooseModify,
      cue: 'Key decision. Ask them to think aloud: €350 keeps the buffer, €386 reaches €3,000. Which do they choose and why?' },
    { id: 'review', label: 'Review and confirm', run: reviewPlan,
      cue: 'Pause before confirming. Ask: “How much will you have for the trip in August, how much stays free each month, and what happens today if you confirm?”' },
    { id: 'scheduled', label: 'Plan scheduled', run: confirmPlan,
      cue: 'Ask: “What happens next, and when will money first leave your account?”' },
    { id: 'pot', label: 'Pot detail', run: viewPot,
      cue: 'Ask: “If your month gets tight in March, what would you do here?”' },
    { id: 'home2', label: 'Home with the new pot', run: backFromPot,
      cue: 'Ask: “Where is the money for the trip now?” Then wrap up with the debrief questions.' },
  ];

  function reset() {
    reviewObserver?.disconnect();
    cancelAnimationFrame(scrollRaf);
    screen.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    $$('.faceid', screen).forEach((n) => n.remove());
    Object.assign(ptr, { active: false, pulling: false, refreshing: false, armed: false, dist: 0 });
    S = fresh();
    renderHome();
    renderChatScaffold();
    views.pot.innerHTML = '';
    showView('home', null);
    setStep('home');
  }

  async function jumpTo(index) {
    reset();
    S.instant = true;
    screen.classList.add('no-anim');
    for (let k = 1; k <= index; k++) await STEPS[k].run();
    S.instant = false;
    requestAnimationFrame(() => requestAnimationFrame(() => screen.classList.remove('no-anim')));
  }

  $('#stepList').innerHTML = STEPS.map((s, i) => `<li data-step="${s.id}"><button type="button" data-i="${i}"><span class="n">${(i + 1) % 10}</span>${s.label}</button></li>`).join('');
  $('#stepList').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) jumpTo(Number(b.dataset.i)); });
  $('#restartBtn').addEventListener('click', () => reset());

  // Reduce Motion toggle (the OS setting always wins)
  function applyReduced() {
    document.documentElement.classList.toggle('reduce-motion', reduced());
    const cb = $('#rmToggle');
    if (cb) { cb.checked = reduced(); cb.disabled = RM.matches; }
  }
  $('#rmToggle')?.addEventListener('change', (e) => {
    forceRM = e.target.checked;
    try { localStorage.setItem('reduce-motion', forceRM ? '1' : '0'); } catch (err) { /* storage blocked */ }
    applyReduced();
  });
  RM.addEventListener?.('change', applyReduced);
  applyReduced();

  // Presenter shortcuts: ← / → previous / next step, 1–9 and 0 jump to a step, R restarts
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, textarea, select')) return;
    const i = Math.max(0, STEPS.findIndex((s) => s.id === S.step));
    if (e.key === 'ArrowRight') jumpTo(Math.min(STEPS.length - 1, i + 1));
    else if (e.key === 'ArrowLeft') jumpTo(Math.max(0, i - 1));
    else if (e.key === 'r' || e.key === 'R') reset();
    else if (/^[0-9]$/.test(e.key)) jumpTo(e.key === '0' ? 9 : Number(e.key) - 1);
    else return;
    e.preventDefault();
  });

  // Fit the device to the window on desktop
  function fit() {
    const dev = $('#device');
    if (window.innerWidth <= 520) { dev.style.transform = ''; dev.style.margin = ''; DEVICE_SCALE = 1; return; }
    const side = window.innerWidth > 900 ? 300 : 0;
    const s = Math.min(1, (window.innerHeight - 48) / 874, (window.innerWidth - side - 48) / 402);
    DEVICE_SCALE = s;
    dev.style.transform = `scale(${s})`;
    dev.style.margin = `${(874 * (s - 1)) / 2}px ${(402 * (s - 1)) / 2}px`;
  }
  window.addEventListener('resize', fit);
  fit();

  reset();
  const start = Number(new URLSearchParams(location.search).get('step'));
  if (start > 0 && start < STEPS.length) jumpTo(start);
})();
