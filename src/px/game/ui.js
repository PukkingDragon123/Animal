// Pixel UI, drawn at the game's native low resolution every frame (immediate
// mode). Deep indigo / plum night panels with ink outlines, lit top bevels,
// shaded bottom bevels, brass corner caps and dithered gradients; warm amber /
// coral accents and cyan highlights. Primitives (panel, button, bar, banner,
// icons, toasts), the dialogue box with portrait + choices, roaming-HUD widgets
// (prompt bubble, keycaps, thumbstick, clock, money, location, party, minimap)
// and full-screen modal screens (name entry, card picker). Widget bodies live
// in ./uikit/; this class keeps the state and the public API.
import { Surf, P } from '../surface.js';
import { text as drawText, textWidth } from '../font.js';
import { rgb, bayer } from '../color.js';
import { T, sh, mx, hash, clamp01, easeOut, easeOutBack } from './uikit/theme.js';
import { drawSmall, drawBig, ICON_NAMES } from './uikit/icons.js';
import { frame, dropShadow, gradFill, tri, gem, sparkle, ball } from './uikit/frame.js';
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
  resize(w, h) { this.w = w; this.h = h; this.s = new Surf(w, h); this._clipS = null; }
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
  // rounded pixel rect fill (corner radius 1–3 px, cut like hand-made pixel art)
  rrect(x, y, w, h, c, r = 2) {
    for (let j = 0; j < h; j++) {
      const k = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0;
      const ins = r >= 3 ? [0, 1, 1, 3][k] || 0 : r === 2 ? [0, 1, 2][k] || 0 : [0, 1][k] || 0;
      if (w - ins * 2 > 0) this.s.hline(x + ins, x + w - 1 - ins, y + j, c);
    }
  }
  // panel: soft drop shadow, ink outline, 2px lit/shaded bevel, inner ink line, dithered gradient fill,
  // brass corner caps. o: fill, fill2, line, edge, edgeL, shadow, alpha (glass), dots, rivets, ornate, gem, accent, thin
  panel(x, y, w, h, o = {}) { frame(this, x, y, w, h, o); }
  // ornate slanted header ribbon with a diamond badge and trailing chevrons; returns the ribbon width
  banner(x, y, str, o = {}) {
    x = Math.round(x); y = Math.round(y);
    const s = this.s, c = o.color || T.cyan, w = this.tw(str) + 26, h = 13, K = T.ink;
    const L2 = mx(c, '#ffffff', 0.55), L = sh(c, 0.6), D = sh(c, -0.55), D2 = sh(c, -1.2);
    const right = (j) => x + w - Math.max(0, j - 2);
    for (let j = -1; j <= h; j++) s.hline(x + 8, right(Math.max(0, Math.min(h - 1, j))) + 1, y + j, K);
    for (let j = 0; j < h; j++) {
      const r = right(j);
      if (j === 0) s.hline(x + 8, r, y, L2);
      else if (j === 1) s.hline(x + 8, r, y + 1, L);
      else if (j >= h - 2) s.hline(x + 8, r, y + j, j === h - 1 ? D2 : D);
      else for (let i = x + 8; i <= r; i++) s.px(i, y + j, j > h / 2 && bayer(i, y + j) < (j - h / 2) / (h / 2) * 0.7 ? D : c);
      s.px(r, y + j, j < 2 ? L : D2);
    }
    // diamond badge
    const cx = x + 7, cy = y + 6;
    for (let j = -8; j <= 8; j++) { const hw = 8 - Math.abs(j); s.hline(cx - hw, cx + hw, cy + j, K); }
    for (let j = -7; j <= 7; j++) { const hw = 7 - Math.abs(j); s.hline(cx - hw, cx + hw, cy + j, j < 0 ? L : j > 2 ? D : c); }
    for (let j = -5; j <= 5; j++) { const hw = 5 - Math.abs(j); s.hline(cx - hw, cx + hw, cy + j, K); }
    for (let j = -4; j <= 4; j++) { const hw = 4 - Math.abs(j); s.hline(cx - hw, cx + hw, cy + j, j < 0 ? '#2e2648' : '#221c36'); }
    s.px(cx - 6, cy - 1, '#ffffff'); s.px(cx - 5, cy - 2, L2);
    if (o.icon) this.icon(o.icon, cx - 3, cy - 3, c, null);
    this.text(str, x + 18, y + 3, K, { shadow: mx(c, '#ffffff', 0.4) });
    if (o.chev !== false) for (let k = 0; k < 3; k++) {
      const bx = x + w + 6 + k * 5, col = [c, D, D2][k];
      for (let j = 0; j < h; j++) { const off = Math.abs(j - 6) >> 1; s.px(bx - off - 1, y + j, K); s.px(bx - off, y + j, col); s.px(bx - off + 1, y + j, col); s.px(bx - off + 2, y + j, K); }
    }
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
    const back = o.back || '#1a1428';
    s.rect(x, y, w, h, back);
    if (h > 2) s.hline(x, x + w - 1, y, sh(back, -0.7));
    if (h >= 4) s.hline(x + 1, x + w - 2, y + h - 1, mx(back, T.edge, 0.55));
    let col = o.color || (v > 0.5 ? T.green : v > 0.22 ? T.amber : T.red);
    if (!o.color && v <= 0.22 && v > 0 && ((this.t * 4) | 0) % 2) col = mx(col, '#ffffff', 0.3);
    if (B.flash > 0) col = mx(col, '#ffffff', B.flash * 1.4);
    const seg = o.seg || 0;
    let fw = Math.round(w * v); if (v > 0 && fw < 1) fw = 1;
    if (seg) for (let i = seg - 1; i < w - 1; i += seg) if (i >= fw) s.vline(x + i, y + 1, y + h - 1, mx(back, T.edge, 0.35));
    if (o.ghost != null && o.ghost > v) { const gw = Math.round(w * Math.min(1, o.ghost)); for (let i = fw; i < gw; i++) s.vline(x + i, y, y + h - 1, '#e8e0f0'); }
    if (o.trail !== false && B.trail > v + 0.002) {
      const tw = Math.round(w * B.trail), tc = B.hold > 0 ? '#fff4e8' : T.coralL, td = sh(T.coral, -0.2);
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
  // returns true on click; draws the button: a chunky pixel key with a 3D lip that presses down.
  // o: color, fill, active, disabled, icon, sub, subColor, key, hotkey, textColor, mini, modal
  button(x, y, w, h, label, o = {}) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const over = this.inside(x, y, w, h) && !o.disabled && !this.blocked(o), down = over && this.ptr.down;
    if (over) this.hot = label;
    const s = this.s, dis = !!o.disabled;
    const accent = dis ? '#5a5478' : (o.color || T.cyan);
    const base = dis ? '#2a2638' : (o.fill || (o.active ? mx(T.panel, accent, 0.26) : T.panel));
    const lip = h >= 13 ? 3 : 2, dy = down ? lip - 1 : 0, fh = h - lip, fy = y + dy;
    const face = dis ? base : down ? sh(base, -0.3) : over ? sh(base, 0.55) : base;
    dropShadow(s, x, y, w, h, 3, 1, 1, 0.45);
    // the key's side (lip)
    this.rrect(x, y + lip, w, h - lip, T.ink, 3);
    const side = dis ? '#221e30' : mx(sh(accent, -1.5), base, 0.35);
    this.rrect(x + 1, y + lip, w - 2, h - lip - 1, side, 2);
    s.hline(x + 3, x + w - 4, y + h - 2, sh(side, -0.7));
    // face
    this.rrect(x, fy, w, fh, T.ink, 3);
    const rim = dis ? '#3a3650' : over || o.active ? accent : mx(T.edge, accent, 0.3);
    this.rrect(x + 1, fy + 1, w - 2, fh - 2, rim, 2);
    if (fh >= 6) { s.hline(x + 3, x + w - 4, fy + 1, mx(rim, '#ffffff', dis ? 0.1 : 0.4)); s.hline(x + 3, x + w - 4, fy + fh - 2, sh(rim, -0.6)); }
    if (fh > 4) {
      gradFill(s, x + 2, fy + 2, w - 4, fh - 4, [mx(face, '#ffffff', 0.12), face, sh(face, -0.32)], 1);
      s.hline(x + 3, x + w - 4, fy + 2, mx(face, '#ffffff', dis ? 0.06 : 0.26));
      if (!dis) s.px(x + 3, fy + 3, mx(face, '#ffffff', 0.5));
    }
    // a glint sweeps across hovered / active keys
    if (!dis && !down && (over || o.active) && fh > 6) {
      const per = over ? 1.5 : 3.2, ph = ((this.t + hash(x, y) * per) % per) / per, gx = x + Math.round(ph * (w + fh + 12)) - 6;
      const gc = mx(face, '#ffffff', 0.4);
      for (let j = fy + 2; j < fy + fh - 2; j++) for (let k = 0; k < 2; k++) { const xx = gx - (j - fy) + k; if (xx > x + 2 && xx < x + w - 3) s.px(xx, j, gc); }
    }
    if (dis && fh > 5) for (let j = fy + 3; j < fy + fh - 2; j++) for (let i = x + 3; i < x + w - 3; i++) if ((i + j) % 4 === 0) s.px(i, j, '#24202f');
    // accent stripe on the left edge
    if (!dis && w > 24 && fh > 7) { s.vline(x + 2, fy + 3, fy + fh - 4, accent); s.vline(x + 3, fy + 4, fy + fh - 5, mx(accent, face, 0.5)); }
    const mini = !!o.mini, gh = mini ? 5 : 7;
    let tx = x + Math.round(w / 2), ty = fy + Math.round((fh - gh) / 2);
    const lc = dis ? T.textD : o.textColor || T.text;
    if (o.icon) {
      const lw = label ? this.tw(label, { mini }) + 10 : 7;
      const ix = tx - Math.round(lw / 2) + (w > 24 ? 1 : 0);
      this.icon(o.icon, ix, fy + Math.round((fh - 7) / 2), dis ? T.textD : accent);
      if (label) this.text(label, ix + 10, ty, lc, { shadow: T.ink, mini });
    } else if (label) this.text(label, tx, ty, lc, { align: 'center', shadow: T.ink, mini });
    if (o.sub) this.text(o.sub, x + w - 4, fy + fh - 8, o.subColor || T.dim, { align: 'right', mini: true });
    if (o.key) this.text(o.key, x + 5, fy + 3, T.dim, { mini: true });
    const clicked = (over && this.ptr.released) || (o.hotkey && this.key(o.hotkey) && !o.disabled && !this.blocked(o));
    if (clicked) this.ptr.released = false;
    return clicked;
  }
  // run fn with drawing clipped to a rect (fn gets the real coordinates). r: corner radius of the clip
  clip(x, y, w, h, fn, r = 0) {
    x = Math.round(x); y = Math.round(y);
    const real = this.s;
    if (!this._clipS || this._clipS.w !== real.w || this._clipS.h !== real.h) this._clipS = new Surf(real.w, real.h);
    const tmp = this._clipS; tmp.data.fill(0);
    this.s = tmp;
    try { fn(); } finally { this.s = real; }
    for (let j = 0; j < h; j++) {
      const Y = y + j; if (Y < 0 || Y >= real.h) continue;
      const k = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0;
      const ins = r >= 3 ? [0, 1, 1, 3][k] || 0 : r === 2 ? [0, 1, 2][k] || 0 : r === 1 ? [0, 1][k] || 0 : 0;
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
    this.toasts.push({ str, t: 0, dur: o.dur || 2.2, color: o.color || T.amber, icon: o.icon });
  }
  drawToasts() {
    const s = this.s;
    // top-centre on landscape; on narrow (portrait) screens below the HUD's top-left column. ui.toastY overrides
    let y = this.toastY ?? (this.w < 360 ? Math.round(this.h * 0.22) : 5), n = 0;
    for (const t of this.toasts) {
      if (n++ >= 3) break;            // at most three at a time; the rest wait their turn
      t.t += this.dt || 1 / 60;
      const kin = easeOutBack(t.t * 3.2), kout = clamp01((t.dur - t.t) * 4);
      if (kout <= 0) continue;
      const hasI = !!t.icon, w = this.tw(t.str) + (hasI ? 30 : 18), h = 17;
      const x = Math.round(this.w / 2 - w / 2), yy = y + Math.round((1 - kin) * -20 - (1 - easeOut(kout)) * 20);
      frame(this, x, yy, w, h, { edge: mx(T.edge, t.color, 0.5), edgeL: mx(T.edgeL, t.color, 0.65), fill: '#2a2342', rivets: false });
      if (hasI) { ball(s, x + 8, yy + 8, 7, t.color); drawSmall(s, t.icon, x + 5, yy + 5, '#ffffff', sh(t.color, -1.6)); }
      this.text(t.str, x + (hasI ? 19 : 9), yy + 5, T.text, { shadow: T.ink });
      const left = clamp01(1 - t.t / t.dur), lw = Math.round((w - (hasI ? 22 : 8)) * left);
      if (lw > 0) s.hline(x + (hasI ? 18 : 4), x + (hasI ? 18 : 4) + lw - 1, yy + h - 3, mx(t.color, '#2a2342', 0.35));
      if (t.t < 0.6) sparkle(s, x + w - 5, yy + 3, t.color, 1 - t.t / 0.6);
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
