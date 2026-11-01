// Murals: pixel-painted walls for blank façades (city/fill.js) and the skirt's blocks (render/skirt.js) — banded
// skies, square suns and stars, chunky round-eared Tokonmon and a bird-ish one in outlined blocks, lettering.
// Creatures, patterns and words only, never people; squares, never circles.
import * as TX from './pixtex.js';

// ---------------------------------------------------------------- murals (pixel painted; creatures, patterns and lettering only)
export const MURALS = 6;
const PALS = [['#2a3a6a', '#e86a4a', '#f4c050', '#4ab0a0', '#f4ece0'], ['#1e5a4a', '#f08a3a', '#f4e070', '#e85a8a', '#f8f0e0'], ['#5a2a5a', '#4ac0e0', '#f4d040', '#e85050', '#fff4e8'], ['#c84a3a', '#2a3a5a', '#f0c060', '#58b070', '#f6eee0'], ['#2a2a3a', '#f05a8a', '#5ad0c0', '#f8e060', '#f4f4f4'], ['#3a6a9a', '#f4a040', '#f8e8c0', '#c84a5a', '#2a2a3a']];
const WORDS = ['TOKON', 'SF BAY', 'GO WILD', 'BAY CITY', 'HELLO', 'DRIP'];
export function muralTex(v, w, h) {
  return TX.ptex('mural' + v + '_' + w + 'x' + h, w, h, (g, W, H, r, P) => {
    const [bg, a, b, c, lt] = PALS[v % PALS.length];
    // background: banded sky / stripes / checks, dithered at the seams
    for (let y = 0; y < H; y++) { const t = y / H, band = Math.floor(t * 5); P.rect(0, y, W, 1, band % 2 ? TX.light(bg, 0.08 + band * 0.04) : TX.dark(bg, 0.06 - band * 0.02)); }
    if (v % 3 === 1) for (let x = -H; x < W; x += 24) for (let y = 0; y < H; y++) P.rect(x + y, y, 8, 1, TX.dark(bg, 0.12));
    if (v % 3 === 2) for (let y = 0; y < H; y += 16) for (let x = (y / 16) % 2 ? 0 : 16; x < W; x += 32) P.rect(x, y, 16, 16, TX.light(bg, 0.06));
    // a sun of squares and a few stars (squares, never circles)
    for (let i = 0; i < 4; i++) { const s = 30 - i * 7, cx = W * 0.8, cy = H * 0.28; P.rect(cx - s / 2, cy - s / 2, s, s, i % 2 ? b : TX.light(b, 0.2)); }
    for (let i = 0; i < 18; i++) { const x = r() * W, y = r() * H * 0.5; P.rect(x, y, 2, 2, lt); P.rect(x - 2, y, 6, 1, lt); P.rect(x, y - 2, 1, 6, lt); }
    // the creature: a chunky round-eared Tokonmon in blocks (body, head, ears, eyes, cheeks, tail), outlined
    const k = Math.min(W / 120, H / 80), ox = W * 0.28, oy = H * 0.94;
    const blk = (x, y, ww, hh, col) => { P.rect(ox + (x - 1) * k, oy - (y + hh + 1) * k, (ww + 2) * k, (hh + 2) * k, '#1a1418'); };
    const fil = (x, y, ww, hh, col) => P.rect(ox + x * k, oy - (y + hh) * k, ww * k, hh * k, col);
    const parts = [[-22, 0, 44, 30], [-26, 26, 52, 36], [-24, 60, 10, 14], [14, 60, 10, 14], [20, 6, 22, 8], [-8, -4, 8, 6], [4, -4, 8, 6]];
    for (const p of parts) blk(...p);
    fil(-22, 0, 44, 30, a); fil(-26, 26, 52, 36, a); fil(-24, 60, 10, 14, a); fil(14, 60, 10, 14, a); fil(20, 6, 22, 8, TX.dark(a, 0.15)); fil(-8, -4, 8, 6, TX.dark(a, 0.3)); fil(4, -4, 8, 6, TX.dark(a, 0.3));
    fil(-22, 6, 44, 8, TX.light(a, 0.18)); fil(-26, 50, 52, 6, TX.light(a, 0.2)); fil(-21, 64, 4, 6, c); fil(17, 64, 4, 6, c);
    fil(-14, 36, 8, 10, '#1a1418'); fil(6, 36, 8, 10, '#1a1418'); fil(-12, 42, 3, 3, lt); fil(8, 42, 3, 3, lt);
    fil(-22, 32, 8, 4, TX.light(c, 0.3)); fil(14, 32, 8, 4, TX.light(c, 0.3)); fil(-4, 30, 8, 3, '#1a1418');
    // a second, smaller creature (a bird-ish Tokonmon) and the lettering
    const k2 = k * 0.55, o2x = W * 0.62, o2y = H * 0.9;
    for (const [x, y, ww, hh, col] of [[-12, 0, 24, 18, c], [-8, 16, 16, 14, c], [6, 22, 8, 4, b], [-16, 6, 6, 10, TX.dark(c, 0.2)], [10, 6, 6, 10, TX.dark(c, 0.2)]]) { P.rect(o2x + (x - 1) * k2, o2y - (y + hh + 1) * k2, (ww + 2) * k2, (hh + 2) * k2, '#1a1418'); P.rect(o2x + x * k2, o2y - (y + hh) * k2, ww * k2, hh * k2, col); }
    P.rect(o2x - 2 * k2, o2y - 26 * k2, 3 * k2, 3 * k2, '#1a1418');
    P.text(WORDS[v % WORDS.length], W * 0.62, H * 0.2, Math.max(10, Math.min(28, H * 0.22)), lt, { outline: '#1a1418', shadow: TX.dark(bg, 0.4) });
    // a painted border and weathering: chips, drips, a tag-free wall (no people)
    P.rect(0, 0, W, 2, '#1a1418'); P.rect(0, H - 2, W, 2, '#1a1418'); P.rect(0, 0, 2, H, '#1a1418'); P.rect(W - 2, 0, 2, H, '#1a1418');
    for (let i = 0; i < 12; i++) { const x = r() * W, y = r() * H * 0.6, L = 4 + r() * 10; P.rect(x, y, 1, L, TX.dark(bg, 0.2)); }
    P.speck(W * H * 0.004, TX.light(bg, 0.25), r); P.speck(W * H * 0.003, '#a8a49a', r);
  });
}
