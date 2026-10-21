import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DUR, STAGGER, REDUCED } from './eases.js';
import { h, p, ctn, line, slide } from './reveal.js';

gsap.registerPlugin(ScrollTrigger);

// Section 7: the residence, floor by floor. ERA's type slider recast for one villa: each slide is a floor; the plan
// wipes in, the words follow; the pagination counts; "Explore" opens the room list and drops numbered markers on the
// plan, each row lighting its room. Nothing advances on its own: the arrows, the keyboard and floors:go move the slides.
const pad = (n) => String(n).padStart(2, '0');

export function initVilla() {
  const root = document.querySelector('.villa'); if (!root) return;
  const head = root.querySelector('.villa__head'), slider = root.querySelector('[data-villa-slider]');
  const slides = [...slider.querySelectorAll('[data-slide]')], prev = slider.querySelector('[data-villa-prev]'), next = slider.querySelector('[data-villa-next]');
  const cur = slider.querySelector('[data-villa-current]'), nxt = slider.querySelector('[data-villa-next-num]'), bar = slider.querySelector('[data-villa-bar]');
  const live = document.querySelector('[data-live]');
  const parts = (el) => ({ h: el.querySelectorAll('[data-part="h"]'), p: el.querySelectorAll('[data-part="p"]'), ctn: el.querySelectorAll('[data-part="ctn"]'), slide: el.querySelectorAll('[data-part="slide"]') });
  const run = (el, mode, delay) => { const q = parts(el); h(q.h, mode, delay); p(q.p, mode, delay); ctn(q.ctn, mode, delay); slide(q.slide, mode, delay); };

  // ---- the hand-off thread from the master plan, the words, the first slide
  ScrollTrigger.create({
    trigger: head, start: 'top 60%', once: true,
    onEnter: () => { line(root.querySelectorAll('.villa__thread'), 'reveal', 0); p(head.querySelectorAll('[data-reveal="p"]'), 'reveal', 0.2); line(head.querySelectorAll('.villa__rule'), 'reveal', 0.4); },
  });

  // ---- the plan boxes: sized to fit their frame exactly, so the markers sit on the drawing
  const fit = () => {
    const box = slides.find((s) => s.getAttribute('aria-hidden') !== 'true')?.querySelector('.villa__media') || slides[0].querySelector('.villa__media');
    const W = box.clientWidth, H = box.clientHeight; if (!W || !H) return;
    slides.forEach((s) => { const plan = s.querySelector('.villa__plan'); const ar = +plan.dataset.ar; const w = Math.min(W, H * ar); plan.style.width = `${w}px`; plan.style.height = `${w / ar}px`; });
  };
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fit, 60); });

  // ---- the slider
  let i = 0, busy = false, exploring = null;
  slides.forEach((s, k) => { gsap.set(s, { display: k === 0 ? 'block' : 'none', position: k === 0 ? 'relative' : 'absolute' }); s.setAttribute('aria-hidden', String(k !== 0)); });
  fit(); run(slides[0], 'initial'); gsap.set(slides[0].querySelectorAll('[data-part]'), { visibility: 'visible' });
  const count = () => { cur.textContent = pad(i + 1); nxt.textContent = pad(i === slides.length - 1 ? 1 : i + 2); };
  count();
  const announce = () => { if (live) live.textContent = `${slides[i].dataset.name}, ${i + 1} of ${slides.length}.`; };

  const go = (to) => {
    if (busy || to === i) return; busy = true;
    const from = slides[i], dest = slides[to]; i = to; count(); announce();
    if (exploring) closeRooms(from, true);
    if (REDUCED) {
      gsap.set(from, { display: 'none', position: 'absolute' }); gsap.set(dest, { display: 'block', position: 'relative' });
      from.setAttribute('aria-hidden', 'true'); dest.setAttribute('aria-hidden', 'false');
      run(dest, 'initial'); gsap.set(dest.querySelectorAll('[data-part]'), { visibility: 'visible' }); run(dest, 'reveal', 0); busy = false; ScrollTrigger.refresh(); return;
    }
    from.style.zIndex = 0; dest.style.zIndex = 1;
    gsap.timeline({ onComplete: () => { from.style.zIndex = ''; busy = false; } })
      .set(dest, { display: 'block', position: 'relative' }).set(from, { display: 'block', position: 'absolute' })
      .add(() => { run(dest, 'initial'); gsap.set(dest.querySelectorAll('[data-part]'), { visibility: 'visible' }); dest.setAttribute('aria-hidden', 'false'); ScrollTrigger.refresh(); })
      .add(() => { const q = parts(from); h(q.h, 'hide', 0); p(q.p, 'hide', 0); ctn(q.ctn, 'hide', 0); slide(q.slide, 'hide', 0); slide(parts(dest).slide, 'reveal', 0); })
      .to({}, { duration: DUR.m })
      .add(() => { const q = parts(dest); h(q.h, 'reveal', 0); p(q.p, 'reveal', 0); ctn(q.ctn, 'reveal', DUR.s); })
      .to({}, { duration: DUR.s })
      .set(from, { display: 'none' }).add(() => from.setAttribute('aria-hidden', 'true'));
  };
  window.addEventListener('floors:go', (e) => { const n = +e.detail; if (!Number.isNaN(n)) go(n); });
  const step = (d) => go((i + d + slides.length) % slides.length);

  // ---- manual only
  if (bar) gsap.set(bar, { scaleX: 0 });
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  slider.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); });
  ScrollTrigger.create({ trigger: slider, start: 'top 80%', once: true, onEnter: () => run(slides[0], 'reveal', 0.2) });

  // ---- explore: the room list and the markers
  const openRooms = (s) => {
    exploring = s; s.classList.add('is-exploring');
    const btn = s.querySelector('[data-villa-explore]'); btn.setAttribute('aria-expanded', 'true'); btn.querySelector('span').textContent = `Close ${s.dataset.short}`;
    const rooms = s.querySelector('.villa__rooms'); rooms.hidden = false;
    const rows = rooms.querySelectorAll('.room'), marks = s.querySelectorAll('.mark');
    if (REDUCED) { gsap.set([rows, marks], { opacity: 1, scale: 1, y: 0 }); return; }
    gsap.fromTo(rows, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: DUR.m, ease: 'out', stagger: STAGGER / 2, overwrite: true });
    gsap.fromTo(marks, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: DUR.m, ease: 'out', stagger: STAGGER / 2, delay: 0.2, overwrite: true });
    ScrollTrigger.refresh();
  };
  const closeRooms = (s, fast) => {
    if (exploring !== s) return; exploring = null; s.classList.remove('is-exploring');
    const btn = s.querySelector('[data-villa-explore]'); btn.setAttribute('aria-expanded', 'false'); btn.querySelector('span').textContent = `Explore ${s.dataset.short}`;
    const rooms = s.querySelector('.villa__rooms'), rows = rooms.querySelectorAll('.room'), marks = s.querySelectorAll('.mark');
    const done = () => { rooms.hidden = true; ScrollTrigger.refresh(); };
    if (REDUCED || fast) { gsap.set([rows, marks], { opacity: 0 }); done(); return; }
    gsap.to(marks, { opacity: 0, scale: 0.5, duration: DUR.s, ease: 'in', overwrite: true });
    gsap.to(rows, { opacity: 0, duration: DUR.s, ease: 'in', overwrite: true, onComplete: done });
  };
  slides.forEach((s) => {
    const btn = s.querySelector('[data-villa-explore]'); if (!btn) return;
    btn.addEventListener('click', () => (exploring === s ? closeRooms(s) : openRooms(s)));
    const rows = [...s.querySelectorAll('.room')], marks = [...s.querySelectorAll('.mark')];
    const light = (n) => { rows.forEach((r) => r.classList.toggle('is-hover', r.dataset.n === n)); marks.forEach((m) => m.classList.toggle('is-hover', m.dataset.n === n)); };
    rows.forEach((r) => { r.addEventListener('pointerenter', () => light(r.dataset.n)); r.addEventListener('pointerleave', () => light(null)); r.addEventListener('focusin', () => light(r.dataset.n)); r.addEventListener('focusout', () => light(null)); });
    marks.forEach((m) => { m.addEventListener('pointerenter', () => light(m.dataset.n)); m.addEventListener('pointerleave', () => light(null)); m.addEventListener('click', () => { light(m.dataset.n); rows.find((r) => r.dataset.n === m.dataset.n)?.scrollIntoView({ block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' }); }); });
    gsap.set(marks, { opacity: 0, scale: 0.5 });
  });
}
