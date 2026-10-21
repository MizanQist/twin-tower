import 'lenis/dist/lenis.css';
import './styles/fonts.css';
import './styles/reset.css';
import './styles/tokens.css';
import './styles/reveal.css';
import './styles/hero.css';
import './styles/nav.css';
import './styles/page.css';
import './styles/menu.css';
import './styles/quote.css';
import './styles/concept.css';
import './styles/location.css';
import './styles/locmap.css';
import './styles/plan.css';
import './styles/stack.css';
import './styles/brand.css';
import './styles/villa.css';
import './styles/amen.css';
import './styles/space.css';
import './styles/arch.css';
import './styles/dev.css';
import './styles/closing.css';
import './styles/footer.css';
import './styles/sheet.css';

import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './js/eases.js';
import { lenis, lockScroll } from './js/scroll.js';
import { fontsReady } from './js/fonts.js';
import { prime } from './js/reveal.js';
import { initSkipLink } from './js/a11y.js';
import { runPreloader } from './js/preloader.js';
import { initHero } from './js/hero.js';
import { initNav } from './js/nav.js';
import { initTheme } from './js/theme.js';
import { initMagnetic } from './js/magnetic.js';
import { initReasons } from './js/reasons.js';
import { initQuote } from './js/quote.js';
import { initConcept } from './js/concept.js';
import { initLocation } from './js/location.js';
import { initStackSection } from './js/stack-section.js';
import { initVilla } from './js/villa.js';
import { initAmen } from './js/amen.js';
import { initSpace } from './js/space.js';
import { initArch } from './js/arch.js';
import { initDev } from './js/dev.js';
import { initClosing } from './js/closing.js';
import { initFooter } from './js/footer.js';
import { initSheet } from './js/sheet.js';

window.lenis = lenis;          // QA hook
lockScroll();                  // the cover holds the page until the lift
initSkipLink();

fontsReady().then(() => {
  prime(document);             // split once, at scale 1, with the real fonts; set every initial state
  const hero = initHero();     // rest position of the plate
  runPreloader({
    onReady() {
      hero.arm();              // scroll choreography, pins, CTA, section 2
      initNav();
      initTheme();
      initMagnetic();
      initReasons();
      initQuote();
      initConcept();
      initLocation();
      initStackSection();
      initVilla();
      initAmen();
      initSpace();
      initArch();
      initDev();
      initClosing();
      initFooter();
      initSheet();
      ScrollTrigger.refresh();   // the concept area grows during these inits; every trigger measures against the final layout
    },
  });
});
