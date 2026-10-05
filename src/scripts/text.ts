import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { env } from './env';

gsap.registerPlugin(SplitText);

const LINE = { duration: 1, stagger: 0.05, ease: 'power4.inOut' };

/** Masked line reveal: yPercent 100→0, 1 s, 0.05 s stagger, at 95 %, once. */
export function lineReveal(el: Element, opts: { trigger?: Element; start?: string } = {}) {
  const scrollTrigger = { trigger: opts.trigger ?? el, start: opts.start ?? 'top 95%', once: true };

  if (env.reduced) {
    gsap.from(el, { opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger });
    return;
  }

  const handMade = el.querySelectorAll('.line-inner');
  if (handMade.length) {
    gsap.from(handMade, { yPercent: 100, ...LINE, scrollTrigger });
    return;
  }

  // auto-split paragraphs; re-split on resize keeps finished lines in place
  let played = false;
  SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    onSplit(self) {
      if (played) return;
      return gsap.from(self.lines, {
        yPercent: 100,
        ...LINE,
        scrollTrigger,
        onComplete: () => (played = true),
      });
    },
  });
}

export function initTextReveals() {
  document.querySelectorAll('[data-lines], [data-lines-auto]').forEach((el) => {
    if (el.closest('.reel-copy')) return; // driven by the reel scene
    lineReveal(el);
  });
  document.querySelectorAll('[data-fade]').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 95%', once: true },
    });
  });
}
