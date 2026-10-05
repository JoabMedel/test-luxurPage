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
  photo: null | { src: string; alt: string; credit: string };
}

export const BUILDS: Build[] = [
  {
    id: 'kaze',
    name: 'KAZE',
    model: '964',
    city: 'TOKYO',
    line: 'Low enough to read the asphalt.',
    paint: '#1E73D8',
    paintName: 'Riviera blue',
    col: [1, 7],
    drop: 0,
    ratio: 4 / 5,
    y: 80,
    from: 'left',
    photo: null,
  },
  {
    id: 'noir',
    name: 'NOIR',
    model: '993',
    city: 'PARIS',
    line: 'Riveted at midnight, named at dawn.',
    paint: '#C8102E',
    paintName: 'Guards red',
    col: [9, 13],
    drop: 14,
    ratio: 4 / 5,
    y: -150,
    from: 'right',
    photo: null,
  },
  {
    id: 'sakura',
    name: 'SAKURA',
    model: '930',
    city: 'LOS ANGELES',
    line: 'Air-cooled, never calm.',
    paint: '#E0457B',
    paintName: 'Rubystone',
    col: [3, 11],
    drop: 0,
    ratio: 16 / 9,
    y: -100,
    from: 'left',
    photo: null,
  },
  {
    id: 'tetsu',
    name: 'TETSU',
    model: '964',
    city: 'BANGKOK',
    line: 'Wider than the rules.',
    paint: '#F2C200',
    paintName: 'Signal yellow',
    col: [1, 5],
    drop: 16,
    ratio: 3 / 4,
    y: -160,
    from: 'left',
    photo: null,
  },
  {
    id: 'midori',
    name: 'MIDORI',
    model: '993',
    city: 'MELBOURNE',
    line: 'Built where its owner lives.',
    paint: '#3FA535',
    paintName: 'Viper green',
    col: [7, 13],
    drop: 0,
    ratio: 4 / 3,
    y: 100,
    from: 'right',
    photo: null,
  },
  {
    id: 'hoshi',
    name: 'HOSHI',
    model: '964',
    city: 'DUBAI',
    line: 'One car. One name. One cut.',
    paint: '#7A4FD0',
    paintName: 'Night violet',
    col: [3, 11],
    drop: 0,
    ratio: 16 / 9,
    y: -90,
    from: 'right',
    photo: null,
  },
];
