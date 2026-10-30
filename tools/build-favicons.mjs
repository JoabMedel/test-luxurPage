/**
 * Builds the favicons from the "RWB" lettering of src/lib/wordmark.ts, so the
 * tab icon is the same hand as the loader's neon sign and the nav mark.
 *
 * A wide three-letter lockup on a square tile ends up a few pixels tall, so the
 * letters are condensed (the italic is kept: the shear is undone, x scaled, the
 * 14° shear put back) and lit like the loader: a white-hot core on a magenta
 * tube, a violet breath around it, on the page's black. Below 48 px the glow
 * only muddies the letters, so the small rasters are flat white on black.
 *
 *   node tools/build-favicons.mjs            → public/favicon.svg
 *   SHARP=<dir with node_modules/sharp> node tools/build-favicons.mjs
 *                                            → also favicon.ico + apple-touch-icon.png
 */
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { RWB, CAP, RWB_OVERHANG } from '../src/lib/wordmark.ts';

const pub = new URL('../public/', import.meta.url);

const K = 0.6; // horizontal condensing of the letters
const S = RWB_OVERHANG / CAP; // tan(14°)

const VIOLET = '#9d3cff';
const MAGENTA = '#ff3ec9';

/** every coordinate pair of an absolute M/L/C/Z path through an affine map */
const mapPath = (d, fn) =>
  d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g, (_, x, y) => {
    const [X, Y] = fn(+x, +y);
    return `${+X.toFixed(2)} ${+Y.toFixed(2)}`;
  });

/** the lockup, condensed, fitted to `inner` units wide and centred in a `size` tile */
function letters(size, inner) {
  const width = K * (RWB.width - RWB_OVERHANG) + RWB_OVERHANG;
  const u = inner / width; // lettering units → tile units
  const ox = (size - inner) / 2;
  const oy = (size - CAP * u) / 2;
  return RWB.glyphs
    .map((g) =>
      mapPath(g.d, (x, y) => {
        const X = K * (g.x + x) + (1 - K) * S * (CAP - y);
        return [ox + X * u, oy + y * u];
      }),
    )
    .join('');
}

/**
 * @param {{ size?: number, inner?: number, radius?: number, glow?: boolean }} o
 *   radius 0 = full-bleed square (iOS rounds the apple-touch icon itself)
 */
function svg({ size = 100, inner = 84, radius = 22, glow = true } = {}) {
  const d = letters(size, inner);
  const w = (n) => +((n * size) / 100).toFixed(2); // stroke widths in tile %
  const ground = glow
    ? `<defs><radialGradient id="g" cx="50%" cy="54%" r="60%"><stop offset="0" stop-color="#2a0d47"/><stop offset="1" stop-color="#000"/></radialGradient></defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>`
    : `<rect width="${size}" height="${size}" rx="${radius}" fill="#000"/>`;
  const light = glow
    ? `
  <path d="${d}" fill="none" stroke="${VIOLET}" stroke-opacity=".3" stroke-width="${w(6)}" stroke-linejoin="round"/>
  <path d="${d}" fill="none" stroke="${MAGENTA}" stroke-width="${w(2.6)}" stroke-linejoin="round"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  ${ground}${light}
  <path d="${d}" fill="#fff" fill-rule="evenodd"/>
</svg>
`;
}

writeFileSync(new URL('favicon.svg', pub), svg());
console.log('public/favicon.svg');

if (process.env.SHARP) {
  const sharp = createRequire(new URL(`file://${process.env.SHARP}/`))('sharp');
  const png = (markup, px) => sharp(Buffer.from(markup), { density: (72 * px) / 100 }).resize(px, px).png().toBuffer();

  // small sizes: flat, letters near the tile's edge so they keep a few pixels of height
  const ico = await Promise.all([16, 32, 48].map((px) => png(svg({ inner: 92, radius: 16, glow: px >= 48 }), px)));
  writeFileSync(new URL('favicon.ico', pub), toIco(ico, [16, 32, 48]));
  console.log('public/favicon.ico');

  writeFileSync(new URL('apple-touch-icon.png', pub), await png(svg({ inner: 76, radius: 0 }), 180));
  console.log('public/apple-touch-icon.png');
}

/** an .ico holding PNG images (supported everywhere .ico still matters) */
function toIco(images, sizes) {
  const head = Buffer.alloc(6 + 16 * images.length);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2); // type: icon
  head.writeUInt16LE(images.length, 4);
  let offset = head.length;
  images.forEach((img, i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(sizes[i] % 256, e); // 0 means 256
    head.writeUInt8(sizes[i] % 256, e + 1);
    head.writeUInt16LE(1, e + 4); // colour planes
    head.writeUInt16LE(32, e + 6); // bits per pixel
    head.writeUInt32LE(img.length, e + 8);
    head.writeUInt32LE(offset, e + 12);
    offset += img.length;
  });
  return Buffer.concat([head, ...images]);
}
