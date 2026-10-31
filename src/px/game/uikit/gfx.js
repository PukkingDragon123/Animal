// Pixel graphics core for the UI. The UI canvas is the art grid itself (one canvas pixel = one art pixel,
// about 640×360 on a 1080p screen); the page scales it up by a whole number with nearest-neighbour, so
// every pixel stays crisp. Nothing here anti-aliases: shapes are scanline runs of fillRect at integer
// coordinates, and anything detailed (frames, buttons, discs, icons, glyphs) is painted once into a
// packed-pixel sprite and blitted after that.
//  • css(c) / rgba(c, a): colours ('#rrggbb' or packed ABGR ints from surface.P) → CSS strings (memoised)
//  • sprite(key, w, h, paint) → a cached canvas painted from a Uint32 buffer (LRU by pixel budget)
//  • blit(ui, cv, x, y): integer-aligned drawImage, smoothing off
//  • rowIns(): per-row insets of pixel rounded rects / pills / chamfers (cached)
//  • CanvasSurf: a Surf-compatible shim (px, rect, hline, line, ellipse, poly, blend, blit…) for older code
import { rgb } from '../../color.js';
import { P } from '../../surface.js';

const cssCache = new Map();
export function css(c) {
  if (typeof c === 'string') return c;
  if (c == null) return '#000000';
  let v = cssCache.get(c);
  if (v) return v;
  const n = c >>> 0, r = n & 255, g = (n >>> 8) & 255, b = (n >>> 16) & 255, a = (n >>> 24) / 255;
  v = a >= 0.999 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a.toFixed(3)})`;
  if (cssCache.size > 4096) cssCache.clear();
  cssCache.set(c, v);
  return v;
}
const rgbaCache = new Map();
export function rgba(c, a) {
  if (typeof c !== 'string') c = css(c);
  const q = Math.max(0, Math.min(32, Math.round(a * 32)));
  let A = rgbaCache.get(c); if (!A) rgbaCache.set(c, (A = new Map()));
  let v = A.get(q);
  if (v === undefined) { if (c[0] === '#') { const [r, g, b] = rgb(c); v = `rgba(${r},${g},${b},${(q / 32).toFixed(3)})`; } else v = c; A.set(q, v); }
  return v;
}
export function makeCanvas(w, h) {
  w = Math.max(1, Math.ceil(w)); h = Math.max(1, Math.ceil(h));
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  if (typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  return null;
}
// rows of packed colours → a canvas at 1 px per pixel
export function pixelCanvas(w, h, put) {
  const cv = makeCanvas(w, h); if (!cv) return null;
  const c2 = cv.getContext('2d'), img = c2.createImageData(w, h), d32 = new Uint32Array(img.data.buffer);
  put(d32, w, h);
  c2.putImageData(img, 0, 0);
  return cv;
}
// ------------------------------------------------------------------ the sprite cache
const sprites = new Map();
let pix = 0;
const MAX_PIX = 12e6;
export function sprite(key, w, h, paint) {
  let S = sprites.get(key);
  if (S) { sprites.delete(key); sprites.set(key, S); return S; }
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  S = pixelCanvas(w, h, paint);
  if (!S) return null;
  sprites.set(key, S); pix += w * h;
  while (pix > MAX_PIX && sprites.size > 1) { const k0 = sprites.keys().next().value, o = sprites.get(k0); sprites.delete(k0); pix -= o.width * o.height; }
  return S;
}
export function clearSprites() { sprites.clear(); pix = 0; }
export function blit(ui, cv, x, y, w, h) {
  if (!cv) return;
  const g = ui.g; g.imageSmoothingEnabled = false;
  if (w == null) g.drawImage(cv, Math.round(x), Math.round(y)); else g.drawImage(cv, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
// a buffer painter helper: { d, w, h, set(x, y, v), fill(v) }
export function buf(d, w, h) { return { d, w, h, set(x, y, v) { if (x >= 0 && y >= 0 && x < w && y < h) d[y * w + x] = v; }, get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? d[y * w + x] : 0; } }; }
export const PK = (c) => P(c);

// ------------------------------------------------------------------ pixel shapes
// row insets for a w×h shape: kind 'round' (radius r), 'pill' (r = h/2), 'chamfer' (r px diagonal cut)
const insCache = new Map();
export function rowIns(h, r, kind = 'round') {
  const key = h * 4096 + r * 8 + (kind === 'pill' ? 1 : kind === 'chamfer' ? 2 : 0);
  let A = insCache.get(key);
  if (A) return A;
  A = new Int16Array(h);
  if (kind === 'pill') r = h / 2;
  for (let j = 0; j < h; j++) {
    const dTop = j, dBot = h - 1 - j, d = Math.min(dTop, dBot);
    if (kind === 'chamfer') { A[j] = Math.max(0, Math.round(r) - d); continue; }
    if (d >= r) { A[j] = 0; continue; }
    const dy = r - d - 0.5; A[j] = Math.max(0, Math.round(r - Math.sqrt(Math.max(0, r * r - dy * dy))));
  }
  if (insCache.size > 2000) insCache.clear();
  insCache.set(key, A);
  return A;
}
// fill a shape (crisp scanlines) on the ui canvas
export function fillShape(ui, x, y, w, h, c, r = 2, kind = 'round') {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h); if (w <= 0 || h <= 0) return;
  const g = ui.fill(c), I = rowIns(h, Math.min(r, h / 2, w / 2), kind);
  let j = 0;
  while (j < h) { let k = j; while (k + 1 < h && I[k + 1] === I[j]) k++; const ins = I[j]; if (w - ins * 2 > 0) g.fillRect(x + ins, y + j, w - ins * 2, k - j + 1); j = k + 1; }
}
// a pixel disc (midpoint-ish, symmetric)
const discCache = new Map();
export function discRows(r) {
  let A = discCache.get(r);
  if (!A) { A = []; for (let j = -r; j <= r; j++) A.push(Math.floor(Math.sqrt(Math.max(0, (r + 0.5) * (r + 0.5) - j * j)))); discCache.set(r, A); }
  return A;
}
export function fillDisc(ui, cx, cy, r, c) {
  cx = Math.round(cx); cy = Math.round(cy); r = Math.max(0, Math.round(r));
  const g = ui.fill(c), A = discRows(r);
  for (let j = -r; j <= r; j++) { const hw = A[j + r]; g.fillRect(cx - hw, cy + j, hw * 2 + 1, 1); }
}

// ------------------------------------------------------------------ the Surf-compatible shim
const surfCanvas = new WeakMap();
export class CanvasSurf {
  constructor(ui) { this.ui = ui; }
  get w() { return this.ui.w; }
  get h() { return this.ui.h; }
  get g() { return this.ui.g; }
  fill(c) { return this.ui.fill(c); }
  clear() { const g = this.g; g.clearRect(0, 0, g.canvas.width, g.canvas.height); return this; }
  touch() { return this; }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  px(x, y, c) { this.fill(c).fillRect(Math.floor(x), Math.floor(y), 1, 1); }
  blend(x, y, c, a) { const g = this.g; g.globalAlpha = Math.max(0, Math.min(1, a)); this.fill(c).fillRect(Math.floor(x), Math.floor(y), 1, 1); g.globalAlpha = 1; }
  rect(x, y, w, h, c) { x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h); if (w > 0 && h > 0) this.fill(c).fillRect(x, y, w, h); }
  hline(x0, x1, y, c) { if (x1 < x0) [x0, x1] = [x1, x0]; this.rect(x0, y, x1 - x0 + 1, 1, c); }
  vline(x, y0, y1, c) { if (y1 < y0) [y0, y1] = [y1, y0]; this.rect(x, y0, 1, y1 - y0 + 1, c); }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const g = this.fill(c), dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (let n = 0; n < 4096; n++) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  ellipse(cx, cy, rx, ry, c) {
    cx = Math.round(cx); cy = Math.round(cy); const g = this.fill(c);
    for (let j = -Math.round(ry); j <= Math.round(ry); j++) { const hw = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (j * j) / ((ry + 0.5) * (ry + 0.5))))); g.fillRect(cx - hw, cy + j, hw * 2 + 1, 1); }
  }
  circle(cx, cy, r, c) { fillDisc(this.ui, cx, cy, r, c); }
  ring(cx, cy, rx, ry, c) {
    ry = ry ?? rx; const g = this.fill(c); cx = Math.round(cx); cy = Math.round(cy);
    const n = Math.max(12, Math.round((rx + ry) * 3.2)), seen = new Set();
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, X = Math.round(cx + Math.cos(a) * rx), Y = Math.round(cy + Math.sin(a) * ry), k = X * 65536 + Y; if (!seen.has(k)) { seen.add(k); g.fillRect(X, Y, 1, 1); } }
  }
  poly(pts, c) {
    if (!pts || pts.length < 3) return;
    const g = this.fill(c); let y0 = Infinity, y1 = -Infinity; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const yy = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yy) !== (b[1] <= yy)) xs.push(a[0] + ((yy - a[1]) / (b[1] - a[1])) * (b[0] - a[0])); }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) { const xa = Math.round(xs[i]), xb = Math.round(xs[i + 1]); if (xb > xa) g.fillRect(xa, y, xb - xa, 1); }
    }
  }
  dither(x, y, w, h, c, density = 0.5) { const g = this.g; g.globalAlpha = density; this.rect(x, y, w, h, c); g.globalAlpha = 1; }
  vgrad(x, y, w, h, cols) { const n = cols.length; for (let j = 0; j < h; j++) this.rect(x, y + j, w, 1, cols[Math.min(n - 1, Math.floor((j / h) * n))]); }
  // an old software Surf (or anything with { w, h, data: Uint32Array }) blitted 1:1
  blit(src, x, y) {
    if (!src || !src.data) return;
    let C = surfCanvas.get(src);
    if (!C || C.v !== src.version) { C = { cv: pixelCanvas(src.w, src.h, (d) => d.set(src.data)), v: src.version }; surfCanvas.set(src, C); }
    blit(this.ui, C.cv, x, y);
  }
  outline() { return this; }
}
