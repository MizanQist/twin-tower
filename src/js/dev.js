import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DUR, STAGGER, REDUCED } from './eases.js';
import { h, p, ctn, line } from './reveal.js';

gsap.registerPlugin(ScrollTrigger);

// Section 11: the developer, sales, approvals and the address, as ERA's accordion: one card open at a time, the plus
// turns into a cross, the body grows to its height while its words and lines reveal.
export function initDev() {
  const root = document.querySelector('.dev'); if (!root) return;
  const cards = [...root.querySelectorAll('[data-dev-card]')];
  let open = null;

  const parts = (card) => ({ p: card.querySelectorAll('[data-part="p"]'), ctn: card.querySelectorAll('[data-part="ctn"]') });
  const show = (card, instant) => {
    const head = card.querySelector('[data-dev-head]'), body = card.querySelector('[data-dev-body]'), q = parts(card);
    card.classList.add('is-open'); head.setAttribute('aria-expanded', 'true'); body.hidden = false;
    if (REDUCED || instant) { gsap.set(body, { height: 'auto' }); gsap.set(head.querySelector('.dev__plus'), { rotate: 45 }); p(q.p, 'reveal', 0); ctn(q.ctn, 'reveal', 0); if (!instant) ScrollTrigger.refresh(); return; }
    gsap.to(body, { height: 'auto', duration: DUR.l, ease: 'out', overwrite: true, onComplete: () => ScrollTrigger.refresh() });
    gsap.to(head.querySelector('.dev__plus'), { rotate: 45, duration: DUR.m, ease: 'inOut', overwrite: true });
    p(q.p, 'reveal', 0.15); ctn(q.ctn, 'reveal', 0.25);
  };
  const hide = (card) => {
    const head = card.querySelector('[data-dev-head]'), body = card.querySelector('[data-dev-body]'), q = parts(card);
    card.classList.remove('is-open'); head.setAttribute('aria-expanded', 'false');
    const done = () => { body.hidden = true; ScrollTrigger.refresh(); };
    if (REDUCED) { gsap.set(body, { height: 0 }); gsap.set(head.querySelector('.dev__plus'), { rotate: 0 }); done(); return; }
    gsap.to(body, { height: 0, duration: DUR.l, ease: 'out', overwrite: true, onComplete: done });
    gsap.to(head.querySelector('.dev__plus'), { rotate: 0, duration: DUR.m, ease: 'inOut', overwrite: true });
    p(q.p, 'hide', 0); ctn(q.ctn, 'hide', 0);
  };

  cards.forEach((card) => {
    const head = card.querySelector('[data-dev-head]'), body = card.querySelector('[data-dev-body]'), q = parts(card);
    gsap.set(body, { height: 0 }); body.hidden = true; head.setAttribute('aria-expanded', 'false');
    p(q.p, 'initial'); ctn(q.ctn, 'initial'); gsap.set([...q.p, ...q.ctn], { visibility: 'visible' });
    head.addEventListener('click', () => {
      if (open === card) { hide(card); open = null; return; }
      if (open) hide(open);
      open = card; show(card);
      // keep the opened title in view when a taller card above it closes
      requestAnimationFrame(() => { const r = head.getBoundingClientRect(); if (r.top < 0) window.lenis.scrollTo(head, { offset: -120, duration: 0.8 }); });
    });
  });

  // ---- the page arrives: statement, divider, the titles in turn; the first card opens on its own
  ScrollTrigger.create({
    trigger: root, start: 'top 65%', once: true,
    onEnter: () => {
      p(root.querySelectorAll('.dev__statement'), 'reveal', 0);
      line(root.querySelectorAll('.dev__divider'), 'reveal', 0.2);
      h(root.querySelectorAll('.dev__title'), 'reveal', 0.4);
      ctn(root.querySelectorAll('.dev__plus'), 'reveal', 0.6);
      gsap.delayedCall(REDUCED ? 0 : 0.3, () => { if (!open) { open = cards[0]; show(cards[0]); } });
    },
  });
}
