import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DUR, STAGGER, REDUCED } from './eases.js';
import { isPhone } from './scroll.js';
import { h, p, ctn, line, slide } from './reveal.js';

gsap.registerPlugin(ScrollTrigger);

// Section 8: amenities. ERA's tabbed night stage: a list of amenities with a sliding highlight; choosing one wipes
// its image in and swaps the words; the list advances on its own until the reader takes over.
const AUTO = 8;
const pad = (n) => String(n).padStart(2, '0');

export function initAmen() {
  const root = document.querySelector('.amen'); if (!root) return;
  const slides = [...root.querySelectorAll('[data-amen-slide]')], tabs = [...root.querySelectorAll('[data-amen-tab]')];
  const hilite = root.querySelector('[data-amen-hilite]'), cur = root.querySelector('[data-amen-current]'), text = root.querySelector('.amen__text');
  const name = text.querySelector('[data-amen-name]'), desc = text.querySelector('[data-amen-desc]');
  const live = document.querySelector('[data-live]');
  const phone = isPhone();
  let i = 0, busy = false, timer = null, entered = false;

  // ---- initial states
  slides.forEach((s, k) => { gsap.set(s, { display: k === 0 ? 'block' : 'none' }); s.setAttribute('aria-hidden', String(k !== 0)); });
  const media = (s) => s.querySelectorAll('[data-part="slide"]');
  slide(media(slides[0]), 'initial'); gsap.set(media(slides[0]), { visibility: 'visible' });
  const words = (k) => { [name, desc].forEach((el) => { if (el._split) { el._split.revert(); el._split = null; } }); name.textContent = slides[k].dataset.name; desc.textContent = slides[k].dataset.desc; };
  words(0); h(name, 'initial'); p(desc, 'initial'); gsap.set([name, desc], { visibility: 'visible' });
  ctn(root.querySelectorAll('.amen__eyebrow, .amen__tab, .amen__cta'), 'initial'); line(root.querySelectorAll('.amen__line'), 'initial');
  const mark = (k) => {
    tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(j === k)); t.tabIndex = j === k ? 0 : -1; });
    cur.textContent = pad(k + 1);
    if (hilite && !phone) { const t = tabs[k]; gsap.to(hilite, { y: t.offsetTop, height: t.offsetHeight, duration: REDUCED ? 0 : DUR.m, ease: 'inOut', overwrite: true }); }
    if (phone) tabs[k].scrollIntoView({ block: 'nearest', inline: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
  };
  mark(0);

  // ---- the switch: the image wipes in while the words leave, then the new words arrive
  const go = (to) => {
    if (busy || to === i) return; busy = true;
    const from = slides[i], dest = slides[to]; i = to; mark(to);
    if (live) live.textContent = `${dest.dataset.name}. ${dest.dataset.desc}`;
    if (REDUCED) {
      gsap.set(from, { display: 'none' }); gsap.set(dest, { display: 'block' }); from.setAttribute('aria-hidden', 'true'); dest.setAttribute('aria-hidden', 'false');
      slide(media(dest), 'initial'); gsap.set(media(dest), { visibility: 'visible' }); slide(media(dest), 'reveal', 0);
      words(to); h(name, 'reveal', 0); p(desc, 'reveal', 0); busy = false; return;
    }
    from.style.zIndex = 0; dest.style.zIndex = 1;
    gsap.timeline({ onComplete: () => { from.style.zIndex = ''; busy = false; } })
      .set(dest, { display: 'block' })
      .add(() => { slide(media(dest), 'initial'); gsap.set(media(dest), { visibility: 'visible' }); dest.setAttribute('aria-hidden', 'false'); })
      .add(() => { h(name, 'hide', 0); p(desc, 'hide', 0); slide(media(from), 'hide', 0); slide(media(dest), 'reveal', 0); })
      .to({}, { duration: DUR.s })
      .add(() => { words(to); h(name, 'initial'); p(desc, 'initial'); })
      .to({}, { duration: DUR.s })
      .add(() => { h(name, 'reveal', 0); p(desc, 'reveal', 0); })
      .to({}, { duration: DUR.s })
      .set(from, { display: 'none' }).add(() => from.setAttribute('aria-hidden', 'true'));
  };

  // ---- autoplay, paused by the reader's hand
  const stop = () => { clearInterval(timer); timer = null; };
  const start = () => { if (REDUCED || timer || !entered) return; timer = setInterval(() => go((i + 1) % slides.length), AUTO * 1000); };
  tabs.forEach((t, k) => t.addEventListener('click', () => { go(k); stop(); start(); }));
  root.querySelector('.amen__list').addEventListener('keydown', (e) => {
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (!d) return; e.preventDefault();
    const k = (i + d + slides.length) % slides.length; go(k); tabs[k].focus(); stop(); start();
  });
  root.addEventListener('pointerenter', stop); root.addEventListener('pointerleave', start);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  // ---- entrance and the stage parallax
  ScrollTrigger.create({
    trigger: root, start: 'top 70%', once: true,
    onEnter: () => {
      entered = true;
      slide(media(slides[0]), 'reveal', 0);
      ctn(root.querySelectorAll('.amen__eyebrow, .amen__tab'), 'reveal', 0.3);
      line(root.querySelectorAll('.amen__line'), 'reveal', 0.4);
      h(name, 'reveal', 0.6); p(desc, 'reveal', 0.8);
      ctn(root.querySelectorAll('.amen__cta'), 'reveal', 1);
      if (!REDUCED) gsap.fromTo(hilite, { opacity: 0 }, { opacity: 1, duration: DUR.m, delay: 1 });
      start();
    },
  });
  ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top', onLeave: stop, onLeaveBack: stop, onEnter: start, onEnterBack: start });
  if (!REDUCED) gsap.fromTo(root.querySelector('.amen__stage'), { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true } });
}
