// Walking in the city: a 25 cm grid per storey (level 0 = street / ground floors, 1 and 2 = upper
// floors). Each cell is walkable or blocked and has a floor height; stairs are cells that exist on
// both storeys with the same ramped height, so walking up them changes storey seamlessly. Buildings
// stamp their id into the cells they cover (the camera cuts their roof and front walls away while
// you are inside). move() does circle-vs-grid collision with sliding, the way top-down walkers
// glide along walls; path() is an A* on a 50 cm grid for NPCs and tap-to-walk.
export const CELL = 0.25, LEVELS = 3, STEP = 0.36;

export class CityNav {
  constructor(w, d) {
    this.city = true; this.w = w; this.d = d;
    this.NX = Math.ceil(w / CELL); this.NZ = Math.ceil(d / CELL); const n = this.NX * this.NZ;
    this.walk = []; this.h = []; this.bid = []; this.stair = [];
    for (let L = 0; L < LEVELS; L++) { this.walk.push(new Uint8Array(n).fill(L === 0 ? 1 : 0)); this.h.push(new Float32Array(n).fill(L * 3)); this.bid.push(new Int16Array(n).fill(-1)); this.stair.push(new Uint8Array(n)); }
    this.zone = new Uint8Array(n); this.zones = [null];
  }
  idx(x, z) { const i = Math.floor(x / CELL), k = Math.floor(z / CELL); return i < 0 || k < 0 || i >= this.NX || k >= this.NZ ? -1 : k * this.NX + i; }
  // rect helpers (metres, inclusive of every cell the rect touches)
  each(x0, z0, x1, z1, fn) {
    const i0 = Math.max(0, Math.floor(Math.min(x0, x1) / CELL)), i1 = Math.min(this.NX - 1, Math.ceil(Math.max(x0, x1) / CELL) - 1);
    const k0 = Math.max(0, Math.floor(Math.min(z0, z1) / CELL)), k1 = Math.min(this.NZ - 1, Math.ceil(Math.max(z0, z1) / CELL) - 1);
    for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) fn(k * this.NX + i, (i + 0.5) * CELL, (k + 0.5) * CELL);
  }
  block(x0, z0, x1, z1, L = 0) { this.each(x0, z0, x1, z1, (c) => { this.walk[L][c] = 0; }); }
  open(x0, z0, x1, z1, L = 0, h) { this.each(x0, z0, x1, z1, (c, x, z) => { this.walk[L][c] = 1; if (h !== undefined) this.h[L][c] = typeof h === 'function' ? h(x, z) : h; }); }
  height(x0, z0, x1, z1, L, h) { this.each(x0, z0, x1, z1, (c, x, z) => { this.h[L][c] = typeof h === 'function' ? h(x, z) : h; }); }
  mark(x0, z0, x1, z1, L, id) { this.each(x0, z0, x1, z1, (c) => { this.bid[L][c] = id; }); }
  /** a wall: a thick line segment blocked on level L */
  wall(x0, z0, x1, z1, L = 0, t = 0.2) {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(len / (CELL * 0.5)));
    for (let s = 0; s <= n; s++) { const x = x0 + ((x1 - x0) * s) / n, z = z0 + ((z1 - z0) * s) / n; this.block(x - t / 2, z - t / 2, x + t / 2, z + t / 2, L); }
  }
  /** stairs over a rect rising along dir ('n' | 's' | 'e' | 'w': the direction you walk to go UP) from level L to L + 1 */
  stairs(x0, z0, x1, z1, dir, L = 0, y0 = L * 3, y1 = (L + 1) * 3) {
    const f = (x, z) => { const t = dir === 'n' ? (z1 - z) / (z1 - z0) : dir === 's' ? (z - z0) / (z1 - z0) : dir === 'e' ? (x - x0) / (x1 - x0) : (x1 - x) / (x1 - x0); return y0 + (y1 - y0) * Math.max(0, Math.min(1, t)); };
    for (const l of [L, L + 1]) this.each(x0, z0, x1, z1, (c, x, z) => { this.walk[l][c] = 1; this.h[l][c] = f(x, z); this.stair[l][c] = 1; });
  }
  setZone(x0, z0, x1, z1, z) { let i = this.zones.indexOf(z); if (i < 0) { i = this.zones.length; this.zones.push(z); } this.each(x0, z0, x1, z1, (c) => { this.zone[c] = i; }); }
  zoneAt(x, z) { const c = this.idx(x, z); return c < 0 ? null : this.zones[this.zone[c]]; }
  ok(x, z, L = 0) { const c = this.idx(x, z); return c >= 0 && this.walk[L][c] === 1; }
  ground(x, z, L = 0) { const c = this.idx(x, z); return c < 0 ? 0 : this.h[L][c]; }
  buildingAt(x, z, L = 0) { const c = this.idx(x, z); return c < 0 ? -1 : this.bid[L][c]; }
  isStair(x, z, L) { const c = this.idx(x, z); return c >= 0 && this.stair[L][c] === 1; }
  /** the storey whose floor is nearest height y at (x, z) */
  levelAt(x, z, y = 0) { let best = 0, bd = 1e9; for (let L = 0; L < LEVELS; L++) { const c = this.idx(x, z); if (c < 0 || !this.walk[L][c]) continue; const d = Math.abs(this.h[L][c] - y); if (d < bd) { bd = d; best = L; } } return best; }
  // can a body of radius r stand at (x, z) on level L, coming from height y?
  fits(x, z, L, r, y) {
    const c0 = this.idx(x, z); if (c0 < 0 || !this.walk[L][c0]) return false;
    const h0 = this.h[L][c0]; if (y !== undefined && Math.abs(h0 - y) > STEP) return false;
    for (let a = 0; a < 8; a++) { const px = x + Math.cos(a * 0.785) * r, pz = z + Math.sin(a * 0.785) * r, c = this.idx(px, pz); if (c < 0 || !this.walk[L][c] || Math.abs(this.h[L][c] - h0) > STEP + 0.05) return false; }
    return true;
  }
  /** move a walker; returns { x, z, y, L, hit } — slides along walls, follows ramps and stairs */
  move(x, z, dx, dz, L = 0, r = 0.26) {
    const len = Math.hypot(dx, dz), n = Math.max(1, Math.ceil(len / 0.08));
    let y = this.ground(x, z, L), hit = false;
    for (let s = 0; s < n; s++) {
      const sx = dx / n, sz = dz / n;
      if (this.fits(x + sx, z + sz, L, r, y)) { x += sx; z += sz; }
      else if (this.fits(x + sx, z, L, r, y)) { x += sx; hit = true; }
      else if (this.fits(x, z + sz, L, r, y)) { z += sz; hit = true; }
      else { hit = true; break; }
      y = this.ground(x, z, L);
      // on stairs the storey follows the height
      if (this.isStair(x, z, L)) { const up = L + 1 < LEVELS && this.isStair(x, z, L + 1) && y > L * 3 + 1.5, down = L > 0 && this.isStair(x, z, L - 1) && y < L * 3 - 1.5 + 0.01; if (up) L++; else if (down) L--; }
    }
    return { x, z, y, L, hit };
  }
  // ---- A* for NPCs (50 cm nodes on one storey) → [[x, z], …] smoothed with line-of-sight
  path(from, to, o = {}) {
    const L = o.L ?? this.levelAt(from.x, from.z, from.y ?? 0), S = 2, NX = Math.ceil(this.NX / S), NZ = Math.ceil(this.NZ / S), r = o.r ?? 0.24;
    const node = (x, z) => [Math.floor(x / (CELL * S)), Math.floor(z / (CELL * S))], cen = (i, k) => [(i + 0.5) * CELL * S, (k + 0.5) * CELL * S];
    const okN = (i, k) => { if (i < 0 || k < 0 || i >= NX || k >= NZ) return false; const [x, z] = cen(i, k); return this.fits(x, z, L, r); };
    let [si, sk] = node(from.x, from.z), [ti, tk] = node(to.x, to.z);
    // snap the goal to the nearest free node
    if (!okN(ti, tk)) { let best = null, bd = 1e9; for (let dk = -6; dk <= 6; dk++) for (let di = -6; di <= 6; di++) if (okN(ti + di, tk + dk)) { const d = di * di + dk * dk; if (d < bd) { bd = d; best = [ti + di, tk + dk]; } } if (!best) return null; [ti, tk] = best; }
    const key = (i, k) => k * NX + i, open = new Heap(), g = new Map(), came = new Map();
    const hfn = (i, k) => Math.hypot(i - ti, k - tk);
    g.set(key(si, sk), 0); open.push(key(si, sk), hfn(si, sk));
    let found = false, it = 0;
    while (open.size && it++ < (o.max || 40000)) {
      const cur = open.pop(), ci = cur % NX, ck = (cur - ci) / NX;
      if (ci === ti && ck === tk) { found = true; break; }
      const gc = g.get(cur);
      for (let dk = -1; dk <= 1; dk++) for (let di = -1; di <= 1; di++) {
        if (!di && !dk) continue; const ni = ci + di, nk = ck + dk; if (!okN(ni, nk)) continue;
        if (di && dk && (!okN(ci + di, ck) || !okN(ci, ck + dk))) continue;          // no corner cutting
        const nkey = key(ni, nk), ng = gc + (di && dk ? 1.414 : 1);
        if (ng < (g.get(nkey) ?? 1e9)) { g.set(nkey, ng); came.set(nkey, cur); open.push(nkey, ng + hfn(ni, nk)); }
      }
    }
    if (!found) return null;
    const pts = []; let c = key(ti, tk);
    while (c !== undefined) { const i = c % NX, k = (c - i) / NX; pts.unshift(cen(i, k)); c = came.get(c); }
    pts[0] = [from.x, from.z]; pts[pts.length - 1] = [to.x, to.z];
    if (!this.fits(to.x, to.z, L, r)) pts[pts.length - 1] = cen(ti, tk);
    // string-pull: drop points that can be skipped in a straight line
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) { const a = out[out.length - 1]; if (i + 1 < pts.length && this.los(a[0], a[1], pts[i + 1][0], pts[i + 1][1], L, r)) continue; out.push(pts[i]); }
    return out;
  }
  los(x0, z0, x1, z1, L, r) { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.2); for (let s = 1; s < n; s++) if (!this.fits(x0 + ((x1 - x0) * s) / n, z0 + ((z1 - z0) * s) / n, L, r)) return false; return true; }
}

class Heap {
  constructor() { this.k = []; this.p = []; }
  get size() { return this.k.length; }
  push(k, p) { const K = this.k, P = this.p; let i = K.length; K.push(k); P.push(p); while (i > 0) { const j = (i - 1) >> 1; if (P[j] <= p) break; K[i] = K[j]; P[i] = P[j]; i = j; } K[i] = k; P[i] = p; }
  pop() {
    const K = this.k, P = this.p, top = K[0], lk = K.pop(), lp = P.pop();
    if (K.length) { let i = 0; const n = K.length; for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && P[c + 1] < P[c]) c++; if (P[c] >= lp) break; K[i] = K[c]; P[i] = P[c]; i = c; } K[i] = lk; P[i] = lp; }
    return top;
  }
}
