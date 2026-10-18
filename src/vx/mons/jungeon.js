// Jungeon ♂ — stage 2 of the street-pigeon line ("Welcome to the Jungle"; homage: Guns N' Roses). Pidgun
// grown up and gone punk: taller and lankier on long coral legs, an iridescent mohawk of spiky crest
// feathers, a black tee printed with a white skeleton ribcage (the spine on the back), a ripped red
// kerchief scattered with little cream rose buds knotted round its neck, and the old six-shooter clenched in
// the corner of its bill like a cigar. Big dark kawaii eyes stuck at a glare. It bounces to a beat nobody
// else can hear, chews the revolver from one corner to the other, and fires it straight from its bill.
import { C, P, S2, MORPH, stage2, jungeonClips, kawaiiEyes, eyeFaces, revolver, muzzle, roseBandanaP, ATTACH_S2 } from './pigeon_parts.js';

const EYES = kawaiiEyes();
// the revolver: grip clenched crosswise in the bill, the barrel sticking out of the corner, forward and down
const CL = [-1.1, 27.0, 10.0], K = 0.64, G = [CL[0], CL[1] + 1.1, CL[2] + 0.5], MZ = muzzle(G, K);
const RED = ['#ff7a68', '#e2343e', '#b01c30', '#7a1026', '#4a0a1a'], CREAM = ['#fffaf2', '#f6e6dc', '#e8ccc4', '#c8a8a4', '#9a7a7a'];
const KER = roseBandanaP({ cols: RED, bud: CREAM }), KER2 = roseBandanaP({ cols: RED, bud: CREAM, phase: 3 });
// the kerchief's front: a triangle of the rose-bud print, ripped along its edges
const kerchiefP = (p, w, h, face, c) => {
  KER(p, w, h, 'south', c);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = Math.abs((i + 0.5) / w * 2 - 1), v = (j + 0.5) / h, rip = ((i * 5 + j * 3) % 7 === 0) ? 0.08 : 0;
    if (u > 1 - v * 0.92 - rip) p.px(i, j, 0); else if (u > 1 - v * 0.92 - 0.12) p.px(i, j, '#5a0c1c');
  }
};
export const def = {
  name: 'jungeon', ppu: 3, scale: 0.34, outline: { color: C.ink, px: 1.4 },
  bones: [
    ...stage2({ M: MORPH.blue, eyes: EYES, eyeDef: 'glare', neckExtra: [
      P([-4.55, 19.4, 7.62], [9.1, 1.3, 0.42], KER), P([-4.55, 19.4, -0.02], [9.1, 1.3, 0.42], KER2),
      P([-4.55, 19.4, 0.4], [0.42, 1.3, 7.3], KER2), P([4.13, 19.4, 0.4], [0.42, 1.3, 7.3], KER),
      P([-3.2, 16.6, 8.1], [6.4, 3.2, 0], kerchiefP, { plane: 'z', pivot: [0, 19.8, 8.1], rot: [-30, 0, 0] }),
      P([-1.0, 18.6, -0.9], [2.0, 1.8, 1.0], KER),
    ] }),
    { name: 'scarfR', parent: 'neck', pivot: [-0.5, 19.6, -0.9], rot: [-24, -14, 0], cubes: [P([-0.5, 17.6, -4.6], [0, 2.2, 3.8], KER, { plane: 'x' })] },
    { name: 'scarfL', parent: 'neck', pivot: [0.5, 19.2, -0.9], rot: [-38, 16, 0], cubes: [P([0.5, 17.4, -4.0], [0, 1.8, 3.2], KER2, { plane: 'x' })] },
    { name: 'gun', parent: 'head', pivot: CL, rot: [15, -25, 90], cubes: revolver(G, K) },
  ],
};
def.attach = ATTACH_S2;

export const anim = {
  start: 'idle', seed: 21,
  breathe: { bone: 'body', amp: 0.016, per: 2.4 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.0, 4.6], dur: 0.1 },
  look: { bone: 'head', yaw: 30, pitch: 12, speed: 8 },
  springs: [
    ...[0, 1, 2, 3, 4].map((i) => ({ bone: 'crest' + i, tip: [0, 4, 0], k: 160 - i * 12, d: 8, gain: 0.8, max: 24 })),
    { bone: 'scarfR', tip: [0, -1, -3.8], k: 110, d: 8, gain: 0.9, max: 30 },
    { bone: 'scarfL', tip: [0, -1, -3.2], k: 120, d: 8, gain: 0.9, max: 30 },
    { bone: 'tail', tip: [0, 0, -9], k: 200, d: 11, gain: 0.5, max: 14 },
    { bone: 'handR', tip: [0, -6, 0], k: 220, d: 11, gain: 0.4, max: 14, axes: [1, 0, 1] },
    { bone: 'handL', tip: [0, -6, 0], k: 220, d: 11, gain: 0.4, max: 14, axes: [1, 0, 1] },
  ],
  faces: { eyes: eyeFaces(EYES, 'glare') },
  fidget: { every: [4.5, 8], clips: ['chew', 'stomp', 'peck'] },
  clips: jungeonClips({ prop: 'gun', MZ }),
};
def.anim = anim;
