import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DUR, STAGGER, REDUCED } from './eases.js';
import { isPhone } from './scroll.js';

// Section 2, the three reasons: a pinned stage; each reason owns a third of the scroll, the hand-off is a triggered flip, never a scrub.
export function initReasons() {
  const root = document.querySelector('[data-reasons]'); if (!root) return;
  const reasons = [...root.querySelectorAll('.reason')];
  const medias = [...root.querySelectorAll('[data-reason-media]')];
  const num = root.querySelector('[data-reasons-num]');
  const segs = [...root.querySelectorAll('[data-reason-seg]')];
  const sticky = root.querySelector('.reasons__sticky');

  if (isPhone()) {
    // stacked: image above each reason, revealed on enter
    reasons.forEach((r, i) => {
      const m = medias[i].cloneNode(true); m.className = 'reason__media-m' + (i === 2 ? ' is-plan' : ''); m.removeAttribute('data-reason-media');
      const n = document.createElement('p'); n.className = 'reason__num-m'; n.textContent = `0${i + 1} / 03`;
      r.prepend(n); r.prepend(m);
      if (REDUCED) return;
      gsap.set([m, n, r.querySelector('.reason__title'), r.querySelector('.reason__text'), r.querySelector('.reason__facts')], { opacity: 0, y: 32 });
      ScrollTrigger.create({ trigger: r, start: 'top 80%', once: true, onEnter: () => gsap.to([m, n, r.querySelector('.reason__title'), r.querySelector('.reason__text'), r.querySelector('.reason__facts')], { opacity: 1, y: 0, duration: DUR.l, ease: 'out', stagger: STAGGER }) });
    });
    return;
  }

  // split titles into masked lines once
  const titles = reasons.map((r) => new SplitText(r.querySelector('.reason__title'), { type: 'lines', linesClass: 'l', mask: 'lines' }));
  const texts = reasons.map((r) => r.querySelector('.reason__text'));
  const facts = reasons.map((r) => r.querySelector('.reason__facts'));
  let active = 0, busy = false;

  const showMedia = (i, dir) => {
    const inEl = medias[i], outEl = medias[active];
    if (REDUCED) { outEl.classList.remove('is-active'); inEl.classList.add('is-active'); return; }
    gsap.set(inEl, { visibility: 'visible', zIndex: 2, clipPath: dir > 0 ? 'inset(0 0 100% 0)' : 'inset(100% 0 0 0)' });
    gsap.set(outEl, { zIndex: 1 });
    gsap.fromTo(inEl.firstElementChild, { scale: 1.12, y: dir > 0 ? '6%' : '-6%' }, { scale: 1, y: '0%', duration: DUR.l, ease: 'inOut' });
    gsap.to(inEl, { clipPath: 'inset(0 0 0 0)', duration: DUR.l, ease: 'inOut', onComplete: () => { outEl.classList.remove('is-active'); gsap.set(outEl, { clearProps: 'zIndex' }); inEl.classList.add('is-active'); gsap.set(inEl, { clearProps: 'clipPath,zIndex,visibility' }); } });
  };

  const go = (i) => {
    if (i === active || busy) return;
    const dir = i > active ? 1 : -1, from = active;
    busy = true;
    showMedia(i, dir);
    if (REDUCED) {
      reasons[from].classList.remove('is-active'); reasons[i].classList.add('is-active'); num.textContent = `0${i + 1}`; active = i; busy = false; return;
    }
    gsap.to(titles[from].lines, { yPercent: -110 * dir, duration: DUR.s, ease: 'in', stagger: STAGGER / 2, overwrite: true });
    gsap.to([texts[from], facts[from]], { opacity: 0, y: -16 * dir, duration: DUR.s, ease: 'in', overwrite: true });
    gsap.to(num, { yPercent: -100 * dir, opacity: 0, duration: DUR.s, ease: 'in', overwrite: true, onComplete: () => { num.textContent = `0${i + 1}`; gsap.fromTo(num, { yPercent: 100 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: DUR.m, ease: 'out' }); } });
    gsap.delayedCall(DUR.s, () => {
      reasons[from].classList.remove('is-active'); reasons[i].classList.add('is-active');
      gsap.fromTo(titles[i].lines, { yPercent: 110 * dir }, { yPercent: 0, duration: DUR.l, ease: 'out', stagger: STAGGER, overwrite: true });
      gsap.fromTo([texts[i], facts[i]], { opacity: 0, y: 24 * dir }, { opacity: 1, y: 0, duration: DUR.l, ease: 'out', stagger: STAGGER, delay: 0.15, overwrite: true });
      active = i; busy = false;
    });
  };

  ScrollTrigger.create({
    trigger: root, start: 'top top', end: 'bottom bottom',
    onUpdate: (t) => {
      const p = t.progress;
      const i = Math.min(2, Math.floor(p * 3));
      segs.forEach((s, k) => s.style.setProperty('--p', Math.max(0, Math.min(1, p * 3 - k))));
      if (i !== active && !busy) go(i);
    },
  });
  // first reveal when the stage arrives
  gsap.set(titles[0].lines, { yPercent: 110 }); gsap.set([texts[0], facts[0]], { opacity: 0, y: 24 });
  ScrollTrigger.create({ trigger: sticky, start: 'top 60%', once: true, onEnter: () => {
    gsap.to(titles[0].lines, { yPercent: 0, duration: DUR.l, ease: 'out', stagger: STAGGER });
    gsap.to([texts[0], facts[0]], { opacity: 1, y: 0, duration: DUR.l, ease: 'out', stagger: STAGGER, delay: 0.2 });
  } });
}
