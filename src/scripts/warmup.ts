import { MEDIA, type VideoSource } from '../data/media';
import { chooseSource } from './scenes';

/**
 * The video half of ShaderWarmup.astro: decodes a few black frames in the codec
 * the reel and the film will play on this device (public/media/warmup/) and
 * shows them the ways the page does (as is, fading in, inside the shrinking
 * film screen, drawn into the reflection canvas), so their GPU pipelines
 * compile under the loader instead of on the first scroll into the reel.
 * It also shrinks the .wu-rescaled tiles once they are drawn: a layer redrawn
 * at a scale other than the one it was painted at (the film's pull-back) is
 * drawn differently.
 */
export function warmVideo() {
  const stage = document.querySelector<HTMLElement>('.warmup');
  const media = MEDIA.film ?? MEDIA.reel;
  if (!stage || !media) return;
  const rescaled = stage.querySelectorAll<HTMLElement>('.wu-rescaled');
  const shrink = (f: number) => {
    for (const el of rescaled) el.style.scale = String(1.12 - Math.min(f, 30) * 0.004);
  };
  const clip = (list: VideoSource[]) => list.map((s) => ({ ...s, src: s.src.replace(/^.*\.(av1|hevc|h264)\.mp4$/, '/media/warmup/warmup.$1.mp4') }));
  const videos = [...stage.querySelectorAll('video')];
  chooseSource(videos[0], { ...media, hd: clip(media.hd), sm: clip(media.sm) }).then((s) => {
    if (!s) return;
    for (const v of videos) {
      v.src = s.src;
      v.play().catch(() => {});
    }
    const canvas = stage.querySelector('canvas');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.imageSmoothingQuality = 'medium';
    // draw (and shrink) only once there are frames, as the reflection does
    let n = 0;
    const draw = () => {
      if (videos[0].readyState >= 2) {
        ctx.drawImage(videos[0], 0, 0, canvas.width, canvas.height);
        shrink(n++);
      }
      if (n < 40 && stage.isConnected) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  });
}

/** With the loader gone: release the clips' decoders now (not at garbage collection) and drop the stage. */
export function endWarmup() {
  const stage = document.querySelector('.warmup');
  stage?.querySelectorAll('video').forEach((v) => {
    v.pause();
    v.removeAttribute('src');
    v.load();
  });
  stage?.remove();
}
