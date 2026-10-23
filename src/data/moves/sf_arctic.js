// Unique moves, passives and ultimates of the Arctic Monkeys line (Snoozaque → Piledrilla →
// Fluorescape). Every name is an Arctic Monkeys song. NOT shared with other lines. Format: src/data/skills.js.
const L = (line, list) => list.map((s) => Object.assign({ line }, s));

// ===================================================================== Snoozaque → Piledrilla → Fluorescape (Arctic Monkeys)
export const SNOOZAQUE = L('snoozaque', [
  { id: 'snap_out_of_it', name: 'Snap Out of It', elem: 'cryo', desc: 'A lazy frosty backhand that snaps everyone awake — and may slow them.', cost: 8, cd: 2.2, aim: 'target', range: 2.6, anim: 'attack', fx: 'slap', sfx: 'cryo', scale: 'phys', windup: 0.15,
    eff: [{ t: 'melee', power: 14, reach: 1.5, arc: 100, knock: 1.5, lunge: 1.4, aura: 1, status: { s: 'slow', dur: 2, k: 0.3, chance: 0.5 } }], tags: ['melee'] },
  { id: 'mardy_bum', name: 'Mardy Bum', elem: 'cryo', desc: 'Sulks… then lobs a big wet snowball that bursts and slows. Hold to pack it harder.', cost: 12, cd: 3.4, aim: 'point', range: 8, anim: 'shoot', fx: 'ice', sfx: 'cryo', charge: { max: 1.0, mult: 1.8 },
    eff: [{ t: 'proj', power: 20, speed: 12, r: 0.4, aura: 1, arc: true, explode: { r: 1.2, k: 0.8 }, status: { s: 'slow', dur: 2, k: 0.35 } }], tags: ['projectile', 'charge'] },
  { id: 'when_the_sun_goes_down', name: 'When the Sun Goes Down', elem: 'cryo', desc: 'The streetlights dim: a patch of freezing night where foes slow down and get drowsy.', cost: 20, cd: 11, aim: 'point', range: 8, anim: 'cast', fx: 'blizzard', sfx: 'sleep', telegraph: 'circle',
    eff: [{ t: 'zone', kind: 'snow', r: 2.4, dur: 4.5, tick: { power: 5, aura: 0.6, status: { s: 'drowsy', dur: 0.55 } }, enemy: true }], tags: ['zone'] },
  { id: 'dancefloor', name: 'I Bet You Look Good on the Dancefloor', elem: 'cryo', desc: 'Shuffles across the ice like it\'s 2005: a slippery dodge, then +20% speed for 5 s.', cost: 12, cd: 7, aim: 'dir', range: 5, anim: 'dodge', fx: 'water_dash', sfx: 'whoosh', windup: 0.05,
    eff: [{ t: 'dash', dist: 5, speed: 18, power: 10, r: 0.8, knock: 1, aura: 0.6, iframe: true, trail: 'wet' }, { t: 'buff', s: 'spd', k: 0.2, dur: 5 }], tags: ['dash', 'buff'] },
  { id: 'fake_tales_of_san_francisco', name: 'Fake Tales of San Francisco', elem: 'cryo', desc: 'Tells a tall tale: a snow double appears beside it and echoes its hits for 6 s.', cost: 18, cd: 12, aim: 'self', range: 0, anim: 'cast', fx: 'clone', sfx: 'shimmer',
    eff: [{ t: 'summon', kind: 'clone', dur: 6, k: 0.4 }], tags: ['summon'] },
  // ---- Piledrilla (ice knuckles)
  { id: 'piledriver_waltz', name: 'Piledriver Waltz', elem: 'cryo', desc: 'Raises both ice fists and pile-drives the ground in front of it. May stun.', cost: 18, cd: 5, aim: 'target', range: 3.2, anim: 'slam', fx: 'slam', sfx: 'slam', scale: 'phys', windup: 0.4, telegraph: 'cone',
    eff: [{ t: 'melee', power: 38, reach: 2.0, arc: 110, knock: 3, up: 3, lunge: 1, aura: 1, status: { s: 'stun', dur: 0.7, chance: 0.4 } }], tags: ['melee'] },
  { id: 'r_u_mine', name: 'R U Mine?', elem: 'cryo', desc: 'Reaches out with an ice fist, drags a foe in close and asks the question.', cost: 16, cd: 8, aim: 'target', range: 6, anim: 'attack2', fx: 'chain', sfx: 'grab', scale: 'phys',
    eff: [{ t: 'pull', who: 'target', k: 4 }, { t: 'melee', power: 22, reach: 7, arc: 30, aura: 1 }], tags: ['grab'] },
  { id: 'brick_by_brick', name: 'Brick by Brick', elem: 'geo', desc: 'Stacks a wall of ice bricks that blocks attacks and movement.', cost: 18, cd: 10, aim: 'point', range: 6, anim: 'slam', fx: 'wall', sfx: 'geo_wall', windup: 0.3,
    eff: [{ t: 'wall', len: 4, hp: 140, dur: 8 }], tags: ['wall', 'strategy'] },
  { id: 'do_i_wanna_know', name: 'Do I Wanna Know?', elem: 'cryo', desc: 'Crawlin\' back to you: a slow, heavy shockwave rolls along the ground and drags every foe in reach toward it.', cost: 22, cd: 9, aim: 'dir', range: 9, anim: 'stomp', fx: 'stomp', sfx: 'slam', windup: 0.35, telegraph: 'line',
    eff: [{ t: 'line', range: 9, width: 1.8, power: 40, knock: 1, aura: 1, delay: 0.4 }, { t: 'pull', range: 9, k: 2.5 }], tags: ['line'] },
  { id: 'crying_lightning', name: 'Crying Lightning', elem: 'cryo', desc: 'Icy tears crackle with static: three shard bolts, each hopping to a second foe.', cost: 14, cd: 4, aim: 'dir', range: 9, anim: 'shoot', fx: 'ice', sfx: 'cryo',
    eff: [{ t: 'proj', power: 14, speed: 20, r: 0.25, aura: 1, count: 3, burst: 0.12, chain: { n: 1, r: 4, k: 0.5 } }], tags: ['projectile'] },
  // ---- Fluorescape (fluorescent crystal crooner)
  { id: 'fluorescent_adolescent', name: 'Fluorescent Adolescent', elem: 'astro', desc: 'Every crystal flares under blacklight: a fluorescent beam that blinds.', cost: 20, cd: 7, aim: 'dir', range: 10, anim: 'roar', fx: 'star_beam', sfx: 'astro', windup: 0.3, telegraph: 'line',
    eff: [{ t: 'line', range: 10, width: 1.4, power: 42, knock: 2, aura: 1.5, delay: 0.3, status: { s: 'blind', dur: 1.6 } }], tags: ['line'] },
  { id: 'better_be_a_mirrorball', name: 'There\'d Better Be a Mirrorball', elem: 'cryo', desc: 'Conjures a spinning ice mirrorball: a patch of dazzling, freezing light that blinds foes inside.', cost: 20, cd: 11, aim: 'point', range: 8, anim: 'cast', fx: 'shimmer', sfx: 'shimmer', telegraph: 'circle',
    eff: [{ t: 'zone', kind: 'snow', r: 2.6, dur: 5, tick: { power: 6, aura: 0.6, status: { s: 'blind', dur: 0.6 } }, enemy: true }], tags: ['zone'] },
  { id: 'star_treatment', name: 'Star Treatment', elem: 'astro', desc: 'The full star treatment for the whole team: +20% elemental power and a shield.', cost: 22, cd: 13, aim: 'self', range: 0, anim: 'flex', fx: 'shield', sfx: 'shimmer',
    eff: [{ t: 'buff', who: 'team', s: 'elm', k: 0.2, dur: 6 }, { t: 'buff', who: 'team', s: 'shield', k: 0.15, dur: 6 }], tags: ['buff', 'shield'] },
  { id: 'four_out_of_five', name: 'Four Out of Five', elem: 'cryo', desc: 'Four crystal-gauntlet strikes in a row — the reviews are in.', cost: 16, cd: 5, aim: 'target', range: 2.8, anim: 'attack2', fx: 'slap', sfx: 'hit_light', scale: 'phys', windup: 0.15,
    eff: [{ t: 'melee', power: 14, reach: 1.8, arc: 110, knock: 1, lunge: 1.6, count: 4, interval: 0.14, aura: 0.6 }], tags: ['melee'] },
  { id: 'brianstorm', kind: 'ultimate', name: 'Brianstorm', elem: 'cryo', desc: 'ULTIMATE: a hailstorm brews over its head — hail hammers down around it in four waves, slowing everything caught.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'roar', fx: 'ult_storm', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'aoe', at: 'self', r: 3.8, power: 26, knock: 1.5, aura: 1.5, count: 4, interval: 0.4, lastMul: 1.8, status: { s: 'slow', dur: 1.5, k: 0.4 } }], tags: ['ult'] },
  { id: 'tranquility_base', kind: 'ultimate', name: 'Tranquility Base', elem: 'astro', desc: 'ULTIMATE: welcome to the lunar hotel — it calls down a fluorescent moon that crashes onto the target and freezes everyone caught.', cost: 0, cd: 0, aim: 'target', range: 10, anim: 'roar', fx: 'meteor', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'timing' },
    eff: [{ t: 'aoe', at: 'target', r: 3.2, power: 90, knock: 6, up: 4, aura: 2, delay: 1.2, destroy: true, crack: true, status: { s: 'frozen', dur: 1.2 } }], tags: ['ult'] },
  { id: 'cornerstone', kind: 'passive', name: 'Cornerstone', elem: 'geo', desc: 'Solid as a cornerstone: takes 12% less damage.', mods: { takenMul: 0.88 } },
  { id: 'still_take_you_home', kind: 'passive', name: 'Still Take You Home', elem: 'cryo', desc: 'Hits on sleeping foes deal +40%, and the sleep it causes lasts longer.', mods: { wakeDmg: 0.4, sleepDur: 0.6 } },
  { id: 'dangerous_animals', kind: 'passive', name: 'Dangerous Animals', elem: 'cryo', desc: '+12% physical damage and +6% crit chance.', mods: { physMul: 1.12, critChance: 0.06 } },
  { id: 'body_paint', kind: 'passive', name: 'Body Paint', elem: 'astro', desc: 'Glowing crystal armour: takes 12% less damage and reflects 10% of close-range damage.', mods: { takenMul: 0.88, reflect: 0.1 } },
]);

export const MOVES = [...SNOOZAQUE];
