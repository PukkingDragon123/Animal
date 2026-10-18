// Chinatown kit: the builders behind the Grant Avenue diorama (chinatown.js).
// Chinese hip roofs of glazed tile (flared slopes, upturned corners, capped hips
// and ridges, gold ornaments), a paifang gate with guardian lions, a garden
// pavilion, dragon street lamps with pagoda lantern tops, and the parts shophouse
// facades are made of: windows with sashes and blinds, fret railings, balconies
// and loggias, fire escapes, striped awnings, tile eaves, rolling shutters; rooftop
// water tanks and condensers; chess tables, news boxes, bins, a delivery van and
// a California Street cable car. Positions are voxels (8 per metre); facades face +z.
import { GLOW } from '../fine.js';
import { h3 } from '../kit.js';
import { glyphs, Pen, newSurf } from '../decals.js';
import { sprite, spriteInfo } from '../cards.js';
import { shift, mix } from '../../px/paint.js';

export const C = {
  tile: ['#2c784a', '#3a8c5a', '#2f8050', '#48a06e'], tileD: '#22603c', ridge: '#1c4a31', ridgeHi: '#2f704a', edge: '#1f5636',
  tileR: ['#ac282b', '#ba3331', '#9e2427', '#c4463c'], tileRD: '#6e191c',
  gold: ['#dcae3c', '#f0ca56', '#b98a2c'],
  red: ['#a92428', '#b72c2d', '#9c2125'], redD: '#6a181b',
  under: ['#7a2022', '#2b5a6c'],
  jade: '#2a7866', blue: '#28548a',
  granite: ['#8f8b84', '#99958d', '#86827b', '#a29e96'],
  stone: ['#aaa69e', '#9e9a91', '#b6b2a9', '#918d85'],
  iron: ['#24242a', '#2c2c32', '#34343a'],
};
export const LIT = ['#ffd27a', '#ffc35e', '#ffe2a2'];
const CURT = ['#efe4cc', '#c84a3c', '#e6c25a', '#8fb6a2', '#d89aa4', '#efe4cc'];
const CURT_LIT = { '#efe4cc': '#ffe0a4', '#c84a3c': '#ff8a5c', '#e6c25a': '#ffd660', '#8fb6a2': '#d2e6a4', '#d89aa4': '#ffb0a0' };

export const one = (k, c, f = 0) => (typeof c === 'number' ? c : k.v.c(c, f));
export const many = (k, c, f = 0) => (Array.isArray(c) ? k.m(c, f) : [one(k, c, f)]);
const pickH = (S, x, y, z) => S[Math.floor(h3(x, y, z) * S.length)];
// a box of a palette index, a list of indices (hashed), a fn(x,y,z), or a kit material name
export function bx(k, x0, y0, z0, x1, y1, z1, c, mode, o) {
  if (typeof c === 'number' || typeof c === 'function') return k.v.box(x0, y0, z0, x1, y1, z1, c);
  if (Array.isArray(c) && typeof c[0] === 'number') { const S = c; return k.v.box(x0, y0, z0, x1, y1, z1, (x, y, z) => S[Math.floor(h3(x, y, z) * S.length)]); }
  return k.box(x0, y0, z0, x1, y1, z1, c, mode, o);
}


// ------------------------------------------------------------ solids
export function ell(v, cx, cy, cz, rx, ry, rz, c) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2;
    if (d <= 1) { const col = typeof c === 'function' ? c(x, y, z, d) : c; if (col !== undefined) v.set(x, y, z, col); }
  }
}
// vertical cylinder (centre cx, cz may be fractional)
export function cylY(v, cx, cz, r, y0, y1, c) {
  for (let y = y0; y <= y1; y++) for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    const d = Math.hypot(x - cx, z - cz); if (d > r) continue;
    const col = typeof c === 'function' ? c(x, y, z, d, Math.atan2(z - cz, x - cx)) : c; if (col !== undefined) v.set(x, y, z, col);
  }
}
export function line3(v, a, b, c) {
  const n = Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs(b[2] - a[2]))) * 2 + 1;
  for (let i = 0; i <= n; i++) { const t = i / n; v.set(Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t), c); }
}

// ------------------------------------------------------------ Chinese hip roof
// Eave rectangle [x0,x1]×[z0,z1] at height y. The slope is flared (shallow at the
// eaves, steep near the top), corners sweep up by `lift` over `liftR`; tile channels
// run down each face, the eave edge carries gold-faced tile ends, hips are capped,
// the ridge carries end ornaments (or a finial when the roof is square).
export function pagodaRoof(k, o) {
  const v = k.v, x0 = o.x0, x1 = o.x1, z0 = o.z0, z1 = o.z1, y = o.y, W = x1 - x0, D = z1 - z0, half = Math.min(W, D) / 2;
  const rise = o.rise ?? Math.round(half * 0.7), lift = o.lift ?? 3, LR = o.liftR ?? Math.max(4, half * 0.6), fl = o.flare ?? 1.7, th = o.th ?? 2;
  const T = many(k, o.tile || C.tile), TD = one(k, o.tileD || C.tileD), RG = one(k, o.ridge || C.ridge), RH = one(k, o.ridgeHi || C.ridgeHi);
  const GD = many(k, o.gold || C.gold), UN = many(k, o.under || C.under), EG = one(k, o.edge || C.edge);
  const N = D + 1, top = new Int16Array((W + 1) * N), at = (i, j) => (i < 0 || j < 0 || i > W || j > D ? 9999 : top[i * N + j]);
  for (let i = 0; i <= W; i++) for (let j = 0; j <= D; j++) {
    const ex = Math.min(i, W - i), ez = Math.min(j, D - j), d = Math.min(ex, ez), u = Math.min(1, Math.max(ex, ez) / LR);
    top[i * N + j] = Math.round(y + rise * Math.pow(Math.min(1, d / half), fl) + lift * (1 - u) * (1 - u));
  }
  let yMax = 0;
  for (let i = 0; i <= W; i++) for (let j = 0; j <= D; j++) {
    const h = top[i * N + j], ex = Math.min(i, W - i), ez = Math.min(j, D - j), d = Math.min(ex, ez), x = x0 + i, z = z0 + j;
    let lo = h - th + 1; const nmin = Math.min(at(i + 1, j), at(i - 1, j), at(i, j + 1), at(i, j - 1)); if (nmin + 1 < lo) lo = nmin + 1;
    const hip = (ex - ez === 0 || ex - ez === 1) && d > 0 && d < half - 1.5, along = ez < ex ? i : j;
    for (let yy = lo; yy <= h; yy++) {
      let c;
      if (yy === h) {
        if (d === 0) c = along % 3 === 1 ? GD[0] : EG;
        else if (hip) c = RG;
        else { const a3 = along % 3; c = a3 === 0 ? TD : d % 4 === 0 ? T[0] : a3 === 1 ? (h3(x, yy, z) < 0.12 ? T[3] : T[1]) : T[2]; }
      } else c = yy === lo ? UN[(along >> 1) % 2 && d < 3 ? 1 : 0] : TD;
      v.set(x, yy, z, c);
    }
    if (hip) { v.set(x, h + 1, z, ex === ez ? RH : RG); if (o.figures !== false && ex === ez && (d === 2 || d === 4) && half > 6) v.set(x, h + 2, z, d === 2 ? GD[1] : RG); }
    if (d === 0 && ex === 0 && ez === 0) { v.set(x, h + 1, z, GD[1]); if (lift >= 3) v.set(x, h + 2, z, GD[0]); }
    if (h > yMax) yMax = h;
  }
  // main ridge: a raised beam of ridge tiles with ornaments
  const rh = o.ridgeH ?? (half > 8 ? 2 : 1), yR = yMax + rh;
  const out = { yMax, yR, top: (x, z) => at(x - x0, z - z0) };
  if (W === D) {                                        // pyramid: finial
    const cx = x0 + W / 2, cz = z0 + D / 2, f = o.finial ?? Math.max(3, Math.round(half * 0.5));
    ell(v, cx, yMax + 1.2, cz, 1.6, 1.2, 1.6, GD[2]);
    for (let j = 0; j < f; j++) { const r = j < f * 0.4 ? 1.3 : j < f * 0.75 ? 0.9 : 0.5; ell(v, cx, yMax + 2 + j, cz, r, 0.6, r, GD[j % 2]); }
    out.yTop = yMax + 2 + f; return out;
  }
  const alongX = W > D, a0 = alongX ? x0 : z0, L = alongX ? W : D, ra = a0 + Math.ceil(half - 1), rb = a0 + L - Math.ceil(half - 1);
  const c0 = (alongX ? z0 : x0) + Math.floor(half - 1), c1 = (alongX ? z0 : x0) + Math.ceil(half + 1);
  const P = (a, yy, c, col) => (alongX ? v.set(a, yy, c, col) : v.set(c, yy, a, col));
  for (let a = ra; a <= rb; a++) for (let c = c0; c <= c1; c++) {
    const edge = c === c0 || c === c1; if (edge && (a === ra || a === rb)) continue;
    const base = alongX ? at(a - x0, c - z0) : at(c - x0, a - z0);
    if (base > 9000) continue;
    for (let yy = base + 1; yy <= (edge ? yR - 1 : yR); yy++) P(a, yy, c, yy === yR ? RH : (a - ra) % 4 === 2 && yy === yR - 1 && !edge ? GD[2] : RG);
  }
  // ridge-end ornaments (a curled horn with a gold tip) and an optional pearl in the middle
  const cm = (c0 + c1) / 2, orn = o.ornH ?? (half > 8 ? 4 : 2);
  for (const [a, dir] of [[ra, 1], [rb, -1]]) for (let j = 1; j <= orn; j++) for (let c = Math.floor(cm); c <= Math.ceil(cm); c++) {
    P(a, yR + j, c, j === orn ? GD[1] : RG);
    if (j === orn && orn > 2) { P(a + dir, yR + j, c, GD[0]); P(a + dir * 2, yR + j - 1, c, GD[0]); P(a - dir, yR + j - 1, c, RG); }
  }
  if (o.pearl) {
    const am = (ra + rb) / 2;
    for (let c = Math.floor(cm); c <= Math.ceil(cm); c++) { P(Math.floor(am), yR + 1, c, GD[2]); P(Math.ceil(am), yR + 1, c, GD[2]); }
    const pc = alongX ? [am, yR + 3.2, cm] : [cm, yR + 3.2, am];
    ell(v, pc[0], pc[1], pc[2], 1.6, 1.6, 1.6, GD[1]);
    const fx = alongX ? [am, yR + 5, cm] : [cm, yR + 5, am];
    v.set(Math.round(fx[0]), Math.round(fx[1]), Math.round(fx[2]), one(k, '#e8502a'));
    for (const s of [-2.5, 2.5]) { const q = alongX ? [am + s, yR + 2, cm] : [cm, yR + 2, am + s]; v.set(Math.round(q[0]), Math.round(q[1]), Math.round(q[2]), one(k, '#e8502a')); v.set(Math.round(q[0]), Math.round(q[1]) + 1, Math.round(q[2]), GD[0]); }
  }
  out.yTop = yR + orn; return out;
}

// a band of painted bracket sets (dougong) under an eave: blocks alternate green
// and blue between red bearers, a gold line on top. along: 'x' or 'z'
export function brackets(k, x0, y0, z0, x1, y1, z1, along = 'x') {
  const v = k.v, R = many(k, C.red), G = one(k, C.jade), B = one(k, C.blue), GD = many(k, C.gold), RD = one(k, C.redD);
  bx(k, x0, y0, z0, x1, y1, z1, (x, y, z) => {
    const u = along === 'x' ? x : z, p = ((u % 5) + 5) % 5;
    if (y === y1) return p === 2 ? GD[1] : R[0];
    if (y === y0) return R[1];
    return p === 4 ? RD : (Math.floor(u / 5) % 2 ? G : B);
  });
  // carve the recesses between the blocks on the outer faces so they read as blocks
  const faces = along === 'x' ? [[z0, -1], [z1, 1]] : [[x0, -1], [x1, 1]];
  for (const [f] of faces) for (let u = (along === 'x' ? x0 : z0); u <= (along === 'x' ? x1 : z1); u++) {
    if (((u % 5) + 5) % 5 !== 4) continue;
    for (let y = y0 + 1; y < y1; y++) along === 'x' ? v.set(u, y, f, 0) : v.set(f, y, u, 0);
  }
}
// a lacquered beam: red, with blue-green painted ends ("hexi" bands) and gold lines
export function beam(k, x0, y0, z0, x1, y1, z1, along = 'x') {
  const R = many(k, C.red), G = one(k, C.jade), B = one(k, C.blue), GD = many(k, C.gold), a0 = along === 'x' ? x0 : z0, a1 = along === 'x' ? x1 : z1, L = a1 - a0;
  bx(k, x0, y0, z0, x1, y1, z1, (x, y, z) => {
    const u = (along === 'x' ? x : z) - a0, e = Math.min(u, L - u), mid = Math.abs(u - L / 2) < L * 0.17;
    if (e < Math.max(3, L * 0.16)) return e === 0 ? GD[2] : (u + y) % 4 === 0 ? GD[0] : ((e >> 1) % 2 ? G : B);
    if (mid) return y === y0 || y === y1 ? GD[0] : B;
    return y === y0 || y === y1 ? GD[2] : R[(u >> 2) % 2];
  });
}

// ------------------------------------------------------------ the gate
// A paifang across a street that runs along x: four red pillars on stone drums at
// z = pz[0..3] (each 4 wide), a tall central portal under the main roof and two lower
// side portals; painted beams, bracket bands, lattice panels, a plaque board.
// Returns where the plaque, couplets and lanterns go (voxels).
export function paifang(k, o) {
  const v = k.v, X = o.x, y0 = o.y, pz = o.pz, R = many(k, C.red), GD = many(k, C.gold), GR = many(k, C.granite), GRD = one(k, '#6f6b65');
  const zc = (pz[1] + pz[2] + 3) / 2, out = { plaque: null, couplets: [], lanterns: [] };
  pz.forEach((z, n) => {
    const central = n === 1 || n === 2, top = y0 + (central ? 64 : 44);
    // stone clamp blocks with a carved panel, a moulded cap
    bx(k, X - 4, y0, z - 2, X + 3, y0 + 9, z + 5, (x, y, zz) => {
      const ex = x === X - 4 || x === X + 3, ez = zz === z - 2 || zz === z + 5;
      if (y === y0 + 9 || y === y0) return GR[3];
      if ((ex || ez) && y > y0 + 2 && y < y0 + 8 && !(ex && ez) && (ex ? zz > z - 1 && zz < z + 4 : x > X - 3 && x < X + 2)) return GRD;
      return pickH(GR, x, y, zz);
    });
    bx(k, X - 5, y0 + 9, z - 3, X + 4, y0 + 9, z + 6, GR[2]);
    // pillar: red lacquer, gold bands
    bx(k, X - 2, y0 + 10, z, X + 1, top, z + 3, (x, y) => (y === y0 + 12 || y === y0 + 13 || y === top - 4 ? GD[(y & 1)] : R[(x + y) % 3 === 0 ? 2 : 0]));
    if (central) out.couplets.push({ z: z + 2, y: y0 + 18, side: n === 1 ? -1 : 1 });
  });
  const [n1, n2, s2, s1] = pz;
  // side portals: beams, a lattice panel, brackets, a lower roof each
  for (const [za, zb] of [[n1, n2 + 3], [s2, s1 + 3]]) {
    beam(k, X - 3, y0 + 32, za, X + 2, y0 + 35, zb, 'z');
    bx(k, X - 2, y0 + 36, za + 4, X + 1, y0 + 41, zb - 4, (x, y, z) => (y === y0 + 36 || y === y0 + 41 || (z - za) % 4 === 0 ? GD[2] : (y + z) % 2 ? one(k, C.jade) : one(k, '#1d4e44')));
    beam(k, X - 3, y0 + 42, za, X + 2, y0 + 44, zb, 'z');
    brackets(k, X - 4, y0 + 45, za - 2, X + 3, y0 + 47, zb + 2, 'z');
    out.side = pagodaRoof(k, { x0: X - 10, x1: X + 9, z0: za === n1 ? za - 6 : za - 2, z1: za === n1 ? zb + 2 : zb + 6, y: y0 + 48, rise: 8, lift: 3, liftR: 7, th: 2 });
  }
  // central portal: lower beam, lattice side panels and the plaque, upper beam, brackets, main roof
  beam(k, X - 3, y0 + 46, n2, X + 2, y0 + 50, s2 + 3, 'z');
  bx(k, X - 2, y0 + 51, n2 + 4, X + 1, y0 + 60, s2 - 1, (x, y, z) => ((y - y0) % 3 === 0 || (z - n2) % 3 === 0 ? GD[(y + z) % 3 === 0 ? 1 : 2] : one(k, '#1b4a40')));
  const pw = 15; out.plaque = { z0: Math.floor(zc - pw), z1: Math.ceil(zc + pw) - 1, y0: y0 + 51, y1: y0 + 60, x0: X - 3, x1: X + 2 };
  bx(k, X - 3, y0 + 50, out.plaque.z0 - 1, X + 2, y0 + 61, out.plaque.z1 + 1, GD[2]);
  bx(k, X - 3, y0 + 51, out.plaque.z0, X + 2, y0 + 60, out.plaque.z1, one(k, '#1f3f66'));
  beam(k, X - 3, y0 + 61, n2, X + 2, y0 + 64, s2 + 3, 'z');
  brackets(k, X - 4, y0 + 65, n2 - 2, X + 3, y0 + 68, s2 + 5, 'z');
  out.main = pagodaRoof(k, { x0: X - 12, x1: X + 11, z0: n2 - 9, z1: s2 + 12, y: y0 + 69, rise: 12, lift: 4, liftR: 9, th: 2, pearl: true });
  out.lanterns = [[X - 0.5, y0 + 46, n2 + 12], [X - 0.5, y0 + 46, s2 - 9]];
  return out;
}

// a stone guardian lion on a plinth, facing -x (o.dir = 1 faces +x). (x, y, z) = plinth corner
export function lion(k, x, y, z, o = {}) {
  const v = k.v, S = many(k, C.stone), SD = one(k, '#77736c'), GR = many(k, C.granite), EYE = one(k, '#3a3633'), MOUTH = one(k, '#5a2a26'), TOOTH = one(k, '#e6e2d8');
  const L = 11, dir = o.dir || -1, X = (u) => (dir < 0 ? x + u : x + L - 1 - u), yb = y + 6;
  // plinth: base, carved band, top moulding
  bx(k, x - 1, y, z - 1, x + L, y + 5, z + 8, (xx, yy, zz) => (yy === y + 5 || yy === y ? GR[3] : (yy === y + 2 || yy === y + 3) && (xx === x - 1 || xx === x + L || zz === z - 1 || zz === z + 8) ? GR[2] : pickH(GR, xx, yy, zz)));
  const st = (xx, yy, zz) => pickH(S, xx, yy, zz);
  const E = (u, h, w, ru, rh, rw, c) => ell(v, X(u), yb + h, z + w, ru, rh, rw, c);
  E(7.6, 3, 3.5, 2.8, 3.2, 3.6, st);                  // haunches
  E(4.6, 5.2, 3.5, 3.0, 3.9, 3.1, st);                // chest
  for (const w of [1, 5]) { bx(k, Math.min(X(1.5), X(3)), yb, z + w, Math.max(X(1.5), X(3)), yb + 5, z + w + 1, st); bx(k, Math.min(X(0.5), X(3)), yb, z + w, Math.max(X(0.5), X(3)), yb, z + w + 1, SD); }
  E(2.6, 10.2, 3.5, 2.9, 3.0, 3.6, st);               // head
  for (let a = 0; a < 14; a++) {                      // mane curls
    const t = (a / 14) * Math.PI * 2, w = 3.5 + Math.cos(t) * 3.4, h = 10.4 + Math.sin(t) * 2.9;
    E(4.4 + (a % 2) * 0.6, h, w, 1.1, 1.1, 1.1, (a % 3 === 0 ? SD : st));
  }
  E(4.8, 13.2, 3.5, 1.6, 1.0, 2.4, SD);
  // face: eyes under heavy brows, flat nose, open mouth with teeth
  for (const w of [2, 5]) { v.set(X(0), yb + 11, z + w, EYE); v.set(X(0), yb + 12, z + w, S[2]); v.set(X(0), yb + 12, z + w + (w === 2 ? -1 : 1), S[2]); }
  v.set(X(-1), yb + 10, z + 3, S[3]); v.set(X(-1), yb + 10, z + 4, S[3]);
  for (let w = 2; w <= 5; w++) { v.set(X(0), yb + 8, z + w, MOUTH); v.set(X(0), yb + 7, z + w, w === 2 || w === 5 ? TOOTH : MOUTH); v.set(X(1), yb + 8, z + w, MOUTH); }
  v.set(X(0), yb + 9, z + 2, TOOTH); v.set(X(0), yb + 9, z + 5, TOOTH);
  // red silk ribbon and a bell at the neck
  for (let w = 0; w <= 7; w++) v.set(X(2.2 - (w === 0 || w === 7 ? -0.6 : 0)), yb + 7, z + w, one(k, '#c0282c'));
  v.set(X(1), yb + 6, z + 3, one(k, C.gold[1])); v.set(X(1), yb + 6, z + 4, one(k, C.gold[0]));
  // the ball under the paw (male) or a cub (female), a curly tail
  if (!o.female) { E(0.6, 1.8, 1.6, 1.7, 1.7, 1.7, (xx, yy, zz) => ((xx + yy + zz) % 3 === 0 ? SD : st(xx, yy, zz))); bx(k, Math.min(X(0), X(2)), yb + 3, z + 1, Math.max(X(0), X(2)), yb + 4, z + 2, st); }
  else { E(1.0, 1.4, 5.6, 1.5, 1.4, 1.3, st); v.set(X(0), yb + 2, z + 6, EYE); }
  E(10, 6.2, 3.5, 1.2, 1.6, 1.6, SD); E(10.4, 8, 3.5, 1, 1.2, 1.4, st);
}

// ------------------------------------------------------------ the pavilion
// square open pavilion on a stone platform: red columns, seats, gold lattice frieze,
// a double-eave roof (lower hip skirt, clerestory, pyramid top with a gold finial).
// (cx, cz) centre, y = ground. Returns light / lantern anchors.
export function pavilion(k, o) {
  const v = k.v, { cx, cz, y } = o, s = o.s || 16, R = many(k, C.red), GD = many(k, C.gold), GR = many(k, C.granite), night = o.night;
  // platform: two steps of granite, inner floor of red-brown tiles
  bx(k, cx - s - 6, y, cz - s - 6, cx + s + 5, y + 1, cz + s + 5, (x, yy, z) => pickH(GR, x, yy, z));
  bx(k, cx - s - 4, y + 2, cz - s - 4, cx + s + 3, y + 3, cz + s + 3, (x, yy, z) => (yy === y + 3 && Math.max(Math.abs(x - cx + 0.5), Math.abs(z - cz + 0.5)) < s + 2 ? one(k, ((x >> 1) + (z >> 1)) % 2 ? '#9a5a44' : '#a8664c') : pickH(GR, x, yy, z)));
  const top = y + 30, cols = [];
  for (const dx of [-s, -Math.round(s / 3), Math.round(s / 3) - 1, s - 1]) for (const dz of [-s, -Math.round(s / 3), Math.round(s / 3) - 1, s - 1]) {
    const edge = Math.abs(dx + 0.5) > s - 2 || Math.abs(dz + 0.5) > s - 2, corner = Math.abs(dx + 0.5) > s - 2 && Math.abs(dz + 0.5) > s - 2;
    if (!edge || (!corner && (Math.abs(dx + 0.5) < s / 2 && Math.abs(dz + 0.5) < s / 2))) continue;
    if (!corner && Math.abs(dx + 0.5) < s - 2 && Math.abs(dz + 0.5) < s - 2) continue;
    const x = cx + dx - 1, z = cz + dz - 1; cols.push([x, z]);
    bx(k, x - 1, y + 4, z - 1, x + 2, y + 5, z + 2, GR[3]);
    bx(k, x, y + 6, z, x + 1, top - 4, z + 1, (xx, yy) => (yy === y + 8 || yy === top - 6 ? GD[0] : R[(yy % 5 === 0) ? 2 : 0]));
  }
  // seats (beauty's rest benches) between the columns on three sides, open to the north
  for (const [ax, az, qx, qz] of [[cx - s, cz + s - 2, cx + s - 1, cz + s - 1], [cx - s, cz - s, cx - s + 1, cz + s - 1], [cx + s - 2, cz - s, cx + s - 1, cz + s - 1]]) {
    bx(k, ax, y + 7, az, qx, y + 7, qz, R[1]);
    bx(k, ax, y + 4, az, qx, y + 6, qz, (x, yy, z) => ((x + z) % 4 === 0 ? R[2] : undefined));
  }
  // beams and a gold lattice frieze hanging between the columns
  beam(k, cx - s - 1, top - 3, cz - s - 1, cx + s, top - 1, cz - s, 'x'); beam(k, cx - s - 1, top - 3, cz + s - 1, cx + s, top - 1, cz + s, 'x');
  beam(k, cx - s - 1, top - 3, cz - s - 1, cx - s, top - 1, cz + s, 'z'); beam(k, cx + s - 1, top - 3, cz - s - 1, cx + s, top - 1, cz + s, 'z');
  for (const [a, b, at, al] of [[cx - s + 2, cx + s - 3, cz - s, 'x'], [cx - s + 2, cx + s - 3, cz + s - 1, 'x'], [cz - s + 2, cz + s - 3, cx - s, 'z'], [cz - s + 2, cz + s - 3, cx + s - 1, 'z']])
    for (let u = a; u <= b; u++) for (let j = 1; j <= 3; j++) {
      const on = j === 1 ? u % 2 === 0 : j === 3 || (u - a) % 4 === 0;
      if (on) al === 'x' ? v.set(u, top - 3 - j, at, GD[j === 3 ? 2 : 0]) : v.set(at, top - 3 - j, u, GD[j === 3 ? 2 : 0]);
    }
  brackets(k, cx - s - 1, top, cz - s - 1, cx + s, top + 2, cz - s + 1, 'x'); brackets(k, cx - s - 1, top, cz + s - 2, cx + s, top + 2, cz + s, 'x');
  brackets(k, cx - s - 1, top, cz - s - 1, cx - s + 1, top + 2, cz + s, 'z'); brackets(k, cx + s - 2, top, cz - s - 1, cx + s, top + 2, cz + s, 'z');
  // ceiling: coffered teal and red
  bx(k, cx - s + 1, top + 2, cz - s + 1, cx + s - 2, top + 2, cz + s - 2, (x, yy, z) => ((x - cx) % 6 === 0 || (z - cz) % 6 === 0 ? R[0] : one(k, C.jade)));
  const lo = pagodaRoof(k, { x0: cx - s - 11, x1: cx + s + 10, z0: cz - s - 11, z1: cz + s + 10, y: top + 3, rise: 10, lift: 5, liftR: 11, th: 2, flare: 1.5 });
  // clerestory with lattice windows, then the upper roof
  const c = Math.round(s * 0.62), cy0 = top + 9, cy1 = top + 18;
  bx(k, cx - c, cy0, cz - c, cx + c - 1, cy1, cz + c - 1, (x, yy, z) => {
    const ex = x === cx - c || x === cx + c - 1, ez = z === cz - c || z === cz + c - 1;
    if (ex && ez) return R[2];
    if (yy === cy0 || yy === cy1) return GD[2];
    const u = ex ? z : x; return (u % 2 === 0 || yy % 2 === 0) ? R[0] : (night ? one(k, '#ffcf7a', GLOW) : one(k, '#3a2a24'));
  });
  brackets(k, cx - c - 1, cy1 + 1, cz - c - 1, cx + c, cy1 + 2, cz + c, 'x');
  const up = pagodaRoof(k, { x0: cx - c - 8, x1: cx + c + 7, z0: cz - c - 8, z1: cz + c + 7, y: cy1 + 3, rise: 13, lift: 4, liftR: 8, th: 2, finial: 7 });
  return { light: [cx / 8, (top - 6) / 8, cz / 8], eaves: [[cx - s - 10, top + 3, cz - s - 10], [cx + s + 9, top + 3, cz - s - 10], [cx - s - 10, top + 3, cz + s + 9], [cx + s + 9, top + 3, cz + s + 9]], top: up.yTop, lo };
}

// ------------------------------------------------------------ dragon street lamp
// dark iron plinth, red post wound with a gold dragon, a lantern housing (lit at
// night) under a red-and-gold pagoda cap. Returns the light position (metres).
export function ctLamp(k, x, y, z, o = {}) {
  const v = k.v, night = o.night, B = many(k, ['#1f2b25', '#26332c', '#1a241f']), R = many(k, C.red), GD = many(k, C.gold);
  bx(k, x - 2, y, z - 2, x + 3, y + 1, z + 3, B);
  bx(k, x - 1, y + 2, z - 1, x + 2, y + 4, z + 2, B);
  bx(k, x - 1, y + 5, z - 1, x + 2, y + 5, z + 2, GD[2]);
  bx(k, x, y + 6, z, x + 1, y + 34, z + 1, (xx, yy) => R[yy % 4 === 0 ? 2 : 0]);
  for (let yy = y + 8; yy <= y + 28; yy++) {            // the dragon coils up the post
    const a = (yy - y) * 0.5, dx = Math.round(0.5 + Math.cos(a) * 1.55), dz = Math.round(0.5 + Math.sin(a) * 1.55);
    v.set(x + dx, yy, z + dz, GD[yy % 3 === 0 ? 2 : 0]);
  }
  const ha = (y + 29 - y) * 0.5, hx = x + Math.round(0.5 + Math.cos(ha) * 2), hz = z + Math.round(0.5 + Math.sin(ha) * 2);
  bx(k, hx - 1 + (hx > x ? 1 : 0), y + 29, hz - 1 + (hz > z ? 1 : 0), hx + (hx > x ? 1 : 0), y + 30, hz + (hz > z ? 1 : 0), GD[1]);
  v.set(hx + (hx > x ? 1 : -1), y + 31, hz, GD[0]); v.set(hx, y + 29, hz + (hz > z ? 1 : -1), one(k, '#d8342a'));
  // capital + crossarm with a little banner bracket
  bx(k, x - 1, y + 35, z - 1, x + 2, y + 35, z + 2, GD[2]);
  bx(k, x - 2, y + 36, z - 2, x + 3, y + 36, z + 3, R[2]);
  const PAN = night ? one(k, '#ffe2a0', GLOW) : one(k, '#f3e4c0'), PAN2 = night ? one(k, '#ffc868', GLOW) : one(k, '#e8d2a8');
  bx(k, x - 2, y + 37, z - 2, x + 3, y + 43, z + 3, (xx, yy, zz) => {
    const ex = xx === x - 2 || xx === x + 3, ez = zz === z - 2 || zz === z + 3;
    if (ex && ez) return R[0];
    if (yy === y + 37 || yy === y + 43) return GD[0];
    if (yy === y + 40) return R[1];
    return (xx + zz) % 3 === 0 ? PAN2 : PAN;
  });
  pagodaRoof(k, { x0: x - 4, x1: x + 5, z0: z - 4, z1: z + 5, y: y + 44, rise: 3, lift: 2, liftR: 3, th: 1, tile: C.tileR, tileD: C.tileRD, ridge: C.redD, ridgeHi: C.tileR[3], edge: C.gold[2], under: [C.red[0], C.gold[2]], finial: 0, figures: false });
  bx(k, x - 1, y + 48, z - 1, x + 2, y + 48, z + 2, GD[2]);
  pagodaRoof(k, { x0: x - 2, x1: x + 3, z0: z - 2, z1: z + 3, y: y + 49, rise: 2, lift: 1, liftR: 2, th: 1, tile: C.tileR, tileD: C.tileRD, ridge: C.redD, ridgeHi: C.tileR[3], edge: C.gold[2], under: [C.red[0]], finial: 3, figures: false });
  return [(x + 1) / 8, (y + 40) / 8, (z + 1) / 8];
}

// ------------------------------------------------------------ facade parts
// a window in a +z wall whose front layer is zf: reveal, glass with sky reflection,
// a blind or curtain, sash + muntins, sill and head; lit (night) or dark.
// o: { x0, x1, y0, y1, zf, inset, frame, sill, head: 'flat'|'hood'|'arch'|'none', grid: [cols, rows], night, lit, curtain, ac, grille, surround }
export function win(k, o) {
  const v = k.v, { x0, x1, y0, y1, zf } = o, ins = o.inset ?? 2, zg = zf - ins, night = !!o.night, W = x1 - x0, H = y1 - y0;
  const seed = h3(x0 * 7 + 3, y0 * 3, zf + 11), lit = night && (o.lit ?? seed < 0.55);
  const curtain = o.curtain === undefined ? (h3(x0, y1, 7) < 0.45 ? null : CURT[Math.floor(h3(y0, x1, 9) * CURT.length)]) : o.curtain;
  const cut = y1 - Math.max(1, Math.round(H * (o.blind ?? (0.25 + h3(x1, y0, 5) * 0.35))));
  const L0 = one(k, LIT[0], GLOW), L1 = one(k, LIT[1], GLOW), L2 = one(k, LIT[2], GLOW), DK = one(k, '#151a26');
  const g0 = one(k, '#2e3a52'), g1 = one(k, '#3c4c68'), g2 = one(k, '#5a6c8a'), gh = one(k, '#8ea6c0');
  const CC = curtain ? (lit ? one(k, CURT_LIT[curtain] || LIT[2], GLOW) : one(k, curtain)) : 0;
  bx(k, x0, y0, zg + 1, x1, y1, zf, 0);
  bx(k, x0, y0, zg, x1, y1, zg, (x, y) => {
    if (curtain && y >= cut) return CC;
    if (lit) return (x + y * 3) % 7 === 0 ? L2 : y > y0 + H * 0.6 ? L0 : L1;
    if (night) return DK;
    if ((x - y + 300) % 9 === 0 || (x - y + 301) % 9 === 0) return gh;
    const t = (y - y0) / Math.max(1, H); return t > 0.62 ? g2 : t > 0.3 ? g1 : g0;
  });
  // sash frame and muntins one voxel in front of the glass
  const F = one(k, o.frame || '#ece6da'), grid = o.grid || [W >= 7 ? 2 : 1, 2];
  if (o.sash !== false) for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
    const edge = x === x0 || x === x1 || y === y0 || y === y1;
    let mull = false;
    for (let i = 1; i < grid[0]; i++) if (x === x0 + Math.round((i * W) / grid[0])) mull = true;
    for (let j = 1; j < grid[1]; j++) if (y === y0 + Math.round((j * H) / grid[1])) mull = true;
    if (edge || mull) v.set(x, y, zg + 1, F);
  }
  const T = one(k, o.trim || '#efe8da'), S = one(k, o.sill || o.trim || '#e4dccc');
  // sill (inner + projecting), head
  bx(k, x0, y0 - 1, zg + 1, x1, y0 - 1, zf, S); bx(k, x0 - 1, y0 - 1, zf + 1, x1 + 1, y0 - 1, zf + 1, S);
  const head = o.head ?? 'flat';
  if (head === 'flat') bx(k, x0 - 1, y1 + 1, zf + 1, x1 + 1, y1 + 1, zf + 1, T);
  else if (head === 'hood') { bx(k, x0 - 1, y1 + 1, zf + 1, x1 + 1, y1 + 1, zf + 1, T); bx(k, x0 - 2, y1 + 2, zf + 1, x1 + 2, y1 + 3, zf + 2, T); }
  else if (head === 'brick') bx(k, x0 - 1, y1 + 1, zf, x1 + 1, y1 + 2, zf, (x) => ((x - x0) % 2 ? T : one(k, o.brickHead || '#7e3a2e')));
  else if (head === 'arch') {
    const cxw = (x0 + x1) / 2, r = W / 2 + 1;
    for (let x = x0 - 1; x <= x1 + 1; x++) { const hh = Math.round(Math.sqrt(Math.max(0, r * r - (x - cxw) ** 2)) * 0.55); for (let y = y1 + 1; y <= y1 + hh; y++) { v.set(x, y, zg, x === x0 - 1 || x === x1 + 1 || y === y1 + hh ? T : L1 === 0 ? 0 : (lit ? L1 : g2)); if (x >= x0 && x <= x1) for (let zz = zg + 1; zz <= zf; zz++) v.set(x, y, zz, 0); } v.set(x, y1 + hh + 1, zf, T); }
  }
  if (o.surround) for (let x = x0 - 1; x <= x1 + 1; x++) for (let y = y0 - 1; y <= y1 + 1; y++) if (x === x0 - 1 || x === x1 + 1 || y === y1 + 1) v.set(x, y, zf + 1, one(k, o.surround));
  if (o.grille) for (let x = x0; x <= x1; x += 2) for (let y = y0; y <= y1; y++) v.set(x, y, zf, one(k, '#2a2a30'));
  if (o.grille) for (let x = x0; x <= x1; x++) { v.set(x, y0 + Math.round(H / 2), zf, one(k, '#2a2a30')); v.set(x, y1, zf, one(k, '#2a2a30')); }
  // a window air conditioner wedged under the sash
  if (o.ac) {
    const ax0 = o.ac < 0 ? x1 - 5 : x0 + 1, AC = many(k, ['#d6d2c6', '#cac6ba', '#bfbab0']);
    bx(k, ax0, y0, zg + 1, ax0 + 4, y0 + 3, zf + 3, (x, y, z) => (z === zf + 3 && y > y0 && y < y0 + 3 && (x - ax0) % 2 === 1 ? one(k, '#8a867e') : AC[(y - y0) % 3]));
    bx(k, ax0 + 1, y0 - 3, zf + 1, ax0 + 1, y0 - 1, zf + 2, one(k, '#5a5a60'));
  }
  return { sill: [(x0 + x1) / 2, y0, zf + 2], lit };
}

// a railing in a vertical plane. axis 'x': along x from a to b at z = at; axis 'z': along z at x = at.
// style: 'bars' | 'fret' (回-pattern panels) | 'cross' | 'iron'
export function railing(k, o) {
  const v = k.v, { a, b, y, h = 6, at, axis = 'x', style = 'bars' } = o, A = one(k, o.col || C.red[0]), B = one(k, o.col2 || o.col || C.red[2]);
  const P = (u, j, c) => (axis === 'x' ? v.set(u, y + j, at, c) : v.set(at, y + j, u, c));
  for (let u = a; u <= b; u++) for (let j = 0; j <= h; j++) {
    const i = u - a, pu = i % 8, mid = Math.round(h / 2);
    let on = j === h || (j === 0 && style !== 'iron');
    if (style === 'bars') on ||= i % 2 === 0 || u === b;
    else if (style === 'iron') on ||= i % 3 === 0 || u === b || j === h - 2;
    else if (style === 'cross') { const q = i % 6, s = Math.round((q / 6) * (h - 1)); on ||= q === 0 || u === b || j === s || j === h - 1 - s; }
    else if (style === 'fret') on ||= pu === 0 || u === b || ((pu === 2 || pu === 6) && j >= 2 && j <= h - 2) || ((j === 2 || j === h - 2) && pu >= 2 && pu <= 6) || (pu === 4 && j === mid);
    else if (style === 'solid') on = true;
    if (on) P(u, j, j === h ? B : A);
  }
}
// a projecting balcony: slab with a moulded edge, brackets below, railing on three sides
export function balcony(k, o) {
  const { x0, x1, y, zf, D = 6, style = 'fret', col, col2, slab = '#d8d0c0' } = o, S = one(k, slab), S2 = one(k, o.slab2 || '#bdb4a4');
  bx(k, x0, y - 1, zf + 1, x1, y, zf + D, (x, yy, z) => (yy === y - 1 || z === zf + D ? S2 : S));
  for (let x = x0 + 1; x < x1; x += Math.max(4, Math.floor((x1 - x0) / 4))) for (let d = 1; d <= D - 1; d++) bx(k, x, y - 1 - (D - d), zf + d, x, y - 2, zf + d, S2);
  const h = o.h ?? 7;
  railing(k, { a: x0, b: x1, y: y + 1, h, at: zf + D, axis: 'x', style, col, col2 });
  railing(k, { a: zf + 1, b: zf + D, y: y + 1, h, at: x0, axis: 'z', style, col, col2 });
  railing(k, { a: zf + 1, b: zf + D, y: y + 1, h, at: x1, axis: 'z', style, col, col2 });
}
// a loggia: a balcony recessed into the facade, tiled floor, railing on the front plane
export function loggia(k, o) {
  const v = k.v, { x0, x1, y0, y1, zf, R = 5, style = 'fret', col, col2, wall } = o;
  bx(k, x0, y0, zf - R + 1, x1, y1, zf, 0);
  bx(k, x0, y0 - 1, zf - R + 1, x1, y0 - 1, zf, (x, y, z) => one(k, (x + z) % 2 ? (o.floor || '#a85a48') : (o.floor2 || '#bf7058')));
  if (wall) bx(k, x0, y0, zf - R, x1, y1, zf - R, wall);
  railing(k, { a: x0, b: x1, y: y0, h: o.h ?? 7, at: zf, axis: 'x', style, col, col2 });
  return { back: zf - R, ceil: y1 };
}
// steel fire escape: grated platforms at each level y, railings, stairs between them, a drop ladder
export function fireEscape(k, o) {
  const v = k.v, { x0, x1, zf, levels, D = 7 } = o, I = many(k, C.iron), RU = one(k, '#5e3e30');
  levels.forEach((y, n) => {
    bx(k, x0, y, zf + 1, x1, y, zf + D, (x, yy, z) => (x === x0 || x === x1 || z === zf + D || z === zf + 1 || (x + z) % 2 === 0 ? I[(x * 3 + z) % 3] : undefined));
    for (let x = x0; x <= x1; x++) { v.set(x, y + 7, zf + D, I[0]); v.set(x, y + 4, zf + D, I[1]); if ((x - x0) % 3 === 0 || x === x1) for (let j = 1; j < 7; j++) v.set(x, y + j, zf + D, I[2]); }
    for (const x of [x0, x1]) for (let z = zf + 1; z <= zf + D; z++) { v.set(x, y + 7, z, I[0]); v.set(x, y + 4, z, I[1]); if ((z - zf) % 3 === 0) for (let j = 1; j < 7; j++) v.set(x, y + j, z, I[2]); }
    if (h3(x0, y, n) < 0.3) v.set(x0 + 2 + (n % 3), y + 4, zf + D, RU);
    if (n + 1 < levels.length) {                        // a steep stair up to the next level
      const y1 = levels[n + 1], rise = y1 - y, run = Math.ceil(rise / 2), right = n % 2 === 0;
      const xs = right ? x0 + 2 : x1 - 2, dir = right ? 1 : -1;
      for (let s = 0; s <= run; s++) {
        const x = xs + dir * s, yy = y + Math.min(rise, s * 2);
        for (const z of [zf + 2, zf + 5]) { v.set(x, yy, z, I[0]); v.set(x, yy + 1, z, I[0]); }
        if (s % 1 === 0) for (let z = zf + 3; z <= zf + 4; z++) v.set(x, yy, z, I[1]);
        v.set(x, yy + 7, zf + 5, I[2]);
      }
    }
  });
  if (o.ladder !== false) {
    const y = levels[0], lx = o.ladderX ?? (x1 - 4), yb = o.drop ?? (y - 16);
    for (let yy = yb; yy < y; yy++) { v.set(lx, yy, zf + D - 1, I[0]); v.set(lx + 3, yy, zf + D - 1, I[0]); if ((yy - yb) % 2 === 0) for (let x = lx + 1; x <= lx + 2; x++) v.set(x, yy, zf + D - 1, I[1]); }
  }
}
// a striped fabric awning sloping out from the wall, with a scalloped valance and side cheeks
export function awning(k, o) {
  const v = k.v, { x0, x1, y, zf, D = 9, drop = 5, cols = ['#c8322e', '#efe6d4'], sw = 3 } = o;
  const A = cols.map((c) => one(k, c)), AD = cols.map((c) => one(k, o.dark?.[0] || c));
  const hAt = (dz) => y - Math.round((drop * (dz - 1)) / Math.max(1, D - 1));
  for (let dz = 1; dz <= D; dz++) {
    const yy = hAt(dz), yp = dz > 1 ? hAt(dz - 1) : yy;
    for (let x = x0; x <= x1; x++) { const c = A[Math.floor((x - x0) / sw) % A.length]; for (let q = yy; q <= Math.max(yy, yp - 1); q++) v.set(x, q, zf + dz, c); }
  }
  const ye = hAt(D);
  for (let x = x0; x <= x1; x++) { const c = A[Math.floor((x - x0) / sw) % A.length]; for (let j = 1; j <= 3; j++) if (!(j === 3 && (x - x0) % 3 === 1)) v.set(x, ye - j, zf + D, c); }
  for (const x of [x0, x1]) for (let dz = 1; dz <= D; dz++) { const yy = hAt(dz); for (let q = yy - 3; q < yy; q++) if (q >= ye - 3) v.set(x, q, zf + dz, A[0]); }
  return { front: zf + D + 1, ye: ye - 3, y };
}
// a small pent roof of green glazed tile along a facade (red fascia, gold tile ends,
// upturned ends, red brackets beneath).
export function tileEave(k, o) {
  const v = k.v, { x0, x1, y, zf, D = 7, rise = 4, lift = 3 } = o, T = many(k, o.tile || C.tile), TD = one(k, o.tileD || C.tileD), GD = many(k, C.gold), R = many(k, C.red), EG = one(k, C.edge);
  const W = x1 - x0, LR = Math.min(10, W / 3);
  for (let x = x0; x <= x1; x++) {
    const e = Math.min(x - x0, x1 - x), u = Math.min(1, e / LR), up = Math.round(lift * (1 - u) * (1 - u));
    let prev = null;
    for (let dz = 0; dz <= D; dz++) {
      const t = 1 - dz / D, h = Math.round(y + rise * Math.pow(t, 1.6)) + up, lo = prev === null ? h - 1 : Math.min(h - 1, prev);
      for (let yy = lo; yy <= h; yy++) v.set(x, yy, zf + 1 + dz, yy < h ? (yy === lo ? R[0] : TD) : dz === D ? (x % 3 === 1 ? GD[0] : EG) : x % 3 === 0 ? TD : x % 3 === 1 ? T[1] : T[2]);
      prev = h;
    }
    if (e === 0) v.set(x, Math.round(y) + up + 1, zf + 1 + D, GD[1]);
    if (o.brackets !== false && (x - x0) % 6 === 3) for (let dz = 1; dz <= Math.min(3, D - 2); dz++) v.set(x, y - 1 - (3 - dz), zf + dz, R[1]);
  }
  bx(k, x0, y + rise + 1, zf + 1, x1, y + rise + 1, zf + 1, TD);
}
// a rolling steel shutter in an opening (front plane zf), raised by `open` (0..1), with its housing
export function shutter(k, o) {
  const v = k.v, { x0, x1, y0, y1, zf, open = 0 } = o, S = many(k, o.cols || ['#8e9296', '#a2a6aa', '#7c8084']);
  const yb = Math.round(y1 - (1 - open) * (y1 - y0));
  for (let y = yb; y <= y1; y++) for (let x = x0; x <= x1; x++) v.set(x, y, zf, y === yb ? one(k, '#4a4c50') : S[(y - yb) % 3 === 0 ? 2 : (y % 2)]);
  bx(k, x0 - 1, y1 + 1, zf, x1 + 1, y1 + 3, zf + 1, S[1]);
  for (const x of [x0 - 1, x1 + 1]) bx(k, x, y0, zf, x, y1, zf, S[2]);
  return yb;
}

// ------------------------------------------------------------ rooftops
export function waterTank(k, x, y, z, o = {}) {
  const v = k.v, r = o.r || 6, h = o.h || 12, leg = o.leg || 7, I = many(k, C.iron), W = many(k, ['#7e6a56', '#8a7660', '#6e5c4a', '#96826a']), HP = one(k, '#3a3a40');
  for (const [dx, dz] of [[-r + 1, -r + 1], [r - 1, -r + 1], [-r + 1, r - 1], [r - 1, r - 1]]) bx(k, x + dx, y, z + dz, x + dx, y + leg - 1, z + dz, I[0]);
  for (const dz of [-r + 1, r - 1]) for (let i = 0; i < leg; i++) v.set(x - r + 1 + Math.round(((2 * r - 2) * i) / leg), y + i, z + dz, I[1]);
  bx(k, x - r, y + leg, z - r, x + r, y + leg, z + r, (xx, yy, zz) => ((xx + zz) % 3 === 0 || Math.abs(xx - x) === r || Math.abs(zz - z) === r ? I[1] : undefined));
  cylY(v, x, z, r, y + leg + 1, y + leg + h, (xx, yy, zz, d, a) => ((yy - y - leg) % 4 === 2 ? HP : W[Math.floor(((a + Math.PI) / (Math.PI * 2)) * 40) % 4]));
  for (let j = 0; j <= r; j++) cylY(v, x, z, r + 1 - j, y + leg + h + 1 + Math.floor(j * 0.6), y + leg + h + 1 + Math.floor(j * 0.6), (xx, yy, zz, d, a) => W[(Math.floor(a * 6) + 8) % 2 + 2]);
  for (let yy = y + leg + 1; yy <= y + leg + h; yy++) v.set(x + r + 1, yy, z, I[2]);
  for (let yy = y + leg + 1; yy <= y + leg + h; yy += 2) v.set(x + r + 1, yy, z + 1, I[2]);
}
export function condenser(k, x, y, z, o = {}) {
  const v = k.v, w = o.w || 7, d = o.d || 6, h = o.h || 5, S = many(k, ['#bdbcb4', '#c8c7bf', '#b2b1a9']), G = one(k, '#55565a'), F = one(k, '#2e2f33');
  bx(k, x, y, z, x + w - 1, y + h - 1, z + d - 1, (xx, yy, zz) => ((xx === x || xx === x + w - 1 || zz === z || zz === z + d - 1) && yy < y + h - 1 && yy > y && (yy % 2 === 0) ? G : S[(xx + yy + zz) % 3]));
  cylY(v, x + (w - 1) / 2, z + (d - 1) / 2, Math.min(w, d) / 2 - 1, y + h - 1, y + h - 1, (xx, yy, zz, dd) => (dd < 0.8 ? S[0] : F));
}
// a roof hatch hut with a door and a little tar roof
export function roofHut(k, x0, y, z0, x1, z1, wall) {
  bx(k, x0, y, z0, x1, y + 16, z1, wall);
  bx(k, x0 - 1, y + 17, z0 - 1, x1 + 1, y + 17, z1 + 1, one(k, '#4a4a50'));
  bx(k, x0 + 2, y, z1, x0 + 7, y + 13, z1, one(k, '#5a4a3e'));
  k.set(x0 + 6, y + 6, z1 + 1, 'chrome');
}

// ------------------------------------------------------------ street & plaza furniture
export function chessTable(k, x, y, z) {
  const v = k.v, GR = many(k, C.granite), T = one(k, '#b8b2a6'), TE = one(k, '#9e988c');
  bx(k, x - 1, y, z - 1, x + 1, y + 4, z + 1, (xx, yy, zz) => pickH(GR, xx, yy, zz));
  bx(k, x - 2, y, z - 2, x + 2, y, z + 2, GR[2]);
  cylY(v, x, z, 4.6, y + 5, y + 5, (xx, yy, zz, d) => (d > 3.9 ? TE : T));
  for (const [dx, dz] of [[-7, 0], [7, 0], [0, -7], [0, 7]]) cylY(v, x + dx, z + dz, 1.7, y, y + 3, (xx, yy, zz, d) => (yy === y + 3 ? T : pickH(GR, xx, yy, zz)));
  return [x + 0.5, y + 6, z + 0.5];
}
export function newsBoxes(k, x, y, z, cols = ['#c8302c', '#2e5a9c', '#e8b830', '#2e7a4a']) {
  const v = k.v, M = one(k, '#3a3a40');
  cols.forEach((c, i) => {
    const X = x + i * 4, B = one(k, c), BD = one(k, shade(c, -0.25)), G = one(k, '#9ab0c0');
    bx(k, X + 1, y, z + 1, X + 2, y + 2, z + 2, M);
    bx(k, X, y + 3, z, X + 3, y + 8, z + 3, (xx, yy, zz) => (zz === z + 3 && yy >= y + 5 && yy <= y + 7 && xx > X && xx < X + 3 ? G : yy === y + 8 ? BD : B));
    v.set(X + 1, y + 4, z + 4, M);
  });
}
export function trashCan(k, x, y, z) {
  const v = k.v, G = many(k, ['#2e4a3a', '#34523f', '#283f32']), L = one(k, '#1f3329');
  cylY(v, x, z, 1.9, y, y + 6, (xx, yy, zz) => (yy === y + 5 ? L : G[(xx + yy) % 3]));
  cylY(v, x, z, 1.4, y + 7, y + 7, L);
  v.set(Math.round(x), y + 5, Math.round(z + 2), one(k, '#121a16'));
}
export function bench(k, x, y, z, len = 16, o = {}) {
  const v = k.v, W = many(k, o.wood || ['#8a5a36', '#965f3a', '#7c5030']), I = one(k, o.iron || '#2a3a32');
  for (const ex of [x, x + len - 1]) { bx(k, ex, y, z - 2, ex, y + 3, z - 2, I); bx(k, ex, y, z + 1, ex, y + 3, z + 1, I); bx(k, ex, y + 4, z + 1, ex, y + 7, z + 1, I); }
  bx(k, x, y + 3, z - 2, x + len - 1, y + 3, z + 1, (xx, yy, zz) => (zz === z ? undefined : W[(xx >> 2) % 3]));
  bx(k, x, y + 5, z + 1, x + len - 1, y + 5, z + 1, W[1]); bx(k, x, y + 7, z + 1, x + len - 1, y + 7, z + 1, W[0]);
}
// a delivery van parked along x (front toward +x when dir > 0)
export function van(k, x, y, z, o = {}) {
  const v = k.v, L = 44, Wd = 15, dir = o.dir || 1, B = one(k, o.col || '#eceae4'), BD = one(k, shade(o.col || '#eceae4', -0.15)), ST = one(k, o.stripe || '#c8302c');
  const G = many(k, 'glass'), T = many(k, 'tire'), CH = many(k, 'chrome');
  const P = (i, h, w, c) => v.set(x + (dir > 0 ? i : L - 1 - i), y + h, z + w, c);
  for (let i = 0; i < L; i++) for (let w = 0; w < Wd; w++) {
    const cab = i >= L - 10, side = w === 0 || w === Wd - 1;
    const topH = cab ? (i >= L - 3 ? 9 : i >= L - 6 ? 14 : 16) : 19;
    for (let h = 2; h <= topH; h++) {
      let c = h === 2 ? BD : B;
      if (!cab && side && (h === 9 || h === 10)) c = ST;
      if (cab && h >= 11 && h <= topH - 1 && (side || i >= L - 6)) c = G[(i + h) % 2];
      if (cab && i >= L - 6 && i < L - 3 && h >= 9 && h < 14 && !side) c = G[0];
      if (i === 0 && h >= 4 && h <= 17 && !side && w % 7 === 0) c = BD;
      P(i, h, w, c);
    }
  }
  for (const fx of [7, L - 8]) for (const w of [0, Wd - 1]) for (let dx = -2; dx <= 2; dx++) for (let h = 0; h <= 4; h++) { if (Math.abs(dx) === 2 && (h === 0 || h === 4)) continue; P(fx + dx, h, w, dx === 0 && h === 2 ? CH[0] : T[(dx + h) & 1]); }
  for (let w = 1; w < Wd - 1; w++) { P(L - 1, 3, w, CH[0]); P(0, 3, w, CH[1]); }
  for (const w of [1, 2, Wd - 3, Wd - 2]) { P(L - 1, 6, w, one(k, '#fff6d8')); P(0, 6, w, one(k, '#d8342c')); }
  return { side: z + Wd, roof: y + 20 };
}
export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((q) => Math.max(0, Math.min(255, Math.round(f < 0 ? q * (1 + f) : q + (255 - q) * f))));
  return '#' + c.map((q) => q.toString(16).padStart(2, '0')).join('');
}

// ============================================================ painted decals
// Pixel-art painters for the 2D layer: each returns paint(p, W, H) for decal().
// Every CJK string used is listed in SIGN_TEXT so prepare() can load its glyphs.
export const SIGN_TEXT = '天下為公金龍酒家菜單燒鴨叉燒炒麵雲吞點心月滿餅家仁和堂中藥玉蓮珠寶銀雲茶樓福德廟旭日生果幸運餅玉門禮品中華百貨華埠禮品都板街萬事如意四季平安福星高照花開富貴金星茶太極吉屋出租中秋節麻雀月光音樂會蛋撻菠蘿包月餅特價新鮮酒店牙科旅行社功夫麻雀館宴會廳';

// CJK text fitted and centred in a box (renders, measures the ink, shrinks until it fits)
export function fit(p, str, bx, by, bw, bh, col, o = {}) {
  const n = [...str].length, vert = !!o.vertical;
  let size = Math.floor((vert ? Math.min(bw, bh / n) : Math.min(bh, bw / n)) * (o.k ?? 1.05));
  for (let t = 0; t < 8 && size >= 5; t++) {
    const gap = o.gap ?? Math.max(1, Math.round(size * 0.12)), pad = 6 + (o.ow || 1) * 2;
    const S = newSurf(Math.ceil(vert ? size * 1.7 : (size * 1.5 + gap) * n) + pad * 2, Math.ceil(vert ? (size * 1.5 + gap) * n : size * 1.8) + pad * 2), q = new Pen(S);
    glyphs(q, str, pad, pad, size, col, { font: o.font || 'serif', vertical: vert, gap, outline: o.outline, outline2: o.outline2, ow: o.ow, shadow: o.shadow, bevel: o.bevel });
    const b = S.bounds(); if (!b) return null;
    const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1;
    if (w > bw || h > bh) { size = Math.floor(size * Math.min(0.94, bw / w, bh / h)); continue; }
    p.put(S, Math.round(bx + (bw - w) / 2 - b.x0), Math.round(by + (bh - h) / 2 - b.y0));
    return { w, h, size };
  }
  return null;
}
// shaded round blob lit from the upper left: T = [dark, mid, light, highlight]
function blob(p, cx, cy, rx, ry, T, rim = true) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const u = (x - cx) / rx, w = (y - cy) / ry, d = u * u + w * w; if (d > 1) continue;
    const l = -u * 0.6 - w * 0.75 + (1 - d) * 0.5;
    p.px(x, y, rim && d > 0.78 ? T[0] : l > 0.95 ? T[3] : l > 0.35 ? T[2] : l > -0.3 ? T[1] : T[0]);
  }
}
const glare = (p, W, H, n = 2) => { for (let i = 0; i < n; i++) { const x0 = Math.round(W * (0.15 + i * 0.45)); for (let y = 0; y < H; y++) for (let d = 0; d < 3 + i; d++) { const x = x0 + d - Math.round(y * 0.6); if (x >= 0 && x < W) p.blend(x, y, '#ffffff', 0.13); } } };
const small = (p, str, x, y, c, o = {}) => p.text(str, x, y, c, o);

export const P = {
  // a framed horizontal shop board: big CJK name, English below
  board: (o) => (p, W, H) => {
    const bg = o.bg, fr = o.frame || '#d8a83a', tx = o.text || '#f6d060', dk = shift(bg, -2.2);
    p.rect(0, 0, W, H, dk); p.rect(1, 1, W - 2, H - 2, fr);
    p.hl(1, W - 2, 1, shift(fr, 0.8)); p.vl(1, 1, H - 2, shift(fr, 0.5)); p.hl(1, W - 2, H - 2, shift(fr, -0.9)); p.vl(W - 2, 1, H - 2, shift(fr, -0.7));
    p.rect(3, 3, W - 6, H - 6, bg);
    for (let y = 4; y < H - 4; y++) for (let x = 4; x < W - 4; x++) if ((x * 7 + y * 13) % 29 === 0) p.px(x, y, o.bg2 || shift(bg, 0.4));
    p.frame(5, 5, W - 10, H - 10, shift(fr, -0.6));
    for (const [cx, cy, sx, sy] of [[7, 7, 1, 1], [W - 8, 7, -1, 1], [7, H - 8, 1, -1], [W - 8, H - 8, -1, -1]]) for (let i = 0; i < 3; i++) { p.px(cx + sx * i, cy, fr); p.px(cx, cy + sy * i, fr); }
    const en = o.en, sc = en ? (p.textW(en, { scale: 2 }) <= W - 24 && H >= 54 ? 2 : 1) : 0, enH = en ? 7 * sc + 4 : 0;
    const side = o.small ? 10 : Math.round(W * 0.06);
    fit(p, o.cjk, side, 7, W - side * 2, H - 13 - enH, tx, { outline: dk, font: 'serif', bevel: false });
    if (en) small(p, en, Math.floor(W / 2), H - 7 - 7 * sc, o.en2 || tx, { align: 'center', scale: sc, shadow: dk });
    if (o.dragon) for (const [x0, dir] of [[10, 1], [W - 11, -1]]) for (let i = 0; i < 14; i++) { const x = x0 + dir * i, y = Math.round(H / 2 - 4 + Math.sin(i * 0.9) * 3); p.px(x, y, fr); p.px(x, y + 1, shift(fr, -0.5)); }
  },
  // vertical signboard with stacked characters
  vboard: (o) => (p, W, H) => {
    const bg = o.bg, fr = o.frame || '#d8a83a', dk = shift(bg, -2.2);
    p.rect(0, 0, W, H, dk); p.rect(1, 1, W - 2, H - 2, fr); p.rect(3, 3, W - 6, H - 6, bg); p.frame(4, 4, W - 8, H - 8, shift(fr, -0.6));
    fit(p, o.cjk, 5, 6, W - 10, H - 12, o.col, { vertical: true, outline: o.outline || dk, font: o.font || 'serif' });
  },
  // vertical neon: dark box, white-hot tubes with coloured halo
  vneon: (o) => (p, W, H) => {
    p.rect(0, 0, W, H, '#1c1416'); p.frame(1, 1, W - 2, H - 2, o.edge); p.frame(3, 3, W - 6, H - 6, shift(o.edge, -1.4));
    fit(p, o.cjk, 5, 6, W - 10, H - 12, '#fff6dc', { vertical: true, outline: o.col, outline2: shift(o.col, -1.2), ow: 1 });
  },
  plaque: (o) => (p, W, H) => {
    const bg = o.bg, gd = '#e8b83a';
    p.rect(0, 0, W, H, '#6a4a14'); p.rect(1, 1, W - 2, H - 2, gd); p.hl(1, W - 2, 1, '#fff0a0'); p.hl(1, W - 2, H - 2, '#9a6a1a');
    p.rect(3, 3, W - 6, H - 6, bg); p.frame(5, 5, W - 10, H - 10, '#c8962c');
    for (let x = 8; x < W - 8; x += 6) { p.px(x, 3, '#fff0a0'); p.px(x, H - 4, '#9a6a1a'); }
    fit(p, o.cjk, 8, 6, W - 16, H - 12, gd, { outline: shift(bg, -1.5), font: 'serif' });
  },
  couplet: (o) => (p, W, H) => {
    p.rect(0, 0, W, H, '#4a0c10'); p.rect(1, 1, W - 2, H - 2, '#b8222a'); p.frame(2, 2, W - 4, H - 4, '#e0a838');
    fit(p, o.cjk, 3, 5, W - 6, H - 10, '#f8d460', { vertical: true, outline: '#5a0e12', font: 'serif' });
  },
  fu: (o) => (p, W, H) => {
    const cx = (W - 1) / 2, cy = (H - 1) / 2, r = Math.min(W, H) / 2 - 0.5;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = o.round ? Math.hypot(x - cx, y - cy) / r : (Math.abs(x - cx) + Math.abs(y - cy)) / r;
      if (d <= 1) p.px(x, y, d > 0.86 ? '#e8b83a' : d > 0.8 ? '#7a1418' : '#c8242c');
    }
    fit(p, '福', W * 0.22, H * 0.22, W * 0.56, H * 0.56, o.round ? '#f6d060' : '#1e1414', { outline: o.round ? '#6a1014' : undefined, font: 'serif' });
  },
  menu: (o) => (p, W, H) => {
    p.rect(0, 0, W, H, '#2a1e18'); p.frame(0, 0, W, H, '#c8962c'); p.frame(2, 2, W - 4, H - 4, '#6a4a2a');
    fit(p, o.title, 4, 4, W - 8, 14, '#f6d060', { font: 'serif' });
    p.hl(6, W - 7, 19, '#c8962c');
    o.lines.forEach((ln, i) => { const [cj, ...en] = ln.split(' '), y = 23 + i * 11; fit(p, cj, 4, y, 20, 10, '#f0e0c0', { font: 'pixel' }); small(p, en.join(' '), 26, y + 2, '#e8c070', { mini: true }); p.px(W - 6, y + 4, '#c84a3a'); });
  },
  ducks: () => (p, W, H) => {
    p.vgrad(0, 0, W, H, ['#f0b868', '#e09450', '#c87440']);
    for (let y = Math.floor(H * 0.72); y < H; y++) for (let x = 0; x < W; x++) if (x % 7 === 0 || y % 7 === 0) p.px(x, y, '#b86a3c');
    p.hl(0, W - 1, 3, '#e8e8ec'); p.hl(0, W - 1, 4, '#8a8a92');
    const D = ['#5a200c', '#8e3a14', '#c0601e', '#f0a848'];
    const n = Math.max(3, Math.floor(W / 15)), sp = (W - 8) / n;
    for (let i = 0; i < n; i++) {
      const cx = Math.round(5 + sp * (i + 0.5)), top = 6 + (i % 2) * 3;
      p.vl(cx, 4, top + 2, '#d8d8dc'); p.px(cx + 1, top + 2, '#d8d8dc');
      blob(p, cx, top + 4, 2, 2, D);                            // head
      p.rect(cx - 1, top + 5, 3, 6, D[1]); p.vl(cx - 1, top + 5, top + 10, D[2]);
      blob(p, cx, top + 18, 6.5, 9, D);                         // body
      p.line(cx - 4, top + 14, cx - 1, top + 24, D[0]); p.line(cx + 4, top + 14, cx + 2, top + 24, D[0]);
      p.px(cx - 3, top + 13, '#ffe0a0'); p.px(cx - 2, top + 12, '#ffe0a0');
      p.vl(cx - 2, top + 27, top + 30, D[1]); p.vl(cx + 2, top + 27, top + 30, D[1]);
      if (i < n - 1) { const sx = Math.round(cx + sp / 2); p.vl(sx, 4, 9, '#d8d8dc'); p.rect(sx - 1, 10, 3, 14, '#a8262a'); p.vl(sx - 1, 10, 23, '#d84a3a'); p.vl(sx + 1, 10, 23, '#6a1414'); p.px(sx, 24, '#6a1414'); }
    }
    p.rect(2, H - 8, W - 4, 5, '#d8c8a8'); p.hl(2, W - 3, H - 8, '#f0e4c8'); p.rect(W - 14, H - 12, 9, 4, '#b8bcc4'); p.rect(W - 6, H - 11, 3, 2, '#5a3a20');
    small(p, '$12', 4, H - 15, '#c8242c', { mini: true });
    glare(p, W, H);
  },
  bakery: () => (p, W, H) => {
    p.vgrad(0, 0, W, H, ['#fbf0dc', '#f2dec4', '#e8ccb0']);
    const tart = (x, y) => { blob(p, x, y, 5.5, 3.4, ['#9a5a18', '#d0902e', '#e8b04a', '#f8d070'], true); blob(p, x, y - 0.5, 3.6, 2, ['#f0c838', '#f8dc50', '#ffec80', '#fff8c0'], false); p.px(x - 2, y - 2, '#fffbe0'); p.px(x + 1, y, '#e8b030'); };
    const bun = (x, y) => { blob(p, x, y - 1, 6, 4.4, ['#a05e14', '#dc962c', '#f0b848', '#fff0a0']); for (const [dx, dy] of [[-3, -2], [-1, -3], [1, -2], [3, -1], [-2, 0], [0, -1], [2, 0]]) p.px(x + dx, y - 1 + dy, '#b8761c'); p.px(x - 2, y - 4, '#fff4b8'); };
    const cake = (x, y) => { blob(p, x, y, 5.6, 3.8, ['#5a3010', '#94541e', '#b46e2c', '#d89c4c']); p.frame(x - 3, y - 2, 7, 4, '#6a3a14'); p.px(x, y, '#e8b860'); p.px(x - 1, y - 3, '#e8b860'); };
    const bao = (x, y) => { blob(p, x, y - 1, 5.4, 4, ['#c4bcac', '#e8e0d2', '#f6f2ea', '#ffffff']); p.px(x, y - 4, '#c8402c'); p.px(x + 1, y - 3, '#c8402c'); p.px(x - 1, y - 3, '#a83020'); };
    const rows = [Math.round(H * 0.33), Math.round(H * 0.62), Math.round(H * 0.92)], kinds = [[tart, tart], [bun, bao], [cake, tart]], tags = [['蛋撻', '$1.50'], ['菠蘿包', '$2'], ['月餅', '$9']];
    rows.forEach((sy, i) => {
      p.rect(1, sy, W - 2, 2, '#d0d4dc'); p.hl(1, W - 2, sy + 2, '#8a8e98');
      const [a, b] = kinds[i];
      for (let x = 9; x < W - 8; x += 14) a(x, sy - 4);
      if (i < 2) for (let x = 16; x < W - 8; x += 14) b(x, sy - 11);
      const tx = W - 30; p.rect(tx, sy - 25 + (i === 2 ? 8 : 0), 27, 11, '#fffaf0'); p.frame(tx, sy - 25 + (i === 2 ? 8 : 0), 27, 11, '#c8364a');
      fit(p, tags[i][0], tx + 1, sy - 24 + (i === 2 ? 8 : 0), 15, 9, '#c8364a', { font: 'pixel' }); small(p, tags[i][1], tx + 17, sy - 22 + (i === 2 ? 8 : 0), '#3a6a5a', { mini: true });
    });
    glare(p, W, H, 3);
  },
  herbs: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#4a2e1c');
    for (let y = 2; y < H * 0.62; y += 8) for (let x = 2; x < W - 2; x += 11) {
      p.rect(x, y, 10, 7, '#7a4e2c'); p.hl(x, x + 9, y, '#9a6a3c'); p.vl(x + 9, y, y + 6, '#5a3820');
      p.rect(x + 3, y + 2, 4, 2, '#efe4c8'); p.px(x + 4, y + 2, '#c8242c'); p.px(x + 5, y + 5, '#d8b440');
    }
    const cy = Math.round(H * 0.66); p.rect(0, cy, W, H - cy, '#6a4024'); p.hl(0, W - 1, cy, '#a8784a');
    const jar = (x, c) => { p.rect(x, cy - 12, 8, 12, '#c8dce4'); p.rect(x + 1, cy - 8, 6, 7, c); p.rect(x + 1, cy - 14, 6, 2, '#c8302c'); p.vl(x + 1, cy - 11, cy - 2, '#ffffff'); };
    ['#a86a3a', '#d8b860', '#8a2a1e', '#5a6a2a', '#c89a6a', '#e8d8b8'].forEach((c, i) => { const x = 3 + i * Math.floor((W - 8) / 6); if (x + 8 < W) jar(x, c); });
    for (let i = 0; i < 3; i++) { const x = 6 + i * 22; if (x + 14 < W) { p.rect(x, cy + 4, 16, 6, '#d8c8a0'); p.line(x + 2, cy + 7, x + 13, cy + 5, '#c8a870'); p.line(x + 3, cy + 5, x + 12, cy + 8, '#b89058'); } }
    glare(p, W, H);
  },
  jewels: () => (p, W, H) => {
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) p.px(x, y, x % 6 < 2 ? '#7a1420' : x % 6 < 4 ? '#8e1a26' : '#a0222e');
    for (let i = 0; i < 4; i++) {
      const x = 6 + i * Math.floor((W - 10) / 4), y = 8;
      p.ell(x + 5, y + 6, 4, 5, '#1a1418'); p.rect(x + 1, y + 10, 9, H * 0.4, '#1a1418');
      for (let t = 0; t < 12; t++) { const a = (t / 11) * Math.PI; p.px(Math.round(x + 5 + Math.cos(a) * 4), Math.round(y + 12 + Math.sin(a) * 6), t % 2 ? '#f8d860' : '#c8962c'); }
      p.px(x + 5, y + 18, '#3ac87a'); p.px(x + 5, y + 19, '#2a9a5a');
    }
    const ty = Math.round(H * 0.7); p.rect(0, ty, W, H - ty, '#2a1a1a'); p.hl(0, W - 1, ty, '#c8962c');
    for (let x = 6; x < W - 6; x += 9) { p.ell(x, ty + 6, 3.5, 2.2, '#2fae6a'); p.ell(x, ty + 6, 2, 1, '#2a1a1a'); p.px(x - 2, ty + 5, '#a8f0c8'); }
    for (let i = 0; i < 10; i++) { const x = (i * 37) % W, y = (i * 23) % Math.round(H * 0.6) + 4; p.px(x, y, '#ffffff'); p.px(x - 1, y, '#fff0b0'); p.px(x + 1, y, '#fff0b0'); p.px(x, y - 1, '#fff0b0'); p.px(x, y + 1, '#fff0b0'); }
    glare(p, W, H);
  },
  dimsum: () => (p, W, H) => {
    p.vgrad(0, 0, W, H, ['#b8282c', '#a02226', '#7a1a1e']);
    for (let x = 4; x < W - 4; x += 7) { p.rect(x, 3, 4, 18, '#d83a30'); p.vl(x, 3, 20, '#f05a40'); fit(p, '點心', x, 4, 4, 15, '#f8e070', { vertical: true, font: 'pixel', k: 1.2 }); }
    for (let x = 10; x < W; x += 24) { p.vl(x, 0, 24, '#3a2a20'); blob(p, x, 27, 4, 2.5, ['#c8962c', '#f0c040', '#fff0a0', '#ffffff']); }
    const ty = Math.round(H * 0.68);
    for (let x = 14; x < W; x += 30) { p.ell(x, ty, 12, 4, '#f4f0e8'); p.rect(x - 12, ty, 25, 9, '#ece6da'); p.hl(x - 12, x + 12, ty + 8, '#c8c0b0'); for (const dx of [-15, 15]) p.rect(x + dx - 1, ty - 6, 3, 14, '#6a1a1a'); }
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++) { const x = 4 + j * 9 + i * 4, y = H - 6 - i * 5; p.rect(x, y, 9, 5, '#b88a4a'); p.hl(x, x + 8, y, '#e0b870'); p.hl(x, x + 8, y + 2, '#8a6030'); }
    glare(p, W, H);
  },
  teaWin: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#3a2418');
    const tins = ['#c8302c', '#2e7a4a', '#e8b830', '#2e5a9c', '#8a2a6a', '#e86a2a'];
    for (let s = 0; s < 3; s++) { const y = 6 + s * Math.floor(H / 3.3); p.hl(0, W - 1, y + 13, '#8a5a34'); p.hl(0, W - 1, y + 14, '#5a3820');
      for (let x = 3, i = s; x < W - 7; x += 9, i++) { const c = tins[i % tins.length]; if ((i + s) % 4 === 3) { blob(p, x + 3, y + 9, 4, 3.5, ['#4a2414', '#7a3e22', '#9a5432', '#c87a4a']); p.rect(x + 7, y + 7, 2, 2, '#7a3e22'); p.px(x + 3, y + 5, '#4a2414'); } else { p.rect(x, y + 2, 7, 11, c); p.vl(x, y + 2, y + 12, shift(c, 0.6)); p.vl(x + 6, y + 2, y + 12, shift(c, -0.8)); p.rect(x, y + 1, 7, 1, '#d8b440'); p.rect(x + 1, y + 6, 5, 3, '#f4ecd8'); } } }
    small(p, 'TEA', W - 16, H - 9, '#f6d060', { scale: 1 });
    glare(p, W, H);
  },
  gifts: () => (p, W, H) => {
    p.vgrad(0, 0, W, H, ['#8a2a24', '#7a2420', '#6a1e1c']);
    for (let i = 0; i < 4; i++) { const cx = 10 + i * Math.floor((W - 16) / 4), cy = 14; for (let a = 0; a <= 10; a++) { const t = Math.PI + (a / 10) * Math.PI; p.line(cx, cy, Math.round(cx + Math.cos(t) * 9), Math.round(cy + Math.sin(t) * 9), a % 2 ? ['#f0c040', '#e8e4dc', '#3a8a6a', '#e86a8a'][i] : shift(['#f0c040', '#e8e4dc', '#3a8a6a', '#e86a8a'][i], -0.8)); } p.px(cx, cy, '#3a2a1a'); }
    for (let i = 0; i < 5; i++) { const x = 6 + i * Math.floor((W - 10) / 5), y = 30; p.vl(x + 3, y - 4, y, '#d8b440'); blob(p, x + 3, y + 4, 3, 3.5, ['#7a1418', '#c8242c', '#e8483a', '#ffa080']); p.rect(x + 1, y, 5, 1, '#d8b440'); p.rect(x + 1, y + 8, 5, 1, '#d8b440'); p.vl(x + 3, y + 9, y + 12, '#e8b83a'); }
    const ry = Math.round(H * 0.62);
    for (let i = 0; i < 4; i++) { const x = 4 + i * 14, c = ['#c8242c', '#2e5a9c', '#e8b830', '#2e7a4a'][i]; if (x + 11 > W) break; p.rect(x, ry, 11, H - ry - 3, c); p.rect(x + 4, ry, 3, 3, shift(c, -0.8)); for (let y = ry + 4; y < H - 4; y += 3) p.px(x + 5, y, '#f0d060'); }
    const cx = W - 20; if (cx > 50) { p.rect(cx, H - 14, 16, 8, '#a8262a'); p.rect(cx, H - 18, 16, 4, '#f0e4c8'); p.rect(cx + 1, H - 17, 3, 2, '#5a8ab0'); p.rect(cx + 6, H - 17, 3, 2, '#5a8ab0'); p.rect(cx + 11, H - 17, 3, 2, '#5a8ab0'); p.px(cx + 3, H - 6, '#222'); p.px(cx + 12, H - 6, '#222'); }
    glare(p, W, H);
  },
  bazaar: () => (p, W, H) => {
    p.vgrad(0, 0, W, H, ['#e8dcc4', '#d8c8a8', '#c8b490']);
    const vase = (x, y, h, c) => { for (let j = 0; j < h; j++) { const t = j / h, r = Math.round(2 + Math.sin(t * Math.PI) * 4 - (t < 0.15 ? 2 : 0)); p.hl(x - r, x + r, y + j, j % 4 === 1 ? '#f4f0e8' : c); p.px(x - r, y + j, shift(c, 0.8)); } };
    vase(10, H - 26, 22, '#2e5a9c'); vase(W - 12, H - 30, 26, '#2e5a9c');
    for (let i = 0; i < 3; i++) { const x = 22 + i * 14, c = ['#c8242c', '#e8b830', '#2e7a6a'][i]; if (x + 11 > W - 22) break; p.rect(x, 10, 11, H - 22, c); p.rect(x + 3, 10, 5, 4, shift(c, -0.8)); for (let y = 16; y < H - 14; y += 4) p.px(x + 5, y, '#f8e070'); p.hl(x, x + 10, H - 13, shift(c, -0.6)); }
    p.rect(Math.round(W / 2) - 16, 2, 32, 9, '#c8242c'); small(p, 'SALE 50%', Math.round(W / 2), 3, '#fff2c0', { align: 'center', mini: true });
    glare(p, W, H);
  },
  ghost: () => (p, W, H) => {
    p.rect(4, 4, W - 8, H - 8, '#d8cdb8'); p.frame(4, 4, W - 8, H - 8, '#a83a2c'); p.frame(6, 6, W - 12, H - 12, '#a83a2c');
    fit(p, '金星茶', 10, 9, W - 20, Math.round(H * 0.5), '#a83a2c', { font: 'serif' });
    small(p, 'GOLDEN STAR TEA', Math.floor(W / 2), Math.round(H * 0.66), '#3a3a6a', { align: 'center', scale: W > 150 ? 2 : 1 });
    small(p, 'EST. 1912', Math.floor(W / 2), Math.round(H * 0.84), '#a83a2c', { align: 'center' });
    // weathering: flaked patches let the wall show through
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const n = Math.sin(x * 0.21 + y * 0.07) + Math.sin(y * 0.33 - x * 0.05) + ((x * 7919 + y * 104729) % 97) / 60; if (n > 1.55) p.s.data[y * W + x] = 0; else if (n > 1.2) p.blend(x, y, '#e8dcc8', 0.5); }
  },
  mural: () => (p, W, H) => {
    p.vgrad(0, 0, W, H, ['#2e5a98', '#4a7ab4', '#7aa6cc']);
    for (let i = 0; i < 6; i++) { const cx = 8 + (i * 41) % (W - 16), cy = 12 + (i * 29) % (H - 30); for (let a = 0; a < 4; a++) p.ell(cx + a * 5 - 6, cy - (a % 2) * 2, 5, 3, '#e6eef4'); p.hl(cx - 9, cx + 12, cy + 3, '#b8cadc'); for (let a = 0; a < 3; a++) p.px(cx - 6 + a * 6, cy - 4, '#ffffff'); }
    const N = 260, pts = []; for (let i = 0; i <= N; i++) { const t = i / N; pts.push([W * (0.06 + t * 0.74), H * (0.62 + Math.sin(t * Math.PI * 2.2 + 0.4) * 0.2 - t * 0.18), 6.5 - t * 3.5]); }
    for (const [x, y, r] of pts) p.ell(x, y, r + 1, r + 1, '#14402a');
    for (const [x, y, r] of pts) p.ell(x, y, r, r, '#2a8a4a');
    for (let i = 0; i < pts.length; i += 2) { const [x, y, r] = pts[i]; p.px(Math.round(x), Math.round(y - r * 0.5), '#5ab06a'); p.px(Math.round(x), Math.round(y + r * 0.55), '#e8c040'); if (i % 8 === 0) { p.px(Math.round(x), Math.round(y - r - 1), '#c8302c'); p.px(Math.round(x + 1), Math.round(y - r - 2), '#e8502c'); } if (i % 10 === 4) for (let s2 = -1; s2 <= 1; s2++) p.px(Math.round(x + s2), Math.round(y - 1), '#1f6a3a'); }
    for (const k2 of [60, 150]) { const [x, y, r] = pts[k2]; p.line(x, y + r, x - 3, y + r + 6, '#2a8a4a'); p.line(x - 3, y + r + 6, x - 6, y + r + 7, '#e8c040'); p.line(x - 3, y + r + 6, x - 1, y + r + 8, '#e8c040'); }
    const [hx, hy] = pts[pts.length - 1];
    blob(p, hx + 5, hy - 2, 8, 6.5, ['#14402a', '#2a8a4a', '#4aaa5a', '#9ad87a']);
    p.rect(hx + 9, hy, 9, 4, '#2a8a4a'); p.hl(hx + 9, hx + 17, hy + 3, '#f4f0e8'); p.hl(hx + 10, hx + 16, hy + 5, '#c8302c'); p.px(hx + 18, hy, '#14402a');
    p.px(hx + 7, hy - 5, '#fff6c0'); p.px(hx + 8, hy - 5, '#1a1a1a'); p.px(hx + 8, hy - 6, '#1a1a1a');
    p.line(hx + 1, hy - 7, hx - 6, hy - 15, '#e8c040'); p.line(hx + 4, hy - 7, hx + 2, hy - 16, '#e8c040');
    p.line(hx + 16, hy + 4, hx + 26, hy + 11, '#e8c040'); p.line(hx + 16, hy, hx + 28, hy - 4, '#e8c040');
    for (let i = 0; i < 6; i++) p.line(hx - 2, hy - 3 + i, hx - 8 - i, hy + 2 + i * 2, i % 2 ? '#c8302c' : '#e8502c');
    blob(p, hx + 28, hy - 14, 4.5, 4.5, ['#c8302c', '#e85a2a', '#f8a040', '#fff0b0']);
    for (let i = 0; i < 4; i++) p.line(hx + 26 + i, hy - 18, hx + 24 + i * 2, hy - 24 - (i % 2) * 2, i % 2 ? '#f8a040' : '#e8502c');
  },
  notice: () => (p, W, H) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.px(x, y, (x * 13 + y * 7) % 11 < 2 ? '#a07848' : (x + y * 3) % 7 === 0 ? '#c8a070' : '#b88c5c');
    p.frame(0, 0, W, H, '#5a3a22'); p.frame(1, 1, W - 2, H - 2, '#7a5032');
    const pin = (x, y, c = '#d83a3a') => { p.px(x, y, c); p.px(x, y + 1, '#5a3a22'); };
    const L = P.league(), M = P.concert();
    const lw = Math.round(H * 0.68), lh = H - 8; const S1 = newSurf(lw, lh); L(new Pen(S1), lw, lh); p.put(S1, 4, 4); pin(4 + lw / 2, 4);
    const mw = Math.round(H * 0.62), mh = H - 14; const S2 = newSurf(mw, mh); M(new Pen(S2), mw, mh); p.put(S2, 8 + lw, 8); pin(8 + lw + mw / 2, 8);
    let x = 12 + lw + mw;
    const flyers = [['#f4f0e4', '太極', 'TAI CHI 7AM', '#c8242c'], ['#f0d860', '吉屋出租', 'ROOM 4 RENT', '#2a2a2a'], ['#e8f0f8', '中秋節', 'MOON FEST', '#2e5a9c'], ['#f8e0e8', '麻雀', 'MAHJONG', '#8a2a4a']];
    flyers.forEach(([bg, cj, en, ink], i) => {
      const fw = 26, fh = 30 + (i % 2) * 6, y = 5 + (i % 2) * 8 + (i > 1 ? 0 : 0); if (x + fw > W - 3) return;
      p.rect(x, y, fw, fh, bg); p.frame(x, y, fw, fh, shift(bg, -0.6));
      fit(p, cj, x + 2, y + 2, fw - 4, 12, ink, { font: 'pixel' });
      small(p, en, x + fw / 2, y + 16, ink, { mini: true, align: 'center' });
      if (cj === '吉屋出租') for (let t = 0; t < 6; t++) { p.vl(x + 2 + t * 4, y + fh - 8, y + fh - 1, '#c8b040'); p.vl(x + 3 + t * 4, y + fh - 7, y + fh - 2, '#3a3a3a'); }
      else for (let l = 0; l < 3; l++) p.hl(x + 3, x + fw - 4, y + 23 + l * 3, shift(bg, -0.7));
      pin(x + fw / 2, y);
      x += fw + 3;
    });
  },
  // the League battle poster: navy, lightning split, VS, title
  league: () => (p, W, H) => {
    p.vgrad(0, 0, W, H, ['#141a3a', '#1e2a5a', '#2a1a4a']);
    for (let y = 0; y < H; y++) { const sx = Math.round(W / 2 + Math.sin(y * 0.4) * 3 + (y % 7 < 3 ? 2 : -2)); for (let x = 0; x < W; x++) if (x < sx - 1) p.blend(x, y, '#e8302c', 0.35); else if (x > sx + 1) p.blend(x, y, '#2a8ae8', 0.35); else p.px(x, y, '#fff6a0'); }
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, r0 = W * 0.18, r1 = W * 0.42; p.line(Math.round(W / 2 + Math.cos(a) * r0), Math.round(H * 0.45 + Math.sin(a) * r0), Math.round(W / 2 + Math.cos(a) * r1), Math.round(H * 0.45 + Math.sin(a) * r1), i % 2 ? '#fff6a0' : '#f0c040'); }
    const cx = Math.round(W / 2), cy = Math.round(H * 0.45), r = Math.round(W * 0.17);
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = Math.abs(x) / r + Math.max(0, y) / r; if (y < -r * 0.6 || d > 1) continue; p.px(cx + x, cy + y, d > 0.8 ? '#8a6a14' : x < 0 ? '#f0c040' : '#d8a028'); }
    for (const [dx, dy] of [[0, -2], [-1, -1], [0, -1], [1, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [1, 1], [-1, 2], [1, 2]]) p.px(cx + dx, cy - 1 + dy, '#c8242c');
    const big = W >= 52, mini = !big;
    small(p, 'VS', cx, cy + r + 3, '#ffffff', { align: 'center', outline: '#141a3a', mini: W < 40 });
    p.rect(0, 2, W, big ? 9 : 7, '#f0c040'); small(p, 'TOKONMON', cx, 3, '#141a3a', { align: 'center', mini });
    p.rect(0, big ? 11 : 9, W, 7, '#141a3a'); small(p, 'LEAGUE', cx, big ? 12 : 10, '#f0c040', { align: 'center', mini: true });
    small(p, W >= 50 ? 'BATTLE NIGHT' : 'BATTLE', cx, H - 17, '#ffffff', { align: 'center', mini: true });
    small(p, 'SAT 7PM', cx, H - 11, '#f0c040', { align: 'center', mini: true });
    p.frame(0, 0, W, H, '#f0c040');
  },
  concert: () => (p, W, H) => {
    p.vgrad(0, 0, W, H, ['#3a1a5a', '#8a2a7a', '#e86a7a']);
    blob(p, W * 0.66, H * 0.3, W * 0.2, W * 0.2, ['#e8c890', '#f8e0b0', '#fff2d0', '#ffffff'], false);
    for (let i = 0; i < 5; i++) { const x = 4 + i * Math.floor((W - 6) / 5); p.vl(x + 2, 0, 5 + (i % 2) * 3, '#3a1a1a'); blob(p, x + 2, 9 + (i % 2) * 3, 2.5, 3, ['#7a1418', '#d8342c', '#ff7050', '#ffd0a0']); }
    fit(p, '月光音樂會', 3, Math.round(H * 0.5), W - 6, Math.round(H * 0.16), '#fff2d0', { font: 'pixel', outline: '#3a1a5a' });
    small(p, 'MOONLIGHT', W / 2, Math.round(H * 0.7), '#ffffff', { align: 'center', mini: true });
    small(p, 'CONCERT', W / 2, Math.round(H * 0.7) + 6, '#ffffff', { align: 'center', mini: true });
    small(p, 'FRI 8PM', W / 2, H - 8, '#3a1a5a', { align: 'center', mini: true });
    p.frame(0, 0, W, H, '#f8e0b0');
  },
  streetSign: (en, cj) => (p, W, H) => {
    p.rect(0, 0, W, H, '#1f6a3a'); p.frame(0, 0, W, H, '#f4f4ec');
    small(p, en, 3, Math.round((H - 7) / 2), '#f4f4ec', {});
    fit(p, cj, W - Math.round(W * 0.34), 2, Math.round(W * 0.32) - 2, H - 4, '#f4f4ec', { font: 'pixel' });
  },
  xiangqi: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#e0c88a'); p.frame(0, 0, W, H, '#8a6a3a');
    const x0 = 4, y0 = 3, dx = (W - 8) / 8, dy = (H - 6) / 9, L = '#6a4a24';
    for (let i = 0; i <= 8; i++) { const x = Math.round(x0 + i * dx); p.vl(x, y0, Math.round(y0 + 4 * dy), L); p.vl(x, Math.round(y0 + 5 * dy), Math.round(y0 + 9 * dy), L); }
    p.vl(x0, y0, Math.round(y0 + 9 * dy), L); p.vl(Math.round(x0 + 8 * dx), y0, Math.round(y0 + 9 * dy), L);
    for (let j = 0; j <= 9; j++) p.hl(x0, Math.round(x0 + 8 * dx), Math.round(y0 + j * dy), L);
    for (const yy of [0, 7]) { p.line(Math.round(x0 + 3 * dx), Math.round(y0 + yy * dy), Math.round(x0 + 5 * dx), Math.round(y0 + (yy + 2) * dy), L); p.line(Math.round(x0 + 5 * dx), Math.round(y0 + yy * dy), Math.round(x0 + 3 * dx), Math.round(y0 + (yy + 2) * dy), L); }
    const piece = (i, j, red) => { const x = Math.round(x0 + i * dx), y = Math.round(y0 + j * dy); p.ell(x, y, 2, 2, '#f4e8c8'); p.frame(x - 1, y - 1, 3, 3, red ? '#c8242c' : '#222222'); p.px(x, y, red ? '#c8242c' : '#222222'); };
    for (const i of [0, 1, 2, 3, 4, 5, 6, 7, 8]) { if (i % 2 === 0) { piece(i, 3, true); piece(i, 6, false); } }
    for (const [i, j] of [[0, 0], [2, 0], [4, 0], [6, 1], [8, 0], [1, 2], [7, 2]]) piece(i, j, true);
    for (const [i, j] of [[0, 9], [3, 9], [4, 9], [8, 9], [1, 7], [5, 5], [7, 8]]) piece(i, j, false);
  },
  carBand: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#ecdcac'); p.hl(0, W - 1, 0, '#d8a838'); p.hl(0, W - 1, H - 1, '#b88a2a');
    small(p, 'CALIFORNIA ST.', Math.floor(W / 2), Math.floor((H - 7) / 2), '#7c1a20', { align: 'center' });
  },
  carDest: () => (p, W, H) => { p.rect(0, 0, W, H, '#141414'); small(p, 'CALIFORNIA', Math.floor(W / 2), 2, '#f4f0d8', { align: 'center', mini: true }); small(p, 'VAN NESS', Math.floor(W / 2), H - 7, '#f0c040', { align: 'center', mini: true }); },
  // gold leaf lettering on an upper-floor window (transparent between the strokes)
  winText: (o) => (p, W, H) => {
    const en = o.en ? 9 : 0;
    fit(p, o.cjk, 3, 3, W - 6, H - 6 - en, o.col || '#f0c848', { vertical: true, outline: '#3a2a10', font: 'serif' });
    if (o.en) { p.rect(1, H - en - 1, W - 2, en, '#1a1410'); small(p, o.en, Math.floor(W / 2), H - en + 1, o.col || '#f0c848', { align: 'center', mini: true }); }
  },
  openSign: () => (p, W, H) => { p.rect(0, 0, W, H, '#14101a'); p.frame(0, 0, W, H, '#3a8aff'); small(p, 'OPEN', Math.floor(W / 2), Math.floor((H - 5) / 2), '#ff3a4a', { align: 'center', mini: true }); },
  chalk: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#2a2e2a'); p.frame(0, 0, W, H, '#8a5a36'); p.frame(1, 1, W - 2, H - 2, '#6a4428');
    fit(p, '蛋撻', 3, 3, W - 6, 11, '#f4f0e0', { font: 'pixel' });
    small(p, 'EGG', Math.floor(W / 2), 16, '#f8d860', { align: 'center', mini: true }); small(p, 'TARTS', Math.floor(W / 2), 22, '#f8d860', { align: 'center', mini: true });
    small(p, '$1.50', Math.floor(W / 2), 30, '#ff9aa8', { align: 'center', mini: true });
    for (let x = 4; x < W - 4; x += 3) p.px(x, H - 5, '#e8e4d8');
  },
  tag: (txt, bg = '#fff6d8', ink = '#c8242c') => (p, W, H) => { p.rect(0, 0, W, H, bg); p.frame(0, 0, W, H, ink); small(p, txt, Math.floor(W / 2), Math.floor((H - 5) / 2), ink, { align: 'center', mini: true }); },
};

// ------------------------------------------------------------ California Street cable car (runs along z)
// (x, y, z): left side, rail top + 1, front end. Open grip sections at both ends with
// outward-facing benches and brass poles, an enclosed saloon in the middle, a clerestory roof.
export function cableCar(k, x, y, z, o = {}) {
  const v = k.v, L = 66, W = 20, night = o.night;
  const M = one(k, '#7c1a20'), M2 = one(k, '#8e2228'), CR = one(k, '#ecdcac'), CR2 = one(k, '#d8c490'), GD = one(k, '#d8a838'), WD = one(k, '#8a5a36'), WD2 = one(k, '#6e4428');
  const RF = one(k, '#3a3634'), RF2 = one(k, '#4a4643'), BR = one(k, '#d8b850'), UF = one(k, '#241e1c'), WH = one(k, '#1a1a1c'), STEEL = one(k, '#8a8e94');
  const GL = (i, h) => (night ? one(k, (i + h) % 4 ? '#ffd890' : '#ffe8b8', GLOW) : (i - h + 99) % 7 < 2 ? one(k, '#8ea6c0') : one(k, '#3a4a64'));
  const P = (i, h, w, c) => v.set(x + w, y + h, z + i, c);
  const open = (i) => i < 15 || i > L - 16;
  for (let i = 0; i < L; i++) {
    const endTaper = i < 2 || i > L - 3 ? 1 : 0;
    for (let w = endTaper; w < W - endTaper; w++) { P(i, 3, w, UF); P(i, 4, w, i % 3 === 0 ? WD2 : WD); }
    for (const w of [0, W - 1]) {
      if (open(i)) { P(i, 5, w, M); P(i, 6, w, CR); if (i % 4 === 0 || i === 14 || i === L - 15) for (let h = 7; h <= 22; h++) P(i, h, w, BR); }
      else for (let h = 5; h <= 22; h++) P(i, h, w, h <= 6 ? M : h === 7 ? CR : h <= 11 ? ((i - 15) % 6 === 0 ? CR2 : M2) : h <= 20 ? ((i - 15) % 6 === 0 || h === 20 || h === 12 ? WD : GL(i, h)) : CR);
    }
    if (open(i)) for (const [w0, w1, wb] of [[1, 3, 3], [W - 4, W - 2, W - 4]]) { for (let w = w0; w <= w1; w++) P(i, 9, w, WD); for (let h = 10; h <= 13; h++) P(i, h, wb, WD2); for (let h = 5; h <= 8; h++) if (i % 5 === 2) P(i, h, wb, WD2); }
    else if (i === 15 || i === L - 16) for (let w = 1; w < W - 1; w++) for (let h = 5; h <= 22; h++) P(i, h, w, w >= 7 && w <= 12 && h <= 19 ? (h < 6 ? WD : (w === 7 || w === 12 || h === 19 ? WD : GL(w, h))) : h <= 11 ? M2 : h <= 20 ? (w % 5 === 1 ? WD : GL(w + i, h)) : CR);
    // roof: overhanging, rounded at the ends, clerestory in the middle
    const rw = i < 1 || i > L - 2 ? 2 : 0;
    for (let w = -1 + rw; w <= W - rw; w++) { P(i, 23, w, w === -1 || w === W ? RF2 : RF); }
    if (i > 5 && i < L - 6) for (let w = 5; w <= W - 6; w++) { P(i, 24, w, RF2); P(i, 25, w, (w === 5 || w === W - 6) && i % 3 ? (night ? one(k, '#ffd890', GLOW) : CR2) : RF); }
  }
  // end bulkheads: dash panel, headlight, destination box, steps
  for (const [i, s] of [[0, 1], [L - 1, -1]]) {
    for (let w = 1; w < W - 1; w++) for (let h = 5; h <= 9; h++) P(i, h, w, h === 9 ? CR : M);
    for (let w = 6; w <= 13; w++) for (let h = 19; h <= 22; h++) P(i - s, h, w, h === 19 || h === 22 || w === 6 || w === 13 ? WD2 : one(k, '#1a1a1a'));
    P(i, 8, 9, night ? one(k, '#fff6d8', GLOW) : one(k, '#f4f0e0')); P(i, 8, 10, night ? one(k, '#fff6d8', GLOW) : one(k, '#f4f0e0'));
    for (let w = 0; w < W; w++) P(i + s, 4, w, STEEL);
  }
  // running gear: wheels over the rails, the grip lever in the front section
  for (const ic of [9, L - 10]) for (const w of [5, 14]) for (let di = -2; di <= 2; di++) for (let h = 0; h <= 3; h++) if (Math.abs(di) + Math.abs(h - 1.5) < 3.2) P(ic + di, h, w, WH);
  for (let h = 5; h <= 15; h++) P(8, h, 9, one(k, '#3a3a3e')); P(8, 16, 9, BR);
  return { sign: [[x, y + 20, z + 16, z + L - 17, 'w'], [x + W - 1, y + 20, z + 16, z + L - 17, 'e']], ends: [[x + 6, y + 19, z - 1], [x + 6, y + 19, z + L]], L, W };
}

// ------------------------------------------------------------ lantern cards (saturated night glow)
function lanternPx(p, W, H, c, lit, o = {}) {
  const cx = (W - 1) / 2, top = 2, bot = H - 4, cy = (top + bot) / 2, ry = (bot - top) / 2 + 0.5, rx = W / 2, tall = o.tall;
  p.rect(Math.round(cx) - 1, 0, 3, 1, '#2a2020');
  for (let y = top; y <= bot; y++) for (let x = 0; x < W; x++) {
    const u = (x - cx) / rx, v = (y - cy) / ry, d = tall ? Math.max(u * u * 1.15, v * v * v * v) : u * u + v * v; if (d > 1) continue;
    const rib = (y - top) % 3 === 0 && y !== top;
    let col;
    if (lit) { const g = 1 - Math.sqrt(d); col = rib ? (g > 0.4 ? '#e8501c' : '#a8180e') : g > 0.78 ? '#ffd47a' : g > 0.55 ? '#ff8a2a' : g > 0.3 ? (o.hot || '#ff4a1a') : g > 0.1 ? '#e0200e' : '#9a120a'; }
    else { const l = -u * 0.65 - v * 0.6; col = rib ? shift(c, -0.9) : l > 0.55 ? shift(c, 0.9) : l > 0.05 ? c : l > -0.5 ? shift(c, -0.45) : shift(c, -0.9); }
    p.px(x, y, col);
  }
  const gold = lit ? '#ffd860' : '#d8a830', goldD = lit ? '#e0a030' : '#9a7020';
  p.rect(Math.round(cx) - 2, top - 1, 5, 2, gold); p.px(Math.round(cx) + 2, top, goldD);
  p.rect(Math.round(cx) - 2, bot, 5, 2, gold); p.px(Math.round(cx) + 2, bot + 1, goldD);
  for (let y = bot + 2; y < H; y++) { p.px(Math.round(cx), y, lit ? '#ffd040' : '#e8b830'); if (y > bot + 2) p.px(Math.round(cx) - 1 + ((y & 1) * 2), y, goldD); }
}
export function lanternCards() {
  const mk = (name, W, H, c, o = {}) => { const d = sprite('ct-' + name, W, H, (p) => lanternPx(p, W, H, c, false, o), { ppm: 22 }), n = sprite('ct-' + name + '-lit', W, H, (p) => lanternPx(p, W, H, c, true, o), { ppm: 22 }); spriteInfo(d).night = n; return d; };
  return { small: [mk('red', 11, 15, '#d8302c'), mk('orange', 11, 15, '#e8582a', { hot: '#ff6a1a' })], big: [mk('bigred', 17, 22, '#d02a2c'), mk('biggold', 17, 22, '#e8a02a', { hot: '#ff8a1a' })], tall: mk('tall', 10, 20, '#d02a2c', { tall: true }) };
}
