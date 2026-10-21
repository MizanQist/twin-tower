import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DUR, STAGGER, REDUCED } from './eases.js';
import { isPhone } from './scroll.js';
import { p, line } from './reveal.js';

const fmt = (n, el) => (el.dataset.format === 'comma' ? Math.round(n).toLocaleString('en-GB') : String(Math.round(n))) + (el.dataset.suffix || '');

export function initConcept() {
  const root = document.querySelector('.concept'); if (!root) return;
  const area = root.querySelector('[data-concept-area]'), track = root.querySelector('[data-concept-track]'), initial = root.querySelector('.concept__initial');
  const nums = [...root.querySelectorAll('[data-count]')];
  const setNum = (el, v) => { el.firstChild.nodeValue = fmt(v, el); };
  const cards = [...root.querySelectorAll('[data-reveal-card]')];
  const textPanel = root.querySelector('.concept__panel--text');
  const phone = isPhone();

  // ---- the horizontal area (desktop): the area is as tall as the track is wide, so one scrolled pixel is one slid pixel
  let tween = null;
  const size = () => {
    if (phone) { area.style.height = ''; return; }
    const distance = track.scrollWidth - window.innerWidth;
    area.style.height = `${track.scrollWidth + window.innerHeight * 0.4}px`;
    if (tween) { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); }
    tween = gsap.to(track, { x: -distance, ease: 'none', scrollTrigger: { trigger: area, start: 'top top', end: 'bottom bottom', scrub: REDUCED ? true : 0.25, invalidateOnRefresh: true } });
    root._horizontalTween = tween;
  };
  size();
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { size(); ScrollTrigger.refresh(); }, 60); });

  // ---- the ghost initial drifts against the track
  if (initial && !REDUCED) gsap.fromTo(initial, { x: 0 }, { x: -window.innerWidth * 0.3, ease: 'none', scrollTrigger: { trigger: area, start: 'top top', end: 'bottom bottom', scrub: true } });

  // ---- text panel reveals once, as the page arrives
  if (!REDUCED) { nums.forEach((el) => setNum(el, 0)); gsap.set(root.querySelectorAll('.stat'), { opacity: 0, y: 16 }); }
  ScrollTrigger.create({
    trigger: textPanel, start: 'top 65%', once: true,
    onEnter: () => {
      p(root.querySelectorAll('.concept__eyebrow, .concept__line, .concept__body, .concept__hint'), 'reveal', 0);
      line(root.querySelector('.concept__rule'), 'reveal', 0.2);
      if (REDUCED) return;
      gsap.to(root.querySelectorAll('.stat'), { opacity: 1, y: 0, duration: DUR.l, ease: 'out', stagger: STAGGER, delay: 0.5 });
      nums.forEach((el, i) => { const o = { v: 0 }; gsap.to(o, { v: +el.dataset.count, duration: DUR.l, ease: 'out', delay: 0.6 + i * STAGGER, onUpdate: () => setNum(el, o.v) }); });
    },
  });

  // ---- cards reveal as they slide into view (containerAnimation on desktop, plain scroll on phones)
  if (REDUCED) return;
  cards.forEach((card) => {
    const media = card.querySelector('.principle__media'), img = media.querySelector('img'), copy = card.querySelectorAll('.principle__num, .principle__name, .principle__desc');
    gsap.set(media, { clipPath: 'inset(0 0 100% 0)' }); gsap.set(img, { scale: 1.2 }); gsap.set(copy, { opacity: 0, y: 16 });
    ScrollTrigger.create({
      trigger: card, containerAnimation: phone ? undefined : tween, start: phone ? 'top 85%' : 'left 85%', once: true,
      onEnter: () => {
        gsap.to(media, { clipPath: 'inset(0 0 0% 0)', duration: DUR.l, ease: 'inOut', clearProps: 'clipPath' });
        gsap.to(img, { scale: 1.06, duration: DUR.l, ease: 'inOut', clearProps: 'transform' });
        gsap.to(copy, { opacity: 1, y: 0, duration: DUR.l, ease: 'out', stagger: STAGGER, delay: 0.3 });
      },
    });
  });
}
