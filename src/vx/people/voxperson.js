// People as sculpted voxel chibis (1.6 cm voxels): rounded heads with a tapering jaw,
// sculpted hair with locks and a shine band, detailed outfits (seams, zips, pockets,
// prints, ribbing, laces) and accessories, meshed with soft corner occlusion. Faces
// are crisp 2D paintings at high resolution — eyes, brows and mouth on thin planes,
// one per expression state — so a voxel character can act like an anime one.
// The rig matches person.js, so the same acting clips drive it (Animator).
import * as THREE from '../../../vendor/three.module.js';
import { Fine } from '../fine.js';
import { acting } from './person.js';
import { Pen, newSurf, shift } from '../../px/paint.js';

const VPM = 64, U = 1 / 16;
const cl = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const sst = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// signed distances (metres)
const rbox = (x, y, z, hx, hy, hz, r) => { const qx = Math.abs(x) - hx + r, qy = Math.abs(y) - hy + r, qz = Math.abs(z) - hz + r; return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r; };
const ell = (x, y, z, rx, ry, rz) => { const k0 = Math.hypot(x / rx, y / ry, z / rz), k1 = Math.hypot(x / (rx * rx), y / (ry * ry), z / (rz * rz)); return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1; };
function cap(x, y, z, a, b, r) { const px = x - a[0], py = y - a[1], pz = z - a[2], bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2]; const h = cl((px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz)); return Math.hypot(px - bx * h, py - by * h, pz - bz * h) - (Array.isArray(r) ? r[0] + (r[1] - r[0]) * h : r); }
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const hash = (x, y, z) => { let h = (Math.round(x * 997) * 374761393 + Math.round(y * 991) * 668265263 + Math.round(z * 983) * 2147483647) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

const BODY = {
  //        hip   torso  shoulderW waistW depth  head(w, h, d)        arm   leg r   scale
  kid:   { hip: 0.36, T: 0.24, sw: 0.25, ww: 0.21, d: 0.14, hw: 0.205, hh: 0.215, hd: 0.2, arm: 0.22, lr: 0.052 },
  teen:  { hip: 0.48, T: 0.30, sw: 0.30, ww: 0.24, d: 0.15, hw: 0.21, hh: 0.225, hd: 0.205, arm: 0.28, lr: 0.058 },
  adult: { hip: 0.54, T: 0.33, sw: 0.33, ww: 0.26, d: 0.16, hw: 0.21, hh: 0.228, hd: 0.205, arm: 0.31, lr: 0.062 },
  tall:  { hip: 0.6, T: 0.35, sw: 0.33, ww: 0.25, d: 0.16, hw: 0.21, hh: 0.23, hd: 0.205, arm: 0.34, lr: 0.06 },
  big:   { hip: 0.5, T: 0.36, sw: 0.44, ww: 0.42, d: 0.27, hw: 0.225, hh: 0.235, hd: 0.215, arm: 0.32, lr: 0.075, belly: 0.06 },
  old:   { hip: 0.5, T: 0.32, sw: 0.31, ww: 0.27, d: 0.17, hw: 0.21, hh: 0.225, hd: 0.205, arm: 0.3, lr: 0.06, stoop: 0.02 },
};

// ---------------------------------------------------------------- voxelize a part
const MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
function voxPart(bounds, sdf, color) {
  const [x0, y0, z0, x1, y1, z1] = bounds;
  const X = Math.max(1, Math.ceil((x1 - x0) * VPM)), Y = Math.max(1, Math.ceil((y1 - y0) * VPM)), Z = Math.max(1, Math.ceil((z1 - z0) * VPM));
  const v = new Fine(X, Y, Z, VPM);
  for (let j = 0; j < Y; j++) for (let k = 0; k < Z; k++) for (let i = 0; i < X; i++) {
    const x = x0 + (i + 0.5) / VPM, y = y0 + (j + 0.5) / VPM, z = z0 + (k + 0.5) / VPM;
    if (sdf(x, y, z) > 0) continue;
    const c = color(x, y, z); if (c) v.set(i, j, k, v.c(c));
  }
  const out = new THREE.Group(), g = v.mesh();
  for (const geo of g.opaque) { geo.translate(x0, y0, z0); const m = new THREE.Mesh(geo, MAT); m.castShadow = m.receiveShadow = true; out.add(m); }
  return out;
}

// ---------------------------------------------------------------- faces (2D, 240 texels per metre)
const FPM = 240, INK = '#1c1418';
function facePlane(w, h, paint) {
  const W = Math.round(w * FPM), H = Math.round(h * FPM), s = newSurf(W, H), p = new Pen(s, 5); paint(p, W, H); s.touch && s.touch();
  const t = new THREE.CanvasTexture(s.canvas()); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5 }));
  m.material.userData.keep = false; m.castShadow = false; m.receiveShadow = true; return m;
}
// an eye 18 × 12 texels: soft sclera, ringed iris with two glints, a thick lash line with an outer flick
function eye(state, o, side) {
  return (p, W, H) => {
    const ir = o.iris || '#4a3424', lid = INK, sk = o.skin, inner = (x) => (side < 0 ? x / (W - 1) : 1 - x / (W - 1));
    if (state === 'closed' || state === 'happy') {
      for (let x = 1; x < W - 1; x++) { const t = (x - 1) / (W - 3), y = state === 'happy' ? Math.round(H * 0.62 - Math.sin(t * Math.PI) * H * 0.32) : Math.round(H * 0.5 + Math.sin(t * Math.PI) * 1.4); p.px(x, y, lid); p.px(x, y + 1, lid); }
      if (state === 'closed') for (let k = 0; k < 3; k++) p.px(side < 0 ? 1 + k : W - 2 - k, Math.round(H * 0.5) + 2 + (k >> 1), shift(sk, -0.3));
      return;
    }
    const sharp = o.shape === 'sharp', narrow = o.shape === 'narrow' || state === 'half', round = o.shape === 'round' || state === 'wide';
    const top = (x) => { const t = (x + 0.5) / W, arc = Math.sin(t * Math.PI); let y = H * (narrow ? 0.42 : round ? 0.12 : 0.22) - arc * H * (round ? 0.12 : 0.16); if (sharp) y += (1 - inner(x)) * 1.2 - inner(x) * 0.8; if (state === 'angry') y += inner(x) * H * 0.32; if (state === 'sad') y += (1 - inner(x)) * H * 0.26; return Math.max(0, Math.round(y)); };
    const bot = (x) => { const t = (x + 0.5) / W; return Math.min(H - 1, Math.round(H * (round ? 0.94 : 0.86) - (1 - Math.sin(t * Math.PI)) * H * 0.3 - (sharp ? (1 - inner(x)) * 1.5 : 0))); };
    // sclera
    for (let x = 1; x < W - 1; x++) for (let y = top(x) + 1; y < bot(x); y++) p.px(x, y, y <= top(x) + 2 ? '#d6d4e0' : '#f8f6f2');
    // iris
    const cx = W / 2 - 0.5 + (o.look || 0), cy = H * (round ? 0.56 : 0.58), rx = W * (state === 'wide' ? 0.17 : 0.24), ry = H * (state === 'wide' ? 0.26 : 0.4);
    for (let x = 1; x < W - 1; x++) for (let y = top(x) + 1; y < bot(x); y++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d > 1) continue;
      const t = (y - (cy - ry)) / (2 * ry);
      p.px(x, y, d > 0.72 ? shift(ir, -0.45) : t < 0.35 ? shift(ir, -0.25) : t > 0.75 ? shift(ir, 0.3) : ir);
      if (d < (state === 'wide' ? 0.12 : 0.22)) p.px(x, y, '#0e0a0c');
    }
    // glints
    const gx = Math.round(cx + rx * 0.35), gy = Math.round(cy - ry * 0.45); p.px(gx, gy, '#ffffff'); p.px(gx + 1, gy, '#ffffff'); p.px(gx, gy + 1, '#ffffff');
    if (state !== 'angry') p.px(Math.round(cx - rx * 0.4), Math.round(cy + ry * 0.45), '#e8e4f0');
    // lash line, outer flick, crease, lower lid
    for (let x = 0; x < W; x++) { const y = top(x); p.px(x, y, lid); if (x > 1 && x < W - 2) p.px(x, y + 1 <= bot(x) ? y : y, lid); p.px(x, Math.max(0, y - 1), x > 1 && x < W - 2 && o.thick ? lid : 0); }
    for (let x = 0; x < W; x++) p.px(x, Math.max(0, top(x) - (o.thick ? 1 : 0)), lid);
    const ox = side < 0 ? 0 : W - 1, fl = side < 0 ? -1 : 1;
    if (o.lashes) { p.px(ox, Math.max(0, top(ox) - 1), lid); p.px(ox - fl, Math.max(0, top(ox) - 2), lid); }
    else p.px(ox, Math.max(0, top(ox) - 1), lid);
    if (state !== 'angry' && !narrow) for (let x = 3; x < W - 3; x++) p.px(x, Math.max(0, top(x) - 3), shift(sk, -0.18));            // double-lid crease
    for (let x = 3; x < W - 3; x++) p.px(x, bot(x), shift(sk, -0.28));
    p.px(side < 0 ? W - 2 : 1, bot(side < 0 ? W - 2 : 1) - 1, shift(sk, -0.2));
  };
}
function brow(state, c, side, thick) {
  return (p, W, H) => {
    for (let x = 0; x < W; x++) {
      const t = side < 0 ? x / (W - 1) : 1 - x / (W - 1);            // 1 = inner end
      let y = H * 0.5 - Math.sin((1 - t) * Math.PI * 0.9) * H * 0.18;
      if (state === 'angry') y = H * 0.25 + t * H * 0.5; if (state === 'sad') y = H * 0.7 - t * H * 0.45; if (state === 'up') y = H * 0.35 - Math.sin((1 - t) * Math.PI) * H * 0.25;
      const w = Math.max(1, Math.round((thick ? 3 : 2) * (0.55 + t * 0.6)));
      for (let k = 0; k < w; k++) p.px(x, Math.round(y) + k - (w >> 1), k === 0 ? shift(c, 0.12) : c);
    }
  };
}
function mouth(state, sk, o) {
  return (p, W, H) => {
    const lip = shift(sk, -0.32), dark = '#3a1216', tongue = '#d8606a', teeth = '#f6f4ee', cx = W / 2 - 0.5, cy = Math.round(H * 0.45);
    const curve = (k, w, c, th = 1) => { for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++) { const t = (x - cx) / w, y = Math.round(cy - k * (1 - t * t) + (k < 0 ? 0 : 0)); for (let j = 0; j < th; j++) p.px(x, y + j, c); } };
    if (state === 'closed') { curve(0, W * 0.2, lip); p.px(Math.round(cx), cy + 2, shift(sk, -0.12)); return; }
    if (state === 'smile') { curve(-2, W * 0.24, lip); return; }
    if (state === 'frown') { curve(1.6, W * 0.2, lip); return; }
    if (state === 'smirk') { for (let x = Math.round(cx - W * 0.18); x <= Math.round(cx + W * 0.22); x++) p.px(x, cy - (x > cx + 1 ? Math.round((x - cx) * 0.4) : 0), lip); return; }
    if (state === 'grin') { for (let x = Math.round(cx - W * 0.28); x <= Math.round(cx + W * 0.28); x++) { const t = (x - cx) / (W * 0.28), yb = Math.round(cy + 2 - t * t * 2); p.px(x, cy - 1, lip); for (let y = cy; y < yb; y++) p.px(x, y, teeth); p.px(x, yb, lip); } return; }
    const big = state === 'shout' || state === 'laugh', ow = big ? W * 0.26 : state === 'o' ? W * 0.12 : W * 0.18, oh = big ? H * 0.75 : state === 'o' ? H * 0.5 : H * 0.36;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = ((x - cx) / ow) ** 2 + ((y - (cy + oh * 0.3)) / (oh * 0.6)) ** 2; if (d > 1) continue;
      p.px(x, y, d > 0.8 ? lip : big && y < cy + 1 ? teeth : big && y > cy + oh * 0.55 ? tongue : dark);
    }
  };
}

// ---------------------------------------------------------------- the person
export class VoxPerson {
  constructor(o) {
    this.o = o; const B = { ...BODY[o.build || 'teen'], ...(o.dims || {}) };
    const skin = o.skin || '#e6b48e', top = { kind: 'tee', color: '#3a6ab0', ...(o.top || {}) }, bot = { kind: 'jeans', color: '#34406a', ...(o.bottom || {}) };
    const shoe = { kind: 'sneakers', color: '#f2f0ea', ...(o.shoes || {}) }, hair = { style: 'short', color: '#2a1c16', ...(o.hair || {}) }, acc = new Set(o.acc || []);
    const yHip = B.hip, yWaist = yHip + 0.02, ySh = yWaist + B.T, yNeck = ySh + 0.035, Hc = yNeck + B.hh + 0.005;      // head centre
    this.dims = { yHip, yWaist, ySh, yNeck, Hc, B };
    this.group = new THREE.Group(); this.bones = {}; this.rest = {}; this.order = []; this.pivots = {}; this.parts = {}; this.scale = 1;
    const bone = (name, parent, piv) => {
      const g = new THREE.Group(); g.name = name; const pp = parent ? this.pivotsM[parent] : [0, 0, 0];
      g.position.set(piv[0] - pp[0], piv[1] - pp[1], piv[2] - pp[2]); (parent ? this.bones[parent] : this.group).add(g);
      this.bones[name] = g; this.order.push(name); this.pivotsM[name] = piv; this.pivots[name] = piv.map((v) => v / U);
      this.rest[name] = { p: g.position.clone(), r: g.rotation.clone(), s: g.scale.clone() }; return g;
    };
    this.pivotsM = {};
    const attach = (name, obj) => { const piv = this.pivotsM[name]; obj.position.set(-piv[0], -piv[1], -piv[2]); this.bones[name].add(obj); return obj; };
    bone('root', null, [0, 0, 0]);
    bone('hips', 'root', [0, yHip, 0]);
    // ---- legs + shoes
    const legC = bot.color, short = bot.kind === 'shorts' || bot.kind === 'skirt';
    for (const s of [-1, 1]) {
      const nm = s < 0 ? 'legR' : 'legL', lx = s * (B.ww * 0.27), top0 = yHip + 0.01;
      bone(nm, 'hips', [lx, top0, 0]);
      const kneeY = top0 * 0.5, knee = (y) => Math.abs(y - kneeY) < 0.008;
      const leg = voxPart([lx - 0.09, 0.06, -0.09, lx + 0.09, top0 + 0.02, 0.09], (x, y, z) => cap(x, y, z, [lx, top0 - B.lr * 0.6, 0], [lx, 0.11, 0.004], [B.lr, B.lr * 0.82]), (x, y, z) => {
        if (short && y < top0 - (bot.kind === 'skirt' ? 0.1 : 0.17)) return y < 0.13 && shoe.socks !== false ? (shoe.sock || '#f2f0ea') : skin;
        let c = legC;
        if (bot.kind === 'jeans') { if (Math.abs(x - lx) * s > B.lr * 0.72 && Math.abs(z) < 0.012) c = shift(legC, 0.22); if (knee(y) || (y < 0.15 && y > 0.135)) c = shift(legC, -0.18); if (hash(x, y, z) < 0.05) c = shift(legC, 0.08); }
        if (bot.kind === 'track' && Math.abs(x - lx) * s > B.lr * 0.75) c = bot.color2 || '#f0ece4';
        if (bot.kind === 'slacks' && Math.abs(x - lx) < 0.008 && z > 0) c = shift(legC, -0.15);
        return c;
      });
      attach(nm, leg);
      // shoe: a rounded shoe with a thick sole, toe cap, laces and a side stripe
      const sc = shoe.color, sole = shoe.sole || (shoe.kind === 'boots' || shoe.kind === 'dress' ? '#241e1c' : '#f6f4ee');
      const sh = voxPart([lx - 0.08, 0, -0.09, lx + 0.08, 0.14, 0.15], (x, y, z) => smin(rbox(x - lx, y - 0.045, z - 0.03, 0.05 + (shoe.kind === 'boots' ? 0.005 : 0), 0.045, 0.1, 0.035), shoe.kind === 'boots' ? rbox(x - lx, y - 0.1, z + 0.005, 0.052, 0.05, 0.06, 0.03) : 1, 0.02), (x, y, z) => {
        if (y < 0.022) return sole;
        if (shoe.kind === 'sneakers') { if (y < 0.03 && hash(x, y, z) < 0.3) return shift(sole, -0.08); if (z > 0.06 && y < 0.07 && z > 0.09) return shift(sc, -0.05); if (y > 0.075 && Math.abs(x - lx) < 0.022 && z > -0.02 && z < 0.07 && Math.round(z * VPM) % 2 === 0) return shoe.lace || '#f8f8f4'; if (shoe.stripe && Math.abs(x - lx) > 0.035 && y > 0.03 && y < 0.07 && Math.abs(z - y * 0.8 - 0.0) < 0.018) return shoe.stripe; }
        if (shoe.kind === 'dress' && y > 0.06 && z > 0.06) return shift(sc, 0.25);
        return sc;
      });
      attach(nm, sh);
    }
    // ---- hips / waist band / skirt
    bone('torso', 'hips', [0, yWaist, 0]);
    const belt = bot.belt ?? (bot.kind === 'jeans' || bot.kind === 'slacks');
    attach('hips', voxPart([-B.ww / 2 - 0.04, yHip - 0.12, -B.d / 2 - 0.04, B.ww / 2 + 0.04, yWaist + 0.04, B.d / 2 + 0.04 + (B.belly || 0)], (x, y, z) => bot.kind === 'skirt' ? rbox(x, y - (yHip - 0.06), z, B.ww / 2 + 0.03 + (yHip - y) * 0.25, 0.08, B.d / 2 + 0.03, 0.03) : rbox(x, y - (yHip - 0.035), z, B.ww / 2 - 0.005, 0.055, B.d / 2 - 0.005, 0.04), (x, y, z) => {
      if (belt && y > yHip - 0.005) return Math.abs(x) < 0.02 && z > 0 ? '#d8c070' : '#2a2224';
      if (bot.kind === 'skirt' && Math.round(Math.atan2(z, x) * 9) % 2 === 0) return shift(bot.color, -0.12);
      return bot.color;
    }));
    // ---- torso: tapering from waist to shoulders, belly for big builds, clothing details
    const tw = (y) => { const t = cl((y - yWaist) / B.T); return (B.ww + (B.sw - B.ww) * sst(0.2, 0.9, t)) / 2; };
    const torsoSDF = (x, y, z) => { const t = cl((y - yWaist) / B.T); return rbox(x, y - (yWaist + B.T / 2), z - (B.belly || 0) * Math.sin(t * Math.PI) * 0.6, tw(y), B.T / 2, B.d / 2 + (B.belly || 0) * Math.sin(t * Math.PI) * 0.5, 0.05) ; };
    const T0 = top.color, c2 = top.color2 || shift(T0, -0.25);
    const front = (z, y) => z > B.d / 2 - 0.02 + (B.belly || 0) * 0.3 * Math.sin(cl((y - yWaist) / B.T) * Math.PI);
    attach('torso', voxPart([-B.sw / 2 - 0.05, yWaist - 0.02, -B.d / 2 - 0.08 - (top.kind === 'hoodie' ? 0.05 : 0), B.sw / 2 + 0.05, ySh + 0.07, B.d / 2 + 0.06 + (B.belly || 0)], (x, y, z) => {
      let d = torsoSDF(x, y, z);
      if (top.kind === 'hoodie') d = smin(d, ell(x, y - (ySh + 0.005), z + B.d / 2 + 0.01, B.sw * 0.3, 0.05, 0.06), 0.03);       // the hood
      if (top.kind === 'coat') d = Math.min(d, rbox(x, y - (yWaist - 0.05), z, tw(yWaist) + 0.02, 0.07, B.d / 2 + 0.02, 0.03));
      return d;
    }, (x, y, z) => {
      const fy = (y - yWaist) / B.T, isF = front(z, y), ax = Math.abs(x);
      let c = T0;
      if (y < yWaist + 0.02 && top.kind !== 'suit') c = shift(T0, -0.2);                                          // ribbed hem
      if (top.kind === 'hoodie') {
        if (y > ySh - 0.03 && z < -B.d / 2 + 0.03) c = shift(T0, -0.12);
        if (isF && fy > 0.12 && fy < 0.42 && ax < B.ww * 0.36) c = (fy > 0.4 || ax > B.ww * 0.34) ? shift(T0, -0.3) : shift(T0, -0.08);   // kangaroo pocket
        if (isF && fy > 0.72 && (Math.abs(x - 0.035) < 0.006 || Math.abs(x + 0.035) < 0.006)) c = top.color2 || '#f0ece4';               // drawstrings
      }
      if (top.kind === 'jacket' || top.kind === 'suit' || top.kind === 'coat') {
        const open = ax < 0.012 + Math.max(0, fy - 0.45) * 0.09;
        if (isF && open) c = top.inner || (top.kind === 'suit' ? '#f4f2ec' : '#2e2e36');
        if (isF && top.kind === 'suit' && ax < 0.012 && fy > 0.3 && fy < 0.92) c = top.tie || '#a82e3a';
        if (isF && !open && ax < 0.028 + Math.max(0, fy - 0.45) * 0.11 && fy > 0.45) c = shift(T0, 0.18);           // lapels
        if (isF && top.kind !== 'suit' && Math.abs(ax - 0.07) < 0.025 && Math.abs(fy - 0.28) < 0.04) c = shift(T0, -0.25);   // pockets
        if (isF && top.kind === 'jacket' && ax < 0.004 && fy < 0.45) c = '#c8ccd4';                                       // zip
        if (top.stripe && Math.abs(fy - 0.6) < 0.05) c = top.stripe;
      }
      if (top.kind === 'tee' || top.kind === 'tank') {
        if (fy > 0.9 && ax < 0.055 && z > -0.02) c = isF ? skin : shift(T0, -0.25);
        if (fy > 0.86 && fy <= 0.9 && ax < 0.06) c = shift(T0, -0.3);
        if (top.kind === 'tank' && ax > tw(y) - 0.045 && fy > 0.55) c = skin;
      }
      if (top.kind === 'apron') { if (isF && ax < B.ww * 0.42 && fy < 0.9) c = top.color2; if (isF && ax < B.ww * 0.42 && Math.abs(fy - 0.4) < 0.03) c = shift(top.color2, -0.2); if (!isF && fy > 0.35 && fy < 0.42) c = top.color2; }
      if (top.kind === 'vest') { if (isF && ax > 0.035 && ax < 0.11) c = c2; if (!isF && z < 0) c = c2; if (isF && ax < 0.035) c = top.inner || '#e8e2d4'; }
      if (top.print && isF) { const pc = top.print(x, fy); if (pc) c = pc; }
      if (acc.has('backpack') && isF && Math.abs(ax - B.sw * 0.3) < 0.016 && fy > 0.2) c = o.packStrap || '#2a2a30';
      if (acc.has('bag') && isF && Math.abs(x + y * 0.7 - (ySh * 0.7 - 0.05)) < 0.016) c = o.bagStrap || '#5a3a2a';
      if (hash(x, y, z) < 0.04) c = shift(c, -0.06);
      return c;
    }));
    // neck
    attach('torso', voxPart([-0.06, ySh - 0.03, -0.06, 0.06, yNeck + 0.06, 0.06], (x, y, z) => cap(x, y, z, [0, ySh - 0.02, 0], [0, yNeck + 0.04, 0.005], 0.045), () => shift(skin, -0.08)));
    if (acc.has('scarf')) attach('torso', voxPart([-0.12, ySh - 0.04, -0.11, 0.12, ySh + 0.06, 0.12], (x, y, z) => { const r = Math.hypot(x, z * 1.1) - 0.075; return Math.hypot(r, y - (ySh + 0.012)) - 0.032; }, (x, y) => (Math.round(y * VPM) % 3 ? o.scarfColor || '#c83a3a' : shift(o.scarfColor || '#c83a3a', -0.2))));
    if (acc.has('chain')) attach('torso', voxPart([-0.1, ySh - 0.12, 0, 0.1, ySh + 0.02, B.d / 2 + 0.04 + (B.belly || 0) * 0.6], (x, y, z) => { const zz = B.d / 2 + 0.005 + (B.belly || 0) * 0.5, yy = ySh - 0.012 - (1 - (x / 0.085) ** 2) * 0.075; return Math.abs(x) < 0.085 && Math.abs(y - yy) < 0.012 && Math.abs(z - zz) < 0.012 ? -1 : (Math.hypot(x, y - (ySh - 0.1), z - zz) < 0.022 ? -1 : 1); }, (x, y) => (Math.round(x * VPM) % 2 ? '#ffd850' : '#d8a830')));
    if (acc.has('backpack')) attach('torso', voxPart([-0.14, yWaist, -B.d / 2 - 0.13, 0.14, ySh, -B.d / 2 + 0.01], (x, y, z) => rbox(x, y - (yWaist + B.T * 0.52), z + B.d / 2 + 0.06, 0.11, B.T * 0.4, 0.055, 0.035), (x, y, z) => { const pc = o.packColor || '#c84a3a'; if (z > -B.d / 2 - 0.035 && y < yWaist + B.T * 0.42) return shift(pc, -0.18); if (Math.abs(x) < 0.006 && y > yWaist + B.T * 0.5) return '#d8d4cc'; return pc; }));
    if (acc.has('bag')) attach('torso', voxPart([B.ww / 2 - 0.02, yWaist - 0.08, -0.06, B.ww / 2 + 0.1, yWaist + 0.1, 0.08], (x, y, z) => rbox(x - (B.ww / 2 + 0.04), y - yWaist, z, 0.03, 0.065, 0.055, 0.02), (x, y) => (y > yWaist + 0.03 ? shift(o.bagColor || '#8a5a3a', -0.15) : o.bagColor || '#8a5a3a')));
    // ---- arms (sleeve + forearm) and hands, with props
    const sleeveLen = top.kind === 'tank' ? 0 : top.kind === 'tee' || (top.kind === 'apron' && !top.long) || top.kind === 'vest' && !top.long ? 0.42 : 0.92;
    for (const s of [-1, 1]) {
      const nm = s < 0 ? 'R' : 'L', ax = s * (B.sw / 2 + 0.035), sy = ySh - 0.03, ey = sy - B.arm;
      bone('arm' + nm, 'torso', [ax, sy, 0]);
      attach('arm' + nm, voxPart([ax - 0.08, ey - 0.03, -0.08, ax + 0.08, sy + 0.06, 0.08], (x, y, z) => cap(x, y, z, [ax, sy, 0], [ax + s * 0.008, ey + 0.02, 0.01], [0.046 + (B.belly ? 0.012 : 0), 0.037]), (x, y, z) => {
        const t = (sy - y) / B.arm;
        if (t > sleeveLen) return skin;
        if (sleeveLen < 0.9 && t > sleeveLen - 0.05) return shift(top.kind === 'vest' ? top.inner || '#e8e2d4' : T0, -0.25);
        if (top.kind === 'jacket' && t > 0.84) return shift(T0, -0.2);
        if ((top.stripe || top.kind === 'jacket' && top.stripe) && Math.abs(x - ax) * s > 0.03) return top.stripe;
        if (top.kind === 'vest') return top.inner || '#e8e2d4';
        return T0;
      }));
      bone('hand' + nm, 'arm' + nm, [ax + s * 0.008, ey + 0.01, 0.01]);
      attach('hand' + nm, voxPart([ax - 0.06, ey - 0.08, -0.06, ax + 0.06, ey + 0.03, 0.07], (x, y, z) => smin(ell(x - ax - s * 0.006, y - (ey - 0.025), z - 0.008, 0.034, 0.045, 0.036), ell(x - ax + s * 0.02, y - (ey - 0.012), z - 0.03, 0.013, 0.022, 0.014), 0.01), (x, y, z) => (acc.has('gloves') ? o.gloveColor || '#2a2a30' : shift(skin, z > 0.03 ? 0.04 : 0))));
      if (acc.has('watch') && s > 0) attach('hand' + nm, voxPart([ax - 0.05, ey - 0.01, -0.05, ax + 0.05, ey + 0.035, 0.05], (x, y, z) => Math.abs(Math.hypot(x - ax, z - 0.01) - 0.038) < 0.008 && y > ey && y < ey + 0.022 ? -1 : 1, (x, y, z) => (z > 0.04 ? '#e8ecf4' : '#3a3a42')));
      if (s < 0) {
        if (acc.has('phone')) this.part('phone', attach('handR', voxPart([ax - 0.04, ey - 0.12, 0.0, ax + 0.04, ey - 0.0, 0.07], (x, y, z) => rbox(x - ax, y - (ey - 0.06), z - 0.045, 0.03, 0.055, 0.007, 0.006), (x, y, z) => (z > 0.05 && Math.abs(x - ax) < 0.024 && Math.abs(y - (ey - 0.06)) < 0.046 ? '#5ab4f0' : '#1e1e26'))), true);
        if (acc.has('capsule')) this.part('capsule', attach('handR', voxPart([ax - 0.06, ey - 0.13, -0.04, ax + 0.06, ey - 0.0, 0.09], (x, y, z) => Math.hypot(x - ax, y - (ey - 0.065), z - 0.03) - 0.05, (x, y, z) => (Math.abs(y - (ey - 0.065)) < 0.008 ? '#1c1418' : y > ey - 0.065 ? '#e8343a' : (Math.hypot(x - ax, z - 0.08) < 0.016 ? '#1c1418' : '#f4f0ea')))), true);
      }
    }
    // ---- head
    bone('head', 'torso', [0, yNeck, 0]);
    const hw = B.hw, hh = B.hh, hd = B.hd;
    const headSDF = (x, y, z) => {
      const t = cl((Hc - y) / hh), jaw = 1 - 0.26 * t * t * (o.jaw ?? 1), n = 2.7;
      const f = Math.abs(x / (hw * jaw)) ** n + Math.abs((y - Hc) / hh) ** n + Math.abs((z - 0.004 + t * t * 0.014) / (hd * (1 - 0.06 * t))) ** n;
      return (Math.pow(f, 1 / n) - 1) * Math.min(hw * jaw, hh, hd);
    };
    const hairCol = hair.color, hs = hair.style;
    const HL = hairLine(hs, Hc, hh, hd, hair);
    attach('head', voxPart([-hw - 0.05, Hc - hh - 0.03, -hd - 0.05, hw + 0.05, Hc + hh + 0.03, hd + 0.06], (x, y, z) => {
      let d = headSDF(x, y, z);
      d = smin(d, ell(x - hw * 0.98, y - (Hc - hh * 0.08), z + 0.01, 0.025, 0.048, 0.034), 0.012);                   // ears
      d = smin(d, ell(-x - hw * 0.98, y - (Hc - hh * 0.08), z + 0.01, 0.025, 0.048, 0.034), 0.012);
      d = smin(d, ell(x, y - (Hc - hh * 0.27), z - (hd - 0.004), 0.013, 0.02, 0.016), 0.01);                          // nose
      return d;
    }, (x, y, z) => {
      if (hs !== 'bald' && HL(x, y, z) && headSDF(x, y, z) > -0.03) return hairShade(hairCol, x, y, z, Hc, hh);
      let c = skin;
      if (z > hd - 0.03 && y < Hc - hh * 0.2 && y > Hc - hh * 0.36 && Math.abs(x) < 0.012) c = shift(skin, -0.08);   // under-nose
      if (Math.abs(x) > hw * 0.86 && y < Hc) c = shift(skin, -0.05);
      if (y < Hc - hh * 0.8) c = shift(skin, -0.06);
      if (o.beard && y < Hc - hh * (o.beard === 'mustache' ? 0.3 : 0.25) && (o.beard !== 'mustache' || (y > Hc - hh * 0.46 && Math.abs(x) < 0.06)) && (o.beard !== 'goatee' || Math.abs(x) < 0.05) && z > -0.02) { const bc = o.beardColor || hairCol; c = o.beard === 'stubble' ? (hash(x, y, z) < 0.55 ? shift(bc, 0.25) : c) : (hash(x, y, z) < 0.3 ? shift(bc, -0.12) : bc); if (o.beard !== 'stubble' && z > hd - 0.035 && Math.abs(x) < 0.04 && y > Hc - hh * 0.62 && y < Hc - hh * 0.5) c = skin; }
      if (o.freckles && z > hd - 0.04 && y < Hc - hh * 0.05 && y > Hc - hh * 0.3 && Math.abs(Math.abs(x) - 0.08) < 0.04 && hash(x, y, z) < 0.2) c = shift(skin, -0.2);
      return c;
    }));
    // sculpted hair volume (shell + locks)
    if (hs !== 'bald') attach('head', voxPart([-hw - 0.12, Hc - hh - 0.25, -hd - 0.14, hw + 0.12, Hc + hh + 0.16, hd + 0.1], hairSDF(hs, headSDF, HL, Hc, hh, hw, hd, hair, yNeck), (x, y, z) => hairShade(hairCol, x, y, z, Hc, hh)));
    // hats & headgear
    if (acc.has('cap')) attach('head', voxPart([-hw - 0.05, Hc + hh * 0.2, -hd - 0.05, hw + 0.05, Hc + hh + 0.06, hd + 0.18], (x, y, z) => Math.min(Math.max(headSDF(x, y, z) - 0.025, Hc + hh * 0.45 - y), rbox(x, y - (Hc + hh * 0.42), z - (hd + 0.07), hw * 0.75, 0.008, 0.08, 0.008)), (x, y, z) => (z > hd + 0.01 && y < Hc + hh * 0.48 ? shift(o.capColor || '#c83a3a', -0.2) : Math.abs(x) < 0.01 && y > Hc + hh * 0.9 ? '#f0ece4' : o.capColor || '#c83a3a')));
    if (acc.has('beanie')) attach('head', voxPart([-hw - 0.05, Hc + hh * 0.15, -hd - 0.05, hw + 0.05, Hc + hh + 0.07, hd + 0.05], (x, y, z) => Math.max(headSDF(x, y, z) - 0.03, Hc + hh * 0.3 - y), (x, y) => (y < Hc + hh * 0.42 ? shift(o.capColor || '#3a4a6a', -0.2) : Math.round(Math.atan2(0, x) * 0 + x * VPM) % 2 ? o.capColor || '#3a4a6a' : shift(o.capColor || '#3a4a6a', 0.1))));
    if (acc.has('headband')) attach('head', voxPart([-hw - 0.04, Hc + hh * 0.3, -hd - 0.04, hw + 0.04, Hc + hh * 0.55, hd + 0.04], (x, y, z) => Math.max(headSDF(x, y, z) - 0.018, Math.abs(y - (Hc + hh * 0.42)) - 0.025), () => o.bandColor || '#f0ece4'));
    if (acc.has('headphones')) attach('head', voxPart([-hw - 0.07, Hc - hh * 0.3, -0.07, hw + 0.07, Hc + hh + 0.06, 0.07], (x, y, z) => Math.min(rbox(Math.abs(x) - hw - 0.02, y - (Hc - hh * 0.06), z + 0.005, 0.03, 0.055, 0.05, 0.02), Math.max(Math.abs(Math.hypot(x, y - (Hc - hh * 0.06)) - (hw + 0.035)) - 0.012, Math.abs(z + 0.005) - 0.022, Hc - y)), (x, y) => (y > Hc + 0.02 ? '#3a3a44' : Math.abs(x) > hw + 0.04 ? o.phoneColor || '#e8603a' : '#2a2a32')));
    if (acc.has('earring')) attach('head', voxPart([hw - 0.02, Hc - hh * 0.4, -0.04, hw + 0.04, Hc - hh * 0.15, 0.02], (x, y, z) => Math.hypot(x - hw - 0.01, y - (Hc - hh * 0.3), z + 0.01) - 0.014, () => '#ffd850'));
    // ---- the face: eyes, brows, mouth (all expression states), glasses
    const fz = (x, y) => { let z = hd + 0.04; while (z > 0 && headSDF(x, y, z) > 0) z -= 0.002; return z + 0.5 / VPM + 0.0025; };
    const eyeY = Hc - hh * 0.02, eyeX = hw * 0.42, EW = 0.078, EH = 0.052, eo = { iris: o.eyes?.color || '#4a3424', shape: o.eyes?.shape || 'normal', lashes: o.eyes?.lashes, thick: o.eyes?.thick, skin };
    for (const s of [-1, 1]) for (const st of ['open', 'closed', 'happy', 'angry', 'sad', 'wide', 'half']) {
      const m = facePlane(EW, EH, eye(st, eo, s)); m.position.set(s * eyeX, eyeY, fz(s * eyeX, eyeY)); this.bones.head.add(m); m.position.sub(new THREE.Vector3(0, yNeck, 0)); this.part('eye-' + st, m, st !== 'open');
    }
    const browC = o.browColor || (hs === 'bald' ? shift(skin, -0.4) : shift(hairCol, -0.08));
    for (const s of [-1, 1]) for (const st of ['calm', 'angry', 'sad', 'up']) {
      const m = facePlane(0.09, 0.03, brow(st, browC, s, o.eyes?.thick)); m.position.set(s * eyeX * 1.02, eyeY + EH * 0.72, fz(s * eyeX, eyeY + EH * 0.72) + 0.002); m.position.y -= yNeck; this.bones.head.add(m); this.part('brow-' + st, m, st !== 'calm');
    }
    for (const st of ['closed', 'smile', 'frown', 'smirk', 'grin', 'open', 'o', 'shout', 'laugh']) {
      const m = facePlane(0.09, 0.05, mouth(st, skin, o)); const my = Hc - hh * 0.52; m.position.set(0, my - yNeck, fz(0, my)); this.bones.head.add(m); this.part('mouth-' + st, m, st !== (o.mouth || 'closed'));
    }
    if (acc.has('glasses') || acc.has('sunglasses')) {
      const dark = acc.has('sunglasses'), gw = hw * 1.9, gy = eyeY + 0.004;
      const m = facePlane(gw, 0.075, (p, W, H) => { const lw = Math.round(W * 0.36), lh = H - 2; for (const x0 of [Math.round(W * 0.08), W - Math.round(W * 0.08) - lw]) { for (let x = x0; x < x0 + lw; x++) for (let y = 1; y < 1 + lh; y++) { const edge = x < x0 + 2 || x > x0 + lw - 3 || y < 3 || y > lh - 1; if (edge) p.px(x, y, o.frameColor || '#1e1a1e'); else if (dark) p.px(x, y, (x - x0 + y) % 9 < 2 ? '#5a6a8a' : '#141822'); } } for (let x = Math.round(W * 0.08) + lw; x < W - Math.round(W * 0.08) - lw; x++) p.px(x, 4, o.frameColor || '#1e1a1e'); });
      m.position.set(0, gy - yNeck, fz(0, gy) + 0.012); this.bones.head.add(m); this.part('glasses', m, false);
    }
    this.def = { name: o.name, anim: acting(o) };
  }
  part(id, obj, hidden) { (this.parts[id] || (this.parts[id] = [])).push(obj); if (hidden) obj.visible = false; return obj; }
  show(id, v = true) { for (const m of this.parts[id] || []) m.visible = v; }
}

// ---------------------------------------------------------------- hair
function hairShade(c0, x, y, z, Hc, hh) {
  const dk = parseInt(c0.slice(1, 3), 16) + parseInt(c0.slice(3, 5), 16) + parseInt(c0.slice(5, 7), 16) < 210, c = dk ? shift(c0, 0.2) : c0;
  const ang = Math.atan2(x, z), strand = Math.sin(ang * 30 + y * 22 + Math.sin(y * 60) * 0.8) > 0.5, up = (y - Hc) / hh;
  let col = up > 0.62 ? shift(c, dk ? 0.22 : 0.16) : up > 0.2 ? c : shift(c, -0.14);
  if (strand) col = shift(col, -0.16);
  if (up > 0.74 && up < 0.86 && !strand && Math.sin(ang * 9 + 1) > 0.5 && z > 0) col = dk ? shift(c, 0.32) : shift(c, 0.3);   // broken highlight arcs
  return col;
}
// where the scalp is covered (hairline): returns fn(x, y, z) → true where hair grows on the head surface
function hairLine(hs, Hc, hh, hd, hair) {
  const fr = { short: 0.42, spiky: 0.38, long: 0.36, bob: 0.2, ponytail: 0.5, bun: 0.52, slick: 0.56, buzz: 0.5, afro: 0.4, mohawk: 2, bald: 2 }[hs] ?? 0.42;
  const side = { long: -0.6, bob: -0.5, ponytail: -0.1, bun: -0.1, buzz: 0.05, mohawk: 2 }[hs] ?? -0.05;
  const back = { long: -1.2, bob: -0.75, short: -0.62, spiky: -0.6, buzz: -0.55, slick: -0.58, ponytail: -0.62, bun: -0.62, afro: -0.7, mohawk: 2 }[hs] ?? -0.6;
  return (x, y, z) => {
    if (hs === 'mohawk') return Math.abs(x) < 0.03 && y > Hc + hh * 0.2;
    const zf = z / hd;                                                                    // −1 back … +1 front
    const lim = zf > 0.2 ? fr + (zf - 0.2) * 0.1 : zf > -0.3 ? side + (fr - side) * ((zf + 0.3) / 0.5) : back + (side - back) * ((zf + 1) / 0.7);
    const ear = Math.abs(x) > 0.17 && zf > -0.4 && zf < 0.35 && y < Hc + hh * 0.12 && hs !== 'long' && hs !== 'bob';
    return y > Hc + hh * lim && !ear;
  };
}
function hairSDF(hs, headSDF, HL, Hc, hh, hw, hd, hair, yNeck) {
  const th = hs === 'buzz' ? 0.012 : hs === 'afro' ? 0.09 : hs === 'slick' ? 0.026 : 0.034;
  const locks = [];
  const L = (a, b, r) => locks.push([a, b, r]);
  const fz = hd + 0.015;
  if (hs === 'short' || hs === 'spiky' || hs === 'long' || hs === 'ponytail' || hs === 'bun') {
    const n = hs === 'spiky' ? 6 : 5, len = hs === 'spiky' ? 0.12 : 0.1;
    for (let i = 0; i < n; i++) { const t = i / (n - 1) - 0.5, x = t * hw * 1.7; L([x, Hc + hh * 0.98, fz - 0.07], [x + t * 0.05 + (i % 2 ? 0.012 : -0.01), Hc + hh * 0.98 - len - (i % 2) * 0.02, fz + 0.012], [0.04, 0.012]); }
  }
  if (hs === 'spiky') for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, r = 0.12; L([Math.cos(a) * r * 0.9, Hc + hh * 0.7, Math.sin(a) * r * 0.9 - 0.02], [Math.cos(a) * (r + 0.1), Hc + hh + 0.12 - Math.abs(Math.sin(a)) * 0.03, Math.sin(a) * (r + 0.08) - 0.05], [0.055, 0.01]); }
  if (hs === 'spiky') for (let i = 0; i < 3; i++) L([(i - 1) * 0.1, Hc + hh * 0.5, -hd * 0.9], [(i - 1) * 0.14, Hc - hh * 0.25, -hd - 0.08], [0.045, 0.012]);
  if (hs === 'slick') L([0, Hc + hh * 0.9, hd - 0.05], [0, Hc + hh + 0.05, hd + 0.03], [0.07, 0.03]);
  if (hs === 'long') for (let i = 0; i < 5; i++) { const t = i / 4 - 0.5; L([t * hw * 1.6, Hc, -hd * 0.8], [t * hw * 1.9, yNeck - 0.16, -hd * 0.75 - 0.03], [0.07, 0.035]); }
  if (hs === 'long' || hs === 'bob') for (const s of [-1, 1]) L([s * hw * 0.95, Hc + hh * 0.5, hd * 0.55], [s * (hw + 0.012), hs === 'long' ? yNeck - 0.12 : Hc - hh * 0.75, hd * 0.6], [0.04, 0.03]);
  if (hs === 'bob') for (let i = 0; i < 7; i++) { const t = i / 6 - 0.5; L([t * hw * 1.8, Hc + hh * 0.95, fz - 0.06], [t * hw * 1.8, Hc + hh * 0.42, fz + 0.012], 0.03); }
  if (hs === 'ponytail') { L([0, Hc + hh * 0.55, -hd - 0.02], [0, Hc + hh * 0.3, -hd - 0.09], 0.045); L([0, Hc + hh * 0.3, -hd - 0.09], [0, Hc - hh * 0.9, -hd - 0.14], [0.05, 0.02]); }
  if (hs === 'bun') L([0, Hc + hh * 0.75, -hd * 0.75], [0, Hc + hh * 0.95, -hd * 0.95], 0.075);
  if (hs === 'afro') for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; L([Math.cos(a) * 0.17, Hc + hh * 0.55 + Math.sin(i * 1.7) * 0.05, Math.sin(a) * 0.15 - 0.02], [Math.cos(a) * 0.2, Hc + hh * 0.75, Math.sin(a) * 0.18 - 0.02], 0.08); }
  if (hs === 'mohawk') for (let i = 0; i < 7; i++) { const z = hd * 0.8 - i * (hd * 1.7 / 6); L([0, Hc + hh * 0.75, z], [0, Hc + hh + 0.14 - Math.abs(i - 2.5) * 0.02, z - 0.04], [0.03, 0.008]); }
  return (x, y, z) => {
    let d = 1e9;
    if (hs !== 'mohawk') { const shell = headSDF(x, y, z) - th; if (HL(x, y, z) || shell > 0) d = Math.max(shell, HL(x, y, z) ? -1 : 1); }
    for (const [a, b, r] of locks) d = smin(d, cap(x, y, z, a, b, r), 0.025);
    return d;
  };
}
