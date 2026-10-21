import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DUR, REDUCED } from './eases.js';
import { h, p, ctn } from './reveal.js';

gsap.registerPlugin(ScrollTrigger);

// Section 12: the closing statement. The street at golden hour drifts under the brochure's last line; the words stand
// up as the spread arrives, and the ring that books a viewing follows. The footer later clips this spread down.
export function initClosing() {
  const root = document.querySelector('.closing'); if (!root) return;
  const media = root.querySelector('.closing__media');
  const title = root.querySelectorAll('.closing__line'), sub = root.querySelectorAll('.closing__sub'), desc = root.querySelectorAll('.closing__desc'), rest = root.querySelectorAll('.closing__cta, .closing__meta');
  h(title, 'initial'); h(sub, 'initial'); p(desc, 'initial'); ctn(rest, 'initial');
  gsap.set([...title, ...sub, ...desc, ...rest], { visibility: 'visible' });
  ScrollTrigger.create({ trigger: root, start: 'top 60%', once: true, onEnter: () => { p(desc, 'reveal', 0); h(title, 'reveal', 0.2); h(sub, 'reveal', 0.6); ctn(rest, 'reveal', 0.9); } });
  if (!REDUCED) gsap.fromTo(media, { yPercent: -9 }, { yPercent: 9, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true } });
}
