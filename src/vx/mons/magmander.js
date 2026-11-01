// Magmander — the guardian of the Deep Cave's Old Arena (original story boss). A colossal salamander of cracked
// black obsidian with magma glowing in every seam: a broad flat head with a lower jaw full of embers, burning
// eyes, a crown of feathery gills fanned out like flames on each side, a ridge of molten scutes down its spine,
// four splayed clawed legs and a long, tapering tail in three segments. It crawls (clip "crawl") — even down
// walls. Painters and clips: cave_parts.js.
import { B, both, twin, lavaSkinP, solidP, glowP, crystalP, caveClips, eyeFaces, animSpec } from './cave_parts.js';

const SKIN = lavaSkinP('#3c2e30', '#ff7a24'), SKIN2 = lavaSkinP('#4c3832', '#ff9a30', { dense: true }), BELLY = lavaSkinP('#5a3a30', '#ffb040', { bias: -0.1 });
const SEAM = glowP('#ff7a20', '#ffd060'), CORE = glowP('#ffb040', '#fff0a0'), EYE = glowP('#fff0a0', '#ffffff'), SHUT = solidP('#1a1010');
const GILL = crystalP(['#7a1a08', '#c8400e', '#ff7a20', '#ffc040', '#fff2b0']), CLAW = solidP('#1a1414', { top: '#4a3a3a' }), TOOTH = solidP('#ffe0a0', { top: '#ffffff' });
const gill = (x, y, z, len, ry, rz) => B([x, y, z], [len, 1.4, 1.4], GILL, { glow: true, pivot: [x, y + 0.7, z + 0.7], rot: [0, ry, rz] });

export const def = {
  name: 'magmander', ppu: 2, scale: 1.5, outline: { color: '#0e0606', px: 1.6 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: [0, 7, 0], cubes: [
      B([-7.5, 3.6, -11], [15, 8.4, 23], SKIN), B([-6.5, 2.4, -9], [13, 1.6, 19], BELLY), B([-6, 11.8, -9.5], [12, 1.4, 20], SKIN2),
      // the molten ridge down its spine, and the seams along its flanks
      ...[-8, -3, 2, 7].map((z) => B([-1.4, 13.0, z], [2.8, 2.0, 3.2], CORE, { glow: true })),
      ...both(B([-7.58, 7.0, -9], [0.2, 0.9, 18], SEAM, { glow: true })), ...both(B([-7.58, 5.0, -6], [0.2, 0.7, 12], SEAM, { glow: true })),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 9, 11], cubes: [
      B([-8, 6, 11], [16, 6.6, 11], SKIN), B([-7, 12.4, 12], [14, 1.2, 8], SKIN2), B([-6.4, 6.2, 21.6], [12.8, 5, 1.8], SKIN),
      ...both(B([-7.4, 11.2, 17.2], [2.6, 2.2, 2.4], EYE, { glow: true, id: 'e-open' })), ...both(B([-7.4, 12.0, 17.2], [2.6, 0.7, 2.4], SHUT, { id: 'e-shut', hide: true })),
      ...[-5, -2.5, 0, 2.5].map((x) => B([x, 5.4, 22.4], [1.2, 1.6, 0.8], TOOTH)),
      // the gill crown: three feathery magma gills fanned out on each side
      gill(-8, 10.6, 13, -8, 30, 24), gill(-8, 9.0, 13.6, -9, 10, 0), gill(-8, 7.4, 14.2, -7, -12, -22),
      gill(8, 10.6, 13, 8, -30, -24), gill(8, 9.0, 13.6, 9, -10, 0), gill(8, 7.4, 14.2, 7, 12, 22),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 6.2, 12], cubes: [B([-7.4, 3.2, 12], [14.8, 3, 10.4], BELLY), B([-5.6, 5.6, 13], [11.2, 0.6, 8.4], CORE, { glow: true }), ...[-4, -1.5, 1, 3.5].map((x) => B([x, 6.0, 21.2], [1.0, 1.4, 0.8], TOOTH))] },
    ...twin({ name: 'legFR', parent: 'body', pivot: [-7, 7, 7], cubes: [B([-14, 4.4, 5.4], [7.4, 4.4, 4.4], SKIN), B([-17, 0, 4.2], [5, 5.4, 6], SKIN2), ...[-17.6, -15.8, -14].map((x) => B([x, 0, 10.0], [1.4, 1.2, 2.2], CLAW)), B([-14.2, 5.4, 6], [1, 0.6, 3], SEAM, { glow: true })] }),
    ...twin({ name: 'legBR', parent: 'body', pivot: [-7, 7, -7], cubes: [B([-14, 4.4, -9.2], [7.4, 4.4, 4.4], SKIN), B([-17, 0, -10.6], [5, 5.4, 6], SKIN2), ...[-17.6, -15.8, -14].map((x) => B([x, 0, -4.6], [1.4, 1.2, 2.2], CLAW))] }),
    { name: 'tail', parent: 'body', pivot: [0, 8, -11], cubes: [B([-5.6, 4.4, -25], [11.2, 7, 14.4], SKIN), B([-1.2, 11.2, -22], [2.4, 1.6, 9], CORE, { glow: true }), ...both(B([-5.68, 7, -24], [0.2, 0.8, 12], SEAM, { glow: true }))] },
    { name: 'tail2', parent: 'tail', pivot: [0, 7.6, -25], cubes: [B([-3.8, 5.0, -39], [7.6, 5, 14.4], SKIN), B([-0.9, 9.8, -36], [1.8, 1.2, 9], CORE, { glow: true })] },
    { name: 'tail3', parent: 'tail2', pivot: [0, 7.4, -39], cubes: [B([-2.2, 5.6, -53], [4.4, 3.2, 14.4], SKIN2), B([-1.4, 6.0, -57], [2.8, 2.2, 4.4], SKIN), B([-0.6, 8.6, -50], [1.2, 0.8, 8], CORE, { glow: true })] },
  ],
};
export const anim = animSpec(caveClips('quad', { fx: 'ember', glowFx: 'fire', big: true, crawl: true, headY: 10, headZ: 20 }), { faces: eyeFaces({ open: ['e-open'], closed: ['e-shut'] }) });
def.anim = anim;
