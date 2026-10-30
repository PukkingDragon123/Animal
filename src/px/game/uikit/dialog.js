// The dialogue box: an ornate frame along the bottom, a name-plate tab in the
// speaker's colour, an optional framed portrait, typewriter text with a voice
// blip per character, a bouncing ▼ "next" marker and a stacked choice list
// with a cursor (↑/↓ + Enter/Space, digits, pointer).
import { Surf, P } from '../../surface.js';
import { T, sh, mx, nameColor, easeOut } from './theme.js';
import { frame, gradFill, tri, gem, hgradRun, sparkle } from './frame.js';

const surfCache = new WeakMap();
function toSurf(img) {
  if (!img || typeof img !== 'object') return null;
  if (img instanceof Surf || (img.data instanceof Uint32Array && img.w)) return img;
  let s = surfCache.get(img);
  if (s) return s;
  try {
    let id = null;
    if (img.data && img.width) id = img;                                  // ImageData
    else if (img.getContext) id = img.getContext('2d').getImageData(0, 0, img.width, img.height);   // canvas
    if (!id) return null;
    s = new Surf(id.width, id.height); s.data.set(new Uint32Array(id.data.buffer.slice(id.data.byteOffset, id.data.byteOffset + id.width * id.height * 4)));
    surfCache.set(img, s);
  } catch (e) { return null; }
  return s;
}
// draw any supported portrait source into a size×size slot (nearest-neighbour fit, bottom-aligned)
export function drawPortrait(ui, src, x, y, size, color) {
  const s = ui.s;
  gradFill(s, x, y, size, size, [mx(color, '#ffffff', 0.18), color, sh(color, -1.3)], 0);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) if ((i - j + 400) % 9 < 2 && (i + j) % 2) s.px(x + i, y + j, mx(color, '#ffffff', 0.12));
  ui.clip(x, y, size, size, () => {
    if (typeof src === 'function') { src(ui, x, y, size); return; }
    const S = toSurf(src); if (!S) return;
    const k = Math.max(S.w, S.h) <= size ? Math.max(1, Math.floor(size / Math.max(S.w, S.h))) : size / Math.max(S.w, S.h);
    const dw = Math.round(S.w * k), dh = Math.round(S.h * k), ox = x + ((size - dw) >> 1), oy = y + size - dh;
    for (let j = 0; j < dh; j++) for (let i = 0; i < dw; i++) {
      const v = S.data[Math.min(S.h - 1, Math.floor(j / k)) * S.w + Math.min(S.w - 1, Math.floor(i / k))];
      if (v >>> 24 > 127) ui.s.px(ox + i, oy + j, v);
    }
  });
  // picture frame: ink ring + bevel
  const K = P(T.ink);
  s.hline(x - 1, x + size, y - 1, K); s.hline(x - 1, x + size, y + size, K); s.vline(x - 1, y - 1, y + size, K); s.vline(x + size, y - 1, y + size, K);
  s.hline(x - 2, x + size + 1, y - 2, T.edgeL); s.vline(x - 2, y - 2, y + size + 1, T.edgeL);
  s.hline(x - 1, x + size + 1, y + size + 1, sh(T.edge, -0.8)); s.vline(x + size + 1, y - 1, y + size + 1, sh(T.edge, -0.8));
  for (const [cx, cy] of [[x - 1, y - 1], [x + size, y - 1], [x - 1, y + size], [x + size, y + size]]) gem(s, cx, cy, T.brass, 1);
}

export function drawDialog(ui) {
  const D = ui.dialog, W = ui.w, H = ui.h, s = ui.s, dt = ui.dt || 1 / 60;
  D.t += dt;
  const portrait = D.o.portrait, color = D.o.nameColor || D.o.color || nameColor(D.name);
  const bw = Math.min(W - 10, 468), bx = Math.round((W - bw) / 2);
  const ps = portrait ? (W < 300 ? 38 : 50) : 0;
  const tx0 = bx + (portrait ? ps + 17 : 13), tW = bx + bw - 15 - tx0;
  const lines = ui.wrap(D.str, tW);
  const nl = Math.min(lines.length, 5);
  const bh = Math.max(portrait ? ps + 14 : 52, 18 + nl * 11);
  const slide = Math.round((1 - easeOut(D.t * 5)) * 14);
  const by = H - bh - 5 + slide;
  const total = D.str.length;
  D.shown = Math.min(total, D.shown + (D.o.speed || 1.6) * 60 * dt);
  frame(ui, bx, by, bw, bh, { ornate: true, gem: color, gem2: T.coral, fill: '#2a2140', fill2: '#181228' });
  // faint ruled lines behind the text, like a notebook
  for (let i = 0; i < nl; i++) { const ly = by + 18 + i * 11; for (let X = tx0; X < tx0 + tW; X += 2) s.px(X, ly, '#30284a'); }
  if (portrait) drawPortrait(ui, portrait, bx + 8, by + 7, ps, color);
  // name plate tab
  if (D.name) {
    const nw = ui.tw(D.name, { bold: true }) + 22, nx = bx + 10, ny = by - 12;
    frame(ui, nx, ny, nw, 16, { fill: color, fill2: sh(color, -0.9), edge: mx(color, '#ffffff', 0.25), edgeL: mx(color, '#ffffff', 0.6), thin: true, rivets: false, shadow: true });
    gem(s, nx + 6, ny + 8, T.amber, 2);
    ui.text(D.name, nx + 11, ny + 5, '#ffffff', { bold: true, shadow: sh(color, -2) });
  }
  // voice babble: one blip per newly revealed character (the audio engine paces and filters them)
  if (ui.voice && D.name) { const shownNow = Math.floor(D.shown); for (let i = D.voiced || 0; i < shownNow; i += 2) ui.voice(D.name, D.str[i]); D.voiced = shownNow; }
  let left = Math.floor(D.shown);
  for (let i = 0; i < nl; i++) {
    const part = lines[i].slice(0, Math.max(0, left)); left -= lines[i].length + 1;
    ui.text(part, tx0, by + 10 + i * 11, T.text, { shadow: T.ink });
  }
  const finished = D.shown >= total;
  const adv = ui.ptr.released || ui.key('Enter') || ui.key(' ') || ui.key('z');
  if (D.choices && finished) { drawChoices(ui, D, bx, by, bw); return; }
  if (finished) {
    const bob = Math.round(Math.abs(Math.sin(ui.t * 5)) * 2);
    tri(s, bx + bw - 17, by + bh - 12 + bob, 'down', 3, T.amber);
    if (((ui.t * 1.3) % 1) < 0.25) sparkle(s, bx + bw - 10, by + bh - 13, T.amberL, 0.6);
  }
  if (adv) { ui.ptr.released = false; if (!finished) D.shown = total; else ui.closeDialog(null); }
}

function drawChoices(ui, D, bx, by, bw) {
  const s = ui.s, n = D.choices.length, rowH = 15, W = ui.w;
  const cw = Math.min(W - 16, Math.max(...D.choices.map((c) => ui.tw(c, { bold: true }))) + 40), chh = n * rowH + 10;
  const cx = Math.max(6, bx + bw - cw - 6), cy = by - chh - 6;
  D.ct = (D.ct || 0) + (ui.dt || 1 / 60);
  const pop = Math.round((1 - easeOut(D.ct * 6)) * 8);
  frame(ui, cx, cy + pop, cw, chh, { fill: '#2b2244', accent: T.brass });
  if (ui.key('ArrowUp') || ui.key('w')) D.pick = (D.pick + n - 1) % n;
  if (ui.key('ArrowDown') || ui.key('s')) D.pick = (D.pick + 1) % n;
  const moved = D.lpx !== ui.ptr.x || D.lpy !== ui.ptr.y; D.lpx = ui.ptr.x; D.lpy = ui.ptr.y;
  for (let i = 0; i < n; i++) {
    const ry = cy + pop + 5 + i * rowH, hit = ui.inside(cx + 3, ry, cw - 6, rowH);
    if (hit && moved) D.pick = i;
    const on = D.pick === i;
    if (on) {
      for (let j = 1; j < rowH - 1; j++) hgradRun(s, cx + 4, ry + j, cw - 8, j === 1 ? [mx('#2b2244', T.amber, 0.6), '#2b2244'] : [mx('#2b2244', T.amber, 0.32), mx('#2b2244', T.amber, 0.1), '#2b2244']);
      s.hline(cx + 4, cx + cw - 5, ry + rowH - 1, mx('#2b2244', T.amber, 0.15));
      tri(s, cx + 6 + Math.round(Math.abs(Math.sin(ui.t * 6)) * 2), ry + 4, 'right', 3, T.amber);
    }
    ui.text(D.choices[i], cx + 16, ry + 4, on ? '#ffffff' : T.dim, { shadow: T.ink, bold: on });
    if (n > 1 && cw > 60) ui.text(String(i + 1), cx + cw - 9, ry + 5, on ? T.amber : T.textD, { mini: true });
    if (hit && ui.ptr.released) { ui.ptr.released = false; ui.closeDialog(i); return; }
  }
  for (let i = 1; i <= Math.min(9, n); i++) if (ui.key(String(i))) { ui.closeDialog(i - 1); return; }
  if (ui.key('Enter') || ui.key(' ') || ui.key('z')) { ui.closeDialog(D.pick); return; }
  ui.ptr.released = false;
}
