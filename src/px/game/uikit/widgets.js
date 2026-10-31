// Roaming-HUD and world widgets: keycaps, the interaction prompt bubble, the
// touch thumbstick, clock / money / location / objective plates, the party
// bar and the framed minimap. Each takes the PixelUI as its first argument.
import { P } from '../../surface.js';
import { bayer } from '../../color.js';
import { T, sh, mx, pa, hash, clamp01, easeOut, easeOutBack } from './theme.js';
import { frame, dropShadow, gradFill, blendRun, ball, ringPx, discA, tri, gem, sparkle, caps } from './frame.js';
import { drawBig, drawSmall } from './icons.js';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const fmtNum = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ------------------------------------------------------------------ keycap: a little 3D keyboard key
// returns its width. o: { pressed, color (side tint), mini, h }
export function keycap(ui, x, y, label, o = {}) {
  x = Math.round(x); y = Math.round(y);
  const s = ui.s, lab = String(label ?? ''), mini = o.mini || lab.length > 3;
  const lw = ui.tw(lab, { mini }), w = Math.max(11, lw + 6), h = 13, dy = o.pressed ? 1 : 0;
  const side = o.color ? mx(T.keySide, o.color, 0.5) : T.keySide;
  dropShadow(s, x, y, w, h, 2, 1, 1, 0.45);
  ui.rrect(x, y, w, h, T.ink, 2);
  ui.rrect(x + 1, y + 1, w - 2, h - 2, side, 1);
  s.hline(x + 2, x + w - 3, y + h - 2, sh(side, -0.8));
  const fy = y + 1 + dy;
  ui.rrect(x + 1, fy, w - 2, 9, T.keyD, 1);
  gradFill(s, x + 2, fy, w - 4, 8, ['#ffffff', T.key, T.keyD], 0);
  s.hline(x + 2, x + w - 3, fy, '#ffffff');
  s.vline(x + 1, fy + 1, fy + 7, mx(T.keyD, '#ffffff', 0.4));
  ui.text(lab, x + Math.round(w / 2) - (mini ? 0 : 0), fy + (mini ? 2 : 1), '#2a1a3a', { align: 'center', mini });
  return w;
}

// ------------------------------------------------------------------ prompt bubble shown above objects in the world
// (x, y) is the tip of the tail; the bubble sits above it. Returns true when tapped.
// o: { icon, color (rim accent), bob (false = still), alpha, sub }
export function prompt(ui, x, y, keyLabel, str, o = {}) {
  x = Math.round(x); y = Math.round(y);
  const s = ui.s, acc = o.color || T.amber, label = String(str ?? '');
  const a = ui.anim('prompt:' + label, {}); a.t += ui.dt;
  const kw = keyLabel ? ui.tw(String(keyLabel), { mini: String(keyLabel).length > 3 }) + 6 : 0;
  const kW = keyLabel ? Math.max(11, kw) : 0, icon = o.icon;
  const tw = ui.tw(label);
  const bw = 8 + (kW ? kW + 5 : 0) + (icon ? 14 : 0) + tw + 2, bh = 19;
  const bob = o.bob === false ? 0 : Math.round(Math.sin(ui.t * 3.4) * 1);
  const pop = Math.round((1 - easeOutBack(a.t * 5)) * 5);
  const bx = Math.round(x - bw / 2), by = y - 4 - bh + bob + pop;
  const over = !ui.blocked(o) && ui.inside(bx, by, bw, bh + 4);
  const fill = '#251d3c';
  frame(ui, bx, by, bw, bh, { fill, fill2: '#1a1430', alpha: o.alpha ?? 0.95, edge: over ? acc : mx(T.edge, acc, 0.35), edgeL: over ? mx(acc, '#ffffff', 0.5) : mx(T.edgeL, acc, 0.4), rivets: false });
  // tail pointing down at (x, y)
  const tx = x, ty = by + bh - 2, tf = P(sh(fill, -0.55)), K = P(T.ink), rim = P(over ? acc : mx(T.edge, acc, 0.35));
  for (let i = -2; i <= 2; i++) { s.px(tx + i, ty, tf); s.px(tx + i, ty + 1, tf); }
  s.px(tx - 3, ty + 1, rim); s.px(tx + 3, ty + 1, rim);
  for (let j = 2; j <= 4; j++) { const hw = 4 - j; s.px(tx - hw - 1, ty + j, K); s.px(tx + hw + 1, ty + j, K); for (let i = -hw; i <= hw; i++) s.px(tx + i, ty + j, tf); }
  s.px(tx, ty + 5, K);
  let cx = bx + 4;
  if (keyLabel) { keycap(ui, cx, by + 3, keyLabel, { pressed: over && ui.ptr.down }); cx += kW + 5; }
  if (icon) { drawBig(s, icon, cx, by + 3, null, { shadow: false }); cx += 14; }
  ui.text(label, cx, by + 6, over ? '#ffffff' : T.text, { shadow: T.ink });
  if (a.t < 0.5) sparkle(s, bx + bw - 3, by + 1, acc, 1 - a.t * 2);
  const tapped = over && ui.ptr.released;
  if (tapped) ui.ptr.released = false;
  return tapped;
}

// ------------------------------------------------------------------ virtual thumbstick
// dx, dy: knob offset as a fraction of r (−1..1). o: { color, ghost (a faint resting hint: rim and chevrons only) }
export function joystick(ui, cx, cy, r, dx = 0, dy = 0, active = false, o = {}) {
  cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
  const s = ui.s, k = active ? 1 : o.ghost ? 0.32 : 0.6, acc = o.color || T.cyan;
  discA(s, cx, cy, r, '#120c1c', 0.38 * k);
  discA(s, cx, cy, Math.round(r * 0.62), '#2b2244', 0.25 * k);
  ringPx(s, cx, cy, r + 1, T.ink, 0.75 * k);
  // outer rim: lit on top, shaded below
  for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) {
    const d = Math.hypot(i, j); if (d > r + 0.5 || d <= r - 0.5) continue;
    blendRun(s, cx + i, cx + i, cy + j, j < 0 ? mx(T.edgeL, '#ffffff', 0.3) : T.edge, 0.85 * k);
  }
  ringPx(s, cx, cy, Math.round(r * 0.62), T.edgeL, 0.3 * k);
  let m = Math.hypot(dx, dy); let nx = dx, ny = dy; if (m > 1) { nx /= m; ny /= m; m = 1; }
  // direction chevrons; the one we're pushing toward lights up
  const dirs = [['up', 0, -1], ['right', 1, 0], ['down', 0, 1], ['left', -1, 0]];
  for (const [d, ux, uy] of dirs) {
    const on = active && m > 0.3 && nx * ux + ny * uy > 0.7;
    const px0 = cx + ux * (r - 5), py0 = cy + uy * (r - 5);
    const c = on ? acc : o.ghost ? mx(T.edgeL, T.panel, 0.45) : mx(T.edgeL, '#ffffff', 0.2);
    if (d === 'up') tri(s, px0 - 2, py0 - 1, 'up', 2, c); else if (d === 'down') tri(s, px0 - 2, py0 - 1, 'down', 2, c);
    else if (d === 'left') tri(s, px0 - 1, py0 - 2, 'left', 2, c); else tri(s, px0 - 1, py0 - 2, 'right', 2, c);
  }
  if (o.ghost) return;
  const kr = Math.max(5, Math.round(r * 0.42));
  const KX = Math.round(cx + nx * (r - kr * 0.6)), KY = Math.round(cy + ny * (r - kr * 0.6));
  discA(s, KX + 1, KY + 2, kr, T.shade, 0.5 * k);
  const kc = active ? acc : mx(T.edgeL, T.panel, 0.2);
  ball(s, KX, KY, kr, kc);
  ringPx(s, KX, KY, kr - 3, sh(kc, -0.5));
  ringPx(s, KX, KY - 1, kr - 3, mx(kc, '#ffffff', 0.35));
  ball(s, KX, KY, Math.max(1, kr - 4), kc, {});
  s.px(KX - Math.round(kr * 0.45), KY - Math.round(kr * 0.5), '#ffffff');
}

// ------------------------------------------------------------------ clock: day-cycle dial medallion + day / time
// info: { day, time (hour number or 'HH:MM'), weather ('clear'|'fog'|'storm'|'rain'|'cloud'), weekday }
export function hudClock(ui, x, y, info = {}, o = {}) {
  x = Math.round(x); y = Math.round(y);
  const s = ui.s, day = info.day ?? 1;
  let hour = info.time ?? info.hour ?? 12;
  if (typeof hour === 'string') { const [hh, mm] = hour.split(':'); hour = (+hh || 0) + (+mm || 0) / 60; }
  hour = ((hour % 24) + 24) % 24;
  const hh = Math.floor(hour), mm = Math.floor((hour % 1) * 60);
  const tstr = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  const wd = info.weekday || WEEKDAYS[(Math.max(1, day) - 1) % 7];
  const w = o.w || 84, h = 26, R = 11, dcx = x + 11, dcy = y + 13;
  frame(ui, x + 6, y, w - 6, h, { alpha: 0.92, fill: T.glass, fill2: '#141026', rivets: false });
  // dial: sky by hour, sun / moon riding an arc, hills below the horizon
  const night = hour < 5 || hour >= 19.5, dawn = hour >= 5 && hour < 7.5, dusk = hour >= 17 && hour < 19.5;
  const sky = night ? ['#1a1a4a', '#2e2a6e'] : dawn ? ['#6a6ac8', '#ff9a7a'] : dusk ? ['#7a4ab0', '#ff8a5a'] : ['#3a8ae0', '#8fd8f8'];
  ball(s, dcx, dcy, R + 1, T.brass);
  for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
    const d = Math.hypot(i, j); if (d > R - 0.5) continue;
    const t = (j + R) / (2 * R);
    let c = bayer(dcx + i, dcy + j) < t ? sky[1] : sky[0];
    if (j >= 3) c = j === 3 ? '#3a6a4a' : bayer(i, j) < 0.5 ? '#2a4a3a' : '#22403a';
    if (j >= 2 && j < 4 && Math.sin((i + 3) * 0.9) * 1.4 + 3 < j) c = '#3a6a4a';
    s.px(dcx + i, dcy + j, c);
  }
  ringPx(s, dcx, dcy, R, mx(T.brass, '#ffffff', 0.3));
  ringPx(s, dcx, dcy, R + 1, T.brassD);
  ringPx(s, dcx, dcy, R + 2, T.ink);
  const isDay = !night, prog = isDay ? clamp01((hour - 5) / 14.5) : clamp01(((hour + 24 - 19.5) % 24) / 9.5);
  const ang = Math.PI + prog * Math.PI, bx = Math.round(dcx + Math.cos(ang) * (R - 4)), by = Math.round(dcy + 2 + Math.sin(ang) * (R - 4));
  if (isDay) { ball(s, bx, by, 2, '#ffd75a', { ink: '#b8602a' }); s.px(bx - 1, by - 1, '#ffffff'); }
  else { ball(s, bx, by, 2, '#fff0b8', { ink: '#6a6aa0' }); s.px(bx + 1, by - 1, sky[0]); s.px(bx + 1, by, sky[0]); s.px(dcx - 5, dcy - 6, '#ffffff'); s.px(dcx + 4, dcy - 4, '#c8c4ff'); }
  // text
  const tx = x + 27;
  ui.text(`DAY ${day}`, tx, y + 5, T.amber, { mini: true });
  ui.text(wd.toUpperCase(), tx + ui.tw(`DAY ${day}`, { mini: true }) + 4, y + 5, T.dim, { mini: true });
  ui.text(tstr, tx, y + 13, '#ffffff', { bold: true, shadow: T.ink });
  const wx = x + w - 14, wn = { clear: isDay ? 'sun' : 'moon', fog: 'fog', storm: 'storm', rain: 'rain', cloud: 'cloud', cloudy: 'cloud' }[info.weather || 'clear'] || 'sun';
  drawBig(s, wn, wx - 1, y + 9, null, { shadow: false });
  return { w, h };
}

// ------------------------------------------------------------------ money plate (counts up/down smoothly)
// o: { align: 'right' (x is the right edge), id, symbol }
export function hudMoney(ui, x, y, amount, o = {}) {
  x = Math.round(x); y = Math.round(y);
  const s = ui.s, a = ui.anim('money:' + (o.id || ''), { v: amount, last: amount, pops: [] });
  if (amount !== a.last) { a.pops.push({ d: amount - a.last, t: 0 }); a.last = amount; a.flash = 0.5; }
  a.v += (amount - a.v) * Math.min(1, ui.dt * 9); if (Math.abs(amount - a.v) < 0.5) a.v = amount;
  a.flash = Math.max(0, (a.flash || 0) - ui.dt);
  const str = (o.symbol || '') + fmtNum(a.v), tw = ui.tw(str, { bold: true }), w = tw + 25, h = 16;
  if (o.align === 'right') x -= w;
  frame(ui, x + 4, y, w - 4, h, { alpha: 0.92, fill: T.glass, fill2: '#141026', rivets: false, edge: mx(T.edge, T.amber, 0.25) });
  drawBig(s, 'coin', x - 1, y + 2, null, {});
  if (((ui.t * 0.7) % 1) < 0.12) sparkle(s, x + 3, y + 4, T.amberL, 1 - ((ui.t * 0.7) % 1) / 0.12);
  ui.text(str, x + 16, y + 5, null, { bold: true, grad: a.flash > 0 ? ['#ffffff', T.amberL] : [T.amberL, T.amber, T.amber2], shadow: T.ink });
  for (const p of a.pops) {
    p.t += ui.dt; const k = p.t / 1.1; if (k >= 1) continue;
    const ps = (p.d > 0 ? '+' : '-') + fmtNum(Math.abs(p.d));
    if (k < 0.75 || ((ui.t * 16) | 0) % 2) ui.text(ps, x + w - 2, y + h + 2 - Math.round(easeOut(k) * 6), p.d > 0 ? T.green : T.red, { align: 'right', mini: true, outline: T.ink });
  }
  a.pops = a.pops.filter((p) => p.t < 1.1);
  return w;
}

// ------------------------------------------------------------------ location plate: slides in when the name changes
// o: { id, hold (seconds before collapsing to compact; 0 = never) }
export function hudLocation(ui, x, y, name, sub, o = {}) {
  x = Math.round(x); y = Math.round(y);
  const s = ui.s, a = ui.anim('loc:' + (o.id || ''), { name: null });
  if (a.name !== name) { a.name = name; a.t = 0; }
  a.t += ui.dt;
  if (!name) return 0;
  const nw = ui.tw(name, { bold: true }), sw = sub ? ui.tw(sub, { mini: true }) : 0;
  const w = Math.max(nw, sw) + 34, h = sub ? 24 : 18;
  const k = easeOut(a.t / 0.55), ox = Math.round((1 - k) * -(w + x + 10));
  const X = x + ox, K = P(T.ink);
  const right = (j) => X + w - Math.floor(j / 2);
  // body: ink outline, amber top trim, plum glass gradient, coral bottom trim
  for (let j = -1; j <= h; j++) { const r = right(Math.max(0, Math.min(h - 1, j))); s.hline(X + 8, r + 1, y + j, K); }
  for (let j = 0; j < h; j++) {
    const r = right(j), Y = y + j, t = j / (h - 1);
    if (j === 0) s.hline(X + 9, r, Y, T.amberL);
    else if (j === 1) s.hline(X + 9, r, Y, T.amber);
    else if (j === h - 1) s.hline(X + 9, r, Y, T.coral2);
    else if (j === h - 2) s.hline(X + 9, r, Y, pa('#191230', 0.92));
    else if (Y >= 0 && Y < s.h) for (let i = Math.max(0, X + 9); i <= Math.min(s.w - 1, r); i++) s.data[Y * s.w + i] = bayer(i, Y) < t ? pa('#1d1636', 0.92) : pa('#33255a', 0.92);
    s.px(r, Y, j < 2 ? T.amber2 : T.edge);
  }
  // shine sweep after it lands
  if (a.t > 0.5 && a.t < 1.3) { const sx = X + Math.round((a.t - 0.5) / 0.8 * (w + 20)); for (let j = 2; j < h - 2; j++) for (let q = 0; q < 3; q++) { const xx = sx - j + q; if (xx > X + 9 && xx < right(j)) s.px(xx, y + j, mx('#33255a', '#ffffff', 0.25)); } }
  // pin medallion
  const mcx = X + 8, mcy = y + Math.floor(h / 2);
  ball(s, mcx, mcy, 8, T.coral);
  ringPx(s, mcx, mcy, 6, sh(T.coral, -0.5));
  drawSmall(s, 'pin', mcx - 3, mcy - 3, '#ffffff', sh(T.coral, -1.6));
  ui.text(name, X + 20, y + (sub ? 4 : 6), '#ffffff', { bold: true, shadow: T.ink });
  if (sub) ui.text(sub.toUpperCase(), X + 21, y + 14, T.cyan, { mini: true });
  return w;
}

// ------------------------------------------------------------------ objective / quest tracker plate
export function objective(ui, x, y, str, o = {}) {
  if (!str) return 0;
  x = Math.round(x); y = Math.round(y);
  const s = ui.s, maxW = o.maxW || ui.w - x - 6;
  let t = String(str); while (t.length > 3 && ui.tw(t) + 24 > maxW) t = t.slice(0, -2);
  if (t !== String(str)) t = t.replace(/\s*\S?$/, '') + '…';
  const w = ui.tw(t) + 24, h = 15;
  frame(ui, x, y, w, h, { alpha: 0.9, fill: T.glass, fill2: '#141026', rivets: false, edge: mx(T.edge, T.amber, 0.3) });
  gem(s, x + 8, y + 7, T.amber, 3);
  ui.text(t, x + 15, y + 4, T.text, { shadow: T.ink });
  return w;
}

// ------------------------------------------------------------------ square icon button (big 12×12 icon on a key)
export function iconButton(ui, x, y, size, icon, o = {}) {
  const over = ui.inside(x, y, size, size) && !o.disabled && !ui.blocked(o), down = over && ui.ptr.down;
  const clicked = ui.button(x, y, size, size, '', Object.assign({}, o, { icon: null }));
  const lip = size >= 13 ? 3 : 2, fh = size - lip, dy = down ? lip - 1 : 0;
  drawBig(ui.s, icon, Math.round(x + (size - 12) / 2), Math.round(y + dy + (fh - 12) / 2), o.tint || null, { dim: o.disabled ? 0.6 : 0 });
  if (o.badge) { const bx = x + size - 3, by = y + 1; ball(ui.s, bx, by, 3, T.red); ui.text(String(o.badge), bx, by - 2, '#ffffff', { mini: true, align: 'center' }); }
  return clicked;
}

// ------------------------------------------------------------------ party bar: mini cards with HP bars
// party: [{ name, hp, maxHp, color, level, fainted? }]; o: { maxW, full (max full-size cards), cardW, id }
export function partyBar(ui, x, y, party = [], o = {}) {
  x = Math.round(x); y = Math.round(y);
  const s = ui.s, n = party.length, cw = o.cardW || 72, ch = 28, gap = 3, cmp = 22, maxW = o.maxW || ui.w - x - 4;
  if (!n) return { w: 0, h: 0 };
  let full = Math.min(n, o.full ?? n); while (full > 0 && full * (cw + gap) + (n - full) * (cmp + gap) - gap > maxW) full--;
  let cx = x;
  for (let i = 0; i < n; i++) {
    const m = party[i], col = m.color || T.cyan, hpv = m.maxHp ? clamp01(m.hp / m.maxHp) : clamp01(m.hp ?? 1), dead = m.fainted || hpv <= 0;
    const low = !dead && hpv <= 0.25 && ((ui.t * 3) | 0) % 2;
    const lead = i === 0;
    if (i < full) {
      frame(ui, cx, y, cw, ch, { alpha: 0.92, fill: dead ? '#1e1a2a' : T.glass, fill2: '#141026', rivets: false, edge: lead ? mx(T.edge, T.amber, 0.55) : T.edge, edgeL: lead ? mx(T.edgeL, T.amber, 0.6) : T.edgeL });
      const ex = cx + 11, ey = y + 12, ec = dead ? '#5a5478' : low ? T.red : col;
      ball(s, ex, ey, 8, ec);
      ringPx(s, ex, ey, 6, mx(ec, '#ffffff', 0.25));
      ui.text((m.name || '?')[0].toUpperCase(), ex + 1, ey - 3, '#ffffff', { align: 'center', bold: true, outline: sh(ec, -1.8) });
      // level badge
      const lv = 'LV' + (m.level ?? 1), lw = ui.tw(lv, { mini: true }) + 4;
      ui.rrect(ex - (lw >> 1), y + 19, lw, 9, T.ink, 2); ui.rrect(ex - (lw >> 1) + 1, y + 20, lw - 2, 7, '#2b2244', 1);
      ui.text(lv, ex + 1, y + 21, T.amber, { mini: true, align: 'center' });
      let nm = String(m.name || ''); const nmax = cw - 28; while (nm.length > 1 && ui.tw(nm) > nmax) nm = nm.slice(0, -1);
      ui.text(nm, cx + 23, y + 5, dead ? T.textD : '#ffffff', { shadow: T.ink });
      ui.bar(cx + 23, y + 14, cw - 28, 3, hpv, { seg: 4, id: (o.id || 'party') + i });
      ui.text('HP', cx + 23, y + 19, T.textD, { mini: true });
      if (dead) ui.text('FAINTED', cx + cw - 5, y + 19, T.red, { mini: true, align: 'right' });
      else if (m.maxHp) ui.text(`${Math.max(0, Math.round(m.hp))}/${m.maxHp}`, cx + cw - 5, y + 19, T.dim, { mini: true, align: 'right' });
      if (lead) gem(s, cx + 2, y + 2, T.amber, 2);
      cx += cw + gap;
    } else {
      frame(ui, cx, y, cmp, ch, { alpha: 0.92, fill: T.glass, fill2: '#141026', rivets: false, thin: true });
      const ec = dead ? '#5a5478' : low ? T.red : col;
      ball(s, cx + 11, y + 11, 6, ec);
      ui.text((m.name || '?')[0].toUpperCase(), cx + 12, y + 8, '#ffffff', { align: 'center', outline: sh(ec, -1.8) });
      ui.bar(cx + 4, y + 21, cmp - 8, 2, hpv, { id: (o.id || 'party') + i, shine: false });
      cx += cmp + gap;
    }
  }
  return { w: cx - gap - x, h: ch };
}

// ------------------------------------------------------------------ framed minimap with a compass
// draw(ui, x, y, w, h) paints the map (clipped to the inner window). o: { north (radians, 0 = up), label, player (draw a centre arrow), heading }
export function minimap(ui, x, y, w, h, draw, o = {}) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const s = ui.s;
  frame(ui, x, y, w, h, { fill: '#120e22', fill2: '#0c0818', accent: T.brass });
  const ix = x + 4, iy = y + 4, iw = w - 8, ih = h - 8;
  gradFill(s, ix, iy, iw, ih, ['#1a1430', '#120e22'], 0);
  if (draw) ui.clip(ix, iy, iw, ih, () => draw(ui, ix, iy, iw, ih), 1);
  // glass: soft inner vignette + a diagonal glare in the top-left
  for (let j = 0; j < ih; j++) for (let i = 0; i < iw; i++) {
    const e = Math.min(i, j, iw - 1 - i, ih - 1 - j);
    if (e < 2 && bayer(ix + i, iy + j) < (e === 0 ? 0.6 : 0.3)) s.px(ix + i, iy + j, '#0a0716');
  }
  for (let q = 0; q < 6; q++) for (let k = 0; k < 2; k++) { const gx = ix + 2 + q + k, gy = iy + 7 - q; if (gy >= iy) blendRun(s, gx, gx, gy, '#ffffff', 0.35); }
  if (o.player) {
    const ax = ix + (iw >> 1), ay = iy + (ih >> 1), hd = o.heading || 0;
    for (let t = -2; t <= 3; t++) s.px(Math.round(ax + Math.sin(hd) * t), Math.round(ay - Math.cos(hd) * t), t > 1 ? '#ffffff' : T.coral);
    if (((ui.t * 2) | 0) % 2) ringPx(s, ax, ay, 3, T.coral, 0.5);
  }
  // compass badge on the top-right corner: N inside, a red needle tip poking out toward north
  const ccx = x + w - 7, ccy = y + 7, nr = o.north || 0, ux = Math.sin(nr), uy = -Math.cos(nr);
  ball(s, ccx, ccy, 7, '#2b2244');
  ringPx(s, ccx, ccy, 7, T.brass);
  ringPx(s, ccx, ccy, 8, T.ink);
  const tx = Math.round(ccx + ux * 9), ty = Math.round(ccy + uy * 9);
  for (let t = 0; t <= 2; t++) { const px0 = Math.round(ccx + ux * (9 - t)), py0 = Math.round(ccy + uy * (9 - t)); for (let q = -t; q <= t; q++) s.px(Math.round(px0 - uy * q), Math.round(py0 + ux * q), t === 0 ? '#ffffff' : '#ff5a64'); }
  s.px(tx, ty, '#ffd0d0');
  ui.text('N', ccx, ccy - 2, '#ffffff', { mini: true, align: 'center' });
  if (o.label) {
    const lw = ui.tw(o.label, { mini: true }) + 8, lx = x + Math.round((w - lw) / 2), ly = y + h - 5;
    frame(ui, lx, ly, lw, 9, { thin: true, rivets: false, fill: '#2b2244', shadow: false });
    ui.text(o.label.toUpperCase(), lx + 4, ly + 2, T.dim, { mini: true });
  }
}
void caps; void hash;
