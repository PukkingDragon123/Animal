// Lumifin — the lantern-fish of Mirror Lake (original). A round deep-water fish, navy above and pale below, with a
// jaw full of glassy teeth, a ring of glowing photophores along each flank, translucent blue fins and a lantern
// lure bobbing on a stalk over its head. It floats in the air when it fights, like every fish Tokonmon. Painters,
// clips: cave_parts.js.
import { B, both, twin, furP, finP, solidP, glowP, eyeP, caveClips, eyeFaces, animSpec } from './cave_parts.js';

const SKIN = furP('#24345a'), BELLY = furP('#7a90b0', { bias: -0.2 }), FIN = finP('#4a8ac8'), STALK = solidP('#3a4a6a');
const GLOW = glowP('#7af8ff', '#e6ffff'), LURE = glowP('#fff0a0', '#ffffff'), TOOTH = solidP('#e8f4ff', { top: '#ffffff', bottom: '#a8c0d8' });
const EYE = eyeP('#7ae0ff', { pupil: '#06101e' }), SHUT = solidP('#101828');

export const def = {
  name: 'lumifin', ppu: 3, scale: 0.55, outline: { color: '#060c18', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: [0, 7, 0], cubes: [
      B([-4.5, 4.4, -6], [9, 8.4, 11], SKIN), B([-4.0, 3.0, -5], [8, 2.2, 9], BELLY), B([-3.4, 12.6, -4.5], [6.8, 1.4, 8], SKIN),
      // photophores: two rows of glowing dots down each flank
      ...[-4, -1.5, 1, 3.5].flatMap((z) => both(B([-4.62, 5.6, z], [0.3, 0.9, 0.9], GLOW, { glow: true }))),
      ...[-2.5, 0.2, 2.8].flatMap((z) => both(B([-4.62, 8.0, z], [0.3, 0.7, 0.7], GLOW, { glow: true }))),
      B([-0.1, 12.8, -5], [0.2, 3.2, 6], FIN, { plane: 'x' }),                          // the dorsal fin
    ] },
    { name: 'head', parent: 'body', pivot: [0, 8, 5], cubes: [
      B([-4.2, 5.4, 5], [8.4, 7, 3.6], SKIN), ...both(B([-4.4, 9.0, 5.6], [1.6, 2.2, 2.2], EYE, { id: 'e-open' })), ...both(B([-4.4, 10.0, 5.6], [1.6, 0.5, 2.2], SHUT, { id: 'e-shut', hide: true })),
      ...[-3, -1.6, -0.2, 1.2, 2.4].map((x) => B([x, 5.0, 8.4], [0.7, 1.6, 0.5], TOOTH)),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 5.4, 5], cubes: [B([-4.0, 3.4, 4.8], [8, 2.2, 4.4], BELLY), ...[-2.6, -1, 0.6, 2].map((x) => B([x, 5.4, 8.6], [0.7, 1.4, 0.5], TOOTH))] },
    { name: 'lure', parent: 'head', pivot: [0, 12.4, 6], cubes: [
      B([-0.4, 12.4, 6], [0.8, 4.4, 0.8], STALK), B([-0.4, 16.4, 6.4], [0.8, 0.8, 3.4], STALK), B([-0.4, 14.8, 9.4], [0.8, 1.8, 0.8], STALK),
      B([-1.6, 12.2, 8.6], [3.2, 3.2, 3.2], LURE, { glow: true }),
    ] },
    ...twin({ name: 'finR', parent: 'body', pivot: [-4.5, 7, 1.5], cubes: [B([-10, 7, -1.5], [5.5, 0, 4.5], FIN, { plane: 'y' })] }),
    { name: 'tail', parent: 'body', pivot: [0, 8, -6], cubes: [B([-1.6, 6, -9], [3.2, 4, 3.2], SKIN), B([0, 3.2, -16], [0, 10, 7.4], FIN, { plane: 'x' })] },
  ],
};
export const anim = animSpec(caveClips('swim', { fx: 'bubble', glowFx: 'spark', hover: 4, headY: 9, headZ: 8 }), { faces: eyeFaces({ open: ['e-open'], closed: ['e-shut'] }) });
def.anim = anim;
