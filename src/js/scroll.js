import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { REDUCED } from './eases.js';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

// Lenis drives the scroll; GSAP's ticker drives Lenis, so ScrollTrigger and Lenis share one clock.
export const lenis = new Lenis({
  autoRaf: false,
  duration: 1.2,
  smoothWheel: !REDUCED,
  touchMultiplier: 2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

export const lockScroll = () => { lenis.stop(); document.documentElement.classList.add('is-locked'); lenis.scrollTo(0, { immediate: true, force: true }); window.scrollTo(0, 0); };
export const unlockScroll = () => { lenis.start(); document.documentElement.classList.remove('is-locked'); };
export const isPhone = () => window.matchMedia('(max-width: 991px), (orientation: portrait)').matches;
export const scrollToSection = (target) => lenis.scrollTo(target, { duration: 1.2, easing: gsap.parseEase('ease') });
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 40); });
