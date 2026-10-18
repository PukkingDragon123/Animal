// Dotonbori canal street, Osaka 2050, at dusk tipping into night. The camera stands
// on the south bank looking north (the classic Ebisu-bashi view):
//   y   0–204  the north-bank wall of shopfronts with their giant original signs,
//              the dusk sky, far towers, the oval wheel and an idol hologram behind
//   y 204–290  Dotonbori street (granite setts, tactile line, the painted battle court)
//   y 290–336  the riverwalk boardwalk with lantern posts, benches, a kushikatsu yatai
//   y 336–352  the stone embankment face, y 352–432 the canal full of neon reflections
//   x 598–718  Ebisu bridge across the canal;  y 432–500 the south promenade
import { Scene2D } from '../../px/scene2d.js';
import { Pen, shift, mix, newSurf } from '../../px/paint.js';
import { noise2 } from '../../px/surface.js';
import * as PR from '../../px/props.js';
import * as D from './dotonbori_props.js';

const { K } = D;
export const DOTONBORI = { w: 880, h: 500 };
const W = DOTONBORI.w, FB = 204, CURB = 290, BW0 = 294, RAIL = 336, WATER0 = 352, WATER1 = 432, SOUTH = 437;
const BR0 = 598, BR1 = 718;                      // Ebisu bridge
const SHOP = 178, FASC = 166;                     // shopfront / fascia rows on every building

// ------------------------------------------------------------------ helpers
const rgbOf = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255];
const packRGB = (r, g, b) => ((255 << 24) | ((Math.max(0, Math.min(255, b | 0))) << 16) | ((Math.max(0, Math.min(255, g | 0))) << 8) | Math.max(0, Math.min(255, r | 0))) >>> 0;
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// lit shop interior with a door, mullions, glass glints; inside(p, gx, gy, gw, gh) paints contents
function shopfront(R, x, y, w, h, o = {}) {
  R.rect(x - 1, y - 1, w + 2, h + 1, K.ink);
  R.vgrad(x, y, w, h, o.grad || ['#fff2cc', '#f4c888', '#c88a58']);
  if (o.inside) o.inside(R, x, y, w, h);
  if (o.door != null) {
    const dx = x + o.door, dw = o.doorW || 12;
    R.rect(dx - 1, y, dw + 2, h, K.ink2); R.vgrad(dx, y + 1, dw, h - 1, o.doorGrad || ['#fff6dc', '#e8b880']);
    R.vl(dx + (dw >> 1), y + 1, y + h - 1, K.ink2); R.px(dx + (dw >> 1) - 2, y + (h >> 1), '#c8c8d8'); R.px(dx + (dw >> 1) + 2, y + (h >> 1), '#c8c8d8');
  }
  for (const mx of o.mullions || []) R.vl(x + mx, y, y + h - 1, K.ink2);
  for (let k = 3; k < w; k += 11) { R.px(x + k, y + 1, '#ffffff'); R.px(x + k + 1, y + 2, mix('#ffffff', o.grad ? o.grad[0] : '#fff2cc', 0.5)); }
  R.hl(x - 1, x + w, y + h, '#5a5668'); R.hl(x - 1, x + w, y + h + 1, '#3a3646');   // threshold step
}
function people(R, x, y, w, col, n = 2) {       // silhouettes inside a lit room
  for (let k = 0; k < n; k++) { const px = x + Math.round((k + 0.5) * w / n) + R.ri(-2, 2), hh = R.ri(0, 2); R.ell(px, y - 9 - hh, 2.4, 2.6, col); R.rect(px - 3, y - 6 - hh, 7, 6 + hh, col); R.px(px - 1, y - 11 - hh, mix(col, '#ffffff', 0.25)); }
}
function shelves(R, x, y, w, h, cols) {
  for (let j = y + 5; j < y + h - 1; j += 6) { R.hl(x + 1, x + w - 2, j, '#8a6a58'); for (let i = x + 2; i < x + w - 2; i += 2) if (R.chance(0.75)) { const c = R.pick(cols), hh = R.ri(2, 4); R.rect(i, j - hh, 2, hh, c); R.px(i, j - hh, mix(c, '#ffffff', 0.4)); } }
}
function upperWindows(R, x, w, y0, y1, o) {
  const fh = o.fh || 26, n = o.n || 3, ww = o.ww || 15, wh = o.wh || 13, xs = o.xs;
  let f = 0;
  for (let fy = y0; fy + wh + 6 <= y1; fy += fh, f++) {
    const gap = (w - n * ww) / (n + 1);
    for (let k = 0; k < n; k++) {
      const wx = xs ? x + xs[k] : Math.round(x + gap + k * (ww + gap));
      const lit = R.chance(o.litP ?? 0.55);
      D.nWin(R, wx, fy + 4, ww, wh, { lit: lit ? R.pick(o.lights || [K.win, K.win, '#ffc478', '#ffe0a8', '#b8dcff']) : null, frame: o.frame, refl: o.refl });
      if (o.ac && R.chance(0.4) && wx + ww + 15 < x + w) D.acNight(R, wx + ww + 2, fy + 9, o.wall);
    }
    if (o.ledges !== false) D.ledge(R, x, w, fy + fh - 4, o.wall);
  }
}

// ------------------------------------------------------------------ the backdrop (sky, far city, wheel, hologram)
function backdrop(g, night) {
  g.vgrad(0, 0, W, FB, night
    ? ['#0a0820', '#100c2e', '#18123e', '#24184e', '#341e5a', '#4c2462', '#702c66', '#9a3a64']
    : ['#1a1446', '#261a58', '#3a2268', '#562a72', '#7a3474', '#a84270', '#d05a68', '#f08a64']);
  // stars (only high up), a few twinklers
  for (let k = 0; k < 70; k++) { const x = g.ri(0, W - 1), y = g.ri(0, 70); g.px(x, y, y < 40 ? '#7a74b8' : '#5e528e'); }
  for (const [x, y] of [[44, 12], [312, 8], [418, 22], [560, 6], [700, 14], [846, 30], [268, 40]]) { g.px(x, y, '#f4f0ff'); g.px(x - 1, y, '#8a84c8'); g.px(x + 1, y, '#8a84c8'); g.px(x, y - 1, '#8a84c8'); g.px(x, y + 1, '#8a84c8'); }
  // crescent moon over the octopus building, top-left light source of the scene
  { const mx = 230, my = 20; g.ell(mx, my, 8, 8, '#fff2d2'); g.ell(mx - 2, my - 2, 4, 4, '#ffffff'); g.ell(mx + 4, my - 2, 7.4, 7.6, '#120e30'); g.px(mx - 6, my + 3, '#e8d8b8'); }
  // far skyline: soft violet silhouettes with sparse dim windows
  const far = (x, w, top, col, win) => {
    g.rect(x, top, w, FB - top, col); g.hl(x, x + w - 1, top, shift(col, 0.4));
    for (let j = top + 3; j < FB; j += 4) for (let i = x + 2; i < x + w - 2; i += 3) if (g.chance(0.22)) g.rect(i, j, 2, 1, g.chance(0.7) ? win : mix(win, '#ffffff', 0.4));
  };
  for (let x = -10; x < W; ) { const w = g.ri(16, 40), top = g.ri(58, 120); far(x, w, top, '#2c2258', '#5a4682'); if (g.chance(0.3)) { g.vl(x + (w >> 1), top - 10, top, '#2c2258'); g.px(x + (w >> 1), top - 11, '#ff4a5a'); } x += w + g.ri(-4, 2); }
  for (let x = -6; x < W; ) { const w = g.ri(20, 46), top = g.ri(92, 150); far(x, w, top, '#1e183e', '#8a6a6a'); x += w + g.ri(0, 6); }
  // 2050 towers: slender, LED crowns
  const tower = (x, w, top, crown) => {
    g.rect(x, top, w, FB - top, '#1a1534'); g.vl(x, top, FB, '#3a2c5e'); g.vl(x + w - 1, top, FB, '#120e24');
    for (let j = top + 8; j < FB; j += 5) for (let i = x + 2; i < x + w - 2; i += 2) if ((i + j) % 7 < 3) g.px(i, j, '#4a6a9a');
    for (let i = x - 2; i < x + w + 2; i++) { g.px(i, top + 2, crown); g.px(i, top + 5, (i % 2) ? crown : '#1a1534'); }
    g.vl(x + (w >> 1), top - 16, top, '#4a4060'); g.px(x + (w >> 1), top - 17, '#ff3a4a');
  };
  tower(470, 20, 22, K.nc); tower(296, 16, 44, K.nm); tower(22, 18, 12, K.ny);
  // maglev viaduct + a train sliding across behind the roofs
  g.rect(0, 64, W, 3, '#2a2246'); g.hl(0, W - 1, 64, '#4a3a6e'); for (let x = 12; x < W; x += 46) g.rect(x, 67, 4, FB - 67, '#211a3c');
  g.rect(262, 58, 80, 6, '#d8d8ec'); g.hl(262, 341, 58, '#ffffff'); for (let x = 265; x < 340; x += 5) g.rect(x, 60, 3, 2, '#7af0ff'); g.poly([[342, 58], [352, 63], [342, 64]], '#d8d8ec'); g.hl(262, 341, 63, '#8a8aa8');
  // oval wheel on a far building (behind the submarine)
  { const cx = 126, cy = 62, rx = 30, ry = 36;
    for (let a = 0; a < 16; a++) { const t = (a / 16) * Math.PI * 2; g.line(cx, cy, Math.round(cx + Math.cos(t) * rx), Math.round(cy + Math.sin(t) * ry), '#3e3266'); }
    g.s.ring(cx, cy, rx, ry, '#5a4686'); g.s.ring(cx, cy, rx - 2, ry - 2, '#3e3266');
    for (let a = 0; a < 48; a++) { const t = (a / 48) * Math.PI * 2; g.px(Math.round(cx + Math.cos(t) * rx), Math.round(cy + Math.sin(t) * ry), a % 2 ? '#ffd84a' : '#ff8a3c'); }
    for (let a = 0; a < 12; a++) { const t = (a / 12) * Math.PI * 2 + 0.2, gx = Math.round(cx + Math.cos(t) * (rx + 1)), gy = Math.round(cy + Math.sin(t) * (ry + 1)); g.rect(gx - 1, gy + 1, 3, 3, a % 3 ? '#e85a8a' : '#5ac8e8'); }
    g.ell(cx, cy, 3, 3, '#ffd84a'); g.px(cx, cy, '#ffffff');
    g.rect(cx - 30, cy + ry + 2, 60, FB - cy - ry - 2, '#1e1838'); }
  // idol hologram (Lumi★) projected above the okonomiyaki roof: translucent, scanlined
  { const hx = 834, top = 6, C1 = '#7af8ff', C2 = '#ff7ae0', CW = '#eaffff';
    g.washPoly([[hx - 3, 100], [hx + 3, 100], [hx + 26, 84], [hx - 26, 84]], C1, 0.12);
    const fig = newSurf(64, 86), f = new Pen(fig, 9);
    // twin-tails, head, fringe + star clip
    f.poly([[22, 8], [12, 30], [8, 44], [14, 40], [20, 22]], C2); f.poly([[42, 8], [52, 30], [56, 44], [50, 40], [44, 22]], C2);
    f.ell(32, 12, 9, 10, C1); f.ell(32, 8, 9.5, 6, C2); f.px(37, 3, CW); f.px(36, 4, CW); f.px(38, 4, CW); f.px(37, 5, CW);
    f.px(28, 13, '#103040'); f.px(35, 13, '#103040'); f.hl(30, 33, 17, C2);
    // torso, frilled dress, legs, boots
    f.poly([[26, 22], [38, 22], [40, 38], [24, 38]], C1); f.hl(26, 37, 24, CW);
    f.poly([[22, 38], [42, 38], [52, 58], [12, 58]], C2); for (let i = 14; i < 51; i += 4) f.px(i, 57, CW); f.line(24, 40, 18, 56, '#c858c0'); f.line(40, 40, 46, 56, '#c858c0');
    f.rect(25, 58, 5, 18, C1); f.rect(34, 58, 5, 18, C1); f.rect(24, 72, 7, 5, C2); f.rect(33, 72, 7, 5, C2);
    // one arm up with the mic, one on the hip
    f.line(38, 25, 46, 14, C1); f.line(39, 26, 47, 15, C1); f.ell(48, 12, 2.4, 2.4, CW); f.line(48, 14, 48, 17, '#8ad0e0');
    f.line(26, 25, 20, 32, C1); f.line(20, 32, 25, 36, C1);
    // projection ring
    f.s.ring(32, 81, 24, 4, C1); f.s.ring(32, 81, 18, 3, C2);
    for (let j = 0; j < 86; j++) for (let i = 0; i < 64; i++) { const v = fig.get(i, j); if (!(v >>> 24) || j % 3 === 2) continue; g.blend(hx - 32 + i, top + j, rgbOf(v), j % 3 ? 0.62 : 0.4); }
    g.text('LUMI', hx - 40, top + 30, C2, { mini: true }); g.px(hx - 24, top + 31, '#ffe45c');
  }
}

// ------------------------------------------------------------------ ground
function setts(g, x, y, w, h) {
  const tones = ['#363244', '#3c3749', '#423c4f', '#484156', '#4e4659'];
  for (let j = y, r = 0; j < y + h; j += 5, r++) {
    let i = x - ((r * 4) % 9);
    while (i < x + w) {
      const sw = g.ri(6, 10), n = noise2(i * 0.035, j * 0.06, 5) * 0.75 + g.rand(0, 0.35);
      const base = tones[Math.max(0, Math.min(4, Math.floor(n * 5 - 0.6)))];
      g.rect(i, j, sw - 1, 4, base);
      g.hl(i, i + sw - 3, j, shift(base, 0.35)); g.px(i, j + 1, shift(base, 0.2));
      g.hl(i + 1, i + sw - 2, j + 3, shift(base, -0.3));
      g.vl(i + sw - 1, j, j + 4, '#24202e'); g.hl(i, i + sw - 1, j + 4, '#24202e');
      i += sw;
    }
  }
}
function streetSlabs(g, x, y, w, h) {   // granite street slabs (big, quiet), worn lighter down the middle
  const tones = ['#3a3648', '#3e3a4c', '#423d50', '#464054'];
  for (let j = y, r = 0; j < y + h; j += 9, r++) for (let i = x - (r % 2) * 9 - (r % 3) * 3; i < x + w; i += 18) {
    const n = noise2(i * 0.03, j * 0.05, 19) * 0.7 + g.rand(0, 0.4), b = tones[Math.max(0, Math.min(3, Math.floor(n * 4 - 0.4)))];
    const hh = Math.min(8, y + h - j - 1);
    g.rect(i, j, 17, hh, b); g.hl(i + 1, i + 14, j, shift(b, 0.22)); g.px(i, j + 1, shift(b, 0.15));
    g.hl(i, i + 17, j + hh, '#2a2634'); g.vl(i + 17, j, j + hh, '#2a2634');
    if (g.chance(0.18)) { const cx = i + g.ri(3, 13), cy = j + g.ri(2, 6); g.px(cx, cy, shift(b, -0.5)); g.px(cx + 1, cy, shift(b, -0.4)); }      // pits
    if (g.chance(0.06)) { let cx = i + g.ri(2, 14), cy = j + 1; for (let k2 = 0; k2 < 6 && cy < j + hh; k2++) { g.px(cx, cy, '#2a2634'); cx += g.ri(-1, 1); cy++; } }   // crack
  }
}
function planks(g, x, y, w, h) {
  const tones = ['#4e362f', '#563c33', '#5e4236', '#664839'];
  for (let j = y; j < y + h; j += 4) {
    let i = x - g.ri(0, 50);
    while (i < x + w) {
      const L = g.ri(24, 64), base = tones[Math.floor((noise2(i * 0.02, j * 0.1, 11) * 0.7 + g.rand(0, 0.45)) * 4) % 4];
      g.rect(i, j, L - 1, 3, base); g.hl(i, i + L - 2, j, shift(base, 0.45)); g.hl(i, i + L - 2, j + 2, shift(base, -0.25));
      if (g.chance(0.5)) { const kx = i + g.ri(4, L - 6); g.px(kx, j + 1, shift(base, -0.6)); g.px(kx + 1, j + 1, shift(base, -0.4)); }   // knots / grain
      g.vl(i + L - 1, j, j + 2, '#22161a'); g.px(i + 1, j + 1, '#9a8478'); g.px(i + L - 3, j + 1, '#9a8478');
      i += L;
    }
    g.hl(x, x + w - 1, j + 3, '#22161a');
  }
}
function slabs(g, x, y, w, h, base, sw = 16, sh = 6) {
  for (let j = y, r = 0; j < y + h; j += sh, r++) for (let i = x - (r % 2) * (sw >> 1); i < x + w; i += sw) {
    const b = noise2(i * 0.05, j * 0.08, 13) > 0.6 ? shift(base, 0.15) : noise2(i * 0.05, j * 0.08, 17) > 0.65 ? shift(base, -0.15) : base;
    g.rect(i, j, sw - 1, sh - 1, b); g.hl(i, i + sw - 3, j, shift(b, 0.35)); g.hl(i, i + sw - 1, j + sh - 1, shift(base, -0.8)); g.vl(i + sw - 1, j, j + sh - 1, shift(base, -0.8));
  }
}
function tactile(g, x0, x1, y) {     // yellow guide-block line (night-dimmed)
  for (let i = x0; i < x1; i += 6) { g.rect(i, y, 5, 5, '#9a7c2a'); g.hl(i, i + 4, y, '#b8962e'); g.hl(i, i + 4, y + 4, '#6a5420'); for (const [a, b] of [[1, 1], [3, 1], [1, 3], [3, 3]]) g.px(i + a, y + b, '#d0ac3a'); }
}
function manhole(g, cx, cy) {
  g.ell(cx, cy, 11, 6, '#22202c'); g.ell(cx, cy, 10, 5.2, '#4a4658'); g.ell(cx, cy, 8, 4, '#3e3a4c');
  for (let k = -6; k <= 6; k += 3) g.hl(cx + k - 1, cx + k + 1, cy - 2 + (Math.abs(k) % 2), '#5a5668');
  g.ell(cx, cy, 3.4, 1.8, '#56526a'); g.px(cx - 1, cy, '#2a2836'); g.px(cx + 1, cy, '#2a2836'); g.hl(cx - 9, cx + 6, cy - 4, '#625e74');
}
function puddle(g, cx, cy, rx, ry, cols) {
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
    const d = (i * i) / (rx * rx) + (j * j) / (ry * ry) + noise2((cx + i) * 0.3, (cy + j) * 0.5, 3) * 0.35; if (d > 1) continue;
    const c = cols[Math.abs(Math.floor((cx + i) / 3)) % cols.length], streak = (Math.floor((cx + i) / 2) % 3 === 0) && j % 2 === 0;
    g.px(cx + i, cy + j, streak ? c : d > 0.75 ? '#2a2a40' : '#161828');
  }
  g.hl(cx - rx + 2, cx - rx + 5, cy - ry + 1, '#8aa8c8');
}
function batteryCourt(g, x0, y0, x1, y1) {   // the League's painted street-battle court, worn by feet
  const paint = (x, y, a = 0.42) => { if (noise2(x * 0.25, y * 0.25, 21) > 0.7) return; g.blend(x, y, '#e8e0f0', a); };
  for (let x = x0; x <= x1; x++) { paint(x, y0); paint(x, y1); }
  for (let y = y0; y <= y1; y++) { paint(x0, y); paint(x1, y); }
  const cx = (x0 + x1) >> 1, cy = (y0 + y1) >> 1;
  for (let y = y0; y <= y1; y += 2) paint(cx, y, 0.3);
  for (let a = 0; a < 140; a++) { const t = (a / 140) * Math.PI * 2; paint(Math.round(cx + Math.cos(t) * 22), Math.round(cy + Math.sin(t) * 13)); paint(Math.round(cx + Math.cos(t) * 8), Math.round(cy + Math.sin(t) * 5), 0.55); }
  for (const sx of [x0 + 28, x1 - 28]) for (let y = cy - 8; y <= cy + 8; y++) { paint(sx, y, 0.5); paint(sx + 1, y, 0.3); }
  // corner chevrons in League cyan
  for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) for (let k = 2; k < 9; k++) { g.blend(x + dx * k, y + dy * 2, K.nc, 0.35); g.blend(x + dx * 2, y + dy * k, K.nc, 0.35); }
  g.text('BATTLE ZONE', cx - 21, y1 - 9, '#e8e0f0', { mini: true });
}
function embankment(g, y0, y1) {
  g.rect(0, y0, W, y1 - y0, '#34303f');
  for (let j = y0, r = 0; j < y1; j += 5, r++) for (let i = -(r % 2) * 7; i < W; i += 14) {
    const b = noise2(i * 0.05, j * 0.2, 31) > 0.55 ? '#3c3748' : noise2(i * 0.04, j * 0.2, 37) > 0.6 ? '#2e2a38' : '#36323f';
    g.rect(i, j, 13, 4, b); g.hl(i, i + 11, j, shift(b, 0.4)); g.vl(i + 13, j, j + 4, '#1e1a26'); g.hl(i, i + 13, j + 4, '#1e1a26');
  }
  // capstones on top (lit edge) and a wet, slimy waterline
  g.rect(0, y0 - 2, W, 3, '#58546a'); g.hl(0, W - 1, y0 - 2, '#7a7690'); g.hl(0, W - 1, y0, '#3a3648');
  for (let x = 0; x < W; x++) { const n = noise2(x * 0.12, 1, 41); g.px(x, y1 - 1, '#16141e'); if (n > 0.45) g.px(x, y1 - 2, '#1e2a26'); if (n > 0.62) g.px(x, y1 - 3, '#28402e'); }
  // drain outlets with drips, mooring rings, an iron ladder, moss
  for (const dx of [70, 262, 452, 790]) { g.ell(dx, y0 + 6, 3, 2.4, '#14121a'); g.ell(dx, y0 + 6, 2, 1.4, '#0c0a10'); g.px(dx - 2, y0 + 4, '#4a4658'); for (let j = y0 + 8; j < y1 - 1; j += 2) g.px(dx, j, '#2a3a4a'); g.vl(dx - 1, y0 + 8, y1 - 2, '#22303c'); }
  for (const rx of [140, 380, 560, 840]) { g.s.ring(rx, y0 + 8, 2, 2, '#6a6478'); g.px(rx, y0 + 6, '#9a94a8'); }
  for (const lx of [176, 742]) { g.vl(lx, y0 - 1, y1, '#4a4656'); g.vl(lx + 5, y0 - 1, y1, '#4a4656'); for (let j = y0 + 1; j < y1; j += 3) g.hl(lx, lx + 5, j, '#6a6678'); }
  for (let k = 0; k < 40; k++) { const x = g.ri(0, W - 1); g.px(x, y0 + 1, '#3a5a3a'); if (g.chance(0.5)) g.px(x + 1, y0 + 1, '#4a6a40'); }
}

// ------------------------------------------------------------------ the buildings (painted into one facade card)
function bKaraoke(R, x, w, top, glow) {
  const wall = '#3e3654';
  D.wallTex(R, x, top, w, FB - top, wall, 'tile', { tw: 6, th: 5 });
  D.parapet(R, x, top, w, wall, { rail: true });
  // rooftop crown neon + QUEEN
  R.rect(x + 8, top - 4, 2, 4, K.steelD); R.rect(x + 40, top - 4, 2, 4, K.steelD);
  const cy = top - 6, crown = [[x + 6, cy], [x + 8, cy - 14], [x + 15, cy - 7], [x + 24, cy - 19], [x + 33, cy - 7], [x + 40, cy - 14], [x + 42, cy]];
  D.tube(R, crown.concat([[x + 6, cy]]), K.ny);
  for (const [px, py] of [crown[1], crown[3], crown[5]]) { R.ell(px, py - 2, 2, 2, K.nm); R.px(px, py - 2, '#ffffff'); }
  D.neonText(R, 'QUEEN', x + 46, top - 18, K.nm, { thin: true });
  glow(x + 24, top - 12, 26, K.ny, 0.42, { light: true });
  glow(x + 60, top - 15, 16, K.nm, 0.4);
  // karaoke rooms: pink / violet / cyan light, people with mics
  for (let f = 0; f < 4; f++) {
    const fy = top + 8 + f * 26;
    for (const [k, wx] of [[0, x + 4], [1, x + 26]]) {
      const L = R.pick(['#ff9ae0', '#c49aff', '#8af0ff', '#ffd48a']);
      D.nWin(R, wx, fy, 18, 14, { lit: L, kind: (f + k) % 3 === 0 ? 2 : (f + k) % 3 === 1 ? 0 : 3, curtain: '#5a2a6a' });
      if ((f + k) % 2 === 0) { R.px(wx + 14, fy + 4, '#ffffff'); R.px(wx + 3, fy + 3, K.ny); R.px(wx + 9, fy + 2, '#ffffff'); }   // disco dots
    }
    D.ledge(R, x, 50, fy + 22, wall);
  }
  D.acNight(R, x + 46, top + 40, wall); D.acNight(R, x + 46, top + 92, wall);
  D.pipeN(R, x + 1, top + 4, FASC - 2);
  // the blade sign: カラオケ with chaser bulbs
  const b = D.bladeSign(R, x + 59, top + 10, 'カラオケ', { size: 11, col: K.nc, bulbs: K.ny, wall: 'left' });
  glow(b.cx, b.cy, 30, K.nc, 0.36, { light: true });
  // KARAOKE lightbox band over the ramen shop
  D.fascia(R, x + 2, top + 112, w - 4, 20, { bg: '#1a0e24', bulbs: K.nm });
  D.neonText(R, 'KARAOKE', x + 8, top + 116, K.nm, { thin: true });
  R.ell(x + 62, top + 120, 3, 3.4, '#c8c8d8'); R.rect(x + 61, top + 123, 3, 6, '#8a8aa0'); R.px(x + 61, top + 119, '#ffffff');   // mic
  R.text('5F-2F', x + 8, top + 125, K.ny, { mini: true });
  glow(x + 38, top + 122, 24, K.nm, 0.38);
  // RAMONES RAMEN: black & white punk fascia, red noren, warm counter
  D.fascia(R, x + 1, FASC, w - 2, 11, { bg: '#f0ece4' });
  for (let i = x + 1; i < x + w - 1; i += 4) R.rect(i, FASC + 8, 2, 3, '#14101a');
  R.text('RAMONES', x + 8, FASC + 2, '#14101a', {}); R.text('ラ', x + 54, FASC + 1, '#d8303e', { jpSize: 8 }); R.text('ー', x + 62, FASC + 1, '#d8303e', { jpSize: 8 });
  shopfront(R, x + 3, SHOP, w - 6, FB - SHOP - 2, { grad: ['#ffe6b0', '#f0b070', '#b86a40'], door: 46, doorW: 12, mullions: [22],
    inside: (p, gx, gy, gw, gh) => { p.rect(gx, gy + gh - 9, 42, 9, '#6a3a2a'); p.hl(gx, gx + 41, gy + gh - 9, '#a86a4a'); people(p, gx + 2, gy + gh - 8, 38, '#4a2a30', 3); for (let i = gx + 4; i < gx + 40; i += 8) { p.rect(i, gy + gh - 3, 3, 3, '#2a1a20'); } p.rect(gx + 2, gy + 1, 38, 4, '#f4ead0'); for (let i = gx + 4; i < gx + 38; i += 5) p.vl(i, gy + 2, gy + 4, '#2a1a20'); } });
  D.noren(R, x + 44, SHOP, 16, { color: '#c8283a', h: 10, mark: '麺', size: 8 });
  D.chochin(R, x + 64, SHOP + 2, { r: 3, h: 4 });
  glow(x + 38, SHOP + 12, 22, '#ffb070', 0.3);
  D.edges(R, x, top, w, FB - top, wall);
}
function bSubmarine(R, x, w, top, glow) {
  const wall = '#8a6e22';
  D.wallTex(R, x, top, w, FB - top, wall, 'rivet');
  D.parapet(R, x, top, w, wall);
  // the submarine sign on struts over the roof
  for (const sx of [x + 22, x + 66]) { R.rect(sx, top - 8, 3, 8, K.steelD); R.vl(sx, top - 8, top - 1, K.steel); }
  D.submarine(R, x + 6, top - 30, 82);
  for (const lx of [x + 10, x + 82]) { R.rect(lx, top - 6, 4, 3, '#4a4a5a'); R.px(lx + 1, top - 7, '#fff8d0'); }
  glow(x + 46, top - 20, 40, '#ffd84a', 0.34, { light: true });
  // portholes: aquarium inside
  for (let k = 0; k < 3; k++) {
    const px = x + 18 + k * 30, py = top + 20;
    R.ell(px, py, 9, 9, '#5a4210'); R.ell(px, py, 8, 8, '#c8a050'); R.ell(px, py, 6.5, 6.5, '#7a5a20');
    for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (i * i + j * j <= 30) R.px(px + i, py + j, j < -2 ? '#7aeaff' : j < 2 ? '#3ac0e0' : '#1a7aa8');
    R.px(px - 2, py - 1, '#ff8a3c'); R.px(px - 3, py - 1, '#ff8a3c'); R.px(px - 1, py - 1, '#ffd84a');   // a fish
    R.px(px + 2, py - 3, '#ffffff'); R.px(px + 3, py - 5, '#c8f8ff'); R.px(px + 1, py + 3, '#5ad0a0'); R.px(px + 1, py + 4, '#5ad0a0');
    R.px(px - 4, py - 4, '#ffffff'); for (let a = 0; a < 8; a++) R.px(Math.round(px + Math.cos(a * 0.785) * 8), Math.round(py + Math.sin(a * 0.785) * 8), '#e8d088');
    glow(px, py, 14, K.nc, 0.28);
  }
  // fascia: SOFT-SERVE in pink neon on navy, ソフトクリーム in cyan
  D.fascia(R, x + 2, FASC - 6, w - 4, 17, { bg: '#16123a', bulbs: K.ny });
  D.neonText(R, 'SOFT-SERVE', x + 22, FASC - 3, K.nm, { thin: true });
  glow(x + 36, FASC + 1, 26, K.nm, 0.36);
  // the parlour: rounded big window, soft-serve machines, Yuzu at the counter, porthole door
  shopfront(R, x + 3, SHOP, w - 6, FB - SHOP - 2, { grad: ['#fff8e0', '#ffe0a8', '#f0a878'], door: 62, doorW: 14,
    inside: (p, gx, gy, gw, gh) => {
      for (let k = 0; k < 3; k++) { const mx = gx + 6 + k * 12; p.block(mx, gy + 4, 8, 12, '#d8dce8', { line: '#6a6a80' }); p.rect(mx + 2, gy + 6, 4, 3, '#2a2a3a'); p.px(mx + 3, gy + 7, [K.nm, K.ny, K.ng][k]); p.vl(mx + 4, gy + 16, gy + 18, '#9a9ab0'); }
      p.rect(gx, gy + gh - 7, 56, 7, '#ff8ab8'); p.hl(gx, gx + 55, gy + gh - 7, '#ffc8e0'); for (let i = gx + 2; i < gx + 54; i += 6) p.px(i, gy + gh - 4, '#ffffff');
      people(p, gx + 38, gy + gh - 7, 14, '#8a4a5a', 1);
      p.ell(gx + 44, gy + 9, 2, 2, '#ffd84a');
    } });
  R.ell(x + 72, SHOP + 9, 4, 4, '#c8a050'); R.ell(x + 72, SHOP + 9, 3, 3, '#7aeaff'); R.px(x + 71, SHOP + 8, '#ffffff');
  // yellow/white striped awning over the window
  for (let i = 0; i < 56; i++) for (let j = 0; j < 4; j++) R.px(x + 4 + i, SHOP + j, Math.floor(i / 4) % 2 ? '#fff4d8' : '#e8b21e');
  for (let i = 0; i < 56; i += 4) { R.px(x + 5 + i, SHOP + 4, '#e8b21e'); R.px(x + 6 + i, SHOP + 4, '#e8b21e'); }
  R.wash(x + 4, SHOP + 5, 56, 2, K.ink, 0.3);
  glow(x + 40, SHOP + 14, 30, '#fff0c0', 0.32, { light: true });
  D.edges(R, x, top, w, FB - top, wall);
}
function bOctopus(R, x, w, top, glow) {
  const wall = '#26404e';
  D.wallTex(R, x, top, w, FB - top, wall, 'tile', { tw: 5, th: 4 });
  // a wave band in lighter tiles under the parapet
  for (let i = 0; i < w; i++) { const yy = top + 7 + Math.round(Math.sin(i * 0.4) * 2); R.px(x + i, yy, '#3a6274'); R.px(x + i, yy + 1, '#30566a'); }
  D.parapet(R, x, top, w, wall, { rail: true });
  D.roofJunk(R, x + 24, top - 1, 50, { items: ['tank', 'dish', 'antenna'] });
  upperWindows(R, x + 18, w - 20, top + 12, top + 64, { n: 3, ww: 14, wh: 12, fh: 26, wall, ac: true, refl: K.no });
  D.pipeN(R, x + w - 4, top + 6, FASC - 2);
  const b = D.bladeSign(R, x + 3, top + 12, 'たこ焼', { size: 10, col: K.ny, bg: '#a01a28', bulbs: K.ny, frameCol: '#ff8a5a', wall: 'right' });
  glow(b.cx, b.cy, 26, K.ny, 0.34);
  // fascia then the octopus draped over it
  D.fascia(R, x + 2, FASC - 2, w - 4, 13, { bg: '#7a1420' });
  D.neonText(R, "OCTOPUS'S GARDEN", x + w / 2, FASC + 2, K.ny, { mini: true, align: 'center', ring: false, core: '#ffe890' });
  // the open takoyaki shop behind the counter: hot orange light, menu strips
  shopfront(R, x + 3, SHOP, w - 6, FB - SHOP - 2, { grad: ['#ffe2a0', '#ffb060', '#d8783a'],
    inside: (p, gx, gy, gw, gh) => { for (let k = 0; k < 7; k++) { p.rect(gx + 3 + k * 7, gy + 1, 5, 9, '#f8eed8'); p.hl(gx + 4 + k * 7, gx + 6 + k * 7, gy + 3, '#2a1a20'); p.hl(gx + 4 + k * 7, gx + 6 + k * 7, gy + 6, '#c8283a'); } p.rect(gx, gy + 12, gw, 2, '#8a5a3a'); } });
  const o = D.octopusSign(x + 42, top + 82);
  R.put(o.surf, o.x, o.y);
  glow(x + 42, top + 82, 46, K.no, 0.34, { light: true });
  glow(x + 74, top + 66, 12, '#ffd890', 0.3);
  D.edges(R, x, top, w, FB - top, wall);
}
function bKushikatsu(R, x, w, top, glow) {
  const wall = '#3a2628';
  D.wallTex(R, x, top, w, FB - top, wall, 'wood');
  D.parapet(R, x, top, w, '#4a3236');
  // the Zeppelin: a giant fried cutlet shaped like an airship, skewered, tethered to the roof
  { const zx = x + 40, zy = top - 22;
    R.line(zx - 16, zy + 8, x + 18, top - 1, K.steelL); R.line(zx + 16, zy + 8, x + 62, top - 1, K.steelL);
    for (let j = -8; j <= 8; j++) for (let i = -26; i <= 26; i++) { const d = (i * i) / 676 + (j * j) / 64; if (d > 1) continue; const l = -(i / 26) * 0.4 - (j / 8) * 0.8 + (1 - d) * 0.3; const crumb = ((i * 7 + j * 13) & 7) === 0; R.px(zx + i, zy + j, crumb ? '#ffe0a0' : l > 0.5 ? '#ffd27a' : l > 0 ? '#e8a448' : l > -0.5 ? '#c07a30' : '#8a4e22'); }
    R.poly([[zx + 22, zy - 2], [zx + 31, zy - 9], [zx + 31, zy - 1]], '#b0703a'); R.poly([[zx + 22, zy + 2], [zx + 31, zy + 9], [zx + 31, zy + 1]], '#8a4e22');
    R.line(zx - 36, zy + 1, zx + 34, zy, '#e8d8b0'); R.px(zx - 37, zy + 1, '#c8b890');
    R.rect(zx - 8, zy + 8, 14, 4, '#2a2030'); R.px(zx - 6, zy + 9, K.ny); R.px(zx - 2, zy + 9, K.ny); R.px(zx + 2, zy + 9, K.ny);
    R.text('串カツ', zx - 14, zy - 5, '#5a2410', { jpSize: 8 });
    glow(zx, zy, 30, '#ffb050', 0.3, { light: true }); }
  // FRIED ZEPPELIN neon + the glaring chef board
  D.neonText(R, 'FRIED', x + 8, top + 8, K.no, { thin: true });
  D.neonText(R, 'ZEPPELIN', x + 24, top + 17, K.no, { thin: true });
  glow(x + 40, top + 16, 26, K.no, 0.38);
  { const cx = x + 30, cy = top + 50, bw = 46, bh = 42;
    R.rect(cx - bw / 2 - 2, cy - bh / 2 - 2, bw + 4, bh + 4, '#c8a040'); R.frame(cx - bw / 2 - 3, cy - bh / 2 - 3, bw + 6, bh + 6, K.ink); R.hl(cx - bw / 2 - 2, cx + bw / 2 + 1, cy - bh / 2 - 2, '#ffe08a');
    R.vgrad(cx - bw / 2, cy - bh / 2, bw, bh, ['#3a2a4a', '#5a2a3a']);
    // toque, face, brows, moustache
    R.ell(cx, cy - 14, 11, 6, '#f4f0e8'); R.rect(cx - 9, cy - 12, 18, 6, '#f4f0e8'); R.hl(cx - 9, cx + 8, cy - 7, '#c8c0b8'); R.px(cx - 6, cy - 17, '#ffffff');
    R.ell(cx, cy + 2, 11, 11, '#e8a070'); R.ell(cx - 2, cy, 8, 8, '#f4b888');
    R.line(cx - 9, cy - 4, cx - 2, cy - 1, '#1a1018'); R.line(cx - 9, cy - 5, cx - 2, cy - 2, '#1a1018'); R.line(cx + 9, cy - 4, cx + 2, cy - 1, '#1a1018'); R.line(cx + 9, cy - 5, cx + 2, cy - 2, '#1a1018');
    R.rect(cx - 6, cy + 1, 3, 2, '#ffffff'); R.rect(cx + 3, cy + 1, 3, 2, '#ffffff'); R.px(cx - 4, cy + 1, '#1a1018'); R.px(cx + 4, cy + 1, '#1a1018');
    R.rect(cx - 7, cy + 6, 14, 3, '#2a1a1a'); R.px(cx - 8, cy + 7, '#2a1a1a'); R.px(cx + 7, cy + 7, '#2a1a1a'); R.hl(cx - 3, cx + 3, cy + 10, '#8a3a2a');
    R.rect(cx - 13, cy + 13, 26, 6, '#f4f0e8'); R.hl(cx - 13, cx + 12, cy + 13, '#2a3058');
    // the skewer held like a lance, a mini-zeppelin cutlet on it
    R.line(cx - 22, cy + 18, cx + 20, cy - 16, '#e8d8b0'); R.ell(cx + 13, cy - 10, 6, 3.4, '#e0a040'); R.px(cx + 10, cy - 11, '#ffe0a0');
    R.ell(cx - 14, cy + 15, 3, 2.4, '#e8a070'); }
  // 串カツ blade, red with yellow
  const b = D.bladeSign(R, x + w - 19, top + 32, '串カツ', { size: 10, col: K.ny, bg: '#b01a28', bulbs: '#ffffff', wall: 'left' });
  glow(b.cx, b.cy, 22, K.ny, 0.3);
  // tiled eave with a row of red lanterns
  for (let j = 0; j < 7; j++) { const inset = Math.round((7 - j) * 0.7); R.hl(x - 2 + inset, x + w + 1 - inset, FASC - 9 + j, j % 3 === 0 ? '#5a4a6a' : j % 3 === 1 ? '#3e3250' : '#2e2440'); }
  for (let i = x; i < x + w; i += 4) R.vl(i, FASC - 6, FASC - 3, '#241c34');
  R.hl(x - 2, x + w + 1, FASC - 2, K.ink);
  for (let k = 0; k < 6; k++) { D.chochin(R, x + 6 + k * 13, FASC - 1, { r: 3.4, h: 4.4, mark: k % 2 === 0 }); }
  glow(x + 40, FASC + 4, 30, '#ff6a40', 0.34, { light: true });
  // lattice door + sampuru window + no-double-dip sign
  shopfront(R, x + 3, SHOP, w - 6, FB - SHOP - 2, { grad: ['#ffd898', '#e8a060', '#a8603a'], door: 40, doorW: 18,
    inside: (p, gx, gy, gw, gh) => { p.rect(gx + 2, gy + 8, 30, 14, '#2a1a1a'); p.rect(gx + 3, gy + 9, 28, 12, '#f8ead0'); for (let k = 0; k < 6; k++) { p.line(gx + 5 + k * 4, gy + 19, gx + 7 + k * 4, gy + 11, '#c8b090'); p.ell(gx + 6.5 + k * 4, gy + 14, 1.6, 2.4, '#d08a3a'); } p.hl(gx + 3, gx + 30, gy + 20, '#c8c0b0'); } });
  for (let j = SHOP + 1; j < FB - 3; j += 3) R.hl(x + 43, x + 60, j, '#5a3a2a'); for (let i = x + 46; i < x + 61; i += 3) R.vl(i, SHOP + 1, FB - 3, '#5a3a2a');
  D.noren(R, x + 41, SHOP, 22, { color: '#22285a', h: 9, mark: '串', size: 8 });
  R.rect(x + 66, SHOP + 4, 9, 14, '#f4ecdc'); R.frame(x + 66, SHOP + 4, 9, 14, '#c8283a'); R.text('二', x + 67, SHOP + 4, '#c8283a', { jpSize: 7 }); R.text('禁', x + 67, SHOP + 11, '#c8283a', { jpSize: 7 });
  D.edges(R, x, top, w, FB - top, wall);
}
function bCrab(R, x, w, top, glow) {
  const wall = '#46424e';
  D.wallTex(R, x, top, w, FB - top, wall, 'panel', { pw: 28, ph: 26 });
  D.parapet(R, x, top, w, wall, { rail: true });
  D.roofJunk(R, x + 10, top - 1, 90, { items: ['ac', 'ac', 'gap', 'solar', 'tank'] });
  upperWindows(R, x + 20, w - 24, top + 4, top + 82, { n: 4, ww: 14, wh: 13, fh: 26, wall, ac: false, litP: 0.75, lights: [K.win, '#ffc478', '#ffe0a8'] });
  const b = D.bladeSign(R, x + 2, top + 10, 'かに', { size: 12, col: '#ffffff', fg: K.ny, bg: '#c81a28', bulbs: K.ny, wall: 'right' });
  glow(b.cx, b.cy, 24, K.ny, 0.32);
  // fascia (two lines) then the crab over it
  D.fascia(R, x + 2, FASC - 14, w - 4, 25, { grad: ['#2a0a1a', '#4a0e1e'], bulbs: K.nr });
  D.neonText(R, 'RED HOT CHILI', x + w / 2, FASC - 10, K.nr, { align: 'center', thin: true, core: '#ffc0b0' });
  D.neonText(R, 'CRABBERS', x + w / 2, FASC + 1, K.ny, { align: 'center', thin: true });
  glow(x + w / 2, FASC - 2, 34, K.nr, 0.4, { light: true });
  shopfront(R, x + 3, SHOP + 2, w - 6, FB - SHOP - 4, { grad: ['#fff0d0', '#f0c890', '#c08860'], door: 46, doorW: 18, mullions: [24, 86],
    inside: (p, gx, gy, gw, gh) => { p.rect(gx + 2, gy + 4, 36, 16, '#2a1a1a'); p.rect(gx + 3, gy + 5, 34, 14, '#f8f0e0'); for (let k = 0; k < 4; k++) { p.ell(gx + 7 + k * 8, gy + 13, 3, 2.4, '#e8483a'); p.px(gx + 6 + k * 8, gy + 12, '#ffa088'); p.hl(gx + 4 + k * 8, gx + 10 + k * 8, gy + 16, '#c8c8d8'); } people(p, gx + 70, gy + gh, 30, '#6a3a3a', 2); } });
  const c = D.crabSign(x + 58, top + 104);
  R.put(c.surf, c.x, c.y);
  glow(x + 58, top + 100, 44, '#ff4a3a', 0.36, { light: true });
  glow(x + 108, top + 72, 20, '#ffa088', 0.3);
  D.edges(R, x, top, w, FB - top, wall);
}
function bRecords(R, x, w, top, glow) {
  const wall = '#4a2c34';
  D.wallTex(R, x, top, w, FB - top, wall, 'brick');
  D.parapet(R, x, top, w, wall);
  D.roofJunk(R, x + 4, top - 1, 60, { items: ['dish', 'solar'] });
  // gig posters plastered on the brick
  for (const [px, py, c] of [[x + 3, top + 8, '#e8d0a0'], [x + 13, top + 10, '#5ac8e8'], [x + 50, top + 7, '#ff8ad8'], [x + 56, top + 30, '#e8e060']]) { R.rect(px, py, 9, 12, c); R.rect(px + 1, py + 1, 7, 5, shift(c, -1.2)); R.hl(px + 1, px + 6, py + 8, shift(c, -1.6)); R.hl(px + 1, px + 4, py + 10, shift(c, -1.6)); R.px(px, py, '#ffffff'); }
  // the giant record: black vinyl, cyan grooves, magenta label, a neon tube rim
  const cx = x + 33, cy = top + 30, r = 18;
  R.ell(cx, cy, r, r, '#120e18');
  for (let rr = 6; rr < r; rr += 2) R.s.ring(cx, cy, rr, rr, rr % 4 ? '#2a2236' : '#221c2c');
  for (let a = -0.9; a < -0.2; a += 0.05) for (let rr = 8; rr < r - 1; rr += 2) R.px(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr), '#6a6488');
  R.ell(cx, cy, 6, 6, K.nm); R.ell(cx - 1, cy - 1, 3, 3, '#ff9ae0'); R.px(cx, cy, '#120e18'); R.text('R', cx - 2, cy - 4, '#ffffff', { mini: true });
  D.ringTube(R, cx, cy, r + 1, r + 1, K.nc);
  glow(cx, cy, 30, K.nc, 0.36, { light: true });
  D.neonText(R, 'REVOLVER', x + w / 2, top + 54, K.ny, { align: 'center', thin: true });
  glow(x + w / 2, top + 57, 20, K.ny, 0.3);
  upperWindows(R, x + 4, w - 8, top + 64, FASC - 2, { n: 2, ww: 16, wh: 12, fh: 20, wall, ac: false, litP: 0.9, ledges: false });
  D.fascia(R, x + 2, FASC, w - 4, 11, { bg: '#101a24' });
  D.neonText(R, 'RECORDS', x + 6, FASC + 2, K.nc, { thin: true, mini: false });
  R.text('レコード', x + 50, FASC + 2, K.nm, { jpSize: 4 });
  shopfront(R, x + 3, SHOP, w - 6, FB - SHOP - 2, { grad: ['#ffe8c0', '#e8b880', '#a87050'], door: 44, doorW: 12,
    inside: (p, gx, gy, gw, gh) => { for (let k = 0; k < 4; k++) for (let j = 0; j < 2; j++) { const c = p.pick(['#e84a5a', '#3a8ae0', '#f0d050', '#5ad0a0', '#f4f0e8', '#9a5ad8', '#2a2a3a', '#ff8a3c']); p.rect(gx + 2 + k * 9, gy + 2 + j * 10, 8, 8, c); p.ell(gx + 6 + k * 9, gy + 6 + j * 10, 2, 2, shift(c, -1)); p.px(gx + 2 + k * 9, gy + 2 + j * 10, mix(c, '#ffffff', 0.5)); } } });
  R.rect(x + 49, SHOP + 4, 7, 9, '#ff8ad8'); R.rect(x + 50, SHOP + 5, 5, 4, '#3a1a3a');   // poster on the door
  D.edges(R, x, top, w, FB - top, wall);
}
function bDrug(R, x, w, top, glow) {
  const wall = '#424658';
  D.wallTex(R, x, top, w, FB - top, wall, 'panel', { pw: 20, ph: 40 });
  D.parapet(R, x, top, w, wall);
  // a ribbon of cool storeroom windows + a green cross
  R.rect(x + 3, top + 10, w - 26, 16, K.ink2);
  for (let k = 0; k < 4; k++) D.nWin(R, x + 4 + k * 14, top + 11, 13, 14, { lit: k === 2 ? null : '#d8f0ff', kind: 1, mullion: false });
  { const gx = x + w - 15, gy = top + 9; R.rect(gx - 1, gy - 1, 14, 18, K.ink); R.rect(gx, gy, 12, 16, '#0e2418'); R.rect(gx + 4, gy + 2, 4, 12, K.ng); R.rect(gx + 1, gy + 6, 10, 4, K.ng); R.rect(gx + 5, gy + 3, 2, 10, '#c8ffe0'); R.rect(gx + 2, gy + 7, 8, 2, '#c8ffe0'); glow(gx + 6, gy + 8, 18, K.ng, 0.36); }
  D.ledge(R, x, w, top + 30, wall);
  // fascia: DRUG 24H + ドラッグ, white lightbox
  D.fascia(R, x + 2, FASC - 4, w - 4, 15, { grad: ['#f4fff8', '#c8f0d8'] });
  R.text('ドラッグ', x + 6, FASC - 2, '#0a7a3a', { jpSize: 10 }); R.text('24H', x + w - 22, FASC, '#d8303e', {});
  glow(x + w / 2, FASC + 3, 30, '#d8fff0', 0.3);
  // bright shop: shelves of colourful goods, robot clerk
  shopfront(R, x + 3, SHOP + 2, w - 6, FB - SHOP - 4, { grad: ['#ffffff', '#e8f4ff', '#b8d0e8'], door: 54, doorW: 16,
    inside: (p, gx, gy, gw, gh) => { shelves(p, gx, gy, 50, gh, ['#ff6a8a', '#5aa8ff', '#ffd84a', '#5ae0a0', '#ff9a4a', '#c88aff', '#ffffff']); } });
  R.wash(x + 3, SHOP + 2, w - 6, 2, '#ffffff', 0.3);
  glow(x + 40, SHOP + 12, 30, '#e8f8ff', 0.34, { light: true });
  D.edges(R, x, top, w, FB - top, wall);
}
function bFugu(R, x, w, top, glow) {
  const wall = '#2a3046';
  D.wallTex(R, x, top, w, FB - top, wall, 'panel', { pw: 16, ph: 26 });
  // wave-crest frieze (seigaiha) under the parapet
  for (let i = 0; i < w; i += 6) for (let r = 1; r <= 3; r++) for (let a = 0; a <= 6; a++) { const t = Math.PI + (a / 6) * Math.PI; R.px(x + i + 3 + Math.round(Math.cos(t) * r), top + 10 + Math.round(Math.sin(t) * r * 0.9), r === 3 ? '#4a5a7a' : '#3a4664'); }
  D.parapet(R, x, top, w, wall, { rail: true });
  D.roofJunk(R, x + 8, top - 1, 60, { items: ['tank', 'antenna', 'ac'] });
  upperWindows(R, x + 2, w - 22, top + 14, top + 92, { n: 2, ww: 16, wh: 13, fh: 26, wall, ac: true, refl: K.nc });
  const b = D.bladeSign(R, x + w - 19, top + 16, 'ふぐ', { size: 12, col: '#d8303e', fg: '#e8283a', bg: '#f4ecdc', frameCol: '#2a3058', wall: 'left' });
  glow(b.cx, b.cy, 18, '#fff0e0', 0.26);
  D.fascia(R, x + 2, FASC - 12, w - 4, 23, { bg: '#0e1830', bulbs: K.nc });
  D.neonText(R, 'FUGU', x + w / 2, FASC - 9, K.nc, { align: 'center', thin: true });
  D.neonText(R, 'FIGHTERS', x + w / 2, FASC + 1, K.nc, { align: 'center', thin: true });
  glow(x + w / 2, FASC - 1, 26, K.nc, 0.36);
  shopfront(R, x + 3, SHOP + 2, w - 6, FB - SHOP - 4, { grad: ['#e8f8ff', '#a8d8f0', '#5a90b8'], door: 50, doorW: 14, doorGrad: ['#fff2d8', '#e8b880'],
    inside: (p, gx, gy, gw, gh) => { p.rect(gx + 2, gy + 2, 42, 18, '#1a5a8a'); p.vgrad(gx + 3, gy + 3, 40, 16, ['#3ab8e8', '#1a6aa8']); for (let k = 0; k < 4; k++) { const fx = gx + 8 + k * 10, fy = gy + 8 + (k % 2) * 5; p.ell(fx, fy, 3, 2.6, '#f0c060'); p.px(fx - 2, fy - 1, '#1a1020'); p.px(fx + 3, fy, '#e8a040'); } for (let k = 0; k < 6; k++) p.px(gx + 5 + k * 7, gy + 4 + (k * 5) % 12, '#c8f8ff'); } });
  D.noren(R, x + 51, SHOP + 2, 16, { color: '#f4ecdc', h: 9, mark: 'ふ', markCol: '#2a3058', size: 8 });
  D.edges(R, x, top, w, FB - top, wall);
}
function bHotel(R, x, w, top, glow) {
  const wall = '#46465c';
  D.wallTex(R, x, top, w, FB - top, wall, 'stripe');
  D.parapet(R, x, top, w, wall, { rail: true });
  // rooftop letters on a steel frame
  R.rect(x + 14, top - 24, w - 28, 2, K.steelD); for (let i = x + 16; i < x + w - 14; i += 8) { R.vl(i, top - 24, top - 1, K.steelD); R.line(i, top - 1, i + 8, top - 22, '#2a2a38'); }
  D.neonText(R, 'HOTEL', x + w / 2, top - 22, K.nm, { align: 'center', scale: 2, spacing: 2 });
  glow(x + w / 2, top - 16, 34, K.nm, 0.42, { light: true });
  upperWindows(R, x + 4, w - 26, top + 8, top + 112, { n: 3, ww: 16, wh: 13, fh: 22, wall, ac: false, litP: 0.6, frame: '#7a7a8e' });
  const b = D.bladeSign(R, x + w - 19, top + 10, 'ホテル', { size: 11, col: K.nv, fg: '#d8c0ff', bg: '#1a1030', bulbs: K.nv, wall: 'left' });
  glow(b.cx, b.cy, 24, K.nv, 0.34);
  // KANSAI-FORNIA band + LED ticker (2050)
  D.fascia(R, x + 2, top + 112, w - 4, 11, { bg: '#1a0e26' });
  D.neonText(R, 'KANSAI-FORNIA', x + w / 2, top + 114, K.nm, { align: 'center', thin: true, core: '#ffd0f0' });
  R.rect(x + 2, top + 126, w - 4, 7, '#0a0a10'); R.frame(x + 1, top + 125, w - 2, 9, '#2a2a3a');
  glow(x + w / 2, top + 118, 30, K.nm, 0.32);
  // PURPLE RAIN CAFE (left) + hotel entrance under a lit canopy (right)
  D.fascia(R, x + 2, FASC, 46, 11, { bg: '#2a1048' });
  R.text('PURPLE RAIN', x + 3, FASC + 1, '#e0c8ff', { mini: true }); R.text('CAFE', x + 3, FASC + 6, '#ffffff', { mini: true });
  for (const [dx, dy] of [[22, 7], [30, 6], [38, 7], [43, 6]]) { R.px(x + dx, FASC + dy, K.nv); R.px(x + dx, FASC + dy + 1, '#e0c0ff'); }
  glow(x + 26, FASC + 5, 18, K.nv, 0.36);
  shopfront(R, x + 3, SHOP, 44, FB - SHOP - 2, { grad: ['#ffe2c0', '#e8a880', '#9a5a6a'], mullions: [22],
    inside: (p, gx, gy, gw, gh) => { p.vl(gx + 10, gy, gy + 5, '#2a1a2a'); p.ell(gx + 10, gy + 6, 3, 1.6, '#ffe890'); p.vl(gx + 32, gy, gy + 5, '#2a1a2a'); p.ell(gx + 32, gy + 6, 3, 1.6, '#ffe890'); p.rect(gx + 4, gy + gh - 8, 14, 2, '#5a2a3a'); p.rect(gx + 26, gy + gh - 8, 14, 2, '#5a2a3a'); p.rect(gx + 9, gy + gh - 12, 3, 4, '#5af08a'); p.px(gx + 10, gy + gh - 13, '#ff4a5a'); people(p, gx + 24, gy + gh - 4, 16, '#5a2a4a', 1); } });
  // canopy + revolving door
  R.rect(x + 50, SHOP - 4, 48, 4, '#2a2238'); R.hl(x + 50, x + 97, SHOP - 4, '#5a4a6a'); R.hl(x + 50, x + 97, SHOP - 1, '#ffe8b0'); for (let i = x + 54; i < x + 96; i += 6) R.px(i, SHOP - 1, '#ffffff');
  shopfront(R, x + 52, SHOP + 1, 44, FB - SHOP - 3, { grad: ['#fff4dc', '#f0d0a0', '#c8a070'], door: 14, doorW: 16, mullions: [6, 37],
    inside: (p, gx, gy, gw, gh) => { p.rect(gx + 33, gy + 6, 8, 10, '#c8a040'); p.px(gx + 36, gy + 4, '#5ae080'); p.px(gx + 37, gy + 3, '#3ac060'); } });
  glow(x + 74, SHOP + 8, 28, '#ffe8b0', 0.32, { light: true });
  D.edges(R, x, top, w, FB - top, wall);
}
function bOkonomi(R, x, w, top, glow) {
  const wall = '#46322c';
  D.wallTex(R, x, top, w, FB - top, wall, 'wood');
  // tiled roof edge (old two-storey) with the hologram projector on it
  for (let j = 0; j < 10; j++) { const inset = Math.round((10 - j) * 0.6); R.hl(x - 3 + inset, x + w + 2 - inset, top - 10 + j, j % 3 === 0 ? '#4e4466' : j % 3 === 1 ? '#3a3254' : '#2c2644'); }
  for (let i = x; i < x + w; i += 5) R.vl(i, top - 6, top - 1, '#221c36'); R.hl(x - 4, x + w + 3, top - 11, K.ink); R.hl(x - 3, x + w + 2, top, K.ink); R.wash(x, top + 1, w, 3, K.ink, 0.4);
  R.block(x + 46, top - 16, 10, 6, '#3a3a4c', { line: K.ink }); R.ell(x + 51, top - 17, 4, 2, '#6af4ff'); R.px(x + 51, top - 18, '#ffffff');
  glow(x + 51, top - 18, 12, K.nc, 0.4);
  // shoji windows upstairs (warm paper + lattice)
  for (const wx of [x + 6, x + 34, x + 62]) { R.rect(wx - 1, top + 10, 26, 20, K.ink); R.vgrad(wx, top + 11, 24, 18, ['#ffe8b8', '#f0c080']); for (let i = wx + 4; i < wx + 24; i += 5) R.vl(i, top + 11, top + 28, '#7a5038'); for (let j = top + 15; j < top + 29; j += 5) R.hl(wx, wx + 23, j, '#7a5038'); R.hl(wx - 1, wx + 24, top + 30, '#7a5440'); }
  people(R, x + 36, top + 28, 22, '#a86a48', 1);
  D.ledge(R, x, w, top + 34, wall);
  // okonomiyaki 3D sign: a sauced pancake with mayo zigzag + spatula
  { const cx = x + 74, cy = top + 48;
    R.ell(cx, cy + 2, 16, 8, '#6a3a1a'); R.ell(cx, cy, 16, 8, '#d8964a'); R.ell(cx, cy - 1, 14, 6.4, '#5a2810'); R.ell(cx - 3, cy - 2, 6, 2.4, '#7a3a1a');
    for (let i = -11; i <= 11; i += 2) R.px(cx + i, cy - 1 + ((i >> 1) % 2 ? 2 : -2), '#fff8e8');
    for (const [a, b2] of [[-6, -3], [4, 1], [8, -2], [-2, 2], [-9, 0]]) R.px(cx + a, cy + b2, '#5ac85a');
    for (const [a, b2] of [[2, -3], [-5, 1], [10, 0]]) { R.px(cx + a, cy + b2, '#ff9ab0'); R.px(cx + a + 1, cy + b2, '#ffc0d0'); }
    R.poly([[cx + 6, cy - 6], [cx + 16, cy - 14], [cx + 19, cy - 11], [cx + 9, cy - 3]], '#c8c8d8'); R.line(cx + 16, cy - 14, cx + 24, cy - 22, '#8a5a3a'); R.line(cx + 17, cy - 13, cx + 25, cy - 21, '#6a4028');
    glow(cx, cy, 24, '#ffb060', 0.3); }
  const b = D.bladeSign(R, x + 3, top + 40, 'お好み', { size: 10, col: '#ffffff', fg: '#ffffff', bg: '#c8283a', bulbs: K.ny, wall: 'right' });
  glow(b.cx, b.cy, 20, '#ffd0c0', 0.26);
  // ABBEY ROAD zebra fascia
  R.rect(x + 1, FASC - 1, w - 2, 13, K.ink);
  for (let i = x + 2; i < x + w - 2; i++) R.vl(i, FASC, FASC + 10, Math.floor((i - x) / 5) % 2 ? '#1a1a22' : '#e8e4dc');
  R.rect(x + 28, FASC + 1, 46, 9, '#14101a'); R.text('ABBEY ROAD', x + 31, FASC + 3, K.ny, { mini: true });
  glow(x + w / 2, FASC + 5, 24, '#ffe0a0', 0.26);
  shopfront(R, x + 3, SHOP, w - 6, FB - SHOP - 2, { grad: ['#ffd8a0', '#f09858', '#b05a38'], door: 30, doorW: 16,
    inside: (p, gx, gy, gw, gh) => { p.rect(gx + 50, gy + 10, 40, 4, '#2a2a34'); p.hl(gx + 50, gx + 89, gy + 10, '#8a8a9a'); for (let k = 0; k < 3; k++) p.ell(gx + 58 + k * 12, gy + 9, 4, 1.6, '#c8843a'); people(p, gx + 50, gy + gh, 40, '#5a2a24', 3); p.rect(gx + 2, gy + 2, 24, 3, '#f4ead0'); for (let k = 0; k < 4; k++) p.vl(gx + 4 + k * 6, gy + 2, gy + 10, '#f4ead0'); } });
  D.noren(R, x + 30, SHOP, 18, { color: '#c8283a', h: 10, mark: 'お', size: 8 });
  D.chochin(R, x + 27, SHOP + 1, { r: 3, h: 4 }); D.chochin(R, x + 50, SHOP + 1, { r: 3, h: 4 });
  glow(x + 60, SHOP + 12, 30, '#ff9a50', 0.32, { light: true });
  D.edges(R, x, top, w, FB - top, wall);
}

// ------------------------------------------------------------------ reflections (canal + wet street)
// every vertical thing mirrors about its own waterline (a facade standing 16 px above the
// water mirrors about base + 16); rows are sliced into rippling bands, only lights read
// strongly, and bright pixels run on down as broken streaks
function reflect(g, layers, R0, R1, o) {
  const s = g.s, H = R1 - R0, ref = new Uint32Array(W * H);
  layers.sort((a, b) => a.A - b.A);
  for (const L of layers) {
    const map = L.map || ((yr) => L.A - (yr - L.A) / o.k);
    for (let yr = R0; yr < R1; yr++) {
      const ys = Math.round(map(yr)); if (ys < L.y0 || ys > L.y1) continue;
      const d = (yr - R0) / H;
      for (let x = Math.max(0, L.x0 - 6); x <= Math.min(W - 1, L.x1 + 6); x++) {
        const dx = Math.round(Math.sin(yr * 0.7 + x * 0.03) * (o.wave || 1) + (noise2(x * 0.05, yr * 0.33, 9) - 0.5) * o.amp * (0.3 + d)) + (yr % 2 ? 1 : -1) * (o.jit || 0);
        const v = L.get(x + dx, ys); if ((v >>> 24) < 128) continue;
        ref[(yr - R0) * W + x] = v;
      }
    }
  }
  const carry = new Float32Array(W), carC = new Uint32Array(W);
  for (let yr = R0; yr < R1; yr++) {
    const d = (yr - R0) / H, dashRow = (yr - R0) % 3 !== 2;
    for (let x = 0; x < W; x++) {
      const i = yr * W + x, v = ref[(yr - R0) * W + x], gap = noise2(x * 0.22, yr * 0.8, 7) > o.gap;
      let col = null, a = 0;
      if (v) { col = rgbOf(v); const L = Math.max(col[0], col[1], col[2]) / 255; a = o.alpha(L, d); if (gap) a *= 0.25; if (L > 0.72) { carry[x] = 1; carC[x] = v; } else carry[x] *= o.decay; }
      else carry[x] *= o.decay;
      if (a < 0.2 && carry[x] > 0.2 && dashRow && !gap) { col = rgbOf(carC[x]); a = o.streak * carry[x] * (1 - d * 0.5); }
      if (!col || a <= 0.01) continue;
      const base = rgbOf(s.data[i]), t = o.tint;
      s.data[i] = packRGB(base[0] + (col[0] * t[0] - base[0]) * a, base[1] + (col[1] * t[1] - base[1]) * a, base[2] + (col[2] * t[2] - base[2]) * a);
    }
  }
  s.touch();
}
// a layer for the reflection pass from a sprite record (mirror axis A)
const sprLayer = (spr, A) => { const L0 = spr.x - spr.ax, T0 = spr.y - spr.ay; return { A, x0: L0, x1: L0 + spr.surf.w - 1, y0: T0, y1: T0 + spr.surf.h - 1, get: (x, y) => spr.surf.get(x - L0, y - T0) }; };

// ------------------------------------------------------------------ build
export function buildDotonbori(o = {}) {
  const night = o.night !== false;   // the street is at its best after dark: default to night
  const sc = new Scene2D({ w: W, h: DOTONBORI.h, viewW: o.viewW || 480, viewH: o.viewH || 270, sun: [0.32, 0.16], shadowAlpha: 0.3, shadowColor: '#120a24' });
  const g = new Pen(sc.ground, 2050), ov = new Pen(sc.overlay, 77);
  const glows = sc.glows;
  const glow = (x, y, r, color, a = 0.4, opt = {}) => { const base = opt.base ?? FB + 8; glows.push(Object.assign({ x, y, r, color, a, base, h: Math.max(4, base - y) }, opt)); };

  // ---------------------------------------------------------------- backdrop + ground
  backdrop(g, night);
  slabs(g, 0, FB, W, 14, '#46424f', 16, 7);
  streetSlabs(g, 0, FB + 14, W, CURB - FB - 26);
  setts(g, 0, CURB - 12, W, 10);
  // curb + drain channel
  g.rect(0, CURB - 1, W, 2, '#24202c'); for (let x = 2; x < W; x += 5) g.rect(x, CURB - 1, 3, 1, '#14121a');
  g.rect(0, CURB + 1, W, 3, '#54506a'); g.hl(0, W - 1, CURB + 1, '#726e88'); g.hl(0, W - 1, CURB + 3, '#3a3648');
  planks(g, 0, BW0, W, RAIL - 2 - BW0);
  tactile(g, 0, W, FB + 22);
  embankment(g, RAIL, WATER0);
  // canal water: deep, cool, with darker band under the wall
  g.vgrad(0, WATER0, W, WATER1 - WATER0, ['#070d18', '#0a1322', '#0d182a', '#111d34', '#16223e', '#1c2646']);
  for (let y = WATER0 + 4; y < WATER1 - 1; y += 3) for (let x = (y * 7) % 11; x < W; x += g.ri(9, 22)) { const L = g.ri(2, 5); g.hl(x, x + L, y, y < WATER0 + 30 ? '#101c2e' : '#1e2a4a'); }
  g.wash(0, WATER0, W, 3, '#000000', 0.4);
  // south bank: capstone edge + promenade slabs
  g.rect(0, WATER1, W, 4, '#4e4a5e'); g.hl(0, W - 1, WATER1, '#6e6a82'); g.hl(0, W - 1, WATER1 + 3, '#2e2a3a');
  slabs(g, 0, WATER1 + 4, W, DOTONBORI.h - WATER1 - 4, '#3c3848', 20, 8);
  g.rect(0, DOTONBORI.h - 10, W, 10, '#2e2a3a'); for (let x = 0; x < W; x += 24) g.rect(x, DOTONBORI.h - 10, 22, 3, '#3a3648');
  for (let x = 0; x < W; x += 6) { const c = (x / 6) % 2 ? '#4a4258' : '#3a3448'; g.rect(x, WATER1 + 9, 5, 5, c); g.hl(x, x + 4, WATER1 + 9, shift(c, 0.4)); }
  for (let x = 30; x < W; x += 110) { g.ell(x, 482, 6, 3, '#6a5a3a'); g.ell(x, 482, 4.6, 2, '#b8944a'); g.px(x - 2, 481, '#e8c870'); }   // brass inlays
  // street details: battle court, manholes, puddles, stickers, chalk
  batteryCourt(g, 258, FB + 30, 452, CURB - 8);
  manhole(g, 520, 262); manhole(g, 138, 272); manhole(g, 784, 258);
  puddle(g, 196, 270, 9, 3, [K.no, '#ffd890', K.nm]); puddle(g, 586, 280, 11, 3, [K.nm, K.nc, '#ffffff']); puddle(g, 688, 252, 7, 2, [K.nv, K.nm]); puddle(g, 90, 256, 6, 2, [K.nc, K.nm]);
  for (let k = 0; k < 4; k++) { const fx = 196 + k * 12, fy = 236 + (k % 2); g.rect(fx, fy, 3, 2, '#c8a83a'); g.rect(fx + 4, fy + 1, 3, 2, '#c8a83a'); }   // queue-here footprints
  g.text('QUEUE', 192, 242, '#9a8430', { mini: true });
  // kids' chalk: a hopscotch and a doodled flame-chick, half scuffed away
  { const ch = (x, y, c, a = 0.5) => { if (noise2(x * 0.4, y * 0.4, 51) < 0.72) g.blend(x, y, c, a); };
    for (let k = 0; k < 5; k++) { const bx = 104 + k * 9, by = 270 + (k % 2 ? -4 : 0); for (let i = 0; i < 8; i++) { ch(bx + i, by, '#f0c0e0'); ch(bx + i, by + 7, '#f0c0e0'); } for (let j = 0; j < 8; j++) { ch(bx, by + j, '#f0c0e0'); ch(bx + 7, by + j, '#f0c0e0'); } g.text(String(k + 1), bx + 2, by + 2, '#f0c0e0', { mini: true }); }
    const cx = 182, cy = 276; for (let a = 0; a < 40; a++) { const t = (a / 40) * Math.PI * 2; ch(Math.round(cx + Math.cos(t) * 7), Math.round(cy + Math.sin(t) * 6), '#ffe890', 0.6); }
    for (const [x, y] of [[cx - 3, cy - 7], [cx, cy - 10], [cx + 3, cy - 7], [cx - 1, cy - 9], [cx + 2, cy - 9]]) ch(x, y, '#ff9a6a', 0.7);
    ch(cx - 2, cy - 1, '#ffffff', 0.7); ch(cx + 3, cy - 1, '#ffffff', 0.7); ch(cx, cy + 2, '#ff9a6a', 0.7); ch(cx + 1, cy + 2, '#ff9a6a', 0.7); }
  for (const [x, y, c] of [[470, 252, '#f4ecdc'], [474, 254, '#ff8ad8'], [640, 268, '#f4ecdc'], [96, 240, '#ffe45c'], [702, 242, '#8af0ff'], [552, 290, '#f4ecdc']]) { g.rect(x, y, 3, 2, c); g.px(x + 3, y + 1, shift(c, -0.6)); g.px(x, y + 2, '#1a1622'); }
  for (const [x, y] of [[40, 248], [480, 274], [740, 280], [330, 300], [610, 300], [850, 268]]) { g.px(x, y, '#e8e0d0'); g.px(x + 1, y, '#a8a090'); }   // litter flecks
  for (let x = 6; x < W; x += 41) if (x < BR0 - 10 || x > BR1 + 10) { g.px(x, CURB - 4, '#5a6a4a'); g.px(x + 1, CURB - 5, '#6a7a50'); g.px(x + 2, CURB - 4, '#4a5a40'); }   // weeds in the curb seam

  // ---------------------------------------------------------------- the facade card
  const row = newSurf(W, FB + 1), R = new Pen(row, 4242);
  const B = [
    [bKaraoke, 0, 78, 34], [bSubmarine, 78, 96, 122], [bOctopus, 174, 84, 44], [bKushikatsu, 258, 80, 78], [bCrab, 338, 112, 32],
    [bRecords, 450, 66, 92], [bDrug, 516, 82, 124], [bFugu, 598, 82, 62], [bHotel, 680, 100, 30], [bOkonomi, 780, 100, 106],
  ];
  for (const [fn, x, w, top] of B) fn(R, x, w, top, glow);
  // THE LONG RUN board on the drugstore roof, facing the bridge
  { const bd = D.runnerBoard(82, 66); R.put(bd.surf, 516 - bd.ox, 30 - bd.oy); glow(557, 64, 50, K.nm, 0.3, { light: true }); glow(540, 50, 30, '#ffd060', 0.24); }
  // neon spill on the walls around the big signs
  for (const [x, y, rx, ry, c, a] of [[216, 128, 44, 34, '#ff8a50', 0.22], [396, 132, 60, 36, '#ff4a3a', 0.2], [288, 128, 34, 30, '#ffb060', 0.14], [483, 122, 30, 30, K.nc, 0.16],
    [66, 64, 18, 50, K.nc, 0.14], [557, 112, 44, 16, K.nm, 0.2], [639, 122, 30, 26, '#ffc060', 0.22], [730, 150, 50, 18, K.nm, 0.14], [24, 22, 30, 18, K.ny, 0.12], [126, 104, 50, 20, '#ffd84a', 0.12]]) D.pool(R, x, y, rx, ry, c, a);
  // shop-front steps / contact shadow along the base
  for (let x = 0; x < W; x++) { row.px(x, FB, '#1a1622'); }
  const facade = sc.add({ surf: row, ax: 0, ay: FB }, 0, FB, { shadow: false, solid: false, facade: true });
  { const s2 = newSurf(50, 60), p2 = new Pen(s2, 8); p2.rect(0, 2, 26, 2, K.steelD); p2.hl(0, 25, 2, K.steel); p2.line(2, 4, 10, 2, K.steelD); D.fuguLantern(p2, 24, 3);
    sc.add({ surf: s2, ax: 0, ay: FB + 10 - 96 }, 600, FB + 10, { shadow: false, solid: false }); glow(624, 122, 30, '#ffc060', 0.42, { light: true, base: FB + 10, h: FB + 10 - 122 }); }

  // ---------------------------------------------------------------- light pools on the street
  for (const [x, y, rx, ry, c, a] of [
    [38, FB + 10, 36, 14, '#ffb070', 0.22], [126, FB + 10, 44, 16, '#fff0c0', 0.24], [126, FB + 18, 50, 22, K.nm, 0.08], [216, FB + 16, 46, 22, '#ff9a50', 0.28],
    [298, FB + 10, 40, 16, '#ff6a40', 0.22], [394, FB + 10, 56, 18, '#ffd0a8', 0.2], [394, FB + 20, 60, 26, K.nr, 0.1], [482, FB + 10, 34, 14, '#ffd0a0', 0.18],
    [556, FB + 10, 44, 16, '#e8f8ff', 0.24], [640, FB + 10, 40, 14, K.nc, 0.14], [730, FB + 10, 50, 16, '#ffe8b0', 0.22], [706, FB + 8, 24, 10, K.nv, 0.16],
    [830, FB + 10, 50, 16, '#ff9a50', 0.22], [60, 312, 40, 14, '#ff8a50', 0.24],
    [557, FB + 40, 70, 40, K.nm, 0.06], [658, 300, 70, 30, '#fff2c8', 0.08],
  ]) D.pool(g, x, y, rx, ry, c, a);

  // ---------------------------------------------------------------- street props
  const add = (spr, x, y, opt) => sc.add(spr, x, y, opt);
  add(D.vendNight({ color: '#2a5ab8' }), 12, 214); add(D.vendNight({ color: '#c8283a' }), 34, 214);
  glow(12, 196, 14, '#e8f6ff', 0.3); glow(34, 196, 14, '#e8f6ff', 0.3, { light: true, base: 214, h: 18 });
  add(D.trashBins(), 60, 216, { solid: false });
  add(D.aFrame(['KARA', 'OKE', '¥500']), 72, 226);
  add(D.softCone(), 88, 216); glow(90, 186, 14, '#fff6e6', 0.3);
  add(D.aFrame(['MATCH', 'YUZU', 'MELON'], { doodle: true }), 164, 222);
  add(PR.bicycle({ color: '#5a8ac8' }), 118, 252);
  add(D.takoyakiCounter(), 216, 224); glow(208, 200, 26, '#ffb060', 0.36, { light: true, base: 224, h: 22 });
  add(D.recordCrates(), 488, 218);
  add(D.drummerBot(), 506, 216); glow(506, 172, 12, K.ny, 0.3, { flicker: true });
  add(D.crateStackN(), 576, 214, { solid: false });
  add(D.fortuneMachine(), 590, 218); glow(590, 184, 14, '#ffd0a0', 0.32, { flicker: true });
  add(D.scooter('#5ac8b8'), 744, 236); add(D.scooter('#e8a030'), 770, 240);
  add(D.vendNight({ color: '#2a8a5a' }), 846, 214); add(D.vendNight({ color: '#e8e4dc' }), 868, 214);
  glow(846, 196, 14, '#e8f6ff', 0.3); glow(868, 196, 14, '#e8f6ff', 0.3);
  add(D.aFrame(['OKONO', 'MIYAKI', '¥900']), 826, 226);
  add(PR.bicycle({ color: '#e8c040' }), 718, 262);
  for (const bx of [588, 728]) add(D.bollard(), bx, CURB - 2);
  // bridge lamp posts (four corners) + a lamp at each end of the street
  for (const [lx, ly] of [[BR0 + 2, RAIL - 1], [BR1 - 2, RAIL - 1]]) { add(D.lampPost({ h: 60 }), lx, ly); glow(lx, ly - 58, 22, '#fff2c8', 0.42, { light: true, base: ly, h: 58 }); }
  for (const lx of [BR0 + 3, BR1 - 3]) { add(D.lampPost({ h: 40 }), lx, 392); glow(lx, 354, 16, '#fff2c8', 0.36, { base: 392, h: 38 }); }
  // passers-by: night silhouettes rimmed by neon (a queue at the takoyaki counter, photographers on the bridge)
  [[198, 246, { rim: K.no, h: 23, bag: true }], [210, 249, { rim: K.ny, h: 25, hair: 'long', phone: 'low' }], [222, 247, { rim: K.no, h: 18, kid: true }],
    [8, 246, { rim: K.nm, h: 24, hair: 'bun' }], [76, 272, { rim: K.nc, h: 25, bag: true }], [86, 274, { rim: K.nc, h: 17, kid: true, hat: '#d8303e' }],
    [566, 256, { rim: K.nm, h: 25, phone: 'up' }], [756, 264, { rim: K.nv, h: 24, coat: '#2a2236' }], [768, 266, { rim: K.nv, h: 23, hair: 'long' }], [646, 228, { rim: K.nc, h: 24, bag: true }],
    [612, 352, { rim: K.nm, h: 24, phone: 'up' }], [622, 354, { rim: K.nm, h: 22, hair: 'long' }], [704, 366, { rim: K.nc, h: 25, phone: 'up', hat: '#2a2a3a' }], [612, 416, { rim: K.ny, h: 24 }],
    [126, 328, { rim: K.no, h: 24, hair: 'long' }], [136, 329, { rim: K.no, h: 25 }], [330, 476, { rim: K.nc, h: 24, bag: true }], [520, 480, { rim: K.nm, h: 23, hair: 'bun' }],
  ].forEach(([x, y, o], i) => add(D.person(Object.assign({ seed: i + 1, coat: ['#3a3858', '#5a3040', '#2e4a52', '#4a4030', '#3a2a4a', '#24384a'][i % 6], pants: ['#22202e', '#2a2438', '#1e2a30'][i % 3], back: y < 330 && i % 3 === 0 }, o, { h: Math.round(o.h * 1.15) })), x, y, { person: true }));
  add(D.infoPillar(), 164, 286); glow(164, 252, 10, K.nc, 0.36);
  add(D.courierBot(), 700, 278); glow(700, 266, 8, K.nc, 0.3);
  add(D.cat(), 472, 222, { solid: false });
  add(D.shrine(), 856, 288); glow(848, 262, 9, '#ff9a50', 0.4, { flicker: true }); glow(864, 262, 9, '#ff9a50', 0.4, { flicker: true });
  add(D.bikeRack(), 36, 286);

  // ---------------------------------------------------------------- the street after a shower: signs smear down the wet slabs
  for (const L of glows) {
    if (L.y > FB - 2 || L.r < 12) continue;
    const w = Math.max(3, Math.min(18, L.r * 0.6)), a0 = Math.min(0.32, L.a * 0.75), len = Math.round(12 + L.r * 0.8 + (FB - L.y) * 0.08), seed = L.x * 0.71 + L.y;
    for (let j = 0; j < len; j++) {
      const y = FB + 3 + j, t = j / len; if (y > CURB - 4 || (j + Math.round(seed)) % 2) continue;
      const n = noise2(seed + j * 0.4, j * 0.5, 41), hw = w * 0.5 * (0.5 + 0.6 * n), cx = L.x + Math.sin(j * 0.8 + seed) * 1.2;
      for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) g.blend(x, y, L.color, a0 * (1 - t) * (n > 0.3 ? 1 : 0.4));
    }
  }
  // ---------------------------------------------------------------- the riverwalk
  add(D.kushiYatai(), 66, 318); glow(66, 290, 30, '#ff8a40', 0.34, { light: true, base: 318, h: 26 });
  add(D.stool(), 44, 328); add(D.stool(), 60, 330); add(D.stool(), 84, 329);
  add(D.bamboo({ h: 70 }), 234, 324); add(D.bamboo({ h: 64, tint: K.nm }), 520, 324); add(D.bamboo({ h: 68, tint: K.ny }), 862, 322);
  for (const lx of [150, 776]) { add(D.haloLamp({ h: 64 }), lx, CURB - 3); glow(lx, CURB - 62, 18, '#c8f8ff', 0.4, { light: true, base: CURB - 3, h: 60 }); D.pool(g, lx, CURB - 6, 40, 14, '#c8f0ff', 0.14); }
  add(D.benchN(), 152, 330); add(D.benchN(), 790, 330);
  // railing (north) with lifebuoys, lantern posts, and the lantern string
  const posts = [6, 110, 196, 300, 404, 470, 556, BR0 - 4, BR1 + 4, 800, 874];
  for (const [x0, x1] of [[0, BR0], [BR1, W]]) for (let x = x0; x < x1; x += 60) add(D.railSeg(Math.min(60, x1 - x), { buoy: (x / 60) % 3 === 1 ? 30 : 0 }), x, RAIL - 1, { shadow: false });
  for (const px of posts) { add(D.lanternPost({ color: px % 3 ? K.lantern : '#e8a030' }), px, RAIL - 2); glow(px + 6, RAIL - 30, 10, '#ff9a50', 0.36, { base: RAIL - 2, h: 28 }); }
  // lantern strings between the posts (overlay in 2D, cards + wires in 3D)
  sc.wires3d = [];
  const lanSurf = (col) => { const s2 = newSurf(9, 14), p2 = new Pen(s2, 3); D.chochin(p2, 4, 1, { color: col, r: 3, h: 4 }); return s2; };
  for (let k = 0; k + 1 < posts.length; k++) {
    const a = posts[k] + 2, b = posts[k + 1] + 2; if (a >= BR0 - 6 && b <= BR1 + 8) continue;
    const top = RAIL - 46, sag = 7;
    let px = a, py = top;
    for (let s = 1; s <= 24; s++) { const t = s / 24, x = a + (b - a) * t, y = top + Math.sin(t * Math.PI) * sag; ov.line(Math.round(px), Math.round(py), Math.round(x), Math.round(y), '#2a1a24'); px = x; py = y; }
    sc.wires3d.push({ a: [a, RAIL - 2, 44], b: [b, RAIL - 2, 44], sag });
    for (let x = a + 12; x < b - 6; x += 16) { const t = (x - a) / (b - a), y = Math.round(top + Math.sin(t * Math.PI) * sag), col = (x >> 4) % 3 ? K.lantern : '#e8a030'; D.chochin(ov, x, y, { color: col, r: 3, h: 4 }); sc.add({ surf: lanSurf(col), ax: 4, ay: RAIL - 2 - y + 1 }, x, RAIL - 2, { only3d: true, shadow: true, solid: false }); glow(x, y + 7, 7, '#ff9a50', 0.26, { base: RAIL - 2, h: RAIL - 2 - y - 7 }); }
  }

  // ---------------------------------------------------------------- the canal: boat, floating lanterns, reflections
  const boat = add(D.tourBoat(), 250, 412, { solid: false, shadow: false });
  const floats = [[64, 376], [94, 390], [446, 372], [826, 396]].map(([x, y], i) => add(D.floatLantern(i % 2 ? '#ffd890' : '#ffb0a0'), x, y, { solid: false, shadow: false }));
  for (const f of floats) glow(f.x, f.y - 3, 8, '#ffc080', 0.34, { base: f.y, h: 3 });
  glow(250, 400, 40, '#ffb070', 0.18, { base: 412, h: 14 });
  {
    const comp = newSurf(W, FB + 1), cp = new Pen(comp, 1);
    for (let y = 0; y <= FB; y++) for (let x = 0; x < W; x++) comp.data[y * W + x] = sc.ground.data[y * W + x];
    cp.put(row, 0, 0);
    // a faint mirrored facade for colour texture: shopfronts just off the bank, roof signs furthest out
    const layers = [{ A: 0, map: (yr) => FB - 4 - (yr - WATER0) * 2.0, x0: 0, x1: W - 1, y0: 0, y1: FB, get: (x, y) => comp.get(x, y) }];
    reflect(g, layers, WATER0, WATER1, { k: 1.2, amp: 6, wave: 1.4, jit: 1, gap: 0.5, streak: 0, decay: 0.9, tint: [0.75, 0.82, 1], alpha: (L) => 0.24 * smooth(0.62, 0.98, L) });
    // every light on the bank throws a broken column of dashes down the water
    for (const L of glows) {
      if (L.y > WATER0 - 4 || L.r < 7) continue;
      const near = L.y > RAIL - 60, x0 = L.x, w = Math.max(2, Math.min(16, L.r * (near ? 0.45 : 0.55))), a0 = Math.min(0.85, L.a * 1.6);
      const y0 = WATER0 + (near ? 4 + Math.round((RAIL - L.y) * 0.25) : 1 + Math.round((FB - Math.min(FB, L.y)) * 0.12));
      const len = Math.min(WATER1 - y0 - 1, Math.round(near ? 20 + L.r * 1.2 : 26 + L.r * 1.3));
      const core = mix(L.color, '#ffffff', 0.3), seed = L.x * 0.37 + L.y;
      for (let j = 0; j < len; j++) {
        const y = y0 + j, t = j / len; if (y >= WATER1 || (j + Math.round(seed)) % 3 === 2) continue;
        const n = noise2(seed + j * 0.31, j * 0.7, 23), hw = w * 0.5 * (0.45 + 0.75 * n) * (1 + t * 0.7);
        const cx = x0 + Math.sin(j * 0.55 + seed) * 1.6 + (noise2(seed, j * 0.2, 29) - 0.5) * 6 * t;
        const a = a0 * Math.pow(1 - t, 0.9) * (n > 0.25 ? 1 : 0.3);
        for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) { if (x > BR0 - 2 && x < BR1 + 2) continue; const e = Math.abs(x - cx) / Math.max(1, hw); g.blend(x, y, e < 0.35 ? core : L.color, a * (e < 0.35 ? 1 : 0.7)); }
      }
    }
    // the boat and floating lanterns mirror about their own waterline
    const fl = [];
    for (const s2 of sc.sprites) if (!s2.only3d && s2.y >= WATER0 && s2.y < WATER1 && !s2.person) fl.push(sprLayer(s2, s2.y));
    reflect(g, fl, WATER0, WATER1, { k: 1.1, amp: 4, wave: 1, jit: 1, gap: 0.55, streak: 0.3, decay: 0.85, tint: [0.75, 0.82, 1], alpha: (L) => 0.08 + 0.55 * smooth(0.4, 0.9, L) });
  }
  // glints of neon on the ripples (static part; fx adds shimmer)
  for (let k = 0; k < 90; k++) { const x = g.ri(0, W - 4), y = g.ri(WATER0 + 3, WATER1 - 3); if (x > BR0 - 2 && x < BR1 + 2) continue; g.hl(x, x + g.ri(1, 3), y, g.pick(['#1e3450', '#24405e', '#2a2850'])); }
  for (let x = 0; x < W; x += 3) if (noise2(x * 0.2, 2, 5) > 0.5) g.px(x, WATER1 - 1, '#3a4a68');   // lapping at the south edge

  // ---------------------------------------------------------------- Ebisu bridge (deck over the canal)
  {
    const x0 = BR0, x1 = BR1, y0 = RAIL - 2, y1 = WATER1 + 4;
    // shadow on the water east of the deck + a cool rim west
    for (let y = WATER0; y < WATER1; y++) for (let x = x1; x < x1 + 18; x++) if (bayer2(x, y) < 1 - (x - x1) / 18) g.blend(x, y, '#000008', 0.45);
    // granite deck: big slabs, a centre band, the compass-rose court inlay
    slabs(g, x0 + 6, y0, x1 - x0 - 12, y1 - y0, '#4c4858', 20, 8);
    for (let y = y0; y < y1; y++) { g.px(x0 + 29, y, '#5e5a70'); g.px(x1 - 30, y, '#5e5a70'); }
    const cx = (x0 + x1) >> 1, cy = (WATER0 + WATER1) >> 1;
    g.ell(cx, cy, 30, 20, '#3a3648'); g.ell(cx, cy, 28, 18.4, '#5a5670'); g.ell(cx, cy, 26, 17, '#46425a');
    for (let a = 0; a < 16; a++) { const t = (a / 16) * Math.PI * 2, L = a % 4 === 0 ? 1 : a % 2 === 0 ? 0.7 : 0.45; g.line(cx, cy, Math.round(cx + Math.cos(t) * 25 * L), Math.round(cy + Math.sin(t) * 16 * L), a % 4 === 0 ? '#b8a060' : '#6a6680'); }
    g.ell(cx, cy, 6, 4, '#b8a060'); g.ell(cx, cy, 4, 2.6, '#2a8a9a'); g.px(cx - 1, cy - 1, '#7af0ff');
    g.text('えびす橋', cx - 18, cy + 21, '#8a86a0', { jpSize: 9 });
    // balustrades: stone posts + a lit rail on both edges
    for (const ex of [x0, x1 - 6]) {
      g.rect(ex, y0, 6, y1 - y0, '#2e2a3a'); g.vl(ex + 1, y0, y1 - 1, '#7a7690'); g.vl(ex + 2, y0, y1 - 1, '#5e5a72'); g.vl(ex + 4, y0, y1 - 1, '#3a3648');
      for (let y = y0 + 4; y < y1 - 2; y += 12) { g.rect(ex, y, 6, 5, '#625e78'); g.hl(ex, ex + 5, y, '#8a86a0'); g.hl(ex, ex + 5, y + 4, '#2a2636'); }
    }
    g.wash(x0 + 6, y0, 4, y1 - y0, '#000000', 0.25);
  }

  // ---------------------------------------------------------------- the south promenade
  for (const [x0, x1] of [[0, BR0], [BR1, W]]) for (let x = x0; x < x1; x += 60) add(D.railSeg(Math.min(60, x1 - x), { top: '#7a7a94' }), x, SOUTH, { shadow: false });
  add(D.signpost(), 584, 474); add(D.ticketBooth(), 790, 470); glow(790, 440, 20, '#ffe0a0', 0.3, { base: 470, h: 30 });
  add(D.benchN({ wood: '#6a4a3a' }), 120, 470); add(D.benchN({ wood: '#6a4a3a' }), 400, 474);
  add(PR.plantPot({ big: true, flowers: '#ff8ad8' }), 270, 470); add(PR.plantPot({ big: true }), 852, 474);
  add(D.kaonehame(), 452, 478); glow(452, 452, 16, '#5ad0f0', 0.2);
  add(D.crepeCart(), 312, 470); glow(312, 440, 18, '#ffd0e0', 0.34, { base: 470, h: 30 }); D.pool(g, 312, 474, 30, 10, '#ff9ac8', 0.16);
  for (const [x, w] of [[24, 46], [92, 40], [168, 46], [238, 40], [372, 44], [520, 46], [744, 40], [810, 44], [860, 36]]) add(D.flowerBox(w, { flower: x % 3 ? '#ff8ad8' : '#ffe45c' }), x, DOTONBORI.h - 1, { solid: false });
  add(D.lampPost({ h: 30 }), 200, 466); add(D.lampPost({ h: 30 }), 540, 466);
  glow(200, 438, 18, '#fff2c8', 0.36, { base: 466, h: 28 }); glow(540, 438, 18, '#fff2c8', 0.36, { base: 466, h: 28 });
  D.pool(g, 200, 466, 34, 12, '#fff2c8', 0.16); D.pool(g, 540, 466, 34, 12, '#fff2c8', 0.16); D.pool(g, 790, 476, 30, 10, '#ffe0a0', 0.14);
  D.pool(g, BR0 + 2, RAIL + 2, 26, 10, '#fff2c8', 0.16); D.pool(g, BR1 - 2, RAIL + 2, 26, 10, '#fff2c8', 0.16);
  for (const px of posts) D.pool(g, px + 6, RAIL - 6, 18, 6, '#ff8a50', 0.16);

  // ---------------------------------------------------------------- animated touches: steam, ripple shimmer, drones, ticker
  const steam = [[206, 196], [218, 194], [230, 197], [52, 276], [60, 274]];
  const shimmer = []; for (let k = 0; k < 46; k++) { const x = (k * 157) % W, y = WATER0 + 4 + ((k * 37) % (WATER1 - WATER0 - 8)); if (x > BR0 - 4 && x < BR1 + 4) continue; shimmer.push([x, y, [K.nc, K.nm, K.ny, '#ffffff', K.no][k % 5], k]); }
  const ticker = newSurf(260, 5); { const tp = new Pen(ticker, 1); tp.text('OSAKA LEAGUE TONIGHT * DOTONBORI STREET BATTLES * LUMI LIVE 21:00 * ', 0, 0, '#ff9a3c', { mini: true }); }
  const tcv = ticker.canvas();
  sc.fx.push((c, cam, t) => {
    const cx = Math.round(cam.x), cy = Math.round(cam.y);
    for (const [x, y] of steam) for (let k = 0; k < 4; k++) { const ph = ((t * 0.7 + k * 0.25 + x * 0.01) % 1), px = x + Math.sin(ph * 6 + k) * 3 - cx, py = y - ph * 26 - cy; c.fillStyle = `rgba(255,240,224,${(0.22 * (1 - ph)).toFixed(3)})`; const r = 1 + Math.round(ph * 3); c.fillRect(Math.round(px) - r, Math.round(py) - r, r * 2, r * 2); }
    for (const [x, y, col, k] of shimmer) { const a = 0.5 + 0.5 * Math.sin(t * 2.3 + k * 1.7); if (a < 0.35) continue; c.fillStyle = col; c.globalAlpha = a * 0.6; c.fillRect(x - cx + Math.round(Math.sin(t + k) * 2), y - cy, 2 + (k % 3), 1); }
    c.globalAlpha = 1;
    for (let k = 0; k < 2; k++) { const x = ((t * (14 + k * 9) + k * 400) % (W + 60)) - 30 - cx, y = 38 + k * 22 - cy + Math.sin(t * 2 + k) * 2; c.fillStyle = '#1a1424'; c.fillRect(Math.round(x) - 3, Math.round(y), 7, 2); c.fillStyle = (Math.floor(t * 3 + k) % 2) ? '#ff3a4a' : '#3af07a'; c.fillRect(Math.round(x) - 4, Math.round(y), 1, 1); c.fillRect(Math.round(x) + 4, Math.round(y), 1, 1); }
    const tx = 682 - cx, ty = 30 + 126 + 1 - cy, off = Math.floor(t * 18) % 260;
    if (tx > -100 && tx < c.canvas.width && ty > -10 && ty < c.canvas.height) { c.save(); c.beginPath(); c.rect(tx + 2, ty, 96, 5); c.clip(); c.drawImage(tcv, tx + 2 - off, ty); c.drawImage(tcv, tx + 2 - off + 260, ty); c.restore(); }
  });

  // only the most important glows become real point lights in the 3D stage (it takes 24)
  let n = 0; for (const L of glows) { if (L.light === true && n < 22) n++; else L.light = false; }
  // terraces for the 3D diorama: the painted sky/far city stands as a backdrop set well behind the
  // shopfront card; street + boardwalk at 0; the embankment face; the canal 16 px down; the south bank
  sc.terrain = [
    { y0: 0, y1: FB, h0: 120, h1: -84 },
    { y0: FB, y1: RAIL, h0: 0, h1: 0 },
    { y0: RAIL, y1: WATER0, h0: 0, h1: -16 },
    { y0: WATER0, y1: WATER1, h0: -16, h1: -16 },
    { y0: WATER1, y1: 100000, h0: 0, h1: 0 },
  ];
  sc.bake();
  return sc;
}
const bayer2 = (x, y) => [0.125, 0.625, 0.875, 0.375][(x & 1) + (y & 1) * 2];

// ------------------------------------------------------------------ gameplay layer
const FORTUNES = [
  ['大吉 — Great blessing.', '"A friend made by the water stays for life. Walk the canal at night."'],
  ['中吉 — Middle blessing.', '"Your partner is hungrier than it lets on. Share your takoyaki."'],
  ['小吉 — Small blessing.', '"A loud stranger will challenge you. Switch before you think you need to."'],
  ['吉 — Blessing.', '"The record that spins backwards hides a dragon. Listen closely."'],
  ['末吉 — Future blessing.', '"Today: lose gracefully. Tomorrow: the crab will wave at you."'],
  ['凶 — Curse!', '"…Tie this paper to the rail and walk away. Bad luck stays on the bridge."'],
];
export const DOTONBORI_MAP = {
  name: 'Dotonbori', music: 'dotonbori',
  post: { night: 0.3, bloom: 0.85, threshold: 0.62, rays: 0, warm: 0.25 },   // suggested HD-2D grade for this map
  build(o) {
    const scene = buildDotonbori({ viewW: o.viewW, viewH: o.viewH, night: o.night });
    for (const s of scene.sprites) {
      if (s.facade || s.solid === false) continue;
      const h = s.cv.height, w = s.cv.width;
      if (h < 16) s.solid = false;
      else if (w <= 14 && h > 40) s.foot = [3, 2];                    // lamp / lantern posts
      else if (w > 40 && h > 60) s.foot = [8, 3];                     // willows: planter only
    }
    const say = (app, name, ...lines) => app.say(name, ...lines);
    return {
      scene, terrain: scene.terrain,
      walk: [
        [[0, 208], [W, 208], [W, 331], [0, 331]],                       // Dotonbori street + riverwalk
        [[BR0 + 7, 326], [BR1 - 7, 326], [BR1 - 7, 444], [BR0 + 7, 444]], // Ebisu bridge
        [[0, 441], [W, 441], [W, 499], [0, 499]],                       // south promenade
      ],
      block: [[22, 300, 92, 20], [180, 210, 74, 16], [36, 200, 10, 18]],
      spawns: { start: [356, 262], west: [12, 262], east: [866, 262], south: [658, 488], bridge: [658, 384], icecream: [138, 216], canal: [356, 324] },
      hotspots: [
        { id: 'icecream', x: 140, y: 210, r: 22, label: 'Soft-serve', icon: 'bowl', act: async (app) => { await say(app, 'Yuzu', 'Welcome aboard the Yellow Submarine! Today\'s dive: Matcha-Box, Yuzu Need Is Love, Purple Haze imo…', 'Our soft-serve twists clockwise above the water line and anticlockwise below it. Don\'t ask.'); return app.shop([['matcha', 240], ['ramune', 150]], 'Yuzu leans on the counter. "Anything to take on deck?"'); } },
        { id: 'takoyaki', x: 216, y: 230, r: 26, label: 'Takoyaki', icon: 'bowl', act: async (app) => { await say(app, 'Takoyaki Taisho', 'Oi! Eight balls, eight turns each, crisp outside, molten inside. Blow before you bite, or your Tokonmon\'ll have to carry you home.'); return app.shop([['takoyaki', 380]], 'The griddle hisses. "How many boats?"'); } },
        { id: 'kushikatsu', x: 66, y: 324, r: 26, label: 'Kushikatsu', icon: 'bowl', act: (app) => say(app, 'Yatai Master', 'Fried Zeppelin! Pork, lotus root, quail egg, and a whole shrimp that thinks it\'s an airship.', 'Rule of the house: NO double dipping. One dip in the sauce pot. Your Tokonmon too — I saw that tongue.', 'Want more sauce? Use the cabbage as a spoon. Tradition.') },
        { id: 'okonomiyaki', x: 820, y: 212, r: 22, label: 'Okonomiyaki', icon: 'bowl', act: async (app) => { await say(app, 'Abbey Road', 'Four cooks crossing the kitchen in a line — that\'s how we flip. Today\'s special: "Come Together" (everything mixed in).'); return app.shop([['okonomiyaki', 880]], 'The teppan smokes. "One Come Together?"'); } },
        { id: 'ramen', x: 52, y: 210, r: 18, label: 'Ramen', icon: 'bowl', act: (app) => app.eatAt('ramen') },
        { id: 'karaoke', x: 22, y: 212, r: 16, label: 'Karaoke', icon: 'talk', bubbleH: 44, act: (app) => say(app, '', 'A booth upstairs is shaking. Someone is attempting a key change that has defeated better singers.', 'A flyer by the door: "KARAOKE QUEEN — Tokonmon duets half price. Echo-types must sign a noise waiver."') },
        { id: 'cafe', x: 704, y: 210, r: 18, label: 'Café', icon: 'bowl', act: (app) => app.eatAt('kissa') },
        { id: 'records', x: 482, y: 212, r: 22, label: 'Records', icon: 'talk', act: (app) => say(app, 'Revolver Records', 'Crate-digging at this hour? Respect.', 'See the black one behind the counter? Pressed in 1979, plays fine forwards… but spin it backwards and the shop goes cold. Old-timers say there\'s a dragon in the groove.', 'Not for sale. Obviously.') },
        { id: 'crab', x: 396, y: 214, r: 26, label: 'Look up', icon: 'eye', bubbleH: 44, act: (app) => say(app, '', 'The chili crab waves its giant pepper claw at the crowd every quarter hour.', 'Kids swear it once snapped a drone out of the air. The restaurant swears it didn\'t, and asks you to stop feeding it.') },
        { id: 'fortune', x: 590, y: 222, r: 18, label: 'Fortune', icon: 'star', act: async (app) => { if (app.state.money < 100) return say(app, '', 'The robot cat waves its paw hopefully. (¥100 for a fortune.)'); app.state.money -= 100; const [a, b] = FORTUNES[Math.floor(Math.random() * FORTUNES.length)]; await say(app, 'Omikuji-bot', '*whirr* *clunk* A slip of paper slides out.', a, b); if (app.save) app.save(); } },
        { id: 'drummer', x: 506, y: 220, r: 18, label: 'Drum Machine', icon: 'eye', act: (app) => say(app, '', 'DRUM MACHINE, the tin bandleader of Dotonbori. Since 1952 (repainted 2049) it has never missed a beat.', 'A plaque: "Rub the drum for rhythm. Do not rub the robot."') },
        { id: 'canal', x: 356, y: 330, r: 30, label: 'Canal', icon: 'heart', act: (app) => say(app, '', 'Neon melts into the black water and shivers back into shape.', 'A tour boat slides under the bridge, lanterns swaying. Your partner leans on the railing next to you and doesn\'t say anything. It doesn\'t need to.') },
        { id: 'bridge', x: 658, y: 384, r: 32, label: 'Ebisu Bridge', icon: 'eye', act: (app) => say(app, '', 'Ebisu Bridge. Trainers meet here to show off — the compass rose in the deck is an official League court.', 'Up on the drugstore roof, THE LONG RUN sprints forever toward a sunset that never comes.') },
        { id: 'boat', x: 790, y: 474, r: 22, label: 'Cruise', icon: 'talk', act: (app) => say(app, 'Ticket booth', 'Canal cruise! Twenty minutes, every lantern on Dotonbori, one free splash. Next boat when the Long Run man finishes his lap.') },
      ],
      exits: [{ x: BR0 + 10, y: 492, w: BR1 - BR0 - 20, h: 8, act: (app) => app.travel('plaza', 'start') }],
      npcs: [],
    };
  },
};
