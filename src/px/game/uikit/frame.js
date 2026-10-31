// Frame drawing for the pixel UI kit: hand-made materials. Wood-grain panels
// with soft rounded corners and a carved bevel, cream parchment insets, round
// wooden rings (portraits, dials, buttons), leaf sprigs that sway, twisted rope,
// soft drop shadows and the full-screen forest backdrop used by modal screens.
// Pure functions of (ui, …) or (surface, …).
import { P } from '../../surface.js';
import { bayer, rgb } from '../../color.js';
import { T, sh, mx, pa } from './theme.js';

// ------------------------------------------------------------------ shapes
// row inset of a rounded rect with corner radius r. r ≤ 3 keeps the classic hand-cut corners
// (same cut as PixelUI.rrect always had); bigger radii are true circular arcs (pills when r = h/2)
const CUT = { 4: [0, 1, 1, 2, 4], 5: [0, 1, 1, 2, 3, 5] };
export function insetOf(j, h, r) {
  if (r <= 3) {
    const k = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0;
    return r >= 3 ? [0, 1, 1, 3][k] || 0 : r === 2 ? [0, 1, 2][k] || 0 : r === 1 ? [0, 1][k] || 0 : 0;
  }
  r = Math.min(r, h >> 1);
  if (CUT[r]) { const k = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0; return CUT[r][k] || 0; }
  const d = j < r ? r - j - 0.5 : j >= h - r ? j - (h - r) + 0.5 : 0;
  return d ? Math.round(r - Math.sqrt(Math.max(0, r * r - d * d))) : 0;
}
// fill a rounded rect with a packed colour (fast path)
export function rfill(s, x, y, w, h, v, r = 2) {
  x |= 0; y |= 0; w |= 0; h |= 0;
  for (let j = 0; j < h; j++) {
    const Y = y + j; if (Y < 0 || Y >= s.h) continue;
    const ins = insetOf(j, h, r), a = Math.max(0, x + ins), b2 = Math.min(s.w, x + w - ins);
    if (b2 > a) s.data.fill(typeof v === 'number' ? v : P(v), Y * s.w + a, Y * s.w + b2);
  }
}
// alpha-blend one colour over a pixel run (inline maths, no per-pixel parsing)
export function blendRun(s, x0, x1, y, c, a) {
  if (y < 0 || y >= s.h || a <= 0) return;
  const [r, g, b] = rgb(c), A = Math.round(Math.min(1, a) * 255), d = s.data;
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

// ------------------------------------------------------------------ material textures (baked once per colour, then sampled)
const texCache = new Map();
const h2 = (i, j, k = 0) => { let n = (i * 374761393 + j * 668265263 + k * 1442695041) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
// oak planks: wavy grain lines, light streaks, a knot per plank, optional plank seams
export function woodTex(fill, alpha = 1, seams = true) {
  const key = 'w' + fill + alpha + seams;
  let X = texCache.get(key);
  if (X) return X;
  const tw = 128, th = 64, d = new Uint32Array(tw * th), A = (c) => pa(c, alpha);
  const base = A(fill), dark = A(mx(fill, T.woodDD, 0.32)), dark2 = A(mx(fill, T.woodDD, 0.18)), lite = A(mx(fill, T.hi, 0.16)), seam = A(mx(fill, T.ink, 0.5)), seamL = A(mx(fill, T.hi, 0.22));
  for (let j = 0; j < th; j++) {
    const plank = j >> 4, local = j & 15;
    for (let i = 0; i < tw; i++) {
      const wav = j + 2.2 * Math.sin(i * 0.049 + plank * 1.7) + 0.9 * Math.sin(i * 0.147 + plank * 3.1);
      const ring = ((wav / 4.6) % 1 + 1) % 1, b = bayer(i, j);
      let v = base;
      if (ring < 0.17) v = b < 0.82 ? dark2 : base;
      else if (ring > 0.52 && ring < 0.6 && b < 0.45) v = lite;
      if (Math.sin(i * 0.03 + plank * 2.3) > 0.82 && ring < 0.3 && b < 0.6) v = dark;
      // a knot
      const kx = (plank * 53 + 23) % tw, ky = (plank << 4) + 8, kd = Math.hypot((i - kx) / 2.6, j - ky);
      if (kd < 2.4) v = kd < 0.9 ? dark : kd < 1.7 ? dark2 : lite;
      if (seams && local === 15) v = seam;
      else if (seams && local === 0) v = seamL;
      d[j * tw + i] = v;
    }
  }
  X = { w: tw, h: th, d };
  if (texCache.size > 64) texCache.clear();
  texCache.set(key, X);
  return X;
}
// parchment: soft mottling, fibre specks
export function paperTex(fill = T.paper, alpha = 1) {
  const key = 'p' + fill + alpha;
  let X = texCache.get(key);
  if (X) return X;
  const tw = 64, th = 64, d = new Uint32Array(tw * th);
  const base = pa(fill, alpha), mott = pa(mx(fill, T.paperD, 0.45), alpha), speck = pa(mx(fill, T.paperE, 0.6), alpha), lite = pa(mx(fill, '#ffffff', 0.5), alpha);
  for (let j = 0; j < th; j++) for (let i = 0; i < tw; i++) {
    // soft blotches: value noise on a 16 px grid (wraps with the tile)
    const gx = i / 16, gy = j / 16, xi = Math.floor(gx), yi = Math.floor(gy), fx = gx - xi, fy = gy - yi, u = fx * fx * (3 - 2 * fx), w2 = fy * fy * (3 - 2 * fy);
    const c00 = h2(xi & 3, yi & 3, 3), c10 = h2((xi + 1) & 3, yi & 3, 3), c01 = h2(xi & 3, (yi + 1) & 3, 3), c11 = h2((xi + 1) & 3, (yi + 1) & 3, 3);
    const n = c00 + (c10 - c00) * u + (c01 - c00) * w2 + (c00 - c10 - c01 + c11) * u * w2, r = h2(i, j, 7), b = bayer(i, j);
    let v = base;
    if (n > 0.6 && b < (n - 0.6) * 0.9) v = mott;
    if (r < 0.012) v = speck; else if (r > 0.99) v = lite;
    d[j * tw + i] = v;
  }
  X = { w: tw, h: th, d };
  texCache.set(key, X);
  return X;
}

// ------------------------------------------------------------------ the frame
// A carved wooden panel. o: fill (wood colour), paper (parchment interior; true or a colour), alpha (interior
// translucency), edge/edgeL (rim colours: tint for highlight/selection), line (outline), shadow, shadowA, r (corner
// radius; pills when r ≥ h/2), thin (1px rim), rivets (corner nails), ornate / leaves (leaf sprigs), seams, accent
export function frame(ui, x, y, w, h, o = {}) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const s = ui.s;
  if (w < 5 || h < 5) { ui.rrect(x, y, w, h, o.line || T.ink, 1); return; }
  const big = !o.thin && (o.big || (w >= 28 && h >= 22));
  const r = o.r ?? (big ? 5 : h >= 12 ? 4 : 3);
  if (o.shadow !== false) dropShadow(s, x, y, w, h, Math.min(r, h >> 1), 0, 2, o.shadowA ?? 0.4);
  body(s, x, y, w, h, r, big ? 2 : 1, big, o);
  if (big && o.rivets !== false && w >= 40 && h >= 26) nails(s, x, y, w, h, o.accent);
  if (o.ornate || o.leaves) {
    const t = ui.t || 0;
    sprig(s, x + w - 4, y + 2, -1, t, { n: 3 });
  }
}
// per-row insets of a rounded rect (cached per size)
const insCache = new Map();
function rowIns(h, r) {
  const key = h * 64 + r;
  let A = insCache.get(key);
  if (!A) { A = new Int32Array(h); for (let j = 0; j < h; j++) A[j] = insetOf(j, h, r); if (insCache.size > 400) insCache.clear(); insCache.set(key, A); }
  return A;
}
// packed colours of a frame look (cached per look)
const lookCache = new Map();
function lookOf(o, groove) {
  const edge = o.edge || T.edge, edgeL = o.edgeL || T.edgeL, line = o.line || T.ink, alpha = o.alpha ?? 1;
  const paper = o.paper ? (o.paper === true ? T.paper : o.paper) : null, fill = o.fill || T.panel;
  const key = edge + edgeL + line + alpha + paper + fill + groove;
  let L = lookCache.get(key);
  if (L) return L;
  L = {
    ink: P(line), top1: P(mx(edgeL, '#fff6dc', 0.35)), top2: P(edgeL), side: P(mx(edge, edgeL, 0.45)), bot1: P(mx(edge, T.woodDD, 0.55)), bot2: P(mx(edge, T.woodDD, 0.3)), rimM: P(edge),
    fleck: P(mx(edge, T.woodDD, 0.22)), groove: P(mx(paper ? T.woodD : fill, T.ink, 0.55)),
    inner: paper ? pa(T.paperD, alpha) : pa(mx(fill, T.woodDD, 0.38), alpha), paper, fill, alpha, key,
  };
  if (lookCache.size > 200) lookCache.clear();
  lookCache.set(key, L);
  return L;
}
// the wooden body: ink outline, a 1–2 px rim lit on top / shaded below, a carved groove, then the textured fill.
// Panels keep their size from frame to frame, so each look+size is painted once into a sprite and then row-copied.
const bodyCache = new Map();
function body(s, x, y, w, h, r, rim, groove, o) {
  const C = lookOf(o, groove), seams = o.seams ?? (h >= 34);
  const key = w + 'x' + h + ',' + r + ',' + rim + groove + seams + C.key;
  let B = bodyCache.get(key);
  if (!B) {
    B = { w, h, d: new Uint32Array(w * h), ins: rowIns(h, r) };
    paintBody({ data: B.d, w, h }, 0, 0, w, h, r, rim, groove, o, C, seams);
    if (bodyCache.size > 96) bodyCache.delete(bodyCache.keys().next().value);
    bodyCache.set(key, B);
  }
  const D = s.data, SW = s.w, SH = s.h, ins = B.ins, BD = B.d;
  for (let j = 0; j < h; j++) {
    const Y = y + j; if (Y < 0 || Y >= SH) continue;
    const a = Math.max(0, x + ins[j]), b = Math.min(SW - 1, x + w - 1 - ins[j]);
    if (b >= a) D.set(BD.subarray(j * w + (a - x), j * w + (b - x) + 1), Y * SW + a);
  }
}
function paintBody(s, x, y, w, h, r, rim, groove, o, C, seams) {
  const D = s.data, SW = s.w, SH = s.h;
  const ins = rowIns(h, r), rr = Math.min(r, h >> 1);
  const tex = C.paper ? paperTex(C.paper, C.alpha) : woodTex(C.fill, C.alpha, seams), TW = tex.w, TH = tex.h, TD = tex.d;
  const ox = (w * 7 + h * 13) % TW, oy = (w * 3 + h) % TH, paper = !!C.paper;
  const band = rim + (groove ? 1 : 0) + 1;    // depth: ink 0, rim 1..rim, groove, first fill ring = band
  const xr = x + w - 1;
  const inside = (X, jj) => jj >= 0 && jj < h && X >= x + ins[jj] && X <= xr - ins[jj];
  const pix = (X, j, Y, L, R) => {
    let d = band + 1, dir = 0;
    for (let k = 0; k <= band; k++) {
      if (!inside(X, j - k - 1)) { d = k; dir = 1; break; }
      if (!inside(X, j + k + 1)) { d = k; dir = 2; break; }
      if (X - k - 1 < L) { d = k; dir = 3; break; }
      if (X + k + 1 > R) { d = k; dir = 4; break; }
    }
    const idx = Y * SW + X;
    if (d === 0) { D[idx] = C.ink; return; }
    if (d <= rim) {
      let v = dir === 1 ? (d === 1 ? C.top1 : C.top2) : dir === 2 ? (d === 1 ? C.bot1 : C.bot2) : dir === 3 ? (d === 1 ? C.side : C.rimM) : (d === 1 ? C.bot2 : C.rimM);
      if (dir <= 2 && ((X * 5 + j * 3) % 13 === 0)) v = C.fleck;
      D[idx] = v; return;
    }
    if (groove && d === rim + 1) { D[idx] = C.groove; return; }
    if (d === band && (paper || dir === 1 || dir === 3)) { D[idx] = C.inner; return; }
    D[idx] = TD[((j + oy) % TH) * TW + ((X - x + ox) % TW)];
  };
  for (let j = 0; j < h; j++) {
    const Y = y + j; if (Y < 0 || Y >= SH) continue;
    const L = x + ins[j], R = xr - ins[j], a = Math.max(0, L), b = Math.min(SW - 1, R);
    if (b < a) continue;
    if (j <= band + rr || j >= h - 1 - band - rr) { for (let X = a; X <= b; X++) pix(X, j, Y, L, R); continue; }
    const m0 = Math.max(a, L + band + 1), m1 = Math.min(b, R - band - 1);
    for (let X = a; X <= Math.min(b, L + band); X++) pix(X, j, Y, L, R);
    for (let X = Math.max(a, R - band); X <= b; X++) pix(X, j, Y, L, R);
    // middle: straight copies out of the texture row
    if (m1 >= m0) {
      const tr = ((j + oy) % TH) * TW; let X = m0, tx = (m0 - x + ox) % TW, di = Y * SW + m0;
      while (X <= m1) { const n = Math.min(TW - tx, m1 - X + 1); D.set(TD.subarray(tr + tx, tr + tx + n), di); X += n; di += n; tx = 0; }
    }
  }
}
// little brass nail heads near the corners
export function nails(s, x, y, w, h, c) {
  const C = c || T.brass, L = mx(C, '#ffffff', 0.55), D = mx(C, T.ink, 0.45);
  for (const [nx, ny] of [[x + 4, y + 4], [x + w - 6, y + 4], [x + 4, y + h - 6], [x + w - 6, y + h - 6]]) { s.px(nx, ny, L); s.px(nx + 1, ny, C); s.px(nx, ny + 1, C); s.px(nx + 1, ny + 1, D); }
}
// kept for older callers: corner accents are nails now
export function caps(s, x, y, w, h, c) { nails(s, x, y, w, h, c); }
// faceted diamond gem with ink rim (r = radius incl. rim) — used sparingly (cutscene flourishes)
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
  const K = P(T.ink), L = P(mx(c, '#ffffff', 0.45)), C = P(c), D = P(mx(c, T.ink, 0.35));
  for (let a = -1; a <= size * 2 + 1; a++) for (let b2 = -1; b2 <= size + 1; b2++) {
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
  const K = P(o.ink || T.ink), L = P(mx(c, '#ffffff', 0.4)), C = P(c), D = P(mx(c, T.woodDD, 0.35)), H = P('#ffffff');
  for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) {
    const d = Math.hypot(i, j);
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
// solid disc
export function disc(s, cx, cy, r, c) {
  const v = P(c);
  for (let j = -r; j <= r; j++) { const hw = Math.floor(Math.sqrt(Math.max(0, (r + 0.5) * (r + 0.5) - j * j))); const Y = cy + j; if (Y < 0 || Y >= s.h) continue; for (let X = Math.max(0, cx - hw); X <= Math.min(s.w - 1, cx + hw); X++) s.data[Y * s.w + X] = v; }
}

// ------------------------------------------------------------------ round wooden ring (portraits, dials, round buttons, minimap)
// draws ink + a carved wood ring of thickness th around a disc of radius r (the inside is left alone unless o.fill).
// o: { th (ring px, default 3), color (wood), lit (rim highlight colour), fill (inner disc colour), shadow }
const ringCache = new Map();
function ringSprite(r, th, wood, lit) {
  const key = r + ',' + th + wood + lit;
  let S = ringCache.get(key);
  if (S) return S;
  const R = r + th, mid = P(wood), dk = P(mx(wood, T.woodDD, 0.5)), li = P(lit || mx(wood, T.hi, 0.55)), K = P(T.ink), grooveC = P(mx(wood, T.ink, 0.6)), fl = P(mx(wood, T.woodDD, 0.25));
  const ring = [], shadow = [];
  for (let j = -R - 1; j <= R + 3; j++) for (let i = -R - 1; i <= R + 1; i++) {
    const d = Math.hypot(i, j);
    if (d <= R + 0.5 && d > r - 0.5) {
      let v;
      if (d > R - 0.5) v = K;
      else if (d <= r + 0.5) v = grooveC;
      else { const l = (-i * 0.6 - j) / Math.max(1, d); v = l > 0.45 ? li : l < -0.35 ? dk : mid; if (((Math.atan2(j, i) * 9 + d * 2.3) | 0) % 5 === 0 && th >= 3) v = fl; }
      ring.push(i, j, v);
    }
    const ds = Math.hypot(i, j - 2);
    if (ds <= R + 0.5 && d > R + 0.5) shadow.push(i, j);
  }
  S = { ring: Int32Array.from(ring), shadow: Int32Array.from(shadow) };
  if (ringCache.size > 120) ringCache.clear();
  ringCache.set(key, S);
  return S;
}
// draws ink + a carved wood ring of thickness th around a disc of radius r (the inside is left alone unless o.fill).
// o: { th (ring px, default 3), color (wood), lit (rim highlight colour), fill (inner disc colour), shadow }
export function woodRing(s, cx, cy, r, o = {}) {
  const th = o.th ?? 3, S = ringSprite(r, th, o.color || T.wood, o.lit || '');
  cx |= 0; cy |= 0;
  const D = s.data, SW = s.w, SH = s.h;
  if (o.shadow !== false) { const sh0 = S.shadow; for (let k = 0; k < sh0.length; k += 2) blendRun(s, cx + sh0[k], cx + sh0[k], cy + sh0[k + 1], T.shade, 0.35); }
  if (o.fill) disc(s, cx, cy, r, o.fill);
  const A = S.ring;
  for (let k = 0; k < A.length; k += 3) { const X = cx + A[k], Y = cy + A[k + 1]; if (X >= 0 && Y >= 0 && X < SW && Y < SH) D[Y * SW + X] = A[k + 2] >>> 0; }
}
// run fn with drawing clipped to a disc
export function clipCircle(ui, cx, cy, r, fn) {
  const R = Math.ceil(r);
  ui.clip(cx - R, cy - R, 2 * R + 1, 2 * R + 1, () => {
    fn();
    const s = ui.s;
    for (let j = -R; j <= R; j++) {
      const Y = cy + j; if (Y < 0 || Y >= s.h) continue;
      const hw = Math.floor(Math.sqrt(Math.max(0, (r + 0.5) * (r + 0.5) - j * j)) + 1e-6), row = Y * s.w;
      for (let i = -R; i <= R; i++) if (i < -hw || i > hw) { const X = cx + i; if (X >= 0 && X < s.w) s.data[row + X] = 0; }
    }
  });
}

// ------------------------------------------------------------------ leaves, sprigs, rope
// an almond leaf from base (x, y) pointing at angle ang (radians, 0 = right, −π/2 = up); len, wid in px
const leafCache = new Map();
export function leaf(s, x, y, ang, len = 5, wid = 2, c = T.leaf) {
  const q = Math.round((((ang % 6.2832) + 6.2832) % 6.2832) / 6.2832 * 48) % 48, key = q + ',' + len + ',' + wid + c;
  let A = leafCache.get(key);
  if (!A) {
    const a = q / 48 * 6.2832, ca = Math.cos(a), sa = Math.sin(a), R = Math.ceil(len) + 2;
    const L = P(mx(c, T.leafL, 0.6)), C = P(c), Dk = P(mx(c, T.mossD, 0.6)), K = P(mx(T.ink, T.mossD, 0.3));
    const ins = (i, j) => { const u = i * ca + j * sa, v = -i * sa + j * ca, t = u / len; return t >= -0.05 && t <= 1.05 && Math.abs(v) <= wid * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, t)))), 0.75) + 0.35; };
    const out = [];
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      if (ins(i, j)) { const v = -i * sa + j * ca; out.push(i, j, Math.abs(v) < 0.5 ? C : (v < 0) === (ca >= 0) ? L : Dk); }
      else if (ins(i - 1, j) || ins(i + 1, j) || ins(i, j - 1) || ins(i, j + 1)) out.push(i, j, K);
    }
    A = Int32Array.from(out);
    if (leafCache.size > 600) leafCache.clear();
    leafCache.set(key, A);
  }
  x |= 0; y |= 0;
  const D = s.data, SW = s.w, SH = s.h;
  for (let k = 0; k < A.length; k += 3) { const X = x + A[k], Y = y + A[k + 1]; if (X >= 0 && Y >= 0 && X < SW && Y < SH) D[Y * SW + X] = A[k + 2] >>> 0; }
}
// a twig with alternating leaves that sway gently. dir: +1 grows right, −1 grows left. o: { n leaves, down (hang below), len, berry }
export function sprig(s, x, y, dir = 1, t = 0, o = {}) {
  const n = o.n || 3, len = o.len || n * 4 + 2, tw = P(T.twig), twD = P(T.bark);
  x |= 0; y |= 0;
  for (let i = 0; i < len; i++) { const X = x + i * dir, Y = y + (o.down ? (i > len * 0.6 ? 1 : 0) : (i > len * 0.6 ? -1 : 0)); if (X >= 0 && Y >= 0 && X < s.w && Y < s.h) { s.data[Y * s.w + X] = tw; if (Y + 1 < s.h) s.data[(Y + 1) * s.w + X] = twD; } }
  for (let k = 0; k < n; k++) {
    const along = Math.round(3 + k * ((len - 3) / Math.max(1, n - 1))) - (k === n - 1 ? 1 : 0), up = (k % 2 === 0) !== !!o.down;
    const sway = Math.sin(t * 1.7 + k * 1.3 + x * 0.1) * 0.22;
    const base = dir > 0 ? (up ? -0.75 : 0.65) : (up ? Math.PI + 0.75 : Math.PI - 0.65);
    const ang = (k === n - 1 ? (dir > 0 ? 0 : Math.PI) + (o.down ? 0.3 : -0.3) * dir : base) + sway;
    leaf(s, x + along * dir, y + (along > len * 0.6 ? (o.down ? 1 : -1) : 0), ang, k === n - 1 ? 6 : 5, 2, k % 2 ? T.leaf : T.moss);
  }
  if (o.berry) { const bx = x + Math.round(len * 0.45) * dir, by = y + 3; s.px(bx, by, T.berry); s.px(bx + 1, by, mx(T.berry, T.ink, 0.4)); s.px(bx, by - 1, mx(T.berry, '#ffffff', 0.5)); }
}
// twisted rope between two points (2 px wide)
export function rope(s, x0, y0, x1, y1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), A = P(T.rope), B = P(T.ropeD), C = P(mx(T.rope, '#ffffff', 0.4)), K = P(T.ink);
  const vert = Math.abs(y1 - y0) >= Math.abs(x1 - x0);
  for (let i = 0; i <= n; i++) {
    const X = Math.round(x0 + (x1 - x0) * (i / Math.max(1, n))), Y = Math.round(y0 + (y1 - y0) * (i / Math.max(1, n)));
    const p = i % 3, put = (xx, yy, v) => { if (xx >= 0 && yy >= 0 && xx < s.w && yy < s.h) s.data[yy * s.w + xx] = v; };
    if (vert) { put(X - 1, Y, K); put(X, Y, p === 0 ? B : p === 1 ? C : A); put(X + 1, Y, p === 2 ? B : A); put(X + 2, Y, K); }
    else { put(X, Y - 1, K); put(X, Y, p === 0 ? B : p === 1 ? C : A); put(X, Y + 1, p === 2 ? B : A); put(X, Y + 2, K); }
  }
}

// ------------------------------------------------------------------ full-screen backdrop for modal screens: a forest at dusk
// static gradient + vignette are baked once per size/palette; light shafts, fireflies and falling leaves animate on top
const bdCache = new Map();
function bakeBackdrop(W, H, top, mid, bot) {
  const key = W + 'x' + H + top + mid + bot;
  let B = bdCache.get(key);
  if (B) return B;
  const tmp = { w: W, h: H, data: new Uint32Array(W * H) };
  gradFill(tmp, 0, 0, W, H, [top, mid, bot], 0, 1);
  // soft canopy silhouettes along the top and bushes along the bottom
  const can = P(mx(top, '#0c140c', 0.45)), bush = P(mx(bot, '#0a100a', 0.4));
  for (let x = 0; x < W; x++) {
    const ct = 6 + Math.round(5 * Math.sin(x * 0.07) + 3 * Math.sin(x * 0.19 + 1) + 2 * Math.sin(x * 0.41));
    for (let y = 0; y < ct; y++) tmp.data[y * W + x] = can;
    const bt = H - 10 - Math.round(5 * Math.sin(x * 0.05 + 2) + 3 * Math.sin(x * 0.23) + 2 * Math.sin(x * 0.53 + 1));
    for (let y = Math.max(0, bt); y < H; y++) tmp.data[y * W + x] = bush;
  }
  const vig = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2), d = dx * dx * 0.7 + dy * dy;
    if (d > 0.95 && bayer(x, y) < (d - 0.95) * 1.2) vig.push(y * W + x);
  }
  B = { base: tmp.data, vig: Int32Array.from(vig), band: P(mx(mid, '#f6e6a0', 0.12)) };
  if (bdCache.size > 6) bdCache.clear();
  bdCache.set(key, B);
  return B;
}
export function backdrop(ui, t, o = {}) {
  const s = ui.s, W = ui.w, H = ui.h;
  const B = bakeBackdrop(W, H, o.top || '#3c5a3a', o.mid || '#2a4230', o.bot || '#1a2a1e');
  s.data.set(B.base);
  // slow sun shafts slanting down through the canopy
  const off = Math.floor(t * 4), d = s.data, band = B.band;
  for (let y = 0; y < H; y++) {
    const x0 = ((Math.floor(y * 0.5) - off) % 96 + 96) % 96;
    for (let xs = x0 - 96; xs < W; xs += 96) for (let x = Math.max(0, xs); x < Math.min(W, xs + 18); x++) if (bayer(x, y) < 0.22 * (1 - y / H)) d[y * W + x] = band;
  }
  // fireflies
  for (let i = 0; i < 26; i++) {
    const fx = ((i * 7919) % W + Math.sin(t * 0.6 + i) * 6) | 0, fy = (((i * 4513) % Math.max(1, Math.floor(H * 0.8))) + 10 + Math.cos(t * 0.5 + i * 2) * 4) | 0;
    const ph = Math.sin(t * (1.1 + (i % 4) * 0.3) + i);
    if (ph > 0.5) { s.px(fx, fy, '#fff6b0'); if (ph > 0.85) { s.blend(fx + 1, fy, '#ffe680', 0.6); s.blend(fx - 1, fy, '#ffe680', 0.6); s.blend(fx, fy - 1, '#ffe680', 0.6); s.blend(fx, fy + 1, '#ffe680', 0.6); } }
  }
  // falling leaves, tumbling as they drift
  for (let i = 0; i < 12; i++) {
    const sp = 9 + (i % 4) * 3, fy = ((i * 97 + t * sp) % (H + 20)) - 10, fx = ((i * 211) % W) + Math.sin(t * 0.9 + i) * 10;
    leaf(s, Math.round(fx), Math.round(fy), t * (0.8 + (i % 3) * 0.3) + i, 6, 2.2, [T.leaf, T.moss, T.amber, T.coral][i % 4]);
  }
  const vg = P('#0c120a'), V = B.vig;
  for (let i = 0; i < V.length; i++) d[V[i]] = vg;
  if (o.alpha != null && o.alpha < 1) { const A = Math.round(o.alpha * 255) << 24; for (let i = 0; i < d.length; i++) d[i] = ((d[i] & 0xffffff) | A) >>> 0; }
}
