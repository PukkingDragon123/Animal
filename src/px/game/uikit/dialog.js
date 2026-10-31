// The dialogue box in the pixel-GUI style, compact: a cream card in a copper frame along the bottom of
// the screen, a portrait slot (copper border, cream inset) holding the speaker's live 3D render, the
// speaker's name on a raised plate with diamond ornaments, typewriter text in dark-brown pixel type with
// a voice blip per character, and a bouncing copper "next" arrow. Choices are cream buttons stacked above
// the card (↑/↓ + Enter/Space, digits, pointer); the picked one gets a brass rim and an arrow.
import { T, mx, nameColor, boing, clamp01 } from './theme.js';
import { frame, knob, tri, sparkle, gem } from './frame.js';
import { toCanvas } from './widgets.js';

const R = Math.round;
// a portrait slot: copper frame, cream inset, then the image (canvas / ImageData / Surf / (ui, x, y, size) => void)
export function drawPortrait(ui, src, x, y, size, color = T.cyan) {
  x = R(x); y = R(y);
  frame(ui, x - 4, y - 4, size + 8, size + 8, { thin: true, r: 2, shadowA: 0.35 });
  ui.rect(x, y, size, size, T.creamD);
  ui.rect(x, y + size - Math.round(size * 0.3), size, Math.round(size * 0.3), mx(T.creamD, color, 0.25));
  for (let i = 0; i < size; i += 4) ui.rect(x + i, y + size - Math.round(size * 0.3) - 1, 2, 1, mx(T.creamD, color, 0.35));
  ui.clip(x, y, size, size, () => {
    if (typeof src === 'function') src(ui, x, y, size);
    else { const c = toCanvas(src); if (c) { const cw = c.width || 1, ch = c.height || 1, k = size / Math.max(cw, ch); ui.g.imageSmoothingEnabled = k < 0.75; ui.g.drawImage(c, R(x + (size - cw * k) / 2), R(y + size - ch * k), R(cw * k), R(ch * k)); ui.g.imageSmoothingEnabled = false; } }
  });
  ui.rect(x, y, size, 1, T.creamLine);
}

export function drawDialog(ui) {
  const D = ui.dialog, W = ui.w, H = ui.h, dt = ui.dt || 1 / 60;
  D.t += dt;
  const portrait = D.o.portrait, color = D.o.nameColor || D.o.color || nameColor(D.name);
  const bw = Math.min(W - 16, 440), bx = R((W - bw) / 2), ps = portrait ? (W < 300 ? 40 : 52) : 0;
  const tx0 = bx + (portrait ? ps + 20 : 14), tW = bx + bw - 16 - tx0;
  const lines = ui.wrap(D.str, tW), nl = Math.min(lines.length, 4);
  const bh = Math.max(portrait ? ps + 16 : 40, 24 + nl * 11);
  const k = boing(D.t * 1.6), by = R(H - bh - 6 + (1 - k) * 24);
  const total = D.str.length;
  D.shown = Math.min(total, D.shown + (D.o.speed || 1.6) * 60 * dt);
  frame(ui, bx, by, bw, bh, { shadowA: 0.45 });
  if (portrait) drawPortrait(ui, portrait, bx + 10, by + R((bh - ps) / 2), ps, color);
  // the name plate over the card's top edge
  if (D.name) {
    const nm = String(D.name).toUpperCase(), nw = R(ui.tw(nm, { mini: true, bold: true }) + 24), nx = tx0 - 6, ny = by - 7 + R((1 - boing(D.t * 1.8)) * 6);
    frame(ui, nx, ny, nw, 13, { thin: true, r: 1, fill: T.creamL, shadowA: 0.3 });
    gem(ui.s, nx + 5, ny + 6, color, 2); gem(ui.s, nx + nw - 6, ny + 6, color, 2);
    ui.text(nm, nx + R(nw / 2), ny + 4, T.text, { mini: true, bold: true, align: 'center' });
  }
  if (ui.voice && D.name) { const shownNow = Math.floor(D.shown); for (let i = D.voiced || 0; i < shownNow; i += 2) ui.voice(D.name, D.str[i]); D.voiced = shownNow; }
  let left = Math.floor(D.shown);
  const ty0 = by + (D.name ? 12 : 9) + Math.max(0, R((bh - (D.name ? 18 : 14) - nl * 11) / 2));
  for (let i = 0; i < nl; i++) {
    const part = lines[i].slice(0, Math.max(0, left)); left -= lines[i].length + 1;
    if (part) ui.text(part, tx0, ty0 + i * 11, T.text, {});
  }
  const finished = D.shown >= total;
  const adv = ui.ptr.released || ui.key('Enter') || ui.key(' ') || ui.key('z');
  if (D.choices && finished) { drawChoices(ui, D, bx, by, bw, color); return; }
  if (finished) {
    const bob = R(Math.abs(Math.sin(ui.t * 5)) * 2), ax = bx + bw - 16, ay = by + bh - 12 - bob;
    tri(ui.s, ax, ay, 'down', 3, T.copperL);
    if (((ui.t * 1.2) % 1) < 0.2) sparkle(ui.s, ax + 8, ay - 1, T.amberL, 0.6);
  }
  if (adv) { ui.ptr.released = false; if (!finished) D.shown = total; else ui.closeDialog(null); }
}

function drawChoices(ui, D, bx, by, bw, color) {
  const n = D.choices.length, rowH = 17, W = ui.w;
  const cw = Math.min(W - 16, R(Math.max(...D.choices.map((c) => ui.tw(c, { bold: true }))) + 36));
  const cx = Math.max(6, bx + bw - cw - 10), cy = by - n * (rowH + 3) - 8;
  D.ct = (D.ct || 0) + (ui.dt || 1 / 60);
  const prev = D.pick;
  if (ui.key('ArrowUp') || ui.key('w')) D.pick = (D.pick + n - 1) % n;
  if (ui.key('ArrowDown') || ui.key('s')) D.pick = (D.pick + 1) % n;
  const moved = D.lpx !== ui.ptr.x || D.lpy !== ui.ptr.y; D.lpx = ui.ptr.x; D.lpy = ui.ptr.y;
  for (let i = 0; i < n; i++) { const ry = cy + i * (rowH + 3); if (ui.inside(cx, ry, cw, rowH) && moved) D.pick = i; }
  if (D.pick !== prev) { D.pt = 0; ui.click('ui_tap', { vol: 0.35, pitch: 1.4 }); } else D.pt = (D.pt || 0) + (ui.dt || 1 / 60);
  for (let i = 0; i < n; i++) {
    const pop = boing(D.ct * 1.6 - i * 0.12), ry = R(cy + i * (rowH + 3) + (1 - pop) * 10), on = D.pick === i;
    const hit = ui.inside(cx, ry, cw, rowH);
    if (hit && ui.ptr.pressed) ui.click('ui_tap', { vol: 0.6 });
    const nudge = on ? -3 : 0, down = hit && ui.ptr.down;
    knob(ui, cx + nudge, ry, cw, rowH, { color: on ? T.creamL : T.cream, state: down ? 2 : on ? 1 : 0, lip: 3, r: 2, active: on, frame: 'copper' });
    const fy = ry + (down ? 2 : 0);
    ui.text(String(i + 1), cx + nudge + 8, fy + 5, on ? T.copper : T.dim, { mini: true, bold: true });
    ui.text(D.choices[i], cx + nudge + 18, fy + 4, T.text, { bold: on });
    if (on) tri(ui.s, cx + nudge - 8 + R(Math.sin(ui.t * 8)), ry + 5, 'right', 3, T.copperL);
    if (hit && ui.ptr.released) { ui.ptr.released = false; ui.closeDialog(i); return; }
  }
  for (let i = 1; i <= Math.min(9, n); i++) if (ui.key(String(i))) { ui.closeDialog(i - 1); return; }
  if (ui.key('Enter') || ui.key(' ') || ui.key('z')) { ui.closeDialog(D.pick); return; }
  ui.ptr.released = false;
  void color; void clamp01;
}
