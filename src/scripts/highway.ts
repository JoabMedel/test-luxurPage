/**
 * Coded stand-in for the night film until the client delivers footage:
 * chase-cam on an empty highway under sodium lamps, with a drawn rear
 * silhouette of a wide, low air-cooled 911 (full-width red light bar, ducktail).
 * It is an illustration, never presented as a photograph of a real build.
 */
const SODIUM = [232, 137, 43] as const;
const rgba = (c: readonly number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export class Highway {
  private ctx: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private z = 0; // distance travelled
  private last = 0;
  speed = 1; // multiplier, scroll/engine can push it
  private grain: HTMLCanvasElement;

  constructor(
    private canvas: HTMLCanvasElement,
    private maxWidth = 1280,
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.grain = document.createElement('canvas');
    this.grain.width = this.grain.height = 128;
    const g = this.grain.getContext('2d')!;
    const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 14;
    }
    g.putImageData(img, 0, 0);
    this.resize();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = Math.min(1, this.maxWidth / Math.max(1, r.width * dpr));
    this.w = this.canvas.width = Math.max(2, Math.round(r.width * dpr * scale));
    this.h = this.canvas.height = Math.max(2, Math.round(r.height * dpr * scale));
  }

  /** Render one frame at time t (ms). */
  render(t: number) {
    const dt = this.last ? Math.min(0.05, (t - this.last) / 1000) : 0;
    this.last = t;
    this.z += dt * 38 * this.speed;
    this.draw(t / 1000);
  }

  resetClock() {
    this.last = 0;
  }

  private draw(time: number) {
    const { ctx, w, h } = this;
    const vx = w * 0.5;
    const vy = h * 0.44;
    const f = h * 0.9; // focal length
    const camH = 1.25;

    // sky / haze
    const sky = ctx.createLinearGradient(0, 0, 0, vy);
    sky.addColorStop(0, '#000');
    sky.addColorStop(1, '#1b0f05');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, vy + 1);

    // asphalt
    const road = ctx.createLinearGradient(0, vy, 0, h);
    road.addColorStop(0, '#120a04');
    road.addColorStop(1, '#050403');
    ctx.fillStyle = road;
    ctx.fillRect(0, vy, w, h - vy);

    const proj = (x: number, y: number, z: number) => ({ x: vx + (x / z) * f, y: vy + ((camH - y) / z) * f, s: f / z });

    // road edges
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = Math.max(1, h * 0.002);
    for (const side of [-1, 1]) {
      const a = proj(side * 7.5, 0, 2);
      const b = proj(side * 7.5, 0, 400);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // lamps: posts on both sides every 28 m
    const spacing = 28;
    const offset = this.z % spacing;
    const lamps: { x: number; y: number; s: number; z: number }[] = [];
    for (let i = 14; i >= 0; i--) {
      const z = i * spacing - offset + 4;
      if (z < 1.2) continue;
      for (const side of [-1, 1]) lamps.push({ ...proj(side * 9, 9.5, z), z });
    }

    // light pools on asphalt (additive)
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 14; i >= 0; i--) {
      const z = i * spacing - offset + 4;
      if (z < 2) continue;
      for (const side of [-1, 1]) {
        const p = proj(side * 5, 0, z);
        const rx = p.s * 7;
        const ry = rx * 0.28;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rx);
        g.addColorStop(0, rgba(SODIUM, 0.28));
        g.addColorStop(1, rgba(SODIUM, 0));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(1, ry / rx);
        ctx.translate(-p.x, -p.y);
        ctx.fillStyle = g;
        ctx.fillRect(p.x - rx, p.y - rx, rx * 2, rx * 2);
        ctx.restore();
      }
    }
    // wet asphalt: each lamp drops a vertical streak toward the camera
    for (const l of lamps) {
      const foot = proj(Math.sign(l.x - vx) * 7.2, 0, l.z);
      const len = Math.min(h - foot.y, foot.s * 6);
      const sw = Math.max(1, l.s * 0.5);
      const g = ctx.createLinearGradient(0, foot.y, 0, foot.y + len);
      g.addColorStop(0, rgba(SODIUM, 0.32));
      g.addColorStop(1, rgba(SODIUM, 0));
      ctx.fillStyle = g;
      ctx.fillRect(foot.x - sw / 2, foot.y, sw, len);
    }

    // the car's own headlights washing the road ahead
    const hl = ctx.createRadialGradient(vx, h * 0.66, 0, vx, h * 0.66, w * 0.32);
    hl.addColorStop(0, 'rgba(255,236,205,0.22)');
    hl.addColorStop(0.6, 'rgba(255,236,205,0.05)');
    hl.addColorStop(1, 'rgba(255,236,205,0)');
    ctx.save();
    ctx.translate(vx, h * 0.66);
    ctx.scale(1, 0.32);
    ctx.translate(-vx, -h * 0.66);
    ctx.fillStyle = hl;
    ctx.fillRect(0, 0, w, h * 1.4);
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';

    // lane dashes
    ctx.fillStyle = 'rgba(255,238,210,0.55)';
    const dash = 6;
    const gap = 9;
    const period = dash + gap;
    for (let i = 26; i >= 0; i--) {
      const z0 = i * period - (this.z % period) + 2;
      const z1 = z0 + dash;
      if (z0 < 1.5) continue;
      for (const lane of [-2.6, 2.6]) {
        const a = proj(lane - 0.08, 0, z0);
        const b = proj(lane + 0.08, 0, z0);
        const c = proj(lane + 0.08, 0, z1);
        const d = proj(lane - 0.08, 0, z1);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.fill();
      }
    }

    // posts + lamp heads
    for (const l of lamps) {
      const base = proj(Math.sign(l.x - vx) * 9.6, 0, l.z);
      ctx.strokeStyle = 'rgba(30,22,16,1)';
      ctx.lineWidth = Math.max(1, l.s * 0.18);
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(base.x, l.y);
      ctx.lineTo(l.x, l.y);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const l of lamps) {
      const r = l.s * 2.6;
      const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
      g.addColorStop(0, 'rgba(255,236,200,0.95)');
      g.addColorStop(0.12, rgba(SODIUM, 0.65));
      g.addColorStop(1, rgba(SODIUM, 0));
      ctx.fillStyle = g;
      ctx.fillRect(l.x - r, l.y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';

    // the car (chase cam, ~7 m ahead)
    const bob = Math.sin(time * 9.3) * 0.0016 * h + Math.sin(time * 2.1) * 0.002 * h;
    const carW = w * 0.3;
    const cx = vx + Math.sin(time * 0.35) * w * 0.012;
    const cy = h * 0.86 + bob;
    // nearest lamp passing over the car → roof light
    const phase = ((this.z + 7) % spacing) / spacing;
    const roofLight = Math.pow(Math.max(0, 1 - Math.abs(phase - 0.5) * 2.4), 2);
    this.drawCar(cx, cy, carW, roofLight, time);

    // vignette + grain
    const v = ctx.createRadialGradient(vx, h * 0.55, h * 0.2, vx, h * 0.55, h * 1.05);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
    const ox = (Math.random() * 128) | 0;
    const oy = (Math.random() * 128) | 0;
    ctx.fillStyle = ctx.createPattern(this.grain, 'repeat')!;
    ctx.save();
    ctx.translate(-ox, -oy);
    ctx.fillRect(ox, oy, w, h);
    ctx.restore();
  }

  private drawCar(cx: number, cy: number, W: number, light: number, time: number) {
    const { ctx } = this;
    const H = W * 0.56;
    const X = (u: number) => cx + u * W;
    const Y = (v: number) => cy - v * H;

    // shadow
    const sh = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.7);
    sh.addColorStop(0, 'rgba(0,0,0,0.85)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.12);
    ctx.translate(-cx, -cy);
    ctx.fillStyle = sh;
    ctx.fillRect(cx - W, cy - W, W * 2, W * 2);
    ctx.restore();

    // tyres
    ctx.fillStyle = '#020202';
    ctx.fillRect(X(-0.5), Y(0.16), W * 0.17, H * 0.17);
    ctx.fillRect(X(0.33), Y(0.16), W * 0.17, H * 0.17);

    // body (rear view): narrow cabin, wide hips, flared arches
    const body = new Path2D();
    body.moveTo(X(-0.47), Y(0.1));
    body.bezierCurveTo(X(-0.52), Y(0.2), X(-0.53), Y(0.38), X(-0.5), Y(0.5));
    body.bezierCurveTo(X(-0.46), Y(0.56), X(-0.36), Y(0.58), X(-0.3), Y(0.6));
    body.bezierCurveTo(X(-0.25), Y(0.82), X(-0.2), Y(0.98), X(0), Y(1));
    body.bezierCurveTo(X(0.2), Y(0.98), X(0.25), Y(0.82), X(0.3), Y(0.6));
    body.bezierCurveTo(X(0.36), Y(0.58), X(0.46), Y(0.56), X(0.5), Y(0.5));
    body.bezierCurveTo(X(0.53), Y(0.38), X(0.52), Y(0.2), X(0.47), Y(0.1));
    body.closePath();
    // taillight bar reflected on the wet road
    ctx.globalCompositeOperation = 'lighter';
    const rr = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.42);
    rr.addColorStop(0, 'rgba(255,40,25,0.22)');
    rr.addColorStop(1, 'rgba(255,40,25,0)');
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.9);
    ctx.translate(-cx, -cy);
    ctx.fillStyle = rr;
    ctx.fillRect(cx - W * 0.42, cy, W * 0.84, W * 0.42);
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';

    ctx.fillStyle = '#0a0806';
    ctx.fill(body);
    ctx.strokeStyle = rgba(SODIUM, 0.22 + light * 0.35);
    ctx.lineWidth = Math.max(1, W * 0.003);
    ctx.stroke(body);

    // sodium light sliding over roof + hips
    ctx.save();
    ctx.clip(body);
    const g = ctx.createLinearGradient(0, Y(1), 0, Y(0.4));
    g.addColorStop(0, rgba(SODIUM, 0.1 + light * 0.55));
    g.addColorStop(0.5, rgba(SODIUM, 0.03 + light * 0.12));
    g.addColorStop(1, rgba(SODIUM, 0));
    ctx.fillStyle = g;
    ctx.fillRect(X(-0.6), Y(1.05), W * 1.2, H);
    ctx.restore();
    ctx.strokeStyle = rgba(SODIUM, 0.25 + light * 0.6);
    ctx.lineWidth = Math.max(1, W * 0.004);
    ctx.beginPath();
    ctx.moveTo(X(-0.3), Y(0.6));
    ctx.bezierCurveTo(X(-0.25), Y(0.82), X(-0.2), Y(0.98), X(0), Y(1));
    ctx.bezierCurveTo(X(0.2), Y(0.98), X(0.25), Y(0.82), X(0.3), Y(0.6));
    ctx.stroke();

    // rear window
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    ctx.beginPath();
    ctx.moveTo(X(-0.2), Y(0.66));
    ctx.bezierCurveTo(X(-0.17), Y(0.84), X(-0.12), Y(0.92), X(0), Y(0.93));
    ctx.bezierCurveTo(X(0.12), Y(0.92), X(0.17), Y(0.84), X(0.2), Y(0.66));
    ctx.closePath();
    ctx.fill();

    // ducktail wing
    ctx.fillStyle = '#030303';
    ctx.fillRect(X(-0.36), Y(0.66), W * 0.72, H * 0.06);
    ctx.fillRect(X(-0.37), Y(0.7), W * 0.03, H * 0.1);
    ctx.fillRect(X(0.34), Y(0.7), W * 0.03, H * 0.1);
    ctx.fillStyle = rgba(SODIUM, 0.2 + light * 0.5);
    ctx.fillRect(X(-0.36), Y(0.66), W * 0.72, Math.max(1, H * 0.008));

    // full-width red light bar + glow
    const flicker = 0.92 + Math.sin(time * 40) * 0.02;
    ctx.globalCompositeOperation = 'lighter';
    const bar = ctx.createRadialGradient(cx, Y(0.38), 0, cx, Y(0.38), W * 0.6);
    bar.addColorStop(0, `rgba(255,30,20,${0.2 * flicker})`);
    bar.addColorStop(1, 'rgba(255,30,20,0)');
    ctx.fillStyle = bar;
    ctx.fillRect(cx - W * 0.7, Y(0.38) - W * 0.3, W * 1.4, W * 0.6);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(255,${40 + 20 * flicker},30,1)`;
    ctx.fillRect(X(-0.43), Y(0.42), W * 0.86, H * 0.05);
    ctx.fillStyle = 'rgba(255,190,170,0.9)';
    ctx.fillRect(X(-0.41), Y(0.405), W * 0.82, Math.max(1, H * 0.01));

    // plate + exhaust
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(X(-0.08), Y(0.3), W * 0.16, H * 0.07);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(X(-0.16), Y(0.12), W * 0.018, 0, Math.PI * 2);
    ctx.arc(X(0.16), Y(0.12), W * 0.018, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Sparks shower for the reel: a grinding wheel meeting a fender edge. */
export class Sparks {
  private ctx: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private p: { x: number; y: number; px: number; py: number; vx: number; vy: number; life: number; max: number }[] = [];
  private last = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.resize();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const s = Math.min(1, 960 / Math.max(1, r.width));
    this.w = this.canvas.width = Math.max(2, Math.round(r.width * s));
    this.h = this.canvas.height = Math.max(2, Math.round(r.height * s));
  }

  resetClock() {
    this.last = 0;
  }

  render(t: number) {
    const dt = this.last ? Math.min(0.05, (t - this.last) / 1000) : 1 / 60;
    this.last = t;
    const { ctx, w, h } = this;
    const ex = w * 0.58;
    const ey = h * 0.46;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, w, h);

    // fender edge silhouette catching the glow
    ctx.strokeStyle = 'rgba(232,137,43,0.35)';
    ctx.lineWidth = h * 0.012;
    ctx.beginPath();
    ctx.arc(ex - h * 0.05, ey + h * 0.55, h * 0.56, Math.PI * 1.08, Math.PI * 1.62);
    ctx.stroke();

    for (let i = 0; i < 26; i++) {
      const a = -0.25 + Math.random() * 1.15; // fan down-right
      const sp = (0.6 + Math.random() * 1.4) * h;
      this.p.push({ x: ex, y: ey, px: ex, py: ey, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - h * 0.3, life: 0, max: 0.25 + Math.random() * 0.7 });
    }

    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    const g = h * 2.4;
    this.p = this.p.filter((s) => {
      s.life += dt;
      if (s.life > s.max) return false;
      s.px = s.x;
      s.py = s.y;
      s.vy += g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const k = 1 - s.life / s.max;
      ctx.strokeStyle = `rgba(255,${(150 + 100 * k) | 0},${(60 * k) | 0},${k})`;
      ctx.lineWidth = Math.max(1, h * 0.004 * k);
      ctx.beginPath();
      ctx.moveTo(s.px, s.py);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
      return true;
    });

    const hot = ctx.createRadialGradient(ex, ey, 0, ex, ey, h * 0.18);
    hot.addColorStop(0, 'rgba(255,240,200,0.9)');
    hot.addColorStop(0.2, 'rgba(232,137,43,0.4)');
    hot.addColorStop(1, 'rgba(232,137,43,0)');
    ctx.fillStyle = hot;
    ctx.fillRect(ex - h * 0.2, ey - h * 0.2, h * 0.4, h * 0.4);
    ctx.globalCompositeOperation = 'source-over';
  }
}
