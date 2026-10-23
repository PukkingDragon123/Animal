// Unique moves, passives and ultimates of the Metalfang line (an MF DOOM homage: a masked Draco wyvern
// that becomes the Doom). Every move is named after a DOOM song (Operation: Doomsday, Mm..Food,
// Madvillainy, Take Me to Your Leader, Born Like This); passives after songs and albums. NOT shared
// with other lines. Format: src/data/skills.js.
const L = (line, list) => list.map((s) => Object.assign({ line }, s));

// ===================================================================== Metalfang → Wyvillain → Doomsdrake
export const METALFANG = L('metalfang', [
  // ---- Metalfang (the masked hatchling with the bottle)
  { id: 'one_beer', name: 'One Beer', elem: 'draco', desc: 'One swig from its unlabelled brown bottle, then a fiery burp: a short cone of villain-green flame. May burn.', cost: 10, cd: 3, aim: 'dir', range: 4, anim: 'roar', fx: 'fire_cone', sfx: 'pyro', windup: 0.2,
    eff: [{ t: 'cone', range: 4, arc: 60, power: 20, knock: 1, aura: 1, status: { s: 'burn', dur: 3, chance: 0.3, k: 0.2 } }], tags: ['cone'] },
  { id: 'rhymes_like_dimes', name: 'Rhymes Like Dimes', elem: 'draco', desc: 'Spits bars so sharp they clink: five silver dimes fan out across the floor.', cost: 10, cd: 2.6, aim: 'dir', range: 9, anim: 'shoot', fx: 'studs', sfx: 'shimmer', windup: 0.12,
    eff: [{ t: 'proj', power: 8, speed: 18, r: 0.2, aura: 0.5, count: 5, spread: 40 }], tags: ['projectile'] },
  { id: 'the_mic', name: 'The Mic', elem: 'echo', desc: 'Swings the microphone like a mace — one for the verse, one for the hook. Harder on the beat.', cost: 12, cd: 3, aim: 'target', range: 2.6, anim: 'attack2', fx: 'slap', sfx: 'hit_heavy', scale: 'phys', windup: 0.12, beat: true,
    eff: [{ t: 'melee', power: 14, reach: 1.5, arc: 100, knock: 1, lunge: 1.6, count: 2, interval: 0.16, aura: 0.6 }], tags: ['melee', 'beat'] },
  { id: 'kon_karne', name: 'Kon Karne', elem: 'pyro', desc: 'Tips a pot of chilli con carne over the floor: a bubbling, burning puddle.', cost: 18, cd: 10, aim: 'point', range: 7, anim: 'cast', fx: 'sizzle', sfx: 'sizzle', telegraph: 'circle',
    eff: [{ t: 'zone', kind: 'fire', r: 2.2, dur: 4, tick: { power: 6, aura: 0.5 }, enemy: true }], tags: ['zone'] },
  { id: 'potholderz', name: 'Potholderz', elem: 'ferro', desc: 'Oven-mitt claws up: blocks 70% of frontal damage, then counters with a hot slap.', cost: 12, cd: 7, aim: 'self', range: 0, anim: 'parry', fx: 'guard', sfx: 'parry', windup: 0.05,
    eff: [{ t: 'buff', s: 'guard', k: 0.7, dur: 1.6, counter: 24 }], tags: ['guard'] },
  // ---- Wyvillain (the hooded cloak)
  { id: 'rap_ambush', name: 'Rap Ambush', elem: 'ecto', desc: 'Vanishes into its hood and reappears through the foes with a jab.', cost: 14, cd: 6, aim: 'dir', range: 6, anim: 'attack3', fx: 'shade', sfx: 'whoosh', scale: 'phys', windup: 0.08,
    eff: [{ t: 'dash', dist: 6, speed: 20, power: 22, r: 0.9, knock: 2, aura: 1, iframe: true }], tags: ['dash'] },
  { id: 'accordion', name: 'Accordion', elem: 'echo', desc: 'Squeezes a wheezing accordion loop out of its lungs: a wobbly sound cone that slows. Harder on the beat.', cost: 14, cd: 5, aim: 'dir', range: 5, anim: 'roar', fx: 'soundwave', sfx: 'echo', windup: 0.2, beat: true,
    eff: [{ t: 'cone', range: 5, arc: 70, power: 24, knock: 1.5, aura: 1, status: { s: 'slow', dur: 2, k: 0.3 } }], tags: ['cone', 'beat'] },
  { id: 'gas_drawls', name: 'Gas Drawls', elem: 'bio', desc: 'Exhales a slow green fog through the mask: foes inside are poisoned.', cost: 18, cd: 10, aim: 'point', range: 7, anim: 'cast', fx: 'spores', sfx: 'bio_poison', telegraph: 'circle',
    eff: [{ t: 'zone', kind: 'spore', r: 2.4, dur: 4.5, tick: { power: 5, aura: 0.5, status: { s: 'poison', dur: 3, stacks: 1, k: 0.1 } }, enemy: true }], tags: ['zone'] },
  { id: 'curls', name: 'Curls', elem: 'draco', desc: 'Flicks a curling ribbon of villain fire that slices through foes and curls back.', cost: 14, cd: 4, aim: 'dir', range: 9, anim: 'attack2', fx: 'saw', sfx: 'pyro',
    eff: [{ t: 'proj', power: 20, speed: 14, r: 0.4, aura: 1, pierce: true, boomerang: true }], tags: ['projectile'] },
  { id: 'fancy_clown', name: 'Fancy Clown', elem: 'ecto', desc: 'A flourish of the cloak and a mocking bow: every foe close by is confused.', cost: 18, cd: 10, aim: 'self', range: 0, anim: 'roar', fx: 'screech', sfx: 'ecto', windup: 0.25, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'self', r: 2.6, power: 18, knock: 2, aura: 1, status: { s: 'confuse', dur: 1.8 } }], tags: ['aoe'] },
  // ---- Doomsdrake (the Doom)
  { id: 'fazers', name: 'Fazers', elem: 'draco', desc: 'Its eye slits flare and two fazer beams sweep out in a line.', cost: 20, cd: 7, aim: 'dir', range: 9, anim: 'roar', fx: 'star_beam', sfx: 'astro', windup: 0.3, telegraph: 'line',
    eff: [{ t: 'line', range: 9, width: 1.2, power: 36, knock: 2, aura: 1, delay: 0.2, count: 2, interval: 0.25 }], tags: ['line'] },
  { id: 'meat_grinder', name: 'Meat Grinder', elem: 'ferro', desc: 'Spins in its iron and cloak like a grinder: everything close is chewed up and thrown.', cost: 20, cd: 7, aim: 'self', range: 0, anim: 'spin', fx: 'fire_spin', sfx: 'destroy_metal', scale: 'phys', windup: 0.2,
    eff: [{ t: 'aoe', at: 'self', r: 2.4, power: 16, knock: 1, aura: 0.6, count: 3, interval: 0.2, lastMul: 1.6 }], tags: ['aoe'] },
  { id: 'anti_matter', name: 'Anti-Matter', elem: 'astro', desc: 'Opens a fist of anti-matter over the target: foes are dragged in, then it collapses.', cost: 25, cd: 11, aim: 'point', range: 9, anim: 'cast', fx: 'gravity', sfx: 'astro', telegraph: 'circle',
    eff: [{ t: 'zone', at: 'point', r: 2.6, dur: 2, kind: 'gravity', pull: 3.5, tick: { power: 6, aura: 0.5 }, enemy: true }, { t: 'aoe', at: 'point', r: 2.2, power: 40, knock: 4, up: 2, aura: 1, delay: 2.0 }], tags: ['zone', 'aoe'] },
  { id: 'all_caps', name: 'ALL CAPS', elem: 'draco', desc: 'REMEMBER ALL CAPS: +35% elemental and +20% physical power for 6 s.', cost: 16, cd: 14, aim: 'self', range: 0, anim: 'roar', fx: 'buff_fire', sfx: 'echo_boom',
    eff: [{ t: 'buff', s: 'elm', k: 0.35, dur: 6 }, { t: 'buff', s: 'dmg', k: 0.2, dur: 6 }], tags: ['buff'] },
  { id: 'red_and_gold', name: 'Red and Gold', elem: 'ferro', desc: 'Throws its cloak around itself: a gold shield and +20% defense, then a red counter-burn for 6 s.', cost: 18, cd: 13, aim: 'self', range: 0, anim: 'flex', fx: 'buff_steel', sfx: 'ferro',
    eff: [{ t: 'buff', s: 'shield', k: 0.25, dur: 6 }, { t: 'buff', s: 'def', k: 0.2, dur: 6 }, { t: 'buff', s: 'kindle', k: 0.3, n: 3, dur: 6 }], tags: ['buff', 'shield'] },
  // ---- ultimates
  { id: 'madvillainy', kind: 'ultimate', name: 'Madvillainy', elem: 'draco', desc: 'ULTIMATE: the villain drops a whole album at once — five verses of rhyme-dimes and green fire, each to the beat, the last one ALL CAPS.', cost: 0, cd: 0, aim: 'target', range: 9, anim: 'roar', fx: 'fire_pillar', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'rhythm', beats: 5 },
    eff: [{ t: 'aoe', at: 'target', r: 2.2, power: 24, knock: 1.5, aura: 1.5, delay: 0.3, count: 5, interval: 0.35, lastMul: 2, status: { s: 'burn', dur: 3, k: 0.25 } }], tags: ['ult'] },
  { id: 'operation_doomsday', kind: 'ultimate', name: 'Operation: Doomsday', elem: 'draco', desc: 'ULTIMATE: the Doom raises an iron fist and calls the sky down — six green-fire meteors crash around the target, and every foe is cursed.', cost: 0, cd: 0, aim: 'target', range: 10, anim: 'roar', fx: 'meteor', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'timing', n: 6 },
    eff: [{ t: 'proj', count: 6, burst: 0.22, power: 34, speed: 14, r: 0.5, aura: 1.5, arc: true, explode: { r: 1.8, k: 1 }, knock: 3 }, { t: 'status', who: 'aoe', r: 5, s: 'curse', dur: 4, k: 0.2 }], tags: ['ult'] },
  // ---- passives
  { id: 'mm_food', kind: 'passive', name: 'Mm..Food', elem: 'draco', desc: 'Lives on snacks and soda: heals 25% more, and slowly regenerates 0.5% HP per second.', mods: { healMul: 1.25, regen: 0.005 } },
  { id: 'illest_villains', kind: 'passive', name: 'The Illest Villains', elem: 'ecto', desc: 'Plays the bad guy: +10% crit chance and +25% crit damage.', mods: { critChance: 0.1, critDmg: 0.25 } },
  { id: 'supervillain', kind: 'passive', name: 'Supervillain', elem: 'ferro', desc: 'Iron mask, iron will: takes 12% less damage and shrugs off blind and confuse.', mods: { takenMul: 0.88, immune: ['blind', 'confuse'] } },
]);

export const MOVES = [...METALFANG];
