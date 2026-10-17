// Procedural pixel-art textures (16 px per metre, nearest filtering):
//   • tile atlas  — ground tiles (grass, pavers, asphalt, water…) with variants
//   • facade atlas — 2 m × 3 m building bays (windows, shopfronts, doors, roofs)
//     plus a parallel emissive atlas (lit windows/neon at night)
//   • sign textures — neon signboards with Japanese + English text
// Everything is generated into RGBA arrays (works in Node without canvas);
// only text signs need a 2D canvas (browser).
import * as THREE from '../../vendor/three.module.js';
import { hash3, vnoise3 } from '../core/rng.js';

const PX = 16;
// ---------------------------------------------------------------- tiny painter
class Img {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h * 4); }
  set(x, y, c, a = 255) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.d[i] = (c >> 16) & 255; this.d[i + 1] = (c >> 8) & 255; this.d[i + 2] = c & 255; this.d[i + 3] = a;
  }
  get(x, y) { const i = (y * this.w + x) * 4; return (this.d[i] << 16) | (this.d[i + 1] << 8) | this.d[i + 2]; }
  rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c); }
}
const shade = (c, f) => {
  const r = Math.min(255, Math.max(0, Math.round(((c >> 16) & 255) * f))), g = Math.min(255, Math.max(0, Math.round(((c >> 8) & 255) * f))), b = Math.min(255, Math.max(0, Math.round((c & 255) * f)));
  return (r << 16) | (g << 8) | b;
};
const mix = (a, b, t) => {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255, br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
};
const H = (x, y, s) => hash3(x, y, s * 131 + 7);

// ---------------------------------------------------------------- tile painters (16×16)
// each painter: (img, ox, oy, variant) paints a 16×16 cell
const T = {};
function noiseFill(img, ox, oy, v, base, amp = 0.08, seed = 1) {
  for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) img.set(ox + x, oy + y, shade(base, 1 + (H(x + v * 17, y, seed) - 0.5) * 2 * amp));
}
T.grass = (img, ox, oy, v) => {
  const base = [0x6cbf4f, 0x67b94b, 0x72c454][v % 3];
  noiseFill(img, ox, oy, v, base, 0.06, 3);
  for (let i = 0; i < 9; i++) { const x = Math.floor(H(i, v, 11) * 16), y = Math.floor(H(i, v, 12) * 15); img.set(ox + x, oy + y, shade(base, 1.18)); img.set(ox + x, oy + y + 1, shade(base, 0.86)); }
  for (let i = 0; i < 5; i++) { const x = Math.floor(H(i, v, 21) * 16), y = Math.floor(H(i, v, 22) * 16); img.set(ox + x, oy + y, shade(base, 0.8)); }
};
T.grass_dark = (img, ox, oy, v) => { noiseFill(img, ox, oy, v, 0x4f9a3f, 0.07, 4); for (let i = 0; i < 10; i++) { const x = Math.floor(H(i, v, 31) * 16), y = Math.floor(H(i, v, 32) * 16); img.set(ox + x, oy + y, 0x3f8433); } };
T.flowers = (img, ox, oy, v) => { T.grass(img, ox, oy, v); const cols = [0xffffff, 0xffd6ec, 0xffe066, 0xff9ac2]; for (let i = 0; i < 6; i++) { const x = 1 + Math.floor(H(i, v, 41) * 14), y = 1 + Math.floor(H(i, v, 42) * 14); const c = cols[(i + v) % 4]; img.set(ox + x, oy + y, c); img.set(ox + x + 1, oy + y, shade(c, 0.85)); img.set(ox + x, oy + y + 1, shade(c, 0.85)); img.set(ox + x - 1, oy + y, shade(c, 0.9)); img.set(ox + x, oy + y - 1, c); } };
T.petals = (img, ox, oy, v) => { T.grass(img, ox, oy, v); for (let i = 0; i < 10; i++) { const x = Math.floor(H(i, v, 51) * 16), y = Math.floor(H(i, v, 52) * 16); img.set(ox + x, oy + y, i % 3 ? 0xffc2dc : 0xffe3ef); } };
T.dirt = (img, ox, oy, v) => { noiseFill(img, ox, oy, v, 0xb08a5a, 0.08, 5); for (let i = 0; i < 6; i++) img.set(ox + Math.floor(H(i, v, 61) * 16), oy + Math.floor(H(i, v, 62) * 16), 0x8a6a44); };
T.field = (img, ox, oy, v) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) img.set(ox + x, oy + y, shade((y % 4) < 2 ? 0x8a6040 : 0x6e4a30, 1 + (H(x, y + v, 7) - 0.5) * 0.12)); };
T.sand = (img, ox, oy, v) => { noiseFill(img, ox, oy, v, 0xe8d29a, 0.05, 8); for (let i = 0; i < 5; i++) img.set(ox + Math.floor(H(i, v, 71) * 16), oy + Math.floor(H(i, v, 72) * 16), 0xcdb47c); };
T.gravel = (img, ox, oy, v) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { const n = H(x, y, 9 + v); img.set(ox + x, oy + y, n > 0.7 ? 0xe8e4dc : n > 0.35 ? 0xcfcac0 : 0xb6b0a6); } for (let x = 0; x < PX; x++) if (x % 5 === 0) for (let y = 0; y < 16; y++) img.set(ox + x, oy + y, shade(img.get(ox + x, oy + y), 0.93)); };
T.path = (img, ox, oy, v) => { // stone pavers, 8×8 offset rows
  for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) {
    const row = y >> 3, off = row % 2 ? 4 : 0, bx = ((x + off) & 7), by = y & 7;
    const stone = Math.floor((x + off) / 8) + row * 3 + v * 5;
    let c = shade(0xd6cfc0, 0.92 + H(stone, row, 13) * 0.16);
    if (bx === 0 || by === 0) c = 0xa69c8a; else if (bx === 1 || by === 1) c = shade(c, 1.06);
    img.set(ox + x, oy + y, shade(c, 1 + (H(x, y, 14 + v) - 0.5) * 0.06));
  }
};
T.cobble = (img, ox, oy, v) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { const cx = Math.floor(x / 4), cy = Math.floor((y + (cx % 2) * 2) / 4); const gap = x % 4 === 0 || (y + (cx % 2) * 2) % 4 === 0; img.set(ox + x, oy + y, gap ? 0x6e6a66 : shade(0x9a958e, 0.88 + H(cx, cy, 15 + v) * 0.24)); } };
T.asphalt = (img, ox, oy, v) => { noiseFill(img, ox, oy, v, 0x4a4d57, 0.06, 16); for (let i = 0; i < 8; i++) img.set(ox + Math.floor(H(i, v, 81) * 16), oy + Math.floor(H(i, v, 82) * 16), 0x5c606b); };
T.asphalt_line = (img, ox, oy, v) => { T.asphalt(img, ox, oy, v); for (let y = 0; y < PX; y++) if ((y >> 2) % 2 === 0) { img.set(ox + 7, oy + y, 0xf2f0e6); img.set(ox + 8, oy + y, 0xf2f0e6); } };
T.asphalt_edge = (img, ox, oy, v) => { T.asphalt(img, ox, oy, v); for (let y = 0; y < PX; y++) { img.set(ox + 1, oy + y, 0xf2f0e6); } };
T.crosswalk = (img, ox, oy, v) => { T.asphalt(img, ox, oy, v); for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) if ((x >> 2) % 2 === 0 && y > 0 && y < 15) img.set(ox + x, oy + y, shade(0xf4f2ea, 0.95 + H(x, y, 19) * 0.08)); };
T.sidewalk = (img, ox, oy, v) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { const g = x % 8 === 0 || y % 8 === 0; img.set(ox + x, oy + y, g ? 0x9c9ca6 : shade(0xc4c4cc, 0.95 + H(x >> 3, y >> 3, 20 + v) * 0.1 + (H(x, y, 21) - 0.5) * 0.04)); } };
T.tactile = (img, ox, oy, v) => { T.sidewalk(img, ox, oy, v); for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { img.set(ox + x, oy + y, (x % 4 === 1 || x % 4 === 2) && (y % 4 === 1 || y % 4 === 2) ? 0xffd23a : 0xf2c21c); } };
T.plaza = (img, ox, oy, v) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { const g = x % 16 === 0 || y % 16 === 0; const chk = ((x >> 3) + (y >> 3)) % 2; img.set(ox + x, oy + y, g ? 0xa7a2a0 : shade(chk ? 0xe6dfd6 : 0xd9d0c6, 1 + (H(x, y, 22 + v) - 0.5) * 0.04)); } };
T.wood = (img, ox, oy, v) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { const plank = y >> 2; const seam = (y & 3) === 0 || ((x + plank * 5) % 16) === 0; img.set(ox + x, oy + y, seam ? 0x6a4a30 : shade(0xa87a50, 0.9 + H(plank, v, 23) * 0.18 + (H(x, y, 24) - 0.5) * 0.06)); } };
T.tatami = (img, ox, oy, v) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { const edge = y < 2 || y > 13; img.set(ox + x, oy + y, edge ? 0x2e4a3a : shade(x % 2 ? 0xc8c08a : 0xbfb67e, 1 + (H(x, y, 25) - 0.5) * 0.05)); } };
T.water = (img, ox, oy, v) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) img.set(ox + x, oy + y, shade(0x2f8fd0, 0.92 + vnoise3(x / 5, y / 5, v) * 0.16)); };
T.canal = (img, ox, oy, v) => { noiseFill(img, ox, oy, v, 0x2a5f7a, 0.06, 26); };
T.moss = (img, ox, oy, v) => { noiseFill(img, ox, oy, v, 0x5e8f3e, 0.1, 27); for (let i = 0; i < 8; i++) img.set(ox + Math.floor(H(i, v, 91) * 16), oy + Math.floor(H(i, v, 92) * 16), 0x83b552); };
T.rock = (img, ox, oy, v) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) img.set(ox + x, oy + y, shade(0x8a8682, 0.85 + vnoise3(x / 3, y / 3, v + 3) * 0.3)); };
T.court = (img, ox, oy, v) => { noiseFill(img, ox, oy, v, 0x3f7fbf, 0.03, 28); };
T.court_line = (img, ox, oy, v) => { T.court(img, ox, oy, v); for (let x = 0; x < PX; x++) { img.set(ox + x, oy + 7, 0xf6f6f0); img.set(ox + x, oy + 8, 0xf6f6f0); } };
T.arena = (img, ox, oy, v) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) img.set(ox + x, oy + y, shade(0xc79a62, 0.94 + (H(x, y, 29 + v) - 0.5) * 0.1)); };
T.metal = (img, ox, oy, v) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { const ridge = (x + y) % 6 === 0; img.set(ox + x, oy + y, ridge ? 0xa8b0b8 : shade(0x7f8892, 1 + (H(x, y, 30) - 0.5) * 0.05)); } };
T.snow = (img, ox, oy, v) => noiseFill(img, ox, oy, v, 0xeef4ff, 0.03, 31);
T.leaves = (img, ox, oy, v) => { T.dirt(img, ox, oy, v); const cols = [0xd8542a, 0xe8892a, 0xc23a22, 0xf0b040]; for (let i = 0; i < 14; i++) { const x = Math.floor(H(i, v, 95) * 15), y = Math.floor(H(i, v, 96) * 15); const c = cols[i % 4]; img.set(ox + x, oy + y, c); img.set(ox + x + 1, oy + y, shade(c, 0.85)); } };
// side textures (vertical faces of the diorama, steps and canal walls)
T.side_soil = (img, ox, oy, v) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { const band = y < 3 ? 0x6a9a42 : y < 4 ? 0x557a36 : 0x7a5638; img.set(ox + x, oy + y, shade(band, 0.92 + H(x, y, 33 + v) * 0.16)); } };
T.side_dirt = (img, ox, oy, v) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) img.set(ox + x, oy + y, shade(y % 8 < 1 ? 0x5a3e28 : 0x7a5638, 0.9 + H(x, y, 34 + v) * 0.2)); };
T.side_stone = (img, ox, oy, v) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { const row = y >> 2, off = row % 2 ? 4 : 0; const g = (y & 3) === 0 || ((x + off) & 7) === 0; img.set(ox + x, oy + y, g ? 0x5e5a54 : shade(0x9a948a, 0.9 + H((x + off) >> 3, row, 35 + v) * 0.2)); } };
T.side_concrete = (img, ox, oy, v) => { for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) img.set(ox + x, oy + y, y === 0 ? 0xb8b8c0 : shade(0x8e8e98, 0.94 + (H(x, y, 36 + v) - 0.5) * 0.1)); };

export const TILE_NAMES = Object.keys(T);
const VARIANTS = 3;
let _tileAtlas = null;
// atlas: 16×16 cells of 16 px (256×256); cell index = name index * VARIANTS + variant
export function tileCell(name, variant = 0) { const i = TILE_NAMES.indexOf(name); return (i < 0 ? 0 : i) * VARIANTS + (variant % VARIANTS); }
export const TILE_GRID = 16, TILE_ATLAS_PX = 256;
export function tileAtlas() {
  if (_tileAtlas) return _tileAtlas;
  const img = new Img(TILE_ATLAS_PX, TILE_ATLAS_PX);
  TILE_NAMES.forEach((name, ni) => {
    for (let v = 0; v < VARIANTS; v++) {
      const cell = ni * VARIANTS + v;
      const ox = (cell % TILE_GRID) * PX, oy = Math.floor(cell / TILE_GRID) * PX;
      T[name](img, ox, oy, v);
    }
  });
  _tileAtlas = toTexture(img);
  return _tileAtlas;
}
export function tileUV(cell) { // [u0,v0,u1,v1] with half-texel inset (nearest sampling)
  const cx = cell % TILE_GRID, cy = Math.floor(cell / TILE_GRID);
  const e = 0.02 / TILE_ATLAS_PX;
  return [cx / TILE_GRID + e, cy / TILE_GRID + e, (cx + 1) / TILE_GRID - e, (cy + 1) / TILE_GRID - e];
}

// ---------------------------------------------------------------- facade atlas (32×48 px bays = 2 m × 3 m)
const FW = 32, FH = 48, FCOLS = 16, FROWS = 10;
export const FACADE_W = 2, FACADE_H = 3;
const F = {}; // painter(img, emissive, ox, oy, variant) — paint neutral (tinted later by vertex colour)
const WALL = 0xeeeae4;
function wallBase(img, ox, oy, v, base = WALL, amp = 0.04) {
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) img.set(ox + x, oy + y, shade(base, 1 + (H(x + v * 9, y, 41) - 0.5) * 2 * amp));
  for (let x = 0; x < FW; x++) { img.set(ox + x, oy + FH - 1, shade(base, 0.78)); img.set(ox + x, oy + FH - 2, shade(base, 0.9)); }
}
function windowAt(img, em, ox, oy, x0, y0, w, h, v, lit, opts = {}) {
  const frame = opts.frame ?? 0x5a5f6a, glass = opts.glass ?? 0x37557a;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const edge = x === x0 || y === y0 || x === x0 + w - 1 || y === y0 + h - 1;
    const mull = opts.mullion && (x === x0 + (w >> 1));
    if (edge || mull) img.set(ox + x, oy + y, frame);
    else {
      const refl = (x - x0 + (y - y0)) % 9 === 0 || (x - x0 + (y - y0)) % 9 === 1;
      img.set(ox + x, oy + y, refl ? shade(glass, 1.6) : shade(glass, 0.9 + (y - y0) / h * 0.3));
      if (lit && em) {
        const warm = [0xffd27a, 0xffb85a, 0xbfe0ff, 0xffe6a8][(v + (x0 >> 3)) % 4];
        const blind = opts.blind && y < y0 + h * 0.45;
        em.set(ox + x, oy + y, blind ? shade(warm, 0.55) : shade(warm, 0.8 + H(x, y, 7) * 0.2));
      }
    }
  }
  // sill
  for (let x = x0 - 1; x < x0 + w + 1; x++) img.set(ox + x, oy + y0 + h, shade(WALL, 0.7));
}
F.wall = (img, em, ox, oy, v) => wallBase(img, ox, oy, v);
F.window = (img, em, ox, oy, v) => { wallBase(img, ox, oy, v); windowAt(img, em, ox, oy, 7, 12, 18, 20, v, H(v, 1, 3) > 0.35, { mullion: true, blind: v % 2 === 0 }); };
F.window2 = (img, em, ox, oy, v) => { wallBase(img, ox, oy, v); windowAt(img, em, ox, oy, 3, 13, 11, 18, v, H(v, 2, 3) > 0.4); windowAt(img, em, ox, oy, 18, 13, 11, 18, v + 1, H(v, 3, 3) > 0.5); };
F.balcony = (img, em, ox, oy, v) => {
  wallBase(img, ox, oy, v);
  windowAt(img, em, ox, oy, 4, 6, 24, 30, v, H(v, 4, 3) > 0.45, { mullion: true, blind: true });
  for (let x = 1; x < FW - 1; x++) for (let y = 26; y < 38; y++) { const rail = y === 26 || y === 37 || x % 3 === 0; if (rail) img.set(ox + x, oy + y, 0x8a8f99); else if (y > 30) img.set(ox + x, oy + y, 0xd7d9de); }
  for (let x = 0; x < FW; x++) { img.set(ox + x, oy + 38, 0x9a9aa2); img.set(ox + x, oy + 39, 0x7a7a82); }
};
F.ac = (img, em, ox, oy, v) => { F.window(img, em, ox, oy, v); for (let y = 34; y < 44; y++) for (let x = 3; x < 15; x++) { const g = (y - 34) % 3 === 0; img.set(ox + x, oy + y, x === 3 || x === 14 || y === 34 || y === 43 ? 0x9a9ca4 : g ? 0xb0b2b8 : 0xd8dade); } for (let a = 0; a < 7; a++) img.set(ox + 9 + Math.round(Math.cos(a) * 2), oy + 39 + Math.round(Math.sin(a) * 2), 0x7a7c84); };
F.shop = (img, em, ox, oy, v) => {
  wallBase(img, ox, oy, v, 0xdcd8d0);
  for (let y = 10; y < 46; y++) for (let x = 1; x < FW - 1; x++) {
    const edge = x === 1 || x === FW - 2 || y === 10 || x === 16;
    img.set(ox + x, oy + y, edge ? 0x3c3f48 : shade(0x4a6a8a, 0.85 + (y - 10) / 36 * 0.4));
    if (em && !edge) em.set(ox + x, oy + y, shade([0xfff0c8, 0xffd9e8, 0xd8f0ff][v % 3], 0.75 + H(x >> 2, y >> 2, v) * 0.25));
  }
  // goods silhouettes
  for (let s = 0; s < 3; s++) for (let x = 3; x < FW - 3; x++) { const y = 22 + s * 8; if (H(x, s, v + 5) > 0.35) { img.set(ox + x, oy + y, [0xff8a6a, 0x6ad0ff, 0xffe06a, 0x9aff8a][(x + s) % 4]); img.set(ox + x, oy + y - 1, shade([0xff8a6a, 0x6ad0ff, 0xffe06a, 0x9aff8a][(x + s) % 4], 0.8)); } }
};
F.shutter = (img, em, ox, oy, v) => { wallBase(img, ox, oy, v, 0xdcd8d0); for (let y = 12; y < 46; y++) for (let x = 2; x < FW - 2; x++) img.set(ox + x, oy + y, (y % 3 === 0) ? 0x8a8e96 : shade(0xb4b8c0, 0.95 + (x % 5) * 0.01)); for (let x = 2; x < FW - 2; x++) img.set(ox + x, oy + 11, 0x5a5e66); };
F.door = (img, em, ox, oy, v) => { wallBase(img, ox, oy, v, 0xdcd8d0); for (let y = 14; y < 46; y++) for (let x = 8; x < 24; x++) { const edge = x === 8 || x === 23 || y === 14 || x === 16; img.set(ox + x, oy + y, edge ? 0x3c3f48 : 0x5a7a9a); if (em && !edge) em.set(ox + x, oy + y, 0xffeed0); } };
F.brick = (img, em, ox, oy, v) => { for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const row = y >> 2, off = row % 2 ? 4 : 0; const g = (y & 3) === 3 || ((x + off) & 7) === 7; img.set(ox + x, oy + y, g ? 0xbdb4aa : shade(0xb05a40, 0.88 + H((x + off) >> 3, row, 43 + v) * 0.24)); } };
F.brick_window = (img, em, ox, oy, v) => { F.brick(img, em, ox, oy, v); windowAt(img, em, ox, oy, 8, 12, 16, 20, v, H(v, 5, 3) > 0.4, { frame: 0xe8e2d8, mullion: true }); };
F.tile = (img, em, ox, oy, v) => { for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const g = x % 4 === 0 || y % 2 === 0; img.set(ox + x, oy + y, g ? shade(WALL, 0.85) : shade(WALL, 0.96 + H(x >> 2, y >> 1, 44 + v) * 0.06)); } };
F.tile_window = (img, em, ox, oy, v) => { F.tile(img, em, ox, oy, v); windowAt(img, em, ox, oy, 5, 11, 22, 22, v, H(v, 6, 3) > 0.4, { mullion: true }); };
F.wood = (img, em, ox, oy, v) => { // machiya koshi lattice
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) img.set(ox + x, oy + y, shade(0x5a3a26, 0.9 + H(x, y >> 3, 45 + v) * 0.15));
  for (let y = 8; y < 44; y++) for (let x = 2; x < 30; x++) { const slat = x % 3 === 0; img.set(ox + x, oy + y, slat ? 0x3a2416 : 0x2a1a10); if (em && !slat && y > 12) em.set(ox + x, oy + y, 0xffb860); }
  for (let x = 0; x < FW; x++) { img.set(ox + x, oy + 7, 0x2a1810); img.set(ox + x, oy + 44, 0x2a1810); }
};
F.plaster = (img, em, ox, oy, v) => { wallBase(img, ox, oy, v, 0xf6f2ea, 0.02); for (let x = 0; x < FW; x++) for (let y = 36; y < FH; y++) img.set(ox + x, oy + y, ((x >> 2) + (y >> 2)) % 2 ? 0x3a3d48 : 0xe8e4dc); };
F.shoji = (img, em, ox, oy, v) => { for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const g = x % 8 === 0 || y % 8 === 0; img.set(ox + x, oy + y, g ? 0x6a4a30 : 0xf4ecd8); if (em && !g) em.set(ox + x, oy + y, 0xffd28a); } };
F.concrete = (img, em, ox, oy, v) => { wallBase(img, ox, oy, v, 0xc2c2c8, 0.05); for (let x = 0; x < FW; x++) img.set(ox + x, oy + 24, 0xa8a8ae); for (const px of [6, 26]) for (const py of [6, 30]) img.set(ox + px, oy + py, 0x9a9aa0); };
F.glass = (img, em, ox, oy, v) => { // curtain wall
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const g = x % 16 === 0 || y % 12 === 0;
    const refl = ((x + y * 0.6) % 22) < 4;
    img.set(ox + x, oy + y, g ? 0x2e3a4c : refl ? 0x9fd0ff : shade(0x3e6a96, 0.85 + y / FH * 0.3));
    if (em && !g && H(x >> 4, y >> 3, 46 + v) > 0.62) em.set(ox + x, oy + y, shade([0xbfe0ff, 0xffe0a8, 0xd8c8ff][(x >> 4) % 3], 0.38 + H(x, y, 2) * 0.12));
  }
};
F.neon_grid = (img, em, ox, oy, v) => { F.glass(img, em, ox, oy, v); };
// roofs (tiled along both axes, 2×2 m per cell → use 32×32 of the 32×48)
F.roof_flat = (img, em, ox, oy, v) => { for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const g = x % 16 === 0 || y % 16 === 0; img.set(ox + x, oy + y, g ? 0x8a8a90 : shade(0xa6a6ac, 0.95 + (H(x, y, 47 + v) - 0.5) * 0.08)); } };
F.roof_tile = (img, em, ox, oy, v) => { for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const ridge = (x % 4); const c = ridge === 0 ? 0x3a4250 : ridge === 1 ? 0x6a7486 : ridge === 2 ? 0x7f8a9c : 0x5a6474; img.set(ox + x, oy + y, (y % 6 === 0) ? shade(c, 0.75) : c); } };
F.roof_green = (img, em, ox, oy, v) => { for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const ridge = (x % 4); const c = ridge === 0 ? 0x2f6a5a : ridge === 1 ? 0x58a890 : ridge === 2 ? 0x6cc0a6 : 0x4a8e7a; img.set(ox + x, oy + y, (y % 6 === 0) ? shade(c, 0.78) : c); } };
F.roof_red = (img, em, ox, oy, v) => { for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const ridge = (x % 4); const c = ridge === 0 ? 0x7a2a22 : ridge === 1 ? 0xb4483a : ridge === 2 ? 0xc85a48 : 0x9a3a30; img.set(ox + x, oy + y, (y % 6 === 0) ? shade(c, 0.78) : c); } };
F.sign_band = (img, em, ox, oy, v) => { wallBase(img, ox, oy, v, 0xffffff, 0.0); };
F.stone_base = (img, em, ox, oy, v) => { for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const row = Math.floor(y / 6), off = row % 2 ? 6 : 0; const g = y % 6 === 0 || ((x + off) % 12) === 0; img.set(ox + x, oy + y, g ? 0x6a665e : shade(0xb0a894, 0.86 + H(Math.floor((x + off) / 12), row, 48 + v) * 0.26)); } };
F.white_wall = (img, em, ox, oy, v) => wallBase(img, ox, oy, v, 0xfbfaf6, 0.015);
F.white_window = (img, em, ox, oy, v) => { wallBase(img, ox, oy, v, 0xfbfaf6, 0.015); for (let y = 16; y < 26; y++) for (let x = 11; x < 21; x++) { const bar = (x - 11) % 3 === 0; img.set(ox + x, oy + y, bar ? 0x2a2a30 : 0x18181c); if (em && !bar) em.set(ox + x, oy + y, 0xffc070); } };

export const FACADE_NAMES = Object.keys(F);
let _facade = null;
export function facadeAtlas() {
  if (_facade) return _facade;
  const img = new Img(FW * FCOLS, FH * FROWS), em = new Img(FW * FCOLS, FH * FROWS);
  FACADE_NAMES.forEach((name, ni) => {
    for (let v = 0; v < VARIANTS; v++) {
      const cell = ni * VARIANTS + v;
      const ox = (cell % FCOLS) * FW, oy = Math.floor(cell / FCOLS) * FH;
      F[name](img, em, ox, oy, v);
    }
  });
  _facade = { map: toTexture(img, true), emissive: toTexture(em, true) };
  return _facade;
}
export function facadeCell(name, v = 0) { const i = FACADE_NAMES.indexOf(name); return (i < 0 ? 0 : i) * VARIANTS + (v % VARIANTS); }
export function facadeUV(cell) {
  const cx = cell % FCOLS, cy = Math.floor(cell / FCOLS);
  const W = FW * FCOLS, Hh = FH * FROWS, e = 0.02;
  // image row 0 is the top of the texture (flipY on upload) → map v accordingly
  return [(cx * FW + e) / W, 1 - ((cy + 1) * FH - e) / Hh, ((cx + 1) * FW - e) / W, 1 - (cy * FH + e) / Hh];
}

function toTexture(img, flip = false) {
  // Painters draw with y-down for facades (flip) and tiles (cell-local). Tiles are
  // sampled with v up; keep row order and let tileUV map it directly.
  let data = img.d;
  if (flip) {
    data = new Uint8Array(img.d.length);
    const row = img.w * 4;
    for (let y = 0; y < img.h; y++) data.set(img.d.subarray(y * row, (y + 1) * row), (img.h - 1 - y) * row);
  }
  const t = new THREE.DataTexture(data, img.w, img.h, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------------- neon signs (canvas)
const signCache = new Map();
export function signTexture(text, opts = {}) {
  const key = text + JSON.stringify(opts);
  if (signCache.has(key)) return signCache.get(key);
  if (typeof document === 'undefined') return null;
  const vertical = !!opts.vertical;
  const c = document.createElement('canvas');
  const scale = 4;
  const lines = String(text).split('\n');
  c.width = (vertical ? 24 : Math.max(48, 13 * Math.max(...lines.map((l) => l.length)) + 16)) * scale;
  c.height = (vertical ? 16 * Math.max(...lines.map((l) => l.length)) + 16 : 26 * lines.length + 8) * scale;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const bg = opts.bg || '#140c22', fg = opts.color || '#ff5ac8';
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = fg; g.lineWidth = 2 * scale; g.strokeRect(3 * scale, 3 * scale, c.width - 6 * scale, c.height - 6 * scale);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 ${(vertical ? 14 : 17) * scale}px "Dela Gothic One","Hiragino Sans","Noto Sans JP",system-ui,sans-serif`;
  if (vertical) { const s = lines[0]; for (let i = 0; i < s.length; i++) g.fillText(s[i], c.width / 2, (12 + i * 16) * scale); }
  else lines.forEach((l, i) => g.fillText(l, c.width / 2, (17 + i * 26) * scale));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.userData = { w: c.width / scale / 16, h: c.height / scale / 16 }; // metres at 16 px/m
  signCache.set(key, t);
  return t;
}
