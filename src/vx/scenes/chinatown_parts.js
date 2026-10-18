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

export const C = {
  tile: ['#2f7c4d', '#378857', '#2a7246', '#43966a'], tileD: '#1f5838', ridge: '#1c4a31', ridgeHi: '#2f704a', edge: '#215a3a',
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
        if (d === 0) c = along % 2 ? GD[0] : EG;
        else if (hip) c = RG;
        else c = along % 2 === 0 ? TD : (d % 3 === 0 ? T[2] : pickH(T, x, yy, z));
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
      for (let yy = lo; yy <= h; yy++) v.set(x, yy, zf + 1 + dz, yy < h ? (yy === lo ? R[0] : TD) : dz === D ? (x % 2 ? GD[0] : EG) : x % 2 === 0 ? TD : pickH(T, x, yy, dz));
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
  for (const bx of [x, x + len - 1]) { bx(k, bx, y, z - 2, bx, y + 3, z - 2, I); bx(k, bx, y, z + 1, bx, y + 3, z + 1, I); bx(k, bx, y + 4, z + 1, bx, y + 7, z + 1, I); }
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
