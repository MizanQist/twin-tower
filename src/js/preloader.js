import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { REDUCED } from './eases.js';
import { h, p, ctn, line } from './reveal.js';
import { unlockScroll } from './scroll.js';
import { releasePage } from './a11y.js';

gsap.registerPlugin(Flip);

// The cover IS the preloader: the printed page 01 sets itself, the rule under the name counts the storeys 01→12, then the dark lifts.
const COUNT_START = 1.4, COUNT_DUR = 2.4, LIFT_AT = 4.1, SKIP_FROM = 1.5, HARD_CAP = 7000;
// landing time of storey n (s after COUNT_START), sampled from the loader curve
const LANDINGS = [0, 0.12, 0.25, 0.39, 0.55, 0.74, 1.00, 1.30, 1.52, 1.72, 1.96, 2.31];
const COUNT = LANDINGS.length;

const q = (s) => document.querySelector(s);
const qa = (s) => [...document.querySelectorAll(s)];
export const setState = (s) => { document.documentElement.dataset.state = s; };

export function runPreloader({ onReady }) {
  const E = {
    img: q('.hero__img img'), navRule: q('.nav__rule'), brand: q('.nav__brand'), cover: q('.nav__cover'),
    eyebrow: q('.hero__eyebrow'), short: q('.hero__short'), titleA: q('.hero__title-a'), titleB: q('.hero__title-b'),
    counter: q('[data-counter]'), counterLabel: q('[data-counter-label]'), counterWrap: q('.hero__counter'),
    rule: q('.hero__rule'), address: q('.hero__address'), tagA: q('.hero__tag-a'), tagB: q('.hero__tag-b'), fades: q('[data-fades]'),
    facts: qa('.hero__facts .fact'), dividers: qa('.fact__divider'), fact28: q('[data-fact-12]'),
    foot: q('.chrome__foot'), wordmark: q('.wordmark'), cta: q('.cta'),
    page: q('.hero__page'), flat: q('.hero__veil--flat'), ramp: q('.hero__veil--ramp'), grain: q('.hero__grain'),
  };
  const titleChars = () => (E.titleA._split ? E.titleA._split.chars : []);
  const factsLater = E.facts.slice(1);
  const repeat = document.documentElement.dataset.visited === '1';
  try { sessionStorage.setItem('tt-visited', '1'); } catch (e) {}

  // readiness: the sweep may never finish before the picture has
  let isReady = false;
  const readyPromise = Promise.race([
    (E.img.decode ? E.img.decode() : Promise.resolve()).catch(() => {}),
    new Promise((r) => setTimeout(r, HARD_CAP)),
  ]).then(() => { isReady = true; });

  // manual initial states (everything [data-reveal] was primed already)
  gsap.set(E.short, { scaleX: 0, transformOrigin: 'left center' });
  gsap.set(E.titleB, { autoAlpha: 0, rotateX: 90, yPercent: 30, transformOrigin: 'center bottom' });
  gsap.set(E.titleA, { perspective: 1000 });
  gsap.set(E.counterWrap, { opacity: 0, y: 24 });
  gsap.set(E.rule, { scaleX: 0 });
  gsap.set(factsLater, { opacity: 0, y: 16 });
  gsap.set(E.dividers, { scaleY: 0 });
  gsap.set(E.facts[0], { visibility: 'hidden' });
  gsap.set(E.fades, { autoAlpha: 0, y: '.25em' });
  gsap.set(E.ramp, { opacity: 0 });
  setState('cover');

  const setCount = (n) => { E.counter.textContent = String(n).padStart(2, '0'); };

  // every cover piece to its finished state (skip and repeat paths)
  function finishCover(dur) {
    const to = (t, vars) => gsap.to(t, { duration: dur, ease: 'out', overwrite: true, ...vars });
    [E.brand, E.eyebrow, E.address, E.titleA, E.navRule, E.foot, E.wordmark].forEach((el) => to(el, { opacity: 1 }));
    [E.brand, E.cover, E.eyebrow, E.address].forEach((el) => el._split && to(el._split.lines, { yPercent: 0 }));
    to(titleChars(), { opacity: 1, yPercent: 0, rotateY: 0, marginRight: '-0.03em' });
    [E.navRule, E.foot].forEach((el) => to(el, { clipPath: 'inset(0% 0% 0% 0%)' }));
    to(E.short, { scaleX: 1 }); to(E.rule, { scaleX: 1 });
    to(E.titleB, { autoAlpha: 1, rotateX: 0, yPercent: 0 });
    to(E.counterWrap, { opacity: 1, y: 0 }); setCount(COUNT);
    to(factsLater, { opacity: 1, y: 0 }); to(E.dividers, { scaleY: 1 });
    to(E.wordmark, { opacity: 1, y: 0 });
  }

  function ready() {
    setState('ready');
    unlockScroll();
    releasePage();
    ScrollTrigger.refresh();
    onReady && onReady();
  }

  // the lift: daybreak over the cover, the 12 drops into the fact line, the nav flips, the sentence arrives
  function lift({ fast = false } = {}) {
    setState('lift');
    const d = fast ? 1.6 : 2.0;
    const tl = gsap.timeline();
    tl.to(E.flat, { opacity: 0, duration: d, ease: 'out' }, 0)
      .to(E.ramp, { opacity: 1, duration: d, ease: 'out' }, 0)
      .to(E.page, { scale: 1, duration: d, ease: 'out' }, 0)
      .to(E.grain, { opacity: 0.025, duration: d, ease: 'out' }, 0)
      .to(E.counterLabel, { opacity: 0, duration: 0.3, ease: 'in' }, 0);
    if (!fast) {
      tl.add(() => {
        gsap.set(E.facts[0], { visibility: 'visible' });
        gsap.set(E.fact28, { visibility: 'hidden' });
        Flip.fit(E.counter, E.fact28, { duration: 1.2, ease: 'out', scale: true });
      }, 0.3)
        .add(() => { gsap.set(E.fact28, { visibility: 'visible' }); gsap.set(E.counterWrap, { visibility: 'hidden' }); }, 1.8);
    } else {
      gsap.set(E.facts[0], { visibility: 'visible' }); gsap.set(E.counterWrap, { visibility: 'hidden' });
    }
    tl.add(() => h([E.tagA, E.tagB], 'reveal', 0), fast ? 0.3 : 0.3)
      .add(() => ctn(E.cta, 'reveal', 0), 0.4)
      .to(E.foot, { '--gap': '164px', duration: 0.8, ease: 'out' }, 0.4)
      .add(ready, fast ? 1.0 : 1.2)
      .fromTo(E.fades, { autoAlpha: 0, y: '.25em' }, { autoAlpha: 1, y: 0, duration: fast ? 0.8 : 1.2, ease: 'out' }, fast ? 0.5 : 1.3)
      .add(() => { E.flat.style.display = 'none'; }, d);
    return tl;
  }

  // ---------- reduced motion: no theatre ----------
  if (REDUCED) {
    finishCover(0);
    gsap.set(E.page, { scale: 1 });
    gsap.set(E.facts[0], { visibility: 'visible' }); gsap.set(E.counterWrap, { visibility: 'hidden' });
    gsap.timeline()
      .to(E.flat, { opacity: 0, duration: 0.6 }, 0.6)
      .to(E.ramp, { opacity: 1, duration: 0.6 }, 0.6)
      .add(() => setState('lift'), 0.6)
      .to([E.tagA, E.tagB, E.fades, E.cta], { autoAlpha: 1, duration: 0.4 }, 0.6)
      .set(E.foot, { '--gap': '164px' }, 0.6)
      .add(ready, 1.2)
      .add(() => { E.flat.style.display = 'none'; }, 1.3);
    return;
  }

  // ---------- repeat visit: the finished cover, a short daybreak ----------
  if (repeat) {
    finishCover(0);
    gsap.set(E.page, { scale: 1.03, transformOrigin: 'left bottom' });
    gsap.delayedCall(0.4, () => lift({ fast: true }));
    return;
  }

  // ---------- first visit ----------
  gsap.set(E.page, { scale: 1.03, transformOrigin: 'left bottom' });
  const tl = gsap.timeline({ paused: true });
  tl.add(() => { line(E.navRule, 'reveal', 0); p(E.brand, 'reveal', 0); }, 0)
    .add(() => p(E.cover, 'reveal', 0), 0.1)
    .add(() => p(E.eyebrow, 'reveal', 0), 0.3)
    .to(E.short, { scaleX: 1, duration: 0.8, ease: 'out' }, 0.5)
    .add(() => { h(E.titleA, 'reveal', 0); gsap.fromTo(titleChars(), { marginRight: '0.02em' }, { marginRight: '-0.03em', duration: 1.5, ease: 'out' }); }, 0.6)
    .to(E.titleB, { autoAlpha: 1, rotateX: 0, yPercent: 0, duration: 1.2, ease: 'out' }, 1.0)
    .to(E.rule, { scaleX: 1, duration: COUNT_DUR, ease: 'loader' }, COUNT_START)
    .to(E.counterWrap, { opacity: 1, y: 0, duration: 0.4, ease: 'out' }, COUNT_START)
    .add(() => p(E.address, 'reveal', 0), 2.0)
    .add(() => { line(E.foot, 'reveal', 0); ctn(E.wordmark, 'reveal', 0); }, 2.4)
    .to(factsLater, { opacity: 1, y: 0, duration: 1.2, ease: 'out', stagger: 0.1 }, 2.4)
    .to(E.dividers, { scaleY: 1, duration: 0.8, ease: 'out', stagger: 0.1 }, 2.4);
  LANDINGS.forEach((t, i) => tl.add(() => setCount(i + 1), COUNT_START + t));
  tl.addLabel('hold27', COUNT_START + LANDINGS[COUNT - 2] + 0.005)
    .add(() => { if (!isReady) { tl.pause(); readyPromise.then(() => tl.play()); } }, 'hold27')
    .addLabel('lift', LIFT_AT)
    .add(() => lift(), 'lift');
  tl.play();

  // skip: any input after 1.5 s finishes the cover in 0.3 s and lifts
  let skipped = false;
  const skip = () => {
    if (skipped || tl.time() < SKIP_FROM || tl.time() >= LIFT_AT) return;
    skipped = true; tl.kill();
    finishCover(0.3);
    readyPromise.then(() => lift());
  };
  ['keydown', 'wheel', 'touchstart', 'pointerdown'].forEach((ev) => window.addEventListener(ev, skip, { passive: true }));
}
