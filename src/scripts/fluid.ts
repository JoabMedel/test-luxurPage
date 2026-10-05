/**
 * Liquid-ink reveal for the hero.
 *
 * A small stable-fluids solver (WebGL2, no Three.js) whose dye field is used as
 * a hard-edged mask: smoothstep(0.5, 0.51, dye). Inside the mask we paint the
 * hidden layer: black outside the letters, riveted raw aluminium with a slow
 * travelling highlight inside them. The wordmark shape comes from the same SVG
 * path data as the DOM wordmark and is sampled in wordmark-local UVs, so both
 * layers stay aligned while the page scrolls.
 *
 * Settings from the brief: sim 256 (128 on mobile), dye 512, dissipation
 * 0.962 (dye) / 0.988 (velocity), force 5900, curl 0.
 */
import { CAP, RAUH_WELT } from '../lib/wordmark';
import { env } from './env';

const CONFIG = {
  sim: env.mobile ? 128 : 256,
  dye: env.mobile ? 384 : 512,
  dyeDissipation: 0.962,
  velDissipation: 0.988,
  pressure: 0.8,
  iterations: 20,
  force: 5900,
  radius: env.mobile ? 0.003 : 0.0015,
  amount: 2.6,
};

const VERT = `#version 300 es
precision highp float;
in vec2 aPos;
uniform vec2 texel;
out vec2 vUv, vL, vR, vT, vB;
void main(){
  vUv = aPos * .5 + .5;
  vL = vUv - vec2(texel.x, 0.); vR = vUv + vec2(texel.x, 0.);
  vT = vUv + vec2(0., texel.y); vB = vUv - vec2(0., texel.y);
  gl_Position = vec4(aPos, 0., 1.);
}`;

const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB;
out vec4 o;
`;

const SPLAT = `${HEAD}
uniform sampler2D uTarget; uniform float aspect, radius; uniform vec3 color; uniform vec2 point;
void main(){
  vec2 p = vUv - point; p.x *= aspect;
  o = vec4(texture(uTarget, vUv).xyz + exp(-dot(p, p) / radius) * color, 1.);
}`;

const ADVECT = `${HEAD}
uniform sampler2D uVelocity, uSource; uniform vec2 simTexel; uniform float dt, dissipation;
void main(){
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * simTexel;
  o = vec4(dissipation * texture(uSource, coord).xyz, 1.);
}`;

const DIVERGENCE = `${HEAD}
uniform sampler2D uVelocity;
void main(){
  float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.) L = -C.x; if (vR.x > 1.) R = -C.x;
  if (vT.y > 1.) T = -C.y; if (vB.y < 0.) B = -C.y;
  o = vec4(.5 * (R - L + T - B), 0., 0., 1.);
}`;

const CLEAR = `${HEAD}
uniform sampler2D uTexture; uniform float value;
void main(){ o = value * texture(uTexture, vUv); }`;

const PRESSURE = `${HEAD}
uniform sampler2D uPressure, uDivergence;
void main(){
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  o = vec4((L + R + B + T - texture(uDivergence, vUv).x) * .25, 0., 0., 1.);
}`;

const GRADIENT = `${HEAD}
uniform sampler2D uPressure, uVelocity;
void main(){
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  o = vec4(texture(uVelocity, vUv).xy - vec2(R - L, T - B), 0., 1.);
}`;

const DISPLAY = `${HEAD}
uniform sampler2D uDye, uMask, uAlu;
uniform vec4 uRect;      // wordmark rect in canvas uv (x, y-bottom, w, h)
uniform float uAspect;   // wordmark w/h
uniform float uTexAspect;
uniform float uHasAlu, uTime;

float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

vec3 procedural(vec2 luv){
  // brushed raw aluminium + rivet rows, used until the texture arrives
  float grain = hash(vec2(floor(luv.y * 900.), floor(luv.x * 6.)));
  vec3 c = vec3(.62 + grain * .08);
  vec2 g = vec2(luv.x * uAspect * 9., luv.y);
  float row = min(abs(luv.y - .1), abs(luv.y - .9));
  float d = length(vec2(fract(g.x) - .5, row * 9.));
  c += smoothstep(.22, .12, d) * .25;
  return c;
}

void main(){
  float dye = texture(uDye, vUv).r;
  float m = smoothstep(.5, .51, dye);
  if (m <= 0.) { o = vec4(0.); return; }

  vec2 luv = (vUv - uRect.xy) / uRect.zw;
  float inside = step(0., luv.x) * step(luv.x, 1.) * step(0., luv.y) * step(luv.y, 1.);
  float letter = texture(uMask, vec2(luv.x, 1. - luv.y)).r * inside;

  vec2 tuv = vec2(luv.x * uAspect / uTexAspect, 1. - luv.y);
  vec3 alu = uHasAlu > .5 ? texture(uAlu, tuv).rgb : procedural(luv);
  alu = pow(alu, vec3(.92)) * 1.06;

  // slow highlight sweeping across the letters
  float phase = fract(uTime / 7.) * 1.6 - .3;
  float band = (luv.x - (1. - luv.y) * .035) - phase;
  float sweep = exp(-band * band * 260.);
  alu += sweep * vec3(.55, .56, .58);
  alu += (dye - .5) * .015; // faint liquid shading inside the drop

  vec3 col = alu * letter;
  o = vec4(col * m, m);
}`;

type FBO = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };
type DoubleFBO = { read: FBO; write: FBO; swap(): void; w: number; h: number };

export function initFluid(hero: HTMLElement, canvas: HTMLCanvasElement, mark: SVGSVGElement) {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) {
    canvas.remove();
    return null;
  }
  gl.getExtension('OES_texture_float_linear');

  // ------------------------------------------------------------ programs
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const program = (fs: string) => {
    const p = gl.createProgram()!;
    gl.attachShader(p, vs);
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    const u: Record<string, WebGLUniformLocation | null> = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(p, i)!.name;
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  };
  const P = {
    splat: program(SPLAT),
    advect: program(ADVECT),
    div: program(DIVERGENCE),
    clear: program(CLEAR),
    pressure: program(PRESSURE),
    grad: program(GRADIENT),
    display: program(DISPLAY),
  };

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  const blit = (target: FBO | null) => {
    if (target) {
      gl.viewport(0, 0, target.w, target.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  };

  // ---------------------------------------------------------------- FBOs
  const fbo = (w: number, h: number, ifmt: number, fmt: number): FBO => {
    gl.activeTexture(gl.TEXTURE0);
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, gl.HALF_FLOAT, null);
    const f = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo: f, w, h };
  };
  const double = (w: number, h: number, ifmt: number, fmt: number): DoubleFBO => {
    let a = fbo(w, h, ifmt, fmt);
    let b = fbo(w, h, ifmt, fmt);
    return {
      w,
      h,
      get read() {
        return a;
      },
      get write() {
        return b;
      },
      swap() {
        [a, b] = [b, a];
      },
    };
  };
  const res = (r: number) => {
    let a = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (a < 1) a = 1 / a;
    const min = Math.round(r);
    const max = Math.round(r * a);
    return gl.drawingBufferWidth > gl.drawingBufferHeight ? { w: max, h: min } : { w: min, h: max };
  };

  let velocity: DoubleFBO, dye: DoubleFBO, pressure: DoubleFBO, divergence: FBO;
  const freeFBO = (f?: FBO) => {
    if (!f) return;
    gl.deleteTexture(f.tex);
    gl.deleteFramebuffer(f.fbo);
  };
  const buildFBOs = () => {
    [velocity, dye, pressure].forEach((d) => d && (freeFBO(d.read), freeFBO(d.write)));
    freeFBO(divergence);
    const s = res(CONFIG.sim);
    const d = res(CONFIG.dye);
    velocity = double(s.w, s.h, gl.RG16F, gl.RG);
    dye = double(d.w, d.h, gl.R16F, gl.RED);
    pressure = double(s.w, s.h, gl.R16F, gl.RED);
    divergence = fbo(s.w, s.h, gl.R16F, gl.RED);
  };

  // ------------------------------------------------- wordmark mask texture
  const maskTex = gl.createTexture()!;
  const aluTex = gl.createTexture()!;
  let hasAlu = 0;
  let texAspect = 2.33;
  const markAspect = RAUH_WELT.width / CAP;

  const buildMask = () => {
    const w = Math.min(4096, Math.round(mark.getBoundingClientRect().width * env.dpr));
    const h = Math.max(8, Math.round(w / markAspect));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    const s = w / RAUH_WELT.width;
    for (const g of RAUH_WELT.glyphs) {
      ctx.setTransform(s, 0, 0, s, g.x * s, 0);
      ctx.fill(new Path2D(g.d), 'evenodd');
    }
    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  };

  const alu = new Image();
  alu.decoding = 'async';
  alu.src = '/media/aluminium.webp';
  alu.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, aluTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, alu);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    texAspect = alu.naturalWidth / alu.naturalHeight;
    hasAlu = 1;
  };

  // --------------------------------------------------------------- sizing
  let cssW = 1;
  let cssH = 1;
  const resize = () => {
    const r = hero.getBoundingClientRect();
    cssW = r.width;
    cssH = r.height;
    const w = Math.round(cssW * env.dpr);
    const h = Math.round(cssH * env.dpr);
    if (canvas.width === w && canvas.height === h && velocity) return;
    canvas.width = w;
    canvas.height = h;
    buildFBOs();
    buildMask();
  };

  // ---------------------------------------------------------------- input
  let last: { x: number; y: number } | null = null;
  let lastInput = 0;
  const splat = (x: number, y: number, dx: number, dy: number) => {
    const aspect = canvas.width / canvas.height;
    const { splat: S } = P;
    gl.useProgram(S.p);
    gl.uniform1i(S.u.uTarget, 0);
    gl.uniform1f(S.u.aspect, aspect);
    gl.uniform2f(S.u.point, x, y);
    gl.uniform1f(S.u.radius, CONFIG.radius * (aspect > 1 ? aspect : 1) * 0.5);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
    gl.uniform3f(S.u.color, dx * CONFIG.force, dy * CONFIG.force, 0);
    blit(velocity.write);
    velocity.swap();
    gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
    gl.uniform3f(S.u.color, CONFIG.amount, 0, 0);
    blit(dye.write);
    dye.swap();
  };

  const move = (clientX: number, clientY: number) => {
    const r = canvas.getBoundingClientRect();
    if (clientY < r.top || clientY > r.bottom) {
      last = null;
      return;
    }
    const x = (clientX - r.left) / r.width;
    const y = 1 - (clientY - r.top) / r.height;
    if (last) {
      const dx = x - last.x;
      const dy = y - last.y;
      const dist = Math.hypot(dx * (r.width / r.height), dy);
      const steps = Math.min(24, Math.max(1, Math.ceil(dist / 0.012)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        splat(last.x + dx * t, last.y + dy * t, dx / steps, dy / steps);
      }
    }
    last = { x, y };
    lastInput = performance.now();
    wake();
  };
  const onPointer = (e: PointerEvent) => move(e.clientX, e.clientY);
  const onTouch = (e: TouchEvent) => {
    const t = e.touches[0];
    if (t) move(t.clientX, t.clientY);
  };
  const onLeave = () => (last = null);

  // ------------------------------------------------------------------ step
  const step = (dt: number) => {
    const { advect: A, div: D, clear: C, pressure: Pr, grad: G } = P;
    const simTexel = [1 / velocity.w, 1 / velocity.h] as const;

    gl.useProgram(D.p);
    gl.uniform2f(D.u.texel, ...simTexel);
    gl.uniform1i(D.u.uVelocity, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
    blit(divergence);

    gl.useProgram(C.p);
    gl.uniform1i(C.u.uTexture, 0);
    gl.uniform1f(C.u.value, CONFIG.pressure);
    gl.bindTexture(gl.TEXTURE_2D, pressure.read.tex);
    blit(pressure.write);
    pressure.swap();

    gl.useProgram(Pr.p);
    gl.uniform2f(Pr.u.texel, ...simTexel);
    gl.uniform1i(Pr.u.uDivergence, 1);
    gl.uniform1i(Pr.u.uPressure, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, divergence.tex);
    for (let i = 0; i < CONFIG.iterations; i++) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pressure.read.tex);
      blit(pressure.write);
      pressure.swap();
    }

    gl.useProgram(G.p);
    gl.uniform2f(G.u.texel, ...simTexel);
    gl.uniform1i(G.u.uPressure, 0);
    gl.uniform1i(G.u.uVelocity, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, pressure.read.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
    blit(velocity.write);
    velocity.swap();

    const k = dt * 60;
    gl.useProgram(A.p);
    gl.uniform2f(A.u.texel, ...simTexel);
    gl.uniform2f(A.u.simTexel, ...simTexel);
    gl.uniform1f(A.u.dt, dt);
    gl.uniform1i(A.u.uVelocity, 0);
    gl.uniform1i(A.u.uSource, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
    gl.uniform1f(A.u.dissipation, Math.pow(CONFIG.velDissipation, k));
    blit(velocity.write);
    velocity.swap();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
    gl.uniform1f(A.u.dissipation, Math.pow(CONFIG.dyeDissipation, k));
    blit(dye.write);
    dye.swap();
  };

  const render = (time: number) => {
    const { display: Dp } = P;
    const hr = canvas.getBoundingClientRect();
    const mr = mark.getBoundingClientRect();
    gl.useProgram(Dp.p);
    gl.uniform2f(Dp.u.texel, 1 / canvas.width, 1 / canvas.height);
    gl.uniform4f(
      Dp.u.uRect,
      (mr.left - hr.left) / hr.width,
      1 - (mr.bottom - hr.top) / hr.height,
      mr.width / hr.width,
      mr.height / hr.height,
    );
    gl.uniform1f(Dp.u.uAspect, markAspect);
    gl.uniform1f(Dp.u.uTexAspect, texAspect);
    gl.uniform1f(Dp.u.uHasAlu, hasAlu);
    gl.uniform1f(Dp.u.uTime, time / 1000);
    gl.uniform1i(Dp.u.uDye, 0);
    gl.uniform1i(Dp.u.uMask, 1);
    gl.uniform1i(Dp.u.uAlu, 2);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, aluTex);
    gl.clearColor(0, 0, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT);
    blit(null);
  };

  // ------------------------------------------------------------------ loop
  let raf = 0;
  let prev = 0;
  let visible = true;
  const IDLE_MS = 3200; // dye is fully gone well before this
  const frame = (t: number) => {
    raf = 0;
    const dt = Math.min((t - (prev || t)) / 1000, 1 / 30) || 1 / 60;
    prev = t;
    step(dt);
    render(t);
    if (visible && t - lastInput < IDLE_MS) raf = requestAnimationFrame(frame);
    else {
      prev = 0;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  };
  const wake = () => {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  };

  resize();
  const ro = new ResizeObserver(() => resize());
  ro.observe(hero);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible) last = null;
  });
  io.observe(hero);

  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('touchmove', onTouch, { passive: true });
  hero.addEventListener('pointerleave', onLeave);
  window.addEventListener('touchend', onLeave, { passive: true });

  return {
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchmove', onTouch);
      hero.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('touchend', onLeave);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
