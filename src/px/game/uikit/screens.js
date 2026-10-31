// Full-screen modal screens over the TokoPhone wallpaper: name entry (a candy-key keyboard + physical
// typing) and the big card picker (2–3 glossy cards with emblem medallions).
// No human figures are ever drawn here: default card art is a symbol emblem.
// Each returns a modal object for PixelUI.openModal: { capture, draw(ui, dt, live), resolve }.
import { hasGlyph } from '../../font.js';
import { T, sh, mx, clamp01, boing } from './theme.js';
import { rr, circle, vgrad, rgba } from './gfx.js';
import { frame, candy, backdrop, tri, sparkle, blendRect, ball } from './frame.js';
import { roundButton } from './widgets.js';
import { drawBig, drawEmblem as emblemDraw } from './icons.js';

// ------------------------------------------------------------------ shared pieces
function title(ui, str, y, o = {}) {
  const W = ui.w, big = ui.tw(str, { bold: true }) * 2 + 24 < W;
  ui.text(str, W / 2, y, null, { align: 'center', scale: big ? 2 : 1.3, bold: true, outline: T.ink, grad: ['#ffffff', '#fff3b8', T.amber] });
  const ly = y + (big ? 18 : 12) + 3;
  for (let i = -1; i <= 1; i++) ball(ui.s, W / 2 + i * 9, ly, 2, [T.pink, T.amber, T.cyan][i + 1]);
  if (o.sub) ui.text(o.sub, W / 2, ly + 6, '#ffffff', { align: 'center', mini: true, bold: true, outline: T.ink });
  return ly + (o.sub ? 14 : 6);
}
// a candy key; state: { over, down, sel, accent, tint, icon, iconTint, mini, textColor }
function key(ui, x, y, w, h, label, st = {}) {
  const col = st.tint ? st.accent || T.blue : '#ffffff';
  candy(ui, x, y, w, h, { color: col, state: st.down ? 2 : st.over || st.sel ? 1 : 0, lip: 2, r: 4, active: st.sel });
  const fy = y + (st.down ? 1 : 0), fh = h - 2, light = !st.tint;
  if (st.icon) drawBig(ui.s, st.icon, x + (w - 12) / 2 + (label ? -ui.tw(label, { mini: true }) / 2 - 2 : 0), fy + (fh - 12) / 2, st.iconTint || null, { shadow: false });
  if (label) ui.text(label, x + w / 2 + (st.icon ? 7 : 0), fy + (fh - (st.mini ? 5 : 7)) / 2, light ? T.paperText : '#ffffff', { align: 'center', mini: st.mini, bold: true, outline: light ? null : mx(col, T.ink, 0.7) });
}
// animated corner brackets around a rect (selection cursor)
function brackets(ui, x, y, w, h, c, t) {
  const g = ui.g, o = Math.abs(Math.sin(t * 5)) * 1.5 + 1.5, L = 4;
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [lw, col] of [[3, T.ink], [1.6, c]]) {
    g.strokeStyle = typeof col === 'string' ? col : '#fff'; g.lineWidth = lw; g.beginPath();
    for (const [cx, cy, dx, dy] of [[x - o, y - o, 1, 1], [x + w + o, y - o, -1, 1], [x - o, y + h + o, 1, -1], [x + w + o, y + h + o, -1, -1]]) { g.moveTo(cx + dx * L, cy); g.lineTo(cx, cy); g.lineTo(cx, cy + dy * L); }
    g.stroke();
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
    frame(ui, fx, fy, fw, fh, { paper: '#ffffff', leaves: true, r: 9 });
    ui.bigIcon(o.icon || 'phone', fx + 6, fy + 7, null, { shadow: false });
    const tx0 = fx + 22;
    if (m.replace && m.value) ui.rrect(tx0 - 2, fy + 7, m.value.length * slot + 1, 12, mx('#ffffff', T.cyan, 0.35), 3);
    for (let i = 0; i < max; i++) {
      const cx = tx0 + i * slot, cur = i === Math.min(m.value.length, max - 1) && !m.replace;
      ui.rrect(cx, fy + 19, 7, 1.4, cur ? T.blue : '#c8cce4', 0.7);
      if (i < m.value.length) {
        const pop = i === m.value.length - 1 && m.pop < 0.12 ? -1.5 : 0;
        ui.text(m.value[i], cx + 3.5, fy + 9 + pop, T.paperText, { bold: true, align: 'center' });
      } else if (cur && ((t * 2.2) | 0) % 2 === 0) ui.rrect(cx, fy + 9, 7, 8, mx('#ffffff', T.cyan, 0.5), 2);
    }
    // ---- keyboard layout
    const gw = cols * kw + (cols - 1) * gap, gx = (W - gw) >> 1, gy = fy + fh + 14;
    const rows = lettersU.map((r) => [...r].map((ch) => ({ type: 'ch', ch, w: 1 })));
    rows.push([{ type: 'shift', w: 2.5 }, { type: 'space', w: cols - 2.5 - 2.5 - 2.5 }, { type: 'del', w: 2.5 }, { type: 'ok', w: 2.5 }].map((k) => k));
    frame(ui, gx - 7, gy - 6, gw + 14, rowsN * (kh + gap) - gap + 12, { fill: T.phone, r: 9 });
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
      else if (k.type === 'shift') { st.icon = 'up'; st.accent = m.upper ? T.green : T.cyan; st.tint = true; st.iconTint = m.upper ? '#ffffff' : null; }
      else if (k.type === 'space') { st.tint = true; st.accent = T.blue; }
      else if (k.type === 'del') { st.icon = 'back'; st.accent = T.coral; st.tint = true; st.iconTint = null; }
      else if (k.type === 'ok') { st.icon = 'check'; st.accent = T.green; st.tint = true; st.iconTint = null; }
      key(ui, K.x, K.y, K.w, K.h, label, st);
      if (k.type === 'space') { const sy = K.y + (down ? 1 : 0) + ((K.h - 2) >> 1); ui.rrect(K.x + K.w / 2 - 10, sy + 1, 20, 1.4, '#ffffff', 0.7); ui.rrect(K.x + K.w / 2 - 10, sy - 1, 1.4, 3, '#ffffff', 0.7); ui.rrect(K.x + K.w / 2 + 8.6, sy - 1, 1.4, 3, '#ffffff', 0.7); }
      if (sel) brackets(ui, K.x, K.y + (down ? 1 : 0), K.w, K.h - 2, k.type === 'ok' ? T.leaf : T.amber, t);
    }
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
// o: { title, sub, cards: [{ label, sub, color, icon, art ('boy' → star emblem, 'girl' → heart emblem), draw(ui, x, y, w, h) }], pick, confirm (button label) }
export function pickCardsScreen(ui, o, resolve) {
  const cards = o.cards || [];
  const m = { capture: true, resolve, sel: Math.max(0, Math.min(cards.length - 1, o.pick || 0)), lift: cards.map(() => 0), lp: null, done: -1, pt: cards.map(() => 9) };
  m.draw = (ui, dt, live) => {
    const W = ui.w, H = ui.h, s = ui.s, t = m.t, n = Math.max(1, cards.length);
    backdrop(ui, t);
    const tH = (ui.tw(o.title || 'Choose', { bold: true }) * 2 + 24 < W ? 25 : 19) + (o.sub ? 12 : 5);
    const gap = W < 300 ? 6 : 14, bottom = H - 36;
    let ch = Math.min(bottom - 10 - tH - 14, 178), cw = Math.min(Math.floor((W - 20 - (n - 1) * gap) / n), Math.round(ch * 0.74));
    ch = Math.min(ch, Math.round(cw * 1.5));
    const top = Math.max(10, Math.round((bottom - (tH + 14 + ch)) / 2));
    const y0 = title(ui, o.title || 'Choose', top, { sub: o.sub });
    const total = n * cw + (n - 1) * gap, cx0 = (W - total) / 2, cy = y0 + 14;
    if (live && m.done < 0) {
      const moved = !m.lp || m.lp[0] !== ui.ptr.x || m.lp[1] !== ui.ptr.y; m.lp = [ui.ptr.x, ui.ptr.y];
      const ev = (ui.typed && ui.typed.length ? ui.typed : Object.keys(ui.keys).filter((k) => ui.keys[k] === 'pressed'));
      const prev = m.sel;
      for (const e of ev) {
        if (e === 'ArrowLeft' || e === 'a' || e === 'A') m.sel = (m.sel + n - 1) % n;
        else if (e === 'ArrowRight' || e === 'd' || e === 'D') m.sel = (m.sel + 1) % n;
        else if (e === 'Enter' || e === ' ' || e === 'z') m.done = 0;
        else if (/^[1-9]$/.test(e) && +e <= n) { m.sel = +e - 1; m.done = 0; }
      }
      for (let i = 0; i < n; i++) {
        const x = cx0 + i * (cw + gap);
        if (ui.inside(x, cy - 6, cw, ch + 6)) { if (moved) m.sel = i; if (ui.ptr.pressed) ui.click('ui_tap'); if (ui.ptr.released) { ui.ptr.released = false; if (m.sel === i) m.done = 0; else m.sel = i; } }
      }
      if (m.sel !== prev) { m.pt[m.sel] = 0; ui.click('ui_tap', { vol: 0.4, pitch: 1.3 }); }
      if (m.done === 0) ui.click('ui_tap', { vol: 0.9, pitch: 0.9 });
    }
    for (let i = 0; i < n; i++) { m.lift[i] += ((i === m.sel ? 1 : 0) - m.lift[i]) * Math.min(1, dt * 12); m.pt[i] += dt; }
    for (let i = 0; i < cards.length; i++) {
      const x = cx0 + i * (cw + gap), y = cy - m.lift[i] * 7, sel = i === m.sel, b = m.pt[i] < 0.7 ? Math.exp(-7 * m.pt[i]) * Math.sin(m.pt[i] * 24) * 0.05 : 0;
      const g = ui.g; g.save(); g.translate(x + cw / 2, y + ch); g.scale(1 + b, 1 - b); g.translate(-(x + cw / 2), -(y + ch));
      drawCard(ui, x, y, cw, ch, cards[i], sel, t, m.done >= 0 && sel ? m.done : -1);
      if (!sel) { ui.fill('rgba(20,16,56,0.45)'); rr(g, x - 1, y - 1, cw + 2, ch + 2, 9); g.fill(); ui._fs = null; }
      g.restore(); ui._fs = null; ui._font = null;
      if (sel) { tri(s, x + cw / 2 - 3, y - 12 + Math.abs(Math.sin(t * 5)) * 2, 'down', 3, T.amber); const k = (t * 0.8) % 1; sparkle(s, x + 3 + k * (cw - 6), y + 1, T.amberL, 1 - k); }
    }
    const r = 12, bcx = W / 2, bcy = H - 19;
    const b = roundButton(ui, bcx, bcy, r, 'check', { modal: true, sel: m.done >= 0, color: T.green, disabled: !live && m.done < 0 });
    if (live && m.done < 0 && b.clicked) m.done = 0;
    if (m.done >= 0) { m.done += dt; if (m.done >= 0.45) ui.closeModal(m, m.sel); }
  };
  return m;
}

function drawCard(ui, x, y, w, h, card, sel, t, out) {
  const g = ui.g, col = card.color || T.cyan;
  frame(ui, x, y, w, h, { fill: mx(col, T.ink, 0.35), edge: sel ? T.amber : null, leaves: sel, r: 10 });
  const ax = x + 6, ay = y + 6, aw = w - 12, ah = Math.round(h * 0.66);
  ui.clip(ax, ay, aw, ah, () => {
    g.fillStyle = vgrad(g, ay, ay + ah, [mx(col, '#ffffff', 0.6), mx(col, '#ffffff', 0.25), col]); ui._fs = null; g.fillRect(ax, ay, aw, ah);
    // a slowly turning sunburst
    const cx = ax + aw / 2, cyy = ay + ah * 0.55, rot = t * (sel ? 0.35 : 0.1), R = Math.max(aw, ah);
    g.fillStyle = 'rgba(255,255,255,0.22)';
    for (let i = 0; i < 12; i++) { const a0 = rot + (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(cx, cyy); g.arc(cx, cyy, R, a0, a0 + Math.PI / 12); g.closePath(); g.fill(); }
    if (card.draw) card.draw(ui, ax, ay, aw, ah);
    else defaultArt(ui, ax, ay, aw, ah, card, t, sel);
  }, 6);
  g.strokeStyle = T.ink; g.lineWidth = 1.4; rr(g, ax, ay, aw, ah, 6); g.stroke();
  const ly = ay + ah + 4, lh = h - (ly - y) - 6;
  const big = ui.tw(card.label || '', { bold: true }) * 1.6 + 8 < w && lh >= 24;
  ui.text(card.label || '', x + w / 2, ly + 3, null, { align: 'center', scale: big ? 1.6 : 1, bold: true, outline: T.ink, grad: sel ? ['#ffffff', T.amberL] : ['#ffffff', '#c8d0f0'] });
  if (card.sub && sel) { const sy = ly + (big ? 17 : 12); for (const [i, line] of ui.wrap(card.sub, w - 12, { mini: true }).slice(0, 2).entries()) ui.text(line, x + w / 2, sy + i * 8, '#ffffff', { align: 'center', mini: true, bold: true }); }
  if (out >= 0) { const k = clamp01(out / 0.45); blendRect(ui.s, x, y, w, h, '#ffffff', Math.sin(k * Math.PI) * 0.7); }
}

// default card art: a medallion with a smooth emblem (never a human figure)
const ART_ICON = { boy: 'star', girl: 'heart', male: 'star', female: 'heart' };
function defaultArt(ui, x, y, w, h, card, t, sel) {
  const g = ui.g, col = card.color || T.cyan, icon = card.icon || ART_ICON[card.art] || null;
  const bob = sel ? Math.sin(t * 3) * 1.5 : 0, cx = x + w / 2, cy = y + h * 0.5 + bob;
  const R = Math.max(14, Math.min(36, Math.floor(Math.min(w, h) * 0.32)));
  ui.fill('rgba(20,16,56,0.25)'); g.beginPath(); g.ellipse(cx, y + h - 7, R * 0.9, 3, 0, 0, Math.PI * 2); g.fill(); ui._fs = null;
  ball(ui.s, cx - 0.5, cy - 0.5, R + 2, '#ffffff');
  ball(ui.s, cx - 0.5, cy - 0.5, R - 1, col);
  if (icon) emblemDraw(ui.s, icon, cx, cy, 4, null, R * 1.5);
  else ui.text((card.label || '?')[0].toUpperCase(), cx, cy - 10, '#ffffff', { align: 'center', scale: 3, bold: true, outline: sh(col, -2) });
  if (sel) for (let i = 0; i < 3; i++) { const a = t * 1.4 + i * 2.1, k = (Math.sin(t * 3 + i) + 1) / 2; sparkle(ui.s, cx + Math.cos(a) * (R + 7), cy + Math.sin(a) * (R + 5), i % 2 ? T.amberL : '#ffffff', k); }
}
// kept API: a big icon as a smooth sticker centred on (cx, cy)
export function drawEmblem(ui, name, cx, cy, scale = 4, tint = null) { emblemDraw(ui.s, name, cx, cy, scale, tint, scale * 7); }
void circle; void rgba; void boing;
