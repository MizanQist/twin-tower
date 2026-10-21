import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DUR, REDUCED } from './eases.js';
import { isPhone } from './scroll.js';
import { h, p, ctn, line } from './reveal.js';

gsap.registerPlugin(ScrollTrigger);

// Section 10: architecture. A window in the cream page opens onto the facade as the page scrolls: the two halves of
// the frame carry a cut-out that grows from a staggered pair of slots into one letterbox, the seam between them
// opens, then the whole frame grows past the edges while the stage underneath settles to full size (ERA's arch intro).
const L0 = 'polygon(0% 0%, 0% 100%, 44.444% 100%, 44.444% 36.111%, 98.889% 36.111%, 98.889% 99.074%, 44.444% 99.074%, 1.111% 100%, 100% 100%, 100% 0%)';
const L1 = 'polygon(0% 0%, 0% 100%, 44.444% 100%, 44.444% 18.519%, 98.889% 18.519%, 98.889% 81.481%, 44.444% 81.481%, 1.111% 100%, 100% 100%, 100% 0%)';
const L2 = 'polygon(0% 0%, 0% 100%, 44.444% 100%, 44.444% 18.519%, 100% 18.519%, 100% 81.481%, 44.444% 81.481%, 1.111% 100%, 100% 100%, 100% 0%)';
const R0 = 'polygon(0% 0%, 0% 100%, 1.111% 100%, 1.111% 0.926%, 55.556% 0.926%, 55.556% 63.889%, 1.111% 63.889%, 1.111% 100%, 100% 100%, 100% 0%)';
const R1 = 'polygon(0% 0%, 0% 100%, 1.111% 100%, 1.111% 18.519%, 55.556% 18.519%, 55.556% 81.481%, 1.111% 81.481%, 1.111% 100%, 100% 100%, 100% 0%)';
const R2 = 'polygon(0% 0%, 0% 100%, 0% 100%, 0% 18.519%, 55.556% 18.519%, 55.556% 81.481%, 0% 81.481%, 0% 100%, 100% 100%, 100% 0%)';
const GROW = 1.84;

// Size a one-line title to its container (ERA's fitText).
const fit = (el) => { el.style.fontSize = ''; el.style.width = 'max-content'; const want = el.parentElement.clientWidth - 2 * parseFloat(getComputedStyle(el).left || 0); const have = el.offsetWidth, size = parseFloat(getComputedStyle(el).fontSize); el.style.width = ''; el.style.fontSize = `${size * (want / have)}px`; };

export function initArch() {
  const root = document.querySelector('.arch'); if (!root) return;
  const area = root.querySelector('.arch__area'), frame = root.querySelector('.arch__frame'), content = root.querySelector('.arch__content');
  const left = root.querySelector('.arch__half--l'), right = root.querySelector('.arch__half--r'), media = root.querySelector('.arch__media');
  const title = root.querySelector('.arch__title'), words = root.querySelectorAll('.arch__lead, .arch__quote'), rest = root.querySelectorAll('.arch__eyebrow, .arch__credits li, .arch__logo');
  const phone = isPhone();

  fit(title); let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { fit(title); ScrollTrigger.refresh(); }, 60); });
  h(title, 'initial'); p(words, 'initial'); ctn(rest, 'initial'); gsap.set([title, ...words, ...rest], { visibility: 'visible' });
  const reveal = () => { h(title, 'reveal', 0); p(words, 'reveal', DUR.s); ctn(rest, 'reveal', DUR.m); line(root.querySelectorAll('.arch__quote'), 'reveal', DUR.s); };

  if (phone || REDUCED) {
    if (frame) frame.style.display = 'none';
    gsap.set(content, { scale: 1 });
    ScrollTrigger.create({ trigger: root, start: 'top 60%', once: true, onEnter: reveal });
    if (!REDUCED && !phone) gsap.fromTo(media, { yPercent: 0 }, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true } });
    return;
  }

  // ---- the window: open, split, grow; the stage settles underneath
  gsap.set(left, { clipPath: L0 }); gsap.set(right, { clipPath: R0 }); gsap.set(content, { scale: 0.75 });
  gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: area, start: 'top bottom', end: () => `top top-=${window.innerHeight * 2}`, scrub: true } })
    .to(left, { clipPath: L1, duration: 0.5 }, 0).to(right, { clipPath: R1, duration: 0.5 }, 0)
    .to(left, { clipPath: L2, duration: 0.1 }, 0.5).to(right, { clipPath: R2, duration: 0.1 }, 0.5)
    .fromTo(frame, { scale: 1 }, { scale: GROW, duration: 0.4, ease: 'inOut' }, 0.6)
    .to(content, { scale: 1, duration: 0.4, ease: 'inOut' }, 0.6);

  // ---- the words arrive once the window is open; the facade drifts after that
  let shown = false;
  ScrollTrigger.create({ trigger: area, start: 'top top-=140%', onEnter: () => { if (!shown) { shown = true; reveal(); } } });
  gsap.fromTo(media, { yPercent: 0 }, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: area, start: 'top top-=200%', end: 'bottom top', scrub: true } });
}
