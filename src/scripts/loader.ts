import gsap from 'gsap';
import { env } from './env';

/**
 * ≈5 s intro on black: counter 0→100, "RWB" draws itself and turns from grey
 * to white, then R and B part, the W fades and the deep-dish wheel spins in the
 * gap. Ends with a dry cut (no fade) to the hero.
 */
export function runLoader(): Promise<void> {
  const loader = document.getElementById('loader');
  if (!loader) return Promise.resolve();

  const num = document.getElementById('loader-num')!;
  const status = document.getElementById('load-status');
  const paths = loader.querySelectorAll<SVGPathElement>('.loader-l path');
  const [r, w, b] = loader.querySelectorAll<SVGGElement>('.loader-l');
  const wheel = loader.querySelector<HTMLImageElement>('.loader-wheel')!;

  const ready = Promise.all([
    document.fonts?.ready ?? Promise.resolve(),
    wheel.decode().catch(() => undefined),
  ]);

  const counter = { v: 0 };
  const setCount = () => (num.textContent = String(Math.round(counter.v)).padStart(3, '0'));

  return new Promise((resolve) => {
    const finish = async () => {
      await ready;
      counter.v = 100;
      setCount();
      spin.kill();
      loader.classList.add('is-done'); // dry cut
      if (status) status.textContent = 'Loaded';
      resolve();
    };

    let spin: gsap.core.Tween;

    if (env.reduced) {
      gsap.set(paths, { strokeDashoffset: 0, fillOpacity: 1, fill: '#fff', stroke: '#fff' });
      spin = gsap.to({}, {});
      gsap.to(counter, { v: 100, duration: 1, ease: 'none', onUpdate: setCount, onComplete: finish });
      return;
    }

    spin = gsap.to(wheel, { rotation: 360, duration: 5.5, ease: 'none', repeat: -1, paused: true });
    gsap.set(paths, { fill: '#8c8c8c' });
    gsap.set(wheel, { scale: 0.55, opacity: 0 });

    const tl = gsap.timeline({ onComplete: finish });
    tl.to(counter, { v: 100, duration: 4.85, ease: 'power2.inOut', onUpdate: setCount }, 0)
      .to(paths, { strokeDashoffset: 0, duration: 1.4, ease: 'power3.inOut', stagger: 0.12 }, 0.1)
      .to(paths, { fillOpacity: 1, fill: '#ffffff', stroke: '#ffffff', duration: 1, ease: 'power3.out' }, 1.45)
      .to(r, { x: '-=58', duration: 1.1, ease: 'power4.inOut' }, 2.65)
      .to(b, { x: '+=58', duration: 1.1, ease: 'power4.inOut' }, 2.65)
      .to(w, { opacity: 0, duration: 0.45, ease: 'power3.out' }, 2.65)
      .add(() => spin.play(), 2.85)
      .to(wheel, { opacity: 1, scale: 1, duration: 1, ease: 'power3.out' }, 2.95)
      .to({}, { duration: 0.15 });
  });
}
