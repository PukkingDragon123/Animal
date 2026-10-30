// Voxel-art street furniture for the city (16 voxels per metre): each kind is sculpted once into a
// small Fine volume, meshed with the greedy AO mesher (vertex colours, soft corner shading, glowing
// lamps), and drawn with one InstancedMesh per kind however many times it appears.
import * as THREE from '../../../vendor/three.module.js';
import { Fine, GLOW } from '../fine.js';

const V = 16;   // voxels per metre
const rnd = (seed) => { let x = (seed >>> 0) || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };
const disc = (F, cx, cz, y0, y1, r, c) => { for (let y = y0; y <= y1; y++) for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) ** 2 + (z - cz) ** 2 <= r * r) F.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c); };
const ball = (F, cx, cy, cz, r, c) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2 <= r * r) F.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c); };

/** a blocky canopy ball made of s-voxel cells (s = 2: an 8-per-metre look, a quarter of the faces), coloured by
 *  col(x, y, z, d, dy) per cell; rough > 0 nibbles the surface so clumps read as leafy, not as spheres */
const cball = (F, cx, cy, cz, r, col, s = 2, rough = 0, rr = Math.random) => {
  for (let y = Math.floor((cy - r) / s) * s; y <= cy + r; y += s) for (let z = Math.floor((cz - r) / s) * s; z <= cz + r; z += s) for (let x = Math.floor((cx - r) / s) * s; x <= cx + r; x += s) {
    const dx = x + s / 2 - cx, dy = y + s / 2 - cy, dz = z + s / 2 - cz, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d <= r - (rough ? rr() * rough : 0)) F.box(x, y, z, x + s - 1, y + s - 1, z + s - 1, col(x, y, z, d / r, dy / r));
  }
};
const h3 = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/** a leafy canopy colour: lighter on top (sunlit), darker underneath, varied in 4-voxel chunks so faces still merge */
const leafCol = (L) => (x, y, z, d, dy) => { const k = Math.floor((x >> 2) + (y >> 2) * 3 + (z >> 2) * 7); const v = 0.5 + dy * 0.55 + (d > 0.8 ? 0.12 : -0.05) + (h3(x >> 2, y >> 2, z >> 2) - 0.5) * 0.45 + (k % 11 === 0 ? 0.2 : 0); return L[Math.max(0, Math.min(L.length - 1, Math.floor(v * L.length)))]; };
export const canopy = { cball, leafCol, h3 };

// kind → { size: [X, Y, Z] voxels, r: collision radius (m) or [w, d] box, build(F, rand) }
export const PROPS = {
  tree: { size: [56, 96, 56], r: 0.35, build(F, r) {
    const bark = F.c('#5e4230'), bark2 = F.c('#74543a'), bark3 = F.c('#4a3426'), L = ['#2a5a30', '#356a36', '#43803e', '#539447', '#68a852', '#86bc5e'].map((c) => F.c(c));
    disc(F, 28, 28, 0, 46, 2.6, (x, y) => (((y >> 3) + (x >> 2)) % 4 === 0 ? bark2 : (y >> 4) % 3 === 2 ? bark3 : bark)); disc(F, 28, 28, 0, 2, 4.2, bark3);
    for (const [bx, by, bz] of [[37, 58, 31], [19, 60, 25], [29, 70, 36], [24, 52, 36]]) for (let t = 0; t <= 1; t += 0.08) F.box(Math.round(28 + (bx - 28) * t) - 1, Math.round(38 + (by - 38) * t), Math.round(28 + (bz - 28) * t) - 1, Math.round(28 + (bx - 28) * t), Math.round(38 + (by - 38) * t) + 1, Math.round(28 + (bz - 28) * t), bark);
    const col = leafCol(L);
    for (const [bx, by, bz, br] of [[28, 56, 28, 11], [38, 62, 31, 9], [18, 64, 26, 9.5], [29, 74, 33, 10], [30, 82, 24, 8], [21, 54, 37, 7.5], [39, 54, 21, 7], [24, 76, 20, 7]]) cball(F, bx, by, bz, br, col, 4, 1.5, r);
  } },
  treeB: { size: [64, 88, 64], r: 0.35, build(F, r) {
    const bark = F.c('#6a5040'), bark2 = F.c('#7e624a'), L = ['#3a6a2a', '#4a7e30', '#5a923a', '#6ea444', '#88b850', '#a4c862'].map((c) => F.c(c));
    disc(F, 32, 32, 0, 36, 2.8, (x, y) => (((y >> 3) + (x >> 2)) % 3 === 0 ? bark2 : bark)); disc(F, 32, 32, 0, 2, 4.4, bark);
    const col = leafCol(L);
    for (const [bx, by, bz, br] of [[32, 50, 32, 14], [44, 54, 30, 10], [20, 56, 34, 10.5], [33, 64, 40, 10], [31, 66, 23, 10], [32, 72, 32, 9]]) cball(F, bx, by, bz, br, col, 4, 1.5, r);
  } },
  palm: { size: [64, 128, 64], r: 0.3, build(F, r) {
    const bark = F.c('#9a7a52'), ring = F.c('#7a5a3a'), fr = [F.c('#2e7a32'), F.c('#3a8a3a'), F.c('#5aa04a')], nut = F.c('#6a4a2a');
    let x = 32, z = 32; for (let y = 0; y < 100; y++) { x += Math.sin(y * 0.03) * 0.15; disc(F, x, z, y, y, 2.6 - y / 90, y % 6 ? bark : ring); }
    for (let a = 0; a < 9; a++) { const ang = a * 0.698 + 0.2, dx = Math.cos(ang), dz = Math.sin(ang); for (let t = 0; t < 30; t++) { const px = x + dx * t, pz = z + dz * t, py = 100 + Math.sin(t / 30 * 2.4) * 10 - t * 0.25; for (let w = -2; w <= 2; w++) F.set(Math.round(px - dz * w * (1 - t / 34)), Math.round(py), Math.round(pz + dx * w * (1 - t / 34)), fr[Math.min(2, (t >> 3) + (w === 0 ? 1 : 0))]); } }
    ball(F, x, 98, z, 3, nut);
  } },
  bush: { size: [24, 18, 24], r: 0.45, build(F, r) { const L = ['#2e6a32', '#3a7a3a', '#4a8a42', '#5a9a4a', '#72ae56'].map((c) => F.c(c)), fl = [F.c('#f0a0c0'), F.c('#fff0f0')]; cball(F, 12, 7, 12, 9.5, leafCol(L), 3, 1, r); for (let i = 0; i < 8; i++) { const x = 4 + Math.floor(r() * 16) & ~1, z = 4 + Math.floor(r() * 16) & ~1; F.box(x, 14, z, x + 1, 15, z + 1, fl[i & 1]); } } },
  planter: { size: [32, 22, 16], r: [1.9, 0.9], build(F, r) { const b = F.c('#a8846a'), b2 = F.c('#8a6a52'), soil = F.c('#5a3a2a'), L = ['#4a8a42', '#5a9a4a', '#3a7a3a'].map((c) => F.c(c)), fl = ['#f05a6a', '#f8d84a', '#f8f0f0', '#e88ad0'].map((c) => F.c(c)); F.box(0, 0, 0, 31, 9, 15, (x, y) => (y === 9 ? b2 : b)); F.box(1, 9, 1, 30, 9, 14, soil); for (let i = 0; i < 70; i++) { const x = 2 + Math.floor(r() * 28), z = 2 + Math.floor(r() * 12), h = 10 + Math.floor(r() * 7); F.box(x, 10, z, x, h, z, L[i % 3]); if (r() < 0.4) F.set(x, h + 1, z, fl[i % 4]); } } },
  lamp: { size: [16, 72, 16], r: 0.2, build(F) { const p = F.c('#2a2e3a'), p2 = F.c('#3a4050'), gl = F.c('#fff0c0', GLOW); disc(F, 8, 8, 0, 3, 3.5, p); disc(F, 8, 8, 4, 60, 1.2, (x, y) => (y % 12 ? p : p2)); F.box(4, 61, 4, 11, 62, 11, p); F.box(5, 63, 5, 10, 67, 10, gl); F.box(3, 68, 3, 12, 69, 12, p); F.box(6, 70, 6, 9, 71, 9, p2); } },
  bench: { size: [28, 14, 10], r: [1.7, 0.6], build(F) { const w = F.c('#a86a3a'), w2 = F.c('#8a5230'), m = F.c('#2a2e3a'); for (const x of [2, 25]) { F.box(x, 0, 1, x + 1, 6, 8, m); F.box(x, 6, 8, x + 1, 13, 9, m); } for (let i = 0; i < 3; i++) F.box(0, 6, 1 + i * 2, 27, 6, 2 + i * 2, i & 1 ? w2 : w); for (let i = 0; i < 2; i++) F.box(0, 9 + i * 3, 9, 27, 10 + i * 3, 9, i & 1 ? w2 : w); } },
  bin: { size: [10, 16, 10], r: 0.3, build(F) { const g = F.c('#3a6a4a'), g2 = F.c('#2e5a3e'), lid = F.c('#2a2e3a'); disc(F, 5, 5, 0, 13, 4.5, (x, y) => (y % 4 ? g : g2)); disc(F, 5, 5, 14, 15, 5, lid); } },
  hydrant: { size: [8, 14, 8], r: 0.2, build(F) { const red = F.c('#c83a32'), hi = F.c('#e85a4a'), m = F.c('#f0e8d8'); disc(F, 4, 4, 0, 1, 3.5, red); disc(F, 4, 4, 2, 10, 2.5, red); F.box(0, 6, 3, 7, 7, 4, hi); disc(F, 4, 4, 11, 12, 2, hi); F.set(4, 13, 4, m); } },
  vending: { size: [16, 30, 12], r: [1.0, 0.75], build(F, r) { const body = F.c('#e8473a'), dk = F.c('#a82e2a'), glass = F.c('#bfe8ff', GLOW), slot = F.c('#1a1a22'); F.box(0, 0, 0, 15, 29, 11, body); F.box(0, 0, 11, 15, 1, 11, dk); F.box(2, 10, 11, 10, 27, 11, glass); const can = ['#f8d84a', '#4a8ad8', '#5ab06a', '#f4f0ea', '#e85a8a'].map((c) => F.c(c, GLOW)); for (let y = 12; y < 27; y += 4) for (let x = 3; x < 10; x += 2) F.set(x, y, 11, can[Math.floor(r() * 5)]); F.box(12, 14, 11, 13, 20, 11, slot); F.box(3, 3, 11, 12, 6, 11, slot); } },
  mailbox: { size: [8, 18, 8], r: 0.22, build(F) { const b = F.c('#2a5ab0'), b2 = F.c('#1e4a90'), w = F.c('#f0e8d8'); F.box(3, 0, 3, 4, 8, 4, b2); F.box(0, 8, 0, 7, 16, 7, b); disc(F, 4, 4, 17, 17, 3.5, b2); F.box(1, 13, 7, 6, 13, 7, w); } },
  lantern: { size: [10, 16, 10], r: 0, hang: true, build(F) { const red = F.c('#e8322a', GLOW), gold = F.c('#f0c040'), dk = F.c('#a82020', GLOW); F.box(4, 14, 4, 5, 15, 5, gold); disc(F, 5, 5, 13, 13, 3, gold); for (let y = 3; y < 13; y++) disc(F, 5, 5, y, y, 4.6 - Math.abs(y - 8) * 0.35, (x) => (x % 3 ? red : dk)); disc(F, 5, 5, 2, 2, 3, gold); F.box(5, 0, 5, 5, 1, 5, gold); } },
  cone: { size: [8, 12, 8], r: 0.15, build(F) { const o = F.c('#f07a2a'), w = F.c('#f8f4ec'); F.box(0, 0, 0, 7, 0, 7, o); for (let y = 1; y < 12; y++) disc(F, 4, 4, y, y, 3.5 - y * 0.28, y > 4 && y < 7 ? w : o); } },
  crate: { size: [12, 12, 12], r: [0.8, 0.8], build(F) { const w = F.c('#b08050'), d = F.c('#8a6038'); F.box(0, 0, 0, 11, 11, 11, (x, y, z) => (x === 0 || x === 11 || y === 0 || y === 11 || z === 0 || z === 11 ? d : (x + y) % 4 ? w : d)); } },
  parasol: { size: [40, 40, 40], r: 0.6, build(F) { const p = F.c('#f4f0e8'), a = F.c('#e85a4a'), b = F.c('#f4f0e8'), t = F.c('#7a5a3a'), ch = F.c('#2a6aa8'); disc(F, 20, 20, 0, 36, 0.8, p); for (let y = 28; y < 37; y++) disc(F, 20, 20, y, y, (37 - y) * 2.1, (x, yy, z) => (Math.floor(Math.atan2(z - 20, x - 20) * 2.6 + 9) % 2 ? a : b)); disc(F, 20, 20, 11, 12, 8, t); disc(F, 20, 20, 0, 11, 1, t); for (const [x, z] of [[6, 20], [34, 20]]) { F.box(x - 2, 0, z - 2, x + 2, 7, z + 2, ch); F.box(x - 2, 8, z - 2, x + 2, 14, z - 1, ch); } } },
  bollard: { size: [6, 14, 6], r: 0.12, build(F) { const g = F.c('#3a3e4a'), y = F.c('#f0c040'); disc(F, 3, 3, 0, 13, 2.4, (x, yy) => (yy > 9 && yy < 12 ? y : g)); } },
  sign: { size: [14, 40, 4], r: 0.15, build(F) { const p = F.c('#6a6e7a'), g = F.c('#2a7a4a'), w = F.c('#f0f4ec'); F.box(6, 0, 1, 7, 39, 2, p); F.box(0, 30, 0, 13, 37, 3, g); F.box(1, 33, 3, 12, 34, 3, w); } },
  bikeRack: { size: [24, 12, 6], r: [1.5, 0.4], build(F) { const m = F.c('#9aa0aa'); for (const x of [2, 9, 16]) { F.box(x, 0, 2, x, 10, 3, m); F.box(x + 5, 0, 2, x + 5, 10, 3, m); F.box(x, 10, 2, x + 5, 10, 3, m); } } },
  car: { size: [72, 26, 36], r: [4.3, 2.0], build(F, r) {
    const cols = ['#e8473a', '#3a7ad8', '#f0c040', '#f4f0e8', '#5ab06a', '#2a2e3a'], body = F.c(cols[Math.floor(r() * cols.length)]), dk = F.c('#1a1a22'), gl = F.c('#8ac8e8'), li = F.c('#fff4c0', GLOW), tl = F.c('#ff4a3a', GLOW), ch = F.c('#c8ccd4');
    F.box(2, 4, 2, 69, 13, 33, body); F.box(16, 14, 4, 52, 23, 31, body); F.box(17, 14, 3, 51, 22, 32, gl); F.box(30, 14, 3, 32, 22, 32, body); F.box(17, 14, 4, 51, 22, 31, gl);
    for (const x of [12, 56]) for (const z of [1, 30]) disc(F, x, z + 2, 0, 0, 0, dk), F.box(x - 5, 0, z, x + 5, 8, z + 4, dk);
    F.box(70, 9, 6, 70, 11, 10, li); F.box(70, 9, 25, 70, 11, 29, li); F.box(1, 9, 6, 1, 11, 10, tl); F.box(1, 9, 25, 1, 11, 29, tl); F.box(70, 4, 4, 71, 6, 31, ch); F.box(0, 4, 4, 1, 6, 31, ch);
  } },
  cart: { size: [32, 36, 20], r: [1.9, 1.1], build(F) { const w = F.c('#c8a070'), r2 = F.c('#e8473a'), y = F.c('#f8f0d8'), wh = F.c('#2a2a32'), st = F.c('#f0c040', GLOW); F.box(1, 6, 1, 30, 18, 18, w); F.box(0, 18, 0, 31, 19, 19, y); for (const x of [6, 25]) F.box(x - 3, 0, 0, x + 3, 6, 2, wh), F.box(x - 3, 0, 17, x + 3, 6, 19, wh); for (const x of [1, 30]) F.box(x, 19, 9, x, 30, 10, w); for (let x = 0; x < 32; x++) F.box(x, 30, 0, x, 33, 19, x % 6 < 3 ? r2 : y); F.box(8, 22, 18, 23, 26, 19, st); } },
  // ---- street clutter (generic, used city-wide by the dressing pass)
  sandwich: { size: [10, 14, 8], r: 0.3, build(F) { const w = F.c('#2a2a30'), b = F.c('#3a3a44'), ch = F.c('#f4f0e6'), y = F.c('#f0c040'), p = F.c('#e86a5a'); for (let k = 0; k < 13; k++) { const z0 = Math.round(k * 0.22); F.box(0, k, z0, 9, k, z0, k > 1 && k < 12 ? b : w); F.box(0, k, 7 - z0, 9, k, 7 - z0, k > 1 && k < 12 ? b : w); } F.box(0, 13, 3, 9, 13, 4, w); F.box(2, 9, 0, 7, 9, 0, ch); F.box(2, 7, 1, 6, 7, 1, y); F.box(3, 5, 1, 7, 5, 1, ch); F.box(2, 3, 1, 5, 3, 1, p); } },
  bags: { size: [18, 9, 14], r: [0.95, 0.75], build(F, r) { const k = [F.c('#2a2c32'), F.c('#3a3e46'), F.c('#2e4a3a')], t = F.c('#f0c040'); for (const [x, z, rr, c] of [[5, 5, 4.2, 0], [12, 6, 3.8, 1], [8, 10, 3.5, 2], [14, 11, 2.8, 0]]) { cball(F, x, rr, z, rr, () => k[c], 2); F.box(x, Math.round(rr * 2) - 1, z, x, Math.round(rr * 2), z, t); } } },
  dumpster: { size: [30, 22, 18], r: [1.95, 1.2], build(F) { const g = F.c('#2e6a4a'), g2 = F.c('#265a3e'), lid = F.c('#1e2a24'), rs = F.c('#8a5a32'), wh = F.c('#1a1a20'), w = F.c('#e8e4d8'); F.box(1, 3, 1, 28, 17, 16, (x, y) => (y % 5 === 0 ? g2 : g)); F.box(0, 18, 0, 29, 19, 17, lid); F.box(0, 17, 17, 29, 17, 17, lid); for (const x of [3, 26]) for (const z of [2, 15]) F.box(x - 1, 0, z - 1, x + 1, 2, z + 1, wh); F.box(4, 12, 17, 9, 14, 17, w); F.box(20, 4, 17, 24, 6, 17, rs); F.box(0, 8, 4, 0, 9, 13, g2); F.box(29, 8, 4, 29, 9, 13, g2); } },
  boxes: { size: [18, 16, 14], r: [1.0, 0.8], build(F) { const c = F.c('#b88a52'), c2 = F.c('#a07440'), t = F.c('#d8c8a0'), s = F.c('#4a6a9a'); F.box(0, 0, 0, 9, 8, 8, c); F.box(4, 0, 8, 4, 8, 8, t); F.box(0, 8, 4, 9, 8, 4, t); F.box(9, 0, 2, 17, 6, 12, c2); F.box(10, 6, 7, 16, 6, 7, t); F.box(2, 9, 1, 11, 15, 8, c); F.box(2, 15, 4, 11, 15, 4, t); F.box(4, 11, 8, 7, 13, 8, s); } },
  pot: { size: [10, 18, 10], r: 0.3, build(F, r) { const p = F.c('#b8643a'), p2 = F.c('#9a4e2c'), rim = F.c('#d07a4a'), soil = F.c('#4a3424'), L = ['#2e6a32', '#3a7a3a', '#4a8a42', '#62a24e', '#7ab85a'].map((c) => F.c(c)); for (let y = 0; y < 7; y++) disc(F, 5, 5, y, y, 3.2 + y * 0.15, y % 3 === 2 ? p2 : p); disc(F, 5, 5, 7, 7, 4.4, rim); disc(F, 5, 5, 7, 7, 3.4, soil); cball(F, 5, 12, 5, 5.2, leafCol(L), 2, 1.2, r); } },
  upole: { size: [40, 136, 8], r: 0.2, build(F) { const w = F.c('#6a5440'), w2 = F.c('#5a4636'), m = F.c('#8a8e98'), ins = F.c('#e8f0f0'), tr = F.c('#7a8088'), tg = F.c('#5a5e66'); disc(F, 20, 4, 0, 130, 1.8, (x, y) => ((y >> 4) % 5 === 4 ? w2 : w)); F.box(2, 118, 2, 37, 120, 5, w2); F.box(6, 104, 2, 33, 105, 5, w2); for (const x of [3, 12, 28, 36]) F.box(x, 121, 3, x, 123, 4, ins); for (const x of [8, 31]) F.box(x, 106, 3, x, 108, 4, ins); disc(F, 26, 4, 84, 98, 3.4, (x, y) => (y === 98 || y === 84 ? tg : tr)); F.box(23, 98, 3, 24, 100, 4, ins); F.box(20, 40, 2, 21, 42, 6, m); F.box(19, 30, 6, 22, 44, 6, F.c('#c8c4b4')); } },
  scooter: { size: [8, 16, 22], r: [0.5, 1.3], build(F) { const b = F.c('#e8473a'), d = F.c('#2a2a30'), m = F.c('#c8ccd4'), s = F.c('#3a3a44'); F.box(2, 3, 3, 5, 6, 17, b); F.box(2, 6, 2, 5, 14, 4, b); F.box(1, 14, 2, 6, 14, 3, m); F.box(2, 7, 9, 5, 9, 15, s); for (const z of [3, 18]) F.box(3, 0, z - 2, 4, 3, z + 2, d); F.box(3, 10, 1, 4, 11, 1, F.c('#fff4c0')); } },
  barrier: { size: [28, 14, 6], r: [1.7, 0.35], build(F) { const w = F.c('#f4f0e8'), o = F.c('#f07a2a'), l = F.c('#3a3a44'); for (const x of [2, 25]) F.box(x, 0, 1, x + 1, 13, 4, l); F.box(0, 8, 2, 27, 12, 3, (x) => ((x >> 2) % 2 ? w : o)); F.box(0, 3, 2, 27, 5, 3, (x) => ((x >> 2) % 2 ? o : w)); } },
  firebox: { size: [6, 22, 6], r: 0.12, build(F) { const r = F.c('#c83a32'), g = F.c('#f0c040'), p = F.c('#3a3e4a'); disc(F, 3, 3, 0, 14, 1, p); F.box(0, 14, 0, 5, 20, 5, r); F.box(1, 21, 1, 4, 21, 4, g); F.box(1, 16, 6, 4, 18, 6, g); } },
};

// tiny kinds whose shadow is a few pixels skip the shadow pass (every kind costs a draw call per tile there)
for (const k of ['firebox', 'sign', 'bollard', 'cone', 'hydrant']) if (PROPS[k]) PROPS[k].noShadow = true;
const GEO = new Map();
function geoFor(kind) {
  if (GEO.has(kind)) return GEO.get(kind);
  const P = PROPS[kind], [X, Y, Z] = P.size, F = new Fine(X, Y, Z, V);
  P.build(F, rnd(kind.length * 7919 + 13));
  const m = F.mesh(), parts = { opaque: merge(m.opaque, X / V / 2, Z / V / 2), glow: merge(m.glow, X / V / 2, Z / V / 2) };
  GEO.set(kind, parts);
  return parts;
}
function merge(geos, ox, oz) {
  if (!geos.length) return null;
  const P = [], N = [], C = [], I = []; let base = 0;
  for (const g of geos) {
    const p = g.attributes.position.array, n = g.attributes.normal.array, c = g.attributes.color.array, ix = g.index ? g.index.array : null;
    for (let i = 0; i < p.length; i += 3) P.push(p[i] - ox, p[i + 1], p[i + 2] - oz);
    N.push(...n); C.push(...c);
    if (ix) for (let i = 0; i < ix.length; i++) I.push(ix[i] + base); else for (let i = 0; i < p.length / 3; i++) I.push(base + i);
    base += p.length / 3; g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setIndex(I); g.computeBoundingSphere();
  return g;
}

/** Instanced placement of all props: list [{ kind, x, y, z, yaw, s }] → THREE.Group */
export function propMeshes(list, mats) {
  const G = new THREE.Group(), byKind = new Map();
  for (const p of list) { if (!PROPS[p.kind]) continue; if (!byKind.has(p.kind)) byKind.set(p.kind, []); byKind.get(p.kind).push(p); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s3 = new THREE.Vector3(), v3 = new THREE.Vector3();
  for (const [kind, arr] of byKind) {
    const geo = geoFor(kind);
    for (const [part, mat] of [['opaque', mats.solid], ['glow', mats.glow]]) {
      if (!geo[part]) continue;
      const im = new THREE.InstancedMesh(geo[part], mat, arr.length);
      arr.forEach((p, i) => { q.setFromEuler(e.set(0, p.yaw || 0, 0)); s3.setScalar(p.s || 1); m4.compose(v3.set(p.x, p.y || 0, p.z), q, s3); im.setMatrixAt(i, m4); });
      im.castShadow = part === 'opaque' && !PROPS[kind].noShadow; im.receiveShadow = true; im.frustumCulled = false; im.userData.prop = kind;
      G.add(im);
    }
  }
  return G;
}
