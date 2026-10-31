// The game UI, drawn every frame (immediate mode). Layout works in "units" (a ~640×360 grid: w × h) while
// the canvas runs at the screen's physical resolution — ui.k device pixels per unit, DPR-aware (3 on a
// 1080p screen, 6 on a 4K one) — so everything is crisp and detailed, never chunky:
//  • panels, buttons, bars, discs and icons are pixel art painted at physical resolution (1-px near-black
//    outlines, multi-tone ramps, hand-placed highlights; uikit/frame.js, uikit/icons.js) and blitted snapped
//  • text is crisp vector type: Baloo 2 for body text and labels, Silkscreen for big pixel titles (always at
//    a whole multiple of its 8-px grid, so it stays pixel-perfect)
// The look: warm cream parchment cards in chunky copper frames with corner brackets and rivets, glossy
// capsule bars with brass clamps, icon buttons on wooden plinths, cream value pills — and every press
// squashes and boings back with a tap sound.
// Lag: everything detailed is a cached sprite; text widths are memoised; the transform stack (push / pop)
// allocates nothing; a frame of UI is a few hundred drawImage / fillRect / fillText calls.
import { T, mx, hash, clamp01, easeOut, easeOutBack, boing, squash, isDark } from './uikit/theme.js';
import { css, rgba, makeCanvas, CanvasSurf, fillShape, rowIns, sprite, blit, pixelCanvas, PX, PY } from './uikit/gfx.js';
import { drawSmall, drawBig, drawEmblem, ICON_NAMES } from './uikit/icons.js';
import { frame, knob, pill, tri, gem, sparkle, ball, barShape } from './uikit/frame.js';
import { drawDialog } from './uikit/dialog.js';
import * as W from './uikit/widgets.js';
import { nameEntryScreen, pickCardsScreen } from './uikit/screens.js';
import { P } from '../surface.js';

export { T, ICON_NAMES };

// ------------------------------------------------------------------ pixel fonts
const FONT_FILES = [['TKBaloo', 'baloo2.woff2', '400 800'], ['TKSilkscreen', 'silkscreen.woff2', '400'], ['TKSilkscreen', 'silkscreen-bold.woff2', '700']];
let fontP = null, fontGen = 0;
export function loadUIFont() {
  if (fontP) return fontP;
  if (typeof FontFace === 'undefined' || typeof document === 'undefined' || !document.fonts) return (fontP = Promise.resolve());
  const jobs = FONT_FILES.map(([fam, file, weight]) => new FontFace(fam, `url(${new URL('../../../assets/fonts/' + file, import.meta.url).href})`, { weight }).load().then((f) => document.fonts.add(f)).catch(() => {}));
  fontP = Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 3000))]).then(() => { fontGen++; faces.clear(); widths.clear(); });
  return fontP;
}
export const FAMILY = '"TKBaloo", "Baloo 2", "Trebuchet MS", "Helvetica Neue", Arial, sans-serif';
const PIXEL = '"TKSilkscreen", monospace';
let mctx = null;
function measurer() { if (!mctx) { const c = makeCanvas(4, 4); mctx = c ? c.getContext('2d') : null; } return mctx; }
// a face for a text style at a ui scale k: { css (size in units), cap (units), id }. Body text and labels are
// Baloo 2 sized so capitals stand 7 units (5 for mini) tall; big titles (scale ≥ 1.5) are Silkscreen Bold at a
// whole multiple of its 8-px grid in DEVICE pixels, so the pixel type stays pixel-perfect
const faces = new Map(), widths = new Map();
function faceOf(o, k) {
  const sc = o.scale || 1, mini = !!o.mini, bold = !!o.bold || sc > 1.1;
  const key = (sc >= 1.5 ? 1000 : 0) + Math.round(sc * 8) * 4 + (mini ? 1 : 0) + (bold ? 2 : 0) + k * 100000;
  let F = faces.get(key);
  if (F) return F;
  if (sc >= 1.5) { const pxSize = 8 * Math.max(2, Math.round((sc * 5 * k) / 5)), u = pxSize / k; F = { id: key, css: `700 ${u.toFixed(3)}px ${PIXEL}`, cap: u * 0.625, pixel: true }; }
  else {
    const weight = bold ? 800 : mini ? 700 : 600, m = measurer();
    let capR = 0.6; if (m) { m.font = `${weight} 100px ${FAMILY}`; const mt = m.measureText('H'); if (mt.actualBoundingBoxAscent > 20) capR = mt.actualBoundingBoxAscent / 100; }
    const cap = (mini ? 5 : 7) * sc; F = { id: key, css: `${weight} ${(cap / capR).toFixed(3)}px ${FAMILY}`, cap };
  }
  faces.set(key, F);
  return F;
}
function measureStr(F, str, sp) {
  let M = widths.get(F.id); if (!M) widths.set(F.id, (M = new Map()));
  let w = M.get(str);
  if (w === undefined) { const m = measurer(); if (m) { m.font = F.css; w = m.measureText(str).width; } else w = str.length * F.cap * 0.7; if (M.size > 4000) M.clear(); M.set(str, w); }
  return w + (sp ? sp * (str.length - 1) : 0);
}

export class PixelUI {
  // w, h: the layout grid in units. o: { canvas (draw onto this canvas), scale (device px per unit when no
  // physical size is given; default 3) }
  constructor(w, h, o = {}) {
    this.k0 = o.scale || 3;
    this.cv = o.canvas || makeCanvas(w * this.k0, h * this.k0);
    this.g = this.cv ? this.cv.getContext('2d', { alpha: true }) : null;
    this.s = new CanvasSurf(this);
    this.tstack = new Float64Array(4 * 64); this.tsp = 0;
    this.resize(w, h, o.pw, o.ph);
    this.ptr = { x: -1, y: -1, down: false, pressed: false, released: false, id: null };
    this.t = 0; this.dt = 1 / 60; this.frameN = 0;
    this.dialog = null; this.toasts = []; this.keys = {}; this.modalLock = 0;
    this.modals = []; this._typed = []; this.typed = []; this._bars = new Map(); this._anim = new Map();
    this.sfx = null;                               // (id, o) → plays a UI sound (set by the app)
    this._fg = fontGen;
    loadUIFont();
  }
  // w, h: the layout grid (units); pw, ph: the canvas in device pixels (default w·scale × h·scale)
  resize(w, h, pw, ph) {
    this.w = w; this.h = h;
    pw = Math.max(16, Math.round(pw || w * this.k0)); ph = Math.max(16, Math.round(ph || h * this.k0));
    if (this.cv && (this.cv.width !== pw || this.cv.height !== ph)) { this.cv.width = pw; this.cv.height = ph; }
    this.pw = pw; this.ph = ph; this.k = Math.round((pw / w) * 1000) / 1000; this.kx = this.ky = this.k;
    this.ta = this.td = this.k; this.te = this.tf = 0; this.tsp = 0;
    this._fs = null; this._font = null;
  }
  // a scale about the unit point (cx, cy) (and a shift dx, dy) for what is drawn until pop(): bounces, squashes, slides
  push(cx, cy, sx = 1, sy = sx, dx = 0, dy = 0) {
    const S = this.tstack, i = this.tsp * 4; if (this.tsp >= 63) return;
    S[i] = this.ta; S[i + 1] = this.td; S[i + 2] = this.te; S[i + 3] = this.tf; this.tsp++;
    const a = this.ta * sx, d = this.td * sy;
    this.te = this.ta * (cx + dx) + this.te - a * cx; this.tf = this.td * (cy + dy) + this.tf - d * cy; this.ta = a; this.td = d;
    if (this.g) this.g.setTransform(this.ta, 0, 0, this.td, this.te, this.tf);
  }
  pop() {
    if (!this.tsp) return;
    this.tsp--; const S = this.tstack, i = this.tsp * 4;
    this.ta = S[i]; this.td = S[i + 1]; this.te = S[i + 2]; this.tf = S[i + 3];
    if (this.g) this.g.setTransform(this.ta, 0, 0, this.td, this.te, this.tf);
  }
  // ------------------------------------------------------------------ frame
  begin(dt) {
    this.dt = dt || 0; this.t += this.dt; this.frameN++;
    if (this._fg !== fontGen) { this._fg = fontGen; }
    const g = this.g;
    this.ta = this.td = this.k; this.te = this.tf = 0; this.tsp = 0;
    if (g) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, this.pw, this.ph); g.setTransform(this.k, 0, 0, this.k, 0, 0); g.imageSmoothingEnabled = false; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.lineJoin = 'round'; g.miterLimit = 2; }
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
  px(x, y, c) { this.rect(Math.floor(x), Math.floor(y), 1, 1, c); }
  // a crisp rect: snapped to device pixels (a unit is k pixels)
  rect(x, y, w, h, c) {
    const X = PX(this, x), Y = PY(this, y), W = PX(this, x + w) - X, H = PY(this, y + h) - Y; if (W <= 0 || H <= 0) return;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); this.fill(c).fillRect(X, Y, W, H); g.setTransform(this.ta, 0, 0, this.td, this.te, this.tf);
  }
  fade(a, c = '#000000') { if (a <= 0) return; const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = rgba(c, Math.min(1, a)); this._fs = null; g.fillRect(0, 0, this.pw, this.ph); g.setTransform(this.ta, 0, 0, this.td, this.te, this.tf); }
  // text: o = { mini, scale, spacing, shadow, outline (true → ink), align, bold, grad: [top, …, bottom] } → width
  // crisp vector type; outlined dark text turns light (white type with a dark outline over the world)
  text(str, x, y, c = T.text, o = {}) {
    str = String(str ?? ''); if (!str) return 0;
    const F = faceOf(o, this.k), g = this.g, sp = o.spacing || 0, w = measureStr(F, str, sp);
    let out = o.outline === true ? T.ink : o.outline || null, shad = o.shadow === true ? T.ink : o.shadow || null;
    let col = c ?? (o.grad ? o.grad[o.grad.length - 1] : T.text);
    if (out && isDark(col) && isDark(out)) col = col === T.dim ? T.cream : '#fff8ec';
    if (shad && isDark(shad) && !out && luma(col) < 170) shad = null;
    const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    // the cap top sits at y (centred in the old 7 / 5-unit glyph box); snap the baseline to a device pixel
    const box = (o.mini ? 5 : 7) * (o.scale || 1), by = Math.round((y + (box + F.cap) / 2) * this.td + this.tf) / this.td - this.tf / this.td;
    const bx = F.pixel ? Math.round(x0 * this.ta + this.te) / this.ta - this.te / this.ta : x0;
    if (this._font !== F.css) { g.font = F.css; this._font = F.css; }
    if (sp && 'letterSpacing' in g) g.letterSpacing = sp + 'px';
    const k = this.k;
    if (shad) { const off = Math.max(1, Math.round(k * 0.5)) / k; if (out) { g.strokeStyle = css(shad); g.lineWidth = (o.mini ? 3.2 : 4.2) / k * Math.max(1, k * 0.7); g.strokeText(str, bx + off, by + off); } this.fill(shad).fillText(str, bx + off, by + off); }
    if (out) { g.strokeStyle = css(out); g.lineWidth = F.pixel ? Math.max(2, Math.round(k * 0.9)) * 2 / k : (o.mini ? 3.2 : 4.2) / k * Math.max(1, k * 0.7); g.strokeText(str, bx, by); }
    if (o.grad && o.grad.length > 1) { const gr = g.createLinearGradient(0, by - F.cap, 0, by); const n = o.grad.length - 1; o.grad.forEach((cc, i) => gr.addColorStop(n ? i / n : 0, css(cc))); g.fillStyle = gr; this._fs = null; }
    else this.fill(col);
    g.fillText(str, bx, by);
    if (sp && 'letterSpacing' in g) g.letterSpacing = '0px';
    return w;
  }
  tw(str, o = {}) { str = String(str ?? ''); if (!str) return 0; return measureStr(faceOf(o, this.k), str, o.spacing || 0); }
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
    const sq = squash(a.bt, 0.12), cx = x + w / 2, cy = y + h, xf = Math.abs(sq) > 0.01;
    if (xf) this.push(cx, cy, 1 + sq, 1 - sq);
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
    if (xf) this.pop();
    if (clicked) this.ptr.released = false;
    return clicked;
  }
  // run fn with drawing clipped to a rect (fn gets the real coordinates). r: corner radius of the clip
  clip(x, y, w, h, fn, r = 0) {
    const X = PX(this, x), Y = PY(this, y), W = PX(this, x + w) - X, H = PY(this, y + h) - Y, g = this.g;
    const I = rowIns(Math.max(1, H), Math.min(r * this.td, H / 2, W / 2));
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath();
    if (r) { let j = 0; while (j < H) { let q = j; while (q + 1 < H && I[q + 1] === I[j]) q++; g.rect(X + I[j], Y + j, W - I[j] * 2, q - j + 1); j = q + 1; } } else g.rect(X, Y, W, H);
    g.setTransform(this.ta, 0, 0, this.td, this.te, this.tf); g.clip();
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
