// The player's family home on Sunset Row: a two-storey Queen-Anne-flavoured Victorian (sage siding, cream
// trim, a raspberry door, a fish-scale front gable, stacked canted bay windows and a porch with a balcony on
// top). Inside, a dollhouse: kitchen + dining (Mom), living room, entry hall, bathroom and the stairs on the
// ground floor; the player's bedroom, Mom's room and a landing study upstairs, and the little front balcony.
import { TX } from '../../build.js';
import * as T from './tex.js';
import * as K from './kit.js';
import * as W from './lines.js';

const { S, rig } = K;
export const HOME = { x: 56, z: 141, w: 14, d: 11 };
const day = (app) => (app.state && app.state.time && app.state.time.day) || 1;
const flags = (app) => { const s = app.state || (app.state = {}); return s.flags || (s.flags = {}); };
const sfx = (app, n, o) => { const a = app.audio; if (a && a.sfx) a.sfx(n, o); };

export function buildHome(C, ctx = {}) {
  const X0 = 56, Z0 = 141, X1 = 70, Z1 = 152;
  const sage = '#9cc4b4', cream = '#f6f0e2', berry = '#b04a64', butter = '#f2d68a', plum = '#5a4a6a';
  const wallTex = T.siding(sage);
  const P = {
    kitchen: TX.wallpaper('#f6eedc', '#e6d6b4'), living: TX.wallpaper('#f2dcc4', '#e0bfa0'), hall: TX.wallpaper('#e6e0f0', '#cfc4e0'),
    bath: T.tilesSq('#e6f4f2', '#b4d0cc', 4), bed: TX.wallpaper('#d6e6f4', '#b8d0ea'), mom: TX.wallpaper('#f6e2e6', '#e6c0c8'), study: TX.wallpaper('#e6f0da', '#cadcb4'),
  };
  const st = { tv: { ch: 0 }, radio: 0, mail: 0, book: 0, comic: 0, photo: 0, card: 0, game: { on: false }, poster: 0, letter: 0 };
  const B = C.building({
    x: X0, z: Z0, w: 14, d: 11, floors: 2, enter: true, name: 'home',
    wall: wallTex, trim: cream, base: '#7a6a72', inner: P.hall,
    roof: { type: 'gable', ridge: 'x', h: 3.0, eave: 0.45, tex: TX.shingles(plum) },
    doors: [{ side: 's', at: K.doorAt(X0, Z0, 14, 11, 's', 66.7), w: 1.25, tex: T.doorFancy(berry) }, { side: 'n', at: K.doorAt(X0, Z0, 14, 11, 'n', 61.7), w: 1.25, tex: T.doorFancy(cream, 1.25, true) }],
    windows: { skip: ['s', 'e', 'n', 'w'] },
    floorTexs: [TX.planks('#c8935a'), TX.planks('#b8834e')],
    step: 'step_wood', mm: '#f0b860',
    interior: (C, B) => interior(C, B, P, st),
  });
  exterior(C, B, { sage, cream, berry, butter, plum, wallTex });
  garden(C, B, st);
  K.fixUpperWalls(C, B);
  // the balcony: a door in the upstairs front wall and a little deck over the porch
  C.nav.open(67.1, 151.7, 68.1, 152.05, 1, 3); C.nav.open(65.55, 152.0, 68.45, 153.55, 1, 3); C.nav.mark(65.25, 151.7, 68.75, 153.8, 1, B.id);
  K.live(C, B);
  // ---- spots the story uses
  C.spot('frontDoorOut', 66.75, 154.7, 0, 0);
  C.spot('start', 66.75, 154.7, 0, 0);
  C.spot('frontDoorIn', 66.75, 151.0, Math.PI, 0);
  C.spot('homeStreet', 66.75, 160.2, Math.PI, 0);
  C.spot('livingRoom', 59.4, 150.4, Math.PI, 0);
  C.spot('kitchen', 61.25, 143.15, Math.atan2(60.5 - 61.25, 142.35 - 143.15), 0);
  C.spot('stairsBottom', 65.12, 149.3, Math.PI, 0);
  C.spot('stairsTop', 65.12, 142.2, 0, 1);
  C.spot('bedroom', 60.3, 149.3, Math.PI, 1);
  C.spot('bed', 57.3, 150.05, Math.PI, 1);
  C.spot('pcDesk', 58.55, 147.55, Math.PI, 1);
  C.spot('balcony', 67.0, 152.9, 0, 1);
  C.zone('homeHouse', X0, Z0, X1, Z1, { label: 'Home', sub: 'Sunset Row', music: 'lofi', bed: 'birds', step: 'step_wood' });
  return B;
}

// ======================================================================== interior
function interior(C, B, P, st) {
  const g0 = B.gk(0, 'in'), g1 = B.gk(1, 'in');
  // ---------------------------------------------------------------- shell: partitions, stubs, papered outer walls, stairs
  const wainscot = T.wood('#a8784a');
  // ground floor
  const wK = K.partition(C, B, 0, 64.375, 141.2, 64.375, 148.0, { a: P.hall, b: P.kitchen });
  const wS2 = K.partition(C, B, 0, 65.875, 141.2, 65.875, 146.125, { a: P.bath, b: P.hall });
  const wB = K.partition(C, B, 0, 65.875, 146.125, 69.8, 146.125, { a: P.bath, b: P.hall, gaps: [{ at: 1.125, w: 1.25 }] });
  const wH = K.partition(C, B, 0, 64.375, 148.0, 64.375, 151.8, { a: P.hall, b: P.living, gaps: [{ at: 1.95, w: 1.9 }] });
  const wKL = K.partition(C, B, 0, 56.2, 146.125, 64.375, 146.125, { a: P.kitchen, b: P.living, gaps: [{ at: 4.1, w: 2.6 }] });
  K.stubs(C, B, 0, { s: [[K.snapGap(66.7, 1.25), 1.25]], inner: P.living });
  paper(C, g0, 'n', 56.2, 64.31, 0, P.kitchen); paper(C, g0, 'n', 64.44, 65.81, 0, P.hall); paper(C, g0, 'n', 65.94, 69.8, 0, P.bath);
  paper(C, g0, 'w', 141.2, 146.06, 0, P.kitchen); paper(C, g0, 'w', 146.19, 151.8, 0, P.living);
  C.box(g0, wainscot, 56.2, 0, 146.19, 56.23, 0.9, 151.8); C.box(g0, S('#f6f0e2'), 56.2, 0.9, 146.19, 56.25, 0.96, 151.8);
  // first floor
  const wP1a = K.partition(C, B, 1, 64.375, 141.2, 64.375, 146.125, { a: P.hall, b: P.mom, gaps: [{ at: 1.0, w: 1.25 }] });
  const wP1b = K.partition(C, B, 1, 64.375, 146.125, 64.375, 151.8, { a: P.hall, b: P.bed, gaps: [{ at: 3.3, w: 1.25 }] });
  const wP2 = K.partition(C, B, 1, 56.2, 146.125, 64.375, 146.125, { a: P.mom, b: P.bed });
  K.stubs(C, B, 1, { s: [[67.6, 1.05]], inner: P.bed });
  paper(C, g1, 'n', 56.2, 64.31, 1, P.mom); paper(C, g1, 'n', 64.44, 69.8, 1, P.study);
  paper(C, g1, 'w', 141.2, 146.06, 1, P.mom); paper(C, g1, 'w', 146.19, 151.8, 1, P.bed);
  // stairs: up toward the north from the entry hall, a runner carpet and a banister
  C.stairs(B, 0, 64.5, 143.0, 65.75, 148.0, 'n', { tex: TX.planks('#9a6a42'), side: '#f4ece0', rail: false });
  const run = T.runner('#7a3a4a', '#e8c890');
  for (let i = 0; i < 12; i++) { const z1 = 148 - (5 * i) / 12, z0 = 148 - (5 * (i + 1)) / 12, y = (3 * (i + 1)) / 12 + 0.004; C.quad(g0, run, [64.8, y, z1], [65.45, y, z1], [65.45, y, z0], [64.8, y, z0], { u0: 64.8, v0: -z1 }); }
  const rail = S('#6a4428'), bal = S('#f6f0e2');
  for (let i = 0; i < 5; i++) { const z = 148 - (5 * (i + 0.5)) / 12, y = (3 * (i + 1)) / 12; C.box(g0, bal, 65.69, y, z - 0.02, 65.73, y + 0.85, z + 0.02); }
  C.box(g0, rail, 65.66, 0, 147.9, 65.78, 1.1, 148.02); C.box(g0, S('#e8c060'), 65.65, 1.1, 147.89, 65.79, 1.16, 148.03);
  for (let i = 0; i < 5; i++) { const za = 148 - (5 * i) / 12, zb = 148 - (5 * (i + 1)) / 12, ya = (3 * i) / 12 + 0.95, yb = (3 * (i + 1)) / 12 + 0.95; C.quad(g0, rail, [65.71, ya, za], [65.71, ya, zb], [65.71, yb + 0.06, zb], [65.71, ya + 0.06, za]); }
  // the stairwell rail on the landing (south end)
  C.box(g1, rail, 64.5, 3, 148.0, 65.75, 3.06, 148.06); C.box(g1, rail, 64.5, 3.86, 147.98, 65.81, 3.92, 148.08);
  for (let x = 64.6; x < 65.75; x += 0.16) C.box(g1, bal, x - 0.02, 3.06, 148.01, x + 0.02, 3.86, 148.05);
  for (let z = 143.1; z < 148; z += 0.16) C.box(g1, bal, 65.76, 3.0, z - 0.02, 65.8, 3.86, z + 0.02);
  C.box(g1, rail, 65.74, 3.86, 143.0, 65.82, 3.92, 148.06);

  // windows (the engine's own window pass is skipped so every window sits exactly where the rooms want it)
  K.windowOn(C, B, 0, 's', 62.9, { curtain: '#e8705a' }); K.windowOn(C, B, 0, 's', 68.95, { w: 0.8, curtain: '#e8705a' });
  K.windowOn(C, B, 1, 's', 62.9, { curtain: '#7ab0d8' }); K.windowOn(C, B, 1, 's', 69.15, { w: 0.8, curtain: '#9cc4b4' });
  K.windowOn(C, B, 0, 'e', 143.6, { y: 1.5, w: 0.7, h: 0.8, curtain: '#e6f4f2' }); K.windowOn(C, B, 0, 'e', 149.5, { curtain: '#cfc4e0' });
  K.windowOn(C, B, 1, 'e', 143.6, { curtain: '#cadcb4' }); K.windowOn(C, B, 1, 'e', 149.4, { curtain: '#cadcb4' });
  K.windowOn(C, B, 0, 'n', 58.4, { y: 1.02, h: 1.2, curtain: '#f2d68a' }); K.windowOn(C, B, 0, 'n', 68.6, { y: 1.5, w: 0.7, h: 0.8, curtain: '#e6f4f2' });
  K.windowOn(C, B, 1, 'n', 57.3, { curtain: '#e8a0b0' }); K.windowOn(C, B, 1, 'n', 62.0, { curtain: '#e8a0b0' }); K.windowOn(C, B, 1, 'n', 69.2, { curtain: '#cadcb4' });
  K.windowOn(C, B, 0, 'w', 146.9, { curtain: '#e8705a' }); K.windowOn(C, B, 0, 'w', 144.6, { curtain: '#f2d68a' });
  K.windowOn(C, B, 1, 'w', 150.6, { curtain: '#7ab0d8' }); K.windowOn(C, B, 1, 'w', 143.6, { curtain: '#e8a0b0' });

  // ---------------------------------------------------------------- kitchen + dining
  K.floor(C, g0, T.checker('#f2ecdc', '#a8ccbc', 8), 56.2, 141.2, 64.31, 146.06, 0.03);
  const cab = '#f6f0e2', top = T.counter('#e8e2d6'), knob = '#c8a050';
  // fridge (north-west corner)
  { const R = rig(C, g0, 0, 's', 56.25, 141.22, 56.97, 141.94); R.box(T.metal('#e8ece8'), 0, 0, 0, 0.72, 1.84, 0.72, { top: S('#dfe3df') }); R.pic(T.fridgeFront(), 'f', 0.36, 0.72, 0, 0.72, 1.84, 0.004); R.block(0, 0, 0.72, 0.72); plant(R, 0.36, 0.3, { y: 1.84, s: 0.7, kind: 'fern', block: false }); }
  // counter run with the sink under the window, the stove, and the rice cooker
  { const R = rig(C, g0, 0, 's', 57.0, 141.2, 59.2, 141.8); K.cabinet(R, { w: 2.2, d: 0.6, h: 0.9, col: cab, drawer: true, n: 4, knob }); R.box(top, -0.01, 0.9, 0, 2.21, 0.95, 0.63, { top }); R.top(T.sinkTop(), 1.0, 0.05, 1.8, 0.58, 0.952); R.box(S('#c8ccd4'), 1.36, 0.95, 0.04, 1.44, 1.25, 0.1); R.box(S('#c8ccd4'), 1.37, 1.2, 0.08, 1.43, 1.24, 0.24); R.box(S('#f8f4ec'), 0.2, 0.95, 0.1, 0.6, 0.965, 0.42, { top: S('#e8c890') }); R.box(S('#e8473a'), 0.3, 0.965, 0.2, 0.36, 1.0, 0.26); R.box(S('#6ab04a'), 0.42, 0.965, 0.22, 0.5, 0.99, 0.3); }
  { const R = rig(C, g0, 0, 's', 59.2, 141.2, 59.9, 141.8); R.box(T.metal('#e8e8e4'), 0, 0, 0, 0.7, 0.9, 0.6); R.pic(T.stoveFront(), 'f', 0.35, 0.6, 0.0, 0.7, 0.88, 0.004); R.box(S('#2a2a32'), 0, 0.9, 0, 0.7, 0.93, 0.6); R.top(T.stoveTop(), 0.0, 0.0, 0.7, 0.6, 0.932); R.box(S('#3a3a44'), 0, 0.93, 0, 0.7, 1.05, 0.06); R.block(0, 0, 0.7, 0.6);
    // a pot of curry and the range hood
    R.box(S('#c83a32'), 0.08, 0.93, 0.32, 0.32, 1.1, 0.56); R.box(S('#a82e2a'), 0.06, 1.1, 0.3, 0.34, 1.12, 0.58); R.box(S('#2a2a32'), 0.17, 1.12, 0.41, 0.23, 1.16, 0.47);
    R.box(T.metal('#c8ccd4'), -0.05, 1.75, 0, 0.75, 1.95, 0.5); R.box(T.metal('#b8bcc4'), 0.15, 1.95, 0, 0.55, 2.95, 0.3); }
  { const R = rig(C, g0, 0, 's', 59.9, 141.2, 61.15, 141.8); K.cabinet(R, { w: 1.25, d: 0.6, h: 0.9, col: cab, drawer: true, n: 2, knob }); R.box(top, -0.01, 0.9, 0, 1.26, 0.95, 0.63, { top });
    R.box(S('#f4f0ea'), 0.55, 0.95, 0.12, 0.85, 1.21, 0.4); R.pic(T.riceCooker(), 'f', 0.7, 0.4, 0.95, 0.3, 0.26, 0.004); R.box(S('#e8705a'), 0.57, 1.21, 0.14, 0.83, 1.25, 0.38);   // rice cooker
    R.box(S('#3a3a44'), 0.12, 0.95, 0.12, 0.3, 1.18, 0.3); R.box(S('#3a3a44'), 0.3, 1.05, 0.18, 0.36, 1.12, 0.22); R.box(S('#e8c060'), 0.17, 1.18, 0.17, 0.25, 1.21, 0.25);   // kettle
    K.upperCab(R, { w: 1.25, col: cab, knob }); }
  { const R = rig(C, g0, 0, 's', 62.35, 141.2, 64.25, 141.8); K.cabinet(R, { w: 1.9, d: 0.6, h: 0.9, col: cab, drawer: true, n: 3, knob }); R.box(top, -0.01, 0.9, 0, 1.91, 0.95, 0.63, { top });
    R.box(S('#c8ccd4'), 1.4, 0.95, 0.12, 1.75, 1.15, 0.36); R.box(S('#3a3a44'), 1.45, 1.15, 0.18, 1.7, 1.16, 0.3);   // toaster
    R.box(S('#f4f0ea'), 0.25, 0.95, 0.1, 0.4, 1.25, 0.25, { top: S('#c8a050') }); R.box(S('#c8a050'), 0.45, 0.95, 0.12, 0.6, 1.2, 0.27);   // canisters
    K.upperCab(R, { w: 1.9, col: cab, knob, n: 4 }); plant(R, 0.95, 0.3, { y: 0.95, s: 0.55, kind: 'flower', block: false }); }
  { const R = rig(C, g0, 0, 's', 57.0, 141.2, 57.85, 141.54); K.upperCab(R, { w: 0.85, col: cab, knob, n: 2 }); }
  // backsplash tiles between counter and cabinets
  const bs = T.tilesSq('#f4f6f2', '#c4d0cc', 4);
  for (const [a, b] of [[57.0, 57.85], [58.95, 61.15], [62.35, 64.25]]) C.box(g0, bs, a, 0.95, 141.2, b, 1.45, 141.215);
  // pantry, calendar, clock and the radio shelf on the west wall
  { const R = rig(C, g0, 0, 'e', 56.2, 142.2, 56.75, 143.05); R.box(T.paint(cab), 0, 0, 0, 0.85, 2.1, 0.55); R.pic(T.cabFront(0.85, 2.0, cab, { n: 2, knob }), 'f', 0.425, 0.55, 0.06, 0.85, 2.0, 0.004); R.block(0, 0, 0.85, 0.55); }
  const cal = T.calendar(7); C.decal(g0, cal, 56.21, 1.35, 143.6, 'e', 0.36, 0.5, { off: 0.008 });
  C.decal(g0, T.clockFace(), 56.21, 1.9, 145.5, 'e', 0.34, 0.34, { off: 0.008 });
  // dining table, chairs, fruit bowl
  { const R = rig(C, g0, 0, 's', 57.6, 143.4, 59.8, 144.4); K.table(R, { w: 2.2, d: 1.0, h: 0.75, col: '#b88a5a' });
    R.box(S('#f4ece0'), 0.2, 0.75, 0.3, 2.0, 0.755, 0.7);
    R.box(S('#e8e0d0'), 0.9, 0.755, 0.3, 1.3, 0.83, 0.7); R.box(S('#d84a3a'), 0.97, 0.83, 0.4, 1.09, 0.93, 0.52); R.box(S('#f8d84a'), 1.08, 0.83, 0.45, 1.24, 0.9, 0.58); R.box(S('#6ab04a'), 1.0, 0.83, 0.55, 1.1, 0.92, 0.65); R.box(S('#f8e070'), 1.12, 0.83, 0.36, 1.2, 0.95, 0.44);
    K.mug(R, 0.4, 0.755, 0.5, '#9cc4b4'); }
  for (const x of [57.95, 58.95]) { chair(C, g0, 's', x, 142.9, '#a8784a', '#e8705a'); chair(C, g0, 'n', x, 144.45, '#a8784a', '#e8705a'); }
  chair(C, g0, 'e', 57.1, 143.68, '#a8784a', '#e8705a'); chair(C, g0, 'w', 59.86, 143.68, '#a8784a', '#e8705a');

  // ---------------------------------------------------------------- living room
  K.rugAt(C, g0, T.rugLiving(), 57.3, 147.8, 60.1, 149.8, 0.03);
  const tvTex = K.tvStand(rig(C, g0, 0, 'e', 56.2, 148.0, 56.7, 149.6), { col: '#6a4a32' });
  K.anim(B, tvTex, (t) => (st.tv.ch ? 2 * st.tv.ch - 1 + (Math.floor(t * 1.6) & 1) : 0));
  K.bookshelf(rig(C, g0, 0, 'e', 56.2, 150.3, 56.55, 151.3), { h: 1.9, col: '#7a5236', seed: 3 });
  plant(rig(C, g0, 0, 'e', 56.2, 147.2, 56.9, 147.9), 0.35, 0.35, { kind: 'tall', s: 1.1 });
  K.frame(C, g0, T.photo('beach'), 56.21, 1.6, 148.35, 'e', 0.32, 0.26); K.frame(C, g0, T.photo('baby'), 56.21, 1.68, 148.85, 'e', 0.32, 0.26); K.frame(C, g0, T.photo('house'), 56.21, 1.6, 149.35, 'e', 0.32, 0.26);
  K.frame(C, g0, T.photo('boat', '#6a4428', 0.42, 0.3), 56.21, 2.02, 148.85, 'e', 0.42, 0.3);
  { const R = rig(C, g0, 0, 's', 57.95, 148.35, 58.95, 149.25); K.table(R, { w: 1.0, d: 0.9, h: 0.42, col: '#8a5a36', shelf: true }); K.bookStack(R, 0.25, 0.42, 0.3, 2); K.mug(R, 0.7, 0.42, 0.55, '#e8705a'); R.box(S('#2a2a32'), 0.55, 0.42, 0.2, 0.75, 0.44, 0.28); }
  K.sofa(rig(C, g0, 0, 'w', 60.05, 147.85, 60.95, 149.85), { col: '#5a8aa8', pillow: '#f2c84a', pillow2: '#e8705a', throw: '#f2d68a' });
  K.sofa(rig(C, g0, 0, 's', 57.35, 146.3, 58.3, 147.2), { col: '#d87a5a', seats: 1, pillow: '#9cc4b4', pillows: true });
  const lampT = K.toggle(B, 0, 'lamp', true);
  K.floorLamp(rig(C, g0, 0, 's', 60.0, 150.0, 60.6, 150.6), 0.3, 0.3, { toggle: lampT, shade: '#f8e0b0' });
  { const R = rig(C, g0, 0, 's', 61.75, 146.19, 63.25, 146.65); K.cabinet(R, { w: 1.5, d: 0.46, h: 0.8, col: '#7a5236', body: T.wood('#7a5236'), top: T.wood('#8a6244'), n: 3, knob: '#e8c890' });
    R.box(S('#3a3a44'), 0.25, 0.8, 0.1, 0.65, 1.04, 0.32); R.pic(T.radioFront(), 'f', 0.45, 0.32, 0.8, 0.4, 0.24, 0.004); R.box(S('#c8ccd4'), 0.6, 1.04, 0.2, 0.62, 1.3, 0.22);
    R.box(S('#5a8aa8'), 1.05, 0.8, 0.12, 1.25, 1.1, 0.32); plant(R, 1.15, 0.22, { y: 1.1, s: 0.45, kind: 'flower', block: false, pot: '#5a8aa8' }); }
  K.frame(C, wKL, T.painting(), 62.5, 1.45, 146.19, 's', 1.0, 0.6);
  const wilt = K.toggle(B, 0, 'plantWilt', true, (app) => !(app && app.state && app.state.flags && app.state.flags.sr_plant)), perky = K.toggle(B, 0, 'plantPerky', false, (app) => !!(app && app.state && app.state.flags && app.state.flags.sr_plant));
  { const R = rig(C, g0, 0, 's', 56.6, 151.0, 57.3, 151.7); plant(R, 0.35, 0.35, { kind: 'wilted', s: 1.1, gk: wilt.gk, block: false }); plant(R, 0.35, 0.35, { kind: 'flower', s: 1.1, gk: perky.gk }); }
  plant(rig(C, g0, 0, 's', 63.4, 150.9, 64.1, 151.6), 0.35, 0.35, { kind: 'fern', s: 1.0 });

  // ---------------------------------------------------------------- entry hall
  K.rugAt(C, g0, T.welcomeMat(), 66.25, 151.1, 67.25, 151.7, 0.03);
  { const R = rig(C, g0, 0, 's', 68.0, 146.19, 69.6, 146.62); R.box(T.wood('#a8784a'), 0, 0.38, 0, 1.6, 0.45, 0.43); R.box(T.wood('#8a5a36'), 0.05, 0, 0.05, 0.1, 0.38, 0.38); R.box(T.wood('#8a5a36'), 1.5, 0, 0.05, 1.55, 0.38, 0.38); R.box(T.wood('#8a5a36'), 0.1, 0.12, 0.05, 1.5, 0.15, 0.4);
    R.box(S('#e8473a'), 0.2, 0.15, 0.12, 0.45, 0.25, 0.32); R.box(S('#f4f0ea'), 0.5, 0.15, 0.12, 0.75, 0.25, 0.32); R.box(S('#5a7a3a'), 1.0, 0.15, 0.1, 1.2, 0.35, 0.36); R.block(0, 0, 1.6, 0.43);
    R.box(S('#c8a050'), 0.1, 1.5, 0, 1.5, 1.56, 0.04, { gk: wB }); R.box(S('#e8705a'), 0.25, 0.95, 0.04, 0.55, 1.5, 0.16, { gk: wB }); R.box(S('#3a5a8a'), 0.75, 0.9, 0.04, 1.05, 1.5, 0.18, { gk: wB }); R.box(S('#f2d68a'), 1.2, 1.1, 0.04, 1.4, 1.5, 0.12, { gk: wB }); }
  { const R = rig(C, g0, 0, 'e', 64.44, 150.95, 64.84, 151.75); K.table(R, { w: 0.8, d: 0.4, h: 0.8, col: '#7a5236', apron: true }); R.box(S('#c8a050'), 0.3, 0.8, 0.12, 0.5, 0.84, 0.3); plant(R, 0.65, 0.2, { y: 0.8, s: 0.45, kind: 'cactus', block: false }); }
  C.decal(wH, T.mirror(0.5, 0.7), 64.44, 1.35, 151.35, 'e', 0.5, 0.7, { off: 0.01 });
  K.floor(C, g0, T.runner('#7a3a4a', '#e8c890'), 66.25, 147.0, 67.25, 150.95, 0.032);
  { const R = rig(C, g0, 0, 'w', 69.3, 148.4, 69.78, 149.9); K.table(R, { w: 1.5, d: 0.48, h: 0.8, col: '#7a5236' }); K.tableLamp(R, 0.3, 0.8, 0.24, { base: '#9cc4b4', shade: '#f8e8c0' }); R.box(S('#c8a050'), 0.75, 0.8, 0.12, 1.0, 0.84, 0.36); R.box(S('#e8473a'), 0.82, 0.84, 0.2, 0.9, 0.86, 0.26); plant(R, 1.25, 0.24, { y: 0.8, s: 0.5, kind: 'fern', block: false }); }
  { const x = 69.35, z = 151.3; C.box(g0, S('#5a3a24'), x - 0.2, 0, z - 0.2, x + 0.2, 0.05, z + 0.2); C.box(g0, S('#5a3a24'), x - 0.03, 0.05, z - 0.03, x + 0.03, 1.8, z + 0.03); C.box(g0, S('#5a3a24'), x - 0.25, 1.65, z - 0.02, x + 0.25, 1.69, z + 0.02); C.box(g0, S('#5a3a24'), x - 0.02, 1.65, z - 0.25, x + 0.02, 1.69, z + 0.25); C.box(g0, S('#e8705a'), x + 0.08, 1.0, z - 0.12, x + 0.22, 1.65, z + 0.12); C.box(g0, S('#f2d68a'), x - 0.14, 1.75, z - 0.14, x + 0.14, 1.86, z + 0.14); C.box(g0, S('#f2d68a'), x - 0.2, 1.75, z - 0.2, x + 0.2, 1.77, z + 0.2); C.nav.block(x - 0.22, z - 0.22, x + 0.22, z + 0.22, 0); }
  K.frame(C, wB, T.photo('bridge', '#c8a050', 0.5, 0.36), 68.8, 1.62, 146.19, 's', 0.5, 0.36);
  C.box(g0, S('#3a5a8a'), 69.35, 0, 146.9, 69.65, 0.5, 147.2); C.box(g0, S('#e8473a'), 69.44, 0.5, 147.0, 69.48, 0.85, 147.04); C.box(g0, S('#f2d68a'), 69.52, 0.5, 147.06, 69.56, 0.8, 147.1); C.nav.block(69.3, 146.85, 69.7, 147.25, 0);

  // ---------------------------------------------------------------- bathroom
  K.floor(C, g0, T.tilesSq('#f4f6f8', '#a8c4cc', 8), 65.94, 141.2, 69.8, 146.06, 0.03);
  { const R = rig(C, g0, 0, 's', 67.4, 141.22, 69.75, 142.05); R.box(S('#f4f4f0'), 0, 0, 0, 2.35, 0.55, 0.83, { top: S('#f8f8f4') }); R.top(T.tubTop(), 0.05, 0.05, 2.3, 0.78, 0.553); R.box(S('#c8ccd4'), 2.1, 0.55, 0.05, 2.2, 0.85, 0.12); R.box(S('#c8ccd4'), 2.12, 0.8, 0.1, 2.18, 0.84, 0.3); R.block(0, 0, 2.35, 0.83);
    R.box(S('#4ab0d8'), 0.9, 0.55, 0.35, 1.05, 0.66, 0.48); R.box(S('#f8a030'), 1.05, 0.6, 0.4, 1.09, 0.63, 0.44); }
  { const R = rig(C, g0, 0, 's', 66.15, 141.22, 66.85, 141.72); R.box(S('#f4f4f0'), 0.25, 0, 0.12, 0.45, 0.7, 0.32); R.box(S('#f4f4f0'), 0, 0.7, 0, 0.7, 0.86, 0.5, { top: S('#f8f8f4') }); R.top(T.basinTop(), 0.06, 0.04, 0.64, 0.46, 0.862); R.box(S('#c8ccd4'), 0.32, 0.86, 0.02, 0.38, 1.02, 0.08); R.block(0, 0, 0.7, 0.5); }
  C.decal(g0, T.mirror(0.55, 0.7), 66.5, 1.15, 141.21, 's', 0.55, 0.7, { off: 0.01 });
  { const R = rig(C, g0, 0, 'e', 65.94, 144.37, 66.64, 144.88); R.box(S('#f4f4f0'), 0, 0.38, 0, 0.51, 0.82, 0.2); R.box(S('#f4f4f0'), 0.06, 0, 0.18, 0.45, 0.4, 0.66); R.box(S('#e8eef0'), 0.04, 0.4, 0.16, 0.47, 0.44, 0.7); R.block(0, 0, 0.51, 0.7); }
  C.box(wS2, S('#c8ccd4'), 65.94, 1.45, 142.5, 65.98, 1.49, 143.4); C.decal(wS2, T.towel('#e8705a'), 65.98, 0.95, 142.95, 'e', 0.5, 0.55, { off: 0.004 });
  K.rugAt(C, g0, T.bathMat(), 67.7, 142.15, 68.5, 142.65, 0.035);
  C.box(g0, T.knit('#d8c8a0'), 69.15, 0, 145.3, 69.7, 0.5, 145.85); C.box(g0, S('#f4f0ea'), 69.2, 0.5, 145.35, 69.65, 0.56, 145.8); C.nav.block(69.1, 145.25, 69.75, 145.9, 0);
  plant(rig(C, g0, 0, 's', 69.2, 143.1, 69.7, 143.6), 0.25, 0.25, { kind: 'fern', s: 0.7 });

  // ---------------------------------------------------------------- bedroom (first floor, south-west)
  const Y1 = 3;
  K.rugAt(C, g1, T.rugStars(), 58.6, 148.0, 61.2, 149.8, Y1 + 0.03);
  K.bed(rig(C, g1, 1, 'e', 56.2, 148.3, 58.25, 149.5), { w: 1.2, d: 2.05, wood: '#c89a62', quilt: T.quilt(['#e8705a', '#f2c84a', '#5a8aa8', '#f4ece0'], 'kid'), quiltSide: '#e8705a', key: 'kid' });
  { const R = rig(C, g1, 1, 'e', 56.2, 147.7, 56.65, 148.2); K.cabinet(R, { w: 0.5, d: 0.45, h: 0.55, col: '#f4ece0', n: 1, drawer: true }); K.tableLamp(R, 0.15, 0.55, 0.22, { base: '#e8705a', shade: '#f8e8c0' }); R.box(S('#4a8ad8'), 0.32, 0.55, 0.15, 0.44, 0.65, 0.26); }
  K.plush(rig(C, g1, 1, 'e', 56.2, 148.3, 58.25, 149.5), 0.85, 0.6, 0.35, 'bear', { s: 1.2 });
  K.wardrobe(rig(C, g1, 1, 's', 56.3, 146.19, 57.5, 146.79), { col: '#e8dcc8' });
  { const R = rig(C, g1, 1, 's', 57.9, 146.19, 59.5, 146.84); K.desk(R, { w: 1.6, d: 0.65, col: '#c89a62' }); const scr = K.pc(R, 0.62, 0.74, 0.16); K.anim(B, scr, (t) => Math.floor(t * 1.4) & 1); K.tableLamp(R, 1.35, 0.74, 0.2, { base: '#4a8ad8', shade: '#f8f0d0', s: 0.09 }); K.bookStack(R, 1.25, 0.74, 0.48, 3); }
  K.officeChair(rig(C, g1, 1, 's', 58.4, 147.0, 59.0, 147.5), 0.3, 0.3, { col: '#e8705a', back: 0.22 });
  K.bookshelf(rig(C, g1, 1, 's', 59.8, 146.19, 60.8, 146.54), { h: 1.85, col: '#f4ece0', seed: 7, toys: true, pal: ['#e8473a', '#4a8ad8', '#f8c840', '#6ab04a', '#e890b0', '#8a5ad8', '#f4f0e8'] });
  { const R = rig(C, g1, 1, 's', 61.3, 146.19, 62.9, 146.69); const gs = K.tvStand(R, { w: 1.6, d: 0.5, h: 0.48, col: '#5a8aa8', tw: 0.82, th: 0.52, screen: T.gameAtlas() }); K.anim(B, gs, (t) => (st.game.on ? Math.floor(t * 3) & 1 : 0));
    R.box(S('#f4f0ea'), 1.05, 0.48, 0.2, 1.41, 0.54, 0.46); R.top(T.consoleTop(), 1.05, 0.2, 1.41, 0.46, 0.542); R.box(S('#3a3a44'), 1.15, 0.48, 0.38, 1.33, 0.51, 0.48); R.box(S('#e8473a'), 0.12, 0.48, 0.3, 0.3, 0.51, 0.44); }
  // trophies and capsules on a wall shelf above the TV (they ride the wall when it lowers)
  { const R = rig(C, g1, 1, 's', 61.2, 146.19, 63.0, 146.45); const gk = wP2;
    R.box(T.wood('#c89a62'), 0, 1.6, 0, 1.8, 1.64, 0.26, { gk }); R.box(T.wood('#a87a4a'), 0.1, 1.48, 0, 0.14, 1.6, 0.2, { gk }); R.box(T.wood('#a87a4a'), 1.66, 1.48, 0, 1.7, 1.6, 0.2, { gk });
    R.box(S('#f8c840'), 0.2, 1.64, 0.06, 0.36, 1.68, 0.2, { gk }); R.box(S('#e8b040'), 0.25, 1.68, 0.1, 0.31, 1.76, 0.16, { gk }); R.box(S('#f8d84a'), 0.18, 1.76, 0.06, 0.38, 1.9, 0.2, { gk });
    R.box(S('#c8ccd4'), 0.5, 1.64, 0.08, 0.62, 1.78, 0.2, { gk }); R.box(S('#c8ccd4'), 0.47, 1.78, 0.06, 0.65, 1.84, 0.22, { gk });
    const caps = [['#e8473a', '#f4f0ea'], ['#4a8ad8', '#f8d84a'], ['#6ab04a', '#f4f0ea'], ['#8a5ad8', '#f090b0'], ['#f8a030', '#3a3a44']];
    caps.forEach(([a, b], i) => { const x = 0.82 + i * 0.17; R.box(S(b), x, 1.64, 0.08, x + 0.12, 1.7, 0.2, { gk }); R.box(S(a), x, 1.7, 0.08, x + 0.12, 1.76, 0.2, { gk }); });
    R.box(S('#e8473a'), 1.38, 1.64, 0.06, 1.5, 1.74, 0.2, { gk }); R.box(S('#f4f0ea'), 1.4, 1.74, 0.1, 1.48, 1.8, 0.16, { gk }); }
  for (const [kind, x, y] of [['chick', 58.7, 1.5], ['league', 63.6, 1.25]]) C.decal(wP2, T.poster(kind), x, Y1 + y, 146.19, 's', 0.7, 0.95, { off: 0.01 });
  C.decal(wP2, T.poster('space'), 60.3, Y1 + 1.95, 146.19, 's', 0.7, 0.95, { off: 0.01 });
  C.decal(g1, T.poster('band'), 56.215, Y1 + 1.35, 149.0, 'e', 0.7, 0.95, { off: 0.008 });
  C.decal(g1, T.poster('map'), 56.215, Y1 + 1.2, 147.2, 'e', 0.7, 0.95, { off: 0.008 });
  // beanbag, window seat, plushies, a lamp
  { const R = rig(C, g1, 1, 's', 61.7, 147.55, 62.55, 148.35); R.box(T.fabric('#f2c84a'), 0.05, 0, 0.05, 0.8, 0.3, 0.75); R.box(T.fabric('#f2c84a'), 0.1, 0.3, 0.05, 0.75, 0.55, 0.3); R.box(T.fabric('#e8b040'), 0.12, 0.3, 0.3, 0.72, 0.36, 0.7); R.block(0.05, 0.05, 0.8, 0.75); K.plush(R, 0.4, 0.36, 0.5, 'blob', { col: '#4a8ad8' }); }
  { const R = rig(C, g1, 1, 'n', 57.5, 151.05, 59.8, 151.75); R.box(T.wood('#f4ece0'), 0, 0, 0, 2.3, 0.42, 0.7); R.pic(T.cabFront(2.3, 0.42, '#f4ece0', { n: 3 }), 'f', 1.15, 0.7, 0, 2.3, 0.42); R.box(T.fabric('#7ab0d8'), 0.03, 0.42, 0.03, 2.27, 0.52, 0.68); R.box(T.fabric('#f2c84a'), 0.15, 0.52, 0.05, 0.55, 0.88, 0.2); R.pic(T.cushion('#f2c84a', 'heart'), 'f', 0.35, 0.2, 0.5, 0.4, 0.4, 0.004); R.box(T.fabric('#e8705a'), 1.75, 0.52, 0.05, 2.15, 0.88, 0.2); R.pic(T.cushion('#e8705a', 'dot'), 'f', 1.95, 0.2, 0.5, 0.4, 0.4, 0.004); K.plush(R, 1.15, 0.52, 0.35, 'chick'); R.block(0, 0, 2.3, 0.7); }
  plant(rig(C, g1, 1, 's', 63.45, 151.0, 64.2, 151.7), 0.37, 0.35, { kind: 'leafy', s: 1.0 });
  K.plush(rig(C, g1, 1, 's', 60.0, 150.4, 60.6, 150.9), 0.3, 0, 0.25, 'bear', { s: 1.4 });
  K.rugAt(C, g1, T.rugRound('#f2c84a', '#f6f0e2'), 62.4, 149.6, 63.6, 150.8, Y1 + 0.03);

  // ---------------------------------------------------------------- Mom's room (first floor, north-west)
  K.rugAt(C, g1, T.rugRound('#e8a0b0', '#f6eadc'), 58.7, 143.6, 60.3, 145.2, Y1 + 0.03);
  K.bed(rig(C, g1, 1, 's', 58.6, 141.2, 60.4, 143.3), { w: 1.8, d: 2.1, wood: '#8a5a36', quilt: T.quilt(['#e8a0b0', '#f6eadc', '#9cc4b4', '#f2d68a'], 'mom'), quiltSide: '#e8a0b0', key: 'mom', head: 1.25 });
  for (const x0 of [57.95, 60.5]) { const R = rig(C, g1, 1, 's', x0, 141.2, x0 + 0.55, 141.65); K.cabinet(R, { w: 0.55, d: 0.45, h: 0.55, col: '#f6eadc', n: 1, drawer: true }); K.tableLamp(R, 0.27, 0.55, 0.22, { base: '#9cc4b4', shade: '#f8e8d0' }); }
  { const R = rig(C, g1, 1, 'e', 56.2, 142.4, 56.7, 143.8); K.cabinet(R, { w: 1.4, d: 0.5, h: 0.85, col: '#f6eadc', drawer: true, n: 2 }); R.box(S('#e8a0b0'), 0.2, 0.85, 0.15, 0.32, 1.0, 0.27); R.box(S('#f4f0ea'), 0.5, 0.85, 0.12, 0.62, 0.9, 0.3); K.frame(C, g1, T.photo('bridge', '#c8a050', 0.3, 0.24), 56.75, Y1 + 0.87, 143.5, 'e', 0.3, 0.24); }
  C.decal(g1, T.mirror(0.6, 0.8), 56.215, Y1 + 1.15, 143.1, 'e', 0.6, 0.8, { off: 0.012 });
  { const R = rig(C, g1, 1, 's', 61.55, 141.2, 62.95, 141.8); K.table(R, { w: 1.4, d: 0.6, h: 0.74, col: '#c89a62' }); R.box(S('#f4f0ea'), 0.4, 0.74, 0.15, 0.95, 0.98, 0.4); R.box(S('#f4f0ea'), 0.4, 0.98, 0.15, 0.9, 1.04, 0.28); R.box(S('#e8705a'), 0.42, 0.74, 0.42, 1.3, 0.76, 0.58); R.box(S('#9cc4b4'), 1.0, 0.74, 0.1, 1.25, 0.84, 0.3); }
  chair(C, g1, 'n', 62.0, 142.2, '#c89a62', '#e8a0b0');
  plant(rig(C, g1, 1, 's', 63.4, 141.25, 64.2, 141.95), 0.4, 0.35, { kind: 'tall', s: 0.9 });
  C.decal(wP2, T.painting(), 59.5, Y1 + 1.4, 146.06, 'n', 1.0, 0.6, { off: 0.01 });

  // ---------------------------------------------------------------- landing study (first floor, east)
  K.floor(C, g1, T.runner('#3a5a7a', '#e8c890'), 66.0, 143.2, 67.0, 151.3, Y1 + 0.03);
  { const R = rig(C, g1, 1, 's', 66.9, 141.2, 68.4, 141.85); K.desk(R, { w: 1.5, d: 0.65, col: '#7a5236', drawers: '#e6f0da' });
    R.box(S('#c8a050'), 0.2, 0.74, 0.25, 0.3, 0.78, 0.35); R.box(S('#c8a050'), 0.24, 0.78, 0.28, 0.26, 0.9, 0.32); R.box(S('#4a8ad8'), 0.12, 0.9, 0.18, 0.38, 1.12, 0.42); R.box(S('#6ab04a'), 0.18, 0.96, 0.18, 0.3, 1.06, 0.43);   // globe
    R.box(S('#f4f0ea'), 0.6, 0.74, 0.3, 1.1, 0.77, 0.6); R.box(S('#c8402a'), 0.7, 0.77, 0.38, 0.95, 0.85, 0.48); R.box(S('#f4f0ea'), 0.82, 0.85, 0.42, 0.84, 1.05, 0.44);   // ship model
    K.tableLamp(R, 1.3, 0.74, 0.2, { base: '#3a5a7a', shade: '#f8f0d0', s: 0.09 }); }
  chair(C, g1, 'n', 67.4, 142.2, '#7a5236', '#cadcb4');
  C.decal(g1, T.corkboard(), 67.65, Y1 + 1.15, 141.21, 's', 0.9, 0.6, { off: 0.01 });
  K.bookshelf(rig(C, g1, 1, 's', 65.95, 141.2, 66.8, 141.55), { h: 1.7, col: '#7a5236', seed: 11 });
  C.decal(g1, T.poster('surf'), 68.6, Y1 + 1.3, 141.21, 's', 0.7, 0.95, { off: 0.01 });
  plant(rig(C, g1, 1, 's', 69.1, 146.6, 69.7, 147.2), 0.3, 0.3, { kind: 'tall', s: 1.0 });
  { const R = rig(C, g1, 1, 'e', 64.44, 150.2, 64.94, 151.65); K.cabinet(R, { w: 1.45, d: 0.5, h: 1.0, col: '#f4ece0', n: 2, drawer: true }); R.box(T.knit('#9cc4b4'), 0.15, 1.0, 0.1, 0.6, 1.12, 0.4); R.box(T.knit('#e8a0b0'), 0.18, 1.12, 0.12, 0.58, 1.22, 0.38); plant(R, 1.1, 0.25, { y: 1.0, s: 0.55, kind: 'flower', block: false }); }
  K.frame(C, wP1b, T.photo('fog', '#6a4428', 0.5, 0.36), 64.44, Y1 + 1.55, 150.9, 'e', 0.5, 0.36);
  C.box(g1, T.knit('#d8c8a0'), 69.2, Y1, 151.1, 69.7, Y1 + 0.5, 151.6); C.nav.block(69.15, 151.05, 69.75, 151.65, 1);
  K.sofa(rig(C, g1, 1, 's', 68.35, 148.4, 69.65, 149.3), { col: '#9cc4b4', seats: 1, w: 1.3, pillow: '#f2d68a', pillows: true });
  K.tableLamp(rig(C, g1, 1, 's', 68.4, 149.6, 68.9, 150.1), 0.25, 0, 0.25, { base: '#6a4428', s: 0.13 });
  C.box(g1, T.wood('#6a4428'), 68.5, Y1, 149.7, 68.8, Y1 + 0.02, 150.0); C.nav.block(68.45, 149.65, 68.85, 150.05, 1);

  // ---------------------------------------------------------------- Mom
  C.npc({ id: 'mom', who: 'mom', name: 'Mom', x: 60.5, z: 142.35, yaw: 0.55, L: 0, lines: W.MOM });

  // ---------------------------------------------------------------- interactables (ground floor)
  const I = (o) => C.interact({ r: 1.2, ...o });
  I({ x: 57.0, z: 148.8, label: 'Watch TV', icon: 'tv', act: async (app) => {
    const tv = st.tv;
    if (tv.ch) { const k = await app.choose(`Channel ${tv.ch}: ${W.TV[tv.ch - 1][0]}`, ['Next channel', 'Keep watching', 'Turn it off']); if (k === 2) { tv.ch = 0; sfx(app, 'ui_back'); return; } if (k === 0) tv.ch = (tv.ch % W.TV.length) + 1; }
    else tv.ch = 1;
    sfx(app, 'ui_tap');
    const [title, ...sets] = W.TV[tv.ch - 1]; tv.n = (tv.n || 0) + 1;
    app.toast(title, { icon: 'tv' });
    await app.say('', ...sets[tv.n % sets.length]);
  } });
  I({ x: 59.55, z: 149.0, label: 'Sit on the sofa', icon: 'heart', act: async (app) => { sfx(app, 'cloth'); await app.say('', W.pick(['You sink into the sofa. The cushion remembers exactly where you sit.', 'You find a coin, a hair tie and a dried-up fry between the cushions. Classic sofa.', 'Ahh. Five more minutes. ...Okay, ten.'])); } });
  I({ x: 57.0, z: 150.8, label: 'Read a book', icon: 'book', act: async (app) => { const b = W.BOOKS[st.book++ % W.BOOKS.length]; sfx(app, 'page'); await app.say('', `You pull out "${b[0]}".`, ...b.slice(1)); } });
  I({ x: 56.9, z: 148.85, y: 1.8, label: 'Look at the photos', icon: 'eye', act: async (app) => { const L = [
    ['A photo of Ocean Beach on a rare clear day. The sand still has paw prints in it if you squint.'],
    ['An egg in a nest of blankets — the day your partner hatched. Mom labelled it "BIG DAY!!!" with three exclamation marks.'],
    ['The house the week you moved in. The siding was a very different green. Mom calls it "the avocado era".'],
    ['Dad\'s research ship, the Fogbreaker, leaving the harbour. He wrote "back by spring" on the back. Then crossed out spring and wrote "summer".']];
    await app.say('', ...L[st.photo++ % L.length]); } });
  I({ x: 60.3, z: 150.95, label: 'Lamp', icon: 'hand', act: async (app) => { lampT.set(!lampT.on); sfx(app, 'ui_tap', { pitch: lampT.on ? 1.2 : 0.8 }); app.toast(lampT.on ? 'Lamp on. Cosy.' : 'Lamp off.', { icon: 'sun' }); } });
  const STATIONS = [['lofi', 'Sunset Lo-Fi 88.1'], ['lofi2', 'Night Owl Beats 92.5'], ['city', 'Downtown Drive 101.3'], ['vibes', 'Garage Grooves 97.7'], ['lemon', 'Lemon Pop FM'], ['senbazuru', 'Paper Crane Classics']];
  I({ x: 62.2, z: 147.3, label: 'Radio', icon: 'music', act: async (app) => { st.radio = (st.radio + 1) % STATIONS.length; const [id, name] = STATIONS[st.radio]; sfx(app, 'ui_tap'); if (app.audio && app.audio.music) app.audio.music(id, { fade: 1 }); app.toast('♪ ' + name, { icon: 'music' }); } });
  I({ x: 62.5, z: 147.0, y: 1.8, label: 'Painting', icon: 'eye', act: async (app) => app.say('', 'A painting of Sunset Row at golden hour, every house a different colour. Mom painted it the first summer here.', 'Our house is the green one. She made it a little bigger than it really is. Artistic licence.') });
  I({ x: 56.95, z: 151.2, label: 'Water the plant', icon: 'drop', act: async (app) => {
    const F = flags(app);
    if (!F.sr_plant) { F.sr_plant = day(app); wilt.set(false); perky.set(true); sfx(app, 'bubble'); app.toast('The plant perks right up!', { icon: 'leaf' }); await app.say('', 'You give the droopy plant a big drink. It straightens up and pops out a flower, as if to say "finally".'); if (app.save) app.save(); }
    else await app.say('', W.pick(['The plant is thriving. It looks at you with something like gratitude. Plants can do that, right?', 'Still perky! It even leans toward you a little when you walk past.'])); } });
  I({ x: 57.4, z: 142.4, label: 'Open the fridge', icon: 'fridge', act: async (app) => {
    const F = flags(app), d = day(app);
    sfx(app, 'door', { vol: 0.4, pitch: 1.3 });
    if (F.sr_fridge === d) { await app.say('', W.pick(['Leftovers, mustard, and a note in Mom\'s writing: "ONE snack per day. I counted."', 'The fridge hums at you. You already had your snack today. The fridge knows.'])); return; }
    F.sr_fridge = d;
    const SN = [['ramune', 'Ramune Soda'], ['lemon_tart', 'Lemon Tart'], ['ice_cream', 'Soft-Serve']], [id, nm] = SN[d % SN.length];
    if (app.state && app.state.bag && typeof app.state.bag === 'object') { app.state.bag[id] = (app.state.bag[id] || 0) + 1; sfx(app, 'reward'); app.toast(`Got a ${nm}!`, { icon: 'bag' }); await app.say('', `You grab a ${nm} for later. There is a sticky note on it: "for my favourite tamer".`); if (app.save) app.save(); }
    else await app.say('', `You grab a ${nm} and eat it right there in front of the open fridge, like a true professional.`);
  } });
  I({ x: 59.55, z: 142.3, label: 'Stove', icon: 'flame', act: async (app) => { const L = W.MOM_STOVE[(st.stove = ((st.stove ?? -1) + 1)) % W.MOM_STOVE.length]; await app.say('Mom', ...L); } });
  I({ x: 58.4, z: 142.25, label: 'Sink', icon: 'drop', act: async (app) => { sfx(app, 'bubble'); await app.say('', W.pick(['You wash your hands. From somewhere behind you: "With SOAP, please."', 'You pour a glass of water and drink it at the window. Somebody\'s Pidgun is sitting on the fence, judging you.', 'There is one spoon in the sink. You wash it. Mom will never know what a hero you were.'])); } });
  I({ x: 60.7, z: 142.3, label: 'Rice cooker', icon: 'bowl', act: async (app) => { sfx(app, 'notification', { pitch: 1.3 }); await app.say('', '♪ Doo-dee-doo! The rice cooker plays its little song.', 'Rice ready in 12 minutes. It has said 12 minutes for the last 40 minutes. It is doing its best.'); } });
  I({ x: 58.7, z: 144.95, label: 'Fruit bowl', icon: 'hand', act: async (app) => { await app.say('', W.pick(['Apples, a banana, and one lemon nobody remembers buying. The lemon has seen things.', 'You take an apple and polish it on your sleeve. Crunch. Perfect.'])); } });
  I({ x: 56.8, z: 143.6, y: 1.55, label: 'Calendar', icon: 'clock', act: async (app) => {
    const d = day(app), DN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    await app.say('', `Day ${d}. It's a ${DN[(d + 5) % 7]}. Today's square says: "${['League signups — GO!', 'Soup for Mrs. Ochoa', 'Garden club 10AM', 'Laundry (yes, YOURS)', 'Call Dad!', 'Groceries + ginger', 'Nothing! Rest day!'][d % 7]}"`); } });
  I({ x: 56.8, z: 145.5, y: 1.95, label: 'Clock', icon: 'clock', act: async (app) => { const h = (app.state && app.state.time && app.state.time.hour) ?? 9; await app.say('', `The kitchen clock says it's about ${((Math.round(h) + 11) % 12) + 1} o'clock. It runs five minutes fast. It has run five minutes fast since before you were born.`); } });
  I({ x: 68.8, z: 147.0, label: 'Shoe bench', icon: 'shoe', act: async (app) => app.say('', 'Mom\'s gardening boots, your sneakers, and one tiny sock that belongs to nobody in this family.', 'Your jacket is on its hook. The red one. Iconic. No need to change.') });
  I({ x: 64.95, z: 151.2, y: 1.7, label: 'Hall mirror', icon: 'eye', act: async (app) => { const { name } = W.who(app); await app.say('', `Quick check before heading out. ${name}: ready for anything. Probably.`); } });
  I({ x: 66.5, z: 142.4, label: 'Mirror', icon: 'eye', act: async (app) => { const { name, kind } = W.who(app), L = W.MIRROR(name, kind); await app.say('', ...L[(st.mirror = ((st.mirror ?? -1) + 1)) % L.length]); } });
  I({ x: 68.4, z: 142.6, label: 'Bath', icon: 'drop', act: async (app) => { sfx(app, 'boing', { vol: 0.6 }); await app.say('', 'A rubber Foopod sits in the empty tub, fists raised, ready to fight the tide.', 'You squeeze it. It squeaks with tremendous courage.'); } });

  // ---------------------------------------------------------------- interactables (first floor)
  const I1 = (o) => C.interact({ r: 1.2, L: 1, ...o });
  I1({ x: 57.3, z: 150.05, label: 'Rest in bed', icon: 'bed', act: async (app) => {
    const k = await app.choose('Your bed. The quilt Mom made. Take a rest?', ['Rest a while', 'Not now']);
    if (k !== 0) return;
    sfx(app, 'cloth');
    if (app.fade) await app.fade(1, 600);
    const party = (app.state && Array.isArray(app.state.party)) ? app.state.party : [];
    for (const m of party) { if (typeof m.maxHp === 'number') m.hp = m.maxHp; else if (typeof m.hp === 'number') m.hp = 1; if (m.status) m.status = null; if (typeof m.energy === 'number' && typeof m.maxEnergy === 'number') m.energy = m.maxEnergy; }
    if (app.wait) await app.wait(900);
    if (app.save) app.save();
    if (app.fade) await app.fade(0, 600);
    if (app.audio && app.audio.jingle) app.audio.jingle('complete');
    app.toast(party.length ? 'Your team is fully rested!' : 'You feel fully rested!', { icon: 'heart' });
    await app.say('', W.pick(['You wake up to birdsong and the smell of toast. Everyone is bright-eyed and ready to go.', 'A perfect nap. Your partner is curled up on your feet, snoring softly. Fully recharged!']));
  } });
  I1({ x: 58.55, z: 147.4, label: 'Use the PC', icon: 'pc', act: async (app) => {
    const k = await app.choose('The PC whirrs awake. The desktop wallpaper is a fire chick. Of course it is.', ['Save game', 'Check mail', 'Log off']);
    if (k === 0) { if (app.save) app.save(); sfx(app, 'ui_confirm'); app.toast('Game saved', { icon: 'save' }); await app.say('', 'Your adventure log is saved. The fan sighs with relief.'); }
    else if (k === 1) { const m = W.MAIL[st.mail++ % W.MAIL.length]; sfx(app, 'notification'); await app.say('', ...m); }
  } });
  I1({ x: 62.1, z: 147.25, label: 'Play video games', icon: 'play', act: async (app) => {
    const k = await app.choose('The console blinks. Play something?', [...W.GAMES.map((g) => g[0]), 'Maybe later']);
    if (k < 0 || k >= W.GAMES.length) return;
    st.game.on = true; sfx(app, 'gacha');
    await app.say('', `You boot up ${W.GAMES[k][0]}...`, W.pick(W.GAMES[k][1]));
    st.game.on = false;
  } });
  I1({ x: 60.3, z: 147.0, label: 'Comics shelf', icon: 'book', act: async (app) => { const b = W.COMICS[st.comic++ % W.COMICS.length]; sfx(app, 'page'); await app.say('', `"${b[0]}"`, ...b.slice(1)); } });
  I1({ x: 56.9, z: 147.2, label: 'Wardrobe', icon: 'hand', act: async (app) => { sfx(app, 'cloth'); await app.say('', W.pick(['Shirts, hoodies, and the scarf Grandma knitted that is technically three scarves sewn together.', 'Everything is folded. Mom was here. You will never be able to fold like this.']), 'Your outfit is already perfect for the city. No need to change.'); } });
  I1({ x: 58.7, z: 147.0, y: 2.2, label: 'Poster', icon: 'eye', act: async (app) => {
    const L = [['A big poster of a fire chick bursting out of a sunset. It just says "HOT!". You have never needed it to say more.'], ['The official League poster. Somewhere under the gold cup you wrote, very small: "me, someday".'], ['A ringed planet from the science museum gift shop. You got it the day you decided to be an astronaut. That lasted one week.'], ['"The Foghorns — Live at the Pier". You were too young to go. You have been told it was "loud". You believe it.']];
    await app.say('', ...L[st.poster++ % L.length]); } });
  I1({ x: 58.6, z: 151.0, label: 'Window seat', icon: 'eye', act: async (app) => { await app.say('', 'You curl up in the window seat. Sunset Row stretches down the hill — pastel houses, the little park, a Pidgun stealing a fry from a bin.', W.pick(['The fog is rolling in over the hilltop like a slow, soft wave.', 'Somebody across the street is practising the trumpet. Badly. Lovingly.'])); } });
  I1({ x: 58.8, z: 151.0, label: 'Plush chick', icon: 'heart', r: 0.7, act: async (app) => { sfx(app, 'boing'); await app.say('', 'SQUEAK! Your plush fire chick. Its stitching is coming loose on one wing from years of hugs.'); } });
  I1({ x: 62.1, z: 147.2, y: 2.4, label: 'Trophy shelf', icon: 'star', act: async (app) => app.say('', 'Capsule toys from every summer festival, a "Participant" ribbon from the Junior Tokon Fair, and a little gold cup.', 'The cup says WORLD\'S OKAYEST TAMER. Mom had it engraved. You pretend to hate it.') });
  I1({ x: 60.3, z: 150.6, label: 'Plush bear', icon: 'heart', r: 0.9, act: async (app) => { sfx(app, 'boing', { pitch: 0.8 }); await app.say('', 'A plush bear cub in a tiny bow tie. It has guarded this room every night since you were four. Undefeated.'); } });
  I1({ x: 56.95, z: 150.6, y: 1.6, label: 'Window', icon: 'eye', act: async (app) => app.say('', 'Out the side window: the neighbour\'s laundry line, a lemon tree, and the corner of Lark Lane where it drops down toward Market Street.') });
  I1({ x: 59.5, z: 144.2, label: 'Mom\'s quilt', icon: 'heart', act: async (app) => app.say('', 'Mom\'s bed, made with hospital corners. On the pillow: a library book called "Tamer Moms: You Are Doing Great". It is bookmarked halfway.') });
  I1({ x: 62.2, z: 142.3, label: 'Sewing table', icon: 'hand', act: async (app) => app.say('', 'Mom\'s sewing machine and a half-finished patch: a little flame. It is shaped exactly like your partner\'s crest.', 'There is a note pinned to it: "for the jacket — SURPRISE (don\'t look)". ...You did not see that.') });
  I1({ x: 57.1, z: 143.1, label: 'Dresser', icon: 'eye', act: async (app) => app.say('', 'A framed photo of the Golden Gate at sunset — Mom and Dad\'s first trip together, she says. A bottle of rose hand cream. A spare hair ribbon.') });
  I1({ x: 67.65, z: 142.3, y: 1.6, label: 'Postcards', icon: 'eye', act: async (app) => { const L = [
    ['Postcard: "Greetings from the Arctic Shelf! A Coolpillar sat on my boot for an hour. I did not move. Science. — Dad"'],
    ['Postcard: "The sea Tokonmon here glow at night. The whole ocean looks like a city. Wish you could see it. — Dad"'],
    ['Postcard: "Tell your mother her curry recipe has been requested by the whole crew. I said it is classified. — Dad"']];
    await app.say('', ...L[st.card++ % L.length]); } });
  I1({ x: 67.2, z: 142.4, label: 'Spin the globe', icon: 'hand', act: async (app) => { sfx(app, 'whoosh', { vol: 0.5 }); await app.say('', `You spin the globe and stop it with a finger... ${W.pick(['the middle of the Pacific. A long swim.', 'a tiny island with a big Tokonmon reserve. Noted.', 'San Francisco. Home. The globe knows.', 'Antarctica. Somewhere down there, Dad is probably waving.'])}`); } });
  I1({ x: 67.0, z: 153.0, label: 'Enjoy the view', icon: 'eye', act: async (app) => { sfx(app, 'furin', { vol: 0.5 }); await app.say('', 'From the balcony you can see right down Sunset Row: the park, the community garden, Mr. Park sweeping in front of the Corner Market.', W.pick(['A cable car bell rings somewhere far below. The fog is still deciding whether to come in.', 'A Pidgun lands on the railing, looks you dead in the eye, and leaves. Rude.'])); } });
  return B;
}

// ======================================================================== exterior details
function exterior(C, B, c) {
  const f0 = B.gk(0, 'front'), f1 = B.gk(1, 'front'), roof = `b${B.id}:roof`, trim = S(c.cream), wallTex = c.wallTex;
  // stacked canted bay windows under the front gable
  K.bay(C, f0, 59.6, 152, 0.32, 2.8, { wall: wallTex, trim, win: TX.windowTex('#f6f0e2', '#e8705a', C.night), side: TX.windowTex('#f6f0e2', '#e8705a', C.night) });
  C.box(f0, S('#7a6a72'), 58.05, 0, 152, 61.15, 0.32, 152.66);
  K.bay(C, f1, 59.6, 152, 3.15, 5.65, { wall: wallTex, trim, win: TX.windowTex('#f6f0e2', '#7ab0d8', C.night), side: TX.windowTex('#f6f0e2', '#7ab0d8', C.night) });
  C.box(f0, trim, 58.0, 2.8, 151.98, 61.2, 2.92, 152.7); C.quad(f0, TX.shingles(c.plum), [57.95, 2.92, 152.74], [61.25, 2.92, 152.74], [61.25, 3.25, 152.0], [57.95, 3.25, 152.0]); C.tri(f0, trim, [57.95, 2.92, 152.74], [57.95, 3.25, 152.0], [57.95, 2.92, 152.0]); C.tri(f0, trim, [61.25, 2.92, 152.74], [61.25, 2.92, 152.0], [61.25, 3.25, 152.0]);
  C.nav.block(58.05, 152.0, 61.15, 152.7, 0);
  // brackets under the upper bay
  for (const x of [58.4, 60.8]) C.box(f0, trim, x - 0.06, 2.55, 152.0, x + 0.06, 2.8, 152.5);
  // cornice along the top of the façade and the front gable with fish-scale shingles
  C.box(f1, trim, 55.9, 5.5, 152.0, 70.1, 6.0, 152.22, { s: T.cornice(c.cream) });
  const ga = [55.95, 6.0, 152.02], gb = [63.25, 6.0, 152.02], gc = [59.6, 8.95, 152.02];
  C.tri(roof, T.fishscale(c.butter), ga, gb, gc);
  const rt = TX.shingles(c.plum);
  C.quad(roof, rt, [55.5, 5.85, 152.47], [59.6, 9.02, 152.47], [59.6, 9.02, 146.6], [55.5, 5.85, 146.6]);
  C.quad(roof, rt, [63.7, 5.85, 152.47], [59.6, 9.02, 152.47], [59.6, 9.02, 146.6], [63.7, 5.85, 146.6]);
  // barge boards along the rakes and a little finial
  C.quad(roof, trim, [55.5, 5.62, 152.49], [59.6, 8.8, 152.49], [59.6, 9.04, 152.49], [55.5, 5.86, 152.49]);
  C.quad(roof, trim, [59.6, 8.8, 152.49], [63.7, 5.62, 152.49], [63.7, 5.86, 152.49], [59.6, 9.04, 152.49]);
  C.box(roof, S(c.berry), 59.52, 9.0, 152.38, 59.68, 9.45, 152.54);
  C.decal(roof, T.atticWin(c.cream, '#4a6a8a'), 59.6, 6.45, 152.02, 's', 0.8, 0.9, { off: 0.01 });
  C.box(roof, trim, 59.1, 6.38, 152.0, 60.1, 6.45, 152.14);
  // a ridge cap on the main roof
  C.box(roof, S(c.plum), 55.55, 8.98, 146.42, 70.45, 9.1, 146.58);
  // the chimney
  C.box(roof, TX.brick('#b0604a', '#e0d0c0'), 66.6, 7.0, 143.4, 67.4, 10.0, 144.2, { top: S('#5a4a4a') }); C.box(roof, S('#8a4a3a'), 66.5, 9.8, 143.3, 67.5, 10.0, 144.3);
  // porch with a balcony on top
  C.box('ground', T.wood('#c89a62'), 65.25, 0, 152.0, 68.75, 0.12, 154.0, { top: TX.planks('#c89a62') });
  C.nav.height(65.25, 152.0, 68.75, 154.0, 0, 0.12);
  for (const x of [65.4, 68.6]) { C.box(f0, trim, x - 0.11, 0.12, 153.69, x + 0.11, 0.35, 153.91); C.box(f0, trim, x - 0.07, 0.35, 153.73, x + 0.07, 2.62, 153.87); C.box(f0, trim, x - 0.11, 2.62, 153.69, x + 0.11, 2.82, 153.91); C.nav.block(x - 0.12, 153.68, x + 0.12, 153.92, 0); }
  C.box(f0, trim, 65.2, 2.82, 151.98, 68.8, 3.0, 153.98, { top: TX.planks('#b8834e'), bottom: true });
  C.box(f0, T.cornice(c.cream), 65.2, 2.5, 153.86, 68.8, 2.82, 153.96);
  for (let x = 65.6; x < 68.5; x += 0.42) C.box(f0, trim, x - 0.03, 2.4, 153.86, x + 0.03, 2.5, 153.92);
  // porch lamp, house number, doorbell
  C.box(f0, S('#3a3a44'), 67.42, 1.75, 152.0, 67.58, 2.1, 152.12); C.box(f0, T.lampShade('#fff0c0'), 67.44, 1.8, 152.05, 67.56, 2.0, 152.17);
  C.decal(f0, T.houseNum('17'), 65.75, 1.9, 152.0, 's', 0.42, 0.2, { off: 0.03 });
  C.box(f0, S('#c8a050'), 67.4, 1.18, 152.0, 67.48, 1.28, 152.04);
  // balcony railing (first floor, over the porch)
  const g1 = B.gk(1, 'in'), rail = trim;
  C.box(g1, rail, 65.25, 3.0, 153.8, 68.75, 3.06, 153.9); C.box(g1, rail, 65.22, 3.9, 153.78, 68.78, 3.98, 153.92);
  C.box(g1, rail, 65.22, 3.0, 152.0, 65.32, 3.98, 153.9); C.box(g1, rail, 68.68, 3.0, 152.0, 68.78, 3.98, 153.9);
  C.box(g1, rail, 65.24, 3.9, 152.0, 65.3, 3.98, 153.9); C.box(g1, rail, 68.7, 3.9, 152.0, 68.76, 3.98, 153.9);
  for (let x = 65.42; x < 68.65; x += 0.15) C.box(g1, rail, x - 0.02, 3.06, 153.82, x + 0.02, 3.9, 153.88);
  for (let z = 152.15; z < 153.8; z += 0.15) { C.box(g1, rail, 65.25, 3.0, z - 0.02, 65.29, 3.9, z + 0.02); C.box(g1, rail, 68.71, 3.0, z - 0.02, 68.75, 3.9, z + 0.02); }
  for (const [x, col] of [[65.7, '#e8705a'], [68.3, '#f2d68a']]) { C.box(g1, T.terracotta(), x - 0.14, 3.0, 153.45, x + 0.14, 3.26, 153.73); C.box(g1, T.leaves('#4a8a42'), x - 0.16, 3.26, 153.42, x + 0.16, 3.45, 153.76); C.box(g1, S(col), x - 0.05, 3.42, 153.55, x + 0.05, 3.5, 153.65); }
  // the balcony door painted on the upstairs front wall (you walk through it from inside)
  C.decal(f1, TX.doorTex(c.cream, 'glass'), 67.6, 3.0, 152.0, 's', 1.0, 2.2, { off: 0.03 });
  C.box(f1, trim, 66.95, 5.2, 152.0, 68.25, 5.32, 152.12);
}
// ======================================================================== garden, back yard, mailbox
function garden(C, B, st) {
  const hedge = T.hedge('#4a8a42'), picket = T.picket('#f6f0e2'), trim = S('#f6f0e2');
  // front garden: hedge along the sidewalk with a gate, a flagstone path, flower beds, a little lawn
  const hedgeRun = (x0, z0, x1, z1, h = 0.85) => { C.box('props', hedge, x0, 0, z0, x1, h, z1); C.nav.block(x0, z0, x1, z1, 0); };
  hedgeRun(54.2, 155.45, 66.05, 155.95); hedgeRun(67.45, 155.45, 72.4, 155.95);
  for (const x of [65.95, 67.55]) { C.box('props', trim, x - 0.1, 0, 155.6, x + 0.1, 1.15, 155.8); C.box('props', S('#b04a64'), x - 0.12, 1.15, 155.58, x + 0.12, 1.22, 155.82); }
  C.box('props', picket, 66.05, 0.15, 155.0, 66.12, 0.85, 155.65); C.nav.block(66.0, 155.0, 66.15, 155.6, 0);
  K.floor(C, 'ground', T.flagstone('#d8ccb8'), 66.15, 154.0, 67.35, 156.0, 0.015);
  for (const [x0, x1] of [[56.2, 58.0], [61.2, 65.1]]) { C.box('props', S('#8a6a52'), x0, 0, 152.1, x1, 0.18, 152.95, { top: T.flowers('#5a9a4a', x0 | 0) }); C.nav.block(x0, 152.1, x1, 152.95, 0); }
  C.box('props', S('#8a6a52'), 69.0, 0, 152.1, 69.9, 0.18, 153.6, { top: T.flowers('#5a9a4a', 3) }); C.nav.block(69.0, 152.1, 69.9, 153.6, 0);
  const gnome = (x, z) => { C.box('props', S('#4a6ab0'), x - 0.08, 0.18, z - 0.06, x + 0.08, 0.36, z + 0.06); C.box('props', S('#f0c8a0'), x - 0.06, 0.36, z - 0.05, x + 0.06, 0.45, z + 0.05); C.box('props', S('#f4f0ea'), x - 0.06, 0.32, z + 0.03, x + 0.06, 0.4, z + 0.07); C.box('props', S('#e8473a'), x - 0.07, 0.45, z - 0.06, x + 0.07, 0.52, z + 0.06); C.box('props', S('#e8473a'), x - 0.03, 0.52, z - 0.03, x + 0.03, 0.62, z + 0.03); };
  gnome(62.3, 152.6);
  // the mailbox on a post by the gate
  C.box('props', T.wood('#f6f0e2'), 65.42, 0, 155.08, 65.52, 1.0, 155.18);
  C.box('props', S('#2a5a7a'), 65.25, 1.0, 154.95, 65.69, 1.28, 155.32); C.decal('props', T.mailboxFront('#2a5a7a'), 65.47, 1.0, 155.32, 's', 0.4, 0.28, { off: 0.004 }); C.box('props', S('#e8473a'), 65.7, 1.08, 155.05, 65.73, 1.42, 155.1);
  C.nav.block(65.35, 155.0, 65.6, 155.25, 0);
  // side yard (east): bins, a bike, the side gate; side yard (west): a strip of lawn and a lemon tree
  C.prop('bin', 71.6, 147.2); C.prop('bin', 71.6, 148.0, { yaw: 0.3 });
  C.box('props', picket, 70.0, 0, 145.9, 72.4, 1.2, 146.0); C.nav.block(70.0, 145.85, 72.4, 146.05, 0);
  for (const [x0, z0, x1, z1] of [[72.4, 136.2, 72.5, 155.45], [54.1, 136.2, 54.2, 155.45]]) { C.box('props', picket, x0, 0, z0, x1, 1.2, z1); C.nav.block(x0 - 0.05, z0, x1 + 0.05, z1, 0); }
  bike(C, 71.2, 150.5);
  C.prop('tree', 55.0, 153.9, { s: 0.7 });
  // back yard: picket fence with a gate onto Cypress Lane, a vegetable bed, the clothesline, a shed, a bench, a birdbath
  for (const [x0, x1] of [[54.1, 61.2], [62.3, 72.5]]) { C.box('props', picket, x0, 0, 136.15, x1, 1.2, 136.25); C.nav.block(x0, 136.1, x1, 136.3, 0); }
  for (const x of [61.2, 62.3]) C.box('props', trim, x - 0.07, 0, 136.12, x + 0.07, 1.35, 136.28);
  K.floor(C, 'ground', T.flagstone('#d8ccb8'), 61.25, 136.3, 62.25, 141.0, 0.015);
  C.box('props', T.wood('#8a5a36'), 55.0, 0, 137.0, 58.4, 0.35, 139.2, { top: T.soil('#5a3a28') }); C.nav.block(55.0, 137.0, 58.4, 139.2, 0);
  for (let x = 55.3; x < 58.2; x += 0.45) for (const z of [137.5, 138.3, 138.9]) { C.box('props', T.leaves('#5aa04a'), x - 0.14, 0.35, z - 0.14, x + 0.14, 0.62, z + 0.14); if ((x * 10 | 0) % 3 === 0) C.box('props', S('#e8473a'), x - 0.05, 0.45, z + 0.1, x + 0.05, 0.55, z + 0.16); }
  for (const x of [63.4, 68.6]) { C.box('props', T.wood('#8a6a52'), x - 0.05, 0, 138.4, x + 0.05, 1.9, 138.5); C.box('props', T.wood('#8a6a52'), x - 0.05, 1.8, 138.0, x + 0.05, 1.9, 138.9); C.nav.block(x - 0.1, 138.35, x + 0.1, 138.55, 0); }
  C.box('props', S('#e8e4dc'), 63.45, 1.84, 138.44, 68.55, 1.86, 138.46);
  for (const [x0, x1, col] of [[63.9, 64.8, '#f4f0ea'], [65.0, 65.6, '#9cc4b4'], [65.9, 66.9, '#e8a0b0'], [67.2, 67.8, '#f2d68a'], [68.0, 68.4, '#7ab0d8']]) C.box('props', T.fabric(col), x0, 1.05 + (x1 - x0) * 0.3, 138.43, x1, 1.85, 138.47);
  // the shed
  C.building({ x: 69.4, z: 136.6, w: 2.8, d: 2.4, floors: 1, fh: 2.3, wall: T.siding('#b8d8c8'), trim: '#f6f0e2', base: '#7a6a72', roof: { type: 'gable', ridge: 'x', h: 0.9, eave: 0.2, tex: TX.shingles('#5a4a6a') }, door: { side: 's', at: 0.35, col: '#b04a64', label: 'Garden shed', act: async (app) => app.say('', 'The garden shed. Rakes, a watering can, three flowerpots, and a box marked "DAD\'S FISHING STUFF — DO NOT".', 'You do not.') }, windows: { every: 3, skip: ['n', 'w'] }, mm: '#a8c8b8' });
  C.prop('bench', 57.0, 140.4, { yaw: Math.PI });
  C.box('props', S('#c8c4bc'), 59.4, 0, 138.8, 59.8, 0.7, 139.2); C.box('props', S('#c8c4bc'), 59.0, 0.7, 138.4, 60.2, 0.82, 139.6); C.box('props', TX.water('#6ab0e0'), 59.1, 0.78, 138.5, 60.1, 0.83, 139.5); C.nav.block(59.0, 138.4, 60.2, 139.6, 0);

  // ---------------------------------------------------------------- outdoor interactables
  const I = (o) => C.interact({ r: 1.3, ...o });
  const LETTERS = [
    ['A Sunset Row newsletter. "Community garden meeting Thursday. Bring gloves. The zucchini situation is escalating."'],
    ['A coupon from the Corner Market: 10% off any ramune. Handwritten underneath: "except Mystery. Mystery is full price. — Mr. Park"'],
    ['A postcard from Dad! The picture is a glowing jellyfish Tokonmon. On the back: "Saw this and thought of your nightlight. Love, Dad."'],
    ['A flyer: "LOST: one (1) Trashcoon. Answers to Mister Lid. Do NOT give it pizza." The drawing was clearly done by a kid.'],
  ];
  I({ x: 65.45, z: 154.55, label: 'Check the mailbox', icon: 'door', mm: true, act: async (app) => { sfx(app, 'page'); await app.say('', ...LETTERS[st.letter++ % LETTERS.length]); } });
  I({ x: 67.6, z: 152.75, label: 'Ring the doorbell', icon: 'bell', act: async (app) => { sfx(app, 'doorbell'); if (app.wait) await app.wait(500); await app.say('Mom', W.pick(['It is open, sweetheart! You live here!', 'Coming! ...Oh, it is you. Did you forget your key again?', 'If that is the Pidgun again, we are NOT buying anything!'])); } });
  I({ x: 63.2, z: 153.4, label: 'Flower bed', icon: 'leaf', act: async (app) => app.say('', 'Mom\'s flower bed: marigolds, sweet peas, and a garden gnome that faces a different direction every morning.', 'Nobody in this house moves the gnome. Nobody admits to it, anyway.') });
  I({ x: 56.7, z: 139.7, label: 'Vegetable bed', icon: 'leaf', act: async (app) => app.say('', 'Cherry tomatoes, lettuce, and a pumpkin vine with ambitions of escaping over the fence.', W.pick(['You pick a cherry tomato. Warm from the sun. Perfect.', 'A Pidgun footprint in the soil. The tomatoes have been counted. One is missing.'])) });
  I({ x: 66.0, z: 139.2, label: 'Clothesline', icon: 'hand', act: async (app) => { sfx(app, 'cloth'); await app.say('', 'Sheets snapping in the breeze. One of them is your old Tokon-pattern blanket. Mom refuses to throw it out. Secretly, so do you.'); } });
  I({ x: 59.6, z: 140.0, label: 'Birdbath', icon: 'drop', act: async (app) => app.say('', 'The birdbath. A Pidgun is having a bath in it like it owns the place. It probably thinks it does.') });
}
function chair(C, gk, face, x, z, wood, cush) {
  const w = 0.44, R = rig(C, gk, 0, face, x, z, x + (face === 'e' || face === 'w' ? w : w), z + w, gk.includes(':f1:') ? 3.02 : 0.02);
  if (gk.includes(':f1:')) R.L = 1;
  K.chair(R, { w, d: w, col: wood, cushion: cush, block: true });
}
function plant(R, x, z, o) { K.plant(R, x, z, o); }
function paper(C, gk, side, a0, a1, k, tex) {
  const y0 = k * 3, y1 = y0 + 2.95;
  if (side === 'n') { const z = 141.207; C.quad(gk, tex, [a0, y0, z], [a1, y0, z], [a1, y1, z], [a0, y1, z], { u0: a0, v0: y0 }); }
  else { const x = 56.207; C.quad(gk, tex, [x, y0, a1], [x, y0, a0], [x, y1, a0], [x, y1, a1], { u0: -a1, v0: y0 }); }
}
function bike(C, x, z) {
  const m = S('#3a7ad8'), k = S('#2a2a32');
  for (const dz of [-0.55, 0.55]) { C.box('props', k, x - 0.03, 0, z + dz - 0.3, x + 0.03, 0.6, z + dz + 0.3); C.box('props', S('#c8ccd4'), x - 0.035, 0.25, z + dz - 0.05, x + 0.035, 0.35, z + dz + 0.05); }
  C.box('props', m, x - 0.03, 0.3, z - 0.55, x + 0.03, 0.36, z + 0.55); C.box('props', m, x - 0.03, 0.3, z - 0.2, x + 0.03, 0.75, z - 0.14); C.box('props', k, x - 0.08, 0.75, z - 0.27, x + 0.08, 0.8, z - 0.07);
  C.box('props', m, x - 0.03, 0.36, z + 0.42, x + 0.03, 0.9, z + 0.48); C.box('props', k, x - 0.25, 0.88, z + 0.42, x + 0.25, 0.92, z + 0.48);
  C.nav.block(x - 0.2, z - 0.85, x + 0.2, z + 0.85, 0);
}
