// The Deep Cave's voxel art (16 voxels per metre, registered into the shared PROPS table like every other
// district's furniture): hand-painted voxel sculpts — every voxel picks its colour from a short painted ramp
// by the light falling on that facet (top-left-front lit, cool shadows), ordered-dithered between steps, so
// the props read as painted pixel art in 3D (the global outline pass inks their silhouettes).
//  - crystal clusters (hexagonal prisms with points, lit facets, bright arrises, inner sparkles; they glow)
//  - glowcap mushrooms (giants and little clumps: spotted glowing caps, gill undersides, fibrous stems)
//  - stalagmites / stalactites in four kinds of flowstone, rock lumps with strata, moss and cracks, crags
//  - the old mine: timber sets with lagging, rail sections, a hanging lantern, crates, barrels, a table,
//    a bunk, a tool rack, the ore cart, the strongbox (+ lid), the barricade, rubble, the shaft portal,
//    loose boards, rope posts, bridge planks
//  - the light puzzle's pieces (the sun crystal, a rose crystal on its cradle, the crystal gate) and ore nodes
// Every kind faces +z at yaw 0. Movable pieces are made into meshes with voxMesh().
import * as THREE from '../../../../vendor/three.module.js';
import { PROPS, geoFor, partMat } from '../voxprops.js';
import { GLOW } from '../../fine.js';
import { TX } from '../build.js';
import { noise3, rng } from './cave_geo.js';

const TAU = Math.PI * 2;
const add = (k, d) => { PROPS[k] = Object.assign({ painted: true }, d); };   // our sculpts paint their own ramps
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const hexOf = (c) => (c[0] === '#' ? c : TX.hex(c));
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dth = (x, y, z) => (BAYER[((y + z) & 3) * 4 + ((x + z * 3) & 3)] + 0.5) / 16;
const h3 = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 1440662683) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const nrm = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
const L = nrm(-0.45, 0.82, 0.38);
/** how lit a facet with this normal is (0 … 1) */
const lit = (n) => 0.5 + 0.5 * (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
/** a painted ramp of palette entries, dark (cool) to light (warm) */
function ramp(F, base, ks = [-0.42, -0.28, -0.15, -0.05, 0.06, 0.17, 0.3], flags = 0) { return ks.map((k) => F.c(hexOf(k >= 0 ? TX.light(base, k) : TX.dark(base, -k)), flags)); }
/** a ramp step for v (0 … 1), dithered between neighbours */
function pickD(R, v, x, y, z) { const n = R.length, q = clamp(v, 0, 0.999) * (n - 1), i = Math.floor(q); return R[i < n - 1 && q - i > dth(x, y, z) ? i + 1 : i]; }

// ==================================================================== sculpting tools
const PAL = {
  brown: ['#6e6052', '#5e5248', '#7a6a58', '#665a50', '#86725c'], slate: ['#56606a', '#4a5058', '#5e6a72', '#525a62', '#6a747a'],
  moss: ['#5a6458', '#4e5650', '#64705c', '#566052', '#6c7a62'], ochre: ['#7a5c44', '#6a5040', '#8a6a4a', '#725642', '#94744e'],
  geode: ['#4a3e56', '#3e3448', '#56486a', '#463a52', '#5e4e74'],
  hill: ['#a08a6e', '#8e7a62', '#b09a7a', '#97836a', '#bca684'],      // sunlit sandstone on Alamo Hill
};
const FLOW = { cream: ['#a8987c', '#968670', '#b8a888'], grey: ['#8a8e90', '#7a7e82', '#9aa0a2'], ochre: ['#9a7a54', '#8a6a4a', '#aa8a60'], violet: ['#7a6a8a', '#6a5a7a', '#8a7a9a'] };
/** a lump of rock: a noisy ellipsoid in strata bands, cracks, a cap of moss (o.moss) or grass (o.grass) */
function rock(F, cx, cy, cz, rx, ry, rz, pal, seed, o = {}) {
  const RS = (PAL[pal] || PAL.brown).map((b) => ramp(F, b)), M = o.moss ? ramp(F, '#4e7a3a', [-0.3, -0.15, 0, 0.14, 0.28]) : null, G = o.grass ? ramp(F, '#5e9a46', [-0.25, -0.1, 0.04, 0.16, 0.3]) : null;
  const k = o.k ?? 0.16, rough = o.rough ?? 0.45, bh = o.band ?? 3;
  for (let y = Math.max(0, Math.floor(cy - ry - 2)); y <= Math.min(F.Y - 1, cy + ry + 2); y++) for (let z = Math.max(0, Math.floor(cz - rz - 2)); z <= Math.min(F.Z - 1, cz + rz + 2); z++) for (let x = Math.max(0, Math.floor(cx - rx - 2)); x <= Math.min(F.X - 1, cx + rx + 2); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, dz = (z + 0.5 - cz) / rz, nz3 = noise3(x * k + seed, y * k * 1.3, z * k - seed);
    if (Math.hypot(dx, dy, dz) + (nz3 - 0.5) * rough > 1) continue;
    const n = nrm(dx / rx, dy / ry, dz / rz), band = Math.floor((y + nz3 * 5 + seed) / bh) % RS.length;
    let v = 0.3 + 0.56 * lit(n) + (noise3(x * 0.5, y * 0.5, z * 0.5 + seed) - 0.5) * 0.22;     // (gentle: the scene's light shades it too)
    if (Math.abs(noise3(x * 0.22 + seed, y * 0.3, z * 0.22) - 0.5) < 0.022) v -= 0.45;            // cracks
    const cap = n[1] > 0.5 + (nz3 - 0.5) * 0.5;
    F.set(x, y, z, cap && M ? pickD(M, v, x, y, z) : cap && G ? pickD(G, v + 0.1, x, y, z) : pickD(RS[band], v, x, y, z));
  }
}
/** a hexagonal crystal prism with a pointed tip from base (bx, by, bz) along dir: facets lit by the light, bright arrises */
function prism(F, R, bx, by, bz, dir, r, len, tip, seed = 0) {
  const d = nrm(...dir), up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = nrm(d[1] * up[2] - d[2] * up[1], d[2] * up[0] - d[0] * up[2], d[0] * up[1] - d[1] * up[0]), w = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
  const ex = bx + d[0] * len, ey = by + d[1] * len, ez = bz + d[2] * len, pad = r + 2;
  const AX = [[0.866, 0.5], [0, 1], [-0.866, 0.5]];
  for (let y = Math.max(0, Math.floor(Math.min(by, ey) - pad)); y <= Math.min(F.Y - 1, Math.max(by, ey) + pad); y++) for (let z = Math.max(0, Math.floor(Math.min(bz, ez) - pad)); z <= Math.min(F.Z - 1, Math.max(bz, ez) + pad); z++) for (let x = Math.max(0, Math.floor(Math.min(bx, ex) - pad)); x <= Math.min(F.X - 1, Math.max(bx, ex) + pad); x++) {
    const px = x + 0.5 - bx, py = y + 0.5 - by, pz = z + 0.5 - bz, t = px * d[0] + py * d[1] + pz * d[2]; if (t < -r * 0.7 || t > len) continue;
    const a = px * u[0] + py * u[1] + pz * u[2], b = px * w[0] + py * w[1] + pz * w[2];
    const rr = t > len - tip ? r * (len - t) / tip : r;
    let hd = -1, k = 0, h2 = -1; AX.forEach(([c, s], i) => { const v = Math.abs(a * c + b * s); if (v > hd) { h2 = hd; hd = v; k = i; } else if (v > h2) h2 = v; });
    if (hd > rr) continue;
    const sg = Math.sign(a * AX[k][0] + b * AX[k][1]) || 1, fn = [(u[0] * AX[k][0] + w[0] * AX[k][1]) * sg, (u[1] * AX[k][0] + w[1] * AX[k][1]) * sg, (u[2] * AX[k][0] + w[2] * AX[k][1]) * sg];
    const tipZ = t > len - tip, n = tipZ ? nrm(fn[0] * 0.6 + d[0] * 0.8, fn[1] * 0.6 + d[1] * 0.8, fn[2] * 0.6 + d[2] * 0.8) : fn;
    let v = 0.08 + 0.42 * (t / len) + 0.42 * lit(n);
    if (hd - h2 < 0.75) v += 0.2;                                      // the arris between two facets catches the light
    if (((t + a * 0.6 + seed) % 7 + 7) % 7 < 0.7) v += 0.1;            // a fracture plane inside
    if (h3(x + seed, y, z) < 0.012) v = 1;                              // a sparkle
    F.set(x, y, z, pickD(R, v, x, y, z));
  }
}
const CRYS = { cyan: ['#0e3a4e', '#155a72', '#1f84a2', '#36b0cc', '#6ad8ec', '#b8f6ff', '#f0feff'], violet: ['#2a1a4e', '#3e2672', '#5a38a2', '#7e58cc', '#a888ec', '#d8c4ff', '#f6f0ff'], green: ['#0e3a2a', '#155a3e', '#1f845a', '#36b07e', '#6ae0a6', '#c0ffdc', '#f0fff6'], amber: ['#4a2a0e', '#6e4214', '#9a621e', '#c88a30', '#f0c45a', '#ffe8a0', '#fffaf0'], rose: ['#4a1a2e', '#6e2442', '#9a3462', '#c8508a', '#f08ab6', '#ffc8e0', '#fff4f8'] };
const crysRamp = (F, col) => CRYS[col].map((c) => F.c(c, GLOW));
/** a cluster: a stump of rock, one tall crystal and a burst of smaller ones round it */
function cluster(F, col, seed, o = {}) {
  const R = crysRamp(F, col), r = rng(seed * 977 + 13), cx = F.X / 2, cz = F.Z / 2, H = o.h ?? F.Y - 6;
  rock(F, cx, 3, cz, o.rock ?? 9, 5, o.rock ?? 9, o.pal || 'slate', seed, { k: 0.2 });
  prism(F, R, cx + (r() - 0.5) * 2, 2, cz + (r() - 0.5) * 2, [(r() - 0.5) * 0.25, 1, (r() - 0.5) * 0.25], o.r ?? 5.5, H * (0.78 + r() * 0.2), 13, seed);
  const n = o.n ?? 5 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + r() * 0.8, T = 0.35 + r() * 0.6, len = Math.min(H * (0.25 + r() * 0.45), (cx - 4) / Math.max(0.3, Math.sin(T)));
    prism(F, R, cx + Math.cos(a) * 3, 2 + r() * 2, cz + Math.sin(a) * 3, [Math.cos(a) * Math.sin(T), Math.cos(T), Math.sin(a) * Math.sin(T)], 2.2 + r() * 2.4, len, 5 + r() * 5, seed + i);
  }
}
/** a dripstone: rings narrowing to a point, growth bands, wet streaks; down: hanging from the top of the volume */
function drip(F, cx, cz, H, r0, pal, seed, down = false, o = {}) {
  const B = (FLOW[pal] || FLOW.cream).map((b) => ramp(F, b, [-0.36, -0.22, -0.1, 0.02, 0.14, 0.28]));
  for (let y = 0; y < H; y++) {
    const t = y / H, r = r0 * Math.pow(1 - t, o.p ?? 0.75) * (1 + 0.12 * Math.sin(t * 9 + seed)) + 0.55, ox = Math.sin(t * 3 + seed) * (o.wob ?? 1.2), oz = Math.cos(t * 2.3 + seed) * (o.wob ?? 1.2);
    const yy = down ? F.Y - 1 - y : y, band = (Math.floor(y / 3.5 + noise3(seed, y * 0.2, 0) * 1.5) & 1) ? 0 : 1;
    for (let z = Math.floor(cz + oz - r - 1); z <= cz + oz + r + 1; z++) for (let x = Math.floor(cx + ox - r - 1); x <= cx + ox + r + 1; x++) {
      const dx = x + 0.5 - cx - ox, dz = z + 0.5 - cz - oz, dd = Math.hypot(dx, dz); if (dd > r) continue;
      const n = nrm(dx / Math.max(r, 1), (down ? -1 : 1) * r0 / H * 1.4, dz / Math.max(r, 1));
      const ang = Math.atan2(dz, dx), streak = h3(Math.floor((ang + 4) * 3), seed, 0) < 0.2;
      let v = 0.1 + 0.68 * lit(n) + (band ? 0.06 : -0.06) + (streak ? 0.14 : 0) + (t > 0.85 ? 0.12 : 0);
      F.set(x, yy, z, pickD(B[band ? 0 : (h3(x, y, z) < 0.5 ? 1 : 2)], v, x, y, z));
    }
  }
}
/** a box of wood with its grain along axis ('x' | 'y' | 'z'): painted grain, lit top / left edges, darker ends, knots */
function wood(F, x0, y0, z0, x1, y1, z1, axis, R, seed = 0) {
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const a = axis === 'x' ? x : axis === 'y' ? y : z, c1 = axis === 'x' ? y : x, c2 = axis === 'z' ? y : z;
    const g = Math.sin(c1 * 2.3 + c2 * 1.7 + Math.sin(a * 0.21 + seed) * 2.4) > 0.55 ? -0.14 : 0;
    const top = y === y1 ? 0.18 : 0, side = (axis !== 'x' && x === x0) || (axis === 'x' && z === z1) ? 0.08 : 0, end = (a === (axis === 'x' ? x0 : axis === 'y' ? y0 : z0) || a === (axis === 'x' ? x1 : axis === 'y' ? y1 : z1)) ? -0.16 : 0;
    const knot = h3(Math.floor(a / 5) + seed, Math.floor(c1 / 3), Math.floor(c2 / 3)) < 0.04 ? -0.25 : 0;
    F.set(x, y, z, pickD(R, 0.42 + g + top + side + end + knot + (h3(x, y, z + seed) - 0.5) * 0.12, x, y, z));
  }
}
const WOOD = (F) => ramp(F, '#6a5038', [-0.38, -0.24, -0.12, -0.02, 0.08, 0.18, 0.28]);
const IRON = (F) => ramp(F, '#4a4644', [-0.3, -0.14, 0, 0.16, 0.34]);
const RUST = (F) => ramp(F, '#7a4a2e', [-0.32, -0.16, -0.04, 0.1, 0.24]);

// ==================================================================== crystals
for (const col of Object.keys(CRYS)) for (let v = 0; v < 3; v++) add(`cv_cry_${col}${v}`, { size: [44, v === 2 ? 52 : 72, 44], r: 0.8, noShadow: true, build(F) { cluster(F, col, v * 31 + col.length, { h: v === 2 ? 44 : 64 - v * 8, n: 5 + v }); } });
// the Geode's lining: three rings (separate kinds, so each ring's glow can flare on its own)
for (let g = 0; g < 3; g++) add(`cv_gcry${g}`, { size: [44, 64, 44], r: 0.8, noShadow: true, build(F) { cluster(F, g === 1 ? 'cyan' : 'violet', 70 + g * 17, { h: 58, n: 6, pal: 'geode' }); } });
// a spike of the dais
add('cv_dais', { size: [20, 28, 20], r: 0.3, noShadow: true, build(F) { const R = crysRamp(F, 'violet'); rock(F, 10, 2, 10, 6, 3, 6, 'geode', 3); prism(F, R, 10, 1, 10, [0.1, 1, 0.05], 3, 24, 7, 3); prism(F, R, 12, 1, 9, [0.6, 0.8, -0.2], 1.8, 12, 4, 5); } });
// the sun crystal: a great amber point in a socket of rock
add('cv_sun', { size: [28, 44, 28], r: 0.8, build(F) { rock(F, 14, 4, 14, 11, 6, 11, 'slate', 9); const R = crysRamp(F, 'amber'); prism(F, R, 14, 3, 14, [0.06, 1, 0.08], 5, 38, 11, 9); prism(F, R, 18, 4, 12, [0.6, 0.8, -0.3], 2.5, 14, 5, 11); } });
// a rose crystal on an iron cradle (turned by the player; built standing at the origin)
add('cv_mirror', { size: [18, 30, 18], r: 0.5, build(F) {
  const R = crysRamp(F, 'rose'), I = IRON(F);
  for (let y = 0; y < 6; y++) for (let z = 0; z < 18; z++) for (let x = 0; x < 18; x++) { const d = Math.hypot(x - 8.5, z - 8.5); if ((y < 2 && d < 7) || (y >= 2 && d < 7 && d > 5.5)) F.set(x, y, z, pickD(I, y === 1 || y === 5 ? 0.85 : 0.35, x, y, z)); }
  prism(F, R, 9, 2, 9, [0, 1, 0.12], 4.2, 26, 8, 2); prism(F, R, 6, 4, 10, [-0.5, 0.85, 0], 1.8, 10, 4, 5); prism(F, R, 12, 4, 7, [0.45, 0.85, -0.3], 1.6, 8, 3, 7);
} });
// the crystal gate: a wall of dark violet prisms across the passage (along x)
add('cv_gate', { size: [76, 74, 16], r: 0, build(F) {
  const R = CRYS.violet.map((c, i) => F.c(c, i > 3 ? GLOW : GLOW)); const r = rng(5);
  rock(F, 38, 2, 8, 36, 4, 7, 'slate', 4, { k: 0.25 });
  for (let i = 0; i < 13; i++) { const x = 4 + i * 5.6 + r() * 2, h = 34 + (1 - Math.abs(i - 6) / 6) * 32 + r() * 6; prism(F, R, x, 2, 8 + (r() - 0.5) * 4, [(r() - 0.5) * 0.3, 1, (r() - 0.5) * 0.2], 3.6 + r() * 1.5, Math.min(70, h), 9 + r() * 4, i); }
} });
// glowing ore: a lump of rock with nuggets breaking its surface, two little shards
for (const col of ['cyan', 'green']) add(`cv_ore_${col}`, { size: [22, 22, 22], r: 0.5, build(F) {
  rock(F, 11, 5, 11, 9, 7, 8, 'slate', col.length * 3, { k: 0.24 });
  const R = crysRamp(F, col), r = rng(col.length * 77);
  for (let i = 0; i < 16; i++) { const a = r() * TAU, e = r() * 1.1, x = Math.round(11 + Math.cos(a) * Math.cos(e) * 8.5), y = Math.round(5 + Math.sin(e) * 6.5), z = Math.round(11 + Math.sin(a) * Math.cos(e) * 7.5), s = 1 + Math.floor(r() * 2); for (let k = 0; k < s * s * 2; k++) { const qx = x + Math.floor(r() * (s + 1)) - 1, qy = y + Math.floor(r() * (s + 1)), qz = z + Math.floor(r() * (s + 1)) - 1; if (F.get(qx, qy, qz) || F.get(qx, qy - 1, qz)) F.set(qx, qy, qz, R[3 + Math.floor(r() * 4)]); } }
  prism(F, R, 11, 8, 11, [0.3, 1, -0.2], 2.2, 12, 4, 3); prism(F, R, 14, 7, 9, [0.7, 0.7, -0.1], 1.5, 7, 3, 4);
} });

// ==================================================================== glowcaps
const SHR = { teal: ['#0a4a4a', '#127a72', '#20b0a0', '#3ccab8', '#62e8d0', '#a8fbe8', '#e8fffa'], violet: ['#3a1a5a', '#5a2a8a', '#7a3eb0', '#9a5ad0', '#c88af0', '#e4c4ff', '#faf2ff'], blue: ['#0e2a5a', '#173e86', '#2460b8', '#3a86e0', '#6ab0ff', '#b8dcff', '#f0f8ff'] };
function glowcap(F, cx, cz, y0, h, capR, capH, col, seed) {
  const C = SHR[col].map((c) => F.c(c, GLOW)), GL = [F.c(SHR[col][1], GLOW), F.c(SHR[col][2], GLOW), F.c(SHR[col][0], GLOW)];
  const ST = ramp(F, '#c8d4c8', [-0.34, -0.2, -0.08, 0.04, 0.14]), r = rng(seed), rs = Math.max(1.2, capR * 0.17), bx = (r() - 0.5) * h * 0.35, bz = (r() - 0.5) * h * 0.35;
  // the stem: a bulbous foot, a gentle curve, a ring under the cap, fibres
  for (let y = y0; y < y0 + h; y++) {
    const t = (y - y0) / h, ox = bx * Math.sin(t * Math.PI / 2), oz = bz * Math.sin(t * Math.PI / 2), rr = rs * (1 + 0.6 * (1 - t) ** 4) + (Math.abs(t - 0.8) < 0.04 ? 1.4 : 0);
    for (let z = Math.floor(cz + oz - rr - 1); z <= cz + oz + rr + 1; z++) for (let x = Math.floor(cx + ox - rr - 1); x <= cx + ox + rr + 1; x++) {
      const dx = x + 0.5 - cx - ox, dz = z + 0.5 - cz - oz; if (Math.hypot(dx, dz) > rr) continue;
      const fib = Math.sin(Math.atan2(dz, dx) * 7 + seed) > 0.6 ? -0.1 : 0;
      F.set(x, y, z, t < 0.18 && h3(x, y, z) < 0.5 ? GL[0] : pickD(ST, 0.15 + 0.7 * lit(nrm(dx, 0.2, dz)) + fib, x, y, z));
    }
  }
  // the cap: a dome, a rolled lip, gills underneath, pale spots
  const cx2 = cx + bx, cz2 = cz + bz, cy = y0 + h, spots = []; for (let i = 0; i < Math.round(capR * 0.6) + 4; i++) { const a = r() * TAU, e = 0.25 + r() * 1.1; spots.push([cx2 + Math.cos(a) * Math.cos(e) * capR, cy + Math.sin(e) * capH, cz2 + Math.sin(a) * Math.cos(e) * capR, 1 + r() * capR * 0.12]); }
  for (let y = cy - 2; y <= cy + capH; y++) for (let z = Math.floor(cz2 - capR - 1); z <= cz2 + capR + 1; z++) for (let x = Math.floor(cx2 - capR - 1); x <= cx2 + capR + 1; x++) {
    const dx = x + 0.5 - cx2, dz = z + 0.5 - cz2, d = Math.hypot(dx, dz), t = (y + 0.5 - cy) / capH;
    const R = t >= 0 ? capR * Math.sqrt(Math.max(0, 1 - t * t)) * (1 + (noise3(x * 0.2, y * 0.2, z * 0.2 + seed) - 0.5) * 0.1) : capR - (cy - y) * 0.9;
    if (d > R) continue;
    if (y < cy) { if (d < R - 1.6) { F.set(x, y, z, Math.sin(Math.atan2(dz, dx) * capR * 0.9) > 0 ? GL[0] : GL[2]); } else F.set(x, y, z, C[1]); continue; }
    const n = nrm(dx / capR, Math.max(0.2, t) * 1.2, dz / capR), sp = spots.some((s) => Math.hypot(x + 0.5 - s[0], y + 0.5 - s[1], z + 0.5 - s[2]) < s[3]);
    F.set(x, y, z, sp ? C[6 - (h3(x, y, z) < 0.3 ? 1 : 0)] : pickD(C, 0.12 + 0.45 * lit(n) + 0.35 * t + (d > R - 1.2 && t < 0.15 ? -0.15 : 0), x, y, z));
  }
}
for (const col of Object.keys(SHR)) {
  for (let v = 0; v < 2; v++) add(`cv_cap_${col}${v}`, { size: [64, 70, 64], r: 0.4, noShadow: true, build(F) { glowcap(F, 32, 32, 0, v ? 44 : 50, v ? 24 : 28, v ? 14 : 15, col, v * 17 + col.length); } });
  // a clump of little ones
  add(`cv_caps_${col}`, { size: [28, 22, 28], r: 0, noShadow: true, build(F) { const r = rng(col.length * 5); for (let i = 0; i < 6; i++) { const a = r() * TAU, d = r() * 8; glowcap(F, 14 + Math.cos(a) * d, 14 + Math.sin(a) * d, 0, 3 + Math.floor(r() * 8), 2 + r() * 3.5, 1.5 + r() * 1.5, col, i + 9); } } });
}

// ==================================================================== dripstones and rocks
for (const pal of Object.keys(FLOW)) for (let v = 0; v < 3; v++) {
  add(`cv_mite_${pal}${v}`, { size: [32, 60, 32], r: 0.3, build(F) { if (v === 2) { drip(F, 12, 13, 46, 8, pal, 3); drip(F, 22, 19, 26, 6, pal, 5); drip(F, 18, 9, 14, 4, pal, 7); } else drip(F, 16, 16, v ? 32 : 56, v ? 12 : 9, pal, v * 11 + 2, false, { p: v ? 0.95 : 0.75 }); } });
  add(`cv_tite_${pal}${v}`, { size: [32, 64, 32], r: 0, noShadow: true, build(F) {
    if (v === 2) { drip(F, 11, 14, 54, 7, pal, 4, true); drip(F, 21, 17, 34, 6, pal, 6, true); drip(F, 16, 23, 20, 5, pal, 8, true); for (let x = 9; x < 24; x++) { const len = 10 + Math.round(Math.sin(x * 0.9) * 4 + 4); for (let y = 0; y < len; y++) F.set(x, F.Y - 1 - y, 14 + Math.round(Math.sin(x * 0.6) * 2), F.c(hexOf(TX.light(FLOW[pal][0], y % 4 === 0 ? 0.15 : 0)))); } }   // a drapery curtain
    else drip(F, 16, 16, v ? 36 : 62, v ? 7 : 9, pal, v * 13 + 5, true, { p: 0.9 });
  } });
}
for (const pal of Object.keys(PAL)) for (let v = 0; v < 3; v++) add(`cv_rock_${pal}${v}`, { size: [40, 30, 40], r: 0.6, build(F) {
  const o = { moss: pal === 'moss' };
  if (v === 0) rock(F, 20, 8, 20, 16, 12, 14, pal, v + 3, o);
  else if (v === 1) { rock(F, 18, 5, 20, 17, 8, 15, pal, v + 9, o); rock(F, 28, 4, 12, 8, 6, 7, pal, v + 13, o); }
  else { rock(F, 16, 12, 18, 11, 16, 11, pal, v + 21, o); rock(F, 28, 5, 24, 9, 7, 9, pal, v + 25, o); rock(F, 10, 3, 30, 6, 5, 6, pal, v + 27, o); }
} });
// big crags for the mouth on the hill (grass on top)
for (let v = 0; v < 4; v++) add(`cv_crag${v}`, { size: [64, 60, 56], r: 1.5, build(F) {
  const r = rng(v * 101 + 7); rock(F, 32, 22, 28, 28, 26, 24, 'hill', v * 5 + 1, { grass: true, rough: 0.55, k: 0.1 });
  for (let i = 0; i < 4; i++) rock(F, 14 + r() * 36, 6 + r() * 30, 10 + r() * 36, 7 + r() * 7, 6 + r() * 6, 7 + r() * 6, 'hill', v * 9 + i, { grass: true, k: 0.18 });
} });
// a heap of fallen rock (the collapsed passage)
add('cv_rubble', { size: [60, 44, 52], r: 0, build(F) { const r = rng(17); for (let i = 0; i < 22; i++) { const x = 6 + r() * 48, z = 6 + r() * 40, y = Math.max(4, 30 - Math.hypot(x - 30, z - 26) * 0.9) * r(); rock(F, x, y + 4, z, 5 + r() * 6, 4 + r() * 5, 5 + r() * 6, i % 3 ? 'brown' : 'ochre', i, { k: 0.25 }); } } });

// ==================================================================== the old mine
/** a timber set for the 4.2 m drift: two posts, a cap, wedges and lagging boards over it (2.5 m deep along z) */
for (const v of [0, 1]) add(`cv_timber${v}`, { size: [64, 60, 40], r: 0, build(F) {
  const W = WOOD(F), I = IRON(F), r = rng(3 + v);
  wood(F, 4, 0, 18, 7, 47, 21, 'y', W, 1); wood(F, 56, 0, 18, 59, 47, 21, 'y', W, 2);
  if (v) { for (let y = 20; y < 34; y++) F.set(57 + (y % 3 === 0 ? 1 : 0), y, 18, F.c('#1e140c')); }      // a split post
  wood(F, 1, 48, 17, 62, 52, 22, 'x', W, 3);
  for (const x of [8, 20, 33, 46, 54]) wood(F, x, 53, 16, x + 3, 55, 23, 'z', W, x);                   // wedges
  for (let k = 0; k < 9; k++) { if (v && k === 6) continue; const x = 3 + k * 7, sag = v && k === 4 ? 1 : 0; wood(F, x, 56 - sag, 0, x + 5, 56 - sag, 39, 'z', W, k + 7); }     // lagging
  for (const [x, y] of [[5, 46], [57, 46], [30, 50], [31, 50]]) F.set(x, y, 17, pickD(I, 0.9, x, y, 17));   // spikes and staples
  void r;
} });
/** a section of track along z: two sleepers, two rails (rusty flanks, a bright worn head), spikes */
add('cv_rail', { size: [24, 4, 20], r: 0, noShadow: true, build(F) {
  const W = WOOD(F), RU = RUST(F), ST = ramp(F, '#9aa0a8', [-0.2, 0, 0.2, 0.4]);
  for (const z of [3, 13]) wood(F, 0, 0, z, 23, 1, z + 2, 'x', W, z);
  for (const x of [5, 18]) for (let z = 0; z < 20; z++) { F.set(x - 1, 2, z, pickD(RU, 0.3, x, 2, z)); F.set(x, 2, z, pickD(RU, 0.5, x, 2, z)); F.set(x + 1, 2, z, pickD(RU, 0.3, x, 2, z)); F.set(x, 3, z, pickD(ST, 0.55 + (z % 5 === 0 ? 0.3 : 0), x, 3, z)); }
  for (const z of [4, 14]) for (const x of [3, 7, 16, 20]) F.set(x, 2, z, F.c('#2a2624'));
} });
/** a miner's lantern: bail, hood, wire guard round glowing glass, an oil tank */
add('cv_lantern', { size: [7, 12, 7], r: 0, noShadow: true, build(F) {
  const I = IRON(F), G1 = F.c('#ffd890', GLOW), G2 = F.c('#ffb040', GLOW), G3 = F.c('#fff4d8', GLOW);
  F.box(1, 0, 1, 5, 1, 5, I[1]); F.box(1, 1, 1, 5, 1, 5, I[2]);
  F.box(2, 2, 2, 4, 6, 4, G2); F.box(3, 3, 3, 3, 5, 3, G3); F.set(2, 5, 2, G1); F.set(4, 5, 4, G1);
  for (const [x, z] of [[1, 1], [5, 1], [1, 5], [5, 5]]) F.box(x, 2, z, x, 6, z, I[0]);
  F.box(1, 7, 1, 5, 7, 5, I[3]); F.box(2, 8, 2, 4, 8, 4, I[2]); F.set(3, 9, 3, I[1]); F.set(2, 10, 3, I[4]); F.set(4, 10, 3, I[4]); F.set(3, 11, 3, I[4]);
} });
add('cv_crate', { size: [12, 12, 12], r: 0.4, build(F) {
  const W = ramp(F, '#86643e', [-0.34, -0.2, -0.08, 0.04, 0.16, 0.26]), D = F.c('#3a281a');
  for (let y = 0; y < 12; y++) for (let z = 0; z < 12; z++) for (let x = 0; x < 12; x++) {
    const edge = (x === 0 || x === 11) + (y === 0 || y === 11) + (z === 0 || z === 11); if (!edge) continue;
    const batten = edge >= 2 || x < 2 && z < 2 || x > 9 && z > 9 || x < 2 && z > 9 || x > 9 && z < 2, gap = !batten && y % 4 === 3;
    F.set(x, y, z, gap ? D : pickD(W, (batten ? 0.25 : 0.5) + (y === 11 ? 0.25 : 0) + (x === 0 ? 0.1 : 0) + (h3(x, y, z) - 0.5) * 0.15, x, y, z));
  }
  for (const [x, y] of [[4, 5], [5, 5], [6, 5], [6, 6], [5, 7], [6, 8], [4, 9], [5, 9], [6, 9]]) F.set(x, y, 11, D);    // a stencilled 3
} });
add('cv_barrel', { size: [12, 15, 12], r: 0.4, build(F) {
  const W = WOOD(F), I = IRON(F);
  for (let y = 0; y < 15; y++) { const r = 4.6 + Math.sin((y / 14) * Math.PI) * 1.1; for (let z = 0; z < 12; z++) for (let x = 0; x < 12; x++) { const dx = x + 0.5 - 6, dz = z + 0.5 - 6, d = Math.hypot(dx, dz); if (d > r) continue; const hoop = y === 2 || y === 12, a = Math.atan2(dz, dx), stave = Math.floor((a + 4) * 2.6) % 2, n = nrm(dx, y === 14 ? 4 : 0.2, dz); F.set(x, y, z, hoop ? pickD(I, 0.3 + 0.5 * lit(n), x, y, z) : pickD(W, 0.15 + 0.65 * lit(n) + (stave ? 0.06 : -0.06) + (y === 14 && d < r - 1 ? -0.15 : 0), x, y, z)); } }
} });
add('cv_table', { size: [24, 14, 14], r: 0, build(F) {
  const W = WOOD(F); wood(F, 0, 12, 0, 23, 13, 13, 'x', W, 2); for (const [x, z] of [[1, 1], [21, 1], [1, 11], [21, 11]]) wood(F, x, 0, z, x + 1, 11, z + 1, 'y', W, x + z);
  const B = ramp(F, '#6a2a22', [-0.2, 0, 0.18]), P = F.c('#e8dcc0'); F.box(4, 14, 3, 9, 14, 7, B[1]); F.box(4, 14, 3, 9, 14, 3, B[2]); F.box(5, 14, 4, 8, 14, 6, P);   // the journal (open)
} });
add('cv_bunk', { size: [34, 10, 16], r: 0, build(F) {
  const W = WOOD(F), BL = ramp(F, '#6a6660', [-0.25, -0.1, 0.05, 0.18]), RD = F.c('#8a3a32'), PI = F.c('#d8d0c0');
  for (const [x, z] of [[0, 0], [32, 0], [0, 14], [32, 14]]) wood(F, x, 0, z, x + 1, 7, z + 1, 'y', W, x + z);
  wood(F, 0, 5, 0, 33, 6, 15, 'x', W, 4);
  for (let z = 1; z < 15; z++) for (let x = 3; x < 32; x++) { const y = 7 + (h3(x >> 2, 0, z >> 2) < 0.3 ? 1 : 0); F.set(x, y, z, x % 9 === 4 ? RD : pickD(BL, 0.4 + (h3(x, y, z) - 0.5) * 0.4, x, y, z)); }
  F.box(28, 7, 3, 31, 8, 12, PI);
} });
add('cv_rack', { size: [28, 28, 8], r: 0, build(F) {
  const W = WOOD(F), I = IRON(F); wood(F, 0, 20, 0, 27, 21, 1, 'x', W, 1); wood(F, 1, 0, 0, 2, 22, 1, 'y', W, 2); wood(F, 25, 0, 0, 26, 22, 1, 'y', W, 3);
  for (const x of [7, 14]) { wood(F, x, 2, 3, x, 21, 3, 'y', W, x); for (let k = -4; k <= 4; k++) F.set(x + k, 22 - Math.abs(k) * 0.3 | 0, 3, pickD(I, 0.4 + (k < 0 ? 0.2 : 0), x, 22, 3)); }
  wood(F, 20, 4, 3, 20, 21, 3, 'y', W, 20); F.box(18, 1, 3, 22, 5, 4, I[2]); F.box(18, 1, 4, 22, 1, 4, I[4]);      // a shovel
} });
/** the ore cart (front +z): a riveted tub on a frame and four wheels, heaped with glowing ore */
add('cv_cart', { size: [18, 20, 24], r: 0, build(F) {
  const RU = RUST(F), I = IRON(F), R = crysRamp(F, 'cyan');
  for (let y = 4; y < 14; y++) { const fl = Math.floor((y - 4) / 4); for (let z = 1 - fl; z < 23 + fl; z++) for (let x = 2 - fl; x < 16 + fl; x++) { if (x < 0 || z < 0 || x > 17 || z > 23) continue; const shell = x <= 2 - fl || x >= 15 + fl || z <= 1 - fl || z >= 22 + fl || y === 4; if (!shell) continue; const rivet = (y === 6 || y === 12) && (x + z) % 3 === 0, band = y === 13 || z % 7 === 0; F.set(x, y, z, rivet ? I[4] : band ? pickD(I, 0.3 + (y === 13 ? 0.4 : 0), x, y, z) : pickD(RU, 0.2 + (x <= 2 ? 0.25 : 0) + (y === 13 ? 0.3 : 0) + (h3(x, y, z) - 0.5) * 0.4, x, y, z)); } }
  F.box(3, 2, 2, 14, 3, 21, I[1]);
  for (const z of [4, 18]) for (const x of [0, 17]) for (let y = 0; y < 5; y++) for (let k = -2; k <= 2; k++) if (Math.hypot(y - 2, k) <= 2.4) F.set(x, y, z + k, Math.hypot(y - 2, k) < 1 ? I[4] : I[1]);
  for (let z = 3; z < 21; z++) for (let x = 4; x < 14; x++) { const hh = 14 + Math.round(3 * Math.sin((z - 3) / 18 * Math.PI) * Math.sin((x - 4) / 10 * Math.PI) + h3(x, 0, z) * 1.5); for (let y = 14; y <= hh; y++) F.set(x, y, z, h3(x, y, z) < 0.22 ? R[3 + Math.floor(h3(z, x, y) * 4)] : pickD(ramp(F, '#3a3a40'), 0.3 + (y === hh ? 0.4 : 0), x, y, z)); }
} });
/** the strongbox (body; the lid is its own kind so it can open) */
add('cv_chest', { size: [14, 8, 9], r: 0.4, build(F) {
  const W = ramp(F, '#5a3a24', [-0.3, -0.15, 0, 0.12, 0.24]), I = IRON(F), GD = F.c('#e0b040'), GD2 = F.c('#f8e080');
  for (let y = 0; y < 8; y++) for (let z = 0; z < 9; z++) for (let x = 0; x < 14; x++) { if (x > 0 && x < 13 && z > 0 && z < 8 && y > 0) continue; const band = x === 2 || x === 11 || y === 0; F.set(x, y, z, band ? pickD(I, 0.3 + (y === 7 ? 0.4 : 0), x, y, z) : pickD(W, 0.4 + (y === 7 ? 0.2 : 0) + (y % 3 === 0 ? -0.1 : 0), x, y, z)); }
  F.box(6, 4, 8, 7, 6, 8, GD); F.set(6, 6, 8, GD2);
} });
add('cv_chest_lid', { size: [14, 4, 9], r: 0, build(F) {
  const W = ramp(F, '#5a3a24', [-0.3, -0.15, 0, 0.12, 0.24]), I = IRON(F);
  for (let y = 0; y < 4; y++) for (let z = 0; z < 9; z++) for (let x = 0; x < 14; x++) { const top = y === 3 || (y === 2 && (z === 0 || z === 8)); if (y < 3 && !(x === 0 || x === 13 || z === 0 || z === 8)) continue; void top; F.set(x, y, z, x === 2 || x === 11 ? pickD(I, 0.5 + (y === 3 ? 0.3 : 0), x, y, z) : pickD(W, 0.45 + (y === 3 ? 0.25 : 0), x, y, z)); }
} });
/** planks nailed across the drift (along x), a sign plate, rubble at the foot */
add('cv_barricade', { size: [70, 48, 12], r: 0, build(F) {
  const W = WOOD(F), r = rng(23);
  wood(F, 6, 0, 2, 10, 43, 6, 'y', W, 1); wood(F, 59, 0, 2, 63, 43, 6, 'y', W, 2);
  for (let k = 0; k < 7; k++) { const y = 3 + k * 6 + Math.round((r() - 0.5) * 2), tilt = (r() - 0.5) * 0.08; for (let x = 0; x < 70; x++) { const yy = y + Math.round((x - 35) * tilt); wood(F, x, yy, 7, x, yy + 3, 8, 'x', W, k); } }
  wood(F, 10, 6, 9, 60, 9, 9, 'x', W, 9);     // a diagonal brace (stepped)
  for (let x = 12; x < 58; x++) { const y = Math.round(8 + (x - 12) * 0.65); wood(F, x, y, 9, x, y + 2, 10, 'x', W, 11); }
  for (let i = 0; i < 8; i++) rock(F, 6 + r() * 58, 2, 3 + r() * 6, 4 + r() * 4, 3 + r() * 3, 3 + r() * 2, 'ochre', i + 40, { k: 0.3 });
} });
/** the shaft portal on the hill: two posts, a heavy cap, its corner blocks */
add('cv_portal', { size: [60, 54, 8], r: 0, build(F) {
  const W = WOOD(F), I = IRON(F); wood(F, 3, 0, 1, 8, 44, 6, 'y', W, 1); wood(F, 51, 0, 1, 56, 44, 6, 'y', W, 2); wood(F, 0, 45, 0, 59, 50, 7, 'x', W, 3);
  for (const x of [9, 50]) wood(F, x, 39, 1, x, 44, 6, 'y', W, x); for (const [x, y] of [[5, 47], [54, 47], [29, 47], [30, 47]]) F.set(x, y, 7, I[4]);
} });
add('cv_board', { size: [26, 4, 1], r: 0, build(F) { wood(F, 0, 0, 0, 25, 3, 0, 'x', WOOD(F), 7); F.set(2, 1, 0, F.c('#2a2624')); F.set(23, 2, 0, F.c('#2a2624')); } });
add('cv_post', { size: [3, 26, 3], r: 0.15, build(F) { wood(F, 0, 0, 0, 2, 25, 2, 'y', WOOD(F), 5); } });
add('cv_ropepost', { size: [3, 18, 3], r: 0.12, build(F) { wood(F, 0, 0, 0, 2, 17, 2, 'y', WOOD(F), 6); const RP = F.c('#a48a62'); F.box(0, 14, 0, 2, 14, 2, RP); } });
add('cv_plank', { size: [4, 1, 22], r: 0, noShadow: true, build(F) { wood(F, 0, 0, 0, 3, 0, 21, 'z', ramp(F, '#6a5642', [-0.3, -0.16, -0.04, 0.08, 0.18]), 3); F.set(1, 0, 2, F.c('#2a2624')); F.set(2, 0, 19, F.c('#2a2624')); } });

// ==================================================================== the Old Arena
const CARVE = ['#7a7068', '#6a6058', '#847a70', '#72685e'];
/** dressed stone: block courses with lit tops, chipped arrises, carved rune bands (glow: their palette entries) */
function masonry(F, x0, y0, z0, x1, y1, z1, o = {}) {
  const RS = CARVE.map((c) => ramp(F, c, [-0.32, -0.18, -0.06, 0.06, 0.16])), MOSS = ramp(F, '#4e6a3a', [-0.2, 0, 0.18]), RUNE = o.rune ? F.c(o.rune, GLOW) : 0;
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const edge = (x === x0 || x === x1) + (z === z0 || z === z1) + (y === y1); if (!edge && y > y0) continue;
    const course = Math.floor((y - y0) / (o.course || 6)), blk = Math.floor((x + z + course * 5) / 9), R = RS[(course + blk) % RS.length];
    const joint = (y - y0) % (o.course || 6) === 0 || (x + z + course * 5) % 9 === 0;
    let v = 0.45 + (y === y1 ? 0.3 : 0) + (x === x0 ? 0.08 : 0) + (z === z1 ? 0.05 : 0) - (joint ? 0.35 : 0) + (h3(x, y, z) - 0.5) * 0.18;
    if (h3(x >> 1, y >> 1, z >> 1) < 0.05 && edge >= 2) continue;                                       // a chip off the corner
    if (RUNE && o.runeY && y >= o.runeY && y < o.runeY + 3 && (x * 3 + z * 7 + y) % 5 < 2 && !joint) { F.set(x, y, z, RUNE); continue; }
    F.set(x, y, z, o.moss && y === y1 && h3(x, 0, z) < 0.35 ? pickD(MOSS, 0.5, x, y, z) : pickD(R, v, x, y, z));
  }
}
/** a stepped block of the colosseum ring (straight; set in a polygon round the arena), front +z = toward the arena */
for (const v of [0, 1]) add(`cv_tier${v}`, { size: [42, 22, 28], r: 0, build(F) {
  masonry(F, 0, 0, 0, 41, 7, 27, { moss: true }); masonry(F, 0, 8, 0, 41, 14, 18, { moss: true }); masonry(F, 0, 15, 0, 41, 21, 9, { moss: v === 1, rune: '#ff9a3a', runeY: 17 });
  if (v) for (let i = 0; i < 6; i++) rock(F, 6 + i * 6, 9, 22 - (i % 2) * 3, 3, 2, 3, 'brown', i + 7, { k: 0.3 });     // a collapsed step, rubble on it
} });
/** a carved column with a rune band: whole (0), snapped half-way (1), a fallen drum (2) */
for (const v of [0, 1, 2]) add(`cv_pillar${v}`, { size: [v === 2 ? 48 : 18, v === 0 ? 96 : v === 1 ? 60 : 18, 18], r: 0.6, build(F) {
  if (v === 2) { for (let x = 0; x < 48; x++) { const r0 = x % 14 < 1 ? 6.5 : 7.5; for (let y = 0; y < 18; y++) for (let z = 0; z < 18; z++) { const d = Math.hypot(y - 8.5, z - 8.5); if (d > r0 || d < r0 - 1.5 && x % 14 && x !== 0 && x !== 47) continue; const R = ramp(F, CARVE[(Math.floor(x / 14)) % 4]); F.set(x, y, z, pickD(R, 0.3 + 0.5 * lit(nrm(0, (y - 8.5) / 8, (z - 8.5) / 8)) - (x % 14 < 1 ? 0.3 : 0), x, y, z)); } } return; }
  const H = v === 0 ? 92 : 56, RU = F.c('#ffb050', GLOW);
  masonry(F, 0, 0, 0, 17, 6, 17, {});                                                                   // the base
  for (let y = 7; y < H; y++) { const flute = 7.5; for (let z = 0; z < 18; z++) for (let x = 0; x < 18; x++) {
    const dx = x - 8.5, dz = z - 8.5, d = Math.hypot(dx, dz), ang = Math.atan2(dz, dx), r = flute - (Math.cos(ang * 12) > 0.6 ? 0.8 : 0);
    if (d > r || d < r - 2) continue;
    if (v === 1 && y > H - 10 && h3(x, 0, z) * 10 + (H - 10) < y) continue;                         // the jagged break
    const band = y > 34 && y < 40, R = ramp(F, CARVE[Math.floor(y / 16) % 4]);
    F.set(x, y, z, band && (Math.floor((ang + 4) * 4) + y) % 3 === 0 ? RU : pickD(R, 0.25 + 0.55 * lit(nrm(dx, 0, dz)) + (y % 16 === 0 ? -0.3 : 0), x, y, z));
  } }
  if (v === 0) masonry(F, 0, H, 0, 17, H + 3, 17, {});                                                 // the capital
} });
/** a brazier: a carved pedestal, an iron bowl heaped with coals (the fire itself is particles + light when lit) */
add('cv_brazier', { size: [14, 20, 14], r: 0.4, build(F) {
  masonry(F, 3, 0, 3, 10, 12, 10, { course: 4 });
  const I = IRON(F), CO = ramp(F, '#3a2a24', [-0.3, 0, 0.2]), EM = F.c('#ff6a1a', GLOW);
  for (let y = 13; y < 18; y++) for (let z = 0; z < 14; z++) for (let x = 0; x < 14; x++) { const d = Math.hypot(x - 6.5, z - 6.5), r = 4.5 + (y - 13) * 0.6; if (d > r || (d < r - 1.2 && y > 13)) continue; F.set(x, y, z, pickD(I, 0.3 + (y === 17 ? 0.5 : 0), x, y, z)); }
  for (let z = 2; z < 12; z++) for (let x = 2; x < 12; x++) { if (Math.hypot(x - 6.5, z - 6.5) > 5) continue; F.set(x, 17, z, h3(x, 1, z) < 0.25 ? EM : pickD(CO, h3(x, 2, z), x, 17, z)); }
} });
/** the sealed door of the Old Arena: a carved slab with a ring of runes round a keyhole glyph (along x) */
add('cv_runedoor', { size: [60, 64, 10], r: 0, build(F) {
  masonry(F, 0, 0, 1, 59, 63, 8, { course: 8 });
  const G1 = F.c('#ff9a3a', GLOW), G2 = F.c('#ffd070', GLOW), cx = 30, cy = 34;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 60; x++) { const d = Math.hypot(x - cx, y - cy); if (Math.abs(d - 16) < 1 || Math.abs(d - 11) < 0.7 || (d < 4 && Math.abs(x - cx) < 1.5) || (d < 3 && Math.abs(y - cy - 1) < 1.5)) F.set(x, y, 9, d < 5 ? G2 : G1); }
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, gx = cx + Math.cos(a) * 13.5, gy = cy + Math.sin(a) * 13.5; F.set(Math.round(gx), Math.round(gy), 9, G2); F.set(Math.round(gx + 1), Math.round(gy), 9, G1); }
} });
/** a heap of rubble glinting with ore (dig through it: ore, and sometimes a Tokonmon that was napping inside) */
add('cv_orepile', { size: [30, 18, 30], r: 0.6, build(F) {
  const r = rng(41); for (let i = 0; i < 14; i++) { const a = r() * TAU, d = r() * 9; rock(F, 15 + Math.cos(a) * d, 2 + (9 - d) * 0.7, 15 + Math.sin(a) * d, 3 + r() * 3, 2 + r() * 2.5, 3 + r() * 3, i % 3 ? 'ochre' : 'slate', i, { k: 0.3 }); }
  const R = crysRamp(F, 'cyan'); for (let i = 0; i < 22; i++) { const x = Math.floor(5 + r() * 20), z = Math.floor(5 + r() * 20), y = F.top(x, z); if (y > 0) F.set(x, y + 1, z, R[3 + Math.floor(r() * 4)]); }
} });

// ==================================================================== meshes for the pieces that move
/** a kind as a plain group of meshes (its painted voxels and glowing voxels), origin at the kind's foot centre */
export function voxMesh(kind, mats, o = {}) {
  const g = new THREE.Group(), parts = geoFor(kind);
  for (const part of ['opaque', 'glow']) {
    if (!parts || !parts[part]) continue;
    let m = partMat(kind, part, mats); if (o.ownGlow && part === 'glow') m = m.clone();
    const mesh = new THREE.Mesh(parts[part], m); mesh.castShadow = part !== 'glow'; mesh.receiveShadow = true; mesh.userData.part = part; g.add(mesh);
  }
  g.userData.kind = kind;
  return g;
}
/** voxel props reflected in a water plane at y = water (an InstancedMesh per kind and part, mirrored) */
export function mirroredProps(list, mats, water) {
  const G = new THREE.Group(), by = new Map(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s3 = new THREE.Vector3(), v3 = new THREE.Vector3();
  for (const p of list) { if (!PROPS[p.kind]) continue; if (!by.has(p.kind)) by.set(p.kind, []); by.get(p.kind).push(p); }
  G.scale.y = -1;                                    // the whole group is mirrored about y = 0 (front faces flip with it)
  for (const [kind, arr] of by) {
    const geo = geoFor(kind); if (!geo) continue;
    for (const part of ['opaque', 'glow']) {
      if (!geo[part]) continue;
      const im = new THREE.InstancedMesh(geo[part], partMat(kind, part, mats), arr.length);
      arr.forEach((p, i) => { q.setFromEuler(e.set(0, p.yaw || 0, 0)); s3.setScalar(p.s || 1); m4.compose(v3.set(p.x, (p.y || 0) - 2 * water, p.z), q, s3); im.setMatrixAt(i, m4); });
      im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; G.add(im);
    }
  }
  return G;
}
