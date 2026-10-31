// Pixel-art textures for the walkable city: low-poly geometry wearing crisp, hand-pixelled
// surfaces (nearest-filtered, a steady texel density, ordered dithering instead of smooth
// gradients). Every texture knows its size in metres (tex.userData.size) so the builder can
// lay out UVs in metres and keep the pixel grid square everywhere.
// Surfaces tile seamlessly (periodic noise, wrap-around strokes) and carry believable wear:
// per-brick tone, mortar shadow, soot and efflorescence; asphalt aggregate, cracks and tar snakes;
// paver bevels, gum spots and moss in the joints; rain streaks on stucco; lapped siding with nails.
// Two densities: painters lay their pixel art out in DESIGN pixels (PXM = 32 per metre: an 8-pixel brick is
// 25 cm), and the canvas holds HD × that (64 texels per metre). Shapes keep their size; everything that is
// detail is painted at the full resolution: 1-texel mortar, joints, arrises and bevels (P.fh / P.fv / P.fpx,
// block()), grain and per-pixel noise (pixels() samples every texel), ordered dithering, specks, cracks and
// stains, and lettering (rasterised at the full size). The surfaces seen up close (walls, ground, roofs,
// windows, doors, shopfronts, signs) add their own extra detail on top: clay texture and struck mortar in
// the bricks, wood grain, glaze glints, fabric weave, finer muntins, grime.
import * as THREE from '../../../vendor/three.module.js';

export const PXM = 32;                         // design texels per metre (painters lay out their art in these)
export const HD = 2;                           // texels per design texel: 64 per metre on the canvas
const CACHE = new Map();
let PK = 1, PXX = -1, PXY = -1;                // the scale of the texture being painted; the texel pixels() is filling

// ---------------------------------------------------------------- colour + random
export const hx = (c) => { const n = parseInt(c.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const cl = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
export const css = (r, g, b) => `rgb(${cl(r) | 0},${cl(g) | 0},${cl(b) | 0})`;
export function tone(c, k) { const [r, g, b] = hx(c); return k >= 0 ? css(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k) : css(r * (1 + k), g * (1 + k), b * (1 + k)); }
/** painted shadow: darker and cooler; painted light: lighter and warmer */
const rgb = (c) => (c[0] === '#' ? hx(c) : c.match(/\d+/g).slice(0, 3).map(Number));
export const dark = (c, k = 0.25) => { const [r, g, b] = rgb(c); return css(r * (1 - k) - 6 * k, g * (1 - k) - 4 * k, b * (1 - k) + 14 * k); };
export const light = (c, k = 0.2) => { const [r, g, b] = rgb(c); return css(r + (255 - r) * k + 8 * k, g + (255 - g) * k + 4 * k, b + (255 - b) * k - 6 * k); };
export const hex = (s) => { const m = s.match(/\d+/g); return '#' + m.slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join(''); };
export const rnd = (seed) => { let x = (seed >>> 0) || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };
export const hashStr = (s) => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** ordered-dither test: true where a pixel at (x, y) should take the second colour for coverage t
 *  (inside pixels() the threshold comes from the texel being filled, so HD canvases dither at full resolution) */
export const dith = (x, y, t) => { if (PXX >= 0) { x = PXX; y = PXY; } return t > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16; };
/** a ramp of shades of base (k < 0 darker/cooler, k > 0 lighter/warmer) as [r, g, b] arrays */
export const ramp = (base, ks) => ks.map((k) => rgb(k >= 0 ? light(base, k) : dark(base, -k)));
/** pick a ramp colour for value v (0..1), dithering between neighbouring steps */
export const pick = (R, v, x, y) => { const q = Math.max(0, Math.min(R.length - 1, v * (R.length - 1))); let i = Math.floor(q); if (i < R.length - 1 && dith(x, y, q - i)) i++; return R[i]; };
/** periodic value noise on a gw × gh lattice: n(u, v) in 0..1 for u, v in texture space (wraps at 1) */
export function pnoise(r, gw, gh = gw) {
  const L = new Float32Array(gw * gh); for (let i = 0; i < L.length; i++) L[i] = r();
  const s = (t) => t * t * (3 - 2 * t);
  return (u, v) => {
    const x = (((u % 1) + 1) % 1) * gw, y = (((v % 1) + 1) % 1) * gh, x0 = Math.floor(x), y0 = Math.floor(y), fx = s(x - x0), fy = s(y - y0);
    const xa = x0 % gw, xb = (x0 + 1) % gw, ya = (y0 % gh) * gw, yb = ((y0 + 1) % gh) * gw;
    const a = L[ya + xa], b = L[ya + xb], c = L[yb + xa], d = L[yb + xb];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}
/** fractal periodic noise: oct octaves starting at a g × gh lattice */
export function fnoise(r, g, oct = 3, gh = g) { const N = []; for (let i = 0; i < oct; i++) N.push(pnoise(r, g << i, gh << i)); return (u, v) => { let s = 0, a = 1, t = 0; for (const n of N) { s += n(u, v) * a; t += a; a *= 0.5; } return s / t; }; }
/** fast path for noisy surfaces: every pixel from fn(x, y) → [r, g, b]. W, H, x, y are design pixels; on an HD
 *  canvas fn is sampled at every texel (x, y step by 1 / HD), so grain, noise and dithering come out finer */
export function pixels(g, W, H, fn) {
  const k = PK, RW = Math.round(W * k), RH = Math.round(H * k), im = g.createImageData(RW, RH), d = im.data;
  try {
    for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) { PXX = x; PXY = y; const c = fn(x / k, y / k), i = (y * RW + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; }
  } finally { PXX = PXY = -1; }
  g.putImageData(im, 0, 0);
}

// ---------------------------------------------------------------- texture factory
/**
 * A cached pixel texture wM × hM metres; paint(g, W, H, r, P) draws it in design pixels (o.ppm per metre, default
 * PXM) onto a canvas o.hd × finer (default HD; 1 keeps it at the design density). W, H and every Painter / canvas
 * call take design pixels (the context is scaled); P.k is the scale, P.fh / fv / fpx paint single texels.
 */
export function ptex(key, wM, hM, paint, o = {}) {
  const ppm = o.ppm || PXM, hd = Math.max(1, Math.round(o.hd ?? (ppm >= 96 ? 1 : HD))), k = key + '|' + wM + '|' + hM + '|' + ppm + (hd > 1 ? '|hd' + hd : '');
  if (CACHE.has(k)) return CACHE.get(k);
  const W = Math.max(1, Math.round(wM * ppm)), H = Math.max(1, Math.round(hM * ppm)), RW = W * hd, RH = H * hd;
  const cv = document.createElement('canvas'); cv.width = RW; cv.height = RH;
  const g = cv.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false;
  g.setTransform(hd, 0, 0, hd, 0, 0);
  const P = new Painter(g, W, H, hd), pk = PK;
  PK = hd;
  try { paint(g, W, H, rnd(hashStr(key)), P); } finally { PK = pk; g.setTransform(1, 0, 0, 1, 0, 0); }
  if (o.paint ?? PAINTED.test(key)) despeckle(g, RW, RH);
  const t = new THREE.CanvasTexture(cv);
  if (P.glass) t.userData.glass = P.glass.map((q) => q.map((v) => v * hd));   // glazed panes (texel rects): mirror-smooth in the material (render/surface.js)
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  t.userData.size = [wM, hM]; t.userData.key = k;
  CACHE.set(k, t);
  return t;
}

// Hand-painted, not gritty: the big tiling surfaces (walls, roofs, ground) get one pass of a majority filter
// after painting. A pixel that disagrees with most of its eight neighbours (a lone speck, a dither checker)
// takes their colour, so the surface reads as clear colour blocks with painted shading steps, the way the
// Tokonmon's box models are painted. Lines one pixel wide (mortar, grout, laps, cracks) survive: along a line
// a pixel always has two neighbours that agree with it. Wraps at the edges (the tiles stay seamless).
const PAINTED = /^(plaster|asphalt|concrete|roofmem|pavers|slabs|cobble|grass|dirt|brick|siding|shingle|rooftile|metalroof|planks)/;
function despeckle(g, W, H) {
  const im = g.getImageData(0, 0, W, H), d = im.data, src = new Uint32Array(d.buffer.slice(0)), out = new Uint32Array(d.buffer);
  const cnt = new Map();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = src[y * W + x]; let same = 0; cnt.clear();
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      if (!i && !j) continue;
      const n = src[((y + j + H) % H) * W + ((x + i + W) % W)];
      if (n === c) same++; else cnt.set(n, (cnt.get(n) || 0) + 1);
    }
    if (same >= 2) continue;
    let best = c, bn = 0; for (const [k, v] of cnt) if (v > bn) { bn = v; best = k; }
    if (bn >= 5) out[y * W + x] = best;
  }
  g.putImageData(im, 0, 0);
}

// a tiny 3 × 5 pixel font for small crisp lettering (price tags, plates, stickers)
const F35 = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111',
  J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
  '-': '000000111000000', '.': '000000000000010', ':': '000010000010000', '!': '010010010000010', $: '011110010011110', '%': '101001010100101', '&': '010101010101011', "'": '010010000000000', '/': '001001010100100', '+': '000010111010000', ' ': '000000000000000',
};
/** width in pixels of str in the 3 × 5 font */
export const tinyW = (str) => String(str).length * 4 - 1;

/** Pixel painting helpers on a canvas (integer rects, wrap-around, dithering). Coordinates are design pixels; the
 *  canvas may hold k texels per design pixel (ptex: HD), and the detail helpers draw single texels. */
export class Painter {
  constructor(g, W, H, k = 1) { this.g = g; this.W = W; this.H = H; this.k = k; this.t = 1 / k; }
  fill(c) { this.g.fillStyle = c; this.g.fillRect(0, 0, this.W, this.H); return this; }
  rect(x, y, w, h, c) { if (w <= 0 || h <= 0) return this; this.g.fillStyle = c; this.g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); return this; }
  /** a rect that wraps around the texture edges (for seamless tiles) */
  wrect(x, y, w, h, c) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h); if (w <= 0 || h <= 0) return this;
    const { W, H } = this; x = ((x % W) + W) % W; y = ((y % H) + H) % H; this.g.fillStyle = c;
    for (const ox of x + w > W ? [0, -W] : [0]) for (const oy of y + h > H ? [0, -H] : [0]) this.g.fillRect(x + ox, y + oy, w, h);
    return this;
  }
  px(x, y, c) { this.g.fillStyle = c; this.g.fillRect(((Math.round(x) % this.W) + this.W) % this.W, ((Math.round(y) % this.H) + this.H) % this.H, 1, 1); return this; }
  hline(x, y, w, c) { return this.rect(x, y, w, 1, c); }
  vline(x, y, h, c) { return this.rect(x, y, 1, h, c); }
  // ---- single texels (on an HD canvas: 1 / k of a design pixel; x, y, w, h in design pixels, may be fractional)
  /** one texel at (x, y), wrapping round the edges */
  fpx(x, y, c) {
    const k = this.k, RW = this.W * k, RH = this.H * k, X = ((Math.floor(x * k + 1e-6) % RW) + RW) % RW, Y = ((Math.floor(y * k + 1e-6) % RH) + RH) % RH;
    this.g.fillStyle = c; this.g.fillRect(X / k, Y / k, 1 / k, 1 / k); return this;
  }
  /** a line one texel tall (fh) or wide (fv) */
  fh(x, y, w, c) { const k = this.k; if (w <= 0) return this; this.g.fillStyle = c; this.g.fillRect(Math.round(x * k) / k, Math.floor(y * k + 1e-6) / k, Math.round(w * k) / k, 1 / k); return this; }
  fv(x, y, h, c) { const k = this.k; if (h <= 0) return this; this.g.fillStyle = c; this.g.fillRect(Math.floor(x * k + 1e-6) / k, Math.round(y * k) / k, 1 / k, Math.round(h * k) / k); return this; }
  /** a wrapping line one texel tall / wide */
  fwh(x, y, w, c) { const k = this.k; for (let i = 0, n = Math.round(w * k); i < n; i++) this.fpx(x + i / k, y, c); return this; }
  fwv(x, y, h, c) { const k = this.k; for (let i = 0, n = Math.round(h * k); i < n; i++) this.fpx(x, y + i / k, c); return this; }
  /** dither c over a rect with coverage t (0..1), or t(x, y); at every texel (t gets design coordinates) */
  dither(x0, y0, w, h, c, t) {
    const k = this.k, T = 1 / k, f = typeof t === 'function', X0 = Math.round(x0 * k), Y0 = Math.round(y0 * k), X1 = Math.round((x0 + w) * k), Y1 = Math.round((y0 + h) * k);
    this.g.fillStyle = c;
    for (let Y = Y0; Y < Y1; Y++) for (let X = X0; X < X1; X++) if (dith(X, Y, f ? t(X * T, Y * T) : t)) this.g.fillRect(X * T, Y * T, T, T);
    return this;
  }
  /** sprinkle single texels in colour c (n per design-pixel-sized speck: the same coverage, finer grain) */
  speck(n, c, r, x0 = 0, y0 = 0, w = this.W, h = this.H) {
    const k = this.k, T = 1 / k; this.g.fillStyle = c;
    for (let i = 0, m = Math.round(n * k * k); i < m; i++) this.g.fillRect(Math.floor((x0 + r() * w) * k) * T, Math.floor((y0 + r() * h) * k) * T, T, T);
    return this;
  }
  /** a dithered elliptic blob (stain, moss, puddle edge) wrapping round the edges; t = peak coverage */
  blob(cx, cy, rx, ry, c, t = 1) {
    const k = this.k; cx = Math.round(cx); cy = Math.round(cy);
    const RX = Math.round((rx + 0.5) * k), RY = Math.round((ry + 0.5) * k);
    for (let Y = -RY; Y < RY; Y++) for (let X = -RX; X < RX; X++) {
      const x = (X + 0.5) / k, y = (Y + 0.5) / k, d = (x / (rx + 0.5)) ** 2 + (y / (ry + 0.5)) ** 2;
      if (d <= 1 && dith(cx * k + X + 64, cy * k + Y + 64, t * (1.25 - d))) this.fpx(cx + X / k, cy + Y / k, c);
    }
    return this;
  }
  /** a hairline crack: a wandering 1-texel walk (o.edge: lighter chipped rim, o.branch: chance to fork) */
  crack(x, y, n, c, r, o = {}) {
    const k = this.k, T = 1 / k, wob = (o.wob ?? 0.9) / Math.sqrt(k);
    let a = o.a ?? r() * 6.283;
    for (let i = 0; i < n * k; i++) {
      a += (r() - 0.5) * wob; x += Math.cos(a) * T; y += Math.sin(a) * T; this.fpx(x, y, c);
      if (o.edge && r() < 0.45) this.fpx(x + T, y + T, o.edge);
      if (o.branch && r() < o.branch / k) this.crack(x, y, Math.floor(n * 0.35), c, r, { a: a + (r() < 0.5 ? 1.1 : -1.1), wob: o.wob, edge: o.edge });
    }
    return this;
  }
  /** a top-lit / bottom-shaded block: lit arris and shadowed edge one texel wide, a softer second step inside
   *  (o.ink: a dark outline) */
  block(x, y, w, h, c, o = {}) {
    const k = this.k, T = 1 / k, hk = o.hk || 0.18, lk = o.lk || 0.22;
    this.rect(x, y, w, h, c);
    if (o.hi !== false) { this.fh(x, y, w, light(c, hk)); this.fv(x, y, h, light(c, hk * 0.6)); if (k > 1) { this.fh(x + T, y + T, w - 2 * T, light(c, hk * 0.4)); this.fv(x + T, y + T, h - 2 * T, light(c, hk * 0.25)); } }
    if (o.lo !== false) { this.fh(x, y + h - T, w, dark(c, lk)); this.fv(x + w - T, y, h, dark(c, lk * 0.7)); if (k > 1) { this.fh(x + T, y + h - 2 * T, w - 2 * T, dark(c, lk * 0.4)); this.fv(x + w - 2 * T, y + T, h - 3 * T, dark(c, lk * 0.25)); } }
    if (o.ink) { this.g.strokeStyle = o.ink; this.g.lineWidth = T; this.g.strokeRect(x + T / 2, y + T / 2, w - T, h - T); }
    return this;
  }
  /** crisp lettering: the font is rasterised off-screen at the canvas's full resolution and thresholded, so every
   *  glyph edge is a hard texel (o: align, shadow (one design pixel down-right), outline (one texel), hi, weight, font) */
  text(str, x, y, size, c, o = {}) {
    const k = this.k, T = 1 / k, S = Math.max(1, Math.round(size * k));
    const font = `${o.weight || 700} ${S}px ${o.font || '"DotGothic16", "Courier New", monospace'}`;
    const cv = document.createElement('canvas'), g = cv.getContext('2d', { willReadFrequently: true }); g.font = font;
    const w = Math.ceil(g.measureText(str).width) + 4, h = Math.ceil(S * 1.5) + 4; cv.width = w; cv.height = h;
    g.font = font; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#ffffff'; g.fillText(str, 2, Math.round(h / 2));
    const d = g.getImageData(0, 0, w, h).data, al = o.align || 'center';
    const X = Math.round(x * k), Y = Math.round(y * k), x0 = Math.round(al === 'left' ? X : al === 'right' ? X - (w - 4) : X - (w - 4) / 2) - 2, y0 = Math.round(Y - h / 2);
    const on = (i, j) => i >= 0 && j >= 0 && i < w && j < h && d[(j * w + i) * 4 + 3] > 118;
    const draw = (col, ox, oy) => { this.g.fillStyle = col; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (on(i, j)) this.g.fillRect((x0 + i + ox) * T, (y0 + j + oy) * T, T, T); };
    if (o.shadow) draw(o.shadow, k, k);
    if (o.outline) for (const [ox, oy] of k > 1 ? [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]] : [[-1, 0], [1, 0], [0, -1], [0, 1]]) draw(o.outline, ox, oy);
    draw(c, 0, 0);
    if (o.hi) { this.g.fillStyle = o.hi; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (on(i, j) && !on(i, j - 1)) this.g.fillRect((x0 + i) * T, (y0 + j) * T, T, T); }
    return this;
  }
  /** small crisp 3 × 5 lettering (left aligned at x, top at y) */
  tiny(str, x, y, c, shadow) {
    let cx = Math.round(x); y = Math.round(y);
    for (const ch of String(str).toUpperCase()) {
      const gl = F35[ch] || F35[' '];
      for (let i = 0; i < 15; i++) if (gl[i] === '1') { if (shadow) this.rect(cx + (i % 3) + 1, y + Math.floor(i / 3) + 1, 1, 1, shadow); }
      for (let i = 0; i < 15; i++) if (gl[i] === '1') this.rect(cx + (i % 3), y + Math.floor(i / 3), 1, 1, c);
      cx += 4;
    }
    return this;
  }
}

// ---------------------------------------------------------------- surfaces
// wall bricks (0.25 × 0.094 m courses), running bond: clustered per-brick tone, clinkers and pale bricks,
// a lit top arris, a shadowed bed joint under every course, soot and efflorescence patches
export const brick = (base = '#a8523a', mortar = '#d8c8b0') => ptex('brick' + base + mortar, 4, 3, (g, W, H, r, P) => {
  const bw = 8, bh = 3, R = ramp(base, [-0.3, -0.19, -0.1, -0.03, 0.04, 0.11, 0.19]).map((c) => css(...c)), n = fnoise(r, 4, 3, 3), soot = fnoise(r, 2, 2, 2), eff = pnoise(r, 6, 5);
  P.fill(mortar);
  for (let row = 0; row * bh < H; row++) {
    const y = row * bh, off = row & 1 ? bw / 2 : 0;
    P.hline(0, y + bh - 1, W, dark(mortar, 0.16));                               // bed joint in the brick's shadow
    for (let col = 0; col * bw < W; col++) {
      const x = col * bw + off, u = (x + 4) / W, v = (y + 1) / H;
      let t = 0.5 + (n(u, v) - 0.5) * 1.1 + (r() - 0.5) * 0.5; const q = r();
      let c = R[Math.max(0, Math.min(R.length - 1, Math.round(t * (R.length - 1))))];
      if (q < 0.045) c = dark(base, 0.38 + r() * 0.1); else if (q < 0.08) c = light(base, 0.16 + r() * 0.08); else if (q < 0.1) c = tone(base, -0.12);
      P.wrect(x, y, bw - 1, bh - 1, c);
      P.wrect(x, y, bw - 2, 1, light(c, 0.12));                                 // lit top arris
      P.wrect(x + bw - 2, y + 1, 1, 1, dark(c, 0.18));
      if (r() < 0.3) P.px(x + 1 + Math.floor(r() * 5), y + 1, r() < 0.5 ? dark(c, 0.12) : light(c, 0.08));
      if (r() < 0.05) P.px(x + (r() < 0.5 ? 0 : bw - 2), y + (r() < 0.5 ? 0 : 1), mortar);   // a chipped corner
    }
  }
  // efflorescence blooms (pale salts) and a little soot
  P.dither(0, 0, W, H, light(mortar, 0.05), (x, y) => Math.max(0, eff(x / W, y / H) - 0.8) * 0.9);
  P.dither(0, 0, W, H, dark(base, 0.4), (x, y) => Math.max(0, soot(x / W, y / H) - 0.62) * 0.9);
});
// stucco / plaster: clustered tonal noise, vertical rain streaks (seamless), hairline cracks, a patched repair
export const plaster = (base = '#e8d8c0') => ptex('plaster' + base, 4, 4, (g, W, H, r, P) => {
  const R = ramp(base, [-0.13, -0.075, -0.035, 0, 0.03, 0.065]), n = fnoise(r, 4, 3), f = pnoise(r, 32);
  pixels(g, W, H, (x, y) => pick(R, 0.6 + (n(x / W, y / H) - 0.5) * 0.9 + (f(x / W, y / H) - 0.5) * 0.35 + (r() - 0.5) * 0.22, x, y));
  for (let i = 0; i < 7; i++) {
    const x0 = Math.floor(r() * W), w = 2 + Math.floor(r() * 3), t = 0.1 + r() * 0.2, c = dark(base, 0.05 + r() * 0.05), ph = r() * 6.283;
    for (let y = 0; y < H; y++) { const cov = t * (0.55 + 0.45 * Math.sin((y / H) * 6.283 + ph)); for (let k = 0; k < w; k++) if (dith(x0 + k, y, cov * (k === 0 || k === w - 1 ? 0.6 : 1))) P.px(x0 + k, y, c); }
  }
  for (let i = 0; i < 2; i++) P.crack(r() * W, r() * H, 12 + r() * 18, dark(base, 0.2), r, { wob: 1.2, branch: 0.06 });
  const px0 = Math.floor(r() * (W - 24)), py0 = Math.floor(r() * (H - 18)); P.rect(px0, py0, 18 + Math.floor(r() * 8), 10 + Math.floor(r() * 8), light(base, 0.035)); P.speck(14, dark(base, 0.06), r, px0, py0, 20, 12);
  P.speck(40, dark(base, 0.16), r);
});
// clapboard siding (San Francisco row houses): lapped boards with a shadow under each lap, a lit lip,
// butt joints, nail heads, chalky weathering
export const siding = (base = '#7aa8c8') => ptex('siding' + base, 4, 1.5, (g, W, H, r, P) => {
  const n = fnoise(r, 4, 2, 2), m = pnoise(r, 16, 6);
  for (let y = 0; y < H; y += 6) {
    P.rect(0, y, W, 6, base);
    P.dither(0, y + 2, W, 3, light(base, 0.05), (x) => m(x / W, y / H) * 0.7);
    P.hline(0, y, W, dark(base, 0.36)); P.hline(0, y + 1, W, dark(base, 0.17));
    P.dither(0, y + 2, W, 1, dark(base, 0.08), 0.5);
    P.hline(0, y + 5, W, light(base, 0.13));
    for (let x = Math.floor(r() * 40); x < W; x += 36 + Math.floor(r() * 56)) { P.vline(x, y + 1, 5, dark(base, 0.26)); P.vline(x + 1, y + 2, 3, light(base, 0.08)); }
    for (let x = 4 + Math.floor(r() * 10); x < W; x += 16) P.px(x, y + 4, dark(base, 0.22));
  }
  P.dither(0, 0, W, H, dark(base, 0.1), (x, y) => Math.max(0, n(x / W, y / H) - 0.56) * 1.4);
  P.speck(26, light(base, 0.32), r); P.speck(18, dark(base, 0.32), r);
});
// barrel / pantile courses: lit left flank, shaded right flank, a dark gap under the course above, moss
export const roofTiles = (base = '#3a7a5a') => ptex('rooftile' + base, 2, 2, (g, W, H, r, P) => {
  P.fill(dark(base, 0.45)); const n = fnoise(r, 2, 2);
  for (let y = 0; y < H; y += 8) for (let x = (y / 8) & 1 ? 4 : 0, i = 0; i < W / 8; x += 8, i++) {
    const k = (r() - 0.5) * 0.16 + (n(x / W, y / H) - 0.5) * 0.24, c = k > 0 ? light(base, k) : dark(base, -k);
    P.wrect(x + 1, y + 1, 6, 6, c); P.wrect(x + 1, y + 1, 1, 6, light(c, 0.22)); P.wrect(x + 2, y + 1, 1, 6, light(c, 0.1)); P.wrect(x + 5, y + 1, 1, 6, dark(c, 0.16)); P.wrect(x + 6, y + 1, 1, 6, dark(c, 0.3));
    P.wrect(x + 1, y + 7, 6, 1, light(c, 0.08)); P.wrect(x + 2, y + 1, 4, 1, dark(c, 0.3)); P.px(x + 3, y + 3, light(c, 0.32));
  }
  for (let i = 0; i < 6; i++) P.blob(r() * W, r() * H, 2 + Math.floor(r() * 2), 1, r() < 0.5 ? '#7a8a4a' : '#9aa25a', 0.65);
});
// asphalt / wood shingles: courses of shingles of varied width (seamless), algae streaks, lichen
export const shingles = (base = '#5a4a5a') => ptex('shingle' + base, 2, 2, (g, W, H, r, P) => {
  P.fill(dark(base, 0.42)); const n = fnoise(r, 3, 2), streak = pnoise(r, 10, 1);
  for (let y = 0; y < H; y += 4) {
    let x = Math.floor(r() * 6); const x0 = x;
    while (x < x0 + W) {
      const w = Math.min(3 + Math.floor(r() * 4), x0 + W - x), k = (r() - 0.5) * 0.2 + (n(x / W, y / H) - 0.5) * 0.3, c = k > 0 ? light(base, k) : dark(base, -k);
      if (w > 1) { P.wrect(x, y, w - 1, 3, c); P.wrect(x, y + 2, w - 1, 1, dark(c, 0.16)); P.wrect(x, y, 1, 1, light(c, 0.16)); }
      x += w;
    }
  }
  P.dither(0, 0, W, H, dark(base, 0.22), (x) => Math.max(0, streak(x / W, 0) - 0.58) * 1.1);
  for (let i = 0; i < 4; i++) P.blob(r() * W, r() * H, 2, 1, '#8a9a6a', 0.6);
  P.speck(24, light(base, 0.25), r);
});
// corrugated metal: ridges every 0.25 m, screw rows, rust bleeding down from the fixings
export const metalRoof = (base = '#8a9aa8') => ptex('metalroof' + base, 2, 2, (g, W, H, r, P) => {
  P.fill(base);
  for (let x = 0; x < W; x += 8) { P.vline(x, 0, H, light(base, 0.3)); P.vline(x + 1, 0, H, light(base, 0.14)); P.vline(x + 5, 0, H, dark(base, 0.1)); P.vline(x + 6, 0, H, dark(base, 0.2)); P.vline(x + 7, 0, H, dark(base, 0.12)); }
  P.dither(0, 0, W, H, dark(base, 0.08), (x, y) => (Math.sin(y / H * 6.283 * 2 + x * 0.05) + 1) * 0.12);
  for (const y of [6, 38]) for (let x = 2; x < W; x += 16) { P.px(x, y, dark(base, 0.45)); if (r() < 0.6) { const L = 3 + Math.floor(r() * 14); for (let k = 1; k < L; k++) if (dith(x, y + k, 0.8 - k / L)) P.px(x + (k > L / 2 && r() < 0.3 ? 1 : 0), y + k, r() < 0.5 ? '#9a5a32' : '#b8703a'); } }
  P.speck(30, dark(base, 0.3), r);
});
// asphalt: aggregate grain over worn / fresh patches, hairline cracks, tar snakes (8 m tile, little repetition)
export const asphalt = (base = '#4a4a54') => ptex('asphalt' + base, 8, 8, (g, W, H, r, P) => {
  const R = ramp(base, [-0.3, -0.17, -0.07, 0, 0.07, 0.15]), n = fnoise(r, 4, 3), m = pnoise(r, 40);
  pixels(g, W, H, (x, y) => pick(R, 0.5 + (n(x / W, y / H) - 0.5) * 0.85 + (m(x / W, y / H) - 0.5) * 0.3 + (r() - 0.5) * 0.4, x, y));
  for (let i = 0; i < W * H * 0.014; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * H); P.px(x, y, light(base, 0.2 + r() * 0.14)); if (r() < 0.35) P.px(x + 1, y, light(base, 0.1)); }
  P.speck(W * H * 0.008, dark(base, 0.4), r);
  for (let i = 0; i < 9; i++) P.crack(r() * W, r() * H, 10 + r() * 26, dark(base, 0.3), r, { edge: light(base, 0.05), branch: 0.015 });
  for (let i = 0; i < 2; i++) { let x = r() * W, y = r() * H, a = r() * 6.283; for (let k = 0; k < 150; k++) { a += (r() - 0.5) * 0.45; x += Math.cos(a); y += Math.sin(a); P.px(x, y, dark(base, 0.55)); P.px(x + 1, y, dark(base, 0.47)); if (k % 7 === 0) P.px(x, y - 1, light(base, 0.12)); } }
});
// block pavers (0.5 m): bevelled edges, per-paver tone, dirty joints with moss, gum spots, stains, a cracked unit
export const pavers = (base = '#c8c0b4') => ptex('pavers' + base, 4, 4, (g, W, H, r, P) => {
  const s = 16, nx = W / s, R = ramp(base, [-0.16, -0.09, -0.04, 0, 0.04, 0.09, 0.14]), J = rgb(dark(base, 0.36)), n = fnoise(r, 4, 2), tn = Array.from({ length: nx * (H / s) }, () => (r() - 0.5) * 0.45);
  pixels(g, W, H, (x, y) => {
    const xx = x % s, yy = y % s; if (xx === s - 1 || yy === s - 1) return J;
    let v = 0.5 + tn[Math.floor(y / s) * nx + Math.floor(x / s)] + (n(x / W, y / H) - 0.5) * 0.7 + (r() - 0.5) * 0.28;
    if (yy === 0) v += 0.34; else if (xx === 0) v += 0.2; else if (yy === s - 2) v -= 0.3; else if (xx === s - 2) v -= 0.18;
    return pick(R, v, x, y);
  });
  for (let i = 0; i < 26; i++) { const k = Math.floor(r() * nx * (H / s)), x = (k % nx) * s, y = Math.floor(k / nx) * s, c = r() < 0.6 ? '#5a7a3a' : '#6a8a42'; if (r() < 0.5) P.rect(x + Math.floor(r() * 14), y + s - 1, 2 + Math.floor(r() * 3), 1, c); else P.rect(x + s - 1, y + Math.floor(r() * 14), 1, 2 + Math.floor(r() * 3), c); }
  for (let i = 0; i < 3; i++) { const x = Math.floor(r() * nx) * s, y = Math.floor(r() * (H / s)) * s; P.crack(x + 2, y + 2 + r() * 10, 12, dark(base, 0.3), r, { a: 0.3 + r() * 0.6, wob: 0.6 }); }
  for (let i = 0; i < 9; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * H); P.rect(x, y, 2, 2, '#7a787c'); P.px(x, y, '#9a989c'); if (r() < 0.5) P.px(x + 2, y + 1, '#6a686c'); }
  for (let i = 0; i < 3; i++) P.blob(r() * W, r() * H, 4 + Math.floor(r() * 4), 3 + Math.floor(r() * 2), dark(base, 0.12), 0.45);
  for (let i = 0; i < 4; i++) { const x = Math.floor(r() * nx) * s, y = Math.floor(r() * (H / s)) * s; P.px(x, y, rgbCss(J)); P.px(x + 1, y, dark(base, 0.2)); }
});
const rgbCss = (c) => css(c[0], c[1], c[2]);
// poured concrete sidewalk slabs (1 m): scored joints, a smooth tooled border, broom finish,
// cracked and replaced slabs, gum, coffee stains
export const slabs = (base = '#c9c4ba') => ptex('slabs' + base, 4, 4, (g, W, H, r, P) => {
  const s = 32, nx = W / s, R = ramp(base, [-0.15, -0.08, -0.035, 0, 0.035, 0.075]), n = fnoise(r, 4, 3), tn = Array.from({ length: nx * (H / s) }, () => { const q = r(); return q < 0.08 ? 0.32 : q < 0.14 ? -0.25 : (r() - 0.5) * 0.3; });
  const J = rgb(dark(base, 0.34)), Jl = rgb(light(base, 0.1));
  pixels(g, W, H, (x, y) => {
    const xx = x % s, yy = y % s; if (xx === 0 || yy === 0) return J; if (xx === 1 || yy === 1) return Jl;
    let v = 0.55 + tn[Math.floor(y / s) * nx + Math.floor(x / s)] + (n(x / W, y / H) - 0.5) * 0.6 + (r() - 0.5) * 0.26;
    if (xx <= 3 || yy <= 3 || xx >= s - 2 || yy >= s - 2) v += 0.16; else if (y % 3 === 0) v -= 0.12;
    return pick(R, v, x, y);
  });
  for (let i = 0; i < 4; i++) { const x = Math.floor(r() * nx) * s, y = Math.floor(r() * (H / s)) * s; P.crack(x + 2 + r() * 6, y + 2 + r() * 28, 22 + r() * 12, dark(base, 0.32), r, { a: r() * 0.8 - 0.4, wob: 0.7, edge: light(base, 0.12), branch: 0.04 }); }
  for (let i = 0; i < 14; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * H), c = r() < 0.5 ? '#6e6c70' : '#86848a'; P.rect(x, y, 2, 2, c); P.px(x + 1, y + 1, dark(c, 0.2)); if (r() < 0.4) P.px(x - 1, y, light(c, 0.15)); }
  for (let i = 0; i < 3; i++) P.blob(r() * W, r() * H, 3 + Math.floor(r() * 4), 2 + Math.floor(r() * 3), i ? '#9a8a72' : dark(base, 0.2), 0.42);
  P.speck(30, dark(base, 0.28), r);
});
// granite setts / cobbles: courses of rounded stones of varied width, lit tops, dark joints
export const cobble = (base = '#9a8e84') => ptex('cobble' + base, 2, 2, (g, W, H, r, P) => {
  P.fill(dark(base, 0.45)); const n = fnoise(r, 2, 2);
  for (let y = 0; y < H; y += 8) {
    let x = Math.floor(r() * 8); const x0 = x;
    while (x < x0 + W) {
      const w = Math.min(6 + Math.floor(r() * 5), x0 + W - x), k = (r() - 0.5) * 0.3 + (n(x / W, y / H) - 0.5) * 0.25, c = k > 0 ? light(base, k) : dark(base, -k);
      if (w > 2) {
        P.wrect(x + 1, y, w - 2, 7, c); P.wrect(x, y + 1, w, 5, c);
        P.wrect(x + 1, y, w - 2, 1, light(c, 0.22)); P.wrect(x, y + 1, 1, 3, light(c, 0.1)); P.wrect(x + 1, y + 6, w - 2, 1, dark(c, 0.24)); P.wrect(x + w - 1, y + 2, 1, 4, dark(c, 0.16));
        if (r() < 0.5) P.px(x + 2 + Math.floor(r() * (w - 3)), y + 2 + Math.floor(r() * 3), r() < 0.5 ? light(c, 0.1) : dark(c, 0.1));
      }
      x += w;
    }
  }
  for (let i = 0; i < 6; i++) P.px(r() * W, Math.floor(r() * 8) * 8 + 7, '#5a7a3a');
});
// lawn: clustered tones, lit blade tufts, clover patches, a few daisies and dry blades
export const grass = (base = '#5a9a4a') => ptex('grass' + base, 4, 4, (g, W, H, r, P) => {
  const R = ramp(base, [-0.24, -0.14, -0.06, 0, 0.06, 0.13]), n = fnoise(r, 4, 3), f = pnoise(r, 20);
  pixels(g, W, H, (x, y) => pick(R, 0.52 + (n(x / W, y / H) - 0.5) * 1.0 + (f(x / W, y / H) - 0.5) * 0.45 + (r() - 0.5) * 0.4, x, y));
  for (let i = 0; i < 700; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * H), lit = n(x / W, y / H) > 0.5, c = lit ? light(base, 0.12) : dark(base, 0.1); P.px(x, y, light(c, 0.14)); P.px(x, y + 1, c); if (r() < 0.6) P.px(x + (r() < 0.5 ? 1 : -1), y + 1, dark(c, 0.08)); }
  for (let i = 0; i < 9; i++) P.blob(r() * W, r() * H, 3, 2, light(base, 0.1), 0.55);
  for (let i = 0; i < 12; i++) { const x = r() * W, y = r() * H, c = ['#f4e8a0', '#f8f4f0', '#f0b0c8', '#c8d8f8'][i & 3]; P.px(x, y, c); P.px(x + 1, y + 1, dark(base, 0.25)); }
  P.speck(40, '#b8a868', r);
});
export const dirt = (base = '#a8845a') => ptex('dirt' + base, 2, 2, (g, W, H, r, P) => {
  const R = ramp(base, [-0.2, -0.1, 0, 0.08, 0.15]), n = fnoise(r, 2, 3);
  pixels(g, W, H, (x, y) => pick(R, 0.5 + (n(x / W, y / H) - 0.5) * 0.9 + (r() - 0.5) * 0.45, x, y));
  for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H, c = r() < 0.5 ? '#9a9490' : '#b8b0a4'; P.px(x, y, c); P.px(x + 1, y + 1, dark(base, 0.3)); }
  P.speck(30, dark(base, 0.3), r);
});
export const planks = (base = '#9a6a42', dir = 'h') => ptex('planks' + base + dir, 2, 2, (g, W, H, r, P) => {
  P.fill(base);
  for (let y = 0; y < H; y += 8) {
    const k = (r() - 0.5) * 0.18, c = k > 0 ? light(base, k) : dark(base, -k);
    P.rect(0, y, W, 7, c); P.hline(0, y + 7, W, dark(base, 0.42)); P.hline(0, y, W, light(c, 0.12));
    for (let i = 0; i < 7; i++) P.hline(Math.floor(r() * W), y + 2 + Math.floor(r() * 4), 4 + Math.floor(r() * 10), dark(c, 0.09 + r() * 0.05));
    for (let x = Math.floor(r() * 30); x < W; x += 24 + Math.floor(r() * 24)) { P.vline(x, y, 7, dark(base, 0.38)); P.px(x + 2, y + 2, dark(c, 0.35)); P.px(x + 2, y + 5, dark(c, 0.35)); P.px(x - 3, y + 2, dark(c, 0.35)); P.px(x - 3, y + 5, dark(c, 0.35)); }
    if (r() < 0.35) { const x = Math.floor(r() * (W - 4)); P.rect(x, y + 3, 3, 2, dark(c, 0.3)); P.px(x + 1, y + 3, dark(c, 0.45)); }
  }
  if (dir === 'v') { const tmp = g.getImageData(0, 0, W, H); const out = g.createImageData(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s = (y * W + x) * 4, d = (x * W + y) * 4; for (let k = 0; k < 4; k++) out.data[d + k] = tmp.data[s + k]; } g.putImageData(out, 0, 0); }
});
export const tiles = (a = '#e8e4dc', b = '#c8d0d8', s = 0.25) => ptex('tiles' + a + b + s, 1, 1, (g, W, H, r, P) => {
  const n = Math.round(1 / s), t = W / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const c = (x + y) & 1 ? b : a; P.block(x * t, y * t, t, t, c, { hk: 0.1, lk: 0.1 }); if (t > 6) P.px(x * t + 2, y * t + 2, light(c, 0.25)); }
  P.speck(20, '#ffffff', r); P.speck(10, dark(a, 0.2), r);
});
export const carpet = (base = '#7a5a8a', pat = '#a87ab8') => ptex('carpet' + base + pat, 1, 1, (g, W, H, r, P) => {
  P.fill(base); P.speck(160, light(base, 0.08), r); P.speck(160, dark(base, 0.1), r);
  for (let y = 4; y < H; y += 8) for (let x = 4; x < W; x += 8) { P.px(x, y, pat); P.px(x + 1, y, pat); P.px(x, y + 1, pat); P.px(x - 1, y, pat); P.px(x, y - 1, pat); }
});
export const wallpaper = (base = '#e8d8c8', pat = '#c8a8a0') => ptex('wallpaper' + base + pat, 1, 1, (g, W, H, r, P) => {
  P.fill(base); for (let x = 0; x < W; x += 8) P.dither(x, 0, 2, H, pat, 0.5); for (let y = 6; y < H; y += 16) for (let x = 4; x < W; x += 8) { P.px(x, y, pat); P.px(x + 1, y + 1, pat); P.px(x - 1, y + 1, pat); }
  P.speck(20, dark(base, 0.06), r);
});
// water: banded swell (seamless), wind ripples, crest highlights with a trough under each, sparkles
export const water = (base = '#3a7ab0') => ptex('water' + base, 4, 4, (g, W, H, r, P) => {
  const R = ramp(base, [-0.28, -0.16, -0.07, 0, 0.08, 0.16]), n = fnoise(r, 4, 2), sw = pnoise(r, 3, 10);
  pixels(g, W, H, (x, y) => { const u = x / W, v = y / H; return pick(R, 0.48 + (n(u, v) - 0.5) * 0.8 + 0.22 * Math.sin((v * 12 + sw(u, v) * 2.2) * 6.283) + (r() - 0.5) * 0.12, x, y); });
  for (let i = 0; i < 80; i++) { const x = r() * W, y = r() * H, w = 3 + Math.floor(r() * 9); P.hline(x, y, w, light(base, 0.38)); P.hline(x + 1, y + 1, w - 2, dark(base, 0.12)); if (r() < 0.3) P.px(x + Math.floor(w / 2), y - 1, '#f4fbff'); }
  P.speck(24, '#e8f4ff', r);
});
// cast concrete: mottled cure, pits, a form joint along the tile edge and form-tie holes
export const concrete = (base = '#b0aca4') => ptex('concrete' + base, 2, 2, (g, W, H, r, P) => {
  const R = ramp(base, [-0.12, -0.05, 0, 0.04, 0.08]), n = fnoise(r, 2, 3);
  pixels(g, W, H, (x, y) => pick(R, 0.55 + (n(x / W, y / H) - 0.5) * 0.85 + (r() - 0.5) * 0.3, x, y));
  P.speck(55, dark(base, 0.22), r);
  P.hline(0, 0, W, dark(base, 0.25)); P.vline(0, 0, H, dark(base, 0.25)); P.hline(0, 1, W, light(base, 0.06));
  for (const [x, y] of [[16, 16], [48, 16], [16, 48], [48, 48]]) { P.px(x, y, dark(base, 0.38)); P.px(x + 1, y, dark(base, 0.2)); P.px(x, y + 1, light(base, 0.1)); }
  P.dither(0, 0, W, H, dark(base, 0.08), (x, y) => Math.max(0, n((x + 7) / W, y / H) - 0.6));
});
/** tactile warning paving at kerb ramps: rows of raised domes on yellow */
export const tactile = (c = '#e8c040') => ptex('tactile' + c, 1, 1, (g, W, H, r, P) => {
  P.fill(c); P.speck(30, dark(c, 0.1), r);
  for (let y = 2; y < H; y += 5) for (let x = 2 + ((y / 5) & 1 ? 2 : 0); x < W; x += 5) { P.rect(x, y, 2, 2, light(c, 0.18)); P.px(x + 1, y + 1, dark(c, 0.3)); }
  P.hline(0, 0, W, dark(c, 0.3)); P.dither(0, 0, W, H, '#8a7a5a', 0.08);
});
/** a flat roof: bitumen membrane in rolled strips with lapped seams, gravel, patched blisters and a drain stain */
export const roofMembrane = (base = '#8a8680') => ptex('roofmem' + base, 4, 4, (g, W, H, r, P) => {
  const R = ramp(base, [-0.18, -0.09, -0.03, 0, 0.05, 0.11]), n = fnoise(r, 4, 3);
  pixels(g, W, H, (x, y) => pick(R, 0.52 + (n(x / W, y / H) - 0.5) * 0.9 + (r() - 0.5) * 0.55, x, y));
  for (let y = 0; y < H; y += 32) { P.hline(0, y, W, dark(base, 0.3)); P.hline(0, y + 1, W, light(base, 0.1)); }
  for (let i = 0; i < W * H * 0.02; i++) P.px(r() * W, r() * H, r() < 0.5 ? light(base, 0.25) : dark(base, 0.3));
  for (let i = 0; i < 3; i++) { const x = Math.floor(r() * (W - 20)), y = Math.floor(r() * (H - 14)), w = 10 + Math.floor(r() * 12), h = 6 + Math.floor(r() * 8); P.dither(x, y, w, h, dark(base, 0.12), 0.7); P.hline(x, y, w, dark(base, 0.22)); P.vline(x, y, h, dark(base, 0.18)); P.hline(x, y + h, w, light(base, 0.05)); }
  P.blob(r() * W, r() * H, 9, 6, dark(base, 0.16), 0.5); P.blob(r() * W, r() * H, 6, 5, '#7a8a5a', 0.3);
});

// ---------------------------------------------------------------- facade pieces (one texture per window / door / sign)
/**
 * A sash window, 1 × 1.4 m: a moulded casing with a lit head and a sill, a deep shadowed reveal, glass that
 * reflects the sky (gradient, a glare band, a cloud) over a dim room, and one of four dressings chosen from the
 * curtain colour: drapes on tie-backs, a half-drawn roller blind, venetian slats, or a café curtain with a plant.
 * lit: a warm room glows behind backlit curtains.
 */
export const windowTex = (frame = '#f2ead8', curtain = '#d87a6a', lit = false) => ptex('win' + frame + curtain + lit, 1, 1.4, (g, W, H, r, P) => {
  const v = hashStr(curtain) % 4, gx = 4, gy = 5, gw = W - 8, gh = H - 11, mid = gy + Math.floor(gh / 2);
  P.glass = [[gx, gy, gw, gh]];
  // casing
  P.fill(frame); P.rect(0, 0, W, 4, light(frame, 0.12)); P.hline(0, 0, W, light(frame, 0.28)); P.hline(0, 3, W, dark(frame, 0.22));
  P.vline(0, 4, H - 7, light(frame, 0.1)); P.vline(W - 1, 4, H - 7, dark(frame, 0.24)); P.vline(1, 4, H - 7, light(frame, 0.04));
  P.rect(0, H - 4, W, 4, light(frame, 0.08)); P.hline(0, H - 4, W, light(frame, 0.3)); P.hline(0, H - 2, W, dark(frame, 0.2)); P.hline(0, H - 1, W, dark(frame, 0.4));
  // the room behind the glass
  const room = lit ? '#e8a858' : '#26323e', roomHi = lit ? '#ffdc98' : '#2e3c4a';
  P.rect(gx, gy, gw, gh, room); P.rect(gx, gy, gw, Math.round(gh * 0.3), roomHi); P.dither(gx, gy + Math.round(gh * 0.3), gw, 2, roomHi, 0.5);
  if (lit) { P.rect(gx + gw - 9, gy + 6, 6, 3, '#fff4d0'); P.rect(gx + gw - 7, gy + 9, 2, 6, '#a86a3a'); }
  else { P.rect(gx + 2, gy + gh - 8, gw - 4, 1, '#1a2430'); P.rect(gx + gw - 9, gy + gh - 15, 5, 7, '#202a36'); }
  const cc = lit ? light(curtain, 0.22) : curtain, cd = dark(cc, 0.22), ch = light(cc, 0.16);
  if (v === 0) {        // drapes on tie-backs + a valance
    const cw = Math.round(gw * 0.3);
    for (const [x0, s] of [[gx, 1], [gx + gw - cw, -1]]) for (let y = gy; y < gy + gh; y++) { const pinch = y > gy + gh * 0.55 && y < gy + gh * 0.65 ? 2 : 0, w = Math.max(3, Math.round(cw * (y < gy + gh * 0.6 ? 0.75 + (y - gy) / gh * 0.4 : 1)) - pinch); const xa = s > 0 ? x0 : x0 + cw - w; P.rect(xa, y, w, 1, cc); for (let k = 1; k < w; k += 3) P.px(xa + k, y, cd); P.px(s > 0 ? xa : xa + w - 1, y, ch); }
    P.rect(gx, gy + Math.round(gh * 0.58), 4, 2, '#e8c860'); P.rect(gx + gw - 4, gy + Math.round(gh * 0.58), 4, 2, '#e8c860');
    P.rect(gx, gy, gw, 4, cc); for (let x = gx; x < gx + gw; x += 4) { P.px(x + 1, gy + 4, cc); P.px(x + 2, gy + 4, cc); P.px(x, gy + 3, cd); }
  } else if (v === 1) { // roller blind, half down, with a pull ring; a shelf and a lamp in the dim room below
    const bh = Math.round(gh * (0.32 + (hashStr(curtain + frame) % 3) * 0.08));
    P.rect(gx, gy, gw, bh, cc); for (let y = gy + 2; y < gy + bh; y += 4) P.hline(gx, y, gw, ch); P.hline(gx, gy + bh, gw, cd); P.hline(gx, gy + bh + 1, gw, dark(cc, 0.4));
    P.px(gx + gw / 2, gy + bh + 2, '#e8e0d0'); P.rect(gx + gw / 2 - 1, gy + bh + 3, 3, 2, '#e8e0d0');
  } else if (v === 2) { // venetian blind slats over the top sash, tilted half open
    for (let y = gy; y < mid - 1; y += 2) { P.hline(gx, y, gw, lit ? light(curtain, 0.35) : light(curtain, 0.08)); if (dith(y, y >> 1, 0.5)) P.hline(gx, y + 1, gw, cd); }
    P.vline(gx + 4, gy, mid - gy, dark(cc, 0.3)); P.vline(gx + gw - 5, gy, mid - gy, dark(cc, 0.3));
  } else {              // café curtain on the lower sash, a potted plant on the inside sill
    const y0 = mid + 2; P.rect(gx, y0, gw, gy + gh - y0, cc); for (let x = gx + 1; x < gx + gw; x += 3) P.vline(x, y0 + 1, gy + gh - y0 - 1, cd); P.hline(gx, y0, gw, dark(cc, 0.35)); P.hline(gx, y0 + 1, gw, ch);
    const px0 = gx + Math.floor(gw * 0.62); P.rect(px0, y0 - 4, 5, 4, '#b8643a'); P.hline(px0, y0 - 4, 5, '#d8845a');
    for (const [dx, dy, c] of [[1, -7, '#3a7a3a'], [3, -9, '#4a8a42'], [-1, -9, '#5a9a4a'], [2, -11, '#4a8a42'], [5, -8, '#3a7a3a'], [0, -6, '#5a9a4a']]) P.rect(px0 + dx, y0 + dy, 2, 2, c);
  }
  // reflections: sky gradient, a glare band and (sometimes) a cloud, dithered over the glass
  const ph = hashStr(frame + curtain) % 9;
  for (const [y0, y1] of [[gy, mid - 1], [mid + 2, gy + gh]]) for (let y = y0; y < y1; y++) for (let x = gx; x < gx + gw; x++) {
    const t = y - y0, band = ((x - gx) + (y - gy) + ph) % 24;
    if (!lit && (t < 2 || (t < 4 && dith(x, y, 0.5)))) P.px(x, y, t < 1 ? '#b8d4ea' : '#8eaecc');
    if (band < 2 && t > 1) P.px(x, y, lit ? '#fff4d0' : '#c4dcee'); else if (band === 2 && t > 1 && !lit) P.px(x, y, '#7e9ebc');
  }
  if (!lit && ph % 3 === 0) { const cx = gx + 5 + (ph % 6) * 2; P.rect(cx, gy + 3, 7, 1, '#e4f0f8'); P.rect(cx + 1, gy + 2, 4, 1, '#e4f0f8'); }
  // the reveal's shadow (top + left), sashes, meeting rail, muntins
  P.hline(gx, gy, gw, dark(lit ? '#c88848' : '#1a2430', 0.2)); P.hline(gx, gy + 1, gw, lit ? '#d89a58' : '#202c38'); P.vline(gx, gy, gh, lit ? '#c88848' : '#1c2632');
  P.rect(gx - 1, mid - 1, gw + 2, 3, frame); P.hline(gx - 1, mid - 1, gw + 2, light(frame, 0.15)); P.hline(gx - 1, mid + 1, gw + 2, dark(frame, 0.25));
  P.vline(gx + Math.floor(gw / 2), gy, gh, frame); P.vline(gx + Math.floor(gw / 2) + 1, gy, gh, dark(frame, 0.3));
  P.rect(gx - 1, gy - 1, gw + 2, 1, dark(frame, 0.3)); P.vline(gx - 1, gy, gh, dark(frame, 0.12)); P.vline(gx + gw, gy, gh, light(frame, 0.1)); P.hline(gx - 1, gy + gh, gw + 2, light(frame, 0.2));
  P.px(gx + Math.floor(gw / 2) - 2, mid + 1, '#c8a048');
}, { ppm: 32 });
/** shop window: shelves of goods over a counter display, an OPEN card, reflections; lit at night */
export const shopWindowTex = (frame = '#2a2a34', lit = false, seed = 1) => ptex('shopwin' + frame + lit + seed, 2, 1.8, (g, W, H, r, P) => {
  P.fill(frame); P.hline(0, 0, W, light(frame, 0.25)); P.vline(0, 0, H, light(frame, 0.12)); P.vline(W - 1, 0, H, dark(frame, 0.3));
  const gx = 2, gy = 2, gw = W - 4, gh = H - 9, back = lit ? '#f4d8a0' : '#2c3844', back2 = lit ? '#ffe8b8' : '#384858';
  P.glass = [[gx, gy, gw, gh]];
  P.rect(gx, gy, gw, gh, back); P.rect(gx, gy, gw, Math.round(gh * 0.25), back2);
  const goods = ['#e85a4a', '#f0c840', '#5ab06a', '#4a8ad8', '#e890b0', '#f4f0ea', '#a86ad8', '#f08a3a', '#3ab8a0'], sh = lit ? '#a8784a' : '#5a4a3a';
  const shelfY = [gy + 13, gy + 25, gy + 37];
  for (const sy of shelfY) {
    P.rect(gx + 2, sy, gw - 4, 2, sh); P.hline(gx + 2, sy, gw - 4, light(sh, 0.2)); P.hline(gx + 2, sy + 2, gw - 4, dark(back, 0.3));
    let x = gx + 3 + Math.floor(r() * 3);
    while (x < gx + gw - 6) {
      const kind = r(), c = goods[Math.floor(r() * goods.length)], cl2 = lit ? light(c, 0.1) : dark(c, 0.15);
      if (kind < 0.4) { const w = 3 + Math.floor(r() * 3), h = 4 + Math.floor(r() * 5); P.block(x, sy - h, w, h, cl2, { hk: 0.25, lk: 0.3 }); if (w > 3) P.hline(x + 1, sy - h + 2, w - 2, light(cl2, 0.35)); x += w + 1; }
      else if (kind < 0.7) { const h = 6 + Math.floor(r() * 4); P.rect(x, sy - h + 2, 2, h - 2, cl2); P.px(x, sy - h + 1, dark(cl2, 0.3)); P.px(x, sy - h, '#d8d8d0'); P.px(x, sy - h + 3, light(cl2, 0.4)); x += 3; }
      else { const w = 4, h = 4 + Math.floor(r() * 2); P.rect(x, sy - h, w, h, cl2); P.hline(x, sy - h, w, '#e8e0d0'); P.hline(x, sy - h - 1, w, dark(cl2, 0.3)); P.px(x, sy - h + 1, light(cl2, 0.4)); x += w + 1; }
      if (r() < 0.12) x += 3;
    }
    for (let i = 0; i < 2; i++) { const tx = gx + 4 + Math.floor(r() * (gw - 10)); P.rect(tx, sy + 1, 3, 2, '#f8f4e8'); P.px(tx + 1, sy + 2, '#c83a3a'); }
  }
  // the OPEN card hanging in the door-side pane
  if (seed % 2 === 0) { const cx = gx + gw - 17; P.vline(cx + 3, gy, 4, '#c8c0b0'); P.vline(cx + 11, gy, 4, '#c8c0b0'); P.rect(cx, gy + 4, 15, 8, lit ? '#e83a5a' : '#f4f0e6'); P.tiny('OPEN', cx + 1, gy + 6, lit ? '#fff8e0' : '#c83a3a'); }
  // glass reflections (strong by day, faint at night)
  for (let y = gy; y < gy + gh; y++) for (let x = gx; x < gx + gw; x++) { const b = (x + y + seed * 7) % 40; if (b < 3 || (b === 6 && !lit)) P.px(x, y, lit ? '#fff4dc' : b < 3 ? '#b8d0e4' : '#8aa8c4'); }
  if (!lit) P.rect(gx, gy, gw, 2, '#5a7a98');
  P.hline(gx, gy, gw, dark(frame, 0.2));
  P.rect(0, H - 7, W, 7, dark(frame, 0.1)); P.hline(0, H - 7, W, light(frame, 0.3)); P.rect(4, H - 5, W - 8, 3, dark(frame, 0.25)); P.hline(4, H - 5, W - 8, dark(frame, 0.4));
  P.vline(Math.floor(W / 2), gy, gh, frame); P.vline(Math.floor(W / 2) + 1, gy, gh, dark(frame, 0.3));
});
/** a door 1 × 2.2 m. panel: a glazed top lite, four raised and bevelled panels, a letter slot, brass knob and
 *  kick plate. glass: a shop door with a frame, push bar, reflections and an opening-hours sticker. */
export const doorTex = (col = '#7a3a2a', kind = 'panel') => ptex('door' + col + kind, 1, 2.2, (g, W, H, r, P) => {
  P.fill(col); P.rect(0, 0, W, 2, dark(col, 0.45)); P.vline(0, 0, H, dark(col, 0.4)); P.vline(W - 1, 0, H, dark(col, 0.45)); P.vline(1, 2, H - 2, light(col, 0.1));
  const brass = '#d8b048', brassHi = '#fff0b0';
  if (kind === 'glass') {
    const gx = 4, gy = 5, gw = W - 8, gh = H - 22;
    P.glass = [[gx, gy, gw, gh]];
    P.rect(gx, gy, gw, gh, '#2c3a48');
    for (let y = gy; y < gy + gh; y++) for (let x = gx; x < gx + gw; x++) { const b = (x + y * 0.7) % 21; if (dith(x, y, b < 3 ? 0.6 : b < 5 ? 0.3 : 0.12 + (1 - (y - gy) / gh) * 0.2)) P.px(x, y, b < 3 ? '#d0e4f2' : '#7a98b4'); }
    P.hline(gx, gy, gw, '#1a222c'); P.vline(gx, gy, gh, '#1a222c');
    P.rect(gx + 2, gy + Math.floor(gh * 0.5), gw - 4, 3, '#c8ccd4'); P.hline(gx + 2, gy + Math.floor(gh * 0.5), gw - 4, '#f4f6f8'); P.hline(gx + 2, gy + Math.floor(gh * 0.5) + 2, gw - 4, '#8a8e98');
    P.rect(gx + 3, gy + gh - 12, 9, 7, '#f4f0e6'); P.tiny('24', gx + 4, gy + gh - 11, '#3a6aa8'); P.hline(gx + 4, gy + gh - 5, 7, '#c83a3a');
    P.rect(4, H - 16, W - 8, 12, dark(col, 0.15)); P.hline(4, H - 16, W - 8, light(col, 0.15));
  } else {
    // a glazed lite at the top
    P.glass = [[5, 4, W - 10, 12]];
    P.rect(5, 4, W - 10, 12, '#3a4a5c'); for (let y = 4; y < 16; y++) for (let x = 5; x < W - 5; x++) if (dith(x, y, (x + y) % 9 < 2 ? 0.7 : 0.15)) P.px(x, y, '#a8c4dc');
    P.hline(5, 4, W - 10, dark(col, 0.4)); P.vline(Math.floor(W / 2), 4, 12, col); P.hline(5, 16, W - 10, light(col, 0.12));
    for (const [x, y, w, h] of [[5, 19, 9, 18], [W - 14, 19, 9, 18], [5, 41, 9, 22], [W - 14, 41, 9, 22]]) {
      P.rect(x, y, w, h, dark(col, 0.12)); P.rect(x + 1, y + 1, w - 2, h - 2, light(col, 0.05));
      P.hline(x, y, w, dark(col, 0.32)); P.vline(x, y, h, dark(col, 0.28)); P.hline(x, y + h - 1, w, light(col, 0.18)); P.vline(x + w - 1, y, h, light(col, 0.12));
      P.hline(x + 2, y + 2, w - 4, light(col, 0.16)); P.vline(x + 2, y + 2, h - 4, light(col, 0.1)); P.hline(x + 2, y + h - 3, w - 4, dark(col, 0.14));
    }
    P.rect(9, 38, W - 18, 2, '#3a3028'); P.hline(8, 37, W - 16, brass); P.hline(8, 40, W - 16, dark(brass, 0.3));
    P.rect(3, H - 6, W - 6, 5, dark(brass, 0.1)); P.hline(3, H - 6, W - 6, brassHi); P.speck(6, dark(brass, 0.35), r, 3, H - 5, W - 6, 4);
  }
  const ky = Math.floor(H * 0.5); P.rect(W - 8, ky - 1, 4, 4, brass); P.px(W - 8, ky - 1, brassHi); P.px(W - 5, ky + 2, dark(brass, 0.4)); P.rect(W - 7, ky + 4, 2, 3, dark(brass, 0.2));
  P.dither(2, H - 14, W - 4, 8, dark(col, 0.25), (x, y) => (y - (H - 14)) / 14);
});
export const garageTex = (col = '#c8c4bc') => ptex('garage' + col, 2.6, 2.2, (g, W, H, r, P) => {
  P.fill(col); P.vline(0, 0, H, dark(col, 0.4)); P.vline(W - 1, 0, H, dark(col, 0.4)); P.hline(0, 0, W, dark(col, 0.45));
  for (let y = 2; y < H; y += 7) { P.hline(1, y, W - 2, dark(col, 0.28)); P.hline(1, y + 1, W - 2, light(col, 0.16)); P.dither(1, y + 4, W - 2, 2, dark(col, 0.08), 0.5); }
  for (let x = 10; x < W - 14; x += 16) { P.rect(x, 10, 11, 5, '#3a4a5a'); P.hline(x, 10, 11, '#1e2834'); P.dither(x, 11, 11, 4, '#8aa8c4', (xx, yy) => ((xx + yy) % 7 < 2 ? 0.7 : 0.1)); P.hline(x, 15, 11, light(col, 0.2)); }
  P.rect(Math.floor(W / 2) - 4, H - 14, 8, 2, '#8a8e98'); P.hline(Math.floor(W / 2) - 4, H - 14, 8, '#d8dce4');
  P.dither(1, H - 16, W - 2, 15, dark(col, 0.22), (x, y) => (y - (H - 16)) / 20); P.speck(40, dark(col, 0.2), r);
  P.blob(W * 0.6, H - 2, 5, 1, '#4a4440', 0.6);
});
/** a shop sign board with crisp pixel lettering, a bevelled frame and corner bolts */
export function signTex(text, bg = '#c83a3a', fg = '#ffe8a0', o = {}) {
  const w = o.w || Math.max(2, text.length * 0.42 + 0.6), h = o.h || 0.7;
  return ptex('sign' + text + bg + fg + w + h, w, h, (g, W, H, r, P) => {
    P.fill(bg); P.dither(0, 0, W, H, light(bg, 0.06), (x, y) => (1 - y / H) * 0.4);
    P.rect(0, 0, W, 2, light(bg, 0.32)); P.rect(0, H - 2, W, 2, dark(bg, 0.42)); P.vline(0, 0, H, light(bg, 0.2)); P.vline(W - 1, 0, H, dark(bg, 0.38));
    P.rect(2, 2, W - 4, 1, dark(bg, 0.18)); P.rect(2, H - 3, W - 4, 1, light(bg, 0.1)); P.vline(2, 2, H - 4, dark(bg, 0.14)); P.vline(W - 3, 2, H - 4, light(bg, 0.08));
    for (const [x, y] of [[4, 4], [W - 6, 4], [4, H - 6], [W - 6, H - 6]]) { P.rect(x, y, 2, 2, dark(bg, 0.35)); P.px(x, y, light(bg, 0.45)); }
    P.text(text, W / 2, H / 2 + 1, Math.round(H * (o.fs || 0.6)), fg, { shadow: dark(bg, 0.55), font: o.font, hi: light(fg, 0.35) });
    P.dither(0, 0, W, H, dark(bg, 0.12), (x, y) => (((x * 7 + y * 13) % 29) < 2 ? 0.5 : 0));
  }, { ppm: o.ppm || 48 });
}
/** a striped canvas awning (2 × 1.25 m; the canvas bottom is the outer edge): fold shading on every stripe,
 *  a stitched seam, a scalloped valance and rain grime toward the edge */
export const awningTex = (a = '#c83a3a', b = '#f4ece0') => ptex('awning' + a + b, 2, 1.25, (g, W, H, r, P) => {
  for (let x = 0; x < W; x += 16) for (const [ox, c] of [[0, a], [8, b]]) { P.rect(x + ox, 0, 8, H, c); P.vline(x + ox, 0, H, light(c, 0.14)); P.vline(x + ox + 7, 0, H, dark(c, 0.16)); P.vline(x + ox + 6, 0, H, dark(c, 0.06)); }
  for (let x = 0; x < W; x += 16) for (const [ox, c] of [[0, a], [8, b]]) { P.rect(x + ox + 1, 0, 6, 2, light(c, 0.12)); P.rect(x + ox, Math.round(H * 0.62), 8, Math.round(H * 0.38), dark(c, 0.07)); P.vline(x + ox + 7, Math.round(H * 0.62), Math.round(H * 0.38), dark(c, 0.22)); }
  for (let x = 1; x < W; x += 3) P.px(x, 9, dark(b, 0.3));
  const vy = H - 8;
  for (let x = 0; x < W; x += 16) for (const [ox, c] of [[0, a], [8, b]]) { const cc = dark(c, 0.08); P.rect(x + ox, vy, 8, 6, cc); P.rect(x + ox + 1, vy + 6, 6, 1, cc); P.rect(x + ox + 2, vy + 7, 4, 1, cc); P.hline(x + ox, vy + 4, 8, dark(c, 0.22)); }
  P.hline(0, vy - 1, W, dark(a, 0.42)); P.hline(0, vy, W, light(b, 0.1));
  for (let x = 0; x < W; x += 8) P.px(x + 4, vy + 7, dark(a, 0.5));
});
export const solid = (c) => ptex('solid' + c, 1, 1, (g, W, H, r, P) => { P.fill(c); P.speck(12, light(c, 0.08), r); P.speck(12, dark(c, 0.08), r); }, { ppm: 8 });
export const stripes = (a, b, n = 4) => ptex('stripes' + a + b + n, 1, 1, (g, W, H, r, P) => { for (let y = 0; y < H; y += H / n) { P.rect(0, y, W, H / n / 2, a); P.rect(0, y + H / n / 2, W, H / n / 2, b); } });
/** road markings: worn dashed centre line, zebra crossing with paint worn through to the asphalt */
export const dashTex = () => ptex('dash', 3, 0.15, (g, W, H, r, P) => {
  P.rect(0, 0, W * 0.55, H, '#f0e8c8'); P.speck(14, '#c8c0a0', r, 0, 0, W * 0.55, H); P.speck(10, '#5a5a62', r, 0, 0, W * 0.55, H); P.hline(0, H - 1, W * 0.55, '#d8d0b0');
}, { ppm: 32 });
export const zebraTex = () => ptex('zebra', 1, 1, (g, W, H, r, P) => {
  const n = fnoise(r, 2, 2), A = asphaltSwatch(r);
  pixels(g, W, H, (x, y) => { const wear = n(x / W, y / H); if (x < W / 2 && !(wear > 0.68 && r() < (wear - 0.68) * 4)) return r() < 0.08 ? [214, 210, 198] : [238, 234, 222]; return pick(A, 0.45 + (r() - 0.5) * 0.5, x, y); });
  P.vline(0, 0, H, '#c8c4b4'); P.vline(W / 2 - 1, 0, H, '#d8d4c4');
});
const asphaltSwatch = () => ramp('#4a4a54', [-0.14, -0.05, 0, 0.06, 0.13]);
