// Voxel sculpts for the density pass (city/fill.js): storefront clutter, market stalls, café sets under square
// umbrellas, florists' stands, clothes rails, planter strips, roof gardens, string-light bulbs, a Tokonmon statue,
// a square fountain, swaying banners, weeds in the cracks, and furniture for under-furnished rooms. 16 voxels per
// metre; colours are laid out as ramps (light tops, darker sides), and the mesher adds its painted ramp and occlusion
// (voxprops.js paintRamps). No circles: everything round in life (fruit, pots, basins) is sculpted square-ish.
import { PROPS } from './voxprops.js';
import { GLOW } from '../fine.js';

const add = (kind, size, r, build, o = {}) => { PROPS[kind] = Object.assign({ size, r, build }, o); };
const pick = (r, a) => a[Math.floor(r() * a.length)];
/** a wooden crate (open top) at x0, z0 of w × d × h voxels, filled with produce of colours cs to the brim */
function crate(F, r, x0, y0, z0, w, d, h, cs) {
  const wd = F.c('#9a6a3e'), wl = F.c('#b8844e'), wk = F.c('#6a4628');
  F.box(x0, y0, z0, x0 + w - 1, y0 + h - 1, z0 + d - 1, (x, y, z) => (x === x0 || x === x0 + w - 1 || z === z0 || z === z0 + d - 1 ? ((y - y0) % 3 === 2 ? wk : (x + z) % 5 === 0 ? wl : wd) : null));
  F.box(x0, y0, z0, x0 + w - 1, y0, z0 + d - 1, wk);
  if (!cs) return;
  const C = cs.map((c) => F.c(c));
  for (let z = z0 + 1; z < z0 + d - 1; z += 2) for (let x = x0 + 1; x < x0 + w - 1; x += 2) { const c = C[Math.floor(r() * C.length)]; F.box(x, y0 + h - 2, z, Math.min(x + 1, x0 + w - 2), y0 + h - 1 + (r() < 0.4 ? 1 : 0), Math.min(z + 1, z0 + d - 2), c); }
}
// ---- storefront produce: a two-tier stand of crates (oranges, apples, greens, aubergines), a slate price card
add('fl_produce', [26, 18, 14], [1.6, 0.9], (F, r) => {
  const leg = F.c('#5a3e26');
  for (const x of [0, 25]) F.box(x, 0, 0, x, 9, 0, leg), F.box(x, 0, 13, x, 13, 13, leg);
  F.box(0, 7, 0, 25, 7, 6, F.c('#8a5a34')); F.box(0, 11, 7, 25, 11, 13, F.c('#8a5a34'));
  const sets = [['#e8822a', '#f0962e', '#d06a1e'], ['#c8322a', '#de4a32', '#a82420'], ['#5aa03a', '#78b84a', '#3e8030'], ['#6a2a6a', '#82347e'], ['#f0d040', '#e8c030']];
  for (let i = 0; i < 4; i++) crate(F, r, i * 6 + 1, 8, 0, 6, 6, 4, sets[(i + 1) % 5]);
  for (let i = 0; i < 4; i++) crate(F, r, i * 6 + 1, 12, 7, 6, 6, 4, sets[(i + 3) % 5]);
  F.box(10, 16, 13, 15, 17, 13, F.c('#2a2a2e')); F.box(11, 17, 13, 14, 17, 13, F.c('#f4f0e6'));
});
// ---- a florist's stand: three tiers of square buckets, bunches of blooms
add('fl_flowers', [22, 20, 12], [1.4, 0.8], (F, r) => {
  const st = F.c('#3a4a3a'), bk = F.c('#7a8a90'), stem = F.c('#3e7a32');
  for (let t = 0; t < 3; t++) { const y = t * 5, z = t * 4; F.box(0, y, z, 21, y + 1, z + 3, st); for (let x = 1; x < 21; x += 5) { F.box(x, y + 2, z, x + 3, y + 4, z + 3, bk); const bl = F.c(pick(r, ['#e8506a', '#f8d84a', '#f4f0f4', '#b07ae8', '#f08a2a', '#e888aa'])); F.box(x + 1, y + 5, z + 1, x + 2, y + 6, z + 2, stem); F.box(x, y + 7, z, x + 3, y + 8, z + 3, bl); F.box(x + 1, y + 9, z + 1, x + 2, y + 9, z + 2, bl); } }
  for (const x of [0, 21]) F.box(x, 0, 11, x, 14, 11, st);
});
// ---- a clothes rail: a steel frame, hangers, shirts and jackets in a run of colours, a mirror at the end
add('fl_rack', [24, 26, 8], [1.5, 0.5], (F, r) => {
  const m = F.c('#9aa0a8'), dk = F.c('#4a4e56');
  for (const x of [0, 23]) { F.box(x, 0, 1, x, 24, 1, m); F.box(x - (x ? 2 : 0), 0, 0, x + (x ? 0 : 2), 0, 6, dk); }
  F.box(0, 24, 1, 23, 24, 1, m);
  for (let x = 2; x < 22; x += 3) { const c = pick(r, ['#c83a3a', '#2a4a8a', '#e8e0d0', '#3a6a4a', '#d8a030', '#6a3a6a', '#2a2a30']), C = F.c(c); F.box(x, 23, 1, x, 23, 1, dk); F.box(x - 1, 12 + Math.floor(r() * 4), 0, x + 1, 22, 3, C); }
});
// ---- a square market umbrella over a café table and two chairs (striped canopy, a weighted square foot)
add('fl_cafe', [36, 40, 36], [1.2, 1.2], (F, r) => {
  const pole = F.c('#e8e4dc'), A = F.c(pick(r, ['#c83a3a', '#2a6a5a', '#2a4a8a', '#d89a2a'])), B = F.c('#f0ece4'), tb = F.c('#3a3a40'), seat = F.c('#7a4a2a');
  F.box(16, 0, 16, 19, 1, 19, F.c('#5a5a5e')); F.box(17, 2, 17, 18, 34, 18, pole);
  for (let y = 0; y < 6; y++) { const h = 16 - y * 3; F.box(18 - h, 34 + y, 18 - h, 17 + h, 34 + y, 17 + h, (x, yy, z) => ((Math.abs(x - 17.5) > Math.abs(z - 17.5) ? x : z) & 4 ? A : B)); }
  F.box(2, 33, 2, 33, 33, 33, (x, y, z) => (((x + z) >> 2) & 1 ? A : null));
  F.box(13, 0, 13, 22, 0, 22, tb); F.box(17, 0, 17, 18, 11, 18, tb); F.box(11, 12, 11, 24, 12, 24, F.c('#e8e0d0'));
  for (const [x, z] of [[4, 15], [28, 15]]) { F.box(x, 0, z, x + 4, 7, z + 4, seat); F.box(x, 8, z, x + 4, 7, z + 4, seat); F.box(x + (x < 17 ? 0 : 4), 8, z, x + (x < 17 ? 0 : 4), 14, z + 4, seat); F.box(x, 0, z, x + 4, 0, z + 4, tb); }
  F.box(15, 13, 15, 16, 14, 16, F.c('#f4f0e6'));
});
// ---- a food stall: a timber counter, a striped awning on posts, a sign board, steamers and woks, a lamp that glows
add('fl_stall', [40, 46, 24], [2.5, 1.5], (F, r) => {
  const wd = F.c('#8a5a34'), wl = F.c('#a8743e'), post = F.c('#5a3a22'), A = F.c(pick(r, ['#c8322a', '#2a6a4a', '#d89a2a'])), B = F.c('#f4ece0'), steel = F.c('#b8bcc4'), dark = F.c('#2a2a2e');
  F.box(1, 0, 4, 38, 15, 15, (x, y) => (y === 15 ? wl : (x % 6 === 0 ? post : wd)));
  F.box(0, 16, 3, 39, 16, 16, wl);
  for (const [x, z] of [[1, 4], [38, 4], [1, 22], [38, 22]]) F.box(x, 0, z, x, 38, z, post);
  for (let k = 0; k < 6; k++) F.box(0, 38 + k, 2 + k * 2, 39, 38 + k, 23, (x) => ((x >> 2) & 1 ? A : B));
  for (let x = 0; x < 40; x += 4) F.box(x, 35, 23, x + 1, 37, 23, (x >> 2) & 1 ? A : B);
  F.box(8, 40, 0, 31, 45, 1, F.c('#2a2228')); F.box(10, 42, 0, 29, 43, 0, F.c('#f0c040'));
  for (let i = 0; i < 3; i++) { const x = 5 + i * 8; for (let t = 0; t < 3; t++) F.box(x, 17 + t * 2, 6, x + 5, 18 + t * 2, 11, t & 1 ? F.c('#c8a060') : F.c('#b08848')); }
  F.box(29, 17, 6, 35, 19, 12, dark); F.box(30, 20, 7, 34, 20, 11, steel);
  F.box(19, 32, 12, 21, 34, 14, F.c('#ffd890', GLOW)); F.box(20, 35, 13, 20, 38, 13, dark);
  for (let i = 0; i < 4; i++) F.box(4 + i * 9, 16, 15, 7 + i * 9, 18, 16, F.c(pick(r, ['#f4f0e6', '#e8c070', '#c83a3a'])));
});
// ---- a planter strip: a long concrete trough with clipped box, lavender and bright annuals
add('fl_planter', [40, 12, 10], [2.5, 0.6], (F, r) => {
  const c = F.c('#a8a49a'), c2 = F.c('#8a867e'), soil = F.c('#4a3424'), G = ['#3a6a32', '#4a7e3a', '#5a9046'].map((x) => F.c(x));
  F.box(0, 0, 0, 39, 5, 9, (x, y) => (y === 5 ? F.c('#bcb8ae') : y === 0 ? c2 : c)); F.box(1, 5, 1, 38, 5, 8, soil);
  for (let x = 1; x < 39; x += 2) for (let z = 1; z < 9; z += 2) { const h = 6 + Math.floor(r() * 4); F.box(x, 6, z, x + 1, h, z + 1, G[Math.floor(r() * 3)]); if (r() < 0.35) F.box(x, h + 1, z, x + 1, h + 1, z + 1, F.c(pick(r, ['#b07ae8', '#f8d84a', '#e8506a', '#f4f0f4', '#f08a2a']))); }
});
// ---- a roof garden: two timber raised beds of greens and tomatoes on a trellis, a bench, a watering can
add('fl_roofgarden', [44, 24, 32], [2.8, 2.0], (F, r) => {
  const wd = F.c('#8a6a42'), soil = F.c('#4a3424'), G = ['#3e7a32', '#4e8e3a', '#62a044'].map((x) => F.c(x)), tom = F.c('#d83a2a'), tr = F.c('#6a5034');
  for (const z0 of [1, 18]) { F.box(1, 0, z0, 42, 5, z0 + 11, wd); F.box(2, 5, z0 + 1, 41, 5, z0 + 10, soil); for (let x = 3; x < 41; x += 3) for (let z = z0 + 2; z < z0 + 10; z += 3) { const h = 7 + Math.floor(r() * 6); F.box(x, 6, z, x + 1, h, z + 1, G[Math.floor(r() * 3)]); if (r() < 0.25) F.box(x, h - 1, z + 1, x, h - 1, z + 1, tom); } }
  for (let x = 2; x < 42; x += 8) F.box(x, 6, 12, x, 22, 12, tr); F.box(2, 22, 12, 41, 22, 12, tr); F.box(2, 14, 12, 41, 14, 12, tr);
  F.box(30, 0, 14, 36, 1, 16, F.c('#4a7a9a'));
});
// ---- a bulb of a string of lights (they hang in runs over roofs and squares)
add('fl_bulb', [2, 3, 2], 0, (F) => { F.box(0, 2, 0, 1, 2, 1, F.c('#2a2a2e')); F.box(0, 0, 0, 1, 1, 1, F.c('#ffd890', GLOW)); }, { noShadow: true });
// ---- a Tokonmon statue: a chunky round-eared creature (all square voxels) in bronze on a stepped granite plinth
add('fl_statue', [40, 64, 40], [1.4, 1.4], (F, r) => {
  const g1 = F.c('#9a948a'), g2 = F.c('#b4aea2'), br = F.c('#7a5a32'), br2 = F.c('#9a7440'), brd = F.c('#5a4026'), pat = F.c('#5a8a6a'), eye = F.c('#2a2018');
  F.box(0, 0, 0, 39, 3, 39, g1); F.box(4, 4, 4, 35, 7, 35, g2); F.box(8, 8, 8, 31, 23, 31, g1); F.box(7, 23, 7, 32, 25, 32, g2);
  F.box(12, 14, 31, 27, 18, 31, F.c('#c8b070'));
  const bz = (x, y, z) => ((x + y * 2 + z) % 9 === 0 ? pat : y > 40 ? br2 : br);
  F.box(12, 26, 13, 27, 40, 27, bz);                 // body
  F.box(10, 26, 14, 13, 30, 22, brd); F.box(26, 26, 14, 29, 30, 22, brd);     // feet
  F.box(11, 40, 12, 28, 53, 28, bz);                 // head
  F.box(11, 54, 14, 15, 60, 18, br2); F.box(24, 54, 14, 28, 60, 18, br2);     // ears
  F.box(12, 57, 15, 14, 59, 17, pat); F.box(25, 57, 15, 27, 59, 17, pat);
  F.box(14, 46, 28, 16, 48, 28, eye); F.box(23, 46, 28, 25, 48, 28, eye); F.box(18, 43, 28, 21, 44, 28, brd);
  F.box(8, 32, 18, 11, 36, 21, br); F.box(28, 32, 18, 31, 36, 21, br);       // paws
  F.box(18, 28, 6, 21, 31, 12, br); F.box(18, 32, 4, 21, 38, 7, br2);         // tail
});
// ---- a square fountain: a stepped stone basin, water, a square pillar with two tiers, spouts and spray
add('fl_fountain', [64, 44, 64], [3.6, 3.6], (F, r) => {
  const s1 = F.c('#b8b0a2'), s2 = F.c('#d0c8b8'), s3 = F.c('#9a9284'), w1 = F.c('#5a86a8'), w2 = F.c('#7aa6c4'), foam = F.c('#e8f0f4');
  F.box(0, 0, 0, 63, 1, 63, s3); F.box(2, 2, 2, 61, 7, 61, (x, y) => (y === 7 ? s2 : s1)); F.box(5, 2, 5, 58, 7, 58, null);
  F.box(5, 2, 5, 58, 5, 58, (x, y, z) => ((x * 3 + z * 5) % 11 === 0 ? w2 : w1));
  F.box(27, 2, 27, 36, 26, 36, (x, y) => (y % 6 === 0 ? s2 : s1)); F.box(20, 18, 20, 43, 19, 43, s2); F.box(22, 20, 22, 41, 20, 41, w1); F.box(24, 32, 24, 39, 33, 39, s2); F.box(26, 26, 26, 37, 31, 37, s1); F.box(28, 34, 28, 35, 34, 35, w2);
  F.box(30, 35, 30, 33, 42, 33, foam);
  for (const [x, z] of [[26, 31], [37, 31], [31, 26], [31, 37]]) { for (let t = 0; t < 8; t++) F.set(x + Math.sign(x - 31.5) * t, 17 - Math.floor(t * t * 0.18), z + Math.sign(z - 31.5) * t, foam); }
  for (let i = 0; i < 40; i++) { const x = 8 + Math.floor(r() * 48), z = 8 + Math.floor(r() * 48); if (x > 18 && x < 45 && z > 18 && z < 45) continue; F.set(x, 6, z, foam); }
});
// ---- a banner on a pole: a vertical pennant in district colours with a pixel emblem (it sways in the wind)
for (const [k, a, b] of [['fl_bannerR', '#c8322a', '#f0c040'], ['fl_bannerB', '#2a4a8a', '#f0ece4'], ['fl_bannerG', '#2a6a4a', '#f0d070'], ['fl_bannerP', '#8a3a7a', '#f4e8f0']]) {
  add(k, [10, 72, 4], 0.15, (F) => {
    const pole = F.c('#3a3e44'), A = F.c(a), B = F.c(b), em = F.c('#f8f4e8');
    F.box(1, 0, 1, 2, 71, 2, pole); F.box(0, 0, 0, 3, 1, 3, pole); F.box(1, 70, 1, 9, 70, 2, pole);
    F.box(3, 44, 2, 9, 69, 2, (x, y) => (y < 47 ? B : (y % 8 < 2 ? B : A)));
    F.box(4, 56, 2, 8, 62, 2, em); F.box(5, 58, 2, 7, 60, 2, A); F.box(4, 63, 2, 4, 64, 2, em); F.box(8, 63, 2, 8, 64, 2, em);
    for (const x of [3, 5, 7, 9]) F.box(x, 42, 2, x, 43, 2, B);
  }, { sway: true, tree: true });
}
// ---- grass and weeds in the cracks (a tiny flat tuft cluster; no shadow, no collision)
add('fl_weeds', [12, 5, 12], 0, (F, r) => { const G = ['#4a7a32', '#5e8e3a', '#3a6a2a', '#7a9a44'].map((x) => F.c(x)); for (let i = 0; i < 14; i++) { const x = 2 + Math.floor(r() * 8), z = 2 + Math.floor(r() * 8), h = 1 + Math.floor(r() * 4); F.box(x, 0, z, x, h, z, G[i & 3]); if (r() < 0.2) F.set(x, h + 1, z, F.c('#f8e070')); } }, { noShadow: true });
// ---- interior furniture for bare rooms: a bookcase, a sideboard with a plant and a lamp, a stack of boxes, an indoor palm
add('fl_bookcase', [16, 34, 6], [1.0, 0.4], (F, r) => {
  const wd = F.c('#6a4a30'), wl = F.c('#8a6440');
  F.box(0, 0, 0, 15, 33, 5, (x, y, z) => (x === 0 || x === 15 || y % 8 === 0 || y === 33 || z === 0 ? (z === 0 ? wd : wl) : null));
  for (let s = 0; s < 4; s++) for (let x = 1; x < 15;) { const w = 1 + Math.floor(r() * 2), h = 4 + Math.floor(r() * 3), c = F.c(pick(r, ['#c83a3a', '#2a4a8a', '#3a6a4a', '#d8a030', '#e8e0d0', '#6a3a6a', '#2a2a30'])); if (r() < 0.12) { x += 2; continue; } F.box(x, s * 8 + 1, 1, Math.min(14, x + w - 1), s * 8 + h, 4, c); x += w; }
});
add('fl_sideboard', [20, 30, 8], [1.25, 0.5], (F, r) => {
  const wd = F.c('#7a5434'), wl = F.c('#94683e'), knob = F.c('#d8b060');
  F.box(0, 0, 0, 19, 12, 7, (x, y, z) => (y === 12 ? wl : z === 7 && (x === 6 || x === 13) ? F.c('#5a3c24') : wd)); F.box(3, 7, 7, 3, 7, 7, knob); F.box(16, 7, 7, 16, 7, 7, knob);
  F.box(1, 13, 2, 5, 17, 6, F.c('#b8643a')); F.box(0, 18, 1, 6, 24, 7, F.c('#3e7a32')); F.box(2, 25, 3, 4, 27, 5, F.c('#5a9046'));
  F.box(14, 13, 3, 17, 13, 6, F.c('#2a2a2e')); F.box(15, 14, 4, 16, 21, 5, F.c('#2a2a2e')); F.box(13, 22, 2, 18, 26, 7, F.c('#f0e0b0', GLOW));
});
add('fl_boxes', [16, 16, 14], [1.0, 0.9], (F, r) => { const c = F.c('#b88a52'), c2 = F.c('#a07440'), t = F.c('#d8c8a0'); F.box(0, 0, 0, 8, 7, 7, c); F.box(4, 0, 0, 4, 7, 7, t); F.box(8, 0, 2, 15, 6, 12, c2); F.box(2, 8, 1, 11, 15, 8, c); F.box(2, 15, 4, 11, 15, 4, t); F.box(5, 11, 8, 8, 13, 8, F.c(pick(r, ['#4a6a9a', '#c83a3a']))); });
add('fl_palmIn', [12, 28, 12], 0.35, (F, r) => { F.box(2, 0, 2, 9, 6, 9, F.c('#c8b8a0')); F.box(3, 6, 3, 8, 6, 8, F.c('#4a3424')); F.box(5, 7, 5, 6, 16, 6, F.c('#6a5434')); const G = ['#3e7a32', '#4e8e3a', '#2e6a2a'].map((x) => F.c(x)); for (let i = 0; i < 8; i++) { const dx = [1, -1, 0, 0, 1, -1, 1, -1][i], dz = [0, 0, 1, -1, 1, 1, -1, -1][i]; for (let t = 0; t < 6; t++) F.box(5 + dx * t, 16 + Math.floor(t * 0.6) - (t > 3 ? t - 3 : 0), 5 + dz * t, 6 + dx * t, 17 + Math.floor(t * 0.6) - (t > 3 ? t - 3 : 0), 6 + dz * t, G[(i + t) % 3]); } });
// ---- a chair for balconies and terraces
add('fl_chair', [8, 14, 8], 0.3, (F, r) => { const c = F.c(pick(r, ['#2a6a5a', '#c8322a', '#e8e0d0', '#3a3a40'])); F.box(0, 0, 0, 0, 6, 0, c); F.box(7, 0, 0, 7, 6, 0, c); F.box(0, 0, 7, 0, 13, 7, c); F.box(7, 0, 7, 7, 13, 7, c); F.box(0, 7, 0, 7, 7, 7, c); F.box(0, 9, 7, 7, 13, 7, (x, y) => (y % 2 ? c : null)); });
