/**
 * The "neon night" grade: black, violet and magenta, a little cyan, as one
 * colour function shared by the stills (tools/grade-neon.mjs) and the footage
 * (written out as a .cube LUT for ffmpeg's lut3d, see tools/convert-video.mjs),
 * so a poster and its video can never drift apart.
 *
 * Two keys:
 *  - scene: generated set pieces (film, workshop, tarp, details). Warm light
 *    (sodium, tungsten) turns magenta, reds lean crimson, neutrals pick up the
 *    neon light (violet shadows, magenta or cyan highlights).
 *  - real: client photos and footage (reel, Nakai). Light only: violet in the
 *    shadows, a faint magenta in the highlights; paint and skin keep their hue,
 *    so a build still reads in its own colour.
 */
export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const mix = (a, b, t) => a + (b - a) * t;
export const toLin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
export const toSrgb = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.max(0, v) ** (1 / 2.4) - 0.055);
export const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// the page's neon (src/styles/global.css), as unit-luma tints for split toning
const unit = (r, g, b) => {
  const l = luma(r, g, b);
  return [r / l, g / l, b / l];
};
export const VIOLET = unit(0.5, 0.22, 1);
export const MAGENTA = unit(1, 0.24, 0.86);
export const CYAN = unit(0.26, 0.9, 1);

function hsv(r, g, b) {
  const mx = Math.max(r, g, b);
  const c = mx - Math.min(r, g, b);
  let h = 0;
  if (c > 1e-6) {
    h = mx === r ? ((g - b) / c) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, mx > 0 ? c / mx : 0, mx];
}
function rgb(h, s, v) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5), f(3), f(1)];
}

// warm hues swing to magenta: red → crimson, sodium orange → magenta,
// amber/yellow → violet-magenta; greens and blues are left alone
const WARM = [
  [0, -12],
  [18, -40],
  [35, -78],
  [55, -100],
  [75, -105],
  [100, -20],
  [125, 0],
];
function warmShift(h) {
  const hh = h > 330 ? h - 360 : h; // pinks just under red stay put
  if (hh < 0) return mix(0, WARM[0][1], smooth(-30, 0, hh));
  for (let i = 1; i < WARM.length; i++) {
    const [h0, s0] = WARM[i - 1];
    const [h1, s1] = WARM[i];
    if (hh <= h1) return mix(s0, s1, smooth(0, 1, (hh - h0) / (h1 - h0)));
  }
  return 0;
}

const tint = (c, t, k) => c * mix(1, t, k);

/**
 * Generated set pieces. `hi` is the highlight tint (MAGENTA by default; the
 * workshop passes a mix along its width), all values sRGB 0–1.
 */
export function scene(r, g, b, { hi = MAGENTA, shadow = 0.5, light = 0.42, swing = 1, sat = 1, contrast = 1, core = 0, gain = 1 } = {}) {
  // 1 · warm light turns magenta (hue swing at constant value); `sat` scales the
  //     saturation of what swings, so a saturated sodium doesn't become a flood of magenta
  let [h, s, v] = hsv(r, g, b);
  const sw = warmShift(h) * swing * smooth(0.06, 0.22, s);
  s *= mix(1, sat, smooth(10, 50, Math.abs(sw)));
  [r, g, b] = rgb((h + sw + 360) % 360, s, v);

  // 2 · contrast in linear light: the room sinks towards black, the lights stay put
  let R = toLin(r);
  let G = toLin(g);
  let B = toLin(b);
  const Y0 = luma(R, G, B);
  if (contrast !== 1 && Y0 > 0) {
    const k = (Y0 ** contrast / Y0) * mix(1, 1 / Y0 ** (contrast - 1), smooth(0.5, 1, Y0));
    R *= k;
    G *= k;
    B *= k;
  }

  // 3 · split tone: neutrals take the neon, coloured light keeps more of its own;
  //     `core` lets the highlight tint reach the white-hot cores of the lamps
  const Y = luma(R, G, B);
  const neutral = 1 - smooth(0.12, 0.5, s);
  const ks = shadow * (1 - smooth(0.0, 0.08, Y)) * mix(0.55, 1, neutral);
  const kh = light * smooth(0.01, 0.3, Y) * mix(1, core, smooth(0.5, 1.0, Y)) * mix(0.45, 1, neutral);
  R = tint(tint(R, VIOLET[0], ks), hi[0], kh) * gain;
  G = tint(tint(G, VIOLET[1], ks), hi[1], kh) * gain;
  B = tint(tint(B, VIOLET[2], ks), hi[2], kh) * gain;

  return [toSrgb(R), toSrgb(G), toSrgb(B)].map((c) => clamp(c));
}

/** Client photos and footage: light and colour of the night, never their subject's hue. */
export function real(r, g, b, { shadow = 0.5, light = 0.2, cool = 20 } = {}) {
  let [h, s, v] = hsv(r, g, b);
  // the night's blue ambient (sky, street light, 200–250°) leans indigo; mint
  // and teal paint (≤ 195°) and the warm hues are out of its reach
  const band = smooth(198, 214, h) * (1 - smooth(240, 262, h));
  if (band > 0 && cool) {
    h += cool * band;
    [r, g, b] = rgb(h, s, v);
  }
  // skin and paint keep their hue: the tint only reaches what has little colour
  const neutral = 1 - smooth(0.1, 0.45, s);
  const skin = h > 8 && h < 48 ? smooth(0.08, 0.2, s) : 0;
  let R = toLin(r);
  let G = toLin(g);
  let B = toLin(b);
  const Y = luma(R, G, B);
  const ks = shadow * (1 - smooth(0.0, 0.16, Y)) * mix(0.35, 1, neutral) * (1 - skin * 0.7);
  const kh = light * smooth(0.04, 0.4, Y) * (1 - smooth(0.6, 1, Y)) * mix(0.3, 1, neutral) * (1 - skin);
  R = tint(tint(R, VIOLET[0], ks), MAGENTA[0], kh);
  G = tint(tint(G, VIOLET[1], ks), MAGENTA[1], kh);
  B = tint(tint(B, VIOLET[2], ks), MAGENTA[2], kh);
  return [toSrgb(R), toSrgb(G), toSrgb(B)].map((c) => clamp(c));
}

/** A colour function as an Adobe/Resolve .cube 3D LUT (red fastest), for ffmpeg's lut3d. */
export function cube(fn, size = 65, title = 'neon') {
  const lines = [`TITLE "${title}"`, `LUT_3D_SIZE ${size}`, 'DOMAIN_MIN 0 0 0', 'DOMAIN_MAX 1 1 1'];
  for (let b = 0; b < size; b++)
    for (let g = 0; g < size; g++)
      for (let r = 0; r < size; r++) {
        const [R, G, B] = fn(r / (size - 1), g / (size - 1), b / (size - 1));
        lines.push(`${R.toFixed(6)} ${G.toFixed(6)} ${B.toFixed(6)}`);
      }
  return lines.join('\n') + '\n';
}
