import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP as D } from './map-data.js';
import { REDUCED } from './eases.js';

// The interactive map (after the Cova Manor / Atlantic View recipe): OSM streets in the night palette, Esri imagery on request,
// numbered landmarks with road routes from the site, a list that flies the map, wheel zoom only after a click, drag only after a tap on touch.
export function initLocMap(wrap) {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const root = wrap.closest('.location') || document; const list = root.querySelector('[data-lm-list]'), hint = wrap.querySelector('[data-lm-hint]'), lock = wrap.querySelector('[data-lm-lock]');
  const map = L.map(wrap.querySelector('[data-lm-map]'), { zoomControl: false, scrollWheelZoom: false, dragging: !coarse, zoomSnap: 0.5, minZoom: 11, maxZoom: 19, attributionControl: true });
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
  const streets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxNativeZoom: 19, attribution: OSM, className: 'lm-tiles' });
  const aerial = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 18, attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics' });
  streets.addTo(map);

  const label = (ll, text, cls) => L.marker(ll, { icon: L.divIcon({ className: 'lm-label ' + (cls || ''), html: `<span>${text}</span>`, iconSize: [0, 0] }), interactive: false, keyboard: false }).addTo(map);
  D.labels.forEach((l) => label(l.ll, l.n));
  if (D.plot) L.polygon(D.plot, { color: '#b8803c', weight: 1.5, opacity: 0.9, fillColor: '#b8803c', fillOpacity: 0.18, interactive: false }).addTo(map);
  [1000, 2000].forEach((r) => { L.circle(D.site, { radius: r, color: '#f6f3ec', weight: 1, opacity: 0.25, dashArray: '2 7', fill: false, interactive: false }).addTo(map); label([D.site[0] + r / 111320, D.site[1]], `${r / 1000} km`, 'ring'); });

  const markers = {}, rows = {}, byId = {}; let n = 0, routeLayer = null, caseLayer = null, active = null;
  const gmaps = (Lm) => (Lm.id === 'site' ? `https://www.google.com/maps/search/?api=1&query=${D.site[0]}%2C${D.site[1]}` : `https://www.google.com/maps/dir/?api=1&origin=${D.site[0]}%2C${D.site[1]}&destination=${Lm.ll[0]}%2C${Lm.ll[1]}`);
  const popup = (Lm) => `<div class="lm-pop"><span class="lm-pop__k">${Lm.id === 'site' ? 'The site' : Lm.num}</span><span class="lm-pop__n">${Lm.n}</span><span class="lm-pop__s">${Lm.s}</span>${Lm.km ? `<span class="lm-pop__m"><b>${Lm.km.toFixed(1)}</b> km by road · <b>${Lm.min}</b> min</span>` : ''}<a class="lm-pop__a" href="${gmaps(Lm)}" target="_blank" rel="noopener">${Lm.id === 'site' ? 'Open in Google Maps' : 'Directions in Google Maps'}</a></div>`;
  D.landmarks.forEach((Lm) => {
    const isSite = Lm.id === 'site'; Lm.num = isSite ? '' : String(++n).padStart(2, '0'); byId[Lm.id] = Lm;
    const icon = L.divIcon({ className: 'lm-pin' + (isSite ? ' lm-pin--site' : ''), html: `<i>${Lm.num}</i><b>${Lm.n}</b>`, iconSize: [0, 0] });
    const m = L.marker(Lm.ll, { icon, alt: Lm.n, riseOnHover: true, zIndexOffset: isSite ? 1000 : 0 }).addTo(map);
    m.bindPopup(popup(Lm), { offset: [0, -14], maxWidth: Math.min(300, wrap.clientWidth - 56), minWidth: 200, autoPanPadding: [28, 64], className: 'lm-popw' });
    m.on('click', () => select(Lm.id, false)); m.on('mouseover', () => hi(Lm.id, true)); m.on('mouseout', () => hi(Lm.id, false));
    markers[Lm.id] = m;
    if (list) {
      const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.className = 'lm-row' + (isSite ? ' lm-row--site' : ''); b.dataset.id = Lm.id; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<span class="lm-row__i">${isSite ? '·' : Lm.num}</span><span class="lm-row__t">${Lm.n}<small>${Lm.s}</small></span>${Lm.km ? `<span class="lm-row__d">${Lm.min}<small>min</small></span>` : ''}`;
      b.addEventListener('click', () => select(Lm.id, true));
      b.addEventListener('mouseenter', () => hi(Lm.id, true)); b.addEventListener('mouseleave', () => hi(Lm.id, false)); b.addEventListener('focus', () => hi(Lm.id, true)); b.addEventListener('blur', () => hi(Lm.id, false));
      li.appendChild(b); list.appendChild(li); rows[Lm.id] = b;
    }
  });
  const hi = (id, on) => { const e = markers[id].getElement(); if (e) e.classList.toggle('hi', on); rows[id] && rows[id].classList.toggle('hi', on); };
  const animatePath = (l, dur) => { const p = l && l._path; if (!p || !p.getTotalLength) return; const len = p.getTotalLength(); p.style.transition = 'none'; p.style.strokeDasharray = `${len} ${len}`; p.style.strokeDashoffset = len; p.getBoundingClientRect(); p.style.transition = `stroke-dashoffset ${dur}s cubic-bezier(.75,0,.25,1)`; p.style.strokeDashoffset = '0'; };
  const clearAnim = () => [routeLayer, caseLayer].forEach((l) => { const p = l && l._path; if (p) { p.style.transition = 'none'; p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; } });
  function drawRoute(id) {
    if (routeLayer) { map.removeLayer(routeLayer); map.removeLayer(caseLayer); routeLayer = caseLayer = null; }
    const R = D.routes[id]; if (!R) return;
    caseLayer = L.polyline(R.pts, { color: '#17181b', weight: 7, opacity: 0.9, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(map);
    routeLayer = L.polyline(R.pts, { color: '#f6f3ec', weight: 2.5, opacity: 1, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(map);
    if (!REDUCED) { animatePath(caseLayer, 1.5); animatePath(routeLayer, 1.5); setTimeout(clearAnim, 1600); }
  }
  map.on('zoomstart', clearAnim);
  function select(id, fly) {
    active = id;
    Object.keys(rows).forEach((k) => { rows[k].classList.toggle('on', k === id); rows[k].setAttribute('aria-pressed', String(k === id)); const e = markers[k].getElement(); if (e) e.classList.toggle('on', k === id); });
    if (!fly) { drawRoute(id); return; }
    map.closePopup();
    const Lm = byId[id], R = D.routes[id];
    const b = id === 'site' ? null : R ? L.latLngBounds(R.pts).extend(Lm.ll).extend(D.site) : L.latLngBounds([Lm.ll, D.site]);
    const after = () => { drawRoute(id); markers[id].openPopup(); };
    if (REDUCED) { b ? map.fitBounds(b, { ...pad(56), maxZoom: 16 }) : map.setView(D.site, 16); after(); return; }
    map.once('moveend', after);
    b ? map.flyToBounds(b, { ...pad(56), maxZoom: 16, duration: 1.4 }) : map.flyTo(D.site, 16, { duration: 1.4 });
  }
  const ALL = D.landmarks.map((l) => l.ll);
  // the text column covers the left 40 % of the map on desktop: keep the content in the visible part
  const pad = (t) => (window.matchMedia('(max-width: 991px), (orientation: portrait)').matches ? { paddingTopLeft: [t, t + 72], paddingBottomRight: [t + 24, t] } : { paddingTopLeft: [Math.round(wrap.clientWidth * 0.42), t], paddingBottomRight: [t, t] });
  const VIEWS = {
    site: (a) => { const b = L.latLng(D.site).toBounds(1000); a ? map.flyToBounds(b, { ...pad(40), duration: 1.4 }) : map.fitBounds(b, pad(40)); },
    cbd: (a) => { const b = L.latLngBounds(ALL.filter((ll) => Math.abs(ll[0] - D.site[0]) < 0.05 && Math.abs(ll[1] - D.site[1]) < 0.05)); a ? map.flyToBounds(b, { ...pad(48), duration: 1.6 }) : map.fitBounds(b, pad(48)); },
    abuja: (a) => { const b = L.latLngBounds([[9.00, 7.38], [9.13, 7.56]]); a ? map.flyToBounds(b, { ...pad(24), duration: 1.8 }) : map.fitBounds(b, pad(24)); },
  };
  wrap.querySelectorAll('[data-view]').forEach((x) => x.addEventListener('click', () => { map.closePopup(); VIEWS[x.dataset.view](!REDUCED); wrap.querySelectorAll('[data-view]').forEach((y) => y.setAttribute('aria-pressed', String(y === x))); }));
  const setBase = (b) => { if (b === 'aerial') { map.removeLayer(streets); aerial.addTo(map); } else { map.removeLayer(aerial); streets.addTo(map); } wrap.classList.toggle('is-aerial', b === 'aerial'); wrap.querySelectorAll('[data-base]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.base === b))); };
  wrap.querySelectorAll('[data-base]').forEach((x) => x.addEventListener('click', () => setBase(x.dataset.base)));
  map.on('click focus', () => { map.scrollWheelZoom.enable(); hint && hint.classList.add('is-off'); });
  setTimeout(() => hint && hint.classList.add('is-off'), 8000);
  map.on('blur', () => map.scrollWheelZoom.disable()); wrap.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());
  if (lock) { if (!coarse) lock.hidden = true; lock.addEventListener('click', () => { const on = !map.dragging.enabled(); on ? map.dragging.enable() : map.dragging.disable(); lock.setAttribute('aria-pressed', String(on)); lock.textContent = on ? 'Done exploring' : 'Touch to explore'; }); }
  VIEWS.cbd(false);
  map.whenReady(() => requestAnimationFrame(() => { wrap.classList.add('is-ready'); map.invalidateSize(); select('eagle', false); }));
  window.addEventListener('resize', () => map.invalidateSize());
  return map;
}
