/**
 * Source footage → web video (public/media/<preset>/): AV1 / HEVC in 10 bit (no
 * banding in the night skies) plus an H.264 fallback, and first-frame posters.
 * `-sm` = phones and Save-Data. CRFs aim at VMAF ≈ 94 against the cleaned
 * source (AV1 ~17 % under HEVC); busier footage needs lower ones.
 *
 *   FFMPEG=/path/to/ffmpeg node tools/convert-video.mjs <reel|film> <source> [only: e.g. "hevc"]
 *   FFMPEG=/path/to/ffmpeg node tools/convert-video.mjs warmup
 *
 * reel — client delivery: a macOS screen recording (3360×2100, ReplayKit,
 *        ~32 fps VFR, no audio) of a 23.976p film shown letterboxed.
 * film — Higgsfield (Kling 2.6, 24 fps, silent), untouched apart from the cut
 *        into a 6.9 s loop and a 1920×1080 resize (assets-src/film-master.mp4,
 *        see docs/ASSETS.md #7). No software stabilisation: it added judder.
 * warmup — a few black frames in each codec, bit depth and colour tagging the
 *        page plays (public/media/warmup/), decoded under the loader so the GPU
 *        compiles its video pipelines before the reel and the film come into
 *        view (src/scripts/warmup.ts). Large enough for hardware decoding.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';

const FF = process.env.FFMPEG || 'ffmpeg';
const [PRESET, SRC, ONLY = ''] = process.argv.slice(2);

const PRESETS = {
  reel: {
    // rows 106–1995 of the capture are picture; above and below is screen.
    // 23.976p seen on a 60 Hz display (3:2 repeats + stray captures):
    // nearest-slot resampling lands back on the film's frames (3 repeats in 1807, measured)
    clean: 'crop=3360:1890:0:106,fps=24000/1001',
    crf: { av1: 42, hevc: 30, avc: 27 },
  },
  film: {
    // the master is already 1920×1080 and looped
    clean: 'null',
    // SVT-AV1 at 42 smears this footage (VMAF 92, min 82); HEVC/H.264 hold at the reel's values
    crf: { av1: 38, hevc: 30, avc: 27 },
  },
  warmup: {
    source: ['-f', 'lavfi', '-i', 'color=black:s=256x144:r=24:d=0.125'],
    clean: 'null',
    crf: { av1: 50, hevc: 40, avc: 40 },
  },
};
const P = PRESETS[PRESET];
if (!P || !(SRC || P.source)) {
  console.error('usage: node tools/convert-video.mjs <reel|film> <source> [only]');
  process.exit(1);
}
const O = `public/media/${PRESET}/`;
const vf = (w, h, pix) => `${P.clean},scale=${w}:${h}:flags=lanczos+accurate_rnd,format=${pix}`;

const out = ['-an', '-sn', '-dn', '-map_metadata', '-1', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', '-movflags', '+faststart'];
// SVT-AV1 builds without ARM SIMD crawl below preset 7 (~1 fps at 1080p)
const av1 = (crf) => ['-c:v', 'libsvtav1', '-preset', '7', '-crf', String(crf), '-g', '240', '-svtav1-params', 'tune=0'];
const hevc = (crf) => ['-c:v', 'libx265', '-preset', 'slow', '-crf', String(crf), '-tag:v', 'hvc1', '-x265-params', 'keyint=240:min-keyint=24:aq-mode=3:no-sao=1:log-level=error'];
const avc = (crf) => ['-c:v', 'libx264', '-preset', 'slower', '-crf', String(crf), '-profile:v', 'high', '-tune', 'film', '-g', '240', '-x264-params', 'aq-mode=3'];

const jobs = (
  P.source
    ? [
        [`${PRESET}.hevc.mp4`, 256, 144, 'yuv420p10le', hevc(P.crf.hevc)],
        [`${PRESET}.h264.mp4`, 256, 144, 'yuv420p', avc(P.crf.avc)],
        [`${PRESET}.av1.mp4`, 256, 144, 'yuv420p10le', av1(P.crf.av1)],
      ]
    : [
        [`${PRESET}.hevc.mp4`, 1920, 1080, 'yuv420p10le', hevc(P.crf.hevc)],
        [`${PRESET}-sm.hevc.mp4`, 1280, 720, 'yuv420p10le', hevc(P.crf.hevc)],
        [`${PRESET}-sm.h264.mp4`, 1280, 720, 'yuv420p', avc(P.crf.avc)],
        [`${PRESET}.av1.mp4`, 1920, 1080, 'yuv420p10le', av1(P.crf.av1)],
        [`${PRESET}-sm.av1.mp4`, 1280, 720, 'yuv420p10le', av1(P.crf.av1)],
      ]
).filter(([name]) => name.includes(ONLY));

mkdirSync(O, { recursive: true });
const run = (args) => execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...(P.source ?? ['-i', SRC]), ...args], { stdio: 'inherit' });

// posters = the first frame, so the hand-off to playback is invisible
for (const [name, w, h] of [['poster.webp', 1920, 1080], ['poster-sm.webp', 960, 540]]) {
  if (!ONLY && !P.source) run(['-vf', vf(w, h, 'yuv420p'), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '74', '-compression_level', '6', O + name]);
}
for (const [name, w, h, pix, codec] of jobs) {
  const t = Date.now();
  run(['-vf', vf(w, h, pix), ...codec, ...out, O + name]);
  console.log(name, (statSync(O + name).size / 1e6).toFixed(1) + ' MB', Math.round((Date.now() - t) / 1000) + ' s');
}
