/**
 * Media registry. Generated renders live in /public/media (see docs/ASSETS.md).
 * Client slots stay `null` until real footage/photos arrive; the page renders a
 * coded stand-in or a labelled frame meanwhile.
 */
export interface VideoSource {
  src: string;
  /** MIME type with codecs: the page plays the first one this device decodes in hardware */
  type: string;
}

export interface Reel {
  /** 1920×1080 — desktop */
  hd: VideoSource[];
  /** 1280×720 — phones and Save-Data; its H.264 is everyone's last resort */
  sm: VideoSource[];
  /** first frame of the film, so the hand-off to playback is invisible */
  poster: string;
  posterSm: string;
  alt: string;
}

export const MEDIA = {
  renders: {
    fender: { src: '/media/render-fender.webp', alt: 'Riviera blue widebody rear fender flare with exposed polished rivets, studio render' },
    wing: { src: '/media/render-wing.webp', alt: 'Twill carbon-fibre ducktail rear wing with tall endplates, studio render' },
    wheel: { src: '/media/render-wheel.webp', alt: 'Deep-dish three-piece wheel with mirror-polished lip and satin centre, studio render' },
    fan: { src: '/media/render-fan.webp', alt: 'Brushed-aluminium cooling fan from an air-cooled flat-six, studio render' },
    rivet: { src: '/media/render-rivet.webp', alt: 'Giant chrome dome-head rivet, studio render' },
  },
  loaderWheel: { src: '/media/loader-wheel.webp', alt: '' },
  aluminium: '/media/aluminium.webp',
  workshop: { src: '/media/workshop.webp', alt: 'Dark concrete workshop at night: two lifts holding covered cars, tyre stacks, fluorescent tubes and a polished epoxy floor' },
  tarp: { src: '/media/tarp.webp', alt: 'A low, wide car under a fitted grey cover, lit by a single fluorescent tube in a dark workshop' },
  detailCut: { src: '/media/detail-cut.webp', alt: 'Macro of a freshly cut fender edge: bare metal burr beside a pencil guide line' },
  detailRivets: { src: '/media/detail-rivets.webp', alt: 'An open palm holding a small pile of steel dome rivets' },

  /**
   * Client footage. Leave null to use the coded stand-ins.
   * Reel: 75 s, 16:9, 23.976 fps, silent loop — encoded by tools/convert-reel.mjs.
   */
  reel: {
    hd: [
      { src: '/media/reel/reel.av1.mp4', type: 'video/mp4; codecs="av01.0.08M.10"' },
      { src: '/media/reel/reel.hevc.mp4', type: 'video/mp4; codecs="hvc1.2.4.L120.90"' },
    ],
    sm: [
      { src: '/media/reel/reel-sm.av1.mp4', type: 'video/mp4; codecs="av01.0.05M.10"' },
      { src: '/media/reel/reel-sm.hevc.mp4', type: 'video/mp4; codecs="hvc1.2.4.L93.90"' },
      { src: '/media/reel/reel-sm.h264.mp4', type: 'video/mp4; codecs="avc1.640028"' },
    ],
    poster: '/media/reel/poster.webp',
    posterSm: '/media/reel/poster-sm.webp',
    alt: 'Reel: RWB widebody 911s — yellow, green, mint and black — at a night meet on a Japanese street, crowds and shop lights behind',
  } as null | Reel,
  film: null as null | { mp4: string; hevc?: string; poster: string; light?: string; captions: string },
  /** Client photography. */
  nakai: null as null | { src: string; alt: string; credit: string },
};
