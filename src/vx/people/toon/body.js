// Toon people, built from scratch in the hand-painted PS1 anime style: a low-poly, flat-shaded body
// lofted around an anime skeleton (A-pose rest) — torso, long neck, thin arms, mitten hands, legs, chunky
// shoes — softly skinned (joints blend two bones), and ONE small nearest-filtered texture (128×128) where
// every garment is painted texel by texel: frayed hems, fold strokes on baggy pants, seams, zips, pockets,
// laces, plaid, socks. +x is the character's left, +z forward.
import * as THREE from '../../../../vendor/three.module.js';
import { Buf, hash, rgb, mix, shade } from './raster.js';

const lerp = (a, b, t) => a + (b - a) * t;
const cl = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- proportions
export function dims(spec) {
  const f = spec.sex === 'f', kid = spec.age === 'kid', old = spec.age === 'elder', adult = spec.age === 'adult' || old;
  const H = spec.H || (kid ? 1.3 : f ? 1.58 : 1.68), b = spec.build || 1;
  // big heads (about five heads tall), slim bodies, long legs: the PS1 anime look
  const heads = kid ? 4.2 : f ? (adult ? 5.4 : 5.0) : (adult ? 5.8 : 5.4);
  const hu = H / heads;
  const D = { H, hu, f, kid, old, adult, b };
  D.chin = H - hu; D.neckBase = D.chin - hu * (kid ? 0.16 : f ? 0.3 : 0.28); D.shY = D.neckBase - hu * 0.06;
  D.hipJ = H * (kid ? 0.42 : f ? 0.48 : 0.47); D.crotch = D.hipJ - hu * 0.08;
  D.knee = D.hipJ * 0.52; D.ankle = H * 0.045;
  D.waist = lerp(D.hipJ, D.shY, f ? 0.45 : 0.42); D.chest = lerp(D.hipJ, D.shY, 0.76);
  D.shX = hu * (kid ? 0.48 : f ? 0.5 : 0.64) * (0.85 + 0.15 * b);
  D.hipX = hu * (kid ? 0.24 : f ? 0.25 : 0.25) * (0.92 + 0.08 * b);
  D.uarm = hu * (kid ? 0.86 : f ? 0.96 : 1.04); D.farm = hu * (kid ? 0.74 : f ? 0.84 : 0.9); D.hand = hu * (f ? 0.28 : 0.32);
  // torso half-widths (x) and half-depths (z) at the landmarks (body + clothes)
  const w = hu * (0.85 + 0.15 * b);
  D.tw = { crotch: w * 0.34, hip: w * (f ? 0.46 : 0.42), waist: w * (f ? 0.3 : 0.38), chest: w * (f ? 0.4 : 0.5), shoulder: w * (f ? 0.46 : 0.58) };
  D.td = { crotch: w * 0.26, hip: w * (f ? 0.31 : 0.28), waist: w * (f ? 0.23 : 0.26), chest: w * (f ? 0.29 : 0.3), shoulder: w * 0.24 };
  D.belly = (spec.belly || 0) * hu * 0.16;
  D.r = { thigh: hu * (f ? 0.2 : 0.19) * (0.85 + 0.15 * b), knee: hu * 0.11, calf: hu * (f ? 0.125 : 0.12), ankle: hu * 0.065, uarm: hu * (f ? 0.095 : 0.11) * (0.8 + 0.2 * b), elbow: hu * (f ? 0.072 : 0.085), farm: hu * (f ? 0.078 : 0.09), wrist: hu * (f ? 0.055 : 0.062) };
  // the head (head.js reads these): wide and round, the face a little forward
  D.hw = hu * (kid ? 0.53 : f ? 0.5 : 0.47); D.hd = hu * 0.47; D.hcz = hu * 0.02;
  const a = 0.17;
  D.armDir = [Math.sin(a), -Math.cos(a), 0];
  return D;
}

// ---------------------------------------------------------------- skeleton
export const BONES = ['root', 'hips', 'spine', 'chest', 'neck', 'head', 'uaL', 'faL', 'hL', 'uaR', 'faR', 'hR', 'thL', 'shL', 'ftL', 'thR', 'shR', 'ftR', 'skirt', 'tailL', 'tailR', 'ahoge'];
export const PARENT = { hips: 'root', spine: 'hips', chest: 'spine', neck: 'chest', head: 'neck', uaL: 'chest', faL: 'uaL', hL: 'faL', uaR: 'chest', faR: 'uaR', hR: 'faR', thL: 'hips', shL: 'thL', ftL: 'shL', thR: 'hips', shR: 'thR', ftR: 'shR', skirt: 'hips', tailL: 'head', tailR: 'head', ahoge: 'head' };
export const BI = Object.fromEntries(BONES.map((b, i) => [b, i]));
export function joints(D, spec) {
  const J = {}, ad = D.armDir, hair = (spec.hair || {}).style;
  J.root = [0, 0, 0]; J.hips = [0, (D.hipJ + D.waist) / 2, 0]; J.spine = [0, D.waist, 0]; J.chest = [0, D.chest, 0];
  J.neck = [0, D.neckBase, -D.hu * 0.02]; J.head = [0, D.chin + D.hu * 0.08, D.hcz - D.hu * 0.05];
  for (const [s, k] of [[1, 'L'], [-1, 'R']]) {
    const sh = [s * D.shX, D.shY, 0], el = [sh[0] + s * ad[0] * D.uarm, sh[1] + ad[1] * D.uarm, 0], wr = [el[0] + s * ad[0] * D.farm, el[1] + ad[1] * D.farm, 0.01];
    J['ua' + k] = sh; J['fa' + k] = el; J['h' + k] = wr;
    J['th' + k] = [s * D.hipX, D.hipJ, 0]; J['sh' + k] = [s * D.hipX * 0.94, D.knee, 0.005]; J['ft' + k] = [s * D.hipX * 0.9, D.ankle, -0.005];
  }
  J.skirt = [0, D.waist - D.hu * 0.05, 0];
  const earTop = D.chin + D.hu * 0.62;
  if (hair === 'ponytail') { J.tailL = [0, D.chin + D.hu * 0.66, D.hcz - D.hd - D.hu * 0.08]; J.tailR = J.tailL.slice(); }
  else { J.tailL = [D.hw + D.hu * 0.05, earTop, D.hcz - D.hu * 0.24]; J.tailR = [-(D.hw + D.hu * 0.05), earTop, D.hcz - D.hu * 0.24]; }
  J.ahoge = [0, D.H - D.hu * 0.02, D.hcz + D.hu * 0.05];
  return J;
}

// ---------------------------------------------------------------- the texture atlas (128 × 128 texels)
export const AW = 128;
const REG = { torso: [0, 0, 64, 48], armL: [64, 0, 32, 40], armR: [96, 0, 32, 40], legL: [0, 48, 32, 48], legR: [32, 48, 32, 48], skirt: [64, 40, 64, 32], shoe: [64, 72, 32, 24], hand: [96, 72, 16, 24], pal: [0, 96, 128, 32] };

// ---------------------------------------------------------------- mesh building
class Geo {
  constructor() { this.P = []; this.UV = []; this.SI = []; this.SW = []; this.I = []; }
  get n() { return this.P.length / 3; }
  v(p, uv, w) { this.P.push(p[0], p[1], p[2]); this.UV.push(uv[0], uv[1]); const s = [0, 0, 0, 0], ww = [0, 0, 0, 0]; w.slice(0, 4).forEach(([b, k], i) => { s[i] = BI[b]; ww[i] = k; }); const t = ww[0] + ww[1] + ww[2] + ww[3] || 1; this.SI.push(...s); this.SW.push(ww[0] / t, ww[1] / t, ww[2] / t, ww[3] / t); return this.n - 1; }
  /**
   * a lofted low-poly tube. nodes: [{ c: [x, y, z], rx, rz, w: [[bone, k], …], t (0..1 along the texture region), rf: (θ) => radius factor }]
   * o: { seg, se (superellipse exponent), cap0, cap1, fwd: ring reference, reg: [x, y, w, h] texels | sw: [u, v] a plain swatch, inside }
   * Rings run θ = 0 at the frame's X (the character's left for upright and hanging tubes), θ = π/2 at the front.
   */
  tube(nodes, o = {}) {
    const N = o.seg || 8, se = o.se || 2, base = this.n, sp = (v) => Math.sign(v) * Math.pow(Math.abs(v), 2 / se), R = o.reg;
    const uvAt = (u, t) => (o.sw ? o.sw : [(R[0] + u * R[2]) / AW, (R[1] + cl(t) * R[3]) / AW]);
    const centres = [];
    for (let i = 0; i < nodes.length; i++) {
      const nd = nodes[i], a = nodes[Math.max(0, i - 1)].c, b = nodes[Math.min(nodes.length - 1, i + 1)].c;
      let T = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const tl = Math.hypot(...T) || 1; T = T.map((v) => v / tl);
      let Z = o.fwd || [0, 0, 1]; const d = Z[0] * T[0] + Z[1] * T[1] + Z[2] * T[2]; Z = [Z[0] - T[0] * d, Z[1] - T[1] * d, Z[2] - T[2] * d]; const zl = Math.hypot(...Z) || 1; Z = Z.map((v) => v / zl);
      const X = [T[1] * Z[2] - T[2] * Z[1], T[2] * Z[0] - T[0] * Z[2], T[0] * Z[1] - T[1] * Z[0]];
      const flip = T[1] < 0 ? -1 : 1;
      const t = nd.t ?? i / Math.max(1, nodes.length - 1);
      for (let k = 0; k <= N; k++) {
        const th = (k / N) * TAU, rf = nd.rf ? nd.rf(th) : 1, cx = sp(Math.cos(th)) * nd.rx * rf, cz = sp(Math.sin(th)) * nd.rz * rf;
        this.v([nd.c[0] + X[0] * cx * flip + Z[0] * cz, nd.c[1] + X[1] * cx * flip + Z[1] * cz, nd.c[2] + X[2] * cx * flip + Z[2] * cz], uvAt(k / N, t), nd.w);
      }
      centres.push(nd.c);
    }
    // winding: outward faces (tested on the first quad against the ring's radial direction)
    const P = this.P, at = (i) => [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]];
    const a0 = at(base), b0 = at(base + 1), d0 = at(base + N + 2), e1 = [b0[0] - a0[0], b0[1] - a0[1], b0[2] - a0[2]], e2 = [d0[0] - a0[0], d0[1] - a0[1], d0[2] - a0[2]];
    const nrm = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], c0 = centres[0];
    let out = nrm[0] * (a0[0] - c0[0]) + nrm[1] * (a0[1] - c0[1]) + nrm[2] * (a0[2] - c0[2]) > 0;
    if (o.inside) out = !out;
    for (let i = 0; i < nodes.length - 1; i++) for (let k = 0; k < N; k++) {
      const a = base + i * (N + 1) + k, b = a + 1, c = a + N + 1, d = c + 1;
      if (out) this.I.push(a, b, d, a, d, c); else this.I.push(a, d, b, a, c, d);
    }
    const cap = (i, j) => {
      const nd = nodes[i], c = this.v(nd.c, uvAt(0.12, nd.t ?? i / Math.max(1, nodes.length - 1)), nd.w), r0 = base + i * (N + 1);
      const away = [nd.c[0] - nodes[j].c[0], nd.c[1] - nodes[j].c[1], nd.c[2] - nodes[j].c[2]];
      const p1 = at(r0), p2 = at(r0 + 1), u1 = [p1[0] - nd.c[0], p1[1] - nd.c[1], p1[2] - nd.c[2]], u2 = [p2[0] - nd.c[0], p2[1] - nd.c[1], p2[2] - nd.c[2]];
      const n2 = [u1[1] * u2[2] - u1[2] * u2[1], u1[2] * u2[0] - u1[0] * u2[2], u1[0] * u2[1] - u1[1] * u2[0]];
      const fwd = n2[0] * away[0] + n2[1] * away[1] + n2[2] * away[2] > 0;
      for (let k = 0; k < N; k++) { const a = r0 + k, b = a + 1; if (fwd !== !!o.inside) this.I.push(c, a, b); else this.I.push(c, b, a); }
    };
    if (o.cap0) cap(0, 1);
    if (o.cap1) cap(nodes.length - 1, nodes.length - 2);
    return this;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.UV, 2));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.SI, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.SW, 4));
    g.setIndex(this.I); g.computeVertexNormals(); g.computeBoundingSphere();
    return g;
  }
}
// a five-point star (radius r) point test
function inStar(x, y, r) {
  const pts = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, rr = (i % 2 ? 0.42 : 1) * r; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  let inside = false; for (let i = 0, j = 9; i < 10; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside; }
  return inside;
}
// weights: a joint blend between two bones by t (0 → a, 1 → b)
const W = (a, b, t) => (t <= 0 ? [[a, 1]] : t >= 1 ? [[b, 1]] : [[a, 1 - t], [b, t]]);

// ---------------------------------------------------------------- the outfit's layout (shared by the mesh and the painter)
function layout(spec, D) {
  const o = spec.outfit || {}, T = o.top || {}, Bt = o.bottom || {}, hu = D.hu;
  const tk = T.kind || 'hoodie', bk = Bt.kind || 'pants';
  const L = { o, T, Bt, S: o.shoes || {}, tk, bk };
  L.sleeve = T.sleeve || (tk === 'tee' || tk === 'crop' ? 'short' : tk === 'tank' || tk === 'tube' ? 'none' : 'long');
  L.open = tk === 'jacket' || tk === 'blazer' || tk === 'cardigan' || tk === 'coat';
  L.hemY = tk === 'hoodie' || tk === 'jacket' ? D.hipJ - hu * 0.02 : tk === 'coat' ? D.knee + hu * 0.3 : tk === 'blazer' ? D.hipJ - hu * 0.06 : tk === 'crop' || tk === 'tube' ? (T.hem === 'low' ? D.hipJ + hu * 0.34 : D.waist + hu * 0.12) : D.hipJ + hu * 0.12;
  L.waistBand = bk === 'cargo' ? D.hipJ + hu * 0.14 : D.hipJ + hu * 0.32;
  L.neckLine = tk === 'tube' ? D.chest + hu * 0.16 : tk === 'tank' || tk === 'tee' || tk === 'blouse' || tk === 'crop' ? D.neckBase - hu * 0.14 : D.neckBase + hu * 0.02;
  L.fray = tk === 'crop' || tk === 'tube' || T.fray;
  L.pants = bk === 'pants' || bk === 'jeans' || bk === 'slacks' || bk === 'track' || bk === 'cargo';
  L.skirt = bk === 'skirt' || bk === 'dress';
  L.loose = bk === 'cargo' ? 1.32 : L.pants ? 1.12 : 1;
  L.shortsHem = D.knee + (D.hipJ - D.knee) * 0.42;
  const apron = (o.acc || []).find((a) => (a.kind || a) === 'apron');
  L.apron = apron ? rgb(apron.color || '#c83a3a') : null;
  L.torsoTop = D.neckBase - hu * 0.02;
  L.legTop = D.hipJ + hu * 0.12;
  return L;
}

// ---------------------------------------------------------------- the painter
/** paints the 128×128 atlas for this spec; returns { B, sw(color) → swatch uv } */
function paint(spec, D, L) {
  const B = new Buf(AW, AW), hu = D.hu, { o, T, Bt, S, tk, bk } = L, seed = (spec.id || '').length * 31 + Math.round(D.H * 1000);
  const skin = rgb(spec.skin || '#f0c8a8'), top = rgb(T.color || '#e8603a'), top2 = rgb(T.color2 || T.color || '#f4efe6'), inner = rgb(T.inner || T.color2 || '#f4efe6');
  const bot = rgb(Bt.color || '#2e3a5e'), sock = rgb(o.socks || '#f4f0ea'), tights = o.tights ? rgb(o.tights) : null, belt = rgb(Bt.belt || (bk === 'cargo' ? Bt.color || '#6a6a6a' : '#2a2224'));
  const ink = [40, 32, 38], fuzz = (c) => mix(c, [150, 146, 150], 0.45);
  // a frayed edge: the boundary wobbles per texel column
  const frayAt = (i, k) => (hash(i, k, seed) - 0.5) * 2.4;
  // ---- swatches for plain parts (4×4 texels each)
  const pal = REG.pal, swatches = new Map(); let ns = 0;
  const sw = (c) => { c = rgb(c).map((v) => Math.round(v)); const key = c.join(','); if (swatches.has(key)) return swatches.get(key); const x = pal[0] + (ns % 32) * 4, y = pal[1] + Math.floor(ns / 32) * 4; ns++; B.rect(x, y, 4, 4, c); const uv = [(x + 2) / AW, (y + 2) / AW]; swatches.set(key, uv); return uv; };
  // a small printed emblem on the chest (star, flame, heart) as an outline, in torso (u, y) space
  const emY = lerp(L.hemY, Math.min(L.neckLine, D.chest + hu * 0.1), 0.62), emR = hu * 0.13;
  const em = (u, y) => {
    const x = ((u - 0.25) * TAU * (D.tw.chest + D.td.chest) * 0.5) / emR, yy = (y - emY) / emR; if (Math.abs(x) > 1.3 || Math.abs(yy) > 1.3) return false;
    let d;
    if (T.emblem === 'flame') { const w = 0.62 * Math.sqrt(Math.max(0, 1 - Math.pow((yy + 0.25) / 1.05, 2))) * (1 - Math.max(0, yy) * 0.55); d = Math.abs(x) - w; if (yy > 0.4) d = Math.max(d, Math.abs(x - (yy - 0.4) * 0.5) - 0.25 * (1.3 - yy)); }
    else if (T.emblem === 'heart') { const a = x * 1.1, b = yy * 1.1 + 0.25; d = Math.pow(a * a + b * b - 0.6, 3) - a * a * b * b * b; return d < 0 && d > -0.08; }
    else return inStar(x, yy, 1) && !inStar(x, yy, 0.62);
    return d < 0 && d > -0.32;
  };
  // ---- torso: u around (0 left side, .25 front, .5 right, .75 back), t: crotch → torsoTop
  const [tx, ty, tw, th] = REG.torso, y0 = D.crotch, y1 = L.torsoTop;
  B.fill(tx, ty, tw, th, (i, j) => {
    const u = (i + 0.5) / tw, y = lerp(y0, y1, (j + 0.5) / th), a = u * TAU, front = Math.sin(a), side = Math.cos(a), dy = (y1 - y0) / th;
    const fr = L.fray ? frayAt(i, 1) * dy : 0;
    if (y > L.neckLine + (L.fray ? frayAt(i, 2) * dy : 0)) {
      if (L.fray && y < L.neckLine + dy * 1.5) return fuzz(top);
      // bare skin above the neckline: collarbone strokes on the front, the shadow the neckline throws
      if (front > 0.6 && Math.abs(y - (L.torsoTop - hu * 0.1)) < dy * 0.6 && Math.abs(side) > 0.12 && Math.abs(side) < 0.55) return shade(skin, 0.86);
      if (L.neckLine < L.torsoTop - hu * 0.05 && Math.abs(y - L.neckLine) < dy * 1.2) return shade(skin, 0.9);
      if (tk === 'tank' && Math.abs(Math.abs(side) - 0.45) < 0.08) return top;                  // a tank's straps
      return skin;
    }
    if (L.apron && front > 0.25 && y < D.chest + hu * 0.1 && y > D.crotch) return Math.abs(y - (D.waist - hu * 0.05)) < hu * 0.04 ? shade(L.apron, 0.75) : L.apron;
    if (y >= L.hemY + fr) {
      if (L.fray && y < L.hemY + fr + dy * 1.5) return fuzz(top);
      if (L.open && front > 0.8 && y > L.waistBand - hu * 0.2) { if (Math.abs(side) < 0.18) return Math.abs(side) < 0.025 && tk === 'blazer' ? ink : inner; if (Math.abs(side) < 0.24) return shade(top, 0.78); }
      if (tk === 'hoodie' && front > 0.55 && Math.abs(y - (D.waist - hu * 0.05)) < hu * 0.14) return Math.abs(y - (D.waist + hu * 0.09)) < dy || Math.abs(front - 0.56) < 0.03 ? shade(top, 0.7) : shade(top, 0.88);
      if (T.stripe && Math.abs(y - D.chest) < hu * 0.05) return rgb(T.stripe);
      if (!L.fray && y < L.hemY + hu * 0.06) return shade(top, 0.8);                               // the hem band
      if ((tk === 'jacket' || tk === 'hoodie') && front > 0.985) return shade(top2, 0.7);          // the zip
      if (tk === 'hoodie' && front > 0.9 && y > L.neckLine - hu * 0.3 && Math.abs(side) > 0.12 && Math.abs(side) < 0.16) return [240, 236, 230];   // drawstrings
      if (Math.abs(side) > 0.985) return shade(top, 0.86);                                        // the side seams
      if (front > 0.3 && Math.abs(y - (D.chest - hu * 0.22)) < hu * 0.03 && D.f) return shade(top, 0.88);   // a painted fold under the chest
      if (T.emblem && em(u, y)) return T.emblemColor ? rgb(T.emblemColor) : shade(top, 0.62);     // a printed emblem
      if (L.fray && hash(i, j, seed + 5) < 0.05) return shade(top, 0.92);                         // worn cotton
      return top;
    }
    if (L.fray && y > L.hemY + fr - dy * 2.5 && y > L.waistBand) return shade(skin, 0.86);          // the top's shadow on the midriff
    if (L.skirt) return y > D.crotch + hu * 0.02 ? shade(bot, 0.9) : bot;
    if (y > L.waistBand - hu * 0.05) {
      if (y > L.waistBand) { if (front > 0.96 && Math.abs(y - (D.waist - hu * 0.14)) < dy * 0.6) return shade(skin, 0.84); return skin; }   // the midriff, a navel
      if (bk === 'cargo' && front > 0.97) return [200, 200, 196];                                  // the button
      return belt;
    }
    if (bk === 'cargo' && front > 0.97) return shade(bot, 0.76);                                   // the fly
    if (Math.abs(side) > 0.97) return shade(bot, 0.85);
    return bot;
  });
  // ---- arms: u around, t = shoulder (0) → elbow (.5) → wrist (1)
  const slv = L.sleeve === 'long' ? 2 : L.sleeve === 'short' ? 0.55 : L.sleeve === 'mid' ? 1.4 : 0;
  for (const k of ['armL', 'armR']) {
    const [ax, ay, aw, ah] = REG[k], du = 2 / ah;
    B.fill(ax, ay, aw, ah, (i, j) => {
      const u = ((j + 0.5) / ah) * 2, a = ((i + 0.5) / aw) * TAU, fr = L.fray ? frayAt(i, 3) * du : 0;
      if (u < slv + fr) {
        if (L.sleeve === 'long' && u > 1.88) return shade(top, 0.78);
        if (L.fray && u > slv + fr - du * 1.5) return fuzz(top);
        if (u > slv - 0.08 && !L.fray) return shade(top, 0.84);
        if (T.stripe && Math.abs(u - 0.4) < 0.05) return rgb(T.stripe);
        return Math.abs(u - 1) < 0.05 && L.sleeve === 'long' ? shade(top, 0.88) : top;          // the elbow crease
      }
      if (u < slv + fr + du * 1.5 && slv > 0) return shade(skin, 0.86);
      if (Math.abs(u - 1) < du * 0.6 && Math.sin(a) < -0.5) return shade(skin, 0.9);              // the elbow
      return skin;
    });
  }
  // ---- legs: u around, t = legTop (0) → ankle (1)
  const sockTop = o.legs === 'kneesocks' ? D.knee - hu * 0.12 : o.legs === 'socks' ? D.ankle + hu * 0.25 : 0;
  for (const [k, sd] of [['legL', 1], ['legR', -1]]) {
    const [lx, ly, lw, lh] = REG[k], ya = L.legTop, yb = D.ankle, dy = (ya - yb) / lh, outerU = sd > 0 ? 0 : 0.5;
    const pk0 = D.knee + (D.hipJ - D.knee) * 0.25, pk1 = D.knee + (D.hipJ - D.knee) * 0.62;
    B.fill(lx, ly, lw, lh, (i, j) => {
      const u = (i + 0.5) / lw, t = (j + 0.5) / lh, y = lerp(ya, yb, t), a = u * TAU, front = Math.sin(a), du = Math.abs(((u - outerU + 1.5) % 1) - 0.5);
      if (!L.skirt && y > D.hipJ - hu * 0.15) return y > L.waistBand - hu * 0.05 ? (y > L.waistBand ? skin : belt) : bot;
      if (L.pants) {
        if (bk === 'track' && Bt.color2 && du < 0.05) return rgb(Bt.color2);
        if (bk === 'jeans' && Math.abs(du - 0.02) < 0.012) return mix(bot, [230, 200, 120], 0.45);   // the outer seam's stitching
        if (bk === 'cargo' && du < 0.1 && y < pk1 && y > pk0) {                                       // a cargo pocket with its flap
          if (y > pk1 - hu * 0.08) return y < pk1 - hu * 0.07 ? shade(bot, 0.66) : shade(bot, 0.86);
          if (du > 0.085 || y < pk0 + dy) return shade(bot, 0.7);
          return shade(bot, 1.04);
        }
        if (y < yb + hu * 0.22) return shade(bot, 0.86);
        return bk === 'jeans' && hash(i, j, 7) < 0.12 ? shade(bot, 1.08) : bot;
      }
      if (bk === 'shorts' && y > L.shortsHem) return y < L.shortsHem + hu * 0.05 ? shade(bot, 0.82) : bot;
      if (y < sockTop) return y > sockTop - hu * 0.06 ? shade(sock, 0.86) : sock;
      if (tights) return front < -0.7 && Math.abs(y - D.knee) < hu * 0.04 ? shade(tights, 0.85) : tights;
      if (Math.abs(y - D.knee) < dy * 0.7 && front > 0.5) return shade(skin, 0.9);                  // the knee
      return skin;
    });
    // fold strokes on trousers: zigzags at the crotch, knee and the bunched ankles
    if (L.pants) {
      const fc = shade(bot, bk === 'cargo' ? 0.8 : 0.84), P = (u, t) => [lx + (((u % 1) + 1) % 1) * lw, ly + t * lh], innerU = sd > 0 ? 0.5 : 0;
      const zig = (u0, u1, t0, amp, n) => { const pts = []; for (let q = 0; q <= n; q++) pts.push(P(lerp(u0, u1, q / n), t0 + (q % 2 ? amp : -amp))); for (let q = 0; q < pts.length - 1; q++) if (Math.abs(pts[q][0] - pts[q + 1][0]) < lw / 2) B.line(...pts[q], ...pts[q + 1], fc); };
      const kt = (L.legTop - D.knee) / (L.legTop - D.ankle);
      zig(0.12, 0.38, kt - 0.03, 0.012, 6);
      if (bk === 'cargo') { zig(0.0, 1.0, 0.88, 0.014, 14); zig(0.6, 0.9, kt - 0.12, 0.01, 4); }
      // diagonal pulls from the crotch on the inner thigh
      const s2 = sd > 0 ? -1 : 1;
      B.line(...P(innerU + s2 * 0.2, 0.05), ...P(innerU + s2 * 0.28, 0.16), fc);
    }
  }
  // ---- skirt: u around, t = waist (0) → hem (1)
  if (L.skirt) {
    const [sx, sy, sw2, sh] = REG.skirt, pl = Bt.cut === 'pencil' ? 0 : Bt.pleats ?? 16, pc = Bt.plaid ? rgb(Bt.plaid) : null;
    B.fill(sx, sy, sw2, sh, (i, j) => {
      const u = (i + 0.5) / sw2, t = (j + 0.5) / sh;
      if (t < 0.08) return shade(bot, 0.82);
      let c = bot;
      if (pc) { const odd = Math.floor(u * Math.max(pl, 8) * 2) % 2, band = Math.floor(t * 6) % 3 === 1; c = odd ? mix(bot, pc, 0.24) : bot; if (band) c = mix(c, pc, 0.18); if (t > 0.88) c = mix(c, pc, 0.5); }
      if (pl && i % Math.max(2, Math.round(sw2 / pl)) === 0 && t > 0.15) c = shade(c, 0.76);   // the pleat folds
      return c;
    });
  }
  // ---- shoes: u around (up = .25), t = heel (0) → toe (1)
  { const [sx, sy, sw2, sh] = REG.shoe, kind = S.kind || 'sneakers', shoe = rgb(S.color || '#f2f0ea'), sole = rgb(S.sole || (kind === 'sneakers' ? '#fafaf6' : '#2a2224')), acc = rgb(S.accent || S.color || '#e8603a');
    B.fill(sx, sy, sw2, sh, (i, j) => {
      const u = (i + 0.5) / sw2, t = (j + 0.5) / sh, a = u * TAU, up = Math.sin(a), sd = Math.abs(Math.cos(a));
      if (up < -0.45) return shade(sole, 0.9);
      if (up < -0.15) return Math.abs(up + 0.15) < 0.07 ? shade(sole, 0.72) : sole;
      if (kind === 'sneakers') {
        if (up > 0.82 && t > 0.3 && t < 0.72) return j % 2 ? [246, 244, 240] : shade(shoe, 0.8);   // laces
        if (t > 0.82 && up > 0.2) return shade(shoe, 1.06);
        if (sd > 0.55 && t > 0.2 && t < 0.62 && Math.abs(up - (t - 0.2) * 0.9) < 0.18) return acc;  // the side stripe
        if (t < 0.12) return shade(acc, 0.9);
      }
      if (kind === 'boots' && up > 0.8 && t > 0.3 && t < 0.6 && i % 3 === 0) return [196, 180, 120];
      return shade(shoe, up > 0.5 ? 1.04 : 0.96);
    }); }
  // ---- hands
  { const [hx, hy, hw2, hh] = REG.hand, gl = o.gloves ? rgb(o.gloves) : skin; B.fill(hx, hy, hw2, hh, (i, j) => (j < 3 ? shade(gl, 0.92) : gl)); }
  return { B, sw, top, bot };
}

/** the whole body (not the head and hair: see head.js) → { geo, tex } */
export function buildBody(spec, D, J) {
  const L = layout(spec, D), { o, Bt, tk, bk } = L, hu = D.hu;
  const { B, sw, top, bot } = paint(spec, D, L);
  const G = new Geo();
  const bulk = (y) => (y <= L.hemY + 0.001 || y > L.neckLine ? 0 : hu * (tk === 'hoodie' || tk === 'coat' ? 0.06 : tk === 'jacket' ? 0.045 : 0.02));
  // ---- torso: crotch → shoulders, with the top's bulk
  const Tn = [], tT = (y) => (y - D.crotch) / (L.torsoTop - D.crotch);
  const tnode = (y, rx, rz, cz, w) => { const b = bulk(y); Tn.push({ c: [0, y, cz], rx: rx + b, rz: rz + b, w, t: tT(y) }); };
  tnode(D.crotch, D.tw.crotch, D.td.crotch, 0, [['hips', 1]]);
  tnode(D.hipJ - hu * 0.02, D.tw.hip * 0.95, D.td.hip * 0.95, 0, [['hips', 1]]);
  tnode(D.hipJ + hu * 0.12, lerp(D.tw.hip, D.tw.waist, 0.3) * (bk === 'cargo' ? 1.04 : 1), lerp(D.td.hip, D.td.waist, 0.3), -0.004, [['hips', 1]]);
  if (L.hemY > D.hipJ && L.hemY < D.chest) { const k = cl((L.hemY - D.hipJ) / (D.waist - D.hipJ)), rx = lerp(D.tw.hip, D.tw.waist, k), rz = lerp(D.td.hip, D.td.waist, k), ex = L.fray ? hu * 0.02 : bulk(L.hemY + 0.01); tnode(L.hemY - 0.002, rx, rz, 0, [['hips', 0.5], ['spine', 0.5]]); tnode(L.hemY + 0.002, rx + ex, rz + ex, 0, [['hips', 0.5], ['spine', 0.5]]); }
  tnode(D.waist, D.tw.waist, D.td.waist + D.belly, D.belly * 0.5, [['spine', 1]]);
  tnode(lerp(D.waist, D.chest, 0.5), lerp(D.tw.waist, D.tw.chest, 0.6), lerp(D.td.waist, D.td.chest, 0.6) + D.belly * 0.5, D.belly * 0.25, [['spine', 0.5], ['chest', 0.5]]);
  tnode(D.chest, D.tw.chest, D.td.chest, 0.004, [['chest', 1]]);
  tnode(lerp(D.chest, D.shY, 0.55), D.tw.shoulder * 0.98, D.td.chest * 0.92, 0, [['chest', 1]]);
  tnode(D.shY - hu * 0.04, D.tw.shoulder * 0.9, D.td.shoulder * 1.08, -0.004, [['chest', 1]]);
  tnode(D.shY + hu * 0.03, D.tw.shoulder * 0.66, D.td.shoulder * 0.98, -0.008, [['chest', 1]]);
  tnode(L.torsoTop, hu * 0.19, hu * 0.16, -0.01, [['chest', 0.7], ['neck', 0.3]]);
  Tn.sort((a, b) => a.c[1] - b.c[1]);
  G.tube(Tn, { seg: 10, se: 2.2, cap0: true, cap1: true, reg: REG.torso });
  // hoodie hood: a soft roll behind the neck; a jacket / blazer collar
  if (tk === 'hoodie') G.tube([{ c: [0, D.shY - hu * 0.02, -D.td.shoulder * 0.9], rx: hu * 0.32, rz: hu * 0.12, w: [['chest', 1]] }, { c: [0, D.neckBase + hu * 0.06, -D.td.shoulder * 1.05], rx: hu * 0.3, rz: hu * 0.15, w: [['chest', 0.6], ['neck', 0.4]] }, { c: [0, D.neckBase + hu * 0.16, -D.td.shoulder * 0.8], rx: hu * 0.22, rz: hu * 0.08, w: [['neck', 1]] }], { seg: 8, cap0: true, cap1: true, sw: sw(shade(top, 0.9)) });
  if (tk === 'jacket' || tk === 'blazer' || tk === 'coat') G.tube([{ c: [0, D.neckBase - hu * 0.08, -0.005], rx: hu * 0.3, rz: hu * 0.26, w: [['chest', 1]] }, { c: [0, D.neckBase + hu * 0.06, -0.02], rx: hu * 0.24, rz: hu * 0.22, w: [['chest', 0.5], ['neck', 0.5]] }], { seg: 10, sw: sw(shade(top, 0.86)) });
  // ---- the long anime neck
  const skinSw = sw(spec.skin || '#f0c8a8');
  G.tube([{ c: [0, D.neckBase - hu * 0.12, -0.01], rx: hu * 0.13, rz: hu * 0.12, w: [['chest', 1]] }, { c: [0, D.neckBase + hu * 0.04, -hu * 0.02], rx: hu * 0.11, rz: hu * 0.11, w: [['neck', 1]] }, { c: [0, D.chin + hu * 0.2, D.hcz - hu * 0.07], rx: hu * 0.1, rz: hu * 0.11, w: [['head', 1]] }], { seg: 6, sw: skinSw });
  // ---- arms (A-pose), sleeves, mitten hands with thumbs
  const slv = L.sleeve === 'long' ? 2 : L.sleeve === 'short' ? 0.55 : L.sleeve === 'mid' ? 1.4 : 0;
  for (const [s, k] of [[1, 'L'], [-1, 'R']]) {
    const sh = J['ua' + k], el = J['fa' + k], wr = J['h' + k], R = D.r, sb = tk === 'hoodie' || tk === 'coat' ? 1.35 : tk === 'jacket' || tk === 'blazer' ? 1.2 : 1.1;
    const P = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
    const sr = (u) => (u < slv ? sb : 1), nodes = [];
    const an = (u, c, r, w) => nodes.push({ c, rx: r * sr(u), rz: r * sr(u) * 1.02, w, t: u / 2 });
    an(0, [sh[0] - s * hu * 0.12, sh[1] - hu * 0.05, sh[2]], R.uarm * 0.95, [['chest', 0.6], ['ua' + k, 0.4]]);
    an(0.14, P(sh, el, 0.14), R.uarm, [['ua' + k, 1]]);
    an(0.6, P(sh, el, 0.6), R.uarm * 0.9, [['ua' + k, 1]]);
    if (slv > 0.05 && slv < 1) { an(slv - 0.01, P(sh, el, slv - 0.01), R.uarm * 0.9, [['ua' + k, 1]]); an(slv + 0.01, P(sh, el, slv + 0.01), R.uarm * 0.82, [['ua' + k, 1]]); }
    an(0.94, P(sh, el, 0.94), R.elbow * 1.05, W('ua' + k, 'fa' + k, 0.3));
    an(1.06, P(el, wr, 0.06), R.elbow, W('ua' + k, 'fa' + k, 0.7));
    an(1.4, P(el, wr, 0.4), R.farm, [['fa' + k, 1]]);
    if (slv >= 1 && slv < 2) { an(slv - 0.01, P(el, wr, slv - 1.01), R.farm * 0.95, [['fa' + k, 1]]); an(slv + 0.01, P(el, wr, slv - 0.99), R.farm * 0.88, [['fa' + k, 1]]); }
    an(1.96, P(el, wr, 0.96), R.wrist, W('fa' + k, 'h' + k, 0.3));
    nodes.sort((a, b) => b.c[1] - a.c[1]);
    G.tube(nodes, { seg: 7, cap0: true, reg: REG['arm' + k] });
    // the hand: a soft mitten continuing the arm, the thumb turned forward
    const d = D.armDir, hd = [s * d[0], d[1], 0], hl = D.hand;
    const hp = (t, side = 0, fwd = 0) => [wr[0] + hd[0] * hl * t + s * side, wr[1] + hd[1] * hl * t, wr[2] + fwd];
    G.tube([{ c: hp(0), rx: R.wrist * 1.02, rz: R.wrist * 0.9, w: [['h' + k, 1]], t: 0 }, { c: hp(0.4, 0, 0.004), rx: hu * (D.f ? 0.072 : 0.085), rz: hu * 0.042, w: [['h' + k, 1]], t: 0.4 }, { c: hp(0.8, 0, 0.004), rx: hu * (D.f ? 0.066 : 0.078), rz: hu * 0.036, w: [['h' + k, 1]], t: 0.8 }, { c: hp(1, 0, 0.002), rx: hu * 0.05, rz: hu * 0.03, w: [['h' + k, 1]], t: 1 }], { seg: 6, cap1: true, reg: REG.hand });
    G.tube([{ c: hp(0.25, -hu * 0.03, hu * 0.04), rx: hu * 0.026, rz: hu * 0.026, w: [['h' + k, 1]] }, { c: hp(0.55, -hu * 0.05, hu * 0.07), rx: hu * 0.021, rz: hu * 0.021, w: [['h' + k, 1]] }], { seg: 4, cap1: true, sw: o.gloves ? sw(o.gloves) : skinSw });
  }
  // ---- legs
  const legT = (y) => (L.legTop - y) / (L.legTop - D.ankle);
  for (const [s, k] of [[1, 'L'], [-1, 'R']]) {
    const th = J['th' + k], kn = J['sh' + k], an = J['ft' + k], R = D.r;
    const P = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
    const nodes = [], loose = L.loose, cargo = bk === 'cargo';
    const ln = (c, r, w, kk = loose) => nodes.push({ c, rx: r * kk, rz: r * kk * 1.04, w, t: legT(c[1]) });
    // baggy cargo pants stay wide all the way down and pool over the shoes
    const wide = cargo ? 1.5 : 1;
    ln([th[0] * 0.92, L.legTop, 0], R.thigh * 1.08, [['hips', 1]]);
    ln(P(th, kn, 0.08), R.thigh, W('hips', 'th' + k, 0.6));
    if (bk === 'shorts') { const t = (D.hipJ - L.shortsHem) / (D.hipJ - D.knee); ln(P(th, kn, t - 0.02), R.thigh * 0.9, [['th' + k, 1]], 1.25); ln(P(th, kn, t + 0.01), R.thigh * 0.84, [['th' + k, 1]], 1.0); }
    ln(P(th, kn, 0.55), R.thigh * 0.8 * (cargo ? 1.1 : 1), [['th' + k, 1]]);
    ln(P(th, kn, 0.92), R.knee * 1.05 * wide, W('th' + k, 'sh' + k, 0.3));
    ln(P(kn, an, 0.06), R.knee * wide, W('th' + k, 'sh' + k, 0.75));
    if (o.legs === 'kneesocks' && !L.pants) { const t = (hu * 0.12) / (D.knee - D.ankle); ln(P(kn, an, t - 0.01), R.calf * 1.02, [['sh' + k, 1]]); ln(P(kn, an, t + 0.01), R.calf * 1.08, [['sh' + k, 1]]); }
    ln(P(kn, an, 0.32), R.calf * wide, [['sh' + k, 1]]);
    ln(P(kn, an, 0.78), R.ankle * 1.25 * (cargo ? 2.1 : 1), [['sh' + k, 1]]);
    ln(P(kn, an, 1.0), R.ankle * (cargo ? 2.3 : 1), W('sh' + k, 'ft' + k, 0.5));
    nodes.sort((a, b) => b.c[1] - a.c[1]);
    G.tube(nodes, { seg: 8, cap1: true, reg: REG['leg' + k] });
    // ---- shoes: chunky anime sneakers (boots: a tall shaft; pumps: sleeker)
    const sk = L.S.kind || 'sneakers', big = sk === 'sneakers' ? 1.12 : sk === 'boots' ? 1.08 : 0.9, fx = an[0], Ls = hu * (sk === 'pumps' ? 0.56 : 0.64) * big;
    const sn = [], sh2 = (z, w, h, t) => sn.push({ c: [fx, h / 2, z], rx: w, rz: h / 2, w: [['ft' + k, 1]], t });
    sh2(-Ls * 0.28, hu * 0.09 * big, hu * 0.2 * big, 0); sh2(-Ls * 0.1, hu * 0.115 * big, hu * 0.23 * big, 0.18); sh2(Ls * 0.25, hu * 0.13 * big, hu * 0.18 * big, 0.52); sh2(Ls * 0.55, hu * 0.12 * big, hu * 0.13 * big, 0.82); sh2(Ls * 0.72, hu * 0.08 * big, hu * 0.08 * big, 1);
    G.tube(sn, { seg: 8, se: 2.6, cap0: true, cap1: true, fwd: [0, 1, 0], reg: REG.shoe });
    const shoeSw = sw(L.S.color || '#f2f0ea');
    if (sk === 'boots') G.tube([{ c: [fx, hu * 0.2, 0], rx: R.ankle * 1.7, rz: R.ankle * 1.8, w: [['ft' + k, 1]] }, { c: [fx * 0.98, D.ankle + hu * 0.55, 0.003], rx: R.calf * 1.18, rz: R.calf * 1.2, w: [['sh' + k, 1]] }], { seg: 8, cap0: true, cap1: true, sw: shoeSw });
    if (sk === 'sneakers' && !cargo) G.tube([{ c: [fx, hu * 0.24, -hu * 0.02], rx: R.ankle * 1.45, rz: R.ankle * 1.5, w: [['ft' + k, 1]] }, { c: [fx, hu * 0.34, -hu * 0.04], rx: R.ankle * 1.35, rz: R.ankle * 1.45, w: [['sh' + k, 0.5], ['ft' + k, 0.5]] }], { seg: 8, sw: shoeSw });
  }
  // ---- the skirt: pleated, flaring, on its own spring bone (a dark lining inside)
  if (L.skirt) {
    const pencil = Bt.cut === 'pencil', len = Bt.length || (Bt.cut === 'mini' ? 'mini' : Bt.cut === 'long' ? 'long' : pencil ? 'knee' : 'mid');
    const top0 = D.waist - hu * 0.08, hem = len === 'long' ? D.knee - hu * 0.75 : len === 'knee' ? D.knee + hu * 0.12 : D.hipJ - (D.hipJ - D.knee) * (len === 'mini' ? 0.32 : 0.55), pl = pencil ? 0 : Bt.pleats ?? 16;
    const flare = pencil ? 1.05 : len === 'long' ? 1.7 : 1.55, sT = (y) => (top0 - y) / (top0 - hem);
    const rf = (th) => (pl ? 1 + 0.07 * Math.abs(((th / TAU) * pl * 2) % 2 - 1) : 1);
    const nodes = [{ c: [0, top0, 0], rx: D.tw.waist * 1.08, rz: D.td.waist * 1.12, w: [['hips', 1]], t: 0 }, { c: [0, top0 - hu * 0.06, 0], rx: D.tw.waist * 1.12, rz: D.td.waist * 1.15, w: [['hips', 1]], rf, t: sT(top0 - hu * 0.06) },
      { c: [0, D.hipJ + hu * 0.05, 0], rx: D.tw.hip * 1.12, rz: D.td.hip * 1.18, w: [['hips', 0.7], ['skirt', 0.3]], rf, t: sT(D.hipJ + hu * 0.05) }, { c: [0, hem, 0], rx: D.tw.hip * flare, rz: D.td.hip * (flare + 0.2), w: [['skirt', 1]], rf, t: 1 }];
    const seg = Math.max(12, pl);
    G.tube(nodes, { seg, cap0: true, reg: REG.skirt });
    G.tube(nodes.map((n) => ({ ...n, rx: n.rx * 0.97, rz: n.rz * 0.97 })), { seg, inside: true, sw: sw(shade(bot, 0.5)) });
  }
  // ---- an apron's flap hanging in front of the thighs
  if (L.apron) G.tube([{ c: [0, D.hipJ + hu * 0.1, D.td.hip * 0.95], rx: D.tw.hip * 1.0, rz: hu * 0.03, w: [['hips', 1]] }, { c: [0, D.knee + hu * 0.25, D.td.hip * 1.15], rx: D.tw.hip * 1.05, rz: hu * 0.025, w: [['hips', 1]] }], { seg: 8, se: 6, cap0: true, cap1: true, sw: sw(L.apron) });
  // ---- accessories: backpack with straps, bags
  for (const a of o.acc || []) {
    const kind = a.kind || a;
    if (kind === 'backpack') {
      const c = rgb(a.color || '#2e6a8a'), zb = -D.td.chest - hu * 0.07, y0 = D.waist - hu * 0.05, y1 = D.shY - hu * 0.05, w = D.tw.chest * 0.85, d = hu * 0.22;
      G.tube([{ c: [0, y0, zb - d / 2], rx: w, rz: d / 2, w: [['spine', 1]] }, { c: [0, lerp(y0, y1, 0.5), zb - d / 2 - 0.01], rx: w * 1.04, rz: (d / 2) * 1.1, w: [['chest', 1]] }, { c: [0, y1, zb - d / 2 + 0.01], rx: w * 0.94, rz: (d / 2) * 0.9, w: [['chest', 1]] }], { seg: 8, se: 4, cap0: true, cap1: true, sw: sw(c) });
      G.tube([{ c: [0, lerp(y0, y1, 0.3), zb - d - 0.005], rx: w * 0.6, rz: d * 0.22, w: [['spine', 1]] }, { c: [0, lerp(y0, y1, 0.6), zb - d - 0.005], rx: w * 0.6, rz: d * 0.22, w: [['chest', 1]] }], { seg: 6, se: 4, cap0: true, cap1: true, sw: sw(shade(c, 0.8)) });
      for (const s of [1, -1]) {
        const x = s * D.tw.chest * 0.5, pts = [[x, D.chest - hu * 0.25, D.td.chest + 0.012], [x, D.chest + hu * 0.1, D.td.chest + 0.014], [x * 1.05, D.shY + hu * 0.05, 0.0], [x, D.chest + hu * 0.05, zb + 0.01]];
        G.tube(pts.map((p) => ({ c: p, rx: hu * 0.06, rz: hu * 0.018, w: [['chest', 1]] })), { seg: 4, se: 4, sw: sw(shade(c, 0.6)) });
      }
      if (a.charm) G.tube([{ c: [D.tw.chest * 0.5, y0 + hu * 0.1, zb - d - 0.02], rx: hu * 0.05, rz: hu * 0.05, w: [['spine', 1]] }, { c: [D.tw.chest * 0.5, y0 + hu * 0.02, zb - d - 0.02], rx: hu * 0.06, rz: hu * 0.06, w: [['spine', 1]] }], { seg: 5, cap0: true, cap1: true, sw: sw(a.charm) });
    }
    if (kind === 'bag' || kind === 'shoulderbag' || kind === 'tote' || kind === 'handbag') {
      const c = rgb(a.color || '#e84a6a'), side = a.side || -1, x = side * (D.tw.hip + hu * 0.12), y = D.hipJ + hu * 0.25;
      G.tube([{ c: [x, y - hu * 0.32, 0.01], rx: hu * 0.1, rz: hu * 0.3, w: [['hips', 1]] }, { c: [x, y, 0.01], rx: hu * 0.11, rz: hu * 0.32, w: [['hips', 1]] }], { seg: 6, se: 4, cap0: true, cap1: true, fwd: [1, 0, 0], sw: sw(c) });
      const pts = [[x, y, 0], [side * D.tw.waist * 1.15, D.chest - hu * 0.2, D.td.chest * 0.9], [-side * D.tw.shoulder * 0.55, D.shY + hu * 0.03, 0], [side * D.tw.waist * 1.15, D.chest - hu * 0.2, -D.td.chest * 0.9], [x, y, -0.005]];
      G.tube(pts.map((p) => ({ c: p, rx: hu * 0.04, rz: hu * 0.014, w: [['chest', 1]] })), { seg: 4, se: 4, sw: sw(shade(c, 0.55)) });
    }
  }
  return { geo: G.build(), tex: B.texture() };
}
