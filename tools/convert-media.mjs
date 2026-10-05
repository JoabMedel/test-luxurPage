import { createRequire } from 'module';
const require = createRequire(new URL('../node_modules/.pnpm/node_modules/', import.meta.url).href);
const sharp = require('sharp');
const S = 'assets-src/', O = 'public/media/';
const jobs = [
  ['fender.png', 'render-fender', 1200, 82, true],
  ['wing.png', 'render-wing', 1200, 82, true],
  ['wheel.png', 'render-wheel', 1200, 82, true],
  ['fan.png', 'render-fan', 1200, 82, true],
  ['rivet.png', 'render-rivet', 1000, 82, true],
  ['loader-wheel.png', 'loader-wheel', 720, 82, true],
  ['aluminium.png', 'aluminium', 2400, 80, false],
  ['workshop.png', 'workshop', 2560, 78, false, 1280],
  ['tarp.png', 'tarp', 2560, 76, false, 1280],
  ['detail-cut.png', 'detail-cut', 1200, 78, false, 640],
  ['detail-rivets.png', 'detail-rivets', 1200, 78, false, 640],
];
for (const [src, name, w, q, alpha, sm] of jobs) {
  const img = sharp(S + src);
  const meta = await img.metadata();
  // trim transparent padding on renders so layout boxes hug the object
  let pipe = alpha ? sharp(S + src).trim({ threshold: 1 }) : sharp(S + src);
  await pipe.resize({ width: Math.min(w, meta.width), withoutEnlargement: true }).webp({ quality: q, alphaQuality: 90, effort: 6 }).toFile(O + name + '.webp');
  if (sm) await sharp(S + src).resize({ width: sm }).webp({ quality: q - 6, effort: 6 }).toFile(O + name + '-sm.webp');
}
// rivet-line square crop from the aluminium panel
const am = await sharp(S + 'aluminium.png').metadata();
await sharp(S + 'aluminium.png').extract({ left: Math.round(am.width * 0.3), top: 0, width: am.height, height: am.height }).resize(700).webp({ quality: 80 }).toFile(O + 'detail-rivet-line.webp');
console.log('done');
