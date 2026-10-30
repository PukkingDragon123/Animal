// Voxel props for Downtown (dt_*), 16 voxels per metre, registered into the shared PROPS table.
// Every kind faces +z (south) at yaw 0: yaw π/2 turns its front to the east, −π/2 to the west, π to the north.
import { PROPS } from '../voxprops.js';
import { GLOW } from '../../fine.js';

const disc = (F, cx, cz, y0, y1, r, c) => { for (let y = y0; y <= y1; y++) for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) ** 2 + (z - cz) ** 2 <= r * r) F.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c); };
const ball = (F, cx, cy, cz, r, c) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2 <= r * r) F.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c); };
export const vox = { disc, ball };
/** a random source whose first value is fixed (lets a stock kind like 'car' pick a chosen colour) */
const first = (v) => { let n = 0; return () => (n++ ? 0.5 : v); };

const add = (kind, def) => { PROPS[kind] = def; };

// ---------------------------------------------------------------- arena
// floodlight mast: a tall steel pole, maintenance rungs and a bank of six lamps facing +z
add('dt_flood', { size: [32, 196, 24], r: 0.32, build(F) {
  const p = F.c('#5a6070'), p2 = F.c('#7a8090'), base = F.c('#a8a49c'), fr = F.c('#2a2e38'), lamp = F.c('#fffbe0', GLOW), lamp2 = F.c('#ffe9a0', GLOW), rung = F.c('#3a3e48');
  F.box(12, 0, 8, 19, 6, 15, base);
  disc(F, 15.5, 11.5, 7, 176, 2.6, (x, y) => (y % 24 < 2 ? p2 : p));
  for (let y = 20; y < 170; y += 6) F.box(19, y, 11, 20, y, 12, rung);
  F.box(2, 172, 10, 29, 173, 12, fr); F.box(2, 194, 10, 29, 195, 12, fr); F.box(2, 172, 10, 3, 195, 12, fr); F.box(28, 172, 10, 29, 195, 12, fr);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const x = 4 + i * 8, y = 175 + j * 10; F.box(x, y, 12, x + 7, y + 8, 18, fr); F.box(x + 1, y + 1, 19, x + 6, y + 7, 19, (i + j) & 1 ? lamp : lamp2); }
} });
// chain-link fence panel (2 m × 3 m): a diamond lattice you can see through, posts and rails
add('dt_fence', { size: [32, 48, 4], r: [2.0, 0.22], build(F) {
  const post = F.c('#6a7080'), rail = F.c('#8a909a'), wire = F.c('#a8b0b8');
  for (let x = 4; x < 30; x += 5) F.box(x, 2, 2, x, 45, 2, wire); for (let y = 6; y < 45; y += 6) F.box(1, y, 2, 30, y, 2, wire);
  F.box(0, 0, 1, 1, 47, 2, post); F.box(30, 0, 1, 31, 47, 2, post); F.box(0, 46, 1, 31, 47, 2, rail); F.box(0, 1, 2, 31, 1, 2, rail); F.box(0, 24, 2, 31, 24, 2, rail);
} });
// low painted railing (2 m × 1.1 m) for the camera-facing sides of the court
add('dt_rail', { size: [32, 18, 4], r: [2.0, 0.22], build(F) {
  const y = F.c('#f0c040'), y2 = F.c('#c89a2a'), k = F.c('#2a2e38');
  F.box(0, 0, 1, 1, 17, 2, k); F.box(30, 0, 1, 31, 17, 2, k); F.box(0, 16, 1, 31, 17, 2, (x) => (x % 8 < 4 ? y : k)); F.box(0, 8, 2, 31, 8, 2, y2);
  for (let x = 4; x < 30; x += 4) F.box(x, 1, 2, x, 15, 2, y2);
} });
// team bench with a backrest and a water cooler
add('dt_teambench', { size: [48, 16, 12], r: [3.0, 0.7], build(F) {
  const m = F.c('#2a2e38'), s = F.c('#3a6ad8'), s2 = F.c('#2a52b0'), cool = F.c('#e8473a'), lid = F.c('#f4f0e8');
  for (const x of [2, 22, 42]) F.box(x, 0, 2, x + 1, 6, 9, m);
  F.box(0, 6, 1, 47, 7, 8, s); F.box(0, 8, 9, 47, 14, 10, s2); F.box(0, 6, 9, 47, 7, 10, m);
  disc(F, 4, 5, 8, 13, 3, cool); disc(F, 4, 5, 14, 14, 3, lid);
} });
// spray cans + a step ladder (the graffiti artist's corner)
add('dt_spray', { size: [24, 26, 12], r: [1.2, 0.6], build(F) {
  const l = F.c('#9aa0aa'), l2 = F.c('#6a707a'), cans = ['#e8473a', '#3ad8a8', '#f0c040', '#a85ae8', '#3a8ad8'].map((c) => F.c(c)), cap = F.c('#f4f0e8');
  for (const x of [2, 12]) { F.box(x, 0, 2, x + 1, 25, 3, l); F.box(x, 0, 9, x + 1, 22, 10, l2); }
  for (let y = 4; y < 24; y += 5) F.box(2, y, 2, 13, y, 3, l);
  cans.forEach((c, i) => { const x = 15 + (i % 3) * 3, z = 4 + Math.floor(i / 3) * 4; F.box(x, 0, z, x + 1, 4, z + 1, c); F.set(x, 5, z, cap); });
} });

// ---------------------------------------------------------------- lab
// the healing machine: a console with six glowing capsule slots, a pink cross and a status screen
add('dt_heal', { size: [48, 42, 22], r: [3.0, 1.35], build(F) {
  const w = F.c('#eef2f4'), w2 = F.c('#c8d4da'), mint = F.c('#5ad8c0'), pink = F.c('#ff6a8a', GLOW), red = F.c('#ff4a5a', GLOW), scr = F.c('#7af0ff', GLOW), scr2 = F.c('#2aa8c8', GLOW), dk = F.c('#2a3440'), slot = F.c('#ffd0dc', GLOW);
  F.box(0, 0, 0, 47, 17, 21, w); F.box(0, 0, 21, 47, 2, 21, w2); F.box(0, 17, 0, 47, 18, 21, mint);
  F.box(2, 19, 2, 45, 21, 19, w2);
  for (let i = 0; i < 6; i++) { const x = 5 + i * 7; F.box(x, 22, 7, x + 4, 22, 12, dk); ball(F, x + 2, 24, 9.5, 2.2, i & 1 ? pink : slot); }
  F.box(4, 22, 0, 43, 41, 4, w); F.box(6, 26, 4, 41, 39, 4, dk); F.box(7, 27, 5, 40, 38, 5, scr2);
  for (let x = 8; x < 40; x++) { const y = 32 + Math.round(Math.sin(x * 0.6) * 3 * (x % 9 < 4 ? 1 : 0.2)); F.set(x, y, 5, scr); }
  F.box(20, 4, 21, 27, 13, 21, red); F.box(17, 7, 21, 30, 10, 21, red);
  F.box(2, 4, 21, 6, 6, 21, mint); F.box(41, 4, 21, 45, 6, 21, mint);
} });
// starter capsule on a small table-top pedestal under a glass dome: red / blue / pink
for (const [k, top, ring] of [['r', '#e8503a', '#ffb07a'], ['b', '#3a8ad8', '#8ae0ff'], ['p', '#ff5a8a', '#ffc0d8']]) add('dt_pedestal_' + k, { size: [12, 17, 12], r: 0, build(F) {
  const w = F.c('#eef2f4'), w2 = F.c('#b8c4cc'), g = F.c(ring, GLOW), t = F.c(top), t2 = F.c(top, GLOW), wh = F.c('#f8f8f4'), band = F.c('#2a2e38'), btn = F.c('#ffffff', GLOW), glass = F.c('#d8f4ff');
  disc(F, 6, 6, 0, 1, 5.4, w2); disc(F, 6, 6, 2, 4, 3.4, w); disc(F, 6, 6, 5, 5, 5, g);
  // an upright pill capsule: coloured cap, pearly lower half, a glowing gem on the seam
  disc(F, 6, 6, 7, 12, 2.2, (x, y) => (y >= 10 ? t : wh)); disc(F, 6, 6, 13, 13, 1.4, t); disc(F, 6, 6, 6, 6, 1.4, wh); F.set(6, 10, 8, btn); F.set(6, 13, 6, t2);
  for (let y = 6; y < 16; y++) { const r = Math.sqrt(Math.max(0, 22 - (y - 6) ** 2 * 0.22)); for (let a = 0; a < 20; a++) { if ((a + y) % 3) continue; F.set(Math.round(6 + Math.cos(a * 0.314) * r), y, Math.round(6 + Math.sin(a * 0.314) * r), glass); } }
} });
add('dt_monitor', { size: [14, 12, 6], r: 0, build(F) { const k = F.c('#2a2e38'), s = F.c('#7ad8ff', GLOW), s2 = F.c('#d8f8ff', GLOW); F.box(5, 0, 1, 8, 1, 4, k); F.box(6, 2, 2, 7, 3, 3, k); F.box(0, 4, 2, 13, 11, 3, k); F.box(1, 5, 4, 12, 10, 4, s); F.box(2, 8, 4, 7, 8, 4, s2); F.box(2, 6, 4, 9, 6, 4, s2); } });
// boba cups on a counter, a neon crescent moon, a café table with two stools
add('dt_cups', { size: [18, 8, 6], r: 0, build(F) { const lid = F.c('#ffffff'), st = F.c('#ff6a8a'), pearl = F.c('#3a2a2a'); ['#c89a6a', '#a878d8', '#ffc84a', '#8ad8a0'].forEach((c, i) => { const x = 1 + i * 4, cc = F.c(c); F.box(x, 0, 2, x + 2, 4, 4, cc); F.box(x, 1, 2, x + 2, 1, 2, pearl); F.box(x, 5, 2, x + 2, 5, 4, lid); F.box(x + 1, 6, 3, x + 1, 7, 3, st); }); } });
add('dt_neonmoon', { size: [22, 22, 3], r: 0, build(F) { const n = F.c('#fff0a0', GLOW), p = F.c('#ff8ad8', GLOW); for (let y = 0; y < 22; y++) for (let x = 0; x < 22; x++) { const a = Math.hypot(x - 11, y - 11), b = Math.hypot(x - 15, y - 14); if (a <= 10.5 && a > 8.8 && b > 8.6) F.set(x, y, 1, n); else if (a <= 10.5 && b > 8.6 && b <= 9.6) F.set(x, y, 1, n); } for (const [x, y] of [[17, 4], [19, 8], [4, 18]]) { F.set(x, y, 1, p); F.set(x + 1, y, 1, p); F.set(x, y + 1, 1, p); F.set(x - 1, y, 1, p); F.set(x, y - 1, 1, p); } } });
add('dt_cafetable', { size: [28, 13, 12], r: [1.4, 0.6], build(F) {
  const t = F.c('#f4ecf8'), t2 = F.c('#d8c8e8'), m = F.c('#7a6a8a'), s = F.c('#b890e0'), s2 = F.c('#ffc0d8');
  disc(F, 14, 6, 11, 12, 5.5, t); disc(F, 14, 6, 11, 11, 5.5, t2); F.box(13, 0, 5, 14, 10, 6, m); disc(F, 14, 6, 0, 0, 3, m);
  for (const [x, c] of [[4, s], [24, s2]]) { disc(F, x, 6, 7, 8, 2.6, c); F.box(x, 0, 6, x, 6, 6, m); disc(F, x, 6, 0, 0, 1.8, m); }
} });
// analyser: a lab machine with a glowing waveform screen, dials and a capsule slot
add('dt_machine', { size: [32, 38, 18], r: [2.0, 1.1], build(F, r) {
  const w = F.c('#dfe6ea'), w2 = F.c('#b8c4cc'), dk = F.c('#28323c'), scr = F.c('#1e6a8a', GLOW), wave = F.c('#9affd8', GLOW), led = ['#ff5a5a', '#5aff8a', '#ffd84a', '#5ac8ff'].map((c) => F.c(c, GLOW)), mint = F.c('#5ad8c0');
  F.box(0, 0, 0, 31, 30, 17, w); F.box(0, 30, 0, 31, 31, 17, w2); F.box(0, 0, 17, 31, 1, 17, w2);
  F.box(3, 16, 17, 22, 28, 17, dk); F.box(4, 17, 17, 21, 27, 17, scr);
  for (let x = 4; x <= 21; x++) F.set(x, 22 + Math.round(Math.sin(x * 0.9) * 3), 17, wave);
  for (let i = 0; i < 8; i++) F.set(25 + (i % 2) * 3, 18 + Math.floor(i / 2) * 3, 17, led[Math.floor(r() * 4)]);
  F.box(4, 6, 17, 14, 11, 17, dk); disc(F, 9, 8.5, 6, 11, 0, mint);
  for (const x of [19, 25]) { disc(F, x, 17, 7, 10, 0, dk); F.box(x - 1, 7, 17, x + 1, 9, 17, dk); }
  F.box(6, 31, 4, 25, 37, 12, w2); F.box(8, 33, 12, 23, 35, 12, led[3]);
} });
// server rack with blinking LEDs
add('dt_server', { size: [14, 36, 14], r: 0.5, build(F, r) {
  const b = F.c('#2a2e38'), b2 = F.c('#3a404c'), led = ['#5aff8a', '#5ac8ff', '#ffd84a', '#ff5a5a'].map((c) => F.c(c, GLOW));
  F.box(0, 0, 0, 13, 35, 13, b); for (let y = 3; y < 34; y += 3) { F.box(1, y, 13, 12, y + 1, 13, b2); for (let x = 2; x < 12; x += 2) if (r() < 0.5) F.set(x, y + 1, 13, led[Math.floor(r() * 4)]); }
} });
// specimen tank: glass cylinder of glowing liquid with bubbles
add('dt_tank', { size: [18, 38, 18], r: 0.55, build(F, r) {
  const m = F.c('#8a96a4'), m2 = F.c('#5a6470'), liq = F.c('#5affc8', GLOW), liq2 = F.c('#2ad8a8', GLOW), bub = F.c('#e8fff8', GLOW), sp = F.c('#ff8ab0', GLOW);
  disc(F, 9, 9, 0, 4, 8, m2); disc(F, 9, 9, 33, 37, 8, m2); disc(F, 9, 9, 4, 4, 8.4, m);
  disc(F, 9, 9, 5, 32, 7, (x, y, z) => ((x + z + y) % 5 ? liq : liq2));
  for (let i = 0; i < 14; i++) F.set(4 + Math.floor(r() * 10), 7 + Math.floor(r() * 24), 15 + Math.floor(r() * 2), bub);
  ball(F, 9, 18, 13, 3, sp);
} });
// a lab desk with a glowing monitor, keyboard and mug
add('dt_desk', { size: [28, 26, 14], r: [1.75, 0.85], build(F) {
  const t = F.c('#e8eef0'), leg = F.c('#8a96a4'), mon = F.c('#2a2e38'), scr = F.c('#5ac8ff', GLOW), scr2 = F.c('#c8f4ff', GLOW), kb = F.c('#c8d0d8'), mug = F.c('#ff6a8a');
  F.box(0, 11, 0, 27, 12, 13, t); for (const x of [1, 25]) F.box(x, 0, 1, x + 1, 10, 12, leg);
  F.box(8, 13, 2, 19, 13, 4, mon); F.box(12, 13, 2, 15, 15, 3, mon); F.box(5, 16, 2, 22, 25, 3, mon); F.box(6, 17, 4, 21, 24, 4, scr);
  for (let i = 0; i < 4; i++) F.box(8, 18 + i * 2, 4, 8 + 4 + ((i * 5) % 9), 18 + i * 2, 4, scr2);
  F.box(8, 13, 7, 19, 13, 10, kb); F.box(23, 13, 8, 24, 15, 9, mug);
} });
add('dt_plant', { size: [12, 26, 12], r: 0.35, build(F, r) {
  const pot = F.c('#e8e4dc'), pot2 = F.c('#5ad8c0'), L = ['#3a8a4a', '#4aa05a', '#5ab86a', '#2e7040'].map((c) => F.c(c));
  disc(F, 6, 6, 0, 7, 4, pot); disc(F, 6, 6, 6, 7, 4.4, pot2);
  for (let i = 0; i < 26; i++) { const a = r() * 6.28, len = 4 + r() * 6, h = 8 + Math.floor(r() * 10); for (let t = 0; t < len; t++) F.set(Math.round(6 + Math.cos(a) * t * 0.6), h + Math.round(t * 0.7), Math.round(6 + Math.sin(a) * t * 0.6), L[i % 4]); }
} });
add('dt_sofa', { size: [40, 14, 16], r: [2.5, 1.0], build(F) {
  const c = F.c('#3aa8a0'), c2 = F.c('#2a8a84'), leg = F.c('#4a3a2a'), pil = F.c('#f0c040');
  F.box(0, 1, 0, 39, 5, 15, c); F.box(0, 6, 0, 39, 13, 4, c2); F.box(0, 6, 0, 4, 9, 15, c2); F.box(35, 6, 0, 39, 9, 15, c2);
  for (let i = 0; i < 3; i++) F.box(5 + i * 10, 6, 5, 14 + i * 10, 7, 14, c);
  for (const x of [1, 37]) for (const z of [1, 13]) F.box(x, 0, z, x + 1, 0, z + 1, leg);
  F.box(6, 8, 5, 10, 11, 6, pil);
} });
// cash register / coffee machine / hot snack warmer (counter-top props: place with { y: counter height })
add('dt_register', { size: [10, 10, 8], r: 0, build(F) { const b = F.c('#2a2e38'), s = F.c('#5aff9a', GLOW), k = F.c('#c8d0d8'); F.box(0, 0, 0, 9, 3, 7, b); F.box(1, 4, 0, 8, 4, 5, k); F.box(2, 5, 0, 7, 9, 1, b); F.box(3, 6, 1, 6, 8, 1, s); } });
add('dt_coffee', { size: [10, 12, 8], r: 0, build(F) { const b = F.c('#3a3e48'), r2 = F.c('#e8473a'), g = F.c('#ffd84a', GLOW), cup = F.c('#f4f0e8'); F.box(0, 0, 0, 9, 11, 7, b); F.box(0, 9, 0, 9, 11, 7, r2); F.box(2, 2, 6, 7, 6, 7, F.c('#1a1a22')); F.box(4, 2, 6, 5, 4, 7, cup); F.box(2, 8, 7, 3, 8, 7, g); } });
add('dt_warmer', { size: [14, 10, 8], r: 0, build(F) { const b = F.c('#c8ccd4'), gl = F.c('#ffb84a', GLOW), food = ['#e8a050', '#c86a3a', '#f0d080'].map((c) => F.c(c)); F.box(0, 0, 0, 13, 9, 7, b); F.box(1, 1, 7, 12, 8, 7, gl); for (let i = 0; i < 5; i++) F.box(2 + i * 2, 2, 3, 3 + i * 2, 3, 6, food[i % 3]); F.box(2 + 2, 5, 3, 11, 6, 6, food[1]); } });
// capsule-toy (gacha) machine: glass globe of colourful capsules
add('dt_gacha', { size: [14, 28, 12], r: 0.45, build(F, r) {
  const b = F.c('#ff6a8a'), b2 = F.c('#d84a6a'), gl = F.c('#e8f8ff', GLOW), caps = ['#f0c040', '#3a8ad8', '#5ad86a', '#e8473a', '#a85ae8', '#ffffff'].map((c) => F.c(c, GLOW)), k = F.c('#2a2e38');
  F.box(1, 0, 1, 12, 13, 10, b); F.box(1, 0, 10, 12, 1, 10, b2); disc(F, 6.5, 5.5, 4, 4, 0, k); F.box(5, 6, 11, 8, 9, 11, k); F.box(5, 3, 11, 8, 4, 11, F.c('#f4f0e8'));
  ball(F, 6.5, 20, 5.5, 6, (x, y, z) => ((x === 1 || x === 12 || z === 0 || z === 11 || y === 26) ? gl : caps[Math.floor(r() * 6)]));
  F.box(4, 26, 3, 9, 27, 8, b);
} });
add('dt_atm', { size: [12, 28, 10], r: 0.42, build(F) { const b = F.c('#3a4a6a'), b2 = F.c('#2a3450'), s = F.c('#7ad8ff', GLOW), k = F.c('#c8d0d8'), g = F.c('#5aff8a', GLOW); F.box(0, 0, 0, 11, 27, 9, b); F.box(0, 24, 0, 11, 27, 9, b2); F.box(2, 15, 9, 9, 21, 9, s); F.box(2, 10, 9, 9, 13, 9, k); F.box(3, 25, 9, 8, 26, 9, g); } });

// ---------------------------------------------------------------- streets
// newsstand kiosk: green box, magazines fanned out in front, striped awning
add('dt_kiosk', { size: [40, 46, 28], r: [2.4, 1.6], build(F, r) {
  const g = F.c('#2a7a5a'), g2 = F.c('#1e5a42'), aw = F.c('#f0c040'), aw2 = F.c('#e8473a'), win = F.c('#ffe8b0', GLOW), mags = ['#e8473a', '#3a8ad8', '#f0c040', '#e890b0', '#5ab06a', '#f4f0ea', '#a85ae8'].map((c) => F.c(c));
  F.box(2, 0, 2, 37, 34, 21, g); F.box(2, 34, 1, 37, 37, 22, g2); F.box(8, 14, 21, 31, 28, 21, win);
  for (let x = 0; x < 40; x++) F.box(x, 31 - Math.floor(x % 8 < 4 ? 0 : 0), 22, x, 33, 27, x % 8 < 4 ? aw : aw2);
  for (let i = 0; i < 3; i++) F.box(3, 2 + i * 4, 22, 36, 2 + i * 4, 25 - i, g2);
  for (let i = 0; i < 3; i++) for (let x = 4; x < 35; x += 4) F.box(x, 3 + i * 4, 22 + (2 - i), x + 2, 6 + i * 4, 22 + (2 - i), mags[Math.floor(r() * mags.length)]);
  F.box(10, 38, 6, 29, 45, 7, F.c('#f4f0e8')); F.box(11, 40, 7, 28, 43, 7, aw2);
} });
// three newspaper boxes
add('dt_newsbox', { size: [24, 18, 9], r: [1.5, 0.55], build(F) {
  ['#e8473a', '#3a6ad8', '#f0c040'].forEach((c, i) => { const b = F.c(c), d = F.c('#2a2e38'), p = F.c('#f4f0ea'), x = i * 8; F.box(x + 1, 0, 1, x + 1, 5, 2, d); F.box(x + 6, 0, 1, x + 6, 5, 2, d); F.box(x, 6, 0, x + 7, 16, 8, b); F.box(x + 1, 11, 8, x + 6, 15, 8, p); F.box(x + 2, 12, 8, x + 5, 12, 8, d); F.box(x, 17, 0, x + 7, 17, 8, d); });
} });
add('dt_meter', { size: [6, 22, 6], r: 0.1, build(F) { const p = F.c('#5a6070'), h = F.c('#c8ccd4'), r = F.c('#e8473a'), s = F.c('#9affb0', GLOW); F.box(2, 0, 2, 3, 14, 3, p); F.box(0, 15, 1, 5, 20, 4, h); F.box(1, 17, 5, 4, 19, 5, s); F.box(1, 21, 1, 4, 21, 4, r); } });
// traffic light: pole, signal head (green lit) and a walk signal
add('dt_tlight', { size: [16, 76, 16], r: 0.18, build(F) {
  const p = F.c('#3a3e48'), y = F.c('#f0c040'), k = F.c('#1e2028'), rd = F.c('#5a1e1e'), am = F.c('#5a4a1e'), gr = F.c('#5aff8a', GLOW), wk = F.c('#f4f4f0', GLOW);
  disc(F, 8, 8, 0, 2, 3, p); disc(F, 8, 8, 3, 60, 1.2, p);
  F.box(5, 54, 9, 11, 75, 13, y); F.box(6, 55, 14, 10, 74, 14, k);
  disc(F, 8, 14, 70, 72, 0, rd); F.box(7, 69, 14, 9, 72, 14, rd); F.box(7, 63, 14, 9, 66, 14, am); F.box(7, 57, 14, 9, 60, 14, gr);
  F.box(9, 34, 9, 13, 42, 12, k); F.box(10, 35, 13, 12, 40, 13, wk);
} });
add('dt_paystation', { size: [10, 26, 8], r: 0.35, build(F) { const b = F.c('#3a6ad8'), b2 = F.c('#2a4ab0'), s = F.c('#9affd8', GLOW), p = F.c('#f4f0e8'); F.box(0, 0, 0, 9, 25, 7, b); F.box(0, 22, 0, 9, 25, 7, b2); F.box(2, 14, 7, 7, 18, 7, s); F.box(3, 22, 7, 6, 24, 7, p); F.box(2, 8, 7, 7, 10, 7, F.c('#1a1a22')); } });
// "P" parking sign on a pole
add('dt_psign', { size: [12, 44, 4], r: 0.12, build(F) { const p = F.c('#8a909a'), b = F.c('#2a5ad8'), w = F.c('#f4f4f0'); F.box(5, 0, 1, 6, 43, 2, p); F.box(0, 30, 2, 11, 43, 3, b); F.box(3, 32, 3, 4, 41, 3, w); F.box(4, 41, 3, 7, 41, 3, w); F.box(4, 36, 3, 7, 36, 3, w); F.box(8, 37, 3, 8, 40, 3, w); } });
// a bronze Tokonmon statue on a stone plinth (Aoi Plaza)
add('dt_statue', { size: [34, 64, 34], r: [2.0, 2.0], build(F) {
  const s = F.c('#c8c0b4'), s2 = F.c('#a8a094'), s3 = F.c('#e0d8cc'), b = F.c('#4aa890'), b2 = F.c('#3a8a74'), b3 = F.c('#7ad8c0'), k = F.c('#1e3a34'), plq = F.c('#d8b050');
  F.box(1, 0, 1, 32, 3, 32, s2); F.box(4, 4, 4, 29, 22, 29, s); F.box(3, 22, 3, 30, 24, 30, s3); F.box(12, 9, 30, 21, 15, 30, plq);
  ball(F, 17, 35, 17, 10, (x, y) => (y < 31 ? b2 : b)); ball(F, 17, 49, 18, 8, b); ball(F, 13, 52, 21, 2.4, b3);
  for (const sx of [-1, 1]) { F.box(17 + sx * 5 - 1, 55, 16, 17 + sx * 5 + 1, 63, 18, b2); F.box(17 + sx * 5 - 2, 25, 22, 17 + sx * 5 + 2, 27, 27, b2); }
  for (const sx of [-1, 1]) F.box(17 + sx * 3, 49, 25, 17 + sx * 3, 51, 25, k);
  F.box(15, 46, 25, 19, 46, 25, k); ball(F, 17, 36, 27, 3, b3); F.box(26, 30, 14, 31, 33, 19, b2);
} });
// festoon light bulb (hung on strings by the district)
add('dt_bulb', { size: [3, 4, 3], r: 0, build(F) { const g = F.c('#ffe8a0', GLOW), k = F.c('#2a2e38'); F.box(1, 3, 1, 1, 3, 1, k); F.box(0, 0, 0, 2, 2, 2, g); } });
add('dt_parasol', { size: [40, 40, 40], r: 0.6, build(F) {
  const p = F.c('#f4f0e8'), a = F.c('#2ab8a8'), b = F.c('#f8e070'), t = F.c('#e8e4dc'), ch = F.c('#e8473a');
  disc(F, 20, 20, 0, 36, 0.8, p); for (let y = 28; y < 37; y++) disc(F, 20, 20, y, y, (37 - y) * 2.1, (x, yy, z) => (Math.floor(Math.atan2(z - 20, x - 20) * 2.6 + 9) % 2 ? a : b));
  disc(F, 20, 20, 11, 12, 8, t); disc(F, 20, 20, 0, 11, 1, t);
  for (const [x, z] of [[6, 20], [34, 20], [20, 6]]) { F.box(x - 2, 0, z - 2, x + 2, 7, z + 2, ch); }
} });
add('dt_ac', { size: [24, 16, 20], r: [1.5, 1.25], build(F) { const b = F.c('#c8ccd4'), b2 = F.c('#a8acb4'), k = F.c('#3a3e48'); F.box(0, 0, 0, 23, 13, 19, b); F.box(0, 13, 0, 23, 13, 19, b2); disc(F, 12, 10, 14, 15, 7, k); for (let y = 2; y < 12; y += 2) F.box(1, y, 19, 22, y, 19, b2); } });
add('dt_bike', { size: [28, 16, 4], r: [1.6, 0.3], build(F) {
  const f = F.c(['#e8473a', '#3a8ad8', '#f0c040'][0]), k = F.c('#1e2028'), s = F.c('#c8ccd4');
  for (const cx of [5, 22]) for (let a = 0; a < 32; a++) F.set(Math.round(cx + Math.cos(a * 0.196) * 5), Math.round(6 + Math.sin(a * 0.196) * 5), 2, k);
  for (let t = 0; t <= 10; t++) { F.set(5 + t, 6 + Math.round(t * 0.5), 2, f); F.set(13 + Math.round(t * 0.9), 11, 2, f); F.set(13 - Math.round(t * 0.3), 6 + t * 0.5 | 0, 2, f); }
  F.box(11, 12, 1, 14, 12, 3, k); F.box(21, 12, 2, 21, 14, 2, s); F.box(19, 14, 1, 23, 14, 3, s);
} });
// food trucks: a box van with a glowing serving hatch and menu on the +z side, a roof sign
const truck = (body, trim, sign) => ({ size: [88, 60, 44], r: [5.4, 2.4], build(F) {
  const b = F.c(body), t = F.c(trim), k = F.c('#1e2028'), w = F.c('#f4f0e8'), gl = F.c('#8ac8e8'), warm = F.c('#ffd890', GLOW), menu = F.c('#2a2e38'), mtx = F.c('#fff4c0', GLOW), li = F.c('#fff4c0', GLOW), ch = F.c('#c8ccd4');
  F.box(1, 5, 2, 64, 44, 35, b); F.box(1, 5, 2, 64, 9, 35, t); F.box(1, 42, 2, 64, 44, 35, t);
  F.box(65, 5, 4, 86, 30, 33, b); F.box(66, 22, 4, 80, 30, 33, gl); F.box(80, 22, 5, 86, 29, 32, gl); F.box(65, 5, 4, 86, 9, 33, t);
  F.box(86, 7, 8, 87, 10, 12, li); F.box(86, 7, 25, 87, 10, 29, li); F.box(86, 4, 6, 87, 6, 31, ch);
  for (const x of [12, 52, 76]) { disc(F, x, 1, 0, 0, 0, k); F.box(x - 5, 0, 1, x + 5, 9, 4, k); F.box(x - 5, 0, 33, x + 5, 9, 36, k); F.box(x - 2, 3, 37, x + 2, 6, 37, ch); }
  // serving hatch (open, lit inside) with a counter shelf and a propped-up flap
  F.box(8, 18, 35, 44, 34, 35, 0); F.box(8, 18, 33, 44, 34, 34, warm); F.box(7, 17, 35, 45, 17, 37, w);
  for (let i = 0; i < 7; i++) F.box(7, 35 + Math.floor(i * 0.5), 36 + i, 45, 35 + Math.floor(i * 0.5), 36 + i, t);
  F.box(48, 16, 35, 61, 34, 35, menu); for (let y = 19; y < 33; y += 3) F.box(50, y, 35, 50 + ((y * 7) % 9) + 2, y, 35, mtx); F.box(48, 33, 35, 61, 34, 35, t);
  if (sign) sign(F);
} });
add('dt_truck_taco', truck('#f08a3a', '#f4e04a', (F) => { const sh = F.c('#f0c040'), sh2 = F.c('#d8a020'), l = F.c('#5ab84a'), m = F.c('#a8502a'), tm = F.c('#e8473a'); for (let x = 0; x < 30; x++) { const h = Math.round(Math.sqrt(Math.max(0, 225 - (x - 15) ** 2))); F.box(18 + x, 45, 17, 18 + x, 45 + Math.floor(h * 0.7), 20, x % 5 ? sh : sh2); if (h > 4) { F.box(18 + x, 45 + Math.floor(h * 0.7) - 2, 18, 18 + x, 45 + Math.floor(h * 0.7), 19, x % 3 ? l : x % 2 ? tm : m); } } }));
add('dt_truck_ice', truck('#f8b8d0', '#7ad8c8', (F) => { const c = F.c('#e8b070'), c2 = F.c('#c88a50'), s = F.c('#fff0f4'), p = F.c('#ff8ab0'), ch = F.c('#e8473a'); for (let y = 0; y < 10; y++) disc(F, 32, 19, 45 + y, 45 + y, 1 + y * 0.45, (x, yy) => ((x + yy) % 3 ? c : c2)); ball(F, 32, 59, 19, 5, s); ball(F, 32, 57, 19, 4.4, p); F.set(32, 59, 19, ch); }));
add('dt_truck_dumpling', truck('#e8473a', '#f0c040', (F) => { const d = F.c('#f8f0e0'), d2 = F.c('#e0d4bc'), st = F.c('#c8a070'); F.box(20, 45, 14, 44, 47, 24, st); for (const x of [25, 32, 39]) { ball(F, x, 50, 19, 4, (xx, y) => ((xx + y) % 2 ? d : d2)); F.set(x, 54, 19, d2); } }));
// parked cars in every colour of the stock 'car' kind
const CAR_COLS = 6;
for (let i = 0; i < CAR_COLS; i++) add('dt_car' + i, { size: PROPS.car.size, r: PROPS.car.r, build(F) { PROPS.car.build(F, first((i + 0.5) / CAR_COLS)); } });
