import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

// The reference site's easing vocabulary, registered once so tweens can say ease: 'out' etc.
CustomEase.create('out', '0.25,1,0.5,1');
CustomEase.create('in', '0.5,0,0.75,0');
CustomEase.create('inOut', '0.75,0,0.25,1');
CustomEase.create('ease', '0.25,0.1,0.25,1');
CustomEase.create('write', '0.333,0,0.667,1');
CustomEase.create('dive', '0.6,0,0,1');
CustomEase.create('loader', 'M0,0,C0,0,0.13,0.34,0.238,0.442,0.305,0.506,0.322,0.514,0.396,0.54,0.478,0.568,0.468,0.56,0.522,0.584,0.572,0.606,0.61,0.719,0.714,0.826,0.798,0.912,1,1,1,1');

export const DUR = { s: 0.4, m: 0.8, l: 1.2 };
export const STAGGER = 0.1;
export const DELAY = 0.3;
export const BP = 992;
export const isDesktop = () => window.innerWidth >= BP;
export const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
