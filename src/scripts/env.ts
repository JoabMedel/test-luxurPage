const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;

export const env = {
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  mobile: matchMedia('(max-width: 991px)').matches,
  finePointer: matchMedia('(hover: hover) and (pointer: fine)').matches,
  saveData: !!conn?.saveData,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
};

export const MQ = {
  desktop: '(min-width: 992px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 991px) and (prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
  motion: '(prefers-reduced-motion: no-preference)',
};

/** Runs `cb` while `el` is on screen; returns the observer. */
export function whileVisible(el: Element, cb: (visible: boolean) => void, margin = '0px') {
  const io = new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin });
  io.observe(el);
  return io;
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
