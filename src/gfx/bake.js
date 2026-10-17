// Sprite baker: renders any design (Tokonmon or chibi character) into real
// 2D pixel-art frames — orthographic, cel-lit, inner selective outlines, an
// outer ink outline and a transparent background — and packs animation
// sheets (directions × animations) for SpriteActors, portraits and the phone.
import * as THREE from '../../vendor/three.module.js';
import { getTemplate, instantiate, formDesign } from './model.js';
import { Animator } from './anim.js';
import { shadowTint } from './materials.js';

const VERT = /* glsl */`
precision highp float;
in vec3 position; out vec2 vUv; in vec2 uv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const SPRITE = /* glsl */`
precision highp float;
uniform sampler2D tScene; uniform sampler2D tDepth; uniform vec2 uRes;
uniform vec3 uInk; uniform float uInner; uniform float uOuter; uniform float uExposure; uniform float uSat; uniform float uMode;
in vec2 vUv; out vec4 o;
vec3 aces(vec3 x){ const float a=2.51, b=0.03, c=2.43, d=0.59, e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0); }
// mode 0 = albedo (relative cel shading only; the world lights it), 1 = display-ready (UI)
vec3 grade(vec3 c){ if (uMode < 0.5) return clamp(c, 0.0, 1.0); c = aces(c * uExposure); float l = dot(c, vec3(0.2126,0.7152,0.0722)); c = mix(vec3(l), c, uSat); return clamp(c, 0.0, 1.0); }
vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
float dep(ivec2 p){ if (p.x < 0 || p.y < 0 || p.x >= int(uRes.x) || p.y >= int(uRes.y)) return 1.0; return texelFetch(tDepth, p, 0).r; }
void main(){
  ivec2 p = ivec2(gl_FragCoord.xy);
  float d0 = dep(p);
  if (d0 >= 0.9999) {
    // outer outline: transparent pixel touching the sprite
    ivec2 N[4] = ivec2[4](ivec2(1,0), ivec2(-1,0), ivec2(0,1), ivec2(0,-1));
    for (int i = 0; i < 4; i++) {
      ivec2 q = p + N[i];
      if (dep(q) < 0.9999 && uOuter > 0.0) { vec3 c = grade(texelFetch(tScene, q, 0).rgb); o = vec4(srgb(mix(c * c * 0.35, uInk, 0.6)), 1.0); return; }
    }
    o = vec4(0.0); return;
  }
  vec3 col = grade(texelFetch(tScene, p, 0).rgb);
  // inner selective outline at depth steps (ortho depth is linear)
  float dl = dep(p + ivec2(-1,0)), dr = dep(p + ivec2(1,0)), dd = dep(p + ivec2(0,-1)), du = dep(p + ivec2(0,1));
  float e = max(max(dl, dr), max(dd, du)) - d0;
  if (uInner > 0.0 && e > 0.012) col = mix(col, col * col * vec3(0.55, 0.42, 0.62), 0.85);
  o = vec4(srgb(col), 1.0);
}`;

export class Baker {
  constructor(renderer) {
    this.r = renderer;
    this.scene = new THREE.Scene();
    // normalised so the lit band ≈ albedo (sprites are lit again by the world)
    this.key = new THREE.DirectionalLight(0xfff6ea, 2.1); this.key.position.set(-1.2, 2.2, 2.2);
    this.rim = new THREE.DirectionalLight(0xc4dcff, 0.7); this.rim.position.set(2, 1.2, -2);
    this.hemi = new THREE.HemisphereLight(0xe6ecff, 0x7a6a88, 0.95);
    this.scene.add(this.key, this.rim, this.hemi);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 50);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); this.quad.frustumCulled = false;
    this.qScene = new THREE.Scene(); this.qScene.add(this.quad);
    this.qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.u = { tScene: { value: null }, tDepth: { value: null }, uRes: { value: new THREE.Vector2() }, uInk: { value: new THREE.Color(0x1a1024) }, uInner: { value: 1 }, uOuter: { value: 1 }, uExposure: { value: 1.25 }, uSat: { value: 1.12 }, uMode: { value: 1 } };
    this.mat = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: SPRITE, uniforms: this.u, depthTest: false, depthWrite: false });
    this.quad.material = this.mat;
    this.targets = new Map();
    this.cache = new Map();
  }
  _targets(w, h) {
    const k = w + 'x' + h;
    let t = this.targets.get(k);
    if (!t) {
      const dt = new THREE.DepthTexture(w, h); dt.type = THREE.UnsignedIntType;
      const a = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthTexture: dt, depthBuffer: true });
      a.texture.minFilter = a.texture.magFilter = THREE.NearestFilter;
      const b = new THREE.WebGLRenderTarget(w, h, { type: THREE.UnsignedByteType, depthBuffer: false });
      t = { a, b, buf: new Uint8Array(w * h * 4) };
      this.targets.set(k, t);
    }
    return t;
  }
  // Model instance prepared for baking (cached per design/form).
  model(design, form) {
    const d = form ? formDesign(design, form) : design;
    const key = 'bake:' + (d.id || JSON.stringify(d).length);
    let m = this.cache.get(key);
    if (!m) {
      const obj = instantiate(getTemplate(d, d.id), { rim: 0.22, shadow: false });
      const anim = new Animator(obj, { stepFps: 0 });
      m = { obj, anim, rig: obj.userData.rig };
      this.cache.set(key, m);
    }
    return m;
  }
  // Render one frame. o: { w, h, ppm, yaw, pitch, anchor:[ax,ay] (pixel of model origin), into: ctx, x, y }
  frame(m, o) {
    const { w, h } = o;
    const t = this._targets(w, h);
    const ppm = o.ppm || 32;
    const yaw = o.yaw ?? 0, pitch = o.pitch ?? 0.12;
    m.obj.rotation.y = yaw;
    this.scene.add(m.obj);
    const ax = o.anchor ? o.anchor[0] : w / 2, ay = o.anchor ? o.anchor[1] : h - 3;
    // ortho frustum so that the model origin lands on pixel (ax, ay)
    const W = w / ppm, H = h / ppm;
    const left = -ax / ppm, right = left + W, bottom = -(h - ay) / ppm, top = bottom + H;
    this.cam.left = left; this.cam.right = right; this.cam.top = top; this.cam.bottom = bottom;
    this.cam.updateProjectionMatrix();
    const dist = 10;
    this.cam.position.set(0, Math.sin(pitch) * dist, Math.cos(pitch) * dist);
    this.cam.up.set(0, 1, 0);
    this.cam.lookAt(0, 0, 0);
    // keep the ground pivot at the anchor despite pitch: shift along camera up
    const prevST = shadowTint.value.clone();
    const r = this.r;
    const prevTarget = r.getRenderTarget();
    const prevClear = r.getClearColor(new THREE.Color()), prevAlpha = r.getClearAlpha();
    r.setClearColor(0x000000, 0);
    this.u.uMode.value = o.mode === 'albedo' ? 0 : 1;
    r.setRenderTarget(t.a); r.clear(); r.render(this.scene, this.cam);
    this.u.tScene.value = t.a.texture; this.u.tDepth.value = t.a.depthTexture; this.u.uRes.value.set(w, h);
    r.setRenderTarget(t.b); r.clear(); r.render(this.qScene, this.qCam);
    r.readRenderTargetPixels(t.b, 0, 0, w, h, t.buf);
    r.setRenderTarget(prevTarget);
    r.setClearColor(prevClear, prevAlpha);
    shadowTint.value.copy(prevST);
    this.scene.remove(m.obj);
    // flip rows into the destination
    const ctx = o.into;
    const img = ctx.createImageData(w, h);
    for (let row = 0; row < h; row++) img.data.set(t.buf.subarray((h - 1 - row) * w * 4, (h - row) * w * 4), row * w * 4);
    ctx.putImageData(img, o.x || 0, o.y || 0);
  }
  // Single still (icons, portraits). opts: { w, h, ppm, yaw, pitch, anchor, expr, play, t, form, fit }
  still(design, opts = {}) {
    const m = this.model(design, opts.form);
    const w = opts.w || 64, h = opts.h || 64;
    let ppm = opts.ppm, anchor = opts.anchor;
    if (opts.fit !== false && !ppm) {
      const b = m.rig.bounds;
      const sw = Math.max(b.max.x - b.min.x, b.max.z - b.min.z, 0.1), sh = Math.max(b.max.y, 0.1);
      ppm = Math.floor(Math.min((w - 6) / sw, (h - 6) / sh) * 10) / 10;
      anchor = anchor || [w / 2, h - Math.max(3, (h - sh * ppm) / 2)];
    }
    this.pose(m, opts.play, opts.t ?? 0.3, opts.expr, opts.mode);
    const cv = mkCanvas(w, h);
    this.frame(m, { w, h, ppm, yaw: opts.yaw ?? 0.45, pitch: opts.pitch ?? 0.15, anchor, into: cv.getContext('2d'), mode: opts.mode });
    return cv;
  }
  // Dialogue portrait (head & shoulders) for one expression. Framing comes from
  // design.portrait = { y: head-centre height (m), size: frame height (m), yaw }.
  portrait(design, opts = {}) {
    const m = this.model(design, opts.form);
    const w = opts.w || 80, h = opts.h || 80;
    const fr = design.portrait || {};
    const b = m.rig.bounds;
    const y = fr.y ?? b.max.y * 0.78;
    const size = fr.size ?? Math.max(0.5, b.max.y * 0.55);
    const ppm = h / size;
    this.pose(m, opts.play || null, opts.t ?? 0.2, opts.expr || null, null);
    if (opts.talk) { m.anim.talking = true; m.anim.mouthOpen = true; m.anim.talkT = 99; m.anim._face(0); }
    const cv = mkCanvas(w, h);
    this.frame(m, { w, h, ppm, yaw: opts.yaw ?? fr.yaw ?? 0.32, pitch: opts.pitch ?? 0.06, anchor: [w / 2, h * 0.47 + y * ppm], into: cv.getContext('2d'), mode: 'display' });
    return cv;
  }
  pose(m, action, t, expr, mode) {
    const a = m.anim;
    a.action = null; a.prev = null; a.mode = null; a.modeW = 0; a.speed = a.speedS = 0; a.lookYaw = a.lookYawS = 0;
    a.blinkT = 99; a.blinking = 0; a.talking = false;
    if (mode) { a.setMode(mode); a.modeW = 1; }
    if (action) a.play(action);
    if (expr) a.setFace(expr, 99);
    a.t = 0.6;
    a._update(Math.max(0.001, t));
  }
  // Animation sheet. spec: { w, h, ppm, pitch, dirs: { side: yaw, front: yaw, back: yaw },
  //   anims: { idle: { frames, dur, loop }, walk: { frames, dur, speed }, wave: { frames, dur, action }, … }, form }
  sheet(design, spec) {
    const m = this.model(design, spec.form);
    const w = spec.w || 48, h = spec.h || 64;
    const dirs = spec.dirs || { side: Math.PI / 2, front: 0.25, back: Math.PI };
    const anims = spec.anims;
    let count = 0;
    for (const [, a] of Object.entries(anims)) count += a.frames * (a.dirs || Object.keys(dirs)).length;
    const cols = Math.min(16, count), rows = Math.ceil(count / cols);
    const cv = mkCanvas(cols * w, rows * h);
    const ctx = cv.getContext('2d');
    const frames = {};
    let n = 0;
    for (const [name, a] of Object.entries(anims)) {
      frames[name] = {};
      for (const dn of a.dirs || Object.keys(dirs)) {
        frames[name][dn] = [];
        for (let f = 0; f < a.frames; f++) {
          const an = m.anim;
          an.action = null; an.prev = null; an.mode = null; an.modeW = 0; an.lookYaw = an.lookYawS = 0; an.blinkT = 99; an.blinking = 0;
          an.talking = false; an.mouthOpen = false; an.quirkT = 999; an.faceOverride = null; an.speed = an.speedS = 0;
          const ph = f / a.frames;
          if (a.mode) { an.setMode(a.mode); an.modeW = 1; an.modeT = 1 + ph * (a.dur || 1); }
          if (a.expr) an.setFace(a.expr, 99);
          if (a.talk) { an.talking = true; an.mouthOpen = f % 2 === 1; an.talkT = 99; }
          if (a.speed) { an.speed = an.speedS = a.speed; an.phase = ph * Math.PI * 2; an.t = 1 + ph * (a.dur || 1); an._update(1e-5); }
          else if (a.action) { an.play(a.action); an._update(Math.max(1e-4, ph * an.action.dur)); }
          else { an.t = (a.t0 || 0) + ph * (a.dur || 1); an._update(1e-5); }
          if (a.talk) { an.mouthOpen = f % 2 === 1; an._face(0); }
          const x = (n % cols) * w, y = Math.floor(n / cols) * h;
          this.frame(m, { w, h, ppm: spec.ppm || 32, yaw: dirs[dn], pitch: spec.pitch ?? 0.12, anchor: spec.anchor || [w / 2, h - 3], into: ctx, x, y, mode: spec.mode });
          frames[name][dn].push({ x, y, w, h });
          n++;
        }
      }
    }
    return { canvas: cv, frames, w, h, ppm: spec.ppm || 32, anchor: spec.anchor || [w / 2, h - 3], anims };
  }
}

export function mkCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined' && typeof document === 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}

let _baker = null;
export function baker(renderer) { if (!_baker) _baker = new Baker(renderer); return _baker; }
