// Voxel props for the community vegetable garden (gd_*), 16 voxels per metre: individual cabbages, carrots and
// lettuces for the planting rows, the scarecrow, a watering can, a wheelbarrow, a compost bin, seed-packet row
// markers and a garden gate. The cabbages are instanced like any prop; garden.js hides the one you pull up by
// zeroing its instance matrix. Every kind faces +z at yaw 0.
import { PROPS } from './voxprops.js';
import { vox } from './districts/props_dt.js';

const { disc, ball } = vox;
const TAU = Math.PI * 2;
const add = (kind, def) => { PROPS[kind] = def; };
const pal = (F, l) => l.map((c) => F.c(c));
const h3 = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/** a cabbage head: a pale, tightly wrapped heart cupped by broad waxy outer leaves splayed over the soil */
export function cabbage(F, ox = 0, oy = 0, oz = 0, big = 1) {
  const heart = pal(F, ['#e4f4b8', '#cfe89c', '#b8da86', '#a0c872']), wax = pal(F, ['#6aa86a', '#5a9a62', '#4a8656', '#3c724a']), rib = F.c('#d8eec0');
  const cx = ox + 6 * big, cz = oz + 6 * big;
  // outer leaves: five broad cupped leaves lying out over the soil, their tips curling up, pale midribs
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + 0.3;
    for (let t = 1; t <= 6 * big; t++) for (let w = -2; w <= 2; w++) {
      const x = Math.round(cx + Math.cos(a) * t - Math.sin(a) * w * (1 - t / (8 * big))), z = Math.round(cz + Math.sin(a) * t + Math.cos(a) * w * (1 - t / (8 * big))), y = oy + Math.round(t > 4 * big ? (t - 4 * big) * 0.7 : 0);
      F.set(x, y, z, w === 0 && t < 5 * big ? rib : wax[(Math.abs(w) + (t > 4 ? 1 : 0)) % 4]);
    }
  }
  ball(F, cx, oy + 3.4 * big, cz, 3.6 * big, (x, y, z) => { const d = (y - oy) / (6 * big); return d > 0.75 ? heart[0] : (h3(x, y >> 1, z) < 0.18 ? heart[3] : heart[d > 0.45 ? 1 : 2]); });
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; F.set(Math.round(cx + Math.cos(a) * 3.4 * big), oy + Math.round(3 * big), Math.round(cz + Math.sin(a) * 3.4 * big), wax[0]); }
}
add('gd_cabbage', { size: [13, 9, 13], r: 0, build(F) { cabbage(F, 0, 0, 0, 1); } });
// carrot tops: feathery fronds over an orange shoulder just out of the soil
add('gd_carrot', { size: [8, 9, 8], r: 0, noShadow: true, build(F, r) {
  const o = pal(F, ['#e8701a', '#f08a2a']), G = pal(F, ['#3a8a32', '#4a9c3a', '#5aae46']);
  disc(F, 4, 4, 0, 0, 1.6, o[0]); F.set(4, 1, 4, o[1]);
  for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU, h = 5 + Math.floor(r() * 3); for (let t = 1; t <= h; t++) { const x = Math.round(4 + Math.cos(a) * t * 0.35), z = Math.round(4 + Math.sin(a) * t * 0.35); F.set(x, t, z, G[(t + i) % 3]); if (t > 3 && t % 2) F.set(x + (i & 1 ? 1 : -1), t, z, G[2]); } }
} });
// a loose lettuce rosette, frilly pale-green leaves (and a red-leaf variety)
for (const [k, L] of [['gd_lettuce', ['#8ad05a', '#a6e070', '#6ab848', '#c4ec90']], ['gd_lettuceR', ['#a83a4a', '#c85a5a', '#7ab048', '#e07070']]]) add(k, { size: [10, 6, 10], r: 0, noShadow: true, build(F) {
  const C = pal(F, L);
  for (let y = 0; y < 5; y++) { const rr = 4.6 - y * 0.6; for (let a = 0; a < TAU; a += 0.18) { const w = rr + Math.sin(a * 7 + y) * 0.6; F.set(Math.round(5 + Math.cos(a) * w), y, Math.round(5 + Math.sin(a) * w), C[(y + (a * 3 | 0)) % 4]); } }
  disc(F, 5, 5, 0, 3, 2, C[1]); disc(F, 5, 5, 4, 4, 1.2, C[3]);
} });
// a seed-packet row marker on a stick
add('gd_marker', { size: [4, 8, 2], r: 0, noShadow: true, build(F) { const w = F.c('#c8a070'), p = F.c('#f4ece0'), g = F.c('#5aa04a'), o = F.c('#e8701a'); F.box(1, 0, 0, 2, 4, 0, w); F.box(0, 4, 0, 3, 7, 0, p); F.box(1, 5, 0, 2, 6, 0, g); F.set(1, 6, 0, o); } });
// the scarecrow: a post and cross-bar, a burlap head with a stitched face, a straw hat, a patched plaid shirt, straw tufts
add('gd_scarecrow', { size: [26, 36, 8], r: 0.3, build(F) {
  const post = F.c('#6a4428'), bur = pal(F, ['#c8a878', '#b8966a']), st = F.c('#2a1a10'), hat = pal(F, ['#e0c070', '#c8a050', '#a8803a']), band = F.c('#b03a3a');
  const plaid = (x, y) => ((x >> 1) + (y >> 1)) % 2 ? '#3a5aa8' : ((y >> 1) % 2 ? '#c83a3a' : '#e8e0d0'), straw = pal(F, ['#f0d070', '#e0b850']), patch = F.c('#7a9a4a'), jeans = F.c('#3a4a6a');
  F.box(12, 0, 3, 13, 27, 4, post); F.box(2, 19, 3, 23, 20, 4, post);
  F.box(8, 9, 2, 17, 21, 5, (x, y) => F.c(plaid(x, y))); F.box(8, 12, 5, 10, 14, 5, patch);                     // shirt (front patch)
  F.box(1, 18, 2, 7, 21, 5, (x, y) => F.c(plaid(x, y))); F.box(18, 18, 2, 24, 21, 5, (x, y) => F.c(plaid(x, y)));   // sleeves
  for (const x of [0, 25]) { F.box(x, 17, 3, x, 20, 4, straw[0]); F.set(x, 16, 3, straw[1]); }
  F.box(9, 4, 3, 11, 9, 4, jeans); F.box(14, 4, 3, 16, 9, 4, jeans); F.box(9, 2, 3, 11, 3, 4, straw[1]); F.box(14, 2, 3, 16, 3, 4, straw[0]);
  F.box(9, 21, 2, 16, 28, 5, (x, y) => bur[(x + y) & 1]);                                                        // the burlap head
  F.set(10, 26, 6, st); F.set(11, 25, 6, st); F.set(11, 26, 6, 0); F.set(14, 26, 6, st); F.set(13, 25, 6, st);   // X-stitch eyes
  for (let x = 10; x <= 15; x++) F.set(x, 23, 6, x % 2 ? st : bur[0]); F.box(10, 23, 6, 15, 23, 6, (x) => (x % 2 ? st : 0));
  F.box(9, 21, 1, 16, 21, 6, F.c('#9a7a50'));                                                                    // the neck tie of twine
  F.box(5, 28, 0, 20, 28, 7, hat[1]); F.box(8, 29, 1, 17, 32, 6, hat[0]); F.box(8, 29, 1, 17, 29, 6, band); F.box(9, 33, 2, 16, 33, 5, hat[2]);
  for (let i = 0; i < 8; i++) F.set(5 + i * 2, 27, i & 1 ? 0 : 7, straw[i & 1]);
} });
// a galvanised watering can with a rose spout
add('gd_wcan', { size: [12, 9, 6], r: 0.22, build(F) {
  const m = pal(F, ['#9aa6ae', '#b8c2c8', '#7a868e']), g = F.c('#3a8a5a');
  disc(F, 4, 3, 0, 5, 2.8, (x, y) => (y === 5 ? m[1] : m[(x + y) % 3 === 0 ? 2 : 0])); F.box(2, 6, 2, 6, 6, 4, m[2]); F.box(3, 7, 3, 5, 8, 3, m[2]);
  for (let t = 0; t < 5; t++) F.set(7 + t, 2 + t, 3, m[1]); F.box(11, 6, 2, 11, 8, 4, g);
} });
// a wheelbarrow tipped onto its legs, with a sack of compost
add('gd_barrow', { size: [16, 9, 26], r: [0.9, 1.5], build(F) {
  const tray = pal(F, ['#2e7a5a', '#246a4a']), h = F.c('#6a4428'), wh = F.c('#2a2a2e'), rim = F.c('#c8ccd0'), sack = pal(F, ['#b89a6a', '#a8885a']), soil = F.c('#4a3020');
  for (let y = 2; y < 8; y++) F.box(8 - (y + 2), y, 8 - Math.floor(y / 2), 7 + (y + 2), y, 20 + Math.floor(y / 3), tray[y & 1]);
  F.box(4, 7, 6, 11, 7, 18, soil); F.box(6, 7, 9, 10, 8, 14, sack[0]);
  disc(F, 8, 23, 0, 0, 0, wh); F.box(7, 0, 22, 8, 4, 25, wh); F.set(8, 2, 23, rim);
  for (const x of [2, 13]) { F.box(x, 3, 0, x, 3, 21, h); F.box(x, 0, 6, x, 2, 6, h); }
} });
// a slatted compost bin, full
add('gd_compost', { size: [16, 14, 16], r: [1.0, 1.0], build(F) {
  const W = pal(F, ['#7a5434', '#8a6240']), soil = pal(F, ['#3a2618', '#4a3020']), peel = pal(F, ['#e8701a', '#8ac050', '#f0d060']);
  for (let y = 0; y < 13; y++) { if (y % 3 === 2) continue; F.box(0, y, 0, 15, y, 15, W[y & 1]); F.box(1, y, 1, 14, y, 14, 0); }
  for (const [x, z] of [[0, 0], [15, 0], [0, 15], [15, 15]]) F.box(x, 0, z, x, 13, z, W[0]);
  F.box(1, 0, 1, 14, 10, 14, (x, y, z) => soil[(x + z) & 1]); for (let i = 0; i < 9; i++) F.set(2 + ((i * 5) % 12), 11, 2 + ((i * 7) % 12), peel[i % 3]);
} });
// a picket gate between two posts (swung open at yaw ±π/2 is not needed: the garden gate stays open)
add('gd_gatepost', { size: [4, 22, 4], r: 0.12, build(F) { const w = F.c('#f6f0e2'), cap = F.c('#2e6a5a'); F.box(1, 0, 1, 2, 19, 2, w); F.box(0, 20, 0, 3, 21, 3, cap); } });
// a tool rack leaning on the shed: a rake, a hoe, a spade and a fork
add('gd_tools', { size: [18, 30, 4], r: 0, build(F) {
  const h = F.c('#a8784a'), m = F.c('#8a949c'), red = F.c('#c83a3a');
  F.box(2, 0, 1, 2, 26, 1, h); F.box(0, 26, 0, 4, 27, 1, m); for (let x = 0; x <= 4; x += 2) F.set(x, 25, 0, m);   // rake
  F.box(7, 0, 1, 7, 27, 1, h); F.box(6, 27, 0, 8, 29, 1, m);                                                      // hoe
  F.box(11, 6, 1, 11, 28, 1, h); F.box(10, 0, 1, 12, 5, 1, m); F.box(10, 28, 1, 12, 29, 1, red);                 // spade
  F.box(15, 5, 1, 15, 27, 1, h); for (const x of [14, 15, 16]) F.box(x, 0, 1, x, 4, 1, m); F.box(14, 27, 1, 16, 27, 1, red);   // fork
} });
