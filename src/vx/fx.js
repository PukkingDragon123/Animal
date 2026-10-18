// Particle effects for creatures and battles: fire, flame breath, embers, smoke,
// steam, tears, sweat, anger marks, music notes, stars, Zzz, bubbles, feathers,
// hit sparks. Pixel-art sprites on camera-facing quads, simulated on the CPU.
// Glowing kinds are unlit and bright enough to bloom; everything fades out by
// dissolving pixels (an ordered dither), so it stays crisp pixel art all the way.
import * as THREE from '../../vendor/three.module.js';
import { sprite, uvOf, spriteInfo, atlasTexture, camUniforms } from './cards.js';
import { shift } from '../px/paint.js';

// ------------------------------------------------------------ sprites
function flame(p, W, H, f) {
  const cx = (W - 1) / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = y / (H - 1);                                  // 0 top → 1 bottom
    const sway = Math.sin(v * 5 + f * 1.7) * (1 - v) * 2.2;
    const half = (v < 0.62 ? Math.pow(v / 0.62, 0.8) : Math.sqrt(Math.max(0, 1 - ((v - 0.62) / 0.38) ** 2))) * (W / 2 - 0.5);
    const d = Math.abs(x - cx - sway) / Math.max(0.5, half);
    if (d > 1) continue;
    const core = d < 0.38 && v > 0.45, mid = d < 0.66 && v > 0.25;
    p.px(x, y, core ? (v > 0.72 ? '#ffffff' : '#fff6c0') : mid ? '#ffd040' : v < 0.3 ? '#e8401e' : '#ff7a1e');
  }
  for (let k = 0; k < 3; k++) { const x = Math.round(cx + Math.sin(f * 3 + k * 2) * (W / 3)), y = Math.round(2 + k * 2 + f % 2); p.px(x, y, '#ff9a2a'); }
}
function puff(p, W, H, c) {
  const cx = W / 2 - 0.5, cy = H / 2 - 0.5;
  const blobs = [[0, 0, 0.5], [-0.22, 0.12, 0.34], [0.24, 0.1, 0.32], [0.05, -0.2, 0.32]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let inside = -1, lit = 0;
    for (const [bx, by, br] of blobs) { const dx = (x - cx) / W - bx, dy = (y - cy) / H - by, d = Math.hypot(dx, dy) / br; if (d < 1) { inside = Math.max(inside, 1 - d); lit = Math.max(lit, (-dx - dy) / br); } }
    if (inside < 0) continue;
    if (inside < 0.12 && (x + y) % 2) continue;
    p.px(x, y, lit > 0.45 ? shift(c, 0.35) : lit > -0.1 ? c : shift(c, -0.3));
  }
}
function drop(p, W, H, c) {
  const cx = (W - 1) / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = y / (H - 1), half = (v < 0.45 ? v / 0.45 * 0.75 : Math.sqrt(Math.max(0, 1 - ((v - 0.6) / 0.4) ** 2))) * (W / 2);
    const d = Math.abs(x - cx); if (d > half) continue;
    p.px(x, y, d > half - 1 || v > 0.92 ? shift(c, -0.45) : (x < cx && v > 0.45 && v < 0.7) ? '#ffffff' : c);
  }
}
function anger(p, W, H) {
  const c = '#e8283a', d = '#8a0e1e', m = Math.floor(W / 2);
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) for (let t = 0; t < 5; t++) {
    const a = t / 4, x = m + sx * Math.round(1.5 + Math.cos(a * Math.PI / 2) * 3.5), y = m + sy * Math.round(1.5 + Math.sin(a * Math.PI / 2) * 3.5);
    p.px(x, y, c); p.px(x + sx, y, c); p.px(x + sx, y + sy, d);
  }
}
function note(p, W, H, c) {
  p.rect(1, H - 4, 4, 3, c); p.px(0, H - 3, c); p.px(5, H - 3, shift(c, -0.3)); p.vl(4, 1, H - 4, c); p.rect(5, 1, 2, 2, c); p.px(7, 3, c); p.px(7, 4, c); p.px(2, H - 4, shift(c, 0.5));
}
function star(p, W, H, c) {
  const cx = (W - 1) / 2, cy = (H - 1) / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - cx, dy = y - cy, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy), R = (W / 2) * (0.55 + 0.45 * Math.abs(Math.cos(a * 2.5 + Math.PI / 4)) ** 3);
    if (r > R) continue; p.px(x, y, r > R - 1 ? shift(c, -0.4) : dx + dy < -1 ? shift(c, 0.4) : c);
  }
}
function spark(p, W, H) {
  const c = (W - 1) / 2;
  for (let i = 0; i < W; i++) { const d = Math.abs(i - c) / c; const col = d < 0.25 ? '#ffffff' : d < 0.6 ? '#fff0a0' : '#ffb040'; p.px(i, Math.round(c), col); p.px(Math.round(c), i, col); }
  for (let k = -2; k <= 2; k++) { p.px(Math.round(c) + k, Math.round(c) + k, Math.abs(k) < 2 ? '#ffffff' : '#fff0a0'); p.px(Math.round(c) + k, Math.round(c) - k, Math.abs(k) < 2 ? '#ffffff' : '#fff0a0'); }
}
function bubble(p, W, H) {
  const c = (W - 1) / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - c, y - c); if (d > c + 0.3) continue;
    if (d > c - 1) p.px(x, y, x + y < W - 2 ? '#e8fbff' : '#7ac8e8');
    else if (Math.hypot(x - c * 0.55, y - c * 0.55) < 1.6) p.px(x, y, '#ffffff');
    else if ((x + y) % 4 === 0 && d > c - 2.2) p.px(x, y, '#bfefff');
  }
}
function letterZ(p, W, H, c) { p.hl(0, W - 1, 0, c); p.hl(0, W - 1, H - 1, c); for (let i = 1; i < H - 1; i++) p.px(Math.round(W - 1 - (i * (W - 1)) / (H - 1)), i, c); p.px(W - 1, 1, shift(c, -0.3)); }
function feather(p, W, H, c) { for (let y = 0; y < H; y++) { const w = Math.round(Math.sin((y / (H - 1)) * Math.PI) * (W / 2)); for (let x = -w; x <= w; x++) p.px(Math.floor(W / 2) + x, y, x === 0 ? shift(c, -0.4) : x < 0 ? shift(c, 0.25) : c); } }
function ring(p, W, H, c) { const m = (W - 1) / 2; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - m, y - m); if (d < m + 0.2 && d > m - 2.2) p.px(x, y, d > m - 1 ? c : shift(c, 0.5)); } }

let S = null;
export function fxSprites() {
  if (S) return S;
  S = {
    flame: [0, 1, 2, 3].map((f) => sprite('fx-flame' + f, 12, 18, (p) => flame(p, 12, 18, f), { ppm: 40 })),
    ember: [sprite('fx-ember', 3, 3, (p) => { p.px(1, 0, '#ffd040'); p.px(0, 1, '#ffd040'); p.px(1, 1, '#ffffff'); p.px(2, 1, '#ffb030'); p.px(1, 2, '#ff8a20'); }, { ppm: 40 })],
    smoke: [0, 1].map((i) => sprite('fx-smoke' + i, 16, 14, (p) => puff(p, 16, 14, '#6a6070'), { ppm: 40 })),
    steam: [0, 1].map((i) => sprite('fx-steam' + i, 14, 12, (p) => puff(p, 14, 12, '#f2f0f4'), { ppm: 40 })),
    tear: [sprite('fx-tear', 5, 8, (p) => drop(p, 5, 8, '#7ad8ff'), { ppm: 40 })],
    sweat: [sprite('fx-sweat', 7, 10, (p) => drop(p, 7, 10, '#a8e8ff'), { ppm: 40 })],
    anger: [sprite('fx-anger', 13, 13, (p) => anger(p, 13, 13), { ppm: 40 })],
    note: ['#2e2a3a', '#e84a8a', '#3a7ae8'].map((c, i) => sprite('fx-note' + i, 8, 12, (p) => note(p, 8, 12, c), { ppm: 40 })),
    star: [sprite('fx-star', 9, 9, (p) => star(p, 9, 9, '#ffd84a'), { ppm: 40 })],
    spark: [sprite('fx-spark', 11, 11, (p) => spark(p, 11, 11), { ppm: 40 })],
    bubble: [sprite('fx-bubble', 12, 12, (p) => bubble(p, 12, 12), { ppm: 40 })],
    z: [sprite('fx-z', 7, 7, (p) => letterZ(p, 7, 7, '#e8f0ff'), { ppm: 40 })],
    feather: ['#e84a2a', '#ffb040'].map((c, i) => sprite('fx-feather' + i, 5, 9, (p) => feather(p, 5, 9, c), { ppm: 40 })),
    ring: [sprite('fx-ring', 32, 32, (p) => ring(p, 32, 32, '#fff4d0'), { ppm: 40 })],
  };
  return S;
}

// ------------------------------------------------------------ presets
// each: sprite set, glow (additive), life, size (m) start→end, speed, gravity, drag, spread, rise, tint ramp, frames per second
const PRE = {
  fire: { spr: 'flame', glow: true, life: [0.35, 0.6], size: [0.14, 0.05], speed: [0.2, 0.6], grav: -1.6, drag: 1.5, spread: 0.6, fps: 14, tint: [[1, 1, 1], [1, 0.75, 0.45], [0.9, 0.3, 0.15]] },
  breath: { spr: 'flame', glow: true, life: [0.38, 0.62], size: [0.1, 0.42], speed: [3.6, 5.2], grav: -0.9, drag: 2.6, spread: 0.22, fps: 16, tint: [[1, 1, 1], [1, 0.8, 0.45], [1, 0.4, 0.15], [0.6, 0.2, 0.1]] },
  ember: { spr: 'ember', glow: true, life: [0.5, 1.0], size: [0.05, 0.03], speed: [0.6, 1.6], grav: -0.8, drag: 0.8, spread: 1, tint: [[1, 1, 1], [1, 0.6, 0.3]] },
  smoke: { spr: 'smoke', life: [0.8, 1.4], size: [0.12, 0.42], speed: [0.2, 0.5], grav: -0.6, drag: 1.2, spread: 0.7, fade: true, spin: 0.6 },
  steam: { spr: 'steam', life: [0.6, 1.1], size: [0.06, 0.2], speed: [0.4, 0.9], grav: -1.2, drag: 1.6, spread: 0.5, fade: true, spin: 0.8 },
  tear: { spr: 'tear', life: [0.5, 0.8], size: [0.06, 0.06], speed: [0.6, 1.4], grav: 7, drag: 0.4, spread: 0.35 },
  sweat: { spr: 'sweat', life: [0.5, 0.7], size: [0.09, 0.08], speed: [0.8, 1.4], grav: 6, drag: 0.4, spread: 0.5 },
  anger: { spr: 'anger', life: [0.7, 0.7], size: [0.0, 0.22], speed: [0, 0], grav: 0, pop: true },
  note: { spr: 'note', life: [1.1, 1.5], size: [0.13, 0.13], speed: [0.4, 0.6], grav: -0.5, drag: 0.6, spread: 0.6, wob: 1.2, fade: true },
  star: { spr: 'star', life: [0.9, 1.2], size: [0.12, 0.08], speed: [0.5, 1.2], grav: 0, drag: 1.2, spread: 1, spin: 4, fade: true },
  spark: { spr: 'spark', glow: true, life: [0.16, 0.26], size: [0.2, 0.42], speed: [0, 0.3], grav: 0, spread: 1, spin: 2 },
  bubble: { spr: 'bubble', life: [1.0, 1.8], size: [0.05, 0.14], speed: [0.3, 0.6], grav: -0.7, drag: 1.0, spread: 0.6, wob: 2.2 },
  z: { spr: 'z', life: [1.4, 1.8], size: [0.07, 0.15], speed: [0.25, 0.35], grav: -0.25, drag: 0.4, spread: 0.3, wob: 0.8, fade: true },
  feather: { spr: 'feather', life: [0.9, 1.4], size: [0.08, 0.08], speed: [1, 2], grav: 1.2, drag: 2.2, spread: 1, flutter: true },
  ring: { spr: 'ring', glow: true, life: [0.22, 0.22], size: [0.1, 0.9], speed: [0, 0], grav: 0, fade: true },
};

const DITHER = `float bayer4(vec2 p) { int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0)); int i = x + y * 4;
  float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
  for (int k = 0; k < 16; k++) if (k == i) return (m[k] + 0.5) / 16.0; return 0.5; }`;
export class FX {
  constructor(stage, max = 1200) {
    fxSprites(); this.stage = stage; this.max = max; this.ps = [];
    const U = camUniforms(stage), tex = atlasTexture();
    const make = (glow) => {
      const g = new THREE.PlaneGeometry(1, 1);
      const at = { iPos: 3, iSize: 2, iUv: 4, iCol: 4, iRot: 1 }, arr = {};
      for (const [k, n] of Object.entries(at)) { arr[k] = new Float32Array(max * n); g.setAttribute(k, new THREE.InstancedBufferAttribute(arr[k], n).setUsage(THREE.DynamicDrawUsage)); }
      const m = new THREE.ShaderMaterial({
        uniforms: { map: { value: tex }, uRight: U.uRight, uUp: U.uUp },
        toneMapped: !glow,
        vertexShader: `attribute vec3 iPos; attribute vec2 iSize; attribute vec4 iUv; attribute vec4 iCol; attribute float iRot;
          uniform vec3 uRight; uniform vec3 uUp; varying vec2 vUv; varying vec4 vCol;
          void main() { vUv = vec2(mix(iUv.x, iUv.z, uv.x), mix(iUv.y, iUv.w, uv.y)); vCol = iCol;
            float c = cos(iRot), s = sin(iRot); vec2 q = vec2(position.x * iSize.x, position.y * iSize.y); q = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
            vec3 w = iPos + uRight * q.x + uUp * q.y; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0); }`,
        fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying vec4 vCol; ${DITHER}
          void main() { vec4 t = texture2D(map, vUv); if (t.a < 0.5) discard; if (vCol.a < bayer4(gl_FragCoord.xy)) discard;
            gl_FragColor = vec4(t.rgb * vCol.rgb, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      });
      const mesh = new THREE.InstancedMesh(g, m, max); mesh.frustumCulled = false; mesh.count = 0; mesh.renderOrder = glow ? 3 : 1;
      stage.scene.add(mesh);
      return { mesh, arr, g };
    };
    this.L = { glow: make(true), solid: make(false) };
    this.carry = new Map();
  }
  // emit particles of `kind` at a world position. o: { n, rate (per second, with dt), dir (Vector3), speed, scale, spread, tint }
  emit(kind, pos, o = {}) {
    const P = PRE[kind]; if (!P) return;
    let n = o.n ?? 0;
    if (o.dt) { const key = kind + (o.key || ''), acc = (this.carry.get(key) || 0) + (o.rate || 30) * o.dt; n = Math.floor(acc); this.carry.set(key, acc - n); }
    else if (!n) n = 1;
    const sc = o.scale || 1, sprs = fxSprites()[P.spr];
    for (let i = 0; i < n && this.ps.length < this.max; i++) {
      const r = () => Math.random(), sp = (P.speed[0] + (P.speed[1] - P.speed[0]) * r()) * (o.speed || 1), spread = o.spread ?? P.spread ?? 0.5;
      let d = o.dir ? o.dir.clone() : new THREE.Vector3(0, 1, 0);
      d.x += (r() - 0.5) * spread * 2; d.y += (r() - 0.5) * spread * 2; d.z += (r() - 0.5) * spread * 2; d.normalize();
      const life = P.life[0] + (P.life[1] - P.life[0]) * r();
      this.ps.push({ P, sprs, x: pos.x, y: pos.y, z: pos.z, vx: d.x * sp, vy: d.y * sp, vz: d.z * sp, age: 0, life, sc: sc * (0.85 + r() * 0.3), rot: P.spin ? r() * 6.28 : 0, spin: (P.spin || 0) * (r() - 0.5) * 2, f0: Math.floor(r() * 8), ph: r() * 6.28, tint: o.tint });
    }
  }
  update(dt) {
    const L = this.L; let ng = 0, ns = 0;
    for (let i = this.ps.length - 1; i >= 0; i--) {
      const q = this.ps[i], P = q.P; q.age += dt;
      if (q.age >= q.life) { this.ps[i] = this.ps[this.ps.length - 1]; this.ps.pop(); continue; }
      const dr = Math.exp(-(P.drag || 0) * dt);
      q.vx *= dr; q.vy = q.vy * dr - (P.grav || 0) * dt; q.vz *= dr;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      if (P.wob) q.x += Math.sin(q.age * 6 + q.ph) * P.wob * 0.12 * dt * 6;
      q.rot += q.spin * dt; if (P.flutter) q.rot = Math.sin(q.age * 7 + q.ph) * 0.8;
    }
    for (const q of this.ps) {
      const P = q.P, k = q.age / q.life, lay = P.glow ? L.glow : L.solid, j = P.glow ? ng++ : ns++;
      const fr = q.sprs[(q.f0 + Math.floor(q.age * (P.fps || 0))) % q.sprs.length], info = spriteInfo(fr), uv = uvOf(fr);
      let s = (P.size[0] + (P.size[1] - P.size[0]) * k) * q.sc;
      if (P.pop) s = P.size[1] * q.sc * Math.min(1, 1.35 * Math.sin(Math.min(1, k * 4) * Math.PI * 0.62)) * (k > 0.85 ? 1 - (k - 0.85) / 0.15 : 1);
      const aspect = info.w / info.h;
      lay.arr.iPos.set([q.x, q.y, q.z], j * 3); lay.arr.iSize.set([s * aspect, s], j * 2); lay.arr.iUv.set(uv, j * 4); lay.arr.iRot[j] = q.rot;
      let c = [1, 1, 1];
      if (P.tint) { const t = k * (P.tint.length - 1), a = Math.floor(t), b = Math.min(P.tint.length - 1, a + 1), f = t - a; c = P.tint[a].map((v, m) => v + (P.tint[b][m] - v) * f); }
      if (q.tint) c = c.map((v, m) => v * q.tint[m]);
      const glowK = P.glow ? 1.08 : 1;
      lay.arr.iCol.set([c[0] * glowK, c[1] * glowK, c[2] * glowK, P.fade ? 1 - k * k : P.glow ? 1 : (k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1)], j * 4);
    }
    for (const [lay, n] of [[L.glow, ng], [L.solid, ns]]) { lay.mesh.count = n; for (const a of Object.values(lay.g.attributes)) if (a.isInstancedBufferAttribute) a.needsUpdate = true; }
  }
  clear() { this.ps.length = 0; }
}
