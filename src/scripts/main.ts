import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env } from './env';
import { runLoader } from './loader';
import { initFluid } from './fluid';
import { initTextReveals } from './text';
import { builds, closing, cluster, film, glitch, heroIntro, heroScroll, nav, reel } from './scenes';

gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: 'power4.inOut' });

// One scroll engine: Lenis on the GSAP ticker (stopped during the loader).
// Reduced motion keeps native scrolling.
let lenis: Lenis | null = null;
if (!env.reduced) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const safe = (name: string, fn: () => void) => {
  try {
    fn();
  } catch (err) {
    console.error(`[rwb] ${name} failed`, err);
  }
};

safe('nav', () => nav(lenis));
safe('text', initTextReveals);
safe('hero', heroScroll);
safe('reel', reel);
safe('builds', builds);
safe('film', () => film(lenis));
safe('cluster', () => cluster(lenis));
safe('glitch', glitch);
safe('closing', closing);

if (!env.reduced) gsap.set('#hero-cta', { scale: 0 });

runLoader().then(() => {
  document.body.classList.remove('is-loading');
  lenis?.start();
  safe('hero intro', heroIntro);
  if (!env.reduced) {
    safe('fluid', () => {
      initFluid(
        document.getElementById('top')!,
        document.getElementById('hero-fluid') as HTMLCanvasElement,
        document.getElementById('hero-mark') as unknown as SVGSVGElement,
      );
    });
  }
  ScrollTrigger.refresh();

  // arriving by anchor: jump there; "once" states fire for everything passed
  const hash = location.hash && document.querySelector(location.hash);
  if (hash) {
    if (lenis) lenis.scrollTo(hash as HTMLElement, { immediate: true, force: true });
    else (hash as HTMLElement).scrollIntoView();
    ScrollTrigger.update();
  }
});

// late layout shifts (fonts, lazy images) → recalc triggers
document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh());

if (import.meta.env.DEV) Object.assign(window, { ScrollTrigger, gsap });
