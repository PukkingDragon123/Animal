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
import { PROPS, MESH_MATS } from './voxprops.js';
import { Fine } from '../fine.js';
import { Geo, VPBR, leafTexture } from './meshkit.js';

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
  const v = 0.5 + dy * 0.46 + (d > 0.85 ? 0.08 : d < 0.55 ? -0.12 : 0) + (big - 0.5) * 0.16 + (h - 0.5) * 0.1;   // painted light: clean bands, a little mottling
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

// ---------------------------------------------------------------- modelled trees (the city's street and park trees)
// A real-looking tree for a close camera at a few thousand triangles: a tapered, slightly crooked trunk with a
// flared base and limbs that fork toward the crown (VPBR bark), and a crown of leaf clusters. Each cluster is a
// dark, lumpy core (so the crown reads dense, never see-through) dressed with alpha-tested leaf cards that break
// the silhouette into foliage. Foliage normals point out from the crown's centre, so the whole canopy shades as
// one soft volume (sunlit top and sun side, cool shaded underside) instead of as faceted blobs; colour varies per
// cluster and darkens toward the inside and the bottom (baked occlusion). The far twin is a few big cards.
const LEAF_UV = [0.14, 0.86];
function crown(G, sp, lo, R) {
  const [cx, cy, cz] = sp.crownC, [rx, ry, rz] = sp.crownR, pal = sp.leaves.map((c) => new THREE.Color(c));
  const n = lo ? Math.max(5, Math.round(sp.clusters * 0.3)) : sp.clusters, out = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const centers = [];
  for (let i = 0; i < n; i++) {
    // spread over the crown ellipsoid, biased outward (the inside is dark and unseen)
    let x, y, z; do { x = R() * 2 - 1; y = R() * 2 - 1; z = R() * 2 - 1; } while (x * x + y * y + z * z > 1);
    const k = 0.45 + 0.55 * Math.cbrt(R()); const L = Math.hypot(x, y, z) || 1;
    x = (x / L) * k; y = (y / L) * k * (sp.flat ? 0.6 : 1); z = (z / L) * k;
    centers.push([cx + x * rx, cy + y * ry, cz + z * rz, sp.clusterR * (lo ? 1.5 : 0.8 + R() * 0.45)]);
  }
  if (sp.tiers) for (const t of sp.tiers) centers.push([cx + t[0], cy + t[1], cz + t[2], t[3] * (lo ? 1.2 : 1)]);
  for (const [x, y, z, r] of centers) {
    const base = pal[Math.floor(R() * pal.length)].clone();
    const shade = (p) => {   // occlusion: darker inside and underneath, lighter on top
      out.set((p.x - cx) / rx, (p.y - cy) / ry, (p.z - cz) / rz); const d = Math.min(1, out.length()), up = out.y;
      const k = 0.5 + 0.38 * d + 0.18 * up; return [base.r * k, base.g * k, base.b * k];
    };
    const nrm = (p, nn) => { out.set(p.x - cx, (p.y - cy) * 0.8, p.z - cz).normalize(); return out.lerp(nn, 0.25).normalize(); };
    if (!lo) {
      // the core: a lumpy, flattened icosphere (uv on the solid corner of the leaf texture)
      const g = new THREE.IcosahedronGeometry(r * 0.78, 1), pa = g.attributes.position;
      for (let i = 0; i < pa.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pa, i), j = 0.82 + 0.3 * h3(Math.round(v.x * 40 + x * 7), Math.round(v.y * 40 + y * 7), Math.round(v.z * 40 + z * 7)); pa.setXYZ(i, v.x * j, v.y * j * 0.8, v.z * j); }
      g.computeVertexNormals();
      const uv = new Float32Array(pa.count * 2).fill(0.05); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      const base0 = G.P.length / 3;
      G.add(g, new THREE.Matrix4().makeTranslation(x, y, z), (p) => shade(p).map((c) => c * 0.7));
      for (let i = base0; i < G.P.length / 3; i++) { const p = new THREE.Vector3(G.P[i * 3], G.P[i * 3 + 1], G.P[i * 3 + 2]), nn = new THREE.Vector3(G.N[i * 3], G.N[i * 3 + 1], G.N[i * 3 + 2]), m = nrm(p, nn); G.N[i * 3] = m.x; G.N[i * 3 + 1] = m.y; G.N[i * 3 + 2] = m.z; }
    }
    // leaf cards around it
    const nc = lo ? 3 : sp.cards;
    for (let j = 0; j < nc; j++) {
      const u = R() * 2 - 1, a = R() * Math.PI * 2, s = Math.sqrt(1 - u * u), dx = s * Math.cos(a), dy = u * 0.8 + 0.15, dz = s * Math.sin(a);
      const px = x + dx * r * 0.55, py = y + dy * r * 0.5, pz = z + dz * r * 0.55, w = r * (lo ? 2.4 : 1.25 + R() * 0.5);
      q.setFromEuler(e.set((R() - 0.5) * 1.2, Math.atan2(dx, dz) + (R() - 0.5) * 0.8, (R() - 0.5) * 1.2));
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([cu, cv]) => new THREE.Vector3(cu * w / 2, cv * w / 2, 0).applyQuaternion(q).add(new THREE.Vector3(px, py, pz)));
      const fn = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      const b0 = G.P.length / 3, tint = 0.9 + R() * 0.2;
      corners.forEach((p, ci) => { const m = nrm(p, fn), c = shade(p).map((v) => v * tint); G.v([p.x, p.y, p.z], [m.x, m.y, m.z], c, [ci === 0 || ci === 3 ? LEAF_UV[0] : LEAF_UV[1], ci < 2 ? LEAF_UV[0] : LEAF_UV[1]]); });
      G.tri(b0, b0 + 1, b0 + 2).tri(b0, b0 + 2, b0 + 3);
    }
  }
}
function trunk(G, sp, lo, R) {
  const bark = new THREE.Color(sp.bark), H = sp.trunkH, r0 = sp.trunkR;
  G.mat(bark, 'bark');
  // a crooked trunk in a few segments, flared at the base
  const pts = []; let x = 0, z = 0;
  for (let i = 0; i <= 4; i++) { const t = i / 4; pts.push([x, t * H, z]); x += (R() - 0.5) * 0.18 + sp.lean[0] * 0.05; z += (R() - 0.5) * 0.18 + sp.lean[1] * 0.05; }
  const sides = lo ? 5 : 9;
  G.cyl([0, 0, 0], [0, 0.35, 0], r0 * 1.7, r0 * 1.05, sides);
  for (let i = 0; i < 4; i++) G.cyl(pts[i], pts[i + 1], r0 * (1 - i * 0.16), r0 * (1 - (i + 1) * 0.16), sides);
  if (lo) return pts[4];
  // limbs: from the upper trunk out toward the crown, each with a fork
  for (let i = 0; i < sp.limbs; i++) {
    const a = (i / sp.limbs) * Math.PI * 2 + R() * 0.6, t = 0.55 + R() * 0.4, b = pts[Math.min(4, Math.round(t * 4))];
    const len = sp.crownR[0] * (0.55 + R() * 0.3), rise = sp.crownR[1] * (0.35 + R() * 0.5);
    const e = [b[0] + Math.cos(a) * len, b[1] + rise, b[2] + Math.sin(a) * len], m = [(b[0] + e[0]) / 2, (b[1] + e[1]) / 2 + 0.2, (b[2] + e[2]) / 2];
    G.cyl(b, m, r0 * 0.45, r0 * 0.3, 6); G.cyl(m, e, r0 * 0.3, r0 * 0.12, 5);
    const f = [m[0] + Math.cos(a + 0.9) * len * 0.45, m[1] + rise * 0.5, m[2] + Math.sin(a + 0.9) * len * 0.45]; G.cyl(m, f, r0 * 0.2, r0 * 0.08, 4);
  }
  return pts[4];
}
function broadleafMesh(sp, lo) {
  const R = rng(sp.seed), wood = new Geo(), leaves = new Geo();
  trunk(wood, sp, lo, R);
  leaves.mat('#ffffff', 'leaf'); crown(leaves, sp, lo, R);
  return { opaque: wood.geometry(), leaves: leaves.geometry() };
}
// species (metres at scale 1; the city scales them 0.72–0.9)
const SPECIES = {
  tr_oak: { seed: 11, trunkH: 3.0, trunkR: 0.3, lean: [1, -0.5], limbs: 6, crownC: [0, 4.6, 0], crownR: [3.3, 2.2, 3.3], clusters: 26, clusterR: 1.25, cards: 7, bark: '#5b4d40', leaves: ['#4f6a2f', '#5a7434', '#46612c', '#62803a', '#55702f'] },
  tr_plane: { seed: 41, trunkH: 4.4, trunkR: 0.27, lean: [0, 0], limbs: 6, crownC: [0, 6.0, 0], crownR: [2.9, 2.5, 2.9], clusters: 24, clusterR: 1.2, cards: 7, bark: '#8a8470', leaves: ['#5b7a34', '#66843a', '#527030', '#718e40', '#5f7d36'] },
  tr_linden: { seed: 53, trunkH: 2.6, trunkR: 0.22, lean: [0.5, -0.5], limbs: 5, crownC: [0, 4.4, 0], crownR: [2.4, 2.6, 2.4], clusters: 20, clusterR: 1.1, cards: 7, bark: '#5e544a', leaves: ['#62853a', '#6e9040', '#577a34', '#7a9a46'] },
  tr_maple: { seed: 23, trunkH: 2.8, trunkR: 0.22, lean: [-0.3, 0.6], limbs: 5, crownC: [0, 4.8, 0], crownR: [2.8, 2.6, 2.8], clusters: 22, clusterR: 1.15, cards: 7, bark: '#5c4e44', leaves: ['#b8532a', '#c7652e', '#a8472a', '#d07a34', '#c25e2a', '#b86f2e'] },
  tr_blossom: { seed: 37, trunkH: 2.0, trunkR: 0.2, lean: [0.6, 0.3], limbs: 6, crownC: [0, 3.9, 0], crownR: [3.0, 1.9, 3.0], clusters: 22, clusterR: 1.05, cards: 7, bark: '#4a3634', leaves: ['#e8b8c8', '#f0c6d4', '#e2a8bc', '#f4d2dc', '#dca0b4'] },
  tr_cypress: { seed: 71, trunkH: 3.2, trunkR: 0.33, lean: [2, -0.6], limbs: 6, flat: true, crownC: [0.6, 4.8, 0], crownR: [3.0, 1.9, 2.8], clusters: 18, clusterR: 1.3, cards: 8, bark: '#5a4636', leaves: ['#2f4a2c', '#36532f', '#2a4428', '#3d5b34'],
    tiers: [[-1.2, 1.4, 0.6, 1.4], [1.6, 2.2, -0.4, 1.3], [0.2, 2.6, 0.2, 1.2]] },
};
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

// ---------------------------------------------------------------- the Canary Island date palm (modelled)
function palmMesh(lo) {
  const R = rng(71), wood = new Geo(), fr = new Geo(), H = 7.2, cx = 0, cz = 0;
  // the trunk: stacked diamond-scarred rings, thick and slightly swollen at the base
  const sides = lo ? 6 : 10, n = lo ? 4 : 14;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, r0 = 0.42 - t0 * 0.12 + (t0 < 0.08 ? 0.12 : 0), r1 = 0.42 - t1 * 0.12;
    wood.mat(i % 2 ? '#7d6648' : '#6e5a40', 'bark').cyl([cx + Math.sin(t0 * 2) * 0.15, t0 * H, cz], [cx + Math.sin(t1 * 2) * 0.15, t1 * H, cz], r0, r1 * 1.04, sides);
  }
  const top = [cx + Math.sin(2) * 0.15, H, cz];
  wood.mat('#6a5432', 'bark').sphere([top[0], H + 0.1, top[2]], [0.55, 0.45, 0.55]);
  // fronds: arching midribs with paired leaflets (tapering triangles), lit green above, a few dead hanging ones
  const nf = lo ? 10 : 18;
  for (let i = 0; i < nf; i++) {
    const a = (i / nf) * Math.PI * 2 + R() * 0.2, up = i % 3 === 0 ? 0.9 : i % 3 === 1 ? 0.5 : 0.15, len = 3.0 + R() * 0.6, dead = !lo && i % 7 === 6;
    const col = new THREE.Color(dead ? '#9a7f52' : ['#3f6a2c', '#4a7632', '#3a6228'][i % 3]); fr.mat(col, 'leaf');
    const seg = lo ? 4 : 9, pts = [];
    for (let k = 0; k <= seg; k++) { const t = k / seg, d = t * len; pts.push([top[0] + Math.cos(a) * d, H + 0.2 + Math.sin(t * 2.2) * up * 1.4 - t * t * (dead ? 3.5 : 1.8), top[2] + Math.sin(a) * d]); }
    const side = [-Math.sin(a), 0, Math.cos(a)];
    for (let k = 0; k < seg; k++) {
      const p = pts[k], q = pts[k + 1], t = k / seg, w = (1 - t) * 0.55 + 0.12;
      for (const sd of [-1, 1]) {
        const tip = [ (p[0] + q[0]) / 2 + side[0] * sd * w, (p[1] + q[1]) / 2 - w * 0.35, (p[2] + q[2]) / 2 + side[2] * sd * w ];
        const nn = [side[2] * 0, 1, 0], b0 = fr.P.length / 3, c = [col.r * (0.85 + t * 0.2), col.g * (0.85 + t * 0.2), col.b * (0.85 + t * 0.2)];
        fr.v(p, nn, c, [0.05, 0.05]); fr.v(q, nn, c, [0.05, 0.05]); fr.v(tip, nn, c.map((v) => v * 0.85), [0.05, 0.05]); fr.tri(b0, b0 + 1, b0 + 2);
      }
    }
  }
  return { opaque: wood.geometry(), leaves: fr.geometry() };
}

// ---------------------------------------------------------------- registry
const T = {};   // kind → { build(F, r, lo) } (voxel kinds with a low-detail twin)
const add = (kind, size, r, build, o = {}) => { T[kind] = { build }; PROPS[kind] = Object.assign({ size, r, build: (F, rr) => build(F, rr, false), tree: !o.flat }, o); };
const MESHES = new Map();
const addMesh = (kind, r, make) => { PROPS[kind] = { size: [1, 1, 1], r, tree: true, sway: true, mesh: (lo) => { const k = kind + (lo ? ':lo' : ''); if (!MESHES.has(k)) MESHES.set(k, make(lo)); return MESHES.get(k); } }; };
for (const [kind, sp] of Object.entries(SPECIES)) addMesh(kind, kind === 'tr_cypress' ? 0.5 : kind === 'tr_oak' ? 0.4 : 0.35, (lo) => broadleafMesh(sp, lo));
addMesh('tr_palm', 0.45, (lo) => palmMesh(lo));
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
export const WIND = { uTime: { value: 0 }, uWind: { value: 1 } };
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
export function swayMat(m) {
  if (/[?&]nosway=1/.test(typeof location !== 'undefined' ? location.search : '')) return m;
  let s = swayCache.get(m); if (s) return s;
  const prevBC = m.onBeforeCompile, own = prevBC !== THREE.Material.prototype.onBeforeCompile ? prevBC : null, key = (m.userData.vxKey || 'std') + '|sway1';
  s = m.clone();
  s.userData = Object.assign({}, m.userData, { sway: true, vxChain: true, vxKey: key });
  s.onBeforeCompile = function (sh, r) {
    if (own) own.call(this, sh, r);
    sh.uniforms.uTime = WIND.uTime; sh.uniforms.uWind = WIND.uWind;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uWind;').replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n' + SWAY_VS + '#endif\n');
  };
  s.customProgramCacheKey = () => key;
  swayCache.set(m, s);
  return s;
}
/** the foliage material: leaf cards (alpha-tested) tinted by vertex colour, swaying */
let LEAFMAT = null;
export function leafMat() {
  if (!LEAFMAT) LEAFMAT = swayMat(new THREE.MeshStandardMaterial({ map: leafTexture(), vertexColors: true, alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.72, metalness: 0 }));
  return LEAFMAT;
}
export const barkMat = () => swayMat(VPBR);
MESH_MATS.vpbr = () => VPBR; MESH_MATS.sway = barkMat; MESH_MATS.leaves = leafMat;

// ---------------------------------------------------------------- the city hook
const REMAP = { tree: ['tr_plane', 'tr_oak', 'tr_plane', 'tr_linden'], treeB: ['tr_linden', 'tr_maple', 'tr_linden'], palm: ['tr_palm'] };
/**
 * Swap the stock trees for the modelled species (street trees, Sunset Row, the wharf palms) and drive the wind.
 * Call after the districts are built, before C.finalize. `?oldtrees=1` keeps the stock ones, `?nosway=1` turns
 * the wind off. (Distance LOD and culling of every prop, trees included, is in build.js.)
 */
export function installTrees(C) {
  const q = typeof location !== 'undefined' ? location.search : '';
  if (!/[?&]oldtrees=1/.test(q)) for (const p of C.props) {
    const list = REMAP[p.kind]; if (!list) continue;
    const k = list[Math.floor(h3(Math.round(p.x * 4), 7, Math.round(p.z * 4)) * list.length)];
    p.kind = k; p.s = (p.s || 1) * (k === 'tr_palm' ? 0.85 : k === 'tr_oak' ? 0.72 : 0.82) * (0.92 + h3(Math.round(p.x), 5, Math.round(p.z)) * 0.16); p.yaw = (p.yaw || 0) + h3(Math.round(p.x), 3, Math.round(p.z)) * TAU;
  }
  let t = 0;
  C.updaters.push((dt) => { t += dt; WIND.uTime.value = t; });
}
