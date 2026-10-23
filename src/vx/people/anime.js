// People as low-poly anime figures in the PS2/PSP style:
// - tall and slender, with long legs, chunky sneakers and oversized clothes
// - faceted meshes of a few hundred triangles with hand-painted textures (soft baked
//   shading, painted folds, seams, ribbing and prints)
// - chunky hair shells with spiky bangs and an "angel ring" shine
// - a big painted anime face on a front-projected layer that repaints itself for
//   every expression (eye shape, gaze, brows, mouth)
// The rig matches person.js plus shins and forearms (knees and elbows bend), so the
// shared acting clips drive it through the Animator.
import * as THREE from '../../../vendor/three.module.js';
import { acting } from './person.js';

const U = 1 / 16, TAU = Math.PI * 2;
const cl = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- colour
const hx = (c) => { const n = parseInt(c.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(cl(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export function tone(c, k) { const [r, g, b] = hx(c); return k >= 0 ? toHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k) : toHex(r * (1 + k), g * (1 + k), b * (1 + k)); }
export function mixc(a, b, t) { const A = hx(a), B = hx(b); return toHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
const rgba = (c, a) => { const [r, g, b] = hx(c); return `rgba(${r},${g},${b},${a})`; };
const shade = (c, k = 0.3) => mixc(tone(c, -k), '#4a2050', 0.14);              // painted shadow: darker, cooler
const lite = (c, k = 0.25) => mixc(tone(c, k), '#fff4dc', 0.1);                // painted light: lighter, warmer
const rnd = (seed) => { let x = seed >>> 0 || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };

// ---------------------------------------------------------------- canvas textures
function canvas(W, H) { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
function texOf(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; return t; }
function paintTex(W, H, fn) { const c = canvas(W, H), g = c.getContext('2d'); fn(g, W, H); return texOf(c); }
const vgrad = (g, H, stops) => { const gr = g.createLinearGradient(0, 0, 0, H); for (const [t, c] of stops) gr.addColorStop(t, c); return gr; };
// around-the-body shading for a texture whose u wraps (0.5 = front): sides and back darker
function wrapShade(g, W, H, k = 0.22, front = 0.5) {
  const gr = g.createLinearGradient(0, 0, W, 0);
  for (let i = 0; i <= 8; i++) { const u = i / 8, d = Math.abs(((u - front + 1.5) % 1) - 0.5) * 2; gr.addColorStop(u, `rgba(40,16,50,${(d * d * k).toFixed(3)})`); }
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
// soft painterly speckle
function speckle(g, W, H, seed, n = 300, a = 0.05) { const r = rnd(seed); for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(30,10,40,${a})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); } }
// a soft fold stroke
function fold(g, x0, y0, x1, y1, cx, cy, w, c, a = 0.35) { g.strokeStyle = rgba(c, a); g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke(); }

// ---------------------------------------------------------------- geometry
// a tube through rings (horizontal ellipses unless axis 'z': then rings stand in the xy plane, a = 0 on top).
// ring: { c: [x, y, z], rx, rz, v, f?(a) → radius multiplier }. uv.u wraps (0.5 = front / top, seam at the back / bottom).
function tube(rings, n, o = {}) {
  const P = [], UV = [], I = [], W = n + 1;
  rings.forEach((R, j) => {
    for (let i = 0; i <= n; i++) {
      const u = i / n, a = (u - 0.5) * TAU, k = R.f ? R.f(a) : 1, s = Math.sin(a) * R.rx * k, c = Math.cos(a) * R.rz * k;
      if (o.axis === 'z') P.push(R.c[0] + s, R.c[1] + c, R.c[2]); else P.push(R.c[0] + s, R.c[1], R.c[2] + c);
      UV.push(u, R.v ?? j / (rings.length - 1));
    }
  });
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < n; i++) { const a = j * W + i, b = a + 1, c = a + W, d = c + 1; I.push(a, b, d, a, d, c); }
  const cap = (j, flip) => { const base = P.length / 3, R = rings[j]; P.push(...R.c); UV.push(0.5, R.v ?? j / (rings.length - 1)); for (let i = 0; i < n; i++) { const a = j * W + i; if (flip) I.push(base, a + 1, a); else I.push(base, a, a + 1); } };
  if (o.cap0) cap(0, true); if (o.cap1) cap(rings.length - 1, false);
  return finish(P, UV, I, o.wrap !== false ? { W, rows: rings.length } : null);
}
function finish(P, UV, I, seam) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
  g.computeVertexNormals();
  if (seam) { const N = g.attributes.normal; for (let j = 0; j < seam.rows; j++) { const a = j * seam.W, b = a + seam.W - 1; const x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); } }
  return g;
}
// a hair lock / spike: a quadratic bezier from root to tip with a tapering diamond cross-section.
// w: half width at the root, d: half depth; flat: 0..1 (a flat card); tipW: width left at the tip (blunt cuts)
const _t = new THREE.Vector3(), _s = new THREE.Vector3(), _n = new THREE.Vector3(), _up = new THREE.Vector3();
function lock(p0, p1, pc, w, d, o = {}) {
  const segs = o.segs || 4, n = o.sides || 4, rings = [], bez = (t) => [0, 1, 2].map((k) => (1 - t) * (1 - t) * p0[k] + 2 * (1 - t) * t * pc[k] + t * t * p1[k]);
  const P = [], UV = [], I = [], Wn = n + 1;
  for (let j = 0; j <= segs; j++) {
    const t = j / segs, c = bez(t), c2 = bez(Math.min(1, t + 0.02)), c1 = bez(Math.max(0, t - 0.02));
    _t.set(c2[0] - c1[0], c2[1] - c1[1], c2[2] - c1[2]).normalize();
    _up.set(...(o.out || [c[0], 0, c[2] + 0.0001])).normalize();                   // the lock's "outward" side
    _s.crossVectors(_t, _up); if (_s.lengthSq() < 1e-6) _s.set(1, 0, 0); _s.normalize(); _n.crossVectors(_s, _t).normalize();
    const taper = Math.pow(1 - t, o.pow ?? 0.85) * (1 - (o.tipW || 0)) + (o.tipW || 0), ww = w * taper * (o.bulge ? 1 + Math.sin(t * Math.PI) * o.bulge : 1), dd = d * taper;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU, sx = Math.cos(a) * ww, sy = Math.sin(a) * dd;
      P.push(c[0] + _s.x * sx + _n.x * sy, c[1] + _s.y * sx + _n.y * sy, c[2] + _s.z * sx + _n.z * sy); UV.push(i / n, 1 - t);
    }
    rings.push(c);
  }
  for (let j = 0; j < segs; j++) for (let i = 0; i < n; i++) { const a = j * Wn + i, b = a + 1, c = a + Wn, d2 = c + 1; I.push(a, b, d2, a, d2, c); }
  return finish(P, UV, I, { W: Wn, rows: segs + 1 });
}
function mergeGeo(list) {
  const P = [], N = [], UV = [], I = []; let off = 0;
  for (const g of list) {
    const p = g.attributes.position, nn = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); N.push(nn.getX(i), nn.getY(i), nn.getZ(i)); UV.push(uv.getX(i), uv.getY(i)); }
    const ix = g.index.array; for (let i = 0; i < ix.length; i++) I.push(ix[i] + off); off += p.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
  return g;
}
const MATS = new Map();
function mat(tex, o = {}) {
  const m = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide, transparent: !!o.transparent, depthWrite: !o.transparent, alphaTest: o.alphaTest || 0 });
  if (o.glow) { m.emissive = new THREE.Color(0xffffff); m.emissiveMap = tex; m.emissiveIntensity = o.glow; }
  if (o.transparent) { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  return m;
}
function mesh(geo, material, o = {}) { const m = new THREE.Mesh(geo, material); m.castShadow = o.shadow !== false; m.receiveShadow = true; if (o.order) m.renderOrder = o.order; return m; }

// ---------------------------------------------------------------- builds (metres)
const BUILDS = {
  kid:   { H: 1.30, w: 0.84, head: 1.08, leg: 0.43 },
  teen:  { H: 1.70, w: 0.94, head: 1.0, leg: 0.485 },
  adult: { H: 1.80, w: 1.0, head: 0.98, leg: 0.48 },
  tall:  { H: 1.92, w: 1.0, head: 0.98, leg: 0.5 },
  big:   { H: 1.84, w: 1.34, head: 1.03, leg: 0.45, belly: 0.07 },
  old:   { H: 1.64, w: 1.0, head: 1.0, leg: 0.465, stoop: 9 },
};
// the head at scale 1 (0.238 m chin → crown): [y above the chin, rx, rz, z offset]
const HEAD = [[0, 0.012, 0.013, 0.056], [0.02, 0.046, 0.05, 0.038], [0.047, 0.077, 0.078, 0.017], [0.077, 0.092, 0.092, 0.006], [0.11, 0.099, 0.1, 0], [0.15, 0.102, 0.104, -0.004], [0.19, 0.095, 0.1, -0.008], [0.222, 0.068, 0.077, -0.01], [0.238, 0.018, 0.022, -0.01]];
function headAt(y) {           // interpolated head section at height y (scale 1)
  if (y <= 0) return HEAD[0]; for (let i = 1; i < HEAD.length; i++) if (y <= HEAD[i][0]) { const a = HEAD[i - 1], b = HEAD[i], t = (y - a[0]) / (b[0] - a[0]); return [y, lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)]; }
  return HEAD[HEAD.length - 1];
}

// ================================================================ the person
export class AnimePerson {
  constructor(o) {
    this.o = o;
    const B = { ...BUILDS[o.build || 'teen'], ...(o.dims || {}) }, H = B.H, k = H / 1.7, w = B.w;
    const fem = o.fem ?? !!(o.eyes && o.eyes.lashes);
    const skin = o.skin || '#f0c8a8', top = { kind: 'tee', color: '#3a6ab0', ...(o.top || {}) }, bot = { kind: 'jeans', color: '#34406a', ...(o.bottom || {}) };
    const shoe = { kind: 'sneakers', color: '#f2f0ea', ...(o.shoes || {}) }, hair = { style: 'short', color: '#2a1c16', ...(o.hair || {}) }, acc = new Set(o.acc || []);
    const hs = 1.12 * B.head * Math.sqrt(k);                             // head scale (1 = 0.238 m chin → crown)
    const crown = H, chin = H - 0.238 * hs, shTop = chin - 0.056 * k, armY = shTop - 0.032 * k, hipJ = B.leg * H;
    const waist = lerp(hipJ, shTop, 0.36), chest = lerp(hipJ, shTop, 0.72), crotch = hipJ - 0.05 * k, knee = hipJ * 0.53, ankle = 0.095 * k;
    const fw = fem ? 0.9 : 1, hw = fem ? 1.07 : 1;
    const D = { H, k, w, hs, crown, chin, shTop, armY, hipJ, waist, chest, crotch, knee, ankle, fem };
    this.dims = { yHip: hipJ, yNeck: chin - 0.03 * k, Hc: chin + 0.12 * hs, B };
    this.group = new THREE.Group(); this.bones = {}; this.rest = {}; this.order = []; this.pivots = {}; this.parts = {}; this.scale = 1; this.pivotsM = {};
    const bone = (name, parent, piv, rot) => {
      const g = new THREE.Group(); g.name = name; const pp = parent ? this.pivotsM[parent] : [0, 0, 0];
      g.position.set(piv[0] - pp[0], piv[1] - pp[1], piv[2] - pp[2]); if (rot) g.rotation.set(rot[0], rot[1], rot[2]); (parent ? this.bones[parent] : this.group).add(g);
      this.bones[name] = g; this.order.push(name); this.pivotsM[name] = piv; this.pivots[name] = piv.map((v) => v / U);
      this.rest[name] = { p: g.position.clone(), r: g.rotation.clone(), s: g.scale.clone() }; return g;
    };
    const attach = (name, obj) => { const piv = this.pivotsM[name]; obj.position.set(-piv[0], -piv[1], -piv[2]); this.bones[name].add(obj); return obj; };
    const seed = [...(o.name || 'p')].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0;
    bone('root', null, [0, 0, 0]);
    bone('hips', 'root', [0, hipJ, 0]);

    // ---------------------------------------------------- legs, shins, shoes
    const legX = 0.074 * w * hw, short = bot.kind === 'shorts' || bot.kind === 'skirt', pants = !short;
    const legTex = this.legTexture(bot, shoe, skin, D, seed);
    for (const s of [-1, 1]) {
      const nm = s < 0 ? 'R' : 'L', x = s * legX, out = s * 0.012 * k;
      bone('leg' + nm, 'hips', [x, hipJ, 0]);
      bone('shin' + nm, 'leg' + nm, [x + out * 0.6, knee, 0.006]);
      const r = (v) => v * w * (pants ? 1.12 : 1) * (bot.kind === 'track' ? 1.1 : 1);
      const vOf = (y) => (y - ankle) / (hipJ + 0.03 - ankle);
      const thigh = tube([
        { c: [x + out * 0.6, knee - 0.012, 0.004], rx: r(0.043), rz: r(0.047), v: vOf(knee - 0.012) },
        { c: [x + out * 0.4, lerp(knee, hipJ, 0.45), 0.004], rx: r(0.056), rz: r(0.06), v: vOf(lerp(knee, hipJ, 0.45)) },
        { c: [x, hipJ - 0.02, 0.0], rx: r(0.066) * hw, rz: r(0.07), v: vOf(hipJ - 0.02) },
        { c: [x * 0.8, hipJ + 0.03, 0], rx: r(0.06) * hw, rz: r(0.064), v: vOf(hipJ + 0.03) },
      ], 7, { cap1: true });
      attach('leg' + nm, mesh(thigh, mat(legTex)));
      const shin = tube([
        { c: [x + out, ankle - 0.01, 0.0], rx: r(0.028), rz: r(0.03), v: vOf(ankle - 0.01) },
        { c: [x + out, lerp(ankle, knee, 0.55), -0.006], rx: r(0.045), rz: r(0.052), v: vOf(lerp(ankle, knee, 0.55)) },
        { c: [x + out * 0.6, knee + 0.012, 0.004], rx: r(0.044), rz: r(0.048), v: vOf(knee + 0.012) },
      ], 7, { cap0: true });
      attach('shin' + nm, mesh(shin, mat(legTex)));
      attach('shin' + nm, this.shoe(shoe, x + out, ankle, D, s));
    }
    // pelvis (shorts / trousers / skirt top) and the skirt flare
    const pelTex = this.pelvisTexture(bot, top, D, seed);
    const pel = tube([
      { c: [0, crotch, 0], rx: 0.07 * w, rz: 0.06 * w, v: 0 },
      { c: [0, hipJ - 0.01, 0], rx: 0.122 * w * hw, rz: 0.088 * w + (B.belly || 0) * 0.3, v: 0.4 },
      { c: [0, waist + 0.03, 0.004], rx: 0.11 * w * hw, rz: 0.082 * w + (B.belly || 0) * 0.6, v: 1 },
    ], 10, { cap0: true });
    attach('hips', mesh(pel, mat(pelTex)));
    if (bot.kind === 'skirt') {
      const sk = tube([
        { c: [0, hipJ - 0.17 * k, 0.005], rx: 0.17 * w * hw, rz: 0.13 * w, v: 0, f: (a) => 1 + Math.sin(a * 8) * 0.04 },
        { c: [0, hipJ - 0.02, 0.004], rx: 0.135 * w * hw, rz: 0.1 * w, v: 0.7 },
        { c: [0, waist + 0.02, 0.004], rx: 0.112 * w * hw, rz: 0.084 * w, v: 1 },
      ], 16);
      attach('hips', mesh(sk, mat(this.skirtTexture(bot, seed))));
    }

    // ---------------------------------------------------- torso
    bone('torso', 'hips', [0, waist, 0], B.stoop ? [B.stoop * Math.PI / 180, 0, 0] : null);
    const big = top.kind === 'hoodie' ? 1.12 : top.kind === 'coat' ? 1.08 : 1, bel = B.belly || 0;
    const tTop = top.kind === 'coat' ? hipJ - 0.22 * k : top.kind === 'hoodie' ? hipJ - 0.05 * k : crotch + 0.05 * k;
    const vT = (y) => (y - tTop) / (shTop + 0.02 - tTop);
    const ft = (a) => 1 - 0.07 * Math.pow(Math.max(0, Math.cos(a)), 6);           // a slightly flattened front
    const torso = tube([
      { c: [0, tTop, 0.004], rx: (top.kind === 'coat' ? 0.15 : 0.13) * w * hw * big, rz: 0.095 * w * big + bel * 0.5, v: 0 },
      { c: [0, waist, 0.005 + bel * 0.4], rx: 0.106 * w * big * (fem ? 0.93 : 1), rz: 0.08 * w * big + bel, v: vT(waist), f: ft },
      { c: [0, chest, 0.01 + bel * 0.3], rx: 0.13 * w * fw * big, rz: 0.094 * w * big + bel * 0.7, v: vT(chest), f: ft },
      { c: [0, lerp(chest, shTop, 0.6), 0.004], rx: 0.158 * w * fw * big, rz: 0.088 * w * big + bel * 0.3, v: vT(lerp(chest, shTop, 0.6)) },
      { c: [0, shTop, -0.004], rx: 0.13 * w * fw * big, rz: 0.07 * w * big, v: vT(shTop) },
      { c: [0, shTop + 0.02, -0.006], rx: 0.05 * w, rz: 0.042 * w, v: 1 },
    ], 10, { cap0: top.kind !== 'coat' });
    attach('torso', mesh(torso, mat(this.topTexture(top, skin, D, acc, seed))));
    // neck
    attach('torso', mesh(tube([{ c: [0, shTop - 0.03, -0.004], rx: 0.03 * w, rz: 0.03 * w, v: 0 }, { c: [0, chin + 0.04 * hs, -0.008], rx: 0.028 * w, rz: 0.028 * w, v: 1 }], 7), mat(paintTex(16, 32, (g, W, Hh) => { g.fillStyle = vgrad(g, Hh, [[0, shade(skin, 0.3)], [0.5, shade(skin, 0.12)], [1, skin]]); g.fillRect(0, 0, W, Hh); }))));
    // clothing volumes: hood, collar, drawstrings, scarf, chain, backpack, bag
    this.torsoExtras(top, acc, D, skin, attach, seed);

    // ---------------------------------------------------- arms, forearms, hands
    const sleeve = top.kind === 'tank' ? 0 : top.kind === 'tee' || top.kind === 'vest' || (top.kind === 'apron' && !top.long) ? (top.long ? 1 : 0.42) : 1;
    const baggy = top.kind === 'hoodie' ? 1.38 : top.kind === 'coat' || top.kind === 'jacket' ? 1.12 : 1;
    const armX = 0.168 * w * fw, armLen = 0.27 * k, foreLen = 0.255 * k;
    for (const s of [-1, 1]) {
      const nm = s < 0 ? 'R' : 'L', x0 = s * armX, ex = x0 + s * 0.022 * k, wx = ex + s * 0.012 * k;
      const eY = armY - armLen, wY = eY - foreLen;
      bone('arm' + nm, 'torso', [x0, armY, 0]);
      bone('fore' + nm, 'arm' + nm, [ex, eY, 0]);
      bone('hand' + nm, 'fore' + nm, [wx, wY + 0.012, 0.004]);
      const aTex = this.armTexture(top, skin, sleeve, D, s, seed), vA = (y) => (y - (wY - 0.06)) / (armY + 0.05 - (wY - 0.06));
      const ar = (v, y) => { const covered = (armY - y) / (armLen + foreLen) < sleeve + 0.02; return v * w * (covered ? baggy : 1); };
      const upper = tube([
        { c: [ex, eY - 0.012, 0], rx: ar(0.035, eY), rz: ar(0.035, eY), v: vA(eY - 0.012) },
        { c: [lerp(x0, ex, 0.5), lerp(armY, eY, 0.5), 0], rx: ar(0.042, lerp(armY, eY, 0.5)), rz: ar(0.042, lerp(armY, eY, 0.5)), v: vA(lerp(armY, eY, 0.5)) },
        { c: [x0, armY - 0.02, 0], rx: ar(0.05, armY), rz: ar(0.05, armY), v: vA(armY - 0.02) },
        { c: [x0 - s * 0.01, armY + 0.035, 0], rx: 0.035 * w, rz: 0.04 * w, v: vA(armY + 0.035) },
      ], 7, { cap1: true });
      attach('arm' + nm, mesh(upper, mat(aTex)));
      const cuffY = baggy > 1.2 ? wY - 0.045 * k : wY, foreR = [
        { c: [wx, cuffY, 0.004], rx: ar(baggy > 1.2 ? 0.043 : 0.026, wY), rz: ar(baggy > 1.2 ? 0.04 : 0.024, wY), v: vA(cuffY) },
        { c: [lerp(ex, wx, 0.45), lerp(eY, wY, 0.45), 0.002], rx: ar(0.034, lerp(eY, wY, 0.45)), rz: ar(0.032, lerp(eY, wY, 0.45)), v: vA(lerp(eY, wY, 0.45)) },
        { c: [ex, eY + 0.014, 0], rx: ar(0.036, eY), rz: ar(0.036, eY), v: vA(eY + 0.014) },
      ];
      attach('fore' + nm, mesh(tube(foreR, 7, { cap0: baggy > 1.2 }), mat(aTex)));
      attach('hand' + nm, this.hand(acc.has('gloves') ? o.gloveColor || '#2a2a30' : skin, wx, wY, D, s, baggy > 1.2));
      if (acc.has('watch') && s > 0) attach('fore' + nm, mesh(tube([{ c: [wx, wY + 0.012, 0.004], rx: 0.03, rz: 0.028, v: 0 }, { c: [wx, wY + 0.032, 0.004], rx: 0.031, rz: 0.029, v: 1 }], 8), mat(paintTex(32, 8, (g, W, Hh) => { g.fillStyle = '#2a2a32'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#d8e0ec'; g.fillRect(W * 0.42, 1, W * 0.16, Hh - 2); }))));
      if (s < 0) {
        if (acc.has('phone')) this.part('phone', attach('handR', mesh(new THREE.BoxGeometry(0.07, 0.135, 0.012).translate(wx, wY - 0.08, 0.04), mat(paintTex(32, 64, (g, W, Hh) => { g.fillStyle = o.phoneColor || '#1e1e26'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#5ab4f0'; g.fillRect(3, 4, W - 6, Hh - 8); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(5, 6, 6, Hh - 14); })))), true);
        if (acc.has('capsule')) this.part('capsule', attach('handR', mesh(new THREE.IcosahedronGeometry(0.05, 1).translate(wx, wY - 0.08, 0.03), mat(paintTex(32, 32, (g, W, Hh) => { g.fillStyle = '#f4f0ea'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#e8343a'; g.fillRect(0, 0, W, Hh / 2 - 1); g.fillStyle = '#1c1418'; g.fillRect(0, Hh / 2 - 1, W, 3); })))), true);
      }
    }

    // ---------------------------------------------------- head, face, hair
    bone('head', 'torso', [0, chin - 0.03 * k, 0]);
    const HY = (t) => chin + t * hs, sc = (v) => v * hs;
    const headRings = HEAD.map(([y, rx, rz, z], i) => ({ c: [0, HY(y), sc(z)], rx: sc(rx) * (o.jawW && i < 3 ? o.jawW : 1), rz: sc(rz), v: y / 0.238 }));
    attach('head', mesh(tube(headRings, 12, { cap1: true, cap0: true }), mat(this.headTexture(skin, hair, o, seed), { glow: 0.22 })));
    // the face layer: the front of the head, a hair's breadth out, with a planar (front-projected) uv
    const FX0 = -0.1, FX1 = 0.1, FY0 = -0.005, FY1 = 0.2;
    {
      const P = [], UV = [], I = [], cols = [];
      for (let i = 0; i <= 12; i++) { const a = (i / 12 - 0.5) * TAU; if (Math.abs(a) <= TAU * 0.21) cols.push(a); }
      const rows = HEAD.filter(([y]) => y <= 0.2);
      rows.push(headAt(0.2));
      for (const [y, rx, rz, z] of rows) for (const a of cols) { const e = 0.0016; const px = Math.sin(a) * (rx + e), pz = Math.cos(a) * (rz + e) + z; P.push(sc(px), HY(y), sc(pz)); UV.push((px - FX0) / (FX1 - FX0), (y - FY0) / (FY1 - FY0)); }
      const Wc = cols.length;
      for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < Wc - 1; i++) { const a = j * Wc + i, b = a + 1, c = a + Wc, d = c + 1; I.push(a, b, d, a, d, c); }
      const geo = finish(P, UV, I, null);
      this.faceCv = canvas(512, 512); this.faceTex = texOf(this.faceCv); this.faceTex.minFilter = THREE.LinearFilter; this.faceTex.generateMipmaps = false;
      const fm = mat(this.faceTex, { transparent: true, glow: 0.3 });
      this.faceMesh = attach('head', mesh(geo, fm, { shadow: false, order: 2 }));
      this.faceMap = { x0: FX0, x1: FX1, y0: FY0, y1: FY1 };
    }
    this.face = { eyes: 'open', brows: 'calm', mouth: o.mouth || 'closed', gaze: 'c' };
    this.faceO = { iris: (o.eyes && o.eyes.color) || '#4a3424', shape: (o.eyes && o.eyes.shape) || 'normal', lashes: fem || (o.eyes && o.eyes.lashes), thick: o.eyes && o.eyes.thick, skin, brow: o.browColor || (hair.style === 'bald' ? tone(skin, -0.45) : shade(hair.color, 0.15)), freckles: o.freckles, beard: o.beard, beardColor: o.beardColor || hair.color, glasses: acc.has('glasses') ? 'clear' : acc.has('sunglasses') ? 'dark' : null, frame: o.frameColor || '#1e1a1e', fem, blushK: o.blush ?? (fem ? 0.16 : 0.08) };
    this.paintFace();
    if (o.beard === 'full') {
      const bc = o.beardColor || hair.color, F = (x, y, z) => [sc(x), HY(y), sc(z)], bg = [];
      for (let i = 0; i < 5; i++) { const t = i / 4 - 0.5, x = t * 0.1, z = headAt(0.02)[2] + 0.03 - Math.abs(t) * 0.05; bg.push(lock(F(x, 0.03, z), F(x * 0.7, -0.05 - (1 - Math.abs(t)) * 0.03, z + 0.01), F(x, -0.02, z + 0.02), sc(0.028), sc(0.012), { out: [0, 0, 1], segs: 3 })); }
      attach('head', mesh(mergeGeo(bg), mat(paintTex(16, 32, (g, W, Hh) => { g.fillStyle = vgrad(g, Hh, [[0, shade(bc, 0.2)], [1, lite(bc, 0.1)]]); g.fillRect(0, 0, W, Hh); g.fillStyle = rgba(shade(bc, 0.35), 0.6); for (const x of [4, 9, 13]) g.fillRect(x, 0, 1, Hh); }))));
    }
    this.hairBuild(hair, D, attach, seed, acc);
    this.headgear(o, acc, D, attach);
    this.def = { name: o.name, anim: acting({ ...o, sitDrop: (hipJ - 0.5 * k + 0.02) / U, tall: k }) };
  }
  dispose() {
    this.group.traverse((m) => { if (!m.isMesh) return; m.geometry.dispose(); const mt = m.material; if (mt.map) mt.map.dispose(); mt.dispose(); });
  }
  part(id, obj, hidden) { (this.parts[id] || (this.parts[id] = [])).push(obj); if (hidden) obj.visible = false; return obj; }
  // the Animator's face slots arrive as part ids ('eye-happy', 'brow-angry', 'mouth-o', 'gaze-l'); others are real parts
  show(id, v = true) {
    const m = /^(eye|brow|mouth|gaze)-(.+)$/.exec(id);
    if (m) { if (v) { const slot = { eye: 'eyes', brow: 'brows', mouth: 'mouth', gaze: 'gaze' }[m[1]]; if (this.face[slot] !== m[2]) { this.face[slot] = m[2]; this.faceDirty = true; queueMicrotask(() => this.faceDirty && this.paintFace()); } } return; }
    for (const p of this.parts[id] || []) p.visible = v;
  }

  // ================================================================ textures
  headTexture(skin, hair, o, seed) {
    return paintTex(128, 128, (g, W, H) => {
      g.fillStyle = vgrad(g, H, [[0, lite(skin, 0.12)], [0.55, skin], [0.85, shade(skin, 0.1)], [1, shade(skin, 0.28)]]); g.fillRect(0, 0, W, H);
      wrapShade(g, W, H, 0.12);
      // under-chin and jaw shadow, soft cheek warmth
      const gr = g.createRadialGradient(W / 2, H * 0.7, 2, W / 2, H * 0.7, W * 0.2); gr.addColorStop(0, rgba('#ff8a7a', 0.0)); gr.addColorStop(1, rgba('#ff8a7a', 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = rgba(shade(skin, 0.35), 0.35); g.fillRect(0, H * 0.94, W, H * 0.06);
      if (o.beard === 'full') { const bc = o.beardColor || hair.color; g.fillStyle = bc; g.fillRect(0, H * 0.62, W * 0.3, H * 0.38); g.fillRect(W * 0.7, H * 0.62, W * 0.3, H * 0.38); }
      if (o.beard === 'stubble') { const bc = o.beardColor || hair.color; g.fillStyle = rgba(bc, 0.1); g.fillRect(W * 0.12, H * 0.7, W * 0.76, H * 0.3); }
      if (hair.style === 'buzz' || hair.style === 'mohawk') { const r = rnd(seed); g.fillStyle = rgba(hair.color, hair.style === 'buzz' ? 0.75 : 0.35); g.fillRect(0, 0, W, H * 0.42); for (let i = 0; i < 400; i++) { g.fillStyle = rgba(shade(hair.color, 0.3), 0.4); g.fillRect(r() * W, r() * H * 0.42, 1, 1); } g.clearRect(W * 0.38, H * 0.22, W * 0.24, H * 0.2); g.fillStyle = vgrad(g, H, [[0, lite(skin, 0.12)], [0.55, skin]]); g.fillRect(W * 0.38, H * 0.22, W * 0.24, H * 0.2); }
    });
  }
  legTexture(bot, shoe, skin, D, seed) {
    const { ankle, hipJ, knee } = D, vOf = (y) => (y - ankle) / (hipJ + 0.03 - ankle);
    return paintTex(128, 256, (g, W, H) => {
      const Y = (y) => (1 - vOf(y)) * H;
      // skin legs: soft pink knees, darker toward the ankle
      g.fillStyle = vgrad(g, H, [[0, lite(skin, 0.06)], [0.5, skin], [1, shade(skin, 0.12)]]); g.fillRect(0, 0, W, H);
      for (const u of [0.5]) { const gr = g.createRadialGradient(u * W, Y(knee), 1, u * W, Y(knee), W * 0.18); gr.addColorStop(0, rgba('#ff8a8a', 0.28)); gr.addColorStop(1, rgba('#ff8a8a', 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
      const cl0 = bot.color;
      const clothTo = bot.kind === 'shorts' ? hipJ - 0.14 * D.k : bot.kind === 'skirt' ? hipJ + 1 : ankle - 0.02;
      if (bot.kind !== 'skirt') {
        g.fillStyle = vgrad(g, H, [[0, lite(cl0, 0.1)], [0.55, cl0], [1, shade(cl0, 0.15)]]); g.fillRect(0, 0, W, Y(clothTo));
        // seams down the outside, knee creases, a turned-up hem
        g.fillStyle = rgba(shade(cl0, 0.35), 0.8); for (const u of [0.25, 0.75]) g.fillRect(u * W - 1, 0, 2, Y(clothTo));
        if (bot.kind === 'jeans') { g.fillStyle = rgba(lite(cl0, 0.4), 0.55); for (const u of [0.25, 0.75]) g.fillRect(u * W + 1, 0, 1, Y(clothTo)); const r = rnd(seed); for (let i = 0; i < 60; i++) { g.fillStyle = rgba(lite(cl0, 0.35), 0.12); g.fillRect(r() * W, r() * Y(clothTo), 3, 1); } }
        if (bot.kind === 'track' && bot.color2) { g.fillStyle = bot.color2; for (const u of [0.23, 0.77]) g.fillRect(u * W - 3, 0, 6, Y(clothTo)); }
        if (pantsLong(bot)) { for (let i = 0; i < 3; i++) fold(g, W * 0.38, Y(knee) - 6 + i * 6, W * 0.62, Y(knee) - 4 + i * 6, W * 0.5, Y(knee) + i * 6, 2, shade(cl0, 0.4), 0.35); g.fillStyle = shade(cl0, 0.25); g.fillRect(0, Y(clothTo) - 8, W, 8); }
        else { g.fillStyle = shade(cl0, 0.3); g.fillRect(0, Y(clothTo) - 5, W, 5); g.fillStyle = rgba(shade(skin, 0.3), 0.4); g.fillRect(0, Y(clothTo), W, 3); }
        wrapShade(g, W, Y(clothTo), 0.2);
      }
      // socks: knee socks or crew socks above the shoe
      const sockTop = shoe.socks === 'knee' || (bot.kind !== 'jeans' && bot.kind !== 'slacks' && bot.kind !== 'track' && shoe.sock && shoe.kind !== 'dress') ? (shoe.socks === 'knee' ? knee - 0.03 : ankle + 0.07 * D.k) : 0;
      if (sockTop > ankle && !pantsLong(bot)) { const sc = shoe.sock || '#f2f0ea'; g.fillStyle = vgrad(g, H, [[0, lite(sc, 0.1)], [1, shade(sc, 0.12)]]); g.fillRect(0, Y(sockTop), W, H - Y(sockTop)); g.fillStyle = rgba(shade(sc, 0.25), 0.6); for (let y = Y(sockTop) + 2; y < Y(sockTop) + 12; y += 3) g.fillRect(0, y, W, 1); for (let x = 0; x < W; x += 4) g.fillRect(x, Y(sockTop), 1, 12); }
      speckle(g, W, H, seed + 3, 200, 0.03);
    });
  }
  pelvisTexture(bot, top, D, seed) {
    return paintTex(128, 64, (g, W, H) => {
      const c = bot.color; g.fillStyle = vgrad(g, H, [[0, lite(c, 0.08)], [1, shade(c, 0.2)]]); g.fillRect(0, 0, W, H);
      if (bot.kind === 'jeans' || bot.kind === 'slacks') {
        g.fillStyle = '#2a2224'; g.fillRect(0, 0, W, H * 0.16);                                              // belt
        g.fillStyle = '#d8c070'; g.fillRect(W * 0.47, 0, W * 0.06, H * 0.16); g.fillStyle = '#2a2224'; g.fillRect(W * 0.485, H * 0.04, W * 0.03, H * 0.08);
        g.strokeStyle = rgba(shade(c, 0.4), 0.8); g.lineWidth = 1.5; g.beginPath(); g.moveTo(W * 0.5, H * 0.16); g.lineTo(W * 0.5, H * 0.75); g.stroke();   // fly
        for (const u of [0.38, 0.62]) { g.beginPath(); g.moveTo(u * W, H * 0.18); g.quadraticCurveTo(u * W + (u < 0.5 ? -8 : 8), H * 0.4, u * W + (u < 0.5 ? -14 : 14), H * 0.2); g.stroke(); }  // pockets
        if (bot.kind === 'jeans') { g.fillStyle = rgba('#e8c070', 0.6); for (const u of [0.38, 0.62]) g.fillRect(u * W - 1, H * 0.2, 2, 2); }
      }
      if (bot.kind === 'shorts' || bot.kind === 'track') { g.fillStyle = shade(c, 0.25); g.fillRect(0, 0, W, H * 0.14); g.fillStyle = rgba('#f0ece4', 0.85); for (const u of [0.47, 0.53]) g.fillRect(u * W, H * 0.12, 1.5, H * 0.3); }
      if (bot.kind === 'track' && bot.color2) { g.fillStyle = bot.color2; for (const u of [0.23, 0.77]) g.fillRect(u * W - 3, 0, 6, H); }
      wrapShade(g, W, H, 0.2);
      void top; void D; void seed;
    });
  }
  skirtTexture(bot, seed) {
    return paintTex(256, 64, (g, W, H) => {
      const c = bot.color; g.fillStyle = vgrad(g, H, [[0, lite(c, 0.1)], [1, shade(c, 0.15)]]); g.fillRect(0, 0, W, H);
      for (let i = 0; i < 16; i++) { const x = (i / 16) * W; g.fillStyle = rgba(shade(c, 0.4), 0.45); g.fillRect(x, 0, 2, H); g.fillStyle = rgba(lite(c, 0.3), 0.35); g.fillRect(x + 3, 0, 2, H); }   // pleats
      if (bot.color2) { g.fillStyle = bot.color2; g.fillRect(0, H * 0.82, W, 3); }
      g.fillStyle = shade(c, 0.3); g.fillRect(0, H - 4, W, 4);
      speckle(g, W, H, seed + 9, 120, 0.03);
    });
  }
  topTexture(top, skin, D, acc, seed) {
    const c = top.color, c2 = top.color2 || shade(c, 0.25);
    return paintTex(256, 256, (g, W, H) => {
      g.fillStyle = vgrad(g, H, [[0, lite(c, 0.16)], [0.35, c], [0.85, shade(c, 0.1)], [1, shade(c, 0.24)]]); g.fillRect(0, 0, W, H);
      const front = (fn) => { g.save(); fn(); g.restore(); };
      // folds under the chest and at the waist
      for (let i = 0; i < 4; i++) fold(g, W * (0.36 + i * 0.07), H * 0.62, W * (0.42 + i * 0.06), H * 0.82, W * (0.4 + i * 0.07), H * 0.7, 3, shade(c, 0.35), 0.18);
      fold(g, W * 0.3, H * 0.86, W * 0.7, H * 0.86, W * 0.5, H * 0.9, 3, shade(c, 0.35), 0.2);
      // side seams
      g.fillStyle = rgba(shade(c, 0.4), 0.55); for (const u of [0.25, 0.75]) g.fillRect(u * W - 1, 0, 2, H);
      if (top.kind === 'tee' || top.kind === 'tank' || top.kind === 'hoodie') { g.fillStyle = shade(c, 0.22); g.fillRect(0, H - 10, W, 10); g.fillStyle = rgba(shade(c, 0.45), 0.5); for (let x = 0; x < W; x += 3) g.fillRect(x, H - 10, 1, 10); }   // ribbed hem
      if (top.kind === 'tee' || top.kind === 'tank') { g.fillStyle = shade(c, 0.28); g.fillRect(0, 0, W, 9); g.fillStyle = rgba(lite(c, 0.4), 0.5); g.fillRect(0, 9, W, 1); g.fillStyle = skin; front(() => { g.beginPath(); g.ellipse(W / 2, 0, W * 0.07, H * 0.05, 0, 0, Math.PI); g.fill(); }); }
      if (top.kind === 'hoodie') {
        front(() => { g.fillStyle = shade(c, 0.12); g.beginPath(); g.moveTo(W * 0.36, H * 0.92); g.lineTo(W * 0.64, H * 0.92); g.lineTo(W * 0.6, H * 0.62); g.lineTo(W * 0.4, H * 0.62); g.closePath(); g.fill(); g.strokeStyle = shade(c, 0.4); g.lineWidth = 2; g.stroke(); g.strokeStyle = rgba(shade(c, 0.5), 0.7); g.beginPath(); g.moveTo(W * 0.37, H * 0.7); g.lineTo(W * 0.4, H * 0.62); g.moveTo(W * 0.63, H * 0.7); g.lineTo(W * 0.6, H * 0.62); g.stroke(); });
        g.fillStyle = shade(c, 0.3); g.beginPath(); g.ellipse(W / 2, 0, W * 0.08, H * 0.06, 0, 0, Math.PI); g.fill();
      }
      if (top.kind === 'jacket' || top.kind === 'suit' || top.kind === 'coat') {
        const inner = top.inner || (top.kind === 'suit' ? '#f4f2ec' : '#2e2e36');
        front(() => {
          g.fillStyle = inner; g.beginPath(); g.moveTo(W * 0.5, H * (top.kind === 'suit' ? 0.5 : 0.95)); g.lineTo(W * 0.43, 0); g.lineTo(W * 0.57, 0); g.closePath(); g.fill();
          if (top.kind === 'jacket') { g.fillStyle = '#c8ccd4'; g.fillRect(W * 0.5 - 1, H * 0.1, 2, H * 0.9); }
          if (top.kind === 'suit') { g.fillStyle = top.tie || '#a82e3a'; g.beginPath(); g.moveTo(W * 0.5, H * 0.06); g.lineTo(W * 0.515, H * 0.12); g.lineTo(W * 0.507, H * 0.55); g.lineTo(W * 0.5, H * 0.6); g.lineTo(W * 0.493, H * 0.55); g.lineTo(W * 0.485, H * 0.12); g.closePath(); g.fill(); g.fillStyle = '#2a2228'; for (const y of [0.62, 0.75]) { g.beginPath(); g.arc(W * 0.47, H * y, 2, 0, TAU); g.fill(); } }
          g.strokeStyle = shade(c, 0.4); g.lineWidth = 2; g.beginPath(); g.moveTo(W * 0.43, 0); g.lineTo(W * 0.5, H * (top.kind === 'suit' ? 0.5 : 0.95)); g.lineTo(W * 0.57, 0); g.stroke();
          g.fillStyle = lite(c, 0.12); g.beginPath(); g.moveTo(W * 0.43, 0); g.lineTo(W * 0.4, H * 0.1); g.lineTo(W * 0.47, H * 0.38); g.closePath(); g.fill(); g.beginPath(); g.moveTo(W * 0.57, 0); g.lineTo(W * 0.6, H * 0.1); g.lineTo(W * 0.53, H * 0.38); g.closePath(); g.fill();   // lapels
          if (top.kind !== 'suit') { g.strokeStyle = rgba(shade(c, 0.45), 0.8); g.lineWidth = 1.5; for (const u of [0.4, 0.6]) { g.beginPath(); g.moveTo(u * W - 10, H * 0.72); g.lineTo(u * W + 10, H * 0.7); g.stroke(); } }
        });
        if (top.stripe) { g.fillStyle = top.stripe; g.fillRect(0, H * 0.38, W, 6); }
      }
      if (top.kind === 'vest') { g.fillStyle = top.inner || '#e8e2d4'; g.fillRect(W * 0.44, 0, W * 0.12, H); g.fillStyle = c2; g.fillRect(0, 0, W * 0.2, H); g.fillRect(W * 0.8, 0, W * 0.2, H); g.fillStyle = '#d8c070'; for (const y of [0.3, 0.5, 0.7]) { g.beginPath(); g.arc(W * 0.43, H * y, 2, 0, TAU); g.fill(); } }
      if (top.kind === 'apron') { g.fillStyle = top.color2 || '#f0ece4'; g.fillRect(W * 0.36, H * 0.05, W * 0.28, H * 0.95); g.fillStyle = shade(top.color2 || '#f0ece4', 0.2); g.fillRect(W * 0.4, H * 0.62, W * 0.2, 3); g.fillRect(0, H * 0.6, W, 4); }
      if (top.kind === 'tank') { g.fillStyle = skin; for (const u of [0.25, 0.75]) { g.beginPath(); g.ellipse(u * W, 0, W * 0.08, H * 0.26, 0, 0, Math.PI); g.fill(); } }
      // a print on the chest: the recipe's function of (x metres from the centre, fy 0..1 up the torso)
      if (top.print) {
        const img = g.getImageData(0, 0, W, H), d = img.data, rx = 0.13 * D.w;
        for (let y = 0; y < H; y++) for (let x = Math.floor(W * 0.36); x < W * 0.64; x++) {
          const a = (x / W - 0.5) * TAU, px = Math.sin(a) * rx, fy = 1 - y / H; const pc = top.print(px, fy); if (!pc) continue; const [r, gg, b] = hx(pc), i = (y * W + x) * 4; d[i] = r; d[i + 1] = gg; d[i + 2] = b;
        }
        g.putImageData(img, 0, 0);
      }
      if (acc.has('backpack')) { g.fillStyle = shade(top.packStrap || '#2a2a30', 0); for (const u of [0.38, 0.62]) g.fillRect(u * W - 4, 0, 8, H * 0.7); }
      wrapShade(g, W, H, 0.24);
      speckle(g, W, H, seed + 5, 300, 0.035);
    });
  }
  armTexture(top, skin, sleeve, D, s, seed) {
    const c = top.color;
    return paintTex(64, 256, (g, W, H) => {
      g.fillStyle = vgrad(g, H, [[0, lite(skin, 0.08)], [1, shade(skin, 0.1)]]); g.fillRect(0, 0, W, H);
      const sl = Math.round(H * Math.min(1, sleeve * 0.82 + (sleeve >= 1 ? 0.2 : 0)));
      if (sleeve > 0) {
        g.fillStyle = vgrad(g, H, [[0, lite(c, 0.16)], [0.6, c], [1, shade(c, 0.2)]]); g.fillRect(0, 0, W, sl);
        for (let i = 0; i < 3; i++) fold(g, 4, sl * (0.35 + i * 0.12), W - 4, sl * (0.38 + i * 0.12), W / 2, sl * (0.42 + i * 0.12), 2, shade(c, 0.4), 0.22);
        g.fillStyle = shade(top.kind === 'vest' ? top.inner || c : c, 0.25); g.fillRect(0, sl - 7, W, 7);                       // cuff
        if (top.kind === 'hoodie' || top.kind === 'tee') { g.fillStyle = rgba(shade(c, 0.5), 0.5); for (let x = 0; x < W; x += 3) g.fillRect(x, sl - 7, 1, 7); }
        if (top.stripe) { g.fillStyle = top.stripe; g.fillRect((s < 0 ? 0.25 : 0.75) * W - 3, 0, 6, sl - 7); }
        if (sl < H) { g.fillStyle = rgba(shade(skin, 0.3), 0.5); g.fillRect(0, sl, W, 3); }
      }
      wrapShade(g, W, H, 0.2, s < 0 ? 0.6 : 0.4);
      speckle(g, W, H, seed + 7 + s, 80, 0.03);
    });
  }
  // a chunky shoe (sneaker / boot / dress shoe), lofted from heel to toe
  shoe(sh, x, ankle, D, s) {
    const k = D.k, boot = sh.kind === 'boots', dress = sh.kind === 'dress', L = (dress ? 0.25 : 0.3) * k, z0 = -0.075 * k, w = (dress ? 0.045 : 0.058) * k, hh = (boot ? 0.14 : dress ? 0.065 : 0.1) * k;
    const prof = boot ? [[0, 0.7, 1], [0.12, 0.95, 1.02], [0.38, 1, 1], [0.62, 0.62, 1.04], [0.86, 0.48, 0.98], [1, 0.3, 0.7]] : dress ? [[0, 0.6, 0.9], [0.2, 0.95, 1], [0.5, 1, 1], [0.75, 0.55, 1], [0.92, 0.42, 0.9], [1, 0.25, 0.55]] : [[0, 0.62, 0.92], [0.12, 0.96, 1.02], [0.4, 1, 1.04], [0.64, 0.66, 1.06], [0.86, 0.52, 1.0], [1, 0.32, 0.7]];
    const rings = prof.map(([t, hk, wk]) => ({ c: [x, hh * hk * 0.5 - 0.005, z0 + t * L], rx: w * wk, rz: hh * hk * 0.5 + 0.005, v: t, f: (a) => 1 + 0.12 * Math.max(0, -Math.cos(a)) }));
    const sc = sh.color, sole = sh.sole || (boot || dress ? '#241e1c' : '#f6f4ee');
    const tex = paintTex(128, 128, (g, W, H) => {
      // u: 0.5 = top (laces), 0/1 = bottom (sole); v: heel → toe (canvas x = u, y = 1 − v)
      g.fillStyle = vgrad(g, H, [[0, lite(sc, 0.1)], [1, sc]]); g.fillRect(0, 0, W, H);
      const shadeTop = g.createLinearGradient(0, 0, W, 0); shadeTop.addColorStop(0, rgba(shade(sc, 0.4), 0.6)); shadeTop.addColorStop(0.3, rgba(sc, 0)); shadeTop.addColorStop(0.7, rgba(sc, 0)); shadeTop.addColorStop(1, rgba(shade(sc, 0.4), 0.6)); g.fillStyle = shadeTop; g.fillRect(0, 0, W, H);
      g.fillStyle = sole; g.fillRect(0, 0, W * (dress ? 0.12 : 0.2), H); g.fillRect(W * (dress ? 0.88 : 0.8), 0, W * (dress ? 0.12 : 0.2), H);          // the sole band
      g.fillStyle = rgba(shade(sole, 0.4), 0.8); g.fillRect(W * (dress ? 0.12 : 0.2), 0, 2, H); g.fillRect(W * (dress ? 0.88 : 0.8) - 2, 0, 2, H);
      if (!dress) { g.fillStyle = rgba(shade(sole, 0.3), 0.5); for (let y = 2; y < H; y += 6) { g.fillRect(0, y, W * 0.08, 2); g.fillRect(W * 0.92, y, W * 0.08, 2); } }
      if (sh.kind === 'sneakers') {
        g.fillStyle = shade(sc, 0.08); g.fillRect(W * 0.3, 0, W * 0.4, H * 0.22);                                    // toe cap
        g.strokeStyle = sh.lace || '#f8f8f4'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { const y = H * (0.36 + i * 0.075); g.beginPath(); g.moveTo(W * 0.42, y); g.lineTo(W * 0.58, y + H * 0.04); g.moveTo(W * 0.58, y); g.lineTo(W * 0.42, y + H * 0.04); g.stroke(); }
        g.fillStyle = rgba('#2a2a32', 0.5); for (let i = 0; i < 6; i++) for (const u of [0.41, 0.59]) { g.beginPath(); g.arc(u * W, H * (0.36 + i * 0.075), 1.6, 0, TAU); g.fill(); }
        if (sh.stripe) { g.fillStyle = sh.stripe; for (const u of [0.27, 0.73]) { g.beginPath(); g.moveTo(u * W - 6, H * 0.72); g.quadraticCurveTo(u * W + 6, H * 0.5, u * W - 2, H * 0.3); g.lineTo(u * W + 4, H * 0.34); g.quadraticCurveTo(u * W + 12, H * 0.5, u * W + 2, H * 0.74); g.closePath(); g.fill(); } }
        g.fillStyle = sh.stripe || shade(sc, 0.3); g.fillRect(W * 0.44, H * 0.9, W * 0.12, H * 0.1);                   // heel tab
      }
      if (boot) { g.fillStyle = rgba(lite(sc, 0.25), 0.5); g.fillRect(W * 0.46, H * 0.2, W * 0.08, H * 0.75); g.strokeStyle = '#8a7a6a'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { const y = H * (0.25 + i * 0.1); g.beginPath(); g.moveTo(W * 0.44, y); g.lineTo(W * 0.56, y); g.stroke(); } }
      if (dress) { g.fillStyle = rgba('#ffffff', 0.35); g.beginPath(); g.ellipse(W * 0.45, H * 0.25, W * 0.05, H * 0.1, 0, 0, TAU); g.fill(); }
    });
    const geo = tube(rings, 10, { axis: 'z', cap0: true, cap1: true });
    void s; return mesh(geo, mat(tex));
  }
  hand(c, wx, wY, D, s, hidden) {
    const k = D.k, L = 0.13 * k, g = [
      tube([{ c: [wx, wY - L, 0.012], rx: 0.016 * k, rz: 0.01 * k, v: 0 }, { c: [wx, wY - L * 0.55, 0.01], rx: 0.03 * k, rz: 0.016 * k, v: 0.5 }, { c: [wx, wY - 0.005, 0.004], rx: 0.027 * k, rz: 0.018 * k, v: 1 }], 7, { cap0: true }),
      lock([wx - s * 0.018 * k, wY - 0.03 * k, 0.018], [wx - s * 0.03 * k, wY - 0.075 * k, 0.03], [wx - s * 0.03 * k, wY - 0.045 * k, 0.03], 0.01 * k, 0.009 * k, { segs: 2, out: [0, 0, 1] }),
    ];
    const m = mesh(mergeGeo(g), mat(paintTex(16, 32, (gg, W, H) => { gg.fillStyle = vgrad(gg, H, [[0, lite(c, 0.1)], [1, shade(c, 0.15)]]); gg.fillRect(0, 0, W, H); gg.fillStyle = rgba(shade(c, 0.35), 0.5); for (const x of [5, 8, 11]) gg.fillRect(x, H * 0.6, 1, H * 0.4); })));
    void hidden; return m;
  }
  torsoExtras(top, acc, D, skin, attach, seed) {
    const { shTop, chest, w, k } = D, c = top.color;
    if (top.kind === 'hoodie') {
      // the hood bunched behind the neck, and drawstrings
      const hood = tube([
        { c: [0, shTop - 0.02, -0.03], rx: 0.1 * w, rz: 0.075 * w, v: 0 },
        { c: [0, shTop + 0.025, -0.045], rx: 0.115 * w, rz: 0.08 * w, v: 0.5, f: (a) => 1 + 0.15 * Math.max(0, -Math.cos(a)) },
        { c: [0, shTop + 0.06, -0.06], rx: 0.085 * w, rz: 0.06 * w, v: 1, f: (a) => (Math.cos(a) > 0.3 ? 0.8 : 1.15) },
      ], 10, { cap1: true });
      attach('torso', mesh(hood, mat(paintTex(64, 32, (g, W, H) => { g.fillStyle = vgrad(g, H, [[0, lite(c, 0.12)], [1, shade(c, 0.25)]]); g.fillRect(0, 0, W, H); g.fillStyle = shade(c, 0.45); g.fillRect(W * 0.38, 0, W * 0.24, H); wrapShade(g, W, H, 0.25); }))));
      const sc = top.color2 || '#f0ece4';
      for (const s of [-1, 1]) attach('torso', mesh(lock([s * 0.035 * w, shTop - 0.005, 0.07 * w], [s * 0.04 * w, chest - 0.04 * k, 0.098 * w], [s * 0.04 * w, shTop - 0.05, 0.1 * w], 0.005, 0.005, { segs: 3, tipW: 0.8, out: [0, 0, 1] }), mat(paintTex(4, 16, (g, W, H) => { g.fillStyle = sc; g.fillRect(0, 0, W, H); g.fillStyle = shade(sc, 0.3); g.fillRect(0, H - 3, W, 3); }))));
    }
    if (top.kind === 'jacket' || top.kind === 'coat' || top.kind === 'suit') {
      const collar = tube([{ c: [0, shTop - 0.012, -0.004], rx: 0.07 * w, rz: 0.06 * w, v: 0 }, { c: [0, shTop + 0.03, -0.012], rx: 0.062 * w, rz: 0.054 * w, v: 1, f: (a) => (Math.abs(a) < 0.5 ? 0.0 + 1 : 1) }], 10);
      attach('torso', mesh(collar, mat(paintTex(64, 16, (g, W, H) => { g.fillStyle = lite(c, 0.06); g.fillRect(0, 0, W, H); g.fillStyle = shade(c, 0.35); g.fillRect(0, 0, W, 2); g.clearRect(W * 0.42, 0, W * 0.16, H); }), { alphaTest: 0.5 })));
    }
    if (acc.has('scarf')) attach('torso', mesh(tube([{ c: [0, shTop - 0.03, 0], rx: 0.1 * w, rz: 0.085 * w, v: 0 }, { c: [0, shTop + 0.01, 0], rx: 0.085 * w, rz: 0.075 * w, v: 1 }], 10), mat(paintTex(64, 16, (g, W, H) => { const sc = this.o.scarfColor || '#c83a3a'; g.fillStyle = sc; g.fillRect(0, 0, W, H); g.fillStyle = shade(sc, 0.3); for (let x = 0; x < W; x += 6) g.fillRect(x, 0, 2, H); }))));
    if (acc.has('chain')) { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, a = (t - 0.5) * 2.4; pts.push([Math.sin(a) * 0.075 * w, shTop - 0.005 - Math.cos(a) * 0.07 * k, Math.cos(a) * 0.088 * w + 0.004]); } attach('torso', mesh(mergeGeo([...pts.slice(1).map((p, i) => lock(pts[i], p, [(p[0] + pts[i][0]) / 2, (p[1] + pts[i][1]) / 2, (p[2] + pts[i][2]) / 2 + 0.003], 0.004, 0.004, { segs: 1, tipW: 1, out: [0, 0, 1] })), new THREE.OctahedronGeometry(0.014).translate(0, shTop - 0.08 * k, 0.098 * w)].map((g) => (g.index ? g : g.toNonIndexed() && addIndex(g)))), mat(paintTex(8, 8, (g, W, H) => { g.fillStyle = '#ffd850'; g.fillRect(0, 0, W, H); g.fillStyle = '#c89a2a'; g.fillRect(0, H / 2, W, H / 2); })))); }
    if (acc.has('backpack')) attach('torso', mesh(tube([{ c: [0, D.waist + 0.02, -0.1 * w - 0.05], rx: 0.11 * w, rz: 0.05, v: 0 }, { c: [0, lerp(D.waist, shTop, 0.5), -0.1 * w - 0.065], rx: 0.125 * w, rz: 0.065, v: 0.5 }, { c: [0, shTop - 0.03, -0.09 * w - 0.05], rx: 0.1 * w, rz: 0.05, v: 1 }], 8, { cap0: true, cap1: true }), mat(paintTex(64, 64, (g, W, H) => { const pc = this.o.packColor || '#c84a3a'; g.fillStyle = vgrad(g, H, [[0, lite(pc, 0.15)], [1, shade(pc, 0.2)]]); g.fillRect(0, 0, W, H); g.fillStyle = shade(pc, 0.25); g.fillRect(0, H * 0.55, W, H * 0.45); g.fillStyle = '#d8d4cc'; g.fillRect(0, H * 0.55, W, 2); g.fillRect(W * 0.03, H * 0.2, 2, H * 0.3); wrapShade(g, W, H, 0.3, 0); }))));
    if (acc.has('bag')) attach('torso', mesh(tube([{ c: [0.13 * w + 0.03, D.waist - 0.09, 0], rx: 0.03, rz: 0.06, v: 0 }, { c: [0.13 * w + 0.035, D.waist + 0.04, 0], rx: 0.035, rz: 0.065, v: 1 }], 8, { cap0: true, cap1: true }), mat(paintTex(32, 32, (g, W, H) => { const bc = this.o.bagColor || '#8a5a3a'; g.fillStyle = bc; g.fillRect(0, 0, W, H); g.fillStyle = shade(bc, 0.3); g.fillRect(0, 0, W, H * 0.4); g.fillStyle = '#d8c070'; g.fillRect(W * 0.45, H * 0.36, 3, 3); }))));
    void skin; void seed;
  }
  // ================================================================ hair
  hairBuild(hair, D, attach, seed, acc) {
    const st = hair.style; if (st === 'bald') return;
    const { chin, hs, k } = D, HY = (t) => chin + t * hs, S = (v) => v * hs, c = hair.color, r = rnd(seed + 11);
    const dk = hx(c).reduce((a, b) => a + b, 0) < 200, base = dk ? tone(c, 0.12) : c;
    const tex = paintTex(128, 128, (g, W, H) => {
      g.fillStyle = vgrad(g, H, [[0, lite(base, 0.18)], [0.35, base], [1, shade(base, 0.28)]]); g.fillRect(0, 0, W, H);
      for (let i = 0; i < 70; i++) { const x = r() * W; g.strokeStyle = rgba(r() < 0.6 ? shade(base, 0.4) : lite(base, 0.3), 0.35); g.lineWidth = 1 + r() * 1.5; g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + (r() - 0.5) * 10, H * 0.5, x + (r() - 0.5) * 6, H); g.stroke(); }
      // the angel ring: a broken band of shine high on the head
      for (let x = 0; x < W; x += 3) { const y = H * (0.3 + Math.sin(x * 0.2) * 0.025); if (Math.sin(x * 0.11 + 1) > -0.3) { g.fillStyle = rgba('#ffffff', dk ? 0.28 : 0.4); g.fillRect(x, y, 2, 4 + (x % 5)); } }
      wrapShade(g, W, H, 0.2);
    });
    const lockTex = paintTex(32, 64, (g, W, H) => {
      g.fillStyle = vgrad(g, H, [[0, shade(base, 0.25)], [0.4, base], [1, lite(base, 0.06)]]); g.fillRect(0, 0, W, H);
      g.fillStyle = rgba('#ffffff', dk ? 0.18 : 0.3); g.fillRect(W * 0.2, H * 0.55, W * 0.18, H * 0.3);
      g.strokeStyle = rgba(shade(base, 0.4), 0.5); g.lineWidth = 1; for (const x of [W * 0.5, W * 0.75]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    });
    const M = mat(tex), LM = mat(lockTex), geos = [];
    // the shell over the skull: its lower edge runs from the forehead hairline, over the temples, to the nape
    const thick = st === 'buzz' ? 0.003 : st === 'afro' ? 0.055 : st === 'slick' ? 0.012 : 0.02;
    const yFront = { short: 0.19, spiky: 0.185, long: 0.185, bob: 0.17, ponytail: 0.195, bun: 0.195, slick: 0.2, buzz: 0.2, afro: 0.18, mohawk: 1 }[st] ?? 0.19;
    const ySide = { long: 0.06, bob: 0.06, afro: 0.07 }[st] ?? 0.115, yBack = { long: 0.02, bob: 0.03, short: 0.05, spiky: 0.05 }[st] ?? 0.06;
    if (st !== 'mohawk') {
      const shell = (u, v) => {
        const a = (u - 0.5) * TAU, ca = Math.cos(a), yb = ca > 0 ? lerp(ySide, yFront, Math.pow(ca, 1.5)) : lerp(ySide, yBack, Math.pow(-ca, 0.8));
        const y = lerp(yb, 0.238, Math.pow(v, 0.85)), [, rx, rz, z] = headAt(Math.min(0.237, y)), grow = 1.06 + thick / 0.09;
        const top = v > 0.999 ? 0 : 1;
        return [S(Math.sin(a) * rx * grow * top), HY(y + (v > 0.97 ? thick * 0.6 : 0)), S(Math.cos(a) * rz * grow * top + z)];
      };
      const P = [], UV = [], I = [], nu = 16, nv = 7, Wn = nu + 1;
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { P.push(...shell(i / nu, j / nv)); UV.push(i / nu, j / nv); }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * Wn + i, b = a + 1, cc = a + Wn, d = cc + 1; I.push(a, b, d, a, d, cc); }
      attach('head', mesh(finish(P, UV, I, { W: Wn, rows: nv + 1 }), M));
    }
    const F = (x, y, z) => [S(x), HY(y), S(z)], L = (p0, p1, pc, w, d, o = {}) => geos.push(lock(F(...p0), F(...p1), F(...pc), S(w), S(d), o));
    const fz = (y) => { const [, , rz, z] = headAt(y); return rz + z; };
    // bangs over the forehead
    const bangs = (n, len, spread = 0.07, o = {}) => { for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : i / (n - 1) - 0.5, x = t * 2 * spread, l = len * (o.even ? 1 : 1 - Math.abs(t) * 0.5 + (i % 2) * 0.12), y0 = 0.205, z0 = fz(0.2) - 0.012; L([x * 0.7, y0, z0], [x * 1.12 + (o.swept ? 0.03 : 0), y0 - l, fz(y0 - l) + 0.014], [x * 0.95, y0 - l * 0.4, z0 + 0.034], 0.032, 0.011, { out: [0, 0.2, 1], tipW: o.even ? 0.55 : 0, segs: 3 }); } };
    const sides = (len, y0 = 0.17, o = {}) => { for (const s of [-1, 1]) { L([s * 0.078, y0, 0.03], [s * 0.098, y0 - len, 0.045], [s * 0.1, y0 - len * 0.4, 0.05], 0.026, 0.01, { out: [s, 0, 0.3], tipW: o.even ? 0.6 : 0, segs: 3 }); L([s * 0.088, y0 - 0.01, -0.02], [s * 0.104, y0 - len * 0.85, -0.01], [s * 0.11, y0 - len * 0.4, -0.01], 0.026, 0.01, { out: [s, 0, 0], segs: 3, tipW: o.even ? 0.6 : 0 }); } };
    const nape = (n, len, y0 = 0.1) => { for (let i = 0; i < n; i++) { const t = i / (n - 1) - 0.5, a = Math.PI + t * 1.8, x = Math.sin(a) * 0.085, z = Math.cos(a) * 0.09 - 0.01; L([x, y0 + 0.04, z * 0.9], [x * 1.15, y0 - len, z * 1.2], [x * 1.1, y0 - len * 0.3, z * 1.2], 0.03, 0.011, { out: [x, 0, z], segs: 3 }); } };
    if (st === 'short') { bangs(5, 0.075); sides(0.07); nape(4, 0.05); L([0.02, 0.235, 0.02], [0.05, 0.275, -0.03], [0.04, 0.27, 0.02], 0.025, 0.01, { out: [0, 1, 0] }); }
    if (st === 'spiky') {
      bangs(5, 0.09, 0.07); sides(0.075); nape(5, 0.07);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + 0.4, x = Math.sin(a) * 0.06, z = Math.cos(a) * 0.065 - 0.02; L([x * 0.7, 0.22, z * 0.7], [x * 1.9, 0.3 - Math.max(0, Math.cos(a)) * 0.04, z * 1.9 - 0.03], [x * 1.4, 0.29, z * 1.3], 0.035, 0.012, { out: [x, 0.6, z], segs: 3 }); }
    }
    if (st === 'long') { bangs(6, 0.1, 0.075); sides(0.2, 0.17); for (let i = 0; i < 6; i++) { const t = i / 5 - 0.5, a = Math.PI + t * 2.2, x = Math.sin(a) * 0.09, z = Math.cos(a) * 0.095 - 0.01; L([x, 0.16, z], [x * 1.25, -0.2 - (i % 2) * 0.03, z * 1.25 - 0.02], [x * 1.3, 0.0, z * 1.4], 0.05, 0.014, { out: [x, 0, z], segs: 4 }); } }
    if (st === 'bob') { bangs(6, 0.085, 0.075, { even: true }); sides(0.12, 0.17, { even: true }); nape(6, 0.07, 0.11); }
    if (st === 'ponytail') { bangs(5, 0.08); sides(0.09); }
    if (st === 'bun') { bangs(5, 0.07); sides(0.08); }
    if (st === 'slick') { L([0, 0.205, fz(0.2) - 0.02], [0, 0.25, -0.03], [0, 0.26, 0.05], 0.06, 0.02, { out: [0, 1, 0.3], segs: 3, bulge: 0.2 }); sides(0.05); nape(4, 0.04); }
    if (st === 'mohawk') for (let i = 0; i < 7; i++) { const z = 0.08 - i * 0.03, y = Math.sqrt(Math.max(0, 1 - (z / 0.11) ** 2)) * 0.1 + 0.15; L([0, y + 0.02, z], [0, y + 0.13 - Math.abs(i - 2) * 0.012, z - 0.04], [0, y + 0.1, z], 0.018, 0.035, { out: [1, 0, 0], segs: 3 }); }
    if (st === 'afro') for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, x = Math.sin(a) * 0.12, z = Math.cos(a) * 0.12 - 0.01; geos.push(new THREE.IcosahedronGeometry(S(0.06), 0).translate(...F(x, 0.18 + (i % 3) * 0.02, z))); }
    if (geos.length) attach('head', mesh(mergeGeo(geos.map(addIndex)), LM));
    // ponytail / bun on their own bone (springy)
    if (st === 'ponytail' || st === 'bun') {
      const piv = F(0, 0.17, -0.105); const g = new THREE.Group();
      this.bones.head.add(g); g.position.set(piv[0] - this.pivotsM.head[0], piv[1] - this.pivotsM.head[1], piv[2] - this.pivotsM.head[2]);
      this.bones.tail = g; this.order.push('tail'); this.pivotsM.tail = piv; this.pivots.tail = piv.map((v) => v / U); this.rest.tail = { p: g.position.clone(), r: g.rotation.clone(), s: g.scale.clone() };
      const tg = st === 'bun' ? new THREE.IcosahedronGeometry(S(0.05), 1).translate(...F(0, 0.2, -0.12)) : mergeGeo([lock(F(0, 0.17, -0.1), F(0, -0.12, -0.16), F(0, 0.1, -0.2), S(0.04), S(0.03), { out: [0, 0, -1], segs: 5, bulge: 0.3 }), new THREE.TorusGeometry(S(0.022), S(0.008), 4, 8).translate(...F(0, 0.17, -0.105))].map(addIndex));
      const m = mesh(tg, LM); m.position.set(-piv[0], -piv[1], -piv[2]); g.add(m);
    }
    void k; void acc;
  }
  headgear(o, acc, D, attach) {
    const { chin, hs } = D, HY = (t) => chin + t * hs, S = (v) => v * hs, F = (x, y, z) => [S(x), HY(y), S(z)];
    if (acc.has('cap')) {
      const cc = o.capColor || '#c83a3a', rings = [];
      for (let i = 0; i <= 4; i++) { const t = i / 4, y = lerp(0.17, 0.25, Math.sin(t * Math.PI / 2)), [, rx, rz, z] = headAt(Math.min(0.237, y)); rings.push({ c: [0, HY(y), S(z)], rx: S(rx * 1.13 + 0.006) * (1 - t * t * 0.98), rz: S(rz * 1.13 + 0.006) * (1 - t * t * 0.98), v: t }); }
      attach('head', mesh(tube(rings, 14, { cap1: true }), mat(paintTex(64, 32, (g, W, H) => { g.fillStyle = vgrad(g, H, [[0, lite(cc, 0.15)], [1, shade(cc, 0.15)]]); g.fillRect(0, 0, W, H); g.fillStyle = '#f0ece4'; g.beginPath(); g.arc(W / 2, H * 0.55, 5, 0, TAU); g.fill(); g.fillStyle = shade(cc, 0.3); for (let i = 1; i < 6; i++) g.fillRect((i / 6) * W, 0, 1, H); }))));
      const brim = tube([{ c: [0, HY(0.18), S(0.1)], rx: S(0.075), rz: S(0.02), v: 0 }, { c: [0, HY(0.17), S(0.17)], rx: S(0.07), rz: S(0.045), v: 1 }], 10, { cap1: true });
      attach('head', mesh(brim, mat(paintTex(16, 16, (g, W, H) => { g.fillStyle = shade(cc, 0.12); g.fillRect(0, 0, W, H); }))));
    }
    if (acc.has('beanie')) {
      const bc = o.capColor || '#3a4a6a', rings = [];
      for (let i = 0; i <= 5; i++) { const t = i / 5, y = lerp(0.16, 0.262, Math.sin(t * Math.PI / 2)), [, rx, rz, z] = headAt(Math.min(0.237, y)); rings.push({ c: [0, HY(y), S(z)], rx: S(rx * 1.16 + 0.008) * (1 - t * t * 0.96), rz: S(rz * 1.16 + 0.008) * (1 - t * t * 0.96), v: t }); }
      attach('head', mesh(tube(rings, 14, { cap1: true }), mat(paintTex(64, 48, (g, W, H) => { g.fillStyle = vgrad(g, H, [[0, lite(bc, 0.1)], [0.6, bc], [0.75, shade(bc, 0.2)], [1, shade(bc, 0.12)]]); g.fillRect(0, 0, W, H); g.fillStyle = rgba(shade(bc, 0.4), 0.5); for (let x = 0; x < W; x += 3) g.fillRect(x, 0, 1, H); g.fillStyle = rgba(lite(bc, 0.3), 0.35); for (let x = 1; x < W; x += 3) g.fillRect(x, 0, 1, H); g.fillStyle = shade(bc, 0.3); g.fillRect(0, H * 0.72, W, 2); }))));
      attach('head', mesh(new THREE.IcosahedronGeometry(S(0.03), 1).translate(...F(0, 0.275, -0.01)), mat(paintTex(8, 8, (g) => { g.fillStyle = lite(bc, 0.35); g.fillRect(0, 0, 8, 8); }))));
    }
    if (acc.has('headphones')) {
      for (const s of [-1, 1]) attach('head', mesh(tube([{ c: [s * S(0.098), HY(0.1), 0], rx: S(0.012), rz: S(0.03), v: 0 }, { c: [s * S(0.115), HY(0.1), 0], rx: S(0.012), rz: S(0.03), v: 1 }], 10, { cap0: true, cap1: true }).rotateZ(0), mat(paintTex(16, 16, (g, W, H) => { g.fillStyle = o.phoneColor || '#e8603a'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a2a32'; g.fillRect(0, 0, W, 4); }))));
      const pts = []; for (let i = 0; i <= 8; i++) { const a = (i / 8 - 0.5) * Math.PI; pts.push(F(Math.sin(a) * 0.112, 0.12 + Math.cos(a) * 0.15, 0)); }
      attach('head', mesh(mergeGeo(pts.slice(1).map((p, i) => lock(pts[i], p, pts[i].map((v, j) => (v + p[j]) / 2), S(0.008), S(0.012), { segs: 1, tipW: 1, out: [0, 1, 0] }))), mat(paintTex(4, 4, (g) => { g.fillStyle = '#2a2a32'; g.fillRect(0, 0, 4, 4); }))));
    }
    if (acc.has('headband')) { const rings = [0.19, 0.215].map((y, i) => { const [, rx, rz, z] = headAt(y); return { c: [0, HY(y), S(z)], rx: S(rx * 1.16 + 0.008), rz: S(rz * 1.16 + 0.008), v: i }; }); attach('head', mesh(tube(rings, 14), mat(paintTex(32, 8, (g, W, H) => { g.fillStyle = o.bandColor || '#f0ece4'; g.fillRect(0, 0, W, H); })))); }
    if (acc.has('earring')) attach('head', mesh(new THREE.OctahedronGeometry(S(0.008)).translate(S(0.093), HY(0.06), S(-0.005)), mat(paintTex(4, 4, (g) => { g.fillStyle = '#ffd850'; g.fillRect(0, 0, 4, 4); }))));
  }

  // ================================================================ the face (painted, per expression)
  paintFace() {
    this.faceDirty = false;
    const g = this.faceCv.getContext('2d'), W = this.faceCv.width, H = this.faceCv.height, F = this.faceMap, o = this.faceO, st = this.face;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    // face space: metres at head scale 1, x right (the character's left), y up from the chin
    const sx = W / (F.x1 - F.x0), sy = H / (F.y1 - F.y0);
    g.setTransform(sx, 0, 0, -sy, -F.x0 * sx, H + F.y0 * sy);
    const eyesSt = st.eyes, gz = { c: [0, 0], l: [-1, 0], r: [1, 0], u: [0, 1], d: [0, -1], ul: [-0.8, 0.6], ur: [0.8, 0.6] }[st.gaze] || [0, 0];
    // blush (soft), freckles, stubble / beard, nose
    const blush = o.blushK * (eyesSt === 'happy' || st.mouth === 'laugh' ? 1.8 : 1) * (st.brows === 'sad' ? 1.3 : 1);
    for (const s of [-1, 1]) { const gr = g.createRadialGradient(s * 0.05, 0.075, 0.001, s * 0.05, 0.075, 0.024); gr.addColorStop(0, rgba('#ff7a8a', blush)); gr.addColorStop(1, rgba('#ff7a8a', 0)); g.fillStyle = gr; g.fillRect(s * 0.05 - 0.03, 0.045, 0.06, 0.06); }
    if (o.freckles) { const r = rnd(7); g.fillStyle = rgba(shade(o.skin, 0.35), 0.7); for (let i = 0; i < 14; i++) { const s = i % 2 ? 1 : -1; g.beginPath(); g.arc(s * (0.035 + r() * 0.03), 0.07 + r() * 0.02, 0.0012, 0, TAU); g.fill(); } }
    if (o.beard) {
      const bc = o.beardColor, r = rnd(5);
      if (o.beard === 'stubble') { g.fillStyle = rgba(bc, 0.07); g.beginPath(); g.moveTo(-0.08, 0.07); g.quadraticCurveTo(-0.06, -0.008, 0, -0.01); g.quadraticCurveTo(0.06, -0.008, 0.08, 0.07); g.lineTo(0.05, 0.06); g.quadraticCurveTo(0, 0.05, -0.05, 0.06); g.closePath(); g.fill(); for (let i = 0; i < 260; i++) { const x = (r() - 0.5) * 0.15, y = r() * 0.07 - 0.008; if (Math.abs(x) < 0.02 && y > 0.03 && y < 0.05) continue; if (y > 0.07 - Math.abs(x) * 0.25) continue; g.fillStyle = rgba(bc, 0.35); g.fillRect(x, y, 0.0012, 0.0012); } }
      else {
        g.fillStyle = bc;
        if (o.beard === 'full') { g.beginPath(); g.moveTo(-0.09, 0.09); g.quadraticCurveTo(-0.075, 0.0, -0.02, -0.022); g.quadraticCurveTo(0, -0.03, 0.02, -0.022); g.quadraticCurveTo(0.075, 0.0, 0.09, 0.09); g.lineTo(0.075, 0.09); g.quadraticCurveTo(0.055, 0.04, 0.02, 0.028); g.quadraticCurveTo(0, 0.022, -0.02, 0.028); g.quadraticCurveTo(-0.055, 0.04, -0.075, 0.09); g.closePath(); g.fill(); }
        if (o.beard === 'goatee') { g.beginPath(); g.ellipse(0, 0.012, 0.014, 0.02, 0, 0, TAU); g.fill(); }
        // the moustache: two swept halves over the lip
        for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 0.002, 0.054); g.quadraticCurveTo(s * 0.016, 0.06, s * 0.026, 0.046); g.quadraticCurveTo(s * 0.014, 0.05, s * 0.002, 0.049); g.closePath(); g.fill(); }
        g.strokeStyle = rgba(lite(bc, 0.4), 0.6); g.lineWidth = 0.0009; for (let i = 0; i < 40; i++) { const x = (r() - 0.5) * 0.14, y = r() * 0.08 - 0.02; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 0.004, y - 0.008); g.stroke(); }
      }
    }
    g.strokeStyle = rgba(shade(o.skin, 0.4), 0.85); g.lineWidth = 0.0016; g.lineCap = 'round'; g.beginPath(); g.moveTo(0.003, 0.082); g.lineTo(0.005, 0.071); g.lineTo(0.001, 0.069); g.stroke();
    // eyes, brows, mouth
    for (const s of [-1, 1]) this.eye(g, s, eyesSt, gz, o);
    for (const s of [-1, 1]) this.brow(g, s, st.brows, o, eyesSt);
    this.mouth(g, st.mouth, o);
    if (o.glasses) this.glasses(g, o);
    this.faceTex.needsUpdate = true;
  }
  eye(g, s, state, gz, o) {
    const ex = s * 0.044, ey = 0.1, w = o.shape === 'round' ? 0.044 : 0.047, sharp = o.shape === 'sharp', narrow = o.shape === 'narrow';
    let h = o.shape === 'round' ? 0.054 : narrow ? 0.034 : 0.048; if (state === 'wide') h *= 1.15;
    const line = '#1e1018', lash = o.lashes ? 0.0042 : o.thick ? 0.004 : 0.0034;
    g.save(); g.translate(ex, ey); g.scale(s, 1);          // canonical eye: inner corner toward −x, outer toward +x
    if (state === 'closed' || state === 'happy') {
      g.strokeStyle = line; g.lineWidth = lash; g.lineCap = 'round'; g.beginPath();
      if (state === 'happy') { g.moveTo(-w * 0.45, -h * 0.05); g.quadraticCurveTo(0, h * 0.42, w * 0.5, -h * 0.02); }
      else { g.moveTo(-w * 0.45, 0); g.quadraticCurveTo(0, -h * 0.28, w * 0.52, h * 0.04); if (o.lashes) { g.moveTo(w * 0.45, h * 0.0); g.lineTo(w * 0.6, -h * 0.12); } }
      g.stroke(); g.restore(); return;
    }
    // lid lines: the upper lid (with an outer flick), the lower lid; the state cuts the upper lid
    const cut = { angry: [0.32, -0.12], sad: [-0.22, 0.2], half: [0.34, 0.34], smug: [0.28, 0.32] }[state] || [0, 0];   // [inner, outer] drop as a fraction of h
    const top = (x) => { const t = (x / w + 0.5); let y = h * 0.5 * Math.sin(Math.PI * cl(t * 0.92 + 0.04)) - (sharp ? (1 - t) * h * 0.08 : 0); y -= lerp(cut[0], cut[1], t) * h; return y + (narrow ? -h * 0.02 : 0); };
    const bot = (x) => { const t = (x / w + 0.5); return -h * 0.5 * Math.sin(Math.PI * cl(t)) * (narrow ? 0.8 : 0.92) + h * 0.06; };
    const N = 18, xs = []; for (let i = 0; i <= N; i++) xs.push(-w / 2 + (i / N) * w);
    const shape = () => { g.beginPath(); xs.forEach((x, i) => (i ? g.lineTo(x, top(x)) : g.moveTo(x, top(x)))); for (let i = N; i >= 0; i--) g.lineTo(xs[i], bot(xs[i])); g.closePath(); };
    // sclera with the lid's shadow
    shape(); g.save(); g.clip();
    let gr = g.createLinearGradient(0, h * 0.5, 0, -h * 0.5); gr.addColorStop(0, '#b8b4d0'); gr.addColorStop(0.35, '#f4f2f8'); gr.addColorStop(1, '#ffffff'); g.fillStyle = gr; g.fillRect(-w, -h, w * 2, h * 2);
    // iris: big and tall, dark at the top, bright at the bottom, a dark rim, the pupil, two hard glints
    const ix = gz[0] * s * w * 0.16, iy = gz[1] * h * 0.1 - h * 0.04, irx = w * (state === 'wide' ? 0.26 : 0.34), iry = h * (state === 'wide' ? 0.36 : 0.5);
    const ir = o.iris;
    gr = g.createLinearGradient(0, iy + iry, 0, iy - iry); gr.addColorStop(0, shade(ir, 0.62)); gr.addColorStop(0.45, ir); gr.addColorStop(0.85, lite(ir, 0.45)); gr.addColorStop(1, lite(ir, 0.6));
    g.fillStyle = gr; g.beginPath(); g.ellipse(ix, iy, irx, iry, 0, 0, TAU); g.fill();
    g.strokeStyle = shade(ir, 0.7); g.lineWidth = 0.0016; g.stroke();
    g.fillStyle = rgba(shade(ir, 0.8), 0.92); g.beginPath(); g.ellipse(ix, iy + iry * 0.08, irx * (state === 'wide' ? 0.35 : 0.48), iry * (state === 'wide' ? 0.35 : 0.52), 0, 0, TAU); g.fill();
    g.fillStyle = rgba(lite(ir, 0.7), 0.5); g.beginPath(); g.ellipse(ix, iy - iry * 0.55, irx * 0.6, iry * 0.22, 0, 0, TAU); g.fill();   // the lit lower crescent
    // highlights (same side on both eyes: the light comes from the viewer's upper left)
    g.restore(); g.save(); shape(); g.clip();
    const hlx = (-0.3 * s) * w + ix, hly = iy + iry * 0.38;
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(hlx, hly, w * 0.11, h * 0.13, -0.3, 0, TAU); g.fill();
    g.beginPath(); g.arc(ix + 0.28 * s * w, iy - iry * 0.4, w * 0.045, 0, TAU); g.fill();
    if (state === 'sad') { g.fillStyle = rgba('#e8f4ff', 0.75); g.beginPath(); g.ellipse(0, -h * 0.32, w * 0.4, h * 0.08, 0, 0, TAU); g.fill(); }
    g.restore();
    // lash line: thick on top (thicker toward the outer corner) with a flick; a short lower lash; a crease
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = line;
    for (let i = 0; i < N; i++) { const x0 = xs[i], x1 = xs[i + 1], t = i / N; g.lineWidth = lash * (0.55 + t * 0.75); g.beginPath(); g.moveTo(x0, top(x0)); g.lineTo(x1, top(x1)); g.stroke(); }
    g.lineWidth = lash * 1.1; g.beginPath(); g.moveTo(w * 0.42, top(w * 0.42)); g.quadraticCurveTo(w * 0.6, top(w * 0.5) + h * 0.02, w * 0.66, top(w * 0.5) + (o.lashes ? h * 0.16 : h * 0.06)); g.stroke();
    if (o.lashes) { g.lineWidth = lash * 0.6; for (const t of [0.72, 0.86]) { const x = (t - 0.5) * w; g.beginPath(); g.moveTo(x, top(x)); g.lineTo(x + w * 0.12, top(x) + h * 0.14); g.stroke(); } }
    g.strokeStyle = rgba('#3a1a24', 0.85); g.lineWidth = lash * 0.45; g.beginPath(); g.moveTo(w * 0.05, bot(w * 0.05)); for (let i = 0; i <= 8; i++) { const x = w * (0.05 + i * 0.05); g.lineTo(x, bot(x)); } g.stroke();
    if (!narrow && state !== 'angry' && state !== 'half' && state !== 'smug') { g.strokeStyle = rgba(shade(o.skin, 0.38), 0.7); g.lineWidth = 0.0011; g.beginPath(); g.moveTo(-w * 0.2, top(-w * 0.2) + h * 0.13); g.quadraticCurveTo(w * 0.1, top(0) + h * 0.2, w * 0.42, top(w * 0.42) + h * 0.1); g.stroke(); }
    g.restore();
  }
  brow(g, s, state, o, eyes) {
    const bx = s * 0.045, by = 0.142 + (state === 'up' ? 0.009 : 0) + (eyes === 'wide' ? 0.006 : 0), w = 0.04;
    const prof = { calm: [0, 0.004, 0], angry: [-0.009, 0.0, 0.006], sad: [0.007, 0.004, -0.004], up: [0.002, 0.007, 0.0] }[state] || [0, 0.004, 0];   // [inner, mid, outer] lift
    g.save(); g.translate(bx, by); g.scale(s, 1);
    g.fillStyle = o.brow; g.beginPath();
    const th = o.thick ? 0.0042 : o.fem ? 0.0024 : 0.0032;
    g.moveTo(-w / 2, prof[0]); g.quadraticCurveTo(0, prof[1] + th * 0.6, w / 2, prof[2] - 0.002);
    g.quadraticCurveTo(0, prof[1] - th, -w / 2, prof[0] - th); g.closePath(); g.fill();
    g.restore();
  }
  mouth(g, state, o) {
    const my = 0.042, lip = shade(o.skin, 0.45), dark = '#4a1420', tongue = '#e0707a', teeth = '#fbf8f4';
    g.save(); g.translate(0, my); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = rgba(lip, 0.95); g.lineWidth = 0.0018;
    const open = (w, h, flatTop, k = 1) => {
      g.beginPath(); if (flatTop) { g.moveTo(-w, h * 0.15); g.quadraticCurveTo(0, h * 0.3, w, h * 0.15); g.quadraticCurveTo(w * 0.9, -h, 0, -h); g.quadraticCurveTo(-w * 0.9, -h, -w, h * 0.15); }
      else g.ellipse(0, -h * 0.35, w, h * 0.6, 0, 0, TAU);
      g.closePath(); g.fillStyle = dark; g.fill(); g.save(); g.clip();
      g.fillStyle = tongue; g.beginPath(); g.ellipse(0, -h * 0.95, w * 0.7, h * 0.45, 0, 0, TAU); g.fill();
      if (k) { g.fillStyle = teeth; g.fillRect(-w, h * 0.0, w * 2, h * 0.22 * k); }
      g.restore(); g.stroke();
    };
    if (state === 'closed') { g.beginPath(); g.moveTo(-0.007, 0.0005); g.quadraticCurveTo(0, -0.0012, 0.007, 0.0005); g.stroke(); }
    else if (state === 'smile') { g.beginPath(); g.moveTo(-0.011, 0.003); g.quadraticCurveTo(0, -0.007, 0.011, 0.003); g.stroke(); }
    else if (state === 'frown') { g.beginPath(); g.moveTo(-0.009, -0.003); g.quadraticCurveTo(0, 0.004, 0.009, -0.003); g.stroke(); }
    else if (state === 'smirk') { g.beginPath(); g.moveTo(-0.008, 0); g.quadraticCurveTo(0.002, -0.002, 0.011, 0.005); g.stroke(); }
    else if (state === 'grin') { open(0.014, 0.008, true, 1.6); }
    else if (state === 'open') open(0.007, 0.009, true, 0);
    else if (state === 'o') { g.beginPath(); g.ellipse(0, -0.003, 0.0045, 0.006, 0, 0, TAU); g.fillStyle = dark; g.fill(); g.stroke(); }
    else if (state === 'shout') open(0.013, 0.018, false, 1);
    else if (state === 'laugh') open(0.013, 0.015, true, 0.8);
    else { g.beginPath(); g.moveTo(-0.007, 0); g.lineTo(0.007, 0); g.stroke(); }
    g.restore();
  }
  glasses(g, o) {
    const dark = o.glasses === 'dark';
    g.save(); g.strokeStyle = o.frame; g.lineWidth = 0.0028; g.lineJoin = 'round';
    for (const s of [-1, 1]) { g.beginPath(); g.roundRect ? g.roundRect(s * 0.041 - 0.025, 0.088, 0.05, 0.036, 0.008) : g.rect(s * 0.041 - 0.025, 0.088, 0.05, 0.036); if (dark) { g.fillStyle = 'rgba(16,18,28,0.92)'; g.fill(); } else { g.fillStyle = 'rgba(220,235,255,0.12)'; g.fill(); } g.stroke(); if (dark || true) { g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.0016; g.beginPath(); g.moveTo(s * 0.041 - 0.016, 0.118); g.lineTo(s * 0.041 - 0.004, 0.096); g.stroke(); g.strokeStyle = o.frame; g.lineWidth = 0.0028; } }
    g.beginPath(); g.moveTo(-0.016, 0.112); g.quadraticCurveTo(0, 0.118, 0.016, 0.112); g.stroke();
    g.restore();
  }
}
const pantsLong = (bot) => bot.kind === 'jeans' || bot.kind === 'slacks' || bot.kind === 'track';
function addIndex(g) {
  if (g.index) { if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (!g.attributes.normal) g.computeVertexNormals(); return g; }
  const n = g.attributes.position.count, I = []; for (let i = 0; i < n; i++) I.push(i); g.setIndex(I);
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2).fill(0.5), 2));
  if (!g.attributes.normal) g.computeVertexNormals();
  return g;
}
