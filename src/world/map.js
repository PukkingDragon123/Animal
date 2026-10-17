// Map definitions → runtime grid. A map is authored as data:
//   size [w,h], base tile char, optional rows (ASCII), paint ops, height ops,
//   buildings, props, npcs, spawns, exits, triggers, arenas.
// Coordinates: tile (i,j) covers world x∈[i,i+1), z∈[j,j+1); centre (i+.5, j+.5).
import { tileDef } from './tiles.js';
import { hash3 } from '../core/rng.js';

export function buildGrid(def) {
  const [w, h] = def.size;
  const g = { w, h, t: new Array(w * h).fill(def.base || 'g'), hgt: new Float32Array(w * h), rot: new Uint8Array(w * h), block: new Uint8Array(w * h), cost: new Float32Array(w * h).fill(1), tags: new Array(w * h).fill(null) };
  const idx = (i, j) => j * w + i;
  const inb = (i, j) => i >= 0 && j >= 0 && i < w && j < h;
  if (def.rows) def.rows.forEach((row, j) => { for (let i = 0; i < Math.min(w, row.length); i++) g.t[idx(i, j)] = row[i]; });
  const paint = (i, j, ch, rot) => { if (inb(i, j)) { g.t[idx(i, j)] = ch; if (rot != null) g.rot[idx(i, j)] = rot; } };
  for (const op of def.ops || []) {
    const [kind] = op;
    if (kind === 'rect') { const [, x, z, ww, hh, ch, rot] = op; for (let j = z; j < z + hh; j++) for (let i = x; i < x + ww; i++) paint(i, j, ch, rot); }
    else if (kind === 'circle') { const [, cx, cz, r, ch] = op; for (let j = Math.floor(cz - r); j <= Math.ceil(cz + r); j++) for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++) if (Math.hypot(i + 0.5 - cx, j + 0.5 - cz) <= r) paint(i, j, ch); }
    else if (kind === 'ring') { const [, cx, cz, r0, r1, ch] = op; for (let j = Math.floor(cz - r1); j <= Math.ceil(cz + r1); j++) for (let i = Math.floor(cx - r1); i <= Math.ceil(cx + r1); i++) { const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cz); if (d >= r0 && d <= r1) paint(i, j, ch); } }
    else if (kind === 'line') { // thick polyline: ['line', [[x,z],...], width, ch]
      const [, pts, wd, ch] = op;
      for (let s = 0; s < pts.length - 1; s++) {
        const [x0, z0] = pts[s], [x1, z1] = pts[s + 1];
        const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) * 3);
        for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n; for (let j = Math.floor(z - wd / 2); j <= Math.floor(z + wd / 2); j++) for (let i = Math.floor(x - wd / 2); i <= Math.floor(x + wd / 2); i++) if (Math.hypot(i + 0.5 - x, j + 0.5 - z) <= wd / 2 + 0.2) paint(i, j, ch); }
      }
    } else if (kind === 'scatter') { // ['scatter', x,z,w,h, ch, density, seed]
      const [, x, z, ww, hh, ch, dens, seed] = op;
      for (let j = z; j < z + hh; j++) for (let i = x; i < x + ww; i++) if (hash3(i, j, seed || 1) < dens) paint(i, j, ch);
    }
  }
  // default heights from tile defs
  for (let k = 0; k < w * h; k++) { const d = tileDef(g.t[k]); g.hgt[k] = d.h || 0; }
  for (const op of def.heights || []) {
    const [kind] = op;
    if (kind === 'rect') { const [, x, z, ww, hh, y] = op; for (let j = z; j < z + hh; j++) for (let i = x; i < x + ww; i++) if (inb(i, j) && !tileDef(g.t[idx(i, j)]).water) g.hgt[idx(i, j)] = y; }
    if (kind === 'ramp') { // ['ramp', x,z,w,h, y0, y1, axis('x'|'z')]
      const [, x, z, ww, hh, y0, y1, ax] = op;
      for (let j = z; j < z + hh; j++) for (let i = x; i < x + ww; i++) if (inb(i, j)) { const t = ax === 'x' ? (i - x + 0.5) / ww : (j - z + 0.5) / hh; g.hgt[idx(i, j)] = y0 + (y1 - y0) * t; }
    }
  }
  for (let k = 0; k < w * h; k++) { const d = tileDef(g.t[k]); if (!d.walk) g.block[k] = 1; }
  g.idx = idx; g.inb = inb;
  g.at = (x, z) => { const i = Math.floor(x), j = Math.floor(z); return inb(i, j) ? idx(i, j) : -1; };
  g.heightAt = (x, z) => { const k = g.at(x, z); return k < 0 ? 0 : (tileDef(g.t[k]).water && !tileDef(g.t[k]).shallow ? g.hgt[k] : g.hgt[k]); };
  g.walkable = (i, j) => inb(i, j) && !g.block[idx(i, j)];
  return g;
}

// Mark building and prop footprints as blocked.
export function blockRect(g, x0, z0, x1, z1) {
  for (let j = Math.floor(z0); j < Math.ceil(z1); j++) for (let i = Math.floor(x0); i < Math.ceil(x1); i++) if (g.inb(i, j)) g.block[g.idx(i, j)] = 1;
}
export function blockCircle(g, x, z, r) {
  for (let j = Math.floor(z - r); j <= Math.floor(z + r); j++) for (let i = Math.floor(x - r); i <= Math.floor(x + r); i++) {
    if (!g.inb(i, j)) continue;
    const cx = Math.max(i, Math.min(x, i + 1)), cz = Math.max(j, Math.min(z, j + 1));
    if (Math.hypot(cx - x, cz - z) < r - 0.15) g.block[g.idx(i, j)] = 1;
  }
}
