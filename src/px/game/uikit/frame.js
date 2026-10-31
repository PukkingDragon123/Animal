// Shapes and frames for the UI kit, drawn with Canvas2D at screen resolution (coordinates in UI units).
// The look is the TokoPhone's: chunky rounded panels with a thick indigo ink outline, a glossy white
// plastic bezel and a royal-blue "screen" (or a cream paper card), candy buttons with a darker lip
// that squash when pressed, glossy badges and sparkles. Every panel / button face is painted once into a
// hi-res sprite (gfx.cachedDraw) and blitted after that, so a frame of UI costs a handful of drawImage
// calls. Functions take (ui, …) or (s, …) where s is the ui's canvas surface (s.ui, s.g).
import { T, sh, mx } from './theme.js';
import { css, rgba, rr, circle, vgrad, cachedDraw } from './gfx.js';

// ------------------------------------------------------------------ small helpers
const G = (s) => (s && s.g) || (s && s.ui && s.ui.g);
const U = (s) => (s && s.ui) || s;
function fillC(s, c) { const ui = U(s), g = G(s); if (ui && ui._fs !== c) { g.fillStyle = css(c); ui._fs = c; } else if (!ui) g.fillStyle = css(c); return g; }
function fillA(s, c, a) { const ui = U(s), g = G(s); g.fillStyle = rgba(c, a); if (ui) ui._fs = null; return g; }

// row inset of a rounded rect (kept for older callers that lay things out by it)
const CUT = { 4: [0, 1, 1, 2, 4], 5: [0, 1, 1, 2, 3, 5] };
export function insetOf(j, h, r) {
  if (r <= 3) { const k = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0; return r >= 3 ? [0, 1, 1, 3][k] || 0 : r === 2 ? [0, 1, 2][k] || 0 : r === 1 ? [0, 1][k] || 0 : 0; }
  r = Math.min(r, h >> 1);
  if (CUT[r]) { const k = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0; return CUT[r][k] || 0; }
  const d = j < r ? r - j - 0.5 : j >= h - r ? j - (h - r) + 0.5 : 0;
  return d ? Math.round(r - Math.sqrt(Math.max(0, r * r - d * d))) : 0;
}
export function rfill(s, x, y, w, h, c, r = 2) { const g = fillC(s, c); rr(g, x, y, w, h, r); g.fill(); }
export function blendRun(s, x0, x1, y, c, a) { if (a <= 0) return; fillA(s, c, a).fillRect(x0, y, x1 - x0 + 1, 1); }
export function blendRect(s, x, y, w, h, c, a) { if (a <= 0 || w <= 0 || h <= 0) return; fillA(s, c, Math.min(1, a)).fillRect(x, y, w, h); }
// soft drop shadow of a rounded rect
export function dropShadow(s, x, y, w, h, r = 3, dx = 0, dy = 2, a = 0.4) { const g = fillA(s, T.shade, a * 0.85); rr(g, x + dx, y + dy, w, h, r); g.fill(); }
// vertical gradient through colour stops, clipped to a rounded rect
export function gradFill(s, x, y, w, h, cols, r = 0, alpha = 1) {
  const g = G(s); g.fillStyle = vgrad(g, y, y + h, cols); if (U(s)) U(s)._fs = null;
  const a0 = g.globalAlpha; g.globalAlpha = alpha; rr(g, x, y, w, h, r); g.fill(); g.globalAlpha = a0;
}
export function hgradRun(s, x, y, w, cols, alpha = 1) {
  const g = G(s), gr = g.createLinearGradient(x, 0, x + w, 0), n = cols.length - 1; cols.forEach((c, i) => gr.addColorStop(n ? i / n : 0, css(c)));
  g.fillStyle = gr; if (U(s)) U(s)._fs = null; const a0 = g.globalAlpha; g.globalAlpha = alpha; g.fillRect(x, y, w, 1); g.globalAlpha = a0;
}

// ------------------------------------------------------------------ the panel
// A chunky gadget panel. o: fill (screen colour), paper (cream card; true or a colour), alpha (interior
// translucency), edge (bezel colour: tint it for a highlight / selection), line (outline), shadow, shadowA,
// r (corner radius; pills when r ≥ h/2), thin (slim rims), ornate / leaves (status LEDs on the bezel), big, dots
export function frame(ui, x, y, w, h, o = {}) {
  w = Math.max(2, w); h = Math.max(2, h);
  const big = !o.thin && (o.big || (w >= 28 && h >= 22));
  const r = Math.min(o.r ?? (big ? 7 : h >= 12 ? 5 : 3.5), Math.min(w, h) / 2);
  const paper = o.paper ? (o.paper === true ? T.paper : o.paper) : null;
  const key = 'P' + w + 'x' + h + '|' + r + '|' + (big ? 1 : 0) + (o.thin ? 1 : 0) + '|' + (o.fill || '') + '|' + (paper || '') + '|' + (o.edge || '') + '|' + (o.alpha ?? 1) + '|' + (o.line || '') + '|' + (o.shadow === false ? 0 : o.shadowA ?? 0.4) + ((o.ornate || o.leaves) ? 'L' : '');
  cachedDraw(ui, key, Math.round(x * 4) / 4, Math.round(y * 4) / 4, w, h, 4, (g) => paintPanel(g, w, h, r, big, paper, o));
}
function paintPanel(g, w, h, r, big, paper, o) {
  const ow = o.thin ? 1.1 : big ? 1.7 : 1.35, bz = o.thin ? 1.0 : big ? 2.1 : 1.35;
  if (o.shadow !== false) { g.fillStyle = rgba(T.shade, (o.shadowA ?? 0.4) * 0.9); rr(g, 0, big ? 2.6 : 1.6, w, h, r); g.fill(); }
  g.fillStyle = css(o.line || T.ink); rr(g, 0, 0, w, h, r); g.fill();
  const edge = o.edge || null;
  const bTop = edge ? mx(edge, '#ffffff', 0.55) : '#ffffff', bBot = edge ? edge : paper ? '#e6dcc8' : '#c4d0f4';
  g.fillStyle = vgrad(g, ow, h - ow, [bTop, bTop, bBot]); rr(g, ow, ow, w - ow * 2, h - ow * 2, r - ow * 0.6); g.fill();
  const ix = ow + bz, iy = ow + bz, iw = w - ix * 2, ih = h - iy * 2, ir = Math.max(0.5, r - ow - bz * 0.7);
  if (iw <= 0 || ih <= 0) return;
  const a = o.alpha ?? 1;
  g.save(); rr(g, ix, iy, iw, ih, ir); g.clip();
  if (paper) {
    g.globalAlpha = a; g.fillStyle = vgrad(g, iy, iy + ih, [mx(paper, '#ffffff', 0.6), paper, mx(paper, '#e8dcc0', 0.5)]); g.fillRect(ix, iy, iw, ih);
    if (big) { g.fillStyle = rgba(T.paperE, 0.45); for (let yy = iy + 4; yy < iy + ih; yy += 6) for (let xx = ix + 4 + ((yy / 6) & 1) * 3; xx < ix + iw; xx += 6) { g.beginPath(); g.arc(xx, yy, 0.42, 0, 6.283); g.fill(); } }
  } else {
    const f = o.fill || T.panel;
    g.globalAlpha = a; g.fillStyle = vgrad(g, iy, iy + ih, [mx(f, '#ffffff', 0.16), f, mx(f, T.ink, 0.28)]); g.fillRect(ix, iy, iw, ih);
    if (big) { g.strokeStyle = rgba('#ffffff', 0.05 * a); g.lineWidth = 2.2; g.beginPath(); for (let d = -ih; d < iw + ih; d += 8) { g.moveTo(ix + d, iy); g.lineTo(ix + d - ih, iy + ih); } g.stroke(); }
    g.globalAlpha = 1;
    // gloss across the top of the screen + an inner shade under the bezel
    g.fillStyle = rgba('#ffffff', 0.1 * a); rr(g, ix + 1, iy + 0.6, iw - 2, Math.min(big ? 11 : 5, ih * 0.42), ir); g.fill();
    g.strokeStyle = rgba(T.ink, 0.4 * a); g.lineWidth = big ? 1.2 : 0.8; rr(g, ix - 0.2, iy - 0.2 + (big ? 0.5 : 0.3), iw + 0.4, ih + 0.4, ir); g.stroke();
  }
  g.restore();
  if (o.ornate || o.leaves) { const ly = ow + bz / 2; [['#ff4d6a', 0], ['#ffc93a', 4], ['#5fdc4a', 8]].forEach(([c, dx]) => { g.fillStyle = css(T.ink); circle(g, w - 16 + dx, ly, 1.6); g.fill(); g.fillStyle = css(c); circle(g, w - 16 + dx, ly, 1.05); g.fill(); g.fillStyle = 'rgba(255,255,255,0.8)'; circle(g, w - 16.4 + dx, ly - 0.4, 0.35); g.fill(); }); }
}

// ------------------------------------------------------------------ candy button faces
// o: { color, lip, r, state: 0 rest | 1 over | 2 down | 3 disabled, active, ring (selection halo colour) }
export function candy(ui, x, y, w, h, o = {}) {
  const st = o.state || 0, col = st === 3 ? '#9aa0c0' : o.color || T.blue, lip = o.lip ?? (h >= 13 ? 3 : 2), r = Math.min(o.r ?? (h >= 16 ? 6 : 4.5), h / 2);
  const key = 'C' + w + 'x' + h + '|' + col + '|' + st + '|' + lip + '|' + r + (o.active ? 'A' : '');
  cachedDraw(ui, key, x, y, w, h, 3, (g) => paintCandy(g, w, h, col, lip, r, st, o.active));
}
function paintCandy(g, w, h, col, lip, r, st, active) {
  const ow = 1.3, down = st === 2, fy = down ? lip - 1 : 0, fh = h - lip;
  g.fillStyle = rgba(T.shade, 0.35); rr(g, 0, 1.6, w, h, r); g.fill();
  g.fillStyle = css(T.ink); rr(g, 0, 0, w, h, r); g.fill();
  g.fillStyle = css(mx(col, T.ink, 0.42)); rr(g, ow, ow, w - ow * 2, h - ow * 2, r - ow * 0.6); g.fill();
  const face = st === 1 ? mx(col, '#ffffff', 0.14) : col;
  g.fillStyle = css(T.ink); rr(g, 0, fy, w, fh + (down ? 0 : ow * 0.4), r); g.fill();
  g.fillStyle = vgrad(g, fy + ow, fy + fh - ow, [mx(face, '#ffffff', 0.38), face, mx(face, T.ink, 0.12)]);
  rr(g, ow, fy + ow, w - ow * 2, fh - ow * 2 + 0.6, r - ow * 0.6); g.fill();
  if (st !== 3) {
    g.fillStyle = 'rgba(255,255,255,0.42)'; rr(g, ow + 1.6, fy + ow + 0.9, w - ow * 2 - 3.2, Math.max(1.2, (fh - ow * 2) * 0.38), Math.max(0.5, r - 2.2)); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.9)'; circle(g, ow + Math.min(4, r) + 0.6, fy + ow + 2.2, 0.8); g.fill();
  }
  if (active) { g.strokeStyle = '#ffffff'; g.lineWidth = 1.1; rr(g, ow + 0.9, fy + ow + 0.9, w - ow * 2 - 1.8, fh - ow * 2 - 1.2, r - 1.6); g.stroke(); }
}

// ------------------------------------------------------------------ shapes
export function nails() {}
export function caps() {}
// faceted diamond gem with ink rim
export function gem(s, cx, cy, c, r = 3) {
  const g = G(s); cx += 0.5; cy += 0.5;
  const dia = (rad) => { g.beginPath(); g.moveTo(cx, cy - rad); g.lineTo(cx + rad, cy); g.lineTo(cx, cy + rad); g.lineTo(cx - rad, cy); g.closePath(); };
  fillC(s, T.ink); dia(r + 0.9); g.fill();
  fillC(s, c); dia(r); g.fill();
  fillA(s, '#ffffff', 0.6); g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx - r, cy); g.lineTo(cx, cy); g.closePath(); g.fill();
}
export function pattern(s, x, y, w, h, c, alpha = 1) { const g = fillA(s, c, alpha * 0.6); for (let j = 0; j < h; j += 4) for (let i = ((j / 4) & 1) * 3; i < w; i += 6) g.fillRect(x + i, y + j, 1, 1); }
// triangle cursor with ink outline. dir: 'right' | 'down' | 'left' | 'up'; size = half-height
export function tri(s, x, y, dir, size, c) {
  const g = G(s), S = size, L = size * 2;
  const pts = dir === 'right' ? [[x, y], [x + S + 0.5, y + S], [x, y + L]] : dir === 'left' ? [[x + S, y], [x - 0.5, y + S], [x + S, y + L]] : dir === 'down' ? [[x, y], [x + L, y], [x + S, y + S + 0.5]] : [[x, y + S], [x + L, y + S], [x + S, y - 0.5]];
  const path = () => { g.beginPath(); g.moveTo(pts[0][0] + 0.5, pts[0][1] + 0.5); g.lineTo(pts[1][0] + 0.5, pts[1][1] + 0.5); g.lineTo(pts[2][0] + 0.5, pts[2][1] + 0.5); g.closePath(); };
  path(); g.lineJoin = 'round'; g.strokeStyle = css(T.ink); g.lineWidth = 1.6; g.stroke();
  fillC(s, c); path(); g.fill();
}
// sparkle (4-point star) for flourishes; k 0..1 = size phase
export function sparkle(s, x, y, c, k = 1) {
  if (k <= 0.02) return;
  const g = G(s), r = 0.8 + k * 2.4, w = r * 0.28; x += 0.5; y += 0.5;
  const star = (R, W) => { g.beginPath(); g.moveTo(x, y - R); g.quadraticCurveTo(x + W, y - W, x + R, y); g.quadraticCurveTo(x + W, y + W, x, y + R); g.quadraticCurveTo(x - W, y + W, x - R, y); g.quadraticCurveTo(x - W, y - W, x, y - R); g.closePath(); };
  fillC(s, c); star(r, w); g.fill();
  fillC(s, '#ffffff'); star(r * 0.55, w * 0.6); g.fill();
}
// glossy disc (badges, knobs, beads) with an ink rim; light from the top-left
export function ball(s, cx, cy, r, c, o = {}) {
  const g = G(s); cx += 0.5; cy += 0.5;
  fillC(s, o.ink || T.ink); circle(g, cx, cy, r + 0.9); g.fill();
  const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  gr.addColorStop(0, css(mx(c, '#ffffff', 0.45))); gr.addColorStop(0.55, css(c)); gr.addColorStop(1, css(mx(c, T.ink, 0.3)));
  g.fillStyle = gr; if (U(s)) U(s)._fs = null; circle(g, cx, cy, r); g.fill();
  if (r >= 2.5) { fillA(s, '#ffffff', 0.85); g.beginPath(); g.ellipse(cx - r * 0.38, cy - r * 0.45, r * 0.28, r * 0.18, -0.6, 0, 6.283); g.fill(); }
}
export function ringPx(s, cx, cy, r, c, a = 1) { const g = G(s); g.strokeStyle = rgba(c, a); g.lineWidth = 1; circle(g, cx + 0.5, cy + 0.5, r); g.stroke(); }
export function discA(s, cx, cy, r, c, a) { const g = fillA(s, c, a); circle(g, cx + 0.5, cy + 0.5, r + 0.5); g.fill(); }
export function disc(s, cx, cy, r, c) { const g = fillC(s, c); circle(g, cx + 0.5, cy + 0.5, r + 0.5); g.fill(); }
// a round badge rim: ink + a white plastic ring of thickness th around a disc of radius r (inside left alone unless o.fill)
// o: { th (ring units, default 3), color (ring colour), fill (inner disc colour), shadow }
export function woodRing(s, cx, cy, r, o = {}) {
  const g = G(s), th = o.th ?? 3, R = r + th; cx += 0.5; cy += 0.5;
  if (o.shadow !== false) { fillA(s, T.shade, 0.35); circle(g, cx, cy + 1.8, R + 0.6); g.fill(); }
  fillC(s, T.ink); circle(g, cx, cy, R + 0.6); g.fill();
  const rc = o.color || '#ffffff', gr = g.createLinearGradient(0, cy - R, 0, cy + R);
  gr.addColorStop(0, css(mx(rc, '#ffffff', 0.5))); gr.addColorStop(1, css(rc === '#ffffff' ? '#c4d0f4' : mx(rc, T.ink, 0.25)));
  g.fillStyle = gr; if (U(s)) U(s)._fs = null; circle(g, cx, cy, R - 0.3); g.fill();
  fillC(s, T.ink); circle(g, cx, cy, r + 0.55); g.fill();
  if (o.fill) { fillC(s, o.fill); circle(g, cx, cy, r); g.fill(); }
}
// run fn with drawing clipped to a disc
export function clipCircle(ui, cx, cy, r, fn) {
  const g = ui.g; g.save(); circle(g, cx + 0.5, cy + 0.5, r + 0.5); g.clip();
  try { fn(); } finally { g.restore(); ui._fs = null; ui._font = null; }
}
// a leaf (kept for older callers): an almond shape from base (x, y) toward angle ang
export function leaf(s, x, y, ang, len = 5, wid = 2, c = T.leaf) {
  const g = G(s); g.save(); g.translate(x + 0.5, y + 0.5); g.rotate(ang);
  const path = () => { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -wid * 1.3, len, 0); g.quadraticCurveTo(len * 0.5, wid * 1.3, 0, 0); g.closePath(); };
  path(); g.strokeStyle = css(T.ink); g.lineWidth = 1.2; g.stroke(); g.fillStyle = css(c); g.fill();
  g.restore(); if (U(s)) U(s)._fs = null;
}
export function sprig() {}
export function rope(s, x0, y0, x1, y1) { const g = G(s); g.strokeStyle = css(T.ink); g.lineWidth = 2.2; g.beginPath(); g.moveTo(x0 + 0.5, y0); g.lineTo(x1 + 0.5, y1); g.stroke(); g.strokeStyle = css(T.rope); g.lineWidth = 1.1; g.stroke(); }

// ------------------------------------------------------------------ full-screen backdrop for modal screens
// a bright gadget wallpaper: a candy gradient, slowly scrolling diagonal stripes and drifting bubbles + stars
let stripeTile = null;
export function backdrop(ui, t, o = {}) {
  const g = ui.g, W = ui.w, H = ui.h;
  g.fillStyle = vgrad(g, 0, H, [o.top || '#5a6cf0', o.mid || '#3f4fd0', o.bot || '#2a2f9a']); ui._fs = null;
  g.globalAlpha = o.alpha ?? 1; g.fillRect(0, 0, W, H);
  // stripes
  g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();
  g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 9; const off = (t * 8) % 26;
  g.beginPath(); for (let d = -H - 26 + off; d < W + H; d += 26) { g.moveTo(d, 0); g.lineTo(d + H, H); } g.stroke();
  g.restore();
  // bubbles and twinkles
  for (let i = 0; i < 14; i++) {
    const bx = ((i * 97.3) % W) + Math.sin(t * 0.5 + i) * 8, by = H - ((t * (6 + (i % 5) * 3) + i * 41) % (H + 30)) + 15, r = 2 + (i % 4) * 1.6;
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1; circle(g, bx, by, r); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; circle(g, bx - r * 0.35, by - r * 0.35, r * 0.25); g.fill();
  }
  for (let i = 0; i < 10; i++) { const ph = (Math.sin(t * (1.2 + (i % 3) * 0.4) + i * 2.1) + 1) / 2; if (ph > 0.55) sparkle(ui.s, (i * 151) % W, (i * 67) % Math.round(H * 0.8) + 8, '#fff3b8', (ph - 0.55) * 2.2); }
  g.globalAlpha = 1; ui._fs = null;
  // vignette
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(10,8,32,0)'); vg.addColorStop(1, 'rgba(10,8,32,0.45)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  void stripeTile; void sh;
}
export function woodTex() { return null; }
export function paperTex() { return null; }
