import gsap from 'gsap';
import { REDUCED } from './eases.js';

// Magnetic lean for [data-magnetic] (desktop pointer only): the element follows the cursor by up to ±strength/16 em, elastic return.
export function initMagnetic() {
  if (REDUCED || !window.matchMedia('(pointer: fine) and (min-width: 992px)').matches) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const inner = el.querySelectorAll('[data-magnetic-inner]');
    const strength = parseFloat(el.dataset.magnetic) || 25;
    const reset = (target, hard) => { gsap.killTweensOf(target); (hard ? gsap.set : gsap.to)(target, { x: 0, y: 0, force3D: true, clearProps: 'all', ...(!hard && { ease: 'elastic.out(1, 0.3)', duration: 1.6 }) }); };
    el.addEventListener('mouseenter', () => { reset(el, true); inner.forEach((n) => reset(n, true)); });
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const fx = ((e.clientX - r.left) / r.width - 0.5) * (strength / 16);
      const fy = ((e.clientY - r.top) / r.height - 0.5) * (strength / 16);
      gsap.to(el, { x: `${fx}em`, y: `${fy}em`, force3D: true, ease: 'power4.out', duration: 1.6 });
      inner.forEach((n) => gsap.to(n, { x: `${fx}em`, y: `${fy}em`, force3D: true, ease: 'power4.out', duration: 2 }));
    });
    el.addEventListener('mouseleave', () => { reset(el, false); inner.forEach((n) => reset(n, false)); });
  });
}
