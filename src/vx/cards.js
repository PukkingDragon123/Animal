// 2D in the 3D world: hand-painted pixel-art cards (HD-2D style) living among the
// voxels — leaf clumps on voxel branches, bamboo, ferns, tall grass, flowers,
// paper lanterns, pennants, laundry. Cards are alpha-tested quads drawn with
// instancing. Most are billboards: they turn to face the camera every frame (the
// sun's shadow pass sees the same quads, so shadows match), sway in the wind and
// are lit as soft rounded masses. Texel density is ~20–24 px per metre — two to
// three texels per voxel — so the paint reads finer than the voxels but stays
// pixel art.
import * as THREE from '../../vendor/three.module.js';
import { Pen, shift, newSurf } from '../px/paint.js';

// ------------------------------------------------------------ sprite registry + atlas
const REG = [], BY = new Map(), AW = 1024, AH = 1024;
let shelf = { x: 1, y: 1, h: 0 };
function hashStr(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
// register a sprite painted by fn(p, w, h); ppm = texels per metre
export function sprite(name, w, h, fn, o = {}) {
  if (BY.has(name)) return BY.get(name);
  const s = newSurf(w, h), p = new Pen(s, o.seed || hashStr(name)); fn(p, w, h);
  if (shelf.x + w + 1 > AW) shelf = { x: 1, y: shelf.y + shelf.h + 1, h: 0 };
  const e = { name, w, h, ppm: o.ppm || 22, s, ax: shelf.x, ay: shelf.y, night: -1 };
  shelf.x += w + 1; shelf.h = Math.max(shelf.h, h);
  REG.push(e); BY.set(name, REG.length - 1); dirty = true; return REG.length - 1;
}
let ATLAS = null, dirty = true;
function atlas() {
  if (!ATLAS) {
    const surf = newSurf(AW, AH), t = new THREE.CanvasTexture(surf.canvas());
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = true;
    ATLAS = { surf, tex: t, done: 0 };
  }
  if (dirty) {
    const a = ATLAS.surf;
    for (let i = ATLAS.done; i < REG.length; i++) { const e = REG[i]; for (let y = 0; y < e.h; y++) for (let x = 0; x < e.w; x++) a.data[(e.ay + y) * AW + e.ax + x] = e.s.data[y * e.w + x]; }
    ATLAS.done = REG.length; a.touch && a.touch(); ATLAS.tex.image = a.canvas(); ATLAS.tex.needsUpdate = true; dirty = false;
  }
  return ATLAS;
}
export const uvOf = (i) => { const e = REG[i]; return [e.ax / AW, 1 - (e.ay + e.h) / AH, (e.ax + e.w) / AW, 1 - e.ay / AH]; };
export const spriteInfo = (i) => REG[i];
export const atlasTexture = () => atlas().tex;
// camera-facing basis shared by every billboard on a stage (updated each frame)
const UP0 = new THREE.Vector3(0, 1, 0);
export function camUniforms(stage) {
  if (!stage.cardU) {
    stage.cardU = { uRight: { value: new THREE.Vector3(1, 0, 0) }, uUp: { value: new THREE.Vector3(0, 1, 0) }, uN: { value: new THREE.Vector3(0, 0.6, 0.8) }, uWind: { value: 0 } };
    stage.hooks.push((st) => {
      const e = st.cam.matrixWorld.elements, u = st.cardU;
      u.uRight.value.set(e[0], e[1], e[2]); u.uUp.value.set(e[4], e[5], e[6]);
      u.uN.value.set(e[8], e[9], e[10]).multiplyScalar(0.75).addScaledVector(UP0, 0.7).normalize();
      u.uWind.value = st.time || 0;
    });
  }
  return stage.cardU;
}

// ------------------------------------------------------------ painters
// one leaf: a lens along angle `ang`, lit from the upper left, with a darker midrib on big ones
function leaf(p, cx, cy, len, wid, ang, c) {
  const ca = Math.cos(ang), sa = Math.sin(ang), hi = shift(c, 0.38), lo = shift(c, -0.3), rib = shift(c, -0.45);
  for (let t = -len; t <= len; t += 0.5) for (let u = -wid; u <= wid; u += 0.5) {
    const k = 1 - (t / len) ** 2; if (Math.abs(u) > wid * k + 0.25) continue;
    const x = Math.round(cx + ca * t - sa * u), y = Math.round(cy + sa * t + ca * u);
    const l = -(ca * t - sa * u) * 0.5 - (sa * t + ca * u) * 0.7 + (u < 0 ? 0.6 : -0.4);
    p.px(x, y, len > 3.5 && Math.abs(u) < 0.3 && Math.abs(t) < len - 1 ? rib : l > 1.2 ? hi : l < -1.2 ? lo : c);
  }
}
// a rounded clump of leaves: shadowed core, body, sunlit upper-left, a few sparkles
function clump(p, W, H, base, o = {}) {
  const n = o.n || Math.round((W * H) / 16), cx = W / 2 - 0.5, cy = H / 2, rx = W / 2 - (o.pad ?? 3), ry = H / 2 - (o.pad ?? 3);
  const L = o.len || [2.5, 4], Wd = o.wid || [1.2, 1.9];
  const at = () => { for (;;) { const x = p.rand(-1, 1), y = p.rand(-1, 1); if (x * x + y * y <= 1) return [x, y]; } };
  const passes = [[1.0, -0.5, -9], [0.85, -0.12, -0.35], [0.5, 0.3, 0.25], [0.18, 0.62, 0.55]];
  for (const [frac, tone, minLit] of passes) for (let k = 0; k < n * frac; k++) {
    const [nx, ny] = at(), lit = -0.6 * nx - 0.8 * ny;
    if (lit < minLit) continue;
    const ang = o.droop ? Math.PI / 2 + p.rand(-0.9, 0.9) : p.rand(0, Math.PI * 2);
    leaf(p, cx + nx * rx, cy + ny * ry, p.rand(L[0], L[1]), p.rand(Wd[0], Wd[1]), ang, shift(base, tone + p.rand(-0.1, 0.1)));
  }
  for (let k = 0; k < n * 0.12; k++) { const [nx, ny] = at(); if (-0.6 * nx - 0.8 * ny > 0.2) p.px(Math.round(cx + nx * rx), Math.round(cy + ny * ry), shift(base, 0.95)); }
}
function blossomClump(p, W, H, petal) {
  clump(p, W, H, '#4e7e36', { n: Math.round((W * H) / 30) });
  const cx = W / 2, cy = H / 2, rx = W / 2 - 3, ry = H / 2 - 3;
  for (let k = 0; k < (W * H) / 18; k++) {
    const a = p.rand(0, 6.283), r = Math.sqrt(p.r()), x = Math.round(cx + Math.cos(a) * r * rx), y = Math.round(cy + Math.sin(a) * r * ry), lit = -Math.cos(a) * 0.6 - Math.sin(a) * 0.8;
    const c = shift(petal, lit * r * 0.35 + p.rand(-0.12, 0.12));
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) p.px(x + dx, y + dy, c);
    p.px(x, y, lit > 0 ? '#fff4c0' : shift(petal, -0.35));
  }
}
function bamboo(p, W, H) {
  const stems = [[W * 0.42, -0.08], [W * 0.58, 0.1], [W * 0.5, 0.02]];
  for (const [x0, lean] of stems) for (let y = H - 1; y > 6; y--) { const x = Math.round(x0 + (H - y) * lean); p.px(x, y, (H - y) % 7 === 0 ? '#c8c060' : '#7a9a3a'); p.px(x + 1, y, (H - y) % 7 === 0 ? '#a8a040' : '#56782a'); }
  for (let k = 0; k < 46; k++) {
    const y = p.rand(2, H * 0.7), x = W / 2 + p.rand(-W * 0.42, W * 0.42) * (0.4 + (1 - y / H) * 0.6), ang = (x < W / 2 ? Math.PI * 0.8 : Math.PI * 0.2) + p.rand(-0.5, 0.5);
    leaf(p, x, y, p.rand(3, 5), 0.9, ang, shift('#5a8a34', (y < H * 0.3 ? 0.3 : -0.1) + p.rand(-0.15, 0.15)));
  }
}
function fern(p, W, H, c = '#3e7a30') {
  for (let f = 0; f < 7; f++) {
    const a = -Math.PI / 2 + (f - 3) * 0.36 + p.rand(-0.1, 0.1), len = H * p.rand(0.75, 0.95);
    for (let j = 0; j < len; j++) {
      const x = Math.round(W / 2 + Math.cos(a) * j), y = Math.round(H - 1 + Math.sin(a) * j + (j * j) / (len * 2.2));
      p.px(x, y, shift(c, -0.4));
      if (j > 2 && j % 2 === 0) { const w = Math.max(1, Math.round((1 - j / len) * 3.4)); for (let s = 1; s <= w; s++) { p.px(x - s, y + 1 - (s >> 1), shift(c, 0.2 - s * 0.05)); p.px(x + s, y + 1 - (s >> 1), shift(c, -0.15)); } }
    }
  }
}
function tallGrass(p, W, H, c = '#6a9a3e') {
  for (let k = 0; k < W * 1.1; k++) {
    const x0 = p.rand(2, W - 3), h = p.rand(H * 0.45, H), lean = p.rand(-0.35, 0.35), tone = p.rand(-0.25, 0.25);
    for (let j = 0; j < h; j++) { const x = Math.round(x0 + lean * j + (j * j * lean) / (h * 1.5)); p.px(x, H - 1 - j, shift(c, tone + (j / h - 0.55) * 0.8)); }
  }
}
function flowers(p, W, H, col) {
  tallGrass(p, W, H, '#5a8e3a');
  for (let k = 0; k < W / 3.2; k++) {
    const x = p.ri(2, W - 3), y = p.ri(1, Math.round(H * 0.55));
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) p.px(x + dx, y + dy, shift(col, (dx < 0 || dy < 0 ? 0.25 : -0.15) + p.rand(-0.1, 0.1)));
    p.px(x, y, '#ffe680');
  }
}
// round paper lantern: gold caps, ribbed red body, tassel; `lit` paints the glowing night version
function lantern(p, W, H, c, lit) {
  const cx = (W - 1) / 2, top = 2, bot = H - 4, cy = (top + bot) / 2, ry = (bot - top) / 2 + 0.5, rx = W / 2;
  p.rect(Math.round(cx) - 1, 0, 3, 1, '#2a2020');
  for (let y = top; y <= bot; y++) for (let x = 0; x < W; x++) {
    const u = (x - cx) / rx, v = (y - cy) / ry, d = u * u + v * v; if (d > 1) continue;
    const rib = (y - top) % 3 === 0 && y !== top;
    let col;
    if (lit) { const g = 1 - Math.sqrt(d); col = rib ? shift(c, -0.25 + g * 0.3) : g > 0.62 ? '#fff0b8' : g > 0.42 ? '#ffc070' : g > 0.2 ? shift(c, 0.45) : c; }
    else { const l = -u * 0.65 - v * 0.6; col = rib ? shift(c, -0.5) : l > 0.55 ? shift(c, 0.55) : l > 0.05 ? c : l > -0.5 ? shift(c, -0.25) : shift(c, -0.5); }
    p.px(x, y, col);
  }
  const gold = lit ? '#ffd860' : '#d8a830', goldD = lit ? '#e0a830' : '#9a7020';
  p.rect(Math.round(cx) - 2, top - 1, 5, 2, gold); p.px(Math.round(cx) + 2, top, goldD);
  p.rect(Math.round(cx) - 2, bot, 5, 2, gold); p.px(Math.round(cx) + 2, bot + 1, goldD);
  for (let y = bot + 2; y < H; y++) { p.px(Math.round(cx), y, lit ? '#ffe070' : '#e8b830'); if (y > bot + 2) p.px(Math.round(cx) - 1 + ((y & 1) * 2), y, goldD); }
}
function pennant(p, W, H, c) { for (let y = 0; y < H; y++) { const w = Math.round((W * (H - y)) / H); for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? shift(c, -0.4) : x < 1 ? shift(c, 0.3) : c); } }
function shirt(p, W, H, c) {
  const S = shift(c, -0.3), L = shift(c, 0.25);
  p.rect(0, 1, W, 3, c); p.rect(2, 1, W - 4, H - 1, c);                // sleeves + body
  for (let y = 1; y < H; y++) { p.px(2, y, L); p.px(W - 3, y, S); }
  p.rect(Math.round(W / 2) - 2, 0, 4, 2, S); p.px(Math.round(W / 2) - 1, 2, S); p.px(Math.round(W / 2), 2, S);   // collar
  p.hl(2, W - 3, H - 1, S); p.px(0, 3, S); p.px(W - 1, 3, S);
  p.rect(Math.round(W / 2) - 1, 0, 2, 1, '#e8e4dc');                    // pegs
}
function towel(p, W, H, c, stripe) { p.rect(0, 0, W, H, c); for (let x = 0; x < W; x++) { p.px(x, 2, stripe); p.px(x, H - 3, stripe); } p.vl(0, 0, H - 1, shift(c, 0.25)); p.vl(W - 1, 0, H - 1, shift(c, -0.3)); for (let x = 0; x < W; x += 2) p.px(x, H - 1, shift(c, -0.2)); }
function pants(p, W, H, c) { p.rect(0, 0, W, 3, c); p.rect(0, 3, Math.floor(W / 2) - 0, H - 3, c); p.rect(Math.ceil(W / 2), 3, Math.floor(W / 2), H - 3, c); p.hl(0, W - 1, 0, shift(c, -0.35)); p.vl(0, 0, H - 1, shift(c, 0.2)); p.vl(W - 1, 0, H - 1, shift(c, -0.3)); p.vl(Math.floor(W / 2) - 1, 4, H - 1, shift(c, -0.3)); }

// ------------------------------------------------------------ the standard set
export const SPR = {};
const tones = (key, W, H, base, o = {}) => ({
  hi: [0, 1].map((i) => sprite(`${key}-hi${i}`, W, H, (p) => clump(p, W, H, shift(base, 0.22), o), { ppm: o.ppm || 20 })),
  mid: [0, 1, 2].map((i) => sprite(`${key}-mid${i}`, W, H, (p) => clump(p, W, H, base, o), { ppm: o.ppm || 20 })),
  lo: [0, 1].map((i) => sprite(`${key}-lo${i}`, W, H, (p) => clump(p, W, H, shift(base, -0.3), o), { ppm: o.ppm || 20 })),
});
export function paintAll() {
  if (SPR.ready) return SPR;
  SPR.leaf = tones('leaf', 40, 34, '#4f8a36');                 // plane / ficus street trees
  SPR.oak = tones('oak', 44, 36, '#40702e', { len: [3, 4.5] });
  SPR.euc = tones('euc', 36, 40, '#6a9a80', { droop: true, len: [3.5, 5], wid: [0.9, 1.3] });
  SPR.cypress = tones('cyp', 52, 22, '#2f5a34', { n: 90, len: [2, 3], wid: [1, 1.5], pad: 2 });
  SPR.ginkgo = tones('ginkgo', 36, 32, '#d6b43a', { len: [2.5, 3.5], wid: [1.6, 2.2] });
  SPR.bloom = { hi: [sprite('bloom0', 40, 34, (p) => blossomClump(p, 40, 34, '#f6b8cc'), { ppm: 20 })], mid: [sprite('bloom1', 40, 34, (p) => blossomClump(p, 40, 34, '#f0a0bc'), { ppm: 20 }), sprite('bloom2', 40, 34, (p) => blossomClump(p, 40, 34, '#ec96b4'), { ppm: 20 })], lo: [sprite('bloom3', 40, 34, (p) => blossomClump(p, 40, 34, '#d07898'), { ppm: 20 })] };
  SPR.bamboo = [0, 1].map((i) => sprite('bamboo' + i, 24, 44, (p) => bamboo(p, 24, 44), { ppm: 22 }));
  SPR.fern = [0, 1].map((i) => sprite('fern' + i, 30, 20, (p) => fern(p, 30, 20), { ppm: 24 }));
  SPR.grass = [0, 1, 2].map((i) => sprite('tgrass' + i, 26, 14, (p) => tallGrass(p, 26, 14), { ppm: 24 }));
  SPR.dryGrass = [0, 1].map((i) => sprite('dgrass' + i, 26, 14, (p) => tallGrass(p, 26, 14, '#a8a056'), { ppm: 24 }));
  SPR.flowers = ['#ff5a6a', '#ffd84a', '#b88aff', '#f4f0f0', '#ff9a3a'].map((c, i) => sprite('flw' + i, 22, 12, (p) => flowers(p, 22, 12, c), { ppm: 24 }));
  const lan = (name, W, H, c) => { const d = sprite(name, W, H, (p) => lantern(p, W, H, c, false), { ppm: 22 }), n = sprite(name + '-lit', W, H, (p) => lantern(p, W, H, c, true), { ppm: 22 }); REG[d].night = n; return d; };
  SPR.lantern = [lan('lantern', 11, 15, '#d8343a'), lan('lanternO', 11, 15, '#e86a2a')];
  SPR.lanternBig = [lan('lanternBig', 17, 22, '#d02e36'), lan('lanternBigY', 17, 22, '#e8b03a')];
  SPR.pennant = ['#d8343a', '#f0c030', '#3a8a5a', '#3a6ac8', '#f4f0e8'].map((c, i) => sprite('pen' + i, 5, 7, (p) => pennant(p, 5, 7, c), { ppm: 22 }));
  const cloth = ['#e8e4dc', '#3a6ab0', '#c84848', '#f0c840', '#5a9a6a', '#e890b0', '#2e2e38', '#8a6ab4'];
  SPR.laundry = [
    ...cloth.slice(0, 6).map((c, i) => sprite('shirt' + i, 13, 12, (p) => shirt(p, 13, 12, c), { ppm: 22 })),
    ...cloth.slice(2, 7).map((c, i) => sprite('towel' + i, 8, 14, (p) => towel(p, 8, 14, c, cloth[(i + 5) % cloth.length]), { ppm: 22 })),
    ...['#3a4a6a', '#5a5048', '#2e2e38'].map((c, i) => sprite('pants' + i, 9, 16, (p) => pants(p, 9, 16, c), { ppm: 22 })),
  ];
  SPR.ready = true; return SPR;
}
const pick = (arr, r) => arr[Math.floor(r * arr.length) % arr.length];
export { pick };

// ------------------------------------------------------------ batches
export class Cards {
  constructor() { this.list = []; }
  // add a card at world position (metres). o: { scale, rot, mode: 'bb' (billboard) | 'fix' (vertical, yaw = rot) | 'cross' | 'flat', hang (anchored at its top), glow, sway }
  add(spr, x, y, z, o = {}) { this.list.push({ spr, x, y, z, scale: o.scale ?? 1, rot: o.rot ?? 0, mode: o.mode || 'bb', hang: !!o.hang, glow: !!o.glow, sway: o.sway ?? 1 }); return this; }
  build(stage) {
    paintAll();
    const night = stage.moodName === 'night', groups = new Map();
    for (const c of this.list) {
      const spr = c.glow && night && REG[c.spr].night >= 0 ? REG[c.spr].night : c.spr;
      const bb = c.mode === 'bb', key = (c.glow && night ? 'glow' : 'lit') + (bb ? '-bb' : '-fx') + (c.hang ? '-hang' : '');
      if (!groups.has(key)) groups.set(key, []);
      const e = REG[spr], w = (e.w / e.ppm) * c.scale, h = (e.h / e.ppm) * c.scale;
      if (c.mode === 'cross') { groups.get(key).push({ ...c, spr, w, h, yaw: c.rot + Math.PI / 4 }, { ...c, spr, w, h, yaw: c.rot - Math.PI / 4 }); }
      else groups.get(key).push({ ...c, spr, w, h, yaw: c.rot });
    }
    const A = atlas(), out = new THREE.Group(), U = camUniforms(stage);
    for (const [key, list] of groups) {
      const glow = key.startsWith('glow'), bb = key.includes('-bb'), hang = key.includes('-hang');
      const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, hang ? -0.5 : 0.5, 0);
      if (!bb) { const n = geo.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 0.55, 0.83); }
      const uvr = new Float32Array(list.length * 4), sw = new Float32Array(list.length);
      list.forEach((q, i) => { uvr.set(uvOf(q.spr), i * 4); sw[i] = q.sway; });
      geo.setAttribute('uvRect', new THREE.InstancedBufferAttribute(uvr, 4));
      geo.setAttribute('sway', new THREE.InstancedBufferAttribute(sw, 1));
      const mat = glow ? new THREE.MeshBasicMaterial({ map: A.tex, alphaTest: 0.5, side: THREE.DoubleSide, toneMapped: false })
        : new THREE.MeshLambertMaterial({ map: A.tex, alphaTest: 0.5, side: THREE.DoubleSide });
      if (glow) mat.color.setScalar(1.15);
      const patch = (sh) => {
        Object.assign(sh.uniforms, U);
        let vs = 'attribute vec4 uvRect;\nattribute float sway;\nuniform vec3 uRight;\nuniform vec3 uUp;\nuniform vec3 uN;\nuniform float uWind;\n' + sh.vertexShader;
        vs = vs.replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = vec2(mix(uvRect.x, uvRect.z, uv.x), mix(uvRect.y, uvRect.w, uv.y));\n#endif');
        const swayGLSL = `vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          float sw = (sin(uWind * 1.7 + ip.x * 0.9 + ip.z * 0.6) * 0.05 + sin(uWind * 2.9 + ip.y * 1.3 + ip.x) * 0.02) * sway;
          ${hang ? 'transformed.x += sw * -position.y * 1.4;' : 'transformed.x += sw * position.y;'}`;
        if (bb) {
          vs = vs.replace('#include <begin_vertex>', `#include <begin_vertex>\n{ ${swayGLSL} }\nvec2 bbOff = (mat3(instanceMatrix) * transformed).xy;\nvec3 bbWorld = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]) + uRight * bbOff.x + uUp * bbOff.y;`)
            .replace('#include <project_vertex>', 'vec4 mvPosition = modelViewMatrix * vec4(bbWorld, 1.0);\ngl_Position = projectionMatrix * mvPosition;')
            .replace('#include <worldpos_vertex>', 'vec4 worldPosition = modelMatrix * vec4(bbWorld, 1.0);')
            .replace('#include <defaultnormal_vertex>', 'vec3 transformedNormal = normalize((viewMatrix * vec4(uN, 0.0)).xyz);');
        } else vs = vs.replace('#include <begin_vertex>', `#include <begin_vertex>\n{ ${swayGLSL} }`);
        sh.vertexShader = vs;
      };
      mat.onBeforeCompile = patch; mat.customProgramCacheKey = () => 'cards-' + key;
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
      list.forEach((q, i) => {
        if (bb) e.set(0, 0, q.rot, 'XYZ'); else if (q.mode === 'flat') e.set(-Math.PI / 2, q.yaw, 0, 'YXZ'); else e.set(0, q.yaw, 0, 'YXZ');
        q4.setFromEuler(e); sc.set(q.w, q.h, 1); ps.set(q.x, q.y, q.z); m4.compose(ps, q4, sc); mesh.setMatrixAt(i, m4);
      });
      mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false;
      if (!glow) {
        mesh.castShadow = true; mesh.receiveShadow = true;
        const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: A.tex, alphaTest: 0.5, side: THREE.DoubleSide });
        dm.onBeforeCompile = patch; dm.customProgramCacheKey = () => 'cards-depth-' + key;
        mesh.customDepthMaterial = dm;
      }
      out.add(mesh);
    }
    stage.scene.add(out);
    return out;
  }
}
