// Spore-style evolution meta. Each run earns GENES (spent on permanent
// per-species stat upgrades) and EXP (levels up your gene pool). Upgrades stack
// onto the run as bonuses (applied in sim.createRun via the `upgrades` object).
import { SPECIES_LIST } from './species.js';

export const UPGRADES = [
  { key: 'speed', name: 'Speed', icon: '⚡', desc: '+6% move speed each level' },
  { key: 'vitality', name: 'Vitality', icon: '❤', desc: 'Survive +1 hit each level' },
  { key: 'longevity', name: 'Longevity', icon: '⧗', desc: '+8% lifespan each level' },
  { key: 'senses', name: 'Senses', icon: '◎', desc: '+12% feeding range each level' },
  { key: 'fertility', name: 'Fertility', icon: '✚', desc: 'Lv3+: twins & faster breeding' },
];
export const MAX_LEVEL = 5;
const ZERO = () => ({ speed: 0, vitality: 0, longevity: 0, senses: 0, fertility: 0 });

export function speciesUpgrades(save, id) { return (save.evolution && save.evolution[id]) || ZERO(); }
export function upgradeCost(level) { return 20 + level * 25; }     // genes for level → level+1
export function totalLevels(u) { return (u.speed + u.vitality + u.longevity + u.senses + u.fertility); }

export function canUpgrade(save, id, key) {
  const u = speciesUpgrades(save, id);
  return u[key] < MAX_LEVEL && save.genes >= upgradeCost(u[key]);
}
export function buyUpgrade(save, id, key) {
  if (!canUpgrade(save, id, key)) return false;
  if (!save.evolution) save.evolution = {};
  if (!save.evolution[id]) save.evolution[id] = ZERO();
  save.genes -= upgradeCost(save.evolution[id][key]);
  save.evolution[id][key] += 1;
  return true;
}

// per-run rewards from the finished run state
export function runRewards(s) {
  const genes = s.meals * 1 + s.offspring * 10 + s.maxStageIndex * 4 + (s.reproduced ? 12 : 0) + (s.nestBuilt ? 4 : 0);
  const exp = s.meals * 2 + s.offspring * 16 + s.maxStageIndex * 6 + (s.reproduced ? 22 : 0);
  return { genes: Math.max(1, Math.floor(genes)), exp: Math.max(1, Math.floor(exp)) };
}

export function expForLevel(level) { return 80 + (level - 1) * 60; }   // exp for level → level+1
// adds exp, levels up (each level grants bonus genes); returns levels gained
export function addExp(save, exp) {
  save.exp = (save.exp || 0) + exp;
  let gained = 0;
  while (save.exp >= expForLevel(save.level || 1)) {
    save.exp -= expForLevel(save.level || 1);
    save.level = (save.level || 1) + 1;
    save.genes = (save.genes || 0) + 15;
    gained++;
    if (gained > 50) break;
  }
  return gained;
}
