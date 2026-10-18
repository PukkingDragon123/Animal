// 金鉗武館 — the Golden Pincer martial-arts hall, a wuguan tucked into a Chinatown
// side street. A red-pillared gate with a green-glazed roof and a gold-lettered name
// board opens off the sidewalk (guarded by stone lions) into a flagstone courtyard
// with a painted sparring ring (the battle arena), bonsai, a fish jar and plum-blossom
// poles. Behind it the training hall: red columns, a deep tile roof with upturned eaves,
// a shrine with incense and oranges, calligraphy, weapon racks, wooden dummies, mats and
// a punching bag. The west veranda is the coach's office (an old computer and a phone
// charger, the notice board with the TOKONMON LEAGUE sign-up, a tea table); the east
// veranda keeps the lion-dance heads, the big drum and the gong.
// Golden hour by default; lights(true) lights the lanterns for the evening.
import { Fine, GLOW } from '../fine.js';
import { Kit, h3, noise2 } from '../kit.js';
import { Dress } from '../dress.js';
import { SPR } from '../cards.js';
import { skyline } from '../stage.js';
import { decal, loadSignFonts } from '../decals.js';
import { pagodaRoof, brackets, beam, railing, lion, ctLamp, bike, newsBoxes, trashCan, bench, SIGN_TEXT } from './chinatown_parts.js';
import {
  bx, one, many, cylY, ell, line3, shade, C, widePalette, foldPalette, decalSet, lightRig, devParam, planks, rotKit,
  woodDummy, weaponRack, drum, gong, lionHead, punchingBag, bonsai, plumPoles, fishJar, trophy, teaSet, crtMonitor, chair, deskLamp, mug, bookStack, stool,
  P2, INTERIOR_TEXT, fit, interiorSprites, groundFn,
} from './interior_parts.js';

// ---- layout (voxels, 8 per metre). x across the compound, z toward the street (camera side)
const G = 7, HF = 10, WF = 8, SWK = 6;          // walk heights: courtyard, hall floor, verandas, sidewalk
const HX0 = 30, HX1 = 177, HZB = 8, HZC = 62, HZF = 70, EAVE = 50;   // hall walls, back wall, column line, veranda edge, eave height
const CX0 = 32, CX1 = 175, CZ0 = 74, CZ1 = 157;  // courtyard
const WZ0 = 80, WZ1 = 150;                       // the two verandas (west: office, east: lion dance)
const RX = 104, RZ = 116, RR = 32;               // the sparring ring: centre and radius (4 m)
const m = (v) => v / 8;

export const shots = [
  { name: 'hub', target: [13.0, 2.7, 12.2], dist: 36.5, yaw: 0, pitch: 33 },          // the whole compound
  { name: 'gate', target: [4.3, 3.3, 20.1], dist: 10.2, yaw: 9, pitch: 7 },       // the gate from the sidewalk: name board, lions
  { name: 'hall', target: [13.0, 2.9, 5.6], dist: 13.5, yaw: 0, pitch: 9 },         // into the training hall from the courtyard
  { name: 'ring', target: [13.0, 1.0, 14.5], dist: 17, yaw: 0, pitch: 30 },         // the sparring ring
  { name: 'shrine', target: [13.0, 2.9, 1.9], dist: 7.0, yaw: 0, pitch: 6 },       // the shrine, scrolls and incense
  { name: 'desk', target: [1.15, 1.75, 13.3], dist: 5.2, yaw: 64, pitch: 13 },        // the coach's desk with the old computer
  { name: 'board', target: [0.7, 2.45, 16.1], dist: 4.7, yaw: 80, pitch: 4 },       // the notice board: TOKONMON LEAGUE sign-up
];
export const view = shots[0];
// actor spots: [x, z, yaw (radians, 0 faces +z), y (floor height)]
export const spots = {
  entrance: [m(37.5), m(145), Math.PI, m(G)],        // just inside the gate, facing the hall
  coach: [m(104), m(66.5), 0, m(HF)],
  hero: [m(104), m(82), Math.PI, m(G)],
  desk: [m(17.5), m(109.5), -Math.PI / 2, m(WF)],       // standing beside the chair at the computer
  board: [m(12.5), m(129), -Math.PI / 2, m(WF)],
  ring: [m(RX), m(RZ), 0, m(G)],
  ringA: [m(RX - 24), m(RZ), Math.PI / 2, m(G)],
  ringB: [m(RX + 24), m(RZ), -Math.PI / 2, m(G)],
  tea: [m(19.5), m(132.5), 0, m(WF + 3)],          // on a low stool at the tea table (seat height)
};
// the battle ring in the courtyard: two sides along x, camera from the street side
export const arena = { at: [m(RX), m(RZ)], r: RR / 8, axis: 'x', cam: { dist: 10, yaw: 0, pitch: 24 } };

export async function prepare() { await loadSignFonts(INTERIOR_TEXT + SIGN_TEXT); }

export function build(o = {}) {
  const v = new Fine(208, 104, 192, 8); widePalette(v);
  const k = new Kit(v), dr = new Dress(k), D = [], d = decalSet(D), SP = interiorSprites();
  const B = (...a) => bx(k, ...a);
  const set = (x, y, z, c) => v.set(x, y, z, typeof c === 'number' ? c : one(k, c));
  const R = many(k, C.red), GD = many(k, C.gold), GR = many(k, C.granite);
  const PLASTER = many(k, ['#efe9dd', '#e8e2d4', '#f2ede2']), STONE = many(k, ['#8f8b84', '#99958d', '#86827b']);
  const lanterns = [], lights = [];                // lit lanterns (voxel coords + radius in m) and evening lights

  // ---------------------------------------------------------------- ground: street, sidewalk, the compound base
  B(0, 0, 0, 207, 5, 191, 'dirt', 'hash');
  B(0, 4, 178, 207, 4, 191, 'asphalt', 'hash');
  for (let x = 0; x < 208; x++) for (let z = 178; z <= 191; z++) if (noise2(x, z, 9) > 0.7) k.set(x, 4, z, 'asphaltOld');
  for (let x = 0; x < 208; x += 1) if (x % 16 < 8) { set(x, 4, 190, '#e6be30'); set(x, 4, 191, '#e6be30'); }
  B(0, 5, 176, 207, 5, 177, 'curb', 'hash'); for (let x = 150; x <= 190; x++) set(x, 5, 177, '#b8463e');
  B(0, 5, 0, 207, 5, 160, (x, y, z) => (h3(x, z, 3) < 0.5 ? one(k, '#7a7268') : one(k, '#847c70')));
  B(0, 5, 161, 207, 5, 175, 'sidewalk', 'patch', { sc: 8 });
  for (let x = 0; x < 208; x++) for (let z = 161; z <= 175; z++) if (x % 12 === 0 || (z - 162) % 12 === 0) k.set(x, 5, z, 'seam');
  // courtyard flagstones: slabs in running bond, worn tones, a darker border course
  const PAV = many(k, ['#b4ada0', '#aca598', '#bbb4a8', '#a49d90', '#c0b9ad']), SEAM = one(k, '#8e877c'), BORD = many(k, ['#8a8478', '#948e82']);
  B(4, 6, 8, 203, 6, 160, (x, y, z) => {
    if (x < CX0 || x > CX1 || z < CZ0 || z > CZ1) return BORD[(x + z) & 1];
    const row = (z - CZ0) >> 2, off = (row & 1) * 3;
    if ((z - CZ0) % 4 === 0 || (x + off) % 6 === 0) return SEAM;
    return PAV[Math.floor((h3((x + off) / 6 | 0, row, 7) * 0.7 + noise2(x, z, 11) * 0.3) * PAV.length) % PAV.length];
  });
  B(CX0 - 1, 6, CZ0, CX0 - 1, 6, CZ1, BORD[0]); B(CX1 + 1, 6, CZ0, CX1 + 1, 6, CZ1, BORD[0]);
  // the sparring ring: a double white line, a red inner ring, start marks; worn where feet scuff it
  const RW_ = one(k, '#f0e8d4'), RRED = one(k, '#b8302a');
  for (let x = RX - RR - 1; x <= RX + RR + 1; x++) for (let z = RZ - RR - 1; z <= RZ + RR + 1; z++) {
    const dd = Math.hypot(x - RX + 0.5, z - RZ + 0.5), worn = h3(x, 5, z) < 0.1;
    if (worn) continue;
    if (dd > RR - 1.6 && dd <= RR) set(x, 6, z, RW_);
    else if (dd > RR - 4.2 && dd <= RR - 3.3) set(x, 6, z, RRED);
    else if (dd > 5.2 && dd <= 6.2) set(x, 6, z, RW_);
  }
  for (const sx of [RX - 24, RX + 23]) for (let z = RZ - 4; z <= RZ + 3; z++) if (h3(sx, 9, z) > 0.12) set(sx, 6, z, RW_);
  d.U(RX - 5, RZ - 5, RX + 4, RZ + 4, 6, P2.ringPaint(), { ppm: 32, off: 0.012 });

  // ---------------------------------------------------------------- the training hall
  // platform: granite sides, wooden floor, three steps down to the courtyard at the centre bay
  B(HX0, 7, HZB, HX1, 9, HZF, (x, y, z) => (z === HZF || x === HX0 || x === HX1 ? (y === 9 ? GR[3] : GR[(x + y + z) % 3]) : GR[1]));
  B(HX0 + 2, 9, HZB + 2, HX1 - 2, 9, HZF - 1, planks(k, ['#9a6a42', '#a2724a', '#8e6240', '#a87a50'], { seam: '#6e4a2c', len: 13, seed: 5 }));
  for (const [z, top] of [[HZF + 3, 7], [HZF + 2, 8], [HZF + 1, 9]]) B(86, 7, z, 121, top, z, (x, y) => (y === top ? GR[3] : GR[2]));
  // walls: white plaster over a granite skirting, a red dado band; lattice windows in the sides
  const wallC = (u, y) => (y < 12 ? STONE[(u + y) % 3] : y < 14 ? R[0] : y === 14 ? GD[2] : PLASTER[Math.floor(h3(u >> 2, y >> 2, 4) * 3)]);
  B(HX0, 10, HZB, HX1, 52, HZB + 1, (x, y) => wallC(x, y));
  for (const x of [HX0, HX0 + 1, HX1 - 1, HX1]) B(x, 10, HZB, x, 52, HZC - 1, (xx, y, z) => wallC(z, y));
  for (const [xa, xb] of [[HX0, HX0 + 1], [HX1 - 1, HX1]]) for (const [z0, z1] of [[16, 30], [38, 54]]) {
    B(xa, 20, z0, xb, 38, z1, (x, y, z) => ((z - z0) % 4 === 0 || (y - 20) % 4 === 0 || z === z1 || y === 38 ? one(k, '#5a2a1e') : 0));
    B(xa, 19, z0 - 1, xb, 19, z1 + 1, GD[2]); B(xa, 39, z0 - 1, xb, 39, z1 + 1, GD[2]);
  }
  // columns on stone drums, a painted beam and a gilt lattice frieze, bracket sets, the roof
  const cols = [32, 60, 89, 117, 146, 174];
  for (const x of cols) {
    cylY(v, x + 1, HZC + 1, 2.2, 10, 11, (xx, y, z, dd) => (y === 11 ? GR[3] : GR[(xx + z) & 1]));
    B(x, 12, HZC, x + 1, 45, HZC + 1, (xx, y) => (y === 14 || y === 15 || y === 43 ? GD[(y & 1)] : R[(xx + y) % 3 === 0 ? 2 : 0]));
  }
  beam(k, HX0, 44, HZC, HX1, 46, HZC + 1, 'x');
  for (let x = HX0 + 2; x < HX1 - 1; x++) { if (cols.some((c) => x >= c && x <= c + 1)) continue; for (let j = 1; j <= 3; j++) if (j === 3 || (j === 1 && x % 2 === 0) || (x - HX0) % 4 === 0) set(x, 44 - j, HZC, j === 3 ? GD[2] : GD[0]); }
  brackets(k, HX0 - 1, 47, HZC - 1, HX1 + 1, 49, HZC + 2, 'x');
  const roof = pagodaRoof(k, { x0: 22, x1: 185, z0: 0, z1: 79, y: EAVE, rise: 24, lift: 5, liftR: 14, th: 2, flare: 1.6, pearl: true });
  // a tie beam across the hall for the punching bag and the banners
  beam(k, HX0 + 2, 47, 40, HX1 - 2, 48, 41, 'x');

  // ---- inside the hall: the shrine at the back, scrolls, weapon racks, wooden dummies, mats, a punching bag
  // shrine: a red altar table with a gilt cabinet, a tablet, incense, oranges, red candles
  B(93, HF, HZB + 2, 114, HF + 6, HZB + 12, (x, y, z) => (y === HF + 6 ? one(k, '#7a1c1c') : z === HZB + 12 && (x === 93 || x === 114 || y === HF || y === HF + 5) ? one(k, '#5a1414') : z === HZB + 12 && y === HF + 3 && x % 4 === 1 ? GD[0] : R[(x + y) % 5 === 0 ? 1 : 0]));
  B(92, HF + 6, HZB + 2, 115, HF + 6, HZB + 13, one(k, '#6a1818'));
  B(97, HF + 7, HZB + 2, 110, HF + 22, HZB + 5, (x, y, z) => (y === HF + 22 || x === 97 || x === 110 ? GD[0] : y === HF + 7 ? GD[2] : z === HZB + 5 && y > HF + 8 && y < HF + 21 && x > 98 && x < 109 ? one(k, '#3a0e0e') : R[0]));
  pagodaRoof(k, { x0: 95, x1: 112, z0: HZB + 1, z1: HZB + 7, y: HF + 23, rise: 3, lift: 2, liftR: 4, th: 1, tile: C.tileR, tileD: C.tileRD, ridge: C.redD, ridgeHi: C.tileR[3], edge: C.gold[2], under: [C.red[0], C.gold[2]], figures: false });
  d.S(99, HF + 9, 108, HF + 20, HZB + 5, (p, W, H) => { p.rect(0, 0, W, H, '#3a0e0e'); p.rect(Math.round(W * 0.3), 3, Math.round(W * 0.4), H - 6, '#e8b83a'); p.rect(Math.round(W * 0.3) + 1, 4, Math.round(W * 0.4) - 2, H - 8, '#8a1a1a'); fitV(p, '武聖', Math.round(W * 0.3) + 1, 6, Math.round(W * 0.4) - 2, H - 12, '#f6d060'); }, { ppm: 40 });
  cylY(v, 103.5, HZB + 9.5, 2, HF + 7, HF + 8, (x, y) => (y === HF + 8 ? one(k, '#5a4a3a') : GD[0]));
  for (const dx of [-1, 1, 3]) { for (let y = HF + 9; y <= HF + 11; y++) set(102 + dx, y, HZB + 9, '#c8a878'); set(102 + dx, HF + 12, HZB + 9, one(k, '#ff4a1a', GLOW)); }
  for (const [x, dx] of [[94, 0], [112, 1]]) { B(x, HF + 7, HZB + 3, x + 1, HF + 10, HZB + 4, (xx, y) => (y === HF + 8 ? one(k, '#2e5a9c') : one(k, '#eef0f4'))); for (const [fx, fz] of [[0, 0], [1, 1], [0, 1], [1, 0]]) set(x + fx, HF + 11 + ((fx + fz) & 1), HZB + 3 + fz, (fx + fz) & 1 ? '#f0c030' : '#e8a020'); set(x + dx, HF + 13, HZB + 3, '#3a8a3a'); }
  for (const x of [101, 103, 105]) set(x, HF + 7, HZB + 6, '#f4f0e8');
  for (const cx of [95.5, 111.5]) for (let j = 0; j < 3; j++) cylY(v, cx, HZB + 9.5, 2 - j * 0.7, HF + 7 + j, HF + 7 + j, one(k, ['#f08a1e', '#e87a18', '#f8a030'][j]));
  for (const cx of [99, 108]) { B(cx, HF + 7, HZB + 10, cx, HF + 10, HZB + 10, R[1]); set(cx, HF + 11, HZB + 10, one(k, '#ffd040', GLOW)); }
  dr.card(SP.steam[0], 103.5, HF + 13, HZB + 9.5, { scale: 0.8, sway: 1.4 }); dr.card(SP.steam[2], 104.5, HF + 14, HZB + 9.5, { scale: 0.6, sway: 1.7 });
  // scrolls either side of the shrine, two more on the side walls
  B(76, HF + 6, HZB + 2, 83, HF + 27, HZB + 2, one(k, '#3a5a4a')); d.S(76, HF + 6, 83, HF + 27, HZB + 2, P2.scroll('武德'), { ppm: 40 });
  B(124, HF + 6, HZB + 2, 131, HF + 27, HZB + 2, one(k, '#3a5a4a')); d.S(124, HF + 6, 131, HF + 27, HZB + 2, P2.scroll('精神'), { ppm: 40 });
  d.E(32, HF + 8, 37, HF + 24, HX0 + 1, P2.scroll('忍', { mount: '#5a3a2a' }), { ppm: 40 });
  d.W(32, HF + 8, 37, HF + 24, HX1 - 1, P2.scroll('和', { mount: '#5a3a2a' }), { ppm: 40 });
  // weapon racks on the back wall
  weaponRack(k, 38, 62, HF, HZB + 2); weaponRack(k, 146, 170, HF, HZB + 2, { kinds: ['staff', 'broad', 'spear', 'staff', 'sword', 'spear'] });
  // wing-chun dummies on the left of the hall, a punching bag on the right, mats in the middle
  woodDummy(k, 50, HF, 34); woodDummy(k, 68, HF, 46);
  punchingBag(k, 152, HF, 40, 46); punchingBag(k, 165, HF, 40, 46, { col: ['#2e4a7a', '#34528a'] });
  d.U(84, 22, 123, 52, 9, P2.matTop('#2e5a9c'), { ppm: 16 });
  d.U(132, 48, 141, 57, 9, P2.matTop('#b8302a'), { ppm: 16 });
  // banners hung from the tie beam
  for (const [x, txt, col] of [[72, '武', '#b8302a'], [133, '龍', '#2e6a4a']]) D.push({ x: m(x + 0.5), y: m(31), z: m(42) + 0.02, w: m(6), h: m(15), face: 's', ppm: 40, paint: P2.banner(txt, col, '#f6d060') });

  // ---------------------------------------------------------------- the verandas (west: office; east: lion dance)
  const veranda = (side) => {
    const W = side < 0, xb0 = W ? 2 : 203, xb1 = W ? 4 : 205, xc = W ? 15 : 191;   // back wall, eave column line
    const x0 = W ? 5 : 177, x1 = W ? 31 : 202, xr = W ? 31 : 176;
    B(x0, 6, WZ0, x1, 7, WZ1, (x, y, z) => (y === 7 ? planks(k, ['#9a6a42', '#a2724a', '#8e6240'], { seam: '#6e4a2c', len: 9, along: 'z' })(x, y, z) : GR[1]));
    B(xb0, 8, WZ0 - 2, xb1, 41, WZ1 + 2, (x, y, z) => wallC(z, y));
    // a covered walk along the back wall: columns, a beam, a tiled eave sloping to the yard
    const cz = W ? [WZ0, 115, WZ1 - 1] : [WZ0, 122, WZ1 - 1];
    for (const z of cz) { B(xc, 8, z, xc + 1, 33, z + 1, (x, y) => (y === 10 || y === 31 ? GD[0] : R[(y % 4 === 0) ? 2 : 0])); cylY(v, xc + 1, z + 1, 2, 8, 8, GR[3]); }
    beam(k, xc, 33, WZ0, xc + 1, 35, WZ1, 'z');
    const T = many(k, C.tile), TD = one(k, C.tileD), EG = one(k, C.edge), UN = one(k, C.under[0]);
    for (let i = 0; i <= 18; i++) {
      const x = W ? i : 207 - i, h = 42 - Math.round(i * 0.3);
      for (let z = WZ0 - 2; z <= WZ1 + 2; z++) { const edge = i === 18, endz = z === WZ0 - 2 || z === WZ1 + 2; set(x, h - 1, z, UN); set(x, h, z, edge ? (z % 3 === 1 ? GD[0] : EG) : endz ? EG : z % 3 === 0 ? TD : T[(i + z) % 3 === 0 ? 2 : 1]); }
    }
    B(W ? 0 : 205, 43, WZ0 - 2, W ? 2 : 207, 44, WZ1 + 2, one(k, C.ridge));
    // the open terrace in front: a low red fret railing with a gap for the steps
    railing(k, { a: WZ0, b: 108, y: 8, h: 4, at: xr, axis: 'z', style: 'fret', col: C.red[0], col2: C.redD });
    railing(k, { a: 124, b: WZ1, y: 8, h: 4, at: xr, axis: 'z', style: 'fret', col: C.red[0], col2: C.redD });
    B(W ? 32 : 175, 6, 109, W ? 33 : 174, 6, 123, GR[3]);
  };
  veranda(-1); veranda(1);
  // ---- west veranda: the coach's desk with an old computer, the phone on its charger, the notice board, trophies, the tea table
  B(5, WF, 96, 10, WF + 5, 113, (x, y, z) => (y === WF + 5 ? one(k, '#8a5a36') : (z === 96 || z === 113) && x > 5 ? one(k, '#6a4428') : x === 10 && (y === WF + 2 || z === 105) ? one(k, '#5a3a24') : one(k, '#7a5032')));
  const crt = rotKit(k, 5, 107, 90);        // the monitor faces +x, into the veranda
  const cm = crtMonitor(crt, -1, WF + 6, 0, { w: 7, d: 5 });
  { const [sx0, sy0, sx1, sy1, sz] = cm.screen; const a = crt.T(sx0, sz), b = crt.T(sx1, sz); d.E(Math.min(a[1], b[1]), sy0, Math.max(a[1], b[1]), sy1, a[0], P2.crtScreen(), { ppm: 64, glow: true }); }
  B(10, WF + 6, 101, 10, WF + 6, 106, one(k, '#d8d0b8')); for (let z = 101; z <= 106; z += 2) set(10, WF + 6, z, '#b8b09a');   // keyboard
  B(9, WF + 6, 110, 10, WF + 6, 110, one(k, '#1e1e24')); d.U(9, 110, 10, 110, WF + 6, (p, W, H) => { p.rect(0, 0, W, H, '#1a1e2a'); p.rect(1, 1, W - 2, H - 2, '#3ac0e8'); p.px(W - 3, 2, '#ffd040'); }, { ppm: 48, glow: true });
  dr.wire([9.5, WF + 6.3, 110.5], [6, WF + 0.4, 112], 1.2, 0xf0ece4);
  B(6, WF, 111, 7, WF, 113, one(k, '#f0ece4')); d.U(6, 111, 7, 113, WF, P2.powerStrip(), { ppm: 48 });
  mug(k, 8, WF + 6, 98, '#c8302c'); bookStack(k, 6, WF + 6, 97, 3, 4, { w: 2, d: 2 });
  const lampAt = deskLamp(k, 7, WF + 6, 111, { dir: 1, col: '#2e6a4a' });
  const ch = chair(rotKit(k, 14, 104, 90), -2, WF, -2, { seat: '#2e5a9c' });
  // the notice board (cork in a wooden frame) and a trophy shelf
  B(5, WF + 4, 117, 5, WF + 19, 141, one(k, '#5a3a22')); d.E(118, WF + 5, 140, WF + 18, 5, P2.dojoBoard(), { ppm: 56 });
  B(5, WF + 12, 82, 7, WF + 12, 94, one(k, '#7a5032')); B(5, WF + 18, 82, 7, WF + 18, 94, one(k, '#7a5032'));
  for (const [z, hh] of [[83, 5], [86, 4], [89, 3], [92, 4]]) trophy(k, 6, WF + 13, z, hh, z === 86 ? '#c8ccd4' : C.gold[0]);
  B(5, WF + 19, 84, 5, WF + 24, 92, one(k, '#3a2a1e')); d.E(84, WF + 19, 92, WF + 24, 5, P2.photoTeam(), { ppm: 40 });
  // tea table with two low stools
  B(15, WF, 136, 23, WF + 3, 144, (x, y, z) => (y === WF + 3 ? one(k, '#5a3420') : (x === 15 || x === 23) && (z === 136 || z === 144) ? one(k, '#4a2a18') : y === WF + 2 && (x === 15 || x === 23 || z === 136 || z === 144) ? one(k, '#6a3c24') : 0));
  d.U(16, 137, 22, 143, WF + 3, P2.teaTray(), { ppm: 32 }); teaSet(k, 18, WF + 4, 139);
  stool(k, 19, WF, 132, { top: '#6a3c24', leg: '#4a2a18', h: 2 }); stool(k, 19, WF, 148, { top: '#6a3c24', leg: '#4a2a18', h: 2 });
  dr.pot(26, WF, 86, 'bamboo', '#3a6a8a', 3); dr.pot(26, WF, 146, 'fern', '#b85a3a', 4);
  // ---- east veranda: two lion-dance heads, the big drum, the gong, a costume and flags
  const lh1 = lionHead(rotKit(k, 186, 90, 270), 0, WF, 0, {});
  const lh2 = lionHead(rotKit(k, 186, 107, 270), 0, WF, 0, { main: ['#2e8a4a', '#26763e'], trim: [C.gold[0], '#f4f0e8'], horn: '#e8302c' });
  const dk = rotKit(k, 187, 132, 270), dm = drum(dk, 0, WF, -3, { r: 5, depth: 6 });
  { const [a0, b0, a1, b1, zz] = dm.head; const p0 = dk.T(a0, zz), p1 = dk.T(a1, zz); d.W(Math.min(p0[1], p1[1]), b0, Math.max(p0[1], p1[1]), b1, p0[0], P2.drumHead(), { ppm: 40, off: 0.02 }); }
  gong(rotKit(k, 197, 145, 270), 0, WF, 0, { r: 4 });
  d.W(84, 20, 100, 34, 203, P2.lionCloth(), { ppm: 32 }); d.W(104, 20, 118, 34, 203, P2.lionCloth('#2e8a4a', '#f0c040'), { ppm: 32 });
  for (const [z, txt, col] of [[124, '醒獅', '#c8302c'], [138, '武', '#e8b830']]) { B(200, WF, z, 200, WF + 30, z, one(k, '#5a3a22')); D.push({ x: m(199.6), y: m(WF + 17), z: m(z + 3.5), w: m(5), h: m(12), face: 'w', ppm: 40, paint: P2.banner(txt, col, col === '#e8b830' ? '#8a1a1a' : '#f6d060') }); }

  // ---------------------------------------------------------------- courtyard: bonsai, fish jar, plum poles, a bench, lantern lines
  for (const [x, z, s] of [[40, 80, 1], [168, 80, 2], [84, 77, 3], [124, 77, 4], [40, 128, 5], [168, 100, 6]]) bonsai(k, x, G, z, s, { h: 7 + (s % 3) });
  fishJar(k, 52, G, 146, 4);
  plumPoles(k, 152, G, 132, 3, 3, 6, 3);
  bench(k, 60, G, 154, 16, {});
  dr.pot(36, G, 154, 'bamboo', '#c89a3a', 6); dr.pot(172, G, 154, 'bamboo', '#c89a3a', 7);
  // lantern lines from the hall eave to posts on the front wall
  for (const px of [72, 140]) B(px, G, 157, px + 1, G + 22, 158, one(k, '#5a3a22'));
  const string = (a, b, n, sag) => { const at = dr.wire(a, b, sag, 0x3a1e1e); for (let i = 1; i < n; i++) { if (i / n < 0.34) continue; const p = at(i / n); lanterns.push([p[0], p[1] - 1.6, p[2], 0.17]); } };
  string([60, 47, 78], [72.5, G + 22, 157.5], 7, 6); string([104, 47, 78], [72.5, G + 22, 157.5], 8, 7);
  string([104, 47, 78], [140.5, G + 22, 157.5], 8, 7); string([148, 47, 78], [140.5, G + 22, 157.5], 7, 6);
  // big lanterns between the hall columns, two at the gate, one at each veranda
  for (let i = 0; i < cols.length - 1; i++) { const x = (cols[i] + cols[i + 1] + 2) / 2; lanterns.push([x, 36.5, HZC + 1, 0.36]); dr.wire([x, 41, HZC + 1], [x, 39.4, HZC + 1], 0, 0x2a1a14); }
  for (const z of [90, 146]) for (const x of [16, 191]) { lanterns.push([x + 0.5, 28.5, z + 0.5, 0.22]); dr.wire([x + 0.5, 33, z + 0.5], [x + 0.5, 30.4, z + 0.5], 0, 0x2a1a14); }

  // ---------------------------------------------------------------- the front: low wall, the gate, lions, the street
  // a knee-high wall with a green tile coping and lattice panels
  for (const [a, b] of [[4, 11], [48, 203]]) {
    B(a, G, 158, b, G + 4, 160, (x, y, z) => (y === G ? STONE[(x + z) % 3] : PLASTER[(x + y) % 3]));
    for (let x = a + 3; x < b - 3; x += 12) B(x, G + 1, 160, x + 5, G + 3, 160, (xx, y) => ((xx + y) % 2 ? one(k, '#2e6a4a') : one(k, '#d8d2c6')));
    B(a - 1, G + 5, 157, b + 1, G + 5, 161, (x, y, z) => (z === 157 || z === 161 ? (x % 3 === 1 ? GD[0] : one(k, C.edge)) : x % 3 === 0 ? one(k, C.tileD) : many(k, C.tile)[1]));
  }
  // the gate: red pillars on stone bases, open doors, a beam, the name board, brackets, a tile roof
  B(12, 6, 157, 47, 6, 163, (x, y, z) => GR[(x + z) % 4]);
  for (const px of [12, 44]) {
    B(px - 1, G, 156, px + 4, G + 1, 161, (x, y) => (y === G + 1 ? GR[3] : GR[(x + y) & 1]));
    B(px, G + 2, 157, px + 3, 33, 160, (x, y) => (y === G + 4 || y === G + 5 || y === 30 ? GD[(y & 1)] : R[(x + y) % 3 === 0 ? 2 : 0]));
  }
  for (const [x, dir] of [[16, 1], [43, -1]]) B(x, G, 150, x, G + 21, 156, (xx, y, z) => (y === G + 21 || z === 150 || z === 156 ? one(k, '#5a1414') : ((z - 150) % 2 === 0 && (y - G) % 3 === 1) ? GD[0] : R[1]));
  beam(k, 11, 30, 157, 48, 32, 160, 'x');
  B(17, 21, 159, 42, 29, 160, one(k, '#1a1c22'));
  d.S(17, 21, 42, 29, 160, P2.nameBoard(), { ppm: 40, glow: true, glowK: 0.9 });
  d.S(12, G + 6, 15, G + 21, 160, P2.couplet('強身健體'), { ppm: 40 });
  d.S(44, G + 6, 47, G + 21, 160, P2.couplet('以武會友'), { ppm: 40 });
  brackets(k, 10, 33, 156, 49, 35, 161, 'x');
  pagodaRoof(k, { x0: 4, x1: 55, z0: 149, z1: 168, y: 36, rise: 8, lift: 4, liftR: 8, th: 2, flare: 1.5 });
  lanterns.push([13.5, 28, 164, 0.26], [46, 28, 164, 0.26]); for (const x of [13.5, 46]) dr.wire([x, 35, 164], [x, 30.2, 164], 0, 0x2a1a14);
  // stone guardian lions on the sidewalk, facing the street
  lion(rotKit(k, 3, 176, 90), 0, SWK, 0, {}); lion(rotKit(k, 49, 176, 90), 0, SWK, 0, { female: true });
  // a sandwich board on the sidewalk: classes and the League
  B(62, SWK, 166, 62, SWK + 8, 166, one(k, '#5a3a22')); B(70, SWK, 166, 70, SWK + 8, 166, one(k, '#5a3a22')); B(62, SWK + 1, 167, 70, SWK + 9, 167, one(k, '#2a2420'));
  d.S(62, SWK + 1, 70, SWK + 9, 167, (p, W, H) => { p.rect(0, 0, W, H, '#2a2e2a'); p.frame(0, 0, W, H, '#8a5a36'); fitH(p, '醒獅', 3, 3, W - 6, 11, '#f4f0e0'); p.text('KUNG FU', W / 2, 16, '#f8d860', { align: 'center', mini: true }); p.text('LION DANCE', W / 2, 22, '#f8d860', { align: 'center', mini: true }); p.text('TOKONMON', W / 2, 30, '#ff9aa8', { align: 'center', mini: true }); p.text('TRAINING', W / 2, 36, '#ff9aa8', { align: 'center', mini: true }); for (let x = 4; x < W - 4; x += 3) p.px(x, H - 5, '#e8e4d8'); }, { ppm: 40 });
  // the street: a dragon lamp, a bike, news boxes, a bin, a hydrant, a parked car
  const lampPos = ctLamp(k, 174, SWK, 169, { night: false });
  bike(k, 112, SWK, 172, '#c8302c'); newsBoxes(k, 130, SWK, 167); trashCan(k, 160, SWK, 172); k.hydrant(194, SWK, 172);
  k.car(148, 5, 178, '#e8e4da', 1);

  // ---------------------------------------------------------------- outer side walls, side yards
  for (const [xa, xb] of [[2, 4], [203, 205]]) { B(xa, G, 8, xb, G + 13, WZ0 - 3, (x, y, z) => (y === G + 13 ? one(k, C.tileD) : wallC(z, y))); B(xa, G, WZ1 + 3, xb, G + 12, 157, (x, y, z) => (y === G + 12 ? one(k, C.tileD) : wallC(z, y))); }
  for (const [x, z, s] of [[12, 74, 11], [196, 74, 12], [20, 74, 13]]) dr.pot(x, G, z, s % 2 ? 'bamboo' : 'fern', '#b85a3a', s);
  // weeds in the paving cracks along the courtyard edges and the wall foot
  dr.tufts(CX0 + 1, CZ0 + 6, CX0 + 5, CZ1 - 2, 9, [...SPR.grass, ...SPR.fern], 21, { scale: 0.7 }); dr.tufts(CX1 - 5, CZ0 + 6, CX1 - 1, CZ1 - 4, 9, [...SPR.grass, ...SPR.fern], 22, { scale: 0.7 });
  dr.tufts(80, CZ1 - 2, 148, CZ1 - 1, 7, SPR.grass, 23, { scale: 0.6 });

  const pal = foldPalette(v);
  // actors are placed with vox.top(): ignore the roofs, eaves and beams overhead (everything above 3.75 m)
  v.top = (x, z) => { for (let y = 30; y >= 0; y--) { const c = v.get(x, y, z); if (c && !(v.flag[c] & 2)) return y; } return -1; };
  const pick = devParam('shot'), vw = shots.find((s) => s.name === pick) || view;
  let rig = null;
  return {
    vox: v, mood: o.mood || 'golden', lamps: [], view: vw, shots, spots, arena, dress: dr, palette: pal, ground: groundFn(v),
    setup(st) {
      skyline(st, { x: [-20, 46], z: -40, n: 26, seed: 9 });
      dr.build(st);
      for (const q of D) decal(st, q);
      const Rg = rig = lightRig(st), M = (a) => a.map((q) => q / 8);
      Rg.lanternsLit(lanterns.map(([x, y, z, r]) => [m(x), m(y), m(z), r]));
      // evening: warm pools under the hall eave, in the verandas, at the gate, over the ring, the street lamp
      for (const x of [60, 104, 148]) Rg.point(m(x), m(38), m(66), 0xffb060, 10, 11);
      for (const x of [18, 190]) Rg.point(m(x), m(28), m(116), 0xffb060, 8, 10);
      Rg.point(m(30), m(26), m(166), 0xffa050, 8, 9);
      Rg.point(m(RX), m(30), m(RZ), 0xffc080, 7, 12);
      Rg.point(m(104), m(32), m(30), 0xffc890, 8, 12);
      Rg.point(...lampPos, 0xffe0a0, 6, 9);
      Rg.point(m(104), m(30), m(36), 0xffd8a8, 7, 16, { always: true });
      for (const x of [13, 194]) for (const z of [100, 132]) Rg.point(m(x), m(24), m(z), 0xffe0b8, 3.2, 7, { always: true });
      Rg.set(devParam('vxlights') === '1');
      if (devParam('scene')) { let tris = 0; st.world.traverse((q) => { if (q.geometry && q.geometry.index) tris += q.geometry.index.count / 3; }); console.log('dojo tris', tris, 'palette', JSON.stringify(pal), 'lanterns', lanterns.length); }
    },
    lights(on) { if (rig) rig.set(on); },
  };
}
// CJK helpers for the inline painters
function fitV(p, str, x, y, w, h, col) { fit(p, str, x, y, w, h, col, { vertical: true, font: 'serif', outline: '#4a0a0c' }); }
function fitH(p, str, x, y, w, h, col) { fit(p, str, x, y, w, h, col, { font: 'serif' }); }
