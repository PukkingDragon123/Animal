// Full-screen modal screens in the pixel-GUI style, over a striped backdrop: name entry (a keyboard of
// cream keys with lips in a copper-framed board, a raised name plate with letter slots, physical typing,
// a sparkle for every letter) and the generic card picker (copper-framed cards with emblem medallions).
// No human figures are ever drawn here. Each returns a modal object for PixelUI.openModal.
import { hasGlyph } from '../../font.js';
import { T, sh, mx, clamp01, boing, squash } from './theme.js';
import { frame, knob, backdrop, tri, sparkle, blendRect, ball, gem, woodRing } from './frame.js';
import { roundButton } from './widgets.js';
import { drawBig, drawEmblem as emblemDraw } from './icons.js';

const R = Math.round;
// ------------------------------------------------------------------ shared pieces
export function title(ui, str, y, o = {}) {
  const W = ui.w, big = ui.tw(str, { scale: 2 }) + 24 < W;
  ui.text(str, W / 2, y, '#ffffff', { align: 'center', scale: big ? 2 : 1, bold: true, outline: T.ink, shadow: T.ink, grad: ['#fff0c0', '#ffffff'] });
  const ly = y + (big ? 14 : 9) + 5;
  gem(ui.s, W / 2 - 12, ly, T.copperL, 2); gem(ui.s, W / 2, ly, T.amber, 3); gem(ui.s, W / 2 + 12, ly, T.copperL, 2);
  if (o.sub) ui.text(o.sub, W / 2, ly + 6, '#ffffff', { align: 'center', mini: true, bold: true, outline: T.ink });
  return ly + (o.sub ? 14 : 6);
}
// a keyboard key; state: { over, down, sel, accent, tint, icon, iconTint, mini, textColor }
function key(ui, x, y, w, h, label, st = {}) {
  const col = st.tint ? st.accent || T.copper : T.creamL;
  knob(ui, x, y, w, h, { color: col, state: st.down ? 2 : st.over || st.sel ? 1 : 0, lip: 3, r: 2, active: st.sel });
  const fy = y + (st.down ? 2 : st.over || st.sel ? 0 : 0), fh = h - 3, light = !st.tint;
  if (st.icon) drawBig(ui.s, st.icon, R(x + (w - 12) / 2 + (label ? -ui.tw(label, { mini: true }) / 2 - 2 : 0)), R(fy + (fh - 12) / 2), st.iconTint || null, { shadow: false });
  if (label) ui.text(label, R(x + w / 2 + (st.icon ? 7 : 0)), R(fy + (fh - (st.mini ? 5 : 7)) / 2), light ? T.text : '#ffffff', { align: 'center', mini: st.mini, bold: true, outline: light ? null : T.ink });
}
// animated corner brackets around a rect (selection cursor)
function brackets(ui, x, y, w, h, c, t) {
  const o = R(Math.abs(Math.sin(t * 5)) * 1.5) + 2, L = 4, g = ui.g;
  for (const [cx, cy, dx, dy] of [[x - o, y - o, 1, 1], [x + w - 1 + o, y - o, -1, 1], [x - o, y + h - 1 + o, 1, -1], [x + w - 1 + o, y + h - 1 + o, -1, -1]]) {
    ui.fill(T.ink); g.fillRect(Math.min(cx, cx + dx * L) - 1, cy - 1, L + 2, 3); g.fillRect(cx - 1, Math.min(cy, cy + dy * L) - 1, 3, L + 2);
    ui.fill(c); g.fillRect(Math.min(cx, cx + dx * (L - 1)), cy, L, 1); g.fillRect(cx, Math.min(cy, cy + dy * (L - 1)), 1, L);
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
    const narrow = W < 400;
    const lettersU = narrow ? ['ABCDEFGHIJ', 'KLMNOPQRST', "UVWXYZ-.'!", '0123456789'] : ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', "0123456789-.'"];
    const cols = lettersU[0].length, gap = 3, rowsN = lettersU.length + 1;
    const kw = Math.max(16, Math.min(30, Math.floor((W - 40 - (cols - 1) * gap) / cols))), kh = Math.max(16, Math.min(22, Math.floor((H - 190) / rowsN) - gap));
    const y0 = title(ui, o.title || "What's your name?", 12, { sub: o.sub });
    // ---- the trainer license: a card with a portrait slot, the name plate and its letter slots, a stamp
    const slot = 11, fw = Math.max(240, max * slot + 140), fh = 64, bob = R(Math.sin(t * 1.6) * 1), fx = R((W - fw) / 2 + Math.sin(m.shake * 60) * m.shake * 8), fy = y0 + 6 + bob;
    frame(ui, fx, fy, fw, fh, {});
    ui.rect(fx + 5, fy + 5, fw - 10, 9, T.copper); ui.rect(fx + 5, fy + 14, fw - 10, 1, T.copperD);
    ui.text('TOKON TRAINER LICENSE', fx + 10, fy + 7, T.cream, { mini: true, bold: true });
    ui.text('NO. 0001', fx + fw - 10, fy + 7, T.amberL, { mini: true, align: 'right' });
    // the portrait slot holds the TokoPhone (no faces are ever drawn)
    frame(ui, fx + 10, fy + 19, 38, 38, { thin: true, r: 1, fill: T.creamD, shadow: false });
    ui.bigIcon(o.icon || 'phone', fx + 13, fy + 22, null, { scale: 32 / 12 });
    const tx0 = fx + 58;
    ui.text('NAME', tx0, fy + 21, T.dim, { mini: true, bold: true });
    frame(ui, tx0 - 2, fy + 28, max * slot + 12, 22, { thin: true, r: 1, fill: T.creamL, shadow: false });
    const lx = tx0 + 4;
    if (m.replace && m.value) ui.rect(lx - 1, fy + 32, m.value.length * slot, 14, mx(T.creamL, T.amber, 0.4));
    for (let i = 0; i < max; i++) {
      const cx = lx + i * slot, cur = i === Math.min(m.value.length, max - 1) && !m.replace;
      ui.rect(cx, fy + 46, 9, 1, cur ? T.copper : T.creamLine);
      if (i < m.value.length) {
        const pop = i === m.value.length - 1 ? R((1 - boing(m.pop * 2.2)) * -5) : 0;
        ui.text(m.value[i], cx + 5, fy + 35 + pop, T.text, { bold: true, align: 'center' });
        if (i === m.value.length - 1 && m.pop < 0.35) { sparkle(s, cx + 9, fy + 32, T.amber, 1 - m.pop / 0.35); sparkle(s, cx - 1, fy + 44, '#ffffff', 1 - m.pop / 0.35); }
      } else if (cur && ((t * 2.2) | 0) % 2 === 0) ui.rect(cx + 1, fy + 33, 7, 11, mx(T.creamL, T.amber, 0.55));
    }
    ui.text('SAN FRANCISCO', fx + fw - 10, fy + fh - 12, T.dim, { mini: true, align: 'right' });
    // the stamp slams down when you confirm
    if (m.done >= 0) { const k = clamp01(m.done / 0.18), sc2 = 1 + (1 - k) * 1.5, sx = fx + fw - 44, sy = fy + 26; const g = ui.g; g.save(); g.translate(sx, sy); g.scale(sc2, sc2); g.translate(-sx, -sy); g.globalAlpha = Math.min(1, k * 1.5); woodRing(s, sx, sy, 13, { th: 2, fill: '#f6d8d0', color: T.red, shadow: false }); ui.text('OK!', sx, sy - 3, T.red, { bold: true, align: 'center' }); g.restore(); ui._fs = null; }
    // ---- the keyboard board
    const gw = cols * kw + (cols - 1) * gap, gx = R((W - gw) / 2), gy = fy + fh + 18;
    const rows = lettersU.map((r) => [...r].map((ch) => ({ type: 'ch', ch, w: 1 })));
    rows.push([{ type: 'shift', w: 2.5 }, { type: 'space', w: cols - 2.5 - 2.5 - 2.5 }, { type: 'del', w: 2.5 }, { type: 'ok', w: 2.5 }]);
    frame(ui, gx - 10, gy - 9, gw + 20, rowsN * (kh + gap) - gap + 18, { r: 4 });
    const unit = kw + gap, keys = [];
    rows.forEach((row, r) => { let cx = gx; row.forEach((k, c) => { const w = Math.round(k.w * unit) - gap; keys.push({ k, r, c, x: cx, y: gy + r * (kh + gap), w, h: kh }); cx += w + gap; }); });
    const last = keys[keys.length - 1]; last.w = gx + gw - last.x;
    // ---- input
    if (live && m.done < 0) {
      const moved = !m.lp || m.lp[0] !== ui.ptr.x || m.lp[1] !== ui.ptr.y; m.lp = [ui.ptr.x, ui.ptr.y];
      for (const K of keys) if (ui.inside(K.x, K.y, K.w, K.h)) { if (moved) { m.sel = { r: K.r, c: K.c }; m.nav = false; } if (ui.ptr.pressed) ui.click('ui_tap', { vol: 0.6, pitch: 1.1 + (K.c % 5) * 0.05 }); if (ui.ptr.released) { ui.ptr.released = false; m.sel = { r: K.r, c: K.c }; press(K.k); } }
      const move = (dr, dc) => {
        m.nav = true; let { r, c } = m.sel;
        if (dr) { const curX = keys.find((K) => K.r === r && K.c === c); r = (r + dr + rows.length) % rows.length; const tx = curX ? curX.x + curX.w / 2 : 0; let best = null; for (const K of keys) if (K.r === r && (!best || Math.abs(K.x + K.w / 2 - tx) < Math.abs(best.x + best.w / 2 - tx))) best = K; c = best.c; }
        if (dc) c = (c + dc + rows[r].length) % rows[r].length;
        m.sel = { r, c }; ui.click('ui_tap', { vol: 0.3, pitch: 1.5 });
      };
      const typed = ui.typed && ui.typed.length ? ui.typed : null;
      const evts = typed || Object.keys(ui.keys).filter((k) => ui.keys[k] === 'pressed');
      for (const e of evts) {
        if (e === 'Backspace' || e === 'Delete') { del(); m.flash = { k: rows[rows.length - 1][2], t: 0 }; ui.click('ui_back', { vol: 0.5 }); }
        else if (e === 'Enter') { if (m.nav) { const K = rows[m.sel.r][m.sel.c]; press(K); } else finish(); }
        else if (e === 'ArrowLeft') move(0, -1); else if (e === 'ArrowRight') move(0, 1);
        else if (e === 'ArrowUp') move(-1, 0); else if (e === 'ArrowDown') move(1, 0);
        else if (e === 'Shift' || e === 'CapsLock') { /* real case comes with the key */ }
        else if (e === ' ') { if (m.nav) press(rows[m.sel.r][m.sel.c]); else add(' '); }
        else if (e.length === 1 && allowed(e)) { m.nav = false; add(e); ui.click('ui_tap', { vol: 0.5, pitch: 1.2 }); const K = keys.find((q) => q.k.type === 'ch' && q.k.ch.toLowerCase() === e.toLowerCase()); if (K) m.flash = { k: K.k, t: 0 }; }
        if (m.done >= 0) break;
      }
      if (m.done === 0) ui.click('notification', { vol: 0.7 });
    }
    // ---- draw keys
    for (const K of keys) {
      const sel = m.sel.r === K.r && m.sel.c === K.c, over = ui.inside(K.x, K.y, K.w, K.h), fl = m.flash && m.flash.k === K.k && m.flash.t < 0.14;
      const down = (over && ui.ptr.down) || fl, k = K.k;
      let label = ''; const st = { over, down, sel };
      if (k.type === 'ch') label = m.upper ? k.ch.toUpperCase() : k.ch.toLowerCase();
      else if (k.type === 'shift') { st.icon = 'up'; st.accent = m.upper ? T.green : T.cyan2; st.tint = true; }
      else if (k.type === 'space') { st.tint = true; st.accent = T.copper; }
      else if (k.type === 'del') { st.icon = 'back'; st.accent = T.red; st.tint = true; }
      else if (k.type === 'ok') { st.icon = 'check'; st.accent = T.green; st.tint = true; }
      key(ui, K.x, K.y, K.w, K.h, label, st);
      if (k.type === 'space') { const sy = K.y + (down ? 2 : 0) + ((K.h - 3) >> 1), sx = R(K.x + K.w / 2); ui.rect(sx - 10, sy + 1, 21, 1, '#ffffff'); ui.rect(sx - 10, sy - 1, 1, 3, '#ffffff'); ui.rect(sx + 10, sy - 1, 1, 3, '#ffffff'); }
      if (sel) brackets(ui, K.x, K.y + (down ? 2 : 0), K.w, K.h - 3, k.type === 'ok' ? T.green : T.amber, t);
    }
    // ---- confirm: the stamp, a flash, then resolve
    if (m.done >= 0) {
      m.done += dt;
      if (m.done > 0.18 && m.done < 0.26) blendRect(s, 0, 0, W, H, '#fff4dc', 0.4);
      if (m.done >= 0.75) ui.closeModal(m, m.result);
    }
  };
  return m;
}

// ------------------------------------------------------------------ card picker (generic; the gender and
// starter picks have their own 3D scenes, see src/vx/game/showcase.js)
// o: { title, sub, cards: [{ label, sub, color, icon, art, draw(ui, x, y, w, h) }], pick } → index
export function pickCardsScreen(ui, o, resolve) {
  const cards = o.cards || [];
  const m = { capture: true, resolve, sel: Math.max(0, Math.min(cards.length - 1, o.pick || 0)), lift: cards.map(() => 0), lp: null, done: -1, pt: cards.map(() => 9) };
  m.draw = (ui, dt, live) => {
    const W = ui.w, H = ui.h, s = ui.s, t = m.t, n = Math.max(1, cards.length);
    backdrop(ui, t);
    const tH = 30 + (o.sub ? 12 : 0), gap = W < 300 ? 8 : 16, bottom = H - 40;
    let ch = Math.min(bottom - 14 - tH, 190), cw = Math.min(Math.floor((W - 24 - (n - 1) * gap) / n), R(ch * 0.74));
    ch = Math.min(ch, R(cw * 1.45));
    const top = Math.max(12, R((bottom - (tH + 14 + ch)) / 2)), y0 = title(ui, o.title || 'Choose', top, { sub: o.sub });
    const total = n * cw + (n - 1) * gap, cx0 = R((W - total) / 2), cy = y0 + 14;
    if (live && m.done < 0) {
      const moved = !m.lp || m.lp[0] !== ui.ptr.x || m.lp[1] !== ui.ptr.y; m.lp = [ui.ptr.x, ui.ptr.y];
      const ev = (ui.typed && ui.typed.length ? ui.typed : Object.keys(ui.keys).filter((k) => ui.keys[k] === 'pressed')), prev = m.sel;
      for (const e of ev) {
        if (e === 'ArrowLeft' || e === 'a' || e === 'A') m.sel = (m.sel + n - 1) % n;
        else if (e === 'ArrowRight' || e === 'd' || e === 'D') m.sel = (m.sel + 1) % n;
        else if (e === 'Enter' || e === ' ' || e === 'z') m.done = 0;
        else if (/^[1-9]$/.test(e) && +e <= n) { m.sel = +e - 1; m.done = 0; }
      }
      for (let i = 0; i < n; i++) { const x = cx0 + i * (cw + gap); if (ui.inside(x, cy - 6, cw, ch + 6)) { if (moved) m.sel = i; if (ui.ptr.pressed) ui.click('ui_tap'); if (ui.ptr.released) { ui.ptr.released = false; if (m.sel === i) m.done = 0; else m.sel = i; } } }
      if (m.sel !== prev) { m.pt[m.sel] = 0; ui.click('ui_tap', { vol: 0.4, pitch: 1.3 }); }
    }
    for (let i = 0; i < n; i++) { m.lift[i] += ((i === m.sel ? 1 : 0) - m.lift[i]) * Math.min(1, dt * 12); m.pt[i] += dt; }
    for (let i = 0; i < cards.length; i++) {
      const x = cx0 + i * (cw + gap), y = R(cy - m.lift[i] * 7), sel = i === m.sel, b = squash(m.pt[i], 0.05), g = ui.g;
      g.save(); g.translate(R(x + cw / 2), y + ch); g.scale(1 + b, 1 - b); g.translate(-R(x + cw / 2), -(y + ch));
      drawCard(ui, x, y, cw, ch, cards[i], sel, t, m.done >= 0 && sel ? m.done : -1);
      if (!sel) blendRect(s, x - 2, y - 2, cw + 4, ch + 4, T.shade, 0.35);
      g.restore(); ui._fs = null;
      if (sel) { tri(s, R(x + cw / 2) - 3, y - 12 + R(Math.abs(Math.sin(t * 5)) * 2), 'down', 3, T.amber); const k = (t * 0.8) % 1; sparkle(s, x + 3 + k * (cw - 6), y + 1, T.amberL, 1 - k); }
    }
    const b = roundButton(ui, R(W / 2), H - 20, 10, 'check', { modal: true, sel: m.done >= 0, color: T.green, disabled: !live && m.done < 0 });
    if (live && m.done < 0 && b.clicked) m.done = 0;
    if (m.done >= 0) { m.done += dt; if (m.done >= 0.45) ui.closeModal(m, m.sel); }
  };
  return m;
}
function drawCard(ui, x, y, w, h, card, sel, t, out) {
  const col = card.color || T.cyan;
  frame(ui, x, y, w, h, { edge: sel ? T.brass : null });
  const ax = x + 8, ay = y + 8, aw = w - 16, ah = R(h * 0.62);
  ui.clip(ax, ay, aw, ah, () => {
    ui.rect(ax, ay, aw, ah, mx(col, T.cream, 0.55));
    for (let i = -ah; i < aw; i += 8) for (let j = 0; j < ah; j++) ui.rect(ax + i + j, ay + j, 3, 1, mx(col, T.cream, 0.4));
    if (card.draw) card.draw(ui, ax, ay, aw, ah);
    else { const cx = R(ax + aw / 2), cyy = R(ay + ah / 2 + (sel ? Math.sin(t * 3) * 1.5 : 0)), Rr = Math.max(12, Math.min(28, R(Math.min(aw, ah) * 0.32))); woodRing(ui.s, cx, cyy, Rr, { th: 3, fill: col }); if (card.icon) emblemDraw(ui.s, card.icon, cx, cyy, 2, null, 0); }
  });
  frame(ui, ax - 2, ay - 2, aw + 4, ah + 4, { thin: true, r: 1, alpha: 0, shadow: false });
  const ly = ay + ah + 6;
  frame(ui, x + 10, ly, w - 20, 13, { thin: true, r: 1, fill: T.creamL, shadow: false });
  gem(ui.s, x + 15, ly + 6, sel ? T.amber : T.copperL, 2); gem(ui.s, x + w - 16, ly + 6, sel ? T.amber : T.copperL, 2);
  ui.text(String(card.label || '').toUpperCase(), R(x + w / 2), ly + 4, T.text, { mini: true, bold: true, align: 'center' });
  if (card.sub && sel) { const sy = ly + 17; for (const [i, line] of ui.wrap(card.sub, w - 16, { mini: true }).slice(0, 2).entries()) ui.text(line, R(x + w / 2), sy + i * 8, T.dim, { align: 'center', mini: true }); }
  if (out >= 0) { const k = clamp01(out / 0.45); blendRect(ui.s, x, y, w, h, '#fff4dc', Math.sin(k * Math.PI) * 0.7); }
}
// kept API: a big icon as a smooth sticker centred on (cx, cy)
export function drawEmblem(ui, name, cx, cy, scale = 4, tint = null) { emblemDraw(ui.s, name, cx, cy, scale, tint, 0); }
void sh; void ball;
