// Pixel painter: the hand-pixel-art vocabulary used to build scenes in the
// Eastward / HD-2D street style. Everything paints into a Surf at 1 px = 1 px,
// with light from the upper left: lit top/left edges, dark bottom/right edges,
// a darker local tone as outline (never pure black), clusters instead of noise,
// grime streaks under things that drip, contact shadows where things meet.
import { Surf, P } from './surface.js';
import { mix, shift, rgb, hexOf } from './color.js';
import { text, textWidth } from './font.js';

// muted, warm "afternoon in an old street" master palette
export const C = {
  ink: '#2b1e2e', ink2: '#3d2c3e', shade: '#4a3550',
  sand: '#d8b48e', sand2: '#c7a07f', sand3: '#b08a70', sandL: '#e6c7a2', dust: '#a8806c',
  plaster: '#e2c3a0', plaster2: '#cfa98a', plaster3: '#b48e78', cream: '#f0dfc0', paper: '#f4e8cc',
  brick: '#b0604e', brick2: '#8e4a44', brickL: '#c87a60',
  roof: '#5c4a7c', roof2: '#46385f', roofL: '#7a68a0',
  blue: '#4c6ea0', blue2: '#3a5482', blueL: '#7094c4', navy: '#2e3658',
  teal: '#3f8a86', teal2: '#2e6a6c', tealL: '#62b0a4',
  red: '#c8484a', red2: '#963440', redL: '#e06a5a',
  orange: '#e0843e', mustard: '#d8a83e', mustard2: '#b0842e', yellowL: '#f0d070',
  green: '#6c8c4a', green2: '#4e6a3c', greenL: '#92b05c', moss: '#5a7040',
  grass: '#c8a456', grass2: '#a8843e', grassL: '#e0c070',
  wood: '#8e5c3e', wood2: '#6c4230', woodL: '#b07a50',
  metal: '#8a8a9a', metal2: '#64647a', metalL: '#b4b4c0', steel: '#6c7a8a',
  glass: '#3a4a6a', glass2: '#2a3450', glassL: '#8aa8c8',
  neonP: '#ff5aa0', neonC: '#5af0e0', neonY: '#ffe060',
  white: '#fbf3e0', black: '#20161e',
};

export function rng(seed = 1) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export class Pen {
  constructor(surf, seed = 7) { this.s = surf; this.r = rng(seed); }
  get w() { return this.s.w; } get h() { return this.s.h; }
  rand(a = 0, b = 1) { return a + (b - a) * this.r(); }
  ri(a, b) { return Math.floor(this.rand(a, b + 1)); }
  pick(arr) { return arr[Math.floor(this.r() * arr.length)]; }
  chance(p) { return this.r() < p; }
  px(x, y, c) { this.s.px(x, y, c); return this; }
  rect(x, y, w, h, c) { if (w > 0 && h > 0) this.s.rect(x, y, w, h, c); return this; }
  hl(x0, x1, y, c) { this.s.hline(x0, x1, y, c); return this; }
  vl(x, y0, y1, c) { this.s.vline(x, y0, y1, c); return this; }
  line(x0, y0, x1, y1, c) { this.s.line(x0, y0, x1, y1, c); return this; }
  ell(cx, cy, rx, ry, c) { this.s.ellipse(cx, cy, rx, ry, c); return this; }
  poly(pts, c) { this.s.poly(pts, c); return this; }
  blend(x, y, c, a) { this.s.blend(x, y, c, a); return this; }
  // translucent fill (shadows, glows, haze)
  wash(x, y, w, h, c, a) { for (let j = Math.max(0, y | 0); j < Math.min(this.h, (y + h) | 0); j++) for (let i = Math.max(0, x | 0); i < Math.min(this.w, (x + w) | 0); i++) if (this.s.data[j * this.w + i] >>> 24) this.s.blend(i, j, c, a); return this; }
  washPoly(pts, c, a) {
    let y0 = Infinity, y1 = -Infinity; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(this.h - 1, Math.ceil(y1)); y++) {
      const xs = []; const Y = y + 0.5;
      for (let i = 0; i < pts.length; i++) { const [xa, ya] = pts[i], [xb, yb] = pts[(i + 1) % pts.length]; if ((ya > Y) !== (yb > Y)) xs.push(xa + ((Y - ya) / (yb - ya)) * (xb - xa)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.round(xs[k])); x < Math.min(this.w, Math.round(xs[k + 1])); x++) if (this.s.data[y * this.w + x] >>> 24) this.s.blend(x, y, c, a);
    }
    return this;
  }
  // bevelled block: base fill, lit top + left edge, dark bottom + right edge, local-dark outline
  block(x, y, w, h, base, o = {}) {
    const L = o.light || shift(base, 1), D = o.dark || shift(base, -1), O = o.line === false ? null : o.line || shift(base, -2.6);
    this.rect(x, y, w, h, base);
    if (o.bevel !== false) { this.hl(x, x + w - 1, y, L); this.vl(x, y, y + h - 1, L); this.hl(x, x + w - 1, y + h - 1, D); this.vl(x + w - 1, y, y + h - 1, D); }
    if (O) this.frame(x - 1, y - 1, w + 2, h + 2, O);
    return this;
  }
  frame(x, y, w, h, c) { this.hl(x, x + w - 1, y, c); this.hl(x, x + w - 1, y + h - 1, c); this.vl(x, y, y + h - 1, c); this.vl(x + w - 1, y, y + h - 1, c); return this; }
  // sparse texture pixels (never a carpet of noise)
  speckle(x, y, w, h, c, density = 0.03) { const n = Math.round(w * h * density); for (let i = 0; i < n; i++) this.px(x + this.ri(0, w - 1), y + this.ri(0, h - 1), c); return this; }
  // small clusters (2-4 px blobs) for stains, moss, wear
  blots(x, y, w, h, c, n = 6, size = 2) {
    for (let i = 0; i < n; i++) { const bx = x + this.ri(0, w - 1), by = y + this.ri(0, h - 1); for (let k = 0; k < size + 1; k++) this.px(bx + this.ri(-1, 1), by + this.ri(-1, 1), c); }
    return this;
  }
  // grime streaks running down from a ledge
  drips(x, y, w, len, c, n = 3) { for (let i = 0; i < n; i++) { const dx = x + this.ri(0, w - 1), l = this.ri(Math.max(1, len >> 1), len); for (let k = 0; k < l; k++) if (this.r() < 0.85 - k / (l * 1.6)) this.px(dx, y + k, c); } return this; }
  // horizontal dither band between two colours (only at band edges)
  ditherRow(x0, x1, y, a, b, phase = 0) { for (let x = x0; x <= x1; x++) this.px(x, y, (x + phase) % 2 ? a : b); return this; }
  // vertical gradient with ordered-dither seams (pixel-art sky, glass, shadows)
  vgrad(x, y, w, h, cols) {
    const n = cols.length;
    for (let j = 0; j < h; j++) {
      const t = (j / Math.max(1, h - 1)) * (n - 1), k = Math.min(n - 2, Math.floor(t)), f = t - k;
      for (let i = 0; i < w; i++) this.px(x + i, y + j, f > [0.75, 0.25, 0.5, 1][(i % 2) + (j % 2) * 2] * 0.999 ? cols[k + 1] : cols[k]);
    }
    return this;
  }
  text(str, x, y, c, o = {}) { return text(this.s, str, x, y, c, o); }
  textW(str, o = {}) { return textWidth(str, o); }
  // blit another surf (transparent pixels skipped)
  put(src, x, y, flip = false) {
    x |= 0; y |= 0;
    for (let j = 0; j < src.h; j++) { const Y = y + j; if (Y < 0 || Y >= this.h) continue; for (let i = 0; i < src.w; i++) { const v = src.data[j * src.w + (flip ? src.w - 1 - i : i)]; if (!(v >>> 24)) continue; const X = x + i; if (X >= 0 && X < this.w) this.s.data[Y * this.w + X] = v; } }
    this.s.touch(); return this;
  }
  // outline every opaque pixel's empty neighbours (sprite silhouette), darker on the shadow side
  outline(c = C.ink, cLit = null) {
    const s = this.s, src = new Uint32Array(s.data), W = s.w, H = s.h, v = P(c), vl = P(cLit || c);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (src[i] >>> 24) continue;
      const a = (X, Y) => X >= 0 && Y >= 0 && X < W && Y < H && src[Y * W + X] >>> 24;
      if (a(x + 1, y) || a(x, y + 1)) s.data[i] = vl; else if (a(x - 1, y) || a(x, y - 1)) s.data[i] = v;
    }
    s.touch(); return this;
  }
}
export const newSurf = (w, h) => new Surf(w, h);
export { mix, shift, rgb, hexOf };
