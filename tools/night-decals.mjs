/**
 * The reel's sticker bomb for the night page: the stickers cut off their wall
 * (assets-src/decals.png, generated with Higgsfield) onto transparency, so they
 * sit straight on the page's black, in their own printed colours (no grade:
 * a neon tint over them read as a pink filter).
 *
 * The wall and the stickers' white differ by only 1–5 %, so tone alone leaks
 * into the stickers. What separates them is the die-cut edge: a sharp step all
 * round every sticker, where the wall's own texture and the shadows it carries
 * are soft. So:
 *   1. the wall's light is measured as in tools/clean-decals.mjs (neutral,
 *      smooth, light pixels at 1/8 scale; normalised convolution) and divided
 *      out, which leaves the wall at ≈ 1;
 *   2. at half scale, the edges (gradient of that ratio) plus anything with
 *      colour or ink are barriers;
 *   3. the wall is flooded in from the frame's border through what is left,
 *      then grown back over the soft wall/shadow tones up to the edge line.
 * What the flood never reaches is sticker, white interiors included. Shadows
 * go with the wall: on black they would not show anyway.
 * Writes public/media/decals.webp (2800 px) and decals-sm.webp (1400 px), with alpha.
 *
 *   node tools/night-decals.mjs
 */
import { createRequire } from 'module';
import { clamp } from './neon.mjs';
const require = createRequire(new URL('../node_modules/.pnpm/node_modules/', import.meta.url).href);
const sharp = require('sharp');

const SRC = 'assets-src/decals.png';
const OUT = 'public/media/decals';
const DS = 8; // wall light at 1/8 of the original
const LIGHT_SIGMA = 320; // px of the original: the wall's light changes slowly
const EDGE = 0.004; // gradient of the light ratio that marks a die-cut edge
const GAP = 1; // px (half scale) the edges are thickened by, to close hairline gaps
const MARGIN = 24; // px (half scale) of transparency kept round the collage

const src = sharp(SRC).removeAlpha();
const { width: W0, height: H0 } = await src.metadata();

// ---------------------------------------------------------------- 1 · wall light
const w8 = Math.round(W0 / DS);
const h8 = Math.round(H0 / DS);
const n8 = w8 * h8;
const small = sharp(SRC).removeAlpha().resize(w8, h8, { kernel: 'linear' });
const rgb8 = await small.clone().raw().toBuffer();
const soft8 = await small.clone().blur(2).raw().toBuffer();
const lum = (b, i) => (b[i * 3] + b[i * 3 + 1] + b[i * 3 + 2]) / 3;
const chroma = (b, i) => Math.max(b[i * 3], b[i * 3 + 1], b[i * 3 + 2]) - Math.min(b[i * 3], b[i * 3 + 1], b[i * 3 + 2]);
const flat = (i) => chroma(rgb8, i) <= 6 && Math.abs(lum(rgb8, i) - lum(soft8, i)) < 1.5;

function gauss(src, w, h, sigma) {
  const r = Math.ceil(sigma * 3);
  const k = new Float32Array(r * 2 + 1).map((_, j) => Math.exp(-((j - r) ** 2) / (2 * sigma * sigma)));
  const tmp = new Float32Array(w * h);
  const dst = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let j = Math.max(0, r - x); j <= Math.min(2 * r, r + w - 1 - x); j++) s += k[j] * src[y * w + x + j - r];
      tmp[y * w + x] = s;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let j = Math.max(0, r - y); j <= Math.min(2 * r, r + h - 1 - y); j++) s += k[j] * tmp[(y + j - r) * w + x];
      dst[y * w + x] = s;
    }
  return dst;
}
function light(isWall) {
  const mask = new Float32Array(n8);
  const prod = [new Float32Array(n8), new Float32Array(n8), new Float32Array(n8)];
  for (let i = 0; i < n8; i++) {
    if (!isWall(i)) continue;
    mask[i] = 1;
    for (let c = 0; c < 3; c++) prod[c][i] = rgb8[i * 3 + c];
  }
  const m = gauss(mask, w8, h8, LIGHT_SIGMA / DS);
  return prod.map((p) => gauss(p, w8, h8, LIGHT_SIGMA / DS).map((v, i) => (m[i] > 1e-6 ? v / m[i] : 255)));
}
const first = light((i) => flat(i) && lum(rgb8, i) >= 228 && lum(rgb8, i) <= 251);
const field = light((i) => flat(i) && Math.abs(lum(rgb8, i) - (first[0][i] + first[1][i] + first[2][i]) / 3) < 4);

// ------------------------------------------------- 2 · ratio and edges, half scale
const W = Math.round(W0 / 2);
const H = Math.round(H0 / 2);
const N = W * H;
const rgb = await sharp(SRC).removeAlpha().resize(W, H, { kernel: 'linear' }).raw().toBuffer();
const wallAt = (x, y) => {
  const fx = clamp(((x + 0.5) * 2) / DS - 0.5, 0, w8 - 1);
  const fy = clamp(((y + 0.5) * 2) / DS - 0.5, 0, h8 - 1);
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(x0 + 1, w8 - 1);
  const y1 = Math.min(y0 + 1, h8 - 1);
  const tx = fx - x0;
  const ty = fy - y0;
  let s = 0;
  for (let c = 0; c < 3; c++) {
    const f = field[c];
    s += (f[y0 * w8 + x0] * (1 - tx) + f[y0 * w8 + x1] * tx) * (1 - ty) + (f[y1 * w8 + x0] * (1 - tx) + f[y1 * w8 + x1] * tx) * ty;
  }
  return s / 3;
};
const ratio = new Float32Array(N);
const tone = new Uint8Array(N); // wall or shadow: neutral, neither ink nor sticker-white
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    ratio[i] = lum(rgb, i) / Math.max(wallAt(x, y), 1);
    tone[i] = chroma(rgb, i) <= 12 && ratio[i] > 0.45 && ratio[i] < 1.03 ? 1 : 0;
  }
// the kernel is unnormalised (the light divides it out); here divide by its own weight
const sm = gauss(ratio, W, H, 0.8);
const weight = gauss(new Float32Array(N).fill(1), W, H, 0.8);
for (let i = 0; i < N; i++) sm[i] /= weight[i];
const edge = new Uint8Array(N);
for (let y = 1; y < H - 1; y++)
  for (let x = 1; x < W - 1; x++) {
    const p = (dx, dy) => sm[(y + dy) * W + x + dx];
    const gx = p(1, -1) + 2 * p(1, 0) + p(1, 1) - p(-1, -1) - 2 * p(-1, 0) - p(-1, 1);
    const gy = p(-1, 1) + 2 * p(0, 1) + p(1, 1) - p(-1, -1) - 2 * p(0, -1) - p(1, -1);
    edge[y * W + x] = Math.hypot(gx, gy) / 8 > EDGE ? 1 : 0;
  }

// ------------------------------------------------------------------ 3 · flood
const dilate = (m) => {
  const o = m.slice();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (m[i]) continue;
      if ((x > 0 && m[i - 1]) || (x < W - 1 && m[i + 1]) || (y > 0 && m[i - W]) || (y < H - 1 && m[i + W])) o[i] = 1;
    }
  return o;
};
let barrier = edge;
for (let k = 0; k < GAP; k++) barrier = dilate(barrier);
const wall = new Uint8Array(N);
const queue = new Int32Array(N);
let qh = 0;
let qt = 0;
const seed = (i) => {
  if (!wall[i] && !barrier[i] && tone[i]) {
    wall[i] = 1;
    queue[qt++] = i;
  }
};
for (let x = 0; x < W; x++) {
  seed(x);
  seed((H - 1) * W + x);
}
for (let y = 0; y < H; y++) {
  seed(y * W);
  seed(y * W + W - 1);
}
while (qh < qt) {
  const i = queue[qh++];
  const x = i % W;
  if (x > 0) seed(i - 1);
  if (x < W - 1) seed(i + 1);
  if (i >= W) seed(i - W);
  if (i < N - W) seed(i + W);
}
// grow back over the thickened edge, through soft wall/shadow tones only
let grown = wall;
for (let k = 0; k <= GAP; k++) {
  const d = dilate(grown);
  for (let i = 0; i < N; i++) if (d[i] && !grown[i] && !(tone[i] && !edge[i])) d[i] = 0;
  grown = d;
}

// specks the flood walked round (lone grains of wall texture) are not stickers
const SPECK = 2000; // px at half scale; the smallest sticker is far larger
const seen = new Uint8Array(N);
for (let s = 0; s < N; s++) {
  if (grown[s] || seen[s]) continue;
  qh = qt = 0;
  queue[qt++] = s;
  seen[s] = 1;
  while (qh < qt) {
    const i = queue[qh++];
    const x = i % W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
      if (j >= 0 && j < N && !grown[j] && !seen[j]) {
        seen[j] = 1;
        queue[qt++] = j;
      }
    }
  }
  if (qt < SPECK) for (let k = 0; k < qt; k++) grown[queue[k]] = 1;
}

// -------------------------------------------------------- 4 · alpha, crop
let x0 = W;
let y0 = H;
let x1 = 0;
let y1 = 0;
const rgba = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  if (grown[i]) continue;
  const x = i % W;
  const y = (i - x) / W;
  if (x < x0) x0 = x;
  if (x > x1) x1 = x;
  if (y < y0) y0 = y;
  if (y > y1) y1 = y;
  rgba[i * 4] = rgb[i * 3];
  rgba[i * 4 + 1] = rgb[i * 3 + 1];
  rgba[i * 4 + 2] = rgb[i * 3 + 2];
  rgba[i * 4 + 3] = 255;
}
const left = Math.max(0, x0 - MARGIN);
const top = Math.max(0, y0 - MARGIN);
const cw = Math.min(W, x1 + MARGIN + 1) - left;
const ch = Math.min(H, y1 + MARGIN + 1) - top;

const img = () => sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).extract({ left, top, width: cw, height: ch });
const crop = await img().png().toBuffer(); // one decode, two sizes
for (const [w, q, suffix] of [
  [2800, 80, ''],
  [1400, 78, '-sm'],
]) {
  await sharp(crop).resize({ width: w }).webp({ quality: q, alphaQuality: 90, effort: 6 }).toFile(`${OUT}${suffix}.webp`);
}
const meta = await sharp(`${OUT}.webp`).metadata();
console.log(`stickers ${cw}×${ch} at ${left},${top} (half scale) → ${OUT}.webp ${meta.width}×${meta.height}, -sm`);
