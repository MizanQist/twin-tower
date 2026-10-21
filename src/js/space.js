import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DUR, STAGGER, REDUCED } from './eases.js';
import { h, p, ctn, slide } from './reveal.js';

gsap.registerPlugin(ScrollTrigger);

// Section 9: the space to live in. The arch rises over the night stage; two interiors wipe in with the words,
// then a gallery of the other rooms turns on its own.
const AUTO = 6;
const pad = (n) => String(n).padStart(2, '0');

export function initSpace() {
  const root = document.querySelector('.space'); if (!root) return;

  // ---- the title and the two figures
  ScrollTrigger.create({ trigger: root.querySelector('.space__title'), start: 'top 75%', once: true, onEnter: () => { ctn(root.querySelectorAll('.space__eyebrow'), 'reveal', 0); h(root.querySelectorAll('.space__line'), 'reveal', 0.2); } });
  ScrollTrigger.create({ trigger: root.querySelector('.space__cols'), start: 'top 70%', once: true, onEnter: () => {
    slide(root.querySelectorAll('.space__cols [data-reveal="slide"]'), 'reveal', 0);
    p(root.querySelectorAll('.space__lead, .space__body'), 'reveal', 0.5);
    ctn(root.querySelectorAll('.space__list-title, .space__list li, .space__cta, .space__tag'), 'reveal', 0.6);
  } });
  if (!REDUCED) {
    gsap.fromTo(root.querySelector('.space__l'), { y: 60 }, { y: -60, ease: 'none', scrollTrigger: { trigger: root.querySelector('.space__cols'), start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo(root.querySelector('.space__r'), { y: -30 }, { y: 30, ease: 'none', scrollTrigger: { trigger: root.querySelector('.space__cols'), start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  // ---- the gallery
  const gal = root.querySelector('[data-space-gallery]'); if (!gal) return;
  const slides = [...gal.querySelectorAll('[data-slide]')], prev = gal.querySelector('[data-prev]'), next = gal.querySelector('[data-next]');
  const cur = gal.querySelector('[data-current]'), nxt = gal.querySelector('[data-next-num]'), bar = gal.querySelector('[data-bar]'), cap = gal.querySelector('[data-cap]');
  let i = 0, busy = false, timer = null, entered = false;
  slides.forEach((s, k) => { gsap.set(s, { display: k === 0 ? 'block' : 'none' }); s.setAttribute('aria-hidden', String(k !== 0)); });
  const media = (s) => s.querySelector('[data-reveal="slide"]');
  const count = () => { cur.textContent = pad(i + 1); nxt.textContent = pad(i === slides.length - 1 ? 1 : i + 2); cap.textContent = slides[i].dataset.name; };
  count();
  const go = (to) => {
    if (busy || to === i) return; busy = true;
    const from = slides[i], dest = slides[to]; i = to; count();
    if (REDUCED) { gsap.set(from, { display: 'none' }); gsap.set(dest, { display: 'block' }); from.setAttribute('aria-hidden', 'true'); dest.setAttribute('aria-hidden', 'false'); slide(media(dest), 'initial'); gsap.set(media(dest), { visibility: 'visible' }); slide(media(dest), 'reveal', 0); busy = false; return; }
    from.style.zIndex = 0; dest.style.zIndex = 1;
    gsap.timeline({ onComplete: () => { from.style.zIndex = ''; busy = false; } })
      .set(dest, { display: 'block' })
      .add(() => { slide(media(dest), 'initial'); gsap.set(media(dest), { visibility: 'visible' }); dest.setAttribute('aria-hidden', 'false'); slide(media(from), 'hide', 0); slide(media(dest), 'reveal', 0); })
      .to({}, { duration: DUR.l })
      .set(from, { display: 'none' }).add(() => from.setAttribute('aria-hidden', 'true'));
  };
  const step = (d) => go((i + d + slides.length) % slides.length);
  const stop = () => { clearInterval(timer); timer = null; if (bar) { gsap.killTweensOf(bar); gsap.set(bar, { scaleX: 0 }); } };
  const start = () => { if (REDUCED || timer || !entered) return; const tick = () => { if (bar) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: AUTO, ease: 'none', transformOrigin: 'left center' }); }; tick(); timer = setInterval(() => { step(1); tick(); }, AUTO * 1000); };
  prev.addEventListener('click', () => { step(-1); stop(); start(); });
  next.addEventListener('click', () => { step(1); stop(); start(); });
  gal.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { step(1); stop(); start(); } else if (e.key === 'ArrowLeft') { step(-1); stop(); start(); } });
  gal.addEventListener('pointerenter', stop); gal.addEventListener('pointerleave', start);
  ScrollTrigger.create({ trigger: gal, start: 'top 80%', end: 'bottom 20%', onEnter: () => { entered = true; slide(media(slides[0]), 'reveal', 0); ctn(gal.querySelectorAll('.space__cap, .space__pag'), 'reveal', 0.4); start(); }, onEnterBack: start, onLeave: stop, onLeaveBack: stop });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}
