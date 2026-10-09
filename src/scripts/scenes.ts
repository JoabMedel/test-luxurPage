import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import type Lenis from 'lenis';
import { env, MQ, rand, whileVisible } from './env';
import { Highway, Sparks } from './highway';
import { Engine } from './engine';
import { lineReveal } from './text';
import { LOGO } from '../lib/logo';
import { SCRAMBLE_CHARS } from '../lib/scramble';
import { MEDIA, type LoopVideo, type VideoSource } from '../data/media';

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

/** Client footage with film grain and a running timecode. */
function reelFilm(section: HTMLElement, card: HTMLElement, video: HTMLVideoElement, tc: HTMLElement, reel: LoopVideo) {
  const FPS = 24000 / 1001;
  grainTile($('.grain', card));
  loopVideo({
    section,
    view: card,
    video,
    media: reel,
    btn: $<HTMLButtonElement>('#reel-toggle', card),
    name: 'reel',
    onState: (playing) => card.classList.toggle('is-playing', playing), // runs the film grain
  });

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
}

/**
 * Silent looping video (reel, film): the best source for this device, fetched
 * on approach, played only while on screen, with a play/pause button. Reduced
 * motion keeps the poster until the visitor presses play.
 */
function loopVideo(o: {
  /** proximity to this starts the download */
  section: HTMLElement;
  /** visibility of this plays/pauses */
  view: Element;
  video: HTMLVideoElement;
  media: LoopVideo;
  btn: HTMLButtonElement;
  name: string;
  onState?: (playing: boolean) => void;
  /** after the video and its button are hidden */
  onFail?: () => void;
}) {
  const { video, btn } = o;
  let held = env.reduced;
  let loading: Promise<void> | null = null;

  const fail = () => {
    if (video.hidden) return;
    btn.hidden = true;
    video.hidden = true;
    o.onFail?.();
  };
  const load = () =>
    (loading ??= chooseSource(video, o.media).then((s) => {
      if (!s) throw new Error(`no playable ${o.name} source`);
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
    btn.toggleAttribute('data-paused', video.paused);
    btn.setAttribute('aria-label', `${video.paused ? 'Play' : 'Pause'} ${o.name}`);
    o.onState?.(!video.paused);
  };
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  video.addEventListener('error', fail);
  video.addEventListener('playing', () => video.classList.add('is-ready'), { once: true });

  // half a screen ahead: early enough to have frames on arrival, late enough
  // to stay out of the loader's way and off a visitor's data until they scroll
  whileVisible(
    o.section,
    (near) => {
      if (near && !held) load().catch(fail);
    },
    '0px 0px 50% 0px',
  );
  whileVisible(o.view, (v) => {
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
let grainURL: Promise<string | null> | null = null;
function grainTile(el: HTMLElement, size = 256, sigma = 40) {
  grainURL ??= new Promise((resolve) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    if (!ctx) return resolve(null);
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
    c.toBlob((b) => resolve(b && URL.createObjectURL(b)));
  });
  // one tile, shared by every grain layer
  grainURL.then((url) => url && (el.style.backgroundImage = `url(${url})`));
}

/** The source a loop video plays on this device; desktop keeps 1080p even when only software decoding is on offer. */
export async function chooseSource(video: HTMLVideoElement, media: LoopVideo) {
  const sm = env.mobile || env.saveData;
  return (sm ? undefined : await pickSource(video, media.hd, 1920, 1080)) ?? (await pickSource(video, media.sm, 1280, 720));
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
type Box = { x: number; y: number; w: number; h: number };

/**
 * The screen mirrored in the polished workshop floor. A glossy floor blurs what
 * it reflects, more the further out and more along the line of sight than
 * across it: the picture keeps some shape at the wall line, then dissolves into
 * vertical streaks and a broad spill of its light. The blur is resampling
 * through small buffers (cheap, the same in every browser), eased over a few
 * frames so passing highlights don't shimmer. The canvas is screened onto the
 * photo, so the film's blacks leave the floor's own sheen as it was.
 */
function floorReflection(out: HTMLCanvasElement) {
  const Q = 0.25; // canvas px per CSS px: the CSS blur hides the upscale
  const make = (w = 1, h = 1) => Object.assign(document.createElement('canvas'), { width: w, height: h });
  const ctx2d = (c: HTMLCanvasElement) => {
    const x = c.getContext('2d')!;
    x.imageSmoothingQuality = 'medium'; // mipmapped; 'high' adds a bicubic GPU pipeline
    return x;
  };
  // the picture filtered down in steps of 4× at most (larger ones alias), and
  // how much of each new frame every step takes in
  const steps = [make(192, 108), make(96, 54), make(48, 16), make(24, 6)].map((c, i) => ({ c, x: ctx2d(c), k: [1, 0.6, 0.5, 0.35][i] }));
  const shape = steps[1].c; // what survives near the wall line
  const streaks = steps[3].c; // few rows, more columns: smeared down the floor
  const detail = make();
  const fade = make();
  const mask = make();
  let o = ctx2d(out);
  let d = ctx2d(detail);
  let L = { pad: 0, gap: 0, w: 0, h: 0 }; // in canvas px

  const mirror = (x: CanvasRenderingContext2D, img: CanvasImageSource, dx: number, dy: number, dw: number, dh: number) => {
    x.setTransform(1, 0, 0, -1, 0, 2 * dy + dh);
    x.drawImage(img, dx, dy, dw, dh);
    x.setTransform(1, 0, 0, 1, 0, 0);
  };
  // alpha = across × down; `across` is a half profile from the centre out,
  // both as [canvas px, alpha] stops
  const paint = (c: HTMLCanvasElement, across: number[][], down: number[][]) => {
    const x = ctx2d(c);
    const grad = (w: number, h: number, stops: number[][], len: number) => {
      const g = x.createLinearGradient(0, 0, w, h);
      for (const [at, a] of stops) g.addColorStop(gsap.utils.clamp(0, 1, at / len), `rgba(0,0,0,${a})`);
      return g;
    };
    const cx = c.width / 2;
    const row = across.flatMap(([at, a]) => [[cx - at, a], [cx + at, a]]);
    x.fillStyle = grad(c.width, 0, row, c.width);
    x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in';
    x.fillStyle = grad(0, c.height, down, c.height);
    x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-over';
  };

  return {
    /** `screen` is the picture's final box, `floor` the wall line, `origin` the photo's transform origin (all viewport px) */
    place(screen: Box, floor: number, origin: { x: number; y: number }) {
      const pad = screen.w * 0.35;
      const gap = Math.max(0, floor - screen.y - screen.h);
      const left = screen.x - pad;
      const W = screen.w + pad * 2;
      const H = gap + screen.h * 1.5;
      Object.assign(out.style, {
        left: `${left}px`,
        top: `${floor}px`,
        width: `${W}px`,
        height: `${H}px`,
        // scales with the photo, so it stays on the floor through the pull-back
        transformOrigin: `${origin.x - left}px ${origin.y - floor}px`,
      });
      for (const c of [out, detail, fade, mask]) Object.assign(c, { width: Math.round(W * Q), height: Math.round(H * Q) });
      o = ctx2d(out);
      d = ctx2d(detail);
      L = { pad: pad * Q, gap: gap * Q, w: screen.w * Q, h: screen.h * Q };
      const hw = L.w / 2;
      const top = L.gap;
      // the whole reflection: full under the middle of the screen, soft past its
      // edges, strongest at the wall line and gone well before the viewer
      paint(
        mask,
        [[0, 1], [hw * 0.7, 1], [hw, 0.55], [hw * 1.25, 0.2], [hw + L.pad, 0]],
        [[0, 0], [top * 0.6, 1], [top + L.h * 0.25, 0.8], [top + L.h * 0.6, 0.38], [top + L.h, 0.1], [out.height, 0]],
      );
      // the shape only holds near the wall line, inside the screen's width
      paint(fade, [[0, 1], [hw * 0.75, 1], [hw, 0]], [[top, 1], [top + L.h * 0.7, 0]]);
    },
    /** `settle` draws the picture fully at once (a still frame) */
    draw(src: CanvasImageSource, settle = false) {
      if (!L.w) return;
      let prev = src;
      for (const s of steps) {
        s.x.globalAlpha = settle ? 1 : s.k;
        s.x.drawImage(prev, 0, 0, s.c.width, s.c.height);
        prev = s.c;
      }
      const { width: W, height: H } = out;
      o.clearRect(0, 0, W, H);
      // the spill: the film's light pooled wider than the screen
      o.globalAlpha = 0.45;
      mirror(o, streaks, 0, L.gap, W, L.h * 1.5);
      o.globalAlpha = 1;
      mirror(o, streaks, L.pad - L.w * 0.1, L.gap, L.w * 1.2, L.h * 1.25);
      d.clearRect(0, 0, W, H);
      mirror(d, shape, L.pad, L.gap, L.w, L.h);
      d.globalCompositeOperation = 'destination-in';
      d.drawImage(fade, 0, 0);
      d.globalCompositeOperation = 'source-over';
      o.drawImage(detail, 0, 0);
      o.globalAlpha = 1;
      o.globalCompositeOperation = 'destination-in';
      o.drawImage(mask, 0, 0);
      o.globalCompositeOperation = 'source-over';
    },
  };
}

export function film(lenis: Lenis | null) {
  const section = $('#film');
  const screen = $('#film-screen');
  const canvas = $<HTMLCanvasElement>('#film-canvas');
  const refl = $<HTMLCanvasElement>('#film-reflection');
  const glow = $('#film-glow');
  const shop = $<HTMLImageElement>('#film-workshop');
  const grain = screen.querySelector<HTMLElement>('#film-grain');
  const btn = $<HTMLButtonElement>('#sound-btn');
  const caption = $('#film-caption');
  const state = $('.sound-state', btn);

  const hw = new Highway(canvas, env.saveData ? 800 : 1280);
  const reflection = floorReflection(refl);
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

  // the screen's size in the wall, and how strongly the floor reflects it
  const END = 0.35;
  const GLOSS = 0.6;
  const placeReflection = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const t = target();
    const w = vw * END;
    const h = vh * END;
    const [ox, oy] = getComputedStyle(shop).transformOrigin.split(' ').map(parseFloat);
    const box = { x: vw / 2 + t.x - w / 2, y: vh / 2 + t.y - h / 2, w, h };
    reflection.place(box, t.floor, { x: ox, y: oy });
    // the halo reaches ~9vw past the screen, like the light it stands for
    const r = vw * 0.09;
    Object.assign(glow.style, {
      left: `${box.x - r}px`,
      top: `${box.y - r}px`,
      width: `${w + r * 2}px`,
      height: `${h + r * 2}px`,
      transformOrigin: `${ox - box.x + r}px ${oy - box.y + r}px`,
    });
  };

  const mm = gsap.matchMedia();
  mm.add(MQ.desktop, () => {
    placeReflection();
    window.addEventListener('resize', placeReflection);
    // a calm pull-back that stays attached to the scroll: the screen starts
    // exactly filling the view, eases evenly (power1, not a mid-scroll lunge)
    // and stops when the scroll stops (short scrub on top of Lenis)
    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.5, invalidateOnRefresh: true },
    });
    // the grain holder undoes the screen's scale, so the grain keeps its size in the wall
    const keepGrain = () => grain && gsap.set(grain, { scale: 1 / (gsap.getProperty(screen, 'scale') as number) });
    tl.eventCallback('onUpdate', keepGrain);
    // the halo and the reflection ride with the photo and come up as the screen settles into the wall
    tl.fromTo(screen, { scale: 1, x: 0, y: 0 }, { scale: END, x: () => target().x, y: () => target().y, ease: 'power1.inOut', duration: 1 }, 0.15)
      .fromTo([shop, glow, refl], { scale: 1.12 }, { scale: 1, ease: 'power1.inOut', duration: 1 }, 0.15)
      .fromTo(glow, { opacity: 0 }, { opacity: 1, ease: 'power2.in', duration: 1 }, 0.15)
      .fromTo(refl, { opacity: 0 }, { opacity: GLOSS, ease: 'power2.in', duration: 1 }, 0.15)
      .to({}, { duration: 0.25 });
    return () => window.removeEventListener('resize', placeReflection);
  });
  mm.add(MQ.reduced + ' and (min-width: 992px)', () => {
    placeReflection();
    window.addEventListener('resize', placeReflection);
    gsap.set(screen, { scale: END, x: () => target().x, y: () => target().y });
    if (grain) gsap.set(grain, { scale: 1 / END });
    gsap.set(refl, { opacity: GLOSS });
    return () => window.removeEventListener('resize', placeReflection);
  });

  const ro = new ResizeObserver(() => hw.resize());
  ro.observe(screen);

  // the picture: the film once it plays, its poster until then, or the coded
  // highway when there is no film (or it fails to load)
  const video = screen.querySelector<HTMLVideoElement>('#film-video');
  const poster = screen.querySelector<HTMLImageElement>('.film-poster');
  let coded = !(video && MEDIA.film);
  if (video && MEDIA.film) {
    grainTile($('.grain', screen));
    loopVideo({
      section,
      view: section,
      video,
      media: MEDIA.film,
      btn: $<HTMLButtonElement>('#film-toggle'),
      name: 'film',
      onState: (playing) => screen.classList.toggle('is-playing', playing), // runs the film grain
      onFail: () => {
        coded = true;
        poster?.remove();
        hw.resetClock();
        if (env.reduced) requestAnimationFrame(drawPoster);
      },
    });
  }
  const picture = (): CanvasImageSource | null => {
    if (coded) return canvas;
    if (video!.classList.contains('is-ready')) return video;
    return poster?.complete && poster.naturalWidth ? poster : null;
  };
  const mirror = (settle = false) => {
    const src = picture();
    if (src) reflection.draw(src, settle);
  };

  const CAPTIONS = ['[ Air-cooled flat-six idling ]', '[ Sodium lamps hum overhead ]', '[ Tyres hiss on cold asphalt ]'];
  let capI = 0;
  let capT = 0;
  let raf = 0;
  let visible = false;
  const loop = (t: number) => {
    raf = requestAnimationFrame(loop);
    // the picture keeps one steady speed; only the engine sound answers the scroll
    const v = lenis ? Math.min(1, Math.abs(lenis.velocity) / 45) : 0;
    if (coded) hw.render(t);
    // nothing to reflect until the pull-back reveals the floor
    if (!env.mobile && (gsap.getProperty(refl, 'opacity') as number) > 0.005) mirror();
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
    if (coded) hw.render(performance.now());
    mirror(true);
  };

  if (env.reduced) {
    if (coded || (poster?.complete && poster.naturalWidth)) requestAnimationFrame(drawPoster);
    // the poster is lazy: it loads only as the film comes near
    else poster?.addEventListener('load', () => requestAnimationFrame(drawPoster), { once: true });
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
  // items are zero-size anchors at each piece's centre (the child carries size
  // and base rotation, so tweening rotation here never wipes the composition)
  const measure = () => {
    homes = items.map((el) => ({ el, cx: el.offsetLeft, cy: el.offsetTop, inside: false }));
  };
  measure();
  new ResizeObserver(measure).observe(box);

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
  const CHARS = SCRAMBLE_CHARS;
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
  // the rise moves each glyph's outer group and the hover reshapes the inner
  // one, so the two never fight over a transform and the hover answers at once,
  // even while the letters are still coming up
  const letters = groups.filter((_, i) => i !== hyphenI);
  const hyphen = groups[hyphenI];

  if (env.reduced) {
    gsap.from(mark, { opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: mark, start: 'top 95%', once: true } });
  } else {
    // the outer group's box is the full-height hit column: grow the dash from its own centre
    const hb = inners[hyphenI].getBBox();
    gsap.set(hyphen, { svgOrigin: `${hb.x + hb.width / 2} ${hb.y + hb.height / 2}` });
    gsap.set(letters, { y: LOGO.height * 1.2 }); // 120 % of the letter height, in SVG units
    gsap.set(hyphen, { scale: 0 });
    const tl = gsap.timeline({ paused: true });
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
  gsap.set(inners, { transformOrigin: '0% 100%' }); // grow rightwards from the baseline

  const apply = () => {
    queued = false;
    if (pointerU === null) return;
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

  const track = (e: PointerEvent) => {
    const r = mark.getBoundingClientRect();
    pointerU = ((e.clientX - r.left) / r.width) * LOGO.width;
    queue();
  };
  // enter too: a pointer resting where the logo scrolls in gets no move event
  mark.addEventListener('pointerenter', track);
  mark.addEventListener('pointermove', track);
  mark.addEventListener('pointerleave', () => {
    pointerU = null;
    gsap.to(inners, { x: 0, scaleX: 1, scaleY: 1, duration: 1.2, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
  });
}
