// Pier 39 at golden hour. A plank pier on timber piles runs out into the Bay: a row of
// weathered two-storey shops with gables, balconies, awnings and carved signs across
// its north end and down its east side; a double-decker carousel whose horses turn
// (2D cards on a voxel frame); a seafood shack with a big red crab on the roof, an ice
// display, steaming bread bowls and umbrella tables; railings with tower viewers, life
// rings and lamp posts. West of the pier, K-Dock: low floats covered in lounging sea
// lions, and the big float where the forced-bond king makes his stand, reached by a
// gangway ramp. The Embarcadero runs along the south with the cable-car stop and the
// PIER 39 gate. Beyond: the Bay, Alcatraz, Angel Island, the Golden Gate and the Bay
// Bridge as a painted distance over a sea that runs to the horizon. Seagulls everywhere.
// Shop posters are left as framed cards and exported as posterSlots.
import * as THREE from '../../../vendor/three.module.js';
import { Fine, WATER, GLOW } from '../fine.js';
import { Kit, h3, noise2 } from '../kit.js';
import { Dress } from '../dress.js';
import { SPR, Cards } from '../cards.js';
import { decal, loadSignFonts } from '../decals.js';
import {
  bx, one, many, ell, cylY, line3, widePalette, foldPalette, decalSet, devParam, triCount, backdrop, farWater, posterSlot, posterFrame,
  SG, sfSprites, drawBayNorth, planks, pile, rail, lampPost, cafeSet, breadBowl, crate, barrel, lifeRing, viewer,
} from './sf_parts.js';

// ---- layout (voxels, 8 per metre). x west → east, z toward the camera (south); the Bay is north (−z).
const SEA = 9, DECK = 26, F = 27, FL = 12, FF = 13;         // water top, pier deck top, pier walk height, float top, float walk height
const PX0 = 232, PX1 = 447, PZ0 = 24, LZ = 336;             // the pier (x from PX0, z from PZ0 to the land at LZ)
const BOSS = [116, 152], BF = [56, 96, 176, 208];             // the boss float: centre, rect x0 z0 x1 z1
const GZ = [144, 158];                                        // gangway (z span)
const NZF = 100, NZB = 38;                                    // north shop row: front, back
const EXF = 400;                                              // east shop row front (faces west)
const CRX = 318, CRZ = 202, CRR = 30;                         // the carousel
const m = (q) => q / 8;
const S = (x, z, yaw, y = F) => [m(x + 0.5), m(z + 0.5), yaw, m(y)];
const TABLES = [[254, 298], [282, 298], [254, 324], [282, 324]];

export const shots = [
  { name: 'hub', target: [30, 2.5, 21], dist: 64, yaw: -6, pitch: 27 },           // the pier, K-Dock and the Bay
  { name: 'docks', target: [12, 1.6, 23], dist: 25, yaw: -6, pitch: 26 },          // the sea lions on their floats
  { name: 'boss', target: [14.5, 2.8, 19.1], dist: 13, yaw: 0, pitch: 12 },        // the big float, Alcatraz behind
  { name: 'seafood', target: [33.5, 4.0, 37.2], dist: 12, yaw: 12, pitch: 20 },    // the crab shack and its tables
  { name: 'carousel', target: [39.8, 6.2, 25.2], dist: 22, yaw: -14, pitch: 12 },  // the double-decker carousel
  { name: 'shops', target: [43, 7.2, 12.5], dist: 26, yaw: -8, pitch: 10 },        // the shop row, balconies and signs
  { name: 'entrance', target: [43, 5.5, 41.5], dist: 18, yaw: 0, pitch: 12 },      // the PIER 39 gate from the Embarcadero
  { name: 'bay', target: [18, 7, -2], dist: 32, yaw: -4, pitch: 3 },               // across K-Dock to Alcatraz and the Golden Gate
];
export const view = shots[0];
// actor spots: [x, z, yaw (0 faces +z, toward the camera), y]
const seatsOf = (x, z) => [[x - 7, z, Math.PI / 2], [x + 7, z, -Math.PI / 2], [x, z - 7, 0], [x, z + 7, Math.PI]];
const T0 = seatsOf(...TABLES[0]);
export const spots = {
  start: S(346, 356, Math.PI),                               // the Embarcadero at the pier gate
  tramStop: S(292, 362, Math.PI / 2),                         // by the cable-car stop sign
  boss: S(BOSS[0], BOSS[1], 0, FF),                           // the centre of the big float (the 3-vs-1)
  allyHero: S(BOSS[0] - 18, BOSS[1] + 34, Math.PI, FF),       // a fighting line south of the boss, facing him
  allyCoach: S(BOSS[0] - 32, BOSS[1] + 28, Math.PI * 0.92, FF),
  allyYumi: S(BOSS[0] + 18, BOSS[1] + 32, -Math.PI * 0.95, FF),
  gangway: S(236, 151, -Math.PI / 2),                         // the top of the ramp down to K-Dock
  docks: S(120, 344, Math.PI),                                 // the Embarcadero rail over K-Dock
  table: S(TABLES[0][0] + 2, TABLES[0][1], 0, F + 7),                       // the seafood table: its centre, at tabletop height (a reference, not a standing spot)
  seat0: S(T0[0][0], T0[0][1], T0[0][2], F + 4), seat1: S(T0[1][0], T0[1][1], T0[1][2], F + 4), seat2: S(T0[2][0], T0[2][1], T0[2][2], F + 4),
  seafood: S(268, 280, Math.PI),                               // at the shack's counter
  carousel: S(CRX, CRZ + 44, Math.PI),
  balcony: S(330, 106, 0, F + 30),                             // upstairs, on the shop balcony
};
// the boss fight: the big float, two sides along x, the camera from the south (over the water)
export const arena = { at: [m(BOSS[0] + 0.5), m(BOSS[1] + 0.5)], r: 5.5, axis: 'x', cam: { dist: 11, yaw: 0, pitch: 20 } };
// poster slots (metres; see sf_parts posterSlot): framed poster cases on the shop fronts
export const posterSlots = [
  ...[299, 347, 395, 443].map((x1, i) => posterSlot('pierPoster' + i, 's', x1 - 12, F + 6, x1 - 5, F + 18, NZF, 'poster')),   // one by each north-row door
  posterSlot('pierPoster4', 'w', 234, F + 6, 241, F + 18, EXF, 'poster'),       // on the east row, between two shops
  posterSlot('pierBoard', 's', 300, F + 34, 316, F + 46, LZ - 2, 'poster'),     // the gate's notice board (facing the Embarcadero)
];

export async function prepare() { await loadSignFonts('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!&$.·-'); }

export function build(o = {}) {
  const night = o.mood === 'night';
  const v = new Fine(448, 128, 384, 8); widePalette(v);
  const k = new Kit(v), dr = new Dress(k), D = [], d = decalSet(D), lamps = [], SF = sfSprites();
  const B = (...a) => bx(k, ...a), set = (x, y, z, c) => v.set(x, y, z, c);
  const WOOD = many(k, ['#8a6a4a', '#94744e', '#7e6044']), WOODD = many(k, ['#5a4632', '#4e3c2a']), IRON = many(k, ['#22302a', '#2a3a32']);
  const CON = many(k, ['#a8a49c', '#b0aca4', '#9e9a92']), TRIM = one(k, '#f2ece0');

  // ---------------------------------------------------------------- the Bay: seabed and water everywhere, then the land and the pier on top
  // (no opaque seabed: the translucent sea then reads the same inside the diorama and out to the horizon)
  const WA = [one(k, '#2a6a96', WATER), one(k, '#2e72a0', WATER), one(k, '#3478a6', WATER)];
  B(0, SEA - 1, 0, 447, SEA, 383, (x, y, z) => WA[Math.floor(noise2(x, z, 14) * 2.99)]);

  // ---------------------------------------------------------------- the Embarcadero (south): seawall, paving, the K-Dock rail, palms, the cable-car stop
  B(0, 4, LZ, 447, DECK - 1, 383, (x, y, z) => (z === LZ && y < DECK - 2 ? (y < SEA + 2 ? one(k, '#5a5a4a') : CON[(x + y) % 3]) : one(k, '#8a8478')));
  B(0, DECK, LZ, 447, DECK, 383, (x, y, z) => { const r = (z - LZ) >> 2, off = (r & 1) * 3; return (z - LZ) % 4 === 0 || (x + off) % 6 === 0 ? one(k, '#a49c90') : many(k, ['#c8bca8', '#c0b49e', '#ccc2b0', '#b8ac98'])[Math.floor(h3((x + off) / 6 | 0, r, 7) * 4)]; });
  for (let x = 0; x < 448; x++) for (const z of [340, 341]) set(x, DECK, z, one(k, '#9a8a74'));
  rail(k, { a: 0, b: PX0 - 1, y: F, at: LZ, axis: 'x', h: 8, step: 8, post: ['#22302a', '#2a3a32'], top: ['#2e3e36', '#26342e'], bars: true, midCol: '#2a3a32' });
  for (const [x, z, s] of [[30, 362, 1], [170, 366, 2], [430, 368, 3]]) k.tree(x, F, z, 'palm', s);
  // the cable-car stop: a brass-topped pole with its sign, a bench
  B(296, F, 356, 296, F + 30, 356, one(k, '#5a5a60')); B(296, F + 24, 356, 296, F + 30, 366, one(k, '#7c1a20'));
  d.E(356, F + 24, 366, F + 30, 296, SG.dest('CABLE CAR', 'STOP'), { ppm: 128 }); d.W(356, F + 24, 366, F + 30, 296, SG.dest('CABLE CAR', 'STOP'), { ppm: 128 });
  B(270, F, 368, 290, F + 3, 371, (x, y) => (y === F + 3 ? WOOD[(x >> 2) % 3] : x === 270 || x === 290 ? IRON[0] : undefined)); B(270, F + 4, 372, 290, F + 7, 372, (x) => WOOD[(x >> 2) % 3]);
  for (const [x, z] of [[60, 350], [200, 350], [250, 350], [440, 350]]) lamps.push(lampPost(k, x, F, z, { night, double: true }));

  // ---------------------------------------------------------------- the pier: piles, beams, plank deck, rails
  for (let z = PZ0; z < LZ; z += 12) for (const x of [PX0 + 2]) pile(k, x, z + 2, 0, DECK - 3, 1.6, { tide: SEA + 2 });
  for (let x = PX0 + 14; x <= PX1; x += 12) pile(k, x, PZ0 + 2, 0, DECK - 3, 1.6, { tide: SEA + 2 });
  B(PX0, DECK - 4, PZ0, PX1, DECK - 2, LZ - 1, (x, y, z) => ((x - PX0) % 16 === 0 || z === PZ0 || x === PX0 ? WOODD[(x + z) & 1] : undefined));
  B(PX0, DECK - 4, PZ0, PX0, DECK - 1, LZ - 1, WOODD[0]); B(PX0, DECK - 4, PZ0, PX1, DECK - 1, PZ0, WOODD[0]);
  planks(k, PX0, PZ0, PX1, LZ - 1, DECK, { along: 'x', bw: 2, len: 32, wear: true });
  rail(k, { a: PZ0, b: GZ[0] - 1, y: F, at: PX0, axis: 'z', h: 8, step: 10, thick: true });
  rail(k, { a: GZ[1] + 1, b: LZ - 1, y: F, at: PX0, axis: 'z', h: 8, step: 10, thick: true });
  rail(k, { a: PX0, b: PX1, y: F, at: PZ0, axis: 'x', h: 8, step: 10, thick: true });
  // tower viewers, life rings, an info board along the west rail
  for (const z of [118, 186, 238]) viewer(k, PX0 + 3, F, z, -2);
  for (const z of [60, 128, 214, 290]) { B(PX0 + 1, F, z, PX0 + 1, F + 14, z, WOODD[0]); lifeRing(k, PX0 + 2, F + 10, z, 'x'); }
  B(PX0 + 2, F, 166, PX0 + 2, F + 18, 166, WOODD[0]); B(PX0 + 2, F, 176, PX0 + 2, F + 18, 176, WOODD[0]); B(PX0 + 3, F + 8, 165, PX0 + 3, F + 18, 177, one(k, '#2e5a7a'));
  d.E(165, F + 8, 177, F + 18, PX0 + 3, SG.infoBoard(), { ppm: 128 });
  for (const z of [80, 160, 250, 320]) lamps.push(lampPost(k, PX0 + 4, F, z, { night }));
  for (const x of [270, 330]) lamps.push(lampPost(k, x, F, PZ0 + 4, { night }));

  // ---------------------------------------------------------------- the gangway down to K-Dock, and the floats
  for (let x = 196; x < PX0; x++) {
    const top = FL + Math.round(((x - 196) / (PX0 - 1 - 196)) * (DECK - FL));
    B(x, top - 1, GZ[0], x, top, GZ[1], (xx, y, z) => (y === top ? ((x & 1) ? WOOD[0] : WOOD[1]) : WOODD[0]));
    for (const z of [GZ[0] - 1, GZ[1] + 1]) { set(x, top + 7, z, one(k, '#c8ccd4')); if (x % 6 === 0) B(x, top, z, x, top + 7, z, one(k, '#9aa0a8')); }
  }
  B(BF[2] + 1, FL - 1, GZ[0], 195, FL, GZ[1], (x, y, z) => (y === FL ? ((x >> 1) & 1 ? WOOD[0] : WOOD[2]) : one(k, '#e8e4dc')));
  const float = (x0, z0, x1, z1, o2 = {}) => {
    B(x0, FL - 2, z0, x1, FL - 1, z1, (x, y, z) => (y === FL - 2 ? one(k, '#d8d4c8') : one(k, '#b8b4a8')));
    planks(k, x0, z0, x1, z1, FL, { along: o2.along || 'x', bw: 2, len: 20, cols: ['#8a7a64', '#94846c', '#7e6e5a', '#a08e76'], th: 0 });
    for (let x = x0; x <= x1; x++) for (const z of [z0, z1]) set(x, FL, z, one(k, '#3a3430'));
    for (let z = z0; z <= z1; z++) for (const x of [x0, x1]) set(x, FL, z, one(k, '#3a3430'));
    for (let x = x0 + 4; x < x1; x += 12) for (const z of [z0 - 1, z1 + 1]) { set(x, FL - 1, z, one(k, '#1c1c20')); set(x + 1, FL - 1, z, one(k, '#1c1c20')); set(x, FL, z, one(k, '#26262a')); }
  };
  float(BF[0], BF[1], BF[2], BF[3]);
  for (const [x, z] of [[BF[0] + 4, BF[1] + 4], [BF[2] - 4, BF[1] + 4], [BF[0] + 4, BF[3] - 4], [BF[2] - 4, BF[3] - 4]]) B(x, FF, z, x + 1, FF + 1, z, one(k, '#c8ccd4'));
  for (const [x, z] of [[BF[0], BF[1]], [BF[2], BF[1]], [BF[0], BF[3]], [BF[2], BF[3]]]) pile(k, x, z, 0, FL + 18, 2, { tide: SEA + 2, cap: '#d8d4c8' });
  const SMALL = [[8, 100, 44, 140], [8, 150, 44, 200], [64, 30, 112, 78], [124, 30, 172, 78], [184, 40, 220, 100], [12, 224, 60, 262], [72, 230, 120, 270], [132, 226, 186, 266], [20, 282, 76, 318], [96, 284, 150, 320], [164, 280, 214, 316], [196, 176, 220, 214]];
  for (const [x0, z0, x1, z1] of SMALL) { float(x0, z0, x1, z1, { along: (x1 - x0) > (z1 - z0) ? 'x' : 'z' }); pile(k, x0 - 2, z0 - 2, 0, FL + 14, 1.4, { tide: SEA + 2, cap: '#d8d4c8' }); }

  // ---------------------------------------------------------------- the north shop row: four two-storey gabled buildings, a balcony walkway
  const SCH = [
    { wall: ['#8a7a68', '#7e6e5c', '#968672'], trim: '#f2ece0', aw: ['#2e6a8a', '#f4efe4'], sign: 'SEA LION GIFTS', sub: 'plush · shirts · postcards', win: 'plush', up: 'KITE LOFT', upWin: 'kites' },
    { wall: ['#6e8a86', '#668480', '#76928e'], trim: '#f6f0e4', aw: ['#c8302c', '#f4efe4'], sign: 'FOG CITY FUDGE', sub: 'made fresh on the pier', win: 'fudge', up: 'CHOWDER HOUSE', upWin: 'shirts' },
    { wall: ['#9a8a74', '#8e7e68', '#a49480'], trim: '#efe8d8', aw: ['#e8a838', '#f4efe4'], sign: 'BAY CANDY CO.', sub: 'salt-water taffy', win: 'candy', up: 'MAGIC & TRICKS', upWin: 'kites' },
    { wall: ['#7a8aa0', '#72829a', '#8292a8'], trim: '#f4f0e8', aw: ['#2e8a5a', '#f4efe4'], sign: 'TOKON CARD SHOP', sub: 'packs · decks · trades', win: 'cards', up: 'PIER ARCADE', upWin: 'cards' },
  ];
  const Y1 = F + 30, Y2 = F + 55;                         // upper floor, eaves
  const wallFn = (q) => { const W2 = many(k, q.wall); return (x, y, z) => ((y - F) % 3 === 0 ? W2[2] : W2[(x >> 1) % 2 ? 0 : 1]); };
  const shopFront = (x0, x1, q, si) => {
    const T = one(k, q.trim), WAL = wallFn(q);
    B(x0, F, NZB, x1, Y2, NZF, WAL);
    B(x0 + 3, F + 3, NZB + 3, x1 - 3, Y2 - 3, NZF - 4, one(k, '#5a4a3a')); B(x0 + 4, F + 4, NZB + 4, x1 - 4, Y2 - 4, NZF - 5, 0);   // hollow core
    for (const cx of [x0, x0 + 1, x1 - 1, x1]) B(cx, F, NZF + 1, cx, Y2, NZF + 1, T);
    // ground floor: two display windows and a door
    const mid = (x0 + x1) >> 1;
    for (const [a, b] of [[x0 + 4, mid - 7], [mid + 7, x1 - 15]]) {
      B(a, F + 4, NZF - 1, b, F + 20, NZF, 0); B(a, F + 4, NZF - 2, b, F + 20, NZF - 2, one(k, '#3a2a20'));
      B(a, F, NZF, b, F + 3, NZF, one(k, '#5a4a3a')); B(a - 1, F + 3, NZF + 1, b + 1, F + 3, NZF + 2, T); B(a - 1, F + 21, NZF + 1, b + 1, F + 21, NZF + 1, T);
      for (let x = a; x <= b; x++) for (let y = F + 4; y <= F + 20; y++) if (x === a || x === b || y === F + 20 || (x - a) % 8 === 0) set(x, y, NZF - 1, T);
      d.S(a + 1, F + 4, b - 1, F + 19, NZF - 2, SG.shopWin(q.win), { ppm: 96, off: 0.01 });
    }
    B(mid - 5, F, NZF - 3, mid + 5, F + 22, NZF, 0); B(mid - 5, F, NZF - 4, mid + 5, F + 22, NZF - 4, (x, y) => (x === mid || y === F + 22 || x === mid - 5 || x === mid + 5 ? T : y > F + 8 ? one(k, '#3c4c68') : one(k, '#5a3a24')));
    // awning, sign board above it, balcony walkway over the boardwalk
    const A = q.aw.map((c) => one(k, c));
    for (let dz = 1; dz <= 8; dz++) for (let x = x0 + 2; x <= x1 - 2; x++) set(x, F + 25 - (dz >> 1), NZF + dz, A[Math.floor((x - x0) / 4) & 1]);
    for (let x = x0 + 2; x <= x1 - 2; x++) for (let j = 1; j <= 2; j++) if (!(j === 2 && (x & 1))) set(x, F + 21 - j, NZF + 8, A[Math.floor((x - x0) / 4) & 1]);
    B(x0 + 4, F + 26, NZF + 1, x1 - 4, F + 29, NZF + 1, one(k, '#3a2414'));
    d.S(x0 + 4, F + 26, x1 - 4, F + 29, NZF + 1, SG.woodSign(q.sign, { sub: null }), { ppm: 128 });
    // upper floor: three sash windows and a balcony door
    for (const wx of [x0 + 5, x0 + 17, x1 - 12]) {
      B(wx, Y1 + 5, NZF - 1, wx + 7, Y1 + 17, NZF, 0); B(wx, Y1 + 5, NZF - 2, wx + 7, Y1 + 17, NZF - 2, (x, y) => (y === Y1 + 11 ? T : (x + y) % 9 === 0 ? one(k, '#8ea6c0') : one(k, '#34445e')));
      for (let x = wx; x <= wx + 7; x++) for (let y = Y1 + 5; y <= Y1 + 17; y++) if (x === wx || x === wx + 7 || y === Y1 + 5 || y === Y1 + 17) set(x, y, NZF - 1, T);
      B(wx - 1, Y1 + 18, NZF + 1, wx + 8, Y1 + 18, NZF + 1, T);
    }
    B(x0 + 29, Y1, NZF - 2, x0 + 36, Y1 + 18, NZF, 0); B(x0 + 29, Y1, NZF - 3, x0 + 36, Y1 + 18, NZF - 3, (x, y) => (y === Y1 + 18 || x === x0 + 29 || x === x0 + 36 ? T : y > Y1 + 7 ? one(k, '#3c4c68') : one(k, many(k, q.wall)[0])));
    B(x0 + 6, Y1 + 20, NZF + 1, x1 - 6, Y1 + 23, NZF + 1, one(k, '#2a1a0e'));
    d.S(x0 + 6, Y1 + 20, x1 - 6, Y1 + 23, NZF + 1, SG.woodSign(q.up, { bg: '#2e3e4a', bg2: '#3e5060', gold: '#f0d070', ink: '#ffffff' }), { ppm: 128 });
    // the gable: shingled roof slopes (ridge along z), a gable face with a round vent
    const RF = many(k, ['#6a5a4c', '#5e5042', '#74645a', '#54483c']), w = x1 - x0, half = w / 2;
    for (let i = 0; i <= half + 2; i++) {
      const y = Y2 + 1 + Math.round(i * 0.72), a = x0 - 2 + i, b = x1 + 2 - i; if (a > b) break;
      for (const xx of [a, a + 1, b - 1, b]) B(xx, y, NZB - 2, xx, y, NZF + 3, (x, yy, z) => RF[((z >> 1) + i) % 4]);
      if (b - a > 3) { B(a + 2, y, NZF, b - 2, y, NZF, (x, yy) => (((x + (yy >> 1)) % 4 === 0) ? many(k, q.wall)[2] : many(k, q.wall)[0])); B(a + 2, y, NZB, b - 2, y, NZF - 1, WAL); }
      set(a, y, NZF + 4, T); set(b, y, NZF + 4, T);
    }
    ell(v, (x0 + x1) / 2, Y2 + 10, NZF + 0.5, 2.6, 2.6, 0.6, (x, y, z, dd) => (dd > 0.55 ? T : one(k, '#3a3a40')));
    posterFrame(k, posterSlots[si], { frame: '#3a2414', back: '#f2ecde' });
  };
  const ROW = [[252, 299], [300, 347], [348, 395], [396, 443]];
  ROW.forEach(([a, b], i) => shopFront(a, b, SCH[i], i));
  // the balcony walkway along the row, posts, a rail with flower boxes, the stair up at the west end
  B(252, Y1 - 2, NZF + 1, 443, Y1 - 1, NZF + 12, (x, y, z) => (y === Y1 - 2 || z === NZF + 12 ? WOODD[0] : WOOD[(x >> 3) % 3]));
  for (let x = 252; x <= 443; x += 24) B(x, F, NZF + 11, x + 1, Y1 - 3, NZF + 12, WOODD[1]);
  rail(k, { a: 252, b: 443, y: Y1, at: NZF + 12, axis: 'x', h: 7, step: 8, bars: true });
  rail(k, { a: NZF + 1, b: NZF + 12, y: Y1, at: 443, axis: 'z', h: 7, step: 6 });
  for (let x = 262; x < 440; x += 48) { B(x, Y1 + 7, NZF + 13, x + 14, Y1 + 9, NZF + 14, one(k, '#7a4a2a')); dr.tufts(x + 1, NZF + 13, x + 13, NZF + 14, 5, [...SPR.flowers], x, { scale: 0.75 }); }
  for (let s = 0; s < 8; s++) { const x0 = 236 + s * 2, top = F + 2 + s * 4; B(x0, F, NZF + 1, x0 + 1, top, NZF + 12, (x, yy) => (yy === top ? WOOD[s % 3] : WOODD[0])); }
  rail(k, { a: NZF + 1, b: NZF + 12, y: F + 4, at: 235, axis: 'z', h: 6, step: 11, mid: false });

  // ---------------------------------------------------------------- the east row: one long building, three fronts facing west
  {
    const T = one(k, '#f2ece0'), q0 = { wall: ['#8a7a68', '#7e6e5c', '#968672'] }, WAL = wallFn(q0), Z0 = 112, Z1 = 300;
    B(EXF, F, Z0, 447, Y2, Z1, WAL); B(EXF + 4, F + 4, Z0 + 4, 443, Y2 - 4, Z1 - 4, one(k, '#5a4a3a')); B(EXF + 5, F + 5, Z0 + 5, 442, Y2 - 5, Z1 - 5, 0);
    const fronts = [{ z0: 118, z1: 172, name: 'SOURDOUGH BAKERY', win: 'fudge', aw: ['#c8302c', '#f4efe4'] }, { z0: 178, z1: 234, name: 'WHARF OUTFITTERS', win: 'shirts', aw: ['#2e5a9c', '#f4efe4'] }, { z0: 240, z1: 294, name: 'SALTY DOG SWEETS', win: 'candy', aw: ['#e8a838', '#f4efe4'] }];
    for (const f of fronts) {
      const mid = (f.z0 + f.z1) >> 1, A = f.aw.map((c) => one(k, c));
      for (const [a, b] of [[f.z0 + 3, mid - 6], [mid + 6, f.z1 - 3]]) { B(EXF, F + 4, a, EXF + 1, F + 20, b, 0); B(EXF + 2, F + 4, a, EXF + 2, F + 20, b, one(k, '#3a2a20')); for (let z = a; z <= b; z++) for (let y = F + 4; y <= F + 20; y++) if (z === a || z === b || y === F + 20) set(EXF + 1, y, z, T); d.W(a + 1, F + 4, b - 1, F + 19, EXF + 2, SG.shopWin(f.win), { ppm: 96, off: 0.01 }); }
      B(EXF, F, mid - 4, EXF + 2, F + 22, mid + 4, 0); B(EXF + 3, F, mid - 4, EXF + 3, F + 22, mid + 4, (x, y, z) => (z === mid || y === F + 22 ? T : y > F + 8 ? one(k, '#3c4c68') : one(k, '#5a3a24')));
      for (let dx = 1; dx <= 8; dx++) for (let z = f.z0 + 1; z <= f.z1 - 1; z++) set(EXF - dx, F + 25 - (dx >> 1), z, A[Math.floor((z - f.z0) / 4) & 1]);
      B(EXF - 1, F + 26, f.z0 + 3, EXF - 1, F + 29, f.z1 - 3, one(k, '#3a2414')); d.W(f.z0 + 3, F + 26, f.z1 - 3, F + 29, EXF - 1, SG.woodSign(f.name, {}), { ppm: 128 });
      for (const wz of [f.z0 + 6, mid - 4, f.z1 - 14]) { B(EXF, Y1 + 5, wz, EXF + 1, Y1 + 17, wz + 7, 0); B(EXF + 2, Y1 + 5, wz, EXF + 2, Y1 + 17, wz + 7, (x, y, z) => (y === Y1 + 11 ? T : (z + y) % 9 === 0 ? one(k, '#8ea6c0') : one(k, '#34445e'))); for (let z = wz; z <= wz + 7; z++) for (let y = Y1 + 5; y <= Y1 + 17; y++) if (z === wz || z === wz + 7 || y === Y1 + 5 || y === Y1 + 17) set(EXF + 1, y, z, T); }
    }
    posterFrame(k, posterSlots[3], { frame: '#3a2414', back: '#f2ecde' });
    const RF = many(k, ['#6a5a4c', '#5e5042', '#74645a', '#54483c']);
    for (let i = 0; i <= 26; i++) { const y = Y2 + 1 + Math.round(i * 0.72); B(EXF - 3 + i, y, Z0 - 2, EXF - 2 + i, y, Z1 + 2, (x, yy, z) => RF[((z >> 1) + i) % 4]); if (i > 1) { B(EXF - 1 + i, y, Z0, 447, y, Z0, WAL); B(EXF - 1 + i, y, Z1, 447, y, Z1, WAL); } }
    B(EXF + 24, Y2 + 20, Z0, 447, Y2 + 20, Z1, RF[3]);
  }

  // ---------------------------------------------------------------- the double-decker carousel
  const CR = many(k, ['#c8242c', '#d83a32']), CG = many(k, ['#f0c040', '#d8a028', '#f8d868']), CB = one(k, '#2e5a9c'), MIR = one(k, '#c8d8e4');
  const UP = F + 26, TOP = F + 50;
  cylY(v, CRX, CRZ, CRR, F, F + 1, (x, y, z, dd) => (dd > CRR - 1 ? CG[1] : y === F + 1 ? (Math.floor(Math.atan2(z - CRZ, x - CRX) * 5) & 1 ? one(k, '#8a5a3a') : one(k, '#9a6a44')) : CR[0]));
  cylY(v, CRX, CRZ, 6, F + 2, TOP, (x, y, z, dd, a) => (y % 6 === 0 ? CG[0] : (Math.floor((a + Math.PI) * 4) & 1) ? MIR : CR[(y >> 2) & 1]));
  cylY(v, CRX, CRZ, CRR - 2, UP - 1, UP, (x, y, z, dd) => (dd < 7 ? undefined : y === UP - 1 ? CR[1] : dd > CRR - 3 ? CG[1] : (Math.floor(Math.atan2(z - CRZ, x - CRX) * 5) & 1 ? one(k, '#8a5a3a') : one(k, '#9a6a44'))));
  for (let a = 0; a < 6.283; a += 0.06) { const x = Math.round(CRX + Math.cos(a) * (CRR - 2)), z = Math.round(CRZ + Math.sin(a) * (CRR - 2)); for (const y of [UP + 4, UP + 7]) set(x, y, z, CG[0]); if (Math.round(a / 0.06) % 4 === 0) B(x, UP + 1, z, x, UP + 6, z, CG[2]); for (let y = UP - 6; y < UP - 1; y++) set(Math.round(CRX + Math.cos(a) * (CRR - 1.5)), y, Math.round(CRZ + Math.sin(a) * (CRR - 1.5)), y === UP - 6 ? CG[0] : CR[(Math.round(a * 10)) & 1]); }
  for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283, x = Math.round(CRX + Math.cos(a) * (CRR - 3)), z = Math.round(CRZ + Math.sin(a) * (CRR - 3)); B(x, F + 2, z, x, UP - 2, z, CG[2]); B(x, UP + 1, z, x, TOP - 1, z, CG[2]); }
  // the canopy: a red-and-gold fascia ring (rounding boards go on it), a striped cone, a flag
  for (let y = TOP; y <= TOP + 6; y++) for (let a = 0; a < 6.283; a += 0.03) set(Math.round(CRX + Math.cos(a) * CRR), y, Math.round(CRZ + Math.sin(a) * CRR), y === TOP || y === TOP + 6 ? CG[0] : CR[0]);
  for (let a = 0; a < 6.283; a += 0.05) if (Math.round(a / 0.05) % 3 !== 0) set(Math.round(CRX + Math.cos(a) * CRR), TOP - 1, Math.round(CRZ + Math.sin(a) * CRR), CG[1]);
  for (let j = 0; j <= 16; j++) { const r = CRR - j * (CRR / 17), y = TOP + 7 + j; cylY(v, CRX, CRZ, r, y, y, (x, yy, z, dd, a) => (dd < r - 1.5 ? undefined : (Math.floor((a + Math.PI) / (Math.PI / 8)) & 1 ? one(k, '#f4efe4') : CR[0]))); }
  cylY(v, CRX, CRZ, CRR - 1, TOP + 6, TOP + 6, CR[1]);
  B(CRX, TOP + 24, CRZ, CRX, TOP + 34, CRZ, CG[0]); B(CRX + 1, TOP + 30, CRZ, CRX + 6, TOP + 33, CRZ, one(k, '#2e8a5a'));
  lamps.push([m(CRX), m(UP + 10), m(CRZ)]);
  const rounding = [];
  for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2, r = m(CRR) + 0.06; rounding.push({ x: m(CRX + 0.5) + Math.cos(a) * r, y: m(TOP + 1), z: m(CRZ + 0.5) + Math.sin(a) * r, w: 1.0, h: 0.6, face: 's', yaw: Math.atan2(Math.cos(a), Math.sin(a)), off: 0, ppm: 128, paint: SG.rounding(i) }); }
  // the horses (cards that ride around the centre post, on both decks)
  const ride = new Cards();
  for (const [deckY, n, rr] of [[F + 2, 14, 22], [F + 2, 10, 14], [UP + 1, 12, 21]]) for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + rr * 0.1, x = Math.cos(a) * m(rr), z = Math.sin(a) * m(rr); ride.add(SF.mount[(i + rr) % SF.mount.length], x, m(deckY) + (i % 2) * 0.12, z, { mode: 'fix', rot: Math.atan2(Math.cos(a), Math.sin(a)) + Math.PI, sway: 0, scale: 0.95 }); }

  // ---------------------------------------------------------------- the seafood shack, its counter, the crab on the roof, tables
  {
    const x0 = 244, x1 = 292, z0 = 252, z1 = 272, T = one(k, '#f4f0e6'), WL = many(k, ['#e8e0cc', '#e0d6c0']);
    B(x0, F, z0, x1, F + 30, z1, (x, y, z) => ((y - F) % 3 === 0 ? one(k, '#d0c6ae') : WL[(x >> 2) & 1]));
    B(x0 + 2, F + 2, z0 + 2, x1 - 2, F + 28, z1 - 4, one(k, '#6a5a48')); B(x0 + 3, F + 3, z0 + 3, x1 - 3, F + 27, z1 - 5, 0);
    B(x0 + 3, F + 11, z1 - 3, x1 - 3, F + 24, z1, 0); B(x0 + 3, F + 11, z1 - 4, x1 - 3, F + 24, z1 - 4, one(k, '#c8bca8'));
    B(x0 + 2, F + 10, z1 - 3, x1 - 2, F + 10, z1 + 3, one(k, '#b8bcc4'));                                   // the steel counter
    d.U(x0 + 4, z1 - 2, x1 - 4, z1 + 2, F + 10, SG.iceDisplay(), { ppm: 96, off: 0.012 });
    B(x0 + 4, F + 11, z1 - 4, x1 - 4, F + 16, z1 - 4, one(k, '#5a5a62'));
    for (const xx of [x0 + 2, x1 - 2]) B(xx, F + 11, z1 + 1, xx, F + 24, z1 + 1, T);
    // a striped canopy, the menu boards and the name board
    const A = [one(k, '#c8302c'), one(k, '#f4efe4')];
    for (let dz = 1; dz <= 7; dz++) for (let x = x0 - 1; x <= x1 + 1; x++) set(x, F + 28 - (dz >> 1), z1 + dz, A[Math.floor((x - x0) / 3) & 1]);
    d.S(x0 + 4, F + 18, x0 + 18, F + 24, z1 - 4, SG.menuBoard('CHOWDER & CRAB', ['Clam chowder bowl|$14', 'Dungeness crab|$32', 'Fish & chips|$18', 'Shrimp cocktail|$12'], { bg: '#1a2a3a', frame: '#f4f0e6' }), { ppm: 128, off: 0.02 });
    d.S(x1 - 18, F + 18, x1 - 4, F + 24, z1 - 4, SG.menuBoard('ON THE SIDE', ['Garlic fries|$7', 'Crab sandwich|$19', 'Sourdough loaf|$8', 'Lemonade|$4'], { bg: '#1a2a3a', frame: '#f4f0e6' }), { ppm: 128, off: 0.02 });
    B(x0, F + 31, z1 - 1, x1, F + 36, z1, one(k, '#1a2a3a'));
    d.S(x0, F + 31, x1, F + 36, z1, SG.woodSign('WHARF CHOWDER & CRAB', { bg: '#1e3a52', bg2: '#2a4a66', gold: '#f4f0e6', ink: '#fff4d8', outline: '#0e1a28' }), { ppm: 128 });
    B(x0 - 1, F + 31, z0 - 1, x1 + 1, F + 31, z1 - 2, one(k, '#5a5a60'));
    // the big red crab on the roof
    const CRB = many(k, ['#d8381e', '#c8301c', '#e8502c']), cx = 268, cz = 262, cy = F + 35;
    ell(v, cx, cy, cz, 9, 3.4, 6.5, (x, y, z) => (y > cy + 1 ? CRB[2] : CRB[(x + z) & 1]));
    for (const s of [-1, 1]) {
      for (let i = 0; i < 4; i++) { line3(v, [cx + s * 6, cy - 1, cz - 4 + i * 3], [cx + s * 13, cy - 4, cz - 6 + i * 4], CRB[1]); }
      line3(v, [cx + s * 6, cy + 1, cz + 5], [cx + s * 10, cy + 6, cz + 9], CRB[0]); ell(v, cx + s * 11, cy + 8, cz + 10, 3, 2.4, 2, CRB[0]); B(cx + s * 11, cy + 9, cz + 12, cx + s * 11, cy + 10, cz + 13, CRB[2]);
      B(cx + s * 3, cy + 3, cz + 5, cx + s * 3, cy + 5, cz + 5, one(k, '#2a1a1a')); set(cx + s * 3, cy + 6, cz + 5, one(k, '#f4f0e8'));
    }
    lamps.push([m(cx), m(F + 20), m(z1 + 4)]);
    for (const [xx, i] of [[254, 0], [268, 1], [282, 2]]) dr.card(SF.steam[i], xx, F + 12, z1 + 1, { scale: 0.9, sway: 1.6 });
    // crab pots and fish crates by the shack
    for (const [x, z] of [[238, 256], [238, 264]]) B(x, F, z, x + 5, F + 4, z + 5, (xx, yy, zz) => ((xx + yy + zz) % 2 ? one(k, '#3a6a5a') : (yy === F + 4 ? one(k, '#e8502c') : undefined)));
    crate(k, 294, F, 254, 6, 4, 6, '#9a7448'); crate(k, 294, F + 4, 255, 5, 3, 5, '#8a6a42');
  }
  const UMB = [['#f4efe4', '#2e6a8a'], ['#f4efe4', '#c8302c'], ['#f4efe4', '#e8a838'], ['#f4efe4', '#2e8a5a']];
  TABLES.forEach(([x, z], i) => {
    const t = cafeSet(k, x, F, z, { um: UMB[i], uh: 21, ur: 11, seat: ['#2e6a5a', '#c8302c', '#2e5a9c', '#8a5a2a'][i] });
    for (const [dx, dz] of i === 0 ? [[-2, 0], [2, -1], [0, 2]] : [[-1, 1], [2, 0]]) { const top = breadBowl(k, x + dx, t.top + 1, z + dz); dr.card(SF.steam[(i + dx + 3) % 3], top[0], top[1], top[2], { scale: 0.4, sway: 1.8 }); }
  });

  // ---------------------------------------------------------------- the PIER 39 gate on the Embarcadero, a notice board
  {
    const GX0 = 300, GX1 = 392, GW = many(k, ['#6a4a2e', '#5e4228', '#74522f']);
    for (const gx of [GX0, GX1 - 3]) { B(gx, F, LZ - 4, gx + 3, F + 62, LZ - 1, (x, y) => GW[(y >> 2) % 3]); B(gx - 1, F, LZ - 5, gx + 4, F + 4, LZ, CON[1]); }
    B(GX0 - 2, F + 50, LZ - 3, GX1 + 1, F + 66, LZ - 2, GW[0]); B(GX0 - 3, F + 67, LZ - 4, GX1 + 2, F + 68, LZ - 1, one(k, '#3a2a1a'));
    d.S(GX0 + 4, F + 51, GX1 - 5, F + 65, LZ - 2, SG.bigSign(), { ppm: 96 });
    B(GX0 - 1, F + 33, LZ - 3, 317, F + 47, LZ - 3, GW[1]);
    posterFrame(k, posterSlots[4], { frame: '#3a2414', back: '#f2ecde' });
    for (const [x, c] of [[GX0 + 1, 0], [GX1 - 2, 3]]) dr.card(SF.flag[c], m(x + 0.5) * 8 + 0.5, F + 70, LZ - 2, { mode: 'fix', rot: 0, sway: 1.4, scale: 1.2 });
    B(GX0 + 1, F + 63, LZ - 3, GX0 + 1, F + 76, LZ - 3, one(k, '#d8d4cc')); B(GX1 - 2, F + 63, LZ - 3, GX1 - 2, F + 76, LZ - 3, one(k, '#d8d4cc'));
  }

  // ---------------------------------------------------------------- flags on poles, bunting, benches, planters, bins, barrels
  for (const [x, z, c] of [[244, 112, 0], [244, 208, 1], [384, 160, 2], [384, 240, 3], [250, 320, 2]]) { B(x, F, z, x, F + 40, z, one(k, '#e8e4dc')); dr.card(SF.flag[c], x + 0.5, F + 32, z + 0.5, { mode: 'fix', rot: 0.3, sway: 1.6 }); }
  dr.pennants([244, F + 38, 112], [384, F + 38, 160], { sag: 6 }); dr.pennants([244, F + 38, 208], [384, F + 38, 240], { sag: 6 });
  for (const [x, z] of [[300, 300], [356, 140], [356, 290]]) { B(x, F, z, x + 14, F + 3, z + 3, (xx, yy, zz) => (yy === F + 3 ? WOOD[(xx >> 2) % 3] : (xx === x || xx === x + 14) ? IRON[0] : undefined)); B(x, F + 4, z + 3, x + 14, F + 7, z + 3, (xx) => WOOD[(xx >> 2) % 3]); }
  for (const [x0, z0] of [[352, 118], [352, 264], [240, 232]]) { B(x0, F, z0, x0 + 10, F + 4, z0 + 6, (x, y, z) => (y === F + 4 ? one(k, '#4a3424') : WOOD[(x + z) % 3])); dr.tufts(x0 + 1, z0 + 1, x0 + 9, z0 + 5, 6, [...SPR.flowers, ...SPR.fern], x0 + z0, { scale: 0.85 }); }
  for (const [x, z] of [[372, 312], [246, 140], [386, 108]]) cylY(v, x, z, 2, F, F + 6, (xx, y) => (y === F + 6 ? one(k, '#1f3329') : one(k, '#2e4a3a')));
  for (const [x, z, c] of [[388, 304, '#2e6a9a'], [392, 300, '#c8302c']]) barrel(k, x, F, z, c);
  // a street performer's chalk circle and a hat
  for (let a = 0; a < 6.283; a += 0.05) set(Math.round(352 + Math.cos(a) * 14), DECK, Math.round(316 + Math.sin(a) * 14), one(k, '#f0ece0'));
  B(351, F, 315, 353, F, 317, one(k, '#2a2a2e')); set(352, F + 1, 316, one(k, '#2a2a2e'));

  // ---------------------------------------------------------------- the 2D life: sea lions, seagulls
  const SL = [];
  for (const [x0, z0, x1, z1] of SMALL) { const n = Math.max(2, Math.round(((x1 - x0) * (z1 - z0)) / 420)); for (let i = 0; i < n; i++) SL.push([x0 + 3 + h3(x0, i, 1) * (x1 - x0 - 6), z0 + 3 + h3(z0, i, 2) * (z1 - z0 - 6), i]); }
  for (const [x, z] of [[BF[0] + 4, BF[3] - 4], [BF[2] - 6, BF[1] + 3]]) SL.push([x, z, 9]);
  for (const [x, z, i] of SL) { const r = h3(x | 0, z | 0, i); const spr = r < 0.75 ? SF.seaLie[(i + (x | 0)) % SF.seaLie.length] : SF.seaUp[(i + (z | 0)) % SF.seaUp.length]; dr.card(spr, x, FF, z, { scale: 1.25 + r * 0.3, sway: 0.15 }); }
  const gulls = [[120, 60, 300], [180, 54, 180], [60, 70, 250], [300, 90, 60], [400, 84, 150], [20, 48, 120], [220, 64, 330]];
  for (const [i, [x, y, z]] of gulls.entries()) dr.card(SF.gullFly[i % 2], x, y, z, { sway: 2.2, scale: 1.1, rot: (i % 3 - 1) * 0.15 });
  for (const [i, [x, y, z]] of [[PX0 + 2, F + 9, 170], [PX0 + 4, F + 37, 80], [BF[0] - 1, FL + 19, BF[1] - 1], [BF[2] + 1, FL + 19, BF[3] + 1], [61, FL + 15, 222], [270, F + 46, 263], [PX0 + 1, F + 9, 300]].entries()) dr.card(SF.gullStand[i % 2], x, y, z, { sway: 0.2 });

  const pal = foldPalette(v);
  const pick = devParam('shot'), vw = shots.find((s) => s.name === pick) || view;
  return {
    vox: v, mood: o.mood || 'golden', lamps, view: vw, shots, spots, arena, posterSlots, dress: dr, palette: pal,
    setup(st) {
      dr.build(st);
      for (const q of D) decal(st, q);
      for (const q of rounding) decal(st, q);
      // the carousel turns
      const g = ride.build(st); g.position.set(m(CRX + 0.5), 0, m(CRZ + 0.5));
      st.hooks.push((s2) => { g.rotation.y = -s2.time * 0.35; });
      // the Bay out to the horizon and the far shore
      if (st.scene.fog) { st.scene.fog.near = 55; st.scene.fog.far = 420; }       // golden haze over the open water
      const wc = new THREE.Color(0x2e72a0), wy = (SEA + 1) / 8 - 0.0225;          // level with the voxel water's surface
      farWater(st, { x: 28, y: wy, z: -300, w: 900, d: 600, color: wc, deep: 0x13283e });
      farWater(st, { x: 28, y: wy - 0.0001, z: 24, w: 60, d: 48, color: wc, deep: 0x13283e }).visible = false;   // (only its deep base: under the diorama's own sea)
      farWater(st, { x: -150, y: wy, z: 24, w: 300, d: 48, color: wc, deep: 0x13283e }); farWater(st, { x: 206, y: wy, z: 24, w: 300, d: 48, color: wc, deep: 0x13283e });
      backdrop(st, { x: 10, y: 1.1, z: -260, w: 520, h: 110, ppm: 5, basic: true, tint: 1.0, fog: false, draw: (g2, W, H, u) => drawBayNorth(g2, W, H, u) });
      if (devParam('scene')) console.log('pier39 tris', triCount(st), 'palette', JSON.stringify(pal));
    },
  };
}
