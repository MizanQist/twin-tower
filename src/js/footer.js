import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { REDUCED } from './eases.js';
import { lenis, isPhone } from './scroll.js';
import { h, p, ctn } from './reveal.js';

gsap.registerPlugin(ScrollTrigger);

// Section 13: the footer. As it rises, the closing spread above shrinks into a framed card (ERA's footer clip) and the
// footer page grows to size; its words stand up once; the fixed chrome steps aside; "To top" rides the page home.
export function initFooter() {
  const root = document.querySelector('.footer'); if (!root) return;
  const inner = root.querySelector('.footer__inner'), clip = document.querySelector('[data-footer-clip]');
  const year = root.querySelector('[data-year]'); if (year) year.textContent = String(new Date().getFullYear());   // before any split touches the line
  const big = root.querySelectorAll('.footer__big'), words = root.querySelectorAll('.footer__addr p, .footer__addr a, .footer__note, .footer__credit'), rest = root.querySelectorAll('.footer__mark, .footer__addr h3, .footer__top, .footer__contact, .footer__info');   // flex rows take ctn, never p
  h(big, 'initial'); p(words, 'initial'); ctn(rest, 'initial'); gsap.set([...big, ...words, ...rest], { visibility: 'visible' });

  const reveal = () => { h(big, 'reveal', 0.1); p(words, 'reveal', 0.1); ctn(rest, 'reveal', 0.1); };
  const hide = () => { h(big, 'hide', 0); p(words, 'hide', 0); ctn(rest, 'hide', 0); };
  const inset = isPhone() ? 'inset(4% 32% 4% 32%)' : 'inset(8% 22% 8% 22%)';

  if (REDUCED) {
    ScrollTrigger.create({ trigger: root, start: 'top 60%', once: true, onEnter: reveal });
  } else {
    gsap.timeline({ scrollTrigger: { trigger: root, start: 'top 30%', end: 'top top', scrub: 0.5, onEnter: reveal, onLeaveBack: hide } })   // 'top top' equals ERA's 'bottom bottom' on a 100svh footer and still completes when the footer runs taller on phones
      .fromTo(clip, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: inset, ease: 'none' }, 0)
      .fromTo(inner, { opacity: 0, scale: 0.75 }, { opacity: 1, scale: 1, ease: 'none' }, 0);
  }
  ScrollTrigger.create({ trigger: root, start: 'top 70%', onEnter: () => document.documentElement.classList.add('is-footer'), onLeaveBack: () => document.documentElement.classList.remove('is-footer') });

  root.querySelector('[data-to-top]')?.addEventListener('click', (e) => { e.preventDefault(); lenis.scrollTo(0, { duration: REDUCED ? 0 : 1.8, easing: gsap.parseEase('inOut') }); });
}
