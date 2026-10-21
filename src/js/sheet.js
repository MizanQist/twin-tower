import gsap from 'gsap';
import { DUR, REDUCED } from './eases.js';
import { lenis } from './scroll.js';

// The sheet: every image card ([data-sheet="title"]) opens its picture in a native dialog that rises from the bottom.
// The card's <picture> is cloned with sizes=100vw so the browser fetches the largest candidate. Closes on the button,
// the scrim, Escape, or a drag down past 120px.
export function initSheet() {
  const dlg = document.querySelector('[data-sheet-dialog]'); if (!dlg || !dlg.showModal) return;
  const scrim = dlg.querySelector('.sheet__scrim'), panel = dlg.querySelector('.sheet__panel'), media = dlg.querySelector('[data-sheet-media]');
  const title = dlg.querySelector('[data-sheet-title]'), text = dlg.querySelector('[data-sheet-text]'), live = document.querySelector('[data-live]');
  let opener = null, busy = false;

  const open = (card) => {
    if (busy || dlg.open) return;
    const pic = card.querySelector('picture') || card.querySelector('img'); if (!pic) return;
    const clone = pic.cloneNode(true);
    clone.querySelectorAll('[sizes]').forEach((el) => el.setAttribute('sizes', '100vw'));
    clone.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; img.alt = card.dataset.sheet || img.alt || ''; });
    media.replaceChildren(clone);
    title.textContent = card.dataset.sheet || ''; text.textContent = card.dataset.sheetText || ''; text.hidden = !text.textContent;
    dlg.setAttribute('aria-label', card.dataset.sheet || 'Image');
    opener = card; lenis.stop(); dlg.showModal();
    if (live) live.textContent = `${title.textContent} opened. Escape closes.`;
    if (REDUCED) { gsap.set(scrim, { opacity: 1 }); gsap.set(panel, { yPercent: 0, y: 0 }); return; }
    busy = true;
    gsap.timeline({ onComplete: () => { busy = false; } })
      .fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: DUR.m, ease: 'out' }, 0)
      .fromTo(panel, { yPercent: 100, y: 0 }, { yPercent: 0, duration: DUR.l, ease: 'out' }, 0);
  };
  const close = () => {
    if (!dlg.open || busy) return;
    const done = () => { dlg.close(); lenis.start(); media.replaceChildren(); busy = false; opener?.focus({ preventScroll: true }); };
    if (REDUCED) return done();
    busy = true;
    gsap.timeline({ onComplete: done }).to(panel, { yPercent: 100, duration: DUR.m, ease: 'in' }, 0).to(scrim, { opacity: 0, duration: DUR.m, ease: 'in' }, 0);
  };
  dlg.querySelectorAll('[data-sheet-close]').forEach((el) => el.addEventListener('click', close));
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });

  // drag the panel down to dismiss
  let y0 = null;
  panel.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; y0 = e.clientY; panel.setPointerCapture(e.pointerId); });
  panel.addEventListener('pointermove', (e) => { if (y0 != null) gsap.set(panel, { y: Math.max(0, e.clientY - y0) }); });
  const release = (e) => { if (y0 == null) return; const dy = e.clientY - y0; y0 = null; if (dy > 120) close(); else gsap.to(panel, { y: 0, duration: DUR.s, ease: 'out' }); };
  panel.addEventListener('pointerup', release); panel.addEventListener('pointercancel', release);

  // the cards
  document.querySelectorAll('[data-sheet]').forEach((card) => {
    card.removeAttribute('aria-hidden'); card.setAttribute('role', 'button'); card.tabIndex = 0; card.setAttribute('aria-label', `Open ${card.dataset.sheet || 'the image'}`);
    const pick = () => (card.classList.contains('reasons__media') && !card.classList.contains('is-active') ? card.parentElement.querySelector('.reasons__media.is-active') || card : card);
    card.addEventListener('click', (e) => { if (e.target.closest('.villa__marks, a, button')) return; open(pick()); });
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(pick()); } });
  });
}
