// Unique moves of the Deep Cave's Tokonmon (src/data/species/sf_cave.js). Format: src/data/skills.js.
const L = (line, list) => list.map((s) => Object.assign({ line }, s));

// ===================================================================== Geodig — the crystal-backed mole
export const GEODIG = L('geodig', [
  { id: 'tunnel_strike', name: 'Tunnel Strike', elem: 'geo', desc: 'Dives into the floor, tunnels under a foe and bursts up beneath it.', cost: 16, cd: 6, aim: 'point', range: 6, anim: 'special', fx: 'stomp', sfx: 'geo', scale: 'phys', windup: 0.3, telegraph: 'circle',
    eff: [{ t: 'dash', leap: true, iframe: true }, { t: 'aoe', r: 1.8, power: 30, knock: 3, up: 2.5, aura: 1, delay: 0.25, crack: true }], tags: ['dash', 'aoe'] },
  { id: 'shard_spray', name: 'Shard Spray', elem: 'cryo', desc: 'Shakes its back: a fan of crystal shards sprays the foes in front of it.', cost: 12, cd: 4, aim: 'dir', range: 5, anim: 'attack', fx: 'cryo', sfx: 'cryo',
    eff: [{ t: 'cone', range: 5, arc: 60, power: 18, knock: 1, aura: 1, status: { s: 'slow', dur: 2, k: 0.25 } }], tags: ['cone'] },
  { id: 'geode_guard', name: 'Geode Guard', elem: 'geo', desc: 'Curls up behind its crystals: blocks 70% of frontal damage and shards fly back.', cost: 12, cd: 7, aim: 'self', range: 0, anim: 'hurt', fx: 'guard', sfx: 'parry', windup: 0.05,
    eff: [{ t: 'buff', s: 'guard', k: 0.7, dur: 1.6, counter: 26 }], tags: ['guard'] },
  { id: 'quartz_quake', name: 'Quartz Quake', elem: 'geo', desc: 'Pounds the ground with both claws: crystals spike up all around it.', cost: 18, cd: 9, aim: 'self', range: 0, anim: 'attack', fx: 'geo_wall', sfx: 'slam', scale: 'phys', windup: 0.35, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'self', r: 2.6, power: 26, knock: 2, aura: 1, count: 2, interval: 0.35 }, { t: 'status', who: 'aoe', r: 2.6, s: 'root', dur: 1.2 }], tags: ['aoe'] },
  { id: 'cave_in', kind: 'ultimate', name: 'Cave-In', elem: 'geo', desc: 'ULTIMATE: it digs out the roof — rocks rain down round it, the last one a crystal boulder.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'special', fx: 'ult_fortress', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'timing', n: 2 },
    eff: [{ t: 'aoe', at: 'self', r: 4.2, power: 30, knock: 3, aura: 1.5, count: 4, interval: 0.4, lastMul: 2, crack: true }], tags: ['ult'] },
  { id: 'crystal_back', kind: 'passive', name: 'Crystal Back', elem: 'geo', desc: 'Its crystal ridge turns blows: takes 12% less damage.', mods: { takenMul: 0.88 } },
  { id: 'dark_sight', kind: 'passive', name: 'Dark Sight', elem: 'geo', desc: 'Hears every move in the dark: faster dodges, +6% crit chance.', mods: { dodgeCd: 0.8, critChance: 0.06 } },
]);

// ===================================================================== Lumoth — the glowing cave moth
export const LUMOTH = L('lumoth', [
  { id: 'glow_dust', name: 'Glow Dust', elem: 'astro', desc: 'Beats its wings over a spot: a cloud of glittering dust that makes foes drowsy.', cost: 18, cd: 9, aim: 'point', range: 8, anim: 'special', fx: 'pollen', sfx: 'sleep', windup: 0.3, telegraph: 'circle',
    eff: [{ t: 'zone', kind: 'pollen', r: 2.3, dur: 4, tick: { power: 4, aura: 0.5, status: { s: 'drowsy', dur: 0.6 } }, enemy: true }], tags: ['zone', 'sleep'] },
  { id: 'eyespot_flash', name: 'Eyespot Flash', elem: 'astro', desc: 'Throws its wings open: the glowing eye-spots flash and blind the foes in front.', cost: 12, cd: 6, aim: 'dir', range: 5, anim: 'attack', fx: 'glare', sfx: 'astro',
    eff: [{ t: 'cone', range: 5, arc: 70, power: 16, aura: 1, status: { s: 'blind', dur: 2 } }], tags: ['cone'] },
  { id: 'moonbeam_rest', name: 'Moonbeam Rest', elem: 'astro', desc: 'Folds its wings and glows like the moon: cleanses ailments and heals 24% over 4 s.', cost: 18, cd: 12, aim: 'self', range: 0, anim: 'win', fx: 'heal', sfx: 'bio_heal',
    eff: [{ t: 'buff', s: 'cleanse' }, { t: 'heal', k: 0.24, over: 4 }], tags: ['heal'] },
  { id: 'lantern_dive', name: 'Lantern Dive', elem: 'aero', desc: 'Dives at the brightest thing it sees — wings first — and flutters back.', cost: 14, cd: 6, aim: 'dir', range: 7, anim: 'attack', fx: 'gust', sfx: 'aero', windup: 0.15, telegraph: 'line',
    eff: [{ t: 'dash', dist: 7, speed: 16, power: 24, r: 1.0, knock: 2, aura: 1, iframe: true }], tags: ['dash'] },
  { id: 'aurora_swarm', kind: 'ultimate', name: 'Aurora Swarm', elem: 'astro', desc: 'ULTIMATE: every moth in the cave answers — a swirling aurora of wings that dazzles and burns.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'special', fx: 'ult_storm', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'aoe', at: 'self', r: 4.6, power: 24, aura: 1.5, count: 4, interval: 0.45, lastMul: 2, status: { s: 'blind', dur: 1.5 } }], tags: ['ult'] },
  { id: 'drawn_to_light', kind: 'passive', name: 'Drawn to Light', elem: 'astro', desc: 'While bonded it never leaves your light: +15% elemental damage.', when: { bonded: true }, mods: { elmMul: 1.15 } },
  { id: 'powder_wings', kind: 'passive', name: 'Powder Wings', elem: 'aero', desc: 'Scaly powder makes it slippery: faster dodges, takes 6% less damage.', mods: { dodgeCd: 0.8, takenMul: 0.94 } },
]);

// ===================================================================== Stalagrin — the dripstone imp
export const STALAGRIN = L('stalagrin', [
  { id: 'drip_drop', name: 'Drip Drop', elem: 'geo', desc: 'Lets go of the roof: it drops point-first on a foe and cracks the ground.', cost: 16, cd: 6, aim: 'point', range: 6, anim: 'attack', fx: 'slam', sfx: 'slam', scale: 'phys', windup: 0.35, telegraph: 'circle',
    eff: [{ t: 'dash', leap: true }, { t: 'aoe', r: 1.6, power: 32, knock: 2, up: 1.5, aura: 1, delay: 0.25, crack: true, status: { s: 'stun', dur: 0.6 } }], tags: ['dash', 'aoe'] },
  { id: 'dripstone_darts', name: 'Dripstone Darts', elem: 'geo', desc: 'Snaps off three stone darts from its wings and flings them in a fan.', cost: 12, cd: 4, aim: 'dir', range: 8, anim: 'shoot', fx: 'saw', sfx: 'geo',
    eff: [{ t: 'proj', count: 3, spread: 24, power: 14, speed: 15, r: 0.3, aura: 1 }], tags: ['projectile'] },
  { id: 'cave_shriek', name: 'Cave Shriek', elem: 'aero', desc: 'A shriek that bounces round the cave: everyone close is stunned and confused.', cost: 16, cd: 9, aim: 'self', range: 0, anim: 'roar', fx: 'screech', sfx: 'aero', windup: 0.3, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'self', r: 3, power: 12, knock: 3, aura: 1, status: { s: 'confuse', dur: 1.5 } }, { t: 'status', who: 'aoe', r: 3, s: 'stun', dur: 0.5 }], tags: ['aoe'] },
  { id: 'roof_hang', name: 'Roof Hang', elem: 'aero', desc: 'Flaps up out of reach and hangs upside down for a breather: heals 20% over 3 s.', cost: 14, cd: 12, aim: 'self', range: 0, anim: 'win', fx: 'heal', sfx: 'aero',
    eff: [{ t: 'buff', s: 'cleanse' }, { t: 'heal', k: 0.2, over: 3 }], tags: ['heal'] },
  { id: 'thousand_points', kind: 'ultimate', name: 'A Thousand Points', elem: 'geo', desc: 'ULTIMATE: the whole roof answers — a rain of stalactites, one after another, round it.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'roar', fx: 'meteor', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'mash', n: 12 },
    eff: [{ t: 'aoe', at: 'self', r: 4.4, power: 28, knock: 2, aura: 1.5, count: 5, interval: 0.3, lastMul: 1.8, crack: true }], tags: ['ult'] },
  { id: 'pointed_end', kind: 'passive', name: 'Pointed End', elem: 'geo', desc: 'Sharp at the tip: +10% crit chance.', mods: { critChance: 0.1 } },
  { id: 'limestone_skin', kind: 'passive', name: 'Limestone Skin', elem: 'geo', desc: 'Below 40% HP its skin hardens: +25% damage.', mods: { lowHpDmg: 0.25 } },
]);

// ===================================================================== Lumifin — the lantern-fish of Mirror Lake
export const LUMIFIN = L('lumifin', [
  { id: 'lure_light', name: 'Lure Light', elem: 'volto', desc: 'Dangles its glowing lure: a foe drifts closer… and gets a jolt.', cost: 14, cd: 7, aim: 'target', range: 7, anim: 'special', fx: 'zap', sfx: 'volto',
    eff: [{ t: 'pull', who: 'target', k: 4 }, { t: 'melee', power: 16, reach: 7, arc: 30, aura: 1, status: { s: 'stun', dur: 0.6 } }], tags: ['grab'] },
  { id: 'deep_snap', name: 'Deep Snap', elem: 'hydro', desc: 'Lunges with its glassy jaws wide open.', cost: 12, cd: 4, aim: 'target', range: 3, anim: 'attack', fx: 'water_dash', sfx: 'hydro_splash', scale: 'phys', windup: 0.2, telegraph: 'cone',
    eff: [{ t: 'melee', power: 26, reach: 1.9, arc: 90, knock: 2, lunge: 1.8, aura: 1 }], tags: ['melee'] },
  { id: 'photophore_pulse', name: 'Photophore Pulse', elem: 'volto', desc: 'Every glowing dot along its sides fires at once: a ring of light that crackles.', cost: 16, cd: 8, aim: 'self', range: 0, anim: 'special', fx: 'zap', sfx: 'volto', windup: 0.25, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'self', r: 2.8, power: 22, knock: 2, aura: 1, status: { s: 'slow', dur: 2, k: 0.3 } }], tags: ['aoe'] },
  { id: 'undertow', name: 'Undertow', elem: 'hydro', desc: 'Swirls a cold whirlpool that drags foes round and round.', cost: 18, cd: 10, aim: 'point', range: 7, anim: 'cast', fx: 'hydro', sfx: 'hydro', telegraph: 'circle',
    eff: [{ t: 'zone', kind: 'whirlpool', r: 2.4, dur: 4, tick: { power: 5, aura: 0.5, status: { s: 'slow', dur: 0.6, k: 0.3 } }, enemy: true }], tags: ['zone'] },
  { id: 'abyss_lantern', kind: 'ultimate', name: 'Abyss Lantern', elem: 'volto', desc: 'ULTIMATE: the lure blazes like a lighthouse in the deep — a beam that sweeps and shocks.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'special', fx: 'ult_beam', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'timing', n: 2 },
    eff: [{ t: 'aoe', at: 'self', r: 4.6, power: 28, knock: 2, aura: 1.5, count: 3, interval: 0.5, lastMul: 2.2, status: { s: 'stun', dur: 0.5 } }], tags: ['ult'] },
  { id: 'deep_glow', kind: 'passive', name: 'Deep Glow', elem: 'volto', desc: 'Its glow steadies it: +10% elemental damage.', mods: { elmMul: 1.1 } },
  { id: 'cold_water', kind: 'passive', name: 'Cold Water', elem: 'hydro', desc: 'Used to deep cold: takes 10% less damage.', mods: { takenMul: 0.9 } },
]);

// ===================================================================== Tumblock — the rock-armadillo
export const TUMBLOCK = L('tumblock', [
  { id: 'tumble_roll', name: 'Tumble Roll', elem: 'geo', desc: 'Curls into a boulder and bowls through the foes in its way.', cost: 16, cd: 6, aim: 'dir', range: 8, anim: 'special', fx: 'charge_dash', sfx: 'slam', scale: 'phys', windup: 0.3, telegraph: 'line',
    eff: [{ t: 'dash', dist: 8, speed: 14, power: 34, r: 1.2, knock: 5, aura: 1 }], tags: ['dash'] },
  { id: 'plate_curl', name: 'Plate Curl', elem: 'ferro', desc: 'Rolls up tight: a shield and +30% defense for 4 s.', cost: 12, cd: 9, aim: 'self', range: 0, anim: 'hurt', fx: 'shield', sfx: 'parry',
    eff: [{ t: 'buff', s: 'shield', k: 0.22, dur: 4 }, { t: 'buff', s: 'def', k: 0.3, dur: 4 }], tags: ['buff'] },
  { id: 'ore_spikes', name: 'Ore Spikes', elem: 'ferro', desc: 'Bristles the ore in its plates: blocks 70% of frontal damage and spikes back.', cost: 12, cd: 7, aim: 'self', range: 0, anim: 'hurt', fx: 'guard', sfx: 'parry', windup: 0.05,
    eff: [{ t: 'buff', s: 'guard', k: 0.7, dur: 1.8, counter: 30 }], tags: ['guard'] },
  { id: 'landslide', name: 'Landslide', elem: 'geo', desc: 'Leaps and lands curled: a wave of rubble rolls out in a line.', cost: 18, cd: 8, aim: 'point', range: 6, anim: 'special', fx: 'slam', sfx: 'slam', scale: 'phys', windup: 0.35, telegraph: 'circle',
    eff: [{ t: 'dash', leap: true }, { t: 'aoe', r: 2.4, power: 30, knock: 4, up: 2, aura: 1.2, delay: 0.3, crack: true, status: { s: 'defdown', dur: 3, k: 0.2 } }], tags: ['dash', 'aoe'] },
  { id: 'avalanche_run', kind: 'ultimate', name: 'Avalanche Run', elem: 'geo', desc: 'ULTIMATE: it rolls round and round the arena faster and faster, bowling everyone over — then one huge bounce.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'special', fx: 'ult_fortress', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'mash', n: 12 },
    eff: [{ t: 'aoe', at: 'self', r: 4.4, power: 26, knock: 4, aura: 1.5, count: 4, interval: 0.4, lastMul: 2.2, crack: true }], tags: ['ult'] },
  { id: 'banded_plates', kind: 'passive', name: 'Banded Plates', elem: 'ferro', desc: 'Granite bands: +20% defense.', mods: { defMul: 1.2 } },
  { id: 'momentum', kind: 'passive', name: 'Momentum', elem: 'geo', desc: 'Above 70% HP it keeps rolling: +15% damage.', when: { highHp: 0.7 }, mods: { dmgMul: 1.15 } },
]);

// ===================================================================== Magmander — the Old Arena's guardian (story boss)
export const MAGMANDER = L('magmander', [
  { id: 'lava_spit', name: 'Lava Spit', elem: 'pyro', desc: 'Spits three gobs of magma in an arc. They splash and burn where they land.', cost: 16, cd: 4, aim: 'point', range: 10, anim: 'special', fx: 'pyro_boom', sfx: 'pyro', windup: 0.35, telegraph: 'circle',
    eff: [{ t: 'proj', count: 3, spread: 30, power: 20, speed: 12, r: 0.45, aura: 1, arc: true, explode: { r: 1.4, k: 1 }, status: { s: 'burn', dur: 3 } }], tags: ['projectile'] },
  { id: 'tail_sweep', name: 'Tail Sweep', elem: 'geo', desc: 'Its whole tail sweeps the arena floor: everyone near is knocked flat.', cost: 18, cd: 6, aim: 'self', range: 0, anim: 'attack', fx: 'stomp', sfx: 'slam', scale: 'phys', windup: 0.4, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'self', r: 3.4, power: 34, knock: 5, up: 1.5, aura: 1.2 }], tags: ['aoe'] },
  { id: 'magma_crawl', name: 'Magma Crawl', elem: 'pyro', desc: 'Surges across the floor leaving a trail of fire.', cost: 16, cd: 7, aim: 'dir', range: 8, anim: 'attack', fx: 'fire_dash', sfx: 'pyro', scale: 'phys', windup: 0.3, telegraph: 'line',
    eff: [{ t: 'dash', dist: 8, speed: 13, power: 30, r: 1.4, knock: 4, aura: 1 }, { t: 'zone', kind: 'fire', r: 1.8, dur: 3, tick: { power: 6, aura: 0.5, status: { s: 'burn', dur: 2 } }, enemy: true }], tags: ['dash', 'zone'] },
  { id: 'obsidian_hide', name: 'Obsidian Hide', elem: 'geo', desc: 'Its skin cools to black glass: a shield and +30% defense.', cost: 14, cd: 12, aim: 'self', range: 0, anim: 'roar', fx: 'shield', sfx: 'geo',
    eff: [{ t: 'buff', s: 'shield', k: 0.2, dur: 5 }, { t: 'buff', s: 'def', k: 0.3, dur: 5 }], tags: ['buff'] },
  { id: 'eruption', kind: 'ultimate', name: 'Eruption', elem: 'pyro', desc: 'ULTIMATE: it roars and the arena erupts — fountains of magma, one after another, the last one enormous.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'roar', fx: 'ult_inferno', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'aoe', at: 'self', r: 5, power: 30, knock: 3, aura: 1.5, count: 4, interval: 0.5, lastMul: 2.2, crack: true, status: { s: 'burn', dur: 3 } }], tags: ['ult'] },
  { id: 'molten_core', kind: 'passive', name: 'Molten Core', elem: 'pyro', desc: 'Below 40% HP its core flares: +30% damage.', mods: { lowHpDmg: 0.3 } },
  { id: 'arena_lord', kind: 'passive', name: 'Lord of the Arena', elem: 'geo', desc: 'In its own arena: takes 12% less damage and can\'t be knocked back.', mods: { takenMul: 0.88, knockImmune: true } },
]);

export const MOVES = [...GEODIG, ...LUMOTH, ...STALAGRIN, ...LUMIFIN, ...TUMBLOCK, ...MAGMANDER];
