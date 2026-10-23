// Snoozaque — a fat, fluffy Japanese snow monkey that is always half asleep (an Arctic Monkeys
// homage, stage 1 of the line that becomes Piledrilla and then Fluorescape). Silver-beige fluff, a
// pink heart-shaped macaque face with heavy flat-lidded sleepy eyes, little fangs for its enormous
// yawns, a glossy slicked-back quiff with a pile of snow on top, and a black leather jacket with the
// collar popped. It keeps a comb in its back pocket and slicks its quiff back whenever it remembers
// to be cool. Homage only — no logos, no album art.
import { E, seg, bump, wob, wave, bounce, hop } from '../anim.js';
import { eyeRig, eyesAt, eyesScale, glance, keepEyes } from './eyes.js';
import {
  FUR, A, B, L, both, twin, acc, region, ell, goldP, chainP, knit, beat, env, plant, furP, skinP, monkeyFace, quiffP, snowP, leatherP, iceP,
  combP, lensP, goldWireP, hollowBodyP, fretboardP, headP, mirrorP, bootP, heelP, SCARF, SNOOZ_EYES, mouthPlanes, AMFX, arcticForm, AM_FX_MAP,
} from './arctic_parts.js';

const TAU = Math.PI * 2, F = FUR.snooz, HAND = ['#a8807e', '#c8a09c', '#7a5658'];
// ---------------------------------------------------------------- painters
const fur = furP(F), furFringe = furP(F, { fringe: true }), bellyFur = furP({ c: F.belly, hi: '#f6efe4', lo: F.bellyLo, deep: F.bellyLo });
const pink = skinP(A.pink, A.pinkHi, A.pinkLo), hand = skinP(...HAND);
const muzzleP = (p, w, h, face) => {
  if (face === 'down') { p.rect(0, 0, w, h, A.mouth); return; }
  pink(p, w, h, face);
  if (face === 'south') { const c = Math.floor(w / 2); p.rect(c - 3, 1, 2, 1, A.pinkDeep).rect(c + 1, 1, 2, 1, A.pinkDeep); for (let y = 2; y < h - 2; y++) p.px(c, y, A.pinkLo); }
};
const jawP = (p, w, h, face) => { if (face === 'up') { p.rect(0, 0, w, h, A.mouth); p.rect(1, 1, w - 2, h - 1, A.tongue); return; } pink(p, w, h, face); };
const fangP = (p, w, h) => { p.rect(0, 0, w, h, A.fang); p.rect(0, h - 1, w, 1, '#d8d0c0'); };
const bubbleP = (p, w, h) => { const c = w / 2, r = w / 2; region(p, w, h, (x, y) => (x + 0.5 - c) ** 2 + (y + 0.5 - c) ** 2 < r * r, (x, y) => ((x + 0.5 - c) ** 2 + (y + 0.5 - c) ** 2 > (r - 1.5) ** 2 ? '#a8dcf4' : '#e0f6ff')); p.px(Math.round(c - r * 0.4), Math.round(c - r * 0.45), '#ffffff'); };
const toesP = (p, w, h, face) => { hand(p, w, h, face); if (face === 'up' || face === 'south') for (let x = 2; x < w; x += 3) for (let y = face === 'up' ? h - 3 : 0; y < h; y++) p.px(x, y, HAND[2]); };

// ---------------------------------------------------------------- the model
const HEADBOX = [-5.6, 24.0, 11.2, 10.4];
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-2.2, 19.6, 5.24], line: SNOOZ_EYES.line, pupilColor: SNOOZ_EYES.pupilColor, iris: SNOOZ_EYES.iris, irisDark: SNOOZ_EYES.irisDark, accent: SNOOZ_EYES.accent, map: SNOOZ_EYES.map, extra: ['smug'] });
const MOUTH = mouthPlanes([0, 15.5, 6.64], 'flat');
const FOOT = [B([-5.2, 0, -1.2], [4.0, 1.2, 4.8], toesP)];
const BOOT = acc('acc-boots', [B([-5.4, 0.5, -1.4], [4.4, 2.4, 5.2], bootP), B([-5.0, 0, -1.4], [3.6, 0.6, 1.6], heelP), B([-5.4, 0, 2.2], [4.4, 0.5, 1.6], heelP)]);
export const def = {
  name: 'snoozaque', ppu: 3, scale: 0.42, outline: { color: '#1a1216', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...twin({ name: 'legR', parent: 'root', pivot: [-3.2, 4.6, 0.2], cubes: [B([-5.1, 1.0, -1.6], [3.8, 3.8, 3.6], fur)] }),
    ...twin({ name: 'footR', parent: 'root', pivot: [-3.2, 1.0, 0.6], cubes: [...FOOT, ...BOOT] }),
    { name: 'body', parent: 'root', pivot: [0, 4, 0], cubes: [
      B([-6.2, 3.6, -5.2], [12.4, 10.6, 10.4], fur),
      B([-6.8, 5.0, -4.4], [13.6, 6.8, 8.8], fur),
      B([-3.4, 4.4, 5.0], [6.8, 6.4, 1.1], bellyFur),
      B([-5.4, 14.0, -4.4], [10.8, 0.8, 8.8], fur),
      // the black leather jacket, cropped short, zipped open over the belly, collar popped
      B([-6.7, 6.6, -5.8], [13.4, 7.6, 0.6], leatherP({ seam: 0.5 })),
      ...both(B([-7.3, 6.6, -4.9], [0.6, 7.0, 9.6], leatherP())),
      B([-6.6, 6.6, 5.0], [3.6, 7.6, 1.3], leatherP({ zip: -1, lapel: 9, lapelX: -1 })), B([3.0, 6.6, 5.0], [3.6, 7.6, 1.3], leatherP({ zip: 0, lapel: 9 }), { mirror: true }),
      B([-5.6, 13.8, -5.9], [11.2, 2.8, 0.8], leatherP(), { pivot: [0, 13.8, -5.5], rot: [-14, 0, 0] }),
      ...both(B([-6.6, 13.6, -4.8], [0.8, 2.8, 6.6], leatherP(), { pivot: [-6.2, 13.8, -1.5], rot: [0, 0, 16] })),
      // tier 2 (or): a thin gold chain with an ice-cube pendant
      ...acc('acc-chain', [B([-3.8, 11.6, 6.3], [3.6, 0.4, 0.3], chainP, { pivot: [-2, 11.8, 6.45], rot: [0, 0, -24] }), B([0.2, 11.6, 6.3], [3.6, 0.4, 0.3], chainP, { pivot: [2, 11.8, 6.45], rot: [0, 0, 24] }), B([-0.7, 9.4, 6.25], [1.4, 1.4, 0.7], iceP({ crack: false }))]),
    ] },
    { name: 'tail', parent: 'body', pivot: [0, 6.4, -5.2], cubes: [B([-0.9, 5.6, -6.8], [1.8, 1.8, 1.8], fur)] },
    // tier 1 (or): a knitted stripy scarf
    { name: 'scarf', parent: 'body', pivot: [0, 14, 0], cubes: acc('acc-scarf', [B([-5.9, 12.8, -4.9], [11.8, 1.9, 10.8], knit(SCARF.c, { hi: SCARF.hi, lo: SCARF.lo }))]) },
    { name: 'scarfEnd', parent: 'scarf', pivot: [3.0, 13.2, 6.0], cubes: acc('acc-scarf', [B([2.0, 8.2, 5.8], [2.0, 5.0, 0.7], knit(SCARF.c, { hi: SCARF.hi, lo: SCARF.lo }))]) },
    // tier 3 (or): the black hollow-body guitar slung on its back
    { name: 'guitar', parent: 'body', pivot: [0, 9, -6], rot: [0, 0, -32], cubes: acc('acc-guitar', [
      B([-3.4, 3.2, -7.8], [6.8, 7.4, 1.6], hollowBodyP), B([-0.5, 10.6, -7.5], [1.0, 8.4, 0.8], fretboardP), B([-0.9, 19.0, -7.55], [1.8, 2.4, 0.7], headP),
    ]) },
    { name: 'head', parent: 'body', pivot: [0, 14, 0.6], cubes: [
      B([-5.6, 13.6, -4.4], [11.2, 10.4, 9.6], fur, { faces: { south: monkeyFace(F, [A.pink, A.pinkHi, A.pinkLo], HEADBOX) } }),
      ...both(B([-6.8, 14.4, -1.4], [1.6, 6.4, 5.4], furFringe)),
      ...both(B([-6.6, 19.8, 0.2], [1.2, 2.2, 2.0], pink)),
      B([-2.4, 15.0, 5.0], [4.8, 2.8, 1.6], muzzleP),
      ...both(B([-1.6, 14.3, 6.0], [0.6, 0.9, 0.5], fangP)),
      ...MOUTH.cubes,
      // tier 1: tinted aviators slid down its nose, below the sleepy eyes
      ...acc('acc-aviators', [B([-4.2, 16.4, 5.4], [3.3, 1.8, 0.4], lensP('#c87a8a')), B([0.9, 16.4, 5.4], [3.3, 1.8, 0.4], lensP('#c87a8a'), { mirror: true }), B([-0.9, 17.6, 6.55], [1.8, 0.4, 0.4], goldWireP), ...both(B([-5.9, 17.6, -2.4], [0.3, 0.4, 7.8], goldWireP))]),
    ] },
    ...EYES.bones,
    { name: 'jaw', parent: 'head', pivot: [0, 15.2, 5.2], cubes: [B([-2.1, 14.0, 4.8], [4.2, 1.2, 1.7], jawP)] },
    { name: 'snot', parent: 'head', pivot: [-0.8, 16.8, 6.7], cubes: [B([-2.0, 15.8, 6.75], [2.4, 2.4, 0], bubbleP, { plane: 'z', id: 'snot', hide: true })] },
    // the slicked quiff: a glossy cap, the pompadour roll and a curl at the front, a little pile of snow on top
    { name: 'quiff', parent: 'head', pivot: [0, 24.2, 2], cubes: [
      B([-5.4, 23.4, -4.8], [10.8, 1.6, 9.0], quiffP({ band: 0.3 })),
      B([-4.4, 24.8, -4.4], [8.8, 1.6, 4.0], quiffP()),
      B([-4.6, 24.8, -0.6], [9.2, 2.8, 3.0], quiffP()),
      B([-4.4, 24.8, 2.2], [8.8, 3.8, 3.0], quiffP({ band: 0.25 }), { pivot: [0, 24.8, 3.7], rot: [10, 0, 0] }),
      B([-3.8, 27.6, 3.4], [7.6, 1.8, 2.6], quiffP({ band: 0.5 }), { pivot: [0, 28, 4.6], rot: [28, 0, 0] }),
      B([-5.0, 20.8, -5.1], [10.0, 3.2, 1.0], quiffP({ slant: 0 })), ...both(B([-5.9, 21.2, -4.2], [0.6, 3.0, 6.4], quiffP({ slant: 0 }))),
      B([-1.6, 28.4, 1.0], [3.2, 0.9, 2.4], snowP, { pivot: [0, 28.3, 2.6], rot: [10, 0, 6], id: 'snowcap' }),
      B([0.6, 28.1, 2.6], [1.8, 0.8, 1.6], snowP, { pivot: [0, 28.3, 2.6], rot: [10, 0, 6], id: 'snowcap' }),
      B([-1.0, 29.0, 1.8], [1.6, 0.6, 1.4], snowP, { pivot: [0, 28.3, 2.6], rot: [10, 0, 6], id: 'snowcap' }),
    ] },
    ...twin({ name: 'armR', parent: 'body', pivot: [-6.8, 12.8, 0.2], cubes: [B([-9.0, 8.2, -1.6], [2.9, 5.2, 3.4], leatherP({ seam: 0.5 }))] }),
    ...twin({ name: 'handR', parent: 'armR', pivot: [-7.6, 8.4, 0], cubes: [B([-9.1, 5.6, -1.4], [2.9, 2.8, 3.0], hand)] }),
    { name: 'comb', parent: 'handR', pivot: [-7.8, 6.4, 1.0], cubes: [B([-8.0, 5.6, 0.6], [0.5, 1.2, 4.6], combP, { id: 'comb', hide: true })] },
    { name: 'ball', parent: 'handR', pivot: [-7.6, 4.4, 0], cubes: [B([-8.6, 3.0, -0.8], [2.4, 2.4, 2.4], snowP, { id: 'snowball', hide: true })] },
    // tier 3 (or): a little ice mirrorball floating over its shoulder
    { name: 'mirror', parent: 'root', pivot: [9, 25, -1], cubes: acc('acc-mirrorball', [B([7.4, 23.4, -2.6], [3.2, 3.2, 3.2], mirrorP), B([8.9, 26.6, -1.1], [0.2, 1.6, 0.2], goldWireP)]) },
  ],
  drip: [
    [{ id: 'acc-aviators', name: 'Tinted aviators' }, { id: 'acc-scarf', name: 'Stripy knit scarf' }],
    [{ id: 'acc-chain', name: 'Ice-cube chain' }, { id: 'acc-boots', name: 'Chelsea dancing boots' }],
    [{ id: 'acc-guitar', name: 'Black hollow-body guitar' }, { id: 'acc-mirrorball', name: 'Ice mirrorball' }],
  ],
  attach: {
    head: { bone: 'quiff', at: [0, 27.4, 1], size: 10 },
    face: { bone: 'head', at: [0, 19.6, 5.4], size: 9 },
    neck: { bone: 'body', at: [0, 13.4, 5.2], size: 9 },
    back: { bone: 'body', at: [0, 9.6, -6.0], size: 9 },
  },
};
def.dripForm = { map: keepEyes(EYES, arcticForm(F)), fx: AM_FX_MAP };

// ---------------------------------------------------------------- animation
const TOP = [0, 29, 3], MOUTHP = [0, 15.2, 7.2], LEG = 3.6, HANDP = [-7.6, 5, 0];
const legs = (P, dy) => plant(P, ['legR', 'legL'], dy, LEG);
const mouth = (P, s, open = 0) => { P.face('mouth', open > 0.15 ? 'open' : s); P.rot('jaw', open * 55, 0, 0); return P; };
function onBack(P, k) {
  P.rot('root', -78 * k, 0, 0).pos('root', 0, 6 * k, 6.6 * k).rot('armR', 0, 0, -50 * k).rot('armL', 0, 0, 50 * k).rot('footR', 30 * k, 0, 0).rot('footL', 20 * k, 0, 0).rot('head', 10 * k, 0, 0);
}
export const anim = {
  start: 'idle', seed: 505,
  breathe: { bone: 'body', amp: 0.03, per: 3.0 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.4, 5.0], dur: 0.22 },
  look: { bone: 'head', yaw: 26, pitch: 10, speed: 3 },
  springs: [
    { bone: 'quiff', tip: [0, 3, 3], k: 200, d: 8, gain: 0.5, max: 10, axes: [1, 0.2, 1] },
    { bone: 'tail', tip: [0, 0, -2], k: 160, d: 7, gain: 1.0, max: 30 },
    { bone: 'scarfEnd', tip: [0, -5, 0], k: 110, d: 6, gain: 1.1, max: 30, axes: [1, 0, 1] },
    { bone: 'handR', tip: [0, -2.5, 0], k: 200, d: 9, gain: 0.4, max: 14 },
    { bone: 'handL', tip: [0, -2.5, 0], k: 200, d: 9, gain: 0.4, max: 14 },
  ],
  faces: {
    eyes: EYES.slot, mouth: MOUTH.slot,
    comb: { default: 'off', states: { off: [], on: ['comb'] } }, snowball: { default: 'off', states: { off: [], on: ['snowball'] } },
    snot: { default: 'off', states: { off: [], on: ['snot'] } }, snow: { default: 'on', states: { on: ['snowcap'], off: [] } },
  },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'comb', 'doze'] },
  clips: {
    // half asleep on its feet: a slow sway, the head drooping and catching itself, slow sleepy glances
    idle: { len: 3.0, loop: true, f(P, t, c) {
      const sway = wave(t, 1 / 3), droop = bump(t, 1.2, 2.6) * (c.loopN % 2 ? 1 : 0.4);
      P.rot('body', 0, sway * 4, sway * 3).pos('body', 0, -0.3 * droop, 0); legs(P, -0.3 * droop);
      P.rot('head', 4 + 12 * droop - 6 * wob(t, 2.6, 1, 2, 5), sway * 6, -sway * 4).rot('armR', 0, 0, -4 + sway * 3).rot('armL', 0, 0, 4 + sway * 3);
      P.rot('tail', 0, wave(t, 2 / 3) * 20, 0);
      eyesAt(P, ...glance(t + c.loopN * 1.9, [[0, 0], [-0.3, 0], [-0.3, 0], [0.3, 0], [0, 0]], 0.7, 0.25));
      P.face('eyes', droop > 0.6 ? 'sleepy' : undefined); mouth(P, c.loopN % 3 === 2 && t > 0.4 && t < 1.2 ? 'smirk' : 'flat');
      if (c.loopN % 2 === 1) P.burst(0.3, AMFX.snow, 'quiff', TOP, { n: 1 });
    } },
    // a slow, fat waddle with the shoulders rolling
    walk: { len: 0.6, loop: true, f(P, t) {
      const ph = (t / 0.6) * TAU, s = Math.sin(ph), c2 = Math.cos(ph), lr = Math.max(0, s), ll = Math.max(0, -s), dy = Math.abs(c2) * 0.6;
      P.pos('body', 0, dy, 0).rot('body', 3, s * 6, s * 8).sq('body', -0.04 * (1 - Math.abs(c2)));
      P.pos('footR', 0, lr * 1.4, s * 1.6).rot('footR', -16 * lr, 0, 0).pos('footL', 0, ll * 1.4, -s * 1.6).rot('footL', -16 * ll, 0, 0);
      P.pos('legR', 0, lr * 1.0 + dy * 0.5, s * 1.2).pos('legL', 0, ll * 1.0 + dy * 0.5, -s * 1.2);
      P.rot('armR', -s * 26, 0, -8).rot('armL', s * 26, 0, 8).rot('head', 2, -s * 4, -s * 4);
    } },
    // battle cry: an enormous yawn… that turns into a frosty roar (the eyes finally open — briefly)
    cry: { len: 2.4, next: 'idle', f(P, t) {
      P.lookW = 1 - seg(t, 0.1, 0.3); P.blinkOK = false;
      const yawn = seg(t, 0.05, 0.7, E.inout) * (1 - seg(t, 0.75, 0.85)), roar = seg(t, 0.8, 0.95, E.back) * (1 - seg(t, 1.8, 2.2, E.inout));
      P.rot('head', -22 * yawn - 14 * roar + wave(t, 9) * 3 * roar, 0, 0).rot('body', -6 * yawn - 8 * roar, 0, 0);
      P.rot('armR', 0, 0, -150 * yawn - 70 * roar).rot('armL', 0, 0, 150 * yawn + 70 * roar).pos('body', 0, 0.6 * yawn, 0).sq('body', 0.06 * yawn + wob(t, 0.85, -0.08, 3, 6));
      P.scl('quiff', 1 + 0.2 * roar);
      P.face('eyes', yawn > 0.2 ? 'closed' : t > 0.8 && t < 1.0 ? 'wide' : roar > 0.3 ? 'angry' : 'sleepy'); mouth(P, 'flat', Math.max(yawn, roar));
      if (roar > 0.4 && t < 1.7) P.stream(AMFX.breath, 'head', MOUTHP, { rate: 70, dir: [0, 0.3, 1], spread: 0.25 });
      P.burst(0.9, AMFX.ring, 'head', MOUTHP, { scale: 0.7 }).burst(0.9, AMFX.snow, 'quiff', TOP, { n: 8, speed: 1.4 });
    } },
    // physical: a lazy wind-up… and a heavy frosty backhand slap
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const bk = seg(t, 0, 0.32, E.out) * (1 - seg(t, 0.32, 0.4, E.in)), hit = seg(t, 0.34, 0.46, E.in3) * (1 - seg(t, 0.58, 0.95, E.inout));
      P.rot('body', 0, -30 * bk + 34 * hit, 0).pos('root', 0, 0, -1 * bk + 3.6 * hit).rot('armR', -40 * bk - 70 * hit, 40 * bk - 30 * hit, -60 * bk - 20 * hit);
      P.rot('head', 0, 10 * bk - 10 * hit, 0).sq('body', wob(t, 0.46, 0.06, 4, 7));
      P.face('eyes', bk > 0.3 ? 'smug' : hit > 0.3 ? 'angry' : 'sleepy'); mouth(P, hit > 0.3 ? 'frown' : 'flat'); P.blinkOK = false;
      P.burst(0.46, AMFX.frost, 'handR', HANDP, { n: 6, speed: 1.2 }).burst(0.46, AMFX.shard, 'handR', HANDP, { n: 6 }).burst(0.47, 'star', 'handR', HANDP, { n: 3 });
    } },
    // special (cryo): rolls a snowball between its paws, blows frost on it and lobs it
    special: { len: 2.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const roll = env(t, 0.05, 0.95, 0.15, 0.1), spin = Math.sin(t * TAU * 3) * roll, throwK = seg(t, 1.0, 1.2, E.back) * (1 - seg(t, 1.5, 1.9, E.inout));
      P.rot('armR', -60 * roll + spin * 10, 0, 40 * roll).rot('armL', -60 * roll - spin * 10, 0, -40 * roll).rot('head', 14 * roll, 0, 0);
      P.face('snowball', t > 0.25 && t < 1.12 ? 'on' : 'off').scl('ball', 0.5 + 0.5 * seg(t, 0.25, 0.8));
      P.rot('armR', -150 * throwK, 0, -20 * throwK).rot('body', -10 * throwK, 20 * throwK, 0).pos('root', 0, 0, 1.2 * throwK);
      P.face('eyes', t < 0.95 ? 'sleepy' : throwK > 0.3 ? 'angry' : t > 1.6 ? 'smug' : undefined); mouth(P, t > 0.6 && t < 0.9 ? 'o' : throwK > 0.3 ? 'flat' : 'smirk', bump(t, 0.6, 0.9) * 0.3);
      if (t > 0.6 && t < 0.9) P.stream(AMFX.frost, 'head', MOUTHP, { rate: 30, dir: [0, -0.5, 1], speed: 0.5 });
      P.burst(1.12, AMFX.frost, 'handR', HANDP, { n: 8, dir: [0, 0, 1], speed: 2 }).burst(1.12, AMFX.shard, 'handR', HANDP, { n: 6, dir: [0, 0.3, 1] }).burst(1.14, AMFX.snow, 'handR', HANDP, { n: 10, speed: 2 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.2, 0.7, E.inout));
      P.pos('root', 0, 0.4 * k, -2 * k).rot('body', -14 * k + wob(t, 0.2, 3, 3, 6), 0, wave(t, 14) * 4 * k).sq('body', -0.12 * k).rot('head', -12 * k, 0, 0).rot('armR', 0, 0, -40 * k).rot('armL', 0, 0, 40 * k);
      P.face('eyes', t < 0.42 ? 'x' : 'sad'); mouth(P, t < 0.42 ? 'o' : 'frown'); P.blinkOK = false;
      P.burst(0.02, AMFX.frost, 'body', [0, 12, 6], { n: 5 }).burst(0.02, AMFX.snow, 'quiff', TOP, { n: 6, speed: 1.2 }).burst(0.06, 'sweat', 'head', [6, 22, 3], {});
    } },
    // it falls asleep standing up… and topples over backwards
    faint: { len: 2.4, next: 'down', f(P, t) {
      const drift = seg(t, 0, 0.9) * (1 - seg(t, 1.0, 1.1)), fall = seg(t, 1.0, 1.45, E.bounce);
      P.rot('head', 20 * drift, 0, wave(t, 1.2) * 8 * drift).rot('body', 0, 0, wave(t, 1.2, 1) * 6 * drift).pos('body', 0, -0.6 * drift, 0); legs(P, -0.6 * drift);
      onBack(P, fall); P.face('eyes', t < 1.0 ? 'closed' : 'swirl'); mouth(P, 'o'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.0, 'star', 'head', [0, 27, 2], { n: 5 }).burst(1.42, 'dust', 'root', [0, 0, 0], { n: 8 }).burst(1.42, AMFX.snow, 'quiff', TOP, { n: 10, speed: 1.4 });
    } },
    down: { len: 3.0, loop: true, f(P, t) {
      onBack(P, 1); P.face('eyes', 'swirl'); mouth(P, 'o'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.6;
      P.rot('tail', 0, 20 * bump(t, 0.8, 1.2), 0).burst(1.5, AMFX.snow, 'body', [0, 20, 8], { n: 2, speed: 0.3 });
    } },
    // victory: a slow smug nod, finger-guns at you and a lazy wink
    win: { len: 2.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const point = seg(t, 0.25, 0.5, E.back) * (1 - seg(t, 1.8, 2.15, E.inout)), nod = bump(t, 0.6, 1.0) + bump(t, 1.0, 1.4) * 0.6;
      P.rot('armR', -80 * point, -10 * point, -12 * point).rot('handR', 0, 0, 0).rot('armL', -70 * point, 10 * point, 14 * point).rot('head', 12 * nod - 6 * point, 0, -6 * point).rot('body', -4 * point, 0, 0);
      P.face('eyes', t > 1.2 ? 'wink' : 'smug'); mouth(P, 'smirk');
      P.burst(0.5, AMFX.glint, 'handR', HANDP, { n: 3 }).burst(0.5, AMFX.glint, 'handL', [7.6, 5, 0], { n: 3 }).burst(1.25, 'sparkle', 'head', [4, 22, 6], { n: 4 }).burst(0.3, AMFX.snow, 'quiff', TOP, { n: 6 });
    } },
    // asleep for real: sat down, chin on its chest, a snot bubble swelling and shrinking
    sleep: { len: 3.6, loop: true, f(P, t) {
      const br = Math.sin((t / 3.6) * TAU);
      P.pos('body', 0, -2.4 + br * 0.25, 0).sq('body', -0.05 + br * 0.03).rot('body', 6, 0, 4); legs(P, -2.4);
      P.rot('footR', -24, -14, 0).rot('footL', -24, 14, 0).pos('footR', 0, 0, 1).pos('footL', 0, 0, 1).rot('armR', -20, 0, 10).rot('armL', -20, 0, -10).rot('head', 26 + br * 3, 0, 8);
      P.face('eyes', 'closed').face('snot', 'on'); mouth(P, 'o'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.scl('snot', 0.45 + 0.55 * (br * 0.5 + 0.5));
      P.burst(0.4, 'z', 'head', [4, 25, 4], {}).burst(2.0, 'z', 'head', [4, 25, 4], {}).burst(1.2, AMFX.snow, 'quiff', TOP, { n: 1, speed: 0.2 });
    } },
    // the dance: a lazy Northern Soul shuffle — paws tucked behind its back, heel-toe slides side to
    // side, shoulders rolling, a slow head bob; then a spin, a dip and a point
    dance: { len: 2.8, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const b = beat(t, 0.32), live = 1 - seg(t, 1.95, 2.05), sd = b.n % 2 ? 1 : -1, sl = Math.sin((t / 0.64) * TAU) * live;
      P.rot('armR', 30 * live, 0, -10 * live).rot('armL', 30 * live, 0, 10 * live).rot('handR', 50 * live, 0, 0).rot('handL', 50 * live, 0, 0);
      P.pos('body', sl * 1.0, -0.4 * b.pulse * live, 0).rot('body', 0, sl * 12, -sl * 5); legs(P, -0.4 * b.pulse * live);
      P.pos('footR', sl * 1.2, 0, 0).pos('footL', sl * 1.2, 0, 0).pos('legR', sl * 1.0, 0, 0).pos('legL', sl * 1.0, 0, 0).rot(sd > 0 ? 'footL' : 'footR', -20 * b.pulse * live, 0, 0);
      P.rot('head', 8 * b.pulse * live, -sl * 8, sl * 6);
      const spin = seg(t, 2.0, 2.35, E.inout), dip = seg(t, 2.3, 2.45, E.back);
      P.rot('root', 0, 360 * spin, 0).rot('body', -12 * dip, 0, 10 * dip).rot('armR', -100 * dip, 0, -30 * dip).rot('armL', 0, 0, 60 * dip);
      P.face('eyes', t > 2.4 ? 'wink' : b.pulse > 0.6 ? 'sleepy' : 'smug'); mouth(P, t > 2.35 ? 'smirk' : 'flat');
      for (const k of [0, 2, 4]) P.burst(k * 0.32 + 0.02, AMFX.note, 'head', [k % 4 ? -6 : 6, 25, 2], {});
      P.burst(2.42, 'sparkle', 'head', [0, 26, 4], { n: 6 }).burst(2.42, AMFX.snow, 'quiff', TOP, { n: 6 });
    } },
    // signature: the comb — it fishes a comb out of its back pocket, slicks the quiff back in one long
    // stroke (the snow flies off), the quiff springs up shiny, it checks its reflection in the comb, a
    // slow approving nod, comb away… and one snowflake lands right back on top
    comb: { len: 3.8, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const fetch = env(t, 0.0, 0.7, 0.3, 0.2) * (t < 0.7 ? 1 : 0), up = env(t, 0.6, 2.0, 0.25, 0.25), stroke = seg(t, 0.85, 1.55, E.inout);
      const look = env(t, 1.95, 2.9, 0.2, 0.2), away = env(t, 2.9, 3.4, 0.15, 0.15);
      P.rot('armR', 40 * fetch, 0, -20 * fetch);                                                     // reach to the back pocket
      P.rot('armR', 30 * up - 70 * stroke * up, 0, -165 * up).scl('armR', 1, 1 + 0.4 * up, 1);     // up to the quiff, comb it back
      P.rot('head', -14 * stroke * up + 6 * up, -10 * up, 8 * up).scl('quiff', 1 + 0.12 * bump(t, 1.4, 1.9), 1 + 0.25 * bump(t, 1.4, 1.9), 1);
      P.rot('armR', -88 * look, 0, 26 * look).rot('handR', -30 * look, 0, 0).rot('head', 6 * look, 12 * look, 0);   // checks its reflection
      P.rot('armR', 40 * away, 0, -10 * away);
      P.face('comb', t > 0.45 && t < 3.15 ? 'on' : 'off').face('snow', t > 1.05 && t < 3.55 ? 'off' : 'on');
      P.face('eyes', up > 0.3 ? 'closed' : look > 0.3 ? 'smug' : t > 3.5 ? 'sleepy' : 'sleepy'); mouth(P, look > 0.3 || t > 3.2 ? 'smirk' : 'flat');
      P.burst(1.1, AMFX.snow, 'quiff', TOP, { n: 12, speed: 1.6, dir: [0, 0.6, -1] }).burst(1.6, 'sparkle', 'quiff', TOP, { n: 6 }).burst(2.3, AMFX.glint, 'handR', HANDP, { n: 2 }).burst(3.55, AMFX.snow, 'quiff', [0, 31, 3], { n: 1, speed: 0.1 });
    } },
    // fidget: dozes off — the head sinks, a snot bubble swells… POP — it jolts wide awake, then grumbles
    doze: { len: 3.0, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const sink = seg(t, 0.1, 1.5, E.inout) * (1 - seg(t, 1.6, 1.7, E.out)), jolt = bump(t, 1.6, 1.95);
      P.rot('head', 30 * sink - 14 * jolt, 0, 10 * sink).rot('body', 8 * sink, 0, 0).pos('root', 0, 1.6 * jolt, 0).sq('body', 0.08 * jolt).rot('armR', 0, 0, -50 * jolt).rot('armL', 0, 0, 50 * jolt);
      P.face('snot', t > 0.4 && t < 1.6 ? 'on' : 'off').scl('snot', 0.3 + 0.9 * seg(t, 0.4, 1.55));
      P.face('eyes', t < 1.6 ? (sink > 0.4 ? 'closed' : 'sleepy') : t < 2.0 ? 'shock' : t < 2.5 ? 'angry' : 'sleepy'); mouth(P, t < 1.6 ? 'o' : t < 2.0 ? 'o' : 'frown', t > 1.6 && t < 1.9 ? 0.4 : 0);
      P.burst(1.6, 'bubble', 'head', [-0.8, 17, 7.4], { n: 4 }).burst(1.62, 'sweat', 'head', [6, 22, 3], {}).burst(2.1, 'anger', 'head', [-6, 25, 2], {});
    } },
  },
};
// the ice mirrorball (tier 3) hovers and spins in every clip
for (const c of Object.values(anim.clips)) { const f = c.f; c.f = (P, t, cx) => { f(P, t, cx); P.rot('mirror', 0, (cx.time * 120) % 360, 0).pos('mirror', 0, Math.sin(cx.time * 2.2) * 0.8, 0); }; }
def.anim = anim;
