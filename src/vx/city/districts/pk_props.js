// Voxel props for Alamo Hill Park (pk_*), 16 voxels per metre, registered into the shared PROPS table.
// Every kind faces +z (south) at yaw 0: yaw π/2 turns its front to the east, −π/2 to the west.
import { PROPS } from '../voxprops.js';
import { GLOW } from '../../fine.js';
import { vox } from './props_dt.js';

const { disc, ball } = vox;
/** a chunky ball made of b×b×b blocks (fewer, bigger faces than a voxel-smooth sphere) */
const ballB = (F, cx, cy, cz, r, c, b = 2) => { for (let y = Math.floor((cy - r) / b) * b; y <= cy + r; y += b) for (let z = Math.floor((cz - r) / b) * b; z <= cz + r; z += b) for (let x = Math.floor((cx - r) / b) * b; x <= cx + r; x += b) { const mx = x + b / 2, my = y + b / 2, mz = z + b / 2; if ((mx - cx) ** 2 + (my - cy) ** 2 + (mz - cz) ** 2 <= r * r) F.box(x, y, z, x + b - 1, y + b - 1, z + b - 1, typeof c === 'function' ? c(mx, my, mz) : c); } };
const add = (kind, def) => { PROPS[kind] = def; };
const line = (F, x0, y0, z0, x1, y1, z1, c, t = 0) => { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0))) + 1; for (let i = 0; i <= n; i++) { const k = i / n, x = Math.round(x0 + (x1 - x0) * k), y = Math.round(y0 + (y1 - y0) * k), z = Math.round(z0 + (z1 - z0) * k); if (t) F.box(x - t, y - t, z - t, x + t, y + t, z + t, c); else F.set(x, y, z, c); } };

// ---------------------------------------------------------------- trees & plants
// Monterey cypress: a leaning trunk and flat, wind-swept layers of dark green (banded colours keep it light)
add('pk_cypress', { size: [88, 104, 72], r: 0.5, build(F) {
  const bark = F.c('#5a3e2a'), L = ['#22502e', '#2e6238', '#3a7444', '#4a864e'].map((c) => F.c(c));
  let x = 40, z = 36; for (let y = 0; y < 50; y++) { x += 0.12; disc(F, x, z, y, y, 3.6 - y / 30, bark); }
  for (const [bx, bz, by, len] of [[-1, -0.3, 34, 22], [1, 0.4, 40, 24], [0.2, 1, 46, 18]]) line(F, x, by, z, x + bx * len, by + 10, z + bz * len * 0.7, bark, 1);
  for (const [cx, cy, cz, rx, ry] of [[44, 56, 36, 28, 6], [26, 64, 30, 15, 5], [62, 66, 42, 17, 5], [44, 76, 36, 19, 5], [46, 86, 34, 11, 4]]) {
    for (let y = -ry; y <= ry; y += 2) for (let zz = -rx; zz <= rx; zz += 2) for (let xx = -rx; xx <= rx; xx += 2) { if (((xx + 1) ** 2 + (zz + 1) ** 2 * 1.6) / (rx * rx) + ((y + 1) ** 2) / (ry * ry) <= 1) F.box(cx + xx, cy + y, cz + zz, cx + xx + 1, cy + y + 1, cz + zz + 1, L[Math.min(3, Math.max(0, Math.floor(((y + ry) / (2 * ry + 1)) * 4)))]); }
  }
} });
// a round leafy park tree (oak-ish), chunky 3-voxel leaf blocks in light bands
add('pk_oak', { size: [60, 90, 60], r: 0.35, build(F) {
  const bark = F.c('#6a4a32'), L = ['#2e6a36', '#3e7e3c', '#55984a'].map((c) => F.c(c));
  disc(F, 30, 30, 0, 44, 3, bark); disc(F, 30, 30, 0, 1, 4.5, bark);
  line(F, 30, 36, 30, 20, 52, 26, bark, 1); line(F, 30, 38, 30, 40, 54, 34, bark, 1);
  for (const [bx, by, bz, br] of [[30, 56, 30, 14], [18, 60, 26, 10], [42, 62, 34, 10], [30, 72, 30, 11]]) ballB(F, bx, by, bz, br, (xx, y) => L[Math.min(2, Math.max(0, Math.floor((y - (by - br)) / (br * 0.7))))], 3);
} });
// cherry blossom: dark trunk and clouds of pink in bands
add('pk_blossom', { size: [64, 84, 64], r: 0.35, build(F) {
  const bark = F.c('#4a3030'), P = ['#e888a8', '#f4a8c0', '#f8c0d4', '#fcd8e4'].map((c) => F.c(c));
  disc(F, 32, 32, 0, 40, 2.6, bark);
  for (const [bx, by, bz] of [[22, 50, 26], [44, 54, 30], [30, 60, 44]]) line(F, 32, 34, 32, bx, by, bz, bark, 1);
  for (const [bx, by, bz, br] of [[32, 58, 32, 13], [20, 52, 26, 10], [46, 56, 30, 10], [30, 66, 44, 10], [38, 70, 24, 9]]) ballB(F, bx, by, bz, br, (x, y) => P[Math.min(3, Math.max(0, Math.floor((y - (by - br)) / (br * 0.55))))], 3);
} });
// a round autumn maple for variety
add('pk_maple', { size: [56, 84, 56], r: 0.35, build(F) {
  const bark = F.c('#5a4232'), L = ['#b8501e', '#d8702a', '#e8903a', '#f0b04a'].map((c) => F.c(c));
  disc(F, 28, 28, 0, 38, 2.8, bark);
  for (const [bx, by, bz, br] of [[28, 50, 28, 12], [18, 56, 26, 9], [38, 58, 30, 9], [28, 66, 32, 10]]) { line(F, 28, 36, 28, bx, by, bz, bark, 1); ballB(F, bx, by, bz, br, (x, y) => L[Math.min(3, Math.max(0, Math.floor((y - (by - br)) / (br * 0.55))))], 3); }
} });
// tall grass: a 2.4 × 2.4 m patch of long blades (wild Tokonmon hide here); one colour per blade keeps it light
add('pk_tallgrass', { size: [38, 20, 38], r: 0, build(F, r) {
  const G = ['#3a8a3a', '#4a9a42', '#5aaa4a', '#2e7a32', '#6ab852'].map((c) => F.c(c)), fl = F.c('#f8e070');
  for (let i = 0; i < 110; i++) { const x = 1 + Math.floor(r() * 36), z = 1 + Math.floor(r() * 36), h = 9 + Math.floor(r() * 10); F.box(x, 0, z, x, h, z, G[i % 5]); if (i % 23 === 0) F.set(x, h + 1, z, fl); }
} });
for (const [k, cols] of [['r', ['#e8303a', '#ff6a6a']], ['y', ['#f8d84a', '#ffb02a']], ['p', ['#b06aff', '#e890f0']], ['w', ['#ffffff', '#f8e8f0']], ['b', ['#4a8ae8', '#8ac0ff']]]) add('pk_flowers_' + k, { size: [16, 10, 16], r: 0, build(F, r) {
  const L = [F.c('#3a8a3a'), F.c('#4a9a42')], C2 = cols.map((c) => F.c(c)), mid = F.c('#f8e070');
  for (let i = 0; i < 26; i++) { const x = 1 + Math.floor(r() * 14), z = 1 + Math.floor(r() * 14), h = 3 + Math.floor(r() * 5); F.box(x, 0, z, x, h, z, L[i & 1]); if (i % 2 === 0) { const c = C2[Math.floor(r() * 2)]; F.set(x, h + 1, z, mid); F.set(x + 1, h + 1, z, c); F.set(x - 1, h + 1, z, c); F.set(x, h + 1, z + 1, c); F.set(x, h + 1, z - 1, c); } }
} });
add('pk_hedge', { size: [32, 16, 14], r: [2.0, 0.85], build(F) { const L = ['#2e6a36', '#3a7a3e', '#4a8a46'].map((c) => F.c(c)); F.box(0, 0, 1, 31, 15, 12, (x, y) => L[y < 6 ? 0 : y < 12 ? 1 : 2]); for (let x = 2; x < 32; x += 5) F.box(x, 15, 1, x + 1, 15, 12, 0); } });
add('pk_reeds', { size: [20, 26, 20], r: 0, build(F, r) { const G = ['#5a8a3a', '#6a9a4a', '#4a7a32'].map((c) => F.c(c)), cat = F.c('#7a4a2a'); for (let i = 0; i < 40; i++) { const x = 2 + Math.floor(r() * 16), z = 2 + Math.floor(r() * 16), h = 10 + Math.floor(r() * 14); F.box(x, 0, z, x, h, z, G[i % 3]); if (i % 5 === 0) F.box(x, h - 3, z, x, h, z, cat); } } });
add('pk_lily', { size: [32, 1, 32], r: 0, build(F, r) { const L = [F.c('#3a8a4a'), F.c('#4aa05a')], fl = [F.c('#ffb0d0'), F.c('#ffffff')], y = F.c('#f8e070'); for (const [cx, cz, rr] of [[8, 9, 4.5], [22, 7, 3.5], [16, 22, 5], [27, 24, 3]]) { disc(F, cx, cz, 0, 0, rr, L[Math.floor(r() * 2)]); F.box(cx, 0, cz, cx + rr, 0, cz, 0); } F.set(16, 0, 22, fl[0]); F.set(17, 0, 22, fl[1]); F.set(16, 0, 23, y); F.set(8, 0, 9, fl[1]); } });
add('pk_rock', { size: [26, 14, 22], r: [1.2, 1.0], build(F, r) { const S = ['#8a8a84', '#9a9a92', '#a8a8a0', '#7a7a74'].map((c) => F.c(c)), m = F.c('#5a8a3a'); ball(F, 11, 4, 11, 8, () => S[Math.floor(r() * 4)]); ball(F, 18, 3, 12, 6, () => S[Math.floor(r() * 4)]); for (let i = 0; i < 20; i++) F.set(4 + Math.floor(r() * 18), 10 + Math.floor(r() * 2), 6 + Math.floor(r() * 10), m); } });

// ---------------------------------------------------------------- playground
add('pk_slide', { size: [64, 52, 32], r: [3.8, 1.8], build(F) {
  const red = F.c('#e8473a'), red2 = F.c('#c8302a'), y = F.c('#f8d84a'), y2 = F.c('#e8b82a'), b = F.c('#3a8ad8'), b2 = F.c('#2a6ab0'), w = F.c('#f4f0e8');
  for (const x of [8, 26]) for (const z of [6, 24]) F.box(x, 0, z, x + 1, 44, z + 1, red);
  F.box(8, 24, 6, 27, 25, 25, w); for (const z of [6, 25]) F.box(8, 26, z, 27, 33, z, (x) => (x % 3 ? 0 : red2)); F.box(8, 33, 6, 27, 33, 25, red2);
  for (let i = 0; i < 6; i++) { F.box(8 - 2 - i * 1.4 | 0, 22 - i * 4, 10, 8 - 1 - i * 1.4 | 0, 22 - i * 4, 21, w); } F.box(0, 0, 9, 1, 24, 9, red2); F.box(0, 0, 22, 1, 24, 22, red2);
  for (let y = 44; y < 52; y++) F.box(8 + (y - 44), y, 6 + (y - 44) * 0.5 | 0, 27 - (y - 44), y, 25 - (y - 44) * 0.5 | 0, y % 2 ? b : b2);
  for (let i = 0; i < 34; i++) { const x = 28 + i, h = 24 - Math.round(i * 0.66); F.box(x, h, 10, x, h + 1, 21, i % 4 < 2 ? y : y2); F.box(x, h + 2, 10, x, h + 3, 10, y2); F.box(x, h + 2, 21, x, h + 3, 21, y2); }
} });
add('pk_swing', { size: [64, 42, 28], r: [3.8, 1.5], build(F) {
  const p = F.c('#3a8ad8'), p2 = F.c('#2a6ab0'), ch = F.c('#a8acb4'), s = [F.c('#f8d84a'), F.c('#e8473a')];
  for (const x of [2, 61]) { line(F, x, 0, 2, x, 40, 14, p, 1); line(F, x, 0, 26, x, 40, 14, p, 1); }
  F.box(2, 40, 13, 61, 41, 15, p2);
  for (const [i, x] of [[0, 18], [1, 42]]) { F.box(x - 4, 39, 14, x - 4, 10, 14, ch); F.box(x + 4, 39, 14, x + 4, 10, 14, ch); F.box(x - 5, 9, 11, x + 5, 9, 17, s[i]); }
} });
add('pk_seesaw', { size: [60, 14, 10], r: [3.6, 0.6], build(F) { const b = F.c('#5ab86a'), m = F.c('#e8473a'), h = F.c('#f8d84a'); F.box(26, 0, 2, 33, 6, 7, m); for (let x = 0; x < 60; x++) F.box(x, Math.round(3 + x * 0.12), 3, x, Math.round(3 + x * 0.12), 6, b); for (const x of [6, 53]) F.box(x, Math.round(4 + x * 0.12), 4, x, Math.round(9 + x * 0.12), 5, h); } });
add('pk_dome', { size: [44, 24, 44], r: [2.6, 2.6], build(F) { const cols = ['#e8473a', '#f8d84a', '#3a8ad8', '#5ab86a'].map((c) => F.c(c)); for (let a = 0; a < 6.28; a += 0.02) for (let b = 0; b < 1.57; b += 0.02) { const x = 22 + Math.cos(a) * Math.cos(b) * 21, y = Math.sin(b) * 22, z = 22 + Math.sin(a) * Math.cos(b) * 21; const ai = Math.round(a / 0.785), bi = Math.round(b / 0.39); if (Math.abs(a - ai * 0.785) < 0.04 || Math.abs(b - bi * 0.39) < 0.03) F.set(Math.round(x), Math.round(y), Math.round(z), cols[(ai + bi) % 4]); } } });
// spring rider: a little round Tokonmon on a big coil
add('pk_spring', { size: [12, 18, 16], r: 0.5, build(F) { const c = F.c('#ff8a3a'), c2 = F.c('#f8d84a'), s = F.c('#a8acb4'), k = F.c('#1e1e28'), h = F.c('#e8473a'); disc(F, 6, 8, 0, 0, 4, s); for (let y = 1; y < 7; y++) for (let a = 0; a < 12; a++) if ((a + y * 3) % 12 < 4) F.set(Math.round(6 + Math.cos(a * 0.52) * 2.5), y, Math.round(8 + Math.sin(a * 0.52) * 2.5), s); ball(F, 6, 11, 8, 4.5, c); ball(F, 6, 14, 12, 3, c); F.set(4, 15, 15, k); F.set(8, 15, 15, k); F.box(3, 17, 11, 4, 17, 12, c2); F.box(8, 17, 11, 9, 17, 12, c2); F.box(2, 13, 6, 10, 13, 6, h); } });
add('pk_picnic', { size: [32, 14, 30], r: [2.0, 1.8], build(F) { const w = F.c('#a8743e'), w2 = F.c('#8a5a30'), w3 = F.c('#c08a50'); F.box(0, 11, 8, 31, 12, 21, w); for (let x = 0; x < 32; x += 6) F.box(x, 12, 8, x, 12, 21, w3); for (const x of [3, 27]) { line(F, x, 0, 5, x, 11, 13, w2, 0); line(F, x, 0, 24, x, 11, 16, w2, 0); F.box(x, 6, 2, x, 6, 27, w2); } F.box(0, 6, 1, 31, 7, 5, w); F.box(0, 6, 24, 31, 7, 28, w); } });
add('pk_blanket', { size: [36, 6, 28], r: 0, build(F) { const a = F.c('#e8473a'), b = F.c('#f4f0e8'), bk = F.c('#a8743e'), bk2 = F.c('#8a5a30'), app = F.c('#e8303a'), br = F.c('#f0c070'); F.box(0, 0, 0, 35, 0, 27, (x, y, z) => ((Math.floor(x / 4) + Math.floor(z / 4)) % 2 ? a : b)); F.box(24, 1, 3, 32, 4, 9, bk); F.box(24, 5, 5, 32, 5, 7, bk2); ball(F, 8, 2, 20, 1.6, app); F.box(12, 1, 4, 18, 2, 7, br); } });

// ---------------------------------------------------------------- park furniture
add('pk_lamp', { size: [14, 66, 14], r: 0.18, build(F) { const p = F.c('#2a4a3a'), p2 = F.c('#3a5a4a'), g = F.c('#fff0c0', GLOW), gold = F.c('#d8b050'); disc(F, 7, 7, 0, 4, 4, p); disc(F, 7, 7, 5, 52, 1.4, (x, y) => (y % 10 ? p : p2)); disc(F, 7, 7, 52, 53, 3, p); ball(F, 7, 58, 7, 4.6, g); disc(F, 7, 7, 62, 63, 2.5, p); F.set(7, 64, 7, gold); F.set(7, 65, 7, gold); } });
add('pk_fence', { size: [32, 16, 2], r: [2.0, 0.16], build(F) { const k = F.c('#2a3a32'), g = F.c('#c8a050'); F.box(0, 13, 0, 31, 13, 1, k); F.box(0, 4, 0, 31, 4, 1, k); for (let x = 1; x < 32; x += 3) { F.box(x, 0, 0, x, 14, 0, k); F.set(x, 15, 0, g); } F.box(0, 0, 0, 1, 15, 1, k); } });
add('pk_telescope', { size: [14, 26, 18], r: 0.4, build(F) { const b = F.c('#3a7ad8'), b2 = F.c('#2a5ab0'), m = F.c('#5a6070'), s = F.c('#c8ccd4'), y = F.c('#f8d84a'), gl = F.c('#9ad8ff', GLOW); disc(F, 7, 9, 0, 1, 4, m); disc(F, 7, 9, 2, 14, 1.4, m); F.box(3, 15, 6, 11, 21, 13, b); F.box(3, 21, 6, 11, 22, 13, b2); F.box(4, 16, 13, 10, 20, 17, b2); F.box(5, 17, 17, 6, 19, 17, gl); F.box(8, 17, 17, 9, 19, 17, gl); F.box(5, 17, 3, 9, 19, 5, s); F.box(11, 17, 8, 11, 19, 10, y); } });
add('pk_spout', { size: [28, 44, 28], r: [1.5, 1.5], build(F, r) {
  const s = F.c('#d8d0c4'), s2 = F.c('#b8b0a4'), w = F.c('#bfeaff', GLOW), w2 = F.c('#ffffff', GLOW), wb = F.c('#7ac8f0');
  disc(F, 14, 14, 0, 6, 9, s2); disc(F, 14, 14, 7, 18, 3, s); disc(F, 14, 14, 18, 20, 8, s2); disc(F, 14, 14, 20, 20, 7, wb); disc(F, 14, 14, 21, 30, 2, s); disc(F, 14, 14, 30, 31, 4, s2);
  for (let y = 31; y < 42; y++) F.box(13, y, 13, 14 + (y > 38 ? 1 : 0), y, 14, y % 3 ? w : w2);
  for (let a = 0; a < 8; a++) for (let t = 0; t < 12; t++) { const x = 14 + Math.cos(a * 0.785) * (2 + t * 0.55), z = 14 + Math.sin(a * 0.785) * (2 + t * 0.55), y = 41 - t * t * 0.18; if (y > 21) F.set(Math.round(x), Math.round(y), Math.round(z), t % 3 ? w : w2); }
  for (let a = 0; a < 6; a++) for (let t = 0; t < 8; t++) { const x = 14 + Math.cos(a * 1.05 + 0.4) * (7 + t * 0.6), z = 14 + Math.sin(a * 1.05 + 0.4) * (7 + t * 0.6), y = 19 - t * t * 0.25; if (y > 2) F.set(Math.round(x), Math.round(y), Math.round(z), w); }
} });
add('pk_hoop', { size: [24, 64, 28], r: 0.3, build(F) { const p = F.c('#3a3e48'), bb = F.c('#f4f4f0'), red = F.c('#e8473a'), o = F.c('#f08a3a'), net = F.c('#e8e8e4'); disc(F, 12, 4, 0, 2, 3.5, p); disc(F, 12, 4, 3, 52, 1.4, p); F.box(12, 48, 4, 12, 50, 10, p); F.box(2, 44, 10, 21, 59, 11, bb); F.box(8, 47, 11, 15, 52, 11, red); F.box(9, 48, 11, 14, 51, 11, bb); for (let a = 0; a < 20; a++) F.set(Math.round(12 + Math.cos(a * 0.314) * 3.5), 47, Math.round(16 + Math.sin(a * 0.314) * 3.5), o); for (let y = 40; y < 47; y++) for (let a = 0; a < 10; a++) if ((a + y) % 2) F.set(Math.round(12 + Math.cos(a * 0.628) * (2.5 + (y - 40) * 0.15)), y, Math.round(16 + Math.sin(a * 0.628) * (2.5 + (y - 40) * 0.15)), net); } });
add('pk_pigeons', { size: [32, 6, 28], r: 0, build(F, r) { const g = F.c('#8a8a98'), g2 = F.c('#6a6a7a'), n = F.c('#5aa08a'), w = F.c('#f4f0e8'), o = F.c('#f08a3a'), cr = F.c('#e8c880'); for (let i = 0; i < 7; i++) { const x = 3 + Math.floor(r() * 24), z = 3 + Math.floor(r() * 20), d = r() < 0.5 ? 1 : -1; F.box(x - 2, 1, z - 1, x + 1, 2, z + 1, g); F.box(x - 2, 3, z - 1, x, 3, z, g2); F.box(x + 1 * d + (d > 0 ? 1 : -1), 3, z, x + 1 * d + (d > 0 ? 1 : -1), 4, z, n); F.set(x + 2 * d + (d > 0 ? 1 : -1), 4, z, g); F.set(x + 3 * d + (d > 0 ? 1 : -1), 4, z, o); F.set(x - 1, 0, z, o); } for (let i = 0; i < 30; i++) F.set(Math.floor(r() * 32), 0, Math.floor(r() * 28), i % 3 ? cr : w); } });
add('pk_duck', { size: [10, 8, 12], r: 0, build(F) { const w = F.c('#f4f0e8'), g = F.c('#3a8a5a'), o = F.c('#f0a03a'), k = F.c('#1e1e28'), b = F.c('#a87a4a'); F.box(2, 0, 2, 7, 3, 9, b); F.box(2, 3, 3, 7, 3, 8, b); F.box(3, 3, 8, 6, 6, 10, g); F.set(3, 5, 10, k); F.set(6, 5, 10, k); F.box(4, 4, 11, 5, 4, 11, o); F.box(3, 3, 1, 6, 4, 2, w); } });
add('pk_signpost', { size: [28, 30, 4], r: [1.6, 0.2], build(F) { const w = F.c('#8a5a30'), w2 = F.c('#a8743e'), g = F.c('#3a6a3a'); for (const x of [3, 24]) F.box(x, 0, 1, x + 1, 29, 2, w); F.box(0, 14, 1, 27, 28, 2, w2); F.box(1, 15, 2, 26, 27, 2, g); F.box(0, 28, 0, 27, 29, 3, w); } });
add('pk_drink', { size: [8, 16, 8], r: 0.2, build(F) { const s = F.c('#8a96a4'), s2 = F.c('#6a7480'), b = F.c('#bfeaff', GLOW); disc(F, 4, 4, 0, 13, 2.5, s); disc(F, 4, 4, 13, 14, 3.5, s2); F.set(4, 15, 4, b); F.set(4, 15, 5, b); } });
add('pk_birdbath', { size: [12, 14, 12], r: 0.4, build(F) { const s = F.c('#d8d0c4'), w = F.c('#7ac8f0'), b = F.c('#e8473a'); disc(F, 6, 6, 0, 1, 4, s); disc(F, 6, 6, 2, 9, 1.6, s); disc(F, 6, 6, 10, 11, 5.5, s); disc(F, 6, 6, 11, 11, 4.5, w); F.box(9, 12, 6, 10, 13, 7, b); } });
// the fountain basin: a round stone rim (7 m across) holding sparkling water
add('pk_basin', { size: [112, 10, 112], r: 0, build(F, r) {
  const s = F.c('#d8d0c4'), s2 = F.c('#b8b0a4'), s3 = F.c('#e8e2d8'), w = F.c('#4aa0d8'), w2 = F.c('#6ab8e8'), sp = F.c('#e8fbff', GLOW), coin = F.c('#f0c040', GLOW);
  for (let z = 0; z < 112; z++) for (let x = 0; x < 112; x++) {
    const d = Math.hypot(x - 55.5, z - 55.5);
    if (d > 55.5) continue;
    if (d > 51) { F.box(x, 0, z, x, 8, z, (d > 54 ? s2 : s)); F.set(x, 9, z, s3); }
    else { F.box(x, 0, z, x, 3, z, s2); F.set(x, 6, z, (x * 7 + z * 3) % 23 < 2 ? w2 : w); if (r() < 0.012) F.set(x, 6, z, sp); if (r() < 0.003) F.set(x, 4, z, coin); }
  }
} });
