// Close-up detail props for Alamo Hill Park (pk2_*), 16 voxels per metre, registered into the shared PROPS table:
// slatted benches with brass plaques, Victorian lamp posts with glass lanterns, slatted bins, flower beds of
// individual tulips / daisies / lavender / marigolds, stepping stones, pond-edge stones, cattails, flowering lily
// pads, a picnic blanket laid for lunch, a carved park sign and the gazebo.
// Every kind faces +z (south) at yaw 0 (the benches, like the stock bench, seat their sitter facing −z).
import { PROPS } from '../voxprops.js';
import { GLOW } from '../../fine.js';
import { vox } from './props_dt.js';

const { disc, ball } = vox;
const TAU = Math.PI * 2;
const add = (kind, def) => { PROPS[kind] = def; };
const h3 = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const pal = (F, l) => l.map((c) => F.c(c));

// ---------------------------------------------------------------- benches, lamps, bins, signs
// a park bench: cast-iron scroll ends, five seat slats and three back slats with gaps, a brass plaque
add('pk2_bench', { size: [30, 15, 11], r: [1.8, 0.62], build(F) {
  const iron = F.c('#22282a'), iron2 = F.c('#343c3e'), W = pal(F, ['#a06a3c', '#8c5a32', '#b47a46', '#7a4c2a']), brass = F.c('#d8b050'), screw = F.c('#5a5048');
  for (const x of [2, 26]) {
    F.box(x, 0, 0, x + 1, 1, 3, iron); F.box(x, 0, 7, x + 1, 1, 9, iron);              // feet
    F.box(x, 1, 1, x + 1, 6, 2, iron); F.box(x, 1, 7, x + 1, 6, 8, iron);              // legs
    F.box(x, 6, 1, x + 1, 6, 9, iron2);                                                  // seat rail
    F.box(x, 7, 9, x + 1, 14, 10, iron); F.set(x, 14, 8, iron); F.set(x, 13, 8, iron);  // back upright with a scroll
    F.box(x, 3, 0, x + 1, 4, 0, iron2); F.box(x, 8, 0, x + 1, 9, 1, iron2);            // the armrest scroll
  }
  F.box(2, 2, 4, 27, 2, 5, iron);                                                       // stretcher
  for (let i = 0; i < 5; i++) F.box(0, 7, 1 + i * 1.6 | 0, 29, 7, (1 + i * 1.6 | 0), W[i % 4]);
  for (let i = 0; i < 3; i++) F.box(0, 9 + i * 2, 10, 29, 9 + i * 2, 10, W[(i + 1) % 4]);
  for (const x of [3, 27]) for (const y of [9, 11, 13]) F.set(x, y, 11 > 10 ? 10 : 10, screw);
  F.box(13, 11, 10, 16, 11, 10, brass); F.set(13, 11, 9, brass); F.set(16, 11, 9, brass);   // plaque (front face toward the sitter)
} });
// a Victorian lamp post: a fluted base, a ringed column, a cross-arm and a four-paned glass lantern with a finial
add('pk2_lamp', { size: [16, 74, 16], r: 0.2, build(F) {
  const g = F.c('#1e3a30'), g2 = F.c('#2c5244'), gold = F.c('#c8a048'), glass = F.c('#fff2c8', GLOW), glass2 = F.c('#ffe6a0', GLOW), dk = F.c('#16241e');
  disc(F, 8, 8, 0, 1, 4.5, g); disc(F, 8, 8, 2, 3, 3.6, g2); disc(F, 8, 8, 4, 9, 2.8, (x, y, z) => ((x + z) % 2 ? g : g2)); disc(F, 8, 8, 10, 10, 3.2, gold);
  disc(F, 8, 8, 11, 50, 1.3, (x, y) => (y % 13 === 0 ? gold : g)); disc(F, 8, 8, 51, 52, 2.4, g2); disc(F, 8, 8, 53, 53, 1.6, gold);
  F.box(2, 49, 7, 13, 49, 8, g); F.set(2, 50, 7, gold); F.set(13, 50, 7, gold);          // ladder bar
  // the lantern: a narrow base, four glass panes framed in iron, a hipped cap and a finial
  F.box(5, 54, 5, 10, 55, 10, dk); F.box(4, 56, 4, 11, 56, 11, g);
  for (let y = 57; y <= 64; y++) F.box(4, y, 4, 11, y, 11, (x, yy, z) => (x === 4 || x === 11) && (z === 4 || z === 11) ? dk : yy === 61 ? glass2 : glass);
  F.box(5, 57, 5, 10, 64, 10, glass2);
  for (const k of [7, 8]) { F.box(k, 57, 4, k, 64, 4, dk); F.box(k, 57, 11, k, 64, 11, dk); F.box(4, 57, k, 4, 64, k, dk); F.box(11, 57, k, 11, 64, k, dk); }
  for (let i = 0; i < 4; i++) F.box(3 + i, 65 + i, 3 + i, 12 - i, 65 + i, 12 - i, i === 0 ? gold : g);
  F.box(7, 69, 7, 8, 71, 8, g); F.box(7, 72, 7, 8, 73, 8, gold);
} });
// a slatted wooden litter bin with iron bands, a dark liner and a crumpled bag edge
add('pk2_bin', { size: [11, 17, 11], r: 0.32, build(F) {
  const W = pal(F, ['#8a5a34', '#a06a3e', '#7a4c2a']), band = F.c('#2a3230'), liner = F.c('#1a1c1e'), bag = F.c('#3a3e44'), paper = F.c('#e8e0d0');
  for (let y = 0; y < 15; y++) disc(F, 5.5, 5.5, y, y, 5, (x, yy, z) => (yy === 2 || yy === 12 ? band : W[(Math.floor(Math.atan2(z - 5.5, x - 5.5) * 3) + 9) % 3]));
  disc(F, 5.5, 5.5, 14, 14, 3.8, liner); disc(F, 5.5, 5.5, 15, 15, 5.2, band); disc(F, 5.5, 5.5, 15, 15, 4, 0);
  F.box(3, 14, 3, 5, 15, 4, bag); F.set(6, 15, 6, paper); F.set(7, 15, 5, paper);
} });
// a carved wooden park sign under a little shingle roof (the lettering is a decal in park.js)
add('pk2_sign', { size: [30, 34, 6], r: [1.8, 0.3], build(F) {
  const w = F.c('#6a4428'), w2 = F.c('#7e5432'), board = F.c('#2e5a3a'), rim = F.c('#c8a050'), roof = pal(F, ['#4a3a32', '#5a4a3e']), stone = F.c('#9a948a');
  F.box(2, 0, 1, 5, 2, 4, stone); F.box(24, 0, 1, 27, 2, 4, stone);
  for (const x of [3, 25]) F.box(x, 2, 2, x + 1, 28, 3, w);
  F.box(1, 12, 1, 28, 25, 3, w2); F.box(2, 13, 3, 27, 24, 3, board); F.box(2, 13, 3, 27, 13, 3, rim); F.box(2, 24, 3, 27, 24, 3, rim);
  for (let i = 0; i < 4; i++) F.box(0 + i, 28 + i, 0, 29 - i, 28 + i, 5, roof[i & 1]);
} });

// ---------------------------------------------------------------- flower beds (1 × 1 m, individual flowers)
const bed = (F, r, fn) => { const soil = pal(F, ['#4e3424', '#5a3e2a', '#463020']); F.box(0, 0, 0, 15, 0, 15, (x, y, z) => soil[(h3(x, 0, z) * 3) | 0]); fn(F, r); };
const leafPair = (F, x, z, h, c) => { F.box(x - 1, 1, z, x - 1, Math.max(1, h - 3), z, c); F.box(x + 1, 1, z, x + 1, Math.max(1, h - 4), z, c); };
for (const [k, cols] of [['red', ['#d8202a', '#f04040', '#a81420']], ['yel', ['#f8c820', '#ffe050', '#d8a010']], ['pink', ['#e85a9a', '#f888b8', '#c03a78']], ['white', ['#f8f4ee', '#ffffff', '#d8d0c8']], ['purple', ['#7a3ac8', '#9a5ae0', '#5a2498']]]) {
  add('pk2_tulip_' + k, { size: [16, 12, 16], r: 0, noShadow: true, build(F, r) {
    bed(F, r, () => {
      const C = pal(F, cols), st = pal(F, ['#3a7a32', '#4a8c3a']);
      for (let i = 0; i < 9; i++) {
        const x = 2 + (i % 3) * 5 + Math.floor(r() * 2), z = 2 + Math.floor(i / 3) * 5 + Math.floor(r() * 2), h = 6 + Math.floor(r() * 3);
        F.box(x, 1, z, x, h, z, st[i & 1]); leafPair(F, x, z, h, st[(i + 1) & 1]);
        F.box(x - 1, h + 1, z - 1, x, h + 3, z, C[0]); F.set(x - 1, h + 3, z - 1, C[1]); F.set(x, h + 1, z, C[2]);
      }
    });
  } });
}
add('pk2_daisy', { size: [16, 9, 16], r: 0, noShadow: true, build(F, r) {
  bed(F, r, () => { const w = F.c('#fbf8f0'), y = F.c('#f0b820'), st = pal(F, ['#4a8a3a', '#5a9a44']);
    for (let i = 0; i < 26; i++) { const x = 1 + Math.floor(r() * 14), z = 1 + Math.floor(r() * 14), h = 3 + Math.floor(r() * 4); F.box(x, 1, z, x, h, z, st[i & 1]); F.set(x, h + 1, z, y); F.set(x - 1, h + 1, z, w); F.set(x + 1, h + 1, z, w); F.set(x, h + 1, z - 1, w); F.set(x, h + 1, z + 1, w); } });
} });
add('pk2_lavender', { size: [16, 12, 16], r: 0, noShadow: true, build(F, r) {
  bed(F, r, () => { const L = pal(F, ['#7a8a6a', '#8a9a78']), P = pal(F, ['#7a5ac8', '#9a7ae0', '#6a4ab0']);
    for (let c = 0; c < 4; c++) { const cx = 4 + (c % 2) * 8, cz = 4 + (c >> 1) * 8; for (let i = 0; i < 12; i++) { const x = cx + Math.round((r() - 0.5) * 5), z = cz + Math.round((r() - 0.5) * 5), h = 6 + Math.floor(r() * 4); F.box(x, 1, z, x, h - 3, z, L[i & 1]); F.box(x, h - 2, z, x, h, z, P[i % 3]); } } });
} });
add('pk2_marigold', { size: [16, 8, 16], r: 0, noShadow: true, build(F, r) {
  bed(F, r, () => { const L = pal(F, ['#3a7432', '#4a8638']), O = pal(F, ['#f08a1a', '#f8a830', '#d86a10', '#f8c040']);
    for (let i = 0; i < 9; i++) { const x = 2 + (i % 3) * 5 + Math.floor(r() * 2), z = 2 + Math.floor(i / 3) * 5 + Math.floor(r() * 2); F.box(x - 2, 1, z - 2, x + 2, 3, z + 2, L[i & 1]); F.box(x - 1, 4, z - 1, x + 1, 5, z + 1, O[i % 4]); F.set(x, 6, z, O[(i + 1) % 4]); } });
} });

// ---------------------------------------------------------------- pond: stones, cattails, lily pads; stepping stones
add('pk2_step', { size: [14, 2, 12], r: 0, noShadow: true, build(F, r) {
  const S = pal(F, ['#a8a298', '#b8b2a6', '#98928a', '#c4beb2']), moss = F.c('#6a8a3a');
  for (let z = 0; z < 12; z++) for (let x = 0; x < 14; x++) { const d = Math.hypot((x - 6.5) / 6.6, (z - 5.5) / 5.4) + (h3(x >> 1, 1, z >> 1) - 0.5) * 0.25; if (d > 1) continue; F.box(x, 0, z, x, d < 0.75 ? 1 : 0, z, d > 0.85 && h3(x, 2, z) < 0.3 ? moss : S[(h3(x >> 2, 0, z >> 2) * 4) | 0]); }
} });
add('pk2_pondstones', { size: [24, 8, 16], r: 0, build(F, r) {
  const S = pal(F, ['#8a867c', '#9a968a', '#aaa598', '#7a766c']), moss = pal(F, ['#5a7a32', '#6a8a3a']);
  for (let i = 0; i < 6; i++) { const cx = 3 + i * 3.6 + r() * 1.5, cz = 5 + r() * 6, rr = 2.2 + r() * 2.2; ball(F, cx, rr * 0.4, cz, rr, (x, y, z) => (y > rr * 0.75 && h3(x, y, z) < 0.35 ? moss[(x + z) & 1] : S[(h3(x >> 1, y >> 1, z >> 1) * 4) | 0])); }
} });
add('pk2_cattails', { size: [24, 32, 24], r: 0, noShadow: true, build(F, r) {
  const G = pal(F, ['#4a7a32', '#5a8a3a', '#6a9a46', '#3e6a2a']), cat = pal(F, ['#6a3e22', '#7a4a2a']), tip = F.c('#c8b878');
  for (let i = 0; i < 46; i++) {
    const x = 2 + Math.floor(r() * 20), z = 2 + Math.floor(r() * 20), h = 12 + Math.floor(r() * 18), c = G[i % 4];
    if (i % 4 === 0) { F.box(x, 0, z, x, h, z, c); F.box(x, h - 5, z, x, h - 1, z, cat[i & 1]); F.set(x, h + 1, z, tip); }
    else { const dx = r() < 0.5 ? 1 : -1, dz = r() < 0.5 ? 1 : -1, bend = Math.floor(h * 0.65); F.box(x, 0, z, x, bend, z, c); for (let k = 1; k < 5; k++) F.set(x + dx * k, bend + Math.floor(k * 0.6), z + (k > 2 ? dz : 0), c); }
  }
} });
add('pk2_lily', { size: [40, 2, 40], r: 0, noShadow: true, build(F, r) {
  const L = pal(F, ['#2e7a3a', '#3a8a44', '#4aa050']), rim = F.c('#246a30'), fl = pal(F, ['#ffffff', '#fbd0e0', '#f8a0c0']), y = F.c('#f8d040');
  for (let i = 0; i < 9; i++) {
    const cx = 4 + r() * 32, cz = 4 + r() * 32, rr = 2.2 + r() * 2.6, notch = r() * TAU, c = L[i % 3];
    for (let z = Math.floor(cz - rr); z <= cz + rr; z++) for (let x = Math.floor(cx - rr); x <= cx + rr; x++) { const d = Math.hypot(x - cx, z - cz); if (d > rr) continue; let a = Math.atan2(z - cz, x - cx) - notch; a = ((a % TAU) + TAU) % TAU; if (a < 0.45) continue; F.set(x, 0, z, d > rr - 1 ? rim : c); }
    if (i % 3 === 0) { const fx = Math.round(cx), fz = Math.round(cz), f = fl[i % 3]; F.set(fx, 1, fz, y); F.set(fx - 1, 1, fz, f); F.set(fx + 1, 1, fz, f); F.set(fx, 1, fz - 1, f); F.set(fx, 1, fz + 1, f); }
  }
} });
// ---------------------------------------------------------------- picnic blanket laid for lunch
add('pk2_picnic', { size: [40, 8, 32], r: 0, build(F, r) {
  const a = F.c('#c83a3a'), b = F.c('#f4ece0'), c = F.c('#e88080'), fr = F.c('#f4ece0');
  F.box(0, 0, 0, 39, 0, 31, (x, y, z) => { const u = (x >> 2) & 1, v = (z >> 2) & 1; return u && v ? a : u || v ? c : b; });
  for (let x = 0; x < 40; x += 2) { F.set(x, 0, 0, fr); F.set(x, 0, 31, fr); }
  // the wicker basket with its lid half open and a gingham napkin poking out
  const wk = pal(F, ['#b8864a', '#a07038', '#c89a5a']); F.box(26, 1, 4, 35, 6, 11, (x, y, z) => wk[(x + y * 2) % 3]); F.box(26, 7, 4, 35, 7, 7, wk[1]); F.box(29, 7, 8, 32, 9, 8, wk[0]); F.box(28, 7, 9, 30, 7, 11, a);
  // plates with sandwiches, apples, a thermos, two cups and an open book
  const plate = F.c('#f8f8f4'), bread = F.c('#e8c890'), crust = F.c('#c8904a'), lettuce = F.c('#6ab04a'), apple = pal(F, ['#d02a2a', '#e84040', '#7ab040']), th = F.c('#3a6aa8'), cup = F.c('#f0e8d8');
  for (const [px, pz] of [[6, 6], [6, 20]]) { disc(F, px + 2.5, pz + 2.5, 1, 1, 3, plate); F.box(px + 1, 2, pz + 1, px + 4, 2, pz + 4, bread); F.box(px + 1, 3, pz + 1, px + 4, 3, pz + 4, lettuce); F.box(px + 1, 4, pz + 1, px + 4, 4, pz + 4, crust); }
  for (let i = 0; i < 3; i++) ball(F, 16 + i * 3, 2, 14 + (i & 1) * 2, 1.5, apple[i]);
  disc(F, 22, 24, 1, 7, 1.6, th); disc(F, 22, 24, 8, 8, 1.2, F.c('#2a2a30'));
  for (const [x, z] of [[16, 24], [12, 26]]) disc(F, x, z, 1, 2, 1.2, cup);
  F.box(28, 1, 18, 31, 1, 25, F.c('#f8f4ea')); F.box(32, 1, 18, 35, 1, 25, F.c('#f0eadc')); F.box(31, 1, 18, 32, 1, 25, F.c('#3a5a8a'));
} });

// ---------------------------------------------------------------- the gazebo: a white hexagonal pavilion with a shingled roof
add('pk2_gazebo', { size: [96, 82, 96], r: 0, build(F) {
  const wh = F.c('#f4f0e8'), wh2 = F.c('#e0dad0'), deck = pal(F, ['#b8885a', '#a87a4e', '#c8986a']), sh = pal(F, ['#5a3e4a', '#6a4a58', '#4a3240']), gold = F.c('#d8b050'), stone = F.c('#b8b2a6');
  const cx = 48, cz = 48, R = 40, pts = []; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + TAU / 12; pts.push([cx + Math.cos(a) * R, cz + Math.sin(a) * R]); }
  const inHex = (x, z, r) => { for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; if ((x - cx) * Math.cos(a) + (z - cz) * Math.sin(a) > r * Math.cos(TAU / 12)) return false; } return true; };
  // a stone plinth and a plank deck (6 voxels up: one easy step)
  for (let z = 0; z < 96; z++) for (let x = 0; x < 96; x++) { if (!inHex(x + 0.5, z + 0.5, R + 3)) continue; F.box(x, 0, z, x, 4, z, inHex(x + 0.5, z + 0.5, R + 1) ? deck[((x >> 3) + (z % 7 === 0 ? 1 : 0)) % 3] : stone); }
  // posts, a balustrade between them (open on the south side), brackets
  pts.forEach(([x, z], i) => {
    F.box(Math.round(x) - 1, 5, Math.round(z) - 1, Math.round(x) + 1, 58, Math.round(z) + 1, wh);
    F.box(Math.round(x) - 2, 5, Math.round(z) - 2, Math.round(x) + 2, 7, Math.round(z) + 2, wh2);
    const [x2, z2] = pts[(i + 1) % 6], mz = (z + z2) / 2;
    if (mz > cz + R * 0.6) return;                                 // the south side is the entrance
    for (let t = 0; t <= 1; t += 0.02) { const px = Math.round(x + (x2 - x) * t), pz = Math.round(z + (z2 - z) * t); F.set(px, 19, pz, wh); F.set(px, 20, pz, wh); F.set(px, 6, pz, wh2); if (Math.round(t * 50) % 3 === 0) F.box(px, 7, pz, px, 18, pz, wh); }
    for (let t = 0.08; t <= 0.92; t += 0.02) { const px = Math.round(x + (x2 - x) * t), pz = Math.round(z + (z2 - z) * t), arc = Math.round(52 - Math.sin(t * Math.PI) * 6); F.set(px, arc, pz, wh); F.set(px, 57, pz, wh); }
  });
  // the roof: six shingled faces up to a cupola and a gilded finial
  for (let y = 58; y < 78; y++) { const k = (y - 58) / 20, r = (R + 6) * (1 - k) + 2; for (let z = 0; z < 96; z++) for (let x = 0; x < 96; x++) if (inHex(x + 0.5, z + 0.5, r) && !inHex(x + 0.5, z + 0.5, r - 2.5)) F.set(x, y, z, y % 3 === 0 ? sh[2] : sh[(y >> 2) & 1]); }
  for (let z = 0; z < 96; z++) for (let x = 0; x < 96; x++) if (inHex(x + 0.5, z + 0.5, R + 6) && !inHex(x + 0.5, z + 0.5, R + 4)) F.set(x, 58, z, wh);
  disc(F, cx, cz, 78, 80, 2.5, wh); F.box(cx - 1, 81, cz - 1, cx, 81, cz, gold);
} });
