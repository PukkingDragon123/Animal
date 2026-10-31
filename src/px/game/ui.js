// The game UI, drawn every frame (immediate mode) with Canvas2D at the REAL screen resolution.
// Layout still works in "UI units" — the old ~480×270 grid (w × h) — and the canvas transform scales
// it to the device pixels, so text (a chunky rounded web font), panels and shapes are smooth and crisp
// on any screen, while pixel-art icons are blitted as crisp scaled sprites.
// The look is the TokoPhone's: a bright, chunky handheld-RPG gadget. Thick indigo outlines, glossy
// white bezels around royal-blue screens, cream paper cards, candy buttons with a lip that squash and
// boing back (with a tap sound on every press), sparkles and bounces.
// Primitives (panel, button, bar, banner, icons, toasts), the dialogue box with round portrait +
// choices, roaming-HUD widgets (prompt bubble, keycaps, thumbstick, clock, coins, place ribbon, party
// medals, minimap) and full-screen modal screens (name entry, card picker). Widget bodies live in
// ./uikit/; this class keeps the state and the public API.
// Lag: panels and button faces are painted once into hi-res sprites (uikit/gfx.js cachedDraw), text
// widths and font strings are memoised, and nothing per frame allocates buffers.
import { T, mx, hash, clamp01, easeOut, easeOutBack, boing } from './uikit/theme.js';
import { css, rgba, rr, vgrad, makeCanvas, CanvasSurf } from './uikit/gfx.js';
import { drawSmall, drawBig, drawEmblem, ICON_NAMES } from './uikit/icons.js';
import { frame, candy, tri, gem, sparkle, ball } from './uikit/frame.js';
import { drawDialog } from './uikit/dialog.js';
import * as W from './uikit/widgets.js';
import { nameEntryScreen, pickCardsScreen } from './uikit/screens.js';

export { T, ICON_NAMES };

// ------------------------------------------------------------------ the UI font
export const FAMILY = '"TokoRound", "Baloo 2", "Arial Rounded MT Bold", "Trebuchet MS", "Helvetica Neue", Arial, sans-serif';
let fontP = null, fontGen = 0;
export function loadUIFont() {
  if (fontP) return fontP;
  if (typeof FontFace === 'undefined' || typeof document === 'undefined' || !document.fonts) return (fontP = Promise.resolve());
  const url = new URL('../../../assets/fonts/baloo2-latin.woff2', import.meta.url).href;
  const ff = new FontFace('TokoRound', `url(${url})`, { weight: '400 800' });
  fontP = Promise.race([ff.load().then((f) => { document.fonts.add(f); fontGen++; }), new Promise((r) => setTimeout(r, 2500))]).catch(() => {});
  return fontP;
}
let mctx = null;
function measurer() { if (!mctx) { const c = makeCanvas(4, 4); mctx = c ? c.getContext('2d') : null; } return mctx; }
const fontCache = new Map(), widthCache = new Map();
let fontCacheGen = -1;
// { font, cap } for a text style: the size is picked so capitals stand cap units tall (7 normal, 5 mini)
function fontOf(mini, bold, sc) {
  if (fontCacheGen !== fontGen) { fontCache.clear(); widthCache.clear(); fontCacheGen = fontGen; }
  const key = sc * 8 + (mini ? 1 : 0) + (bold ? 2 : 0);
  let F = fontCache.get(key);
  if (F) return F;
  const weight = bold ? 800 : mini ? 700 : 600, m = measurer();
  let capR = 0.62;
  if (m) { m.font = `${weight} 100px ${FAMILY}`; const mt = m.measureText('H'); if (mt.actualBoundingBoxAscent > 20) capR = mt.actualBoundingBoxAscent / 100; }
  const cap = (mini ? 5 : 7) * sc, size = cap / capR;
  F = { font: `${weight} ${size.toFixed(2)}px ${FAMILY}`, cap, size };
  fontCache.set(key, F);
  return F;
}
function measure(str, F) {
  let M = widthCache.get(F.font); if (!M) widthCache.set(F.font, (M = new Map()));
  let w = M.get(str);
  if (w === undefined) { const m = measurer(); if (m) { m.font = F.font; w = m.measureText(str).width; } else w = str.length * F.size * 0.5; if (M.size > 3000) M.clear(); M.set(str, w); }
  return w;
}

export class PixelUI {
  // w, h: UI units. o: { canvas (draw onto this canvas), scale (pixels per unit when no size is given) }
  constructor(w, h, o = {}) {
    this.cv = o.canvas || makeCanvas(w * (o.scale || 3), h * (o.scale || 3));
    this.g = this.cv ? this.cv.getContext('2d') : null;
    this.s = new CanvasSurf(this);
    this.k0 = o.scale || 3;
    this.resize(w, h, o.pw, o.ph);
    this.ptr = { x: -1, y: -1, down: false, pressed: false, released: false, id: null };
    this.t = 0; this.dt = 1 / 60; this.frameN = 0;
    this.dialog = null; this.toasts = []; this.keys = {}; this.modalLock = 0;
    this.modals = []; this._typed = []; this.typed = []; this._bars = new Map(); this._anim = new Map();
    this.sfx = null;                               // (id, o) → plays a UI sound (set by the app)
    loadUIFont();
  }
  // w, h: UI units; pw, ph: the canvas size in device pixels (default w·scale × h·scale)
  resize(w, h, pw, ph) {
    this.w = w; this.h = h;
    pw = Math.max(1, Math.round(pw || w * this.k0)); ph = Math.max(1, Math.round(ph || h * this.k0));
    if (this.cv && (this.cv.width !== pw || this.cv.height !== ph)) { this.cv.width = pw; this.cv.height = ph; }
    this.pw = pw; this.ph = ph; this.kx = pw / w; this.ky = ph / h; this.k = Math.min(this.kx, this.ky);
    this._fs = null; this._font = null;
  }
  // ------------------------------------------------------------------ frame
  begin(dt) {
    this.dt = dt || 0; this.t += this.dt; this.frameN++;
    const g = this.g;
    if (g) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, this.pw, this.ph); g.setTransform(this.kx, 0, 0, this.ky, 0, 0); g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; }
    this._fs = null; this._font = null;
    this.hot = null; this.frameButtons = 0;
    // an open modal screen owns this frame's input: hide it from everything drawn before end()
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
    this.keys = {}; this.typed = [];             // key presses latch for exactly one frame
  }
  key(k) { return this.keys[k] === 'pressed'; }
  click(id = 'ui_tap', o) { if (this.sfx) try { this.sfx(id, o); } catch (e) { /* audio is optional */ } }
  // ------------------------------------------------------------------ modal screens (block all other input while open)
  get modal() { return this.modals[this.modals.length - 1] || null; }
  openModal(m) {
    m.t = 0; this.modals.push(m);
    if (m.capture) this._captureOn();
    return m;
  }
  closeModal(m, v) {
    if (m === undefined || m === null || typeof m !== 'object' || !this.modals.includes(m)) { v = m && typeof m === 'object' ? v : m; m = this.modal; }
    if (!m) return;
    this.modals = this.modals.filter((x) => x !== m);
    if (!this.modals.some((x) => x.capture)) this._captureOff();
    this.keys = {}; this.ptr.released = false; this._typed = [];
    if (m.onClose) m.onClose(v);
    if (m.resolve) m.resolve(v);
  }
  // while a capturing modal is open, physical keys go to it (with their real case) and not to the game
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
  // per-widget animation memory (keyed; pruned when a widget stops being drawn)
  anim(key, init) { let a = this._anim.get(key); if (!a) { a = Object.assign({ t: 0 }, init); this._anim.set(key, a); } a.seen = this.frameN; return a; }
  // ------------------------------------------------------------------ primitives
  fill(c) { if (this._fs !== c) { this.g.fillStyle = css(c); this._fs = c; } return this.g; }
  px(x, y, c) { this.s.px(x, y, c); }
  rect(x, y, w, h, c) { if (w > 0 && h > 0) this.fill(c).fillRect(x, y, w, h); }
  fade(a, c = '#000000') {
    if (a <= 0) return;
    const g = this.g; g.fillStyle = rgba(c, Math.min(1, a)); this._fs = null;
    g.fillRect(-1, -1, this.w + 2, this.h + 2);
  }
  // text: o = { mini, scale, spacing, shadow, outline (true → ink), align, bold, grad: [top, …, bottom] } → width
  text(str, x, y, c = T.text, o = {}) {
    str = String(str ?? ''); if (!str) return 0;
    const sc = o.scale || 1, F = fontOf(!!o.mini, !!o.bold, sc), g = this.g;
    const sp = o.spacing || 0, w = measure(str, F) + (sp ? sp * (str.length - 1) : 0);
    const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, by = y + F.cap;
    if (this._font !== F.font) { g.font = F.font; this._font = F.font; }
    if (sp && 'letterSpacing' in g) g.letterSpacing = sp + 'px';
    const out = o.outline === true ? T.ink : o.outline, shad = o.shadow === true ? T.ink : o.shadow;
    if (out) { g.lineJoin = 'round'; g.miterLimit = 2; g.strokeStyle = css(out); g.lineWidth = (o.mini ? 1.7 : 2.3) * Math.max(1, sc * 0.8); g.strokeText(str, x0, by); }
    if (shad) { this.fill(shad).fillText(str, x0 + 0.35, by + 0.9); }
    if (o.grad) { const gr = g.createLinearGradient(0, by - F.cap * 1.05, 0, by + 0.5); const n = o.grad.length - 1; o.grad.forEach((cc, i) => gr.addColorStop(n ? i / n : 0, css(cc))); g.fillStyle = gr; this._fs = null; }
    else this.fill(c ?? T.text);
    g.fillText(str, x0, by);
    if (sp && 'letterSpacing' in g) g.letterSpacing = '0px';
    return w;
  }
  tw(str, o = {}) { str = String(str ?? ''); if (!str) return 0; const F = fontOf(!!o.mini, !!o.bold, o.scale || 1); return measure(str, F) + (o.spacing ? o.spacing * (str.length - 1) : 0); }
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
  // 7×7 icon glyph (auto-bevelled, drop shadow). o.big → the detailed 12-unit version (c optional: natural colours)
  icon(name, x, y, c = T.text, shadow = T.ink, o) {
    if (o && (o.big || o.size >= 10)) return drawBig(this.s, name, x, y, o.tint ? c : null, o);
    drawSmall(this.s, name, x, y, c, shadow);
  }
  // detailed full-colour pixel-art icon in a 12×12 box; c: tint (null → the icon's own colours); o: { scale, outline, shadow, dim }
  bigIcon(name, x, y, c = null, o = {}) { drawBig(this.s, name, x, y, c, o); }
  // rounded rect fill
  rrect(x, y, w, h, c, r = 2) { if (w <= 0 || h <= 0) return; const g = this.fill(c); rr(g, x, y, w, h, r); g.fill(); }
  // panel: a chunky gadget panel. o: fill (screen colour), paper (cream card), alpha, edge (bezel tint), line, shadow, r, thin, ornate / leaves (status LEDs)
  panel(x, y, w, h, o = {}) { frame(this, x, y, w, h, o); }
  // a ribbon title: a round coloured badge with the icon, the title on a white pill. Returns its width
  banner(x, y, str, o = {}) {
    const c = o.color || T.blue, w = this.tw(str, { bold: true }) + 24, h = 15;
    frame(this, x + 6, y - 1, w, h, { paper: '#ffffff', r: 7.5, thin: true, shadowA: 0.3 });
    this.text(str, x + 20, y + 3, T.paperText, { bold: true });
    ball(this.s, x + 7, y + 6, 8, c);
    if (o.icon) drawBig(this.s, o.icon, x + 1, y, null, { scale: 1, shadow: false });
    return w;
  }
  // segmented bar (HP, energy): v 0..1. An ink pill, a dark track, a glossy candy fill with segment notches,
  // a travelling shine, a damage trail that lingers then drains, a low-value blink.
  // o: color, back, seg, ghost, id (trail key), shine (false = off), trail (false = off)
  bar(x, y, w, h, v, o = {}) {
    w = Math.max(1, w); h = Math.max(1, h); v = clamp01(+v || 0);
    const g = this.g, key = o.id ?? (x * 7919 + y * 131 + w * 7 + h);
    let B = this._bars.get(key);
    if (!B) { B = { v, trail: v, hold: 0, flash: 0 }; this._bars.set(key, B); }
    B.seen = this.frameN;
    if (v < B.v - 1e-4) { B.trail = Math.max(B.trail, B.v); B.hold = 0.5; }
    else if (v > B.v + 1e-4) { B.flash = 0.35; }
    if (v > B.trail) B.trail = v;
    B.v = v;
    if (B.hold > 0) B.hold -= this.dt; else B.trail = Math.max(v, B.trail - this.dt * 0.8);
    if (B.flash > 0) B.flash -= this.dt;
    const r = h / 2 + 0.6, o1 = h >= 4 ? 1.1 : 0.8;
    this.fill(T.ink); rr(g, x - o1, y - o1, w + o1 * 2, h + o1 * 2, r + o1); g.fill();
    this.fill(o.back || '#1a1f4a'); rr(g, x, y, w, h, r); g.fill();
    let col = o.color || (v > 0.5 ? T.green : v > 0.22 ? T.amber : T.red);
    if (!o.color && v <= 0.22 && v > 0 && ((this.t * 4) | 0) % 2) col = mx(col, '#ffffff', 0.3);
    if (B.flash > 0) col = mx(col, '#ffffff', Math.min(1, Math.round(B.flash * 20) / 14));
    const fw = v > 0 ? Math.max(h * 0.6, w * v) : 0;
    if (o.ghost != null && o.ghost > v) { g.fillStyle = 'rgba(255,248,220,0.55)'; this._fs = null; rr(g, x, y, w * Math.min(1, o.ghost), h, r); g.fill(); }
    if (o.trail !== false && B.trail > v + 0.002) { this.fill(B.hold > 0 ? '#fff4e0' : T.coralL); rr(g, x, y, w * B.trail, h, r); g.fill(); }
    if (fw > 0) {
      g.fillStyle = vgrad(g, y, y + h, [mx(col, '#ffffff', 0.45), col, mx(col, T.ink, 0.25)]); this._fs = null;
      rr(g, x, y, fw, h, r); g.fill();
      if (h >= 3) { g.fillStyle = 'rgba(255,255,255,0.45)'; rr(g, x + 1, y + h * 0.12, Math.max(0, fw - 2), h * 0.3, h * 0.15); g.fill(); }
      const seg = o.seg || 0;
      if (seg && h >= 3) { g.fillStyle = rgba(T.ink, 0.35); for (let i = seg; i < fw - 1; i += seg) g.fillRect(x + i, y + h * 0.25, 0.6, h * 0.75); }
      if (o.shine !== false && h >= 3 && fw > 8) {
        const ph = ((this.t * 0.55 + hash(x | 0, y | 0)) % 1.4) / 1.4, sx = x + ph * (w + 24) - 12;
        g.save(); rr(g, x, y, fw, h, r); g.clip(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.moveTo(sx, y + h); g.lineTo(sx + 3, y); g.lineTo(sx + 6, y); g.lineTo(sx + 3, y + h); g.fill(); g.restore(); this._fs = null;
      }
    }
  }
  // ------------------------------------------------------------------ input
  inside(x, y, w, h) { return this.ptr.x >= x && this.ptr.y >= y && this.ptr.x < x + w && this.ptr.y < y + h; }
  blocked(o = {}) { return (this.dialog && !o.modal) || (this.modals.length && !this._inModal && !o.modal); }
  // a candy button: returns true on click. It squashes onto its lip while held, boings back on release and
  // plays a tap sound on every press. o: color (face colour), fill, active, disabled, icon, sub, subColor, key,
  // hotkey, textColor, mini, modal
  button(x, y, w, h, label, o = {}) {
    x = Math.round(x * 2) / 2; y = Math.round(y * 2) / 2; w = Math.round(w); h = Math.round(h);
    const dis = !!o.disabled, blk = this.blocked(o), over = this.inside(x, y, w, h) && !dis && !blk, down = over && this.ptr.down;
    if (over) this.hot = label;
    const a = this.anim((x * 7919 + y * 104729 + w * 31 + h) | 0, { bt: 9, hov: 0 });
    a.bt += this.dt; a.hov += ((over ? 1 : 0) - a.hov) * Math.min(1, this.dt * 14);
    if (over && this.ptr.pressed) { this.click('ui_tap', { vol: 0.7, pitch: 1.05 + (40 / Math.max(20, w)) * 0.1 }); }
    const hk = o.hotkey && this.key(o.hotkey) && !dis && !blk;
    const clicked = (over && this.ptr.released) || hk;
    if (clicked) { a.bt = 0; if (hk) this.click('ui_tap', { vol: 0.7 }); }
    const col = dis ? '#9aa0c0' : o.fill || o.color || T.blue, lip = h >= 13 ? 3 : 2;
    const st = dis ? 3 : down ? 2 : over || o.active ? 1 : 0;
    const sq = a.bt < 0.7 ? Math.exp(-7 * a.bt) * Math.sin(a.bt * 26) * 0.09 : 0, grow = a.hov * 0.035;
    const g = this.g, cx = x + w / 2, cy = y + h / 2, xf = sq !== 0 || grow > 0.001;
    if (xf) { g.save(); g.translate(cx, cy); g.scale(1 + grow + sq, 1 + grow - sq); g.translate(-cx, -cy); }
    candy(this, x, y, w, h, { color: col, state: st, lip, active: !!o.active && !dis });
    const fy = y + (down ? lip - 1 : 0), fh = h - lip, mini = !!o.mini;
    const lc = dis ? '#e4e6f4' : o.textColor || '#ffffff', ink = dis ? '#6a6e90' : mx(col, T.ink, 0.72);
    const ty = fy + (fh - (mini ? 5 : 7)) / 2;
    if (o.icon) {
      const bigI = fh >= 13 && !mini, iw = bigI ? 12 : 7, lw = label ? this.tw(label, { mini, bold: !mini }) + iw + 3 : iw, ix = cx - lw / 2;
      if (bigI) drawBig(this.s, o.icon, ix, fy + (fh - 12) / 2, null, { shadow: false, dim: dis ? 0.5 : 0 });
      else drawSmall(this.s, o.icon, ix, fy + (fh - 7) / 2, '#ffffff', ink);
      if (label) this.text(label, ix + iw + 3, ty, lc, { outline: ink, mini, bold: !mini });
    } else if (label) this.text(label, cx, ty, lc, { align: 'center', outline: ink, mini, bold: !mini });
    if (o.sub) this.text(o.sub, x + w - 4, fy + fh - 8, o.subColor || '#ffffff', { align: 'right', mini: true, outline: ink });
    if (o.key) this.text(o.key, x + 5, fy + 3, '#ffffff', { mini: true, outline: ink });
    if (xf) { g.restore(); this._fs = null; this._font = null; }
    if (clicked) this.ptr.released = false;
    return clicked;
  }
  // run fn with drawing clipped to a rect (fn gets the real coordinates). r: corner radius of the clip
  clip(x, y, w, h, fn, r = 0) {
    const g = this.g; g.save(); rr(g, x, y, w, h, r); g.clip();
    try { fn(); } finally { g.restore(); this._fs = null; this._font = null; }
  }
  // ------------------------------------------------------------------ dialogue
  // say(name, text, o) → Promise that resolves when the player advances; o.choices → resolves to an index.
  // o: portrait (canvas | ImageData | Surf | (ui, x, y, size) => void — e.g. a 3D render; none → no slot), nameColor/color, speed, choices
  say(name, str, o = {}) {
    return new Promise((resolve) => { this.dialog = { name, str: String(str), shown: 0, t: 0, resolve, o, choices: o.choices || null, pick: 0, done: false }; });
  }
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
  // toasts are white pills with a coloured badge holding the icon, bouncing down from the top
  drawToasts() {
    let y = this.toastY ?? (this.w < 360 ? Math.round(this.h * 0.22) : 6), n = 0;
    for (const t of this.toasts) {
      if (n++ >= 3) break;
      t.t += this.dt || 1 / 60;
      const kin = easeOutBack(t.t * 3.2), kout = clamp01((t.dur - t.t) * 4);
      if (kout <= 0) continue;
      let str = String(t.str); const maxW = this.w - 44;
      if (this.tw(str) > maxW) { while (str.length > 4 && this.tw(str + '…') > maxW) str = str.slice(0, -1); str = str.replace(/\s+$/, '') + '…'; }
      const h = 18, w = Math.round(this.tw(str) + 34);
      const x = Math.round(this.w / 2 - w / 2), yy = y + Math.round((1 - kin) * -24 - (1 - easeOut(kout)) * 24);
      frame(this, x, yy, w, h, { paper: '#ffffff', r: 9, thin: true, shadowA: 0.35 });
      ball(this.s, x + 9, yy + 9, 7.5, t.color);
      drawSmall(this.s, t.icon, x + 5.5, yy + 5.5, '#ffffff', mx(t.color, T.ink, 0.6));
      this.text(str, x + 21, yy + 5.5, T.paperText, { bold: true });
      if (t.t < 0.7) sparkle(this.s, x + w - 4, yy + 2, T.amber, 1 - t.t / 0.7);
      y += h + 3;
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
  cursor(x, y, dir = 'right', c = T.amber) { tri(this.s, x, y, dir, 3, c); }
  gem(x, y, c = T.cyan, r = 3) { gem(this.s, x, y, c, r); }
  sparkle(x, y, c = T.amberL, k = 1) { sparkle(this.s, x, y, c, k); }
  // big smooth 'sticker' version of an icon (Scale2x, ink + white rims), centred on (cx, cy)
  emblem(name, cx, cy, scale = 4, tint = null) { drawEmblem(this.s, name, cx, cy, scale, tint, scale * 7); }
  // an image (canvas / ImageBitmap / ImageData) drawn smooth into a box; o: { crisp, alpha }
  image(src, x, y, w, h, o = {}) { W.drawImage(this, src, x, y, w, h, o); }
  // ------------------------------------------------------------------ full-screen modal screens (see uikit/screens.js)
  // nameEntry({ title, value, max, sub, portrait }) → Promise<string>
  nameEntry(o = {}) { return new Promise((resolve) => this.openModal(nameEntryScreen(this, o, resolve))); }
  // pickCards({ title, sub, cards: [{ label, sub, color, icon, art, draw(ui, x, y, w, h) }], pick, confirm }) → Promise<index>
  // default art (no draw): a medallion with the card's icon as a big emblem (art 'boy' → star, 'girl' → heart), else its initial
  pickCards(o = {}) { return new Promise((resolve) => this.openModal(pickCardsScreen(this, o, resolve))); }
}
void easeOut; void boing; void vgrad;
