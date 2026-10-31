// Ultra-detailed voxel trees and ground cover (16 voxels per metre), registered into the shared PROPS table.
//
// Every tree is grown by one small generator: a flared root collar with buttress roots and furrowed bark
// (colour runs vertically in 8-voxel streaks so the greedy mesher merges them), a trunk that tapers and leans,
// limbs that fork into twigs, and leafy clumps at the twig ends in 2-voxel (12.5 cm) leaf cells. Leaf colour
// is chosen per 4-voxel chunk (sunlit on top, shaded underneath, a few yellowed or flowering chunks), so the
// clumps read as foliage up close while their faces still merge.
//
// Cost control:
//  - each kind also has a low-detail twin (4-voxel leaf cells, no twigs) that far tiles switch to (LOD);
//  - the canopy sways in the wind in the vertex shader (one shared material patch, no per-frame CPU work);
//  - ground cover (tufts, wildflowers, leaf litter) skips the shadow pass.
// installTrees(C) remaps the stock 'tree' / 'treeB' / 'palm' props city-wide and adds the LOD + wind updater.
import * as THREE from '../../../vendor/three.module.js';
import { PROPS } from './voxprops.js';
import { Fine } from '../fine.js';

const V = 16;
const TAU = Math.PI * 2;
const rng = (seed) => { let x = (seed >>> 0) || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };
export const h3 = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const disc = (F, cx, cz, y0, y1, r, c) => { for (let y = y0; y <= y1; y++) for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) ** 2 + (z - cz) ** 2 <= r * r) F.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c); };
const sph = (F, cx, cy, cz, r, c) => {
  if (r < 0.75) { F.set(Math.round(cx), Math.round(cy), Math.round(cz), typeof c === 'function' ? c(Math.round(cx), Math.round(cy), Math.round(cz)) : c); return; }
  for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2 <= r * r) F.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c);
};
/** a tapered limb from a to b (voxels), radius r0 → r1 */
const limb = (F, a, b, r0, r1, c) => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(2, Math.ceil(L / 0.9));
  for (let i = 0; i <= n; i++) {
    const k = i / n, r = r0 + (r1 - r0) * k, x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k, z = a[2] + (b[2] - a[2]) * k;
    // square cross-sections on whole voxels: a diagonal limb steps in long merged strips instead of sphere crumbs
    const e = Math.max(0, Math.round(r * 1.6) - 1), X0 = Math.round(x - e / 2), Y0 = Math.round(y - e / 2), Z0 = Math.round(z - e / 2);
    F.box(X0, Y0, Z0, X0 + e, Y0 + e, Z0 + e, c);
  }
};
const pal = (F, list) => list.map((c) => F.c(c));
/** bark: vertical furrow streaks (colour fixed over 8 voxels of height), deep cracks, moss low on the north side */
const barkCol = (B, o = {}) => (x, y, z) => {
  const h = h3(x, y >> 3, z), h2 = h3(x >> 1, (y + 3) >> 2, z >> 1);
  if (o.mottle) { const m = h3(x >> 2, y >> 2, z >> 2); return B[m < 0.3 ? 3 : m < 0.55 ? 4 : m < 0.75 ? 0 : 1]; }   // plane-tree camouflage patches
  if (o.moss && y < o.moss && z < o.cz - 1 && h2 < 0.45) return B[B.length - 1];
  if (h < 0.16) return B[2];                    // deep furrow
  return h < 0.6 ? B[0] : B[1];
};
/** a leaf colour by 4-voxel chunk: lit on top, shaded below and inside, a few odd chunks (yellowed / flowers) */
const leafCol = (L, acc, accP = 0.03) => (x, y, z, d, dy) => {
  const cx = x >> 2, cy = y >> 2, cz = z >> 2, h = h3(cx, cy, cz), big = h3(x >> 4, y >> 4, z >> 4);
  if (acc && h3(cz, cx, cy) < accP && d > 0.72) return acc[(h * acc.length) | 0];
  // light from above dominates; a soft half-metre mottling and a little per-cell jitter on top
  const v = 0.5 + dy * 0.34 + (d > 0.85 ? 0.08 : d < 0.55 ? -0.1 : 0) + (big - 0.5) * 0.22 + (h - 0.5) * 0.2;
  return L[Math.max(0, Math.min(L.length - 1, Math.floor(v * L.length)))];
};
/**
 * a leafy clump: an ellipsoid of s-voxel leaf cells, lumpy (its radius varies over half-metre lobes) and
 * ragged at the edge (holes in the outer shell let the darker inside and the branches show through).
 * o: { s cell, sy squash (y radius / r), holes (0..1), lobe (0..1) }
 */
function clump(F, cx, cy, cz, r, col, o = {}) {
  const s = o.s || 4, sy = o.sy ?? 0.82, holes = o.holes ?? 0, lobe = o.lobe ?? 0.22, ry = r * sy, fr = o.fringe ?? 0;
  const lob = (x, y, z) => { const a = h3((x + 64) >> 3, (y + 64) >> 3, (z + 64) >> 3), b = h3((x + 68) >> 3, (y + 60) >> 3, (z + 66) >> 3); return 1 - lobe * (a + b) * 0.5; };
  for (let y = Math.floor((cy - ry) / s) * s; y <= cy + ry; y += s) for (let z = Math.floor((cz - r) / s) * s; z <= cz + r; z += s) for (let x = Math.floor((cx - r) / s) * s; x <= cx + r; x += s) {
    const dx = x + s / 2 - cx, dy = y + s / 2 - cy, dz = z + s / 2 - cz;
    const d = Math.sqrt(dx * dx + (dy / sy) ** 2 + dz * dz) / r, thr = lob(x, y, z);
    if (d > thr) continue;
    if (holes && d > thr - 0.2 && h3(x >> 1, y >> 1, z >> 1) < holes) continue;
    if (F.get(x, y, z) && !o.over) continue;
    F.box(x, y, z, x + s - 1, y + s - 1, z + s - 1, col(x, y, z, d / thr, dy / ry));
  }
  // the fine fringe: little 2-voxel leaf clusters and single-voxel leaf tips sprinkled just outside the body
  if (!fr) return;
  const R = rng(((cx * 73856093) ^ (cy * 19349663) ^ (cz * 83492791)) >>> 0), n = Math.round(fr * r * r * 0.55);
  for (let i = 0; i < n; i++) {
    const u = R() * 2 - 1, a = R() * TAU, q = Math.sqrt(1 - u * u), nx = q * Math.cos(a), ny = u * 0.9 + 0.1, nz = q * Math.sin(a);
    // walk out from the centre to the first empty voxel past the surface
    let x = 0, y = 0, z = 0, t = r * 0.6;
    for (; t < r * 1.4; t += 1) { x = Math.round(cx + nx * t); y = Math.round(cy + ny * t * sy); z = Math.round(cz + nz * t); if (!F.get(x, y, z)) break; }
    if (F.get(x, y - 1, z) === 0 && F.get(x, y + 1, z) === 0 && F.get(x + 1, y, z) === 0 && F.get(x - 1, y, z) === 0 && F.get(x, y, z + 1) === 0 && F.get(x, y, z - 1) === 0) continue;   // floating
    const c = col(x, y, z, 0.95, ny);
    if (R() < 0.45) F.box(x, y, z, x + 1, y + (R() < 0.5 ? 0 : 1), z + (R() < 0.5 ? 0 : 1), c); else { F.set(x, y, z, c); if (ny < -0.2) F.set(x, y - 1, z, c); }
  }
}

// ---------------------------------------------------------------- the generic broadleaf generator
/**
 * g: { X, Y, Z size, H trunk height (vox), R trunk radius, lean [dx, dz], limbs, spread, rise, clumpR, crownY,
 *      bark [5 colours: base, light, furrow, mottle a, mottle b / moss], leaves [ramp], acc [accent colours], seed,
 *      fork (twigs per limb), sy, holes, top (central crown clump scale), mottle, moss, droop }
 */
function broadleaf(F, g, lo) {
  const R = rng(g.seed), bark = pal(F, g.bark), barkC = barkCol(bark, { mottle: g.mottle, moss: g.moss ? 22 : 0, cz: g.Z / 2 });
  const L = pal(F, g.leaves), acc = g.acc ? pal(F, g.acc) : null, col = leafCol(L, acc, g.accP ?? 0.05);
  const cx = g.X / 2, cz = g.Z / 2, H = g.H, R0 = g.R;
  // root collar: the trunk flares into the ground, buttress roots run out over it
  for (let y = 0; y < 8; y++) disc(F, cx, cz, y, y, R0 + ((8 - y) ** 2 / 64) * R0 * 0.9, barkC);
  const nr = lo ? 0 : g.roots ?? 5;
  for (let i = 0; i < nr; i++) {
    const a = (i / nr) * TAU + R() * 0.6, len = R0 + 6 + R() * 7;
    limb(F, [cx + Math.cos(a) * R0 * 0.8, 4, cz + Math.sin(a) * R0 * 0.8], [cx + Math.cos(a) * len, 0.6, cz + Math.sin(a) * len], 2.4, 0.9, bark[i & 1]);
  }
  // trunk: tapers, leans, wanders a little
  let tx = cx, tz = cz;
  const spine = [];
  for (let y = 0; y <= H; y++) {
    // the centre and radius step every 6 voxels (whole voxels), so the bark sides stay long merged runs
    const ys = Math.floor(y / 6) * 6, k = ys / H; tx = Math.round(cx + g.lean[0] * k * k + Math.sin(ys * 0.11 + g.seed) * 0.6); tz = Math.round(cz + g.lean[1] * k * k + Math.cos(ys * 0.09 + g.seed) * 0.6);
    disc(F, tx, tz, y, y, Math.round(R0 * (1 - 0.32 * k) * 2) / 2, barkC); spine.push([tx, y, tz]);
  }
  // limbs fork into twigs; clumps at the twig ends
  const ends = [];
  const nl = g.limbs;
  for (let i = 0; i < nl; i++) {
    const a = (i / nl) * TAU + R() * 0.7, y0 = Math.round(H * (0.55 + 0.45 * (i % 3) / 2) - R() * 4), base = spine[Math.min(H, Math.max(0, y0))];
    const len = g.spread * (0.75 + R() * 0.4), rise = g.rise * (0.7 + R() * 0.6);
    const end = [base[0] + Math.cos(a) * len, base[1] + rise, base[2] + Math.sin(a) * len];
    const mid = [base[0] + Math.cos(a) * len * 0.5, base[1] + rise * 0.62 + (g.droop ? -3 : 2), base[2] + Math.sin(a) * len * 0.5];
    const lc = bark[i & 1]; limb(F, base, mid, R0 * 0.5, R0 * 0.32, lc); if (!lo) limb(F, mid, end, R0 * 0.32, 0.9, lc);
    ends.push([end, g.clumpR * (0.85 + R() * 0.3)]);
    const nf = g.fork ?? 2;
    for (let j = 0; j < nf; j++) {
      const b = a + (j ? 0.75 : -0.75) * (0.6 + R() * 0.5), l2 = len * (0.42 + R() * 0.2), r2 = rise * (0.35 + R() * 0.5);
      const tw = [mid[0] + Math.cos(b) * l2, mid[1] + r2, mid[2] + Math.sin(b) * l2];
      if (!lo) limb(F, mid, tw, R0 * 0.22, 0.6, bark[(i + j + 1) & 1]);
      ends.push([tw, g.clumpR * (0.7 + R() * 0.25)]);
    }
  }
  // the crown: a central clump over the top of the trunk, then every twig-end clump (a layered canopy)
  const top = spine[H];
  const opt = { s: lo ? 8 : 4, sy: g.sy, fringe: lo ? 0 : g.fringe ?? 0.24, lobe: g.lobe ?? 0.2 };
  if (g.top) clump(F, top[0], top[1] + g.clumpR * 0.6, top[2], g.clumpR * g.top, col, opt);
  for (const [p, r] of ends) clump(F, p[0], p[1] + r * 0.25, p[2], r, col, opt);
}

// ---------------------------------------------------------------- species
const OAK = { // coast live oak: a short stout trunk, wide-spreading crooked limbs, dense dark evergreen domes
  X: 112, Y: 118, Z: 112, H: 44, R: 4.2, lean: [3, -2], limbs: 7, spread: 30, rise: 22, clumpR: 13.5, top: 1.15, seed: 11, sy: 0.72, moss: true,
  bark: ['#5a4434', '#6c5240', '#3a2c22', '#6a5a48', '#5e7a3a'],
  leaves: ['#1d4424', '#25522a', '#2e6030', '#386e36', '#43803c', '#529244', '#66a44e'], acc: ['#8ab050', '#a4b85a'],
};
const MAPLE = { // a red/orange autumn maple: upright limbs, rounded lobed crown
  X: 96, Y: 124, Z: 96, H: 46, R: 3.2, lean: [-1, 2], limbs: 6, spread: 21, rise: 32, clumpR: 13, top: 1.2, seed: 23, sy: 0.85,
  bark: ['#5c4a3e', '#6e5a4c', '#3e3028', '#5c4a3e', '#4e6a36'],
  leaves: ['#9a3216', '#ac3c18', '#c04a1c', '#d05c22', '#de7028', '#ea8a32', '#f4a840'], acc: ['#f8c84a', '#e8d050'], accP: 0.04,
};
const BLOSSOM = { // flowering cherry: a dark glossy trunk, low wide limbs, clouds of pink with white flecks
  X: 104, Y: 108, Z: 104, H: 34, R: 3.0, lean: [2, 1], limbs: 7, spread: 25, rise: 22, clumpR: 12.5, top: 1.0, seed: 37, sy: 0.7, holes: 0.38,
  bark: ['#4a3030', '#5a3a38', '#2e1e1e', '#4a3030', '#5a6a3a'],
  leaves: ['#d06a92', '#dc7ca2', '#e890b0', '#f2a6c0', '#f8bcd0', '#fcd2e0', '#ffe6ee'], acc: ['#ffffff', '#7aa850'], accP: 0.04,
};
const PLANE = { // London plane (SF street tree): mottled cream / olive bark, tall trunk, broad airy crown
  X: 100, Y: 140, Z: 100, H: 60, R: 3.4, lean: [0, 0], limbs: 7, spread: 23, rise: 30, clumpR: 13, top: 1.25, seed: 41, sy: 0.8, mottle: true, holes: 0.34,
  bark: ['#8a8466', '#a8a284', '#5a5440', '#d8d2b0', '#7a8a5a'],
  leaves: ['#2c5a24', '#36682a', '#427832', '#4e883a', '#5e9a42', '#72ac4e', '#8abc5c'], acc: ['#a8c060', '#c8b858'],
};
const LINDEN = { // a small rounded street linden (replaces the stock round 'treeB')
  X: 84, Y: 112, Z: 84, H: 40, R: 2.8, lean: [1, -1], limbs: 5, spread: 16, rise: 26, clumpR: 12.5, top: 1.35, seed: 53, sy: 0.9,
  bark: ['#5e5048', '#706054', '#3e342e', '#5e5048', '#5a6e3a'],
  leaves: ['#2e5e28', '#3a6e2e', '#467e34', '#549040', '#64a048', '#7ab256', '#92c462'], acc: ['#d8d080'],
};

function cypress(F, lo) { // Monterey cypress: a leaning, forked trunk and flat wind-swept pads in tiers
  const R = rng(71), bark = pal(F, ['#5a3e2a', '#6c4c34', '#3a281c', '#5a3e2a', '#4e5e30']), barkC = barkCol(bark, { moss: 20, cz: 48 });
  const col = leafCol(pal(F, ['#16341e', '#1c4024', '#224c2a', '#2a5a32', '#34683a', '#40784a']), pal(F, ['#5a7a3a']), 0.03);
  for (let y = 0; y < 8; y++) disc(F, 46, 48, y, y, 5 + ((8 - y) ** 2 / 64) * 4, barkC);
  for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.3; limb(F, [46 + Math.cos(a) * 4, 4, 48 + Math.sin(a) * 4], [46 + Math.cos(a) * 13, 0.6, 48 + Math.sin(a) * 13], 2.4, 0.9, barkC); }
  const trunk = (x0, z0, x1, y1, z1, r0, r1) => limb(F, [x0, 0, z0], [x1, y1, z1], r0, r1, barkC);
  trunk(46, 48, 58, 58, 44, 5.2, 2.6); limb(F, [50, 22, 47], [30, 62, 54], 3.4, 1.6, barkC); limb(F, [55, 46, 45], [72, 76, 40], 2.4, 1.2, barkC);
  limb(F, [48, 30, 47], [24, 44, 34], 2.2, 1.0, barkC); limb(F, [57, 52, 45], [44, 92, 46], 2.2, 1.0, barkC);
  const opt = { s: lo ? 8 : 4, sy: 0.36, fringe: lo ? 0 : 0.24, lobe: 0.26 };
  for (const [x, y, z, r] of [[30, 66, 54, 17], [72, 80, 40, 16], [24, 48, 34, 13], [50, 70, 44, 20], [44, 96, 46, 15], [62, 60, 60, 14], [56, 88, 32, 13], [38, 84, 58, 13], [64, 74, 30, 12], [36, 58, 40, 13], [52, 104, 44, 10], [76, 70, 52, 11]]) clump(F, x, y, z, r, col, Object.assign({}, opt, { sy: 0.34 + R() * 0.1 }));
}
function palm(F, lo) { // Canary Island date palm: a thick trunk of diamond leaf scars, a skirt of old fronds, a huge arching crown
  const scar = pal(F, ['#8a6a44', '#7a5a38', '#a8845a', '#5e4630']), fr = pal(F, ['#1e5a28', '#2a6c30', '#3a7e38', '#4e9244', '#6aa652']), dead = pal(F, ['#a88a52', '#8a6a3e']), dates = F.c('#e88a2a');
  const cx = 48, cz = 48;
  for (let y = 0; y < 98; y++) { const r = 6.4 - y / 60 + (y < 6 ? (6 - y) * 0.5 : 0); disc(F, cx, cz, y, y, r, (x, yy, z) => { const a = Math.atan2(z - cz, x - cx), k = ((a / TAU) * 12 + (yy >> 2) * 0.5) % 1; return (yy & 3) === 0 || k < 0.12 ? scar[3] : k < 0.5 ? scar[0] : k < 0.8 ? scar[1] : scar[2]; }); }
  // the skirt of hanging dead fronds and the crown
  const n = lo ? 12 : 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + (i & 1) * 0.12, up = i % 3 === 0 ? 0.55 : i % 3 === 1 ? 0.25 : -0.05, len = 38 + (i % 4) * 3, y0 = 100;
    for (let t = 0; t <= len; t += lo ? 2 : 1) {
      const k = t / len, px = cx + Math.cos(a) * t, pz = cz + Math.sin(a) * t, py = y0 + Math.sin(k * 2.2) * 18 * (up + 0.5) - k * k * 26;
      F.set(Math.round(px), Math.round(py), Math.round(pz), fr[Math.min(4, (k * 3 + (i % 2)) | 0)]);
      if (lo) continue;
      const w = (1 - k) * 6 + 1;
      if (t % 3 > 0.5) continue;
      for (let s = 1; s < w; s += 1) { const d = s, droop = Math.round(s * 0.4 + k * 2); for (const sd of [-1, 1]) F.set(Math.round(px - Math.sin(a) * d * sd), Math.round(py) - droop, Math.round(pz + Math.cos(a) * d * sd), fr[Math.min(4, ((s / w) * 2 + k * 2) | 0)]); }
    }
  }
  for (let i = 0; i < (lo ? 0 : 18); i++) { const a = (i / 18) * TAU; for (let t = 4; t < 14; t++) F.set(Math.round(cx + Math.cos(a) * (6 + t * 0.5)), 98 - t, Math.round(cz + Math.sin(a) * (6 + t * 0.5)), dead[i & 1]); }
  for (let i = 0; i < 10; i++) { const a = i * 0.63; sph(F, cx + Math.cos(a) * 7, 94 - (i % 3) * 2, cz + Math.sin(a) * 7, 1.2, dates); }
}

// ---------------------------------------------------------------- ground cover
/** grass tufts: a 1.5 m patch of single-voxel blades, some bent over at the tip (no shadow) */
function tufts(F, r, o = {}) {
  const G = pal(F, o.cols || ['#3e7e32', '#4a8c38', '#56983e', '#64a646', '#76b450', '#3a7430']), seed = pal(F, ['#c8b86a', '#a89858']);
  for (let c = 0; c < (o.n || 7); c++) {
    const cx = 3 + r() * 18, cz = 3 + r() * 18;
    for (let i = 0; i < 9; i++) {
      const x = Math.round(cx + (r() - 0.5) * 4), z = Math.round(cz + (r() - 0.5) * 4), h = 3 + Math.floor(r() * (o.h || 6)), c0 = G[Math.floor(r() * G.length)];
      F.box(x, 0, z, x, h, z, c0);
      if (r() < 0.4) { const dx = r() < 0.5 ? 1 : -1; F.set(x + dx, h + 1, z, c0); }
      if (o.seed && r() < 0.15) F.set(x, h + 1, z, seed[i & 1]);
    }
  }
}
/** wildflowers in grass: stems and little 2-voxel flower heads in a few colours */
function wild(F, r, cols) {
  tufts(F, r, { n: 4, h: 4 });
  const C = pal(F, cols), mid = F.c('#f8e070'), stem = F.c('#4a8a3a');
  for (let i = 0; i < 16; i++) { const x = 2 + Math.floor(r() * 20), z = 2 + Math.floor(r() * 20), h = 3 + Math.floor(r() * 5), c = C[i % C.length]; F.box(x, 0, z, x, h, z, stem); F.box(x, h + 1, z, x + 1, h + 1, z, c); F.set(x, h + 1, z + 1, c); F.set(x + 1, h + 2, z, i % 3 ? c : mid); }
}
/** fallen leaves and twigs, flat on the ground over ~3 m (no shadow) */
function litter(F, r, cols, n = 150) {
  const C = pal(F, cols), twig = F.c('#5a4232'), acorn = F.c('#7a5a30');
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 22, x = Math.round(24 + Math.cos(a) * d), z = Math.round(24 + Math.sin(a) * d), c = C[Math.floor(r() * C.length)];
    if (r() < 0.6) F.box(x, 0, z, x + 1, 0, z, c); else F.box(x, 0, z, x, 0, z + 1, c);
  }
  for (let i = 0; i < 8; i++) { const x = 6 + Math.floor(r() * 36), z = 6 + Math.floor(r() * 36), L = 3 + Math.floor(r() * 6), dir = r() < 0.5; F.box(x, 0, z, dir ? x + L : x, 0, dir ? z : z + L, twig); }
  for (let i = 0; i < 10; i++) F.set(4 + Math.floor(r() * 40), 0, 4 + Math.floor(r() * 40), acorn);
}
/** underplanting: ferns and low shrubs that ring a tree's root collar */
function under(F, r) {
  const L = pal(F, ['#2a5a2a', '#346a30', '#3e7a36', '#4a8a3e', '#5a9a46']), col = leafCol(L, pal(F, ['#e8e0f0', '#f4c8d8']), 0.08);
  for (let i = 0; i < 4; i++) { const a = i * 1.7 + r(), d = 13 + r() * 6; clump(F, 24 + Math.cos(a) * d, 2, 24 + Math.sin(a) * d, 4.5 + r() * 2, col, { s: 2, sy: 0.7, holes: 0.3 }); }
  // ferns: arching fronds from a crown
  const fern = pal(F, ['#3a7a32', '#4a8c3a', '#5e9e44']);
  for (let k = 0; k < 3; k++) {
    const fx = 24 + Math.cos(k * 2.1 + 0.6) * 9, fz = 24 + Math.sin(k * 2.1 + 0.6) * 9;
    for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + k; for (let t = 0; t < 8; t++) { const y = Math.round(Math.sin((t / 8) * 2.6) * 4), x = Math.round(fx + Math.cos(a) * t), z = Math.round(fz + Math.sin(a) * t); F.set(x, y, z, fern[(t >> 2) + (i & 1)]); if (t > 1 && t < 7) { F.set(x + Math.round(Math.sin(a)), y, z - Math.round(Math.cos(a)), fern[1]); F.set(x - Math.round(Math.sin(a)), y, z + Math.round(Math.cos(a)), fern[1]); } } }
  }
}

// ---------------------------------------------------------------- registry
const T = {};   // kind → { build(F, r, lo) }
const add = (kind, size, r, build, o = {}) => { T[kind] = { build }; PROPS[kind] = Object.assign({ size, r, build: (F, rr) => build(F, rr, false), tree: !o.flat }, o); };
add('tr_oak', [OAK.X, OAK.Y, OAK.Z], 0.4, (F, r, lo) => broadleaf(F, OAK, lo));
add('tr_maple', [MAPLE.X, MAPLE.Y, MAPLE.Z], 0.35, (F, r, lo) => broadleaf(F, MAPLE, lo));
add('tr_blossom', [BLOSSOM.X, BLOSSOM.Y, BLOSSOM.Z], 0.35, (F, r, lo) => broadleaf(F, BLOSSOM, lo));
add('tr_plane', [PLANE.X, PLANE.Y, PLANE.Z], 0.35, (F, r, lo) => broadleaf(F, PLANE, lo));
add('tr_linden', [LINDEN.X, LINDEN.Y, LINDEN.Z], 0.32, (F, r, lo) => broadleaf(F, LINDEN, lo));
add('tr_cypress', [96, 118, 96], 0.5, (F, r, lo) => cypress(F, lo));
add('tr_palm', [96, 132, 96], 0.45, (F, r, lo) => palm(F, lo));
// ground cover (flat: no LOD twin, no sway, no shadow, never collides)
add('gr_tuft', [24, 12, 24], 0, (F, r) => tufts(F, r), { flat: true, noShadow: true });
add('gr_tuftDry', [24, 12, 24], 0, (F, r) => tufts(F, r, { cols: ['#8a9a48', '#9aa452', '#6a8a3a', '#b0a860', '#7a9440'], seed: true, h: 7 }), { flat: true, noShadow: true });
add('gr_wild', [24, 12, 24], 0, (F, r) => wild(F, r, ['#f8f4f0', '#f8d84a', '#b07ae8', '#e8506a', '#7ab0f0']), { flat: true, noShadow: true });
add('gr_poppy', [24, 12, 24], 0, (F, r) => wild(F, r, ['#f08a2a', '#f8a83a', '#e86a1a']), { flat: true, noShadow: true });   // California poppies
add('gr_leaves', [48, 2, 48], 0, (F, r) => litter(F, r, ['#c8521e', '#dc6a26', '#ea8a32', '#f4a840', '#a83e18', '#8a6a3a']), { flat: true, noShadow: true });
add('gr_litter', [48, 2, 48], 0, (F, r) => litter(F, r, ['#6a5a3a', '#7a6a42', '#5a6a32', '#8a7a4a', '#4a5a2e'], 110), { flat: true, noShadow: true });
add('gr_petals', [48, 2, 48], 0, (F, r) => litter(F, r, ['#f8c0d4', '#fcd8e4', '#ffffff', '#e888aa'], 130), { flat: true, noShadow: true });
add('gr_under', [48, 12, 48], 0, (F, r) => under(F, r), { flat: true, noShadow: true });
export const TREE_KINDS = ['tr_oak', 'tr_maple', 'tr_blossom', 'tr_plane', 'tr_linden', 'tr_cypress', 'tr_palm'];
/** the litter that belongs under a tree kind */
export const LITTER = { tr_oak: 'gr_litter', tr_maple: 'gr_leaves', tr_blossom: 'gr_petals', tr_plane: 'gr_litter', tr_linden: 'gr_litter', tr_cypress: 'gr_litter' };

// ---------------------------------------------------------------- geometry (the LOD twins are built here, the same way voxprops builds its kinds)
const LOGEO = new Map();
const rnd = (seed) => { let x = (seed >>> 0) || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };
function merge(geos, ox, oz) {
  if (!geos.length) return null;
  let nv = 0, ni = 0; for (const g of geos) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), Cc = new Float32Array(nv * 3), I = new Uint32Array(ni);
  let vb = 0, ib = 0;
  for (const g of geos) {
    const p = g.attributes.position.array, n = g.attributes.normal.array, c = g.attributes.color.array, ix = g.index ? g.index.array : null, cnt = g.attributes.position.count;
    for (let i = 0; i < cnt; i++) { P[(vb + i) * 3] = p[i * 3] - ox; P[(vb + i) * 3 + 1] = p[i * 3 + 1]; P[(vb + i) * 3 + 2] = p[i * 3 + 2] - oz; }
    N.set(n, vb * 3); Cc.set(c, vb * 3);
    if (ix) for (let i = 0; i < ix.length; i++) I[ib + i] = ix[i] + vb; else for (let i = 0; i < cnt; i++) I[ib + i] = vb + i;
    ib += ix ? ix.length : cnt; vb += cnt; g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
  g.setIndex(new THREE.BufferAttribute(I, 1)); g.computeBoundingSphere();
  return g;
}
/** a kind's geometry built here (lo: the low-detail twin of a tree) → BufferGeometry (opaque part) */
export function treeGeo(kind, lo = false) {
  const key = kind + (lo ? ':lo' : ':hi');
  if (LOGEO.has(key)) return LOGEO.get(key);
  const P = PROPS[kind], [X, Y, Z] = P.size, F = new Fine(X, Y, Z, V);
  (T[kind] ? T[kind].build : P.build)(F, rnd(kind.length * 7919 + 13), lo);
  const g = merge(F.mesh().opaque, X / V / 2, Z / V / 2);
  LOGEO.set(key, g);
  return g;
}

// ---------------------------------------------------------------- wind: the canopy sways in the vertex shader
const WIND = { uTime: { value: 0 }, uWind: { value: 1 } };
const SWAY_VS = `
  { vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float ph = wp.x * 0.37 + wp.z * 0.23;
    float h = max(0.0, transformed.y - 1.6);
    float k = h * h * 0.0016 * uWind;
    transformed.x += k * (sin(uTime * 1.3 + ph) + 0.35 * sin(uTime * 3.1 + ph * 2.0 + transformed.y));
    transformed.z += k * (cos(uTime * 1.1 + ph * 1.3) * 0.7);
    transformed.y += k * 0.15 * sin(uTime * 2.7 + transformed.x * 3.0 + transformed.z * 2.0); }
`;
const swayCache = new WeakMap();
/** a twin of material m whose instances sway (keeps whatever onBeforeCompile patch m already has) */
function swayMat(m) {
  let s = swayCache.get(m);
  if (s && s.userData.swayBase === m.onBeforeCompile) return s;
  const prevBC = m.onBeforeCompile, prevKey = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
  s = m.clone();
  s.userData = Object.assign({}, m.userData, { swayBase: prevBC, sway: true });
  s.onBeforeCompile = function (sh, r) {
    if (prevBC) prevBC.call(this, sh, r);
    sh.uniforms.uTime = WIND.uTime; sh.uniforms.uWind = WIND.uWind;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n' + SWAY_VS + '#endif\n');
  };
  s.customProgramCacheKey = () => prevKey + '|sway1';
  swayCache.set(m, s);
  return s;
}

// ---------------------------------------------------------------- the city hook
/** a tile (32 m) of trees whose centre is nearer the player than this draws its full-detail twin */
const LOD_NEAR = 30;
const REMAP = { tree: ['tr_plane', 'tr_oak', 'tr_plane', 'tr_linden'], treeB: ['tr_linden', 'tr_maple', 'tr_linden'], palm: ['tr_palm'] };
/**
 * Swap the stock trees for the detailed species (street trees, Sunset Row, the wharf palms) and register the
 * LOD + wind updater. Call after the districts are built, before C.finalize. `?oldtrees=1` keeps the stock ones,
 * `?nosway=1` turns the wind off, `?treelod=0` keeps every tree at full detail.
 */
export function installTrees(C) {
  const q = typeof location !== 'undefined' ? location.search : '';
  if (!/[?&]oldtrees=1/.test(q)) for (const p of C.props) {
    const list = REMAP[p.kind]; if (!list) continue;
    const k = list[Math.floor(h3(Math.round(p.x * 4), 7, Math.round(p.z * 4)) * list.length)];
    // the stock trees were 3.5–4 m across; ours are a touch bigger, so street trees shrink a little to fit
    p.kind = k; p.s = (p.s || 1) * (k === 'tr_palm' ? 0.85 : k === 'tr_oak' ? 0.72 : 0.82); p.yaw = (p.yaw || 0) + h3(Math.round(p.x), 3, Math.round(p.z)) * TAU;
  }
  const sway = !/[?&]nosway=1/.test(q), lod = !/[?&]treelod=0/.test(q);
  let meshes = null, t = 0;
  C.updaters.push((dt) => {
    t += dt; WIND.uTime.value = t;
    const app = globalThis.__app, w = app && app.world;
    if (!meshes) {
      const city = w && w.sc && w.sc.city; if (!city || !city.root) return;
      // (the prop instances live in a root child named 'props'; batched solid groups can share that name)
      const ims = []; city.root.traverse((o) => { if (o.isInstancedMesh && o.userData && o.userData.prop) ims.push(o); });
      if (!ims.length) return;
      meshes = [];
      for (const im of ims) {
        const kind = im.userData && im.userData.prop; if (!im.isInstancedMesh || !PROPS[kind] || !PROPS[kind].tree || !T[kind]) continue;
        if (w.st.mats && im.material === w.st.mats.glow) continue;   // the opaque part only
        im.computeBoundingSphere();
        const c = im.boundingSphere ? im.boundingSphere.center.clone() : new THREE.Vector3();
        meshes.push({ im, kind, c, hi: im.geometry, lo: lod ? treeGeo(kind, true) : null, base: im.material });
      }
    }
    const pl = w && w.player, cam = w && w.st && w.st.cam, p = (pl && pl.g.position) || (cam && cam.position);
    for (const M of meshes) {
      if (sway) { const sm = swayMat(M.base); if (M.im.material !== sm) M.im.material = sm; }
      if (!lod || !p) continue;
      const far = Math.hypot(M.c.x - p.x, M.c.z - p.z) > LOD_NEAR;
      const want = far ? M.lo : M.hi;
      if (M.im.geometry !== want) M.im.geometry = want;
    }
  });
}
export const _dev = { broadleaf, clump, OAK, MAPLE, PLANE, BLOSSOM, LINDEN, leafCol, pal };
