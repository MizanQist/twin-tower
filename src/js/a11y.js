import { lenis } from './scroll.js';

export function initSkipLink() {
  const skip = document.querySelector('.skip');
  const main = document.getElementById('main');
  if (!skip || !main) return;
  skip.addEventListener('click', (e) => {
    e.preventDefault();
    lenis.scrollTo(main, { immediate: true, force: true });
    main.focus({ preventScroll: true });
  });
}

// The cover is over: let focus and screen readers reach the page.
export function releasePage() {
  document.querySelectorAll('[inert]').forEach((el) => el.removeAttribute('inert'));
  const live = document.querySelector('[data-live]');
  if (live) live.textContent = '';
}

// Focus trap for the menu / enquiry dialogs.
export function trapFocus(container) {
  const sel = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const onKey = (e) => {
    if (e.key !== 'Tab') return;
    const items = [...container.querySelectorAll(sel)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  container.addEventListener('keydown', onKey);
  return () => container.removeEventListener('keydown', onKey);
}
