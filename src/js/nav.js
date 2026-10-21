import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { REDUCED } from './eases.js';
import { lenis, isPhone, scrollToSection } from './scroll.js';
import { trapFocus } from './a11y.js';

const q = (s) => document.querySelector(s);

export function initNav() {
  const desktopHover = window.matchMedia('(hover: hover) and (min-width: 992px)').matches && !REDUCED;

  // "The Villas": character flip with a retracting underline
  const big = q('.nav__big');
  if (big) {
    big.addEventListener('click', (e) => { e.preventDefault(); scrollToSection('#reasons'); });
    if (desktopHover) {
      const [a, b] = big.querySelectorAll('.nav__big-text');
      const line = big.querySelector('.nav__line');
      const sa = new SplitText(a, { type: 'chars', charsClass: 'c', aria: 'none' }), sb = new SplitText(b, { type: 'chars', charsClass: 'c', aria: 'none' });
      gsap.set(big, { perspective: 600 });
      gsap.set(sb.chars, { opacity: 0, x: '-0.4em', yPercent: 25, rotateY: 90 });
      big.addEventListener('mouseenter', () => {
        gsap.to(sa.chars, { opacity: 0, x: '0.4em', yPercent: -25, rotateY: -90, duration: 0.8, ease: 'out', stagger: 0.025, overwrite: true });
        gsap.to(sb.chars, { opacity: 1, x: 0, yPercent: 0, rotateY: 0, duration: 0.8, ease: 'out', delay: 0.2, stagger: 0.025, overwrite: true });
        gsap.to(line, { scaleX: 0, transformOrigin: 'right center', duration: 0.8, ease: 'out', overwrite: true });
      });
      big.addEventListener('mouseleave', () => {
        gsap.to(sa.chars, { opacity: 1, x: 0, yPercent: 0, rotateY: 0, duration: 0.8, ease: 'out', delay: 0.2, stagger: 0.025, overwrite: true });
        gsap.to(sb.chars, { opacity: 0, x: '-0.4em', yPercent: 25, rotateY: 90, duration: 0.8, ease: 'out', stagger: 0.025, overwrite: true });
        gsap.to(line, { scaleX: 1, transformOrigin: 'left center', duration: 0.8, ease: 'out', overwrite: true });
      });
    }
  }

  // Enquire: a tip with the number as text on desktop, a WhatsApp deep link on touch
  const enquire = q('[data-enquire]'), tip = q('#enquiry');
  if (enquire && tip && window.matchMedia('(pointer: fine) and (min-width: 992px)').matches) {
    let open = false, release = null;
    const close = () => { if (!open) return; open = false; enquire.setAttribute('aria-expanded', 'false'); gsap.to(tip, { autoAlpha: 0, duration: 0.4, ease: 'in', onComplete: () => { tip.hidden = true; } }); release && release(); enquire.focus(); };
    enquire.addEventListener('click', (e) => {
      e.preventDefault();
      if (open) return close();
      open = true; tip.hidden = false; enquire.setAttribute('aria-expanded', 'true');
      gsap.fromTo(tip, { autoAlpha: 0, scale: 0.96, y: -8 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.8, ease: 'out' });
      release = trapFocus(tip); tip.querySelector('a').focus();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    document.addEventListener('pointerdown', (e) => { if (open && !tip.contains(e.target) && e.target !== enquire && !enquire.contains(e.target)) close(); });
  }

  // phone menu
  const btn = q('.nav__menu'), menu = q('#menu');
  if (btn && menu) {
    const sheet = menu.querySelector('.menu__sheet'), overlay = menu.querySelector('.menu__overlay');
    let open = false, release = null;
    const openMenu = () => {
      open = true; menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); btn.classList.add('is-open'); lenis.stop();
      gsap.to(overlay, { opacity: 1, duration: 0.8, ease: 'out' });
      gsap.fromTo(sheet, { yPercent: 125 }, { yPercent: 0, duration: REDUCED ? 0.2 : 1.2, ease: 'out' });
      release = trapFocus(sheet); menu.querySelector('.menu__item').focus();
    };
    const closeMenu = () => {
      if (!open) return; open = false; btn.setAttribute('aria-expanded', 'false'); btn.classList.remove('is-open');
      gsap.to(overlay, { opacity: 0, duration: 0.6, ease: 'in' });
      gsap.to(sheet, { yPercent: 125, duration: REDUCED ? 0.2 : 0.8, ease: 'in', onComplete: () => { menu.hidden = true; lenis.start(); } });
      release && release(); btn.focus();
    };
    btn.addEventListener('click', () => (open ? closeMenu() : openMenu()));
    menu.querySelectorAll('[data-menu-close]').forEach((el) => el.addEventListener('click', (e) => { if (el.getAttribute('href') === '#reasons') { e.preventDefault(); closeMenu(); setTimeout(() => scrollToSection('#reasons'), 900); } else closeMenu(); }));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }
}
