// Piledrilla — the snow monkey grown into a frost-white gorilla (an Arctic Monkeys homage, stage 2
// of Snoozaque). It knuckle-walks on GIANT ice knuckles: both forearms are encased in blocks of
// cracked blue ice studded with icicles. A broad dusky-pink gorilla face with heavy, deep-set,
// always-sleepy eyes, the slicked pompadour now towering like a sagittal crest, long sideburns, and
// the leather jacket again — its sleeves burst off when the arms grew, so it wears it as a vest with
// the collar up. Too cool to be awake; too heavy to argue with. Homage only — no logos, no album art.
import { E, seg, bump, wob, wave, bounce, hop } from '../anim.js';
import { eyeRig, eyesAt, eyesScale, glance, keepEyes } from './eyes.js';
import {
  FUR, A, B, L, both, twin, acc, region, goldP, chainP, beat, env, plant, rod, furP, bellyP, skinP, monkeyFace, quiffP, leatherP, iceP,
  lensP, goldWireP, hollowBodyP, fretboardP, headP, micP, chromeP, PILE_EYES, mouthPlanes, AMFX, arcticForm, AM_FX_MAP,
} from './arctic_parts.js';
import { cloth } from './story_parts.js';

const TAU = Math.PI * 2, F = FUR.pile, FOOTS = ['#5a4a58', '#7a6878', '#3a2e3a'];
// ---------------------------------------------------------------- painters
const fur = furP(F), furFringe = furP(F, { fringe: true }), chest = bellyP(F, { cy: 0.5, rx: 0.36, ry: 0.56 });
const dusk = skinP(A.dusk, A.duskHi, A.duskLo), foot = skinP(...FOOTS);
const muzzleP = (p, w, h, face) => {
  if (face === 'down') { p.rect(0, 0, w, h, A.mouth); return; }
  dusk(p, w, h, face);
  if (face === 'south') { const c = Math.floor(w / 2); p.rect(c - 5, 2, 3, 2, A.duskLo).rect(c + 2, 2, 3, 2, A.duskLo).rect(c - 4, 2, 2, 1, '#4a2a3a').rect(c + 2, 2, 2, 1, '#4a2a3a'); for (let y = 5; y < h - 2; y++) p.px(c, y, A.duskLo); }
};
const jawP = (p, w, h, face) => { if (face === 'up') { p.rect(0, 0, w, h, A.mouth); p.rect(1, 1, w - 2, h - 1, A.tongue); return; } dusk(p, w, h, face); };
const fangP = (p, w, h) => { p.rect(0, 0, w, h, A.fang); p.rect(0, h - 1, w, 1, '#d8d0c0'); };
const ice = iceP(), iceClean = iceP({ crack: false });
const sideburnP = quiffP({ slant: 0 });
const scarfP = cloth('#7a1a3a', { hi: '#b83a5a', lo: '#4a0a22', folds: 4 });

// ---------------------------------------------------------------- the model
const HEADBOX = [-5.4, 32.8, 10.8, 9.0];
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-2.2, 30.0, 12.24], line: PILE_EYES.line, pupilColor: PILE_EYES.pupilColor, iris: PILE_EYES.iris, irisDark: PILE_EYES.irisDark, accent: PILE_EYES.accent, map: PILE_EYES.map, extra: ['smug'] });
const MOUTH = mouthPlanes([0, 25.2, 14.24], 'flat');
const ICICLES = [-17.4, -15.0, -12.6, -10.2].map((x, i) => B([x, 6.6, 3.4], [1.8, 3.2 + (i % 2) * 0.8, 1.8], iceClean, { pivot: [x + 0.9, 6.8, 4.3], rot: [34, 0, (i - 1.5) * 8] }));
export const def = {
  name: 'piledrilla', ppu: 3, scale: 0.55, outline: { color: '#141220', px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...twin({ name: 'legR', parent: 'root', pivot: [-4.6, 9.6, -2.4], cubes: [B([-7.2, 2.4, -5.0], [5.2, 7.6, 5.4], fur)] }),
    ...twin({ name: 'footR', parent: 'root', pivot: [-4.6, 1.6, -2.0], cubes: [B([-7.4, 0, -4.4], [5.6, 2.2, 7.2], foot)] }),
    { name: 'body', parent: 'root', pivot: [0, 9, -2], cubes: [
      B([-7.2, 7.4, -7.6], [14.4, 7.6, 11], fur),
      B([-9.6, 13.6, -6.0], [19.2, 11.6, 14.0], fur, { faces: { south: chest } }),
      B([-10.8, 21.6, -5.4], [21.6, 6.0, 12.6], fur),
      B([-8.4, 26.4, -6.4], [16.8, 3.4, 9.0], furFringe),
      // the leather jacket worn as a vest (the sleeves burst off), open over the chest, collar popped
      B([-10, 13.8, -6.6], [20, 11.2, 0.6], leatherP({ seam: 0.5 })),
      ...both(B([-10.2, 13.8, -6.0], [0.6, 8.0, 13.6], leatherP())),
      B([-9.8, 13.8, 7.8], [4.6, 8.4, 1.2], leatherP({ zip: -1, lapel: 10, lapelX: -1 })), B([5.2, 13.8, 7.8], [4.6, 8.4, 1.2], leatherP({ zip: 0, lapel: 10 }), { mirror: true }),
      B([-7.6, 26.0, -7.4], [15.2, 4.2, 1.0], leatherP(), { pivot: [0, 26.2, -6.9], rot: [-18, 0, 0] }),
      ...both(B([-9.6, 25.4, -6.2], [1.0, 4.0, 7.0], leatherP(), { pivot: [-9.1, 25.6, -2.7], rot: [0, 0, 18] })),
      // tier 2 (or): a heavy gold chain with an ice pendant
      ...acc('acc-chain', [rod([-6.0, 23.0, 9.2], [-0.6, 18.4, 9.4], 1.0, 0.6, chainP), rod([6.0, 23.0, 9.2], [0.6, 18.4, 9.4], 1.0, 0.6, chainP), B([-1.2, 15.8, 9.0], [2.4, 2.6, 1.0], ice)]),
      // tier 1 (or): a silk neckerchief knotted at the throat
      ...acc('acc-scarf', [B([-5.4, 22.6, 2.4], [10.8, 1.8, 10.4], scarfP), B([-1.8, 19.4, 9.0], [3.6, 3.4, 0.8], scarfP, { pivot: [0, 22.6, 9.4], rot: [0, 0, 45] })]),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 25, 6], cubes: [
      B([-5.4, 23.8, 3.8], [10.8, 9.0, 8.4], fur, { faces: { south: monkeyFace(F, [A.dusk, A.duskHi, A.duskLo], HEADBOX, { lobes: [[-2.2, 30.0], [2.2, 30.0]], lobeR: 2.6, chinY: 26.4, chinRx: 4.4, chinRy: 3.4 }) } }),
      B([-3.4, 24.6, 12.0], [6.8, 3.6, 2.2], muzzleP),
      ...both(B([-2.4, 23.9, 13.2], [0.8, 1.0, 0.6], fangP)),
      ...both(B([-6.3, 29.0, 6.6], [1.0, 2.2, 2.0], dusk)),
      ...both(B([-5.9, 26.8, 8.4], [0.8, 4.6, 3.0], sideburnP)),
      ...MOUTH.cubes,
      // tier 1: gold aviators pushed up on the pompadour
      ...acc('acc-aviators', [B([-4.6, 32.6, 12.3], [3.8, 1.8, 0.4], lensP('#d88a3a')), B([0.8, 32.6, 12.3], [3.8, 1.8, 0.4], lensP('#d88a3a'), { mirror: true }), B([-0.8, 33.6, 12.4], [1.6, 0.4, 0.4], goldWireP), ...both(B([-5.6, 33.4, 4.4], [0.3, 0.4, 8.0], goldWireP))]),
    ] },
    ...EYES.bones,
    { name: 'jaw', parent: 'head', pivot: [0, 24.8, 12.4], cubes: [B([-3.0, 23.4, 11.8], [6.0, 1.4, 2.4], jawP)] },
    // the pompadour as a sagittal crest: a glossy cap stepping up to a tall forward curl
    { name: 'quiff', parent: 'head', pivot: [0, 33, 8], cubes: [
      B([-5.0, 32.4, 3.6], [10.0, 1.6, 8.6], quiffP({ band: 0.3 })),
      ...both(B([-5.8, 28.6, 3.6], [0.8, 4.6, 7.4], quiffP({ slant: 0 }))), B([-5.4, 28.8, 3.2], [10.8, 4.4, 0.8], quiffP({ slant: 0 })),
      B([-3.4, 33.8, 3.8], [6.8, 1.8, 3.0], quiffP()),
      B([-4.0, 33.8, 6.6], [8.0, 3.2, 3.0], quiffP()),
      B([-4.4, 33.8, 9.2], [8.8, 4.4, 3.0], quiffP({ band: 0.25 }), { pivot: [0, 33.8, 10.7], rot: [12, 0, 0] }),
      B([-4.0, 37.4, 10.4], [8.0, 2.0, 2.6], quiffP({ band: 0.5 }), { pivot: [0, 37.8, 11.7], rot: [28, 0, 0] }),
    ] },
    // the giant ice-knuckle arms: fur upper arms, ice-cased forearms and huge icicled fists
    ...twin({ name: 'armR', parent: 'body', pivot: [-10.8, 25.0, 1.0], cubes: [B([-16.2, 15.6, -2.2], [6.0, 10.4, 6.4], fur), B([-16.6, 15.0, -2.4], [6.8, 1.6, 6.8], furFringe)] }),
    ...twin({ name: 'foreR', parent: 'armR', pivot: [-13.2, 16.0, 1.0], cubes: [
      B([-17.0, 7.6, -2.8], [7.6, 9.0, 7.6], ice),
      B([-14.4, 12.6, -4.4], [1.6, 3.6, 1.6], iceClean, { pivot: [-13.6, 12.8, -3.6], rot: [-40, 0, 0] }), B([-16.4, 11.0, -3.8], [1.4, 3.0, 1.4], iceClean, { pivot: [-15.7, 11.2, -3.1], rot: [-30, 0, 20] }),
    ] }),
    ...twin({ name: 'fistR', parent: 'foreR', pivot: [-13.2, 7.6, 1.0], cubes: [
      B([-18.2, 0, -3.8], [10.0, 7.8, 9.6], ice), ...ICICLES,
      // tier 2 (or): gold knuckle-dusters set into the ice
      ...acc('acc-rings', [B([-18.0, 3.4, 5.7], [9.6, 2.2, 0.6], goldP), ...[-16.6, -14.0, -11.4].map((x) => B([x, 3.0, 6.1], [1.2, 1.2, 0.6], goldP))]),
    ] }),
    // tier 3: a chrome crooner's mic stand over its shoulder, or the black hollow-body on its back
    { name: 'mic', parent: 'body', pivot: [4, 26, -6.8], rot: [0, 0, 52], cubes: acc('acc-micstand', [
      B([3.5, 8.0, -7.4], [1.0, 24.0, 1.0], chromeP), B([2.6, 31.6, -7.9], [2.8, 3.2, 2.0], micP), B([1.6, 7.2, -8.4], [4.8, 0.8, 3.0], chromeP),
    ]) },
    { name: 'guitar', parent: 'body', pivot: [0, 18, -6.8], rot: [0, 0, -30], cubes: acc('acc-guitar', [
      B([-4.6, 10.2, -9.0], [9.2, 10.0, 2.2], hollowBodyP), B([-0.7, 20.2, -8.6], [1.4, 11.0, 1.2], fretboardP), B([-1.2, 31.2, -8.65], [2.4, 3.2, 1.0], headP),
    ]) },
  ],
  drip: [
    [{ id: 'acc-aviators', name: 'Pushed-up gold aviators' }, { id: 'acc-scarf', name: 'Silk neckerchief' }],
    [{ id: 'acc-chain', name: 'Heavy chain with ice pendant' }, { id: 'acc-rings', name: 'Gold knuckle-dusters' }],
    [{ id: 'acc-micstand', name: 'Chrome crooner mic stand' }, { id: 'acc-guitar', name: 'Black hollow-body guitar' }],
  ],
  attach: {
    head: { bone: 'quiff', at: [0, 38, 8], size: 11 },
    face: { bone: 'head', at: [0, 30, 12.4], size: 10 },
    neck: { bone: 'body', at: [0, 22.8, 8.6], size: 12 },
    back: { bone: 'body', at: [0, 20, -6.9], size: 14 },
  },
};
def.dripForm = { map: keepEyes(EYES, arcticForm(F, { '#7a1a3a': 'gold', '#b83a5a': 'gold', '#4a0a22': 'black' })), fx: AM_FX_MAP };

// ---------------------------------------------------------------- animation
const TOP = [0, 39, 10], MOUTHP = [0, 25, 15], LEG = 7.2, FIST = [-13.2, 3, 1], FISTL = [13.2, 3, 1];
const legs = (P, dy) => plant(P, ['legR', 'legL'], dy, LEG);
const mouth = (P, s, open = 0) => { P.face('mouth', open > 0.15 ? 'open' : s); P.rot('jaw', open * 50, 0, 0); return P; };
// both arms: x lift (− forward/up), z (+ swings the right arm in, mirrored for the left)
const arms = (P, x, z, xl = x, zl = z) => P.rot('armR', x, 0, z).rot('armL', xl, 0, -zl);
// keeps the fists on the ground while the body rises/sinks by dy (the arms stretch a touch)
const fistsDown = (P, dy) => P.pos('armR', 0, 0, 0).scl('armR', 1, 1 + dy / 20, 1).scl('armL', 1, 1 + dy / 20, 1);
function slumped(P, k) {
  P.rot('root', 0, 0, 82 * k).pos('root', 9 * k, 11 * k, 0).rot('armL', 0, 0, 40 * k).rot('armR', -30 * k, 0, 30 * k).rot('head', 0, 0, -14 * k).rot('legL', 0, 0, -30 * k);
}
export const anim = {
  start: 'idle', seed: 2013,
  breathe: { bone: 'body', amp: 0.02, per: 3.2 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.4], dur: 0.24 },
  look: { bone: 'head', yaw: 24, pitch: 10, speed: 3 },
  springs: [
    { bone: 'quiff', tip: [0, 4, 3], k: 220, d: 9, gain: 0.4, max: 8, axes: [1, 0.2, 1] },
    { bone: 'foreR', tip: [0, -8, 0], k: 240, d: 12, gain: 0.25, max: 6 },
    { bone: 'foreL', tip: [0, -8, 0], k: 240, d: 12, gain: 0.25, max: 6 },
  ],
  faces: { eyes: EYES.slot, mouth: MOUTH.slot },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'knuckles', 'doze'] },
  clips: {
    // resting its weight on its ice knuckles: a slow heavy breath, shoulders rolling, a sleepy head
    // that sinks and catches itself, a snort of frost now and then
    idle: { len: 3.2, loop: true, f(P, t, c) {
      const br = wave(t, 1 / 3.2), droop = bump(t, 1.4, 2.8) * (c.loopN % 2 ? 1 : 0.3);
      P.pos('body', 0, br * 0.3, 0).rot('body', 0, br * 3, br * 2).rot('head', 6 * droop + br * 2, br * 5, -br * 3); legs(P, br * 0.3); fistsDown(P, br * 0.3);
      arms(P, br * 2, 0);
      eyesAt(P, ...glance(t + c.loopN * 2.1, [[0, 0], [-0.3, 0], [-0.3, 0], [0.3, 0], [0, 0]], 0.8, 0.3));
      P.face('eyes', droop > 0.6 ? 'sleepy' : undefined); mouth(P, 'flat');
      if (c.loopN % 2 === 0) P.burst(2.9, AMFX.frost, 'head', [0, 27, 14.6], { n: 3, dir: [0, -0.3, 1], speed: 0.6 });
    } },
    // a knuckle-walk: right fist and left foot together, then the other pair, the body rolling
    walk: { len: 0.9, loop: true, f(P, t) {
      const ph = (t / 0.9) * TAU, s = Math.sin(ph), c2 = Math.cos(ph), a = Math.max(0, s), b = Math.max(0, -s), dy = Math.abs(c2) * 0.6;
      P.pos('body', 0, dy, 0).rot('body', 2, s * 6, -s * 4);
      P.rot('armR', -30 * a + 12 * b, 0, 0).pos('armR', 0, 1.6 * a, 0).rot('armL', -30 * b + 12 * a, 0, 0).pos('armL', 0, 1.6 * b, 0);
      P.pos('footL', 0, 1.4 * a, s * 2).pos('legL', 0, 1.0 * a, s * 1.6).pos('footR', 0, 1.4 * b, -s * 2).pos('legR', 0, 1.0 * b, -s * 1.6);
      P.rot('head', 2, -s * 5, 0).burst(0.02, 'dust', 'fistR', FIST, { n: 2 }).burst(0.47, 'dust', 'fistL', FISTL, { n: 2 });
    } },
    // battle cry: rears up and drums its chest with both ice fists, then a huge frosty roar
    cry: { len: 2.4, next: 'idle', f(P, t) {
      P.lookW = 1 - seg(t, 0.1, 0.3); P.blinkOK = false;
      const rear = seg(t, 0.05, 0.4, E.back) * (1 - seg(t, 1.9, 2.3, E.inout)), drum = t > 0.4 && t < 1.2, roar = seg(t, 1.2, 1.35, E.back) * (1 - seg(t, 1.9, 2.3, E.inout));
      P.rot('body', -26 * rear, 0, 0).pos('body', 0, 2.2 * rear, -1 * rear); legs(P, 2.2 * rear);
      const dl = drum ? Math.max(0, Math.sin(t * TAU * 5)) : 0, dr = drum ? Math.max(0, -Math.sin(t * TAU * 5)) : 0;
      P.rot('armR', -80 * rear - 20 * dl, 0, 50 * rear).rot('armL', -80 * rear - 20 * dr, 0, -50 * rear).rot('foreR', -70 * rear, 0, 0).rot('foreL', -70 * rear, 0, 0);
      P.rot('armR', 0, 0, -60 * roar).rot('armL', 0, 0, 60 * roar).rot('head', -18 * roar + wave(t, 9) * 3 * roar, 0, 0);
      P.face('eyes', rear > 0.3 && !roar ? 'angry' : roar > 0.3 ? (t < 1.45 ? 'wide' : 'angry') : 'sleepy'); mouth(P, 'flat', roar);
      if (drum) for (const k of [0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1.05]) P.burst(k, AMFX.frost, 'body', [0, 20, 10], { n: 2, speed: 0.8 });
      if (roar > 0.4 && t < 1.9) P.stream(AMFX.breath, 'head', MOUTHP, { rate: 80, dir: [0, 0.4, 1], spread: 0.25 });
      P.burst(1.25, AMFX.ring, 'head', MOUTHP, { scale: 1.2 }).burst(1.25, AMFX.snow, 'body', [0, 34, 0], { n: 14, speed: 1.6 });
    } },
    // physical: rears back and brings one giant ice fist down like a pile-driver
    attack: { len: 1.1, next: 'idle', f(P, t) {
      const up = seg(t, 0, 0.35, E.out) * (1 - seg(t, 0.38, 0.48, E.in)), hit = seg(t, 0.38, 0.48, E.in3) * (1 - seg(t, 0.62, 1.05, E.inout));
      P.rot('armR', -170 * up - 40 * hit, 0, 10 * up).rot('body', -12 * up + 14 * hit, -10 * up, 0).pos('root', 0, 0, 3 * hit).sq('body', wob(t, 0.48, -0.06, 4, 7));
      P.face('eyes', up > 0.3 ? 'angry' : hit > 0.3 ? 'angry' : 'sleepy'); mouth(P, 'flat', 0.5 * hit); P.blinkOK = false;
      P.burst(0.48, AMFX.ring, 'root', [-8, 1, 14], { scale: 1.2 }).burst(0.48, AMFX.shard, 'fistR', FIST, { n: 10 }).burst(0.49, 'dust', 'root', [-8, 0, 14], { n: 8 }).burst(0.5, 'star', 'fistR', FIST, { n: 4 });
    } },
    // special (cryo): both fists slammed into the ground send a line of ice shards and frost forward
    special: { len: 2.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const lift = seg(t, 0.05, 0.5, E.out) * (1 - seg(t, 0.55, 0.65, E.in)), slam = seg(t, 0.55, 0.65, E.in3) * (1 - seg(t, 1.4, 1.9, E.inout));
      arms(P, -150 * lift + 20 * slam, 10 * lift);
      P.pos('body', 0, 1.6 * lift - 1.4 * slam, 0).rot('body', -10 * lift + 12 * slam, 0, 0); legs(P, 1.6 * lift - 1.4 * slam);
      P.face('eyes', lift > 0.3 ? 'angry' : slam > 0.3 ? 'wide' : t > 1.6 ? 'smug' : 'sleepy'); mouth(P, 'flat', 0.6 * slam);
      for (let k = 0; k < 5; k++) P.burst(0.66 + k * 0.08, AMFX.shard, 'root', [0, 1, 12 + k * 6], { n: 6, dir: [0, 1, 0.2], speed: 1.2 }).burst(0.66 + k * 0.08, AMFX.frost, 'root', [0, 1, 12 + k * 6], { n: 3 });
      P.burst(0.65, AMFX.ring, 'root', [0, 1, 8], { scale: 2 }).burst(0.65, 'dust', 'root', [0, 0, 8], { n: 12, spread: 1 });
    } },
    hurt: { len: 0.8, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.25, 0.8, E.inout));
      P.pos('root', 0, 0, -2 * k).rot('body', -10 * k + wob(t, 0.25, 3, 3, 6), 0, wave(t, 14) * 3 * k).rot('head', -14 * k, 0, 0); arms(P, 10 * k, -16 * k);
      P.face('eyes', t < 0.45 ? 'x' : 'angry'); mouth(P, t < 0.45 ? 'o' : 'frown', 0.3 * k); P.blinkOK = false;
      P.burst(0.02, AMFX.shard, 'body', [0, 22, 10], { n: 8 }).burst(0.02, AMFX.snow, 'body', [0, 30, 0], { n: 8, speed: 1.2 }).burst(0.06, 'sweat', 'head', [7, 32, 8], {});
    } },
    // it nods off on its feet… and slumps over sideways onto its ice fist with a thud
    faint: { len: 2.6, next: 'down', f(P, t) {
      const drift = seg(t, 0, 1.0) * (1 - seg(t, 1.1, 1.2)), fall = seg(t, 1.1, 1.6, E.bounce);
      P.rot('head', 18 * drift, 0, wave(t, 1) * 8 * drift).rot('body', 0, 0, wave(t, 1, 1) * 4 * drift).pos('body', 0, -0.8 * drift, 0); legs(P, -0.8 * drift);
      slumped(P, fall); P.face('eyes', t < 1.1 ? 'closed' : 'swirl'); mouth(P, 'o'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.1, 'star', 'head', [0, 38, 8], { n: 5 }).burst(1.58, 'dust', 'root', [0, 0, 0], { n: 14, spread: 1 }).burst(1.58, AMFX.shard, 'root', [-10, 1, 0], { n: 8 });
    } },
    down: { len: 3.0, loop: true, f(P, t) {
      slumped(P, 1); P.face('eyes', 'swirl'); mouth(P, 'o'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.rot('fistL', 10 * bump(t, 0.8, 1.1), 0, 0).burst(1.6, AMFX.snow, 'body', [0, 30, 4], { n: 2, speed: 0.3 });
    } },
    // victory: a slow, deliberate chest drum, then it points an ice fist at you with a lazy smirk
    win: { len: 2.4, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const up = seg(t, 0.05, 0.35, E.back) * (1 - seg(t, 2.0, 2.35, E.inout)), drum = t > 0.35 && t < 1.25 ? Math.sin((t - 0.35) * TAU * 2.2) : 0, point = seg(t, 1.3, 1.5, E.back) * (1 - seg(t, 2.0, 2.35));
      P.rot('body', -14 * up, 0, 0).pos('body', 0, 1.4 * up, 0); legs(P, 1.4 * up);
      P.rot('armR', -80 * up - 16 * Math.max(0, drum) - 10 * point, 0, 50 * up * (1 - point)).rot('armL', -80 * up - 16 * Math.max(0, -drum), 0, -50 * up).rot('foreR', -60 * up * (1 - point), 0, 0).rot('foreL', -60 * up, 0, 0);
      P.rot('head', 6 * point, 0, -6 * point).face('eyes', t > 1.7 ? 'wink' : 'smug'); mouth(P, 'smirk');
      P.burst(0.6, AMFX.frost, 'body', [0, 20, 10], { n: 4 }).burst(1.0, AMFX.frost, 'body', [0, 20, 10], { n: 4 }).burst(1.5, AMFX.glint, 'fistR', FIST, { n: 4 }).burst(1.6, 'sparkle', 'head', [6, 34, 10], { n: 5 });
    } },
    // asleep: sat back on its haunches, ice fists folded in front, chin on its chest, frost snores
    sleep: { len: 3.8, loop: true, f(P, t) {
      const br = Math.sin((t / 3.8) * TAU);
      P.pos('body', 0, -3.0 + br * 0.3, 0).rot('body', -8, 0, 3); legs(P, -3.0);
      P.rot('footR', -20, -14, 0).rot('footL', -20, 14, 0).pos('footR', 0, 0, 2).pos('footL', 0, 0, 2);
      arms(P, -40, 30); P.rot('foreR', -30, 0, 0).rot('foreL', -30, 0, 0).rot('head', 24 + br * 3, 0, 6);
      P.face('eyes', 'closed'); mouth(P, 'o'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', [6, 36, 8], { scale: 1.4 }).burst(2.2, 'z', 'head', [6, 36, 8], { scale: 1.4 }).burst(1.9, AMFX.frost, 'head', [0, 26, 14], { n: 2, dir: [0, -0.2, 1], speed: 0.4 });
    } },
    // the dance: a slow, heavy, swaggering stomp — knuckle hits on every beat, a drag of the shoulders,
    // a lazy head nod; then two chest thumps, a lean back with arms wide and that half-lidded stare
    dance: { len: 3.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const b = beat(t, 0.45), live = 1 - seg(t, 1.75, 1.85), sd = b.n % 2 ? 1 : -1, lift = Math.sin(b.ph * Math.PI) * live;
      P.rot(sd > 0 ? 'armL' : 'armR', -30 * lift, 0, 0).pos(sd > 0 ? 'armL' : 'armR', 0, 1.4 * lift, 0);
      P.rot('body', 4 * b.pulse * live, sd * 8 * live, -sd * 5 * live).pos('body', 0, -0.6 * b.pulse * live, 0); legs(P, -0.6 * b.pulse * live);
      P.rot('head', 8 * b.pulse * live, -sd * 8 * live, 0).pos(sd > 0 ? 'footR' : 'footL', 0, 1.2 * lift, 0);
      const thump = t > 1.85 && t < 2.45 ? Math.max(0, Math.sin((t - 1.85) * TAU * 1.7)) : 0, chest = env(t, 1.8, 2.5, 0.1, 0.1), lean = seg(t, 2.45, 2.65, E.back);
      P.rot('armR', -80 * chest - 15 * thump, 0, 45 * chest).rot('armL', -80 * chest - 15 * thump, 0, -45 * chest).rot('foreR', -60 * chest, 0, 0).rot('foreL', -60 * chest, 0, 0);
      P.rot('body', -16 * lean, 0, 0).rot('armR', -50 * lean, 0, -40 * lean).rot('armL', -50 * lean, 0, 40 * lean).pos('body', 0, 1.2 * lean, 0);
      P.face('eyes', t > 2.6 ? 'smug' : b.pulse > 0.6 ? 'sleepy' : 'smug'); mouth(P, t > 2.5 ? 'smirk' : 'flat');
      for (let k = 0; k < 4; k++) P.burst(k * 0.45 + 0.02, 'dust', k % 2 ? 'fistL' : 'fistR', k % 2 ? FISTL : FIST, { n: 3 });
      for (const k of [0, 2]) P.burst(k * 0.45 + 0.05, AMFX.note, 'head', [k ? -8 : 8, 38, 6], { scale: 1.3 });
      P.burst(2.0, AMFX.frost, 'body', [0, 20, 10], { n: 4 }).burst(2.6, 'sparkle', 'head', [0, 38, 10], { n: 6 }).burst(2.6, AMFX.glint, 'body', [0, 26, 10], { n: 4 });
    } },
    // signature: the pile-driver — clinks its ice fists together, cracks its neck left and right,
    // rears up with both fists overhead and SLAMS them into the ground (shards, a ring of frost) …
    // then a gigantic yawn and a scratch of the pompadour
    knuckles: { len: 4.0, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const clink = env(t, 0.05, 0.75, 0.15, 0.15), knock = bump(t, 0.3, 0.42) + bump(t, 0.52, 0.64);
      P.rot('armR', -52 * clink, 0, (24 + 10 * knock) * clink).rot('armL', -52 * clink, 0, -(24 + 10 * knock) * clink);
      const crack = t > 0.8 && t < 1.4 ? Math.sin((t - 0.8) * TAU * 1.7) : 0;
      P.rot('head', 0, 0, 22 * crack);
      const up = seg(t, 1.4, 1.85, E.out) * (1 - seg(t, 1.9, 2.0, E.in)), slam = seg(t, 1.9, 2.0, E.in3) * (1 - seg(t, 2.3, 2.6, E.inout));
      arms(P, -165 * up + 15 * slam, 12 * up);
      P.pos('body', 0, 2.4 * up - 1.6 * slam, 0).rot('body', -16 * up + 14 * slam, 0, 0); legs(P, 2.4 * up - 1.6 * slam);
      const yawn = env(t, 2.7, 3.7, 0.25, 0.3), scratch = env(t, 3.0, 3.8, 0.2, 0.2);
      P.rot('armR', -160 * scratch + wave(t, 6) * 8 * scratch, 0, 20 * scratch).rot('head', -14 * yawn, 0, 0);
      P.face('eyes', t < 0.8 ? 'smug' : t < 1.4 ? 'closed' : up > 0.3 ? 'angry' : slam > 0.3 ? 'wide' : yawn > 0.3 ? 'closed' : 'sleepy'); mouth(P, slam > 0.3 ? 'frown' : 'flat', Math.max(0.5 * slam, yawn));
      P.burst(0.36, AMFX.frost, 'fistR', [-8, 8, 6], { n: 5 }).burst(0.58, AMFX.frost, 'fistR', [-8, 8, 6], { n: 5 }).burst(0.36, AMFX.shard, 'fistR', [-8, 8, 6], { n: 3 });
      P.burst(0.95, 'spark', 'head', [5, 26, 6], { scale: 0.6 }).burst(1.25, 'spark', 'head', [-5, 26, 6], { scale: 0.6 });
      P.burst(2.0, AMFX.ring, 'root', [0, 1, 6], { scale: 2.6 }).burst(2.0, AMFX.shard, 'root', [0, 1, 8], { n: 16, speed: 1.4 }).burst(2.0, 'dust', 'root', [0, 0, 6], { n: 14, spread: 1 }).burst(2.02, AMFX.snow, 'body', [0, 36, 0], { n: 16, speed: 1.6 });
      P.burst(3.1, AMFX.snow, 'quiff', TOP, { n: 4 });
    } },
    // fidget: dozes off standing — the head sinks lower and lower… a fist slips, it jolts awake, grumbles
    doze: { len: 3.0, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const sink = seg(t, 0.1, 1.5, E.inout) * (1 - seg(t, 1.55, 1.65, E.out)), slip = bump(t, 1.5, 1.9);
      P.rot('head', 26 * sink - 12 * slip, 0, 8 * sink).rot('body', 6 * sink, 0, -6 * slip).pos('armR', 0, -0.6 * slip, 2.4 * slip).pos('root', 0, 0.8 * slip, 0);
      P.face('eyes', t < 1.55 ? (sink > 0.4 ? 'closed' : 'sleepy') : t < 2.0 ? 'shock' : t < 2.5 ? 'angry' : 'sleepy'); mouth(P, t < 1.55 ? 'o' : t < 2.0 ? 'o' : 'frown', t > 1.55 && t < 1.9 ? 0.4 : 0);
      P.burst(1.55, 'sweat', 'head', [7, 32, 8], {}).burst(2.1, 'anger', 'head', [-7, 36, 6], {}).burst(1.58, 'dust', 'fistR', FIST, { n: 4 });
    } },
  },
};
def.anim = anim;
