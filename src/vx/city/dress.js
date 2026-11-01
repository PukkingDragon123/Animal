// The dressing pass: after the districts are built, the whole city gets the small, believable clutter that makes
// a street worth looking at from the isometric camera — without touching a district's layout.
//  - Façades: drainpipes with shoes, window AC units, flower boxes, grime streaks under sills, gas / electric meters,
//    black-iron fire escapes on tall brick fronts.
//  - Roofs: a bitumen membrane on plain flat roofs, condensers, vent stacks, hatches, skylights, antennas, dishes,
//    timber water tanks on tall brick blocks; chimneys, gutters and dishes on pitched roofs.
//  - Ground: manholes, storm drains at the kerb, asphalt patches, oil stains, puddles, crack sealing, worn arrows,
//    tactile paving at every crossing, tree grates with leaf litter.
//  - Streets: newspaper boxes, bins, fire-alarm posts, bike racks, scooters, sandwich boards and potted plants by
//    shop doors, rubbish bags and dumpsters in alleys, utility poles and sagging wires over Sunset Row, trolley
//    wires down Market Street.
// Cost discipline: every façade / roof detail of a building goes into that building's roof group wearing ONE shared
// atlas texture (+1 draw call per building, and it fades / cuts away with the building); every ground decal shares
// one cut-out atlas (+1 draw call for the city); street clutter reuses instanced prop kinds.
import * as PX from './pixtex.js';
import { TX } from './build.js';
import { PROPS } from './voxprops.js';

const { ptex, light, dark, dith } = PX;
const rng = (seed) => { let x = (seed >>> 0) || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };
const hsh = (a, b, c = 0) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return s - Math.floor(s); };

// ================================================================ recording (wrap the builder before the districts run)
/** Start recording streets, sidewalks, crossings, windows and door-like decals; returns the record. */
export function record(C) {
  const R = { streets: [], walks: [], crossings: [], windows: [], doors: [] };
  const wrap = (name, fn) => { const orig = C[name]; C[name] = function (...a) { fn(...a); return orig.apply(this, a); }; };
  wrap('street', (x0, z0, x1, z1, o = {}) => R.streets.push([x0, z0, x1, z1, o.dir || (x1 - x0 > z1 - z0 ? 'x' : 'z')]));
  wrap('sidewalk', (x0, z0, x1, z1, o = {}) => R.walks.push([x0, z0, x1, z1, o.h ?? 0.12]));
  wrap('crossing', (x0, z0, x1, z1, dir = 'x') => R.crossings.push([x0, z0, x1, z1, dir]));
  wrap('windowAt', (gk, sd, ax, az, bx, bz, at, y, win, B) => { const L = Math.hypot(bx - ax, bz - az); R.windows.push({ B, sd, x: ax + ((bx - ax) / L) * at, z: az + ((bz - az) / L) * at, y, w: (win && win.w) || 1.0, h: (win && win.h) || 1.4 }); });
  wrap('decal', (gk, tex, x, y, z, face, w, h) => { if (y < 0.25 && h >= 1.9 && h <= 2.6 && w <= 2.2) R.doors.push([x, z, face]); });
  return R;
}

// ================================================================ the detail atlas (façades + roofs), 8 × 8 cells of 1 m
const CELLS = {};
const AT = 8;
function cell(name, col, row, paint) { CELLS[name] = [col, row, paint]; }
const iron = '#2a2c32', galv = '#a8b0b8', beige = '#d8d0bc';
cell('metal', 0, 0, (P, x, y, r) => { P.rect(x, y, 32, 32, galv); for (let i = 0; i < 32; i += 8) { P.vline(x + i, y, 32, light(galv, 0.25)); P.vline(x + i + 6, y, 32, dark(galv, 0.18)); } P.speck(30, dark(galv, 0.25), r, x, y, 32, 32); });
cell('metalDk', 1, 0, (P, x, y, r) => { P.rect(x, y, 32, 32, '#5a606a'); P.speck(40, '#6a707a', r, x, y, 32, 32); P.speck(30, '#4a5058', r, x, y, 32, 32); P.hline(x, y, 32, '#7a808a'); });
cell('acFront', 2, 0, (P, x, y) => { P.rect(x, y, 32, 32, beige); P.rect(x + 2, y + 2, 28, 18, dark(beige, 0.35)); for (let i = 3; i < 20; i += 3) P.hline(x + 3, y + i, 26, light(beige, 0.1)); P.rect(x + 2, y + 22, 18, 7, dark(beige, 0.08)); P.rect(x + 23, y + 23, 5, 5, '#3a3e48'); P.px(x + 25, y + 25, '#5aff8a'); P.hline(x, y, 32, light(beige, 0.3)); P.hline(x, y + 31, 32, dark(beige, 0.4)); });
cell('acSide', 3, 0, (P, x, y) => { P.rect(x, y, 32, 32, dark(beige, 0.06)); for (let i = 4; i < 28; i += 4) P.rect(x + i, y + 6, 2, 18, dark(beige, 0.35)); P.hline(x, y, 32, light(beige, 0.2)); });
cell('condTop', 4, 0, (P, x, y) => { P.rect(x, y, 32, 32, '#b8bcc4'); P.rect(x + 3, y + 3, 26, 26, '#2a2c34'); for (let j = 4; j < 28; j += 3) P.rect(x + 4, y + j, 24, 1, '#8a8e98'); for (let i = 4; i < 28; i += 6) P.rect(x + i, y + 3, 1, 26, '#6a6e78'); P.rect(x + 13, y + 13, 6, 6, '#9aa0aa'); P.hline(x, y, 32, '#d8dce2'); P.hline(x, y + 31, 32, '#7a7e88'); });   // a square louvred fan grille
cell('condSide', 5, 0, (P, x, y) => { P.rect(x, y, 32, 32, '#c4c8d0'); P.rect(x + 2, y + 3, 28, 24, '#7a7e88'); for (let i = 3; i < 27; i += 2) P.hline(x + 2, y + i, 28, '#9aa0aa'); P.hline(x, y, 32, '#e4e8ee'); P.hline(x, y + 31, 32, '#8a8e98'); P.rect(x + 3, y + 28, 6, 2, '#e8c040'); });
cell('vent', 6, 0, (P, x, y) => { P.rect(x, y, 32, 32, galv); for (let i = 2; i < 30; i += 4) { P.hline(x + 2, y + i, 28, dark(galv, 0.5)); P.hline(x + 2, y + i + 1, 28, dark(galv, 0.25)); P.hline(x + 2, y + i + 2, 28, light(galv, 0.2)); } P.vline(x, y, 32, light(galv, 0.2)); P.vline(x + 31, y, 32, dark(galv, 0.3)); });
cell('pipe', 7, 0, (P, x, y) => { const c = '#6a6e78'; P.rect(x, y, 32, 32, c); P.rect(x, y, 8, 32, light(c, 0.22)); P.rect(x + 8, y, 6, 32, light(c, 0.08)); P.rect(x + 24, y, 8, 32, dark(c, 0.25)); P.hline(x, y + 15, 32, dark(c, 0.35)); P.hline(x, y + 16, 32, light(c, 0.3)); });
cell('pipeW', 0, 1, (P, x, y) => { const c = '#e8e2d4'; P.rect(x, y, 32, 32, c); P.rect(x, y, 8, 32, light(c, 0.4)); P.rect(x + 24, y, 8, 32, dark(c, 0.18)); P.hline(x, y + 15, 32, dark(c, 0.3)); });
cell('iron', 1, 1, (P, x, y, r) => { P.rect(x, y, 32, 32, iron); P.rect(x, y, 32, 6, '#3e424c'); P.speck(20, '#4a4e58', r, x, y, 32, 32); P.speck(10, '#6a4a32', r, x, y, 32, 32); });
cell('grate', 2, 1, (P, x, y) => { for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) { const bar = i % 4 === 0 || j % 8 === 0; if (bar) P.px(x + i, y + j, (i + j) % 7 === 0 ? '#4a4e58' : iron); } P.rect(x, y, 32, 2, '#3a3e48'); P.rect(x, y + 30, 32, 2, '#3a3e48'); });
cell('brickCap', 3, 1, (P, x, y, r) => { P.rect(x, y, 32, 32, '#c8b8a0'); for (let row = 0; row < 11; row++) for (let c = -1; c < 5; c++) { const bx = x + c * 8 + (row & 1 ? 4 : 0), k = (r() - 0.5) * 0.25; const col = k > 0 ? light('#9a4a36', k) : dark('#9a4a36', -k); if (bx + 7 > x && bx < x + 32) P.rect(Math.max(x, bx), y + row * 3, Math.min(7, x + 32 - Math.max(x, bx), bx + 7 - x), 2, col); } P.dither(x, y, 32, 10, '#2a2228', (i, j) => (10 - (j - y)) / 14); });
cell('chimTop', 4, 1, (P, x, y) => { P.rect(x, y, 32, 32, '#8a7a6a'); P.rect(x + 4, y + 4, 24, 24, '#1e1a1e'); P.rect(x + 8, y + 8, 7, 7, '#b86a4a'); P.rect(x + 18, y + 16, 7, 7, '#b86a4a'); P.rect(x + 9, y + 9, 5, 5, '#120e12'); P.rect(x + 19, y + 17, 5, 5, '#120e12'); });
cell('tarPatch', 5, 1, (P, x, y, r) => { P.rect(x, y, 32, 32, '#4a4848'); P.speck(120, '#5a5856', r, x, y, 32, 32); P.speck(60, '#3a3838', r, x, y, 32, 32); P.hline(x, y, 32, '#3a3838'); P.vline(x, y, 32, '#3a3838'); });
cell('skylight', 6, 1, (P, x, y) => { P.rect(x, y, 32, 32, '#c8ccd4'); P.rect(x + 3, y + 3, 26, 26, '#4a6a88'); for (let j = 3; j < 29; j++) for (let i = 3; i < 29; i++) if ((i + j) % 13 < 3) P.px(x + i, y + j, '#a8c8e0'); P.vline(x + 16, y + 3, 26, '#c8ccd4'); P.hline(x + 3, y + 16, 26, '#c8ccd4'); });
cell('hatch', 7, 1, (P, x, y) => { P.rect(x, y, 32, 32, '#8a9098'); P.rect(x + 2, y + 2, 28, 28, '#9aa0a8'); P.hline(x + 2, y + 2, 28, '#b8bec6'); P.rect(x + 12, y + 24, 8, 2, '#3a3e48'); for (let i = 6; i < 26; i += 6) P.hline(x + 4, y + i, 24, '#868c94'); });
cell('tankStave', 0, 2, (P, x, y, r) => { const w = '#8a6a4a'; P.rect(x, y, 32, 32, w); for (let i = 0; i < 32; i += 4) { P.vline(x + i, y, 32, dark(w, 0.3)); P.vline(x + i + 1, y, 32, light(w, 0.08)); } for (const j of [5, 16, 27]) { P.hline(x, y + j, 32, iron); P.hline(x, y + j + 1, 32, '#4a4e58'); } P.speck(30, dark(w, 0.2), r, x, y, 32, 32); P.dither(x, y + 20, 32, 12, '#5a6a4a', 0.2); });
cell('tankTop', 1, 2, (P, x, y, r) => { const w = '#6a5a4a'; P.rect(x, y, 32, 32, w); for (let j = 0; j < 32; j += 4) P.hline(x, y + j, 32, dark(w, 0.3)); P.speck(40, light(w, 0.12), r, x, y, 32, 32); });
cell('dish', 2, 2, (P, x, y) => { P.rect(x, y, 32, 32, '#d8dce0'); P.rect(x + 2, y + 2, 28, 28, '#e8ecf0'); for (let j = 4; j < 28; j += 4) P.hline(x + 3, y + j, 26, '#c4c8ce'); for (let i = 4; i < 28; i += 4) P.vline(x + i, y + 3, 26, '#c8ccd2'); P.rect(x + 13, y + 13, 6, 6, '#5a606a'); P.hline(x, y, 32, '#f4f6f8'); P.vline(x + 31, y, 32, '#9aa0a8'); });   // a square flat-panel antenna face
cell('meter', 4, 2, (P, x, y) => { P.rect(x, y, 32, 32, '#9aa0a0'); P.rect(x + 4, y + 4, 24, 16, '#c8ccc8'); for (let i = 0; i < 4; i++) { P.rect(x + 6 + i * 6, y + 8, 4, 4, '#f4f4ec'); P.px(x + 7 + i * 6, y + 9, '#2a2a2a'); } P.rect(x + 8, y + 23, 16, 5, '#5a5e64'); P.hline(x, y, 32, '#c8ccd0'); P.hline(x, y + 31, 32, '#6a6e74'); });
cell('elec', 5, 2, (P, x, y) => { P.rect(x, y, 32, 32, '#7a8088'); P.rect(x + 2, y + 2, 28, 28, '#8a9098'); P.hline(x + 2, y + 2, 28, '#aab0b8'); P.rect(x + 9, y + 8, 14, 12, '#f0c040'); P.px(x + 16, y + 10, '#2a2a30'); P.vline(x + 16, y + 11, 5, '#2a2a30'); P.rect(x + 26, y + 14, 2, 5, '#3a3e48'); P.tiny('480', x + 10, y + 23, '#e8e8e0'); });
cell('flowerBox', 6, 2, (P, x, y, r) => { const w = '#a86a42'; P.rect(x, y, 32, 32, w); P.hline(x, y, 32, light(w, 0.25)); P.hline(x, y + 31, 32, dark(w, 0.4)); for (let i = 0; i < 32; i += 8) P.vline(x + i, y + 2, 28, dark(w, 0.2)); for (let i = 0; i < 9; i++) { const lx = x + Math.floor(r() * 30), c = ['#3a7a3a', '#4a8a42', '#5a9a4a'][i % 3]; P.rect(lx, y, 2, 3 + Math.floor(r() * 6), c); } });
cell('flowers', 7, 2, (P, x, y, r) => { P.rect(x, y, 32, 32, '#3a7a3a'); P.speck(200, '#4a8a42', r, x, y, 32, 32); P.speck(120, '#2e6a32', r, x, y, 32, 32); const F = ['#f05a6a', '#f8d84a', '#f8f0f0', '#e88ad0', '#f08a3a']; for (let i = 0; i < 30; i++) { const fx = x + Math.floor(r() * 31), fy = y + Math.floor(r() * 31), c = F[i % 5]; P.rect(fx, fy, 2, 2, c); P.px(fx, fy, light(c, 0.4)); } });
// cut-out decals (transparent where unpainted)
cell('streak', 0, 3, (P, x, y, r) => { for (let i = 0; i < 32; i++) { const t = 0.55 * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.7 + 1.3))) * (i < 3 || i > 28 ? 0.35 : 1); for (let j = 0; j < 32; j++) if (dith(x + i, y + j, t * (1 - j / 34) * (0.7 + r() * 0.5))) P.px(x + i, y + j, j < 4 ? '#3a342e' : '#4a443c'); } });
cell('rust', 1, 3, (P, x, y, r) => { for (let i = 10; i < 22; i++) { const t = 0.7 - Math.abs(i - 16) / 8; for (let j = 0; j < 32; j++) if (dith(x + i, y + j, t * (1 - j / 32) * (0.7 + r() * 0.5))) P.px(x + i, y + j, j < 6 ? '#8a4a2a' : '#9a6a4a'); } });
cell('wood', 2, 3, (P, x, y, r) => { const w = '#b8905a'; P.rect(x, y, 32, 32, w); for (let j = 0; j < 32; j += 8) { P.hline(x, y + j, 32, dark(w, 0.3)); P.hline(x, y + j + 1, 32, light(w, 0.12)); } P.speck(30, dark(w, 0.2), r, x, y, 32, 32); });
cell('tarp', 3, 3, (P, x, y) => { P.rect(x, y, 32, 32, '#3a6aa8'); for (let i = 0; i < 32; i += 6) P.vline(x + i, y, 32, '#2e5a92'); P.dither(x, y, 32, 32, '#5a8ac8', (i, j) => ((i + j) % 9 < 2 ? 0.6 : 0)); });
cell('solar', 4, 3, (P, x, y) => { P.rect(x, y, 32, 32, '#24345a'); for (let i = 0; i < 32; i += 8) P.vline(x + i, y, 32, '#8a9ab8'); for (let j = 0; j < 32; j += 8) P.hline(x, y + j, 32, '#8a9ab8'); for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) if ((i + j) % 17 < 2 && i % 8 && j % 8) P.px(x + i, y + j, '#5a7ab8'); });
cell('conc', 5, 3, (P, x, y, r) => { P.rect(x, y, 32, 32, '#a8a49c'); P.speck(90, '#b8b4ac', r, x, y, 32, 32); P.speck(90, '#98948c', r, x, y, 32, 32); P.hline(x, y, 32, '#c8c4bc'); });
cell('moss', 6, 3, (P, x, y, r) => { for (let i = 0; i < 70; i++) { const mx = x + Math.floor(r() * 30), my = y + 20 + Math.floor(r() * 12); P.px(mx, my, r() < 0.5 ? '#5a7a3a' : '#7a8a4a'); } });
cell('ladder', 7, 3, (P, x, y) => { P.rect(x + 2, y, 3, 32, iron); P.rect(x + 27, y, 3, 32, iron); for (let j = 2; j < 32; j += 6) P.rect(x + 2, y + j, 28, 2, '#3a3e48'); });
cell('louvre', 0, 4, (P, x, y) => { P.rect(x, y, 32, 32, '#5a5e66'); for (let j = 1; j < 32; j += 3) { P.hline(x, y + j, 32, '#8a8e96'); P.hline(x, y + j + 1, 32, '#3a3e46'); } });
cell('sat', 1, 4, (P, x, y) => { P.rect(x, y, 32, 32, '#f0f2f4'); P.dither(x, y, 32, 32, '#c8ccd2', (i, j) => Math.hypot(i - x - 20, j - y - 20) / 40); });

cell('grimeBase', 2, 4, (P, x, y, r) => { for (let i = 0; i < 32; i++) { const k = 0.65 + 0.35 * Math.sin(i * 0.9 + 0.5) * Math.sin(i * 0.37); for (let j = 0; j < 32; j++) { const t = (j / 31) ** 1.6 * k; if (dith(x + i, y + j, t * 0.85)) P.px(x + i, y + j, j > 26 ? '#3a3430' : '#4e463e'); } } for (let i = 0; i < 6; i++) { const sx = x + Math.floor(r() * 32); for (let j = 10 + Math.floor(r() * 10); j < 32; j++) if (dith(sx, y + j, 0.7)) P.px(sx, y + j, '#4a423a'); } });
cell('drip', 3, 4, (P, x, y, r) => { for (let i = 6; i < 26; i++) { const t = 0.75 - Math.abs(i - 16) / 13; for (let j = 0; j < 32; j++) if (dith(x + i, y + j, t * (1 - j / 30) * (0.6 + r() * 0.6))) P.px(x + i, y + j, j < 5 ? '#2e2a28' : '#3e3a36'); } });

let ATLAS = null;
export function atlas() {
  if (ATLAS) return ATLAS;
  ATLAS = ptex('dress_atlas', AT, AT, (g, W, H, r, P) => { g.clearRect(0, 0, W, H); for (const n in CELLS) { const [c, rr, paint] = CELLS[n]; paint(P, c * 32, rr * 32, r); } });
  ATLAS.userData.cutout = true;
  return ATLAS;
}
const EPS = 0.6 / (AT * 32);
/** uv rect of a cell (or a fraction of it: [u0, v0, u1, v1] in cell units) */
function cuv(name, sub) {
  const [c, r] = CELLS[name], [a, b, cc, d] = sub || [0, 0, 1, 1];
  return [(c + a) / AT + EPS, 1 - (r + d) / AT + EPS, (c + cc) / AT - EPS, 1 - (r + b) / AT - EPS];
}
/** push a quad a-b-c-d (CCW seen from the front: a bottom-left) into group gk wearing atlas cell `name` */
export function aquad(C, gk, name, a, b, c, d, sub) {
  const A = C.acc(gk, atlas()), base = A.P.length / 3, [u0, v0, u1, v1] = cuv(name, sub);
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  for (const p of [a, b, c, d]) { A.P.push(p[0], p[1], p[2]); A.N.push(nx, ny, nz); }
  A.U.push(u0, v0, u1, v0, u1, v1, u0, v1);
  A.I.push(base, base + 1, base + 2, base, base + 2, base + 3);
}
/** an axis-aligned box in the atlas: f = cell name for all faces, or { side, top, s, n, e, w, bottom, skip } */
export function abox(C, gk, x0, y0, z0, x1, y1, z1, f) {
  const o = typeof f === 'string' ? { side: f, top: f } : f, S = o.skip || {}, sd = (k) => o[k] || o.side;
  if (!S.top) aquad(C, gk, o.top || o.side, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
  if (o.bottom) aquad(C, gk, o.bottom, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
  if (!S.s) aquad(C, gk, sd('s'), [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
  if (!S.n) aquad(C, gk, sd('n'), [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
  if (!S.e) aquad(C, gk, sd('e'), [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
  if (!S.w) aquad(C, gk, sd('w'), [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
}
/** a thin bar between two points (fire-escape stringers, antenna stays, dish arms): a square tube of side t */
function bar(C, gk, name, p, q, t = 0.05) {
  const d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], L = Math.hypot(...d); if (L < 1e-4) return;
  const u = d.map((v) => v / L), ref = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let a = [u[1] * ref[2] - u[2] * ref[1], u[2] * ref[0] - u[0] * ref[2], u[0] * ref[1] - u[1] * ref[0]]; const la = Math.hypot(...a); a = a.map((v) => (v / la) * t / 2);
  const b = [u[1] * a[2] - u[2] * a[1], u[2] * a[0] - u[0] * a[2], u[0] * a[1] - u[1] * a[0]];
  const P = (o, s1, s2) => [o[0] + a[0] * s1 + b[0] * s2, o[1] + a[1] * s1 + b[1] * s2, o[2] + a[2] * s1 + b[2] * s2];
  for (const [s1, s2, s3, s4] of [[1, 1, -1, 1], [-1, 1, -1, -1], [-1, -1, 1, -1], [1, -1, 1, 1]]) aquad(C, gk, name, P(p, s1, s2), P(p, s3, s4), P(q, s3, s4), P(q, s1, s2));
}
/** a flat picture on a wall ('s' | 'n' | 'e' | 'w'), centred at (x, z) on the wall line, from y up h */
function wallDecal(C, gk, name, x, y, z, face, w, h, off = 0.012) {
  const hw = w / 2, P = { s: [[x - hw, z + off], [x + hw, z + off]], n: [[x + hw, z - off], [x - hw, z - off]], e: [[x + off, z + hw], [x + off, z - hw]], w: [[x - off, z - hw], [x - off, z + hw]] }[face];
  aquad(C, gk, name, [P[0][0], y, P[0][1]], [P[1][0], y, P[1][1]], [P[1][0], y + h, P[1][1]], [P[0][0], y + h, P[0][1]]);
}

// ================================================================ the ground-decal atlas (cut-out), 8 × 8 cells of 1 m
const GC = {};
function gcell(name, col, row, w, h, paint) { GC[name] = [col, row, w, h, paint]; }
gcell('manhole', 0, 0, 1, 1, (P, x, y) => { P.rect(x + 2, y + 2, 28, 28, '#2a2a2e'); P.rect(x + 3, y + 3, 26, 26, '#6a6a70'); P.rect(x + 4, y + 4, 24, 24, '#4a4a50'); for (let j = 5; j < 27; j += 3) for (let i = 5 + ((j / 3) & 1); i < 27; i += 3) { P.px(x + i, y + j, '#5e5e64'); P.px(x + i + 1, y + j, '#3a3a40'); } P.rect(x + 9, y + 14, 14, 4, '#3e3e44'); P.tiny('SEW', x + 10, y + 13, '#7a7a80'); P.hline(x + 3, y + 3, 26, '#86868c'); P.vline(x + 3, y + 3, 26, '#7a7a80'); P.rect(x + 6, y + 6, 2, 2, '#26262a'); P.rect(x + 24, y + 24, 2, 2, '#26262a'); });   // square cast-iron cover (no round shapes in the world)
gcell('drain', 1, 0, 1, 1, (P, x, y) => { P.rect(x + 2, y + 9, 28, 14, '#3a3c40'); P.rect(x + 2, y + 9, 28, 1, '#6a6c70'); for (let i = 5; i < 28; i += 3) P.rect(x + i, y + 12, 1, 8, '#101012'); P.rect(x + 2, y + 22, 28, 1, '#5a5c60'); P.hline(x + 1, y + 8, 30, '#2a2a2e'); });
gcell('patch', 2, 0, 2, 1, (P, x, y, r) => { P.rect(x + 1, y + 2, 62, 28, '#3a3a42'); P.speck(260, '#46464e', r, x + 1, y + 2, 62, 28); P.speck(120, '#2e2e36', r, x + 1, y + 2, 62, 28); P.hline(x + 1, y + 2, 62, '#26262c'); P.hline(x + 1, y + 29, 62, '#26262c'); P.vline(x + 1, y + 2, 28, '#26262c'); P.vline(x + 62, y + 2, 28, '#26262c'); });
gcell('patch2', 4, 0, 1, 1, (P, x, y, r) => { P.rect(x + 2, y + 2, 28, 28, '#55555c'); P.speck(140, '#62626a', r, x + 2, y + 2, 28, 28); P.speck(80, '#46464e', r, x + 2, y + 2, 28, 28); P.hline(x + 2, y + 2, 28, '#33333a'); P.vline(x + 2, y + 2, 28, '#33333a'); P.hline(x + 2, y + 29, 28, '#33333a'); P.vline(x + 29, y + 2, 28, '#33333a'); });
gcell('oil', 5, 0, 1, 1, (P, x, y, r) => { for (const [cx, cy, w, h] of [[8, 11, 14, 9], [12, 8, 9, 15], [5, 15, 6, 5], [20, 17, 6, 5], [14, 21, 5, 4]]) P.rect(x + cx, y + cy, w, h, '#26262c'); P.rect(x + 11, y + 12, 8, 7, '#1c1c22'); for (let i = 0; i < 6; i++) P.px(x + 9 + Math.floor(r() * 14), y + 10 + Math.floor(r() * 12), '#3a3a52'); P.rect(x + 13, y + 13, 3, 1, '#4a4a6a'); });   // a blocky pixel stain
gcell('puddle', 6, 0, 2, 1, (P, x, y, r) => { const B = [[8, 10, 46, 12], [12, 7, 34, 18], [18, 5, 20, 22], [40, 9, 14, 10], [4, 13, 10, 6]]; for (const [bx, by, w, h] of B) P.rect(x + bx, y + by, w, h, '#5a6e8a'); for (const [bx, by, w, h] of B) { P.rect(x + bx + 1, y + by + 1, w - 2, h - 2, '#6e86a4'); } P.rect(x + 14, y + 9, 18, 2, '#a8c0d8'); P.rect(x + 34, y + 12, 8, 1, '#c8dcec'); P.rect(x + 20, y + 18, 10, 1, '#8aa0bc'); for (let i = 0; i < 10; i++) P.px(x + 10 + Math.floor(r() * 42), y + 9 + Math.floor(r() * 12), '#4a5e78'); });   // stepped, blocky pixel water (no ellipse)
gcell('crackseal', 0, 1, 2, 1, (P, x, y, r) => { let px = x + 2, py = y + 16, a = 0; for (let k = 0; k < 90; k++) { a += (r() - 0.5) * 0.7; a = Math.max(-0.9, Math.min(0.9, a)); px += Math.cos(a) * 0.7; py += Math.sin(a) * 0.7; if (px > x + 62 || py < y + 1 || py > y + 30) break; P.rect(px, py, 2, 2, '#202026'); if (k % 5 === 0) P.px(px, py - 1, '#3a3a42'); } });
gcell('arrow', 2, 1, 1, 2, (P, x, y, r) => { const W = '#e8e4d8'; P.rect(x + 13, y + 22, 6, 40, W); for (let j = 0; j < 22; j++) { const hw = Math.round(j * 0.62); P.rect(x + 16 - hw, y + 2 + j, hw * 2, 1, W); } for (let i = 0; i < 160; i++) { const ax = x + 4 + Math.floor(r() * 24), ay = y + Math.floor(r() * 62); P.g.clearRect(ax, ay, 1 + (r() < 0.3 ? 1 : 0), 1); } });
gcell('slow', 3, 1, 2, 1, (P, x, y, r) => { P.text('SLOW', x + 32, y + 16, 22, '#e8e4d8', { font: 'monospace' }); for (let i = 0; i < 90; i++) P.g.clearRect(x + Math.floor(r() * 64), y + Math.floor(r() * 32), 1, 1); });
gcell('tactile', 5, 1, 1, 1, (P, x, y, r) => { P.rect(x, y, 32, 32, '#e0b838'); P.speck(40, '#c8a030', r, x, y, 32, 32); for (let j = 2; j < 32; j += 5) for (let i = 2 + ((j / 5) & 1 ? 2 : 0); i < 30; i += 5) { P.rect(x + i, y + j, 2, 2, '#f4d460'); P.px(x + i + 1, y + j + 1, '#a8862a'); } P.hline(x, y, 32, '#a8862a'); P.hline(x, y + 31, 32, '#a8862a'); });
gcell('treegrate', 6, 1, 1, 1, (P, x, y) => { P.rect(x, y, 32, 32, '#3a3a3e'); P.rect(x + 1, y + 1, 30, 30, '#2a2a2e'); for (let j = 2; j < 30; j += 3) for (let i = 2; i < 30; i += 3) if (i < 11 || i > 20 || j < 11 || j > 20) { P.rect(x + i, y + j, 2, 2, '#18181a'); P.px(x + i, y + j, '#4a4a50'); } P.rect(x + 11, y + 11, 10, 10, '#4a3a2a'); P.rect(x + 12, y + 12, 3, 2, '#5a4a32'); P.rect(x + 17, y + 16, 2, 3, '#3a2e22'); P.hline(x, y, 32, '#5a5a60'); P.vline(x, y, 32, '#4e4e54'); });   // a square grate around a square of soil
gcell('leaves', 7, 1, 1, 1, (P, x, y, r) => { const L = ['#c8823a', '#e8b040', '#a8582a', '#8a6a2a', '#d89a3a', '#6a8a3a']; for (let i = 0; i < 70; i++) { const d = Math.pow(r(), 0.7) * 15, a = r() * 6.283, lx = x + 15.5 + Math.cos(a) * d, ly = y + 15.5 + Math.sin(a) * d, c = L[Math.floor(r() * L.length)]; P.rect(lx, ly, 2, 1, c); if (r() < 0.5) P.px(lx + 1, ly + 1, dark(c, 0.3)); } });
gcell('cover', 0, 2, 1, 1, (P, x, y) => { P.rect(x + 6, y + 6, 20, 20, '#5a5a5e'); P.rect(x + 7, y + 7, 18, 18, '#6e6e72'); for (let j = 9; j < 24; j += 3) P.hline(x + 9, y + j, 14, '#5e5e62'); P.tiny('W', x + 14, y + 13, '#4a4a4e'); P.hline(x + 6, y + 6, 20, '#8a8a8e'); });
gcell('litter', 1, 2, 1, 1, (P, x, y, r) => { for (let i = 0; i < 9; i++) { const lx = x + Math.floor(r() * 30), ly = y + Math.floor(r() * 30), c = ['#f4f0e6', '#e8d8b0', '#c83a3a', '#5a8ad8'][i % 4]; P.rect(lx, ly, 2, 1, c); P.px(lx, ly + 1, dark(c, 0.3)); } });
gcell('stain', 2, 2, 1, 1, (P, x, y) => { P.dither(x + 7, y + 9, 18, 13, '#2c2c34', 0.32); P.dither(x + 10, y + 6, 11, 19, '#2c2c34', 0.26); P.dither(x + 12, y + 12, 7, 6, '#2c2c34', 0.4); });
gcell('vault', 3, 2, 1, 1, (P, x, y) => { P.rect(x + 3, y + 8, 26, 16, '#4e4e54'); P.rect(x + 4, y + 9, 24, 14, '#5e5e64'); for (let i = 6; i < 27; i += 4) for (let j = 11; j < 22; j += 4) P.rect(x + i, y + j, 2, 2, '#46464c'); P.hline(x + 3, y + 8, 26, '#7a7a80'); });

let GATLAS = null;
function gatlas() {
  if (GATLAS) return GATLAS;
  GATLAS = ptex('dress_ground', AT, AT, (g, W, H, r, P) => { g.clearRect(0, 0, W, H); for (const n in GC) { const [c, rr, , , paint] = GC[n]; paint(P, c * 32, rr * 32, r); } });
  GATLAS.userData.cutout = true;
  return GATLAS;
}
/** a ground decal of cell `name` centred at (x, z), w × d metres, at height y, rotated by quarter turns q */
function gdecal(C, name, x, z, w, d, y = 0.014, q = 0) {
  const A = C.acc('ground', gatlas()), base = A.P.length / 3, [c, r, cw, ch] = GC[name];
  const u0 = c / AT + EPS, u1 = (c + cw) / AT - EPS, v1 = 1 - r / AT - EPS, v0 = 1 - (r + ch) / AT + EPS;
  let corners = [[x - w / 2, z + d / 2], [x + w / 2, z + d / 2], [x + w / 2, z - d / 2], [x - w / 2, z - d / 2]];
  const uv = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  for (let k = 0; k < (q & 3); k++) uv.push(uv.shift());
  for (let i = 0; i < 4; i++) { A.P.push(corners[i][0], y, corners[i][1]); A.N.push(0, 1, 0); A.U.push(uv[i][0], uv[i][1]); }
  A.I.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

// ================================================================ the pass
export function dress(C, R, ctx = {}) {
  // small kerbside clutter skips the shadow pass: each kind costs a draw call per 32 m tile there, and their shadows are a few pixels
  for (const k of ['dt_meter', 'wf_gull', 'pk_pigeons', 'ct_bucket', 'dt_psign', 'pot', 'sandwich', 'scooter', 'boxes', 'bags', 'bikeRack', 'dt_bike']) if (PROPS[k]) PROPS[k].noShadow = true;
  const r = rng(20261030), stats = { ground: 0, props: 0, facade: 0, roofs: 0, escapes: 0, tanks: 0 };
  const nav = C.nav;
  // rows of identical trees: turn each one its own way, and let some be the rounder variant (same footprint)
  for (const p of C.props) {
    if (!/^(tree|treeB|pk_oak|pk_maple|pk_blossom|bush|pot)$/.test(p.kind) || p.yaw) continue;
    const h = hsh(p.x, p.z, 3); p.yaw = Math.floor(h * 4) * (Math.PI / 2) + (h - 0.5) * 0.3;
    if (p.kind === 'tree' && h > 0.62) p.kind = 'treeB';
  }
  // spatial checks: props, interactables, spots, NPCs, doors
  const keep = [];
  for (const it of C.inter) keep.push([it.x, it.z, 1.6]);
  for (const k in C.spots) keep.push([C.spots[k][0], C.spots[k][1], 1.4]);
  for (const n of C.npcs || []) keep.push([n.x, n.z, 1.6]);
  for (const D of C.doors) keep.push([D.x, D.z, 1.8]);
  for (const [x, z] of R.doors) keep.push([x, z, 1.4]);
  for (const B of C.buildings) for (const dr of B.o && (B.o.doors || (B.o.door ? [B.o.door] : [])) || []) { const p = doorPoint(B, dr); if (p) keep.push([p[0], p[1], 1.6]); }
  const PG = new Map(), pk = (x, z) => Math.floor(x / 2) + ',' + Math.floor(z / 2);
  const addP = (x, z, rr) => { const k = pk(x, z); if (!PG.has(k)) PG.set(k, []); PG.get(k).push([x, z, rr]); };
  for (const p of C.props) addP(p.x, p.z, 0.5);
  const nearProp = (x, z, d) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const [px, pz, pr] of PG.get((Math.floor(x / 2) + i) + ',' + (Math.floor(z / 2) + j)) || []) if (Math.hypot(px - x, pz - z) < d + pr) return true; return false; };
  const nearKeep = (x, z, extra = 0) => keep.some(([kx, kz, kr]) => Math.hypot(kx - x, kz - z) < kr + extra);
  const onCrossing = (x, z, m = 0.8) => R.crossings.some(([x0, z0, x1, z1]) => x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m);
  /** is a w × d footprint (plus margin) open, level and free of other things? */
  const free = (x, z, w, d, o = {}) => {
    const m = o.m ?? 0.15, h0 = nav.ground(x, z, 0);
    if (x - w / 2 - m < 1 || z - d / 2 - m < 1 || x + w / 2 + m > C.w - 1 || z + d / 2 + m > C.d - 1) return false;
    let ok = true;
    nav.each(x - w / 2 - m, z - d / 2 - m, x + w / 2 + m, z + d / 2 + m, (c) => { if (!nav.walk[0][c] || Math.abs(nav.h[0][c] - h0) > 0.04 || nav.bid[0][c] >= 0) ok = false; });
    if (!ok) return false;
    if (o.h != null && Math.abs(h0 - o.h) > 0.05) return false;
    if (nearKeep(x, z, o.keep ?? 0) || nearProp(x, z, o.pd ?? 0.9) || onCrossing(x, z)) return false;
    return true;
  };
  const prop = (kind, x, z, o = {}) => { C.prop(kind, x, z, o); addP(x, z, o.pr ?? 0.4); stats.props++; };

  // ---------------------------------------------------------------- roofs + façades
  for (const B of C.buildings) {
    if (!B.o || B.o.x === undefined || B.w < 3 || B.d < 3) continue;   // landmarks / fadeables / kiosks
    dressBuilding(C, B, R, r, stats);
  }
  // ---------------------------------------------------------------- ground decals
  for (const [x0, z0, x1, z1, dir] of R.streets) {
    const along = dir === 'x', L = along ? x1 - x0 : z1 - z0, Wd = along ? z1 - z0 : x1 - x0, P = (s, t) => (along ? [x0 + s, z0 + t] : [x0 + t, z0 + s]);
    if (L < 6 || Wd < 4) continue;
    for (let s = 3 + r() * 8; s < L - 3; s += 9 + r() * 14) {
      const q = r(), t = Wd * (0.2 + r() * 0.6), [x, z] = P(s, t);
      if (onCrossing(x, z, 1.2)) continue;
      if (q < 0.28) gdecal(C, 'manhole', x, z, 0.85, 0.85, 0.018, Math.floor(r() * 4));
      else if (q < 0.5) gdecal(C, along ? 'patch' : 'patch', x, z, along ? 2.2 + r() * 1.5 : 1.1, along ? 1.1 : 2.2 + r() * 1.5, 0.016, along ? 0 : 1);
      else if (q < 0.62) gdecal(C, 'patch2', x, z, 1 + r() * 0.6, 1 + r() * 0.6, 0.016);
      else if (q < 0.8) gdecal(C, 'oil', x, z, 1.1, 1.1, 0.019, Math.floor(r() * 4));
      else if (q < 0.9) gdecal(C, 'crackseal', x, z, along ? 2.6 : 1.3, along ? 1.3 : 2.6, 0.017, along ? 0 : 1);
      else gdecal(C, 'puddle', x, z, along ? 2.2 : 1.1, along ? 1.1 : 2.2, 0.02, along ? 0 : 1);
      stats.ground++;
    }
    // storm drains at both kerbs, every ~22 m, just inside the gutter
    for (let s = 5 + r() * 6; s < L - 3; s += 18 + r() * 10) for (const t of [0.35, Wd - 0.35]) {
      const [x, z] = P(s, t); if (onCrossing(x, z, 0.6)) continue;
      gdecal(C, 'drain', x, z, 0.9, 0.9, 0.018, along ? (t < 1 ? 2 : 0) : (t < 1 ? 1 : 3)); stats.ground++;
    }
    // worn lane arrows / SLOW near junction ends
    if (L > 30 && Wd >= 6) for (const s of [6, L - 6]) { const [x, z] = P(s, Wd * (s < L / 2 ? 0.75 : 0.25)); if (!onCrossing(x, z, 1)) { gdecal(C, 'arrow', x, z, along ? 2 : 0.9, along ? 0.9 : 2, 0.017, along ? (s < L / 2 ? 3 : 1) : (s < L / 2 ? 2 : 0)); stats.ground++; } }
  }
  // tactile paving where every crossing meets a raised kerb
  for (const [x0, z0, x1, z1, dir] of R.crossings) {
    const ends = dir === 'z' ? [[(x0 + x1) / 2, z0 - 0.35], [(x0 + x1) / 2, z1 + 0.35]] : [[x0 - 0.35, (z0 + z1) / 2], [x1 + 0.35, (z0 + z1) / 2]];
    for (const [x, z] of ends) {
      const h = nav.ground(x, z, 0); if (h < 0.08 || h > 0.2 || !nav.ok(x, z, 0)) continue;
      if (dir === 'z') gdecal(C, 'tactile', x, z, x1 - x0, 0.6, h + 0.006); else gdecal(C, 'tactile', x, z, 0.6, z1 - z0, h + 0.006);
      stats.ground++;
    }
  }
  // sidewalks: utility covers, vault grates, gum-blackened stains, litter; tree grates + leaf litter under street trees
  for (const [x0, z0, x1, z1, h] of R.walks) {
    const along = x1 - x0 > z1 - z0, L = along ? x1 - x0 : z1 - z0;
    for (let s = 2 + r() * 5; s < L - 1; s += 6 + r() * 9) {
      const x = along ? x0 + s : x0 + (x1 - x0) * (0.25 + r() * 0.5), z = along ? z0 + (z1 - z0) * (0.25 + r() * 0.5) : z0 + s;
      if (!nav.ok(x, z, 0) || Math.abs(nav.ground(x, z, 0) - h) > 0.03 || onCrossing(x, z, 0.5)) continue;
      const q = r(), y = h + 0.006;
      if (q < 0.3) gdecal(C, 'cover', x, z, 0.6, 0.6, y); else if (q < 0.45) gdecal(C, 'vault', x, z, 1, 1, y, along ? 0 : 1); else if (q < 0.7) gdecal(C, 'stain', x, z, 1.2, 1.2, y); else if (q < 0.85) gdecal(C, 'litter', x, z, 0.8, 0.8, y); else continue;
      stats.ground++;
    }
  }
  for (const p of C.props) {
    if (p.kind !== 'tree' && p.kind !== 'treeB') continue;
    const h = nav.ground(p.x, p.z, 0), raised = h > 0.08 && h < 0.2;
    if (raised) gdecal(C, 'treegrate', p.x, p.z, 1.2, 1.2, h + 0.007);
    gdecal(C, 'leaves', p.x + (r() - 0.5) * 1.2, p.z + (r() - 0.5) * 1.2, 1.6, 1.6, h + 0.009, Math.floor(r() * 4));
    stats.ground++;
  }
  // ---------------------------------------------------------------- street clutter along the kerbs
  const district = (x, z) => (z < 20 ? 'wharf' : z >= 110 && x < 104 ? 'home' : z >= 110 && x >= 116 ? 'downtown' : z < 98 && z >= 32 && x >= 116 ? 'chinatown' : z < 98 && z >= 32 ? 'park' : 'avenue');
  const SETS = {
    avenue: [['dt_newsbox', 0.25, 1.5, 0.55], ['bin', 0.15, 0.6, 0.6], ['firebox', 0.1, 0.3, 0.3], ['bikeRack', 0.12, 1.5, 0.4], ['dt_meter', 0.18, 0.25, 0.25], ['scooter', 0.08, 0.6, 1.3], ['pot', 0.12, 0.6, 0.6]],
    downtown: [['dt_newsbox', 0.2, 1.5, 0.55], ['dt_meter', 0.12, 0.25, 0.25], ['bin', 0.12, 0.6, 0.6], ['scooter', 0.12, 0.6, 1.3], ['firebox', 0.06, 0.3, 0.3], ['pot', 0.18, 0.6, 0.6], ['bikeRack', 0.1, 1.5, 0.4], ['sandwich', 0.08, 0.5, 0.5]],
    home: [['bin', 0.25, 0.6, 0.6], ['pot', 0.25, 0.6, 0.6], ['firebox', 0.12, 0.3, 0.3], ['scooter', 0.1, 0.6, 1.3], ['bags', 0.12, 1.0, 0.8]],
    chinatown: [['ct_bucket', 0.3, 0.4, 0.4], ['pot', 0.3, 0.6, 0.6], ['boxes', 0.2, 1.0, 0.8], ['bin', 0.2, 0.6, 0.6]],
    wharf: [['bin', 0.4, 0.6, 0.6], ['pot', 0.3, 0.6, 0.6], ['dt_newsbox', 0.3, 1.5, 0.55]],
    park: [['bin', 0.6, 0.6, 0.6], ['pot', 0.4, 0.6, 0.6]],
  };
  const pickSet = (S) => { let t = r() * S.reduce((a, s) => a + s[1], 0); for (const s of S) { t -= s[1]; if (t <= 0) return s; } return S[0]; };
  for (const [x0, z0, x1, z1, h] of R.walks) {
    const along = x1 - x0 > z1 - z0, L = along ? x1 - x0 : z1 - z0, Wd = along ? z1 - z0 : x1 - x0;
    if (L < 5 || Wd < 1.6) continue;
    // which long edge meets the road? (the side whose neighbour is lower)
    const edges = along ? [[z0, -1], [z1, 1]] : [[x0, -1], [x1, 1]];
    for (const [e, sgn] of edges) {
      const inStreet = (px, pz) => R.streets.some(([a, b, c, d]) => px > a && px < c && pz > b && pz < d);
      const probe = (s) => (along ? inStreet(x0 + s, e + sgn * 0.6) : inStreet(e + sgn * 0.6, z0 + s));
      for (let s = 2 + r() * 4; s < L - 2; s += 4.5 + r() * 6) {
        if (!probe(s)) continue;   // only along a kerb that meets the road
        const set = SETS[district(along ? x0 + s : e, along ? e : z0 + s)] || SETS.avenue, [kind, , pw, pd] = pickSet(set);
        const inset = 0.42 + (kind === 'scooter' ? 0.1 : 0);
        const x = along ? x0 + s : e - sgn * inset, z = along ? e - sgn * inset : z0 + s;
        const yaw = along ? (sgn > 0 ? 0 : Math.PI) : (sgn > 0 ? Math.PI / 2 : -Math.PI / 2);
        const fw = along ? pw : pd, fd = along ? pd : pw;
        if (!free(x, z, fw, fd, { h, pd: 1.0 })) continue;
        prop(kind, x, z, { yaw: kind === 'scooter' ? yaw + Math.PI / 2 : kind === 'dt_newsbox' || kind === 'bikeRack' ? (along ? 0 : Math.PI / 2) : yaw, pr: Math.max(pw, pd) / 2 });
        if (kind === 'bikeRack' && r() < 0.8) { const bx = along ? x + 0.4 : x, bz = along ? z : z + 0.4; C.props.push({ kind: 'dt_bike', x: bx, y: h, z: bz, yaw: along ? 0 : Math.PI / 2, s: 1 }); }
        if (kind === 'dt_newsbox' && r() < 0.5) { const bx = along ? x + 1.3 : x, bz = along ? z : z + 1.3; if (free(bx, bz, 0.6, 0.6, { h, pd: 0.4 })) prop('bin', bx, bz, { pr: 0.3 }); }
      }
    }
  }
  // sandwich boards and potted plants by the doors of shops (wherever there is room on the pavement)
  for (const [x, z, face] of R.doors) {
    const nx = face === 'e' ? 1 : face === 'w' ? -1 : 0, nz = face === 's' ? 1 : face === 'n' ? -1 : 0, tx = -nz, tz = nx;
    if (face === 'n' && r() < 0.6) continue;
    const q = r();
    if (q < 0.35) { for (const side of [1, -1]) { const px = x + nx * 0.4 + tx * side * 0.95, pz = z + nz * 0.4 + tz * side * 0.95; if (free(px, pz, 0.5, 0.5, { m: 0.05, keep: -0.9, pd: 0.4 })) prop('pot', px, pz, { pr: 0.3 }); } }
    else if (q < 0.6) { const side = r() < 0.5 ? 1 : -1, px = x + nx * 1.3 + tx * side * 1.3, pz = z + nz * 1.3 + tz * side * 1.3; if (free(px, pz, 0.7, 0.7, { keep: -0.4, pd: 0.6 })) prop('sandwich', px, pz, { yaw: Math.atan2(nx, nz), pr: 0.35 }); }
  }
  // alleys and back lots: rubbish bags, cardboard, a dumpster (Ross Alley, Old Lane, behind the row houses)
  for (const [x, z, n] of [[129.5, 40, 3], [129.5, 75, 3], [163.5, 40, 2], [163.5, 52, 2], [212, 160, 2], [200, 176, 2]]) for (let i = 0; i < n; i++) {
    const px = x + (r() - 0.5) * 1.4, pz = z + i * 4 + r() * 2, kind = i === 0 && r() < 0.6 ? 'dumpster' : r() < 0.5 ? 'bags' : 'boxes', [w, d] = kind === 'dumpster' ? [1.9, 1.15] : [1.1, 0.9];
    if (free(px, pz, w, d, { m: 0.05, pd: 0.6 })) prop(kind, px, pz, { yaw: x < 140 || (x > 160 && x < 170) ? Math.PI / 2 * (r() < 0.5 ? 1 : -1) : 0, pr: Math.max(w, d) / 2 });
  }
  // ---------------------------------------------------------------- concrete gutter pans along every kerb
  const gut = gutterTex();
  for (const [x0, z0, x1, z1, dir] of R.streets) {
    const along = dir === 'x', w = 0.42, y = 0.006, e = 0.05;
    for (const [a, b, c, d] of R.walks) {
      if (along) {
        const s0 = Math.max(x0, a), s1 = Math.min(x1, c); if (s1 - s0 < 0.5) continue;
        if (Math.abs(d - z0) < e) C.quad('ground', gut, [s0, y, z0 + w], [s1, y, z0 + w], [s1, y, z0], [s0, y, z0], { u0: s0 });
        else if (Math.abs(b - z1) < e) C.quad('ground', gut, [s1, y, z1 - w], [s0, y, z1 - w], [s0, y, z1], [s1, y, z1], { u0: -s1 });
        else continue;
      } else {
        const s0 = Math.max(z0, b), s1 = Math.min(z1, d); if (s1 - s0 < 0.5) continue;
        if (Math.abs(c - x0) < e) C.quad('ground', gut, [x0 + w, y, s1], [x0 + w, y, s0], [x0, y, s0], [x0, y, s1], { u0: -s1 });
        else if (Math.abs(a - x1) < e) C.quad('ground', gut, [x1 - w, y, s0], [x1 - w, y, s1], [x1, y, s1], [x1, y, s0], { u0: s0 });
        else continue;
      }
      stats.ground++;
    }
  }
  // ---------------------------------------------------------------- street trees down Van Ness (only lamps stood there)
  for (const [x, zs] of [[104.95, [45, 59, 73, 87, 129, 143, 157, 171]], [115.05, [38, 52, 66, 80, 122, 136, 150, 164]]]) for (const z of zs) {
    if (!free(x, z, 0.7, 0.7, { m: 0.1, pd: 1.4, keep: 0.3 })) continue;
    prop(z % 28 < 14 ? 'treeB' : 'tree', x, z, { yaw: z * 0.37, s: 0.9, pr: 0.5 });
    gdecal(C, 'treegrate', x, z, 1.2, 1.2, 0.127); gdecal(C, 'leaves', x + (r() - 0.5), z + (r() - 0.5), 1.6, 1.6, 0.129, Math.floor(r() * 4));
  }
  // ---------------------------------------------------------------- street-name signs on a corner of each junction crossing
  const seen = new Set();
  for (const [x0, z0, x1, z1, dir] of R.crossings) {
    const key = Math.round((x0 + x1) / 20) + ',' + Math.round((z0 + z1) / 20); if (seen.has(key)) continue;
    const [x, z] = dir === 'z' ? [x1 + 0.45, z1 + 0.6] : [x1 + 0.6, z1 + 0.45];
    const h = nav.ground(x, z, 0); if (h < 0.08 || h > 0.2) continue;
    if (free(x, z, 0.4, 0.4, { m: 0.05, pd: 0.7, keep: -0.5 })) { prop('sign', x, z, { yaw: dir === 'z' ? 0 : Math.PI / 2, pr: 0.2 }); seen.add(key); }
  }
  // ---------------------------------------------------------------- pigeons on the plazas, gulls on bayside parapets
  for (const [x, z] of [[123.5, 100.5], [175, 70], [196, 88], [138, 118.5], [150, 136], [62, 16.5], [184, 16.6], [108, 15.5], [26, 96.5]]) {
    const px = x + (r() - 0.5) * 2, pz = z + (r() - 0.5) * 2;
    if (free(px, pz, 1.8, 1.6, { m: 0, pd: 0.8, keep: -0.6 })) { C.props.push({ kind: 'pk_pigeons', x: px, y: nav.ground(px, pz, 0), z: pz, yaw: r() * 6.28, s: 1 }); stats.props++; }
  }
  for (const B of C.buildings) {
    if (!B.o || B.o.x === undefined || B.z > 40 || (B.o.roof && B.o.roof.type && B.o.roof.type !== 'flat')) continue;
    const H = B.floors * (B.fh || 3);
    for (let i = 0; i < 2; i++) if (r() < 0.6) C.props.push({ kind: 'wf_gull', x: B.x + 0.5 + r() * (B.w - 1), y: H + (B.o.roof?.parapet ?? 0.5), z: B.z + B.d - 0.1, yaw: r() * 6.28, s: 1 });
  }
  // ---------------------------------------------------------------- overhead wires
  wires(C, R, r, free, prop, stats);
  return stats;
}
/** the concrete gutter pan between asphalt and kerb: pale, slightly stained, a joint every 1.5 m, a wet dark line at the kerb */
const gutterTex = () => ptex('dress_gutter', 3, 0.42, (g, W, H, r, P) => {
  const R = PX.ramp('#a8a49a', [-0.1, -0.04, 0, 0.04]); PX.pixels(g, W, H, (x, y) => PX.pick(R, 0.55 + (r() - 0.5) * 0.4 - (y < 3 ? 0.35 : 0), x, y));
  P.hline(0, 0, W, '#6a6a6c'); P.hline(0, 1, W, '#7e7c7a'); P.hline(0, H - 1, W, '#8a8884');
  for (const x of [0, 48]) { P.vline(x, 0, H, '#7a7874'); P.vline(x + 1, 0, H, '#c4c0b8'); }
  for (let i = 0; i < 5; i++) P.blob(r() * W, 2 + r() * 4, 3 + Math.floor(r() * 4), 1, '#7a766e', 0.5);
  P.speck(16, '#5a5a5c', r);
});

function doorPoint(B, dr) {
  const { x, z, w, d } = B, L = dr.side === 's' || dr.side === 'n' ? w : d, t = dr.at * L;
  return { s: [x + t, z + d], n: [x + w - t, z], e: [x + w, z + d - t], w: [x, z + t] }[dr.side];
}

// ---------------------------------------------------------------- one building
function dressBuilding(C, B, R, r, stats) {
  const { x, z, w, d } = B, fh = B.fh || 3, floors = B.floors || 1, H = floors * fh, R0 = B.o.roof || { type: 'flat' }, type = R0.type || 'flat', gk = `b${B.id}:roof`;
  const wallKey = (B.o.wall && B.o.wall.userData && B.o.wall.userData.key) || '', brick = wallKey.startsWith('brick'), sid = wallKey.startsWith('siding');
  const seed = hsh(x, z, B.id), wins = R.windows.filter((W) => W.B === B);
  const enter = !!B.enter, fgk = (k) => (enter ? B.gk(k, 'front') : gk);
  // is the wall at (px, pz) on side sd open to the street (not pressed against a neighbour)?
  const nav = C.nav, exposed = (sd, px, pz, out = 0.6) => { const qx = px + (sd === 'e' ? out : sd === 'w' ? -out : 0), qz = pz + (sd === 's' ? out : sd === 'n' ? -out : 0), b = nav.buildingAt(qx, qz, 0); return (b < 0 || b === B.id) && (nav.ok(qx, qz, 0) || nav.ground(qx, qz, 0) < 0.5 && b < 0 && !C.buildings.some((o) => o !== B && o.o && qx > o.x && qx < o.x + o.w && qz > o.z && qz < o.z + o.d)); };
  // ---- roof surface: plain concrete flat roofs become a membrane with seams, gravel and patches
  if (type === 'flat') swapRoof(C, B, H);
  // ---- roofs: clutter on the free parts of a flat roof
  if (type === 'flat') {
    const occ = roofOccupancy(C, B, H), cellFree = (ax, az, bx, bz) => { for (let i = Math.floor(ax - x); i < Math.ceil(bx - x); i++) for (let k = Math.floor(az - z); k < Math.ceil(bz - z); k++) if (i < 1 || k < 1 || i >= Math.floor(w) - 1 || k >= Math.floor(d) - 1 || occ.has(i + ',' + k)) return false; return true; };
    const take = (ax, az, bx, bz) => { for (let i = Math.floor(ax - x); i < Math.ceil(bx - x); i++) for (let k = Math.floor(az - z); k < Math.ceil(bz - z); k++) occ.add(i + ',' + k); };
    const spot = (sw, sd, tries = 14) => { for (let t = 0; t < tries; t++) { const ax = x + 1 + r() * Math.max(0, w - 2 - sw), az = z + 1 + r() * Math.max(0, d - 2 - sd); if (cellFree(ax - 0.3, az - 0.3, ax + sw + 0.3, az + sd + 0.3)) { take(ax - 0.3, az - 0.3, ax + sw + 0.3, az + sd + 0.3); return [ax, az]; } } return null; };
    const Y = H + 0.06, area = w * d, n = Math.min(7, Math.max(1, Math.round(area / 45)));
    for (let i = 0; i < n; i++) {
      const q = r();
      if (q < 0.3) { const p = spot(1.3, 1.0); if (!p) continue; const [ax, az] = p; abox(C, gk, ax, Y, az, ax + 1.3, Y + 0.95, az + 1.0, { side: 'condSide', top: 'condTop' }); abox(C, gk, ax - 0.05, Y, az - 0.05, ax + 1.35, Y + 0.12, az + 1.05, 'metalDk'); bar(C, gk, 'pipe', [ax + 1.3, Y + 0.3, az + 0.5], [ax + 1.8, Y + 0.3, az + 0.5], 0.08); }
      else if (q < 0.45) { const p = spot(0.4, 0.4); if (!p) continue; const [ax, az] = p; abox(C, gk, ax, Y, az, ax + 0.18, Y + 0.7 + r() * 0.5, az + 0.18, { side: 'pipe', top: 'metalDk' }); abox(C, gk, ax - 0.06, Y + 0.7, az - 0.06, ax + 0.24, Y + 0.78, az + 0.24, 'metal'); }
      else if (q < 0.58) { const p = spot(0.9, 0.9); if (!p) continue; const [ax, az] = p; abox(C, gk, ax, Y, az, ax + 0.9, Y + 0.32, az + 0.9, { side: 'metal', top: 'hatch' }); }
      else if (q < 0.7) { const p = spot(1.4, 1.1); if (!p) continue; const [ax, az] = p; abox(C, gk, ax, Y, az, ax + 1.4, Y + 0.25, az + 1.1, 'metal'); aquad(C, gk, 'skylight', [ax + 0.05, Y + 0.25, az + 1.05], [ax + 1.35, Y + 0.25, az + 1.05], [ax + 1.35, Y + 0.55, az + 0.05], [ax + 0.05, Y + 0.55, az + 0.05]); aquad(C, gk, 'metal', [ax + 1.35, Y + 0.25, az + 1.05], [ax + 1.35, Y + 0.25, az + 0.05], [ax + 1.35, Y + 0.55, az + 0.05], [ax + 1.35, Y + 0.25, az + 1.05]); }
      else if (q < 0.8) { const p = spot(1.6, 1.2); if (!p) continue; const [ax, az] = p; aquad(C, gk, 'tarPatch', [ax, Y + 0.005, az + 1.2], [ax + 1.6, Y + 0.005, az + 1.2], [ax + 1.6, Y + 0.005, az], [ax, Y + 0.005, az]); }
      else if (q < 0.9) { const p = spot(0.6, 0.6); if (!p) continue; const [ax, az] = p; const tall = 1.6 + r() * 1.6; abox(C, gk, ax + 0.25, Y, az + 0.25, ax + 0.33, Y + tall, az + 0.33, 'metal'); for (const yy of [tall * 0.6, tall * 0.85]) abox(C, gk, ax - 0.2, Y + yy, az + 0.27, ax + 0.78, Y + yy + 0.04, az + 0.31, 'metal'); bar(C, gk, 'iron', [ax + 0.29, Y + tall * 0.7, az + 0.29], [ax - 0.4, Y, az + 0.6], 0.02); }
      else { const p = spot(0.8, 0.8); if (!p) continue; const [ax, az] = p; dish(C, gk, ax + 0.4, Y, az + 0.4, 0.7); }
      stats.roofs++;
    }
    // a timber water tank on tall brick blocks (the San Francisco skyline signature)
    if ((brick || floors >= 4) && floors >= 3 && w >= 6 && d >= 6 && seed < 0.55) { const p = spot(2.4, 2.4, 20); if (p) { tank(C, gk, p[0] + 1.2, Y, p[1] + 1.2); stats.roofs++; stats.tanks++; } }
    // solar panels on some low roofs
    if (floors <= 2 && w * d > 60 && seed > 0.7) for (let i = 0; i < 3; i++) { const p = spot(1.8, 1.1); if (!p) break; const [ax, az] = p; aquad(C, gk, 'solar', [ax, Y + 0.25, az + 1.1], [ax + 1.8, Y + 0.25, az + 1.1], [ax + 1.8, Y + 0.7, az], [ax, Y + 0.7, az]); abox(C, gk, ax + 0.1, Y, az + 0.4, ax + 1.7, Y + 0.25, az + 0.5, 'metalDk'); }
  } else {
    // pitched roofs: a chimney on the ridge, a gutter along the camera-side eaves, sometimes a dish on the gable wall
    const rh = R0.h || Math.min(w, d) * 0.45, e = R0.eave ?? 0.4, ridge = R0.ridge || (w >= d ? 'x' : 'z');
    if (seed < 0.75 && type === 'gable') {
      const cx = ridge === 'x' ? x + w * (0.22 + seed * 0.5) : x + w / 2 + (seed < 0.4 ? -0.3 : 0.3), cz = ridge === 'x' ? z + d / 2 + 0.3 : z + d * (0.3 + seed * 0.3);
      abox(C, gk, cx - 0.32, H, cz - 0.32, cx + 0.32, H + rh + 0.55, cz + 0.32, { side: 'brickCap', top: 'chimTop' });
      abox(C, gk, cx - 0.38, H + rh + 0.4, cz - 0.38, cx + 0.38, H + rh + 0.5, cz + 0.38, 'conc');
      stats.roofs++;
    }
    const gut = 'metal';
    if (type === 'gable' && ridge === 'x') abox(C, gk, x - e, H - 0.32, z + d + e - 0.02, x + w + e, H - 0.18, z + d + e + 0.12, gut);
    if (type === 'gable' && ridge === 'z') abox(C, gk, x + w + e - 0.02, H - 0.32, z - e, x + w + e + 0.12, H - 0.18, z + d + e, gut);
    if (seed > 0.72) { dish(C, gk, x + w + 0.25, H - 0.9, z + d * 0.35, 0.6, true); stats.roofs++; }
  }
  // ---- façades (camera side: south and east)
  const faces = [['s', x, z + d, x + w, z + d], ['e', x + w, z + d, x + w, z]];
  // drainpipes at the front corners (with a shoe at the foot and a hopper at the top)
  if (H > 3.5 && seed > 0.2) {
    const pc = sid || wallKey.startsWith('plaster') ? 'pipeW' : 'pipe';
    for (const px of seed > 0.6 ? [x + w - 0.16, x + 0.16] : [x + w - 0.16]) {
      if (wins.some((W) => W.sd === 's' && Math.abs(W.x - px) < W.w / 2 + 0.15) || !exposed('s', px, z + d)) continue;
      abox(C, gk, px - 0.06, 0.12, z + d + 0.03, px + 0.06, H - 0.15, z + d + 0.15, pc);
      abox(C, gk, px - 0.1, H - 0.4, z + d + 0.01, px + 0.1, H - 0.1, z + d + 0.2, pc);
      abox(C, gk, px - 0.08, 0, z + d + 0.03, px + 0.08, 0.14, z + d + 0.32, pc);
      stats.facade++;
    }
  }
  // meters by the base of the street wall
  if (seed > 0.35 && !enter) {
    const mx = x + w * (seed > 0.65 ? 0.08 : 0.92) + (seed > 0.65 ? 0.3 : -0.3);
    if (exposed('s', mx, z + d) && !wins.some((W) => W.sd === 's' && W.y < 2 && Math.abs(W.x - mx) < W.w / 2 + 0.3) && !R.doors.some(([dx, dz]) => Math.abs(dx - mx) < 1 && Math.abs(dz - (z + d)) < 0.5)) {
      abox(C, gk, mx - 0.18, 0.6, z + d, mx + 0.18, 1.0, z + d + 0.16, { side: 'metalDk', s: 'meter', top: 'metalDk' });
      abox(C, gk, mx - 0.24, 1.15, z + d, mx + 0.24, 1.7, z + d + 0.14, { side: 'metalDk', s: 'elec', top: 'metalDk' });
      abox(C, gk, mx - 0.03, 1.7, z + d + 0.03, mx + 0.03, H * 0.6, z + d + 0.08, 'pipe');
      stats.facade++;
    }
  }
  // splash grime along the foot of the exposed street walls, rain stains running down from the parapet
  for (const [sd, lo, hi] of [['s', x, x + w], ['e', z, z + d]]) {
    const wl = sd === 's' ? z + d : x + w, at = (sv) => (sd === 's' ? [sv, wl] : [wl, sv]);
    for (let sv = lo; sv < hi - 0.05; sv += 1) {
      const sw = Math.min(1, hi - sv); if (!exposed(sd, ...at(sv + sw / 2))) continue;
      const [px, pz] = at(sv + sw / 2); wallDecal(C, enter ? B.gk(0, 'front') : gk, 'grimeBase', px, 0.3, pz, sd, sw, 0.75, 0.01);
    }
    if (type === 'flat' && H > 4) for (let sv = lo + 0.8 + hsh(lo, wl) * 2; sv < hi - 0.8; sv += 2.5 + hsh(sv, wl) * 4) {
      if (!exposed(sd, ...at(sv))) continue;
      const [px, pz] = at(sv), len = 1.2 + hsh(sv, H) * 2.2; wallDecal(C, gk, 'drip', px, H - len, pz, sd, 0.7, len, 0.011);
    }
  }
  // per window: grime streaks under sills, window AC units, flower boxes
  for (const W of wins) {
    if ((W.sd !== 's' && W.sd !== 'e') || !exposed(W.sd, W.x, W.z)) continue;
    const k = Math.floor(W.y / fh), q = hsh(W.x, W.z, W.y), g = enter ? B.gk(k, 'front') : gk;
    const out = (o) => (W.sd === 's' ? [W.x, W.z + o] : [W.x + o, W.z]);
    if (q < 0.55 && W.y > 0.6) { const [px, pz] = out(0); wallDecal(C, g, q < 0.3 ? 'streak' : 'rust', px, W.y - 0.95, pz, W.sd, W.w * (q < 0.3 ? 0.85 : 0.5), 0.88, 0.014); }
    if (k >= 1 && !enter && q > 0.86) {     // a window AC unit poking out of the lower sash
      const aw = Math.min(0.7, W.w * 0.62), y0 = W.y + 0.12, y1 = y0 + 0.42;
      if (W.sd === 's') abox(C, g, W.x - aw / 2, y0, W.z - 0.05, W.x + aw / 2, y1, W.z + 0.4, { side: 'acSide', s: 'acFront', top: 'metal' });
      else abox(C, g, W.x - 0.05, y0, W.z - aw / 2, W.x + 0.4, y1, W.z + aw / 2, { side: 'acSide', e: 'acFront', top: 'metal' });
      const [px, pz] = out(0); wallDecal(C, g, 'rust', px, y0 - 0.9, pz, W.sd, 0.35, 0.9, 0.016);
      stats.facade++;
    } else if (k >= 1 && q > 0.74 && q <= 0.86) {   // a flower box under the sill
      const fw = W.w + 0.1, y0 = W.y - 0.32, y1 = W.y - 0.1;
      if (W.sd === 's') abox(C, g, W.x - fw / 2, y0, W.z, W.x + fw / 2, y1, W.z + 0.26, { side: 'flowerBox', top: 'flowers' });
      else abox(C, g, W.x, y0, W.z - fw / 2, W.x + 0.26, y1, W.z + fw / 2, { side: 'flowerBox', top: 'flowers' });
      stats.facade++;
    }
  }
  // fire escapes on tall brick or stucco blocks (non-enterable), on an open south or east face with two window columns
  if (!enter && !sid && floors >= 3 && (brick || wallKey.startsWith('plaster') || wallKey.startsWith('concrete'))) {
    for (const sd of seed < 0.5 ? ['s', 'e'] : ['e', 's']) {
      const cols = [...new Set(wins.filter((W) => W.sd === sd && W.y > fh * 0.9).map((W) => Math.round((sd === 's' ? W.x : W.z) * 10) / 10))].sort((a, b) => a - b);
      if (cols.length < 2) continue;
      const lo = sd === 's' ? x : z, hi = sd === 's' ? x + w : z + d, c = cols[1], s0 = Math.max(lo + 0.3, c - 1.6), s1 = Math.min(hi - 0.3, c + 1.6);
      const wallAt = (sv) => (sd === 's' ? [sv, z + d] : [x + w, sv]);
      if (s1 - s0 < 2.4 || ![0, 0.5, 1].every((t) => exposed(sd, ...wallAt(s0 + (s1 - s0) * t), 1.3))) continue;
      fireEscape(C, gk, sd, sd === 's' ? z + d : x + w, s0, s1, floors, fh);
      stats.facade++; stats.escapes++;
      break;
    }
  }
}
/** a black-iron fire escape on face sd ('s': wall at z = wl, spans x s0..s1; 'e': wall at x = wl, spans z s0..s1):
 *  a grated platform and railing at every upper storey, alternating stairs between them, a drop ladder at the bottom */
function fireEscape(C, gk, sd, wl, s0, s1, floors, fh) {
  const dep = 0.95, P = (sv, y, o) => (sd === 's' ? [sv, y, wl + o] : [wl + o, y, sv]);
  const box = (sa, ya, oa, sb, yb, ob, f) => { const a = P(sa, ya, oa), b = P(sb, yb, ob); abox(C, gk, Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2]), f); };
  for (let k = 1; k < floors; k++) {
    const y = k * fh + 0.62;
    box(s0, y - 0.06, 0, s1, y, dep, { side: 'iron', top: 'grate', bottom: 'grate' });
    box(s0, y + 0.92, dep - 0.04, s1, y + 0.97, dep, 'iron'); box(s0, y + 0.45, dep - 0.03, s1, y + 0.48, dep, 'iron');
    for (const sv of [s0, s1]) { box(sv - 0.02, y, dep - 0.04, sv + 0.02, y + 0.97, dep, 'iron'); box(sv - 0.02, y + 0.92, 0, sv + 0.02, y + 0.97, dep, 'iron'); box(sv - 0.02, y, 0, sv + 0.02, y + 0.97, 0.04, 'iron'); }
    for (let sv = s0 + 0.25; sv < s1 - 0.1; sv += 0.25) box(sv - 0.012, y, dep - 0.03, sv + 0.012, y + 0.94, dep - 0.01, 'iron');
    if (k < floors - 1) {
      const up = k % 2 ? 1 : -1, a = up > 0 ? s0 + 0.15 : s1 - 0.15, b = up > 0 ? s1 - 0.9 : s0 + 0.9, yt = (k + 1) * fh + 0.56;
      for (const o of [0.25, 0.75]) bar(C, gk, 'iron', P(a, y, o), P(b, yt, o), 0.05);
      aquad(C, gk, 'ladder', P(a, y + 0.02, 0.75), P(a, y + 0.02, 0.25), P(b, yt + 0.02, 0.25), P(b, yt + 0.02, 0.75));
      aquad(C, gk, 'ladder', P(a, y + 0.02, 0.25), P(a, y + 0.02, 0.75), P(b, yt + 0.02, 0.75), P(b, yt + 0.02, 0.25));
    }
  }
  const lv = s1 - 0.5, o = dep - 0.1;
  aquad(C, gk, 'ladder', P(lv - 0.25, fh - 0.6, o), P(lv + 0.25, fh - 0.6, o), P(lv + 0.25, fh + 0.6, o), P(lv - 0.25, fh + 0.6, o));
  aquad(C, gk, 'ladder', P(lv + 0.25, fh - 0.6, o), P(lv - 0.25, fh - 0.6, o), P(lv - 0.25, fh + 0.6, o), P(lv + 0.25, fh + 0.6, o));
}
/** grid cells (1 m) of a flat roof that something already stands on */
export function roofOccupancy(C, B, H) {
  const occ = new Set(), G = C.groups.get(`b${B.id}:roof`);
  if (G) for (const A of G.values()) for (let i = 0; i < A.P.length; i += 3) { const y = A.P[i + 1]; if (y > H + 0.12) occ.add(Math.floor(A.P[i] - B.x) + ',' + Math.floor(A.P[i + 2] - B.z)); }
  // the roof rectangle of anything tall: also mark the cells between vertices of big boxes
  if (G) for (const A of G.values()) for (let q = 0; q + 3 < A.P.length / 3; q += 4) {
    let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9, my = -1e9;
    for (let v = q; v < q + 4; v++) { const px = A.P[v * 3], py = A.P[v * 3 + 1], pz = A.P[v * 3 + 2]; mnx = Math.min(mnx, px); mxx = Math.max(mxx, px); mnz = Math.min(mnz, pz); mxz = Math.max(mxz, pz); my = Math.max(my, py); }
    if (my > H + 0.12 && mxx - mnx < B.w - 0.6 && mxz - mnz < B.d - 0.6) for (let i = Math.floor(mnx - B.x); i <= Math.floor(mxx - B.x); i++) for (let k = Math.floor(mnz - B.z); k <= Math.floor(mxz - B.z); k++) occ.add(i + ',' + k);
  }
  return occ;
}
/** swap a building's plain concrete flat roof for the membrane texture (only the horizontal quads at roof height) */
function swapRoof(C, B, H) {
  const G = C.groups.get(`b${B.id}:roof`); if (!G) return;
  const key = TX.concrete('#9a968e').userData.key, A = G.get(key); if (!A || A.I.length !== A.P.length / 2) return;   // quads only
  const mem = TX.roofMembrane('#8c8882'), [ow, oh] = A.tex.userData.size, [nw, nh] = mem.userData.size;
  const keepA = { tex: A.tex, P: [], N: [], U: [], I: [] }, M = C.acc(`b${B.id}:roof`, mem);
  for (let q = 0; q < A.P.length / 12; q++) {
    const flat = A.N[q * 12 + 1] > 0.99 && Math.abs(A.P[q * 12 + 1] - H) < 0.1, T = flat ? M : keepA, base = T.P.length / 3;
    for (let v = 0; v < 4; v++) { const i = q * 4 + v; T.P.push(A.P[i * 3], A.P[i * 3 + 1], A.P[i * 3 + 2]); T.N.push(A.N[i * 3], A.N[i * 3 + 1], A.N[i * 3 + 2]); T.U.push(flat ? A.U[i * 2] * ow / nw : A.U[i * 2], flat ? A.U[i * 2 + 1] * oh / nh : A.U[i * 2 + 1]); }
    T.I.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  if (keepA.P.length) { A.P = keepA.P; A.N = keepA.N; A.U = keepA.U; A.I = keepA.I; } else G.delete(key);
}
/** a satellite dish: a mast and a tilted square dish facing south-west-up (wall: a short arm off a wall) */
function dish(C, gk, x, y, z, s = 0.7, wall = false) {
  const hs = s / 2, mast = wall ? 0.05 : 0.55;
  if (!wall) abox(C, gk, x - 0.03, y, z - 0.03, x + 0.03, y + mast, z + 0.03, 'metal');
  else abox(C, gk, x - 0.25, y - 0.03, z - 0.03, x, y + 0.03, z + 0.03, 'metal');
  const c = [x, y + mast + hs * 0.6, z], f = [0.55, 0.45, 0.7], up = [0, 1, 0];
  const fl = Math.hypot(...f), F = f.map((v) => v / fl);
  let ax = [up[1] * F[2] - up[2] * F[1], up[2] * F[0] - up[0] * F[2], up[0] * F[1] - up[1] * F[0]]; const al = Math.hypot(...ax); ax = ax.map((v) => (v / al) * hs);
  const ay = [F[1] * ax[2] - F[2] * ax[1], F[2] * ax[0] - F[0] * ax[2], F[0] * ax[1] - F[1] * ax[0]];
  const P = (a, b) => [c[0] + ax[0] * a + ay[0] * b, c[1] + ax[1] * a + ay[1] * b, c[2] + ax[2] * a + ay[2] * b];
  aquad(C, gk, 'dish', P(-1, -1), P(1, -1), P(1, 1), P(-1, 1)); aquad(C, gk, 'metalDk', P(1, -1), P(-1, -1), P(-1, 1), P(1, 1));
  bar(C, gk, 'metal', c, [c[0] + F[0] * 0.4, c[1] + F[1] * 0.4, c[2] + F[2] * 0.4], 0.025);
}
/** a timber water tank on an iron stand with a conical cap */
function tank(C, gk, x, y, z) {
  const R = 1.0, h0 = y + 1.1, h1 = h0 + 1.9, n = 8;
  for (const [dx, dz] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) abox(C, gk, x + dx - 0.06, y, z + dz - 0.06, x + dx + 0.06, h0, z + dz + 0.06, 'iron');
  abox(C, gk, x - 1.0, h0 - 0.1, z - 1.0, x + 1.0, h0, z + 1.0, { side: 'iron', top: 'wood' });
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 6.283, a1 = ((i + 1) / n) * 6.283, p0 = [x + Math.cos(a0) * R, z + Math.sin(a0) * R], p1 = [x + Math.cos(a1) * R, z + Math.sin(a1) * R];
    aquad(C, gk, 'tankStave', [p1[0], h0, p1[1]], [p0[0], h0, p0[1]], [p0[0], h1, p0[1]], [p1[0], h1, p1[1]]);
    aquad(C, gk, 'tankTop', [p1[0] * 1.08 - x * 0.08, h1, p1[1] * 1.08 - z * 0.08], [p0[0] * 1.08 - x * 0.08, h1, p0[1] * 1.08 - z * 0.08], [x, h1 + 0.75, z], [x, h1 + 0.75, z]);
  }
  bar(C, gk, 'iron', [x + R, h0 + 0.2, z], [x + R, h1 + 0.1, z], 0.04);
}

// ---------------------------------------------------------------- utility poles, wires, trolley lines
function wire(C, a, b, sag = 0.5, t = 0.035, n = 8) {
  const tex = TX.solid('#1c1c22');
  for (let i = 0; i < n; i++) {
    const s0 = i / n, s1 = (i + 1) / n, P = (s) => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s - Math.sin(s * Math.PI) * sag, a[2] + (b[2] - a[2]) * s];
    const p = P(s0), q = P(s1), dx = q[0] - p[0], dz = q[2] - p[2], L = Math.hypot(dx, dz) || 1, nx = (-dz / L) * t, nz = (dx / L) * t;
    C.quad('props', tex, [p[0] - nx, p[1], p[2] - nz], [q[0] - nx, q[1], q[2] - nz], [q[0] + nx, q[1], q[2] + nz], [p[0] + nx, p[1], p[2] + nz]);
    C.quad('props', tex, [p[0], p[1] - t, p[2]], [q[0], q[1] - t, q[2]], [q[0], q[1] + t, q[2]], [p[0], p[1] + t, p[2]]);
  }
}
function wires(C, R, r, free, prop, stats) {
  // Sunset Row and Cypress Lane: a pole every ~16 m on the south-side sidewalk, three wires sagging between
  for (const zc of [165.4, 135.4]) {
    let last = null;
    for (let x = 3; x < 103; x += 14 + r() * 4) {
      if (!free(x, zc, 0.4, 0.4, { m: 0.05, pd: 0.7, keep: -0.6 })) continue;
      prop('upole', x, zc, { yaw: Math.PI / 2, pr: 0.3 });
      if (last && x - last < 24) for (const [dz, y] of [[-1.05, 7.62], [1.0, 7.62], [-0.75, 6.68], [0.7, 6.68]]) wire(C, [last, y, zc + dz], [x, y, zc + dz], 0.35 + Math.abs(dz) * 0.1);
      last = x; stats.props++;
    }
  }
  // Market Street: trolley wires over both lanes, hung from span wires between poles on the two sidewalks
  for (const [x0, x1] of [[2, 102], [118, 228]]) {
    let prev = null;
    for (let x = x0; x <= x1; x += 18) {
      const ok = free(x, 98.6, 0.4, 0.4, { m: 0.05, pd: 0.6, keep: -0.6 }) && free(x, 109.4, 0.4, 0.4, { m: 0.05, pd: 0.6, keep: -0.6 });
      if (!ok) continue;
      for (const z of [98.6, 109.4]) C.props.push({ kind: 'upole', x, y: 0.12, z, yaw: Math.PI / 2, s: 0.85 });
      C.nav.block(x - 0.15, 98.45, x + 0.15, 98.75, 0); C.nav.block(x - 0.15, 109.25, x + 0.15, 109.55, 0);
      wire(C, [x, 6.9, 98.6], [x, 6.9, 109.4], 0.25, 0.03, 6);
      if (prev !== null) for (const z of [102.4, 102.9, 105.1, 105.6]) wire(C, [prev, 6.75, z], [x, 6.75, z], 0.12, 0.025, 6);
      prev = x; stats.props++;
    }
  }
}
