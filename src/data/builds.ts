/**
 * The six builds. `photo` stays null until the client delivers the real
 * night/studio photograph of each car — never an AI image presented as a build.
 * `paint` is the single strong body colour that is allowed to colour the page.
 */
export interface Build {
  id: string;
  name: string;
  model: string;
  city: string;
  line: string;
  paint: string;
  paintName: string;
  /** grid lines on the 12-col grid (1–13) */
  col: [number, number];
  /** extra top offset (vw) for asymmetric "abajo" cards */
  drop: number;
  /** media aspect ratio w/h */
  ratio: number;
  /** scroll parallax target in px (scrub 1.5) */
  y: number;
  /** reveal from which bottom corner */
  from: 'left' | 'right';
  /** `night`: pull a daylight photo down to the page's night key (CSS only, file untouched) */
  photo: null | {
    src: string;
    /** intrinsic width of `src`, for srcset */
    width: number;
    srcSm?: string;
    alt: string;
    /** photographer credit shown on the card; omit until confirmed */
    credit?: string;
    position?: string;
    /**
     * Extra framing on top of the parallax overscan: scale around `origin`
     * (the subject), then lift by `lift` % of the image height. With the
     * −5→−20 parallax keep lift ≤ oy + (100 − oy) · scale − 96.9 (oy = origin Y
     * in %) so the bottom never shows a gap.
     */
    zoom?: { scale: number; origin: string; lift: number };
    grade?: 'night';
  };
}

export const BUILDS: Build[] = [
  {
    id: 'kaze',
    name: 'KAZE',
    model: '964',
    city: 'TOKYO',
    line: 'Low enough to read the asphalt.',
    paint: '#3FC9B5',
    paintName: 'mint teal',
    col: [1, 7],
    drop: 0,
    ratio: 4 / 5,
    y: 80,
    from: 'left',
    photo: {
      src: '/media/builds/kaze.webp',
      width: 1875,
      srcSm: '/media/builds/kaze-sm.webp',
      alt: 'KAZE, a mint-teal RWB 964 widebody seen from the rear: tall wing, gold RWB lettering and a titanium exhaust',
      credit: 'Shanket Bhikha / StanceAutoMag',
      position: '64% 50%',
      grade: 'night',
    },
  },
  {
    id: 'noir',
    name: 'NOIR',
    model: '993',
    city: 'PARIS',
    line: 'Riveted at midnight, named at dawn.',
    paint: '#1B2A6B',
    paintName: 'midnight blue',
    col: [9, 13],
    drop: 14,
    ratio: 4 / 5,
    y: -150,
    from: 'right',
    photo: {
      src: '/media/builds/noir.webp',
      width: 1920,
      srcSm: '/media/builds/noir-sm.webp',
      alt: 'NOIR, a midnight-blue RWB 993 widebody on a rooftop car park: RAUH-Welt windshield banner, riveted flares and gold deep-dish wheels',
      position: '47% 50%',
      grade: 'night',
    },
  },
  {
    id: 'sakura',
    name: 'SAKURA',
    model: '930',
    city: 'LOS ANGELES',
    line: 'Air-cooled, never calm.',
    paint: '#9A4BC9',
    paintName: 'matte violet',
    col: [3, 11],
    drop: 0,
    ratio: 16 / 9,
    y: -100,
    from: 'left',
    photo: {
      src: '/media/builds/sakura.webp',
      width: 1920,
      srcSm: '/media/builds/sakura-sm.webp',
      alt: 'SAKURA, a matte-violet RWB widebody parked low in front of a corrugated-steel workshop, deep-dish wheels and a tall rear wing',
      // car spans x 13–77 %, y 46–94 % of the photo (centre 45 % / 70 %):
      // centre it horizontally, zoom 1.3× around it and lift it toward the middle
      position: '28% 50%',
      zoom: { scale: 1.3, origin: '50% 70.2%', lift: 11.8 },
      grade: 'night',
    },
  },
  {
    id: 'tetsu',
    name: 'TETSU',
    model: '964',
    city: 'BANGKOK',
    line: 'Wider than the rules.',
    paint: '#E8711A',
    paintName: 'signal orange',
    col: [1, 5],
    drop: 16,
    ratio: 3 / 4,
    y: -160,
    from: 'left',
    photo: {
      src: '/media/builds/tetsu.webp',
      width: 2000,
      srcSm: '/media/builds/tetsu-sm.webp',
      alt: 'TETSU, an orange RWB 964 widebody on a riverside promenade at dusk: round headlights lit, RAUH-Welt windshield banner, deep-dish wheels',
      position: '46% 50%',
      grade: 'night',
    },
  },
  {
    id: 'midori',
    name: 'MIDORI',
    model: '993',
    city: 'MELBOURNE',
    line: 'Built where its owner lives.',
    paint: '#5F7A2E',
    paintName: 'olive green',
    col: [7, 13],
    drop: 0,
    ratio: 16 / 9, // 4:3 could not hold the whole car once zoomed
    y: 100,
    from: 'right',
    photo: {
      src: '/media/builds/midori.webp',
      width: 2000,
      srcSm: '/media/builds/midori-sm.webp',
      alt: 'MIDORI, an olive-green RWB widebody on the move along a tree-lined highway, riveted flares and gold deep-dish wheels',
      // car spans x 14–91 %, y 43–93 % (centre 52 % / 68 %)
      position: '78% 50%',
      zoom: { scale: 1.15, origin: '50% 68%', lift: 7.7 },
      grade: 'night',
    },
  },
  {
    id: 'hoshi',
    name: 'HOSHI',
    model: '964',
    city: 'DUBAI',
    line: 'One car. One name. One cut.',
    paint: '#3B1E1A',
    paintName: 'black cherry',
    col: [3, 11],
    drop: 0,
    ratio: 16 / 9,
    y: -90,
    from: 'right',
    photo: {
      src: '/media/builds/hoshi.webp',
      width: 2000,
      srcSm: '/media/builds/hoshi-sm.webp',
      alt: 'HOSHI, a black-cherry RWB widebody on a tree-lined city street at dusk: RAUH-Welt banner, ducktail wing and polished deep-dish wheels',
      // car spans x 21–83 %, y 54–88 % (centre 52 % / 71 %)
      position: '65% 50%',
      zoom: { scale: 1.3, origin: '50% 71%', lift: 11.6 },
      grade: 'night',
    },
  },
];
