// Texture painters for Tokonmon box models (Cobblemon style, painted in code).
// A painter is (p: Pen, w, h, face, cube) → paints one face of one cube; faces
// are 'up' 'down' 'north' 'south' 'east' 'west' or 'plane'. Light comes from
// above: up faces brightest, sides graded top → bottom, a lit rim along the top
// edge, a darker seam along the bottom, soft clustered grain instead of noise.
import { shift, mix } from '../../px/paint.js';

const h2 = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 974634) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const cl = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
// ordered dither between two colours by t (0..1) at texel x, y
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const dith = (a, b, t, x, y) => (t * 16 > B4[(x & 3) + (y & 3) * 4] + 0.5 ? b : a);
// pick from a vertical ramp of colours with dithered transitions; t 0 = top, 1 = bottom
// pick from a ramp of colours as clean pixel-art bands; only a thin checkered seam where two bands meet
export function ramp(cols, t, x, y) {
  const s = cl(t) * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(s)), f = s - i;
  if (f > 0.78 && f < 0.94) return (x + y) & 1 ? cols[i + 1] : cols[i];
  return f >= 0.94 ? cols[i + 1] : cols[i];
}

// shaded body fill. o: { top, bottom (colours), grain, rim (lit top edge), seam (dark bottom edge), sides (darken east/west) }
export function shade(c, o = {}) {
  const top = o.top || shift(c, 0.22), bot = o.bottom || shift(c, -0.32);
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let col;
      if (face === 'up') col = top;
      else if (face === 'down') col = shift(bot, -0.12);
      else col = ramp([top, c, bot], h > 1 ? y / (h - 1) : 0.5, x, y);
      const g = h2(x >> 1, y >> 1, 7);
      if (g < (o.grain ?? 0.04)) col = shift(col, -0.08); else if (g > 1 - (o.grain ?? 0.04) * 0.7) col = shift(col, 0.06);
      p.px(x, y, col);
    }
    if (face !== 'up' && face !== 'down' && face !== 'plane') {
      if (o.rim !== false) for (let x = 0; x < w; x++) p.px(x, 0, shift(top, 0.18));
      if (o.seam !== false) for (let x = 0; x < w; x++) p.px(x, h - 1, shift(bot, -0.25));
    }
  };
}
// feathers: shingled rows of rounded feather tips over the body gradient. Rows are laid
// bottom-up so every row overlaps the one beneath it; each tip has a dark rim and a lit edge.
export function feathers(c, o = {}) {
  const top = o.top || shift(c, 0.22), bot = o.bottom || shift(c, -0.32), s = o.size || 8, rowH = Math.max(3, Math.round(s * 0.62));
  const base = shade(c, { ...o, grain: 0 });
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face === 'down' || face === 'up') return;
    const rows = Math.ceil(h / rowH) + 1;
    for (let r = rows; r >= 0; r--) {
      const yTop = (r - 1) * rowH + (o.y0 || 0), off = (r % 2) * (s / 2);
      for (let x0 = -s + off; x0 < w + s; x0 += s) for (let yy = 0; yy < rowH + s * 0.5 + 1; yy++) for (let xx = 0; xx < s; xx++) {
        const X = Math.round(x0 + xx), Y = yTop + yy; if (X < 0 || X >= w || Y < 0 || Y >= h) continue;
        const u = ((xx + 0.5) / s) * 2 - 1, bottom = rowH + Math.sqrt(Math.max(0, 1 - u * u)) * s * 0.42;
        if (yy > bottom) continue;
        let col = ramp([top, c, bot], h > 1 ? Y / (h - 1) : 0.5, X, Y);
        if (yy > bottom - 1.15) col = o.dark || shift(col, -0.36);
        else if (yy > bottom - 2.2 && u > 0.1) col = shift(col, -0.12);
        else if (u < -0.55 && yy < bottom - 2) col = o.lite || shift(col, 0.14);
        p.px(X, Y, col);
      }
    }
    if (o.rim !== false && face !== 'plane') for (let x = 0; x < w; x++) p.px(x, 0, shift(top, 0.14));
  };
}
// fluffy down: soft vertical tufts (chest, belly)
export function fluff(c, o = {}) {
  const base = shade(c, { grain: 0.05, ...o });
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face === 'down' || face === 'up') return;
    for (let y = 2; y < h; y += 3) for (let x = (y % 2) * 2; x < w; x += 4) { p.px(x, y, shift(c, -0.18)); p.px(x + 1, y - 1, shift(c, 0.22)); }
  };
}
// vertical ramp fill (beaks, horns, flames)
export function gradient(cols, o = {}) {
  return (p, w, h, face) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = face === 'up' ? 0 : face === 'down' ? 1 : y / Math.max(1, h - 1);
      p.px(x, y, ramp(cols, t * (o.span ?? 1) + (o.bias || 0), x, y));
    }
    if (o.edge && face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) p.px(x, h - 1, o.edge);
  };
}
// paint on top of another painter, only on the listed faces
export const on = (faces, fn) => (p, w, h, face, cube) => { if (faces.includes(face)) fn(p, w, h, face, cube); };
export const layer = (...fns) => (p, w, h, face, cube) => { for (const f of fns) f(p, w, h, face, cube); };
// fill a polygon (texel coords) with colour or fn(x, y)
export function poly(p, pts, c) {
  let y0 = 1e9, y1 = -1e9; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const xs = [], Y = y + 0.5;
    for (let i = 0; i < pts.length; i++) { const [xa, ya] = pts[i], [xb, yb] = pts[(i + 1) % pts.length]; if ((ya > Y) !== (yb > Y)) xs.push(xa + ((Y - ya) / (yb - ya)) * (xb - xa)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) p.px(x, y, typeof c === 'function' ? c(x, y) : c);
  }
}
export { shift, mix, h2 };
