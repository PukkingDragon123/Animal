// Pixel UI, drawn at the game's native low resolution every frame (immediate
// mode): bevelled panels, slanted banner headers, segmented bars, pixel icons,
// buttons with press states, a typewriter dialogue box with choices, toasts.
// Styled after classic pixel UI kits: deep indigo panels, cyan/amber accents.
import { Surf, P } from '../surface.js';
import { text as drawText, textWidth } from '../font.js';
import { mix, shift } from '../color.js';

export const T = {
  ink: '#120c1c', panel: '#2b2442', panel2: '#221c36', edge: '#4e4672', edgeL: '#6e64a0', hi: '#8f86c4',
  text: '#f2ecff', dim: '#a59cc8', cyan: '#5fd8e8', cyan2: '#2c8aa8', amber: '#ffcf5a', amber2: '#d08a2a', red: '#ff5a64', green: '#7ce07a', pink: '#ff7ab8',
  paper: '#f4ead8', paperInk: '#3a2a3a',
};

// 7×7 pixel icons (rows of bits, MSB left)
const ICONS = {
  heart: [0b0110110, 0b1111111, 0b1111111, 0b1111111, 0b0111110, 0b0011100, 0b0001000],
  bolt: [0b0000110, 0b0001100, 0b0011000, 0b0111110, 0b0001100, 0b0011000, 0b0110000],
  star: [0b0001000, 0b0001000, 0b1111111, 0b0111110, 0b0011100, 0b0110110, 0b1000001],
  phone: [0b0111110, 0b0100010, 0b0100010, 0b0100010, 0b0100010, 0b0111110, 0b0001000],
  bag: [0b0011100, 0b0100010, 0b1111111, 0b1000001, 0b1011101, 0b1000001, 0b1111111],
  team: [0b0110110, 0b0110110, 0b0000000, 0b1111111, 0b1111111, 0b1111111, 0b0000000],
  map: [0b1110111, 0b1010101, 0b1110111, 0b1010101, 0b1110111, 0b1010101, 0b1110111],
  gear: [0b0101010, 0b1111111, 0b0110110, 0b1100011, 0b0110110, 0b1111111, 0b0101010],
  disc: [0b0011100, 0b0111110, 0b1110111, 0b1101011, 0b1110111, 0b0111110, 0b0011100],
  fist: [0b0000000, 0b0111110, 0b1111111, 0b1111111, 0b1111111, 0b0111110, 0b0011100],
  shield: [0b1111111, 0b1111111, 0b1111111, 0b0111110, 0b0111110, 0b0011100, 0b0001000],
  swap: [0b0010000, 0b0111111, 0b0010000, 0b0000000, 0b0000100, 0b1111110, 0b0000100],
  dodge: [0b0001100, 0b0011110, 0b0101101, 0b0001100, 0b0010010, 0b0100001, 0b1000000],
  link: [0b0110110, 0b1001001, 0b1001001, 0b0110110, 0b0001000, 0b0011100, 0b0001000],   // two hearts joined: the soul-stone bond
  talk: [0b1111111, 0b1000001, 0b1010101, 0b1000001, 0b1111111, 0b0110000, 0b0100000],
  door: [0b0111110, 0b0100010, 0b0100010, 0b0100110, 0b0100010, 0b0100010, 0b0111110],
  eye: [0b0000000, 0b0111110, 0b1100011, 0b1001001, 0b1100011, 0b0111110, 0b0000000],
  bowl: [0b0000000, 0b0101010, 0b0000000, 0b1111111, 0b0111110, 0b0011100, 0b0111110],
  smile: [0b0111110, 0b1000001, 0b1010101, 0b1000001, 0b1011101, 0b1000001, 0b0111110],
  flame: [0b0001000, 0b0011000, 0b0011100, 0b0111110, 0b1101111, 0b1101011, 0b0111110],
  drop: [0b0001000, 0b0011100, 0b0011100, 0b0111110, 0b1111011, 0b1111111, 0b0111110],
  leaf: [0b0000111, 0b0011111, 0b0111111, 0b0111110, 0b1111100, 0b1011000, 0b1000000],
  play: [0b1000000, 0b1110000, 0b1111100, 0b1111111, 0b1111100, 0b1110000, 0b1000000],
  check: [0b0000001, 0b0000011, 0b1000110, 0b1101100, 0b0111000, 0b0010000, 0b0000000],
  cross: [0b1000001, 0b0100010, 0b0010100, 0b0001000, 0b0010100, 0b0100010, 0b1000001],
  coin: [0b0011100, 0b0111110, 0b1101011, 0b1100011, 0b1101011, 0b0111110, 0b0011100],
  up: [0b0001000, 0b0011100, 0b0111110, 0b1111111, 0b0011100, 0b0011100, 0b0011100],
};

export class PixelUI {
  constructor(w, h) { this.resize(w, h); this.ptr = { x: -1, y: -1, down: false, pressed: false, released: false, id: null }; this.t = 0; this.dialog = null; this.toasts = []; this.keys = {}; this.modalLock = 0; }
  resize(w, h) { this.w = w; this.h = h; this.s = new Surf(w, h); }
  // ------------------------------------------------------------------ frame
  begin(dt) { this.t += dt; this.s.clear(); this.hot = null; this.frameButtons = 0; }
  end() {
    if (this.dialog) this.drawDialog();
    this.drawToasts();
    this.ptr.pressed = false; this.ptr.released = false;
    this.keys = {};                       // key presses latch for exactly one frame
    this.s.touch();
  }
  key(k) { return this.keys[k] === 'pressed'; }
  // ------------------------------------------------------------------ primitives
  px(x, y, c) { this.s.px(x, y, c); }
  rect(x, y, w, h, c) { this.s.rect(x, y, w, h, c); }
  fade(a, c = '#000000') { if (a <= 0) return; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const i = y * this.w + x; this.s.blend(x, y, c, a); } }
  text(str, x, y, c = T.text, o = {}) {
    if (o.outline === true) o = Object.assign({}, o, { outline: T.ink });
    return drawText(this.s, str, x, y, c, Object.assign({ jpSize: 10 }, o));
  }
  tw(str, o = {}) { return textWidth(str, Object.assign({ jpSize: 10 }, o)); }
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
  icon(name, x, y, c = T.text, shadow = T.ink) {
    const g = ICONS[name]; if (!g) return;
    for (const [ox, oy, col] of shadow ? [[1, 1, shadow], [0, 0, c]] : [[0, 0, c]]) for (let r = 0; r < 7; r++) for (let k = 0; k < 7; k++) if (g[r] & (1 << (6 - k))) this.s.px(x + k + ox, y + r + oy, col);
  }
  // rounded pixel rect fill (corner radius 1–3 px, cut like hand-made pixel art)
  rrect(x, y, w, h, c, r = 2) {
    for (let j = 0; j < h; j++) {
      const k = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0;
      const cut = k >= 3 ? 3 : k === 2 ? 1 : k === 1 ? (r >= 2 ? 1 : 0) : 0;
      const ins = r >= 3 ? [0, 1, 1, 3][k] || 0 : r === 2 ? [0, 1, 2][k] || 0 : [0, 1][k] || 0;
      if (w - ins * 2 > 0) this.s.hline(x + ins, x + w - 1 - ins, y + j, c);
    }
  }
  // panel: drop shadow, dark ink outline, light inner rim, two-tone fill, corner rivets
  panel(x, y, w, h, o = {}) {
    const fill = o.fill || T.panel, line = o.line || T.ink, edge = o.edge || T.edge, edgeL = o.edgeL || T.edgeL;
    if (o.shadow !== false) this.rrect(x + 1, y + 2, w, h, '#0a0612', 3);
    this.rrect(x, y, w, h, line, 3);
    this.rrect(x + 1, y + 1, w - 2, h - 2, edge, 2);
    this.rrect(x + 2, y + 2, w - 4, h - 4, fill, 1);
    // lit top band + inner rim lines
    this.s.hline(x + 3, x + w - 4, y + 2, mix(fill, edgeL, 0.55));
    this.s.hline(x + 3, x + w - 4, y + 1, edgeL);
    this.s.vline(x + 1, y + 3, y + h - 4, mix(edge, edgeL, 0.5));
    this.s.hline(x + 3, x + w - 4, y + h - 3, shift(fill, -0.6));
    if (h > 16) for (let j = y + 3; j < y + Math.min(h - 3, 8); j++) this.s.hline(x + 3, x + w - 4, j, mix(fill, edgeL, 0.12 * (8 - (j - y)) / 5));
    if (o.dots) for (let j = y + 6; j < y + h - 5; j += 4) for (let i = x + 5 + ((j >> 2) % 2) * 2; i < x + w - 5; i += 4) this.s.px(i, j, mix(fill, edge, 0.32));
    if (w > 30 && h > 20 && o.rivets !== false) for (const [rx, ry] of [[x + 4, y + 4], [x + w - 5, y + 4], [x + 4, y + h - 5], [x + w - 5, y + h - 5]]) { this.s.px(rx, ry, edgeL); this.s.px(rx + 1, ry + 1, shift(fill, -0.9)); }
  }
  // slanted header banner with a diamond badge (like pixel UI kit section headers)
  banner(x, y, str, o = {}) {
    const c = o.color || T.cyan, c2 = shift(c, -1.2), w = this.tw(str) + 26, h = 13;
    for (let j = 0; j < h; j++) this.s.hline(x + 8, x + w - Math.max(0, j - 2), y + j, j < 2 ? shift(c, 0.8) : c);
    for (let j = 0; j < h; j++) this.s.px(x + w - Math.max(0, j - 2) + 1, y + j, c2);
    // diamond badge
    const cx = x + 7, cy = y + 6;
    for (let j = -8; j <= 8; j++) { const hw = 8 - Math.abs(j); this.s.hline(cx - hw, cx + hw, cy + j, Math.abs(j) > 6 || hw < 2 ? T.ink : j < 0 ? shift(c, 1) : c); }
    for (let j = -6; j <= 6; j++) { const hw = 6 - Math.abs(j); this.s.hline(cx - hw, cx + hw, cy + j, T.panel); }
    if (o.icon) this.icon(o.icon, cx - 3, cy - 3, c, null);
    this.text(str, x + 18, y + 3, T.ink);
    if (o.chev !== false) for (let k = 0; k < 3; k++) { const bx = x + w + 6 + k * 5; for (let j = 0; j < h; j++) { const off = Math.abs(j - 6) >> 1; this.s.px(bx - off, y + j, k === 0 ? c : c2); this.s.px(bx - off + 1, y + j, k === 0 ? c : c2); } }
    return w;
  }
  // segmented bar (HP, energy): value 0..1; rounded track with an inset shadow, glossy fill
  bar(x, y, w, h, v, o = {}) {
    v = Math.max(0, Math.min(1, v));
    const r = h >= 4 ? 2 : 1;
    this.rrect(x - 1, y - 1, w + 2, h + 2, T.ink, r);
    this.rrect(x, y, w, h, o.back || '#1a1428', r - 1);
    this.s.hline(x + 1, x + w - 2, y, '#0e0a18');
    const col = o.color || (v > 0.5 ? T.green : v > 0.22 ? T.amber : T.red);
    const seg = o.seg || 0, fw = Math.round(w * v);
    if (o.ghost != null && o.ghost > v) { const gw = Math.round(w * Math.min(1, o.ghost)); for (let i = fw; i < gw; i++) this.s.vline(x + i, y, y + h - 1, '#e8e0f0'); }
    for (let i = 0; i < fw; i++) {
      const edgeCut = h >= 4 && (i === 0 || i === w - 1);
      const y0 = y + (edgeCut ? 1 : 0), y1 = y + h - 1 - (edgeCut ? 1 : 0);
      this.s.vline(x + i, y0, y1, col);
      if (h > 2) { this.s.px(x + i, y0, shift(col, 1.1)); this.s.px(x + i, y1, shift(col, -0.9)); }
      if (h > 4) this.s.px(x + i, y0 + 1, mix(col, '#ffffff', 0.25));
      if (seg && i % seg === seg - 1) this.s.vline(x + i, y0, y1, shift(col, -1.3));
    }
  }
  // ------------------------------------------------------------------ input
  inside(x, y, w, h) { return this.ptr.x >= x && this.ptr.y >= y && this.ptr.x < x + w && this.ptr.y < y + h; }
  // returns true on click; draws the button: a chunky pixel key with a 3D lip that presses down
  button(x, y, w, h, label, o = {}) {
    const over = this.inside(x, y, w, h) && !o.disabled && !(this.dialog && !o.modal), down = over && this.ptr.down;
    if (over) this.hot = label;
    const accent = o.disabled ? '#5a5478' : (o.color || T.cyan);
    const base = o.disabled ? '#2a2638' : (o.fill || (o.active ? mix(T.panel, accent, 0.28) : T.panel));
    const face = over && !down ? shift(base, 0.45) : base, lip = 3, dy = down ? lip - 1 : 0;
    // shadow + lip (the key's side), then the face
    this.rrect(x + 1, y + lip + 1, w, h - lip, '#0a0612', 3);
    this.rrect(x, y + lip, w, h - lip, T.ink, 3);
    this.rrect(x + 1, y + lip, w - 2, h - lip - 1, mix(shift(accent, -1.6), base, 0.45), 2);
    const fy = y + dy, fh = h - lip;
    this.rrect(x, fy, w, fh, T.ink, 3);
    this.rrect(x + 1, fy + 1, w - 2, fh - 2, over || o.active ? accent : mix(T.edge, accent, 0.25), 2);
    this.rrect(x + 2, fy + 2, w - 4, fh - 4, face, 1);
    // two-tone face: lighter upper half + shine line + specular dot
    for (let j = fy + 2; j < fy + 2 + Math.floor((fh - 4) / 2); j++) this.s.hline(x + 3, x + w - 4, j, mix(face, '#ffffff', 0.07));
    this.s.hline(x + 3, x + w - 5, fy + 2, mix(face, '#ffffff', 0.28));
    this.s.px(x + 3, fy + 3, mix(face, '#ffffff', 0.5));
    // accent stripe on the left edge
    if (!o.disabled && w > 24) { this.s.vline(x + 2, fy + 3, fy + fh - 4, accent); this.s.vline(x + 3, fy + 4, fy + fh - 5, mix(accent, face, 0.5)); }
    let tx = x + Math.round(w / 2), ty = fy + Math.round((fh - 7) / 2);
    const lc = o.disabled ? '#6a6488' : o.textColor || T.text;
    if (o.icon) {
      const lw = label ? this.tw(label) + 10 : 7;
      const ix = tx - Math.round(lw / 2) + (w > 24 ? 1 : 0);
      this.icon(o.icon, ix, ty, o.disabled ? '#6a6488' : accent);
      if (label) this.text(label, ix + 10, ty, lc, { shadow: T.ink });
    } else if (label) this.text(label, tx, ty, lc, { align: 'center', shadow: T.ink });
    if (o.sub) this.text(o.sub, x + w - 4, fy + fh - 8, o.subColor || T.dim, { align: 'right', mini: true });
    if (o.key) this.text(o.key, x + 5, fy + 3, T.dim, { mini: true });
    const clicked = (over && this.ptr.released) || (o.hotkey && this.key(o.hotkey) && !o.disabled);
    if (clicked) this.ptr.released = false;
    return clicked;
  }
  // ------------------------------------------------------------------ dialogue
  // say(name, text, o) → Promise that resolves when the player advances; o.choices → resolves to an index
  say(name, str, o = {}) {
    return new Promise((resolve) => { this.dialog = { name, str: String(str), shown: 0, t: 0, resolve, o, choices: o.choices || null, pick: 0, done: false }; });
  }
  choose(prompt, choices, o = {}) { return this.say(o.name || '', prompt, Object.assign({}, o, { choices })); }
  drawDialog() {
    const D = this.dialog, W = this.w, H = this.h;
    const bw = Math.min(W - 16, 440), bh = 62, bx = Math.round((W - bw) / 2), by = H - bh - 8;
    const lines = this.wrap(D.str, bw - 24);
    const total = D.str.length;
    D.t += 1 / 60; D.shown = Math.min(total, D.shown + (D.o.speed || 1.6));
    this.panel(bx, by, bw, bh, { dots: false });
    if (D.name) { const nw = this.tw(D.name) + 14; this.panel(bx + 8, by - 11, nw, 14, { fill: D.o.nameColor || T.cyan2, edge: T.cyan, edgeL: '#9ff0ff' }); this.text(D.name, bx + 15, by - 7, T.text, { shadow: T.ink }); }
    // voice babble: one blip per newly revealed character (the audio engine paces and filters them)
    if (this.voice && D.name) { const shownNow = Math.floor(D.shown); for (let i = D.voiced || 0; i < shownNow; i += 2) this.voice(D.name, D.str[i]); D.voiced = shownNow; }
    let left = Math.floor(D.shown);
    for (let i = 0; i < lines.length && i < 5; i++) {
      const part = lines[i].slice(0, Math.max(0, left)); left -= lines[i].length + 1;
      this.text(part, bx + 12, by + 10 + i * 11, T.text, { shadow: T.ink });
    }
    const finished = D.shown >= total;
    const adv = this.ptr.released || this.key('Enter') || this.key(' ') || this.key('z');
    if (D.choices && finished) {
      const cw = Math.min(200, Math.max(...D.choices.map((c) => this.tw(c))) + 30), ch = 15, cx = bx + bw - cw - 6, cy0 = by - 6 - D.choices.length * (ch + 2);
      if (this.key('ArrowUp') || this.key('w')) D.pick = (D.pick + D.choices.length - 1) % D.choices.length;
      if (this.key('ArrowDown') || this.key('s')) D.pick = (D.pick + 1) % D.choices.length;
      for (let i = 0; i < D.choices.length; i++) {
        const y = cy0 + i * (ch + 2);
        if (this.inside(cx, y, cw, ch)) D.pick = i;
        if (this.button(cx, y, cw, ch, D.choices[i], { modal: true, active: D.pick === i, color: T.amber })) { this.closeDialog(i); return; }
        if (D.pick === i) this.icon('play', cx - 9, y + 4, T.amber);
      }
      if (this.key('Enter') || this.key(' ') || this.key('z')) { this.closeDialog(D.pick); return; }
      this.ptr.released = false;
      return;
    }
    if (finished && ((this.t * 2) | 0) % 2) this.icon('play', bx + bw - 14, by + bh - 12, T.amber);
    if (adv) { this.ptr.released = false; if (!finished) D.shown = total; else this.closeDialog(null); }
  }
  closeDialog(v) { const D = this.dialog; this.dialog = null; this.keys = {}; D.resolve(v); }
  // ------------------------------------------------------------------ toasts
  toast(str, o = {}) { if (this.toasts.some((t) => t.str === str)) return; this.toasts.push({ str, t: 0, dur: o.dur || 2.2, color: o.color || T.amber, icon: o.icon }); }
  drawToasts() {
    let y = 8, n = 0;
    for (const t of this.toasts) {
      if (n++ >= 3) break;            // at most three at a time; the rest wait their turn
      t.t += 1 / 60;
      const a = Math.min(1, t.t * 6, (t.dur - t.t) * 4);
      if (a <= 0) continue;
      const w = this.tw(t.str) + (t.icon ? 26 : 16), x = Math.round(this.w / 2 - w / 2 + (1 - a) * 0);
      this.panel(x, y - Math.round((1 - a) * 8), w, 15, { edge: t.color, edgeL: shift(t.color, 0.8) });
      if (t.icon) this.icon(t.icon, x + 6, y + 4 - Math.round((1 - a) * 8), t.color);
      this.text(t.str, x + (t.icon ? 17 : 8), y + 4 - Math.round((1 - a) * 8), T.text, { shadow: T.ink });
      y += 18;
    }
    this.toasts = this.toasts.filter((t) => t.t < t.dur);
  }
}
