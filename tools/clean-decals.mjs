/**
 * Prepares the reel's sticker-bomb backdrop (assets-src/decals.png, generated
 * with Higgsfield) so the stickers sit on the page's own white. The image is a
 * "photo" of stickers on a light grey wall (239–250, brighter at the left,
 * slightly blue); it is re-exposed for the wall, as a photographer would: the
 * wall's light is measured and divided out of the whole frame, so the wall
 * reads #fff and the shadows the stickers cast keep their depth relative to it.
 *
 * The wall is found without a cutout (Higgsfield's background remover gives a
 * blob that swallows strips of wall and thins the stickers' white interiors):
 * at 1/8 scale it is the neutral, smooth pixels near the wall's tone, refined
 * once against a first estimate so the stickers' whiter white (≈252) and the
 * shadows drop out; the light under the collage comes from normalised
 * convolution. Writes public/media/decals.webp and decals-sm.webp.
 *
 *   node tools/clean-decals.mjs
 */
import { createRequire } from 'module';
const require = createRequire(new URL('../node_modules/.pnpm/node_modules/', import.meta.url).href);
const sharp = require('sharp');

const SRC = 'assets-src/decals.png';
const OUT = 'public/media/decals';

const DS = 8; // the light is measured at 1/8 scale
const LIGHT_SIGMA = 320; // px: the wall's light changes slowly
const MARGIN = 48; // px of white kept around the collage and its shadows when cropping
const FEATHER = 40; // px: the crop's edges fade to white, so no stray shadow ends in a seam
const HEADROOM = 0.985; // expose 1.5 % over the measured wall: its grain clips to white, shadows lose ~3 levels

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const { data: rgb, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const N = W * H;

// 1 · candidates at 1/8 scale: neutral, smooth, light
const w8 = Math.round(W / DS);
const h8 = Math.round(H / DS);
const n8 = w8 * h8;
const small = sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).resize(w8, h8, { kernel: 'linear' });
const rgb8 = await small.clone().raw().toBuffer();
const soft8 = await small.clone().blur(2).raw().toBuffer();
const lum = (b, i) => (b[i * 3] + b[i * 3 + 1] + b[i * 3 + 2]) / 3;
const chroma = (b, i) => Math.max(b[i * 3], b[i * 3 + 1], b[i * 3 + 2]) - Math.min(b[i * 3], b[i * 3 + 1], b[i * 3 + 2]);
const flat = (i) => chroma(rgb8, i) <= 6 && Math.abs(lum(rgb8, i) - lum(soft8, i)) < 1.5;

// separable gaussian on floats, zero outside the frame (normalised convolution
// divides that back out). Floats matter: in 8 bits, the ratio of two small blurred
// values steps visibly and draws rings around lone wall samples between stickers.
function blur(src, sigma) {
  const r = Math.ceil(sigma * 3);
  const k = new Float32Array(r * 2 + 1).map((_, j) => Math.exp(-((j - r) ** 2) / (2 * sigma * sigma)));
  const tmp = new Float32Array(n8);
  const dst = new Float32Array(n8);
  for (let y = 0; y < h8; y++) {
    for (let x = 0; x < w8; x++) {
      let s = 0;
      for (let j = Math.max(0, r - x); j <= Math.min(2 * r, r + w8 - 1 - x); j++) s += k[j] * src[y * w8 + x + j - r];
      tmp[y * w8 + x] = s;
    }
  }
  for (let y = 0; y < h8; y++) {
    for (let x = 0; x < w8; x++) {
      let s = 0;
      for (let j = Math.max(0, r - y); j <= Math.min(2 * r, r + h8 - 1 - y); j++) s += k[j] * tmp[(y + j - r) * w8 + x];
      dst[y * w8 + x] = s;
    }
  }
  return dst;
}

// normalised convolution: blur(wall · mask) / blur(mask), per channel, at 1/8 scale
function light(isWall) {
  const mask = new Float32Array(n8);
  const prod = [new Float32Array(n8), new Float32Array(n8), new Float32Array(n8)];
  for (let i = 0; i < n8; i++) {
    if (!isWall(i)) continue;
    mask[i] = 1;
    for (let c = 0; c < 3; c++) prod[c][i] = rgb8[i * 3 + c];
  }
  const m = blur(mask, LIGHT_SIGMA / DS);
  return prod.map((p) => blur(p, LIGHT_SIGMA / DS).map((v, i) => (m[i] > 1e-6 ? v / m[i] : 255)));
}

// 2 · first estimate from the wall's tone range, then keep only what sits on it
const first = light((i) => flat(i) && lum(rgb8, i) >= 228 && lum(rgb8, i) <= 251);
const onWall = (i) => Math.abs(lum(rgb8, i) - (first[0][i] + first[1][i] + first[2][i]) / 3) < 4;
const field = light((i) => flat(i) && onWall(i));
// bilinear lookup of the 1/8-scale field at a full-size pixel
const wallLight = (x, y, c) => {
  const fx = clamp((x + 0.5) / DS - 0.5, 0, w8 - 1);
  const fy = clamp((y + 0.5) / DS - 0.5, 0, h8 - 1);
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(x0 + 1, w8 - 1);
  const y1 = Math.min(y0 + 1, h8 - 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const f = field[c];
  return (f[y0 * w8 + x0] * (1 - tx) + f[y0 * w8 + x1] * tx) * (1 - ty) + (f[y1 * w8 + x0] * (1 - tx) + f[y1 * w8 + x1] * tx) * ty;
};

// 3 · re-expose for the wall; its last few levels of grain go to white (a narrow knee:
//     wider, it contours the vinyl texture inside the stickers), shadows stay
const out = Buffer.alloc(N * 3);
for (let i = 0; i < N; i++) {
  const x = i % W;
  const y = (i - x) / W;
  for (let c = 0; c < 3; c++) {
    let d = 255 - clamp((rgb[i * 3 + c] * 255) / Math.max(wallLight(x, y, c) * HEADROOM, 200), 0, 255);
    if (d < 5) d *= smooth(1.5, 5, d);
    out[i * 3 + c] = Math.round(255 - d);
  }
}

// 4 · crop to the collage and its shadows, with white around it, edges feathered
let x0 = W, y0 = H, x1 = 0, y1 = 0;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    if (out[i] < 250 || out[i + 1] < 250 || out[i + 2] < 250) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
}
const left = Math.max(0, x0 - MARGIN);
const top = Math.max(0, y0 - MARGIN);
const cw = Math.min(W, x1 + MARGIN + 1) - left;
const ch = Math.min(H, y1 + MARGIN + 1) - top;
const crop = Buffer.alloc(cw * ch * 3);
for (let y = 0; y < ch; y++) {
  for (let x = 0; x < cw; x++) {
    const f = smooth(0, 1, Math.min(1, x / FEATHER, (cw - 1 - x) / FEATHER, y / FEATHER, (ch - 1 - y) / FEATHER));
    const s = ((top + y) * W + left + x) * 3;
    const t = (y * cw + x) * 3;
    for (let c = 0; c < 3; c++) crop[t + c] = Math.round(255 - (255 - out[s + c]) * f);
  }
}

const img = () => sharp(crop, { raw: { width: cw, height: ch, channels: 3 } });
await img().resize({ width: 2800 }).webp({ quality: 80, effort: 6 }).toFile(`${OUT}.webp`);
await img().resize({ width: 1400 }).webp({ quality: 78, effort: 6 }).toFile(`${OUT}-sm.webp`);
console.log(`crop ${cw}×${ch} at ${left},${top} → ${OUT}.webp (2800 px), -sm (1400 px)`);
