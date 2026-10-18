// Pidgun ♂ — a cocky street pigeon from the Tenderloin (homage: Guns N' Roses).
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { C, P, sh, mx, clamp, stage1, S1, eggBone, wingSegP, pigeonEyes, eyeFaces, featherCol, leatherP, bandanaP,
  metalP, stud, revolver, tipsP, muzzle, plant, strut, peck } from './pigeon_parts.js';

const EYES = pigeonEyes();
// ---------------------------------------------------------------- the vest
// black leather over the back and flanks (painted on the egg in its own frame), open down the front in a
// V; a stitched hem with a row of studs, studs across the shoulders, and on the back an original patch:
// a grinning skull in a red bandana
const E0 = S1.EC, L = C.leather;
const openW = (ye) => 1.15 + (ye + 1.2) * 0.42;
const SKULL = [
  '..rrrrrr..', '.rrwrrwrr.', 'rrrrrrrrrr', '.wwwwwwww.', 'wwwwwwwwww', 'ww..ww..ww', 'ww..ww..ww', 'wwwww.wwww',
  '.wwwwwwww.', '..w.w.w...', '..wwwwww..',
];
const vest = (q, face, n, l, A, B) => {
  const x = q[0], ye = q[1] - E0[1], ze = q[2] - E0[2];
  const hem = -1.4 + Math.max(0, -ze - 2) * 0.14;
  if (ye < hem || ze < -8.4) return undefined;
  if (ze > 3 && Math.abs(x) < openW(ye)) return undefined;
  const k = l > 0.72 ? 0 : l > 0.3 ? 1 : l > -0.22 ? 2 : l > -0.62 ? 3 : 4;
  if (face === 'up' && Math.abs(x) < 3.4 && ze > -5.2 && ze < -1.2) {         // the back patch
    const i = Math.floor((x + 3.4) * 1.5), j = Math.floor((-1.2 - ze) * 2.75), row = SKULL[j];
    if (row) { const ch = row[i]; if (ch === 'w') return '#f2ece0'; if (ch === 'r') return C.red[1]; }
    return Math.abs(x) > 3.0 || ze > -1.6 || ze < -4.8 ? C.red[2] : L[3];
  }
  if (ye < hem + 0.36) return L[Math.min(4, k + 1)];
  if (ye < hem + 1.0 && face !== 'up' && face !== 'down') return A % 4 === 0 ? C.chrome[1] : A % 4 === 1 ? C.chrome[3] : L[k];
  if (face === 'up' && ze > 1.0 && ze < 1.7) return A % 3 === 0 ? C.chrome[0] : A % 3 === 1 ? C.chrome[3] : L[k];
  return (A * 3 + B * 5) % 23 === 0 && k < 3 ? L[Math.max(0, k - 1)] : L[k];
};
const lapelP = leatherP({ stitch: false });
const studP = metalP(C.chrome);
const lapelCubes = [];
for (const sd of [-1, 1]) {
  const x0 = sd * 1.15;
  lapelCubes.push(P([sd < 0 ? x0 - 1.0 : x0, 8.6, 9.7], [1.0, 4.6, 0.55], lapelP, { pivot: [x0, 8.6, 9.95], rot: [0, 0, sd * -22.8] }));
  for (const y of [9.7, 11.1, 12.5]) { const xc = sd * (1.15 + 0.5 + (y - 8.6) * 0.42); lapelCubes.push(P([xc - 0.3, y - 0.3, 10.2], [0.6, 0.6, 0.32], studP)); }
}
const band = bandanaP(), bandTail = bandanaP({ border: false });
const G = [-8.9, 6.0, 6.8];
const HAND = wingSegP({ base: [-6.8, 8.4, 1.2], dir: [0, 0, 1], len: 7.0, cdir: [0, -1, 0], chord: 4.4, kind: 'hand' });

export const def = {
  name: 'pidgun', ppu: 3, scale: 0.32, outline: { color: C.ink, px: 1.4 },
  bones: [
    ...stage1({ eyes: EYES, eyeDef: 'glare', wingR: false, bodyRegion: vest,
      headExtra: [
        P([-3.95, 24.2, -0.6], [7.9, 1.0, 7.45], band),
        P([-3.0, 25.1, 0.0], [6.0, 0.4, 6.2], band),
        P([-4.15, 23.5, 6.78], [8.3, 1.1, 0.42], band),
        P([-4.15, 23.5, -0.92], [8.3, 1.1, 0.42], band),
        P([-4.15, 23.5, -0.5], [0.42, 1.1, 7.3], band),
        P([3.73, 23.5, -0.5], [0.42, 1.1, 7.3], band),
        P([-1.1, 22.6, -1.7], [2.2, 2.2, 1.0], band),
      ],
    }),
    eggBone('vest', lapelCubes),
    { name: 'bandR', parent: 'head', pivot: [-0.5, 23.4, -1.6], rot: [-30, -12, 0], cubes: [P([-0.5, 21.8, -5.6], [0, 2.0, 4.0], bandTail, { plane: 'x' })] },
    { name: 'bandL', parent: 'head', pivot: [0.5, 23.0, -1.6], rot: [-44, 14, 0], cubes: [P([0.5, 21.6, -5.0], [0, 1.8, 3.4], bandTail, { plane: 'x' })] },
    { name: 'wingR', parent: 'body', pivot: [-6.0, 14.6, 3.6], rot: [0, 0, -10], cubes: [
      P([-7.3, 6.6, -1.6], [1.3, 8.6, 5.8], wingSegP({ base: [-6.0, 15.2, 4.2], dir: [0, -1, 0], len: 8.6, cdir: [0, 0, -1], chord: 5.8, kind: 'arm' })),
      P([-6.65, 7.2, -3.1], [0, 7.4, 2.2], tipsP({ n: 4, cols: C.slate, dir: 'back' }), { plane: 'x' }),
    ] },
    { name: 'handR', parent: 'wingR', pivot: [-6.8, 7.6, 1.2], cubes: [
      P([-7.4, 4.0, 1.2], [1.2, 4.4, 7.0], HAND),
      P([-10.0, 3.4, 4.6], [3.4, 2.8, 3.2], HAND),
    ] },
    { name: 'gun', parent: 'handR', pivot: G, rot: [28, 0, 0], cubes: revolver(G, 1) },
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
