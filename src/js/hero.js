import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { REDUCED } from './eases.js';
import { lenis, isPhone, scrollToSection } from './scroll.js';
import { p } from './reveal.js';

const q = (s) => document.querySelector(s);
const qa = (s) => [...document.querySelectorAll(s)];

export function initHero() {
  const area = q('.hero__area'), sticky = q('.hero__sticky'), media = q('.hero__media'), plate = q('.hero__plate'), img = q('.hero__img img');
  const page = q('.hero__page'), ramp = q('.hero__veil--ramp'), eyebrow = q('.hero__eyebrow');
  const pins = qa('.pin');
  // plate height from the stylesheet's ratio, so the rest position never depends on when the image or CSS arrived
  const plateH = () => Math.max(window.innerHeight, window.innerWidth * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--plate-ratio')) || 0.9003));
  const P = () => Math.max(0, plateH() - window.innerHeight);
  const rest = () => (isPhone() ? 0 : -0.3 * P());
  gsap.set(media, { y: rest() });
  img.addEventListener('load', () => ScrollTrigger.refresh());
  requestAnimationFrame(() => gsap.set(media, { y: rest() }));

  let armed = false;
  let scrub = null;

  // ---------- pointer parallax at rest (desktop): the photograph shifts behind the printed page ----------
  const parallax = (() => {
    if (REDUCED || isPhone() || !window.matchMedia('(pointer: fine)').matches) return { arm() {} };
    const qx = gsap.quickTo(plate, 'x', { duration: 1.2, ease: 'out' });
    const qy = gsap.quickTo(plate, 'y', { duration: 1.2, ease: 'out' });
    let on = false;
    window.addEventListener('pointermove', (e) => {
      if (!on) return;
      const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
      qx(nx * 0.024 * window.innerWidth); qy(ny * 0.016 * window.innerHeight);
    }, { passive: true });
    return { arm(v) { if (on === v) return; on = v; if (!v) { qx(0); qy(0); } } };
  })();

  function buildScrub() {
    if (scrub) { scrub.scrollTrigger && scrub.scrollTrigger.kill(); scrub.kill(); }
    const phone = isPhone();
    scrub = gsap.timeline({ scrollTrigger: { trigger: area, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true, onUpdate: (t) => parallax.arm(t.progress === 0) } });
    if (REDUCED) {
      gsap.set(media, { y: rest() });
      scrub.fromTo(ramp, { opacity: 1 }, { opacity: 0, ease: 'ease', duration: 0.45 }, 0);
      gsap.set(pins, { autoAlpha: 1 });
      return;
    }
    if (!phone) {
      scrub.fromTo(page, { y: 0 }, { y: () => -1.1 * window.innerHeight, ease: 'ease', duration: 0.45 }, 0)
        .fromTo(media, { y: () => -0.3 * P() }, { y: () => -P(), ease: 'ease', duration: 0.45 }, 0)
        .fromTo(ramp, { opacity: 1 }, { opacity: 0, ease: 'ease', duration: 0.45 }, 0)
        .fromTo(eyebrow, { letterSpacing: '0.6em' }, { letterSpacing: '0.9em', ease: 'none', duration: 0.45 }, 0)
        .fromTo(media, { scale: 1, transformOrigin: '68.8% 67%' }, { scale: 1.04, ease: 'ease', duration: 0.55 }, 0)
        .fromTo(pins, { autoAlpha: 0 }, { autoAlpha: 1, ease: 'none', duration: 0.12 }, 0.18)
        .to(media, { scale: 1.9, ease: 'in', duration: 0.45 }, 0.55)
        .to(pins, { autoAlpha: 0, ease: 'none', duration: 0.07 }, 0.6);
    } else {
      scrub.fromTo(page, { y: 0 }, { y: () => -1.0 * window.innerHeight, ease: 'ease', duration: 0.4 }, 0)
        .fromTo(ramp, { opacity: 1 }, { opacity: 0, ease: 'ease', duration: 0.4 }, 0)
        .fromTo(media, { scale: 1, transformOrigin: '50% 55%' }, { scale: 1.08, ease: 'ease', duration: 0.5 }, 0)
        .fromTo(pins, { autoAlpha: 0 }, { autoAlpha: 1, ease: 'none', duration: 0.1 }, 0.25)
        .to(media, { scale: 1.6, ease: 'in', duration: 0.5 }, 0.5)
        .to(pins, { autoAlpha: 0, ease: 'none', duration: 0.05 }, 0.45);
    }
  }

  // ---------- pins: pulse, tip card (desktop) / bottom sheet (phone) ----------
  function initPins() {
    const card = document.createElement('div');
    card.className = 'tipcard'; card.innerHTML = '<p class="tipcard__label"></p><p class="tipcard__text"></p>';
    document.body.appendChild(card);
    const label = card.querySelector('.tipcard__label'), text = card.querySelector('.tipcard__text');
    const phone = isPhone();
    pins.forEach((pin, i) => {
      const btn = pin.querySelector('.pin__btn'), ring = pin.querySelector('.pin__ring');
      if (!REDUCED) gsap.fromTo(ring, { scale: 1, opacity: 1 }, { scale: 1.6, opacity: 0, duration: 1.2, ease: 'in', repeat: -1, delay: i * 0.4 });
      const show = (x, y) => {
        label.textContent = `0${i + 1} / The scheme`; text.textContent = btn.dataset.tip;
        if (phone) { card.classList.add('is-sheet'); gsap.fromTo(card, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'out' }); return; }
        const left = x + 290 > window.innerWidth;
        gsap.set(card, { left: left ? x - 280 : x + 16, top: Math.min(y + 16, window.innerHeight - 140) });
        gsap.fromTo(card, { autoAlpha: 0, scale: 0.96, x: 16 }, { autoAlpha: 1, scale: 1, x: 0, duration: 0.8, ease: 'out', overwrite: true });
      };
      const hide = () => gsap.to(card, { autoAlpha: 0, duration: 0.4, ease: 'in', overwrite: true });
      if (phone) {
        btn.addEventListener('click', (e) => { e.stopPropagation(); show(); });
        document.addEventListener('click', hide);
      } else {
        btn.addEventListener('mouseenter', (e) => show(e.clientX, e.clientY));
        btn.addEventListener('mousemove', (e) => { const left = e.clientX + 290 > window.innerWidth; gsap.to(card, { left: left ? e.clientX - 280 : e.clientX + 16, top: Math.min(e.clientY + 16, window.innerHeight - 140), duration: 2.4, ease: 'power3' }); });
        btn.addEventListener('mouseleave', hide);
        btn.addEventListener('focus', () => { lenis.scrollTo(0.35 * (area.offsetHeight - sticky.offsetHeight), { duration: 1.2 }); const r = btn.getBoundingClientRect(); show(r.left + r.width / 2, r.top + r.height / 2); });
        btn.addEventListener('blur', hide);
      }
    });
  }

  // ---------- the ring CTA: arcs, velocity-coupled text ring, idle nudge ----------
  function initCta() {
    const cta = q('.cta'); if (!cta) return;
    const arcs = qa('.cta__arc'), ringText = q('[data-ring-text]'), arrows = qa('[data-arrow]');
    cta.addEventListener('click', (e) => { e.preventDefault(); scrollToSection('#reasons'); });
    if (REDUCED || isPhone()) return;
    gsap.set(arcs, { attr: { 'stroke-dasharray': '17.2 411.5' } });
    const hover = gsap.timeline({ paused: true })
      .to(arcs, { attr: { 'stroke-dasharray': '205.8 411.5' }, duration: 0.8, ease: 'inOut' }, 0)
      .to(arrows, { y: 4, duration: 0.8, ease: 'out' }, 0);
    cta.addEventListener('mouseenter', () => hover.play());
    cta.addEventListener('mouseleave', () => hover.reverse());
    // velocity-coupled ring
    const st = { speed: 8 }; let angle = 0, dir = 1, idle;
    gsap.ticker.add((t, dt) => { angle += st.speed * Math.min(dt, 100) / 1000; gsap.set(ringText, { rotation: angle, svgOrigin: '66 66' }); });
    lenis.on('scroll', ({ velocity }) => {
      if (velocity) dir = velocity > 0 ? 1 : -1;
      gsap.to(st, { speed: dir * (8 + 0.6 * Math.abs(velocity)), duration: 0.3, ease: 'out', overwrite: true });
      clearTimeout(idle); idle = setTimeout(() => gsap.to(st, { speed: 8 * dir, duration: 1.2, ease: 'out' }), 100);
    });
    // one nudge after 4 s without a scroll
    let nudged = false;
    const timer = setTimeout(() => { if (!nudged && window.scrollY < 2) { nudged = true; gsap.to(arrows, { y: 6, duration: 0.4, ease: 'out', yoyo: true, repeat: 1 }); } }, 4000);
    lenis.on('scroll', () => { nudged = true; clearTimeout(timer); });
  }

  // ---------- section 2: page ring, arc label breath, watermark lag, statement reveal ----------
  function initPage() {
    const pageEl = q('.page'); if (!pageEl) return;
    pageEl.dataset.crown = isPhone() ? '0.30' : '0.22';
    const fill = q('[data-ring-fill]');
    qa('[data-bg="light"][data-index]').forEach((zone) => ScrollTrigger.create({ trigger: zone, start: 'top top', end: 'bottom bottom', onUpdate: (t) => { if (fill) fill.style.strokeDashoffset = 122.5 * (1 - t.progress); } }));
    const arcText = q('[data-arc-text]');
    if (arcText && !REDUCED) gsap.fromTo(arcText, { wordSpacing: '0em', letterSpacing: '0.32em' }, { wordSpacing: '0.6em', letterSpacing: '0.40em', ease: 'none', scrollTrigger: { trigger: pageEl, start: 'top bottom', end: 'top top', scrub: true } });
    const initial = q('.page__initial');
    if (initial && !REDUCED) gsap.fromTo(initial, { y: 135 }, { y: 0, ease: 'none', scrollTrigger: { trigger: pageEl, start: 'top bottom', end: 'top top', scrub: true } });
    const lines = qa('.page__line'), accent = q('[data-accent]');
    if (accent) gsap.set(accent, { autoAlpha: 0, y: '.25em' });
    ScrollTrigger.create({
      trigger: pageEl, start: 'top 70%',
      onEnter: () => { p(lines, 'reveal', 0); gsap.to(accent, { autoAlpha: 1, y: 0, duration: 1.2, delay: 0.3 + 0.1 * lines.length, ease: 'out', overwrite: true }); },
      onLeaveBack: () => { p(lines, 'hide', 0); gsap.to(accent, { autoAlpha: 0, duration: 0.4, ease: 'in', overwrite: true }); },
    });
  }

  return {
    arm() {
      armed = true;
      buildScrub(); initPins(); initCta(); initPage();
      ScrollTrigger.refresh();
      parallax.arm(true);
      let was = isPhone();
      window.addEventListener('resize', () => { const now = isPhone(); if (now !== was) { was = now; buildScrub(); } });
    },
  };
}
