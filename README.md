# Twin Towers, Plot 765 · concept site

Vite 7 + GSAP 3.15 + Lenis + three.js + Leaflet, on the layout and mechanics of the Istinye Villas site (ERA-residence pattern).

- `npm run dev` → http://127.0.0.1:5173 (or the next free port) · `npm run build` → `dist/` · `npm run preview`
- QA: `node ../tools/qa.mjs http://127.0.0.1:5173/` (four widths, console errors, failed requests, CLS, screenshots in `.qa/`)
- Images: `python3 ../tools/make_images.py` from `../tools/images.json` (sources in `../renders/final`, `../renders/interiors/final`, `../renders/axon`, `../plans/web`) → `public/assets/renders/<stem>-<w>.{avif,webp,jpg}`
- Floor slides: `WEB=1 python3 ../tools/plans.py` then `python3 ../tools/build_floors.py` → `src/partials/floors.html`, pasted into `index.html` between the `.villa__slides` tags
- Stack data: `python3 ../tools/plans.py` writes `../plans/stack.json`; copy to `public/assets/stack.json`
- Map data: `python3 ../tools/build_map_data.py` → `src/js/map-data.js`
- Fonts: Instrument Serif (OFL) + Jost (OFL), self-hosted in `public/fonts`

Placeholders awaiting Wrace Group: telephone, WhatsApp number (links use wa.me/234), email; the JV share and programme dates. `robots` is `noindex` until launch.
