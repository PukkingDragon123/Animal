// Pixel-art textures for Sunset Row (the home district): 32 texels per metre, nearest-filtered,
// hand-pixelled with ordered dithering. Keys start with 'sr_' so they never collide with other districts.
// No people are ever painted into textures: photos, posters and TV shows show Tokonmon, places and things.
import * as THREE from '../../../../../vendor/three.module.js';
import * as PX from '../../pixtex.js';

export const ptex = PX.ptex;
/** lighter / darker shade of a '#hex' colour, returned as '#hex' so it can be chained */
export const lt = (c, k = 0.2) => PX.hex(PX.light(c, k));
export const dk = (c, k = 0.25) => PX.hex(PX.dark(c, k));
const glow = (t) => { t.userData.srGlow = true; return t; };
/** n frames side by side → show one at a time through texture.offset (see anim() in kit.js) */
export function atlas(t, n) { if (!t.userData.frames) { t.userData.frames = n; t.repeat.set(1 / n, 1); t.generateMipmaps = false; t.minFilter = THREE.NearestFilter; t.needsUpdate = true; } return t; }

// ---------------------------------------------------------------- a 3×5 pixel font for tiny signs
const F3R = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'], G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'], J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '#.#', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'], P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#.#', '#.#', '#.#', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'], 3: ['##.', '..#', '.#.', '..#', '##.'],
  4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'], 6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'],
  8: ['###', '#.#', '###', '#.#', '###'], 9: ['###', '#.#', '###', '..#', '##.'],
  '!': ['.#.', '.#.', '.#.', '...', '.#.'], '-': ['...', '...', '###', '...', '...'], '.': ['...', '...', '...', '...', '.#.'], ' ': ['...', '...', '...', '...', '...'],
  '?': ['##.', '..#', '.#.', '...', '.#.'], '+': ['...', '.#.', '###', '.#.', '...'],
};
const F3 = {}; for (const k in F3R) F3[k] = F3R[k].join('');
/** draw str in the 3×5 font at (x, y); returns the width in pixels */
export function px3(P, str, x, y, c, sh) {
  let cx = x;
  for (const ch of String(str).toUpperCase()) {
    const g = F3[ch] || F3[' '];
    for (let i = 0; i < 15; i++) if (g[i] === '#') { if (sh) P.px(cx + (i % 3) + 1, y + Math.floor(i / 3) + 1, sh); P.px(cx + (i % 3), y + Math.floor(i / 3), c); }
    cx += 4;
  }
  return cx - x - 1;
}
export const px3w = (str) => String(str).length * 4 - 1;

// ---------------------------------------------------------------- materials (tiling, metres)
// wood tones snap to a small palette so the merged meshes stay few (each distinct texture is a draw call)
const WOODS = ['#3a2620', '#5a3a24', '#6a4428', '#7a5236', '#8a5a36', '#a8784a', '#b88a5a', '#c89a62', '#c8a070', '#e8dcc8', '#f4ece0', '#e8473a'];
const near = (c, pal) => { const [r, g, b] = PX.hx(c); let best = pal[0], bd = 1e9; for (const p of pal) { const [R, G, B] = PX.hx(p), d = (R - r) ** 2 * 0.3 + (G - g) ** 2 * 0.59 + (B - b) ** 2 * 0.11; if (d < bd) { bd = d; best = p; } } return best; };
export const wood = (c0 = '#a87a4a') => woodTex(near(c0, WOODS));
const woodTex = (c) => ptex('sr_wood' + c, 1, 1, (g, W, H, r, P) => {
  P.fill(c);
  for (let y = 0; y < H; y++) if (Math.sin(y * 0.83 + Math.sin(y * 0.21) * 2) > 0.55) P.hline(0, y, W, dk(c, 0.07));
  for (let i = 0; i < 28; i++) { const y = Math.floor(r() * H), x = Math.floor(r() * W), w = 3 + Math.floor(r() * 12); P.hline(x, y, w, r() < 0.55 ? dk(c, 0.15) : lt(c, 0.08)); }
  for (let i = 0; i < 2; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * H); P.rect(x, y, 2, 1, dk(c, 0.35)); P.px(x - 1, y, dk(c, 0.18)); P.px(x + 2, y, dk(c, 0.18)); }
});
export const fabric = (c = '#c86a5a') => ptex('sr_fab' + c, 1, 1, (g, W, H, r, P) => {
  P.fill(c); P.dither(0, 0, W, H, dk(c, 0.08), 0.25); P.speck(70, lt(c, 0.1), r); P.speck(30, dk(c, 0.15), r);
});
export const knit = (c = '#e8d0a0') => ptex('sr_knit' + c, 1, 1, (g, W, H, r, P) => {
  P.fill(c); for (let y = 0; y < H; y += 3) for (let x = (y / 3) & 1; x < W; x += 2) { P.px(x, y, dk(c, 0.12)); P.px(x, y + 1, lt(c, 0.1)); }
});
export const paint = (c) => ptex('sr_paint' + c, 1, 1, (g, W, H, r, P) => { P.fill(c); P.speck(18, lt(c, 0.05), r); P.speck(18, dk(c, 0.05), r); }, { ppm: 16 });
export const metal = (c = '#b8c0c8') => ptex('sr_metal' + c, 1, 1, (g, W, H, r, P) => { P.fill(c); for (let y = 0; y < H; y += 4) P.hline(0, y, W, lt(c, 0.12)); P.speck(30, dk(c, 0.12), r); });
export const glass = (c = '#8ab8d8') => ptex('sr_glass' + c, 1, 1, (g, W, H, r, P) => { P.fill(c); P.dither(0, 0, W, H, lt(c, 0.35), (x, y) => ((x + y) % 13 < 3 ? 0.7 : 0.05)); });
export const counter = (c = '#e8e2d6') => ptex('sr_counter' + c, 1, 1, (g, W, H, r, P) => { P.fill(c); P.speck(120, dk(c, 0.12), r); P.speck(60, lt(c, 0.15), r); P.speck(20, '#9a8a7a', r); });
export const tilesSq = (a = '#f2f0ea', grout = '#c8c4bc', s = 4) => ptex('sr_tsq' + a + grout + s, 1, 1, (g, W, H, r, P) => {
  P.fill(grout); for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) { P.rect(x, y, s - 1, s - 1, a); P.px(x, y, lt(a, 0.3)); }
  P.speck(10, dk(a, 0.1), r);
});
export const checker = (a = '#f0ead8', b = '#9cc4b4', s = 8) => ptex('sr_chk' + a + b + s, 1, 1, (g, W, H, r, P) => {
  for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) { const c = ((x + y) / s) & 1 ? b : a; P.rect(x, y, s, s, c); P.hline(x, y, s, lt(c, 0.12)); P.vline(x + s - 1, y, s, dk(c, 0.1)); }
});
export const herring = (c = '#b8834e') => ptex('sr_herr' + c, 1, 1, (g, W, H, r, P) => {
  P.fill(dk(c, 0.3));
  for (let y = -8; y < H + 8; y += 4) for (let x = 0; x < W; x += 8) { const k = (r() - 0.5) * 0.16, cc = k > 0 ? lt(c, k) : dk(c, -k); for (let i = 0; i < 8; i++) { P.px(x + i, y + i * 0.5, cc); P.px(x + i, y + i * 0.5 + 1, cc); P.px(x + i, y + i * 0.5 + 2, i === 0 ? dk(cc, 0.2) : cc); } }
});
export const fishscale = (c = '#e8a0a8') => ptex('sr_fish' + c, 1, 1, (g, W, H, r, P) => {
  P.fill(dk(c, 0.3));
  for (let row = 0; row * 4 < H; row++) for (let x = (row & 1) * 3 - 3; x < W + 6; x += 6) {
    const y = row * 4, cc = r() < 0.5 ? c : lt(c, 0.06);
    P.rect(x, y, 5, 3, cc); P.rect(x + 1, y + 3, 3, 1, cc); P.hline(x, y, 5, lt(cc, 0.18)); P.px(x + 4, y + 2, dk(cc, 0.2));
  }
});
export const siding = (c) => PX.siding(c);
export const hedge = (c = '#4a8a42') => ptex('sr_hedge' + c, 1, 1, (g, W, H, r, P) => {
  P.fill(dk(c, 0.15));
  for (let i = 0; i < 220; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * H), k = r(); P.rect(x, y, 2, 2, k < 0.33 ? c : k < 0.66 ? lt(c, 0.15) : dk(c, 0.25)); }
  for (let i = 0; i < 40; i++) P.px(r() * W, r() * H, lt(c, 0.35));
});
export const soil = (c = '#6a4a32') => ptex('sr_soil' + c, 1, 1, (g, W, H, r, P) => { P.fill(c); P.speck(120, dk(c, 0.25), r); P.speck(80, lt(c, 0.12), r); for (let y = 2; y < H; y += 6) P.hline(0, y, W, dk(c, 0.15)); });
export const flowers = (c = '#5a9a4a', seed = 1) => ptex('sr_flw' + c + seed, 1, 1, (g, W, H, r, P) => {
  P.fill(dk(c, 0.2)); P.speck(180, c, r); P.speck(120, lt(c, 0.2), r);
  const pal = [['#f06a7a', '#ffd0d8'], ['#f8d84a', '#fff4b0'], ['#ffffff', '#f8e8a0'], ['#a07ad8', '#e0d0ff'], ['#f08a3a', '#ffd8a0']];
  for (let i = 0; i < 26; i++) { const [a, b] = pal[(i + seed) % pal.length], x = Math.floor(r() * (W - 3)), y = Math.floor(r() * (H - 3)); P.px(x + 1, y, a); P.px(x, y + 1, a); P.px(x + 2, y + 1, a); P.px(x + 1, y + 2, a); P.px(x + 1, y + 1, b); }
});
export const pebbles = (c = '#d8ccb8') => ptex('sr_peb' + c, 1, 1, (g, W, H, r, P) => { P.fill(dk(c, 0.2)); for (let i = 0; i < 160; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * H), k = (r() - 0.5) * 0.3; P.rect(x, y, 2, 2, k > 0 ? lt(c, k) : dk(c, -k)); } });
export const flagstone = (c = '#c8beb0') => ptex('sr_flag' + c, 1, 1, (g, W, H, r, P) => {
  P.fill(dk(c, 0.35));
  for (const [x, y, w, h] of [[1, 1, 14, 9], [16, 1, 15, 13], [1, 11, 9, 11], [11, 11, 4, 4], [11, 16, 20, 7], [16, 15, 15, 0], [1, 23, 13, 8], [15, 24, 16, 7]]) if (h) { const k = (r() - 0.5) * 0.14; P.block(x, y, w, h, k > 0 ? lt(c, k) : dk(c, -k), { hk: 0.12, lk: 0.15 }); }
});
export const lawn = (c = '#6aaa52') => PX.grass(c);

// ---------------------------------------------------------------- house parts
export const cornice = (c = '#f6f0e2') => ptex('sr_corn' + c, 1, 0.5, (g, W, H, r, P) => {
  P.fill(c); P.hline(0, 0, W, lt(c, 0.3)); P.rect(0, 3, W, 1, dk(c, 0.2));
  for (let x = 1; x < W; x += 4) { P.rect(x, 5, 2, 3, lt(c, 0.12)); P.px(x + 1, 7, dk(c, 0.25)); }
  P.rect(0, 9, W, 1, dk(c, 0.15));
  for (let x = 2; x < W; x += 8) { P.rect(x, 10, 3, 5, dk(c, 0.06)); P.px(x + 1, 14, dk(c, 0.3)); P.px(x, 10, lt(c, 0.2)); }
  P.hline(0, H - 1, W, dk(c, 0.35));
});
export const atticWin = (frame = '#f6f0e2', glassC = '#4a6a8a') => ptex('sr_attic' + frame + glassC, 0.8, 0.9, (g, W, H, r, P) => {
  const cx = W / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dy = y < cx ? (cx - y) : 0, inside = (x - cx + 0.5) ** 2 + dy * dy <= (cx - 0.5) ** 2 || y >= cx;
    if (!inside) continue;
    const inner = (x - cx + 0.5) ** 2 + (y < cx ? (cx - y) ** 2 : 0) <= (cx - 3) ** 2 && x > 2 && x < W - 3 && y < H - 3;
    P.px(x, y, inner ? glassC : frame);
  }
  P.dither(3, 3, W - 6, H - 6, '#9ac0e0', (x, y) => ((x + y) % 9 < 2 ? 0.8 : 0) * (g.getImageData(Math.floor(x * (P.k || 1)), Math.floor(y * (P.k || 1)), 1, 1).data[2] > 120 ? 1 : 0));
  P.vline(Math.floor(cx), 3, H - 6, frame); P.hline(3, Math.floor(H * 0.55), W - 6, frame); P.hline(1, H - 2, W - 2, dk(frame, 0.3));
});
export const doorFancy = (col = '#b04a64', wM = 1.25, glassy = false) => ptex('sr_door' + col + wM + glassy, wM, 2.2, (g, W, H, r, P) => {
  P.fill(col); P.vline(0, 0, H, dk(col, 0.4)); P.vline(W - 1, 0, H, dk(col, 0.4)); P.hline(0, 0, W, dk(col, 0.4));
  const m = 4, half = Math.floor((W - 2 * m - 2) / 2);
  if (glassy) { P.rect(m, m, W - 2 * m, H - 22, '#5a7a9a'); P.dither(m, m, W - 2 * m, H - 22, '#b8d8f0', (x, y) => ((x + y) % 11 < 3 ? 0.8 : 0.08)); P.vline(Math.floor(W / 2), m, H - 22, col); P.block(m, H - 16, W - 2 * m, 12, lt(col, 0.07), { hk: 0.16, lk: 0.3 }); P.rect(W - 8, 38, 3, 4, '#e8c060'); return; }
  // glazed top lite with muntins
  P.block(m, m, W - 2 * m, 20, lt(col, 0.05), { hk: 0.2, lk: 0.3 }); P.rect(m + 2, m + 2, W - 2 * m - 4, 16, '#5a7a9a'); P.dither(m + 2, m + 2, W - 2 * m - 4, 16, '#b8d8f0', (x, y) => ((x + y) % 9 < 2 ? 0.8 : 0.08));
  for (let x = m + 6; x < W - m - 2; x += 5) P.vline(x, m + 2, 16, lt(col, 0.1));
  for (const [y, h] of [[28, 16], [47, 20]]) { P.block(m + 1, y, half, h, lt(col, 0.07), { hk: 0.16, lk: 0.3 }); P.block(W - m - 1 - half, y, half, h, lt(col, 0.07), { hk: 0.16, lk: 0.3 }); }
  P.rect(W - 9, 41, 3, 4, '#e8c060'); P.px(W - 9, 41, '#fff4c0'); P.rect(W / 2 - 3, 25, 6, 1, '#e8c060');
});
export const houseNum = (n, bg = '#2a3a4a', fg = '#f4e0a0') => ptex('sr_num' + n + bg + fg, 0.6, 0.28, (g, W, H, r, P) => {
  P.fill(bg); P.rect(0, 0, W, 1, lt(bg, 0.3)); P.rect(0, H - 1, W, 1, dk(bg, 0.3)); px3(P, n, Math.round((W - px3w(n)) / 2), 2, fg, dk(bg, 0.4));
}, { ppm: 32 });
export const mailboxFront = (col = '#2a5a7a') => ptex('sr_mbx' + col, 0.4, 0.28, (g, W, H, r, P) => {
  P.fill(col); P.rect(0, 0, W, 2, lt(col, 0.2)); P.rect(2, 3, W - 4, 4, dk(col, 0.35)); P.rect(W / 2 - 2, 4, 4, 2, '#e8c060'); px3(P, '17', 3, H - 6, '#f4e8c8');
});

// ---------------------------------------------------------------- rugs, bedding, cushions (fitted pictures)
export const rugLiving = () => ptex('sr_rugL', 2.8, 2.0, (g, W, H, r, P) => {
  const f = '#a8443e', b = '#f0e0c0', m = '#2e4a6a', a = '#e8b040';
  P.fill(f); P.rect(0, 0, W, H, b); P.rect(3, 3, W - 6, H - 6, m); P.rect(5, 5, W - 10, H - 10, f);
  for (let x = 7; x < W - 7; x += 4) { P.px(x, 4, a); P.px(x, H - 5, a); } for (let y = 7; y < H - 7; y += 4) { P.px(4, y, a); P.px(W - 5, y, a); }
  const cx = W / 2, cy = H / 2;
  for (let y = 6; y < H - 6; y++) for (let x = 6; x < W - 6; x++) {
    const d = Math.abs(x - cx + 0.5) / (W * 0.3) + Math.abs(y - cy + 0.5) / (H * 0.32);
    if (d < 1 && d > 0.86) P.px(x, y, b); else if (d < 0.86 && d > 0.74) P.px(x, y, m); else if (d < 0.5 && d > 0.38) P.px(x, y, a); else if (d < 0.2) P.px(x, y, b);
    else if (d >= 1 && (x + y) % 6 === 0 && (x - y) % 4 === 0) P.px(x, y, dk(f, 0.25));
  }
  for (const [x, y] of [[9, 9], [W - 10, 9], [9, H - 10], [W - 10, H - 10]]) { P.rect(x - 2, y - 2, 5, 5, m); P.px(x, y, a); }
  P.speck(90, dk(f, 0.12), r, 6, 6, W - 12, H - 12);
});
export const rugStars = () => ptex('sr_rugS', 2.6, 1.8, (g, W, H, r, P) => {
  const n = '#2e3a6a', b = '#f2c84a';
  P.fill(n); P.rect(0, 0, W, 2, '#5a6aa8'); P.rect(0, H - 2, W, 2, '#5a6aa8'); P.rect(0, 0, 2, H, '#5a6aa8'); P.rect(W - 2, 0, 2, H, '#5a6aa8');
  P.dither(2, 2, W - 4, H - 4, '#3a4a80', (x, y) => (y / H) * 0.6);
  for (let i = 0; i < 16; i++) { const x = 6 + Math.floor(r() * (W - 12)), y = 5 + Math.floor(r() * (H - 10)); P.px(x, y, b); P.px(x - 1, y, b); P.px(x + 1, y, b); P.px(x, y - 1, b); P.px(x, y + 1, b); if (i & 1) { P.px(x - 2, y, '#f8e8a0'); P.px(x + 2, y, '#f8e8a0'); } }
  // a crescent moon and a ringed planet
  for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y <= 36 && (x - 3) ** 2 + (y + 1) ** 2 > 22) P.px(W * 0.72 + x, H * 0.38 + y, '#f8e8b0');
  for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 16) P.px(W * 0.26 + x, H * 0.62 + y, (x + y) % 3 ? '#e8705a' : '#f09a6a');
  for (let x = -8; x <= 8; x++) P.px(W * 0.26 + x, H * 0.62 + Math.round(x * 0.25), '#f8e0c0');
  P.speck(40, '#8a9ad8', r, 3, 3, W - 6, H - 6);
});
export const rugRound = (a = '#9cc4b4', b = '#f0e0c0') => ptex('sr_rugR' + a + b, 1.6, 1.6, (g, W, H, r, P) => {
  const c = W / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - c + 0.5, y - c + 0.5); if (d > c - 0.5) continue; P.px(x, y, Math.floor(d / 3) & 1 ? a : b); if (d > c - 2) P.px(x, y, dk(a, 0.25)); }
}, { ppm: 32 });
export const runner = (c = '#7a3a4a', b = '#e8c890') => ptex('sr_run' + c + b, 1, 1, (g, W, H, r, P) => {
  P.fill(c); P.rect(0, 0, 2, H, b); P.rect(W - 2, 0, 2, H, b); P.rect(4, 0, 1, H, dk(c, 0.3)); P.rect(W - 5, 0, 1, H, dk(c, 0.3));
  for (let y = 0; y < H; y += 8) { const cx = W / 2; for (let i = 0; i < 4; i++) { P.px(cx - i, y + i, b); P.px(cx + i, y + i, b); P.px(cx - i, y + 7 - i, b); P.px(cx + i, y + 7 - i, b); } }
});
export const quilt = (cols = ['#e8705a', '#f2c84a', '#7ab0d8', '#f4ece0'], key = 'a') => ptex('sr_quilt' + key, 1.2, 1.7, (g, W, H, r, P) => {
  const s = 6, top = 9;
  for (let y = top; y < H; y += s) for (let x = 0; x < W; x += s) {
    const i = ((x / s) + (y - top) / s * 3) % cols.length | 0, c = cols[i];
    P.rect(x, y, s, s, c);
    if (i % 2 === 0) { P.px(x + 2, y + 2, lt(c, 0.25)); P.px(x + 3, y + 3, lt(c, 0.25)); P.px(x + 3, y + 2, dk(c, 0.15)); P.px(x + 2, y + 3, dk(c, 0.15)); }
    else P.dither(x, y, s, s, dk(c, 0.1), 0.25);
    P.hline(x, y, s, dk(c, 0.18));
  }
  for (let y = top; y < H; y += 2) { P.px(0, y, '#ffffff'); P.px(W - 1, y, '#ffffff'); }
  P.rect(0, 0, W, top, '#f4f0e8'); P.hline(0, top - 1, W, dk('#f4f0e8', 0.2)); P.hline(0, 2, W, '#c8d8e8');
  P.dither(0, H - 6, W, 6, '#000000', (x, y) => (y - (H - 6)) / 30);
});
export const quiltTop = (c = '#e8705a', key = 'a') => ptex('sr_qt' + c + key, 1, 1, (g, W, H, r, P) => { P.fill(c); for (let y = 0; y < H; y += 6) P.hline(0, y, W, dk(c, 0.18)); for (let x = 0; x < W; x += 6) P.vline(x, 0, H, dk(c, 0.18)); });
export const pillow = (c = '#f4f0e8') => ptex('sr_pil' + c, 0.6, 0.4, (g, W, H, r, P) => {
  P.fill(c); P.rect(0, 0, W, 1, lt(c, 0.3)); P.rect(0, H - 2, W, 2, dk(c, 0.15)); P.vline(0, 0, H, dk(c, 0.1)); P.vline(W - 1, 0, H, dk(c, 0.2)); P.dither(2, 2, W - 4, H - 4, dk(c, 0.06), 0.2);
});
export const cushion = (c, pat = 'dot') => ptex('sr_cush' + c + pat, 0.4, 0.4, (g, W, H, r, P) => {
  P.fill(c); P.rect(0, 0, W, 1, lt(c, 0.2)); P.rect(0, H - 1, W, 1, dk(c, 0.25));
  if (pat === 'dot') for (let y = 3; y < H - 2; y += 4) for (let x = 3; x < W - 2; x += 4) P.px(x, y, lt(c, 0.4));
  if (pat === 'stripe') for (let x = 2; x < W; x += 4) P.vline(x, 1, H - 2, lt(c, 0.35));
  if (pat === 'heart') { const cx = W / 2, cy = H / 2; for (const [x, y] of [[-2, -1], [-1, -2], [1, -2], [2, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, 2], [0, -1], [-1, -1], [1, -1], [0, 0], [-1, 0], [1, 0], [0, 1]]) P.px(cx + x, cy + y, '#f8e0e8'); }
});

// ---------------------------------------------------------------- screens (animated atlases, glowing)
const TVW = 34, TVH = 19;
/** living-room TV: frame 0 = off; then two frames per channel: 1-2 news, 3-4 cooking, 5-6 League, 7-8 nature */
export const tvAtlas = () => glow(atlas(ptex('sr_tvA', (TVW * 9) / 32, TVH / 32, (g, W, H, r, P) => {
  const fr = (i, fn) => { g.save(); g.beginPath(); g.rect(i * TVW, 0, TVW, TVH); g.clip(); fn(i * TVW); g.restore(); };
  fr(0, (o) => { P.rect(o, 0, TVW, TVH, '#1e262c'); for (let i = 0; i < 9; i++) { P.px(o + 20 + i, 2 + i, '#3a4a54'); P.px(o + 22 + i, 2 + i, '#2c3840'); } P.px(o + 30, 16, '#3a4a54'); });
  // news: city skyline under the fog, a weather map with a cloud, a scrolling ticker
  for (const [i, sh] of [[1, 0], [2, 5]]) fr(i, (o) => {
    P.rect(o, 0, TVW, TVH, '#3a6ab0'); P.dither(o, 0, TVW, 12, '#5a8ad0', (x, y) => 0.6 - y / 14);
    for (let k = 0; k < 9; k++) { const x = o + 1 + k * 2, h = [5, 8, 6, 10, 7, 4, 9, 6, 5][k]; P.rect(x, 13 - h, 2, h, k & 1 ? '#2a3a5a' : '#34466a'); if (h > 6) P.px(x, 13 - h + 2, '#f8e8a0'); }
    P.dither(o, 5, 19, 3, '#e8eef4', 0.5 + (sh ? 0.1 : 0));
    P.rect(o + 20, 2, 13, 10, '#e8eef4'); P.rect(o + 21, 3, 11, 8, '#6ab06a'); P.rect(o + 26, 3, 6, 8, '#4a8ad8'); P.rect(o + 22, 4, 5, 2, '#ffffff'); P.rect(o + 23, 3, 3, 1, '#ffffff'); P.px(o + 29, 7, '#f8d84a');
    P.rect(o, 13, TVW, 6, '#c83a3a'); P.rect(o, 13, 6, 6, '#f4f0e8'); px3(P, 'SF', o + 0, 14, '#c83a3a');
    for (let x = 7; x < TVW; x += 3) if (((x + sh) * 7) % 5 < 3) P.rect(o + x, 15, 2, 2, '#fff4e8');
    P.rect(o + 1, 1, 7, 4, '#e83a3a'); P.px(o + 2, 2, '#ffffff'); P.px(o + 2, 3, '#ffffff'); P.px(o + 4, 2, '#ffffff'); P.px(o + 6, 2, '#ffffff'); P.px(o + 6, 3, '#ffffff');
  });
  // cooking show: a steaming wok over a blue flame on a tiled set
  for (const [i, sh] of [[3, 0], [4, 1]]) fr(i, (o) => {
    P.rect(o, 0, TVW, TVH, '#f0d8a8'); for (let y = 0; y < 12; y += 3) for (let x = (y / 3 & 1) * 2; x < TVW; x += 4) P.rect(o + x, y, 3, 2, '#f8e8c8');
    P.rect(o, 12, TVW, 7, '#8a5a3a'); P.hline(o, 12, TVW, '#b07a4a');
    for (let x = -7; x <= 7; x++) { const d = Math.round(Math.sqrt(49 - x * x) * 0.45); P.rect(o + 16 + x, 9, 1, d + 1, '#2a2a32'); }
    P.rect(o + 9, 9, 15, 1, '#4a4a54'); P.rect(o + 24, 8, 6, 1, '#6a4a32');
    P.rect(o + 12, 8, 2, 1, '#e8473a'); P.rect(o + 15, 8, 2, 1, '#6ab04a'); P.rect(o + 18, 8, 2, 1, '#f8d84a');
    for (let k = 0; k < 3; k++) { const x = o + 12 + k * 4 + (sh ? 1 : 0), y = 6 - ((k + sh) % 2) * 2; P.px(x, y, '#ffffff'); P.px(x + 1, y - 1, '#ffffff'); P.px(x, y - 2, '#f4f4f4'); P.px(x + 1, y - 3, '#ffffff'); }
    P.rect(o + 13, 12, 7, 1, sh ? '#5ab0f8' : '#3a8ae8'); P.px(o + 15, 11, '#8ad0ff');
    px3(P, 'WOK', o + 1, 13, '#f8e8c8');
  });
  // League highlights: a red chick and a blue critter face off in an arena, an energy beam and a score bar
  for (const [i, sh] of [[5, 0], [6, 1]]) fr(i, (o) => {
    P.rect(o, 0, TVW, 6, '#2a2440'); for (let x = 0; x < TVW; x += 2) P.px(o + x, 2 + ((x * 7) % 3), ['#e85a6a', '#f8d84a', '#8ab0f8', '#f4f0e8'][(x / 2) % 4]);
    P.rect(o, 6, TVW, 13, '#4aa04a'); P.dither(o, 6, TVW, 13, '#5ab85a', 0.3); P.hline(o, 12, TVW, '#8ad08a');
    const by = sh ? 9 : 10;
    P.rect(o + 4, by, 6, 5, '#e8473a'); P.rect(o + 5, by - 2, 2, 2, '#f8c840'); P.rect(o + 7, by - 1, 1, 1, '#f8c840'); P.px(o + 8, by + 1, '#1a1a22'); P.rect(o + 10, by + 2, 2, 1, '#f8a030');
    P.rect(o + 24, 9, 6, 6, '#4a8ad8'); P.rect(o + 25, 8, 4, 1, '#4a8ad8'); P.px(o + 25, 11, '#1a1a22'); P.rect(o + 23, 12, 1, 2, '#3a6ab0');
    if (!sh) for (let x = 12; x < 23; x++) P.px(o + x, by + 2 + ((x & 1) ? 0 : 1), '#fff4a0');
    else { P.rect(o + 21, 9, 4, 4, '#fff4a0'); P.px(o + 20, 11, '#ffffff'); P.px(o + 25, 8, '#ffffff'); P.px(o + 22, 14, '#ffffff'); }
    P.rect(o + 1, 1, 12, 2, '#1a1a22'); P.rect(o + 1, 1, sh ? 9 : 10, 2, '#e8473a'); P.rect(o + 21, 1, 12, 2, '#1a1a22'); P.rect(o + 21, 1, sh ? 5 : 8, 2, '#4a8ad8');
  });
  // nature documentary: the bay at golden hour, a little blue critter leaping a wave
  for (const [i, sh] of [[7, 0], [8, 1]]) fr(i, (o) => {
    P.rect(o, 0, TVW, TVH, '#f0a86a'); P.dither(o, 0, TVW, 9, '#f8d090', (x, y) => y / 10);
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 9) P.px(o + 25 + x, 7 + y, '#fff0b0');
    P.rect(o, 10, TVW, 9, '#3a7ab0'); P.dither(o, 10, TVW, 9, '#2a5a90', (x, y) => (y - 10) / 12);
    for (let x = 0; x < TVW; x += 5) P.hline(o + x + (sh ? 2 : 0), 12 + (x % 3), 3, '#8ac0e8');
    const jy = sh ? 5 : 9; P.rect(o + 11, jy, 5, 4, '#4ab0d8'); P.px(o + 15, jy + 1, '#1a1a22'); P.rect(o + 10, jy + 1, 1, 2, '#3a90b8'); P.rect(o + 12, jy + 4, 1, 1, '#3a90b8');
    if (sh) { P.px(o + 10, 9, '#e8f4ff'); P.px(o + 17, 8, '#e8f4ff'); P.px(o + 13, 10, '#ffffff'); }
    P.rect(o, 16, TVW, 3, '#1a1a22'); px3(P, 'WILD', o + 1, 14, '#f8e8c8', '#1a1a22');
  });
}), 9));
/** PC monitor: 0 = a desktop with windows, 1 = same with the cursor blink and a mail badge */
export const pcAtlas = () => glow(atlas(ptex('sr_pcA', 40 / 32, 13 / 32, (g, W, H, r, P) => {
  for (let i = 0; i < 2; i++) {
    const o = i * 20;
    P.rect(o, 0, 20, 13, '#3a7ab8'); P.dither(o, 0, 20, 13, '#5a9ad8', (x, y) => 0.5 - y / 26);
    P.rect(o + 2, 2, 11, 8, '#f4f0e8'); P.rect(o + 2, 2, 11, 2, '#e8705a'); P.px(o + 11, 2, '#ffffff');
    for (let y = 5; y < 9; y += 2) P.hline(o + 3, y, 6 + ((y + i) % 3), '#8a8aa0');
    P.rect(o + 14, 3, 4, 3, '#f8d84a'); P.rect(o + 14, 7, 4, 3, '#6ab06a');
    P.rect(o, 11, 20, 2, '#1e2a3a'); P.px(o + 1, 11, '#e8473a');
    if (i) { P.rect(o + 9, 6, 1, 3, '#1a1a22'); P.rect(o + 16, 0, 3, 3, '#e8473a'); P.px(o + 17, 1, '#ffffff'); }
  }
}), 2));
/** bedroom TV: a little platformer on the console (two frames) */
export const gameAtlas = () => glow(atlas(ptex('sr_gameA', 48 / 32, 15 / 32, (g, W, H, r, P) => {
  for (let i = 0; i < 2; i++) {
    const o = i * 24;
    P.rect(o, 0, 24, 15, '#6ab8f0'); P.rect(o + 3, 2, 5, 2, '#ffffff'); P.rect(o + 15, 3, 4, 2, '#ffffff');
    P.rect(o, 12, 24, 3, '#5ab04a'); P.hline(o, 12, 24, '#8ad86a'); for (let x = 1; x < 24; x += 4) P.px(o + x, 14, '#3a8a3a');
    P.rect(o + 10, 9, 4, 3, '#c8783a'); P.hline(o + 10, 9, 4, '#e8a05a'); P.rect(o + 18, 6, 3, 2, '#c8783a');
    const hy = i ? 4 : 9; P.rect(o + 5, hy, 2, 3, '#e8473a'); P.px(o + 5, hy - 1, '#f8c840'); P.px(o + 6, hy - 1, '#f8c840');
    P.rect(o + (i ? 19 : 11), i ? 4 : 7, 1, 2, '#f8d84a');
    P.rect(o + 1, 1, 6, 1, '#1a1a22');
  }
}), 2));

// ---------------------------------------------------------------- pictures: posters, photos, paintings (no people)
const posterBase = (P, W, H, bg, edge = '#f4f0e8') => { P.fill(edge); P.rect(1, 1, W - 2, H - 2, bg); };
export const poster = (kind) => ptex('sr_post' + kind, 0.7, 0.95, (g, W, H, r, P) => {
  if (kind === 'chick') {           // a fiery red chick Tokonmon on sunburst orange
    posterBase(P, W, H, '#f0903a');
    for (let a = 0; a < 16; a++) { const ang = a / 16 * Math.PI * 2; for (let t = 4; t < 20; t++) if (a & 1) P.px(W / 2 + Math.cos(ang) * t, 13 + Math.sin(ang) * t, '#f8b050'); }
    for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y * 1.1 <= 36) P.px(W / 2 + x, 14 + y, y > 3 ? '#c83a32' : '#e8473a');
    P.rect(W / 2 - 3, 5, 2, 3, '#f8c840'); P.rect(W / 2, 4, 2, 4, '#f8d84a'); P.rect(W / 2 + 2, 6, 1, 2, '#f8c840');
    P.rect(W / 2 - 3, 12, 2, 2, '#1a1a22'); P.rect(W / 2 + 2, 12, 2, 2, '#1a1a22'); P.px(W / 2 - 3, 12, '#ffffff'); P.px(W / 2 + 2, 12, '#ffffff');
    P.rect(W / 2 - 1, 15, 3, 2, '#f8a030'); P.rect(W / 2 - 4, 21, 2, 2, '#f8a030'); P.rect(W / 2 + 3, 21, 2, 2, '#f8a030');
    P.rect(1, H - 8, W - 2, 7, '#2a1a22'); px3(P, 'HOT!', Math.round((W - px3w('HOT!')) / 2), H - 7, '#f8d84a');
  } else if (kind === 'league') {   // League poster: a gold cup under stars
    posterBase(P, W, H, '#24305a');
    P.speck(30, '#8a9ad8', r, 1, 1, W - 2, H - 2); for (let i = 0; i < 6; i++) { const x = 3 + Math.floor(r() * (W - 6)), y = 9 + Math.floor(r() * 8); P.px(x, y, '#ffffff'); P.px(x - 1, y, '#c8d0f0'); P.px(x + 1, y, '#c8d0f0'); }
    P.rect(1, 1, W - 2, 7, '#e8b040'); px3(P, 'LEAGUE', 1 + Math.round((W - 2 - px3w('LEAGUE')) / 2), 2, '#24305a');
    const cx = Math.floor(W / 2); P.rect(cx - 5, 12, 11, 6, '#f8c840'); P.rect(cx - 4, 18, 9, 1, '#e8a830'); P.rect(cx - 7, 13, 2, 3, '#f8c840'); P.rect(cx + 6, 13, 2, 3, '#f8c840');
    P.rect(cx - 1, 19, 3, 3, '#e8a830'); P.rect(cx - 3, 22, 7, 2, '#c88a28'); P.vline(cx - 3, 12, 6, '#fff4b0'); P.px(cx, 15, '#e8473a');
    P.rect(1, H - 6, W - 2, 5, '#e8473a'); px3(P, 'SF', Math.round((W - 7) / 2), H - 6, '#ffffff');
  } else if (kind === 'band') {     // "The Foghorns" gig poster: a lighthouse in pink fog
    posterBase(P, W, H, '#3a2a4a');
    P.dither(1, 10, W - 2, H - 18, '#e890b0', (x, y) => (y - 10) / (H - 10) * 0.9);
    P.rect(W / 2 - 2, 11, 4, 12, '#f4f0e8'); for (let y = 13; y < 23; y += 3) P.hline(W / 2 - 2, y, 4, '#e8473a'); P.rect(W / 2 - 3, 9, 6, 2, '#2a2a32'); P.rect(W / 2 - 1, 8, 2, 1, '#f8e070');
    for (let x = 0; x < 9; x++) { P.px(W / 2 - 4 - x, 9 + x * 0.3, '#f8e070'); P.px(W / 2 + 3 + x, 9 + x * 0.3, '#f8e070'); }
    px3(P, 'FOG', Math.round((W - px3w('FOG')) / 2), 2, '#f8e070'); P.rect(1, H - 8, W - 2, 7, '#1a1a22'); px3(P, 'HORNS', Math.round((W - px3w('HORNS')) / 2), H - 7, '#e890b0');
  } else if (kind === 'map') {      // a hand-drawn Tokon map of the Bay
    posterBase(P, W, H, '#e8dcb8', '#8a6a3a');
    P.rect(1, 1, W - 2, 9, '#5a9ad8'); P.dither(1, 1, W - 2, 9, '#7ab8e8', 0.3);
    for (let x = 1; x < W - 1; x++) P.rect(x, 9 + Math.round(Math.sin(x * 0.7) * 1.2), 1, 2, '#c8b890');
    for (let y = 13; y < H - 3; y += 5) P.hline(2, y, W - 4, '#c8b890'); for (let x = 5; x < W - 2; x += 6) P.vline(x, 11, H - 14, '#c8b890');
    P.rect(4, 14, 5, 4, '#7ab060'); P.rect(14, 19, 4, 3, '#e8473a'); P.rect(9, 24, 3, 3, '#f8c840');
    for (const [x, y] of [[6, 16], [16, 20], [10, 25], [17, 27]]) { P.px(x, y, '#e8473a'); P.px(x, y - 1, '#e8473a'); }
    for (let i = 0; i < 9; i++) P.px(6 + i, 16 + i, i & 1 ? '#8a3a2a' : '#e8dcb8');
  } else if (kind === 'space') {    // a ringed planet and a comet
    posterBase(P, W, H, '#141a34');
    P.speck(40, '#ffffff', r, 1, 1, W - 2, H - 2); P.speck(20, '#8a9ad8', r, 1, 1, W - 2, H - 2);
    for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) if (x * x + y * y <= 49) P.px(W / 2 + x, H / 2 + y, (y + 9) % 4 < 2 ? '#e8a05a' : '#d8784a');
    for (let x = -11; x <= 11; x++) { const y = Math.round(x * 0.3); if (Math.abs(x) > 5 || y > 1) P.px(W / 2 + x, H / 2 + y + 1, '#f8e0b0'); }
    for (let i = 0; i < 6; i++) P.px(4 + i, 4 + i, i < 2 ? '#ffffff' : '#8ac0f8');
  } else if (kind === 'surf') {     // a wave and a sunset, for Mom's study wall
    posterBase(P, W, H, '#f0a86a', '#f8f0e0');
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 16) P.px(W / 2 + x, 11 + y, '#fff0b0');
    P.rect(1, 14, W - 2, H - 15, '#3a7ab0');
    for (let x = 1; x < W - 1; x++) { const h = Math.round(4 + Math.sin(x * 0.35) * 3); P.rect(x, 14 + 8 - h, 1, h, '#5aa0d0'); P.px(x, 14 + 8 - h, '#e8f4ff'); }
  }
});
export const kidPoster = (i) => ptex('sr_kpost' + i, 0.5, 0.6, (g, W, H, r, P) => {
  const bgs = ['#f8d84a', '#7ac0e8', '#f090b0', '#8ad06a', '#c8a0e8', '#f8a050'], bodies = ['#e8473a', '#4a8ad8', '#6ab04a', '#f8a030', '#8a5ad8', '#3aa8a0'];
  const bg = bgs[i % 6], b = bodies[(i * 5 + 1) % 6];
  posterBase(P, W, H, bg);
  P.dither(1, 1, W - 2, H - 2, lt(bg, 0.25), (x, y) => ((x + y) % 6 < 2 ? 0.6 : 0));
  const cx = W / 2, cy = H / 2 + 1, kind = i % 4;
  for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) if (x * x + y * y <= 25) P.px(cx + x, cy + y, y > 2 ? dk(b, 0.2) : b);
  if (kind === 0) { P.rect(cx - 5, cy - 7, 2, 3, b); P.rect(cx + 3, cy - 7, 2, 3, b); }
  if (kind === 1) { P.rect(cx - 1, cy - 8, 2, 3, '#f8d84a'); P.rect(cx - 7, cy, 2, 2, b); P.rect(cx + 5, cy, 2, 2, b); }
  if (kind === 2) { for (let x = -6; x <= 6; x += 3) P.px(cx + x, cy - 6, dk(b, 0.3)); }
  if (kind === 3) { P.rect(cx - 7, cy - 3, 2, 5, lt(b, 0.2)); P.rect(cx + 5, cy - 3, 2, 5, lt(b, 0.2)); }
  P.rect(cx - 3, cy - 1, 2, 2, '#1a1a22'); P.rect(cx + 1, cy - 1, 2, 2, '#1a1a22'); P.px(cx - 3, cy - 1, '#ffffff'); P.px(cx + 1, cy - 1, '#ffffff');
  P.rect(cx - 1, cy + 2, 2, 1, dk(b, 0.4));
  P.rect(1, H - 5, W - 2, 4, '#1a1a22'); for (let x = 3; x < W - 3; x += 2) P.px(x, H - 3, '#f4f0e8');
});
/** framed photo or painting: kinds beach | house | boat | chick | bridge | garden | fog | baby (a hatching egg) */
export const photo = (kind, frame = '#6a4428', wM = 0.32, hM = 0.26) => ptex('sr_photo' + kind + frame + wM + hM, wM, hM, (g, W, H, r, P) => {
  P.fill(frame); P.rect(0, 0, W, 1, lt(frame, 0.3)); P.rect(1, 1, W - 2, H - 2, '#f4f0e8');
  const x0 = 2, y0 = 2, w = W - 4, h = H - 4, R = (x, y, ww, hh, c) => P.rect(x0 + x, y0 + y, ww, hh, c);
  if (kind === 'beach') { R(0, 0, w, h, '#8ac8f0'); R(0, Math.floor(h * 0.45), w, 2, '#3a7ab0'); R(0, Math.floor(h * 0.6), w, h, '#f0d8a0'); R(w - 3, 1, 2, 2, '#fff0a0'); R(2, Math.floor(h * 0.55), 1, 3, '#a05a3a'); R(1, Math.floor(h * 0.5), 3, 1, '#e8473a'); }
  else if (kind === 'house') { R(0, 0, w, h, '#a8d0f0'); R(1, 3, w - 2, h - 3, '#9cc4b4'); R(Math.floor(w / 2) - 1, h - 3, 2, 3, '#b04a64'); R(2, 4, 2, 2, '#f4f0e8'); R(w - 4, 4, 2, 2, '#f4f0e8'); R(0, 1, w, 2, '#5a4a6a'); }
  else if (kind === 'boat') { R(0, 0, w, h, '#b8d8f0'); R(0, Math.floor(h * 0.6), w, h, '#3a6ab0'); R(2, Math.floor(h * 0.45), w - 4, 2, '#f4f0e8'); R(3, Math.floor(h * 0.55), w - 6, 1, '#e8473a'); R(Math.floor(w / 2), 1, 1, Math.floor(h * 0.45), '#6a4428'); }
  else if (kind === 'chick') { R(0, 0, w, h, '#f8e0a0'); R(Math.floor(w / 2) - 2, 2, 5, 4, '#e8473a'); R(Math.floor(w / 2) - 1, 1, 2, 1, '#f8c840'); R(Math.floor(w / 2) + 1, 3, 1, 1, '#1a1a22'); R(Math.floor(w / 2) + 3, 4, 1, 1, '#f8a030'); }
  else if (kind === 'bridge') { R(0, 0, w, h, '#f0b080'); R(0, Math.floor(h * 0.65), w, h, '#3a6a9a'); R(2, 1, 1, h - 2, '#c8402a'); R(w - 3, 1, 1, h - 2, '#c8402a'); R(0, Math.floor(h * 0.55), w, 1, '#c8402a'); for (let x = 2; x < w - 2; x++) P.px(x0 + x, y0 + 1 + Math.round(((x - w / 2) / (w / 2)) ** 2 * 3), '#a8302a'); }
  else if (kind === 'garden') { R(0, 0, w, h, '#a8d8a0'); for (let i = 0; i < 8; i++) R(Math.floor(r() * w), 2 + Math.floor(r() * (h - 3)), 1, 1, ['#f06a7a', '#f8d84a', '#ffffff'][i % 3]); R(0, h - 2, w, 2, '#5a9a4a'); }
  else if (kind === 'fog') { R(0, 0, w, h, '#c8d0e0'); P.dither(x0, y0, w, h, '#f4f4f8', (x, y) => 0.6 - (y - y0) / h * 0.5); R(1, h - 3, 2, 3, '#5a4a6a'); R(4, h - 4, 2, 4, '#7a6a8a'); R(7, h - 2, 3, 2, '#5a4a6a'); }
  else if (kind === 'baby') { R(0, 0, w, h, '#f8d8e0'); for (let y = -3; y <= 3; y++) for (let x = -2; x <= 2; x++) if (x * x / 4 + y * y / 9 <= 1) P.px(x0 + w / 2 + x, y0 + h / 2 + y, '#fff8e8'); P.px(x0 + w / 2 - 1, y0 + h / 2 - 1, '#c8a080'); P.px(x0 + w / 2, y0 + h / 2, '#c8a080'); }
});
export const painting = () => ptex('sr_paintg', 1.0, 0.6, (g, W, H, r, P) => {   // a hilly SF street at sunset, in a gold frame
  P.fill('#c8983a'); P.rect(0, 0, W, 1, '#f0d070'); P.rect(1, 1, W - 2, H - 2, '#f0a06a'); P.dither(1, 1, W - 2, 8, '#f8d090', (x, y) => 1 - y / 9);
  for (let x = 1; x < W - 1; x++) { const h = Math.round(6 + (x / W) * 7); P.rect(x, H - 1 - h, 1, h, '#7a8a6a'); }
  for (let k = 0; k < 6; k++) { const x = 3 + k * 5, h = 5 + (k % 3); P.rect(x, H - 6 - h - k, 4, h, ['#e8a0b0', '#f4d58d', '#a8c8e8', '#c8b4e0', '#b8d8a8', '#f2b880'][k]); P.rect(x, H - 7 - h - k, 4, 1, '#5a4a6a'); P.px(x + 1, H - 4 - h - k, '#f4f0e8'); }
  P.rect(1, H - 3, W - 2, 2, '#4a4a54');
});
export const calendar = (day = 1) => ptex('sr_cal' + (day % 31), 0.36, 0.5, (g, W, H, r, P) => {
  P.fill('#f8f4ec'); P.rect(0, 0, W, 6, '#e8705a'); P.rect(W / 2 - 1, 0, 2, 2, '#4a4a54');
  P.rect(1, 7, W - 2, 5, '#9cc4b4'); P.rect(4, 8, 3, 3, '#e8473a'); P.px(5, 7, '#f8c840');
  for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) P.rect(1 + col * 2, 13 + row, 1, 1, '#8a8a9a');
  const k = (day - 1) % 20, cx = 1 + (k % 5) * 2, cy = 13 + Math.floor(k / 5);
  P.px(cx, cy, '#e8473a'); P.px(cx - 1, cy, '#e8473a'); P.px(cx + 1, cy, '#e8473a'); P.px(cx, cy - 1, '#e8473a'); P.px(cx, cy + 1, '#e8473a');
});
export const clockFace = () => ptex('sr_clock', 0.34, 0.34, (g, W, H, r, P) => {
  const c = (W - 1) / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - c, y - c); if (d <= c + 0.3) P.px(x, y, d > c - 1.2 ? '#6a4428' : '#f8f4ea'); }
  for (let a = 0; a < 12; a++) P.px(c + Math.cos(a * Math.PI / 6) * (c - 2.2), c + Math.sin(a * Math.PI / 6) * (c - 2.2), '#4a4a54');
  for (let t = 0; t < 3.5; t += 0.5) P.px(c, c - t, '#1a1a22'); for (let t = 0; t < 2.6; t += 0.5) P.px(c + t, c + t * 0.3, '#1a1a22'); P.px(c, c, '#e8473a');
}, { ppm: 32 });
export const corkboard = () => ptex('sr_cork', 0.9, 0.6, (g, W, H, r, P) => {
  P.fill('#6a4428'); P.rect(1, 1, W - 2, H - 2, '#c89a5a'); P.speck(80, '#a87a42', r, 1, 1, W - 2, H - 2);
  const cards = [['#f4f0e8', '#3a7ab0'], ['#f8e0a0', '#e8705a'], ['#e0f0e8', '#5a9a4a'], ['#f4f0e8', '#c8402a'], ['#f8d8e0', '#8a5ad8']];
  cards.forEach(([a, b], i) => { const x = 2 + (i % 3) * 9, y = 2 + Math.floor(i / 3) * 9; P.rect(x, y, 7, 6, a); P.rect(x + 1, y + 1, 5, 3, b); P.px(x + 3, y, '#e8473a'); P.hline(x + 1, y + 5, 4, '#8a8a9a'); });
  for (let i = 0; i < 6; i++) P.px(3 + i * 4, H - 3, '#3a3a44');
});

// ---------------------------------------------------------------- shelves & furniture fronts (fitted)
export const books = (wM, hM, seed0 = 1, o = {}) => { const seed = seed0 % 2; return booksTex(wM, hM, seed, o); };
const booksTex = (wM, hM, seed, o) => ptex('sr_books' + wM + hM + seed + (o.toys ? 't' : ''), wM, hM, (g, W, H, r, P) => {
  P.fill(o.back || '#3a2a22');
  const pal = o.pal || ['#c8402a', '#2e5a8a', '#e8b040', '#3a7a4a', '#7a3a6a', '#e8e0c8', '#2a2a32', '#d87a3a', '#5aa0b0', '#a83a5a'];
  let x = 0;
  while (x < W) {
    if (o.toys && r() < 0.12 && x < W - 6) { const c = ['#e8473a', '#4a8ad8', '#f8c840', '#6ab04a'][Math.floor(r() * 4)], h = 4 + Math.floor(r() * 3); P.rect(x + 1, H - h, 4, h, c); P.px(x + 2, H - h + 1, '#1a1a22'); P.px(x + 3, H - h + 1, '#1a1a22'); x += 6; continue; }
    if (r() < 0.06 && x < W - 4) { x += 2 + Math.floor(r() * 3); continue; }
    const w = 2 + Math.floor(r() * 3), h = Math.max(3, Math.floor(H * (0.62 + r() * 0.36))), c = pal[Math.floor(r() * pal.length)];
    P.rect(x, H - h, w, h, c); P.vline(x, H - h, h, lt(c, 0.18)); P.vline(x + w - 1, H - h, h, dk(c, 0.25));
    if (h > 5) { P.hline(x, H - h + 1, w, r() < 0.5 ? '#f0d070' : lt(c, 0.4)); if (r() < 0.6) P.hline(x, H - 2, w, dk(c, 0.3)); }
    x += w;
  }
});
export const cabFront = (wM, hM, col, o = {}) => ptex('sr_cab' + wM + hM + col + (o.drawer ? 'd' : '') + (o.n || 0) + (o.knob || ''), wM, hM, (g, W, H, r, P) => {
  P.fill(dk(col, 0.25));
  const n = o.n || Math.max(1, Math.round(wM / 0.5)), dw = Math.floor(W / n), top = o.drawer ? 6 : 0;
  if (o.drawer) for (let i = 0; i < n; i++) { P.block(i * dw + 1, 1, dw - 1, top - 1, col, { hk: 0.15, lk: 0.25 }); P.rect(i * dw + dw / 2 - 2, 3, 4, 1, o.knob || '#c8a050'); }
  for (let i = 0; i < n; i++) {
    const x = i * dw + 1, y = top + 1, w = dw - 1, h = H - top - 2;
    P.block(x, y, w, h, col, { hk: 0.15, lk: 0.25 });
    if (h > 8 && w > 6) { P.rect(x + 2, y + 2, w - 4, h - 4, lt(col, 0.05)); P.hline(x + 2, y + 2, w - 4, dk(col, 0.12)); P.vline(x + 2, y + 2, h - 4, dk(col, 0.12)); }
    const kx = i % 2 ? x + 2 : x + w - 3; P.rect(kx, y + (o.up ? h - 4 : 2), 1, 3, o.knob || '#c8a050');
  }
});
export const wardrobeFront = (col = '#e8dcc8') => ptex('sr_ward' + col, 1.2, 2.0, (g, W, H, r, P) => {
  P.fill(dk(col, 0.3));
  for (const x of [1, W / 2 + 1]) { P.block(x, 1, W / 2 - 2, H - 10, col, { hk: 0.12, lk: 0.25 }); for (const [y, h] of [[4, 22], [30, 26]]) { P.rect(x + 3, y, W / 2 - 8, h, lt(col, 0.04)); P.hline(x + 3, y, W / 2 - 8, dk(col, 0.15)); P.vline(x + 3, y, h, dk(col, 0.15)); } }
  P.rect(W / 2 - 3, 26, 1, 6, '#c8a050'); P.rect(W / 2 + 3, 26, 1, 6, '#c8a050');
  P.block(1, H - 9, W - 2, 8, col, { hk: 0.12, lk: 0.25 }); P.rect(W / 2 - 3, H - 6, 6, 1, '#c8a050');
  // a sticker of a little red chick and a star
  P.rect(W / 2 + 5, 12, 4, 3, '#e8473a'); P.px(W / 2 + 6, 11, '#f8c840'); P.px(W / 2 + 8, 13, '#1a1a22'); P.px(W / 2 - 8, 14, '#f8d84a'); P.px(W / 2 - 9, 15, '#f8d84a'); P.px(W / 2 - 7, 15, '#f8d84a'); P.px(W / 2 - 8, 16, '#f8d84a');
});
export const fridgeFront = (c = '#eef0ec') => ptex('sr_fridge' + c, 0.72, 1.84, (g, W, H, r, P) => {
  P.fill(c); P.vline(0, 0, H, lt(c, 0.3)); P.vline(W - 1, 0, H, dk(c, 0.2)); P.hline(0, 18, W, dk(c, 0.35)); P.hline(0, 19, W, lt(c, 0.3)); P.hline(0, H - 2, W, dk(c, 0.3));
  P.rect(W - 4, 6, 1, 9, '#a8b0b8'); P.rect(W - 4, 23, 1, 14, '#a8b0b8');
  P.rect(3, 23, 9, 8, '#ffffff'); P.rect(4, 24, 7, 6, '#f8f4ea'); P.rect(5, 26, 3, 3, '#e8473a'); P.px(6, 25, '#f8c840'); P.rect(8, 28, 2, 1, '#6ab04a'); P.px(7, 22, '#4a8ad8');
  P.rect(13, 33, 6, 7, '#f8e8a0'); for (let y = 35; y < 40; y += 2) P.hline(14, y, 4, '#8a8aa0'); P.px(15, 32, '#e8473a');
  for (const [x, y, k] of [[4, 6, '#e8705a'], [9, 9, '#5aa0d8'], [14, 5, '#f8c840'], [5, 42, '#6ab04a'], [10, 46, '#c87ad8']]) { P.rect(x, y, 2, 2, k); P.px(x, y, lt(k, 0.3)); }
});
export const stoveFront = () => ptex('sr_stove', 0.7, 0.88, (g, W, H, r, P) => {
  P.fill('#e8e8e4'); P.rect(0, 0, W, 5, '#3a3a44'); for (let i = 0; i < 4; i++) { const x = 3 + i * 5; P.rect(x, 1, 3, 3, '#c8ccd4'); P.px(x + 1, 1, '#1a1a22'); } P.rect(W - 4, 1, 3, 2, '#5af06a');
  P.rect(2, 8, W - 4, 2, '#c8ccd4'); P.rect(2, 12, W - 4, H - 16, '#2a2a32'); P.rect(4, 14, W - 8, H - 20, '#3a3238'); P.dither(4, 14, W - 8, H - 20, '#e8903a', (x, y) => (y - 14) / (H - 20) * 0.4);
  P.rect(5, H - 9, W - 10, 1, '#5a5058'); P.hline(0, H - 2, W, '#a8aca8');
});
export const stoveTop = () => ptex('sr_stoveT', 0.7, 0.6, (g, W, H, r, P) => {
  P.fill('#2a2a32'); P.speck(30, '#3a3a44', r);
  for (const [cx, cy, rr] of [[6, 5, 4], [16, 5, 3], [6, 14, 3], [16, 14, 4]]) for (let y = -rr; y <= rr; y++) for (let x = -rr; x <= rr; x++) { const d = Math.hypot(x, y); if (d <= rr && d > rr - 1.2) P.px(cx + x, cy + y, '#6a6a74'); else if (d <= rr - 2 && d > rr - 3) P.px(cx + x, cy + y, '#4a4a54'); }
});
export const sinkTop = (c = '#e8e2d6') => ptex('sr_sink' + c, 0.8, 0.6, (g, W, H, r, P) => {
  P.fill(c); P.speck(40, dk(c, 0.12), r); P.rect(4, 4, W - 8, H - 7, '#a8b0b8'); P.rect(5, 5, W - 10, H - 9, '#c8d0d8'); P.rect(6, 6, W - 12, H - 11, '#b8c0c8'); P.px(W / 2, H / 2, '#4a4a54'); P.hline(5, 5, W - 10, '#e8eef4');
});
export const basinTop = () => ptex('sr_basin', 0.6, 0.45, (g, W, H, r, P) => { P.fill('#f4f4f0'); for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) if (((x - W / 2) / (W / 2 - 2)) ** 2 + ((y - H / 2) / (H / 2 - 2)) ** 2 < 1) P.px(x, y, '#dce4ec'); P.px(W / 2, H / 2, '#7a8a9a'); });
export const tubTop = () => ptex('sr_tub', 1.7, 0.75, (g, W, H, r, P) => {
  P.fill('#f4f4f0'); P.rect(3, 3, W - 6, H - 6, '#d0dce8'); P.rect(4, 4, W - 8, H - 8, '#8ac0e0'); P.dither(4, 4, W - 8, H - 8, '#c8e8f8', (x, y) => ((x * 3 + y) % 11 < 2 ? 0.9 : 0.05));
  for (let i = 0; i < 12; i++) { const x = 6 + Math.floor(r() * (W - 14)), y = 5 + Math.floor(r() * (H - 10)); P.px(x, y, '#ffffff'); P.px(x + 1, y, '#f4f8fc'); }
});
export const mirror = (w = 0.55, h = 0.7) => ptex('sr_mirror' + w + h, w, h, (g, W, H, r, P) => {
  P.fill('#c8a050'); P.rect(0, 0, W, 1, '#f0d070'); P.rect(1, 1, W - 2, H - 2, '#a8c0d0'); P.dither(1, 1, W - 2, H - 2, '#e0f0f8', (x, y) => ((x + y) % 10 < 3 ? 0.7 : 0.1)); P.dither(1, H - 7, W - 2, 6, '#7a90a0', 0.3);
});
export const keyboardTop = () => ptex('sr_kbd', 0.45, 0.15, (g, W, H, r, P) => { P.fill('#3a3a44'); for (let y = 1; y < H - 1; y += 1) for (let x = 1; x < W - 1; x += 2) P.px(x, y, '#8a8a98'); P.hline(4, H - 2, W - 8, '#a8a8b8'); });
export const consoleTop = () => ptex('sr_cons', 0.36, 0.26, (g, W, H, r, P) => { P.fill('#f4f0ea'); P.rect(1, 1, W - 2, 3, '#e8473a'); P.rect(2, H - 3, 3, 1, '#5af06a'); P.rect(W - 5, H - 3, 3, 1, '#2a2a32'); P.hline(0, H / 2, W, '#d8d4cc'); });
export const capsule = (a = '#e8473a', b = '#f4f0ea') => ptex('sr_caps' + a + b, 0.12, 0.12, (g, W, H, r, P) => { P.rect(0, 0, W, H / 2, a); P.rect(0, H / 2, W, H / 2, b); P.hline(0, H / 2 - 0.5, W, '#2a2a32'); P.px(1, 1, '#ffffff'); }, { ppm: 32 });
export const radioFront = () => ptex('sr_radio', 0.4, 0.24, (g, W, H, r, P) => {
  P.fill('#e8b040'); P.rect(1, 1, 6, H - 2, '#8a5a3a'); for (let y = 2; y < H - 2; y += 2) P.hline(1, y, 6, '#6a4428');
  P.rect(8, 2, W - 10, 3, '#f4f0d8'); P.px(10, 3, '#e8473a'); P.rect(9, 6, 2, 1, '#6a4428'); P.rect(W - 4, 6, 2, 1, '#6a4428');
});
export const riceCooker = () => ptex('sr_rice', 0.3, 0.26, (g, W, H, r, P) => { P.fill('#f4f0ea'); P.rect(0, 0, W, 2, '#e8705a'); P.rect(2, 4, 4, 2, '#3a3a44'); P.px(3, 4, '#5af06a'); P.rect(0, H - 1, W, 1, '#c8c4bc'); });
export const noticeBoard = () => ptex('sr_notice', 0.8, 0.6, (g, W, H, r, P) => {
  P.fill('#6a4428'); P.rect(1, 1, W - 2, H - 2, '#c89a5a'); P.speck(60, '#a87a42', r, 1, 1, W - 2, H - 2);
  for (let i = 0; i < 6; i++) { const x = 2 + (i % 3) * 8, y = 2 + Math.floor(i / 3) * 9, c = ['#f8f4ea', '#f8e0a0', '#e0f0f8', '#f8d8e0'][i % 4]; P.rect(x, y, 7, 7, c); for (let k = y + 2; k < y + 6; k += 2) P.hline(x + 1, k, 5, '#8a8aa0'); P.px(x + 3, y, ['#e8473a', '#4a8ad8', '#6ab04a'][i % 3]); }
});
export const shopShelf = (wM, hM, seed = 1) => ptex('sr_sshelf' + wM + hM + seed, wM, hM, (g, W, H, r, P) => {
  P.fill('#e8e4dc');
  const rows = Math.max(2, Math.round(hM / 0.38)), rh = Math.floor(H / rows);
  const goods = ['#e8473a', '#f8c840', '#4a8ad8', '#6ab04a', '#f4f0ea', '#e890b0', '#f08a3a', '#8a5ad8', '#3aa8a0'];
  for (let k = 0; k < rows; k++) {
    const y1 = (k + 1) * rh - 2; let x = 1;
    while (x < W - 2) { const c = goods[Math.floor(r() * goods.length)], w = 2 + Math.floor(r() * 3), h = 3 + Math.floor(r() * (rh - 5)); const n = 1 + Math.floor(r() * 3); for (let i = 0; i < n && x < W - 2; i++) { P.rect(x, y1 - h, w, h, c); P.hline(x, y1 - h, w, lt(c, 0.25)); if (h > 4) P.hline(x, y1 - h + 2, w, '#f4f0ea'); x += w; } x += 1; }
    P.rect(0, y1, W, 2, '#a8a4a0'); P.hline(0, y1, W, '#d8d4d0'); for (let x2 = 3; x2 < W; x2 += 7) P.rect(x2, y1 + 1, 3, 1, '#f8e070');
  }
});
export const cooler = () => glow(ptex('sr_cooler', 1.6, 1.9, (g, W, H, r, P) => {
  P.fill('#3a3a44'); P.rect(0, 0, W, 5, '#2a2a32'); P.rect(2, 1, W - 4, 3, '#4ab0d8'); for (let x = 4; x < W - 4; x += 4) P.px(x, 2, '#e8f8ff');
  for (const x0 of [2, W / 2 + 1]) {
    P.rect(x0, 6, W / 2 - 3, H - 9, '#bfe4f4');
    for (let y = 9; y < H - 6; y += 9) { P.hline(x0, y + 6, W / 2 - 3, '#9ab0c0'); for (let x = x0 + 1; x < x0 + W / 2 - 4; x += 3) { const c = ['#e8473a', '#f8d84a', '#4a8ad8', '#6ab04a', '#f4f0ea', '#e85a8a'][Math.floor(r() * 6)]; P.rect(x, y, 2, 6, c); P.px(x, y, lt(c, 0.3)); } }
    P.vline(x0 + W / 2 - 5, 20, 12, '#d8dce0');
  }
}));
export const registerTop = () => ptex('sr_reg', 0.4, 0.3, (g, W, H, r, P) => { P.fill('#3a3a44'); for (let y = 2; y < H - 2; y += 2) for (let x = 2; x < W - 4; x += 2) P.px(x, y, '#c8c8d0'); P.rect(W - 4, 2, 3, 3, '#e8473a'); });
export const dexChart = () => ptex('sr_dex', 1.2, 0.8, (g, W, H, r, P) => {
  P.fill('#f4f0e0'); P.rect(0, 0, W, 4, '#e8473a'); px3(P, 'TOKON 150', 2, -1 + 1, '#f4f0e0');
  for (let row = 0; row < 4; row++) for (let col = 0; col < 7; col++) {
    const x = 2 + col * 5, y = 6 + row * 5, got = r() < 0.3;
    P.rect(x, y, 4, 4, got ? ['#e8473a', '#4a8ad8', '#6ab04a', '#f8c840', '#8a5ad8'][Math.floor(r() * 5)] : '#d8d4c8'); if (got) { P.px(x + 1, y + 1, '#1a1a22'); P.px(x + 3, y, '#f8d84a'); } else P.px(x + 1, y + 1, '#b8b4a8');
  }
});
export const shopSign = () => PX.signTex('CORNER MARKET', '#2e6a5a', '#f8e8b0', { w: 5.2, h: 0.75 });
export const libraryBox = () => ptex('sr_lfl', 0.6, 0.5, (g, W, H, r, P) => {
  P.fill('#c8402a'); P.rect(2, 2, W - 4, H - 4, '#a8d0e8'); P.rect(3, 9, W - 6, 1, '#6a4428'); P.dither(2, 2, W - 4, H - 4, '#e8f4ff', (x, y) => ((x + y) % 7 < 2 ? 0.6 : 0));
  let x = 3; while (x < W - 4) { const w = 1 + Math.floor(r() * 2), h = 4 + Math.floor(r() * 3), c = ['#e8b040', '#2e5a8a', '#3a7a4a', '#7a3a6a', '#f4f0e8'][Math.floor(r() * 5)]; P.rect(x, 9 - h, w, h, c); x += w; }
  P.rect(W / 2 - 1, H - 5, 2, 2, '#f8d84a');
});
export const sandbox = () => ptex('sr_sand', 1, 1, (g, W, H, r, P) => { P.fill('#e8d4a0'); P.speck(200, '#d8c088', r); P.speck(80, '#f4e4b8', r); });
export const welcomeMat = () => ptex('sr_mat', 1.0, 0.6, (g, W, H, r, P) => { P.fill('#8a5a3a'); P.rect(1, 1, W - 2, H - 2, '#b07a4a'); P.speck(80, '#9a6a3a', r); px3(P, 'HELLO', Math.round((W - px3w('HELLO')) / 2), Math.round(H / 2) - 3, '#5a3a22'); });
export const bathMat = () => ptex('sr_bmat', 0.8, 0.5, (g, W, H, r, P) => { P.fill('#9cc4b4'); for (let y = 1; y < H; y += 2) for (let x = (y >> 1) & 1; x < W; x += 2) P.px(x, y, '#b8dccc'); P.rect(0, 0, W, 1, '#f4f0e8'); P.rect(0, H - 1, W, 1, '#f4f0e8'); });
export const crt = () => ptex('sr_crt', 1, 1, (g, W, H, r, P) => { P.fill('#3a3a44'); P.speck(40, '#4a4a54', r); });
export const towel = (c = '#e8705a') => ptex('sr_towel' + c, 0.5, 0.6, (g, W, H, r, P) => { P.fill(c); P.rect(0, H - 4, W, 2, '#f4f0e8'); P.rect(0, 3, W, 1, '#f4f0e8'); P.dither(0, 0, W, H, dk(c, 0.1), 0.3); });
export const lampShade = (c = '#f8e8c0') => glow(ptex('sr_shade' + c, 1, 1, (g, W, H, r, P) => { P.fill(c); for (let x = 0; x < W; x += 4) P.vline(x, 0, H, dk(c, 0.08)); }, { ppm: 16 }));
export const lampShadeOff = (c = '#e8dcc0') => ptex('sr_shadeOff' + c, 1, 1, (g, W, H, r, P) => { P.fill(dk(c, 0.1)); for (let x = 0; x < W; x += 4) P.vline(x, 0, H, dk(c, 0.2)); }, { ppm: 16 });
export const plainGlow = (c) => glow(ptex('sr_glow' + c, 1, 1, (g, W, H, r, P) => { P.fill(c); }, { ppm: 8 }));
export const leaves = (c = '#4a8a42') => ptex('sr_leaf' + c, 1, 1, (g, W, H, r, P) => {
  P.fill(c); for (let i = 0; i < 90; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * H), k = r(); P.rect(x, y, 2, 1, k < 0.4 ? lt(c, 0.2) : k < 0.7 ? dk(c, 0.2) : lt(c, 0.35)); }
});
export const terracotta = () => ptex('sr_terra', 1, 1, (g, W, H, r, P) => { P.fill('#c8704a'); P.hline(0, 0, W, '#e8905a'); for (let y = 4; y < H; y += 8) P.hline(0, y, W, '#a85a3a'); P.speck(30, '#b0603a', r); });
export const picket = (c = '#f6f0e2') => ptex('sr_picket' + c, 1, 1, (g, W, H, r, P) => { P.fill(c); for (let x = 0; x < W; x += 5) P.vline(x, 0, H, dk(c, 0.15)); P.speck(16, dk(c, 0.1), r); });
export const garage = (c) => PX.garageTex(c);
export const bannerTex = (text, bg, fg, w = 2.4) => PX.signTex(text, bg, fg, { w, h: 0.5, fs: 0.7 });
