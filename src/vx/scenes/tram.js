// The California Street cable car, as a cutaway: the near (south) wall and the near
// half of the roof are sliced off so the camera looks straight in. A long varnished-wood
// car: open grip sections with running boards at both ends, the enclosed saloon between
// them with longitudinal slatted benches, brass grab poles, leather straps swaying from a
// brass rail, a curved ceiling with a clerestory and glass lamps, and framed ad cards
// above the windows (left blank and exported as posterSlots for the poster system).
// The gripman's station is at the front (+x): the grip lever, the brake
// levers, the bell, the fare box. Outside, the city slides past: painted layers of
// sidewalk, Victorians and the Bay scroll at different speeds (setup hooks), while the
// street under the car, uniform along the rails, gives nothing away. Day by default.
import { Fine, GLOW } from '../fine.js';
import { Kit, h3 } from '../kit.js';
import { Dress } from '../dress.js';
import { decal, loadSignFonts } from '../decals.js';
import { SIGN_TEXT } from './chinatown_parts.js';
import {
  bx, one, many, ell, line3, widePalette, foldPalette, decalSet, devParam, triCount, backdrop, posterSlot, posterFrame,
  sfSprites, SG, drawBayView, drawHillHouses, drawSidewalk,
} from './sf_parts.js';

// ---- layout (voxels, 8 per metre). x along the car (front toward +x), z toward the camera.
const SY = 1;                                  // street top voxel
const FY = 8, F = 9;                           // floor top voxel, walk height
const ST = 13;                                 // bench seat height (walk height on the seat)
const XA = 8, XB = 135;                        // car ends (dash panels)
const XR1 = 31, XS0 = 32, XS1 = 103, XF0 = 104; // rear section end, saloon bulkheads, front section start
const ZN = 14, ZS = 37, ZC = 25;               // north wall, (cut) south wall line, the roof cut (centreline)
const m = (q) => q / 8;
const yCeil = (z) => 29 + Math.round(3 * Math.sin(Math.min(1, Math.max(0, (z - ZN) / 11)) * Math.PI / 2));   // ceiling underside
const CLER = [21, 25], CY = 34;                // clerestory span (z) and its ceiling

export const shots = [
  { name: 'ride', target: [8.9, 2.5, 2.7], dist: 17.5, yaw: 8, pitch: 22 },        // the whole car from the cut-away side, looking down the hill
  { name: 'front', target: [14.4, 2.0, 3.0], dist: 7.5, yaw: 32, pitch: 16 },       // the gripman's station: lever, bell, fare box
  { name: 'back', target: [2.6, 2.0, 3.1], dist: 7.5, yaw: -32, pitch: 16 },        // the rear platform where you board
  { name: 'hub', target: [8.9, 1.5, 3.2], dist: 26, yaw: 0, pitch: 30 },            // the car and the city falling away to the Bay
  { name: 'driver', target: [14.0, 3.0, 3.2], dist: 4.2, yaw: 180, pitch: 10 },    // from the north side, onto the gripman
];
export const view = shots[0];
// actor spots: [x, z, yaw (radians, 0 faces +z = toward the camera), y (floor / seat height)]
// Bench spots (seat*, oldman, oldmanMon, kidMon, coachSeat, seatMon) stand on the seat: use the 'sit' clip for people there.
const NB = 17, SB = 34;                        // north / south bench: seat centre rows
const S = (x, z, yaw, y) => [m(x + 0.5), m(z + 0.5), yaw, m(y)];
export const spots = {
  aisle: S(64, 25, 0, F),
  door: S(19, 30, Math.PI / 2, F),             // the rear platform, by the south running board
  seat0: S(38, NB, 0, ST), seat1: S(97, NB, 0, ST), seat2: S(41, SB, Math.PI, ST), seat3: S(98, SB, Math.PI, ST),
  kidMon: S(45, NB, 0, ST),                    // dancing on the seat beside the kid
  oldman: S(61, NB, 0, ST), oldmanMon: S(67, NB, -0.3, ST),
  punk: S(60, 24, Math.PI, F), punkMon: S(51, 26, 2.36, F),
  coachSeat: S(79, SB, Math.PI, ST),
  seat: S(85, NB, 0, ST), seatMon: S(91, NB, 0, ST),
  driver: S(111, 25, -2.0, F), driverMon: S(124, 29, -Math.PI / 2, F),
  stand0: S(38, 22, 0, F), stand1: S(97, 22, 0, F), stand2: S(41, 29, Math.PI, F), stand3: S(98, 29, Math.PI, F),
};

// poster slots (metres; see sf_parts posterSlot): an ad card over each saloon window, one on the front bulkhead
const WINX = [0, 1, 2, 3, 4, 5].map((i) => XS0 + 4 + i * 11);
export const posterSlots = [
  ...WINX.map((a, i) => posterSlot('tramAd' + i, 's', a, 25, a + 8, 28, ZN, 'ad')),
  posterSlot('tramBulkhead', 'w', 20, 26, 25, 28, XS1 - 1, 'ad'),
];

export async function prepare() { await loadSignFonts('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!&$.' + SIGN_TEXT); }

export function build(o = {}) {
  const night = o.mood === 'night';
  const v = new Fine(144, 48, 64, 8); widePalette(v);
  const k = new Kit(v), dr = new Dress(k), D = [], d = decalSet(D), SP = sfSprites(), lamps = [];
  const B = (...a) => bx(k, ...a), set = (x, y, z, c) => v.set(x, y, z, c);
  // materials
  const MAR = many(k, ['#7c1a20', '#841d23', '#74181e']), CRM = many(k, ['#ecdcac', '#e4d29e']), GOLD = one(k, '#d8a838');
  const TEAK = many(k, ['#a8683a', '#b07040', '#9a6034']), TEAKD = one(k, '#6e4426'), TEAKL = one(k, '#c88a50');
  const VARN = many(k, ['#c48a52', '#b87c46', '#cc9460', '#ae7240']), RIB = one(k, '#7a4a28');
  const BRASS = many(k, ['#d8b850', '#c8a040', '#e8cc6a']), STEEL = many(k, ['#8a8e94', '#9aa0a6']), IRON = many(k, ['#26262a', '#2e2e32']);
  const ROOF = many(k, ['#4a4644', '#524e4b', '#44403e']), SLAT = many(k, ['#c08a50', '#b47e48', '#c89458']), SGAP = one(k, '#5a3a22');
  const FLOOR = many(k, ['#8a6a4a', '#94724e', '#806246']), FGAP = one(k, '#3a2a20');

  // ---------------------------------------------------------------- the street (uniform along x: it shows no motion)
  B(0, 0, 0, 143, SY, 63, (x, y, z) => (y < SY ? one(k, '#3a3a3e') : (h3(z, 3, 1) < 0.5 ? one(k, '#43454b') : one(k, '#3d3f45'))));
  for (const [r0, r1, slot] of [[21, 30, 25], [47, 56, 51]]) for (let x = 0; x < 144; x++) { set(x, SY, r0, one(k, '#a8acb2')); set(x, SY, r1, one(k, '#a8acb2')); set(x, SY, slot, one(k, '#18181c')); set(x, SY, slot + 1, one(k, '#18181c')); set(x, SY, r0 - 1, one(k, '#55565c')); set(x, SY, r1 + 1, one(k, '#55565c')); }
  for (let x = 0; x < 144; x++) for (const z of [39, 40]) set(x, SY, z, one(k, '#e6be30'));

  // ---------------------------------------------------------------- underframe, trucks, running boards
  B(XA + 1, 5, ZN, XB - 1, 7, ZS, (x, y, z) => (y === 7 ? one(k, '#3a2a22') : IRON[(x + z) & 1]));
  for (const tx of [XA + 14, XB - 14]) {                 // trucks: wheels on both rails, a frame, the grip slot shoe
    B(tx - 8, 4, 19, tx + 8, 4, 32, IRON[1]);
    for (const wx of [tx - 5, tx + 5]) for (const z of [20, 21, 30, 31]) for (let dx = -2; dx <= 2; dx++) for (let y = 2; y <= 6; y++) if (Math.hypot(dx, y - 4) <= 2.4) set(wx + dx, y, z, Math.hypot(dx, y - 4) < 0.8 ? STEEL[0] : IRON[(dx + y) & 1]);
  }
  B(XA + 50, 2, 25, XA + 52, 4, 26, IRON[0]);
  // the sill beam and maroon skirt along the cut south side; the north skirt
  B(XA + 1, 5, ZS, XB - 1, 7, ZS, (x, y) => (y === 7 ? CRM[0] : MAR[x & 1]));
  B(XA + 1, 5, ZN - 1, XB - 1, 7, ZN - 1, (x, y) => (y === 7 ? CRM[0] : MAR[x & 1]));
  // running boards along both open sections (one step below the floor)
  for (const [x0, x1] of [[XA + 1, XR1], [XF0, XB - 1]]) for (const [z0, z1] of [[ZS + 1, ZS + 2], [ZN - 3, ZN - 2]]) {
    B(x0, 6, z0, x1, 6, z1, (x, y, z) => ((x - x0) % 6 === 0 ? STEEL[0] : TEAK[(x >> 2) % 3]));
    for (let x = x0 + 3; x < x1; x += 10) B(x, 4, z0, x, 5, z1, IRON[0]);
  }

  // ---------------------------------------------------------------- the floor (wooden slats with dark gaps)
  B(XA, FY - 1, ZN, XB, FY, ZS, (x, y, z) => (y < FY ? TEAKD : (z - ZN) % 3 === 0 ? FGAP : FLOOR[Math.floor(h3(x >> 3, z, 2) * 3)]));
  // a steel threshold at each platform edge
  for (const x of [XS0 - 1, XS1 + 1]) B(x, FY, ZN + 1, x, FY, ZS, STEEL[1]);

  // ---------------------------------------------------------------- walls of the saloon (north), bulkheads
  const winX = WINX;
  B(XS0, F, ZN, XS1, 28, ZN, (x, y) => {
    if (y <= 15) return (y === 15 || y === F) ? TEAKD : ((x - XS0) % 11 === 2 || y === 12) ? TEAKD : TEAK[(x >> 1) % 3];   // wainscot panels
    if (y === 16) return TEAKL;                                                                                          // sill
    if (y >= 17 && y <= 23) return winX.some((a) => x >= a && x <= a + 8) ? 0 : TEAK[0];                                 // open windows between posts
    if (y === 24) return TEAKL;                                                                                          // header
    return TEAKD;                                                                                                        // ad band backing
  });
  // window frames: the lowered sash shows at the sill, a top sash glazing strip, brass catches
  for (const a of winX) {
    B(a, 17, ZN - 1, a + 8, 17, ZN - 1, TEAKD); B(a, 23, ZN, a + 8, 23, ZN, TEAKL);
    set(a + 4, 17, ZN + 1, BRASS[0]);
  }
  B(XS0, F, ZN - 1, XS1, 15, ZN - 1, MAR); B(XS0, 16, ZN - 1, XS1, 16, ZN - 1, GOLD); B(XS0, 24, ZN - 1, XS1, 28, ZN - 1, CRM[0]);
  // ad cards above the windows: plain cards in brass frames (the poster system fills the slots)
  for (const sl of posterSlots) if (sl.face === 's') posterFrame(k, sl, { frame: '#c8a040', back: '#f2ead8' });
  // bulkheads: a doorway on the aisle, glazed upper panels, signs over the doors
  for (const [x0, x1, outer] of [[XS0, XS0 + 1, XS0], [XS1 - 1, XS1, XS1]]) {
    B(x0, F, ZN + 1, x1, 28, ZS - 1, (x, y, z) => {
      if (z >= 20 && z <= 31 && y <= 25) return 0;                                   // the doorway
      if (z > ZC && y > 26) return 0;                                                 // cut with the roof
      if (y >= 18 && y <= 24 && (z === 16 || z === 17 || z === 34 || z === 35)) return 0;
      return y === 17 || y === 25 ? TEAKL : (z - ZN) % 4 === 0 ? TEAKD : TEAK[(y >> 1) % 3];
    });
    B(x0, 26, 20, x1, 28, 25, TEAKD);
    const face = outer === XS0 ? 'W' : 'E';
    if (face === 'W') { d.W(20, 26, 25, 28, XS0, SG.routeMap(), { ppm: 160 }); d.E(20, 26, 25, 28, XS0 + 1, SG.rules(), { ppm: 160 }); }
    else { d.E(20, 26, 25, 28, XS1, SG.routeMap(), { ppm: 160 }); posterFrame(k, posterSlots[6], { frame: '#c8a040', back: '#f2ead8' }); }
  }

  // ---------------------------------------------------------------- the open platforms: low side panels, the end dashes
  for (const [x0, x1] of [[XA, XR1], [XF0, XB]]) {
    B(x0, F, ZN, x1, 13, ZN, (x, y) => (y === 13 ? TEAKL : y === F ? TEAKD : MAR[x & 1]));
    B(x0, F, ZN - 1, x1, 13, ZN - 1, (x, y) => (y === 13 ? GOLD : MAR[x & 1]));
  }
  for (const [x, s] of [[XA, -1], [XB, 1]]) {
    B(x, F, ZN, x, 15, ZS, (xx, y, z) => (y === 15 ? TEAKL : y === 14 ? GOLD : MAR[z & 1]));
    B(x + s, F, ZN + 1, x + s, 12, ZS - 1, MAR[2]);
    for (const z of [24, 25, 26, 27]) set(x + s * 2, 12, z, z === 25 || z === 26 ? (night ? one(k, '#fff6d8', GLOW) : one(k, '#f6f0dc')) : STEEL[0]);
    B(x + s * 2, F, 17, x + s * 2, F, 34, STEEL[1]);                                  // the bumper
    d[s > 0 ? 'E' : 'W'](17, F + 1, 22, 13, x, SG.carNumber('12'), { ppm: 128, off: 0.02 });
  }

  // ---------------------------------------------------------------- benches (slatted seats, slatted backs)
  const bench = (x0, x1, north) => {
    const z0 = north ? ZN + 1 : ZS - 4, z1 = north ? ZN + 4 : ZS - 1, front = north ? z1 : z0, backZ = north ? ZN + 1 : ZS - 1;
    B(x0, F, front, x1, ST - 2, front, (x, y) => ((x - x0) % 8 === 0 ? TEAKD : TEAK[(y + x) % 3]));                         // the apron
    B(x0, ST - 1, z0, x1, ST - 1, z1, (x, y, z) => ((z + (north ? 0 : 1)) % 2 === 0 ? SLAT[(x >> 3) % 3] : SGAP));            // seat slats
    B(x0, ST - 1, front, x1, ST - 1, front, TEAKL);
    if (north) {                                                                    // (the south backrests went with the cut wall)
      B(x0, ST, backZ, x1, 17, backZ, (x, y) => ((y - ST) % 2 === 0 ? SLAT[(x >> 3) % 3] : SGAP));
      B(x0, 17, backZ, x1, 17, backZ, TEAKL);
    } else B(x0, ST - 1, ZS - 1, x1, ST - 1, ZS - 1, TEAKD);
    for (const ex of [x0, x1]) B(ex, ST - 1, z0, ex, ST + 2, z1, TEAKD);             // arm ends
  };
  bench(XS0 + 2, XS1 - 2, true); bench(XS0 + 2, XS1 - 2, false);
  bench(XA + 2, XR1 - 1, true); bench(XA + 2, XR1 - 6, false);
  bench(XF0 + 4, XB - 2, true); bench(XF0 + 9, XB - 2, false);

  // ---------------------------------------------------------------- the roof: the far half, a curved varnished ceiling and a clerestory
  for (let x = XA - 1; x <= XB + 1; x++) for (let z = ZN - 2; z <= ZC; z++) {
    const end = x < XA + 1 || x > XB - 1, inside = z >= ZN + 1;
    let y0 = inside ? yCeil(z) : 29;
    if (z >= CLER[0] && z <= CLER[1] && x > XA + 4 && x < XB - 4) y0 = CY;
    const top = y0 + 1 + (z <= ZN - 1 ? 0 : 1);
    for (let y = y0; y <= top; y++) set(x, y, z, y === top ? ROOF[(x + z) % 3] : end ? TEAKD : (x - XA) % 9 === 0 ? RIB : VARN[(z + (x >> 4)) % 4]);
    if (z >= CLER[0] && z <= CLER[1] && x > XA + 4 && x < XB - 4) for (let y = yCeil(z); y < CY; y++) if (z === CLER[0]) set(x, y, z, (y === CY - 2 || y === CY - 1) && (x % 6) > 1 ? (night ? one(k, '#ffe2a2', GLOW) : one(k, '#f0e2b8')) : TEAKD);
  }
  // the clerestory's outside wall and the roof edge trim
  for (let x = XA + 5; x < XB - 4; x++) { set(x, CY + 2, CLER[0] - 1, ROOF[1]); for (let y = yCeil(CLER[0] - 1) + 2; y <= CY + 1; y++) set(x, y, CLER[0] - 1, y === CY && (x % 6) > 1 ? one(k, '#3a4a64') : CRM[1]); }
  for (let x = XA - 1; x <= XB + 1; x++) set(x, 29, ZN - 2, GOLD);
  // ceiling ribs hang a little lower over the saloon; brass strap rail; lamps on the clerestory edge
  for (let x = XS0 + 2; x < XS1; x += 9) for (let z = ZN + 1; z < CLER[0]; z++) set(x, yCeil(z) - 1, z, RIB);
  B(XA + 2, 30, 21, XB - 2, 30, 21, BRASS[0]);
  for (let x = XA + 2; x < XB - 2; x += 12) set(x, 31, 21, BRASS[1]);
  const LAMP = night ? one(k, '#fff0c8', GLOW) : one(k, '#fbf2dc'), LAMP2 = night ? one(k, '#ffe2a0', GLOW) : one(k, '#efe2c4');
  for (let x = XA + 10; x < XB - 8; x += 15) {             // pendant globes: a brass stem and cap, a frosted shade
    B(x, CY - 2, 23, x, CY - 1, 23, BRASS[0]); B(x - 1, CY - 3, 22, x + 1, CY - 3, 24, BRASS[1]);
    B(x - 1, CY - 5, 22, x + 1, CY - 4, 24, (xx, yy, zz) => (Math.abs(xx - x) + Math.abs(zz - 23) === 2 && yy === CY - 5 ? undefined : yy === CY - 4 ? LAMP2 : LAMP));
    lamps.push([m(x + 0.5), m(CY - 4.5), m(23.5)]);
  }
  // roof-end destination boxes
  for (const [x, s] of [[XA, -1], [XB, 1]]) { B(x + s, 31, 18, x + s, 34, 25, IRON[0]); d[s > 0 ? 'E' : 'W'](18, 31, 25, 34, x + s, SG.dest(s > 0 ? 'VAN NESS' : 'MARKET', 'CALIFORNIA'), { ppm: 128, glow: true }); }

  // ---------------------------------------------------------------- brass grab poles
  const pole = (x, z, y0, y1) => B(x, y0, z, x, y1, z, (xx, y) => BRASS[y % 4 === 0 ? 2 : 0]);
  for (const x of [XA + 1, XA + 9, XA + 17, XA + 23, XF0, XF0 + 8, XF0 + 16, XF0 + 24, XB - 1]) pole(x, ZN, 14, yCeil(ZN) - 1);   // the open sides
  for (const x of [XS0 + 2, XS0 + 24, XS0 + 47, XS1 - 2]) pole(x, ZN + 5, ST, yCeil(ZN + 5) - 1);                                 // bench-end poles (north)
  for (const x of [XS0 + 2, XS0 + 36, XS1 - 2]) { pole(x, ZS - 5, ST, 22); set(x, 23, ZS - 5, BRASS[2]); }                           // south: short, cut
  for (const x of [XR1 - 4, XF0 + 4]) pole(x, ZS - 1, F, 22);
  B(XF0 + 1, 21, ZS - 1, XF0 + 8, 21, ZS - 1, BRASS[1]); B(XA + 23, 21, ZS - 1, XR1 - 1, 21, ZS - 1, BRASS[1]);

  // ---------------------------------------------------------------- the gripman's station
  B(113, F, 23, 117, F, 28, (x, y, z) => (z === 25 || z === 26 ? IRON[0] : STEEL[(x + z) & 1]));            // the slot plate
  line3(v, [115, F, 25], [116, 19, 25], STEEL[0]); line3(v, [115, F, 26], [116, 19, 26], STEEL[1]);          // the grip lever
  B(116, 19, 25, 117, 21, 26, TEAKL); set(116, 22, 25, TEAKD);
  line3(v, [119, F, 23], [120, 16, 23], STEEL[0]); B(120, 16, 23, 120, 17, 23, one(k, '#c8302c'));           // track brake
  line3(v, [119, F, 28], [119, 15, 28], STEEL[0]); B(119, 15, 28, 120, 16, 28, one(k, '#2a2a2e'));           // wheel brake
  B(112, F, 24, 113, F + 1, 25, STEEL[1]);                                                                   // the foot pedal
  // the bell, hung under the clerestory, with its pull cord
  ell(v, 121.5, 30.5, 23.5, 1.9, 1.7, 1.9, (x, y, z, dd) => (y < 30 ? undefined : BRASS[dd > 0.7 ? 1 : 2]));
  B(121, 32, 23, 122, 33, 24, BRASS[1]); set(121, 29, 23, BRASS[0]);
  line3(v, [121, 29, 23], [118, 22, 23], one(k, '#e8dcc0'));
  // the fare box on its post at the head of the front platform
  B(XF0 + 1, F, 16, XF0 + 2, 15, 17, STEEL[0]);
  B(XF0, 16, 15, XF0 + 3, 19, 18, (x, y, z) => (y === 19 ? STEEL[1] : y >= 17 && z > 15 && z < 18 ? one(k, '#c8dce8') : one(k, '#5a5a62')));
  set(XF0 + 1, 20, 16, BRASS[2]);
  // the conductor's brake wheel at the back
  B(XA + 3, F, 18, XA + 3, 18, 18, IRON[0]);
  for (let a = 0; a < 6.283; a += 0.3) set(XA + 3 + Math.round(Math.cos(a) * 3), 19, 18 + Math.round(Math.sin(a) * 3), IRON[1]);
  set(XA + 3, 19, 18, BRASS[0]);

  // ---------------------------------------------------------------- the car's lettering and trim (cut side, sill)
  d.S(XS0 + 6, 5, XS1 - 6, 7, ZS, SG.carBand('CALIFORNIA ST.  CABLE RAILWAY'), { ppm: 128 });
  d.S(XA + 2, 5, XR1 - 2, 7, ZS, SG.pinstripe(), { ppm: 96 }); d.S(XF0 + 2, 5, XB - 2, 7, ZS, SG.pinstripe(), { ppm: 96 });
  d.N(XS0 + 6, 25, XS1 - 6, 28, ZN - 1, SG.carBand('CALIFORNIA ST.'), { ppm: 96 });

  // ---------------------------------------------------------------- straps (cards that sway as the car rolls) and small clutter
  for (let x = XA + 4; x < XB - 3; x += 5) if (!(x > XS0 - 2 && x < XS0 + 3) && !(x > XS1 - 3 && x < XS1 + 2)) dr.card(SP.strap[(x >> 2) & 1], x + 0.5, 30, 21.6, { mode: 'fix', rot: 0, hang: true, sway: 0.55 });
  // a newspaper left on the seat, a shopping bag, a dropped fortune cookie
  B(73, ST, 16, 75, ST, 18, one(k, '#ece8dc')); set(74, ST, 17, one(k, '#3a3a3a'));
  B(99, F, 31, 101, F + 3, 32, (x, y) => (y === F + 3 ? one(k, '#c8302c') : one(k, '#e8dcc0')));
  set(56, F, 28, one(k, '#e8b860'));

  const pal = foldPalette(v);
  const pick = devParam('shot'), vw = shots.find((s) => s.name === pick) || view;
  return {
    vox: v, mood: o.mood || 'day', lamps, view: vw, shots, spots, posterSlots, dress: dr, palette: pal,
    setup(st) {
      dr.build(st);
      for (const q of D) decal(st, q);
      const cx = m((XA + XB) / 2);
      // the city outside, sliding past (the car runs toward +x, so the scenery drifts toward −x)
      // California Street tops Nob Hill here: the houses step down the slope behind and the Bay opens beyond
      backdrop(st, { x: cx, y: -31, z: -80, w: 200, h: 46, ppm: 12, wrap: true, margin: 30, scroll: 0.25, basic: true, tint: 1.0, draw: (g, W, H, u) => drawBayView(g, W, H, u, { horizon: 29 }) });
      backdrop(st, { x: cx, y: -11, z: -40, w: 110, h: 17, ppm: 24, wrap: true, margin: 12, scroll: 1.2, draw: (g, W, H, u) => drawHillHouses(g, W, H, u, { amp: 3.4 }) });
      backdrop(st, { x: cx, y: -0.15, z: -2.6, w: 48, h: 7, ppm: 64, wrap: true, margin: 8, scroll: 4.2, draw: drawSidewalk });
      // the other side of the street, for cameras that look south (the plane faces −z, so it scrolls the other way)
      backdrop(st, { x: cx, y: -1.2, z: 46, w: 90, h: 17, ppm: 24, wrap: true, margin: 12, scroll: -1.8, face: 'n', draw: (g, W, H, u) => drawHillHouses(g, W, H, u, { amp: 2, waves: 3 }) });
      backdrop(st, { x: cx, y: -0.15, z: 15, w: 48, h: 7, ppm: 40, wrap: true, margin: 8, scroll: -4.2, face: 'n', draw: drawSidewalk });
      // a gentle rock as the car rides the cable (the stage hooks run every frame)
      const W = st.world; st.hooks.push((s2) => { if (s2.world === W) W.position.y = Math.sin(s2.time * 7.3) * 0.006 + Math.sin(s2.time * 2.1) * 0.004; });
      if (devParam('scene')) console.log('tram tris', triCount(st), 'palette', JSON.stringify(pal));
    },
  };
}
