// The family apartment above Lucky Star Grocery, Chinatown — a cutaway dollhouse
// seen from the street side. Upstairs: the player's messy bedroom (rumpled bed under
// the window with a neon view, a big open wardrobe, a desk with an old laptop and
// instant noodles, band posters, laundry, comics, plushies, a skateboard, a guitar).
// Downstairs: the kitchen (wok on the stove, rice cooker, steaming pot, ladles, a
// calendar, the fridge door full of magnets), the round dining table with a lazy
// susan and wonton soup, the family altar, a fish tank, Mom's perch (she is an owl)
// and the old mop dog's basket, and the front door with shoes and bags.
// The upper floor is set back from the lower one so the dining area is open to the
// camera; both storeys are tall with thin floors. Night by default: lights(false) is
// moonlight and neon through the window, lights(true) turns on the warm bulbs.
import { Fine, GLOW } from '../fine.js';
import { Kit, h3 } from '../kit.js';
import { Dress } from '../dress.js';
import { SPR } from '../cards.js';
import { skyline } from '../stage.js';
import { decal, loadSignFonts } from '../decals.js';
import { posterDecal, poster } from '../posters.js';
import {
  bx, one, many, cylY, ell, line3, shade, widePalette, foldPalette, decalSet, lightRig, devParam, groundFn, planks, checker, brick,
  stairs, doorZ, doorX, windowZ, bed, wardrobe, garments, folded, sneaker, shoePair, laundryPile, bookStack, skateboard, guitar, plush, beanbag, backpack,
  desk, chair, stool, roundTable, counter, fridge, stove, riceCooker, sink, hood, utensils, fishTank, perch, dogBasket, sideboard, altarShelf, floorShrine,
  laptop, noodleCup, mug, deskLamp, interiorSprites, garmentSprites, P2, INTERIOR_TEXT,
} from './interior_parts.js';

// ---- layout (voxels, 8 per metre). x across the house, z toward the camera (the cut-away front)
const XL = 5, XR = 106;            // interior x
const ZB = 5;                      // first interior z (back wall z 2..4)
const ZF1 = 52, ZF2 = 30;          // front edge of the lower floor / of the upper floor slab
const F1 = 10, F2 = 36;            // walk heights: downstairs, upstairs (slab y 34..35)
const TOP = 59;                    // top of the upper walls
const m = (v) => v / 8;
const small2 = (p, str, x, y, c) => p.text(str, x, y, c, { align: 'center', mini: true });

export const shots = [
  { name: 'hub', target: [7.0, 3.45, 3.6], dist: 18.6, yaw: 0, pitch: 20 },           // the whole dollhouse
  { name: 'bedroomDark', target: [11.7, 5.55, 1.4], dist: 6.4, yaw: -10, pitch: 11 },  // the bed in the dark, neon on the quilt
  { name: 'bedroom', target: [8.4, 5.5, 2.2], dist: 10.5, yaw: 0, pitch: 14 },        // the bedroom, lights on
  { name: 'closet', target: [3.48, 5.55, 1.2], dist: 7.0, yaw: 0, pitch: 6 },          // the open wardrobe (dress-up)
  { name: 'stairs', target: [1.4, 3.5, 3.4], dist: 10.5, yaw: 32, pitch: 10 },          // the stair between the floors
  { name: 'kitchen', target: [10.7, 2.3, 1.3], dist: 7.6, yaw: 6, pitch: 9 },          // stove, wok, rice cooker, fridge
  { name: 'table', target: [6.2, 1.9, 5.0], dist: 5.0, yaw: 14, pitch: 32 },          // lunch at the round table
  { name: 'door', target: [12.0, 2.4, 5.3], dist: 7.2, yaw: -28, pitch: 12 },          // the front door, shoes and bags
];
export const view = shots[0];
// actor spots: [x, z, yaw (radians, 0 faces +z), y (floor / seat / mattress height)]
export const spots = {
  bed: [m(97), m(10.5), -Math.PI / 2, m(40)],        // lying on the mattress, head on the pillow toward +x
  wake: [m(92), m(21.5), 0, m(F2)],
  closet: [m(27.5), m(21.5), 0, m(F2)],
  stairsTop: [m(8.5), m(9), 0, m(F2)],
  stairsBottom: [m(8.5), m(47.5), Math.PI / 2, m(F1)],
  table: [m(48.5), m(40.5), 0, m(F1)],
  seatHero: [m(40.5), m(40.5), Math.PI / 2, m(14)],  // on the west stool, facing the table (seat height)
  seatMom: [m(58.5), m(40.5), -Math.PI / 2, m(18)],  // on the perch bar beside the table
  dogBed: [m(22.5), m(44.5), 0, m(13)],              // on the blanket in the basket
  door: [m(101.5), m(43.5), -Math.PI / 2, m(F1)],
};
export const floors = { lower: m(F1), upper: m(F2) };

export async function prepare() { await loadSignFonts(INTERIOR_TEXT); }

export function build(o = {}) {
  const v = new Fine(112, 64, 62, 8); widePalette(v);
  const k = new Kit(v), dr = new Dress(k), D = [], d = decalSet(D), SP = interiorSprites();
  const B = (...a) => bx(k, ...a);
  const set = (x, y, z, c) => v.set(x, y, z, typeof c === 'number' ? c : one(k, c));

  // ---------------------------------------------------------------- materials
  const BRICK = brick(k, ['#8e4638', '#9a4e3e', '#844034', '#a2563f'], '#a89a88');
  const MINT = many(k, ['#a9c9b1', '#a3c3ab', '#b0cfb7', '#9dbda5']), WAIN = many(k, ['#7a5a3e', '#84623f', '#73553a']), WAIN_D = one(k, '#563e2a');
  const DADO = one(k, '#eadfc4'), CROWN = one(k, '#efe6d2'), TILE = many(k, ['#d6dccf', '#c8d2c4']), TILE_B = one(k, '#6a9aa4');
  const BLUE = many(k, ['#8eaccb', '#89a7c6', '#93b0ce']), BLUE_S = one(k, '#7f9dbd'), SK2 = one(k, '#efe8da'), PLASTER = one(k, '#e6dfd0');
  const lowerWall = (u, y, kitchen) => {
    if (y === F1) return WAIN_D;
    if (kitchen && y >= F1 + 7 && y <= F1 + 16) return y === F1 + 7 ? TILE_B : TILE[(u + y) & 1];
    if (y < F1 + 8) return u % 3 === 0 ? WAIN_D : WAIN[(u >> 3) % 3];
    if (y === F1 + 8) return DADO;
    if (y === 33) return CROWN;
    return MINT[Math.floor(h3(u >> 1, y >> 1, 7) * 1.4 + (y > 28 ? 1.5 : 0)) % 4];
  };
  const upperWall = (u, y) => {
    if (y <= F2 + 1) return SK2;
    if (y === F2 + 20) return SK2;
    if (y > F2 + 20) return BLUE[2];
    return u % 4 === 0 ? BLUE_S : BLUE[Math.floor(h3(u >> 2, y >> 2, 3) * 2)];
  };

  // ---------------------------------------------------------------- shell: plinth (the shop's ceiling), walls, floors
  B(2, 0, 2, 109, 9, 53, BRICK);
  B(3, 1, 3, 108, 7, 52, 0);                                                        // hollow plinth
  B(3, 0, 3, 108, 0, 52, one(k, '#3a2a22'));
  B(XL, 9, ZB, XR, 9, ZF1, planks(k, ['#9a7048', '#926a44', '#a27650', '#8a6440'], { seam: '#7a5838', len: 11, wear: true }));
  B(62, 9, ZB, XR, 9, 30, checker(k, '#e8dec4', '#a9c2a6', 2));                     // kitchen linoleum
  B(XL, 8, ZB, XR, 8, ZF1, one(k, '#5a3e28'));                                       // joists under the boards
  // the cut floor edge on the plinth front: boards over joist ends
  for (let x = 2; x <= 109; x++) { set(x, 9, 53, (x % 6 === 0) ? '#5e4228' : '#a67a50'); set(x, 8, 53, x % 4 === 0 ? '#3a2a1e' : '#6a4a30'); }
  // walls: brick outside, a hollow core, painted plaster inside
  const wallX = (x0, x1, y0, y1, z0, z1, inner, innerX) => {                        // a side wall (thin in x)
    B(x0, y0, z0, x1, y1, z1, BRICK);
    B(innerX, y0, z0, innerX, y1, z1, inner);
    if (z1 - z0 > 2 && y1 - y0 > 2) B(x0 + 1, y0 + 1, z0 + 1, x0 + 1, y1 - 1, z1 - 1, 0);
  };
  wallX(2, 4, F1, 35, 2, ZF1, (x, y, z) => lowerWall(z, y, false), 4);
  wallX(107, 109, F1, 35, 2, ZF1, (x, y, z) => lowerWall(z, y, z < 28), 107);
  wallX(2, 4, 36, TOP, 2, ZF2, (x, y, z) => upperWall(z, y), 4);
  wallX(107, 109, 36, TOP, 2, ZF2, (x, y, z) => upperWall(z, y), 107);
  B(2, F1, 2, 109, TOP, 4, BRICK);
  B(5, F1, 4, 106, 35, 4, (x, y) => lowerWall(x, y, x >= 66));
  B(5, 36, 4, 106, TOP, 4, (x, y) => upperWall(x, y));
  B(5, F1 + 1, 3, 106, TOP - 1, 3, 0);
  // wall caps: the cut tops read as plaster over brick
  B(2, TOP, 2, 109, TOP, 4, (x, y, z) => (z === 4 || x === 4 || x === 107 ? PLASTER : one(k, '#7a3a2e')));
  for (const x of [2, 3, 4, 107, 108, 109]) { B(x, TOP, 2, x, TOP, ZF2, (xx, yy, z) => (xx === 4 || xx === 107 ? PLASTER : one(k, '#7a3a2e'))); B(x, 35, ZF2 + 1, x, 35, ZF1, (xx) => (xx === 4 || xx === 107 ? PLASTER : one(k, '#7a3a2e'))); }
  // the upper floor slab: boards on top, plaster ceiling below, a dark fascia on the cut edge
  B(XL, 34, ZB, XR, 34, ZF2, (x, y, z) => (z === ZF2 ? one(k, '#4e321f') : PLASTER));
  B(XL, 35, ZB, XR, 35, ZF2, planks(k, ['#b88c5c', '#b08658', '#bc9062', '#ac8254'], { seam: '#8a6440', len: 12, seed: 3 }));
  for (let x = XL; x <= XR; x++) set(x, 35, ZF2, x % 5 === 0 ? '#6a4a30' : '#c8986a');
  B(XL, 33, ZB, XR, 33, ZB, CROWN);
  B(XL, 34, 13, 12, 35, ZF2, 0);                                                     // the stairwell

  // ---------------------------------------------------------------- the stair (left wall), rising toward the back
  const st = stairs(k, { x0: XL, x1: 12, zTop: 13, y: F1, n: 13 });
  // a little cupboard door under the high end of the stair, a mop leaning beside it
  B(12, F1, 18, 12, F1 + 13, 25, (x, y, z) => (z === 18 || z === 25 || y === F1 + 13 ? one(k, '#4e321f') : one(k, '#6a4a2e')));
  set(13, F1 + 6, 23, '#d8b440');
  line3(v, [13, F1, 28], [13, F1 + 12, 26], one(k, '#c8a060')); B(13, F1, 27, 14, F1 + 1, 29, one(k, '#d8d4c8'));
  // the railing round the stairwell upstairs
  for (let z = 13; z <= ZF2; z++) { set(13, F2 + 7, z, '#4e321f'); if (z % 2 === 1) B(13, F2, z, 13, F2 + 6, z, one(k, '#5a3a24')); }
  for (const z of [13, ZF2]) B(13, F2, z, 13, F2 + 8, z, one(k, '#3e2818'));

  // ================================================================ UPSTAIRS: the bedroom
  // door to the hall at the stair landing, the light switch beside it, a clock above
  doorZ(k, { x0: 6, x1: 11, y: F2, h: 16, zw0: 2, zw1: 4, zLeaf: 3, zc: 5, leaf: ['#e8e2d4', '#e0dacb'], panel: '#c8c0b0' });
  d.S(7, F2 + 8, 10, F2 + 12, 3, P2.doorSign(), { ppm: 48 });
  set(14, F2 + 9, 5, '#ece6d8'); d.S(14, F2 + 9, 14, F2 + 9, 5, P2.switchPlate(false), { ppm: 64 });
  B(7, F2 + 19, 5, 10, F2 + 22, 5, one(k, '#5a3a22')); d.S(7, F2 + 19, 10, F2 + 22, 5, P2.clockFace(), { ppm: 48 });
  // the big wardrobe with its doors flung open
  const wd = wardrobe(k, { x0: 15, x1: 40, z0: ZB, z1: 11, y: F2, h: 19 });
  { const G = garmentSprites(); [0, 1, 3, 5, 6].forEach((gi, i) => dr.card(G[gi], 17.9 + i * 2.75, wd.rail[2] + 1, wd.rail[3] - 1.2 + (i % 2) * 0.9 + i * 0.12, { mode: 'fix', hang: true, sway: 0.1, scale: 1.3, rot: (i % 2 ? -0.18 : 0.14) })); }
  for (const [i, sy] of wd.shelves.slice(0, 2).entries()) { folded(k, wd.bay[0], wd.bay[0] + 3, sy + 1, 7, 10, 3, 10 + i); folded(k, wd.bay[0] + 5, wd.bay[1], sy + 1, 7, 10, 2 + (i % 2), 20 + i); }
  for (const [x, c] of [[17, '#c8302c'], [21, '#2e5a9c'], [25, '#f0ece4']]) { shoePair(k, x, F2 + 2, 7, c, 1, { high: x === 21 }); }
  B(17, wd.top - 2, 7, 21, wd.top - 1, 10, one(k, '#c8a070')); B(23, wd.top - 2, 7, 27, wd.top - 1, 10, one(k, '#e8e4dc'));   // boxes on the top shelf
  const sy2 = wd.shelves[2] + 1; B(32, sy2, 7, 34, sy2, 10, one(k, '#c8302c')); B(32, sy2 + 1, 7, 34, sy2 + 1, 9, one(k, '#c8302c')); B(36, sy2, 7, 38, sy2, 10, one(k, '#2e5a9c')); B(36, sy2 + 1, 7, 38, sy2 + 1, 9, one(k, '#2e5a9c'));   // caps
  d.E(wd.doorL.z0 + 2, wd.doorL.y0 + 3, wd.doorL.z1 - 2, wd.doorL.y1 - 2, wd.doorL.x, P2.mirror(), { ppm: 32 });
  d.W(wd.doorR.z0 + 2, wd.doorR.y0 + 8, wd.doorR.z1 - 4, wd.doorR.y1 - 2, wd.doorR.x, P2.photoStrip(), { ppm: 40 });
  d.W(wd.doorR.z1 - 3, wd.doorR.y0 + 3, wd.doorR.z1 - 1, wd.doorR.y0 + 6, wd.doorR.x, P2.posterMon(), { poster: poster('shrimp', { tape: false }) });
  // a scarf thrown over the right door, a cap on the left door's top
  for (let y = F2 + 12; y <= wd.top; y++) set(41, y, 18, y % 2 ? '#e8b830' : '#c8302c');
  B(39, wd.top, 17, 41, wd.top, 19, one(k, '#c8302c'));
  // the desk under a corkboard: laptop, desk lamp, noodle cups, a mug of pens, manga
  const dk = desk(k, { x0: 44, x1: 59, z0: ZB, z1: 9, y: F2 });
  const ch = chair(k, 49, F2, 11, { seat: '#2e5a9c' });
  const lt = laptop(k, 45, dk.top, ZB, { col: '#6a6e78' });
  d.S(lt.screen[0], lt.screen[1], lt.screen[2], lt.screen[3], lt.screen[4], P2.laptopScreen(), { ppm: 64, glow: true });
  const lampAt = deskLamp(k, 58, dk.top, 6, { dir: -1, col: '#e8b830' });
  for (const [x, z, c, kind] of [[52, 7, '#e8402e', 0], [54, 6, '#e8a020', 1]]) { const cu = noodleCup(k, x, dk.top, z, c); d.S(cu[0], cu[1], cu[2], cu[3], cu[4], P2.noodleLabel(c, kind), { ppm: 64 }); }
  noodleCup(k, 55, dk.top, 8, '#2e8a5a', { open: false }); noodleCup(k, 55, dk.top + 2, 8, '#e8402e', { open: false });
  mug(k, 44, dk.top, 7, '#efe6d6', { pens: true });
  bookStack(k, 51, dk.top, 5, 3, 5, { w: 2, d: 2 });
  B(44, F2 + 11, 5, 58, F2 + 17, 5, one(k, '#6a4a2e')); d.S(44, F2 + 11, 58, F2 + 17, 5, P2.corkboard(), { ppm: 40 });
  B(44, F2 + 18, 5, 58, F2 + 18, 6, one(k, '#8a6a48'));                               // a shelf of little things
  plush(k, 45, F2 + 19, 5, 'bun'); plush(k, 49, F2 + 19, 5, 'bun', { col: '#ffd0a0' }); bookStack(k, 54, F2 + 19, 5, 3, 3, { w: 3, d: 2 });
  B(61, F2, 6, 62, F2 + 2, 7, one(k, '#5a6a7a')); set(61, F2 + 3, 6, '#f4f0e4'); set(62, F2 + 3, 7, '#f4f0e4');   // waste bin, crumpled paper
  // a low bookcase of manga under two band posters, figures on top, the guitar leaning on it
  B(63, F2, ZB, 79, F2 + 9, 8, (x, y, z) => (x === 63 || x === 79 || y === F2 + 9 ? one(k, '#8a6a48') : one(k, '#3a2a1e')));
  d.S(64, F2, 78, F2 + 8, 8, P2.spines(), { ppm: 32 });
  plush(k, 65, F2 + 10, 6, 'owl'); plush(k, 75, F2 + 10, 6, 'bun'); B(69, F2 + 10, 6, 71, F2 + 13, 7, one(k, '#3ab0c8')); set(70, F2 + 14, 6, '#ff7ab0');
  d.S(64, F2 + 12, 71, F2 + 22, 4, P2.posterTofu(), { poster: poster('chickTour'), tilt: 0.02 });
  d.S(72, F2 + 12, 79, F2 + 22, 4, P2.posterDumpling(), { poster: poster('pigeons'), tilt: -0.025 });
  guitar(k, 82, F2, 6, { body: '#c87a3a' });
  // the bed under the window: patchwork quilt, two pillows, plushies, an alarm clock on the headboard
  const bd = bed(k, { x0: 85, x1: XR, z0: ZB, z1: 16, y: F2, head: 1, quilt: ['#c8423a', '#d0503e', '#b8382f'], lumps: [[93, 10, 2]] });
  d.U(bd.quilt[0], bd.quilt[1], bd.quilt[2], bd.quilt[3], bd.quilt[4], P2.quilt('#c8423a'), { ppm: 40 });
  d.S(bd.drape[0], bd.drape[1], bd.drape[2], bd.drape[3], bd.drape[4], P2.quilt('#b83a32'), { ppm: 40 });
  plush(k, 86, F2 + 5, 6, 'owl'); plush(k, 89, F2 + 5, 12, 'bun', { col: '#f8c0d0' });
  B(105, F2 + 10, 7, 106, F2 + 11, 8, one(k, '#2a2a2e')); d.S(105, F2 + 10, 106, F2 + 11, 8, P2.alarmClock(), { ppm: 64, glow: true });
  // the window with its neon view, curtains on a rod, string lights
  windowZ(k, { x0: 87, x1: 102, y0: F2 + 11, y1: F2 + 21, zw0: 2, zw1: 4, mx: 95, my: F2 + 16, frame: '#eee8dc', sillD: 0 });
  D.push({ x: m(95), y: m(F2 + 8), z: 0.06, w: m(26), h: m(14.5), face: 's', glow: true, ppm: 32, paint: P2.neonView() });
  B(84, F2 + 22, 5, 105, F2 + 22, 5, one(k, '#5a3a22'));
  for (const [a, b] of [[84, 88], [101, 105]]) B(a, F2 + 9, 5, b, F2 + 21, 5, (x, y) => ((x + (y >> 1)) % 3 === 0 ? one(k, '#e8b040') : (x % 2 ? one(k, '#2e7a6a') : one(k, '#348474'))));
  // posters on the side walls, a Tokonmon poster above the stairwell
  d.W(7, F2 + 12, 15, F2 + 21, 107, P2.posterRollers(), { poster: poster('raccoons') });
  d.E(17, F2 + 10, 25, F2 + 20, 4, P2.posterMon(), { poster: poster('league') });
  // the floor: a rug, laundry piles, sneakers, a skateboard, a beanbag, comics, a backpack
  d.U(26, 14, 81, 29, 35, P2.rug({ a: '#9a2a2a', b: '#2a4470', c: '#e8d4a8' }), { ppm: 24 });
  laundryPile(k, 45, F2, 25, 3, 3); laundryPile(k, 82, F2, 23, 3, 7);
  shoePair(k, 58, F2, 26, '#e8302c', 1, { splay: true }); shoePair(k, 68, F2, 27, '#2e5a9c', -1, { high: true });
  skateboard(k, 60, F2, 19, { len: 7 });
  beanbag(k, 73, F2, 20, 4, '#e8843a');
  bookStack(k, 77, F2, 11, 5, 9, { w: 2, d: 3 }); bookStack(k, 37, F2, 26, 3, 4, { w: 3, d: 2 });
  backpack(k, 41, F2, 13, '#2e7a5a');
  plush(k, 52, F2, 21, 'bear', { col: '#d8a868' });
  // more mess: a game console and pad by the beanbag, a basketball, a hamper, socks, paper balls, a phone on the quilt
  B(65, F2, 24, 67, F2, 25, one(k, '#2a2a30')); set(66, F2 + 1, 24, '#3ac85a'); B(63, F2, 27, 64, F2, 27, one(k, '#3a3a44'));
  dr.wire([65, F2 + 0.6, 24.5], [63.5, F2 + 0.6, 27.5], 0.4, 0x1e1e22);
  ell(v, 84, F2 + 1.2, 28.5, 1.3, 1.3, 1.3, (x, y, z) => ((x + z) % 3 === 0 ? one(k, '#3a2418') : one(k, '#e8782e')));
  B(41, F2, 20, 44, F2 + 3, 23, (x, y, z) => ((x + y + z) % 2 ? one(k, '#b88a50') : one(k, '#a87a44')));
  laundryPile(k, 42, F2 + 4, 21, 2, 11);
  for (const [x, z, c] of [[56, 22, '#f0ece4'], [47, 29, '#c8302c'], [79, 28, '#2e5a9c']]) { set(x, F2, z, c); set(x + 1, F2, z, c); }
  for (const [x, z] of [[60, 9], [62, 10], [57, 12], [80, 17]]) set(x, F2, z, '#f4f0e4');
  B(88, F2 + 5, 12, 88, F2 + 5, 13, one(k, '#1e1e24')); d.U(88, 12, 88, 13, F2 + 5, (p, W, H) => { p.rect(0, 0, W, H, '#1a1e2a'); p.rect(1, 1, W - 2, H - 2, '#3a6ae8'); p.px(2, 3, '#ffd040'); }, { ppm: 48, glow: true });
  d.E(13, F2 + 4, 23, F2 + 15, 40, P2.stickers(), { ppm: 40 });
  // the ceiling beam and the pendant lamp
  B(XL, TOP - 1, 18, XR, TOP - 1, 19, many(k, ['#7a5434', '#84593a']));
  const pend = [60.5, F2 + 12.6, 18.5];
  dr.wire([60.5, TOP - 2, 18.5], [60.5, F2 + 14.4, 18.5], 0, 0x2a2420);

  // ================================================================ DOWNSTAIRS
  // ---- the family altar over a red sideboard: fish tank, money plant, newspapers, red envelopes
  sideboard(k, 15, 37, F1, ZB, 9, { h: 7 });
  const tank = fishTank(k, 16, F1 + 8, ZB, 12, 6, 4);
  dr.card(SP.pothos, 31.5, F1 + 13, 7.5, { scale: 1, sway: 0.3 }); B(30, F1 + 8, 6, 33, F1 + 11, 9, (x, y, z) => (y === F1 + 11 ? one(k, '#4a3424') : one(k, '#c8603a')));
  B(34, F1 + 8, 5, 37, F1 + 10, 9, (x, y) => (y === F1 + 10 ? one(k, '#e8e2d2') : one(k, (y & 1) ? '#d8d2c2' : '#ece6d6')));
  d.U(34, ZB, 37, 9, F1 + 10, P2.newspaper(), { ppm: 48 });
  const alt = altarShelf(k, 18, 34, F1 + 16, ZB, 8, 7);
  d.S(19, F1 + 18, 33, F1 + 22, ZB, P2.altarBoard(), { ppm: 40 });
  d.S(36, F1 + 15, 40, F1 + 20, 4, P2.envelopes(), { ppm: 40 });
  // ---- a low cabinet with a radio and a thermos, the calendar, a family photo
  B(40, F1, ZB, 56, F1 + 4, 8, (x, y, z) => (z === 8 && (x - 40) % 8 === 0 ? one(k, '#5a3e28') : y === F1 + 4 ? one(k, '#6a4a30') : one(k, '#8a6040')));
  B(42, F1 + 5, 6, 47, F1 + 8, 7, (x, y, z) => (z === 7 && y > F1 + 5 && x > 42 && x < 47 ? one(k, (x + y) & 1 ? '#3a3a40' : '#6a6a70') : one(k, '#a8402e')));
  set(46, F1 + 9, 6, '#c8ccd4'); set(46, F1 + 10, 6, '#c8ccd4');
  cylY(v, 51, 6.5, 1.2, F1 + 5, F1 + 10, (x, y) => (y === F1 + 10 ? one(k, '#e8e4dc') : one(k, '#c8302c'))); set(51, F1 + 8, 8, '#f0d070');
  d.S(41, F1 + 12, 47, F1 + 21, 4, P2.calendar(), { ppm: 40 });
  B(49, F1 + 13, 5, 54, F1 + 18, 5, one(k, '#5a3a22')); d.S(49, F1 + 13, 54, F1 + 18, 5, P2.photoFrame(0), { ppm: 40 });
  d.S(55, F1 + 13, 56, F1 + 19, 4, P2.dayCalendar(), { ppm: 40 });
  // ---- the fridge with its magnet-covered door
  const fr = fridge(k, 58, F1, ZB, { w: 8, d: 6, h: 15 });
  d.S(58, F1 + 1, 65, F1 + 14, fr.front, P2.fridgeFront(), { ppm: 40, off: 0.02 });
  B(59, F1 + 15, 6, 61, F1 + 17, 9, one(k, '#e8c040')); B(62, F1 + 15, 7, 64, F1 + 16, 9, one(k, '#c8302c'));   // boxes on top
  // ---- the kitchen counter: sink under the window, rice cooker, the stove with wok and stockpot, ladles
  const ct = counter(k, { x0: 67, x1: XR, z0: ZB, z1: 9, y: F1, h: 7, step: 6 });
  windowZ(k, { x0: 68, x1: 78, y0: F1 + 11, y1: F1 + 19, zw0: 2, zw1: 4, mx: 73, my: F1 + 15, frame: '#efe9dc', sillD: 0 });
  D.push({ x: m(73.5), y: m(F1 + 8), z: 0.06, w: m(17), h: m(15), face: 's', glow: true, ppm: 32, paint: P2.alleyView() });
  sink(k, 69, ct.top, ZB, 8);
  const rc = riceCooker(k, 77, ct.top, ZB);
  const sv = stove(k, 85, ct.top, ZB);
  hood(k, 84, 97, F1 + 17, ZB, 9);
  utensils(k, 98, 106, F1 + 16, ZB);
  // jars, bottles, a chopping board with spring onions and a cleaver, a dish rack
  for (const [x, c] of [[99, '#2a1a10'], [100, '#2a1a10'], [102, '#c84a1e']]) { B(x, ct.top, 5, x, ct.top + 2, 5, one(k, c)); set(x, ct.top + 3, 5, x === 102 ? '#e8c040' : '#3a2a1a'); }
  B(99, ct.top, 7, 104, ct.top, 9, one(k, '#d8b884')); for (const x of [100, 101, 102]) set(x, ct.top + 1, 8, x % 2 ? '#5aa040' : '#e8f0d0'); set(103, ct.top + 1, 8, '#c8ccd4'); set(104, ct.top + 1, 8, '#c8ccd4');
  B(67, ct.top, 7, 68, ct.top + 3, 9, (x, y, z) => ((y + z) & 1 ? one(k, '#c8ccd4') : one(k, '#f0f0ea')));
  // ---- the pantry shelves on the right wall (painted goods), a mop and bucket
  B(101, F1, 11, XR, F1 + 20, 27, (x, y, z) => (z === 11 || z === 27 || y === F1 + 20 || y === F1 ? one(k, '#7a5a3c') : one(k, '#5a4430')));
  for (const y of [F1 + 6, F1 + 13]) B(100, y, 11, 100, y, 27, one(k, '#8a6a48'));
  d.W(12, F1 + 1, 26, F1 + 19, 101, P2.pantry(), { ppm: 40 });
  B(96, F1, 12, 99, F1 + 4, 15, (x, y, z) => (y === F1 + 4 ? one(k, '#e8e2d0') : one(k, '#f0f0ea')));      // rice sack
  d.S(96, F1, 99, F1 + 3, 15, P2.riceSack(), { ppm: 64 });
  cylY(v, 97.5, 29, 1.6, F1, F1 + 3, (x, y) => (y === F1 + 3 ? one(k, '#5a8ac8') : one(k, '#3a6ab0'))); line3(v, [98, F1 + 2, 29], [100, F1 + 15, 28], one(k, '#c8a060')); B(99, F1 + 15, 27, 100, F1 + 16, 28, one(k, '#e8e4d8'));
  // ---- lap cheong sausages drying on a string, steamer baskets on the fridge, a bag of bags, a wall phone
  dr.wire([98, 32.5, 12], [106.5, 32.5, 12], 0.6, 0x8a7a60);
  for (let x = 99; x <= 105; x += 2) { B(x, 29, 12, x, 31, 12, (xx, y) => one(k, y === 29 ? '#6a1e14' : ((x + y) % 3 ? '#9a2e1e' : '#b84a32'))); set(x, 32, 12, '#e8e0c8'); }
  for (let t = 0; t < 3; t++) cylY(v, 61.5, 7.5, 2.4, F1 + 15 + t * 2, F1 + 16 + t * 2, (x, y) => (y === F1 + 15 + t * 2 ? one(k, '#b8904e') : one(k, '#d4ac6c')));
  cylY(v, 61.5, 7.5, 1.6, F1 + 21, F1 + 21, one(k, '#c8a060'));
  B(57, F1 + 9, 7, 57, F1 + 12, 9, (x, y, z) => ((y + z) % 2 ? one(k, '#f4f0e8') : one(k, '#c8302c')));
  B(106, F1 + 12, 28, 106, F1 + 14, 29, one(k, '#d8d0b8')); set(105, F1 + 14, 28, '#c8c0a8'); set(105, F1 + 14, 29, '#c8c0a8'); dr.wire([105.5, F1 + 12, 28.5], [105.5, F1 + 9, 30], 1.5, 0x3a3a3e);
  // ---- shop stock in cartons by the stair, red stools stacked, a fan
  B(14, F1, 32, 18, F1 + 3, 36, (x, y, z) => (y === F1 + 3 || x === 16 ? one(k, '#b88a58') : one(k, '#c8a070'))); B(14, F1 + 4, 33, 17, F1 + 6, 36, (x, y, z) => (y === F1 + 6 ? one(k, '#d8b484') : one(k, '#c89a68')));
  d.S(14, F1, 18, F1 + 2, 36, (p, W, H) => { p.rect(0, 0, W, H, '#c8a070'); p.rect(2, 2, W - 4, H - 4, '#f4ecd8'); small2(p, 'FRAGILE', W / 2, 3, '#c8302c'); }, { ppm: 40 });
  for (let i = 0; i < 4; i++) cylY(v, 67, 50, 1.7, F1 + i * 2, F1 + i * 2 + 1, (x, y) => (y === F1 + i * 2 + 1 ? one(k, '#d8382e') : one(k, '#b82a24')));
  B(34, F1, 33, 36, F1, 35, one(k, '#3a3a40')); B(35, F1 + 1, 34, 35, F1 + 9, 34, one(k, '#8a8e98'));
  for (let dy = -3; dy <= 3; dy++) for (let dz = -3; dz <= 3; dz++) { const dd = Math.hypot(dy, dz); if (dd > 3.2) continue; set(36, F1 + 12 + dy, 34 + dz, dd > 2.4 ? '#c8ccd4' : dd < 1 ? '#3a6ac8' : ((dy + dz) & 1 ? '#e8e8ec' : '#9aa4c8')); } set(35, F1 + 12, 34, '#5a5e66');
  // ---- the dining table: lazy susan, wonton soup, a teapot, bok choy; stools; the dining pendant
  const tt = roundTable(k, 48, F1, 40, 5.6, { h: 6 });
  cylY(v, 48, 40, 3.3, tt, tt, (x, y, z, dd) => (dd > 2.6 ? one(k, '#3a2216') : one(k, '#c89a64')));
  const bowl = (x, y, z, soup = true) => { B(x, y, z, x + 2, y, z + 2, (xx, yy, zz) => ((xx === x || xx === x + 2) && (zz === z || zz === z + 2) ? undefined : one(k, '#f4f0e8'))); set(x + 1, y, z + 2, '#5a8ac8'); if (soup) d.U(x, z, x + 2, z + 2, y, (p, W, H) => { p.ell(W / 2 - 0.5, H / 2 - 0.5, W / 2, H / 2, '#f4f0e8'); p.ell(W / 2 - 0.5, H / 2 - 0.5, W / 2 - 2, H / 2 - 2, '#d8a050'); for (const [a, b] of [[0.35, 0.4], [0.62, 0.55], [0.45, 0.68]]) { p.ell(W * a, H * b, 2.4, 1.8, '#f8f0dc'); p.px(Math.round(W * a), Math.round(H * b) - 1, '#ffffff'); } for (let i = 0; i < 6; i++) p.px(Math.round(W * (0.3 + (i * 0.11) % 0.45)), Math.round(H * (0.3 + (i * 0.17) % 0.45)), '#5aa040'); }, { ppm: 64 }); };
  const ls = tt + 1;
  bowl(45, ls, 37); bowl(49, ls, 37); bowl(46, ls, 41); bowl(50, ls, 41, false);
  cylY(v, 44.5, 44.5, 1.5, tt, tt + 1, (x, y) => (y === tt + 1 ? one(k, '#9a4a2c') : one(k, '#8a3a24'))); set(44, tt + 2, 44, '#9a4a2c'); set(45, tt + 2, 45, '#6a2a18'); set(46, tt + 1, 45, '#8a3a24'); set(47, tt + 2, 45, '#8a3a24'); set(42, tt + 1, 44, '#6a2a18'); set(42, tt + 2, 45, '#6a2a18');   // clay teapot
  for (const [x, z] of [[52, 37], [44, 37], [45, 43]]) { set(x, tt, z, '#f4f0e8'); }
  B(47, ls, 40, 49, ls, 40, one(k, '#5aa040')); set(48, ls + 1, 40, '#8ad070');                     // bok choy
  d.U(49, 43, 52, 45, tt - 1, (p, W, H) => { p.line(1, H - 3, W - 3, 2, '#d8b070'); p.line(3, H - 2, W - 2, 4, '#c8a060'); p.ell(W - 6, H - 5, 3, 2, '#f4f0e8'); p.ell(W - 6, H - 5, 2, 1, '#3a2010'); }, { ppm: 48 });       // chopsticks & a soy dish
  const sH = stool(k, 40, F1, 40, { top: '#c8302c' }); stool(k, 48, F1, 32, { top: '#c8302c' }); stool(k, 47, F1, 49, { top: '#2e7a5a' });
  const pr = perch(k, 58, F1, 40, { h: 7 });
  B(48, 33, ZF2 + 1, 48, 33, 38, one(k, '#3a2a20')); set(48, 32, 38, '#3a2a20');
  const dp = [48.5, F1 + 17, 38.5];
  dr.wire([48.5, 32, 38.5], [48.5, F1 + 19.6, 38.5], 0, 0x2a2420);
  // ---- the old mop dog's basket, his bowl and a chew bone
  dogBasket(k, 22, F1, 44, 5, { blanket: ['#c8423a', '#efe4cc'], cushion: '#7a9ab8' });
  cylY(v, 30.5, 50.5, 1.4, F1, F1, one(k, '#c8ccd4')); set(30, F1 + 1, 50, '#a86a3a'); set(31, F1 + 1, 51, '#a86a3a');
  B(29, F1, 45, 31, F1, 45, one(k, '#f0ece0')); set(29, F1, 44, '#f0ece0'); set(31, F1, 46, '#f0ece0');
  // ---- the front door (right wall): upside-down 福, shoe rack, shoes, bags on hooks, the earth-god shrine
  doorX(k, { z0: 39, z1: 47, y: F1, h: 17, xw0: 107, xw1: 109, xLeaf: 108, xc: 106, leaf: ['#a8282a', '#b03030'], panel: '#7a1a1c' });
  d.W(41, F1 + 9, 45, F1 + 13, 108, P2.upsideFu(), { ppm: 48, off: 0.02 });
  B(102, F1, 31, XR, F1 + 5, 37, (x, y, z) => (y === F1 + 2 || y === F1 + 5 || z === 31 || z === 37 ? one(k, '#7a5a3c') : 0));
  for (const [z, c] of [[32, '#2e2e34'], [35, '#e8e4dc']]) { sneaker(k, 104, F1 + 3, z, c, -1); sneaker(k, 104, F1, z, z === 32 ? '#8a5a3a' : '#c8302c', -1); }
  for (const [x, z, c, dir] of [[97, 49, '#e8e4dc', -1], [100, 50, '#2e5a9c', 1], [95, 45, '#d8a0b0', -1], [99, 47, '#3a3a40', 1]]) shoePair(k, x, F1, z, c, dir, { splay: dir > 0 });
  B(98, F1, 41, 99, F1, 41, one(k, '#e8b830')); B(98, F1, 43, 99, F1, 43, one(k, '#e8b830'));      // slippers
  B(106, F1 + 18, 31, 106, F1 + 18, 37, one(k, '#4e321f'));
  const plaid = (x, y, z) => (((y >> 1) + (z >> 1)) & 1 ? (z & 1 ? one(k, '#c8302c') : one(k, '#f0ece4')) : one(k, '#2e5a9c'));
  B(104, F1 + 9, 32, 105, F1 + 16, 34, plaid); B(105, F1 + 17, 33, 105, F1 + 17, 33, one(k, '#4e321f'));     // the striped market bag
  B(105, F1 + 11, 36, 105, F1 + 17, 36, one(k, '#2e2e34')); set(104, F1 + 10, 36, '#2e2e34');                 // an umbrella
  floorShrine(k, 103, F1, 48, { w: 4, d: 4 });
  d.W(49, F1 + 2, 50, F1 + 5, 103, (p, W, H) => { p.rect(0, 0, W, H, '#c8242c'); p.frame(0, 0, W, H, '#e8b83a'); P2.envelopes()(p, W, H); }, { ppm: 40 });
  // ---- plants and odds and ends in the front room
  dr.pot(15, F1, 15, 'bamboo', '#3a6a8a', 5);
  // family pictures climbing the stair wall, a scroll at the top
  for (const [i, [z0, y0]] of [[37, F1 + 11], [30, F1 + 15], [23, F1 + 19], [16, F1 + 22]].entries()) {
    B(5, y0, z0, 5, y0 + 4, z0 + 4, one(k, i % 2 ? '#5a3a22' : '#c8962c'));
    d.E(z0, y0, z0 + 4, y0 + 4, 5, i === 3 ? P2.scroll('福', { mount: '#8a2a24' }) : P2.photoFrame(i % 2), { ppm: 40 });
  }
  B(86, F1, 48, 91, F1 + 2, 51, (x, y) => one(k, (y & 1) ? '#e8e2d2' : '#d6d0c0')); d.U(86, 48, 91, 51, F1 + 2, P2.newspaper(), { ppm: 48 });

  // ---------------------------------------------------------------- outside: drainpipe, an AC box, the shop sign
  B(1, 0, 6, 1, TOP, 6, one(k, '#6a6a70')); for (let y = 4; y < TOP; y += 8) set(1, y, 7, '#5a5a60');
  B(0, F2 + 8, 14, 1, F2 + 11, 19, (x, y, z) => (x === 0 && (z & 1) ? one(k, '#8a8a8e') : one(k, '#c8c4b8')));
  B(110, F1 - 1, 36, 111, F1 - 1, 50, one(k, '#8a8478'));                                                   // the stair landing outside
  B(8, 0, 54, 103, 8, 54, one(k, '#1e3a2a')); d.S(8, 0, 103, 8, 54, P2.shopSign(), { ppm: 48, glow: true, glowK: 0.75 });
  for (let x = 4; x <= 107; x++) { const c = Math.floor((x - 4) / 4) % 2 ? one(k, '#efe6d4') : one(k, '#2e7a4a'); for (let z = 55; z <= 57; z++) set(x, 0, z, c); }

  // ---------------------------------------------------------------- 2D layer: steam over the pot, the rice cooker and the soup
  dr.card(SP.steam[0], sv.steam[0], sv.steam[1] + 1, sv.steam[2] + 0.5, { scale: 1.1, sway: 1.6 });
  dr.card(SP.steam[1], rc[0], rc[1] + 1, rc[2] + 0.5, { scale: 0.7, sway: 1.6 });
  for (const [x, z, i] of [[46.5, 38.5, 2], [50.5, 38.5, 0], [47.5, 42.5, 1]]) dr.card(SP.steam[i], x, tt + 2, z, { scale: 0.55, sway: 1.8 });

  const pal = foldPalette(v);
  const pick = devParam('shot'), vw = shots.find((s) => s.name === pick) || view;
  let rig = null;
  return {
    vox: v, mood: o.mood || 'night', lamps: [], view: vw, shots, spots, floors, dress: dr, palette: pal, ground: groundFn(v),
    setup(st) {
      dr.build(st);
      for (const q of D) (q.poster ? posterDecal(st, q) : decal(st, q));
      const R = rig = lightRig(st), M = (a) => a.map((q) => q / 8);
      // always on: neon through the bedroom window, the laptop, the altar candles, the aquarium, a cool moon fill
      R.point(m(90), m(F2 + 15), m(6), 0xff4aa8, 8, 7.5, { always: true });
      R.point(m(100), m(F2 + 13), m(6), 0x3af0e0, 6.5, 7, { always: true });
      R.hemi(0x6a7ad8, 0x1a1830, 0.75, { always: true });
      R.point(m(48), m(dk.top + 3), m(8), 0x8ab0ff, 0.9, 2.2, { always: true });
      R.point(m(26), m(F1 + 19), m(9), 0xff3a2a, 1.6, 3, { always: true });
      R.point(...M(tank.light), 0x5ad8ff, 1.4, 2.6, { always: true });
      R.point(m(73), m(F1 + 15), m(7), 0x6a8aff, 1.2, 4, { always: true });
      R.point(m(60), m(F2 + 14), m(34), 0x5a6aff, 2.2, 9, { always: true });
      // switched: the bedroom pendant, desk lamp, string lights, kitchen tube, dining pendant + a warm fill
      R.point(...M(pend), 0xffc880, 9, 9);
      R.point(...M(lampAt), 0xffd498, 2.4, 3.2);
      R.point(m(95), m(F2 + 19), m(8), 0xffb070, 2.5, 4);
      R.point(m(84), m(29), m(17), 0xfff0d8, 2.6, 6.5);
      R.point(...M(dp), 0xffb060, 9, 6.5);
      R.point(m(24), m(28), m(30), 0xffc890, 4, 7);
      R.hemi(0xffd8a8, 0x4a3020, 0.45);
      R.bulb(...M(pend), 0.07, '#fff0c8'); R.shade(m(pend[0]), m(pend[1] + 0.9), m(pend[2]), 0.07, 0.3, 0.26, '#ffe2a8', '#8a7a5a'); R.bulb(...M(lampAt), 0.06, '#fff4d0');
      R.lantern(...M(dp), 0.28, '#e8442a', '#7a1c1a');
      R.box(m(85), m(33) + 0.04, m(14), 2.4, 0.07, 0.1, '#e8f0f4', '#9aa0a4', { k: 0.95 });
      for (let i = 0; i <= 10; i++) { const t = i / 10, x = 84.5 + t * 21, y = F2 + 21.6 - Math.sin(t * Math.PI) * 1.2; R.bulb(m(x), m(y), m(5.7), 0.035, ['#ffd27a', '#ff8ac0', '#7af0e8'][i % 3], '#4a4440'); }
      R.set(devParam('vxlights') === '1');
      if (devParam('scene')) { let tris = 0; st.world.traverse((q) => { if (q.geometry && q.geometry.index) tris += q.geometry.index.count / 3; }); console.log('apartment tris', tris, 'palette', JSON.stringify(pal)); }
    },
    lights(on) { if (rig) rig.set(on); },
  };
}
