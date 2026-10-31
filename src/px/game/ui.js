// Pixel UI, drawn at the game's native low resolution every frame (immediate
// mode). A warm hand-made look: carved wood-grain panels with soft rounded
// corners, cream parchment insets, leaf and rope accents, dark-brown ink, moss /
// honey / sky-teal accents and gentle motion (panels ease in, buttons squash,
// leaves sway, selections sparkle). Words give way to pixel icons wherever an
// icon says it clearly. Primitives (panel, button, bar, banner, icons, toasts),
// the dialogue box with round portrait + choices, roaming-HUD widgets (icon
// prompt bubble, keycaps, thumbstick, sun/moon dial, coin purse, hanging place
// sign, party beads, round minimap) and full-screen modal screens (name entry,
// card picker). Widget bodies live in ./uikit/; this class keeps the state and
// the public API.
import { Surf, P } from '../surface.js';
import { text as drawText, textWidth } from '../font.js';
import { rgb, bayer } from '../color.js';
import { T, sh, mx, hash, clamp01, easeOut, easeOutBack } from './uikit/theme.js';
import { drawSmall, drawBig, ICON_NAMES } from './uikit/icons.js';
import { frame, dropShadow, gradFill, tri, gem, sparkle, ball, insetOf, blendRun, sprig } from './uikit/frame.js';
import { drawDialog } from './uikit/dialog.js';
import * as W from './uikit/widgets.js';
import { nameEntryScreen, pickCardsScreen, drawEmblem } from './uikit/screens.js';

export { T, ICON_NAMES };

const SENTINEL = 0x01020301;

export class PixelUI {
  constructor(w, h) {
    this.resize(w, h);
    this.ptr = { x: -1, y: -1, down: false, pressed: false, released: false, id: null };
    this.t = 0; this.dt = 1 / 60; this.frameN = 0;
    this.dialog = null; this.toasts = []; this.keys = {}; this.modalLock = 0;
    this.modals = []; this._typed = []; this.typed = []; this._bars = new Map(); this._anim = new Map();
  }
  resize(w, h) { this.w = w; this.h = h; this.s = new Surf(w, h); this._clipStack = null; }
  // ------------------------------------------------------------------ frame
  begin(dt) {
    this.dt = dt || 0; this.t += this.dt; this.frameN++;
    this.s.clear(); this.hot = null; this.frameButtons = 0;
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
    this.s.touch();
  }
  key(k) { return this.keys[k] === 'pressed'; }
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
  px(x, y, c) { this.s.px(x, y, c); }
  rect(x, y, w, h, c) { this.s.rect(x, y, w, h, c); }
  fade(a, c = '#000000') {
    if (a <= 0) return;
    const [r, g, b] = rgb(c), d = this.s.data, A = Math.round(Math.min(1, a) * 255);
    for (let i = 0; i < d.length; i++) {
      const v = d[i], da = v >>> 24;
      if (!da) { d[i] = ((A << 24) | (b << 16) | (g << 8) | r) >>> 0; continue; }
      const dr = v & 255, dg = (v >>> 8) & 255, db = (v >>> 16) & 255;
      d[i] = ((Math.max(da, A) << 24) | ((db + (b - db) * a) << 16) | ((dg + (g - dg) * a) << 8) | (dr + (r - dr) * a)) >>> 0;
    }
  }
  // text: o = { mini, scale, spacing, shadow, outline (true → ink), align, bold, grad: [top, bottom] }
  text(str, x, y, c = T.text, o = {}) {
    if (o.outline === true || o.shadow === true) o = Object.assign({}, o, o.outline === true ? { outline: T.ink } : {}, o.shadow === true ? { shadow: T.ink } : {});
    const opts = Object.assign({ jpSize: 10 }, o);
    if (o.grad) return this._gradText(str, x, y, opts);
    if (!o.bold) return drawText(this.s, str, x, y, c, opts);
    const off = o.align === 'center' ? 0 : o.align === 'right' ? -1 : 0;
    const xa = x + off;
    drawText(this.s, str, xa + 1, y, o.outline || c, opts);
    drawText(this.s, str, xa, y, c, opts);
    drawText(this.s, str, xa + 1, y, c, Object.assign({}, opts, { outline: null, shadow: null }));
    return textWidth(str, opts) + 1;
  }
  _gradText(str, x, y, opts) {
    const g = opts.grad, sc = opts.scale || 1, w = textWidth(str, opts) + (opts.bold ? 1 : 0);
    const x0 = Math.round(opts.align === 'center' ? x - Math.floor(w / 2) : opts.align === 'right' ? x - w : x);
    const o2 = Object.assign({}, opts, { grad: null });
    this.text(str, x, y, SENTINEL, o2);
    const rows = 8 * sc, cols = g.map((c) => P(c)), d = this.s.data, n = cols.length - 1;
    for (let j = 0; j < rows; j++) {
      const Y = Math.round(y) + j; if (Y < 0 || Y >= this.h) continue;
      const t = (j / Math.max(1, 7 * sc - 1)) * n, k = Math.min(n - 1, Math.floor(t)), f = Math.min(1, t - k);
      for (let X = Math.max(0, x0 - 1); X < Math.min(this.w, x0 + w + 2); X++) { const i = Y * this.w + X; if (d[i] === SENTINEL) d[i] = bayer(X, Y) < f ? cols[k + 1] : cols[k]; }
    }
    return w;
  }
  tw(str, o = {}) { return textWidth(str, Object.assign({ jpSize: 10 }, o)) + (o.bold ? 1 : 0); }
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
  // 7×7 icon (auto-bevelled, drop shadow). o.big → the detailed 12×12 version (c optional: natural colours)
  icon(name, x, y, c = T.text, shadow = T.ink, o) {
    if (o && (o.big || o.size >= 10)) return drawBig(this.s, name, x, y, o.tint ? c : null, o);
    drawSmall(this.s, name, x, y, c, shadow);
  }
  // detailed full-colour 12×12 icon; c: tint (null → the icon's own colours); o: { scale, outline, shadow, dim }
  bigIcon(name, x, y, c = null, o = {}) { drawBig(this.s, name, x, y, c, o); }
  // rounded pixel rect fill (corner radius 1–3 px hand-cut; larger radii are round, pills at h/2)
  rrect(x, y, w, h, c, r = 2) {
    for (let j = 0; j < h; j++) {
      const ins = insetOf(j, h, r);
      if (w - ins * 2 > 0) this.s.hline(x + ins, x + w - 1 - ins, y + j, c);
    }
  }
  // panel: a carved wooden board. o: fill (wood colour), paper (parchment interior), alpha (translucent interior),
  // edge / edgeL (rim tint), line, shadow, rivets (corner nails), ornate / leaves (swaying leaf sprigs), r (corner radius), thin
  panel(x, y, w, h, o = {}) { frame(this, x, y, w, h, o); }
  // a small wooden sign: a round leaf-green badge holding the icon, the title burnt into a plank, a sprig on the end.
  // returns the plank width
  banner(x, y, str, o = {}) {
    x = Math.round(x); y = Math.round(y);
    const s = this.s, c = o.color || T.moss, w = this.tw(str, { bold: true }) + 24, h = 15;
    frame(this, x + 6, y - 1, w, h, { thin: true, r: 4, fill: T.woodL, edge: T.wood, edgeL: mx(T.woodL, T.hi, 0.5), seams: false, rivets: false, shadowA: 0.3 });
    this.text(str, x + 20, y + 3, T.text, { bold: true, shadow: T.woodDD });
    if (o.chev !== false) sprig(s, x + w + 3, y + 3, 1, this.t, { n: 2, len: 7 });
    ball(s, x + 7, y + 6, 8, c);
    if (o.icon) drawSmall(s, o.icon, x + 4, y + 3, '#ffffff', mx(c, T.ink, 0.6));
    return w;
  }
  // segmented bar (HP, energy): v 0..1. Ink-outlined inset track, 3-tone glossy fill with segment
  // notches, a travelling shine, a damage trail that lingers then drains, low-value blink.
  // o: color, back, seg, ghost, id (trail key), shine (false = off), trail (false = off)
  bar(x, y, w, h, v, o = {}) {
    x = Math.round(x); y = Math.round(y); w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    v = clamp01(+v || 0);
    const s = this.s, r = h >= 4 ? 2 : 1;
    const key = o.id ?? x + ',' + y + ',' + w + ',' + h;
    let B = this._bars.get(key);
    if (!B) { B = { v, trail: v, hold: 0, flash: 0 }; this._bars.set(key, B); }
    B.seen = this.frameN;
    if (v < B.v - 1e-4) { B.trail = Math.max(B.trail, B.v); B.hold = 0.5; }
    else if (v > B.v + 1e-4) { B.flash = 0.35; }
    if (v > B.trail) B.trail = v;
    B.v = v;
    if (B.hold > 0) B.hold -= this.dt; else B.trail = Math.max(v, B.trail - this.dt * 0.8);
    if (B.flash > 0) B.flash -= this.dt;
    this.rrect(x - 1, y - 1, w + 2, h + 2, T.ink, r);
    const back = o.back || '#3a2210';
    s.rect(x, y, w, h, back);
    if (h > 2) s.hline(x, x + w - 1, y, sh(back, -0.7));
    if (h >= 4) s.hline(x + 1, x + w - 2, y + h - 1, mx(back, T.edge, 0.55));
    let col = o.color || (v > 0.5 ? T.green : v > 0.22 ? T.amber : T.red);
    if (!o.color && v <= 0.22 && v > 0 && ((this.t * 4) | 0) % 2) col = mx(col, '#ffffff', 0.3);
    if (B.flash > 0) col = mx(col, '#ffffff', B.flash * 1.4);
    const seg = o.seg || 0;
    let fw = Math.round(w * v); if (v > 0 && fw < 1) fw = 1;
    if (seg) for (let i = seg - 1; i < w - 1; i += seg) if (i >= fw) s.vline(x + i, y + 1, y + h - 1, mx(back, T.edge, 0.35));
    if (o.ghost != null && o.ghost > v) { const gw = Math.round(w * Math.min(1, o.ghost)); for (let i = fw; i < gw; i++) s.vline(x + i, y, y + h - 1, '#fff0d0'); }
    if (o.trail !== false && B.trail > v + 0.002) {
      const tw = Math.round(w * B.trail), tc = B.hold > 0 ? '#fff8e8' : T.coralL, td = sh(T.coral, -0.2);
      for (let i = fw; i < tw; i++) for (let j = 0; j < h; j++) s.px(x + i, y + j, j === h - 1 && h > 2 ? td : tc);
    }
    const L2 = mx(col, '#ffffff', 0.55), L = sh(col, 0.75), D = sh(col, -0.8), N = sh(col, -1.3), G = mx(col, '#ffffff', 0.4);
    const shineOn = o.shine !== false && h >= 3 && fw > 5, ph = shineOn ? ((this.t * 0.55 + hash(x, y)) % 1.4) / 1.4 : -1, sx = Math.round(ph * (w + 24)) - 12;
    for (let i = 0; i < fw; i++) {
      const cut = h >= 4 && (i === 0 || i === w - 1);
      const y0 = y + (cut ? 1 : 0), y1 = y + h - 1 - (cut ? 1 : 0);
      for (let Y = y0; Y <= y1; Y++) {
        const j = Y - y;
        let c2 = h === 1 ? col : j === 0 ? L : h >= 4 && j === 1 ? G : j === h - 1 && h >= 3 ? D : col;
        if (seg && i % seg === seg - 1 && i < fw - 1) c2 = j === 0 ? col : N;
        if (shineOn && i - sx >= -(j) && i - sx < 3 - j && j < h - 1) c2 = L2;
        s.px(x + i, Y, c2);
      }
    }
    if (fw > 1 && fw < w && h >= 3) s.vline(x + fw - 1, y + 1, y + h - 2, L2);
  }
  // ------------------------------------------------------------------ input
  inside(x, y, w, h) { return this.ptr.x >= x && this.ptr.y >= y && this.ptr.x < x + w && this.ptr.y < y + h; }
  blocked(o = {}) { return (this.dialog && !o.modal) || (this.modals.length && !this._inModal && !o.modal); }
  // returns true on click; draws the button: a chunky wooden block on a darker base that squashes when pressed.
  // o: color (accent inlay / hover rim), fill, active, disabled, icon, sub, subColor, key, hotkey, textColor, mini, modal
  button(x, y, w, h, label, o = {}) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const over = this.inside(x, y, w, h) && !o.disabled && !this.blocked(o), down = over && this.ptr.down;
    if (over) this.hot = label;
    const s = this.s, dis = !!o.disabled;
    const accent = dis ? '#8a7a68' : (o.color || T.leaf);
    const base = dis ? '#7a6a58' : (o.fill || (o.active ? mx(T.wood, accent, 0.3) : T.wood));
    const lip = h >= 13 ? 3 : 2, r = h >= 13 ? 4 : 3;
    // squash: pressed faces drop onto the base and spread a pixel each side
    const sq = down ? 1 : 0, dy = down ? lip - 1 : 0, fh = h - lip - sq, fy = y + dy + sq, fx = x - sq, fw = w + sq * 2;
    const face = dis ? base : over ? mx(base, T.hi, 0.18) : base;
    dropShadow(s, x, y, w, h, r, 0, 1, 0.35);
    // the base under the block
    this.rrect(x, y + lip, w, h - lip, T.ink, r);
    const side = dis ? '#4a3e32' : mx(T.woodDD, accent, 0.18);
    this.rrect(x + 1, y + lip, w - 2, h - lip - 1, side, Math.max(1, r - 1));
    // the block
    this.rrect(fx, fy, fw, fh, T.ink, r);
    const rim = dis ? '#9a8a76' : over || o.active ? mx(accent, T.hi, 0.25) : mx(face, T.hi, 0.35);
    this.rrect(fx + 1, fy + 1, fw - 2, fh - 2, rim, Math.max(1, r - 1));
    if (fh > 4) {
      gradFill(s, fx + 2, fy + 2, fw - 4, fh - 4, [mx(face, T.hi, 0.12), face, mx(face, T.woodDD, 0.25)], 1);
      // a little grain
      if (!dis) for (let j = fy + 4; j < fy + fh - 3; j += 3) for (let i = fx + 4 + ((j * 7) % 5); i < fx + fw - 4; i += 9) { s.px(i, j, mx(face, T.woodDD, 0.22)); s.px(i + 1, j, mx(face, T.woodDD, 0.22)); }
      s.hline(fx + 3, fx + fw - 4, fy + fh - 2, mx(face, T.woodDD, 0.45));
    }
    // hover: a soft glint sweeps across
    if (!dis && !down && (over || o.active) && fh > 6) {
      const per = over ? 1.6 : 3.4, ph = ((this.t + hash(x, y) * per) % per) / per, gx = fx + Math.round(ph * (fw + fh + 12)) - 6;
      const gc = mx(face, '#ffffff', 0.3);
      for (let j = fy + 2; j < fy + fh - 2; j++) { const xx = gx - (j - fy); if (xx > fx + 2 && xx < fx + fw - 3) s.px(xx, j, gc); }
    }
    // accent inlay on the left edge (a coloured bead)
    if (!dis && w > 30 && fh > 9) { const by = fy + (fh >> 1); s.px(fx + 4, by - 1, mx(accent, '#ffffff', 0.4)); s.px(fx + 5, by - 1, accent); s.px(fx + 4, by, accent); s.px(fx + 5, by, mx(accent, T.ink, 0.35)); }
    const mini = !!o.mini, gh = mini ? 5 : 7;
    const tx = fx + Math.round(fw / 2), ty = fy + Math.round((fh - gh) / 2);
    const lc = dis ? '#cdbca4' : o.textColor || T.text, shad = dis ? '#5a4c3e' : T.woodDD;
    if (o.icon) {
      const bigI = fh >= 14 && !mini, iw = bigI ? 12 : 7;
      const lw = label ? this.tw(label, { mini }) + iw + 3 : iw;
      const ix = tx - Math.round(lw / 2);
      if (bigI) drawBig(s, o.icon, ix, fy + Math.round((fh - 12) / 2), null, { shadow: false, dim: dis ? 0.5 : 0 });
      else this.icon(o.icon, ix, fy + Math.round((fh - 7) / 2), dis ? '#cdbca4' : mx(accent, '#ffffff', 0.35), shad);
      if (label) this.text(label, ix + iw + 3, ty, lc, { shadow: shad, mini });
    } else if (label) this.text(label, tx, ty, lc, { align: 'center', shadow: shad, mini });
    if (o.sub) this.text(o.sub, fx + fw - 4, fy + fh - 8, o.subColor || T.dim, { align: 'right', mini: true });
    if (o.key) this.text(o.key, fx + 5, fy + 3, T.dim, { mini: true });
    if (dis && fh > 5) for (let j = fy + 3; j < fy + fh - 2; j++) for (let i = fx + 3; i < fx + fw - 3; i++) if ((i + j) % 4 === 0) s.px(i, j, '#6a5a4a');
    const clicked = (over && this.ptr.released) || (o.hotkey && this.key(o.hotkey) && !o.disabled && !this.blocked(o));
    if (clicked) this.ptr.released = false;
    return clicked;
  }
  // run fn with drawing clipped to a rect (fn gets the real coordinates). r: corner radius of the clip
  clip(x, y, w, h, fn, r = 0) {
    x = Math.round(x); y = Math.round(y);
    const real = this.s, depth = this._clipDepth || 0;
    // one scratch surface per nesting level (a clip inside a clip, e.g. a round portrait inside a clipped card)
    if (!this._clipStack || this._clipStack.w !== real.w || this._clipStack.h !== real.h) { this._clipStack = []; this._clipStack.w = real.w; this._clipStack.h = real.h; }
    const tmp = this._clipStack[depth] || (this._clipStack[depth] = new Surf(real.w, real.h));
    // only the clip rect is ever read back, so only it needs clearing
    { const x0 = Math.max(0, x), x1 = Math.min(real.w, x + w); if (x1 > x0) for (let j = Math.max(0, y); j < Math.min(real.h, y + h); j++) tmp.data.fill(0, j * real.w + x0, j * real.w + x1); }
    this.s = tmp; this._clipDepth = depth + 1;
    try { fn(); } finally { this.s = real; this._clipDepth = depth; }
    for (let j = 0; j < h; j++) {
      const Y = y + j; if (Y < 0 || Y >= real.h) continue;
      const ins = r ? insetOf(j, h, r) : 0;
      for (let X = Math.max(0, x + ins); X < Math.min(real.w, x + w - ins); X++) { const v = tmp.data[Y * real.w + X]; if (v >>> 24) real.data[Y * real.w + X] = v; }
    }
  }
  // ------------------------------------------------------------------ dialogue
  // say(name, text, o) → Promise that resolves when the player advances; o.choices → resolves to an index.
  // o: portrait (canvas | ImageData | Surf | (ui, x, y, size) => void — e.g. a 3D render; none → no slot), nameColor/color, speed, choices
  say(name, str, o = {}) {
    return new Promise((resolve) => { this.dialog = { name, str: String(str), shown: 0, t: 0, resolve, o, choices: o.choices || null, pick: 0, done: false }; });
  }
  choose(prompt, choices, o = {}) { return this.say(o.name || '', prompt, Object.assign({}, o, { choices })); }
  drawDialog() { if (this.dialog) drawDialog(this); }
  closeDialog(v) { const D = this.dialog; if (!D) return; this.dialog = null; this.keys = {}; D.resolve(v); }
  // ------------------------------------------------------------------ toasts
  toast(str, o = {}, ms) {
    if (typeof o === 'string') o = { color: o === 'gold' ? T.amber : o === 'good' ? T.green : o === 'bad' ? T.red : undefined };
    if (ms && !o.dur) o = Object.assign({}, o, { dur: ms / 1000 });
    if (this.toasts.some((t) => t.str === str)) return;
    this.toasts.push({ str, t: 0, dur: o.dur || 2.2, color: o.color || T.amber, icon: o.icon || 'star' });
  }
  // toasts are small parchment pills: a coloured icon bead + a few words, popping in from the top
  drawToasts() {
    const s = this.s;
    // top-centre on landscape; on narrow (portrait) screens below the HUD's top-left column. ui.toastY overrides
    let y = this.toastY ?? (this.w < 360 ? Math.round(this.h * 0.22) : 5), n = 0;
    for (const t of this.toasts) {
      if (n++ >= 3) break;            // at most three at a time; the rest wait their turn
      t.t += this.dt || 1 / 60;
      const kin = easeOutBack(t.t * 3.2), kout = clamp01((t.dur - t.t) * 4);
      if (kout <= 0) continue;
      let str = String(t.str); const maxW = this.w - 40;
      while (str.length > 4 && this.tw(str) > maxW) str = str.slice(0, -2);
      if (str !== String(t.str)) str = str.replace(/\s*\S?$/, '') + '…';
      const h = 18, w = this.tw(str) + 34;
      const x = Math.round(this.w / 2 - w / 2), yy = y + Math.round((1 - kin) * -22 - (1 - easeOut(kout)) * 22);
      frame(this, x, yy, w, h, { paper: true, r: 9, thin: true, fill: T.wood, rivets: false, shadowA: 0.35 });
      ball(s, x + 9, yy + 9, 8, t.color);
      drawSmall(s, t.icon, x + 6, yy + 6, '#ffffff', mx(t.color, T.ink, 0.6));
      this.text(str, x + 21, yy + 6, T.paperText, {});
      if (t.t < 0.7) sparkle(s, x + w - 4, yy + 2, T.amberL, 1 - t.t / 0.7);
      y += h + 3;
    }
    this.toasts = this.toasts.filter((t) => t.t < t.dur);
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
  cursor(x, y, dir = 'right', c = T.amber) { tri(this.s, Math.round(x), Math.round(y), dir, 3, c); }
  gem(x, y, c = T.cyan, r = 3) { gem(this.s, Math.round(x), Math.round(y), c, r); }
  sparkle(x, y, c = T.amberL, k = 1) { sparkle(this.s, x, y, c, k); }
  // big smooth 'sticker' version of an icon (Scale2x ×2 or ×4, ink + white rims), centred on (cx, cy)
  emblem(name, cx, cy, scale = 4, tint = null) { drawEmblem(this, name, Math.round(cx), Math.round(cy), scale, tint); }
  // ------------------------------------------------------------------ full-screen modal screens (see uikit/screens.js)
  // nameEntry({ title, value, max, sub, portrait }) → Promise<string>
  nameEntry(o = {}) { return new Promise((resolve) => this.openModal(nameEntryScreen(this, o, resolve))); }
  // pickCards({ title, sub, cards: [{ label, sub, color, icon, art, draw(ui, x, y, w, h) }], pick, confirm }) → Promise<index>
  // default art (no draw): a medallion with the card's icon as a big emblem (art 'boy' → star, 'girl' → heart), else its initial
  pickCards(o = {}) { return new Promise((resolve) => this.openModal(pickCardsScreen(this, o, resolve))); }
}
