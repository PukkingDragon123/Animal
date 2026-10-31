// Roaming-HUD and world widgets: keycaps, the icon prompt bubble, the touch
// thumbstick, the sun/moon dial, the coin purse, the hanging place sign, the
// objective tag, round icon buttons, party beads and the round minimap. Each
// takes the PixelUI as its first argument. Icons and numbers first; words only
// where an icon can't say it (and then on hover or briefly).
import { P } from '../../surface.js';
import { bayer } from '../../color.js';
import { T, mx, hash, clamp01, easeOut, easeOutBack } from './theme.js';
import { frame, dropShadow, gradFill, blendRun, ball, ringPx, discA, disc, tri, sparkle, woodRing, clipCircle, sprig, rope, leaf } from './frame.js';
import { drawBig, drawSmall } from './icons.js';

export const fmtNum = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ------------------------------------------------------------------ keycap: a little birch-wood key block
// returns its width. o: { pressed, color (side tint), mini, small (a 10 px bead-sized key) }
export function keycap(ui, x, y, label, o = {}) {
  x = Math.round(x); y = Math.round(y);
  const s = ui.s, lab = String(label ?? ''), small = !!o.small, mini = small || o.mini || lab.length > 3;
  const lw = ui.tw(lab, { mini }), w = Math.max(small ? 9 : 11, lw + (small ? 4 : 6)), h = small ? 10 : 13, dy = o.pressed ? 1 : 0, fhh = small ? 7 : 9;
  const side = o.color ? mx(T.keySide, o.color, 0.4) : T.keySide;
  dropShadow(s, x, y, w, h, 2, 0, 1, 0.35);
  ui.rrect(x, y, w, h, T.ink, 2);
  ui.rrect(x + 1, y + 1, w - 2, h - 2, side, 1);
  s.hline(x + 2, x + w - 3, y + h - 2, mx(side, T.woodDD, 0.4));
  const fy = y + 1 + dy;
  ui.rrect(x + 1, fy, w - 2, fhh, T.keyD, 1);
  gradFill(s, x + 2, fy, w - 4, fhh - 1, ['#ffffff', T.key, T.keyD], 0);
  s.hline(x + 2, x + w - 3, fy, '#ffffff');
  ui.text(lab, x + Math.round(w / 2), fy + (mini ? (small ? 1 : 2) : 1), T.paperText, { align: 'center', mini });
  return w;
}

// ------------------------------------------------------------------ prompt bubble shown above things in the world
// An icon in a parchment speech bubble (talk → speech bubble, doors → door, anything else → a hand or the
// thing's own icon) with the key glyph on its corner. The words appear only on hover, or briefly the first
// time a prompt is seen. (x, y) is the tip of the tail. Returns true when tapped.
// o: { icon, color (rim accent), bob (false = still), alpha, label ('always' | 'never') }
const DOOR_RE = /\b(door|enter|exit|leave|go (in|out|inside|outside|home|up|down)|upstairs|downstairs|stairs|gate)\b/i;
const TALK_RE = /\b(talk|chat|ask|greet|speak|say)\b/i;
export function promptIcon(label, icon) {
  if (icon && icon !== 'star') return icon;
  if (TALK_RE.test(label)) return 'talk';
  if (DOOR_RE.test(label)) return 'door';
  return icon || 'hand';
}
export function prompt(ui, x, y, keyLabel, str, o = {}) {
  x = Math.round(x); y = Math.round(y);
  const s = ui.s, acc = o.color || T.leaf, label = String(str ?? '');
  const a = ui.anim('prompt:' + keyLabel + ':' + label, {}); a.t += ui.dt;
  const seen = ui._promptSeen || (ui._promptSeen = new Map());
  if (!seen.has(label)) seen.set(label, ui.t);
  const firstShow = ui.t - seen.get(label) < 1.8;
  const icon = promptIcon(label, o.icon);
  const bw = 24, bh = 21;
  const bob = o.bob === false ? 0 : Math.round(Math.sin(ui.t * 3.2) * 1);
  const pop = easeOutBack(a.t * 5);
  const bx = Math.round(x - bw / 2), by0 = y - 5 - bh;
  const over = !ui.blocked(o) && ui.inside(bx - 3, by0 - 3, bw + 6, bh + 9);
  const lift = over ? -1 : 0, by = by0 + bob + lift + Math.round((1 - pop) * 6);
  if (pop < 0.35) { ball(s, x, y - 10, Math.max(1, Math.round(pop * 16)), T.paper); return false; }
  // bubble + tail
  const fill = T.paper;
  frame(ui, bx, by, bw, bh, { paper: fill, r: 7, thin: true, fill: T.wood, edge: over ? acc : T.wood, edgeL: over ? mx(acc, '#ffffff', 0.5) : T.woodL, rivets: false, alpha: o.alpha ?? 1, shadowA: 0.3 });
  const tx = x, ty = by + bh - 2, K = P(T.ink), F = P(fill), F2 = P(T.paperD);
  for (let j = 0; j <= 3; j++) { const hw = 3 - j; for (let i = -hw - 1; i <= hw + 1; i++) s.px(tx + i, ty + j, Math.abs(i) === hw + 1 ? K : j === 0 && Math.abs(i) <= hw ? F : j > 1 ? F2 : F); }
  s.px(tx, ty + 4, K);
  drawBig(s, icon, bx + 6, by + 4, null, { shadow: false });
  // key glyph on the corner
  if (keyLabel) keycap(ui, bx + bw - 6, by + bh - 7, keyLabel, { small: true, pressed: over && ui.ptr.down });
  if (a.t < 0.45) sparkle(s, bx + 2, by + 1, T.amberL, 1 - a.t / 0.45);
  // the words: on hover, or briefly the first time this prompt shows
  const showLabel = o.label === 'always' || (o.label !== 'never' && (over || firstShow));
  a.lk = clamp01((a.lk || 0) + (showLabel ? 1 : -1) * ui.dt * 7);
  if (a.lk > 0.02 && label) {
    const lw = ui.tw(label) + 10, lx = Math.round(x - lw / 2), ly = by - 15 + Math.round((1 - easeOut(a.lk)) * 4);
    ui.clip(lx - 2, ly - 2, Math.round((lw + 4) * Math.min(1, a.lk * 1.4)) + 0, 18, () => {
      frame(ui, lx, ly, lw, 13, { thin: true, r: 4, fill: T.wood, seams: false, rivets: false, shadowA: 0.3 });
      ui.text(label, lx + 5, ly + 3, T.text, { shadow: T.woodDD });
    });
  }
  const tapped = over && ui.ptr.released;
  if (tapped) ui.ptr.released = false;
  return tapped;
}

// ------------------------------------------------------------------ virtual thumbstick: a wooden ring with a birch knob
// dx, dy: knob offset as a fraction of r (−1..1). o: { color, ghost (a faint resting hint: rim and arrows only) }
export function joystick(ui, cx, cy, r, dx = 0, dy = 0, active = false, o = {}) {
  cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
  const s = ui.s, k = active ? 1 : o.ghost ? 0.34 : 0.62, acc = o.color || T.leaf;
  discA(s, cx, cy, r, T.woodDD, 0.32 * k);
  discA(s, cx, cy, Math.round(r * 0.6), T.paper, 0.1 * k);
  ringPx(s, cx, cy, r + 2, T.ink, 0.7 * k);
  // the wooden rim: lit on top, shaded below
  for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) {
    const d = Math.hypot(i, j); if (d > r + 1.5 || d <= r - 0.5) continue;
    const l = (-i * 0.5 - j) / Math.max(1, d);
    blendRun(s, cx + i, cx + i, cy + j, l > 0.4 ? T.woodL : l < -0.3 ? T.woodD : T.wood, 0.85 * k);
  }
  ringPx(s, cx, cy, r - 1, T.ink, 0.45 * k);
  let m = Math.hypot(dx, dy); let nx = dx, ny = dy; if (m > 1) { nx /= m; ny /= m; m = 1; }
  // direction arrows; the one we're pushing toward lights up
  const dirs = [['up', 0, -1], ['right', 1, 0], ['down', 0, 1], ['left', -1, 0]];
  for (const [d, ux, uy] of dirs) {
    const on = active && m > 0.3 && nx * ux + ny * uy > 0.7;
    const px0 = cx + ux * (r - 6), py0 = cy + uy * (r - 6);
    const c = on ? acc : o.ghost ? mx(T.paper, T.wood, 0.4) : T.paper;
    if (d === 'up') tri(s, px0 - 2, py0 - 1, 'up', 2, c); else if (d === 'down') tri(s, px0 - 2, py0 - 1, 'down', 2, c);
    else if (d === 'left') tri(s, px0 - 1, py0 - 2, 'left', 2, c); else tri(s, px0 - 1, py0 - 2, 'right', 2, c);
  }
  if (o.ghost) return;
  const kr = Math.max(5, Math.round(r * 0.42));
  const KX = Math.round(cx + nx * (r - kr * 0.6)), KY = Math.round(cy + ny * (r - kr * 0.6));
  discA(s, KX, KY + 2, kr, T.shade, 0.45 * k);
  const kc = active ? mx(T.woodL, acc, 0.35) : T.woodL;
  ball(s, KX, KY, kr, kc);
  ringPx(s, KX, KY, kr - 3, mx(kc, T.woodDD, 0.3));
  ball(s, KX, KY, Math.max(1, kr - 4), mx(kc, T.hi, 0.25), {});
  if (active) leaf(s, KX - 2, KY + 1, -0.8, 4, 1.5, T.leaf);
}

// ------------------------------------------------------------------ clock: a sun/moon dial in a wooden ring + the time in numbers
// info: { day, time (hour number or 'HH:MM'), weather ('clear'|'fog'|'storm'|'rain'|'cloud'), weekday }
export function hudClock(ui, x, y, info = {}, o = {}) {
  x = Math.round(x); y = Math.round(y);
  const s = ui.s, day = info.day ?? 1;
  let hour = info.time ?? info.hour ?? 12;
  if (typeof hour === 'string') { const [hh, mm] = hour.split(':'); hour = (+hh || 0) + (+mm || 0) / 60; }
  hour = ((hour % 24) + 24) % 24;
  const hh = Math.floor(hour), mm = Math.floor((hour % 1) * 60);
  const tstr = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  const R = 11, dcx = x + 14, dcy = y + 14;
  // the time on a parchment pill tucked behind the dial
  const tw = ui.tw(tstr, { bold: true }), pw = tw + 23, px0 = x + 18;
  frame(ui, px0, y + 7, pw, 15, { paper: true, r: 7, thin: true, fill: T.wood, rivets: false, alpha: o.alpha ?? 1, shadowA: 0.3 });
  ui.text(tstr, px0 + 14, y + 11, T.paperText, { bold: true });
  // dial: sky by hour, sun / moon riding an arc over little green hills
  const night = hour < 5 || hour >= 19.5, dawn = hour >= 5 && hour < 7.5, dusk = hour >= 17 && hour < 19.5;
  const sky = night ? ['#1f3050', '#34507a'] : dawn ? ['#8ab8e0', '#ffc09a'] : dusk ? ['#e08a5a', '#ffcf8a'] : ['#5ab8e8', '#b8ecf8'];
  woodRing(s, dcx, dcy, R, { th: 3 });
  for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
    const d = Math.hypot(i, j); if (d > R - 0.5) continue;
    const t = (j + R) / (2 * R);
    let c = bayer(dcx + i, dcy + j) < t ? sky[1] : sky[0];
    const hill = 3 + Math.round(Math.sin((i + 2) * 0.45) * 1.2);
    if (j >= hill) c = j === hill ? (night ? '#4a6a4a' : T.leaf) : bayer(i, j) < 0.5 ? (night ? '#2a4030' : T.moss) : (night ? '#24382a' : T.mossD);
    s.px(dcx + i, dcy + j, c);
  }
  const isDay = !night, prog = isDay ? clamp01((hour - 5) / 14.5) : clamp01(((hour + 24 - 19.5) % 24) / 9.5);
  const ang = Math.PI + prog * Math.PI, bx = Math.round(dcx + Math.cos(ang) * (R - 4)), by = Math.round(dcy + 2 + Math.sin(ang) * (R - 4));
  if (isDay) { ball(s, bx, by, 2, '#ffd75a', { ink: '#c0702a' }); s.px(bx - 1, by - 1, '#ffffff'); if (((ui.t * 2) | 0) % 2) { s.px(bx, by - 4, '#ffe9a0'); s.px(bx - 4, by, '#ffe9a0'); s.px(bx + 4, by, '#ffe9a0'); } }
  else { ball(s, bx, by, 2, '#fff0c0', { ink: '#6a7aa0' }); s.px(bx + 1, by - 1, sky[0]); s.px(bx + 1, by, sky[0]); s.px(dcx - 5, dcy - 6, '#ffffff'); s.px(dcx + 4, dcy - 4, '#d8e4ff'); }
  // weather badge on the ring (only when it isn't plain clear sky)
  const wn = { fog: 'fog', storm: 'storm', rain: 'rain', cloud: 'cloud', cloudy: 'cloud' }[info.weather || 'clear'];
  if (wn) { ball(s, dcx + 10, dcy - 10, 5, T.paper); drawSmall(s, wn, dcx + 7, dcy - 13, '#7a8aa8', null); }
  // day number on a little wooden bead
  const ds = String(day), dw = Math.max(9, ui.tw(ds, { mini: true }) + 5);
  frame(ui, dcx - 3 - (dw >> 1), dcy + 9, dw, 9, { thin: true, r: 3, fill: T.woodL, rivets: false, shadow: false, seams: false });
  ui.text(ds, dcx - 3, dcy + 11, T.text, { mini: true, align: 'center', shadow: T.woodDD });
  return { w: px0 + pw - x, h: 30 };
}

// ------------------------------------------------------------------ money: a coin + the number (counts up/down smoothly)
// o: { align: 'right' (x is the right edge), id, symbol }
export function hudMoney(ui, x, y, amount, o = {}) {
  x = Math.round(x); y = Math.round(y);
  const s = ui.s, a = ui.anim('money:' + (o.id || ''), { v: amount, last: amount, pops: [] });
  if (amount !== a.last) { a.pops.push({ d: amount - a.last, t: 0 }); a.last = amount; a.flash = 0.5; }
  a.v += (amount - a.v) * Math.min(1, ui.dt * 9); if (Math.abs(amount - a.v) < 0.5) a.v = amount;
  a.flash = Math.max(0, (a.flash || 0) - ui.dt);
  const str = (o.symbol || '') + fmtNum(a.v), tw = ui.tw(str, { bold: true }), w = tw + 26, h = 15;
  if (o.align === 'right') x -= w;
  frame(ui, x + 5, y, w - 5, h, { paper: true, r: 7, thin: true, fill: T.wood, rivets: false, shadowA: 0.3 });
  drawBig(s, 'coin', x - 1, y + 1, null, {});
  if (((ui.t * 0.7) % 1) < 0.12) sparkle(s, x + 3, y + 3, T.amberL, 1 - ((ui.t * 0.7) % 1) / 0.12);
  ui.text(str, x + 16, y + 4, a.flash > 0 ? T.amber2 : T.paperText, { bold: true });
  for (const p of a.pops) {
    p.t += ui.dt; const k = p.t / 1.1; if (k >= 1) continue;
    const ps = (p.d > 0 ? '+' : '-') + fmtNum(Math.abs(p.d));
    if (k < 0.75 || ((ui.t * 16) | 0) % 2) ui.text(ps, x + w - 2, y + h + 2 - Math.round(easeOut(k) * 6), p.d > 0 ? T.green : T.red, { align: 'right', mini: true, outline: T.ink });
  }
  a.pops = a.pops.filter((p) => p.t < 1.1);
  return w;
}

// ------------------------------------------------------------------ place sign: a wooden plank hanging on two ropes
// It drops in and swings when the name changes, then (with o.hold) rises away after hold seconds.
// o: { id, hold (seconds shown; 0 = stays), align ('center': x is the centre), sub (true: show the subtitle) }
export function hudLocation(ui, x, y, name, sub, o = {}) {
  x = Math.round(x); y = Math.round(y);
  const s = ui.s, a = ui.anim('loc:' + (o.id || ''), { name: null });
  if (a.name !== name) { a.name = name; a.t = 0; }
  a.t += ui.dt;
  if (!name) return 0;
  const hold = o.hold || 0;
  if (hold && a.t > hold + 0.6) return 0;
  const nw = ui.tw(name, { bold: true }), showSub = o.sub === true && sub, sw = showSub ? ui.tw(sub, { mini: true }) : 0;
  const w = Math.max(nw, sw) + 30, h = showSub ? 24 : 18;
  const X0 = o.align === 'center' ? Math.round(x - w / 2) : x;
  const kin = easeOutBack(a.t / 0.6), kout = hold ? clamp01((hold + 0.6 - a.t) / 0.6) : 1;
  const drop = 14, top = y - 4, sy = Math.round(y + drop - (1 - kin) * (drop + h + 10) - (1 - easeOut(kout)) * (drop + h + 12));
  const swing = Math.sin(a.t * 5) * 3 * Math.exp(-a.t * 1.6), X = X0 + Math.round(swing);
  // ropes from the top edge to the sign's shoulders
  if (sy > top) { rope(s, X0 + 8, top, X + 8, sy + 2); rope(s, X0 + w - 10, top, X + w - 10, sy + 2); }
  frame(ui, X, sy, w, h, { thin: true, r: 4, fill: T.woodL, edge: T.wood, edgeL: mx(T.woodL, T.hi, 0.5), seams: false, rivets: false, shadowA: 0.35 });
  // rope knots / nails
  for (const nx of [X + 8, X + w - 10]) { s.px(nx, sy + 3, T.rope); s.px(nx + 1, sy + 3, T.ropeD); s.px(nx, sy + 4, T.ropeD); s.px(nx + 1, sy + 4, T.ink); }
  drawSmall(s, 'pin', X + 6, sy + Math.round((h - 7) / 2), T.coral, T.woodDD);
  ui.text(name, X + 17, sy + (showSub ? 4 : 6), T.text, { bold: true, shadow: T.woodDD });
  if (showSub) ui.text(sub.toUpperCase(), X + 18, sy + 14, T.paper, { mini: true });
  sprig(s, X + w - 3, sy + h - 3, -1, ui.t, { n: 2, len: 7, down: true });
  if (a.t > 0.5 && a.t < 1.1) sparkle(s, X + w - 4, sy + 1, T.amberL, 1 - (a.t - 0.5) / 0.6);
  return w;
}

// ------------------------------------------------------------------ objective: a parchment tag with a flag
export function objective(ui, x, y, str, o = {}) {
  if (!str) return 0;
  x = Math.round(x); y = Math.round(y);
  const s = ui.s, maxW = o.maxW || ui.w - x - 6;
  let t = String(str); while (t.length > 3 && ui.tw(t) + 26 > maxW) t = t.slice(0, -2);
  if (t !== String(str)) t = t.replace(/\s*\S?$/, '') + '…';
  const w = ui.tw(t) + 26, h = 15;
  frame(ui, x, y, w, h, { paper: true, r: 4, thin: true, fill: T.wood, rivets: false, alpha: o.alpha ?? 0.96, shadowA: 0.3 });
  drawSmall(s, 'star', x + 5, y + 4, T.amber, mx(T.amber, T.ink, 0.6));
  ui.text(t, x + 17, y + 4, T.paperText, {});
  return w;
}

// ------------------------------------------------------------------ round wooden icon button (pause menu, HUD)
// (cx, cy) centre, r inner radius. o: { sel, color (accent when selected/hovered), hotkey, disabled, modal, tint, badge }
// returns { clicked, over }
export function roundButton(ui, cx, cy, r, icon, o = {}) {
  cx = Math.round(cx); cy = Math.round(cy);
  const s = ui.s, R = r + 3;
  const over = ui.inside(cx - R, cy - R, 2 * R + 1, 2 * R + 1) && !o.disabled && !ui.blocked(o), down = over && ui.ptr.down;
  if (over) ui.hot = o.tip || icon;
  const acc = o.color || T.leaf, lift = (o.sel ? -2 : 0) + (down ? 1 : 0);
  const face = o.disabled ? '#8a7a68' : o.sel ? mx(T.woodL, acc, 0.35) : over ? mx(T.woodL, T.hi, 0.25) : T.woodL;
  discA(s, cx, cy + 2, R, T.shade, 0.35);
  if (o.sel) { ringPx(s, cx, cy + lift, R + 2, acc, 0.55 + Math.sin(ui.t * 4) * 0.2); ringPx(s, cx, cy + lift, R + 1, mx(acc, '#ffffff', 0.4), 0.8); }
  woodRing(s, cx, cy + lift, r, { th: 3, fill: face, shadow: false, color: o.sel ? mx(T.wood, acc, 0.4) : T.wood });
  // soft top glint on the face
  for (let i = -r + 3; i <= r - 3; i++) { const yy = cy + lift - r + 2 + Math.round((i * i) / (r * 2)); if (Math.abs(i) < r - 2) s.blend(cx + i, yy, '#ffffff', 0.25); }
  const sc = r >= 13 ? 2 : 1;
  drawBig(s, icon, cx - 6 * sc, cy + lift - 6 * sc + (down ? 1 : 0), o.tint || null, { scale: sc, shadow: false, dim: o.disabled ? 0.5 : 0 });
  if (o.sel) { const k = (ui.t * 0.9) % 1; sparkle(s, Math.round(cx + Math.cos(k * 6.28) * (R + 1)), Math.round(cy + lift + Math.sin(k * 6.28) * (R + 1)), T.amberL, 1 - k); }
  if (o.badge) { const bx = cx + r, by = cy - r; ball(s, bx, by, 4, T.berry); ui.text(String(o.badge), bx + 1, by - 2, '#ffffff', { mini: true, align: 'center' }); }
  const clicked = (over && ui.ptr.released) || (o.hotkey && ui.key(o.hotkey) && !o.disabled && !ui.blocked(o));
  if (clicked) ui.ptr.released = false;
  return { clicked, over };
}
// square-footprint icon button (kept API): now a round wooden button filling the square
export function iconButton(ui, x, y, size, icon, o = {}) {
  const r = Math.max(5, Math.round(size / 2) - 3);
  return roundButton(ui, x + size / 2, y + size / 2, r, icon, o).clicked;
}

// ------------------------------------------------------------------ party: one wooden bead per Tokonmon with a tiny HP bar
// party: [{ name, hp, maxHp, color, level, fainted? }]; o: { maxW, id }
export function partyBar(ui, x, y, party = [], o = {}) {
  x = Math.round(x); y = Math.round(y);
  const s = ui.s, n = party.length, maxW = o.maxW || ui.w - x - 4;
  if (!n) return { w: 0, h: 0 };
  let cx = x; const H = 32;
  for (let i = 0; i < n; i++) {
    const m = party[i], col = m.color || T.cyan, hpv = m.maxHp ? clamp01(m.hp / m.maxHp) : clamp01(m.hp ?? 1), dead = m.fainted || hpv <= 0;
    const lead = i === 0, r = lead ? 9 : 7, R = r + 3, bw = 2 * R + 1;
    if (cx + bw - x > maxW) break;
    const low = !dead && hpv <= 0.25 && ((ui.t * 3) | 0) % 2;
    const ccx = cx + R, ccy = y + (lead ? R : R + 2);
    const ec = dead ? '#8a7a6a' : col;
    woodRing(s, ccx, ccy, r, { th: 3, fill: ec, color: low ? mx(T.wood, T.red, 0.6) : T.wood });
    ball(s, ccx, ccy, r - 1, ec, { ink: mx(ec, T.ink, 0.5) });
    ui.text((m.name || '?')[0].toUpperCase(), ccx + 1, ccy - 3, '#ffffff', { align: 'center', bold: lead, outline: mx(ec, T.ink, 0.65) });
    if (dead) drawSmall(s, 'cross', ccx - 3, ccy - 3, T.red, T.ink);
    ui.bar(cx + 2, y + H - 5, bw - 4, 3, hpv, { id: (o.id || 'party') + i, shine: false, seg: 0 });
    if (lead) { sprig(s, ccx + R - 2, ccy - R + 1, 1, ui.t, { n: 2, len: 6 }); }
    cx += bw + 4;
  }
  return { w: cx - 4 - x, h: H };
}

// ------------------------------------------------------------------ round minimap in a wooden ring, with a compass needle
// draw(ui, x, y, w, h) paints the map (clipped to the disc). The disc is centred in (x, y, w, h).
// o: { north (radians, 0 = up), label, player (draw a centre arrow), heading }
export function minimap(ui, x, y, w, h, draw, o = {}) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const s = ui.s, d = Math.min(w, h), R = (d >> 1) - 3, cx = x + (w >> 1), cy = y + (h >> 1);
  const ix = cx - R, iy = cy - R, iw = 2 * R + 1;
  woodRing(s, cx, cy, R, { th: 3, fill: '#4a6a3a' });
  clipCircle(ui, cx, cy, R, () => {
    if (draw) draw(ui, ix, iy, iw, iw);
    // a soft inner vignette
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { const e = R - Math.hypot(i, j); if (e < 2.5 && e >= 0 && bayer(cx + i, cy + j) < (e < 1 ? 0.55 : 0.25)) ui.s.px(cx + i, cy + j, '#2a1a0e'); }
  });
  for (let q = 0; q < 5; q++) blendRun(s, cx - R + 4 + q, cx - R + 5 + q, cy - R + 7 - q, '#ffffff', 0.3);
  if (o.player) {
    const ax = cx, ay = cy, hd = o.heading || 0;
    for (let t = -2; t <= 3; t++) s.px(Math.round(ax + Math.sin(hd) * t), Math.round(ay - Math.cos(hd) * t), t > 1 ? '#ffffff' : T.berry);
    if (((ui.t * 2) | 0) % 2) ringPx(s, ax, ay, 3, T.berry, 0.5);
  }
  // compass: a red needle tip riding the ring toward north, on a little brass bead
  const nr = o.north || 0, ux = Math.sin(nr), uy = -Math.cos(nr);
  const bx = Math.round(cx + ux * (R + 1)), by = Math.round(cy + uy * (R + 1));
  ball(s, bx, by, 3, T.brass);
  for (let t = 0; t <= 3; t++) { const px0 = Math.round(bx + ux * (2 + t)), py0 = Math.round(by + uy * (2 + t)); const wd = 2 - Math.floor(t * 0.7); for (let q = -wd; q <= wd; q++) s.px(Math.round(px0 - uy * q), Math.round(py0 + ux * q), t === 3 ? T.ink : T.berry); }
  sprig(s, cx - R - 2, cy - R + 4, 1, ui.t + 2, { n: 3, len: 10 });
  if (o.label) {
    const lw = ui.tw(o.label, { mini: true }) + 10, lx = cx - (lw >> 1), ly = cy + R + 1;
    frame(ui, lx, ly, lw, 10, { thin: true, r: 3, fill: T.woodL, rivets: false, shadow: false, seams: false });
    ui.text(o.label.toUpperCase(), lx + 5, ly + 3, T.text, { mini: true, shadow: T.woodDD });
  }
}
void hash; void disc;
