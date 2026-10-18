// Dotonbori prop kit (night). Neon tubes and blade signs, lit windows, wall
// textures, the big original 3D mascot signs (octopus, chili crab, the runner
// LED board, fugu lantern, yellow submarine…), food stalls and canal-side
// furniture. Painters take a Pen and paint at (x, y) = top-left unless noted;
// sprite builders return { surf, ax, ay } anchored at the ground contact.
import { Pen, C, newSurf, shift, mix } from '../../px/paint.js';
import { bayer } from '../../px/color.js';

// night palette: neon keys (shared with the 3D prop kit) + dark materials
export const K = {
  nc: '#3ff0ff', nm: '#ff4ac8', ny: '#ffe45c', nr: '#ff3b4f', no: '#ff8a3c', nv: '#9d6bff', nw: '#eafcff', ng: '#5dff9a',
  ink: '#140f1e', ink2: '#1e1828', ink3: '#2a2234',
  win: '#ffd48a', win2: '#e8a868', win3: '#a8684a',
  glass: '#232842', glass2: '#161a2c',
  lantern: '#d93a2b', paper: '#ffe9c4', steel: '#4a4a5c', steelL: '#7a7a90', steelD: '#2e2e3c',
  wood: '#5a3c32', wood2: '#40281f', woodL: '#7a5440',
};
export const hot = (c, t = 0.5) => mix(c, '#ffffff', t);
export function sprite(w, h, ax, ay, fn, seed = 3) { const s = newSurf(w, h), p = new Pen(s, seed); fn(p, s); return { surf: s, ax, ay }; }

// ------------------------------------------------------------------ light
// a pool of coloured light, quantised into dithered bands (crafted, not airbrushed)
export function pool(p, cx, cy, rx, ry, col, a = 0.3, steps = 4) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry, d = u * u + v * v; if (d >= 1) continue;
    const q = Math.min(steps, Math.floor((1 - d) * steps + bayer(x, y))) / steps;
    if (q > 0 && (p.s.get(x, y) >>> 24)) p.blend(x, y, col, a * q);
  }
}
// neon lettering: a hot core with a saturated tube edge
export function neonText(p, str, x, y, col, o = {}) {
  const t = { scale: o.scale || 1, jpSize: o.jpSize, mini: o.mini, spacing: o.spacing ?? 1 };
  if (o.align === 'center') x -= Math.floor(p.textW(str, t) / 2);
  if (o.ring !== false) for (const [dx, dy] of o.thin ? [[1, 0], [0, 1]] : [[-1, 0], [1, 0], [0, -1], [0, 1]]) p.text(str, x + dx, y + dy, o.ringCol || shift(col, -0.6), t);
  p.text(str, x, y, o.core || hot(col, 0.55), t);
  return p.textW(str, t);
}
// marquee bulbs round a box, alternating lit / dim
export function bulbs(p, x, y, w, h, col, step = 3, phase = 0) {
  const on = hot(col, 0.65), off = shift(col, -1.4); let k = phase;
  const b = (i, j) => p.px(i, j, (k++ % 2) ? on : off);
  for (let i = x; i < x + w - 1; i += step) b(i, y);
  for (let j = y; j < y + h - 1; j += step) b(x + w - 1, j);
  for (let i = x + w - 1; i > x; i -= step) b(i, y + h - 1);
  for (let j = y + h - 1; j > y; j -= step) b(x, j);
}
// a neon tube along a polyline: 1 px hot core, saturated sides
export function tube(p, pts, col, closed = false) {
  const seg = (a, b) => { p.line(a[0] + 1, a[1], b[0] + 1, b[1], shift(col, -0.5)); p.line(a[0], a[1] + 1, b[0], b[1] + 1, shift(col, -0.5)); };
  for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) seg(pts[i], pts[(i + 1) % pts.length]);
  for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; p.line(a[0], a[1], b[0], b[1], hot(col, 0.5)); }
}
export function ringTube(p, cx, cy, rx, ry, col) {
  const n = Math.max(16, Math.round((rx + ry) * 3)), pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push([Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry)]); }
  tube(p, pts, col, true);
}

// ------------------------------------------------------------------ walls
export function wallTex(p, x, y, w, h, base, kind = 'panel', o = {}) {
  p.rect(x, y, w, h, base);
  const dk = shift(base, -0.35), lt = shift(base, 0.35);
  if (kind === 'tile') {
    const tw = o.tw || 5, th = o.th || 4;
    for (let j = y + th - 1; j < y + h; j += th) p.hl(x, x + w - 1, j, dk);
    for (let j = y, r = 0; j < y + h; j += th, r++) for (let i = x + (r % 2 ? tw >> 1 : 0); i < x + w; i += tw) p.vl(i, j, Math.min(y + h - 1, j + th - 2), dk);
    // a few tiles fallen / replaced: clustered, a tone off
    for (let k = 0; k < (w * h) / 500; k++) { const i = x + Math.floor(p.ri(0, w - tw) / tw) * tw + 1, j = y + Math.floor(p.ri(0, h - th) / th) * th; p.rect(i, j, tw - 1, th - 1, p.chance(0.5) ? lt : shift(base, -0.2)); }
  } else if (kind === 'brick') {
    for (let j = y + 3, r = 0; j < y + h; j += 4, r++) { p.hl(x, x + w - 1, j, dk); for (let i = x + (r % 2) * 4; i < x + w; i += 8) p.vl(i, j - 3, j - 1, dk); }
    for (let k = 0; k < (w * h) / 260; k++) { const i = x + Math.floor(p.ri(0, w - 8) / 8) * 8 + 1, j = y + Math.floor(p.ri(0, h - 4) / 4) * 4; p.rect(i, j, 7, 3, p.pick([lt, shift(base, -0.18), mix(base, '#7a3a3a', 0.3)])); }
  } else if (kind === 'wood') {
    for (let i = x; i < x + w; i += 4) { p.vl(i, y, y + h - 1, dk); if (p.chance(0.4)) p.rect(i + 1, y, 3, h, shift(base, p.chance(0.5) ? 0.12 : -0.12)); }
    for (let k = 0; k < w / 6; k++) { const i = x + p.ri(0, w - 1), j = y + p.ri(0, h - 3); p.vl(i, j, j + 2, shift(base, -0.6)); }
  } else if (kind === 'rivet') {
    for (let j = y + 9; j < y + h; j += 10) { p.hl(x, x + w - 1, j, dk); p.hl(x, x + w - 1, j + 1, lt); for (let i = x + 2; i < x + w; i += 5) p.px(i, j - 1, lt); }
    for (let i = x + 24; i < x + w; i += 30) p.vl(i, y, y + h - 1, dk);
  } else if (kind === 'stripe') {
    for (let i = x + 2; i < x + w; i += 6) { p.vl(i, y, y + h - 1, dk); p.vl(i + 1, y, y + h - 1, lt); }
  } else {             // concrete panels
    const pw = o.pw || 20;
    for (let i = x + pw; i < x + w - 2; i += pw) p.vl(i, y, y + h - 1, dk);
    for (let j = y + (o.ph || 26); j < y + h - 2; j += o.ph || 26) p.hl(x, x + w - 1, j, dk);
    p.blots(x, y, w, h, shift(base, -0.25), Math.round((w * h) / 380), 3);
  }
  // weathering: grime under the top, stains running down
  p.drips(x, y + 1, w, 10, shift(base, -0.5), Math.round(w / 9));
}
// building edge treatment: dark silhouette sides, lit left rim, shaded right
export function edges(p, x, y, w, h, base) {
  p.vl(x, y, y + h - 1, shift(base, 0.5)); p.vl(x + w - 1, y, y + h - 1, shift(base, -0.7)); p.vl(x + w - 2, y, y + h - 1, shift(base, -0.3));
  p.vl(x - 1, y, y + h - 1, K.ink); p.vl(x + w, y, y + h - 1, K.ink);
}
export function ledge(p, x, w, y, base) {        // floor-band ledge with a lit lip and its shadow
  p.hl(x, x + w - 1, y, shift(base, 0.7)); p.hl(x, x + w - 1, y + 1, shift(base, -0.2)); p.hl(x, x + w - 1, y + 2, shift(base, -0.9));
  p.wash(x, y + 3, w, 2, K.ink, 0.35);
}
export function parapet(p, x, y, w, base, o = {}) {
  p.rect(x - 1, y, w + 2, 4, shift(base, 0.3)); p.hl(x - 1, x + w, y, shift(base, 1.1)); p.hl(x - 1, x + w, y + 3, shift(base, -0.6));
  p.hl(x - 2, x + w + 1, y - 1, K.ink); p.wash(x, y + 4, w, 3, K.ink, 0.35);
  if (o.rail) { for (let i = x; i < x + w; i += 4) p.vl(i, y - 6, y - 1, K.steelD); p.hl(x, x + w - 1, y - 6, K.steelL); p.hl(x, x + w - 1, y - 5, K.steelD); }
}
// rooftop clutter: water tank, condensers, antenna, dish, solar panel (2050)
export function roofJunk(p, x, y, w, o = {}) {
  const items = o.items || ['tank', 'ac', 'antenna'];
  let cx = x + 4;
  for (const it of items) {
    if (it === 'tank') { p.block(cx, y - 14, 14, 11, '#5a5e6e', { line: K.ink }); p.hl(cx, cx + 13, y - 10, '#4a4e5c'); p.hl(cx, cx + 13, y - 6, '#4a4e5c'); p.vl(cx + 2, y - 3, y - 1, K.steelD); p.vl(cx + 11, y - 3, y - 1, K.steelD); p.px(cx + 1, y - 13, '#8a8ea0'); cx += 18; }
    else if (it === 'ac') { p.block(cx, y - 7, 11, 6, '#6a6a7a', { line: K.ink }); p.ell(cx + 4, y - 4, 2, 2, '#3a3a4a'); p.px(cx + 9, y - 5, K.ng); cx += 14; }
    else if (it === 'antenna') { p.vl(cx + 3, y - 22, y - 1, K.steelL); p.hl(cx, cx + 6, y - 19, K.steelL); p.hl(cx + 1, cx + 5, y - 15, K.steelL); p.px(cx + 3, y - 23, K.nr); cx += 9; }
    else if (it === 'dish') { p.ell(cx + 5, y - 8, 5, 5, '#8a8a9a'); p.ell(cx + 6, y - 8, 3.5, 3.5, '#6a6a7a'); p.line(cx + 5, y - 8, cx + 9, y - 12, K.steelL); p.vl(cx + 5, y - 4, y - 1, K.steelD); cx += 13; }
    else if (it === 'solar') { for (let k = 0; k < 2; k++) { const sx = cx + k * 12; p.poly([[sx, y - 2], [sx + 3, y - 10], [sx + 13, y - 10], [sx + 10, y - 2]], '#2a3a6a'); p.line(sx + 3, y - 10, sx + 13, y - 10, '#6a8ac8'); p.line(sx + 6, y - 10, sx + 4, y - 2, '#1a2448'); p.line(sx + 9, y - 10, sx + 7, y - 2, '#1a2448'); } cx += 26; }
    else if (it === 'gap') cx += 10;
  }
}

// ------------------------------------------------------------------ windows
// night window: lit interiors (curtains / blinds / people / lamps) or dark glass with neon glints
export function nWin(p, x, y, w, h, o = {}) {
  const fr = o.frame || '#6c6a7c';
  p.rect(x - 1, y - 1, w + 2, h + 2, o.line || K.ink2);
  p.rect(x, y, w, h, fr); p.hl(x, x + w - 1, y, shift(fr, 0.8));
  const gx = x + 1, gy = y + 1, gw = w - 2, gh = h - 2;
  if (o.lit) {
    const L = typeof o.lit === 'string' ? o.lit : K.win;
    p.vgrad(gx, gy, gw, gh, [hot(L, 0.2), L, shift(L, -0.8)]);
    const kind = o.kind ?? p.ri(0, 4), S = mix(L, K.ink, 0.7);
    if (kind === 0) {           // curtains
      const cc = o.curtain || p.pick(['#b85a52', '#7a5a9a', '#4a7a6e', '#b8863a', '#c87aa0']), cw = Math.max(1, gw >> 2);
      p.rect(gx, gy, cw, gh, cc); p.rect(gx + gw - cw, gy, cw, gh, cc); p.vl(gx + cw - 1, gy, gy + gh - 1, shift(cc, -0.8)); p.vl(gx + gw - cw, gy, gy + gh - 1, shift(cc, -0.8));
      p.hl(gx, gx + gw - 1, gy, shift(cc, -0.6));
    } else if (kind === 1) {    // blinds, half down
      const bh = p.ri(2, gh - 2); for (let j = gy; j < gy + bh; j += 2) p.hl(gx, gx + gw - 1, j, shift(L, -1)); p.hl(gx, gx + gw - 1, gy + bh, shift(L, -1.6));
    } else if (kind === 2) {    // somebody at the window
      const sx = gx + p.ri(1, Math.max(1, gw - 6));
      p.ell(sx + 2.5, gy + gh - 7, 2, 2.2, S); p.rect(sx, gy + gh - 4, 6, 4, S); p.px(sx + 1, gy + gh - 8, mix(S, L, 0.4));
    } else if (kind === 3) {    // pendant lamp + shelf
      const lx = gx + (gw >> 1); p.vl(lx, gy, gy + 2, S); p.rect(lx - 1, gy + 3, 3, 1, hot(L, 0.6)); p.hl(gx, gx + gw - 1, gy + gh - 3, S); for (let i = gx + 1; i < gx + gw - 1; i += 2) p.px(i, gy + gh - 4, p.pick([K.nr, '#6a9ac8', '#e8c060', S]));
    } else {                    // plant on the sill
      p.ell(gx + 2, gy + gh - 3, 2, 2, '#2a4a32'); p.px(gx + 1, gy + gh - 4, '#4a7a4a'); p.vl(gx + 2, gy + gh - 2, gy + gh - 1, S);
    }
  } else {
    p.vgrad(gx, gy, gw, gh, [o.glass || K.glass, K.glass2]);
    const rc = mix(o.refl || K.nv, K.glass, 0.45);
    for (let k = -gh; k < gw; k += 6) for (let j = 0; j < gh; j++) { const i = k + j; if (i >= 0 && i < gw && (j + k) % 6 < 1) p.px(gx + i, gy + gh - 1 - j, rc); }
    p.px(gx, gy, mix(o.refl || K.nv, '#ffffff', 0.3));
  }
  if (gw > 9 && o.mullion !== false) p.vl(x + (w >> 1), gy, gy + gh - 1, fr);
  p.hl(x - 1, x + w, y + h, shift(fr, 0.4)); p.wash(x - 1, y + h + 1, w + 2, 1, K.ink, 0.3);
}
export function acNight(p, x, y, wall) {
  const b = '#7a7a8a';
  p.block(x, y, 13, 8, b, { line: K.ink });
  p.ell(x + 4.5, y + 4, 2.8, 2.8, '#4a4a5a'); p.px(x + 4, y + 3, '#9a9aaa');
  for (let j = y + 2; j < y + 7; j += 2) p.hl(x + 9, x + 11, j, '#5a5a6a');
  p.px(x + 11, y + 1, K.ng);
  p.wash(x, y + 9, 13, 1, K.ink, 0.35);
  p.vl(x + 11, y + 9, y + 11 + p.ri(1, 6), shift(wall, -0.8));
}
export function pipeN(p, x, y0, y1, c = '#5c5868') { p.vl(x, y0, y1, shift(c, 0.6)); p.vl(x + 1, y0, y1, c); p.vl(x + 2, y0, y1, shift(c, -0.9)); for (let y = y0 + 6; y < y1; y += 16) p.hl(x - 1, x + 3, y, shift(c, -1.2)); }

// ------------------------------------------------------------------ signs
// vertical blade sign (tategaki) on a bracket, with neon glyphs and optional bulbs
export function bladeSign(p, x, y, str, o = {}) {
  const sz = o.size || 10, chars = [...str], n = chars.length, w = sz + 6, h = n * (sz + 2) + 6, bg = o.bg || '#1c1026', col = o.col || K.nm;
  const bx = o.wall === 'left' ? x - 4 : x + w;
  p.rect(bx, y + 3, 4, 2, K.steelD); p.rect(bx, y + h - 6, 4, 2, K.steelD);
  p.rect(x - 1, y - 1, w + 2, h + 2, K.ink);
  p.rect(x, y, w, h, bg);
  p.hl(x, x + w - 1, y, shift(bg, 1.2)); p.vl(x, y, y + h - 1, shift(bg, 0.6));
  if (o.frame !== false) p.frame(x + 1, y + 1, w - 2, h - 2, o.frameCol || shift(col, -0.4));
  if (o.bulbs) bulbs(p, x, y, w, h, o.bulbs, 2);
  chars.forEach((ch, i) => neonText(p, ch, x + 3, y + 3 + i * (sz + 2), o.fg || col, { jpSize: sz, thin: true, ringCol: shift(o.fg || col, -1) }));
  p.rect(x + 1, y + h, w - 2, 1, shift(bg, -1));
  return { w, h, cx: x + w / 2, cy: y + h / 2 };
}
// a horizontal fascia band (lightbox / neon on dark)
export function fascia(p, x, y, w, h, o = {}) {
  const bg = o.bg || '#1c1226';
  p.rect(x - 1, y - 1, w + 2, h + 2, K.ink);
  if (o.grad) p.vgrad(x, y, w, h, o.grad); else p.rect(x, y, w, h, bg);
  p.hl(x, x + w - 1, y, shift(o.grad ? o.grad[0] : bg, 0.9));
  p.hl(x, x + w - 1, y + h - 1, shift(o.grad ? o.grad[o.grad.length - 1] : bg, -0.8));
  if (o.bulbs) bulbs(p, x, y, w, h, o.bulbs, 3);
  p.wash(x, y + h + 1, w, 2, K.ink, 0.4);
}
export function noren(p, x, y, w, o = {}) {
  const c = o.color || '#2a3058', h = o.h || 11, n = Math.max(2, Math.round(w / 8)), pw = Math.floor(w / n);
  p.hl(x - 1, x + w, y - 1, K.wood2);
  for (let k = 0; k < n; k++) { const px = x + k * pw; p.rect(px, y, pw - 1, h, c); p.vl(px, y, y + h - 1, shift(c, 0.6)); p.hl(px, px + pw - 2, y + h - 1, shift(c, -0.8)); p.px(px + pw - 2, y + h, shift(c, -0.4)); }
  if (o.mark) { const sz = o.size || 8, tw = p.textW(o.mark, { jpSize: sz }); p.text(o.mark, x + Math.round((w - tw) / 2), y + 2, o.markCol || K.paper, { jpSize: sz }); }
}
export function chochin(p, x, y, o = {}) {      // red paper lantern, lit from inside (x, y = hook)
  const c = o.color || K.lantern, r = o.r || 3.5, hgt = o.h || 5;
  p.vl(x, y, y + 1, K.ink2); p.rect(x - 2, y + 2, 5, 1, K.ink2);
  p.ell(x + 0.5, y + 3 + hgt, r, hgt, shift(c, -0.4));
  p.ell(x + 0.5 - 0.6, y + 3 + hgt - 0.6, r - 1.2, hgt - 1.2, c);
  p.ell(x + 0.5 - 0.8, y + 3 + hgt - 1, r - 2.2, hgt - 2.6, hot(c, 0.45));
  for (let j = y + 5; j < y + 3 + hgt * 2; j += 2) p.px(x + Math.round(r) - 1, j, shift(c, -1));
  p.rect(x - 2, y + 3 + hgt * 2, 5, 1, K.ink2);
  if (o.mark) p.px(x, y + 3 + hgt, K.ink);
}

// ------------------------------------------------------------------ hero signs (original designs)
// a cheery octopus mascot in a twisted headband, holding up a takoyaki on a pick
export function octopusSign(cx, cy) {
  const W = 92, H = 78, s = newSurf(W, H), p = new Pen(s, 41), ox = W / 2, oy = 26;
  const base = '#e0563c', lit = '#ff8a5e', hi = '#ffc69a', sh = '#a83a3c', dp = '#6e2238', suck = '#ffb0a0';
  const tone = (l) => (l > 0.7 ? hi : l > 0.25 ? lit : l > -0.25 ? base : l > -0.65 ? sh : dp);
  // tentacles (behind the head): curling ribbons with suckers on the underside
  const tent = (x0, y0, ang, len, curl, wid) => {
    let x = x0, y = y0, a = ang;
    const pts = [];
    for (let k = 0; k < len; k++) { pts.push([x, y, wid * (1 - k / len * 0.7)]); a += curl * (k / len); x += Math.cos(a); y += Math.sin(a); }
    for (const [px, py, r] of pts) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (i * i + j * j > r * r) continue; const l = -(i * 0.6 + j * 0.8) / r; p.px(Math.round(px + i), Math.round(py + j), tone(l * 0.9 - 0.1)); }
    for (let k = 3; k < pts.length - 2; k += 3) { const [px, py, r] = pts[k]; p.px(Math.round(px + r * 0.4), Math.round(py + r * 0.6), suck); }
  };
  tent(ox - 14, oy + 18, Math.PI * 0.95, 26, -1.1, 4);   // far left, curling up
  tent(ox + 14, oy + 18, Math.PI * 0.05, 26, 1.1, 4);    // far right, curling up
  tent(ox - 9, oy + 21, Math.PI * 0.75, 28, -0.5, 4.2);
  tent(ox + 9, oy + 21, Math.PI * 0.25, 28, 0.6, 4.2);
  tent(ox - 4, oy + 22, Math.PI * 0.58, 26, -1.4, 4);
  tent(ox + 4, oy + 22, Math.PI * 0.42, 24, 1.4, 4);
  // the raised arm holding the takoyaki pick
  tent(ox + 17, oy + 12, -Math.PI * 0.15, 20, -1.2, 3.6);
  // head (mantle): big round, lit from the upper left, spots
  const hx = ox, hy = oy, rx = 21, ry = 19;
  for (let j = -ry; j <= ry + 2; j++) for (let i = -rx; i <= rx; i++) {
    const u = i / rx, v = j / ry, d = u * u + v * v; if (d > 1) continue;
    const l = -(u * 0.55 + v * 0.75) + (1 - d) * 0.35 - 0.1;
    p.px(Math.round(hx + i), Math.round(hy + j), d > 0.86 && u + v > 0.2 ? dp : tone(l));
  }
  for (const [sx, sy, r] of [[-9, -10, 2.5], [6, -13, 2], [12, -4, 1.6], [-14, 0, 1.6], [2, -6, 1.3]]) { p.ell(hx + sx, hy + sy, r, r * 0.85, mix(base, hi, 0.45)); p.px(Math.round(hx + sx - r * 0.5), Math.round(hy + sy - r * 0.4), hi); }
  p.px(hx - 11, hy - 13, '#fff0e0'); p.px(hx - 10, hy - 14, '#fff0e0'); p.px(hx - 12, hy - 12, hi);
  // twisted hachimaki band round the brow
  for (let i = -rx; i <= rx; i++) { const yb = Math.round(hy - 1 + (i * i) / (rx * 6)); for (let t = 0; t < 4; t++) { const st = ((i + t) >> 1) % 2 === 0; p.px(hx + i, yb + t, st ? (t === 0 ? '#ffffff' : '#ece0d0') : (t === 3 ? '#9a2030' : '#d8303e')); } }
  // knot + tails on the right
  p.ell(hx + 19, hy + 1, 3, 2.6, '#ece0d0'); p.px(hx + 18, hy, '#ffffff');
  p.line(hx + 21, hy + 2, hx + 27, hy - 3, '#d8303e'); p.line(hx + 21, hy + 3, hx + 28, hy, '#ece0d0'); p.line(hx + 22, hy + 3, hx + 27, hy + 6, '#d8303e');
  // face: big eyes, blush, little funnel mouth
  for (const ex of [-8, 7]) {
    p.ell(hx + ex, hy + 10, 4.2, 4.6, '#fff8f0'); p.ell(hx + ex + 0.7, hy + 10.6, 2.6, 3.2, '#2a1420');
    p.px(hx + ex - 1, hy + 8, '#ffffff'); p.px(hx + ex, hy + 8, '#ffffff'); p.px(hx + ex + 2, hy + 12, '#8a6a9a');
  }
  p.ell(hx - 14, hy + 15, 3, 1.6, '#ff8aa0'); p.ell(hx + 13, hy + 15, 3, 1.6, '#ff8aa0');
  p.ell(hx, hy + 17, 3, 2.4, sh); p.ell(hx, hy + 17, 1.6, 1.2, dp); p.px(hx - 1, hy + 15, lit);
  // pick + takoyaki ball (sauce, mayo zigzag, aonori)
  const tx = ox + 34, ty = 14;
  p.line(ox + 26, oy + 2, tx, ty + 4, '#e8d8b0');
  p.ell(tx, ty, 6, 5.6, '#c88a44'); p.ell(tx - 1, ty - 1, 4.6, 4, '#e0a85a'); p.px(tx - 3, ty - 3, '#ffe0a0');
  p.ell(tx, ty - 1, 5, 2.4, '#5a2a14'); p.px(tx - 2, ty - 2, '#8a4a24');
  for (let i = -4; i <= 4; i += 2) { p.px(tx + i, ty - 2 + (i % 4 ? 1 : 0), '#fff8e8'); }
  p.px(tx + 1, ty - 3, '#5ac85a'); p.px(tx - 2, ty, '#5ac85a'); p.px(tx + 3, ty + 1, '#ff9ab0');
  p.outline('#2a0c1a');
  return { surf: s, x: cx - Math.round(ox), y: cy - oy };
}

// giant chili crab: a chili-red body over the door with ONE huge raised claw
// whose pincer has a green pepper calyx at the wrist
export function crabSign(cx, cy) {
  const W = 128, H = 72, s = newSurf(W, H), p = new Pen(s, 53), ox = 56, oy = 46;
  const base = '#d4302c', lit = '#f45a44', hi = '#ffa088', sh = '#962436', dp = '#5e1a30';
  const tone = (l) => (l > 0.68 ? hi : l > 0.2 ? lit : l > -0.3 ? base : l > -0.7 ? sh : dp);
  const limb = (x0, y0, x1, y1, r0, r1) => {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let k = 0; k <= n; k++) { const t = k / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, r = r0 + (r1 - r0) * t; for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (i * i + j * j > r * r) continue; p.px(Math.round(x + i), Math.round(y + j), tone(-(i * 0.5 + j * 0.9) / Math.max(1, r))); } }
    p.px(Math.round(x1), Math.round(y1), dp);
  };
  // walking legs, splayed along the wall (4 a side)
  for (let k = 0; k < 4; k++) {
    const yb = oy + 2 + k * 3;
    const lx = ox - 24 - k * 2, lx2 = lx - 14 - k * 2, ly2 = yb - 6 + k * 5;
    limb(ox - 18, yb, lx, yb - 4 + k * 2, 3, 2.4); limb(lx, yb - 4 + k * 2, lx2, ly2 + 6, 2.4, 1);
    const rx = ox + 24 + k * 2, rx2 = rx + 14 + k * 2;
    limb(ox + 18, yb, rx, yb - 4 + k * 2, 3, 2.4); limb(rx, yb - 4 + k * 2, rx2, ly2 + 6, 2.4, 1);
  }
  // small left claw
  limb(ox - 16, oy - 4, ox - 26, oy - 14, 3.2, 3); p.ell(ox - 30, oy - 18, 6, 4.6, base); p.ell(ox - 31, oy - 19, 4, 2.8, lit);
  p.line(ox - 34, oy - 22, ox - 37, oy - 26, sh); p.line(ox - 33, oy - 15, ox - 38, oy - 18, sh);
  // body / carapace
  for (let j = -15; j <= 13; j++) for (let i = -27; i <= 27; i++) {
    const u = i / 27, v = j / (j < 0 ? 15 : 13), d = u * u + v * v; if (d > 1) continue;
    const l = -(u * 0.5 + v * 0.8) + (1 - d) * 0.3 - 0.05;
    p.px(ox + i, oy + j, d > 0.88 && v > -0.2 ? dp : tone(l));
  }
  // carapace bumps + front spines
  for (const [bx, by] of [[-12, -6], [-4, -9], [5, -8], [13, -5], [-18, 0], [19, 1], [0, -3], [-8, 2], [9, 3]]) { p.px(ox + bx, oy + by, hi); p.px(ox + bx + 1, oy + by + 1, sh); }
  for (let i = -24; i <= 24; i += 6) { p.px(ox + i, oy - 15 + Math.round((i * i) / 120), hi); p.px(ox + i, oy - 16 + Math.round((i * i) / 120), lit); }
  // eye stalks
  for (const ex of [-6, 6]) { p.vl(ox + ex, oy - 22, oy - 14, sh); p.vl(ox + ex - 1, oy - 21, oy - 15, lit); p.ell(ox + ex, oy - 24, 3, 3, '#1c1020'); p.px(ox + ex - 1, oy - 25, '#ffffff'); p.px(ox + ex, oy - 25, '#c8c8e0'); }
  // mouth + grin
  p.hl(ox - 5, ox + 5, oy + 5, dp); p.px(ox - 6, oy + 4, dp); p.px(ox + 6, oy + 4, dp); p.hl(ox - 3, ox + 3, oy + 6, '#ffd0c0');
  // THE claw: arm up and to the right, huge chili-shaped pincer
  limb(ox + 18, oy - 6, ox + 32, oy - 20, 4, 4.4); limb(ox + 32, oy - 20, ox + 44, oy - 26, 4.4, 5);
  const kx = ox + 50, ky = oy - 30;
  p.ell(kx, ky + 2, 7, 6, '#3a8a3a'); p.ell(kx - 1, ky + 1, 5, 4, '#5ab04a'); p.px(kx - 3, ky - 1, '#9ae070'); // calyx
  for (let j = -15; j <= 13; j++) for (let i = -11; i <= 24; i++) {
    // fixed finger + palm: a fat curved pepper
    const t = (i + 11) / 35, cyl = Math.sin(t * Math.PI) * 11 + 2, off = -t * t * 14;
    if (Math.abs(j - off + 2) > cyl) continue;
    const v = (j - off + 2) / cyl, l = -(v * 0.85) + 0.2 - t * 0.15;
    p.px(kx + 6 + i, ky - 4 + j, tone(l));
  }
  // movable finger (dactyl) opening above
  for (let k = 0; k < 20; k++) { const t = k / 20, x = kx + 8 + k, y = ky - 16 - Math.sin(t * Math.PI) * 6 + t * 2, r = 3.2 * (1 - t * 0.7); for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) p.px(Math.round(x + i), Math.round(y + j), tone(-(j / r) * 0.8 + 0.1)); }
  // glossy specular + serrations on the pincer edge
  p.line(kx + 4, ky - 12, kx + 14, ky - 14, '#fff0e8'); p.line(kx + 5, ky - 11, kx + 11, ky - 12, hi);
  for (let i = 0; i < 12; i += 3) p.px(kx + 18 + i, ky - 10 - Math.round(i * 0.5), '#fff0e0');
  p.outline('#2a0a18');
  return { surf: s, x: cx - ox, y: cy - oy };
}

// THE LONG RUN — energy-drink LED board with an original sprinting athlete
// (mid-stride, leaning in, visor down) over a skyline backdrop
export function runnerBoard(w, h) {
  const s = newSurf(w + 8, h + 30), p = new Pen(s, 61), X = 4, Y = 6;
  // truss frame + legs
  for (const lx of [X + 6, X + w - 10]) { p.rect(lx, Y + h, 4, 24, K.steelD); p.vl(lx, Y + h, Y + h + 23, K.steel); for (let j = Y + h + 2; j < Y + h + 22; j += 6) { p.line(lx, j, lx + 3, j + 5, K.steel); } }
  p.rect(X + 6, Y + h + 10, w - 12, 2, K.steelD); p.hl(X + 6, X + w - 7, Y + h + 10, K.steel);
  p.rect(X - 2, Y - 2, w + 4, h + 4, '#3a3a4a'); p.frame(X - 3, Y - 3, w + 6, h + 6, K.ink); p.hl(X - 2, X + w + 1, Y - 2, '#6a6a7e');
  for (let i = X; i < X + w; i += 5) p.px(i, Y + h + 1, '#5a5a6e');
  // screen: dusk LED gradient + skyline + sun-stripes
  p.vgrad(X, Y, w, h, ['#1a1650', '#3a1a78', '#8a2a8a', '#e0487a', '#ff9a52']);
  const sx = X + w * 0.66, sy = Y + h * 0.62;
  for (let j = 0; j < 18; j++) for (let i = -18; i <= 18; i++) { if (i * i + j * j > 18 * 18) continue; if ((Math.floor(j / 3)) % 2 && j > 6) continue; p.px(Math.round(sx + i), Math.round(sy - j), mix('#ffd060', '#ff8a4a', j / 18)); }
  let bx = X; const sky = '#2a1240';
  while (bx < X + w) { const bw = p.ri(5, 11), bh = p.ri(6, 20); p.rect(bx, Y + h - bh, bw - 1, bh, sky); for (let j = Y + h - bh + 2; j < Y + h - 1; j += 3) for (let i = bx + 1; i < bx + bw - 2; i += 2) if (p.chance(0.4)) p.px(i, j, '#ffcf7a'); bx += bw; }
  p.rect(X, Y + h - 4, w, 4, '#1a0c2a'); for (let i = X; i < X + w; i += 6) p.hl(i, i + 2, Y + h - 2, '#3ff0ff');
  // speed streaks
  for (const [yy, len, c] of [[0.42, 0.42, K.nc], [0.5, 0.55, '#ffffff'], [0.58, 0.38, K.nm], [0.66, 0.5, K.nc], [0.34, 0.3, '#ffffff']]) { const y0 = Math.round(Y + h * yy), x1 = Math.round(X + w * 0.42); p.hl(Math.round(x1 - w * len), x1, y0, c); }
  // the runner (faces right): torso leaning forward, front knee high, rear leg driving back
  const S = 1.45, rx0 = Math.round(X + w * 0.44), ry0 = Math.round(Y + h * 0.18);
  const suit = '#f4f0ff', suitS = '#a8a0d8', skin = '#e8a070', stripe = K.nm, visor = K.nc;
  const limb = (x0, y0, x1, y1, r, c, cs) => { r *= S; const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let k = 0; k <= n; k++) { const t = k / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) p.px(Math.round(x + i), Math.round(y + j), j > 0 || i > 0 ? cs : c); } };
  // rear arm, rear leg (shadowed)
  limb(Math.round(rx0 - 1 * S), Math.round(ry0 + 7 * S), Math.round(rx0 - 7 * S), Math.round(ry0 + 13 * S), 1.4, suitS, suitS); limb(Math.round(rx0 - 7 * S), Math.round(ry0 + 13 * S), Math.round(rx0 - 11 * S), Math.round(ry0 + 9 * S), 1.2, skin, '#b87050');
  limb(Math.round(rx0 - 2 * S), Math.round(ry0 + 18 * S), Math.round(rx0 - 9 * S), Math.round(ry0 + 24 * S), 1.8, suitS, suitS); limb(Math.round(rx0 - 9 * S), Math.round(ry0 + 24 * S), Math.round(rx0 - 17 * S), Math.round(ry0 + 27 * S), 1.5, suitS, '#7a70a8'); p.hl(Math.round(rx0 - 21 * S), Math.round(rx0 - 16 * S), Math.round(ry0 + 28 * S), K.nc);
  // torso (leaning)
  p.poly([[Math.round(rx0 - 3 * S), Math.round(ry0 + 19 * S)], [Math.round(rx0 + 1 * S), Math.round(ry0 + 5 * S)], [Math.round(rx0 + 6 * S), Math.round(ry0 + 6 * S)], [Math.round(rx0 + 3 * S), Math.round(ry0 + 20 * S)]], suit);
  p.line(Math.round(rx0 - 1 * S), Math.round(ry0 + 18 * S), Math.round(rx0 + 3 * S), Math.round(ry0 + 6 * S), stripe); p.line(Math.round(rx0 + 4 * S), Math.round(ry0 + 19 * S), Math.round(rx0 + 6 * S), Math.round(ry0 + 8 * S), suitS);
  // front leg: thigh up, shin down
  limb(Math.round(rx0 + 1 * S), Math.round(ry0 + 18 * S), Math.round(rx0 + 9 * S), Math.round(ry0 + 15 * S), 2, suit, suitS); limb(Math.round(rx0 + 9 * S), Math.round(ry0 + 15 * S), Math.round(rx0 + 10 * S), Math.round(ry0 + 24 * S), 1.6, suit, suitS); p.hl(Math.round(rx0 + 9 * S), Math.round(rx0 + 14 * S), Math.round(ry0 + 25 * S), K.nc); p.px(Math.round(rx0 + 14 * S), Math.round(ry0 + 24 * S), '#ffffff');
  // front arm punching forward
  limb(Math.round(rx0 + 5 * S), Math.round(ry0 + 7 * S), Math.round(rx0 + 10 * S), Math.round(ry0 + 11 * S), 1.4, suit, suitS); limb(Math.round(rx0 + 10 * S), Math.round(ry0 + 11 * S), Math.round(rx0 + 14 * S), Math.round(ry0 + 6 * S), 1.2, skin, '#b87050');
  // head + visor + hair streak
  p.ell(Math.round(rx0 + 6 * S), Math.round(ry0 + 2 * S), 3.6 * S, 3.6 * S, skin); p.ell(Math.round(rx0 + 5 * S), Math.round(ry0 + 1 * S), 3.4 * S, 2.6 * S, '#2a1830'); p.hl(Math.round(rx0 + 5 * S), Math.round(rx0 + 10 * S), Math.round(ry0 + 2 * S), visor); p.px(Math.round(rx0 + 10 * S), Math.round(ry0 + 2 * S), '#ffffff');
  p.line(Math.round(rx0 + 2 * S), ry0, Math.round(rx0 - 4 * S), Math.round(ry0 + 1 * S), '#2a1830'); p.line(Math.round(rx0 + 2 * S), Math.round(ry0 - 1 * S), Math.round(rx0 - 6 * S), Math.round(ry0 - 1 * S), '#4a2a50');
  // copy
  neonText(p, 'THE LONG RUN', X + Math.round(w / 2), Y + 4, K.ny, { align: 'center', spacing: 1, thin: true });
  p.text('ロングラン', X + 4, Y + h - 16, '#ffffff', { jpSize: 9 });
  p.text('ENERGY 2050', X + w - 47, Y + 14, K.nc, { mini: true });
  // a can on the right edge
  const cx2 = X + w - 14, cy2 = Y + 18;
  p.rect(cx2, cy2, 8, 14, '#e8e8f8'); p.rect(cx2, cy2 + 4, 8, 6, K.nm); p.hl(cx2, cx2 + 7, cy2, '#ffffff'); p.vl(cx2 + 7, cy2, cy2 + 13, '#9898b8'); p.px(cx2 + 2, cy2 + 6, '#ffffff');
  // LED scan texture: every other row a touch darker
  for (let j = Y + 1; j < Y + h; j += 2) for (let i = X; i < X + w; i++) { const v = s.get(i, j); if (v >>> 24) p.blend(i, j, '#000010', 0.18); }
  // spotlights on the top edge
  for (const lx of [X + 8, X + w / 2, X + w - 10]) { p.rect(Math.round(lx) - 2, Y - 6, 5, 3, '#5a5a6a'); p.px(Math.round(lx), Y - 3, '#fff8d0'); }
  return { surf: s, ox: X, oy: Y };
}

// a glowing paper pufferfish lantern (x, y = top hook)
export function fuguLantern(p, x, y) {
  const cx = x, cy = y + 22, rx = 18, ry = 15;
  p.vl(x, y, y + 6, K.ink2);
  // spines (behind)
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 9) { const sx = cx + Math.cos(a) * (rx + 3), sy = cy + Math.sin(a) * (ry + 3); p.line(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), Math.round(sx), Math.round(sy), '#7a4a2a'); p.px(Math.round(sx), Math.round(sy), '#4a2a1a'); }
  // tail fin (right)
  p.poly([[cx + rx - 2, cy], [cx + rx + 8, cy - 7], [cx + rx + 6, cy], [cx + rx + 8, cy + 7]], '#e89a4a'); p.line(cx + rx + 2, cy, cx + rx + 7, cy - 5, '#c06a2a'); p.line(cx + rx + 2, cy, cx + rx + 7, cy + 5, '#c06a2a');
  // body: lit from inside (bright centre, warmer rim), paper ribs
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
    const u = i / rx, v = j / ry, d = u * u + v * v; if (d > 1) continue;
    const q = d + bayer(cx + i, cy + j) * 0.18;
    p.px(cx + i, cy + j, q < 0.25 ? '#fff4c8' : q < 0.55 ? '#ffd47a' : q < 0.82 ? '#f0a24e' : '#c8703a');
  }
  for (let j = -ry + 3; j < ry; j += 4) { const hw = rx * Math.sqrt(Math.max(0, 1 - (j / ry) ** 2)); p.hl(Math.round(cx - hw + 1), Math.round(cx + hw - 1), cy + j, mix('#f0a24e', '#c8703a', 0.4)); }
  // back spots + belly
  for (const [sx, sy] of [[-6, -9], [2, -11], [8, -7], [-1, -6], [11, -2], [-9, -3]]) { p.px(cx + sx, cy + sy, '#8a4a2a'); p.px(cx + sx + 1, cy + sy, '#a85a32'); }
  // face (left): big eye, puckered mouth, pectoral fin
  p.ell(cx - 9, cy - 2, 4, 4, '#fffaf0'); p.ell(cx - 9.6, cy - 1.6, 2.4, 2.6, '#1a1020'); p.px(cx - 10, cy - 3, '#ffffff');
  p.ell(cx - rx + 1, cy + 4, 2.6, 2, '#c8503a'); p.px(cx - rx, cy + 4, '#6a2020');
  p.poly([[cx - 1, cy + 4], [cx + 6, cy + 1], [cx + 5, cy + 8]], '#f0a24e'); p.line(cx, cy + 4, cx + 5, cy + 2, '#c8703a');
  p.ell(cx - 6, cy + 8, 2.4, 1.2, '#ff9a8a');
  // top & bottom caps
  p.rect(cx - 3, y + 6, 7, 2, '#3a2a2a'); p.rect(cx - 3, cy + ry, 7, 2, '#3a2a2a'); p.vl(cx, cy + ry + 2, cy + ry + 5, '#c84a3a'); p.px(cx, cy + ry + 6, '#ffd060');
  return { cx, cy };
}

// a yellow submarine, riveted, conning tower + periscope, glowing portholes (x, y top-left of hull)
export function submarine(p, x, y, w = 86) {
  const h = 22, Y0 = '#e8b21e', YL = '#ffd84a', YH = '#fff0a0', YS = '#b8820e', YD = '#7a4e12';
  // propeller + rudder (right)
  p.rect(x + w - 2, y + 7, 6, 8, YS); p.poly([[x + w + 3, y + 2], [x + w + 8, y + 3], [x + w + 8, y + 20], [x + w + 3, y + 19]], '#c8c8d8'); p.vl(x + w + 5, y + 3, y + 19, '#8a8aa0');
  p.poly([[x + w - 8, y - 4], [x + w - 2, y - 4], [x + w, y + 4], [x + w - 10, y + 4]], YS);
  // hull: capsule, lit from top-left
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const v = (j - h / 2) / (h / 2), endL = i < h / 2 ? (h / 2 - i) / (h / 2) : 0, endR = i > w - 8 ? (i - (w - 8)) / 10 : 0;
    if (v * v + endL * endL > 1 || v * v + endR * endR * 2.2 > 1.05) continue;
    const l = -v * 0.9 - endL * 0.3 + 0.1;
    p.px(x + i, y + j, l > 0.62 ? YH : l > 0.15 ? YL : l > -0.45 ? Y0 : l > -0.8 ? YS : YD);
  }
  // conning tower + periscope + hatch rail
  const tx = x + Math.round(w * 0.36);
  p.block(tx, y - 9, 18, 10, Y0, { light: YL, dark: YS, line: YD }); p.hl(tx + 1, tx + 16, y - 9, YH);
  p.rect(tx + 4, y - 18, 2, 10, '#c8c8d8'); p.rect(tx + 4, y - 19, 7, 3, '#c8c8d8'); p.px(tx + 10, y - 18, '#3ff0ff'); p.vl(tx + 5, y - 18, y - 9, '#8a8aa0');
  for (let i = tx + 2; i < tx + 16; i += 3) p.px(i, y - 6, YD);
  // portholes
  for (let k = 0; k < 5; k++) { const px = x + 12 + k * 14, py = y + 10; p.ell(px, py, 4, 4, '#a07a2a'); p.ell(px, py, 3, 3, '#c8a050'); p.ell(px, py, 2.2, 2.2, '#7af0ff'); p.px(px - 1, py - 1, '#ffffff'); p.px(px + 1, py + 1, '#2ab8d8'); }
  // seam + rivets
  p.hl(x + 4, x + w - 6, y + 17, YS); for (let i = x + 5; i < x + w - 6; i += 4) p.px(i, y + 16, YD);
  for (let i = x + 6; i < x + w - 8; i += 4) p.px(i, y + 3, YS);
  p.text('YELLOW SUBMARINE', x + 10, y + 17, YD, { mini: true });
}

// giant soft-serve cone, a sign standing at the shop door
export function softCone() {
  return sprite(20, 50, 10, 49, (p) => {
    // pedestal
    p.block(4, 42, 12, 6, '#3a3048', { line: K.ink }); p.hl(5, 14, 43, '#5a4a6a'); p.text('ICE', 5, 44, K.ny, { mini: true });
    // waffle cone
    p.poly([[3, 24], [17, 24], [10, 42]], '#c8843a');
    for (let k = -12; k < 20; k += 3) { p.line(3 + k, 24, 3 + k + 9, 42, '#a8642a'); p.line(17 - k, 24, 17 - k - 9, 42, '#a8642a'); }
    p.hl(3, 16, 24, '#e8a85a'); p.hl(2, 17, 25, '#8a4a20');
    // swirl tiers, lit from top-left
    const tiers = [[10, 21, 9, 3.6], [10, 16, 7.6, 3.4], [10, 11.5, 6, 3], [10, 7.5, 4.2, 2.6], [10.5, 4, 2.6, 2.2]];
    for (const [cx, cy, rx, ry] of tiers) { p.ell(cx, cy, rx, ry, '#e8d8c0'); p.ell(cx - 0.8, cy - 0.8, rx - 1.4, ry - 1.2, '#fff6e6'); p.ell(cx - 2, cy - 1.4, rx * 0.4, ry * 0.4, '#ffffff'); p.hl(Math.round(cx - rx + 1), Math.round(cx + rx - 1), Math.round(cy + ry - 1), '#c8b49a'); }
    p.line(10, 1, 13, 0, '#fff6e6'); p.px(13, 0, '#ffffff');
    p.px(6, 18, K.nm); p.px(13, 13, K.nc); p.px(8, 9, K.ny); p.px(12, 20, K.ng); // sprinkles
    p.outline('#2a1a24');
  });
}

// ------------------------------------------------------------------ street sprites
export function vendNight(o = {}) {
  const body = o.color || '#c83a4a';
  return sprite(22, 38, 11, 37, (p) => {
    p.block(1, 1, 20, 35, body, { line: K.ink });
    p.rect(3, 3, 16, 16, '#eaf6ff'); p.frame(3, 3, 16, 16, shift(body, -1.4));
    const cols = ['#ff6a6a', '#6aa8ff', '#ffd84a', '#5ae0c8', '#ffffff', '#9ae06a', '#ff9ad8'];
    for (let r = 0; r < 3; r++) { p.hl(4, 17, 8 + r * 5, '#b8c8d8'); for (let k = 0; k < 5; k++) { const cx = 4 + k * 3, cy = 5 + r * 5; p.rect(cx, cy, 2, 3, p.pick(cols)); p.px(cx, cy, '#ffffff'); } }
    for (let k = 0; k < 5; k++) p.px(4 + k * 3, 18, k % 2 ? '#ff4040' : '#40ff80');
    p.rect(3, 21, 9, 4, shift(body, -1)); p.rect(4, 22, 7, 2, '#1a2a3a'); p.text('2050', 4, 22, K.nc, { mini: true });
    p.rect(14, 21, 4, 6, K.ink2); p.px(15, 22, K.ny); p.px(16, 24, K.ng);
    p.rect(4, 29, 14, 5, K.ink2); p.hl(5, 16, 30, shift(body, -1.4));
    p.hl(2, 19, 2, shift(body, 1.2)); p.vl(1, 2, 34, shift(body, 0.6));
    if (o.holo) { p.ell(11, -2, 4, 2, K.nc); }
  });
}
export function fortuneMachine() {       // omikuji 2050: a robot lucky-cat under a glass dome
  return sprite(22, 44, 11, 43, (p) => {
    const red = '#b8283a', gold = '#e0b04a';
    p.block(2, 18, 18, 24, red, { line: K.ink }); p.hl(3, 18, 19, '#e0485a'); p.vl(2, 18, 41, '#d03a4a');
    p.rect(4, 21, 14, 12, K.ink2); p.text('占', 6, 21, K.ny, { jpSize: 10 }); p.text('100', 6, 33, gold, { mini: true });
    p.rect(8, 35, 6, 2, K.ink); p.px(10, 35, K.nc);                 // paper slot
    p.rect(4, 39, 14, 2, gold);
    // dome + cat
    p.rect(3, 16, 16, 2, gold); p.hl(3, 18, 16, '#ffe08a');
    p.ell(11, 10, 8, 8, '#2a3a5a'); p.ell(11, 10, 7, 7, '#36507a');
    p.ell(11, 11, 4.2, 4, '#f4f0e8'); p.poly([[7, 9], [8, 5], [10, 8]], '#f4f0e8'); p.poly([[12, 8], [14, 5], [15, 9]], '#f4f0e8');
    p.px(9, 10, K.ink); p.px(13, 10, K.ink); p.px(11, 12, '#ff6a8a'); p.hl(10, 12, 14, '#d8303e'); p.px(11, 15, gold);
    p.rect(14, 6, 2, 4, '#f4f0e8'); p.px(15, 5, '#f4f0e8');           // raised paw
    p.px(8, 4, K.nc); p.px(6, 6, '#ffffff'); p.px(7, 5, '#c8e0ff');  // dome glint
    p.vl(11, 1, 2, K.steelL); p.px(11, 0, K.nr);
  });
}
// DRUM MACHINE: an original tin-toy robot drummer in a marching-band jacket
export function drummerBot() {
  return sprite(30, 58, 15, 57, (p) => {
    // plinth with plaque
    p.block(3, 47, 24, 9, '#4a4458', { line: K.ink }); p.hl(4, 25, 48, '#6a6278'); p.rect(8, 50, 14, 4, '#c8a040'); p.text('DRUM', 9, 50, K.ink, { mini: true });
    // legs: white trousers, black boots
    p.rect(10, 37, 4, 9, '#e8e4f0'); p.rect(16, 37, 4, 9, '#c8c4d8'); p.rect(9, 44, 6, 3, K.ink2); p.rect(15, 44, 6, 3, K.ink2);
    // jacket: red with gold frogging + epaulettes
    p.block(8, 22, 14, 15, '#c8283a', { light: '#e84a5a', dark: '#8a1a2a', line: K.ink });
    for (let j = 25; j < 35; j += 3) p.hl(11, 18, j, '#e8c050');
    p.rect(6, 22, 4, 3, '#e8c050'); p.rect(20, 22, 4, 3, '#e8c050'); for (let i = 6; i < 10; i++) p.px(i, 25, '#b88a2a'); for (let i = 20; i < 24; i++) p.px(i, 25, '#b88a2a');
    // drum on the belly (side view barrel) with rope zigzag
    p.block(5, 31, 20, 9, '#f0ece0', { light: '#ffffff', dark: '#b8b4a8', line: K.ink }); p.rect(5, 31, 20, 2, '#2a5ab8'); p.rect(5, 38, 20, 2, '#2a5ab8');
    for (let i = 6; i < 24; i += 4) { p.line(i, 33, i + 2, 37, '#c8a040'); p.line(i + 2, 37, i + 4, 33, '#c8a040'); }
    // arms raised with sticks
    p.line(8, 24, 3, 18, '#c8283a'); p.line(9, 24, 4, 18, '#c8283a'); p.line(3, 18, 1, 10, '#e8d8b0');
    p.line(22, 24, 26, 20, '#c8283a'); p.line(21, 24, 25, 20, '#c8283a'); p.line(26, 20, 29, 13, '#e8d8b0');
    p.px(1, 9, '#ffffff'); p.px(29, 12, '#ffffff');
    // tin head: box, round lamp eyes, grille mouth, antenna, shako hat
    p.block(9, 12, 12, 10, '#a8b0c8', { light: '#d8e0f0', dark: '#6a7088', line: K.ink });
    p.ell(12.5, 16, 2, 2, K.ny); p.ell(17.5, 16, 2, 2, K.ny); p.px(12, 15, '#ffffff'); p.px(17, 15, '#ffffff');
    p.hl(12, 18, 20, K.ink2); for (let i = 12; i < 19; i += 2) p.px(i, 19, '#6a7088');
    p.block(10, 4, 10, 8, '#1a1a2a', { line: K.ink }); p.rect(10, 10, 10, 2, '#e8c050'); p.vl(15, 0, 4, '#e8e8f0'); p.ell(15, 1, 1.6, 1.6, K.nr);
    p.px(11, 5, '#4a4a6a');
  });
}
export function takoyakiCounter() {      // the open shop counter with the copper griddle (anchor = front base)
  return sprite(76, 46, 38, 45, (p) => {
    // back: cook (Takoyaki Taisho) behind the counter
    const cx = 52;
    p.ell(cx, 8, 4, 4.4, '#e8a878'); p.rect(cx - 4, 4, 9, 3, '#f4f0e8'); p.hl(cx - 4, cx + 4, 5, '#d8303e'); p.px(cx + 5, 4, '#f4f0e8'); p.px(cx + 6, 3, '#d8303e');
    p.px(cx - 2, 8, K.ink); p.px(cx + 1, 8, K.ink); p.hl(cx - 1, cx + 1, 10, '#a85a4a');
    p.rect(cx - 6, 12, 13, 12, '#f4f0e8'); p.rect(cx - 6, 12, 2, 12, '#d8d0c8'); p.rect(cx + 5, 12, 2, 12, '#c8c0b8'); p.hl(cx - 6, cx + 6, 12, '#2a3058');
    p.line(cx - 6, 14, cx - 12, 20, '#e8a878'); p.line(cx + 6, 14, cx + 10, 20, '#e8a878'); p.line(cx - 12, 20, cx - 14, 17, '#c8c0a8');
    // counter top: copper griddle with 3×7 wells of takoyaki
    p.rect(2, 20, 72, 9, '#2a2030');
    p.rect(4, 21, 50, 7, '#a85a2e'); p.hl(4, 53, 21, '#e08a4a'); p.hl(4, 53, 27, '#6a3018');
    for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) { const bx = 6 + k * 6 + (r % 2), by = 22 + r * 2; p.rect(bx, by, 4, 2, r === 1 && k % 3 === 0 ? '#e8b86a' : '#c8843a'); p.px(bx, by, '#ffd890'); }
    // trays + sauce bottle + boats of takoyaki on the right
    p.rect(57, 22, 15, 5, '#e8dcc0'); p.ell(61, 23.5, 3, 1.5, '#5a2a14'); p.ell(68, 23.5, 3, 1.5, '#5a2a14'); p.px(60, 23, '#fff8e8'); p.px(67, 23, '#fff8e8'); p.px(62, 24, '#5ac85a');
    p.rect(55, 15, 3, 6, '#3a2018'); p.px(56, 14, '#d8303e');
    // counter front: red panel + wood, menu tags
    p.block(1, 29, 74, 16, K.wood, { light: K.woodL, dark: K.wood2, line: K.ink });
    p.rect(4, 31, 40, 11, '#b8283a'); p.frame(4, 31, 40, 11, '#e8c050');
    p.text('たこ焼き', 8, 32, '#fff4dc', { jpSize: 9 });
    for (let k = 0; k < 4; k++) { p.rect(48 + k * 6, 32, 5, 8, '#f4ead0'); p.hl(49 + k * 6, 51 + k * 6, 34, '#2a2030'); p.hl(49 + k * 6, 51 + k * 6, 36, '#d8303e'); }
    p.hl(1, 74, 44, K.wood2);
    // steam haze + glow on the griddle face
    p.wash(4, 21, 50, 2, '#ffe0a0', 0.25);
  });
}
export function kushiYatai() {          // kushikatsu yatai cart: roof, noren, fryer, sauce pot, lanterns
  return sprite(72, 64, 36, 62, (p) => {
    // posts + roof
    p.rect(6, 12, 3, 46, K.wood2); p.rect(63, 12, 3, 46, K.wood2); p.vl(6, 12, 57, K.woodL);
    p.poly([[0, 12], [6, 2], [66, 2], [72, 12]], '#3a2a3a'); for (let i = 4; i < 70; i += 4) p.line(i, 11, i + 2, 3, '#4a3848'); p.hl(6, 66, 2, '#6a5068'); p.hl(0, 71, 12, '#2a1a26'); p.hl(0, 71, 13, K.ink);
    // noren across the front
    noren(p, 10, 14, 52, { color: '#b8283a', h: 10, mark: '串カツ', size: 8 });
    // counter
    p.block(4, 36, 64, 6, K.woodL, { light: '#9a6a4a', dark: K.wood, line: K.ink });
    // fryer: steel vat with golden oil + skewers resting
    p.block(12, 30, 18, 7, '#7a7a8a', { line: K.ink }); p.rect(13, 31, 16, 3, '#e8b030'); p.hl(13, 28, 31, '#fff0a0'); for (let k = 0; k < 4; k++) p.line(15 + k * 4, 29, 17 + k * 4, 33, '#e8d0a0');
    // sauce pot + no-double-dip sign
    p.ell(40, 33, 6, 3, '#9a9aaa'); p.ell(40, 33, 5, 2, '#4a2010'); p.px(38, 32, '#8a4a20');
    p.rect(48, 26, 14, 10, '#f4ecdc'); p.frame(48, 26, 14, 10, '#b8283a'); p.text('二度', 49, 27, '#b8283a', { jpSize: 6 });
    // skewers on a plate
    for (let k = 0; k < 5; k++) { p.line(14 + k * 2, 39 - 1, 22 + k * 2, 37 - 1, '#e8d0a0'); p.rect(18 + k * 2, 37, 3, 2, '#c88a3a'); }
    // cart body + wheels
    p.block(4, 42, 64, 14, K.wood, { light: K.woodL, dark: K.wood2, line: K.ink });
    for (let i = 8; i < 66; i += 6) p.vl(i, 43, 54, K.wood2);
    p.rect(20, 45, 32, 8, '#1a1424'); p.text('KUSHI', 24, 47, K.no, { mini: true }); p.text('KATSU', 24, 52, K.ny, { mini: true });
    for (const wx of [14, 58]) { p.ell(wx, 57, 5, 5, K.ink); p.ell(wx, 57, 3.6, 3.6, '#5a4038'); p.px(wx, 57, '#c8a060'); p.line(wx - 3, 57, wx + 3, 57, '#3a2828'); p.line(wx, 54, wx, 60, '#3a2828'); }
    // lanterns at the roof corners
    chochin(p, 4, 13, { r: 3.5, h: 5 }); chochin(p, 67, 13, { r: 3.5, h: 5 });
  });
}
export function stool() { return sprite(10, 12, 5, 11, (p) => { p.ell(5, 2.5, 4.5, 2.2, '#b8283a'); p.hl(2, 8, 1, '#e84a5a'); p.rect(2, 4, 1, 7, K.steelL); p.rect(7, 4, 1, 7, K.steelD); p.hl(2, 7, 8, K.steel); }); }
export function recordCrates() {
  return sprite(30, 22, 15, 21, (p) => {
    const crate = (x, y, w, h) => { p.block(x, y, w, h, '#8a5a3a', { light: '#aa7a50', dark: '#5a3a28', line: K.ink }); p.hl(x + 1, x + w - 2, y + (h >> 1), '#6a4430'); };
    for (const [x, y] of [[1, 6], [15, 8]]) {
      for (let k = 0; k < 6; k++) { const c = p.pick(['#e84a5a', '#3a8ae0', '#f0d050', '#5ad0a0', '#f4f0e8', '#9a5ad8', '#2a2a3a']); p.rect(x + 1 + k * 2, y - 3 - (k % 3), 2, 6, c); p.px(x + 1 + k * 2, y - 3 - (k % 3), hot(c, 0.4)); }
      crate(x, y, 14, 12);
    }
    p.rect(6, 12, 8, 4, '#f4ecdc'); p.text('500', 7, 13, '#d8303e', { mini: true });
  });
}
export function aFrame(lines, o = {}) {
  return sprite(16, 24, 8, 23, (p) => {
    p.line(2, 23, 5, 1, K.wood2); p.line(13, 23, 10, 1, K.wood2);
    p.block(3, 2, 10, 17, K.woodL, { line: K.ink }); p.rect(4, 3, 8, 15, '#1e2a24');
    lines.forEach((l, i) => p.text(l, 4, 4 + i * 6, [K.ny, '#ffffff', K.nm, K.nc][i % 4], { mini: true }));
    if (o.doodle) { p.px(10, 15, K.nm); p.px(9, 16, K.nm); p.px(11, 16, K.nm); }
  });
}
// classic two-globe lamp post (bridge corners, promenades)
export function lampPost(o = {}) {
  const h = o.h || 56;
  return sprite(22, h + 4, 11, h + 2, (p) => {
    p.block(8, h - 4, 6, 6, '#2a2a3a', { line: K.ink }); p.rect(9, 10, 4, h - 13, '#30303e'); p.vl(9, 10, h - 4, '#4a4a5c');
    for (let y = 16; y < h - 6; y += 10) p.hl(9, 12, y, '#22222e');
    p.line(10, 12, 3, 8, '#30303e'); p.line(11, 12, 18, 8, '#30303e');
    for (const gx of [3, 18]) { p.ell(gx, 4, 3.4, 3.8, '#fff2c8'); p.ell(gx - 0.8, 3.2, 1.6, 1.8, '#ffffff'); p.hl(gx - 2, gx + 2, 8, '#30303e'); }
    p.ell(10.5, 5, 2.2, 2.6, '#fff2c8'); p.px(10, 1, '#30303e'); p.vl(10, 0, 2, '#30303e');
  });
}
// riverwalk post with a hanging red lantern (strings attach at the top)
export function lanternPost(o = {}) {
  return sprite(14, 46, 4, 45, (p) => {
    p.rect(2, 4, 4, 41, K.wood); p.vl(2, 4, 44, K.woodL); p.vl(5, 4, 44, K.wood2); p.rect(1, 2, 6, 3, K.wood2); p.hl(1, 6, 2, K.woodL);
    p.hl(6, 11, 6, K.wood2); chochin(p, 10, 7, { color: o.color || K.lantern, r: 3.2, h: 5, mark: true });
    p.rect(1, 42, 6, 3, '#3a3040');
  });
}
export function benchN(o = {}) {        // slatted bench, seat facing the camera
  return sprite(34, 16, 17, 15, (p) => {
    const w = o.wood || '#7a5440';
    p.block(2, 1, 30, 3, shift(w, -0.4), { line: K.ink }); p.block(2, 5, 30, 2, shift(w, -0.4), { line: K.ink });
    p.block(1, 9, 32, 3, w, { light: shift(w, 0.8), line: K.ink });
    for (const x of [3, 29]) { p.rect(x, 1, 2, 14, '#2a2a36'); p.px(x, 1, '#5a5a6a'); }
    p.hl(1, 32, 12, shift(w, -1));
  });
}
export function railSeg(w, o = {}) {    // steel canal railing segment (anchor bottom-left)
  return sprite(w, 14, 0, 13, (p) => {
    for (let x = 0; x < w; x += 10) { p.rect(x, 2, 2, 11, '#3a3a4a'); p.px(x, 2, '#8a8aa0'); }
    p.hl(0, w - 1, 1, o.top || '#9a9ab4'); p.hl(0, w - 1, 2, '#5a5a70'); p.hl(0, w - 1, 0, K.ink);
    p.hl(0, w - 1, 7, '#4a4a5e'); p.hl(0, w - 1, 8, '#2a2a38');
    if (o.buoy) { const bx = o.buoy; p.ell(bx, 7, 4.6, 4.6, '#f4ece0'); p.ell(bx, 7, 2.2, 2.2, 0); for (const [i, j] of [[-4, 0], [4, 0], [0, -4], [0, 4], [-3, -3], [3, 3]]) p.px(bx + i, 7 + j, '#e8603a'); p.px(bx - 3, 5, '#ffffff'); }
    p.hl(0, w - 1, 13, '#2a2a38');
  });
}
export function willow(o = {}) {        // shidare-yanagi: a crown of drooping curtains, gaps between, lit top-left
  const W = o.w || 46, H = o.h || 70;
  return sprite(W, H, W >> 1, H - 2, (p) => {
    const cx = W / 2;
    p.block(cx - 9, H - 9, 18, 7, '#4a4050', { line: K.ink }); p.hl(cx - 8, cx + 8, H - 8, '#6a6074'); p.rect(cx - 7, H - 9, 14, 1, '#2a3a2a');
    for (let y = 10; y < H - 8; y++) { const x = Math.round(cx + Math.sin(y * 0.09) * 2); p.rect(x - 1, y, 3, 1, '#4a3430'); p.px(x - 1, y, '#7a5a48'); p.px(x + 1, y, '#2e2026'); }
    for (const [dx, dy] of [[-12, -10], [11, -12], [14, -2], [-15, 0]]) p.line(Math.round(cx), 22, Math.round(cx + dx), 22 + dy, '#3e2c2a');
    const D = ['#18302a', '#204236', '#2c5a40', '#3c744a', '#5a9058', '#7aa866'];
    // curtains: strands hang from an arched crown; each curtain has its own light (left = lit)
    for (let c = 0; c < 9; c++) {
      if (c === 2 || c === 6) continue;
      const ax = cx + (c - 4) * (W * 0.1) + p.rand(-2, 2), ay = 6 + Math.abs(c - 4) * 2.4 + p.rand(-1, 1), len = H - 22 - Math.abs(c - 4) * 3 + p.rand(-4, 4);
      const lit = (4 - c) * 0.35 + p.rand(-0.3, 0.3);
      for (let k = 0; k < 7; k++) {
        const sx = Math.round(ax + (k - 3) * 1.2), L = len * (0.65 + 0.35 * Math.sin((k / 6) * Math.PI));
        for (let j = 0; j < L; j++) {
          const x = Math.round(sx + Math.sin((ay + j) * 0.18 + c) * 0.7), y = Math.round(ay + j); if (y >= H - 9) break;
          if ((j + k * 3 + c) % 5 === 0 || (k === 3 && j % 7 < 3)) continue;   // leaf gaps
          const t = 2 + lit - j / len * 1.6 + (k < 2 ? 0.8 : k > 4 ? -0.8 : 0);
          p.px(x, y, D[Math.max(0, Math.min(5, Math.round(t)))]);
        }
        if (k % 3 === 0) p.px(sx, Math.round(ay + L), o.tint || '#9ae0b0');
      }
    }
    // crown top: denser cap of leaves so it reads as a rounded head
    for (let i = -W * 0.42; i <= W * 0.42; i++) { const top = 5 + (i * i) / (W * 3); for (let j = 0; j < 4; j++) if (((i | 0) + j) % 3) p.px(Math.round(cx + i), Math.round(top + j), D[Math.max(0, Math.min(5, 4 - j - (i > 0 ? 1 : 0)))]); }
  });
}
export function bamboo(o = {}) {        // bamboo planter: crisp stalks with nodes, leaf sprays lit top-left, neon-tinted on the right
  const W = o.w || 30, H = o.h || 66, tint = o.tint || K.nc;
  return sprite(W, H, W >> 1, H - 2, (p) => {
    const cx = W >> 1;
    p.block(cx - 10, H - 10, 20, 8, '#3e3a4c', { line: K.ink }); p.hl(cx - 9, cx + 9, H - 9, '#625e74'); p.rect(cx - 9, H - 10, 18, 1, '#2a3a2a');
    const stalks = [[cx - 6, 8], [cx - 2, 2], [cx + 2, 12], [cx + 6, 5], [cx - 9, 22]];
    for (const [sx, top] of stalks) {
      for (let y = top; y < H - 10; y++) { const x = sx + Math.round(Math.sin(y * 0.05 + sx) * 0.6); p.px(x, y, '#7aa850'); p.px(x + 1, y, '#4e7a3a'); if ((y - top) % 7 === 0) { p.px(x, y, '#c8d890'); p.px(x + 1, y, '#3a5a2e'); } }
      for (let k = 0; k < 4; k++) {                       // leaf sprays
        const ly = top + 2 + k * 9, dir = (k + sx) % 2 ? 1 : -1;
        for (let l = 0; l < 3; l++) { const lx = sx + dir * (2 + l * 2), yy = ly + l; p.line(lx, yy, lx + dir * 4, yy + 2, l === 0 ? '#9ac860' : '#5a8a40'); p.px(lx + dir * 4, yy + 2, dir > 0 ? tint : '#b8e080'); }
      }
    }
  });
}
// a slim 2050 street lamp: pole + LED halo ring
export function haloLamp(o = {}) {
  const h = o.h || 62;
  return sprite(20, h + 2, 10, h + 1, (p) => {
    p.rect(9, 10, 3, h - 10, '#3a3a4c'); p.vl(9, 10, h - 1, '#6a6a80'); p.rect(7, h - 3, 7, 3, K.ink2);
    p.s.ring(10, 6, 7, 3, '#e8f8ff'); p.s.ring(10, 6, 6, 2, K.nc); p.hl(5, 15, 3, '#ffffff'); p.px(10, 9, '#ffffff');
    p.rect(9, 6, 3, 5, '#3a3a4c');
  });
}
// face-in-hole photo board (kaonehame): the octopus mascot and the chili crab, holes for faces
export function kaonehame() {
  return sprite(56, 46, 28, 45, (p) => {
    for (const lx of [6, 48]) { p.rect(lx, 30, 3, 15, K.wood2); p.vl(lx, 30, 44, K.woodL); }
    p.rect(1, 2, 54, 32, K.ink);
    p.vgrad(2, 3, 52, 30, ['#3ac0e0', '#2a7ab8', '#1a4a8a']);
    for (let i = 4; i < 52; i += 7) p.ell(i + 2, 31, 4, 3, '#2a6a9a');                      // waves
    // octopus (left) + crab (right), each with a face hole
    p.ell(15, 14, 10, 9, '#e0563c'); p.ell(13, 12, 6, 5, '#ff8a5e'); for (let k = 0; k < 5; k++) p.ell(7 + k * 4, 25, 2, 4, '#c8483a');
    p.hl(6, 24, 9, '#ffffff'); p.hl(6, 24, 10, '#d8303e');
    p.ell(41, 18, 11, 7, '#d4302c'); p.ell(39, 16, 7, 4, '#f45a44'); p.line(30, 14, 26, 6, '#d4302c'); p.ell(25, 5, 3, 2.4, '#d4302c'); p.line(52, 14, 54, 7, '#d4302c'); p.ell(53, 5, 2.4, 2, '#d4302c');
    p.vl(38, 8, 11, '#962436'); p.vl(44, 8, 11, '#962436'); p.px(38, 7, K.ink); p.px(44, 7, K.ink);
    for (const [hx, hy] of [[15, 15], [41, 19]]) { p.ell(hx, hy, 3.6, 4, '#0c0814'); p.px(hx - 2, hy - 3, '#3a3048'); }
    p.text('DOTONBORI', 10, 36, '#ffe45c', { mini: true }); p.rect(9, 35, 38, 7, 0); p.rect(8, 34, 40, 8, '#c8283a'); p.text('DOTONBORI', 10, 35, '#ffe45c', { mini: true });
  });
}
// a little crêpe cart with a striped canopy
export function crepeCart() {
  return sprite(44, 48, 22, 46, (p) => {
    for (const lx of [4, 38]) p.rect(lx, 10, 2, 20, '#c8c8d8');
    for (let i = 0; i < 44; i++) for (let j = 0; j < 7; j++) p.px(i, 4 + j, Math.floor(i / 4) % 2 ? '#fff0f4' : '#ff6aa8');
    for (let i = 0; i < 44; i += 4) { p.px(i + 1, 11, '#ff6aa8'); p.px(i + 2, 11, '#ff6aa8'); } p.hl(0, 43, 4, '#ffb0d0'); p.hl(0, 43, 3, K.ink);
    p.block(2, 28, 40, 14, '#f4ecdc', { light: '#ffffff', dark: '#b8b0a0', line: K.ink }); p.rect(4, 31, 36, 6, '#ff6aa8'); p.text('CREPES', 9, 32, '#ffffff', { mini: true });
    p.rect(6, 24, 12, 4, '#2a2a34'); p.ell(12, 25, 5, 1.4, '#e8b870');                      // hot plate
    for (let k = 0; k < 3; k++) { p.poly([[24 + k * 5, 27], [27 + k * 5, 18], [30 + k * 5, 27]], '#e8c080'); p.ell(27 + k * 5, 19, 2.4, 2, ['#fff4f0', '#ff8ab8', '#ffe070'][k]); }
    for (const wx of [8, 36]) { p.ell(wx, 44, 3, 3, K.ink); p.px(wx, 44, '#8a8a9a'); }
    p.px(20, 12, '#ffe890'); p.px(21, 13, '#ffe890');
  });
}
export function flowerBox(w = 40, o = {}) {
  return sprite(w, 16, w >> 1, 15, (p) => {
    p.block(1, 8, w - 2, 7, o.box || '#3a3446', { line: K.ink }); p.hl(2, w - 3, 9, '#5a5468');
    for (let i = 2; i < w - 2; i += 2) { const hgt = 3 + ((i * 7) % 5); p.vl(i, 8 - hgt, 8, i % 4 ? '#2e5a3a' : '#3e7048'); p.px(i, 7 - hgt, i % 6 === 0 ? (o.flower || '#ff8ad8') : i % 6 === 2 ? '#ffe45c' : '#5a9050'); }
  });
}
export function trashBins() {
  return sprite(26, 18, 13, 17, (p) => {
    for (const [x, c, m] of [[1, '#3a6ab8', 'C'], [9, '#3a9a5a', 'P'], [17, '#c8a030', 'B']]) { p.block(x, 4, 8, 13, '#9a9aaa', { light: '#c0c0d0', dark: '#6a6a7a', line: K.ink }); p.rect(x, 2, 8, 3, c); p.hl(x, x + 7, 2, hot(c, 0.4)); p.rect(x + 2, 3, 4, 1, K.ink); p.text(m, x + 2, 8, c, { mini: true }); }
  });
}
export function signpost() {
  return sprite(40, 46, 20, 45, (p) => {
    p.rect(19, 4, 3, 41, '#3a3a4a'); p.vl(19, 4, 44, '#5a5a6e'); p.rect(17, 42, 7, 3, K.ink2);
    p.poly([[4, 8], [34, 8], [38, 13], [34, 18], [4, 18]], '#2a5ab8'); p.hl(4, 34, 8, '#5a8ae0'); p.text('SHINSEKAI', 6, 11, '#ffffff', { mini: true });
    p.poly([[36, 21], [6, 21], [2, 26], [6, 31], [36, 31]], '#2a8a5a'); p.hl(6, 36, 21, '#5ac88a'); p.text('NAMBA', 12, 24, '#ffffff', { mini: true });
    p.block(8, 34, 24, 6, '#f4ecdc', { line: K.ink }); p.text('↓ EBISU', 9, 35, '#2a2a3a', { mini: true });
  });
}
export function ticketBooth() {
  return sprite(40, 46, 20, 45, (p) => {
    p.poly([[0, 10], [5, 2], [35, 2], [40, 10]], '#2a6a8a'); for (let i = 2; i < 40; i += 4) p.vl(i, 4, 9, '#1e5470'); p.hl(5, 35, 2, '#5aa8c8'); p.hl(0, 39, 10, K.ink);
    p.block(3, 11, 34, 32, '#e8e0d0', { light: '#fff8ec', dark: '#a8a090', line: K.ink });
    p.rect(6, 14, 28, 13, '#1a2a3a'); p.vgrad(7, 15, 26, 11, ['#ffe0a0', '#e8a060']); p.ell(20, 22, 3, 3, '#3a2a30'); p.rect(17, 24, 7, 3, '#3a2a30');
    p.rect(5, 28, 30, 3, K.wood); p.hl(5, 34, 28, K.woodL);
    p.rect(6, 33, 28, 8, '#2a6a8a'); p.text('CRUISE', 8, 35, '#ffffff', { mini: true });
    p.rect(7, 4, 26, 5, '#f4ecdc'); p.text('運河クルーズ', 8, 3, '#2a6a8a', { jpSize: 5 });
  });
}
// canal tour boat: low hull, canopy, lanterns, passengers (anchor = waterline centre)
export function tourBoat() {
  const W = 132, H = 36;
  return sprite(W, H, W >> 1, H - 4, (p) => {
    // canopy posts + roof
    for (let x = 14; x < 120; x += 15) p.vl(x, 8, 22, '#c8c8d8');
    p.rect(10, 4, 112, 4, '#2a4a8a'); p.hl(10, 121, 4, '#5a7ac8'); p.hl(10, 121, 8, '#1a2a5a');
    for (let x = 12; x < 122; x += 8) p.rect(x, 8, 4, 2, x % 16 ? '#f4ecdc' : '#2a4a8a');
    // lanterns under the roof
    for (let x = 20; x < 118; x += 15) chochin(p, x, 9, { r: 2.6, h: 3.4, color: x % 30 ? K.lantern : '#e8a030' });
    // passengers (silhouettes with a rim of neon)
    for (let x = 18; x < 116; x += 7) { if (p.chance(0.25)) continue; const hh = p.ri(0, 2); p.ell(x, 17 - hh, 2.2, 2.4, '#1c1828'); p.rect(x - 3, 19 - hh, 6, 5 + hh, '#241e30'); p.px(x - 2, 16 - hh, p.pick([K.nc, K.nm, K.ny])); }
    // hull
    p.poly([[2, 23], [130, 23], [124, 31], [8, 31]], '#e8e4ec'); p.hl(2, 129, 23, '#ffffff'); p.rect(6, 27, 120, 2, '#2a4a8a'); p.hl(8, 124, 30, '#8a8aa0');
    p.text('TOMBORI', 52, 24, '#2a4a8a', { mini: true });
    p.poly([[0, 22], [6, 22], [6, 25]], '#e8e4ec');
    // waterline wash
    for (let x = 6; x < 126; x += 3) p.px(x, 32, '#5a7a9a');
    p.hl(4, 9, 33, '#8aa8c8'); p.hl(122, 128, 33, '#8aa8c8');
  });
}
export function floatLantern(c = '#ffb870') {
  return sprite(7, 7, 3, 5, (p) => { p.rect(1, 1, 5, 4, mix(c, '#ffffff', 0.25)); p.rect(2, 2, 3, 2, c); p.px(2, 2, '#fff4d0'); p.hl(0, 6, 5, '#4a2a2a'); p.hl(1, 5, 0, '#8a5a3a'); });
}
// a passer-by as a night silhouette with a neon rim (o: { h, rim, phone, kid, bag, hair, face })
export function person(o = {}) {
  const h = o.h || 28, w = 14, coat = o.coat || '#3a3450', pants = o.pants || '#262234', rim = o.rim || K.nc, warm = o.warm || '#ffc890', skin = o.skin || '#c08870';
  return sprite(w, h + 2, 7, h + 1, (p) => {
    const kid = o.kid, hr = kid ? 2.6 : 3, hy = 1 + hr, legs = Math.round(h * 0.38), tb = h - legs, ty = hy + hr + 1;
    p.rect(4, tb, 6, legs, pants); p.vl(7, tb + 2, h - 1, shift(pants, -0.6)); p.vl(4, tb, h - 1, shift(pants, 0.3));
    p.rect(3, h - 1, 4, 2, '#141018'); p.rect(7, h - 1, 4, 2, '#141018');
    p.poly([[3, ty + 1], [11, ty + 1], [12, tb + 1], [2, tb + 1]], coat);
    p.vl(3, ty + 2, tb, shift(coat, 0.4)); p.hl(4, 10, ty + 1, shift(coat, 0.6));
    p.rect(1, ty + 2, 2, Math.round((tb - ty) * 0.8), shift(coat, -0.2)); p.rect(11, ty + 2, 2, Math.round((tb - ty) * 0.8), shift(coat, -0.5));
    p.vl(7, ty + 2, tb, shift(coat, -0.5));                                   // zip / coat opening
    if (o.scarf) p.rect(4, ty, 6, 2, o.scarf);
    if (o.bag) { p.rect(10, ty + 4, 4, 6, o.bagC || '#6a4a3a'); p.hl(10, 13, ty + 4, shift(o.bagC || '#6a4a3a', 0.6)); p.line(5, ty + 1, 11, ty + 4, '#2a2030'); }
    p.rect(6, ty - 1, 2, 2, shift(skin, -0.6));
    p.ell(7, hy, hr, hr + 0.3, skin); p.px(5, hy - 1, shift(skin, 0.6));
    const hairC = o.hairC || '#1e1620';
    p.ell(7, hy - 0.9, hr + 0.3, hr - 0.5, hairC); p.px(5, hy - 2, shift(hairC, 1));
    if (o.back) p.ell(7, hy + 0.5, hr, hr, hairC);                            // seen from behind
    if (o.hair === 'long') { p.rect(4, hy, 2, 7, hairC); p.rect(9, hy, 2, 7, hairC); }
    if (o.hair === 'bun') p.ell(7, hy - hr - 0.5, 1.6, 1.4, hairC);
    if (o.hat) { p.rect(3, hy - 3, 9, 2, o.hat); p.rect(4, hy - 4, 7, 2, o.hat); p.hl(4, 10, hy - 4, shift(o.hat, 0.7)); }
    // neon rim on the outer right edge only; dark outline elsewhere
    const src = new Uint32Array(p.s.data), H2 = h + 2, at = (x, y) => x >= 0 && y >= 0 && x < w && y < H2 && src[y * w + x] >>> 24;
    for (let y = 0; y < H2; y++) { let xr = -1; for (let x = w - 1; x >= 0; x--) if (at(x, y)) { xr = x; break; } if (xr >= 0 && y < H2 - 2) p.px(xr, y, rim); }
    for (let x = 0; x < w; x++) for (let y = 0; y < H2; y++) if (at(x, y)) { if (y < tb) p.px(x, y, mix(src[y * w + x] ? warm : warm, '#ffffff', 0.2)); break; }
    if (o.phone) { const px = o.phone === 'up' ? 11 : 2, py = o.phone === 'up' ? 0 : ty + 4; p.rect(px, py, 2, 3, '#eaffff'); p.px(px, py, '#ffffff'); }
    p.outline(K.ink);
  }, (o.seed || 1) * 7);
}
// a tiny Hozenji-style roadside shrine: moss-furred stone figure, lanterns, offering box
export function shrine() {
  return sprite(34, 46, 17, 45, (p) => {
    p.block(2, 38, 30, 6, '#4a4656', { line: K.ink }); p.hl(3, 30, 39, '#6a6676');
    p.rect(5, 10, 3, 28, K.wood2); p.rect(26, 10, 3, 28, K.wood2); p.vl(5, 10, 37, K.woodL);
    p.poly([[0, 11], [4, 4], [30, 4], [34, 11]], '#3a2e3a'); for (let i = 3; i < 32; i += 3) p.vl(i, 6, 10, '#2a2230'); p.hl(4, 30, 4, '#5a4a5a'); p.hl(0, 33, 11, K.ink);
    p.rect(10, 2, 14, 3, '#c8283a'); p.hl(10, 23, 2, '#e85a5a');
    // the moss-covered figure
    p.ell(17, 21, 5, 5.4, '#3e6a3a'); p.ell(16, 20, 3.6, 3.6, '#5a8a48'); p.px(15, 18, '#8ab860');
    p.poly([[11, 37], [12, 26], [22, 26], [23, 37]], '#3e6a3a'); p.vl(12, 27, 36, '#5a8a48'); p.px(14, 28, '#8ab860'); p.px(13, 31, '#7aa858'); for (let k = 0; k < 8; k++) p.px(13 + (k * 3) % 9, 28 + (k * 5) % 8, '#2e5030');
    p.px(15, 21, '#1a2a1a'); p.px(19, 21, '#1a2a1a');
    // lanterns + offering box + water ladle
    chochin(p, 9, 12, { r: 2.6, h: 3.4 }); chochin(p, 25, 12, { r: 2.6, h: 3.4 });
    p.block(10, 33, 14, 5, K.woodL, { line: K.ink }); for (let i = 12; i < 23; i += 2) p.vl(i, 34, 36, K.wood2);
    p.line(27, 36, 31, 31, '#c8b090'); p.ell(31, 31, 1.6, 1, '#c8b090');
  });
}
export function bikeRack(colors = ['#5a8ac8', '#c84a6a', '#e8c040']) {
  return sprite(64, 22, 32, 21, (p) => {
    p.rect(1, 18, 62, 2, '#3a3a4a'); p.hl(1, 62, 18, '#6a6a80');
    colors.forEach((c, k) => {
      const ox = 4 + k * 20, wheel = (cx) => { p.s.ring(cx, 14, 4, 4, '#1a1622'); p.s.ring(cx, 14, 3, 3, '#4a4a5a'); p.px(cx, 14, '#9a9aaa'); };
      wheel(ox + 3); wheel(ox + 15);
      p.line(ox + 3, 14, ox + 8, 9, c); p.line(ox + 8, 9, ox + 14, 9, c); p.line(ox + 14, 9, ox + 15, 14, c); p.line(ox + 8, 9, ox + 10, 14, c); p.line(ox + 10, 14, ox + 3, 14, c);
      p.hl(ox + 6, ox + 9, 7, '#1a1622'); p.line(ox + 14, 9, ox + 14, 6, '#4a4a5a'); p.hl(ox + 12, ox + 16, 6, '#1a1622');
      p.rect(ox + 14, 4, 5, 3, '#8a7050'); p.frame(ox + 14, 4, 5, 3, '#4a3a2a');
    });
  });
}
// 2050 street furniture: an air-quality / info pillar with a holo screen
export function infoPillar() {
  return sprite(14, 40, 7, 39, (p) => {
    p.block(4, 6, 6, 32, '#3a3a4c', { line: K.ink }); p.vl(4, 6, 37, '#5a5a70');
    p.rect(1, 0, 12, 10, '#0a2a34'); p.frame(1, 0, 12, 10, K.nc); p.text('AQ', 3, 2, K.nc, { mini: true }); p.hl(3, 10, 8, K.ng); p.px(10, 2, '#ffffff');
    for (let j = 14; j < 34; j += 4) p.hl(5, 8, j, '#2a2a3a'); p.px(6, 30, K.ng);
    p.rect(3, 37, 8, 2, K.ink2);
  });
}
// a courier robot: a rounded box on wheels with LED eyes
export function courierBot() {
  return sprite(18, 18, 9, 17, (p) => {
    p.block(2, 4, 14, 10, '#d8d8e4', { light: '#ffffff', dark: '#9898ac', line: K.ink }); p.rect(3, 5, 12, 4, '#1a1a2a'); p.px(6, 6, K.nc); p.px(11, 6, K.nc); p.hl(6, 11, 8, '#2a3a4a');
    p.rect(4, 10, 10, 2, K.no); p.vl(13, 0, 4, K.steelL); p.px(13, 0, K.ng);
    for (const wx of [4, 9, 14]) { p.ell(wx, 15, 2, 2, K.ink); p.px(wx, 15, '#6a6a7a'); }
  });
}
export function cat(c = '#2a2234') {
  return sprite(10, 9, 5, 8, (p) => { p.ell(5, 6, 3.4, 2.4, c); p.ell(2.5, 3, 2, 2, c); p.px(1, 1, c); p.px(3, 1, c); p.px(2, 3, '#e8e060'); p.line(8, 6, 9, 2, c); p.px(9, 1, c); p.px(2, 1, '#5a4a6a'); });
}
export function bollard() { return sprite(8, 12, 4, 11, (p) => { p.block(1, 3, 6, 8, '#4a4656', { line: K.ink }); p.ell(4, 3, 3, 1.6, '#6a6676'); p.px(2, 2, '#8a8696'); p.hl(2, 5, 6, '#e8c040'); }); }
export function scooter(c = '#5ac8b8') {
  return sprite(26, 18, 13, 17, (p) => {
    for (const wx of [5, 21]) { p.ell(wx, 13, 4, 4, K.ink); p.ell(wx, 13, 2.2, 2.2, '#5a5a6a'); p.px(wx, 13, '#9a9aaa'); }
    p.poly([[4, 10], [16, 10], [18, 6], [22, 6], [22, 12], [6, 13]], c); p.hl(4, 16, 10, hot(c, 0.4));
    p.rect(6, 6, 9, 3, '#2a2030'); p.hl(6, 14, 6, '#4a4050');
    p.line(21, 6, 19, 1, '#3a3a4a'); p.hl(17, 22, 1, '#3a3a4a'); p.px(23, 7, '#fff4c0');
  });
}
export function crateStackN() {
  return sprite(22, 22, 11, 21, (p) => {
    const crate = (x, y, w, h, c) => { p.block(x, y, w, h, c, { line: K.ink }); for (let i = x + 2; i < x + w - 1; i += 3) p.vl(i, y + 1, y + h - 2, shift(c, -0.5)); p.hl(x, x + w - 1, y + 1, shift(c, 0.6)); };
    crate(1, 10, 11, 10, '#b8862a'); crate(11, 12, 10, 8, '#2a6a9a'); crate(4, 2, 10, 8, '#a8303a');
    for (let k = 0; k < 4; k++) { p.px(5 + k * 2, 1, '#e8e0d0'); p.px(5 + k * 2, 0, '#b8b0a0'); }   // bottles
  });
}
