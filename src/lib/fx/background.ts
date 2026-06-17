// ────────────────────────────────────────────────────────────────────────────
// The shared WebGL background — a slow, shader-driven field of warm light, dust
// and incense-like motes emerging from darkness. One renderer for the whole
// site (persists across View-Transition navigations). Three.js is reused (no new
// WebGL dependency) and imported lazily so it never blocks first paint.
//
// "Descend inward": scroll progress (0→1) deepens the field — the central light
// grows and the noise layers part, as if peeling through translucent sheaths.
// ────────────────────────────────────────────────────────────────────────────
import { clamp, isSmallScreen, lerp } from './env';

type ThreeNS = typeof import('three');

// Warm per-page tints (RGB 0..1) — the light that emerges takes the page's hue.
const TINTS: Record<string, [number, number, number]> = {
  home: [0.91, 0.78, 0.55],
  about: [0.8, 0.57, 0.31],
  knowledge: [0.9, 0.74, 0.49],
  courses: [0.86, 0.48, 0.34],
  donate: [0.93, 0.8, 0.5],
  search: [0.72, 0.68, 0.62],
  default: [0.88, 0.73, 0.5],
};

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uScroll;
  uniform vec2  uPointer;
  uniform vec2  uRes;
  uniform vec3  uTint;
  uniform float uIntensity;

  // value noise + fbm
  float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i+vec2(1.,0.));
    float c = hash(i+vec2(0.,1.)), d = hash(i+vec2(1.,1.));
    vec2 u = f*f*(3.-2.*f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
  }
  float fbm(vec2 p){
    float v = 0.0, amp = 0.5;
    for(int i=0;i<5;i++){ v += amp*noise(p); p *= 2.02; amp *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    // gentle parallax from pointer + scroll
    vec2 par = uPointer * 0.04 + vec2(0.0, uScroll * 0.12);
    float t = uTime * 0.02;

    // drifting incense smoke — two layers that part as we descend
    float n1 = fbm(p * 2.2 + vec2(t, -t*0.6) + par);
    float n2 = fbm(p * 4.5 - vec2(t*0.7, t) + par*1.7 + n1);
    float smoke = mix(n1, n2, 0.5 + 0.3*uScroll);

    // central light that emerges and grows on descent
    float d = length(p + vec2(0.0, -0.04));
    float core = smoothstep(0.95, 0.0, d);
    float glow = pow(core, 2.2) * (0.35 + 0.85*uScroll);
    glow *= 0.7 + 0.6*smoke;

    // base near-black warm void
    vec3 col = vec3(0.031, 0.031, 0.039);
    col += uTint * glow * (1.1 * uIntensity);
    col += uTint * smoke * 0.05 * (0.6 + uScroll);

    // soft vignette
    float vig = smoothstep(1.25, 0.25, length((uv-0.5)*vec2(aspect,1.0)));
    col *= 0.55 + 0.45*vig;

    // fine grain
    float g = hash(uv*uRes + uTime);
    col += (g - 0.5) * 0.025;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export interface Background {
  setPage(name: string): void;
  setScroll(p: number): void;
  setPointer(x: number, y: number): void;
  play(): void;
  pause(): void;
  /** render exactly one frame (for the reduced-motion still). */
  frame(): void;
  resize(): void;
  destroy(): void;
}

export async function createBackground(
  canvas: HTMLCanvasElement
): Promise<Background | null> {
  // Feature-detect WebGL before paying for Three.
  try {
    const test = document.createElement('canvas');
    if (!test.getContext('webgl') && !test.getContext('experimental-webgl'))
      return null;
  } catch {
    return null;
  }

  const THREE: ThreeNS = await import('three');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: false,
    powerPreference: 'low-power',
  });
  const small = isSmallScreen();
  const maxDpr = small ? 1.25 : 1.75;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();

  const uniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uRes: { value: new THREE.Vector2(1, 1) },
    uTint: { value: new THREE.Vector3(...TINTS.default) },
    uIntensity: { value: small ? 0.85 : 1.0 },
  };

  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, depthTest: false, depthWrite: false })
  );
  quad.frustumCulled = false;
  scene.add(quad);

  // ---- incense motes (additive Points, drifting upward) ----
  const COUNT = small ? 70 : 200;
  const pos = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = Math.random() * 2 - 1;
    pos[i * 3 + 1] = Math.random() * 2 - 1;
    pos[i * 3 + 2] = 0;
    seed[i] = Math.random();
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const moteMat = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTint: uniforms.uTint, uSize: { value: (small ? 2.2 : 3.0) * renderer.getPixelRatio() } },
    vertexShader: `
      uniform float uSize;
      void main(){ gl_PointSize = uSize; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: `
      precision mediump float;
      uniform vec3 uTint;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(uTint, a * 0.5);
      }
    `,
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  motes.frustumCulled = false;
  scene.add(motes);

  // ---- state ----
  let raf = 0;
  let running = false;
  let lastT = performance.now();
  const clock = { t: 0 };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const scroll = { v: 0, tv: 0 };

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
  }
  resize();

  function step(dt: number) {
    clock.t += dt;
    pointer.x = lerp(pointer.x, pointer.tx, 0.05);
    pointer.y = lerp(pointer.y, pointer.ty, 0.05);
    scroll.v = lerp(scroll.v, scroll.tv, 0.06);
    uniforms.uTime.value = clock.t;
    uniforms.uScroll.value = scroll.v;
    uniforms.uPointer.value.set(pointer.x, pointer.y);

    // drift motes upward, wrap around
    const arr = moteGeo.getAttribute('position') as InstanceType<ThreeNS['BufferAttribute']>;
    for (let i = 0; i < COUNT; i++) {
      let y = arr.getY(i) + (0.012 + seed[i] * 0.018) * dt;
      let x = arr.getX(i) + Math.sin(clock.t * 0.3 + seed[i] * 6.28) * 0.0008;
      if (y > 1.05) { y = -1.05; x = Math.random() * 2 - 1; }
      arr.setXY(i, x, y);
    }
    arr.needsUpdate = true;
    renderer.render(scene, camera);
  }

  function tick() {
    const now = performance.now();
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    step(dt);
    if (running) raf = requestAnimationFrame(tick);
  }

  return {
    setPage(name: string) {
      const t = TINTS[name] || TINTS.default;
      uniforms.uTint.value.set(t[0], t[1], t[2]);
    },
    setScroll(p: number) { scroll.tv = clamp(p); },
    setPointer(x: number, y: number) { pointer.tx = x; pointer.ty = y; },
    play() {
      if (running) return;
      running = true;
      lastT = performance.now();
      raf = requestAnimationFrame(tick);
    },
    pause() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    frame() { step(0.016); },
    resize,
    destroy() {
      this.pause();
      moteGeo.dispose();
      moteMat.dispose();
      (quad.material as InstanceType<ThreeNS['ShaderMaterial']>).dispose();
      quad.geometry.dispose();
      renderer.dispose();
    },
  };
}
