// Unique moves, passives and ultimates of the Kissmet line (a KISS homage: a goth Draco chimera
// that splits into four masked legends). Every move is named after a KISS song (passives after
// songs and albums). NOT shared with other lines. Format: src/data/skills.js.
const L = (line, list) => list.map((s) => Object.assign({ line }, s));

// ===================================================================== Kissmet → Kissmera → Demonaconda | Starstrut | Spaceshell | Purrcussion
export const KISSMET = L('kissmet', [
  // ---- Kissmet (the cub)
  { id: 'deuce', name: 'Deuce', elem: 'draco', desc: 'Two quick swipes of its studded paws — one for each of the faces it can\'t decide between.', cost: 8, cd: 1.8, aim: 'target', range: 2.6, anim: 'attack', fx: 'slap', sfx: 'hit_light', scale: 'phys', windup: 0.12, recover: 0.18,
    eff: [{ t: 'melee', power: 13, reach: 1.4, arc: 100, knock: 0.8, lunge: 1.6, count: 2, interval: 0.14, aura: 0.6 }], tags: ['melee'] },
  { id: 'shout_it_out_loud', name: 'Shout It Out Loud', elem: 'draco', desc: 'A cub-sized roar from all four of its heads at once: a cone that cracks guards (−20% defense).', cost: 14, cd: 6, aim: 'dir', range: 5, anim: 'roar', fx: 'screech', sfx: 'beast_roar', windup: 0.2,
    eff: [{ t: 'cone', range: 5, arc: 70, power: 22, knock: 2, aura: 1, status: { s: 'defdown', dur: 3, k: 0.2 } }], tags: ['cone'] },
  { id: 'firehouse', name: 'Firehouse', elem: 'pyro', desc: 'Sound the alarm: its snake tail rears over its head and spits a fireball. May burn.', cost: 12, cd: 3, aim: 'dir', range: 9, anim: 'shoot', fx: 'fireball', sfx: 'pyro',
    eff: [{ t: 'proj', power: 22, speed: 13, r: 0.35, aura: 1, status: { s: 'burn', dur: 3, chance: 0.35, k: 0.25 } }], tags: ['projectile'] },
  { id: 'strutter', name: 'Strutter', elem: 'draco', desc: 'Struts straight through the foes in its platform boots, chin up, tail high.', cost: 12, cd: 5, aim: 'dir', range: 5, anim: 'attack3', fx: 'charge_dash', sfx: 'whoosh', scale: 'phys', windup: 0.1,
    eff: [{ t: 'dash', dist: 5, speed: 15, power: 18, r: 0.9, knock: 2, aura: 1 }], tags: ['dash'] },
  { id: 'nothin_to_lose', name: "Nothin' to Lose", elem: 'draco', desc: 'Nothing left to lose: +35% physical power and +15% speed for 5 s.', cost: 12, cd: 13, aim: 'self', range: 0, anim: 'flex', fx: 'buff_fire', sfx: 'pyro',
    eff: [{ t: 'buff', s: 'dmg', k: 0.35, dur: 5 }, { t: 'buff', s: 'spd', k: 0.15, dur: 5 }], tags: ['buff'] },
  // ---- Kissmera (the full chimera)
  { id: 'detroit_rock_city', name: 'Detroit Rock City', elem: 'draco', desc: 'Gets up and moves its feet: a long, roaring four-legged charge down the arena.', cost: 18, cd: 7, aim: 'dir', range: 7, anim: 'attack3', fx: 'charge_dash', sfx: 'slam', scale: 'phys', windup: 0.3, telegraph: 'line',
    eff: [{ t: 'dash', dist: 7, speed: 17, power: 32, r: 1.1, knock: 4, aura: 1 }], tags: ['dash'] },
  { id: 'creatures_of_the_night', name: 'Creatures of the Night', elem: 'ecto', desc: 'Spreads its wings and the night falls around it: every foe close by is cursed.', cost: 20, cd: 9, aim: 'self', range: 0, anim: 'roar', fx: 'shade', sfx: 'ecto', windup: 0.3, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'self', r: 2.8, power: 26, knock: 2, aura: 1, status: { s: 'curse', dur: 3, k: 0.15 } }], tags: ['aoe'] },
  { id: 'i_love_it_loud', name: 'I Love It Loud', elem: 'draco', desc: 'A lion roar, an eagle scream and a snake hiss in one: a shockwave line that may stun.', cost: 20, cd: 8, aim: 'dir', range: 8, anim: 'roar', fx: 'soundwave', sfx: 'echo_boom', windup: 0.25, telegraph: 'line',
    eff: [{ t: 'line', range: 8, width: 1.6, power: 30, knock: 3, aura: 1, delay: 0.2, status: { s: 'stun', dur: 0.6, chance: 0.3 } }], tags: ['line'] },
  { id: 'psycho_circus', name: 'Psycho Circus', elem: 'ecto', desc: 'Welcome to the show: a carnival of masks spins over the target and confuses everyone in it.', cost: 18, cd: 10, aim: 'point', range: 8, anim: 'cast', fx: 'screech', sfx: 'ecto', windup: 0.3, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'point', r: 2.2, power: 18, knock: 1, aura: 1, delay: 0.4, status: { s: 'confuse', dur: 2 } }], tags: ['aoe'] },
  { id: 'rock_and_roll_all_nite', kind: 'ultimate', name: 'Rock and Roll All Nite', elem: 'draco', desc: 'ULTIMATE: the party every day — four chimera shockwaves to the beat, and the whole team is pumped (+20% power).', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'headbang', fx: 'ult_encore', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'aoe', at: 'self', r: 3.8, power: 26, knock: 2.5, aura: 1.5, count: 4, interval: 0.4, lastMul: 1.8 }, { t: 'buff', who: 'team', s: 'dmg', k: 0.2, dur: 6 }], tags: ['ult'] },
  // ---- Demonaconda (the Demon: serpent, bat wings, fire)
  { id: 'god_of_thunder', name: 'God of Thunder', elem: 'draco', desc: 'Raises its claws to a black sky: three thunderbolts crash down on the target. May stun.', cost: 22, cd: 8, aim: 'point', range: 9, anim: 'roar', fx: 'discharge', sfx: 'volto', windup: 0.3, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'point', r: 1.6, power: 22, knock: 2, aura: 1, delay: 0.5, count: 3, interval: 0.3, scatter: 1, status: { s: 'stun', dur: 0.5, chance: 0.25 } }], tags: ['aoe'] },
  { id: 'lick_it_up', name: 'Lick It Up', elem: 'draco', desc: 'Its endless forked tongue lashes out, wraps a foe and reels it in for a bite.', cost: 16, cd: 7, aim: 'target', range: 6, anim: 'attack2', fx: 'chain', sfx: 'grab', scale: 'phys',
    eff: [{ t: 'pull', who: 'target', k: 4 }, { t: 'melee', power: 22, reach: 7, arc: 30, aura: 1 }], tags: ['grab'] },
  { id: 'war_machine', name: 'War Machine', elem: 'draco', desc: 'Rears up on its coils and slams down like a siege engine, cracking the floor.', cost: 24, cd: 8, aim: 'self', range: 0, anim: 'slam', fx: 'stomp', sfx: 'slam', scale: 'phys', windup: 0.4, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'self', r: 2.8, power: 42, knock: 5, up: 3, aura: 1.2, crack: true, destroy: true }], tags: ['aoe'] },
  { id: 'unholy', name: 'Unholy', elem: 'ecto', desc: 'Spits a gout of black stage-blood in a cone: foes are cursed and hit 20% softer.', cost: 18, cd: 8, aim: 'dir', range: 5, anim: 'roar', fx: 'shade', sfx: 'ecto',
    eff: [{ t: 'cone', range: 5, arc: 60, power: 24, knock: 1.5, aura: 1, status: { s: 'curse', dur: 4, k: 0.2 } }, { t: 'status', who: 'aoe', r: 4, s: 'weaken', dur: 4, k: 0.2 }], tags: ['cone', 'debuff'] },
  { id: 'heavens_on_fire', kind: 'ultimate', name: "Heaven's on Fire", elem: 'pyro', desc: 'ULTIMATE: it rises on its coils, wings wide, and breathes the sky on fire — four burning waves roll out around it.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'roar', fx: 'ult_inferno', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'aoe', at: 'self', r: 4, power: 30, knock: 2.5, up: 2, aura: 1.5, count: 4, interval: 0.35, lastMul: 1.8, status: { s: 'burn', dur: 4, k: 0.35 } }], tags: ['ult'] },
  // ---- Starstrut (the Starchild: the eagle)
  { id: 'love_gun', name: 'Love Gun', elem: 'draco', desc: 'Points a wingtip like a pistol: three star-shots, aimed straight at the heart.', cost: 10, cd: 2.4, aim: 'dir', range: 10, anim: 'shoot', fx: 'star_beam', sfx: 'astro', windup: 0.12,
    eff: [{ t: 'proj', power: 12, speed: 22, r: 0.24, aura: 0.5, count: 3, burst: 0.12 }], tags: ['projectile'] },
  { id: 'i_was_made_for_lovin_you', name: "I Was Made for Lovin' You", elem: 'aero', desc: 'Croons to an ally under a disco glitterball: heals 24% over 3 s.', cost: 18, cd: 10, aim: 'ally', range: 8, anim: 'cast', fx: 'heal', sfx: 'bio_heal',
    eff: [{ t: 'heal', who: 'target', k: 0.24, over: 3 }], tags: ['heal'] },
  { id: 'tears_are_falling', name: 'Tears Are Falling', elem: 'aero', desc: 'A rain of glittering feathers falls over an area; foes in it are slowed.', cost: 20, cd: 9, aim: 'point', range: 8, anim: 'cast', fx: 'rain', sfx: 'aero', windup: 0.25, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'point', r: 2.2, power: 26, knock: 1, aura: 1, delay: 0.6, status: { s: 'slow', dur: 2.5, k: 0.35 } }], tags: ['aoe'] },
  { id: 'sure_know_something', name: 'Sure Know Something', elem: 'draco', desc: 'Its star eye sees everything: every foe in sight is marked (+15% damage taken).', cost: 10, cd: 9, aim: 'self', range: 0, anim: 'cast', fx: 'sonar', sfx: 'astro',
    eff: [{ t: 'mark', r: 10, dur: 6, k: 0.15 }], tags: ['mark'] },
  { id: 'crazy_crazy_nights', kind: 'ultimate', name: 'Crazy Crazy Nights', elem: 'aero', desc: 'ULTIMATE: a storm of star-tipped wing slashes spins round it — and the whole team struts 20% faster.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'spin', fx: 'ult_storm', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'mash', n: 12 },
    eff: [{ t: 'aoe', at: 'self', r: 4, power: 24, knock: 1.5, aura: 1, count: 5, interval: 0.25, lastMul: 2 }, { t: 'buff', who: 'team', s: 'spd', k: 0.2, dur: 6 }], tags: ['ult'] },
  // ---- Spaceshell (the Spaceman: the turtle)
  { id: 'shock_me', name: 'Shock Me', elem: 'volto', desc: 'Touches its guitar to the shell\'s antenna: a zigzag bolt that jumps to a second foe.', cost: 12, cd: 2.8, aim: 'dir', range: 9, anim: 'shoot', fx: 'zap', sfx: 'volto',
    eff: [{ t: 'proj', power: 20, speed: 24, r: 0.25, aura: 1, chain: { n: 1, r: 4, k: 0.6 } }], tags: ['projectile'] },
  { id: 'torpedo_girl', name: 'Torpedo Girl', elem: 'astro', desc: 'Fires a silver torpedo from its shell hatch; it bursts on landing.', cost: 16, cd: 5, aim: 'point', range: 9, anim: 'shoot', fx: 'rock_lob', sfx: 'pyro_boom', windup: 0.2, telegraph: 'circle',
    eff: [{ t: 'proj', power: 28, speed: 11, r: 0.35, aura: 1, arc: true, explode: { r: 1.5, k: 1 } }], tags: ['projectile'] },
  { id: 'cold_gin', name: 'Cold Gin', elem: 'cryo', desc: 'A blast of freezing vapour from its rocket vents: a cone that chills and slows.', cost: 16, cd: 6, aim: 'dir', range: 5, anim: 'roar', fx: 'frost_cone', sfx: 'cryo',
    eff: [{ t: 'cone', range: 5, arc: 70, power: 26, knock: 2, aura: 1, status: { s: 'slow', dur: 2, k: 0.35 } }], tags: ['cone'] },
  { id: 'parasite', name: 'Parasite', elem: 'astro', desc: 'Latches a space-leech riff onto a foe: it bites, poisons, and the turtle heals 10%.', cost: 16, cd: 8, aim: 'target', range: 3, anim: 'attack2', fx: 'bite_volt', sfx: 'hit_light', windup: 0.15,
    eff: [{ t: 'melee', power: 20, reach: 1.6, arc: 90, lunge: 1.6, aura: 1, status: { s: 'poison', dur: 4, k: 0.2 } }, { t: 'heal', k: 0.1 }], tags: ['melee', 'heal'] },
  { id: 'rocket_ride', kind: 'ultimate', name: 'Rocket Ride', elem: 'astro', desc: 'ULTIMATE: its shell lights up like a rocket — it blasts off, then crashes down on the target in a ring of silver fire.', cost: 0, cd: 0, aim: 'point', range: 9, anim: 'slam', fx: 'meteor', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'timing' },
    eff: [{ t: 'dash', leap: true }, { t: 'aoe', r: 3.2, power: 70, knock: 6, up: 4, aura: 2, delay: 0.4, destroy: true, crack: true }], tags: ['ult'] },
  // ---- Purrcussion (the Catman: the lion)
  { id: 'hooligan', name: 'Hooligan', elem: 'draco', desc: 'A lion\'s pounce: it bounds onto a foe and rakes it with both forepaws.', cost: 12, cd: 4, aim: 'target', range: 4, anim: 'attack3', fx: 'slap', sfx: 'hit_heavy', scale: 'phys', windup: 0.15,
    eff: [{ t: 'melee', power: 18, reach: 1.6, arc: 100, knock: 1.5, lunge: 3, count: 2, interval: 0.12, aura: 1 }], tags: ['melee'] },
  { id: 'hundred_thousand_years', name: '100,000 Years', elem: 'echo', desc: 'A drum solo that feels like it lasts a hundred thousand years: four thunderous beats round it. Harder on the beat.', cost: 20, cd: 8, aim: 'self', range: 0, anim: 'headbang', fx: 'drumroll', sfx: 'echo_boom', windup: 0.2, telegraph: 'circle', beat: true,
    eff: [{ t: 'aoe', at: 'self', r: 2.6, power: 14, knock: 1, aura: 0.6, count: 4, interval: 0.3, lastMul: 2 }], tags: ['aoe', 'beat'] },
  { id: 'beth', name: 'Beth', elem: 'echo', desc: 'A soft ballad on the toms for a hurt friend: heals 25% over 4 s and clears ailments.', cost: 20, cd: 11, aim: 'ally', range: 8, anim: 'cast', fx: 'heal', sfx: 'bio_heal',
    eff: [{ t: 'heal', who: 'target', k: 0.25, over: 4 }, { t: 'buff', s: 'cleanse' }], tags: ['heal'] },
  { id: 'hard_luck_woman', name: 'Hard Luck Woman', elem: 'draco', desc: 'Shakes off its bad luck with a mane-shake: +25% physical power and +15% speed for 6 s.', cost: 14, cd: 13, aim: 'self', range: 0, anim: 'flex', fx: 'buff_steel', sfx: 'beast_roar',
    eff: [{ t: 'buff', s: 'dmg', k: 0.25, dur: 6 }, { t: 'buff', s: 'spd', k: 0.15, dur: 6 }], tags: ['buff'] },
  { id: 'king_of_the_night_time_world', kind: 'ultimate', name: 'King of the Night Time World', elem: 'draco', desc: 'ULTIMATE: the lion king of the night pounds the shell-drum and roars — four shockwaves, the last one stuns, and the team is pumped (+20% power).', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'roar', fx: 'ult_fortress', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'aoe', at: 'self', r: 3.8, power: 28, knock: 3, aura: 1.5, count: 4, interval: 0.4, lastMul: 1.8, status: { s: 'stun', dur: 0.4 } }, { t: 'buff', who: 'team', s: 'dmg', k: 0.2, dur: 6 }], tags: ['ult'] },
  // ---- passives
  { id: 'greasepaint', kind: 'passive', name: 'Greasepaint', elem: 'draco', desc: 'Behind the paint nothing rattles it: immune to blind and confusion, +6% crit chance.', mods: { immune: ['blind', 'confuse'], critChance: 0.06 } },
  { id: 'dressed_to_kill', kind: 'passive', name: 'Dressed to Kill', elem: 'draco', desc: 'Studs, leather and platform boots: +8% crit chance and +6% speed.', mods: { critChance: 0.08, spdMul: 1.06 } },
  { id: 'destroyer', kind: 'passive', name: 'Destroyer', elem: 'draco', desc: '+15% physical damage.', mods: { physMul: 1.15 } },
  { id: 'alive', kind: 'passive', name: 'Alive!', elem: 'draco', desc: 'Loudest when it\'s nearly done: below 40% HP it deals 25% more damage.', when: { lowHp: 0.4 }, mods: { dmgMul: 1.25 } },
  { id: 'hotter_than_hell', kind: 'passive', name: 'Hotter Than Hell', elem: 'pyro', desc: 'Breathes fire for fun: immune to burns, and melee attackers get scorched.', mods: { immune: ['burn'], emberSkin: 0.15 } },
  { id: 'calling_dr_love', kind: 'passive', name: 'Calling Dr. Love', elem: 'aero', desc: 'The doctor is in: heals 6% of the damage it deals.', mods: { lifesteal: 0.06 } },
  { id: 'mr_speed', kind: 'passive', name: 'Mr. Speed', elem: 'astro', desc: 'Thrusters on its shell: +12% speed and its dodge recharges 20% faster.', mods: { spdMul: 1.12, dodgeCd: 0.8 } },
  { id: 'black_diamond', kind: 'passive', name: 'Black Diamond', elem: 'draco', desc: 'Hide as hard as a black diamond: takes 12% less damage.', mods: { takenMul: 0.88 } },
]);

export const MOVES = [...KISSMET];
