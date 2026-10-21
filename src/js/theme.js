import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Fixed chrome carries [data-theme]; sections carry [data-bg="dark|light|image"].
// One ScrollTrigger per (zone, item): the item takes the zone's tone when the zone's edge crosses the item's centre.
// Zones are made contiguous (end = next zone's start) so scrolling back always restores the previous tone.
const setIndex = (zone) => { if (zone.dataset.index) document.querySelectorAll('[data-ring-num]').forEach((n) => { n.textContent = zone.dataset.index; }); };

export function initTheme() {
  const items = [...document.querySelectorAll('[data-theme]')];
  const zones = [...document.querySelectorAll('[data-bg]')];
  if (!items.length || !zones.length) return;
  const chord = (zone, cx) => {
    // a section whose top edge is a half-ellipse (rx = 50vw, ry = data-crown × vw): the edge at x is lower than the apex by this drop
    const ry = parseFloat(zone.dataset.crown || '0') * window.innerWidth;
    if (!ry) return 0;
    const rx = window.innerWidth / 2, xe = Math.min(cx, window.innerWidth - cx);
    return xe >= rx ? 0 : ry * (1 - Math.sqrt(1 - ((rx - xe) / rx) ** 2));
  };
  zones.forEach((zone, i) => items.forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (!rect.height) return;
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const next = zones[i + 1];
    ScrollTrigger.create({
      trigger: zone,
      start: () => `top top+=${cy - chord(zone, cx)}`,
      endTrigger: next || zone,
      end: () => (next ? `top top+=${cy - chord(next, cx)}` : `bottom top+=${cy}`),
      onEnter: () => { item.dataset.on = zone.dataset.bg; setIndex(zone); },
      onEnterBack: () => { item.dataset.on = zone.dataset.bg; setIndex(zone); },
    });
  }));
}
