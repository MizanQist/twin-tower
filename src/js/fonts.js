// Resolve once the three preloaded faces are usable (SplitText must never measure the fallback font); never block for more than 2.5 s.
export const fontsReady = () => Promise.race([
  Promise.all([
    document.fonts.load('400 1em "Instrument Serif"'),
    document.fonts.load('400 1em Jost'),
  ]).then(() => document.fonts.ready).catch(() => {}),
  new Promise((r) => setTimeout(r, 2500)),
]);
