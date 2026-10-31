// The dialogue box, TokoPhone style and compact: a white card with a thick ink outline along the
// bottom of the screen, the speaker's name on a candy-coloured tag, the speaker's live 3D portrait in a
// round badge that overlaps the card, typewriter text with a voice blip per character and a bouncing
// "next" arrow. Choices are candy pills stacked above the card (↑/↓ + Enter/Space, digits, pointer).
import { T, mx, nameColor, easeOut, easeOutBack, clamp01, boing } from './theme.js';
import { rr, circle, vgrad } from './gfx.js';
import { frame, tri, sparkle, woodRing, clipCircle } from './frame.js';
import { candy } from './frame.js';
import { toCanvas } from './widgets.js';

// draw any supported portrait source in a round badge. (x, y, size) is the square the disc fills
export function drawPortrait(ui, src, x, y, size, color = T.cyan) {
  const g = ui.g, r = size / 2, cx = x + r, cy = y + r;
  woodRing(ui.s, cx - 0.5, cy - 0.5, r, { th: 3, shadow: true, color: '#ffffff' });
  clipCircle(ui, cx - 0.5, cy - 0.5, r, () => {
    g.fillStyle = vgrad(g, y, y + size, [mx(color, '#ffffff', 0.55), mx(color, '#ffffff', 0.2), color]); ui._fs = null; g.fillRect(x - 1, y - 1, size + 2, size + 2);
    g.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = -size; i < size * 2; i += 7) { g.beginPath(); g.moveTo(x + i, y + size); g.lineTo(x + i + size, y); g.lineTo(x + i + size + 3, y); g.lineTo(x + i + 3, y + size); g.fill(); }
    if (typeof src === 'function') src(ui, x, y, size);
    else { const c = toCanvas(src); if (c) { const cw = c.width || 1, chh = c.height || 1, k = size / Math.max(cw, chh); const sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = true; g.drawImage(c, x + (size - cw * k) / 2, y + size - chh * k, cw * k, chh * k); g.imageSmoothingEnabled = sm; } }
  });
}

export function drawDialog(ui) {
  const D = ui.dialog, W = ui.w, H = ui.h, g = ui.g, dt = ui.dt || 1 / 60;
  D.t += dt;
  const portrait = D.o.portrait, color = D.o.nameColor || D.o.color || nameColor(D.name);
  const bw = Math.min(W - 12, 400), bx = Math.round((W - bw) / 2);
  const ps = portrait ? (W < 300 ? 40 : 50) : 0;
  const tx0 = bx + (portrait ? ps - 2 : 12), tW = bx + bw - 14 - tx0;
  const lines = ui.wrap(D.str, tW, { bold: false }), nl = Math.min(lines.length, 4);
  const bh = Math.max(38, 17 + nl * 11);
  const k = boing(D.t * 1.5), slide = (1 - k) * 22;
  const by = H - bh - 6 + slide;
  const total = D.str.length;
  D.shown = Math.min(total, D.shown + (D.o.speed || 1.6) * 60 * dt);
  frame(ui, bx, by, bw, bh, { paper: '#ffffff', r: 9, shadowA: 0.45 });
  // name tag: a candy pill over the card's top edge
  if (D.name) {
    const nw = Math.round(ui.tw(D.name, { bold: true }) + 18), nx = tx0 - 4, ny = by - 9 + (1 - easeOutBack(D.t * 4)) * 6;
    candy(ui, nx, ny, nw, 15, { color, state: 0, lip: 2, r: 7.5 });
    ui.text(D.name, nx + nw / 2, ny + 3.5, '#ffffff', { align: 'center', bold: true, outline: mx(color, T.ink, 0.7) });
  }
  if (portrait) drawPortrait(ui, portrait, bx - 6, by + bh - ps - 4, ps, color);
  // voice babble: one blip per newly revealed character (the audio engine paces and filters them)
  if (ui.voice && D.name) { const shownNow = Math.floor(D.shown); for (let i = D.voiced || 0; i < shownNow; i += 2) ui.voice(D.name, D.str[i]); D.voiced = shownNow; }
  let left = Math.floor(D.shown);
  const ty0 = by + (D.name ? 10 : 8) + Math.max(0, (bh - (D.name ? 14 : 10) - nl * 11) / 2 - 2);
  for (let i = 0; i < nl; i++) {
    const part = lines[i].slice(0, Math.max(0, left)); left -= lines[i].length + 1;
    if (part) ui.text(part, tx0, ty0 + i * 11, T.paperText, {});
  }
  const finished = D.shown >= total;
  const adv = ui.ptr.released || ui.key('Enter') || ui.key(' ') || ui.key('z');
  if (D.choices && finished) { drawChoices(ui, D, bx, by, bw, color); return; }
  if (finished) {
    const bob = Math.abs(Math.sin(ui.t * 5)) * 2.5, ax = bx + bw - 15, ay = by + bh - 10 - bob;
    tri(ui.s, ax, ay, 'down', 3, color);
    if (((ui.t * 1.2) % 1) < 0.2) sparkle(ui.s, ax + 7, ay - 1, T.amber, 0.6);
  }
  if (adv) { ui.ptr.released = false; if (!finished) D.shown = total; else ui.closeDialog(null); }
  void g; void rr; void circle; void easeOut;
}

function drawChoices(ui, D, bx, by, bw, color) {
  const n = D.choices.length, rowH = 17, W = ui.w;
  const cw = Math.min(W - 16, Math.max(...D.choices.map((c) => ui.tw(c, { bold: true }))) + 30);
  const cx = Math.max(6, bx + bw - cw - 8), cy = by - n * (rowH + 3) - 10;
  D.ct = (D.ct || 0) + (ui.dt || 1 / 60);
  const prev = D.pick;
  if (ui.key('ArrowUp') || ui.key('w')) D.pick = (D.pick + n - 1) % n;
  if (ui.key('ArrowDown') || ui.key('s')) D.pick = (D.pick + 1) % n;
  const moved = D.lpx !== ui.ptr.x || D.lpy !== ui.ptr.y; D.lpx = ui.ptr.x; D.lpy = ui.ptr.y;
  for (let i = 0; i < n; i++) { const ry = cy + i * (rowH + 3); if (ui.inside(cx, ry, cw, rowH) && moved) D.pick = i; }
  if (D.pick !== prev) { D.pt = 0; ui.click('ui_tap', { vol: 0.35, pitch: 1.4 }); } else D.pt = (D.pt || 0) + (ui.dt || 1 / 60);
  for (let i = 0; i < n; i++) {
    const pop = boing(D.ct * 1.6 - i * 0.12), ry = cy + i * (rowH + 3) + (1 - pop) * 10, on = D.pick === i;
    const hit = ui.inside(cx, ry, cw, rowH);
    if (hit && ui.ptr.pressed) ui.click('ui_tap', { vol: 0.6 });
    const nudge = on ? -3 : 0;
    candy(ui, cx + nudge, ry, cw, rowH, { color: on ? color : '#ffffff', state: on ? 1 : 0, lip: 3, r: 8.5, active: on });
    ui.text(D.choices[i], cx + nudge + 18, ry + 4, on ? '#ffffff' : T.paperText, { bold: true, outline: on ? mx(color, T.ink, 0.7) : null });
    ui.text(String(i + 1), cx + nudge + 8, ry + 5, on ? '#ffffff' : T.paperDim, { mini: true, bold: true });
    if (on) tri(ui.s, cx + nudge - 7 + Math.sin(ui.t * 8) * 1.2, ry + 4.5, 'right', 3, T.amber);
    if (hit && ui.ptr.released) { ui.ptr.released = false; ui.closeDialog(i); return; }
  }
  for (let i = 1; i <= Math.min(9, n); i++) if (ui.key(String(i))) { ui.closeDialog(i - 1); return; }
  if (ui.key('Enter') || ui.key(' ') || ui.key('z')) { ui.closeDialog(D.pick); return; }
  ui.ptr.released = false;
  void clamp01;
}
