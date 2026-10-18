// Street props for HD-2D pixel scenes (Osaka 2050: an old shitamachi street
// with retro-future touches). Painters take a Pen and paint at (x, y) = top-left
// unless noted; sprite builders return { surf, ax, ay } with the anchor at the
// object's ground contact (used for depth sorting against actors).
import { Pen, C, newSurf, shift, mix } from './paint.js';

// ------------------------------------------------------------------ building parts
export function windowPane(p, x, y, w, h, o = {}) {
  const frame = o.frame || C.cream, glass = o.glass || C.glass;
  p.block(x, y, w, h, frame, { line: o.line || shift(o.wall || C.plaster, -2.2) });
  const gx = x + 2, gy = y + 2, gw = w - 4, gh = h - 4;
  p.vgrad(gx, gy, gw, gh, [shift(glass, 0.6), glass, shift(glass, -0.8)]);
  // diagonal sky reflection
  for (let k = 0; k < gw + gh; k += 7) for (let j = 0; j < gh; j++) { const i = k - j; if (i >= 0 && i < gw && (i + j) % 7 < 2) p.px(gx + i, gy + j, mix(glass, C.glassL, 0.55)); }
  // mullions
  if (gw > 9) p.vl(x + (w >> 1), gy, gy + gh - 1, frame);
  if (o.cross && gh > 9) p.hl(gx, gx + gw - 1, y + (h >> 1), frame);
  // curtains
  if (o.curtain) { const cc = o.curtain; const cw = Math.max(2, gw >> 2); p.rect(gx, gy, cw, gh, cc); p.rect(gx + gw - cw, gy, cw, gh, cc); p.vl(gx + cw - 1, gy, gy + gh - 1, shift(cc, -1)); p.vl(gx + gw - cw, gy, gy + gh - 1, shift(cc, -1)); for (let j = gy + 1; j < gy + gh; j += 3) { p.px(gx + 1, j, shift(cc, 0.8)); p.px(gx + gw - 2, j, shift(cc, 0.8)); } }
  if (o.light) { p.rect(gx + 1, gy + 1, gw - 2, gh - 2, o.light); p.speckle(gx + 1, gy + 1, gw - 2, gh - 2, shift(o.light, 0.8), 0.08); }
  // sill + its shadow + grime
  p.rect(x - 1, y + h, w + 2, 2, shift(frame, -0.5)); p.hl(x - 1, x + w, y + h, shift(frame, 0.6));
  p.wash(x - 1, y + h + 2, w + 2, 1, C.shade, 0.35);
  p.drips(x, y + h + 2, w, 5, mix(o.wall || C.plaster, C.shade, 0.25), 2);
  if (o.plant) { for (let i = 0; i < w; i += 3) { p.px(x + i, y + h - 1, C.green); p.px(x + i + 1, y + h - 2, C.greenL); p.px(x + i, y + h - 3, C.green); } p.rect(x, y + h - 1, w, 1, C.brick2); }
}
export function acUnit(p, x, y, o = {}) {      // 14×9 wall air-conditioner with grille and drip
  const b = o.color || '#d8d4c8';
  p.block(x, y, 14, 9, b, { line: shift(b, -2.6) });
  p.ell(x + 5, y + 4.5, 3.2, 3.2, shift(b, -1.4)); for (let a = 0; a < 6; a++) p.px(x + 5 + Math.round(Math.cos(a) * 2), y + 4 + Math.round(Math.sin(a) * 2), shift(b, -0.4));
  for (let j = y + 2; j < y + 8; j += 2) p.hl(x + 10, x + 12, j, shift(b, -1));
  p.rect(x + 1, y + 9, 2, 1, shift(b, -2)); p.rect(x + 11, y + 9, 2, 1, shift(b, -2));
  p.wash(x, y + 10, 14, 1, C.shade, 0.3);
  p.vl(x + 12, y + 10, y + 12 + p.ri(2, 8), shift(o.wall || C.plaster, -1.4));
}
export function pipe(p, x, y0, y1, o = {}) {
  const c = o.color || '#9a8a7a';
  p.vl(x, y0, y1, shift(c, 0.6)); p.vl(x + 1, y0, y1, c); p.vl(x + 2, y0, y1, shift(c, -1.2));
  for (let y = y0 + 6; y < y1; y += 14) { p.hl(x - 1, x + 3, y, shift(c, -1.6)); p.px(x - 1, y - 1, shift(c, 0.4)); }
  p.wash(x + 3, y0, 1, y1 - y0, C.shade, 0.25);
}
export function meterBox(p, x, y) { p.block(x, y, 7, 9, '#c4c0b0'); p.rect(x + 2, y + 2, 3, 3, '#20202a'); p.px(x + 3, y + 3, '#7af0a0'); p.hl(x + 1, x + 5, y + 7, '#9a9888'); }
export function poster(p, x, y, w, h, o = {}) {
  const bg = o.bg || p.pick([C.paper, C.mustard, C.tealL, C.redL]);
  p.rect(x, y, w, h, bg); p.frame(x, y, w, h, shift(bg, -1.6));
  p.rect(x + 2, y + 2, w - 4, (h >> 1) - 1, shift(bg, -1)); // picture block
  for (let j = y + (h >> 1) + 2; j < y + h - 2; j += 2) p.hl(x + 2, x + 2 + p.ri(2, w - 5), j, shift(bg, -2));
  if (o.torn) { p.px(x + w - 1, y + h - 1, 0); p.px(x + w - 2, y + h - 1, 0); }
  p.px(x + 1, y + 1, C.metalL); p.px(x + w - 2, y + 1, C.metalL);
}
export function signBoard(p, x, y, w, h, str, o = {}) {
  const bg = o.bg || C.cream, fg = o.fg || C.red, edge = o.edge || C.ink;
  p.block(x, y, w, h, bg, { line: edge });
  p.rect(x + 1, y + h - 2, w - 2, 1, shift(bg, -0.8));
  const sz = o.size || Math.min(14, h - 4);
  const tw = p.textW(str, { jpSize: sz });
  p.text(str, x + Math.round((w - tw) / 2), y + Math.round((h - sz) / 2) - 1, fg, { jpSize: sz, shadow: o.shadow });
  if (o.bolts) { p.px(x + 1, y + 1, C.metalL); p.px(x + w - 2, y + 1, C.metalL); }
  p.wash(x, y + h + 1, w, 2, C.shade, 0.35);
}
export function vSign(p, x, y, str, o = {}) {          // vertical (tategaki) sign on a bracket
  const bg = o.bg || C.cream, fg = o.fg || C.red, sz = o.size || 10, n = [...str].length, w = sz + 4, h = n * (sz + 1) + 5;
  p.block(x, y, w, h, bg, { line: o.edge || C.ink });
  [...str].forEach((ch, i) => p.text(ch, x + 2, y + 3 + i * (sz + 1), fg, { jpSize: sz }));
  if (o.neon) { p.frame(x + 1, y + 1, w - 2, h - 2, o.neon); }
  p.hl(x + w, x + w + 3, y + 3, C.metal2); p.hl(x + w, x + w + 3, y + h - 4, C.metal2);
  p.wash(x + 2, y + h + 1, w, 2, C.shade, 0.3);
  return { w, h };
}
export function awning(p, x, y, w, o = {}) {           // striped canvas awning with scalloped hem + cast shadow
  const a = o.a || C.red, b = o.b || C.cream, h = o.h || 9;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const sx = x + i - Math.round(j * 0.35); p.px(x + i, y + j, Math.floor((i + (o.phase || 0)) / 4) % 2 ? b : a); if (sx < 0) continue; }
  p.hl(x, x + w - 1, y, shift(a, 1));
  for (let i = 0; i < w; i += 4) { p.px(x + i + 1, y + h, Math.floor(i / 4) % 2 ? b : a); p.px(x + i + 2, y + h, Math.floor(i / 4) % 2 ? b : a); }
  p.wash(x, y + h - 2, w, 2, C.shade, 0.25);
  p.wash(x + 1, y + h + 1, w - 1, 4, C.shade, 0.45);
  p.frame(x - 1, y - 1, w + 2, h + 1, mix(a, C.ink, 0.6));
}
export function shutter(p, x, y, w, h, o = {}) {
  const c = o.color || '#a8a8b0';
  p.rect(x, y, w, h, c);
  for (let j = y; j < y + h; j += 2) { p.hl(x, x + w - 1, j, shift(c, 0.5)); p.hl(x, x + w - 1, j + 1, shift(c, -0.6)); }
  p.rect(x, y, w, 3, shift(c, -1.4)); p.hl(x, x + w - 1, y + h - 1, shift(c, -1.8));
  p.drips(x, y + 3, w, Math.min(10, h - 4), shift(c, -1), 4);
  if (o.graffiti) { const g = o.graffiti; p.line(x + 4, y + h - 6, x + 10, y + h - 12, g); p.line(x + 10, y + h - 12, x + 14, y + h - 7, g); p.line(x + 14, y + h - 7, x + 20, y + h - 13, g); p.px(x + 21, y + h - 13, g); }
  p.frame(x - 1, y - 1, w + 2, h + 2, C.ink2);
}
export function noren(p, x, y, w, o = {}) {           // split shop curtain
  const c = o.color || C.navy, h = o.h || 12;
  p.hl(x - 1, x + w, y - 1, C.wood2);
  const n = Math.max(2, Math.round(w / 8)), pw = Math.floor(w / n);
  for (let k = 0; k < n; k++) { p.rect(x + k * pw, y, pw - 1, h, c); p.vl(x + k * pw, y, y + h - 1, shift(c, 0.8)); p.hl(x + k * pw, x + k * pw + pw - 2, y + h - 1, shift(c, -1)); }
  if (o.mark) p.text(o.mark, x + (w >> 1) - 5, y + 2, C.cream, { jpSize: 9 });
}
export function lantern(p, x, y, o = {}) {           // red paper chochin
  const c = o.color || C.red;
  p.vl(x + 3, y - 3, y, C.ink2); p.rect(x + 1, y, 5, 1, C.ink2);
  p.ell(x + 3.5, y + 6, 3.6, 5.2, c);
  for (let j = y + 2; j < y + 11; j += 2) p.hl(x + 1, x + 5, j, shift(c, -0.6));
  p.vl(x + 1, y + 3, y + 8, shift(c, 1)); p.px(x + 2, y + 2, shift(c, 1.6));
  p.rect(x + 1, y + 11, 5, 1, C.ink2);
  if (o.mark) p.px(x + 3, y + 6, C.ink);
}

// a whole building front. opts: { wall, floors, floorH, shop: { kind, sign, color }, roof: 'flat'|'tile'|'parapet', vsign, seed }
export function facade(p, x, y, w, h, o = {}) {
  const wall = o.wall || C.plaster, fh = o.floorH || 30, floors = o.floors || Math.max(1, Math.floor((h - 34) / fh));
  const shopH = 34;
  // wall body with gentle weathering
  p.rect(x, y, w, h, wall);
  p.speckle(x + 1, y + 1, w - 2, h - 2, shift(wall, -0.5), 0.025);
  p.blots(x, y + 4, w, h - 8, mix(wall, C.shade, 0.18), Math.round(w * h / 300), 2);
  if (o.panels) for (let px2 = x + o.panels; px2 < x + w - 2; px2 += o.panels) p.vl(px2, y + 2, y + h - shopH - 1, shift(wall, -0.6));
  if (o.bricks) for (let j = y + 4; j < y + h - shopH; j += 4) { p.hl(x, x + w - 1, j, shift(wall, -0.7)); for (let i = x + ((j >> 2) % 2) * 4; i < x + w; i += 8) p.vl(i, j - 3, j - 1, shift(wall, -0.7)); }
  // roof / parapet
  const roof = o.roof || 'parapet';
  if (roof === 'tile') {
    const rc = o.roofColor || C.roof, rh = 14;
    for (let j = 0; j < rh; j++) { const inset = Math.round((rh - j) * 0.6); p.hl(x - 3 + inset, x + w + 2 - inset, y - rh + j, j % 3 === 0 ? shift(rc, 0.8) : j % 3 === 1 ? rc : shift(rc, -0.6)); }
    for (let i = x; i < x + w; i += 5) p.vl(i, y - rh + 4, y - 1, shift(rc, -1));
    p.hl(x - 3, x + w + 2, y, shift(rc, -1.5)); p.wash(x, y + 1, w, 3, C.shade, 0.4);
    p.frame(x - 4, y - rh - 1, w + 8, rh + 2, C.ink);
  } else {
    p.rect(x - 1, y, w + 2, 4, shift(wall, 0.6)); p.hl(x - 1, x + w, y, shift(wall, 1.4)); p.wash(x, y + 4, w, 2, C.shade, 0.3);
    p.drips(x, y + 5, w, 8, mix(wall, C.shade, 0.3), Math.round(w / 10));
    if (o.tank) { const tx = x + w - 22; p.block(tx, y - 14, 14, 12, '#9aa0a8'); p.hl(tx, tx + 13, y - 10, '#7a808a'); p.vl(tx + 2, y - 2, y, C.metal2); p.vl(tx + 11, y - 2, y, C.metal2); }
    if (o.antenna) { const ax = x + 8; p.vl(ax, y - 16, y - 1, C.metal2); p.hl(ax - 4, ax + 4, y - 14, C.metal2); p.hl(ax - 3, ax + 3, y - 11, C.metal2); p.px(ax, y - 17, C.redL); }
  }
  // upper floors: windows, AC units, laundry, plants
  const wins = o.windows || Math.max(1, Math.floor((w - 8) / 26));
  for (let f = 0; f < floors; f++) {
    const fy = y + 8 + f * fh;
    if (fy + 22 > y + h - shopH) break;
    const ww = o.winW || 16, gap = (w - wins * ww) / (wins + 1);
    for (let k = 0; k < wins; k++) {
      const wx = Math.round(x + gap + k * (ww + gap));
      const lit = o.night && p.chance(0.5);
      windowPane(p, wx, fy, ww, 15, { wall, frame: o.frame || C.cream, curtain: p.chance(0.55) ? p.pick([C.mustard, C.tealL, C.redL, C.paper, '#c8a0c8']) : null, plant: p.chance(0.3), cross: p.chance(0.4), light: lit ? '#ffd890' : null });
      if (p.chance(0.4) && wx + ww + 16 < x + w) acUnit(p, wx + ww + 2, fy + 8, { wall });
    }
    // floor band
    p.hl(x, x + w - 1, fy + fh - 5, shift(wall, -0.8)); p.hl(x, x + w - 1, fy + fh - 6, shift(wall, 0.5));
  }
  // ground-floor shop
  const sy = y + h - shopH;
  const shop = o.shop || {};
  p.rect(x, sy, w, shopH, shift(wall, -0.4));
  if (shop.kind === 'shutter') { shutter(p, x + 4, sy + 10, w - 8, shopH - 10, { graffiti: shop.graffiti }); }
  else {
    // glass shopfront + door
    const gx = x + 3, gw = w - 6, gy = sy + 12, gh = shopH - 12;
    p.rect(gx, gy, gw, gh, C.ink2);
    p.vgrad(gx + 1, gy + 1, gw - 2, gh - 1, shop.lit ? ['#ffe4a8', '#f0b878', '#c8885a'] : [C.glassL, C.glass, C.glass2]);
    // shelves / goods silhouettes inside
    for (let j = gy + 6; j < gy + gh - 2; j += 7) { p.hl(gx + 2, gx + gw - 3, j, shift(C.wood, -0.5)); for (let i = gx + 3; i < gx + gw - 3; i += 3) if (p.chance(0.7)) p.rect(i, j - p.ri(2, 4), 2, p.ri(2, 4), p.pick([C.redL, C.mustard, C.tealL, C.cream, C.blueL])); }
    const dw = 12, dx = gx + (shop.doorAt ?? (gw - dw) >> 1);
    p.rect(dx, gy, dw, gh, C.ink2); p.vgrad(dx + 1, gy + 1, dw - 2, gh - 1, shop.lit ? ['#fff0c8', '#e8b07a'] : [C.glass, C.glass2]); p.vl(dx + (dw >> 1), gy + 1, gy + gh - 1, C.ink2);
    p.px(dx + (dw >> 1) - 2, gy + (gh >> 1), C.metalL); p.px(dx + (dw >> 1) + 2, gy + (gh >> 1), C.metalL);
    for (let k = 0; k < gw; k += 9) p.px(gx + k + 2, gy + 2, C.white);
    if (shop.noren) noren(p, dx - 4, gy, dw + 8, { color: shop.noren, mark: shop.mark });
  }
  // sign band above the shop
  if (shop.sign) signBoard(p, x + 3, sy + 1, w - 6, 11, shop.sign, { bg: shop.signBg || C.cream, fg: shop.signFg || C.red, size: 9, bolts: true });
  else { p.rect(x, sy, w, 3, shift(wall, -1)); }
  if (shop.awning) awning(p, x + 2, sy + 12, w - 4, { a: shop.awning, b: C.cream, h: 6 });
  // base skirting + contact shadow
  p.rect(x, y + h - 3, w, 3, shift(wall, -1.6)); p.hl(x, x + w - 1, y + h - 3, shift(wall, -0.6));
  // pipes, meters, posters
  if (o.pipe) pipe(p, o.pipe === 'left' ? x + 2 : x + w - 5, y + 4, y + h - 3, {});
  if (o.meter) meterBox(p, x + w - 12, sy - 14);
  if (o.posters) for (let k = 0; k < o.posters; k++) poster(p, x + 4 + k * 12, sy + 13, 10, 13, { torn: p.chance(0.4) });
  if (o.vsign) vSign(p, x + (o.vsignX ?? w - 16), y + 30, o.vsign, { bg: o.vsignBg || C.cream, fg: o.vsignFg || C.red, size: 9, neon: o.neon });
  // silhouette edges
  p.vl(x - 1, y, y + h - 1, C.ink); p.vl(x + w, y, y + h - 1, C.ink);
  if (roof !== 'tile') p.hl(x - 2, x + w + 1, y - 1, C.ink);
}

// ------------------------------------------------------------------ sprites (sortable objects)
function sprite(w, h, ax, ay, fn, seed = 3) { const s = newSurf(w, h), p = new Pen(s, seed); fn(p); return { surf: s, ax, ay }; }

export function vendingMachine(o = {}) {
  const body = o.color || C.red;
  return sprite(22, 38, 11, 37, (p) => {
    p.block(1, 1, 20, 35, body, { line: shift(body, -2.8) });
    p.rect(3, 3, 16, 15, '#e8f0f8'); p.frame(3, 3, 16, 15, shift(body, -2));
    // drink rows
    const cols = [C.redL, C.blueL, C.mustard, C.tealL, '#f0f0f0', C.greenL];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) { const cx = 4 + k * 3, cy = 5 + r * 4; p.rect(cx, cy, 2, 3, p.pick(cols)); p.px(cx, cy, '#ffffff'); }
    for (let k = 0; k < 5; k++) p.px(4 + k * 3, 17, '#ff5050');
    p.rect(3, 20, 10, 4, shift(body, -1)); p.rect(14, 20, 4, 6, C.ink2); p.px(15, 21, C.neonY); p.px(16, 23, '#7af0a0');
    p.rect(4, 28, 14, 5, C.ink2); p.hl(5, 16, 29, shift(body, -1.6));
    p.hl(2, 19, 2, shift(body, 1.4));
    p.wash(1, 1, 20, 18, '#ffffff', 0.08);
  });
}
export function utilityPole(h = 150) {
  return sprite(34, h, 17, h - 1, (p) => {
    const x = 15;
    p.rect(x, 0, 4, h, '#8a8478'); p.vl(x, 0, h - 1, '#a8a294'); p.vl(x + 3, 0, h - 1, '#6a6458');
    for (let y = 30; y < h - 10; y += 5) p.hl(x + 1, x + 2, y, '#7a7468');
    p.rect(x - 1, h - 3, 6, 3, '#6a6458');
    // cross-arms + insulators
    for (const [yy, ww] of [[10, 13], [20, 10]]) { p.block(x + 2 - ww, yy, ww * 2, 2, '#7a6a58'); for (const ix of [x + 3 - ww, x - 2, x + 5, x + ww]) { p.rect(ix, yy - 3, 2, 3, '#e8e0d0'); p.px(ix, yy - 3, '#ffffff'); } }
    // transformer can
    p.block(x + 5, 34, 9, 14, '#8e98a0'); p.hl(x + 5, x + 13, 38, '#7a848c'); p.hl(x + 5, x + 13, 44, '#7a848c'); p.vl(x + 4, 36, 46, C.ink2);
    // step bolts + a little sign
    for (let y = 60; y < h - 20; y += 9) { p.hl(x - 2, x - 1, y, C.metal2); p.hl(x + 4, x + 5, y + 4, C.metal2); }
    p.block(x - 6, 70, 8, 16, C.cream); p.text('3', x - 4, 73, C.blue, {}); p.hl(x - 5, x + 0, 82, C.blue);
    p.block(x + 1, 96, 6, 8, C.mustard); p.px(x + 3, 99, C.ink);
  });
}
export function streetLamp(o = {}) {
  return sprite(20, 70, 6, 69, (p) => {
    p.rect(5, 6, 2, 63, C.steel); p.vl(5, 6, 68, shift(C.steel, 0.8));
    p.rect(3, 66, 6, 3, shift(C.steel, -1));
    p.hl(5, 14, 5, C.steel); p.hl(6, 14, 4, shift(C.steel, 0.8));
    p.block(11, 6, 7, 3, shift(C.steel, -0.5)); p.rect(12, 9, 5, 2, o.on ? '#fff4c0' : '#d8e0e8');
  });
}
export function bicycle(o = {}) {
  const c = o.color || C.teal;
  return sprite(28, 18, 14, 17, (p) => {
    const wheel = (cx) => { p.s.ring(cx, 11, 5, 5, C.ink2); p.s.ring(cx, 11, 4, 4, C.metal2); p.px(cx, 11, C.metalL); };
    wheel(6); wheel(21);
    p.line(6, 11, 12, 6, c); p.line(12, 6, 20, 6, c); p.line(20, 6, 21, 11, c); p.line(12, 6, 14, 11, c); p.line(14, 11, 6, 11, c);
    p.line(19, 6, 19, 3, C.metal2); p.hl(17, 22, 3, C.ink2); p.hl(10, 13, 5, C.ink); p.rect(19, 3, 5, 3, C.metal2);
    p.rect(20, 1, 6, 4, '#b8a070'); p.frame(20, 1, 6, 4, C.wood2); // front basket
  });
}
export function plantPot(o = {}) {
  const pot = o.pot || C.brick, big = o.big;
  const W = big ? 20 : 14, H = big ? 26 : 18;
  return sprite(W, H, W >> 1, H - 1, (p) => {
    const pw = big ? 12 : 8, px0 = (W - pw) >> 1;
    p.block(px0, H - 8, pw, 7, pot); p.hl(px0 - 1, px0 + pw, H - 8, shift(pot, 1));
    const cx = W / 2, top = H - 9;
    for (let k = 0; k < (big ? 16 : 9); k++) { const a = -Math.PI * (0.1 + 0.8 * p.r()), L = p.rand(4, big ? 12 : 8); const ex = cx + Math.cos(a) * L, ey = top + Math.sin(a) * L; p.line(Math.round(cx), top, Math.round(ex), Math.round(ey), k % 3 ? C.green : C.green2); p.px(Math.round(ex), Math.round(ey), C.greenL); }
    if (o.flowers) for (let k = 0; k < 4; k++) p.px(Math.round(cx + p.rand(-5, 5)), Math.round(top - p.rand(3, 9)), o.flowers);
  });
}
export function trashBags() {
  return sprite(24, 14, 12, 13, (p) => {
    for (const [cx, cy, rx, ry, c] of [[7, 8, 6, 5, '#4a5a6a'], [16, 9, 6, 4.5, '#5a6a5a'], [11, 5, 5, 4, '#3a4a5a']]) { p.ell(cx, cy, rx, ry, c); p.ell(cx - 1.5, cy - 1.5, rx * 0.4, ry * 0.4, shift(c, 1.2)); p.px(cx, cy - ry, C.mustard); }
  });
}
export function crateStack() {
  return sprite(22, 20, 11, 19, (p) => {
    const crate = (x, y, w, h, c) => { p.block(x, y, w, h, c); for (let i = x + 2; i < x + w - 1; i += 3) p.vl(i, y + 1, y + h - 2, shift(c, -0.6)); p.hl(x, x + w - 1, y + 1, shift(c, 1)); };
    crate(1, 9, 11, 10, C.mustard); crate(11, 11, 10, 8, C.blueL); crate(4, 1, 10, 8, C.redL);
    for (let k = 0; k < 4; k++) p.px(3 + k * 2, 13, C.cream);
  });
}
export function hydrant() {
  return sprite(10, 15, 5, 14, (p) => {
    p.block(2, 4, 6, 10, C.red); p.block(1, 3, 8, 2, C.red2); p.ell(5, 3, 2.5, 2, C.red); p.px(4, 2, C.redL);
    p.rect(0, 7, 2, 2, C.red2); p.rect(8, 7, 2, 2, C.red2); p.hl(3, 6, 12, C.red2); p.vl(3, 5, 10, C.redL);
  });
}
export function postbox() {
  return sprite(12, 26, 6, 25, (p) => {
    p.rect(5, 16, 2, 9, C.ink2);
    p.block(1, 2, 10, 15, '#d8382e'); p.ell(6, 2, 5, 2, '#d8382e'); p.hl(2, 9, 6, C.ink); p.vl(2, 3, 15, '#f06a50'); p.px(6, 10, C.white); p.hl(4, 8, 12, '#a82820');
  });
}
export function barberPole() {
  return sprite(8, 22, 4, 21, (p) => {
    p.block(1, 0, 6, 3, C.metal); p.block(1, 18, 6, 3, C.metal);
    p.rect(2, 3, 4, 15, C.white);
    for (let y = 3; y < 18; y++) for (let x = 2; x < 6; x++) { const k = (x + y) % 6; p.px(x, y, k < 2 ? C.red : k < 3 ? C.white : k < 5 ? C.blue : C.white); }
    p.vl(2, 3, 17, mix(C.white, '#ffffff', 0.5));
  });
}
export function bench() {
  return sprite(34, 14, 17, 13, (p) => {
    p.block(1, 5, 32, 3, C.woodL); p.block(1, 1, 32, 3, C.wood); for (const x of [3, 29]) { p.rect(x, 8, 2, 6, C.metal2); p.rect(x, 3, 2, 3, C.metal2); }
  });
}
export function cone() {
  return sprite(10, 13, 5, 12, (p) => { p.poly([[2, 11], [5, 1], [8, 11]], C.orange); p.hl(3, 6, 5, C.white); p.hl(2, 7, 8, C.white); p.block(0, 11, 10, 2, C.orange); p.px(4, 2, shift(C.orange, 1.5)); });
}
export function weeds(o = {}) {
  const w = o.w || 16, h = o.h || 12;
  return sprite(w, h, w >> 1, h - 1, (p) => {
    for (let k = 0; k < w * 0.9; k++) { const x0 = p.ri(1, w - 2), L = p.ri(3, h - 1), lean = p.rand(-0.5, 0.5); const c = p.pick([C.grass, C.grass2, C.grassL, C.grass]); for (let j = 0; j < L; j++) p.px(Math.round(x0 + lean * j * 0.5), h - 1 - j, j === L - 1 ? C.grassL : c); }
    if (o.green) for (let k = 0; k < w / 3; k++) { const x0 = p.ri(1, w - 2); p.vl(x0, h - p.ri(2, 5), h - 1, C.green); }
  });
}
export function drone() {           // 2050: a little delivery drone
  return sprite(18, 10, 9, 9, (p) => {
    p.block(5, 4, 8, 4, C.white); p.rect(7, 5, 4, 1, C.neonC); p.hl(1, 6, 3, C.metal2); p.hl(12, 17, 3, C.metal2);
    p.hl(0, 3, 2, C.metalL); p.hl(14, 17, 2, C.metalL); p.rect(7, 8, 4, 2, C.mustard);
  });
}

// ------------------------------------------------------------------ ground
export function paving(p, x, y, w, h, o = {}) {
  const base = o.base || C.sand, slab = o.slab || 16;
  p.rect(x, y, w, h, base);
  for (let j = y; j < y + h; j += slab >> 1) { const off = ((j - y) / (slab >> 1)) % 2 ? slab >> 1 : 0; p.hl(x, x + w - 1, j, shift(base, -0.45)); for (let i = x + off; i < x + w; i += slab) p.vl(i, j, Math.min(y + h - 1, j + (slab >> 1) - 1), shift(base, -0.45)); }
  p.speckle(x, y, w, h, shift(base, -0.45), 0.008);
  // worn slabs: a few slabs a tone lighter or darker, clustered, like real old paving
  for (let k = 0; k < Math.round(w * h / 1400); k++) { const sx = x + Math.floor(p.ri(0, w) / slab) * slab + 1, sy = y + Math.floor(p.ri(0, h) / (slab >> 1)) * (slab >> 1) + 1; p.rect(sx, sy, slab - 1, (slab >> 1) - 1, p.chance(0.5) ? shift(base, 0.25) : shift(base, -0.25)); }
  p.blots(x, y, w, h, mix(base, C.shade, 0.15), Math.round(w * h / 1400), 3);
  // cracks
  for (let k = 0; k < Math.round(w * h / 6000); k++) { let cx = x + p.ri(0, w), cy = y + p.ri(0, h); for (let s = 0; s < 10; s++) { p.px(cx, cy, shift(base, -1.2)); cx += p.ri(-1, 1); cy += p.ri(0, 1); } }
}
export function checker(p, x, y, w, h, o = {}) {
  const a = o.a || '#c8a888', b = o.b || '#ad8c7c', t = o.tile || 8;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(x + i, y + j, (Math.floor(i / t) + Math.floor(j / t)) % 2 ? b : a);
  p.blots(x, y, w, h, mix(a, C.shade, 0.18), Math.round(w * h / 900), 3);
  p.frame(x - 2, y - 2, w + 4, h + 4, '#8a6a60'); p.frame(x - 1, y - 1, w + 2, h + 2, '#d8bca0');
}
export function dirt(p, x, y, w, h, o = {}) {
  const base = o.base || C.sand2;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const u = (i / w - 0.5) * 2, v = (j / h - 0.5) * 2, d = u * u + v * v + (p.r() - 0.5) * 0.25; if (d < 1) p.px(x + i, y + j, d > 0.75 ? mix(base, C.sand, 0.5) : base); }
  p.speckle(x, y, w, h, shift(base, -0.8), 0.03);
}
export function stairs(p, x, y, w, steps, o = {}) {     // wide steps going up toward the top (each step: tread + riser)
  const tread = o.tread || '#c8a490', riser = o.riser || '#8e6a64', sh = o.stepH || 7;
  for (let k = 0; k < steps; k++) {
    const sy = y + k * sh;
    p.rect(x, sy, w, 3, tread); p.hl(x, x + w - 1, sy, shift(tread, 0.8));
    p.rect(x, sy + 3, w, sh - 3, riser); p.hl(x, x + w - 1, sy + 3, shift(riser, -0.8));
    p.speckle(x, sy, w, sh, shift(tread, -0.8), 0.03);
    for (let i = x + 3; i < x + w; i += p.ri(10, 26)) p.px(i, sy + 1, shift(tread, -1));
  }
  // side walls / handrails
  for (const sx of [x - 4, x + w]) { p.rect(sx, y - 3, 4, steps * sh + 3, '#a08478'); p.vl(sx, y - 3, y + steps * sh - 1, '#c0a090'); p.vl(sx + 3, y - 3, y + steps * sh - 1, '#6e5250'); }
  p.vl(x + (w >> 1), y - 8, y + steps * sh - 2, C.metal2); for (let k = 0; k < steps; k += 2) p.px(x + (w >> 1), y + k * sh, C.metalL);
}

// ------------------------------------------------------------------ foliage
// a leafy street tree: canopy of lit/shaded leaf clusters, bark trunk, roots
export function tree(o = {}) {
  const W = o.w || 84, H = o.h || 112, leaf = o.leaf || C.green, seed = o.seed || 9;
  return sprite(W, H, W >> 1, H - 2, (p) => {
    const cx = W / 2, base = H - 2, trunkTop = H * 0.48;
    // trunk + branches
    for (let y = Math.round(trunkTop); y <= base; y++) { const t = (y - trunkTop) / (base - trunkTop), hw = 3 + t * t * 3.5; for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) { const u = (x - (cx - hw)) / (2 * hw); p.px(x, y, u < 0.3 ? '#9a7a5e' : u < 0.75 ? '#7a5a44' : '#5a3e34'); } }
    for (let k = 0; k < 14; k++) p.vl(Math.round(cx + p.rand(-3, 3)), Math.round(p.rand(trunkTop, base - 4)), Math.round(p.rand(trunkTop, base)), '#5a3e34');
    for (const [dx, dy] of [[-16, -18], [14, -22], [-6, -30], [20, -8], [-22, -4]]) p.line(Math.round(cx), Math.round(trunkTop + 6), Math.round(cx + dx), Math.round(trunkTop + dy), '#6a4a3a');
    for (const s of [-1, 1]) { p.line(Math.round(cx + s * 5), base, Math.round(cx + s * 10), base, '#5a3e34'); p.px(Math.round(cx + s * 11), base, '#7a5a44'); }
    // canopy: leaf clumps back-to-front; one canopy-wide light plus each clump's own roundness,
    // dark only on each clump's lower-right rim (scalloped, never outlined all round)
    const dark = shift(leaf, -1.7), mid = shift(leaf, -0.7), lite = shift(leaf, 0.5), hi = shift(leaf, 1.5);
    const ccx = cx, ccy = H * 0.32, RX = W * 0.44, RY = H * 0.27;
    const blobs = [];
    for (let k = 0; k < 42; k++) { const a = p.rand(0, Math.PI * 2), r = Math.sqrt(p.r()) * 0.82; blobs.push([ccx + Math.cos(a) * r * RX, ccy + Math.sin(a) * r * RY, p.rand(6, 10)]); }
    blobs.sort((a, b) => a[1] - b[1]);
    for (const [bx, by, br] of blobs) {
      for (let j = -br; j <= br; j++) for (let i = -br; i <= br; i++) {
        const d = (i * i + j * j) / (br * br) + (p.r() - 0.5) * 0.22; if (d > 1) continue;
        const X = Math.round(bx + i), Y = Math.round(by + j);
        const gl = -(((X - ccx) / RX) * 0.6 + ((Y - ccy) / RY) * 0.8), ll = -(i * 0.6 + j * 0.8) / br;
        const l = gl * 0.55 + ll * 0.6 + (p.r() - 0.5) * 0.12;
        p.px(X, Y, d > 0.78 && i + j > 0 ? dark : l > 0.62 ? hi : l > 0.18 ? lite : l > -0.32 ? mid : dark);
      }
    }
    // leaf flecks at the edge + light holes
    for (let k = 0; k < 90; k++) { const a = p.rand(0, Math.PI * 2), r = p.rand(0.82, 1.02); const x = Math.round(cx + Math.cos(a) * r * W * 0.46), y = Math.round(H * 0.32 + Math.sin(a) * r * H * 0.3); p.px(x, y, p.chance(0.5) ? mid : dark); }
    for (let k = 0; k < 10; k++) p.px(Math.round(cx + p.rand(-W * 0.3, W * 0.3)), Math.round(H * 0.3 + p.rand(-H * 0.18, H * 0.18)), C.yellowL);
    if (o.flowers) for (let k = 0; k < 30; k++) p.px(Math.round(cx + p.rand(-W * 0.38, W * 0.38)), Math.round(H * 0.3 + p.rand(-H * 0.22, H * 0.2)), p.chance(0.6) ? o.flowers : shift(o.flowers, 1));
  }, seed);
}
export function bush(o = {}) {
  const W = o.w || 30, H = o.h || 18, leaf = o.leaf || C.green;
  return sprite(W, H, W >> 1, H - 1, (p) => {
    const dark = shift(leaf, -1.5), mid = shift(leaf, -0.5), lite = shift(leaf, 0.8);
    for (let k = 0; k < W / 3; k++) { const bx = p.rand(5, W - 5), by = p.rand(H * 0.45, H - 5), br = p.rand(4, 7); for (let j = -br; j <= br; j++) for (let i = -br; i <= br; i++) { const d = (i * i + j * j) / (br * br); if (d > 1 || by + j >= H) continue; const l = -(i + j) / (br * 1.5); p.px(Math.round(bx + i), Math.round(by + j), d > 0.8 ? dark : l > 0.3 ? lite : mid); } }
    if (o.flowers) for (let k = 0; k < W / 3; k++) p.px(p.ri(3, W - 4), p.ri(3, H - 5), o.flowers);
  });
}
export function hoarding(w = 120, o = {}) {      // construction fence board with posters
  return sprite(w, 34, w >> 1, 33, (p) => {
    p.rect(0, 4, w, 28, '#5a5a78'); for (let x = 0; x < w; x += 2) p.vl(x, 4, 31, x % 4 ? '#4c4c6a' : '#66668a');
    p.hl(0, w - 1, 4, '#8a8aa8'); p.hl(0, w - 1, 31, '#3a3a52');
    for (let k = 0; k < Math.floor(w / 22); k++) poster(p, 6 + k * 22, 9, 14, 18, { torn: p.chance(0.5) });
    p.text('KEEP OUT', (w >> 1) - 20, 26, C.mustard, { mini: true });
    for (const x of [2, w - 4]) p.rect(x, 0, 3, 34, '#7a6a5a');
  });
}
