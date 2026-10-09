/**
 * Grades the client's photo of Akira Nakai (assets-src/nakai.jpg, a bright
 * event shot) into the page's night key: one pool of light on the man, the tool
 * and the cut; the crowd and banner behind fall into the dark. Only the
 * oranges keep their colour (skin, the fender, echoing the film's sodium);
 * purples and teals go grey. Writes public/media/nakai.webp and nakai-sm.webp.
 *
 *   node tools/grade-nakai.mjs
 */
import { createRequire } from 'module';
const require = createRequire(new URL('../node_modules/.pnpm/node_modules/', import.meta.url).href);
const sharp = require('sharp');

const SRC = 'assets-src/nakai.jpg';
const OUT = 'public/media/nakai';

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const k = W / 1920; // the light is placed in the original's 1920-px coordinates

const clamp = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

// the light: a capsule from his face to where the blade meets the fender
const A = [690 * k, 430 * k];
const B = [1390 * k, 720 * k];
const R0 = 200 * k; // fully lit
const R1 = 600 * k; // gone
const pool = (x, y) => {
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const t = clamp(((x - A[0]) * dx + (y - A[1]) * dy) / (dx * dx + dy * dy));
  return 1 - smooth(R0, R1, Math.hypot(x - A[0] - t * dx, y - A[1] - t * dy));
};
// a flag (as on a film set) keeps the light off the banner and the crowd behind his head
const flag = (x, y) => 1 - 0.78 * (1 - smooth(0.55, 1.15, Math.hypot((x - 1360 * k) / (700 * k), (y - 110 * k) / (320 * k))));

// hue in degrees; the warm band is centred on skin and the fender (~28°)
const hueOf = (r, g, b) => {
  const mx = Math.max(r, g, b);
  const c = mx - Math.min(r, g, b);
  if (c < 1e-4) return -1;
  let h = mx === r ? ((g - b) / c) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
};

const toLin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toSrgb = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);

const out = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;
    const p = pool(x, y);

    // colour: oranges keep most of theirs, the rest goes almost grey, and the
    // dark loses colour faster than the light
    const h = hueOf(r, g, b);
    const dh = h < 0 ? 180 : Math.min(Math.abs(h - 28), 360 - Math.abs(h - 28));
    const warm = 1 - smooth(14, 40, dh);
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const sat = mix(0.12, 0.82, warm) * mix(0.5, 1, p);
    r = L + (r - L) * sat;
    g = L + (g - L) * sat;
    b = L + (b - L) * sat;

    // exposure in linear light: the pool keeps its light, the room drops away,
    // heaviest at the top (the banner) as in the builds' night grade
    const top = mix(0.55, 1, smooth(0, 0.42, y / H));
    const ex = mix(0.1, 0.62, p) * top * flag(x, y);
    r = toLin(r) * ex;
    g = toLin(g) * ex;
    b = toLin(b) * ex;

    // tone: a soft shoulder keeps the smoke and skin from clipping (Reinhard,
    // white at 1.3), then contrast in display space; the deepest shadows stay
    // just above the page's black so the frame still reads as a rectangle
    const shoulder = (v) => (v * (1 + v / 1.69)) / (1 + v);
    const contrast = (v) => 0.018 + 0.982 * mix(v, smooth(0, 1, v), 0.45);
    r = contrast(toSrgb(shoulder(r)));
    g = contrast(toSrgb(shoulder(g)));
    b = contrast(toSrgb(shoulder(b)));

    // split tone: highlights lean sodium, shadows a cold neutral
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const hi = smooth(0.25, 0.85, l);
    r *= mix(0.97, 1.03, hi);
    g *= mix(0.99, 0.99, hi);
    b *= mix(1.03, 0.93, hi);

    out[i] = Math.round(clamp(r) * 255);
    out[i + 1] = Math.round(clamp(g) * 255);
    out[i + 2] = Math.round(clamp(b) * 255);
  }
}

const graded = sharp(out, { raw: { width: W, height: H, channels: 3 } });
await graded.clone().webp({ quality: 80, effort: 6 }).toFile(`${OUT}.webp`);
await graded.clone().resize({ width: 1280 }).webp({ quality: 76, effort: 6 }).toFile(`${OUT}-sm.webp`);
console.log(`graded ${W}×${H} → ${OUT}.webp, ${OUT}-sm.webp`);
