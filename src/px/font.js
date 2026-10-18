// Crisp pixel fonts: a 5×7 bitmap font (Latin, digits, punctuation) for signs
// and UI, a 3×5 mini font, and Japanese/other glyphs via the DotGothic16 web
// font rasterized with a hard alpha threshold (no anti-aliasing).
import { P } from './surface.js';

// 5×7 glyphs as 7 rows of 5 bits (MSB = leftmost)
const G5 = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30], E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16], G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17], I: [14, 4, 4, 4, 4, 4, 14], J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31], M: [17, 27, 21, 21, 17, 17, 17], N: [17, 17, 25, 21, 19, 17, 17], O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16], Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17], S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17], Y: [17, 17, 10, 4, 4, 4, 4],
  Z: [31, 1, 2, 4, 8, 16, 31], 0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31], 3: [31, 2, 4, 2, 1, 17, 14],
  4: [2, 6, 10, 18, 31, 2, 2], 5: [31, 16, 30, 1, 1, 17, 14], 6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8], 8: [14, 17, 17, 14, 17, 17, 14],
  9: [14, 17, 17, 15, 1, 2, 12], ' ': [0, 0, 0, 0, 0, 0, 0], '.': [0, 0, 0, 0, 0, 12, 12], ',': [0, 0, 0, 0, 12, 4, 8], '!': [4, 4, 4, 4, 4, 0, 4], '?': [14, 17, 1, 2, 4, 0, 4],
  ':': [0, 12, 12, 0, 12, 12, 0], '-': [0, 0, 0, 31, 0, 0, 0], '+': [0, 4, 4, 31, 4, 4, 0], "'": [4, 4, 8, 0, 0, 0, 0], '&': [12, 18, 20, 8, 21, 18, 13], '/': [1, 1, 2, 4, 8, 16, 16],
  '¥': [17, 10, 31, 4, 31, 4, 4], '★': [4, 4, 31, 14, 14, 27, 17], '♪': [6, 5, 4, 4, 28, 28, 0], '%': [24, 25, 2, 4, 8, 19, 3], '#': [10, 10, 31, 10, 31, 10, 10], '(': [2, 4, 8, 8, 8, 4, 2], ')': [8, 4, 2, 2, 2, 4, 8],
  '*': [0, 4, 21, 14, 21, 4, 0], '=': [0, 0, 31, 0, 31, 0, 0], '<': [2, 4, 8, 16, 8, 4, 2], '>': [8, 4, 2, 1, 2, 4, 8], '"': [10, 10, 0, 0, 0, 0, 0], '♥': [0, 10, 31, 31, 14, 4, 0],
  ';': [0, 12, 12, 0, 12, 4, 8], '[': [14, 8, 8, 8, 8, 8, 14], ']': [14, 2, 2, 2, 2, 2, 14], '_': [0, 0, 0, 0, 0, 0, 31], '~': [0, 0, 8, 21, 2, 0, 0], '$': [4, 15, 20, 14, 5, 30, 4], '@': [14, 17, 23, 21, 23, 16, 14], '^': [4, 10, 17, 0, 0, 0, 0],
  '…': [0, 0, 0, 0, 0, 0, 21], '—': [0, 0, 0, 31, 0, 0, 0], '–': [0, 0, 0, 14, 0, 0, 0], '’': [4, 4, 8, 0, 0, 0, 0], '‘': [4, 4, 2, 0, 0, 0, 0], '“': [10, 10, 20, 0, 0, 0, 0], '”': [10, 10, 20, 0, 0, 0, 0], '!?': [0], '¡': [4, 0, 4, 4, 4, 4, 4], '→': [0, 4, 2, 31, 2, 4, 0], '←': [0, 4, 8, 31, 8, 4, 0], '↑': [4, 14, 21, 4, 4, 4, 0], '↓': [0, 4, 4, 4, 21, 14, 4], '·': [0, 0, 0, 12, 12, 0, 0], '♦': [0, 4, 14, 31, 14, 4, 0], '●': [0, 14, 31, 31, 31, 14, 0], '○': [0, 14, 17, 17, 17, 14, 0], '×': [0, 17, 10, 4, 10, 17, 0],
  a: [0, 0, 14, 1, 15, 17, 15], b: [16, 16, 22, 25, 17, 17, 30], c: [0, 0, 14, 16, 16, 17, 14], d: [1, 1, 13, 19, 17, 17, 15], e: [0, 0, 14, 17, 31, 16, 14], f: [6, 9, 8, 28, 8, 8, 8], g: [0, 0, 15, 17, 17, 15, 1, 14],
  h: [16, 16, 22, 25, 17, 17, 17], i: [4, 0, 12, 4, 4, 4, 14], j: [2, 0, 6, 2, 2, 2, 18, 12], k: [16, 16, 18, 20, 24, 20, 18], l: [12, 4, 4, 4, 4, 4, 14], m: [0, 0, 26, 21, 21, 17, 17], n: [0, 0, 22, 25, 17, 17, 17],
  o: [0, 0, 14, 17, 17, 17, 14], p: [0, 0, 30, 17, 17, 30, 16, 16], q: [0, 0, 15, 17, 17, 15, 1, 1], r: [0, 0, 22, 25, 16, 16, 16], s: [0, 0, 14, 16, 14, 1, 30], t: [8, 8, 28, 8, 8, 9, 6], u: [0, 0, 17, 17, 17, 19, 13],
  v: [0, 0, 17, 17, 17, 10, 4], w: [0, 0, 17, 17, 21, 21, 10], x: [0, 0, 17, 10, 4, 10, 17], y: [0, 0, 17, 17, 17, 15, 1, 14], z: [0, 0, 31, 2, 4, 8, 31],
};
// 3×5 mini glyphs (rows of 3 bits)
const G3 = {
  A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6], E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4], G: [3, 4, 5, 5, 3], H: [5, 5, 7, 5, 5], I: [7, 2, 2, 2, 7],
  J: [1, 1, 1, 5, 2], K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7], M: [5, 7, 7, 5, 5], N: [6, 5, 5, 5, 5], O: [2, 5, 5, 5, 2], P: [6, 5, 6, 4, 4], Q: [2, 5, 5, 6, 3], R: [6, 5, 6, 5, 5],
  S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2], U: [5, 5, 5, 5, 7], V: [5, 5, 5, 5, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5], Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7],
  0: [7, 5, 5, 5, 7], 1: [2, 6, 2, 2, 7], 2: [6, 1, 2, 4, 7], 3: [6, 1, 2, 1, 6], 4: [5, 5, 7, 1, 1], 5: [7, 4, 6, 1, 6], 6: [3, 4, 7, 5, 7], 7: [7, 1, 2, 2, 2], 8: [7, 5, 7, 5, 7], 9: [7, 5, 7, 1, 6],
  ' ': [0, 0, 0, 0, 0], '.': [0, 0, 0, 0, 2], '!': [2, 2, 2, 0, 2], '-': [0, 0, 7, 0, 0], ':': [0, 2, 0, 2, 0], '¥': [5, 2, 7, 2, 2], '/': [1, 1, 2, 4, 4], '+': [0, 2, 7, 2, 0], "'": [2, 2, 0, 0, 0], '&': [2, 5, 2, 5, 3],
};

// width of a string in px
export function textWidth(str, opts = {}) {
  const mini = opts.mini, sp = opts.spacing ?? 1, sc = opts.scale || 1;
  let w = 0;
  for (const ch of String(str)) w += (isJp(ch) ? (opts.jpSize || 10) : (mini ? 3 : 5)) * (isJp(ch) ? 1 : sc) + sp;
  return Math.max(0, w - sp);
}
const isJp = (ch) => ch.charCodeAt(0) > 0x2e7f && !G5[ch];
export const hasGlyph = (ch) => !!G5[ch];

// draw text on a Surf. opts: { mini, scale, spacing, shadow: '#hex', outline: '#hex', align: 'left'|'center'|'right', jpSize, bold }
export function text(s, str, x, y, color, opts = {}) {
  str = String(str);
  const mini = opts.mini, sc = opts.scale || 1, sp = opts.spacing ?? 1;
  const w = textWidth(str, opts);
  if (opts.align === 'center') x -= Math.floor(w / 2); else if (opts.align === 'right') x -= w;
  x = Math.round(x); y = Math.round(y);
  const draw = (ox, oy, col) => {
    let cx = x + ox;
    const v = P(col);
    for (const ch0 of str) {
      if (isJp(ch0)) { jpGlyph(s, ch0, cx, y + oy, v, opts.jpSize || 10); cx += (opts.jpSize || 10) + sp; continue; }
      const ch = mini ? ch0.toUpperCase() : (G5[ch0] ? ch0 : ch0.toUpperCase());
      const g = mini ? (G3[ch] || G3[' ']) : (G5[ch] || G5['?']);
      const gw = mini ? 3 : 5;
      for (let r = 0; r < g.length; r++) for (let c = 0; c < gw; c++) if (g[r] & (1 << (gw - 1 - c))) {
        for (let a = 0; a < sc; a++) for (let b = 0; b < sc; b++) { const X = cx + c * sc + a, Y = y + oy + r * sc + b; if (X >= 0 && Y >= 0 && X < s.w && Y < s.h) s.data[Y * s.w + X] = v; }
      }
      cx += gw * sc + sp;
    }
  };
  if (opts.outline) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) draw(dx, dy, opts.outline);
  if (opts.shadow) draw(1, 1, opts.shadow);
  draw(0, 0, color);
  s.touch();
  return w;
}

// Japanese / symbol glyphs via the pixel web font, thresholded and cached
const jpCache = new Map();
let jpCtx = null;
function jpGlyph(s, ch, x, y, v, size) {
  const key = ch + '|' + size;
  let m = jpCache.get(key);
  if (!m) {
    if (!jpCtx) { const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(32, 32) : document.createElement('canvas'); c.width = 32; c.height = 32; jpCtx = c.getContext('2d', { willReadFrequently: true }); }
    jpCtx.clearRect(0, 0, 32, 32);
    jpCtx.fillStyle = '#fff'; jpCtx.textBaseline = 'top';
    jpCtx.font = `${size}px "DotGothic16", "MS Gothic", monospace`;
    jpCtx.fillText(ch, 0, 0);
    const d = jpCtx.getImageData(0, 0, size + 2, size + 2).data;
    m = [];
    for (let j = 0; j < size + 2; j++) for (let i = 0; i < size + 2; i++) if (d[(j * (size + 2) + i) * 4 + 3] > 110) m.push(i, j);
    jpCache.set(key, m);
  }
  for (let k = 0; k < m.length; k += 2) { const X = x + m[k], Y = y + m[k + 1]; if (X >= 0 && Y >= 0 && X < s.w && Y < s.h) s.data[Y * s.w + X] = v; }
}
export async function loadFonts() {
  try { if (typeof document !== 'undefined' && document.fonts) await Promise.race([document.fonts.load('10px "DotGothic16"', 'あ'), new Promise((r) => setTimeout(r, 1500))]); } catch (e) { /* offline: fallback font */ }
  jpCache.clear();
}
