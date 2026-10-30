// Pixel lettering + shared pixel-art painters for the Downtown and Alamo Hill Park districts.
// Canvas fillText is anti-aliased (and the web font may not be loaded yet when a texture is painted),
// so signs, billboards, menus and screens use these tiny bitmap fonts instead: every letter is a crisp
// grid of pixels, scaled by whole numbers.
import { TX } from '../build.js';

const { dark, light } = TX;

// 5 × 7 capitals, digits and punctuation (rows top → bottom, 5 bits each, MSB = left)
const G5 = {
  A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110', C: '01110 10001 10000 10000 10000 10001 01110',
  D: '11110 10001 10001 10001 10001 10001 11110', E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001', I: '01110 00100 00100 00100 00100 00100 01110',
  J: '00111 00010 00010 00010 00010 10010 01100', K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 10001 11001 10101 10011 10001 10001', O: '01110 10001 10001 10001 10001 10001 01110',
  P: '11110 10001 10001 11110 10000 10000 10000', Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100', U: '10001 10001 10001 10001 10001 10001 01110',
  V: '10001 10001 10001 10001 10001 01010 00100', W: '10001 10001 10001 10101 10101 10101 01010', X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
  0: '01110 10001 10011 10101 11001 10001 01110', 1: '00100 01100 00100 00100 00100 00100 01110', 2: '01110 10001 00001 00010 00100 01000 11111',
  3: '11111 00010 00100 00010 00001 10001 01110', 4: '00010 00110 01010 10010 11111 00010 00010', 5: '11111 10000 11110 00001 00001 10001 01110',
  6: '00110 01000 10000 11110 10001 10001 01110', 7: '11111 00001 00010 00100 01000 01000 01000', 8: '01110 10001 10001 01110 10001 10001 01110',
  9: '01110 10001 10001 01111 00001 00010 01100',
  ' ': '00000 00000 00000 00000 00000 00000 00000', '!': '00100 00100 00100 00100 00100 00000 00100', '?': '01110 10001 00001 00010 00100 00000 00100',
  '.': '00000 00000 00000 00000 00000 01100 01100', ',': '00000 00000 00000 00000 01100 00100 01000', ':': '00000 01100 01100 00000 01100 01100 00000',
  '-': '00000 00000 00000 11111 00000 00000 00000', '+': '00000 00100 00100 11111 00100 00100 00000', '/': '00001 00010 00010 00100 01000 01000 10000',
  '&': '01100 10010 10100 01000 10101 10010 01101', $: '00100 01111 10100 01110 00101 11110 00100', '%': '11000 11001 00010 00100 01000 10011 00011',
  "'": '00100 00100 01000 00000 00000 00000 00000', '*': '00000 00100 10101 01110 10101 00100 00000', '#': '01010 01010 11111 01010 11111 01010 01010',
  '<': '00010 00100 01000 10000 01000 00100 00010', '>': '01000 00100 00010 00001 00010 00100 01000', '@': '00000 01010 11111 11111 01110 00100 00000',
  '=': '00000 00000 11111 00000 11111 00000 00000', '(': '00010 00100 01000 01000 01000 00100 00010', ')': '01000 00100 00010 00010 00010 00100 01000',
};
// 3 × 5 mini capitals (menus, price tags, product boxes, screens)
const G3 = {
  A: '010 101 111 101 101', B: '110 101 110 101 110', C: '011 100 100 100 011', D: '110 101 101 101 110', E: '111 100 110 100 111', F: '111 100 110 100 100',
  G: '011 100 101 101 011', H: '101 101 111 101 101', I: '111 010 010 010 111', J: '001 001 001 101 010', K: '101 101 110 101 101', L: '100 100 100 100 111',
  M: '101 111 111 101 101', N: '110 101 101 101 101', O: '010 101 101 101 010', P: '110 101 110 100 100', Q: '010 101 101 110 011', R: '110 101 110 101 101',
  S: '011 100 010 001 110', T: '111 010 010 010 010', U: '101 101 101 101 111', V: '101 101 101 101 010', W: '101 101 111 111 101', X: '101 101 010 101 101',
  Y: '101 101 010 010 010', Z: '111 001 010 100 111',
  0: '111 101 101 101 111', 1: '010 110 010 010 111', 2: '110 001 010 100 111', 3: '110 001 010 001 110', 4: '101 101 111 001 001', 5: '111 100 110 001 110',
  6: '011 100 111 101 111', 7: '111 001 010 010 010', 8: '111 101 111 101 111', 9: '111 101 111 001 110',
  ' ': '000 000 000 000 000', '.': '000 000 000 000 010', '!': '010 010 010 000 010', '-': '000 000 111 000 000', $: '011 110 010 011 110', ':': '000 010 000 010 000',
  '/': '001 001 010 100 100', '?': '110 001 010 000 010', '+': '000 010 111 010 000', "'": '010 010 000 000 000', '%': '101 001 010 100 101', '&': '010 101 010 101 011',
  '#': '101 111 101 111 101', '@': '101 111 111 010 000', ',': '000 000 000 010 100', '=': '000 111 000 111 000', '<': '001 010 100 010 001', '>': '100 010 001 010 100',
};
const FONTS = { 5: { g: G5, w: 5, h: 7 }, 3: { g: G3, w: 3, h: 5 } };
const glyph = (F, ch) => { const s = F.g[ch] || F.g[ch.toUpperCase()] || F.g['?']; return s.split(' '); };

/** width in pixels of a string in the given font (5 or 3) at scale s */
export function textW(str, font = 5, s = 1) { const F = FONTS[font]; return str.length ? (str.length * (F.w + 1) - 1) * s : 0; }
/** paint crisp bitmap text; o: { font: 5 | 3, s: scale, align: 'left' | 'center' | 'right', shadow: colour, outline: colour, mid: true (y is the vertical centre) } */
export function ptext(P, str, x, y, col, o = {}) {
  const F = FONTS[o.font || 5], s = o.s || 1, w = textW(str, o.font || 5, s);
  let x0 = Math.round(o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2), y0 = Math.round(o.mid === false ? y : y - (F.h * s) / 2);
  const draw = (dx, dy, c) => {
    let cx = x0 + dx;
    for (const ch of str) {
      const rows = glyph(F, ch);
      for (let r = 0; r < F.h; r++) for (let k = 0; k < F.w; k++) if (rows[r][k] === '1') P.rect(cx + k * s, y0 + dy + r * s, s, s, typeof c === 'function' ? c(r / F.h) : c);
      cx += (F.w + 1) * s;
    }
  };
  if (o.outline) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) draw(dx * (o.ow || 1), dy * (o.ow || 1), o.outline);
  if (o.shadow) draw(o.sd || Math.max(1, Math.floor(s / 2)), o.sd || Math.max(1, Math.floor(s / 2)), o.shadow);
  draw(0, 0, col);
  return w;
}
/** fit text into a width: largest whole scale (≤ max) */
export const fitScale = (str, wPx, font = 5, max = 8) => { let s = max; while (s > 1 && textW(str, font, s) > wPx) s--; return s; };

// ---------------------------------------------------------------- shared painters
/** a pixel sign board: bevelled frame, background, centred bitmap text (optionally a second line) */
export function signBoard(key, text, wM, hM, o = {}) {
  const bg = o.bg || '#c83a3a', fg = o.fg || '#fff4d8', frame = o.frame || dark(bg, 0.45);
  return TX.ptex('dtsign:' + key + text + bg + fg, wM, hM, (g, W, H, r, P) => {
    P.fill(frame); P.rect(2, 2, W - 4, H - 4, bg);
    P.hline(2, 2, W - 4, light(bg, 0.25)); P.hline(2, H - 3, W - 4, dark(bg, 0.25));
    if (o.stripe) { P.rect(2, H - 6, W - 4, 2, o.stripe); P.rect(2, 4, W - 4, 1, o.stripe); }
    const lines = o.sub ? [text, o.sub] : [text];
    const s1 = Math.min(o.s || 99, fitScale(text, W - 10, 5, Math.floor((H - 8) / (o.sub ? 11 : 8)))), s2 = o.sub ? fitScale(o.sub, W - 10, o.subFont || 3, Math.max(1, Math.floor(s1 * 0.75))) : 0;
    const h1 = 7 * s1, h2 = o.sub ? (o.subFont === 5 ? 7 : 5) * s2 : 0, gap = o.sub ? Math.max(2, s1) : 0, top = Math.round((H - h1 - h2 - gap) / 2);
    if (o.icon) o.icon(P, W, H);
    ptext(P, lines[0], W / 2 + (o.dx || 0), top, fg, { s: s1, mid: false, shadow: o.shadow === false ? null : dark(bg, 0.5) });
    if (o.sub) ptext(P, o.sub, W / 2 + (o.dx || 0), top + h1 + gap, o.subCol || fg, { s: s2, font: o.subFont || 3, mid: false });
    if (o.bolts !== false) for (const [x, y] of [[3, 3], [W - 4, 3], [3, H - 4], [W - 4, H - 4]]) P.px(x, y, light(frame, 0.4));
  }, { ppm: o.ppm || 32 });
}
/** a ring of marquee bulbs around a rect */
export function bulbs(P, x, y, w, h, on = '#fff2b0', off = '#c8a040', step = 4) {
  for (let i = x; i < x + w; i += step) { P.rect(i, y, 2, 2, (i / step) & 1 ? on : off); P.rect(i, y + h - 2, 2, 2, (i / step) & 1 ? off : on); }
  for (let j = y + step; j < y + h - 2; j += step) { P.rect(x, j, 2, 2, (j / step) & 1 ? on : off); P.rect(x + w - 2, j, 2, 2, (j / step) & 1 ? off : on); }
}
/** vertical gradient in dithered bands (pixel-art sky / glow) */
export function vgrad(P, x, y, w, h, cols) {
  const n = cols.length - 1;
  for (let j = 0; j < h; j++) { const t = (j / h) * n, i = Math.min(n - 1, Math.floor(t)), f = t - i; for (let k = 0; k < w; k++) P.px(x + k, y + j, TX.dith(x + k, y + j, f) ? cols[i + 1] : cols[i]); }
}
/** a filled pixel disc */
export function disc(P, cx, cy, r, c) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) P.px(cx + x, cy + y, c); }
/** a cute round Tokonmon face (blob body, ears, eyes) — used on posters, signs and graffiti */
export function critter(P, cx, cy, r, body, o = {}) {
  const ink = o.ink || '#2a1e2e';
  if (o.ears !== false) { for (const sx of [-1, 1]) for (let i = 0; i < r * 0.7; i++) P.rect(cx + sx * (r * 0.55) - (sx < 0 ? i * 0.5 : 0) - 1, cy - r - i + r * 0.3, Math.max(2, r * 0.45 - i * 0.6), 1, i < 1 ? ink : body); }
  disc(P, cx, cy, r + 1, ink); disc(P, cx, cy, r, body); disc(P, cx - Math.round(r * 0.25), cy - Math.round(r * 0.3), Math.max(1, Math.round(r * 0.35)), light(body, 0.3));
  const e = Math.max(1, Math.round(r * 0.18));
  for (const sx of [-1, 1]) { P.rect(cx + sx * Math.round(r * 0.38) - e, cy - e, e * 2, e * 3, ink); P.px(cx + sx * Math.round(r * 0.38) - e + 1, cy - e + 1, '#ffffff'); }
  P.rect(cx - e, cy + Math.round(r * 0.45), e * 2, Math.max(1, e - 1), o.mouth || '#e85a6a');
  P.rect(cx - Math.round(r * 0.75), cy + Math.round(r * 0.2), e + 1, e, o.cheek || '#f49ab0'); P.rect(cx + Math.round(r * 0.75) - e, cy + Math.round(r * 0.2), e + 1, e, o.cheek || '#f49ab0');
}
export { dark, light };
