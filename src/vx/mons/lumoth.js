// Lumoth — the glowing cave moth of the Deep Cave (original). A plump, fuzzy cream moth with a white ruff,
// feathery amber antennae, big dark compound eyes and two pairs of dusky violet wings painted with glowing
// eye-spots and a scatter of constellation dots. It hovers, it can't resist a lantern. Painters, clips: cave_parts.js.
import { B, both, twin, furP, wingP, solidP, glowP, eyeP, caveClips, eyeFaces, animSpec } from './cave_parts.js';

const BODY = furP('#e6d8b8'), BAND = furP('#b89a6a'), RUFF = furP('#fff6e6', { bias: -0.15 }), LEG = solidP('#5a4a3a');
const ANT = solidP('#e0a040', { top: '#ffd080', bottom: '#a06020' }), EYE = eyeP('#5a6ae0', { pupil: '#1a1440' }), SHUT = solidP('#2a2040');
const W1 = wingP('#6a5aa0', '#7af0e0', { spots: [[0.6, 0.45, 0.2]], stars: 9 }), W1L = wingP('#6a5aa0', '#7af0e0', { spots: [[0.6, 0.45, 0.2]], stars: 9, flip: true });
const W2 = wingP('#5a4a88', '#f0d070', { spots: [[0.55, 0.55, 0.22]], stars: 5 }), W2L = wingP('#5a4a88', '#f0d070', { spots: [[0.55, 0.55, 0.22]], stars: 5, flip: true });
const SPOT = glowP('#9afff0', '#e8fffc'), SPOT2 = glowP('#ffe08a', '#fff6c8');

export const def = {
  name: 'lumoth', ppu: 3, scale: 0.5, outline: { color: '#16101e', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: [0, 7, 0], cubes: [
      B([-3.5, 4.5, -7], [7, 6, 9], BODY), B([-3.0, 5.0, -9], [6, 5, 2.4], BAND), B([-2.0, 5.6, -10.6], [4, 3.6, 1.8], BODY),
      B([-3.6, 6.0, -3.6], [7.2, 1.2, 4.6], BAND), B([-4.2, 8.0, 0.8], [8.4, 4.4, 3.6], RUFF),
      ...both(B([-3.0, 2.6, 0.5], [0.8, 2.6, 0.8], LEG, { pivot: [-2.6, 5, 0.9], rot: [0, 0, -16] })), ...both(B([-2.6, 2.4, -2.5], [0.8, 2.6, 0.8], LEG, { pivot: [-2.2, 5, -2.1], rot: [0, 0, -12] })),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 9, 3.5], cubes: [
      B([-3, 7.4, 3.2], [6, 5, 4.2], BODY), ...both(B([-4.2, 8.6, 4.6], [2.2, 2.8, 2.6], EYE, { id: 'e-open' })), ...both(B([-4.2, 9.6, 6.9], [2.2, 0.6, 0.4], SHUT, { id: 'e-shut', hide: true })),
      B([-1, 7.2, 7.2], [2, 1.2, 0.8], solidP('#c8a878')),
    ] },
    ...twin({ name: 'antR', parent: 'head', pivot: [-1.4, 12.2, 5], cubes: [B([-1.8, 12.2, 5], [0.8, 4.6, 0.8], ANT, { pivot: [-1.4, 12.2, 5], rot: [-30, 0, -20] }), B([-3.4, 13.4, 3.6], [0, 4.6, 3.6], ANT, { plane: 'x', pivot: [-1.4, 12.2, 5], rot: [-30, 0, -20] })] }),
    // forewings and hindwings (planes, spread sideways), each with a glowing eye-spot of its own
    { name: 'wingR', parent: 'body', pivot: [-3.4, 9.8, -0.5], cubes: [B([-17.4, 9.8, -7], [14, 0, 12], W1, { plane: 'y' }), B([-13.6, 9.9, -3.8], [2.6, 0, 2.6], SPOT, { plane: 'y', glow: true })] },
    { name: 'wingL', parent: 'body', pivot: [3.4, 9.8, -0.5], cubes: [B([3.4, 9.8, -7], [14, 0, 12], W1L, { plane: 'y' }), B([11, 9.9, -3.8], [2.6, 0, 2.6], SPOT, { plane: 'y', glow: true })] },
    { name: 'wing2R', parent: 'body', pivot: [-3.2, 9.4, -4], cubes: [B([-13.2, 9.4, -12.5], [10, 0, 8], W2, { plane: 'y' }), B([-9.6, 9.5, -9.8], [2.2, 0, 2.2], SPOT2, { plane: 'y', glow: true })] },
    { name: 'wing2L', parent: 'body', pivot: [3.2, 9.4, -4], cubes: [B([3.2, 9.4, -12.5], [10, 0, 8], W2L, { plane: 'y' }), B([7.4, 9.5, -9.8], [2.2, 0, 2.2], SPOT2, { plane: 'y', glow: true })] },
  ],
};
export const anim = animSpec(caveClips('fly', { fx: 'sparkle', glowFx: 'sparkle', hover: 5, headY: 10, headZ: 6 }), { faces: eyeFaces({ open: ['e-open'], closed: ['e-shut'] }) });
def.anim = anim;
