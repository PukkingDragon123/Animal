// Chinatown, Grant Avenue — the start of the game. A super-detailed diorama.
import { Fine, GLOW } from '../fine.js';
import { Kit, h3, noise2 } from '../kit.js';
import { Dress } from '../dress.js';
import { SPR } from '../cards.js';
import { skyline } from '../stage.js';
import { decal, glyphs, loadSignFonts } from '../decals.js';
import { bx, C, one, many, pagodaRoof, paifang, lion, pavilion, ctLamp, win, railing, balcony, loggia, fireEscape, awning, tileEave, shutter, waterTank, condenser, roofHut, chessTable, newsBoxes, trashCan, bench, van, shade, brackets, beam, ell, cylY } from './chinatown_parts.js';

// ---- layout (voxels, 8 per metre). x runs along Grant Avenue, z toward the camera.
const SY = 8, WY = 9, Y0 = 10, PY = 17;          // asphalt top, sidewalk top, ground floor, plaza top
const ZF = 111, ZB = 32;                          // north row: front wall layer, back
const ROAD = [137, 194], SWN = [112, 135], SWS = [196, 219], PZ = 220;
const XC = 448, GX = 40;                          // cross street (California St) from x 448; gate centre
const GH = 36, FH = 26;                           // ground-floor and upper-floor heights
const fl = (n) => Y0 + GH + (n - 1) * FH;         // bottom of upper floor n (1-based)

export const view = { target: [30, 4.5, 23], dist: 64, yaw: 0, pitch: 33 };
export const shots = [
  { name: 'hub', ...view },
  { name: 'gate', target: [5.5, 6, 20.5], dist: 26, yaw: 62, pitch: 16 },
  { name: 'street', target: [30, 3.5, 19.5], dist: 34, yaw: 72, pitch: 14 },
  { name: 'square', target: [30, 2.5, 36], dist: 30, yaw: -18, pitch: 38 },
  { name: 'bakery', target: [17.7, 3, 14.5], dist: 11, yaw: 4, pitch: 10 },
];

export async function prepare() { await loadSignFonts('天下為公金龍酒家茶樓點心餅家中藥珠寶福中華生果禮品幸運餅都板街華埠萬事如意'); }

export function build(o = {}) {
  const night = o.mood === 'night';
  const v = new Fine(512, 224, 384, 8), k = new Kit(v), dr = new Dress(k), lamps = [], D = [];
  // ---------------------------------------------------------------- ground
  k.box(0, 0, 0, 511, 5, 383, 'dirt', 'hash');
  // Grant Avenue: asphalt, worn patches, a crack or two
  k.box(0, 6, ROAD[0], 511, SY, ROAD[1], 'asphalt', 'hash');
  for (let x = 0; x < 512; x++) for (let z = ROAD[0]; z <= ROAD[1]; z++) { if (noise2(x, z, 11) > 0.7) k.set(x, SY, z, 'asphaltOld'); if (h3(x, 7, z) > 0.997) k.set(x, SY, z, 'tar'); }
  // sidewalks + curbs
  const walk = (x0, x1, z0, z1) => { k.box(x0, 6, z0, x1, WY, z1, 'sidewalk', 'patch', { sc: 8 }); for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (x % 12 === 0 || (z - z0) % 12 === 0) k.set(x, WY, z, 'seam'); };
  walk(0, XC + 17, SWN[0], SWN[1]); k.box(0, 6, 136, XC + 17, WY, 136, 'curb', 'hash');
  walk(0, XC + 17, SWS[0], SWS[1]); k.box(0, 6, 195, XC + 17, WY, 195, 'curb', 'hash');
  // the cross street (California St) at the east end
  walk(XC, XC + 17, 0, ROAD[0] - 2); walk(XC, XC + 17, ROAD[1] + 2, 383);
  k.box(XC + 18, 6, 0, XC + 18, WY, ROAD[0] - 2, 'curb'); k.box(XC + 18, 6, ROAD[1] + 2, XC + 18, WY, 383, 'curb');
  k.box(XC + 19, 6, 0, 511, SY, 383, 'asphalt', 'hash');
  // ---------------------------------------------------------------- Portsmouth Square (raised plaza)
  k.box(0, 6, PZ, XC - 1, PY, 383, (x, y, z) => {
    if (y < PY) return many(k, C.granite)[Math.floor(h3(x, y, z) * 4)];
    const band = (x % 48 < 3) || ((z - PZ) % 48 < 3);
    return band ? one(k, (x + z) % 2 ? '#a65a46' : '#9a503e') : ((x >> 2) + (z >> 2)) % 2 ? one(k, '#bdb6aa') : one(k, '#c6c0b4');
  });
  // ---------------------------------------------------------------- north row (placeholder masses)
  const masses = [[0, 63, 3], [64, 119, 4], [120, 163, 2], [164, 219, 3], [220, 283, 4], [300, 347, 3], [348, 391, 3], [392, 447, 4]];
  for (const [x0, x1, n] of masses) {
    const yr = fl(n + 1) - 1;
    bx(k, x0, Y0, ZB, x1, yr, ZF, many(k, ['#d8ccb4', '#d2c6ae']));
    for (let f = 1; f <= n; f++) for (let x = x0 + 5; x + 8 <= x1 - 3; x += 14) win(k, { x0: x, x1: x + 7, y0: fl(f) + 6, y1: fl(f) + 19, zf: ZF, night });
  }
  // ---------------------------------------------------------------- the Dragon Gate
  const gate = paifang(k, { x: GX, y: Y0, pz: [113, 131, 197, 215] });
  lion(k, GX - 18, Y0, 121, {}); lion(k, GX - 18, Y0, 202, { female: true });
  // ---------------------------------------------------------------- the pavilion
  const pav = pavilion(k, { cx: 236, cz: 304, y: PY + 1, night });
  // ---------------------------------------------------------------- lamps
  for (const x of [80, 160, 240, 320, 400]) lamps.push(ctLamp(k, x, Y0, 199, { night }));
  for (const x of [120, 200, 300, 380]) lamps.push(ctLamp(k, x, Y0, 131, { night }));
  // trees
  for (const [x, z, s] of [[60, 250, 1], [150, 262, 2], [330, 250, 3], [410, 300, 4], [120, 340, 5]]) dr.tree(x, PY + 1, z, 'ginkgo', s);
  // lantern strings across the street
  for (const x of [80, 160, 240, 320, 400]) dr.lanterns([x + 20, fl(1) + 10, ZF + 1], [x, Y0 + 44, 200], { sag: 10, mixed: true });

  return {
    vox: v, mood: o.mood || 'golden', lamps, dress: dr, view, shots,
    setup(st) {
      skyline(st, { x: [-30, 100], z: -40 });
      dr.build(st);
      for (const d of D) decal(st, d);
    },
  };
}
