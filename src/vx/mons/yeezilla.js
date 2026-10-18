// Yeezilla — stage 3a of the bear line (Echo/Ecto). The heartbreak curdled into rage: a hunched
// giant of near-black fur with grizzled silver tips, a bleached-blond buzz, and a mask-helmet
// encrusted in crystal that swallows its whole face — jagged crystal spikes, two slits glowing
// red where its eyes should be, a fanged jaw beneath. Arms long enough to knuckle-walk, claws like
// bone. It moves slowly, breathes like a furnace, and its roar shakes the ground. Drip: red-tape
// wraps or crystal knuckles; heavy chains or a jagged crystal piece; a fur mantle or big black
// kicks. An original monster that winks at a rapper's darkest albums and their masked tour.
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { fur, fringe, halo, gold, GOLD, chain, sneaker, fill, wrapX, isSide, edgeLine, sh } from './bear_parts.js';
import { eyeRig, eyesAt, eyesScale, glance } from './eyes.js';
import { poly, ramp, shift, h2 } from './kit.js';

const C = {
  fur: '#2a2630', furHi: '#46404e', furLo: '#18161c', furEdge: '#0e0d12', furTip: '#7a7286', furLite: '#3a3442',
  chest: '#8a8494', chestLo: '#5e5868',
  blond: '#e8d48a', blondHi: '#fff0b8', blondLo: '#b89a52',
  cry: '#dcecff', cryHi: '#ffffff', cryMid: '#a8c8ec', cryLo: '#6a88b8', cryDeep: '#2c3858', cryPink: '#f0c8e8',
  claw: '#e8e0d0', clawLo: '#a89a86', clawTip: '#3a3028',
  mouth: '#5a0c16', mouthHi: '#8a1a24', tooth: '#f4eee0', toothLo: '#c4baa4',
  tape: '#e0202a', tapeHi: '#ff6a62', tapeLo: '#8a0e1a',
  iron: '#4a4e5a', ironHi: '#8a90a0', ironLo: '#24262e',
  red: '#ff2a2a',
};

// ---------------------------------------------------------------- painters
const furP = (seed, o = {}) => fur(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furEdge, tip: C.furTip, lite: C.furLite, s: 10, tipH: 4, pt: 0.6, seed, ...o });
const bodyFur = furP(5), bodyFur2 = furP(7, { s: 9 }), limbFur = furP(9, { s: 8 }), headFur = furP(11, { s: 8 });
const halo1 = halo(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furEdge, tip: C.furTip, n: 30, depth: 0.12, inner: 0.82, sq: 3, seed: 3 });
// the chest: a grizzled crescent blaze across the black
const chestP = (p, w, h, face, cube) => {
  bodyFur(p, w, h, face, cube);
  if (face !== 'south') return;
  const cx = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = (x - cx) / (w / 2), v = y / h, top = 0.18 + u * u * 0.55, th = 0.16 * (1 - u * u);
    if (v > top && v < top + th && Math.abs(u) < 0.95) p.px(x, y, (x + y) % 3 ? C.chest : C.chestLo);
  }
};
// the bleached-blond buzz: short, bright, a crisp edge
const buzzP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'down' ? C.blondLo : (x * 5 + y * 3) % 7 === 0 ? C.blondLo : (x + y * 2) % 5 === 0 ? C.blondHi : C.blond)); if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, h - 1, C.blondLo); };
// the crystal mask: a skin of faceted stones in a diamond lattice, each with a lit facet and a dark one
const crystalSkin = (p, w, h, face) => {
  fill(p, w, h, (x, y) => {
    const a = ((x + y) % 4 + 4) % 4, b = ((x - y) % 4 + 4) % 4;
    if (a === 0 || b === 0) return C.cryDeep;                              // the setting between stones
    const lit = (x + y) % 4 < 2 ? (face === 'up' ? C.cryHi : C.cry) : (x - y + 400) % 4 < 2 ? C.cryMid : C.cryLo;
    return h2(x >> 2, y >> 2, 3) > 0.9 ? C.cryPink : lit;
  });
  for (let y = 1; y < h; y += 4) for (let x = (y >> 2) % 2 ? 3 : 1; x < w; x += 8) p.px(x, y, '#ffffff');
};
const spikeP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? C.cryHi : face === 'down' ? C.cryLo : x === 0 ? C.cryHi : x === w - 1 ? C.cryLo : ramp([C.cryHi, C.cry, C.cryMid], y / Math.max(1, h - 1), x, y))); if (isSide(face) && h > 2) p.px(Math.min(1, w - 1), 1, '#ffffff'); };
const clawP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? C.claw : y >= h - 1 ? C.clawTip : ramp([C.claw, C.clawLo], y / Math.max(1, h - 1), x, y)));
const toothP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? C.tooth : y === h - 1 ? C.toothLo : C.tooth));
const mouthP = (p, w, h) => fill(p, w, h, (x, y) => (y === 0 || y === h - 1 ? C.mouth : C.mouthHi));
// the jaw: black fur, a row of white teeth along its top edge, a red mouth inside
const jawP = (p, w, h, face, cube) => {
  limbFur(p, w, h, face, cube);
  if (face === 'up') { fill(p, w, h, (x, y) => (x > 1 && x < w - 2 && y > 1 && y < h - 1 ? C.mouthHi : null)); for (let x = 2; x < w - 2; x += 2) p.px(x, h - 2, C.tooth); }
  if (face === 'south') { for (let x = 1; x < w - 1; x++) { p.px(x, 0, C.mouth); if (x % 3 !== 0) p.px(x, 1, C.tooth); } }
};
// ---- drip
const tapeP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? C.tapeHi : face === 'down' ? C.tapeLo : ramp([C.tapeHi, C.tape, C.tape, C.tapeLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (isSide(face)) for (let x = 0; x < w; x++) { if ((x + 2) % 6 === 0) for (let y = 0; y < h; y++) p.px(Math.min(w - 1, x + (y >> 1)), y, C.tapeLo); if (x % 5 === 1) p.px(x, h - 1, 0); }
};
const ironP = { hi: C.ironHi, base: C.iron, lo: C.ironLo, deep: '#121318', spec: '#d8dce8' };
const shardP = (p, w, h) => {
  poly(p, [[w * 0.5, 0], [w, h * 0.3], [w * 0.8, h], [w * 0.15, h * 0.85], [0, h * 0.28]], (x, y) => (x < w * 0.5 ? (y < h * 0.4 ? C.cryHi : C.cry) : y < h * 0.5 ? C.cryMid : C.cryLo));
  edgeLine(p, GOLD.lo, { sides: true, top: true });
  p.px(Math.round(w * 0.35), Math.round(h * 0.3), '#ffffff'); p.px(Math.round(w * 0.4), Math.round(h * 0.25), '#ffffff');
};
const mantleP = fur(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furEdge, tip: '#a8a0b4', lite: C.furLite, s: 8, tipH: 6, pt: 0.8, seed: 31 });
const mantleFringe = fringe(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furEdge, tip: '#a8a0b4', seed: 33, tw: 4, short: 0.5 });
const kicks = sneaker({ up: '#26242c', upHi: '#3e3a46', upLo: '#16141a', panel: C.tape, sole: '#e8e4dc', soleLo: '#9a968e', lace: C.tape });

// ---------------------------------------------------------------- face: two slits of red light through the crystal
const EYES = eyeRig({ style: 'pix', chunk: 2, at: [-3.0, 35.2, 14.26], glow: 'all', accent: C.red, line: '#2a0408', map: {
  open: ['cc....', 'chhcc.', '..cccc'],
  angry: ['c.....', 'chc...', '.chhcc', '...ccc'],
  wide: ['.cccc.', 'chhhhc', 'chhhhc', '.cccc.'],
  sleepy: ['......', 'cccccc', '......'],
} });

// ---------------------------------------------------------------- the model
const B = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const A = (id, c) => ({ ...c, id, hide: true });
const M = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: !c.mirror, ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]] } : {}), ...(c.rot ? { rot: [c.rot[0], -c.rot[1], -c.rot[2]] } : {}) });
// a crystal spike: a fat base and a thin tip, standing on `at` and tipped by [rx, rz] degrees
const spike = (at, rx, rz, len, w, id) => [
  { o: [at[0] - w / 2, at[1], at[2] - w / 2], s: [w, len * 0.58, w], tex: spikeP, pivot: at, rot: [rx, 0, rz], ...(id ? { id, hide: true } : {}) },
  { o: [at[0] - w * 0.27, at[1] + len * 0.56, at[2] - w * 0.27], s: [w * 0.54, len * 0.44, w * 0.54], tex: spikeP, pivot: at, rot: [rx, 0, rz], ...(id ? { id, hide: true } : {}) },
];
const SPIKES = [
  ...spike([-4.4, 40.1, 7.0], -8, 26, 5.2, 1.6), ...spike([4.4, 40.1, 7.0], -8, -26, 5.2, 1.6),
  ...spike([-1.6, 40.2, 6.0], -14, 8, 6.4, 1.8), ...spike([1.6, 40.2, 6.0], -14, -8, 6.4, 1.8),
  ...spike([0, 40.2, 9.4], 26, 0, 4.6, 1.6),
  ...spike([-3.4, 40.1, 4.2], -40, 14, 4.2, 1.4), ...spike([3.4, 40.1, 4.2], -40, -14, 4.2, 1.4),
  ...spike([-7.2, 37.4, 9.0], -6, 66, 4.0, 1.4), ...spike([7.2, 37.4, 9.0], -6, -66, 4.0, 1.4),
  ...spike([-7.2, 33.6, 10.6], 10, 82, 3.4, 1.2), ...spike([7.2, 33.6, 10.6], 10, -82, 3.4, 1.2),
  ...spike([-4.2, 39.4, 14.0], 58, 12, 3.0, 1.1), ...spike([4.2, 39.4, 14.0], 58, -12, 3.0, 1.1),
];
const CLAWS = (x0, y0, z0, n = 3, sp = 2.4, s = [1.4, 1.6, 2.6]) => Array.from({ length: n }, (_, i) => B([x0 + i * sp, y0, z0], s, clawP, { pivot: [x0 + i * sp + s[0] / 2, y0 + s[1], z0], rot: [24, 0, 0] }));
const TAPE_R = [A('acc-tape', B([-16.2, 8.6, -4.0], [7.8, 3.0, 7.6], tapeP)), A('acc-tape', B([-16.2, 12.6, -4.0], [7.8, 2.2, 7.6], tapeP, { pivot: [-12.3, 13.7, 0], rot: [0, 0, -8] })), A('acc-tape', B([-16.6, 6.8, -4.2], [8.6, 1.6, 8.4], tapeP))];
const KNUX_R = [A('acc-knux', B([-16.3, 9.4, -4.0], [7.9, 2.4, 7.6], crystalSkin)), ...spike([-15.6, 7.0, -3.8], -58, 30, 3.0, 1.2, 'acc-knux'), ...spike([-12.6, 7.0, -4.0], -64, 0, 3.4, 1.3, 'acc-knux'), ...spike([-9.6, 7.0, -3.8], -58, -24, 3.0, 1.2, 'acc-knux')];
const CHAINS = [
  ...chain([[-7.6, 29.4, 4.4], [-6.6, 26.0, 7.2], [-3.6, 22.8, 7.6], [0, 21.6, 7.7], [3.6, 22.8, 7.6], [6.6, 26.0, 7.2], [7.6, 29.4, 4.4]], { len: 2.6, w: 1.7, t: 0.7, step: 2.0, gold: ironP }),
  ...chain([[-8.8, 27.0, 5.8], [-7.6, 22.0, 7.4], [-4.0, 17.8, 7.8], [0, 16.6, 7.9], [4.0, 17.8, 7.8], [7.6, 22.0, 7.4], [8.8, 27.0, 5.8]], { len: 2.6, w: 1.7, t: 0.7, step: 2.0, gold: ironP }),
].map((c) => A('acc-chains', c));
const PIECE = [...chain([[-6.4, 29.8, 4.6], [-5.0, 26.0, 7.3], [-2.4, 23.2, 7.6], [0, 22.4, 7.7], [2.4, 23.2, 7.6], [5.0, 26.0, 7.3], [6.4, 29.8, 4.6]], { len: 1.6, w: 1.0, t: 0.5, step: 1.2 }), B([-0.5, 20.6, 7.4], [1.0, 1.4, 0.6], gold()), B([-2.4, 14.6, 7.95], [4.8, 6.4, 0], shardP, { plane: 'z' }), B([-1.5, 15.4, 7.3], [3.0, 4.6, 0.6], spikeP)].map((c) => A('acc-piece', c));
export const def = {
  name: 'yeezilla', ppu: 3, scale: 0.85, outline: { color: '#08070a', px: 1.6 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'thighR', parent: 'root', pivot: [-4.8, 14.5, 0], cubes: [B([-7.9, 7.4, -3.6], [6.2, 8.4, 7.2], limbFur)] },
    { name: 'shinR', parent: 'thighR', pivot: [-4.8, 7.8, 0.4], cubes: [B([-7.6, 2.0, -3.0], [5.6, 6.2, 6.4], limbFur)] },
    { name: 'footR', parent: 'shinR', pivot: [-4.8, 2.0, 0.4], cubes: [B([-8.0, 0, -3.4], [6.4, 2.4, 9.0], limbFur), ...CLAWS(-7.7, 0.2, 5.4), A('acc-kicks', B([-8.5, 0, -3.9], [7.4, 3.2, 10.4], kicks)), A('acc-kicks', B([-8.1, 3.0, -3.2], [6.6, 1.6, 6.2], kicks))] },
    { name: 'thighL', parent: 'root', pivot: [4.8, 14.5, 0], cubes: [B([1.7, 7.4, -3.6], [6.2, 8.4, 7.2], limbFur, { mirror: true })] },
    { name: 'shinL', parent: 'thighL', pivot: [4.8, 7.8, 0.4], cubes: [B([2.0, 2.0, -3.0], [5.6, 6.2, 6.4], limbFur, { mirror: true })] },
    { name: 'footL', parent: 'shinL', pivot: [4.8, 2.0, 0.4], cubes: [B([1.6, 0, -3.4], [6.4, 2.4, 9.0], limbFur, { mirror: true }), ...CLAWS(1.9, 0.2, 5.4), A('acc-kicks', B([1.1, 0, -3.9], [7.4, 3.2, 10.4], kicks, { mirror: true })), A('acc-kicks', B([1.5, 3.0, -3.2], [6.6, 1.6, 6.2], kicks, { mirror: true }))] },
    { name: 'body', parent: 'root', pivot: [0, 15, 0], rot: [12, 0, 0], cubes: [
      B([-8.0, 12.0, -5.4], [16.0, 8.0, 10.8], bodyFur2),
      B([-10.0, 19.0, -6.2], [20.0, 11.0, 12.4], bodyFur, { faces: { south: chestP } }),
      B([-11.6, 26.0, -6.6], [23.2, 6.0, 11.6], bodyFur2),
      B([-7.6, 30.0, -6.8], [15.2, 3.6, 9.0], bodyFur),
      B([-5.0, 28.0, 2.0], [10.0, 5.0, 6.0], bodyFur2),
      B([-12.6, 11.4, 0.2], [25.2, 23.4, 0], halo1, { plane: 'z' }),
      // drip: the fur mantle over the shoulders
      A('acc-mantle', B([-12.4, 27.4, -7.4], [24.8, 6.0, 13.0], mantleP)),
      A('acc-mantle', B([-9.0, 32.8, -7.0], [18.0, 1.6, 9.4], mantleP)),
      A('acc-mantle', B([-12.0, 22.4, -7.6], [24.0, 5.2, 0], mantleFringe, { plane: 'z' })),
      A('acc-mantle', B([-12.6, 23.0, -7.0], [0, 4.6, 12.0], mantleFringe, { plane: 'x' })), A('acc-mantle', B([12.6, 23.0, -7.0], [0, 4.6, 12.0], mantleFringe, { plane: 'x' })),
    ] },
    { name: 'chains', parent: 'body', pivot: [0, 29.4, 4.4], cubes: [...CHAINS, ...PIECE] },
    { name: 'armR', parent: 'body', pivot: [-11.2, 29.0, 0], rot: [-12, 0, -4], cubes: [B([-15.6, 17.6, -3.8], [6.6, 12.4, 7.6], limbFur)] },
    { name: 'foreR', parent: 'armR', pivot: [-12.3, 18.6, 0], cubes: [B([-15.8, 7.0, -3.6], [7.0, 12.2, 7.2], limbFur), B([-16.3, 2.2, -4.0], [8.0, 5.4, 8.4], limbFur), ...CLAWS(-15.9, 1.6, 4.0), ...TAPE_R, ...KNUX_R] },
    { name: 'armL', parent: 'body', pivot: [11.2, 29.0, 0], rot: [-12, 0, 4], cubes: [B([9.0, 17.6, -3.8], [6.6, 12.4, 7.6], limbFur, { mirror: true })] },
    { name: 'foreL', parent: 'armL', pivot: [12.3, 18.6, 0], cubes: [B([8.8, 7.0, -3.6], [7.0, 12.2, 7.2], limbFur, { mirror: true }), B([8.3, 2.2, -4.0], [8.0, 5.4, 8.4], limbFur, { mirror: true }), ...CLAWS(9.7, 1.6, 4.0), ...TAPE_R.map(M), ...KNUX_R.map(M)] },
    { name: 'head', parent: 'body', pivot: [0, 31.0, 5.0], rot: [-12, 0, 0], cubes: [
      B([-6.0, 30.4, 1.2], [12.0, 9.4, 7.2], buzzP),
      B([-6.4, 29.6, 4.0], [12.8, 9.6, 9.4], headFur),
      B([-6.8, 31.0, 8.4], [13.6, 8.8, 5.8], crystalSkin),
      B([-7.3, 31.6, 5.0], [14.6, 6.8, 8.0], crystalSkin),
      B([-6.2, 39.0, 3.8], [12.4, 1.4, 9.6], crystalSkin),
      B([-3.6, 29.2, 12.9], [1.3, 2.0, 1.0], toothP), B([2.3, 29.2, 12.9], [1.3, 2.0, 1.0], toothP),
      B([-4.6, 30.4, 6.8], [9.2, 0.7, 6.8], mouthP, { outline: false }),
      ...SPIKES,
    ] },
    ...EYES.bones,
    { name: 'jaw', parent: 'head', pivot: [0, 30.8, 6.0], cubes: [B([-5.6, 26.6, 5.6], [11.2, 4.4, 8.2], jawP)] },
    { name: 'earR', parent: 'head', pivot: [-5.6, 38.6, 3.2], rot: [0, 0, 22], cubes: [B([-8.6, 37.8, 2.4], [4.6, 4.0, 1.9], headFur)] },
    { name: 'earL', parent: 'head', pivot: [5.6, 38.6, 3.2], rot: [0, 0, -22], cubes: [B([4.0, 37.8, 2.4], [4.6, 4.0, 1.9], headFur, { mirror: true })] },
  ],
};
def.drip = [
  [{ id: 'acc-tape', name: 'Red-tape wraps' }, { id: 'acc-knux', name: 'Crystal knuckles' }],
  [{ id: 'acc-chains', name: 'Heavy chains' }, { id: 'acc-piece', name: 'Crystal piece' }],
  [{ id: 'acc-mantle', name: 'Fur mantle' }, { id: 'acc-kicks', name: 'Big black kicks' }],
];
def.attach = {
  head: { bone: 'head', at: [0, 40.4, 7.0], size: 12.4 },
  face: { bone: 'head', at: [0, 35.2, 14.3], size: 13.6 },
  neck: { bone: 'body', at: [0, 29.0, 7.0], size: 14 },
  back: { bone: 'body', at: [0, 24.0, -6.6], size: 20 },
};

// ---------------------------------------------------------------- animation
const TAU = Math.PI * 2, LEG = 6.5;
const face = (P, e) => { if (e) { P.face('eyes', e); P.blinkOK = false; } return P; };
function knees(P, d, sides = ['R', 'L']) {
  const th = (Math.acos(Math.max(-1, Math.min(1, 1 - Math.max(0, d) / (2 * LEG)))) * 180) / Math.PI;
  for (const s of sides) P.pos('thigh' + s, 0, -d, 0).rot('thigh' + s, -th, 0, 0).rot('shin' + s, 2 * th, 0, 0).rot('foot' + s, -th, 0, 0);
}
// a ground-shaking tremor (pos jitter on the root)
const quake = (P, t, k) => P.pos('root', wave(t, 23) * 0.35 * k, Math.abs(wave(t, 17, 1)) * 0.25 * k, wave(t, 19, 2) * 0.3 * k);
// the eye slits pulse like coals
const smoulder = (P, t, k = 1) => eyesScale(P, 1 + 0.06 * k * wave(t, 0.7), 1 + 0.12 * k * wave(t, 0.7));
export const anim = {
  start: 'idle', seed: 66,
  breathe: { bone: 'body', amp: 0.022, per: 3.4 },
  blink: { slot: 'eyes', closed: 'sleepy', every: [4.0, 8.0], dur: 0.1 },
  look: { bone: 'head', yaw: 22, pitch: 10, speed: 2 },
  springs: [
    { bone: 'chains', tip: [0, -8, 3], k: 90, d: 6, gain: 0.9, max: 14, axes: [1, 0.3, 1] },
    { bone: 'earR', tip: [-1, 3, 0], k: 200, d: 10, gain: 0.4, max: 8 },
    { bone: 'earL', tip: [1, 3, 0], k: 200, d: 10, gain: 0.4, max: 8 },
  ],
  faces: { eyes: EYES.slot },
  fidget: { every: [6, 10], clips: ['crack', 'stomp'] },
  clips: {
    // a mountain breathing: the chest heaves, the head turns slowly to scan, breath smokes from the jaw
    idle: { len: 4.0, loop: true, f(P, t) {
      const br = Math.sin((t / 4) * TAU), heave = Math.max(0, br);
      P.pos('body', 0, 0.5 * heave, 0).rot('body', -2 * heave, 0, wave(t, 0.25, 1) * 1.5).rot('armR', 2 * heave, 0, -2 * heave).rot('armL', 2 * heave, 0, 2 * heave);
      knees(P, 0.6 - 0.4 * heave);
      P.rot('head', 3 * heave, wave(t, 0.25) * 16, wave(t, 0.25, 0.6) * 3).rot('jaw', 4 + 5 * Math.max(0, -br));
      const [gx, gy] = glance(t, [[0, 0], [-0.4, 0], [-0.4, 0], [0.4, 0.1]], 1.0, 0.2); eyesAt(P, gx, gy); smoulder(P, t);
      if (br < -0.3) P.stream('steam', 'head', [0, 29, 13], { rate: 6, dir: [0, -0.2, 1], spread: 0.4, speed: 0.5, scale: 1.2 });
      P.burst(1.2, 'sparkle', 'head', [-4, 43, 8], { n: 1, speed: 0.1 }).burst(2.9, 'sparkle', 'head', [5, 41, 9], { n: 1, speed: 0.1 });
    } },
    // a heavy knuckle-walk: each footfall thuds, the shoulders roll
    walk: { len: 1.6, loop: true, f(P, t) {
      const ph = (t / 1.6) * TAU, s = Math.sin(ph), c = Math.cos(ph), amp = 18;
      for (const [side, sg] of [['R', 1], ['L', -1]]) {
        const sw = s * sg, kn = Math.max(0, c * sg) * 30;
        P.rot('thigh' + side, -sw * amp - kn * 0.5, 0, 0).rot('shin' + side, kn, 0, 0).rot('foot' + side, sw * amp * 0.7 - kn * 0.5, 0, 0);
        P.rot('arm' + side, sw * 22, 0, 0).rot('fore' + side, -Math.max(0, -c * sg) * 20, 0, 0);
      }
      const dy = -LEG * 2 * (1 - Math.cos((amp * Math.abs(s) * Math.PI) / 180)) - 0.4;
      P.pos('thighR', 0, dy, 0).pos('thighL', 0, dy, 0).pos('body', 0, dy, 0).rot('body', 2, s * 6, s * 4).rot('head', 0, -s * 6, -s * 3);
      smoulder(P, t, 0.5);
      P.burst(0.4, 'dust', 'footR', [-4.8, 0.5, 2], { n: 4, spread: 1, speed: 0.6 }).burst(1.2, 'dust', 'footL', [4.8, 0.5, 2], { n: 4, spread: 1, speed: 0.6 });
    } },
    // the roar: it rears to its full height, arms flung wide, jaw gaping, eyes flaring white-hot — the ground shakes
    cry: { len: 2.6, next: 'idle', f(P, t) {
      const load = seg(t, 0, 0.5, E.inout) * (1 - seg(t, 0.5, 0.62, E.out)), rear = seg(t, 0.5, 0.78, E.back) * (1 - seg(t, 2.0, 2.5, E.inout)), roar = seg(t, 0.62, 0.8) * (1 - seg(t, 1.9, 2.2));
      knees(P, 1.6 * load + 0.2);
      P.rot('body', 8 * load - 26 * rear, 0, 0).pos('body', 0, -1 * load + 2.5 * rear, 0);
      P.rot('armR', 20 * load - 60 * rear, 0, 10 * load - 70 * rear).rot('armL', 20 * load - 60 * rear, 0, -10 * load + 70 * rear).rot('foreR', -40 * rear, 0, 0).rot('foreL', -40 * rear, 0, 0);
      P.rot('head', 14 * load - 30 * rear + wave(t, 9) * 3 * roar, wave(t, 5) * 4 * roar, 0).rot('jaw', 4 * load + 40 * roar);
      quake(P, t, roar);
      eyesScale(P, 1 + 0.25 * roar, 1 + 0.4 * roar);
      face(P, roar > 0.2 ? 'wide' : load > 0.2 ? 'angry' : undefined);
      if (roar > 0.5) P.stream('steam', 'head', [0, 30, 14], { rate: 30, dir: [0, 0.2, 1], spread: 0.5, speed: 1.6, scale: 1.4 }).stream('rock', 'root', [0, 0, 6], { rate: 10, spread: 1, speed: 0.8 });
      P.burst(0.8, 'ring', 'root', [0, 1, 4], { scale: 3 }).burst(0.8, 'dust', 'root', [0, 1, 4], { n: 18, spread: 1, speed: 1.4 }).burst(1.2, 'ring', 'root', [0, 1, 4], { scale: 3.5 }).burst(0.75, 'anger', 'head', [7, 44, 8], {});
      P.burst(0.82, 'sparkle', 'head', [0, 42, 8], { n: 10, speed: 1.6 });
    } },
    // the hammer: both fists rise slowly overhead… and slam the ground
    attack: { len: 1.6, next: 'idle', f(P, t) {
      const lift = seg(t, 0.05, 0.62, E.inout) * (1 - seg(t, 0.62, 0.74, E.in3)), slam = seg(t, 0.62, 0.74, E.in3) * (1 - seg(t, 0.95, 1.5, E.inout));
      knees(P, 0.4 + 1.4 * lift + 2.2 * slam);
      P.rot('body', -14 * lift + 22 * slam, 0, 0).pos('root', 0, 0, 2.5 * slam);
      P.rot('armR', -170 * lift - 60 * slam, 0, 14 * lift).rot('armL', -170 * lift - 60 * slam, 0, -14 * lift).rot('foreR', -20 * lift, 0, 0).rot('foreL', -20 * lift, 0, 0);
      P.rot('head', -16 * lift + 10 * slam, 0, 0).rot('jaw', 10 * lift + 26 * slam);
      quake(P, t, bump(t, 0.72, 1.1));
      eyesScale(P, 1 + 0.2 * slam, 1 + 0.3 * slam - 0.2 * lift);
      face(P, lift > 0.2 ? 'angry' : slam > 0.2 ? 'wide' : undefined);
      P.burst(0.74, 'ring', 'root', [0, 1, 14], { scale: 3 }).burst(0.74, 'dust', 'root', [0, 1, 14], { n: 20, spread: 1, speed: 1.6 }).burst(0.74, 'rock', 'root', [0, 2, 14], { n: 10, spread: 0.8, speed: 1.4 });
      P.burst(0.74, 'spark', 'root', [0, 2, 14], { scale: 2 }).burst(0.76, 'bear-crystal', 'root', [0, 2, 14], { n: 8, dir: [0, 1, 0.4], spread: 0.8 });
    } },
    // the special: the crystals drink the light, then it rears and stamps — a storm of shards and a quake
    special: { len: 3.0, next: 'idle', f(P, t) {
      const gather = seg(t, 0, 0.9, E.inout) * (1 - seg(t, 0.9, 1.0, E.out)), rear = seg(t, 0.9, 1.15, E.back) * (1 - seg(t, 1.3, 1.45, E.in3)), stamp = seg(t, 1.35, 1.45, E.in3) * (1 - seg(t, 2.3, 2.9, E.inout));
      knees(P, 1.8 * gather + 2.4 * stamp + 0.2);
      P.rot('body', 10 * gather - 24 * rear + 14 * stamp, 0, 0).pos('body', 0, 2 * rear, 0);
      P.rot('armR', -40 * gather - 80 * rear + 30 * stamp, 0, -20 * gather - 50 * rear).rot('armL', -40 * gather - 80 * rear + 30 * stamp, 0, 20 * gather + 50 * rear);
      P.rot('head', 16 * gather - 30 * rear + 6 * stamp, 0, 0).rot('jaw', 30 * rear + 16 * stamp);
      P.scl('head', 1 + 0.04 * gather, 1 + 0.04 * gather, 1 + 0.04 * gather);
      quake(P, t, gather * 0.4 + bump(t, 1.4, 2.3) * 1.2);
      eyesScale(P, 1 + 0.3 * rear, 1 + 0.5 * rear);
      face(P, gather > 0.3 ? 'angry' : rear + stamp > 0.2 ? 'wide' : undefined);
      if (gather > 0.2) P.stream('sparkle', 'head', [0, 40, 8], { rate: 24, spread: 1, speed: 0.6 }).stream('bear-crystal', 'head', [0, 44, 7], { rate: 6, dir: [0, 1, 0], spread: 0.6, speed: 0.3 });
      P.burst(1.42, 'bear-crystal', 'head', [0, 40, 8], { n: 46, dir: [0, 0.8, 0.6], spread: 1, speed: 1.3 }).burst(1.42, 'ring', 'root', [0, 1, 4], { scale: 4 }).burst(1.62, 'ring', 'root', [0, 1, 4], { scale: 5 });
      P.burst(1.42, 'dust', 'root', [0, 1, 4], { n: 24, spread: 1, speed: 1.8 }).burst(1.44, 'rock', 'root', [0, 2, 6], { n: 16, spread: 1, speed: 1.6 });
      if (t > 1.45 && t < 2.3) P.stream('bear-crystal', 'root', [0, 2, 8], { rate: 30, dir: [0, 1, 0.3], spread: 1, speed: 0.9 }).stream('dust', 'root', [0, 1, 0], { rate: 14, spread: 1, speed: 1 });
    } },
    hurt: { len: 0.8, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.1, E.out) * (1 - seg(t, 0.3, 0.8, E.inout));
      P.pos('root', 0, 0, -1.2 * k).rot('body', -7 * k + wob(t, 0.3, 2, 2.5, 6), 0, wave(t, 11) * 2 * k).rot('head', -12 * k, 10 * k, 0).rot('jaw', 22 * k);
      eyesScale(P, 1 - 0.2 * k, 1 - 0.5 * k); face(P, t < 0.4 ? 'angry' : undefined);
      P.burst(0.02, 'spark', 'head', [0, 36, 14], {}).burst(0.02, 'bear-crystal', 'head', [0, 38, 12], { n: 5, speed: 0.8 }).burst(0.05, 'steam', 'head', [0, 29, 13], { n: 4, speed: 0.8 }).burst(0.1, 'anger', 'head', [7, 44, 8], {});
    } },
    // it staggers, drops to its knees, and crashes down onto its chest; the slits gutter out
    faint: { len: 3.0, next: 'down', f(P, t) {
      const stag = seg(t, 0, 0.3) * (1 - seg(t, 0.8, 0.9)), kneel = seg(t, 0.7, 1.2, E.in), crash = seg(t, 1.4, 1.9, E.bounce);
      P.rot('body', 0, wave(t, 1.1) * 8 * stag, wave(t, 1.6) * 6 * stag).rot('head', 0, wave(t, 1.6, 1) * 10 * stag, 0);
      P.pos('thighR', 0, -6.5 * kneel, 0).pos('thighL', 0, -6.5 * kneel, 0).pos('body', 0, -6.5 * kneel, 0);
      P.rot('thighR', -84 * kneel, 0, 0).rot('thighL', -84 * kneel, 0, 0).rot('shinR', 84 * kneel, 0, 0).rot('shinL', 84 * kneel, 0, 0).rot('footR', 40 * kneel, 0, 0).rot('footL', 40 * kneel, 0, 0);
      P.rot('body', 20 * kneel + 50 * crash, 0, 0).pos('root', 0, 0, 3 * crash).rot('armR', -30 * crash, 0, -40 * crash).rot('armL', -30 * crash, 0, 40 * crash).rot('head', -20 * crash, 30 * crash, 0).rot('jaw', 20 * crash);
      quake(P, t, bump(t, 1.85, 2.4));
      face(P, t < 1.3 ? 'angry' : t < 1.9 ? 'swirl' : 'x');
      P.burst(1.2, 'dust', 'root', [0, 1, 3], { n: 10, spread: 1 }).burst(1.88, 'dust', 'root', [0, 1, 12], { n: 22, spread: 1, speed: 1.5 }).burst(1.88, 'rock', 'root', [0, 2, 12], { n: 8, spread: 1 }).burst(1.9, 'bear-crystal', 'head', [0, 36, 12], { n: 10, speed: 0.8 });
    } },
    down: { len: 3.4, loop: true, f(P, t) {
      const br = Math.sin((t / 3.4) * TAU);
      P.pos('thighR', 0, -6.5, 0).pos('thighL', 0, -6.5, 0).pos('body', 0, -6.5 + 0.3 * br, 0);
      P.rot('thighR', -84, 0, 0).rot('thighL', -84, 0, 0).rot('shinR', 84, 0, 0).rot('shinL', 84, 0, 0).rot('footR', 40, 0, 0).rot('footL', 40, 0, 0);
      P.rot('body', 70, 0, 0).pos('root', 0, 0, 3).rot('armR', -30, 0, -40).rot('armL', -30, 0, 40).rot('head', -20, 30, 0).rot('jaw', 20 + 4 * br);
      face(P, t % 1.7 < 0.15 ? 'sleepy' : 'x'); P.lookW = 0; P.breathW = 0.5;
      if (br > 0.6) P.stream('steam', 'head', [0, 29, 13], { rate: 3, speed: 0.3, scale: 0.8 });
    } },
    // victory: it pounds its chest — left, right, left — then raises one fist and lets out a short roar
    win: { len: 3.0, next: 'idle', f(P, t) {
      const beat = seg(t, 0.1, 0.3) * (1 - seg(t, 1.6, 1.8)), fist = seg(t, 1.8, 2.1, E.back) * (1 - seg(t, 2.6, 3.0, E.inout));
      const L = Math.max(0, Math.sin(t * Math.PI * 3.2)) * beat, R = Math.max(0, -Math.sin(t * Math.PI * 3.2)) * beat;
      P.rot('armR', -70 * beat - 30 * R - 150 * fist, 0, 30 * beat).rot('foreR', -70 * beat, 0, 20 * beat).rot('armL', -70 * beat - 30 * L, 0, -30 * beat).rot('foreL', -70 * beat, 0, -20 * beat);
      P.rot('body', -10 * beat - 14 * fist, 0, 0).sq('body', -0.04 * (L + R)).rot('head', -12 * beat - 20 * fist, 0, 0).rot('jaw', 14 * (L + R) + 34 * fist);
      knees(P, 0.4 + 0.6 * (L + R));
      quake(P, t, 0.4 * (L + R) + fist);
      face(P, fist > 0.2 ? 'wide' : 'angry');
      P.burst(0.4, 'dust', 'body', [0, 25, 8], { n: 4 }).burst(0.72, 'dust', 'body', [0, 25, 8], { n: 4 }).burst(1.03, 'dust', 'body', [0, 25, 8], { n: 4 });
      P.burst(1.95, 'ring', 'root', [0, 1, 4], { scale: 3 }).burst(1.95, 'sparkle', 'head', [0, 42, 8], { n: 12, speed: 1.6 }).burst(1.95, 'bear-crystal', 'head', [0, 44, 8], { n: 10, dir: [0, 1, 0], speed: 1.2 });
    } },
    // asleep sitting, slumped like a hill, head bowed, the slits dark; smoke curls on each breath
    sleep: { len: 4.4, loop: true, f(P, t) {
      const br = Math.sin((t / 4.4) * TAU);
      P.pos('root', 0, -7.2, 0).rot('thighR', -88, 10, 0).rot('thighL', -88, -10, 0).rot('shinR', 70, 0, 0).rot('shinL', 70, 0, 0).rot('footR', 18, 0, 0).rot('footL', 18, 0, 0);
      P.rot('body', 18 + br * 2, 0, 0).rot('head', 26 + br * 2, 0, 6).rot('armR', -20, 0, -10).rot('armL', -20, 0, 10).rot('foreR', -30, 0, 0).rot('foreL', -30, 0, 0);
      face(P, 'sleepy'); P.lookW = 0; P.breathW = 0.6;
      if (br < -0.4) P.stream('steam', 'head', [0, 29, 13], { rate: 4, speed: 0.3, scale: 1 });
      P.burst(1.0, 'z', 'head', [6, 44, 6], { scale: 1.6 }).burst(3.0, 'z', 'head', [6, 44, 6], { scale: 1.6 });
    } },
    // fidget: it cracks its neck — left, right — and flexes its claws
    crack: { len: 2.2, next: 'idle', f(P, t) {
      const a = bump(t, 0.2, 0.75), b = bump(t, 0.85, 1.4), flex = bump(t, 1.4, 2.1);
      P.rot('head', 4 * (a + b), 0, 26 * a - 26 * b).rot('foreR', -30 * flex, 0, 0).rot('foreL', -30 * flex, 0, 0).sq('body', 0.02 * flex);
      face(P, a + b > 0.4 ? 'sleepy' : flex > 0.3 ? 'angry' : undefined);
      P.burst(0.5, 'spark', 'head', [-5, 32, 6], { scale: 0.8 }).burst(1.12, 'spark', 'head', [5, 32, 6], { scale: 0.8 });
    } },
    // fidget: a slow, deliberate stomp that cracks the ground — just to make the point
    stomp: { len: 2.0, next: 'idle', f(P, t) {
      const up = seg(t, 0.1, 0.7, E.inout) * (1 - seg(t, 0.7, 0.8, E.in3));
      P.rot('thighR', -60 * up, 0, 0).rot('shinR', 50 * up, 0, 0).pos('thighR', 0, 1.5 * up, 0).rot('body', 0, 0, -4 * up + wob(t, 0.8, 2, 3, 5));
      knees(P, 0.6, ['L']); quake(P, t, bump(t, 0.78, 1.3));
      face(P, up > 0.3 ? 'angry' : undefined);
      P.burst(0.8, 'dust', 'footR', [-4.8, 0.5, 2], { n: 14, spread: 1, speed: 1.2 }).burst(0.8, 'rock', 'footR', [-4.8, 1, 3], { n: 6 }).burst(0.8, 'ring', 'footR', [-4.8, 0.5, 2], { scale: 2 });
    } },
  },
};
def.anim = anim;
