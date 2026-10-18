// Hellcoon — the AC/DC homage, stage 3 ("Highway to Hell"). Dynacoon grown into a hulking road
// demon riding a scrap motorbike he welded out of junk: trash-can-lid wheels, a paint-can engine
// with twin finned cylinders, a red jerry-can tank, a duct-taped seat, rusty pipe exhausts that
// belch fire, ape-hanger bars with a bronze bell hanging between them ("Hells Bells") and a little
// cannon bolted over the front wheel ("For Those About to Rock"), a yellow lightning bolt painted on
// the tank. He has grown real red devil horns and his ringed tail ends in a devil's spade; the tiers
// add a riveted iron helmet (or a studded biker cap) the horns punch through, a long black scarf
// that streams in the wind ("Back in Black") and iron pauldrons or a studded vest. Devil-slit eyes
// glow red-hot under the brim. Homage only.
import { E, seg, bump, wob, wave, key } from '../anim.js';
import {
  PAL, J, P, mirrorCube, rod, furP, bellyP, tuftP, skullP, muzzleP, noseP, jawP, mouthP, tongueP, toothP,
  maskEyes, hairP, tailP, handP, footP, teethP, pipeP, ironP, galvP, lidP, jerryP, seatP, canEngineP, finsP, bronzeP, lensP, jetP, leatherP, chainP, raccoonDrip, DRIP_FX, rig, shift, ramp,
} from './raccoon_parts.js';

const F = PAL.hell;

// ---------------------------------------------------------------- painters
const fur = furP(F, { tips: true });
const furBack = furP(F, { c: shift(F.c, -0.06), top: F.c, bottom: F.deep, tips: true });
const belly = bellyP(F, { cy: 0.6, rx: 0.34, ry: 0.6 });
const chestP = (p, w, h, face, cube) => {
  fur(p, w, h, face, cube);
  if (face !== 'south') return;
  const cx = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const hw = w * (0.14 + 0.14 * (y / h)) - ((x + y) % 3 === 0 ? 1 : 0); if (Math.abs(x - cx) < hw) p.px(x, y, Math.abs(x - cx) > hw - 1.2 ? F.bellyLo : y < 3 ? F.bellyHi : F.belly); }
};
const cheekP = (p, w, h, face) => {
  furP(F, { c: F.cream, top: F.creamHi, bottom: F.creamLo, sx: 5, sy: 4 })(p, w, h, face);
  if (face === 'up') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 5 === 0 ? F.lo : F.c);
  if (face === 'north') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y < h / 2 ? F.c : F.lo);
  if (face === 'east' || face === 'west') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const front = face === 'east' ? x : w - 1 - x, edge = h * 0.45 + (front < w * 0.4 ? 0 : (front - w * 0.4) * 0.5) + (x % 3 === 1 ? 1 : 0); if (y < edge) p.px(x, y, y === 0 ? F.hi : (x + y) % 6 === 0 ? F.lo : F.c); }
};
// eyes at x = ±3.0, y = 33.2 on a 9-unit skull: texels ex 9, ey 13.9
const skull = skullP(F, { ex: 9.6, ey: 13.3, mh: 5.4, scar: true });
const muzzle = muzzleP(F, { bw: 2.2, bt: 1.6 });
const snout = muzzleP(F, { mouth: true, bridge: false });
const nose = noseP(F), jaw = jawP(F), hand = handP(F), foot = footP(F);
const sock = (k) => (p, w, h, face, cube) => {
  fur(p, w, h, face, cube);
  if (face === 'up' || face === 'down') return;
  const y0 = Math.round(h * (1 - k));
  for (let y = y0; y < h; y++) for (let x = 0; x < w; x++) { if (y === y0 && x % 3 === 1) continue; p.px(x, y, ramp([F.pawHi, F.paw, F.paw, F.pawLo], (y - y0) / Math.max(1, h - y0), x, y)); }
};
const iron = ironP(), ironRiv = ironP({ rivets: true }), ironRust = ironP({ rivets: true, rust: true });
const galv = galvP(), galvRidge = galvP({ ridges: true, dents: true });
// red devil horns: lacquered red, darker toward the tip
const hornP = (k) => (p, w, h, face) => { const base = [J.devilHi, J.devil, J.devilLo, J.devilDeep][k]; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? shift(base, 0.12) : face === 'down' ? shift(base, -0.25) : ramp([shift(base, 0.15), base, base, shift(base, -0.2)], h > 1 ? y / (h - 1) : 0.5, x, y)); if (face === 'south' && k < 2) p.px(1, 1, '#ff9a8a'); };
// the long black scarf: black wool, a dark grey border, a frayed end
const scarfP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'down' ? '#0e0d12' : (x === 0 || x === w - 1) && (face === 'up' || face === 'down') ? '#4a4852' : (x + y) % 4 === 0 ? '#2a2830' : '#1c1b22'); };
const fringeP = (p, w, h) => { for (let x = 0; x < w; x++) { const l = h - (x % 2) - (x % 3 === 0 ? 1 : 0); for (let y = 0; y < l; y++) p.px(x, y, y === l - 1 ? '#3a3842' : '#1c1b22'); } };
// the devil spade at the tail tip (planes)
const spadeP = (p, w, h) => { const cx = (w - 1) / 2; for (let y = 0; y < h; y++) { const v = y / (h - 1), hw = v < 0.65 ? (v / 0.65) * (w / 2) : (1 - (v - 0.65) / 0.35) * (w / 2) * 0.9 + 1; for (let x = 0; x < w; x++) { const dx = Math.abs(x - cx); if (dx > hw) continue; p.px(x, y, dx > hw - 1 ? J.devilDeep : x < cx ? J.devilHi : J.devil); } } };
const gripP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? '#3a3842' : (x % 3 === 0) ? '#8a8e98' : '#1c1a20'); };
const holeP = (p, w, h) => { const c = (w - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - c, y - c); if (d <= c + 0.3) p.px(x, y, d > c - 0.8 ? J.ironLo : '#08070a'); } };
// hand-pixelled eyes (full texture resolution): narrow devil slits under the iron brim, the outer
// corner flicking up like a horn, red-hot glowing irises with a yellow core, a black vertical slit
// pupil and no whites
const EYES = maskEyes({ style: 'pix', chunk: 1, iris: '#ff4a14', irisDark: '#8c1a08', accent: '#ffc040', at: [-3.2, 33.4, 0.05], map: {
  open: [
    'll............',
    'lIlll.........',
    '.liIIIlllll...',
    '..liicIIkIIlll',
    '...liccckcciil',
    '....llcckccill',
    '......lllllll.',
  ],
  closed: ['..............', '..............', 'll............', 'lllll.........', '..lllllllll...', '......llllllll', '..............'],
  happy: ['..............', '..............', '.....llll.....', '..llllllllll..', '.lll......lll.', 'll..........ll', '..............'],
} }, '#e2dad0', true);
// the jerry-can tank with a big yellow lightning bolt painted down each side
const TANK_BOLT = ['......####', '.....####.', '....####..', '...####...', '..#######.', '.#######..', '....###...', '...###....', '..###.....', '..##......', '.##.......', '.#........'];
const tankP = (p, w, h, face, cube) => {
  jerryP(p, w, h, face, cube);
  if (face !== 'east' && face !== 'west' && face !== 'up') return;
  const x0 = Math.round(w / 2) - 5, y0 = Math.round(h / 2) - 6, on = (x, y) => TANK_BOLT[y] && TANK_BOLT[y][face === 'west' ? 9 - x : x] === '#';
  for (let y = -1; y < 13; y++) for (let x = -1; x < 11; x++) {
    if (on(x, y)) p.px(x0 + x, y0 + y, (x + y) < 7 ? '#fff08a' : '#ffd23a');
    else if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) p.px(x0 + x, y0 + y, '#2a1410');
  }
};
// long rock hair spilling from under the helmet: side locks and a mane that streams in the wind
const MANE = { c: '#5a3e2c', hi: '#8c6648', lo: '#30201a', tip: '#b08a64' };

// ---------------------------------------------------------------- the bike
const RA = [0, 8, -17], RR = 8, FA = [0, 7, 19], FR = 7;
// a trash-can-lid wheel round the axle `c`: a ring of galvanised rim blocks, pressed lid faces on
// both sides, the lid handle bolted on as a hub
function wheel(c, R, W) {
  const n = 12, seg = 2 * R * Math.tan(Math.PI / n) + 0.25, th = 1.6, out = [];
  for (let k = 0; k < n; k++) out.push(P([c[0] - W / 2, c[1] - R, c[2] - seg / 2], [W, th, seg], galvRidge, { pivot: c, rot: [(k / n) * 360, 0, 0] }));
  const L = 2 * (R - th * 0.5);
  for (const sx of [-1, 1]) {
    out.push(P([c[0] + sx * (W / 2 - 0.2), c[1] - L / 2, c[2] - L / 2], [0, L, L], lidP({ spoke: true }), { plane: 'x' }));
    out.push(P([c[0] + (sx > 0 ? W / 2 - 0.2 : -W / 2 - 0.6), c[1] - 1.2, c[2] - 2.0], [0.8, 2.4, 4.0], galv));      // the lid handle
  }
  out.push(P([c[0] - W / 2 - 0.4, c[1] - 1.0, c[2] - 1.0], [W + 0.8, 2.0, 2.0], iron));                                 // axle
  return out;
}
const pipes = (a, b, w = 1.2, tex = pipeP) => rod(a, b, w, w, tex, { sideV: [1, 0, 0], over: w * 0.6 });
const bikeCubes = [
  // paint-can engine and twin finned cylinders
  P([-4, 4.5, -7], [8, 7, 10], canEngineP),
  P([-3.4, 11.4, -6.2], [2.8, 3.0, 3.0], finsP, { pivot: [-2.0, 11.4, -4.7], rot: [0, 0, 14] }),
  P([0.6, 11.4, -6.2], [2.8, 3.0, 3.0], finsP, { pivot: [2.0, 11.4, -4.7], rot: [0, 0, -14] }),
  // the jerry-can tank and its cap, the duct-taped seat on its pan
  P([-3.5, 13.5, -2.5], [7, 5.5, 9], tankP),
  P([-1, 19.0, 3.6], [2, 0.8, 2], galv),
  P([-4.5, 14.0, -12.5], [9, 1.8, 10], seatP),
  P([-4, 13.0, -12], [8, 1.0, 9], ironRust),
  // frame tubes
  pipes([-2.2, 8, -17], [-2.2, 13.4, -11]), pipes([2.2, 8, -17], [2.2, 13.4, -11]),
  pipes([0, 13.5, -3], [0, 19.5, 10.5], 1.4), pipes([0, 18, 10.5], [0, 5.5, 3], 1.4),
  pipes([-2.2, 5, -6], [-2.2, 8, -17]), pipes([2.2, 5, -6], [2.2, 8, -17]),
  // rear fender: a bent strip of lid
  P([-2.6, 16.6, -22], [5.2, 0.6, 9], galvRidge),
  rod([0, 16.9, -26.2], [0, 12.4, -28.6], 5.2, 0.6, galvRidge, { sideV: [1, 0, 0] }),
  // twin exhausts sweeping back and up
  pipes([-3.6, 7, -4], [-4.2, 9.5, -16]), pipes([-4.2, 9.5, -16], [-4.6, 12.6, -24.5]),
  pipes([3.6, 7, -4], [4.2, 9.5, -16]), pipes([4.2, 9.5, -16], [4.6, 12.6, -24.5]),
  P([-5.7, 11.6, -26.4], [2.2, 2.2, 2], ironRiv), P([3.5, 11.6, -26.4], [2.2, 2.2, 2], ironRiv),
  // foot pegs
  pipes([-4, 6.5, 4], [-8, 6.5, 4], 1.0, iron), pipes([4, 6.5, 4], [8, 6.5, 4], 1.0, iron),
  // exhaust fire (glow planes, three flicker frames per pipe)
  ...['a', 'b', 'c'].flatMap((f, i) => [-4.6, 4.6].flatMap((x) => [
    P([x, 11.4, -33.4], [0, 2.6, 7], jetP(i), { plane: 'x', mirror: true, glow: true, id: 'ex-' + f, hide: true, pivot: [x, 12.7, -26.4], rot: [-14, 0, 0] }),
    P([x, 11.4, -33.4], [0, 2.6, 7], jetP(i + 1), { plane: 'x', mirror: true, glow: true, id: 'ex-' + f, hide: true, pivot: [x, 12.7, -26.4], rot: [-14, 0, 90] }),
  ])),
];
const EXH = [[-4.6, 12.7, -27.4], [4.6, 12.7, -27.4]];
const SH = [0, 19.5, 10.5];   // steering head
const steerCubes = [
  P([-1.3, 17.5, 9.2], [2.6, 4.5, 2.6], ironRiv),
  pipes([-2.4, 20, 11], [-2.4, 7, 19], 1.3), pipes([2.4, 20, 11], [2.4, 7, 19], 1.3),
  pipes([-1.6, 21, 10.5], [-3.4, 27.2, 9.4], 1.1), pipes([1.6, 21, 10.5], [3.4, 27.2, 9.4], 1.1),
  pipes([-3.4, 27.2, 9.4], [-9.6, 27.7, 7.6], 1.1), pipes([3.4, 27.2, 9.4], [9.6, 27.7, 7.6], 1.1),
  pipes([-3.4, 27.2, 9.4], [3.4, 27.2, 9.4], 1.0),
  P([-10.2, 26.9, 6.6], [2.6, 1.6, 2.0], gripP), P([7.6, 26.9, 6.6], [2.6, 1.6, 2.0], gripP),
  // a tin-can headlight
  P([-1.6, 17.8, 12.2], [3.2, 3.2, 2.2], galvRidge),
  P([-1.3, 18.1, 14.42], [2.6, 2.6, 0], lensP, { plane: 'z', glow: true }),
];
const GRIP_R = [-8.9, 27.7, 7.6], GRIP_L = [8.9, 27.7, 7.6];

// ---------------------------------------------------------------- the rider
const armCubes = [P([-8.95, 21.0, -7.25], [3.5, 6.333, 3.5], fur), P([-9.4, 24.5, -7.7], [4.4, 3.4, 4.4], fur),
  // tier 3: a spiked iron pauldron riveted over the shoulder
  P([-10.0, 26.0, -8.3], [5.4, 2.4, 5.6], ironRiv, { id: 'hc-pauldrons', hide: true }),
  P([-10.3, 24.6, -8.5], [5.0, 1.6, 6.0], ironRust, { id: 'hc-pauldrons', hide: true }),
  ...[[-8.4, -6.4], [-8.4, -3.8], [-9.6, -5.1]].flatMap(([x, z], i) => [
    P([x - 0.7, 28.4, z - 0.7], [1.4, 1.2, 1.4], iron, { id: 'hc-pauldrons', hide: true }),
    P([x - 0.4, 29.6, z - 0.4], [0.8, 1.0 + (i === 2 ? 0.6 : 0), 0.8], ironP({ rivets: false }), { id: 'hc-pauldrons', hide: true }),
  ]),
];
const foreCubes = [P([-8.7, 16.2, -7.0], [3.0, 5.3, 3.0], sock(0.5)), P([-8.95, 13.2, -7.25], [3.5, 2.4, 3.5], hand)];
const legCubes = [
  rod([-4.6, 17.4, -7.5], [-6.8, 13.6, 2.4], 5.0, 5.4, fur, { sideV: [1, 0, 0], over: 2 }),
  rod([-6.8, 14.2, 2.4], [-7.0, 7.6, 4.0], 4.0, 4.0, sock(0.6), { sideV: [1, 0, 0], over: 1.5 }),
  P([-8.8, 5.4, 1.8], [3.6, 1.6, 6.4], foot),
];
const tailSeg = (cx, cy, z0, len, w, h, s0, o = {}) => [
  P([cx - w / 2, cy - (h - 0.667) / 2, z0 - len], [w, h - 0.667, len], tailP(F, s0, o)),
  P([cx - (w - 1) / 2, cy - h / 2, z0 - len], [w - 1, h, len], tailP(F, s0, o)),
];
// horns: a staircase leaning outward from the helmet's sides
const horn = (sd) => [[3.0, 2.4, 0], [2.4, 2.2, 1.1], [1.8, 2.0, 2.2], [1.1, 1.8, 3.1]].map(([w, h, out], i) => P(
  [sd * (6.6 + out) - w / 2, 36.2 + [0, 2.4, 4.6, 6.6][i], -5.0 + i * 0.25], [w, h, 2.6 - i * 0.4], hornP(i), { pivot: [sd * 6.4, 36.2, -3.6], rot: [8, 0, -sd * 12], mirror: sd > 0 }));

export const def = {
  name: 'hellcoon', ppu: 3, scale: 0.58, outline: { color: F.ink, px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'bike', parent: 'root', pivot: RA, cubes: bikeCubes },
    { name: 'wheelR', parent: 'bike', pivot: RA, cubes: wheel(RA, RR, 3.4) },
    { name: 'steer', parent: 'bike', pivot: SH, cubes: steerCubes },
    { name: 'wheelF', parent: 'steer', pivot: FA, cubes: wheel(FA, FR, 3.0) },
    // the cannon on a bracket over the front wheel
    { name: 'cannon', parent: 'steer', pivot: [0, 17, 18], cubes: [
      pipes([0, 17.6, 12.4], [0, 16.9, 18.4], 1.1, iron),
      P([-1.4, 15.6, 18.4], [2.8, 2.8, 7.0], ironRiv),
      P([-1.8, 15.2, 25.0], [3.6, 3.6, 1.3], iron),
      P([-1.0, 16.0, 17.2], [2.0, 2.0, 1.4], iron),
      P([-1.0, 16.0, 26.32], [2.0, 2.0, 0], holeP, { plane: 'z' }),
      P([-2.2, 16.4, 20.6], [4.4, 1.2, 1.2], ironRust),
    ] },
    // "Hells Bells": a bronze bell hanging from the bars on a short chain
    { name: 'bell', parent: 'steer', pivot: [0, 26.8, 9.6], cubes: [
      pipes([0, 26.8, 9.6], [0, 25.0, 9.6], 0.45, iron),
      P([-0.8, 24.0, 8.8], [1.6, 1.0, 1.6], bronzeP),
      P([-1.5, 21.6, 8.1], [3.0, 2.4, 3.0], bronzeP),
      P([-1.9, 20.9, 7.7], [3.8, 0.8, 3.8], bronzeP),
      P([-0.45, 20.2, 9.15], [0.9, 0.9, 0.9], iron),
    ] },
    { name: 'legR', parent: 'bike', pivot: [-4.6, 17.4, -7.5], cubes: legCubes },
    { name: 'legL', parent: 'bike', pivot: [4.6, 17.4, -7.5], cubes: legCubes.map(mirrorCube) },
    { name: 'body', parent: 'bike', pivot: [0, 16, -7], rot: [14, 0, 0], cubes: [
      P([-6.5, 15.0, -11.5], [13, 6, 9], fur, { faces: { south: belly, north: furBack } }),
      P([-7.5, 20.5, -11.0], [15, 8, 9.5], fur, { faces: { south: chestP, north: furBack } }),
      P([-8.0, 21.5, -10.5], [16, 6, 8.5], fur, { faces: { north: furBack } }),
      P([-6.0, 28.3, -10.0], [12, 1.2, 7.0], fur),
      // the scarf wound round the neck
      P([-5.6, 27.6, -2.0], [11.2, 2.2, 1.4], scarfP, { id: 'hc-scarf', hide: true }), P([-5.6, 27.6, -11.4], [11.2, 2.2, 1.4], scarfP, { id: 'hc-scarf', hide: true }),
      P([-6.2, 27.6, -11.0], [1.4, 2.2, 9.4], scarfP, { id: 'hc-scarf', hide: true }), P([4.8, 27.6, -11.0], [1.4, 2.2, 9.4], scarfP, { id: 'hc-scarf', hide: true }),
      P([0.4, 26.4, -12.2], [2.6, 2.6, 1.6], scarfP, { id: 'hc-scarf', hide: true }),
      // tier 2 (or): a heavy iron chain with a little bronze bell for a pendant
      rod([-5.4, 28.0, -1.6], [0, 23.8, -1.1], 0.6, 1.0, chainP, { sideV: [0, 0, 1], over: 0.6, ...{ id: 'hc-chain', hide: true } }),
      rod([5.4, 28.0, -1.6], [0, 23.8, -1.1], 0.6, 1.0, chainP, { sideV: [0, 0, 1], over: 0.6, ...{ id: 'hc-chain', hide: true } }),
      P([-0.9, 21.6, -1.6], [1.8, 1.8, 1.6], bronzeP, { id: 'hc-chain', hide: true }), P([-1.2, 21.0, -1.9], [2.4, 0.6, 2.2], bronzeP, { id: 'hc-chain', hide: true }),
      // tier 3 (or): a sleeveless studded leather vest with a flaming-wheel patch on the back
      P([-8.3, 20.0, -11.3], [16.6, 8.8, 10.1], leatherP({ studs: true, open: true, patch: true, fur: '#5e5866' }), { id: 'hc-vest', hide: true }),
    ] },
    { name: 'scarf1', parent: 'body', pivot: [1.6, 27.4, -12.6], rot: [-28, 18, 0], cubes: [P([0.4, 27.2, -19.6], [2.4, 0.5, 7.2], scarfP, { id: 'hc-scarf', hide: true })] },
    { name: 'scarf2', parent: 'scarf1', pivot: [1.6, 27.4, -19.4], rot: [-8, 6, 0], cubes: [P([0.5, 27.22, -25.8], [2.2, 0.45, 6.6], scarfP, { id: 'hc-scarf', hide: true }), P([0.5, 27.45, -27.4], [2.2, 0, 1.6], fringeP, { plane: 'y', id: 'hc-scarf', hide: true })] },
    { name: 'tail1', parent: 'body', pivot: [0.6, 17.6, -11.4], rot: [-8, -14, 0], cubes: tailSeg(0.6, 17.6, -10.8, 7.0, 4.333, 4.333, 6) },
    { name: 'tail2', parent: 'tail1', pivot: [0.6, 17.6, -17.4], rot: [12, -6, 0], cubes: tailSeg(0.6, 17.6, -16.8, 6.6, 4.0, 4.0, 24) },
    { name: 'tail3', parent: 'tail2', pivot: [0.6, 17.6, -23.2], rot: [22, 0, 0], cubes: tailSeg(0.6, 17.6, -22.6, 5.8, 3.333, 3.333, 41) },
    { name: 'spade', parent: 'tail3', pivot: [0.6, 17.6, -28.2], rot: [10, 0, 0], cubes: [
      P([-0.4, 16.6, -29.4], [2.0, 2.0, 1.6], ironP()),
      P([0.6, 14.4, -34.4], [0, 6.4, 5.4], spadeP, { plane: 'x', pivot: [0.6, 17.6, -29.0], rot: [90, 0, 0] }),
      P([-2.1, 17.6, -34.6], [5.4, 0, 5.8], spadeP, { plane: 'y' }),
    ] },
    { name: 'armR', parent: 'body', pivot: [-7.2, 27.0, -5.5], cubes: armCubes },
    { name: 'foreR', parent: 'armR', pivot: [-7.2, 21.0, -5.5], hand: [-7.2, 14.4, -5.5], cubes: foreCubes },
    { name: 'armL', parent: 'body', pivot: [7.2, 27.0, -5.5], cubes: armCubes.map(mirrorCube) },
    { name: 'foreL', parent: 'armL', pivot: [7.2, 21.0, -5.5], hand: [7.2, 14.4, -5.5], cubes: foreCubes.map(mirrorCube) },
    { name: 'head', parent: 'body', pivot: [0, 29.0, -5.0], rot: [-14, 0, 0], cubes: [
      P([-6.0, 29.0, -8.5], [12, 9, 8.5], fur, { faces: { south: skull, east: skull, west: skull, north: furBack } }),
      P([-5.3, 29.5, -9.5], [10.6, 7.6, 1.0], furBack),
      P([-7.0, 28.6, -6.0], [14, 3.6, 5.6], cheekP),
      P([-10.6, 27.0, -1.6], [4.0, 5.4, 0], tuftP(F, { cream: true }), { plane: 'z', mirror: true, pivot: [-6.8, 30, -1.6], rot: [0, -26, -14] }),
      P([6.6, 27.0, -1.6], [4.0, 5.4, 0], tuftP(F, { cream: true, ph: 1 }), { plane: 'z', pivot: [6.8, 30, -1.6], rot: [0, 26, 14] }),
      P([-2.6, 29.2, -0.4], [5.2, 3.2, 3.0], muzzle),
      P([-1.9, 29.6, 2.4], [3.8, 2.4, 1.8], snout),
      P([-1.0, 31.2, 4.0], [2.0, 1.1, 0.9], nose),
      P([-1.7, 28.9, 4.22], [3.4, 0.7, 0], teethP(false), { plane: 'z', outline: false }),
      P([-2.3, 28.2, 3.2], [0.7, 1.4, 0.6], toothP), P([1.6, 28.4, 3.2], [0.7, 1.2, 0.6], toothP),
      P([-6.25, 29.6, -8.0], [0, 6.2, 7.0], hairP(MANE, { seed: 2, min: 0.45, tips: true }), { plane: 'x', pivot: [-6.1, 35.6, -4], rot: [0, 0, -14] }),
      P([6.25, 29.6, -8.0], [0, 6.2, 7.0], hairP(MANE, { seed: 3, min: 0.45, tips: true }), { plane: 'x', pivot: [6.1, 35.6, -4], rot: [0, 0, 14] }),
      // his own devil horns, curling up and out of the sides of his skull (they punch through any hat)
      ...horn(-1), ...horn(1),
    ] },
    ...EYES.bones,
    { name: 'mane1', parent: 'head', pivot: [0, 35.0, -9.4], rot: [-36, 0, 0], cubes: [P([-5.4, 28.0, -9.5], [10.8, 7.0, 0], hairP(MANE, { seed: 4, min: 0.6, tips: true }), { plane: 'z' })] },
    { name: 'mane2', parent: 'mane1', pivot: [0, 28.6, -9.5], rot: [-14, 0, 0], cubes: [P([-4.8, 23.0, -9.55], [9.6, 5.8, 0], hairP(MANE, { seed: 5, min: 0.5, tips: true }), { plane: 'z' })] },
    { name: 'jaw', parent: 'head', pivot: [0, 29.6, 0.0], rot: [6, 0, 0], cubes: [
      P([-2.2, 27.8, -0.4], [4.4, 1.8, 4.0], jaw),
      P([-1.5, 29.4, 3.62], [3.0, 0.7, 0], teethP(true, { off: 1 }), { plane: 'z', outline: false }),
      P([-2.0, 29.3, -0.2], [4.0, 0.3, 3.6], mouthP, { outline: false }),
      P([-1.3, 29.35, 0.3], [2.6, 0.3, 2.8], tongueP, { outline: false }),
    ] },
    // tier 1: a riveted iron helmet (rim, dome, crest ridge, a short brim), his horns through holes in its sides
    { name: 'helmet', parent: 'head', pivot: [0, 36, -4], cubes: [
      P([-6.6, 34.6, -9.1], [13.2, 1.8, 9.8], ironRust, { id: 'hc-helmet', hide: true }),
      P([-6.2, 36.4, -8.7], [12.4, 2.8, 9.0], ironRiv, { id: 'hc-helmet', hide: true }),
      P([-5.0, 39.2, -7.6], [10.0, 1.4, 6.8], iron, { id: 'hc-helmet', hide: true }),
      P([-0.7, 36.8, -9.3], [1.4, 4.0, 10.0], ironRiv, { id: 'hc-helmet', hide: true }),
      P([-6.2, 34.6, 0.6], [12.4, 0.8, 1.6], iron, { id: 'hc-helmet', hide: true }),
      // tier 1 (or): a black leather biker cap with a chain across the peak
      P([-6.4, 34.5, -9.0], [12.8, 2.0, 9.6], leatherP({ c: '#22202a', hi: '#4a4656', lo: '#141218' }), { id: 'hc-bikercap', hide: true }),
      P([-6.9, 36.4, -9.6], [13.8, 1.5, 10.8], leatherP({ c: '#26242e', hi: '#5a5668', lo: '#161420', studs: true }), { id: 'hc-bikercap', hide: true }),
      P([-6.0, 34.3, 0.4], [12.0, 0.6, 2.6], leatherP({ c: '#16141a', hi: '#6a6878', lo: '#0c0b10' }), { pivot: [0, 34.6, 0.6], rot: [12, 0, 0], id: 'hc-bikercap', hide: true }),
      P([-5.0, 35.0, 0.62], [10.0, 0.6, 0.3], chainP, { id: 'hc-bikercap', hide: true }),
    ] },
  ],
};
def.drip = [
  [{ id: 'hc-helmet', name: 'Riveted iron helmet' }, { id: 'hc-bikercap', name: 'Studded biker cap' }],
  [{ id: 'hc-scarf', name: 'Back-in-black scarf' }, { id: 'hc-chain', name: 'Bell chain' }],
  [{ id: 'hc-pauldrons', name: 'Spiked iron pauldrons' }, { id: 'hc-vest', name: 'Studded leather vest' }],
];
// the ultra-drip form: black lacquer over everything, gold horns, tank, bell, devil spade and tail bands, and the pipes burn blue
def.dripForm = { map: raccoonDrip([F.ringL, F.tip, J.bronze, J.bronzeHi, J.bronzeLo, ({ h, s, l }) => (h < 12 || h > 340) && s > 0.45 && l > 0.2]), fx: DRIP_FX };
def.attach = {
  head: { bone: 'head', at: [0, 40.6, -4.2], size: 12.4 },
  face: { bone: 'head', at: [0, 33.4, 0.1], size: 12 },
  neck: { bone: 'body', at: [0, 27.0, -1.4], size: 11 },
  back: { bone: 'body', at: [0, 22.0, -11.5], size: 15 },
};

// ---------------------------------------------------------------- rig: the paws hold the grips
const R = rig(def);
const POLE_R = [-1, -0.6, -0.4], POLE_L = [1, -0.6, -0.4];
R.reach(null, 'armR', 'foreR', R.at(null, 'steer', GRIP_R), { pole: POLE_R });
R.reach(null, 'armL', 'foreL', R.at(null, 'steer', GRIP_L), { pole: POLE_L });
const grips = (P, o = {}) => {
  if ((o.wR ?? 1) > 0) R.reach(P, 'armR', 'foreR', R.at(P, 'steer', GRIP_R), { pole: POLE_R, w: o.wR ?? 1 });
  if ((o.wL ?? 1) > 0) R.reach(P, 'armL', 'foreL', R.at(P, 'steer', GRIP_L), { pole: POLE_L, w: o.wL ?? 1 });
};

// ---------------------------------------------------------------- animation
const ABC = ['a', 'b', 'c'];
const cyc = (t, fps) => ABC[Math.floor(t * fps) % 3];
const MUZZLE = [0, 17.0, 27.0], BELL = [0, 21.0, 9.6], HELM = [0, 41, -4], GROUND_R = [0, 0.6, -17];
// the engine running: a fine jitter through the frame, puffs from the pipes
function engine(P, t, k = 1) { P.pos('bike', 0, 0.07 * k * Math.sin(t * 61), 0).rot('bike', 0.25 * k * Math.sin(t * 47), 0, 0.2 * k * Math.sin(t * 53)); }
function exhaust(P, t, fire, smoke = 2.5) {
  if (fire) { P.face('exh', cyc(t, 16)); EXH.forEach((e, i) => P.stream('fire', 'bike', e, { rate: 22 * fire, dir: [0, 0.3, -1], speed: 1.6, spread: 0.3, key: 'x' + i })); }
  EXH.forEach((e, i) => P.stream('smoke', 'bike', e, { rate: smoke, dir: [0, 0.6, -1], spread: 0.4, scale: 0.7, key: 's' + i }));
}
const eyeSq = (P, sx, sy) => P.scl('eyeR', sx, sy, 1).scl('eyeL', sx, sy, 1);
const dart = (P, dx, dy = 0) => P.pos('eyeR', dx, dy, 0).pos('eyeL', dx, dy, 0);
const bang = (t, per = 0.4) => { const u = (((t % per) + per) % per) / per; return u < 0.14 ? E.out(u / 0.14) : 1 - E.inout((u - 0.14) / 0.86); };
const spin = (P, rr, rf = rr) => P.rot('wheelR', rr, 0, 0).rot('wheelF', rf, 0, 0);

export const anim = {
  start: 'idle', seed: 66,
  breathe: { bone: 'body', amp: 0.016, per: 2.4 },
  blink: { slot: 'eyes', closed: 'closed', every: [3, 6], dur: 0.1 },
  look: { bone: 'head', yaw: 22, pitch: 10, speed: 5 },
  springs: [
    { bone: 'bell', tip: [0, -5, 0], k: 60, d: 3.2, gain: 1.4, max: 32 },
    { bone: 'scarf1', tip: [0, 0, -7], k: 70, d: 5, gain: 1.0, max: 30 },
    { bone: 'mane1', tip: [0, -6, 0], k: 90, d: 6, gain: 0.9, max: 24 },
    { bone: 'mane2', tip: [0, -5, 0], k: 70, d: 5, gain: 1.1, max: 28 },
    { bone: 'scarf2', tip: [0, 0, -6], k: 55, d: 4, gain: 1.3, max: 36 },
    { bone: 'tail1', tip: [0, 0, -7], k: 110, d: 8, gain: 0.6, max: 14 },
    { bone: 'tail2', tip: [0, 0, -6], k: 95, d: 7, gain: 0.8, max: 18 },
    { bone: 'tail3', tip: [0, 0, -6], k: 85, d: 6, gain: 1.0, max: 22 },
    { bone: 'spade', tip: [0, 0, -5], k: 80, d: 5, gain: 1.1, max: 24 },
  ],
  faces: {
    eyes: EYES.slot,
    exh: { default: 'off', states: { off: [], a: ['ex-a'], b: ['ex-b'], c: ['ex-c'] } },
  },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'chug', 'rev', 'polish'] },
  clips: {
    // the engine idling under him: a fine rumble, smoke from the pipes, a slow nod to the beat, a
    // twist of the throttle that makes the pipes spit fire
    idle: { len: 2.4, loop: true, f(P, t) {
      engine(P, t);
      const blip = bump(t, 1.3, 1.65), nod = Math.max(0, Math.sin((t / 0.6) * Math.PI * 2));
      P.rot('body', -3 * blip + 2 * nod, wave(t, 1 / 2.4) * 3, 0).pos('body', 0, 0.2 * nod, -0.6 * blip);
      P.rot('head', 6 * nod - 4 * blip, wave(t, 1 / 2.4, 1) * 8, 0).rot('jaw', 4 + 10 * blip);
      P.rot('scarf1', wave(t, 1.3) * 6, wave(t, 0.9) * 8, 0).rot('scarf2', wave(t, 1.7, 1) * 8, 0, 0);
      P.rot('tail1', 0, wave(t, 1 / 2.4) * 8, 0);
      grips(P); P.rot('foreR', -16 * blip, 0, 0);
      exhaust(P, t, blip > 0.2 ? 1 : 0, 2.5);
      P.burst(1.35, 'smoke', 'bike', EXH[0], { n: 3, dir: [0, 0.4, -1] }).burst(1.35, 'smoke', 'bike', EXH[1], { n: 3, dir: [0, 0.4, -1] });
      P.face('eyes', blip > 0.3 ? 'sleepy' : undefined); dart(P, 0.4 * (bump(t, 0.3, 0.9) - bump(t, 1.8, 2.3)));
    } },
    // riding: the lids spin, the frame skips over the road, the scarf streams back, dust kicks up
    walk: { len: 0.6, loop: true, f(P, t) {
      engine(P, t, 0.6);
      const r = (t / 0.6) * 720, bmp = Math.abs(Math.sin((t / 0.6) * Math.PI * 2));
      spin(P, r, r * (RR / FR));
      P.pos('bike', 0, 0.35 * bmp, 0).rot('bike', -1 + 1.5 * Math.sin((t / 0.3) * Math.PI), 0, wave(t, 1 / 0.6) * 2);
      P.rot('steer', 0, wave(t, 1 / 0.6, 1) * 4, 0);
      P.rot('body', 6, 0, 0).rot('head', -4 + 3 * bmp, 0, 0);
      P.rot('scarf1', 18, 0, 0).rot('scarf2', 10 + wave(t, 4) * 10, 0, 0).rot('tail1', 8, 0, 0).rot('mane1', -22, 0, 0).rot('mane2', -10 + wave(t, 5) * 8, 0, 0);
      grips(P);
      exhaust(P, t, 0.5, 4);
      P.stream('dust', 'bike', GROUND_R, { rate: 14, dir: [0, 0.5, -1], spread: 0.6, scale: 0.8 });
    } },
    // a roaring wheelie, fist to the sky; the bike slams down and he rings the bell — DONG
    cry: { len: 2.6, next: 'idle', f(P, t) {
      const up = seg(t, 0.15, 0.55, E.out) * (1 - seg(t, 1.3, 1.45, E.in3));
      engine(P, t, 1.4);
      P.rot('bike', -26 * up + wob(t, 1.45, -4, 3, 6), 0, 0);
      spin(P, t * 900, t * 200 * (1 - up));
      const fist = seg(t, 0.4, 0.6, E.back) * (1 - seg(t, 1.2, 1.4));
      grips(P, { wL: 1 - fist });
      P.rot('armL', -150 * fist, 0, -30 * fist).rot('foreL', -30 * fist, 0, 0);
      P.rot('body', -10 * up, 0, 0).rot('head', -22 * up + wave(t, 12) * 2 * up, 0, 0).rot('jaw', 36 * up);
      P.rot('scarf1', 24 * up, 0, 0).rot('scarf2', 18 * up + wave(t, 6) * 10, 0, 0);
      exhaust(P, t, up > 0.2 ? 1.6 : 0, 3);
      const ring = seg(t, 1.6, 1.7, E.out) * (1 - seg(t, 1.7, 2.3, E.inout));
      grips(P, { wR: 1 - ring });
      if (ring > 0) R.reach(P, 'armR', 'foreR', R.at(P, 'bell', [-1.6, 22.6, 9.6]), { pole: POLE_R, w: ring });
      P.rot('bell', 0, 0, wob(t, 1.68, 28, 1.6, 2.2));
      P.burst(1.68, 'shockring', 'bell', BELL, { scale: 1.6 }).burst(1.7, 'ring', 'bell', BELL, { scale: 2 }).burst(1.7, 'note', 'bell', BELL, { n: 4, spread: 1 });
      P.burst(2.0, 'ring', 'bell', BELL, { scale: 2.6 }).burst(1.45, 'dust', 'root', [0, 0.5, 19], { n: 8, spread: 1 }).burst(1.45, 'spark', 'root', [0, 1, 19], {});
      P.face('eyes', up > 0.3 ? 'angry' : ring > 0.3 ? 'happy' : undefined); P.lookW = 1 - up; eyeSq(P, 1 - 0.1 * up, 1 + 0.2 * up);
    } },
    // physical: a revving lunge — front wheel up, then slammed down on the target
    attack: { len: 1.3, next: 'idle', f(P, t) {
      const back = seg(t, 0, 0.3, E.out) * (1 - seg(t, 0.3, 0.4, E.in)), lunge = seg(t, 0.32, 0.5, E.out3) * (1 - seg(t, 0.8, 1.25, E.inout));
      const lift = bump(t, 0.32, 0.6);
      engine(P, t, 1.2);
      P.pos('root', 0, 0, -2.5 * back + 12 * lunge).rot('bike', 6 * back - 18 * lift + wob(t, 0.6, 3, 4, 7), 0, 0);
      spin(P, t * 700, t * 400);
      P.rot('body', -8 * back + 12 * lunge, 0, 0).rot('head', 10 * lunge, 0, 0).rot('jaw', 24 * lunge);
      grips(P);
      exhaust(P, t, t > 0.25 && t < 0.7 ? 1.4 : 0, 3);
      P.burst(0.6, 'spark', 'root', [0, 1, 26], { n: 3, spread: 1 }).burst(0.6, 'star', 'root', [0, 3, 27], { n: 5 }).burst(0.6, 'dust', 'root', [0, 0.5, 22], { n: 8, spread: 1 });
      P.face('eyes', t > 0.05 && t < 1.1 ? 'angry' : undefined);
    } },
    // special (Pyro): a burnout that sprays fire along the ground, the bike swings round, he
    // throws a salute and the cannon fires — BOOM
    special: { len: 3.2, next: 'idle', f(P, t) {
      const burn = seg(t, 0.1, 0.3) * (1 - seg(t, 1.4, 1.6));
      engine(P, t, 1.4);
      spin(P, t * 1600 * Math.max(0.2, burn), 0);
      P.rot('root', 0, (wave(t, 1.6) * 14) * burn + 18 * seg(t, 1.3, 1.6, E.back) * (1 - seg(t, 1.6, 1.9)), 0);
      P.rot('bike', 3 * burn, 0, wave(t, 3.2) * 2 * burn);
      P.rot('body', 10 * burn, 0, 0);
      exhaust(P, t, burn > 0.2 ? 1.2 : 0, 4);
      if (burn > 0.2) P.stream('fire', 'bike', GROUND_R, { rate: 70, dir: [0, 0.15, -1], speed: 3.2, spread: 0.25, key: 'g' }).stream('smoke', 'bike', GROUND_R, { rate: 12, dir: [0, 0.5, -1], spread: 0.6, scale: 1.4, key: 'gs' });
      const salute = seg(t, 1.5, 1.75, E.out) * (1 - seg(t, 2.4, 2.7, E.inout));
      grips(P, { wR: 1 - salute });
      if (salute > 0) R.reach(P, 'armR', 'foreR', R.at(P, 'helmet', [-6.4, 35.4, 1.6]), { pole: [-1, -0.2, -0.6], w: salute });
      const fire = seg(t, 1.9, 1.94, E.out) * (1 - seg(t, 1.94, 2.4, E.inout));
      P.pos('cannon', 0, 0, -2.2 * fire).pos('root', 0, 0, -1.6 * fire).rot('bike', -3 * fire, 0, 0);
      P.burst(1.92, 'boom', 'cannon', MUZZLE, { scale: 0.8 }).burst(1.92, 'shockring', 'cannon', MUZZLE, { scale: 1.6 }).burst(1.92, 'spark', 'cannon', MUZZLE, { n: 3 });
      P.burst(1.93, 'smoke', 'cannon', MUZZLE, { n: 14, dir: [0, 0.3, 1], spread: 0.6, speed: 2.4, scale: 1.4 }).burst(1.92, 'fire', 'cannon', MUZZLE, { n: 18, dir: [0, 0.1, 1], spread: 0.3, speed: 4 });
      P.burst(1.92, 'rock', 'cannon', MUZZLE, { n: 1, dir: [0, 0.15, 1], spread: 0, speed: 3.5, scale: 2.5 });
      P.rot('head', -12 * fire + 6 * salute, 0, 0).rot('jaw', 30 * fire);
      P.face('eyes', t > 1.95 && t < 2.6 ? 'happy' : salute > 0.3 ? 'sleepy' : 'angry');
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.2, 0.7, E.inout));
      engine(P, t);
      P.pos('root', 0, 0, -3 * k).rot('bike', 5 * k + wob(t, 0.2, 2, 3, 6), 0, wave(t, 14) * 2 * k);
      P.rot('body', -18 * k, 0, 8 * k).rot('head', -20 * k, 0, 10 * k).rot('jaw', 22 * k);
      grips(P, { wL: 1 - k * 0.8 });
      P.face('eyes', t < 0.45 ? 'shut' : undefined); eyeSq(P, 1 + 0.25 * k, 1 - 0.3 * k);
      P.burst(0.02, 'spark', 'helmet', HELM, { n: 2 }).burst(0.03, 'shard', 'helmet', HELM, { n: 6 }).burst(0.03, 'smoke', 'bike', EXH[0], { n: 3 });
    } },
    // the engine coughs out, the bike wobbles and goes over onto its side
    faint: { len: 2.4, next: 'down', f(P, t) {
      const wobble = seg(t, 0.2, 0.5) * (1 - seg(t, 0.9, 1.0)), fall = seg(t, 0.95, 1.45, E.bounce);
      if (t < 0.9) engine(P, t, 1 - t);
      P.rot('bike', 0, 0, wave(t, 2.4) * 6 * wobble).rot('body', 0, 0, wave(t, 2.4, 1) * 10 * wobble).rot('head', 10 * wobble, 0, wave(t, 2.4) * 12 * wobble);
      P.rot('root', 0, 0, -78 * fall).pos('root', -9 * fall, 2.0 * fall, 0);
      spin(P, 600 * seg(t, 0, 1.4, E.out), 400 * seg(t, 0, 1.6, E.out));
      grips(P, { wL: 1 - fall * 0.8, wR: 1 - fall * 0.6 });
      P.rot('armL', 0, 0, 40 * fall).rot('jaw', 22 * fall);
      P.face('eyes', t < 0.95 ? 'swirl' : 'x'); P.blinkOK = false; P.lookW = 1 - wobble;
      P.burst(0.3, 'smoke', 'bike', EXH[0], { n: 4 }).burst(0.6, 'smoke', 'bike', EXH[1], { n: 4 }).burst(1.45, 'dust', 'root', [0, 1, 0], { n: 10, spread: 1 }).burst(1.46, 'spark', 'root', [0, 2, 10], { n: 2 });
    } },
    down: { len: 2.8, loop: true, f(P, t) {
      P.rot('root', 0, 0, -78).pos('root', -9, 2.0, 0);
      spin(P, 600, 400 + t * 40);
      grips(P, { wL: 0.2, wR: 0.4 });
      P.rot('armL', 0, 0, 40).rot('jaw', 22).rot('head', 0, 0, wave(t, 0.36) * 3);
      P.face('eyes', 'x'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.stream('smoke', 'bike', [0, 12, -2], { rate: 1.6, scale: 0.8 });
    } },
    // victory: a doughnut in a ring of fire, then a wheelie with the fist pumping and the bell ringing
    win: { len: 2.8, next: 'idle', f(P, t) {
      const donut = seg(t, 0.05, 1.2, E.inout);
      engine(P, t, 1.2);
      P.rot('root', 0, 360 * donut, 8 * bump(t, 0.05, 1.2)).rot('bike', 0, 0, 0);
      spin(P, t * 1200, t * 300);
      exhaust(P, t, t < 1.3 ? 1 : 0, 3);
      if (t < 1.2) P.stream('fire', 'bike', GROUND_R, { rate: 50, dir: [0, 0.3, -1], speed: 2, spread: 0.4, key: 'w' });
      const up = seg(t, 1.3, 1.6, E.out) * (1 - seg(t, 2.3, 2.6, E.in3));
      P.rot('bike', -20 * up, 0, 0);
      const pump = up * Math.max(0, Math.sin((t - 1.3) * Math.PI * 4));
      grips(P, { wL: 1 - up });
      P.rot('armL', -140 * up - 20 * pump, 0, -20 * up).rot('foreL', -30 * up, 0, 0);
      P.rot('head', -14 * up, 0, 0).rot('jaw', 30 * up);
      P.rot('bell', 0, 0, 20 * Math.sin(t * 14) * up);
      P.burst(1.5, 'ring', 'bell', BELL, { scale: 2 }).burst(1.8, 'note', 'bell', BELL, { n: 3 }).burst(1.2, 'ring', 'root', [0, 1, 0], { scale: 3 });
      P.face('eyes', up > 0.3 ? 'happy' : undefined);
    } },
    // engine off, slumped over the bars, helmet tipped forward, Zzz
    sleep: { len: 3.6, loop: true, f(P, t) {
      const br = Math.sin((t / 3.6) * Math.PI * 2);
      P.rot('body', 22 + br * 2, 0, 0).sq('body', -0.03 + br * 0.03);
      P.rot('head', 24 + br * 3, 0, 14).rot('helmet', 10, 0, 6).rot('jaw', 8 + Math.max(0, br) * 6);
      grips(P, { wL: 0.7, wR: 0.7 });
      P.rot('scarf1', -10, 0, 0).rot('scarf2', -20, 0, 0).rot('tail1', -14, 0, 0).rot('tail2', -16, 0, 0);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', [4, 40, 2], {}).burst(2.0, 'z', 'head', [4, 40, 2], {});
    } },
    // fidget: two throttle blips — the pipes backfire fire and smoke; he grins
    rev: { len: 2.0, next: 'idle', f(P, t) {
      engine(P, t, 1.3);
      const b1 = bump(t, 0.2, 0.55), b2 = bump(t, 0.8, 1.2), b = Math.max(b1, b2);
      P.rot('bike', -2 * b, 0, 0).pos('body', 0, 0, -0.6 * b).rot('body', -4 * b, 0, 0);
      grips(P); P.rot('foreR', -24 * b, 0, 0);
      spin(P, 200 * seg(t, 0.2, 1.4, E.out), 0);
      exhaust(P, t, b > 0.3 ? 1.5 : 0, 3);
      P.burst(0.4, 'smoke', 'bike', EXH[0], { n: 5, dir: [0, 0.4, -1], speed: 1.4 }).burst(1.0, 'smoke', 'bike', EXH[1], { n: 5, dir: [0, 0.4, -1], speed: 1.4 });
      P.burst(1.0, 'ring', 'bike', EXH[0], {}).burst(1.0, 'ring', 'bike', EXH[1], {});
      P.rot('jaw', 12 * b).rot('head', -6 * b, 0, 0);
      P.face('eyes', t > 0.5 && t < 1.7 ? 'happy' : undefined);
    } },
    // fidget: buffs a helmet horn with the back of his paw until it gleams
    polish: { len: 2.6, next: 'idle', f(P, t) {
      engine(P, t, 0.6);
      const k = seg(t, 0.1, 0.4, E.out) * (1 - seg(t, 2.0, 2.4, E.inout)), rub = Math.sin(t * Math.PI * 6) * k;
      grips(P, { wL: 1 - k });
      const hornAt = R.at(P, 'helmet', [7.6, 39.4 + rub * 0.8, -3.4 + rub * 1.2]);
      if (k > 0) R.reach(P, 'armL', 'foreL', hornAt, { pole: [1, -0.4, -0.6], w: k });
      P.rot('head', 6 * k, -14 * k, -10 * k);
      P.face('eyes', k > 0.5 ? 'sleepy' : undefined); P.lookW = 1 - k;
      P.burst(1.0, 'sparkle', 'helmet', [8.4, 42, -3.4], { n: 3 }).burst(1.6, 'sparkle', 'helmet', [8.4, 42, -3.4], { n: 4 }).burst(2.0, 'sparkle', 'helmet', [-8.4, 42, -3.4], { n: 2 });
      exhaust(P, t, 0, 2);
    } },
    // dance: the bike dances — the front wheel hops on every beat while he rocks the frame and
    // headbangs, the bell swinging; it finishes in a roaring wheelie with his fist up
    dance: { len: 2.7, next: 'idle', f(P, t) {
      engine(P, t, 1.0);
      const D = seg(t, 1.9, 2.1, E.out) * (1 - seg(t, 2.5, 2.7, E.in3)), on = t < 1.9 ? 1 : 0;
      const tap = on * Math.max(0, Math.sin(((t / 0.4) % 1) * Math.PI)), n = on * bang(t, 0.4);
      P.rot('bike', -9 * tap - 22 * D + wob(t, 2.6, -3, 3, 6), 0, wave(t, 1.25) * 6 * on);
      P.rot('steer', 0, wave(t, 1.25, 1) * 10 * on, 0);
      spin(P, t * 220 + 900 * seg(t, 1.9, 2.7), t * 120);
      P.rot('head', 18 * n - 16 * D, wave(t, 1.25) * 10 * on, 0).rot('body', 6 * n - 8 * D, 0, wave(t, 1.25) * 4 * on).rot('jaw', 10 * n + 30 * D);
      P.rot('mane1', -14 * n, 0, 0).rot('scarf1', 10 * D, 0, 0);
      grips(P, { wL: 1 - D });
      P.rot('armL', -150 * D, 0, -30 * D).rot('foreL', -30 * D, 0, 0);
      exhaust(P, t, D > 0.3 ? 1.6 : tap > 0.8 ? 0.6 : 0, 3);
      for (const b of [0.4, 0.8, 1.2, 1.6]) P.burst(b, 'dust', 'root', [0, 0.5, 19], { n: 2, speed: 0.5 }).burst(b, 'note', 'head', [0, 43, 0], { n: 1 });
      P.burst(2.0, 'ring', 'bell', BELL, { scale: 2 }).burst(2.0, 'riff', 'head', [0, 43, 0], { n: 4, spread: 1 }).burst(2.6, 'dust', 'root', [0, 0.5, 19], { n: 6, spread: 1 });
      P.face('eyes', D > 0.3 ? 'happy' : n > 0.5 ? 'angry' : undefined); eyeSq(P, 1 + 0.06 * n, 1 - 0.12 * n);
    } },
    // fidget (signature): leans down, unscrews the jerry-can tank and takes a long swig of fuel…
    // sits up with puffed cheeks, breathes a roaring jet of fire, coughs a smoke ring and grins
    chug: { len: 3.2, next: 'idle', f(P, t) {
      engine(P, t, 0.6);
      const lean = seg(t, 0.15, 0.55, E.inout) * (1 - seg(t, 1.35, 1.6, E.inout));
      const gulp = t > 0.6 && t < 1.3 ? Math.max(0, Math.sin((t - 0.6) * Math.PI * 2 * 3)) : 0;
      const puff = seg(t, 1.55, 1.75, E.out) * (1 - seg(t, 1.8, 1.9)), blow = seg(t, 1.85, 1.95, E.out) * (1 - seg(t, 2.6, 2.85, E.inout));
      P.rot('body', 30 * lean - 10 * blow, 0, 0).pos('body', 0, -1.0 * lean, 1.0 * lean);
      P.rot('head', 26 * lean - 6 * gulp + 10 * puff - 14 * blow + wave(t, 14) * 3 * blow, 0, 0).rot('jaw', 10 * gulp + 36 * blow - 4 * puff);
      P.scl('head', 1 + 0.08 * puff, 1 + 0.05 * puff, 1 + 0.08 * puff);
      grips(P, { wL: 1 - lean });
      if (lean > 0) R.reach(P, 'armL', 'foreL', R.at(P, 'bike', [1.4, 20.4, 4.6]), { pole: POLE_L, w: lean });
      P.face('eyes', puff > 0.3 ? 'wide' : blow > 0.3 ? 'angry' : gulp > 0.2 ? 'closed' : t > 2.7 ? 'happy' : undefined); P.lookW = 1 - Math.max(lean, blow);
      eyeSq(P, 1 - 0.1 * puff, 1 + 0.2 * puff);
      const M = [0, 29.4, 4.8];
      if (blow > 0.2) P.stream('breath', 'head', M, { rate: 150, dir: [0, 0.1, 1], speed: 1.1, spread: 0.18 }).stream('ember', 'head', M, { rate: 20, spread: 1 });
      P.burst(2.75, 'smoke', 'head', M, { n: 4, dir: [0, 0.6, 1], speed: 0.8 }).burst(2.8, 'ring', 'head', M, { scale: 0.6 }).burst(1.0, 'sweat', 'head', [6, 40, 0], { n: 1, dir: [1, 0.5, 0] });
      exhaust(P, t, blow > 0.3 ? 1.2 : 0, 2);
    } },
  },
};
def.anim = anim;
