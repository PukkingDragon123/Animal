// Tumblock — the rock-armadillo of the Deep Cave's old mine (original). Banded in granite plates flecked with
// ore, a small blunt head with round ears and beady eyes, stubby clawed legs and an armoured tail. It curls into
// a boulder and rolls (clip "roll") — downhill, uphill, into you. Painters and clips: cave_parts.js.
import { B, both, twin, bandP, furP, solidP, eyeP, caveClips, eyeFaces, animSpec } from './cave_parts.js';

const PLATE = bandP('#8a7a6a', { ore: '#e8b84a', step: 5 }), PLATE2 = bandP('#7a6a5c', { ore: '#7ad0ff', step: 4 }), SKIN = furP('#c8a080');
const CLAW = solidP('#3a2a22'), EYE = eyeP('#2a1a12'), SHUT = solidP('#5a4030'), NOSE = solidP('#5a3a30');

export const def = {
  name: 'tumblock', ppu: 3, scale: 0.5, outline: { color: '#1a120c', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: [0, 6, 0], cubes: [
      // the banded shell: an arch of plates, higher in the middle
      B([-5.2, 2.6, -6.4], [10.4, 7.4, 3.2], PLATE), B([-5.6, 2.4, -3.2], [11.2, 8.6, 3.2], PLATE2), B([-5.6, 2.4, 0], [11.2, 8.8, 3.2], PLATE), B([-5.2, 2.6, 3.2], [10.4, 7.6, 3], PLATE2),
      B([-4.6, 10.4, -4.6], [9.2, 1.0, 9.2], PLATE), B([-4.0, 1.8, -5.6], [8, 1.2, 11], SKIN),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 5.6, 6], cubes: [
      B([-2.8, 3.2, 6], [5.6, 4.6, 3.8], PLATE), B([-1.8, 3.0, 9.6], [3.6, 2.8, 2.2], SKIN), B([-0.9, 3.8, 11.6], [1.8, 1.2, 0.6], NOSE),
      ...both(B([-3.2, 7.4, 6.4], [1.6, 2.2, 1.0], SKIN)), ...both(B([-2.4, 5.6, 9.7], [1.0, 1.0, 0.4], EYE, { id: 'e-open' })), ...both(B([-2.4, 5.9, 9.7], [1.0, 0.4, 0.4], SHUT, { id: 'e-shut', hide: true })),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 3.2, 10], cubes: [B([-1.4, 2.6, 9.6], [2.8, 0.8, 1.8], SKIN)] },
    ...twin({ name: 'legFR', parent: 'body', pivot: [-4.2, 3.4, 3.4], cubes: [B([-5.4, 0.4, 2.4], [2.4, 3, 2.4], SKIN), ...[-5.4, -4.2].map((x) => B([x, 0, 4.6], [0.8, 0.8, 1.2], CLAW))] }),
    ...twin({ name: 'legBR', parent: 'body', pivot: [-4.2, 3.4, -4.4], cubes: [B([-5.4, 0.4, -5.6], [2.4, 3, 2.6], SKIN), B([-5.2, 0, -3.2], [2, 0.8, 1], CLAW)] }),
    { name: 'tail', parent: 'body', pivot: [0, 4.4, -6.4], cubes: [B([-1.2, 3.2, -10.6], [2.4, 2.4, 4.4], PLATE2), B([-0.7, 3.4, -12.6], [1.4, 1.6, 2.2], PLATE)] },
  ],
};
export const anim = animSpec(caveClips('roll', { fx: 'dust', glowFx: 'rock', headY: 6, headZ: 10 }), { faces: eyeFaces({ open: ['e-open'], closed: ['e-shut'] }) });
def.anim = anim;
