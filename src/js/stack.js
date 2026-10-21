// Twin-Tower exploded stack — three.js module shared by the standalone preview and the site.
// initStack(container, data, opts) builds the scene from plans/stack.json (local coords: x along the podium,
// y across, elevation up). Modes: 'floor' (hover/tap a plate → card) and 'use' (a type lights on every plate);
// spacing 'exploded' | 'compact'. Returns a controller {setMode, setUse, setSpacing, setLevel, look, dispose}.
import * as T from 'three';

export const TYPES = {
  office:  { label: 'Offices',            color: '#ded8cb' },
  res:     { label: 'Residential',        color: '#e3cfbd' },
  kitchen: { label: 'Kitchens',           color: '#d8c3aa' },
  retail:  { label: 'Retail',             color: '#d9cdb9' },
  lobby:   { label: 'Lobbies',            color: '#efe7d6' },
  hall:    { label: 'Circulation',        color: '#ece6da' },
  gym:     { label: 'Gyms',               color: '#cfc5de' },
  core:    { label: 'Cores',              color: '#9c9a95' },
  wet:     { label: 'Bathrooms · WCs',    color: '#c9d6dd' },
  service: { label: 'Services · plant',   color: '#cfcfca' },
  parking: { label: 'Parking',            color: '#d6d6d2' },
  ramp:    { label: 'Ramp',               color: '#bfbfba' },
  track:   { label: 'Running track',      color: '#c98f74' },
  court:   { label: 'Tennis court',       color: '#8fae8a' },
  padel:   { label: 'Padel court',        color: '#8ea6c4' },
  water:   { label: 'Lap pool',           color: '#7fb6c6' },
  green:   { label: 'Lawn · garden',      color: '#a9c293' },
  plant:   { label: 'Planting',           color: '#9bb48b' },
  crown:   { label: 'Crown',              color: '#d9d4c7' },
};
const ACCENT = '#b8742f';
const DIM = '#d2cfc8';

function area(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) { const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length]; a += x0 * y1 - x1 * y0; }
  return Math.abs(a) / 2;
}

function shapeOf(poly, hole) {
  const s = new T.Shape(poly.map(([x, y]) => new T.Vector2(x, y)));
  if (hole) { const h = new T.Path(hole.map(([x, y]) => new T.Vector2(x, y))); s.holes.push(h); }
  return s;
}

export function initStack(container, data, opts = {}) {
  const o = Object.assign({ gap: 7, slab: 0.7, azimuth: 38, elevation: 29, background: null, planLinks: {}, photos: {} }, opts);
  const W = () => container.clientWidth || 800, H = () => container.clientHeight || 600;
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: o.background == null, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(W(), H());
  renderer.outputColorSpace = T.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  const scene = new T.Scene(); if (o.background) scene.background = new T.Color(o.background);
  scene.add(new T.HemisphereLight('#ffffff', '#b9b2a4', 1.15));
  const sun = new T.DirectionalLight('#fff6e8', 1.1); sun.position.set(-120, 200, -160); scene.add(sun);

  // ---- build levels ----
  const levels = data.levels.map((lv, i) => ({ ...lv, index: i, group: new T.Group(), meshes: [], areas: {} }));
  const mats = {};
  const matFor = t => mats[t] || (mats[t] = new T.MeshLambertMaterial({ color: (TYPES[t] || TYPES.hall).color }));
  const edgeMat = new T.LineBasicMaterial({ color: '#4a463f', transparent: true, opacity: .55 });
  for (const lv of levels) {
    const slabH = lv.id === 'ROOF' ? 0.4 : o.slab;
    const footprints = lv.scope === 'podium' ? [[[-data.podium[0] / 2, -data.podium[1] / 2], [data.podium[0] / 2, -data.podium[1] / 2], [data.podium[0] / 2, data.podium[1] / 2], [-data.podium[0] / 2, data.podium[1] / 2]]] : [data.towers.A, data.towers.B];
    for (const fp of footprints) {
      const g = new T.ExtrudeGeometry(shapeOf(fp), { depth: slabH, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
      const m = new T.Mesh(g, new T.MeshLambertMaterial({ color: '#f1ede4' })); m.userData.slab = true; lv.group.add(m);
      lv.group.add(new T.LineSegments(new T.EdgesGeometry(g), edgeMat));
    }
    for (const sp of lv.spaces) {
      const h = lv.id === 'ROOF' ? data.crown : (['track', 'court', 'padel', 'water', 'green', 'plant'].includes(sp.t) ? 0.25 : 0.9);
      let geo;
      if (lv.id === 'ROOF') {                                   // open frame crown: four posts + top ring
        const grp = new T.Group(); const [x0, y0] = sp.poly[0], [x1, y1] = sp.poly[2]; const t = .8;
        const post = (x, y) => { const b = new T.Mesh(new T.BoxGeometry(t, data.crown, t), matFor('crown')); b.position.set(x, slabH + data.crown / 2, -y); grp.add(b); };
        post(x0 + t / 2, y0 + t / 2); post(x1 - t / 2, y0 + t / 2); post(x1 - t / 2, y1 - t / 2); post(x0 + t / 2, y1 - t / 2);
        const ring = (w, d, x, y) => { const b = new T.Mesh(new T.BoxGeometry(w, t, d), matFor('crown')); b.position.set(x, slabH + data.crown - t / 2, -y); grp.add(b); };
        ring(x1 - x0, t, (x0 + x1) / 2, y0 + t / 2); ring(x1 - x0, t, (x0 + x1) / 2, y1 - t / 2); ring(t, y1 - y0, x0 + t / 2, (y0 + y1) / 2); ring(t, y1 - y0, x1 - t / 2, (y0 + y1) / 2);
        grp.userData.type = sp.t; lv.group.add(grp); lv.meshes.push(grp); continue;
      }
      geo = new T.ExtrudeGeometry(shapeOf(sp.poly, sp.hole), { depth: h, bevelEnabled: false }); geo.rotateX(-Math.PI / 2); geo.translate(0, slabH, 0);
      const mesh = new T.Mesh(geo, matFor(sp.t)); mesh.userData = { type: sp.t, name: sp.n, m2: area(sp.poly) - (sp.hole ? area(sp.hole) : 0) };
      lv.group.add(mesh); lv.meshes.push(mesh);
      lv.group.add(new T.LineSegments(new T.EdgesGeometry(geo), edgeMat));
      lv.areas[sp.t] = (lv.areas[sp.t] || 0) + mesh.userData.m2;
    }
    lv.group.userData.level = lv;
    scene.add(lv.group);
  }

  // ---- camera ----
  const cam = new T.OrthographicCamera(-1, 1, 1, -1, -500, 1500);
  let az = o.azimuth, el = o.elevation, zoom = 1;
  function place() {
    const r = T.MathUtils.degToRad;
    const h = levels[levels.length - 1].group.position.y + 20, c = new T.Vector3(0, h / 2, 0);
    cam.position.set(c.x + 400 * Math.cos(r(el)) * Math.sin(r(az)), c.y + 400 * Math.sin(r(el)), c.z + 400 * Math.cos(r(el)) * Math.cos(r(az)));
    cam.lookAt(c);
    const aspect = W() / H(), span = Math.max(data.podium[0] * 1.25, (h + 10) * 1.15 / Math.max(.6, Math.cos(r(el)) * 0 + 1)) / zoom;
    const halfH = span / 2, halfW = halfH * aspect;
    cam.left = -halfW; cam.right = halfW; cam.top = halfH; cam.bottom = -halfH; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
  }

  // ---- state + animation ----
  const state = { mode: 'floor', use: null, spacing: 'exploded', level: null, hover: null };
  const target = new Map(), current = new Map();
  function layout() {
    let y = 0;
    for (const lv of levels) {
      const ex = state.spacing === 'exploded';
      y = ex ? lv.index * (o.gap) + lv.elev + 4 : lv.elev + 4;
      const lift = (state.mode === 'floor' && (state.level === lv.id || state.hover === lv.id)) ? (ex ? 1.5 : 1.0) : 0;
      target.set(lv.id, y + lift);
      if (!current.has(lv.id)) { current.set(lv.id, y); lv.group.position.y = y; }
    }
  }
  function colour() {
    for (const lv of levels) {
      const sel = state.mode === 'floor' && (state.level === lv.id || state.hover === lv.id);
      const any = state.mode === 'floor' && (state.level || state.hover);
      for (const m of lv.meshes) {
        const t = m.userData.type;
        const setCol = (mesh, col) => mesh.material && (mesh.material = mesh.material.clone(), mesh.material.color.set(col));
        const apply = col => m.isGroup ? m.children.forEach(c => setCol(c, col)) : setCol(m, col);
        if (state.mode === 'use') apply(state.use ? (t === state.use ? ACCENT : DIM) : TYPES[t].color);
        else apply(any ? (sel ? TYPES[t].color : DIM) : TYPES[t].color);
      }
      lv.group.children.filter(c => c.userData.slab).forEach(s => { s.material.color.set((state.mode === 'floor' && any && !sel) ? '#e7e4dd' : '#f1ede4'); });
    }
  }
  let raf;
  function tick() {
    let moving = false;
    for (const lv of levels) {
      const c = current.get(lv.id), t = target.get(lv.id); const n = c + (t - c) * .14;
      if (Math.abs(t - n) > .01) moving = true;
      current.set(lv.id, n); lv.group.position.y = n;
    }
    place(); renderer.render(scene, cam);
    raf = moving ? requestAnimationFrame(tick) : null;
  }
  const kick = () => { layout(); colour(); if (!raf) raf = requestAnimationFrame(tick); };

  // ---- picking ----
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  function pick(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const hits = ray.intersectObjects(levels.map(l => l.group), true);
    for (const h of hits) { let obj = h.object; while (obj && !obj.userData.level) obj = obj.parent; if (obj) return obj.userData.level; }
    return null;
  }
  const listeners = [];
  const on = (el, ev, fn) => { el.addEventListener(ev, fn); listeners.push([el, ev, fn]); };
  on(renderer.domElement, 'pointermove', ev => { if (state.mode !== 'floor' || drag.active) return; const lv = pick(ev); const id = lv ? lv.id : null; if (id !== state.hover) { state.hover = id; kick(); o.onHover && o.onHover(lv ? info(lv) : null); } });
  on(renderer.domElement, 'pointerleave', () => { if (state.hover) { state.hover = null; kick(); o.onHover && o.onHover(null); } });
  on(renderer.domElement, 'click', ev => { if (drag.moved) return; const lv = pick(ev); setLevel(lv ? lv.id : null); });
  const drag = { active: false, moved: false, x: 0 };
  on(renderer.domElement, 'pointerdown', ev => { drag.active = true; drag.moved = false; drag.x = ev.clientX; });
  on(window, 'pointerup', () => { drag.active = false; });
  on(window, 'pointermove', ev => { if (!drag.active) return; const dx = ev.clientX - drag.x; if (Math.abs(dx) > 3) drag.moved = true; az -= dx * .35; drag.x = ev.clientX; kick(); });
  on(window, 'resize', () => { renderer.setSize(W(), H()); kick(); });

  function info(lv) {
    const rows = Object.entries(lv.areas).sort((a, b) => b[1] - a[1]).map(([t, m2]) => ({ type: t, label: TYPES[t].label, m2: Math.round(m2) }));
    return { id: lv.id, label: lv.label, use: lv.use, elev: lv.elev, h: lv.h, scope: lv.scope, rows, plan: o.planLinks[lv.id] || null, photo: o.photos[lv.id] || null };
  }
  function useTotals(t) {
    let m2 = 0, n = 0; for (const lv of levels) if (lv.areas[t]) { m2 += lv.areas[t]; n++; }
    return { type: t, label: TYPES[t].label, m2: Math.round(m2), levels: n };
  }
  function setLevel(id) { state.level = id; kick(); o.onSelect && o.onSelect(id ? info(levels.find(l => l.id === id)) : null); }
  function setMode(m) { state.mode = m; state.hover = null; if (m === 'use') state.level = null; kick(); }
  function setUse(t) { state.use = t; state.mode = 'use'; kick(); o.onUse && o.onUse(t ? useTotals(t) : null); }
  function setSpacing(s) { state.spacing = s; kick(); }
  function look(a, e, z) { if (a != null) az = a; if (e != null) el = e; if (z != null) zoom = z; kick(); }
  function dispose() { listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn)); cancelAnimationFrame(raf); renderer.dispose(); renderer.domElement.remove(); }
  kick();
  return { setMode, setUse, setSpacing, setLevel, look, levels: levels.map(info), state, renderer, scene, camera: cam, useTotals };
}
