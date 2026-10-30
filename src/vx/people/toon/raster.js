// A tiny RGBA raster for the toon people's hand-painted textures (works without a DOM: plain arrays,
// handed to three as nearest-filtered DataTextures for the chunky PS1 look). Row 0 is the bottom (v = 0).
import * as THREE from '../../../../vendor/three.module.js';

export const hash = (a, b = 0, c = 0) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
/** '#rrggbb' | 0xRRGGBB | [r, g, b] → [r, g, b] (0–255) */
export function rgb(c) {
  if (Array.isArray(c)) return c;
  const n = typeof c === 'string' ? parseInt(c.replace('#', ''), 16) : c | 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mul = (c, k) => [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k)];
/** a hue-aware shade: darker and a touch cooler (k < 1) or lighter and warmer (k > 1), like painted cel shadow */
export const shade = (c, k) => (k < 1 ? mix(mul(c, k), [c[2] * k * 0.9, c[0] * k * 0.7, c[1] * k * 1.05].map((v) => Math.min(255, v)), 0.12) : mix(c, [255, 250, 236], k - 1));

export class Buf {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h * 4); }
  set(x, y, c, a = 1) {
    x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const i = (y * this.w + x) * 4, d = this.d;
    if (a >= 1 || d[i + 3] === 0) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = a >= 1 ? 255 : Math.max(d[i + 3], Math.round(a * 255)); return; }
    d[i] += (c[0] - d[i]) * a; d[i + 1] += (c[1] - d[i + 1]) * a; d[i + 2] += (c[2] - d[i + 2]) * a;
  }
  get(x, y) { x = Math.max(0, Math.min(this.w - 1, Math.floor(x))); y = Math.max(0, Math.min(this.h - 1, Math.floor(y))); const i = (y * this.w + x) * 4; return [this.d[i], this.d[i + 1], this.d[i + 2]]; }
  /** paint a rect texel by texel: fn(i, j) → [r, g, b] | null (i, j from the rect's corner) */
  fill(x0, y0, w, h, fn) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const c = fn(i, j); if (c) this.set(x0 + i, y0 + j, c, c[3] ?? 1); } }
  rect(x0, y0, w, h, c, a = 1) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x0 + i, y0 + j, c, a); }
  /** a hard-edged pixel stroke (square brush) */
  line(x0, y0, x1, y1, c, wd = 1, a = 1) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)), r = (wd - 1) / 2;
    const seen = new Set();
    for (let k = 0; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / n, y = y0 + ((y1 - y0) * k) / n;
      for (let j = Math.floor(y - r); j <= Math.floor(y + r); j++) for (let i = Math.floor(x - r); i <= Math.floor(x + r); i++) { const key = j * 4096 + i; if (seen.has(key)) continue; seen.add(key); this.set(i, j, c, a); }
    }
  }
  poly(pts, c, wd = 1, a = 1) { for (let k = 0; k < pts.length - 1; k++) this.line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], c, wd, a); }
  ell(cx, cy, rx, ry, c, a = 1) { for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) { const u = (i + 0.5 - cx) / rx, v = (j + 0.5 - cy) / ry; if (u * u + v * v <= 1) this.set(i, j, c, a); } }
  /** fill a polygon (even-odd, texel centres) */
  fillPoly(pts, c, a = 1) {
    let y0 = Infinity, y1 = -Infinity; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let j = Math.floor(y0); j <= Math.ceil(y1); j++) {
      const y = j + 0.5, xs = [];
      for (let k = 0; k < pts.length; k++) { const p = pts[k], q = pts[(k + 1) % pts.length]; if ((p[1] <= y) !== (q[1] <= y)) xs.push(p[0] + ((y - p[1]) / (q[1] - p[1])) * (q[0] - p[0])); }
      xs.sort((a2, b2) => a2 - b2);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let i = Math.ceil(xs[k] - 0.5); i <= Math.floor(xs[k + 1] - 0.5); i++) this.set(i, j, c, a);
    }
  }
  copy(src) { this.d.set(src.d); return this; }
  texture() {
    const t = new THREE.DataTexture(this.d, this.w, this.h, THREE.RGBAFormat);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
    return t;
  }
}
