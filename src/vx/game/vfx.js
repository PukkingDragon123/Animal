// VFX: hand-drawn pixel-art particle sprites for battles (and the street's dust), billboarded in 3D.
//  · Every effect is a little sprite sheet painted pixel by pixel at load (seeded, so each run looks the same):
//    fire bursts, embers, sparks, water splashes and drops, leaves, electric arcs, smoke and dust puffs, impact
//    stars, hit flashes, slash arcs, debris chips, ice / metal shards, rocks, ghost flames, twinkles, snow crystals,
//    wind streaks, sound chevrons, notes. No discs and no rings: bursts, stars, shards and jagged shapes only.
//  · One atlas, nearest-filtered (no mipmaps: crisp at every size), two instanced layers (glowing / solid), a hard
//    alpha cut and an ordered-dither fade, frames played once over a particle's life or looped. Capped and pooled.
//  · elementHit(elem, pos, o) stages a matching hit for every element; burst(kind, pos, o) one effect.
// Usage: const vfx = VFX.of(app); vfx.burst('impact', pos, { scale: 1.2 }); vfx.update(dt) (feel.js ticks it).
import * as THREE from '../../../vendor/three.module.js';
import { camUniforms } from '../cards.js';

const V3 = THREE.Vector3;
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// ================================================================ the pixel painter
export class Cell {
  constructor(img, ox, oy, w, h, AW) { this.d = img.data; this.ox = ox; this.oy = oy; this.w = w; this.h = h; this.AW = AW; }
  px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return; const i = ((this.oy + y) * this.AW + this.ox + x) * 4, C = typeof c === 'string' ? hex(c) : c; this.d[i] = C[0]; this.d[i + 1] = C[1]; this.d[i + 2] = C[2]; this.d[i + 3] = 255; }
  has(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false; return this.d[((this.oy + y) * this.AW + this.ox + x) * 4 + 3] > 0; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
  line(x0, y0, x1, y1, c, th = 1) { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n; if (th <= 1) this.px(x, y, c); else this.rect(Math.round(x - th / 2), Math.round(y - th / 2), th, th, c); } }
  /** fill a polygon (even-odd) */
  poly(pts, c) {
    let y0 = Infinity, y1 = -Infinity; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const xs = [], yc = y + 0.5;
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yc) !== (b[1] <= yc)) xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0])); }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.px(x, y, c);
    }
  }
  /** a 1-px dark outline round everything painted (sprites read at any size) */
  outline(c) { const C = hex(c), add = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (!this.has(x, y) && (this.has(x - 1, y) || this.has(x + 1, y) || this.has(x, y - 1) || this.has(x, y + 1))) add.push([x, y]); for (const [x, y] of add) this.px(x, y, C); }
  /** knock out pixels by an ordered dither (k: 0 keeps all, 1 removes all) */
  erode(k) { if (k <= 0) return; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (B4[(x & 3) + (y & 3) * 4] / 16 < k) { const i = ((this.oy + y) * this.AW + this.ox + x) * 4; this.d[i + 3] = 0; } }
}
// a star polygon: n spikes, radii r0 (valleys) / r1 (tips), jitter
function starPts(cx, cy, n, r0, r1, rot, R, jit = 0.25) { const p = []; for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * Math.PI * 2 + (R() - 0.5) * jit * (Math.PI / n), r = (i & 1 ? r0 : r1) * (1 + (R() - 0.5) * jit); p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; }
// an octagonal blob test (Chebyshev with cut corners): never a disc
const oct = (dx, dy, r) => Math.max(Math.abs(dx), Math.abs(dy)) * 0.72 + (Math.abs(dx) + Math.abs(dy)) * 0.4 <= r;
// a chunky hash (2 × 2 blocks): crumbling holes in a fading puff
const crumb = (x, y) => { let h = ((x >> 1) * 374761393 + (y >> 1) * 668265263) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h & 1023) / 1023; };

// ================================================================ the sheets
export const SHEETS = {
  // a flame burst: tongues licking up, the core going white → yellow → orange → red, then breaking into embers
  fire: { w: 32, h: 40, n: 7, draw(p, k, R) {
    const T = 6, base = 38 - k * 10, pal = ['#fffbe8', '#ffe066', '#ff9a2a', '#e8401e', '#8a1e14'];
    const tongues = []; for (let i = 0; i < T; i++) tongues.push({ x: 16 + (R() - 0.5) * (10 + k * 14), h: (16 + R() * 18) * (1 - k * 0.45), w: 4 + R() * 4, ph: R() * 6 });
    for (let y = 0; y < 40; y++) for (let x = 0; x < 32; x++) {
      let I = 0;
      for (const t of tongues) { const u = (base - y) / t.h; if (u < 0 || u > 1) continue; const xc = t.x + Math.sin(u * 3 + t.ph) * 2.5 * u, hw = t.w * Math.pow(1 - u, 0.75) * (0.6 + 0.4 * Math.sin(Math.PI * Math.min(1, u * 1.6 + 0.2))); const d = Math.abs(x - xc) / Math.max(0.6, hw); if (d < 1) I = Math.max(I, (1 - d) * 0.75 + (1 - u) * 0.45); }
      I -= k * 0.42; if (I <= 0.06) continue;
      p.px(x, y, I > 0.86 ? pal[0] : I > 0.64 ? pal[1] : I > 0.42 ? pal[2] : I > 0.22 ? pal[3] : pal[4]);
    }
    for (let i = 0; i < 4 + k * 8; i++) p.px(6 + R() * 20, base - 10 - R() * 24, R() < 0.5 ? pal[1] : pal[2]);
  } },
  ember: { w: 4, h: 4, n: 3, draw(p, k) { const c = k < 0.4 ? '#fff4c0' : k < 0.8 ? '#ffb030' : '#e8401e'; p.rect(1, 1, 2, 2, c); if (k < 0.5) { p.px(1, 0, '#ffe066'); p.px(0, 2, '#ffe066'); } } },
  // a spark: thin rays, long then short
  spark: { w: 24, h: 24, n: 5, draw(p, k, R) {
    const n = 8, L = 11 * (1 - k * 0.75);
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + (R() - 0.5) * 0.3, l = L * (i & 1 ? 0.55 : 1) * (0.8 + R() * 0.4); p.line(12, 12, 12 + Math.cos(a) * l, 12 + Math.sin(a) * l, i & 1 ? '#ffd040' : '#fff6c8'); }
    p.rect(11, 11, 2, 2, '#ffffff'); if (k < 0.4) p.rect(10, 11, 4, 2, '#ffffff');
  } },
  // a splash: a crown of water thrown up and falling back
  splash: { w: 40, h: 40, n: 7, draw(p, k, R) {
    const cols = ['#ffffff', '#a8e8ff', '#4ab0f0', '#1f6ab0'];
    // the column: jagged spikes of water standing up, highest in the middle
    const up = Math.sin(Math.PI * Math.min(1, k * 1.5)) * (1 - k * 0.5);
    if (up > 0.08) for (let x = 6; x < 34; x++) {
      const c = 1 - Math.abs(x - 20) / 14, spike = (x % 4 === 1 ? 1 : x % 4 === 3 ? 0.55 : 0.75) * (0.75 + R() * 0.5), hh = Math.round(30 * up * c * spike);
      for (let y = 0; y < hh; y++) p.px(x, 39 - y, y >= hh - 2 ? cols[0] : x < 20 - 6 * c ? cols[3] : y > hh * 0.6 ? cols[1] : cols[2]);
    }
    // droplets flung off the top, raining back down
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI / 2 + (R() - 0.5) * 2.4, v = 26 + R() * 14, t = 0.12 + k * 0.85, x = 20 + Math.cos(a) * v * t, y = 39 - 10 * up + Math.sin(a) * v * t + 40 * t * t;
      if (y > 39 || y < 0) continue; const X = Math.round(x), Y = Math.round(y), s = k > 0.6 ? 2 : 3;
      p.rect(X, Y, s - 1, s, cols[2]); p.px(X, Y, cols[0]); p.px(X + s - 2, Y + s - 1, cols[3]);
    }
  } },
  drop: { w: 5, h: 7, n: 1, draw(p) { p.px(2, 0, '#a8e8ff'); p.rect(1, 1, 3, 2, '#4ab0f0'); p.rect(0, 3, 5, 3, '#4ab0f0'); p.rect(1, 6, 3, 1, '#1f6ab0'); p.px(1, 3, '#ffffff'); p.px(1, 4, '#c8f0ff'); } },
  // a leaf turning over (pointed both ends, a vein)
  leaf: { w: 10, h: 10, n: 4, draw(p, k) {
    const sq = [1, 0.6, 0.2, 0.6][Math.round(k * 3)], C = ['#8ae05a', '#4aa83a', '#2e6a2a'];
    for (let i = 0; i <= 16; i++) { const u = i / 16, ax = 1.5 + u * 7, ay = 8.5 - u * 7, hw = Math.pow(Math.sin(u * Math.PI), 1.4) * 2.8 * sq; for (let t = -hw; t <= hw; t += 0.5) p.px(ax + t * 0.71, ay + t * 0.71, t < 0 ? C[0] : C[1]); }
    p.line(1.5, 8.5, 8.5, 1.5, C[2]); p.px(0, 9, C[2]);
  } },
  // electric arcs: jagged bolts forking out from the middle, new every frame
  arc: { w: 40, h: 40, n: 6, draw(p, k, R) {
    const nb = k < 0.6 ? 3 : 2;
    for (let b = 0; b < nb; b++) {
      let x = 20, y = 20; const a0 = R() * Math.PI * 2, L = (14 + R() * 6) * (1 - k * 0.4), segs = 6;
      const pts = [[x, y]]; for (let i = 1; i <= segs; i++) { const a = a0 + (R() - 0.5) * 1.3; x = 20 + Math.cos(a0) * (L * i) / segs + Math.cos(a + 1.57) * (R() - 0.5) * 6; y = 20 + Math.sin(a0) * (L * i) / segs + Math.sin(a + 1.57) * (R() - 0.5) * 6; pts.push([x, y]); }
      for (let i = 0; i + 1 < pts.length; i++) { p.line(pts[i][0] + 1, pts[i][1], pts[i + 1][0] + 1, pts[i + 1][1], '#3ab8ff'); p.line(pts[i][0], pts[i][1] + 1, pts[i + 1][0], pts[i + 1][1] + 1, '#ffe040'); }
      for (let i = 0; i + 1 < pts.length; i++) p.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], '#ffffff');
      if (R() < 0.6) { const q = pts[3], a = a0 + (R() < 0.5 ? 0.9 : -0.9); p.line(q[0], q[1], q[0] + Math.cos(a) * 7, q[1] + Math.sin(a) * 7, '#c8f4ff'); }
    }
    p.rect(18, 18, 4, 4, k < 0.5 ? '#ffffff' : '#c8f4ff');
  } },
  // smoke / dust: lumpy blocky puffs that grow and crumble away
  smoke: { w: 32, h: 32, n: 7, draw(p, k, R) {
    const lumps = []; for (let i = 0; i < 6; i++) lumps.push([16 + (R() - 0.5) * 12, 17 + (R() - 0.5) * 9, (5 + R() * 4) * (0.65 + k * 0.6)]);
    const C = ['#a49aa8', '#7a7082', '#544a5c'];
    const gone = Math.max(0, k - 0.35) * 1.4;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { let lit = -9, inside = false; for (const [cx, cy, r] of lumps) if (oct(x - cx, y - cy, r * (1 - Math.max(0, k - 0.6) * 0.8))) { inside = true; lit = Math.max(lit, (cx - x + cy - y) / r); } if (inside && crumb(x, y) >= gone) p.px(x, y, lit > 0.35 ? C[0] : lit > -0.25 ? C[1] : C[2]); }
  } },
  dust: { w: 28, h: 20, n: 6, draw(p, k, R) {
    const lumps = []; for (let i = 0; i < 6; i++) lumps.push([14 + (R() - 0.5) * (8 + k * 14), 14 - R() * 4 - k * 3, (3.5 + R() * 3) * (0.7 + k * 0.5)]);
    const C = ['#e0cca8', '#b8a07c', '#8a7454'];
    const gone = Math.max(0, k - 0.3) * 1.35;
    for (let y = 0; y < 20; y++) for (let x = 0; x < 28; x++) { let lit = -9, inside = false; for (const [cx, cy, r] of lumps) if (oct(x - cx, (y - cy) * 1.25, r)) { inside = true; lit = Math.max(lit, (cx - x + cy - y) / r); } if (inside && crumb(x, y) >= gone) p.px(x, y, lit > 0.3 ? C[0] : lit > -0.3 ? C[1] : C[2]); }
  } },
  // the comic impact star: a jagged burst with a white core that breaks into shards
  impact: { w: 48, h: 48, n: 6, draw(p, k, R) {
    const g = Math.min(1, 0.45 + k * 1.6), sp = starPts(24, 24, 10, 7 * g, 22 * g, R() * 6, R, 0.5);
    if (k < 0.55) {
      p.poly(sp, '#ff9a2a'); p.poly(starPts(24, 24, 10, 5 * g, 17 * g, R() * 6, R, 0.4), '#ffd040'); p.poly(starPts(24, 24, 8, 4 * g, 10 * g, R() * 6, R, 0.3), '#ffffff');
      p.outline('#8a2e14');
    } else {
      // shards flying out from the star's tips
      for (let i = 0; i < 7; i++) { const a = R() * Math.PI * 2, r = 5 + R() * 9 + k * (6 + R() * 12), x = 24 + Math.cos(a) * r, y = 24 + Math.sin(a) * r * (0.7 + R() * 0.5), s = (2 + R() * 2.5) * (1.4 - k); p.poly([[x + Math.cos(a) * s * 2, y + Math.sin(a) * s * 2], [x + Math.cos(a + 2.3) * s, y + Math.sin(a + 2.3) * s], [x + Math.cos(a - 2.3) * s, y + Math.sin(a - 2.3) * s]], i & 1 ? '#ffd040' : '#ffffff'); }
      p.outline('#8a2e14');
    }
  } },
  // a hit flash: thin white spikes, gone in three frames
  flash: { w: 40, h: 40, n: 3, draw(p, k, R) { p.poly(starPts(20, 20, 12, 3 * (1 - k * 0.5), 19 * (1 - k * 0.45), R() * 6, R, 0.6), '#ffffff'); p.poly(starPts(20, 20, 6, 2, 8 * (1 - k * 0.5), R(), R, 0.3), '#fff8d0'); } },
  // a slash arc: a bright crescent sweep with a tapering tail
  slash: { w: 64, h: 32, n: 5, draw(p, k) {
    const a0 = -2.4 + k * 1.1, a1 = Math.min(-0.7, -1.9 + k * 2.2), R0 = 40, cx = 32, cy = 44;
    for (let i = 0; i <= 60; i++) {
      const u = i / 60, a = a0 + (a1 - a0) * u, th = Math.max(0, Math.sin(u * Math.PI) * 5 * (1 - k * 0.5));
      for (let t = -th; t <= th; t += 0.5) { const r = R0 + t, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; p.px(x, y, Math.abs(t) < th * 0.4 ? '#ffffff' : t > 0 ? '#c8f0ff' : '#7ac8ff'); }
    }
  } },
  // debris chips, shards, rocks
  chip: { w: 6, h: 6, n: 4, draw(p, k) { const a = k * Math.PI, s = 2.6; p.poly([[3 + Math.cos(a) * s, 3 + Math.sin(a) * s], [3 + Math.cos(a + 1.9) * s * 0.8, 3 + Math.sin(a + 1.9) * s * 0.8], [3 + Math.cos(a + 3.3) * s, 3 + Math.sin(a + 3.3) * s], [3 + Math.cos(a + 4.6) * s * 0.7, 3 + Math.sin(a + 4.6) * s * 0.7]], '#d8d0c4'); p.px(2, 2, '#ffffff'); } },
  shard: { w: 10, h: 12, n: 4, draw(p, k) { const a = k * Math.PI * 1.5; const T = (r, b) => [5 + Math.cos(a + b) * r, 6 + Math.sin(a + b) * r]; p.poly([T(5.5, 0), T(3, 2.4), T(3.5, 3.9)], '#c8f0ff'); p.poly([T(5.5, 0), T(1.2, 2.6), T(3, 2.4)], '#ffffff'); p.outline('#3a6a9a'); } },
  rock: { w: 10, h: 10, n: 3, draw(p, k, R) { const pts = []; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + k * 2, r = 3.2 + R() * 1.4; pts.push([5 + Math.cos(a) * r, 5 + Math.sin(a) * r]); } p.poly(pts, '#8a7a6a'); p.poly([[5, 5], pts[3], pts[4], pts[5]], '#a89888'); p.outline('#3a3028'); } },
  // ghost flame wisps (ecto)
  ghost: { w: 20, h: 28, n: 6, draw(p, k, R) {
    const base = 26 - k * 8, pal = ['#f4e0ff', '#c88aff', '#8a4ad8', '#4a2a8a'];
    for (let y = 0; y < 28; y++) for (let x = 0; x < 20; x++) { const u = (base - y) / (20 * (1 - k * 0.3)); if (u < 0 || u > 1) continue; const xc = 10 + Math.sin(u * 5 + k * 6) * 3 * u, hw = 5 * Math.pow(1 - u, 0.6), d = Math.abs(x - xc) / Math.max(0.5, hw); if (d >= 1) continue; const I = (1 - d) * 0.8 + (1 - u) * 0.3 - k * 0.3; if (I > 0.08) p.px(x, y, I > 0.8 ? pal[0] : I > 0.55 ? pal[1] : I > 0.3 ? pal[2] : pal[3]); }
    void R;
  } },
  // a four-point twinkle (astro), a six-arm snow crystal (cryo)
  twinkle: { w: 12, h: 12, n: 4, draw(p, k) { const L = [5, 4, 2, 1][Math.round(k * 3)]; p.line(6 - L, 6, 6 + L, 6, '#ffffff'); p.line(6, 6 - L, 6, 6 + L, '#ffffff'); p.px(5, 5, '#fff6b0'); p.px(7, 7, '#fff6b0'); p.px(5, 7, '#fff6b0'); p.px(7, 5, '#fff6b0'); } },
  snow: { w: 11, h: 11, n: 2, draw(p, k) { const c = k < 0.5 ? '#ffffff' : '#c8f0ff'; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + k * 0.5; p.line(5, 5, 5 + Math.cos(a) * 5, 5 + Math.sin(a) * 5, c); p.px(5 + Math.cos(a) * 3 + Math.cos(a + 1) * 1.2, 5 + Math.sin(a) * 3 + Math.sin(a + 1) * 1.2, c); } } },
  // wind streaks (aero) and sound chevrons (echo), a note
  wind: { w: 40, h: 14, n: 5, draw(p, k, R) { for (let i = 0; i < 4; i++) { const y = 2 + i * 3, x0 = Math.round(k * 16 + R() * 6), L = 14 + R() * 10; p.line(x0, y, x0 + L, y - 1, i & 1 ? '#e8f4ff' : '#ffffff'); p.line(x0 + L, y - 1, x0 + L + 3, y - 2, '#a8d8f0'); } } },
  chevron: { w: 24, h: 24, n: 5, draw(p, k) { for (let j = 0; j < 3; j++) { const r = 4 + j * 4 + k * 6; if (r > 11) continue; const c = j === 0 ? '#ffffff' : j === 1 ? '#ffb0e0' : '#e86ab0'; p.line(12 + r * 0.3, 12 - r, 12 + r, 12, c, 2); p.line(12 + r, 12, 12 + r * 0.3, 12 + r, c, 2); } } },
  note: { w: 9, h: 12, n: 1, draw(p) { p.rect(5, 1, 2, 8, '#2e2a3a'); p.rect(7, 1, 2, 2, '#2e2a3a'); p.rect(1, 8, 5, 3, '#e86ab0'); p.rect(2, 8, 2, 1, '#ffb0e0'); p.outline('#120e10'); } },
  // a crack burst on contact (the jagged line kind of "pow")
  crackle: { w: 32, h: 32, n: 4, draw(p, k, R) { for (let b = 0; b < 6; b++) { let x = 16, y = 16; const a = (b / 6) * Math.PI * 2 + R() * 0.5; for (let s = 0; s < 4; s++) { const nx = x + Math.cos(a + (R() - 0.5) * 1.2) * (3 + k * 2), ny = y + Math.sin(a + (R() - 0.5) * 1.2) * (3 + k * 2); p.line(x, y, nx, ny, s < 2 ? '#ffffff' : '#ffe080'); x = nx; y = ny; } } } },
};
// tint the grey sheets per use; glowing sheets draw unlit and bright
const GLOW = new Set(['fire', 'ember', 'spark', 'arc', 'impact', 'flash', 'slash', 'ghost', 'twinkle', 'snow', 'chevron', 'crackle', 'wind']);

// ================================================================ the atlas
let ATLAS = null;
function atlas() {
  if (ATLAS) return ATLAS;
  const AW = 1024, AH = 1024, cv = document.createElement('canvas'); cv.width = AW; cv.height = AH;
  const g = cv.getContext('2d'), img = g.createImageData(AW, AH), frames = {};
  let x = 1, y = 1, rowH = 0;
  for (const [name, S] of Object.entries(SHEETS)) {
    frames[name] = [];
    for (let f = 0; f < S.n; f++) {
      if (x + S.w + 1 > AW) { x = 1; y += rowH + 2; rowH = 0; }
      const cell = new Cell(img, x, y, S.w, S.h, AW);
      S.draw(cell, S.n > 1 ? f / (S.n - 1) : 0, rng(name.length * 977 + f * 131 + 7));
      frames[name].push([x / AW, 1 - (y + S.h) / AH, (x + S.w) / AW, 1 - y / AH, S.w / S.h]);
      x += S.w + 2; rowH = Math.max(rowH, S.h);
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
  return (ATLAS = { tex, frames });
}

// ================================================================ presets: sheet, life, size (m), speed, gravity, drag, play mode
const PRE = {
  fire: { s: 'fire', life: [0.42, 0.58], size: [0.7, 0.95], speed: [0, 0.4], grav: -0.8, drag: 2, once: true },
  ember: { s: 'ember', life: [0.5, 0.95], size: [0.07, 0.09], speed: [1.2, 3], grav: -1.2, drag: 1.2, once: true, spread: 1 },
  spark: { s: 'spark', life: [0.2, 0.3], size: [0.55, 0.8], speed: [0, 0.2], once: true },
  splash: { s: 'splash', life: [0.5, 0.65], size: [0.85, 1.1], speed: [0, 0.1], once: true },
  drop: { s: 'drop', life: [0.5, 0.85], size: [0.08, 0.11], speed: [2, 4], grav: 9, drag: 0.4, spread: 0.9 },
  leaf: { s: 'leaf', life: [0.9, 1.5], size: [0.16, 0.22], speed: [1.2, 2.6], grav: 1.4, drag: 2.4, loop: 8, spread: 1, flutter: true },
  arc: { s: 'arc', life: [0.28, 0.4], size: [0.75, 1.0], speed: [0, 0.2], once: true },
  smoke: { s: 'smoke', life: [0.9, 1.4], size: [0.6, 0.95], speed: [0.3, 0.8], grav: -0.5, drag: 1.6, once: true, spread: 0.8 },
  dust: { s: 'dust', life: [0.55, 0.9], size: [0.45, 0.72], speed: [0.4, 1.2], grav: -0.15, drag: 2.6, once: true, spread: 1 },
  impact: { s: 'impact', life: [0.26, 0.34], size: [0.75, 1.0], speed: [0, 0], once: true },
  flash: { s: 'flash', life: [0.1, 0.14], size: [0.9, 1.2], speed: [0, 0], once: true },
  slash: { s: 'slash', life: [0.18, 0.24], size: [0.85, 1.1], speed: [0, 0], once: true },
  chip: { s: 'chip', life: [0.6, 1.0], size: [0.07, 0.12], speed: [2.5, 5], grav: 10, drag: 0.5, loop: 14, spread: 1 },
  shard: { s: 'shard', life: [0.5, 0.8], size: [0.16, 0.24], speed: [2.4, 4.4], grav: 8, drag: 0.6, loop: 12, spread: 0.9 },
  rock: { s: 'rock', life: [0.6, 1.0], size: [0.14, 0.24], speed: [2, 4], grav: 10, drag: 0.4, loop: 8, spread: 0.8 },
  ghost: { s: 'ghost', life: [0.5, 0.7], size: [0.55, 0.72], speed: [0.3, 0.9], grav: -1, drag: 1.4, once: true, spread: 0.6 },
  twinkle: { s: 'twinkle', life: [0.45, 0.7], size: [0.2, 0.3], speed: [0.6, 2], grav: 0, drag: 2, once: true, spread: 1 },
  snow: { s: 'snow', life: [0.7, 1.1], size: [0.16, 0.22], speed: [0.8, 2], grav: 0.8, drag: 2, loop: 4, spread: 1 },
  wind: { s: 'wind', life: [0.3, 0.45], size: [0.6, 0.8], speed: [1.5, 3], grav: 0, drag: 2, once: true, spread: 0.3 },
  chevron: { s: 'chevron', life: [0.32, 0.45], size: [0.5, 0.65], speed: [0.5, 1.2], once: true, spread: 0.5 },
  note: { s: 'note', life: [0.9, 1.3], size: [0.2, 0.24], speed: [0.6, 1.2], grav: -0.6, drag: 1, spread: 0.6, flutter: true },
  crackle: { s: 'crackle', life: [0.18, 0.24], size: [0.65, 0.85], speed: [0, 0], once: true },
};
// per element: what a hit throws (kind, count, tint)
const ELEM = {
  pyro: [['fire', 1], ['ember', 8], ['spark', 1, '#ffb040']],
  hydro: [['splash', 1], ['drop', 10]],
  bio: [['leaf', 9], ['spark', 1, '#9af06a'], ['dust', 1, '#9ad07a']],
  volto: [['arc', 2], ['spark', 2, '#fff070']],
  geo: [['rock', 7], ['dust', 2], ['chip', 6, '#b8a07c']],
  echo: [['chevron', 2], ['note', 3]],
  ecto: [['ghost', 2], ['spark', 1, '#d0a0ff']],
  cryo: [['shard', 7], ['snow', 4], ['flash', 1, '#c8f0ff']],
  ferro: [['shard', 6, '#c8ccd8'], ['spark', 2], ['crackle', 1]],
  aero: [['wind', 2], ['leaf', 3], ['dust', 1, '#e8f0ff']],
  astro: [['twinkle', 8], ['flash', 1, '#fff6c0']],
  nucleo: [['spark', 2, '#b8ff4a'], ['ember', 8, '#b8ff4a'], ['smoke', 1, '#8ab04a']],
  draco: [['fire', 1, '#d08aff'], ['shard', 4, '#8a4ad8'], ['ember', 6, '#d08aff']],
};
export const ELEM_TRAIL = { pyro: 'ember', hydro: 'drop', bio: 'leaf', volto: 'spark', geo: 'chip', echo: 'note', ecto: 'ghost', cryo: 'snow', ferro: 'spark', aero: 'wind', astro: 'twinkle', nucleo: 'ember', draco: 'ember' };
const ELEM_TINT = { nucleo: '#b8ff4a', draco: '#d08aff', ferro: '#e0e4f0' };

const VERT = `attribute vec3 iPos; attribute vec2 iSize; attribute vec4 iUv; attribute vec4 iCol; attribute float iRot;
uniform vec3 uRight; uniform vec3 uUp; varying vec2 vUv; varying vec4 vCol;
void main() { vUv = vec2(mix(iUv.x, iUv.z, uv.x), mix(iUv.y, iUv.w, uv.y)); vCol = iCol;
  float c = cos(iRot), s = sin(iRot); vec2 q = vec2(position.x * iSize.x, position.y * iSize.y); q = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
  vec3 w = iPos + uRight * q.x + uUp * q.y; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0); }`;
const FRAG = `uniform sampler2D map; uniform float uLight; varying vec2 vUv; varying vec4 vCol;
float bayer4(vec2 p) { int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0)); int i = x + y * 4;
  float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
  for (int k = 0; k < 16; k++) if (k == i) return (m[k] + 0.5) / 16.0; return 0.5; }
void main() { vec4 t = texture2D(map, vUv); if (t.a < 0.5) discard; if (vCol.a < bayer4(gl_FragCoord.xy)) discard;
  gl_FragColor = vec4(t.rgb * vCol.rgb * uLight, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export class VFX {
  /** the app's one VFX system (made on first use) */
  static of(app) { if (!app.vfx) app.vfx = new VFX(app.stage); return app.vfx; }
  constructor(stage, max = 900) {
    this.st = stage; this.max = max; this.ps = []; const A = atlas(), U = camUniforms(stage);
    this.uLight = { value: 1 };
    const make = (glow) => {
      const g = new THREE.PlaneGeometry(1, 1), at = { iPos: 3, iSize: 2, iUv: 4, iCol: 4, iRot: 1 }, arr = {};
      for (const [k, n] of Object.entries(at)) { arr[k] = new Float32Array(max * n); g.setAttribute(k, new THREE.InstancedBufferAttribute(arr[k], n).setUsage(THREE.DynamicDrawUsage)); }
      const m = new THREE.ShaderMaterial({ uniforms: { map: { value: A.tex }, uRight: U.uRight, uUp: U.uUp, uLight: glow ? { value: 1.15 } : this.uLight }, vertexShader: VERT, fragmentShader: FRAG, toneMapped: !glow, depthWrite: !glow });
      const mesh = new THREE.InstancedMesh(g, m, max); mesh.frustumCulled = false; mesh.count = 0; mesh.renderOrder = glow ? 4 : 2; mesh.name = 'vfx';
      stage.scene.add(mesh); return { mesh, arr, g };
    };
    this.L = { glow: make(true), solid: make(false) };
  }
  /** one effect: kind (PRE), at pos. o: { n, scale, tint ('#rrggbb'), dir (Vector3), speed, spread, rot } */
  burst(kind, pos, o = {}) {
    const P = PRE[kind]; if (!P) return;
    const fr = atlas().frames[P.s], n = o.n ?? 1, sc = o.scale || 1, tint = o.tint ? hex(o.tint).map((v) => v / 255) : null;
    for (let i = 0; i < n; i++) {
      if (this.ps.length >= this.max) this.ps.shift();          // the oldest go first: never more than the cap
      const r = Math.random, sp = (P.speed[0] + (P.speed[1] - P.speed[0]) * r()) * (o.speed ?? 1), spread = o.spread ?? P.spread ?? 0.5;
      const d = o.dir ? o.dir.clone() : new V3(0, 1, 0); d.x += (r() - 0.5) * spread * 2; d.y += (r() - 0.5) * spread * 2; d.z += (r() - 0.5) * spread * 2; d.normalize();
      const life = P.life[0] + (P.life[1] - P.life[0]) * r();
      this.ps.push({ P, fr, glow: GLOW.has(P.s), x: pos.x + (o.jit ? (r() - 0.5) * o.jit : 0), y: pos.y + (o.jit ? (r() - 0.5) * o.jit * 0.6 : 0), z: pos.z + (o.jit ? (r() - 0.5) * o.jit : 0), vx: d.x * sp, vy: d.y * sp, vz: d.z * sp, age: 0, life, size: (P.size[0] + (P.size[1] - P.size[0]) * r()) * sc, rot: o.rot ?? (P.once && P.s !== 'fire' && P.s !== 'ghost' && P.s !== 'smoke' && P.s !== 'dust' && P.s !== 'splash' ? r() * 6.28 : 0), spin: P.loop ? (r() - 0.5) * 6 : 0, f0: Math.floor(r() * fr.length), tint, ph: r() * 6.28 });
    }
  }
  /** a whole hit for an element: the impact star (and a flash on a crit), the element's own sprites, chips */
  elementHit(elem, pos, o = {}) {
    const pw = o.power ?? 1, sc = 0.75 + pw * 0.22;
    this.burst('impact', pos, { scale: sc * (o.crit ? 1.35 : 1) });
    if (o.crit || pw > 1.4) this.burst('flash', pos, { scale: sc * 1.2 });
    for (const [k, n, tint] of ELEM[elem] || [['spark', 2]]) this.burst(k, pos, { n: Math.max(1, Math.round(n * (P1(k) ? 1 : 0.6 + pw * 0.4))), scale: P1(k) ? sc : 1, tint: tint || ELEM_TINT[elem], dir: o.dir, jit: P1(k) ? 0.15 : 0.2 });
    if (pw > 0.8) this.burst('chip', pos, { n: Math.round(3 + pw * 3), tint: o.chip || '#d8d0c4' });
  }
  /** a slash across a point, tinted (melee swings) */
  slash(pos, o = {}) { this.burst('slash', pos, { scale: o.scale || 1, tint: o.tint, rot: o.rot ?? (Math.random() - 0.5) * 1.6 }); }
  /** a little trail puff for a projectile of an element */
  trail(elem, pos) { this.burst(ELEM_TRAIL[elem] || 'spark', pos, { n: 1, scale: 0.7, speed: 0.3, tint: ELEM_TINT[elem] }); }
  /** a projectile's own head: one short-lived sprite each frame */
  head(elem, pos) { const k = { pyro: 'fire', volto: 'arc', ecto: 'ghost', hydro: 'splash', cryo: 'snow', astro: 'twinkle', echo: 'chevron', aero: 'wind' }[elem] || 'spark'; this.burst(k, pos, { scale: 0.42, tint: ELEM_TINT[elem] }); const p = this.ps[this.ps.length - 1]; if (p) { p.life = 0.07; p.age = 0.03; } }
  dust(pos, n = 3, scale = 1) { this.burst('dust', pos, { n, scale, jit: 0.4 }); }
  smoke(pos, n = 2, scale = 1) { this.burst('smoke', pos, { n, scale, jit: 0.5 }); }
  clear() { this.ps.length = 0; }
  update(dt) {
    const L = this.L, st = this.st; let ng = 0, ns = 0;
    if (st && st.sun && st.hemi) this.uLight.value = Math.max(0.3, Math.min(1.05, st.sun.intensity * 0.1 + st.hemi.intensity * 0.55));
    for (let i = this.ps.length - 1; i >= 0; i--) {
      const q = this.ps[i], P = q.P; q.age += dt;
      if (q.age >= q.life) { this.ps[i] = this.ps[this.ps.length - 1]; this.ps.pop(); continue; }
      const dr = Math.exp(-(P.drag || 0) * dt); q.vx *= dr; q.vy = q.vy * dr - (P.grav || 0) * dt; q.vz *= dr;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.rot += q.spin * dt;
      if (P.flutter) q.x += Math.sin(q.age * 7 + q.ph) * 0.4 * dt;
    }
    for (const q of this.ps) {
      const P = q.P, k = q.age / q.life, lay = q.glow ? L.glow : L.solid, j = q.glow ? ng++ : ns++;
      const fi = P.once ? Math.min(q.fr.length - 1, Math.floor(k * q.fr.length)) : P.loop ? (q.f0 + Math.floor(q.age * P.loop)) % q.fr.length : 0, f = q.fr[fi];
      const s = q.size, asp = f[4];
      lay.arr.iPos[j * 3] = q.x; lay.arr.iPos[j * 3 + 1] = q.y; lay.arr.iPos[j * 3 + 2] = q.z;
      lay.arr.iSize[j * 2] = s * asp; lay.arr.iSize[j * 2 + 1] = s;
      lay.arr.iUv.set(f.slice(0, 4), j * 4); lay.arr.iRot[j] = q.rot;
      const t = q.tint || [1, 1, 1], a = P.once ? 1 : clamp01((1 - k) * 4);
      lay.arr.iCol[j * 4] = t[0]; lay.arr.iCol[j * 4 + 1] = t[1]; lay.arr.iCol[j * 4 + 2] = t[2]; lay.arr.iCol[j * 4 + 3] = a;
    }
    for (const [lay, n] of [[L.glow, ng], [L.solid, ns]]) { if (!lay.mesh.parent && st) st.scene.add(lay.mesh); lay.mesh.count = n; /* (a world load may have swept it out) */ if (n) for (const a of Object.values(lay.g.attributes)) if (a.isInstancedBufferAttribute) { a.needsUpdate = true; a.clearUpdateRanges && a.clearUpdateRanges(); } }
  }
}
// the big single sprites (one per hit) vs the scattered small ones
const P1 = (k) => ['fire', 'splash', 'arc', 'impact', 'flash', 'ghost', 'smoke', 'dust', 'wind', 'chevron', 'crackle'].includes(k);
