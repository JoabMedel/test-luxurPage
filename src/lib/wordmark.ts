/**
 * "RWB" abbreviation lettering (loader + services cluster).
 *
 * Drawn to match the client's reference decal: extended, ultra-black, italic
 * (14°), generously rounded, pill-shaped counters. Glyphs are designed upright
 * on a 100-unit cap height, corners rounded with cubic arcs, then sheared.
 * The paths feed inline SVGs, including the loader's stroke drawing.
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

const R1 = 4; // default corner radius

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

export const CAP = 100;

type GlyphFn = (char: string) => Glyph;

export function layout(text: string, gap: number, draw: GlyphFn): { glyphs: PlacedGlyph[]; width: number } {
  let x = 0;
  const glyphs = [...text].map((char, i) => {
    const g = draw(char);
    const placed = { ...g, x };
    x += g.width + (i < text.length - 1 ? gap : 0);
    return placed;
  });
  return { glyphs, width: x };
}


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

/** horizontal ink overhang added by the italic shear, per glyph */
export const RWB_OVERHANG = CAP * SLANT;

const rwb = layout('RWB', 8, rwbGlyph);
/** "RWB" lockup; width includes the italic overhang */
export const RWB = { glyphs: rwb.glyphs, width: rwb.width + RWB_OVERHANG };
