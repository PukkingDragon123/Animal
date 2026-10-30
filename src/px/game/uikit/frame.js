// Frame drawing for the pixel UI kit: soft drop shadows, bevelled ink-outlined
// frames with brass corner caps, dithered gradient fills, gems, cursors and the
// full-screen backdrop used by modal screens. Pure functions of (ui, …).
import { P } from '../../surface.js';
import { bayer, rgb } from '../../color.js';
import { T, sh, mx, pa } from './theme.js';

// row inset of a rounded rect with corner radius r (same cut as PixelUI.rrect)
export function insetOf(j, h, r) {
  const k = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0;
  return r >= 3 ? [0, 1, 1, 3][k] || 0 : r === 2 ? [0, 1, 2][k] || 0 : [0, 1][k] || 0;
}
// fill a rounded rect with a packed colour (fast path)
export function rfill(s, x, y, w, h, v, r = 2) {
  x |= 0; y |= 0; w |= 0; h |= 0;
  for (let j = 0; j < h; j++) {
    const Y = y + j; if (Y < 0 || Y >= s.h) continue;
    const ins = insetOf(j, h, r), a = Math.max(0, x + ins), b2 = Math.min(s.w, x + w - ins);
    if (b2 > a) s.data.fill(v, Y * s.w + a, Y * s.w + b2);
  }
}
// alpha-blend one colour over a pixel run (inline maths, no per-pixel parsing)
export function blendRun(s, x0, x1, y, c, a) {
  if (y < 0 || y >= s.h || a <= 0) return;
  const [r, g, b] = rgb(c), A = Math.round(a * 255), d = s.data;
  x0 = Math.max(0, x0 | 0); x1 = Math.min(s.w - 1, x1 | 0);
  for (let x = x0; x <= x1; x++) {
    const i = y * s.w + x, v = d[i], da = v >>> 24;
    if (!da) { d[i] = ((A << 24) | (b << 16) | (g << 8) | r) >>> 0; continue; }
    const dr = v & 255, dg = (v >>> 8) & 255, db = (v >>> 16) & 255;
    d[i] = ((Math.max(da, A) << 24) | ((db + (b - db) * a) << 16) | ((dg + (g - dg) * a) << 8) | (dr + (r - dr) * a)) >>> 0;
  }
}
export function blendRect(s, x, y, w, h, c, a) { for (let j = 0; j < h; j++) blendRun(s, x, x + w - 1, y + j, c, a); }
// soft drop shadow of a rounded rect: only the part not covered by the rect itself
export function dropShadow(s, x, y, w, h, r = 3, dx = 1, dy = 2, a = 0.5) {
  for (let j = 0; j < h; j++) {
    const Y = y + dy + j, ins = insetOf(j, h, r), a0 = x + dx + ins, a1 = x + dx + w - 1 - ins;
    const pj = Y - y; // the panel's own row at this y
    if (pj >= 0 && pj < h) { const pi = insetOf(pj, h, r), p0 = x + pi, p1 = x + w - 1 - pi; if (a0 < p0) blendRun(s, a0, Math.min(a1, p0 - 1), Y, T.shade, a); if (a1 > p1) blendRun(s, Math.max(a0, p1 + 1), a1, Y, T.shade, a); }
    else blendRun(s, a0, a1, Y, T.shade, a);
  }
}
// vertical dithered gradient through colour stops (packed values allowed), clipped to a rounded rect
export function gradFill(s, x, y, w, h, cols, r = 0, alpha = 1) {
  x |= 0; y |= 0; w |= 0; h |= 0;
  const n = cols.length - 1, V = cols.map((c) => (alpha < 1 ? pa(c, alpha) : P(c)));
  for (let j = 0; j < h; j++) {
    const Y = y + j; if (Y < 0 || Y >= s.h) continue;
    const t = n ? (j / Math.max(1, h - 1)) * n : 0, k = Math.min(n - 1, Math.floor(t)), f = t - Math.max(0, k);
    const ins = r ? insetOf(j, h, r) : 0, a = V[Math.max(0, k)], b2 = V[Math.min(n, k + 1)];
    for (let X = Math.max(0, x + ins); X < Math.min(s.w, x + w - ins); X++) s.data[Y * s.w + X] = bayer(X, Y) < f ? b2 : a;
  }
}
// horizontal gradient (for selection bars)
export function hgradRun(s, x, y, w, cols, alpha = 1) {
  const n = cols.length - 1, V = cols.map((c) => (alpha < 1 ? pa(c, alpha) : P(c)));
  if (y < 0 || y >= s.h) return;
  for (let i = 0; i < w; i++) { const X = x + i; if (X < 0 || X >= s.w) continue; const t = (i / Math.max(1, w - 1)) * n, k = Math.min(n - 1, Math.floor(t)), f = t - k; s.data[y * s.w + X] = bayer(X, y) < f ? V[k + 1] : V[k]; }
}

// ------------------------------------------------------------------ the frame
// o: fill, fill2, line, edge, edgeL, shadow, alpha, dots, rivets, ornate, gem, accent (corner caps), thin, big, inner (false: no inner ink line)
export function frame(ui, x, y, w, h, o = {}) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const s = ui.s;
  if (w < 5 || h < 5) { ui.rrect(x, y, w, h, o.line || T.ink, 1); return; }
  const fill = o.fill || T.panel, ink = o.line || T.ink, edge = o.edge || T.edge, edgeL = o.edgeL || T.edgeL, alpha = o.alpha ?? 1;
  const big = !o.thin && (o.big || (w >= 28 && h >= 22));
  if (o.shadow !== false) dropShadow(s, x, y, w, h, 3, 1, 2, o.shadowA ?? 0.55);
  const eH = mx(edgeL, '#ffffff', 0.28), eD = sh(edge, -0.9), eM = mx(edge, edgeL, 0.45), eR = mx(edge, eD, 0.5);
  const fT = mx(fill, edgeL, 0.2), fB = o.fill2 || sh(fill, -0.6);
  if (big) {
    ui.rrect(x, y, w, h, ink, 3);
    ui.rrect(x + 1, y + 1, w - 2, h - 2, edge, 2);
    // bevel band: lit top/left, shaded bottom/right
    s.hline(x + 3, x + w - 4, y + 1, eH); s.hline(x + 2, x + w - 3, y + 2, edgeL);
    s.vline(x + 1, y + 3, y + h - 4, eM); s.vline(x + 2, y + 3, y + h - 4, edge);
    s.hline(x + 3, x + w - 4, y + h - 2, eD); s.hline(x + 2, x + w - 3, y + h - 3, eR);
    s.vline(x + w - 2, y + 3, y + h - 4, eR); s.vline(x + w - 3, y + 3, y + h - 4, edge);
    // inner ink line then the gradient fill
    if (o.inner !== false) ui.rrect(x + 3, y + 3, w - 6, h - 6, mx(ink, fill, 0.25), 1);
    const fx = x + 4, fy = y + 4, fw = w - 8, fh = h - 8;
    gradFill(s, fx, fy, fw, fh, [fT, fill, fill, fB], 0, alpha);
    s.hline(fx, fx + fw - 1, fy, alpha < 1 ? pa(mx(fill, T.hi, 0.42), alpha) : mx(fill, T.hi, 0.42));
    s.hline(fx + 1, fx + fw - 2, fy + 1, alpha < 1 ? pa(mx(fT, T.hi, 0.12), alpha) : mx(fT, T.hi, 0.12));
    s.hline(fx, fx + fw - 1, fy + fh - 1, alpha < 1 ? pa(sh(fill, -1), alpha) : sh(fill, -1));
    if (o.dots) pattern(s, fx + 1, fy + 2, fw - 2, fh - 3, mx(fill, edge, 0.38), alpha);
    if (o.rivets !== false && w >= 30 && h >= 22) caps(s, x, y, w, h, o.accent || T.brass, ink);
    if (o.ornate) { gem(s, x + (w >> 1), y + 1, o.gem || T.cyan, 3); gem(s, x + (w >> 1), y + h - 2, o.gem2 || o.gem || T.coral, 2); }
  } else {
    ui.rrect(x, y, w, h, ink, h >= 8 ? 3 : 2);
    ui.rrect(x + 1, y + 1, w - 2, h - 2, edge, 1);
    s.hline(x + 2, x + w - 3, y + 1, eH); s.hline(x + 2, x + w - 3, y + h - 2, eD);
    s.vline(x + 1, y + 2, y + h - 3, eM); s.vline(x + w - 2, y + 2, y + h - 3, eR);
    gradFill(s, x + 2, y + 2, w - 4, h - 4, [fT, fill, fB], 0, alpha);
    s.hline(x + 2, x + w - 3, y + 2, alpha < 1 ? pa(mx(fill, T.hi, 0.32), alpha) : mx(fill, T.hi, 0.32));
    if (o.dots) pattern(s, x + 3, y + 4, w - 6, h - 6, mx(fill, edge, 0.38), alpha);
    if (o.rivets !== false && w >= 24) { const cB = o.accent || T.brass; s.px(x + 2, y + 2, mx(cB, '#ffffff', 0.4)); s.px(x + w - 3, y + 2, cB); }
  }
}
// brass L-shaped corner caps riding on the bevel band, with ink end ticks and a bright rivet
export function caps(s, x, y, w, h, c, ink = T.ink) {
  const L = mx(c, '#ffffff', 0.45), M = c, D = sh(c, -0.9), K = P(ink);
  const corner = (fx, fy) => {   // fx/fy: ±1 direction from the corner inward
    const X = (i) => (fx > 0 ? x + i : x + w - 1 - i), Y = (j) => (fy > 0 ? y + j : y + h - 1 - j);
    const lit = fy > 0 ? L : D, mid = M, side = fx > 0 ? mx(M, L, 0.4) : mx(M, D, 0.5);
    for (let i = 3; i <= 5; i++) s.px(X(i), Y(1), lit);
    for (let i = 2; i <= 5; i++) s.px(X(i), Y(2), mid);
    for (let j = 3; j <= 5; j++) { s.px(X(1), Y(j), side); s.px(X(2), Y(j), mid); }
    s.px(X(6), Y(1), K); s.px(X(6), Y(2), K); s.px(X(1), Y(6), K); s.px(X(2), Y(6), K);
    s.px(X(2), Y(2), fy > 0 && fx > 0 ? '#ffffff' : L);
  };
  corner(1, 1); corner(-1, 1); corner(1, -1); corner(-1, -1);
}
// faceted diamond gem with ink rim (r = radius incl. rim)
export function gem(s, cx, cy, c, r = 3) {
  const L = mx(c, '#ffffff', 0.5), D = sh(c, -1), K = P(T.ink);
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    const d = Math.abs(i) + Math.abs(j); if (d > r) continue;
    s.px(cx + i, cy + j, d === r ? K : j < 0 && i <= 0 ? L : j > 0 || i > 0 ? (j > 0 && i > 0 ? D : c) : c);
  }
  if (r >= 2) s.px(cx - 1, cy - 1, '#ffffff');
}
// background texture: staggered dots
export function pattern(s, x, y, w, h, c, alpha = 1) {
  const v = alpha < 1 ? pa(c, alpha) : P(c);
  for (let j = 0; j < h; j += 3) for (let i = ((j / 3) & 1) * 3; i < w; i += 6) { const X = x + i, Y = y + j; if (X >= 0 && Y >= 0 && X < s.w && Y < s.h) s.data[Y * s.w + X] = v; }
}
// triangle cursor with ink outline. dir: 'right' | 'down' | 'left' | 'up'; size = half-height
export function tri(s, x, y, dir, size, c) {
  const K = P(T.ink), L = P(mx(c, '#ffffff', 0.45)), C = P(c), D = P(sh(c, -0.9));
  for (let a = -1; a <= size * 2 + 1; a++) for (let b2 = -1; b2 <= size + 1; b2++) {
    // canonical: pointing right, a = row (0..2size), b2 = column (0..size)
    const half = size - Math.abs(a - size), inside = a >= 0 && a <= 2 * size && b2 >= 0 && b2 <= half;
    const near = !inside && [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([da, db]) => { const aa = a + da, bb = b2 + db; return aa >= 0 && aa <= 2 * size && bb >= 0 && bb <= size - Math.abs(aa - size); });
    if (!inside && !near) continue;
    const v = !inside ? K : a < size ? L : a > size ? D : C;
    let X, Y;
    if (dir === 'right') { X = x + b2; Y = y + a; } else if (dir === 'left') { X = x + size - b2; Y = y + a; } else if (dir === 'down') { X = x + a; Y = y + b2; } else { X = x + a; Y = y + size - b2; }
    if (X >= 0 && Y >= 0 && X < s.w && Y < s.h) s.data[Y * s.w + X] = v;
  }
}
// sparkle (4-point star) for flourishes; k 0..1 = size phase
export function sparkle(s, x, y, c, k = 1) {
  x |= 0; y |= 0;
  const r = k > 0.66 ? 2 : k > 0.33 ? 1 : 0;
  s.px(x, y, '#ffffff');
  for (let i = 1; i <= r; i++) { const col = i === r ? c : mx(c, '#ffffff', 0.5); s.px(x + i, y, col); s.px(x - i, y, col); s.px(x, y + i, col); s.px(x, y - i, col); }
}
// shaded disc (spheres, knobs, badges): light from the top-left
export function ball(s, cx, cy, r, c, o = {}) {
  const K = P(o.ink || T.ink), L = P(mx(c, '#ffffff', 0.45)), C = P(c), D = P(sh(c, -0.9)), H = P('#ffffff'), alpha = o.alpha ?? 1;
  const blendCol = alpha < 1 ? (v) => v : null; void blendCol;
  for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) {
    const d = Math.hypot(i + 0.5 - 0.5, j + 0.5 - 0.5);
    if (d > r + 0.5) continue;
    let v;
    if (d > r - 0.5) v = K;
    else { const lx = (i + j) / (r * 1.4); v = lx < -0.45 ? L : lx > 0.35 ? D : C; if (i === -Math.round(r * 0.4) && j === -Math.round(r * 0.45) && r >= 3) v = H; }
    const X = cx + i, Y = cy + j; if (X >= 0 && Y >= 0 && X < s.w && Y < s.h) s.data[Y * s.w + X] = v;
  }
}
// ring outline only
export function ringPx(s, cx, cy, r, c, a = 1) {
  for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) {
    const d = Math.hypot(i, j); if (d > r + 0.5 || d <= r - 0.5) continue;
    if (a < 1) blendRun(s, cx + i, cx + i, cy + j, c, a); else s.px(cx + i, cy + j, c);
  }
}
// translucent disc
export function discA(s, cx, cy, r, c, a) {
  for (let j = -r; j <= r; j++) { const hw = Math.floor(Math.sqrt(Math.max(0, (r + 0.5) * (r + 0.5) - j * j))); blendRun(s, cx - hw, cx + hw, cy + j, c, a); }
}

// ------------------------------------------------------------------ full-screen backdrop for modal screens
// static gradient + vignette are baked once per size/palette; bands and stars animate on top
const bdCache = new Map();
function bakeBackdrop(W, H, top, mid, bot) {
  const key = W + 'x' + H + top + mid + bot;
  let B = bdCache.get(key);
  if (B) return B;
  const tmp = { w: W, h: H, data: new Uint32Array(W * H) };
  gradFill(tmp, 0, 0, W, H, [top, mid, bot], 0, 1);
  const vig = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2), d = dx * dx * 0.7 + dy * dy;
    if (d > 0.75 && bayer(x, y) < (d - 0.75) * 1.4) vig.push(y * W + x);
  }
  B = { base: tmp.data, vig: Int32Array.from(vig), band: P(mx(mid, '#3a2a62', 0.35)), star: mx(top, '#ffffff', 0.35) };
  if (bdCache.size > 6) bdCache.clear();
  bdCache.set(key, B);
  return B;
}
export function backdrop(ui, t, o = {}) {
  const s = ui.s, W = ui.w, H = ui.h;
  const B = bakeBackdrop(W, H, o.top || '#1d1438', o.mid || '#140e28', o.bot || '#0a0716');
  s.data.set(B.base);
  // drifting diagonal bands (only the 10-px stripes of every 48 are visited)
  const off = Math.floor(t * 8), d = s.data, band = B.band;
  for (let y = 0; y < H; y++) {
    const x0 = ((-(y + off)) % 48 + 48) % 48;
    for (let xs = x0 - 48; xs < W; xs += 48) for (let x = Math.max(0, xs); x < Math.min(W, xs + 10); x++) if (bayer(x, y) < 0.32) d[y * W + x] = band;
  }
  // twinkling stars
  for (let i = 0; i < 46; i++) {
    const sx = (i * 7919) % W, sy = (i * 4513) % Math.max(1, Math.floor(H * 0.85));
    const ph = Math.sin(t * (1.2 + (i % 5) * 0.4) + i);
    if (ph > 0.6) sparkle(s, sx, sy, i % 3 ? T.cyanL : T.amberL, ph > 0.9 ? 0.5 : 0.1);
    else if (ph > -0.2) s.px(sx, sy, B.star);
  }
  const vg = P('#06040c'), V = B.vig;
  for (let i = 0; i < V.length; i++) d[V[i]] = vg;
  if (o.alpha != null && o.alpha < 1) { const A = Math.round(o.alpha * 255) << 24; for (let i = 0; i < d.length; i++) d[i] = ((d[i] & 0xffffff) | A) >>> 0; }
}
