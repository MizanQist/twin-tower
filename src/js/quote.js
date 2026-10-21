import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { REDUCED } from './eases.js';
import { p } from './reveal.js';

// Section 3: the plate drifts a little slower than the page (ERA's img parallax); the words reveal once as the spread arrives.
export function initQuote() {
  const root = document.querySelector('.quote'); if (!root) return;
  const media = root.querySelector('[data-quote-media]');
  if (!REDUCED) gsap.fromTo(media, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true } });
  const items = root.querySelectorAll('[data-reveal="p"]');
  ScrollTrigger.create({ trigger: root, start: 'top 35%', once: true, onEnter: () => p(items, 'reveal', 0) });
}
