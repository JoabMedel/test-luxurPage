/**
 * Client reel → web video (public/media/reel/).
 *
 * The delivery is a macOS screen recording (3360×2100, ReplayKit, ~32 fps VFR,
 * no audio, ~750 MB) of a 23.976p film shown letterboxed. Crop the 16:9
 * picture, restore its own cadence and encode AV1 / HEVC in 10 bit (no banding
 * in the night skies) plus an H.264 fallback. `-sm` = phones and Save-Data.
 * CRFs aim at VMAF ≈ 94 against the cropped source (AV1 ~17 % under HEVC).
 *
 *   FFMPEG=/path/to/ffmpeg node tools/convert-reel.mjs [source.mov] [only: e.g. "hevc"]
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';

const FF = process.env.FFMPEG || 'ffmpeg';
const SRC = process.argv[2] || 'assets-src/reel.mov';
const ONLY = process.argv[3] || '';
const O = 'public/media/reel/';

// rows 106–1995 of the capture are picture; above and below is screen
const CROP = 'crop=3360:1890:0:106';
// 23.976p seen on a 60 Hz display (3:2 repeats + stray captures): nearest-slot
// resampling lands back on the film's frames (3 repeats in 1807, measured)
const CADENCE = 'fps=24000/1001';
const vf = (w, h, pix) => `${CROP},${CADENCE},scale=${w}:${h}:flags=lanczos+accurate_rnd,format=${pix}`;

const out = ['-an', '-sn', '-dn', '-map_metadata', '-1', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', '-movflags', '+faststart'];
// SVT-AV1 builds without ARM SIMD crawl below preset 7 (~1 fps at 1080p)
const av1 = (crf) => ['-c:v', 'libsvtav1', '-preset', '7', '-crf', String(crf), '-g', '240', '-svtav1-params', 'tune=0'];
const hevc = (crf) => ['-c:v', 'libx265', '-preset', 'slow', '-crf', String(crf), '-tag:v', 'hvc1', '-x265-params', 'keyint=240:min-keyint=24:aq-mode=3:no-sao=1:log-level=error'];
const avc = (crf) => ['-c:v', 'libx264', '-preset', 'slower', '-crf', String(crf), '-profile:v', 'high', '-tune', 'film', '-g', '240', '-x264-params', 'aq-mode=3'];

const jobs = [
  ['reel.hevc.mp4', 1920, 1080, 'yuv420p10le', hevc(30)],
  ['reel-sm.hevc.mp4', 1280, 720, 'yuv420p10le', hevc(30)],
  ['reel-sm.h264.mp4', 1280, 720, 'yuv420p', avc(27)],
  ['reel.av1.mp4', 1920, 1080, 'yuv420p10le', av1(42)],
  ['reel-sm.av1.mp4', 1280, 720, 'yuv420p10le', av1(42)],
].filter(([name]) => name.includes(ONLY));

mkdirSync(O, { recursive: true });
const run = (args) => execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', SRC, ...args], { stdio: 'inherit' });

// posters = the first frame, so the hand-off to playback is invisible
for (const [name, w, h] of [['poster.webp', 1920, 1080], ['poster-sm.webp', 960, 540]]) {
  if (!ONLY) run(['-vf', vf(w, h, 'yuv420p'), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '74', '-compression_level', '6', O + name]);
}
for (const [name, w, h, pix, codec] of jobs) {
  const t = Date.now();
  run(['-vf', vf(w, h, pix), ...codec, ...out, O + name]);
  console.log(name, (statSync(O + name).size / 1e6).toFixed(1) + ' MB', Math.round((Date.now() - t) / 1000) + ' s');
}
