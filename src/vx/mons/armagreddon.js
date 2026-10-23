// Armagreddon — the giant nuclear bomb (a Green Day homage, stage 2 of Grenaday). A fat Fat-Man
// style bomb standing nose-down like it is already falling: black nose with hazard stripes, riveted
// dark olive steel, a box tail of red-tipped fins on top with its spiky dyed-green crest erupting out
// of it and jagged bangs over its brow. Huge green radioactive eyes in heavy guyliner, a ZIPPER for a
// mouth — unzip it and the core glows inside — a hand-painted red heart and a stencilled "86" on its
// hide, glowing vents on its back, the heart-shaped pin ring hanging off a fin, studded wristbands,
// fat high-tops. Its ultimate is the last one: it counts down… and takes the whole field with it.
// Homage only — no logos, no album art.
import { E, seg, bump, wob, wave, bounce, hop } from '../anim.js';
import { eyeRig, eyesAt, eyesScale, glance, keepEyes } from './eyes.js';
import {
  G, B, L, both, twin, acc, rod, beat, env, plant, silverP, chainP, metalP, heartRingP, spikeP, bangsP, canvasP, soleP, toeCapP, collarP,
  limbP, gloveP, checkerP, studP, redP, tieP, collarPlaneP, guitarBodyP, neckP, headstockP, bombP, noseP, finP, ventP, heartSticker, stencil, trefoil,
  BOMB_EYES, zipperP, zipperGlowP, ZIP_STATES, GDFX, bombForm, GD_FX_MAP,
} from './greenday_parts.js';

const TAU = Math.PI * 2;
// ---------------------------------------------------------------- painters
const lensP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const edge = y === 0 || y === h - 1 || x === 0 || x === w - 1; p.px(x, y, face !== 'south' || edge || y === 1 ? '#141218' : y < h * 0.45 ? '#3a3a52' : '#22222e'); } if (face === 'south') p.px(2, 2, '#ffffff').px(3, 2, '#b8c0d8'); };
const frameP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? '#3a3844' : '#141218'); };

// ---------------------------------------------------------------- the model
const SHOE = [
  B([-9.2, 0, -3.8], [7.2, 1.3, 10.6], soleP),
  B([-8.9, 1.3, -3.4], [6.6, 2.8, 8.8], canvasP),
  B([-9.0, 0.9, 5.0], [6.8, 2.4, 1.8], toeCapP),
  B([-8.4, 3.8, -2.6], [5.8, 2.6, 5.2], collarP),
];
// a big lock of hair: three tapering pieces sharing a pivot and a tilt
const spike = (x, y, z, len, rx, rz, s = 3.4) => {
  const pv = { pivot: [x, y + 0.3, z], rot: [rx, 0, rz] };
  return [
    B([x - s / 2, y - 0.3, z - s / 2], [s, len * 0.46, s], spikeP(0), pv),
    B([x - s * 0.33, y - 0.3 + len * 0.44, z - s * 0.33], [s * 0.66, len * 0.34, s * 0.66], spikeP(1), pv),
    B([x - s * 0.17, y - 0.3 + len * 0.76, z - s * 0.17], [s * 0.34, len * 0.26, s * 0.34], spikeP(2), pv),
  ];
};
const EYES = eyeRig({ style: 'pix', chunk: 1, parent: 'body', at: [-6.4, 22.4, 11.05], line: BOMB_EYES.line, pupilColor: BOMB_EYES.pupilColor, iris: BOMB_EYES.iris, irisDark: BOMB_EYES.irisDark, accent: BOMB_EYES.accent, map: BOMB_EYES.map, extra: ['smug'] });
// the zipper mouth: a lit zipper plane per state, plus the glowing core behind the opening
const MZ = [-8, 14.0], ZIP = ZIP_STATES.flatMap((s) => [
  { o: [MZ[0], MZ[1], 11.07], s: [16, 4.67, 0], plane: 'z', tex: zipperP(s), id: 'm-' + s, hide: s !== 'zip', outline: false },
  ...(s === 'zip' ? [] : [{ o: [MZ[0], MZ[1], 11.04], s: [16, 4.67, 0], plane: 'z', tex: zipperGlowP(s), glow: true, id: 'mg-' + s, hide: true, outline: false }]),
]);
const MOUTH_SLOT = { default: 'zip', states: Object.fromEntries(ZIP_STATES.map((s) => [s, s === 'zip' ? ['m-zip'] : ['m-' + s, 'mg-' + s]])) };
const TAB = { zip: 0, half: 8.8, grin: 15.2, open: 15.2 };
const FIST = [B([-16.8, 13.2, -3.0], [6.0, 6.0, 6.0], gloveP), B([-17.0, 17.4, -3.2], [6.4, 1.8, 6.4], studP)];
const COLLAR_SPIKES = [-3, 0, 3].flatMap((d) => [
  B([d - 0.5, 34.3, 5.3], [1.0, 1.0, 1.4], silverP), B([d - 0.5, 34.3, -6.7], [1.0, 1.0, 1.4], silverP), B([5.3, 34.3, d - 0.5], [1.4, 1.0, 1.0], silverP), B([-6.7, 34.3, d - 0.5], [1.4, 1.0, 1.0], silverP),
]);
export const def = {
  name: 'armagreddon', ppu: 3, scale: 0.6, outline: { color: '#0a0a08', px: 1.6 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...twin({ name: 'legR', parent: 'root', pivot: [-5.6, 8.0, 0], cubes: [B([-7.7, 2.2, -2.2], [4.2, 6.2, 4.4], limbP)] }),
    ...twin({ name: 'footR', parent: 'root', pivot: [-5.6, 2.4, 0.6], cubes: SHOE }),
    { name: 'body', parent: 'root', pivot: [0, 7, 0], cubes: [
      // nose-down: a black hazard-striped nose, riveted tiers, the widest one wearing the face
      B([-5, 5.0, -5], [10, 2.2, 10], noseP),
      B([-8, 6.8, -8], [16, 2.8, 16], noseP),
      B([-10, 9.4, -10], [20, 2.2, 20], bombP({ seams: [0.5] })),
      B([-11.2, 11.4, -10.4], [22.4, 2.4, 20.8], bombP()),
      B([-12, 13.6, -11], [24, 12.8, 22], bombP(), { faces: {
        south: heartSticker(bombP(), { cx: 0.87, cy: 0.72, s: 0.075 }), east: stencil(bombP(), '86', { x: 0.3, y: 0.3 }), west: stencil(bombP(), '21', { x: 0.42, y: 0.3, face: 'west' }),
        north: trefoil(bombP(), { cx: 0.5, cy: 0.3, r: 0.15 }),
      } }),
      B([-11.2, 26.2, -10.4], [22.4, 2.6, 20.8], bombP()),
      B([-10, 28.6, -9.6], [20, 2.8, 19.2], bombP({ seams: [0.5] })),
      B([-8, 31.2, -8], [16, 2.2, 16], bombP()),
      B([-5, 33.2, -5], [10, 2.8, 10], bombP()),
      // glowing vents on its back
      ...both(B([-7.4, 14.6, -11.5], [3.0, 8.4, 0.6], ventP, { glow: true })),
      ...ZIP,
      // tier 2 (or): a chain belt round its middle with a heart pin-ring pendant
      ...acc('acc-chainbelt', [
        B([-10.3, 9.9, 9.9], [20.6, 1.3, 0.6], chainP), B([-10.3, 9.9, -10.5], [20.6, 1.3, 0.6], chainP), ...both(B([-10.5, 9.9, -10.3], [0.6, 1.3, 20.6], chainP)),
        B([2.6, 5.6, 10.6], [4, 3.67, 0], heartRingP, { plane: 'z' }), B([4.3, 9.0, 10.4], [0.6, 1.4, 0.4], silverP),
      ]),
      // tier 3 (or): a spiked collar round its tail
      ...acc('acc-collar', [B([-5.4, 33.8, -5.4], [10.8, 1.8, 10.8], studP), ...COLLAR_SPIKES]),
      // tier 1 (or): black wayfarers pushed up on its bangs
      ...acc('acc-shades', [
        B([-8.4, 27.2, 11.6], [7.6, 3.0, 0.6], lensP), B([0.8, 27.2, 11.6], [7.6, 3.0, 0.6], lensP, { mirror: true }), B([-0.9, 28.6, 11.6], [1.8, 0.8, 0.5], frameP),
        ...both(B([-10.9, 28.4, 1.6], [0.5, 0.7, 10.4], frameP)),
      ]),
    ] },
    { name: 'zipTab', parent: 'body', pivot: [-8, 16.3, 11.3], cubes: [B([-8.5, 14.6, 11.1], [1.0, 2.4, 0.6], silverP), B([-8.2, 13.6, 11.15], [0.4, 1.2, 0.4], silverP)] },
    // tier 1 (or): a huge skinny red tie hanging off its belly
    { name: 'tie', parent: 'body', pivot: [0, 13.2, 11.4], cubes: acc('acc-tie', [
      B([-1.6, 11.6, 10.6], [3.2, 2.4, 1.2], redP), B([-1.5, 3.4, 10.5], [3.0, 8.4, 0.8], tieP, { pivot: [0, 11.8, 11], rot: [10, 0, 0] }),
    ]) },
    // the box tail: four plates and an X of inner fins, red tips, rivets
    { name: 'fins', parent: 'body', pivot: [0, 35.5, 0], cubes: [
      B([-8.6, 35.6, 7.8], [17.2, 7.4, 0.8], finP), B([-8.6, 35.6, -8.6], [17.2, 7.4, 0.8], finP), ...both(B([-8.6, 35.6, -7.8], [0.8, 7.4, 15.6], finP)),
      B([-10.6, 35.6, -0.4], [21.2, 6.6, 0.8], finP, { pivot: [0, 39, 0], rot: [0, 45, 0] }), B([-10.6, 35.6, -0.4], [21.2, 6.6, 0.8], finP, { pivot: [0, 39, 0], rot: [0, -45, 0] }),
    ] },
    { name: 'pinB', parent: 'fins', pivot: [8.6, 40.6, 4.0], cubes: [B([8.4, 40.2, 3.6], [2.8, 0.8, 0.8], metalP)] },
    { name: 'ring', parent: 'pinB', pivot: [11.0, 40.6, 4.0], rot: [0, 30, 0], cubes: [B([7.0, 33.3, 4.0], [8, 7.33, 0], heartRingP, { plane: 'z' })] },
    // the spiky crest bursting out of the tail box, swept forward and to one side
    { name: 'hair', parent: 'fins', pivot: [0, 37, 0], cubes: [
      B([-6.6, 36.4, -6.6], [13.2, 2.4, 13.2], spikeP(0)),
      ...spike(0, 37, 0, 15, 6, -10, 4.0), ...spike(-3.6, 37, 2.6, 12, 26, 12), ...spike(3.4, 37, 2.8, 12.5, 24, -24), ...spike(0.2, 37, 4.6, 11, 40, -14),
      ...spike(-4.2, 37, -2.6, 11, -22, 18), ...spike(3.8, 37, -3.0, 11, -20, -26), ...spike(0, 37, -4.6, 10, -40, 0), ...spike(-5.4, 37, 0.2, 10, 4, 38, 3.0), ...spike(5.6, 37, 0, 10.5, 2, -44, 3.0),
    ] },
    { name: 'hairF', parent: 'hair', pivot: [0, 38, 5.4], cubes: [...spike(-1.6, 38, 5.6, 11, 56, 6, 3.6), ...spike(2.6, 38, 5.4, 9, 48, -30, 3.0)] },
    // jagged bangs falling over its brow (and a mop of hair over the top tiers)
    { name: 'bangs', parent: 'body', pivot: [0, 31, 10.6], cubes: [
      B([-9.8, 25.4, 10.2], [19.6, 4.8, 1.4], bangsP), B([-7.6, 29.6, 6.6], [15.2, 1.6, 4.0], spikeP(1)), ...both(B([-11.6, 25.8, 2.0], [1.2, 3.6, 8.2], bangsP)),
    ] },
    ...EYES.bones,
    ...twin({ name: 'armR', parent: 'body', pivot: [-12.2, 25.0, 0], cubes: [B([-16.0, 18.4, -2.4], [4.4, 7.8, 4.8], limbP), ...acc('acc-armband', [B([-16.3, 21.2, -2.7], [5.0, 1.9, 5.4], redP)])] }),
    ...twin({ name: 'handR', parent: 'armR', pivot: [-13.8, 19.0, 0], cubes: FIST }),
    // tier 3: the giant sticker-bombed blue guitar on its back
    { name: 'guitar', parent: 'body', pivot: [0, 22, -11.2], rot: [0, 0, -35], cubes: acc('acc-guitar', [
      B([-5.6, 10, -13.2], [11.2, 12.0, 2.0], guitarBodyP), B([-5.6, 22, -13.1], [2.6, 3.0, 1.8], guitarBodyP), B([2.8, 22, -13.1], [2.2, 4.0, 1.8], guitarBodyP),
      B([-1.0, 22, -13.0], [2.0, 15, 1.3], neckP), B([-1.5, 37, -13.05], [3.2, 4.8, 1.2], headstockP),
    ]) },
  ],
  drip: [
    [{ id: 'acc-tie', name: 'Giant skinny red tie' }, { id: 'acc-shades', name: 'Pushed-up wayfarers' }],
    [{ id: 'acc-chainbelt', name: 'Heart-ring chain belt' }, { id: 'acc-armband', name: 'Red rebel armband' }],
    [{ id: 'acc-guitar', name: 'Giant sticker-bombed guitar' }, { id: 'acc-collar', name: 'Spiked collar' }],
  ],
  attach: {
    head: { bone: 'hair', at: [0, 50, 0], size: 14 },
    face: { bone: 'body', at: [0, 22.4, 11.3], size: 20 },
    neck: { bone: 'body', at: [0, 12.6, 11.0], size: 16 },
    back: { bone: 'body', at: [0, 20, -11.6], size: 16 },
  },
};
// the luxury form: a black-lacquered bomb with gold fins, rivets, zipper and heart; the core burns blue
// (the armband's red is left alone so it still reads; the eyes keep their neon green)
def.dripForm = { map: keepEyes(EYES, bombForm), fx: GD_FX_MAP };
// Note: the 'nuke' clip is the self-destruct (Last Night on Earth) — it ends in 'down'.

// ---------------------------------------------------------------- animation
const TOP = [0, 44, 0], CORE = [0, 16.3, 12.4], RING = [11, 37, 4], LEG = 5.6;
const legs = (P, dy) => plant(P, ['legR', 'legL'], dy, LEG);
const mouth = (P, s) => { P.face('mouth', s); P.pos('zipTab', TAB[s] || 0, 0, 0); return P; };
// keeled over backwards, fins in the dirt, feet in the air
function toppled(P, k) {
  P.rot('root', -80 * k, 0, 0).pos('root', 0, 9.5 * k, 11 * k);
  P.rot('footR', 30 * k, 0, 10 * k).rot('footL', 20 * k, 0, -14 * k).rot('armR', 0, 0, -50 * k).rot('armL', 0, 0, 60 * k).rot('fins', 0, 0, 6 * k);
}
export const anim = {
  start: 'idle', seed: 21,
  breathe: { bone: 'body', amp: 0.015, per: 2.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 5.0], dur: 0.12 },
  look: { bone: 'body', yaw: 18, pitch: 5, speed: 4 },
  springs: [
    { bone: 'hair', tip: [0, 10, 0], k: 160, d: 7, gain: 0.6, max: 10, axes: [1, 0.2, 1] },
    { bone: 'hairF', tip: [0, 6, 6], k: 130, d: 6, gain: 0.9, max: 18, axes: [1, 0.2, 1] },
    { bone: 'bangs', tip: [0, -4, 1], k: 220, d: 10, gain: 0.4, max: 6, axes: [1, 0, 0] },
    { bone: 'ring', tip: [0, -6, 0], k: 60, d: 3, gain: 1.4, max: 35, axes: [1, 0, 1] },
    { bone: 'tie', tip: [0, -8, 0], k: 90, d: 5, gain: 1.0, max: 20, axes: [1, 0, 1] },
    { bone: 'handR', tip: [0, -5, 0], k: 200, d: 10, gain: 0.35, max: 10 },
    { bone: 'handL', tip: [0, -5, 0], k: 200, d: 10, gain: 0.35, max: 10 },
  ],
  faces: { eyes: EYES.slot, mouth: MOUTH_SLOT },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'countdown', 'twirl'] },
  clips: {
    // heavy, slow and dangerous: a weighty bob on its fat sneakers, radioactive motes drifting out of the
    // tail, a sneer that unzips half its mouth every few loops, eyes sliding about
    idle: { len: 2.4, loop: true, f(P, t, c) {
      const b = bounce(t, 1.2, { squash: 0.04, stretch: 0.02, sharp: 4 }), dy = b.u * 0.5;
      P.pos('body', 0, dy, 0).sq('body', b.sq); legs(P, dy);
      P.rot('body', wave(t, 0.42) * 1.5, wave(t, 0.42) * 4, wave(t, 0.42, 1) * 2).rot('armR', wave(t, 0.84) * 6, 0, -4 - b.u * 4).rot('armL', -wave(t, 0.84) * 6, 0, 4 + b.u * 4);
      eyesAt(P, ...glance(t + c.loopN * 1.7, [[0, 0], [-0.5, 0], [-0.5, 0], [0.5, 0.1], [0, 0]], 0.5));
      P.stream(GDFX.rad, 'fins', TOP, { rate: 3, spread: 1, speed: 0.6 });
      if (c.loopN % 3 === 2) { const k = t > 0.6 && t < 1.8; mouth(P, k ? 'half' : 'zip'); if (k) P.stream(GDFX.rad, 'body', CORE, { rate: 6, spread: 0.6, speed: 0.4, key: 'm' }); }
    } },
    // heavy stomping steps, dust on every footfall
    walk: { len: 0.9, loop: true, f(P, t) {
      const ph = (t / 0.9) * TAU, s = Math.sin(ph), c2 = Math.cos(ph), lr = Math.max(0, s), ll = Math.max(0, -s), dy = Math.abs(c2) * 0.9;
      P.pos('body', 0, dy, 0).rot('body', 3, s * 5, s * 4).sq('body', -0.03 * (1 - Math.abs(c2)));
      P.pos('footR', 0, lr * 2.6, s * 3).rot('footR', -16 * lr, 0, 0).pos('footL', 0, ll * 2.6, -s * 3).rot('footL', -16 * ll, 0, 0);
      P.pos('legR', 0, lr * 2.2 + dy * 0.5, s * 2.4).pos('legL', 0, ll * 2.2 + dy * 0.5, -s * 2.4).rot('armR', -s * 24, 0, -8).rot('armL', s * 24, 0, 8);
      P.burst(0.02, 'dust', 'footL', [5.6, 0.5, 2], { n: 2 }).burst(0.47, 'dust', 'footR', [-5.6, 0.5, 2], { n: 2 });
    } },
    // battle cry: hunkers down, rips the zipper open and ROARS radiation at the sky, fins rattling
    cry: { len: 2.2, next: 'idle', f(P, t) {
      P.lookW = 1 - seg(t, 0.2, 0.3); P.blinkOK = false;
      const crouch = seg(t, 0, 0.35) * (1 - seg(t, 0.35, 0.5, E.out)), up = seg(t, 0.4, 0.6, E.back) * (1 - seg(t, 1.7, 2.05, E.inout));
      P.pos('body', 0, -2 * crouch, 0).sq('body', -0.1 * crouch + 0.06 * up); legs(P, -2 * crouch);
      P.rot('body', -12 * up + wave(t, 8) * 2 * up, 0, wave(t, 6) * 2 * up).rot('fins', wave(t, 14) * 4 * up, 0, wave(t, 11) * 4 * up);
      P.rot('armR', 0, 0, -130 * up + wave(t, 5) * 10 * up).rot('armL', 0, 0, 130 * up - wave(t, 5.4) * 10 * up).scl('hair', 1 + 0.12 * up, 1 + 0.25 * up, 1 + 0.12 * up);
      P.face('eyes', crouch > 0.3 ? 'angry' : up > 0.4 ? 'shut' : undefined); mouth(P, crouch > 0.3 ? 'half' : up > 0.2 ? 'open' : 'zip');
      if (up > 0.4 && t < 1.6) { P.stream(GDFX.rad, 'body', CORE, { rate: 60, dir: [0, 0.8, 0.6], spread: 0.4, speed: 2.4 }); P.stream(GDFX.rad, 'fins', TOP, { rate: 20, spread: 1, speed: 1.2, key: 'f' }); }
      P.burst(0.55, GDFX.shock, 'root', [0, 1, 0], { scale: 1.6 }).burst(0.55, 'dust', 'root', [0, 0, 0], { n: 10, spread: 1 }).burst(0.6, 'anger', 'body', [12, 32, 6], {});
    } },
    // physical: a wind-up haymaker with its studded glove
    attack: { len: 1.1, next: 'idle', f(P, t) {
      const bk = seg(t, 0, 0.32, E.out) * (1 - seg(t, 0.32, 0.42, E.in)), hit = seg(t, 0.34, 0.46, E.in3) * (1 - seg(t, 0.6, 1.05, E.inout));
      P.rot('body', -6 * bk + 10 * hit, -26 * bk + 20 * hit, 0).pos('root', 0, 0, -1.6 * bk + 4.5 * hit);
      P.rot('armR', 50 * bk - 95 * hit, 0, -20 * bk).rot('handR', 0, 0, 0).rot('armL', -20 * bk, 0, 20 * bk);
      P.sq('body', wob(t, 0.46, 0.05, 4, 7));
      P.face('eyes', bk > 0.3 ? 'angry' : hit > 0.3 ? 'shut' : undefined); mouth(P, bk > 0.3 ? 'grin' : hit > 0.3 ? 'open' : 'zip'); P.blinkOK = false;
      P.burst(0.46, 'spark', 'handR', [-13.8, 10, 14], { scale: 1.6 }).burst(0.46, GDFX.bits, 'handR', [-13.8, 10, 12], { n: 6 }).burst(0.48, 'star', 'handR', [-13.8, 12, 13], { n: 4 });
    } },
    // special: unzips, the core goes critical, and it vents a radioactive blast in front of it
    special: { len: 2.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const charge = seg(t, 0.05, 0.7, E.in) * (1 - seg(t, 0.72, 0.8)), blast = seg(t, 0.72, 0.8, E.out) * (1 - seg(t, 1.4, 1.8, E.inout));
      P.pos('body', 0, -1.6 * charge, 0).scl('body', 1 + 0.08 * charge + wave(t, 16) * 0.015 * charge).rot('body', 0, 0, wave(t, 18) * 2 * charge); legs(P, -1.6 * charge);
      P.rot('body', -10 * blast, 0, 0).pos('root', 0, 0, -2.4 * blast).rot('armR', 0, 0, -60 * blast).rot('armL', 0, 0, 60 * blast).rot('fins', wave(t, 20) * 5 * blast, 0, 0);
      P.face('eyes', charge > 0.2 ? 'angry' : blast > 0.3 ? 'wide' : t > 1.6 ? 'smug' : undefined); mouth(P, t < 0.1 ? 'zip' : t < 0.3 ? 'half' : t < 1.6 ? 'open' : 'zip');
      eyesScale(P, 1 + 0.15 * blast, 1 + 0.25 * blast);
      if (charge > 0.1) P.stream(GDFX.rad, 'body', [0, 22, 0], { rate: 50 * charge, spread: 1, speed: 1.6 });
      if (blast > 0.3) P.stream(GDFX.rad, 'body', CORE, { rate: 120, dir: [0, 0.1, 1], spread: 0.25, speed: 5, key: 'b' });
      P.burst(0.74, GDFX.nuke, 'body', [0, 16, 22], { scale: 2.2 }).burst(0.74, GDFX.shock, 'root', [0, 1, 6], { scale: 2.2 }).burst(0.76, 'dust', 'root', [0, 0, 4], { n: 12, spread: 1 }).burst(1.5, 'steam', 'body', CORE, { n: 6, dir: [0, 1, 0.3] });
    } },
    hurt: { len: 0.8, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.25, 0.8, E.inout));
      P.pos('root', 0, 0, -2 * k).rot('body', -10 * k + wob(t, 0.25, 3, 3, 6), 0, wave(t, 14) * 3 * k).sq('body', -0.08 * k).rot('armR', 0, 0, -40 * k).rot('armL', 0, 0, 40 * k).rot('fins', wave(t, 18) * 6 * k, 0, 0);
      P.face('eyes', t < 0.45 ? 'x' : 'angry'); mouth(P, t < 0.45 ? 'half' : 'zip'); P.blinkOK = false;
      P.burst(0.02, 'spark', 'body', [0, 20, 12], { scale: 1.4 }).burst(0.02, GDFX.bits, 'body', [0, 20, 10], { n: 8 }).burst(0.05, GDFX.rad, 'fins', TOP, { n: 10, speed: 1.6 });
    } },
    // a dud: it wobbles, fizzles and keels over backwards with a heavy thud
    faint: { len: 2.6, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 1.1, 1.2)), fall = seg(t, 1.1, 1.65, E.bounce);
      P.rot('body', 0, wave(t, 1.2) * 14 * dizzy, wave(t, 1.8) * 8 * dizzy).pos('body', 0, -1.2 * dizzy, 0); legs(P, -1.2 * dizzy);
      toppled(P, fall); P.face('eyes', 'swirl'); mouth(P, t < 1.1 ? 'half' : 'zip'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.1, 'star', 'body', [0, 46, 0], { n: 6 }).burst(1.62, 'dust', 'root', [0, 0, 0], { n: 14, spread: 1 }).burst(1.62, GDFX.shock, 'root', [0, 1, -10], { scale: 1.4 }).burst(1.3, 'smoke', 'fins', TOP, { n: 8, spread: 0.8 });
    } },
    down: { len: 2.6, loop: true, f(P, t) {
      toppled(P, 1); P.face('eyes', 'swirl'); mouth(P, 'zip'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.4;
      P.rot('footR', 10 * bump(t, 0.6, 0.8), 0, 0).stream('smoke', 'fins', TOP, { rate: 1.5 });
    } },
    // victory: both fists up, a heavy jump, the ground cracks and a confetti of hearts pops out of its fins
    win: { len: 2.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const h = t < 1.0 ? hop(t, 1.0, 5, { crouch: 2.4 }) : { y: wob(t, 1.0, -1.6, 2.5, 6), sq: wob(t, 1.0, -0.1, 2.5, 6) };
      P.pos('root', 0, Math.max(0, h.y), 0).sq('body', h.sq * 0.7);
      if (h.y < 0) { P.pos('body', 0, h.y, 0); legs(P, h.y); }
      const up = seg(t, 0.15, 0.35, E.back);
      P.rot('armR', 0, 0, -160 * up + wave(t, 3) * 8 * up).rot('armL', 0, 0, 160 * up - wave(t, 3) * 8 * up);
      P.face('eyes', t < 1.0 ? 'happy' : t > 1.4 ? 'wink' : 'shut'); mouth(P, t < 0.3 ? 'zip' : 'grin');
      P.burst(1.0, GDFX.shock, 'root', [0, 1, 0], { scale: 2 }).burst(1.0, 'dust', 'root', [0, 0, 0], { n: 14, spread: 1 }).burst(1.05, GDFX.heart, 'fins', TOP, { n: 14, speed: 1.4 }).burst(1.2, 'sparkle', 'fins', TOP, { n: 10 });
    } },
    // asleep: sat down heavily, slumped, the zipper fluttering open on every snore, motes bubbling out
    sleep: { len: 3.6, loop: true, f(P, t) {
      const br = Math.sin((t / 3.6) * TAU);
      P.pos('body', 0, -3.4 + br * 0.3, 0).sq('body', -0.04 + br * 0.025).rot('body', 8, 0, 4); legs(P, -3.4);
      P.rot('footR', -20, -16, 0).rot('footL', -20, 16, 0).pos('footR', 0, 0, 2).pos('footL', 0, 0, 2).rot('armR', 0, 0, 14).rot('armL', 0, 0, -14);
      P.face('eyes', 'closed'); mouth(P, br > 0.4 ? 'half' : 'zip'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      if (br > 0.4) P.stream(GDFX.rad, 'body', CORE, { rate: 4, spread: 0.6, speed: 0.4 });
      P.burst(0.4, 'z', 'body', [8, 40, 8], { scale: 1.6 }).burst(2.2, 'z', 'body', [8, 40, 8], { scale: 1.6 });
    } },
    // the dance: a heavy punk stomp — alternating stomps that shake the ground, fist pumps, a full
    // windmill on an air guitar, headbangs, then a jump that cracks the floor and a fist in the air
    dance: { len: 2.8, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const b = beat(t, 0.35), n = b.n, live = 1 - seg(t, 2.1, 2.2), sd = n % 2 ? 1 : -1, lift = Math.sin(b.ph * Math.PI) * live;
      const foot = sd > 0 ? 'L' : 'R';
      P.pos('foot' + foot, 0, 2.4 * lift, 0).pos('leg' + foot, 0, 2.0 * lift, 0).pos('body', 0, -1.0 * b.pulse * live, 0).sq('body', -0.05 * b.pulse * live);
      legs(P, -1.0 * b.pulse * live);
      P.rot('body', 8 * b.pulse * live, sd * 6 * live, sd * 4 * live).rot('fins', 6 * b.pulse * live, 0, 0);
      if (n < 4) P.rot(sd > 0 ? 'armL' : 'armR', 0, 0, sd * 150 * b.pulse * live);
      else { const wm = seg(t, 1.4, 2.1, E.inout); P.rot('armR', -360 * 2 * wm, 0, -20).rot('armL', -30, 0, 50 * live); }
      const jump = bump(t, 2.1, 2.45), land = seg(t, 2.45, 2.55, E.back);
      P.pos('root', 0, 5 * jump, 0).sq('body', wob(t, 2.45, -0.14, 3, 6));
      P.rot('armR', 0, 0, -165 * land).rot('armL', 0, 0, 30 * land);
      P.face('eyes', t > 2.5 ? 'wink' : b.pulse > 0.5 ? 'shut' : 'happy'); mouth(P, t > 2.45 ? 'grin' : b.pulse > 0.5 ? 'open' : 'half');
      for (let k = 0; k < 6; k++) P.burst(k * 0.35 + 0.01, 'dust', k % 2 ? 'footL' : 'footR', [k % 2 ? 5.6 : -5.6, 0.4, 2], { n: 3 });
      for (const k of [0, 2, 4]) P.burst(k * 0.35 + 0.02, 'note', 'body', [k % 4 ? -12 : 12, 34, 6], { scale: 1.4 });
      P.burst(2.46, GDFX.shock, 'root', [0, 1, 0], { scale: 2.4 }).burst(2.46, 'dust', 'root', [0, 0, 0], { n: 12, spread: 1 }).burst(2.5, 'sparkle', 'fins', TOP, { n: 8 });
    } },
    // signature: it unzips, the core lights up and it starts COUNTING DOWN — three beeps, swelling and
    // sweating harder each time — … and then a sad little "pfft": a smoke ring and a few hearts. It
    // deflates, shrugs, zips up and gives you a smug look like it meant to do that.
    countdown: { len: 3.8, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      mouth(P, t < 0.25 ? 'zip' : t < 0.5 ? 'half' : t < 2.3 ? 'open' : t < 2.9 ? 'half' : t < 3.2 ? 'grin' : 'zip');
      let swell = 0, flash = 0;
      for (const [i, b0] of [[0, 0.7], [1, 1.25], [2, 1.8]]) { const k = bump(t, b0, b0 + 0.25); flash = Math.max(flash, k); swell = Math.max(swell, seg(t, b0, b0 + 0.1) * (0.06 + 0.04 * i)); P.burst(b0, GDFX.shock, 'body', CORE, { scale: 0.6 + 0.3 * i }).burst(b0, GDFX.rad, 'body', CORE, { n: 8 + 6 * i, speed: 1.4 }); }
      const pfft = seg(t, 2.25, 2.4, E.out), shrug = env(t, 2.6, 3.3, 0.15, 0.2);
      swell *= 1 - pfft;
      P.scl('body', 1 + swell + 0.03 * flash - 0.06 * pfft * (1 - seg(t, 2.5, 2.8))).rot('body', 0, 0, wave(t, 12 + 10 * seg(t, 0.7, 2.1)) * 2.4 * seg(t, 0.6, 0.8) * (1 - pfft));
      eyesScale(P, 1 + 0.2 * flash, 1 + 0.3 * flash);
      P.rot('armR', -20 * shrug, 0, -70 * shrug).rot('armL', -20 * shrug, 0, 70 * shrug).rot('handR', 0, 0, -50 * shrug).rot('handL', 0, 0, 50 * shrug).pos('body', 0, 0.8 * shrug, 0);
      P.face('eyes', t < 0.5 ? 'smug' : t < 2.25 ? (t > 1.8 ? 'shock' : 'wide') : t < 2.6 ? 'sad' : shrug > 0.3 ? 'closed' : 'smug');
      for (const b0 of [1.3, 1.85, 2.0]) P.burst(b0, 'sweat', 'body', [12, 26, 6], { n: 2, scale: 1.5 });
      P.burst(2.28, 'smoke', 'fins', TOP, { n: 3, scale: 0.7 }).burst(2.3, GDFX.heart, 'fins', TOP, { n: 5, speed: 0.6 }).burst(3.3, 'sparkle', 'body', [10, 30, 10], { n: 4 });
    } },
    // fidget: flicks the heart ring hanging off its fin so it spins like a top, then catches it dead
    twirl: { len: 2.4, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const reach = env(t, 0.1, 1.9, 0.3, 0.3), flick = bump(t, 0.5, 0.65);
      P.rot('armL', -10 * reach, 0, 175 * reach - 20 * flick).scl('armL', 1, 1 + 0.45 * reach, 1).rot('body', 0, -10 * reach, -4 * reach);
      P.rot('ring', 0, 1080 * seg(t, 0.6, 1.6, E.out), 0);
      eyesAt(P, 0.5 * reach, 0.4 * reach);
      P.face('eyes', t < 1.6 ? 'smug' : t < 1.9 ? 'happy' : undefined); mouth(P, t > 0.6 && t < 1.9 ? 'grin' : 'zip');
      P.burst(0.6, 'spark', 'ring', RING, { n: 1 }).burst(1.65, 'sparkle', 'ring', RING, { n: 5 });
    } },
    // the self-destruct (Last Night on Earth): it plants its feet, unzips, counts down… and goes
    // nuclear. Mushroom cloud, shockwave, the fins blown off their seat — and it ends knocked out.
    nuke: { len: 3.6, next: 'down', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const brace = seg(t, 0, 0.4) * (1 - seg(t, 1.9, 1.95)), shake = seg(t, 0.5, 1.9);
      P.pos('body', 0, -1.8 * brace, 0).scl('body', 1 + 0.12 * shake * (1 - seg(t, 1.9, 1.95))).rot('body', 0, 0, wave(t, 10 + 14 * shake) * 3 * shake * (t < 1.9 ? 1 : 0)); legs(P, -1.8 * brace);
      for (const b0 of [0.6, 1.05, 1.5]) P.burst(b0, GDFX.shock, 'body', CORE, { scale: 0.8 }).burst(b0, GDFX.rad, 'body', [0, 22, 0], { n: 14, speed: 1.6 });
      const det = seg(t, 1.9, 2.0, E.out) * (1 - seg(t, 2.2, 2.6)), fall = seg(t, 2.3, 2.8, E.bounce);
      P.sq('body', -0.3 * det).pos('fins', 0, 6 * det, 0).rot('fins', 14 * det, 0, -10 * det).scl('hair', 1 + 0.5 * det);
      P.rot('armR', 0, 0, -150 * det).rot('armL', 0, 0, 150 * det);
      toppled(P, fall);
      P.face('eyes', t < 0.5 ? 'angry' : t < 1.9 ? 'wide' : t < 2.3 ? 'x' : 'swirl'); mouth(P, t < 0.3 ? 'half' : t < 2.3 ? 'open' : 'zip');
      if (shake > 0.1 && t < 1.9) P.stream(GDFX.rad, 'body', CORE, { rate: 40 * shake, spread: 0.8, speed: 1.8 });
      P.burst(1.92, GDFX.nuke, 'body', [0, 22, 0], { scale: 6 }).burst(1.92, GDFX.shock, 'root', [0, 1, 0], { scale: 5 }).burst(1.94, GDFX.mushroom, 'body', [0, 40, 0], { scale: 4 });
      P.burst(1.95, 'smoke', 'body', [0, 20, 0], { n: 24, spread: 1, speed: 2.4, scale: 2 }).burst(1.95, GDFX.bits, 'body', [0, 22, 0], { n: 20, speed: 2.4 }).burst(1.96, 'dust', 'root', [0, 0, 0], { n: 20, spread: 1, speed: 2 });
      if (t > 2.2) P.stream('smoke', 'fins', TOP, { rate: 4, scale: 1.4 });
    } },
  },
};
def.anim = anim;
