import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import type Lenis from 'lenis';
import { env, MQ, rand, whileVisible } from './env';
import { Highway, Sparks } from './highway';
import { Engine } from './engine';
import { lineReveal } from './text';
import { LOGO } from '../lib/logo';
import { MEDIA, type Reel, type VideoSource } from '../data/media';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];
const margin = () => (env.mobile ? 0.042 : 0.0115) * window.innerWidth;

/* ================================================================== HERO */
export function heroIntro() {
  const cta = $('#hero-cta');
  if (env.reduced) return;
  gsap.fromTo(cta, { scale: 0 }, { scale: 1, duration: 1, ease: 'power3.out', delay: 0.15 });
}

export function heroScroll() {
  const mm = gsap.matchMedia();
  mm.add(MQ.motion, () => {
    const mark = $('#hero-mark');
    gsap.to(['#hero-mark', '.hero-ja'], {
      y: () => -0.7 * mark.getBoundingClientRect().height,
      ease: 'none',
      scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: 1.5, invalidateOnRefresh: true },
    });
  });
}

/* =================================================================== NAV */
export function nav(lenis: Lenis | null) {
  const logo = $('#nav-logo');
  const btn = $<HTMLButtonElement>('#menu-btn');
  const panel = $('#menu-panel');
  const items = $$('.mp-inner', panel);

  // "RWB" appears after 10 % of scroll (0.4 s fade)
  const showLogo = (v: boolean) => {
    logo.classList.add('is-visible');
    gsap.to(logo, {
      opacity: v ? 1 : 0,
      duration: 0.4,
      ease: 'power3.out',
      overwrite: true,
      onComplete: () => !v && logo.classList.remove('is-visible'),
    });
  };
  ScrollTrigger.create({
    start: () => window.innerHeight * 0.1,
    end: 'max',
    onEnter: () => showLogo(true),
    onLeaveBack: () => showLogo(false),
  });

  // hover/focus: initials stay, R·AUH-W·ELT B·EGRIFF unfolds
  const folds = $$('.nl-x', logo);
  const unfold = (open: boolean) =>
    folds.forEach((f) =>
      gsap.to(f, {
        width: open ? (f.firstElementChild as HTMLElement).offsetWidth : 0,
        duration: open ? 0.7 : 0.6,
        ease: open ? 'power4.out' : 'power4.inOut',
        overwrite: true,
      }),
    );
  logo.addEventListener('mouseenter', () => unfold(true));
  logo.addEventListener('mouseleave', () => unfold(false));
  logo.addEventListener('focus', () => unfold(true));
  logo.addEventListener('blur', () => unfold(false));

  // menu
  let open = false;
  const setOpen = (v: boolean, focusBtn = false) => {
    if (open === v) return;
    open = v;
    btn.setAttribute('aria-expanded', String(v));
    btn.querySelector('.nav-menu-word')!.textContent = v ? 'Close' : 'Menu';
    gsap.killTweensOf(items);
    if (v) {
      panel.hidden = false;
      gsap.fromTo(items, { yPercent: 110 }, { yPercent: 0, duration: env.reduced ? 0 : 0.8, ease: 'power4.out', stagger: 0.06 });
      (panel.querySelector('a') as HTMLElement)?.focus({ preventScroll: true });
    } else {
      gsap.to(items, {
        yPercent: -110,
        duration: env.reduced ? 0 : 0.45,
        ease: 'power4.inOut',
        stagger: 0.04,
        onComplete: () => {
          if (!open) panel.hidden = true;
        },
      });
      if (focusBtn) btn.focus();
    }
  };
  btn.addEventListener('click', () => setOpen(!open));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setOpen(false, true);
  });
  document.addEventListener('pointerdown', (e) => {
    if (open && !(e.target as Element).closest('#nav')) setOpen(false);
  });
  panel.addEventListener('focusout', (e) => {
    const to = e.relatedTarget as Node | null;
    if (open && to && !panel.contains(to) && to !== btn) setOpen(false);
  });

  // in-page anchors through Lenis (keeps "once" states firing on the way)
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href')!;
    const target = id === '#top' ? document.body : document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (open) setOpen(false);
    if (lenis) lenis.scrollTo(target as HTMLElement, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else (target as HTMLElement).scrollIntoView();
    history.replaceState(null, '', id);
    const focusable = target instanceof HTMLElement ? target : null;
    if (focusable && focusable !== document.body) {
      focusable.setAttribute('tabindex', '-1');
      focusable.focus({ preventScroll: true });
    }
  });
}

/* ================================================================== REEL */
export function reel() {
  const section = $('#reel');
  const card = $('#reel-card');
  const copy = $('.reel-text');
  const tc = $('#reel-tc');

  const mm = gsap.matchMedia();
  mm.add(MQ.desktop, () => {
    gsap.to(card, {
      width: () => window.innerWidth / 3,
      height: () => window.innerHeight * 0.35,
      right: margin,
      bottom: margin,
      ease: 'power4.inOut',
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 3, invalidateOnRefresh: true },
    });
  });
  mm.add(MQ.mobile, () => {
    gsap.to(card, {
      width: () => window.innerWidth - margin() * 2,
      height: () => window.innerHeight * 0.42,
      right: margin,
      bottom: margin,
      ease: 'power4.inOut',
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 3, invalidateOnRefresh: true },
    });
  });
  mm.add(MQ.reduced, () => {
    gsap.set(card, {
      width: () => (env.mobile ? window.innerWidth - margin() * 2 : window.innerWidth / 3),
      height: () => window.innerHeight * (env.mobile ? 0.42 : 0.35),
      right: margin,
      bottom: margin,
    });
  });
  lineReveal(copy, { trigger: section, start: env.reduced ? 'top 60%' : 'top+=38% top' });

  const video = card.querySelector<HTMLVideoElement>('#reel-video');
  if (video && MEDIA.reel) reelFilm(section, card, video, tc, MEDIA.reel);
  else reelMontage(card, tc);
}

/** Client footage: fetched on approach, played only on screen, looping at the end. */
function reelFilm(section: HTMLElement, card: HTMLElement, video: HTMLVideoElement, tc: HTMLElement, reel: Reel) {
  const btn = $<HTMLButtonElement>('#reel-toggle', card);
  const FPS = 24000 / 1001;
  grainTile($('.reel-grain', card));
  const sm = env.mobile || env.saveData;
  // reduced motion: the poster stands still until the visitor presses play
  let held = env.reduced;
  let loading: Promise<void> | null = null;

  const fail = () => {
    btn.hidden = true;
    video.hidden = true;
  };
  // desktop keeps 1080p even when only software decoding is on offer
  const choose = async () =>
    (sm ? undefined : await pickSource(video, reel.hd, 1920, 1080)) ?? (await pickSource(video, reel.sm, 1280, 720));
  const load = () =>
    (loading ??= choose().then((s) => {
      if (!s) throw new Error('no playable reel source');
      video.preload = 'auto';
      video.src = s.src;
    }));
  const play = () =>
    load()
      .then(() => video.play())
      .catch((err: Error) => {
        // refused autoplay (Low Power Mode…) keeps the poster and offers play;
        // an abort is just a pause() racing the start
        if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') fail();
      });

  const sync = () => {
    card.classList.toggle('is-playing', !video.paused); // runs the film grain
    btn.toggleAttribute('data-paused', video.paused);
    btn.setAttribute('aria-label', video.paused ? 'Play reel' : 'Pause reel');
  };
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  video.addEventListener('error', fail);
  video.addEventListener('playing', () => video.classList.add('is-ready'), { once: true });

  // non-drop timecode of the frame on screen; restarts with the loop
  const p2 = (n: number) => String(n).padStart(2, '0');
  const stamp = (t: number) => {
    const f = Math.round(t * FPS);
    tc.textContent = `00:${p2(Math.floor(f / 1440) % 60)}:${p2(Math.floor(f / 24) % 60)}:${p2(f % 24)}`;
  };
  if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
    const onFrame = (_: number, meta: { mediaTime: number }) => {
      stamp(meta.mediaTime);
      video.requestVideoFrameCallback(onFrame);
    };
    video.requestVideoFrameCallback(onFrame);
  } else {
    video.addEventListener('timeupdate', () => stamp(video.currentTime));
  }

  // half a screen ahead: early enough to have frames on arrival, late enough
  // to stay out of the loader's way and off a visitor's data until they scroll
  whileVisible(
    section,
    (near) => {
      if (near && !held) load().catch(fail);
    },
    '0px 0px 50% 0px',
  );
  whileVisible(card, (v) => {
    if (v && !held) play();
    else if (!v) video.pause();
  });
  btn.addEventListener('click', () => {
    held = !video.paused;
    if (held) video.pause();
    else play();
  });
}

/**
 * Film grain tile: grey gaussian noise centred on mid-grey. Under `overlay` the
 * grain is zero-mean, so exposure stays put; it bites in the mid-tones and
 * leaves blacks and highlights almost clean, as stock does. i.i.d. noise tiles
 * without seams; drawn at 1 CSS px per sample, the 2× upscale softens it into
 * clumps instead of digital speckle.
 */
function grainTile(el: HTMLElement, size = 256, sigma = 40) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 8) {
    // Box–Muller: two gaussian samples per pair of uniforms
    const r = Math.sqrt(-2 * Math.log(1 - Math.random())) * sigma;
    const a = 2 * Math.PI * Math.random();
    d.fill(128 + r * Math.cos(a), i, i + 3);
    d.fill(128 + r * Math.sin(a), i + 4, i + 7);
    d[i + 3] = d[i + 7] = 255;
  }
  ctx.putImageData(img, 0, 0);
  c.toBlob((b) => b && (el.style.backgroundImage = `url(${URL.createObjectURL(b)})`));
}

/** First source of `list` this device decodes in hardware, else the first it decodes at all. */
async function pickSource(video: HTMLVideoElement, list: VideoSource[], width: number, height: number) {
  const playable = list.filter((s) => video.canPlayType(s.type));
  const mc = navigator.mediaCapabilities;
  if (mc) {
    for (const s of playable) {
      const info = await mc
        .decodingInfo({ type: 'file', video: { contentType: s.type, width, height, bitrate: 2_000_000, framerate: 24 } })
        .catch(() => null);
      if (info?.supported && info.powerEfficient) return s;
    }
  }
  return playable[0];
}

/** Fast-cut montage: coded stand-in while there is no client reel. */
function reelMontage(card: HTMLElement, tc: HTMLElement) {
  const shots = $$('.reel-shot', card);
  const road = new Highway($<HTMLCanvasElement>('.reel-road', card), 900);
  const sparks = new Sparks($<HTMLCanvasElement>('.reel-sparks', card));
  const renderers: Record<string, Highway | Sparks> = { road, sparks };
  let idx = 0;
  let timer = 0;
  let raf = 0;
  let t0 = 0;
  const loop = (t: number) => {
    raf = requestAnimationFrame(loop);
    const shot = shots[idx];
    const r = renderers[shot.dataset.shot ?? ''];
    r?.render(t);
    const s = (t - t0) / 1000;
    const fr = Math.floor((s * 24) % 24);
    tc.textContent = `00:00:${String(Math.floor(s) % 60).padStart(2, '0')}:${String(fr).padStart(2, '0')}`;
  };
  const cut = () => {
    shots[idx].classList.remove('is-on');
    idx = (idx + 1) % shots.length;
    const next = shots[idx];
    next.classList.add('is-on');
    renderers[next.dataset.shot ?? '']?.resetClock();
    timer = window.setTimeout(cut, rand(620, 1100));
  };
  const ro = new ResizeObserver(() => {
    road.resize();
    sparks.resize();
  });
  ro.observe(card);

  if (env.reduced) return;
  whileVisible(card, (v) => {
    if (v && !raf) {
      t0 = performance.now();
      raf = requestAnimationFrame(loop);
      timer = window.setTimeout(cut, 900);
    } else if (!v) {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      raf = 0;
    }
  });
}

/* ================================================================ BUILDS */
export function builds() {
  const section = $('#builds');
  const cards = $$('.build', section);

  cards.forEach((card) => {
    const media = $('.build-media', card);
    const inner = $('.build-media-inner', card);
    const fromLeft = card.dataset.from !== 'right';

    if (env.reduced) {
      gsap.from(media, { opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: media, start: 'top 88%', once: true } });
      return;
    }
    gsap.fromTo(
      media,
      { clipPath: fromLeft ? 'inset(100% 100% 0% 0%)' : 'inset(100% 0% 0% 100%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power4.inOut', scrollTrigger: { trigger: media, start: 'top 88%', once: true } },
    );
    gsap.fromTo(
      inner,
      { yPercent: -5 },
      { yPercent: -20, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 3 } },
    );
  });

  const mm = gsap.matchMedia();
  mm.add(MQ.desktop, () => {
    cards.forEach((card) =>
      gsap.to(card, {
        y: Number(card.dataset.y),
        ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
      }),
    );

    // travelling title: B U I L D S fly to the right corner and back,
    // shrinking to 20 % mid-flight
    const title = $('#builds-title');
    const letters = $$('.bt-l', title);
    const proxies = letters.map(() => ({ p: 0, s: 1 }));
    let D = 0;
    const measureD = () => (D = window.innerWidth - margin() * 2 - title.offsetWidth);
    measureD();
    const apply = () => letters.forEach((l, i) => gsap.set(l, { x: proxies[i].p * D, scale: proxies[i].s }));
    const flight = (from: number, to: number) => ({
      keyframes: { p: [from, to], s: [1, 0.2, 1], easeEach: 'none' },
      duration: 1.4,
      ease: 'power4.inOut',
      stagger: 0.2,
    });
    gsap
      .timeline({
        onUpdate: apply,
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 3, onRefresh: () => (measureD(), apply()) },
      })
      .to({}, { duration: 0.6 })
      .to(proxies, flight(0, 1))
      .to({}, { duration: 1.4 })
      .to(proxies, flight(1, 0))
      .to({}, { duration: 0.6 });
    return () => gsap.set(letters, { clearProps: 'transform' });
  });
  mm.add(MQ.mobile, () => {
    cards.forEach((card) =>
      gsap.to(card, {
        y: Number(card.dataset.y) * 0.25,
        ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
      }),
    );
  });
}

/* ================================================================== FILM */
export function film(lenis: Lenis | null) {
  const section = $('#film');
  const screen = $('#film-screen');
  const canvas = $<HTMLCanvasElement>('#film-canvas');
  const refl = $<HTMLCanvasElement>('#film-reflection');
  const shop = $<HTMLImageElement>('#film-workshop');
  const btn = $<HTMLButtonElement>('#sound-btn');
  const caption = $('#film-caption');
  const state = $('.sound-state', btn);

  const hw = new Highway(canvas, env.saveData ? 800 : 1280);
  const rctx = refl.getContext('2d')!;
  const engine = new Engine();

  // where the blank wall sits in the workshop image (normalised)
  const WALL = { x: 0.497, y: 0.405, floor: 0.6 };
  const IMG = { w: 2688, h: 1520 };
  const target = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = Math.max(vw / IMG.w, vh / IMG.h);
    const ox = (vw - IMG.w * s) / 2;
    const oy = (vh - IMG.h * s) / 2;
    return {
      x: ox + IMG.w * s * WALL.x - vw / 2,
      y: oy + IMG.h * s * WALL.y - vh / 2,
      floor: oy + IMG.h * s * WALL.floor,
    };
  };

  const placeReflection = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const t = target();
    const w = vw * 0.35;
    const h = vh * 0.35;
    const bottom = vh / 2 + t.y + h / 2;
    refl.style.width = `${w}px`;
    refl.style.height = `${h}px`;
    refl.style.left = `${vw / 2 + t.x - w / 2}px`;
    refl.style.top = `${t.floor * 2 - bottom}px`;
    refl.width = Math.round(w / 2);
    refl.height = Math.round(h / 2);
  };

  const mm = gsap.matchMedia();
  mm.add(MQ.desktop, () => {
    placeReflection();
    window.addEventListener('resize', placeReflection);
    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 1.5, invalidateOnRefresh: true },
    });
    tl.fromTo(screen, { scale: 1.4, x: 0, y: 0 }, { scale: 0.35, x: () => target().x, y: () => target().y, ease: 'power4.inOut', duration: 1 }, 0.15)
      .fromTo(shop, { scale: 1.12 }, { scale: 1, ease: 'power4.inOut', duration: 1 }, 0.15)
      .fromTo(refl, { scale: 1.8, opacity: 0 }, { scale: 1, opacity: 0.65, ease: 'power4.inOut', duration: 1 }, 0.15)
      .to({}, { duration: 0.25 });
    return () => window.removeEventListener('resize', placeReflection);
  });
  mm.add(MQ.reduced + ' and (min-width: 992px)', () => {
    placeReflection();
    gsap.set(screen, { scale: 0.35, x: () => target().x, y: () => target().y });
    gsap.set(refl, { opacity: 0.65 });
  });

  const ro = new ResizeObserver(() => hw.resize());
  ro.observe(screen);

  const CAPTIONS = ['[ Air-cooled flat-six idling ]', '[ Sodium lamps hum overhead ]', '[ Tyres hiss on cold asphalt ]'];
  let capI = 0;
  let capT = 0;
  let raf = 0;
  let visible = false;
  const loop = (t: number) => {
    raf = requestAnimationFrame(loop);
    const v = lenis ? Math.min(1, Math.abs(lenis.velocity) / 45) : 0;
    hw.speed = 1 + v * 2.2;
    hw.render(t);
    if (!env.mobile) rctx.drawImage(canvas, 0, 0, refl.width, refl.height);
    if (engine.on) {
      engine.setLoad(v);
      if (t - capT > 3800 || (engine.revving && caption.dataset.rev !== '1')) {
        capT = t;
        caption.dataset.rev = engine.revving ? '1' : '0';
        caption.textContent = engine.revving ? '[ Engine revs — exhaust crackles ]' : CAPTIONS[capI++ % CAPTIONS.length];
      }
    }
  };
  const drawPoster = () => {
    hw.render(performance.now());
    rctx.drawImage(canvas, 0, 0, refl.width, refl.height);
  };

  if (env.reduced) {
    requestAnimationFrame(drawPoster);
    window.addEventListener('resize', () => requestAnimationFrame(drawPoster));
  }

  whileVisible(section, (v) => {
    visible = v;
    engine.setAudible(v);
    if (env.reduced) return;
    if (v && !raf) {
      hw.resetClock();
      raf = requestAnimationFrame(loop);
    } else if (!v) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });

  btn.addEventListener('click', async () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(on));
    state.textContent = on ? 'on' : 'off';
    await engine.setOn(on, visible);
    caption.textContent = on ? CAPTIONS[0] : '';
    capT = performance.now();
  });
}

/* =============================================================== CLUSTER */
export function cluster(lenis: Lenis | null) {
  if (env.reduced) return;
  const box = $('#cluster');
  const items = $$('.cl-item', box);
  const P = env.mobile ? { R: 260, push: 110, rot: 12, scale: 0.1 } : { R: 460, push: 380, rot: 30, scale: 0.2 };

  type Home = { el: HTMLElement; cx: number; cy: number; inside: boolean };
  let homes: Home[] = [];
  const measure = () => {
    homes = items.map((el) => ({
      el,
      cx: el.offsetLeft + el.offsetWidth / 2,
      cy: el.offsetTop + el.offsetHeight / 2,
      inside: false,
    }));
  };
  measure();
  new ResizeObserver(measure).observe(box);
  items.forEach((el) => el.querySelector('img')?.addEventListener('load', measure, { once: true }));

  let pointer: { x: number; y: number } | null = null;
  let queued = false;
  let visible = false;

  const update = () => {
    queued = false;
    if (!visible) return;
    const r = box.getBoundingClientRect();
    const px = pointer ? pointer.x : window.innerWidth / 2;
    const py = pointer ? pointer.y : window.innerHeight / 2;
    for (const h of homes) {
      const dx = r.left + h.cx - px;
      const dy = r.top + h.cy - py;
      const d = Math.hypot(dx, dy) || 0.001;
      if (d < P.R) {
        const f = Math.pow(1 - d / P.R, 1.6);
        gsap.to(h.el, {
          x: (dx / d) * f * P.push,
          y: (dy / d) * f * P.push,
          rotation: Math.sign(dx || 1) * f * P.rot,
          scale: 1 + f * P.scale,
          duration: 0.45,
          ease: 'power4.out',
          overwrite: 'auto',
        });
        h.inside = true;
      } else if (h.inside) {
        h.inside = false;
        gsap.to(h.el, { x: 0, y: 0, rotation: 0, scale: 1, duration: 1.2, ease: 'elastic.out(1, 0.35)', overwrite: 'auto' });
      }
    }
  };
  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };

  whileVisible(box, (v) => (visible = v), '20% 0px');
  if (env.finePointer) {
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      pointer = { x: e.clientX, y: e.clientY };
      queue();
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => {
      pointer = null;
    });
  }
  // no cursor: the screen centre is the virtual cursor while scrolling,
  // and the cluster settles back once scrolling stops
  let idle = 0;
  const release = () => {
    if (pointer) return;
    for (const h of homes) {
      if (!h.inside) continue;
      h.inside = false;
      gsap.to(h.el, { x: 0, y: 0, rotation: 0, scale: 1, duration: 1.2, ease: 'elastic.out(1, 0.35)', overwrite: 'auto' });
    }
  };
  const onScroll = () => {
    queue();
    clearTimeout(idle);
    idle = window.setTimeout(release, 260);
  };
  if (lenis) lenis.on('scroll', onScroll);
  else window.addEventListener('scroll', onScroll, { passive: true });
}

/* ================================================================ GLITCH */
export function glitch() {
  const section = $('#glitch');
  const bg = $('#glitch-bg');
  const line = $('#glitch-line');
  const blocks = $$('[data-scramble]', section);

  // scramble window travelling through each block
  const CHARS = '!<>-_\\/[]{}=+*^?#·:01アウラヴェルト荒車幅';
  const states = blocks.map((el) => ({ el, text: el.textContent ?? '', pos: -Math.floor(rand(0, 14)), win: el.hasAttribute('data-garbage') ? 12 : 5 }));
  let scr = 0;
  const tick = () => {
    for (const s of states) {
      s.pos = s.pos > s.text.length + s.win ? -Math.floor(rand(4, 18)) : s.pos + 1;
      let out = '';
      for (let i = 0; i < s.text.length; i++) {
        const inWin = i >= s.pos && i < s.pos + s.win && s.text[i] !== ' ';
        out += inWin ? CHARS[(Math.random() * CHARS.length) | 0] : s.text[i];
      }
      s.el.textContent = out;
    }
  };
  if (!env.reduced) {
    whileVisible(section, (v) => {
      clearInterval(scr);
      if (v) scr = window.setInterval(tick, 55);
    });
  }

  // self-typing centre line
  const split = SplitText.create(line, { type: 'lines,words,chars', linesClass: 'gl-line' });
  const chars = split.chars as HTMLElement[];
  const caret = document.createElement('span');
  caret.className = 'gl-caret';
  caret.setAttribute('aria-hidden', 'true');

  if (env.reduced) {
    gsap.from(line, { opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: section, start: 'top 60%', once: true } });
  } else {
    gsap.set(chars, { visibility: 'hidden' });
    const type = gsap.timeline({ paused: true });
    chars.forEach((c, i) =>
      type.call(
        () => {
          c.style.visibility = 'visible';
          c.after(caret);
        },
        [],
        i * 0.034,
      ),
    );
    ScrollTrigger.create({ trigger: section, start: 'top 55%', once: true, onEnter: () => type.play() });
  }

  const mm = gsap.matchMedia();
  mm.add(MQ.motion, () => {
    // letters drop like metal shavings, the backdrop dims, details rise
    const fall = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top+=35% top', end: 'bottom bottom', scrub: 2 },
    });
    (split.lines as HTMLElement[]).forEach((ln, i) => {
      const lc = chars.filter((c) => ln.contains(c));
      fall.to(
        lc,
        {
          y: () => rand(40, 160),
          x: () => rand(-10, 10),
          rotation: () => rand(-80, 80),
          opacity: 0,
          ease: 'power2.in',
          duration: 1,
          stagger: { each: 0.008, from: 'random' },
        },
        i * 0.06,
      );
    });
    fall.to(caret, { opacity: 0, duration: 0.2 }, 0);
    fall.to(bg, { opacity: 0.3, ease: 'none', duration: 0.8 }, 0);

    gsap.fromTo('.glitch-d1', { y: 100 }, { y: -300, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 1.5 } });
    gsap.fromTo('.glitch-d2', { y: 100 }, { y: -800, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 3 } });
  });
  mm.add(MQ.reduced, () => {
    gsap.set('.glitch-d1', { y: -300 });
    gsap.set('.glitch-d2', { y: -800 });
  });
}

/* =============================================================== CLOSING */
export function closing() {
  const mark = $<SVGSVGElement>('#closing-mark');
  const groups = $$<SVGGElement>('.wm-l', mark);
  const inners = groups.map((g) => g.querySelector<SVGGElement>('.wm-l-inner')!);
  const hyphenI = groups.findIndex((g) => g.dataset.char === '-');
  const letters = inners.filter((_, i) => i !== hyphenI);
  const hyphen = inners[hyphenI];

  gsap.set(inners, { transformOrigin: '50% 50%' });

  // hovers only start once every letter has landed: a hover during the rise
  // would otherwise interrupt it and leave letters stranded out of line
  let introDone = env.reduced;

  if (env.reduced) {
    gsap.from(mark, { opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: mark, start: 'top 95%', once: true } });
  } else {
    gsap.set(letters, { y: LOGO.height * 1.2 }); // 120 % of the letter height, in SVG units
    gsap.set(hyphen, { scale: 0 });
    const tl = gsap.timeline({ paused: true, onComplete: () => (introDone = true) });
    tl.to(letters, { y: 0, duration: 1.2, ease: 'power4.inOut', stagger: { each: 0.03, from: 'random' } }, 0).to(
      hyphen,
      { scale: 1, duration: 0.9, ease: 'back.out(0.9)' },
      1,
    );
    ScrollTrigger.create({ trigger: mark, start: 'top 95%', once: true, onEnter: () => tl.play() });
  }

  // sunrise: the disc climbs behind the logo as the page ends
  if (!env.reduced) {
    gsap.fromTo(
      '.sun',
      { yPercent: 45 },
      {
        yPercent: -6, // just clears the logo: a sun on the horizon, not a flag
        ease: 'none',
        scrollTrigger: { trigger: '.closing-mark-wrap', start: 'top bottom', end: 'bottom bottom', scrub: 1.5 },
      },
    );
  }

  // hover · "go wide": the letters under the cursor widen and sit lower (the
  // RWB treatment: wider, lower) with a gaussian falloff; the others give up
  // a little width so the logo keeps its overall span and never overflows.
  if (env.reduced) return;
  const boxes = groups.map((g) => {
    const r = g.querySelector('.wm-hit')!;
    return { x: +r.getAttribute('x')!, w: +r.getAttribute('width')! };
  });
  const gaps = boxes.map((b, i) => (i < boxes.length - 1 ? boxes[i + 1].x - (b.x + b.w) : 0));
  const total = boxes.reduce((a, b) => a + b.w, 0);
  const WIDEN = 0.42; // peak extra width before compensation
  const LOWER = 0.14; // peak drop in height
  const SIGMA = 72; // falloff in logo units (≈ one letter)

  let pointerU: number | null = null;
  let queued = false;
  let originSet = false;

  const apply = () => {
    queued = false;
    if (!introDone || pointerU === null) return;
    if (!originSet) {
      gsap.set(inners, { transformOrigin: '0% 100%' }); // grow rightwards from the baseline
      originSet = true;
    }
    const f = boxes.map((b) => Math.exp(-(((pointerU! - (b.x + b.w / 2)) / SIGMA) ** 2)));
    const k = (WIDEN * boxes.reduce((a, b, i) => a + b.w * f[i], 0)) / total;
    let cursor = boxes[0].x;
    boxes.forEach((b, i) => {
      const sx = 1 + WIDEN * f[i] - k;
      gsap.to(inners[i], {
        x: cursor - b.x,
        scaleX: sx,
        scaleY: 1 - LOWER * f[i],
        duration: 0.45,
        ease: 'power4.out',
        overwrite: 'auto',
      });
      cursor += b.w * sx + gaps[i];
    });
  };
  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(apply);
    }
  };

  mark.addEventListener('pointermove', (e) => {
    const r = mark.getBoundingClientRect();
    pointerU = ((e.clientX - r.left) / r.width) * LOGO.width;
    queue();
  });
  mark.addEventListener('pointerleave', () => {
    pointerU = null;
    if (!introDone) return;
    gsap.to(inners, { x: 0, scaleX: 1, scaleY: 1, duration: 1.2, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
  });
}
