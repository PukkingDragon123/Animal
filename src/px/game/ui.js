// The game UI, drawn every frame (immediate mode) as true pixel art. The UI canvas IS the art grid
// (w × h art pixels — about 640×360 on a 1080p screen); the page scales it up by a whole number with
// nearest-neighbour, so every pixel is crisp. Nothing anti-aliases: panels, buttons, bars, discs and
// icons are hand-shaded pixel sprites (uikit/frame.js, uikit/icons.js) blitted at integer positions, and
// text is set in pixel fonts (Tiny5 for body text, Silkscreen for small labels and big titles) rasterised
// once per glyph with a hard alpha threshold, with the outline / drop shadow baked into the glyph sprite.
// The look: warm cream parchment panels in chunky copper frames with corner brackets and rivets, glossy
// capsule bars with brass clamps, icon buttons on wooden plinths, cream value pills — and every press
// squashes and boings back with a tap sound.
// Primitives (panel, button, bar, banner, icons, toasts), the dialogue box with its portrait slot +
// choices, roaming-HUD widgets (prompt bubble, keycaps, thumbstick, clock, coin pill, place banner, party
// medals, radar) and full-screen modal screens (name entry, card picker). Widget bodies live in ./uikit/;
// this class keeps the state and the public API.
// Lag: every panel, button face, disc and glyph is cached as a sprite; text widths are memoised; a frame
// of UI is a few hundred integer drawImage / fillRect calls on a small canvas.
import { T, mx, hash, clamp01, easeOut, easeOutBack, boing, squash, isDark } from './uikit/theme.js';
import { css, rgba, makeCanvas, CanvasSurf, fillShape, rowIns, sprite, blit, pixelCanvas } from './uikit/gfx.js';
import { drawSmall, drawBig, drawEmblem, ICON_NAMES } from './uikit/icons.js';
import { frame, knob, pill, tri, gem, sparkle, ball, barShape } from './uikit/frame.js';
import { drawDialog } from './uikit/dialog.js';
import * as W from './uikit/widgets.js';
import { nameEntryScreen, pickCardsScreen } from './uikit/screens.js';
import { P } from '../surface.js';

export { T, ICON_NAMES };

// ------------------------------------------------------------------ pixel fonts
const FONT_FILES = [['Tiny5', 'tiny5.woff2', '400'], ['Silkscreen', 'silkscreen.woff2', '400'], ['Silkscreen', 'silkscreen-bold.woff2', '700']];
let fontP = null, fontGen = 0;
export function loadUIFont() {
  if (fontP) return fontP;
  if (typeof FontFace === 'undefined' || typeof document === 'undefined' || !document.fonts) return (fontP = Promise.resolve());
  const jobs = FONT_FILES.map(([fam, file, weight]) => new FontFace('TK' + fam, `url(${new URL('../../../assets/fonts/' + file, import.meta.url).href})`, { weight }).load().then((f) => document.fonts.add(f)).catch(() => {}));
  fontP = Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 3000))]).then(() => { fontGen++; glyphs.clear(); widths.clear(); metrics.clear(); });
  return fontP;
}
export const FAMILY = '"TKTiny5", "TKSilkscreen", monospace';
// the faces: body (Tiny5 10 px), label (Silkscreen 8 px), title (Silkscreen Bold, 16 / 24 / 32 px)
function faceOf(o) {
  const sc = o.scale || 1;
  if (sc >= 1.5) { const k = Math.max(2, Math.round(sc)); return { id: 't' + k, css: `700 ${8 * k}px "TKSilkscreen", monospace`, cap: 5 * k, bold: 0, px: 8 * k }; }
  if (o.mini) return o.bold ? FACES.miniB : FACES.mini;
  return o.bold || sc > 1.1 ? FACES.bodyB : FACES.body;
}
const FACES = {
  body: { id: 'b', css: '400 10px "TKTiny5", monospace', cap: 7, bold: 0, px: 10 },
  bodyB: { id: 'B', css: '400 10px "TKTiny5", monospace', cap: 7, bold: 1, px: 10 },
  mini: { id: 'm', css: '400 8px "TKSilkscreen", monospace', cap: 5, bold: 0, px: 8 },
  miniB: { id: 'M', css: '700 8px "TKSilkscreen", monospace', cap: 5, bold: 0, px: 8 },
};
let gctx = null;
function rasterCtx() { if (!gctx) { const c = makeCanvas(96, 96); gctx = c ? c.getContext('2d', { willReadFrequently: true }) : null; } return gctx; }
const metrics = new Map();   // face id → { asc (baseline offset of the cap top), capH }
function faceMetrics(F) {
  let M = metrics.get(F.id);
  if (M) return M;
  const g = rasterCtx(); M = { asc: F.cap, capH: F.cap };
  if (g) {
    g.clearRect(0, 0, 96, 96); g.font = F.css; g.textBaseline = 'top'; g.fillStyle = '#fff'; g.fillText('H', 8, 8);
    const d = g.getImageData(0, 0, 96, 96).data; let top = -1, bot = -1;
    for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) if (d[(y * 96 + x) * 4 + 3] > 127) { if (top < 0) top = y; bot = y; }
    if (top >= 0) M = { asc: top - 8, capH: bot - top + 1 };
  }
  metrics.set(F.id, M);
  return M;
}
// a glyph sprite: { cv, ox, oy, adv } — the mask is thresholded, outline (1 px all round) and shadow baked in
const glyphs = new Map(), widths = new Map();
function glyph(F, ch, color, out, shad) {
  const key = F.id + ch + '|' + color + '|' + (out || '') + '|' + (shad || '');
  let G = glyphs.get(key);
  if (G) return G;
  const g = rasterCtx(); if (!g) return null;
  const S = F.px * 2 + 8, base = 4;
  g.clearRect(0, 0, S, S); g.font = F.css; g.textBaseline = 'top'; g.fillStyle = '#fff'; g.fillText(ch, 4, base);
  const adv = Math.round(g.measureText(ch).width) + F.bold;
  const d = g.getImageData(0, 0, S, S).data, m = new Uint8Array(S * S);
  let x0 = S, y0 = S, x1 = -1, y1 = -1;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (d[(y * S + x) * 4 + 3] > 127) { m[y * S + x] = 1; if (F.bold && x + 1 < S) m[y * S + x + 1] = 1; }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (m[y * S + x]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (x1 < 0) { G = { cv: null, ox: 0, oy: 0, adv }; glyphs.set(key, G); return G; }
  const pad = 2, w = x1 - x0 + 1 + pad * 2, h = y1 - y0 + 1 + pad * 2, C = P(color), O = out ? P(out) : 0, Sh = shad ? P(shad) : 0;
  const cv = pixelCanvas(w, h, (o) => {
    const at = (x, y) => { const X = x + x0 - pad, Y = y + y0 - pad; return X >= 0 && Y >= 0 && X < S && Y < S && m[Y * S + X]; };
    if (Sh) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (at(x - 1, y - 1) || (O && (at(x - 2, y - 1) || at(x, y - 1) || at(x - 1, y - 2) || at(x - 1, y)))) o[y * w + x] = Sh;
    if (O) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!at(x, y) && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1) || at(x - 1, y - 1) || at(x + 1, y + 1) || at(x - 1, y + 1) || at(x + 1, y - 1))) o[y * w + x] = O;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (at(x, y)) o[y * w + x] = C;
  });
  G = { cv, ox: x0 - pad - 4, oy: y0 - pad - base, adv };   // offsets from the pen at the em-box top
  if (glyphs.size > 6000) glyphs.clear();
  glyphs.set(key, G);
  return G;
}
function advance(F, ch) { let A = widths.get(F.id); if (!A) widths.set(F.id, (A = new Map())); let v = A.get(ch); if (v === undefined) { const g = rasterCtx(); if (g) { g.font = F.css; v = Math.round(g.measureText(ch).width) + F.bold; } else v = Math.round(F.px * 0.6); A.set(ch, v); } return v; }
const strW = new Map();
function measureStr(F, str, sp) {
  let M = strW.get(F.id); if (!M) strW.set(F.id, (M = new Map()));
  let w = M.get(str);
  if (w === undefined) { w = 0; for (const ch of str) w += advance(F, ch); if (M.size > 4000) M.clear(); M.set(str, w); }
  return w + (sp ? sp * (str.length - 1) : 0);
}

export class PixelUI {
  // w, h: the art grid. o: { canvas (draw onto this canvas) }
  constructor(w, h, o = {}) {
    this.cv = o.canvas || makeCanvas(w, h);
    this.g = this.cv ? this.cv.getContext('2d', { alpha: true }) : null;
    this.s = new CanvasSurf(this);
    this.resize(w, h);
    this.ptr = { x: -1, y: -1, down: false, pressed: false, released: false, id: null };
    this.t = 0; this.dt = 1 / 60; this.frameN = 0;
    this.dialog = null; this.toasts = []; this.keys = {}; this.modalLock = 0;
    this.modals = []; this._typed = []; this.typed = []; this._bars = new Map(); this._anim = new Map();
    this.sfx = null;                               // (id, o) → plays a UI sound (set by the app)
    this._fg = fontGen;
    loadUIFont();
  }
  // w, h: the art grid size (the canvas is exactly this many pixels; the page scales it up)
  resize(w, h) {
    this.w = Math.max(16, Math.round(w)); this.h = Math.max(16, Math.round(h));
    if (this.cv && (this.cv.width !== this.w || this.cv.height !== this.h)) { this.cv.width = this.w; this.cv.height = this.h; }
    this.kx = this.ky = this.k = 1;
    this._fs = null; this._font = null;
  }
  // ------------------------------------------------------------------ frame
  begin(dt) {
    this.dt = dt || 0; this.t += this.dt; this.frameN++;
    if (this._fg !== fontGen) { this._fg = fontGen; strW.clear(); }
    const g = this.g;
    if (g) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, this.w, this.h); g.imageSmoothingEnabled = false; }
    this._fs = null; this._font = null;
    this.hot = null; this.frameButtons = 0;
    if (this.modals.length) {
      const p = this.ptr;
      this._min = { released: p.released, pressed: p.pressed, keys: this.keys, typed: this._typed };
      p.released = false; p.pressed = false; this.keys = {}; this._typed = [];
    } else this._min = null;
    if (this.frameN % 90 === 0) { for (const [k, b] of this._bars) if (b.seen < this.frameN - 3) this._bars.delete(k); for (const [k, a] of this._anim) if (a.seen < this.frameN - 3) this._anim.delete(k); }
  }
  end() {
    const p = this.ptr;
    const input = this._min || { released: p.released, pressed: p.pressed, keys: this.keys, typed: this._typed };
    this._min = null; this._typed = [];
    const give = (on) => { p.released = on && input.released; p.pressed = on && input.pressed; this.keys = on ? input.keys : {}; this.typed = on ? input.typed : []; };
    if (this.modals.length) {
      const top = this.modal;
      for (const m of this.modals.slice()) {
        const live = m === top && !this.dialog;
        give(live);
        this._inModal = true; m.t = (m.t || 0) + this.dt;
        try { m.draw(this, this.dt, live); } finally { this._inModal = false; }
      }
    }
    if (this.dialog) { give(true); drawDialog(this); }
    this.drawToasts();
    p.pressed = false; p.released = false;
    this.keys = {}; this.typed = [];
  }
  key(k) { return this.keys[k] === 'pressed'; }
  click(id = 'ui_tap', o) { if (this.sfx) try { this.sfx(id, o); } catch (e) { /* audio is optional */ } }
  // ------------------------------------------------------------------ modal screens (block all other input while open)
  get modal() { return this.modals[this.modals.length - 1] || null; }
  openModal(m) { m.t = 0; this.modals.push(m); if (m.capture) this._captureOn(); return m; }
  closeModal(m, v) {
    if (m === undefined || m === null || typeof m !== 'object' || !this.modals.includes(m)) { v = m && typeof m === 'object' ? v : m; m = this.modal; }
    if (!m) return;
    this.modals = this.modals.filter((x) => x !== m);
    if (!this.modals.some((x) => x.capture)) this._captureOff();
    this.keys = {}; this.ptr.released = false; this._typed = [];
    if (m.onClose) m.onClose(v);
    if (m.resolve) m.resolve(v);
  }
  _captureOn() {
    if (this._cap || typeof window === 'undefined' || !window.addEventListener) return;
    this._cap = (e) => {
      const top = this.modal;
      if (!top || !top.capture || this.dialog) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (!e.repeat) this.keys[k] = 'pressed';
      this._typed.push(e.key);
      if (e.ctrlKey || e.metaKey) return;
      e.stopPropagation();
      if (['Tab', ' ', 'Backspace', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', "'", '/'].includes(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', this._cap, true);
  }
  _captureOff() { if (this._cap && typeof window !== 'undefined') window.removeEventListener('keydown', this._cap, true); this._cap = null; }
  anim(key, init) { let a = this._anim.get(key); if (!a) { a = Object.assign({ t: 0 }, init); this._anim.set(key, a); } a.seen = this.frameN; return a; }
  // ------------------------------------------------------------------ primitives
  fill(c) { if (this._fs !== c) { this.g.fillStyle = css(c); this._fs = c; } return this.g; }
  px(x, y, c) { this.fill(c).fillRect(Math.floor(x), Math.floor(y), 1, 1); }
  rect(x, y, w, h, c) { x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h); if (w > 0 && h > 0) this.fill(c).fillRect(x, y, w, h); }
  fade(a, c = '#000000') { if (a <= 0) return; this.g.fillStyle = rgba(c, Math.min(1, a)); this._fs = null; this.g.fillRect(0, 0, this.w, this.h); }
  // text: o = { mini, scale, spacing, shadow, outline (true → ink), align, bold, grad: [top, …, bottom] } → width
  // outlined dark text turns light (white type with a dark outline over the world); shadows sit 1 px down-right
  text(str, x, y, c = T.text, o = {}) {
    str = String(str ?? ''); if (!str) return 0;
    const F = faceOf(o), M = faceMetrics(F), sp = o.spacing || 0, w = measureStr(F, str, sp);
    let out = o.outline === true ? T.ink : o.outline || null, shad = o.shadow === true ? T.ink : o.shadow || null;
    let col = c ?? (o.grad ? o.grad[Math.min(o.grad.length - 1, 1)] : T.text);
    if (out && isDark(col) && isDark(out)) col = col === T.dim ? T.cream : '#fff8ec';
    if (shad && isDark(shad) && !out && lum(col) < 170) shad = null;
    const x0 = Math.round(o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x);
    const by = Math.round(y) - M.asc + Math.round(((o.mini ? 5 : 7) * (F.cap > 7 ? F.cap / 7 : 1) - M.capH) / 2);   // the em-box top
    const g = this.g; g.imageSmoothingEnabled = false;
    const drawRun = (colr) => { let cx = x0; for (const ch of str) { const G = glyph(F, ch, colr, out, shad); if (G && G.cv) g.drawImage(G.cv, cx + G.ox, by + G.oy); cx += advance(F, ch) + sp; } };
    drawRun(col);
    // a two-tone title: the upper rows in grad[0] (pixel art has no gradients)
    const top = o.grad && o.grad.length > 1 ? o.grad[0] : null;
    if (top && top !== col) { const hh = Math.max(1, Math.round(M.capH * 0.45)); g.save(); g.beginPath(); g.rect(x0 - 4, by + M.asc - 4, w + 8, hh + 4); g.clip(); drawRun(top); g.restore(); this._fs = null; }
    return w;
  }
  tw(str, o = {}) { str = String(str ?? ''); if (!str) return 0; return measureStr(faceOf(o), str, o.spacing || 0); }
  wrap(str, maxW, o = {}) {
    const out = [];
    for (const para of String(str).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const tryL = line ? line + ' ' + word : word;
        if (this.tw(tryL, o) > maxW && line) { out.push(line); line = word; } else line = tryL;
      }
      out.push(line);
    }
    return out;
  }
  // 7×7 icon glyph (auto-bevelled, drop shadow). o.big → the detailed version (c optional: natural colours)
  icon(name, x, y, c = T.text, shadow = T.ink, o) {
    if (o && (o.big || o.size >= 10)) return drawBig(this.s, name, x, y, o.tint ? c : null, o);
    drawSmall(this.s, name, x, y, c, shadow);
  }
  // detailed full-colour pixel-art icon in a 12×12 box (o.scale: a bigger box, whole-pixel steps); c: tint
  bigIcon(name, x, y, c = null, o = {}) { drawBig(this.s, name, x, y, c, o); }
  rrect(x, y, w, h, c, r = 2) { fillShape(this, x, y, w, h, c, r); }
  // panel: a cream card in a copper frame. o: fill (interior colour), paper, alpha, edge (frame tint), line, shadow, r, pill, thin, brackets
  panel(x, y, w, h, o = {}) { frame(this, x, y, w, h, o); }
  // a name plate: a raised cream banner with tiny diamonds either side of the title (and an optional icon badge). Returns its width
  banner(x, y, str, o = {}) {
    const tw = this.tw(str, { mini: true, bold: true }), w = tw + 30 + (o.icon ? 12 : 0), h = 13;
    frame(this, x, y - 1, w, h, { thin: true, r: 2, shadowA: 0.3, edge: o.edge });
    let cx = x + 6;
    if (o.icon) { drawBig(this.s, o.icon, x + 3, y - 1, null, { shadow: false }); cx += 12; }
    gem(this.s, cx, y + 5, o.color || T.copperL, 2);
    this.text(str, cx + 6, y + 3, T.text, { mini: true, bold: true });
    gem(this.s, cx + tw + 11, y + 5, o.color || T.copperL, 2);
    return w;
  }
  // a bar: v 0..1. h ≤ 7 → a thin pill bar with end caps; h ≥ 8 → a thick capsule in a copper frame with
  // brass clamps. A damage trail lingers then drains; low values blink. o: color (ramp name or hex), back,
  // seg, ghost, id (trail key), shine (false = off), trail (false = off), clamps (false = off)
  bar(x, y, w, h, v, o = {}) {
    v = clamp01(+v || 0);
    const key = o.id ?? (x * 7919 + y * 131 + w * 7 + h);
    let B = this._bars.get(key);
    if (!B) { B = { v, trail: v, hold: 0, flash: 0 }; this._bars.set(key, B); }
    B.seen = this.frameN;
    if (v < B.v - 1e-4) { B.trail = Math.max(B.trail, B.v); B.hold = 0.5; } else if (v > B.v + 1e-4) B.flash = 0.35;
    if (v > B.trail) B.trail = v;
    B.v = v;
    if (B.hold > 0) B.hold -= this.dt; else B.trail = Math.max(v, B.trail - this.dt * 0.8);
    if (B.flash > 0) B.flash -= this.dt;
    let col = o.color || (v > 0.5 ? 'green' : v > 0.22 ? 'orange' : 'red');
    if (!o.color && v <= 0.22 && v > 0 && ((this.t * 4) | 0) % 2) col = 'yellow';
    if (B.flash > 0 && ((B.flash * 20) | 0) % 2) col = 'yellow';
    barShape(this, x, y, w, h, v, { color: col, back: o.back, seg: o.seg, ghost: o.ghost, trail: o.trail === false ? 0 : B.trail, shine: o.shine, clamps: o.clamps, caps: o.caps, t: this.t });
  }
  // ------------------------------------------------------------------ input
  inside(x, y, w, h) { return this.ptr.x >= x && this.ptr.y >= y && this.ptr.x < x + w && this.ptr.y < y + h; }
  blocked(o = {}) { return (this.dialog && !o.modal) || (this.modals.length && !this._inModal && !o.modal); }
  // a button: returns true on click. A pixel face on a darker lip, squashing onto it while held, boinging
  // back on release, with a tap sound on every press. o: color (face; default cream), fill, active, disabled,
  // icon, sub, subColor, key, hotkey, textColor, mini, modal, frame ('copper')
  button(x, y, w, h, label, o = {}) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const dis = !!o.disabled, blk = this.blocked(o), over = this.inside(x, y, w, h) && !dis && !blk, down = over && this.ptr.down;
    if (over) this.hot = label;
    const a = this.anim((x * 7919 + y * 104729 + w * 31 + h) | 0, { bt: 9, hov: 0 });
    a.bt += this.dt; a.hov += ((over ? 1 : 0) - a.hov) * Math.min(1, this.dt * 14);
    if (over && this.ptr.pressed) this.click('ui_tap', { vol: 0.7, pitch: 1.05 + (40 / Math.max(20, w)) * 0.1 });
    const hk = o.hotkey && this.key(o.hotkey) && !dis && !blk, clicked = (over && this.ptr.released) || hk;
    if (clicked) { a.bt = 0; if (hk) this.click('ui_tap', { vol: 0.7 }); }
    const col = dis ? '#a89a8c' : o.fill || o.color || T.cream, lip = h >= 14 ? 3 : 2, st = dis ? 3 : down ? 2 : over || o.active ? 1 : 0;
    const sq = squash(a.bt, 0.12), g = this.g, cx = x + w / 2, cy = y + h, xf = Math.abs(sq) > 0.01;
    if (xf) { g.save(); g.translate(Math.round(cx), cy); g.scale(1 + sq, 1 - sq); g.translate(-Math.round(cx), -cy); }
    knob(this, x, y - (st === 1 && !o.active ? 1 : 0), w, h, { color: col, state: st, lip, active: !!o.active && !dis, frame: o.frame });
    const lift = st === 1 && !o.active ? 1 : 0, fy = y - lift + (down ? lip - 1 : 0), fh = h - lip, mini = !!o.mini;
    const lightFace = !isDark(col) && luma(col) > 150, lc = dis ? '#ece4da' : o.textColor || (lightFace ? T.text : '#ffffff'), ink = lightFace ? null : mx(col, T.ink, 0.7);
    const ty = fy + Math.round((fh - (mini ? 5 : 7)) / 2);
    if (o.icon) {
      const bigI = fh >= 13 && !mini, iw = bigI ? 12 : 7, lw = label ? this.tw(label, { mini, bold: !mini }) + iw + 3 : iw, ix = Math.round(cx - lw / 2);
      if (bigI) drawBig(this.s, o.icon, ix, fy + Math.round((fh - 12) / 2), null, { shadow: false, dim: dis ? 0.5 : 0 });
      else drawSmall(this.s, o.icon, ix, fy + Math.round((fh - 7) / 2), lightFace ? T.copper : '#ffffff', ink || T.creamD);
      if (label) this.text(label, ix + iw + 3, ty, lc, { outline: ink, mini, bold: !mini });
    } else if (label) this.text(label, cx, ty, lc, { align: 'center', outline: ink, mini, bold: !mini });
    if (o.sub) this.text(o.sub, x + w - 4, fy + fh - 8, o.subColor || lc, { align: 'right', mini: true, outline: ink });
    if (o.key) this.text(o.key, x + 4, fy + 3, lc, { mini: true, outline: ink });
    if (xf) { g.restore(); this._fs = null; }
    if (clicked) this.ptr.released = false;
    return clicked;
  }
  // run fn with drawing clipped to a rect (fn gets the real coordinates). r: corner radius of the clip
  clip(x, y, w, h, fn, r = 0) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const g = this.g, I = rowIns(Math.max(1, h), Math.min(r, h / 2, w / 2));
    g.save(); g.beginPath();
    if (r) { for (let j = 0; j < h; j++) g.rect(x + I[j], y + j, w - I[j] * 2, 1); } else g.rect(x, y, w, h);
    g.clip();
    try { fn(); } finally { g.restore(); this._fs = null; this._font = null; }
  }
  // ------------------------------------------------------------------ dialogue
  say(name, str, o = {}) { return new Promise((resolve) => { this.dialog = { name, str: String(str), shown: 0, t: 0, resolve, o, choices: o.choices || null, pick: 0, done: false }; }); }
  choose(prompt, choices, o = {}) { return this.say(o.name || '', prompt, Object.assign({}, o, { choices })); }
  drawDialog() { if (this.dialog) drawDialog(this); }
  closeDialog(v) { const D = this.dialog; if (!D) return; this.dialog = null; this.keys = {}; this.click('ui_tap', { vol: 0.5, pitch: 1.2 }); D.resolve(v); }
  // ------------------------------------------------------------------ toasts
  toast(str, o = {}, ms) {
    if (typeof o === 'string') o = { color: o === 'gold' ? T.amber : o === 'good' ? T.green : o === 'bad' ? T.red : undefined };
    if (ms && !o.dur) o = Object.assign({}, o, { dur: ms / 1000 });
    if (this.toasts.some((t) => t.str === str)) return;
    this.toasts.push({ str, t: 0, dur: o.dur || 2.2, color: o.color || T.amber, icon: o.icon || 'star' });
  }
  // toasts are cream value pills with a big round icon badge overlapping the left end, bouncing in from the top
  drawToasts() {
    let y = this.toastY ?? (this.w < 360 ? Math.round(this.h * 0.22) : 8), n = 0;
    for (const t of this.toasts) {
      if (n++ >= 3) break;
      t.t += this.dt || 1 / 60;
      const kin = boing(t.t * 1.6), kout = clamp01((t.dur - t.t) * 4);
      if (kout <= 0) continue;
      let str = String(t.str); const maxW = this.w - 60;
      if (this.tw(str, { bold: true }) > maxW) { while (str.length > 4 && this.tw(str + '…', { bold: true }) > maxW) str = str.slice(0, -1); str = str.replace(/\s+$/, '') + '…'; }
      const h = 17, w = Math.round(this.tw(str, { bold: true }) + 34), x = Math.round(this.w / 2 - w / 2 + 6), yy = y + Math.round((1 - kin) * -26 - (1 - easeOut(kout)) * 26);
      pill(this, x, yy, w, h);
      W.badge(this, x + 1, yy + h / 2, 10, t.icon, t.color);
      this.text(str, x + 17, yy + 5, T.text, { bold: true });
      if (t.t < 0.7) sparkle(this.s, x + w - 3, yy + 1, T.amberL, 1 - t.t / 0.7);
      y += h + 4;
    }
    if (this.toasts.length && this.toasts.some((t) => t.t >= t.dur)) this.toasts = this.toasts.filter((t) => t.t < t.dur);
  }
  // ------------------------------------------------------------------ widgets (see uikit/widgets.js)
  keycap(x, y, label, o) { return W.keycap(this, x, y, label, o); }
  prompt(x, y, keyLabel, str, o) { return W.prompt(this, x, y, keyLabel, str, o); }
  joystick(cx, cy, r, dx, dy, active, o) { return W.joystick(this, cx, cy, r, dx, dy, active, o); }
  hudClock(x, y, info, o) { return W.hudClock(this, x, y, info, o); }
  hudMoney(x, y, amount, o) { return W.hudMoney(this, x, y, amount, o); }
  hudLocation(x, y, name, sub, o) { return W.hudLocation(this, x, y, name, sub, o); }
  partyBar(x, y, party, o) { return W.partyBar(this, x, y, party, o); }
  minimap(x, y, w, h, draw, o) { return W.minimap(this, x, y, w, h, draw, o); }
  objective(x, y, str, o) { return W.objective(this, x, y, str, o); }
  iconButton(x, y, size, icon, o) { return W.iconButton(this, x, y, size, icon, o); }
  roundButton(cx, cy, r, icon, o) { return W.roundButton(this, cx, cy, r, icon, o); }
  plinthButton(cx, y, icon, o) { return W.plinthButton(this, cx, y, icon, o); }
  valuePill(x, y, w, icon, value, o) { return W.valuePill(this, x, y, w, icon, value, o); }
  cursor(x, y, dir = 'right', c = T.amber) { tri(this.s, x, y, dir, 3, c); }
  gem(x, y, c = T.cyan, r = 3) { gem(this.s, x, y, c, r); }
  sparkle(x, y, c = T.amberL, k = 1) { sparkle(this.s, x, y, c, k); }
  emblem(name, cx, cy, scale = 4, tint = null) { drawEmblem(this.s, name, cx, cy, scale, tint, 0); }
  // an image (canvas / ImageBitmap / ImageData) drawn into a box; o: { smooth (default for downscaling), alpha }
  image(src, x, y, w, h, o = {}) { W.drawImage(this, src, x, y, w, h, o); }
  // ------------------------------------------------------------------ full-screen modal screens (see uikit/screens.js)
  nameEntry(o = {}) { return new Promise((resolve) => this.openModal(nameEntryScreen(this, o, resolve))); }
  pickCards(o = {}) { return new Promise((resolve) => this.openModal(pickCardsScreen(this, o, resolve))); }
}
function lum(c) { return luma(c); }
function luma(c) { if (typeof c !== 'string' || c[0] !== '#') return 0; const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16); return r * 0.3 + g * 0.59 + b * 0.11; }
void hash; void easeOutBack; void sprite; void blit; void ball;
