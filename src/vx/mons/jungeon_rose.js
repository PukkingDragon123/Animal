// Jungeon ♀ — stage 2, female form ("Welcome to the Jungle"; homage: Guns N' Roses). The same lanky punk
// build, in the ash-red plumage: rosy cream, wine-red bars, a pink-and-violet mohawk of spiky crest
// feathers, the black skeleton-print tee, and a long-stemmed red rose clenched sideways in her bill like a
// tango dancer. Her quirks: a second rose tucked into the base of her crest and rose petals along her tail.
// Big dark kawaii eyes with a rose glow and one tiny flick. A bigger hip-swing on the beat, a thorny lash
// for an attack, and a whirling storm of petals for a special.
import { C, P, S2, MORPH, stage2, jungeonClips, kawaiiEyes, eyeFaces, rose, leafP, ATTACH_S2 } from './pigeon_parts.js';

const M = MORPH.ash;
const EYES = kawaiiEyes({ flick: true, fill: ['#2a1220', '#3a182a'], accent: ['#4a1428', '#8a2440', '#d0506e'] });
// the rose crosses the bill, its bloom out past the right cheek, the stem's end poking out the left
const CL = [0, 27.0, 10.1], RB = [0, 32.6, 10.1], BLOOM = RB;
export const def = {
  name: 'jungeon_rose', ppu: 3, scale: 0.33, outline: { color: C.ink, px: 1.4 },
  bones: [
    ...stage2({ M, eyes: EYES, eyeDef: 'glare', tailPetals: true }),
    { name: 'rose', parent: 'head', pivot: CL, rot: [0, 20, 90], cubes: rose(RB, 0.9, { stem: 6.4 }) },
    { name: 'crestRose', parent: 'head', pivot: [2.6, 31.6, 2.6], rot: [-10, 20, -40], cubes: [
      ...rose([2.6, 32.4, 2.6], 0.62, { stem: 0.6, leaves: false }),
      P([2.4, 31.4, 1.0], [0, 1.0, 2.0], leafP, { plane: 'x' }),
    ] },
  ],
};
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
    { bone: 'tail', tip: [0, 0, -9], k: 200, d: 11, gain: 0.5, max: 14 },
    { bone: 'handR', tip: [0, -6, 0], k: 220, d: 11, gain: 0.4, max: 14, axes: [1, 0, 1] },
    { bone: 'handL', tip: [0, -6, 0], k: 220, d: 11, gain: 0.4, max: 14, axes: [1, 0, 1] },
  ],
  faces: { eyes: eyeFaces(EYES, 'glare') },
  fidget: { every: [4.5, 8], clips: ['chew', 'stomp', 'peck'] },
  clips: jungeonClips({ prop: 'rose', BLOOM, sway: 1.8 }),
};
def.anim = anim;
