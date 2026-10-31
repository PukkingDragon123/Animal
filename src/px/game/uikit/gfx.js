// Canvas helpers for the high-resolution UI. The UI draws with Canvas2D at the real screen resolution,
// in "logical" units (the old ~480×270 layout grid) scaled by the canvas transform, so every layout
// keeps working while text, panels and shapes come out smooth. Pixel-art icons are small sprite
// canvases scaled up crisp (no smoothing).
//  • css(c): any colour the game uses ('#rrggbb' strings or packed ABGR ints from surface.P) → CSS
//  • rgba(c, a): '#rrggbb' + alpha → CSS (memoised, alpha quantised)
//  • rr(): rounded-rect path · makeCanvas()
//  • cachedDraw(): paint something once into a hi-res sprite and reuse it while it keeps its size
//    (panels, buttons, bezels): the lag fix — vector work happens once, frames only blit
//  • CanvasSurf: a Surf-compatible shim (px, rect, hline, line, ellipse, poly, blend, blit…) so older
//    code that pokes at ui.s keeps working on the canvas
import { rgb } from '../../color.js';

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
  const q = Math.max(0, Math.min(64, Math.round(a * 64)));
  let A = rgbaCache.get(c); if (!A) rgbaCache.set(c, (A = new Map()));
  let v = A.get(q);
  if (v === undefined) {
    if (c[0] === '#') { const [r, g, b] = rgb(c); v = `rgba(${r},${g},${b},${(q / 64).toFixed(3)})`; }
    else v = c;
    A.set(q, v);
  }
  return v;
}
export function makeCanvas(w, h) {
  w = Math.max(1, Math.ceil(w)); h = Math.max(1, Math.ceil(h));
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  if (typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  return null;
}
// rounded-rect path (r clamps to a pill)
export function rr(g, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  if (r <= 0) { g.rect(x, y, w, h); return; }
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
export function circle(g, cx, cy, r) { g.beginPath(); g.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2); }
export function vgrad(g, y0, y1, stops) {
  const gr = g.createLinearGradient(0, y0, 0, y1), n = stops.length - 1;
  stops.forEach((c, i) => gr.addColorStop(n ? i / n : 0, css(c)));
  return gr;
}

// ------------------------------------------------------------------ sprite cache
// key → { cv, w, h, pad, kx, ky, last }; a sprite is made only once the same thing has been asked for on
// a few frames running (a panel that animates its size is drawn as vectors until it settles)
const sprites = new Map(), pending = new Map();
let pixBudget = 0;
const MAX_PIX = 40e6;
export function cachedDraw(ui, key, x, y, w, h, pad, paint) {
  const g = ui.g, kx = ui.kx, ky = ui.ky;
  let S = sprites.get(key);
  if (S && (S.kx !== kx || S.ky !== ky)) { sprites.delete(key); pixBudget -= S.px; S = null; }
  if (!S) {
    const p = pending.get(key) || 0;
    if (p < 2 || !ui.cv || w * kx * h * ky > 6e6) {
      pending.set(key, p + 1); if (pending.size > 2000) pending.clear();
      g.save(); g.translate(x, y); paint(g, w, h); g.restore(); ui._fs = null;
      return;
    }
    pending.delete(key);
    const pw = Math.ceil((w + pad * 2) * kx), ph = Math.ceil((h + pad * 2) * ky), cv = makeCanvas(pw, ph);
    if (!cv) { g.save(); g.translate(x, y); paint(g, w, h); g.restore(); return; }
    const c2 = cv.getContext('2d'); c2.setTransform(kx, 0, 0, ky, pad * kx, pad * ky); paint(c2, w, h);
    S = { cv, pad, kx, ky, px: pw * ph, w: pw / kx, h: ph / ky };
    sprites.set(key, S); pixBudget += S.px;
    while (pixBudget > MAX_PIX && sprites.size > 1) { const k0 = sprites.keys().next().value, o = sprites.get(k0); sprites.delete(k0); pixBudget -= o.px; }
  } else { sprites.delete(key); sprites.set(key, S); }        // LRU touch
  g.drawImage(S.cv, Math.round((x - S.pad) * kx) / kx, Math.round((y - S.pad) * ky) / ky, S.w, S.h);
}
export function clearSprites() { sprites.clear(); pending.clear(); pixBudget = 0; }

// ------------------------------------------------------------------ pixel sprites (icons, emblems)
// rows of packed colours → a canvas at 1 px per pixel (drawn scaled with smoothing off)
export function pixelCanvas(w, h, put) {
  const cv = makeCanvas(w, h); if (!cv) return null;
  const c2 = cv.getContext('2d'), img = c2.createImageData(w, h), d32 = new Uint32Array(img.data.buffer);
  put(d32, w, h);
  c2.putImageData(img, 0, 0);
  return cv;
}

// ------------------------------------------------------------------ the Surf-compatible shim
const surfCanvas = new WeakMap();
export class CanvasSurf {
  constructor(ui) { this.ui = ui; }
  get w() { return this.ui.w; }
  get h() { return this.ui.h; }
  get g() { return this.ui.g; }
  fill(c) { const u = this.ui; if (u._fs !== c) { u.g.fillStyle = css(c); u._fs = c; } return u.g; }
  clear() { const g = this.g; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, g.canvas.width, g.canvas.height); g.restore(); return this; }
  touch() { return this; }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  px(x, y, c) { this.fill(c).fillRect(Math.floor(x), Math.floor(y), 1.04, 1.04); }
  blend(x, y, c, a) { const g = this.g; g.globalAlpha = Math.max(0, Math.min(1, a)); this.fill(c).fillRect(Math.floor(x), Math.floor(y), 1, 1); g.globalAlpha = 1; }
  rect(x, y, w, h, c) { if (w > 0 && h > 0) this.fill(c).fillRect(x, y, w, h); }
  hline(x0, x1, y, c) { if (x1 < x0) [x0, x1] = [x1, x0]; this.rect(x0, y, x1 - x0 + 1, 1, c); }
  vline(x, y0, y1, c) { if (y1 < y0) [y0, y1] = [y1, y0]; this.rect(x, y0, 1, y1 - y0 + 1, c); }
  line(x0, y0, x1, y1, c) { const g = this.g; g.strokeStyle = css(c); g.lineWidth = 1; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0 + 0.5, y0 + 0.5); g.lineTo(x1 + 0.5, y1 + 0.5); g.stroke(); }
  ellipse(cx, cy, rx, ry, c) { const g = this.fill(c); g.beginPath(); g.ellipse(cx + 0.5, cy + 0.5, Math.max(0.5, rx + 0.5), Math.max(0.5, ry + 0.5), 0, 0, Math.PI * 2); g.fill(); }
  circle(cx, cy, r, c) { return this.ellipse(cx, cy, r, r, c); }
  ring(cx, cy, rx, ry, c) { const g = this.g; g.strokeStyle = css(c); g.lineWidth = 1; g.beginPath(); g.ellipse(cx + 0.5, cy + 0.5, Math.max(0.5, rx), Math.max(0.5, ry ?? rx), 0, 0, Math.PI * 2); g.stroke(); }
  poly(pts, c) { if (!pts || pts.length < 3) return; const g = this.fill(c); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fill(); }
  dither(x, y, w, h, c, density = 0.5) { const g = this.g; g.globalAlpha = density; this.rect(x, y, w, h, c); g.globalAlpha = 1; }
  vgrad(x, y, w, h, cols) { const g = this.g; g.fillStyle = vgrad(g, y, y + h, cols); this.ui._fs = null; g.fillRect(x, y, w, h); }
  // an old software Surf (or anything with { w, h, data: Uint32Array }) blitted as a crisp sprite
  blit(src, x, y) {
    if (!src || !src.data) return;
    let C = surfCanvas.get(src);
    if (!C || C.v !== src.version) { C = { cv: pixelCanvas(src.w, src.h, (d) => d.set(src.data)), v: src.version }; surfCanvas.set(src, C); }
    if (!C.cv) return;
    const g = this.g, sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(C.cv, x, y, src.w, src.h); g.imageSmoothingEnabled = sm;
  }
  outline() { return this; }
}
