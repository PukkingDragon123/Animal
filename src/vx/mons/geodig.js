// Geodig — the crystal-backed mole of the Deep Cave (original). A stubby, velvet-black mole with a pink star of a
// nose, broad shovel claws, tiny glowing eyes and a ridge of blue-violet crystals growing out of its back that
// flare when it fights. Painters and clips: cave_parts.js.
import { B, both, twin, furP, crystalP, solidP, glowP, caveClips, eyeFaces, animSpec } from './cave_parts.js';

const FUR = furP('#3a3446'), BELLY = furP('#4a4258', { bias: -0.1 }), PINK = solidP('#f08aa6', { top: '#ffc0d0', bottom: '#b85a78' });
const CLAW = solidP('#e8e0cc', { top: '#ffffff', bottom: '#a89a80' }), CRY = crystalP(['#1a2a6e', '#2a5ab0', '#4a90e8', '#8ad0ff', '#e0f6ff']), CRY2 = crystalP(['#3a1a6e', '#5a2ab0', '#8a5ae0', '#c09aff', '#f0e6ff']);
const EYE = glowP('#8af0ff', '#e0ffff'), SHUT = solidP('#1a1420');
const crystal = (x, y, z, w, h, rx, rz, tex = CRY) => B([x, y, z], [w, h, w], tex, { glow: true, pivot: [x + w / 2, y, z + w / 2], rot: [rx, 0, rz] });

export const def = {
  name: 'geodig', ppu: 3, scale: 0.5, outline: { color: '#120c18', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: [0, 6, 0], cubes: [
      B([-5.5, 2.5, -6.5], [11, 8, 13], FUR), B([-4.5, 2.0, -4.5], [9, 2, 10], BELLY), B([-4, 9.6, -5], [8, 1.6, 10], FUR),
    ] },
    // the crystal ridge (it flares in specials)
    { name: 'crest', parent: 'body', pivot: [0, 10.5, -1], cubes: [
      crystal(-1.2, 10, 0, 2.4, 7, -10, 0), crystal(-2.6, 10, -3.2, 2, 5, -18, 16, CRY2), crystal(0.8, 10, -3.6, 1.8, 4.5, -14, -18), crystal(-0.9, 10, 3.0, 1.8, 4, 12, 6, CRY2), crystal(1.6, 9.8, 1.2, 1.4, 3, 0, -24), crystal(-3.0, 9.6, 1.0, 1.4, 3.2, 6, 26),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 6.5, 6], cubes: [
      B([-4, 3.5, 5.5], [8, 6, 5], FUR), B([-2.5, 3.8, 10.2], [5, 3.6, 2], FUR), B([-1.6, 4.1, 12], [3.2, 2.6, 1.2], PINK),
      // the star nose: little pink tentacles round the tip
      ...both(B([-2.6, 5.0, 12.4], [1.0, 0.8, 0.8], PINK)), B([-0.4, 6.8, 12.4], [0.8, 1.0, 0.8], PINK), B([-0.4, 3.4, 12.4], [0.8, 0.9, 0.8], PINK),
      ...both(B([-3.2, 7.4, 10.0], [1.0, 1.0, 0.4], EYE, { glow: true, id: 'e-open' })), ...both(B([-3.2, 7.7, 10.0], [1.0, 0.4, 0.4], SHUT, { id: 'e-shut', hide: true })),
      ...both(B([-4.6, 7.6, 7.5], [1.2, 1.6, 1.6], FUR)),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 4, 10], cubes: [B([-2, 3.0, 9.8], [4, 1, 2.2], PINK)] },
    ...twin({ name: 'legFR', parent: 'body', pivot: [-5, 4.5, 3.5], cubes: [B([-7.5, 0.5, 2], [3.5, 4.5, 3.5], FUR), B([-8.5, 0, 4.6], [5.5, 1.2, 2.6], CLAW), ...[-8.3, -6.9, -5.5].map((x) => B([x, 0, 7.0], [1.0, 1.0, 1.4], CLAW))] }),
    ...twin({ name: 'legBR', parent: 'body', pivot: [-4.5, 3.5, -4.5], cubes: [B([-6.5, 0, -6], [3, 3.5, 3], FUR), B([-6.8, 0, -4], [3.4, 0.8, 1.6], CLAW)] }),
    { name: 'tail', parent: 'body', pivot: [0, 5, -6.5], cubes: [B([-0.7, 4.2, -9], [1.4, 1.4, 3], PINK)] },
  ],
};
export const anim = animSpec(caveClips('quad', { fx: 'sparkle', glowFx: 'shard', headY: 8, headZ: 11 }), { faces: eyeFaces({ open: ['e-open'], closed: ['e-shut'] }) });
def.anim = anim;
