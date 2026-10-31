// The dialogue box: a carved wood frame around a cream parchment page, the
// speaker's name on a little wooden tab, the speaker's live 3D portrait in a
// round wooden frame, typewriter text with a voice blip per character, a
// bouncing leaf "next" marker and swaying leaf sprigs on the frame. Choices are
// a parchment list above the box with a leaf cursor (↑/↓ + Enter/Space, digits, pointer).
import { Surf, P } from '../../surface.js';
import { T, mx, nameColor, easeOut, easeOutBack, clamp01 } from './theme.js';
import { frame, gradFill, sparkle, woodRing, clipCircle, leaf, sprig, blendRun } from './frame.js';

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
// paint a portrait source into a size×size square (nearest-neighbour fit, bottom-aligned)
function paintPortrait(ui, src, x, y, size) {
  if (typeof src === 'function') { src(ui, x, y, size); return; }
  const S = toSurf(src); if (!S) return;
  const k = Math.max(S.w, S.h) <= size ? Math.max(1, Math.floor(size / Math.max(S.w, S.h))) : size / Math.max(S.w, S.h);
  const dw = Math.round(S.w * k), dh = Math.round(S.h * k), ox = x + ((size - dw) >> 1), oy = y + size - dh;
  for (let j = 0; j < dh; j++) for (let i = 0; i < dw; i++) {
    const v = S.data[Math.min(S.h - 1, Math.floor(j / k)) * S.w + Math.min(S.w - 1, Math.floor(i / k))];
    if (v >>> 24 > 127) ui.s.px(ox + i, oy + j, v);
  }
}
// draw any supported portrait source in a round wooden frame. (x, y, size) is the square the disc fills
export function drawPortrait(ui, src, x, y, size, color = T.cyan, t = 0) {
  const s = ui.s, r = (size >> 1), cx = x + r, cy = y + r;
  woodRing(s, cx, cy, r, { th: 3, shadow: true });
  clipCircle(ui, cx, cy, r, () => {
    gradFill(ui.s, x, y, size + 1, size + 1, [mx(T.sky, '#ffffff', 0.35), mx(T.sky, color, 0.25), mx(T.moss, color, 0.2)], 0);
    // soft ground disc + far hills behind the subject
    for (let i = 0; i <= size; i++) { const hy = y + Math.round(size * 0.72 + Math.sin(i * 0.2 + 1) * 2); for (let j = hy; j <= y + size; j++) ui.s.px(x + i, j, j === hy ? T.leaf : T.moss); }
    paintPortrait(ui, src, x, y, size + 1);
  });
  // a leaf tucked into the ring
  sprig(s, cx + r - 2, cy + r - 1, 1, t, { n: 2, len: 7, down: true });
}

export function drawDialog(ui) {
  const D = ui.dialog, W = ui.w, H = ui.h, s = ui.s, dt = ui.dt || 1 / 60;
  D.t += dt;
  const portrait = D.o.portrait, color = D.o.nameColor || D.o.color || nameColor(D.name);
  const bw = Math.min(W - 10, 460), bx = Math.round((W - bw) / 2);
  const ps = portrait ? (W < 300 ? 40 : 52) : 0;
  const tx0 = bx + (portrait ? ps + 20 : 14), tW = bx + bw - 16 - tx0;
  const lines = ui.wrap(D.str, tW);
  const nl = Math.min(lines.length, 5);
  const bh = Math.max(portrait ? ps + 12 : 48, 22 + nl * 11);
  const k = easeOut(D.t * 5), slide = Math.round((1 - k) * 16);
  const by = H - bh - 5 + slide;
  const total = D.str.length;
  D.shown = Math.min(total, D.shown + (D.o.speed || 1.6) * 60 * dt);
  // name tab (drawn first so the box overlaps its foot: it reads as a tab nailed behind the frame)
  if (D.name) {
    const nw = ui.tw(D.name, { bold: true }) + 22, nx = bx + (portrait ? ps + 12 : 10), ny = by - 13 + Math.round((1 - easeOutBack(D.t * 4)) * 6);
    frame(ui, nx, ny, nw, 18, { thin: true, r: 4, fill: T.woodL, edge: T.wood, edgeL: mx(T.woodL, T.hi, 0.5), seams: false, rivets: false });
    // speaker-colour bead
    s.px(nx + 6, ny + 5, mx(color, '#ffffff', 0.5)); s.px(nx + 7, ny + 5, color); s.px(nx + 6, ny + 6, color); s.px(nx + 7, ny + 6, mx(color, T.ink, 0.4));
    s.px(nx + 5, ny + 5, T.ink); s.px(nx + 8, ny + 6, T.ink); s.px(nx + 6, ny + 4, T.ink); s.px(nx + 7, ny + 7, T.ink);
    ui.text(D.name, nx + 12, ny + 4, T.text, { bold: true, shadow: T.woodDD });
  }
  frame(ui, bx, by, bw, bh, { paper: true, leaves: true, fill: T.wood });
  // faint ruled lines on the page
  const rule = P(mx(T.paper, T.paperE, 0.28));
  for (let i = 0; i < nl; i++) { const ly = by + 17 + i * 11; for (let X = tx0; X < tx0 + tW; X += 1) if ((X + i) % 3) s.px(X, ly, rule); }
  if (portrait) drawPortrait(ui, portrait, bx + 7, by + Math.round((bh - ps) / 2) - 1, ps, color, ui.t);
  // voice babble: one blip per newly revealed character (the audio engine paces and filters them)
  if (ui.voice && D.name) { const shownNow = Math.floor(D.shown); for (let i = D.voiced || 0; i < shownNow; i += 2) ui.voice(D.name, D.str[i]); D.voiced = shownNow; }
  let left = Math.floor(D.shown);
  for (let i = 0; i < nl; i++) {
    const part = lines[i].slice(0, Math.max(0, left)); left -= lines[i].length + 1;
    ui.text(part, tx0, by + 9 + i * 11, T.paperText, { shadow: mx(T.paper, T.paperE, 0.5) });
  }
  const finished = D.shown >= total;
  const adv = ui.ptr.released || ui.key('Enter') || ui.key(' ') || ui.key('z');
  if (D.choices && finished) { drawChoices(ui, D, bx, by, bw); return; }
  if (finished) {
    // a leaf bobbing on the page corner: "next"
    const bob = Math.round(Math.abs(Math.sin(ui.t * 4.5)) * 3), lx = bx + bw - 14, ly = by + bh - 9 - bob;
    blendRun(s, lx - 2, lx + 3, by + bh - 6, T.paperE, 0.5);
    leaf(s, lx - 2, ly, Math.PI / 2 - 0.5 + Math.sin(ui.t * 3) * 0.25, 6, 2.2, T.leaf);
    if (((ui.t * 1.2) % 1) < 0.22) sparkle(s, lx + 4, ly - 2, T.amberL, 0.6);
  }
  if (adv) { ui.ptr.released = false; if (!finished) D.shown = total; else ui.closeDialog(null); }
}

function drawChoices(ui, D, bx, by, bw) {
  const s = ui.s, n = D.choices.length, rowH = 16, W = ui.w;
  const cw = Math.min(W - 16, Math.max(...D.choices.map((c) => ui.tw(c, { bold: true }))) + 34), chh = n * rowH + 12;
  const cx = Math.max(6, bx + bw - cw - 6), cy = by - chh - 8;
  D.ct = (D.ct || 0) + (ui.dt || 1 / 60);
  const pop = Math.round((1 - easeOutBack(D.ct * 5)) * 8);
  frame(ui, cx, cy + pop, cw, chh, { paper: true, fill: T.wood, rivets: false });
  const prev = D.pick;
  if (ui.key('ArrowUp') || ui.key('w')) D.pick = (D.pick + n - 1) % n;
  if (ui.key('ArrowDown') || ui.key('s')) D.pick = (D.pick + 1) % n;
  const moved = D.lpx !== ui.ptr.x || D.lpy !== ui.ptr.y; D.lpx = ui.ptr.x; D.lpy = ui.ptr.y;
  for (let i = 0; i < n; i++) {
    const ry = cy + pop + 6 + i * rowH, hit = ui.inside(cx + 3, ry, cw - 6, rowH);
    if (hit && moved) D.pick = i;
  }
  if (D.pick !== prev || D.pt == null) D.pt = 0; else D.pt += ui.dt || 1 / 60;
  for (let i = 0; i < n; i++) {
    const ry = cy + pop + 6 + i * rowH, hit = ui.inside(cx + 3, ry, cw - 6, rowH);
    const on = D.pick === i;
    if (on) {
      const hl = mx(T.paper, T.leaf, 0.3), k = clamp01(D.pt * 8), w2 = Math.round((cw - 10) * easeOut(k));
      for (let j = 1; j < rowH - 1; j++) blendRun(s, cx + 5, cx + 5 + w2 - 1, ry + j, j === 1 ? mx(hl, '#ffffff', 0.4) : hl, 0.85);
      leaf(s, cx + 7, ry + 8, -0.25 + Math.sin(ui.t * 5) * 0.2, 6, 2, T.leaf);
      if (D.pt < 0.4) sparkle(s, cx + 6 + w2, ry + 4, T.amberL, 1 - D.pt / 0.4);
    }
    ui.text(D.choices[i], cx + 17 + (on ? 1 : 0), ry + 4, on ? T.paperText : T.paperDim, { bold: on });
    if (hit && ui.ptr.released) { ui.ptr.released = false; ui.closeDialog(i); return; }
  }
  for (let i = 1; i <= Math.min(9, n); i++) if (ui.key(String(i))) { ui.closeDialog(i - 1); return; }
  if (ui.key('Enter') || ui.key(' ') || ui.key('z')) { ui.closeDialog(D.pick); return; }
  ui.ptr.released = false;
}
