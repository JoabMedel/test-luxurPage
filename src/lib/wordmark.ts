/**
 * RWB wordmark geometry.
 *
 * Ultra-black, extended letterforms on a 100-unit cap height: every glyph is
 * wider than it is tall, stems are 32u, bars 24u, counters are slits and the
 * outer corners are generously rounded. The same path data feeds the inline
 * SVGs, the loader stroke drawing and the WebGL mask (via Path2D), so the
 * hidden aluminium layer lines up with the DOM wordmark to the pixel.
 */

type Pt = [x: number, y: number, r?: number];

export interface Glyph {
  char: string;
  width: number;
  d: string;
}

export interface PlacedGlyph extends Glyph {
  x: number;
}

const T = 32; // stem
const B = 24; // bar
const RO = 26; // outer radius
const R1 = 4; // soft corner
const RI = 5; // inner (concave) corner

const K = 0.5523; // cubic circle approximation

function round(points: Pt[]): string {
  const n = points.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const [px, py, pr = R1] = points[i];
    const [ax, ay] = points[(i - 1 + n) % n];
    const [bx, by] = points[(i + 1) % n];
    const la = Math.hypot(ax - px, ay - py);
    const lb = Math.hypot(bx - px, by - py);
    const r = Math.min(pr, la / 2, lb / 2);
    const x1 = px + ((ax - px) / la) * r;
    const y1 = py + ((ay - py) / la) * r;
    const x2 = px + ((bx - px) / lb) * r;
    const y2 = py + ((by - py) / lb) * r;
    const c1x = x1 + (px - x1) * K;
    const c1y = y1 + (py - y1) * K;
    const c2x = x2 + (px - x2) * K;
    const c2y = y2 + (py - y2) * K;
    d += `${i === 0 ? 'M' : 'L'}${f(x1)} ${f(y1)}C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(x2)} ${f(y2)}`;
  }
  return d + 'Z';
}

const f = (v: number) => +v.toFixed(2);

const box = (x: number, y: number, w: number, h: number, r = RI): string =>
  round([
    [x, y, r],
    [x + w, y, r],
    [x + w, y + h, r],
    [x, y + h, r],
  ]);

function glyph(char: string): Glyph {
  switch (char) {
    case 'R': {
      const w = 124;
      return {
        char,
        width: w,
        d:
          round([
            [0, 0, RO],
            [w, 0, RO],
            [w, 72, 12],
            [94, 72, 3],
            [w, 100, R1],
            [80, 100, R1],
            [50, 72, 3],
            [T, 72, RI],
            [T, 100, R1],
            [0, 100, R1],
          ]) + box(T, B, w - 2 * T, 72 - 2 * B),
      };
    }
    case 'A': {
      const w = 124;
      return {
        char,
        width: w,
        d:
          round([
            [0, 0, RO],
            [w, 0, RO],
            [w, 100, R1],
            [w - T, 100, R1],
            [w - T, 78, RI],
            [T, 78, RI],
            [T, 100, R1],
            [0, 100, R1],
          ]) + box(T, B, w - 2 * T, 54 - B),
      };
    }
    case 'U': {
      const w = 124;
      return {
        char,
        width: w,
        d: round([
          [0, 0, R1],
          [T, 0, R1],
          [T, 100 - B, 8],
          [w - T, 100 - B, 8],
          [w - T, 0, R1],
          [w, 0, R1],
          [w, 100, RO],
          [0, 100, RO],
        ]),
      };
    }
    case 'H': {
      const w = 124;
      return {
        char,
        width: w,
        d: round([
          [0, 0],
          [T, 0],
          [T, 38, RI],
          [w - T, 38, RI],
          [w - T, 0],
          [w, 0],
          [w, 100],
          [w - T, 100],
          [w - T, 62, RI],
          [T, 62, RI],
          [T, 100],
          [0, 100],
        ]),
      };
    }
    case '-': {
      const w = 60;
      return { char, width: w, d: box(0, 38, w, 24, R1) };
    }
    case 'W': {
      const w = 164;
      const c = (w - 3 * T) / 2;
      return {
        char,
        width: w,
        d: round([
          [0, 0],
          [T, 0],
          [T, 100 - B, 8],
          [T + c, 100 - B, RI],
          [T + c, 0],
          [2 * T + c, 0],
          [2 * T + c, 100 - B, RI],
          [w - T, 100 - B, 8],
          [w - T, 0],
          [w, 0],
          [w, 100, RO],
          [0, 100, RO],
        ]),
      };
    }
    case 'E': {
      const w = 114;
      return {
        char,
        width: w,
        d: round([
          [0, 0, RO],
          [w, 0],
          [w, B],
          [T, B, RI],
          [T, 38, RI],
          [w - 10, 38],
          [w - 10, 62],
          [T, 62, RI],
          [T, 100 - B, RI],
          [w, 100 - B],
          [w, 100],
          [0, 100, RO],
        ]),
      };
    }
    case 'L': {
      const w = 108;
      return {
        char,
        width: w,
        d: round([
          [0, 0],
          [T, 0],
          [T, 100 - B, 8],
          [w, 100 - B],
          [w, 100],
          [0, 100, RO],
        ]),
      };
    }
    case 'T': {
      const w = 124;
      const s = (w - T) / 2;
      return {
        char,
        width: w,
        d: round([
          [0, 0],
          [w, 0],
          [w, B],
          [s + T, B, RI],
          [s + T, 100],
          [s, 100],
          [s, B, RI],
          [0, B],
        ]),
      };
    }
    case 'B': {
      const w = 124;
      return {
        char,
        width: w,
        d:
          round([
            [0, 0],
            [w, 0, RO],
            [w, 46, 6],
            [w - 6, 50, 2],
            [w, 54, 6],
            [w, 100, RO],
            [0, 100],
          ]) +
          box(T, B, w - 2 * T, 38 - B) +
          box(T, 62, w - 2 * T, 100 - B - 62),
      };
    }
    default:
      throw new Error(`Glyph not drawn: ${char}`);
  }
}

export const GAP = 10;
export const CAP = 100;

type GlyphFn = (char: string) => Glyph;

export function layout(text: string, gap = GAP, draw: GlyphFn = glyph): { glyphs: PlacedGlyph[]; width: number } {
  let x = 0;
  const glyphs = [...text].map((char, i) => {
    const g = draw(char);
    const placed = { ...g, x };
    x += g.width + (i < text.length - 1 ? gap : 0);
    return placed;
  });
  return { glyphs, width: x };
}

export const RAUH_WELT = layout('RAUH-WELT');

/* ------------------------------------------------------------------ RWB --
 * The abbreviation has its own lettering, as on the cars' decals: extended,
 * ultra-black, italic (14°), generously rounded, pill-shaped counters.
 * Drawn upright on the same 100-unit cap height, then sheared. */

const SLANT = Math.tan((14 * Math.PI) / 180);
const shear = (pts: Pt[]): Pt[] => pts.map(([x, y, r]) => [x + (CAP - y) * SLANT, y, r]);
const pill = (x: number, y: number, w: number, h: number): Pt[] => [
  [x, y, h / 2],
  [x + w, y, h / 2],
  [x + w, y + h, h / 2],
  [x, y + h, h / 2],
];
const italic = (...shapes: Pt[][]) => shapes.map((p) => round(shear(p))).join('');

function rwbGlyph(char: string): Glyph {
  switch (char) {
    case 'R':
      return {
        char,
        width: 158,
        d: italic(
          [
            [0, 0, 14],
            [150, 0, 40],
            [150, 50, 22],
            [134, 61, 4],
            [160, 100, 6],
            [112, 100, 6],
            [90, 66, 4],
            [36, 66, 4],
            [36, 100, 6],
            [0, 100, 10],
          ],
          pill(36, 20, 80, 22),
        ),
      };
    case 'W':
      return {
        char,
        width: 204,
        d: italic([
          [0, 0, 8],
          [42, 0, 6],
          [64, 64, 6],
          [84, 0, 6],
          [124, 0, 6],
          [144, 64, 6],
          [164, 0, 6],
          [204, 0, 8],
          [172, 100, 10],
          [130, 100, 8],
          [104, 36, 6],
          [78, 100, 8],
          [36, 100, 10],
        ]),
      };
    case 'B':
      return {
        char,
        width: 154,
        d: italic(
          [
            [0, 0, 12],
            [148, 0, 34],
            [148, 40, 16],
            [128, 50, 4],
            [154, 58, 16],
            [154, 100, 36],
            [0, 100, 12],
          ],
          pill(36, 19, 78, 21),
          pill(36, 60, 82, 21),
        ),
      };
    default:
      throw new Error(`RWB glyph not drawn: ${char}`);
  }
}

const rwb = layout('RWB', 8, rwbGlyph);
/** "RWB" abbreviation lockup; width includes the italic overhang */
export const RWB = { glyphs: rwb.glyphs, width: rwb.width + CAP * SLANT };
