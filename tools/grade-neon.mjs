/**
 * Grades the generated set pieces into the neon night (tools/neon.mjs, `scene`
 * key) straight from their originals in assets-src/, at the sizes and
 * qualities tools/convert-media.mjs gives them:
 *
 *  - workshop: the film's room. The tubes and their pools on the floor turn
 *    neon, magenta at the left, violet in the middle, cyan at the right (one
 *    light per side, as in a street of signs); the concrete sinks to black.
 *  - tarp: the glitch's single tube burns magenta over the cover.
 *  - detail-cut, detail-rivets, detail-rivet-line: metal under the same light.
 *
 *   node tools/grade-neon.mjs [name…]
 */
import { createRequire } from 'module';
import { scene, mix, MAGENTA, VIOLET, CYAN } from './neon.mjs';
const require = createRequire(new URL('../node_modules/.pnpm/node_modules/', import.meta.url).href);
const sharp = require('sharp');

const S = 'assets-src/';
const O = 'public/media/';

// highlight tint along the width: magenta → violet → cyan
const across = (t) =>
  t < 0.5 ? MAGENTA.map((m, c) => mix(m, VIOLET[c], t * 2)) : VIOLET.map((v, c) => mix(v, CYAN[c], (t - 0.5) * 2));

const JOBS = {
  workshop: { src: 'workshop.png', w: 2560, q: 78, sm: 1280, opts: (x) => ({ contrast: 1.3, core: 1, light: 0.75, hi: across(x) }) },
  tarp: { src: 'tarp.png', w: 2560, q: 76, sm: 1280, opts: () => ({ contrast: 1.25, core: 1, light: 0.75 }) },
  'detail-cut': { src: 'detail-cut.png', w: 1200, q: 78, sm: 640, opts: () => ({ contrast: 1.25, light: 0.5 }) },
  'detail-rivets': { src: 'detail-rivets.png', w: 1200, q: 78, sm: 640, opts: () => ({ contrast: 1.25, light: 0.5 }) },
  // the square crop of the aluminium panel (as convert-media cut it)
  'detail-rivet-line': { src: 'aluminium.png', w: 700, q: 80, square: 0.3, opts: () => ({ contrast: 1.35, light: 0.3 }) },
};

const only = process.argv.slice(2);
for (const [name, job] of Object.entries(JOBS)) {
  if (only.length && !only.includes(name)) continue;
  let img = sharp(S + job.src).removeAlpha();
  if (job.square) {
    const m = await sharp(S + job.src).metadata();
    img = img.extract({ left: Math.round(m.width * job.square), top: 0, width: m.height, height: m.height });
  }
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const out = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      const [r, g, b] = scene(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255, job.opts(x / (W - 1)));
      out[i] = Math.round(r * 255);
      out[i + 1] = Math.round(g * 255);
      out[i + 2] = Math.round(b * 255);
    }
  }
  const graded = () => sharp(out, { raw: { width: W, height: H, channels: 3 } });
  await graded().resize({ width: Math.min(job.w, W), withoutEnlargement: true }).webp({ quality: job.q, effort: 6 }).toFile(`${O}${name}.webp`);
  if (job.sm) await graded().resize({ width: job.sm }).webp({ quality: job.q - 6, effort: 6 }).toFile(`${O}${name}-sm.webp`);
  console.log(`${name}: ${W}×${H} → ${O}${name}.webp${job.sm ? ' + -sm' : ''}`);
}
