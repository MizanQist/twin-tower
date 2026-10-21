import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { p, line, ctn } from './reveal.js';
import { isPhone, scrollToSection } from './scroll.js';
import { REDUCED, DUR } from './eases.js';

// "Floor by floor": the exploded stack (three.js, lazy) on a stage with a level list, use chips and a card.
// The model loads when the section comes near; until then (and on failure) the axon plate stays as the picture.
const PLAN_SLIDE = { B1: 4, G: 2, M: 3, ROOF: 5 };
const slideFor = (id) => (id in PLAN_SLIDE ? PLAN_SLIDE[id] : /^L0[1-5]$/.test(id) ? 0 : 1);

export function initStackSection() {
  const root = document.querySelector('.stack'); if (!root) return;
  const stage = root.querySelector('[data-stack-stage]'), canvas = root.querySelector('[data-stack-canvas]');
  const levelsEl = root.querySelector('[data-stack-levels]'), legendEl = root.querySelector('[data-stack-legend]');
  const card = root.querySelector('[data-stack-card]'), cardLabel = card.querySelector('[data-card-label]'), cardUse = card.querySelector('[data-card-use]'), cardRows = card.querySelector('[data-card-rows]'), cardLink = card.querySelector('[data-card-link]');
  const lock = root.querySelector('[data-stack-lock]'), hint = root.querySelector('[data-stack-hint]');
  const phone = isPhone();

  // entrance, as the other light pages
  const head = root.querySelector('.plan__head');
  ScrollTrigger.create({ trigger: head, start: 'top 75%', once: true, onEnter: () => {
    p(root.querySelectorAll('.plan__eyebrow, .plan__line, .plan__body'), 'reveal', 0); line(root.querySelector('.plan__rule'), 'reveal', 0.2);
    root.querySelectorAll('.stat__num[data-count]').forEach((el, i) => countUp(el, 0.3 + i * 0.1));
  } });
  ScrollTrigger.create({ trigger: stage, start: 'top 88%', once: true, onEnter: () => { gsap.fromTo(stage, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: DUR.l, ease: 'out' }); hint && gsap.fromTo(hint, { opacity: 0 }, { opacity: 1, duration: DUR.m, delay: 0.4 }); } });
  gsap.set(stage, { opacity: 0 });

  let api = null, TYPES = null, exploded = false;
  const io = new IntersectionObserver(async (entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    try {
      const [mod, data] = await Promise.all([import('./stack.js'), fetch('/assets/stack.json').then((r) => r.json())]);
      boot(mod, data);
    } catch (e) { stage.classList.add('is-flat'); }
  }, { rootMargin: '1200px 0px' });
  io.observe(stage);

  function boot(mod, data) {
    TYPES = mod.TYPES;
    api = mod.initStack(canvas, data, { azimuth: 40, elevation: 28, gap: 7, onHover: (i) => showLevel(i, false), onSelect: (i) => showLevel(i, true), onUse: showUse });
    api.setSpacing('compact'); stage.classList.add('is-3d');
    // levels list (top down)
    const frag = document.createDocumentFragment();
    [...api.levels].reverse().forEach((lv) => {
      const li = document.createElement('li'); li.dataset.id = lv.id; li.tabIndex = 0;
      li.innerHTML = `<span>${lv.label}</span><small>${lv.use}</small>`;
      li.addEventListener('mouseenter', () => { api.state.hover = lv.id; api.setMode('floor'); showLevel(lv, false); mark(lv.id); });
      li.addEventListener('mouseleave', () => { api.state.hover = null; api.setMode('floor'); showLevel(null); mark(null); });
      li.addEventListener('focus', () => { api.state.hover = lv.id; api.setMode('floor'); showLevel(lv, false); mark(lv.id); });
      li.addEventListener('blur', () => { api.state.hover = null; api.setMode('floor'); mark(null); });
      li.addEventListener('click', () => api.setLevel(lv.id));
      frag.appendChild(li);
    });
    levelsEl.appendChild(frag);
    // use chips
    const used = new Set(data.levels.flatMap((l) => l.spaces.map((s) => s.t)));
    Object.entries(TYPES).filter(([t]) => used.has(t)).forEach(([t, v]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'stack__chip'; b.dataset.t = t; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<i style="--c:${v.color}"></i>${v.label}`;
      b.addEventListener('click', () => { const on = b.getAttribute('aria-pressed') === 'true'; legendEl.querySelectorAll('button').forEach((c) => c.setAttribute('aria-pressed', 'false')); if (!on) b.setAttribute('aria-pressed', 'true'); setMode(on ? 'floor' : 'use'); api.setUse(on ? null : t); if (on) showLevel(null); });
      legendEl.appendChild(b);
    });
    // controls
    root.querySelectorAll('[data-stack-mode]').forEach((b) => b.addEventListener('click', () => { setMode(b.dataset.stackMode); api.setMode(b.dataset.stackMode); if (b.dataset.stackMode === 'floor') { legendEl.querySelectorAll('button').forEach((c) => c.setAttribute('aria-pressed', 'false')); showLevel(null); } }));
    root.querySelectorAll('[data-stack-gap]').forEach((b) => b.addEventListener('click', () => { root.querySelectorAll('[data-stack-gap]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); exploded = b.dataset.stackGap === 'exploded'; api.setSpacing(b.dataset.stackGap); }));
    // the build: plates separate as the stage settles into view
    ScrollTrigger.create({ trigger: stage, start: 'top 60%', once: true, onEnter: () => { if (REDUCED) { api.setSpacing('exploded'); return; } gsap.delayedCall(0.3, () => { exploded = true; api.setSpacing('exploded'); }); } });
    // touch: no drag until unlocked, so the page still scrolls over the model
    if (phone && lock) { canvas.style.pointerEvents = 'none'; lock.hidden = false; lock.addEventListener('click', () => { const on = canvas.style.pointerEvents === 'none'; canvas.style.pointerEvents = on ? 'auto' : 'none'; lock.setAttribute('aria-pressed', String(on)); lock.textContent = on ? 'Done exploring' : 'Touch to explore'; }); }
    else if (lock) lock.hidden = true;
    stage._stack = api;           // QA hook
  }
  function setMode(m) { root.querySelectorAll('[data-stack-mode]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.stackMode === m))); }
  function mark(id) { levelsEl.querySelectorAll('li').forEach((li) => li.classList.toggle('on', li.dataset.id === id)); }
  function showLevel(i, selected) {
    mark(i ? i.id : null);
    if (!i) { cardLabel.textContent = 'Two towers, one podium'; cardUse.textContent = 'Hover a plate or pick a use'; cardRows.innerHTML = ''; cardLink.hidden = true; return; }
    cardLabel.textContent = i.label; cardUse.textContent = `${i.use} · ${i.elev >= 0 ? '+' : ''}${i.elev} m${i.scope === 'towers' ? ' · both towers' : ''}`;
    cardRows.innerHTML = i.rows.slice(0, 7).map((r) => `<li><span><i style="--c:${TYPES[r.type].color}"></i>${r.label}</span><b>${r.m2.toLocaleString()} sqm</b></li>`).join('');
    cardLink.hidden = false; cardLink.dataset.slide = slideFor(i.id); cardLink.textContent = i.scope === 'towers' ? (slideFor(i.id) === 0 ? 'See the office floor' : 'See the residential floor') : 'See the plan';
  }
  function showUse(u) {
    if (!u) { showLevel(null); return; }
    cardLabel.textContent = u.label; cardUse.textContent = `on ${u.levels} level${u.levels > 1 ? 's' : ''}`;
    cardRows.innerHTML = `<li><span>Total</span><b>${u.m2.toLocaleString()} sqm</b></li>`; cardLink.hidden = true;
  }
  cardLink.addEventListener('click', (e) => { e.preventDefault(); const n = +cardLink.dataset.slide; if (!Number.isNaN(n)) window.dispatchEvent(new CustomEvent('floors:go', { detail: n })); scrollToSection('#floors'); });
}

function countUp(el, delay) {
  const to = parseFloat(el.dataset.count); if (Number.isNaN(to)) return;
  const fmt = el.dataset.format, suffix = el.dataset.suffix || '';
  const text = (v) => (fmt === 'comma' ? Math.round(v).toLocaleString('en-GB') : fmt === 'dec' ? v.toFixed(1) : String(Math.round(v))) + suffix;
  const o = { v: 0 };
  gsap.to(o, { v: to, duration: 1.4, delay, ease: 'out', onUpdate: () => { el.firstChild.nodeValue = text(o.v); } });
}
