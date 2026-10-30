// Sunset Row, the neighbourhood around the home: streets and sidewalks, rows of pastel Victorian row houses
// (canted bays, fish-scale front gables or bracketed flat cornices, door hoods, little front gardens), two
// neighbours you can visit (old Mrs. Ochoa and Tokon-mad Milo), the Corner Market, a pocket park and the
// community garden. Every façade that faces the camera (south) gets the detail; houses facing north show
// tidy backs.
import { TX } from '../../build.js';
import * as T from './tex.js';
import * as K from './kit.js';
import * as W from './lines.js';
import { PROPS } from '../../voxprops.js';

// the engine's car seeds its colour from the kind's name length, so aliases with longer names give a varied car park
const CARS = ['car'];
for (const k of ['sr_car', 'sr_carB2', 'sr_carC3x', 'sr_carD4xy', 'sr_carE5xyz']) { if (PROPS.car && !PROPS[k]) PROPS[k] = { ...PROPS.car }; if (PROPS[k]) CARS.push(k); }

const { S, rig } = K;
const sfx = (app, n, o) => { const a = app.audio; if (a && a.sfx) a.sfx(n, o); };

export function buildStreet(C, [x0, z0, x1, z1], ctx = {}) {
  streets(C);
  rows(C);
  ochoa(C);
  milo(C);
  market(C);
  park(C);
  communityGarden(C);
  furniture(C);
}

// ======================================================================== streets
function streets(C) {
  // Cypress Lane (z 126–136) and Sunset Row (z 156–166) run east–west to Van Ness; Lark Lane (x 44–54) climbs to Market Street
  C.sidewalk(0, 126, 46, 128); C.sidewalk(52, 126, 104, 128); C.street(0, 128, 104, 134, { dir: 'x' }); C.sidewalk(0, 134, 46, 136); C.sidewalk(52, 134, 104, 136);
  C.sidewalk(0, 156, 46, 158); C.sidewalk(52, 156, 104, 158); C.street(0, 158, 104, 164, { dir: 'x' }); C.sidewalk(0, 164, 104, 166);
  C.street(46, 110, 52, 128, { dir: 'z' }); C.street(46, 134, 52, 158, { dir: 'z', line: false });
  for (let z = 135; z < 157; z += 3) C.quad('ground', TX.dashTex(), [48.92, 0.012, z], [48.92, 0.012, z + 3], [49.08, 0.012, z + 3], [49.08, 0.012, z], { fit: true });
  C.sidewalk(44, 110, 46, 126); C.sidewalk(52, 110, 54, 126); C.sidewalk(44, 136, 46, 156); C.sidewalk(52, 136, 54, 156);
  // zebra crossings at the junctions
  C.crossing(46, 136.3, 52, 137.9, 'x'); C.crossing(46, 154.1, 52, 155.7, 'x'); C.crossing(46, 124.1, 52, 125.7, 'x');
  C.crossing(54.4, 158, 56.0, 164, 'z'); C.crossing(42.0, 158, 43.6, 164, 'z'); C.crossing(54.4, 128, 56.0, 134, 'z'); C.crossing(42.0, 128, 43.6, 134, 'z');
  C.crossing(100.4, 158, 102.0, 164, 'z'); C.crossing(100.4, 128, 102.0, 134, 'z');
  // a low brick wall and hedge where the back yards of row A meet Market Street
  const brick = TX.brick('#b0705a', '#e0d0c0');
  for (const [a, b] of [[0.5, 44], [54, 104]]) { C.box('props', brick, a, 0, 110.05, b, 0.7, 110.35, { top: S('#c8b8a8') }); C.box('props', T.hedge('#3e7e3a'), a, 0.7, 110.08, b, 1.05, 110.32); C.nav.block(a, 110.0, b, 110.4, 0); }
}

// ======================================================================== row houses
const PAL = [
  ['#e8b4b8', '#f6f0e2', '#7a3a5a', '#5a4a6a', '#f8e0a0'], ['#f4d58d', '#f6f0e2', '#3a6a8a', '#6a4a3a', '#e8a0b0'], ['#a8c8e8', '#f6f0e2', '#c8402a', '#4a4a5a', '#f2d68a'],
  ['#c8b4e0', '#f8f4ea', '#5a8a5a', '#4a3a5a', '#f8e0a0'], ['#f2b880', '#f6f0e2', '#2e5a7a', '#5a3a2a', '#a8c8e8'], ['#b8d8a8', '#f8f4ea', '#a8405a', '#3a4a3a', '#f8d0d8'],
  ['#f0e0c8', '#7a5a8a', '#3a7a6a', '#5a4a6a', '#c8b4e0'], ['#e88a7a', '#f6f0e2', '#f2d68a', '#4a3a3a', '#f6f0e2'], ['#88b8b0', '#f6f0e2', '#e8705a', '#3a4a5a', '#f8e0a0'],
];
const KNOCK = [
  ['Nobody answers. A wind chime somewhere inside rings once, politely.'],
  ['A small dog barks the full story of its day at you through the door.'],
  ['A voice: "If this is about the Pidgun, they are NOT ours. They just like us."'],
  ['A muffled trumpet stops mid-scale. Then starts again, slightly worse.'],
  ['"Just a minute!" ...It is never just a minute. You decide not to wait.'],
  ['A sticky note on the door: "Gone to the farmers\' market. Water the ferns if you are the fern guy."'],
  ['You hear someone shout "Mom, it\'s a TAMER!" and a stampede of small feet. Then silence. You leave, slightly famous.'],
  ['The door has a brass knocker shaped like a fish. It is very satisfying to knock. Nobody comes. Worth it.'],
  ['Someone inside is practising a League victory speech. You quietly back away.'],
];
let houseN = 0;
function rowHouse(C, o) {
  const { x, z, w, d } = o, fh = 3.0, floors = o.floors || 2, face = o.face || 's', H = floors * fh;
  const [col, trimC, accent, roofC, gable] = PAL[o.pal % PAL.length], wall = TX.siding(col), trim = S(trimC), n = houseN++;
  const doorAtWorld = o.doorX ?? (face === 's' ? x + w * 0.78 : x + w * 0.78);
  const at = face === 's' ? (doorAtWorld - x) / w : (x + w - doorAtWorld) / w;
  const rh = Math.min(w * 0.55, 4.4);
  const roof = o.roof === 'flat' ? { type: 'flat', parapet: 0.3 } : o.roof === 'hip' ? { type: 'hip', h: 2.2, cap: false, eave: 0.35, tex: TX.shingles(roofC) } : { type: 'gable', ridge: 'z', h: rh, eave: 0.3, tex: TX.shingles(roofC) };
  const knock = KNOCK[(n * 5 + 2) % KNOCK.length];
  const B = C.building({ x, z, w, d, floors, fh, wall, trim: trimC, base: '#7a6a72', roof, door: { side: face, at, col: accent, label: 'Knock', act: async (app) => { sfx(app, 'door', { vol: 0.4, pitch: 0.7 }); await app.say('', ...knock); } }, windows: { every: w / 2.2, frame: trimC, curtain: o.curtain || gable, lit: 0.35 }, mm: o.mm || col });
  if (face !== 's') { backPorch(C, B, trim); return B; }
  const zf = z + d, bcx = x + w * 0.3, bw = Math.min(2.8, w * 0.36), bwf = bw * 0.62;
  // bays (or a garage at street level), stacked up the façade
  if (o.garage) {
    C.decal(B.gk(0, 'front'), TX.garageTex(T.lt(col, 0.35)), bcx, 0, zf, 's', 2.6, 2.2, { off: 0.03 });
    C.box(B.gk(0, 'front'), trim, bcx - 1.45, 2.2, zf, bcx + 1.45, 2.36, zf + 0.12);
    K.floor(C, 'ground', TX.concrete('#c8c4bc'), bcx - 1.5, zf, bcx + 1.5, o.walkZ, 0.012);
  } else { K.bay(C, B.gk(0, 'front'), bcx, zf, 0.3, fh - 0.3, { wb: bw, wf: bwf, wall, trim, win: TX.windowTex(trimC, gable, C.night), side: TX.windowTex(trimC, gable, C.night) }); C.box(B.gk(0, 'front'), S('#7a6a72'), bcx - bw / 2, 0, zf, bcx + bw / 2, 0.3, zf + 0.6); C.nav.block(bcx - bw / 2, zf, bcx + bw / 2, zf + 0.66, 0); }
  for (let k = 1; k < floors; k++) K.bay(C, B.gk(k, 'front'), bcx, zf, k * fh + 0.25, (k + 1) * fh - 0.3, { wb: bw, wf: bwf, wall, trim, win: TX.windowTex(trimC, gable, C.night), side: TX.windowTex(trimC, gable, C.night) });
  // door hood with brackets, a house number, potted plants
  const dx = doorAtWorld, gk0 = B.gk(0, 'front');
  C.box(gk0, trim, dx - 0.8, 2.36, zf, dx + 0.8, 2.5, zf + 0.62, { top: S(T.dk(roofC, -0.0)) });
  for (const s of [-1, 1]) C.box(gk0, trim, dx + s * 0.7 - 0.05, 1.95, zf, dx + s * 0.7 + 0.05, 2.36, zf + 0.4);
  C.decal(gk0, T.houseNum(String(o.num ?? 20 + n * 2), T.dk(accent, 0.2), '#f8f0d0'), dx - 0.95, 1.7, zf, 's', 0.36, 0.17, { off: 0.03 });
  for (const s of [-1, 1]) { const px = dx + s * 0.85; C.box('props', T.terracotta(), px - 0.16, 0, zf + 0.25, px + 0.16, 0.34, zf + 0.57); C.box('props', T.leaves(n % 2 ? '#4a8a42' : '#5a9a4a'), px - 0.2, 0.34, zf + 0.21, px + 0.2, 0.62, zf + 0.61); C.nav.block(px - 0.18, zf + 0.22, px + 0.18, zf + 0.6, 0); }
  // roofline
  if (roof.type === 'gable') {
    const rk = `b${B.id}:roof`, xm = x + w / 2, e = 0.3;
    C.tri(rk, T.fishscale(gable), [x + 0.06, H + 0.02, zf + 0.02], [x + w - 0.06, H + 0.02, zf + 0.02], [xm, H + rh - 0.1, zf + 0.02]);
    C.decal(rk, T.atticWin(trimC, '#4a6a8a'), xm, H + rh * 0.22, zf + 0.02, 's', 0.7, 0.8, { off: 0.01 });
    C.quad(rk, trim, [x - e, H - 0.37, zf + e + 0.01], [xm, H + rh - 0.22, zf + e + 0.01], [xm, H + rh, zf + e + 0.01], [x - e, H - 0.15, zf + e + 0.01]);
    C.quad(rk, trim, [xm, H + rh - 0.22, zf + e + 0.01], [x + w + e, H - 0.37, zf + e + 0.01], [x + w + e, H - 0.15, zf + e + 0.01], [xm, H + rh, zf + e + 0.01]);
    C.box(rk, S(accent), xm - 0.07, H + rh - 0.05, zf + 0.2, xm + 0.07, H + rh + 0.35, zf + 0.34);
    C.box(B.gk(floors - 1, 'front'), trim, x - 0.1, H - 0.3, zf, x + w + 0.1, H - 0.05, zf + 0.2);
  } else if (roof.type === 'flat') {
    C.box(`b${B.id}:roof`, trim, x - 0.15, H - 0.5, zf, x + w + 0.15, H, zf + 0.28, { s: T.cornice(trimC) });
    C.box(`b${B.id}:roof`, trim, x - 0.18, H, zf - 0.1, x + w + 0.18, H + 0.12, zf + 0.32);
    // a little pediment over the parapet
    C.tri(`b${B.id}:roof`, trim, [x + w / 2 - 1.2, H + 0.12, zf + 0.29], [x + w / 2 + 1.2, H + 0.12, zf + 0.29], [x + w / 2, H + 0.75, zf + 0.29]);
  } else C.box(B.gk(floors - 1, 'front'), trim, x - 0.1, H - 0.3, zf, x + w + 0.1, H - 0.05, zf + 0.2);
  // front garden: a low picket fence (or a hedge) along the sidewalk with a gap for the path
  const gz = o.walkZ, path = [dx - 0.55, dx + 0.55];
  K.floor(C, 'ground', T.flagstone('#d8ccb8'), path[0], zf + 0.05, path[1], gz, 0.014);
  const fenceTex = o.hedge ? T.hedge('#4a8a42') : T.picket(trimC), fh2 = o.hedge ? 0.8 : 0.7;
  let segs = [[x + 0.1, path[0] - 0.1], [path[1] + 0.1, x + w - 0.1]];
  if (o.garage) segs = segs.flatMap(([a, b]) => [[a, Math.min(b, bcx - 1.55)], [Math.max(a, bcx + 1.55), b]]);
  for (const [a, b] of segs) if (b - a > 0.2) { C.box('props', fenceTex, a, 0, gz - 0.25, b, fh2, gz - 0.12); C.nav.block(a, gz - 0.3, b, gz - 0.07, 0); }
  if (!o.garage && gz - zf > 1.6) { C.box('props', S('#8a6a52'), x + 0.3, 0, zf + 0.8, bcx - bw / 2 - 0.1, 0.15, zf + 1.6, { top: T.flowers('#5a9a4a', n) }); C.nav.block(x + 0.3, zf + 0.8, bcx - bw / 2 - 0.1, zf + 1.6, 0); }
  return B;
}
function backPorch(C, B, trim) {
  // houses facing north show the camera their backs: a little back porch, stairs and a laundry line
  const { x, z, w, d } = B, zb = z + d, gk = B.gk(0, 'front');
  C.box(gk, trim, x + w * 0.55, 2.4, zb, x + w * 0.85, 2.52, zb + 0.9);
  C.box('props', T.wood('#a8784a'), x + w * 0.55, 0, zb, x + w * 0.85, 0.3, zb + 0.9, { top: TX.planks('#a8784a') }); C.nav.block(x + w * 0.55, zb, x + w * 0.85, zb + 0.9, 0);
  C.decal(gk, TX.doorTex('#f4f0e8', 'glass'), x + w * 0.7, 0.3, zb, 's', 0.9, 2.0, { off: 0.03 });
}
function rows(C) {
  // row A (z 113–123, facing Cypress Lane), west of Lark Lane
  [[1, 9, 0, 'gable'], [9, 17.5, 1, 'flat'], [17.5, 26, 2, 'gable', 3], [26, 35, 3, 'flat'], [35, 43.5, 4, 'gable']].forEach(([a, b, p, r, fl], i) => rowHouse(C, { x: a, z: 113, w: b - a, d: 10, pal: p, roof: r, floors: fl || 2, walkZ: 126, garage: i === 1, num: 101 + i * 2 }));
  // row A east of Lark (Milo's house is at x 55–64)
  [[64.5, 72.5, 5, 'gable'], [72.5, 80.5, 6, 'flat', 3], [80.5, 88.5, 7, 'gable'], [88.5, 96, 8, 'hip'], [96, 103.5, 0, 'flat']].forEach(([a, b, p, r, fl], i) => rowHouse(C, { x: a, z: 113, w: b - a, d: 10, pal: p, roof: r, floors: fl || 2, walkZ: 126, hedge: i === 2, garage: i === 3, num: 141 + i * 2 }));
  // row B west (z 142–152, facing Sunset Row); Mrs. Ochoa lives at x 34–43
  [[1, 9, 2, 'flat'], [9, 17, 4, 'gable', 3], [17, 25.5, 6, 'gable'], [25.5, 33.5, 8, 'flat']].forEach(([a, b, p, r, fl], i) => rowHouse(C, { x: a, z: 142, w: b - a, d: 10, pal: p, roof: r, floors: fl || 2, walkZ: 156, hedge: i === 2, garage: i === 0, num: 2 + i * 2 }));
  // row B east of the home
  [[73, 80.5, 3, 'gable'], [80.5, 87.5, 1, 'flat'], [87.5, 94, 5, 'gable']].forEach(([a, b, p, r], i) => rowHouse(C, { x: a, z: 142, w: b - a, d: 10, pal: p, roof: r, walkZ: 156, num: 19 + i * 2 }));
  // south side of Sunset Row (facing the street, i.e. north): their backs face the camera
  [[2, 10.5, 7], [10.5, 19, 0], [19, 27.5, 4], [27.5, 36, 2]].forEach(([a, b, p], i) => rowHouse(C, { x: a, z: 168, w: b - a, d: 9, pal: p, roof: i % 2 ? 'flat' : 'gable', face: 'n', walkZ: 166 }));
  for (const [a, b] of [[2, 36]]) { C.box('props', T.picket('#f6f0e2'), a, 0, 179.2, b, 1.1, 179.3); C.nav.block(a, 179.1, b, 179.4, 0); }
  for (const x of [6, 23]) C.prop('tree', x, 178.3, { s: 0.8 });
}

// ======================================================================== Mrs. Ochoa's house (row B, x 34–43)
function ochoa(C) {
  const lav = '#c8b4e0', trimC = '#f8f4ea';
  const B = C.building({
    x: 34, z: 142, w: 9, d: 10, floors: 2, enter: true, name: 'ochoa', wall: TX.siding(lav), trim: trimC, base: '#7a6a72', inner: TX.wallpaper('#f2e6d8', '#dcc4b0'),
    roof: { type: 'gable', ridge: 'z', h: 4.0, eave: 0.3, tex: TX.shingles('#4a3a5a') }, door: { side: 's', at: K.doorAt(34, 142, 9, 10, 's', 40.45), w: 1.25, tex: T.doorFancy('#5a8a5a') },
    windows: { every: 3.4, frame: trimC, curtain: '#f8e0a0', lit: 0.5, skip: ['n', 'w'] }, floorTexs: [T.herring('#b8834e'), TX.planks('#a87a4a')], step: 'step_wood', mm: '#e0b8e8',
    interior(C, B) {
      const g = B.gk(0, 'in'), parlour = TX.wallpaper('#f2e6d8', '#dcc4b0'), kit = TX.wallpaper('#eef4e0', '#d4e0bc');
      K.partition(C, B, 0, 39.375, 142.2, 39.375, 151.8, { a: kit, b: parlour, gaps: [{ at: 2.3, w: 1.25 }, { at: 7.0, w: 1.4 }] });
      K.partition(C, B, 0, 39.375, 146.625, 42.8, 146.625, { a: kit, b: TX.wallpaper('#e8e0d0', '#d0c4b0'), gaps: [{ at: 1.9, w: 1.25 }] });
      K.stubs(C, B, 0, { s: [[K.snapGap(40.45, 1.25), 1.25]] });
      K.windowOn(C, B, 0, 'n', 36.3, { curtain: '#f8e0a0' }); K.windowOn(C, B, 0, 'w', 146.3, { curtain: '#f8e0a0' }); K.windowOn(C, B, 1, 'n', 36.3); K.windowOn(C, B, 1, 'n', 40.8); K.windowOn(C, B, 1, 'w', 146.3); K.windowOn(C, B, 1, 'w', 149.8);
      K.fixUpperWalls(C, B);
      K.rugAt(C, g, T.rugLiving(), 35.0, 145.6, 38.6, 148.6, 0.03);
      K.sofa(rig(C, g, 0, 'e', 34.22, 145.3, 35.17, 146.25), { col: '#7a3a4a', seats: 1, pillow: '#f8e0a0', throw: '#e8b4b8' });
      { const R = rig(C, g, 0, 'e', 34.22, 146.5, 34.72, 147.0); K.table(R, { w: 0.5, d: 0.5, h: 0.55, col: '#6a4428' }); R.box(S('#f4f0ea'), 0.15, 0.55, 0.1, 0.32, 0.7, 0.27); R.box(S('#f4f0ea'), 0.32, 0.6, 0.15, 0.38, 0.64, 0.2); K.mug(R, 0.38, 0.55, 0.38, '#e8b4b8'); }
      { const R = rig(C, g, 0, 's', 34.6, 142.22, 36.3, 142.82); R.box(T.wood('#3a2620'), 0, 0, 0, 1.7, 1.25, 0.6, { top: T.wood('#4a3428') }); R.box(S('#f4f0ea'), 0.1, 0.72, 0.6, 1.6, 0.76, 0.85); for (let k = 0; k < 9; k++) R.box(S('#1a1a22'), 0.18 + k * 0.17, 0.76, 0.62, 0.24 + k * 0.17, 0.78, 0.75); R.box(T.wood('#3a2620'), 0.05, 0, 0.6, 0.12, 0.72, 0.8); R.box(T.wood('#3a2620'), 1.58, 0, 0.6, 1.65, 0.72, 0.8); R.block(0, 0, 1.7, 0.85); K.frame(C, g, T.photo('fog', '#c8a050', 0.36, 0.28), 35.45, 1.6, 142.21, 's', 0.36, 0.28); }
      { const R = rig(C, g, 0, 's', 36.9, 142.22, 37.4, 142.62); R.box(T.wood('#5a3a24'), 0, 0, 0, 0.5, 2.05, 0.4); R.pic(T.clockFace(), 'f', 0.25, 0.4, 1.45, 0.34, 0.34); R.box(S('#c8a050'), 0.2, 0.5, 0.4, 0.3, 1.2, 0.41); R.block(0, 0, 0.5, 0.4); }
      K.bookshelf(rig(C, g, 0, 'e', 34.22, 148.6, 34.6, 149.7), { h: 1.8, col: '#5a3a24', seed: 21 });
      { const R = rig(C, g, 0, 'e', 34.22, 150.3, 34.72, 151.5); K.cabinet(R, { w: 1.2, d: 0.5, h: 0.95, col: '#5a3a24', body: T.wood('#5a3a24'), n: 2, knob: '#e8c890' }); R.box(T.glass('#a8d0e8'), 0.05, 0.95, 0.05, 1.15, 1.75, 0.45); R.box(S('#f8c840'), 0.2, 0.95, 0.2, 0.36, 1.2, 0.32); R.box(S('#c8ccd4'), 0.6, 0.95, 0.2, 0.75, 1.15, 0.32); R.box(S('#e8473a'), 0.85, 0.95, 0.18, 1.0, 1.05, 0.3); }
      K.frame(C, g, T.photo('garden'), 34.21, 1.5, 147.6, 'e', 0.32, 0.26); K.frame(C, g, T.photo('bridge'), 34.21, 1.55, 148.15, 'e', 0.32, 0.26);
      // the cat on her cushion, the knitting basket
      C.box(g, T.fabric('#e8705a'), 36.2, 0, 150.4, 36.9, 0.12, 151.0); C.box(g, S('#4a4a54'), 36.35, 0.12, 150.55, 36.75, 0.3, 150.85); C.box(g, S('#4a4a54'), 36.6, 0.25, 150.58, 36.8, 0.42, 150.82); C.box(g, S('#4a4a54'), 36.62, 0.42, 150.6, 36.66, 0.48, 150.64); C.box(g, S('#4a4a54'), 36.74, 0.42, 150.6, 36.78, 0.48, 150.64); C.box(g, S('#4a4a54'), 36.2, 0.12, 150.75, 36.38, 0.18, 150.82); C.box(g, S('#f8d84a'), 36.79, 0.33, 150.64, 36.8, 0.35, 150.66); C.nav.block(36.2, 150.4, 36.9, 151.0, 0);
      C.box(g, T.knit('#c8a070'), 35.3, 0, 146.4, 35.75, 0.3, 146.85); C.box(g, S('#e8705a'), 35.4, 0.3, 146.5, 35.55, 0.4, 146.65); C.box(g, S('#7ab0d8'), 35.55, 0.3, 146.6, 35.7, 0.38, 146.75); C.nav.block(35.3, 146.4, 35.75, 146.85, 0);
      for (const [x, z, k] of [[38.9, 142.7, 'tall'], [38.9, 151.3, 'fern'], [34.6, 143.6, 'flower']]) K.plant(rig(C, g, 0, 's', x - 0.35, z - 0.35, x + 0.35, z + 0.35), 0.35, 0.35, { kind: k });
      K.floorLamp(rig(C, g, 0, 's', 34.3, 144.55, 34.8, 145.05), 0.25, 0.25, { shade: '#f8e0b0', toggle: K.toggle(B, 0, 'lamp', true) });
      // kitchen nook
      K.floor(C, g, T.checker('#f2ecdc', '#c8a8a0', 8), 39.44, 142.2, 42.8, 146.56, 0.03);
      { const R = rig(C, g, 0, 's', 39.6, 142.2, 42.7, 142.8); K.cabinet(R, { w: 3.1, d: 0.6, h: 0.9, col: '#e8f0d8', drawer: true, n: 5 }); R.box(T.counter('#e8e2d6'), -0.01, 0.9, 0, 3.11, 0.95, 0.63); R.top(T.sinkTop(), 0.3, 0.05, 1.1, 0.58, 0.952); R.top(T.stoveTop(), 1.9, 0.0, 2.6, 0.6, 0.952); R.box(S('#c8402a'), 2.0, 0.95, 0.15, 2.25, 1.15, 0.4); R.box(S('#f4f0ea'), 2.7, 0.95, 0.15, 2.95, 1.2, 0.4, { top: S('#c8a050') }); K.upperCab(R, { w: 3.1, col: '#e8f0d8', n: 5 }); }
      { const R = rig(C, g, 0, 's', 40.4, 144.4, 41.6, 145.3); K.table(R, { w: 1.2, d: 0.9, h: 0.74, col: '#c89a62' }); R.box(S('#f8e0a0'), 0.4, 0.74, 0.3, 0.8, 0.9, 0.6); }
      // the hall
      K.rugAt(C, g, T.welcomeMat(), 40.0, 151.1, 41.0, 151.7, 0.03);
      { const R = rig(C, g, 0, 's', 41.95, 146.7, 42.75, 147.1); R.box(T.wood('#6a4428'), 0, 0.4, 0, 0.8, 0.45, 0.4); R.box(T.wood('#6a4428'), 0.05, 0, 0.05, 0.1, 0.4, 0.35); R.box(T.wood('#6a4428'), 0.7, 0, 0.05, 0.75, 0.4, 0.35); R.box(S('#c8402a'), 0.15, 0.45, 0.1, 0.4, 0.55, 0.3); R.block(0, 0, 0.8, 0.4); }
      C.npc({ id: 'ochoa', who: 'passerby55', name: 'Mrs. Ochoa', x: 36.6, z: 147.1, yaw: 0.6, L: 0, lines: W.NEIGHBOR_GRAN });
      const I = (o) => C.interact({ r: 1.2, ...o });
      I({ x: 35.45, z: 143.3, label: 'Piano', icon: 'music', act: async (app) => { sfx(app, 'furin', { pitch: 0.7 }); await app.say('', 'You press a key. PLONK. A slightly out-of-tune note hangs in the air.', 'Mrs. Ochoa, without looking up: "That one has been flat since 1987. It has character."'); } });
      I({ x: 35.2, z: 147.5, label: 'Tea', icon: 'bowl', act: async (app) => { await app.say('Mrs. Ochoa', 'Have some tea, dear. Chamomile and a little honey. It cures everything except bad manners.'); sfx(app, 'bubble'); app.toast('A warm, cosy feeling', { icon: 'heart' }); } });
      I({ x: 36.55, z: 150.0, label: 'Pet the cat', icon: 'cat', act: async (app) => { sfx(app, 'meow'); await app.say('', 'The cat, Duchess, opens one eye, judges you thoroughly, and allows exactly three strokes.', W.pick(['Purr.', 'On the fourth stroke, she bites. Gently. A warning.'])); } });
      I({ x: 35.5, z: 147.2, label: 'Knitting basket', icon: 'hand', r: 0.8, act: async (app) => app.say('', 'Half a scarf in red and yellow. "For your little fire chick," says Mrs. Ochoa. "Its neck looks cold. Do they have necks?"') });
      I({ x: 37.15, z: 143.2, label: 'Grandfather clock', icon: 'clock', act: async (app) => { sfx(app, 'gong', { vol: 0.3 }); await app.say('', 'TOCK... TOCK... The clock is older than the house. Possibly older than the hill.'); } });
      I({ x: 35.2, z: 149.15, label: 'Old journal', icon: 'book', act: async (app) => app.say('', 'A tamer\'s journal from 1972, in Mrs. Ochoa\'s neat handwriting. "Day 41. Snoozaque slept through the whole battle. We lost. Best day ever."') });
      I({ x: 35.3, z: 150.9, label: 'Trophy case', icon: 'star', act: async (app) => app.say('', 'Ribbons for "Longest Nap" (three years running), a tiny bronze cup, and a photo of fog with a small arrow: "Snoozaque, probably."') });
      I({ x: 41.1, z: 143.4, label: 'Cookie jar', icon: 'bowl', act: async (app) => { await app.say('Mrs. Ochoa', 'Take two, dear. One for you and one for your partner. I will know if you take three.'); sfx(app, 'plop'); } });
      C.zone('ochoa', 34, 142, 43, 152, { label: 'Mrs. Ochoa\'s House', sub: 'Sunset Row', music: 'senbazuru', step: 'step_wood' });
    },
  });
  K.live(C, B);
  // her front garden: roses, a bench, a birdhouse
  const zf = 152;
  K.floor(C, 'ground', T.flagstone('#d8ccb8'), 39.9, zf + 0.05, 41.05, 156, 0.014);
  C.box('props', S('#8a6a52'), 34.3, 0, zf + 0.2, 39.6, 0.18, zf + 1.2, { top: T.flowers('#4a8a42', 7) }); C.nav.block(34.3, zf + 0.2, 39.6, zf + 1.2, 0);
  for (const [a, b] of [[34.1, 39.85], [41.1, 42.9]]) { C.box('props', T.picket('#f8f4ea'), a, 0, 155.6, b, 0.7, 155.72); C.nav.block(a, 155.55, b, 155.8, 0); }
  C.box('props', T.wood('#6a4428'), 42.2, 0, 153.2, 42.3, 1.6, 153.3); C.box('props', S('#e8b4b8'), 42.0, 1.6, 153.05, 42.5, 1.95, 153.45); C.box('props', S('#4a3a5a'), 41.95, 1.95, 153.0, 42.55, 2.05, 153.5); C.nav.block(42.15, 153.15, 42.35, 153.35, 0);
  C.prop('bench', 37.0, 154.6);
}

// ======================================================================== Milo's house (row A, x 55–64)
function milo(C) {
  const col = '#f4d58d', trimC = '#f6f0e2';
  const B = C.building({
    x: 55, z: 113, w: 9, d: 10, floors: 2, enter: true, name: 'milo', wall: TX.siding(col), trim: trimC, base: '#7a6a72', inner: TX.wallpaper('#e8f0f8', '#c8d8ec'),
    roof: { type: 'gable', ridge: 'z', h: 4.0, eave: 0.3, tex: TX.shingles('#3a5a7a') }, door: { side: 's', at: K.doorAt(55, 113, 9, 10, 's', 61.7), w: 1.25, tex: T.doorFancy('#3a6a8a') },
    windows: { every: 3.4, frame: trimC, curtain: '#7ab0d8', lit: 0.5, skip: ['n', 'w'] }, floorTexs: [TX.planks('#c8a070'), TX.planks('#b8905a')], step: 'step_wood', mm: '#f8d890',
    interior(C, B) {
      const g = B.gk(0, 'in'), room = TX.wallpaper('#d8eaf8', '#f8e070'), hall = TX.wallpaper('#f4ece0', '#e0d0b8');
      const wM = K.partition(C, B, 0, 59.375, 113.2, 59.375, 122.8, { a: hall, b: room, gaps: [{ at: 7.2, w: 1.25 }] });
      K.stubs(C, B, 0, { s: [[K.snapGap(61.7, 1.25), 1.25]] });
      K.windowOn(C, B, 0, 'n', 62.5, { curtain: '#7ab0d8' }); K.windowOn(C, B, 1, 'n', 57.5); K.windowOn(C, B, 1, 'n', 61.8); K.windowOn(C, B, 1, 'w', 116); K.windowOn(C, B, 1, 'w', 120);
      K.fixUpperWalls(C, B);
      // Milo's room: a bunk bed, posters on every wall, a plush mountain, a cardboard Tokon Center
      K.rugAt(C, g, T.rugRound('#7ab0d8', '#f8e070'), 56.2, 117.8, 58.6, 120.2, 0.03);
      const bunk = rig(C, g, 0, 'e', 55.2, 113.4, 57.25, 114.5);
      K.bed(bunk, { w: 1.1, d: 2.05, wood: '#e8473a', quilt: T.quilt(['#e8473a', '#f8d84a', '#4a8ad8', '#f4f0e8'], 'milo'), quiltSide: '#4a8ad8', key: 'milo', head: 0.7, foot: 0.7 });
      const post = S('#e8473a');
      for (const [px, pz] of [[55.22, 113.42], [55.22, 114.42], [57.17, 113.42], [57.17, 114.42]]) C.box(g, post, px, 0, pz, px + 0.08, 2.0, pz + 0.08);
      C.box(g, T.wood('#e8473a'), 55.2, 1.3, 113.4, 57.25, 1.45, 114.5); C.box(g, S('#f4f0e8'), 55.25, 1.45, 113.45, 57.2, 1.6, 114.45); C.quad(g, T.quilt(['#6ab04a', '#f8d84a', '#e890b0', '#f4f0e8'], 'milo2'), [55.2, 1.62, 114.5], [57.25, 1.62, 114.5], [57.25, 1.62, 113.4], [55.2, 1.62, 113.4], { fit: true });
      C.box(g, post, 55.2, 1.6, 114.42, 57.25, 1.75, 114.5); for (let y = 0.3; y < 1.4; y += 0.28) C.box(g, S('#f8d84a'), 57.28, y, 114.0, 57.33, y + 0.04, 114.45); C.box(g, S('#f8d84a'), 57.28, 0, 113.98, 57.33, 1.6, 114.02); C.box(g, S('#f8d84a'), 57.28, 0, 114.43, 57.33, 1.6, 114.47);
      K.plush(rig(C, g, 0, 'e', 55.2, 113.4, 57.25, 114.5), 0.55, 1.62, 0.4, 'chick', { s: 1.1 });
      // posters everywhere (no people: just Tokonmon)
      for (let i = 0; i < 5; i++) C.decal(g, T.kidPoster(i), 56.0 + i * 0.62 + (i > 2 ? 0.2 : 0), i % 2 ? 1.35 : 1.6, 113.21, 's', 0.5, 0.6, { off: 0.008 });
      for (let i = 0; i < 4; i++) C.decal(g, T.kidPoster(i + 5), 55.21, i % 2 ? 1.3 : 1.55, 115.6 + i * 0.75, 'e', 0.5, 0.6, { off: 0.008 });
      C.decal(g, T.dexChart(), 55.21, 1.25, 119.9, 'e', 1.2, 0.8, { off: 0.008 });
      // the plush mountain in the corner
      { const R = rig(C, g, 0, 's', 55.25, 121.5, 56.6, 122.75); const P = [['bear', 0.25, 0, 0.3], ['chick', 0.7, 0, 0.35], ['blob', 1.1, 0, 0.6], ['bear', 0.45, 0.32, 0.55], ['blob', 0.85, 0.22, 0.25], ['chick', 0.6, 0.45, 0.85]]; const cols = ['#6ab04a', '#e890b0', '#4a8ad8']; P.forEach(([k, x, y, z], i) => K.plush(R, x, y, z, k, { s: 1.3, col: cols[i % 3] })); R.block(0.05, 0.05, 1.3, 1.2); }
      // cardboard Tokon Center
      { const R = rig(C, g, 0, 's', 57.4, 121.6, 58.9, 122.75); R.box(S('#c8a070'), 0, 0, 0, 1.5, 0.9, 1.1, { top: S('#b8905a') }); R.box(S('#e8473a'), 0.2, 0.9, 0.3, 1.3, 1.2, 0.36); R.box(S('#f4f0ea'), 0.6, 0.95, 0.36, 0.9, 1.15, 0.37); R.box(S('#e8473a'), 0.71, 0.98, 0.37, 0.79, 1.12, 0.375); R.box(S('#e8473a'), 0.66, 1.03, 0.37, 0.84, 1.07, 0.375); R.box(S('#3a3a44'), 0.55, 0, 1.1, 0.95, 0.6, 1.105); R.block(0, 0, 1.5, 1.1); }
      // toy chest, a figure shelf, the hamster's cage
      { const R = rig(C, g, 0, 's', 57.6, 113.21, 58.8, 113.81); R.box(S('#4a8ad8'), 0, 0, 0, 1.2, 0.55, 0.6, { top: S('#3a7ac8') }); R.box(S('#f8d84a'), 0, 0.42, 0, 1.2, 0.48, 0.61); R.box(S('#e8473a'), 0.3, 0.55, 0.2, 0.42, 0.68, 0.32); R.box(S('#6ab04a'), 0.7, 0.55, 0.25, 0.9, 0.62, 0.45); R.block(0, 0, 1.2, 0.6); }
      { const R = rig(C, g, 0, 's', 57.5, 113.21, 59.2, 113.45); const gk = wM; void gk; R.box(T.wood('#f4f0e8'), 0, 1.85, 0, 1.7, 1.89, 0.24); for (let i = 0; i < 8; i++) { const c = ['#e8473a', '#4a8ad8', '#6ab04a', '#f8c840', '#8a5ad8', '#f090b0', '#3aa8a0', '#f8a030'][i]; R.box(S(c), 0.1 + i * 0.2, 1.89, 0.06, 0.2 + i * 0.2, 2.02 + (i % 3) * 0.03, 0.16); R.box(S('#1a1a22'), 0.12 + i * 0.2, 1.97, 0.16, 0.14 + i * 0.2, 1.99, 0.165); } }
      { const R = rig(C, g, 0, 'e', 55.2, 117.6, 55.7, 118.3); K.table(R, { w: 0.7, d: 0.5, h: 0.6, col: '#f4f0e8' }); R.box(T.glass('#d8eef8'), 0.08, 0.6, 0.08, 0.62, 0.9, 0.42); R.box(S('#e8c890'), 0.1, 0.6, 0.1, 0.6, 0.64, 0.4); R.box(S('#c8a070'), 0.3, 0.64, 0.2, 0.42, 0.72, 0.3); R.box(S('#f4f0e8'), 0.5, 0.64, 0.12, 0.56, 0.78, 0.18); }
      // the rest of the house: a little kitchen, a sofa, family snaps
      K.floor(C, g, T.checker('#f4ece0', '#f4d58d', 8), 59.44, 113.2, 63.8, 116.5, 0.03);
      { const R = rig(C, g, 0, 's', 59.6, 113.2, 62.9, 113.8); K.cabinet(R, { w: 3.3, d: 0.6, h: 0.9, col: '#f6f0e2', drawer: true, n: 5 }); R.box(T.counter('#e8e2d6'), -0.01, 0.9, 0, 3.31, 0.95, 0.63); R.top(T.sinkTop(), 0.4, 0.05, 1.2, 0.58, 0.952); R.top(T.stoveTop(), 2.2, 0.0, 2.9, 0.6, 0.952); K.upperCab(R, { w: 3.3, col: '#f6f0e2', n: 5 }); }
      { const R = rig(C, g, 0, 's', 62.98, 113.22, 63.7, 113.94); R.box(T.metal('#e8ece8'), 0, 0, 0, 0.72, 1.84, 0.72); R.pic(T.fridgeFront('#f0f4f8'), 'f', 0.36, 0.72, 0, 0.72, 1.84, 0.004); R.block(0, 0, 0.72, 0.72); }
      K.sofa(rig(C, g, 0, 's', 60.0, 118.2, 62.2, 119.1), { col: '#e8705a', pillow: '#f8e070', pillow2: '#7ab0d8' });
      K.frame(C, g, T.photo('chick', '#c8402a'), 61.1, 1.5, 118.25, 's', 0.32, 0.26);
      K.plant(rig(C, g, 0, 's', 63.0, 118.0, 63.7, 118.7), 0.35, 0.35, { kind: 'tall' });
      C.npc({ id: 'milo', who: 'passerby17', name: 'Milo', x: 57.6, z: 119.4, yaw: 0.7, L: 0, lines: W.NEIGHBOR_KID });
      const I = (o) => C.interact({ r: 1.2, ...o });
      I({ x: 55.9, z: 119.9, y: 1.6, label: 'Tokon chart', icon: 'eye', act: async (app) => app.say('', 'Milo\'s hand-drawn chart of all 150 Tokonmon. Nine are coloured in. Four of those are "seen on TV". One is the hamster.', 'Milo: "He COUNTS."') });
      I({ x: 56.6, z: 114.2, y: 1.7, label: 'Posters', icon: 'eye', act: async (app) => app.say('', 'Every inch of wall is Tokonmon: fire chicks, a grumpy crab, a mystery blob Milo insists is "very rare and also real".') });
      I({ x: 56.2, z: 121.0, label: 'Plush mountain', icon: 'heart', act: async (app) => { sfx(app, 'boing'); await app.say('', 'You pat the summit of the plush mountain. An avalanche of soft creatures gently buries your feet.', 'Milo: "They LIKE you!"'); } });
      I({ x: 58.1, z: 121.2, label: 'Cardboard Tokon Center', icon: 'heart', act: async (app) => { sfx(app, 'notification', { pitch: 1.4 }); await app.say('', 'A cardboard box with a red cross taped on. Inside: a toy stethoscope and a sign: "ALL TOKON HEALED FREE. ALSO DOLLS."', 'You feel... strangely refreshed. Milo is very proud.'); } });
      I({ x: 58.2, z: 114.3, label: 'Toy chest', icon: 'hand', act: async (app) => app.say('', 'Toy capsules, a rubber Foopod, three yo-yos and a single sock with "TRAINING GEAR" written on it in marker.') });
      I({ x: 55.9, z: 118.0, label: 'Hamster', icon: 'heart', act: async (app) => app.say('', 'A round hamster named Commander Biscuit sits in his wheel, not running, just thinking about it.', 'Milo: "He\'s officially Tokon number nine. The League hasn\'t replied to my letter yet."') });
      I({ x: 58.3, z: 113.9, y: 2.2, label: 'Figure shelf', icon: 'star', act: async (app) => app.say('', 'Eight tiny figurines lined up by height, then by colour, then — after an argument with himself — by "coolness".') });
      I({ x: 56.3, z: 115.2, label: 'Bunk bed', icon: 'bed', act: async (app) => app.say('', 'The top bunk belongs to Milo. The bottom bunk belongs to "guests and Tokonmon". There is a plush chick asleep on it.') });
      C.zone('milo', 55, 113, 64, 123, { label: 'Milo\'s House', sub: 'Sunset Row', music: 'lemon', step: 'step_wood' });
    },
  });
  K.live(C, B);
  K.floor(C, 'ground', T.flagstone('#d8ccb8'), 61.2, 123.05, 62.3, 126, 0.014);
  C.box('props', S('#8a6a52'), 55.3, 0, 123.3, 60.6, 0.16, 124.4, { top: T.flowers('#5a9a4a', 4) }); C.nav.block(55.3, 123.3, 60.6, 124.4, 0);
  // a chalk drawing of a Tokon battle on the path, a kid's bike, a ball
  C.box('props', S('#4a8ad8'), 63.0, 0, 124.4, 63.35, 0.35, 124.75); C.nav.block(62.95, 124.35, 63.4, 124.8, 0);
}

// ======================================================================== the Corner Market (row B corner, x 94.5–103.5)
function market(C) {
  const col = '#88b8b0', trimC = '#f6f0e2';
  const B = C.building({
    x: 94.5, z: 143, w: 9, d: 10, floors: 2, enter: true, name: 'market', wall: TX.siding(col), trim: trimC, base: '#5a5a62', inner: TX.wallpaper('#f4f0e4', '#e0d8c0'),
    roof: { type: 'flat', parapet: 0.4 }, door: { side: 's', at: K.doorAt(94.5, 143, 9, 10, 's', 97.2), w: 1.25, tex: T.doorFancy('#2e6a5a', 1.25, true) },
    shop: { sign: 'CORNER MARKET', bg: '#2e6a5a', fg: '#f8e8b0', awning: ['#2e6a5a', '#f4ece0'], side: 's', board: '#2a3a3a' },
    windows: { every: 3, frame: trimC, curtain: '#f8e0a0', lit: 0.6, skip: ['n', 'w'] }, floorTexs: [T.checker('#f4f0e4', '#c8d8d0', 8), TX.planks()], step: 'step_concrete', mm: '#68a898',
    interior(C, B) {
      const g = B.gk(0, 'in');
      K.stubs(C, B, 0, { s: [[K.snapGap(97.2, 1.25), 1.25]] });
      K.windowOn(C, B, 0, 'n', 102.0, { curtain: '#f8e0a0' }); K.windowOn(C, B, 0, 'w', 144.6, { curtain: '#f8e0a0' }); K.windowOn(C, B, 0, 'w', 151.3, { curtain: '#f8e0a0' }); for (const c of [96.5, 99.5, 102.3]) K.windowOn(C, B, 1, 'n', c); for (const c of [145, 148, 151]) K.windowOn(C, B, 1, 'w', c);
      K.fixUpperWalls(C, B);
      { const R = rig(C, g, 0, 's', 95.6, 143.2, 100.4, 143.95); R.box(S('#3a3a44'), 0, 0, 0, 4.8, 2.0, 0.75); R.pic(T.cooler(), 'f', 1.2, 0.75, 0.05, 2.4, 1.9, 0.005); R.pic(T.cooler(), 'f', 3.6, 0.75, 0.05, 2.4, 1.9, 0.005); R.block(0, 0, 4.8, 0.75); }
      for (const x of [96.6, 99.4]) {
        const R = rig(C, g, 0, 'e', x, 145.6, x + 0.7, 149.6);
        R.box(S('#d8d4cc'), 0, 0, 0.0, 4.0, 1.55, 0.7, { top: S('#c8c4bc') });
        R.pic(T.shopShelf(4, 1.5, Math.round(x)), 'f', 2.0, 0.7, 0.03, 4.0, 1.5, 0.004); R.pic(T.shopShelf(4, 1.5, Math.round(x) + 7), 'b', 2.0, 0.0, 0.03, 4.0, 1.5, 0.004);
        R.block(0, 0, 4.0, 0.7);
      }
      { const R = rig(C, g, 0, 's', 100.9, 149.5, 103.25, 150.3); R.box(T.wood('#6a4428'), 0, 0, 0, 2.35, 1.0, 0.8, { top: T.counter('#e8e2d6') }); R.pic(T.cabFront(2.35, 0.9, '#2e6a5a', { n: 3 }), 'f', 1.175, 0.8, 0.05, 2.35, 0.9); R.box(S('#3a3a44'), 0.3, 1.0, 0.15, 0.75, 1.25, 0.5); R.top(T.registerTop(), 0.3, 0.15, 0.75, 0.5, 1.252); R.box(T.glass('#d8eef8'), 1.4, 1.0, 0.2, 1.75, 1.35, 0.55); R.box(S('#f8c840'), 1.45, 1.0, 0.25, 1.7, 1.2, 0.5); R.block(0, 0, 2.35, 0.8);
        R.box(S('#f8a030'), 1.95, 1.0, 0.25, 2.25, 1.14, 0.5); R.box(S('#f8a030'), 2.15, 1.1, 0.3, 2.28, 1.24, 0.42); R.box(S('#f8a030'), 2.17, 1.24, 0.31, 2.2, 1.28, 0.34); R.box(S('#f8a030'), 2.24, 1.24, 0.31, 2.27, 1.28, 0.34); }
      { const R = rig(C, g, 0, 'e', 94.7, 146.5, 95.2, 148.5); R.box(S('#c8c4bc'), 0, 0, 0, 2.0, 1.4, 0.5); R.pic(T.shopShelf(2, 1.3, 31), 'f', 1.0, 0.5, 0.05, 2.0, 1.3, 0.004); R.block(0, 0, 2.0, 0.5); }
      C.decal(g, T.noticeBoard(), 94.71, 1.5, 150.1, 'e', 0.8, 0.6, { off: 0.008 });
      { const R = rig(C, g, 0, 's', 102.3, 145.0, 103.2, 145.9); R.box(S('#e8473a'), 0, 0, 0, 0.9, 0.9, 0.9, { top: T.glass('#d8eef8') }); R.box(S('#f8d84a'), 0.1, 0.9, 0.1, 0.8, 0.95, 0.8); R.block(0, 0, 0.9, 0.9); }
      C.npc({ id: 'mrpark', who: 'passerby7', name: 'Mr. Park', x: 102.0, z: 148.9, yaw: 0, L: 0, lines: W.SHOPKEEPER });
      const I = (o) => C.interact({ r: 1.2, ...o });
      I({ x: 98.0, z: 144.6, label: 'Drinks cooler', icon: 'fridge', act: async (app) => { sfx(app, 'bubble'); await app.say('', 'Rows of ramune in every colour. A hand-written card on the middle shelf: "MYSTERY FLAVOUR — no refunds, no regrets, no idea."'); } });
      I({ x: 98.2, z: 147.6, label: 'Snack shelves', icon: 'bag', act: async (app) => app.say('', W.pick(['Seaweed crisps, rice crackers, a lonely jar of pickles. The delivery truck still has not made it up the hill.', 'Gem polish, capsule refills, a "Rookie Tamer Starter Snack Pack". It is just three granola bars and a sticker.'])) });
      I({ x: 95.3, z: 150.1, y: 1.8, label: 'Notice board', icon: 'eye', act: async (app) => app.say('', 'LOST: one Trashcoon, answers to "Mister Lid". FOR SALE: bicycle, slightly haunted. WANTED: garden volunteers. FREE: zucchini (please).') });
      I({ x: 102.7, z: 149.3, label: 'The shop cat', icon: 'cat', r: 1.0, act: async (app) => { sfx(app, 'meow'); await app.say('', 'An orange cat sleeps on the counter next to the register, one paw on the "ring for service" bell. Nobody rings it. Nobody dares.'); } });
      I({ x: 102.75, z: 146.4, label: 'Ice cream freezer', icon: 'fridge', act: async (app) => app.say('', 'The ice-cream freezer hums a long, low note. Inside: popsicles, mochi, and one very old tub of something green.') });
      C.zone('market', 94.5, 143, 103.5, 153, { label: 'Corner Market', sub: 'Sunset Row', music: 'vibes', step: 'step_concrete' });
    },
  });
  K.live(C, B);
  // outside: crates of fruit under the awning, a newspaper box, the bike rack
  for (const [x, c] of [[99.6, '#e8473a'], [100.6, '#f8a030'], [101.6, '#6ab04a']]) { C.box('props', T.wood('#c8a070'), x - 0.4, 0, 153.2, x + 0.4, 0.55, 153.85); C.box('props', S(c), x - 0.36, 0.55, 153.25, x + 0.36, 0.65, 153.8); C.nav.block(x - 0.42, 153.15, x + 0.42, 153.9, 0); }
  C.prop('bikeRack', 96.0, 155.0);
}

// ======================================================================== pocket park (x 54–80, z 166–180)
function park(C) {
  const path = T.flagstone('#d8ccb8');
  K.floor(C, 'ground', path, 65.9, 166, 67.6, 179, 0.014); K.floor(C, 'ground', path, 55, 172.2, 80, 173.8, 0.016);
  // a stone sign at the entrance
  C.box('props', TX.brick('#c8b8a0', '#e8e0d0'), 63.0, 0, 166.4, 65.2, 0.9, 166.8, { top: S('#b8a890') });
  C.decal('props', TX.signTex('SUNSET POCKET PARK', '#3a6a4a', '#f8f0d0', { w: 2.0, h: 0.4, fs: 0.62 }), 64.1, 0.35, 166.8, 's', 2.0, 0.4, { off: 0.01 });
  C.nav.block(63.0, 166.4, 65.2, 166.8, 0);
  for (const [x, z, s] of [[57, 168.5, 1], [57.5, 177.5, 1.1], [75.5, 178, 0.9], [62, 177, 0.8]]) C.prop('tree', x, z, { s });
  for (const [x, z, yaw] of [[60.5, 171.3, 0], [72.5, 171.3, 0], [64.6, 176.0, Math.PI / 2]]) C.prop('bench', x, z, { yaw });
  for (const [x0, z0, x1, z1, s] of [[55.3, 166.6, 62.5, 167.6, 11], [68.5, 166.6, 79.5, 167.6, 12], [55.3, 174.5, 60.5, 175.5, 13]]) { C.box('props', TX.brick('#b0705a', '#e0d0c0'), x0, 0, z0, x1, 0.35, z1, { top: T.flowers('#4a8a42', s) }); C.nav.block(x0, z0, x1, z1, 0); }
  // the Little Free Library
  C.box('props', T.wood('#6a4428'), 68.3, 0, 169.0, 68.4, 1.0, 169.1); C.box('props', S('#c8402a'), 67.95, 1.0, 168.8, 68.75, 1.6, 169.3); C.decal('props', T.libraryBox(), 68.35, 1.05, 169.3, 's', 0.6, 0.5, { off: 0.005 }); C.box('props', S('#4a3a3a'), 67.9, 1.6, 168.75, 68.8, 1.7, 169.35); C.nav.block(68.2, 168.9, 68.5, 169.2, 0);
  // drinking fountain
  C.box('props', S('#8a8a94'), 69.4, 0, 172.6, 69.7, 0.9, 172.9); C.box('props', S('#a8acb4'), 69.3, 0.9, 172.5, 69.8, 1.0, 173.0); C.nav.block(69.35, 172.55, 69.75, 172.95, 0);
  // playground: slide, swings, sandbox
  K.floor(C, 'ground', T.sandbox(), 70.5, 174.5, 74.5, 178.5, 0.02);
  C.box('props', S('#e8473a'), 71.0, 0, 175.0, 71.12, 1.6, 175.12); C.box('props', S('#e8473a'), 71.0, 0, 175.9, 71.12, 1.6, 176.02); C.box('props', S('#f8d84a'), 71.0, 1.5, 175.0, 71.9, 1.6, 176.0); C.box('props', S('#4a8ad8'), 71.9, 0.05, 175.15, 73.9, 0.15, 175.85);
  C.quad('props', S('#4a8ad8'), [71.9, 1.5, 175.15], [71.9, 1.5, 175.85], [73.9, 0.15, 175.85], [73.9, 0.15, 175.15]);
  for (let y = 0.3; y < 1.5; y += 0.3) C.box('props', S('#f8d84a'), 70.92, y, 175.12, 70.98, y + 0.04, 175.9);
  C.nav.block(70.9, 174.95, 74.0, 176.1, 0);
  const sw = S('#3a7a5a');
  for (const x of [75.5, 78.5]) { C.box('props', sw, x - 0.06, 0, 175.0, x + 0.06, 2.3, 175.12); C.box('props', sw, x - 0.06, 0, 177.0, x + 0.06, 2.3, 177.12); C.nav.block(x - 0.1, 174.95, x + 0.1, 175.2, 0); C.nav.block(x - 0.1, 176.95, x + 0.1, 177.2, 0); }
  C.box('props', sw, 75.4, 2.2, 175.0, 78.6, 2.32, 177.12);
  for (const x of [76.4, 77.6]) { C.box('props', S('#c8ccd4'), x - 0.02, 0.6, 175.7, x + 0.02, 2.2, 175.74); C.box('props', S('#c8ccd4'), x - 0.02, 0.6, 176.36, x + 0.02, 2.2, 176.4); C.box('props', S('#e8473a'), x - 0.25, 0.55, 175.68, x + 0.25, 0.62, 176.42); }
  // a low hedge along the back of the park
  C.box('props', T.hedge('#3e7e3a'), 54.5, 0, 179.3, 80, 0.9, 179.8); C.nav.block(54.5, 179.25, 80, 179.85, 0);
  C.npc({ id: 'parkgoer', who: 'passerby10', name: 'Neighbour', x: 62.0, z: 172.9, yaw: 0.6, L: 0, lines: W.PARKGOER, clip: 'phone' });
  const I = (o) => C.interact({ r: 1.3, ...o });
  const LFL = [['"The Lighthouse Keeper\'s Pidgun" — a picture book. The Pidgun keeps the light on all night. Then demands breakfast.'], ['"Tidepool Tokon of the Golden Coast". Someone has drawn moustaches on all the Foopod. They look distinguished.'], ['"How To Talk To Your Snoozaque" — every page is blank except the last one, which just says "shh".']];
  let lfl = 0;
  I({ x: 68.35, z: 169.8, label: 'Little Free Library', icon: 'book', act: async (app) => { sfx(app, 'page'); await app.say('', 'TAKE A BOOK, LEAVE A BOOK. You browse...', ...LFL[lfl++ % LFL.length]); } });
  I({ x: 69.55, z: 172.2, label: 'Drinking fountain', icon: 'drop', act: async (app) => { sfx(app, 'bubble'); await app.say('', 'Cold, clean, and with exactly the right amount of pressure to hit you in the eye. Refreshing!'); } });
  I({ x: 72.4, z: 175.5, label: 'Slide', icon: 'play', act: async (app) => { sfx(app, 'whoosh'); await app.say('', 'You are definitely too old for this slide. You go down it anyway. Twice. No regrets.'); } });
  I({ x: 77.0, z: 176.1, label: 'Swing', icon: 'play', act: async (app) => { sfx(app, 'whoosh', { pitch: 0.8 }); await app.say('', 'Back and forth, higher and higher. At the top of each swing you can see all the way down the hill to the bay.'); } });
  I({ x: 64.1, z: 166.1, label: 'Park sign', icon: 'eye', act: async (app) => app.say('', 'SUNSET POCKET PARK — "Planted by the neighbours of Sunset Row. Please keep your Tokonmon off the tulips. Yes, you, Trashcoon."') });
}

// ======================================================================== community garden (x 81–104, z 166–180)
function communityGarden(C) {
  const pk = T.picket('#f6f0e2');
  const fence = (x0, z0, x1, z1) => { C.box('props', pk, x0, 0, z0, x1, 1.0, z1); C.nav.block(x0 - 0.02, z0 - 0.02, x1 + 0.02, z1 + 0.02, 0); };
  fence(81, 167, 91.3, 167.1); fence(92.9, 167, 103.6, 167.1); fence(81, 167, 81.1, 179.6); fence(103.5, 167, 103.6, 179.6); fence(81, 179.5, 103.6, 179.6);
  for (const x of [91.3, 92.9]) C.box('props', S('#2e6a5a'), x - 0.08, 0, 166.95, x + 0.08, 1.4, 167.15);
  C.box('props', S('#2e6a5a'), 91.2, 1.4, 166.95, 93.0, 1.9, 167.15); C.decal('props', TX.signTex('GARDEN', '#2e6a5a', '#f8f0d0', { w: 1.8, h: 0.5, fs: 0.65 }), 92.1, 1.4, 167.15, 's', 1.8, 0.5, { off: 0.005 });
  K.floor(C, 'ground', T.pebbles('#d8ccb8'), 91.4, 167.1, 92.8, 179.4, 0.014); K.floor(C, 'ground', T.pebbles('#d8ccb8'), 81.2, 172.3, 103.4, 173.4, 0.016);
  const crops = [['#5aa04a', '#e8473a'], ['#6ab04a', null], ['#4a8a42', '#f8a030'], ['#7ab85a', '#a85ad8'], ['#5aa04a', '#f8d84a'], ['#4a8a42', '#e8473a']];
  [[82, 168.2, 86.4, 171.6], [86.8, 168.2, 91.0, 171.6], [93.2, 168.2, 97.6, 171.6], [98.0, 168.2, 102.6, 171.6], [82, 174.0, 86.4, 177.6], [86.8, 174.0, 91.0, 177.6]].forEach(([a, b, c, d], i) => {
    C.box('props', T.wood('#8a5a36'), a, 0, b, c, 0.4, d, { top: T.soil('#5a3a28') }); C.nav.block(a, b, c, d, 0);
    const [leaf, fruit] = crops[i];
    for (let x = a + 0.35; x < c - 0.2; x += 0.5) for (let z = b + 0.4; z < d - 0.2; z += 0.7) {
      C.box('props', T.leaves(leaf), x - 0.16, 0.4, z - 0.16, x + 0.16, 0.66 + ((x * 7 + z * 3) % 1) * 0.12, z + 0.16);
      if (fruit && ((x * 10 + z * 10) | 0) % 3 === 0) C.box('props', S(fruit), x - 0.07, 0.48, z + 0.12, x + 0.07, 0.6, z + 0.2);
    }
  });
  // sunflowers along the east fence
  for (let z = 174; z < 179; z += 0.8) { C.box('props', S('#5a8a3a'), 102.9, 0, z - 0.04, 102.98, 2.1 + (z % 2) * 0.3, z + 0.04); C.box('props', S('#f8c840'), 102.7, 2.0 + (z % 2) * 0.3, z - 0.22, 102.9, 2.4 + (z % 2) * 0.3, z + 0.22); C.box('props', S('#6a4428'), 102.66, 2.12 + (z % 2) * 0.3, z - 0.1, 102.7, 2.28 + (z % 2) * 0.3, z + 0.1); C.nav.block(102.8, z - 0.1, 103.05, z + 0.1, 0); }
  // tool shed, water barrel, compost bins, scarecrow
  C.building({ x: 97.8, z: 175.0, w: 3.6, d: 3.2, floors: 1, fh: 2.4, wall: TX.siding('#c8a070'), trim: '#f6f0e2', base: '#6a5a52', roof: { type: 'gable', ridge: 'x', h: 1.0, eave: 0.2, tex: TX.shingles('#3a5a4a') }, door: { side: 'w', at: 0.5, col: '#2e6a5a', label: 'Tool shed', act: async (app) => app.say('', 'Rakes, hoes, forty identical trowels and a sign: "RETURN THE TROWELS. WE KNOW WHO YOU ARE, GERALD."') }, windows: { every: 3, skip: ['n', 'e'] }, mm: '#b89468' });
  C.box('props', S('#3a6a9a'), 95.6, 0, 177.6, 96.3, 0.9, 178.3, { top: TX.water('#4a8ac0') }); C.nav.block(95.55, 177.55, 96.35, 178.35, 0);
  for (const x of [82.2, 83.4]) { C.box('props', T.wood('#6a4428'), x, 0, 178.2, x + 1.0, 0.8, 179.2, { top: T.soil('#4a3020') }); C.nav.block(x, 178.2, x + 1.0, 179.2, 0); }
  { const x = 89.0, z = 178.6; C.box('props', T.wood('#6a4428'), x - 0.04, 0, z - 0.04, x + 0.04, 1.8, z + 0.04); C.box('props', T.wood('#6a4428'), x - 0.6, 1.25, z - 0.03, x + 0.6, 1.32, z + 0.03); C.box('props', S('#3a6a9a'), x - 0.2, 0.8, z - 0.12, x + 0.2, 1.4, z + 0.12); C.box('props', S('#f0d8a0'), x - 0.14, 1.4, z - 0.12, x + 0.14, 1.66, z + 0.12); C.box('props', S('#c8402a'), x - 0.22, 1.66, z - 0.16, x + 0.22, 1.72, z + 0.16); C.box('props', S('#c8402a'), x - 0.12, 1.72, z - 0.1, x + 0.12, 1.86, z + 0.1); C.nav.block(x - 0.25, z - 0.15, x + 0.25, z + 0.15, 0); }
  C.npc({ id: 'gardener', who: 'passerby31', name: 'Gardener', x: 92.1, z: 172.8, yaw: -0.4, L: 0, lines: W.GARDENER });
  const I = (o) => C.interact({ r: 1.3, ...o });
  I({ x: 84.2, z: 172.2, label: 'Tomato bed', icon: 'leaf', act: async (app) => app.say('', 'Tomatoes so red they look painted. A small sign: "Creepetal-grown. Slightly haunted. Delicious."') });
  I({ x: 95.4, z: 172.2, label: 'Pumpkin patch', icon: 'leaf', act: async (app) => app.say('', 'One of the pumpkins has a carefully carved face that says "PLEASE DO NOT EAT ME". It is sweating slightly.') });
  I({ x: 89.0, z: 177.9, label: 'Scarecrow', icon: 'eye', act: async (app) => app.say('', 'The scarecrow wears a League rookie cap. Three Pidgun sit on its arms, using it as a lookout tower.', 'It has failed at its one job. It looks happy anyway.') });
  I({ x: 88.9, z: 172.5, label: 'Giant zucchini', icon: 'leaf', act: async (app) => app.say('', 'The famous zucchini, roughly the size of a sea lion. It has a ribbon that says "WINNER". Nobody remembers entering it in anything.') });
  C.box('props', S('#6ab04a'), 88.0, 0.0, 172.25, 89.9, 0.42, 172.75); C.box('props', S('#7ac05a'), 88.1, 0.42, 172.3, 89.8, 0.46, 172.7); C.box('props', S('#e8473a'), 88.9, 0.3, 172.74, 89.0, 0.4, 172.76);
}

// ======================================================================== lamps, trees, cars, bins, hydrants, signs
function furniture(C) {
  for (const x of [8, 24, 37, 58, 76, 92]) C.prop('lamp', x, 157.0);
  for (const x of [16, 32, 50, 72, 88, 100]) C.prop('lamp', x, 165.0, { yaw: Math.PI });
  for (const x of [12, 30, 60, 82, 98]) C.prop('lamp', x, 127.0);
  for (const x of [20, 40, 72, 90]) C.prop('lamp', x, 135.0, { yaw: Math.PI });
  for (const z of [118, 146]) { C.prop('lamp', 45.0, z); C.prop('lamp', 53.0, z + 6, { yaw: Math.PI }); }
  for (const x of [4, 16, 30, 82, 88, 101]) C.prop('tree', x, 157.3, { s: 0.85 });
  for (const x of [8, 24, 40, 60, 80, 94]) C.prop('tree', x, 164.7, { s: 0.85 });
  for (const x of [5, 22, 36, 68, 84, 101]) C.prop('tree', x, 126.7, { s: 0.8 });
  for (const x of [10, 30, 62, 80, 98]) C.prop('tree', x, 135.3, { s: 0.8 });
  for (const z of [113, 140, 150]) C.prop('tree', 44.9, z, { s: 0.75 });
  // parked cars along the kerbs
  [[20, 159.3, 0], [33, 159.3, 0], [82, 159.3, 0], [90, 159.3, 0], [12, 162.7, Math.PI], [44, 162.7, Math.PI], [94, 162.7, Math.PI], [14, 129.2, 0], [74, 129.2, 0], [88, 129.2, 0], [30, 132.8, Math.PI], [62, 132.8, Math.PI], [96, 132.8, Math.PI]].forEach(([x, z, yaw], i) => C.prop(CARS[(i * 4 + 1) % CARS.length], x, z, { yaw }));
  for (const [x, z, i] of [[47.2, 116, 2], [47.2, 146, 3]]) C.prop(CARS[i % CARS.length], x, z, { yaw: Math.PI / 2 });
  // hydrants, bins, a blue mailbox on the corner, street signs, a bike rack by the park
  for (const [x, z] of [[45.4, 137.0], [53.0, 155.3], [103.0, 157.4], [2, 135.3], [53.4, 127.4]]) C.prop('hydrant', x, z);
  for (const [x, z] of [[8.3, 155.2], [24.6, 155.3], [79.8, 155.2], [86.8, 155.2], [7.8, 125.4], [43.0, 125.3], [71.8, 125.3], [87.8, 125.3], [102.8, 125.3]]) C.prop('bin', x, z);
  C.prop('mailbox', 55.0, 157.3); C.prop('mailbox', 45.2, 127.2);
  for (const [x, z] of [[45.3, 136.7], [52.7, 155.6], [52.7, 126.6], [103.4, 157.6], [103.4, 127.6]]) C.prop('sign', x, z);
  C.prop('bikeRack', 70.0, 165.2);
  for (let x = 38; x < 54; x += 3.2) C.prop('tree', x, 178.6, { s: 0.9 + (x % 3) * 0.08 });
  for (const x of [56, 60.5, 65, 69.5, 74, 78.5]) C.prop('tree', x, 179.0, { s: 0.75 });
  C.box('props', T.hedge('#3e7e3a'), 36.5, 0, 179.3, 54.5, 1.0, 179.8); C.nav.block(36.5, 179.25, 54.5, 179.85, 0);
  // a mailbox on its post for the street-name sign
  const I = (o) => C.interact({ r: 1.3, ...o });
  I({ x: 53.2, z: 156.6, label: 'Street sign', icon: 'map', act: async (app) => app.say('', 'LARK LANE (up the hill to Market Street) / SUNSET ROW (east to Van Ness Avenue). Someone has stuck a little Pidgun sticker on it.') });
}
