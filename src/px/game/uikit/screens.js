// Full-screen modal screens over a forest-at-dusk backdrop: name entry (a
// birch-key keyboard on a wooden board + physical typing) and the big card
// picker (2–3 wooden cards with symbol medallions).
// No human figures are ever drawn here: default card art is a symbol emblem.
// Each returns a modal object for PixelUI.openModal: { capture, draw(ui, dt, live), resolve }.
import { Surf, P } from '../../surface.js';
import { hasGlyph } from '../../font.js';
import { bayer } from '../../color.js';
import { T, sh, mx, clamp01 } from './theme.js';
import { frame, backdrop, gradFill, tri, sparkle, blendRect, dropShadow, ball, sprig } from './frame.js';
import { roundButton } from './widgets.js';
import { drawBig } from './icons.js';

// ------------------------------------------------------------------ shared pieces
function title(ui, str, y, o = {}) {
  const W = ui.w, big = ui.tw(str) * 2 + 24 < W, s = ui.s;
  if (big) {
    ui.text(str, (W >> 1) + 1, y + 2, '#0c120a', { align: 'center', scale: 2 });
    ui.text(str, W >> 1, y, null, { align: 'center', scale: 2, outline: T.ink, grad: [T.paperL, T.paper, T.amber] });
  } else ui.text(str, W >> 1, y + 3, null, { align: 'center', bold: true, outline: T.ink, grad: [T.paperL, T.amber] });
  const th = big ? 16 : 10;
  // flourish: a twig with leaves growing out from both sides of a little bud
  const tw = Math.min(W - 60, (big ? ui.tw(str) * 2 : ui.tw(str)) + 10), ly = y + th + 5, cx = W >> 1;
  const half = Math.min(28, tw >> 2);
  sprig(s, cx + 3, ly, 1, ui.t, { n: 3, len: half });
  sprig(s, cx - 3, ly, -1, ui.t + 0.7, { n: 3, len: half });
  ball(s, cx, ly, 2, T.berry);
  if (o.sub) ui.text(o.sub, W >> 1, ly + 7, T.paper, { align: 'center', mini: true, outline: T.ink });
  return ly + (o.sub ? 14 : 6);
}
// a birch-wood key with a lip; state: { over, down, sel, accent, tint, icon, iconTint, mini, textColor }
function key(ui, x, y, w, h, label, st = {}) {
  const s = ui.s, acc = st.accent || T.leaf, lip = 2, dy = st.down ? 1 : 0, fh = h - lip;
  dropShadow(s, x, y, w, h, 2, 0, 1, 0.35);
  ui.rrect(x, y + lip, w, h - lip, T.ink, 3);
  ui.rrect(x + 1, y + lip, w - 2, h - lip - 1, mx(T.keySide, st.tint ? acc : T.keySide, 0.35), 2);
  const fy = y + dy, base = st.tint ? mx(T.key, acc, 0.32) : T.key;
  const face = st.sel ? mx(base, T.leafL, 0.35) : st.over ? mx(base, '#ffffff', 0.4) : base;
  ui.rrect(x, fy, w, fh, T.ink, 3);
  ui.rrect(x + 1, fy + 1, w - 2, fh - 2, st.sel ? acc : mx(face, T.keySide, 0.35), 2);
  gradFill(s, x + 2, fy + 2, w - 4, fh - 4, [mx(face, '#ffffff', 0.4), face, mx(face, T.keySide, 0.25)], 1);
  s.hline(x + 3, x + w - 4, fy + 1, st.sel ? mx(acc, '#ffffff', 0.4) : '#ffffff');
  if (st.icon) drawBig(s, st.icon, x + ((w - 12) >> 1) + (label ? -ui.tw(label, { mini: true }) / 2 - 2 : 0) | 0, fy + ((fh - 12) >> 1), st.iconTint || null, { shadow: false });
  if (label) ui.text(label, x + (w >> 1) + (st.icon ? 7 : 0) + 1, fy + ((fh - (st.mini ? 5 : 7)) >> 1), st.textColor || T.paperText, { align: 'center', mini: st.mini, bold: st.sel && !st.mini });
}
// animated corner brackets around a rect (selection cursor)
function brackets(ui, x, y, w, h, c, t) {
  const s = ui.s, o = Math.round(Math.abs(Math.sin(t * 5)) * 1.5) + 1, K = P(T.ink), C = P(c), L = P(mx(c, '#ffffff', 0.5));
  for (const [cx, cy, dx, dy] of [[x - o, y - o, 1, 1], [x + w - 1 + o, y - o, -1, 1], [x - o, y + h - 1 + o, 1, -1], [x + w - 1 + o, y + h - 1 + o, -1, -1]]) {
    for (let i = -1; i <= 3; i++) { s.px(cx + i * dx, cy - dy, K); s.px(cx - dx, cy + i * dy, K); }
    for (let i = 0; i <= 2; i++) { s.px(cx + i * dx, cy, i === 0 ? L : C); s.px(cx, cy + i * dy, i === 0 ? L : C); }
    s.px(cx + 3 * dx, cy, K); s.px(cx, cy + 3 * dy, K); s.px(cx + dx, cy + dy, K);
  }
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
    const help = 0;
    const kh = Math.max(13, Math.min(18, Math.floor((H - 16 - titleH - (o.sub ? 7 : 0) - 34 - 26 - help) / rowsN) - gap));
    const blockH = titleH + (o.sub ? 7 : 0) + 6 + 26 + 14 + rowsN * (kh + gap) + 4;
    const top = Math.max(6, Math.round((H - help - blockH) / 2));
    const y0 = title(ui, o.title || "What's your name?", top, { sub: o.sub });
    // ---- field: a parchment strip in a wooden frame
    const slot = 10, fw = max * slot + 36, fh = 26, fx = ((W - fw) >> 1) + Math.round(Math.sin(m.shake * 60) * m.shake * 8), fy = y0 + 6;
    frame(ui, fx, fy, fw, fh, { paper: true, fill: T.wood, leaves: true, rivets: false });
    ui.bigIcon(o.icon || 'leaf', fx + 6, fy + 7, null, { shadow: false });
    const tx0 = fx + 22;
    if (m.replace && m.value) s.rect(tx0 - 2, fy + 7, m.value.length * slot + 1, 12, mx(T.paper, T.leaf, 0.35));
    for (let i = 0; i < max; i++) {
      const cx = tx0 + i * slot, cur = i === Math.min(m.value.length, max - 1) && !m.replace;
      s.hline(cx, cx + 6, fy + 19, cur ? T.amber2 : mx(T.paper, T.paperE, 0.7));
      if (i < m.value.length) {
        const pop = i === m.value.length - 1 && m.pop < 0.12 ? -1 : 0;
        ui.text(m.value[i], cx, fy + 9 + pop, T.paperText, { bold: true });
      } else if (cur && ((t * 2.2) | 0) % 2 === 0) { s.rect(cx, fy + 9, 6, 8, mx(T.paper, T.amber, 0.45)); s.hline(cx, cx + 6, fy + 19, T.amber); s.hline(cx, cx + 6, fy + 20, T.amber2); }
    }
    // ---- keyboard layout
    const gw = cols * kw + (cols - 1) * gap, gx = (W - gw) >> 1, gy = fy + fh + 14;
    const rows = lettersU.map((r) => [...r].map((ch) => ({ type: 'ch', ch, w: 1 })));
    rows.push([{ type: 'shift', w: 2.5 }, { type: 'space', w: cols - 2.5 - 2.5 - 2.5 }, { type: 'del', w: 2.5 }, { type: 'ok', w: 2.5 }].map((k) => k));
    frame(ui, gx - 7, gy - 6, gw + 14, rowsN * (kh + gap) - gap + 12, { fill: T.panel });
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
      else if (k.type === 'shift') { st.icon = 'up'; st.accent = m.upper ? T.leaf : T.cyan; st.tint = true; st.iconTint = m.upper ? '#ffffff' : null; }
      else if (k.type === 'space') { st.tint = true; st.accent = T.wood; }
      else if (k.type === 'del') { st.icon = 'back'; st.accent = T.coral; st.tint = true; st.iconTint = T.coral2; }
      else if (k.type === 'ok') { st.icon = 'check'; st.accent = T.leaf; st.tint = true; st.iconTint = '#ffffff'; }
      key(ui, K.x, K.y, K.w, K.h, label, st);
      if (k.type === 'space') { const sy = K.y + (down ? 1 : 0) + ((K.h - 2) >> 1); s.hline(K.x + (K.w >> 1) - 10, K.x + (K.w >> 1) + 10, sy + 1, mx(T.paperText, T.key, 0.4)); s.vline(K.x + (K.w >> 1) - 10, sy - 1, sy + 1, mx(T.paperText, T.key, 0.4)); s.vline(K.x + (K.w >> 1) + 10, sy - 1, sy + 1, mx(T.paperText, T.key, 0.4)); }
      if (sel) brackets(ui, K.x, K.y + (down ? 1 : 0), K.w, K.h - 2, k.type === 'ok' ? T.leaf : T.amber, t);
    }
    // ---- confirm flourish, then resolve
    if (m.done >= 0) {
      m.done += dt;
      const k = clamp01(m.done / 0.35);
      blendRect(s, 0, 0, W, H, '#fff6dc', Math.sin(k * Math.PI) * 0.35);
      if (m.done >= 0.35) ui.closeModal(m, m.result);
    }
  };
  return m;
}

// ------------------------------------------------------------------ card picker
// o: { title, sub, cards: [{ label, sub, color, icon, art ('boy' → star emblem, 'girl' → heart emblem), draw(ui, x, y, w, h) }], pick, confirm (button label) }
export function pickCardsScreen(ui, o, resolve) {
  const cards = o.cards || [];
  const m = { capture: true, resolve, sel: Math.max(0, Math.min(cards.length - 1, o.pick || 0)), lift: cards.map(() => 0), lp: null, done: -1 };
  m.draw = (ui, dt, live) => {
    const W = ui.w, H = ui.h, s = ui.s, t = m.t, n = Math.max(1, cards.length);
    backdrop(ui, t);
    const tH = (ui.tw(o.title || 'Choose') * 2 + 24 < W ? 25 : 19) + (o.sub ? 12 : 5);
    const gap = W < 300 ? 6 : 14, bottom = H - 34;
    let ch = Math.min(bottom - 10 - tH - 14, 178), cw = Math.min(Math.floor((W - 20 - (n - 1) * gap) / n), Math.round(ch * 0.74));
    ch = Math.min(ch, Math.round(cw * 1.5));
    const top = Math.max(10, Math.round((bottom - (tH + 14 + ch)) / 2));
    const y0 = title(ui, o.title || 'Choose', top, { sub: o.sub });
    const total = n * cw + (n - 1) * gap, cx0 = (W - total) >> 1, cy = y0 + 14;
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
      }
    }
    // confirm: one big round check button (tapping the lifted card confirms too)
    const r = 11, bcx = W >> 1, bcy = H - 17;
    const b = roundButton(ui, bcx, bcy, r, 'check', { modal: true, sel: m.done >= 0, color: T.leaf, disabled: !live && m.done < 0 });
    if (live && m.done < 0 && b.clicked) m.done = 0;
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
// per-size table of sunburst angles (in ray units), so cards don't call atan2 per pixel per frame
const angCache = new Map();
function angles(aw, ah) {
  const key = aw * 10000 + ah;
  let A = angCache.get(key);
  if (!A) { A = new Float32Array(aw * ah); const cx = aw / 2, cy = ah * 0.58; for (let j = 0; j < ah; j++) for (let i = 0; i < aw; i++) A[j * aw + i] = (Math.atan2(j - cy, i - cx) / Math.PI) * 8; angCache.set(key, A); }
  return A;
}
function drawCard(ui, x, y, w, h, card, sel, t, out) {
  const s = ui.s, col = card.color || T.cyan;
  frame(ui, x, y, w, h, { fill: T.panel, edge: sel ? mx(T.edge, col, 0.25) : T.edge, edgeL: sel ? mx(T.edgeL, T.hi, 0.5) : T.edgeL, leaves: sel, rivets: true });
  const ax = x + 6, ay = y + 6, aw = w - 12, ah = Math.round(h * 0.68);
  // art window: colour gradient with a slowly turning sunburst
  gradFill(s, ax, ay, aw, ah, [mx(T.sky, '#ffffff', 0.35), mx(T.sky, col, 0.3), mx(T.moss, col, 0.25)], 0);
  const rayC = P(mx(mx(T.sky, col, 0.3), '#ffffff', 0.3)), A = angles(aw, ah), rot = (t * (sel ? 0.35 : 0.1) / Math.PI) * 8 + 16;
  for (let j = 0; j < ah; j++) { const Y = ay + j; if (Y < 0 || Y >= s.h) continue; for (let i = 0; i < aw; i++) { const X = ax + i; if (X >= 0 && X < s.w && ((A[j * aw + i] + rot) | 0) % 2 === 0 && bayer(X, Y) < 0.2 && j < ah * 0.7) s.data[Y * s.w + X] = rayC; } }
  ui.clip(ax, ay, aw, ah, () => {
    if (card.draw) card.draw(ui, ax, ay, aw, ah);
    else defaultArt(ui, ax, ay, aw, ah, card, t, sel);
  });
  // art window frame
  const K = P(T.ink);
  s.hline(ax - 1, ax + aw, ay - 1, K); s.hline(ax - 1, ax + aw, ay + ah, K); s.vline(ax - 1, ay - 1, ay + ah, K); s.vline(ax + aw, ay - 1, ay + ah, K);
  s.hline(ax, ax + aw - 1, ay, mx(T.sky, '#ffffff', 0.6)); s.hline(ax, ax + aw - 1, ay + ah - 1, mx(T.mossD, T.ink, 0.3));
  // name plate
  const ly = ay + ah + 4, lh = h - (ly - y) - 6;
  const big = ui.tw(card.label || '') * 2 + 8 < w && lh >= 26;
  if (big) ui.text(card.label || '', x + (w >> 1), ly + 3, null, { align: 'center', scale: 2, outline: T.ink, grad: sel ? [T.paperL, T.amberL] : [T.paper, T.dim] });
  else ui.text(card.label || '', x + (w >> 1), ly + 3, sel ? T.paperL : T.dim, { align: 'center', bold: true, shadow: T.ink });
  if (card.sub && sel) { const sy = ly + (big ? 20 : 13); for (const [i, line] of ui.wrap(card.sub, w - 12, { mini: true }).slice(0, 2).entries()) ui.text(line.toUpperCase(), x + (w >> 1), sy + i * 7, T.paper, { align: 'center', mini: true }); }
  if (out >= 0) { const k = clamp01(out / 0.45); blendRect(s, x, y, w, h, '#fff6dc', Math.sin(k * Math.PI) * 0.7); }
}

// default card art: a medallion with a smooth, upscaled symbol emblem (never a human figure)
const ART_ICON = { boy: 'star', girl: 'heart', male: 'star', female: 'heart' };
function defaultArt(ui, x, y, w, h, card, t, sel) {
  const s = ui.s, col = card.color || T.cyan;
  const icon = card.icon || ART_ICON[card.art] || null;
  const bob = sel ? Math.round(Math.sin(t * 3) * 1.5) : 0, cx = Math.round(x + w / 2), cy = Math.round(y + h * 0.48) + bob;
  const R = Math.max(14, Math.min(36, Math.floor(Math.min(w, h) * 0.32)));
  // floor glow
  for (let j = -2; j <= 2; j++) { const hw = Math.round(Math.sqrt(Math.max(0, 1 - (j * j) / 6)) * R * 0.9); for (let i = -hw; i <= hw; i++) if (bayer(cx + i, y + h - 8 + j) < 0.55) s.px(cx + i, y + h - 8 + j, mx(T.mossD, T.ink, 0.3)); }
  medallion(s, cx, cy, R, col, t, sel);
  if (icon) drawEmblem(ui, icon, cx, cy, R >= 30 ? 4 : 2);
  else ui.text((card.label || '?')[0].toUpperCase(), cx + 1, cy - 10, '#ffffff', { align: 'center', scale: 3, outline: sh(col, -2) });
  if (sel) for (let i = 0; i < 3; i++) { const a = t * 1.4 + i * 2.1, k = (Math.sin(t * 3 + i) + 1) / 2; sparkle(s, Math.round(cx + Math.cos(a) * (R + 6)), Math.round(cy + Math.sin(a) * (R + 4)), i % 2 ? T.amberL : '#ffffff', k); }
}
// concentric badge: ink rim, brass ring, card-colour disc with a dithered radial glow and tick marks
const medCache = new Map();
function medallion(s, cx, cy, R, col, t, sel) {
  const key = R + col;
  let M = medCache.get(key);
  if (!M) {
    const n = 2 * R + 5; M = new Surf(n, n);
    const K = P(T.ink), B = P(T.wood), BL = P(mx(T.woodL, T.hi, 0.4)), BD = P(T.woodD);
    const inner = mx(col, '#ffffff', 0.3), core = mx(col, '#ffffff', 0.55), edge = sh(col, -0.6);
    for (let j = -R - 2; j <= R + 2; j++) for (let i = -R - 2; i <= R + 2; i++) {
      const d = Math.hypot(i, j), X = i + R + 2, Y = j + R + 2;
      if (d > R + 2.5) continue;
      let v;
      if (d > R + 1.5) v = K;
      else if (d > R - 0.5) v = j < -i * 0.3 ? BL : (j > R * 0.4 ? BD : B);
      else if (d > R - 1.5) v = K;
      else { const f = d / (R - 1.5); v = P(bayer(X, Y) < f * 1.2 - 0.15 ? (f > 0.8 ? edge : col) : (f < 0.35 ? core : inner)); }
      M.data[Y * n + X] = v;
    }
    medCache.set(key, M);
  }
  s.blit(M, cx - R - 2, cy - R - 2);
  for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6 + (sel ? t * 0.2 : 0), X = Math.round(cx + Math.cos(a) * (R - 3)), Y = Math.round(cy + Math.sin(a) * (R - 3)); s.px(X, Y, mx(col, '#ffffff', 0.7)); }
}
// a big icon rendered as a smooth sticker: Scale2x-upscaled (×2 or ×4), then 1px ink, white rim and ink rings
const emblemCache = new Map();
export function emblemSurf(name, scale = 4, tint = null) {
  const key = name + scale + tint;
  let S = emblemCache.get(key);
  if (S) return S;
  const base = new Surf(14, 14);
  drawBig(base, name, 1, 1, tint, { outline: false, shadow: false });
  let up = base; for (let k = 2; k <= scale; k *= 2) up = scale2x(up);
  S = new Surf(up.w + 6, up.h + 6); S.blit(up, 3, 3);
  S.outline(T.ink); S.outline('#ffffff'); S.outline(T.ink);
  emblemCache.set(key, S);
  return S;
}
export function drawEmblem(ui, name, cx, cy, scale = 4, tint = null) {
  const S = emblemSurf(name, scale, tint);
  // drop shadow
  for (let j = 0; j < S.h; j++) for (let i = 0; i < S.w; i++) if (S.data[j * S.w + i] >>> 24) { const X = cx - (S.w >> 1) + i + 1, Y = cy - (S.h >> 1) + j + 2; if (X >= 0 && Y >= 0 && X < ui.s.w && Y < ui.s.h && !(S.data[Math.min(S.h - 1, j + 2) * S.w + Math.min(S.w - 1, i + 1)] >>> 24)) ui.s.blend(X, Y, '#1a0d04', 0.4); }
  ui.s.blit(S, cx - (S.w >> 1), cy - (S.h >> 1));
}
// Scale2x / EPX: doubles pixel art while keeping diagonals crisp
function scale2x(A) {
  const B = new Surf(A.w * 2, A.h * 2), w = A.w, h = A.h, d = A.data, o = B.data;
  const at = (x, y) => d[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P0 = d[y * w + x], a = at(x, y - 1), b = at(x + 1, y), c = at(x - 1, y), e = at(x, y + 1);
    const i = y * 2 * B.w + x * 2;
    o[i] = c === a && c !== e && a !== b ? a : P0;
    o[i + 1] = a === b && a !== c && b !== e ? b : P0;
    o[i + B.w] = e === c && e !== b && c !== a ? c : P0;
    o[i + B.w + 1] = b === e && b !== a && e !== c ? e : P0;
  }
  return B;
}
