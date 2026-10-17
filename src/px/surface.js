// Surf: a crisp pixel buffer (Uint32 RGBA, no anti-aliasing) with the drawing
// primitives pixel art needs. Colours are '#hex' strings or packed ints.
import { pack, rgb, bayer } from './color.js';

const packCache = new Map();
export function P(c) {
  if (typeof c === 'number') return c;
  let v = packCache.get(c);
  if (v === undefined) { v = pack(c); packCache.set(c, v); }
  return v;
}
export const CLEAR = 0;

let mkCanvas = (w, h) => {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
};
export function canvas(w, h) { return mkCanvas(Math.max(1, w | 0), Math.max(1, h | 0)); }
export function domCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

export class Surf {
  constructor(w, h) {
    this.w = w | 0; this.h = h | 0;
    this.data = new Uint32Array(this.w * this.h);
    this._cv = null; this.dirty = true;
  }
  clear(c = 0) { this.data.fill(c ? P(c) : 0); this.dirty = true; return this; }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.data[y * this.w + x] : 0; }
  px(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.data[y * this.w + x] = P(c); }
  // blend a colour over a pixel with alpha 0..1
  blend(x, y, c, a) {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const i = y * this.w + x, d = this.data[i];
    const [r, g, b] = rgb(c);
    const dr = d & 255, dg = (d >>> 8) & 255, db = (d >>> 16) & 255, da = (d >>> 24) & 255;
    if (!da) { this.data[i] = pack([r, g, b], Math.round(a * 255)); return; }
    this.data[i] = pack([dr + (r - dr) * a, dg + (g - dg) * a, db + (b - db) * a], Math.max(da, Math.round(a * 255)));
  }
  rect(x, y, w, h, c) {
    const v = P(c);
    const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y)), x1 = Math.min(this.w, Math.round(x + w)), y1 = Math.min(this.h, Math.round(y + h));
    for (let j = y0; j < y1; j++) this.data.fill(v, j * this.w + x0, j * this.w + Math.max(x0, x1));
    return this;
  }
  hline(x0, x1, y, c) { if (x1 < x0) [x0, x1] = [x1, x0]; this.rect(x0, y, x1 - x0 + 1, 1, c); }
  vline(x, y0, y1, c) { if (y1 < y0) [y0, y1] = [y1, y0]; this.rect(x, y0, 1, y1 - y0 + 1, c); }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const v = P(c), dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      if (x0 >= 0 && y0 >= 0 && x0 < this.w && y0 < this.h) this.data[y0 * this.w + x0] = v;
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  // filled ellipse (pixel-perfect, symmetric)
  ellipse(cx, cy, rx, ry, c) {
    const v = P(c);
    for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) {
      if (j < 0 || j >= this.h) continue;
      const t = (j + 0.5 - cy) / ry; if (Math.abs(t) > 1) continue;
      const hw = rx * Math.sqrt(1 - t * t);
      const x0 = Math.max(0, Math.round(cx - hw)), x1 = Math.min(this.w, Math.round(cx + hw));
      if (x1 > x0) this.data.fill(v, j * this.w + x0, j * this.w + x1);
    }
    return this;
  }
  circle(cx, cy, r, c) { return this.ellipse(cx, cy, r, r, c); }
  ring(cx, cy, rx, ry, c) {
    const n = Math.max(12, Math.ceil((rx + ry) * 3));
    let px = null, py = null;
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, x = Math.round(cx + Math.cos(a) * rx), y = Math.round(cy + Math.sin(a) * ry); if (px !== null) this.line(px, py, x, y, c); px = x; py = y; }
  }
  // filled polygon, points [[x,y],...] (scanline, even-odd)
  poly(pts, c) {
    const v = P(c);
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let j = Math.max(0, Math.floor(y0)); j <= Math.min(this.h - 1, Math.ceil(y1)); j++) {
      const yc = j + 0.5, xs = [];
      for (let i = 0, k = pts.length - 1; i < pts.length; k = i++) {
        const [xa, ya] = pts[k], [xb, yb] = pts[i];
        if ((ya <= yc && yb > yc) || (yb <= yc && ya > yc)) xs.push(xa + ((yc - ya) / (yb - ya)) * (xb - xa));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const a = Math.max(0, Math.round(xs[i])), b = Math.min(this.w, Math.round(xs[i + 1]));
        if (b > a) this.data.fill(v, j * this.w + a, j * this.w + b);
      }
    }
    return this;
  }
  // ordered-dither fill: density 0..1 of colour c over the rect
  dither(x, y, w, h, c, density = 0.5, ox = 0, oy = 0) {
    const v = P(c);
    for (let j = Math.max(0, y | 0); j < Math.min(this.h, (y + h) | 0); j++) for (let i = Math.max(0, x | 0); i < Math.min(this.w, (x + w) | 0); i++) if (bayer(i + ox, j + oy) < density) this.data[j * this.w + i] = v;
  }
  // vertical gradient through colours, dithered between bands
  vgrad(x, y, w, h, cols, dith = true) {
    const n = cols.length - 1;
    for (let j = 0; j < h; j++) {
      const t = (j / Math.max(1, h - 1)) * n, k = Math.min(n - 1, Math.floor(t)), f = t - k;
      for (let i = 0; i < w; i++) {
        const X = (x + i) | 0, Y = (y + j) | 0;
        if (X < 0 || Y < 0 || X >= this.w || Y >= this.h) continue;
        this.data[Y * this.w + X] = P(dith && bayer(X, Y) < f ? cols[k + 1] : cols[k]);
      }
    }
  }
  // copy another surf (transparent pixels skipped), optional horizontal flip
  blit(src, x, y, flip = false) {
    x = Math.round(x); y = Math.round(y);
    for (let j = 0; j < src.h; j++) {
      const Y = y + j; if (Y < 0 || Y >= this.h) continue;
      for (let i = 0; i < src.w; i++) {
        const v = src.data[j * src.w + (flip ? src.w - 1 - i : i)];
        if (!(v >>> 24)) continue;
        const X = x + i; if (X < 0 || X >= this.w) continue;
        this.data[Y * this.w + X] = v;
      }
    }
    this.dirty = true;
  }
  // 1px outline around opaque pixels: colour fn(neighbourPixel) or fixed colour
  outline(col, diag = false) {
    const w = this.w, h = this.h, d = this.data, out = new Uint32Array(d);
    const fixed = typeof col === 'function' ? null : P(col);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (d[j * w + i] >>> 24) continue;
      let nb = 0;
      const t = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const v = d[y * w + x]; if (v >>> 24 && !nb) nb = v; };
      t(i - 1, j); t(i + 1, j); t(i, j - 1); t(i, j + 1);
      if (diag && !nb) { t(i - 1, j - 1); t(i + 1, j - 1); t(i - 1, j + 1); t(i + 1, j + 1); }
      if (nb) out[j * w + i] = fixed ?? P(col(nb));
    }
    this.data = out; this.dirty = true;
    return this;
  }
  // bounding box of opaque pixels
  bounds() {
    let x0 = this.w, y0 = this.h, x1 = -1, y1 = -1;
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) if (this.data[j * this.w + i] >>> 24) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    return x1 < 0 ? null : { x0, y0, x1, y1 };
  }
  // → canvas (cached until dirty)
  canvas() {
    if (!this._cv || this._cv.width !== this.w || this._cv.height !== this.h) { this._cv = canvas(this.w, this.h); this.dirty = true; }
    if (this.dirty) {
      const ctx = this._cv.getContext('2d');
      const img = ctx.createImageData(this.w, this.h);
      new Uint32Array(img.data.buffer).set(this.data);
      ctx.putImageData(img, 0, 0);
      this.dirty = false;
    }
    return this._cv;
  }
  touch() { this.dirty = true; return this; }
  static fromCanvas(cv) {
    const s = new Surf(cv.width, cv.height);
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
    s.data.set(new Uint32Array(d.data.buffer));
    return s;
  }
}

// small seeded RNG for painters (deterministic scenes)
export function rng(seed = 1) {
  let s = (seed >>> 0) || 1;
  const f = () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.range = (a, b) => a + (b - a) * f();
  f.int = (a, b) => Math.floor(a + (b - a + 1) * f());
  f.pick = (arr) => arr[Math.floor(f() * arr.length)];
  f.chance = (p) => f() < p;
  return f;
}
// 2D value noise (for textures)
export function noise2(x, y, seed = 0) {
  const h = (i, j) => { let n = (i * 374761393 + j * 668265263 + seed * 1442695041) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
