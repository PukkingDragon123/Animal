// HUD and world widgets in the pixel-GUI style. Each takes the PixelUI first.
//  • valuePill: a cream pill counter with a big round pixel icon overlapping its left end and a chunky number
//  • plinthButton: a square pixel icon standing on a little wooden plinth (lifts on hover, squashes on press)
//  • roundButton: a round button in a copper ring with a lip below · keycap · prompt bubble · thumbstick
//  • hudClock / hudMoney (value pills), hudLocation (a dropping name plate with diamond ornaments),
//    objective tag, party medals, the round copper-framed radar
// Icons and numbers first; words only where an icon can't say it (and then on hover or briefly).
import { T, mx, clamp01, easeOut, boing, squash } from './theme.js';
import { rgba, fillShape, fillDisc, pixelCanvas, blit } from './gfx.js';
import { frame, knob, plinth, pill, tri, sparkle, ball, woodRing, clipCircle, discA, ringPx, gem } from './frame.js';
import { drawBig, drawSmall } from './icons.js';

export const fmtNum = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const R = Math.round;

// a round badge holding an icon (toasts, pills, medals)
export function badge(ui, cx, cy, r, icon, color = T.amber) {
  ball(ui.s, cx, cy, r, color);
  const box = r >= 8 ? 16 : 12;
  drawBig(ui.s, icon, R(cx - box / 2), R(cy - box / 2), null, { scale: box / 12, shadow: false });
}
// ------------------------------------------------------------------ value pill
// o: { color (badge), id (count-up memory), right (x is the right edge) } → width
export function valuePill(ui, x, y, w, icon, value, o = {}) {
  const h = 15; if (o.right) x -= w;
  pill(ui, x + 6, y, w - 6, h);
  ui.text(String(value), x + w - 6, y + 4, T.text, { bold: true, align: 'right' });
  badge(ui, x + 7, y + 7, 9, icon, o.color || T.amber);
  return w;
}
// ------------------------------------------------------------------ keycap: a little cream key with a lip
// returns its width. o: { pressed, color, mini, small }
export function keycap(ui, x, y, label, o = {}) {
  const lab = String(label ?? ''), small = !!o.small, mini = small || o.mini || lab.length > 2;
  const lw = ui.tw(lab, { mini, bold: true }), w = Math.max(small ? 9 : 11, R(lw + (small ? 5 : 7))), h = small ? 10 : 13;
  knob(ui, x, y, w, h, { color: o.color || T.creamL, state: o.pressed ? 2 : 0, lip: 2, r: 2 });
  ui.text(lab, R(x + w / 2), y + (o.pressed ? 1 : 0) + R((h - 2 - (mini ? 5 : 7)) / 2), T.text, { align: 'center', mini, bold: true });
  return w;
}
// ------------------------------------------------------------------ prompt bubble above things in the world
// a cream bubble with a tail holding the thing's icon, the key on its corner; the words on hover / first show.
// (x, y) is the tip of the tail. Returns true when tapped. o: { icon, color, bob, alpha, label ('always' | 'never') }
const DOOR_RE = /\b(door|enter|exit|leave|go (in|out|inside|outside|home|up|down)|upstairs|downstairs|stairs|gate)\b/i;
const TALK_RE = /\b(talk|chat|ask|greet|speak|say)\b/i;
export function promptIcon(label, icon) {
  if (icon && icon !== 'star') return icon;
  if (TALK_RE.test(label)) return 'talk';
  if (DOOR_RE.test(label)) return 'door';
  return icon || 'hand';
}
export function prompt(ui, x, y, keyLabel, str, o = {}) {
  x = R(x); y = R(y);
  const g = ui.g, label = String(str ?? ''), a = ui.anim('prompt:' + label, {}); a.t += ui.dt;
  const seen = ui._promptSeen || (ui._promptSeen = new Map());
  if (!seen.has(label)) seen.set(label, ui.t);
  const icon = promptIcon(label, o.icon);
  const bw = 24, bh = 22, bob = o.bob === false ? 0 : R(Math.sin(ui.t * 3.2));
  const bx = x - bw / 2, by0 = y - 5 - bh;
  const over = !ui.blocked(o) && ui.inside(bx - 2, by0 - 2, bw + 4, bh + 8);
  if (over && ui.ptr.pressed) { ui.click('ui_tap', { vol: 0.6 }); a.pt = 0; }
  a.pt = (a.pt ?? 9) + ui.dt;
  const pop = boing(a.t * 1.6); if (pop < 0.1) return false;
  const sq = squash(a.pt, 0.14), lift = over ? -2 : 0, by = by0 + bob + lift;
  g.globalAlpha = o.alpha ?? 1;
  ui.push(x, y, Math.max(0.1, pop) + sq, Math.max(0.1, pop) - sq);
  frame(ui, bx, by, bw, bh, { thin: true, r: 3, edge: over ? T.brass : null, shadowA: 0.3 });
  tri(ui.s, x - 3, by + bh - 1, 'down', 3, T.cream);
  drawBig(ui.s, icon, bx + 4, by + 3, null, { scale: 16 / 12, shadow: false });
  if (keyLabel) keycap(ui, bx + bw - 6, by + bh - 8, keyLabel, { small: true, pressed: over && ui.ptr.down });
  ui.pop(); g.globalAlpha = 1;
  if (a.t < 0.45) sparkle(ui.s, bx + 1, by + 1, T.amberL, 1 - a.t / 0.45);
  const showLabel = o.label === 'always' || (o.label !== 'never' && over);   // a single icon bubble; the words only on hover
  a.lk = clamp01((a.lk || 0) + (showLabel ? 1 : -1) * ui.dt * 7);
  if (a.lk > 0.3 && label) {
    const lw = R(ui.tw(label, { mini: true, bold: true }) + 12), lx = R(x - lw / 2), ly = by - 15 + R((1 - easeOut(a.lk)) * 4);
    frame(ui, lx, ly, lw, 12, { thin: true, r: 2, fill: T.ink, edge: T.copperD, shadowA: 0.3 });
    ui.text(label, lx + 6, ly + 3, T.cream, { mini: true, bold: true });
  }
  const tapped = over && ui.ptr.released;
  if (tapped) ui.ptr.released = false;
  return tapped;
}
// ------------------------------------------------------------------ virtual thumbstick
export function joystick(ui, cx, cy, r, dx = 0, dy = 0, active = false, o = {}) {
  cx = R(cx); cy = R(cy); r = R(r);
  const k = active ? 1 : o.ghost ? 0.45 : 0.75;
  discA(ui.s, cx, cy, r, T.shade, 0.28 * k);
  ringPx(ui.s, cx, cy, r + 1, T.ink, 0.8 * k); ringPx(ui.s, cx, cy, r, T.cream, 0.85 * k); ringPx(ui.s, cx, cy, r - 1, T.copper, 0.6 * k);
  let m = Math.hypot(dx, dy), nx = dx, ny = dy; if (m > 1) { nx /= m; ny /= m; m = 1; }
  for (const [d, ux, uy] of [['up', 0, -1], ['right', 1, 0], ['down', 0, 1], ['left', -1, 0]]) {
    const on = active && m > 0.3 && nx * ux + ny * uy > 0.7, px0 = cx + ux * (r - 6), py0 = cy + uy * (r - 6);
    ui.g.globalAlpha = o.ghost ? 0.6 : 1;
    if (d === 'up' || d === 'down') tri(ui.s, px0 - 2, py0 - 1, d, 2, on ? T.amber : T.cream); else tri(ui.s, px0 - 1, py0 - 2, d, 2, on ? T.amber : T.cream);
    ui.g.globalAlpha = 1;
  }
  if (o.ghost) return;
  const kr = Math.max(5, R(r * 0.42)), KX = cx + nx * (r - kr * 0.6), KY = cy + ny * (r - kr * 0.6);
  discA(ui.s, KX, KY + 2, kr, T.shade, 0.4 * k);
  ball(ui.s, KX, KY, kr, active ? T.copperL : T.cream);
}
// ------------------------------------------------------------------ clock: a value pill with a clock badge; the day on a square tag
export function hudClock(ui, x, y, info = {}, o = {}) {
  const day = info.day ?? 1;
  let hour = info.time ?? info.hour ?? 12;
  if (typeof hour === 'string') { const [hh, mm] = hour.split(':'); hour = (+hh || 0) + (+mm || 0) / 60; }
  hour = ((hour % 24) + 24) % 24;
  const hh = Math.floor(hour), mm = Math.floor((hour % 1) * 60), tstr = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  const night = hour < 5 || hour >= 19.5, w = R(ui.tw(tstr, { bold: true }) + 34);
  valuePill(ui, x, y, w, night ? 'moon' : 'clock', tstr, { color: night ? T.violet : T.red });
  // the day on a little square level-style tag
  const ds = 'D' + day, dw = R(ui.tw(ds, { mini: true, bold: true }) + 6);
  frame(ui, x + w + 1, y + 1, dw, 13, { thin: true, r: 1, shadowA: 0.3 });
  ui.text(ds, x + w + 1 + dw / 2, y + 5, T.text, { mini: true, bold: true, align: 'center' });
  const wn = { fog: 'fog', storm: 'storm', rain: 'rain', cloud: 'cloud', cloudy: 'cloud' }[info.weather || 'clear'];
  if (wn) drawBig(ui.s, wn, x + w + dw + 3, y + 1, null, {});
  return { w: w + dw + (wn ? 16 : 1), h: 16 };
}
// ------------------------------------------------------------------ money: a coin pill (counts up/down smoothly)
// o: { align: 'right' (x is the right edge), id, symbol }
export function hudMoney(ui, x, y, amount, o = {}) {
  const a = ui.anim('money:' + (o.id || ''), { v: amount, last: amount, pops: [] });
  if (amount !== a.last) { a.pops.push({ d: amount - a.last, t: 0 }); a.last = amount; a.flash = 0.5; }
  a.v += (amount - a.v) * Math.min(1, ui.dt * 9); if (Math.abs(amount - a.v) < 0.5) a.v = amount;
  a.flash = Math.max(0, (a.flash || 0) - ui.dt);
  const str = (o.symbol || '') + fmtNum(a.v), w = R(Math.max(52, ui.tw(str, { bold: true }) + 30));
  const X = o.align === 'right' ? x - w : x;
  valuePill(ui, X, y, w, 'coin', str, { color: T.amber });
  if (((ui.t * 0.7) % 1) < 0.12) sparkle(ui.s, X + 3, y + 2, '#ffffff', 1 - ((ui.t * 0.7) % 1) / 0.12);
  for (const p of a.pops) {
    p.t += ui.dt; const k = p.t / 1.1; if (k >= 1) continue;
    ui.text((p.d > 0 ? '+' : '-') + fmtNum(Math.abs(p.d)), X + w - 4, y + 17 - R(easeOut(k) * 6), p.d > 0 ? T.green : T.red, { align: 'right', mini: true, bold: true, outline: T.ink });
  }
  if (a.pops.length && a.pops[0].t >= 1.1) a.pops = a.pops.filter((p) => p.t < 1.1);
  return w;
}
// ------------------------------------------------------------------ place plate: drops in with a boing, then rises away
// o: { id, hold (seconds; 0 = stays), align ('center'), sub (false hides the subtitle) }
export function hudLocation(ui, x, y, name, sub, o = {}) {
  const a = ui.anim('loc:' + (o.id || ''), { name: null });
  if (a.name !== name) { a.name = name; a.t = 0; }
  a.t += ui.dt;
  if (!name) return 0;
  const hold = o.hold || 0;
  if (hold && a.t > hold + 0.6) return 0;
  const showSub = !!sub && o.sub !== false, upper = String(name).toUpperCase(), nw = ui.tw(upper, { mini: true, bold: true }), sw = showSub ? ui.tw(String(sub).toUpperCase(), { mini: true }) : 0;
  const w = R(Math.max(nw + 34, sw + 20)), h = showSub ? 31 : 21;
  const X0 = R(o.align === 'center' ? x - w / 2 : x);
  const kin = boing(a.t * 1.4), kout = hold ? clamp01((hold + 0.6 - a.t) / 0.6) : 1;
  const sy = R(y + 3 - (1 - kin) * (h + 16) - (1 - easeOut(kout)) * (h + 18));
  frame(ui, X0, sy, w, h, { thin: true, r: 2, shadowA: 0.4 });
  // the raised name plate inside, with diamonds either side
  const py = sy + 4, pw = nw + 24, px = R(X0 + w / 2 - pw / 2);
  frame(ui, px, py, pw, 13, { thin: true, r: 1, shadow: false, fill: T.creamL, edge: T.copperL });
  gem(ui.s, px + 5, py + 6, T.copper, 2); gem(ui.s, px + pw - 6, py + 6, T.copper, 2);
  ui.text(upper, R(X0 + w / 2), py + 4, T.text, { mini: true, bold: true, align: 'center' });
  if (showSub) ui.text(String(sub).toUpperCase(), R(X0 + w / 2), sy + 20, T.dim, { mini: true, align: 'center' });
  if (a.t > 0.4 && a.t < 1.1) sparkle(ui.s, X0 + w - 2, sy, T.amberL, 1 - (a.t - 0.4) / 0.7);
  return w;
}
// ------------------------------------------------------------------ objective: a cream tag with a star badge
export function objective(ui, x, y, str, o = {}) {
  if (!str) return 0;
  const maxW = o.maxW || ui.w - x - 6;
  let t = String(str);
  if (ui.tw(t) + 28 > maxW) { while (t.length > 3 && ui.tw(t + '…') + 28 > maxW) t = t.slice(0, -1); t = t.replace(/\s+$/, '') + '…'; }
  const w = R(ui.tw(t) + 28), h = 15;
  frame(ui, x + 5, y, w - 5, h, { thin: true, r: 2, alpha: o.alpha ?? 1, shadowA: 0.3 });
  badge(ui, x + 6, y + 7, 7, 'star', T.amber);
  ui.text(t, x + 17, y + 4, T.text, {});
  return w;
}
// ------------------------------------------------------------------ round button: a copper ring around a coloured face, with a lip
// (cx, cy) centre, r radius of the face. o: { sel, color (face), hotkey, disabled, modal, tint, badge, tip } → { clicked, over }
export function roundButton(ui, cx, cy, r, icon, o = {}) {
  cx = R(cx); cy = R(cy); r = R(r);
  const g = ui.g, Rr = r + 3, blk = ui.blocked(o);
  const over = Math.hypot(ui.ptr.x - cx, ui.ptr.y - cy) <= Rr + 1 && !o.disabled && !blk, down = over && ui.ptr.down;
  if (over) ui.hot = o.tip || icon;
  const a = ui.anim('rb' + ((cx * 977 + cy * 131 + r) | 0), { bt: 9 });
  a.bt += ui.dt;
  if (over && ui.ptr.pressed) ui.click('ui_tap', { vol: 0.7, pitch: 1 + (6 / Math.max(6, r)) * 0.1 });
  const hk = o.hotkey && ui.key(o.hotkey) && !o.disabled && !blk, clicked = (over && ui.ptr.released) || hk;
  if (clicked) { a.bt = 0; if (hk) ui.click('ui_tap', { vol: 0.7 }); }
  const col = o.disabled ? '#a89a8c' : o.color || T.cream, sq = squash(a.bt, 0.12), dy = down ? 2 : over ? -1 : 0;
  const xf = Math.abs(sq) > 0.01;
  if (xf) ui.push(cx, cy + Rr, 1 + sq, 1 - sq);
  if (o.sel) { const p = ((ui.t * 4) | 0) % 2; ringPx(ui.s, cx, cy + dy, Rr + 3, p ? T.brass : '#fff0a0', 1); ringPx(ui.s, cx, cy + dy, Rr + 4, T.ink, 0.6); }
  // the lip below, then the ring and face
  woodRing(ui.s, cx, cy + 2, r, { th: 3, fill: mx(col, T.ink, 0.45), color: T.copperD });
  woodRing(ui.s, cx, cy + dy, r, { th: 3, fill: over ? mx(col, '#ffffff', 0.2) : col, shadow: false, color: o.sel ? T.brass : T.copper });
  if (!o.disabled) { ui.fill(mx(over ? mx(col, '#ffffff', 0.2) : col, '#ffffff', 0.45)); g.fillRect(cx - R(r * 0.5), cy + dy - r + 1, R(r * 0.6), 1); g.fillRect(cx - r + 1, cy + dy - R(r * 0.4), 1, R(r * 0.5)); }
  const box = r >= 9 ? 16 : 12;
  drawBig(ui.s, icon, cx - box / 2, cy + dy - box / 2, o.tint || null, { scale: box / 12, shadow: true, dim: o.disabled ? 0.5 : 0 });
  if (xf) ui.pop();
  if (o.sel) { const k = (ui.t * 0.9) % 1; sparkle(ui.s, cx + Math.cos(k * 6.28) * (Rr + 3), cy + Math.sin(k * 6.28) * (Rr + 3), T.amberL, 1 - k); }
  if (o.badge) { const bx = cx + r, by = cy - r; ball(ui.s, bx, by, 4, T.berry); ui.text(String(o.badge), bx + 1, by - 2, '#ffffff', { mini: true, align: 'center', bold: true }); }
  if (clicked) ui.ptr.released = false;
  return { clicked, over };
}
// square-footprint icon button (kept API): a round button filling the square
export function iconButton(ui, x, y, size, icon, o = {}) { const r = Math.max(5, R(size / 2) - 3); return roundButton(ui, x + size / 2, y + size / 2, r, icon, o).clicked; }
// ------------------------------------------------------------------ an icon on a wooden plinth (the HUD's icon row, the TokoPhone apps)
// (cx, y): the icon's top centre. o: { size (icon box, default 16), sel, hotkey, modal, tip, badge, label } → { clicked, over }
export function plinthButton(ui, cx, y, icon, o = {}) {
  cx = R(cx); y = R(y);
  const size = o.size || 16, w = size + 12, blk = ui.blocked(o), x0 = cx - w / 2;
  const over = ui.inside(x0, y - 2, w, size + 12) && !blk && !o.disabled, down = over && ui.ptr.down;
  const a = ui.anim('pb' + ((cx * 977 + y * 131 + size) | 0), { bt: 9, hov: 0 });
  a.bt += ui.dt; a.hov += ((over || o.sel ? 1 : 0) - a.hov) * Math.min(1, ui.dt * 14);
  if (over && ui.ptr.pressed) ui.click('ui_tap', { vol: 0.7 });
  const hk = o.hotkey && ui.key(o.hotkey) && !blk, clicked = (over && ui.ptr.released) || hk;
  if (clicked) { a.bt = 0; if (hk) ui.click('ui_tap', { vol: 0.7 }); }
  plinth(ui, cx, y + size - 2, w + (o.sel ? 2 : 0));
  const lift = down ? 1 : -R(a.hov * 2), sq = squash(a.bt, 0.16), g = ui.g, xf = Math.abs(sq) > 0.01;
  if (xf) ui.push(cx, y + size, 1 + sq, 1 - sq);
  if (o.sel) { ui.g.globalAlpha = 0.5 + Math.sin(ui.t * 5) * 0.2; fillShape(ui, cx - size / 2 - 2, y - 2 + lift, size + 4, size + 4, '#fff0a0', 3); ui.g.globalAlpha = 1; }
  drawBig(ui.s, icon, cx - size / 2, y + lift, null, { scale: size / 12 });
  if (xf) ui.pop();
  if (over && ((ui.t * 1.3) % 1) < 0.3) sparkle(ui.s, cx + size / 2 - 1, y + lift, T.amberL, 1 - ((ui.t * 1.3) % 1) / 0.3);
  if (o.badge) { ball(ui.s, cx + size / 2 + 1, y + lift, 4, T.berry); ui.text(String(o.badge), cx + size / 2 + 2, y + lift - 2, '#ffffff', { mini: true, align: 'center', bold: true }); }
  if (o.label && (over || o.sel)) { const lw = R(ui.tw(o.label, { mini: true, bold: true }) + 10); frame(ui, cx - lw / 2, y + size + 8, lw, 11, { thin: true, r: 1, fill: T.ink, edge: T.copperD, shadow: false }); ui.text(o.label, cx, y + size + 11, T.cream, { mini: true, bold: true, align: 'center' }); }
  if (clicked) ui.ptr.released = false;
  return { clicked, over };
}
// ------------------------------------------------------------------ party: one copper medal per Tokonmon with a tiny HP bar
// party: [{ name, hp, maxHp, color, level, fainted?, icon? }]; o: { maxW, id }
export function partyBar(ui, x, y, party = [], o = {}) {
  const n = party.length, maxW = o.maxW || ui.w - x - 4;
  if (!n) return { w: 0, h: 0 };
  let cx = x; const H = 32;
  for (let i = 0; i < n; i++) {
    const m = party[i], col = m.color || T.cyan, hpv = m.maxHp ? clamp01(m.hp / m.maxHp) : clamp01(m.hp ?? 1), dead = m.fainted || hpv <= 0;
    const lead = i === 0, r = lead ? 9 : 7, Rr = r + 3, bw = 2 * Rr + 1;
    if (cx + bw - x > maxW) break;
    const ccx = cx + Rr, ccy = y + (lead ? Rr : Rr + 3), ec = dead ? '#8a7e74' : col;
    woodRing(ui.s, ccx, ccy, r, { th: 3, fill: ec, color: !dead && hpv <= 0.25 && ((ui.t * 3) | 0) % 2 ? T.red : T.copper });
    if (m.icon) drawBig(ui.s, m.icon, ccx - 6, ccy - 6, null, { shadow: false });
    else ui.text((m.name || '?')[0].toUpperCase(), ccx + 1, ccy - 3, '#ffffff', { align: 'center', bold: true, outline: T.ink });
    if (dead) drawSmall(ui.s, 'cross', ccx - 3, ccy - 3, T.red, T.ink);
    ui.bar(cx + 3, y + H - 4, bw - 6, 3, hpv, { id: (o.id || 'party') + i, shine: false });
    cx += bw + 3;
  }
  return { w: cx - 3 - x, h: H };
}
// ------------------------------------------------------------------ the round radar in a copper ring, with an "N" bead
// draw(ui, x, y, w, h) paints the map (clipped to the disc). o: { north (radians), label, player, heading }
export function minimap(ui, x, y, w, h, draw, o = {}) {
  const d = Math.min(w, h), Rr = R(d / 2) - 4, cx = R(x + w / 2), cy = R(y + h / 2);
  woodRing(ui.s, cx, cy, Rr, { th: 4, fill: '#2a3a2e' });
  clipCircle(ui, cx, cy, Rr, () => {
    if (draw) draw(ui, cx - Rr, cy - Rr, 2 * Rr + 1, 2 * Rr + 1);
    // radar rings + a sweep of dots
    ui.g.globalAlpha = 0.35; ui.s.ring(cx, cy, Rr * 0.5, Rr * 0.5, '#a8f0b0'); ui.g.globalAlpha = 1;
    const sw = (ui.t * 1.4) % (Math.PI * 2);
    for (let k = 0; k < 4; k++) { ui.g.globalAlpha = 0.3 - k * 0.06; for (let rr = 2; rr < Rr; rr += 2) ui.px(cx + Math.cos(sw - k * 0.08) * rr, cy + Math.sin(sw - k * 0.08) * rr, '#a8f0b0'); }
    ui.g.globalAlpha = 1;
  });
  if (o.player) { tri(ui.s, cx - 2, cy - 3, 'up', 2, T.red); }
  const nr = o.north || 0, bx = R(cx + Math.sin(nr) * (Rr + 2)), by = R(cy - Math.cos(nr) * (Rr + 2));
  ball(ui.s, bx, by, 5, T.red);
  ui.text('N', bx + 1, by - 2, '#ffffff', { mini: true, bold: true, align: 'center' });
  if (o.label) { const lw = R(ui.tw(o.label, { mini: true, bold: true }) + 10), lx = cx - R(lw / 2), ly = cy + Rr + 2; frame(ui, lx, ly, lw, 11, { thin: true, r: 1, shadow: false }); ui.text(o.label.toUpperCase(), lx + 5, ly + 3, T.text, { mini: true, bold: true }); }
}
// ------------------------------------------------------------------ images (3D renders, portraits)
const imgCache = new WeakMap();
export function toCanvas(src) {
  if (!src || typeof src !== 'object') return null;
  if (src.getContext || (typeof ImageBitmap !== 'undefined' && src instanceof ImageBitmap) || (typeof HTMLImageElement !== 'undefined' && src instanceof HTMLImageElement)) return src;
  let c = imgCache.get(src);
  if (c) return c;
  if (src.data && src.width && !(src.data instanceof Uint32Array)) c = pixelCanvas(src.width, src.height, (d) => d.set(new Uint32Array(src.data.buffer, src.data.byteOffset, src.width * src.height)));
  else if (src.data instanceof Uint32Array && src.w) c = pixelCanvas(src.w, src.h, (d) => d.set(src.data));
  if (c) imgCache.set(src, c);
  return c;
}
export function drawImage(ui, src, x, y, w, h, o = {}) {
  const c = toCanvas(src); if (!c) return;
  const g = ui.g; g.imageSmoothingEnabled = o.smooth ?? ((c.width || 0) > w * 1.5);
  if (o.alpha != null) g.globalAlpha = o.alpha;
  g.drawImage(c, R(x), R(y), R(w), R(h));
  g.globalAlpha = 1; g.imageSmoothingEnabled = false;
}
void rgba; void fillDisc; void blit; void knob;
