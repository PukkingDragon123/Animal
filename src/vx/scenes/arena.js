// The street arena: a neighbourhood battle court on a lot between the backs of
// Chinatown and a freeway off-ramp. Painted rings on cracked asphalt (a big main ring
// with the League crest at its heart, two practice rings), concrete bleachers stepping
// up to a long mural wall under the overpass, a shipping-container clubhouse, chain-link
// fences hung with banners, a "BAO WOW!" food truck with picnic tables, an old CRT
// television on a scaffold for a scoreboard, string lights criss-crossing overhead,
// planters with street trees, and Telegraph Hill's houses climbing behind it all.
// Golden hour by default. Posters and the mural are left as plain framed cards and
// exported as posterSlots for the poster system.
import { Fine, GLOW } from '../fine.js';
import { Kit, h3, noise2 } from '../kit.js';
import { Dress } from '../dress.js';
import { SPR } from '../cards.js';
import { decal, loadSignFonts } from '../decals.js';
import { SIGN_TEXT } from './chinatown_parts.js';
import {
  bx, one, many, cylY, line3, widePalette, foldPalette, decalSet, devParam, triCount, backdrop, posterSlot, posterFrame,
  SG, sfSprites, drawHillside, lampPost, foodTruck, crt, planter, stringLights, crate, barrel, tyres, cone,
} from './sf_parts.js';

// ---- layout (voxels, 8 per metre). x west → east, z toward the camera (south).
const G = 8, F = 9;                                // asphalt top voxel, walk height
const CX0 = 56, CX1 = 251, CZ0 = 100, CZ1 = 237;    // the court
const RX = 168, RZ = 148, RR = 40;                 // the main ring (centre, radius 5 m)
const WZ0 = 46, WZ1 = 51, WX0 = 52, WX1 = 279, WTOP = 60;   // the mural wall
const BX0 = 96, BX1 = 240, BZF = 92;               // bleachers (front edge z)
const DZ0 = 6, DZ1 = 44, DY0 = 68, DY1 = 79;       // the freeway deck
const m = (q) => q / 8;
const S = (x, z, yaw, y = F) => [m(x + 0.5), m(z + 0.5), yaw, m(y)];

export const shots = [
  { name: 'hub', target: [20.5, 2.6, 16.5], dist: 47, yaw: 0, pitch: 30 },          // the whole lot: court, bleachers, wall, overpass, truck
  { name: 'ring', target: [21, 0.8, 18.6], dist: 15, yaw: 0, pitch: 30 },           // the main ring and the League crest
  { name: 'bleachers', target: [21, 2.6, 9.6], dist: 14, yaw: 14, pitch: 14 },      // the concrete bleachers under the mural
  { name: 'mural', target: [21, 5.4, 6.5], dist: 23, yaw: 0, pitch: 7 },            // the mural wall and the overpass
  { name: 'truck', target: [35, 2.2, 15.6], dist: 12, yaw: 18, pitch: 12 },         // BAO WOW! and the picnic tables
  { name: 'start', target: [21, 1.4, 22.5], dist: 9, yaw: 0, pitch: 16 },           // the south edge of the ring, where you stand
];
export const view = shots[0];
// actor spots: [x, z, yaw (0 faces +z, toward the camera), y]
export const spots = {
  start: S(168, 188, Math.PI),                     // the south edge of the main ring, facing in
  entry: S(96, 246, Math.PI * 0.85),               // off the south sidewalk, between the planters
  bleachers: S(168, 72, 0, G + 13),                // the middle tier, facing the ring
  ringCenter: S(168, 148, 0),
  sideA: S(140, 148, Math.PI / 2), sideA2: S(140, 160, Math.PI / 2),     // player + ally (west side of the ring)
  sideB: S(196, 148, -Math.PI / 2), sideB2: S(196, 136, -Math.PI / 2),  // foes (east side)
  coach: S(157, 185, Math.PI * 0.75), prof: S(196, 200, -Math.PI / 2),
  starters: S(168, 210, 0),                        // where the three partners line up, south of the start
  truck: S(280, 140, Math.PI), picnic0: S(268, 160, Math.PI / 2, F + 4), picnic1: S(291, 160, -Math.PI / 2, F + 4),
  scoreboard: S(250, 104, Math.PI),
};
// the battle ring: two sides along x, the camera from the south
export const arena = { at: [m(RX + 0.5), m(RZ + 0.5)], r: RR / 8, axis: 'x', cam: { dist: 10, yaw: 0, pitch: 22 } };
// poster slots (metres; see sf_parts posterSlot)
export const posterSlots = [
  posterSlot('arenaMural', 's', 100, 31, 236, 55, WZ1, 'mural'),               // 17 m × 3.1 m over the bleachers
  posterSlot('arenaBanner', 's', 58, 13, 92, 27, 100, 'banner'),               // vinyl banner on the clubhouse container
  posterSlot('arenaPoster0', 's', 242, 13, 249, 25, WZ1, 'poster'),            // wheat-paste posters at the wall's east end
  posterSlot('arenaPoster1', 's', 252, 13, 259, 25, WZ1, 'poster'),
  posterSlot('arenaColumn', 's', 300, 22, 311, 54, 31, 'mural'),               // the overpass pier beside the truck
  posterSlot('arenaPoster2', 'e', 150, 30, 158, 42, 39, 'poster'),             // on the back of the Chinatown building, by the door
];

export async function prepare() { await loadSignFonts('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!&$.·' + SIGN_TEXT + '廚房後門'); }

export function build(o = {}) {
  const night = o.mood === 'night';
  const v = new Fine(320, 96, 256, 8); widePalette(v);
  const k = new Kit(v), dr = new Dress(k), D = [], d = decalSet(D), lamps = [], glowLights = [], SF = sfSprites();
  const B = (...a) => bx(k, ...a), set = (x, y, z, c) => v.set(x, y, z, c);
  const CON = many(k, ['#a8a49c', '#b0aca4', '#9e9a92', '#b6b2aa']), CON2 = many(k, ['#8e8a84', '#96928a']), STEEL = many(k, ['#8a8e96', '#9aa0a8', '#7a7e86']);
  const conc = (x, y, z) => CON[Math.floor((noise2(x + z, y * 1.3, 7) * 0.7 + h3(x, y, z) * 0.3) * 3.99)];

  // ---------------------------------------------------------------- ground: asphalt lot, cracks and patches, a sidewalk along the south
  B(0, 0, 0, 319, G - 1, 255, 'dirt', 'hash');
  B(0, G, 0, 319, G, 255, (x, y, z) => { const n = noise2(x, z, 13); return n > 0.74 ? one(k, '#4c4d52') : n < 0.2 ? one(k, '#3a3b40') : h3(x, 3, z) < 0.5 ? one(k, '#43454a') : one(k, '#404247'); });
  for (let i = 0; i < 40; i++) { let x = Math.floor(h3(i, 1, 4) * 320), z = Math.floor(h3(i, 2, 4) * 238); for (let j = 0; j < 22; j++) { set(x, G, z, one(k, '#2a2b30')); x += h3(i, j, 5) > 0.5 ? 1 : 0; z += h3(i, j, 6) > 0.6 ? 1 : h3(i, j, 6) < 0.3 ? -1 : 0; } }
  // the court: a lighter, worn sport coat; the main ring filled with faded teal
  const COAT = many(k, ['#6c7076', '#72767c', '#666a70', '#7a7e82']), TEAL = many(k, ['#3e6c6c', '#447474', '#3a6464', '#4e7c78']);
  B(CX0, G, CZ0, CX1, G, CZ1, (x, y, z) => { const r = Math.hypot(x - RX, z - RZ), n = noise2(x, z, 9) * 0.7 + h3(x, z, 2) * 0.3; return r < RR - 1 ? TEAL[Math.floor(n * 3.99)] : COAT[Math.floor(n * 3.99)]; });
  for (const [x0, z0, w, dd] of [[70, 120, 14, 10], [214, 214, 18, 9], [120, 226, 10, 8], [266, 186, 12, 12]]) B(x0, G, z0, x0 + w, G, z0 + dd, (x, y, z) => (h3(x, z, 7) < 0.5 ? one(k, '#2e3034') : one(k, '#34363a')));
  B(0, G, 240, 319, F, 255, 'sidewalk', 'patch', { sc: 8 }); for (let x = 0; x < 320; x++) for (let z = 240; z < 256; z++) if (x % 12 === 0 || (z - 240) % 12 === 0) k.set(x, F, z, 'seam');
  B(0, G, 239, 319, F, 239, 'curb', 'hash');

  // ---------------------------------------------------------------- court paint: the main ring, practice rings, start boxes, a border
  const WH = one(k, '#e8e4d8'), WH2 = one(k, '#c8c4b8'), YL = one(k, '#e6be30'), RD = one(k, '#c8402c'), BL = one(k, '#2e5a9c');
  const paint = (x, z, c) => { if (h3(x, z, 91) < 0.1) return; set(x, G, z, c); };            // worn paint
  for (let z = RZ - RR - 2; z <= RZ + RR + 2; z++) for (let x = RX - RR - 2; x <= RX + RR + 2; x++) {
    const r = Math.hypot(x - RX, z - RZ), a = Math.atan2(z - RZ, x - RX);
    if (r <= RR && r > RR - 2) paint(x, z, WH); else if (r <= RR - 4 && r > RR - 5 && (Math.floor(((a + Math.PI) / (Math.PI * 2)) * 48) & 1)) paint(x, z, WH2);
    else if (r <= 12 && r > 11) paint(x, z, YL);
    else if (Math.abs(x - RX) <= 0.5 && r < RR - 6 && r > 13) paint(x, z, WH2);
  }
  for (const sx of [RX - 30, RX + 26]) { for (let z = RZ - 8; z <= RZ + 8; z++) for (let x = sx; x <= sx + 4; x++) if (z === RZ - 8 || z === RZ + 8 || x === sx || x === sx + 4) paint(x, z, sx < RX ? RD : BL); }
  for (const [cx, cz, r, c] of [[94, 128, 20, YL], [96, 206, 16, WH2]]) for (let z = cz - r; z <= cz + r; z++) for (let x = cx - r; x <= cx + r; x++) { const q = Math.hypot(x - cx, z - cz); if (q <= r && q > r - 1.2) paint(x, z, c); }
  for (let x = CX0; x <= CX1; x++) for (const z of [CZ0, CZ1]) paint(x, z, YL);
  for (let z = CZ0; z <= CZ1; z++) for (const x of [CX0, CX1]) paint(x, z, YL);
  d.U(RX - 11, RZ - 11, RX + 10, RZ + 10, G, SG.emblemFloor(), { ppm: 96, off: 0.012 });

  // ---------------------------------------------------------------- the freeway off-ramp overhead: piers, bent caps, deck, barriers, lamps
  for (const px of [26, 140, 254, 300]) {
    B(px, F, 18, px + 13, 61, 31, (x, y, z) => ((y - F) % 12 === 0 && (z === 31 || x === px || x === px + 13) ? CON2[0] : conc(x, y, z)));
    B(px - 10, 62, 12, px + 23, DY0 - 1, 36, (x, y, z) => (y === 62 ? CON2[1] : conc(x, y, z)));
  }
  B(0, DY0, DZ0, 319, DY1, DZ1, (x, y, z) => (z === DZ1 && (y === DY0 || y === DY1) ? CON2[0] : y >= DY1 - 2 ? one(k, '#5a5a5e') : conc(x, y, z)));
  for (let x = 0; x < 320; x += 16) B(x, DY0 - 3, DZ0 + 2, x + 1, DY0 - 1, DZ1 - 2, CON2[1]);                 // girders peeking under the deck
  B(0, DY1 + 1, DZ1 - 4, 319, DY1 + 6, DZ1, (x, y, z) => (y === DY1 + 6 ? CON2[1] : conc(x, y, z)));         // jersey barrier
  B(0, DY1 + 1, DZ0, 319, DY1 + 6, DZ0 + 3, conc);
  for (let x = 0; x < 320; x++) if (x % 24 < 12) set(x, DY1, 24, one(k, '#e8e4d8'));
  for (const lx of [70, 230]) { B(lx, DY1 + 7, DZ1 - 2, lx + 1, 92, DZ1 - 1, STEEL[0]); B(lx - 6, 92, DZ1 - 2, lx + 1, 93, DZ1 - 1, STEEL[1]); B(lx - 7, 91, DZ1 - 2, lx - 4, 91, DZ1 - 1, one(k, '#f6eed8')); }
  // the big green exit sign hung on the deck fascia, and the graffiti along it
  B(250, DY0 - 1, DZ1 + 1, 289, DY1 + 3, DZ1 + 1, one(k, '#1e6a3a')); for (const x of [254, 285]) B(x, DY0 - 2, DZ1 + 1, x, DY0 - 1, DZ1 + 1, STEEL[0]);
  d.S(250, DY0 - 1, 289, DY1 + 3, DZ1 + 1, SG.roadSign(), { ppm: 96 });
  d.S(40, DY0 + 1, 236, DY1 - 1, DZ1, SG.graffiti('STREET ARENA', { cols: ['#7af0e0', '#2a9ad8'] }), { ppm: 96 });
  d.S(6, DY0 + 2, 34, DY1 - 2, DZ1, SG.tag('Rookie!', '#ff6a4a'), { ppm: 96 });

  // ---------------------------------------------------------------- the mural wall (the ramp's retaining wall) with a poster run at its east end
  B(WX0, F, WZ0, WX1, WTOP, WZ1, (x, y, z) => (y === WTOP || y === WTOP - 1 ? CON2[0] : (x - WX0) % 32 === 0 && z === WZ1 ? CON2[1] : conc(x, y, z)));
  B(WX0 - 1, WTOP + 1, WZ0 - 1, WX1 + 1, WTOP + 2, WZ1 + 1, CON2[1]);
  for (const sl of posterSlots) if (sl.vox[4] === WZ1) posterFrame(k, sl, { frame: sl.kind === 'mural' ? '#6a6a70' : false, back: sl.kind === 'mural' ? '#e8e2d6' : '#f2ecde' });
  for (const sl of posterSlots) if (sl.id.startsWith('arenaPoster') && sl.vox[4] === WZ1) { const [a0, y0, a1, y1] = sl.vox; for (let x = a0; x <= a1; x++) set(x, y1 + 1, WZ1 + 1, one(k, '#d8d2c4')); }
  d.S(WX0 + 2, 34, WX0 + 40, 42, WZ1, SG.tag('Fog City Kids', '#7af0e0'), { ppm: 96 });
  // drips and tags low on the wall where the bleachers end
  d.S(243, 28, 268, 34, WZ1, SG.tag('Toko Crew', '#f8d030'), { ppm: 96 });

  // ---------------------------------------------------------------- the bleachers: five concrete tiers, painted risers, a centre stair
  const RISER = [one(k, '#c8402c'), one(k, '#2e5a9c'), one(k, '#e6b030'), one(k, '#2e8a5a'), one(k, '#8a4a9a')];
  for (let t = 0; t < 5; t++) {
    const z1 = BZF - t * 8, z0 = z1 - 7, top = G + 4 * (t + 1);
    B(BX0, F, z0, BX1, top, z1, (x, y, z) => (z === z1 && y > top - 4 && y < top ? (h3(x >> 2, y, t) < 0.12 ? CON[0] : RISER[(t + (x >> 5)) % 5]) : y === top ? (z >= z1 - 1 ? CON2[0] : CON[(x + z) % 4]) : conc(x, y, z)));
  }
  B(BX0, F, BZF - 47, BX1, G + 20, WZ1 + 1, conc);                                                 // fill to the wall
  for (const sx of [BX0, BX1]) for (let t = 0; t < 5; t++) { const z1 = BZF - t * 8; B(sx, G + 4 * (t + 1) + 1, z1 - 7, sx, G + 4 * (t + 1) + 3, z1, STEEL[1]); }   // handrails at the ends
  // a centre aisle stair painted yellow at the nosings
  for (let t = 0; t < 5; t++) { const z1 = BZF - t * 8, top = G + 4 * (t + 1); for (let x = RX - 4; x <= RX + 3; x++) { set(x, top, z1, YL); set(x, top, z1 - 1, YL); } }
  // stuff on the bleachers: a boombox, a cooler, cups, a jacket
  B(118, G + 9, 80, 123, G + 11, 82, (x, y) => (y === G + 11 ? one(k, '#2a2a2e') : x === 119 || x === 122 ? one(k, '#8a8e96') : one(k, '#1a1a1e')));
  B(206, G + 13, 71, 212, G + 16, 75, (x, y) => (y === G + 16 ? one(k, '#f4f0e8') : one(k, '#2e7ab0')));
  for (const [x, z, t] of [[140, 89, 0], [196, 80, 1], [224, 72, 2]]) { set(x, G + 4 * (t + 1) + 1, z, one(k, '#f4f0e8')); set(x, G + 4 * (t + 1) + 2, z, one(k, '#c8302c')); }
  B(150, G + 17, 62, 155, G + 17, 66, one(k, '#3a5a8a'));

  // ---------------------------------------------------------------- the clubhouse: a shipping container with a vinyl banner on its side
  const CT = many(k, ['#2e6a8a', '#346e8e', '#2a6282']);
  B(54, F, 72, 94, F + 21, 99, (x, y, z) => ((x - 54) % 3 === 0 && (z === 99 || z === 72) ? CT[2] : y === F + 21 ? one(k, '#5a7a8a') : CT[(x + y) % 2]));
  B(55, F + 1, 73, 93, F + 20, 98, 0); B(55, F, 73, 93, F, 98, one(k, '#5a5048'));                  // hollow inside (no pinholes to the sky)
  B(94, F + 2, 76, 94, F + 19, 95, (x, y, z) => (z === 85 || z === 86 ? one(k, '#1e4e66') : (z - 76) % 3 === 0 ? CT[2] : CT[0]));     // end doors (east)
  B(95, F + 8, 84, 95, F + 12, 84, STEEL[0]); B(95, F + 8, 87, 95, F + 12, 87, STEEL[0]);
  posterFrame(k, posterSlots[1], { frame: false, back: '#f4f0e6' });
  for (const [x, y] of [[57, 13], [92, 13], [57, 27], [92, 27]]) set(x, y, 101, one(k, '#d8d8dc'));
  // on the roof: two folding chairs and potted plants
  for (const x of [62, 72]) { B(x, F + 22, 82, x + 2, F + 24, 84, one(k, '#c8402c')); B(x, F + 25, 82, x + 2, F + 27, 82, one(k, '#c8402c')); }
  dr.pot(84, F + 22, 86, 'fern', '#b85a3a', 4); dr.pot(88, F + 22, 80, 'bamboo', '#3a6a8a', 5);

  // ---------------------------------------------------------------- the back of a Chinatown building (west): brick, back door, fire escape, laundry, ducts
  const BR = many(k, ['#9a4a3c', '#a6533f', '#8e4236', '#b05c48']), MOR = one(k, '#c4b49c');
  const brick = (x, y, z) => { const r = y >> 1, u = z + x + ((r & 1) << 1); if ((y & 1) === 0 && (u & 3) === 0) return MOR; return BR[Math.floor(h3(u >> 2, r, 3) * 4)]; };
  const EX = 39;
  B(0, F, 60, EX, 62, 210, brick);
  B(4, F + 6, 64, EX - 4, 58, 206, one(k, '#7a3a2e')); B(5, F + 7, 65, EX - 5, 57, 205, 0);         // shallow hollow behind the facade
  B(0, 63, 60, EX, 66, 210, (x, y, z) => (y === 66 ? one(k, '#d8ccb4') : brick(x, y, z)));
  for (let z = 70; z < 200; z += 22) {                       // upper-floor sash windows
    const yy = F + 28;
    B(EX, yy, z, EX, yy + 12, z + 8, (x, y, zz) => (y === yy || y === yy + 12 || zz === z || zz === z + 8 || zz === z + 4 ? one(k, '#e4d8c0') : (h3(zz, y >> 2, 1) < 0.4 ? one(k, '#3c4c68') : one(k, '#2c3a54'))));
    B(EX - 1, yy + 1, z + 1, EX - 1, yy + 11, z + 7, 0); B(EX + 1, yy - 1, z - 1, EX + 1, yy - 1, z + 9, one(k, '#d8ccb4'));
  }
  for (let z = 70; z < 200; z += 22) { const yy = F + 8; if (z === 158) continue; B(EX, yy, z, EX, yy + 12, z + 8, (x, y, zz) => (y === yy || y === yy + 12 || zz === z || zz === z + 8 ? one(k, '#e4d8c0') : one(k, '#2c3a54'))); for (let zz = z; zz <= z + 8; zz += 2) for (let y = yy; y <= yy + 12; y++) set(EX + 1, y, zz, one(k, '#2a2a30')); }
  // the back door with a kitchen sign, a step, a dumpster, an exhaust duct
  B(EX, F, 160, EX, F + 18, 168, (x, y, z) => (z === 160 || z === 168 || y === F + 18 ? one(k, '#3a3a40') : one(k, '#7a1e22'))); B(EX - 1, F, 161, EX - 1, F + 17, 167, 0);
  set(EX + 1, F + 9, 166, one(k, '#c8c8cc')); B(EX + 1, F + 20, 159, EX + 2, F + 20, 169, one(k, '#5a5a60'));
  d.E(159, F + 21, 169, F + 26, EX, SG.backDoor('廚房', 'KITCHEN · NO PARKING'), { ppm: 128 });
  posterFrame(k, posterSlots[5], { frame: false, back: '#f2ecde' });
  B(EX + 1, F, 176, EX + 12, F + 10, 196, (x, y, z) => (y === F + 10 ? one(k, '#2a4a3a') : (z === 176 || z === 196) && y > F + 1 ? one(k, '#264434') : one(k, '#2e5a44')));
  for (let y = F + 30; y < 62; y++) B(EX + 1, y, 120, EX + 3, y, 123, STEEL[(y >> 1) & 1]); B(EX + 1, 62, 118, EX + 5, 65, 125, STEEL[1]);
  // a fire escape on the court side (along z): two landings joined by a stair, a drop ladder
  const IRON = many(k, ['#24242a', '#2c2c32', '#34343a']);
  for (const ly of [F + 26]) {
    B(EX + 1, ly, 92, EX + 7, ly, 136, (x, y, z) => ((x + z) % 2 === 0 || x === EX + 7 || z === 92 || z === 136 ? IRON[(x + z) % 3] : undefined));
    for (let z = 92; z <= 136; z++) { set(EX + 7, ly + 7, z, IRON[0]); set(EX + 7, ly + 4, z, IRON[1]); if ((z - 92) % 3 === 0) for (let j = 1; j < 7; j++) set(EX + 7, ly + j, z, IRON[2]); }
    for (let yy = F + 6; yy < ly; yy++) { set(EX + 6, yy, 128, IRON[0]); set(EX + 6, yy, 131, IRON[0]); if (yy % 2 === 0) { set(EX + 6, yy, 129, IRON[1]); set(EX + 6, yy, 130, IRON[1]); } }
  }
  dr.laundry([EX + 7, F + 40, 100], [EX + 26, F + 34, 100], { sag: 3, seed: 5, step: 5 });
  B(EX + 26, F, 100, EX + 26, F + 34, 100, one(k, '#6a5a4a'));
  // an AC box, a satellite dish and a water tank on the roof
  B(EX + 1, F + 30, 176, EX + 4, F + 34, 182, (x, y, z) => (x === EX + 4 && (y & 1) ? one(k, '#8a867e') : one(k, '#d6d2c6')));
  B(14, 67, 120, 26, 70, 130, one(k, '#8a7660'));
  cylY(v, 20, 125, 6, 71, 84, (x, y, z, dd, a) => ((y - 71) % 4 === 2 ? one(k, '#3a3a40') : many(k, ['#7e6a56', '#8a7660', '#6e5c4a'])[Math.floor(((a + Math.PI) / 6.283) * 30) % 3]));
  for (let j = 0; j <= 6; j++) cylY(v, 20, 125, 7 - j, 85 + (j >> 1), 85 + (j >> 1), one(k, '#6e5c4a'));

  // ---------------------------------------------------------------- chain-link fences with banners (posts, rails, a painted mesh)
  const fence = (axis, a0, a1, at, h = 24) => {
    const P = (u, y, c) => (axis === 'z' ? set(at, y, u, c) : set(u, y, at, c));
    for (let u = a0; u <= a1; u++) { if ((u - a0) % 16 === 0 || u === a1) for (let y = F; y <= F + h; y++) P(u, y, STEEL[1]); P(u, F + h, STEEL[0]); P(u, F, STEEL[2]); }
    if (axis === 'z') d.E(a0 + 1, F + 1, a1 - 1, F + h - 1, at, SG.chainLink(), { ppm: 96, off: 0 }); else d.S(a0 + 1, F + 1, a1 - 1, F + h - 1, at, SG.chainLink(), { ppm: 96, off: 0 });
  };
  fence('z', 104, 190, 52); fence('z', 214, 236, 52); fence('z', 100, 150, CX1 + 1);
  const ban = [
    [{ title: 'STREET ARENA', sub: 'Battles every Saturday · all ranks welcome', bg: '#1a2a5a', ink: '#f0c040', ink2: '#ffffff', stripe: '#e8302c' }, 'z', 112, 140, 52, 'e'],
    [{ title: 'LUCKY MOON BAKERY', sub: 'Egg tarts for the winners', bg: '#f6efe2', ink: '#c8364a', ink2: '#3a6a5a', stripe: '#e88a9c' }, 'z', 150, 178, 52, 'e'],
    [{ title: 'RESPECT YOUR PARTNER', bg: '#e8302c', ink: '#ffffff', outline: '#5a0e0e' }, 'z', 216, 234, 52, 'e'],
    [{ title: 'FOG CITY BOBA', sub: 'Grant Ave · open late', bg: '#f8d8e8', ink: '#8a3a7a', ink2: '#5a2a4a', stripe: '#8a3a7a' }, 'x', 104, 132, CX1 + 1, 'w'],
    [{ title: 'GOLDEN DRAGON', sub: 'Roast duck · banquets', bg: '#a01e22', ink: '#f6d060', ink2: '#fff0c8', stripe: '#e8b83a' }, 'x', 118, 146, CX1 + 1, 'e'],
  ];
  for (const [b, , z0, z1, x, face] of ban) { const yb = F + 8, yt = F + 18; if (face === 'e') d.E(z0, yb, z1, yt, x, SG.banner(b), { ppm: 96, off: 0.04 }); else d.W(z0, yb, z1, yt, x, SG.banner(b), { ppm: 96, off: 0.04 }); for (const z of [z0, z1]) for (const y of [yb, yt]) set(x + (face === 'e' ? 1 : -1), y, z, one(k, '#e8e8ec')); }

  // ---------------------------------------------------------------- the scoreboard: an old CRT on a scaffold tower, flood lights
  const SX = 252, SZ = 92;
  for (const [dx, dz] of [[0, 0], [14, 0], [0, 10], [14, 10]]) B(SX + dx, F, SZ + dz, SX + dx, F + 34, SZ + dz, STEEL[0]);
  for (let y = F + 6; y <= F + 34; y += 10) { B(SX, y, SZ, SX + 14, y, SZ, STEEL[1]); B(SX, y, SZ + 10, SX + 14, y, SZ + 10, STEEL[1]); B(SX, y, SZ, SX, y, SZ + 10, STEEL[1]); B(SX + 14, y, SZ, SX + 14, y, SZ + 10, STEEL[1]); }
  for (let i = 0; i < 10; i++) { line3(v, [SX, F + i * 3, SZ + 10], [SX + 14, F + i * 3 + 3, SZ + 10], STEEL[2]); }
  B(SX - 2, F + 35, SZ - 2, SX + 16, F + 35, SZ + 12, (x, y, z) => ((x + z) & 1 ? STEEL[1] : one(k, '#5a5048')));
  const tv = crt(k, SX - 3, F + 36, SZ + 11, { w: 22, h: 17, d: 16 });
  d.S(tv.x0, tv.y0, tv.x1, tv.y1, tv.z, SG.scoreboard(), { ppm: 128, glow: true });
  for (const fx of [SX - 2, SX + 15]) { B(fx, F + 35, SZ + 2, fx, F + 56, SZ + 2, STEEL[0]); B(fx - 1, F + 56, SZ + 1, fx + 2, F + 59, SZ + 4, (x, y, z) => (z === SZ + 4 ? one(k, night ? '#fff6e0' : '#f4f0e0', night ? GLOW : 0) : one(k, '#3a3a40'))); }
  lamps.push([m(SX), m(F + 58), m(SZ + 6)], [m(SX + 15), m(F + 58), m(SZ + 6)]);
  // a rules board on the scaffold's leg
  B(SX + 16, F + 10, SZ + 11, SX + 26, F + 26, SZ + 11, one(k, '#3a2a20'));
  d.S(SX + 16, F + 10, SX + 26, F + 26, SZ + 11, SG.menuBoard('ARENA RULES', ['1. Bow to your rival', '2. No humans in the ring', '3. Down = done', '4. Losers buy the bao'], { bg: '#f4eedc', frame: '#2a2a2a', title: '#c8302c', ink: '#2a2a2a', font: 'serif', chalk: false }), { ppm: 128 });

  // ---------------------------------------------------------------- the food truck, its menu, picnic tables under the lights
  const ft = foodTruck(k, 258, F - 1, 112, { body: ['#f4ecdc', '#ece4d4'], stripe: '#e8502c', stripe2: '#2e8a7a', aw: '#2e8a7a', signBg: '#2e8a7a' });
  d.S(ft.sign[0], ft.sign[1], ft.sign[2], ft.sign[3], ft.sign[4], SG.truckSign(), { ppm: 96 });
  d.S(260, F + 2, 297, F + 6, 129, SG.truckSide(), { ppm: 96 });
  d.S(293, F + 6, 298, F + 18, 129, SG.menuBoard('MENU', ['Pork bao|$4', 'Char siu bao|$4', 'Veggie bao|$3.5', 'Bubble tea|$5', 'Toko treats|$2'], { bg: '#20302a', frame: '#e8e0d0' }), { ppm: 128 });
  // steam rising from the service window
  for (const [x, i] of [[272, 0], [281, 1], [289, 2]]) dr.card(SF.steam[i], x, F + 17, 127, { scale: 0.9, sway: 1.6 });
  const picnic = (x, z) => {
    const W2 = many(k, ['#9a7448', '#8a6a42', '#a47c50']), I = one(k, '#3a3a40');
    B(x, F + 6, z, x + 20, F + 6, z + 7, (xx, y, zz) => W2[(zz >> 1) % 3]);
    for (const zz of [z - 4, z + 9]) B(x, F + 3, zz, x + 20, F + 3, zz + 2, (xx) => W2[(xx >> 3) % 3]);
    for (const xx of [x + 2, x + 18]) { line3(v, [xx, F, z - 4], [xx, F + 5, z + 3], I); line3(v, [xx, F, z + 11], [xx, F + 5, z + 4], I); }
  };
  picnic(262, 152); picnic(286, 152); picnic(274, 190);
  B(300, F, 140, 300, F + 10, 140, one(k, '#6a4a2e')); B(306, F, 140, 306, F + 10, 140, one(k, '#6a4a2e')); B(300, F + 2, 141, 306, F + 12, 141, one(k, '#20302a'));
  d.S(300, F + 2, 306, F + 12, 141, SG.menuBoard('TODAY', ['Curry bao|$5', 'Mango boba|$5', 'Win = 10% off'], { bg: '#20302a', frame: '#8a6a3a' }), { ppm: 128 });
  for (const [x, z, c] of [[310, 168, '#c8302c'], [310, 176, '#2e5a9c']]) barrel(k, x, F, z, c, 7);
  crate(k, 308, F, 186, 6, 5, 6); crate(k, 308, F + 5, 187, 5, 4, 5, '#8a6a42');

  // ---------------------------------------------------------------- poles, string lights, lamps, planters, street trees, clutter
  const pole = (x, z, h) => { B(x, F, z, x + 1, F + h, z + 1, (xx, y) => (y % 7 === 0 ? one(k, '#4a3a2a') : one(k, '#5e4a36'))); B(x - 3, F + h - 3, z, x + 4, F + h - 3, z + 1, one(k, '#4a3a2a')); return [x, F + h - 2, z]; };
  const p1 = pole(58, 234, 48), p2 = pole(282, 234, 48), p3 = pole(146, 98, 44), p4 = pole(214, 98, 44);
  const top = [SX + 7, F + 60, SZ + 6], cont = [94, F + 30, 99];
  for (const [a, b, alt] of [[p3, p1, 0], [p4, p2, 1], [cont, [168, F + 44, 236], 2], [top, [120, F + 46, 236], 3], [p3, p4, 0], [p1, p2, 1], [p2, [312, F + 30, 140], 2]]) stringLights(dr, a, b, { sag: 6, step: 6, alt });
  for (const [x, z] of [[160, 98], [200, 98]]) B(x, F, z, x + 1, F + 44, z + 1, STEEL[0]);
  lamps.push(lampPost(k, 30, F + 1, 246, { night }), lampPost(k, 300, F + 1, 246, { night }));
  // planters along the south edge with trees, flowers, ferns
  planter(k, dr, 60, 242, 84, 252, F, { tree: 'leaf', seed: 21, treeO: { h: 30, r: 20 }, list: [...SPR.fern, ...SPR.flowers], n: 6 });
  planter(k, dr, 232, 242, 256, 252, F, { tree: 'leaf', seed: 22, treeO: { h: 28, r: 19 }, list: [...SPR.fern, ...SPR.flowers], n: 6 });
  planter(k, dr, 110, 244, 130, 251, F, { list: [...SPR.flowers, ...SPR.grass], n: 8, h: 3 });
  planter(k, dr, 196, 244, 216, 251, F, { list: [...SPR.flowers, ...SPR.grass], n: 8, h: 3 });
  planter(k, dr, 6, 214, 30, 236, F, { tree: 'oak', seed: 23, treeO: { h: 24, r: 24 }, list: [...SPR.fern, ...SPR.grass], n: 5 });
  dr.pot(100, F, 96, 'bamboo', '#c8402c', 11); dr.pot(236, F, 96, 'bamboo', '#2e5a9c', 12); dr.pot(46, F, 214, 'fern', '#b85a3a', 13);
  dr.tufts(52, 100, 58, 236, 26, [...SPR.grass, ...SPR.dryGrass], 31, { scale: 0.8 });
  dr.tufts(WX0, 52, WX1, 56, 22, [...SPR.grass, ...SPR.dryGrass], 32, { scale: 0.9, maxY: F + 2 });
  // tyres, cones, a bench for the coaches, a trash can, a shopping cart
  tyres(k, 108, F, 110, 3); tyres(k, 116, F, 108, 2); cone(k, 128, F + 1, 112); cone(k, 214, F + 1, 232); cone(k, 120, F + 1, 232);
  B(196, F, 228, 226, F + 3, 231, (x, y) => (y === F + 3 ? many(k, ['#8a5a36', '#965f3a'])[(x >> 2) & 1] : (x === 196 || x === 226) ? one(k, '#2a3a32') : undefined));
  cylY(v, 270, 232, 2, F, F + 6, (x, y) => (y === F + 6 ? one(k, '#1f3329') : one(k, '#2e4a3a')));
  B(56, F + 2, 220, 64, F + 7, 226, (x, y, z) => ((x + y + z) % 2 ? one(k, '#b8bcc4') : undefined)); for (const [x, z] of [[57, 221], [63, 221], [57, 225], [63, 225]]) set(x, F, z, one(k, '#2a2a2e'));
  // a vending machine by the bleachers' east end
  B(242, F, 86, 250, F + 15, 92, (x, y, z) => (z === 92 ? one(k, '#c8241c') : one(k, '#9a1a12')));
  d.S(242, F, 250, F + 15, 92, SG.vending(), { ppm: 128 });

  const pal = foldPalette(v);
  const pick = devParam('shot'), vw = shots.find((s) => s.name === pick) || view;
  return {
    vox: v, mood: o.mood || 'golden', lamps, view: vw, shots, spots, arena, posterSlots, dress: dr, palette: pal,
    setup(st) {
      dr.build(st);
      for (const q of D) decal(st, q);
      for (const [x, y, z, col, pow, dist] of glowLights) st.lamp(x, y, z, col, pow, dist);
      // Telegraph Hill's houses climbing behind the overpass, a tower on the crest
      backdrop(st, { x: 22, y: -60, z: -42, w: 150, h: 102, ppm: 14, basic: true, tint: 0.95, draw: (g, W, H, u) => drawHillside(g, W, H, u, { towerAt: 0.58, lit: night }) });
      if (devParam('scene')) console.log('arena tris', triCount(st), 'palette', JSON.stringify(pal));
    },
  };
}
