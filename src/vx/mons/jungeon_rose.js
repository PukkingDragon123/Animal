// Jungeon ♀ — stage 2, female form ("Welcome to the Jungle"; homage: Guns N' Roses). The same lanky punk
// build, in the ash-red plumage: rosy cream, wine-red bars, a pink-and-violet mohawk of spiky crest feathers,
// the black skeleton-print tee, and her signature: a long-stemmed red rose clenched sideways in her bill like a
// tango dancer. White almond eyes round a small rose iris, with a lash flick. Drip (one choice per tier): a rose
// tucked into the foot of her mohawk or a ripped rose-bud kerchief; red heart shades pushed up on her head or a
// studded choker with a rose pendant; a cherry guitar on her back or spiked shoulder pads. Rose petals are
// painted along her tail. A bigger hip-swing on the beat, a thorny lash for an attack, a whirling petal storm.
import { C, P, S2, MORPH, stage2, jungeonClips, pigeonEyeRig, shadesCubes, guitarCubes, chokerCubes, padCubes, kerchiefS2, rose, leafP, ATTACH_S2 } from './pigeon_parts.js';

const M = MORPH.ash;
// her own low-res eyes: white almond eyes round a small rose iris, a lash flick
const EYES = pigeonEyeRig({ grid: [5, 5], ring: ['#ff4a6a', '#c8244a'], sclera: true, pupil: 'dot', shape: 'almond', lash: true, at: S2.eyeAt, size: [10 / 3, 10 / 3] });
// the rose crosses the bill, its bloom out past the right cheek, the stem's end poking out the left
const CL = [0, 27.0, 10.1], RB = [0, 32.6, 10.1], BLOOM = RB;
const KER = kerchiefS2('jr-kerchief');
export const def = {
  name: 'jungeon_rose', ppu: 3, scale: 0.33, outline: { color: C.ink, px: 1.4 },
  bones: [
    ...stage2({ M, tailPetals: true, neckExtra: [...KER.neck, ...chokerCubes({ xs: 4.3, y: 21.0, z0: 0.4, z1: 7.8, id: 'jr-choker', hide: true })] }),
    ...EYES.bones, ...KER.bones,
    { name: 'rose', parent: 'head', pivot: CL, rot: [0, 20, 90], cubes: rose(RB, 0.9, { stem: 6.4 }) },
    { name: 'crestRose', parent: 'head', pivot: [2.6, 31.6, 2.6], rot: [-10, 20, -40], cubes: [
      ...rose([2.6, 32.4, 2.6], 0.62, { stem: 0.6, leaves: false, id: 'jr-crestrose', hide: true }),
      P([2.4, 31.4, 1.0], [0, 1.0, 2.0], leafP, { plane: 'x', id: 'jr-crestrose', hide: true }),
    ] },
    { name: 'shades', parent: 'head', pivot: [0, 32.3, 6.2], rot: [-40, 0, 0], cubes: shadesCubes([0, 32.3, 6.2], { k: 1.0, kind: 'heart', id: 'jr-shades', hide: true }) },
    { name: 'guitar', parent: 'body', pivot: [-0.6, 15.4, -7.0], rot: [-30, 180, -28], cubes: guitarCubes([-0.6, 15.4, -7.0], { k: 1.25, id: 'jr-guitar', hide: true, finish: ['#ff5a5a', '#d0203a', '#8a0c24', '#3a0610'] }) },
    { name: 'padR', parent: 'wingR', pivot: [-6.6, 20.6, 2.6], cubes: padCubes(-1, [-6.6, 20.6, 2.6], { id: 'jr-pads' }) },
    { name: 'padL', parent: 'wingL', pivot: [6.6, 20.6, 2.6], cubes: padCubes(1, [6.6, 20.6, 2.6], { id: 'jr-pads' }) },
  ],
};
def.drip = [
  [{ id: 'jr-crestrose', name: 'Rose in the mohawk' }, { id: 'jr-kerchief', name: 'Rose-bud kerchief' }],
  [{ id: 'jr-shades', name: 'Heart shades' }, { id: 'jr-choker', name: 'Rose-pendant choker' }],
  [{ id: 'jr-guitar', name: 'Cherry guitar' }, { id: 'jr-pads', name: 'Spiked shoulder pads' }],
];
def.attach = ATTACH_S2;

export const anim = {
  start: 'idle', seed: 23,
  breathe: { bone: 'body', amp: 0.016, per: 2.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 5.0], dur: 0.11 },
  look: { bone: 'head', yaw: 30, pitch: 12, speed: 8 },
  springs: [
    ...[0, 1, 2, 3, 4].map((i) => ({ bone: 'crest' + i, tip: [0, 4, 0], k: 150 - i * 12, d: 8, gain: 0.85, max: 26 })),
    { bone: 'rose', tip: [-6, 0, 0], k: 240, d: 10, gain: 0.5, max: 12 },
    { bone: 'crestRose', tip: [0, 1.5, 0], k: 300, d: 12, gain: 0.3, max: 8 },
    { bone: 'scarfR', tip: [0, -1, -3.8], k: 110, d: 8, gain: 0.9, max: 30 },
    { bone: 'scarfL', tip: [0, -1, -3.2], k: 120, d: 8, gain: 0.9, max: 30 },
    { bone: 'tail', tip: [0, 0, -9], k: 200, d: 11, gain: 0.5, max: 14 },
    { bone: 'handR', tip: [0, -6, 0], k: 220, d: 11, gain: 0.4, max: 14, axes: [1, 0, 1] },
    { bone: 'handL', tip: [0, -6, 0], k: 220, d: 11, gain: 0.4, max: 14, axes: [1, 0, 1] },
  ],
  faces: { eyes: EYES.slot },
  fidget: { every: [4.5, 8], clips: ['chew', 'stomp', 'peck'] },
  clips: jungeonClips({ prop: 'rose', BLOOM, sway: 1.8 }),
};
def.anim = anim;
