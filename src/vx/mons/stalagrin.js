// Stalagrin — the dripstone imp of the Deep Cave (original; a Tokonmon, not any real creature). Its body is one
// long grey stalactite in growth rings, ending in a sharp drip; a round stone head with two stubby horn-ears,
// a toothy grin and glowing yellow eyes; thin flowstone wings stretched over dark ribs. It hangs upside down
// from the roof (clip "hang") and drops on whatever walks under it. Painters and clips: cave_parts.js.
import { B, both, twin, flowP, membraneP, solidP, glowP, caveClips, eyeFaces, animSpec } from './cave_parts.js';

const STONE = flowP('#9a968e'), STONE2 = flowP('#b8b0a0'), DARK = solidP('#4a4642'), WING = membraneP('#8a8680');
const EYE = glowP('#ffe040', '#fff8c0'), SHUT = solidP('#2a2622'), FANG = solidP('#f0ece0', { top: '#ffffff', bottom: '#b8b0a0' });

export const def = {
  name: 'stalagrin', ppu: 3, scale: 0.5, outline: { color: '#14100e', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: [0, 9, 0], cubes: [
      B([-3.6, 8.6, -3.6], [7.2, 5, 7.2], STONE), B([-2.8, 5.6, -2.8], [5.6, 3.2, 5.6], STONE2), B([-2.0, 3.2, -2.0], [4, 2.6, 4], STONE),
      B([-1.2, 1.4, -1.2], [2.4, 2, 2.4], STONE2), B([-0.5, 0.2, -0.5], [1, 1.4, 1], STONE),
      ...both(B([-4.6, 11, -1], [1.2, 2.6, 2], DARK)),                                   // the wing-arms' elbows
    ] },
    { name: 'head', parent: 'body', pivot: [0, 13.6, 0.5], cubes: [
      B([-4.2, 13.4, -3.6], [8.4, 7, 7.6], STONE2), B([-3.6, 19.8, -3], [7.2, 1.4, 6], STONE),
      ...both(B([-4.6, 19.6, -1.6], [2, 3.8, 2], STONE, { pivot: [-3.6, 19.6, -0.6], rot: [0, 0, 22] })),     // horn-ears
      ...both(B([-3.2, 16.6, 3.9], [2, 1.6, 0.4], EYE, { glow: true, id: 'e-open' })), ...both(B([-3.2, 17.2, 3.9], [2, 0.5, 0.4], SHUT, { id: 'e-shut', hide: true })),
      B([-2.6, 14.2, 4.0], [5.2, 1.0, 0.3], DARK), ...both(B([-2.2, 13.6, 4.05], [0.7, 1.2, 0.3], FANG)), B([-0.35, 13.7, 4.05], [0.7, 1.0, 0.3], FANG),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 14, 2], cubes: [B([-2.4, 12.8, 1.4], [4.8, 1.2, 2.6], STONE)] },
    { name: 'wingR', parent: 'body', pivot: [-4.4, 13, 0], cubes: [B([-16.4, 4.6, 0], [12, 9.6, 0], WING, { plane: 'z' }), B([-16.6, 12.4, -0.5], [12.4, 1, 1], DARK), B([-16.8, 5.4, -0.4], [1, 7.6, 0.8], DARK)] },
    { name: 'wingL', parent: 'body', pivot: [4.4, 13, 0], cubes: [B([4.4, 4.6, 0], [12, 9.6, 0], WING, { plane: 'z', mirror: true }), B([4.2, 12.4, -0.5], [12.4, 1, 1], DARK), B([15.8, 5.4, -0.4], [1, 7.6, 0.8], DARK)] },
  ],
};
export const anim = animSpec(caveClips('fly', { fx: 'dust', glowFx: 'rock', hover: 4, hangY: 21, headY: 17, headZ: 4 }), { faces: eyeFaces({ open: ['e-open'], closed: ['e-shut'] }) });
def.anim = anim;
