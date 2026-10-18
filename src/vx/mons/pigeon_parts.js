// Shared parts for the Guns N' Roses street-pigeon line: Pidgun ♂ (pidgun.js) and ♀
// (pidrose.js) → Jungeon ♂ / ♀ (jungeon.js, jungeon_rose.js) → Paradove (paradove.js).
//  · plumage painted as one lit form across the stepped boxes (shingled feathers, clean bands), in two
//    colour morphs — the classic blue-bar (slate, black wing bars, green-to-violet neck) and ash-red
//    (rosy cream, wine-red bars, a pink-violet neck) — with the banded tail, coral legs, the dark bill
//    and its white cere,
//  · kawaii eyes in the recent-generation Pokémon style (big dark accent-tinted eyes, a catchlight and a
//    glint) with the full expression set: lid-line glare, ^ ^, soft closed curve, > <, swirls, X,
//  · props: the antique six-shooter (nickel, engraved, ivory grips with a rose inlay) and the
//    long-stemmed rose,
//  · particles: pigeon feathers, bread crumbs, rose petals, muzzle flash, gun smoke,
//  · motion: planted feet, the head-bob (thrust and hold) and the strut,
//  · gear attach points (def.attach) for the buyable accessories.
import { defineFx } from '../fx.js';
import { E, seg, bump, wave, wob, key, bounce } from '../anim.js';
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
  // the classic blue-bar feral pigeon, light → dark
  slate: ['#e2e6ee', '#c0c6d5', '#a0a8bd', '#838ba4', '#666d88'],
  belly: ['#cdd2de', '#adb4c6', '#9097ae', '#757c96', '#5a607a'],
  pale: ['#f6f7fa', '#e0e3ea', '#c2c7d4', '#9ea4b8', '#7c8298'],
  covert: ['#eef1f6', '#d6dbe5', '#b9c0cf', '#9aa2b7', '#7d849b'],
  bar: ['#4a4c60', '#323446', '#22232f', '#16161f'],
  prim: ['#a0a6bc', '#80869f', '#646a84', '#4b506a', '#363a52'],
  head: ['#d2d8e5', '#b2b9cc', '#959db4', '#7b839c', '#626982'],
  // the neck's sheen, each [lit, base, shade]: green → teal → violet → magenta
  irG: ['#a8eac4', '#56b88e', '#357a6c'],
  irT: ['#9adcdc', '#3fa2aa', '#2a6878'],
  irV: ['#cbb0ea', '#8a62c0', '#5a428a'],
  irM: ['#eaa8d8', '#b05aa6', '#76367a'],
  leg: ['#ffc0b0', '#f6828a', '#d85466', '#a43450', '#6c2034'],
  claw: '#2a2028',
  beak: ['#8e8898', '#605a6c', '#433e4e', '#2c2834', '#1c1922'],
  cere: ['#f6f0f0', '#e2d8da', '#c8bcc2', '#a69aa4'],
  chrome: ['#ffffff', '#dfe6f4', '#aab4d0', '#5c6488', '#7c86aa', '#9aa4c4'],
  nickel: ['#ffffff', '#e6e9f0', '#bcc1cf', '#7e8498', '#565c72', '#9aa0b4'],
  blued: ['#a8b4d8', '#6a789e', '#465274', '#2c3450', '#1a1f34'],
  brass: ['#fff4b8', '#ffd660', '#e0a032', '#a86c1c', '#6a420e'],
  ivory: ['#fffcf2', '#f4ead6', '#dccdae', '#b8a684', '#8a7658'],
  rose: ['#ff8a92', '#ff4054', '#dc1634', '#a00c28', '#62061c', '#3a0412'],
  leaf: ['#b4e67a', '#6cbc4c', '#3e8c3a', '#24602e', '#14401e'],
};
// colour morphs: everything a painter needs for one plumage
export const MORPH = {
  blue: { slate: C.slate, belly: C.belly, pale: C.pale, covert: C.covert, bar: C.bar, prim: C.prim, head: C.head, ir: [C.irG, C.irT, C.irV, C.irM] },
  ash: {
    slate: ['#f4eaea', '#dccacc', '#c2aab0', '#a48c94', '#866e7a'],
    belly: ['#e8dadc', '#cfbbc0', '#b49ca4', '#98808c', '#7a6472'],
    pale: ['#fffafa', '#f4e8e8', '#e0cfd2', '#c4adb4', '#a48e98'],
    covert: ['#fff6f2', '#f0e0dc', '#dcc4c2', '#c2a6a8', '#a48a90'],
    bar: ['#a84a54', '#86303e', '#64202e', '#44141e'],
    prim: ['#cab2b0', '#a89090', '#8a7276', '#6c585e', '#4e4048'],
    head: ['#ecd8da', '#d2b8bc', '#b6989e', '#987c86', '#7a626e'],
    ir: [['#ffd0ea', '#e898c8', '#b0689a'], ['#f4bce6', '#cc80c4', '#92589a'], ['#dcb6f4', '#a476d0', '#6e4e9a'], ['#c8e2c8', '#8cb898', '#5e8670']],
  },
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
export const THR = [0.72, 0.3, -0.22, -0.62];
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
export function sheen(t, l, x, y, H = MORPH.blue.ir) {
  const s = clamp(t) * 3, i = Math.min(2, Math.floor(s)), f = s - i;
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
    const t = (o.yTop - q[1]) / (o.yTop - o.yBot);
    if (t < -0.05) return featherCol(o.cols || C.head, l, A, B, 6, 4, face);
    if (t > 1.15) return featherCol(o.below || C.slate, l, A, B, 8, 5, face);
    const IR = o.ir || MORPH.blue.ir;
    if (face === 'down') return IR[2][2];
    // clean bands of sheen (green at the nape → violet at the crop), brightest where the neck turns to
    // the side; seen square-on the slate shows through. Only the feather rims break the bands.
    const side = Math.abs(n[0]) > 0.42 || face === 'east' || face === 'west';
    const lk = l > 0.55 ? 0 : l > -0.1 ? 1 : 2, H = IR, hi = Math.min(3, Math.floor(clamp((t - 0.12) * 1.9 + Math.abs(n[0]) * 0.35) * 3.4));
    let col = H[hi][lk];
    if (!side) col = mx(col, (o.cols || C.head)[lk + 1], 0.45);
    if (shingle(A, B, 7, 4) === 1) col = mx(col, H[hi][2], 0.6);
    return col;
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
  const cov = o.covert || C.covert, pr = o.prim || C.prim, sl = o.slate || C.slate, BAR = o.bar || C.bar;
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
        else if (t > b1 && t < b1 + bw) col = BAR[Math.min(3, (k > 1 ? 1 : 0) + (A % 4 === 0 ? 1 : 0))];
        else if (t > b2 && t < b2 + bw) col = BAR[Math.min(3, (k > 1 ? 1 : 0) + (A % 4 === 0 ? 1 : 0))];
        else if (t > b2 + bw) col = featherCol(sl, 0.5 - k * 0.38, A, B, 7, 5);
        else col = featherCol(cov, 0.8 - k * 0.38, A, B, 6, 4);
        if (c.s && face !== 'up' && face !== 'down' && along > 0.97) col = cov[Math.min(4, k + 2)];
      }
      p.px(i, j, col);
    }
  };
}
// feather tips on a cut-out plane: a row of rounded tips along the bottom edge (o.n tips across), the colour
// ramp running down; o.long: long pointed primaries instead (fingers)
export function tipsP(o = {}) {
  const cols = o.cols || C.slate, n = o.n || 4;
  const paint = (put, w, h) => {
    const fw = w / n;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = Math.floor(i / fw), u = ((i - k * fw + 0.5) / fw) * 2 - 1, v = (j + 0.5) / h;
      const edge = o.long ? (1 - Math.abs(u) ** 1.6) * (0.55 + 0.45 * ((k * 7) % 3) / 2) : Math.sqrt(Math.max(0, 1 - u * u));
      const bottom = h * (o.long ? 0.35 + 0.65 * edge : 0.5 + 0.5 * edge);
      if (j > bottom) continue;
      let col = cols[Math.min(cols.length - 1, 1 + Math.floor(v * 2.2))];
      if (j > bottom - 1.2) col = cols[Math.min(cols.length - 1, 3)];
      else if (u < -0.6) col = cols[Math.max(0, Math.floor(v * 2.2))];
      else if (u > 0.75) col = cols[Math.min(cols.length - 1, 2 + Math.floor(v * 2.2))];
      put(i, j, col);
    }
  };
  // dir 'down': tips along the bottom edge; 'back': tips along the left edge (a plane 'x' whose tips point to −z)
  return (p, w, h) => { if (o.dir === 'back') paint((i, j, c) => p.px(w - 1 - j, i, c), h, w); else paint((i, j, c) => p.px(i, j, c), w, h); };
}
// a folded wing along the body side (s −1 right, +1 left): shoulder at (x, y, z); the arm segment (coverts, bars)
// with its secondaries' rounded tips below, then the hand (primaries) running back to notched fingers.
// Returns { arm, hand, wrist } cube lists for two bones
export function foldedWing(s, sh0, o = {}) {
  const [x, y, z] = sh0, T = o.thick ?? 1.3, ax = s < 0 ? x - T : x, armLen = o.arm ?? 8.6, chord = o.chord ?? 5.8, handLen = o.hand ?? 9.4, hc = o.hchord ?? 4.4;
  const M = o.M || MORPH.blue, mid = s < 0 ? x - T / 2 : x + T / 2, y0 = y + 0.6 - chord, zb = z + 0.4 - armLen, zh = zb - handLen;
  const arm = wingSegP({ ...M, base: [x, y + 0.6, z + 0.4], dir: [0, 0, -1], len: armLen, cdir: [0, -1, 0], chord, kind: 'arm', sleeve: o.sleeve });
  const hand = wingSegP({ ...M, base: [x, y - 0.4, zb], dir: [0, 0, -1], len: handLen, cdir: [0, -1, 0], chord: hc, kind: 'hand' });
  return {
    arm: [
      P([ax, y0, zb], [T, chord, armLen], arm),
      P([mid, y0 - 1.5, zb + 0.4], [0, 2.2, armLen - 1.2], tipsP({ n: 5, cols: M.slate }), { plane: 'x' }),
    ],
    hand: [
      P([s < 0 ? x - T * 0.85 : x + T * 0.15, y - 0.4 - hc, zh], [T * 0.7, hc, handLen], hand),
      P([mid, y - 0.4 - hc + 0.6, zh - 2.4], [0, hc - 0.8, 3.0], tipsP({ n: 3, long: true, cols: M.prim, dir: 'back' }), { plane: 'x' }),
    ],
    wrist: [s < 0 ? x - 0.7 : x + 0.7, y - 1.2, zb + 0.4],
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
  const cols = o.cols || C.slate, BAR = o.bar || C.bar;
  return (p, w, h, face, c) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const q = at(c, face, i, j, w, h), z0 = c.o[2], along = (q[2] - z0) / c.s[2];   // 0 = tip, 1 = root
      let k = face === 'up' || face === 'plane' ? 1 : face === 'down' ? 2 : 2;
      if (face === 'up' || face === 'plane') k += along > 0.7 ? 0 : 0;
      let col = cols[k];
      const fx = Math.floor(q[0] * 3 + 100);
      if ((face === 'up' || face === 'plane' || face === 'down') && fx % 4 === 0) col = cols[Math.min(4, k + 1)];   // feather edges
      if ((face === 'up' || face === 'plane') && fx % 4 === 1) col = cols[Math.max(0, k - 1)];
      if (along < 0.26 && along > 0.08) col = BAR[Math.min(3, (face === 'down' ? 2 : 1) + (fx % 4 === 0 ? 1 : 0))];
      if (along <= 0.08) col = cols[face === 'down' ? 3 : 2];
      if (o.petals && (face === 'up' || face === 'plane') && along > 0.05 && along < 0.32) {     // rose petals along the band
        const v = (along - 0.05) * c.s[2] * 3, u = ((fx % 6) + 6) % 6, d = ((u - 2.5) / 2.4) ** 2 + ((v - 3.2) / 3.0) ** 2;
        if (d < 1) col = d < 0.3 && u < 3 ? C.rose[0] : v > 4.4 ? C.rose[3] : C.rose[2];
      }
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

// ---------------------------------------------------------------- eyes and hair
// Eyes come from the shared Gen 8–9 kit (eyes.js → eyeRig): each form of the line has its own design, set up
// in its model file at the positions below. Hair: a little curled quiff of feathers (stage 1).
import { eyeArt, chunky } from './eyes.js';
export { eyeRig } from './eyes.js';
// Pigeon eyes, Cobblemon-style: a few chunky face pixels — a small round coloured ring round a dark pupil, one
// white glint — varied per form. o: { grid: [w, h] face pixels, ring: [main, lower], sclera (a white eye round a
// small iris), pupil: 'round' (2×2) | 'slit' | 'dot' | 'none', shape: 'round' | 'sharp' (outer top corner cut,
// fierce) | 'heavy' (a flat lid across the top) | 'almond', lash, core (the centre colour when there's no pupil) }
const INK2 = '#1a0c14';
function pgEye(o, mode) {
  const [W, H] = o.grid || [5, 5], ring = o.ring || ['#ff8a26', '#e0601c'], sh = o.shape || 'round';
  return (p) => {
    const cx = (W - 1) / 2, cy = (H - 1) / 2;
    const inE = (x, y) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return false;
      const corner = (x === 0 || x === W - 1) && (y === 0 || y === H - 1);
      if (corner) return false;
      if (sh === 'sharp' && y === 0 && x < Math.ceil(W / 2)) return false;
      if (sh === 'almond' && (y === 0 || y === H - 1) && (x <= 1 || x >= W - 2)) return false;
      return true;
    };
    // lids (rows above the line are hidden; the topmost visible pixel of each column is drawn as the lid line)
    const lidY = (x) => {
      const u = x / Math.max(1, W - 1);                 // 0 outer → 1 inner
      if (mode === 'angry') return 0.6 + u * H * 0.45;
      if (mode === 'sad') return 0.6 + (1 - u) * H * 0.45;
      if (mode === 'sleepy' || mode === 'smug') return H * 0.42;
      if (sh === 'heavy') return 1;
      return -1;
    };
    const vis = (x, y) => inE(x, y) && y >= Math.floor(lidY(x));
    const pupX = Math.round(cx + (o.px ?? 0.5) + (mode === 'smug' ? 0.6 : 0)), pupY = Math.round(cy + (o.py ?? 0));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!vis(x, y)) continue;
      let c = y > cy + 0.6 ? ring[1] : ring[0];
      if (o.sclera) { const d = Math.max(Math.abs(x - pupX + 0.5), Math.abs(y - pupY + 0.5)); c = d <= 1.0 ? (y > pupY ? ring[1] : ring[0]) : '#ffffff'; }
      const pu = o.pupil || 'round';
      if (pu === 'round' && (x === pupX || x === pupX - 1) && (y === pupY || y === pupY - 1)) c = INK2;
      if (pu === 'dot' && x === pupX && y === pupY) c = INK2;
      if (pu === 'slit' && x === pupX && Math.abs(y - pupY) <= 1) c = INK2;
      if (pu === 'none' && o.core && Math.abs(x - cx) <= 0.6 && Math.abs(y - cy) <= 0.6) c = o.core;
      if (mode === 'teary' && y === H - 2) c = '#8ad8ff';
      p.px(x, y, c);
    }
    // the lid line on the top edge of what shows
    if (sh === 'heavy' || mode === 'angry' || mode === 'sad' || mode === 'sleepy' || mode === 'smug' || sh === 'sharp')
      for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (vis(x, y)) { p.px(x, y, INK2); break; }
    // one glint, top-outer of the pupil
    const gx = (o.pupil || 'round') === 'none' ? Math.round(cx) - 1 : pupX - 2, gy = pupY - 1;
    if (vis(gx, gy) && !(sh === 'heavy' && gy <= 1)) p.px(gx, gy, '#ffffff');
    if (o.lash) { for (let y = 0; y < H; y++) if (vis(0, y)) { p.px(0, Math.max(0, y - 1), INK2); break; } }
  };
}
const PG_OWN = ['open', 'angry', 'sad', 'sleepy', 'smug', 'teary'];
const PG_KIT = ['closed', 'happy', 'shut', 'x', 'swirl', 'shock', 'wide', 'heart', 'star'];
// the rig: bones eyeR / eyeL (pivots at the eye centres, for squash, stretch and darts) and the face slot
export function pigeonEyeRig(o) {
  const { at, size, parent = 'head', chunk = 2 } = o, [x, y, z] = at, [w, h] = size, states = [...PG_OWN, ...PG_KIT];
  const tex = (s) => (PG_OWN.includes(s) ? chunky(pgEye(o, s), chunk) : eyeArt(s, { style: 'gen9', chunk, line: INK2 }));
  const mk = (side) => states.map((s) => ({ o: side < 0 ? [x - w / 2, y - h / 2, z] : [-x - w / 2, y - h / 2, z], s: [w, h, 0], plane: 'z', mirror: side > 0, tex: tex(s), glow: !!o.glow || s === 'heart' || s === 'star', id: (side < 0 ? 'eR-' : 'eL-') + s, hide: s !== 'open', outline: false }));
  const slot = { default: 'open', states: Object.fromEntries(states.map((s) => [s, ['eR-' + s, 'eL-' + s]])) };
  slot.states.wink = ['eR-open', 'eL-happy'];
  return { bones: [{ name: 'eyeR', parent, pivot: [x, y, z], cubes: mk(-1) }, { name: 'eyeL', parent, pivot: [-x, y, z], cubes: mk(1) }], slot };
}
// a quiff: three stacked feather boxes curling up and forward from (x, y, z), painted in the head's colours
export function quiffCubes(base, cols, k = 1) {
  const [x, y, z] = base, tex = plumage({ O: [x, y + 1.0 * k, z], R: [1.6 * k, 1.6 * k, 2.0 * k], cols, S: 5, RH: 3 });
  return [
    P([x - 1.2 * k, y, z - 1.4 * k], [2.4 * k, 1.2 * k, 1.8 * k], tex),
    P([x - 1.0 * k, y + 0.9 * k, z - 0.8 * k], [2.0 * k, 1.1 * k, 1.9 * k], tex),
    P([x - 0.8 * k, y + 1.5 * k, z + 0.6 * k], [1.6 * k, 0.9 * k, 1.2 * k], tex),
    P([x - 0.6 * k, y + 0.8 * k, z + 1.4 * k], [1.2 * k, 1.0 * k, 0.7 * k], tex),
  ];
}

// ---------------------------------------------------------------- metal
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

// a bandana in black cotton printed with tiny red rose buds (bud: two petals, a dark heart, a green leaf),
// a thin red rule along the edges of the narrow strips
const BUD = ['.rr.', 'rRrr', '.rr.', '..g.'];
export function roseBandanaP(o = {}) {
  const K = o.cols || ['#5a5268', '#3a3446', '#28232f', '#1c1822', '#121016'], R = o.bud || C.rose;
  const put = (p, x, y) => BUD.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'r') p.px(x + i, y + j, j === 0 && i === 1 ? R[1] : R[2]); else if (ch === 'R') p.px(x + i, y + j, R[4]); else if (ch === 'g') p.px(x + i, y + j, C.leaf[2]); }));
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = h > 1 ? y / (h - 1) : 0.5;
      let k = face === 'up' ? 1 : face === 'down' ? 4 : t < 0.3 ? 1 : t < 0.8 ? 2 : 3;
      if (face === 'east' || face === 'north') k = Math.min(4, k + 1);
      p.px(x, y, K[k]);
    }
    if (h >= 8 && w >= 8) { for (let gy = 1, r = 0; gy < h - 3; gy += 6, r++) for (let gx = 1 + (r & 1) * 3; gx < w - 3; gx += 6) put(p, gx, gy); return; }
    if (face === 'up' || face === 'down') return;
    if (h >= 3) for (let x = 0; x < w; x++) p.px(x, h - 1, R[3]);
    if (h >= 4) for (let x = 1 + (o.phase || 0); x + 3 < w; x += 6) put(p, x, 0);
  };
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
// about the egg's centre (eggBox), so every bone stays in a level frame.
export const S1 = {
  EC: [0, 9.8, -1.2], R: [6.3, 5.8, 9.8], pitch: -20,
  neck: { pivot: [0, 15.0, 3.0], O: [0, 16.8, 3.0], R: [4.8, 4.0, 4.2], yTop: 20.2, yBot: 13.6 },
  head: { pivot: [0, 19.6, 3.2], O: [0, 22.4, 3.0], R: [4.4, 4.0, 4.0] },
  eyeAt: [-2.35, 22.7, 6.87], eyeSize: [2.9, 3.0],
  mouth: [0, 20.4, 9.7], shoulder: [6.0, 14.6, 3.6],
};
export const eggBox = (o, s, tex, x = {}) => P(o, s, tex, { pivot: S1.EC, rot: [S1.pitch, 0, 0], ...x });
export const eggBone = (name, cubes) => ({ name, parent: 'body', pivot: S1.EC, rot: [S1.pitch, 0, 0], cubes });
// the bare pigeon: a pale rump, a darker belly, the neck's sheen spilling onto the top of the breast
export const pigeonBody = (M = MORPH.blue) => (q, face, n, l, A, B) => {
  const [, y, z] = q, E0 = S1.EC;
  if (z < E0[2] - 6.6 && y > E0[1] - 0.8) return featherCol(M.pale, l, A, B, 8, 5, face);
  if (y < E0[1] - 2.8) return featherCol(M.belly, l, A, B, 8, 5, face);
  const br = (y - E0[1] - 2.4) / 1.8 + (z - E0[2] - 4) / 6;
  if (br > 0 && face !== 'down') { const g = featherCol(M.slate, l, A, B, 8, 5, face), v = sheen(0.7, l, A, B, M.ir); return br > 0.9 ? mx(v, g, 0.35) : br > 0.4 ? mx(v, g, 0.6) : mx(v, g, 0.8); }
  return undefined;
};
// gear attach points for the buyable accessories (model units; neck and back ride the bones they sit on)
export const ATTACH_S1 = {
  head: { bone: 'head', at: [0, 25.8, 2.8], size: 7.8 },
  face: { bone: 'head', at: [0, 22.8, 6.9], size: 7.8 },
  neck: { bone: 'neck', at: [0, 17.0, 6.6], size: 8.8 },
  back: { bone: 'body', at: [0, 14.6, -4.6], size: 12.6 },
};
export function stage1(o = {}) {
  const M = o.M || MORPH.blue, base = pigeonBody(M);
  const region = o.bodyRegion ? (...a) => { const r = o.bodyRegion(...a); return r !== undefined ? r : base(...a); } : base;
  const bodyP = plumage({ O: S1.EC, R: S1.R, cols: M.slate, region });
  const neckPt = neckP({ ...S1.neck, cols: M.head, below: M.slate, ir: M.ir, region: o.neckRegion });
  const headPt = plumage({ O: S1.head.O, R: S1.head.R, cols: M.head, S: 6, RH: 4, region: o.headRegion });
  const [sx, sy, sz] = S1.shoulder;
  const leg = (s) => [P([s * 2.7 - 0.55, 0.3, 0.65], [1.1, 4.0, 1.1], legP), P([s * 2.7 - 1.45, 3.1, -0.25], [2.9, 2.3, 2.9], thighP(M.belly))];
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
      eggBox([-3.4, 7.0, -12.4], [6.8, 5.6, 1.6], bodyP),
      ...(o.bodyExtra || []),
    ] },
    { name: 'tail', parent: 'body', pivot: [0, 7.8, -10.2], rot: [-12, 0, 0], cubes: [
      P([-2.8, 7.3, -19.6], [5.6, 1.0, 9.4], tailP({ fan: true, cols: M.slate, bar: M.bar, petals: o.tailPetals })),
      P([-2.2, 6.9, -15.6], [4.4, 0.5, 5.2], tailP({ cols: M.belly, bar: M.bar })),
    ] },
    { name: 'neck', parent: 'body', pivot: S1.neck.pivot, cubes: [
      P([-4.4, 12.8, -0.6], [8.8, 5.0, 7.2], neckPt),
      P([-3.9, 15.8, 0.2], [7.8, 4.4, 6.2], neckPt),
      ...(o.neckExtra || []),
    ] },
    { name: 'head', parent: 'neck', pivot: S1.head.pivot, cubes: [
      P([-3.9, 19.0, 0.0], [7.8, 5.8, 6.8], headPt),
      P([-3.2, 19.4, -0.6], [6.4, 6.4, 6.9], headPt),
      P([-4.2, 19.1, 0.6], [8.4, 1.9, 5.6], headPt),
      P([-0.8, 21.1, 6.7], [1.6, 0.9, 1.5], cereP),
      P([-0.7, 20.4, 6.8], [1.4, 0.95, 2.9], beakP(6.8, 9.7)),
      P([-0.55, 20.05, 9.3], [1.1, 0.85, 0.85], beakP(6.8, 9.7), { pivot: [0, 20.8, 9.6], rot: [18, 0, 0] }),
      ...(o.headExtra || []),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 20.4, 6.9], cubes: [
      P([-0.6, 19.75, 6.8], [1.2, 0.65, 2.4], beakP(6.8, 9.2)),
      P([-0.65, 20.25, 6.7], [1.3, 0.2, 2.1], mouthP, { outline: false }),
    ] },
  ];
  for (const s of [-1, 1]) {
    const nm = s < 0 ? 'R' : 'L'; if (o['wing' + nm] === false) continue;
    const W = foldedWing(s, [s * sx, sy, sz], { M, ...(o.wingOpts || {}) });
    bones.push({ name: 'wing' + nm, parent: 'body', pivot: [s * sx, sy, sz], rot: [-14, 0, s * 3], cubes: W.arm });
    bones.push({ name: 'hand' + nm, parent: 'wing' + nm, pivot: W.wrist, cubes: W.hand });
  }
  return bones;
}

// ---------------------------------------------------------------- stage 2: the punk (Jungeon ♂ / ♀)
// Taller and upright on long legs: the egg stands at nearly 50°, a long iridescent neck, a spiky crest. It
// wears a black tee printed with a white skeleton (ribcage on the front, spine on the back), its sleeves
// on the arm-wings, and carries its prop in its bill. Prints are laid out in world space so they sit
// square on the chest however the egg is tilted.
export const S2 = {
  EC: [0, 15.2, -0.4], R: [6.2, 6.4, 9.0], pitch: -48,
  neck: { pivot: [0, 20.8, 3.8], O: [0, 23.2, 4.2], R: [4.6, 4.4, 4.0], yTop: 26.6, yBot: 19.6 },
  head: { pivot: [0, 26.2, 4.4], O: [0, 28.9, 4.4], R: [4.6, 4.2, 4.2] },
  eyeAt: [-2.4, 29.2, 8.07], eyeSize: [3.0, 3.1],
  mouth: [0, 26.9, 11.0], bill: [0, 27.0, 10.2], shoulder: [6.0, 20.6, 2.8],
};
const eggToWorld = (q, EC, pitch) => { const a = pitch * D2R, y = q[1] - EC[1], z = q[2] - EC[2]; return [q[0], EC[1] + y * Math.cos(a) - z * Math.sin(a), EC[2] + y * Math.sin(a) + z * Math.cos(a)]; };
const nToWorld = (n, pitch) => { const a = pitch * D2R; return [n[0], n[1] * Math.cos(a) - n[2] * Math.sin(a), n[1] * Math.sin(a) + n[2] * Math.cos(a)]; };
// stepped boxes approximating an ellipsoid (radii R about EC), each tilted by `pitch` about EC
export function eggBoxes(EC, R, pitch, tex) {
  const [a, b, c] = R, B = (rx, ry, rz) => P([EC[0] - rx, EC[1] - ry, EC[2] - rz], [2 * rx, 2 * ry, 2 * rz], tex, { pivot: EC, rot: [pitch, 0, 0] });
  return [B(0.76 * a, 0.76 * b, c), B(a, 0.72 * b, 0.65 * c), B(0.75 * a, b, 0.55 * c), B(0.89 * a, 0.86 * b, 0.39 * c)];
}
const TEE = ['#5c566c', '#3e3a4c', '#2c2836', '#201c28', '#15121a'], BONE = ['#ffffff', '#f2eee4', '#d4ccbe', '#a89e92'];
// the skeleton print in world coordinates (x, y) on the chest: collarbones, sternum, five pairs of ribs
function ribPrint(x, y) {
  const ax = Math.abs(x);
  if (y > 19.6 || y < 10.8) return 0;
  if (y > 18.6 && ax > 0.5 && ax < 4.8 && Math.abs(y - (19.0 + ax * 0.1)) < 0.4) return 1;            // collarbones
  if (ax < 0.6 && y > 12.0 && y < 18.8) return y > 18.2 ? 1 : 2;                                        // sternum
  for (let k = 0; k < 5; k++) {
    const y0 = 17.8 - k * 1.4, len = 4.6 - Math.abs(k - 1.5) * 0.35;
    if (ax > 0.8 && ax < len && Math.abs(y - (y0 - 0.15 * ax * ax + 0.1 * ax)) < 0.4) return ax > len - 0.6 ? 2 : 1;
  }
  return 0;
}
function spinePrint(x, y) {
  const ax = Math.abs(x);
  if (y > 21.0 || y < 11.6) return 0;
  if (ax < 0.6) return (y * 1.3) % 1 < 0.62 ? 1 : 0;
  if (y > 16.4 && y < 20.0 && ax > 1.4 && ax < 4.0 && ax < 1.4 + (20.0 - y) * 0.9) return 2;            // shoulder blades
  return 0;
}
// the tee over the egg: black cotton, a ripped hem, the bones printed white. o.hem: world y of the hem
export function teeRegion(o = {}) {
  const EC = o.EC || S2.EC, pitch = o.pitch ?? S2.pitch, hem = o.hem ?? 11.2, base = o.below;
  return (q, face, n, l, A, B) => {
    const w = eggToWorld(q, EC, pitch), nw = nToWorld(n, pitch);
    const rip = ((A * 7 + 3) % 5 < 2 ? 0.35 : 0) + ((A * 3) % 4 === 0 ? 0.3 : 0);
    if (w[1] < hem + rip) return base ? base(q, face, n, l, A, B) : undefined;
    const k = l > 0.72 ? 0 : l > 0.3 ? 1 : l > -0.22 ? 2 : l > -0.62 ? 3 : 4;
    if (w[1] < hem + rip + 0.36) return TEE[Math.min(4, k + 1)];
    if (face !== 'down') {
      const pr = nw[2] > 0.3 ? ribPrint(w[0], w[1]) : nw[2] < -0.3 ? spinePrint(w[0], w[1]) : 0;
      if (pr) return BONE[Math.min(3, pr + (k > 2 ? 1 : 0))];
    }
    return (A + B * 3) % 11 === 0 && k < 3 ? TEE[Math.max(0, k - 1)] : TEE[k];
  };
}
// a sleeve of the tee on an arm-wing: fabric down to `to` (0..1 along the arm), a white rolled hem
export const teeSleeve = (to = 0.4) => (along, across, face) => {
  if (along > to + 0.08) return undefined;
  if (along > to) return BONE[face === 'east' || face === 'north' ? 2 : 1];
  return TEE[face === 'up' ? 1 : face === 'east' || face === 'north' ? 3 : 2];
};
// a spike of the crest: a tapered feather, dark at the root, its sheen colour at the tip
export const spikeP = (ir) => (p, w, h) => {
  const cx = (w - 1) / 2;
  for (let y = 0; y < h; y++) {
    const v = y / Math.max(1, h - 1), half = (0.15 + 0.85 * v) * (w / 2);
    for (let x = 0; x < w; x++) {
      const dx = x - cx; if (Math.abs(dx) > half) continue;
      const edge = Math.abs(dx) > half - 0.9, H = ir[v < 0.4 ? 0 : v < 0.75 ? 1 : 2];
      p.px(x, y, edge ? (dx < 0 ? H[0] : H[2]) : v > 0.82 ? '#3a3448' : dx < 0 ? H[1] : mx(H[1], H[2], 0.5));
    }
  }
};
export function crestBones(ir, o = {}) {
  const Z = o.z || [6.6, 5.2, 3.8, 2.4, 1.0], Hs = o.h || [3.0, 4.4, 5.4, 4.8, 3.6], y = o.y ?? 31.9, tex = spikeP(ir);
  return Z.map((z, i) => ({ name: 'crest' + i, parent: 'head', pivot: [0, y, z], rot: [-8 - 13 * i, 0, 0], cubes: [
    P([-1.2, y - 0.4, z], [2.4, Hs[i], 0], tex, { plane: 'z' }),
    P([0, y - 0.4, z - 1.0], [0, Hs[i], 2.0], tex, { plane: 'x' }),
  ] }));
}
export const ATTACH_S2 = {
  head: { bone: 'head', at: [0, 32.0, 3.6], size: 8.0 },
  face: { bone: 'head', at: [0, 29.4, 8.1], size: 8.0 },
  neck: { bone: 'neck', at: [0, 22.6, 7.4], size: 8.4 },
  back: { bone: 'body', at: [0, 17.6, -5.4], size: 12.4 },
};
export function stage2(o = {}) {
  const M = o.M || MORPH.blue, EC = S2.EC, R = S2.R;
  const below = (q, face, n, l, A, B) => {
    const w = eggToWorld(q, EC, S2.pitch);
    return featherCol(w[1] < 10.2 && w[2] < -3 ? M.pale : M.belly, l, A, B, 8, 5, face);
  };
  const bodyP = plumage({ O: EC, R, cols: M.slate, region: teeRegion({ below }) });
  const neckPt = neckP({ ...S2.neck, cols: M.head, below: M.slate, ir: M.ir });
  const headPt = plumage({ O: S2.head.O, R: S2.head.R, cols: M.head, S: 6, RH: 4 });
  const leg = (s) => [P([s * 3.0 - 0.65, 0.3, 1.0], [1.3, 6.4, 1.3], legP), P([s * 3.0 - 1.7, 5.8, -0.2], [3.4, 3.2, 3.2], thighP(M.belly))];
  const arm = (s) => {
    const x = s * 6.0, seg = wingSegP({ ...M, base: [x, 21.0, 5.2], dir: [0, -1, 0], len: 9.4, cdir: [0, 0, -1], chord: 5.0, kind: 'arm', sleeve: teeSleeve(0.38), bar1: 0.56, bar2: 0.74, barW: 0.08 });
    return [P([s < 0 ? x - 1.4 : x, 11.6, 0.2], [1.4, 9.4, 5.0], seg), P([s * 6.7, 12.4, -1.6], [0, 7.8, 2.0], tipsP({ n: 4, cols: M.slate, dir: 'back' }), { plane: 'x' })];
  };
  const hand = (s) => {
    const x = s * 6.0, seg = wingSegP({ ...M, base: [x, 12.4, 4.8], dir: [0, -1, 0], len: 6.0, cdir: [0, 0, -1], chord: 4.2, kind: 'hand' });
    return [P([s < 0 ? x - 1.2 : x, 6.4, 0.6], [1.2, 6.0, 4.2], seg), P([s * 6.6, 3.8, 0.8], [0, 3.0, 3.8], tipsP({ n: 3, long: true, cols: M.prim }), { plane: 'x' })];
  };
  return [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'footR', parent: 'root', pivot: [-3.0, 0, 1.6], cubes: footCubes(-3.0, 1.6, 1.25) },
    { name: 'footL', parent: 'root', pivot: [3.0, 0, 1.6], cubes: footCubes(3.0, 1.6, 1.25) },
    { name: 'legR', parent: 'root', pivot: [-3.0, 8.4, 1.6], cubes: leg(-1) },
    { name: 'legL', parent: 'root', pivot: [3.0, 8.4, 1.6], cubes: leg(1) },
    { name: 'body', parent: 'root', pivot: [0, 13.0, 0], cubes: [...eggBoxes(EC, R, S2.pitch, bodyP), ...(o.bodyExtra || [])] },
    { name: 'tail', parent: 'body', pivot: [0, 9.8, -5.6], rot: [-36, 0, 0], cubes: [
      P([-2.4, 9.3, -13.8], [4.8, 0.9, 8.2], tailP({ fan: true, cols: M.slate, bar: M.bar, petals: o.tailPetals })),
      P([-1.9, 8.95, -10.4], [3.8, 0.5, 4.6], tailP({ cols: M.belly, bar: M.bar })),
    ] },
    { name: 'neck', parent: 'body', pivot: S2.neck.pivot, cubes: [
      P([-4.3, 19.0, 0.4], [8.6, 5.4, 7.4], neckPt),
      P([-3.8, 22.4, 1.0], [7.6, 4.4, 6.4], neckPt),
      ...(o.neckExtra || []),
    ] },
    { name: 'head', parent: 'neck', pivot: S2.head.pivot, cubes: [
      P([-4.0, 25.4, 1.0], [8.0, 6.0, 7.0], headPt),
      P([-3.3, 25.8, 0.4], [6.6, 6.4, 7.0], headPt),
      P([-4.3, 25.5, 1.6], [8.6, 1.9, 5.8], headPt),
      P([-0.85, 27.6, 7.9], [1.7, 0.95, 1.6], cereP),
      P([-0.75, 26.9, 8.0], [1.5, 1.0, 3.1], beakP(8.0, 11.1)),
      P([-0.6, 26.55, 10.5], [1.2, 0.9, 0.9], beakP(8.0, 11.1), { pivot: [0, 27.3, 10.8], rot: [18, 0, 0] }),
      ...(o.headExtra || []),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 26.9, 8.1], cubes: [
      P([-0.65, 26.2, 8.0], [1.3, 0.7, 2.7], beakP(8.0, 10.7)),
      P([-0.7, 26.75, 7.9], [1.4, 0.2, 2.3], mouthP, { outline: false }),
    ] },
    ...crestBones(M.ir, o.crest || {}),
    { name: 'wingR', parent: 'body', pivot: [-6.0, 20.6, 2.8], rot: [-6, 0, -8], cubes: arm(-1) },
    { name: 'handR', parent: 'wingR', pivot: [-6.6, 12.2, 2.6], rot: [-8, 0, 0], cubes: hand(-1) },
    { name: 'wingL', parent: 'body', pivot: [6.0, 20.6, 2.8], rot: [-6, 0, 8], cubes: arm(1) },
    { name: 'handL', parent: 'wingL', pivot: [6.6, 12.2, 2.6], rot: [-8, 0, 0], cubes: hand(1) },
  ];
}

// ---------------------------------------------------------------- stage 2 clips (shared by Jungeon ♂ / ♀)
// o: { prop: 'gun' | 'rose', MZ (muzzle, gun frame), BLOOM (bloom centre, rose frame), sway (♀ swings her hips more) }
const CRESTS = ['crest0', 'crest1', 'crest2', 'crest3', 'crest4'];
const flare = (P, k) => CRESTS.forEach((c, i) => P.rot(c, -10 * k * (1 + i * 0.2), 0, 0).scl(c, 1, 1 + 0.25 * k, 1));
const ES = (P, x, y = x) => P.scl('eyeR', x, y, 1).scl('eyeL', x, y, 1);
export function jungeonClips(o) {
  const gun = o.prop === 'gun', PB = gun ? 'gun' : 'rose', TIP = gun ? o.MZ : o.BLOOM, sw = o.sway ?? 1;
  const L = 8.0, pl = (P, dy) => plant(P, dy, L);
  const prop = gun
    ? (P, t, k = 1) => P.rot('gun', wave(t, 1.3) * 3 * k, wave(t, 0.9, 1) * 4 * k, 0)          // chewing it like a cigar
    : (P, t, k = 1) => P.rot('rose', wave(t, 0.7) * 8 * k, 0, wave(t, 1.1) * 4 * k);
  return {
    // a punk bounce to a beat only it can hear: two beats a loop, the head nodding hard on each, shoulders
    // shrugging in turn, a foot tapping the off-beat, the prop chewed at the corner of the bill
    idle: { len: 1.6, loop: true, f(P, t) {
      const b = bounce(t, 0.8, { squash: 0.06, stretch: 0.03 }), dy = b.u * 1.0 - 0.5, ph = (t / 0.8) % 1;
      const s = wave(t, 1 / 1.6);
      P.pos('body', s * 0.4 * sw, dy, 0).sq('body', b.sq).rot('body', 0, s * 4 * sw, -s * 3 * sw); pl(P, dy);
      const nod = Math.max(0, Math.sin(ph * Math.PI * 2 - 0.6)) ** 2;
      P.rot('head', 12 * nod - 3, s * 6, s * 4 * sw).pos('neck', 0, -0.4 * nod, 0.6 * nod);
      P.rot('wingR', 0, 0, -3 - 4 * Math.max(0, s)).rot('wingL', 0, 0, 3 + 4 * Math.max(0, -s)).rot('handR', 4 * nod, 0, 0).rot('handL', 4 * nod, 0, 0);
      P.pos('footR', 0, 0.9 * bump(ph, 0.45, 0.75), 0).rot('footR', -14 * bump(ph, 0.45, 0.75), 0, 0);
      P.rot('tail', 0, -s * 10 * sw, 0); prop(P, t); ES(P, 1 + 0.06 * nod, 1 - 0.14 * nod);
      const dart = Math.round(wave(t, 1 / 1.6, 0.5)) * 0.25; P.pos('eyeR', dart, 0, 0).pos('eyeL', dart, 0, 0);
      if (gun) P.rot('jaw', 3 + 3 * Math.max(0, wave(t, 1.3)));
    } },
    // the swagger: a loose head-bob strut, shoulders rolling, wings swinging like arms
    walk: { len: 0.72, loop: true, f(P, t) {
      const r = strut(P, t, 0.72, { Z: 2.6, H: 2.0, A: 1.8, roll: 5 * sw, yaw: 8 * sw, bounce: 0.9, tilt: -2 });
      plant(P, 0, L);
      P.rot('wingR', -r.s * 14, 0, -2).rot('wingL', r.s * 14, 0, 2).rot('handR', -8 - r.s * 6, 0, 0).rot('handL', -8 + r.s * 6, 0, 0);
      prop(P, t, 0.6);
    } },
    // battle cry: a crouch, then three headbangs with the crest flaring, wings flung wide, a scream round the prop
    cry: { len: 2.0, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.4, E.out)), up = seg(t, 0.36, 0.5, E.back) * (1 - seg(t, 1.45, 1.85, E.inout));
      let bang = 0; for (const b0 of [0.55, 0.85, 1.15]) bang += bump(t, b0, b0 + 0.26);
      const dy = -2.0 * crouch + 0.8 * up - 0.6 * bang; P.pos('body', 0, dy, 0).sq('body', -0.1 * crouch + wob(t, 1.8, 0.04, 3, 5)); pl(P, dy);
      P.rot('head', 18 * crouch - 18 * up + 34 * bang, 0, 0).rot('body', 10 * crouch - 8 * up + 10 * bang, 0, 0).pos('neck', 0, 0, 0.8 * bang);
      P.rot('wingR', -30 * up, 0, -70 * up).rot('wingL', -30 * up, 0, 70 * up).rot('handR', 0, 0, -20 * up).rot('handL', 0, 0, 20 * up);
      P.rot('jaw', 6 * crouch + 26 * up); flare(P, up);
      P.face('eyes', up > 0.3 ? 'angry' : crouch > 0.3 ? 'shut' : undefined); P.scl('eyeR', 1, 1 + 0.25 * up, 1).scl('eyeL', 1, 1 + 0.25 * up, 1); P.lookW = 1 - up;
      P.burst(0.5, 'anger', 'head', [5, 34, 4], {}).burst(0.55, 'sparkle', 'head', [0, 36, 3], { n: 6 }).burst(0.86, 'note', 'head', [-5, 34, 3], {}).burst(1.16, 'note', 'head', [5, 34, 3], {});
      if (!gun) P.burst(0.6, 'pg_petal', 'rose', TIP, { n: 10 });
    } },
    // attack: winds the head back, lunges and whips the prop across — a pistol-whip with the revolver in its
    // bill, a thorny lash with the rose
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const wind = seg(t, 0, 0.3, E.out) * (1 - seg(t, 0.3, 0.38, E.in)), hit = seg(t, 0.3, 0.42, E.in3) * (1 - seg(t, 0.56, 0.95, E.inout));
      P.pos('root', 0, 0, key([[0, 0], [0.3, -1.4], [0.42, 6, 'out'], [0.6, 5.2], [1.0, 0]], t));
      P.rot('head', -12 * wind + 18 * hit, 42 * wind - 52 * hit, 10 * wind - 14 * hit).rot('body', -8 * wind + 14 * hit, 22 * wind - 26 * hit, 0);
      P.rot('wingR', -20 * wind, 0, -26 * wind + 10 * hit).rot('wingL', 20 * hit, 0, 26 * hit);
      const dy = -1.2 * wind + wob(t, 0.42, -0.9, 3, 6); P.pos('body', 0, dy, 0).sq('body', -0.06 * wind + wob(t, 0.42, 0.06, 4, 7)); pl(P, dy);
      flare(P, hit); P.face('eyes', t > 0.05 && t < 0.32 ? 'angry' : t < 0.8 ? 'shut' : undefined); ES(P, 1 + 0.15 * hit, 1 - 0.2 * wind);
      P.burst(0.1, 'anger', 'head', [5, 34, 4], {});
      P.burst(0.42, 'spark', PB, TIP, { scale: 1.3 }).burst(0.42, 'star', PB, TIP, { n: 5 });
      if (!gun) P.burst(0.42, 'pg_petal', 'rose', TIP, { n: 8, speed: 1.6 });
    } },
    special: gun ? {
      // the shot: it levels the revolver with its whole head, squints… BANG — flash, shockwave, sparks; the
      // recoil snaps its head back, and it lets the smoke curl out of the corner of its bill
      len: 2.0, next: 'idle', f(P, t) {
        const aim = seg(t, 0.05, 0.4, E.back) * (1 - seg(t, 1.5, 1.9, E.inout));
        P.rot('head', 6 * aim, 18 * aim, -6 * aim).rot('body', 0, 10 * aim, 0).rot('wingR', -10 * aim, 0, -16 * aim);
        P.face('eyes', t > 0.3 && t < 0.74 ? 'angry' : t < 0.95 ? 'shock' : t < 1.7 ? 'sleepy' : undefined); ES(P, 1 + 0.2 * bump(t, 0.74, 0.95), 1 - 0.3 * seg(t, 0.4, 0.7) * (1 - seg(t, 0.72, 0.76)) + 0.35 * bump(t, 0.74, 0.95));
        const kick = seg(t, 0.74, 0.78, E.out) * (1 - seg(t, 0.78, 1.2, E.inout));
        P.rot('head', -30 * kick, 0, 0).rot('body', -8 * kick, 0, 0).pos('body', 0, 0.4 * kick, -1.6 * kick).sq('body', wob(t, 0.76, 0.05, 4, 6)); flare(P, kick);
        P.burst(0.75, 'pg_flash', 'gun', TIP, {}).burst(0.75, 'ring', 'gun', TIP, { scale: 1.4 }).burst(0.75, 'spark', 'gun', TIP, { scale: 1.6 });
        P.burst(0.75, 'ember', 'gun', TIP, { n: 14, dir: [0, 0.15, 1], speed: 2.2, spread: 0.35 });
        if (t > 0.8 && t < 1.6) P.stream('pg_smoke', 'gun', TIP, { rate: 12, dir: [0, 1, 0.2] });
        P.burst(1.4, 'pg_smoke', 'head', S2.mouth, { n: 6, dir: [1, 0.3, 0.6], speed: 1.0, spread: 0.3 }).rot('jaw', 8 * bump(t, 1.3, 1.6));
      } } : {
      // petal storm: it whirls on one foot, petals pouring off the rose in its bill into a spiralling column,
      // then whips its head forward and the storm tears across at the target
      len: 2.2, next: 'idle', f(P, t) {
        const whirl = seg(t, 0.15, 1.25, E.inout); P.rot('root', 0, 720 * whirl, 0).pos('root', 0, 1.4 * Math.sin(whirl * Math.PI), 0);
        const out = seg(t, 0, 0.2, E.out) * (1 - seg(t, 1.25, 1.4)); P.rot('wingR', 0, 0, -60 * out).rot('wingL', 0, 0, 60 * out).pos('footL', 0, 1.6 * out, 0);
        const fling = seg(t, 1.25, 1.36, E.out) * (1 - seg(t, 1.6, 2.0, E.inout));
        P.rot('head', 22 * fling, 0, 0).rot('body', 10 * fling, 0, 0).pos('root', 0, 0, 2 * fling); flare(P, out + fling);
        P.face('eyes', whirl > 0.05 && whirl < 0.95 ? 'happy' : fling > 0.3 ? 'angry' : t > 1.7 ? 'wink' : undefined); P.lookW = 1 - out; ES(P, 1, 1 + 0.2 * fling);
        if (t > 0.2 && t < 1.3) P.stream('pg_petal', 'root', [0, 8, 0], { rate: 80, dir: [0, 1, 0], speed: 2.4, spread: 1 }).stream('pg_petal', 'rose', TIP, { rate: 30, speed: 1.2 });
        P.burst(1.3, 'pg_petal', 'rose', TIP, { n: 44, dir: [0, 0.2, 1], speed: 3.4, spread: 0.45 }).burst(1.3, 'sparkle', 'rose', TIP, { n: 8, dir: [0, 0, 1], speed: 2 }).burst(1.32, 'ring', 'rose', TIP, { scale: 1.2 });
      } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.2, 0.65, E.inout));
      P.pos('root', 0, 0, -2.6 * k).rot('body', -14 * k + wob(t, 0.2, 4, 3, 6), 0, wave(t, 16) * 4 * k).sq('body', -0.12 * k);
      P.rot('head', -20 * k, 0, 10 * k).scl('neck', 1 + 0.14 * k).rot('wingR', -20 * k, 0, -30 * k).rot('wingL', -20 * k, 0, 30 * k).rot('tail', 16 * k, 0, 0); flare(P, k);
      P.face('eyes', t < 0.1 ? 'shock' : t < 0.42 ? 'shut' : undefined); ES(P, 1 + 0.25 * bump(t, 0, 0.12), 1 + 0.4 * bump(t, 0, 0.12) - 0.25 * bump(t, 0.12, 0.42));
      P.burst(0.05, 'sweat', 'head', [5, 32, 6], { n: 2, dir: [1, 0.6, 0] });
      P.burst(0.02, 'pg_feather', 'body', [0, 16, 2], { n: 8, speed: 1.6 }).burst(0.02, 'spark', 'body', [0, 18, 7], {});
    } },
    // staggers like the end of a long night, knees go, and it topples onto its back-side, legs in the air
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.95, 1.45, E.bounce);
      P.rot('body', wave(t, 1.5) * 8 * dizzy, wave(t, 1.8) * 14 * dizzy, wave(t, 2.2) * 8 * dizzy).rot('head', 0, wave(t, 2.2, 1) * 22 * dizzy, wave(t, 1.6) * 14 * dizzy);
      const dy = -2.4 * dizzy; P.pos('body', 0, dy, 0); pl(P, dy);
      P.rot('root', 0, 0, -84 * fall).pos('root', 6.8 * fall, 6.4 * fall, 0);
      P.rot('legR', -24 * fall, 0, 10 * fall).rot('legL', 20 * fall, 0, 16 * fall).rot('wingL', 0, 0, -20 * fall).rot('wingR', -30 * fall, 0, -30 * fall).rot('head', 0, 0, -16 * fall).rot('jaw', 22 * fall);
      CRESTS.forEach((c, i) => P.rot(c, 20 * fall, 0, 0));
      P.face('eyes', t < 0.45 ? 'teary' : 'swirl'); ES(P, 1 + 0.15 * bump(t, 0.4, 0.7), 1 + 0.15 * bump(t, 0.4, 0.7)); P.burst(0.3, 'tear', 'head', [-4, 29, 8], { n: 3, dir: [-1, 0.5, 0.5] }); P.blinkOK = false; P.lookW = 0;
      P.burst(0.25, 'star', 'head', [0, 35, 2], { n: 5 }).burst(1.45, 'dust', 'root', [8, 1, 0], { n: 8, spread: 1 }).burst(1.45, 'pg_feather', 'body', [0, 16, 0], { n: 5, speed: 1 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      P.rot('root', 0, 0, -84).pos('root', 6.8, 6.4, 0);
      P.rot('legR', -24 + wave(t, 0.42) * 6, 0, 10).rot('legL', 20, 0, 16).rot('footR', wave(t, 0.84) * 10 * bump(t, 1.2, 1.7), 0, 0);
      P.rot('wingL', 0, 0, -20).rot('wingR', -30, 0, -30).rot('head', 0, 0, -16).rot('jaw', 22 + wave(t, 0.42, 1) * 4);
      CRESTS.forEach((c) => P.rot(c, 20, 0, 0));
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.burst(0.5, 'star', 'head', [0, 35, 2], { n: 2 });
    } },
    // victory: air guitar — one wing holds the neck high, the other strums, the head bangs, notes fly
    win: { len: 2.2, next: 'idle', f(P, t) {
      const pose = seg(t, 0, 0.25, E.back) * (1 - seg(t, 1.85, 2.2, E.inout)), strum = Math.sin(t * Math.PI * 2 * 4) * pose;
      P.rot('wingL', -70 * pose, -20 * pose, 40 * pose).rot('handL', -30 * pose, 0, 0);
      P.rot('wingR', -40 * pose + strum * 12, 0, 20 * pose).rot('handR', -40 * pose, 0, strum * 10);
      const bang = Math.max(0, Math.sin(t * Math.PI * 2 * 2)) * pose; P.rot('head', 22 * bang - 6 * pose, 0, 10 * pose).rot('body', 6 * bang, 0, -6 * pose);
      const dy = -0.8 * bang; P.pos('body', 0, dy, 0); pl(P, dy); P.pos('footR', 0, 1.2 * bump(t, 0.3, 0.6) + 1.2 * bump(t, 1.1, 1.4), 0); flare(P, pose);
      P.face('eyes', pose > 0.4 ? (t < 1.4 ? 'star' : 'happy') : undefined); ES(P, 1 + 0.12 * pose, 1 + 0.12 * pose - 0.25 * bang);
      P.burst(0.3, 'note', 'head', [5, 34, 4], {}).burst(0.7, 'note', 'head', [-5, 34, 4], {}).burst(1.1, 'note', 'head', [4, 35, 3], {}).burst(1.5, 'sparkle', PB, TIP, { n: 4 });
    } },
    // asleep on its feet: slumped, the head lolling onto its chest, the prop drooping, Zzz
    sleep: { len: 3.4, loop: true, f(P, t) {
      const br = Math.sin((t / 3.4) * Math.PI * 2), dy = -2.4 + br * 0.3;
      P.pos('body', 0, dy, 0).rot('body', 8 + br * 2, 0, 0); pl(P, dy);
      P.rot('head', 34 + br * 3, 0, 14).pos('neck', 0, -1.0, 0.6).rot('wingR', 10, 0, 6).rot('wingL', 10, 0, -6).rot('handR', 10, 0, 0).rot('handL', 10, 0, 0);
      P.rot(PB, gun ? 20 : 30, 0, 0); CRESTS.forEach((c) => P.rot(c, 14, 0, 0));
      P.face('eyes', 'closed'); ES(P, 1.05, 0.8 + 0.06 * br); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'head', [3, 33, 6], {}).burst(2.0, 'z', 'head', [3, 33, 6], {});
    } },
    // fidget: shifts the revolver to the other corner of its bill like a cigar / twirls the rose by its stem
    chew: { len: 2.2, next: 'idle', f(P, t) {
      if (gun) { const sl = seg(t, 0.3, 0.7, E.inout) * (1 - seg(t, 1.5, 1.9, E.inout)); P.pos('gun', 2.2 * sl, 0, 0).rot('gun', 0, 50 * sl, 0); }
      else P.rot('rose', 360 * seg(t, 0.3, 1.5, E.inout), 0, 0);
      const ch = Math.max(0, Math.sin(t * Math.PI * 2 * 3)) * bump(t, 0.2, 2.0); P.rot('jaw', 8 * ch).rot('head', -4 * ch, 6 * wave(t, 0.5), 0);
      P.face('eyes', t > 0.8 && t < 1.6 ? (gun ? 'sleepy' : 'wink') : undefined); ES(P, 1, 1 - 0.15 * bump(t, 0.75, 1.65));
      if (!gun) P.burst(0.9, 'pg_petal', 'rose', TIP, { n: 2, speed: 0.5 });
    } },
    // fidget: three punk stomps, dust kicked up, the crest shaking
    stomp: { len: 1.5, next: 'idle', f(P, t) {
      for (const [t0, s] of [[0.15, 'R'], [0.55, 'L'], [0.95, 'R']]) {
        const k = bump(t, t0, t0 + 0.26);
        P.pos('foot' + s, 0, 2.6 * k, 0).pos('leg' + s, 0, 2.0 * k, 0).rot('body', 0, 0, (s === 'R' ? 6 : -6) * k);
        P.burst(t0 + 0.27, 'dust', 'foot' + s, [s === 'R' ? -3 : 3, 0.5, 2], { n: 4, dir: [0, 0.3, 1], spread: 1, speed: 0.6, scale: 0.7 });
        P.sq('body', -0.06 * bump(t, t0 + 0.24, t0 + 0.36)); flare(P, bump(t, t0 + 0.24, t0 + 0.4) * 0.6);
      }
      P.rot('head', 8 + 8 * Math.max(0, wave(t, 2.5)), 0, 0); P.face('eyes', 'angry'); P.burst(0.2, 'anger', 'head', [-5, 34, 4], {});
    } },
    // fidget: a bow down for a crumb (the prop never leaves its bill)
    peck: { len: 2.0, next: 'idle', f(P, t) {
      const look = seg(t, 0, 0.3, E.out) * (1 - seg(t, 1.45, 1.9, E.inout)), pk = peck(t, 0.55, 0.3) + peck(t, 0.95, 0.3);
      P.rot('body', 34 * look + 8 * pk, 0, 0).rot('head', 26 * look + 20 * pk, 0, 0).pos('neck', 0, -1.6 * look - 1.6 * pk, 1.8 * look + 2 * pk);
      const dy = -1.2 * look; P.pos('body', 0, dy, 0); pl(P, dy); P.rot('tail', -14 * look, 0, 0);
      P.face('eyes', t < 0.4 ? 'wide' : t > 1.3 && t < 1.8 ? 'happy' : undefined); ES(P, 1 + 0.15 * bump(t, 0.05, 0.45), 1 + 0.25 * bump(t, 0.05, 0.45));
      P.burst(0.68, 'pg_crumb', 'root', [0, 0.4, 13], { n: 6, dir: [0, 1, 0.4] }).burst(1.08, 'pg_crumb', 'root', [0, 0.4, 13], { n: 6, dir: [0, 1, 0.4] });
    } },
  };
}

// ---------------------------------------------------------------- drip: the cool extras (tier 2 / 3 accessories)
// a single-cut electric guitar (original): a sunburst body with cream binding, a black pickguard, two
// humbuckers and a chrome bridge, a dark fretboard with dot inlays, a black headstock with gold tuners.
// Built round the body's centre c, the neck along +y, the top facing +z. o: { k, id, hide, finish: [centre, edge] }
export function guitarCubes(c, o = {}) {
  const k = o.k || 1, [cx, cy, cz] = c, Q = (x, y, z) => [cx + x * k, cy + y * k, cz + z * k], S = (a, b, d) => [a * k, b * k, d * k];
  const tag = { id: o.id, hide: !!o.hide }, fin = o.finish || ['#ffc040', '#e0601c', '#8a1e14', '#3a0c0a'];
  const top = (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (face === 'south') {
        const d = Math.hypot((x + 0.5) / w - 0.5, ((y + 0.5) / h - 0.55) * 0.9) * 2;
        p.px(x, y, d < 0.45 ? fin[0] : d < 0.75 ? fin[1] : d < 0.95 ? fin[2] : fin[3]);
      } else p.px(x, y, face === 'north' ? '#4a1a10' : (y === 1 || y === h - 2) ? '#f4ead0' : fin[2]);
    }
    if (face === 'south' && o.pick !== false) {           // pickguard, pickups, bridge, knobs
      const m = Math.floor(w / 2);
      for (let y = Math.floor(h * 0.18); y < h * 0.62; y++) for (let x = m + 1; x < w - 2; x++) if (x - m < (y - h * 0.1) * 0.6) p.px(x, y, '#141018');
      for (const yy of [Math.floor(h * 0.3), Math.floor(h * 0.5)]) for (let x = m - 2; x <= m + 2; x++) { p.px(x, yy, '#1a1a22'); p.px(x, yy + 1, x % 2 ? '#c8ccd8' : '#1a1a22'); }
      for (let x = m - 2; x <= m + 2; x++) p.px(x, Math.floor(h * 0.68), '#e8ecf4');
      p.px(w - 3, h - 4, '#ffd060'); p.px(w - 5, h - 3, '#ffd060'); p.px(w - 3, h - 2, '#ffd060');
    }
  };
  const board = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'south' ? (y % 3 === 0 ? '#c8c0b0' : '#2a1a14') : '#5a2a18'); if (face === 'south') for (const y of [4, 8, 12, 16]) if (y < h) p.px(Math.floor(w / 2), y + 1, '#f4f0e8'); };
  const head = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'south' ? (y === 1 && x > 0 && x < w - 1 ? '#ffd060' : '#141018') : '#1e1820'); if (face === 'east' || face === 'west') for (let y = 2; y < h; y += 2) p.px(1, y, '#e0d8b0'); };
  return [
    P(Q(-3.0, -3.0, -0.6), S(6.0, 4.2, 1.2), top, tag),
    P(Q(-2.7, 1.0, -0.6), S(4.0, 2.8, 1.2), top, tag),
    P(Q(1.1, 1.0, -0.55), S(1.0, 1.4, 1.1), top, tag),
    P(Q(-0.45, 3.6, -0.3), S(0.9, 8.0, 0.6), board, tag),
    P(Q(-0.8, 11.5, -0.35), S(1.6, 2.6, 0.5), head, tag),
    P(Q(-2.0, -2.2, -0.75), S(4.0, 0.5, 0.2), (p, w, h) => p.rect(0, 0, w, h, '#2a1a10'), { ...tag, outline: false }),
  ];
}
// shades pushed up on the head: two lenses on a bridge, temples running back. Built round the bridge point c,
// facing +z. o: { k, id, hide, kind: 'aviator' | 'heart', lens, frame }
export function shadesCubes(c, o = {}) {
  const k = o.k || 1, [cx, cy, cz] = c, Q = (x, y, z) => [cx + x * k, cy + y * k, cz + z * k], S = (a, b, d) => [a * k, b * k, d * k];
  const tag = { id: o.id, hide: !!o.hide }, frame = o.frame || '#ffd060', heart = o.kind === 'heart';
  const lens = (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / w * 2 - 1, v = (y + 0.5) / h;
      let inL = heart ? ((u * 1.1) ** 2 + ((v - 0.45) * 1.6 - Math.sqrt(Math.abs(u)) * 0.55) ** 2 <= 0.9) : (u * u * 0.9 + (v - 0.42) ** 2 * 3.2 <= 1 + (v > 0.5 ? -0.25 * (1 - Math.abs(u)) : 0));
      if (face !== 'south' && face !== 'north') { p.px(x, y, frame); continue; }
      if (!inL) { p.px(x, y, 0); continue; }
      const L = o.lens || (heart ? ['#ff6a8a', '#e0204a', '#8a0c2a'] : ['#f0f6ff', '#8aa0c8', '#2a3456']);
      p.px(x, y, v < 0.3 ? L[0] : v < 0.62 ? L[1] : L[2]);
    }
    if (face === 'south') p.px(Math.floor(w * 0.3), Math.floor(h * 0.25), '#ffffff');
  };
  const gold = (p, w, h) => p.rect(0, 0, w, h, frame);
  return [
    P(Q(-2.6, -1.0, -0.1), S(2.3, 2.0, 0.25), lens, tag), P(Q(0.3, -1.0, -0.1), S(2.3, 2.0, 0.25), lens, { ...tag, mirror: true }),
    P(Q(-0.45, 0.45, -0.1), S(0.9, 0.3, 0.3), gold, tag),
    P(Q(-2.7, 0.45, -3.2), S(0.25, 0.25, 3.2), gold, tag), P(Q(2.45, 0.45, -3.2), S(0.25, 0.25, 3.2), gold, tag),
  ];
}
// a studded choker round a neck box (x half-width xs, from z0 to z1 at height y) with a little rose pendant
export function chokerCubes(o) {
  const { xs, y, z0, z1, id, hide } = o, h = o.h ?? 1.0, t = 0.4, tag = { id, hide: !!hide };
  const band = (p, w, hh, face) => { for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) p.px(i, j, j === 0 ? '#4a4458' : '#1a1622'); if (face !== 'up' && face !== 'down') for (let i = 1; i < w - 1; i += 3) { p.px(i, 1, '#ffffff'); if (hh > 2) p.px(i, 2, '#9aa4c4'); } };
  return [
    P([-xs - t, y, z1 - 0.05], [2 * xs + 2 * t, h, t], band, tag), P([-xs - t, y, z0 - t + 0.05], [2 * xs + 2 * t, h, t], band, tag),
    P([-xs - t, y, z0], [t, h, z1 - z0], band, tag), P([xs, y, z0], [t, h, z1 - z0], band, tag),
    ...rose([0, y - 0.9, z1 + 0.6], 0.42, { stem: 0, leaves: false, id, hide }),
  ];
}
// a gold rope chain round a neck box (xs half-width, z0…z1, at height y), a drop link and a pendant hanging on the
// chest at `at`: 'rose' | 'skull' | 'heart' | 'cross'
const GOLD = ['#fff4b0', '#ffd23e', '#d89a22', '#9a6414'];
const ropeP = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, (i + j) % 3 === 0 ? GOLD[0] : (i + j) % 3 === 1 ? GOLD[1] : GOLD[face === 'down' ? 3 : 2]); };
export function chainCubes(o) {
  const { xs, y, z0, z1, at, id, kind = 'rose' } = o, t = 0.42, tag = { id, hide: true };
  const out = [
    P([-xs - t, y, z1 - 0.05], [2 * xs + 2 * t, t, t], ropeP, tag), P([-xs - t, y, z0 - t + 0.05], [2 * xs + 2 * t, t, t], ropeP, tag),
    P([-xs - t, y, z0], [t, t, z1 - z0], ropeP, tag), P([xs, y, z0], [t, t, z1 - z0], ropeP, tag),
  ];
  // the drop: a short run of chain from the ring's front down to the pendant
  const [px, py, pz] = at, dy = y - py, dz = pz - z1, len = Math.hypot(dy, dz), ang = Math.atan2(dz, dy) * 180 / Math.PI;
  out.push(P([px - 0.2, y - len, z1 + 0.1], [0.4, len, 0.4], ropeP, { ...tag, pivot: [px, y, z1 + 0.3], rot: [ang, 0, 0] }));
  const g = (p, w, h) => p.rect(0, 0, w, h, GOLD[1]);
  if (kind === 'rose') out.push(...rose([px, py - 0.4, pz + 0.3], 0.5, { stem: 0, leaves: false, id, hide: true }));
  if (kind === 'heart') out.push(P([px - 0.9, py - 1.6, pz], [1.8, 1.6, 0], (p, w, h) => { const c = (w - 1) / 2; for (let yy = 0; yy < h; yy++) for (let x = 0; x < w; x++) { const u = (x - c) / (w / 2), v = (yy - h * 0.35) / (h / 2); if ((u * u + v * v - 0.5) ** 3 - u * u * v * v * v < 0.02) p.px(x, yy, x < c && yy < h / 2 ? '#ff8aa0' : '#e0204a'); } }, { plane: 'z', ...tag }));
  if (kind === 'cross') out.push(P([px - 0.25, py - 2.2, pz], [0.5, 2.2, 0.35], g, tag), P([px - 0.8, py - 0.9, pz], [1.6, 0.45, 0.35], g, tag));
  if (kind === 'skull') out.push(P([px - 0.65, py - 1.5, pz], [1.3, 1.3, 0.6], (p, w, h, face) => { p.rect(0, 0, w, h, face === 'south' ? '#f2ecdc' : '#c8bca8'); if (face === 'south') { p.px(1, 1, '#1a0c14'); p.px(w - 2, 1, '#1a0c14'); p.px(Math.floor(w / 2), h - 1, '#1a0c14'); } }, tag));
  return out;
}
// a black felt cowboy hat sitting at c (the crown's base centre): a wide brim curled up at the sides, a pinched
// crown, a silver-studded band
export function cowboyHatCubes(c, o = {}) {
  const k = o.k || 1, [cx, cy, cz] = c, Q = (x, y, z) => [cx + x * k, cy + y * k, cz + z * k], S = (a, b, d) => [a * k, b * k, d * k], tag = { id: o.id, hide: true };
  const felt = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? (j === Math.floor(h / 2) ? '#120f16' : '#3a3646') : face === 'down' ? '#0c0a10' : j === 0 ? '#4a4658' : '#221e2a'); };
  const band = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, '#8a1424'); if (face !== 'up' && face !== 'down') for (let i = 1; i < w; i += 3) p.px(i, Math.floor(h / 2), '#e8ecf4'); };
  return [
    P(Q(-4.6, 0, -4.4), S(9.2, 0.45, 8.8), felt, tag),
    P(Q(-6.4, 0.2, -3.6), S(1.9, 0.4, 7.2), felt, { ...tag, pivot: Q(-4.6, 0.2, 0), rot: [0, 0, -30] }),
    P(Q(4.5, 0.2, -3.6), S(1.9, 0.4, 7.2), felt, { ...tag, pivot: Q(4.6, 0.2, 0), rot: [0, 0, 30] }),
    P(Q(-3.0, 0.4, -2.8), S(6.0, 3.4, 5.6), felt, tag),
    P(Q(-3.05, 0.4, -2.85), S(6.1, 0.9, 5.7), band, tag),
  ];
}
// spiked leather shoulder pads on an arm-wing (s −1 right, +1 left) at the shoulder point sh; spikes of chrome
export function padCubes(s, sh, o = {}) {
  const [x, y, z] = sh, k = o.k || 1, tag = { id: o.id, hide: true }, leather = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? '#4c485c' : j === 0 ? '#5a566c' : j === h - 1 ? '#121016' : '#2a2632'); if (face !== 'up' && face !== 'down') for (let i = 1; i < w - 1; i += 3) p.px(i, h - 2, '#c8ccd8'); };
  const spike = (p, w, h) => { const c = (w - 1) / 2; for (let j = 0; j < h; j++) { const hw = ((j + 0.6) / h) * (w / 2); for (let i = 0; i < w; i++) if (Math.abs(i - c) <= hw) p.px(i, j, i < c ? '#ffffff' : '#9aa4c4'); } };
  const bx = s < 0 ? x - 2.0 * k : x - 0.6 * k, out = [P([bx, y - 1.0 * k, z - 2.2 * k], [2.6 * k, 1.6 * k, 4.4 * k], leather, tag)];
  for (const dz of [-1.2, 0.2, 1.6]) for (const a of [0, 90]) out.push(P([x + s * 0.7 * k - 0.5 * k, y + 0.5 * k, z + dz * k], [1.0 * k, 1.5 * k, 0], spike, { plane: 'z', pivot: [x + s * 0.7 * k, y + 0.5 * k, z + dz * k], rot: [0, a, s * -20], ...tag }));
  return out;
}
// the stage-1 bandana: black cotton with rose buds round the brow and over the crown, a knot at the back (on the
// head bone), plus its two tails as spring bones and a tucked rose on another
export function bandanaS1(id, o = {}) {
  const B = roseBandanaP(o), B2 = roseBandanaP({ ...o, phase: 3 }), t = { id, hide: true };
  return {
    head: [
      P([-4.15, 23.95, 6.75], [8.3, 1.4, 0.42], B, t), P([-4.15, 23.95, -0.85], [8.3, 1.4, 0.42], B2, t),
      P([-4.15, 23.95, -0.45], [0.42, 1.4, 7.2], B2, t), P([3.73, 23.95, -0.45], [0.42, 1.4, 7.2], B, t),
      ...(o.headband ? [] : [P([-3.95, 24.8, -0.8], [7.9, 0.9, 7.55], B, t), P([-3.0, 25.7, 0.0], [6.0, 0.4, 6.0], B, t)]),
      P([-1.1, 23.4, -1.8], [2.2, 2.0, 1.0], B, t),
    ],
    bones: [
      { name: 'bandR', parent: 'head', pivot: [-0.5, 24.0, -1.8], rot: [-30, -12, 0], cubes: [P([-0.5, 22.4, -5.8], [0, 2.0, 4.0], B, { plane: 'x', ...t })] },
      { name: 'bandL', parent: 'head', pivot: [0.5, 23.6, -1.8], rot: [-44, 14, 0], cubes: [P([0.5, 22.2, -5.2], [0, 1.8, 3.4], B2, { plane: 'x', ...t })] },
      { name: 'bud', parent: 'head', pivot: [4.0, 24.7, 2.6], rot: [0, 0, -62], cubes: rose([4.0, 25.6, 2.6], 0.64, { stem: 0, leaves: false, id, hide: true }) },
    ],
  };
}
// a rose tucked behind the head feathers (stage 1 head), on its own spring bone `name`
export const tuckedRose = (name, id, at = [3.6, 23.4, 1.0]) => ({ name, parent: 'head', pivot: at, rot: [-16, 18, -52], cubes: [
  ...rose([at[0], at[1] + 0.9, at[2]], 0.62, { stem: 0.6, leaves: false, id, hide: true }),
  P([at[0] - 0.3, at[1] - 0.4, at[2] - 1.6], [0, 1.0, 2.0], leafP, { plane: 'x', id, hide: true }),
] });

// the stage-2 kerchief: a red rose-bud bandana knotted round the neck, its front a ripped triangle hinged out over
// the chest, two tails on spring bones (scarfR / scarfL)
export function kerchiefS2(id) {
  const RED = ['#ff7a68', '#e2343e', '#b01c30', '#7a1026', '#4a0a1a'], CREAM = ['#fffaf2', '#f6e6dc', '#e8ccc4', '#c8a8a4', '#9a7a7a'];
  const K = roseBandanaP({ cols: RED, bud: CREAM }), K2 = roseBandanaP({ cols: RED, bud: CREAM, phase: 3 }), t = { id, hide: true };
  const tri = (p, w, h, face, c) => {
    K(p, w, h, 'south', c);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const u = Math.abs((i + 0.5) / w * 2 - 1), v = (j + 0.5) / h, rip = ((i * 5 + j * 3) % 7 === 0) ? 0.08 : 0;
      if (u > 1 - v * 0.92 - rip) p.px(i, j, 0); else if (u > 1 - v * 0.92 - 0.12) p.px(i, j, '#5a0c1c');
    }
  };
  return {
    neck: [
      P([-4.55, 19.4, 7.62], [9.1, 1.3, 0.42], K, t), P([-4.55, 19.4, -0.02], [9.1, 1.3, 0.42], K2, t),
      P([-4.55, 19.4, 0.4], [0.42, 1.3, 7.3], K2, t), P([4.13, 19.4, 0.4], [0.42, 1.3, 7.3], K, t),
      P([-3.2, 16.6, 8.1], [6.4, 3.2, 0], tri, { plane: 'z', pivot: [0, 19.8, 8.1], rot: [-30, 0, 0], ...t }),
      P([-1.0, 18.6, -0.9], [2.0, 1.8, 1.0], K, t),
    ],
    bones: [
      { name: 'scarfR', parent: 'neck', pivot: [-0.5, 19.6, -0.9], rot: [-24, -14, 0], cubes: [P([-0.5, 17.6, -4.6], [0, 2.2, 3.8], K, { plane: 'x', ...t })] },
      { name: 'scarfL', parent: 'neck', pivot: [0.5, 19.2, -0.9], rot: [-38, 16, 0], cubes: [P([0.5, 17.4, -4.0], [0, 1.8, 3.2], K2, { plane: 'x', ...t })] },
    ],
  };
}
