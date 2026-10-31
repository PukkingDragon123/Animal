// Graphics core for the UI. Layout works in "units" (a ~640×360 grid) while the canvas runs at the screen's
// physical resolution: ui.k physical pixels per unit (3 on a 1080p screen, more on retina / 4K, DPR-aware).
// Detailed things — frames, buttons, bars, discs, icons — are painted as pixel art at PHYSICAL resolution
// (1-px outlines, multi-tone ramps, hand-placed highlights) into cached sprites and blitted snapped to
// physical pixels, so nothing is chunky and nothing is blurry. Text is crisp vector type.
//  • css(c) / rgba(c, a): colours ('#rrggbb' or packed ABGR ints from surface.P) → CSS strings (memoised)
//  • sprite(key, pw, ph, paint): a cached canvas painted from a Uint32 buffer (physical px; LRU by pixel budget)
//  • blit(ui, cv, x, y, w, h): draws a physical-resolution sprite at unit coords, snapped to device pixels
//  • ui.push / ui.pop (in ui.js): a scale-about-a-point transform stack without allocating per call
//  • rowIns(), fillRowsP(): per-row insets of rounded rects / pills and crisp physical scanline fills
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
// ------------------------------------------------------------------ the sprite cache (physical pixels)
const sprites = new Map();
let pix = 0;
const MAX_PIX = 48e6;
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
// unit → physical, through the ui's current transform (see ui.push)
export const PX = (ui, x) => Math.round(ui.ta * x + ui.te);
export const PY = (ui, y) => Math.round(ui.td * y + ui.tf);
// draw a physical-resolution sprite at unit coords (w, h default: the sprite's own size), snapped to pixels
export function blit(ui, cv, x, y, w, h) {
  if (!cv) return;
  const g = ui.g, X = PX(ui, x), Y = PY(ui, y);
  const W = w == null ? Math.round(cv.width * ui.ta / ui.k) : PX(ui, x + w) - X, H = h == null ? Math.round(cv.height * ui.td / ui.k) : PY(ui, y + h) - Y;
  g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false;
  g.drawImage(cv, X, Y, W, H);
  g.setTransform(ui.ta, 0, 0, ui.td, ui.te, ui.tf);
}
// draw at physical coords directly (the sprite's own size)
export function blitP(ui, cv, X, Y) { const g = ui.g; g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(cv, X, Y); g.setTransform(ui.ta, 0, 0, ui.td, ui.te, ui.tf); }
// a buffer painter helper
export function buf(d, w, h) { return { d, w, h, set(x, y, v) { if (x >= 0 && y >= 0 && x < w && y < h) d[y * w + x] = v; }, get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? d[y * w + x] : 0; } }; }
export const PK = (c) => P(c);

// ------------------------------------------------------------------ shapes
// row insets for a w×h shape (any units): kind 'round' (radius r), 'pill' (r = h/2), 'chamfer'
const insCache = new Map();
export function rowIns(h, r, kind = 'round') {
  h = Math.max(1, Math.round(h));
  const key = h * 8192 + Math.round(r * 4) * 4 + (kind === 'pill' ? 1 : kind === 'chamfer' ? 2 : 0);
  let A = insCache.get(key);
  if (A) return A;
  A = new Int16Array(h);
  if (kind === 'pill') r = h / 2;
  for (let j = 0; j < h; j++) {
    const d = Math.min(j, h - 1 - j);
    if (kind === 'chamfer') { A[j] = Math.max(0, Math.round(r) - d); continue; }
    if (d >= r) { A[j] = 0; continue; }
    const dy = r - d - 0.5; A[j] = Math.max(0, Math.round(r - Math.sqrt(Math.max(0, r * r - dy * dy))));
  }
  if (insCache.size > 4000) insCache.clear();
  insCache.set(key, A);
  return A;
}
// fill a rounded shape crisply in physical pixels (x, y, w, h, r in units)
export function fillShape(ui, x, y, w, h, c, r = 2, kind = 'round') {
  const X = PX(ui, x), Y = PY(ui, y), W = PX(ui, x + w) - X, H = PY(ui, y + h) - Y; if (W <= 0 || H <= 0) return;
  const g = ui.g, I = rowIns(H, Math.min(r * ui.td, H / 2, W / 2), kind);
  g.setTransform(1, 0, 0, 1, 0, 0); ui.fill(c);
  let j = 0;
  while (j < H) { let q = j; while (q + 1 < H && I[q + 1] === I[j]) q++; const ins = I[j]; if (W - ins * 2 > 0) g.fillRect(X + ins, Y + j, W - ins * 2, q - j + 1); j = q + 1; }
  g.setTransform(ui.ta, 0, 0, ui.td, ui.te, ui.tf);
}
const discCache = new Map();
export function discRows(r) {
  let A = discCache.get(r);
  if (!A) { A = []; for (let j = -r; j <= r; j++) A.push(Math.floor(Math.sqrt(Math.max(0, (r + 0.5) * (r + 0.5) - j * j)))); discCache.set(r, A); }
  return A;
}
// a crisp disc (centre / radius in units)
export function fillDisc(ui, cx, cy, r, c) {
  const X = PX(ui, cx), Y = PY(ui, cy), Rp = Math.max(0, Math.round(r * ui.td)), A = discRows(Rp), g = ui.g;
  g.setTransform(1, 0, 0, 1, 0, 0); ui.fill(c);
  for (let j = -Rp; j <= Rp; j++) { const hw = A[j + Rp]; g.fillRect(X - hw, Y + j, hw * 2 + 1, 1); }
  g.setTransform(ui.ta, 0, 0, ui.td, ui.te, ui.tf);
}

// ------------------------------------------------------------------ the Surf-compatible shim (unit coordinates)
const surfCanvas = new WeakMap();
export class CanvasSurf {
  constructor(ui) { this.ui = ui; }
  get w() { return this.ui.w; }
  get h() { return this.ui.h; }
  get g() { return this.ui.g; }
  fill(c) { return this.ui.fill(c); }
  clear() { const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, g.canvas.width, g.canvas.height); g.setTransform(this.ui.ta, 0, 0, this.ui.td, this.ui.te, this.ui.tf); return this; }
  touch() { return this; }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  px(x, y, c) { this.ui.rect(Math.floor(x), Math.floor(y), 1, 1, c); }
  blend(x, y, c, a) { const g = this.g; g.globalAlpha = Math.max(0, Math.min(1, a)); this.ui.rect(Math.floor(x), Math.floor(y), 1, 1, c); g.globalAlpha = 1; }
  rect(x, y, w, h, c) { this.ui.rect(x, y, w, h, c); }
  hline(x0, x1, y, c) { if (x1 < x0) [x0, x1] = [x1, x0]; this.ui.rect(x0, y, x1 - x0 + 1, 1, c); }
  vline(x, y0, y1, c) { if (y1 < y0) [y0, y1] = [y1, y0]; this.ui.rect(x, y0, 1, y1 - y0 + 1, c); }
  line(x0, y0, x1, y1, c) { const g = this.g; g.strokeStyle = css(c); g.lineWidth = 1; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0 + 0.5, y0 + 0.5); g.lineTo(x1 + 0.5, y1 + 0.5); g.stroke(); }
  ellipse(cx, cy, rx, ry, c) { const g = this.fill(c); g.beginPath(); g.ellipse(cx + 0.5, cy + 0.5, Math.max(0.5, rx + 0.5), Math.max(0.5, ry + 0.5), 0, 0, Math.PI * 2); g.fill(); }
  circle(cx, cy, r, c) { fillDisc(this.ui, cx, cy, r, c); }
  ring(cx, cy, rx, ry, c) { const g = this.g; g.strokeStyle = css(c); g.lineWidth = 1 / this.ui.k * Math.max(1, Math.round(this.ui.k * 0.6)); g.beginPath(); g.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry ?? rx), 0, 0, Math.PI * 2); g.stroke(); }
  poly(pts, c) { if (!pts || pts.length < 3) return; const g = this.fill(c); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fill(); }
  dither(x, y, w, h, c, density = 0.5) { const g = this.g; g.globalAlpha = density; this.ui.rect(x, y, w, h, c); g.globalAlpha = 1; }
  vgrad(x, y, w, h, cols) { const n = cols.length; for (let i = 0; i < n; i++) this.ui.rect(x, y + (h * i) / n, w, h / n + 0.01, cols[i]); }
  // an old software Surf (or anything with { w, h, data: Uint32Array }) blitted 1 px per unit
  blit(src, x, y) {
    if (!src || !src.data) return;
    let C = surfCanvas.get(src);
    if (!C || C.v !== src.version) { C = { cv: pixelCanvas(src.w, src.h, (d) => d.set(src.data)), v: src.version }; surfCanvas.set(src, C); }
    blit(this.ui, C.cv, x, y, src.w, src.h);
  }
  outline() { return this; }
}
