// Hawkabunga — the Surfer branch of Talonaka (a Masayoshi Takanaka homage). A lean, laid-back bald eagle riding
// the famous surfboard guitar: a long sunset-orange board whose deck IS the guitar — strings down the stringer,
// three pickups, a chrome bridge, a little headstock at the nose and blue fins under the tail. It surfs in a
// low stance, wings out for balance, long shaggy sun-bleached mop streaming back, a coral aloha shirt flapping
// open over a bare chest and teal hibiscus board shorts (Talonaka's old shirt print). Droopy, chill eyes with
// whites and a sea-green iris. Signature fidget: "board solo" — it hops off, stands the board on its tail,
// leans on it and shreds the strings, then drops it back on the wave; a kick-flip; dance: a hula surf groove.
import { E, seg, bump, wob, wave, hop } from '../anim.js';
import { shade, ramp, shift } from './kit.js';
import { eyeRig, eyesAt, glance, keepEyes } from './eyes.js';
import { B, L, both, twin, acc, goldP, chainP, GOLD, strapP, beat, env } from './story_parts.js';
import { TK, HAIR_FORM, brownP, chestP, headP, faceP, lockP, beakP, hookP, cereP, jawP, footP, toeP, pantsP, wingP, primP, tailP, aloha, boardP, finP, headstockP, sleeveP, vinylP, goldDiscP, leiP, clothP, TKFX, eagleForm, EYE_SURFER } from './takanaka_parts.js';

const shirt = aloha({ base: '#ff7a52', hi: '#ffa070', lo: '#c84a30', flower: '#ffffff', flowerHi: '#ffffff', flowerLo: '#ffd0c0', center: '#ffd23a', leaf: '#1fb0aa', seed: 11 });
const shorts = aloha({ base: TK.sea, seed: 5, cell: 3.0 });
const board = boardP();
const HAIR = { ...TK.hair, tip: '#c8a070' }, HAIR_R = { ...HAIR, ragged: true };
const shadesP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face !== 'south' ? '#14141c' : y === 0 ? '#2a2a38' : ramp(['#5adcd0', '#1f8aa8', '#16306a'], y / Math.max(1, h - 1), x, y)); if (face === 'south') { p.px(2, 1, '#ffffff').px(3, 1, '#ffffff').px(w - 4, 1, '#ffffff'); } };
const toothP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'down' ? '#c8c0a8' : Math.abs(x + 0.5 - w / 2) > (w / 2) * (1 - y / h) + 0.3 ? 0 : y < 1 ? '#d8d0b8' : '#fffaf0'); };
const cordP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 3 ? '#3a2a1a' : '#6a4a2a'); };
const visorBandP = (p, w, h, face) => { clothP(p, w, h, face); if (face === 'south') for (let x = 0; x < w; x++) p.px(x, h - 1, TK.sea); };

// ---------------------------------------------------------------- the model
const B0 = 2.6;                                        // the deck height: everything the rider has stands on it
const FOOT = (x, z) => [
  B([x - 2.0, B0, z - 1.2], [4.0, 1.2, 3.4], footP),
  B([x - 2.3, B0, z + 1.8], [1.3, 1.1, 2.6], toeP, { pivot: [x - 1.65, B0 + 0.5, z + 2.0], rot: [0, -14, 0] }),
  B([x - 0.65, B0, z + 2.0], [1.3, 1.2, 3.0], toeP),
  B([x + 0.9, B0, z + 1.8], [1.3, 1.1, 2.6], toeP, { pivot: [x + 1.55, B0 + 0.5, z + 2.0], rot: [0, 14, 0] }),
];
const LEGC = (x, z) => [B([x - 1.8, B0 + 5.8, z - 1.8], [3.6, 4.2, 3.6], shorts), B([x - 1.4, B0 + 1.2, z - 1.4], [2.8, 4.8, 2.8], pantsP)];
const ARM = [B([-9.8, 15.4 + B0, -2.8], [3.0, 5.4, 5.6], shirt)];
const HAND = [
  B([-9.6, 10.6 + B0, -2.4], [2.4, 5.4, 4.8], wingP),
  B([-9.5, 8.0 + B0, -2.0], [2.2, 3.0, 1.4], primP), B([-9.5, 7.6 + B0, -0.4], [2.2, 3.4, 1.4], primP), B([-9.5, 8.0 + B0, 1.2], [2.2, 3.0, 1.4], primP),
];
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-3.3, 26.6 + B0, 5.44], line: '#1a1010', iris: '#2ac8b8', irisDark: '#127a78', accent: '#8af0e0', pupilColor: '#0c1a1a', extra: ['smug'], map: EYE_SURFER });
const SH = B([-6.0, 25.2 + B0, 5.6], [12.0, 3.0, 0.5], shadesP);
export const def = {
  name: 'hawkabunga', ppu: 3, scale: 0.5, outline: { color: '#1a0e0c', px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    // the ride: everything that surfs (the rider and the board) tilts with the wave
    { name: 'ride', parent: 'root', pivot: [0, 2, 0], cubes: [] },
    { name: 'board', parent: 'ride', pivot: [0, 2, 0], cubes: [
      B([-5.0, 1.4, -14.0], [10.0, 1.3, 28.0], board),
      B([-3.8, 1.5, 13.8], [7.6, 1.1, 3.4], board, { pivot: [0, 2.0, 13.8], rot: [-10, 0, 0] }),
      B([-2.2, 1.65, 17.0], [4.4, 0.9, 1.8], board, { pivot: [0, 2.0, 13.8], rot: [-10, 0, 0] }),
      B([-4.0, 1.4, -16.6], [8.0, 1.3, 2.6], board),
      B([-1.3, 2.4, 18.4], [2.6, 0.7, 2.8], headstockP, { pivot: [0, 2.0, 13.8], rot: [-16, 0, 0] }),
      B([-0.3, 0.0, -16.2], [0.6, 1.4, 2.8], finP), ...both(B([-3.4, 0.2, -15.0], [0.5, 1.2, 2.2], finP)),
    ] },
    { name: 'footR', parent: 'ride', pivot: [-2.8, B0 + 1.0, -2.8], rot: [0, -16, 0], cubes: FOOT(-2.8, -2.8) },
    { name: 'footL', parent: 'ride', pivot: [2.8, B0 + 1.0, 3.0], rot: [0, 16, 0], cubes: FOOT(2.8, 3.0) },
    { name: 'legR', parent: 'ride', pivot: [-2.8, B0 + 9.6, -2.8], cubes: LEGC(-2.8, -2.8) },
    { name: 'legL', parent: 'ride', pivot: [2.8, B0 + 9.6, 3.0], cubes: LEGC(2.8, 3.0) },
    { name: 'body', parent: 'ride', pivot: [0, B0 + 9, 0], cubes: [
      B([-6.6, B0 + 8.4, -5.2], [13.2, 13, 10.4], brownP, { faces: { south: chestP } }),
      B([-6.9, B0 + 7.2, -5.5], [13.8, 3.4, 11.0], shorts),
      B([-0.4, B0 + 8.0, 5.5], [0.8, 2.0, 0.2], cordP),
      // the open coral aloha shirt: back, sides, shoulders (the front flaps hang on their own bones)
      B([-7.1, B0 + 10.0, -5.8], [14.2, 11.8, 0.6], shirt),
      ...both(B([-7.1, B0 + 10.0, -5.2], [0.6, 11.8, 10.6], shirt)),
      B([-7.1, B0 + 21.2, -5.8], [14.2, 0.6, 11.2], shirt),
      // tier 1 (or): a shark-tooth on a cord
      ...acc('acc-tooth', [...both(B([-4.0, B0 + 18.4, 5.2], [4.2, 0.5, 0.4], cordP, { pivot: [-4.0, B0 + 18.65, 5.4], rot: [0, 0, -36] })), B([-0.7, B0 + 14.6, 5.25], [1.4, 2.4, 0.3], toothP)]),
      // tier 3 (or): the album went gold — a gold record on a heavy chain
      ...acc('acc-golddisc', [...both(B([-4.6, B0 + 18.2, 5.3], [5.0, 0.7, 0.5], chainP, { pivot: [-4.6, B0 + 18.55, 5.55], rot: [0, 0, -40] })), B([-2.2, B0 + 10.6, 5.6], [4.4, 4.4, 0], goldDiscP, { plane: 'z' })]),
    ] },
    ...twin({ name: 'flapR', parent: 'body', pivot: [-5.0, B0 + 21.6, 5.4], cubes: [B([-7.1, B0 + 10.0, 5.2], [4.0, 11.8, 0.6], shirt), B([-5.4, B0 + 18.8, 5.6], [2.6, 3.0, 0.4], shirt, { pivot: [-4.1, B0 + 21.6, 5.8], rot: [0, 0, -18] })] }),
    // the album (tier 2, or): the sunset sleeve worn like a backpack, the vinyl peeking over the shoulder
    { name: 'album', parent: 'body', pivot: [0, B0 + 21, -6.2], cubes: acc('acc-album', [
      B([-4.2, B0 + 10.6, -7.0], [8.4, 8.4, 0.8], sleeveP, { faces: { north: (p, w, h) => sleeveP(p, w, h, 'south') } }),
      B([-2.4, B0 + 16.4, -6.6], [5.6, 5.6, 0], vinylP, { plane: 'z', outline: false }),
      ...both(B([-4.6, B0 + 12.0, -6.4], [0.6, 9.6, 0.5], strapP('#3a2a1a'))),
    ]) },
    { name: 'tail', parent: 'body', pivot: [0, B0 + 10.4, -5.6], cubes: [
      B([-2.8, B0 + 8.8, -10.0], [5.6, 1.3, 5.0], tailP, { pivot: [0, B0 + 9.4, -5.8], rot: [20, 0, 0] }),
      ...both(B([-4.8, B0 + 8.9, -9.4], [2.4, 1.1, 4.4], tailP, { pivot: [-2.4, B0 + 9.4, -5.8], rot: [18, -20, 0] })),
    ] },
    // wings spread for balance, with elbows
    ...twin({ name: 'wingR', parent: 'body', pivot: [-7.0, B0 + 20.4, 0.4], rot: [0, 0, -42], cubes: ARM }),
    ...twin({ name: 'handR', parent: 'wingR', pivot: [-8.4, B0 + 15.6, 0.4], rot: [0, 0, -18], cubes: HAND }),
    { name: 'head', parent: 'body', pivot: [0, B0 + 21.6, 0.3], cubes: [
      B([-6.0, B0 + 21.2, -5.2], [12, 10.2, 10.6], headP, { faces: { south: faceP } }),
      B([-6.6, B0 + 22.8, -4.4], [13.2, 6.4, 9.0], headP),
      B([-1.6, B0 + 24.0, 5.2], [3.2, 1.2, 1.0], cereP),
      B([-1.9, B0 + 21.9, 5.4], [3.8, 2.7, 1.9], beakP),
      B([-1.5, B0 + 21.8, 7.3], [3.0, 2.5, 1.5], beakP),
      B([-0.95, B0 + 20.2, 8.1], [1.9, 2.5, 1.2], hookP, { pivot: [0, B0 + 22.5, 8.6], rot: [30, 0, 0] }),
      // tier 1 (or): wraparound surf shades with a teal mirror
      ...acc('acc-shades', [SH, ...both(B([-6.9, B0 + 26.6, -3.6], [0.5, 0.6, 9.4], shade('#14141c')))]),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, B0 + 22.0, 5.6], cubes: [B([-1.5, B0 + 21.0, 5.4], [3.0, 1.0, 2.4], jawP)] },
    ...EYES.bones,
    // the mop: a swept fringe, crown locks, and a long mane streaming back (on its own spring)
    { name: 'mop', parent: 'head', pivot: [0, B0 + 31.4, 0], cubes: [
      B([-6.5, B0 + 31.0, -5.8], [13, 1.8, 11.8], lockP(HAIR)),
      B([-6.2, B0 + 32.0, -4.0], [4.0, 2.0, 9.2], lockP(HAIR), { pivot: [-4.2, B0 + 32.2, 0.6], rot: [0, 0, 12] }),
      B([-2.0, B0 + 32.3, -4.8], [4.0, 2.2, 10.0], lockP(HAIR), { pivot: [0, B0 + 32.4, 0.2], rot: [-8, 0, -3] }),
      B([2.2, B0 + 32.0, -4.0], [4.0, 2.0, 9.2], lockP(HAIR), { pivot: [4.2, B0 + 32.2, 0.6], rot: [0, 0, -12] }),
      B([-6.2, B0 + 29.0, 5.4], [12.4, 2.4, 0.6], lockP(HAIR_R), { pivot: [0, B0 + 31.2, 5.7], rot: [0, 0, -7] }),
      ...both(B([-7.2, B0 + 22.6, -4.6], [0.6, 8.8, 9.0], lockP(HAIR_R))),
      // dripped (or): a white sun visor with a hibiscus
      ...acc('acc-visor', [B([-6.4, B0 + 30.2, -5.8], [12.8, 1.4, 11.8], visorBandP), B([-5.6, B0 + 30.2, 5.8], [11.2, 0.5, 3.2], clothP, { pivot: [0, B0 + 30.4, 6.0], rot: [-8, 0, 0] }), B([4.0, B0 + 30.4, 5.9], [2.2, 2.2, 0.6], leiP)]),
      // ultra (or): a crown of hibiscus
      ...acc('acc-crown', [B([-6.6, B0 + 32.0, 5.0], [13.2, 1.6, 1.4], leiP), B([-6.6, B0 + 32.0, -6.2], [13.2, 1.6, 1.4], leiP), ...both(B([-7.4, B0 + 32.0, -6.2], [1.4, 1.6, 12.6], leiP))]),
    ] },
    { name: 'mane', parent: 'mop', pivot: [0, B0 + 31.0, -5.4], cubes: [
      B([-6.4, B0 + 20.4, -6.4], [12.8, 11.0, 1.2], lockP(HAIR_R)),
      B([-5.0, B0 + 18.6, -7.0], [10.0, 4.0, 1.0], lockP(HAIR_R), { pivot: [0, B0 + 21, -6.4], rot: [-14, 0, 0] }),
    ] },
  ],
  drip: [
    [{ id: 'acc-shades', name: 'Wraparound surf shades' }, { id: 'acc-tooth', name: 'Shark-tooth cord' }],
    [{ id: 'acc-album', name: 'The album (backpack sleeve)' }, { id: 'acc-visor', name: 'Hibiscus sun visor' }],
    [{ id: 'acc-golddisc', name: 'Gold record chain' }, { id: 'acc-crown', name: 'Hibiscus crown' }],
  ],
  attach: {
    head: { bone: 'mop', at: [0, B0 + 34, 0], size: 12 },
    face: { bone: 'head', at: [0, B0 + 26.6, 5.6], size: 12 },
    neck: { bone: 'body', at: [0, B0 + 20.6, 5.4], size: 10 },
    back: { bone: 'body', at: [0, B0 + 15, -6.2], size: 11 },
  },
};
// the form: black lacquer plumage and shorts, the coral shirt black with gold flowers, a gold-railed black board
// whose sunset paint turns rose gold, white face kept, the mop streaked with gold
const SHIRT = new Set(['#ff7a52', '#ffa070', '#c84a30']);
def.dripForm = { map: keepEyes(EYES, (c, glow) => (c === '#c8a070' ? '#d8a83a' : HAIR_FORM[c] || (SHIRT.has(c) ? '#1a1418' : eagleForm(c, glow)))) };

// ---------------------------------------------------------------- animation
const LEG = 7.6, MOUTH = [0, B0 + 21.6, 9.6], TOP = [0, B0 + 35, 0], TAILW = [0, 2, -17], NOSE = [0, 2, 17];
function arms(P, shR, elR, shL = [0, 0, 0], elL = [0, 0, 0]) { P.rot('wingR', ...shR).rot('handR', ...elR).rot('wingL', ...shL).rot('handL', ...elL); }
// knees: sink the rider by dy (legs squash, feet stay on the deck)
function knees(P, dy) { P.pos('body', 0, dy, 0); for (const s of ['legR', 'legL']) { P.pos(s, 0, dy, 0); P.scl(s, 1, Math.max(0.4, (LEG + dy) / LEG), 1); } }
// riding the swell: the board pitches and rolls, the rider counter-balances
function swell(P, t, k = 1) {
  P.rot('ride', wave(t, 0.5) * 4 * k, wave(t, 0.25) * 6 * k, wave(t, 0.5, 1.4) * 5 * k).pos('ride', 0, (0.6 + wave(t, 0.5, 0.6) * 0.6) * k, 0);
  P.rot('body', 0, -wave(t, 0.25) * 4 * k, -wave(t, 0.5, 1.4) * 4 * k);
}
function fallBack(P, k) {
  P.rot('ride', -10 * k, 0, 30 * k).pos('ride', 0, -1 * k, 0);
  P.rot('body', -70 * k, 0, -20 * k).pos('body', 0, -6 * k, -6 * k);
  arms(P, [0, 0, -30 * k], [0, 0, -20 * k], [0, 0, 30 * k], [0, 0, 20 * k]);
  P.rot('legR', -60 * k).rot('legL', -50 * k).pos('legR', 0, -2 * k, 2 * k).pos('legL', 0, -2 * k, 2 * k).rot('head', 16 * k, 0, 20 * k).rot('jaw', 24 * k);
}
// the board stood up on its tail at the rider's right, deck to the front: the rider steps off onto the sand
function boardUp(P, k) {
  P.rot('board', 90 * k, 180 * k, -8 * k).pos('board', -13 * k, 15.4 * k, 2 * k);
  P.pos('ride', 0, -B0 * k, 0).rot('body', 0, 18 * k, 0);
}
export const anim = {
  start: 'idle', seed: 61,
  breathe: { bone: 'body', amp: 0.016, per: 2.4 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.4, 5.0], dur: 0.14 },
  look: { bone: 'head', yaw: 26, pitch: 10, speed: 5 },
  springs: [
    { bone: 'mop', tip: [0, 0, -3], k: 170, d: 8, gain: 0.7, max: 12, axes: [1, 0.2, 1] },
    { bone: 'mane', tip: [0, -8, -1], k: 110, d: 6, gain: 1.2, max: 26, axes: [1, 0.2, 1] },
    { bone: 'flapR', tip: [0, -10, 0], k: 120, d: 6, gain: 1.1, max: 22, axes: [1, 0.3, 1] },
    { bone: 'flapL', tip: [0, -10, 0], k: 120, d: 6, gain: 1.1, max: 22, axes: [1, 0.3, 1] },
    { bone: 'tail', tip: [0, 0, -5], k: 170, d: 8, gain: 0.7, max: 14 },
    { bone: 'album', tip: [0, -8, 0], k: 160, d: 8, gain: 0.6, max: 10, axes: [1, 0, 1] },
  ],
  faces: { eyes: EYES.slot },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'shred', 'kickflip'] },
  clips: {
    // riding a gentle swell: knees soak the bumps, wings balance, the mane and shirt flap in the wind
    idle: { len: 4.0, loop: true, f(P, t, c) {
      swell(P, t); knees(P, -1.2 - wave(t, 0.5, 0.6) * 0.5);
      arms(P, [wave(t, 0.5) * 6, 0, -wave(t, 0.5, 1.4) * 10], [0, 0, wave(t, 1) * 6], [-wave(t, 0.5) * 6, 0, -wave(t, 0.5, 1.4) * 10], [0, 0, -wave(t, 1) * 6]);
      P.rot('flapR', -8 + wave(t, 3) * 4, 0, 10).rot('flapL', -8 + wave(t, 3, 1) * 4, 0, -10).rot('mane', -10 + wave(t, 2) * 3, 0, 0);
      eyesAt(P, ...glance(t + c.loopN * 1.9, [[0, 0], [0.3, 0], [0, 0], [-0.3, 0.05]], 0.8));
      P.stream('splash', 'board', TAILW, { rate: 8, dir: [0, 0.8, -0.6], speed: 0.8, spread: 0.5 });
      if (c.loopN % 2 === 1 && t > 2.4 && t < 3.6) P.face('eyes', 'smug');
    } },
    // gliding: no steps, the board carves left and right throwing spray
    walk: { len: 1.2, loop: true, f(P, t) {
      const s = Math.sin((t / 1.2) * Math.PI * 2);
      P.rot('ride', -4, s * 10, s * 10).pos('ride', 0, 0.8 + Math.abs(s) * 0.3, 0); knees(P, -1.6 + Math.abs(s) * 0.6);
      P.rot('body', 0, -s * 8, -s * 6); arms(P, [0, 0, -s * 14], [0, 0, 0], [0, 0, -s * 14], [0, 0, 0]);
      P.rot('flapR', -16, 0, 14).rot('flapL', -16, 0, -14).rot('mane', -18, 0, 0);
      P.stream('splash', 'board', TAILW, { rate: 22, dir: [s, 0.7, -0.6], speed: 1.4, spread: 0.5 });
    } },
    // signature: the board solo — hop off, stand the board on its tail, lean on it and shred the deck strings
    shred: { len: 4.0, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 1 - env(t, 0.1, 3.8);
      const off = env(t, 0.1, 3.5, 0.45, 0.4), h = bump(t, 0.1, 0.55) * 4 + bump(t, 3.1, 3.5) * 3;
      boardUp(P, off); P.pos('root', 0, h, 0);
      const play = env(t, 0.6, 3.1, 0.2, 0.2), fast = t > 1.1 && t < 2.6 ? Math.abs(Math.sin(t * Math.PI * 9)) : 0;
      arms(P, [-30 * play, 0, -30 * play], [-60 * play + 16 * fast, 0, 60 * play], [-10 * play, 0, 20 * play], [-40 * play, 0, -20 * play]);
      P.rot('body', -8 * play, 0, 8 * play).rot('head', -16 * play + wave(t, 4) * 4 * play, -14 * play, 10 * play).rot('jaw', 16 * play);
      P.face('eyes', play > 0.4 ? (t < 2.7 ? 'closed' : 'happy') : t > 3.4 ? 'smug' : undefined);
      if (t > 1.0 && t < 2.7) P.stream('note', 'board', [0, 4, 0], { rate: 8, spread: 0.8, speed: 0.7 });
      P.burst(2.6, 'sparkle', 'board', [0, 4, 0], { n: 10 }).burst(2.6, TKFX.hibiscus, 'head', TOP, { n: 6 }).burst(3.45, 'splash', 'root', [0, 1, 0], { n: 22, speed: 1.8, spread: 1 }).burst(3.45, TKFX.wave, 'root', [0, 1, 0], { n: 6 });
    } },
    // a kick-flip: crouch, pop, the board spins a full turn under the airborne rider, land with a splash
    kickflip: { len: 1.8, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const h = hop(Math.min(t, 1.0), 1.0, 9, { crouch: 1.6, air: [0.25, 0.75] }), air = seg(t, 0.25, 0.75, E.inout);
      P.pos('ride', 0, Math.max(0, h.y), 0); knees(P, Math.min(0, h.y) - 0.6 * (1 - air));
      P.rot('board', 0, 0, 360 * air).pos('board', 0, -2.4 * bump(t, 0.25, 0.75), 0);
      arms(P, [0, 0, -30 * bump(t, 0.2, 0.8)], [0, 0, -20 * bump(t, 0.2, 0.8)], [0, 0, -30 * bump(t, 0.2, 0.8)], [0, 0, 20 * bump(t, 0.2, 0.8)]);
      P.rot('body', 10 * bump(t, 0.25, 0.75), 0, 0).rot('mane', -20 * bump(t, 0.25, 0.8), 0, 0);
      const shaka = seg(t, 1.05, 1.2, E.back) * (1 - seg(t, 1.6, 1.8));
      arms(P, [0, 0, 0], [0, 0, 0], [-60 * shaka, 0, -40 * shaka], [-40 * shaka, 60 * shaka, 0]);
      P.face('eyes', air > 0.2 && air < 0.9 ? 'shock' : shaka > 0.4 ? 'wink' : undefined);
      P.burst(0.25, 'splash', 'board', TAILW, { n: 12, speed: 1.4 }).burst(0.78, 'splash', 'root', [0, 1, 0], { n: 22, speed: 1.8, spread: 1 }).burst(0.78, TKFX.wave, 'root', [0, 1, 0], { n: 6 }).burst(1.15, 'sparkle', 'handL', [9, B0 + 8, 2], { n: 4 });
    } },
    // the dance: a hula surf groove — hips swaying on the board, wings rolling like waves, ends in a double shaka
    dance: { len: 3.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const live = 1 - seg(t, 2.3, 2.45), sw = Math.sin((t / 0.6) * Math.PI * 2) * live, b = beat(t, 0.3);
      P.rot('ride', 0, sw * 6, sw * 4).pos('ride', 0, 0.8, 0); knees(P, -1.6 - 0.8 * b.pulse * live);
      P.rot('body', 0, sw * 10, -sw * 8).pos('body', sw * 1.2, 0, 0);
      const wv = (ph) => Math.sin((t / 0.6) * Math.PI * 2 + ph) * live;
      arms(P, [-30 * live, 0, -20 * live + 20 * wv(0)], [0, 0, 30 * wv(1)], [-30 * live, 0, 20 * live - 20 * wv(Math.PI)], [0, 0, -30 * wv(Math.PI + 1)]);
      P.rot('head', 6 * b.pulse * live, -sw * 10, sw * 8).rot('mane', -8 * live, 0, sw * 10);
      const fin = seg(t, 2.4, 2.6, E.back);
      arms(P, [-70 * fin, 0, -30 * fin], [-30 * fin, -60 * fin, 0], [-70 * fin, 0, 30 * fin], [-30 * fin, 60 * fin, 0]);
      P.face('eyes', t > 2.5 ? 'wink' : b.pulse > 0.5 ? 'happy' : 'smug');
      P.burst(0.05, 'note', 'head', [6, B0 + 34, 2], {}).burst(0.65, TKFX.hibiscus, 'head', TOP, { n: 2 }).burst(1.25, 'note', 'head', [-6, B0 + 34, 2], {}).burst(1.85, TKFX.hibiscus, 'head', TOP, { n: 2 }).burst(2.5, 'sparkle', 'head', TOP, { n: 8 });
      P.stream('splash', 'board', TAILW, { rate: 6, dir: [0, 0.8, -0.6], speed: 0.8 });
    } },
    // battle cry: rises tall on the board, wings flung wide, a screech and a wall of spray
    cry: { len: 2.0, next: 'idle', f(P, t) {
      P.lookW = 1 - seg(t, 0.2, 0.3); P.blinkOK = false;
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.42, E.out)), up = seg(t, 0.34, 0.5, E.back) * (1 - seg(t, 1.5, 1.85, E.inout));
      knees(P, -1.2 - 1.6 * crouch + 0.6 * up); P.rot('ride', -6 * up, 0, 0);
      P.rot('body', -8 * up, 0, 0).rot('head', 10 * crouch - 26 * up, 0, 0).rot('jaw', 42 * up).rot('mane', -20 * up, 0, 0);
      arms(P, [0, 0, -30 * up], [0, 0, -20 * up], [0, 0, -30 * up], [0, 0, 20 * up]);
      P.face('eyes', crouch > 0.3 || up > 0.3 ? 'angry' : undefined);
      for (const r0 of [0.5, 0.7, 0.9]) P.burst(r0, 'ring', 'head', MOUTH, { scale: 1.1, tint: '#c0fff4' });
      P.burst(0.5, 'splash', 'root', [0, 1, 0], { n: 26, speed: 2, spread: 1 }).burst(0.52, TKFX.wave, 'root', [0, 1, 4], { n: 8, speed: 1.2 });
    } },
    // physical: a carving board-slam — the board swings round like a bat
    attack: { len: 1.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const bk = seg(t, 0, 0.3, E.out) * (1 - seg(t, 0.3, 0.38, E.in)), hit = seg(t, 0.32, 0.44, E.in3) * (1 - seg(t, 0.56, 0.95, E.inout));
      P.pos('root', 0, 0, -1.6 * bk + 5 * hit).rot('ride', -8 * bk + 10 * hit, 30 * bk - 50 * hit, -10 * bk + 14 * hit); knees(P, -1.6 * bk - 1.2);
      arms(P, [0, 0, -20 * bk], [0, 0, -10 * bk], [0, 0, -40 * hit], [0, 0, 20 * hit]);
      P.face('eyes', bk > 0.2 || hit > 0.2 ? 'angry' : undefined);
      P.burst(0.44, 'spark', 'board', NOSE, { scale: 1.3 }).burst(0.44, 'star', 'board', NOSE, { n: 5 }).burst(0.44, 'splash', 'board', NOSE, { n: 16, speed: 1.8 });
    } },
    // special: rides up a breaking wave — the board climbs, a curling wall of water rolls out ahead
    special: { len: 2.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const climb = env(t, 0.1, 1.6, 0.4, 0.4), drop = seg(t, 0.7, 0.85, E.in) * (1 - seg(t, 1.3, 1.8, E.inout));
      P.pos('ride', 0, 4 * climb, 0).rot('ride', -20 * climb + 28 * drop, 0, 10 * climb); knees(P, -1.2 - 1.6 * drop);
      arms(P, [0, 0, -20 * climb], [0, 0, 0], [-30 * drop, 0, 0], [0, 0, 0]);
      P.rot('mane', -24 * climb, 0, 0).rot('head', 10 * drop, 0, 0);
      P.face('eyes', climb > 0.3 && drop < 0.3 ? 'smug' : drop > 0.3 ? 'angry' : t > 1.7 ? 'happy' : undefined);
      if (t > 0.1 && t < 1.4) P.stream(TKFX.wave, 'board', TAILW, { rate: 18, dir: [0, 0.6, -0.4], speed: 1.2 });
      P.burst(0.85, TKFX.wave, 'root', [0, 2, 10], { n: 16, speed: 2.4, spread: 0.6, dir: [0, 0.2, 1] }).burst(0.86, 'splash', 'root', [0, 2, 10], { n: 26, speed: 2.6, spread: 0.8 });
      for (const r0 of [0.86, 1.0]) P.burst(r0, 'ring', 'root', [0, 2, 8], { scale: 2.2, tint: '#9af0ff' });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.2, 0.7, E.inout));
      P.pos('root', 0, 0, -2.2 * k).rot('ride', -10 * k, 0, wave(t, 14) * 6 * k).rot('body', -14 * k + wob(t, 0.2, 3, 3, 6), 0, 0).rot('head', -14 * k, 0, 0).rot('jaw', 26 * k);
      arms(P, [0, 0, 20 * k], [0, 0, 0], [0, 0, 20 * k]);
      P.face('eyes', t < 0.45 ? 'x' : 'sad'); P.blinkOK = false;
      P.burst(0.02, 'feather', 'body', [0, B0 + 16, 0], { n: 6, speed: 1.4 }).burst(0.02, 'splash', 'board', [0, 2, 0], { n: 10 });
    } },
    // wipe-out: wobble, then flat on its back across the board
    faint: { len: 2.3, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.95, 1.4, E.bounce);
      P.rot('ride', 0, 0, wave(t, 2) * 14 * dizzy).rot('head', 0, 0, wave(t, 2, 1) * 14 * dizzy).rot('jaw', 20 * dizzy);
      arms(P, [0, 0, wave(t, 2) * 30 * dizzy], [0, 0, 0], [0, 0, wave(t, 2) * 30 * dizzy]);
      fallBack(P, fall);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.9, 'star', 'head', TOP, { n: 5 }).burst(1.38, 'splash', 'root', [0, 1, 0], { n: 24, spread: 1, speed: 1.6 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      fallBack(P, 1); P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.rot('ride', wave(t, 0.4) * 2, 0, 0).burst(1.2, 'star', 'head', [0, B0 + 32, 8], { n: 2 });
    } },
    // victory: a little air off the lip, a full spin, land and throw a shaka
    win: { len: 2.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const h = t < 0.9 ? hop(t, 0.9, 7, { crouch: 1.4 }) : { y: wob(t, 0.9, -1.0, 3, 6), sq: wob(t, 0.9, -0.12, 3, 6) };
      P.pos('ride', 0, Math.max(0, h.y), 0).rot('ride', 0, 360 * seg(t, 0.2, 0.65, E.inout), 0); knees(P, Math.min(0, h.y) - 0.8);
      const pose = seg(t, 0.95, 1.1, E.back);
      arms(P, [0, 0, 0], [0, 0, 0], [-80 * pose, 0, -30 * pose], [-30 * pose, 60 * pose, 0]); P.rot('head', -6 * pose, 0, 8 * pose);
      P.face('eyes', pose > 0.5 ? 'wink' : 'happy');
      P.burst(0.9, 'splash', 'root', [0, 1, 0], { n: 22, speed: 1.8, spread: 1 }).burst(1.0, 'sparkle', 'head', TOP, { n: 8 }).burst(1.0, TKFX.hibiscus, 'head', TOP, { n: 6 });
    } },
    // asleep lying on the board, floating, one wing trailing in the water
    sleep: { len: 3.6, loop: true, f(P, t) {
      const br = Math.sin((t / 3.6) * Math.PI * 2);
      P.rot('ride', wave(t, 0.28) * 2, 0, wave(t, 0.28, 1) * 3).pos('ride', 0, br * 0.3, 0);
      P.rot('body', -84, 0, 0).pos('body', 0, -8.6, -2.6).rot('legR', -84).rot('legL', -84).pos('legR', 0, -6.2, 6).pos('legL', 0, -6.2, 6);
      P.rot('head', 20 + br * 2, 0, 10).rot('mane', 30, 0, 0).rot('jaw', 3);
      arms(P, [0, 0, -60], [0, 0, -30], [0, 0, 10], [0, 0, 0]);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'head', [5, B0 + 30, 8], {}).burst(2.1, 'z', 'head', [5, B0 + 30, 8], {});
    } },
  },
};
def.anim = anim;
