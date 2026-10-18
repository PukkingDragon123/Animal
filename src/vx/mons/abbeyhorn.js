// Abbeyhorn — split final stage of the Beatlet line (Bio): a tall, sleek, fast warrior beetle
// in white armour (the white-suit Abbey Road era). Long middle-parted hair falls past its jaw and
// flows down its back in a frill, its mandibles are furred like a beard, a long, elegant ivory horn
// curves up from its brow, and its sharp gold slit eyes sit in a dark visor. It strides like it is
// crossing the most famous zebra crossing in the world. Calm, cool, very fast. From Pepperhorn
// (the other branch is Walrusk).
// Drip (one per tier): 1 denim scarf | round specs pushed up · 2 gold sun pendant | denim
// headband · 3 long white cape | flower crown.
import { eyeRig } from './eyes.js';
import { shift } from './kit.js';
import { dripMap } from './beetle_parts.js';
import { B, both, chitin, segs, fur, tipP, band, at, GOLD, goldP, legs, arm, arms, emote, mand, darts, walkCycle, sharedClips, onBack, E, seg, bump, wob, wave, TAU } from './beetle_parts.js';

const C = {
  white: ['#ffffff', '#e8ecf2', '#b8c0cc', '#868ea0'], grey: ['#a8b0c0', '#6a7284', '#4a5062', '#2e3240'], visor: ['#3a3e4c', '#1c1e28', '#121218', '#0a0a0e'],
  hair: ['#c8885a', '#8a5230', '#5a3018', '#341a0c'], hairGl: '#f0c088', ivory: ['#fffaf0', '#f0e2c8', '#d0b890', '#a08458'],
  claw: ['#5a6070', '#2a2e38', '#181a22', '#0c0e12'], denim: ['#8ab4e8', '#4a78b8', '#2e5088', '#1c3260'],
};
// ---------------------------------------------------------------- painters
const whiteP = chitin(C.white, { gloss: '#ffffff' });
const plateP = segs(C.white, { every: 1.5 });
const greyP = chitin(C.grey);
const visorP = chitin(C.visor, { gloss: '#6a7088', streakAt: 0.12 });
const clawP = tipP(C.claw);
const hairP = fur(C.hair, { gloss: C.hairGl, shine: 0.18 });
const capP = (p, w, h, face, cube) => { hairP(p, w, h, face, cube); if (face === 'up') for (let y = 0; y < h; y++) p.px(Math.floor(w / 2), y, C.hair[3]); if (face === 'south') for (let y = 0; y < h; y++) p.px(Math.floor(w / 2), y, C.hair[3]); };
const beardP = fur(C.hair, { gloss: C.hairGl, shine: 0.12 });
const hornP = tipP(C.ivory, { up: true });
// the chest: white armour cut like a suit — two lapel lines in a narrow V, a pocket square of grey
function suitP(p, w, h, face, cube) {
  whiteP(p, w, h, face, cube);
  if (face !== 'south') return;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [X, Y] = at(face, cube, x, y), lap = 0.4 + (27 - Y) * 0.36;
    if (Y > 21.4 && Math.abs(Math.abs(X) - lap) < 0.25) p.px(x, y, C.grey[1]);
    if (Y < 21.6 && Y > 21.2 && Math.abs(X) < 0.3) p.px(x, y, C.grey[2]);
    if (X > 2.4 && X < 3.6 && Y > 24.2 && Y < 24.7) p.px(x, y, C.grey[0]);
  }
}
const backP = (p, w, h, face, cube) => { whiteP(p, w, h, face, cube); if (face === 'down') return; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [X] = at(face, cube, x, y); if ((face === 'north' || face === 'up') && Math.abs(X) < 0.28) p.px(x, y, C.grey[2]); } };
// drip painters
const denimP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let c = band(C.denim, face, x, y, h); if ((x + y * 2) % 4 === 0) c = shift(c, 0.1); if ((y === 0 || y === h - 1) && face !== 'up' && face !== 'down') c = '#e8a040'; p.px(x, y, c); } };
const sunP = (p, w, h) => { const cx = (w - 1) / 2, cy = (h - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - cx, y - cy), a = Math.atan2(y - cy, x - cx); if (d < w * 0.28) p.px(x, y, d < w * 0.14 ? GOLD[0] : GOLD[1]); else if (d < w * 0.5 && Math.floor((a + 4) * 8 / Math.PI) % 2 === 0) p.px(x, y, GOLD[2]); } };
const lensP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const e = x === 0 || y === 0 || x === w - 1 || y === h - 1; p.px(x, y, face === 'south' && !e ? (x + y < 3 ? '#e8fff0' : '#5a9a6a') : GOLD[e ? 2 : 1]); } };
const capeP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let c = band(C.white, face, x, y, h); if ((x % 6 === 0) && face === 'north') c = C.white[2]; if (y === h - 1 || ((x === 0 || x === w - 1) && face === 'north')) c = GOLD[1]; p.px(x, y, c); } };
const daisyP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? (Math.abs(x - (w - 1) / 2) < 1 && Math.abs(y - (h - 1) / 2) < 1 ? '#ffc81e' : '#ffffff') : face === 'down' ? '#3a8a2a' : '#f0f0e8'); };
const wireP = (p, w, h) => p.rect(0, 0, w, h, GOLD[2]);

// ---------------------------------------------------------------- the model
const R = { hipX: 2.8, hipY: 15.8, ankleY: 1.8, L1: 6.8, L2: 7.2 };
// sharp gold slit eyes with an upturned outer flick, set in a dark visor
const EYES = eyeRig({ style: 'pix', chunk: 2, at: [-1.85, 29.8, 3.42], line: '#080a10', iris: '#ffc43a', irisDark: '#a86a10',
  map: { open: ['l....', '.llll', '.ihkl', '..ll.'] } });
const RIGHT = [
  { name: 'thighR', parent: 'root', pivot: [-2.8, 15.8, 0], cubes: [B(-4.0, 8.6, -1.3, -1.6, 16.6, 1.3, whiteP)] },
  { name: 'shinR', parent: 'thighR', pivot: [-2.8, 9.0, 0], cubes: [B(-3.9, 1.6, -1.1, -1.7, 9.4, 1.1, whiteP), B(-4.0, 8.4, 0.4, -1.6, 9.8, 1.4, greyP)] },
  { name: 'footR', parent: 'shinR', pivot: [-2.8, 1.8, 0], cubes: [
    B(-3.9, 0, -1.6, -1.7, 1.8, 2.8, whiteP), B(-3.9, 0, 2.8, -3.3, 0.8, 4.0, clawP), B(-3.1, 0, 2.8, -2.5, 0.8, 4.3, clawP), B(-2.3, 0, 2.8, -1.7, 0.8, 4.0, clawP),
  ] },
  { name: 'elytraR', parent: 'torso', pivot: [-0.1, 26.8, -3.0], cubes: [B(-5.0, 14.4, -4.8, -0.04, 27.0, -2.8, backP), B(-4.6, 11.0, -4.6, -0.04, 14.4, -3.2, backP)] },
  { name: 'armR', parent: 'torso', pivot: [-6.2, 26.4, 0], cubes: [B(-7.4, 21.0, -1.2, -5.0, 27.0, 1.2, whiteP)] },
  { name: 'foreR', parent: 'armR', pivot: [-6.2, 21.4, 0], cubes: [B(-7.5, 15.4, -1.3, -4.9, 21.6, 1.3, whiteP), B(-8.3, 16.0, -0.3, -7.4, 21.0, 0.3, greyP)] },
  { name: 'handR', parent: 'foreR', pivot: [-6.2, 15.2, 0], cubes: [B(-7.3, 13.4, -1.0, -5.1, 15.4, 1.0, visorP)] },
  { name: 'clawR', parent: 'handR', pivot: [-6.2, 13.6, 0.2], cubes: [B(-7.2, 10.8, -0.3, -6.6, 13.6, 0.5, clawP), B(-6.5, 10.4, -0.3, -5.9, 13.6, 0.5, clawP), B(-5.8, 10.8, -0.3, -5.2, 13.6, 0.5, clawP)] },
  // a gold coin for the coin-flip fidget
  { name: 'coinR', parent: 'handR', pivot: [-6.2, 12.6, 0.6], cubes: [B(-6.9, 12.5, -0.1, -5.5, 12.75, 1.3, goldP, { id: 'coin', hide: true })] },
  // beard: the mandibles, furred, hanging below the jaw
  { name: 'mandR', parent: 'head', pivot: [-0.9, 28.2, 3.4], cubes: [B(-2.3, 25.0, 2.6, -0.05, 28.4, 4.3, beardP)] },
  // long side locks framing the face
  { name: 'lockR', parent: 'head', pivot: [-3.3, 31.8, 0.6], cubes: [B(-3.9, 25.2, -1.6, -3.0, 32.0, 2.8, hairP)] },
];
export const def = {
  name: 'abbeyhorn', ppu: 3, scale: 0.62, outline: { color: '#14161e', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'pelvis', parent: 'root', pivot: [0, 15.8, 0], cubes: [B(-3.6, 14.0, -3.0, 3.6, 18.0, 2.8, plateP)] },
    { name: 'torso', parent: 'pelvis', pivot: [0, 17.8, 0], cubes: [
      B(-3.6, 17.6, -3.0, 3.6, 21.0, 2.8, plateP), B(-5.0, 20.6, -3.6, 5.0, 27.0, 3.6, suitP), B(-6.0, 24.8, -3.0, 6.0, 27.4, 3.0, whiteP),
      // normal: a denim scarf round the neck
      B(-3.6, 26.4, -2.9, 3.6, 27.9, 3.5, denimP, { id: 'acc-scarf', hide: true }),
      // dripped: a gold chain with a sun pendant
      B(-3.0, 23.9, 3.62, -0.2, 24.3, 3.9, goldP, { pivot: [-3.0, 24.1, 3.76], rot: [0, 0, -38], id: 'acc-sun', hide: true }),
      B(0.2, 23.9, 3.62, 3.0, 24.3, 3.9, goldP, { pivot: [3.0, 24.1, 3.76], rot: [0, 0, 38], id: 'acc-sun', hide: true }),
      B(-1.1, 20.6, 3.64, 1.1, 22.8, 3.64, sunP, { plane: 'z', id: 'acc-sun', hide: true, outline: false }), B(-0.6, 21.1, 3.62, 0.6, 22.3, 3.95, goldP, { id: 'acc-sun', hide: true }),
    ] },
    { name: 'scarfEnd', parent: 'torso', pivot: [-2.6, 27.0, -3.0], cubes: [B(-3.6, 21.0, -3.5, -1.6, 27.0, -2.9, denimP, { id: 'acc-scarf', hide: true })] },
    // ultra dripped: a long white cape, gold-hemmed
    { name: 'cape', parent: 'torso', pivot: [0, 27.4, -5.4], cubes: [B(-5.8, 11.0, -5.9, 5.8, 27.4, -5.3, capeP, { id: 'acc-cape', hide: true })] },
    { name: 'head', parent: 'torso', pivot: [0, 27.4, 0.6], cubes: [
      B(-3.2, 27.2, -2.4, 3.2, 32.0, 3.2, whiteP),
      B(-3.5, 28.8, 2.8, 3.5, 30.8, 3.4, visorP),
      B(-1.8, 27.0, 3.0, 1.8, 28.6, 4.2, whiteP),
      B(-3.4, 31.6, -2.7, 3.4, 32.8, 3.1, capP),                                     // middle-parted hair on the crown
      // normal (or): round wire specs pushed up into its hair
      B(-2.9, 31.5, 3.1, -0.6, 32.6, 3.55, lensP, { id: 'acc-specs', hide: true }), B(0.6, 31.5, 3.1, 2.9, 32.6, 3.55, lensP, { id: 'acc-specs', hide: true, mirror: true }),
      B(-0.6, 31.95, 3.15, 0.6, 32.2, 3.4, wireP, { id: 'acc-specs', hide: true }),
      // dripped (or): a denim headband
      B(-3.55, 30.9, -2.75, 3.55, 31.6, 3.45, denimP, { id: 'acc-band', hide: true }),
      // ultra (or): a crown of daisies
      ...[[-3.2, 0.6], [-2.6, 2.6], [0, 3.0], [2.6, 2.6], [3.2, 0.6], [2.4, -1.8], [-2.4, -1.8], [0, -2.4]].map(([x, z]) => B(x - 0.6, 32.5, z - 0.6, x + 0.6, 33.3, z + 0.6, daisyP, { id: 'acc-flowers', hide: true })),
    ] },
    // the long hair down its back
    { name: 'frill', parent: 'head', pivot: [0, 31.6, -2.6], cubes: [B(-3.4, 25.0, -4.2, 3.4, 32.2, -2.2, hairP)] },
    { name: 'frill2', parent: 'frill', pivot: [0, 25.2, -3.3], cubes: [B(-3.2, 19.6, -4.5, 3.2, 25.4, -2.6, hairP)] },
    // the long elegant horn
    { name: 'horn', parent: 'head', pivot: [0, 32.0, 1.4], rot: [-12, 0, 0], cubes: [B(-0.9, 31.8, 0.6, 0.9, 36.0, 2.2, hornP)] },
    { name: 'horn2', parent: 'horn', pivot: [0, 35.8, 1.4], rot: [14, 0, 0], cubes: [B(-0.7, 35.8, 0.8, 0.7, 40.4, 2.0, hornP)] },
    { name: 'horn3', parent: 'horn2', pivot: [0, 40.2, 1.4], rot: [16, 0, 0], cubes: [B(-0.5, 40.2, 0.9, 0.5, 44.6, 1.9, hornP), B(-0.3, 44.6, 1.1, 0.3, 45.6, 1.7, hornP)] },
    ...both(...RIGHT),
    ...EYES.bones,
  ],
};
def.drip = [
  [{ id: 'acc-scarf', name: 'Denim scarf' }, { id: 'acc-specs', name: 'Round wire specs' }],
  [{ id: 'acc-sun', name: 'Gold sun pendant' }, { id: 'acc-band', name: 'Denim headband' }],
  [{ id: 'acc-cape', name: 'Long white cape' }, { id: 'acc-flowers', name: 'Daisy crown' }],
];
def.attach = {
  head: { bone: 'head', at: [0, 32.8, 0.2], size: 6.8 },
  face: { bone: 'head', at: [0, 29.8, 3.45], size: 7 },
  neck: { bone: 'torso', at: [0, 26.8, 3.2], size: 7.2 },
  back: { bone: 'torso', at: [0, 21, -5], size: 10 },
};

// ---------------------------------------------------------------- animation
const HEAD = [0, 34, 1], TIP = [0, 45.6, 1.4];
const shared = sharedClips(R, {
  headTop: HEAD, weight: 0.25,
  downPose: (P, k, t) => { onBack(P, R, k, t, { lift: 2.4 }); mand(P, 10 * k, 10 * k); },
  // a meditative kneel: knees folded, hands resting on them, head bowed
  sleepPose: (P, br) => { legs(P, R, { y: -8.6 + br * 0.2, fR: [0, 3.2], fL: [0, 3.2], spread: 10 }); P.rot('torso', 6 + br * 1.2, 0, 0).rot('head', 24 + br * 2, 0, 0); arms(P, { out: 14, fwd: 26, bend: 40 }); },
});
export const anim = {
  start: 'idle', seed: 21,
  breathe: { bone: 'torso', amp: 0.014, per: 3.0 },
  blink: { slot: 'eyes', closed: 'closed', every: [3.0, 6.0], dur: 0.12 },
  look: { bone: 'head', yaw: 26, pitch: 12, speed: 4 },
  springs: [
    { bone: 'frill', tip: [0, -6, -1], k: 150, d: 8, gain: 0.8, max: 24, axes: [1, 0.4, 0.8] },
    { bone: 'frill2', tip: [0, -5.5, -0.6], k: 120, d: 7, gain: 1, max: 30, axes: [1, 0.4, 0.8] },
    { bone: 'lockR', tip: [0, -6, 0], k: 180, d: 9, gain: 0.7, max: 18 },
    { bone: 'lockL', tip: [0, -6, 0], k: 180, d: 9, gain: 0.7, max: 18 },
    { bone: 'mandR', tip: [0, -3, 0.5], k: 200, d: 10, gain: 0.6, max: 14 },
    { bone: 'mandL', tip: [0, -3, 0.5], k: 200, d: 10, gain: 0.6, max: 14 },
    { bone: 'horn3', tip: [0, 4, 0], k: 320, d: 14, gain: 0.3, max: 6 },
    { bone: 'scarfEnd', tip: [0, -5.6, -0.4], k: 130, d: 8, gain: 0.9, max: 30 },
    { bone: 'cape', tip: [0, -15, -0.4], k: 100, d: 8, gain: 0.8, max: 24, axes: [1, 0.2, 0.6] },
  ],
  faces: { eyes: EYES.slot, prop: { default: 'off', states: { on: ['coin'], off: [] } } },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'coin', 'hairflip', 'cool'] },
  clips: {
    ...shared,
    // calm and still, the weight drifting from leg to leg, hair moving in a breeze, eyes scanning
    idle: { len: 3.2, loop: true, f(P, t) {
      const ph = (t / 3.2) * TAU, s = Math.sin(ph);
      legs(P, R, { y: -0.5 - 0.2 * Math.abs(s), roll: 2 * s, fL: [0, 0.8], fR: [0, -0.4], toeL: 6 });
      P.rot('torso', -2, 3 * s, -1.2 * s).rot('head', 1, -4 * s, 1.5 * s);
      arm(P, 'R', { out: 8 + 2 * s, fwd: 2, bend: 12, grip: 16 }); arm(P, 'L', { out: 8 - 2 * s, fwd: 2, bend: 12, grip: 16 });
      P.rot('frill', wave(t, 0.6) * 4, 0, wave(t, 0.45, 1) * 4).rot('frill2', wave(t, 0.6, 1) * 6, 0, wave(t, 0.45, 2) * 6).rot('lockR', 0, 0, wave(t, 0.5) * 3).rot('lockL', 0, 0, wave(t, 0.5, 1) * 3);
      darts(P, t, 0.16, 1.6, 7);
      P.face('eyes', t > 2.0 && t < 2.5 ? 'sleepy' : undefined);
    } },
    // the crossing: long, easy, purposeful strides, a white bar flashing under each planted foot
    walk: { len: 0.9, loop: true, f(P, t) {
      walkCycle(P, R, t, { len: 0.9, stride: 3.2, lift: 1.6, bob: 0.7, sway: 2.5, swing: 26, twist: 5, crouch: 0.6, lean: 3, out: 6, bend: 12 });
      P.rot('head', -3, 0, 0);
      P.burst(0.22, 'zebra', 'root', [-2.8, 0.2, 3.4], { n: 1, scale: 1.2 }).burst(0.67, 'zebra', 'root', [2.8, 0.2, 3.4], { n: 1, scale: 1.2 });
    } },
    // a cry: the horn swept up to the sky, the hair whipped back, a flash of light at the tip
    cry: { len: 2.0, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.42, E.out)), up = seg(t, 0.36, 0.5, E.back) * (1 - seg(t, 1.55, 1.9, E.inout));
      legs(P, R, { y: -2.4 * crouch + 0.6 * up, pitch: 10 * crouch - 12 * up, fR: [0, -1.2 * up], fL: [0, 1.4 * up] });
      P.rot('head', 16 * crouch - 34 * up + wave(t, 5) * 2 * up, 0, 0);
      arms(P, { out: 20 * crouch + 50 * up, fwd: -20 * up, bend: 20 + 20 * crouch, grip: 30 * up });
      emote(P, crouch > 0.3 ? 'angry' : up > 0.3 ? 'shut' : 'open'); mand(P, 6 + 22 * up, -4 * up); P.blinkOK = false;
      P.burst(0.5, 'sparkle', 'horn3', TIP, { n: 14, speed: 1.6 }).burst(0.5, 'ring', 'horn3', TIP, { scale: 0.8 }).burst(0.52, 'soundring', 'head', [0, 28, 4], { dir: [0, 0.3, 1] });
      P.burst(0.4, 'dust', 'root', [0, 0.5, 0], { n: 8, spread: 1, speed: 1.4 });
    } },
    // a megahorn lunge: drops low, then a blinding dash, horn levelled, and a thrust
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const low = seg(t, 0, 0.22, E.inout) * (1 - seg(t, 0.26, 0.32, E.in)), dash = seg(t, 0.26, 0.4, E.out3) * (1 - seg(t, 0.62, 0.98, E.inout)), thr = bump(t, 0.36, 0.6);
      legs(P, R, { y: -3.2 * low - 1.6 * dash, z: 1.2 * dash, pitch: 30 * low + 26 * dash, fR: [0, 3.6 * dash], fL: [0, -2.6 * dash] });
      P.pos('root', 0, 0, 9 * dash).rot('head', 30 * dash + 12 * thr, 0, 0);
      arms(P, { out: 20, fwd: -40 * dash, bend: 30, grip: 30 * dash });
      emote(P, low > 0.2 || dash > 0.2 ? 'angry' : 'open'); mand(P, 10 * thr); P.blinkOK = false;
      if (dash > 0.3 && t < 0.5) P.stream('zebra', 'root', [0, 4, -2], { rate: 40, dir: [0, 0, -1], spread: 0.6, speed: 0.4 });
      P.burst(0.46, 'spark', 'horn3', TIP, { n: 3 }).burst(0.46, 'star', 'horn3', TIP, { n: 4 });
    } },
    // crosswalk rush: zebra stripes stream behind a white blur, and the horn sweeps a slash of light
    special: { len: 2.2, next: 'idle', f(P, t) {
      const set = seg(t, 0, 0.4, E.inout) * (1 - seg(t, 0.44, 0.5, E.in)), go = seg(t, 0.46, 0.62, E.out3) * (1 - seg(t, 1.2, 1.8, E.inout)), slash = seg(t, 0.7, 0.9, E.back) * (1 - seg(t, 1.1, 1.5, E.inout));
      legs(P, R, { y: -3.6 * set - 2 * go, pitch: 20 * set + 30 * go - 20 * slash, fR: [0, 4 * go], fL: [0, -3 * go], spread: 6 * set });
      P.pos('root', 0, 0, 13 * go).rot('root', 0, -40 * slash, 0);
      P.rot('head', -10 * set + 20 * go - 30 * slash, 0, 0).rot('torso', 0, 40 * slash, 0);
      arms(P, { out: 30 * set + 40 * slash, fwd: -40 * go, bend: 30, grip: 40 * go });
      emote(P, set > 0.3 || go > 0.3 ? 'angry' : t > 1.7 ? 'sleepy' : 'open'); mand(P, 6 + 14 * slash); P.blinkOK = false;
      if (go > 0.3 && t < 1.2) P.stream('zebra', 'root', [0, 6, -2], { rate: 70, dir: [0, 0, -1], speed: 0.5, spread: 0.9, scale: 1.4 }).stream('sparkle', 'horn3', TIP, { rate: 30, key: 's' });
      P.burst(0.8, 'ring', 'horn3', TIP, { scale: 1.6 }).burst(0.8, 'spark', 'horn3', TIP, { n: 4 }).burst(0.82, 'zebra', 'horn3', TIP, { n: 10, speed: 2, spread: 1 });
    } },
    // victory: the horn raised to the sky, then a slow head flip that whips the hair round, arms folded
    win: { len: 2.6, next: 'idle', f(P, t) {
      const up = seg(t, 0.05, 0.3, E.back) * (1 - seg(t, 1.0, 1.3, E.inout)), flip = bump(t, 1.2, 1.8), fold = seg(t, 1.5, 1.8, E.inout);
      legs(P, R, { y: 0.4 * up - 0.4 * fold, pitch: -10 * up, fL: [0, 1.2 * fold], roll: 3 * fold });
      P.rot('head', -30 * up + 14 * flip, 40 * flip - 10 * fold, -10 * flip);
      arm(P, 'R', { out: 60 * up + 40 * fold, fwd: 30 * up + 70 * fold, bend: 20 + 110 * fold, twist: 30 * fold }); arm(P, 'L', { out: 40 * fold, fwd: 70 * fold, bend: 10 + 110 * fold, twist: 30 * fold });
      emote(P, up > 0.3 ? 'shut' : fold > 0.5 ? 'sleepy' : 'open'); mand(P, 6 + 14 * up); P.blinkOK = false;
      P.burst(0.35, 'sparkle', 'horn3', TIP, { n: 16, speed: 1.6 }).burst(0.35, 'ring', 'horn3', TIP, { scale: 1 });
    } },
    // fidget: flicks its long hair back over its shoulder
    hairflip: { len: 1.6, next: 'idle', f(P, t) {
      const k = bump(t, 0.2, 0.75), r = seg(t, 0.75, 1.3, E.inout) * (1 - seg(t, 1.3, 1.55));
      legs(P, R, { y: -0.4, roll: -3 * k });
      P.rot('head', -24 * k + 6 * r, -30 * k, 16 * k).rot('frill', -30 * k, 0, 0);
      arm(P, 'R', { out: 40 * k, fwd: 50 * k, bend: 120 * k, twist: 20 * k });
      emote(P, k > 0.4 ? 'closed' : r > 0.3 ? 'sleepy' : 'open');
    } },
    // fidget: folds its arms, taps a foot, glances away — cool as anything
    cool: { len: 2.4, next: 'idle', f(P, t) {
      const on = seg(t, 0.05, 0.4, E.inout) * (1 - seg(t, 2.0, 2.35, E.inout)), tap = Math.max(0, Math.sin(t * TAU * 2.5)) * on;
      legs(P, R, { y: -0.4, roll: 2 * on, fR: [0.4 * tap, 0.6], toeR: -16 * tap });
      arm(P, 'R', { out: 40 * on, fwd: 70 * on, bend: 110 * on, twist: 30 * on }); arm(P, 'L', { out: 40 * on, fwd: 70 * on, bend: 110 * on, twist: 30 * on });
      P.rot('head', 4 * on, 26 * on, -4 * on);
      emote(P, on > 0.4 ? 'sleepy' : 'open', on);
      P.pos('eyeR', 0.25 * on, 0, 0).pos('eyeL', 0.25 * on, 0, 0);
    } },
    // a slow, cool groove: side steps, rolling shoulders, a spin on its toes that whips the hair, a point at the sky
    dance: { len: 3.0, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.25, E.out) * (1 - seg(t, 2.6, 3.0, E.inout)), ph = t * TAU, st = Math.sin(ph), spin = seg(t, 1.5, 2.1, E.inout), pt = seg(t, 2.15, 2.3, E.back) * (1 - seg(t, 2.65, 3.0));
      legs(P, R, { y: -0.8 - 0.6 * Math.abs(st) * on, z: 0, roll: 5 * st * on, fR: [0.8 * Math.max(0, st) * on, 0.6], fL: [0.8 * Math.max(0, -st) * on, -0.4], toeR: 10 * spin, toeL: 10 * spin });
      P.rot('root', 0, 360 * spin, 0).rot('torso', 0, 10 * st * on, -4 * Math.sin(ph * 2) * on).rot('head', 4 * Math.sin(ph * 2) * on - 20 * pt, -8 * st * on, 0);
      arm(P, 'R', { out: 20 * on + 40 * pt, fwd: 20 * Math.sin(ph * 2) * on + 120 * pt, bend: 40 * on * (1 - pt) }); arm(P, 'L', { out: 20 * on, fwd: -20 * Math.sin(ph * 2) * on, bend: 40 * on });
      P.rot('frill', -24 * spin, 0, 0).rot('frill2', -20 * spin, 0, 0);
      emote(P, pt > 0.3 ? 'shut' : 'sleepy', on); mand(P, 4 + 10 * pt);
      P.burst(2.2, 'sparkle', 'horn3', TIP, { n: 12, speed: 1.4 }).burst(1.8, 'zebra', 'root', [0, 0.2, 0], { n: 4, speed: 0.6, spread: 1 });
      for (const t0 of [0.5, 1.0, 1.5]) P.burst(t0, 'note', 'head', [3, 33, 1], { n: 1, dir: [0.4, 1, 0], speed: 0.8 });
    } },
    // the coin: a flick of the claw sends a gold coin spinning high; caught without looking, checked, a slow smirk
    coin: { len: 3.0, next: 'idle', f(P, t) {
      const up = seg(t, 0.05, 0.45, E.inout) * (1 - seg(t, 2.5, 2.95, E.inout)), air = t > 0.62 && t < 1.42 ? Math.sin(((t - 0.62) / 0.8) * Math.PI) : 0, look = seg(t, 1.5, 1.8, E.inout) * (1 - seg(t, 2.4, 2.7));
      P.face('prop', t > 0.1 && t < 2.6 ? 'on' : 'off');
      legs(P, R, { y: -0.4, roll: 2 * up, fL: [0, 0.8] });
      arm(P, 'R', { out: 10 * up, fwd: 70 * up, bend: 10 * up + 30 * look, wrist: -20 * bump(t, 0.55, 0.7) + 20 * bump(t, 1.38, 1.5) });
      arm(P, 'L', { out: 40 * up, fwd: 70 * up, bend: 110 * up, twist: 30 * up });
      P.rot('coinR', t > 0.62 && t < 1.42 ? t * 2200 : 0, 0, 0).pos('coinR', 0, 0, 12 * air);
      P.rot('head', -24 * air + 22 * look, 0, -8 * look);
      emote(P, look > 0.4 ? 'sleepy' : air > 0.3 ? 'open' : 'sleepy'); mand(P, 4 + 10 * look);
      P.burst(1.02, 'sparkle', 'handR', [-6.2, 13, 13], { n: 4, speed: 0.6 }).burst(1.44, 'star', 'handR', [-6.2, 12.6, 0.6], { n: 2 });
    } },
  },
};
def.anim = anim;
// the ultra-drip form: white armour turns black lacquer, the ivory horn and the long hair turn gold; gold eyes kept
def.dripForm = dripMap({ black: [[180, 300]], gold: [[0, 72]], greys: true, keep: ['#ffc43a', '#a86a10'] });

