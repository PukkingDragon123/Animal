// Extra voxel props for Chinatown (ct_*) and the Wharf (wf_*), registered into the shared PROPS table
// (16 voxels per metre; each kind is sculpted once and drawn instanced). Fronts face +z (south).
import { PROPS } from '../voxprops.js';
import { GLOW } from '../../fine.js';

const disc = (F, cx, cz, y0, y1, r, c) => { for (let y = y0; y <= y1; y++) for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) ** 2 + (z - cz) ** 2 <= r * r) F.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c); };
const ball = (F, cx, cy, cz, r, c, sy = 1) => { for (let y = Math.floor(cy - r * sy); y <= cy + r * sy; y++) for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) ** 2 + ((y - cy) / sy) ** 2 + (z - cz) ** 2 <= r * r) F.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c); };
// ellipsoid with radii rx, ry, rz
const ell = (F, cx, cy, cz, rx, ry, rz, c) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let z = Math.floor(cz - rz); z <= cz + rz; z++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 <= 1) F.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c); };
const line = (F, a, b, c, r = 0) => { const n = Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs(b[2] - a[2]))) + 1; for (let i = 0; i <= n; i++) { const t = i / n, x = Math.round(a[0] + (b[0] - a[0]) * t), y = Math.round(a[1] + (b[1] - a[1]) * t), z = Math.round(a[2] + (b[2] - a[2]) * t); if (r) F.box(x - r, y - r, z - r, x + r, y + r, z + r, c); else F.set(x, y, z, c); } };

const K = {
  // ---------------------------------------------------------------- Chinatown
  ct_lion: { size: [18, 34, 22], r: [1.1, 1.35], build(F, r) {
    const st = F.c('#b4b0a6'), st2 = F.c('#9a968e'), dk = F.c('#6e6a64'), hi = F.c('#cecac0'), red = F.c('#c83a2a'), eye = F.c('#2a2a2a');
    F.box(0, 0, 0, 17, 2, 21, dk); F.box(1, 3, 1, 16, 10, 20, (x, y) => (y === 10 ? hi : st2)); F.box(2, 5, 21, 15, 8, 21, dk);
    ell(F, 8.5, 15, 8, 5.5, 5, 6, st); // haunches
    F.box(4, 11, 13, 7, 20, 16, st); F.box(10, 11, 13, 13, 20, 16, st); F.box(3, 11, 15, 7, 12, 18, hi); F.box(10, 11, 15, 14, 12, 18, hi); // front legs + paws
    ball(F, 12, 13.5, 18.5, 2.4, (x, y) => (y % 2 ? st2 : hi)); // the ball under a paw
    ell(F, 8.5, 21, 12, 5, 5, 4.5, st); // chest
    ball(F, 8.5, 27, 14, 6.2, (x, y, z) => ((x + y + z) % 3 === 0 ? st2 : st)); // mane
    for (let i = 0; i < 26; i++) { const a = r() * 6.28, b = r() * 3.14; F.set(Math.round(8.5 + Math.cos(a) * Math.sin(b) * 6.5), Math.round(27 + Math.cos(b) * 6.5), Math.round(14 + Math.sin(a) * Math.sin(b) * 5), dk); }
    F.box(5, 24, 18, 12, 30, 20, st); F.box(6, 27, 21, 7, 28, 21, eye); F.box(10, 27, 21, 11, 28, 21, eye); F.box(5, 29, 20, 7, 30, 21, hi); F.box(10, 29, 20, 12, 30, 21, hi);
    F.box(6, 24, 20, 11, 25, 21, red); F.box(7, 25, 21, 10, 25, 21, dk); F.box(8, 26, 21, 9, 26, 21, st2);
  } },
  ct_dummy: { size: [14, 30, 14], r: 0.3, build(F) {
    const w = F.c('#8a5a32'), w2 = F.c('#6a4024'), w3 = F.c('#a8743e'), m = F.c('#3a3a40');
    disc(F, 7, 7, 0, 1, 5, m); disc(F, 7, 7, 2, 28, 2.6, (x, y) => (y % 7 ? w : w2)); disc(F, 7, 7, 29, 29, 2, w3);
    line(F, [6, 20, 8], [4, 21, 13], w3, 0.5); line(F, [8, 20, 8], [10, 21, 13], w3, 0.5); line(F, [7, 15, 8], [7, 15, 13], w3, 0.5);
    line(F, [7, 7, 8], [7, 4, 13], w2, 0.5); F.box(6, 3, 12, 8, 4, 13, w2);
  } },
  ct_rack: { size: [32, 36, 8], r: [2.0, 0.5], build(F, r) {
    const fr = F.c('#a82a24'), fr2 = F.c('#7a1a18'), gold = F.c('#d8a83a'), wood = F.c('#a8743e'), steel = F.c('#d0d4dc'), tas = [F.c('#d8282a'), F.c('#f0c040'), F.c('#2a8a5a')];
    for (const x of [1, 30]) F.box(x, 0, 2, x + 1, 32, 4, fr); F.box(0, 0, 0, 31, 1, 7, fr2);
    F.box(0, 30, 2, 31, 31, 4, fr); F.box(0, 12, 2, 31, 13, 4, fr); F.box(0, 32, 1, 31, 33, 5, gold);
    for (let i = 0; i < 6; i++) { const x = 5 + i * 4; F.box(x, 2, 5, x, 34, 5, wood); if (i % 2) { F.box(x, 31, 5, x, 35, 5, steel); F.set(x, 30, 6, tas[i % 3]); F.set(x, 29, 6, tas[i % 3]); } else F.set(x, 33, 6, tas[(i / 2) % 3]); }
    F.box(26, 2, 5, 26, 34, 5, wood); F.box(25, 28, 5, 27, 34, 5, steel); F.box(25, 27, 6, 27, 27, 6, tas[0]);
    void r;
  } },
  ct_drum: { size: [22, 26, 16], r: [1.4, 1.0], build(F) {
    const red = F.c('#b8282a'), red2 = F.c('#8a1a1a'), skin = F.c('#e8d8b0'), skin2 = F.c('#d0bc90'), gold = F.c('#e0b040'), wood = F.c('#5a3a22');
    for (const x of [2, 19]) { F.box(x, 0, 3, x + 1, 20, 4, wood); F.box(x, 0, 11, x + 1, 20, 12, wood); F.box(x, 0, 3, x + 1, 1, 12, wood); }
    for (let z = 1; z <= 14; z++) { const bulge = 8.5 + Math.sin(((z - 1) / 13) * Math.PI) * 1.2; for (let y = 0; y < 26; y++) for (let x = 0; x < 22; x++) { const d = Math.hypot(x - 10.5, y - 14); if (d <= bulge) F.set(x, y, z, z === 1 || z === 14 ? (d < bulge - 1.2 ? (d < 3 ? skin2 : skin) : gold) : (Math.abs(z - 3) < 0.5 || Math.abs(z - 12) < 0.5) && d > bulge - 1 ? gold : (y + z) % 5 ? red : red2); } }
  } },
  ct_burner: { size: [18, 26, 18], r: 0.65, build(F, r) {
    const br = F.c('#7a5a32'), br2 = F.c('#5a4026'), pat = F.c('#5a8a6a'), gold = F.c('#c8a050'), ash = F.c('#c8c0b0'), stick = F.c('#a8282a'), tip = F.c('#ffb050', GLOW), sm = F.c('#e8e8e8');
    for (const [x, z] of [[4, 4], [13, 4], [8, 14]]) F.box(x, 0, z, x + 1, 5, z + 1, br2);
    for (let y = 5; y <= 14; y++) { const rr = 7.5 - Math.abs(y - 9) * 0.35; disc(F, 9, 9, y, y, rr, (x, yy, z) => (r() < 0.07 ? pat : yy === 12 ? gold : br)); }
    disc(F, 9, 9, 14, 14, 6, ash); for (const x of [1, 16]) F.box(x, 13, 8, x, 17, 10, br2);
    for (let i = 0; i < 5; i++) { const x = 6 + i * 1.5 | 0, z = 8 + (i % 2); F.box(x, 15, z, x, 19 + (i % 3), z, stick); F.set(x, 20 + (i % 3), z, tip); }
    for (let i = 0; i < 6; i++) F.set(8 + (i % 3), 22 + i, 9 - (i % 2), sm);
  } },
  ct_stool: { size: [7, 8, 7], r: 0.2, build(F) { const s = F.c('#a8a49c'), s2 = F.c('#8a8680'); disc(F, 3, 3, 0, 1, 3, s2); disc(F, 3, 3, 2, 5, 2, s); disc(F, 3, 3, 6, 7, 3.4, (x, y) => (y === 7 ? F.c('#c0bcb4') : s)); } },
  ct_xqTable: { size: [16, 12, 16], r: 0.55, build(F) { const s = F.c('#a8a49c'), s2 = F.c('#8a8680'); disc(F, 8, 8, 0, 1, 4.5, s2); disc(F, 8, 8, 2, 9, 2.6, s); F.box(1, 10, 1, 14, 11, 14, s2); } },
  ct_pot: { size: [14, 24, 14], r: 0.45, build(F, r) {
    const wh = F.c('#e8ecf0'), bl = F.c('#2a4a9a'), bl2 = F.c('#4a6ab8'), soil = F.c('#4a3020'), L = ['#2e6a36', '#3a7a3a', '#4a8a42', '#5a9a4a'].map((c) => F.c(c));
    for (let y = 0; y <= 10; y++) { const rr = 4 + Math.sin((y / 10) * Math.PI) * 2.6; disc(F, 7, 7, y, y, rr, (x, yy, z) => ((yy === 2 || yy === 9) ? bl : (yy > 3 && yy < 8 && (Math.floor(Math.atan2(z - 7, x - 7) * 3) + yy) % 3 === 0) ? bl2 : wh)); }
    disc(F, 7, 7, 10, 10, 4.5, soil);
    F.box(7, 10, 7, 7, 14, 7, F.c('#5a3a22'));
    for (let i = 0; i < 4; i++) ball(F, 4 + (i % 2) * 6, 15 + (i >> 1) * 4, 5 + ((i * 3) % 4), 3.6, () => L[Math.floor(r() * 4)]);
  } },
  ct_bamboo: { size: [14, 56, 14], r: 0.4, build(F, r) {
    const pot = F.c('#6a4a3a'), pot2 = F.c('#8a6a52'), stem = F.c('#6a9a3a'), node = F.c('#4a7a2a'), L = [F.c('#3a8a3a'), F.c('#5aa04a'), F.c('#2e7a32')];
    disc(F, 7, 7, 0, 7, 5.5, (x, y) => (y === 7 ? pot2 : pot));
    for (let k = 0; k < 5; k++) { const x = 4 + Math.floor(r() * 6), z = 4 + Math.floor(r() * 6), h = 34 + Math.floor(r() * 18); for (let y = 8; y < h; y++) F.set(x, y, z, y % 6 ? stem : node); for (let y = 18; y < h; y += 5) for (let i = 0; i < 4; i++) { const dx = Math.round((r() - 0.5) * 8), dz = Math.round((r() - 0.5) * 8); line(F, [x, y, z], [x + dx, y + 2, z + dz], L[i % 3]); } }
  } },
  ct_produce: { size: [34, 16, 16], r: [2.1, 1.0], build(F, r) {
    const wood = F.c('#a87a48'), wood2 = F.c('#7a5430'), cloth = F.c('#2a6a4a');
    F.box(0, 0, 0, 1, 8, 1, wood2); F.box(32, 0, 0, 33, 8, 1, wood2); F.box(0, 0, 14, 1, 6, 15, wood2); F.box(32, 0, 14, 33, 6, 15, wood2);
    for (let z = 0; z <= 15; z++) { const y = 8 - Math.round(z * 0.15); F.box(0, y, z, 33, y, z, cloth); }
    const goods = [['#f08a1a', '#f8a83a'], ['#5aa040', '#8ac85a'], ['#c8282a', '#e85a4a'], ['#e8d04a', '#f8e870'], ['#8a3a8a', '#a85aa8'], ['#e8e0c0', '#5a9a3a']];
    for (let b = 0; b < 6; b++) {
      const x0 = 1 + b * 5.5 | 0, gg = goods[b], c1 = F.c(gg[0]), c2 = F.c(gg[1]);
      for (let z = 1; z <= 14; z++) { const y = 9 - Math.round(z * 0.15); F.box(x0, y, z, x0 + 4, y + 1, z, wood); }
      for (let z = 2; z <= 13; z++) for (let x = x0 + 1; x <= x0 + 3; x++) { const y = 10 - Math.round(z * 0.15); F.set(x, y + 1, z, (x + z) % 2 ? c1 : c2); if (r() < 0.4) F.set(x, y + 2, z, c2); }
    }
  } },
  ct_steamer: { size: [26, 34, 16], r: [1.6, 1.0], build(F, r) {
    const st = F.c('#c8ccd4'), st2 = F.c('#9aa0aa'), bam = F.c('#c8a060'), bam2 = F.c('#a8804a'), wh = F.c('#2a2a32'), red = F.c('#c8282a'), gold = F.c('#f0c040'), steam = F.c('#f4f4f4');
    F.box(1, 4, 1, 24, 14, 14, st); F.box(1, 14, 0, 24, 15, 15, st2); F.box(2, 6, 15, 23, 12, 15, red); F.box(4, 8, 15, 21, 10, 15, gold);
    for (const x of [4, 21]) { disc(F, x, 0, 0, 0, 0, wh); F.box(x - 2, 0, 0, x + 2, 4, 1, wh); F.box(x - 2, 0, 14, x + 2, 4, 15, wh); }
    for (let k = 0; k < 2; k++) for (let i = 0; i < 4; i++) disc(F, 7 + k * 11, 7.5, 16 + i * 2, 17 + i * 2, 4.5, (x, y) => (y % 2 ? bam : bam2));
    for (let i = 0; i < 14; i++) F.set(6 + Math.floor(r() * 14), 26 + Math.floor(r() * 7), 5 + Math.floor(r() * 6), steam);
    for (const x of [0, 25]) F.box(x, 15, 7, x, 33, 8, st2); for (let x = 0; x < 26; x++) F.box(x, 32, 2, x, 33, 13, x % 6 < 3 ? red : gold);
  } },
  ct_lanternBig: { size: [14, 24, 14], r: 0, hang: true, build(F) {
    const red = F.c('#e02a22', GLOW), dk = F.c('#a81a18', GLOW), gold = F.c('#f0c040'), tas = F.c('#d81a1a');
    disc(F, 7, 7, 21, 23, 4, gold); disc(F, 7, 7, 4, 4, 4, gold);
    for (let y = 5; y < 21; y++) disc(F, 7, 7, y, y, 6.4 - Math.abs(y - 13) * 0.28, (x, yy, z) => ((Math.floor(Math.atan2(z - 7, x - 7) * 2.5) + 20) % 2 ? red : dk));
    for (let x = 4; x <= 10; x += 2) F.box(x, 0, 7, x, 3, 7, tas);
  } },
  ct_fortune: { size: [28, 38, 16], r: [1.7, 1.0], build(F, r) {
    const wood = F.c('#8a5a32'), wood2 = F.c('#6a4024'), cloth = F.c('#c8282a'), gold = F.c('#f0c040'), ck = F.c('#e8b860'), ck2 = F.c('#c89040'), bowl = F.c('#2a4a8a'), roof = F.c('#2e6a44'), roof2 = F.c('#3f8a5a');
    F.box(0, 0, 2, 27, 13, 13, wood); F.box(0, 13, 1, 27, 14, 14, wood2); F.box(1, 2, 14, 26, 12, 14, cloth); F.box(3, 6, 15, 24, 8, 15, gold);
    for (const [cx, cz] of [[7, 7], [20, 8]]) { disc(F, cx, cz, 15, 16, 4, bowl); for (let i = 0; i < 12; i++) F.set(cx - 3 + Math.floor(r() * 7), 17 + Math.floor(r() * 2), cz - 2 + Math.floor(r() * 5), r() < 0.5 ? ck : ck2); }
    for (const x of [0, 27]) F.box(x, 14, 2, x, 32, 3, wood2);
    for (let z = 0; z < 16; z++) { const y = 33 + Math.round((15 - z) * 0.25); F.box(0, y, z, 27, y, z, z % 4 < 2 ? roof : roof2); }
    F.box(4, 26, 3, 23, 31, 3, cloth); F.box(5, 27, 3, 22, 30, 3, gold);
  } },
  ct_bike: { size: [30, 18, 8], r: [1.8, 0.5], build(F) {
    const fr = F.c('#2a6aa8'), tire = F.c('#1a1a20'), m = F.c('#c8ccd4'), bsk = F.c('#a87a48'), box = F.c('#f0c040');
    for (const cx of [5, 24]) for (let a = 0; a < 40; a++) { const t = a / 40 * 6.283; F.set(Math.round(cx + Math.cos(t) * 4.5), Math.round(5 + Math.sin(t) * 4.5), 4, tire); }
    line(F, [5, 5, 4], [13, 6, 4], fr); line(F, [13, 6, 4], [22, 11, 4], fr); line(F, [13, 6, 4], [11, 12, 4], fr); line(F, [11, 12, 4], [22, 11, 4], fr); line(F, [22, 11, 4], [24, 5, 4], fr);
    F.box(9, 13, 3, 13, 13, 5, F.c('#2a2a2a')); line(F, [22, 11, 4], [23, 14, 4], m); F.box(22, 14, 1, 23, 14, 7, m);
    F.box(24, 11, 1, 29, 15, 7, bsk); F.box(1, 10, 1, 7, 15, 7, box);
  } },
  ct_blossom: { size: [56, 84, 56], r: 0.35, build(F, r) {
    const bark = F.c('#5a3a2a'), bark2 = F.c('#6a4a34'), P = ['#f8b8c8', '#f098b0', '#fcd8e0', '#e87898', '#ffffff'].map((c) => F.c(c));
    disc(F, 28, 28, 0, 34, 2.8, (x, y) => ((x + y) % 4 ? bark : bark2));
    for (const [bx, by, bz, br] of [[28, 44, 28, 10], [38, 52, 30, 8], [18, 54, 25, 8.5], [28, 62, 33, 8], [31, 66, 22, 6.5], [20, 46, 37, 6.5], [40, 44, 20, 6]]) { line(F, [28, 30, 28], [bx, by - 2, bz], bark, 1); ball(F, bx, by, bz, br, () => P[Math.floor(r() * (r() < 0.1 ? 5 : 4))]); }
    for (let i = 0; i < 30; i++) F.set(10 + Math.floor(r() * 36), 0, 10 + Math.floor(r() * 36), P[Math.floor(r() * 3)]);
  } },
  ct_lionHead: { size: [20, 24, 20], r: 0.6, build(F) {
    const red = F.c('#d8282a'), gold = F.c('#f0c040'), grn = F.c('#2aa070'), wh = F.c('#f4f0ea'), bk = F.c('#1a1a1a'), fur = F.c('#f8f4e8'), wood = F.c('#5a3a22');
    F.box(9, 0, 9, 10, 8, 10, wood); disc(F, 9.5, 9.5, 0, 1, 5, wood);
    ell(F, 10, 15, 10, 8, 6.5, 7.5, red); ell(F, 10, 19, 10, 7, 3, 6.5, gold); ell(F, 10, 12, 15, 6, 3, 3, gold);
    F.box(4, 16, 16, 8, 19, 17, wh); F.box(12, 16, 16, 16, 19, 17, wh); F.box(5, 17, 17, 7, 18, 17, bk); F.box(13, 17, 17, 15, 18, 17, bk);
    F.box(9, 21, 9, 11, 23, 11, grn); F.box(6, 10, 17, 14, 11, 17, wh); F.box(7, 9, 16, 13, 9, 16, red);
    for (let x = 2; x < 19; x += 2) { F.set(x, 21, 4, fur); F.set(x, 20, 3, fur); } for (let y = 9; y < 20; y += 2) { F.set(2, y, 12, fur); F.set(18, y, 12, fur); }
  } },
  ct_altarCandle: { size: [3, 8, 3], r: 0, build(F) { const red = F.c('#c8282a'), fl = F.c('#ffd060', GLOW), g = F.c('#d8a83a'); F.box(0, 0, 0, 2, 0, 2, g); F.box(1, 1, 1, 1, 5, 1, red); F.box(1, 6, 1, 1, 7, 1, fl); } },
  ct_lamp: { size: [14, 84, 14], r: 0.2, build(F) {
    const g = F.c('#2e5a44'), g2 = F.c('#244a38'), gold = F.c('#d8a83a'), red = F.c('#e02a22', GLOW), dk = F.c('#a81a18', GLOW), roof = F.c('#3f8a5a');
    disc(F, 7, 7, 0, 3, 4, g2); disc(F, 7, 7, 4, 60, 1.3, (x, y) => (y % 14 === 0 ? gold : g)); disc(F, 7, 7, 61, 62, 3, gold);
    for (let y = 63; y < 74; y++) disc(F, 7, 7, y, y, 4.4 - Math.abs(y - 68) * 0.3, (x, yy, z) => ((x + z) % 3 ? red : dk));
    for (let y = 74; y < 79; y++) disc(F, 7, 7, y, y, 6.5 - (y - 74) * 1.3, roof); disc(F, 7, 7, 79, 82, 0.8, gold);
    for (const [x, z] of [[1, 1], [13, 1], [1, 13], [13, 13]]) F.set(x, 75, z, gold);
  } },
  ct_slide: { size: [72, 30, 22], r: [4.4, 1.3], build(F) {
    const g = F.c('#3aa060'), g2 = F.c('#2a8048'), bel = F.c('#f0d060'), red = F.c('#e8322a'), wh = F.c('#f4f0ea'), bk = F.c('#1a1a1a'), sl = F.c('#e86a2a'), st = F.c('#a8a49c');
    // a dragon arching out of the sand in three humps; a slide off the last one
    for (let x = 6; x < 60; x++) { const t = (x - 6) / 54, y = Math.abs(Math.sin(t * Math.PI * 3)) * 16; for (let a = 0; a < 20; a++) { const q = a / 20 * 6.283, yy = Math.round(y + 3 + Math.sin(q) * 3), zz = Math.round(11 + Math.cos(q) * 3); F.set(x, yy, zz, Math.sin(q) < -0.5 ? bel : (x + a) % 5 ? g : g2); } if (x % 6 === 0) F.box(x, Math.round(y) + 6, 11, x, Math.round(y) + 8, 11, red); }
    ell(F, 63, 12, 11, 6, 5, 4.5, g); F.box(66, 10, 7, 70, 12, 15, g2); F.box(67, 13, 7, 68, 14, 8, wh); F.box(67, 13, 14, 68, 14, 15, wh); F.set(68, 14, 7, bk); F.set(68, 14, 15, bk); F.box(69, 9, 9, 71, 10, 13, red);
    for (let y = 16; y < 22; y++) { F.set(60 - (y - 16), y, 8, red); F.set(60 - (y - 16), y, 14, red); }
    F.box(0, 0, 9, 5, 4, 13, g2); F.box(0, 3, 10, 2, 7, 12, red);
    for (let x = 36; x < 52; x++) { const y = Math.round(16 - (x - 36) * 1.0); F.box(x, Math.max(0, y), 16, x, Math.max(0, y) + 1, 20, sl); F.set(x, Math.max(0, y) + 2, 16, sl); F.set(x, Math.max(0, y) + 2, 20, sl); }
    F.box(0, 0, 0, 71, 0, 21, (x, y, z) => ((x + z) % 7 === 0 ? st : 0));
  } },
  // night-time window glow: flat panels of warm light laid over lit windows (fronts face +z)
  ct_glowPane: { size: [16, 28, 1], r: 0, build(F) { const a = F.c('#ffd890', GLOW), b = F.c('#ffc070', GLOW), f = F.c('#3a2a20'); F.box(0, 0, 0, 15, 27, 0, (x, y) => (x === 0 || x === 15 || y === 0 || y === 27 ? f : x === 8 ? f : (x + y * 3) % 11 === 0 ? b : a)); } },
  ct_glowWin: { size: [16, 24, 1], r: 0, build(F) { const a = F.c('#ffe0a0', GLOW), b = F.c('#ffc878', GLOW), f = F.c('#2e4a3a'); F.box(0, 0, 0, 15, 23, 0, (x, y) => (x === 0 || x === 15 || y === 0 || y === 23 || x === 8 || y === 12 ? f : y > 18 && (x % 3 === 0) ? f : y < 6 ? b : a)); } },
  wf_bulb: { size: [3, 4, 3], r: 0, hang: true, build(F) { const g = F.c('#fff2b8', GLOW), k = F.c('#2a2a2a'); F.box(1, 3, 1, 1, 3, 1, k); F.box(0, 0, 0, 2, 2, 2, g); } },
  ct_ac: { size: [12, 9, 8], r: 0, build(F) { const b = F.c('#d8d8d0'), g = F.c('#8a8a88'), d = F.c('#5a5a58'); F.box(0, 0, 0, 11, 8, 7, b); F.box(1, 1, 8, 10, 7, 8, g); for (let y = 2; y < 7; y += 2) F.box(2, y, 8, 9, y, 8, d); disc(F, 6, 0, 0, 0, 0, b); } },
  ct_bucket: { size: [8, 8, 8], r: 0.2, build(F) { const b = F.c('#2a6aa8'), w = F.c('#5a9ad8'); disc(F, 4, 4, 0, 6, 3.4, b); disc(F, 4, 4, 6, 6, 2.6, w); } },
  // ---------------------------------------------------------------- Wharf
  wf_lighthouse: { size: [34, 168, 34], r: 0, build(F) {
    const w = F.c('#f4f2ec'), w2 = F.c('#dcd8d0'), red = F.c('#c83a2a'), dk = F.c('#2a2a30'), gl = F.c('#fff4b0', GLOW), st = F.c('#8a8680');
    disc(F, 17, 17, 0, 8, 15, st);
    for (let y = 9; y < 128; y++) disc(F, 17, 17, y, y, 9.5 - (y - 9) * 0.03, (x, yy, z) => (Math.floor(yy / 20) % 2 ? red : (x + z) % 5 ? w : w2));
    for (let y = 30; y < 120; y += 22) F.box(16, y, 25, 18, y + 4, 26, dk);
    disc(F, 17, 17, 128, 130, 12, dk); for (let y = 131; y < 146; y++) disc(F, 17, 17, y, y, 7.5, (x, yy, z) => ((x + z) % 4 === 0 ? dk : gl));
    for (let y = 146; y < 160; y++) disc(F, 17, 17, y, y, 8.5 - (y - 146) * 0.6, red); disc(F, 17, 17, 160, 167, 1.2, dk);
    for (let t = 0; t < 72; t++) { const q = t / 72 * 6.283; F.set(Math.round(17 + Math.cos(q) * 12), 131, Math.round(17 + Math.sin(q) * 12), dk); F.set(Math.round(17 + Math.cos(q) * 12), 134, Math.round(17 + Math.sin(q) * 12), dk); }
  } },
  wf_telescope: { size: [10, 26, 12], r: 0.3, build(F) {
    const p = F.c('#2a5a8a'), p2 = F.c('#1e4a72'), s = F.c('#c8ccd4'), gl = F.c('#8ad0f0'), y = F.c('#f0c040');
    disc(F, 5, 6, 0, 1, 3.5, p2); disc(F, 5, 6, 2, 14, 1.4, p); F.box(3, 15, 4, 7, 16, 8, p2);
    F.box(1, 17, 2, 9, 21, 9, p); F.box(1, 18, 10, 3, 20, 11, s); F.box(7, 18, 10, 9, 20, 11, s); F.set(2, 19, 11, gl); F.set(8, 19, 11, gl); F.box(3, 22, 4, 7, 22, 7, p2); F.box(4, 18, 1, 6, 20, 1, y);
  } },
  wf_sealion: { size: [26, 12, 12], r: 0, build(F) {
    const b = F.c('#6a4a32'), b2 = F.c('#5a3a26'), b3 = F.c('#8a6a4a'), bk = F.c('#1a1a1a'), wh = F.c('#c8b8a0');
    ell(F, 11, 3.5, 6, 9, 3.2, 3.8, b); ell(F, 4, 3, 6, 4, 2.4, 3, b2); ell(F, 19, 6.5, 6, 3, 4, 3, b); ell(F, 21.5, 9, 6, 3.2, 2.4, 2.4, b3);
    F.set(24, 9, 5, bk); F.set(24, 9, 7, bk); F.set(25, 8, 6, bk); F.set(25, 7, 5, wh); F.set(25, 7, 7, wh);
    for (const z of [1, 11]) F.box(15, 0, z, 18, 1, z, b2); F.box(0, 1, 3, 2, 1, 9, b2);
  } },
  wf_buoy: { size: [8, 14, 8], r: 0, build(F) { const r = F.c('#e8322a'), w = F.c('#f4f0ea'), m = F.c('#5a5a62'); disc(F, 4, 4, 0, 6, 3.6, (x, y) => (y > 3 ? w : r)); for (let y = 7; y < 12; y++) disc(F, 4, 4, y, y, 3 - (y - 7) * 0.45, r); F.box(4, 12, 4, 4, 13, 4, m); } },
  wf_pots: { size: [22, 18, 16], r: [1.3, 1.0], build(F, r) {
    const mesh = F.c('#5a7a8a'), mesh2 = F.c('#3a5a6a'), frame = F.c('#2a3a44'), rope = F.c('#d8c890'), buoy = F.c('#f07a2a');
    const pot = (x0, y0, z0) => { F.box(x0, y0, z0, x0 + 9, y0 + 6, z0 + 7, (x, y, z) => (x === x0 || x === x0 + 9 || y === y0 || y === y0 + 6 || z === z0 || z === z0 + 7 ? ((x + y + z) % 2 ? mesh : mesh2) : 0)); F.box(x0, y0, z0, x0, y0 + 6, z0, frame); F.box(x0 + 9, y0, z0 + 7, x0 + 9, y0 + 6, z0 + 7, frame); };
    pot(0, 0, 0); pot(11, 0, 1); pot(5, 7, 4); line(F, [3, 14, 8], [18, 7, 14], rope); ell(F, 19, 3, 13, 2, 3, 2, buoy); void r;
  } },
  wf_crate: { size: [16, 8, 11], r: [1.0, 0.7], build(F, r) {
    const w = F.c('#a87a48'), w2 = F.c('#7a5430'), ice = F.c('#e0f0f8'), ice2 = F.c('#c0dce8'), fish = [F.c('#8aa0b8'), F.c('#c8ccd4'), F.c('#e87a5a'), F.c('#5a6a8a')], crab = F.c('#d8482a');
    F.box(0, 0, 0, 15, 5, 10, (x, y, z) => (x === 0 || x === 15 || z === 0 || z === 10 || y === 0 ? (y % 3 ? w : w2) : 0));
    F.box(1, 1, 1, 14, 5, 9, (x, y, z) => ((x + z) % 3 ? ice : ice2));
    for (let i = 0; i < 5; i++) { const z = 2 + i * 1.6 | 0, c = fish[i % 4]; F.box(2, 6, z, 11, 6, z, c); F.set(12, 6, z, c); F.set(13, 6, z - 1 < 1 ? 1 : z - 1, c); F.set(13, 6, z + 1 > 9 ? 9 : z + 1, c); F.set(3, 6, z, F.c('#1a1a1a')); }
    if (r() < 2) { ell(F, 12, 6.5, 7, 2.5, 1, 2, crab); }
  } },
  wf_bollard: { size: [8, 9, 8], r: 0.2, build(F) { const b = F.c('#2a2a30'), b2 = F.c('#3a3a44'), rope = F.c('#d8c890'); disc(F, 4, 4, 0, 6, 2.6, b); disc(F, 4, 4, 7, 8, 3.6, b2); disc(F, 4, 4, 3, 4, 3.2, rope); } },
  wf_coil: { size: [12, 3, 12], r: 0, build(F) { const a = F.c('#d8c890'), b = F.c('#b8a870'); for (let y = 0; y < 3; y++) for (let rr = 2; rr <= 5; rr++) for (let t = 0; t < 40; t++) { const q = t / 40 * 6.283; F.set(Math.round(6 + Math.cos(q) * rr), y, Math.round(6 + Math.sin(q) * rr), (rr + y) % 2 ? a : b); } } },
  wf_gull: { size: [8, 7, 6], r: 0, build(F) { const w = F.c('#f4f4f0'), g = F.c('#a8b0b8'), y = F.c('#f0c040'), bk = F.c('#1a1a1a'); ell(F, 4, 3, 3, 3, 1.6, 1.5, w); F.box(1, 3, 1, 5, 4, 1, g); F.box(1, 3, 5, 5, 4, 5, g); ball(F, 6.5, 5, 3, 1.3, w); F.set(8, 5, 3, y); F.set(7, 6, 2, bk); F.box(0, 3, 3, 0, 4, 3, bk); F.box(3, 0, 3, 3, 1, 3, y); F.box(5, 0, 3, 5, 1, 3, y); } },
  wf_lifering: { size: [12, 26, 4], r: 0.2, build(F) { const p = F.c('#6a4a2a'), o = F.c('#f07a2a'), w = F.c('#f4f0ea'); F.box(5, 0, 0, 6, 24, 1, p); for (let t = 0; t < 60; t++) { const q = t / 60 * 6.283; for (let rr = 3; rr <= 5; rr++) F.set(Math.round(5.5 + Math.cos(q) * rr), Math.round(16 + Math.sin(q) * rr), 2, Math.floor(t / 7.5) % 2 ? o : w); } } },
  wf_anchor: { size: [24, 32, 8], r: 0.5, build(F) { const a = F.c('#3a3e48'), a2 = F.c('#5a5e6a'), st = F.c('#8a8a88'); F.box(6, 0, 1, 17, 2, 6, st); F.box(11, 3, 3, 12, 28, 4, a); F.box(6, 24, 3, 17, 25, 4, a2); for (let t = 0; t <= 20; t++) { const q = Math.PI * (t / 20), x = Math.round(11.5 + Math.cos(q) * 9), y = Math.round(10 - Math.sin(q) * 6); F.box(x, y, 3, x, y + 1, 4, a); } F.box(1, 9, 3, 3, 12, 4, a2); F.box(20, 9, 3, 22, 12, 4, a2); for (let t = 0; t < 24; t++) { const q = t / 24 * 6.283; F.set(Math.round(11.5 + Math.cos(q) * 2.5), Math.round(29.5 + Math.sin(q) * 2.5), 3, a2); } } },
  wf_boat: { size: [100, 52, 36], r: 0, build(F, r) {
    const hull = F.c(['#2a5a8a', '#c83a2a', '#2a7a5a'][Math.floor(r() * 3)]), hull2 = F.c('#f4f0e8'), keel = F.c('#3a2a22'), deck = F.c('#b08a5a'), cab = F.c('#f4f0e8'), win = F.c('#5a8ab0'), roof = F.c('#3a4a5a'), mast = F.c('#d8d0c0'), rope = F.c('#c8b890'), red = F.c('#e8322a');
    for (let x = 0; x < 100; x++) { const t = x / 99, w = 16 * Math.sqrt(Math.max(0, Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.5 + 0.3))) * (t > 0.82 ? 1 - (t - 0.82) * 4.2 : 1), hh = 16 + (t > 0.7 ? (t - 0.7) * 20 : 0); for (let y = 0; y < hh; y++) { const ww = w * Math.min(1, 0.45 + y / 18); for (let z = Math.round(18 - ww); z <= Math.round(17 + ww); z++) { const edge = z <= Math.round(18 - ww) || z >= Math.round(17 + ww) || y === 0; if (edge || y === hh - 1) F.set(x, y, z, y < 4 ? keel : y > hh - 4 ? hull2 : hull); } } for (let z = Math.round(19 - w * 0.9); z <= Math.round(16 + w * 0.9); z++) F.set(x, Math.floor(hh) - 2, z, deck); }
    F.box(14, 15, 9, 40, 30, 26, cab); F.box(16, 22, 26, 38, 27, 26, win); F.box(16, 22, 9, 38, 27, 9, win); F.box(40, 22, 11, 40, 27, 24, win); F.box(12, 31, 7, 42, 32, 28, roof);
    F.box(26, 33, 17, 27, 51, 18, mast); line(F, [26, 50, 17], [70, 18, 17], rope); line(F, [26, 50, 17], [6, 18, 17], rope); F.box(27, 46, 17, 31, 48, 17, red);
    for (let i = 0; i < 3; i++) F.box(50 + i * 10, 15, 6, 52 + i * 10, 18, 7, F.c('#f07a2a'));
  } },
  wf_sail: { size: [90, 168, 30], r: 0, build(F) {
    const hull = F.c('#f4f0e8'), stripe = F.c('#2a4a8a'), deck = F.c('#b08a5a'), mast = F.c('#c8ccd4'), sail = F.c('#f8f6f0'), sail2 = F.c('#e8e4dc'), keel = F.c('#3a3a44');
    for (let x = 0; x < 90; x++) { const t = x / 89, w = 12 * Math.sin(Math.min(1, 0.25 + t * 0.9) * Math.PI * 0.85) * (t > 0.85 ? Math.max(0.1, 1 - (t - 0.85) * 5.5) : 1); for (let y = 0; y < 13; y++) { const ww = w * Math.min(1, 0.5 + y / 14); for (let z = Math.round(15 - ww); z <= Math.round(14 + ww); z++) { const edge = z <= Math.round(15 - ww) || z >= Math.round(14 + ww) || y === 0; if (edge) F.set(x, y, z, y < 3 ? keel : y === 9 ? stripe : hull); else if (y === 11) F.set(x, y, z, deck); } } }
    F.box(36, 12, 14, 37, 165, 15, mast); F.box(36, 30, 14, 76, 31, 15, mast);
    for (let y = 32; y < 160; y++) { const span = Math.round((1 - (y - 32) / 128) * 38); F.box(38, y, 14, 38 + span, y, 14, (y >> 3) % 5 ? sail : sail2); }
    for (let y = 20; y < 150; y++) { const span = Math.round((1 - (y - 20) / 130) * 26); F.box(36 - span, y, 15, 34, y, 15, sail2); }
  } },
  wf_cablecar: { size: [122, 56, 44], r: 0, build(F) {
    const red = F.c('#b82a24'), red2 = F.c('#8a1e1a'), cream = F.c('#f0e4c8'), blue = F.c('#2a4a7a'), gold = F.c('#e0b040'), wood = F.c('#8a5a32'), wood2 = F.c('#6a4024'), glass = F.c('#9ac0d8'), dk = F.c('#2a2a30'), wh = F.c('#f4f0ea'), lamp = F.c('#fff0c0', GLOW);
    F.box(4, 6, 4, 117, 10, 39, wood2); F.box(4, 10, 4, 117, 11, 39, wood);
    for (const x of [18, 103]) { F.box(x - 6, 0, 6, x + 6, 6, 9, dk); F.box(x - 6, 0, 34, x + 6, 6, 37, dk); }
    // open ends (benches) and the closed cabin in the middle
    for (const [x0, x1] of [[4, 32], [89, 117]]) { F.box(x0, 11, 4, x1, 13, 39, red); F.box(x0, 14, 6, x1, 16, 12, wood); F.box(x0, 14, 31, x1, 16, 37, wood); for (let x = x0; x <= x1; x += 9) { F.box(x, 11, 4, x + 1, 44, 5, cream); F.box(x, 11, 38, x + 1, 44, 39, cream); } F.box(x0, 30, 4, x1, 31, 5, gold); F.box(x0, 30, 38, x1, 31, 39, gold); }
    F.box(33, 11, 4, 88, 44, 39, (x, y, z) => (y > 24 && y < 40 && (x - 33) % 7 > 1 && (z === 4 || z === 39) ? glass : y < 25 ? red : cream));
    F.box(33, 25, 4, 88, 25, 39, gold); F.box(33, 40, 4, 88, 41, 39, red2);
    for (const x of [4, 117]) F.box(x, 11, 5, x, 44, 38, (xx, y, z) => (y > 24 && y < 40 && z > 10 && z < 33 ? glass : y < 25 ? red : cream));
    F.box(2, 45, 2, 119, 47, 41, cream); F.box(4, 48, 6, 117, 51, 37, red); F.box(6, 52, 10, 115, 53, 33, red2);
    F.box(40, 48, 3, 82, 51, 3, blue); for (let x = 42; x < 80; x += 4) F.box(x, 49, 2, x + 2, 50, 2, wh);
    F.box(0, 14, 18, 1, 18, 25, lamp); F.box(120, 14, 18, 121, 18, 25, lamp); F.box(55, 45, 0, 66, 47, 1, gold);
  } },
  wf_carousel: { size: [76, 80, 76], r: 2.2, build(F, r) {
    const base = F.c('#e8d8c0'), base2 = F.c('#c8b498'), pole = F.c('#e0b040'), roofA = F.c('#e8322a'), roofB = F.c('#f4f0ea'), trim = F.c('#2a6aa8'), lamp = F.c('#fff0b0', GLOW), horses = ['#f4f0ea', '#3a2a22', '#e8b860', '#a8a8b0'].map((c) => F.c(c)), saddle = F.c('#c8282a');
    const mirror = F.c('#fff4d0', GLOW); disc(F, 38, 38, 0, 4, 34, (x, y) => (y === 4 ? base : base2)); disc(F, 38, 38, 5, 52, 3.4, (x, y, z) => ((y % 6 < 3) && ((x + z) % 2) ? mirror : trim));
    for (let y = 46; y < 76; y++) { const rr = (76 - y) * 1.25; disc(F, 38, 38, y, y, rr, (x, yy, z) => ((Math.floor((Math.atan2(z - 38, x - 38) + 3.1416) / 6.283 * 16)) % 2 ? roofA : roofB)); }
    for (let t = 0; t < 64; t++) { const q = t / 64 * 6.283; const x = Math.round(38 + Math.cos(q) * 36), z = Math.round(38 + Math.sin(q) * 36); F.box(x, 44, z, x, 46, z, trim); if (t % 2 === 0) { F.set(x, 43, z, lamp); F.set(x, 47, z, lamp); } }
    disc(F, 38, 38, 76, 79, 2, pole);
    for (let i = 0; i < 8; i++) { const q = i / 8 * 6.283, x = Math.round(38 + Math.cos(q) * 26), z = Math.round(38 + Math.sin(q) * 26), c = horses[i % 4], hy = 16 + (i % 2) * 4; F.box(x, 5, z, x, 46, z, pole); const dx = Math.round(-Math.sin(q)), dz = Math.round(Math.cos(q)); for (let k = -4; k <= 4; k++) F.box(x + dx * k - 1, hy, z + dz * k - 1, x + dx * k + 1, hy + 4, z + dz * k + 1, c); F.box(x + dx * 5 - 1, hy + 3, z + dz * 5 - 1, x + dx * 6 + 1, hy + 9, z + dz * 6 + 1, c); F.box(x - 1, hy + 5, z - 1, x + 1, hy + 5, z + 1, saddle); for (const k of [-3, 3]) F.box(x + dx * k, hy - 6, z + dz * k, x + dx * k, hy - 1, z + dz * k, c); }
    void r;
  } },
  wf_icecart: { size: [30, 44, 18], r: [1.8, 1.1], build(F) {
    const body = F.c('#f4e8f0'), pink = F.c('#f08ab0'), mint = F.c('#8ad8c0'), wh = F.c('#2a2a30'), cone = F.c('#d8a050'), sc = [F.c('#f8d0e0'), F.c('#a8e0c8'), F.c('#f0e0a0'), F.c('#7a4a32')], pole = F.c('#e0e0e0');
    F.box(1, 5, 2, 28, 16, 15, (x, y) => (y > 11 && y < 14 ? pink : body)); F.box(0, 16, 1, 29, 17, 16, mint);
    for (const x of [5, 24]) { F.box(x - 3, 0, 1, x + 3, 5, 2, wh); F.box(x - 3, 0, 15, x + 3, 5, 16, wh); }
    for (let i = 0; i < 4; i++) { F.box(4 + i * 6, 18, 6, 6 + i * 6, 19, 8, sc[i]); }
    F.box(14, 17, 8, 15, 38, 9, pole); for (let y = 36; y < 44; y++) disc(F, 14.5, 8.5, y, y, (44 - y) * 1.9, (x, yy, z) => ((Math.floor(Math.atan2(z - 8.5, x - 14.5) * 2.6 + 9)) % 2 ? pink : F.c('#f8f4f0')));
    F.box(24, 18, 12, 26, 22, 14, cone); ball(F, 25, 24, 13, 2, sc[0]);
  } },
};
Object.assign(PROPS, K);
export const KINDS = Object.keys(K);
