// Pidgun ♂ — a cocky street pigeon from the Tenderloin (homage: Guns N' Roses).
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { C, P, sh, mx, clamp, stage1, S1, eggBone, wingSegP, pigeonEyes, eyeFaces, featherCol, leatherP, bandanaP,
  metalP, stud, revolver, muzzle, plant, strut, peck } from './pigeon_parts.js';

const EYES = pigeonEyes();
const band = bandanaP(), bandTail = bandanaP({ border: false });
const G = [-8.9, 6.0, 6.8];

export const def = {
  name: 'pidgun', ppu: 3, scale: 0.32, outline: { color: C.ink, px: 1.4 },
  bones: [
    ...stage1({ eyes: EYES, eyeDef: 'glare', wingR: false,
      headExtra: [
        P([-3.3, 22.8, -0.8], [6.6, 1.4, 7.2], band),
        P([-3.85, 22.5, 6.45], [7.7, 1.05, 0.42], band),
        P([-3.85, 22.5, -0.3], [7.7, 1.05, 0.42], band),
        P([-3.85, 22.5, -0.1], [0.42, 1.05, 6.8], band),
        P([3.43, 22.5, -0.1], [0.42, 1.05, 6.8], band),
        P([-1.1, 21.6, -1.2], [2.2, 2.2, 1.0], band),
      ],
    }),
    { name: 'bandR', parent: 'head', pivot: [-0.5, 22.4, -1.2], rot: [-30, -12, 0], cubes: [P([-0.5, 20.8, -5.2], [0, 2.0, 4.0], bandTail, { plane: 'x' })] },
    { name: 'bandL', parent: 'head', pivot: [0.5, 22.0, -1.2], rot: [-44, 14, 0], cubes: [P([0.5, 20.6, -4.6], [0, 1.8, 3.4], bandTail, { plane: 'x' })] },
    { name: 'wingR', parent: 'body', pivot: [-6.0, 14.6, 3.6], rot: [0, 0, -6], cubes: [
      P([-7.6, 6.6, -2.2], [1.6, 8.6, 6.4], wingSegP({ base: [-6.0, 15.2, 4.2], dir: [0, -1, 0], len: 8.6, cdir: [0, 0, -1], chord: 6.4, kind: 'arm' })),
    ] },
    { name: 'handR', parent: 'wingR', pivot: [-6.8, 7.6, 1.2], cubes: [
      P([-7.4, 4.0, 1.2], [1.2, 4.4, 7.0], wingSegP({ base: [-6.8, 8.4, 1.2], dir: [0, 0, 1], len: 7.0, cdir: [0, -1, 0], chord: 4.4, kind: 'hand' })),
    ] },
    { name: 'gun', parent: 'handR', pivot: G, rot: [20, 0, 0], cubes: revolver(G, 1) },
  ],
};

export const anim = {
  start: 'idle', seed: 5,
  breathe: { bone: 'body', amp: 0.018, per: 2.2 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 4.8], dur: 0.1 },
  look: { bone: 'head', yaw: 30, pitch: 14, speed: 7 },
  springs: [
    { bone: 'bandR', tip: [0, -1, -4], k: 110, d: 8, gain: 0.9, max: 30 },
    { bone: 'bandL', tip: [0, -1, -3.5], k: 120, d: 8, gain: 0.9, max: 30 },
    { bone: 'tail', tip: [0, 0, -9], k: 200, d: 11, gain: 0.5, max: 14 },
  ],
  faces: { eyes: eyeFaces(EYES, 'glare') },
  clips: {
    idle: { len: 1.6, loop: true, f(P, t) {
      const b = Math.sin((t / 1.6) * Math.PI * 2);
      P.pos('body', 0, b * 0.2, 0);
    } },
  },
};
def.anim = anim;
