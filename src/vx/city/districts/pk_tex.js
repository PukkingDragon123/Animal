// Pixel-art textures for Alamo Hill Park: grassy terrace banks, stone steps, sand and rubber
// playground floors, the half-court, signboards, and the painted ladies' Victorian details
// (fish-scale shingles, tall sash windows with lintels, panelled doors, gingerbread trim).
import { TX } from '../build.js';
import { ptext, fitScale, signBoard, vgrad, disc, critter, emblem, dark, light } from './dt_pix.js';

const pt = TX.ptex;

// ---------------------------------------------------------------- terrain
/** the riser of a grass terrace: an overhanging lip of turf over earth and pebbles (one 0.3 m level) */
export const bankTex = (g = '#5a9a44') => pt('pk_bank' + g, 2, 0.3, (gg, W, H, r, P) => {
  P.fill('#8a6a46'); P.speck(140, '#7a5a3a', r); P.speck(60, '#a8845a', r); P.speck(14, '#9a9a92', r);
  P.rect(0, 0, W, 3, g); for (let x = 0; x < W; x++) { const d = r() < 0.4 ? 1 + Math.floor(r() * 3) : 0; if (d) P.vline(x, 3, d, dark(g, 0.15)); }
  P.hline(0, 0, W, light(g, 0.2)); P.hline(0, H - 1, W, '#6a4a2e');
});
/** a stone step riser (paths crossing terrace edges) */
export const stepTex = (c = '#d8d0c0') => pt('pk_step' + c, 2, 0.3, (g, W, H, r, P) => {
  P.fill(c); P.speck(60, dark(c, 0.1), r); P.hline(0, 0, W, light(c, 0.3)); P.hline(0, 1, W, light(c, 0.12)); P.rect(0, H - 2, W, 2, dark(c, 0.3));
  for (let x = 12; x < W; x += 20 + Math.floor(r() * 10)) P.vline(x, 2, H - 4, dark(c, 0.2));
});
export const stoneTex = (c = '#a8a094') => pt('pk_stone' + c, 2, 1, (g, W, H, r, P) => {
  P.fill(dark(c, 0.35));
  for (let y = 0; y < H; y += 8) for (let x = (y / 8) & 1 ? -6 : 0; x < W; x += 12) { const k = (r() - 0.5) * 0.2, cc = k > 0 ? light(c, k) : dark(c, -k); P.rect(x + 1, y + 1, 10, 6, cc); P.hline(x + 1, y + 1, 10, light(cc, 0.2)); }
});
export const sandTex = () => pt('pk_sand', 2, 2, (g, W, H, r, P) => { P.fill('#e8d4a0'); P.speck(700, '#f4e4b8', r); P.speck(700, '#d4bc88', r); P.speck(40, '#b8a070', r); for (let i = 0; i < 8; i++) { const x = r() * W, y = r() * H; P.hline(x, y, 6, '#d8c490'); } });
export const rubberTex = (c = '#e8604a') => pt('pk_rubber' + c, 2, 2, (g, W, H, r, P) => { P.fill(c); P.speck(900, light(c, 0.12), r); P.speck(900, dark(c, 0.12), r); });
export const soilTex = () => pt('pk_soil', 2, 2, (g, W, H, r, P) => { P.fill('#5a3e2a'); P.speck(500, '#6a4a32', r); P.speck(400, '#4a3222', r); P.speck(30, '#8a8a7a', r); });
export const mulchTex = () => pt('pk_mulch', 2, 2, (g, W, H, r, P) => { P.fill('#7a4a2a'); for (let i = 0; i < 500; i++) { const x = r() * W, y = r() * H; P.rect(x, y, 2 + Math.floor(r() * 3), 1, ['#8a5a32', '#6a3e22', '#9a6a3a'][i % 3]); } });
export const deckTex = () => TX.planks('#b88a5a', 'v');

// ---------------------------------------------------------------- the half-court (16 × 14 m, north = the hoop)
export const halfCourtTex = () => pt('pk_halfcourt', 16, 14, (g, W, H, r, P) => {
  const m = (v) => Math.round(v * 32), line = '#f4f0e4', base = '#3a8a5a', key = '#c84a3a';
  P.fill(base); P.speck(6000, light(base, 0.06), r); P.speck(6000, dark(base, 0.1), r);
  P.rect(0, 0, W, 6, line); P.rect(0, 0, 6, H, line); P.rect(W - 6, 0, 6, H, line); P.rect(0, H - 6, W, 6, line);
  const cx = W / 2; P.rect(cx - m(2.45), 0, m(4.9), m(5.8), key); P.rect(cx - m(2.45), 0, 5, m(5.8), line); P.rect(cx + m(2.45) - 5, 0, 5, m(5.8), line); P.rect(cx - m(2.45), m(5.8) - 5, m(4.9), 5, line);
  for (let a = 0; a < Math.PI; a += 0.004) { P.rect(cx + Math.cos(a) * m(1.8) - 2, m(5.8) + Math.sin(a) * m(1.8) - 2, 5, 5, line); P.rect(cx + Math.cos(a) * m(6.75) - 2, m(1.4) + Math.sin(a) * m(6.75) - 2, 5, 5, line); }
  for (let a = Math.PI; a < Math.PI * 2; a += 0.004) P.rect(cx + Math.cos(a) * m(1.8) - 2, H - 6 + Math.sin(a) * m(1.8) - 2, 5, 5, line);
  emblem(P, cx, H - m(1.2), m(0.9));
  ptext(P, 'ALAMO HILL', cx, m(10.4), '#f0c040', { s: 5 });
  for (let i = 0; i < 10; i++) { let x = r() * W, y = r() * H; for (let k = 0; k < 30; k++) { P.px(x, y, dark(base, 0.35)); x += r() < 0.5 ? 1 : -0.4; y += r() < 0.6 ? 1 : -1; } }
});

// ---------------------------------------------------------------- signs
export const parkSign = () => signBoard('alamo', 'ALAMO HILL PARK', 4.2, 1.0, { bg: '#2a5a3a', fg: '#f4ecd0', frame: '#6a4a2a', sub: 'EST. 1892', subCol: '#e8c860' });
export const mapBoard = () => pt('pk_map', 1.6, 1.0, (g, W, H, r, P) => {
  P.fill('#6a4a2a'); P.rect(2, 2, W - 4, H - 4, '#f4ecd0'); P.rect(2, 2, W - 4, 7, '#2a5a3a'); ptext(P, 'PARK MAP', W / 2, 5, '#f4ecd0', { font: 3, s: 1 });
  P.rect(5, 11, W - 10, H - 15, '#8ac870'); P.rect(18, 22, 14, 6, '#5ab0e0'); disc(P, 26, 16, 3, '#6aa058'); P.rect(25, 15, 2, 2, '#e8c860');
  P.rect(5, 11, 3, H - 15, '#c8b8a0'); P.rect(40, 12, 8, 6, '#3a8a5a'); P.rect(9, 12, 7, 6, '#e8d4a0'); P.rect(38, 22, 6, 6, '#c8a8d0');
  disc(P, 42, 27, 1, '#e8303a'); ptext(P, 'YOU', 45, 28, '#e8303a', { font: 3, s: 1, align: 'left' });
});
export const plaqueTex = (t1, t2) => signBoard('plq' + t1, t1, 1.2, 0.5, { bg: '#c8a050', fg: '#3a2a12', frame: '#8a6a2a', sub: t2, subCol: '#3a2a12', shadow: false });

// ---------------------------------------------------------------- painted ladies
/** fish-scale shingles for the gables */
export const fishScale = (c = '#e8a0b8') => pt('pk_fish' + c, 1, 1, (g, W, H, r, P) => {
  P.fill(dark(c, 0.3));
  for (let row = 0; row < H / 5 + 1; row++) for (let col = -1; col < W / 6 + 1; col++) {
    const x = col * 6 + (row & 1 ? 3 : 0), y = row * 5;
    for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 6; xx++) { const dx = xx - 2.5, dy = yy - 1; if (dx * dx + Math.max(0, dy) ** 2 * 2.2 <= 7.5) P.px(x + xx, y + yy, yy < 1 ? light(c, 0.2) : c); }
  }
});
/** a tall Victorian sash window with a moulded lintel (0.9 × 2.0 m) */
export const ladyWindow = (frame = '#f8f4ec', accent = '#2a6a6a', lit = false) => pt('pk_lwin' + frame + accent + lit, 0.9, 2.0, (g, W, H, r, P) => {
  P.fill(frame);
  // lintel / pediment
  P.rect(0, 0, W, 6, accent); P.rect(2, 6, W - 4, 2, light(frame, 0.2)); for (let x = 2; x < W - 2; x += 4) P.rect(x, 2, 2, 2, frame);
  const gx = 4, gy = 11, gw = W - 8, gh = H - 20, glass = lit ? '#ffd890' : '#3a5a78';
  P.rect(gx - 1, gy - 1, gw + 2, gh + 2, accent); P.rect(gx, gy, gw, gh, glass);
  if (!lit) P.dither(gx, gy, gw, gh, '#8ab0d0', (x, y) => Math.max(0, 0.75 - (y - gy) / gh * 1.2) + ((x + y) % 9 < 2 ? 0.4 : 0));
  else P.dither(gx, gy, gw, gh, '#fff0c0', 0.35);
  // lace curtains
  P.dither(gx, gy, 5, gh, '#f8f4ec', 0.7); P.dither(gx + gw - 5, gy, 5, gh, '#f8f4ec', 0.7);
  P.rect(gx, gy + Math.floor(gh / 2) - 1, gw, 2, frame); P.vline(gx + Math.floor(gw / 2), gy, gh, frame);
  // sill with brackets
  P.rect(0, H - 8, W, 3, light(frame, 0.15)); P.rect(3, H - 5, 3, 4, accent); P.rect(W - 6, H - 5, 3, 4, accent);
});
/** a panelled Victorian door with a transom (1.1 × 2.5 m) */
export const ladyDoor = (col = '#2a6a6a', frame = '#f8f4ec') => pt('pk_ldoor' + col + frame, 1.1, 2.5, (g, W, H, r, P) => {
  P.fill(frame); P.rect(3, 3, W - 6, 12, '#ffe0a0'); P.dither(3, 3, W - 6, 12, '#c8a060', 0.3); for (let x = 6; x < W - 6; x += 6) P.vline(x, 3, 12, frame);
  P.rect(3, 17, W - 6, H - 19, col);
  for (const [y, h] of [[21, 22], [47, 30]]) { P.block(7, y, 10, h, light(col, 0.08), { hk: 0.2, lk: 0.3 }); P.block(W - 17, y, 10, h, light(col, 0.08), { hk: 0.2, lk: 0.3 }); }
  P.rect(W - 11, 46, 3, 3, '#e8c060'); P.rect(W / 2 - 4, 30, 8, 3, '#e8c060');
});
/** gingerbread frieze: little arches and drops (a band under the eaves) */
export const friezeTex = (c = '#f8f4ec', bg = '#2a6a6a') => pt('pk_frieze' + c + bg, 1, 0.3, (g, W, H, r, P) => {
  P.fill(bg); for (let x = 0; x < W; x += 8) { for (let a = 0; a < 3.2; a += 0.15) P.px(x + 4 + Math.cos(a) * 3.5, 2 + Math.sin(a) * 4, c); P.rect(x, 0, 1, H, c); P.rect(x + 3, 7, 2, 2, c); }
  P.rect(0, 0, W, 1, c); P.rect(0, H - 1, W, 1, c);
});
export const houseNumber = (n, bg = '#f8f4ec', fg = '#2a2a34') => pt('pk_num' + n + bg + fg, 0.5, 0.25, (g, W, H, r, P) => { P.fill(bg); ptext(P, String(n), W / 2, H / 2, fg, { font: 3, s: 1 }); P.rect(0, 0, W, 1, fg); P.rect(0, H - 1, W, 1, fg); });

// ---------------------------------------------------------------- the bandstand
export const bandRoofTex = () => TX.roofTiles('#c84a3a');
export const bandFriezeTex = () => friezeTex('#f8f4ec', '#2a5a3a');
export { critter };
