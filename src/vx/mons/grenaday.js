// Grenaday — a living pineapple hand grenade with a punk attitude (a Green Day homage, stage 1 of
// the line that goes nuclear as Armagreddon). Its whole olive body is its face: big green eyes
// rimmed in smudged guyliner, a crooked sneer with one fang, a spiky crop of dyed electric-green
// hair bursting out of its fuze, the safety lever down its side and a heart-shaped pin ring
// dangling like an earring. Stubby rubber-hose arms, fingerless gloves, black canvas high-tops.
// It pulls its own pin when it is bored… and always regrets it. Homage only — no logos.
import { E, seg, bump, wob, wave, bounce, hop } from '../anim.js';
import { eyeRig, eyesAt, glance, keepEyes } from './eyes.js';
import {
  G, B, L, both, twin, acc, rod, beat, env, plant, silverP, grenP, grenFaceP, metalP, spoonP, heartRingP, spikeP, bangsP, canvasP, soleP, toeCapP, collarP,
  limbP, gloveP, checkerP, studP, redP, tieP, collarPlaneP, badgeP, guitarBodyP, neckP, headstockP, hornP, grilleP, GUYLINER, mouthPlanes, GDFX, gdForm, GD_FX_MAP,
} from './greenday_parts.js';

const TAU = Math.PI * 2;
// ---------------------------------------------------------------- the model
const SHOE = [
  B([-4.5, 0, -1.9], [3.4, 0.7, 5.4], soleP),
  B([-4.3, 0.7, -1.7], [3.0, 1.6, 4.4], canvasP),
  B([-4.4, 0.5, 2.5], [3.2, 1.3, 1.1], toeCapP),
  B([-4.1, 2.0, -1.5], [2.6, 1.5, 2.6], collarP),
];
// a spike of hair: three tapering pieces sharing one pivot and tilt, rooted at (x, y, z)
const spike = (x, y, z, len, rx, rz, s = 1.9) => {
  const pv = { pivot: [x, y + 0.2, z], rot: [rx, 0, rz] };
  return [
    B([x - s / 2, y - 0.2, z - s / 2], [s, len * 0.46, s], spikeP(0), pv),
    B([x - s * 0.33, y - 0.2 + len * 0.44, z - s * 0.33], [s * 0.66, len * 0.34, s * 0.66], spikeP(1), pv),
    B([x - s * 0.17, y - 0.2 + len * 0.76, z - s * 0.17], [s * 0.34, len * 0.26, s * 0.34], spikeP(2), pv),
  ];
};
const EYES = eyeRig({ style: 'pix', chunk: 1, parent: 'body', at: [-2.9, 11.9, 6.84], line: GUYLINER.line, pupilColor: GUYLINER.pupilColor, iris: GUYLINER.iris, irisDark: GUYLINER.irisDark, accent: GUYLINER.accent, map: GUYLINER.map, extra: ['smug'] });
const MOUTH = mouthPlanes([0, 7.8, 6.85], 'smirk');
const FIST = B([-9.1, 6.4, -1.0], [3.0, 2.6, 2.8], gloveP);
const BAND = B([-9.25, 8.2, -1.15], [3.3, 1.0, 3.1], checkerP);
const BELT = [B([-6.4, 4.8, 6.2], [12.8, 1.2, 0.4], studP), B([-6.4, 4.8, -6.6], [12.8, 1.2, 0.4], studP), ...both(B([-6.6, 4.8, -6.4], [0.4, 1.2, 12.8], studP)), B([-1.2, 4.6, 6.4], [2.4, 1.6, 0.4], silverP)];
export const def = {
  name: 'grenaday', ppu: 3, scale: 0.36, outline: { color: '#0e0c0a', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...twin({ name: 'legR', parent: 'root', pivot: [-2.8, 4.0, 0.2], cubes: [B([-3.9, 1.6, -0.9], [2.2, 2.8, 2.2], limbP)] }),
    ...twin({ name: 'footR', parent: 'root', pivot: [-2.8, 1.4, 0.2], cubes: SHOE }),
    { name: 'body', parent: 'root', pivot: [0, 3.2, 0], cubes: [
      // a stepped pineapple egg: five tiers of segmented steel, the widest one carrying the face
      B([-5.2, 15.8, -5.2], [10.4, 1.8, 10.4], grenP({ oy: 0 })),
      B([-6.2, 14.2, -6.2], [12.4, 1.7, 12.4], grenP({ oy: 0, ch: 6 })),
      B([-6.8, 6.0, -6.8], [13.6, 8.3, 13.6], grenP({ oy: 1 }), { faces: { south: grenFaceP({ oy: 1 }) } }),
      B([-6.2, 4.2, -6.2], [12.4, 1.9, 12.4], grenP({ oy: 0, ch: 6 })),
      B([-5.0, 3.0, -5.0], [10.0, 1.3, 10.0], grenP({ oy: 0 })),
      B([-3.6, 2.4, -3.6], [7.2, 0.8, 7.2], metalP),
      ...MOUTH.cubes,
      // tier 1 (or): punk badges and safety pins
      ...acc('acc-pins', [
        B([-4.6, 4.6, 6.1], [1.8, 1.8, 0.35], badgeP(G.red, 'heart')), B([2.8, 14.0, 6.1], [1.5, 1.5, 0.35], badgeP(G.white, 'dot')), B([-6.9, 9.0, 3.0], [0.35, 1.4, 1.4], badgeP(G.black, 'x'), { faces: { west: badgeP(G.black, 'x') } }),
        B([1.4, 5.2, 6.15], [2.8, 0.4, 0.3], silverP), B([3.8, 4.9, 6.15], [0.6, 1.0, 0.3], silverP), B([-4.6, 14.4, -6.5], [2.6, 0.4, 0.3], silverP),
      ]),
      // tier 2 (or): a studded belt round its bottom
      ...acc('acc-belt', BELT),
    ] },
    // tier 2: the skinny red tie under its grin (on a spring)
    { name: 'tie', parent: 'body', pivot: [0, 6.2, 6.6], cubes: acc('acc-tie', [
      B([-2.2, 5.0, 6.24], [4.4, 1.4, 0], collarPlaneP, { plane: 'z' }), B([-0.8, 4.9, 6.2], [1.6, 1.3, 0.7], redP), B([-0.75, 1.6, 6.3], [1.5, 3.5, 0.4], tieP),
    ]) },
    // the fuze: collar, head and striker; the safety lever (spoon) down its right side
    { name: 'fuze', parent: 'body', pivot: [0, 17.8, 0], cubes: [
      B([-2.5, 17.6, -2.5], [5, 2.0, 5], metalP), B([-2.0, 19.6, -2.2], [4, 3.4, 4.4], metalP), B([-2.8, 20.4, -0.9], [0.8, 1.8, 1.8], metalP),
    ] },
    { name: 'spoon', parent: 'fuze', pivot: [-2.8, 22.2, 0], cubes: [
      B([-3.3, 20.2, -0.7], [0.6, 2.8, 1.4], spoonP),
      rod([-3.0, 20.6, 0], [-6.5, 18.0, 0], 1.4, 0.5, spoonP, { sideV: [0, 0, 1] }),
      rod([-6.5, 18.1, 0], [-7.3, 13.6, 0], 1.4, 0.5, spoonP, { sideV: [0, 0, 1] }),
    ] },
    { name: 'pin', parent: 'fuze', pivot: [2.0, 21.6, 0], cubes: [B([1.8, 21.3, -0.3], [3.4, 0.6, 0.6], metalP)] },
    { name: 'ring', parent: 'pin', pivot: [5.0, 21.6, 0], rot: [0, 28, 0], cubes: [B([3.0, 18.0, 0], [4.0, 3.67, 0], heartRingP, { plane: 'z' })] },
    // the dyed punk crop: a crown of spikes out of the fuze, one spike flopping forward
    // the dyed punk crop: jagged bangs over its brow, spikes gelled up and swept to one side, a few at the back
    { name: 'hair', parent: 'body', pivot: [0, 17.6, 2.4], cubes: [
      B([-5.4, 17.2, 1.4], [10.8, 1.0, 4.2], spikeP(0)),
      B([-5.6, 14.4, 5.2], [11.2, 3.8, 1.1], bangsP),
      ...both(B([-6.0, 15.0, 1.6], [0.8, 2.8, 4.0], bangsP)),
      ...spike(-3.8, 18.0, 4.0, 4.6, 34, -14), ...spike(-1.6, 18.0, 4.2, 5.2, 38, -18, 2.1), ...spike(0.8, 18.0, 4.0, 5.4, 34, -22, 2.1), ...spike(3.2, 18.0, 3.8, 4.8, 28, -30),
      ...spike(-2.8, 18.0, 2.4, 4.8, 20, -10), ...spike(0, 18.0, 2.4, 5.6, 22, -16, 2.2), ...spike(2.8, 18.0, 2.2, 4.8, 16, -26),
      ...spike(-2.4, 17.4, -3.6, 3.4, -50, 10, 1.6), ...spike(2.4, 17.4, -3.6, 3.2, -48, -16, 1.6),
    ] },
    { name: 'hairF', parent: 'hair', pivot: [0, 18.0, 5.0], cubes: [...spike(-0.4, 18.2, 5.0, 5.0, 64, -10, 2.0), ...spike(2.0, 18.2, 4.8, 4.0, 54, -34, 1.6)] },
    ...EYES.bones,
    // rubber-hose arms with fingerless gloves (and checker sweatbands, tier 1)
    ...twin({ name: 'armR', parent: 'body', pivot: [-6.9, 11.2, 0.4], cubes: [B([-8.7, 8.6, -0.7], [2.2, 3.2, 2.2], limbP)] }),
    ...twin({ name: 'handR', parent: 'armR', pivot: [-7.6, 8.6, 0.4], cubes: [FIST, ...acc('acc-bands', [BAND])] }),
    // tier 3: the sticker-bombed blue guitar on its back, or a riot bullhorn at its hip
    { name: 'guitar', parent: 'body', pivot: [0, 10, -6.8], rot: [0, 0, -38], cubes: acc('acc-guitar', [
      B([-3.0, 4.2, -8.0], [6.0, 6.4, 1.1], guitarBodyP), B([-3.0, 10.6, -7.95], [1.4, 1.6, 1.0], guitarBodyP), B([1.4, 10.6, -7.95], [1.2, 2.2, 1.0], guitarBodyP),
      B([-0.5, 10.6, -7.9], [1.0, 8.4, 0.7], neckP), B([-0.8, 19.0, -7.92], [1.7, 2.6, 0.6], headstockP),
    ]) },
    { name: 'horn', parent: 'body', pivot: [8.0, 7.6, 0.4], rot: [12, 0, 0], cubes: acc('acc-horn', [
      B([7.4, 3.9, -1.6], [1.2, 1.2, 1.6], hornP), B([7.2, 3.7, 0.0], [1.6, 1.6, 1.4], hornP), B([6.9, 3.4, 1.4], [2.2, 2.2, 1.2], hornP), B([6.8, 3.3, 2.6], [2.4, 2.4, 0.3], grilleP),
      B([7.6, 2.4, -0.8], [0.8, 1.5, 0.8], redP), rod([8.0, 5.3, -0.6], [6.6, 16.6, 0.2], 0.6, 0.3, studP),
    ]) },
  ],
  drip: [
    [{ id: 'acc-bands', name: 'Checkerboard sweatbands' }, { id: 'acc-pins', name: 'Punk badges & safety pins' }],
    [{ id: 'acc-tie', name: 'Skinny red tie' }, { id: 'acc-belt', name: 'Studded belt' }],
    [{ id: 'acc-guitar', name: 'Sticker-bombed blue guitar' }, { id: 'acc-horn', name: 'Riot bullhorn' }],
  ],
  attach: {
    head: { bone: 'hair', at: [0, 24.5, 1.5], size: 8 },
    face: { bone: 'body', at: [0, 11.4, 7.0], size: 11 },
    neck: { bone: 'body', at: [0, 5.6, 6.4], size: 9 },
    back: { bone: 'body', at: [0, 10, -7.0], size: 9 },
  },
};
// the luxury form: a gold grenade with black-lacquered grooves, black hair with gold tips, blue sparks
def.dripForm = { map: keepEyes(EYES, gdForm), fx: GD_FX_MAP };

// ---------------------------------------------------------------- animation
const TOP = [0, 23.4, 0], MOUTHP = [0, 7.8, 7.4], RING = [5.0, 18.6, 0], LEG = 2.4;
const legs = (P, dy) => plant(P, ['legR', 'legL'], dy, LEG);
const lift = (P, dy) => { for (const b of ['legR', 'legL', 'footR', 'footL']) P.pos(b, 0, dy, 0); };
// rolled over on its right side, feet kicking the air
function toppled(P, k) {
  P.rot('root', 0, 0, 84 * k).pos('root', 4.4 * k, 6.6 * k, 0);
  P.rot('legR', 0, 0, -40 * k).rot('footR', 0, 0, -40 * k).pos('footR', 1.6 * k, 1.2 * k, 0).rot('legL', 0, 0, -70 * k).rot('footL', 0, 0, -70 * k).pos('footL', 2.6 * k, 2.4 * k, 0);
  P.rot('armL', 0, 0, 60 * k).rot('armR', 0, 0, 20 * k);
}
export const anim = {
  start: 'idle', seed: 86,
  breathe: { bone: 'body', amp: 0.02, per: 1.9 },
  blink: { slot: 'eyes', closed: 'closed', every: [1.8, 4.2], dur: 0.1 },
  look: { bone: 'body', yaw: 22, pitch: 6, speed: 6 },
  springs: [
    { bone: 'hair', tip: [0, 5, 0], k: 190, d: 8, gain: 0.7, max: 12, axes: [1, 0.2, 1] },
    { bone: 'hairF', tip: [0, 3, 3], k: 150, d: 6, gain: 1.0, max: 22, axes: [1, 0.2, 1] },
    { bone: 'ring', tip: [0, -3, 0], k: 80, d: 3.5, gain: 1.6, max: 40, axes: [1, 0, 1] },
    { bone: 'tie', tip: [0, -4, 0], k: 120, d: 6, gain: 1.1, max: 26, axes: [1, 0, 1] },
    { bone: 'handR', tip: [0, -2, 0], k: 220, d: 10, gain: 0.4, max: 14 },
    { bone: 'handL', tip: [0, -2, 0], k: 220, d: 10, gain: 0.4, max: 14 },
  ],
  faces: { eyes: EYES.slot, mouth: MOUTH.slot },
  fidget: { every: [3.2, 6.5], clips: ['dance', 'dance', 'pin', 'tick'] },
  clips: {
    // ticking over: a springy bounce on its toes, a metronome rock, a toe tap, eyes darting about
    idle: { len: 2.0, loop: true, f(P, t, c) {
      const b = bounce(t, 0.5, { squash: 0.06, stretch: 0.03 }), dy = b.u * 0.6;
      P.pos('body', 0, dy, 0).sq('body', b.sq); legs(P, dy);
      P.rot('body', 0, wave(t, 0.5) * 5, wave(t, 0.5, 0.6) * 4).rot('armR', wave(t, 1) * 8, 0, -6 - b.u * 8).rot('armL', -wave(t, 1) * 8, 0, 6 + b.u * 8);
      P.rot('footR', -14 * bump(t % 1, 0.02, 0.26), 0, 0);
      eyesAt(P, ...glance(t + c.loopN * 1.3, [[0, 0], [0.35, 0], [0.35, 0.05], [-0.35, 0], [0, 0]], 0.4));
      if (c.loopN % 2 === 1) P.burst(1.0, GDFX.spark, 'fuze', TOP, { n: 3 });
      if (c.loopN % 3 === 2) P.face('mouth', t > 0.7 && t < 1.6 ? 'grin' : undefined);
    } },
    // a punk strut: big bouncy steps, arms pumping
    walk: { len: 0.5, loop: true, f(P, t) {
      const ph = (t / 0.5) * TAU, s = Math.sin(ph), c2 = Math.cos(ph), lr = Math.max(0, s), ll = Math.max(0, -s), dy = Math.abs(c2) * 0.8;
      P.pos('body', 0, dy, 0).rot('body', 5, s * 6, s * 7).sq('body', -0.04 * (1 - Math.abs(c2)));
      P.pos('footR', 0, lr * 1.8, s * 2).rot('footR', -20 * lr, 0, 0).pos('footL', 0, ll * 1.8, -s * 2).rot('footL', -20 * ll, 0, 0);
      P.pos('legR', 0, lr * 1.4 + dy * 0.5, s * 1.6).pos('legL', 0, ll * 1.4 + dy * 0.5, -s * 1.6);
      P.rot('armR', -s * 40, 0, -12).rot('armL', s * 40, 0, 12);
    } },
    // battle cry: crouch… then a jump and a punk "HEY!", hair standing on end, sparks spitting
    cry: { len: 2.0, next: 'idle', f(P, t) {
      P.lookW = 1 - seg(t, 0.2, 0.3); P.blinkOK = false;
      const crouch = seg(t, 0, 0.3) * (1 - seg(t, 0.3, 0.42, E.out)), up = seg(t, 0.34, 0.5, E.back) * (1 - seg(t, 1.5, 1.85, E.inout)), air = bump(t, 0.36, 0.72);
      P.pos('body', 0, -1.4 * crouch, 0).sq('body', -0.14 * crouch + 0.1 * up + wob(t, 0.72, -0.12, 3, 6)); legs(P, -1.4 * crouch);
      P.pos('root', 0, 3.2 * air, 0).rot('body', -8 * up + wave(t, 9) * 3 * up, 0, wave(t, 7) * 3 * up);
      P.rot('armR', 0, 0, -150 * up + wave(t, 6) * 12 * up).rot('armL', 0, 0, 150 * up - wave(t, 6.3) * 12 * up).scl('hair', 1 + 0.2 * up, 1 + 0.35 * up, 1 + 0.2 * up);
      P.face('eyes', crouch > 0.3 ? 'angry' : up > 0.4 ? 'shut' : undefined).face('mouth', crouch > 0.3 ? 'grit' : up > 0.3 ? 'shout' : undefined);
      if (up > 0.4 && t < 1.4) P.stream(GDFX.spark, 'fuze', TOP, { rate: 40, spread: 1, speed: 1.4 });
      P.burst(0.45, 'ring', 'body', MOUTHP, { scale: 0.7 }).burst(0.5, 'anger', 'body', [6.5, 17, 3], {}).burst(0.55, 'note', 'body', [-6, 18, 2], {}).burst(0.75, 'dust', 'root', [0, 0, 0], { n: 5 });
    } },
    // physical: rears back and headbutts like a thrown grenade
    attack: { len: 0.95, next: 'idle', f(P, t) {
      const bk = seg(t, 0, 0.26, E.out) * (1 - seg(t, 0.26, 0.36, E.in)), hit = seg(t, 0.28, 0.4, E.in3) * (1 - seg(t, 0.5, 0.9, E.inout));
      P.pos('root', 0, 1.4 * bump(t, 0.24, 0.5), -2.2 * bk + 6 * hit).rot('body', -16 * bk + 28 * hit, 0, 0).sq('body', -0.1 * bk + wob(t, 0.42, 0.08, 4, 7));
      P.rot('armR', -50 * bk + 30 * hit, 0, -30 * bk).rot('armL', -50 * bk + 30 * hit, 0, 30 * bk);
      P.face('eyes', bk > 0.3 ? 'angry' : hit > 0.3 ? 'shut' : undefined).face('mouth', bk > 0.3 ? 'grit' : hit > 0.3 ? 'shout' : undefined); P.blinkOK = false;
      P.burst(0.4, 'spark', 'body', [0, 12, 10], {}).burst(0.4, GDFX.bits, 'body', [0, 12, 8], { n: 5 }).burst(0.42, 'star', 'body', [0, 14, 9], { n: 3 });
    } },
    // special: yanks its own pin, swells and shakes… BOOM — blown into the air — lands sooty and smug
    special: { len: 1.9, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const reach = bump(t, 0, 0.42), pull = seg(t, 0.12, 0.26, E.out3) * (1 - seg(t, 1.15, 1.3)), swell = seg(t, 0.3, 0.76, E.in) * (1 - seg(t, 0.76, 0.84, E.out));
      const boom = seg(t, 0.76, 0.84, E.out) * (1 - seg(t, 1.3, 1.6, E.inout)), air = bump(t, 0.78, 1.25), land = wob(t, 1.25, -0.16, 3, 6);
      P.rot('armL', 0, 0, 200 * reach).scl('armL', 1, 1 + 0.9 * reach, 1);
      P.pos('pin', 2.6 * pull, 0.3 * pull, 0).rot('spoon', 0, 0, -110 * pull);
      P.scl('body', 1 + 0.12 * swell + wave(t, 14) * 0.03 * swell).rot('body', 0, 0, wave(t, 16) * 5 * swell);
      P.pos('root', 0, 5 * air, 0).sq('body', land + 0.1 * air).rot('armR', 0, 0, -120 * boom).rot('armL', 0, 0, 120 * boom).scl('hair', 1 + 0.4 * boom);
      P.face('eyes', t < 0.3 ? 'angry' : swell > 0.2 ? 'wide' : boom > 0.3 ? 'shut' : t > 1.5 ? 'smug' : undefined).face('mouth', swell > 0.2 ? 'grit' : boom > 0.3 ? 'shout' : t > 1.5 ? 'smirk' : undefined);
      if (swell > 0.2) P.stream(GDFX.spark, 'fuze', TOP, { rate: 50, spread: 1, speed: 1.4 });
      P.burst(0.78, GDFX.boom, 'body', [0, 10, 0], { scale: 2.4 }).burst(0.78, 'ring', 'root', [0, 1, 0], { scale: 2 }).burst(0.8, GDFX.bits, 'body', [0, 10, 0], { n: 12, speed: 1.4 }).burst(0.82, 'smoke', 'body', [0, 10, 0], { n: 8, spread: 1, speed: 1.2 });
      if (t > 1.3) P.stream('smoke', 'fuze', TOP, { rate: 6, scale: 0.6 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.2, 0.7, E.inout));
      P.pos('root', 0, 0.6 * k, -2.4 * k).rot('body', -16 * k + wob(t, 0.2, 4, 3, 6), 0, wave(t, 16) * 4 * k).sq('body', -0.14 * k).rot('armR', 0, 0, -50 * k).rot('armL', 0, 0, 50 * k).scl('hair', 1 + 0.25 * k);
      P.face('eyes', t < 0.42 ? 'x' : 'sad').face('mouth', t < 0.42 ? 'o' : 'frown'); P.blinkOK = false;
      P.burst(0.02, 'spark', 'body', [0, 11, 7], {}).burst(0.02, GDFX.bits, 'body', [0, 11, 4], { n: 6 }).burst(0.06, 'sweat', 'body', [6.5, 16, 4], {});
    } },
    // dizzy… then it keels over and rolls onto its side like a dropped grenade
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.9, 1.0)), fall = seg(t, 0.9, 1.35, E.bounce);
      P.rot('body', 0, wave(t, 1.6) * 24 * dizzy, wave(t, 2.2) * 12 * dizzy).pos('body', 0, -0.8 * dizzy, 0); legs(P, -0.8 * dizzy);
      toppled(P, fall); P.rot('root', 0, 0, wob(t, 1.35, 6, 1.4, 3));
      P.face('eyes', 'swirl').face('mouth', 'o'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.9, 'star', 'body', [0, 22, 0], { n: 5 }).burst(1.32, 'dust', 'root', [0, 0, 0], { n: 8 }).burst(1.1, 'smoke', 'fuze', TOP, { n: 6, spread: 0.6 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      toppled(P, 1); P.face('eyes', 'swirl').face('mouth', 'o'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.4;
      const tw = bump(t, 0.5, 0.62) + bump(t, 0.72, 0.84);
      P.rot('footL', 20 * tw, 0, 0).rot('root', 0, 0, wave(t, 0.42) * 2);
      P.stream('smoke', 'fuze', TOP, { rate: 1.2 });
    } },
    // victory: a spinning pogo hop, then "hey-oh!" — fist up, tongue out, a wink
    win: { len: 1.9, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const h = t < 0.95 ? hop(t, 0.95, 7, { crouch: 1.6 }) : { y: wob(t, 0.95, -1.0, 3, 6), sq: wob(t, 0.95, -0.15, 3, 6) };
      P.pos('root', 0, Math.max(0, h.y), 0).sq('body', h.sq).rot('root', 0, 360 * seg(t, 0.22, 0.66, E.inout), 0);
      if (h.y < 0) { P.pos('body', 0, h.y, 0); legs(P, h.y); }
      const pose = seg(t, 1.0, 1.15, E.back), air = seg(t, 0.2, 0.3) * (1 - seg(t, 0.9, 1.0));
      P.rot('armR', 0, 0, -70 * air - 165 * pose + wave(t, 3) * 6 * pose).rot('armL', 0, 0, 70 * air + 30 * pose).rot('body', 0, 0, -6 * pose);
      P.face('eyes', air > 0.4 ? 'shut' : pose > 0.5 ? 'wink' : 'happy').face('mouth', air > 0.4 ? 'shout' : pose > 0.5 ? 'tongue' : 'grin');
      P.burst(0.95, GDFX.heart, 'body', [0, 18, 2], { n: 8 }).burst(1.1, 'sparkle', 'body', [0, 22, 2], { n: 8 }).burst(0.95, 'ring', 'root', [0, 1, 0], {});
    } },
    // asleep: slumped back on its bottom, feet out, the fuze puffing a little smoke with every snore
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * TAU);
      P.pos('body', 0, -1.6 + br * 0.2, 0).sq('body', -0.05 + br * 0.03).rot('body', -10, 0, 6); legs(P, -1.6);
      P.rot('footR', -24, -18, 0).rot('footL', -24, 18, 0).pos('footR', 0, 0, 0.8).pos('footL', 0, 0, 0.8).rot('armR', 0, 0, 12).rot('armL', 0, 0, -12);
      P.face('eyes', 'closed').face('mouth', br > 0.2 ? 'o' : 'smirk'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'body', [4, 20, 4], {}).burst(1.8, 'z', 'body', [4, 20, 4], {}).burst(1.6, 'smoke', 'fuze', TOP, { n: 1, scale: 0.4 });
    } },
    // the dance: a punk pogo — a jump on every beat, alternating fist pumps, headbangs and kicks,
    // then a spin into the "hey-oh!" pose with its tongue out
    dance: { len: 2.6, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const b = beat(t, 0.27), live = 1 - seg(t, 2.1, 2.2), n = b.n, sd = n % 2 ? 1 : -1, jump = b.pulse * live;
      P.pos('root', 0, 1.8 * jump, 0).sq('body', 0.1 * jump * live - 0.1 * (1 - b.pulse) * live);
      P.rot(sd > 0 ? 'armL' : 'armR', 0, 0, sd * 160 * jump).rot(sd > 0 ? 'armR' : 'armL', 0, 0, -sd * 20 * live);
      P.rot('body', (n % 4 < 2 ? 14 : -4) * jump, 0, sd * 6 * live);
      if (n % 4 === 3) { const f = sd > 0 ? 'L' : 'R'; P.pos('foot' + f, 0, 1.6 * jump, 2.4 * jump).rot('foot' + f, -30 * jump, 0, 0).pos('leg' + f, 0, 1.2 * jump, 1.4 * jump); }
      const spin = seg(t, 2.1, 2.4, E.inout), pose = seg(t, 2.35, 2.5, E.back);
      P.rot('root', 0, 360 * spin, 0).pos('root', 0, 2.6 * bump(t, 2.1, 2.4), 0);
      P.rot('armR', 0, 0, -170 * pose).rot('armL', 0, 0, 40 * pose).rot('body', 0, 0, -8 * pose);
      P.face('eyes', t > 2.4 ? 'wink' : jump > 0.5 ? 'shut' : 'happy').face('mouth', t > 2.4 ? 'tongue' : jump > 0.5 ? 'shout' : 'grin');
      for (const k of [0, 2, 4, 6]) P.burst(0.02 + k * 0.27, 'note', 'body', [k % 4 ? -5 : 5, 22, 2], {});
      P.burst(2.42, 'sparkle', 'body', [0, 24, 2], { n: 6 }).burst(2.42, GDFX.heart, 'body', [0, 20, 3], { n: 5 });
    } },
    // signature: it sneaks a look round, stretches a rubber arm up and yanks its own pin… the lever
    // flies, it panics and shakes harder and harder, jams the pin back in just in time, wipes its
    // brow, then twirls the heart ring like a gunslinger and sticks its tongue out
    pin: { len: 3.6, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const sneak = env(t, 0, 0.7, 0.1, 0.1);
      eyesAt(P, (t < 0.35 ? -0.4 : 0.4) * sneak, 0);
      const reach = env(t, 0.55, 2.7, 0.3, 0.25), pull = seg(t, 0.9, 1.05, E.back) * (1 - seg(t, 2.25, 2.45, E.inout));
      P.rot('armL', 0, 0, 200 * reach - 30 * pull * reach).scl('armL', 1, 1 + 0.9 * reach, 1);
      P.pos('pin', 2.6 * pull, 0.4 * pull, 0).rot('spoon', 0, 0, -115 * seg(t, 1.05, 1.15, E.out) * (1 - seg(t, 2.3, 2.4)));
      const panic = seg(t, 1.1, 1.3) * (1 - seg(t, 2.3, 2.5)), shake = panic * (0.4 + 0.6 * seg(t, 1.2, 2.2));
      P.rot('body', 0, 0, wave(t, 10 + 8 * seg(t, 1.2, 2.2)) * 6 * shake).pos('body', 0, Math.abs(wave(t, 6)) * 0.6 * panic, 0).sq('body', 0.06 * Math.sin(t * 40) * shake);
      P.rot('armR', 0, 0, (-60 - wave(t, 8) * 40) * panic);
      const phew = seg(t, 2.5, 2.7) * (1 - seg(t, 3.0, 3.15));
      P.rot('armR', -30 * phew, 0, -165 * phew).scl('armR', 1, 1 + 0.5 * phew, 1);
      P.rot('ring', 0, 0, 720 * seg(t, 3.05, 3.5, E.inout));
      P.face('eyes', t < 0.55 ? 'smug' : t < 0.95 ? 'angry' : panic > 0.3 ? (t % 0.5 < 0.25 ? 'wide' : 'shock') : phew > 0.3 ? 'closed' : t > 3.05 ? (t > 3.4 ? 'wink' : 'smug') : undefined);
      P.face('mouth', t < 0.95 ? 'smirk' : panic > 0.3 ? 'grit' : phew > 0.3 ? 'o' : t > 3.05 ? 'tongue' : undefined);
      if (panic > 0.3) P.stream(GDFX.spark, 'fuze', TOP, { rate: 30 + 60 * shake, spread: 1, speed: 1.2 });
      for (const b0 of [1.3, 1.7, 2.05]) P.burst(b0, 'sweat', 'body', [6.5, 16, 3], { n: 2 });
      P.burst(1.05, GDFX.spark, 'fuze', [-2.8, 22, 0], { n: 8 }).burst(2.42, 'ring', 'fuze', TOP, { scale: 0.5 }).burst(2.5, 'steam', 'body', [0, 18, 3], { n: 4 }).burst(3.45, 'sparkle', 'body', RING, { n: 4 });
    } },
    // fidget: ticks like a metronome, eyes following, toe tapping, sparks on every tick… then "BOO!"
    tick: { len: 2.6, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const live = 1 - seg(t, 1.55, 1.7), sw = Math.sin((t / 0.3) * Math.PI) * 10 * live, b = beat(t, 0.3);
      P.rot('body', 0, 0, sw).rot('armR', 0, 0, -10 + sw).rot('armL', 0, 0, 10 + sw); eyesAt(P, -sw * 0.035, 0);
      P.rot(b.n % 2 ? 'footL' : 'footR', -16 * b.pulse * live, 0, 0);
      for (let k = 0; k < 5; k++) P.burst(0.3 * k + 0.02, GDFX.spark, 'fuze', TOP, { n: 2 });
      const boo = seg(t, 1.7, 1.82, E.back) * (1 - seg(t, 2.1, 2.4, E.inout));
      P.rot('body', 20 * boo, 0, 0).pos('root', 0, 0.6 * boo, 1.8 * boo).rot('armR', -60 * boo, 0, -110 * boo).rot('armL', -60 * boo, 0, 110 * boo).scl('hair', 1 + 0.3 * boo);
      P.face('eyes', boo > 0.3 ? 'wide' : t > 2.2 ? 'smug' : undefined).face('mouth', boo > 0.3 ? 'shout' : t > 2.1 ? 'grin' : undefined);
      P.burst(1.72, GDFX.spark, 'fuze', TOP, { n: 14, speed: 1.4 }).burst(1.74, 'anger', 'body', [6, 18, 3], {});
    } },
  },
};
def.anim = anim;
