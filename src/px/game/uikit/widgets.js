// Roaming-HUD and world widgets in the TokoPhone style: keycaps, the round prompt bubble, the touch
// thumbstick, the clock pill with its sky dial, the coin pill, the dropping place ribbon, the objective
// tag, candy round buttons, party medals and the round radar minimap. Each takes the PixelUI first.
// Icons and numbers first; words only where an icon can't say it (and then on hover or briefly).
import { T, mx, clamp01, easeOut, easeOutBack, boing } from './theme.js';
import { css, rgba, rr, circle, vgrad, pixelCanvas } from './gfx.js';
import { frame, tri, sparkle, ball, woodRing, clipCircle, discA, ringPx } from './frame.js';
import { drawBig, drawSmall } from './icons.js';

export const fmtNum = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ------------------------------------------------------------------ keycap: a little white key with a lip
// returns its width. o: { pressed, color (side tint), mini, small (a 10-unit bead-sized key) }
export function keycap(ui, x, y, label, o = {}) {
  const g = ui.g, lab = String(label ?? ''), small = !!o.small, mini = small || o.mini || lab.length > 3;
  const lw = ui.tw(lab, { mini, bold: true }), w = Math.max(small ? 9 : 11, lw + (small ? 4.5 : 6)), h = small ? 10 : 13, dy = o.pressed ? 1 : 0, fh = h - 2;
  ui.fill(T.ink); rr(g, x, y, w, h, 3); g.fill();
  ui.fill(o.color ? mx(T.keySide, o.color, 0.4) : T.keySide); rr(g, x + 0.9, y + 0.9, w - 1.8, h - 1.8, 2.4); g.fill();
  g.fillStyle = vgrad(g, y + dy, y + dy + fh, ['#ffffff', T.key, T.keyD]); ui._fs = null; rr(g, x + 0.9, y + 0.9 + dy, w - 1.8, fh - 1.4, 2.4); g.fill();
  ui.text(lab, x + w / 2, y + dy + (fh - (mini ? 5 : 7)) / 2 + 0.3, T.paperText, { align: 'center', mini, bold: true });
  return w;
}

// ------------------------------------------------------------------ prompt bubble shown above things in the world
// A round white bubble holding an icon (talk → speech bubble, doors → door, anything else → a hand or the
// thing's own icon) with the key on its corner. The words appear on hover, or briefly the first time a
// prompt is seen. (x, y) is the tip of the tail. Returns true when tapped.
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
  const g = ui.g, acc = o.color || T.cyan, label = String(str ?? '');
  const a = ui.anim('prompt:' + label, {}); a.t += ui.dt;
  const seen = ui._promptSeen || (ui._promptSeen = new Map());
  if (!seen.has(label)) seen.set(label, ui.t);
  const firstShow = ui.t - seen.get(label) < 1.8;
  const icon = promptIcon(label, o.icon), R = 10.5;
  const bob = o.bob === false ? 0 : Math.sin(ui.t * 3.2) * 1.2;
  const cx = x, cy0 = y - 6 - R;
  const over = !ui.blocked(o) && Math.hypot(ui.ptr.x - cx, ui.ptr.y - cy0) < R + 4;
  if (over && ui.ptr.pressed) { ui.click('ui_tap', { vol: 0.6 }); a.pt = 0; }
  a.pt = (a.pt ?? 9) + ui.dt;
  const pop = boing(a.t * 1.6), sq = a.pt < 0.6 ? Math.exp(-7 * a.pt) * Math.sin(a.pt * 24) * 0.12 : 0;
  const cy = cy0 + bob - (over ? 1 : 0), sc = Math.max(0.05, pop) * (1 + (over ? 0.06 : 0));
  g.save(); g.globalAlpha = o.alpha ?? 1; g.translate(cx, y); g.scale(sc + sq, sc - sq); g.translate(-cx, -y);
  // tail + bubble
  ui.fill(T.ink); g.beginPath(); g.moveTo(cx - 4.5, cy + R - 3); g.lineTo(cx, y + 0.8); g.lineTo(cx + 4.5, cy + R - 3); g.closePath(); g.fill();
  ui.fill(T.ink); circle(g, cx, cy, R + 1.4); g.fill();
  ui.fill(over ? acc : '#ffffff'); circle(g, cx, cy, R); g.fill();
  ui.fill('#ffffff'); g.beginPath(); g.moveTo(cx - 3, cy + R - 3); g.lineTo(cx, y - 1.2); g.lineTo(cx + 3, cy + R - 3); g.closePath(); g.fill();
  g.fillStyle = vgrad(g, cy - R + 2, cy + R - 2, ['#ffffff', '#ffffff', '#dfe6fb']); ui._fs = null; circle(g, cx, cy, R - 1.8); g.fill();
  drawBig(ui.s, icon, cx - 7, cy - 7.5, null, { shadow: false, scale: 14 / 12 });
  if (keyLabel) keycap(ui, cx + R - 6, cy + R - 7, keyLabel, { small: true, pressed: over && ui.ptr.down });
  g.restore(); ui._fs = null; ui._font = null;
  if (a.t < 0.45) sparkle(ui.s, cx - R + 1, cy - R + 1, T.amber, 1 - a.t / 0.45);
  // the words: on hover, or briefly the first time this prompt shows
  const showLabel = o.label === 'always' || (o.label !== 'never' && (over || firstShow));
  a.lk = clamp01((a.lk || 0) + (showLabel ? 1 : -1) * ui.dt * 7);
  if (a.lk > 0.02 && label) {
    const lw = ui.tw(label, { bold: true }) + 12, lx = cx - lw / 2, ly = cy - R - 17 + (1 - easeOut(a.lk)) * 4;
    g.save(); g.globalAlpha = a.lk;
    frame(ui, lx, ly, lw, 14, { fill: T.ink, edge: '#2a2560', r: 7, thin: true, shadowA: 0.3 });
    ui.text(label, lx + 6, ly + 3.5, '#ffffff', { bold: true });
    g.restore(); ui._fs = null; ui._font = null;
  }
  const tapped = over && ui.ptr.released;
  if (tapped) ui.ptr.released = false;
  return tapped;
}

// ------------------------------------------------------------------ virtual thumbstick: a frosted ring with a candy knob
// dx, dy: knob offset as a fraction of r (−1..1). o: { color, ghost (a faint resting hint: rim and arrows only) }
export function joystick(ui, cx, cy, r, dx = 0, dy = 0, active = false, o = {}) {
  const g = ui.g, k = active ? 1 : o.ghost ? 0.4 : 0.7, acc = o.color || T.cyan;
  discA(ui.s, cx, cy, r, T.ink, 0.28 * k);
  g.strokeStyle = rgba('#ffffff', 0.75 * k); g.lineWidth = 2.2; circle(g, cx + 0.5, cy + 0.5, r); g.stroke();
  g.strokeStyle = rgba(T.ink, 0.6 * k); g.lineWidth = 1; circle(g, cx + 0.5, cy + 0.5, r + 1.6); g.stroke();
  let m = Math.hypot(dx, dy), nx = dx, ny = dy; if (m > 1) { nx /= m; ny /= m; m = 1; }
  for (const [d, ux, uy] of [['up', 0, -1], ['right', 1, 0], ['down', 0, 1], ['left', -1, 0]]) {
    const on = active && m > 0.3 && nx * ux + ny * uy > 0.7, px0 = cx + ux * (r - 6), py0 = cy + uy * (r - 6);
    const c = on ? acc : rgba('#ffffff', o.ghost ? 0.55 : 0.9);
    if (d === 'up' || d === 'down') tri(ui.s, px0 - 2, py0 - 1, d, 2, c); else tri(ui.s, px0 - 1, py0 - 2, d, 2, c);
  }
  if (o.ghost) return;
  const kr = Math.max(5, Math.round(r * 0.42)), KX = cx + nx * (r - kr * 0.6), KY = cy + ny * (r - kr * 0.6);
  discA(ui.s, KX, KY + 2, kr, T.shade, 0.4 * k);
  ball(ui.s, KX, KY, kr, active ? acc : '#e8eeff');
}

// ------------------------------------------------------------------ clock: a sky dial + the time on a pill
// info: { day, time (hour number or 'HH:MM'), weather ('clear'|'fog'|'storm'|'rain'|'cloud'), weekday }
export function hudClock(ui, x, y, info = {}, o = {}) {
  const g = ui.g, day = info.day ?? 1;
  let hour = info.time ?? info.hour ?? 12;
  if (typeof hour === 'string') { const [hh, mm] = hour.split(':'); hour = (+hh || 0) + (+mm || 0) / 60; }
  hour = ((hour % 24) + 24) % 24;
  const hh = Math.floor(hour), mm = Math.floor((hour % 1) * 60), tstr = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  const R = 11, dcx = x + 14, dcy = y + 14;
  const tw = ui.tw(tstr, { bold: true }), pw = tw + 24, px0 = x + 16;
  frame(ui, px0, y + 6.5, pw, 16, { fill: T.panel, r: 8, thin: true, alpha: o.alpha ?? 1, shadowA: 0.3 });
  ui.text(tstr, px0 + 15, y + 11, '#ffffff', { bold: true });
  // the dial: sky by the hour, the sun / moon riding an arc over little hills
  const night = hour < 5 || hour >= 19.5, dawn = hour >= 5 && hour < 7.5, dusk = hour >= 17 && hour < 19.5;
  const sky = night ? ['#1d2a6a', '#3a50a0'] : dawn ? ['#7ab8f0', '#ffc8a0'] : dusk ? ['#f08a5a', '#ffd08a'] : ['#3ab4f4', '#bdf0ff'];
  woodRing(ui.s, dcx, dcy, R, { th: 2.4 });
  clipCircle(ui, dcx, dcy, R, () => {
    g.fillStyle = vgrad(g, dcy - R, dcy + R, sky); ui._fs = null; g.fillRect(dcx - R, dcy - R, 2 * R + 1, 2 * R + 1);
    const isDay = !night, prog = isDay ? clamp01((hour - 5) / 14.5) : clamp01(((hour + 24 - 19.5) % 24) / 9.5);
    const ang = Math.PI + prog * Math.PI, bx = dcx + 0.5 + Math.cos(ang) * (R - 4.5), by = dcy + 2 + Math.sin(ang) * (R - 4.5);
    if (isDay) { ui.fill('rgba(255,240,170,0.45)'); circle(g, bx, by, 4.2); g.fill(); ball(ui.s, bx - 0.5, by - 0.5, 2.6, '#ffd23a'); }
    else { ball(ui.s, bx - 0.5, by - 0.5, 2.6, '#fff4c8'); ui.fill(sky[0]); circle(g, bx + 1.3, by - 0.8, 2.1); g.fill(); ui.fill('#ffffff'); g.fillRect(dcx - 6, dcy - 6, 0.8, 0.8); g.fillRect(dcx + 4, dcy - 4, 0.8, 0.8); g.fillRect(dcx - 1, dcy - 8, 0.7, 0.7); }
    ui.fill(night ? '#2f6a4a' : '#5fd84a'); g.beginPath(); g.moveTo(dcx - R - 1, dcy + R + 1); g.lineTo(dcx - R - 1, dcy + 4); g.quadraticCurveTo(dcx - 4, dcy + 0.5, dcx + 2, dcy + 4.5); g.quadraticCurveTo(dcx + 7, dcy + 2, dcx + R + 1, dcy + 5); g.lineTo(dcx + R + 1, dcy + R + 1); g.closePath(); g.fill();
    ui.fill(night ? '#24503a' : '#3fbf5a'); g.fillRect(dcx - R, dcy + 8, 2 * R + 1, 4);
  });
  const wn = { fog: 'fog', storm: 'storm', rain: 'rain', cloud: 'cloud', cloudy: 'cloud' }[info.weather || 'clear'];
  if (wn) { ball(ui.s, dcx + 10, dcy - 10, 5, '#ffffff'); drawSmall(ui.s, wn, dcx + 6.5, dcy - 13.5, '#7a8ab8', null); }
  // the day on a little candy bead
  const ds = 'D' + day, dw = Math.max(11, ui.tw(ds, { mini: true, bold: true }) + 6);
  ui.fill(T.ink); rr(g, dcx - dw / 2 - 0.8, dcy + 8.2, dw + 1.6, 9.6, 4.8); g.fill();
  ui.fill(T.amber); rr(g, dcx - dw / 2, dcy + 9, dw, 8, 4); g.fill();
  ui.text(ds, dcx, dcy + 10.5, T.paperText, { mini: true, align: 'center', bold: true });
  return { w: px0 + pw - x, h: 30 };
}

// ------------------------------------------------------------------ money: a coin + the number (counts up/down smoothly)
// o: { align: 'right' (x is the right edge), id, symbol }
export function hudMoney(ui, x, y, amount, o = {}) {
  const a = ui.anim('money:' + (o.id || ''), { v: amount, last: amount, pops: [] });
  if (amount !== a.last) { a.pops.push({ d: amount - a.last, t: 0 }); a.last = amount; a.flash = 0.5; }
  a.v += (amount - a.v) * Math.min(1, ui.dt * 9); if (Math.abs(amount - a.v) < 0.5) a.v = amount;
  a.flash = Math.max(0, (a.flash || 0) - ui.dt);
  const str = (o.symbol || '') + fmtNum(a.v), tw = ui.tw(str, { bold: true }), w = Math.round(tw + 26), h = 16;
  if (o.align === 'right') x -= w;
  frame(ui, x + 5, y, w - 5, h, { paper: '#ffffff', r: 8, thin: true, shadowA: 0.3 });
  drawBig(ui.s, 'coin', x - 2, y + 1, null, { scale: 14 / 12 });
  if (((ui.t * 0.7) % 1) < 0.12) sparkle(ui.s, x + 2, y + 2, T.amber, 1 - ((ui.t * 0.7) % 1) / 0.12);
  ui.text(str, x + 16, y + 4.5, a.flash > 0 ? T.amber2 : T.paperText, { bold: true });
  for (const p of a.pops) {
    p.t += ui.dt; const k = p.t / 1.1; if (k >= 1) continue;
    const ps = (p.d > 0 ? '+' : '-') + fmtNum(Math.abs(p.d));
    ui.text(ps, x + w - 2, y + h + 3 - easeOut(k) * 6, p.d > 0 ? T.green : T.red, { align: 'right', mini: true, bold: true, outline: T.ink });
  }
  if (a.pops.length && a.pops[0].t >= 1.1) a.pops = a.pops.filter((p) => p.t < 1.1);
  return w;
}

// ------------------------------------------------------------------ place ribbon: drops in with a boing when the name changes, then rises away
// o: { id, hold (seconds shown; 0 = stays), align ('center': x is the centre), sub (true: show the subtitle) }
export function hudLocation(ui, x, y, name, sub, o = {}) {
  const g = ui.g, a = ui.anim('loc:' + (o.id || ''), { name: null });
  if (a.name !== name) { a.name = name; a.t = 0; }
  a.t += ui.dt;
  if (!name) return 0;
  const hold = o.hold || 0;
  if (hold && a.t > hold + 0.6) return 0;
  const showSub = !!sub && o.sub !== false, nw = ui.tw(name, { bold: true }), sw = showSub ? ui.tw(String(sub).toUpperCase(), { mini: true, bold: true }) : 0;
  const w = Math.round(Math.max(nw, sw) + 34), h = showSub ? 25 : 18;
  const X0 = o.align === 'center' ? x - w / 2 : x;
  const kin = boing(a.t * 1.4), kout = hold ? clamp01((hold + 0.6 - a.t) / 0.6) : 1;
  const sy = y + 4 - (1 - kin) * (h + 14) - (1 - easeOut(kout)) * (h + 16);
  frame(ui, X0, sy, w, h, { fill: T.phone, r: 9, thin: false, big: false, shadowA: 0.4 });
  drawBig(ui.s, 'pin', X0 + 4, sy + (h - 13) / 2, '#ffffff', { scale: 13 / 12 });
  ui.text(name, X0 + 19, sy + (showSub ? 4.5 : 5.5), '#ffffff', { bold: true, outline: T.phoneD });
  if (showSub) ui.text(String(sub).toUpperCase(), X0 + 19.5, sy + 15, '#ffe0e4', { mini: true, bold: true });
  if (a.t > 0.4 && a.t < 1.1) sparkle(ui.s, X0 + w - 4, sy + 1, T.amberL, 1 - (a.t - 0.4) / 0.7);
  void g;
  return w;
}

// ------------------------------------------------------------------ objective: a white tag with a star badge
export function objective(ui, x, y, str, o = {}) {
  if (!str) return 0;
  const maxW = o.maxW || ui.w - x - 6;
  let t = String(str);
  if (ui.tw(t) + 28 > maxW) { while (t.length > 3 && ui.tw(t + '…') + 28 > maxW) t = t.slice(0, -1); t = t.replace(/\s+$/, '') + '…'; }
  const w = Math.round(ui.tw(t) + 28), h = 15;
  frame(ui, x + 4, y, w - 4, h, { paper: '#ffffff', r: 7.5, thin: true, alpha: o.alpha ?? 1, shadowA: 0.3 });
  ball(ui.s, x + 6.5, y + 7, 6.5, T.amber);
  drawSmall(ui.s, 'star', x + 3, y + 3.5, '#ffffff', T.amber2);
  ui.text(t, x + 17, y + 4, T.paperText, { bold: true });
  return w;
}

// ------------------------------------------------------------------ round candy button (HUD, phone, menus)
// (cx, cy) centre, r radius of the face. o: { sel, color (face colour), hotkey, disabled, modal, tint, badge, tip }
// returns { clicked, over }
export function roundButton(ui, cx, cy, r, icon, o = {}) {
  const g = ui.g, R = r + 3, blk = ui.blocked(o);
  const over = Math.hypot(ui.ptr.x - cx, ui.ptr.y - cy) <= R + 1 && !o.disabled && !blk, down = over && ui.ptr.down;
  if (over) ui.hot = o.tip || icon;
  const a = ui.anim('rb' + ((cx * 977 + cy * 131 + r) | 0), { bt: 9, hov: 0 });
  a.bt += ui.dt; a.hov += ((over ? 1 : 0) - a.hov) * Math.min(1, ui.dt * 14);
  if (over && ui.ptr.pressed) ui.click('ui_tap', { vol: 0.7, pitch: 1 + 6 / Math.max(6, r) * 0.1 });
  const hk = o.hotkey && ui.key(o.hotkey) && !o.disabled && !blk;
  const clicked = (over && ui.ptr.released) || hk;
  if (clicked) { a.bt = 0; if (hk) ui.click('ui_tap', { vol: 0.7 }); }
  const col = o.disabled ? '#9aa0c0' : o.color || T.blue, lip = r >= 10 ? 2.6 : 2, dy = down ? lip - 0.8 : 0;
  const sq = a.bt < 0.7 ? Math.exp(-7 * a.bt) * Math.sin(a.bt * 26) * 0.1 : 0, grow = a.hov * 0.05 + (o.sel ? 0.04 : 0);
  g.save(); g.translate(cx, cy); g.scale(1 + grow + sq, 1 + grow - sq); g.translate(-cx, -cy);
  if (o.sel) { const pulse = 0.55 + Math.sin(ui.t * 5) * 0.25; g.strokeStyle = rgba('#ffffff', pulse); g.lineWidth = 2.2; circle(g, cx, cy + 0.5, R + 2.6); g.stroke(); g.strokeStyle = rgba(T.amber, pulse); g.lineWidth = 1; circle(g, cx, cy + 0.5, R + 4.2); g.stroke(); }
  ui.fill(T.shade); g.globalAlpha = 0.35; circle(g, cx, cy + 2.2, R); g.fill(); g.globalAlpha = 1;
  ui.fill(T.ink); circle(g, cx, cy + lip * 0.5, R); g.fill();
  ui.fill(mx(col, T.ink, 0.42)); circle(g, cx, cy + lip, r + 1.6); g.fill();
  ui.fill(T.ink); circle(g, cx, cy + dy, r + 2.2); g.fill();
  const face = over ? mx(col, '#ffffff', 0.15) : col;
  g.fillStyle = vgrad(g, cy + dy - r, cy + dy + r, [mx(face, '#ffffff', 0.4), face, mx(face, T.ink, 0.15)]); ui._fs = null; circle(g, cx, cy + dy, r + 1); g.fill();
  if (!o.disabled) { g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.ellipse(cx, cy + dy - r * 0.45, r * 0.72, r * 0.38, 0, 0, Math.PI * 2); g.fill(); }
  const isz = Math.max(9, r * 1.35);
  drawBig(ui.s, icon, cx - isz / 2, cy + dy - isz / 2, o.tint || null, { scale: isz / 12, shadow: true, dim: o.disabled ? 0.5 : 0 });
  g.restore(); ui._fs = null; ui._font = null;
  if (o.sel) { const k = (ui.t * 0.9) % 1; sparkle(ui.s, cx + Math.cos(k * 6.28) * (R + 2), cy + Math.sin(k * 6.28) * (R + 2), T.amberL, 1 - k); }
  if (o.badge) { const bx = cx + r * 0.8, by = cy - r * 0.8; ball(ui.s, bx, by, 4.5, T.berry); ui.text(String(o.badge), bx + 0.5, by - 2, '#ffffff', { mini: true, align: 'center', bold: true }); }
  if (clicked) ui.ptr.released = false;
  return { clicked, over };
}
// square-footprint icon button (kept API): a round candy button filling the square
export function iconButton(ui, x, y, size, icon, o = {}) {
  const r = Math.max(5, size / 2 - 3);
  return roundButton(ui, x + size / 2, y + size / 2, r, icon, o).clicked;
}

// ------------------------------------------------------------------ party: one candy medal per Tokonmon with a tiny HP bar
// party: [{ name, hp, maxHp, color, level, fainted?, icon? }]; o: { maxW, id }
export function partyBar(ui, x, y, party = [], o = {}) {
  const n = party.length, maxW = o.maxW || ui.w - x - 4;
  if (!n) return { w: 0, h: 0 };
  let cx = x; const H = 32;
  for (let i = 0; i < n; i++) {
    const m = party[i], col = m.color || T.cyan, hpv = m.maxHp ? clamp01(m.hp / m.maxHp) : clamp01(m.hp ?? 1), dead = m.fainted || hpv <= 0;
    const lead = i === 0, r = lead ? 10 : 8, R = r + 2.4, bw = 2 * R + 1;
    if (cx + bw - x > maxW) break;
    const low = !dead && hpv <= 0.25 && ((ui.t * 3) | 0) % 2;
    const ccx = cx + R, ccy = y + (lead ? R : R + 3), ec = dead ? '#8a8eaa' : col;
    woodRing(ui.s, ccx, ccy, r, { th: 2.4, color: low ? T.red : '#ffffff' });
    ball(ui.s, ccx, ccy, r - 0.2, ec);
    if (m.icon) drawBig(ui.s, m.icon, ccx - r * 0.7, ccy - r * 0.7, null, { scale: (r * 1.4) / 12, shadow: false });
    else ui.text((m.name || '?')[0].toUpperCase(), ccx + 0.5, ccy - (lead ? 4.5 : 3.6), '#ffffff', { align: 'center', bold: true, outline: mx(ec, T.ink, 0.65), scale: lead ? 1.3 : 1 });
    if (dead) drawSmall(ui.s, 'cross', ccx - 3, ccy - 3, T.red, T.ink);
    if (m.level != null && lead) { const ls = String(m.level); ui.fill(T.ink); rr(ui.g, ccx + r - 6, ccy + r - 5, ui.tw(ls, { mini: true, bold: true }) + 6, 9, 4.5); ui.g.fill(); ui.text(ls, ccx + r - 3, ccy + r - 3, T.amber, { mini: true, bold: true }); }
    ui.bar(cx + 3, y + H - 4, bw - 6, 3, hpv, { id: (o.id || 'party') + i, shine: false, seg: 0 });
    cx += bw + 4;
  }
  return { w: cx - 4 - x, h: H };
}

// ------------------------------------------------------------------ round radar minimap with a compass bead
// draw(ui, x, y, w, h) paints the map (clipped to the disc). The disc is centred in (x, y, w, h).
// o: { north (radians, 0 = up), label, player (draw a centre arrow), heading }
export function minimap(ui, x, y, w, h, draw, o = {}) {
  const g = ui.g, d = Math.min(w, h), R = d / 2 - 3, cx = x + w / 2, cy = y + h / 2;
  woodRing(ui.s, cx - 0.5, cy - 0.5, R, { th: 3, fill: '#1d2a5a' });
  clipCircle(ui, cx - 0.5, cy - 0.5, R, () => {
    if (draw) draw(ui, cx - R, cy - R, 2 * R, 2 * R);
    // radar rings + sweep
    g.strokeStyle = 'rgba(120,255,200,0.18)'; g.lineWidth = 0.7; circle(g, cx, cy, R * 0.5); g.stroke(); circle(g, cx, cy, R * 0.85); g.stroke();
    const sw = (ui.t * 1.4) % (Math.PI * 2);
    g.fillStyle = 'rgba(120,255,200,0.12)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R + 1, sw - 0.7, sw); g.closePath(); g.fill();
    const vg = g.createRadialGradient(cx, cy, R * 0.6, cx, cy, R + 1); vg.addColorStop(0, 'rgba(20,16,56,0)'); vg.addColorStop(1, 'rgba(20,16,56,0.45)'); g.fillStyle = vg; g.fillRect(cx - R - 1, cy - R - 1, 2 * R + 2, 2 * R + 2);
  });
  ui._fs = null;
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(cx - R * 0.35, cy - R * 0.55, R * 0.4, R * 0.16, -0.5, 0, Math.PI * 2); g.fill();
  if (o.player) {
    const hd = o.heading || 0; g.save(); g.translate(cx, cy); g.rotate(hd);
    ui.fill(T.ink); g.beginPath(); g.moveTo(0, -5); g.lineTo(4, 4); g.lineTo(0, 2); g.lineTo(-4, 4); g.closePath(); g.fill();
    ui.fill(T.berry); g.beginPath(); g.moveTo(0, -3.6); g.lineTo(2.6, 2.8); g.lineTo(0, 1.4); g.lineTo(-2.6, 2.8); g.closePath(); g.fill();
    g.restore(); ui._fs = null;
  }
  // compass: an "N" bead riding the rim toward north
  const nr = o.north || 0, bx = cx + Math.sin(nr) * (R + 1.5), by = cy - Math.cos(nr) * (R + 1.5);
  ball(ui.s, bx - 0.5, by - 0.5, 4.2, T.red);
  ui.text('N', bx, by - 2.5, '#ffffff', { mini: true, bold: true, align: 'center' });
  if (o.label) {
    const lw = ui.tw(o.label, { mini: true, bold: true }) + 10, lx = cx - lw / 2, ly = cy + R + 1;
    frame(ui, lx, ly, lw, 10, { fill: T.ink, edge: '#3a3570', thin: true, r: 5, shadow: false });
    ui.text(o.label.toUpperCase(), lx + 5, ly + 2.6, '#ffffff', { mini: true, bold: true });
  }
}

// ------------------------------------------------------------------ images (3D renders, portraits)
const imgCache = new WeakMap();
export function toCanvas(src) {
  if (!src || typeof src !== 'object') return null;
  if (src.getContext || (typeof ImageBitmap !== 'undefined' && src instanceof ImageBitmap) || (typeof HTMLImageElement !== 'undefined' && src instanceof HTMLImageElement)) return src;
  let c = imgCache.get(src);
  if (c) return c;
  if (src.data && src.width && !(src.data instanceof Uint32Array)) {           // ImageData
    c = pixelCanvas(src.width, src.height, (d) => d.set(new Uint32Array(src.data.buffer, src.data.byteOffset, src.width * src.height)));
  } else if (src.data instanceof Uint32Array && src.w) c = pixelCanvas(src.w, src.h, (d) => d.set(src.data));   // an old Surf
  if (c) imgCache.set(src, c);
  return c;
}
export function drawImage(ui, src, x, y, w, h, o = {}) {
  const c = toCanvas(src); if (!c) return;
  const g = ui.g, sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = !o.crisp;
  if (o.alpha != null) g.globalAlpha = o.alpha;
  g.drawImage(c, x, y, w, h);
  g.globalAlpha = 1; g.imageSmoothingEnabled = sm;
}
void easeOutBack; void ringPx; void css;
