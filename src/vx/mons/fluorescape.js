// Fluorescape — the giant fluorescent ape (an Arctic Monkeys homage, stage 3 of Snoozaque). The
// ice has grown into an armour of fluorite crystals that glows like a blacklight: a cyan breastplate,
// magenta-and-cyan crystal clusters on its shoulders, crystal gauntlets over the old ice knuckles,
// crystal kneecaps and a ridge of glowing spikes down its spine. Midnight-indigo fur, a lilac face,
// heavy-lidded sleepy eyes that shine cyan, a long slicked-back mane with a fluorescent sheen and a
// little chin beard — the lounge-crooner years. It conjures ice mirrorballs and sings to them with its
// eyes shut. Homage only — no logos, no album art.
import { E, seg, bump, wob, wave, bounce, hop } from '../anim.js';
import { eyeRig, eyesAt, eyesScale, glance, keepEyes } from './eyes.js';
import {
  FUR, A, B, L, both, twin, acc, region, goldP, beat, env, plant, rod, furP, bellyP, skinP, monkeyFace, quiffP, crystalP, facetP, iceP,
  lensP, goldWireP, hollowBodyP, fretboardP, headP, mirrorP, FLUO_EYES, mouthPlanes, AMFX, arcticForm, AM_FX_MAP, gilt,
} from './arctic_parts.js';
import { cloth, velvet } from './story_parts.js';

const TAU = Math.PI * 2, F = FUR.fluo;
// ---------------------------------------------------------------- painters
const fur = furP(F), furFringe = furP(F, { fringe: true });
const lilac = skinP(A.lilac, A.lilacHi, A.lilacLo), hand = skinP('#7a68b0', '#9a88d0', '#4e4280');
const cyan = crystalP(A.cyan, A.cyanHi, A.cyanLo), mag = crystalP(A.mag, A.magHi, A.magLo), lime = crystalP(A.lime, '#eaffb0', '#6ac02a');
const plateC = facetP(A.cyan, A.cyanHi, A.cyanLo), plateM = facetP(A.mag, A.magHi, A.magLo);
const muzzleP = (p, w, h, face) => {
  if (face === 'down') { p.rect(0, 0, w, h, A.mouth); return; }
  lilac(p, w, h, face);
  if (face === 'south') { const c = Math.floor(w / 2); p.rect(c - 4, 2, 3, 2, A.lilacLo).rect(c + 1, 2, 3, 2, A.lilacLo).rect(c - 3, 2, 2, 1, '#3a2a60').rect(c + 1, 2, 2, 1, '#3a2a60'); for (let y = 5; y < h - 2; y++) p.px(c, y, A.lilacLo); }
};
const jawP = (p, w, h, face) => { if (face === 'up') { p.rect(0, 0, w, h, A.mouth); p.rect(1, 1, w - 2, h - 1, A.tongue); return; } lilac(p, w, h, face); };
const fangP = (p, w, h) => { p.rect(0, 0, w, h, A.fang); p.rect(0, h - 1, w, 1, '#d8d0c0'); };
// the mane: blue-black hair combed back with a fluorescent cyan sheen
const maneP = (o = {}) => {
  const base = quiffP({ slant: o.slant ?? 0, band: o.band ?? 0.3 });
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face === 'down') return;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x % 6 === 2 && (y + x) % 9 < 5) p.px(x, y, y % 2 ? '#3ad8f0' : '#1a8ab8');
    if (o.part && face === 'up') for (let y = 0; y < h; y++) p.px(Math.floor(w / 2), y, A.lilacLo);
  };
};
const capeP = velvet('#1c1a5a', { hi: '#3a36a0', lo: '#0c0a30', trim: '#ffd23a' });
const cravatP = cloth('#d8306a', { hi: '#ff6a9a', lo: '#8a1040', folds: 3 });
const moonP = (p, w, h) => { const c = w / 2, r = w / 2 - 0.5; region(p, w, h, (x, y) => (x + 0.5 - c) ** 2 + (y + 0.5 - c) ** 2 < r * r && (x + 0.5 - c - r * 0.45) ** 2 + (y + 0.5 - c + r * 0.2) ** 2 > (r * 0.82) ** 2, (x, y) => ((x * 3 + y) % 7 === 0 ? '#c8f0ff' : x < c - r * 0.4 ? '#ffffff' : '#e8faff')); };

// ---------------------------------------------------------------- the model
const HEADBOX = [-6.0, 43.6, 12, 10];
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-2.4, 39.6, 7.44], glow: 'all', line: FLUO_EYES.line, pupilColor: FLUO_EYES.pupilColor, iris: FLUO_EYES.iris, irisDark: FLUO_EYES.irisDark, accent: FLUO_EYES.accent, map: FLUO_EYES.map, extra: ['smug'] });
const MOUTH = mouthPlanes([0, 35.0, 9.44], 'flat');
const G = (o, s, tex, x = {}) => B(o, s, tex, { glow: true, ...x });
export const def = {
  name: 'fluorescape', ppu: 3, scale: 0.62, outline: { color: '#0a0818', px: 1.6 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...twin({ name: 'legR', parent: 'root', pivot: [-5.6, 14, -1], cubes: [
      B([-8.6, 2.0, -4.0], [6.0, 12.6, 6.4], fur), G([-8.0, 6.6, 2.2], [4.8, 3.8, 1.4], plateC), G([-7.4, 9.8, 2.6], [3.6, 2.2, 1.2], cyan, { pivot: [-5.6, 10.6, 3.2], rot: [30, 0, 0] }),
    ] }),
    ...twin({ name: 'footR', parent: 'root', pivot: [-5.6, 1.6, -0.6], cubes: [B([-8.8, 0, -4.0], [6.4, 2.2, 8.4], hand)] }),
    { name: 'body', parent: 'root', pivot: [0, 14, -1], cubes: [
      B([-8, 12.6, -5.6], [16, 6.0, 10.4], fur),
      B([-10, 18, -6.4], [20, 14, 12.8], fur),
      B([-11.6, 25, -6.0], [23.2, 9, 12.0], fur),
      B([-9, 33.4, -5.4], [18, 3.4, 10], furFringe),
      // the fluorite breastplate, a crystal belt
      G([-6.6, 24.2, 6.0], [13.2, 8.8, 1.3], plateC), G([-4.2, 20.2, 6.2], [8.4, 3.8, 1.0], plateM), G([-8.2, 17.4, 4.6], [16.4, 1.6, 1.2], lime),
      ...both(G([-10.6, 26.4, 5.6], [3.6, 6.0, 1.0], plateM, { pivot: [-8.8, 29.4, 6.1], rot: [0, 18, 0] })),
      // tier 2 (or): a midnight velvet crooner's cape over its shoulders
      ...acc('acc-cape', [B([-11.8, 33.8, -6.8], [23.6, 1.0, 9.6], capeP)]),
      // tier 1 (or): a silk cravat at the throat
      ...acc('acc-cravat', [B([-2.4, 31.0, 6.6], [4.8, 3.0, 1.2], cravatP), B([-1.6, 27.6, 7.0], [3.2, 3.6, 0.8], cravatP, { pivot: [0, 31, 7.4], rot: [6, 0, 0] })]),
    ] },
    { name: 'cape', parent: 'body', pivot: [0, 34, -6.6], cubes: acc('acc-cape', [B([-11.6, 12.0, -7.6], [23.2, 22.0, 0.9], capeP)]) },
    // a ridge of glowing crystal spikes down its spine
    { name: 'spine', parent: 'body', pivot: [0, 26, -6.4], cubes: [
      G([-1.4, 30.0, -8.2], [2.8, 6.0, 2.8], cyan, { pivot: [0, 30, -6.8], rot: [-34, 0, 0] }), G([-1.2, 24.6, -8.4], [2.4, 5.2, 2.4], mag, { pivot: [0, 24.6, -7.2], rot: [-38, 0, 0] }),
      G([-1.0, 19.4, -8.2], [2.0, 4.4, 2.0], cyan, { pivot: [0, 19.4, -7.2], rot: [-42, 0, 0] }), ...both(G([-5.4, 27.0, -8.0], [2.0, 4.6, 2.0], lime, { pivot: [-4.4, 27, -7], rot: [-30, 0, 18] })),
    ] },
    // tier 3 (or): the black hollow-body on its back
    { name: 'guitar', parent: 'body', pivot: [0, 24, -7.2], rot: [0, 0, -28], cubes: acc('acc-guitar', [
      B([-5.0, 15.0, -10.6], [10.0, 11.0, 2.4], hollowBodyP), B([-0.8, 26.0, -10.2], [1.6, 12, 1.3], fretboardP), B([-1.3, 38.0, -10.25], [2.6, 3.4, 1.1], headP),
    ]) },
    { name: 'head', parent: 'body', pivot: [0, 34, 2], cubes: [
      B([-6.0, 33.6, -2.2], [12, 10, 9.6], fur, { faces: { south: monkeyFace(F, [A.lilac, A.lilacHi, A.lilacLo], HEADBOX, { lobes: [[-2.4, 39.6], [2.4, 39.6]], lobeR: 2.9, chinY: 36.4, chinRx: 4.4, chinRy: 3.4 }) } }),
      B([-3.6, 34.4, 7.2], [7.2, 3.6, 2.2], muzzleP),
      ...both(B([-2.6, 33.7, 8.4], [0.8, 1.0, 0.6], fangP)),
      ...both(B([-6.9, 38.6, 1.6], [1.0, 2.2, 2.0], lilac)),
      ...MOUTH.cubes,
      // tier 1: big rose-tinted aviators slid down its nose
      ...acc('acc-aviators', [B([-5.2, 36.4, 7.6], [4.4, 2.2, 0.4], lensP('#e070b0')), B([0.8, 36.4, 7.6], [4.4, 2.2, 0.4], lensP('#e070b0'), { mirror: true }), B([-0.8, 37.6, 9.45], [1.6, 0.4, 0.4], goldWireP), ...both(B([-6.4, 37.8, -1.0], [0.3, 0.4, 8.8], goldWireP))]),
    ] },
    ...EYES.bones,
    { name: 'jaw', parent: 'head', pivot: [0, 34.6, 7.6], cubes: [B([-3.2, 33.2, 7.0], [6.4, 1.4, 2.4], jawP), B([-2.8, 31.2, 7.0], [5.6, 2.2, 2.4], maneP({ slant: 0 })), B([-1.4, 30.2, 7.6], [2.8, 1.2, 1.6], maneP({ slant: 0 }))] },
    // the long slicked-back mane with a fluorescent sheen
    // long hair parted in the middle: curtains down both sides of the face, a long mane behind
    { name: 'hair', parent: 'head', pivot: [0, 43.6, 2], cubes: [
      B([-6.4, 43.0, -3.0], [12.8, 1.4, 10.4], maneP({ slant: 0, part: true })),
      ...both(B([-7.0, 34.4, -2.8], [1.4, 9.4, 9.2], maneP())),
      ...both(B([-6.8, 37.6, 6.4], [2.2, 6.2, 1.4], maneP())),
      B([-6.4, 31.0, -4.0], [12.8, 13.4, 1.8], maneP()),
    ] },
    { name: 'mane', parent: 'hair', pivot: [0, 31.4, -4.0], cubes: [B([-6.0, 24.6, -4.6], [12.0, 7.0, 1.6], maneP(), { faces: { south: maneP(), north: maneP() } })] },
    // tier 3 (or): a glowing crescent moon behind its head
    { name: 'moon', parent: 'head', pivot: [0, 44, -6], cubes: acc('acc-moon', [G([-7.0, 36.0, -6.6], [14, 14, 0], moonP, { plane: 'z' })]) },
    // the arms: shoulder crystal clusters, crystal gauntlets over the old ice knuckles, big lilac hands
    ...twin({ name: 'armR', parent: 'body', pivot: [-11.6, 32, 0], cubes: [
      B([-16.6, 22, -3.2], [5.4, 11, 6.4], fur),
      G([-17.4, 31.0, -2.6], [4.2, 6.4, 4.2], mag, { pivot: [-15.3, 31.4, -0.5], rot: [0, 0, 22] }), G([-15.6, 32.6, -2.0], [3.4, 7.2, 3.4], cyan, { pivot: [-13.9, 33, -0.3], rot: [-10, 0, 8] }),
      G([-18.2, 28.8, 0.4], [3.0, 4.6, 3.0], cyan, { pivot: [-16.7, 29, 1.9], rot: [20, 0, 40] }), G([-16.0, 31.2, 1.6], [2.4, 4.4, 2.4], lime, { pivot: [-14.8, 31.4, 2.8], rot: [30, 0, 4] }),
    ] }),
    ...twin({ name: 'foreR', parent: 'armR', pivot: [-13.9, 22.4, 0], cubes: [
      G([-17.4, 12.6, -3.8], [7.0, 10, 7.6], plateC), G([-15.8, 18.6, -5.2], [2.2, 4.4, 2.2], mag, { pivot: [-14.7, 18.8, -4.1], rot: [-36, 0, 0] }), G([-18.4, 15.4, -1.2], [1.8, 3.6, 1.8], cyan, { pivot: [-17.5, 15.6, -0.3], rot: [0, 0, 40] }),
    ] }),
    ...twin({ name: 'handR', parent: 'foreR', pivot: [-13.9, 12.6, 0], cubes: [B([-17.6, 7.2, -3.6], [7.4, 5.6, 7.2], hand)] }),
    // props: the conjured ice mirrorball (fidget) and the orbiting one (tier 2)
    { name: 'orb', parent: 'body', pivot: [0, 30, 14], cubes: [B([-2.6, 27.4, 11.4], [5.2, 5.2, 5.2], mirrorP, { id: 'orb', hide: true })] },
    { name: 'mirror', parent: 'root', pivot: [0, 0, 0], cubes: acc('acc-mirrorball', [B([12.4, 48.0, -3.0], [5.0, 5.0, 5.0], mirrorP)]) },
  ],
  drip: [
    [{ id: 'acc-aviators', name: 'Rose-tinted aviators' }, { id: 'acc-cravat', name: 'Silk cravat' }],
    [{ id: 'acc-mirrorball', name: 'Orbiting ice mirrorball' }, { id: 'acc-cape', name: 'Midnight velvet cape' }],
    [{ id: 'acc-moon', name: 'Crescent-moon halo' }, { id: 'acc-guitar', name: 'Black hollow-body guitar' }],
  ],
  attach: {
    head: { bone: 'hair', at: [0, 46, 2], size: 12 },
    face: { bone: 'head', at: [0, 39.6, 7.6], size: 11 },
    neck: { bone: 'body', at: [0, 32, 6.4], size: 13 },
    back: { bone: 'body', at: [0, 24, -7.2], size: 16 },
  },
};
def.dripForm = { map: keepEyes(EYES, arcticForm(F, { '#d8306a': 'gold', '#ff6a9a': 'gold', '#8a1040': 'black', '#1c1a5a': 'black', '#3a36a0': 'black', '#0c0a30': 'black' })), fx: AM_FX_MAP };

// ---------------------------------------------------------------- animation
const TOP = [0, 47, 3], MOUTHP = [0, 35, 10], LEG = 12, HAND = [-13.9, 9, 0], HANDL = [13.9, 9, 0], ORB = [0, 30, 14];
const legs = (P, dy) => plant(P, ['legR', 'legL'], dy, LEG);
const mouth = (P, s, open = 0) => { P.face('mouth', open > 0.15 ? 'open' : s); P.rot('jaw', open * 45, 0, 0); return P; };
// arms: x (− raises forward), z (+ swings the right arm in; mirrored for the left)
const arms = (P, x, z, xl = x, zl = z) => P.rot('armR', x, 0, z).rot('armL', xl, 0, -zl);
const pulse = (P, t, k = 1) => { const s = 1 + 0.06 * k * Math.sin(t * TAU * 1.2); P.scl('spine', s); };
function lying(P, k) {
  P.rot('root', -82 * k, 0, 0).pos('root', 0, 6.8 * k, 14 * k).rot('armR', 0, 0, -60 * k).rot('armL', 0, 0, 60 * k).rot('footR', 30 * k, 0, 0).rot('footL', 24 * k, 0, 0).rot('head', 12 * k, 0, 0);
}
export const anim = {
  start: 'idle', seed: 2018,
  breathe: { bone: 'body', amp: 0.015, per: 3.4 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.8, 5.6], dur: 0.26 },
  look: { bone: 'head', yaw: 26, pitch: 10, speed: 3 },
  springs: [
    { bone: 'mane', tip: [0, -8, 0], k: 140, d: 7, gain: 0.8, max: 18, axes: [1, 0, 1] },
    { bone: 'hair', tip: [0, 2, 4], k: 220, d: 9, gain: 0.3, max: 6, axes: [1, 0, 1] },
    { bone: 'cape', tip: [0, -20, 0], k: 90, d: 5, gain: 0.9, max: 22, axes: [1, 0, 1] },
    { bone: 'handR', tip: [0, -5, 0], k: 200, d: 10, gain: 0.35, max: 10 },
    { bone: 'handL', tip: [0, -5, 0], k: 200, d: 10, gain: 0.35, max: 10 },
  ],
  faces: { eyes: EYES.slot, mouth: MOUTH.slot, orb: { default: 'off', states: { off: [], on: ['orb'] } } },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'mirrorball', 'doze'] },
  clips: {
    // tall and serene: a slow heavy breath, the crystals swelling, a languid sway, slow sleepy glances
    idle: { len: 3.4, loop: true, f(P, t, c) {
      const sw = wave(t, 1 / 3.4);
      P.rot('body', 0, sw * 4, sw * 2).pos('body', sw * 0.3, 0, 0).rot('head', 3 + sw * 2, -sw * 6, -sw * 3); arms(P, sw * 4, 2 - sw * 2, -sw * 4, 2 + sw * 2);
      pulse(P, t);
      eyesAt(P, ...glance(t + c.loopN * 2.3, [[0, 0], [-0.35, 0], [-0.35, 0], [0.35, 0.05], [0, 0]], 0.85, 0.3));
      mouth(P, c.loopN % 3 === 1 && t > 1 && t < 2 ? 'smirk' : 'flat');
      P.stream(AMFX.glint, 'spine', [0, 32, -9], { rate: 1.2, spread: 1, speed: 0.3 });
    } },
    // a slow, rolling, heavy stride
    walk: { len: 1.0, loop: true, f(P, t) {
      const ph = (t / 1.0) * TAU, s = Math.sin(ph), c2 = Math.cos(ph), lr = Math.max(0, s), ll = Math.max(0, -s), dy = Math.abs(c2) * 0.8;
      P.pos('body', 0, dy, 0).rot('body', 3, s * 6, s * 3);
      P.rot('legR', -24 * s, 0, 0).rot('legL', 24 * s, 0, 0).pos('footR', 0, lr * 2.4, s * 4).pos('footL', 0, ll * 2.4, -s * 4);
      P.rot('armR', s * 20, 0, 4).rot('armL', -s * 20, 0, -4).rot('head', 2, -s * 4, 0);
    } },
    // battle cry: rises to full height, arms flung wide, every crystal flares, a cold resonant roar
    cry: { len: 2.4, next: 'idle', f(P, t) {
      P.lookW = 1 - seg(t, 0.1, 0.3); P.blinkOK = false;
      const up = seg(t, 0.1, 0.5, E.back) * (1 - seg(t, 1.9, 2.3, E.inout)), roar = seg(t, 0.5, 0.65, E.back) * (1 - seg(t, 1.7, 2.1, E.inout));
      P.rot('body', -10 * up, 0, 0).pos('body', 0, 1.2 * up, 0); legs(P, 1.2 * up); arms(P, -40 * up, -70 * up);
      P.rot('head', -20 * roar + wave(t, 8) * 3 * roar, 0, 0).scl('spine', 1 + 0.25 * roar);
      P.face('eyes', up > 0.3 && roar < 0.3 ? 'angry' : roar > 0.3 ? (t < 0.8 ? 'wide' : 'angry') : 'sleepy'); mouth(P, 'flat', roar);
      if (roar > 0.4 && t < 1.7) { P.stream(AMFX.breath, 'head', MOUTHP, { rate: 70, dir: [0, 0.4, 1], spread: 0.25 }); P.stream(AMFX.glint, 'body', [0, 28, 7], { rate: 30, spread: 1, speed: 1.6 }); }
      P.burst(0.55, AMFX.ring, 'body', [0, 28, 8], { scale: 2 }).burst(0.56, AMFX.glintMag, 'body', [0, 30, 0], { n: 12, speed: 2 });
    } },
    // physical: a crystal-gauntlet haymaker
    attack: { len: 1.1, next: 'idle', f(P, t) {
      const bk = seg(t, 0, 0.32, E.out) * (1 - seg(t, 0.34, 0.44, E.in)), hit = seg(t, 0.36, 0.48, E.in3) * (1 - seg(t, 0.6, 1.05, E.inout));
      P.rot('body', 0, -26 * bk + 24 * hit, 0).pos('root', 0, 0, -1.2 * bk + 4 * hit).rot('armR', 40 * bk - 100 * hit, 0, -20 * bk + 10 * hit).rot('foreR', -30 * bk, 0, 0);
      P.face('eyes', bk > 0.3 ? 'smug' : hit > 0.3 ? 'angry' : 'sleepy'); mouth(P, hit > 0.3 ? 'frown' : 'flat'); P.blinkOK = false;
      P.burst(0.48, AMFX.shard, 'handR', HAND, { n: 10 }).burst(0.48, AMFX.glint, 'handR', HAND, { n: 6 }).burst(0.5, 'spark', 'handR', HAND, { scale: 1.4 });
    } },
    // special (cryo): crystal energy gathers between its palms and fires as a fluorescent frost beam
    special: { len: 2.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const gather = env(t, 0.05, 0.9, 0.3, 0.1), fire = seg(t, 0.9, 1.0, E.out) * (1 - seg(t, 1.6, 2.0, E.inout));
      arms(P, -70 * gather - 85 * fire, 30 * gather + 14 * fire); P.rot('foreR', -30 * gather, 0, 0).rot('foreL', -30 * gather, 0, 0);
      P.rot('body', 6 * gather - 8 * fire, 0, 0).pos('root', 0, 0, -1.6 * fire).scl('spine', 1 + 0.2 * gather + 0.3 * fire);
      P.face('eyes', gather > 0.3 ? 'closed' : fire > 0.3 ? 'wide' : t > 1.9 ? 'smug' : 'sleepy'); mouth(P, fire > 0.3 ? 'o' : 'flat');
      if (gather > 0.2) P.stream(AMFX.glint, 'body', [0, 28, 16], { rate: 40 * gather, spread: 0.8, speed: 0.6 });
      if (fire > 0.3) { P.stream(AMFX.breath, 'body', [0, 28, 18], { rate: 90, dir: [0, 0, 1], spread: 0.15, speed: 1.4 }); P.stream(AMFX.glint, 'body', [0, 28, 18], { rate: 40, dir: [0, 0, 1], spread: 0.3, speed: 4, key: 'b' }); }
      P.burst(0.92, AMFX.ring, 'body', [0, 28, 18], { scale: 1.6 }).burst(0.92, AMFX.glintMag, 'body', [0, 28, 18], { n: 10, speed: 2 });
    } },
    hurt: { len: 0.8, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.25, 0.8, E.inout));
      P.pos('root', 0, 0, -2 * k).rot('body', -10 * k + wob(t, 0.25, 3, 3, 6), 0, wave(t, 14) * 3 * k).rot('head', -14 * k, 0, 0); arms(P, 10 * k, -20 * k);
      P.face('eyes', t < 0.45 ? 'x' : 'sad'); mouth(P, t < 0.45 ? 'o' : 'frown'); P.blinkOK = false;
      P.burst(0.02, AMFX.shard, 'body', [0, 28, 8], { n: 10 }).burst(0.02, AMFX.glintMag, 'body', [0, 28, 8], { n: 6, speed: 1.6 }).burst(0.06, 'sweat', 'head', [8, 42, 4], {});
    } },
    // the light goes out of its crystals… it sways and falls flat on its back like a felled tree
    faint: { len: 2.8, next: 'down', f(P, t) {
      const drift = seg(t, 0, 1.0) * (1 - seg(t, 1.2, 1.3)), fall = seg(t, 1.2, 1.8, E.bounce);
      P.rot('head', 16 * drift, 0, wave(t, 0.9) * 8 * drift).rot('body', 0, 0, wave(t, 0.9, 1) * 6 * drift).scl('spine', 1 - 0.3 * seg(t, 0.4, 1.2)); arms(P, 0, -10 * drift);
      lying(P, fall); P.face('eyes', t < 1.2 ? 'sleepy' : 'swirl'); mouth(P, 'o'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.2, 'star', 'head', [0, 48, 2], { n: 6 }).burst(1.76, 'dust', 'root', [0, 0, -10], { n: 16, spread: 1 }).burst(1.76, AMFX.shard, 'body', [0, 28, 0], { n: 12 });
    } },
    down: { len: 3.2, loop: true, f(P, t) {
      lying(P, 1); P.face('eyes', 'swirl'); mouth(P, 'o'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5; P.scl('spine', 0.8);
      P.rot('handR', 0, 0, 12 * bump(t, 0.8, 1.2)).burst(1.6, AMFX.glint, 'body', [0, 28, 6], { n: 1, speed: 0.2 });
    } },
    // victory: the crooner's bow — a hand on its heart, a slow bow, then arms wide and a glittering wink
    win: { len: 2.6, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const heart = env(t, 0.05, 1.3, 0.25, 0.2), bow = bump(t, 0.4, 1.2), wide = seg(t, 1.3, 1.55, E.back) * (1 - seg(t, 2.2, 2.55, E.inout));
      P.rot('armR', -36 * heart, 0, 52 * heart).rot('foreR', -66 * heart, 0, 0).rot('body', 22 * bow, 0, 0).rot('head', 10 * bow, 0, 0).rot('armL', 20 * bow, 0, 0);
      arms(P, -50 * wide, -60 * wide); P.rot('head', -10 * wide, 0, 0).scl('spine', 1 + 0.2 * wide);
      P.face('eyes', t < 1.3 ? 'closed' : t > 1.8 ? 'wink' : 'smug'); mouth(P, 'smirk');
      P.burst(1.4, AMFX.glint, 'body', [0, 34, 6], { n: 14, speed: 1.6 }).burst(1.4, AMFX.glintMag, 'body', [0, 34, 6], { n: 10, speed: 1.4 }).burst(1.5, 'sparkle', 'head', [0, 46, 6], { n: 8 });
    } },
    // asleep: sat cross-legged, chin on its chest, the crystals dimmed and slowly pulsing
    sleep: { len: 4.0, loop: true, f(P, t) {
      const br = Math.sin((t / 4) * TAU);
      P.pos('body', 0, -6.0 + br * 0.3, 0).rot('body', 6, 0, 2); legs(P, -6.0);
      P.rot('footR', 0, -60, 0).rot('footL', 0, 60, 0).pos('footR', 2.4, 0, 3).pos('footL', -2.4, 0, 3).rot('legR', -50, 0, 30).rot('legL', -50, 0, -30);
      arms(P, -30, 26); P.rot('head', 22 + br * 3, 0, 6).scl('spine', 0.85 + 0.08 * br);
      P.face('eyes', 'closed'); mouth(P, 'o'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', [7, 46, 4], { scale: 1.6 }).burst(2.4, 'z', 'head', [7, 46, 4], { scale: 1.6 });
    } },
    // the dance: a lounge-crooner sway — hips swinging, finger snaps on the off-beat, a shoulder roll,
    // a slow turn with one arm reaching out, ending on a hand-on-heart pose, eyes shut, chin up
    dance: { len: 3.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const b = beat(t, 0.4), live = 1 - seg(t, 1.95, 2.05), sw = Math.sin((t / 0.8) * TAU) * live, snap = b.pulse * live;
      P.pos('body', sw * 1.2, -0.3 * snap, 0).rot('body', 0, sw * 8, -sw * 6); legs(P, -0.3 * snap);
      P.rot('legR', 0, 0, sw * 4).rot('legL', 0, 0, sw * 4).pos('footR', sw * 0.6, 0, 0).pos('footL', sw * 0.6, 0, 0);
      arms(P, -30 * live, -18 * live, -30 * live, -18 * live); P.rot('foreR', -50 * live, 0, 0).rot('foreL', -50 * live, 0, 0).rot('handR', 0, 0, 14 * snap).rot('handL', 0, 0, -14 * snap);
      P.rot('head', 6 * snap, -sw * 10, sw * 8);
      const turn = seg(t, 2.0, 2.5, E.inout), pose = seg(t, 2.45, 2.65, E.back);
      P.rot('root', 0, 360 * turn, 0).rot('armL', -60 * turn * (1 - pose), 0, -60 * turn * (1 - pose));
      P.rot('armR', -36 * pose, 0, 52 * pose).rot('foreR', -66 * pose, 0, 0).rot('armL', -40 * pose, 0, -70 * pose).rot('head', -14 * pose, 0, 0).scl('spine', 1 + 0.15 * pose);
      P.face('eyes', t > 2.5 ? 'closed' : snap > 0.6 ? 'smug' : 'sleepy'); mouth(P, t > 2.5 ? 'o' : 'smirk');
      for (let k = 1; k < 5; k++) P.burst(k * 0.4 + 0.02, AMFX.glint, k % 2 ? 'handR' : 'handL', k % 2 ? HAND : HANDL, { n: 2 });
      for (const k of [0, 2, 4]) P.burst(k * 0.4 + 0.05, AMFX.note, 'head', [k % 4 ? -9 : 9, 48, 4], { scale: 1.4 });
      P.burst(2.6, AMFX.glintMag, 'body', [0, 36, 6], { n: 10, speed: 1.4 }).burst(2.6, 'sparkle', 'head', [0, 48, 6], { n: 6 });
    } },
    // signature: cupped paws, an ice mirrorball crystallises between them; it tosses it up where it
    // hangs spinning and scattering light while the ape croons to it with its eyes shut… then it
    // drops, it catches it, and it bursts into glitter
    mirrorball: { len: 4.4, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const cup = env(t, 0.05, 1.3, 0.3, 0.15), grow = seg(t, 0.3, 1.1, E.out), toss = seg(t, 1.2, 1.6, E.out), drop = seg(t, 3.3, 3.6, E.in), catchK = env(t, 3.4, 4.2, 0.1, 0.3);
      arms(P, -70 * cup - 120 * bump(t, 1.15, 1.6), 30 * cup);
      P.face('orb', t > 0.3 && t < 3.75 ? 'on' : 'off');
      P.scl('orb', 0.2 + 0.8 * grow).pos('orb', 0, 27 * toss - 27 * drop, -4 * toss + 4 * drop).rot('orb', 0, t * 160, 0);
      const croon = env(t, 1.7, 3.3, 0.25, 0.25), sway = Math.sin((t - 1.7) * TAU * 0.8) * croon;
      P.rot('armR', -36 * croon, 0, 52 * croon).rot('foreR', -66 * croon, 0, 0).rot('armL', -110 * croon, 0, -30 * croon).rot('head', -16 * croon, sway * 8, sway * 6).rot('body', 0, sway * 6, 0);
      arms(P, -60 * catchK, 24 * catchK);
      P.face('eyes', t < 1.2 ? 'smug' : t < 1.7 ? 'wide' : croon > 0.3 ? 'closed' : t < 3.8 ? 'wide' : 'smug'); mouth(P, croon > 0.3 ? 'o' : t > 3.8 ? 'smirk' : 'flat', croon > 0.3 ? 0.25 + 0.15 * Math.abs(sway) : 0);
      if (t > 0.3 && t < 1.2) P.stream(AMFX.glint, 'orb', ORB, { rate: 20, spread: 1, speed: 0.6 });
      if (t > 1.6 && t < 3.3) { P.stream(AMFX.glint, 'orb', [0, 57, 10], { rate: 26, spread: 1, speed: 3 }); P.stream(AMFX.glintMag, 'orb', [0, 57, 10], { rate: 14, spread: 1, speed: 3, key: 'm' }); }
      for (const k of [1.9, 2.4, 2.9]) P.burst(k, AMFX.note, 'head', [6, 46, 6], { scale: 1.4 });
      P.burst(3.72, 'sparkle', 'body', ORB, { n: 14, speed: 1.4 }).burst(3.72, AMFX.glint, 'body', ORB, { n: 16, speed: 2 }).burst(3.72, AMFX.shard, 'body', ORB, { n: 8 });
    } },
    // fidget: dozes standing — the crystals dim, the chin sinks… a crystal pings and it jolts awake
    doze: { len: 3.0, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const sink = seg(t, 0.1, 1.5, E.inout) * (1 - seg(t, 1.55, 1.65, E.out)), jolt = bump(t, 1.55, 1.9);
      P.rot('head', 24 * sink - 10 * jolt, 0, 8 * sink).rot('body', 5 * sink, 0, 0).scl('spine', 1 - 0.25 * sink + 0.3 * jolt).pos('root', 0, 0.8 * jolt, 0); arms(P, 0, -6 * sink - 20 * jolt);
      P.face('eyes', t < 1.55 ? (sink > 0.4 ? 'closed' : 'sleepy') : t < 2.0 ? 'shock' : t < 2.5 ? 'angry' : 'sleepy'); mouth(P, t < 2.0 ? 'o' : 'frown', t > 1.55 && t < 1.9 ? 0.4 : 0);
      P.burst(1.55, AMFX.glintMag, 'spine', [0, 32, -9], { n: 8, speed: 1.4 }).burst(1.58, 'sweat', 'head', [8, 42, 4], {}).burst(2.1, 'anger', 'head', [-8, 46, 2], {});
    } },
  },
};
// the orbiting mirrorball (tier 2) circles its head in every clip
// …and the head rides a little higher and bigger than its box (rest offset)
for (const c of Object.values(anim.clips)) { const f = c.f; c.f = (P, t, cx) => { f(P, t, cx); P.rot('mirror', 0, (cx.time * 50) % 360, 0).pos('head', 0, 1.6, 0.8).scl('head', 1.12); }; }
def.anim = anim;
