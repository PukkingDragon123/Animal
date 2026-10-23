// The low-poly world kit: PS2 / Dreamcast-era anime sets built from faceted meshes
// with hand-painted Canvas2D textures (smooth filtered, mipmapped, never pixel art).
// - colour + tileable noise helpers and paint helpers (folds, speckle, wrap-around drawing)
// - texture painters at a steady texel density (PPM texels per metre): wood planks and
//   grain, painted plaster, wallpaper, tiles, linoleum, brick, fabric with folds, a
//   patchwork quilt, wicker, rope, brushed metal, enamel / plastic, paper, cork, and a
//   wall-strip composer (skirting, wainscot, dado / picture rails, paper, tiles, crown)
//   with the corner shading baked in. Every texture knows its size in metres.
// - primitives in metres with metric UVs (the Batch divides by the texture's size, so
//   every surface keeps the same texel density): chamfered box, rounded slab, sweep /
//   lathe / cylinder / prism, superellipsoid (cushions, plush, sacks), extrude from a 2D
//   shape, plane, tube along a path, a draped cloth sheet
// - Batch: collects parts by material and merges them into one mesh per material; vertex
//   colours carry per-part tints and baked bottom shading (ambient occlusion). Soft blob
//   shadows and contact strips are batched the same way.
// Materials are MeshLambertMaterial + map: the stage swaps them for toon materials and
// draws ink outlines in post (userData.keep opts out of the toon swap).
import * as THREE from '../../../vendor/three.module.js';

export const TAU = Math.PI * 2;
export const PPM = 256;                                   // default texels per metre
export const cl = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- colour
export const hx = (c) => { const n = parseInt(c.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(cl(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export function tone(c, k) { const [r, g, b] = hx(c); return k >= 0 ? toHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k) : toHex(r * (1 + k), g * (1 + k), b * (1 + k)); }
export function mixc(a, b, t) { const A = hx(a), B = hx(b); return toHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
export const rgba = (c, a) => { const [r, g, b] = hx(c); return `rgba(${r},${g},${b},${a})`; };
export const shade = (c, k = 0.3) => mixc(tone(c, -k), '#4a2050', 0.14);        // painted shadow: darker, cooler
export const lite = (c, k = 0.25) => mixc(tone(c, k), '#fff4dc', 0.1);          // painted light: lighter, warmer
export const rnd = (seed) => { let x = (seed >>> 0) || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };
export const hashStr = (s) => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
export function jitter(c, r, k = 0.06) { const t = (r() - 0.5) * 2 * k; return t >= 0 ? tone(c, t) : tone(c, t); }

// ---------------------------------------------------------------- tileable noise
const h2 = (x, y, s) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2246822519)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const wrapI = (a, p) => ((a % p) + p) % p;
// value noise on a lattice that repeats every px × py cells
export function vnoise(x, y, px, py, seed = 1) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const x0 = wrapI(xi, px), x1 = wrapI(xi + 1, px), y0 = wrapI(yi, py), y1 = wrapI(yi + 1, py);
  return lerp(lerp(h2(x0, y0, seed), h2(x1, y0, seed), u), lerp(h2(x0, y1, seed), h2(x1, y1, seed), u), v);
}
export function fbm(x, y, px, py, seed = 1, oct = 4) {
  let s = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f, px * f, py * f, seed + i * 17); n += a; a *= 0.5; f *= 2; }
  return s / n;
}

// ---------------------------------------------------------------- paint helpers
export function canvas(W, H) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(W)); c.height = Math.max(1, Math.round(H)); return c; }
export const vgrad = (g, y0, y1, stops) => { const gr = g.createLinearGradient(0, y0, 0, y1); for (const [t, c] of stops) gr.addColorStop(t, c); return gr; };
export const hgrad = (g, x0, x1, stops) => { const gr = g.createLinearGradient(x0, 0, x1, 0); for (const [t, c] of stops) gr.addColorStop(t, c); return gr; };
export function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
// call fn(x', y') at (x, y) and at its wrapped copies when the feature (radius r) crosses the canvas edge
export function wrapAt(W, H, x, y, r, fn) {
  for (const dx of [0, -W, W]) for (const dy of [0, -H, H]) {
    if (dx && (x + dx < -r || x + dx > W + r)) continue; if (dy && (y + dy < -r || y + dy > H + r)) continue;
    fn(x + dx, y + dy);
  }
}
// soft painterly speckle
export function speckle(g, W, H, seed, n = 300, a = 0.05, x0 = 0, y0 = 0) { const r = rnd(seed); for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(30,10,40,${a})`; g.fillRect(x0 + r() * W, y0 + r() * H, 1 + r() * 2, 1 + r() * 2); } }
// a soft fold stroke
export function fold(g, x0, y0, x1, y1, cx, cy, w, c, a = 0.35) { g.strokeStyle = rgba(c, a); g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke(); }
// multiply the pixels of a region by fn(x, y) → k (k > 1 lightens); or [kr, kg, kb]
export function modulate(g, x0, y0, W, H, fn) {
  x0 = Math.round(x0); y0 = Math.round(y0); W = Math.round(W); H = Math.round(H); if (W < 1 || H < 1) return;
  const im = g.getImageData(x0, y0, W, H), d = im.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = fn(x, y), i = (y * W + x) * 4;
    if (typeof k === 'number') { d[i] = d[i] * k; d[i + 1] = d[i + 1] * k; d[i + 2] = d[i + 2] * k; } else { d[i] *= k[0]; d[i + 1] *= k[1]; d[i + 2] *= k[2]; }
  }
  g.putImageData(im, x0, y0);
}
// soft tileable mottling of a region (cells = noise cells across the region)
export function mottle(g, x0, y0, W, H, o = {}) {
  const amp = o.amp ?? 0.08, cx = Math.max(1, Math.round(o.cells?.[0] ?? 4)), cy = Math.max(1, Math.round(o.cells?.[1] ?? 4)), s = o.seed || 3, oct = o.oct || 4;
  modulate(g, x0, y0, W, H, (x, y) => 1 + amp * (fbm((x / W) * cx, (y / H) * cy, cx, cy, s, oct) - 0.5) * 2);
}
export const FONT = { sans: '"Noto Sans TC", "Helvetica Neue", Arial, sans-serif', serif: '"Noto Serif TC", Georgia, serif', display: '"Bebas Neue", "Oswald", Impact, sans-serif', round: '"Trebuchet MS", "Noto Sans TC", sans-serif' };
export function text(g, str, x, y, size, fill, o = {}) {
  g.save(); g.font = `${o.weight || 700} ${size}px ${FONT[o.font || 'sans'] || o.font}`; g.textAlign = o.align || 'center'; g.textBaseline = o.base || 'middle';
  if (o.rot) { g.translate(x, y); g.rotate(o.rot); x = 0; y = 0; }
  if (o.shadow) { g.fillStyle = o.shadow; g.fillText(str, x + size * 0.05, y + size * 0.06); }
  if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.sw || size * 0.14; g.strokeStyle = o.stroke; g.strokeText(str, x, y); }
  g.fillStyle = fill; g.fillText(str, x, y); g.restore();
}
// scribbled text lines (unreadable small print)
export function scribble(g, x, y, w, h, c, seed = 1, o = {}) {
  const r = rnd(seed), lh = o.lh || 6; g.fillStyle = c;
  for (let yy = y; yy < y + h - lh * 0.4; yy += lh) { let xx = x; const end = x + w * (o.ragged === false ? 1 : 0.7 + r() * 0.3); while (xx < end) { const ww = Math.min(end - xx, 4 + r() * (o.word || 18)); g.fillRect(xx, yy, ww, Math.max(1, lh * 0.38)); xx += ww + 2 + r() * 3; } }
}

// ---------------------------------------------------------------- textures
const TEX = new Map();
// a cached CanvasTexture of size[0] × size[1] metres at ppm texels per metre, painted by fn(g, W, H, ppm)
export function texture(key, size, ppm, fn, o = {}) {
  if (TEX.has(key)) return TEX.get(key);
  let W = Math.round(size[0] * ppm), H = Math.round(size[1] * ppm); const k = Math.min(1, 2048 / Math.max(W, H)); W = Math.max(2, Math.round(W * k)); H = Math.max(2, Math.round(H * k));
  const c = canvas(W, H), g = c.getContext('2d', { willReadFrequently: !!o.read });
  fn(g, W, H, ppm * k);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.userData.size = size.slice(); t.userData.canvas = c;
  TEX.set(key, t); return t;
}
// a print (a texture mapped once over a fit-UV surface): w × h metres at ppm
export function print(key, w, h, fn, ppm = 512) { return texture('print:' + key, [w, h], ppm, fn); }

// ---- wood: grain inside a rect (runs along x). r: rng
export function grain(g, x0, y0, w, h, c, r, o = {}) {
  const dark = shade(c, o.dk ?? 0.34), light = lite(c, 0.22);
  g.fillStyle = c; g.fillRect(x0, y0, w, h);
  for (let i = 0; i < 7; i++) { const y = y0 + r() * h, hh = h * (0.08 + r() * 0.3); g.fillStyle = vgrad(g, y - hh, y + hh, [[0, rgba(c, 0)], [0.5, rgba(r() < 0.55 ? dark : light, 0.12 + r() * 0.1)], [1, rgba(c, 0)]]); g.fillRect(x0, y - hh, w, hh * 2); }
  const n = Math.max(3, Math.round(h / (o.fine || 4.5)));
  for (let i = 0; i < n; i++) {
    const yb = y0 + ((i + r()) / n) * h, amp = (0.4 + r() * 1.8) * Math.max(1, h / 60), k1 = 1 + Math.floor(r() * 2), ph = r() * TAU, ph2 = r() * TAU;
    g.strokeStyle = rgba(r() < 0.82 ? dark : light, 0.08 + r() * 0.2); g.lineWidth = 0.5 + r() * 1.3; g.beginPath();
    for (let x = 0; x <= w + 4; x += 4) { const t = x / w, y = yb + Math.sin(t * TAU * k1 + ph) * amp + Math.sin(t * TAU * (k1 * 4 + 1) + ph2) * amp * 0.3; if (x) g.lineTo(x0 + x, y); else g.moveTo(x0 + x, y); }
    g.stroke();
  }
  const nf = o.figure ?? Math.max(1, Math.round(w / Math.max(40, h * 3)));
  for (let f = 0; f < nf; f++) {                                          // cathedral figure (flat-sawn heartwood)
    const cx = x0 + r() * w, cy = y0 + h * (0.3 + r() * 0.4), dir = r() < 0.5 ? 1 : -1, L = Math.min(w * 0.4, h * (2 + r() * 3)), H2 = h * (0.16 + r() * 0.14);
    for (let q = 0; q < 6; q++) { const s = 1 - q * 0.15; g.strokeStyle = rgba(dark, 0.12 + (q % 2) * 0.07); g.lineWidth = 0.8 + r() * 1.2; g.beginPath(); g.ellipse(cx, cy, L * s, H2 * s, 0, dir > 0 ? -Math.PI / 2 : Math.PI / 2, dir > 0 ? Math.PI / 2 : Math.PI * 1.5); g.stroke(); }
  }
  if (o.knots !== false && r() < (o.knotP ?? 0.3)) {
    const kx = x0 + r() * w, ky = y0 + h * (0.3 + r() * 0.4), kr = Math.max(2, Math.min(h * 0.16, 4 + r() * 7));
    for (let q = 4; q >= 1; q--) { g.strokeStyle = rgba(dark, 0.18); g.lineWidth = 1; g.beginPath(); g.ellipse(kx, ky, kr * (1 + q * 0.9), kr * (0.6 + q * 0.4), 0, 0, TAU); g.stroke(); }
    const gr = g.createRadialGradient(kx, ky, 0, kx, ky, kr); gr.addColorStop(0, shade(c, 0.6)); gr.addColorStop(1, rgba(dark, 0)); g.fillStyle = gr; g.beginPath(); g.ellipse(kx, ky, kr * 1.4, kr, 0, 0, TAU); g.fill();
  }
  for (let i = 0; i < (w * h) / 110; i++) { g.fillStyle = rgba(dark, 0.1 + r() * 0.08); g.fillRect(x0 + r() * w, y0 + r() * h, 2 + r() * 6, 0.8); }
}
// wood planks along u. o: { c, w: plank width m, len: [min, max] m, seam, wear, var, size, seed, gloss }
function paintPlanks(g, W, H, o, ppm) {
  const r = rnd(o.seed || 7), rows = Math.max(1, Math.round(H / ((o.w || 0.14) * ppm))), rh = H / rows, len = o.len || [0.8, 1.6], avg = (len[0] + len[1]) / 2;
  const seam = o.seam || shade(o.c, 0.55);
  for (let j = 0; j < rows; j++) {
    const y0 = j * rh, k = Math.max(1, Math.round(W / (avg * ppm))), off = r() * W, joints = [];
    for (let i = 0; i < k; i++) joints.push((off + (i + (r() - 0.5) * 0.5) * (W / k)) % W);
    joints.sort((a, b) => a - b);
    for (let i = 0; i < k; i++) {
      const a = joints[i], b = i + 1 < k ? joints[i + 1] : joints[0] + W, col = jitter(o.c, r, o.var ?? 0.07), sub = rnd(Math.floor(r() * 1e9));
      for (const sh of [0, -W]) { if (a + sh > W || b + sh < 0) continue; g.save(); g.beginPath(); g.rect(a + sh, y0, b - a, rh); g.clip(); grain(g, a + sh, y0, b - a, rh, col, rnd(Math.floor(sub() * 1e9) + 1), { fine: o.fine, knotP: 0.25 }); g.restore(); }
      for (const x of [a, a - W, a + W]) { if (x < -4 || x > W + 4) continue; g.fillStyle = rgba(seam, 0.85); g.fillRect(x - 1, y0, 2, rh); g.fillStyle = rgba(lite(o.c, 0.3), 0.35); g.fillRect(x + 1, y0, 1, rh); }
    }
    // bevelled board edges: light top edge, dark bottom seam
    g.fillStyle = vgrad(g, y0, y0 + rh, [[0, 'rgba(255,240,220,0.14)'], [0.12, 'rgba(255,240,220,0)'], [0.85, 'rgba(40,20,30,0)'], [1, 'rgba(40,20,30,0.2)']]); g.fillRect(0, y0, W, rh);
    g.fillStyle = rgba(seam, 0.9); g.fillRect(0, y0, W, Math.max(1.5, ppm / 140));
  }
  if (o.wear) mottle(g, 0, 0, W, H, { amp: 0.06 * o.wear, cells: [W / ppm * 2, H / ppm * 2], seed: (o.seed || 7) + 3 });
  if (o.gloss !== false) for (let i = 0; i < 5; i++) { const x = r() * W, ww = W * (0.05 + r() * 0.1); wrapAt(W, H, x, 0, ww, (xx) => { g.fillStyle = hgrad(g, xx - ww, xx + ww, [[0, 'rgba(255,248,230,0)'], [0.5, 'rgba(255,248,230,0.07)'], [1, 'rgba(255,248,230,0)']]); g.fillRect(xx - ww, 0, ww * 2, H); }); }
  speckle(g, W, H, (o.seed || 7) + 9, (W * H) / 260, 0.035);
}
// solid wood (furniture) with periodic grain along u
function paintWood(g, W, H, o, ppm) {
  const r = rnd(o.seed || 5);
  const bands = Math.max(1, Math.round(H / ((o.band || 0.25) * ppm)));
  for (let j = 0; j < bands; j++) {
    const y0 = (j / bands) * H, h = H / bands, col = jitter(o.c, r, o.var ?? 0.04);
    grain(g, 0, y0, W, h + 1, col, r, { fine: o.fine || 4, figure: o.figure ?? 2, knotP: o.knotP ?? 0.25 });
  }
  // blend the band edges
  for (let j = 1; j < bands; j++) { const y = (j / bands) * H; g.fillStyle = vgrad(g, y - 6, y + 6, [[0, rgba(o.c, 0)], [0.5, rgba(o.c, 0.5)], [1, rgba(o.c, 0)]]); g.fillRect(0, y - 6, W, 12); }
  if (o.lacquer) { g.fillStyle = rgba(o.lacquer, 0.25); g.fillRect(0, 0, W, H); }
  speckle(g, W, H, (o.seed || 5) + 4, (W * H) / 300, 0.03);
}
// painted plaster
function paintPlaster(g, W, H, o, ppm, x0 = 0, y0 = 0) {
  const r = rnd(o.seed || 11), c = o.c;
  g.fillStyle = c; g.fillRect(x0, y0, W, H);
  mottle(g, x0, y0, W, H, { amp: o.amp ?? 0.06, cells: [Math.max(1, W / ppm * 3), Math.max(1, H / ppm * 3)], seed: o.seed || 11 });
  for (let i = 0; i < (W * H) / 2500; i++) {
    const x = x0 + r() * W, y = y0 + r() * H, rad = (0.06 + r() * 0.18) * ppm, a0 = r() * TAU, col = r() < 0.5 ? lite(c, 0.35) : shade(c, 0.2), lw = 3 + r() * 10;
    g.strokeStyle = rgba(col, 0.04 + r() * 0.03); g.lineWidth = lw; g.beginPath(); g.arc(x, y, rad, a0, a0 + 0.5 + r() * 0.8); g.stroke();
  }
  speckle(g, W, H, (o.seed || 11) + 5, (W * H) / 220, 0.03, x0, y0);
}
// wallpaper patterns inside a rect; period-aligned to the rect so a full-width strip tiles
function paintPaper(g, x0, y0, W, H, o, ppm) {
  const c = o.c, c2 = o.c2 || shade(c, 0.12), c3 = o.c3 || lite(c, 0.4), rep = (o.rep || 0.25) * ppm, kind = o.pattern || (o.kind !== 'paper' && o.kind) || 'stripe', r = rnd(o.seed || 21);
  g.save(); g.beginPath(); g.rect(x0, y0, W, H); g.clip();
  g.fillStyle = c; g.fillRect(x0, y0, W, H);
  const nx = Math.max(1, Math.round(W / rep)), step = W / nx;
  if (kind === 'stripe') {
    for (let i = 0; i < nx; i++) {
      const x = x0 + i * step; g.fillStyle = rgba(c2, 0.55); g.fillRect(x, y0, step * 0.42, H);
      g.fillStyle = rgba(c3, 0.5); g.fillRect(x + step * 0.42, y0, Math.max(1, step * 0.03), H); g.fillRect(x + step * 0.5, y0, Math.max(1, step * 0.03), H);
      for (let y = y0 + step * 0.35; y < y0 + H; y += step * 0.8) { const cx = x + step * 0.71, cy = y + ((i % 2) * step * 0.4); flower(g, cx, cy, step * 0.08, c3, 0.55); }
    }
  } else if (kind === 'damask') {
    for (let i = 0; i < nx; i++) for (let j = 0, y = y0; y < y0 + H + step; j++, y += step) {
      const cx = x0 + i * step + (j % 2 ? step / 2 : 0), cy = y; for (const dx of [0, -W]) motif(g, cx + dx, cy, step * 0.4, c2, c3);
    }
  } else if (kind === 'dots') {
    for (let i = 0; i < nx * 2; i++) for (let y = y0, j = 0; y < y0 + H + step; y += step / 2, j++) { g.fillStyle = rgba(c3, 0.6); g.beginPath(); g.arc(x0 + (i + (j % 2) * 0.5) * step / 2, y, step * 0.05, 0, TAU); g.fill(); }
  } else if (kind === 'check') {
    for (let i = 0; i < nx * 2; i++) for (let y = y0, j = 0; y < y0 + H; y += step / 2, j++) if ((i + j) % 2) { g.fillStyle = rgba(c2, 0.35); g.fillRect(x0 + i * step / 2, y, step / 2, step / 2); }
  }
  // aged paper: soft mottling, a faint vertical seam every roll width
  g.restore();
  mottle(g, x0, y0, W, H, { amp: 0.05, cells: [Math.max(1, W / ppm * 2), Math.max(1, H / ppm * 2)], seed: (o.seed || 21) + 2 });
  const roll = Math.max(1, Math.round(W / (0.5 * ppm))); for (let i = 0; i < roll; i++) { g.fillStyle = 'rgba(40,20,40,0.06)'; g.fillRect(x0 + (i * W) / roll, y0, 1, H); }
  speckle(g, W, H, (o.seed || 21) + 7, (W * H) / 400, 0.03, x0, y0); void r;
}
function flower(g, cx, cy, s, c, a) { g.fillStyle = rgba(c, a); for (let k = 0; k < 5; k++) { const an = (k / 5) * TAU; g.beginPath(); g.ellipse(cx + Math.cos(an) * s, cy + Math.sin(an) * s, s * 0.75, s * 0.5, an, 0, TAU); g.fill(); } g.fillStyle = rgba('#f8e8a0', a); g.beginPath(); g.arc(cx, cy, s * 0.45, 0, TAU); g.fill(); }
function motif(g, cx, cy, s, c2, c3) {
  g.save(); g.translate(cx, cy); g.fillStyle = rgba(c2, 0.45); g.strokeStyle = rgba(c3, 0.35); g.lineWidth = Math.max(1, s * 0.04);
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(0, -s); g.bezierCurveTo(sx * s * 0.9, -s * 0.6, sx * s * 0.2, -s * 0.1, sx * s * 0.7, s * 0.3); g.bezierCurveTo(sx * s * 0.4, s * 0.9, sx * s * 0.1, s * 0.4, 0, s); g.closePath(); g.fill(); g.stroke(); }
  g.beginPath(); g.ellipse(0, 0, s * 0.18, s * 0.4, 0, 0, TAU); g.fillStyle = rgba(c3, 0.4); g.fill(); g.restore();
}
// glazed tiles in a rect. o: { c, c2 (variation), grout, s: tile m, accentRow: colour, motif, seed }
function paintTiles(g, x0, y0, W, H, o, ppm) {
  const s = (o.s || 0.15) * ppm, nx = Math.max(1, Math.round(W / s)), sw = W / nx, ny = Math.max(1, Math.round(H / s)), sh = H / ny, r = rnd(o.seed || 31), gr = o.grout || '#d8d4c8', gw = Math.max(1.5, ppm / 120);
  g.fillStyle = gr; g.fillRect(x0, y0, W, H);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = x0 + i * sw, y = y0 + j * sh, acc = o.accentRows && o.accentRows.includes(ny - 1 - j), base = acc ? o.accent : (r() < 0.25 && o.c2 ? o.c2 : o.c), col = jitter(base, r, 0.03);
    g.fillStyle = col; rr(g, x + gw / 2, y + gw / 2, sw - gw, sh - gw, gw); g.fill();
    g.fillStyle = vgrad(g, y, y + sh, [[0, 'rgba(255,255,255,0.16)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(30,20,40,0.12)']]); g.fill();
    // glaze highlight and a soft edge pool
    g.strokeStyle = 'rgba(255,255,255,0.32)'; g.lineWidth = Math.max(1, sw * 0.05); g.beginPath(); g.moveTo(x + sw * 0.18, y + sh * 0.2); g.lineTo(x + sw * 0.45, y + sh * 0.14); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.ellipse(x + sw * 0.3, y + sh * 0.28, sw * 0.18, sh * 0.08, -0.3, 0, TAU); g.fill();
    if (acc && o.motif) { g.save(); g.translate(x + sw / 2, y + sh / 2); g.strokeStyle = rgba(o.motif, 0.85); g.fillStyle = rgba(o.motif, 0.85); g.lineWidth = Math.max(1, sw * 0.05); for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.ellipse(0, -sw * 0.2, sw * 0.07, sw * 0.16, 0, 0, TAU); g.fill(); } g.beginPath(); g.arc(0, 0, sw * 0.07, 0, TAU); g.fillStyle = '#f8f0d8'; g.fill(); g.restore(); }
    if (r() < 0.04) { g.strokeStyle = 'rgba(60,50,60,0.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + r() * sw, y); g.lineTo(x + r() * sw, y + sh * (0.4 + r() * 0.6)); g.stroke(); }
  }
  g.fillStyle = 'rgba(40,30,40,0.12)'; for (let i = 0; i <= nx; i++) g.fillRect(x0 + i * sw - gw / 2, y0, gw * 0.6, H);
}
function paintBrick(g, W, H, o, ppm) {
  const bh = (o.bh || 0.075) * ppm, bl = (o.bl || 0.23) * ppm, rows = Math.max(1, Math.round(H / bh)), rh = H / rows, per = Math.max(1, Math.round(W / bl)), bw = W / per, r = rnd(o.seed || 41), mw = Math.max(1.5, ppm / 70);
  g.fillStyle = o.mortar || '#a89a88'; g.fillRect(0, 0, W, H); speckle(g, W, H, 3, (W * H) / 80, 0.08);
  for (let j = 0; j < rows; j++) for (let i = -1; i < per; i++) {
    const x = i * bw + (j % 2 ? bw / 2 : 0), y = j * rh, col = jitter(o.cols[Math.floor(r() * o.cols.length)], r, 0.05);
    for (const dx of [0, W]) {
      const xx = x + dx; if (xx > W || xx + bw < 0) continue;
      g.fillStyle = col; rr(g, xx + mw / 2, y + mw / 2, bw - mw, rh - mw, mw * 0.6); g.fill();
      g.fillStyle = vgrad(g, y, y + rh, [[0, 'rgba(255,230,210,0.14)'], [0.3, 'rgba(255,230,210,0)'], [1, 'rgba(30,10,10,0.22)']]); g.fill();
    }
    for (let k = 0; k < 3; k++) { g.fillStyle = r() < 0.5 ? 'rgba(255,220,200,0.1)' : 'rgba(40,10,10,0.14)'; g.beginPath(); g.arc(((x + r() * bw) % W + W) % W, y + r() * rh, 1 + r() * 3, 0, TAU); g.fill(); }
  }
  g.fillStyle = 'rgba(20,10,10,0.18)'; for (let j = 0; j < rows; j++) g.fillRect(0, j * rh + rh - mw, W, mw * 0.6);
  mottle(g, 0, 0, W, H, { amp: 0.1, cells: [W / ppm * 1.5, H / ppm * 1.5], seed: 9 });
}
function paintChecker(g, W, H, o, ppm) {
  const s = (o.s || 0.25) * ppm, nx = Math.max(1, Math.round(W / s)), ny = Math.max(1, Math.round(H / s)), sw = W / nx, sh = H / ny, r = rnd(o.seed || 51);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { g.fillStyle = jitter((i + j) % 2 ? o.a : o.b, r, 0.02); g.fillRect(i * sw, j * sh, sw + 0.5, sh + 0.5); }
  g.fillStyle = 'rgba(40,30,40,0.12)'; for (let i = 0; i <= nx; i++) g.fillRect(i * sw - 0.5, 0, 1, H); for (let j = 0; j <= ny; j++) g.fillRect(0, j * sh - 0.5, W, 1);
  mottle(g, 0, 0, W, H, { amp: 0.07, cells: [W / ppm * 2, H / ppm * 2], seed: (o.seed || 51) + 1 });
  for (let i = 0; i < (W * H) / 3000; i++) { const x = r() * W, y = r() * H, L = 10 + r() * 50, a = r() * TAU; g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(40,30,40,0.08)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  speckle(g, W, H, 4, (W * H) / 150, 0.05);
}
// fabric. o: { c, c2, c3, kind: plain|plaid|stripe|dots|stars|check|floral|knit|ticking, rep (m), folds (count), weave }
function paintFabric(g, W, H, o, ppm) {
  const c = o.c, c2 = o.c2 || shade(c, 0.3), c3 = o.c3 || lite(c, 0.45), rep = (o.rep || 0.12) * ppm, r = rnd(o.seed || 61), kind = o.kind || 'plain';
  g.fillStyle = c; g.fillRect(0, 0, W, H);
  const nx = Math.max(1, Math.round(W / rep)), ny = Math.max(1, Math.round(H / rep)), sx = W / nx, sy = H / ny;
  if (kind === 'plaid' || kind === 'check') {
    for (let i = 0; i < nx; i++) { g.fillStyle = rgba(c2, 0.45); g.fillRect(i * sx, 0, sx * 0.34, H); if (kind === 'plaid') { g.fillStyle = rgba(c3, 0.5); g.fillRect(i * sx + sx * 0.6, 0, Math.max(1, sx * 0.06), H); } }
    for (let j = 0; j < ny; j++) { g.fillStyle = rgba(c2, 0.45); g.fillRect(0, j * sy, W, sy * 0.34); if (kind === 'plaid') { g.fillStyle = rgba(c3, 0.5); g.fillRect(0, j * sy + sy * 0.6, W, Math.max(1, sy * 0.06)); } }
  } else if (kind === 'stripe' || kind === 'ticking') {
    for (let j = 0; j < ny; j++) { g.fillStyle = rgba(c2, kind === 'ticking' ? 0.7 : 0.85); g.fillRect(0, j * sy + sy * 0.1, W, sy * (kind === 'ticking' ? 0.12 : 0.42)); if (kind === 'ticking') g.fillRect(0, j * sy + sy * 0.3, W, sy * 0.05); }
  } else if (kind === 'vstripe') {
    for (let i = 0; i < nx; i++) { g.fillStyle = rgba(c2, 0.85); g.fillRect(i * sx + sx * 0.1, 0, sx * 0.4, H); }
  } else if (kind === 'dots' || kind === 'stars' || kind === 'floral') {
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x = (i + (j % 2) * 0.5) * sx, y = (j + 0.5) * sy;
      wrapAt(W, H, x, y, sx, (xx, yy) => {
        if (kind === 'dots') { g.fillStyle = c3; g.beginPath(); g.arc(xx, yy, sx * 0.16, 0, TAU); g.fill(); }
        else if (kind === 'stars') star(g, xx, yy, sx * 0.22, c3, (i * 7 + j) * 0.4);
        else flower(g, xx, yy, sx * 0.13, (i + j) % 3 === 0 ? c2 : c3, 0.85);
      });
    }
  }
  // weave
  if (o.weave !== false) { g.fillStyle = 'rgba(255,255,255,0.05)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1); g.fillStyle = 'rgba(30,10,40,0.05)'; for (let x = 0; x < W; x += 3) g.fillRect(x, 0, 1, H); }
  if (kind === 'knit') { g.strokeStyle = rgba(c2, 0.35); g.lineWidth = 1.2; const k = Math.max(4, ppm * 0.012); for (let y = 0; y < H; y += k) for (let x = 0; x < W; x += k) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + k / 2, y + k); g.lineTo(x + k, y); g.stroke(); } }
  mottle(g, 0, 0, W, H, { amp: 0.06, cells: [Math.max(1, W / ppm * 3), Math.max(1, H / ppm * 3)], seed: (o.seed || 61) + 3 });
  // folds: soft paired dark/light strokes, wrapped
  for (let i = 0; i < (o.folds ?? Math.round((W * H) / (ppm * ppm) * 10)); i++) {
    const x = r() * W, y = r() * H, L = (0.08 + r() * 0.22) * ppm, a = (o.foldA ?? r() * TAU) + (r() - 0.5) * 0.6, bend = (r() - 0.5) * L * 0.5, w = (0.008 + r() * 0.018) * ppm;
    wrapAt(W, H, x, y, L, (xx, yy) => {
      const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, nx2 = -Math.sin(a), ny2 = Math.cos(a);
      fold(g, xx - dx, yy - dy, xx + dx, yy + dy, xx + nx2 * bend, yy + ny2 * bend, w, shade(c, 0.45), 0.22);
      fold(g, xx - dx + nx2 * w, yy - dy + ny2 * w, xx + dx + nx2 * w, yy + dy + ny2 * w, xx + nx2 * (bend + w), yy + ny2 * (bend + w), w * 0.6, lite(c, 0.4), 0.18);
    });
  }
  speckle(g, W, H, (o.seed || 61) + 9, (W * H) / 200, 0.035);
}
export function star(g, cx, cy, s, c, rot = 0) { g.fillStyle = c; g.beginPath(); for (let k = 0; k < 10; k++) { const rr2 = k % 2 ? s * 0.45 : s, a = rot + (k / 10) * TAU - Math.PI / 2; g.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } g.closePath(); g.fill(); }
// patchwork quilt: patches of prints with puffy shading, stitched seams and big folds
function paintQuilt(g, W, H, o, ppm) {
  const p = (o.patch || 0.3) * ppm, nx = Math.max(1, Math.round(W / p)), ny = Math.max(1, Math.round(H / p)), pw = W / nx, ph = H / ny, r = rnd(o.seed || 71), cols = o.cols;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = i * pw, y = j * ph, c = cols[Math.floor(r() * cols.length)], c2 = cols[Math.floor(r() * cols.length)], kind = Math.floor(r() * 6);
    g.save(); g.beginPath(); g.rect(x, y, pw, ph); g.clip(); g.fillStyle = c; g.fillRect(x, y, pw, ph);
    const lc = c2 === c ? lite(c, 0.5) : c2;
    if (kind === 1) { g.fillStyle = rgba(lite(c, 0.6), 0.9); for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { g.beginPath(); g.arc(x + (a + 0.5 + (b % 2) * 0.5) * pw / 4, y + (b + 0.5) * ph / 4, pw * 0.04, 0, TAU); g.fill(); } }
    else if (kind === 2) { g.fillStyle = rgba(lc, 0.8); for (let a = 0; a < 5; a++) g.fillRect(x + (a / 5) * pw, y, pw * 0.08, ph); }
    else if (kind === 3) { g.fillStyle = rgba(lc, 0.45); for (let a = 0; a < 6; a++) { g.fillRect(x + (a / 6) * pw, y, pw / 12, ph); g.fillRect(x, y + (a / 6) * ph, pw, ph / 12); } }
    else if (kind === 4) { for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) flower(g, x + (a + 0.5) * pw / 3, y + (b + 0.5) * ph / 3, pw * 0.05, (a + b) % 2 ? lite(c, 0.6) : lc, 0.9); }
    else if (kind === 5) { star(g, x + pw / 2, y + ph / 2, pw * 0.3, rgba(lite(c, 0.65), 0.9), 0.2); }
    const gr = g.createRadialGradient(x + pw * 0.45, y + ph * 0.4, pw * 0.1, x + pw / 2, y + ph / 2, pw * 0.75); gr.addColorStop(0, 'rgba(255,245,230,0.16)'); gr.addColorStop(0.6, 'rgba(255,245,230,0)'); gr.addColorStop(1, 'rgba(40,10,40,0.3)'); g.fillStyle = gr; g.fillRect(x, y, pw, ph);
    g.restore();
    g.strokeStyle = 'rgba(40,10,30,0.4)'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, pw - 2, ph - 2);
    g.setLineDash([5, 4]); g.strokeStyle = 'rgba(255,240,215,0.7)'; g.lineWidth = 1.4; g.strokeRect(x + 5, y + 5, pw - 10, ph - 10); g.setLineDash([]);
  }
  for (let i = 0; i < (o.folds ?? 10); i++) { const x = r() * W, y = r() * H, L = (0.2 + r() * 0.4) * ppm, a = r() * TAU, b = (r() - 0.5) * L * 0.4; wrapAt(W, H, x, y, L, (xx, yy) => { const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2; fold(g, xx - dx, yy - dy, xx + dx, yy + dy, xx - Math.sin(a) * b, yy + Math.cos(a) * b, ppm * 0.03, '#3a1028', 0.2); fold(g, xx - dx + 4, yy - dy + 4, xx + dx + 4, yy + dy + 4, xx - Math.sin(a) * b + 4, yy + Math.cos(a) * b + 4, ppm * 0.015, '#fff0e0', 0.16); }); }
  speckle(g, W, H, 3, (W * H) / 180, 0.04);
}
function paintWicker(g, W, H, o, ppm) {
  const c = o.c || '#b88a50', rows = Math.max(2, Math.round(H / ((o.row || 0.022) * ppm))), rh = H / rows, cols = Math.max(2, Math.round(W / ((o.col || 0.04) * ppm))), cw = W / cols, r = rnd(o.seed || 81);
  g.fillStyle = shade(c, 0.55); g.fillRect(0, 0, W, H);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = i * cw + (j % 2 ? cw / 2 : 0), y = j * rh, col = jitter(c, r, 0.08);
    for (const dx of [0, -W]) { g.fillStyle = col; rr(g, x + dx + 1, y + 1, cw - 1, rh - 1.5, rh * 0.45); g.fill(); g.fillStyle = vgrad(g, y, y + rh, [[0, 'rgba(255,240,210,0.3)'], [0.45, 'rgba(255,240,210,0)'], [1, 'rgba(40,20,10,0.4)']]); g.fill(); }
  }
}
function paintRope(g, W, H, o, ppm) {
  const c = o.c || '#c8a870', n = Math.max(2, Math.round(W / ((o.pitch || 0.02) * ppm))), s = W / n;
  g.fillStyle = shade(c, 0.4); g.fillRect(0, 0, W, H);
  for (let i = -2; i < n + 2; i++) { const x = i * s; g.fillStyle = hgrad(g, x, x + s, [[0, shade(c, 0.25)], [0.4, lite(c, 0.25)], [1, shade(c, 0.3)]]); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + s * 0.85, 0); g.lineTo(x + s * 0.85 + H * 0.4, H); g.lineTo(x + H * 0.4, H); g.closePath(); g.fill(); }
  speckle(g, W, H, 2, (W * H) / 60, 0.06);
}
function paintMetal(g, W, H, o, ppm) {
  const c = o.c || '#b8bcc4', r = rnd(o.seed || 91);
  g.fillStyle = vgrad(g, 0, H, [[0, lite(c, 0.18)], [0.5, c], [1, shade(c, 0.12)]]); g.fillRect(0, 0, W, H);
  for (let i = 0; i < H * 1.5; i++) { const y = r() * H; g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(20,20,40,0.07)'; g.fillRect(0, y, W, 0.7 + r()); }
  for (let i = 0; i < 4; i++) { const x = r() * W, w = W * 0.1; wrapAt(W, H, x, 0, w, (xx) => { g.fillStyle = hgrad(g, xx - w, xx + w, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.12)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(xx - w, 0, w * 2, H); }); }
  for (let i = 0; i < (W * H) / 4000; i++) { const x = r() * W, y = r() * H, L = 4 + r() * 20, a = r() * TAU; g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  if (o.rust) mottle(g, 0, 0, W, H, { amp: 0.15, cells: [3, 3], seed: 4 });
}
function paintEnamel(g, W, H, o, ppm) {
  const c = o.c;
  g.fillStyle = c; g.fillRect(0, 0, W, H);
  mottle(g, 0, 0, W, H, { amp: o.amp ?? 0.035, cells: [Math.max(1, W / ppm * 3), Math.max(1, H / ppm * 3)], seed: o.seed || 3 });
  if (o.streaks !== false) { const r = rnd(o.seed || 3); for (let i = 0; i < 6; i++) { const x = r() * W, w = W * (0.03 + r() * 0.08); wrapAt(W, H, x, 0, w, (xx) => { g.fillStyle = hgrad(g, xx - w, xx + w, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.06)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(xx - w, 0, w * 2, H); }); } }
  speckle(g, W, H, (o.seed || 3) + 1, (W * H) / 400, 0.03);
}
function paintCork(g, W, H, o, ppm) {
  const r = rnd(o.seed || 5), c = o.c || '#c8945a';
  g.fillStyle = c; g.fillRect(0, 0, W, H);
  for (let i = 0; i < (W * H) / 6; i++) { g.fillStyle = r() < 0.5 ? rgba(shade(c, 0.35), 0.5) : rgba(lite(c, 0.3), 0.45); const s = 0.8 + r() * 2.2; g.fillRect(r() * W, r() * H, s, s); }
  mottle(g, 0, 0, W, H, { amp: 0.08, cells: [3, 3], seed: 3 });
  void ppm;
}
function paintPaperTex(g, W, H, o, ppm) {
  g.fillStyle = o.c || '#f2ecdc'; g.fillRect(0, 0, W, H);
  mottle(g, 0, 0, W, H, { amp: 0.04, cells: [Math.max(1, W / ppm * 4), Math.max(1, H / ppm * 4)], seed: o.seed || 2 });
  const r = rnd(o.seed || 2); for (let i = 0; i < (W * H) / 90; i++) { g.strokeStyle = 'rgba(120,100,80,0.07)'; g.lineWidth = 0.6; const x = r() * W, y = r() * H, a = r() * TAU; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5); g.stroke(); }
  if (o.lines) scribble(g, W * 0.06, H * 0.06, W * 0.88, H * 0.88, rgba(o.ink || '#3a3440', 0.5), o.seed || 2, { lh: Math.max(4, ppm * 0.012) });
}
// soft radial blob (for contact shadows) and linear fade (contact strips): white with alpha
function paintBlob(g, W, H) { const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
function paintFade(g, W, H) { g.fillStyle = vgrad(g, 0, H, [[0, 'rgba(255,255,255,0)'], [0.55, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,1)']]); g.fillRect(0, 0, W, H); }

// ---- the wall-strip composer. o: { w (tile width m), h (wall height m), bands: [{ to, kind, ... }], ao, top, seed }
// bands bottom-up; kinds: skirting, wainscot, beadboard, rail, crown, paper, plaster, tiles, brick
function paintWall(g, W, H, o, ppm) {
  let from = 0;
  for (const b of o.bands) {
    const y1 = H - from * ppm, y0 = H - b.to * ppm, h = y1 - y0, r = rnd((o.seed || 1) * 31 + Math.round(b.to * 100));
    if (h <= 0) { from = b.to; continue; }
    g.save(); g.beginPath(); g.rect(0, y0, W, h); g.clip();
    if (b.kind === 'skirting' || b.kind === 'rail' || b.kind === 'crown') {
      const c = b.c;
      if (b.wood) grain(g, 0, y0, W, h, c, r, { fine: 3, figure: 0, knots: false }); else { g.fillStyle = c; g.fillRect(0, y0, W, h); }
      // moulding profile: highlight top lip, shadow groove, rounded bottom
      const steps = b.kind === 'skirting' ? [[0, 0.12, 0.28], [0.12, 0.2, -0.25], [0.2, 0.95, 0.04], [0.95, 1, -0.4]] : b.kind === 'crown' ? [[0, 0.25, -0.15], [0.25, 0.45, 0.25], [0.45, 0.6, -0.3], [0.6, 1, 0.12]] : [[0, 0.3, 0.3], [0.3, 0.5, -0.1], [0.5, 0.75, 0.15], [0.75, 1, -0.4]];
      for (const [a, z, k] of steps) { g.fillStyle = k > 0 ? `rgba(255,248,232,${k})` : `rgba(40,16,40,${-k})`; g.fillRect(0, y0 + a * h, W, (z - a) * h + 0.5); }
    } else if (b.kind === 'wainscot') {
      const c = b.c, pw = (b.panel || 0.5) * ppm, n = Math.max(1, Math.round(W / pw)), sw = W / n, st = 0.06 * ppm;
      grain(g, 0, y0, W, h, c, r, { fine: 4, figure: 3 });
      for (let i = 0; i < n; i++) {
        const x = i * sw + st, px = x + st * 0.2, pw2 = sw - st * 2, py = y0 + st, ph = h - st * 2;
        // recessed panel: vertical grain inside, bevel highlights
        g.save(); g.beginPath(); g.rect(px, py, pw2 - st * 0.4, ph); g.clip(); g.translate(px, py + ph); g.rotate(-Math.PI / 2); grain(g, 0, 0, ph, pw2, tone(c, -0.06), r, { fine: 4, figure: 1 }); g.restore();
        g.strokeStyle = 'rgba(255,240,220,0.32)'; g.lineWidth = Math.max(1.5, ppm * 0.008); g.beginPath(); g.moveTo(px, py + ph); g.lineTo(px, py); g.lineTo(px + pw2 - st * 0.4, py); g.stroke();
        g.strokeStyle = 'rgba(30,10,20,0.45)'; g.beginPath(); g.moveTo(px + pw2 - st * 0.4, py); g.lineTo(px + pw2 - st * 0.4, py + ph); g.lineTo(px, py + ph); g.stroke();
        g.fillStyle = 'rgba(30,10,20,0.25)'; g.fillRect(i * sw, y0, 2, h);
      }
    } else if (b.kind === 'beadboard') {
      const c = b.c, bw = (b.board || 0.08) * ppm, n = Math.max(1, Math.round(W / bw)), sw = W / n;
      g.fillStyle = c; g.fillRect(0, y0, W, h);
      for (let i = 0; i < n; i++) { g.fillStyle = hgrad(g, i * sw, (i + 1) * sw, [[0, 'rgba(30,10,30,0.22)'], [0.12, 'rgba(255,250,240,0.18)'], [0.5, 'rgba(255,250,240,0.04)'], [1, 'rgba(30,10,30,0.1)']]); g.fillRect(i * sw, y0, sw, h); }
    } else if (b.kind === 'paper') paintPaper(g, 0, y0, W, h, b, ppm);
    else if (b.kind === 'plaster') paintPlaster(g, W, h, b, ppm, 0, y0);
    else if (b.kind === 'tiles') paintTiles(g, 0, y0, W, h, b, ppm);
    g.restore();
    from = b.to;
  }
  // baked shading: dark at the floor, a soft shadow under the ceiling / top, the band edges catch light
  const aoH = (o.ao ?? 0.32) * ppm;
  g.fillStyle = vgrad(g, H - aoH, H, [[0, 'rgba(30,12,40,0)'], [1, 'rgba(30,12,40,0.38)']]); g.fillRect(0, H - aoH, W, aoH);
  if (o.top) { const th = o.top * ppm; g.fillStyle = vgrad(g, 0, th, [[0, 'rgba(30,12,40,0.3)'], [1, 'rgba(30,12,40,0)']]); g.fillRect(0, 0, W, th); }
  for (const b of o.bands) if (b.drop) { const y = H - b.to * ppm, dh = b.drop * ppm; g.fillStyle = vgrad(g, y, y + dh, [[0, 'rgba(30,12,40,0.22)'], [1, 'rgba(30,12,40,0)']]); g.fillRect(0, y + (b.dropAt || 0) * ppm, W, dh); }
}

// the texture catalogue: each returns a cached texture; size = metres covered
const K = (n, o) => n + ':' + JSON.stringify(o);
export const T = {
  planks: (o) => texture(K('planks', o), o.size || [2, 1.12], o.ppm || PPM, (g, W, H, p) => paintPlanks(g, W, H, o, p)),
  wood: (o) => texture(K('wood', o), o.size || [1, 1], o.ppm || 320, (g, W, H, p) => paintWood(g, W, H, o, p)),
  plaster: (o) => texture(K('plaster', o), o.size || [1, 1], o.ppm || PPM, (g, W, H, p) => paintPlaster(g, W, H, o, p), { read: true }),
  paper: (o) => texture(K('wallpaper', o), o.size || [1, 1], o.ppm || PPM, (g, W, H, p) => paintPaper(g, 0, 0, W, H, o, p)),
  tiles: (o) => texture(K('tiles', o), o.size || [0.6, 0.6], o.ppm || PPM, (g, W, H, p) => paintTiles(g, 0, 0, W, H, o, p)),
  brick: (o) => texture(K('brick', o), o.size || [1.38, 0.9], o.ppm || PPM, (g, W, H, p) => paintBrick(g, W, H, o, p)),
  checker: (o) => texture(K('checker', o), o.size || [1, 1], o.ppm || PPM, (g, W, H, p) => paintChecker(g, W, H, o, p)),
  fabric: (o) => texture(K('fabric', o), o.size || [0.6, 0.6], o.ppm || 400, (g, W, H, p) => paintFabric(g, W, H, o, p)),
  quilt: (o) => texture(K('quilt', o), o.size || [1.2, 1.2], o.ppm || 400, (g, W, H, p) => paintQuilt(g, W, H, o, p)),
  wicker: (o) => texture(K('wicker', o), o.size || [0.4, 0.2], o.ppm || 512, (g, W, H, p) => paintWicker(g, W, H, o, p)),
  rope: (o) => texture(K('rope', o), o.size || [0.2, 0.06], o.ppm || 512, (g, W, H, p) => paintRope(g, W, H, o, p)),
  metal: (o) => texture(K('metal', o), o.size || [0.5, 0.5], o.ppm || 400, (g, W, H, p) => paintMetal(g, W, H, o, p)),
  enamel: (o) => texture(K('enamel', o), o.size || [0.6, 0.6], o.ppm || 300, (g, W, H, p) => paintEnamel(g, W, H, o, p)),
  cork: (o) => texture(K('cork', o), o.size || [0.5, 0.5], o.ppm || 400, (g, W, H, p) => paintCork(g, W, H, o, p)),
  sheet: (o) => texture(K('sheet', o), o.size || [0.3, 0.3], o.ppm || 512, (g, W, H, p) => paintPaperTex(g, W, H, o, p)),
  wall: (o) => texture(K('wall', o), [o.w || 2, o.h], o.ppm || PPM, (g, W, H, p) => paintWall(g, W, H, o, p), { read: true }),
  blob: () => texture('blob', [1, 1], 128, paintBlob),
  fade: () => texture('fade', [1, 1], 128, paintFade),
  // a flat colour (tinted surfaces, untextured trims): a tiny soft-noise swatch
  flat: (c = '#ffffff', o = {}) => texture(K('flat', { c, ...o }), [0.25, 0.25], 128, (g, W, H) => { g.fillStyle = c; g.fillRect(0, 0, W, H); if (o.noise !== false) { mottle(g, 0, 0, W, H, { amp: 0.03, cells: [2, 2], seed: 3 }); speckle(g, W, H, 2, 60, 0.03); } }),
};

// ---------------------------------------------------------------- materials
const MATS = new Map();
// MeshLambert + map, vertex colours on (tints / baked shading). o: { side: 2, glow, keep, transparent, alphaTest, opacity, depthWrite, basic }
export function mat(tex, o = {}) {
  const key = tex.uuid + JSON.stringify(o); if (MATS.has(key)) return MATS.get(key);
  const m = makeMat(tex, o); MATS.set(key, m); return m;
}
// a fresh (uncached) material, for things that switch on and off
export function ownMat(tex, o = {}) { return makeMat(tex, o); }
function makeMat(tex, o) {
  const P = { map: tex, vertexColors: o.vc !== false, side: o.side === 2 ? THREE.DoubleSide : o.side === 1 ? THREE.BackSide : THREE.FrontSide, transparent: !!o.transparent, alphaTest: o.alphaTest || 0, opacity: o.opacity ?? 1, depthWrite: o.depthWrite ?? !o.transparent };
  const m = o.basic ? new THREE.MeshBasicMaterial({ ...P, toneMapped: o.toneMapped ?? true }) : new THREE.MeshLambertMaterial(P);
  if (o.color) m.color.set(o.color);
  if (o.glow && !o.basic) { m.emissive = new THREE.Color(o.glowColor || 0xffffff); m.emissiveMap = tex; m.emissiveIntensity = o.glow; }
  if (o.keep || o.basic) m.userData.keep = true;
  if (o.transparent) { m.polygonOffset = true; m.polygonOffsetFactor = o.po ?? -2; m.polygonOffsetUnits = o.po ?? -2; }
  m.userData.noShadow = !!o.noShadow; m.userData.order = o.order || 0;
  return m;
}

// ---------------------------------------------------------------- geometry
export function makeGeo(P, UV, I, N) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV || new Array((P.length / 3) * 2).fill(0), 2));
  if (I) g.setIndex(I);
  if (N) g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); else g.computeVertexNormals();
  return g;
}
// box-project UVs in metres (per triangle on flat geometry, per vertex on smooth). o.grain: 'x' (default) | 'y' | 'z' (the axis the u runs along)
export function boxUV(g, o = {}) {
  const p = g.attributes.position, nrm = g.attributes.normal, uv = new Float32Array(p.count * 2), grainA = o.grain || 'x';
  const put = (i, ax) => {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i); let u, v;
    if (ax === 1) { if (grainA === 'z') { u = z; v = x; } else { u = x; v = z; } }
    else if (ax === 2) { if (grainA === 'y') { u = y; v = x; } else { u = x; v = y; } }
    else { if (grainA === 'y') { u = y; v = z; } else { u = z; v = y; } }
    uv[i * 2] = u; uv[i * 2 + 1] = v;
  };
  const dom = (nx, ny, nz) => { const a = Math.abs(nx), b = Math.abs(ny), c = Math.abs(nz); return b >= a && b >= c ? 1 : c >= a ? 2 : 0; };
  if (!g.index) for (let t = 0; t < p.count; t += 3) {
    const ax = p.getX(t), ay = p.getY(t), az = p.getZ(t), e1 = [p.getX(t + 1) - ax, p.getY(t + 1) - ay, p.getZ(t + 1) - az], e2 = [p.getX(t + 2) - ax, p.getY(t + 2) - ay, p.getZ(t + 2) - az];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], A = dom(...n);
    put(t, A); put(t + 1, A); put(t + 2, A);
  } else for (let i = 0; i < p.count; i++) put(i, dom(nrm.getX(i), nrm.getY(i), nrm.getZ(i)));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}
// polygon soup builder: convex polygons → triangles wound to face away from `centre` (or along `want`)
function soup() {
  const P = [];
  return {
    P,
    poly(vs, centre, want) {
      const a = vs[0], b = vs[1], c = vs[2], e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      let d;
      if (want) d = n[0] * want[0] + n[1] * want[1] + n[2] * want[2];
      else { const m = [0, 0, 0]; for (const v of vs) { m[0] += v[0] / vs.length; m[1] += v[1] / vs.length; m[2] += v[2] / vs.length; } d = n[0] * (m[0] - centre[0]) + n[1] * (m[1] - centre[1]) + n[2] * (m[2] - centre[2]); }
      const L = d < 0 ? vs.slice().reverse() : vs;
      for (let i = 1; i < L.length - 1; i++) P.push(...L[0], ...L[i], ...L[i + 1]);
    },
  };
}
// a chamfered box w × h × d standing on y = 0, centred in x and z. o: { b (bevel m), grain, taper (top scale), fit (per-face 0..1 uvs), noBottom }
export function cbox(w, h, d, o = {}) {
  const b = Math.max(0, Math.min(o.b ?? 0.012, w / 2.05, h / 2.05, d / 2.05)), hx = w / 2 - b, hy = h / 2 - b, hz = d / 2 - b, cy = h / 2, tp = o.taper ?? 1;
  const V = (s, a) => { const k = s[1] > 0 ? tp : 1; return [(s[0] * hx + (a === 0 ? s[0] * b : 0)) * k, cy + s[1] * hy + (a === 1 ? s[1] * b : 0), (s[2] * hz + (a === 2 ? s[2] * b : 0)) * k]; };
  const S = soup(), C = [0, cy, 0], others = (a) => [0, 1, 2].filter((k) => k !== a);
  const faces = [];
  for (const a of [0, 1, 2]) for (const s of [-1, 1]) {
    if (o.noBottom && a === 1 && s < 0) continue;
    const [i, j] = others(a), vs = [];
    for (const [si, sj] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const sg = [0, 0, 0]; sg[a] = s; sg[i] = si; sg[j] = sj; vs.push(V(sg, a)); }
    const start = S.P.length; S.poly(vs, C); faces.push([start, S.P.length, a, s]);
  }
  if (b > 0) {
    for (const a of [0, 1, 2]) { const [i, j] = others(a); for (const si of [-1, 1]) for (const sj of [-1, 1]) { const vs = []; for (const sa of [-1, 1]) { const sg = [0, 0, 0]; sg[a] = sa; sg[i] = si; sg[j] = sj; vs.push(V(sg, i)); } for (const sa of [1, -1]) { const sg = [0, 0, 0]; sg[a] = sa; sg[i] = si; sg[j] = sj; vs.push(V(sg, j)); } S.poly(vs, C); } }
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) S.poly([V([sx, sy, sz], 0), V([sx, sy, sz], 1), V([sx, sy, sz], 2)], C);
  }
  const g = makeGeo(S.P);
  if (o.fit) {           // each face 0..1 over its own extent; bevels take the colour of their neighbours' edges
    boxUV(g, o); const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = g.attributes.normal, ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
      if (az >= ax && az >= ay) uv.setXY(i, n.getZ(i) > 0 ? x / w + 0.5 : 0.5 - x / w, y / h);
      else if (ax >= ay) uv.setXY(i, n.getX(i) > 0 ? 0.5 - z / d : z / d + 0.5, y / h);
      else uv.setXY(i, x / w + 0.5, n.getY(i) > 0 ? 0.5 - z / d : z / d + 0.5);
    }
    g.userData.fit = true;
  } else boxUV(g, o);
  return g;
}
// closed rings (arrays of [x, z]) swept through rows → smooth sides (and caps). Rings run clockwise seen from above.
// rows: [{ y, ...params }], ring(row, j) → points. o: { cap0, cap1, smoothV (default true), fit, hard (row indices with a crease) }
export function sweep(rows, ring, o = {}) {
  const R = rows.map((r, j) => { const pts = ring(r, j); let A = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; A += p[0] * q[1] - q[0] * p[1]; } return A > 1e-9 ? pts.slice().reverse() : pts; });
  const n = R[0].length, P = [], UV = [], I = [], smooth = o.smoothV !== false, W = n + 1;
  const perim = R.map((pts) => { const L = [0]; for (let i = 0; i < n; i++) L.push(L[i] + Math.hypot(pts[(i + 1) % n][0] - pts[i][0], pts[(i + 1) % n][1] - pts[i][1])); return L; });
  const vacc = [0]; for (let j = 1; j < rows.length; j++) { let s = 0; for (let i = 0; i < n; i++) s += Math.hypot(R[j][i][0] - R[j - 1][i][0], R[j][i][1] - R[j - 1][i][1]); vacc.push(vacc[j - 1] + Math.hypot(rows[j].y - rows[j - 1].y, s / n)); }
  const vTot = vacc[vacc.length - 1] || 1, ref = Math.max(...perim.map((L) => L[n]));
  const pushRow = (j) => { const base = P.length / 3; for (let i = 0; i <= n; i++) { const p = R[j][i % n]; P.push(p[0], rows[j].y, p[1]); if (o.fit) UV.push(i / n, rows[j].v ?? vacc[j] / vTot); else UV.push((perim[j][i] / (perim[j][n] || 1)) * ref, vacc[j]); } return base; };
  const hard = new Set(o.hard || []);
  let prev = pushRow(0), seams = [prev];
  for (let j = 1; j < rows.length; j++) {
    const cur = pushRow(j); seams.push(cur);
    for (let i = 0; i < n; i++) { const a = prev + i, b = a + 1, c = cur + i, d = c + 1; I.push(a, b, d, a, d, c); }
    prev = cur;
    if ((!smooth || hard.has(j)) && j < rows.length - 1) { prev = pushRow(j); seams.push(prev); }
  }
  const sideCount = P.length / 3;
  const cap = (j, up) => {
    const base = P.length / 3, pts = R[j]; let cx = 0, cz = 0; for (const p of pts) { cx += p[0] / n; cz += p[1] / n; }
    let ext = 1e-4; for (const p of pts) ext = Math.max(ext, Math.hypot(p[0] - cx, p[1] - cz));
    P.push(cx, rows[j].y, cz); UV.push(o.fit ? 0.5 : cx, o.fit ? 0.5 : cz);
    for (let i = 0; i < n; i++) { P.push(pts[i][0], rows[j].y, pts[i][1]); UV.push(o.fit ? 0.5 + (pts[i][0] - cx) / (2 * ext) : pts[i][0], o.fit ? 0.5 - (pts[i][1] - cz) / (2 * ext) : pts[i][1]); }
    for (let i = 0; i < n; i++) { const a = base + 1 + i, b = base + 1 + ((i + 1) % n); if (up) I.push(base, a, b); else I.push(base, b, a); }
  };
  if (o.cap0) cap(0, false); if (o.cap1) cap(rows.length - 1, true);
  const g = makeGeo(P, UV, I);
  // the u seam: average the normals of the duplicated first / last vertex of each row
  const N = g.attributes.normal;
  for (const s of seams) { const a = s, b = s + n; if (b >= sideCount) continue; const x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); }
  if (o.fit) g.userData.fit = true;
  return g;
}
// ring helpers. circle: u = 0.5 at +z (the front), clockwise from above
export const circle = (r, n, rx = r, phase = 0) => { const pts = []; for (let i = 0; i < n; i++) { const a = (i / n - 0.5) * TAU + phase; pts.push([Math.sin(a) * rx, Math.cos(a) * r]); } return pts; };
export function rrect(w, d, r, seg = 3) {
  r = Math.max(0, Math.min(r, w / 2 - 1e-4, d / 2 - 1e-4)); const cx = w / 2 - r, cz = d / 2 - r, pts = [], sg = r > 0 ? seg : 0;
  for (const [x, z, a0] of [[cx, cz, 0], [-cx, cz, Math.PI / 2], [-cx, -cz, Math.PI], [cx, -cz, Math.PI * 1.5]]) for (let i = 0; i <= sg; i++) { const a = a0 + (sg ? i / sg : 0.5) * (Math.PI / 2); pts.push([x + Math.cos(a) * r, z + Math.sin(a) * r]); }
  return pts;
}
// lathe: prof [[r, y], ...] bottom-up; o: { n, cap0, cap1, fit, smoothV, rz (depth radius scale), hard }
export function lathe(prof, o = {}) {
  const n = o.n || 12;
  return sweep(prof.map(([r, y, v]) => ({ y, r, v })), (row) => circle(Math.max(1e-5, row.r) * (o.rz ?? 1), n, Math.max(1e-5, row.r), o.phase || 0), { smoothV: o.smoothV ?? true, ...o });
}
// cylinder / prism: radius r (r2 at the top), height h; o: { n, cap (both), flat }
export function cyl(r, h, o = {}) {
  const n = o.n || 12, r2 = o.r2 ?? r, c = o.chamfer || 0;
  const prof = c > 0 ? [[r - c, 0], [r, c], [r2, h - c], [r2 - c, h]] : [[r, 0], [r2, h]];
  const g = lathe(prof, { n, cap0: o.cap !== false && o.cap0 !== false, cap1: o.cap !== false && o.cap1 !== false, smoothV: false, rz: o.rz, fit: o.fit, phase: o.phase });
  return o.flat ? flatten(g) : g;
}
// rounded slab: a rounded-rectangle plan w × d, h tall, with a chamfer c on the top / bottom edges
export function slab(w, d, h, o = {}) {
  const r = o.r ?? Math.min(w, d) * 0.08, c = Math.min(o.c ?? 0.01, h / 2.1, r > 0 ? r : 1), seg = o.seg ?? 3;
  const rows = c > 0 ? [{ y: 0, i: c }, { y: c, i: 0 }, { y: h - c, i: 0 }, { y: h, i: c }] : [{ y: 0, i: 0 }, { y: h, i: 0 }];
  const g = sweep(rows, (row) => rrect(w - row.i * 2, d - row.i * 2, Math.max(0, r - row.i), seg), { smoothV: false, cap0: o.bottom !== false, cap1: true });
  return g;
}
// superellipsoid (cushions, plush bodies, sacks, pillows): half extents a, b, c; e1 (vertical squareness), e2 (horizontal)
export function superq(w, h, d, o = {}) {
  const n = o.n || 14, m = o.m || 9, e1 = o.e1 ?? 0.6, e2 = o.e2 ?? 0.6, a = w / 2, b = h / 2, c = d / 2;
  const sp = (x, e) => Math.sign(x) * Math.pow(Math.abs(x), e), rows = [];
  for (let j = 0; j <= m; j++) { const eta = -Math.PI / 2 + (j / m) * Math.PI; rows.push({ y: b + sp(Math.sin(eta), e1) * b, k: sp(Math.cos(eta), e1), v: j / m }); }
  const g = sweep(rows, (row) => { const pts = []; for (let i = 0; i < n; i++) { const w2 = (i / n - 0.5) * TAU; pts.push([sp(Math.sin(w2), e2) * a * Math.max(1e-4, row.k) * (o.taperTop && row.y > b ? lerp(1, o.taperTop, (row.y - b) / b) : 1), sp(Math.cos(w2), e2) * c * Math.max(1e-4, row.k)]); } return pts; }, { smoothV: true, fit: o.fit });
  if (o.sag) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i); p.setY(i, y - o.sag * Math.max(0, 1 - (x * x) / (a * a) - (z * z) / (c * c)) * (y / h)); } g.computeVertexNormals(); }
  if (!o.fit) boxUV(g, o);
  return g;
}
// extrude a 2D shape (points [[x, y], ...] in the xy plane) along z by depth, centred; o: { bevel, holes, curve }
export function extrude(pts, depth, o = {}) {
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const hole of o.holes || []) sh.holes.push(new THREE.Path(hole.map(([x, y]) => new THREE.Vector2(x, y))));
  const bv = o.bevel || 0;
  let g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(1e-4, depth - bv * 2), bevelEnabled: bv > 0, bevelThickness: bv, bevelSize: bv, bevelSegments: 1, curveSegments: o.curve || 8 });
  g.translate(0, 0, -depth / 2 + bv); g = g.index ? g.toNonIndexed() : g; g.computeVertexNormals();
  if (o.fit) {           // front / back faces 0..1 over the shape's bounds (a print on the face); sides metric
    boxUV(g, o); g.computeBoundingBox(); const bb = g.boundingBox, p = g.attributes.position, uv = g.attributes.uv, N = g.attributes.normal;
    for (let i = 0; i < p.count; i++) { if (Math.abs(N.getZ(i)) > 0.5) uv.setXY(i, (N.getZ(i) > 0 ? (p.getX(i) - bb.min.x) : (bb.max.x - p.getX(i))) / (bb.max.x - bb.min.x), (p.getY(i) - bb.min.y) / (bb.max.y - bb.min.y)); else uv.setXY(i, 0.02, 0.02); }
    g.userData.fit = true;
  } else boxUV(g, o);
  return g;
}
// a plane w × h in the xy plane facing +z, bottom-centre at the origin (o.center: centred). Fit uvs unless o.metric
export function plane(w, h, o = {}) {
  const y0 = o.center ? -h / 2 : 0, P = [-w / 2, y0, 0, w / 2, y0, 0, w / 2, y0 + h, 0, -w / 2, y0 + h, 0], UV = o.metric ? [0, 0, w, 0, w, h, 0, h] : [0, 0, 1, 0, 1, 1, 0, 1];
  const g = makeGeo(P, UV, [0, 1, 2, 0, 2, 3], [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
  if (!o.metric) g.userData.fit = true;
  return g;
}
// a tube of radius r (or r(t)) along a polyline / list of points; o: { n, cap, closed }
export function tube(pts, r, o = {}) {
  const n = o.n || 6, P = [], UV = [], I = [], W = n + 1, V3 = THREE.Vector3;
  const pv = pts.map((p) => new V3(...p)), tan = pv.map((p, i) => { const a = pv[Math.max(0, i - 1)], b = pv[Math.min(pv.length - 1, i + 1)]; return b.clone().sub(a).normalize(); });
  let nrm = new V3(0, 1, 0); if (Math.abs(tan[0].y) > 0.9) nrm.set(1, 0, 0);
  nrm = nrm.sub(tan[0].clone().multiplyScalar(nrm.dot(tan[0]))).normalize();
  let len = 0;
  pv.forEach((p, j) => {
    if (j) { len += p.distanceTo(pv[j - 1]); nrm = nrm.sub(tan[j].clone().multiplyScalar(nrm.dot(tan[j]))).normalize(); }
    const bin = new V3().crossVectors(tan[j], nrm), rr2 = typeof r === 'function' ? r(j / (pv.length - 1)) : r;
    for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, c = Math.cos(a) * rr2, s = Math.sin(a) * rr2; P.push(p.x + nrm.x * c + bin.x * s, p.y + nrm.y * c + bin.y * s, p.z + nrm.z * c + bin.z * s); UV.push((i / n) * TAU * Math.max(rr2, 0.005), len); }
  });
  for (let j = 0; j < pv.length - 1; j++) for (let i = 0; i < n; i++) { const a = j * W + i, b = a + 1, c = a + W, d = c + 1; I.push(a, b, d, a, d, c); }
  if (o.cap) for (const [j, s] of [[0, -1], [pv.length - 1, 1]]) { const base = P.length / 3, p = pv[j]; P.push(p.x, p.y, p.z); UV.push(0, 0); for (let i = 0; i < n; i++) { const a = j * W + i; if (s > 0) I.push(base, a, a + 1); else I.push(base, a + 1, a); } }
  const g = makeGeo(P, UV, I);
  const N = g.attributes.normal; for (let j = 0; j < pv.length; j++) { const a = j * W, b = a + n, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); }
  return g;
}
// a hanging curve (catenary-ish) between two points with sag, as a point list
export function sagLine(a, b, sag, n = 12) { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) - Math.sin(t * Math.PI) * sag, lerp(a[2], b[2], t)]); } return pts; }
// a draped sheet: f(u, v) → [x, y, z] over an nu × nv grid; uvs in metres along the surface (or fit)
export function sheet(f, nu, nv, o = {}) {
  const P = [], UV = [], I = [], W = nu + 1, pts = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pts.push(f(i / nu, j / nv));
  // metric uvs: arc length along each param direction
  const U = new Float32Array(pts.length), Vv = new Float32Array(pts.length), d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  for (let j = 0; j <= nv; j++) for (let i = 1; i <= nu; i++) U[j * W + i] = U[j * W + i - 1] + d(pts[j * W + i], pts[j * W + i - 1]);
  for (let i = 0; i <= nu; i++) for (let j = 1; j <= nv; j++) Vv[j * W + i] = Vv[(j - 1) * W + i] + d(pts[j * W + i], pts[(j - 1) * W + i]);
  pts.forEach((p, k) => { P.push(...p); if (o.fit) UV.push((k % W) / nu, Math.floor(k / W) / nv); else UV.push(U[k], Vv[k]); });
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * W + i, b = a + 1, c = a + W, e = c + 1; if (o.flip) I.push(a, e, b, a, c, e); else I.push(a, b, e, a, e, c); }
  const g = makeGeo(P, UV, I); if (o.fit) g.userData.fit = true; return g;
}
// deform a geometry: fn(x, y, z) → [x, y, z]; normals recomputed (seams of swept shapes stay smooth enough)
export function warp(g, fn) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const q = fn(p.getX(i), p.getY(i), p.getZ(i)); p.setXYZ(i, q[0], q[1], q[2]); }
  p.needsUpdate = true; g.computeVertexNormals(); g.boundingBox = null; return g;
}
// faceted look: split every triangle (flat normals)
export function flatten(g) { const f = g.index ? g.toNonIndexed() : g.clone(); f.computeVertexNormals(); f.userData = { ...g.userData }; return f; }
// low-poly sphere / ellipsoid (smooth) standing on y = 0 unless o.center
export function sphere(r, o = {}) {
  const m = o.m || 6, prof = []; for (let j = 0; j <= m; j++) { const a = -Math.PI / 2 + (j / m) * Math.PI; prof.push([Math.cos(a) * r * (o.rx ?? 1), (o.center ? 0 : r * (o.ry ?? 1)) + Math.sin(a) * r * (o.ry ?? 1), j / m]); }
  const g = lathe(prof, { n: o.n || 10, fit: o.fit, rz: o.rz });
  if (!o.fit) boxUV(g); return g;
}

// ---------------------------------------------------------------- batching
const _m = new THREE.Matrix4(), _nm = new THREE.Matrix3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _v = new THREE.Vector3(), _c = new THREE.Color();
export function xform(t = {}) {
  if (t.m) return t.m;
  const r = Array.isArray(t.r) ? t.r : [0, t.r || 0, 0], s = t.s === undefined ? [1, 1, 1] : Array.isArray(t.s) ? t.s : [t.s, t.s, t.s];
  return _m.compose(_p.set(...(t.p || [0, 0, 0])), _q.setFromEuler(_e.set(r[0], r[1], r[2], t.order || 'YXZ')), _s.set(...s));
}
// collects parts per material; build() merges each material's parts into one mesh
export class Batch {
  constructor(o = {}) { this.parts = new Map(); this.r = rnd(o.seed || 17); this.meshes = []; }
  // t: { p, r, s, m (Matrix4), tint (css colour), ao (bottom darkening, 0..1 = the factor at the floor), aoH, vc(x, y, z) → factor, uvOff: [u, v] | false }
  add(geo, material, t = {}) {
    if (!material) throw new Error('Batch.add: no material');
    let L = this.parts.get(material); if (!L) { L = { P: [], N: [], UV: [], C: [], I: [] }; this.parts.set(material, L); }
    const m = xform(t), p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv, base = L.P.length / 3;
    _nm.getNormalMatrix(m);
    const fit = geo.userData.fit, size = (material.map && material.map.userData.size) || [1, 1], off = t.uvOff === false || fit ? [0, 0] : t.uvOff || [this.r() * 7, this.r() * 7];
    if (!geo.boundingBox) geo.computeBoundingBox();
    const y0 = geo.boundingBox.min.y, y1 = geo.boundingBox.max.y, aoH = t.aoH ?? Math.max(0.02, Math.min(0.35, (y1 - y0) * 0.6));
    _c.set(t.tint || '#ffffff'); const tr = _c.r, tg = _c.g, tb = _c.b;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      _v.set(x, y, z).applyMatrix4(m); L.P.push(_v.x, _v.y, _v.z);
      _v.set(n.getX(i), n.getY(i), n.getZ(i)).applyMatrix3(_nm).normalize(); L.N.push(_v.x, _v.y, _v.z);
      if (fit) L.UV.push(uv.getX(i), uv.getY(i)); else L.UV.push((uv.getX(i) + off[0]) / size[0], (uv.getY(i) + off[1]) / size[1]);
      let k = 1; if (t.ao) k *= lerp(1 - t.ao, 1, sstep(0, 1, (y - y0) / aoH)); if (t.vc) k *= t.vc(x, y, z);
      L.C.push(tr * k, tg * k, tb * k);
    }
    if (geo.index) { const ix = geo.index.array; for (let i = 0; i < ix.length; i++) L.I.push(ix[i] + base); } else for (let i = 0; i < p.count; i++) L.I.push(base + i);
    return this;
  }
  // a separate (unmerged) mesh, e.g. for something that moves
  mesh(geo, material, t = {}) { const g = new THREE.Group(); const b = new Batch(); b.add(geo, material, { ...t, p: [0, 0, 0], r: 0, s: 1, m: undefined }); b.build(g); const o = g.children[0]; if (t.p) o.position.set(...t.p); if (t.r !== undefined) { if (Array.isArray(t.r)) o.rotation.set(t.r[0], t.r[1], t.r[2], 'YXZ'); else o.rotation.y = t.r; } if (t.s) { if (Array.isArray(t.s)) o.scale.set(...t.s); else o.scale.setScalar(t.s); } this.meshes.push(o); return o; }
  build(parent) {
    for (const [material, L] of this.parts) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(L.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(L.N, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(L.UV, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(L.C, 3));
      g.setIndex(L.P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(L.I, 1) : new THREE.Uint16BufferAttribute(L.I, 1));
      g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, material); mesh.castShadow = !material.userData.noShadow && !material.transparent; mesh.receiveShadow = true; mesh.renderOrder = material.userData.order || 0;
      parent.add(mesh);
    }
    for (const o of this.meshes) parent.add(o);
    this.parts.clear(); this.meshes = [];
    return parent;
  }
  // a local frame (position, yaw / euler, scale): parts added to it are placed relative to it; frames nest
  at(p, r = 0, s) { return new Frame(this, xform({ p, r, s }).clone()); }
  get B() { return this; }
  pt(x, y, z) { return [x, y, z]; }
  // stats
  count() { let tris = 0; for (const L of this.parts.values()) tris += L.I.length / 3; return { mats: this.parts.size, tris }; }
}

export class Frame {
  constructor(B, m) { this.B = B; this.m = m; }
  add(geo, material, t = {}) { const m = this.m.clone().multiply(xform({ ...t, m: undefined }).clone()); this.B.add(geo, material, { ...t, m }); return this; }
  at(p, r = 0, s) { return new Frame(this.B, this.m.clone().multiply(xform({ p, r, s }).clone())); }
  // world position of a local point
  pt(x, y, z) { const v = new THREE.Vector3(x, y, z).applyMatrix4(this.m); return [v.x, v.y, v.z]; }
}

// ---------------------------------------------------------------- soft shadows (unlit, transparent, batched)
const SHADOW = new Map();
function shadowMat(kind, k) {
  const q = Math.max(1, Math.min(10, Math.round(k * 10))), key = kind + q;
  if (!SHADOW.has(key)) { const m = new THREE.MeshBasicMaterial({ map: kind === 'blob' ? T.blob() : T.fade(), color: 0x1a0e22, transparent: true, depthWrite: false, opacity: 0.6 * (q / 10) }); m.userData.keep = true; m.userData.noShadow = true; m.polygonOffset = true; m.polygonOffsetFactor = -3; m.polygonOffsetUnits = -3; m.userData.order = 1; SHADOW.set(key, m); }
  return SHADOW.get(key);
}
// a soft round contact shadow on a floor at height y. k: strength 0..1
export function blobShadow(B, x, y, z, rx, rz, k = 1, rot = 0) {
  const g = makeGeo([-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5], [0, 0, 1, 0, 1, 1, 0, 1], [0, 2, 1, 0, 3, 2], [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]); g.userData.fit = true;
  B.add(g, shadowMat('blob', k), { p: [x, y + 0.004, z], r: rot, s: [rx * 2, 1, rz * 2], uvOff: false });
}
// a strip of shadow fading away from an edge: from point a to b (the dark edge), extending `w` metres along `dir` ([dx, dy, dz])
export function edgeShadow(B, a, b, dir, w, k = 1) {
  const P = [a[0] + dir[0] * w, a[1] + dir[1] * w, a[2] + dir[2] * w, b[0] + dir[0] * w, b[1] + dir[1] * w, b[2] + dir[2] * w, b[0], b[1], b[2], a[0], a[1], a[2]];
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], n = [e1[1] * dir[2] - e1[2] * dir[1], e1[2] * dir[0] - e1[0] * dir[2], e1[0] * dir[1] - e1[1] * dir[0]], l = Math.hypot(...n) || 1;
  const g = makeGeo(P, [0, 1, 1, 1, 1, 0, 0, 0], [0, 1, 2, 0, 2, 3, 0, 2, 1, 0, 3, 2], [n[0] / l, n[1] / l, n[2] / l, n[0] / l, n[1] / l, n[2] / l, n[0] / l, n[1] / l, n[2] / l, n[0] / l, n[1] / l, n[2] / l]); g.userData.fit = true;
  B.add(g, shadowMat('fade', k), { uvOff: false });
}
// leave the scene: a per-frame hook that removes itself once `obj` is no longer in the scene
export function hook(stage, obj, fn) {
  const f = (st) => { if (!obj.parent) { queueMicrotask(() => { const i = st.hooks.indexOf(f); if (i >= 0) st.hooks.splice(i, 1); }); return; } fn(st); };
  stage.hooks.push(f); return f;
}
