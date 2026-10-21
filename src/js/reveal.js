import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { DUR, STAGGER, DELAY, REDUCED } from './eases.js';

gsap.registerPlugin(SplitText);

// The reveal vocabulary (mirrors the reference site's six primitives).
//   h    display serif: chars stand up and un-flip
//   a    accent word: chars rise from the baseline (the reference slides a script in from the right; we have no script)
//   p    labels/paragraphs: masked lines slide up
//   ctn  any container: rise + fade
//   line hairlines: clip-path wipe
//   slide image wrapper: slanted wipe while the image settles
// Each primitive takes (elements, 'initial' | 'reveal' | 'hide', delay?).

const toArr = (e) => gsap.utils.toArray(e);

function split(el, vars) {
  if (!el._split) el._split = new SplitText(el, { tag: 'span', smartWrap: true, ...vars });
  return el._split;
}

export const h = (els, mode, delay) => toArr(els).forEach((el, i) => {
  if (!el.textContent.trim()) return;
  const s = split(el, { type: 'words,chars', wordsClass: 'w', charsClass: 'c' });
  gsap.set(el, { perspective: 1000 });
  const d = (delay ?? DELAY) + i * STAGGER;
  if (REDUCED) return gsap[mode === 'initial' ? 'set' : 'to'](el, { opacity: mode === 'hide' ? 0 : mode === 'initial' ? 0 : 1, duration: DUR.s, delay: d, overwrite: true });
  if (mode === 'reveal') gsap.fromTo(s.chars, { opacity: 0, yPercent: 50, rotateY: 90 }, { opacity: 1, yPercent: 0, rotateY: 0, duration: DUR.l, delay: d, stagger: STAGGER / 2, ease: 'out', overwrite: true });
  else if (mode === 'hide') gsap.to(s.chars, { opacity: 0, yPercent: -50, rotateY: -90, duration: DUR.s, delay: delay ?? 0, stagger: STAGGER / 4, ease: 'in', overwrite: true });
  else gsap.set(s.chars, { opacity: 0, yPercent: 50, rotateY: 90 });
});

export const a = (els, mode, delay) => toArr(els).forEach((el, i) => {
  if (!el.textContent.trim()) return;
  const s = split(el, { type: 'words,chars', wordsClass: 'w', charsClass: 'c' });
  gsap.set(el, { perspective: 1000 });
  const d = (delay ?? DELAY) + i * STAGGER;
  if (REDUCED) return gsap[mode === 'initial' ? 'set' : 'to'](el, { opacity: mode === 'reveal' ? 1 : 0, duration: DUR.s, delay: d, overwrite: true });
  if (mode === 'reveal') gsap.fromTo(s.chars, { opacity: 0, rotateX: 90, yPercent: 30, transformOrigin: 'center bottom' }, { opacity: 1, rotateX: 0, yPercent: 0, duration: DUR.l, delay: d, stagger: STAGGER / 2, ease: 'out', overwrite: true });
  else if (mode === 'hide') gsap.to(s.chars, { opacity: 0, rotateX: -90, yPercent: -30, transformOrigin: 'center top', duration: DUR.s, delay: delay ?? 0, stagger: STAGGER / 4, ease: 'in', overwrite: true });
  else gsap.set(s.chars, { opacity: 0, rotateX: 90, yPercent: 30, transformOrigin: 'center bottom' });
});

export const p = (els, mode, delay) => toArr(els).forEach((el, i) => {
  if (!el.textContent.trim()) return;
  const s = split(el, { type: 'lines,words', linesClass: 'l', wordsClass: 'w', mask: 'lines' });
  const d = (delay ?? DELAY) + i * STAGGER;
  if (REDUCED) return gsap[mode === 'initial' ? 'set' : 'to'](el, { opacity: mode === 'reveal' ? 1 : 0, duration: DUR.s, delay: d, overwrite: true });
  if (mode === 'reveal') gsap.fromTo(s.lines, { yPercent: 110 }, { yPercent: 0, duration: DUR.l, delay: d, stagger: STAGGER, ease: 'out', overwrite: true });
  else if (mode === 'hide') gsap.to(s.lines, { yPercent: -110, duration: DUR.s, delay: delay ?? 0, stagger: STAGGER / 2, ease: 'in', overwrite: true });
  else gsap.set(s.lines, { yPercent: 110 });
});

export const ctn = (els, mode, delay) => {
  const arr = toArr(els); if (!arr.length) return;
  const y = window.innerWidth >= 992 ? '3.333rem' : '2.5rem';
  if (REDUCED) return gsap[mode === 'initial' ? 'set' : 'to'](arr, { opacity: mode === 'reveal' ? 1 : 0, duration: DUR.s, delay: delay ?? DELAY, overwrite: true });
  if (mode === 'reveal') gsap.fromTo(arr, { opacity: 0, y }, { opacity: 1, y: 0, duration: DUR.l, delay: delay ?? DELAY, stagger: STAGGER, ease: 'out', overwrite: true });
  else if (mode === 'hide') gsap.to(arr, { opacity: 0, duration: DUR.s, delay: delay ?? 0, stagger: STAGGER / 2, ease: 'in', overwrite: true });
  else gsap.set(arr, { opacity: 0, y });
};

export const line = (els, mode, delay) => {
  const arr = toArr(els); if (!arr.length) return;
  const dir = (el) => (el.dataset.line === 'x' ? ['inset(0 100% 0 0)', 'inset(0 0 0 0)', 'inset(0 0 0 100%)'] : ['inset(0 0 100% 0)', 'inset(0 0 0 0)', 'inset(100% 0 0 0)']);
  if (REDUCED) return gsap[mode === 'initial' ? 'set' : 'to'](arr, { opacity: mode === 'reveal' ? 1 : 0, duration: DUR.s, delay: delay ?? DELAY, overwrite: true });
  arr.forEach((el, i) => {
    const [from, to, gone] = dir(el);
    if (mode === 'reveal') gsap.fromTo(el, { clipPath: from }, { clipPath: to, duration: DUR.l, delay: (delay ?? DELAY) + i * STAGGER, ease: 'out', overwrite: true });
    else if (mode === 'hide') gsap.to(el, { clipPath: gone, duration: DUR.s, delay: delay ?? 0, ease: 'in', overwrite: true });
    else gsap.set(el, { clipPath: from });
  });
};

export const slide = (els, mode, delay) => {
  const arr = toArr(els); if (!arr.length) return;
  const inner = arr.map((el) => el.firstElementChild);
  if (REDUCED) return gsap[mode === 'initial' ? 'set' : 'to'](arr, { opacity: mode === 'reveal' ? 1 : 0, duration: DUR.s, delay: delay ?? DELAY, overwrite: true });
  if (mode === 'reveal') {
    gsap.fromTo(arr, { clipPath: 'polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)' }, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: DUR.l, delay: delay ?? DELAY, ease: 'inOut', overwrite: true });
    gsap.fromTo(inner, { scale: 1.5, xPercent: 25 }, { scale: 1, xPercent: 0, duration: DUR.l, delay: delay ?? DELAY, ease: 'inOut', overwrite: true });
  } else if (mode === 'hide') {
    gsap.fromTo(arr, { clipPath: 'polygon(0% 0%, 100% 0%, 125% 100%, 0% 100%)' }, { clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)', duration: DUR.l, delay: delay ?? 0, ease: 'inOut', overwrite: true });
    gsap.to(inner, { scale: 1.5, xPercent: -25, duration: DUR.l, delay: delay ?? 0, ease: 'inOut', overwrite: true });
  } else {
    gsap.set(arr, { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(inner, { scale: 1.5, xPercent: 25 });
  }
};

export const primitives = { h, a, p, ctn, line, slide };

// Run one mode over every [data-reveal="<key>"] inside a root, grouped by key.
export function revealAll(root, mode, delay) {
  Object.entries(primitives).forEach(([key, fn]) => {
    const els = root.querySelectorAll(`[data-reveal="${key}"]`);
    if (els.length) fn(els, mode, delay);
  });
}

// Set initial states and make the elements visible in the same tick (prevents the raw-text flash).
export function prime(root) {
  revealAll(root, 'initial');
  gsap.set(root.querySelectorAll('[data-reveal]'), { visibility: 'visible' });
}
