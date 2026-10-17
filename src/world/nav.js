// Grid navigation: 8-directional A* (no corner cutting, height steps ≤ .55 m)
// + line-of-sight string pulling for smooth tap-to-move paths.
export function findPath(g, sx, sz, tx, tz, opts = {}) {
  const maxStep = opts.maxStep ?? 0.55;
  let si = Math.floor(sx), sj = Math.floor(sz), ti = Math.floor(tx), tj = Math.floor(tz);
  if (!g.inb(si, sj)) return null;
  // retarget to nearest walkable tile if the goal is blocked
  if (!g.walkable(ti, tj)) {
    const n = nearestWalkable(g, ti, tj, 6);
    if (!n) return null;
    [ti, tj] = n; tx = ti + 0.5; tz = tj + 0.5;
  }
  if (!g.walkable(si, sj)) { const n = nearestWalkable(g, si, sj, 3); if (n) [si, sj] = n; }
  const W = g.w, N = g.w * g.h;
  const start = sj * W + si, goal = tj * W + ti;
  if (start === goal) return [[tx, tz]];
  const gs = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const heap = [];
  const push = (k, f) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  const hfn = (k) => { const i = k % W, j = (k / W) | 0; const dx = Math.abs(i - ti), dz = Math.abs(j - tj); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
  gs[start] = 0; push(start, hfn(start));
  const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  let iter = 0;
  while (heap.length && iter++ < 20000) {
    const [, k] = pop();
    if (closed[k]) continue;
    if (k === goal) break;
    closed[k] = 1;
    const i = k % W, j = (k / W) | 0, hk = g.hgt[k];
    for (const [di, dj, c] of dirs) {
      const ni = i + di, nj = j + dj;
      if (!g.walkable(ni, nj)) continue;
      if (di && dj && (!g.walkable(i + di, j) || !g.walkable(i, j + dj))) continue;
      const nk = nj * W + ni;
      if (Math.abs(g.hgt[nk] - hk) > maxStep) continue;
      const ng = gs[k] + c * g.cost[nk];
      if (ng < gs[nk]) { gs[nk] = ng; came[nk] = k; push(nk, ng + hfn(nk)); }
    }
  }
  if (came[goal] < 0) return null;
  const cells = [];
  for (let k = goal; k !== start && k >= 0; k = came[k]) cells.push(k);
  cells.reverse();
  const pts = cells.map((k) => [(k % W) + 0.5, ((k / W) | 0) + 0.5]);
  pts[pts.length - 1] = [tx, tz];
  return smooth(g, [sx, sz], pts, maxStep);
}

export function nearestWalkable(g, i, j, rmax = 5) {
  for (let r = 0; r <= rmax; r++) {
    let best = null, bd = Infinity;
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
      if (g.walkable(i + di, j + dj)) { const d = di * di + dj * dj; if (d < bd) { bd = d; best = [i + di, j + dj]; } }
    }
    if (best) return best;
  }
  return null;
}

export function lineClear(g, ax, az, bx, bz, maxStep = 0.55, rad = 0.3) {
  const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d * 4);
  let prevH = g.hgt[g.at(ax, az)] ?? 0;
  for (let s = 1; s <= n; s++) {
    const x = ax + (bx - ax) * s / n, z = az + (bz - az) * s / n;
    for (const [ox, oz] of [[0, 0], [rad, 0], [-rad, 0], [0, rad], [0, -rad]]) {
      const i = Math.floor(x + ox), j = Math.floor(z + oz);
      if (!g.walkable(i, j)) return false;
    }
    const k = g.at(x, z), hh = g.hgt[k];
    if (Math.abs(hh - prevH) > maxStep) return false;
    prevH = hh;
  }
  return true;
}

function smooth(g, start, pts, maxStep) {
  const out = [];
  let cur = start, i = 0;
  while (i < pts.length) {
    let far = i;
    for (let k = pts.length - 1; k > i; k--) if (lineClear(g, cur[0], cur[1], pts[k][0], pts[k][1], maxStep)) { far = k; break; }
    out.push(pts[far]);
    cur = pts[far]; i = far + 1;
  }
  return out;
}
