/**
 * Prepares the reel's Fuji illustration (assets-src/fuji.png, sumi-e ink
 * generated with Higgsfield) to sit on the page's white as if drawn on it: the
 * washi paper goes to pure #fff, the sun to the brand vermilion (--shu), the
 * frame is cropped to the drawing and every edge feathers to white so no crop
 * or scale can show a seam. Writes public/media/fuji.webp and fuji-sm.webp.
 *
 *   node tools/clean-fuji.mjs
 */
import { createRequire } from 'module';
const require = createRequire(new URL('../node_modules/.pnpm/node_modules/', import.meta.url).href);
const sharp = require('sharp');

const SRC = 'assets-src/fuji.png';
const OUT = 'public/media/fuji';

// the drawing in the original's 2752×1536 coordinates, with paper around it
const CROP = { left: 326, top: 70, width: 2048, height: 1120 };
const SUN = [193, 65, 46]; // the generated disc
const SHU = [210, 59, 42]; // --shu #d23b2a
const WHITE = 244; // the paper's darkest grain → 255
// feather widths (px): the bottom is wide so the mist runs out into the page
const FEATHER = { left: 90, right: 90, top: 60, bottom: 160 };

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const { data, info } = await sharp(SRC).removeAlpha().extract(CROP).raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const out = Buffer.alloc(W * H * 3);

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // the sun, weighted by redness so its anti-aliased rim follows
    const red = clamp((r - Math.max(g, b) - 40) / 60);
    // edges feather to white
    const f = smooth(0, 1, Math.min(1, x / FEATHER.left) * Math.min(1, (W - 1 - x) / FEATHER.right) * Math.min(1, y / FEATHER.top) * Math.min(1, (H - 1 - y) / FEATHER.bottom));

    for (let c = 0; c < 3; c++) {
      const v = data[i + c];
      const sun = clamp((v * SHU[c]) / SUN[c], 0, 255);
      const base = v + (sun - v) * red;
      // paper: white point, then a soft knee that clears the last few levels of
      // grain (distance from white < 3 → white, > 16 untouched) without banding the mist
      let d = 255 - clamp((base * 255) / WHITE, 0, 255);
      if (d < 16) d *= smooth(3, 16, d);
      const ink = 255 - d;
      const px = ink + (base - ink) * red; // the sun keeps its own colour
      out[i + c] = Math.round(255 - (255 - px) * f);
    }
  }
}

const img = sharp(out, { raw: { width: W, height: H, channels: 3 } });
await img.clone().webp({ quality: 84, effort: 6 }).toFile(`${OUT}.webp`);
await img.clone().resize({ width: 1024 }).webp({ quality: 80, effort: 6 }).toFile(`${OUT}-sm.webp`);
console.log(`${OUT}.webp ${W}×${H}`);
