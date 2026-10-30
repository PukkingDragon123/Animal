// Full-screen modal screens: name entry (on-screen pixel keyboard + physical
// typing) and the big illustrated card picker (boy / girl, starters, …).
// Each returns a modal object for PixelUI.openModal: { capture, draw(ui, dt, live), resolve }.
import { Surf, P } from '../../surface.js';
import { hasGlyph } from '../../font.js';
import { bayer } from '../../color.js';
import { T, sh, mx, clamp01, easeOut, easeOutBack } from './theme.js';
import { frame, backdrop, gradFill, tri, gem, sparkle, blendRect, dropShadow, ball } from './frame.js';
import { drawBig } from './icons.js';

// ------------------------------------------------------------------ shared pieces
function title(ui, str, y, o = {}) {
  const W = ui.w, big = ui.tw(str) * 2 + 24 < W;
  if (big) {
    ui.text(str, (W >> 1) + 1, y + 2, '#05030a', { align: 'center', scale: 2 });
    ui.text(str, W >> 1, y, null, { align: 'center', scale: 2, outline: T.ink, grad: [T.amberL, T.amber, T.coral] });
  } else ui.text(str, W >> 1, y + 3, null, { align: 'center', bold: true, outline: T.ink, grad: [T.amberL, T.amber] });
  const th = big ? 16 : 10;
  // flourish: little gem-and-rule under the title
  const tw = Math.min(W - 40, (big ? ui.tw(str) * 2 : ui.tw(str)) + 30), ly = y + th + 4, s = ui.s;
  for (let i = 0; i < tw; i++) { const X = (W >> 1) - (tw >> 1) + i, d = Math.abs(i - tw / 2) / (tw / 2); if (bayer(X, ly) > d * 0.9) s.px(X, ly, d < 0.15 ? T.amber : mx(T.amber2, T.plum, d)); }
  gem(s, W >> 1, ly, T.cyan, 2);
  if (o.sub) ui.text(o.sub, W >> 1, ly + 5, T.dim, { align: 'center', mini: true });
  return ly + (o.sub ? 12 : 5);
}
// a chunky dark key with a lip; state: { over, down, sel, accent }
function key(ui, x, y, w, h, label, st = {}) {
  const s = ui.s, acc = st.accent || T.cyan, lip = 2, dy = st.down ? 1 : 0, fh = h - lip;
  dropShadow(s, x, y, w, h, 2, 1, 1, 0.4);
  ui.rrect(x, y + lip, w, h - lip, T.ink, 2);
  ui.rrect(x + 1, y + lip, w - 2, h - lip - 1, sh(st.sel ? acc : T.edge, -1), 1);
  const fy = y + dy, face = st.sel ? mx('#3a2d5c', acc, 0.28) : st.over ? '#3a2f5a' : '#2e2549';
  ui.rrect(x, fy, w, fh, T.ink, 2);
  ui.rrect(x + 1, fy + 1, w - 2, fh - 2, st.sel ? acc : mx(T.edge, acc, st.tint ? 0.45 : 0.12), 1);
  gradFill(s, x + 2, fy + 2, w - 4, fh - 4, [mx(face, '#ffffff', 0.12), face, sh(face, -0.3)], 0);
  s.hline(x + 2, x + w - 3, fy + 1, mx(st.sel ? acc : T.edgeL, '#ffffff', st.sel ? 0.45 : 0.15));
  if (st.icon) drawBig(s, st.icon, x + ((w - 12) >> 1) + (label ? -ui.tw(label, { mini: true }) / 2 - 2 : 0) | 0, fy + ((fh - 12) >> 1), st.iconTint || null, { shadow: false });
  if (label) ui.text(label, x + (w >> 1) + (st.icon ? 7 : 0) + 1, fy + ((fh - (st.mini ? 5 : 7)) >> 1), st.sel ? '#ffffff' : st.textColor || T.text, { align: 'center', mini: st.mini, shadow: T.ink, bold: st.sel && !st.mini });
}
// animated corner brackets around a rect (selection cursor)
function brackets(ui, x, y, w, h, c, t) {
  const s = ui.s, o = Math.round(Math.abs(Math.sin(t * 5)) * 1.5) + 1, K = P(T.ink), C = P(c), L = P(mx(c, '#ffffff', 0.5));
  for (const [cx, cy, dx, dy] of [[x - o, y - o, 1, 1], [x + w - 1 + o, y - o, -1, 1], [x - o, y + h - 1 + o, 1, -1], [x + w - 1 + o, y + h - 1 + o, -1, -1]]) {
    for (let i = -1; i <= 4; i++) { s.px(cx + i * dx, cy - dy, K); s.px(cx - dx, cy + i * dy, K); }
    for (let i = 0; i <= 3; i++) { s.px(cx + i * dx, cy, i === 0 ? L : C); s.px(cx, cy + i * dy, i === 0 ? L : C); }
    s.px(cx + 4 * dx, cy, K); s.px(cx, cy + 4 * dy, K); s.px(cx + dx, cy + dy, K);
  }
}
function helpRow(ui, y, items) {
  // items: [[keyLabel | [keyLabels], text], ...] centred
  const kwOf = (k) => Math.max(11, ui.tw(k, { mini: k.length > 3 }) + 6);
  const parts = items.map(([k, t]) => { const ks = Array.isArray(k) ? k : [k]; return { ks, t, w: ks.reduce((a, q) => a + kwOf(q) + 1, 0) + 3 + ui.tw(t, { mini: true }) }; });
  const total = parts.reduce((a, p) => a + p.w, 0) + (parts.length - 1) * 10;
  if (total > ui.w - 12) return;
  let x = (ui.w - total) >> 1;
  for (const p of parts) { let kx = x; for (const k of p.ks) kx += ui.keycap(kx, y, k) + 1; ui.text(p.t.toUpperCase(), kx + 3, y + 4, T.dim, { mini: true }); x += p.w + 10; }
}

// ------------------------------------------------------------------ name entry
export function nameEntryScreen(ui, o, resolve) {
  const max = o.max || 10, def = String(o.value || '');
  const m = { capture: true, resolve, value: def.slice(0, max), replace: !!def, upper: true, sel: { r: 0, c: 0 }, nav: false, pop: 9, shake: 0, flash: null, lp: null, done: -1 };
  const allowed = (ch) => ch.length === 1 && /[A-Za-z0-9 .'\-!?&]/.test(ch) && hasGlyph(ch);
  const add = (ch) => {
    if (m.replace) { m.value = ''; m.replace = false; }
    if (m.value.length >= max) { m.shake = 0.3; return; }
    if (ch === ' ' && (!m.value.length || m.value.endsWith(' '))) return;
    m.value += ch; m.pop = 0;
  };
  const del = () => { if (m.replace) { m.value = ''; m.replace = false; return; } m.value = m.value.slice(0, -1); };
  const finish = () => {
    const name = m.value.trim().replace(/\s+/g, ' ') || def.trim();
    if (!name) { m.shake = 0.35; return; }
    m.done = 0; m.result = name;
  };
  const press = (k) => {
    m.flash = { k, t: 0 };
    if (k.type === 'ch') add(m.upper ? k.ch.toUpperCase() : k.ch.toLowerCase());
    else if (k.type === 'shift') m.upper = !m.upper;
    else if (k.type === 'space') add(' ');
    else if (k.type === 'del') del();
    else if (k.type === 'ok') finish();
  };
  m.draw = (ui, dt, live) => {
    const W = ui.w, H = ui.h, s = ui.s, t = m.t;
    m.pop += dt; m.shake = Math.max(0, m.shake - dt); if (m.flash) m.flash.t += dt;
    backdrop(ui, t);
    const narrow = W < 330;
    const lettersU = narrow ? ['ABCDEFGHIJ', 'KLMNOPQRST', "UVWXYZ-.'!", '0123456789'] : ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', "0123456789-.'"];
    const cols = lettersU[0].length, gap = 2, rowsN = lettersU.length + 1;
    const kw = Math.max(13, Math.min(narrow ? 21 : 22, Math.floor((W - 30 - (cols - 1) * gap) / cols)));
    const titleH = ui.tw(o.title || "What's your name?") * 2 + 24 < W ? 26 : 20;
    const help = !narrow ? 22 : 0;
    const kh = Math.max(13, Math.min(18, Math.floor((H - 16 - titleH - (o.sub ? 7 : 0) - 34 - 26 - help) / rowsN) - gap));
    const blockH = titleH + (o.sub ? 7 : 0) + 6 + 26 + 14 + rowsN * (kh + gap) + 4;
    const top = Math.max(6, Math.round((H - help - blockH) / 2));
    const y0 = title(ui, o.title || "What's your name?", top, { sub: o.sub });
    // ---- field
    const slot = 10, fw = max * slot + 44, fh = 26, fx = ((W - fw) >> 1) + Math.round(Math.sin(m.shake * 60) * m.shake * 8), fy = y0 + 6;
    frame(ui, fx, fy, fw, fh, { ornate: true, fill: '#251c3e', fill2: '#18122a', gem: T.cyan, gem2: T.amber });
    ui.bigIcon(o.icon || 'boy', fx + 6, fy + 7, null, { shadow: false });
    const tx0 = fx + 22;
    if (m.replace && m.value) s.rect(tx0 - 2, fy + 7, m.value.length * slot + 1, 12, '#4a3470');
    for (let i = 0; i < max; i++) {
      const cx = tx0 + i * slot, cur = i === Math.min(m.value.length, max - 1) && !m.replace;
      s.hline(cx, cx + 6, fy + 19, cur ? T.amber : '#4e4672');
      if (i < m.value.length) {
        const pop = i === m.value.length - 1 && m.pop < 0.12 ? -1 : 0;
        ui.text(m.value[i], cx, fy + 9 + pop, '#ffffff', { bold: true, shadow: '#120c1c' });
      } else if (cur && ((t * 2.2) | 0) % 2 === 0) { s.rect(cx, fy + 9, 6, 8, mx(T.amber, '#251c3e', 0.55)); s.hline(cx, cx + 6, fy + 19, T.amberL); s.hline(cx, cx + 6, fy + 20, T.amber); }
    }
    ui.text(`${m.value.length}/${max}`, fx + fw - 7, fy + 10, m.value.length >= max ? T.coral : T.textD, { mini: true, align: 'right' });
    // ---- keyboard layout
    const gw = cols * kw + (cols - 1) * gap, gx = (W - gw) >> 1, gy = fy + fh + 14;
    const rows = lettersU.map((r) => [...r].map((ch) => ({ type: 'ch', ch, w: 1 })));
    rows.push([{ type: 'shift', w: 2.5 }, { type: 'space', w: cols - 2.5 - 2.5 - 2.5 }, { type: 'del', w: 2.5 }, { type: 'ok', w: 2.5 }].map((k) => k));
    frame(ui, gx - 7, gy - 6, gw + 14, rowsN * (kh + gap) - gap + 12, { fill: '#211a36', fill2: '#171128', dots: true });
    const unit = (kw + gap);
    const keys = [];
    rows.forEach((row, r) => {
      let cx = gx;
      row.forEach((k, c) => {
        const w = Math.round(k.w * unit) - gap, x = cx, y = gy + r * (kh + gap);
        keys.push({ k, r, c, x, y, w, h: kh });
        cx += w + gap;
      });
    });
    const last = keys[keys.length - 1]; last.w = gx + gw - last.x;
    // ---- input
    if (live && m.done < 0) {
      const moved = !m.lp || m.lp[0] !== ui.ptr.x || m.lp[1] !== ui.ptr.y; m.lp = [ui.ptr.x, ui.ptr.y];
      for (const K of keys) if (ui.inside(K.x, K.y, K.w, K.h)) { if (moved) { m.sel = { r: K.r, c: K.c }; m.nav = false; } if (ui.ptr.released) { ui.ptr.released = false; m.sel = { r: K.r, c: K.c }; press(K.k); } }
      const move = (dr, dc) => {
        m.nav = true; let { r, c } = m.sel;
        if (dr) { const curX = keys.find((K) => K.r === r && K.c === c); r = (r + dr + rows.length) % rows.length; const tx = curX ? curX.x + curX.w / 2 : 0; let best = null; for (const K of keys) if (K.r === r && (!best || Math.abs(K.x + K.w / 2 - tx) < Math.abs(best.x + best.w / 2 - tx))) best = K; c = best.c; }
        if (dc) c = (c + dc + rows[r].length) % rows[r].length;
        m.sel = { r, c };
      };
      const typed = ui.typed && ui.typed.length ? ui.typed : null;
      const evts = typed || Object.keys(ui.keys).filter((k) => ui.keys[k] === 'pressed');
      for (const e of evts) {
        if (e === 'Backspace' || e === 'Delete') { del(); m.flash = { k: rows[rows.length - 1][2], t: 0 }; }
        else if (e === 'Enter') { if (m.nav) { const K = rows[m.sel.r][m.sel.c]; press(K); } else finish(); }
        else if (e === 'ArrowLeft') move(0, -1); else if (e === 'ArrowRight') move(0, 1);
        else if (e === 'ArrowUp') move(-1, 0); else if (e === 'ArrowDown') move(1, 0);
        else if (e === 'Shift' || e === 'CapsLock') { /* real case comes with the key */ }
        else if (e === ' ') { if (m.nav) press(rows[m.sel.r][m.sel.c]); else add(' '); }
        else if (e.length === 1 && allowed(e)) { m.nav = false; add(e); }
        if (m.done >= 0) break;
      }
    }
    // ---- draw keys
    for (const K of keys) {
      const sel = m.sel.r === K.r && m.sel.c === K.c, over = ui.inside(K.x, K.y, K.w, K.h), fl = m.flash && m.flash.k === K.k && m.flash.t < 0.12;
      const down = (over && ui.ptr.down) || fl;
      const k = K.k;
      let label = '', st = { over, down, sel };
      if (k.type === 'ch') label = m.upper ? k.ch.toUpperCase() : k.ch.toLowerCase();
      else if (k.type === 'shift') { label = m.upper ? 'abc' : 'ABC'; st.accent = T.cyan; st.tint = true; st.mini = K.w < 40; }
      else if (k.type === 'space') { label = 'SPACE'; st.mini = true; st.tint = true; }
      else if (k.type === 'del') { label = K.w >= 40 ? 'DEL' : ''; st.icon = 'back'; st.accent = T.coral; st.tint = true; st.mini = true; st.iconTint = T.coral; }
      else if (k.type === 'ok') { label = 'OK'; st.icon = 'check'; st.accent = T.green; st.tint = true; }
      key(ui, K.x, K.y, K.w, K.h, label, st);
      if (sel) brackets(ui, K.x, K.y + (down ? 1 : 0), K.w, K.h - 2, k.type === 'ok' ? T.green : T.amber, t);
    }
    if (!narrow && gy + rowsN * (kh + gap) + 8 + 13 < H) helpRow(ui, H - 17, [['Enter', 'done'], ['Bksp', 'delete'], [['←', '↑', '↓', '→'], 'move']]);
    // ---- confirm flourish, then resolve
    if (m.done >= 0) {
      m.done += dt;
      const k = clamp01(m.done / 0.35);
      blendRect(s, 0, 0, W, H, '#ffffff', Math.sin(k * Math.PI) * 0.35);
      if (m.done >= 0.35) ui.closeModal(m, m.result);
    }
  };
  return m;
}

// ------------------------------------------------------------------ card picker
// o: { title, sub, cards: [{ label, sub, color, icon, art: 'boy'|'girl', draw(ui, x, y, w, h) }], pick, confirm (button label) }
export function pickCardsScreen(ui, o, resolve) {
  const cards = o.cards || [];
  const m = { capture: true, resolve, sel: Math.max(0, Math.min(cards.length - 1, o.pick || 0)), lift: cards.map(() => 0), lp: null, done: -1 };
  m.draw = (ui, dt, live) => {
    const W = ui.w, H = ui.h, s = ui.s, t = m.t, n = Math.max(1, cards.length);
    backdrop(ui, t, { top: '#21163e', mid: '#150f2a' });
    const y0 = title(ui, o.title || 'Choose', 10, { sub: o.sub });
    const gap = W < 300 ? 6 : 12, bottom = H - 30;
    let ch = Math.min(bottom - y0 - 14, 178), cw = Math.min(Math.floor((W - 20 - (n - 1) * gap) / n), Math.round(ch * 0.74));
    ch = Math.min(ch, Math.round(cw * 1.5));
    const total = n * cw + (n - 1) * gap, cx0 = (W - total) >> 1, cy = y0 + 8 + Math.max(0, ((bottom - y0 - 8 - ch) >> 1));
    // input
    if (live && m.done < 0) {
      const moved = !m.lp || m.lp[0] !== ui.ptr.x || m.lp[1] !== ui.ptr.y; m.lp = [ui.ptr.x, ui.ptr.y];
      const ev = (ui.typed && ui.typed.length ? ui.typed : Object.keys(ui.keys).filter((k) => ui.keys[k] === 'pressed'));
      for (const e of ev) {
        if (e === 'ArrowLeft' || e === 'a' || e === 'A') m.sel = (m.sel + n - 1) % n;
        else if (e === 'ArrowRight' || e === 'd' || e === 'D') m.sel = (m.sel + 1) % n;
        else if (e === 'Enter' || e === ' ' || e === 'z') m.done = 0;
        else if (/^[1-9]$/.test(e) && +e <= n) { m.sel = +e - 1; m.done = 0; }
      }
      for (let i = 0; i < n; i++) {
        const x = cx0 + i * (cw + gap);
        if (ui.inside(x, cy - 6, cw, ch + 6)) { if (moved) m.sel = i; if (ui.ptr.released) { ui.ptr.released = false; if (m.sel === i) m.done = 0; else m.sel = i; } }
      }
    }
    for (let i = 0; i < n; i++) m.lift[i] += ((i === m.sel ? 1 : 0) - m.lift[i]) * Math.min(1, dt * 12);
    for (let i = 0; i < cards.length; i++) {
      const x = cx0 + i * (cw + gap), y = cy - Math.round(m.lift[i] * 6), sel = i === m.sel;
      drawCard(ui, x, y, cw, ch, cards[i], sel, t, m.done >= 0 && sel ? m.done : -1);
      if (!sel) dimRect(s, x - 1, y - 1, cw + 4, ch + 4, 0.5);
      else {
        tri(s, x + (cw >> 1) - 3, y - 11 + Math.round(Math.abs(Math.sin(t * 5)) * 2), 'down', 3, T.amber);
        const k = (t * 0.8) % 1; sparkle(s, x + 3 + Math.round(k * (cw - 6)), y + 1, T.amberL, 1 - k);
        sparkle(s, x + cw - 3, y + ch - 2 - Math.round(((t * 0.6 + 0.5) % 1) * (ch - 4)), T.cyanL, ((t * 0.6 + 0.5) % 1));
      }
    }
    // confirm button
    const bw = 96, bx = (W - bw) >> 1, by = H - 25;
    if (live && m.done < 0 && ui.button(bx, by, bw, 19, o.confirm || 'Confirm', { color: T.amber, icon: 'check', modal: true })) m.done = 0;
    else if (!live || m.done >= 0) ui.button(bx, by, bw, 19, o.confirm || 'Confirm', { color: T.amber, icon: 'check', modal: true, active: true });
    if (W >= 360) { ui.keycap(bx - 34, by + 3, '←'); ui.keycap(bx - 20, by + 3, '→'); ui.keycap(bx + bw + 8, by + 3, 'Enter'); }
    if (m.done >= 0) {
      m.done += dt;
      if (m.done >= 0.45) ui.closeModal(m, m.sel);
    }
  };
  return m;
}

function dimRect(s, x, y, w, h, a) {
  const d = s.data;
  for (let j = Math.max(0, y); j < Math.min(s.h, y + h); j++) for (let i = Math.max(0, x); i < Math.min(s.w, x + w); i++) {
    const k = j * s.w + i, v = d[k]; if (!(v >>> 24)) continue;
    const r = (v & 255) * (1 - a) + 12 * a, g = ((v >>> 8) & 255) * (1 - a) + 8 * a, b = ((v >>> 16) & 255) * (1 - a) + 24 * a;
    d[k] = ((v & 0xff000000) | (b << 16) | (g << 8) | r) >>> 0;
  }
}
function drawCard(ui, x, y, w, h, card, sel, t, out) {
  const s = ui.s, col = card.color || T.cyan;
  frame(ui, x, y, w, h, { fill: sh(col, -1.7), fill2: sh(col, -2.3), edge: sel ? mx(col, '#ffffff', 0.15) : sh(col, -0.6), edgeL: mx(col, '#ffffff', sel ? 0.6 : 0.3), accent: sel ? T.gold : T.brass, ornate: sel, gem: T.amber, gem2: col });
  const ax = x + 6, ay = y + 6, aw = w - 12, ah = Math.round(h * 0.68);
  // art window: colour gradient with a slowly turning sunburst
  gradFill(s, ax, ay, aw, ah, [mx(col, '#ffffff', 0.35), col, sh(col, -1.1)], 0);
  const ccx = ax + aw / 2, ccy = ay + ah * 0.58, rayC = P(mx(col, '#ffffff', 0.32));
  for (let j = 0; j < ah; j++) for (let i = 0; i < aw; i++) {
    const a = Math.atan2(j + ay - ccy, i + ax - ccx) + t * (sel ? 0.35 : 0.1);
    if ((((a / Math.PI) * 8 + 16) | 0) % 2 === 0 && bayer(ax + i, ay + j) < 0.35) s.data[(ay + j) * s.w + ax + i] = rayC;
  }
  ui.clip(ax, ay, aw, ah, () => {
    if (card.draw) card.draw(ui, ax, ay, aw, ah);
    else defaultArt(ui, ax, ay, aw, ah, card, t, sel);
  });
  // art window frame
  const K = P(T.ink);
  s.hline(ax - 1, ax + aw, ay - 1, K); s.hline(ax - 1, ax + aw, ay + ah, K); s.vline(ax - 1, ay - 1, ay + ah, K); s.vline(ax + aw, ay - 1, ay + ah, K);
  s.hline(ax, ax + aw - 1, ay, mx(col, '#ffffff', 0.55));
  // name plate
  const ly = ay + ah + 4, lh = h - (ly - y) - 6;
  const big = ui.tw(card.label || '') * 2 + 8 < w && lh >= 26;
  if (big) ui.text(card.label || '', x + (w >> 1), ly + 3, null, { align: 'center', scale: 2, outline: T.ink, grad: sel ? ['#ffffff', T.amberL] : ['#e8e0f8', T.dim] });
  else ui.text(card.label || '', x + (w >> 1), ly + 3, sel ? '#ffffff' : T.dim, { align: 'center', bold: true, shadow: T.ink });
  if (card.sub) { const sy = ly + (big ? 20 : 13); for (const [i, line] of ui.wrap(card.sub, w - 12, { mini: true }).slice(0, 2).entries()) ui.text(line.toUpperCase(), x + (w >> 1), sy + i * 7, sel ? T.cyan : T.textD, { align: 'center', mini: true }); }
  if (out >= 0) { const k = clamp01(out / 0.45); blendRect(s, x, y, w, h, '#ffffff', Math.sin(k * Math.PI) * 0.7); }
}

function defaultArt(ui, x, y, w, h, card, t, sel) {
  const s = ui.s, col = card.color || T.cyan;
  const kind = card.art || (/\bboy\b|\bmale\b|\bhe\b/i.test(card.label || '') ? 'boy' : /\bgirl\b|\bfemale\b|\bshe\b/i.test(card.label || '') ? 'girl' : null);
  const bob = sel ? Math.round(Math.sin(t * 3) * 1) : 0;
  // floor shadow
  for (let j = -2; j <= 2; j++) { const hw = Math.round(Math.sqrt(Math.max(0, 1 - (j * j) / 6)) * w * 0.3); for (let i = -hw; i <= hw; i++) if (bayer(x + w / 2 + i, y + h - 6 + j) < 0.6) s.px(Math.round(x + w / 2 + i), y + h - 6 + j, sh(col, -1.6)); }
  if (kind) { drawBust(ui, Math.round(x + w / 2), y + h + 1 + bob, kind, col, Math.min(1, Math.max(0.6, Math.min(w, h) / 70))); return; }
  if (card.icon) {
    const sc = Math.max(2, Math.min(4, Math.floor(Math.min(w, h) / 22)));
    ball(s, Math.round(x + w / 2), Math.round(y + h / 2) + bob, Math.round(sc * 9), mx(col, '#ffffff', 0.25));
    drawBig(s, card.icon, Math.round(x + w / 2 - 6 * sc), Math.round(y + h / 2 - 6 * sc) + bob, null, { scale: sc });
    return;
  }
  const r = Math.round(Math.min(w, h) * 0.3);
  ball(s, Math.round(x + w / 2), Math.round(y + h / 2) + bob, r, mx(col, '#ffffff', 0.2));
  ui.text((card.label || '?')[0].toUpperCase(), Math.round(x + w / 2) + 1, Math.round(y + h / 2 - 10) + bob, '#ffffff', { align: 'center', scale: 3, outline: sh(col, -2) });
}

// procedural chibi bust (original design): hair, face, eyes, clothes in the card colour. (cx, by) = bottom centre.
const bustCache = new Map();
export function drawBust(ui, cx, by, kind, color, k = 1) {
  const key = kind + color;
  let S = bustCache.get(key);
  if (!S) { S = makeBust(kind, color); bustCache.set(key, S); }
  ui.s.blit(S, cx - (S.w >> 1), by - S.h);
}
function makeBust(kind, color) {
  const S = new Surf(56, 60), girl = kind === 'girl';
  const hair = girl ? '#b0487a' : '#47387a', hairL = sh(hair, 1), hairD = sh(hair, -0.9), hairH = mx(hair, '#ffffff', 0.55);
  const skin = '#ffd9bc', skinD = '#efae8e', skinL = '#fff0e2';
  const cloth = color, clothD = sh(color, -0.9), clothL = mx(color, '#ffffff', 0.35);
  const cx = 28, hy = 27;
  const ell = (x0, y0, rx, ry, c, f) => { for (let j = Math.floor(-ry); j <= ry; j++) for (let i = Math.floor(-rx); i <= rx; i++) if ((i * i) / (rx * rx) + (j * j) / (ry * ry) <= 1 && (!f || f(x0 + i, y0 + j))) S.px(x0 + i, y0 + j, c); };
  // back hair
  if (girl) { ell(cx, hy + 1, 17, 16, hair); for (let y = hy; y < 52; y++) { const sw = 4 + Math.round((y - hy) * 0.08); for (let i = 0; i < sw; i++) { S.px(cx - 17 + i + (y > 44 ? 1 : 0), y, i < 2 ? hairD : hair); S.px(cx + 17 - i - (y > 44 ? 1 : 0), y, i < 2 ? hairD : hair); } } }
  else ell(cx, hy - 1, 15, 14, hair);
  // body / shoulders
  for (let y = 44; y < 60; y++) { const hw = Math.min(26, 9 + Math.round((y - 44) * 1.25)); for (let i = -hw; i <= hw; i++) S.px(cx + i, y, y === 44 + 0 ? clothL : i > hw - 4 ? clothD : i < -hw + 3 ? clothL : cloth); }
  // collar
  for (let y = 44; y < 50; y++) { const hw = 50 - y; for (let i = -hw; i <= hw; i++) if (Math.abs(i) < 6) S.px(cx + i, y, y < 46 ? '#f4eeff' : mx('#f4eeff', cloth, 0.2)); }
  for (let y = 44; y < 52; y++) { const hw = Math.max(0, 5 - (y - 44)); for (let i = -hw; i <= hw; i++) S.px(cx + i, y, skinD); }
  if (girl) { // ribbon
    for (const [dx, dy, c] of [[-3, 0, '#ff5a7a'], [-2, -1, '#ff5a7a'], [-2, 1, '#ff5a7a'], [-1, 0, '#d03a5a'], [0, 0, '#ffd0e0'], [1, 0, '#d03a5a'], [2, -1, '#ff5a7a'], [2, 1, '#ff5a7a'], [3, 0, '#ff5a7a'], [-1, 2, '#d03a5a'], [1, 2, '#d03a5a']]) S.px(cx + dx, 49 + dy, c);
  } else { S.vline(cx - 7, 50, 59, '#f4eeff'); S.vline(cx + 7, 50, 59, '#f4eeff'); S.px(cx - 7, 56, '#c8c0e0'); S.px(cx + 7, 56, '#c8c0e0'); }
  // neck + head
  S.rect(cx - 3, hy + 9, 7, 7, skinD);
  ell(cx, hy, 12, 11.5, skin);
  ell(cx + 3, hy + 3, 9, 8, skinD, (x, y) => (x - cx) + (y - hy) * 0.6 > 8);
  ell(cx - 4, hy - 4, 5, 4, skinL);
  S.px(cx - 12, hy + 1, skinD); S.px(cx - 13, hy + 1, skin); S.px(cx + 12, hy + 1, skinD); S.px(cx + 13, hy + 1, skinD);
  // eyes (tall anime eyes with a highlight), blush, mouth
  const iris = girl ? '#7a4ad8' : '#2c8aa8';
  for (const ex of [cx - 6, cx + 4]) {
    S.rect(ex, hy - 1, 3, 6, '#1c1230');
    S.rect(ex, hy + 2, 3, 3, iris); S.px(ex + 1, hy + 4, mx(iris, '#ffffff', 0.4));
    S.px(ex, hy, '#ffffff'); S.px(ex + 1, hy, '#ffffff'); S.px(ex, hy + 1, '#ffffff');
    if (girl) { S.px(ex - 1, hy - 1, '#1c1230'); S.px(ex + 3, hy - 1, '#1c1230'); S.px(ex + (ex < cx ? -1 : 3), hy - 2, '#1c1230'); }
  }
  S.hline(cx - 8, cx - 6, hy + 6, '#ff9aaa'); S.hline(cx + 5, cx + 7, hy + 6, '#ff9aaa');
  S.px(cx - 1, hy + 7, '#8a3a4a'); S.px(cx, hy + 8, '#8a3a4a'); S.px(cx + 1, hy + 7, '#8a3a4a');
  // front hair: cap + bangs
  ell(cx, hy - 6, 14, 8, hair, (x, y) => y <= hy - 4);
  for (let x = cx - 12; x <= cx + 12; x++) {
    const p = ((x - cx + 40) * 5) % 7, len = girl ? (x < cx - 2 ? 6 + (p % 3) : 3 + (p % 3)) : 3 + (p % 4);
    for (let j = 0; j < len; j++) if (Math.abs(x - cx) < 12 - j * 0.2) S.px(x, hy - 5 + j, j === len - 1 ? hairD : hair);
  }
  if (girl) { for (let j = 0; j < 14; j++) { S.px(cx - 12, hy - 4 + j, hairD); S.px(cx - 13, hy - 3 + j, hair); S.px(cx + 12, hy - 4 + j, hairD); S.px(cx + 13, hy - 3 + j, hair); } }
  else for (const [sx, sy, dx] of [[cx - 12, hy - 10, -1], [cx - 7, hy - 15, -1], [cx, hy - 17, 0], [cx + 7, hy - 15, 1], [cx + 12, hy - 10, 1]]) for (let j = 0; j < 5; j++) for (let i = -2 + Math.floor(j / 2); i <= 2 - Math.floor(j / 2); i++) S.px(sx + i + dx * (4 - j), sy - j + 4, j > 3 ? hairL : hair);
  // anime hair shine arc
  for (let i = -8; i <= 8; i++) { const yy = hy - 9 - Math.round(Math.sqrt(Math.max(0, 64 - i * i)) * 0.35); if ((i + 20) % 5 < 3) S.px(cx + i, yy, hairH); S.px(cx + i, yy + 1, hairL); }
  // girl: hair clip (star) + a playful ahoge strand
  if (girl) { for (const [dx, dy] of [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]]) S.px(cx + 8 + dx, hy - 7 + dy, '#ffd75a'); S.px(cx + 8, hy - 7, '#ffffff'); }
  for (let j = 0; j < 5; j++) S.px(cx + 1 + (j > 2 ? j - 2 : 0), hy - 14 - j, hair);
  S.outline(T.ink);
  return S;
}
void easeOut; void easeOutBack;
