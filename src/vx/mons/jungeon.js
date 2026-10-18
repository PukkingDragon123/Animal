// Jungeon ♂ — stage 2 of the street-pigeon line ("Welcome to the Jungle"; homage: Guns N' Roses). Pidgun
// grown up and gone punk: taller and lankier on long coral legs, an iridescent mohawk of spiky crest
// feathers, a black tee printed with a white skeleton ribcage (the spine on the back), and its signature: the
// old six-shooter clenched in the corner of its bill like a cigar. Heavy-lidded yellow eyes with slit pupils —
// the bored punk stare. Drip (one choice per tier): a ripped red kerchief with cream rose buds or a studded
// choker; mirrored aviators pushed up at the foot of the mohawk or a gold chain with a little skull; a black
// guitar slung on its back or spiked leather shoulder pads. It bounces to a beat nobody else can hear, chews
// the revolver from one corner to the other, and fires it straight from its bill.
import { C, P, S2, MORPH, stage2, jungeonClips, pigeonEyeRig, shadesCubes, guitarCubes, chainCubes, chokerCubes, padCubes, kerchiefS2, revolver, muzzle, ATTACH_S2 } from './pigeon_parts.js';

// its own low-res eyes: a heavy flat lid over yellow-orange rings with slit pupils
const EYES = pigeonEyeRig({ grid: [5, 5], ring: ['#ffc23a', '#ff9a26'], pupil: 'slit', shape: 'heavy', at: S2.eyeAt, size: [10 / 3, 10 / 3] });
// the revolver: grip clenched crosswise in the bill, the barrel sticking out of the corner, forward and down
const CL = [-1.1, 27.0, 10.0], K = 0.64, G = [CL[0], CL[1] + 1.1, CL[2] + 0.5], MZ = muzzle(G, K);
const KER = kerchiefS2('jg-kerchief');
export const def = {
  name: 'jungeon', ppu: 3, scale: 0.34, outline: { color: C.ink, px: 1.4 },
  bones: [
    ...stage2({ M: MORPH.blue, neckExtra: [
      ...KER.neck,
      ...chokerCubes({ xs: 4.3, y: 21.2, z0: 0.4, z1: 7.8, id: 'jg-choker', hide: true }),
      ...chainCubes({ xs: 4.35, y: 19.0, z0: 0.4, z1: 7.8, at: [0, 15.2, 9.0], id: 'jg-chain', kind: 'skull' }),
    ] }),
    ...EYES.bones, ...KER.bones,
    { name: 'gun', parent: 'head', pivot: CL, rot: [15, -25, 90], cubes: revolver(G, K) },
    // mirrored aviators pushed up at the foot of the mohawk
    { name: 'shades', parent: 'head', pivot: [0, 32.3, 6.2], rot: [-40, 0, 0], cubes: shadesCubes([0, 32.3, 6.2], { k: 1.0, id: 'jg-shades', hide: true }) },
    // a black single-cut slung on its back
    { name: 'guitar', parent: 'body', pivot: [0.6, 15.4, -7.0], rot: [-30, 180, 28], cubes: guitarCubes([0.6, 15.4, -7.0], { k: 1.3, id: 'jg-guitar', hide: true, finish: ['#3a3446', '#262230', '#1a1622', '#0e0c12'] }) },
    { name: 'padR', parent: 'wingR', pivot: [-6.6, 20.6, 2.6], cubes: padCubes(-1, [-6.6, 20.6, 2.6], { id: 'jg-pads' }) },
    { name: 'padL', parent: 'wingL', pivot: [6.6, 20.6, 2.6], cubes: padCubes(1, [6.6, 20.6, 2.6], { id: 'jg-pads' }) },
  ],
};
// appearance tiers: normal wears one of the first list, dripped adds one of the second, ultra dripped the third
def.drip = [
  [{ id: 'jg-kerchief', name: 'Rose-bud kerchief' }, { id: 'jg-choker', name: 'Studded choker' }],
  [{ id: 'jg-shades', name: 'Mirror aviators' }, { id: 'jg-chain', name: 'Gold skull chain' }],
  [{ id: 'jg-guitar', name: 'Black guitar' }, { id: 'jg-pads', name: 'Spiked shoulder pads' }],
];
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
  faces: { eyes: EYES.slot },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'flip', 'flip', 'chew', 'stomp', 'peck'] },
  clips: jungeonClips({ prop: 'gun', MZ }),
};
def.anim = anim;
