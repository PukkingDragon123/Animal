// Mutation SKILL TREE. Nodes are bought with genes (per species), have
// prerequisites, grant stat bonuses, and — the fun part — many physically
// MUTATE the 3D model (big ears, spikes, horns, fangs, glow, giant). Laid out
// in tiers (rows) for the tree UI; `req` draws the connecting lines.
import { SPECIES_LIST } from './species.js';

export const SKILLS = {
  // tier 0 — roots
  swift:   { name: 'Swift',     icon: '⚡', cost: 25, tier: 0, req: [], mods: { speedMul: 1.12 }, desc: '+12% speed' },
  sturdy:  { name: 'Sturdy',    icon: '🛡', cost: 25, tier: 0, req: [], mods: { extraHits: 1 }, desc: 'Survive +1 hit' },
  keen:    { name: 'Keen',      icon: '◎', cost: 25, tier: 0, req: [], mods: { eatMul: 1.18 }, desc: '+18% feeding range' },
  // tier 1 — first mutations
  longlegs:{ name: 'Long Legs', icon: '🦵', cost: 45, tier: 1, req: ['swift'], mods: { speedMul: 1.1, sizeMul: 1.06 }, visual: { legs: 1.5 }, desc: '+speed, taller legs' },
  spikes:  { name: 'Spikes',    icon: '🦔', cost: 50, tier: 1, req: ['sturdy'], mods: { dmgMul: 0.72 }, visual: { spikes: true }, desc: 'Back spikes, take less damage' },
  bigears: { name: 'Big Ears',  icon: '👂', cost: 45, tier: 1, req: ['keen'], mods: { eatMul: 1.2 }, visual: { ears: 1.7 }, desc: 'Huge ears, sense food' },
  // tier 2 — bold mutations
  giant:   { name: 'Giant',     icon: '🐘', cost: 85, tier: 2, req: ['longlegs'], mods: { sizeMul: 1.32, extraHits: 1 }, visual: { giant: true }, desc: 'Much bigger & tougher' },
  horns:   { name: 'Horns',     icon: '🦬', cost: 70, tier: 2, req: ['spikes'], mods: { extraHits: 1 }, visual: { horns: true }, desc: 'Horns — armored head' },
  fangs:   { name: 'Fangs',     icon: '🦷', cost: 70, tier: 2, req: ['spikes'], mods: { dmgMul: 0.72 }, visual: { fangs: true }, desc: 'Fearsome fangs' },
  glow:    { name: 'Bioglow',   icon: '✨', cost: 70, tier: 2, req: ['bigears'], mods: { eatMul: 1.15 }, visual: { glow: true }, desc: 'Glowing aura' },
  // tier 3 — apex
  ancient: { name: 'Ancient',   icon: '⧗', cost: 100, tier: 3, req: ['giant'], mods: { lifeMul: 1.5 }, desc: '+50% lifespan' },
  prolific:{ name: 'Prolific',  icon: '✚', cost: 100, tier: 3, req: ['glow'], mods: { fertile: true }, visual: { glow: true }, desc: 'Fertile — twins & fast breeding' },
};

export const SKILL_TIERS = 4;

export function speciesSkills(save, id) { return (save.skills && save.skills[id]) || []; }

export function applySkills(unlocked) {
  const bonus = { speedMul: 1, lifeMul: 1, eatMul: 1, sizeMul: 1, extraHits: 0, dmgMul: 1, fertile: false };
  const visuals = {};
  for (const nodeId of (unlocked || [])) {
    const n = SKILLS[nodeId]; if (!n) continue;
    const m = n.mods || {};
    if (m.speedMul) bonus.speedMul *= m.speedMul;
    if (m.lifeMul) bonus.lifeMul *= m.lifeMul;
    if (m.eatMul) bonus.eatMul *= m.eatMul;
    if (m.sizeMul) bonus.sizeMul *= m.sizeMul;
    if (m.extraHits) bonus.extraHits += m.extraHits;
    if (m.dmgMul) bonus.dmgMul *= m.dmgMul;
    if (m.fertile) bonus.fertile = true;
    if (n.visual) Object.assign(visuals, n.visual);
  }
  return { bonus, visuals };
}

export function reqMet(unlocked, nodeId) {
  const n = SKILLS[nodeId]; if (!n) return false;
  return n.req.every(r => unlocked.includes(r));
}
export function canUnlock(save, id, nodeId) {
  const n = SKILLS[nodeId]; if (!n) return false;
  const u = speciesSkills(save, id);
  return !u.includes(nodeId) && reqMet(u, nodeId) && (save.genes || 0) >= n.cost;
}
export function unlockSkill(save, id, nodeId) {
  if (!canUnlock(save, id, nodeId)) return false;
  if (!save.skills) save.skills = {};
  if (!save.skills[id]) save.skills[id] = [];
  save.genes -= SKILLS[nodeId].cost;
  save.skills[id].push(nodeId);
  return true;
}
