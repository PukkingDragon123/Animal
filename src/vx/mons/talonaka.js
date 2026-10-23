// Talonaka — the tropical guitar eaglet (a Masayoshi Takanaka homage; "taka" is Japanese for hawk). A chubby
// young bald eagle: white head with a shaggy feathered 70s mop and bangs, a hooked yellow beak, chocolate
// plumage, a white tail fan and big yellow talons. It wears a teal aloha shirt (hibiscus and palm fronds)
// open at the neck and plays a red sunburst double-cut guitar on a strap across its chest — city-pop on the
// beach, all day. Signature fidget: the solo (eyes shut, wing flying up the neck, a fan of notes, guitar
// to the sky); the breeze (a sea wind lifts the mop, a cool head-flick).
import { E, seg, bump, wob, wave, bounce, hop } from '../anim.js';
import { shade, ramp, shift } from './kit.js';
import { eyeRig, eyesAt, eyesScale, glance, keepEyes } from './eyes.js';
import { B, L, both, twin, acc, goldP, chainP, strapP, plant, beat, env } from './story_parts.js';
import { TK, brownP, chestP, headP, faceP, lockP, beakP, hookP, cereP, jawP, footP, toeP, pantsP, wingP, primP, tailP, aloha, shirtFront, burstP, guitarFace, neckP, headstockP, sleeveP, vinylP, lensP, frameP, leiP, clothP, visorP, braidP, TKFX, eagleForm, EYE_TALONAKA } from './takanaka_parts.js';

const print = aloha({ base: TK.sea, seed: 3 });
const front = shirtFront(print, { lo: TK.seaLo, depth: 0.6 });
const GTR = [-1.6, 8.6];
const HAND_R = [-30, 0, 40], HAND_L = [-80, 0, 35];                       // the guitar body's centre (model units, before the bone's tilt)
const burst = burstP(GTR, { r: 3.2 });
const surfP = (p, w, h, face) => {            // the surfboard pendant: white board, orange stripe
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, Math.abs(x - (w - 1) / 2) < 0.6 ? '#ff6a3a' : face === 'down' ? '#c8c0b0' : '#fffaf0');
};
const capeP = (p, w, h, face) => {            // a sunset cape: flat bands with palm silhouettes at the hem
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' || face === 'down' ? '#3a2a7a' : ramp(['#ffb02a', '#ff6a3a', '#e8306a', '#8a2a8a', '#3a2a7a'], y / Math.max(1, h - 1), x, y));
  if (face === 'north' || face === 'south') for (const px0 of [0.2, 0.7]) { const x0 = Math.round(w * px0); for (let y = Math.round(h * 0.55); y < h; y++) p.px(x0 + Math.round((h - y) * 0.08), y, '#1a0e18'); for (const dx of [-3, -2, 2, 3]) p.px(x0 + dx + 1, Math.round(h * 0.55) + Math.abs(dx) - 1, '#1a0e18'); p.px(x0 + 1, Math.round(h * 0.55) - 1, '#1a0e18'); }
};

// ---------------------------------------------------------------- the model
const FOOT = [
  B([-4.6, 0, -1.0], [3.2, 1.0, 3.0], footP),
  B([-4.8, 0, 1.6], [1.1, 0.9, 2.4], toeP, { pivot: [-4.25, 0.45, 1.8], rot: [0, -14, 0] }),
  B([-3.55, 0, 1.8], [1.1, 1.0, 2.8], toeP),
  B([-2.3, 0, 1.6], [1.1, 0.9, 2.4], toeP, { pivot: [-1.75, 0.45, 1.8], rot: [0, 14, 0] }),
  B([-3.5, 0, -2.2], [1.0, 0.8, 1.4], footP),
];
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-3.4, 20.1, 5.44], line: '#2a1408', iris: '#ffc23a', irisDark: '#c8701a', accent: '#ffe48a', pupilColor: '#1a0c08', extra: ['smug'], map: EYE_TALONAKA });
const HAND = [
  B([-8.3, 5.8, -2.0], [1.9, 4.4, 4.6], wingP),
  B([-8.2, 3.8, -1.7], [1.7, 2.2, 1.3], primP), B([-8.2, 3.4, -0.25], [1.7, 2.6, 1.3], primP), B([-8.2, 3.8, 1.2], [1.7, 2.2, 1.3], primP),
];
// the strumming wing folds in over the guitar body; the fretting wing folds up along the neck
const HANDS = [{ name: 'handR', parent: 'wingR', pivot: [-7.4, 10.0, 0.4], rot: HAND_R, cubes: HAND }, { name: 'handL', parent: 'wingL', pivot: [7.4, 10.0, 0.4], rot: HAND_L, cubes: HAND.map(L) }];
const LENS = B([-5.8, 18.2, 5.62], [4.8, 3.8, 0.4], lensP);
export const def = {
  name: 'talonaka', ppu: 3, scale: 0.46, outline: { color: '#1c0e0c', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...twin({ name: 'footR', parent: 'root', pivot: [-3.0, 1.0, 0.6], cubes: FOOT }),
    ...twin({ name: 'legR', parent: 'root', pivot: [-3.0, 5.6, 0.4], cubes: [B([-4.7, 1.2, -1.3], [3.4, 4.6, 3.2], pantsP)] }),
    { name: 'body', parent: 'root', pivot: [0, 5, 0], cubes: [
      B([-6, 4.8, -5], [12, 10.4, 10], brownP),
      B([-5.2, 4.2, -4.4], [10.4, 0.6, 8.8], shade(TK.brownLo)),
      // the aloha shirt, open at the neck, with a rounder band round the middle and a camp collar
      B([-6.4, 6.2, -5.4], [12.8, 9.4, 10.8], print, { faces: { south: front } }),
      B([-6.9, 7.4, -4.6], [13.8, 6.4, 9.2], print),
      B([-5.4, 15.0, -4.8], [10.8, 0.8, 9.8], print),
      ...both(B([-4.4, 12.4, 5.4], [3.0, 3.0, 0.5], print, { pivot: [-2.9, 13.9, 5.65], rot: [0, 0, -26] })),
      // the guitar strap, rising from the right hip to the left shoulder
      B([-7.0, 11.2, 5.5], [14.6, 0.8, 0.3], strapP('#5a2a14'), { pivot: [0, 11.6, 5.65], rot: [0, 0, 34] }),
      // dripped (or): a hibiscus lei round the collar
      ...acc('acc-lei', [B([-5.6, 14.2, 5.2], [11.2, 1.4, 1.2], leiP), B([-6.6, 14.2, -4.6], [1.2, 1.4, 9.8], leiP), B([5.4, 14.2, -4.6], [1.2, 1.4, 9.8], leiP), B([-5.6, 14.2, -5.8], [11.2, 1.4, 1.2], leiP)]),
      // ultra (or): a gold chain with a little surfboard pendant
      ...acc('acc-chain', [...both(B([-4.6, 13.0, 5.5], [4.2, 0.6, 0.5], chainP, { pivot: [-4.6, 13.3, 5.75], rot: [0, 0, -30] })), B([-0.6, 9.4, 5.62], [1.2, 2.6, 0.5], surfP), B([-0.3, 11.8, 5.6], [0.6, 0.6, 0.5], goldP)]),
      // ultra (or): the sunset cape
      ...acc('acc-cape', [B([-6.2, 4.4, -6.2], [12.4, 11.0, 0.6], capeP), ...both(B([-6.4, 14.4, -5.2], [1.6, 1.0, 2.0], goldP))]),
    ] },
    // the album (dripped, or): a sunset sleeve hanging at the right hip with the vinyl peeking out
    { name: 'album', parent: 'body', pivot: [-7.2, 11.0, 0.4], cubes: acc('acc-album', [
      B([-7.5, 4.6, -2.6], [0.6, 6.2, 6.2], sleeveP, { faces: { west: (p, w, h) => sleeveP(p, w, h, 'south') } }),
      B([-7.2, 9.6, -2.0], [0, 4.4, 4.4], vinylP, { plane: 'x', outline: false }),
      B([-7.25, 10.6, 0.2], [0.3, 1.6, 0.3], strapP('#5a2a14')),
    ]) },
    { name: 'tail', parent: 'body', pivot: [0, 7.4, -5.2], cubes: [
      B([-2.6, 5.8, -9.2], [5.2, 1.2, 4.6], tailP, { pivot: [0, 6.4, -5.4], rot: [26, 0, 0] }),
      ...both(B([-4.4, 5.9, -8.6], [2.4, 1.0, 4.0], tailP, { pivot: [-2.2, 6.4, -5.4], rot: [24, -18, 0] })),
    ] },
    // wings with an elbow: the sleeve and upper wing, then the forewing and its dark primaries
    ...twin({ name: 'wingR', parent: 'body', pivot: [-6.4, 14.2, 0.4], rot: [-36, 0, 14], cubes: [
      B([-8.8, 10.4, -2.6], [2.8, 4.6, 5.8], print),
      B([-8.4, 9.6, -2.1], [2.0, 1.2, 4.8], brownP),
    ] }),
    ...HANDS,
    { name: 'guitar', parent: 'body', pivot: [GTR[0], GTR[1], 6.2], rot: [0, 0, 24], cubes: [
      B([-4.4, 6.4, 5.6], [5.6, 4.4, 1.3], burst),
      B([-3.8, 10.8, 5.65], [4.0, 0.9, 1.2], burst),
      B([-3.6, 5.6, 5.65], [3.8, 0.8, 1.2], burst),
      B([1.2, 9.4, 5.65], [1.4, 1.6, 1.2], burst),
      B([1.2, 6.8, 5.65], [1.0, 1.3, 1.2], burst),
      B([-3.8, 7.0, 6.92], [4.4, 3.4, 0], guitarFace, { plane: 'z' }),
      B([1.2, 8.2, 5.9], [9.2, 0.9, 0.8], neckP),
      B([10.4, 7.9, 5.85], [2.4, 1.5, 0.9], headstockP),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 15.2, 0.3], cubes: [
      B([-6, 14.8, -5.2], [12, 10.4, 10.6], headP, { faces: { south: faceP } }),
      B([-6.6, 16.4, -4.4], [13.2, 6.6, 9.0], headP),
      // the hooked beak: a cere, then stepped bill sections narrowing to a hook that curls down
      B([-1.6, 17.6, 5.2], [3.2, 1.2, 1.0], cereP),
      B([-1.8, 15.6, 5.4], [3.6, 2.6, 1.8], beakP),
      B([-1.4, 15.5, 7.2], [2.8, 2.4, 1.4], beakP),
      B([-0.9, 14.0, 7.9], [1.8, 2.4, 1.2], hookP, { pivot: [0, 16.2, 8.4], rot: [30, 0, 0] }),
      // tier 1 (or): tear-drop shades with gold rims
      ...acc('acc-shades', [LENS, L(LENS), B([-1.0, 21.2, 5.66], [2.0, 0.5, 0.35], frameP), B([-6.9, 21.0, -3.6], [0.4, 0.5, 9.0], frameP), B([6.5, 21.0, -3.6], [0.4, 0.5, 9.0], frameP)]),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 15.8, 5.6], cubes: [B([-1.4, 14.7, 5.4], [2.8, 1.0, 2.4], jawP)] },
    ...EYES.bones,
    // the shaggy feathered mop: a thick top, middle-parted bangs flush on the brow, side and back locks
    { name: 'mop', parent: 'head', pivot: [0, 25, 0], cubes: [
      B([-6.5, 24.6, -5.8], [13, 1.8, 11.8], lockP(TK.hair)),
      // shaggy crown locks, each tilted its own way, and a flick out at the back
      B([-6.2, 25.6, -4.0], [4.0, 2.2, 9.2], lockP(TK.hair), { pivot: [-4.2, 25.8, 0.6], rot: [0, 0, 14] }),
      B([-2.0, 25.9, -4.8], [4.0, 2.4, 10.0], lockP(TK.hair), { pivot: [0, 26.0, 0.2], rot: [-6, 0, -3] }),
      B([2.2, 25.6, -4.0], [4.0, 2.2, 9.2], lockP(TK.hair), { pivot: [4.2, 25.8, 0.6], rot: [0, 0, -14] }),
      B([-5.4, 23.4, -7.6], [10.8, 2.4, 1.8], lockP({ ...TK.hair, ragged: true }), { pivot: [0, 25, -6.4], rot: [-28, 0, 0] }),
      B([-6.2, 22.4, 5.4], [6.0, 2.6, 0.6], lockP({ ...TK.hair, ragged: true }), { pivot: [-3.2, 24.6, 5.7], rot: [0, 0, 6] }),
      B([0.2, 22.4, 5.4], [6.0, 2.6, 0.6], lockP({ ...TK.hair, ragged: true }), { pivot: [3.2, 24.6, 5.7], rot: [0, 0, -6] }),
      ...both(B([-7.2, 16.6, -4.6], [0.6, 8.6, 9.0], lockP({ ...TK.hair, ragged: true }))),
      B([-6.2, 16.0, -5.8], [12.4, 9.0, 0.6], lockP({ ...TK.hair, ragged: true })),
      ...both(B([-7.6, 21.4, 1.0], [1.4, 3.6, 3.0], lockP({ ...TK.hair, ragged: true }), { pivot: [-6.8, 24.0, 2.5], rot: [0, 0, 26] })),
      // dripped (or): the white sailor cap with a navy band and a black visor
      ...acc('acc-cap', [B([-5.6, 26.4, -4.8], [11.2, 2.8, 9.8], clothP), B([-5.8, 26.2, -5.0], [11.6, 0.9, 10.2], shade(TK.navy, { top: '#3a4a8a', bottom: TK.navyLo })), B([-5.0, 25.9, 4.8], [10.0, 0.6, 2.8], visorP), B([-0.6, 26.9, 5.08], [1.2, 0.5, 0.2], braidP)]),
    ] },
  ],
  drip: [
    [{ id: 'acc-shades', name: 'Tear-drop shades' }, { id: 'acc-lei', name: 'Hibiscus lei' }],
    [{ id: 'acc-album', name: 'The album (sunset sleeve)' }, { id: 'acc-cap', name: 'White sailor cap' }],
    [{ id: 'acc-chain', name: 'Gold surfboard chain' }, { id: 'acc-cape', name: 'Sunset cape' }],
  ],
  attach: {
    head: { bone: 'mop', at: [0, 27.4, 0], size: 12 },
    face: { bone: 'head', at: [0, 20, 5.6], size: 12 },
    neck: { bone: 'body', at: [0, 14.6, 5.4], size: 10 },
    back: { bone: 'body', at: [0, 10, -5.6], size: 10 },
  },
};
// the form: eagleForm, with gold sheen streaks through the black mop
def.dripForm = { map: keepEyes(EYES, (c, glow) => (c === TK.hair.hi ? '#d8a83a' : c === TK.hair.c ? '#1c1418' : eagleForm(c, glow))) };

// ---------------------------------------------------------------- animation
const LEG = 4.6, LEGS = ['legR', 'legL'], MOUTH = [0, 15.6, 9.0], TOP = [0, 28, 0], NECK_END = [10.6, 8.6, 6.4];
// arms: offsets from the playing rest pose. shR / elR: right shoulder / elbow (the strumming wing), shL / elL: left
function arms(P, shR, elR, shL = [0, 0, 0], elL = [0, 0, 0]) {
  P.rot('wingR', ...shR).rot('handR', ...elR).rot('wingL', ...shL).rot('handL', ...elL);
}
const strum = (P, k) => P.rot('handR', -18 * k, 0, 12 * k);           // one downstroke
const fret = (P, k) => P.rot('handL', 0, 0, -10 * k).rot('wingL', 0, 0, 4 * k);  // slide the fretting wing
function fallBack(P, k) {
  P.rot('root', -82 * k, 0, 0).pos('root', 0, 5.6 * k, -1.6 * k);
  P.rot('legR', -50 * k, 0, 10 * k).rot('legL', -40 * k, 0, -10 * k).rot('footR', -40 * k).rot('footL', -30 * k);
  arms(P, [30 * k, 0, -40 * k], [20 * k, 0, -30 * k], [30 * k, 0, 40 * k], [20 * k, 0, 30 * k]);
  P.rot('head', 16 * k, 0, 18 * k).rot('jaw', 24 * k).rot('guitar', 0, 0, -20 * k);
}
export const anim = {
  start: 'idle', seed: 21,
  breathe: { bone: 'body', amp: 0.02, per: 2.2 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 4.8], dur: 0.12 },
  look: { bone: 'head', yaw: 28, pitch: 12, speed: 6 },
  springs: [
    { bone: 'mop', tip: [0, 2, 1], k: 190, d: 9, gain: 0.6, max: 10, axes: [1, 0.2, 1] },
    { bone: 'tail', tip: [0, 0, -4], k: 170, d: 8, gain: 0.8, max: 16 },
    { bone: 'album', tip: [0, -5, 0], k: 140, d: 7, gain: 0.8, max: 14, axes: [1, 0, 1] },
  ],
  faces: { eyes: EYES.slot },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'solo', 'breeze'] },
  clips: {
    // a city-pop groove: knees bouncing on the beat, a strum on every beat, the head nodding, eyes darting
    idle: { len: 2.0, loop: true, f(P, t, c) {
      const b = beat(t, 0.5), dy = -0.5 * b.pulse, side = b.n % 2 ? 1 : -1;
      P.pos('body', 0, dy, 0).rot('body', 0, side * 3, side * 2).sq('body', -0.03 * b.pulse); plant(P, LEGS, dy, LEG);
      P.rot('head', -3 + 6 * b.pulse, side * 5, -side * 3);
      strum(P, b.pulse); fret(P, b.n % 4 === 3 ? b.pulse : 0);
      P.rot('guitar', 0, 0, -2 * b.pulse);
      eyesAt(P, ...glance(t + c.loopN * 1.3, [[0, 0], [0.35, 0], [0, 0.05], [-0.35, 0]], 0.5));
      if (c.loopN % 3 === 2) P.face('eyes', 'smug');
    } },
    walk: { len: 0.6, loop: true, f(P, t) {
      const ph = (t / 0.6) * Math.PI * 2, s = Math.sin(ph), c2 = Math.cos(ph), dy = Math.abs(c2) * 0.8, lr = Math.max(0, s), ll = Math.max(0, -s);
      P.pos('body', 0, dy, 0).rot('body', 3, s * 7, s * 8).sq('body', -0.04 * (1 - Math.abs(c2)));
      P.pos('footR', 0, lr * 2.0, s * 2.2).rot('footR', -22 * lr, 0, 0).pos('footL', 0, ll * 2.0, -s * 2.2).rot('footL', -22 * ll, 0, 0);
      P.pos('legR', 0, lr * 1.4 + dy * 0.5, s * 1.2).pos('legL', 0, ll * 1.4 + dy * 0.5, -s * 1.2);
      P.rot('head', 3 - dy * 3, -s * 6, -s * 4); strum(P, Math.max(0, Math.sin(ph * 2)) * 0.5);
    } },
    // the signature solo: leans back, eyes shut, the fretting wing flies up the neck, notes stream; then the
    // guitar goes up to the sky and it lands a cool look
    solo: { len: 3.4, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 1 - env(t, 0.1, 3.2);
      const lean = env(t, 0.2, 2.5, 0.3, 0.3), fast = t > 0.5 && t < 2.2 ? Math.abs(Math.sin(t * Math.PI * 9)) : 0, run = seg(t, 0.5, 2.1, E.inout);
      P.rot('body', -12 * lean, 0, 6 * lean).rot('head', -18 * lean + wave(t, 4) * 4 * lean, 0, 10 * lean).rot('jaw', 14 * lean);
      strum(P, fast); P.rot('handL', 0, 0, -16 * Math.sin(run * Math.PI * 3)).rot('wingL', -6 * lean, 0, -8 * run * lean);
      const up = seg(t, 2.3, 2.6, E.back) * (1 - seg(t, 3.0, 3.35, E.inout));
      P.rot('guitar', 0, 0, 40 * up).pos('guitar', 0, 3 * up, 1 * up);
      arms(P, [-30 * up, 0, 10 * up], [0, 0, -20 * up], [-40 * up, 0, -30 * up], [0, 0, 0]);
      P.pos('body', 0, -1.0 * lean + 0.6 * up, 0); plant(P, LEGS, -1.0 * lean + 0.6 * up, LEG);
      P.face('eyes', t < 2.3 ? (lean > 0.3 ? 'closed' : undefined) : up > 0.3 ? 'happy' : t > 3.0 ? 'smug' : undefined);
      if (t > 0.6 && t < 2.2) P.stream('note', 'guitar', NECK_END, { rate: 6, spread: 0.6, speed: 0.6 });
      P.burst(2.4, 'sparkle', 'guitar', NECK_END, { n: 10 }).burst(2.4, 'ring', 'root', [0, 1, 0], { scale: 1.2 }).burst(2.45, TKFX.hibiscus, 'head', TOP, { n: 6, speed: 1.2 });
    } },
    // a sea breeze: the mop lifts, eyes close in the wind, then a slow head-flick and a smug look
    breeze: { len: 2.6, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const gust = env(t, 0.2, 1.5, 0.4, 0.3), flick = bump(t, 1.6, 2.0);
      P.rot('mop', -14 * gust + wave(t, 6) * 4 * gust, 0, 10 * gust).rot('head', 6 * gust - 10 * flick, -8 * gust, -6 * gust + 18 * flick);
      P.rot('tail', 0, 10 * gust, 0); arms(P, [0, 0, 0], [8 * gust, 0, 0]);
      P.face('eyes', gust > 0.4 ? 'closed' : t > 2.0 ? 'smug' : undefined);
      if (t > 0.2 && t < 1.4) P.stream(TKFX.hibiscus, 'root', [-14, 20, 4], { rate: 4, dir: [1, 0.2, 0], speed: 1.6, spread: 0.4 });
      P.burst(1.75, 'sparkle', 'mop', [5, 26, 3], { n: 4 });
    } },
    // the dance: a city-pop side-step with the guitar, a hip sway, a spin, the guitar up and a wink
    dance: { len: 2.6, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const b = beat(t, 0.3), live = 1 - seg(t, 1.9, 2.0), side = b.n % 2 ? 1 : -1, dy = -0.8 * b.pulse * live;
      P.pos('root', side * 0.8 * live, 0, 0).pos('body', 0, dy, 0).rot('body', 0, side * 10 * live, -side * 6 * b.pulse * live); plant(P, LEGS, dy, LEG);
      P.pos(side > 0 ? 'footL' : 'footR', 0, 1.2 * b.pulse * live, 0);
      P.rot('head', 8 * b.pulse * live, -side * 10 * live, side * 6 * live); strum(P, b.pulse * live); fret(P, (b.n % 2) * b.pulse * live);
      const spin = seg(t, 1.95, 2.3, E.inout), pose = seg(t, 2.25, 2.4, E.back);
      P.rot('root', 0, 360 * spin, 0).pos('root', 0, 2 * bump(t, 1.95, 2.3), 0);
      P.rot('guitar', 0, 0, 34 * pose).pos('guitar', 0, 2 * pose, 0); arms(P, [-20 * pose, 0, 0], [0, 0, 0], [-30 * pose, 0, -20 * pose]);
      P.face('eyes', t > 2.3 ? 'wink' : b.pulse > 0.5 ? 'happy' : undefined);
      P.burst(0.05, 'note', 'head', [5, 27, 2], {}).burst(0.65, 'note', 'head', [-5, 27, 2], {}).burst(1.25, 'note', 'head', [5, 27, 2], {}).burst(2.3, 'sparkle', 'head', TOP, { n: 8 }).burst(2.3, TKFX.hibiscus, 'head', TOP, { n: 5 });
    } },
    // battle cry: wings flung wide, head thrown back, a screech over a power chord
    cry: { len: 2.0, next: 'idle', f(P, t) {
      P.lookW = 1 - seg(t, 0.2, 0.3);
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.42, E.out)), up = seg(t, 0.34, 0.5, E.back) * (1 - seg(t, 1.5, 1.85, E.inout));
      const dy = -1.4 * crouch + 0.8 * up; P.pos('body', 0, dy, 0).sq('body', -0.12 * crouch + 0.06 * up); plant(P, LEGS, dy, LEG);
      P.rot('body', -8 * up, 0, 0).rot('head', 12 * crouch - 28 * up + wave(t, 12) * 3 * up, 0, 0).rot('jaw', 40 * up);
      arms(P, [30 * up, 0, -70 * up], [10 * up, 0, -20 * up], [30 * up, 0, 70 * up], [10 * up, 0, 20 * up]);
      P.face('eyes', crouch > 0.3 ? 'angry' : up > 0.3 ? 'angry' : undefined); P.blinkOK = false;
      for (const r0 of [0.5, 0.7, 0.9]) P.burst(r0, 'ring', 'head', MOUTH, { scale: 1.0, tint: '#ffe0a0' });
      P.burst(0.5, 'feather', 'body', [0, 12, 0], { n: 6, speed: 1.4 }).burst(0.52, 'note', 'guitar', [-1.6, 9, 7], { n: 3 });
    } },
    // physical: a lunging talon-and-beak strike
    attack: { len: 0.95, next: 'idle', f(P, t) {
      const bk = seg(t, 0, 0.26, E.out) * (1 - seg(t, 0.26, 0.36, E.in)), hit = seg(t, 0.28, 0.4, E.in3) * (1 - seg(t, 0.5, 0.9, E.inout));
      P.pos('root', 0, 0.8 * bk, -2 * bk + 5.5 * hit).rot('body', -10 * bk + 18 * hit, 0, 0).rot('head', -14 * bk + 22 * hit, 0, 0).rot('jaw', 24 * bk);
      P.sq('body', -0.07 * bk + wob(t, 0.42, 0.06, 4, 7)); arms(P, [20 * bk, 0, -40 * bk + 20 * hit], [0, 0, 0], [20 * bk, 0, 40 * bk - 20 * hit]);
      P.face('eyes', bk > 0.2 || hit > 0.2 ? 'angry' : undefined); P.blinkOK = false;
      P.burst(0.4, 'spark', 'head', [0, 16, 11], {}).burst(0.4, 'star', 'head', [0, 17, 11], { n: 4 }).burst(0.41, 'feather', 'body', [0, 10, 4], { n: 3 });
    } },
    // special: a sky-high power chord — the guitar swings up, one huge strum, a wave of sound and sea spray
    special: { len: 1.9, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const wind = seg(t, 0, 0.35, E.out) * (1 - seg(t, 0.45, 0.55)), hit = seg(t, 0.5, 0.6, E.out) * (1 - seg(t, 1.4, 1.8, E.inout));
      P.rot('guitar', 0, 0, 18 * wind - 6 * hit).rot('body', -8 * wind + 6 * hit, 0, 0);
      arms(P, [-50 * wind + 10 * hit, 0, 30 * wind], [-30 * wind - 30 * hit, 0, 30 * hit], [0, 0, 0], [0, 0, 0]);
      P.rot('head', -12 * wind + 8 * hit, 0, 0).rot('jaw', 30 * hit).sq('body', -0.05 * wind + wob(t, 0.55, 0.06, 4, 6));
      P.face('eyes', wind > 0.3 ? 'smug' : hit > 0.3 ? 'angry' : t > 1.6 ? 'happy' : undefined);
      for (const r0 of [0.55, 0.7, 0.85, 1.0]) P.burst(r0, 'ring', 'guitar', [-1.6, 8.6, 8], { scale: 1.4, tint: '#9af0ff' });
      P.burst(0.56, 'spark', 'guitar', [-1.6, 8.6, 8], { scale: 1.4 }).burst(0.56, TKFX.wave, 'root', [0, 2, 8], { n: 8, speed: 1.4, spread: 0.8 }).burst(0.58, 'splash', 'root', [0, 2, 6], { n: 16, speed: 1.6, spread: 1 });
      if (t > 0.55 && t < 1.2) P.stream('note', 'guitar', [-1.6, 9, 8], { rate: 10, dir: [0, 0.3, 1], speed: 1.2 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.2, 0.7, E.inout));
      P.pos('root', 0, 0, -2.4 * k).rot('body', -16 * k + wob(t, 0.2, 4, 3, 6), 0, wave(t, 16) * 4 * k).sq('body', -0.13 * k).rot('head', -14 * k, 0, 0).rot('jaw', 30 * k);
      arms(P, [30 * k, 0, -30 * k], [0, 0, 0], [30 * k, 0, 30 * k]);
      P.face('eyes', t < 0.45 ? 'x' : 'sad'); P.blinkOK = false;
      P.burst(0.02, 'feather', 'body', [0, 10, 0], { n: 7, speed: 1.4 }).burst(0.02, 'spark', 'body', [0, 10, 6], {});
    } },
    faint: { len: 2.3, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.95, 1.4, E.bounce);
      P.rot('body', 0, wave(t, 1.6) * 18 * dizzy, wave(t, 2.2) * 10 * dizzy).rot('head', 0, 0, wave(t, 2.2, 1) * 14 * dizzy).rot('jaw', 20 * dizzy);
      fallBack(P, fall);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.0, 'star', 'head', TOP, { n: 5 }).burst(1.38, 'dust', 'root', [0, 0, -6], { n: 10 }).burst(1.4, 'note', 'guitar', [-1.6, 9, 8], { n: 2 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      fallBack(P, 1); P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.rot('footR', -20 * bump(t, 0.6, 0.8)).burst(1.2, 'star', 'head', [0, 26, 6], { n: 2 });
    } },
    // victory: a spinning hop, then the guitar raised overhead and a wink
    win: { len: 2.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const h = t < 0.9 ? hop(t, 0.9, 6, { crouch: 1.4 }) : { y: wob(t, 0.9, -1.0, 3, 6), sq: wob(t, 0.9, -0.14, 3, 6) };
      P.pos('root', 0, Math.max(0, h.y), 0).sq('body', h.sq).rot('root', 0, 360 * seg(t, 0.2, 0.62, E.inout), 0); if (h.y < 0) plant(P, LEGS, h.y, LEG);
      const pose = seg(t, 0.95, 1.12, E.back);
      P.rot('guitar', 0, 0, 50 * pose).pos('guitar', 0, 4 * pose, 1 * pose); arms(P, [-40 * pose, 0, 20 * pose], [0, 0, -10 * pose], [-60 * pose, 0, -30 * pose]);
      P.rot('head', -10 * pose, 0, -8 * pose).rot('jaw', 20 * pose);
      P.face('eyes', pose > 0.5 ? 'wink' : 'happy');
      P.burst(0.9, 'ring', 'root', [0, 1, 0], {}).burst(1.0, 'sparkle', 'head', TOP, { n: 8 }).burst(1.0, TKFX.hibiscus, 'head', TOP, { n: 6 }).burst(1.1, 'note', 'guitar', NECK_END, { n: 3 });
    } },
    // asleep sitting on its tail, hugging the guitar, head tucked, a lazy snore
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * Math.PI * 2);
      P.pos('body', 0, -1.4 + br * 0.25, 0).sq('body', -0.05 + br * 0.03); plant(P, LEGS, -1.4 + br * 0.25, LEG);
      P.rot('head', 22 + br * 3, 0, 10).rot('mop', 6, 0, 4).rot('jaw', 4 + Math.max(0, br) * 4);
      arms(P, [6, 0, 6], [10, 0, 10], [6, 0, -6], [10, 0, -10]); P.rot('guitar', 0, 0, -10);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', [4, 26, 4], {}).burst(1.6, 'z', 'head', [4, 26, 4], {});
    } },
  },
};
def.anim = anim;
