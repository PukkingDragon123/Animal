// Food pickups + biome props as MERGED, vertex-colored geometries so each type
// renders as ONE InstancedMesh draw call (performance law: swarms = one draw).
// Same STYLE FORMULA: faceted low-poly, flat matte, soft-saturated naturals.
import * as THREE from '../vendor/three.module.js';

// shared matte material for all instanced props (vertex + per-instance color)
export const propMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true, roughness: 0.95, metalness: 0.0, flatShading: true,
});

const _c = new THREE.Color();
function bake(geo, color, m) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  if (g === geo) g = geo.clone();
  if (m) g.applyMatrix4(m);
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  _c.set(color);
  for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.deleteAttribute('uv');
  return g;
}
function merge(geos) {
  let total = 0; for (const g of geos) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
  let o = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}
const M = (x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
  m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz));
  return m;
};
const SPH = (r, a = 6, b = 5) => new THREE.SphereGeometry(r, a, b);
const CON = (r, h, s = 5) => new THREE.ConeGeometry(r, h, s);
const CYL = (rt, rb, h, s = 6) => new THREE.CylinderGeometry(rt, rb, h, s);
const BOX = (w, h, d) => new THREE.BoxGeometry(w, h, d);

// ---- FOOD ----
function foodGrass(color) {
  const parts = [];
  for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.28, r = 0.12; parts.push(bake(CON(0.05, 0.5, 4), color, M(Math.cos(a) * r, 0.25, Math.sin(a) * r, 1, 1, 1, 0.1 * Math.cos(a), a, 0.1 * Math.sin(a)))); }
  return merge(parts);
}
function foodFlower(color) {
  const parts = [bake(CYL(0.025, 0.03, 0.42, 4), 0x4caf50, M(0, 0.21, 0))];
  for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.28; parts.push(bake(SPH(0.12), color, M(Math.cos(a) * 0.13, 0.46, Math.sin(a) * 0.13, 1, 0.5, 1))); }
  parts.push(bake(SPH(0.1), 0xffd23f, M(0, 0.48, 0)));
  return merge(parts);
}
function foodFish(color) {
  return merge([
    bake(SPH(0.18), color, M(0, 0.18, 0, 0.7, 0.8, 1.6)),
    bake(CON(0.16, 0.22, 3), color, M(0, 0.18, -0.26, 1, 1, 0.5, Math.PI / 2, 0, 0)),
    bake(SPH(0.04), 0x141414, M(0.06, 0.22, 0.16)),
    bake(SPH(0.04), 0x141414, M(-0.06, 0.22, 0.16)),
  ]);
}
function foodSeaweed(color) {
  const parts = [];
  for (let s = -1; s <= 1; s += 1) for (let i = 0; i < 4; i++) parts.push(bake(BOX(0.1, 0.18, 0.06), color, M(s * 0.12 + Math.sin(i) * 0.05, 0.12 + i * 0.18, 0, 1, 1, 1, 0, 0, Math.sin(i + s) * 0.4)));
  return merge(parts);
}
function foodBug(color) {
  return merge([
    bake(SPH(0.14), color, M(0, 0.16, 0, 0.8, 0.7, 1.3)),
    bake(SPH(0.1), 0x2b2520, M(0, 0.18, 0.16)),
    bake(SPH(0.12), 0xeaf6ff, M(0.1, 0.22, 0, 0.6, 0.1, 1.0)),
    bake(SPH(0.12), 0xeaf6ff, M(-0.1, 0.22, 0, 0.6, 0.1, 1.0)),
  ]);
}
function foodBerry(color) {
  return merge([
    bake(CYL(0.02, 0.02, 0.3, 4), 0x5a3a22, M(0, 0.15, 0)),
    bake(SPH(0.13), color, M(0.08, 0.32, 0)),
    bake(SPH(0.13), color, M(-0.07, 0.28, 0.05)),
    bake(SPH(0.12), color, M(0, 0.4, -0.04)),
  ]);
}
function foodTwig(color) {
  return merge([
    bake(CYL(0.03, 0.04, 0.5, 4), color || 0x8a6038, M(0, 0.12, 0, 1, 1, 1, 0, 0, 1.2)),
    bake(CYL(0.025, 0.03, 0.28, 4), color || 0x9a6f44, M(0.12, 0.2, 0, 1, 1, 1, 0, 0, 0.4)),
    bake(SPH(0.06), 0x6fae54, M(-0.18, 0.16, 0.04)),
  ]);
}
const FOOD_GEO = { grass: foodGrass, flowerFood: foodFlower, fishFood: foodFish, seaweedFood: foodSeaweed, bug: foodBug, berry: foodBerry, twig: foodTwig };
export function buildFoodGeometry(buildKey, color) { return (FOOD_GEO[buildKey] || foodGrass)(color); }

// ---- PROPS ----
function tree() {
  const greens = [0x4f9f4a, 0x5fb050, 0x47923f, 0x66bd57];
  const parts = [
    bake(CYL(0.18, 0.28, 1.2, 6), 0x7a5230, M(0, 0.6, 0)),
    bake(SPH(0.85), greens[0], M(0, 1.55, 0, 1.05, 0.95, 1.05)),
  ];
  // fuller, rounder canopy from several offset blobs
  const blobs = [[0.42, 1.95, 0.18, 0.6], [-0.4, 1.85, -0.22, 0.58], [0.1, 2.25, -0.05, 0.55], [-0.15, 1.7, 0.4, 0.5], [0.3, 1.6, -0.4, 0.46]];
  for (let i = 0; i < blobs.length; i++) { const b = blobs[i]; parts.push(bake(SPH(b[3]), greens[(i + 1) % greens.length], M(b[0], b[1], b[2]))); }
  return merge(parts);
}
function fern() {
  const parts = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 6.28, r = 0.05;
    parts.push(bake(CON(0.09, 0.8, 4), i % 2 ? 0x4f9f4a : 0x5fb050, M(Math.cos(a) * r, 0.4, Math.sin(a) * r, 0.5, 1, 1, 0.5 * Math.cos(a), a, 0.5 * Math.sin(a))));
  }
  return merge(parts);
}
function bush() { return merge([bake(SPH(0.55), 0x4f9f4a, M(0, 0.45, 0, 1.2, 0.9, 1.2)), bake(SPH(0.42), 0x5fb050, M(0.32, 0.5, 0.1))]); }
function log() {
  return merge([
    bake(CYL(0.28, 0.28, 1.6, 8), 0x8a6038, M(0, 0.3, 0, 1, 1, 1, 0, 0, Math.PI / 2)),
    bake(CYL(0.29, 0.29, 0.06, 8), 0xb08a5a, M(0.8, 0.3, 0, 1, 1, 1, 0, 0, Math.PI / 2)),
    bake(CYL(0.29, 0.29, 0.06, 8), 0xb08a5a, M(-0.8, 0.3, 0, 1, 1, 1, 0, 0, Math.PI / 2)),
  ]);
}
function flowerProp() {
  const cols = [0xff7ab0, 0xffd23f, 0xa06bff, 0xff6b6b, 0xffffff];
  const c = cols[Math.floor(Math.random() * cols.length)];
  return foodFlower(c);
}
function iceberg() {
  return merge([
    bake(CON(0.9, 1.6, 5), 0xeaf3ff, M(0, 0.8, 0, 1, 1, 1, 0, 0.4, 0)),
    bake(CON(0.5, 1.0, 5), 0xd2e6fb, M(0.6, 0.5, 0.3, 1, 1, 1, 0, 1.0, 0.2)),
    bake(BOX(1.4, 0.3, 1.4), 0xbfe0fb, M(0, 0.1, 0)),
  ]);
}
function snowpile() { return merge([bake(SPH(0.6), 0xffffff, M(0, 0.3, 0, 1.4, 0.6, 1.4)), bake(SPH(0.4), 0xf2f8ff, M(0.35, 0.34, 0.1, 1.2, 0.6, 1.2))]); }
function icerock() { return merge([bake(SPH(0.5, 5, 4), 0xbcd6ef, M(0, 0.35, 0, 1.1, 0.9, 1.0)), bake(SPH(0.3, 5, 4), 0xa9c8e6, M(0.3, 0.2, 0.25))]); }
function coral() {
  const cols = [0xff7a9c, 0xffa14a, 0xb072e0, 0xff6b6b];
  const c = cols[Math.floor(Math.random() * cols.length)];
  const parts = [bake(SPH(0.4), c, M(0, 0.2, 0, 1.1, 0.5, 1.1))];
  for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.28; parts.push(bake(CYL(0.08, 0.12, 0.9, 5), c, M(Math.cos(a) * 0.2, 0.55, Math.sin(a) * 0.2, 1, 1, 1, Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4))); }
  return merge(parts);
}
function seaweedProp() {
  const parts = [];
  for (let s = 0; s < 3; s++) for (let i = 0; i < 6; i++) parts.push(bake(BOX(0.12, 0.26, 0.08), 0x37b06a, M(s * 0.16 - 0.16, 0.14 + i * 0.26, 0, 1, 1, 1, 0, 0, Math.sin(i + s) * 0.35)));
  return merge(parts);
}
function rock() { return merge([bake(SPH(0.6, 5, 4), 0x9aa3ad, M(0, 0.3, 0, 1.2, 0.8, 1.1)), bake(SPH(0.35, 5, 4), 0x868f99, M(0.4, 0.18, 0.2))]); }
function reed() {
  const parts = [];
  for (let i = 0; i < 5; i++) { const a = i * 1.3, r = 0.12; parts.push(bake(CYL(0.03, 0.04, 1.3, 4), 0x6fae54, M(Math.cos(a) * r, 0.65, Math.sin(a) * r, 1, 1, 1, 0.08 * Math.cos(a), 0, 0.08 * Math.sin(a)))); }
  return merge(parts);
}
function acacia() {
  return merge([
    bake(CYL(0.14, 0.22, 1.4, 6), 0x9a7240, M(0, 0.7, 0)),
    bake(CYL(1.1, 1.1, 0.28, 7), 0x6fae54, M(0, 1.5, 0)),
    bake(CYL(0.7, 0.7, 0.22, 7), 0x7cbf60, M(0.2, 1.72, 0.1)),
  ]);
}
function tallgrass() {
  const parts = [];
  for (let i = 0; i < 6; i++) { const a = i * 1.1, r = 0.14; parts.push(bake(CON(0.05, 0.9, 4), 0xc9b04a, M(Math.cos(a) * r, 0.45, Math.sin(a) * r, 1, 1, 1, 0.12 * Math.cos(a), a, 0.12 * Math.sin(a)))); }
  return merge(parts);
}
const PROP_GEO = { tree, bush, log, flowerProp, fern, iceberg, snowpile, icerock, coral, seaweedProp, rock, reed, acacia, tallgrass };
export function buildPropGeometry(buildKey) { return (PROP_GEO[buildKey] || bush)(); }
