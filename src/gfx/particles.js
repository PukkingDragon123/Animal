// Particle & destruction FX:
//  • Billboard particles (one instanced draw per blend mode) using a generated
//    pixel-art sprite atlas (no canvas needed) — fire, sparks, notes, petals…
//  • Voxel debris: instanced cubes with physics for destruction / impacts.
//  • Shape FX: additive rings, shockwave spheres, pillars and beams.
//  • Ground decals: scorch, crack, puddle, crater (fade out).
import * as THREE from '../../vendor/three.module.js';
import { clamp01, lerp, TAU } from '../core/mathx.js';
import { hash3 } from '../core/rng.js';

// ------------------------------------------------------------- sprite atlas
const CELL = 16, GRID = 8, ATLAS = CELL * GRID;
export const SPR = {
  dot: 0, pix: 1, star: 2, ring: 3, smoke: 4, flame: 5, drop: 6, leaf: 7, petal: 8, note: 9, zz: 10, streak: 11,
  bubble: 12, heart: 13, cross: 14, shard: 15, bolt: 16, swirl: 17, star5: 18, flower: 19, snow: 20, eye: 21, dot2: 22, ember: 23, note2: 24, coin: 25, bang: 26,
};
const PATTERNS = {
  note: ['......kkkkk.....', '......kkkkkk....', '......k....kk...', '......k.....k...', '......k.........', '......k.........', '......k.........', '......k.........', '..kkkkk.........', '.kkkkkk.........', 'kkkkkkk.........', 'kkkkkkk.........', '.kkkkk..........', '................', '................', '................'],
  note2: ['...kkkkkkkkkk...', '...kkkkkkkkkk...', '...k........k...', '...k........k...', '...k........k...', '...k........k...', 'kkkk.....kkkk...', 'kkkk....kkkkk...', 'kkkk....kkkkk...', '.kk......kkk....', '................', '................', '................', '................', '................', '................'],
  zz: ['................', '..kkkkkkkkkk....', '..kkkkkkkkkk....', '.........kkk....', '........kkk.....', '.......kkk......', '......kkk.......', '.....kkk........', '....kkk.........', '...kkk..........', '..kkkkkkkkkk....', '..kkkkkkkkkk....', '................', '................', '................', '................'],
  heart: ['................', '..kkk....kkk....', '.kkkkk..kkkkk...', 'kkkkkkkkkkkkkk..', 'kkkkkkkkkkkkkk..', 'kkkkkkkkkkkkkk..', '.kkkkkkkkkkkk...', '..kkkkkkkkkk....', '...kkkkkkkk.....', '....kkkkkk......', '.....kkkk.......', '......kk........', '................', '................', '................', '................'],
  cross: ['................', '.....kkkkk......', '.....kkkkk......', '.....kkkkk......', '.....kkkkk......', 'kkkkkkkkkkkkkkk.', 'kkkkkkkkkkkkkkk.', 'kkkkkkkkkkkkkkk.', 'kkkkkkkkkkkkkkk.', 'kkkkkkkkkkkkkkk.', '.....kkkkk......', '.....kkkkk......', '.....kkkkk......', '.....kkkkk......', '................', '................'],
  bolt: ['........kkkk....', '.......kkkk.....', '......kkkk......', '.....kkkk.......', '....kkkkkkkk....', '...kkkkkkkk.....', '.......kkk......', '......kkk.......', '.....kkk........', '....kk..........', '...k............', '................', '................', '................', '................', '................'],
  eye: ['................', '................', '.....kkkkkk.....', '...kk......kk...', '..k...kkkk...k..', '.k...kkkkkk...k.', '.k...kk..kk...k.', '.k...kkkkkk...k.', '..k...kkkk...k..', '...kk......kk...', '.....kkkkkk.....', '................', '................', '................', '................', '................'],
  coin: ['................', '.....kkkkkk.....', '...kkkkkkkkkk...', '..kkk......kkk..', '..kk..kkkk..kk..', '.kk..kk..kk..kk.', '.kk..kk......kk.', '.kk..kk......kk.', '.kk..kk..kk..kk.', '..kk..kkkk..kk..', '..kkk......kkk..', '...kkkkkkkkkk...', '.....kkkkkk.....', '................', '................', '................'],
  bang: ['................', '......kkkk......', '......kkkk......', '......kkkk......', '......kkkk......', '......kkkk......', '......kkkk......', '......kkkk......', '................', '......kkkk......', '......kkkk......', '................', '................', '................', '................', '................'],
};

function buildAtlas() {
  const data = new Uint8Array(ATLAS * ATLAS * 4);
  const put = (cell, x, y, a, l = 255) => {
    if (x < 0 || y < 0 || x >= CELL || y >= CELL) return;
    const cx = (cell % GRID) * CELL + x, cy = Math.floor(cell / GRID) * CELL + y;
    const i = (cy * ATLAS + cx) * 4;
    const av = Math.max(0, Math.min(255, Math.round(a * 255)));
    if (av < data[i + 3]) return;
    data[i] = data[i + 1] = data[i + 2] = l; data[i + 3] = av;
  };
  const field = (cell, f) => { for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) { const r = f((x + 0.5) / CELL * 2 - 1, (y + 0.5) / CELL * 2 - 1, x, y); if (r) put(cell, x, y, r[0], r[1] ?? 255); } };
  field(SPR.dot, (u, v) => { const d = Math.hypot(u, v); return d < 1 ? [Math.pow(1 - d, 1.6)] : null; });
  field(SPR.dot2, (u, v) => { const d = Math.hypot(u, v); return d < 1 ? [Math.pow(1 - d, 3.0)] : null; });
  field(SPR.pix, (u, v) => (Math.abs(u) < 0.42 && Math.abs(v) < 0.42 ? [1] : null));
  field(SPR.star, (u, v) => { const a = Math.abs(u), b = Math.abs(v); const s = (a < 0.14 && b < 0.95) || (b < 0.14 && a < 0.95) || (a + b < 0.42); return s ? [1] : null; });
  field(SPR.ring, (u, v) => { const d = Math.hypot(u, v); return d > 0.7 && d < 0.95 ? [1] : null; });
  field(SPR.smoke, (u, v, x, y) => { const n = hash3(x >> 1, y >> 1, 7) * 0.25; const d = Math.hypot(u * 1.05, v) + n * 0.6; return d < 0.95 ? [clamp01((0.95 - d) * 3), v > 0.15 ? 235 : 190] : null; });
  field(SPR.flame, (u, v) => { const w = 0.62 * (1 - (v + 1) / 2.2) * Math.sqrt(clamp01((v + 1) / 0.5)); return Math.abs(u) < w && v < 0.95 ? [1, v < -0.3 ? 255 : 230] : null; });
  field(SPR.drop, (u, v) => { const yy = -v; const w = 0.55 * Math.sqrt(clamp01((yy + 1) / 1.9)) * (yy > 0.35 ? Math.sqrt(clamp01(1 - (yy - 0.35) / 0.6)) : 1); return Math.abs(u) < w ? [1, u < -0.15 && v > -0.2 ? 255 : 215] : null; });
  field(SPR.leaf, (u, v) => { const a = (u + v) * 0.7071, b = (v - u) * 0.7071; return Math.abs(b) < 0.42 * (1 - Math.abs(a) / 0.95) * 1.2 && Math.abs(a) < 0.95 ? [1, Math.abs(b) < 0.06 ? 160 : 240] : null; });
  field(SPR.petal, (u, v) => { const d = Math.hypot(u * 1.3, v); const notch = v > 0.55 && Math.abs(u) < 0.14; return d < 0.85 && !notch ? [1, v > 0 ? 255 : 220] : null; });
  field(SPR.streak, (u, v) => (Math.abs(v) < 0.12 && Math.abs(u) < 0.98 ? [1 - Math.abs(u) * 0.8] : null));
  field(SPR.bubble, (u, v) => { const d = Math.hypot(u, v); if (d > 0.72 && d < 0.92) return [0.9]; if (Math.hypot(u + 0.32, v - 0.32) < 0.16) return [1]; return d < 0.72 ? [0.15] : null; });
  field(SPR.shard, (u, v) => (Math.abs(u) * 1.7 + Math.abs(v) < 0.95 ? [1, u < 0 ? 255 : 200] : null));
  field(SPR.swirl, (u, v) => { const r = Math.hypot(u, v), a = Math.atan2(v, u); const s = Math.abs(((a / TAU + r * 1.3) % 0.5 + 0.5) % 0.5 - 0.25); return r < 0.95 && s < 0.07 ? [1] : null; });
  field(SPR.star5, (u, v) => { const a = Math.atan2(v, u) + Math.PI / 2, r = Math.hypot(u, v); const k = Math.cos(2.5 * a); const lim = 0.45 + 0.5 * Math.pow(Math.abs(k), 6); return r < lim ? [1] : null; });
  field(SPR.flower, (u, v) => { const a = Math.atan2(v, u), r = Math.hypot(u, v); if (r < 0.22) return [1, 180]; return r < 0.55 + 0.4 * Math.abs(Math.cos(2.5 * a)) ? [1] : null; });
  field(SPR.snow, (u, v) => { const a = Math.abs(u), b = Math.abs(v), c = Math.abs(u * 0.5 + v * 0.866), d = Math.abs(u * 0.5 - v * 0.866); const r = Math.hypot(u, v); return r < 0.95 && (a < 0.09 || c < 0.09 || d < 0.09) ? [1] : null; });
  field(SPR.ember, (u, v) => { const d = Math.abs(u) + Math.abs(v); return d < 0.7 ? [1, d < 0.3 ? 255 : 220] : null; });
  for (const [name, rows] of Object.entries(PATTERNS)) {
    const cell = SPR[name];
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) if (rows[y] && rows[y][x] === 'k') put(cell, x, CELL - 1 - y, 1);
  }
  const t = new THREE.DataTexture(data, ATLAS, ATLAS, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
}

const P_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iColor; attribute vec4 iMisc; // size, rot, frame, aspect
varying vec2 vUv; varying vec4 vCol;
void main(){
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float c = cos(iMisc.y), s = sin(iMisc.y);
  vec2 q = vec2(position.x * iMisc.w, position.y);
  q = vec2(q.x * c - q.y * s, q.x * s + q.y * c) * iMisc.x;
  vec3 wp = iPos + right * q.x + up * q.y;
  float f = iMisc.z;
  vec2 cell = vec2(mod(f, ${GRID}.0), floor(f / ${GRID}.0));
  vUv = (cell + uv) / ${GRID}.0;
  vCol = iColor;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const P_FRAG = /* glsl */`
uniform sampler2D tAtlas; uniform float uAlphaMode;
varying vec2 vUv; varying vec4 vCol;
void main(){
  vec4 t = texture2D(tAtlas, vUv);
  float a = t.a * vCol.a;
  if (uAlphaMode > 0.5) { if (a < 0.08) discard; gl_FragColor = vec4(vCol.rgb * (t.r), a); }
  else gl_FragColor = vec4(vCol.rgb * t.r * a, 1.0);
}`;

class ParticleLayer {
  constructor(atlas, max, additive) {
    this.max = max; this.n = 0;
    const N = max;
    // SoA state
    this.p = new Float32Array(N * 3); this.v = new Float32Array(N * 3);
    this.life = new Float32Array(N); this.age = new Float32Array(N);
    this.s0 = new Float32Array(N); this.s1 = new Float32Array(N);
    this.c0 = new Float32Array(N * 4); this.c1 = new Float32Array(N * 4);
    this.rot = new Float32Array(N); this.rv = new Float32Array(N);
    this.frame = new Float32Array(N); this.drag = new Float32Array(N); this.grav = new Float32Array(N); this.asp = new Float32Array(N);
    this.align = new Uint8Array(N); this.floor = new Float32Array(N);
    // GPU
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
    this.aPos = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aMisc = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('iPos', this.aPos); g.setAttribute('iColor', this.aCol); g.setAttribute('iMisc', this.aMisc);
    g.instanceCount = 0;
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: P_VERT, fragmentShader: P_FRAG,
      uniforms: { tAtlas: { value: atlas }, uAlphaMode: { value: additive ? 0 : 1 } },
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = additive ? 20 : 19;
  }
  spawn(o) {
    if (this.n >= this.max) return -1;
    const i = this.n++;
    const p = o.pos, v = o.vel || [0, 0, 0];
    this.p[i * 3] = p[0]; this.p[i * 3 + 1] = p[1]; this.p[i * 3 + 2] = p[2];
    this.v[i * 3] = v[0]; this.v[i * 3 + 1] = v[1]; this.v[i * 3 + 2] = v[2];
    this.life[i] = o.life ?? 1; this.age[i] = 0;
    this.s0[i] = o.size ?? 0.2; this.s1[i] = o.size1 ?? this.s0[i];
    const c0 = o.color || [1, 1, 1, 1], c1 = o.color1 || [c0[0], c0[1], c0[2], 0];
    for (let k = 0; k < 4; k++) { this.c0[i * 4 + k] = c0[k] ?? 1; this.c1[i * 4 + k] = c1[k] ?? 0; }
    this.rot[i] = o.rot ?? 0; this.rv[i] = o.spin ?? 0;
    this.frame[i] = o.sprite ?? 0; this.drag[i] = o.drag ?? 0; this.grav[i] = o.gravity ?? 0; this.asp[i] = o.aspect ?? 1;
    this.align[i] = o.align ? 1 : 0; this.floor[i] = o.floor ?? -1e9;
    return i;
  }
  _kill(i) {
    const j = --this.n;
    if (i === j) return;
    const cp3 = (a) => { a[i * 3] = a[j * 3]; a[i * 3 + 1] = a[j * 3 + 1]; a[i * 3 + 2] = a[j * 3 + 2]; };
    const cp4 = (a) => { for (let k = 0; k < 4; k++) a[i * 4 + k] = a[j * 4 + k]; };
    cp3(this.p); cp3(this.v); cp4(this.c0); cp4(this.c1);
    for (const a of [this.life, this.age, this.s0, this.s1, this.rot, this.rv, this.frame, this.drag, this.grav, this.asp, this.align, this.floor]) a[i] = a[j];
  }
  update(dt, cam) {
    const P = this.aPos.array, Cc = this.aCol.array, M = this.aMisc.array;
    let camR = null, camU = null;
    if (cam) { const e = cam.matrixWorld.elements; camR = [e[0], e[1], e[2]]; camU = [e[4], e[5], e[6]]; }
    for (let i = 0; i < this.n; i++) {
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) { this._kill(i); i--; continue; }
      const k = 1 - this.drag[i] * dt;
      this.v[i * 3] *= k; this.v[i * 3 + 1] = this.v[i * 3 + 1] * k - this.grav[i] * dt; this.v[i * 3 + 2] *= k;
      this.p[i * 3] += this.v[i * 3] * dt; this.p[i * 3 + 1] += this.v[i * 3 + 1] * dt; this.p[i * 3 + 2] += this.v[i * 3 + 2] * dt;
      if (this.p[i * 3 + 1] < this.floor[i]) { this.p[i * 3 + 1] = this.floor[i]; this.v[i * 3 + 1] *= -0.3; this.v[i * 3] *= 0.6; this.v[i * 3 + 2] *= 0.6; }
      this.rot[i] += this.rv[i] * dt;
    }
    for (let i = 0; i < this.n; i++) {
      const t = this.age[i] / this.life[i];
      P[i * 3] = this.p[i * 3]; P[i * 3 + 1] = this.p[i * 3 + 1]; P[i * 3 + 2] = this.p[i * 3 + 2];
      const fin = Math.min(1, t * 8);
      for (let c = 0; c < 4; c++) Cc[i * 4 + c] = lerp(this.c0[i * 4 + c], this.c1[i * 4 + c], t);
      Cc[i * 4 + 3] *= fin;
      let rot = this.rot[i];
      if (this.align[i] && camR) {
        const vx = this.v[i * 3], vy = this.v[i * 3 + 1], vz = this.v[i * 3 + 2];
        rot = Math.atan2(vx * camU[0] + vy * camU[1] + vz * camU[2], vx * camR[0] + vy * camR[1] + vz * camR[2]);
      }
      M[i * 4] = lerp(this.s0[i], this.s1[i], t); M[i * 4 + 1] = rot; M[i * 4 + 2] = this.frame[i]; M[i * 4 + 3] = this.asp[i];
    }
    this.geo.instanceCount = this.n;
    this.aPos.needsUpdate = this.aCol.needsUpdate = this.aMisc.needsUpdate = true;
  }
  clear() { this.n = 0; this.geo.instanceCount = 0; }
}

// ------------------------------------------------------------- debris
class Debris {
  constructor(max = 700) {
    this.max = max; this.n = 0;
    const mat = new THREE.MeshToonMaterial({ color: 0xffffff });
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    this.mesh.count = 0; this.mesh.castShadow = true; this.mesh.frustumCulled = false;
    this.items = [];
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._s = new THREE.Vector3(); this._p = new THREE.Vector3();
    this.groundAt = () => 0;
  }
  spawn(pos, vel, size, color, life = 2.5) {
    let it;
    if (this.items.length >= this.max) it = this.items.shift(); else it = {};
    Object.assign(it, { p: [pos[0], pos[1], pos[2]], v: [vel[0], vel[1], vel[2]], r: [Math.random() * 6, Math.random() * 6, Math.random() * 6], rv: [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14], s: size, c: new THREE.Color(color), age: 0, life, rest: false });
    this.items.push(it);
  }
  update(dt) {
    const arr = this.items;
    let w = 0;
    for (let i = 0; i < arr.length; i++) {
      const it = arr[i];
      it.age += dt;
      if (it.age >= it.life) continue;
      if (!it.rest) {
        it.v[1] -= 18 * dt;
        for (let k = 0; k < 3; k++) { it.p[k] += it.v[k] * dt; it.r[k] += it.rv[k] * dt; }
        const gy = this.groundAt(it.p[0], it.p[2]) + it.s * 0.5;
        if (it.p[1] < gy) {
          it.p[1] = gy;
          if (Math.abs(it.v[1]) < 1.2) { it.rest = true; it.v = [0, 0, 0]; it.rv = [0, 0, 0]; }
          else { it.v[1] *= -0.38; it.v[0] *= 0.62; it.v[2] *= 0.62; for (let k = 0; k < 3; k++) it.rv[k] *= 0.5; }
        }
      }
      arr[w++] = it;
    }
    arr.length = w;
    const m = this._m;
    for (let i = 0; i < arr.length; i++) {
      const it = arr[i];
      const fade = it.age > it.life - 0.5 ? Math.max(0.01, (it.life - it.age) / 0.5) : 1;
      this._e.set(it.r[0], it.r[1], it.r[2]); this._q.setFromEuler(this._e);
      const s = it.s * fade; this._s.set(s, s, s); this._p.set(it.p[0], it.p[1], it.p[2]);
      m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(i, m);
      this.mesh.setColorAt(i, it.c);
    }
    this.mesh.count = arr.length;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
  clear() { this.items.length = 0; this.mesh.count = 0; }
}

// ------------------------------------------------------------- shape FX
const S_VERT = /* glsl */`
varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vL;
void main(){ vUv = uv; vL = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;
const S_FRAG = /* glsl */`
uniform vec3 uColor; uniform float uOpacity; uniform float uMode; uniform float uTime;
varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vL;
void main(){
  float a = 1.0;
  if (uMode < 0.5) { // ring: radial fade across the band (inner .75 → outer 1)
    float r = (length(vL.xy) - 0.75) / 0.25; a = smoothstep(0.0, 0.35, r) * smoothstep(1.0, 0.65, r);
  } else if (uMode < 1.5) { // fresnel shell
    float f = 1.0 - abs(dot(normalize(vN), normalize(vV))); a = pow(f, 1.6) + 0.06;
  } else if (uMode < 2.5) { // pillar / beam: soft edges + scrolling bands
    float f = 1.0 - abs(dot(normalize(vN), normalize(vV))); a = (0.35 + 0.65 * (1.0 - f)) * (0.75 + 0.25 * sin(vUv.y * 30.0 - uTime * 20.0));
    a *= smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
  } else { // disc
    float r = length(vUv - 0.5) * 2.0; a = smoothstep(1.0, 0.6, r);
  }
  gl_FragColor = vec4(uColor * a * uOpacity, 1.0);
}`;

class ShapeFX {
  constructor() {
    this.group = new THREE.Group();
    this.geos = {
      ring: new THREE.RingGeometry(0.75, 1, 48, 1),
      sphere: new THREE.SphereGeometry(1, 24, 16),
      pillar: new THREE.CylinderGeometry(1, 1, 1, 24, 1, true),
      cone: new THREE.ConeGeometry(1, 1, 24, 1, true),
      disc: new THREE.CircleGeometry(1, 32),
    };
    this.geos.pillar.translate(0, 0.5, 0);
    this.geos.cone.translate(0, 0.5, 0);
    this.items = [];
    this.pool = [];
  }
  _mesh(kind) {
    let m = this.pool.find((p) => p.userData.kind === kind);
    if (m) { this.pool.splice(this.pool.indexOf(m), 1); m.visible = true; return m; }
    const mat = new THREE.ShaderMaterial({ vertexShader: S_VERT, fragmentShader: S_FRAG, uniforms: { uColor: { value: new THREE.Color() }, uOpacity: { value: 1 }, uMode: { value: 0 }, uTime: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    m = new THREE.Mesh(this.geos[kind], mat);
    m.userData.kind = kind; m.frustumCulled = false; m.renderOrder = 18;
    this.group.add(m);
    return m;
  }
  // o: {kind, pos, r0, r1, h0, h1, life, color, intensity, dir (for beam), flat}
  spawn(o) {
    const kind = o.kind || 'ring';
    const m = this._mesh(kind);
    const mode = kind === 'ring' ? 0 : kind === 'sphere' ? 1 : kind === 'disc' ? 3 : 2;
    m.material.uniforms.uMode.value = mode;
    m.material.uniforms.uColor.value.set(o.color ?? 0xffffff).multiplyScalar(o.intensity ?? 2);
    m.position.set(o.pos[0], o.pos[1], o.pos[2]);
    m.rotation.set(0, 0, 0);
    if (kind === 'ring' || kind === 'disc') { if (o.vertical) m.rotation.set(0, o.yaw || 0, 0); else m.rotation.x = -Math.PI / 2; }
    if (o.dir) { // orient +y along dir (beams)
      const d = new THREE.Vector3(o.dir[0], o.dir[1], o.dir[2]).normalize();
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    }
    this.items.push({ m, o, age: 0, life: o.life ?? 0.5 });
    this._apply(this.items[this.items.length - 1], 0);
  }
  _apply(it, t) {
    const o = it.o, m = it.m, e = 1 - Math.pow(1 - t, 3);
    const r = lerp(o.r0 ?? 0.2, o.r1 ?? 2, e);
    const h = lerp(o.h0 ?? 1, o.h1 ?? (o.h0 ?? 1), e);
    if (m.userData.kind === 'pillar' || m.userData.kind === 'cone') m.scale.set(r, h, r);
    else m.scale.set(r, r, r);
    const fade = o.hold ? (t < o.hold ? 1 : 1 - (t - o.hold) / (1 - o.hold)) : 1 - t;
    m.material.uniforms.uOpacity.value = Math.max(0, fade) * (o.opacity ?? 1);
  }
  update(dt, time) {
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      it.age += dt;
      const t = it.age / it.life;
      it.m.material.uniforms.uTime.value = time;
      if (t >= 1) { it.m.visible = false; this.pool.push(it.m); this.items.splice(i, 1); i--; continue; }
      this._apply(it, t);
    }
  }
  clear() { for (const it of this.items) { it.m.visible = false; this.pool.push(it.m); } this.items.length = 0; }
}

// ------------------------------------------------------------- decals
function decalTexture(kind) {
  const N = 32, d = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = (x + 0.5) / N * 2 - 1, v = (y + 0.5) / N * 2 - 1, r = Math.hypot(u, v), i = (y * N + x) * 4;
    let a = 0, l = 0;
    const n = hash3(x >> 1, y >> 1, kind.length);
    if (kind === 'scorch') { a = r < 0.95 ? Math.min(1, (0.95 - r) * 2.2) * (0.6 + n * 0.4) : 0; l = 20; }
    else if (kind === 'crack') { const ang = Math.atan2(v, u); const s = Math.abs(Math.sin(ang * 3.5 + r * 2.0)); a = r < 0.95 && (s < 0.12 || r < 0.25) ? 0.9 : 0; l = 30; }
    else if (kind === 'puddle') { const rr = r + (n - 0.5) * 0.15; a = rr < 0.85 ? 0.55 : 0; l = 200; }
    else if (kind === 'crater') { a = r < 0.95 ? (r > 0.7 ? 0.85 : 0.5) * (0.7 + n * 0.3) : 0; l = r > 0.7 ? 60 : 35; }
    else if (kind === 'glyph') { a = (r > 0.82 && r < 0.95) || (r > 0.5 && r < 0.56) || (Math.abs(u) < 0.04 && r < 0.82) || (Math.abs(v) < 0.04 && r < 0.82) ? 1 : 0; l = 255; }
    d[i] = d[i + 1] = d[i + 2] = l; d[i + 3] = Math.round(a * 255);
  }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat); t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return t;
}
class Decals {
  constructor(max = 40) {
    this.group = new THREE.Group();
    this.tex = {};
    this.items = [];
    this.max = max;
    this.geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  }
  spawn(kind, pos, size, color = 0xffffff, life = 8, glow = false) {
    if (!this.tex[kind]) this.tex[kind] = decalTexture(kind);
    const mat = new THREE.MeshBasicMaterial({ map: this.tex[kind], transparent: true, depthWrite: false, color, polygonOffset: true, polygonOffsetFactor: -2, toneMapped: !glow, blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending });
    const m = new THREE.Mesh(this.geo, mat);
    m.position.set(pos[0], pos[1] + 0.02, pos[2]); m.scale.set(size, 1, size); m.rotation.y = Math.random() * TAU; m.renderOrder = 5;
    this.group.add(m);
    this.items.push({ m, age: 0, life });
    if (this.items.length > this.max) { const o = this.items.shift(); this.group.remove(o.m); o.m.material.dispose(); }
  }
  update(dt) {
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i]; it.age += dt;
      if (it.age >= it.life) { this.group.remove(it.m); it.m.material.dispose(); this.items.splice(i, 1); i--; continue; }
      it.m.material.opacity = Math.min(1, (it.life - it.age) / 1.5);
    }
  }
  clear() { for (const it of this.items) { this.group.remove(it.m); it.m.material.dispose(); } this.items.length = 0; }
}

// ------------------------------------------------------------- facade
export class FX {
  constructor() {
    this.atlas = buildAtlas();
    this.add = new ParticleLayer(this.atlas, 2600, true);
    this.alpha = new ParticleLayer(this.atlas, 1600, false);
    this.debris = new Debris(700);
    this.shapes = new ShapeFX();
    this.decals = new Decals();
    this.group = new THREE.Group();
    this.group.add(this.add.mesh, this.alpha.mesh, this.debris.mesh, this.shapes.group, this.decals.group);
    this.time = 0;
  }
  particle(o) { return (o.additive === false ? this.alpha : this.add).spawn(o); }
  burst(n, f) { for (let i = 0; i < n; i++) this.particle(f(i)); }
  shape(o) { this.shapes.spawn(o); }
  decal(kind, pos, size, color, life, glow) { this.decals.spawn(kind, pos, size, color, life, glow); }
  // shatter a voxel-ish volume into flying cubes
  shatter(pos, { count = 24, size = 0.12, colors = [0x888888], force = 5, spread = 0.5, up = 4, life = 2.6 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU, r = Math.random() * spread;
      const p = [pos[0] + Math.cos(a) * r, pos[1] + Math.random() * spread, pos[2] + Math.sin(a) * r];
      const v = [Math.cos(a) * force * (0.4 + Math.random() * 0.8), up * (0.6 + Math.random() * 0.8), Math.sin(a) * force * (0.4 + Math.random() * 0.8)];
      this.debris.spawn(p, v, size * (0.6 + Math.random() * 0.8), colors[i % colors.length], life * (0.7 + Math.random() * 0.5));
    }
  }
  update(dt, camera) {
    this.time += dt;
    this.add.update(dt, camera); this.alpha.update(dt, camera);
    this.debris.update(dt); this.shapes.update(dt, this.time); this.decals.update(dt);
  }
  clear() { this.add.clear(); this.alpha.clear(); this.debris.clear(); this.shapes.clear(); this.decals.clear(); }
  get count() { return this.add.n + this.alpha.n + this.debris.items.length; }
}
