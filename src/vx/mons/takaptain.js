// Takaptain — the Captain branch of Talonaka (a Masayoshi Takanaka homage). A tall, proud bald eagle in a crisp
// white double-breasted captain's uniform: two rows of gold buttons, gold epaulettes, navy cuffs with gold rings,
// white trousers, and the teal aloha shirt still open at the collar underneath — the guitarist never stops being
// on holiday. A white captain's hat with a black visor trimmed in gold leaves and an original wing-over-wave
// badge sits on its long dark mop. Its guitar is a ship's wheel: an octagonal teak body with a round spruce
// top and seven spoke handles, so it can steer the ship and play it. Signature fidget: "helm" — it spins the
// wheel-guitar, points the course and blows the ship's horn; dance: a sailor's hornpipe.
import { E, seg, bump, wob, wave, hop } from '../anim.js';
import { shade, ramp, shift } from './kit.js';
import { eyeRig, eyesAt, glance, keepEyes } from './eyes.js';
import { B, L, both, twin, acc, region, goldP, chainP, GOLD, strapP, plant, beat, env } from './story_parts.js';
import { TK, HAIR_FORM, brownP, headP, faceP, lockP, beakP, hookP, cereP, jawP, footP, toeP, primP, tailP, aloha, teakP, brassP, wheelTop, neckP, headstockP, sleeveP, vinylP, lensP, frameP, clothP, visorGoldP, braidP, badgeP, cuffP, TKFX, eagleForm, EYE_CAPTAIN } from './takanaka_parts.js';

const print = aloha({ base: TK.sea, seed: 7 });
// the jacket front: double-breasted, the lapels open on the aloha collar and chest feathers, gold buttons, navy belt
const jacketFront = (p, w, h, face, c) => {
  clothP(p, w, h, face, c);
  if (face !== 'south') return;
  const cx = w / 2, depth = h * 0.4, top = w * 0.24, inV = (x, y) => y < depth && Math.abs(x + 0.5 - cx) < top * (1 - y / depth);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!inV(x, y)) continue;
    const d = top * (1 - y / depth) - Math.abs(x + 0.5 - cx);
    p.px(x, y, d < 1 ? '#8a8e9a' : d < 3 ? ((x + y) % 4 === 0 ? TK.hib : TK.sea) : (x + y) % 5 === 0 ? TK.chestHi : TK.chest);
  }
  const by = Math.round(h * 0.78);
  for (let y = Math.ceil(depth) + 1; y < by - 2; y += 4) for (const dx of [-0.16, 0.16]) { const X = Math.round(cx + dx * w); p.rect(X - 1, y, 2, 2, GOLD[1]); p.px(X - 1, y, GOLD[0]); }
  for (let y = by; y < by + 3; y++) for (let x = 0; x < w; x++) p.px(x, y, y === by ? '#2e3a6a' : TK.navy);
  p.rect(Math.round(cx - 2), by, 4, 3, GOLD[1]); p.px(Math.round(cx - 1), by + 1, TK.navy);
};
const trouserP = (p, w, h, face) => { clothP(p, w, h, face); if (face === 'east' || face === 'west') for (let y = 0; y < h; y++) p.px(Math.floor(w / 2), y, GOLD[2]); };
const medalP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face !== 'south' ? GOLD[2] : y < h * 0.4 ? (x % 4 < 2 ? '#d8202a' : '#2a5ad8') : (x % 4 === 0 ? 0 : x % 4 === 3 ? GOLD[2] : GOLD[1])); };
const anchorP = (p, w, h, face) => {          // a gold anchor plaque (flush on the chest)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'south' ? 0 : GOLD[2]);
  if (face !== 'south') return;
  const cx = Math.floor(w / 2);
  for (let y = 1; y < h - 1; y++) { p.px(cx, y, GOLD[1]); p.px(cx - 1, y, GOLD[2]); }
  p.rect(cx - 3, 2, 6, 1, GOLD[1]); p.rect(cx - 1, 0, 2, 2, GOLD[0]);
  for (let x = -4; x <= 4; x++) { const y = h - 2 - Math.round(Math.sqrt(Math.max(0, 16 - x * x)) * 0.6); p.px(cx + x, y, GOLD[1]); p.px(cx + x, y + 1, GOLD[2]); }
  p.px(cx - 4, h - 4, GOLD[0]).px(cx + 4, h - 4, GOLD[0]);
};
const capeP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? '#2e3a6a' : ramp(['#2e3a6a', TK.navy, TK.navyLo], y / Math.max(1, h - 1), x, y)); if (face === 'north' || face === 'south') for (let y = 0; y < h; y++) { p.px(0, y, GOLD[1]); p.px(w - 1, y, GOLD[1]); } if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) p.px(x, h - 1, GOLD[1]); };
const spyP = (p, w, h, face) => { brassP(p, w, h, face); if (face !== 'up' && face !== 'down') for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x++) p.px(x, y, '#5a3a0a'); };

// ---------------------------------------------------------------- the model
const FOOT = [
  B([-5.6, 0, -1.2], [4.0, 1.2, 3.6], footP),
  B([-5.9, 0, 2.0], [1.3, 1.1, 2.8], toeP, { pivot: [-5.25, 0.5, 2.2], rot: [0, -14, 0] }),
  B([-4.25, 0, 2.2], [1.3, 1.2, 3.2], toeP),
  B([-2.7, 0, 2.0], [1.3, 1.1, 2.8], toeP, { pivot: [-2.05, 0.5, 2.2], rot: [0, 14, 0] }),
  B([-4.2, 0, -2.6], [1.2, 1.0, 1.6], footP),
];
const ARM = [
  B([-10.2, 15.6, -2.9], [3.2, 6.2, 6.0], clothP),
  B([-10.6, 21.4, -3.2], [4.0, 0.9, 6.6], goldP),
  B([-10.9, 19.8, -3.0], [0.5, 1.8, 6.2], braidP),
];
const HAND = [
  B([-10.0, 10.2, -2.5], [2.8, 6.0, 5.2], cuffP),
  B([-9.8, 7.4, -2.0], [2.2, 3.0, 1.5], primP), B([-9.8, 7.0, -0.35], [2.2, 3.4, 1.5], primP), B([-9.8, 7.4, 1.3], [2.2, 3.0, 1.5], primP),
];
const HAND_R = [-40, 0, 46], HAND_L = [-84, 0, 34], WHEEL = [-2.6, 13.4, 7.0];
const spoke = (a) => B([WHEEL[0] - 0.4, WHEEL[1] + 3.6, 6.6], [0.8, 2.6, 0.8], (p, w, h, f) => { teakP(p, w, h, f); if (f !== 'down') for (let y = 0; y < Math.ceil(h * 0.3); y++) for (let x = 0; x < w; x++) p.px(x, y, f === 'up' ? GOLD[1] : y === 0 ? GOLD[0] : GOLD[2]); }, { pivot: WHEEL, rot: [0, 0, a] });
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-3.5, 27.6, 5.64], line: '#1e1006', iris: '#ffd040', irisDark: '#b07a10', accent: '#fff0a0', pupilColor: '#140a06', extra: ['smug'], map: EYE_CAPTAIN });
const AVI = B([-6.0, 25.8, 5.82], [5.0, 3.6, 0.4], lensP);
const HAIR = { ...TK.hair, ragged: true };
export const def = {
  name: 'takaptain', ppu: 3, scale: 0.5, outline: { color: '#1a0e0c', px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...twin({ name: 'footR', parent: 'root', pivot: [-3.6, 1.2, 0.6], cubes: FOOT }),
    ...twin({ name: 'legR', parent: 'root', pivot: [-3.6, 8.6, 0.4], cubes: [B([-5.4, 1.2, -1.6], [3.6, 7.8, 3.6], trouserP)] }),
    { name: 'body', parent: 'root', pivot: [0, 8, 0], cubes: [
      B([-7.4, 8.0, -6.0], [14.8, 14.4, 12.0], clothP, { faces: { south: jacketFront } }),
      B([-7.9, 10.2, -5.2], [15.8, 9.6, 10.4], clothP),
      B([-6.4, 7.4, -5.2], [12.8, 0.6, 10.4], shade(TK.clothLo)),
      B([-5.8, 22.2, -5.0], [11.6, 0.8, 10.0], print),
      ...both(B([-4.6, 19.6, 6.0], [2.4, 2.4, 0.4], print, { pivot: [-3.4, 20.8, 6.2], rot: [0, 0, -24] })),
      B([-8.1, 7.4, -6.5], [16.2, 2.2, 13.0], clothP),
      B([-8.4, 13.8, 6.1], [16.6, 0.9, 0.3], strapP('#2a1a10'), { pivot: [0, 14.2, 6.25], rot: [0, 0, 36] }),
      // tier 1 (or): a rack of medals and a gold aiguillette looped from the right shoulder
      ...acc('acc-medals', [B([2.0, 17.4, 6.02], [3.6, 2.2, 0.3], medalP), B([-7.6, 15.0, 6.02], [5.4, 0.6, 0.3], braidP, { pivot: [-7.6, 15.3, 6.17], rot: [0, 0, -18] }), B([-7.6, 17.6, 6.02], [6.4, 0.6, 0.3], braidP, { pivot: [-7.6, 17.9, 6.17], rot: [0, 0, -30] })]),
      // tier 3 (or): a heavy gold anchor chain
      ...acc('acc-anchor', [...both(B([-5.0, 20.4, 6.0], [4.8, 0.8, 0.6], chainP, { pivot: [-5.0, 20.8, 6.3], rot: [0, 0, -34] })), B([-1.6, 13.2, 6.02], [3.2, 4.4, 0.4], anchorP)]),
      // tier 2 (or): the navy bridge-coat cape, trimmed in gold
      ...acc('acc-cape', [B([-8.0, 6.0, -6.8], [16.0, 16.6, 0.7], capeP), ...both(B([-8.4, 21.6, -6.0], [2.4, 1.2, 4.0], capeP))]),
      // tier 3 (or): a brass spyglass slung on the back
      ...acc('acc-spyglass', [B([-1.0, 8.0, -7.6], [2.0, 12.0, 2.0], spyP, { pivot: [0, 14, -6.6], rot: [0, 0, -38] }), B([-1.3, 19.6, -7.9], [2.6, 1.6, 2.6], brassP, { pivot: [0, 14, -6.6], rot: [0, 0, -38] })]),
    ] },
    // the album (tier 2, or): the sunset sleeve in a leather holder at the right hip, the vinyl peeking out
    { name: 'album', parent: 'body', pivot: [-8.2, 15.0, 0.4], cubes: acc('acc-album', [
      B([-8.5, 7.6, -3.0], [0.6, 7.0, 7.0], sleeveP, { faces: { west: (p, w, h) => sleeveP(p, w, h, 'south') } }),
      B([-8.2, 13.2, -2.4], [0, 5.0, 5.0], vinylP, { plane: 'x', outline: false }),
    ]) },
    { name: 'tail', parent: 'body', pivot: [0, 10, -6], cubes: [
      B([-3.0, 8.4, -10.6], [6.0, 1.4, 5.4], tailP, { pivot: [0, 9.1, -6.2], rot: [20, 0, 0] }),
      ...both(B([-5.0, 8.5, -9.8], [2.6, 1.2, 4.6], tailP, { pivot: [-2.6, 9.1, -6.2], rot: [18, -18, 0] })),
    ] },
    ...twin({ name: 'wingR', parent: 'body', pivot: [-7.6, 21.2, 0.4], rot: [-24, 0, 10], cubes: ARM }),
    { name: 'handR', parent: 'wingR', pivot: [-8.6, 16.0, 0.4], rot: HAND_R, cubes: HAND },
    { name: 'handL', parent: 'wingL', pivot: [8.6, 16.0, 0.4], rot: HAND_L, cubes: HAND.map(L) },
    // the ship's-wheel guitar: an octagonal teak body, a round spruce top, seven spoke handles, the neck rising left
    { name: 'helm', parent: 'body', pivot: WHEEL, rot: [0, 0, 26], cubes: [
      B([WHEEL[0] - 3.8, WHEEL[1] - 2.4, 6.2], [7.6, 4.8, 1.6], teakP),
      B([WHEEL[0] - 2.6, WHEEL[1] - 3.6, 6.2], [5.2, 7.2, 1.6], teakP),
      B([WHEEL[0] - 3.0, WHEEL[1] - 3.0, 7.82], [6.0, 6.0, 0], wheelTop, { plane: 'z' }),
      ...[0, 45, 90, 135, 180, 225, 315].map(spoke),
      B([WHEEL[0] - 0.7, WHEEL[1] - 0.7, 7.85], [1.4, 1.4, 0.4], brassP),
      B([WHEEL[0] + 3.8, WHEEL[1] - 0.5, 6.7], [9.4, 1.0, 0.8], neckP),
      B([WHEEL[0] + 13.2, WHEEL[1] - 0.8, 6.65], [2.6, 1.6, 0.9], headstockP),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 22.4, 0.3], cubes: [
      B([-6.2, 22.0, -5.4], [12.4, 10.6, 11.0], headP, { faces: { south: faceP } }),
      B([-6.8, 23.6, -4.6], [13.6, 6.6, 9.2], headP),
      B([-1.6, 25.2, 5.4], [3.2, 1.2, 1.0], cereP),
      B([-2.0, 23.0, 5.6], [4.0, 2.8, 2.0], beakP),
      B([-1.6, 22.9, 7.6], [3.2, 2.6, 1.6], beakP),
      B([-1.0, 21.2, 8.5], [2.0, 2.6, 1.3], hookP, { pivot: [0, 23.6, 9.0], rot: [32, 0, 0] }),
      // tier 1 (or): gold aviators
      ...acc('acc-aviators', [AVI, L(AVI), B([-1.2, 28.6, 5.86], [2.4, 0.5, 0.35], frameP), B([-7.1, 28.4, -3.6], [0.4, 0.5, 9.4], frameP), B([6.7, 28.4, -3.6], [0.4, 0.5, 9.4], frameP)]),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 23.2, 5.8], cubes: [B([-1.6, 22.1, 5.6], [3.2, 1.0, 2.6], jawP)] },
    ...EYES.bones,
    // the long mop under the hat: side locks to the jaw, a shaggy back, short bangs just under the visor
    { name: 'mop', parent: 'head', pivot: [0, 31.6, 0], cubes: [
      ...both(B([-7.4, 22.6, -5.0], [0.7, 9.4, 9.2], lockP(HAIR))),
      B([-6.4, 21.4, -6.1], [12.8, 10.6, 0.7], lockP(HAIR)),
      ...both(B([-7.8, 23.6, -4.0], [1.4, 4.4, 4.0], lockP(HAIR), { pivot: [-7.0, 27.0, -2.0], rot: [0, 0, 22] })),
      B([-6.0, 29.8, 5.6], [12.0, 1.6, 0.6], lockP(HAIR)),
    ] },
    // the captain's hat: black band, a wide white crown, a gold-leaf visor, the wing-over-wave badge
    { name: 'hat', parent: 'head', pivot: [0, 32.6, 0], cubes: [
      B([-6.5, 31.4, -5.7], [13.0, 1.8, 11.6], shade('#1a1a24', { top: '#2a2a38', bottom: '#0a0a10' })),
      B([-7.6, 33.2, -6.6], [15.2, 2.4, 13.6], clothP),
      B([-7.0, 35.6, -6.0], [14.0, 0.5, 12.4], clothP),
      B([-6.2, 31.2, 5.6], [12.4, 0.6, 3.6], visorGoldP, { pivot: [0, 31.5, 5.8], rot: [-14, 0, 0] }),
      B([-6.5, 32.4, 5.92], [13.0, 0.4, 0.3], braidP),
      B([-1.6, 33.4, 7.0], [3.2, 2.2, 0.3], badgeP),
    ] },
  ],
  drip: [
    [{ id: 'acc-aviators', name: 'Gold aviators' }, { id: 'acc-medals', name: 'Medals & aiguillette' }],
    [{ id: 'acc-album', name: 'The album (in a holder)' }, { id: 'acc-cape', name: 'Navy bridge-coat cape' }],
    [{ id: 'acc-anchor', name: 'Gold anchor chain' }, { id: 'acc-spyglass', name: 'Brass spyglass' }],
  ],
  attach: {
    head: { bone: 'hat', at: [0, 36, 0], size: 13 },
    face: { bone: 'head', at: [0, 27.6, 5.8], size: 12 },
    neck: { bone: 'body', at: [0, 21.6, 6.0], size: 11 },
    back: { bone: 'body', at: [0, 15, -6.2], size: 12 },
  },
};
// the form: an admiral in white and gold — navy turns to black lacquer, the mop gets gold streaks
const navy = new Set([TK.navy, TK.navyLo, '#2e3a6a']);
def.dripForm = { map: keepEyes(EYES, (c, glow) => (HAIR_FORM[c] || (navy.has(c) ? '#14121c' : eagleForm(c, glow)))) };

// ---------------------------------------------------------------- animation
const LEG = 7.4, LEGS = ['legR', 'legL'], MOUTH = [0, 22.6, 10.4], TOP = [0, 37, 0], NECK_END = [14, 18.6, 7.2];
function arms(P, shR, elR, shL = [0, 0, 0], elL = [0, 0, 0]) { P.rot('wingR', ...shR).rot('handR', ...elR).rot('wingL', ...shL).rot('handL', ...elL); }
// a slow roll like standing on a deck
const deck = (P, t, k = 1) => P.rot('root', 0, 0, wave(t, 1 / 3) * 2.2 * k).rot('body', wave(t, 1 / 3, 1.2) * 1.2 * k, 0, 0);
function salute(P, k) { arms(P, [-40 * k, 30 * k, -40 * k], [-100 * k, 40 * k, -20 * k]); P.rot('head', -4 * k, 0, 0); }
function fallBack(P, k) {
  P.rot('root', -82 * k, 0, 0).pos('root', 0, 7.0 * k, -2 * k);
  P.rot('legR', -50 * k, 0, 10 * k).rot('legL', -40 * k, 0, -10 * k).rot('footR', -40 * k).rot('footL', -30 * k);
  arms(P, [30 * k, 0, -50 * k], [30 * k, 0, -30 * k], [30 * k, 0, 50 * k], [30 * k, 0, 0]);
  P.rot('head', 16 * k, 0, 18 * k).rot('jaw', 24 * k).rot('hat', -30 * k, 0, 20 * k).pos('hat', 0, 1 * k, -3 * k);
}
export const anim = {
  start: 'idle', seed: 41,
  breathe: { bone: 'body', amp: 0.016, per: 2.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.2], dur: 0.12 },
  look: { bone: 'head', yaw: 30, pitch: 12, speed: 5 },
  springs: [
    { bone: 'mop', tip: [0, -4, -1], k: 180, d: 9, gain: 0.5, max: 8, axes: [1, 0.2, 1] },
    { bone: 'tail', tip: [0, 0, -5], k: 170, d: 8, gain: 0.7, max: 14 },
    { bone: 'album', tip: [0, -6, 0], k: 140, d: 7, gain: 0.8, max: 12, axes: [1, 0, 1] },
  ],
  faces: { eyes: EYES.slot },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'helm', 'salute'] },
  clips: {
    // the captain on deck: chest out, a slow roll with the sea, a pluck now and then, scanning the horizon
    idle: { len: 3.0, loop: true, f(P, t, c) {
      deck(P, t); const b = beat(t, 0.75), pl = b.n % 2 ? b.pulse : 0;
      P.rot('handR', -10 * pl, 0, 8 * pl).rot('head', -2 + 3 * b.pulse, 0, 0);
      eyesAt(P, ...glance(t + c.loopN * 1.7, [[0, 0], [-0.4, 0.05], [0, 0], [0.4, 0.05], [0, 0]], 0.6));
      if (c.loopN % 3 === 1) P.face('eyes', 'smug');
    } },
    walk: { len: 0.8, loop: true, f(P, t) {
      const ph = (t / 0.8) * Math.PI * 2, s = Math.sin(ph), c2 = Math.cos(ph), dy = Math.abs(c2) * 0.7, lr = Math.max(0, s), ll = Math.max(0, -s);
      P.pos('body', 0, dy, 0).rot('body', -2, s * 6, s * 3);
      P.pos('footR', 0, lr * 2.4, s * 3).rot('footR', -20 * lr, 0, 0).pos('footL', 0, ll * 2.4, -s * 3).rot('footL', -20 * ll, 0, 0);
      P.pos('legR', 0, lr * 1.6, s * 2).pos('legL', 0, ll * 1.6, -s * 2).rot('head', 2, -s * 5, 0);
    } },
    // signature: the helm — spins the wheel-guitar like a ship's wheel, points the course, blows the horn
    helm: { len: 3.6, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 1 - env(t, 0.1, 3.4);
      const grip = env(t, 0.1, 1.9, 0.25, 0.25), spin = seg(t, 0.4, 1.6, E.inout), point = env(t, 1.8, 2.6, 0.15, 0.2), horn = env(t, 2.5, 3.4, 0.1, 0.3);
      P.rot('helm', 0, 0, -720 * spin).rot('body', 0, -8 * grip, 0);
      arms(P, [-20 * grip, 0, 0], [-20 * grip + wave(t, 2.5) * 14 * grip, 0, 10 * grip], [-10 * grip, 0, 0], [wave(t, 2.5, 2) * 14 * grip, 0, 0]);
      arms(P, [-110 * point, 0, -30 * point], [-10 * point, 0, -40 * point]);
      P.rot('head', -6 * point - 14 * horn, -16 * point, 0).rot('jaw', 40 * horn).sq('body', 0.04 * horn);
      P.face('eyes', grip > 0.4 ? 'smug' : point > 0.4 ? 'angry' : horn > 0.3 ? 'closed' : t > 3.3 ? 'happy' : undefined);
      P.burst(1.6, 'sparkle', 'helm', WHEEL, { n: 6 });
      if (horn > 0.3) P.stream('steam', 'head', MOUTH, { rate: 30, dir: [0, 0.6, 1], speed: 1.2, spread: 0.3 });
      for (const r0 of [2.55, 2.75, 2.95]) P.burst(r0, 'ring', 'head', MOUTH, { scale: 1.4, tint: '#fff2c0' });
      P.burst(2.6, TKFX.wave, 'root', [0, 2, 10], { n: 8, speed: 1.2 });
    } },
    // a crisp salute, then a tip of the hat
    salute: { len: 2.4, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const s = env(t, 0.1, 1.3, 0.18, 0.2), tip = env(t, 1.4, 2.2, 0.2, 0.25);
      salute(P, s); P.rot('body', -3 * s, 0, 0).sq('body', 0.02 * s);
      arms(P, [0, 0, 0], [0, 0, 0], [-60 * tip, 0, 20 * tip], [-70 * tip, 0, 0]);
      P.rot('hat', -12 * tip, 0, 0).pos('hat', 0, 1.2 * tip, 0.6 * tip).rot('head', 6 * tip, 0, 0);
      P.face('eyes', s > 0.5 ? 'smug' : tip > 0.4 ? 'happy' : undefined);
      P.burst(0.3, 'sparkle', 'head', [-6, 32, 6], { n: 3 });
    } },
    // the dance: a sailor's hornpipe — wings folded, alternating heel-kicks, hops, then a wheel spin and a salute
    dance: { len: 3.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const b = beat(t, 0.3), live = 1 - seg(t, 2.3, 2.4), side = b.n % 2 ? 1 : -1, hopY = 1.4 * b.pulse * live;
      P.pos('root', 0, hopY, 0).rot('body', 0, side * 8 * live, side * 4 * live);
      const kick = side > 0 ? 'L' : 'R';
      P.rot('leg' + kick, -40 * b.pulse * live, 0, side * 10 * b.pulse * live).rot('foot' + kick, -30 * b.pulse * live).pos('foot' + kick, 0, 2 * b.pulse * live, 3 * b.pulse * live);
      // hauling the rope, hand over hand, high over the hat
      const up = 0.5 + 0.5 * Math.sin((t / 0.6) * Math.PI * 2), R = up * live, Lf = (1 - up) * live;
      arms(P, [-150 * R - 20 * Lf, 0, -12 * live], [-20 * R, 0, -30 * R], [-150 * Lf - 20 * R, 0, 12 * live], [30 * Lf, 0, -20 * Lf]);
      P.rot('head', 0, -side * 12 * live, side * 6 * live);
      const spin = seg(t, 2.35, 2.75, E.inout), fin = seg(t, 2.7, 2.85, E.back);
      P.rot('root', 0, 360 * spin, 0).rot('helm', 0, 0, -360 * spin); salute(P, fin);
      P.face('eyes', t > 2.75 ? 'smug' : b.pulse > 0.5 ? 'happy' : undefined);
      P.burst(0.05, 'note', 'head', [6, 37, 2], {}).burst(0.65, 'note', 'head', [-6, 37, 2], {}).burst(1.25, 'note', 'head', [6, 37, 2], {}).burst(1.85, 'note', 'head', [-6, 37, 2], {}).burst(2.75, 'sparkle', 'head', TOP, { n: 8 });
    } },
    // battle cry: hat brim up, wings wide, a ship's-horn screech
    cry: { len: 2.0, next: 'idle', f(P, t) {
      P.lookW = 1 - seg(t, 0.2, 0.3); P.blinkOK = false;
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.42, E.out)), up = seg(t, 0.34, 0.5, E.back) * (1 - seg(t, 1.5, 1.85, E.inout));
      const dy = -1.4 * crouch + 0.8 * up; P.pos('body', 0, dy, 0).sq('body', -0.1 * crouch + 0.05 * up); plant(P, LEGS, dy, LEG);
      P.rot('body', -8 * up, 0, 0).rot('head', 10 * crouch - 26 * up, 0, 0).rot('jaw', 42 * up);
      arms(P, [30 * up, 0, -80 * up], [10 * up, 0, -30 * up], [30 * up, 0, 80 * up], [10 * up, 0, -10 * up]);
      P.face('eyes', crouch > 0.3 || up > 0.3 ? 'angry' : undefined);
      for (const r0 of [0.5, 0.7, 0.9]) P.burst(r0, 'ring', 'head', MOUTH, { scale: 1.2, tint: '#fff0c0' });
      if (up > 0.3) P.stream('steam', 'head', [0, 36, 0], { rate: 16, spread: 0.6 });
    } },
    // physical: a backhand swing of the wheel-guitar
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const bk = seg(t, 0, 0.3, E.out) * (1 - seg(t, 0.3, 0.38, E.in)), hit = seg(t, 0.32, 0.44, E.in3) * (1 - seg(t, 0.56, 0.95, E.inout));
      P.pos('root', 0, 0, -1.4 * bk + 4.5 * hit).rot('body', -6 * bk + 10 * hit, 30 * bk - 36 * hit, 0).rot('head', 0, -16 * bk + 20 * hit, 0);
      P.rot('helm', 0, 40 * bk - 50 * hit, 30 * bk - 60 * hit).pos('helm', 0, 2 * hit, 3 * hit);
      arms(P, [40 * bk - 60 * hit, 0, -20 * bk], [-30 * bk, 0, 0], [-20 * hit, 0, 0]);
      P.face('eyes', bk > 0.2 || hit > 0.2 ? 'angry' : undefined); P.blinkOK = false;
      P.burst(0.44, 'spark', 'helm', WHEEL, { scale: 1.3 }).burst(0.44, 'star', 'helm', WHEEL, { n: 5 }).burst(0.45, 'splash', 'helm', WHEEL, { n: 10 });
    } },
    // special: "full speed ahead" — one big helm spin and a tidal wave of sound rolls out
    special: { len: 2.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const wind = env(t, 0, 0.6, 0.3, 0.1), go = seg(t, 0.6, 0.7, E.out) * (1 - seg(t, 1.5, 1.9, E.inout));
      P.rot('helm', 0, 0, -540 * seg(t, 0.1, 0.7, E.in)).rot('body', -6 * wind + 8 * go, 0, 0).pos('root', 0, 0, 2 * go);
      arms(P, [-110 * go, 0, -20 * go], [-10 * go, 0, -30 * go], [0, 0, 0], [0, 0, 0]);
      P.rot('head', -16 * go, 0, 0).rot('jaw', 36 * go).sq('body', -0.04 * wind + wob(t, 0.65, 0.05, 4, 6));
      P.face('eyes', wind > 0.3 ? 'smug' : go > 0.3 ? 'angry' : t > 1.7 ? 'happy' : undefined);
      P.burst(0.65, TKFX.wave, 'root', [0, 2, 8], { n: 14, speed: 2, spread: 0.6, dir: [0, 0.2, 1] }).burst(0.66, 'splash', 'root', [0, 2, 8], { n: 22, speed: 2.4, spread: 0.8 });
      for (const r0 of [0.65, 0.8, 0.95]) P.burst(r0, 'ring', 'root', [0, 2, 6], { scale: 2, tint: '#9af0ff' });
      if (go > 0.3) P.stream('steam', 'head', MOUTH, { rate: 24, dir: [0, 0.5, 1], speed: 1.4 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.2, 0.7, E.inout));
      P.pos('root', 0, 0, -2.2 * k).rot('body', -14 * k + wob(t, 0.2, 3, 3, 6), 0, wave(t, 14) * 3 * k).rot('head', -14 * k, 0, 0).rot('jaw', 26 * k).rot('hat', -10 * k, 0, 8 * k);
      arms(P, [30 * k, 0, -30 * k], [0, 0, 0], [30 * k, 0, 30 * k]);
      P.face('eyes', t < 0.45 ? 'x' : 'angry'); P.blinkOK = false;
      P.burst(0.02, 'feather', 'body', [0, 16, 0], { n: 6, speed: 1.4 }).burst(0.02, 'spark', 'body', [0, 16, 7], {});
    } },
    faint: { len: 2.3, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.95, 1.4, E.bounce);
      P.rot('body', 0, wave(t, 1.4) * 14 * dizzy, wave(t, 2) * 8 * dizzy).rot('head', 0, 0, wave(t, 2, 1) * 14 * dizzy).rot('jaw', 20 * dizzy);
      fallBack(P, fall);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.9, 'star', 'head', TOP, { n: 5 }).burst(1.38, 'dust', 'root', [0, 0, -10], { n: 12, spread: 1 }).burst(1.4, 'splash', 'root', [0, 1, 0], { n: 10 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      fallBack(P, 1); P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.rot('footR', -20 * bump(t, 0.6, 0.8)).burst(1.2, 'star', 'head', [0, 34, 8], { n: 2 });
    } },
    // victory: a hop, the wheel spun, then a salute with the hat at a jaunty tilt
    win: { len: 2.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const h = t < 0.8 ? hop(t, 0.8, 5, { crouch: 1.4 }) : { y: wob(t, 0.8, -1.0, 3, 6), sq: wob(t, 0.8, -0.12, 3, 6) };
      P.pos('root', 0, Math.max(0, h.y), 0).sq('body', h.sq); if (h.y < 0) plant(P, LEGS, h.y, LEG);
      P.rot('helm', 0, 0, -360 * seg(t, 0.1, 0.8, E.inout));
      const pose = seg(t, 0.85, 1.0, E.back); salute(P, pose); P.rot('hat', 0, 0, -8 * pose);
      P.face('eyes', pose > 0.5 ? 'smug' : 'happy');
      P.burst(0.8, 'ring', 'root', [0, 1, 0], {}).burst(0.95, 'sparkle', 'head', TOP, { n: 8 }).burst(1.0, TKFX.hibiscus, 'head', TOP, { n: 5 });
    } },
    // asleep standing at the helm: chin down, hat over the eyes, wings folded on the wheel
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * Math.PI * 2);
      deck(P, t, 0.6); P.pos('body', 0, -0.6 + br * 0.25, 0); plant(P, LEGS, -0.6 + br * 0.25, LEG);
      P.rot('head', 18 + br * 2, 0, 6).rot('hat', 10, 0, 0).pos('hat', 0, -0.6, 0.8).rot('jaw', 3 + Math.max(0, br) * 4);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'head', [5, 36, 4], {}).burst(1.9, 'z', 'head', [5, 36, 4], {});
    } },
  },
};
def.anim = anim;
