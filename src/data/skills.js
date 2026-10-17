// Skill library. Every active/ultimate is data: an aim mode, timings and a
// list of effect primitives the battle sim interprets (proj, melee, aoe,
// cone, line, zone, dash, heal, buff, wall, pull, summon, status, mark).
// Passives are stat/behaviour modifiers read by the sim.
//
// power numbers are scaled by the user's DMG (physical) or ELM (elemental)
// stat; `scale` picks which (default: elemental unless the skill is 'phys').

import { COMMON_PASSIVES } from './moves/common.js';
import { MOVES as STARTER_MOVES } from './moves/starters.js';
import { EXTRA_MOVES } from './moves/index.js';

const S = (o) => o;
export const SKILLS = {};
function def(list) { for (const s of list) { s.kind = s.kind || 'active'; s.cost = s.cost ?? 15; s.cd = s.cd ?? 6; s.windup = s.windup ?? 0.25; s.recover = s.recover ?? 0.3; s.range = s.range ?? 6; s.aim = s.aim || 'dir'; SKILLS[s.id] = s; } }

// ============================================================== PYRO
def([
  S({ id: 'ember_shot', name: 'Ember Shot', elem: 'pyro', desc: 'Spit a fireball. Hold to charge it into a blazing comet.', cost: 10, cd: 2.4, aim: 'dir', range: 9, anim: 'shoot', fx: 'fireball', sfx: 'pyro', charge: { max: 1.0, mult: 2.2 },
    eff: [{ t: 'proj', power: 22, speed: 14, r: 0.35, aura: 1, grow: 1.6 }], tags: ['projectile', 'charge'] }),
  S({ id: 'flame_fang', name: 'Flame Fang', elem: 'pyro', desc: 'Lunge and bite with burning fangs. May burn.', cost: 15, cd: 5, aim: 'target', range: 3.2, anim: 'attack', fx: 'bite_fire', sfx: 'pyro', scale: 'phys',
    eff: [{ t: 'melee', power: 32, reach: 1.6, arc: 90, knock: 1.5, aura: 1, lunge: 2.4, status: { s: 'burn', dur: 3, chance: 0.35, k: 0.25 } }], tags: ['melee'] }),
  S({ id: 'lantern_burst', name: 'Lantern Burst', elem: 'pyro', desc: 'Charge your lantern, then erupt in a ring of fire. Bigger the longer you hold.', cost: 25, cd: 9, aim: 'self', range: 0, anim: 'cast', fx: 'fire_nova', sfx: 'pyro_boom', telegraph: 'circle', charge: { max: 1.5, mult: 2.3, grow: 2.0 },
    eff: [{ t: 'aoe', at: 'self', r: 1.9, power: 34, knock: 4, aura: 2, destroy: true }], tags: ['aoe', 'charge'] }),
  S({ id: 'blaze_rush', name: 'Blaze Rush', elem: 'pyro', desc: 'Dash through foes, leaving a trail of fire.', cost: 20, cd: 8, aim: 'dir', range: 6, anim: 'attack3', fx: 'fire_dash', sfx: 'pyro', windup: 0.12,
    eff: [{ t: 'dash', dist: 6, power: 26, r: 1.0, knock: 3, aura: 1, iframe: true, trail: 'fire' }], tags: ['dash'] }),
  S({ id: 'fireworks', name: 'Hanabi Fireworks', elem: 'pyro', desc: 'Launch festival fireworks that rain down on an area.', cost: 25, cd: 10, aim: 'point', range: 9, anim: 'cast', fx: 'fireworks', sfx: 'pyro_boom', telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'point', r: 1.4, power: 18, aura: 1, delay: 0.7, count: 3, scatter: 1.6, knock: 2 }], tags: ['aoe'] }),
  S({ id: 'kindle', name: 'Kindle', elem: 'pyro', desc: 'Stoke your inner fire: next 3 hits deal +40% and set targets alight.', cost: 15, cd: 12, aim: 'self', range: 0, anim: 'roar', fx: 'buff_fire', sfx: 'pyro', windup: 0.2,
    eff: [{ t: 'buff', who: 'self', s: 'kindle', k: 0.4, n: 3, dur: 8 }], tags: ['buff'] }),
  S({ id: 'heat_wave', name: 'Heat Wave', elem: 'pyro', desc: 'Breathe a wide cone of shimmering heat.', cost: 20, cd: 7, aim: 'dir', range: 5, anim: 'roar', fx: 'fire_cone', sfx: 'pyro',
    eff: [{ t: 'cone', range: 5, arc: 80, power: 30, knock: 2, aura: 1, status: { s: 'slow', dur: 2, k: 0.25 } }], tags: ['cone'] }),
  S({ id: 'meteor_drop', name: 'Meteor Drop', elem: 'pyro', desc: 'Call down a blazing meteor after a short delay. Hold to grow it.', cost: 35, cd: 14, aim: 'point', range: 10, anim: 'cast', fx: 'meteor', sfx: 'pyro_boom', telegraph: 'circle', charge: { max: 1.2, mult: 1.8, grow: 1.4 },
    eff: [{ t: 'aoe', at: 'point', r: 2.4, power: 66, knock: 6, aura: 2, delay: 1.1, destroy: true, up: 4 }], tags: ['aoe', 'charge'] }),
  S({ id: 'flame_tail', name: 'Lantern Lash', elem: 'pyro', desc: 'Spin and whip your lantern tail around you.', cost: 14, cd: 5, aim: 'self', range: 0, anim: 'attack3', fx: 'fire_spin', sfx: 'pyro', scale: 'phys',
    eff: [{ t: 'aoe', at: 'self', r: 2.0, power: 24, knock: 3.5, aura: 1 }], tags: ['aoe'] }),
  // passives
  S({ id: 'overheat_core', kind: 'passive', name: 'Overheat Core', elem: 'pyro', desc: '+50% Heat gain. At full Heat, +20% damage for 6s.', mods: { heatGain: 1.5, overheatDmg: 0.2 } }),
  S({ id: 'ember_skin', kind: 'passive', name: 'Ember Skin', elem: 'pyro', desc: 'Melee attackers take burn damage.', mods: { emberSkin: 0.12 } }),
  S({ id: 'hothead', kind: 'passive', name: 'Hothead', elem: 'pyro', desc: 'Below 40% HP, deal +25% damage.', mods: { lowHpDmg: 0.25 } }),
  S({ id: 'fuel_tank', kind: 'passive', name: 'Fuel Tank', elem: 'pyro', desc: 'Charge moves 35% faster.', mods: { chargeSpeed: 1.35 } }),
  // ultimates
  S({ id: 'festival_inferno', kind: 'ultimate', name: 'Festival Inferno', elem: 'pyro', desc: 'Become a living matsuri fire: pull foes in, then erupt in a towering pillar of flame. Hit the drum beats to amplify!', aim: 'self', anim: 'roar', fx: 'ult_inferno', sfx: 'ult_start', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'pull', range: 5, k: 3 }, { t: 'aoe', at: 'self', r: 4.2, power: 150, knock: 8, aura: 2, delay: 1.0, destroy: true, up: 6 }] }),
  S({ id: 'solar_flare', kind: 'ultimate', name: 'Solar Flare', elem: 'astro', desc: 'A beam of pure sunlight.', aim: 'dir', anim: 'roar', fx: 'ult_beam', sfx: 'ult_start', qte: { type: 'timing' },
    eff: [{ t: 'line', range: 14, width: 2.2, power: 190, knock: 6, aura: 2, delay: 0.6 }] }),
]);

// ============================================================== HYDRO
def([
  S({ id: 'water_jet', name: 'Water Jet', elem: 'hydro', desc: 'A fast, precise jet. Dead-centre hits crit.', cost: 8, cd: 1.6, aim: 'dir', range: 11, anim: 'shoot', fx: 'water_bolt', sfx: 'hydro',
    eff: [{ t: 'proj', power: 20, speed: 22, r: 0.25, aura: 1, crit: 'center' }], tags: ['projectile', 'precision'] }),
  S({ id: 'ricochet', name: 'Ricochet Shot', elem: 'hydro', desc: 'A bouncing water bullet that ricochets between foes and walls up to 3 times.', cost: 18, cd: 6, aim: 'dir', range: 12, anim: 'shoot', fx: 'water_bolt', sfx: 'hydro',
    eff: [{ t: 'proj', power: 18, speed: 18, r: 0.3, aura: 1, bounce: 3, crit: 'center' }], tags: ['projectile', 'precision'] }),
  S({ id: 'bubble_trap', name: 'Bubble Trap', elem: 'hydro', desc: 'Plant a bubble mine. The first foe to touch it is trapped and soaked.', cost: 20, cd: 9, aim: 'point', range: 8, anim: 'cast', fx: 'bubble', sfx: 'hydro', windup: 0.2,
    eff: [{ t: 'summon', kind: 'trap', r: 0.9, dur: 12, power: 16, status: { s: 'stun', dur: 1.6 }, aura: 2 }], tags: ['trap', 'strategy'] }),
  S({ id: 'ink_smoke', name: 'Ink Smoke', elem: 'hydro', desc: 'Spray an ink cloud. Foes inside are blinded and lose track of you.', cost: 20, cd: 12, aim: 'point', range: 7, anim: 'shoot', fx: 'ink', sfx: 'hydro_splash',
    eff: [{ t: 'zone', at: 'point', r: 2.6, dur: 4.5, kind: 'ink', tick: { status: { s: 'blind', dur: 0.6 } }, enemy: true }], tags: ['zone', 'strategy'] }),
  S({ id: 'tidal_lance', name: 'Tidal Lance', elem: 'hydro', desc: 'Charge a piercing lance of pressurized water. Pierces every foe in line.', cost: 30, cd: 10, aim: 'dir', range: 14, anim: 'shoot', fx: 'water_lance', sfx: 'hydro_splash', telegraph: 'line', charge: { max: 1.2, mult: 2.2 },
    eff: [{ t: 'proj', power: 40, speed: 30, r: 0.4, aura: 2, pierce: true, crit: 'center', knock: 2 }], tags: ['projectile', 'precision', 'charge'] }),
  S({ id: 'hydro_barrage', name: 'Hydro Barrage', elem: 'hydro', desc: 'Fire five quick shots in a spread.', cost: 20, cd: 7, aim: 'dir', range: 9, anim: 'shoot', fx: 'water_bolt', sfx: 'hydro',
    eff: [{ t: 'proj', power: 11, speed: 18, r: 0.22, aura: 1, count: 5, spread: 40 }], tags: ['projectile'] }),
  S({ id: 'riptide_dash', name: 'Riptide Dash', elem: 'hydro', desc: 'Surf a quick wave — a dodge that leaves a soaking trail.', cost: 12, cd: 6, aim: 'dir', range: 5, anim: 'dodge', fx: 'water_dash', sfx: 'hydro_splash', windup: 0.05,
    eff: [{ t: 'dash', dist: 5, power: 10, r: 0.9, aura: 1, iframe: true, trail: 'wet' }], tags: ['dash'] }),
  S({ id: 'sniper_focus', name: 'Sniper Focus', elem: 'hydro', desc: 'Steady your aim: your next 2 shots are guaranteed crits with +50% range.', cost: 15, cd: 14, aim: 'self', range: 0, anim: 'cast', fx: 'buff_water', sfx: 'ui_confirm',
    eff: [{ t: 'buff', who: 'self', s: 'focus', n: 2, dur: 8 }], tags: ['buff', 'precision'] }),
  S({ id: 'whirlpool', name: 'Whirlpool', elem: 'hydro', desc: 'A swirling vortex that drags foes inward.', cost: 24, cd: 11, aim: 'point', range: 8, anim: 'cast', fx: 'whirlpool', sfx: 'hydro_splash', telegraph: 'circle',
    eff: [{ t: 'zone', at: 'point', r: 2.4, dur: 3.5, kind: 'whirl', pull: 2.5, tick: { power: 6, aura: 1 }, enemy: true }], tags: ['zone'] }),
  S({ id: 'deadeye', kind: 'passive', name: 'Deadeye', elem: 'hydro', desc: 'Precision crits deal +35% more damage.', mods: { critDmg: 0.35 } }),
  S({ id: 'slick', kind: 'passive', name: 'Slick', elem: 'hydro', desc: 'Dodge recharges 30% faster.', mods: { dodgeCd: 0.7 } }),
  S({ id: 'tactician', kind: 'passive', name: 'Tactician', elem: 'hydro', desc: 'Abilities cost 15% less energy.', mods: { costMul: 0.85 } }),
  S({ id: 'hydro_shell', kind: 'passive', name: 'Hydro Shell', elem: 'hydro', desc: '+20% defense while you or the ground around you is wet.', mods: { wetDef: 0.2 } }),
  S({ id: 'ink_sniper', kind: 'ultimate', name: 'Ink Sniper Barrage', elem: 'hydro', desc: 'Scope in: fire five pressurized ink rounds. Time each shot on the ring for headshots.', aim: 'target', anim: 'shoot', fx: 'ult_snipe', sfx: 'ult_start', qte: { type: 'timing', n: 5 },
    eff: [{ t: 'proj', power: 44, speed: 40, r: 0.35, aura: 2, crit: 'center', count: 5, burst: 0.28, knock: 2 }] }),
  S({ id: 'tsunami', kind: 'ultimate', name: 'Tsunami', elem: 'hydro', desc: 'Summon a towering wave across the arena.', aim: 'dir', anim: 'cast', fx: 'ult_wave', sfx: 'ult_start', qte: { type: 'timing' },
    eff: [{ t: 'line', range: 12, width: 5, power: 140, knock: 9, aura: 2, delay: 0.5 }] }),
]);

// ============================================================== BIO
def([
  S({ id: 'seed_shot', name: 'Seed Shot', elem: 'bio', desc: 'Spit a toxic seed that poisons on hit.', cost: 8, cd: 2.0, aim: 'dir', range: 9, anim: 'shoot', fx: 'seed', sfx: 'bio',
    eff: [{ t: 'proj', power: 16, speed: 15, r: 0.3, aura: 1, status: { s: 'poison', dur: 5, stacks: 1, k: 0.12 } }], tags: ['projectile', 'poison'] }),
  S({ id: 'mending_bloom', name: 'Mending Bloom', elem: 'bio', desc: 'Restore 26% HP over 3 seconds to yourself or an ally.', cost: 25, cd: 10, aim: 'ally', range: 9, anim: 'cast', fx: 'heal', sfx: 'bio_heal',
    eff: [{ t: 'heal', who: 'target', k: 0.26, over: 3 }], tags: ['heal'] }),
  S({ id: 'sleep_pollen', name: 'Sleep Pollen', elem: 'bio', desc: 'Release a pollen cloud. Foes who linger fall asleep.', cost: 25, cd: 14, aim: 'point', range: 8, anim: 'cast', fx: 'pollen', sfx: 'sleep', telegraph: 'circle',
    eff: [{ t: 'zone', at: 'point', r: 2.1, dur: 3.5, kind: 'pollen', tick: { status: { s: 'drowsy', dur: 0.6 } }, enemy: true }], tags: ['zone', 'sleep'] }),
  S({ id: 'toxic_thorns', name: 'Toxic Thorns', elem: 'bio', desc: 'A spray of poisoned thorns.', cost: 18, cd: 7, aim: 'dir', range: 4.5, anim: 'roar', fx: 'thorns', sfx: 'bio_poison',
    eff: [{ t: 'cone', range: 4.5, arc: 70, power: 18, aura: 1, status: { s: 'poison', dur: 5, stacks: 2, k: 0.12 } }], tags: ['cone', 'poison'] }),
  S({ id: 'vine_lash', name: 'Vine Lash', elem: 'bio', desc: 'Lash a vine around a foe and yank them close, rooting them briefly.', cost: 18, cd: 8, aim: 'target', range: 7, anim: 'attack', fx: 'vine', sfx: 'grab',
    eff: [{ t: 'pull', who: 'target', k: 4 }, { t: 'status', who: 'target', s: 'root', dur: 1.1 }, { t: 'melee', power: 12, reach: 9, arc: 30, aura: 1 }], tags: ['grab'] }),
  S({ id: 'spore_field', name: 'Spore Field', elem: 'bio', desc: 'Carpet the ground with spores: allies regenerate, foes are poisoned.', cost: 30, cd: 16, aim: 'self', range: 0, anim: 'cast', fx: 'spores', sfx: 'bio_heal',
    eff: [{ t: 'zone', at: 'self', r: 3.2, dur: 5, kind: 'spore', tick: { heal: 0.03, status: { s: 'poison', dur: 3, stacks: 1, k: 0.1 } } }], tags: ['zone', 'heal', 'poison'] }),
  S({ id: 'petal_dance', name: 'Petal Dance', elem: 'bio', desc: 'Whirl in a storm of razor petals, hitting everything around you.', cost: 20, cd: 9, aim: 'self', range: 0, anim: 'attack3', fx: 'petal_storm', sfx: 'bio',
    eff: [{ t: 'aoe', at: 'self', r: 2.2, power: 9, aura: 1, count: 6, interval: 0.25, knock: 0.6 }], tags: ['aoe'] }),
  S({ id: 'photosynth', name: 'Photosynth', elem: 'bio', desc: 'Soak up light: heal 12% and gain +30% ELM for 6s.', cost: 10, cd: 15, aim: 'self', range: 0, anim: 'cast', fx: 'buff_bio', sfx: 'bio_heal',
    eff: [{ t: 'heal', who: 'self', k: 0.12 }, { t: 'buff', who: 'self', s: 'elm', k: 0.3, dur: 6 }], tags: ['buff', 'heal'] }),
  S({ id: 'green_thumb', kind: 'passive', name: 'Green Thumb', elem: 'bio', desc: 'Your heals are 25% stronger.', mods: { healMul: 1.25 } }),
  S({ id: 'venom_glands', kind: 'passive', name: 'Venom Glands', elem: 'bio', desc: 'Poison applies +1 stack and lasts 2s longer.', mods: { poisonStacks: 1, poisonDur: 2 } }),
  S({ id: 'deep_sleep', kind: 'passive', name: 'Deep Sleep', elem: 'bio', desc: 'Sleep lasts 1s longer; the hit that wakes a foe deals +30%.', mods: { sleepDur: 1, wakeDmg: 0.3 } }),
  S({ id: 'photosynthesis', kind: 'passive', name: 'Photosynthesis', elem: 'bio', desc: 'Regenerate 1% HP per second.', mods: { regen: 0.01 } }),
  S({ id: 'sakura_sanctuary', kind: 'ultimate', name: 'Sakura Sanctuary', elem: 'bio', desc: 'A storm of blossoms: heal your whole team and lull every foe to sleep.', aim: 'self', anim: 'cast', fx: 'ult_sakura', sfx: 'ult_start', qte: { type: 'rhythm', beats: 3 },
    eff: [{ t: 'heal', who: 'team', k: 0.4, over: 4 }, { t: 'zone', at: 'self', r: 5, dur: 4, kind: 'pollen', tick: { status: { s: 'drowsy', dur: 0.9 } }, enemy: true }, { t: 'aoe', at: 'self', r: 5, power: 60, aura: 2 }] }),
]);

// ============================================================== GEO
def([
  S({ id: 'pebble_toss', name: 'Pebble Toss', elem: 'geo', desc: 'Lob a rock that bursts on landing.', cost: 8, cd: 2.4, aim: 'point', range: 8, anim: 'shoot', fx: 'rock_lob', sfx: 'geo', scale: 'phys',
    eff: [{ t: 'proj', power: 22, speed: 11, r: 0.35, aura: 1, arc: true, explode: { r: 0.9, k: 1 } }], tags: ['projectile'] }),
  S({ id: 'stone_wall', name: 'Stone Wall', elem: 'geo', desc: 'Raise a wall of stone that blocks attacks and movement.', cost: 20, cd: 10, aim: 'point', range: 6, anim: 'slam', fx: 'wall', sfx: 'geo_wall', windup: 0.3,
    eff: [{ t: 'wall', len: 3.2, hp: 120, dur: 8 }], tags: ['wall', 'strategy'] }),
  S({ id: 'hat_guard', name: 'Straw-Hat Guard', elem: 'geo', desc: 'Brace behind your hat: block 80% of frontal damage, then counter-slam.', cost: 12, cd: 6, aim: 'self', range: 0, anim: 'parry', fx: 'guard', sfx: 'parry', windup: 0.05,
    eff: [{ t: 'buff', who: 'self', s: 'guard', k: 0.8, dur: 1.6, counter: 30 }], tags: ['guard'] }),
  S({ id: 'rock_slam', name: 'Rock Slam', elem: 'geo', desc: 'Leap and slam down, stunning and shattering the ground.', cost: 25, cd: 9, aim: 'point', range: 5.5, anim: 'slam', fx: 'slam', sfx: 'slam', telegraph: 'circle', scale: 'phys', windup: 0.45,
    eff: [{ t: 'dash', dist: 0, leap: true, power: 0 }, { t: 'aoe', at: 'point', r: 2.0, power: 40, knock: 3, aura: 1, status: { s: 'stun', dur: 0.8 }, destroy: true, crack: true }], tags: ['aoe'] }),
  S({ id: 'earth_spikes', name: 'Earth Spikes', elem: 'geo', desc: 'A line of stone spikes erupts from the ground.', cost: 22, cd: 8, aim: 'dir', range: 7, anim: 'slam', fx: 'spikes', sfx: 'geo', telegraph: 'line',
    eff: [{ t: 'line', range: 7, width: 1.3, power: 32, knock: 1, up: 5, aura: 1, delay: 0.25, destroy: true }], tags: ['line'] }),
  S({ id: 'armor_up', name: 'Armor Up', elem: 'geo', desc: 'Encase yourself in stone: gain a shield worth 30% of max HP.', cost: 20, cd: 14, aim: 'self', range: 0, anim: 'flex', fx: 'shield', sfx: 'geo_wall',
    eff: [{ t: 'buff', who: 'self', s: 'shield', k: 0.3, dur: 7 }], tags: ['buff'] }),
  S({ id: 'boulder_roll', name: 'Boulder Roll', elem: 'geo', desc: 'Curl into a boulder and bowl through foes.', cost: 22, cd: 9, aim: 'dir', range: 7, anim: 'spin', fx: 'boulder', sfx: 'geo', scale: 'phys',
    eff: [{ t: 'dash', dist: 7, power: 34, r: 1.1, knock: 5, aura: 1, speed: 13 }], tags: ['dash'] }),
  S({ id: 'quicksand', name: 'Quicksand', elem: 'geo', desc: 'Turn the ground to quicksand, slowing foes heavily.', cost: 18, cd: 12, aim: 'point', range: 7, anim: 'cast', fx: 'quicksand', sfx: 'geo',
    eff: [{ t: 'zone', at: 'point', r: 2.5, dur: 5, kind: 'sand', tick: { status: { s: 'slow', dur: 0.6, k: 0.6 } }, enemy: true }], tags: ['zone'] }),
  S({ id: 'bedrock', kind: 'passive', name: 'Bedrock', elem: 'geo', desc: '+20% defense.', mods: { defMul: 1.2 } }),
  S({ id: 'thorny_hide', kind: 'passive', name: 'Stone Spines', elem: 'geo', desc: 'Reflect 15% of melee damage.', mods: { reflect: 0.15 } }),
  S({ id: 'immovable', kind: 'passive', name: 'Immovable', elem: 'geo', desc: 'Immune to knockback; staggers 50% shorter.', mods: { knockImmune: true, stagger: 0.5 } }),
  S({ id: 'fortify', kind: 'passive', name: 'Fortify', elem: 'geo', desc: 'Walls +50% HP, shields +25%.', mods: { wallHp: 1.5, shieldMul: 1.25 } }),
  S({ id: 'kiln_fortress', kind: 'ultimate', name: 'Kiln Fortress', elem: 'geo', desc: 'Trap the target in a ring of kiln walls, armor up, then collapse the walls inward.', aim: 'target', anim: 'slam', fx: 'ult_fortress', sfx: 'ult_start', qte: { type: 'mash', n: 14 },
    eff: [{ t: 'buff', who: 'self', s: 'shield', k: 0.5, dur: 8 }, { t: 'wall', ring: true, r: 2.4, hp: 200, dur: 2.2 }, { t: 'aoe', at: 'target', r: 2.6, power: 130, knock: 3, aura: 2, delay: 2.0, status: { s: 'stun', dur: 1.2 }, destroy: true }] }),
]);

// ============================================================== ECHO
def([
  S({ id: 'sound_wave', name: 'Sound Wave', elem: 'echo', desc: 'A wide wave of sound that pierces and knocks back. On-beat: +30%.', cost: 8, cd: 2.2, aim: 'dir', range: 8, anim: 'roar', fx: 'soundwave', sfx: 'echo', beat: true,
    eff: [{ t: 'proj', power: 18, speed: 11, r: 0.6, aura: 1, pierce: true, knock: 3, wave: true }], tags: ['projectile', 'sound'] }),
  S({ id: 'feedback_screech', name: 'Feedback Screech', elem: 'echo', desc: 'Screech feedback around you, confusing nearby foes.', cost: 22, cd: 10, aim: 'self', range: 0, anim: 'roar', fx: 'screech', sfx: 'echo_boom', beat: true,
    eff: [{ t: 'aoe', at: 'self', r: 2.6, power: 20, knock: 2, aura: 1, status: { s: 'confuse', dur: 1.6 } }], tags: ['aoe', 'sound'] }),
  S({ id: 'bass_drop', name: 'Bass Drop', elem: 'echo', desc: 'Drop the bass on an area: a delayed shockwave. Huge on the beat.', cost: 25, cd: 9, aim: 'point', range: 8, anim: 'cast', fx: 'bassdrop', sfx: 'echo_boom', telegraph: 'circle', beat: true,
    eff: [{ t: 'aoe', at: 'point', r: 2.3, power: 44, knock: 2, up: 5, aura: 2, delay: 0.6, destroy: true }], tags: ['aoe', 'sound'] }),
  S({ id: 'echo_clone', name: 'Echo Clone', elem: 'echo', desc: 'Leave an echo of yourself that repeats your attacks at 50% power.', cost: 25, cd: 14, aim: 'self', range: 0, anim: 'spin', fx: 'clone', sfx: 'echo',
    eff: [{ t: 'summon', kind: 'clone', dur: 6, k: 0.5 }], tags: ['summon'] }),
  S({ id: 'riff_slash', name: 'Riff Slash', elem: 'echo', desc: 'Three slashing power chords. If the last lands on the beat it stuns.', cost: 15, cd: 6, aim: 'target', range: 2.6, anim: 'attack2', fx: 'riff', sfx: 'echo', scale: 'phys', beat: true,
    eff: [{ t: 'melee', power: 12, reach: 1.8, arc: 120, knock: 0.6, aura: 1, lunge: 1.2, count: 3, interval: 0.18, beatStatus: { s: 'stun', dur: 0.7 } }], tags: ['melee', 'sound'] }),
  S({ id: 'sonar_ping', name: 'Sonar Ping', elem: 'echo', desc: 'Ping the arena: mark every foe (+15% damage taken) and interrupt channels.', cost: 10, cd: 8, aim: 'self', range: 0, anim: 'cast', fx: 'sonar', sfx: 'echo',
    eff: [{ t: 'mark', r: 12, dur: 6, k: 0.15 }], tags: ['debuff'] }),
  S({ id: 'crowd_surf', name: 'Crowd Surf', elem: 'echo', desc: 'Surf over the crowd: a dash that bounces off every foe it touches.', cost: 15, cd: 7, aim: 'dir', range: 6, anim: 'dodge', fx: 'surf', sfx: 'whoosh', windup: 0.08,
    eff: [{ t: 'dash', dist: 6, power: 20, r: 1.0, knock: 2.5, aura: 1, iframe: true }], tags: ['dash'] }),
  S({ id: 'amp_up', name: 'Amp Up', elem: 'echo', desc: 'Turn it up to 11: double knockback and a wider beat window for 6s.', cost: 15, cd: 15, aim: 'self', range: 0, anim: 'headbang', fx: 'buff_echo', sfx: 'echo',
    eff: [{ t: 'buff', who: 'self', s: 'amp', k: 1, dur: 6 }], tags: ['buff'] }),
  S({ id: 'perfect_pitch', kind: 'passive', name: 'Perfect Pitch', elem: 'echo', desc: 'Wider beat window; on-beat bonus becomes +40%.', mods: { beatWindow: 0.16, beatMul: 1.4 } }),
  S({ id: 'reverb', kind: 'passive', name: 'Reverb', elem: 'echo', desc: '20% chance for attacks to echo for 40% damage.', mods: { reverb: 0.2 } }),
  S({ id: 'mosh_spirit', kind: 'passive', name: 'Mosh Spirit', elem: 'echo', desc: 'Getting hit grants +10% speed for 3s (stacks 3×).', mods: { mosh: 0.1 } }),
  S({ id: 'groupie', kind: 'passive', name: 'Groupie', elem: 'echo', desc: 'Allies near you deal +10% damage.', mods: { groupie: 0.1 } }),
  S({ id: 'encore_loop', kind: 'ultimate', name: 'Encore Loop', elem: 'echo', desc: 'Play a four-beat riff: every perfect beat unleashes a sonic shockwave; the last one doubles.', aim: 'self', anim: 'headbang', fx: 'ult_encore', sfx: 'ult_start', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'aoe', at: 'self', r: 4, power: 38, knock: 4, aura: 2, count: 4, interval: 0.45, lastMul: 2 }] }),
]);

// ============================================================== OTHER ELEMENTS (wild / NPC / evolutions)
def([
  // VOLTO
  S({ id: 'zap', name: 'Zap', elem: 'volto', desc: 'A crackling bolt that chains to a second foe.', cost: 8, cd: 1.8, aim: 'dir', range: 9, anim: 'shoot', fx: 'zap', sfx: 'volto',
    eff: [{ t: 'proj', power: 17, speed: 24, r: 0.25, aura: 1, chain: { n: 1, r: 4, k: 0.6 } }] }),
  S({ id: 'thunder_fang', name: 'Thunder Fang', elem: 'volto', desc: 'An electrified bite that may stun.', cost: 15, cd: 5, aim: 'target', range: 3, anim: 'attack', fx: 'bite_volt', sfx: 'volto', scale: 'phys',
    eff: [{ t: 'melee', power: 28, reach: 1.6, arc: 90, aura: 1, lunge: 2.2, status: { s: 'stun', dur: 0.6, chance: 0.35 } }] }),
  S({ id: 'spark_dash', name: 'Spark Dash', elem: 'volto', desc: 'A lightning-fast dash that zaps everything in its path.', cost: 15, cd: 6, aim: 'dir', range: 6, anim: 'attack3', fx: 'volt_dash', sfx: 'volto', windup: 0.05,
    eff: [{ t: 'dash', dist: 6, power: 22, r: 0.9, aura: 1, iframe: true, speed: 20 }] }),
  S({ id: 'static_field', name: 'Static Field', elem: 'volto', desc: 'Electrify the ground: foes are slowed and shocked.', cost: 20, cd: 11, aim: 'point', range: 7, anim: 'cast', fx: 'static', sfx: 'volto',
    eff: [{ t: 'zone', at: 'point', r: 2.4, dur: 4, kind: 'static', tick: { power: 5, aura: 1, status: { s: 'slow', dur: 0.6, k: 0.35 } }, enemy: true }] }),
  S({ id: 'zest_spray', name: 'Zest Spray', elem: 'volto', desc: 'Spray sour, sparking juice in a cone. Stings the eyes.', cost: 12, cd: 4, aim: 'dir', range: 4, anim: 'shoot', fx: 'zest', sfx: 'volto',
    eff: [{ t: 'cone', range: 4, arc: 60, power: 14, aura: 1, status: { s: 'blind', dur: 1.2, chance: 0.4 } }] }),
  S({ id: 'discharge', name: 'Discharge', elem: 'volto', desc: 'Release stored electricity all around.', cost: 25, cd: 10, aim: 'self', range: 0, anim: 'roar', fx: 'discharge', sfx: 'volto', telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'self', r: 3, power: 38, knock: 3, aura: 2, delay: 0.5 }] }),
  S({ id: 'battery_charge', name: 'Battery Charge', elem: 'volto', desc: 'Recharge: +60 energy and +20% speed for 5s.', cost: 0, cd: 16, aim: 'self', range: 0, anim: 'cast', fx: 'buff_volt', sfx: 'volto',
    eff: [{ t: 'buff', who: 'self', s: 'energy', k: 60 }, { t: 'buff', who: 'self', s: 'spd', k: 0.2, dur: 5 }] }),
  S({ id: 'lemon_storm', kind: 'ultimate', name: 'Sour Thunder', elem: 'volto', desc: 'Lemon lightning rains everywhere.', aim: 'self', anim: 'roar', fx: 'ult_storm', sfx: 'ult_start', qte: { type: 'mash', n: 12 },
    eff: [{ t: 'aoe', at: 'self', r: 5, power: 30, aura: 2, count: 5, interval: 0.35, knock: 2, status: { s: 'stun', dur: 0.4 } }] }),
  // CRYO
  S({ id: 'ice_shard', name: 'Ice Shard', elem: 'cryo', desc: 'A freezing shard that slows.', cost: 8, cd: 2, aim: 'dir', range: 9, anim: 'shoot', fx: 'ice', sfx: 'cryo', eff: [{ t: 'proj', power: 17, speed: 17, r: 0.28, aura: 1, status: { s: 'slow', dur: 1.5, k: 0.3 } }] }),
  S({ id: 'frost_breath', name: 'Frost Breath', elem: 'cryo', desc: 'A cone of freezing breath.', cost: 18, cd: 7, aim: 'dir', range: 4.5, anim: 'roar', fx: 'frost_cone', sfx: 'cryo', eff: [{ t: 'cone', range: 4.5, arc: 70, power: 24, aura: 2, status: { s: 'slow', dur: 2, k: 0.45 } }] }),
  S({ id: 'blizzard', name: 'Blizzard', elem: 'cryo', desc: 'A whirling blizzard zone.', cost: 25, cd: 12, aim: 'point', range: 8, anim: 'cast', fx: 'blizzard', sfx: 'cryo', eff: [{ t: 'zone', at: 'point', r: 2.6, dur: 4, kind: 'snow', tick: { power: 6, aura: 1, status: { s: 'slow', dur: 0.6, k: 0.4 } }, enemy: true }] }),
  // AERO
  S({ id: 'gust', name: 'Gust', elem: 'aero', desc: 'A blast of wind that blows foes away.', cost: 10, cd: 3, aim: 'dir', range: 5, anim: 'roar', fx: 'gust', sfx: 'aero', eff: [{ t: 'cone', range: 5, arc: 70, power: 14, knock: 6, aura: 1 }] }),
  S({ id: 'air_slash', name: 'Air Slash', elem: 'aero', desc: 'A piercing blade of air.', cost: 10, cd: 2.2, aim: 'dir', range: 10, anim: 'attack2', fx: 'air_blade', sfx: 'aero', eff: [{ t: 'proj', power: 18, speed: 20, r: 0.4, aura: 1, pierce: true }] }),
  S({ id: 'tailwind', name: 'Tailwind', elem: 'aero', desc: 'Team speed +25% for 6s.', cost: 15, cd: 14, aim: 'self', range: 0, anim: 'cast', fx: 'buff_aero', sfx: 'aero', eff: [{ t: 'buff', who: 'team', s: 'spd', k: 0.25, dur: 6 }] }),
  S({ id: 'tornado', name: 'Tornado', elem: 'aero', desc: 'A tornado that drags and spins foes.', cost: 25, cd: 11, aim: 'point', range: 8, anim: 'cast', fx: 'tornado', sfx: 'aero', telegraph: 'circle', eff: [{ t: 'zone', at: 'point', r: 2.2, dur: 3, kind: 'tornado', pull: 3, tick: { power: 7, aura: 1 }, enemy: true }] }),
  // ECTO
  S({ id: 'shade_ball', name: 'Shade Ball', elem: 'ecto', desc: 'A ball of ghostly fire.', cost: 10, cd: 2.2, aim: 'dir', range: 9, anim: 'shoot', fx: 'shade', sfx: 'ecto', eff: [{ t: 'proj', power: 20, speed: 13, r: 0.35, aura: 1, homing: 2 }] }),
  S({ id: 'phase', name: 'Phase', elem: 'ecto', desc: 'Turn intangible for 1.4s.', cost: 15, cd: 9, aim: 'self', range: 0, anim: 'cast', fx: 'phase', sfx: 'ecto', eff: [{ t: 'buff', who: 'self', s: 'phase', dur: 1.4 }] }),
  S({ id: 'lantern_glare', name: 'Lantern Glare', elem: 'ecto', desc: 'A hypnotic glare that confuses.', cost: 18, cd: 9, aim: 'dir', range: 5, anim: 'roar', fx: 'glare', sfx: 'ecto', eff: [{ t: 'cone', range: 5, arc: 50, power: 14, aura: 1, status: { s: 'confuse', dur: 1.8 } }] }),
  S({ id: 'puppet_strings', name: 'Puppet Strings', elem: 'ecto', desc: 'Seize a foe with puppet strings and drag them.', cost: 20, cd: 9, aim: 'target', range: 8, anim: 'cast', fx: 'strings', sfx: 'ecto', eff: [{ t: 'pull', who: 'target', k: 5 }, { t: 'status', who: 'target', s: 'root', dur: 1.2 }] }),
  // FERRO
  S({ id: 'iron_bash', name: 'Iron Bash', elem: 'ferro', desc: 'A brutal metal-plated body slam.', cost: 15, cd: 5, aim: 'target', range: 3, anim: 'attack', fx: 'bash', sfx: 'ferro', scale: 'phys', eff: [{ t: 'melee', power: 32, reach: 1.6, arc: 90, knock: 3.5, aura: 1, lunge: 2.4 }] }),
  S({ id: 'chain_whip', name: 'Chain Whip', elem: 'ferro', desc: 'Whip a chain to drag a foe in.', cost: 18, cd: 8, aim: 'target', range: 6, anim: 'attack2', fx: 'chain', sfx: 'ferro', eff: [{ t: 'pull', who: 'target', k: 4 }, { t: 'melee', power: 16, reach: 7, arc: 30, aura: 1 }] }),
  S({ id: 'stud_shot', name: 'Stud Shot', elem: 'ferro', desc: 'Fire a spread of steel studs.', cost: 12, cd: 4, aim: 'dir', range: 8, anim: 'shoot', fx: 'studs', sfx: 'ferro', eff: [{ t: 'proj', power: 9, speed: 20, r: 0.2, aura: 1, count: 4, spread: 30 }] }),
  S({ id: 'sawblade', name: 'Sawblade Fin', elem: 'ferro', desc: 'Hurl a spinning sawblade that returns.', cost: 18, cd: 7, aim: 'dir', range: 9, anim: 'attack2', fx: 'saw', sfx: 'ferro', eff: [{ t: 'proj', power: 24, speed: 14, r: 0.45, aura: 1, pierce: true, boomerang: true }] }),
  S({ id: 'steel_guard', name: 'Steel Guard', elem: 'ferro', desc: 'Harden: +50% defense for 5s.', cost: 15, cd: 12, aim: 'self', range: 0, anim: 'flex', fx: 'buff_steel', sfx: 'ferro', eff: [{ t: 'buff', who: 'self', s: 'def', k: 0.5, dur: 5 }] }),
  S({ id: 'mosh_charge', name: 'Mosh Charge', elem: 'geo', desc: 'A telegraphed bull-rush that flattens everything in its path.', cost: 20, cd: 7, aim: 'dir', range: 8, anim: 'attack3', fx: 'charge_dash', sfx: 'slam', telegraph: 'line', windup: 0.7, scale: 'phys', eff: [{ t: 'dash', dist: 8, power: 38, r: 1.2, knock: 6, aura: 1, speed: 14 }] }),
  S({ id: 'crab_hammer', name: 'Sumo Slap', elem: 'hydro', desc: 'A thunderous open-claw sumo slap.', cost: 15, cd: 5, aim: 'target', range: 3, anim: 'attack', fx: 'slap', sfx: 'hit_heavy', telegraph: 'cone', windup: 0.55, scale: 'phys', eff: [{ t: 'melee', power: 34, reach: 1.9, arc: 100, knock: 4, aura: 1, lunge: 1.5 }] }),
  S({ id: 'shiko_stomp', name: 'Shiko Stomp', elem: 'geo', desc: 'A sumo stomp that shakes the ground.', cost: 20, cd: 9, aim: 'self', range: 0, anim: 'stomp', fx: 'stomp', sfx: 'slam', telegraph: 'circle', windup: 0.6, scale: 'phys', eff: [{ t: 'aoe', at: 'self', r: 2.8, power: 28, knock: 2, aura: 1, status: { s: 'stun', dur: 0.6 }, destroy: true }] }),
  // ASTRO / NUCLEO (legendaries & boss)
  S({ id: 'star_beam', name: 'Star Beam', elem: 'astro', desc: 'A beam of starlight.', cost: 20, cd: 6, aim: 'dir', range: 12, anim: 'roar', fx: 'star_beam', sfx: 'astro', eff: [{ t: 'line', range: 12, width: 1.2, power: 48, aura: 2, delay: 0.3 }] }),
  S({ id: 'gravity_well', name: 'Gravity Well', elem: 'astro', desc: 'A collapsing star drags foes in.', cost: 25, cd: 12, aim: 'point', range: 9, anim: 'cast', fx: 'gravity', sfx: 'astro', eff: [{ t: 'zone', at: 'point', r: 3, dur: 3, kind: 'gravity', pull: 4, tick: { power: 8, aura: 1 }, enemy: true }] }),
  S({ id: 'fission_breath', name: 'Fission Breath', elem: 'nucleo', desc: 'A cone of irradiated flame.', cost: 20, cd: 6, aim: 'dir', range: 6, anim: 'roar', fx: 'rad_cone', sfx: 'nucleo', eff: [{ t: 'cone', range: 6, arc: 70, power: 40, aura: 2, status: { s: 'radiation', dur: 4, k: 0.3 } }] }),
  S({ id: 'rift_shard', name: 'Rift Shard', elem: 'nucleo', desc: 'Hurl a jagged rift crystal.', cost: 12, cd: 3, aim: 'dir', range: 10, anim: 'shoot', fx: 'rift_shard', sfx: 'nucleo', eff: [{ t: 'proj', power: 30, speed: 16, r: 0.4, aura: 1, explode: { r: 1.3, k: 0.6 } }] }),
  S({ id: 'meltdown', kind: 'ultimate', name: 'Meltdown', elem: 'nucleo', desc: 'Reset everything.', aim: 'self', anim: 'roar', fx: 'ult_meltdown', sfx: 'ult_start', qte: { type: 'mash', n: 20 }, eff: [{ t: 'aoe', at: 'self', r: 7, power: 220, knock: 10, aura: 2, delay: 1.5, destroy: true }] }),
  S({ id: 'tusk_charge', name: 'Rift Tusk', elem: 'nucleo', desc: 'A rampaging tusk charge.', cost: 15, cd: 6, aim: 'dir', range: 9, anim: 'attack3', fx: 'charge_dash', sfx: 'beast_roar', telegraph: 'line', windup: 0.8, scale: 'phys', eff: [{ t: 'dash', dist: 9, power: 40, r: 1.3, knock: 7, aura: 1, speed: 15 }] }),
  // Beatles beetle signature moves
  S({ id: 'mop_top_spin', name: 'Mop-Top Spin', elem: 'bio', desc: 'Spin, shaking that famous mop-top. Hits all around.', cost: 12, cd: 5, aim: 'self', range: 0, anim: 'spin', fx: 'spin_leaf', sfx: 'bio', scale: 'phys', eff: [{ t: 'aoe', at: 'self', r: 1.8, power: 20, knock: 2, aura: 1 }] }),
  S({ id: 'twist_and_shout', name: 'Twist & Shout', elem: 'echo', desc: 'Twist into a spin, then shout a shockwave.', cost: 18, cd: 7, aim: 'self', range: 0, anim: 'roar', fx: 'screech', sfx: 'echo_boom', beat: true, eff: [{ t: 'aoe', at: 'self', r: 2.4, power: 26, knock: 4, aura: 1, status: { s: 'confuse', dur: 1.0, chance: 0.5 } }] }),
  S({ id: 'imagine', name: 'Imagine', elem: 'echo', desc: 'A peaceful melody: allies heal, foes lose the will to fight (-25% damage).', cost: 25, cd: 14, aim: 'self', range: 0, anim: 'cast', fx: 'peace', sfx: 'bio_heal', eff: [{ t: 'heal', who: 'team', k: 0.15, over: 3 }, { t: 'status', who: 'aoe', r: 6, s: 'weaken', dur: 5, k: 0.25 }] }),
  S({ id: 'yesterday', name: 'Yesterday', elem: 'hydro', desc: 'Rewind: restore HP lost in the last 3 seconds.', cost: 25, cd: 16, aim: 'self', range: 0, anim: 'cast', fx: 'rewind', sfx: 'hydro', eff: [{ t: 'heal', who: 'self', rewind: 3 }] }),
  S({ id: 'here_comes_the_sun', name: 'Here Comes the Sun', elem: 'pyro', desc: 'A rising sun burns foes and warms allies.', cost: 28, cd: 13, aim: 'self', range: 0, anim: 'cast', fx: 'sunrise', sfx: 'pyro_boom', eff: [{ t: 'aoe', at: 'self', r: 3.4, power: 44, aura: 2, knock: 3 }, { t: 'heal', who: 'team', k: 0.1 }] }),
  S({ id: 'octopus_garden', name: "Drum Roll", elem: 'geo', desc: 'A drum roll of rock hits on the target.', cost: 20, cd: 8, aim: 'target', range: 7, anim: 'attack2', fx: 'drumroll', sfx: 'geo', beat: true, eff: [{ t: 'aoe', at: 'target', r: 1.2, power: 10, count: 6, interval: 0.12, aura: 1 }] }),
  S({ id: 'paint_it_black', name: 'Paint It Black', elem: 'geo', desc: 'Splash obsidian paint that blinds and slows.', cost: 18, cd: 8, aim: 'dir', range: 5, anim: 'roar', fx: 'ink', sfx: 'geo', eff: [{ t: 'cone', range: 5, arc: 60, power: 20, aura: 1, status: { s: 'blind', dur: 2 } }] }),
  S({ id: 'rolling_stone', name: 'Rolling Stone', elem: 'geo', desc: 'Roll at full speed. Gathers no moss — cleanses your ailments.', cost: 15, cd: 6, aim: 'dir', range: 7, anim: 'spin', fx: 'boulder', sfx: 'geo', scale: 'phys', eff: [{ t: 'dash', dist: 7, power: 28, r: 1.0, knock: 4, aura: 1, speed: 14 }, { t: 'buff', who: 'self', s: 'cleanse' }] }),
  S({ id: 'rolling_moss', kind: 'passive', name: 'Gathers No Moss', elem: 'geo', desc: 'Immune to poison and root.', mods: { immune: ['poison', 'root'] } }),
  S({ id: 'with_a_little_help', kind: 'passive', name: 'Little Help From Friends', elem: 'geo', desc: 'Team combos charge 30% faster.', mods: { teamGain: 1.3 } }),
]);

// ---- Tokonmon: unique per-line moves (not shared) + common passives
def(COMMON_PASSIVES);
def(STARTER_MOVES);
for (const m of EXTRA_MOVES) def(m);
// shared skills = the classic library above (taught by vinyl discs); unique ones carry `line`
export const isUnique = (id) => !!(SKILLS[id] && SKILLS[id].line);
export const DISC_SKILLS = Object.values(SKILLS).filter((s) => !s.line && s.kind === 'active').map((s) => s.id);

export const skillOf = (id) => SKILLS[id];
export const isPassive = (id) => SKILLS[id] && SKILLS[id].kind === 'passive';
export const isUltimate = (id) => SKILLS[id] && SKILLS[id].kind === 'ultimate';

// Basic-action combos: recognised from the recent action buffer when an
// attack input arrives ('parry!' = a successful parry, 'dodge!' = perfect dodge).
export const COMBOS = [
  { id: 'reversal_suplex', seq: ['grab', 'parry!', 'attack'], name: 'Reversal Suplex', desc: 'Grab, parry their struggle, then slam them into the ground.', power: 70, knock: 2, up: 6, aoe: 1.8, stun: 1.0, crack: true },
  { id: 'overdrive', seq: ['charge', 'charge', 'attack'], name: 'Overdrive Strike', desc: 'Double-charge then strike for an elemental explosion.', power: 62, elemental: true, aoe: 2.2, knock: 5 },
  { id: 'elemental_strike', seq: ['charge', 'attack'], name: 'Elemental Strike', desc: 'Release charged elemental energy in one blow.', power: 38, elemental: true, knock: 3 },
  { id: 'riposte', seq: ['parry!', 'attack'], name: 'Riposte', desc: 'Counter right after a perfect parry — guaranteed crit.', power: 34, crit: true, knock: 3 },
  { id: 'perfect_counter', seq: ['dodge!', 'attack'], name: 'Witch-Time Counter', desc: 'A perfect dodge into an instant critical counter.', power: 36, crit: true, knock: 2 },
  { id: 'throw', seq: ['grab', 'attack'], name: 'Throw', desc: 'Hurl the grabbed foe — into walls, props or their friends.', power: 26, thrown: 7 },
  { id: 'dash_strike', seq: ['dodge', 'attack'], name: 'Dash Strike', desc: 'Dodge forward into a gap-closing strike.', power: 22, lunge: 3, knock: 1.5 },
  { id: 'tag_strike', seq: ['switch', 'attack'], name: 'Tag Strike', desc: 'Your partner bursts in with a relay attack that triggers reactions.', power: 30, elemental: true, relay: true, knock: 2 },
];
