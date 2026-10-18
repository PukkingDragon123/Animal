// Shared parts for the Guns N' Roses street-pigeon line: Pidgun ♂ (pidgun.js) and ♀
// (pidrose.js) → Jungeon ♂ / ♀ (jungeon.js, jungeon_rose.js) → Paradove (paradove.js).
//  · plumage painted as one lit form across the stepped boxes (shingled feathers, clean bands),
//    the iridescent green-to-violet neck, the slate wing with two black bars and dark primaries,
//    the banded tail, coral legs, the dark beak with its white cere,
//  · sharp orange-red pigeon eyes (never cute: lids cut across the iris, dot pupils),
//  · props: the antique six-shooter (nickel, engraved, ivory grips with a rose inlay) and the
//    long-stemmed rose; bandana prints, leather and chrome studs, chain links,
//  · particles: pigeon feathers, bread crumbs, rose petals, muzzle flash, gun smoke,
//  · motion: planted feet, the head-bob (thrust and hold) and the strut.
import { defineFx } from '../fx.js';
import { E, seg, bump, wave } from '../anim.js';
import { poly, dith, shift, mix, h2 } from './kit.js';

export const D2R = Math.PI / 180;
export const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const memoS = new Map(), memoM = new Map();
// cached hue-shifted shade / mix (painters call these per texel)
export const sh = (c, k) => { const key = c + k; let v = memoS.get(key); if (v === undefined) { v = shift(c, k); memoS.set(key, v); } return v; };
export const mx = (a, b, t) => { const key = a + b + t; let v = memoM.get(key); if (v === undefined) { v = mix(a, b, t); memoM.set(key, v); } return v; };

// ---------------------------------------------------------------- colours
export const C = {
  ink: '#1a1626',
  // feral-pigeon slate, light → dark
  slate: ['#e2e6ee', '#c0c6d5', '#a0a8bd', '#838ba4', '#666d88'],
  belly: ['#cdd2de', '#adb4c6', '#9097ae', '#757c96', '#5a607a'],
  pale: ['#f6f7fa', '#e0e3ea', '#c2c7d4', '#9ea4b8', '#7c8298'],
  covert: ['#eef1f6', '#d6dbe5', '#b9c0cf', '#9aa2b7', '#7d849b'],
  bar: ['#4a4c60', '#323446', '#22232f', '#16161f'],
  prim: ['#a0a6bc', '#80869f', '#646a84', '#4b506a', '#363a52'],
  head: ['#b0b7cc', '#9097b0', '#767d98', '#5f6580', '#4a4f68'],
  // the neck's sheen, each [lit, base, shade]: green → teal → violet → magenta
  irG: ['#a6f6c8', '#46d092', '#20926e'],
  irT: ['#92ecec', '#2fb2b4', '#1c727e'],
  irV: ['#d4aaf6', '#9258d0', '#5c3496'],
  irM: ['#f8a2e0', '#c84cae', '#80287a'],
  leg: ['#ffc0b0', '#f6828a', '#d85466', '#a43450', '#6c2034'],
  claw: '#2a2028',
  beak: ['#8e8898', '#605a6c', '#433e4e', '#2c2834', '#1c1922'],
  cere: ['#ffffff', '#f4f0ec', '#dcd4d4', '#b6acb2'],
  iris: { rim: '#a8221a', out: '#f04a1e', mid: '#ff7a24', core: '#ffbe46', pupil: '#120608' },
  red: ['#ff7a68', '#ec3440', '#bc1c32', '#7e1026', '#4c0a1c'],                 // bandana
  leather: ['#7a7690', '#4c485c', '#322e3e', '#211e2a', '#13111a'],
  chrome: ['#ffffff', '#dfe6f4', '#aab4d0', '#5c6488', '#7c86aa', '#9aa4c4'],
  nickel: ['#ffffff', '#e6e9f0', '#bcc1cf', '#7e8498', '#565c72', '#9aa0b4'],
  blued: ['#a8b4d8', '#6a789e', '#465274', '#2c3450', '#1a1f34'],
  brass: ['#fff4b8', '#ffd660', '#e0a032', '#a86c1c', '#6a420e'],
  ivory: ['#fffcf2', '#f4ead6', '#dccdae', '#b8a684', '#8a7658'],
  rose: ['#ff8a92', '#ff4054', '#dc1634', '#a00c28', '#62061c', '#3a0412'],
  leaf: ['#b4e67a', '#6cbc4c', '#3e8c3a', '#24602e', '#14401e'],
};

// ---------------------------------------------------------------- painting core
const nrm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
export const LIT = nrm([-0.16, 0.9, 0.38]);
// the model-space point under texel (i, j) of face f of cube c (handles `mirror`; rotated cubes in their own frame)
export function at(c, f, i, j, w, h) {
  let u = (i + 0.5) / w; const v = (j + 0.5) / h;
  if (c.mirror) { u = 1 - u; if (f === 'east') f = 'west'; else if (f === 'west') f = 'east'; }
  const [ox, oy, oz] = c.o, [sx, sy, sz] = c.s;
  switch (f) {
    case 'south': return [ox + u * sx, oy + sy * (1 - v), oz + sz];
    case 'north': return [ox + sx * (1 - u), oy + sy * (1 - v), oz];
    case 'east': return [ox + sx, oy + sy * (1 - v), oz + sz * (1 - u)];
    case 'west': return [ox, oy + sy * (1 - v), oz + sz * u];
    case 'up': return [ox + u * sx, oy + sy, oz + sz * v];
    case 'down': return [ox + u * sx, oy, oz + sz * (1 - v)];
    default:
  }
  if (c.plane === 'x') return [ox, oy + sy * (1 - v), oz + sz * u];
  if (c.plane === 'y') return [ox + u * sx, oy, oz + sz * v];
  return [ox + u * sx, oy + sy * (1 - v), oz];
}
// texel coordinates of a model point in its face's plane: A runs across (left → right as seen), B runs down
// (on the up face B runs front → back, so feathers shingle backward along the back)
const T3 = (v) => Math.floor(v * 3 + 1e-4);
export function texAB(q, face, c) {
  switch (face) {
    case 'south': return [T3(q[0]), T3(-q[1])];
    case 'north': return [T3(-q[0]), T3(-q[1])];
    case 'east': return [T3(-q[2]), T3(-q[1])];
    case 'west': return [T3(q[2]), T3(-q[1])];
    case 'up': return [T3(q[0]), T3(-q[2])];
    case 'down': return [T3(q[0]), T3(q[2])];
    default:
  }
  if (c && c.plane === 'x') return [T3(q[2]), T3(-q[1])];
  if (c && c.plane === 'y') return [T3(q[0]), T3(q[2])];
  return [T3(q[0]), T3(-q[1])];
}
// the normal of an ellipsoid (centre O, radii R) pitched nose-up by `pitch` degrees, at point q
export function ellN(q, O, R, pitch = 0) {
  let x = q[0] - O[0], y = q[1] - O[1], z = q[2] - O[2];
  const a = pitch * D2R, ca = Math.cos(a), sa = Math.sin(a);
  if (pitch) { const y2 = y * ca - z * sa, z2 = y * sa + z * ca; y = y2; z = z2; }
  const nx = x / (R[0] * R[0]); let ny = y / (R[1] * R[1]), nz = z / (R[2] * R[2]);
  if (pitch) { const y2 = ny * ca + nz * sa, z2 = -ny * sa + nz * ca; ny = y2; nz = z2; }
  return nrm([nx, ny, nz]);
}
// light bands: ramps run light → dark; l is the lit term n·LIT
export const THR = [0.8, 0.42, -0.12, -0.58];
export const bandI = (l, n = 5, thr = THR) => { let k = 0; while (k < n - 1 && k < thr.length && l <= thr[k]) k++; return k; };
// paint boxes as parts of one lit form: fn(l, q, n, i, j, face, cube, w, h) → colour (0 = transparent)
export const form = (O, R, pitch, fn) => (p, w, h, face, c) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h), n = ellN(q, O, R, pitch);
    const col = fn(n[0] * LIT[0] + n[1] * LIT[1] + n[2] * LIT[2], q, n, i, j, face, c, w, h);
    if (col !== undefined && col !== null) p.px(i, j, col);
  }
};
// shingled feathers: which part of a feather texel (A, B) lies on. Rows overlap the row beneath
// like roof tiles. 0 plain, 1 dark rim (lower edge), 2 shade (above the rim), 3 lit (upper left)
export function shingle(A, B, S = 8, RH = 5) {
  const b = Math.floor(B / RH);
  for (const r of [b, b + 1]) {
    const off = (r & 1) * (S >> 1), xr = A - off, xx = xr - Math.floor(xr / S) * S;
    const u = ((xx + 0.5) / S) * 2 - 1, yy = B - (r - 1) * RH, bottom = RH + Math.sqrt(Math.max(0, 1 - u * u)) * S * 0.42;
    if (r === b && yy > bottom) continue;          // below the upper row's lobe: the next row shows
    if (yy > bottom - 1.15) return 1;
    if (yy > bottom - 2.2 && u > 0.1) return 2;
    if (u < -0.55 && yy < bottom - 2) return 3;
    return 0;
  }
  return 0;
}
// a feathered texel: the lit band of the ramp, plus the feather's rim / shade / lit edge
export function featherCol(cols, l, A, B, S = 8, RH = 5, face = 'south') {
  const n = cols.length, k = bandI(l, n);
  if (face === 'down') return cols[Math.min(n - 1, k + 1)];
  const s = shingle(A, B, S, RH);
  if (s === 1) return mx(cols[k], cols[Math.min(n - 1, k + 1)], 0.75);
  if (s === 2) return mx(cols[k], cols[Math.min(n - 1, k + 1)], 0.3);
  if (s === 3) return k > 0 ? mx(cols[k], cols[k - 1], 0.5) : cols[0];
  return cols[k];
}
// iridescent sheen: t 0 → 1 runs green → teal → violet → magenta, dithered where hues meet
export function sheen(t, l, x, y) {
  const H = [C.irG, C.irT, C.irV, C.irM], s = clamp(t) * 3, i = Math.min(2, Math.floor(s)), f = s - i;
  const k = l > 0.55 ? 0 : l > -0.15 ? 1 : 2;
  return dith(H[i][k], H[i + 1][k], clamp((f - 0.35) / 0.3), x, y);
}
// plumage over a lit form. o: { O, R, pitch, cols, S, RH, region(q, face, n, l, A, B, cube) → colour | undefined }
export function plumage(o) {
  const cols = o.cols || C.slate, S = o.S || 8, RH = o.RH || 5;
  return form(o.O, o.R, o.pitch || 0, (l, q, n, i, j, face, c) => {
    const [A, B] = texAB(q, face, c);
    if (o.region) { const r = o.region(q, face, n, l, A, B, c); if (r !== undefined) return r; }
    return featherCol(cols, l, A, B, S, RH, face);
  });
}
// the neck: small glossy feathers, green at the nape fading to violet and magenta at the crop;
// the sheen slides toward violet where the form turns away. o: { O, R, yTop, yBot, cols (above), below }
export function neckP(o) {
  return form(o.O, o.R, 0, (l, q, n, i, j, face, c) => {
    const [A, B] = texAB(q, face, c);
    if (o.region) { const r = o.region(q, face, n, l, A, B, c); if (r !== undefined) return r; }
    const t = (o.yTop - q[1]) / (o.yTop - o.yBot) + Math.abs(n[0]) * 0.28 - Math.max(0, n[2]) * 0.1;
    if (t < -0.05) return featherCol(o.cols || C.head, l, A, B, 6, 4, face);
    if (t > 1.15) return featherCol(o.below || C.slate, l, A, B, 8, 5, face);
    if (face === 'down') return C.irV[2];
    const s = shingle(A, B, 5, 3), base = sheen(t, l - (s === 1 ? 0.7 : s === 2 ? 0.3 : 0), A, B);
    return s === 3 ? sheen(t, 1, A, B) : base;
  });
}

// ---------------------------------------------------------------- wings, tail, legs
const FACE_N = { south: [0, 0, 1], north: [0, 0, -1], east: [1, 0, 0], west: [-1, 0, 0], up: [0, 1, 0], down: [0, -1, 0] };
const faceLit = (face) => { const n = FACE_N[face]; return n ? n[0] * LIT[0] + n[1] * LIT[1] + n[2] * LIT[2] : 0.3; };
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// a wing segment painted along its span, so it reads the same folded along the body or hanging like an arm.
// o: { base (the leading edge at the root), dir (unit, along the span), len, cdir (unit, across the chord), chord,
//      kind: 'arm' (scapulars, light coverts, two black bars) | 'hand' (long dark primaries split at the tip),
//      sleeve(along, across, face) → a colour (clothes) }
export function wingSegP(o) {
  const cov = o.covert || C.covert, pr = o.prim || C.prim, sl = o.slate || C.slate;
  const b1 = o.bar1 ?? 0.5, b2 = o.bar2 ?? 0.72, bw = o.barW ?? 0.1;
  return (p, w, h, face, c) => {
    const fl = faceLit(face), fk = fl > 0.6 ? 0 : fl > 0.15 ? 1 : fl > -0.25 ? 2 : 3;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const q = at(c, face, i, j, w, h), d = [q[0] - o.base[0], q[1] - o.base[1], q[2] - o.base[2]];
      const along = dot3(d, o.dir) / o.len, across = dot3(d, o.cdir) / o.chord;
      if (o.sleeve) { const s = o.sleeve(along, across, face, q); if (s !== undefined) { p.px(i, j, s); continue; } }
      const A = Math.floor(across * o.chord * 3), B = Math.floor(along * o.len * 3);
      const k = Math.min(4, fk + (across > 0.72 ? 1 : 0));
      let col;
      if (o.kind === 'hand') {
        // primaries: lanes along the span, a dark shaft line, the lit leading edge, notched tips
        const lane = 5, a = ((A % lane) + lane) % lane, tipLen = o.len * 3 * (1 - along);
        col = pr[Math.min(4, k + 1 + (along > 0.55 ? 1 : 0))];
        if (a === 0) col = pr[Math.max(0, k)];
        if (a === lane - 1) col = pr[Math.min(4, k + 2)];
        if (across < 0.12) col = pr[Math.max(0, k - 1)];
        if (tipLen < 3) { const dd = Math.abs(a - 2); if (tipLen < dd) col = 0; else if (tipLen < dd + 1) col = pr[4]; }
      } else {
        const t = along + across * 0.06;
        if (across < 0.16 || along < 0.1) col = featherCol(sl, 0.75 - k * 0.38, A, B, 6, 4);
        else if (t > b1 && t < b1 + bw) col = C.bar[Math.min(3, (k > 1 ? 1 : 0) + (A % 4 === 0 ? 1 : 0))];
        else if (t > b2 && t < b2 + bw) col = C.bar[Math.min(3, (k > 1 ? 1 : 0) + (A % 4 === 0 ? 1 : 0))];
        else if (t > b2 + bw) col = featherCol(sl, 0.5 - k * 0.38, A, B, 7, 5);
        else col = featherCol(cov, 0.8 - k * 0.38, A, B, 6, 4);
        if (c.s && face !== 'up' && face !== 'down' && along > 0.97) col = cov[Math.min(4, k + 2)];
      }
      p.px(i, j, col);
    }
  };
}
// a folded wing along the body side (s −1 right, +1 left): shoulder at (x, y, z), the arm segment and the hand
// running back. Returns { arm, hand, wrist } cube lists for two bones
export function foldedWing(s, sh0, o = {}) {
  const [x, y, z] = sh0, ax = s < 0 ? x - 1.6 : x, armLen = o.arm ?? 8.6, chord = o.chord ?? 6.6, handLen = o.hand ?? 9.6, hc = o.hchord ?? 5.0;
  const arm = wingSegP({ base: [x, y + 0.6, z + 0.4], dir: [0, 0, -1], len: armLen, cdir: [0, -1, 0], chord, kind: 'arm', sleeve: o.sleeve });
  const hand = wingSegP({ base: [x, y - 0.4, z - armLen + 0.4], dir: [0, 0, -1], len: handLen, cdir: [0, -1, 0], chord: hc, kind: 'hand' });
  return {
    arm: [P([ax, y + 0.6 - chord, z + 0.4 - armLen], [1.6, chord, armLen], arm)],
    hand: [P([s < 0 ? x - 1.35 : x + 0.15, y - 0.4 - hc, z - armLen + 0.4 - handLen], [1.2, hc, handLen], hand)],
    wrist: [s < 0 ? x - 0.8 : x + 0.8, y - 1.2, z - armLen + 0.8],
  };
}
// toes as little boxes: three forward, one back, dark claws at the tips
const toeP = (back) => (p, w, h, face, c) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h), tip = back ? q[2] - c.o[2] : c.o[2] + c.s[2] - q[2];
    const k = face === 'up' ? 0 : face === 'down' ? 3 : (face === 'east' || face === 'north') ? 2 : 1;
    let col = C.leg[k];
    if (tip < 0.5) col = C.claw; else if (Math.floor(tip * 3) % 3 === 2 && face === 'up') col = C.leg[k + 1];
    p.px(i, j, col);
  }
};
export function footCubes(x, z, k = 1) {
  const ank = [x, 0.25, z], L = 2.9 * k, wd = 0.7 * k, ht = 0.6 * k;
  const toe = (yaw, len) => P([x - wd / 2, 0.0, z], [wd, ht, len], toeP(false), { pivot: ank, rot: [0, yaw, 0] });
  return [toe(0, L), toe(-32, L * 0.84), toe(32, L * 0.84), P([x - wd * 0.45, 0.0, z - 1.6 * k], [wd * 0.9, ht * 0.9, 1.6 * k], toeP(true))];
}
// the tail: long feathers with a black terminal band and a pale tip edge. The tail box runs along z
// (back end at z0). fan: on a 'y' plane the tip is rounded into a fan
export function tailP(o = {}) {
  const cols = o.cols || C.slate;
  return (p, w, h, face, c) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const q = at(c, face, i, j, w, h), z0 = c.o[2], along = (q[2] - z0) / c.s[2];   // 0 = tip, 1 = root
      let k = face === 'up' || face === 'plane' ? 1 : face === 'down' ? 2 : 2;
      if (face === 'up' || face === 'plane') k += along > 0.7 ? 0 : 0;
      let col = cols[k];
      const fx = Math.floor(q[0] * 3 + 100);
      if ((face === 'up' || face === 'plane' || face === 'down') && fx % 4 === 0) col = cols[Math.min(4, k + 1)];   // feather edges
      if ((face === 'up' || face === 'plane') && fx % 4 === 1) col = cols[Math.max(0, k - 1)];
      if (along < 0.26 && along > 0.08) col = C.bar[Math.min(3, (face === 'down' ? 2 : 1) + (fx % 4 === 0 ? 1 : 0))];
      if (along <= 0.08) col = cols[face === 'down' ? 3 : 2];
      if (o.fan && (face === 'up' || face === 'plane' || face === 'down')) {
        const cx = c.o[0] + c.s[0] / 2, rx = c.s[0] / 2, dx = (q[0] - cx) / rx, tip = 0.08 + dx * dx * 0.12;
        if (along < tip - 0.04) col = 0; else if (along < tip + 0.03 && fx % 4 === 2) col = 0;
      }
      if (col !== 0 && face !== 'up' && face !== 'down' && face !== 'plane' && j === 0) col = cols[0];
      p.px(i, j, col);
    }
  };
}
// coral legs with scale rings; toes on a 'y' plane (three forward, one back) with dark claws
export const legP = (p, w, h, face) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = face === 'up' ? 0 : face === 'down' ? 3 : (face === 'east' || face === 'north' ? 2 : 1);
    p.px(i, j, j % 3 === 2 && face !== 'up' && face !== 'down' ? C.leg[Math.min(4, k + 1)] : C.leg[k]);
  }
};
// feathered "trousers" at the top of the legs
export const thighP = (cols = C.belly) => (p, w, h, face) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = face === 'up' ? 0 : face === 'down' ? 3 : Math.min(4, 1 + Math.floor((j / h) * 2.2) + (face === 'east' || face === 'north' ? 1 : 0));
    let col = cols[k];
    if (face !== 'up' && face !== 'down' && j === h - 1 && i % 2) col = 0;            // fringe
    if (face !== 'up' && face !== 'down' && j === h - 2 && i % 3 === 1) col = cols[Math.min(4, k + 1)];
    p.px(i, j, col);
  }
};

// ---------------------------------------------------------------- beak and face
// the bill: dark slate with a paler, horn-coloured tip; o.z0/z1 = the bill's root and tip z
export const beakP = (z0, z1) => (p, w, h, face, c) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h), t = clamp((q[2] - z0) / (z1 - z0));
    let k = face === 'up' ? 1 : face === 'down' ? 4 : face === 'east' ? 3 : 2;
    if (t > 0.72) k = Math.max(0, k - 2);
    let col = C.beak[k];
    if (face !== 'up' && face !== 'down' && j === h - 1) col = C.beak[4];
    if (face === 'up' && t > 0.85 && i === Math.floor(w / 2)) col = C.beak[0];
    p.px(i, j, col);
  }
};
// the cere: powdery white lumps on the bill's root, a nostril slit
export const cereP = (p, w, h, face) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let k = face === 'up' ? 0 : face === 'down' ? 3 : 1 + (j > h / 2 ? 1 : 0);
    if (h2(i >> 1, j, 3) > 0.7) k = Math.max(0, k - 1); else if (h2(i, j >> 1, 5) < 0.2) k = Math.min(3, k + 1);
    p.px(i, j, C.cere[k]);
  }
  if (face === 'east' || face === 'west') { p.px(Math.floor(w * 0.6), h - 1, C.beak[3]); p.px(Math.floor(w * 0.6) + 1, h - 1, C.beak[3]); }
};
export const mouthP = (p, w, h) => { p.rect(0, 0, w, h, '#3a0c18'); p.rect(1, 0, Math.max(1, w - 2), Math.max(1, h - 1), '#5e1424'); };
export const tongueP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, x === 0 || x === w - 1 ? '#b8405a' : y === 0 ? '#ff9aac' : '#e86a82'); };

// ---------------------------------------------------------------- eyes
// pigeon eyes sit on the sides of the head, so each eye wraps round the head's front corner: a 12 × 8
// canvas, columns 0–5 on the side face (0 = back), 6–11 on the front face (11 = toward the bill). A round
// orange-red iris with an amber core and a black dot pupil (looking forward); the lid cuts straight
// across the top of the iris for the glare. Never cute: no sparkles, no blush. o.flick: eyeliner (♀)
export const EYE_W = 12, EYE_H = 8;
function eyeMask(o) {
  const cx = o.cx ?? 6.2, cy = o.cy ?? 4.3, rx = o.rx ?? 4.7, ry = o.ry ?? 3.6, M = [];
  const lid = o.lid || (() => -1), low = o.low || (() => 99);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 12; x++) {
    const X = x + 0.5, Y = y + 0.5, d = ((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2;
    M.push(d <= 1 && Y >= lid(X) && Y <= low(X));
  }
  return M;
}
function eyeDraw(p, o = {}) {
  const M = eyeMask(o), on = (x, y) => x >= 0 && y >= 0 && x < 12 && y < 8 && M[y * 12 + x];
  const pcx = o.px ?? 8.1, pcy = o.py ?? 4.5, I = o.iris || C.iris;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 12; x++) {
    if (!on(x, y)) continue;
    const edge = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1);
    if (edge) { p.px(x, y, C.ink); continue; }
    const d = Math.hypot(x + 0.5 - pcx, (y + 0.5 - pcy) * 1.1);
    p.px(x, y, d < (o.pr ?? 1.05) ? I.pupil : d < 2.0 ? I.core : d < 2.9 ? I.mid : d < 3.9 ? I.out : I.rim);
  }
  // the heavy lid: a second ink row under the cut
  if (o.heavy ?? true) for (let x = 0; x < 12; x++) { let top = -1; for (let y = 0; y < 8; y++) if (on(x, y)) { top = y; break; } if (top >= 0 && top + 1 < 8 && on(x, top + 1)) p.px(x, top + 1, C.ink); }
  if (o.flick) { p.px(1, 2, C.ink); p.px(0, 1, C.ink); p.px(2, 2, C.ink); p.px(1, 1, C.ink); }
}
export function pigeonEyes(o = {}) {
  const fl = !!o.flick, I = o.iris;
  return {
    glare: (p) => eyeDraw(p, { lid: (X) => 1.0 + X * 0.3, flick: fl, iris: I }),
    cool: (p) => eyeDraw(p, { lid: () => 3.1, py: 5.0, flick: fl, iris: I }),
    squint: (p) => eyeDraw(p, { lid: (X) => 2.4 + X * 0.2, low: () => 6.4, py: 4.7, flick: fl, iris: I }),
    wide: (p) => eyeDraw(p, { lid: () => 0.3, pr: 0.75, px: 7.4, py: 4.2, heavy: false, flick: fl, iris: I }),
    sly: (p) => eyeDraw(p, { lid: (X) => 2.2 + X * 0.16, px: 8.6, py: 5.0, flick: true, iris: I }),
    closed: (p) => { for (let x = 1; x < 12; x++) { const y = Math.round(4.6 - Math.abs(x - 6) * 0.14); p.px(x, y, C.ink); if (x > 1 && x < 11) p.px(x, y - 1, C.ink); } if (fl) { p.px(0, 3, C.ink); p.px(1, 2, C.ink); } },
    hurt: (p) => { for (let i = 0; i < 4; i++) { p.px(4 + i, 1 + i, C.ink); p.px(5 + i, 1 + i, C.ink); p.px(4 + i, 7 - i, C.ink); p.px(5 + i, 7 - i, C.ink); } p.px(9, 4, C.ink); p.px(10, 4, C.ink); },
    x: (p) => { for (let i = 0; i < 7; i++) { p.px(3 + i, i, C.ink); p.px(4 + i, i, C.ink); p.px(10 - i, i, C.ink); p.px(9 - i, i, C.ink); } },
    swirl: (p) => { for (let a = 0; a < 13; a += 0.2) { const r = a * 0.3, x = Math.round(6.4 + Math.cos(a) * r * 1.2), y = Math.round(4 + Math.sin(a) * r * 0.85); if (r < 4.2) p.px(x, y, C.ink); } },
  };
}
// one half of the eye canvas on a 6 × 8 plane (off 0: the side half, off 6: the front half)
const eyeHalf = (fn, off) => (p) => fn({ px: (x, y, c) => { if (x - off >= 0 && x - off < 6) p.px(x - off, y, c); } });
// both eyes as expression planes. o: { xs: half-width of the head (its side faces), zf: z of its front face, y: bottom of the eye, def }
export function eyeCubes(EYES, o) {
  const out = [], H = EYE_H / 3;
  for (const [k, fn] of Object.entries(EYES)) {
    const x = { id: 'eye-' + k, hide: k !== o.def }, side = eyeHalf(fn, 0), front = eyeHalf(fn, 6);
    out.push(P([-o.xs - 0.07, o.y, o.zf - 2], [0, H, 2], side, { plane: 'x', ...x }));
    out.push(P([-o.xs, o.y, o.zf + 0.07], [2, H, 0], front, { plane: 'z', ...x }));
    out.push(P([o.xs + 0.07, o.y, o.zf - 2], [0, H, 2], side, { plane: 'x', ...x }));
    out.push(P([o.xs - 2, o.y, o.zf + 0.07], [2, H, 0], front, { plane: 'z', mirror: true, ...x }));
  }
  return out;
}
export const eyeFaces = (EYES, def) => ({ default: def, states: Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eye-' + k]])) });

// ---------------------------------------------------------------- metal, leather, cloth
// polished metal: bright sky above a dark horizon band, the ground reflected below; `from`/`to` = the
// slice of the whole piece this box covers (0 top, 1 bottom) so stacked boxes read as one form
export function metalP(cols, o = {}) {
  const f0 = o.from ?? 0, f1 = o.to ?? 1;
  return (p, w, h, face, c) => {
    if (face === 'up') { p.rect(0, 0, w, h, f0 < 0.3 ? cols[0] : cols[1]); if (w > 2) for (let j = 0; j < h; j++) p.px(0, j, cols[1]); }
    else if (face === 'down') p.rect(0, 0, w, h, cols[3]);
    else for (let y = 0; y < h; y++) {
      const t = f0 + (f1 - f0) * (h > 1 ? y / (h - 1) : 0.5);
      const col = t < 0.18 ? cols[0] : t < 0.42 ? cols[1] : t < 0.6 ? cols[3] : t < 0.82 ? cols[4] : cols[5] || cols[2];
      for (let x = 0; x < w; x++) p.px(x, y, (face === 'east' || face === 'north') && t > 0.18 ? sh(col, -0.25) : col);
    }
    if (o.after) o.after(p, w, h, face, c);
  };
}
// a domed chrome stud (3 × 3 texels) at x, y
export function stud(p, x, y, cols = C.chrome) { p.px(x, y, cols[1]); p.px(x + 1, y, '#ffffff'); p.px(x + 2, y, cols[2]); p.px(x, y + 1, cols[2]); p.px(x + 1, y + 1, cols[1]); p.px(x + 2, y + 1, cols[3]); p.px(x, y + 2, cols[3]); p.px(x + 1, y + 2, cols[3]); p.px(x + 2, y + 2, '#2a2e44'); }
// a small pyramid stud (2 × 2)
export function stud2(p, x, y) { p.px(x, y, '#ffffff'); p.px(x + 1, y, C.chrome[2]); p.px(x, y + 1, C.chrome[2]); p.px(x + 1, y + 1, C.chrome[3]); }
// black leather: soft top-lit bands, a broken sheen line near the top, stitched seams; o.studs: a row of studs
export function leatherP(o = {}) {
  const L = o.cols || C.leather;
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = h > 1 ? y / (h - 1) : 0.5;
      let k = face === 'up' ? 1 : face === 'down' ? 4 : t < 0.3 ? 1 : t < 0.75 ? 2 : 3;
      if (face === 'east' || face === 'north') k = Math.min(4, k + 1);
      p.px(x, y, L[k]);
    }
    if (face === 'up' || face === 'down') return;
    const gy = Math.min(h - 1, Math.max(1, Math.round(h * 0.18)));
    for (let x = 0; x < w; x++) if (h2(x >> 2, gy, 9) < 0.6) p.px(x, gy, L[0]);
    if (o.stitch !== false && h > 4) for (let x = 1; x < w - 1; x += 2) p.px(x, h - 2, L[0]);
    if (o.studs && h >= 3) for (let x = 1; x + 2 < w; x += o.studs) stud(p, x, Math.max(0, (h >> 1) - 1));
    if (o.after) o.after(p, w, h, face);
  };
}
// bandana print: an original paisley of teardrops with a dot and a curl, a white border near the edges
export function bandanaP(o = {}) {
  const R = o.cols || C.red, ink = o.ink || '#2a0a14', wht = o.white || '#fff4ec';
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = h > 1 ? y / (h - 1) : 0.5;
      let k = face === 'up' ? 1 : face === 'down' ? 3 : t < 0.2 ? 1 : t < 0.8 ? 2 : 3;
      if (face === 'east' || face === 'north') k = Math.min(4, k + 1);
      if (o.flat) k = Math.min(4, k);
      p.px(x, y, R[k]);
    }
    // teardrops on a staggered 8 × 7 grid
    for (let gy = -1; gy < h + 7; gy += 7) for (let gx = -2; gx < w + 8; gx += 8) {
      const ox = gx + (((gy + 7) / 7) & 1) * 4, oy = gy;
      const dot = [[1, 1], [2, 1], [1, 2], [2, 2], [3, 2], [2, 3], [3, 3], [3, 4]];
      for (const [dx, dy] of dot) p.px(ox + dx, oy + dy, wht);
      p.px(ox + 2, oy + 2, ink); p.px(ox + 4, oy + 4, wht); p.px(ox + 5, oy + 3, wht); p.px(ox + 0, oy + 4, R[3]);
    }
    if (o.border !== false && face !== 'up' && face !== 'down' && h >= 5) for (let x = 0; x < w; x++) { p.px(x, 1, wht); p.px(x, h - 2, wht); }
    if (o.rip) for (let x = 0; x < w; x++) { const l = (x * 7) % 5 < 2 ? 1 + ((x * 3) % 2) : 0; for (let y = h - l; y < h; y++) p.px(x, y, 0); }
  };
}
// chain links (chrome) hanging along −y from (x, y, z): a 'flat' link lies in the x–y plane, an upright one in the z–y plane
export function link(x, y, z, upright, k = 1, tex = metalP(C.chrome)) {
  const L = 2.2 * k, Wd = 1.5 * k, b = 0.45 * k, a = Wd / 2;
  return upright ? [
    P([x - b / 2, y - L, z + a - b], [b, L, b], tex), P([x - b / 2, y - L, z - a], [b, L, b], tex),
    P([x - b / 2, y - b, z - a + b], [b, b, Wd - 2 * b], tex), P([x - b / 2, y - L, z - a + b], [b, b, Wd - 2 * b], tex),
  ] : [
    P([x + a - b, y - L, z - b / 2], [b, L, b], tex), P([x - a, y - L, z - b / 2], [b, L, b], tex),
    P([x - a + b, y - b, z - b / 2], [Wd - 2 * b, b, b], tex), P([x - a + b, y - L, z - b / 2], [Wd - 2 * b, b, b], tex),
  ];
}

// ---------------------------------------------------------------- the six-shooter
// an antique single-action revolver, oversized and chunky: nickel frame with engraved scrolls, a blued
// fluted cylinder with six brass rounds peeking out, a long octagonal barrel, a brass trigger guard and
// ivory grips with a little red rose inlaid. Built around the grip point G with the barrel along +z.
const N = C.nickel;
const scroll = (p, w, h, x0, y0, s = 1) => { const pts = [[0, 1], [1, 0], [2, 0], [3, 1], [3, 2], [2, 2]]; for (const [a, b] of pts) p.px(x0 + a * s, y0 + b, N[4]); };
const frameP = metalP(N, { after: (p, w, h, face) => {
  if (face !== 'east' && face !== 'west') return;
  for (let x = 1; x + 4 < w; x += 4) scroll(p, w, h, x, Math.max(1, (h >> 1) - 1 + ((x >> 2) & 1)));
  for (let x = 0; x < w; x++) p.px(x, h - 1, N[4]);
} });
const barrelP = metalP(N, { after: (p, w, h, face) => {
  if (face === 'south') {   // the bore
    p.rect(0, 0, w, h, N[2]); const c = (w - 1) / 2, r = (h - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - c, y - r); if (d < Math.min(w, h) * 0.28) p.px(x, y, '#0c0a12'); else if (d < Math.min(w, h) * 0.42) p.px(x, y, N[3]); }
    return;
  }
  if (face === 'east' || face === 'west') { for (let x = 0; x < w; x++) { p.px(x, 0, N[0]); if (h > 3) p.px(x, h - 2, N[3]); } for (let x = 2; x < w - 1; x += 9) p.px(x, Math.max(1, h >> 1), N[4]); }
  if (face === 'up') for (let y = 0; y < h; y++) { p.px(0, y, N[2]); p.px(w - 1, y, N[2]); }
} });
const cylP = (p, w, h, face) => {
  const B = C.blued;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let col;
    if (face === 'south' || face === 'north') col = B[2];
    else {
      const across = face === 'up' || face === 'down' ? x : y, n = face === 'up' || face === 'down' ? w : h;
      const k = Math.floor((across / n) * 4) % 2, base = face === 'up' ? 0 : face === 'down' ? 3 : (face === 'east' ? 2 : 1);
      col = B[Math.min(4, base + k)];
      if (across % 2 === 0 && k === 1) col = B[Math.min(4, base + 2)];
    }
    p.px(x, y, col);
  }
  if (face === 'south' || face === 'north') {   // six chambers in a ring, brass rounds
    const cx = (w - 1) / 2, cy = (h - 1) / 2, r = Math.min(w, h) * 0.32;
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.5, x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r); p.px(x, y, C.brass[1]); p.px(x + 1, y, C.brass[2]); p.px(x, y + 1, C.brass[3]); }
    p.px(Math.round(cx), Math.round(cy), B[4]);
  }
};
const steelDark = metalP(C.blued.concat([C.blued[2]]));
const brassP = metalP([C.brass[0], C.brass[1], C.brass[2], C.brass[3], C.brass[2], C.brass[1]]);
const hammerP = (p, w, h, face) => { metalP(C.blued.concat([C.blued[2]]))(p, w, h, face); if (face === 'up' || face === 'north') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((x + y) % 2) p.px(x, y, C.blued[3]); };
const gripP = (rose = true) => (p, w, h, face) => {
  const I = C.ivory;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let k = face === 'up' ? 0 : face === 'down' ? 3 : (face === 'east' || face === 'north') ? 2 : 1;
    if (face === 'east' || face === 'west') { if (x === 0 || y === 0) k = Math.max(0, k - 1); if (x === w - 1) k = 3; if ((x * 3 + y * 5) % 11 === 0) k = Math.min(4, k + 1); }
    p.px(x, y, I[k]);
  }
  if ((face === 'east' || face === 'west') && rose && w >= 5 && h >= 8) {
    const cx = Math.floor(w / 2), cy = Math.floor(h * 0.42);
    p.px(cx, cy - 1, C.rose[2]); p.px(cx - 1, cy, C.rose[1]); p.px(cx, cy, C.rose[3]); p.px(cx + 1, cy, C.rose[2]); p.px(cx, cy + 1, C.rose[2]); p.px(cx - 1, cy - 1, C.rose[0]);
    p.px(cx, cy + 2, C.leaf[2]); p.px(cx, cy + 3, C.leaf[3]); p.px(cx + 1, cy + 3, C.leaf[1]);
  }
  if (face === 'east' || face === 'west') { p.px(1, h - 3, C.brass[2]); }   // escutcheon pin
};
// G: grip point (the pivot). k: scale. o.id: a part id for every cube. o.rose: the rose inlay
export function revolver(G, k = 1, o = {}) {
  const [gx, gy, gz] = G, Q = (dx, dy, dz) => [gx + dx * k, gy + dy * k, gz + dz * k], S = (a, b, c) => [a * k, b * k, c * k];
  const x = o.id ? { id: o.id, hide: !!o.hide } : {};
  return [
    P(Q(-0.75, -3.8, -1.9), S(1.5, 4.0, 2.1), gripP(o.rose !== false), { pivot: G, rot: [16, 0, 0], ...x }),
    P(Q(-0.8, -4.4, -2.0), S(1.6, 0.7, 2.3), brassP, { pivot: G, rot: [16, 0, 0], ...x }),
    P(Q(-0.82, -0.6, -1.3), S(1.64, 2.6, 4.8), frameP, x),
    P(Q(-1.25, -0.05, 0.4), S(2.5, 2.5, 2.9), cylP, x),
    P(Q(-0.62, 1.1, 3.4), S(1.24, 1.24, 8.8), barrelP, x),
    P(Q(-0.45, 0.32, 3.4), S(0.9, 0.82, 5.8), metalP(N, { from: 0.5, to: 1 }), x),
    P(Q(-0.18, 2.32, 11.2), S(0.36, 0.6, 0.8), steelDark, x),
    P(Q(-0.36, 1.5, -2.0), S(0.72, 1.35, 1.1), hammerP, { pivot: Q(0, 1.5, -1.3), rot: [-24, 0, 0], ...x }),
    P(Q(-0.3, -1.85, -0.4), S(0.6, 0.42, 2.8), brassP, x),
    P(Q(-0.3, -1.85, 2.0), S(0.6, 1.4, 0.42), brassP, x),
    P(Q(-0.18, -1.5, 0.6), S(0.36, 1.1, 0.36), steelDark, { pivot: Q(0, -0.6, 0.8), rot: [16, 0, 0], ...x }),
  ];
}
export const muzzle = (G, k = 1) => [G[0], G[1] + 1.72 * k, G[2] + 12.4 * k];

// ---------------------------------------------------------------- the rose
const R5 = C.rose;
// an outer petal: crimson, lit along its curled rim, darker toward the heart
const petalP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = h > 1 ? y / (h - 1) : 0.5;
    let k = face === 'up' ? 0 : face === 'down' ? 4 : t < 0.2 ? 1 : t < 0.6 ? 2 : 3;
    if (face === 'east' || face === 'north') k = Math.min(5, k + 1);
    p.px(x, y, R5[k]);
  }
  if (face !== 'up' && face !== 'down') { for (let x = 0; x < w; x++) p.px(x, 0, R5[0]); if (w > 3) p.px(1, 1, '#ffd0d4'); for (let y = 2; y < h; y += 3) p.px(Math.floor(w / 2), y, R5[3]); }
};
// the heart: a tight spiral seen from above
const heartP = (p, w, h, face) => {
  if (face !== 'up') { petalP(p, w, h, face); return; }
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx) / (Math.PI * 2) + 0.5;
    const s = ((r - a * 1.6) % 1.6 + 1.6) % 1.6;
    p.px(x, y, s < 0.55 ? R5[4] : r < 1 ? R5[3] : dx + dy < 0 ? R5[1] : R5[2]);
  }
};
const greenP = (cols = C.leaf) => (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let k = face === 'up' ? 0 : face === 'down' ? 3 : 1 + (face === 'east' || face === 'north' ? 1 : 0); p.px(x, y, cols[k]); } };
const stemP = (p, w, h, face) => { greenP()(p, w, h, face); if (face === 'up' || face === 'down') return; for (let y = 2; y < h; y += 5) { p.px(0, y, C.leaf[0]); p.px(w - 1, y + 2, '#6a3a2a'); } };
const sepalP = (p, w, h) => { const cx = (w - 1) / 2, cy = (h - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), R = (Math.min(w, h) / 2) * (0.35 + 0.65 * Math.max(0, Math.cos(a * 2.5)) ** 2); if (r <= R) p.px(x, y, r > R - 1 ? C.leaf[3] : r < 1.5 ? C.leaf[1] : C.leaf[2]); } };
// a serrated rose leaf on a plane, its tip toward +u
export const leafP = (p, w, h) => {
  const cy = (h - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = (x + 0.5) / w, half = Math.sin(Math.min(1, u * 1.15) * Math.PI) * (h / 2) * (0.9 + (x % 3 === 0 ? 0.1 : 0));
    const d = y - cy; if (Math.abs(d) > half) continue;
    p.px(x, y, Math.abs(d) < 0.6 ? C.leaf[0] : Math.abs(d) > half - 1 ? C.leaf[3] : d < 0 ? C.leaf[1] : C.leaf[2]);
  }
};
// B: centre of the bloom; the stem runs down −y. o: { stem, leaves, id, hide }
export function rose(B, k = 1, o = {}) {
  const [bx, by, bz] = B, Q = (dx, dy, dz) => [bx + dx * k, by + dy * k, bz + dz * k], S = (a, b, c) => [a * k, b * k, c * k];
  const L = o.stem ?? 8, x = o.id ? { id: o.id, hide: !!o.hide } : {};
  const out = [
    P(Q(-0.95, -0.8, -0.95), S(1.9, 2.0, 1.9), heartP, x),
    P(Q(-1.45, -1.6, -1.45), S(2.9, 1.5, 2.9), petalP, x),
    P(Q(-1.35, -1.7, 1.05), S(2.7, 2.3, 0.6), petalP, { pivot: Q(0, -1.7, 1.2), rot: [24, 0, 0], ...x }),
    P(Q(-1.35, -1.7, -1.65), S(2.7, 2.3, 0.6), petalP, { pivot: Q(0, -1.7, -1.2), rot: [-24, 0, 0], ...x }),
    P(Q(1.05, -1.7, -1.35), S(0.6, 2.3, 2.7), petalP, { pivot: Q(1.2, -1.7, 0), rot: [0, 0, -24], ...x }),
    P(Q(-1.65, -1.7, -1.35), S(0.6, 2.3, 2.7), petalP, { pivot: Q(-1.2, -1.7, 0), rot: [0, 0, 24], ...x }),
    P(Q(-0.6, -2.4, -0.6), S(1.2, 0.9, 1.2), greenP(), x),
    P(Q(-1.9, -2.0, -1.9), S(3.8, 0, 3.8), sepalP, { plane: 'y', ...x }),
  ];
  if (L > 0) out.push(P(Q(-0.24, -2.4 - L, -0.24), S(0.48, L, 0.48), stemP, x));
  if (o.leaves !== false && L > 3) {
    out.push(P(Q(0.2, -2.4 - L * 0.42 - 0.7, 0), S(2.6, 1.4, 0), leafP, { plane: 'z', pivot: Q(0.2, -2.4 - L * 0.42, 0), rot: [0, -30, 20], ...x }));
    out.push(P(Q(-2.8, -2.4 - L * 0.66 - 0.6, 0), S(2.6, 1.2, 0), leafP, { plane: 'z', mirror: true, pivot: Q(-0.2, -2.4 - L * 0.66, 0), rot: [0, 30, -16], ...x }));
  }
  return out;
}

// ---------------------------------------------------------------- particles
const featherSpr = (c) => (p, W, H) => { for (let y = 0; y < H; y++) { const w = Math.round(Math.sin((y / (H - 1)) * Math.PI) * (W / 2)); for (let x = -w; x <= w; x++) p.px(Math.floor(W / 2) + x, y, x === 0 ? sh(c, -0.5) : x < 0 ? sh(c, 0.3) : c); } };
defineFx('pg_feather', { w: 5, h: 9, frames: [featherSpr('#a2aac0'), featherSpr('#c8cedc'), featherSpr('#6e7690')], life: [1.0, 1.6], size: [0.08, 0.08], speed: [1, 2.2], grav: 1.0, drag: 2.4, spread: 1, flutter: true });
defineFx('pg_crumb', { w: 3, h: 3, frames: [(p) => { p.px(0, 0, '#f6dca0'); p.px(1, 0, '#e8b868'); p.px(0, 1, '#e8b868'); p.px(1, 1, '#c88a40'); p.px(2, 1, '#a86a30'); p.px(1, 2, '#8a5428'); }, (p) => { p.px(1, 0, '#fff0c8'); p.px(0, 1, '#f6dca0'); p.px(1, 1, '#e8b868'); p.px(2, 2, '#c88a40'); }], life: [0.4, 0.8], size: [0.035, 0.035], speed: [0.8, 1.6], grav: 7, drag: 0.5, spread: 0.8, spin: 8 });
const petalSpr = (c) => (p, W, H) => { for (let y = 0; y < H; y++) { const w = Math.round(Math.sin(((y + 0.6) / H) * Math.PI) * (W / 2 + 0.3)); for (let x = -w; x < w; x++) p.px(Math.floor(W / 2) + x, y, y === 0 ? sh(c, 0.35) : x === -w ? sh(c, 0.2) : x === w - 1 ? sh(c, -0.35) : c); } };
defineFx('pg_petal', { w: 5, h: 6, frames: [petalSpr('#e8203a'), petalSpr('#c40e2c'), petalSpr('#ff4a5e'), petalSpr('#9a0a26')], life: [1.4, 2.2], size: [0.075, 0.07], speed: [0.8, 1.8], grav: 0.45, drag: 1.5, spread: 1, flutter: true });
const flashSpr = (p, W, H) => {
  const c = (W - 1) / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - c, dy = y - c, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), R = (W / 2) * (0.32 + 0.68 * Math.abs(Math.cos(a * 4)) ** 6);
    if (r > R) continue; p.px(x, y, r < R * 0.35 ? '#ffffff' : r < R * 0.65 ? '#fff2a0' : '#ffb03a');
  }
};
defineFx('pg_flash', { w: 17, h: 17, paint: flashSpr, glow: true, life: [0.09, 0.13], size: [0.55, 0.75], speed: [0, 0], grav: 0, spread: 0, spin: 1 });
const wispSpr = (c) => (p, W, H) => { const cx = W / 2 - 0.5, cy = H / 2 - 0.5; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot((x - cx) / (W / 2), (y - cy) / (H / 2)); if (d > 1 || (d > 0.8 && (x + y) % 2)) continue; p.px(x, y, x + y < W - 2 ? '#ffffff' : c); } };
defineFx('pg_smoke', { w: 9, h: 8, frames: [wispSpr('#c8c4d0'), wispSpr('#a8a4b4')], life: [0.9, 1.5], size: [0.05, 0.22], speed: [0.2, 0.5], grav: -0.5, drag: 1.6, spread: 0.4, fade: true, wob: 0.8, spin: 0.6 });

// ---------------------------------------------------------------- motion
// keep the feet planted while the body rises or sinks by dy: the legs follow it and stretch to reach
export function plant(P, dy, L = 3.6, legs = ['legR', 'legL']) { for (const s of legs) P.pos(s, 0, dy, 0).scl(s, 1, Math.max(0.35, (L + dy) / L), 1); }
// the pigeon head-bob along z for one step (u 0..1): a fast thrust forward, then the head holds still in
// space while the body walks under it (so, relative to the body, it slides back)
export function bobZ(u, A = 1.6, thrust = 0.3) {
  if (u < thrust) return -A + 2 * A * E.out3(u / thrust);
  const k = (u - thrust) / (1 - thrust);
  return A - 2 * A * (k < 0.12 ? 0.5 * (k / 0.12) * k : k - 0.06);
}
// one walking foot: phase q (0..1) of its own cycle; swing (lifted, forward) for `sw` of it, stance (planted, sliding back) the rest
export function footCycle(q, Z = 2, H = 1.6, sw = 0.42) {
  q = ((q % 1) + 1) % 1;
  if (q < sw) { const k = q / sw; return { z: -Z + 2 * Z * E.inout(k), y: Math.sin(k * Math.PI) * H, k, air: true }; }
  const k = (q - sw) / (1 - sw); return { z: Z - 2 * Z * k, y: 0, k, air: false };
}
// the strut: feet, legs, body bounce and roll, the head-bob, a counter-bobbing tail.
// o: { Z, H, A (bob), roll, yaw, bounce, neck: share of the bob on the neck bone, tilt (body pitch), legs, feet }
export function strut(P, t, per, o = {}) {
  const ph = ((t / per) % 1 + 1) % 1, s = Math.sin(ph * Math.PI * 2);
  const fr = footCycle(ph, o.Z ?? 2, o.H ?? 1.6), fl = footCycle(ph + 0.5, o.Z ?? 2, o.H ?? 1.6);
  const [fR, fL] = o.feet || ['footR', 'footL'], [lR, lL] = o.legs || ['legR', 'legL'];
  P.pos(fR, 0, fr.y, fr.z).pos(fL, 0, fl.y, fl.z);
  P.rot(fR, fr.air ? -18 * Math.sin(fr.k * Math.PI) : 0, 0, 0).rot(fL, fl.air ? -18 * Math.sin(fl.k * Math.PI) : 0, 0, 0);
  const u = (ph * 2) % 1, dip = Math.cos(u * Math.PI * 2);           // lowest as each foot lands
  const dy = (o.bounce ?? 0.6) * (0.5 + 0.5 * dip) - (o.bounce ?? 0.6) * 0.5;
  P.pos('body', 0, dy, 0).rot('body', (o.tilt ?? 0) - dip * 1.5, s * (o.yaw ?? 6), -s * (o.roll ?? 5));
  P.pos(lR, 0, fr.y * 0.75 + dy * 0.5, fr.z * 0.8).pos(lL, 0, fl.y * 0.75 + dy * 0.5, fl.z * 0.8);
  P.rot(lR, -fr.z * 6, 0, 0).rot(lL, -fl.z * 6, 0, 0);
  const z = bobZ(u, o.A ?? 1.6), nk = o.neck ?? 0.45;
  P.pos('neck', 0, 0, z * nk).pos('head', 0, 0, z * (1 - nk)).rot('head', u < 0.3 ? 6 * Math.sin((u / 0.3) * Math.PI) : 0, -s * (o.yaw ?? 6) * 0.6, s * (o.roll ?? 5) * 0.4);
  P.rot('tail', dip * 6, -s * 8, 0);
  return { ph, s, u, dy, fr, fl, z };
}
// a quick peck: 0 → 1 → 0 with a sharp strike (t0 start, d duration)
export const peck = (t, t0, d = 0.22) => { const k = (t - t0) / d; if (k <= 0 || k >= 1) return 0; return k < 0.35 ? E.out3(k / 0.35) : 1 - E.inout((k - 0.35) / 0.65); };
export { E, seg, bump, wave };


// ---------------------------------------------------------------- stage 1: the street pigeon (Pidgun ♂ / ♀)
// The body is a plump egg pitched nose-up: its boxes are authored as a level egg and each one is tilted
// about the egg's centre (eggBox), so every bone stays in a level frame. Outfits that must follow the egg
// go on a bone with the same tilt (eggBone).
export const S1 = {
  EC: [0, 9.8, -1.2], R: [6.3, 5.8, 9.8], pitch: -20,
  neck: { pivot: [0, 15.0, 3.0], O: [0, 16.0, 3.0], R: [4.6, 3.6, 4.0], yTop: 19.0, yBot: 13.4 },
  head: { pivot: [0, 18.4, 3.2], O: [0, 20.4, 3.0], R: [4.0, 3.4, 3.8] },
  eyes: { xs: 3.6, zf: 6.6, y: 20.3 },
  mouth: [0, 19.2, 9.4], shoulder: [6.0, 14.6, 3.6],
};
export const eggBox = (o, s, tex, x = {}) => P(o, s, tex, { pivot: S1.EC, rot: [S1.pitch, 0, 0], ...x });
export const eggBone = (name, cubes) => ({ name, parent: 'body', pivot: S1.EC, rot: [S1.pitch, 0, 0], cubes });
// the bare pigeon: a pale rump, a darker belly, the neck's violet sheen spilling onto the top of the breast
export function pigeonBody(q, face, n, l, A, B) {
  const [, y, z] = q, E0 = S1.EC;
  if (z < E0[2] - 6.6 && y > E0[1] - 0.8) return featherCol(C.pale, l, A, B, 8, 5, face);
  if (y < E0[1] - 2.8) return featherCol(C.belly, l, A, B, 8, 5, face);
  const br = (z - E0[2] - 4.5) / 2.5 + (y - E0[1] - 1.2) / 2.5;
  if (br > 0 && face !== 'down') { const s = shingle(A, B, 6, 4); return dith(featherCol(C.slate, l, A, B, 8, 5, face), sheen(0.72 + br * 0.12, l - (s === 1 ? 0.6 : 0), A, B), clamp(br * 1.2), A, B); }
  return undefined;
}
export function stage1(o = {}) {
  const region = o.bodyRegion ? (...a) => { const r = o.bodyRegion(...a); return r !== undefined ? r : pigeonBody(...a); } : pigeonBody;
  const bodyP = plumage({ O: S1.EC, R: S1.R, cols: o.slate || C.slate, region });
  const neckPt = neckP({ ...S1.neck, region: o.neckRegion });
  const headPt = plumage({ O: S1.head.O, R: S1.head.R, cols: o.headCols || C.head, S: 6, RH: 4, region: o.headRegion });
  const EYES = o.eyes || pigeonEyes();
  const [sx, sy, sz] = S1.shoulder;
  const leg = (s) => [P([s * 2.7 - 0.55, 0.3, 0.65], [1.1, 4.0, 1.1], legP), P([s * 2.7 - 1.45, 3.1, -0.25], [2.9, 2.3, 2.9], thighP(o.belly || C.belly))];
  const bones = [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'footR', parent: 'root', pivot: [-2.7, 0, 1.2], cubes: footCubes(-2.7, 1.2) },
    { name: 'footL', parent: 'root', pivot: [2.7, 0, 1.2], cubes: footCubes(2.7, 1.2) },
    { name: 'legR', parent: 'root', pivot: [-2.7, 4.6, 1.2], cubes: leg(-1) },
    { name: 'legL', parent: 'root', pivot: [2.7, 4.6, 1.2], cubes: leg(1) },
    { name: 'body', parent: 'root', pivot: [0, 8.8, -1.0], cubes: [
      eggBox([-4.8, 5.4, -11.0], [9.6, 8.8, 19.6], bodyP),
      eggBox([-6.3, 5.6, -7.6], [12.6, 8.4, 12.8], bodyP),
      eggBox([-4.7, 4.0, -6.6], [9.4, 11.6, 10.8], bodyP),
      eggBox([-5.6, 4.8, -5.0], [11.2, 10.0, 7.6], bodyP),
      eggBox([-3.8, 6.6, 8.4], [7.6, 6.4, 1.4], bodyP),
      eggBox([-3.4, 7.0, -12.4], [6.8, 5.6, 1.6], bodyP),
      ...(o.bodyExtra || []),
    ] },
    { name: 'tail', parent: 'body', pivot: [0, 7.8, -10.2], rot: [-12, 0, 0], cubes: [
      P([-3.2, 7.3, -20.2], [6.4, 1.0, 10.0], tailP({ fan: true })),
      P([-2.6, 6.7, -17.8], [5.2, 0.7, 7.4], tailP({ cols: C.pale })),
    ] },
    { name: 'neck', parent: 'body', pivot: S1.neck.pivot, cubes: [
      P([-4.3, 13.0, -0.4], [8.6, 4.2, 6.8], neckPt),
      P([-3.7, 15.6, 0.4], [7.4, 3.2, 5.8], neckPt),
      ...(o.neckExtra || []),
    ] },
    { name: 'head', parent: 'neck', pivot: S1.head.pivot, cubes: [
      P([-3.6, 17.8, 0.0], [7.2, 5.2, 6.6], headPt),
      P([-3.0, 18.4, -0.5], [6.0, 5.2, 6.5], headPt),
      P([-3.9, 17.9, 0.6], [7.8, 2.4, 5.4], headPt),
      P([-0.95, 19.9, 6.5], [1.9, 1.0, 1.6], cereP),
      P([-0.7, 19.2, 6.6], [1.4, 0.95, 2.9], beakP(6.6, 9.5)),
      P([-0.55, 18.85, 9.1], [1.1, 0.85, 0.85], beakP(6.6, 9.5), { pivot: [0, 19.6, 9.4], rot: [18, 0, 0] }),
      ...eyeCubes(EYES, { ...S1.eyes, def: o.eyeDef || 'glare' }),
      ...(o.headExtra || []),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 19.2, 6.7], cubes: [
      P([-0.6, 18.55, 6.6], [1.2, 0.65, 2.4], beakP(6.6, 9.0)),
      P([-0.65, 19.05, 6.5], [1.3, 0.2, 2.1], mouthP, { outline: false }),
    ] },
  ];
  for (const s of [-1, 1]) {
    const nm = s < 0 ? 'R' : 'L'; if (o['wing' + nm] === false) continue;
    const W = foldedWing(s, [s * sx, sy, sz], o.wingOpts || {});
    bones.push({ name: 'wing' + nm, parent: 'body', pivot: [s * sx, sy, sz], rot: [-14, 0, s * 3], cubes: W.arm });
    bones.push({ name: 'hand' + nm, parent: 'wing' + nm, pivot: W.wrist, cubes: W.hand });
  }
  return bones;
}
