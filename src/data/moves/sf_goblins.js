// Unique moves, passives and ultimates of the Rainblin line (an original homage to the seven rainbow goblins and
// Takanaka's The Rainbow Goblins album: a colour goblin that lassos rainbows, and the mech seven of them build).
// Names are goblin / rainbow puns (Roy G. Bite, Gobble-de-Hue, Roy G. Blast, Pot o' Gold Rush) and tracks of the
// album (Seven Goblins, Just Before Sunset, Rainbow Valley, Rainbow Paradise). NOT shared with other lines.
// Format: src/data/skills.js.
const L = (line, list) => list.map((s) => Object.assign({ line }, s));

// ===================================================================== Rainblin → Roygbot
export const RAINBLIN = L('rainblin', [
  // ---- Rainblin (the colour goblin)
  { id: 'lasso_the_rainbow', name: 'Lasso the Rainbow', elem: 'ecto', desc: 'Whirls its rope and lassos a foe, yanking it in for a cheap shot.', cost: 12, cd: 5, aim: 'target', range: 7, anim: 'attack2', fx: 'chain', sfx: 'grab', windup: 0.2,
    eff: [{ t: 'pull', who: 'target', k: 4 }, { t: 'melee', power: 14, reach: 7, arc: 30, aura: 1 }], tags: ['grab'] },
  { id: 'gobble_de_hue', name: 'Gobble-de-Hue', elem: 'astro', desc: 'Slurps down a strip of rainbow like a noodle: heals 15% and +25% damage for 5 s.', cost: 14, cd: 11, aim: 'self', range: 0, anim: 'flex', fx: 'heal', sfx: 'bio_heal',
    eff: [{ t: 'heal', k: 0.15 }, { t: 'buff', s: 'dmg', k: 0.25, dur: 5 }], tags: ['heal', 'buff'] },
  { id: 'roy_g_bite', name: 'Roy G. Bite', elem: 'ecto', desc: 'A lunging, tusky bite that tastes of seven colours. May leave the foe confused.', cost: 10, cd: 3, aim: 'target', range: 2.2, anim: 'attack', fx: 'slap', sfx: 'hit_heavy', scale: 'phys', windup: 0.1,
    eff: [{ t: 'melee', power: 18, reach: 1.4, arc: 90, knock: 1, lunge: 1.4, aura: 0.8, status: { s: 'confuse', dur: 1.2, chance: 0.35 } }], tags: ['melee'] },
  { id: 'seven_goblins', name: 'Seven Goblins', elem: 'ecto', desc: 'Whistles for its cousins: a goblin double pops up beside it and copies its hits for 6 s.', cost: 18, cd: 12, aim: 'self', range: 0, anim: 'cast', fx: 'clone', sfx: 'shimmer',
    eff: [{ t: 'summon', kind: 'clone', dur: 6, k: 0.4 }], tags: ['summon'] },
  { id: 'just_before_sunset', name: 'Just Before Sunset', elem: 'astro', desc: 'Drags the sunset across the target: a dusky patch where foes are blinded and nibbled.', cost: 18, cd: 10, aim: 'point', range: 7, anim: 'cast', fx: 'ink', sfx: 'ecto', telegraph: 'circle',
    eff: [{ t: 'zone', kind: 'ink', r: 2.4, dur: 4, tick: { power: 6, aura: 0.5, status: { s: 'blind', dur: 1, k: 0.3 } }, enemy: true }], tags: ['zone'] },
  // ---- Roygbot (the seven-pilot mech)
  { id: 'roy_g_blast', name: 'Roy G. Blast', elem: 'astro', desc: 'The chest crew slam their buttons: a seven-colour beam blasts down a long line.', cost: 20, cd: 7, aim: 'dir', range: 10, anim: 'roar', fx: 'star_beam', sfx: 'astro', telegraph: 'line', windup: 0.35,
    eff: [{ t: 'line', range: 10, width: 1.6, power: 42, knock: 2.5, aura: 1, delay: 0.35 }], tags: ['line'] },
  { id: 'rocket_rainbow_punch', name: 'Rocket Rainbow Punch', elem: 'ferro', desc: 'Fires its rainbow-knuckle fist like a rocket: a heavy punch that bores through every foe in its path.', cost: 14, cd: 5, aim: 'dir', range: 9, anim: 'attack3', fx: 'boulder', sfx: 'destroy_metal', scale: 'phys', windup: 0.2,
    eff: [{ t: 'proj', power: 30, speed: 16, r: 0.5, aura: 1, pierce: true, knock: 3 }], tags: ['projectile'] },
  { id: 'crew_roll_call', name: 'Crew Roll Call', elem: 'ferro', desc: '"Red! Orange! Yellow! Green! Blue! Indigo! Violet!" All pilots report: +20% damage, +15% speed and a shield for 6 s.', cost: 18, cd: 14, aim: 'self', range: 0, anim: 'flex', fx: 'buff_steel', sfx: 'ferro',
    eff: [{ t: 'buff', s: 'dmg', k: 0.2, dur: 6 }, { t: 'buff', s: 'spd', k: 0.15, dur: 6 }, { t: 'buff', s: 'shield', k: 0.15, dur: 6 }], tags: ['buff', 'shield'] },
  { id: 'prism_wall', name: 'Prism Wall', elem: 'astro', desc: 'Projects a wall of hard rainbow light that blocks attacks and movement.', cost: 16, cd: 11, aim: 'point', range: 6, anim: 'cast', fx: 'wall', sfx: 'geo_wall', windup: 0.25,
    eff: [{ t: 'wall', len: 5, hp: 130, dur: 8 }], tags: ['wall'] },
  { id: 'pot_o_gold_rush', name: "Pot o' Gold Rush", elem: 'ferro', desc: 'Stomps down with all seven pilots\' weight: a shockwave that throws every foe close by.', cost: 18, cd: 8, aim: 'self', range: 0, anim: 'stomp', fx: 'stomp', sfx: 'slam', scale: 'phys', windup: 0.25, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'self', r: 3, power: 34, knock: 3, up: 2, aura: 1 }], tags: ['aoe'] },
  // ---- ultimates
  { id: 'rainbow_valley', kind: 'ultimate', name: 'Rainbow Valley', elem: 'astro', desc: 'ULTIMATE: seven goblins ride out of a rainbow valley — seven bands of colour crash down on the target in turn, each to the beat, the last one gold.', cost: 0, cd: 0, aim: 'target', range: 9, anim: 'roar', fx: 'fire_pillar', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'rhythm', beats: 7 },
    eff: [{ t: 'aoe', at: 'target', r: 2.2, power: 20, knock: 1, aura: 1.2, delay: 0.3, count: 7, interval: 0.28, lastMul: 2, status: { s: 'confuse', dur: 1.5, k: 0.2 } }], tags: ['ult'] },
  { id: 'rainbow_paradise', kind: 'ultimate', name: 'Rainbow Paradise', elem: 'astro', desc: 'ULTIMATE: all seven pilots fire at once — the arc behind the mech opens into a rainbow cannon, seven beams sweep the line, then a golden shockwave rolls out.', cost: 0, cd: 0, aim: 'dir', range: 12, anim: 'roar', fx: 'ult_beam', sfx: 'ult_start', telegraph: 'line', qte: { type: 'rhythm', beats: 7 },
    eff: [{ t: 'line', range: 12, width: 2.6, power: 22, knock: 1, aura: 1, delay: 0.4, count: 7, interval: 0.2 }, { t: 'aoe', at: 'self', r: 4, power: 50, knock: 4, up: 2, aura: 2, delay: 2.0 }], tags: ['ult'] },
  // ---- passives
  { id: 'goblin_mode', kind: 'passive', name: 'Goblin Mode', elem: 'ecto', desc: 'Pure mischief: +10% crit chance and +20% crit damage.', mods: { critChance: 0.1, critDmg: 0.2 } },
  { id: 'seven_strong', kind: 'passive', name: 'Seven Strong', elem: 'ferro', desc: 'Seven pilots, one machine: takes 15% less damage and shrugs off knockback and confusion.', mods: { takenMul: 0.85, knockImmune: true, immune: ['confuse'] } },
]);

export const MOVES = [...RAINBLIN];
