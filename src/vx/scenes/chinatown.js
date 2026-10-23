// Chinatown, Grant Avenue — where the game begins. A hand-built diorama of the
// street at golden hour (and at night, when the lanterns and neon come on):
// the Dragon Gate at the west end, a row of shophouses with balconies, bays,
// fire escapes, tile eaves and a pagoda-roofed corner tower, the California
// Street cable car crossing at the east end, and Portsmouth Square raised above
// the south sidewalk with its pavilion, chess tables and ginkgo trees. Painted
// 2D detail sits on the voxels: lanterns, CJK shop signs, posters, menus,
// window displays, leaf cards, laundry.
import { Fine, GLOW } from '../fine.js';
import { Kit, h3, noise2 } from '../kit.js';
import { Dress } from '../dress.js';
import { SPR } from '../cards.js';
import { skyline } from '../stage.js';
import { decal, loadSignFonts } from '../decals.js';
import { bx, C, LIT, one, many, pagodaRoof, paifang, lion, pavilion, ctLamp, win, railing, balcony, loggia, fireEscape, awning, tileEave, shutter, waterTank, condenser, roofHut, chessTable, newsBoxes, trashCan, bench, van, shade, brackets, ell, cylY, cableCar, lanternCards, bike, handTruck, cart, P, SIGN_TEXT } from './chinatown_parts.js';

// ---- layout (voxels, 8 per metre). x runs along Grant Avenue, z toward the camera.
const SY = 8, WY = 9, Y0 = 10, PY = 17;          // asphalt top, sidewalk top, ground floor, plaza top
const ZF = 111, ZB = 50;                          // north row: front wall layer, back wall
const ROAD = [137, 194], SWN = [112, 135], SWS = [196, 219], PZ = 220;
const XC = 448, GX = 40;                          // cross street (California St) from x 448; gate centre
const GH = 38, FH = 26;                           // ground-floor and upper-floor heights
const fl = (n) => Y0 + GH + (n - 1) * FH;         // bottom of upper floor n (1-based)
const roofY = (n) => fl(n + 1) - 1;               // roof deck layer of a building with n upper floors

export const view = { target: [32, 8, 22], dist: 70, yaw: 0, pitch: 30 };
// cutscene cameras (metres; yaw 0 = camera on the +z side looking north)
export const shots = [
  { name: 'hub', ...view },                                                   // the whole diorama: street, gate, tower, square
  { name: 'gate', target: [6, 5.5, 20.5], dist: 22, yaw: -72, pitch: 9 },       // the Dragon Gate from outside, Grant Avenue through the arch
  { name: 'gateInside', target: [5, 6, 20.5], dist: 26, yaw: 62, pitch: 16 },   // the gate from inside Chinatown: plaque, roofs, a lion
  { name: 'street', target: [30, 4, 19], dist: 34, yaw: 72, pitch: 14 },        // down Grant Avenue under the lanterns toward the gate
  { name: 'square', target: [30, 2.5, 36], dist: 30, yaw: -18, pitch: 38 },     // Portsmouth Square and its pavilion
  { name: 'chess', target: [45, 3, 38], dist: 11, yaw: 10, pitch: 40 },         // the xiangqi tables
  { name: 'bakery', target: [17.7, 3, 14.5], dist: 11, yaw: 4, pitch: 10 },     // Lucky Moon Bakery: egg tarts in the window
  { name: 'shops', target: [24, 8, 14], dist: 22, yaw: 0, pitch: 8 },           // herbalist, jeweller and teahouse fronts
  { name: 'temple', target: [31, 12, 13], dist: 16, yaw: 0, pitch: 6 },         // the temple balcony atop the teahouse
  { name: 'alley', target: [36.5, 6, 12], dist: 18, yaw: -22, pitch: 12 },      // Fortune Cookie alley: mural, laundry, lanterns
  { name: 'tower', target: [54, 18, 12], dist: 26, yaw: -28, pitch: 14 },       // the pagoda corner tower
  { name: 'cableCar', target: [57, 4, 31], dist: 18, yaw: 35, pitch: 10 },      // the California Street cable car
];

export async function prepare() { await loadSignFonts(SIGN_TEXT); }

// Build with an unbounded palette (16-bit voxels), then fold it into the 255 entries
// the mesher supports: unused colours drop out, then the least-used colours merge
// into their nearest neighbour with the same flags (GLOW stays GLOW), so the colours
// that cover the most surface stay exact.
function widePalette(v) {
  v.d = new Uint16Array(v.X * v.Y * v.Z);
  v.c = function (hex, flags = 0) {
    const key = hex + '|' + flags; let i = this.idx.get(key);
    if (i === undefined) { const n = parseInt(hex.slice(1), 16); i = this.pal.length; this.pal.push([(n >> 16) & 255, (n >> 8) & 255, n & 255]); this.flag.push(flags); this.idx.set(key, i); }
    return i;
  };
}
function foldPalette(v, max = 255) {
  const n = v.pal.length, cnt = new Float64Array(n), d = v.d;
  for (let i = 0; i < d.length; i++) cnt[d[i]]++;
  const rep = new Int32Array(n).map((_, i) => i), live = [];
  for (let i = 1; i < n; i++) if (cnt[i] > 0) live.push(i);
  const dist = (a, b) => { const A = v.pal[a], B = v.pal[b], rm = (A[0] + B[0]) / 2, dr = A[0] - B[0], dg = A[1] - B[1], db = A[2] - B[2]; return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db; };
  while (live.length > max) {
    let best = Infinity, bi = -1, bj = -1;
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j]; if (v.flag[a] !== v.flag[b]) continue;
      const c = dist(a, b) * Math.min(cnt[a], cnt[b]); if (c < best) { best = c; bi = i; bj = j; }
    }
    if (bi < 0) break;
    const a = live[bi], b = live[bj], keep = cnt[a] >= cnt[b] ? a : b, drop = keep === a ? b : a;
    rep[drop] = keep; cnt[keep] += cnt[drop]; live.splice(keep === a ? bj : bi, 1);
  }
  const root = (i) => { while (rep[i] !== i) i = rep[i]; return i; }, map = new Uint8Array(n), pal = [[0, 0, 0]], flag = [0];
  for (const i of live) { map[i] = pal.length; pal.push(v.pal[i]); flag.push(v.flag[i]); }
  for (let i = 1; i < n; i++) if (cnt[i] >= 0) map[i] = map[root(i)];
  const d8 = new Uint8Array(d.length); for (let i = 0; i < d.length; i++) d8[i] = map[d[i]];
  const idx = new Map(); for (const [key, i] of v.idx) if (map[root(i)]) idx.set(key, map[root(i)]);
  Object.assign(v, { d: d8, pal, flag, idx }); delete v.c;
  return { colours: n - 1, kept: live.length };
}

export function build(o = {}) {
  const night = o.mood === 'night';
  const v = new Fine(512, 224, 384, 8); widePalette(v);
  const k = new Kit(v), dr = new Dress(k), lamps = [], D = [], glowLights = [];
  const B = (...a) => bx(k, ...a);
  // paper lanterns on a wire (our own saturated sprites; they glow at night)
  const LAN = lanternCards();
  const lanterns = (a, b, q = {}) => {
    const at = dr.wire(a, b, q.sag ?? 10, 0x3a1e1e), L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(2, Math.floor(L / (q.step || 9)));
    for (let i = 1; i < n; i++) { const p = at(i / n), spr = q.big ? LAN.big[(i + (q.alt || 0)) % 2] : LAN.small[(i + (q.alt || 0)) % (q.mixed ? 2 : 1)]; dr.card(spr, p[0], p[1], p[2], { hang: true, glow: true, sway: 0.6, scale: q.scale || 1 }); }
  };
  // decals on voxel faces: S = +z face of layer zl; E = +x face of column xl; W = -x face of column xl; U = top of layer yl
  const dS = (x0, y0, x1, y1, zl, paint, q = {}) => D.push({ x: (x0 + x1 + 1) / 16, y: y0 / 8, z: (zl + 1) / 8, w: (x1 - x0 + 1) / 8, h: (y1 - y0 + 1) / 8, face: 's', paint, ...q });
  const dE = (z0, y0, z1, y1, xl, paint, q = {}) => D.push({ x: (xl + 1) / 8, y: y0 / 8, z: (z0 + z1 + 1) / 16, w: (z1 - z0 + 1) / 8, h: (y1 - y0 + 1) / 8, face: 'e', paint, ...q });
  const dW = (z0, y0, z1, y1, xl, paint, q = {}) => D.push({ x: xl / 8, y: y0 / 8, z: (z0 + z1 + 1) / 16, w: (z1 - z0 + 1) / 8, h: (y1 - y0 + 1) / 8, face: 'w', paint, ...q });
  const dU = (x0, z0, x1, z1, yl, paint, q = {}) => D.push({ x: (x0 + x1 + 1) / 16, y: (yl + 1) / 8, z: (z1 + 1) / 8, w: (x1 - x0 + 1) / 8, h: (z1 - z0 + 1) / 8, face: 'up', paint, ...q });
  const light = (x, y, z, col, pow, dist) => glowLights.push([x / 8, y / 8, z / 8, col, pow, dist]);
  // materials
  const stucco = (hexes) => { const S = many(k, hexes); return (x, y, z) => S[Math.min(S.length - 1, Math.floor((noise2(x + z, y * 1.4, 6) * 0.7 + h3(x, y, z) * 0.3) * S.length))]; };
  const brick = (hexes, mortar) => { const S = many(k, hexes), M = one(k, mortar); return (x, y, z) => { const r = y >> 1, u = x + z + ((r & 1) << 1); if ((y & 1) === 0 && ((u & 3) === 0 || h3(u >> 2, r, 9) < 0.18)) return M; return S[Math.floor(h3(u >> 2, r, 3) * S.length)]; }; };
  const ROOF = many(k, ['#5a5654', '#625e5b', '#54504e', '#6a6562']), GRAV = one(k, '#7a746c');
  const glass = (lit) => (x, y) => (night && lit ? one(k, (x + y) % 5 ? LIT[0] : LIT[2], GLOW) : night ? one(k, '#141824') : one(k, (x - y + 400) % 11 < 2 ? '#7d94b0' : y % 7 < 3 ? '#344460' : '#2c3a54'));

  // ---------------------------------------------------------------- ground
  B(0, 0, 0, 511, 5, 383, 'dirt', 'hash');
  B(0, 6, 0, XC - 1, Y0 - 1, SWN[0] - 1, one(k, '#5e5650'));     // under the north row
  B(0, 6, ROAD[0], 511, SY, ROAD[1], 'asphalt', 'hash');
  for (let x = 0; x < 512; x++) for (let z = ROAD[0]; z <= ROAD[1]; z++) { if (noise2(x, z, 11) > 0.7) k.set(x, SY, z, 'asphaltOld'); if (h3(x, 7, z) > 0.997) k.set(x, SY, z, 'tar'); }
  const walk = (x0, x1, z0, z1, ox = 0, oz = 0) => { B(x0, 6, z0, x1, WY, z1, 'sidewalk', 'patch', { sc: 8 }); for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if ((x - ox) % 12 === 0 || (z - oz) % 12 === 0) k.set(x, WY, z, 'seam'); };
  walk(0, XC + 17, SWN[0], SWN[1], 0, SWN[0]); B(0, 6, 136, XC + 17, WY, 136, 'curb', 'hash');
  walk(0, XC + 17, SWS[0], SWS[1], 0, SWS[0]); B(0, 6, 195, XC + 17, WY, 195, 'curb', 'hash');
  walk(XC, XC + 17, 0, ROAD[0] - 2, XC, 0); walk(XC, XC + 17, ROAD[1] + 2, 383, XC, 0);
  B(XC + 18, 6, 0, XC + 18, WY, ROAD[0] - 2, 'curb'); B(XC + 18, 6, ROAD[1] + 2, XC + 18, WY, 383, 'curb');
  B(XC + 19, 6, 0, 511, SY, 383, 'asphalt', 'hash');
  for (let x = XC + 19; x < 512; x++) for (let z = 0; z < 384; z++) if (noise2(x * 1.3, z, 9) > 0.72) k.set(x, SY, z, 'asphaltOld');
  // red curb along the square, a yellow loading zone
  for (let x = 0; x <= XC + 17; x++) if (x < 280 || x > 352) k.set(x, WY, 195, 'curbRed'); else v.set(x, WY, 195, one(k, '#d8b030'));
  // lane paint: dashed centre line, parking ticks on the north side
  for (let x = 0; x < XC + 19; x++) { if (x % 24 < 12) for (const z of [166, 167]) k.set(x, SY, z, 'lineW'); if (x % 48 === 0) for (let z = 137; z <= 152; z++) k.set(x, SY, z, 'lineW'); }
  // crosswalks: across Grant at the California corner and outside the gate
  for (const [x0, x1] of [[XC + 2, XC + 16], [4, 18]]) for (let z = ROAD[0] + 1; z < ROAD[1]; z++) if ((z - ROAD[0]) % 8 < 4) B(x0, SY, z, x1, SY, z, 'lineW');
  for (let x = XC + 20; x < 511; x++) if ((x - XC) % 8 < 4) { B(x, SY, SWN[0] + 2, x, SY, SWN[1] - 2, 'lineW'); B(x, SY, SWS[0] + 2, x, SY, SWS[1] - 2, 'lineW'); }
  // manholes and storm drains
  for (const [mx, mz] of [[120, 175], [300, 158], [470, 260]]) cylY(v, mx, mz, 2.6, SY, SY, (x, y, z, d) => (d > 2 ? one(k, '#2a2a2e') : (x + z) % 2 ? one(k, '#3e3c3a') : one(k, '#4a4744')));
  for (const dx of [60, 230, 410]) for (let x = dx; x < dx + 6; x++) { v.set(x, WY, 136, one(k, '#232326')); v.set(x, SY, 137, x % 2 ? one(k, '#26262a') : one(k, '#3a3a3e')); }

  // ---------------------------------------------------------------- the north row of shophouses
  // shared massing: solid body with a hollow core, tar roof, parapet with coping, belt courses
  const house = (q) => {
    const { x0, x1, n } = q, yr = roofY(n), zb = q.zb ?? ZB, par = q.par ?? 6;
    B(x0, Y0, zb, x1, yr, ZF, q.wall);
    // a shallow hollow behind the facade: greedy-mesh cracks then show a dim wall tone, not the ground
    B(x0 + 3, Y0 + 14, ZF - 38, x1 - 3, yr - 2, ZF - 22, one(k, q.core || '#9a8e7e'));
    B(x0 + 4, Y0 + 15, ZF - 37, x1 - 4, yr - 3, ZF - 23, 0);
    B(x0 + 1, yr, zb + 1, x1 - 1, yr, ZF - 2, (x, y, z) => (h3(x, z, 4) < 0.08 ? GRAV : ROOF[Math.floor(noise2(x, z, 5) * 3.99)]));
    B(x0, yr + 1, zb, x1, yr + 2, zb, q.wall); B(x0, yr + 1, zb, x0, yr + 2, ZF, q.wall); B(x1, yr + 1, zb, x1, yr + 2, ZF, q.wall);
    B(x0, yr + 1, ZF - 1, x1, yr + par, ZF, q.wall);
    const T = one(k, q.trim || '#ece4d2'), T2 = one(k, q.trim2 || shade(q.trim || '#ece4d2', -0.12));
    if (q.coping !== false) B(x0, yr + par + 1, ZF - 2, x1, yr + par + 1, ZF + 1, T);
    if (q.cornice === 'bracket') {
      B(x0, yr - 3, ZF + 1, x1, yr - 1, ZF + 3, (x, y, z) => (y === yr - 1 ? T : z === ZF + 1 ? T2 : (y === yr - 3 && (x & 1) ? T2 : T)));
      for (let x = x0 + 2; x <= x1 - 3; x += 7) B(x, yr - 7, ZF + 1, x + 1, yr - 4, ZF + 2, (xx, y, z) => (y === yr - 7 && z === ZF + 2 ? undefined : T2));
    } else if (q.cornice === 'corbel') {
      for (let j = 0; j < 4; j++) for (let x = x0; x <= x1; x++) if (j === 3 || (x + j) % 3 !== 0) v.set(x, yr - 4 + j, ZF + 1 + (j >> 1), j === 3 ? T : T2);
    } else if (q.cornice === 'band') B(x0, yr - 2, ZF + 1, x1, yr - 1, ZF + 1, T);
    if (q.belts !== false) for (let f = 1; f <= n; f++) B(x0, fl(f) - 1, ZF + 1, x1, fl(f), ZF + 1, f === 1 ? T : T2);
    return yr;
  };
  // ground floor kit: piers at the ends, a sign band, display windows over bulkheads, recessed door
  const storefront = (q) => {
    const { x0, x1 } = q, P0 = one(k, q.pier || '#d8d2c6'), P1 = one(k, shade(q.pier || '#d8d2c6', -0.14));
    for (const [a, b] of [[x0, x0 + 2], [x1 - 2, x1]]) B(a, Y0, ZF + 1, b, fl(1) - 2, ZF + 1, (x, y) => (y % 6 === 0 ? P1 : P0));
    const sy0 = Y0 + 27, sy1 = fl(1) - 3;               // sign band
    B(x0 + 3, sy0 - 1, ZF + 1, x1 - 3, sy0 - 1, ZF + 1, P1);
    return { sy0, sy1, gy0: Y0 + 4, gy1: Y0 + 24 };
  };
  // a display window: bulkhead, recessed glass (or an open painted display), transom
  const shopWin = (x0, x1, q = {}) => {
    const bk = one(k, q.bulk || '#7a3a30'), F = one(k, q.frame || '#2a2622'), gy0 = Y0 + 4, gy1 = Y0 + (q.top ?? 22), dep = q.deep ?? 2;
    B(x0, Y0, ZF, x1, gy0 - 1, ZF, (x, y) => (y === gy0 - 1 ? F : (x - x0) % 6 === 0 ? F : bk));
    B(x0, gy0, ZF - dep + 1, x1, gy1, ZF, 0);
    B(x0, gy0, ZF - dep, x1, gy1, ZF - dep, q.back ?? glass(true));
    B(x0, gy0 - 1, ZF - dep + 1, x1, gy0 - 1, ZF - 1, F);
    for (let x = x0; x <= x1; x++) for (let y = gy0; y <= gy1; y++) if (x === x0 || x === x1 || y === gy1 || (q.mull && (x - x0) % q.mull === 0)) v.set(x, y, ZF - dep + 1, F);
    if (q.transom !== false) { B(x0, gy1 + 1, ZF - 1, x1, gy1 + 3, ZF - 1, (x, y) => ((x - x0) % 4 === 0 || y === gy1 + 1 ? F : glass(true)(x, y))); B(x0, gy1 + 1, ZF, x1, gy1 + 3, ZF, 0); }
    if (night && q.lamp !== false) light((x0 + x1) / 2, gy0 + 10, ZF + 6, 0xffc070, q.pow ?? 10, 6.5);
    return { y0: gy0, y1: gy1, z: ZF - dep };
  };
  const door = (x0, x1, q = {}) => {
    const dep = q.deep ?? 4, F = one(k, q.frame || '#2a2622'), Dc = one(k, q.col || '#7a1e22'), top = Y0 + (q.h ?? 22);
    B(x0, Y0, ZF - dep + 1, x1, top, ZF, 0);
    B(x0, Y0 - 1, ZF - dep + 1, x1, Y0 - 1, ZF, one(k, q.step || '#b8b0a2'));
    B(x0, Y0, ZF - dep, x1, top, ZF - dep, (x, y) => (x === x0 || x === x1 || y === top ? F : q.glass && y > Y0 + 9 && y < top - 2 && x !== Math.round((x0 + x1) / 2) ? glass(true)(x, y) : (y - Y0) % 7 === 6 ? F : Dc));
    v.set(x1 - 2, Y0 + 10, ZF - dep + 1, one(k, '#d8b440'));
    return { cx: (x0 + x1 + 1) / 2, z: ZF - dep, top };
  };
  const signBox = (x0, y0, x1, y1, col, dz = 2) => B(x0, y0, ZF + 1, x1, y1, ZF + dz, one(k, col));
  const neonTube = (x0, y0, x1, y1, z, col, dayCol) => { const c = night ? one(k, col, GLOW) : one(k, dayCol); for (let x = x0; x <= x1; x++) { v.set(x, y0, z, c); v.set(x, y1, z, c); } for (let y = y0; y <= y1; y++) { v.set(x0, y, z, c); v.set(x1, y, z, c); } };
  // projecting blade sign (perpendicular to the facade) with painted faces on both sides
  const blade = (x, y0, y1, depth, col, paint, q = {}) => {
    B(x, y0, ZF + 2, x + 1, y1, ZF + 1 + depth, one(k, col));
    for (const yy of [y0 + 2, y1 - 2]) B(x, yy, ZF + 1, x + 1, yy, ZF + 1, one(k, '#2a2a2e'));
    const tube = q.tube;
    if (tube) for (const xx of [x - 1, x + 2]) { const c = night ? one(k, tube, GLOW) : one(k, q.tubeDay || '#e8d8c8'); for (let z = ZF + 2; z <= ZF + 1 + depth; z++) { v.set(xx, y0, z, c); v.set(xx, y1, z, c); } for (let y = y0; y <= y1; y++) { v.set(xx, y, ZF + 2, c); v.set(xx, y, ZF + 1 + depth, c); } }
    const off = tube ? 1 : 0;
    dE(ZF + 2 + off, y0 + off, ZF + depth - off, y1 - off, x + 1 + off, paint, { glow: q.glow, ppm: q.ppm || 40, off: 0.02 });
    dW(ZF + 2 + off, y0 + off, ZF + depth - off, y1 - off, x - off, paint, { glow: q.glow, ppm: q.ppm || 40, off: 0.02 });
    if (night && q.glow) light(x + 1, (y0 + y1) / 2, ZF + 1 + depth / 2, q.lightCol || 0xff6a50, 6, 7);
  };
  const plant = (x, y, z, kind = 'fern', col = '#b85a3a', seed = 1) => dr.pot(x, y, z, kind, col, seed);

  // ---------------------------------------------------------------- B0: the corner outside the gate (3 storeys, cream brick)
  {
    const x0 = 0, x1 = 63, wall = brick(['#d6c8ae', '#ccbea4', '#dccfb6', '#c4b69c'], '#e6dcc8');
    const yr = house({ x0, x1, n: 2, wall, trim: '#f0e8d8', cornice: 'bracket', core: '#c8bca4' });
    const sf = storefront({ x0, x1, pier: '#8a8278' });
    shopWin(4, 22, { mull: 6, bulk: '#2e4a3c' }); door(24, 31, { col: '#2e4a3c', glass: true }); shopWin(33, 59, { mull: 9, bulk: '#2e4a3c', lamp: false });
    signBox(4, sf.sy0, 59, sf.sy1, '#1f3a2e');
    dS(4, sf.sy0, 59, sf.sy1, ZF + 2, P.board({ cjk: '華埠樂器', en: 'GATEWAY MUSIC & GEAR', bg: '#1f3a2e', bg2: '#244436', text: '#f0d070', frame: '#c89a3a' }), { ppm: 96 });
    awning(k, { x0: 4, x1: 59, y: sf.sy0 - 2, zf: ZF, D: 9, drop: 4, cols: ['#2e6a4c', '#e8e0cc'], sw: 4 });
    for (let f = 1; f <= 2; f++) for (const x of [4, 18, 35, 49]) win(k, { x0: x, x1: x + 8, y0: fl(f) + 5, y1: fl(f) + 19, zf: ZF, night, head: 'brick', brickHead: '#a88e70', frame: '#2e4a3c', trim: '#efe6d4' });
    fireEscape(k, { x0: 2, x1: 30, zf: ZF, levels: [fl(1) + 4, fl(2) + 4], D: 7, ladderX: 24, drop: fl(1) - 6 });
  }

  // ---------------------------------------------------------------- B1: Golden Dragon restaurant (4 storeys, cream stucco, green loggias, red trim)
  {
    const x0 = 64, x1 = 119, wall = stucco(['#ead9b8', '#e4d2b0', '#efe0c2']);
    const yr = house({ x0, x1, n: 3, wall, trim: '#f4ecdc', cornice: 'none', par: 8, core: '#d8c6a4' });
    const sf = storefront({ x0, x1, pier: '#8e2a2a' });
    // ground: roast-duck window, red double doors under a little tile roof, menu window
    const duck = shopWin(68, 84, { deep: 6, bulk: '#6a1e20', frame: '#3a1a14', back: one(k, night ? '#e8b070' : '#6a3a28', night ? GLOW : 0), transom: false, pow: 12 });
    B(68, duck.y1 - 1, ZF - 5, 84, duck.y1 - 1, ZF - 5, one(k, '#c8c8cc'));
    door(87, 97, { col: '#b02428', h: 23, deep: 3 });
    tileEave(k, { x0: 85, x1: 99, y: Y0 + 25, zf: ZF, D: 4, rise: 3, lift: 2 });
    shopWin(100, 115, { mull: 8, bulk: '#6a1e20', frame: '#3a1a14', lamp: false });
    signBox(67, sf.sy0, 116, sf.sy1, '#9a1e22');
    dS(67, sf.sy0, 116, sf.sy1, ZF + 2, P.board({ cjk: '金龍酒家', en: 'GOLDEN DRAGON', bg: '#a01e22', bg2: '#b4262a', text: '#f6d060', frame: '#e8b83a', dragon: true }), { ppm: 48, glow: true });
    dS(69, Y0 + 5, 83, Y0 + 21, ZF - 6, P.ducks(), { ppm: 40, glow: true, off: 0.01 });
    dS(101, Y0 + 7, 114, Y0 + 20, ZF - 2, P.menu({ title: '菜單', lines: ['燒鴨 ROAST DUCK', '叉燒 BBQ PORK', '炒麵 CHOW MEIN', '雲吞 WONTON', '點心 DIM SUM'] }), { ppm: 48, glow: true });
    // upper floors: a stack of green loggias in the middle, red-framed windows either side, a tile eave crown
    for (let f = 1; f <= 3; f++) {
      const y = fl(f);
      loggia(k, { x0: 82, x1: 101, y0: y + 2, y1: y + 21, zf: ZF, R: 5, style: 'fret', col: '#2c7a52', col2: '#1f5a3c', wall: stucco(['#d8c6a2', '#d2bf9a']) });
      win(k, { x0: 87, x1: 96, y0: y + 3, y1: y + 18, zf: ZF - 5, inset: 1, night, frame: '#2c7a52', head: 'none', grid: [2, 2] });
      for (const x of [68, 105]) win(k, { x0: x, x1: x + 9, y0: y + 5, y1: y + 19, zf: ZF, night, frame: '#a02a2a', trim: '#f4ecdc', head: 'hood', grid: [2, 3] });
      B(81, y + 22, ZF + 1, 102, y + 22, ZF + 1, one(k, '#f4ecdc'));
      dr.card(LAN.small[f % 2], 91.5, y + 21, ZF - 2, { hang: true, glow: true, sway: 0.4, scale: 1.2 });
      if (f === 1) plant(84, y + 2, ZF - 2, 'fern', '#b85a3a', 31); if (f === 2) plant(99, y + 2, ZF - 2, 'bamboo', '#3a6a8a', 32);
    }
    plant(85, Y0, ZF + 3, 'bamboo', '#c89a3a', 33); plant(99, Y0, ZF + 3, 'bamboo', '#c89a3a', 34);
    tileEave(k, { x0: x0 - 1, x1: x1 + 1, y: yr - 4, zf: ZF, D: 8, rise: 5, lift: 4 });
    // a raised central pediment with a gold 福 medallion
    B(82, yr + 7, ZF - 1, 101, yr + 13, ZF, wall);
    for (let j = 0; j < 4; j++) B(82 + j * 2, yr + 14 + j, ZF - 1, 101 - j * 2, yr + 14 + j, ZF, wall);
    B(80, yr + 7, ZF + 1, 103, yr + 7, ZF + 1, one(k, '#f4ecdc'));
    for (let y = yr + 9; y <= yr + 16; y++) for (let x = 88; x <= 95; x++) { const d = Math.hypot(x - 91.5, y - (yr + 12.5)); if (d < 4) v.set(x, y, ZF + 1, d > 3 ? one(k, C.gold[0]) : one(k, '#b02428')); }
    dS(88, yr + 9, 95, yr + 16, ZF + 1, P.fu({ round: true }), { ppm: 48 });
    // a vertical neon blade sign
    blade(116, fl(1) + 2, fl(3) + 14, 12, '#2a1a1a', P.vneon({ cjk: '金龍', col: '#ffd040', edge: '#ff5030' }), { glow: true, tube: '#ff4a3a', tubeDay: '#e8a090', lightCol: 0xff8040 });
    waterTank(k, 74, yr + 1, 70, { r: 6, h: 12, leg: 6 });
    condenser(k, 100, yr + 1, 60); condenser(k, 108, yr + 1, 60);
  }

  // ---------------------------------------------------------------- B2: Lucky Moon Bakery (2 storeys, mint stucco, a box bay, a roof garden)
  {
    const x0 = 120, x1 = 163, wall = stucco(['#a6ceb4', '#9ec6ac', '#b0d6bc']);
    const yr = house({ x0, x1, n: 1, wall, trim: '#f6f2e8', cornice: 'bracket', par: 7, core: '#8eb49c' });
    const sf = storefront({ x0, x1, pier: '#f2ece0' });
    const bw = shopWin(124, 148, { deep: 3, bulk: '#e8a8b0', frame: '#f6f2e8', mull: 12, transom: false, back: one(k, night ? '#ffe2b0' : '#f2dcc0', night ? GLOW : 0), pow: 14 });
    dS(124, bw.y0, 148, bw.y1, ZF - 3, P.bakery(), { ppm: 48, glow: true, off: 0.01 });
    door(151, 159, { col: '#f6f2e8', glass: true, frame: '#d88a96' });
    dS(152, Y0 + 12, 158, Y0 + 16, ZF - 4, P.openSign(), { ppm: 48, glow: true, off: 0.02 });
    // A-frame menu board on the sidewalk
    B(140, Y0, 121, 140, Y0 + 7, 121, one(k, '#5a3a24')); B(146, Y0, 121, 146, Y0 + 7, 121, one(k, '#5a3a24')); B(140, Y0 + 1, 122, 146, Y0 + 8, 122, one(k, '#2a2420'));
    dS(140, Y0 + 1, 146, Y0 + 8, 122, P.chalk(), { ppm: 48 });
    awning(k, { x0: 122, x1: 161, y: sf.sy0 - 2, zf: ZF, D: 10, drop: 5, cols: ['#e88a9c', '#f8f0e6'], sw: 3 });
    signBox(123, sf.sy0, 160, sf.sy1, '#f6f2e8');
    dS(123, sf.sy0, 160, sf.sy1, ZF + 2, P.board({ cjk: '月滿餅家', en: 'LUCKY MOON BAKERY', bg: '#f6f0e4', bg2: '#efe6d6', text: '#c8364a', frame: '#e88a9c', en2: '#3a6a5a' }), { ppm: 48 });
    // box bay on the upper floor
    const y = fl(1), zb = ZF, P3 = 5;
    B(126, y + 1, zb + 1, 157, y + 22, zb + P3, wall);
    B(125, y, zb + 1, 158, y, zb + P3 + 1, one(k, '#f6f2e8')); B(125, y + 23, zb + 1, 158, y + 24, zb + P3 + 1, one(k, '#f6f2e8'));
    for (let x = 127; x <= 156; x += 6) B(x, y - 3, zb + 1, x + 1, y - 1, zb + 3, one(k, '#f6f2e8'));
    for (const [a, b] of [[128, 137], [139, 145], [147, 155]]) win(k, { x0: a, x1: b, y0: y + 5, y1: y + 19, zf: zb + P3, night, frame: '#f6f2e8', head: 'none', grid: [2, 2], inset: 2 });
    for (const xs of [126, 157]) for (let z = zb + 2; z <= zb + 3; z++) for (let yy = y + 5; yy <= y + 19; yy++) v.set(xs, yy, z, glass(h3(xs, 3, 1) < 0.5)(xs, yy));
    // flower box under the bay
    B(128, y - 4, zb + 1, 155, y - 2, zb + 3, one(k, '#c8506a'));
    dr.tufts(129, zb + 2, 154, zb + 2, 9, [...SPR.flowers, ...SPR.fern], 21, { scale: 0.8 });
    // roof garden: styrofoam boxes with greens, potted bamboo, a laundry line
    for (let i = 0; i < 6; i++) { const bxx = 124 + (i % 3) * 12, bz = 58 + Math.floor(i / 3) * 14; B(bxx, yr + 1, bz, bxx + 8, yr + 4, bz + 5, one(k, '#eeeee8')); B(bxx + 1, yr + 4, bz + 1, bxx + 7, yr + 4, bz + 4, one(k, '#4a3424')); }
    dr.tufts(125, 59, 155, 85, 26, [...SPR.fern, ...SPR.grass], 31, { scale: 0.9 });
    plant(158, yr + 1, 96, 'bamboo', '#3a6a8a', 4); plant(124, yr + 1, 98, 'bamboo', '#b85a3a', 5);
    B(122, yr + 1, 92, 122, yr + 14, 92, one(k, '#7a7a80')); B(161, yr + 1, 92, 161, yr + 14, 92, one(k, '#7a7a80'));
    dr.laundry([122, yr + 14, 92], [161, yr + 13, 92], { sag: 2, seed: 3, step: 6 });
    // B1's east wall shows above the bakery: a faded painted advertisement
    dE(60, fl(2) + 2, 104, roofY(3) - 4, x0 - 1, P.ghost(), { ppm: 32 });
  }

  // ---------------------------------------------------------------- B3: herbalist + jeweller (3 storeys, red brick, fire escape)
  {
    const x0 = 164, x1 = 219, wall = brick(['#9a4434', '#a64c3a', '#8e3e30', '#ae5642'], '#c8b49c');
    const yr = house({ x0, x1, n: 2, wall, trim: '#e8dcc4', cornice: 'corbel', par: 5, core: '#7a3a2e' });
    const sf = storefront({ x0, x1, pier: '#3a3230' });
    // herbalist: dark wood front, jars of herbs in the window
    const hw = shopWin(168, 184, { deep: 3, bulk: '#4a2e1e', frame: '#3a2416', mull: 8, back: one(k, night ? '#f0c070' : '#5a3a24', night ? GLOW : 0), lamp: false });
    dS(168, hw.y0, 184, hw.y1, ZF - 3, P.herbs(), { ppm: 48, glow: true, off: 0.01 });
    door(186, 191, { col: '#4a2e1e', glass: true, frame: '#3a2416' });
    signBox(167, sf.sy0, 191, sf.sy1, '#3a2416');
    dS(167, sf.sy0, 191, sf.sy1, ZF + 2, P.board({ cjk: '仁和堂', en: 'HERBS', bg: '#3a2416', bg2: '#4a2e1c', text: '#e8c060', frame: '#b08a40', small: true }), { ppm: 48 });
    // jeweller: red and gold, a bright window, a neon outline
    const jw = shopWin(194, 211, { deep: 2, bulk: '#7a1a1e', frame: '#c8962c', mull: 9, back: one(k, night ? '#fff0c0' : '#6a1a20', night ? GLOW : 0), pow: 14 });
    dS(194, jw.y0, 211, jw.y1, ZF - 2, P.jewels(), { ppm: 48, glow: true, off: 0.01 });
    door(212, 216, { col: '#7a1a1e', glass: true, frame: '#c8962c', deep: 3 });
    signBox(193, sf.sy0, 216, sf.sy1, '#7a1a1e');
    dS(193, sf.sy0, 216, sf.sy1, ZF + 2, P.board({ cjk: '玉蓮珠寶', en: 'JADE LOTUS', bg: '#7a1a1e', bg2: '#8a2026', text: '#f6d466', frame: '#e8c050', small: true }), { ppm: 48, glow: true });
    neonTube(192, sf.sy0 - 1, 217, sf.sy1 + 1, ZF + 3, '#ffd860', '#e8d8a0');
    // vertical signboard between the shops: 中藥
    B(176, fl(1) + 2, ZF + 1, 184, fl(2) + 14, ZF + 2, one(k, '#3a2416'));
    dS(176, fl(1) + 2, 184, fl(2) + 14, ZF + 2, P.vboard({ cjk: '仁和中藥', bg: '#f0e6d0', col: '#2a2420', frame: '#7a5a30' }), { ppm: 48 });
    for (let f = 1; f <= 2; f++) for (const x of [167, 186, 198, 209]) win(k, { x0: x, x1: x + 7, y0: fl(f) + 5, y1: fl(f) + 19, zf: ZF, night, head: 'arch', frame: '#e8dcc4', trim: '#e8dcc4', grid: [2, 2], ac: f === 1 && x === 209 ? 1 : 0 });
    fireEscape(k, { x0: 195, x1: 218, zf: ZF, levels: [fl(1) + 3, fl(2) + 3], D: 7, ladderX: 199, drop: fl(1) - 8 });
    dr.laundry([196, fl(2) + 13, ZF + 7], [217, fl(2) + 12, ZF + 7], { sag: 2, seed: 7, step: 5 });
    plant(201, fl(1) + 4, ZF + 4, 'fern', '#3a6a8a', 6); plant(213, fl(1) + 4, ZF + 4, 'bamboo', '#b85a3a', 7); plant(206, fl(2) + 4, ZF + 3, 'fern', '#c8a040', 8);
    condenser(k, 170, yr + 1, 64, { w: 8, d: 7 }); roofHut(k, 196, yr + 1, 56, 209, 66, wall);
  }

  // ---------------------------------------------------------------- B4: Silver Cloud teahouse with the temple balcony (4 storeys, ochre)
  {
    const x0 = 220, x1 = 283, wall = stucco(['#e6c47a', '#ddba70', '#ebcc88']);
    const yr = house({ x0, x1, n: 3, wall, trim: '#f2e6c8', cornice: 'none', par: 3, core: '#c8a868' });
    const sf = storefront({ x0, x1, pier: '#2a6a4c' });
    shopWin(224, 246, { mull: 6, bulk: '#2a6a4c', frame: '#1f3a2a', pow: 12 }); door(248, 255, { col: '#2a6a4c', glass: true, frame: '#1f3a2a' }); shopWin(257, 279, { mull: 6, bulk: '#2a6a4c', frame: '#1f3a2a', pow: 12, lamp: false });
    dS(225, Y0 + 6, 245, Y0 + 20, ZF - 2, P.dimsum(), { ppm: 48, glow: true, off: 0.01 });
    dS(258, Y0 + 6, 278, Y0 + 20, ZF - 2, P.teaWin(), { ppm: 48, glow: true, off: 0.01 });
    tileEave(k, { x0: x0, x1: x1, y: fl(1) - 3, zf: ZF, D: 7, rise: 4, lift: 4 });
    signBox(225, sf.sy0 - 1, 278, sf.sy1 - 3, '#2a1a12');
    dS(225, sf.sy0 - 1, 278, sf.sy1 - 3, ZF + 2, P.board({ cjk: '銀雲茶樓', en: 'SILVER CLOUD TEA HOUSE', bg: '#2a1a12', bg2: '#33221a', text: '#f0d070', frame: '#c8962c' }), { ppm: 48, glow: true });
    neonTube(224, sf.sy0 - 2, 279, sf.sy1 - 2, ZF + 3, '#4af0e0', '#a8d8d0');
    dS(249, Y0 + 14, 254, Y0 + 17, ZF - 4, P.openSign(), { ppm: 48, glow: true, off: 0.02 });
    plant(246, Y0, ZF + 3, 'fern', '#2a6a4c', 37); plant(257, Y0, ZF + 3, 'fern', '#2a6a4c', 38);
    // floors 1-2: paired windows on little balconies with red fret railings
    for (let f = 1; f <= 2; f++) {
      const y = fl(f);
      for (const x of [226, 262]) { win(k, { x0: x, x1: x + 13, y0: y + 4, y1: y + 19, zf: ZF, night, frame: '#2a6a4c', head: 'hood', trim: '#f2e6c8', grid: [3, 2] }); balcony(k, { x0: x - 2, x1: x + 15, y: y + 2, zf: ZF, D: 5, style: 'fret', col: '#b02428', col2: '#8a1c20', slab: '#f2e6c8' }); }
      win(k, { x0: 247, x1: 255, y0: y + 5, y1: y + 19, zf: ZF, night, frame: '#2a6a4c', head: 'hood', trim: '#f2e6c8' });
    }
    // vertical sign 點心 between the balconies
    B(244, fl(1) + 4, ZF + 1, 245, fl(2) + 8, ZF + 11, one(k, '#b02428'));
    for (const yy of [fl(1) + 7, fl(2) + 4]) B(244, yy, ZF + 1, 245, yy, ZF + 1, one(k, '#2a2a2e'));
    dE(ZF + 2, fl(1) + 5, ZF + 11, fl(2) + 7, 245, P.vboard({ cjk: '點心', bg: '#b02428', col: '#ffe080', frame: '#e8b83a' }), { ppm: 40, glow: true, off: 0.02 });
    dW(ZF + 2, fl(1) + 5, ZF + 11, fl(2) + 7, 244, P.vboard({ cjk: '茶樓', bg: '#b02428', col: '#ffe080', frame: '#e8b83a' }), { ppm: 40, glow: true, off: 0.02 });
    // top floor: the temple balcony — a deep loggia with red columns, a gold-and-green railing,
    // lanterns, a plaque, under a green tile roof with upturned ends
    const y3 = fl(3);
    loggia(k, { x0: 225, x1: 278, y0: y3 + 1, y1: y3 + 22, zf: ZF + 0, R: 7, style: 'fret', col: '#d8a830', col2: '#2a7a52', wall: one(k, '#a82428'), floor: '#8a2a22', floor2: '#7a2420' });
    for (const x of [225, 238, 251, 264, 277]) B(x, y3 + 1, ZF - 1, x + 1, y3 + 22, ZF, one(k, '#b02428'));
    for (let x = 226; x <= 277; x++) { v.set(x, y3 + 21, ZF, one(k, C.gold[0])); if (x % 3 === 0) v.set(x, y3 + 20, ZF, one(k, C.jade)); }
    // temple doors and a plaque on the loggia's back wall
    for (const x of [232, 257]) B(x, y3 + 1, ZF - 7, x + 14, y3 + 15, ZF - 7, (xx, yy) => ((xx - x) % 5 === 0 || yy === y3 + 15 ? one(k, C.gold[2]) : (xx + yy) % 2 ? one(k, '#5a1a18') : one(k, '#6a2420')));
    B(244, y3 + 15, ZF - 6, 255, y3 + 19, ZF - 6, one(k, '#1f3f66'));
    dS(244, y3 + 15, 255, y3 + 19, ZF - 6, P.plaque({ cjk: '福德廟', bg: '#1f3f66' }), { ppm: 48 });
    if (night) light(251, y3 + 12, ZF - 2, 0xff6040, 10, 8);
    for (const [i, x] of [231.5, 244.5, 257.5, 270.5].entries()) dr.card(LAN.big[i % 2], x, y3 + 22, ZF - 2, { hang: true, glow: true, sway: 0.4 });
    plant(228, y3 + 1, ZF - 4, 'bamboo', '#c89a3a', 35); plant(275, y3 + 1, ZF - 4, 'bamboo', '#c89a3a', 36);
    tileEave(k, { x0: x0 - 2, x1: x1 + 2, y: y3 + 23, zf: ZF - 1, D: 9, rise: 6, lift: 5 });
    brackets(k, x0, y3 + 22, ZF + 1, x1, y3 + 23, ZF + 2, 'x');
    // the parapet crest: a ridge with gold ornaments
    B(x0 + 4, yr + 1, ZF - 4, x1 - 4, yr + 4, ZF - 2, one(k, C.ridge));
    for (const x of [x0 + 4, x1 - 5]) { B(x, yr + 5, ZF - 4, x + 1, yr + 9, ZF - 3, one(k, C.ridge)); v.set(x + (x < 250 ? 2 : -1), yr + 9, ZF - 3, one(k, C.gold[1])); }
    ell(v, 251.5, yr + 6.5, ZF - 3.5, 1.6, 1.6, 1.6, one(k, C.gold[1]));
    waterTank(k, 236, yr + 1, 64, { r: 7, h: 13, leg: 7 }); condenser(k, 262, yr + 1, 58); condenser(k, 270, yr + 1, 70, { w: 6, d: 6 });
  }

  // ---------------------------------------------------------------- the alley (Fortune Cookie alley) between B4 and B5
  {
    const ax0 = 284, ax1 = 299;
    B(ax0, 6, ZB, ax1, WY - 1, ZF, one(k, '#4a4846'));
    for (let x = ax0; x <= ax1; x++) for (let z = ZB; z <= ZF; z++) v.set(x, WY, z, (x + (z >> 1)) % 4 === 0 ? one(k, '#6a5a50') : h3(x, z, 3) < 0.5 ? one(k, '#7a6a5e') : one(k, '#86766a'));
    // laundry and lanterns strung between the walls
    for (const [y, z, s] of [[fl(1) + 10, 96, 1], [fl(2) + 6, 84, 2], [fl(2) + 14, 100, 3], [fl(1) + 18, 72, 4]]) dr.laundry([ax0, y, z], [ax1, y - 1, z], { sag: 2, seed: s, step: 4 });
    lanterns([ax0, fl(1) + 4, 106], [ax1, fl(1) + 4, 106], { sag: 2, step: 4 });
    lanterns([ax0, fl(1) + 2, 90], [ax1, fl(1) + 2, 90], { sag: 2, step: 4, alt: 1 });
    // crates and a bucket by a side door
    for (const [cx, cz, h] of [[287, 98, 4], [287, 92, 8], [293, 76, 4]]) B(cx, WY + 1, cz, cx + 4, WY + h, cz + 4, (x, y) => ((y - WY) % 4 === 0 ? one(k, '#6a4a2e') : one(k, '#9a7448')));
    cylY(v, 295, 104, 1.5, WY + 1, WY + 3, one(k, '#3a6a9a'));
  }

  // ---------------------------------------------------------------- B5: Sunrise produce (3 storeys, blue-grey, open front with fruit stands)
  {
    const x0 = 300, x1 = 347, wall = stucco(['#b8c4c8', '#b0bcc2', '#c2ccd0']);
    const yr = house({ x0, x1, n: 2, wall, trim: '#f2f0ea', cornice: 'bracket', par: 6, core: '#9aa6aa' });
    const sf = storefront({ x0, x1, pier: '#5a6a6e' });
    // open shopfront: shutter rolled up, a lit interior with shelves of goods
    B(303, Y0, ZF - 13, 344, Y0 + 24, ZF, 0);
    B(303, Y0 - 1, ZF - 13, 344, Y0 - 1, ZF, (x, y, z) => ((x + z) % 2 ? one(k, '#c8c0b0') : one(k, '#b8b0a0')));
    B(303, Y0, ZF - 14, 344, Y0 + 24, ZF - 14, (x, y) => ((y - Y0) % 6 === 5 ? one(k, '#8a6a48') : one(k, '#e6e0d2')));
    for (let s = 0; s < 4; s++) { const yy = Y0 + 5 + s * 6; for (let x = 304; x <= 343; x++) { const r = h3(x >> 1, yy, 5); v.set(x, yy - 4, ZF - 13, one(k, ['#d84a3a', '#e8a838', '#f0d860', '#5a9a4a', '#e8e0d0', '#c8507a', '#4a7ab0'][Math.floor(r * 7)])); if (r < 0.6) v.set(x, yy - 3, ZF - 13, one(k, ['#d84a3a', '#e8a838', '#f0d860', '#5a9a4a', '#e8e0d0'][Math.floor(r * 8.3) % 5])); } }
    B(303, Y0 + 24, ZF - 13, 344, Y0 + 24, ZF, one(k, '#8a8478'));
    if (night) for (const x of [312, 334]) { B(x, Y0 + 23, ZF - 8, x + 4, Y0 + 23, ZF - 7, one(k, '#fff4d0', GLOW)); light(x + 2, Y0 + 18, ZF - 2, 0xfff0d0, 12, 8); }
    shutter(k, { x0: 303, x1: 344, y0: Y0, y1: Y0 + 24, zf: ZF, open: 0.92 });
    // fruit stands: stepped crates spilling onto the sidewalk
    const FRUIT = { orange: ['#f08a1e', '#e87a18', '#f8a030'], apple: ['#c8262a', '#d83a2e', '#b01e24'], pomelo: ['#d8e070', '#c8d460', '#e8e888'], dragon: ['#e0307a', '#c82868', '#f04a8a'], bokchoy: ['#e8f0d0', '#6aa040', '#4a8a30'], lime: ['#6ab030', '#5aa028', '#7ac040'], persimmon: ['#f06a1a', '#e85a14', '#ff8a2a'] };
    const stand = (sx, sz, kinds) => kinds.forEach((kind, i) => {
      const yy = WY + 1 + i * 3, zz = sz - i * 5, F = many(k, FRUIT[kind]);
      B(sx, WY + 1, zz, sx + 10, yy + 1, zz + 4, (x, y, z) => (y === yy + 1 && x > sx && x < sx + 10 && z > zz && z < zz + 4 ? undefined : (x === sx || x === sx + 10 || z === zz || z === zz + 4) ? one(k, '#9a7448') : one(k, '#6a4a2e')));
      for (let x = sx + 1; x < sx + 10; x++) for (let z = zz + 1; z < zz + 4; z++) { v.set(x, yy + 1, z, F[Math.floor(h3(x, z, i) * 3)]); if ((x + z) % 2) v.set(x, yy + 2, z, F[Math.floor(h3(x, z, i + 7) * 3)]); }
    });
    stand(304, ZF + 14, ['orange', 'apple', 'pomelo']); stand(316, ZF + 14, ['persimmon', 'dragon', 'lime']); stand(328, ZF + 14, ['bokchoy', 'orange', 'apple']);
    for (const [sx, t] of [[304, '$1.29'], [316, '3/$5'], [328, '99C']]) dS(sx + 2, WY + 1, sx + 8, WY + 3, ZF + 18, P.tag(t), { ppm: 40 });
    B(340, WY + 1, ZF + 4, 345, WY + 6, ZF + 9, one(k, '#9a7448')); B(340, WY + 7, ZF + 4, 345, WY + 11, ZF + 9, one(k, '#8a6a42'));
    // flat canopy with the sign on its face
    B(301, sf.sy0 - 1, ZF + 1, 346, sf.sy0 + 1, ZF + 16, (x, y, z) => (y === sf.sy0 - 1 ? one(k, '#e0dcd2') : one(k, '#2e7a4a')));
    B(301, sf.sy0 - 1, ZF + 16, 346, sf.sy1 - 1, ZF + 16, one(k, '#2e7a4a'));
    for (const x of [301, 346]) B(x, WY + 1, ZF + 15, x, sf.sy0 - 2, ZF + 15, one(k, '#2a2a2e'));
    dS(302, sf.sy0 - 1, 345, sf.sy1 - 1, ZF + 16, P.board({ cjk: '旭日生果', en: 'SUNRISE PRODUCE', bg: '#2e7a4a', bg2: '#348452', text: '#fff2c0', frame: '#f0d070' }), { ppm: 48 });
    for (let f = 1; f <= 2; f++) for (const x of [304, 317, 330]) win(k, { x0: x, x1: x + 9, y0: fl(f) + 5, y1: fl(f) + 19, zf: ZF, night, frame: '#2e7a4a', trim: '#f2f0ea', head: 'hood', ac: (f + x) % 3 === 0 ? (x === 330 ? -1 : 1) : 0 });
    for (const x of [304, 330]) { B(x, fl(1) + 1, ZF + 1, x + 9, fl(1) + 3, ZF + 2, one(k, '#2e7a4a')); dr.tufts(x + 1, ZF + 1, x + 8, ZF + 2, 4, [...SPR.flowers, ...SPR.fern], x, { scale: 0.75 }); }
    B(340, fl(1) + 3, ZF + 1, 346, fl(2) + 12, ZF + 2, one(k, '#c8302c'));
    dS(340, fl(1) + 3, 346, fl(2) + 12, ZF + 2, P.vboard({ cjk: '新鮮生果', bg: '#c8302c', col: '#fff0c0', frame: '#f0d070' }), { ppm: 48 });
    waterTank(k, 316, yr + 1, 72, { r: 6, h: 11, leg: 6 }); condenser(k, 334, yr + 1, 62);
    // the alley wall of B5: fortune cookie factory sign and a dragon mural
    dW(80, Y0 + 2, 108, Y0 + 30, x0, P.mural(), { ppm: 32 });
    B(x0 - 1, Y0 + 32, 98, x0 - 1, Y0 + 39, 109, one(k, '#c8302c'));
    dW(98, Y0 + 32, 109, Y0 + 39, x0 - 1, P.board({ cjk: '幸運餅', en: 'FORTUNE COOKIES', bg: '#c8302c', bg2: '#d03a30', text: '#fff0b0', frame: '#f0c040', small: true }), { ppm: 48, glow: true });
  }

  // ---------------------------------------------------------------- B6: Jade Gate gifts (3 storeys, brown brick, fire escape, AC units)
  {
    const x0 = 348, x1 = 391, wall = brick(['#8a6a50', '#94735a', '#7e6048', '#9c7c60'], '#b8a48c');
    const yr = house({ x0, x1, n: 2, wall, trim: '#e4d8c0', cornice: 'corbel', par: 5, core: '#6a5040' });
    const sf = storefront({ x0, x1, pier: '#c8302c' });
    const gw = shopWin(352, 375, { mull: 8, bulk: '#c8302c', frame: '#f0c040', deep: 3, back: one(k, night ? '#ffe0a0' : '#7a2a24', night ? GLOW : 0), pow: 12 });
    dS(352, gw.y0, 375, gw.y1, ZF - 3, P.gifts(), { ppm: 48, glow: true, off: 0.01 });
    door(377, 387, { col: '#c8302c', glass: true, frame: '#f0c040' });
    awning(k, { x0: 350, x1: 389, y: sf.sy0 - 2, zf: ZF, D: 9, drop: 4, cols: ['#e8b830', '#c8302c'], sw: 4 });
    signBox(351, sf.sy0, 388, sf.sy1, '#c8302c');
    dS(351, sf.sy0, 388, sf.sy1, ZF + 2, P.board({ cjk: '玉門禮品', en: 'JADE GATE GIFTS', bg: '#c8302c', bg2: '#d23a32', text: '#fff0b0', frame: '#f0c040' }), { ppm: 48 });
    dS(379, Y0 + 9, 385, Y0 + 16, ZF - 4, P.fu({}), { ppm: 48, off: 0.02 });
    for (let f = 1; f <= 2; f++) for (const x of [352, 366, 380]) win(k, { x0: x, x1: x + 7, y0: fl(f) + 5, y1: fl(f) + 19, zf: ZF, night, head: 'brick', brickHead: '#5a4030', frame: '#e4d8c0', trim: '#e4d8c0', ac: x === 380 ? -1 : (f === 2 && x === 352 ? 1 : 0) });
    fireEscape(k, { x0: 350, x1: 375, zf: ZF, levels: [fl(1) + 3, fl(2) + 3], D: 7, ladderX: 369, drop: fl(1) - 7 });
    plant(353, fl(1) + 4, ZF + 4, 'bamboo', '#3a6a8a', 11); plant(372, fl(2) + 4, ZF + 4, 'fern', '#b85a3a', 12);
    dr.laundry([351, fl(1) + 13, ZF + 7], [374, fl(1) + 13, ZF + 7], { sag: 2, seed: 9, step: 5 });
    // a projecting sign box: 福
    blade(388, fl(1) + 3, fl(2) + 12, 9, '#c8302c', P.vboard({ cjk: '福', bg: '#c8302c', col: '#ffe070', frame: '#f0c040' }), { glow: true, tube: '#ffd040', tubeDay: '#e8d090', lightCol: 0xffb040 });
    condenser(k, 356, yr + 1, 66); condenser(k, 366, yr + 1, 66); waterTank(k, 380, yr + 1, 62, { r: 5, h: 10, leg: 5 });
  }

  // ---------------------------------------------------------------- B7: the pagoda corner (4 storeys + a three-tier tower)
  {
    const x0 = 392, x1 = 447, wall = stucco(['#efe6d4', '#e8dfcc', '#f4ecdc']), RED = one(k, '#b02428');
    const yr = house({ x0, x1, n: 3, wall, trim: '#f6f0e2', cornice: 'none', par: 3, core: '#cfc4ae' });
    const sf = storefront({ x0, x1, pier: '#b02428' });
    shopWin(396, 420, { mull: 6, bulk: '#1f5a3a', frame: '#c8962c', pow: 12 }); door(422, 430, { col: '#b02428', glass: true, frame: '#c8962c' }); shopWin(432, 443, { mull: 6, bulk: '#1f5a3a', frame: '#c8962c', lamp: false });
    dS(397, Y0 + 6, 419, Y0 + 20, ZF - 2, P.bazaar(), { ppm: 48, glow: true, off: 0.01 });
    signBox(395, sf.sy0, 444, sf.sy1, '#1f5a3a');
    dS(395, sf.sy0, 444, sf.sy1, ZF + 2, P.board({ cjk: '中華百貨', en: 'CATHAY BAZAAR', bg: '#1f5a3a', bg2: '#246642', text: '#f6d466', frame: '#e8b83a' }), { ppm: 48, glow: true });
    neonTube(394, sf.sy0 - 1, 445, sf.sy1 + 1, ZF + 3, '#ff5a3a', '#e8b0a0');
    plant(421, Y0, ZF + 3, 'bamboo', '#b02428', 39); plant(431, Y0, ZF + 3, 'bamboo', '#b02428', 40);
    // floors: red-railed balconies under green tile eaves at every floor
    for (let f = 1; f <= 3; f++) {
      const y = fl(f);
      for (const x of [396, 412, 430]) win(k, { x0: x, x1: x + 10, y0: y + 4, y1: y + 18, zf: ZF, night, frame: '#b02428', trim: '#f6f0e2', head: 'none', grid: [2, 3] });
      balcony(k, { x0: 394, x1: 445, y: y + 2, zf: ZF, D: 4, style: f === 3 ? 'fret' : 'cross', col: '#b02428', col2: '#8a1c20', slab: '#f6f0e2' });
      tileEave(k, { x0: x0 - 1, x1: x1 + 1, y: y + 21, zf: ZF, D: 6, rise: 3, lift: 3 });
    }
    // the east face along California Street
    for (let f = 0; f <= 3; f++) for (const z of [62, 80, 98]) {
      const y = f === 0 ? Y0 + 6 : fl(f) + 5;
      for (let zz = z; zz <= z + 8; zz++) for (let yy = y; yy <= y + 14; yy++) { v.set(x1, yy, zz, (zz === z || zz === z + 8 || yy === y || yy === y + 14 || zz === z + 4) ? RED : glass(h3(zz, yy >> 3, f) < 0.5)(zz, yy)); v.set(x1 - 1, yy, zz, 0); }
      for (let zz = z - 1; zz <= z + 9; zz++) v.set(x1 + 1, y - 1, zz, one(k, '#f6f0e2'));
    }
    // the tower: three shrinking storeys of red columns and lattice under flared green roofs
    const tx = 432, tz = 96;
    const tierBody = (r, y0, y1) => B(tx - r, y0, tz - r, tx + r - 1, y1, tz + r - 1, (x, y, z) => {
      const ex = x === tx - r || x === tx + r - 1, ez = z === tz - r || z === tz + r - 1;
      if ((ex && ez) || (ex && (z - tz) % 6 === 0) || (ez && (x - tx) % 6 === 0)) return RED;
      if (y === y0 || y === y1) return one(k, C.gold[2]);
      const u = ex ? z : x; return (u % 3 === 0 || (y - y0) % 3 === 0) ? one(k, '#c8962c') : one(k, night ? '#ffcf7a' : '#3a2a24', night ? GLOW : 0);
    });
    tierBody(13, yr + 1, yr + 16);
    brackets(k, tx - 14, yr + 17, tz - 14, tx + 13, yr + 18, tz + 13, 'x');
    pagodaRoof(k, { x0: tx - 21, x1: tx + 20, z0: tz - 21, z1: tz + 20, y: yr + 19, rise: 9, lift: 5, liftR: 10, th: 2, flare: 1.5 });
    tierBody(9, yr + 26, yr + 37);
    pagodaRoof(k, { x0: tx - 15, x1: tx + 14, z0: tz - 15, z1: tz + 14, y: yr + 38, rise: 8, lift: 4, liftR: 8, th: 2, flare: 1.5 });
    tierBody(5, yr + 44, yr + 51);
    pagodaRoof(k, { x0: tx - 10, x1: tx + 9, z0: tz - 10, z1: tz + 9, y: yr + 52, rise: 13, lift: 3, liftR: 6, th: 2, finial: 9 });
    if (night) { light(tx, yr + 8, tz + 14, 0xffa050, 14, 10); light(tx, yr + 30, tz + 10, 0xffa050, 8, 8); }
    // parapet crest over the rest of the roof
    tileEave(k, { x0: x0 - 1, x1: tx - 22, y: yr + 1, zf: ZF - 2, D: 5, rise: 3, lift: 3 });
    condenser(k, 398, yr + 1, 60); roofHut(k, 400, yr + 1, 70, 410, 80, wall);
  }

  // ---------------------------------------------------------------- the block behind (Stockton side): taller, quieter, detailed only where it shows
  {
    const backs = [
      { a: 0, b: 75, n: 4, wall: stucco(['#9aae94', '#92a68c', '#a2b69c']), trim: '#eef0e4', frame: '#f4f2ea', step: 12, w: 7, balc: '#b02428' },
      { a: 76, b: 147, n: 5, wall: brick(['#b08a68', '#a8825f', '#b89270'], '#d4c4a8'), trim: '#e8dcc4', frame: '#2e4a3c', step: 11, w: 6, fe: [80, 104], sign: ['酒店', 'HOTEL'] },
      { a: 148, b: 227, n: 4, wall: stucco(['#d8a8a0', '#d0a098', '#e0b0a8']), trim: '#f4ece2', frame: '#f4ece2', step: 13, w: 8 },
      { a: 228, b: 299, n: 5, wall: stucco(['#9aa8b4', '#92a0ac', '#a2b0bc']), trim: '#eef0f2', frame: '#b02428', step: 12, w: 7, balc: '#b02428', crown: true },
      { a: 300, b: 375, n: 4, wall: brick(['#d8cbb0', '#d0c3a8', '#ccbfa2'], '#ece2cc'), trim: '#f2ead8', frame: '#3a3a40', step: 12, w: 7, fe: [330, 356] },
      { a: 376, b: 447, n: 5, wall: brick(['#8a5e48', '#94664e', '#80563f'], '#b8a088'), trim: '#e4d6be', frame: '#e4d6be', step: 11, w: 6, ac: true },
    ];
    const zf = ZB - 1;
    for (const q of backs) {
      const top = roofY(q.n), T = one(k, q.trim);
      B(q.a, Y0, 0, q.b, top, zf, q.wall);
      B(q.a + 3, fl(3) - 12, zf - 20, q.b - 3, top - 2, zf - 4, one(k, '#8a8070')); B(q.a + 4, fl(3) - 11, zf - 19, q.b - 4, top - 3, zf - 5, 0);
      B(q.a + 1, top, 1, q.b - 1, top, zf - 2, (x, y, z) => (h3(x, z, 4) < 0.08 ? GRAV : ROOF[Math.floor(noise2(x, z, 5) * 3.99)]));
      B(q.a, top + 1, zf - 1, q.b, top + 4, zf, q.wall); B(q.a, top + 5, zf - 2, q.b, top + 5, zf + 1, T);
      B(q.a, top + 1, 0, q.a, top + 2, zf, q.wall); B(q.b, top + 1, 0, q.b, top + 2, zf, q.wall);
      B(q.a, top - 2, zf + 1, q.b, top - 1, zf + 2, T);
      for (let f = 2; f <= q.n; f++) {
        const y = fl(f); B(q.a, y - 1, zf + 1, q.b, y - 1, zf + 1, T);
        for (let x = q.a + 5; x + q.w <= q.b - 4; x += q.step) win(k, { x0: x, x1: x + q.w, y0: y + 5, y1: y + 19, zf, night, frame: q.frame, trim: q.trim, head: f % 2 ? 'hood' : 'flat', ac: q.ac && (x + f) % 3 === 0 ? 1 : 0 });
        if (q.balc && f === q.n - 1) balcony(k, { x0: q.a + 3, x1: q.b - 3, y: y + 2, zf, D: 5, style: 'fret', col: q.balc, col2: shade(q.balc, -0.3), slab: q.trim });
      }
      if (q.fe) fireEscape(k, { x0: q.fe[0], x1: q.fe[1], zf, levels: [fl(2) + 3, fl(3) + 3, fl(4) + 3].filter((y) => y < top - 10), D: 7, ladder: false });
      if (q.crown) { tileEave(k, { x0: q.a - 1, x1: q.b + 1, y: top + 2, zf: zf - 1, D: 7, rise: 4, lift: 4 }); dr.pennants([q.a + 4, top + 12, zf - 6], [q.b - 4, top + 12, zf - 6], { sag: 3 }); B(q.a + 4, top + 1, zf - 6, q.a + 4, top + 13, zf - 6, one(k, '#5a5a60')); B(q.b - 4, top + 1, zf - 6, q.b - 4, top + 13, zf - 6, one(k, '#5a5a60')); }
      if (q.sign) {
        const sx = q.b - 10; B(sx, fl(3), zf + 1, sx + 6, fl(5) - 4, zf + 2, one(k, '#1c1a20'));
        neonTube(sx - 1, fl(3) - 1, sx + 7, fl(5) - 3, zf + 3, '#ff4a8a', '#e8a8c0');
        dS(sx, fl(3), sx + 6, fl(5) - 4, zf + 2, P.vneon({ cjk: q.sign[0], col: '#ff5a9a', edge: '#ff7ab0' }), { ppm: 40, glow: true });
        if (night) light(sx + 3, fl(4), zf + 6, 0xff5a9a, 8, 8);
      }
      waterTank(k, q.a + 14 + ((q.a * 7) % 30), top + 1, 16, { r: 6, h: 11, leg: 6 });
      if ((q.a / 76 | 0) % 2) condenser(k, q.b - 16, top + 1, 26); else roofHut(k, q.b - 18, top + 1, 20, q.b - 8, 30, q.wall);
    }
  }

  // ---------------------------------------------------------------- Portsmouth Square (raised plaza)
  const GRAN = many(k, C.granite), PAV = many(k, ['#c6c0b4', '#bdb7ab', '#ccc7bc', '#b8b2a6']), SEAM = one(k, '#a49e92'), BRK = many(k, ['#a65a46', '#9a503e', '#b0634e', '#8e4a3a']);
  const PCX = 236, PCZ = 304;
  B(0, 6, PZ, XC - 1, PY, 383, (x, y, z) => {
    if (y < PY) return GRAN[Math.floor(h3(x, y, z) * 4)];
    const r = Math.hypot(x - PCX + 0.5, z - PCZ + 0.5);
    if (r <= 46) {
      if (r > 43) return BRK[(Math.floor(Math.atan2(z - PCZ, x - PCX) * 14) + (x & 1)) & 3];
      if (r > 41.5) return GRAN[3];
      const ring = Math.floor(r / 5), seg = Math.floor(((Math.atan2(z - PCZ, x - PCX) + Math.PI) / (Math.PI * 2)) * (8 + ring * 6));
      return (r % 5 < 0.9) ? SEAM : PAV[(seg + ring) % 2 ? 0 : 2];
    }
    if (x >= 222 && x <= 250 && z < 262) { const bxx = x >> 1, bz = z >> 2; return ((bxx + bz) & 1) ? ((z & 3) === 0 ? BRK[3] : BRK[(bxx + z) % 2]) : ((x & 1) === 0 ? BRK[3] : BRK[(bz + x) % 3]); }
    const row = (z - PZ) >> 2, off = (row & 1) * 3;
    if ((z - PZ) % 4 === 0 || (x + off) % 6 === 0) return SEAM;
    return PAV[Math.floor(h3((x + off) / 6 | 0, row, 7) * 4)];
  });
  // retaining wall with a red balustrade; stairs up from the sidewalk
  B(0, WY + 1, PZ, XC - 1, PY, PZ + 1, (x, y, z) => (y === PY ? GRAN[3] : (y - WY) % 3 === 0 ? GRAN[2] : GRAN[(x >> 2) % 2]));
  const stairs = [[92, 123], [212, 259], [372, 395]];
  for (const [a, b] of stairs) for (let s = 0; s < 8; s++) B(a, 6, PZ + s * 2, b, WY + 1 + s, PZ + s * 2 + 1, (x, y, z) => (y === WY + 1 + s ? (z === PZ + s * 2 ? GRAN[3] : PAV[0]) : GRAN[1]));
  for (const [a, b] of [[0, 91], [124, 211], [260, 371], [396, XC - 1]]) {
    railing(k, { a, b, y: PY + 1, h: 6, at: PZ + 1, axis: 'x', style: 'fret', col: '#b02428', col2: '#8a1c20' });
    for (let x = a; x <= b; x += 16) B(x, PY + 1, PZ, x + 1, PY + 8, PZ + 2, GRAN[3]);
  }
  for (const [a, b] of stairs) for (const x of [a - 1, b + 1]) for (let s = 0; s < 8; s++) B(x, WY + 1 + s, PZ + s * 2, x, WY + 5 + s, PZ + s * 2 + 1, GRAN[2]);
  B(XC - 2, PY + 1, PZ, XC - 1, PY + 4, 383, GRAN[3]);
  // lawns with granite curbs and clipped hedges
  const lawn = (x0, z0, x1, z1, seed) => {
    k.lawn(x0, z0, x1, z1, PY, { flowers: 0.006, tufts: 0.04 });
    for (let x = x0 - 1; x <= x1 + 1; x++) for (const z of [z0 - 1, z1 + 1]) v.set(x, PY + 1, z, GRAN[3]);
    for (let z = z0 - 1; z <= z1 + 1; z++) for (const x of [x0 - 1, x1 + 1]) v.set(x, PY + 1, z, GRAN[3]);
    dr.tufts(x0 + 2, z0 + 2, x1 - 2, z1 - 2, Math.round((x1 - x0) * (z1 - z0) / 70), [...SPR.grass, ...SPR.flowers, ...SPR.grass], seed, { scale: 0.9 });
  };
  lawn(12, 300, 120, 372, 41); lawn(300, 344, 436, 380, 42);
  k.hedgeRow(14, 118, PY + 1, 298, 300, 4); k.hedgeRow(302, 434, PY + 1, 342, 344, 4);
  // the pavilion
  const pav = pavilion(k, { cx: PCX, cz: PCZ, y: PY + 1, night });
  if (night) light(PCX, PY + 24, PCZ, 0xffb060, 16, 12);
  for (const e of pav.eaves) dr.card(LAN.big[0], e[0] / 1, e[1] - 1, e[2], { hang: true, glow: true, scale: 1, sway: 0.5 });
  // planters with ginkgo trees, more trees in the lawns, chess tables, benches
  const planter = (x0, z0, x1, z1) => { B(x0, PY + 1, z0, x1, PY + 4, z1, (x, y, z) => (y === PY + 4 ? GRAN[3] : GRAN[(x + z) % 4])); B(x0 + 1, PY + 4, z0 + 1, x1 - 1, PY + 4, z1 - 1, 'dirt'); dr.tufts(x0 + 2, z0 + 2, x1 - 2, z1 - 2, Math.round((x1 - x0) * (z1 - z0) / 30), [...SPR.fern, ...SPR.grass, ...SPR.flowers], x0 + z0, { scale: 0.9 }); };
  for (const [x, z, s] of [[40, 252, 1], [150, 250, 2], [322, 250, 3], [420, 262, 4]]) { planter(x - 10, z - 8, x + 10, z + 8); dr.tree(x, PY + 5, z, 'ginkgo', s, { h: 30, r: 18 }); }
  for (const [x, z, kind, s] of [[40, 330, 'leaf', 11], [96, 352, 'ginkgo', 12], [340, 366, 'leaf', 13], [396, 368, 'ginkgo', 14]]) dr.tree(x, PY + 1, z, kind, s, kind === 'leaf' ? { h: 34, r: 22 } : { h: 30, r: 18 });
  for (const [x, z] of [[334, 288], [366, 294], [346, 318], [378, 322]]) { chessTable(k, x, PY + 1, z); dU(x - 3, z - 3, x + 3, z + 3, PY + 6, P.xiangqi(), { ppm: 48 }); }
  for (const [x, z, len] of [[178, 272, 18], [276, 272, 18], [150, 310, 16], [306, 312, 16], [196, 346, 18], [258, 346, 18]]) bench(k, x, PY + 1, z, len);
  for (const [x, z] of [[132, 280], [300, 262], [414, 300]]) trashCan(k, x, PY + 1, z);
  // an egg-waffle cart under a striped umbrella; a bench and a bin on California Street
  const ct = cart(k, 110, PY + 1, 262, {});
  dS(ct.sign[0], ct.sign[1], ct.sign[2], ct.sign[3], ct.sign[4], P.cartSign(), { ppm: 48 });
  bench(k, 452, Y0, 300, 16, {}); trashCan(k, 458, Y0, 320);
  // notice board on the square, facing the camera
  B(150, PY + 1, 236, 151, PY + 22, 237, one(k, '#3a2a22')); B(186, PY + 1, 236, 187, PY + 22, 237, one(k, '#3a2a22'));
  B(150, PY + 8, 236, 187, PY + 22, 236, one(k, '#6a4a32'));
  tileEave(k, { x0: 148, x1: 189, y: PY + 23, zf: 233, D: 6, rise: 2, lift: 2, brackets: false });
  dS(152, PY + 9, 185, PY + 21, 236, P.notice(), { ppm: 48 });
  // lamps in the square, lanterns strung from the pavilion
  for (const [x, z] of [[96, 284], [380, 274], [176, 330], [300, 330]]) lamps.push(ctLamp(k, x, PY + 1, z, { night }));
  for (const [x, z] of [[96, 284], [380, 274], [176, 330], [300, 330]]) lanterns([x + 1, PY + 45, z + 1], [PCX + (x < PCX ? -24 : 24), PY + 40, PCZ + (z < PCZ ? -24 : 24)], { sag: 6, step: 7, mixed: true });

  // ---------------------------------------------------------------- California Street: cable car tracks and a car climbing past the square
  for (const [r0, r1, slot] of [[474, 483, 478], [494, 503, 498]]) for (let z = 0; z < 384; z++) { v.set(r0, SY, z, one(k, '#9a9ea4')); v.set(r1, SY, z, one(k, '#9a9ea4')); v.set(slot, SY, z, one(k, '#1c1c20')); if (z % 6 === 0) for (let x = r0 + 1; x < r1; x++) if (x !== slot) v.set(x, SY, z, one(k, '#55565a')); }
  const car = cableCar(k, 469, SY + 1, 244, { night });
  for (const [x, y, z0, z1, face] of car.sign) (face === 'e' ? dE : dW)(z0, y, z1, y + 2, face === 'e' ? x : x, P.carBand(), { ppm: 40 });
  for (const e of car.ends) dS(e[0], e[1], e[0] + 7, e[1] + 3, e[2], P.carDest(), { ppm: 40, glow: true });
  if (night) light(479, SY + 16, 276, 0xffd890, 10, 8);
  B(452, Y0, 226, 452, Y0 + 30, 226, one(k, '#5a5a60')); B(452, Y0 + 26, 226, 452, Y0 + 30, 232, one(k, '#f0ece0'));
  dE(226, Y0 + 26, 232, Y0 + 30, 452, P.tag('CABLE CAR', '#f4f0e4', '#7a1a20'), { ppm: 40 });

  // ---------------------------------------------------------------- the Dragon Gate
  const gate = paifang(k, { x: GX, y: Y0, pz: [113, 131, 197, 215] });
  lion(k, GX - 19, Y0, 121, {}); lion(k, GX - 19, Y0, 202, { female: true });
  const pq = gate.plaque;
  for (const [face, xl] of [['e', pq.x1], ['w', pq.x0]]) (face === 'e' ? dE : dW)(pq.z0, pq.y0, pq.z1, pq.y1, xl, P.plaque({ cjk: '天下為公', bg: '#1f3f66' }), { ppm: 48, glow: true });
  for (const c of gate.couplets) for (const [face, xl] of [['e', GX + 1], ['w', GX - 2]]) {
    B(face === 'e' ? GX + 2 : GX - 3, c.y, c.z - 1, face === 'e' ? GX + 2 : GX - 3, c.y + 26, c.z + 1, one(k, '#7a1418'));
    (face === 'e' ? dE : dW)(c.z - 1, c.y, c.z + 1, c.y + 26, face === 'e' ? GX + 2 : GX - 3, P.couplet({ cjk: c.side < 0 ? (face === 'e' ? '萬事如意' : '四季平安') : (face === 'e' ? '福星高照' : '花開富貴') }), { ppm: 48, glow: true });
  }
  for (const l of gate.lanterns) dr.card(LAN.big[0], l[0] + 0.5, l[1] - 1, l[2], { hang: true, glow: true, scale: 1.3, sway: 0.4 });
  if (night) { light(GX - 16, Y0 + 54, 166, 0xffb070, 18, 13); light(GX + 16, Y0 + 54, 166, 0xffb070, 18, 13); light(GX - 30, Y0 + 22, 125, 0xffa060, 8, 6); light(GX - 30, Y0 + 22, 206, 0xffa060, 8, 6); }

  // ---------------------------------------------------------------- street furniture
  for (const x of [80, 160, 240, 320, 400]) lamps.push(ctLamp(k, x, Y0, 200, { night }));
  for (const x of [120, 220, 300, 392]) lamps.push(ctLamp(k, x - 1, Y0, 131, { night }));
  newsBoxes(k, 236, Y0, 127); newsBoxes(k, 168, Y0, 200, ['#e8b830', '#2e7a4a', '#c8302c']);
  // a utility cabinet plastered with posters
  B(126, Y0, 128, 133, Y0 + 9, 131, (x, y, z) => (y === Y0 + 9 ? one(k, '#3e5a4a') : one(k, '#4a6a58')));
  dS(126, Y0 + 1, 133, Y0 + 9, 131, P.league(), { ppm: 48 });
  dE(128, Y0 + 1, 131, Y0 + 8, 133, P.concert(), { ppm: 48 });
  bike(k, 244, Y0, 206, '#2a8a8a'); bike(k, 404, Y0, 127, '#c8a030'); handTruck(k, 349, Y0, 121);
  // cardboard boxes stacked by the fruit stand and the gift shop
  for (const [x, z, h] of [[346, 114, 6], [346, 119, 4], [389, 114, 5]]) B(x, Y0, z, x + 4, Y0 + h - 1, z + 4, (xx, y, zz) => (y === Y0 + h - 1 || xx === x + 2 ? one(k, '#b88a58') : one(k, '#c8a070')));
  // rooftop clutter: satellite dishes and antennas
  for (const [x, y, z] of [[110, roofY(3), 90], [210, roofY(2), 96], [340, roofY(2), 92], [404, roofY(3), 92]]) {
    B(x, y + 1, z, x, y + 4, z, one(k, '#6a6a70'));
    ell(v, x - 1.5, y + 6, z + 1.5, 2.6, 2.2, 0.8, one(k, '#d8d8d4')); v.set(x - 1, y + 6, z + 3, one(k, '#5a5a60'));
  }
  for (const [x, y, z] of [[96, roofY(3), 70], [300, roofY(2), 64], [180, roofY(2), 80]]) { B(x, y + 1, z, x, y + 18, z, one(k, '#4a4a50')); for (let j = 0; j < 4; j++) B(x - 4 + j, y + 10 + j * 2, z, x + 4 - j, y + 10 + j * 2, z, one(k, '#4a4a50')); }
  plant(330, roofY(2) + 1, 96, 'bamboo', '#b85a3a', 41); plant(338, roofY(2) + 1, 98, 'fern', '#3a6a8a', 42); plant(360, roofY(2) + 1, 94, 'fern', '#c89a3a', 43);
  lanterns([303, roofY(2) + 9, 100], [345, roofY(2) + 9, 100], { sag: 3, step: 6 });
  B(302, roofY(2) + 1, 100, 302, roofY(2) + 9, 100, one(k, '#5a5a60')); B(346, roofY(2) + 1, 100, 346, roofY(2) + 9, 100, one(k, '#5a5a60'));
  for (const [x, z] of [[140, 132], [346, 132], [200, 200], [420, 202]]) trashCan(k, x, Y0, z);
  k.hydrant(176, Y0, 132); k.hydrant(452, Y0, 200);
  // parked cars and a delivery van at the loading zone
  k.car(64, SY + 1, 139, '#e8e4da', 1); k.car(176, SY + 1, 139, '#3a6ab0', 1); k.car(362, SY + 1, 139, '#2e2e34', 1);
  van(k, 292, SY + 1, 178, { col: '#eceae4', stripe: '#c8302c', dir: -1 });
  // street sign on the corner lamp
  B(392, Y0 + 30, 135, 392, Y0 + 32, 145, one(k, '#2a6a3a'));
  dE(135, Y0 + 30, 145, Y0 + 32, 392, P.streetSign('GRANT AV', '都板街'), { ppm: 48 });
  dW(135, Y0 + 30, 145, Y0 + 32, 392, P.streetSign('GRANT AV', '都板街'), { ppm: 48 });

  // ---------------------------------------------------------------- upstairs businesses: gold lettering on the glass
  for (const [x0, f, cjk, en] of [[18, 2, '麻雀館', 'MAHJONG'], [186, 2, '牙科', 'DENTIST'], [317, 2, '旅行社', 'TRAVEL'], [366, 2, '功夫', 'KUNG FU'], [105, 3, '宴會廳', 'BANQUET'], [412, 2, '功夫', 'KUNG FU']]) {
    const w = x0 === 186 || x0 === 366 ? 7 : x0 === 412 ? 10 : 9;
    dS(x0, fl(f) + 6, x0 + w, fl(f) + 18, ZF - 1, P.winText({ cjk, en }), { ppm: 48, off: 0.03 });
  }
  // a tall corner sign on the California Street face of the pagoda building
  B(448, fl(1) + 2, 100, 449, fl(3) + 4, 110, one(k, '#b02428'));
  for (let y = fl(1) + 2; y <= fl(3) + 4; y++) for (const z of [100, 110]) v.set(450, y, z, night ? one(k, '#ffd040', GLOW) : one(k, '#e8d090'));
  for (let z = 100; z <= 110; z++) for (const y of [fl(1) + 2, fl(3) + 4]) v.set(450, y, z, night ? one(k, '#ffd040', GLOW) : one(k, '#e8d090'));
  dE(101, fl(1) + 3, 109, fl(3) + 3, 449, P.vboard({ cjk: '中華', bg: '#b02428', col: '#ffe070', frame: '#f0c040' }), { ppm: 40, glow: true, off: 0.03 });
  // overhead wires between the rooftops and across the street
  for (const [a, b, sag] of [[[64, roofY(3) - 2, ZF], [160, roofY(1) + 4, ZF + 1], 6], [[220, roofY(3) - 6, ZF], [300, roofY(2) - 2, ZF], 5], [[392, roofY(3) - 8, ZF], [448, Y0 + 40, 200], 8], [[0, roofY(2) - 4, ZF], [GX + 8, Y0 + 70, 120], 4]]) dr.wire(a, b, sag, 0x22201e);

  // ---------------------------------------------------------------- lanterns across the street (zigzag), along the square
  for (const [i, x] of [80, 160, 240, 320, 400].entries()) {
    lanterns([x + 36, fl(2) + 2, ZF + 1], [x + 1, Y0 + 44, 201], { sag: 12, mixed: true, alt: i });
    lanterns([x - 36, fl(2) + 2, ZF + 1], [x + 1, Y0 + 44, 201], { sag: 12, mixed: true, alt: i + 1 });
    if (i < 4) lanterns([x + 1, Y0 + 44, 201], [x + 81, Y0 + 44, 201], { sag: 9, step: 8, alt: i });
  }
  lanterns([2, fl(2) + 4, ZF + 1], [GX - 4, Y0 + 62, 166], { sag: 6, big: true, step: 12 });

  const pal = foldPalette(v);
  return {
    vox: v, mood: o.mood || 'golden', lamps, dress: dr, view, shots, palette: pal,
    setup(st) {
      skyline(st, { x: [-6, 66], z: -70, n: 34 });
      dr.build(st);
      for (const d of D) decal(st, d);
      for (const [x, y, z, col, pow, dist] of glowLights) st.lamp(x, y, z, col, pow, dist);
    },
  };
}
