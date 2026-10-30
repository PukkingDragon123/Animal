// Pixel-art textures for the walkable city: low-poly geometry wearing crisp, hand-pixelled
// surfaces (nearest-filtered, a steady texel density, ordered dithering instead of smooth
// gradients). Every texture knows its size in metres (tex.userData.size) so the builder can
// lay out UVs in metres and keep the pixel grid square everywhere.
import * as THREE from '../../../vendor/three.module.js';

export const PXM = 32;                         // texels per metre (walls, floors, props)
const CACHE = new Map();

// ---------------------------------------------------------------- colour + random
export const hx = (c) => { const n = parseInt(c.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const cl = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
export const css = (r, g, b) => `rgb(${cl(r) | 0},${cl(g) | 0},${cl(b) | 0})`;
export function tone(c, k) { const [r, g, b] = hx(c); return k >= 0 ? css(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k) : css(r * (1 + k), g * (1 + k), b * (1 + k)); }
/** painted shadow: darker and cooler; painted light: lighter and warmer */
export const dark = (c, k = 0.25) => { const [r, g, b] = hx(c); return css(r * (1 - k) - 6 * k, g * (1 - k) - 4 * k, b * (1 - k) + 14 * k); };
export const light = (c, k = 0.2) => { const [r, g, b] = hx(c); return css(r + (255 - r) * k + 8 * k, g + (255 - g) * k + 4 * k, b + (255 - b) * k - 6 * k); };
export const hex = (s) => { const m = s.match(/\d+/g); return '#' + m.slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join(''); };
export const rnd = (seed) => { let x = (seed >>> 0) || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };
export const hashStr = (s) => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** ordered-dither test: true where a pixel at (x, y) should take the second colour for coverage t */
export const dith = (x, y, t) => t > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

// ---------------------------------------------------------------- texture factory
/** A cached pixel texture wM × hM metres at ppm texels per metre; paint(g, W, H, r, P) draws it. */
export function ptex(key, wM, hM, paint, o = {}) {
  const ppm = o.ppm || PXM, k = key + '|' + wM + '|' + hM + '|' + ppm;
  if (CACHE.has(k)) return CACHE.get(k);
  const W = Math.max(1, Math.round(wM * ppm)), H = Math.max(1, Math.round(hM * ppm));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  paint(g, W, H, rnd(hashStr(key)), new Painter(g, W, H));
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  t.userData.size = [wM, hM]; t.userData.key = k;
  CACHE.set(k, t);
  return t;
}

/** Pixel painting helpers on a canvas (integer rects, wrap-around, dithering). */
export class Painter {
  constructor(g, W, H) { this.g = g; this.W = W; this.H = H; }
  fill(c) { this.g.fillStyle = c; this.g.fillRect(0, 0, this.W, this.H); return this; }
  rect(x, y, w, h, c) { if (w <= 0 || h <= 0) return this; this.g.fillStyle = c; this.g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); return this; }
  px(x, y, c) { this.g.fillStyle = c; this.g.fillRect(((Math.round(x) % this.W) + this.W) % this.W, ((Math.round(y) % this.H) + this.H) % this.H, 1, 1); return this; }
  hline(x, y, w, c) { return this.rect(x, y, w, 1, c); }
  vline(x, y, h, c) { return this.rect(x, y, 1, h, c); }
  /** dither c over a rect with coverage t (0..1), or t(x, y) */
  dither(x0, y0, w, h, c, t) { this.g.fillStyle = c; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (dith(x, y, typeof t === 'function' ? t(x, y) : t)) this.g.fillRect(x, y, 1, 1); return this; }
  /** sprinkle n single pixels in colour c */
  speck(n, c, r, x0 = 0, y0 = 0, w = this.W, h = this.H) { this.g.fillStyle = c; for (let i = 0; i < n; i++) this.g.fillRect(x0 + Math.floor(r() * w), y0 + Math.floor(r() * h), 1, 1); return this; }
  /** a 1px outlined, top-lit / bottom-shaded block */
  block(x, y, w, h, c, o = {}) {
    this.rect(x, y, w, h, c);
    if (o.hi !== false) { this.hline(x, y, w, light(c, o.hk || 0.18)); this.vline(x, y, h, light(c, (o.hk || 0.18) * 0.6)); }
    if (o.lo !== false) { this.hline(x, y + h - 1, w, dark(c, o.lk || 0.22)); this.vline(x + w - 1, y, h, dark(c, (o.lk || 0.22) * 0.7)); }
    if (o.ink) { this.g.strokeStyle = o.ink; this.g.lineWidth = 1; this.g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
    return this;
  }
  text(str, x, y, size, c, o = {}) {
    const g = this.g; g.font = `${o.weight || 700} ${size}px ${o.font || '"DotGothic16", "Courier New", monospace'}`; g.textBaseline = 'middle'; g.textAlign = o.align || 'center';
    if (o.shadow) { g.fillStyle = o.shadow; g.fillText(str, Math.round(x) + 1, Math.round(y) + 1); }
    g.fillStyle = c; g.fillText(str, Math.round(x), Math.round(y)); return this;
  }
}

// ---------------------------------------------------------------- surfaces
// wall bricks (0.25 × 0.083 m courses), running bond, per-brick tint, mortar lines, chipped corners
export const brick = (base = '#a8523a', mortar = '#d8c8b0') => ptex('brick' + base + mortar, 2, 2, (g, W, H, r, P) => {
  P.fill(mortar);
  const bw = 8, bh = 3;
  for (let row = 0; row * bh < H; row++) for (let col = -1; col * bw < W; col++) {
    const x = col * bw + (row & 1 ? bw / 2 : 0), y = row * bh, k = (r() - 0.5) * 0.22;
    const c = k > 0 ? light(base, k) : dark(base, -k);
    P.rect(x, y, bw - 1, bh - 1, c); P.hline(x, y, bw - 1, light(c, 0.12)); P.px(x + bw - 2, y + bh - 2, dark(c, 0.2));
    if (r() < 0.08) P.px(x + Math.floor(r() * (bw - 1)), y + 1, dark(c, 0.3));
  }
  P.speck(60, dark(base, 0.35), r);
});
// smooth plaster / stucco with soft weather stains
export const plaster = (base = '#e8d8c0') => ptex('plaster' + base, 2, 2, (g, W, H, r, P) => {
  P.fill(base); P.speck(140, light(base, 0.08), r); P.speck(140, dark(base, 0.08), r);
  P.dither(0, H - 10, W, 10, dark(base, 0.1), (x, y) => (y - (H - 10)) / 14);
});
// horizontal clapboard siding (San Francisco row houses)
export const siding = (base = '#7aa8c8') => ptex('siding' + base, 2, 2, (g, W, H, r, P) => {
  P.fill(base);
  for (let y = 0; y < H; y += 6) { P.hline(0, y, W, light(base, 0.16)); P.hline(0, y + 5, W, dark(base, 0.28)); P.dither(0, y + 3, W, 2, dark(base, 0.1), 0.5); }
  P.speck(40, dark(base, 0.2), r);
});
export const roofTiles = (base = '#3a7a5a') => ptex('rooftile' + base, 2, 2, (g, W, H, r, P) => {
  P.fill(dark(base, 0.3));
  for (let y = 0; y < H; y += 5) for (let x = (y / 5) & 1 ? 3 : 0; x < W + 6; x += 6) { P.rect(x, y, 5, 4, base); P.hline(x, y, 5, light(base, 0.22)); P.px(x + 4, y + 3, dark(base, 0.25)); }
});
export const shingles = (base = '#5a4a5a') => ptex('shingle' + base, 2, 2, (g, W, H, r, P) => {
  P.fill(dark(base, 0.25));
  for (let y = 0; y < H; y += 4) for (let x = (y / 4) & 1 ? 2 : 0; x < W + 4; x += 5) { const c = r() < 0.5 ? base : light(base, 0.08); P.rect(x, y, 4, 3, c); P.hline(x, y + 2, 4, dark(c, 0.15)); }
});
export const metalRoof = (base = '#8a9aa8') => ptex('metalroof' + base, 2, 2, (g, W, H, r, P) => {
  P.fill(base); for (let x = 0; x < W; x += 6) { P.vline(x, 0, H, light(base, 0.25)); P.vline(x + 1, 0, H, dark(base, 0.15)); }
  P.speck(30, dark(base, 0.3), r);
});
export const asphalt = (base = '#4a4a54') => ptex('asphalt' + base, 4, 4, (g, W, H, r, P) => {
  P.fill(base); P.speck(900, light(base, 0.1), r); P.speck(900, dark(base, 0.15), r);
  for (let i = 0; i < 4; i++) { let x = r() * W, y = r() * H; for (let k = 0; k < 18; k++) { P.px(x, y, dark(base, 0.35)); x += r() < 0.5 ? 1 : 0; y += r() < 0.7 ? 1 : -1; } }
});
export const pavers = (base = '#c8c0b4') => ptex('pavers' + base, 2, 2, (g, W, H, r, P) => {
  P.fill(dark(base, 0.25));
  const s = 16;
  for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) { const k = (r() - 0.5) * 0.1, c = k > 0 ? light(base, k) : dark(base, -k); P.block(x, y, s - 1, s - 1, c, { hk: 0.12, lk: 0.12 }); P.speck(6, dark(c, 0.15), r, x, y, s - 1, s - 1); }
});
export const cobble = (base = '#9a8e84') => ptex('cobble' + base, 2, 2, (g, W, H, r, P) => {
  P.fill(dark(base, 0.4));
  for (let y = 0; y < H; y += 5) for (let x = (y / 5) & 1 ? 3 : 0; x < W + 6; x += 6) { const k = (r() - 0.5) * 0.24, c = k > 0 ? light(base, k) : dark(base, -k); P.rect(x, y, 5, 4, c); P.px(x, y, light(c, 0.2)); P.px(x + 4, y + 3, dark(c, 0.2)); }
});
export const grass = (base = '#5a9a4a') => ptex('grass' + base, 2, 2, (g, W, H, r, P) => {
  P.fill(base); P.speck(500, light(base, 0.14), r); P.speck(500, dark(base, 0.16), r);
  for (let i = 0; i < 60; i++) { const x = r() * W, y = r() * H; P.px(x, y, light(base, 0.3)); P.px(x, y + 1, dark(base, 0.1)); }
  for (let i = 0; i < 8; i++) { const x = r() * W, y = r() * H, c = ['#f4e8a0', '#f0a0b8', '#ffffff', '#a8c8f8'][i & 3]; P.px(x, y, c); }
});
export const dirt = (base = '#a8845a') => ptex('dirt' + base, 2, 2, (g, W, H, r, P) => { P.fill(base); P.speck(400, light(base, 0.12), r); P.speck(400, dark(base, 0.16), r); P.speck(30, '#8a8a8a', r); });
export const planks = (base = '#9a6a42', dir = 'h') => ptex('planks' + base + dir, 2, 2, (g, W, H, r, P) => {
  P.fill(base);
  for (let y = 0; y < H; y += 8) {
    const k = (r() - 0.5) * 0.16, c = k > 0 ? light(base, k) : dark(base, -k);
    P.rect(0, y, W, 7, c); P.hline(0, y + 7, W, dark(base, 0.4)); P.hline(0, y, W, light(c, 0.12));
    for (let x = Math.floor(r() * 30); x < W; x += 24 + Math.floor(r() * 24)) { P.vline(x, y, 7, dark(base, 0.35)); P.px(x + 3, y + 3, dark(c, 0.3)); }
    for (let i = 0; i < 6; i++) P.hline(Math.floor(r() * W), y + 2 + Math.floor(r() * 4), 4 + Math.floor(r() * 8), dark(c, 0.1));
  }
  if (dir === 'v') { const tmp = g.getImageData(0, 0, W, H); const out = g.createImageData(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s = (y * W + x) * 4, d = (x * W + y) * 4; for (let k = 0; k < 4; k++) out.data[d + k] = tmp.data[s + k]; } g.putImageData(out, 0, 0); }
});
export const tiles = (a = '#e8e4dc', b = '#c8d0d8', s = 0.25) => ptex('tiles' + a + b + s, 1, 1, (g, W, H, r, P) => {
  const n = Math.round(1 / s), t = W / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const c = (x + y) & 1 ? b : a; P.block(x * t, y * t, t, t, c, { hk: 0.1, lk: 0.1 }); }
  P.speck(20, '#ffffff', r);
});
export const carpet = (base = '#7a5a8a', pat = '#a87ab8') => ptex('carpet' + base + pat, 1, 1, (g, W, H, r, P) => {
  P.fill(base); P.speck(160, light(base, 0.08), r); P.speck(160, dark(base, 0.1), r);
  for (let y = 4; y < H; y += 8) for (let x = 4; x < W; x += 8) { P.px(x, y, pat); P.px(x + 1, y, pat); P.px(x, y + 1, pat); P.px(x - 1, y, pat); P.px(x, y - 1, pat); }
});
export const wallpaper = (base = '#e8d8c8', pat = '#c8a8a0') => ptex('wallpaper' + base + pat, 1, 1, (g, W, H, r, P) => {
  P.fill(base); for (let x = 0; x < W; x += 8) P.dither(x, 0, 2, H, pat, 0.5); for (let y = 6; y < H; y += 16) for (let x = 4; x < W; x += 8) { P.px(x, y, pat); P.px(x + 1, y + 1, pat); P.px(x - 1, y + 1, pat); }
});
export const water = (base = '#3a7ab0') => ptex('water' + base, 4, 4, (g, W, H, r, P) => {
  P.fill(base); P.dither(0, 0, W, H, dark(base, 0.15), 0.3);
  for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, w = 3 + r() * 8; P.hline(x, y, w, light(base, 0.35)); P.hline(x + 2, y + 1, w - 3, light(base, 0.15)); }
});
export const concrete = (base = '#b0aca4') => ptex('concrete' + base, 2, 2, (g, W, H, r, P) => { P.fill(base); P.speck(300, light(base, 0.08), r); P.speck(300, dark(base, 0.1), r); P.hline(0, 0, W, dark(base, 0.25)); P.vline(0, 0, H, dark(base, 0.25)); });

// ---------------------------------------------------------------- facade pieces (one texture per window / door / sign)
/** a sash window, 1 × 1.4 m: frame, sill shadow, glass with a sky reflection, curtains; lit: warm glow */
export const windowTex = (frame = '#f2ead8', curtain = '#d87a6a', lit = false) => ptex('win' + frame + curtain + lit, 1, 1.4, (g, W, H, r, P) => {
  P.fill(frame); P.rect(0, 0, W, 2, light(frame, 0.2)); P.rect(0, H - 3, W, 3, dark(frame, 0.3));
  const gx = 3, gy = 3, gw = W - 6, gh = H - 7, glass = lit ? '#ffd890' : '#4a6a8a';
  P.rect(gx, gy, gw, gh, glass);
  if (!lit) { P.dither(gx, gy, gw, gh, '#8ab0d0', (x, y) => Math.max(0, 0.8 - (y - gy) / gh * 1.3 + ((x + y) % 11 < 2 ? 0.5 : 0))); }
  else { P.dither(gx, gy, gw, gh, '#fff0c0', (x, y) => 0.4 - Math.abs((x - W / 2) / W)); }
  // curtains gathered at the sides
  const cw = Math.round(gw * 0.22);
  P.rect(gx, gy, cw, gh, curtain); P.rect(gx + gw - cw, gy, cw, gh, curtain);
  for (let x = gx + 2; x < gx + cw; x += 3) P.vline(x, gy, gh, dark(curtain, 0.2));
  for (let x = gx + gw - cw + 1; x < gx + gw; x += 3) P.vline(x, gy, gh, dark(curtain, 0.2));
  // muntins: two sashes
  P.rect(gx, gy + Math.floor(gh / 2) - 1, gw, 2, frame); P.vline(gx + Math.floor(gw / 2), gy, gh, frame);
  P.rect(gx, gy, gw, 1, dark(glass, 0.3));
}, { ppm: 32 });
/** shop window: big glass, goods silhouettes, lit at night */
export const shopWindowTex = (frame = '#2a2a34', lit = false, seed = 1) => ptex('shopwin' + frame + lit + seed, 2, 1.8, (g, W, H, r, P) => {
  P.fill(frame); const glass = lit ? '#ffe0a0' : '#3a5a78'; P.rect(2, 2, W - 4, H - 4, glass);
  if (!lit) P.dither(2, 2, W - 4, H - 4, '#7aa0c0', (x, y) => ((x + y * 0.6) % 26 < 6 ? 0.6 : 0.08));
  const goods = ['#e85a4a', '#f0c840', '#5ab06a', '#4a8ad8', '#e890b0', '#f4f0ea'];
  for (let i = 0; i < 9; i++) { const x = 6 + Math.floor(r() * (W - 18)), h = 6 + Math.floor(r() * 14), w = 4 + Math.floor(r() * 8); P.block(x, H - 4 - h, w, h, goods[i % goods.length]); }
  P.rect(2, H - 6, W - 4, 2, dark(frame, 0.2)); P.vline(Math.floor(W / 2), 2, H - 4, frame);
});
export const doorTex = (col = '#7a3a2a', kind = 'panel') => ptex('door' + col + kind, 1, 2.2, (g, W, H, r, P) => {
  P.fill(col); P.rect(0, 0, W, 2, dark(col, 0.4)); P.vline(0, 0, H, dark(col, 0.4)); P.vline(W - 1, 0, H, dark(col, 0.4));
  if (kind === 'glass') { P.rect(4, 4, W - 8, H - 20, '#5a7a9a'); P.dither(4, 4, W - 8, H - 20, '#a8c8e0', (x, y) => ((x + y) % 13 < 3 ? 0.7 : 0.1)); P.rect(4, H - 14, W - 8, 10, dark(col, 0.15)); }
  else { for (const [y, h] of [[5, 26], [36, 30]]) { P.block(5, y, W - 10, h, light(col, 0.06), { hk: 0.15, lk: 0.3 }); } P.rect(5, 6, W - 10, 1, dark(col, 0.3)); }
  P.rect(W - 7, Math.floor(H * 0.5), 3, 3, '#e8c060'); P.px(W - 7, Math.floor(H * 0.5), '#fff4c0');
});
export const garageTex = (col = '#c8c4bc') => ptex('garage' + col, 2.6, 2.2, (g, W, H, r, P) => { P.fill(col); for (let y = 0; y < H; y += 7) { P.hline(0, y, W, dark(col, 0.25)); P.hline(0, y + 1, W, light(col, 0.15)); } P.speck(40, dark(col, 0.2), r); });
/** a shop sign board with pixel lettering */
export function signTex(text, bg = '#c83a3a', fg = '#ffe8a0', o = {}) {
  const w = o.w || Math.max(2, text.length * 0.42 + 0.6), h = o.h || 0.7;
  return ptex('sign' + text + bg + fg + w + h, w, h, (g, W, H, r, P) => {
    P.fill(bg); P.rect(0, 0, W, 1, light(bg, 0.3)); P.rect(0, H - 1, W, 1, dark(bg, 0.4)); P.rect(1, 1, W - 2, 1, dark(bg, 0.15));
    for (let x = 3; x < W - 3; x += Math.max(4, Math.floor(W / 14))) { P.px(x, 2, light(bg, 0.25)); P.px(x, H - 3, dark(bg, 0.25)); }
    P.text(text, W / 2, H / 2 + 1, Math.round(H * (o.fs || 0.6)), fg, { shadow: dark(bg, 0.5), font: o.font });
  }, { ppm: o.ppm || 48 });
}
export const awningTex = (a = '#c83a3a', b = '#f4ece0') => ptex('awning' + a + b, 2, 1, (g, W, H, r, P) => {
  for (let x = 0; x < W; x += 8) { P.rect(x, 0, 4, H, a); P.rect(x + 4, 0, 4, H, b); }
  P.dither(0, 0, W, H, '#000000', (x, y) => y / H * 0.25);
  for (let x = 0; x < W; x += 8) { P.rect(x, H - 3, 4, 3, dark(a, 0.15)); }
});
export const solid = (c) => ptex('solid' + c, 1, 1, (g, W, H, r, P) => { P.fill(c); P.speck(12, light(c, 0.08), r); P.speck(12, dark(c, 0.08), r); }, { ppm: 8 });
export const stripes = (a, b, n = 4) => ptex('stripes' + a + b + n, 1, 1, (g, W, H, r, P) => { for (let y = 0; y < H; y += H / n) { P.rect(0, y, W, H / n / 2, a); P.rect(0, y + H / n / 2, W, H / n / 2, b); } });
/** road markings: dashed centre line, zebra crossing */
export const dashTex = () => ptex('dash', 3, 0.15, (g, W, H, r, P) => { P.rect(0, 0, W * 0.55, H, '#f0e8c8'); P.speck(10, '#c8c0a0', r, 0, 0, W * 0.55, H); }, { ppm: 32 });
export const zebraTex = () => ptex('zebra', 1, 1, (g, W, H, r, P) => { P.fill('#4a4a54'); P.rect(0, 0, W / 2, H, '#f0ece0'); P.speck(30, '#c8c4b8', r, 0, 0, W / 2, H); P.speck(40, '#3a3a44', r, W / 2, 0, W / 2, H); });
