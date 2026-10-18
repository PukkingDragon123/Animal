// Pepperhorn — stage 2 of the Beatlet line (Bio): a Heracross-like bipedal rhinoceros beetle,
// taller and stronger, and a marching-band showman. Its carapace and chest are patterned like a
// satin Sgt.-Pepper-era band jacket — colour-blocked pink chest, teal shoulders and wing cases,
// orange collar, sash and cuffs, gold frogging — its fur-tufted mandibles droop like a bandsman's
// moustache, and its horn curls up into a flared brass bell it can blow like a horn. Almond eyes
// with whites and a teal iris. Proud, loud, theatrical. Evolves from Beatlet; splits into
// Abbeyhorn or Walrusk.
// Drip (one per tier): 1 gold epaulettes | gold aiguillette · 2 medal row | tinted shades pushed
// up · 3 marching snare drum | satin half-cape.
import { eyeRig } from './eyes.js';
import { shift } from './kit.js';
import { dripMap } from './beetle_parts.js';
import { B, both, chitin, segs, fur, satin, frogging, goldP, fringeP, tipP, band, at, GOLD, legs, arm, arms, emote, mand, darts, walkCycle, sharedClips, onBack, E, seg, bump, wob, wave, TAU } from './beetle_parts.js';

const C = {
  shell: ['#4a8a9c', '#1e4a5c', '#12303e', '#0a1c26'], pink: ['#ffa8d0', '#ff4fa3', '#c42a78', '#8a1a56'], teal: ['#7af0e0', '#22b8a8', '#147a72', '#0c4a46'],
  orange: ['#ffc07a', '#ff8a2a', '#c85a14', '#7a3410'], must: ['#d89a6a', '#8a4e2a', '#55301a', '#2e180c'], claw: ['#4a6a78', '#22323c', '#141c24', '#0a0e12'],
};
// ---------------------------------------------------------------- painters
const shellP = chitin(C.shell, { gloss: '#a8e8f0' });
const tealP = satin(C.teal), pinkP = satin(C.pink), orangeP = satin(C.orange);
const sashP = segs(C.orange, { every: 1.4 });
const clawP = tipP(C.claw);
// the chest: pink satin front with four rows of gold frogging; teal satin round the sides and back
const chestP = (p, w, h, face, cube) => (face === 'south' ? frogging(pinkP, [19.3, 17.8, 16.3, 14.8], { half: 0.4 })(p, w, h, face, cube) : tealP(p, w, h, face, cube));
const collarP = (p, w, h, face) => { orangeP(p, w, h, face); if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) { p.px(x, 0, GOLD[0]); p.px(x, h - 1, GOLD[2]); } };
const cuffP = (p, w, h, face) => { orangeP(p, w, h, face); if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) { p.px(x, 1, GOLD[1]); if (x % 3 === 1) p.px(x, 2, GOLD[2]); } };
// wing cases: glossy teal satin with gold piping along the edges and the centre seam
function backP(p, w, h, face, cube) {
  chitin(C.teal, { gloss: '#d8fff8' })(p, w, h, face, cube);
  if (face === 'down') return;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [X, Y] = at(face, cube, x, y); if ((face === 'north' || face === 'up') && Math.abs(X) < 0.3) p.px(x, y, GOLD[1]); if (face === 'north' && Math.abs(Math.abs(X) - 5.4) < 0.3) p.px(x, y, GOLD[2]); }
}
const mustP = fur(C.must, { shine: 0.25, gloss: '#ffd0a0' });
const hornP = chitin(C.shell, { gloss: '#a8e8f0', dots: false });
const bellRim = (p, w, h, face) => { goldP(p, w, h, face); if (face === 'up') { for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) p.px(x, y, (x + y) % 5 ? '#3a2408' : '#5a3a10'); } };
// drip painters
const ribbonP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, ['#ff4fa3', '#ffffff', '#22b8a8'][Math.floor(x * 3 / w)]); };
const lensP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const e = x === 0 || y === 0 || x === w - 1 || y === h - 1; p.px(x, y, face === 'south' && !e ? (x + y < 3 ? '#ffe8a0' : '#ff9a2a') : GOLD[e ? 2 : 1]); } };
const drumP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let c = face === 'up' ? (Math.hypot(x - w / 2, y - h / 2) < 1 ? '#d8d0c0' : '#f4f0e6') : y < 1 || y >= h - 1 ? GOLD[1] : '#f6f2ea'; if (face !== 'up' && face !== 'down' && y > 0 && y < h - 1 && Math.abs(((x + y * 2) % 8) - 4) < 1) c = '#e8202a'; p.px(x, y, c); } };
const capeP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let c = face === 'south' ? band(C.pink, face, x, y, h) : band(C.teal, face, x, y, h); if (face === 'north' && (y === h - 1 || x === 0 || x === w - 1)) c = GOLD[1]; p.px(x, y, c); } };
const strapP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? GOLD[0] : (x % 4 === 0) ? GOLD[2] : GOLD[1]); };

// ---------------------------------------------------------------- the model
const R = { hipX: 3.0, hipY: 10.0, ankleY: 1.8, L1: 4.0, L2: 4.2 };
// almond eyes with whites and a teal iris
const EYES = eyeRig({ style: 'pix', chunk: 2, at: [-2.25, 24.4, 3.82], line: '#0c1a20', iris: '#22c8b8', irisDark: '#0c5a56',
  map: { open: ['llll.', 'lwhil', 'lwiIl', '.lll.'] } });
const RIGHT = [
  { name: 'thighR', parent: 'root', pivot: [-3.0, 10.0, 0], cubes: [B(-4.3, 5.6, -1.4, -1.7, 10.8, 1.4, shellP)] },
  { name: 'shinR', parent: 'thighR', pivot: [-3.0, 6.0, 0], cubes: [B(-4.1, 1.6, -1.2, -1.9, 6.4, 1.2, shellP), B(-4.3, 5.2, 0.4, -1.7, 6.8, 1.6, orangeP)] },
  { name: 'footR', parent: 'shinR', pivot: [-3.0, 1.8, 0], cubes: [B(-4.5, 0, -1.6, -1.5, 2.0, 2.4, shellP), B(-4.4, 0, 2.4, -3.2, 1.0, 3.6, clawP), B(-2.8, 0, 2.4, -1.6, 1.0, 3.6, clawP)] },
  { name: 'elytraR', parent: 'torso', pivot: [-0.1, 20.6, -3.0], cubes: [B(-5.8, 12.2, -5.4, -0.04, 21.2, -2.6, backP), B(-5.0, 21.2, -4.6, -0.04, 21.8, -2.0, backP)] },
  { name: 'armR', parent: 'torso', pivot: [-6.2, 19.6, 0], cubes: [
    B(-7.6, 17.4, -1.8, -4.8, 21.0, 1.8, tealP), B(-7.4, 14.6, -1.4, -5.0, 17.6, 1.4, tealP),
    // normal: gold epaulette on the shoulder, fringed
    B(-7.9, 20.9, -2.1, -4.6, 21.8, 2.1, goldP, { id: 'acc-epaul', hide: true }), B(-7.95, 19.5, -2.1, -7.95, 20.9, 2.1, fringeP, { plane: 'x', id: 'acc-epaul', hide: true }),
  ] },
  { name: 'foreR', parent: 'armR', pivot: [-6.2, 15.0, 0], cubes: [B(-7.6, 10.8, -1.6, -4.8, 15.2, 1.6, shellP), B(-7.8, 10.4, -1.8, -4.6, 11.8, 1.8, cuffP)] },
  { name: 'handR', parent: 'foreR', pivot: [-6.2, 10.6, 0], cubes: [B(-7.6, 8.6, -1.4, -4.8, 10.6, 1.4, shellP)] },
  { name: 'clawR', parent: 'handR', pivot: [-6.2, 8.8, 0.4], cubes: [B(-7.5, 6.8, -0.2, -6.7, 8.8, 1.2, clawP), B(-6.6, 6.5, -0.2, -5.8, 8.8, 1.2, clawP), B(-5.7, 6.8, -0.2, -4.9, 8.8, 1.2, clawP)] },
  // a drum-major's baton for the baton-twirl fidget
  { name: 'batonR', parent: 'handR', pivot: [-6.2, 7.8, 0.4], cubes: [B(-6.5, 7.5, -4.4, -5.9, 8.1, 5.2, goldP, { id: 'baton', hide: true }), B(-6.8, 7.2, 5.0, -5.6, 8.4, 6.2, pinkP, { id: 'baton', hide: true }), B(-6.8, 7.2, -5.6, -5.6, 8.4, -4.4, tealP, { id: 'baton', hide: true })] },
  // mandibles furred like a bandsman's drooping moustache
  { name: 'mandR', parent: 'head', pivot: [-1.0, 21.9, 4.6], cubes: [B(-3.8, 20.8, 4.2, -0.2, 22.3, 5.6, mustP), B(-4.6, 18.8, 4.4, -3.2, 21.0, 5.4, mustP)] },
];
export const def = {
  name: 'pepperhorn', ppu: 3, scale: 0.56, outline: { color: '#0e1418', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'pelvis', parent: 'root', pivot: [0, 10.0, 0], cubes: [B(-4.4, 8.4, -3.6, 4.4, 12.6, 3.4, sashP)] },
    { name: 'torso', parent: 'pelvis', pivot: [0, 12.4, 0], cubes: [
      B(-5.4, 12.0, -3.8, 5.4, 21.0, 3.8, chestP), B(-3.8, 20.4, -2.8, 3.8, 21.8, 3.0, collarP),
      // normal (or): a gold aiguillette looping from the right shoulder across the chest
      B(-5.4, 18.4, 3.82, -0.8, 18.9, 4.15, strapP, { pivot: [-5.4, 18.65, 4], rot: [0, 0, -16], id: 'acc-aigu', hide: true }),
      B(-5.2, 17.0, 3.82, -1.4, 17.5, 4.15, strapP, { pivot: [-5.2, 17.25, 4], rot: [0, 0, -30], id: 'acc-aigu', hide: true }),
      B(-1.9, 15.6, 3.82, -1.1, 16.8, 4.3, goldP, { id: 'acc-aigu', hide: true }),
      // dripped: a row of medals on ribbons
      ...[1.0, 2.2, 3.4].flatMap((x) => [B(x, 18.0, 3.82, x + 0.9, 19.2, 4.1, ribbonP, { id: 'acc-medals', hide: true }), B(x, 16.9, 3.82, x + 0.9, 18.0, 4.3, goldP, { id: 'acc-medals', hide: true })]),
      // ultra: the drum strap
      B(-5.6, 15.2, 3.82, 5.0, 15.8, 4.15, strapP, { pivot: [0, 15.5, 4], rot: [0, 0, 30], id: 'acc-drum', hide: true }),
    ] },
    // ultra dripped: a marching snare drum carried in front, sticks tucked in its hoop
    { name: 'drum', parent: 'pelvis', pivot: [2.8, 9.6, 5.0], cubes: [
      B(1.0, 8.2, 3.7, 4.8, 10.8, 7.2, drumP, { id: 'acc-drum', hide: true }),
      B(4.7, 10.0, 4.0, 5.0, 13.6, 4.3, clawP, { pivot: [4.85, 10, 4.15], rot: [0, 0, -14], id: 'acc-drum', hide: true }), B(4.7, 10.0, 6.4, 5.0, 13.6, 6.7, clawP, { pivot: [4.85, 10, 6.55], rot: [0, 0, -24], id: 'acc-drum', hide: true }),
    ] },
    // ultra (or): a satin half-cape, teal over pink lining
    { name: 'cape', parent: 'torso', pivot: [0, 21.4, -5.9], cubes: [B(-6.0, 11.4, -6.3, 6.0, 21.4, -5.7, capeP, { id: 'acc-cape', hide: true })] },
    { name: 'head', parent: 'torso', pivot: [0, 21.0, 0.6], cubes: [
      B(-4.0, 20.8, -2.6, 4.0, 26.4, 3.8, shellP),
      B(-2.4, 20.6, 3.6, 2.4, 22.8, 5.0, shellP),                                                          // the clypeus
      B(-1.2, 20.7, 4.9, 1.2, 21.3, 5.15, (p, w, h) => p.rect(0, 0, w, h, '#06080a'), { outline: false }),
      // dripped (or): tinted round shades pushed up on its brow
      B(-3.4, 25.7, 3.7, -0.7, 26.9, 4.3, lensP, { id: 'acc-shades', hide: true }), B(0.7, 25.7, 3.7, 3.4, 26.9, 4.3, lensP, { id: 'acc-shades', hide: true, mirror: true }),
      B(-0.7, 26.2, 3.8, 0.7, 26.5, 4.1, goldP, { id: 'acc-shades', hide: true }),
      B(-4.15, 26.1, -1.0, -3.95, 26.4, 3.9, goldP, { id: 'acc-shades', hide: true }), B(3.95, 26.1, -1.0, 4.15, 26.4, 3.9, goldP, { id: 'acc-shades', hide: true }),
    ] },
    // the horn: up from the brow, curling forward into a flared brass bell
    { name: 'horn', parent: 'head', pivot: [0, 26.0, 1.4], rot: [-6, 0, 0], cubes: [B(-1.4, 25.8, 0.2, 1.4, 29.8, 2.8, hornP)] },
    { name: 'horn2', parent: 'horn', pivot: [0, 29.6, 1.5], rot: [20, 0, 0], cubes: [B(-1.0, 29.6, 0.5, 1.0, 33.4, 2.5, hornP)] },
    { name: 'bell', parent: 'horn2', pivot: [0, 33.2, 1.5], rot: [30, 0, 0], cubes: [
      B(-1.2, 33.2, 0.3, 1.2, 34.6, 2.7, goldP), B(-1.9, 34.6, -0.4, 1.9, 35.8, 3.4, goldP), B(-2.7, 35.8, -1.2, 2.7, 36.8, 4.2, goldP), B(-3.3, 36.8, -1.8, 3.3, 37.3, 4.8, bellRim),
    ] },
    ...both(...RIGHT),
    ...EYES.bones,
  ],
};
def.drip = [
  [{ id: 'acc-epaul', name: 'Gold epaulettes' }, { id: 'acc-aigu', name: 'Gold aiguillette' }],
  [{ id: 'acc-medals', name: 'Medal row' }, { id: 'acc-shades', name: 'Tinted round shades' }],
  [{ id: 'acc-drum', name: 'Marching snare' }, { id: 'acc-cape', name: 'Satin half-cape' }],
];
def.attach = {
  head: { bone: 'head', at: [0, 26.4, 0.6], size: 8 },
  face: { bone: 'head', at: [0, 24.4, 3.85], size: 8 },
  neck: { bone: 'torso', at: [0, 20.6, 3.1], size: 7.6 },
  back: { bone: 'torso', at: [0, 16.6, -5.5], size: 11.6 },
};

// ---------------------------------------------------------------- animation
const HEAD = [0, 29, 2], BELL = [0, 37.4, 1.5];
const toot = (P, t0, n = 3) => P.burst(t0, 'soundring', 'bell', BELL, { dir: [0, 1, 0.1], tint: [1, 0.9, 0.6] }).burst(t0, 'goldnote', 'bell', BELL, { n, dir: [0, 1, 0.3], speed: 1.4, spread: 0.6 });
const shared = sharedClips(R, {
  headTop: HEAD, weight: 0.35,
  downPose: (P, k, t) => { onBack(P, R, k, t, { lift: 3.1 }); mand(P, 14 * k, 10 * k); },
  sleepPose: (P, br, t) => { legs(P, R, { y: -0.6 + br * 0.15, roll: Math.sin(t * TAU / 3.4) * 2 }); P.rot('torso', 6 + br * 1.2, 0, 0).rot('head', 26 + br * 3, 0, 6); arms(P, { out: 4, fwd: 4, bend: 10 }); mand(P, 2, 10); },
});
export const anim = {
  start: 'idle', seed: 13,
  breathe: { bone: 'torso', amp: 0.018, per: 2.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.4, 5.0], dur: 0.12 },
  look: { bone: 'head', yaw: 28, pitch: 12, speed: 5 },
  springs: [
    { bone: 'mandR', tip: [-2, -2, 0.6], k: 220, d: 10, gain: 0.5, max: 14, axes: [1, 0.3, 1] },
    { bone: 'mandL', tip: [2, -2, 0.6], k: 220, d: 10, gain: 0.5, max: 14, axes: [1, 0.3, 1] },
    { bone: 'bell', tip: [0, 2, 0.6], k: 240, d: 11, gain: 0.5, max: 10 },
    { bone: 'cape', tip: [0, -9, -0.4], k: 120, d: 8, gain: 0.8, max: 26, axes: [1, 0.2, 0.6] },
    { bone: 'drum', tip: [0, -1, 1], k: 260, d: 12, gain: 0.4, max: 8 },
  ],
  faces: { eyes: EYES.slot, prop: { default: 'off', states: { on: ['baton'], off: [] } } },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'baton', 'twirl', 'drumroll'] },
  clips: {
    ...shared,
    // chest out, weight rolling heel to heel on a march beat, the bell bobbing, moustache twitching, eyes darting
    idle: { len: 2.4, loop: true, f(P, t) {
      const ph = (t / 2.4) * TAU, s = Math.sin(ph * 2), lift = Math.max(0, Math.sin(ph * 2));
      legs(P, R, { y: -0.5 - 0.3 * Math.abs(s), roll: 2.4 * Math.sin(ph), fR: [0.5 * Math.max(0, Math.sin(ph)) ** 3, 0], fL: [0.5 * Math.max(0, -Math.sin(ph)) ** 3, 0], toeR: -10 * Math.max(0, Math.sin(ph)) ** 3, toeL: -10 * Math.max(0, -Math.sin(ph)) ** 3 });
      P.rot('torso', -3, 3 * Math.sin(ph), -1.5 * Math.sin(ph)).scl('torso', 1 + 0.02 * lift, 1, 1 + 0.02 * lift).rot('head', 2 - 2 * lift, -3 * Math.sin(ph), 2 * Math.sin(ph));
      arms(P, { out: 8, fwd: 4, bend: 14 + 4 * lift, grip: 10 });
      mand(P, 2 + 6 * bump(t, 1.5, 1.7), 0);
      darts(P, t, 0.2, 1.2, 5);
    } },
    // a marching strut: knees high, arms swinging stiff
    walk: { len: 0.8, loop: true, f(P, t) {
      walkCycle(P, R, t, { len: 0.8, stride: 2.0, lift: 2.4, bob: 0.5, sway: 3, swing: 34, twist: 4, crouch: 0.6, lean: -3, out: 8, bend: 10 });
      P.rot('head', 2, 0, 0);
    } },
    // fanfare: rears back, points the bell to the sky and blows — rings of sound, a fountain of notes
    cry: { len: 2.2, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.42, E.out)), blow = seg(t, 0.36, 0.5, E.back) * (1 - seg(t, 1.7, 2.0, E.inout));
      legs(P, R, { y: -1.4 * crouch + 0.4 * blow, pitch: -14 * blow + 6 * crouch });
      P.scl('torso', 1 + 0.08 * crouch, 1, 1 + 0.08 * crouch).rot('head', 12 * crouch - 30 * blow + wave(t, 6) * 3 * blow, 0, 0);
      arms(P, { out: 20 * crouch + 60 * blow, fwd: 10, bend: 30, grip: 20 * blow });
      emote(P, crouch > 0.3 ? 'angry' : blow > 0.3 ? 'closed' : 'open'); mand(P, 6 + 20 * blow, -6 * blow); P.blinkOK = false;
      if (blow > 0.5) P.stream('soundring', 'bell', BELL, { rate: 6, dir: [0, 1, 0.1], tint: [1, 0.9, 0.6] }).stream('goldnote', 'bell', BELL, { rate: 10, dir: [0, 1, 0.3], speed: 1.6, spread: 0.6, key: 'g' });
      P.burst(0.5, 'confetti', 'bell', BELL, { n: 20, dir: [0, 1, 0.2], speed: 1.4 });
    } },
    // horn toss: a low crouch, a lunge, and the horn swings up hard
    attack: { len: 1.1, next: 'idle', f(P, t) {
      const low = seg(t, 0, 0.26, E.inout) * (1 - seg(t, 0.34, 0.42, E.in)), toss = seg(t, 0.36, 0.48, E.back) * (1 - seg(t, 0.66, 1.0, E.inout)), go = seg(t, 0.28, 0.44, E.out) * (1 - seg(t, 0.7, 1.05, E.inout));
      legs(P, R, { y: -2.0 * low - 0.6 * toss, z: 1.6 * go, pitch: 28 * low - 22 * toss, fR: [0, 2.2 * go], fL: [0, -1.0 * go] });
      P.pos('root', 0, 0, 3.4 * go).rot('head', 26 * low - 40 * toss, 0, 0);
      arms(P, { out: 26 * low + 30 * toss, fwd: -20 * low + 50 * toss, bend: 50 - 30 * toss, grip: 30 * toss });
      emote(P, low > 0.2 || toss > 0.2 ? 'angry' : 'open'); mand(P, 20 * toss); P.blinkOK = false;
      P.burst(0.46, 'spark', 'bell', BELL, { n: 2 }).burst(0.46, 'star', 'bell', BELL, { n: 4 }).burst(0.3, 'dust', 'root', [0, 0.5, 2], { n: 8, spread: 1, speed: 1.2 });
    } },
    // brass fanfare: a wide stance, a huge breath that swells the jacket, then a sustained blast — shockwaves, notes, confetti
    special: { len: 2.6, next: 'idle', f(P, t) {
      const inhale = seg(t, 0, 0.6, E.inout) * (1 - seg(t, 0.66, 0.74, E.out)), blast = seg(t, 0.7, 0.82, E.back) * (1 - seg(t, 2.0, 2.4, E.inout)), shake = blast * wave(t, 14) * 1.2;
      legs(P, R, { y: -1.2 * inhale - 1.0 * blast, z: -0.8 * blast, pitch: -10 * inhale + 14 * blast, fR: [0, 1.2], fL: [0, -1.2], spread: 6 * blast });
      P.scl('torso', 1 + 0.12 * inhale, 1 + 0.04 * inhale, 1 + 0.12 * inhale).rot('torso', 0, 0, shake);
      P.rot('head', -20 * inhale + 34 * blast, 0, 0).rot('horn', -10 * inhale + 6 * blast, 0, 0);
      arms(P, { out: 40 * inhale + 70 * blast, fwd: 10 - 20 * blast, bend: 30, grip: 30 * blast });
      P.rot('elytraR', -6 * blast, -12 * blast, 18 * blast).rot('elytraL', -6 * blast, 12 * blast, -18 * blast);
      emote(P, inhale > 0.3 ? 'wide' : blast > 0.3 ? 'shut' : 'open'); mand(P, 4 + 26 * blast, -8 * blast); P.blinkOK = false;
      if (blast > 0.5 && t < 2.0) {
        P.stream('soundring', 'bell', BELL, { rate: 9, dir: [0, 1, 0], speed: 1.4, tint: [1, 0.85, 0.5] });
        P.stream('goldnote', 'bell', BELL, { rate: 16, dir: [0, 1, 0.2], speed: 2.4, spread: 0.8, key: 'g' }).stream('note', 'bell', BELL, { rate: 10, dir: [0, 1, 0.2], speed: 2, spread: 0.9, key: 'n' });
        P.stream('confetti', 'bell', BELL, { rate: 30, dir: [0, 1, 0], speed: 1.6, spread: 0.9, key: 'c' });
      }
      P.burst(0.74, 'ring', 'root', [0, 1, 0], { scale: 2.2, tint: [1, 0.9, 0.6] }).burst(0.74, 'dust', 'root', [0, 0.5, 0], { n: 14, spread: 1, speed: 2 });
    } },
    // victory: a crisp salute, a spin on one heel, and a toot of the bell
    win: { len: 2.6, next: 'idle', f(P, t) {
      const sal = seg(t, 0.05, 0.25, E.back) * (1 - seg(t, 0.95, 1.1, E.inout)), spin = seg(t, 1.05, 1.6, E.inout), toots = seg(t, 1.6, 1.75, E.back) * (1 - seg(t, 2.25, 2.55, E.inout));
      legs(P, R, { y: -0.3 * sal + 0.6 * bump(t, 1.05, 1.6) - 0.8 * bump(t, 1.55, 1.7), pitch: -4 * sal - 14 * toots, fR: [0.6 * bump(t, 1.05, 1.6), 0] });
      P.rot('root', 0, 360 * spin, 0);
      arm(P, 'R', { out: 70 * sal, fwd: 20 * sal, bend: 120 * sal, wrist: 20 * sal }); arm(P, 'L', { out: 6 + 50 * toots, bend: 10 });
      P.rot('head', -30 * toots, 0, 0);
      emote(P, toots > 0.3 ? 'closed' : sal > 0.3 ? 'happy' : 'open'); mand(P, 6 + 18 * toots); P.blinkOK = false;
      toot(P, 1.68, 6); P.burst(1.68, 'confetti', 'bell', BELL, { n: 30, dir: [0, 1, 0], speed: 1.6 });
      if (toots > 0.5) P.stream('soundring', 'bell', BELL, { rate: 5, dir: [0, 1, 0.1], tint: [1, 0.9, 0.6] });
    } },
    // fidget: twirls the tip of its moustache with a claw, smug
    twirl: { len: 2.0, next: 'idle', f(P, t) {
      const on = seg(t, 0.05, 0.35, E.inout) * (1 - seg(t, 1.55, 1.9, E.inout)), tw = on * wave(t, 2.2);
      legs(P, R, { y: -0.4, roll: -3 * on });
      arm(P, 'R', { out: 30 * on, fwd: 64 * on, bend: 110 * on, twist: 30 * on, wrist: 20 * tw, grip: 30 * on });
      P.rot('mandR', 6 * tw, -10 * on, -12 * tw).rot('head', -6 * on, 10 * on, -6 * on);
      emote(P, on > 0.4 ? 'sleepy' : 'open', on);
    } },
    // fidget: a drumroll on its own belly, finishing with a cymbal-crash flourish
    drumroll: { len: 2.0, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.2, E.inout) * (1 - seg(t, 1.6, 1.95, E.inout)), r = Math.abs(Math.sin(t * TAU * 6)), crash = bump(t, 1.25, 1.6);
      legs(P, R, { y: -0.5 - 0.3 * r * on });
      arm(P, 'R', { out: 10 * on + 50 * crash, fwd: 50 * on, bend: 90 * on - 40 * r * on }); arm(P, 'L', { out: 10 * on + 50 * crash, fwd: 50 * on, bend: 90 * on - 40 * (1 - r) * on });
      P.rot('head', 10 * on - 20 * crash, 0, 0);
      emote(P, crash > 0.3 ? 'happy' : on > 0.5 ? 'closed' : 'open', on); mand(P, 8 * on + 16 * crash);
      P.burst(1.32, 'star', 'torso', [0, 18, 5], { n: 5, speed: 1.4 }).burst(1.32, 'goldnote', 'head', HEAD, { n: 3, speed: 1.2 });
    } },
    // the band strut: a high-knee march in place, arms pumping, a full turn on the spot, a toot of the bell to finish
    dance: { len: 3.0, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.2, E.out) * (1 - seg(t, 2.6, 3.0, E.inout)), ph = t * TAU * 1.5, a = Math.max(0, Math.sin(ph)), b = Math.max(0, -Math.sin(ph)), fin = seg(t, 2.25, 2.4, E.back) * (1 - seg(t, 2.7, 3.0));
      legs(P, R, { y: -0.5 - 0.5 * (1 - a - b) * on, pitch: -4 * on, fR: [3.6 * a * on * (1 - fin), 0.8 * a * on], fL: [3.6 * b * on * (1 - fin), 0.8 * b * on], toeR: -24 * a, toeL: -24 * b });
      P.rot('root', 0, 360 * seg(t, 1.0, 2.0, E.inout), 0);
      arm(P, 'R', { out: 10, fwd: 50 * (a - b) * on, bend: 70 * on }); arm(P, 'L', { out: 10 + 60 * fin, fwd: 50 * (b - a) * on, bend: 70 * on * (1 - fin) });
      P.rot('head', -30 * fin, 0, 0).rot('torso', 0, 6 * Math.sin(ph) * on, 0);
      emote(P, fin > 0.3 ? 'closed' : 'happy', on); mand(P, 6 + 20 * fin); P.blinkOK = false;
      toot(P, 2.3, 5); P.burst(2.3, 'confetti', 'bell', BELL, { n: 26, dir: [0, 1, 0], speed: 1.6 });
      for (const t0 of [0.33, 1.0, 1.67]) P.burst(t0, 'dust', 'root', [0, 0.5, 1], { n: 3, spread: 1, speed: 0.6 });
    } },
    // the baton: a drum-major's baton spun like a propeller, flung high, caught behind its back — salute
    baton: { len: 3.6, next: 'idle', f(P, t) {
      const up = seg(t, 0.05, 0.4, E.back) * (1 - seg(t, 3.2, 3.55, E.inout)), cr = bump(t, 1.3, 1.55), air = t > 1.55 && t < 2.45 ? Math.sin(((t - 1.55) / 0.9) * Math.PI) : 0, sal = seg(t, 2.7, 2.9, E.back) * (1 - seg(t, 3.2, 3.5));
      P.face('prop', t > 0.12 && t < 2.65 ? 'on' : 'off');
      legs(P, R, { y: -0.5 - 1.4 * cr + wob(t, 2.45, -0.8, 3, 6) });
      arm(P, 'R', { out: 20 * up + 50 * sal, fwd: 50 * up * (1 - sal) + 20 * sal, bend: 60 * up * (1 - sal) + 120 * sal, wrist: 20 * sal });
      arm(P, 'L', { out: 14 + 20 * bump(t, 2.3, 2.6), fwd: -30 * bump(t, 2.3, 2.7), bend: 30 });
      P.rot('batonR', t * (t < 1.4 ? 1100 : 1600), 0, 0).pos('batonR', 0, 3 * air, 12 * air);
      P.rot('head', -20 * air, 0, 0);
      emote(P, sal > 0.3 ? 'happy' : air > 0.3 ? 'wide' : cr > 0.3 ? 'angry' : 'open'); mand(P, 6 + 10 * air); P.blinkOK = false;
      P.burst(1.56, 'sparkle', 'handR', [-6.2, 7.8, 0.4], { n: 8, speed: 1.2 }).burst(2.46, 'star', 'torso', [0, 18, -5], { n: 4 }).burst(2.8, 'confetti', 'bell', BELL, { n: 20, dir: [0, 1, 0], speed: 1.4 });
      toot(P, 2.8, 3);
    } },
  },
};
def.anim = anim;
// the ultra-drip form: black lacquer jacket and shell, gold braid and bell; the eyes keep their teal
def.dripForm = dripMap({ black: [[150, 300], [300, 345]], gold: [[10, 72]], keep: ['#22c8b8', '#0c5a56'] });

