// Walking on the voxel world: a navigation grid built from the Fine volume, A* paths
// and voxel ray picking for tap-to-move.
//  · The grid has one cell per 2×2 voxel columns (25 cm). Every column can hold up to
//    three floors (a solid voxel with head-room above it), so stairs, balconies and
//    the upper storey of a dollhouse interior are walkable too. Water is not.
//  · Neighbouring floors connect when the step between them is small (stairs, kerbs);
//    cells next to a drop or a wall cost more, so paths keep off edges.
//  · pick() marches a camera ray through the voxels (DDA) and returns the surface hit.
import { WATER } from '../fine.js';

const FLOORS = 3;
export class NavGrid {
  constructor(v, o = {}) {
    this.v = v; this.c = o.cell || 2; this.clear = o.clear || 12; this.step = o.step || 4;
    this.NX = Math.floor(v.X / this.c); this.NZ = Math.floor(v.Z / this.c);
    this.fl = new Int16Array(this.NX * this.NZ * FLOORS).fill(-1);
    this.build();
  }
  build() {
    const { v, c, NX, NZ, clear } = this;
    for (let cz = 0; cz < NZ; cz++) for (let cx = 0; cx < NX; cx++) {
      const x = cx * c + (c >> 1), z = cz * c + (c >> 1);
      let air = clear, k = 0;                                          // the sky counts as head-room
      for (let y = v.Y - 1; y >= 0 && k < FLOORS; y--) {
        const id = v.get(x, y, z);
        if (!id) { air++; continue; }
        if (v.flag[id] & WATER) { air = 0; continue; }
        if (air >= clear) this.fl[(cz * NX + cx) * FLOORS + k++] = y + 1;
        air = 0;
      }
    }
  }
  floor(cx, cz, k) { return cx < 0 || cz < 0 || cx >= this.NX || cz >= this.NZ ? -1 : this.fl[(cz * this.NX + cx) * FLOORS + k]; }
  // the floor of a column nearest to height y (voxels); → k or -1
  nearest(cx, cz, y, max = 1e9) {
    let best = -1, bd = max;
    for (let k = 0; k < FLOORS; k++) { const f = this.floor(cx, cz, k); if (f < 0) continue; const d = Math.abs(f - y); if (d < bd) { bd = d; best = k; } }
    return best;
  }
  // the node nearest a world point (metres), searching outward when the column itself has no floor
  node(p, r = 6) {
    const vpm = this.v.vpm, cx0 = Math.floor((p.x * vpm) / this.c), cz0 = Math.floor((p.z * vpm) / this.c), y = p.y * vpm;
    for (let rad = 0; rad <= r; rad++) {
      let best = null, bd = 1e9;
      for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== rad) continue;
        const k = this.nearest(cx0 + dx, cz0 + dz, y, this.step * 3); if (k < 0) continue;
        const d = dx * dx + dz * dz + Math.abs(this.floor(cx0 + dx, cz0 + dz, k) - y) * 0.1;
        if (d < bd) { bd = d; best = [cx0 + dx, cz0 + dz, k]; }
      }
      if (best) return best;
    }
    return null;
  }
  // the neighbour floor index reachable from (cx, cz, k) in direction (dx, dz), or -1
  link(cx, cz, k, dx, dz) {
    const f = this.floor(cx, cz, k); if (f < 0) return -1;
    const k2 = this.nearest(cx + dx, cz + dz, f, this.step + 0.5);
    return k2;
  }
  edgeCost(cx, cz, k) { let n = 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (this.link(cx, cz, k, dx, dz) < 0) n++; return n; }
  // A* from world point a to b → [[x, z], …] in metres (null when unreachable)
  path(a, b, maxExpand = 40000) {
    const s = this.node(a), g = this.node(b, 10); if (!s || !g) return null;
    const { NX } = this, id = (n) => (n[1] * NX + n[0]) * FLOORS + n[2];
    const sid = id(s), gid = id(g), open = new Heap(), came = new Map(), cost = new Map([[sid, 0]]), nodes = new Map([[sid, s]]);
    const h = (n) => { const dx = Math.abs(n[0] - g[0]), dz = Math.abs(n[1] - g[1]); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
    open.push(sid, h(s));
    let found = false, n = 0;
    while (open.size && n++ < maxExpand) {
      const cur = open.pop(); if (cur === gid) { found = true; break; }
      const [cx, cz, k] = nodes.get(cur), base = cost.get(cur);
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const k2 = this.link(cx, cz, k, dx, dz); if (k2 < 0) continue;
        if (dx && dz && (this.link(cx, cz, k, dx, 0) < 0 || this.link(cx, cz, k, 0, dz) < 0)) continue;   // no corner cutting
        const nb = [cx + dx, cz + dz, k2], nid = id(nb);
        const c = base + (dx && dz ? 1.414 : 1) * (1 + this.edgeCost(nb[0], nb[1], k2) * 0.8);
        if (c < (cost.get(nid) ?? 1e9)) { cost.set(nid, c); came.set(nid, cur); nodes.set(nid, nb); open.push(nid, c + h(nb)); }
      }
    }
    if (!found) return null;
    const cells = []; for (let c = gid; c !== undefined; c = came.get(c)) cells.push(nodes.get(c)); cells.reverse();
    return this.smooth(cells).map(([cx, cz, k]) => [((cx + 0.5) * this.c) / this.v.vpm, ((cz + 0.5) * this.c) / this.v.vpm, this.floor(cx, cz, k) / this.v.vpm]);
  }
  // string pulling: drop cells while the straight line between kept cells stays walkable
  smooth(cells) {
    if (cells.length < 3) return cells;
    const out = [cells[0]]; let i = 0;
    while (i < cells.length - 1) {
      let j = cells.length - 1;
      while (j > i + 1 && !this.clearLine(cells[i], cells[j])) j--;
      out.push(cells[j]); i = j;
    }
    return out;
  }
  clearLine(a, b) {
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2); let cx = a[0], cz = a[1], k = a[2];
    for (let i = 1; i <= n; i++) {
      const x = Math.round(a[0] + ((b[0] - a[0]) * i) / n), z = Math.round(a[1] + ((b[1] - a[1]) * i) / n);
      if (x === cx && z === cz) continue;
      const dx = Math.sign(x - cx), dz = Math.sign(z - cz), k2 = this.link(cx, cz, k, dx, dz);
      if (k2 < 0 || this.edgeCost(x, z, k2) > 1) return false;
      if (dx && dz && (this.link(cx, cz, k, dx, 0) < 0 || this.link(cx, cz, k, 0, dz) < 0)) return false;
      cx = x; cz = z; k = k2;
    }
    return true;
  }
}
// march a ray (metres) through the voxels; → { x, y, z, water } at the first solid voxel's surface, or null
export function pick(v, o, d, maxM = 200) {
  const vpm = v.vpm; let x = o.x * vpm, y = o.y * vpm, z = o.z * vpm;
  let ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const sx = Math.sign(d.x) || 1, sy = Math.sign(d.y) || 1, sz = Math.sign(d.z) || 1;
  const tdx = Math.abs(1 / (d.x || 1e-9)), tdy = Math.abs(1 / (d.y || 1e-9)), tdz = Math.abs(1 / (d.z || 1e-9));
  let tx = (sx > 0 ? ix + 1 - x : x - ix) * tdx, ty = (sy > 0 ? iy + 1 - y : y - iy) * tdy, tz = (sz > 0 ? iz + 1 - z : z - iz) * tdz, t = 0;
  const max = maxM * vpm;
  while (t < max) {
    const id = v.inb(ix, iy, iz) ? v.get(ix, iy, iz) : 0;
    if (id) return { x: (o.x * vpm + d.x * t) / vpm, y: (iy + 1) / vpm, z: (o.z * vpm + d.z * t) / vpm, water: !!(v.flag[id] & WATER) };
    if (iy < 0 && sy < 0) return null;
    if (tx < ty && tx < tz) { ix += sx; t = tx; tx += tdx; } else if (ty < tz) { iy += sy; t = ty; ty += tdy; } else { iz += sz; t = tz; tz += tdz; }
  }
  return null;
}
class Heap {
  constructor() { this.k = []; this.p = []; }
  get size() { return this.k.length; }
  push(k, p) { const K = this.k, P = this.p; K.push(k); P.push(p); let i = K.length - 1; while (i > 0) { const j = (i - 1) >> 1; if (P[j] <= P[i]) break; [K[i], K[j]] = [K[j], K[i]]; [P[i], P[j]] = [P[j], P[i]]; i = j; } }
  pop() {
    const K = this.k, P = this.p, top = K[0], lk = K.pop(), lp = P.pop();
    if (K.length) { K[0] = lk; P[0] = lp; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < K.length && P[l] < P[m]) m = l; if (r < K.length && P[r] < P[m]) m = r; if (m === i) break; [K[i], K[m]] = [K[m], K[i]]; [P[i], P[m]] = [P[m], P[i]]; i = m; } }
    return top;
  }
}
