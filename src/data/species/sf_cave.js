// The Deep Cave under Alamo Hill — its own Tokonmon (original designs; they live in src/vx/game/cave.js).
// Format: docs/GAMEPLAY.md. Stats B(DMG, ELM, DEF, SPD, HP) at level 1. Moves: src/data/moves/sf_cave.js.
// Models: src/vx/mons/{geodig, lumoth, stalagrin, lumifin, tumblock, magmander}.js (cave_parts.js).
const B = (dmg, elm, def, spd, hp) => ({ dmg, elm, def, spd, hp });
const ULT = { ultHow: { battle: { ev: 'bond_secs', n: 90 } }, ultHint: 'Stay bonded for 90 s in total.' };

export const SPECIES = {
  geodig: {
    name: 'Geodig', elem: ['geo', 'cryo'], family: 'Beast', stage: 1, role: 'Burrowing skirmisher — tunnels under foes, crystal shard sprays, a geode guard',
    base: B(10, 8, 10, 8, 10), radius: 0.5,
    basic: { type: 'melee', power: 10, range: 1.5, rate: 0.6 },
    start: ['tunnel_strike', 'shard_spray'],
    moves: [
      { id: 'geode_guard', how: { level: 10 }, hint: 'Reach Lv.10.' },
      { id: 'quartz_quake', how: { battle: { ev: 'ko', n: 8 } }, hint: 'Knock out 8 foes.' },
    ],
    passives: [
      { id: 'crystal_back', how: { level: 8 }, hint: 'Reach Lv.8 (its crystals grow in).' },
      { id: 'dark_sight', how: { battle: { ev: 'perfect_dodge', n: 5 } }, hint: 'Perfectly dodge 5 attacks.' },
    ],
    ult: 'cave_in', ...ULT,
    gimmick: { id: 'geode_crown', name: 'Geode Crown', desc: 'The crystals on its back flare open: a shield, +20% defense, +10% elemental damage.', shield: 0.15, mods: { defMul: 1.2, elmMul: 1.1 } },
    evolve: [], temper: 'skittish', catch: 0.45, bond: 55, exp: 70,
    personality: 'A stubby, velvet-black mole with a pink star of a nose, shovel claws and a ridge of glowing blue crystals growing out of its back. Nearly blind, never lost: it hears the cave hum.',
  },
  lumoth: {
    name: 'Lumoth', elem: ['astro', 'aero'], family: 'Bug', stage: 1, role: 'Glow-dust caster — dazzling wing-flashes, sleepy dust, healing moonlight',
    base: B(6, 11, 7, 10, 9), radius: 0.45,
    basic: { type: 'ranged', power: 9, range: 6.5, rate: 0.6, speed: 13 },
    start: ['glow_dust', 'eyespot_flash'],
    moves: [
      { id: 'moonbeam_rest', how: { battle: { ev: 'heal', n: 400 } }, hint: 'Heal 400 HP.' },
      { id: 'lantern_dive', how: { level: 12 }, hint: 'Reach Lv.12.' },
    ],
    passives: [
      { id: 'drawn_to_light', how: { friendship: 150 }, hint: 'Become good friends (it follows your lantern).' },
      { id: 'powder_wings', how: { battle: { ev: 'crit', n: 10 } }, hint: 'Land 10 critical hits.' },
    ],
    ult: 'aurora_swarm', ...ULT,
    gimmick: { id: 'moon_wings', name: 'Moon Wings', desc: 'Its wings burn bright as two little moons: +20% elemental damage, heals +20%, faster dodges.', mods: { elmMul: 1.2, healMul: 1.2, dodgeCd: 0.75 } },
    evolve: [], temper: 'curious', catch: 0.5, bond: 60, exp: 66,
    personality: 'A plump, fuzzy cave moth with feathery antennae and wings painted with glowing eye-spots and constellation dots. It can\'t resist a lantern — or a nap in one.',
  },
  stalagrin: {
    name: 'Stalagrin', elem: ['geo', 'aero'], family: 'Spirit', stage: 1, role: 'Ambush diver — drops from the roof, dripstone darts, an echoing shriek',
    base: B(11, 7, 9, 11, 8), radius: 0.45,
    basic: { type: 'melee', power: 11, range: 1.6, rate: 0.55 },
    start: ['drip_drop', 'dripstone_darts'],
    moves: [
      { id: 'cave_shriek', how: { battle: { ev: 'stun', n: 6 } }, hint: 'Stun foes 6 times.' },
      { id: 'roof_hang', how: { level: 11 }, hint: 'Reach Lv.11.' },
    ],
    passives: [
      { id: 'pointed_end', how: { battle: { ev: 'crit', n: 12 } }, hint: 'Land 12 critical hits.' },
      { id: 'limestone_skin', how: { battle: { ev: 'hit_taken', n: 40 } }, hint: 'Take 40 hits.' },
    ],
    ult: 'thousand_points', ...ULT,
    gimmick: { id: 'drip_crown', name: 'Drip Crown', desc: 'A crown of fresh dripstone: +20% physical damage, +8% crit chance, immune to knockback.', mods: { physMul: 1.2, critChance: 0.08, knockImmune: true } },
    evolve: [], temper: 'aggressive', catch: 0.4, bond: 40, exp: 72,
    personality: 'A little stone imp that hangs upside down from cave roofs, its body one long grey dripstone, its wings thin sheets of flowstone. Two yellow eyes glint in the dark — then it drops.',
  },
  lumifin: {
    name: 'Lumifin', elem: ['hydro', 'volto'], family: 'Aquatic', stage: 1, role: 'Lure caster — a glowing lure that pulls foes in, then a jolt and a snap',
    base: B(8, 11, 8, 8, 10), radius: 0.5,
    basic: { type: 'ranged', power: 10, range: 6, rate: 0.6, speed: 14 },
    start: ['lure_light', 'deep_snap'],
    moves: [
      { id: 'photophore_pulse', how: { level: 12 }, hint: 'Reach Lv.12.' },
      { id: 'undertow', how: { battle: { ev: 'drown_foe', n: 4 } }, hint: 'Soak foes until they nearly drown, 4 times.' },
    ],
    passives: [
      { id: 'deep_glow', how: { level: 9 }, hint: 'Reach Lv.9.' },
      { id: 'cold_water', how: { battle: { ev: 'win', n: 8 } }, hint: 'Win 8 battles.' },
    ],
    ult: 'abyss_lantern', ...ULT,
    gimmick: { id: 'lantern_lure', name: 'Lantern Lure', desc: 'The lure blazes like a ship\'s lamp: +20% elemental damage and foes it hits are marked.', mods: { elmMul: 1.2 } },
    evolve: [], temper: 'curious', catch: 0.42, bond: 50, exp: 74,
    personality: 'A round deep-water fish with a jaw full of glassy teeth, glowing dots along its sides and a lantern lure bobbing on a stalk over its head. Swims slow circles under Mirror Lake, waiting for curious things.',
  },
  tumblock: {
    name: 'Tumblock', elem: ['geo', 'ferro'], family: 'Beast', stage: 1, role: 'Rolling tank — curls into a boulder and bowls foes over',
    base: B(11, 6, 13, 7, 11), radius: 0.55,
    basic: { type: 'melee', power: 12, range: 1.6, rate: 0.75 },
    start: ['tumble_roll', 'plate_curl'],
    moves: [
      { id: 'ore_spikes', how: { battle: { ev: 'shield_block', n: 10 } }, hint: 'Block 10 hits with a shield.' },
      { id: 'landslide', how: { level: 14 }, hint: 'Reach Lv.14.' },
    ],
    passives: [
      { id: 'banded_plates', how: { level: 8 }, hint: 'Reach Lv.8.' },
      { id: 'momentum', how: { battle: { ev: 'ko', n: 10 } }, hint: 'Knock out 10 foes.' },
    ],
    ult: 'avalanche_run', ...ULT,
    gimmick: { id: 'iron_bands', name: 'Iron Bands', desc: 'Ore veins harden in its plates: a shield, +25% defense, immune to knockback.', shield: 0.2, mods: { defMul: 1.25, knockImmune: true } },
    evolve: [], temper: 'territorial', catch: 0.4, bond: 45, exp: 76,
    personality: 'A rock-armadillo banded in granite plates flecked with ore. It rolls everywhere — downhill, uphill, into you. Uncurls, blinks, looks very pleased with itself.',
  },
  // ---- the Old Arena's guardian (cave.js): a story boss
  magmander: {
    name: 'Magmander', elem: ['pyro', 'geo'], family: 'Dragon', stage: 3, boss: true, role: 'BOSS — magma salamander: lava spit, tail sweeps, an eruption that cracks the arena',
    base: B(14, 14, 12, 7, 24), radius: 1.4,
    basic: { type: 'melee', power: 18, range: 2.4, rate: 0.85 },
    start: ['lava_spit', 'tail_sweep'],
    moves: [
      { id: 'magma_crawl', how: { level: 1 }, hint: 'Born to it.' },
      { id: 'obsidian_hide', how: { level: 1 }, hint: 'Born to it.' },
    ],
    passives: [{ id: 'molten_core', how: { level: 1 }, hint: 'Born to it.' }, { id: 'arena_lord', how: { level: 1 }, hint: 'Born to it.' }],
    ult: 'eruption', ...ULT,
    gimmick: { id: 'magma_gills', name: 'Magma Gills', desc: 'Its gill-crown blazes white-hot: a shield, +20% damage, burns last longer.', shield: 0.2, mods: { dmgMul: 1.2, takenMul: 0.9 } },
    evolve: [], temper: 'beast', catch: 0, bond: 0, exp: 460,
    personality: 'A colossal salamander of cracked black rock with magma glowing in every seam, a crown of feathery gills like fanned flames and a tail as long as a cable car. It has slept under the old arena since before the city — and it does not like being woken.',
  },
};
