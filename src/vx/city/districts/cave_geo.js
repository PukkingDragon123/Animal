// Geometry for the Deep Cave, built with the CityBuilder's raw quads and triangles (so it wears the same
// pixel-art surface materials as the city) and a few movable pieces of its own.
//  - CaveField: the cave as a signed distance field in plan (x, z): rooms (ellipses) and tunnels (polylines
//    with a width and a floor height per point) merged with a smooth minimum, wobbled with noise. It answers
//    "how far from the wall", "how high is the floor", "how high is the roof" and "what is underfoot".
//    Pits (the chasm) and the lake are cut out of the floor the same way.
//  - contours(): marching squares on a field → closed loops, chained, smoothed and resampled, oriented so the
//    rock is on the right of the walking direction.
//  - wallLoop(): a loop lofted into a rock wall from below the floor to above the roof, every vertex pushed by
//    3D noise (so neighbouring strips meet exactly), undercut at the foot, vaulting in at the top. Faces point
//    into the cave only: seen from outside (the follow camera above a tunnel roof) walls and roof vanish.
//  - oriented boxes (ropes, sign boards) and an accumulator for meshes of their own (the lake surface); the
//    emitter can lay everything twice, the second time reflected under the lake's surface.
//  (the props — crystals, glowcaps, dripstones, rocks, the mine — are voxel sculpts: cave_props.js)
import * as THREE from '../../../../vendor/three.module.js';

const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- noise (deterministic, not periodic)
function h2(i, j) { let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function h3(i, j, k) { let h = (i * 374761393 + j * 668265263 + k * 1440662683) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const sm = (t) => t * t * (3 - 2 * t);
export function noise2(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = sm(x - i), fz = sm(z - j);
  const a = h2(i, j), b = h2(i + 1, j), c = h2(i, j + 1), d = h2(i + 1, j + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}
export function noise3(x, y, z) {
  const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), fx = sm(x - i), fy = sm(y - j), fz = sm(z - k);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(h3(i, j, k), h3(i + 1, j, k), fx), L(h3(i, j + 1, k), h3(i + 1, j + 1, k), fx), fy), L(L(h3(i, j, k + 1), h3(i + 1, j, k + 1), fx), L(h3(i, j + 1, k + 1), h3(i + 1, j + 1, k + 1), fx), fy), fz);
}
export const fbm2 = (x, z) => noise2(x, z) * 0.6 + noise2(x * 2.1 + 17, z * 2.1 + 5) * 0.28 + noise2(x * 4.3 + 3, z * 4.3 + 11) * 0.12;
export const rng = (seed) => { let x = (seed >>> 0) || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };

// ---------------------------------------------------------------- the field
function segInfo(x, z, P) {
  let best = 1e9, bt = 0, bs = 0, acc = 0;
  for (let s = 0; s < P.length - 1; s++) {
    const [ax, az] = P[s], [bx, bz] = P[s + 1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1e-6;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1), d = Math.hypot(x - ax - dx * t, z - az - dz * t);
    if (d < best) { best = d; bt = t; bs = s; }
    void acc;
  }
  return { d: best, s: bs, t: bt };
}
export class CaveField {
  constructor(o = {}) { this.prims = []; this.pits = []; this.lakes = []; this.k = o.k ?? 2.4; this.wob = o.wob ?? 1.1; }
  /** an elliptic chamber: o { y (floor), ceil (roof height above the floor), floor (texture id), wall (palette), bump, wob } */
  room(cx, cz, rx, rz, o = {}) { const p = { kind: 'room', cx, cz, rx, rz, y: o.y ?? 0, ceil: o.ceil ?? 6, floor: o.floor || 'wet', wall: o.wall || 'brown', bump: o.bump ?? 0.12, wob: o.wob ?? 1, id: o.id || '', vault: o.vault ?? 1, ...o }; this.prims.push(p); return p; }
  /** a tunnel along points [[x, z, y?], …], width w (m); y per point (floor), o.ceil above the floor */
  tunnel(pts, w, o = {}) { const p = { kind: 'tunnel', pts: pts.map((q) => [q[0], q[1], q[2] ?? o.y ?? 0]), w, ceil: o.ceil ?? 4, floor: o.floor || 'wet', wall: o.wall || 'brown', bump: o.bump ?? 0.08, wob: o.wob ?? 0.5, id: o.id || '', vault: o.vault ?? 1, ...o }; this.prims.push(p); return p; }
  /** a pit cut out of the floor: d(x, z) < 0 inside; bottom y */
  pit(d, bottom, o = {}) { const p = { d, bottom, ...o }; this.pits.push(p); return p; }
  /** a lake: an elliptic basin whose water stands at y */
  lake(cx, cz, rx, rz, y, o = {}) { const p = { cx, cz, rx, rz, y, wob: o.wob ?? 0.9, ...o }; this.lakes.push(p); return p; }
  primD(p, x, z) {
    if (p.kind === 'room') return (Math.hypot((x - p.cx) / p.rx, (z - p.cz) / p.rz) - 1) * Math.min(p.rx, p.rz);
    return segInfo(x, z, p.pts).d - p.w / 2;
  }
  primY(p, x, z) {
    if (p.kind === 'room') return typeof p.y === 'function' ? p.y(x, z) : p.y;
    const { s, t } = segInfo(x, z, p.pts); return p.pts[s][2] + (p.pts[s + 1][2] - p.pts[s][2]) * t;
  }
  /** signed distance to the wall (m): < 0 inside the cave */
  d(x, z) {
    let d = 1e9, wob = 0, wk = 0;
    for (const p of this.prims) { const di = this.primD(p, x, z); d = smin(d, di, this.k); if (di < 3) { const w = 1 - clamp(di / 3, 0, 1); wob += p.wob * w; wk += w; } }
    const amp = wk > 0 ? wob / wk : 1;
    return d + (fbm2(x * 0.32, z * 0.32) - 0.5) * this.wob * 2 * amp;
  }
  /** blend of the chambers' properties near (x, z): floor height, roof height, floor texture, wall palette */
  at(x, z) {
    let W = 0, y = 0, c = 0, best = null, bd = 1e9, vault = 0;
    for (const p of this.prims) {
      const di = this.primD(p, x, z);
      if (di < bd) { bd = di; best = p; }
      const w = sstep(2.6, -1.2, di); if (w <= 0) continue;
      W += w; y += w * this.primY(p, x, z); c += w * p.ceil; vault += w * p.vault;
    }
    if (W <= 1e-6) { y = this.primY(best, x, z); c = best.ceil; vault = best.vault; W = 1; } else { y /= W; c /= W; vault /= W; }
    return { y, ceil: c, prim: best, floor: best.floor, wall: best.wall, vault };
  }
  /** the walkable floor height (with gentle bumps) */
  floorY(x, z) { const a = this.at(x, z); return a.y + (noise2(x * 0.7, z * 0.7) - 0.5) * 2 * (a.prim.bump ?? 0.1); }
  /** the roof height */
  ceilY(x, z) { const a = this.at(x, z); return a.y + a.ceil + (fbm2(x * 0.22 + 40, z * 0.22) - 0.5) * a.ceil * 0.35; }
  pitD(x, z) { let d = 1e9; for (const p of this.pits) d = Math.min(d, p.d(x, z)); return d; }
  pitAt(x, z) { for (const p of this.pits) if (p.d(x, z) < 0) return p; return null; }
  lakeD(x, z) { let d = 1e9; for (const L of this.lakes) d = Math.min(d, (Math.hypot((x - L.cx) / L.rx, (z - L.cz) / L.rz) - 1) * Math.min(L.rx, L.rz) + (fbm2(x * 0.4 + 9, z * 0.4) - 0.5) * L.wob * 2); return d; }
  lakeAt(x, z) { for (const L of this.lakes) if ((Math.hypot((x - L.cx) / L.rx, (z - L.cz) / L.rz) - 1) * Math.min(L.rx, L.rz) + (fbm2(x * 0.4 + 9, z * 0.4) - 0.5) * L.wob * 2 < 0) return L; return null; }
}

// ---------------------------------------------------------------- marching squares → loops
/** closed loops (arrays of [x, z]) where f = 0 over [x0, x1] × [z0, z1] at step s; rock (f > 0) on the right */
export function contours(f, x0, z0, x1, z1, s = 0.5, o = {}) {
  const NX = Math.ceil((x1 - x0) / s) + 1, NZ = Math.ceil((z1 - z0) / s) + 1, V = new Float32Array(NX * NZ);
  for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) { const v = f(x0 + i * s, z0 + k * s); V[k * NX + i] = Math.abs(v) < 1e-4 ? 1e-4 : v; }
  const segs = [], P = (i, k) => [x0 + i * s, z0 + k * s];
  const lerp = (a, b, va, vb) => { const t = va / (va - vb); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
  for (let k = 0; k < NZ - 1; k++) for (let i = 0; i < NX - 1; i++) {
    const a = V[k * NX + i], b = V[k * NX + i + 1], c = V[(k + 1) * NX + i + 1], d = V[(k + 1) * NX + i];
    const pa = P(i, k), pb = P(i + 1, k), pc = P(i + 1, k + 1), pd = P(i, k + 1);
    const e = [];
    if ((a < 0) !== (b < 0)) e.push(lerp(pa, pb, a, b));
    if ((b < 0) !== (c < 0)) e.push(lerp(pb, pc, b, c));
    if ((c < 0) !== (d < 0)) e.push(lerp(pc, pd, c, d));
    if ((d < 0) !== (a < 0)) e.push(lerp(pd, pa, d, a));
    if (e.length === 2) segs.push([e[0], e[1]]);
    else if (e.length === 4) { const m = (a + b + c + d) / 4; if ((m < 0) === (a < 0)) { segs.push([e[0], e[1]]); segs.push([e[2], e[3]]); } else { segs.push([e[0], e[3]]); segs.push([e[1], e[2]]); } }
  }
  // chain the segments by shared end points
  const key = (p) => Math.round(p[0] * 1000) + ',' + Math.round(p[1] * 1000), ends = new Map();
  segs.forEach((sg, i) => { for (const p of sg) { const k = key(p); if (!ends.has(k)) ends.set(k, []); ends.get(k).push(i); } });
  const used = new Uint8Array(segs.length), loops = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue; used[i] = 1;
    const L = [segs[i][0], segs[i][1]];
    for (;;) {
      const last = L[L.length - 1], cand = (ends.get(key(last)) || []).filter((j) => !used[j]); if (!cand.length) break;
      const j = cand[0]; used[j] = 1; const sg = segs[j]; L.push(key(sg[0]) === key(last) ? sg[1] : sg[0]);
    }
    if (L.length > 4) loops.push(L);
  }
  const out = [];
  for (let L of loops) {
    const closed = key(L[0]) === key(L[L.length - 1]); if (closed) L.pop();
    // smooth (Laplacian, twice) and resample at ~o.step metres
    for (let it = 0; it < (o.smooth ?? 2); it++) L = L.map((p, i) => { const a = L[(i - 1 + L.length) % L.length], b = L[(i + 1) % L.length]; return closed || (i > 0 && i < L.length - 1) ? [(a[0] + b[0] + p[0] * 2) / 4, (a[1] + b[1] + p[1] * 2) / 4] : p; });
    L = resample(L, o.step ?? 1.0, closed);
    if (L.length < 3) continue;
    // orientation: the rock (f > 0) on the right of the walking direction
    let score = 0;
    for (let i = 0; i < L.length; i += Math.max(1, Math.floor(L.length / 12))) {
      const a = L[i], b = L[(i + 1) % L.length], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1, nx = tz / l, nz = -tx / l, mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      score += f(mx + nx * 0.4, mz + nz * 0.4) - f(mx - nx * 0.4, mz - nz * 0.4);
    }
    if (score < 0) L.reverse();
    out.push({ pts: L, closed });
  }
  return out;
}
function resample(L, step, closed) {
  const pts = closed ? L.concat([L[0]]) : L, cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = cum[cum.length - 1], n = Math.max(3, Math.round(tot / step)), out = [];
  let j = 0;
  for (let k = 0; k < (closed ? n : n + 1); k++) {
    const s = (k / n) * tot; while (j < cum.length - 2 && cum[j + 1] < s) j++;
    const t = (s - cum[j]) / ((cum[j + 1] - cum[j]) || 1); out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t]);
  }
  return out;
}

// ---------------------------------------------------------------- the emitter (+ the lake's mirror image)
/** wraps the builder: quads / triangles into group gk; while `mirror` is set (the water level) everything is also
 *  emitted reflected in the water plane (winding reversed, so it faces the right way) */
export class Emit {
  constructor(C) { this.C = C; this.mirror = null; this.n = 0; }
  quad(gk, tex, a, b, c, d, o) {
    this.C.quad(gk, tex, a, b, c, d, o); this.n++;
    if (this.mirror !== null && Math.min(a[1], b[1], c[1], d[1]) >= this.mirror - 0.02) { const m = (p) => [p[0], 2 * this.mirror - p[1], p[2]]; this.C.quad(this.mgk || gk, tex, m(b), m(a), m(d), m(c), o); }
  }
  tri(gk, tex, a, b, c) {
    this.C.tri(gk, tex, a, b, c); this.n++;
    if (this.mirror !== null && Math.min(a[1], b[1], c[1]) >= this.mirror - 0.02) { const m = (p) => [p[0], 2 * this.mirror - p[1], p[2]]; this.C.tri(this.mgk || gk, tex, m(b), m(a), m(c)); }
  }
  /** a triangle turned to face away from point o */
  triOut(gk, tex, a, b, c, o) {
    const n = cross(sub(b, a), sub(c, a)), m = [(a[0] + b[0] + c[0]) / 3 - o[0], (a[1] + b[1] + c[1]) / 3 - o[1], (a[2] + b[2] + c[2]) / 3 - o[2]];
    if (dot(n, m) < 0) this.tri(gk, tex, a, c, b); else this.tri(gk, tex, a, b, c);
  }
  /** a quad turned to face away from point o (keeps a→b as u when it doesn't need flipping) */
  quadOut(gk, tex, a, b, c, d, o, opt) {
    const n = cross(sub(b, a), sub(d, a)), m = [(a[0] + c[0]) / 2 - o[0], (a[1] + c[1]) / 2 - o[1], (a[2] + c[2]) / 2 - o[2]];
    if (dot(n, m) < 0) this.quad(gk, tex, b, a, d, c, opt); else this.quad(gk, tex, a, b, c, d, opt);
  }
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// ---------------------------------------------------------------- walls
/**
 * Loft a loop into a wall. o: { yb(x, z), yt(x, z) bottom and top heights, tex(x, z, row) → texture, foot (texture for
 * the lowest row), gk(x, z) → group, amp (noise push, m), lean (vault inward at the top, m), under (undercut at the
 * foot, m), rowH, mirror(x, z) → water y or null }
 */
export function wallLoop(E, loop, o) {
  const P = loop.pts, n = P.length, closed = loop.closed, cols = [];
  const amp = o.amp ?? 0.55, lean = o.lean ?? 1.0, under = o.under ?? 0.3, rowH = o.rowH ?? 1.25;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const a = P[(i - 1 + n) % n], b = P[(i + 1) % n], p = P[i];
    const tx = (closed || (i > 0 && i < n - 1)) ? b[0] - a[0] : (i === 0 ? P[1][0] - p[0] : p[0] - P[n - 2][0]);
    const tz = (closed || (i > 0 && i < n - 1)) ? b[1] - a[1] : (i === 0 ? P[1][1] - p[1] : p[1] - P[n - 2][1]);
    const l = Math.hypot(tx, tz) || 1, nx = tz / l, nz = -tx / l;      // into the rock
    if (i > 0) s += Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]);
    cols.push({ x: p[0], z: p[1], nx, nz, s, yb: o.yb(p[0], p[1]), yt: o.yt(p[0], p[1]), vault: o.vaultAt ? o.vaultAt(p[0], p[1]) : 1, skip: o.skip ? o.skip(p[0], p[1]) : false });
  }
  let hmax = 0; for (const c of cols) if (!c.skip) hmax = Math.max(hmax, c.yt - c.yb);
  const R = Math.max(2, Math.ceil(hmax / rowH));
  // every column gets the same rows (heights scaled per column), so the faces stay quads
  const V = cols.map((c) => {
    const out = [];
    for (let j = 0; j <= R; j++) {
      const t = j / R, y = c.yb + (c.yt - c.yb) * t;
      // noise (shared by neighbouring strips: a function of position), an undercut just above the foot (zero at the
      // foot row itself, so a skirt strip below meets it exactly) and the vault leaning in toward the roof
      const push = (noise3(c.x * 0.55, y * 0.45, c.z * 0.55) - 0.45) * 2 * amp + under * 3.2 * t * (1 - t) ** 5 - lean * c.vault * t * t + (noise3(c.x * 1.7, y * 1.3, c.z * 1.7) - 0.5) * amp * 0.35;
      out.push([c.x + c.nx * push, y, c.z + c.nz * push]);
    }
    return out;
  });
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const i2 = (i + 1) % n, A = V[i], B = V[i2], ca = cols[i], cb = cols[i2];
    if (ca.skip && cb.skip) continue;
    const mx = (ca.x + cb.x) / 2, mz = (ca.z + cb.z) / 2, gk = o.gk(mx, mz), u0 = ca.s;
    const mir = o.mirror ? o.mirror(mx, mz) : null;
    E.mirror = mir;
    for (let j = 0; j < R; j++) {
      const tex = j === 0 && o.foot ? o.foot(mx, mz) : o.tex(mx, mz, j);
      // a (bottom-left), b (bottom-right), c (top-right), d (top-left), seen from inside the cave
      E.quad(gk, tex, A[j], B[j], B[j + 1], A[j + 1], { u0, v0: A[j][1] });
    }
    E.mirror = null;
  }
  return cols;
}

// ---------------------------------------------------------------- boxes at any angle
const _m = new THREE.Matrix4(), _v = new THREE.Vector3();
/** an oriented box: centre, size [sx (along the local x), sy, sz], yaw (about y), roll (about local x), pitch (about local z).
 *  tex for the sides; o.end for the end caps; uv lengths run along the box's long axis */
export function obox(E, gk, tex, c, s, yaw = 0, o = {}) {
  _m.makeRotationFromEuler(new THREE.Euler(o.roll || 0, yaw, o.pitch || 0, 'YXZ'));
  const hx = s[0] / 2, hy = s[1] / 2, hz = s[2] / 2;
  const T = (lx, ly, lz) => { _v.set(lx, ly, lz).applyMatrix4(_m); return [c[0] + _v.x, c[1] + _v.y, c[2] + _v.z]; };
  const p = [T(-hx, -hy, -hz), T(hx, -hy, -hz), T(hx, -hy, hz), T(-hx, -hy, hz), T(-hx, hy, -hz), T(hx, hy, -hz), T(hx, hy, hz), T(-hx, hy, hz)];
  const ctr = [c[0], c[1], c[2]], end = o.end || tex, u = o.u0 || 0;
  const long = s[1] >= s[0] && s[1] >= s[2] ? 'y' : s[0] >= s[2] ? 'x' : 'z';
  const sides = long === 'y'
    ? [[p[3], p[2], p[6], p[7]], [p[1], p[0], p[4], p[5]], [p[2], p[1], p[5], p[6]], [p[0], p[3], p[7], p[4]]]
    : long === 'x'
      ? [[p[3], p[2], p[6], p[7]], [p[1], p[0], p[4], p[5]], [p[7], p[6], p[5], p[4]], [p[0], p[1], p[2], p[3]]]
      : [[p[2], p[1], p[5], p[6]], [p[0], p[3], p[7], p[4]], [p[4], p[7], p[6], p[5]], [p[3], p[0], p[1], p[2]]];
  const caps = long === 'y' ? [[p[4], p[5], p[6], p[7]], [p[3], p[2], p[1], p[0]]] : long === 'x' ? [[p[2], p[1], p[5], p[6]], [p[0], p[3], p[7], p[4]]] : [[p[3], p[2], p[6], p[7]], [p[1], p[0], p[4], p[5]]];
  // for a horizontal long axis the texture's u runs along it; for a vertical one its v does (o.fit: the whole texture per face)
  for (const [a, b, cc, d] of sides) E.quadOut(gk, tex, a, b, cc, d, ctr, o.fit ? { fit: true } : { u0: u, v0: 0 });
  for (const [a, b, cc, d] of caps) if (!o.noCaps) E.quadOut(gk, end, a, b, cc, d, ctr, { fit: !!o.capFit });
}

// ---------------------------------------------------------------- movable pieces (own meshes)
/** a tiny accumulator with the CityBuilder's quad / tri signature, turned into meshes on demand */
export class Piece {
  constructor() { this.groups = new Map(); }
  acc(gk, tex) { const k = tex.userData.key; let A = this.groups.get(k); if (!A) this.groups.set(k, (A = { tex, P: [], N: [], U: [], I: [] })); return A; }
  quad(gk, tex, a, b, c, d, o = {}) {
    const A = this.acc(gk, tex), n = nrm(cross(sub(b, a), sub(d, a))), [tw, th] = tex.userData.size, base = A.P.length / 3;
    let uv;
    if (o.fit) uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
    else { const lu = len(sub(b, a)) / tw, lv = len(sub(d, a)) / th, u0 = (o.u0 || 0) / tw, v0 = (o.v0 || 0) / th; uv = [[u0, v0], [u0 + lu, v0], [u0 + lu, v0 + lv], [u0, v0 + lv]]; }
    for (const p of [a, b, c, d]) A.P.push(p[0], p[1], p[2]);
    for (let i = 0; i < 4; i++) A.N.push(n[0], n[1], n[2]);
    for (const t of uv) A.U.push(t[0], t[1]);
    A.I.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  tri(gk, tex, a, b, c) {
    const A = this.acc(gk, tex), n = nrm(cross(sub(b, a), sub(c, a))), [tw, th] = tex.userData.size, base = A.P.length / 3;
    for (const p of [a, b, c]) { A.P.push(p[0], p[1], p[2]); A.N.push(n[0], n[1], n[2]); }
    const ax = Math.abs(n[0]) > Math.abs(n[2]) ? 2 : 0;
    for (const p of [a, b, c]) A.U.push(p[ax] / tw, p[1] / th);
    A.I.push(base, base + 1, base + 2);
  }
  /** → a THREE.Group of meshes, materials from mat(tex) */
  build(mat) {
    const g = new THREE.Group();
    for (const A of this.groups.values()) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(A.P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(A.N, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(A.U, 2));
      geo.setIndex(A.I); geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, mat(A.tex)); m.castShadow = false; m.receiveShadow = true; g.add(m);
    }
    return g;
  }
}
// the pieces orient their faces the same way the emitter does
Piece.prototype.triOut = Emit.prototype.triOut;
Piece.prototype.quadOut = Emit.prototype.quadOut;
const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const len = (a) => Math.hypot(a[0], a[1], a[2]);

// ---------------------------------------------------------------- glow: light shafts, mist, motes
/** a soft shaft of light (a double-sided cone, additive): from (x, top, z) down to the floor */
export function lightShaft(tex, x, top, z, bottom, r0, r1, color = 0xbfe4ff, opacity = 0.16, lean = [0, 0]) {
  const h = top - bottom, g = new THREE.CylinderGeometry(r0, r1, h, 10, 1, true);
  const m = new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false });
  const mesh = new THREE.Mesh(g, m); mesh.position.set(x + lean[0] / 2, bottom + h / 2, z + lean[1] / 2); mesh.rotation.set(lean[1] / h, 0, -lean[0] / h); mesh.renderOrder = 6; mesh.userData.caveFx = true;
  return mesh;
}
/** drifting motes (dust in a light shaft, glow spores, cold air at the mouth): crisp square points animated on the GPU */
export function motes(n, box, o = {}) {
  const [x0, y0, z0, x1, y1, z1] = box, P = new Float32Array(n * 3), S = new Float32Array(n * 4), C = new Float32Array(n * 3), R = rng(o.seed || 7);
  const cols = (o.colors || ['#ffffff']).map((c) => new THREE.Color(c));
  for (let i = 0; i < n; i++) {
    P.set([x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), z0 + R() * (z1 - z0)], i * 3);
    S.set([R() * TAU, 0.4 + R() * 0.8, R(), 0.6 + R() * 0.8], i * 4);
    const c = cols[Math.floor(R() * cols.length)]; C.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(S, 4)); g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 + 2);
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSize: { value: o.size ?? 0.05 }, uScale: { value: 600 }, uGain: { value: o.gain ?? 1.2 }, uDrift: { value: new THREE.Vector3(...(o.drift || [0, 0.08, 0])) }, uBox: { value: new THREE.Vector3(x1 - x0, y1 - y0, z1 - z0) }, uMin: { value: new THREE.Vector3(x0, y0, z0) }, uWob: { value: o.wob ?? 0.25 } },
    vertexShader: `attribute vec4 aSeed; uniform float uTime; uniform float uSize; uniform float uScale; uniform vec3 uDrift; uniform vec3 uBox; uniform vec3 uMin; uniform float uWob; varying vec3 vCol; varying float vA;
      void main() {
        vec3 p = position + uDrift * uTime * aSeed.y;
        p.x += sin(uTime * 0.7 * aSeed.y + aSeed.x) * uWob; p.z += cos(uTime * 0.5 * aSeed.y + aSeed.x * 1.7) * uWob; p.y += sin(uTime * 0.9 + aSeed.x * 3.0) * uWob * 0.5;
        p = uMin + mod(p - uMin, uBox);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uSize * aSeed.w * uScale / -mv.z, 1.0, 6.0);
        float tw = 0.55 + 0.45 * sin(uTime * (1.5 + aSeed.z * 2.0) + aSeed.x * 5.0);
        vec3 q = (p - uMin) / uBox; float edge = min(min(q.x, 1.0 - q.x), min(q.z, 1.0 - q.z)) * 6.0; float ey = min(q.y, 1.0 - q.y) * 5.0;
        vA = tw * clamp(edge, 0.0, 1.0) * clamp(ey, 0.0, 1.0); vCol = color;
      }`,
    fragmentShader: 'uniform float uGain; varying vec3 vCol; varying float vA; void main() { gl_FragColor = vec4(vCol * vA * uGain, 1.0); }',
    vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
  });
  const pts = new THREE.Points(g, m); pts.renderOrder = 7; pts.userData.caveFx = true;
  return pts;
}
/** a soft noise canvas for mist planes */
let MIST = null;
export function mistTexture() {
  if (MIST) return MIST;
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), im = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N, s = 6;
    const nz = (fx, fy, k) => { const X = fx * k, Y = fy * k; const i = Math.floor(X), j = Math.floor(Y), a = h2(i % k, j % k), b = h2((i + 1) % k, j % k), cc = h2(i % k, (j + 1) % k), d = h2((i + 1) % k, (j + 1) % k), tx = sm(X - i), ty = sm(Y - j); return a + (b - a) * tx + (cc - a) * ty + (a - b - cc + d) * tx * ty; };
    const val = nz(u, v, s) * 0.55 + nz(u, v, s * 2) * 0.3 + nz(u, v, s * 4) * 0.15;
    const a = Math.max(0, Math.min(1, (val - 0.38) * 2.4)), i = (y * N + x) * 4;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(a * 255);
  }
  g.putImageData(im, 0, 0);
  MIST = new THREE.CanvasTexture(c); MIST.wrapS = MIST.wrapT = THREE.RepeatWrapping; MIST.colorSpace = THREE.SRGBColorSpace;
  return MIST;
}
export function mistPlane(x0, z0, x1, z1, y, color = 0x9ab8c8, opacity = 0.22, rep = 3) {
  const tex = mistTexture().clone(); tex.needsUpdate = true; tex.repeat.set(rep * (x1 - x0) / 20, rep * (z1 - z0) / 20);
  const m = new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false, toneMapped: true, fog: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), m); mesh.rotation.x = -Math.PI / 2; mesh.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); mesh.renderOrder = 5; mesh.userData.caveFx = true;
  mesh.userData.mist = { sx: (Math.random() - 0.5) * 0.01, sz: 0.004 + Math.random() * 0.006 };
  return mesh;
}
