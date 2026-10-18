// Trashcoon — the AC/DC homage, stage 1. A scrappy little alley raccoon who cut himself a
// schoolboy cap out of a cardboard box (taped seams, a torn brim, ear slots, a bottle-cap button),
// knotted a flattened soda can on as a tie, and picked up a forked stick that he plays like a horned guitar — power chords on a rubber-band
// string. He can't stand still: he headbangs on every beat, his walk is a one-legged hopping
// duck-walk, and when the riff takes him he drops and spins on the floor. Big glossy kawaii eyes in
// the bandit mask, a snaggle fang, little bolt-shaped notches in his tail rings. Homage, never a
// likeness: no logos, no covers, no real people.
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import {
  PAL, J, P, mirrorCube, aimX, furP, bellyP, tuftP, skullP, muzzleP, noseP, jawP, mouthP, tongueP, toothP, whiskerP,
  earPlaneP, kawaiiEyes, tailP, handP, footP, cardP, tapeP, bottleCapP, barkP, leafP, tieP, tabP, rig, shift, ramp,
} from './raccoon_parts.js';

const F = PAL.trash;

// ---------------------------------------------------------------- painters
const fur = furP(F);
const furBack = furP(F, { c: shift(F.c, -0.05), top: F.c, bottom: F.deep });
const furFringe = furP(F, { fringe: true });
const belly = bellyP(F, { cy: 0.66, rx: 0.36, ry: 0.62 });
const potBelly = bellyP(F, { cy: 0.5, rx: 0.42, ry: 0.75 });
const chestP = (p, w, h, face, cube) => {   // a pale bib under the chin
  fur(p, w, h, face, cube);
  if (face !== 'south') return;
  const cx = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const hw = w * (0.2 + 0.12 * (y / h)) - ((x + y) % 3 === 0 ? 1 : 0); if (Math.abs(x - cx) < hw) p.px(x, y, Math.abs(x - cx) > hw - 1.2 ? F.bellyLo : y < 3 ? F.bellyHi : F.belly); }
};
const cheekP = (p, w, h, face) => {   // fluffy jowls: pale below, grey above
  furP(F, { c: F.cream, top: F.creamHi, bottom: F.creamLo, sx: 5, sy: 4 })(p, w, h, face);
  if (face === 'up') { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 5 === 0 ? F.lo : F.c); }
  if (face === 'north') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y < h / 2 ? F.c : F.lo);
  if (face === 'east' || face === 'west') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const front = face === 'east' ? x : w - 1 - x, edge = h * 0.45 + (front < w * 0.4 ? 0 : (front - w * 0.4) * 0.5) + (x % 3 === 1 ? 1 : 0); if (y < edge) p.px(x, y, y === 0 ? F.hi : (x + y) % 6 === 0 ? F.lo : F.c); }
};
// the face: eyes sit at x = ±2.4, y = 15.6 (texels: ex 7.2, ey 8.7 from the top of the 7.667-unit skull)
const skull = skullP(F, { ex: 7.2, ey: 8.7, mh: 5.0 });
const muzzle = muzzleP(F, { bw: 1.6, bt: 1.4 });
const snout = muzzleP(F, { mouth: true, bridge: false });
const nose = noseP(F);
const jaw = jawP(F);
const brow = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? F.creamHi : face === 'down' ? F.creamLo : y === 0 ? F.creamHi : F.cream); };
const hand = handP(F), foot = footP(F);
// limbs: grey fur that darkens into black "socks" at the paws
const sock = (k) => (p, w, h, face, cube) => {
  fur(p, w, h, face, cube);
  if (face === 'up' || face === 'down') return;
  const y0 = Math.round(h * (1 - k));
  for (let y = y0; y < h; y++) for (let x = 0; x < w; x++) { if (y === y0 && x % 3 === 1) continue; p.px(x, y, ramp([F.pawHi, F.paw, F.paw, F.pawLo], (y - y0) / Math.max(1, h - y0), x, y)); }
};
// the cardboard cap: the band (taped seam, a shipping label), a puffy six-panel crown with ear
// slots, a bottle-cap button, a torn brim
const bandP = (p, w, h, face, cube) => {
  cardP({ tape: face === 'west' ? [[0.66, 0.76]] : face === 'north' ? [[0.42, 0.52]] : [], label: face === 'east', labelAt: 0.42 })(p, w, h, face, cube);
  if (face === 'south' || face === 'north' || face === 'east' || face === 'west') for (let x = 0; x < w; x++) p.px(x, h - 2, shift(J.cardLo, -0.06));
};
const puffP = (p, w, h, face, cube) => {
  cardP({ upFlat: true, stains: face === 'west' || face === 'north' })(p, w, h, face, cube);
  if (face === 'south' || face === 'north' || face === 'east' || face === 'west') for (let x = 2; x < w; x += 9) for (let y = 1; y < h; y++) p.px(x, y, J.cardLo);   // panel seams
};
const capTopP = (p, w, h, face, cube) => {
  cardP({ upFlat: true })(p, w, h, face, cube);
  if (face !== 'up') return;
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.5; for (let r = 2; r < Math.max(w, h); r++) p.px(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * (h / w)), J.cardLo); }
  for (const sx of [-1, 1]) { const x0 = Math.round(cx + sx * 3.4 * 3) - 4; p.rect(x0, Math.round(cy) - 1, 9, 3, J.cardDeep); p.hl(x0, x0 + 8, Math.round(cy) - 2, J.cardIn); }   // the ear slots
};
const brimP = (p, w, h, face, cube) => {
  cardP({ upFlat: true, edge: face !== 'south' })(p, w, h, face, cube);
  if (face === 'up') { for (let y = 0; y < h; y++) for (let x = Math.round(w * 0.2); x < Math.round(w * 0.32); x++) p.px(x, y, (x + y) % 6 === 0 ? J.tapeHi : J.tape); for (let x = 0; x < w; x++) p.px(x, h - 1, J.cardDeep); }
  if (face === 'south') for (let x = 0; x < w; x++) p.px(x, 0, x % 2 ? J.cardIn : J.cardDeep);   // the corrugated cut edge
  if (face === 'down') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 2 ? J.cardDeep : shift(J.cardDeep, -0.1));
};
// the torn corner of the brim, hanging by a strip: ragged fibres along its torn edge
const flapP = (p, w, h) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if ((y > h - 3 && (x * 3 + y) % 4 === 0) || (y === h - 1 && x % 2)) continue;
    p.px(x, y, y === 0 ? J.cardDeep : x === 0 || x === w - 1 ? J.cardLo : y > h - 3 ? J.cardIn : J.card);
  }
};
const stick = barkP({ string: true, s0: 3, s1: 4 });
const stickNub = barkP();
// kawaii eyes: a dark warm-brown iris that lightens to amber at the bottom
const EYES = kawaiiEyes({ dark: '#3c2614', mid: '#8e561a', light: '#f0aa30' });

// ---------------------------------------------------------------- the model
// the stick-guitar: its base (the "body") rests in front of the right hip and the neck runs up
// and across to the left; local +x runs along the stick, local +y is "up", local +z faces out
const SB = [-4.0, 4.3, 5.6], SL = 16, SDIR = [1, 0.46, 0.1], SUP = [0, 1, 0];
const s = (dx, dy, dz) => [SB[0] + dx, SB[1] + dy, SB[2] + dz];
const STRUM = s(2.7, 0.9, 0.5), FRET = s(11.6, 0.5, 0.6);
const EYE_SZ = [2.333, 2.667, 0], EYE_Y = 14.267;
const eyeParts = (side) => Object.entries(EYES).map(([k, fn]) => P(side < 0 ? [-3.567, EYE_Y, 4.38] : [1.233, EYE_Y, 4.38], EYE_SZ, fn, { plane: 'z', mirror: side > 0, id: 'eye-' + k, hide: k !== 'open' }));
// the ears poke up through two slots cut in the cardboard cap
const earCubes = [
  P([-4.667, 19.333, -0.833], [2.0, 1.667, 1.0], fur),
  P([-5.667, 20.0, -0.25], [4.0, 4.667, 0], earPlaneP(F, false), { plane: 'z' }),
  P([-5.667, 20.0, -0.42], [4.0, 4.667, 0], earPlaneP(F, true), { plane: 'z' }),
];
const armCubes = [P([-5.233, 6.667, 0.5], [1.8, 3.667, 1.8], fur), P([-5.5, 8.667, 0.233], [2.333, 1.833, 2.333], fur)];
const foreCubes = [P([-5.167, 4.0, 0.567], [1.667, 3.333, 1.667], sock(0.5)), P([-5.333, 2.667, 0.4], [2.0, 1.333, 2.0], hand)];
const legCubes = [
  P([-5.333, 1.0, -3.0], [4.0, 4.333, 5.0], fur, { faces: { north: furBack } }),
  P([-5.667, 1.667, -2.667], [4.333, 3.0, 4.333], furFringe),
  P([-4.333, 0.333, -1.333], [2.667, 1.333, 2.667], sock(1)),
];
const footCube = P([-3.933, 0.0, -1.4], [2.667, 1.0, 4.667], foot, { pivot: [-2.6, 0, 0.6], rot: [0, -12, 0] });
// a chamfered tail segment (two crossed boxes) with continuous rings
const tailSeg = (cx, cy, z0, len, w, h, s0, o = {}) => [
  P([cx - w / 2, cy - (h - 0.667) / 2, z0 - len], [w, h - 0.667, len], tailP(F, s0, o)),
  P([cx - (w - 1) / 2, cy - h / 2, z0 - len], [w - 1, h, len], tailP(F, s0, o)),
];
export const def = {
  name: 'trashcoon', ppu: 3, scale: 0.4, outline: { color: F.ink, px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'footR', parent: 'root', pivot: [-2.6, 0, 0.6], cubes: [footCube] },
    { name: 'footL', parent: 'root', pivot: [2.6, 0, 0.6], cubes: [mirrorCube(footCube)] },
    { name: 'legR', parent: 'root', pivot: [-2.8, 4.8, -0.6], cubes: legCubes },
    { name: 'legL', parent: 'root', pivot: [2.8, 4.8, -0.6], cubes: legCubes.map(mirrorCube) },
    { name: 'body', parent: 'root', pivot: [0, 4.6, -0.6], rot: [14, 0, 0], cubes: [
      // a pear: wide furry hips with a pot belly, a narrower chest with a pale bib, rounded shoulders
      P([-5.167, 2.333, -3.333], [10.333, 5.333, 7.0], fur, { faces: { south: belly, north: furBack } }),
      P([-5.667, 2.667, -2.833], [11.333, 4.333, 6.0], furFringe, { faces: { south: belly, north: furBack } }),
      P([-3.833, 3.0, 3.667], [7.667, 4.667, 0.667], potBelly),
      P([-4.5, 7.333, -3.0], [9.0, 3.667, 6.333], fur, { faces: { south: chestP, north: furBack } }),
      P([-3.833, 10.667, -2.5], [7.667, 0.667, 5.333], fur),
      P([-4.0, 7.667, -3.667], [8.0, 3.0, 1.0], furBack),
      P([-2.333, 8.667, 3.36], [4.667, 2.333, 0], tuftP(F, { cream: true }), { plane: 'z', pivot: [0, 10, 3.36], rot: [0, 0, -90] }),
      P([-0.667, 9.167, 3.167], [1.333, 1.333, 0.667], tabP),
    ] },
    // a flattened soda can worn as a schoolboy tie, its pull tab for the knot
    { name: 'tie', parent: 'body', pivot: [0, 9.4, 3.6], rot: [-14, 0, 0], cubes: [P([-1.333, 4.9, 3.65], [2.667, 4.5, 0], tieP, { plane: 'z' })] },
    { name: 'tail1', parent: 'body', pivot: [0.6, 4.0, -3.0], rot: [14, -28, 0], cubes: tailSeg(0.6, 4.0, -2.4, 5.6, 3.667, 3.667, 6) },
    { name: 'tail2', parent: 'tail1', pivot: [0.6, 4.0, -7.6], rot: [22, -8, 0], cubes: tailSeg(0.6, 4.0, -6.9, 6.0, 4.333, 4.333, 19) },
    { name: 'tail3', parent: 'tail2', pivot: [0.6, 4.0, -12.6], rot: [24, 0, 0], cubes: tailSeg(0.6, 4.0, -11.9, 5.4, 3.667, 3.667, 34) },
    { name: 'tail4', parent: 'tail3', pivot: [0.6, 4.0, -17.0], rot: [14, 0, 0], cubes: tailSeg(0.6, 4.0, -16.3, 4.7, 3.0, 3.0, 47, { tipAt: 53 }) },
    { name: 'armR', parent: 'body', pivot: [-4.333, 10.0, 1.4], cubes: armCubes },
    { name: 'foreR', parent: 'armR', pivot: [-4.333, 7.0, 1.4], hand: [-4.333, 3.233, 1.4], cubes: foreCubes },
    { name: 'armL', parent: 'body', pivot: [4.333, 10.0, 1.4], cubes: armCubes.map(mirrorCube) },
    { name: 'foreL', parent: 'armL', pivot: [4.333, 7.0, 1.4], hand: [4.333, 3.233, 1.4], cubes: foreCubes.map(mirrorCube) },
    // the stick-guitar: a knobbly base, two short forked horns, a long neck strung with a rubber band, twig pegs, a sprig of leaves
    { name: 'stick', parent: 'body', pivot: SB, rot: aimX(SDIR, SUP), cubes: [
      P(s(-1.333, -1.167, -0.833), [3.333, 2.333, 1.667], stickNub),
      P(s(-0.2, -0.6, -0.6), [SL, 1.2, 1.2], stick),
      P(s(1.2, 0.4, -0.45), [3.0, 0.9, 0.9], stickNub, { pivot: s(1.4, 0.8, 0), rot: [0, 0, 38] }),
      P(s(1.2, -1.3, -0.45), [2.8, 0.9, 0.9], stickNub, { pivot: s(1.4, -0.9, 0), rot: [0, 0, -36] }),
      P(s(SL - 3.6, 0.5, -0.35), [0.7, 1.2, 0.7], stickNub),
      P(s(SL - 2.2, 0.5, -0.35), [0.7, 1.0, 0.7], stickNub),
      P(s(SL - 3.0, -1.5, -0.35), [0.7, 1.0, 0.7], stickNub),
      P(s(SL - 1.0, 0.2, 0), [2.4, 2.4, 0], leafP, { plane: 'z', pivot: s(SL - 0.6, 0.4, 0), rot: [0, 0, -30] }),
      P(s(SL - 1.4, 0.4, 0.1), [2.0, 2.0, 0], leafP, { plane: 'z', pivot: s(SL - 1.0, 0.6, 0.1), rot: [0, 0, 40] }),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 11.4, 0.6], rot: [-12, 0, 0], cubes: [
      // a wide, shallow skull tapering at the back, fluffy jowls with flared cheek tufts, a pointed muzzle
      P([-5.0, 11.0, -2.0], [10.0, 7.667, 6.333], fur, { faces: { south: skull, east: skull, west: skull, north: furBack } }),
      P([-4.333, 11.333, -3.0], [8.667, 6.333, 1.0], furBack),
      P([-5.333, 10.667, -1.0], [10.667, 3.0, 5.0], cheekP),
      P([-8.333, 9.333, 1.0], [3.333, 4.333, 0], tuftP(F, { cream: true }), { plane: 'z', mirror: true, pivot: [-5.2, 11.5, 1.0], rot: [0, -28, -8] }),
      P([5.0, 9.333, 1.0], [3.333, 4.333, 0], tuftP(F, { cream: true, ph: 1 }), { plane: 'z', pivot: [5.2, 11.5, 1.0], rot: [0, 28, 8] }),
      P([-7.667, 10.333, -1.4], [2.667, 3.667, 0], tuftP(F, { ph: 2 }), { plane: 'z', mirror: true, pivot: [-5.0, 12.0, -1.4], rot: [0, -40, 0] }),
      P([5.0, 10.333, -1.4], [2.667, 3.667, 0], tuftP(F, { ph: 3 }), { plane: 'z', pivot: [5.0, 12.0, -1.4], rot: [0, 40, 0] }),
      P([-2.0, 11.333, 4.0], [4.0, 2.667, 2.333], muzzle),
      P([-1.333, 11.667, 6.0], [2.667, 2.0, 1.667], snout),
      P([-0.667, 12.833, 7.5], [1.333, 0.833, 0.667], nose),
      P([0.5, 11.2, 7.3], [0.5, 0.667, 0.333], toothP),
      P([-5.667, 11.667, 6.9], [3.667, 1.667, 0], whiskerP, { plane: 'z', mirror: true }),
      P([2.0, 11.667, 6.9], [3.667, 1.667, 0], whiskerP, { plane: 'z' }),
      ...eyeParts(-1), ...eyeParts(1),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 11.667, 4.333], cubes: [
      P([-1.667, 10.333, 4.0], [3.333, 1.333, 3.0], jaw),
      P([-1.5, 11.367, 4.167], [3.0, 0.3, 2.667], mouthP, { outline: false }),
      P([-1.0, 11.4, 4.567], [2.0, 0.3, 2.0], tongueP, { outline: false }),
      P([-0.5, 10.4, 6.567], [1.0, 0.333, 2.0], tongueP, { id: 'tongue-out', hide: true, outline: false, pivot: [0, 11.4, 6.567], rot: [55, 0, 0] }),
    ] },
    { name: 'browR', parent: 'head', pivot: [-2.4, 18.1, 4.47], rot: [0, 0, -12], cubes: [P([-3.733, 17.867, 4.167], [2.667, 0.5, 0.5], brow)] },
    { name: 'browL', parent: 'head', pivot: [2.4, 18.1, 4.47], rot: [0, 0, 12], cubes: [P([1.067, 17.867, 4.167], [2.667, 0.5, 0.5], brow, { mirror: true })] },
    { name: 'earR', parent: 'head', pivot: [-3.667, 19.667, -0.333], rot: [-4, 14, 24], cubes: earCubes },
    { name: 'earL', parent: 'head', pivot: [3.667, 19.667, -0.333], rot: [-4, -14, -24], cubes: earCubes.map(mirrorCube) },
    { name: 'cap', parent: 'head', pivot: [0, 18.667, 0.4], rot: [-6, 0, 7], cubes: [
      P([-5.167, 18.0, -3.833], [10.333, 2.0, 8.667], bandP),
      P([-5.5, 19.667, -4.167], [11.0, 1.667, 9.333], puffP),
      P([-4.667, 21.333, -3.333], [9.333, 0.5, 7.667], capTopP),
      P([-0.667, 21.833, 0.0], [1.333, 0.5, 1.333], bottleCapP()),
      P([1.333, 21.267, -4.333], [1.333, 0.75, 9.667], tapeP),
      P([-4.333, 18.0, 4.833], [8.667, 0.5, 3.667], brimP, { pivot: [0, 18.25, 4.833], rot: [12, 0, 0] }),
    ] },
    { name: 'flap', parent: 'cap', pivot: [3.3, 17.567, 8.3], rot: [62, 0, 8], cubes: [P([2.3, 17.567, 8.3], [2.0, 0, 1.333], flapP, { plane: 'y' })] },
  ],
};
// buyable gear sockets (model units): top of the head, between the eyes, front of the neck, middle of the back
def.attach = {
  head: { bone: 'head', at: [0, 18.667, 1.2], size: 10 },
  face: { bone: 'head', at: [0, 15.6, 4.4], size: 10 },
  neck: { bone: 'body', at: [0, 10.2, 3.4], size: 7.667 },
  back: { bone: 'body', at: [0, 7.0, -3.667], size: 9 },
};

// ---------------------------------------------------------------- rig: the paws hold the stick at rest
const R = rig(def);
const POLE_R = [-1, -0.5, -0.5], POLE_L = [1, -0.6, -0.4];
R.reach(null, 'armR', 'foreR', R.at(null, 'stick', STRUM), { pole: POLE_R });
R.reach(null, 'armL', 'foreL', R.at(null, 'stick', FRET), { pole: POLE_L });

// ---------------------------------------------------------------- animation
// keep the feet planted while the hips rise / sink by dy (the haunches stretch to reach)
function plant(P, dy, which = ['legR', 'legL']) { for (const l of which) P.pos(l, 0, dy, 0).scl(l, 1, Math.max(0.4, (4.47 + dy) / 4.47), 1); }
// aim the stick (local +x) along dir, in body space
function aimStick(P, dir, up = SUP) { const a = aimX(dir, up), r = R.B.stick.rot; P.b.stick.r[0] = a[0] - r[0]; P.b.stick.r[1] = a[1] - r[1]; P.b.stick.r[2] = a[2] - r[2]; }
const nlerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// both paws on the stick: strum (−1..1, across the string), slide (along the neck), weights
function play(P, o = {}) {
  const f = R.at(P, 'stick', [FRET[0] + (o.slide || 0), FRET[1], FRET[2]]);
  if ((o.wL ?? 1) > 0) R.reach(P, 'armL', 'foreL', f, { pole: POLE_L, w: o.wL ?? 1 });
  const st = R.at(P, 'stick', [STRUM[0] + (o.along || 0), STRUM[1] + (o.strum || 0) * 0.9, STRUM[2] + 0.3 - Math.abs(o.strum || 0) * 0.3]);
  if ((o.wR ?? 1) > 0) R.reach(P, 'armR', 'foreR', st, { pole: POLE_R, w: o.wR ?? 1 });
}
// 8th-note strumming: down on the beat, up on the "and" (per = one beat)
const strumAt = (t, per = 0.5) => key([[0, 1], [0.07, -1, 'out'], [0.25, -1], [0.32, 1, 'out'], [0.5, 1]], ((((t % per) + per) % per) / per) * 0.5);
// a headbang: snap down on the beat, ease back up
const bang = (t, per = 0.5) => { const u = (((t % per) + per) % per) / per; return u < 0.12 ? E.out(u / 0.12) : 1 - E.inout((u - 0.12) / 0.88); };
const NECK_TIP = s(SL - 0.5, 0, 0), STRUM_FX = s(2.4, 0.6, 1.6), CAP_TOP = [0, 22.4, 0.4], CAP_PIVOT = [0, 18.667, 0.4];
const REST_DIR = SDIR;

export const anim = {
  start: 'idle', seed: 21,
  breathe: { bone: 'body', amp: 0.018, per: 2.2 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 4.6], dur: 0.1 },
  look: { bone: 'head', yaw: 26, pitch: 12, speed: 6 },
  springs: [
    { bone: 'tail1', tip: [0, 0, -5], k: 130, d: 9, gain: 0.6, max: 16 },
    { bone: 'tail2', tip: [0, 0, -5], k: 110, d: 8, gain: 0.8, max: 20 },
    { bone: 'tail3', tip: [0, 0, -5], k: 95, d: 7, gain: 1.0, max: 24 },
    { bone: 'tail4', tip: [0, 0, -4], k: 85, d: 6.5, gain: 1.1, max: 26 },
    { bone: 'tie', tip: [0, -4.5, 0], k: 80, d: 6, gain: 1.1, max: 30, axes: [1, 0.3, 1] },
    { bone: 'cap', tip: [0, 3, 0], k: 260, d: 9, gain: 0.35, max: 10 },
    { bone: 'flap', tip: [0, 0, 1.333], k: 70, d: 4.5, gain: 1.4, max: 40 },
    { bone: 'earR', tip: [-0.5, 3, 0], k: 170, d: 8, gain: 0.6, max: 18 },
    { bone: 'earL', tip: [0.5, 3, 0], k: 170, d: 8, gain: 0.6, max: 18 },
  ],
  faces: {
    eyes: { default: 'open', states: Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eye-' + k]])) },
    tongue: { default: 'in', states: { in: [], out: ['tongue-out'] } },
  },
  fidget: { every: [5, 9], clips: ['spin', 'capspin'] },
  clips: {
    // can't stand still: bounces and headbangs on every beat, strums 8ths, taps a foot, changes chords
    idle: { len: 2.0, loop: true, f(P, t) {
      const b = bounce(t, 0.5, { squash: 0.06, stretch: 0.03 }), dy = b.u * 0.7 - 0.35, n = bang(t + 0.03);
      P.pos('body', 0, dy, 0).sq('body', b.sq).rot('body', 3 * n, wave(t, 0.5) * 4, wave(t, 0.5, 1) * 2); plant(P, dy);
      P.rot('head', 13 * n - 4, wave(t, 0.5) * -6, wave(t, 1, 0.5) * 3).rot('jaw', 3 + 6 * n);
      P.rot('stick', 0, 0, -3 * n + wave(t, 0.5) * 2);
      P.pos('footR', 0, Math.max(0, -wave(t, 2, 1.2)) * 0.5, 0).rot('footR', -10 * Math.max(0, -wave(t, 2, 1.2)), 0, 0);
      P.rot('browR', 0, 0, 4 * bump(t % 1, 0.5, 0.8)).rot('browL', 0, 0, -4 * bump(t % 1, 0.5, 0.8));
      P.rot('tail1', 0, wave(t, 0.5) * 8, 0).rot('tail3', wave(t, 0.5, 1.4) * 6, 0, 0);
      const chord = seg(t, 0.95, 1.05, E.out) - seg(t, 1.95, 2.0, E.out);
      play(P, { strum: strumAt(t), slide: -1.6 * chord });
      P.face('eyes', t > 1.02 && t < 1.38 ? 'happy' : undefined);
    } },
    // the duck-walk: crouched low on one hopping leg, the other kicked straight out in front with
    // the toes up, the head pecking forward on every hop, riffing hard on the stick
    walk: { len: 0.6, loop: true, f(P, t) {
      const h = hop(t, 0.3, 1.2, { crouch: 0.5, air: [0.12, 0.62] }), dy = -1.8 + h.y;
      P.pos('body', 0, dy, 0.6).rot('body', -6, 0, 3).sq('body', h.sq * 0.6);
      plant(P, dy, ['legL']);
      P.pos('footL', 0, Math.max(0, h.y) * 0.9, 0).pos('legL', 0, Math.max(0, h.y) * 0.5, 0);
      P.pos('legR', 0, dy, 0.4).rot('legR', -78 + h.y * 4, 0, -8);
      P.pos('footR', -0.3, 2.5 + dy + h.y * 0.5, 4.6).rot('footR', -42, 0, 0);
      const ph = (t / 0.3) % 1;
      P.rot('head', 8 - 12 * Math.sin(ph * Math.PI * 2), 0, 4).rot('jaw', 8 + 6 * bump(ph, 0, 0.4));
      P.rot('stick', 0, 0, -4 + h.y * 2);
      play(P, { strum: strumAt(t * 2), slide: wave(t, 1 / 0.6) * 1.2 });
      P.rot('tail1', -10, 0, 0);
      P.face('eyes', 'half');
      P.burst(0.29, 'dust', 'footL', [2.6, 0.3, 1], { n: 1, speed: 0.4, scale: 0.5 });
    } },
    // "Thunder": crouch, leap with the stick thrust at the sky beside the head, a bolt strikes it
    // (fur on end), land in a power stance and scream through two headbangs
    cry: { len: 2.2, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.4, E.out));
      const air = bump(t, 0.34, 0.74), land = seg(t, 0.72, 0.8, E.out) * (1 - seg(t, 1.7, 2.1, E.inout));
      const up = seg(t, 0.3, 0.5, E.back) * (1 - seg(t, 1.6, 2.0, E.inout));
      const dy = -2.0 * crouch - 1.2 * land + wob(t, 0.76, -0.6, 3, 6);
      P.pos('root', 0, 3.2 * air, 0).pos('body', 0, dy, 0); plant(P, Math.min(0, dy));
      P.sq('body', -0.12 * crouch + 0.12 * air * (1 - seg(t, 0.5, 0.6)) - 0.1 * seg(t, 0.72, 0.76) * (1 - seg(t, 0.76, 0.95)));
      aimStick(P, nlerp(REST_DIR, [-0.4, 1, 0.05], up), [0, 0, 1]);
      P.pos('stick', -3.0 * up, 7.4 * up, -3.4 * up);
      play(P, { wR: 1 - up, wL: 1 - up, strum: 0 });
      R.reach(P, 'armR', 'foreR', R.at(P, 'stick', s(1.0, 0, 0)), { pole: [-1, -0.3, -0.2], w: up });
      P.rot('armL', -100 * up + 20 * bump(t, 1.0, 1.25) + 20 * bump(t, 1.3, 1.55), 0, 30 * up).rot('foreL', -40 * up, 0, 0);
      const zap = seg(t, 0.5, 0.54, E.out) * (1 - seg(t, 0.62, 1.0, E.inout));
      P.scl('body', 1 + 0.07 * zap, 1 + 0.05 * zap, 1 + 0.07 * zap).scl('tail2', 1 + 0.25 * zap).scl('tail3', 1 + 0.25 * zap).rot('tail1', -20 * zap, 0, 0);
      P.rot('earR', 0, 0, -18 * zap).rot('earL', 0, 0, 18 * zap);
      const bangs = bump(t, 1.0, 1.22) + bump(t, 1.28, 1.5);
      P.rot('head', 14 * crouch - 26 * up + 30 * bangs + wave(t, 13) * 3 * zap, 0, wave(t, 9) * 3 * land).rot('jaw', 6 * crouch + 36 * up + 6 * bangs);
      P.rot('browR', 0, 0, -10 * up).rot('browL', 0, 0, 10 * up);
      P.face('eyes', zap > 0.2 ? 'wide' : up > 0.3 ? 'angry' : undefined); P.blinkOK = up < 0.1; P.lookW = 1 - up;
      P.burst(0.52, 'thunder', 'stick', NECK_TIP, { n: 1 }).burst(0.53, 'thunder', 'stick', NECK_TIP, { n: 1 }).burst(0.52, 'spark', 'stick', NECK_TIP, { n: 2 });
      P.burst(0.52, 'shockring', 'stick', NECK_TIP, {}).burst(0.54, 'bolt', 'body', [0, 10, 0], { n: 4, spread: 1 });
      if (t > 0.54 && t < 1.5) P.stream('bolt', 'stick', NECK_TIP, { rate: 10 }).stream('sparkle', 'body', [0, 9, 0], { rate: 8, spread: 1 });
      P.burst(0.76, 'dust', 'root', [0, 0.5, 0], { n: 5, spread: 1 }).burst(1.02, 'riff', 'head', [0, 21, 4], { n: 2 }).burst(1.3, 'riff', 'head', [0, 21, 4], { n: 2 });
      P.burst(0.55, 'smoke', 'cap', CAP_TOP, { n: 2, scale: 0.5 });
    } },
    // physical: the stick as a club — wind it up behind the shoulder, hop in, chop it down across the front
    attack: { len: 1.15, next: 'idle', f(P, t) {
      const wind = seg(t, 0.0, 0.3, E.out3) * (1 - seg(t, 0.36, 0.46, E.in3));
      const smash = seg(t, 0.36, 0.47, E.in3) * (1 - seg(t, 0.7, 1.1, E.inout));
      const step = key([[0, 0], [0.3, -1], [0.47, 4.2], [0.75, 3.8], [1.15, 0]], t);
      P.pos('root', 0, 0, step);
      const WIND = [-0.35, 1, -0.45], CHOP = [0.6, -0.42, 0.68];
      aimStick(P, smash > 0.01 ? nlerp(WIND, CHOP, smash) : nlerp(REST_DIR, WIND, wind), [0, 0, 1]);
      P.pos('stick', -1.4 * wind + 1.6 * smash, 6.0 * wind + 2.6 * smash, -2.8 * wind + 0.4 * smash);
      R.reach(P, 'armR', 'foreR', R.at(P, 'stick', s(0.6, 0, 0)), { pole: [-1, -0.4, -0.4] });
      R.reach(P, 'armL', 'foreL', R.at(P, 'stick', s(3.0, 0, 0)), { pole: [1, -0.6, -0.2] });
      const dy = -1.2 * wind - 1.4 * smash + wob(t, 0.47, -0.5, 4, 7);
      P.pos('body', 0, dy, 0).rot('body', -10 * wind + 14 * smash, -18 * wind + 16 * smash, 0); plant(P, dy);
      P.sq('body', -0.06 * wind + 0.08 * smash * (1 - seg(t, 0.47, 0.6)) + wob(t, 0.47, 0.05, 4, 7));
      P.rot('head', -12 * wind + 8 * smash, 10 * wind - 10 * smash, 0).rot('jaw', 10 * wind + 26 * smash);
      P.face('eyes', t > 0.05 && t < 0.95 ? 'angry' : undefined); P.lookW = 1 - Math.max(wind, smash);
      const hit = s(SL - 1, 0, 0);
      P.burst(0.47, 'spark', 'stick', hit, { n: 2 }).burst(0.47, 'star', 'stick', hit, { n: 4 }).burst(0.47, 'splinter', 'stick', hit, { n: 10, dir: [0, 1, 0] });
      P.burst(0.47, 'dust', 'stick', hit, { n: 4, spread: 1 }).burst(0.48, 'cardbit', 'cap', CAP_TOP, { n: 2 });
    } },
    // special (Echo / Volto): a windmill power chord — notes and a shockwave burst off the stick, a bolt cracks from its head
    special: { len: 2.3, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.25) * (1 - seg(t, 0.82, 0.9, E.out));
      const free = seg(t, 0.12, 0.3) * (1 - seg(t, 0.78, 0.86, E.in3));
      const mill = seg(t, 0.25, 0.84, E.in);
      const slam = seg(t, 0.84, 0.9, E.out) * (1 - seg(t, 1.8, 2.25, E.inout));
      const ring = t > 0.86 && t < 1.8 ? (1 - seg(t, 0.86, 1.8)) : 0;
      const dy = -1.4 * crouch - 1.8 * slam + wob(t, 0.88, -0.6, 4, 6);
      P.pos('body', 0, dy, 0).rot('body', -6 * crouch - 12 * slam + wave(t, 18) * 2 * ring, 0, 6 * slam); plant(P, dy);
      P.rot('stick', 0, 0, 8 * crouch + 14 * slam + wave(t, 22) * 3 * ring);
      play(P, { wR: 1 - free, strum: slam > 0.5 ? -1 : 1 });
      P.rot('armR', -360 * mill - 150 * free * (1 - mill), 0, -20 * free).rot('foreR', 10 * free, 0, 0);
      P.sq('body', 0.06 * crouch * (1 - slam) - 0.1 * seg(t, 0.86, 0.9) * (1 - seg(t, 0.9, 1.1)));
      P.rot('head', 10 * crouch - 24 * slam + wave(t, 14) * 3 * ring, 0, 6 * slam).rot('jaw', 30 * slam + 10 * ring);
      P.rot('browR', 0, 0, -8 * slam).rot('browL', 0, 0, 8 * slam);
      P.face('eyes', slam > 0.3 ? (t < 1.2 ? 'angry' : 'happy') : crouch > 0.3 ? 'half' : undefined); P.lookW = 1 - slam;
      P.burst(0.87, 'shockring', 'stick', STRUM_FX, {}).burst(0.9, 'shockring', 'stick', STRUM_FX, { scale: 1.5 });
      P.burst(0.87, 'riff', 'stick', STRUM_FX, { n: 14, dir: [0, 0.3, 1], spread: 1, speed: 1.4 }).burst(0.87, 'note', 'stick', STRUM_FX, { n: 6, spread: 1, speed: 2 });
      P.burst(0.88, 'thunder', 'stick', NECK_TIP, {}).burst(0.92, 'thunder', 'stick', NECK_TIP, {}).burst(0.88, 'spark', 'stick', STRUM_FX, { n: 2 });
      if (ring > 0) P.stream('riff', 'stick', STRUM_FX, { rate: 14, dir: [0, 0.4, 1], spread: 0.7 }).stream('bolt', 'stick', NECK_TIP, { rate: 9 });
      P.burst(0.88, 'dust', 'root', [0, 0.4, 0], { n: 6, spread: 1 });
    } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.2, 0.65, E.inout));
      P.pos('root', 0, 0, -2.4 * k).rot('body', -16 * k + wob(t, 0.2, 4, 3, 6), 0, wave(t, 16) * 4 * k).sq('body', -0.12 * k);
      P.rot('head', -16 * k, 0, 10 * k).rot('jaw', 24 * k);
      P.pos('cap', 0, 2.4 * bump(t, 0.02, 0.4), -0.6 * bump(t, 0.02, 0.4)).rot('cap', -20 * bump(t, 0.02, 0.4), 0, 14 * bump(t, 0.02, 0.4));
      P.rot('stick', 0, 0, -16 * k);
      play(P, { strum: 0 });
      P.face('eyes', t < 0.42 ? 'hurt' : undefined);
      P.burst(0.02, 'spark', 'body', [0, 10, 5], {}).burst(0.03, 'cardbit', 'cap', CAP_TOP, { n: 3 }).burst(0.03, 'sweat', 'head', [5, 20, 3], { n: 2, dir: [1, 0.6, 0] });
    } },
    // dazed wobble, the stick slips, flops onto its side
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.25) * (1 - seg(t, 0.85, 1.0)), fall = seg(t, 0.9, 1.35, E.bounce), slip = seg(t, 0.4, 1.0, E.in);
      P.rot('body', wave(t, 1.4) * 8 * dizzy, wave(t, 1.6) * 16 * dizzy, wave(t, 2.1) * 10 * dizzy).rot('head', 0, 0, wave(t, 2.1, 1) * 16 * dizzy);
      const dy = -1.2 * dizzy; P.pos('body', 0, dy, 0); plant(P, dy);
      P.rot('root', 0, 0, -84 * fall).pos('root', -7.6 * fall, 3.8 * fall, 0);
      P.rot('legR', 20 * fall, 0, 18 * fall).rot('legL', -26 * fall, 0, 30 * fall);
      aimStick(P, nlerp(REST_DIR, [1, -0.5, 0.3], slip)); P.pos('stick', 0, -3 * slip, 1 * slip);
      play(P, { wL: 1 - slip * 0.8, wR: 1 - slip });
      P.rot('armR', 30 * slip, 0, -30 * fall).rot('armL', -20 * fall, 0, 60 * fall).rot('jaw', 26 * fall);
      P.rot('cap', 0, 0, 24 * fall).pos('cap', 0.8 * fall, -0.6 * fall, 0);
      P.face('eyes', t < 0.9 ? 'swirl' : 'x').face('tongue', t > 1.3 ? 'out' : 'in'); P.blinkOK = false; P.lookW = 1 - dizzy;
      P.burst(1.32, 'dust', 'root', [0, 1, 0], { n: 7, spread: 1 }).burst(0.3, 'star', 'head', [0, 23, 0], { n: 5 }).burst(1.34, 'cardbit', 'cap', CAP_TOP, { n: 3 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      P.rot('root', 0, 0, -84).pos('root', -7.6, 3.8, 0);
      P.rot('legR', 20 + wave(t, 0.42) * 4, 0, 18).rot('legL', -26, 0, 30);
      aimStick(P, [1, -0.5, 0.3]); P.pos('stick', 0, -3, 1);
      play(P, { wL: 0.2, wR: 0 });
      P.rot('armR', 30, 0, -30).rot('armL', -20, 0, 60 + wave(t, 0.42, 1) * 3).rot('jaw', 26).rot('cap', 0, 0, 24).pos('cap', 0.8, -0.6, 0);
      P.rot('tail4', 10 * bump(t, 1.2, 1.5), 0, 0);
      P.face('eyes', 'x').face('tongue', 'out'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.burst(0.4, 'star', 'head', [0, 23, 0], { n: 2 });
    } },
    // victory: a spinning leap with the stick thrown up at the sky, then a cocky riff, tongue out
    win: { len: 2.2, next: 'idle', f(P, t) {
      const h = t < 0.9 ? hop(t, 0.9, 6, { crouch: 1.4 }) : { y: wob(t, 0.9, -1.0, 3, 6), sq: wob(t, 0.9, -0.12, 3, 6) };
      P.pos('root', 0, Math.max(0, h.y), 0).sq('body', h.sq).rot('root', 0, 360 * seg(t, 0.22, 0.66, E.inout), 0);
      if (h.y < 0) plant(P, h.y);
      const up = seg(t, 0.15, 0.3, E.back) * (1 - seg(t, 0.9, 1.1, E.inout));
      aimStick(P, nlerp(REST_DIR, [-0.4, 1, 0.05], up), [0, 0, 1]); P.pos('stick', -3.0 * up, 7.4 * up, -3.4 * up);
      const riff = t > 1.1 ? 1 : 0;
      play(P, { wR: 1 - up, wL: 1 - up, strum: riff ? strumAt(t, 0.25) : 0, slide: riff ? wave(t, 4) * 1.2 : 0 });
      R.reach(P, 'armR', 'foreR', R.at(P, 'stick', s(1.0, 0, 0)), { pole: [-1, -0.3, -0.2], w: up });
      P.rot('armL', -120 * up, 0, 40 * up).rot('foreL', -30 * up, 0, 0);
      const n = riff ? bang(t, 0.25) : 0;
      P.rot('head', -18 * up + 14 * n, 0, 8 * riff).rot('jaw', 30 * up + 20 * riff);
      P.face('eyes', t > 0.2 ? 'happy' : undefined).face('tongue', riff ? 'out' : 'in');
      P.burst(1.12, 'riff', 'stick', STRUM_FX, { n: 4, dir: [0, 0.6, 1] }).burst(1.4, 'riff', 'stick', STRUM_FX, { n: 4, dir: [0, 0.6, 1] }).burst(1.7, 'riff', 'stick', STRUM_FX, { n: 4, dir: [0, 0.6, 1] });
      P.burst(0.9, 'dust', 'root', [0, 0.5, 0], { n: 4, speed: 0.6 }).burst(0.5, 'sparkle', 'stick', NECK_TIP, { n: 5 });
    } },
    // asleep sitting up, hugging the stick like a teddy, the cap slid down over its eyes
    sleep: { len: 3.4, loop: true, f(P, t) {
      const br = Math.sin((t / 3.4) * Math.PI * 2), dy = -3.0 + br * 0.2;
      P.pos('body', 0, dy, 0.6).rot('body', 2 + br * 2, 0, 0).sq('body', -0.04 + br * 0.03);
      P.pos('legR', 0, -2.4, 1.6).rot('legR', -70, 10, 0).pos('legL', 0, -2.4, 1.6).rot('legL', -70, -10, 0);
      P.pos('footR', -0.4, 1.2, 3.4).rot('footR', -60, 0, 0).pos('footL', 0.4, 1.2, 3.4).rot('footL', -60, 0, 0);
      aimStick(P, [0.15, 1, 0.1], [0, 0, 1]); P.pos('stick', 3.4, 1.4, -1.0);
      R.reach(P, 'armR', 'foreR', R.at(P, 'stick', s(6.5, 0, 0.4)), { pole: [-1, -0.6, -0.2] });
      R.reach(P, 'armL', 'foreL', R.at(P, 'stick', s(4.5, 0, 0.6)), { pole: [1, -0.6, -0.2] });
      P.rot('head', 12 + br * 3, 0, 10).rot('jaw', 3 + Math.max(0, br) * 5);
      P.pos('cap', 0, -0.8, 0.4).rot('cap', 12, 0, -4);
      P.rot('tail1', -20, -30, 0).rot('tail2', -10, -30, 0).rot('tail3', 0, -20, 0);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', [4, 22, 4], {}).burst(1.9, 'z', 'head', [4, 22, 4], {});
    } },
    // fidget: the floor spin — drops onto its side and spins round and round, kicking, still riffing
    spin: { len: 2.8, next: 'idle', f(P, t) {
      const down = seg(t, 0.1, 0.4, E.in) * (1 - seg(t, 2.25, 2.55, E.back));
      const spin = seg(t, 0.45, 2.2, E.inout);
      // lie on the side, then spin in place round the middle of the body (not round the feet)
      const phi = 720 * spin * Math.PI / 180, c = 7.6 * down;
      P.rot('root', 0, 720 * spin, -78 * down).pos('root', -c * Math.cos(phi), 3.6 * down, c * Math.sin(phi));
      const kick = t > 0.4 && t < 2.3 ? 1 : 0;
      P.rot('legR', (-30 + 40 * Math.sin(t * 22)) * kick, 0, 0).rot('legL', (-30 - 40 * Math.sin(t * 22)) * kick, 0, 0);
      P.pos('footR', 0, 2 * kick + 2 * Math.max(0, Math.sin(t * 22)) * kick, 3 * kick).pos('footL', 0, 2 * kick + 2 * Math.max(0, -Math.sin(t * 22)) * kick, 3 * kick);
      play(P, { strum: strumAt(t, 0.25), slide: wave(t, 2) * 1.4 });
      P.rot('head', 8 * bang(t, 0.25) * kick, 0, 0).rot('jaw', 20 * kick);
      P.face('eyes', kick ? 'happy' : undefined).face('tongue', kick && t > 1 ? 'out' : 'in');
      if (kick) P.stream('dust', 'root', [0, 0.5, 0], { rate: 10, spread: 1, scale: 0.6 }).stream('riff', 'stick', STRUM_FX, { rate: 6, dir: [0, 1, 0.3] });
      P.burst(2.45, 'dust', 'root', [0, 0.5, 0], { n: 5, spread: 1 });
    } },
    // fidget: tips the cardboard cap off, twirls it on one claw (ears springing free), pops it back on
    capspin: { len: 2.8, next: 'idle', f(P, t) {
      const reach = seg(t, 0.08, 0.32, E.out) * (1 - seg(t, 2.35, 2.65, E.inout));
      const off = seg(t, 0.32, 0.6, E.out3) * (1 - seg(t, 2.05, 2.32, E.in3));
      const spin = seg(t, 0.6, 2.0, E.inout);
      const b = bounce(t, 0.5, { squash: 0.04, stretch: 0.02 }), dy = b.u * 0.5 - 0.25;
      P.pos('body', 0, dy, 0).sq('body', b.sq); plant(P, dy);
      P.rot('head', -6 * off + 4 * wave(t, 2) * off, 8 * off, 6 * off);
      play(P, { wR: 0, strum: 0 });
      // the cap travels from the head to a point above the right shoulder and spins there
      const onHead = R.at(P, 'head', CAP_PIVOT), held = R.at(P, 'body', [-6.2, 19.5, 2.4]);
      R.place(P, 'cap', onHead.clone().lerp(held, off).add(R.V([0, 1.2 * Math.sin(off * Math.PI), 0])));
      P.rot('cap', -12 * off, 720 * spin, -7 * off + 10 * bump(t, 0.4, 0.7));
      const paw = R.at(P, 'cap', [-1.5, 18.0, 0.4]).lerp(R.at(P, 'cap', [0, 17.4, 0.4]), off);
      R.reach(P, 'armR', 'foreR', paw, { pole: [-1, -0.5, -0.2], w: reach });
      P.rot('earR', 0, 0, -16 * off + wave(t, 6) * 6 * off).rot('earL', 0, 0, 16 * off - wave(t, 6, 1) * 6 * off);
      P.face('eyes', off > 0.5 ? (spin > 0.5 ? 'happy' : 'half') : undefined); P.lookW = 1 - off;
      const pop = seg(t, 2.32, 2.38, E.in) * (1 - seg(t, 2.42, 2.75, E.inout));
      P.sq('body', -0.08 * pop).rot('head', 6 * pop, 0, 0);
      P.burst(2.34, 'cardbit', 'cap', CAP_TOP, { n: 3 }).burst(1.3, 'sparkle', 'cap', CAP_TOP, { n: 2 });
    } },
  },
};
def.anim = anim;
