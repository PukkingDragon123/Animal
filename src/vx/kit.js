// San Francisco building kit for fine-voxel dioramas (8 voxels per metre).
// Materials are small families of close shades; voxels pick a shade by hash or
// soft noise so surfaces read as real materials (asphalt aggregate, clapboard,
// stucco, leaves) instead of flat colour. Builders lay down streets, sidewalks,
// Victorian row houses with bay windows, stoops and fish-scale gables, trees,
// lamps, hydrants, parked cars and park furniture.
import { GLOW, WATER, GLASS } from './fine.js';

export const MATS = {
  asphalt: ['#3b3d43', '#3f4147', '#44464c', '#37393f', '#4b4d53'],
  asphaltOld: ['#47484c', '#4d4e52', '#414246', '#535458'],
  tar: ['#2a2b30', '#2e2f34'],
  lineY: ['#e6be30', '#dab228', '#eec840'], lineW: ['#e8e6de', '#dcdad2'],
  sidewalk: ['#bab6ae', '#beb9b1', '#b4b0a8', '#c3bfb7', '#aeaaa2'], seam: ['#9c988f', '#a29e96'],
  curb: ['#aca89f', '#a29e96', '#b2aea6'], curbRed: ['#b8463e', '#ae3e38'],
  grass: ['#58883a', '#5f903e', '#679a44', '#507e34', '#70a24a', '#4a7430'],
  grassDry: ['#8a9a4a', '#9aa456', '#7e8e42'],
  dirt: ['#6a4e36', '#5e4430', '#765a3e', '#54402e'],
  gravel: ['#aa9c86', '#9c8e78', '#b6a892', '#a49680'],
  trunk: ['#5e4434', '#6a4e3a', '#52392c', '#735640'],
  leaf: ['#3e6e2e', '#4a7c34', '#56883c', '#355e28', '#62944a', '#2e5626'],
  leafDark: ['#294c2a', '#2f5630', '#244424', '#386238', '#1e3c20'],
  leafEuc: ['#5e8c74', '#6a987e', '#527e68', '#76a288'],
  leafBloom: ['#e88aa8', '#f0a0bc', '#d87498', '#f6b6cc'],
  hedge: ['#2f5a2a', '#36642e', '#2a5226', '#3e6c34'],
  trim: ['#f2eee4', '#ebe6dc', '#f8f4ec'], trimShade: ['#d6d0c4'],
  glass: ['#22344e', '#2a3e5a', '#30486a', '#1c2a40'], glassHi: ['#6a8cb0', '#8aaccc'],
  glassLit: ['#ffd27a', '#ffc45e', '#ffe0a0'],
  roof: ['#6e6a72', '#78747c', '#66626a', '#827e86'], roofRed: ['#8a5a4e', '#966456', '#7e5046'],
  brick: ['#9a4a3c', '#a6533f', '#8e4236', '#b05c48'], mortar: ['#b8aa98'],
  stone: ['#8a8a90', '#94949a', '#7e7e86', '#a0a0a6'],
  metal: ['#3a3c44', '#42444c', '#34363c'], steel: ['#8a8e98', '#9aa0aa'],
  wood: ['#8a5e3c', '#946642', '#7e5436'], woodDark: ['#5a3e2a', '#634530'],
  concrete: ['#a8a49c', '#b0aca4', '#a09c94'],
  water: ['#2a6a9a', '#2e74a6', '#3480b0'],
  sand: ['#d6c094', '#ccb68a', '#dcc89e'],
  lamp: ['#fff2c8'], neonPink: ['#ff4aa8'], neonCyan: ['#4af0e8'],
  tire: ['#202024', '#26262a'], chrome: ['#c8ccd4', '#a8acb4'], headlight: ['#fff8e0'], taillight: ['#e83a3a'],
};
// Painted Ladies colour schemes: body, accent (bay + gable), trim, door
export const SCHEMES = [
  { body: ['#5e9c98', '#669f9c', '#578f8c'], accent: ['#e6a4a6', '#dc9a9c'], deep: '#2f5e5a', door: '#7a2e3a' },
  { body: ['#e6c45c', '#ecca66', '#d8b852'], accent: ['#8a6ab4', '#9474be'], deep: '#7a5a20', door: '#3a4a7a' },
  { body: ['#e8a2a8', '#eeaab0', '#dc969c'], accent: ['#7e9a6a', '#88a474'], deep: '#9a4a54', door: '#2e5a3a' },
  { body: ['#6a86c2', '#7290ca', '#5f7ab6'], accent: ['#e8d8b0', '#f0e2bc'], deep: '#2e3e6a', door: '#8a3a2a' },
  { body: ['#a28ec4', '#ab98cc', '#9682b8'], accent: ['#e88c6a', '#f09674'], deep: '#4e3e6e', door: '#2a4a4a' },
  { body: ['#8ec8a8', '#96d0b0', '#82bc9c'], accent: ['#e6b85a', '#eec266'], deep: '#3a6a52', door: '#6a2a4a' },
  { body: ['#e88c70', '#ee967a', '#dc8066'], accent: ['#f0e6d0', '#f6eedc'], deep: '#8a3e2e', door: '#2a3a5a' },
];

// hashing & soft noise
export function h3(x, y, z) { let h = (x * 374761393 + y * 668265263 + z * 2147483647) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function noise2(x, z, sc) {
  const fx = x / sc, fz = z / sc, x0 = Math.floor(fx), z0 = Math.floor(fz), tx = fx - x0, tz = fz - z0;
  const a = h3(x0, 0, z0), b = h3(x0 + 1, 0, z0), c = h3(x0, 0, z0 + 1), d = h3(x0 + 1, 0, z0 + 1);
  const sx = tx * tx * (3 - 2 * tx), sz = tz * tz * (3 - 2 * tz);
  return (a * (1 - sx) + b * sx) * (1 - sz) + (c * (1 - sx) + d * sx) * sz;
}

export class Kit {
  constructor(v) { this.v = v; this.cache = new Map(); }
  // palette indices for a material name or an explicit list of hex shades
  m(name, flags = 0) {
    const key = (Array.isArray(name) ? name.join(',') : name) + '|' + flags;
    let r = this.cache.get(key); if (r) return r;
    const list = Array.isArray(name) ? name : MATS[name];
    if (!list) throw new Error('kit: unknown material ' + name);
    r = list.map((hex) => this.v.c(hex, flags | (name === 'water' ? WATER : 0) | (name === 'glassLit' || name === 'lamp' || name === 'neonPink' || name === 'neonCyan' || name === 'headlight' || name === 'taillight' ? GLOW : 0) | (name === 'glass' ? GLASS : 0)));
    this.cache.set(key, r); return r;
  }
  // a voxel-colour function: mode 'hash' (fine grain), 'patch' (soft clusters), 'rows' (horizontal boards)
  f(name, mode = 'hash', o = {}) {
    const S = this.m(name, o.flags || 0), n = S.length;
    if (mode === 'one') return () => S[0];
    if (mode === 'patch') return (x, y, z) => S[Math.min(n - 1, Math.floor((noise2(x + y * 3, z, o.sc || 6) * 0.75 + h3(x, y, z) * 0.25) * n))];
    if (mode === 'rows') return (x, y, z) => { const r = ((y % (o.period || 2)) + (o.period || 2)) % (o.period || 2); return r === 0 ? S[Math.min(n - 1, 2)] : S[h3(x >> 3, y, z >> 3) < 0.5 ? 0 : 1]; };
    return (x, y, z) => S[Math.floor(h3(x, y, z) * n)];
  }
  box(x0, y0, z0, x1, y1, z1, name, mode, o) { this.v.box(x0, y0, z0, x1, y1, z1, typeof name === 'function' ? name : name === 0 ? 0 : this.f(name, mode, o)); return this; }
  set(x, y, z, name, k = -1) { const S = this.m(name); this.v.set(x, y, z, k >= 0 ? S[k % S.length] : S[Math.floor(h3(x, y, z) * S.length)]); }

  // ------------------------------------------------------------ ground & streets (axis-aligned along x)
  // a street running east–west: sidewalks, curbs, asphalt with double yellow line, gutters
  streetX(x0, x1, zc, y, o = {}) {
    const half = o.half || 40, walk = o.walk || 22, v = this.v;   // road half-width 5 m, sidewalk 2.75 m
    this.box(x0, y - 2, zc - half, x1, y, zc + half, 'asphalt', 'hash');
    for (let x = x0; x <= x1; x++) for (let z = zc - half; z <= zc + half; z++) { if (noise2(x, z, 9) > 0.72) this.set(x, y, z, 'asphaltOld'); if (h3(x, 7, z) > 0.996) this.set(x, y, z, 'tar'); }
    // cracks
    for (let k = 0; k < (x1 - x0) / 10; k++) { let x = x0 + Math.floor(h3(k, 1, 3) * (x1 - x0)), z = zc - half + Math.floor(h3(k, 2, 3) * half * 2); for (let j = 0; j < 14; j++) { this.set(x, y, z, 'tar'); x += h3(k, j, 5) > 0.5 ? 1 : 0; z += h3(k, j, 6) > 0.6 ? 1 : h3(k, j, 6) < 0.3 ? -1 : 0; } }
    // double yellow line (dashed white lane edges if o.lanes)
    for (let x = x0; x <= x1; x++) { for (const dz of [-2, 1]) this.set(x, y, zc + dz, 'lineY'); }
    // curbs (one voxel up) + sidewalks with slab seams and tree wells
    for (const sgn of [-1, 1]) {
      const zc0 = zc + sgn * (half + 1), zs0 = zc + sgn * (half + 2), zs1 = zc + sgn * (half + 1 + walk);
      this.box(x0, y - 1, Math.min(zc0, zc0), x1, y + 1, zc0, 'curb', 'hash');
      this.box(x0, y - 1, Math.min(zs0, zs1), x1, y + 1, Math.max(zs0, zs1), 'sidewalk', 'patch', { sc: 8 });
      for (let x = x0; x <= x1; x++) for (let z = Math.min(zs0, zs1); z <= Math.max(zs0, zs1); z++) if ((x - x0) % 12 === 0 || (z - zs0) % 12 === 0) this.set(x, y + 1, z, 'seam');
      if (o.redCurb) for (let x = o.redCurb[0]; x <= o.redCurb[1]; x++) this.set(x, y + 1, zc0, 'curbRed');
    }
    return { roadZ: [zc - half, zc + half], walkN: [zc - half - 1 - walk, zc - half - 2], walkS: [zc + half + 2, zc + half + 1 + walk], top: y + 1 };
  }
  // grass lawn with soft colour patches and wildflowers
  lawn(x0, z0, x1, z1, yTop, o = {}) {
    this.box(x0, yTop - 2, z0, x1, yTop, z1, 'grass', 'patch', { sc: 5 });
    const fl = o.flowers ?? 0.012, cols = o.colors || ['#f4f0f0', '#ffd84a', '#ff8ab0', '#b49aff', '#ff6a4a'];
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const r = h3(x, 91, z);
      if (r < fl) this.v.set(x, yTop + 1, z, this.v.c(cols[Math.floor(h3(x, 3, z) * cols.length)]));
      else if (r < fl + (o.tufts ?? 0.05)) this.set(x, yTop + 1, z, 'grass');
    }
  }

  // ------------------------------------------------------------ Victorian row house (front faces +z)
  // o: { x, y (sidewalk top), z (front plane), w, d, scheme, lit, setback }
  victorian(o) {
    const k = this, v = this.v, S = o.scheme || SCHEMES[0];
    const x0 = o.x, w = o.w || 60, x1 = x0 + w - 1, zf = o.z, d = o.d || 72, zb = zf - d + 1, y0 = o.y;
    const GH = 22, FH = 26, yM = y0 + GH, yU = yM + FH, yC = yU + FH;      // garden level, main floor, upper floor, cornice
    const body = (x, y, z) => { const r = (y - y0) % 2; return v.c(r === 0 ? S.body[2] : h3(x >> 4, y, z) < 0.5 ? S.body[0] : S.body[1]); };   // 2-voxel clapboards
    const acc = (x, y, z) => v.c(((y - y0) % 2) === 0 ? S.accent[1] : S.accent[0]);
    const T = this.f('trim'), G = this.f('glass'), GL = this.f('glassLit');
    // body
    v.box(x0, y0, zb, x1, yC - 1, zf, body);
    // garden level: stucco base, recessed garage with panelled door
    k.box(x0, y0, zf - 1, x1, yM - 3, zf, (x, y, z) => v.c(h3(x, y, z) < 0.5 ? S.accent[0] : S.accent[1]));
    k.box(x0, yM - 2, zf - 1, x1, yM - 1, zf + 1, T);                                   // belt course
    const gx0 = x0 + 6, gx1 = x0 + 27;
    k.box(gx0, y0, zf - 3, gx1, y0 + 17, zf, (x, y) => v.c(((y - y0) % 5 === 4 || (x - gx0) % 11 === 0) ? S.deep : '#e8e2d4'));
    k.box(gx0 - 1, y0 + 18, zf, gx1 + 1, y0 + 19, zf + 1, T);
    // corner boards (proud of the wall)
    for (const cx of [x0, x0 + 1, x1 - 1, x1]) k.box(cx, yM, zf + 1, cx, yC - 1, zf + 1, T);
    // belt between main and upper floor
    k.box(x0, yU - 1, zf + 1, x1, yU, zf + 1, T);
    // ---- stoop: stairs from the sidewalk up to the main-floor porch (right side)
    const sx0 = x1 - 15, sx1 = x1 - 3, setback = o.setback || 24;
    for (let st = 0; st < 11; st++) {
      const ty = y0 + st * 2, tz = zf + setback - st * 2;
      k.box(sx0, y0, tz - 1, sx1, ty + 1, tz, (x, y) => v.c(y === ty + 1 ? '#c4beb4' : '#b0aaa0'));
    }
    k.box(sx0, y0, zf + 1, sx1, yM - 1, zf + 3, 'concrete');                         // landing
    for (const rx of [sx0 - 1, sx1 + 1]) for (let st = 0; st <= 11; st++) { const ty = y0 + st * 2 + 2, tz = zf + setback - st * 2; k.box(rx, ty, tz, rx, ty + 6, tz, T); if (st % 2 === 0) k.box(rx, ty, tz, rx, ty + 7, tz, T); }   // handrails
    // porch: recessed door with transom, columns, hood
    k.box(sx0 + 2, yM, zf - 4, sx1 - 2, yM + 21, zf, 0);                                 // carve the porch recess
    k.box(sx0 + 2, yM, zf - 5, sx1 - 2, yM + 21, zf - 5, body);
    const dx0 = sx0 + 3, dx1 = sx1 - 3;
    k.box(dx0, yM, zf - 5, dx1, yM + 16, zf - 5, (x, y) => v.c(((y - yM) % 8 === 7 || x === dx0 + 4) ? '#2a1e1e' : S.door));
    k.box(dx0, yM + 17, zf - 5, dx1, yM + 20, zf - 5, G);
    k.box(dx0 + 1, yM + 8, zf - 4, dx0 + 1, yM + 8, zf - 4, 'chrome');
    for (const cx of [sx0, sx0 + 1, sx1 - 1, sx1]) k.box(cx, yM, zf, cx, yM + 22, zf + 1, T);
    k.box(sx0 - 1, yM + 23, zf - 1, sx1 + 1, yM + 25, zf + 3, T);                       // porch hood
    // ---- the bay window: three-sided, two storeys, projecting 6 voxels with 45° sides
    const bx0 = x0 + 4, bx1 = x0 + 31, bP = 6, by0 = yM - 2, by1 = yC - 2;
    for (let p = 1; p <= bP; p++) {
      const ax = bx0 + p - 1, bxx = bx1 - p + 1, z = zf + p;
      k.box(ax, by0, z, bxx, by1, z, acc);
    }
    for (let fl = 0; fl < 2; fl++) {
      const wy0 = yM + 3 + fl * FH, wy1 = wy0 + 17;
      // front windows: two tall sashes
      for (const [a, b] of [[bx0 + bP + 2, bx0 + bP + 8], [bx1 - bP - 8, bx1 - bP - 2]]) {
        k.box(a - 1, wy0 - 1, zf + bP, b + 1, wy1 + 1, zf + bP, T);
        k.box(a, wy0, zf + bP, b, wy1, zf + bP, (x, y) => (y === wy0 + 9 ? v.c('#f2eee4') : (o.lit && h3(x, y, fl) > 0.4) ? GL(x, y, 0) : (x + y) % 9 === 0 ? this.m('glassHi')[0] : G(x, y, 0)));
        k.box(a, wy0, zf + bP - 1, b, wy1, zf + bP - 1, 0);
        k.box(a - 2, wy0 - 2, zf + bP + 1, b + 2, wy0 - 2, zf + bP + 1, T);         // sill
      }
      // side windows on the angled faces
      for (let p = 2; p <= bP - 1; p++) for (let yy = wy0; yy <= wy1; yy++) { v.set(bx0 + p - 1, yy, zf + p, (yy === wy0 + 9) ? v.c('#f2eee4') : G(p, yy, 0)); v.set(bx1 - p + 1, yy, zf + p, (yy === wy0 + 9) ? v.c('#f2eee4') : G(p, yy, 1)); }
      // trim band at the floor line of the bay
      for (let p = 1; p <= bP; p++) k.box(bx0 + p - 1, wy0 - 3, zf + p, bx1 - p + 1, wy0 - 2, zf + p, T);
    }
    for (let p = 1; p <= bP + 1; p++) k.box(bx0 + p - 2, by1 + 1, zf + p, bx1 - p + 2, by1 + 2, zf + p, T);   // bay cornice
    // ---- upper-floor windows over the porch
    for (const [a, b] of [[sx0 + 1, sx0 + 6], [sx1 - 6, sx1 - 1]]) {
      const wy0 = yU + 4, wy1 = wy0 + 16;
      k.box(a - 1, wy0 - 1, zf + 1, b + 1, wy1 + 1, zf + 1, T);
      k.box(a, wy0, zf + 1, b, wy1, zf + 1, (x, y) => (y === wy0 + 8 ? v.c('#f2eee4') : (o.lit && h3(x, y, 9) > 0.5) ? GL(x, y, 0) : G(x, y, 0)));
      k.box(a, wy0, zf, b, wy1, zf, 0);
      k.box(a - 2, wy1 + 2, zf + 1, b + 2, wy1 + 4, zf + 2, T);                       // hood mould
      k.box(a - 1, wy0 - 2, zf + 1, b + 1, wy0 - 2, zf + 2, T);
    }
    // ---- cornice with brackets and dentils
    k.box(x0 - 1, yC, zb, x1 + 1, yC + 3, zf + 3, T);
    for (let x = x0; x <= x1; x += 2) v.set(x, yC - 1, zf + 1, this.m('trimShade')[0]);
    for (let x = x0 + 2; x <= x1 - 2; x += 7) k.box(x, yC - 5, zf + 1, x + 1, yC - 1, zf + 3, T);
    // ---- front gable with fish-scale shingles, attic window, steep roof
    const gW = Math.floor(w / 2) + 2, rz0 = zb, rz1 = zf + 4;
    for (let l = 0; l <= gW; l++) {
      const y = yC + 4 + l, a = x0 - 2 + l, b = x1 + 2 - l; if (a > b) break;
      // roof slopes: two voxels thick, shingle rows along the slope
      for (const xx of [a, a + 1, b - 1, b]) k.box(xx, y, rz0, xx, y, rz1, (x, yy, z) => this.m(o.roof || 'roof')[(z + l) % 3 === 0 ? 2 : (l % 2 ? 0 : 1)]);
      // gable face: scallops in the accent colour
      if (b - a > 3) k.box(a + 2, y, zf + 1, b - 2, y, zf + 1, (x, yy) => { const r = (yy - yC) % 4, c = ((x + (Math.floor((yy - yC) / 4) % 2) * 2) % 4); return v.c(r === 3 || (r === 2 && (c === 0 || c === 3)) ? S.deep : (r === 0 ? S.accent[1] : S.accent[0])); });
      if (b - a > 3) k.box(a + 2, y, rz0, b - 2, y, zf, body);
      // barge boards
      k.box(a, y, rz1 + 1, a + 1, y, rz1 + 1, T); k.box(b - 1, y, rz1 + 1, b, y, rz1 + 1, T);
    }
    const mx = x0 + Math.floor(w / 2), ay = yC + 10;
    for (let yy = 0; yy < 12; yy++) for (let xx = -4; xx <= 4; xx++) { const r = Math.hypot(xx, Math.max(0, yy - 6)); if (yy > 6 && r > 5) continue; v.set(mx + xx, ay + yy, zf + 1, (Math.abs(xx) >= 4 || (yy > 6 && r > 4)) ? T(0, 0, 0) : (o.lit ? GL(xx, yy, 0) : G(xx, yy, 0))); }
    k.box(mx, yC + 4 + gW, rz1 + 1, mx, yC + 7 + gW, rz1 + 1, T);                     // finial
    // chimney
    k.box(x1 - 10, yC + 10, zb + 10, x1 - 6, yC + gW + 2, zb + 14, (x, y, z) => this.m(y % 3 === 0 ? 'mortar' : 'brick')[Math.floor(h3(x, y, z) * 3) % (y % 3 === 0 ? 1 : 4)]);
    // front garden strip
    k.box(x0, y0 - 1, zf + 1, sx0 - 2, y0, zf + setback, 'dirt', 'hash');
    for (let x = x0; x <= sx0 - 2; x++) for (let z = zf + bP + 2; z <= zf + setback - 2; z++) if (h3(x, 3, z) < 0.55) { const hh = 2 + Math.floor(h3(x, 4, z) * 4); k.box(x, y0 + 1, z, x, y0 + hh, z, 'hedge', 'hash'); }
    k.box(x0, y0, zf + setback, sx0 - 2, y0 + 3, zf + setback, T);                       // low fence
    for (let x = x0; x <= sx0 - 2; x += 3) k.box(x, y0 + 4, zf + setback, x, y0 + 5, zf + setback, T);
    return { door: [Math.round((dx0 + dx1) / 2), yM, zf - 5], top: yC + gW + 4 };
  }

  // ------------------------------------------------------------ trees & plants
  tree(x, y, z, kind = 'street', seed = 1) {
    const v = this.v, H = { street: 22, cypress: 30, euc: 64, bloom: 20, palm: 70, oak: 34 }[kind] || 24;
    const leaf = { street: 'leaf', cypress: 'leafDark', euc: 'leafEuc', bloom: 'leafBloom', palm: 'leaf', oak: 'leaf' }[kind] || 'leaf';
    const L = this.m(leaf);
    // trunk with a slight lean and root flare
    let tx = x, tz = z;
    for (let k = 0; k < H; k++) {
      const r = k < 3 ? 2 : kind === 'palm' ? 1 : k < H * 0.6 ? 1 : 1;
      if (kind === 'palm' && k % 6 === 0) tx += h3(seed, k, 1) > 0.5 ? 1 : 0;
      for (let dx = -r + 1; dx <= r - 1 + (r > 1 ? 1 : 0); dx++) for (let dz = -r + 1; dz <= r - 1 + (r > 1 ? 1 : 0); dz++) this.set(tx + dx, y + k, tz + dz, 'trunk');
    }
    const blob = (cx, cy, cz, rx, ry, rz, dens = 0.92) => {
      for (let j = -ry; j <= ry; j++) for (let kz = -rz; kz <= rz; kz++) for (let i = -rx; i <= rx; i++) {
        const d = (i * i) / (rx * rx) + (j * j) / (ry * ry) + (kz * kz) / (rz * rz) + (noise2(cx + i + seed * 7, cz + kz + j * 5, 3) - 0.5) * 0.6;
        if (d > 1) continue;
        if (d > 0.7 && h3(cx + i, cy + j, cz + kz) > dens) continue;
        // light from above: outer-top voxels lighter, underside darker
        const lt = (j / ry) * 0.6 + (h3(cx + i, cy + j, cz + kz) - 0.5) * 0.8;
        const idx = lt > 0.35 ? L[Math.min(L.length - 1, 4)] : lt > 0 ? L[2] : lt > -0.35 ? L[1] : L[3];
        if (!v.get(cx + i, cy + j, cz + kz)) v.set(cx + i, cy + j, cz + kz, idx);
      }
    };
    if (kind === 'cypress') {   // Monterey cypress: flat, layered, wind-swept crowns
      for (let l = 0; l < 4; l++) blob(tx + l * 4 - 4, y + H - 6 + l * 5, tz + (l % 2) * 3 - 1, 16 - l * 3, 4, 12 - l * 2, 0.86);
    } else if (kind === 'euc') {
      for (let l = 0; l < 5; l++) blob(tx + Math.round((h3(seed, l, 2) - 0.5) * 16), y + H - 18 + l * 7, tz + Math.round((h3(seed, l, 3) - 0.5) * 12), 9, 6, 8, 0.8);
    } else if (kind === 'palm') {
      for (let f = 0; f < 9; f++) { const a = f / 9 * Math.PI * 2; for (let r = 0; r < 18; r++) { const fx = tx + Math.round(Math.cos(a) * r), fz = tz + Math.round(Math.sin(a) * r), fy = y + H + Math.round(4 - r * r / 40); this.v.set(fx, fy, fz, L[(r + f) % L.length]); if (r % 2) this.v.set(fx, fy - 1, fz, L[3]); } }
    } else blob(tx, y + H + 4, tz, kind === 'oak' ? 18 : 12, kind === 'oak' ? 10 : 9, kind === 'oak' ? 16 : 12);
  }
  hedgeRow(x0, x1, y, z0, z1, hgt = 6) { this.box(x0, y, z0, x1, y + hgt, z1, (x, yy, z) => (yy === y + hgt && h3(x, yy, z) < 0.3 ? 0 : this.f('hedge')(x, yy, z))); }

  // ------------------------------------------------------------ street furniture
  lampPost(x, y, z, night) {
    this.box(x, y, z, x + 1, y + 34, z + 1, 'metal', 'hash');
    this.box(x - 1, y, z - 1, x + 2, y + 2, z + 2, 'metal', 'hash');
    this.box(x - 1, y + 35, z - 1, x + 2, y + 36, z + 2, 'metal', 'hash');
    this.box(x - 1, y + 37, z - 1, x + 2, y + 40, z + 2, 'lamp', 'one');
    this.box(x - 2, y + 41, z - 2, x + 3, y + 42, z + 3, 'metal', 'hash');
    return [(x + 1) / this.v.vpm, (y + 39) / this.v.vpm, (z + 1) / this.v.vpm];
  }
  hydrant(x, y, z) {
    const v = this.v, wb = v.c('#e8e4dc'), cap = v.c('#3a6ac8'), d = v.c('#b8b4ac');
    this.box(x, y, z, x + 2, y + 5, z + 2, () => wb); this.box(x - 1, y + 3, z + 1, x + 3, y + 3, z + 1, () => d); this.box(x, y + 6, z, x + 2, y + 6, z + 2, () => cap); v.set(x + 1, y + 7, z + 1, cap);
  }
  bench(x, y, z, len = 14) {
    this.box(x, y, z, x, y + 3, z, 'metal', 'hash'); this.box(x + len - 1, y, z, x + len - 1, y + 3, z, 'metal', 'hash');
    this.box(x, y + 3, z - 2, x + len - 1, y + 3, z + 1, 'wood', 'hash'); this.box(x, y + 4, z - 3, x + len - 1, y + 7, z - 3, 'wood', 'rows', { period: 2 });
  }
  // parked car (east–west): rounded body, wheel arches, glasshouse inset from the sides, bumpers
  car(x, y, z, col = '#c8483e', dir = 1) {
    const v = this.v, B0 = v.c(col), BL = v.c(shadeHex(col, 0.16)), BD = v.c(shadeHex(col, -0.22)), BDD = v.c(shadeHex(col, -0.4));
    const G = this.m('glass'), GH = this.m('glassHi'), T = this.m('tire'), CH = this.m('chrome'), L = 36, W = 14;
    const P = (i, hgt, k, c) => v.set(x + (dir > 0 ? i : L - 1 - i), y + hgt, z + k, c);
    for (let i = 0; i < L; i++) {
      const nose = i > L - 4, tail = i < 3, hoodZone = i >= L - 11, trunkZone = i < 8;
      const bodyTop = nose || tail ? 5 : 6;
      for (let k = 0; k < W; k++) {
        const side = k === 0 || k === W - 1, corner = (i === 0 || i === L - 1) && side;
        if (corner) continue;
        for (let hgt = 2; hgt <= bodyTop; hgt++) P(i, hgt, k, hgt === 2 ? BDD : hgt <= 3 ? BD : hgt === bodyTop ? BL : B0);
        if (side) P(i, 4, k, CH[1]);                                      // a chrome trim line
      }
      // cabin: inset one voxel from each side, slanted glass front and back
      const cabin = i >= 9 && i <= L - 12;
      if (cabin) for (let k = 1; k < W - 1; k++) for (let hgt = 7; hgt <= 10; hgt++) {
        const front = i >= L - 14, back = i <= 10;
        if (hgt === 10 && (i === 9 || i === L - 12)) continue;
        if ((front && hgt > 7 + (L - 12 - i)) || (back && hgt > 7 + (i - 9))) continue;
        const sideK = k === 1 || k === W - 2, pillar = i === 9 || i === L - 12 || i === 18;
        const c = hgt === 10 ? BL : (pillar && !(front || back)) ? B0 : (sideK || front || back) ? (h3(i, hgt, k) > 0.8 ? GH[0] : G[(i + hgt) % G.length]) : BL;
        P(i, hgt, k, c);
      }
    }
    // wheels in their arches
    for (const fx of [6, L - 8]) for (const k of [0, W - 1]) {
      for (let dx = -2; dx <= 2; dx++) for (let hgt = 0; hgt <= 4; hgt++) { if (Math.abs(dx) === 2 && (hgt === 0 || hgt === 4)) continue; P(fx + dx, hgt, k, (dx === 0 && hgt === 2) ? CH[0] : T[(dx + hgt) & 1]); }
      for (let dx = -3; dx <= 3; dx++) P(fx + dx, 5, k, BDD);
    }
    // bumpers, lights, plates
    for (let k = 1; k < W - 1; k++) { P(L - 1, 3, k, CH[0]); P(0, 3, k, CH[0]); }
    for (const k of [1, 2, W - 3, W - 2]) { P(L - 1, 5, k, this.m('headlight')[0]); P(0, 5, k, this.m('taillight')[0]); }
    P(0, 4, 6, v.c('#f0f0e8')); P(0, 4, 7, v.c('#f0f0e8'));
  }
}
export function shadeHex(hex, k) {
  const v = parseInt(hex.slice(1), 16), f = (c) => Math.max(0, Math.min(255, Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k))));
  return '#' + [f((v >> 16) & 255), f((v >> 8) & 255), f(v & 255)].map((n) => n.toString(16).padStart(2, '0')).join('');
}
