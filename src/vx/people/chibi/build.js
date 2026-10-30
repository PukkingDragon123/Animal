// Blocky chibi people: every body part is a box skinned 100% to one bone (one SkinnedMesh, two draw calls:
// the body atlas and the face), wearing hand-made pixel art. Each box face gets its own rect in a 256²
// atlas (64 texels per metre) painted texel by texel — sleeves and cuffs, zips, pockets, belts, plaid,
// laces, socks — and the hair is blocky shells and slabs with jagged pixel cut-outs (bangs, tips) and an
// anime shine band. The face is a separate 32×30 pixel-art texture repainted when the expression changes.
import * as THREE from '../../../../vendor/three.module.js';
import { Buf, hash, rgb, mix, shade } from './raster.js';
import { BI } from './rig.js';

export const AT = 256;
const RHO = 64;
export const FW = 32, FH = 30;
const INK = [40, 30, 38];
const FACES = ['left', 'right', 'top', 'bottom', 'front', 'back'];     // BoxGeometry groups: +x, −x, +y, −y, +z, −z
const lerp = (a, b, t) => a + (b - a) * t;
const cl = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

// ---------------------------------------------------------------- atlas + box parts
class Atlas {
  constructor() { this.B = new Buf(AT, AT); this.x = 1; this.y = 1; this.row = 0; }
  alloc(w, h) { if (this.x + w + 1 > AT) { this.x = 1; this.y += this.row + 2; this.row = 0; } const r = [this.x, this.y, w, h]; this.x += w + 2; this.row = Math.max(this.row, h); if (this.y + h > AT) console.warn('chibi atlas full'); return r; }
}
/** a painter's view of one box face: local texel coords (0,0 bottom-left as seen from outside) */
class Face {
  constructor(B, r, name, part) { this.B = B; this.x = r[0]; this.y = r[1]; this.w = r[2]; this.h = r[3]; this.name = name; this.part = part; }
  set(i, j, c, a = 1) { if (i < 0 || j < 0 || i >= this.w || j >= this.h || !c) return; this.B.set(this.x + i, this.y + j, c, a); }
  fill(fn) { for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) { const c = fn(i, j, (i + 0.5) / this.w, (j + 0.5) / this.h); if (c) this.set(i, j, c); } }
}

class Builder {
  constructor() { this.A = new Atlas(); this.P = []; this.N = []; this.UV = []; this.SI = []; this.SW = []; this.I = []; this.IF = []; }
  /** o: { bone, size: [w, h, d], at: [x, y, z] centre (model space), rot: [x, y, z], paint: { face: fn(F) } | fn(F), faceTex: true (front → face texture), skip: [faces] } */
  box(o) {
    const [w, h, d] = o.size, g = new THREE.BoxGeometry(w, h, d);
    if (o.rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...o.rot)));
    g.translate(...o.at);
    const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv, idx = g.index.array, base = this.P.length / 3;
    const px = { left: [d, h], right: [d, h], top: [w, d], bottom: [w, d], front: [w, h], back: [w, h] };
    const rects = {};
    for (let f = 0; f < 6; f++) {
      const name = FACES[f], skip = o.skip && o.skip.includes(name);
      if (skip || (o.faceTex && name === 'front')) continue;
      const [a, b] = px[name], r = this.A.alloc(Math.max(1, Math.round(a * (o.rho || RHO))), Math.max(1, Math.round(b * (o.rho || RHO))));
      rects[name] = r;
      const fn = typeof o.paint === 'function' ? o.paint : o.paint && (o.paint[name] || o.paint.all);
      if (fn) fn(new Face(this.A.B, r, name, o));
    }
    for (let v = 0; v < pos.count; v++) {
      const f = Math.floor(v / 4), name = FACES[f], r = rects[name];
      this.P.push(pos.getX(v), pos.getY(v), pos.getZ(v)); this.N.push(nor.getX(v), nor.getY(v), nor.getZ(v));
      const u = uv.getX(v), t = uv.getY(v);
      if (r) this.UV.push((r[0] + u * r[2]) / AT, (r[1] + t * r[3]) / AT); else this.UV.push(u, t);
      this.SI.push(BI[o.bone], 0, 0, 0); this.SW.push(1, 0, 0, 0);
    }
    for (let k = 0; k < idx.length; k += 3) {
      const f = Math.floor(idx[k] / 4), name = FACES[f];
      if (o.skip && o.skip.includes(name)) continue;
      const tri = [base + idx[k], base + idx[k + 1], base + idx[k + 2]];
      if (o.faceTex && name === 'front') this.IF.push(...tri); else this.I.push(...tri);
    }
    g.dispose();
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.UV, 2));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.SI, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.SW, 4));
    g.setIndex([...this.I, ...this.IF]); g.addGroup(0, this.I.length, 0); g.addGroup(this.I.length, this.IF.length, 1);
    g.computeBoundingSphere();
    return g;
  }
}

// ---------------------------------------------------------------- the outfit
function palette(spec) {
  const o = spec.outfit || {}, T = o.top || {}, Bt = o.bottom || {}, S = o.shoes || {}, H = spec.hair || {};
  const skin = rgb(spec.skin || '#f2ccaa');
  const P = {
    o, T, Bt, S, skin, skinD: shade(skin, 0.86), skinL: shade(skin, 1.06),
    top: rgb(T.color || '#e8603a'), inner: rgb(T.inner || T.color2 || '#f4efe6'), stripe: T.stripe ? rgb(T.stripe) : null,
    bot: rgb(Bt.color || '#2e3a5e'), bot2: Bt.color2 ? rgb(Bt.color2) : null, plaid: Bt.plaid ? rgb(Bt.plaid) : null, belt: rgb(Bt.belt || '#3a2a26'),
    sock: rgb(o.socks || '#f4f0ea'), tights: o.tights ? rgb(o.tights) : null,
    shoe: rgb(S.color || '#f2f0ea'), sole: rgb(S.sole || ((S.kind || 'sneakers') === 'sneakers' ? '#fbfaf6' : '#2a2226')), accent: rgb(S.accent || S.color || '#e8603a'),
    hair: rgb(H.col || '#2a1e1a'), gloves: o.gloves ? rgb(o.gloves) : null,
    tk: T.kind || 'hoodie', bk: Bt.kind || 'pants', sk: S.kind || 'sneakers',
  };
  P.hairHi = H.grey ? [252, 252, 250] : P.hair[0] + P.hair[1] + P.hair[2] < 200 ? mix(P.hair, [150, 160, 210], 0.55) : mix(P.hair, [255, 250, 232], 0.55);
  P.hairD = shade(P.hair, 0.72);
  P.open = P.tk === 'jacket' || P.tk === 'blazer' || P.tk === 'cardigan' || P.tk === 'coat';
  P.sleeve = T.sleeve || (P.tk === 'tee' || P.tk === 'crop' || P.tk === 'blouse' ? 'short' : P.tk === 'tank' || P.tk === 'tube' ? 'none' : 'long');
  P.pants = ['pants', 'jeans', 'slacks', 'track', 'cargo'].includes(P.bk);
  P.skirt = P.bk === 'skirt' || P.bk === 'dress';
  const acc = o.acc || [];
  P.pack = acc.find((a) => (a.kind || a) === 'backpack'); P.bag = acc.find((a) => ['bag', 'shoulderbag', 'tote', 'handbag'].includes(a.kind || a)); P.apron = acc.find((a) => (a.kind || a) === 'apron');
  return P;
}
const EMBLEMS = {
  star: ['..x..', '.xxx.', 'xxxxx', '.xxx.', '.x.x.'],
  flame: ['..x..', '.xx..', '.xxx.', 'xxxxx', '.xxx.'],
  heart: ['.x.x.', 'xxxxx', 'xxxxx', '.xxx.', '..x..'],
};
function stamp(F, pat, cx, cy, c) { const h = pat.length; for (let r = 0; r < h; r++) for (let k = 0; k < pat[r].length; k++) if (pat[r][k] !== '.') F.set(cx - 2 + k, cy + (h - 1 - r) - 2, c); }

/** a garment texel with pixel-art shading: a lit top edge, a darker bottom edge and side seam */
const edge = (c, j, h) => (j === h - 1 ? shade(c, 1.06) : j === 0 ? shade(c, 0.86) : c);

// ---------------------------------------------------------------- the person
export function buildChibi(spec, D, J) {
  const P = palette(spec), Bd = new Builder(), seed = (spec.id || 'x').length * 7 + Math.round(D.H * 100);
  const { skin, top, inner, bot } = P;
  const fray = P.tk === 'crop' || P.tk === 'tube';
  // ---- head (the front face is the separate face texture)
  const hs = D.hu, hw = D.hw, hd = D.hd;
  Bd.box({ bone: 'head', size: [hw * 2, hs, hd * 2], at: [0, D.chin + hs / 2, 0], faceTex: true, paint: {
    left: (F) => headSide(F, P, true), right: (F) => headSide(F, P, false),
    top: (F) => F.fill(() => P.skinD), back: (F) => F.fill((i, j) => edge(skin, j, F.h)), bottom: (F) => F.fill(() => P.skinD),
  } });
  Bd.box({ bone: 'neck', size: [0.11, 0.06, 0.1], at: [0, D.shY + 0.01, -0.01], paint: { all: (F) => F.fill(() => P.skinD) } });
  // ---- torso and pelvis
  Bd.box({ bone: 'chest', size: [D.bw, D.torso + 0.012, D.bd], at: [0, D.waist + D.torso / 2, 0], paint: { all: (F) => torsoFace(F, P, D, fray, seed) } });
  Bd.box({ bone: 'hips', size: [D.pw, D.pelvis + 0.04, D.pd], at: [0, D.hipJ - 0.04 + (D.pelvis + 0.04) / 2, 0], paint: { all: (F) => pelvisFace(F, P) } });
  // ---- arms: upper arm, forearm, hand
  for (const [s, k] of [[1, 'L'], [-1, 'R']]) {
    const sh = J['ua' + k], el = J['fa' + k], wr = J['h' + k], aw = D.aw, sl = P.sleeve !== 'none' && P.sleeve !== 'short' ? 1.08 : 1;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    Bd.box({ bone: 'ua' + k, size: [aw * sl, D.uarm + 0.03, aw * sl], at: mid([sh[0], sh[1] + 0.025, sh[2]], el), rot: [0, 0, s * 0.06], paint: { all: (F) => armFace(F, P, 'upper', s) } });
    Bd.box({ bone: 'fa' + k, size: [aw * 0.94 * sl, D.farm, aw * 0.94 * sl], at: mid(el, wr), rot: [0, 0, s * 0.06], paint: { all: (F) => armFace(F, P, 'fore', s) } });
    Bd.box({ bone: 'h' + k, size: [aw * 1.02, D.hand, aw * 0.95], at: [wr[0] + s * 0.004, wr[1] - D.hand / 2 + 0.005, wr[2] + 0.004], paint: { all: (F) => handFace(F, P) } });
  }
  // ---- legs: thigh, shin, shoe
  const baggy = P.bk === 'cargo' ? 1.22 : P.pants ? 1.06 : 1, boots = P.sk === 'boots';
  for (const [s, k] of [[1, 'L'], [-1, 'R']]) {
    const th = J['th' + k], kn = J['sh' + k], an = J['ft' + k], lw = D.lw;
    Bd.box({ bone: 'th' + k, size: [lw * baggy, th[1] - kn[1] + 0.02, lw * baggy], at: [th[0], (th[1] + kn[1]) / 2, 0], paint: { all: (F) => legFace(F, P, D, 'thigh', s) } });
    Bd.box({ bone: 'sh' + k, size: [lw * 0.96 * baggy * (P.bk === 'cargo' ? 1.06 : 1), kn[1] - an[1] + 0.01, lw * 0.96 * baggy], at: [kn[0], (kn[1] + an[1]) / 2, 0], paint: { all: (F) => legFace(F, P, D, 'shin', s) } });
    const sh = boots ? 0.1 : 0.08, sl = P.sk === 'pumps' ? 0.19 : 0.215;
    Bd.box({ bone: 'ft' + k, size: [lw * (P.sk === 'pumps' ? 1.0 : 1.12), sh, sl], at: [an[0], sh / 2, 0.035], paint: { all: (F) => shoeFace(F, P) } });
  }
  // ---- skirt on its spring bone
  if (P.skirt) {
    const cut = P.Bt.cut, len = cut === 'mini' ? 0.11 : cut === 'long' ? 0.3 : cut === 'pencil' ? 0.17 : 0.16, flare = cut === 'pencil' ? 0.02 : 0.06;
    Bd.box({ bone: 'skirt', size: [D.pw + flare, len, D.pd + flare], at: [0, D.waist + 0.01 - len / 2, 0], skip: ['top'], paint: { all: (F) => skirtFace(F, P) } });
  }
  if (P.tk === 'coat') Bd.box({ bone: 'hips', size: [D.pw + 0.04, 0.2, D.pd + 0.04], at: [0, D.hipJ - 0.05, 0], skip: ['top'], paint: { all: (F) => F.fill((i, j) => (F.name === 'front' && Math.abs((i + 0.5) / F.w - 0.5) < 0.08 ? shade(top, 0.75) : edge(top, j, F.h))) } });
  // ---- accessories
  if (P.pack) {
    const c = rgb(P.pack.color || '#2e6a8a'), y = D.waist + D.torso * 0.5;
    Bd.box({ bone: 'chest', size: [D.bw * 0.82, D.torso * 0.92, 0.1], at: [0, y, -(D.bd / 2 + 0.05)], paint: { all: (F) => F.fill((i, j, u, v) => {
      if (F.name === 'back') { if (v < 0.5 && v > 0.12 && Math.abs(u - 0.5) < 0.36) return Math.abs(v - 0.5) < 0.06 || Math.abs(Math.abs(u - 0.5) - 0.36) < 0.05 ? shade(c, 0.7) : shade(c, 0.9); if (Math.abs(v - 0.78) < 0.04) return [210, 210, 214]; }
      return edge(c, j, F.h);
    }) } });
    if (P.pack.charm) Bd.box({ bone: 'chest', size: [0.04, 0.05, 0.03], at: [D.bw * 0.3, y - D.torso * 0.5, -(D.bd / 2 + 0.1)], paint: { all: (F) => F.fill(() => rgb(P.pack.charm)) } });
  }
  if (P.bag) {
    const c = rgb(P.bag.color || '#e84a6a'), sd = P.bag.side || -1;
    Bd.box({ bone: 'hips', size: [0.06, 0.12, 0.16], at: [sd * (D.pw / 2 + 0.035), D.hipJ + 0.04, 0.0], paint: { all: (F) => F.fill((i, j, u, v) => (v > 0.62 && (F.name === 'left' || F.name === 'right') ? shade(c, 0.85) : edge(c, j, F.h))) } });
  }
  if (P.apron) Bd.box({ bone: 'hips', size: [D.pw * 0.95, 0.17, 0.012], at: [0, D.hipJ - 0.06, D.pd / 2 + 0.008], paint: { all: (F) => F.fill((i, j) => edge(rgb(P.apron.color || '#c83a3a'), j, F.h)) } });
  // ---- hair, ears, hat
  buildHair(Bd, spec, P, D, J, seed);
  if (spec.hat) buildHat(Bd, spec.hat, D, P);
  return { geo: Bd.build(), atlas: Bd.A.B, P };
}

// ---------------------------------------------------------------- part painters
function headSide(F, P, left) {
  // skin with an ear: a small darker block with an inner shade
  F.fill((i, j) => (j === 0 ? P.skinD : P.skin));
  const ex = Math.round(F.w * 0.48), ey = Math.round(F.h * 0.34);
  for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) F.set(ex + i - 1, ey + j, i === 1 && j > 0 && j < 4 ? shade(P.skin, 0.78) : shade(P.skin, 0.9));
  void left;
}
function torsoFace(F, P, D, fray, seed) {
  const { skin, top, inner, tk } = P, front = F.name === 'front', back = F.name === 'back', side = F.name === 'left' || F.name === 'right';
  F.fill((i, j, u, v) => {
    const w = F.w, h = F.h, du = Math.abs(u - 0.5);
    if (F.name === 'top') { if (tk === 'tube' || (tk === 'tank' && du > 0.22)) return skin; return Math.abs(u - 0.5) < 0.18 && Math.abs(v - 0.5) < 0.3 ? P.skinD : shade(top, 1.04); }
    if (F.name === 'bottom') return P.pants ? P.bot : P.skirt ? P.bot : skin;
    // exposed skin: tube / tank / crop midriff / necklines
    if (tk === 'tube' && v > 0.7 + (hash(i, 3, seed) - 0.5) * 0.08) return v < 0.76 && (front || back) && i % 2 ? P.skinD : skin;
    if (tk === 'tank' && (front || back) && v > 0.8 && du < 0.3) return skin;
    if (tk === 'tank' && side && v > 0.86) return skin;
    if (fray) { const hem = (P.T.hem === 'low' ? 0.1 : 0.3) + (hash(i, 9, seed) - 0.5) * 0.08; if (v < hem) return front && du < 0.06 && Math.abs(v - hem * 0.45) < 0.06 ? P.skinD : skin; if (v < hem + 0.07) return mix(top, [150, 146, 150], 0.4); }
    if (front && (tk === 'tee' || tk === 'blouse' || tk === 'crop' || tk === 'knit') && v > 0.86 && du < 0.15) return skin;
    if (front && tk === 'shirt' && v > 0.8 && du < 0.2) return du < 0.04 ? shade(top, 0.75) : [248, 246, 240];
    // open jackets show the shirt underneath
    if (front && P.open) { if (du < 0.14) return tk === 'blazer' && du < 0.03 ? INK : (v > 0.86 && du < 0.08 ? skin : inner); if (du < 0.18) return shade(top, 0.74); if (tk === 'blazer' && Math.abs(u - 0.68) < 0.03 && Math.abs(v - 0.42) < 0.04) return [230, 200, 120]; }
    // the hoodie: kangaroo pocket, drawstrings, hood on the back
    if (tk === 'hoodie') {
      if (front && v < 0.42 && v > 0.1 && du < 0.33) return Math.abs(v - 0.42) < 0.06 || Math.abs(du - 0.33) < 0.04 ? shade(top, 0.72) : shade(top, 0.9);
      if (front && v > 0.6 && Math.abs(du - 0.1) < 0.03) return [244, 240, 234];
      if (front && v > 0.9 && du < 0.16) return shade(top, 0.7);
      if (back && v > 0.68 && du < 0.36) return v > 0.94 || du > 0.32 ? shade(top, 0.7) : shade(top, 0.86);
    }
    if (P.stripe && Math.abs(v - 0.62) < 0.07) return P.stripe;
    if (P.apron && front && v < 0.72 && du < 0.42) return Math.abs(v - 0.42) < 0.05 ? shade(rgb(P.apron.color || '#c83a3a'), 0.75) : rgb(P.apron.color || '#c83a3a');
    if (P.pack && front && Math.abs(du - 0.24) < 0.06 && v > 0.2) return shade(rgb(P.pack.color || '#2e6a8a'), 0.62);
    if (P.pack && F.name === 'top' && Math.abs(du - 0.24) < 0.06) return shade(rgb(P.pack.color || '#2e6a8a'), 0.62);
    if (P.bag && (front || back) && Math.abs((front ? u : 1 - u) - (1 - v) * 0.9 - 0.05) < 1.3 / w) return shade(rgb(P.bag.color || '#e84a6a'), 0.55);
    if (!fray && j === 0) return shade(top, 0.8);
    return edge(top, j, h);
  });
  if (F.name === 'front' && P.T.emblem && EMBLEMS[P.T.emblem]) stamp(F, EMBLEMS[P.T.emblem], Math.round(F.w * 0.68), Math.round(F.h * 0.58), P.T.emblemColor ? rgb(P.T.emblemColor) : shade(top, 0.62));
  if (F.name === 'front' && (tk === 'jacket' || tk === 'hoodie') && !P.open) for (let j = 0; j < F.h - 1; j++) F.set(Math.floor(F.w / 2), j, shade(top, 0.7));
}
function pelvisFace(F, P) {
  const { bot, belt, bk } = P;
  F.fill((i, j, u, v) => {
    if (F.name === 'top') return bot;
    if (F.name === 'bottom') return shade(bot, 0.8);
    if (P.skirt) return bot;
    if (j >= F.h - 2) return F.name === 'front' && Math.abs(u - 0.5) < 0.08 ? (bk === 'cargo' ? [206, 206, 200] : [214, 190, 120]) : belt;
    if (F.name === 'front' && Math.abs(u - 0.5) < 0.04 && v < 0.75) return shade(bot, 0.74);                        // the fly
    if (F.name === 'front' && (Math.abs(u - 0.18 - (1 - v) * 0.12) < 0.04 || Math.abs(u - 0.82 + (1 - v) * 0.12) < 0.04) && v > 0.45) return shade(bot, 0.8);   // pockets
    if (bk === 'jeans' && hash(i, j, 3) < 0.1) return shade(bot, 1.08);
    return edge(bot, j, F.h);
  });
}
function armFace(F, P, seg, s) {
  const { skin, top } = P, slv = P.sleeve;
  F.fill((i, j, u, v) => {
    // v runs bottom→top along the box; the upper arm's top is the shoulder
    const cover = seg === 'upper' ? (slv === 'none' ? 0 : slv === 'short' ? 0.55 : 1.01) : (slv === 'long' ? 1.01 : slv === 'mid' ? 0.5 : 0);
    const covered = seg === 'upper' ? v > 1 - cover : v > 1 - cover;
    if (F.name === 'top') return covered || seg === 'upper' && slv !== 'none' ? top : skin;
    if (F.name === 'bottom') return seg === 'fore' && slv === 'long' ? shade(top, 0.7) : covered ? shade(top, 0.8) : P.skinD;
    if (covered) {
      if ((seg === 'fore' && slv === 'long' && v < 0.18) || (seg === 'upper' && slv === 'short' && v < 1 - cover + 0.12)) return shade(top, 0.8);   // cuffs
      if (P.stripe && seg === 'upper' && Math.abs(v - 0.55) < 0.08 && slv === 'long') return P.stripe;
      if (P.T.fray && j === Math.floor(F.h * (1 - cover))) return mix(top, [150, 146, 150], 0.4);
      return edge(top, j, F.h);
    }
    if (seg === 'upper' && slv !== 'none' && v > 1 - cover - 0.1) return P.skinD;                                  // the sleeve's shadow
    return seg === 'fore' && j === 0 ? P.skinD : skin;
  });
  void s;
}
function handFace(F, P) {
  const c = P.gloves || P.skin;
  F.fill((i, j, u, v) => {
    if (F.name === 'front' && v < 0.55 && i > 0 && i < F.w - 1 && i % 2 === 0) return shade(c, 0.88);               // fingers
    return j === 0 || F.name === 'bottom' ? shade(c, 0.9) : c;
  });
}
function legFace(F, P, D, seg, s) {
  const { skin, bot, bk } = P, outer = (s > 0 && F.name === 'left') || (s < 0 && F.name === 'right');
  const sockTop = P.o.legs === 'kneesocks' ? 0.85 : P.o.legs === 'socks' ? 0.32 : 0;
  F.fill((i, j, u, v) => {
    if (F.name === 'top') return P.pants || bk === 'shorts' ? bot : skin;
    if (F.name === 'bottom') return shade(bot, 0.8);
    if (P.pants) {
      if (bk === 'track' && P.bot2 && outer && Math.abs(u - 0.5) < 0.16) return P.bot2;
      if (bk === 'jeans' && outer && Math.abs(u - 0.5) < 0.07) return mix(bot, [230, 200, 120], 0.4);
      if (bk === 'cargo' && seg === 'thigh' && outer && v > 0.12 && v < 0.62 && Math.abs(u - 0.5) < 0.36) return v > 0.52 ? shade(bot, 0.8) : Math.abs(u - 0.5) > 0.3 || v < 0.18 ? shade(bot, 0.72) : shade(bot, 1.05);
      if (bk === 'cargo' && seg === 'shin' && F.name === 'front' && (v < 0.3 ? (i + j) % 4 === 0 : false)) return shade(bot, 0.78);   // bunched folds at the ankle
      if (seg === 'thigh' && F.name === 'front' && j === 0) return shade(bot, 0.84);                                              // the knee crease
      if (seg === 'shin' && j <= 1) return shade(bot, 0.82);
      if (bk === 'jeans' && hash(i, j, 5) < 0.1) return shade(bot, 1.08);
      if (P.sk === 'boots' && seg === 'shin' && v < 0.42) return P.shoe;
      return edge(bot, j, F.h);
    }
    if (bk === 'shorts' && seg === 'thigh' && v > 0.45) return v < 0.52 ? shade(bot, 0.8) : bot;
    if (P.sk === 'boots' && seg === 'shin' && v < 0.5) return v > 0.46 ? shade(P.shoe, 0.8) : P.shoe;
    if (seg === 'shin' && v < sockTop) return v > sockTop - 0.08 ? shade(P.sock, 0.86) : P.sock;
    if (P.tights) return seg === 'thigh' && j === 0 && F.name === 'front' ? shade(P.tights, 0.85) : P.tights;
    if (seg === 'thigh' && F.name === 'front' && j === 0) return P.skinD;
    return skin;
  });
}
function shoeFace(F, P) {
  const { shoe, sole, accent, sk } = P;
  F.fill((i, j, u, v) => {
    if (F.name === 'bottom') return shade(sole, 0.8);
    if (F.name === 'top') {
      // v: 1 at the heel, 0 at the toe
      if (sk === 'sneakers' && v > 0.3 && v < 0.7 && Math.abs(u - 0.5) < 0.28) return j % 2 ? [248, 246, 242] : shade(shoe, 0.82);   // laces
      if (v < 0.22) return shade(shoe, 1.06);
      if (v > 0.82) return shade(shoe, 0.88);
      return shoe;
    }
    if (j <= (sk === 'boots' ? 1 : 1)) return j === 1 ? shade(sole, 0.9) : sole;
    if (sk === 'sneakers' && (F.name === 'left' || F.name === 'right') && j >= 2 && j <= 3 && Math.abs(u - 0.5) < 0.3) return accent;
    if (sk === 'sneakers' && F.name === 'back' && Math.abs(u - 0.5) < 0.2) return accent;
    return edge(shoe, j, F.h);
  });
}
function skirtFace(F, P) {
  const { bot, plaid } = P, pencil = P.Bt.cut === 'pencil';
  F.fill((i, j, u, v) => {
    if (F.name === 'bottom') return shade(bot, 0.45);
    let c = bot;
    if (plaid) { if (i % 6 === 2 || j % 6 === 2) c = mix(bot, plaid, 0.45); else if (i % 6 === 3 || j % 6 === 3) c = mix(bot, plaid, 0.18); }
    if (!pencil && i % 3 === 0) c = shade(c, 0.8);                                     // the pleats
    if (j === F.h - 1) c = shade(bot, 0.8);
    if (j === 0) c = plaid ? mix(c, plaid, 0.4) : shade(c, 0.86);
    return c;
  });
}

// ---------------------------------------------------------------- hair
function hairTex(P, seed) {
  const c = P.hair, hi = P.hairHi, dk = P.hairD;
  return (i, j, u, v, k = 0) => {
    if (hash(i, k + 1, seed) < 0.16) return dk;                                       // strands
    if (v > 0.6 && v < 0.72 && (i + j + k) % 3 !== 0) return mix(c, hi, 0.55);        // the anime shine band
    if (hash(i, j + k * 31, seed) < 0.05) return mix(c, hi, 0.25);
    return c;
  };
}
/** jagged clump tips: offset (in texels, ≥ 0) of column i below the cut line */
const jag = (i, size = 4, depth = 3) => { const k = ((i % size) + size) % size, m = (size - 1) / 2; return Math.round((1 - Math.abs(k - m) / m) * depth); };
function buildHair(Bd, spec, P, D, J, seed) {
  const H = spec.hair || {}, st = H.style || 'short', hs = D.hu, hw = D.hw, hd = D.hd, hc = hairTex(P, seed), vol = H.volume || 1;
  if (st === 'none' || st === 'bald') return;
  const long = st === 'long' || st === 'bob' || st === 'ponytail' || st === 'twintails' || st === 'pigtails' || st === 'bun';
  const short = !long, buzz = st === 'buzz' || st === 'mohawk';
  const e = buzz ? 0.012 : (st === 'perm' ? 0.05 : 0.026) * vol, capY0 = D.chin + hs * (long ? 0.22 : 0.4), capY1 = D.chin + hs + e * 1.8;
  const fringe = buzz ? 0.9 : st === 'bowl' ? 0.62 : long ? 0.64 : 0.68;              // where the bangs stop (fraction of the head)
  const yOf = (F, j) => lerp(capY0, capY1, (j + 0.5) / F.h);
  const W = hw * 2 + e * 2, Dp = hd * 2 + e * 2;
  Bd.box({ bone: 'head', size: [W, capY1 - capY0, Dp], at: [0, (capY0 + capY1) / 2, -0.004], skip: ['bottom'], paint: {
    top: (F) => F.fill((i, j, u, v) => { if (st === 'sidepart' && Math.abs(u - 0.36) < 0.04 && v < 0.7) return P.hairD; if (Math.abs(u - 0.5) < 0.12 && Math.abs(v - 0.4) < 0.12 && (i + j) % 3 === 0) return mix(P.hair, P.hairHi, 0.4); return hc(i, j, u, v, 7); }),
    front: (F) => F.fill((i, j, u, v) => {
      const y = yOf(F, j), part = st === 'sidepart' ? (u < 0.4 ? 0.06 : -0.02) : 0, cut = D.chin + hs * (fringe + part) - jag(i, st === 'messy' ? 3 : 5, st === 'bowl' ? 0 : 3) * (hs / 30);
      if (y < cut) return null;
      if (y < cut + hs / 30) return P.hairD;
      return hc(i, j, u, v);
    }),
    back: (F) => F.fill((i, j, u, v) => { const y = yOf(F, j), cut = capY0 + (short ? hs * 0.06 : 0) - jag(i, 4, 2) * (hs / 30); if (y < cut) return null; return y < cut + hs / 30 ? P.hairD : hc(i, j, u, v, 3); }),
    left: (F) => sideHair(F, P, D, hc, yOf, short, true, capY0),
    right: (F) => sideHair(F, P, D, hc, yOf, short, false, capY0),
  } });
  // the clip: two little bars on the bangs
  // (painted into the cap's front face after the fact would need its rect; a small box reads better in 3D)
  if (H.clip) Bd.box({ bone: 'head', size: [0.08, 0.02, 0.012], at: [-hw * 0.45, D.chin + hs * 0.82, hd + e + 0.006], rot: [0, 0, -0.5], paint: { all: (F) => F.fill(() => rgb(H.clip)) } });
  const tipPaint = (k) => (F) => F.fill((i, j, u, v) => { if (F.name === 'bottom') return P.hairD; const cut = jag(i, 4, 3); if (j < cut) return null; return j === cut ? P.hairD : hc(i, j, u, v, k); });
  // long hair: a slab down the back (on its spring bone) and locks framing the face
  if (st === 'long' || st === 'bob') {
    const len = st === 'long' ? hs * 0.5 + D.torso * 0.95 : hs * 0.5, top = D.chin + hs * 0.66;
    Bd.box({ bone: 'tailL', size: [W * 0.98, len, 0.07], at: [0, top - len / 2, -(hd + e + 0.02)], paint: { all: tipPaint(11) } });
  }
  if (long) {
    const len = st === 'long' ? hs * 0.62 + 0.08 : st === 'bob' ? hs * 0.55 : hs * 0.42, top = D.chin + hs * 0.62;
    for (const s of [1, -1]) Bd.box({ bone: 'head', size: [0.05, len, 0.12], at: [s * (hw + e + 0.018), top - len / 2, hd * 0.42], paint: { all: tipPaint(13 + s) } });
  }
  // tails on the spring bones
  const tail = (bone, len, w, side = 0) => {
    const j = J[bone];
    Bd.box({ bone, size: [w, len * 0.5, w * 0.85], at: [j[0] + side * 0.02, j[1] - len * 0.22, j[2] - 0.01], paint: { all: (F) => F.fill((i, jj, u, v) => (F.name === 'top' ? P.hairD : hc(i, jj, u, v, 21))) } });
    Bd.box({ bone, size: [w * 0.82, len * 0.55, w * 0.7], at: [j[0] + side * 0.035, j[1] - len * 0.68, j[2] - 0.025], paint: { all: tipPaint(23) } });
    if (H.ribbon) Bd.box({ bone, size: [0.15, 0.075, 0.035], at: [j[0], j[1] + 0.005, j[2] + (side ? 0 : -0.02)], rot: [0, side ? side * Math.PI / 2 : 0, 0], rho: 96, paint: { all: (F) => bow(F, rgb(H.ribbon)) } });
  };
  if (st === 'ponytail') tail('tailL', 0.36 * vol, 0.13);
  if (st === 'twintails' || st === 'pigtails') { const len = (st === 'pigtails' ? 0.2 : 0.38) * vol; tail('tailL', len, 0.12, 1); tail('tailR', len, 0.12, -1); }
  if (H.ribbon && st !== 'ponytail' && st !== 'twintails' && st !== 'pigtails') Bd.box({ bone: 'head', size: [0.15, 0.075, 0.035], at: [hw * 0.55, capY1 - 0.02, hd * 0.2], rot: [0, 0, 0.3], rho: 96, paint: { all: (F) => bow(F, rgb(H.ribbon)) } });
  if (st === 'bun') Bd.box({ bone: 'head', size: [0.17, 0.15, 0.15], at: [0, D.chin + hs * 0.86, -(hd + 0.04)], paint: { all: (F) => F.fill((i, j, u, v) => hc(i, j, u, v, 31)) } });
  // shonen spikes, a mohawk crest, perm curls
  if (st === 'messy') {
    // a few sharp tufts sweeping up and back from the crown, plus one over the brow
    const tufts = [[-0.11, 0.02, 0.02, -0.45, 0.35], [0.0, 0.04, -0.03, -0.55, 0], [0.11, 0.02, 0.02, -0.45, -0.35], [-0.06, 0.0, -0.14, -0.9, 0.2], [0.07, 0.0, -0.14, -0.9, -0.2], [0.13, -0.05, 0.16, 0.5, -0.5]];
    tufts.forEach(([x, y, z, rx, rz], k) => Bd.box({ bone: 'head', size: [0.09, 0.14, 0.09], at: [x, capY1 + 0.03 + y, z], rot: [rx, 0, rz + Math.PI / 4 * 0], paint: { all: (F) => F.fill((i, j, u, v) => (F.name === 'top' ? mix(P.hair, P.hairHi, 0.3) : v > 0.75 && Math.abs(u - 0.5) > (1 - v) * 2 ? null : hc(i, j, u, v, 40 + k))) } }));
  }
  if (st === 'mohawk') Bd.box({ bone: 'head', size: [0.08, 0.16 * vol, hd * 1.9], at: [0, capY1 + 0.06, -0.01], paint: { all: (F) => F.fill((i, j, u, v) => (F.name === 'top' ? mix(P.hair, P.hairHi, 0.3) : hc(i, j, u, v, 50))) } });
  if (st === 'perm') for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.3, x = Math.sin(a) * (hw + 0.02), z = Math.cos(a) * (hd + 0.02) - 0.02; Bd.box({ bone: 'head', size: [0.13, 0.13, 0.13], at: [x, D.chin + hs * (0.75 + (k % 2) * 0.12), z], rot: [k, k * 0.7, 0.4], paint: { all: (F) => F.fill((i, j, u, v) => hc(i, j, u, v, 60 + k)) } }); }
  if (H.ahoge) { Bd.box({ bone: 'ahoge', size: [0.025, 0.09, 0.03], at: [J.ahoge[0], J.ahoge[1] + 0.02, J.ahoge[2]], rot: [0.3, 0, 0.15], paint: { all: (F) => F.fill(() => P.hair) } }); Bd.box({ bone: 'ahoge', size: [0.022, 0.06, 0.028], at: [J.ahoge[0] + 0.012, J.ahoge[1] + 0.075, J.ahoge[2] + 0.03], rot: [1.0, 0, 0.3], paint: { all: (F) => F.fill(() => P.hair) } }); }
  // fluffy animal ears
  if (H.ears) for (const s of [1, -1]) Bd.box({ bone: 'head', size: [0.13, 0.15, 0.04], at: [s * hw * 0.62, capY1 + 0.05, -0.03], rot: [0, 0, -s * 0.35], rho: 96, paint: { all: (F) => F.fill((i, j, u, v) => {
    const tri = Math.abs(u - 0.5) <= (1 - v) * 0.5 + 0.02; if (!tri && F.name !== 'top' && F.name !== 'bottom') return null;
    if (F.name === 'front' && Math.abs(u - 0.5) <= (1 - v) * 0.3 && v < 0.75) return mix(P.hairD, [236, 150, 160], 0.45);
    return hc(i, j, u, v, 70);
  }) } });
}
function sideHair(F, P, D, hc, yOf, short, left, capY0) {
  // the side faces: full hair for long styles; short styles leave the ear showing below a hairline, with sideburns at the front
  const hs = D.hu;
  F.fill((i, j, u, v) => {
    const y = yOf(F, j), fu = left ? u : 1 - u;     // 0 at the front, 1 at the back
    if (short) { const line = D.chin + hs * (fu < 0.18 ? 0.42 : fu > 0.7 ? 0.42 : 0.6); if (y < line - jag(i, 3, 2) * (hs / 30)) return null; }
    else if (y < capY0 + jag(i, 4, 2) * (hs / 30)) return null;
    return hc(i, j, u, v, left ? 5 : 6);
  });
}
function bow(F, c) {
  // a pixel ribbon bow: two loops and a knot, cut out of a thin box
  F.fill((i, j, u, v) => {
    if (F.name !== 'front' && F.name !== 'back') return c;
    const x = Math.abs(u - 0.5) * 2, y = Math.abs(v - 0.5) * 2;
    if (x < 0.16) return shade(c, 0.78);
    if (y <= 0.25 + x * 0.75 && x <= 1) return x > 0.8 || y > 0.25 + x * 0.6 ? shade(c, 0.82) : (j > F.h * 0.6 ? shade(c, 1.1) : c);
    return null;
  });
}
function buildHat(Bd, h, D, P) {
  const hs = D.hu, hw = D.hw, hd = D.hd, c = rgb(h.col || '#c83a3a'), c2 = rgb(h.col2 || h.col || '#f4efe6'), top = D.chin + hs;
  if (h.kind === 'cap' || h.kind === 'flatcap') {
    Bd.box({ bone: 'head', size: [hw * 2 + 0.07, h.kind === 'flatcap' ? 0.08 : 0.12, hd * 2 + 0.07], at: [0, top + 0.02, -0.005], paint: { all: (F) => F.fill((i, j, u, v) => (F.name === 'front' && h.kind === 'cap' && Math.abs(u - 0.5) < 0.18 && Math.abs(v - 0.55) < 0.25 ? c2 : edge(c, j, F.h))) } });
    Bd.box({ bone: 'head', size: [hw * 1.5, 0.022, 0.16], at: [0, top - 0.035, hd + 0.08], rot: [h.kind === 'flatcap' ? 0.2 : 0.08, 0, 0], paint: { all: (F) => F.fill(() => (h.kind === 'cap' ? c2 : shade(c, 0.9))) } });
  } else if (h.kind === 'beanie') {
    Bd.box({ bone: 'head', size: [hw * 2 + 0.07, 0.2, hd * 2 + 0.07], at: [0, top - 0.02, -0.005], paint: { all: (F) => F.fill((i, j, u, v) => (v < 0.3 ? (i % 2 ? shade(c2, 0.9) : c2) : i % 3 === 0 ? shade(c, 0.88) : c)) } });
  } else if (h.kind === 'headband') {
    Bd.box({ bone: 'head', size: [hw * 2 + 0.065, 0.05, hd * 2 + 0.065], at: [0, D.chin + hs * 0.8, -0.004], skip: ['top', 'bottom'], paint: { all: (F) => F.fill((i, j) => edge(c, j, F.h)) } });
    for (const s of [1, -1]) Bd.box({ bone: 'head', size: [0.04, 0.12, 0.012], at: [s * 0.03, D.chin + hs * 0.72, -(hd + 0.05)], rot: [0.4, 0, s * 0.3], paint: { all: (F) => F.fill(() => c) } });
  }
  void P;
}

// ---------------------------------------------------------------- the face (32 × 30 pixel art)
// templates for the image-right eye (the character's left; outer corner on the right), rows top → bottom
const EYES = {
  girl: ['......K.', '.KKKKKK.', 'KDDDDDKK', 'WDHHDDD.', 'WDHHPDI.', 'WIIPPII.', 'WIIIIII.', '.LLLLHL.', '..KKKK..'],
  boy: ['.KKKKK..', 'KDDDDDK.', 'WDHPDD..', 'WIPPII..', 'WIIILI..', '.SSSS...'],
  wide: ['.KKKKKK.', 'KWWWWWKK', 'WWDDDWW.', 'WWHPDWW.', 'WWDPDWW.', 'WWWLWWW.', '.WWWWW..', '..KKK...'],
  closed: ['K.....K.', '.KKKKK..'],
  happy: ['..KKK...', '.K...K..', 'K.....K.'],
};
const MOUTHS = {
  neutral: ['K..K', '.KK.'], smile: ['K....K', '.KKKK.'], small: ['.KK.', 'KMMK', '.KK.'], open: ['KKKKK', 'KMMMK', 'KMTMK', '.KKK.'],
  grin: ['KKKKKK', 'KWWWWK', 'KMTTMK', '.KKKK.'], O: ['.KK.', 'KMMK', 'KMMK', '.KK.'], frown: ['.KK.', 'K..K'], duck: ['K.K.K', '.K.K.'],
};
export function paintFace(B, spec, D, st) {
  const sk = rgb(spec.skin || '#f2ccaa'), F = spec.face || {}, iris = rgb(F.iris || '#6a4a3a'), fem = D.f || D.kid;
  B.rect(0, 0, FW, FH, sk);
  for (let i = 0; i < FW; i++) { B.set(i, 0, shade(sk, 0.9)); B.set(i, 1, shade(sk, 0.95)); }
  const col = { K: INK, D: shade(iris, 0.6), I: iris, L: mix(iris, [255, 255, 255], 0.35), P: shade(iris, 0.28), H: [255, 255, 255], W: [250, 248, 252], S: shade(sk, 0.82) };
  // blush
  const bl = st.blush ?? (fem ? 1 : 0);
  if (bl > 0) for (const x of [5, 24]) for (let k = 0; k < 3; k++) { B.set(x + k, 7, mix(sk, [244, 120, 140], bl > 1 ? 0.6 : 0.38)); if (bl > 1 && k !== 1) B.set(x + k, 8, mix(sk, [244, 120, 140], 0.3)); }
  // eyes
  const ey = 9, tmpl = (name) => {
    if (name === 'open' || name === 'half' || name === 'angry' || name === 'sad') return fem ? EYES.girl : EYES.boy;
    return EYES[name] || EYES.girl;
  };
  for (const s of [1, -1]) {
    let T = tmpl(st.eye).slice();
    if (D.kid && !D.f && T === EYES.girl) T = T.slice(1, -1);
    if (!fem && (st.eye === 'wide')) T = T.slice(0, -1);
    if (st.eye === 'half') { T = T.map((r, k) => (k < Math.floor(T.length * 0.45) ? '........' : r)); T[Math.floor(T.length * 0.45)] = fem ? 'KKKKKKK.' : 'KKKKKK..'; }
    const h = T.length, x0 = s > 0 ? 18 : 6;
    const look = st.look || 0;
    for (let r = 0; r < h; r++) for (let k = 0; k < 8; k++) {
      let ch = T[r][k]; if (!ch || ch === '.') continue;
      if ((ch === 'D' || ch === 'I' || ch === 'L' || ch === 'P' || ch === 'H') && look) {   // glance: shift the iris a pixel
        const k2 = k - look * s; const src = T[r][k2]; if (src && 'DILPHW'.includes(src)) ch = src;
      }
      const x = s > 0 ? x0 + k : x0 + 7 - k, y = ey + (h - 1 - r) + (st.eye === 'closed' || st.eye === 'happy' ? 2 : 0) - (fem ? 0 : -1);
      B.set(x, y, col[ch] || INK);
    }
    // angry / sad: slant the lash line
    if (st.eye === 'angry' || st.eye === 'sad') {
      const topY = ey + h - (fem ? 1 : 0), inner = s > 0 ? x0 : x0 + 7, dir = s > 0 ? 1 : -1;
      for (let k = 0; k < 7; k++) { const x = inner + dir * k, dy = st.eye === 'angry' ? Math.round((6 - k) * 0.4) : Math.round(k * 0.4); for (let q = 0; q < dy; q++) B.set(x, topY - q, sk); B.set(x, topY - dy, INK); }
    }
    // brows
    const by = ey + h + (fem ? 3 : 2), bc = mix(rgb((spec.hair || {}).col || '#2a1e1a'), INK, 0.4);
    for (let k = 1; k < 6; k++) { const x = s > 0 ? x0 + k : x0 + 7 - k, tilt = st.eye === 'angry' ? Math.round((5 - k) * -0.4) : st.eye === 'sad' ? Math.round((5 - k) * 0.4) : st.eye === 'wide' ? 1 : 0; B.set(x, by + tilt, bc); if (!fem) B.set(x, by + tilt + 1, bc); }
  }
  // the nose: one shaded pixel
  B.set(15, 7, shade(sk, 0.86));
  // mouth
  const M = MOUTHS[st.mouth] || MOUTHS.neutral, mc = { K: [96, 40, 48], M: [128, 32, 46], T: [236, 122, 132], W: [252, 250, 246] }, mw = M[0].length, my = 3;
  for (let r = 0; r < M.length; r++) for (let k = 0; k < mw; k++) { const ch = M[r][k]; if (ch !== '.') B.set(16 - Math.floor(mw / 2) + k, my + (M.length - 1 - r), mc[ch]); }
  // stickers, glasses, mustache
  for (const d of F.deco || []) faceDeco(B, d);
  if (F.mustache) { const c = mix(rgb((spec.hair || {}).col || '#2a1e1a'), INK, 0.3); for (let k = 0; k < 7; k++) B.set(13 + k, 6, c); B.set(12, 5, c); B.set(20, 5, c); }
  if (spec.glasses) { const c = rgb(spec.glasses.col || '#28222a'), round = spec.glasses.kind !== 'rect'; for (const x0 of [5, 17]) { for (let k = 0; k < 10; k++) { if (round && (k === 0 || k === 9)) continue; B.set(x0 + k, 7, c); B.set(x0 + k, 19, c); } for (let y = 8; y < 19; y++) { if (round && (y === 8 || y === 18)) { B.set(x0 + 1, y, c); B.set(x0 + 8, y, c); continue; } B.set(x0, y, c); B.set(x0 + 9, y, c); } } B.set(15, 15, c); B.set(16, 15, c); }
}
function faceDeco(B, d) {
  const at = d.at || 'cheekL', s = /L$/.test(at) ? 1 : /R$/.test(at) ? -1 : 0, base = at.replace(/[LR]$/, '');
  const A = { cheek: [16 + s * 10, 7], eye: [16 + s * 12, 10], brow: [16 + s * 9, 22], nose: [16, 8], mouth: [16 + s * 5, 4], forehead: [16 + s * 6, 24] }[base] || [16, 8];
  const [x, y] = A, c = d.col !== undefined ? rgb(d.col) : null;
  switch (d.kind) {
    case 'star': for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) B.set(x + dx, y + dy, c || [255, 214, 74]); break;
    case 'heart': for (const [dx, dy] of [[-1, 1], [1, 1], [-1, 0], [0, 0], [1, 0], [0, -1]]) B.set(x + dx, y + dy, c || [244, 92, 138]); break;
    case 'bandaid': for (let k = -2; k <= 2; k++) { B.set(x + k, y, [236, 196, 160]); B.set(x + k, y + 1, [236, 196, 160]); } B.set(x, y, [214, 160, 130]); B.set(x, y + 1, [214, 160, 130]); break;
    case 'gems': B.set(x, y, c || [150, 220, 255]); B.set(x + s, y + 2, c || [150, 220, 255]); break;
    case 'mole': B.set(x, y, [80, 46, 42]); break;
    case 'hatch': for (const sx of [5, 24]) for (let k = 0; k < 3; k++) B.set(sx + k, 8, [230, 110, 124]); break;
    case 'paint': for (let k = -2; k <= 2; k++) { B.set(x + k, y, c || INK); B.set(x + k, y - 2, c || INK); } break;
    case 'scar': B.set(x, y, [236, 186, 168]); B.set(x + 1, y + 1, [236, 186, 168]); B.set(x - 1, y - 1, [236, 186, 168]); break;
    case 'tear': B.set(x, y, c || [128, 200, 248]); B.set(x, y - 1, c || [128, 200, 248]); break;
    default: break;
  }
}
