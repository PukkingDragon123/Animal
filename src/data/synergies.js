// Team synergies, applied by the battle sim at setup (src/battle/sim.js applySynergies).
//   scope 'team': one trainer's battle team must contain every species in `need`
//   scope 'side': every species in `need` fights on the same side (any trainer)
//   mods[species]: passive-style modifiers for those members · heal: { from, to, k, every } — while
//   `from` is still standing (on the field or on the bench), it heals `to` (on the field) k × max HP every `every` s.
const FAB = { dmgMul: 1.15, spdMul: 1.15 };
export const SYNERGIES = [
  { id: 'fab_four', name: 'Fab Four', scope: 'team', need: ['johnlemon', 'mccarapace', 'harrisun', 'starrfish'],
    desc: 'All four Beatles in one team: each of them deals +15% damage and moves 15% faster.', mods: { johnlemon: FAB, mccarapace: FAB, harrisun: FAB, starrfish: FAB } },
  { id: 'john_and_yoko', name: 'The Ballad of John & Yoko', scope: 'side', need: ['johnlemon', 'yokat'],
    desc: 'Johnlemon and Yokat on the same side: his elemental damage +20%, and she heals him 1% HP every second.', mods: { johnlemon: { elmMul: 1.2 } }, heal: { from: 'yokat', to: 'johnlemon', k: 0.01, every: 1 } },
];
