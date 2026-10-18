// Pidgun ♂ — a cocky street pigeon from the Tenderloin (homage: Guns N' Roses).
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { C, P, sh, mx, clamp, stage1, S1, wingP, wingPaddle, pigeonEyes, eyeFaces, featherCol, leatherP, bandanaP,
  metalP, stud, revolver, muzzle, plant, strut, peck } from './pigeon_parts.js';

const EYES = pigeonEyes();
// the vest: black leather over the back and flanks, open down the front in a V
const openW = (y) => 1.55 + (y - 6.4) * 0.3;
const L = C.leather;
const vest = (q, face, n, l, A, B) => {
  const [x, y, z] = q;
  if (y < 7.0 + Math.max(0, -z - 6) * 0.25 || z < -9.8) return undefined;
  if (z > 2 && Math.abs(x) < openW(y)) return undefined;
  const k = l > 0.7 ? 0 : l > 0.3 ? 1 : l > -0.2 ? 2 : l > -0.6 ? 3 : 4;
  // a stitched hem, a sheen, a row of studs across the shoulders
  if (y < 7.5 + Math.max(0, -z - 6) * 0.25) return L[Math.min(4, k + 1)];
  if (face === 'up' && Math.abs(z + 2.2) < 0.34 && A % 3 === 0) return C.chrome[1];
  return (A + B) % 9 === 0 && k < 3 ? L[Math.max(0, k - 1)] : L[k];
};
const wingR = wingP(), wingL = wingP();
const lapel = leatherP({ stitch: false });
const studP = metalP(C.chrome);
const band = bandanaP(), bandTail = bandanaP({ border: false });

export const def = {
  name: 'pidgun', ppu: 3, scale: 0.32, outline: { color: C.ink, px: 1.4 },
  bones: [
    ...stage1({ eyes: EYES, bodyRegion: vest, eyeDef: 'glare',
      bodyExtra: [
        P([-2.65, 6.4, 8.3], [1.1, 8.6, 0.5], lapel, { pivot: [-1.55, 6.4, 8.55], rot: [0, 0, 16.7] }),
        P([1.55, 6.4, 8.3], [1.1, 8.6, 0.5], lapel, { pivot: [1.55, 6.4, 8.55], rot: [0, 0, -16.7] }),
        ...[8.2, 10.4, 12.6].flatMap((y) => { const x = 2.1 + (y - 6.4) * 0.3; return [P([-x - 0.3, y - 0.3, 8.75], [0.6, 0.6, 0.35], studP), P([x - 0.3, y - 0.3, 8.75], [0.6, 0.6, 0.35], studP)]; }),
      ],
      headExtra: [
        P([-3.55, 23.2, -0.95], [7.1, 1.4, 7.4], band),
        P([-4.25, 23.1, 6.75], [8.5, 1.05, 0.42], band),
        P([-4.25, 23.1, -0.65], [8.5, 1.05, 0.42], band),
        P([-4.25, 23.1, -0.5], [0.42, 1.05, 7.6], band),
        P([3.83, 23.1, -0.5], [0.42, 1.05, 7.6], band),
        P([-1.1, 22.2, -1.55], [2.2, 2.2, 1.0], band),
      ],
    }),
    { name: 'bandR', parent: 'head', pivot: [-0.5, 23.0, -1.5], rot: [-30, -12, 0], cubes: [P([-0.5, 21.4, -5.6], [0, 2.0, 4.2], bandTail, { plane: 'x' })] },
    { name: 'bandL', parent: 'head', pivot: [0.5, 22.6, -1.5], rot: [-44, 14, 0], cubes: [P([0.5, 21.2, -5.0], [0, 1.8, 3.6], bandTail, { plane: 'x' })] },
    { name: 'wingR', parent: 'body', pivot: [-7.1, 13.8, -0.6], rot: [16, 0, -4], cubes: wingPaddle(-1, wingR) },
    { name: 'handR', parent: 'wingR', pivot: [-7.1, 4.0, -0.6], cubes: [
      P([-10.4, 1.6, -0.9], [3.0, 2.6, 2.4], wingP({ prim0: 0 })),
    ] },
    { name: 'gun', parent: 'handR', pivot: [-9.2, 4.4, 0.4], rot: [8, 0, 0], cubes: revolver([-9.2, 4.4, 0.4], 1) },
    { name: 'wingL', parent: 'body', pivot: [7.1, 13.8, -0.6], rot: [30, 0, 6], cubes: wingPaddle(1, wingL) },
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
