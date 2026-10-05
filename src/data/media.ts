/**
 * Media registry. Generated renders live in /public/media (see docs/ASSETS.md).
 * Client slots stay `null` until real footage/photos arrive; the page renders a
 * coded stand-in or a labelled frame meanwhile.
 */
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

  /** Client footage — MP4/HEVC on CDN. Leave null to use the coded stand-ins. */
  reel: null as null | { mp4: string; hevc?: string; poster: string; light?: string },
  film: null as null | { mp4: string; hevc?: string; poster: string; light?: string; captions: string },
  /** Client photography. */
  nakai: null as null | { src: string; alt: string; credit: string },
};
