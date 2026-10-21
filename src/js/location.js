import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { REDUCED } from './eases.js';
import { p, ctn } from './reveal.js';

// Section 5 (the map's landmark list makes the section taller, so the triggers refresh once it boots): the words reveal as the spread arrives; the interactive map (Leaflet) is loaded only when the section comes near.
export function initLocation() {
  const root = document.querySelector('.location'); if (!root) return;
  const wrap = root.querySelector('[data-location-map]');
  let booted = false;
  const boot = () => { if (booted) return; booted = true; import('./locmap.js').then((m) => { m.initLocMap(wrap); ScrollTrigger.refresh(); }).catch((e) => { console.error(e); wrap.classList.add('is-failed'); }); };
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { boot(); io.disconnect(); } }, { rootMargin: '900px 0px' }); io.observe(wrap); } else boot();
  ScrollTrigger.create({
    trigger: root, start: 'top 60%', once: true,
    onEnter: () => {
      p(root.querySelectorAll('.location__text [data-reveal="p"]'), 'reveal', 0);
      ctn(root.querySelectorAll('.location__text [data-reveal="ctn"]'), 'reveal', 0.4);
      if (!REDUCED) gsap.fromTo(wrap, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'out', delay: 0.2 });
    },
  });
}
