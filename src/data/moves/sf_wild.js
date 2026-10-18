// Unique moves of the San Francisco single-stage Tokonmon and legendaries
// (docs/ROSTER.md). Format: src/data/skills.js. `line` = the species id.
const L = (line, list) => list.map((s) => Object.assign({ line }, s));

// ===================================================================== Barkorious (The Notorious B.I.G.)
export const BARKORIOUS = L('barkorious', [
  { id: 'big_poppa', name: 'Big Poppa', elem: 'hydro', desc: 'A heavy belly-flop body slam. The whole pier shakes.', cost: 18, cd: 6, aim: 'point', range: 6, anim: 'slam', fx: 'slam', sfx: 'slam', scale: 'phys', windup: 0.35, telegraph: 'circle',
    eff: [{ t: 'dash', leap: true }, { t: 'aoe', r: 2.2, power: 34, knock: 4, up: 2, aura: 1.2, delay: 0.3, crack: true }], tags: ['dash', 'aoe'] },
  { id: 'hypnotize', name: 'Hypnotize', elem: 'echo', desc: 'A smooth, slow flow that hypnotizes the foes in front of it.', cost: 15, cd: 7, aim: 'dir', range: 5, anim: 'headbang', fx: 'soundwave', sfx: 'echo', beat: true,
    eff: [{ t: 'cone', range: 5, arc: 70, power: 18, knock: 1, aura: 1, status: { s: 'confuse', dur: 2 } }], tags: ['cone', 'beat'] },
  { id: 'juicy', name: 'Juicy', elem: 'hydro', desc: 'It was all a dream: cleanses ailments and heals 24% over 4 s.', cost: 18, cd: 12, aim: 'self', range: 0, anim: 'cast', fx: 'heal', sfx: 'hydro',
    eff: [{ t: 'buff', s: 'cleanse' }, { t: 'heal', k: 0.24, over: 4 }], tags: ['heal'] },
  { id: 'kick_in_the_door', name: 'Kick in the Door', elem: 'hydro', desc: 'Charges in flippers-first like it\'s kicking in the door.', cost: 20, cd: 7, aim: 'dir', range: 7, anim: 'attack3', fx: 'water_dash', sfx: 'slam', scale: 'phys', windup: 0.35, telegraph: 'line',
    eff: [{ t: 'dash', dist: 7, speed: 15, power: 36, r: 1.2, knock: 6, aura: 1 }], tags: ['dash'] },
  { id: 'mo_money', name: 'Mo Money Mo Problems', elem: 'ferro', desc: 'Whips its gold chain around a foe and yanks it in; its defense drops.', cost: 16, cd: 8, aim: 'target', range: 6, anim: 'attack2', fx: 'chain', sfx: 'ferro',
    eff: [{ t: 'pull', who: 'target', k: 4 }, { t: 'melee', power: 18, reach: 7, arc: 30, aura: 1, status: { s: 'defdown', dur: 3, k: 0.2 } }], tags: ['grab'] },
  { id: 'sky_is_the_limit', name: "Sky's the Limit", elem: 'echo', desc: 'Hypes up the whole team: +20% power for 8 s.', cost: 18, cd: 15, aim: 'self', range: 0, anim: 'roar', fx: 'buff_echo', sfx: 'crowd_cheer',
    eff: [{ t: 'buff', who: 'team', s: 'dmg', k: 0.2, dur: 8 }, { t: 'buff', who: 'team', s: 'elm', k: 0.2, dur: 8 }], tags: ['buff'] },
  { id: 'notorious', kind: 'ultimate', name: 'Notorious', elem: 'echo', desc: 'ULTIMATE: the king of the pier takes the mic — a shockwave on every bar, the last one a tidal belly-flop.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'headbang', fx: 'ult_encore', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'aoe', at: 'self', r: 4.2, power: 32, knock: 3, aura: 1.5, count: 4, interval: 0.45, lastMul: 2 }], tags: ['ult'] },
  { id: 'king_of_the_pier', kind: 'passive', name: 'King of the Pier', elem: 'hydro', desc: 'Above 70% HP: +20% defense and +10% damage.', when: { highHp: 0.7 }, mods: { defMul: 1.2, dmgMul: 1.1 } },
]);

// ===================================================================== Sandmander (Metallica, "Enter Sandman")
export const SANDMANDER = L('sandmander', [
  { id: 'enter_sandman', name: 'Enter Sandman', elem: 'geo', desc: 'Pours a cloud of sleep-sand: foes inside are blinded and grow drowsy — off to never-never land.', cost: 20, cd: 10, aim: 'point', range: 8, anim: 'cast', fx: 'quicksand', sfx: 'sleep', windup: 0.3, telegraph: 'circle',
    eff: [{ t: 'zone', kind: 'sand', r: 2.3, dur: 4, tick: { status: { s: 'drowsy', dur: 0.5 } }, enemy: true }], tags: ['zone', 'sleep'] },
  { id: 'exit_light', name: 'Exit Light', elem: 'ecto', desc: 'Its hourglass tail flashes — exit light — and the foes in front of it go dark.', cost: 12, cd: 6, aim: 'dir', range: 5, anim: 'roar', fx: 'glare', sfx: 'ecto',
    eff: [{ t: 'cone', range: 5, arc: 60, power: 18, aura: 1, status: { s: 'blind', dur: 2 } }], tags: ['cone'] },
  { id: 'sad_but_true', name: 'Sad but True', elem: 'geo', desc: 'A slow, crushing tail slam. Sad, but true: it weakens the foe.', cost: 18, cd: 6, aim: 'target', range: 3, anim: 'slam', fx: 'slam', sfx: 'slam', scale: 'phys', windup: 0.4, telegraph: 'cone',
    eff: [{ t: 'melee', power: 34, reach: 1.8, arc: 100, knock: 3, lunge: 1.4, aura: 1, status: { s: 'weaken', dur: 4, k: 0.2 } }], tags: ['melee'] },
  { id: 'dont_tread_on_me', name: "Don't Tread on Me", elem: 'geo', desc: 'Coils like the snake on its back: blocks 75% of frontal damage and strikes back.', cost: 12, cd: 6, aim: 'self', range: 0, anim: 'parry', fx: 'guard', sfx: 'parry', windup: 0.05,
    eff: [{ t: 'buff', s: 'guard', k: 0.75, dur: 1.6, counter: 32 }], tags: ['guard'] },
  { id: 'wherever_i_may_roam', name: 'Wherever I May Roam', elem: 'geo', desc: 'Surfs off across the sand, leaving a blinding dust trail.', cost: 12, cd: 6, aim: 'dir', range: 6, anim: 'dodge', fx: 'boulder', sfx: 'whoosh', windup: 0.05,
    eff: [{ t: 'dash', dist: 6, speed: 18, power: 14, r: 0.9, knock: 1.5, aura: 1, iframe: true, trail: 'sand' }], tags: ['dash'] },
  { id: 'the_unforgiven', name: 'The Unforgiven', elem: 'ecto', desc: 'A dark grain of sand that never forgives: a homing shot that curses.', cost: 14, cd: 5, aim: 'dir', range: 9, anim: 'shoot', fx: 'shade', sfx: 'ecto',
    eff: [{ t: 'proj', power: 20, speed: 13, r: 0.35, aura: 1, homing: 2, status: { s: 'curse', dur: 5, k: 0.2 } }], tags: ['projectile'] },
  { id: 'enter_night', kind: 'ultimate', name: 'Exit Light, Enter Night', elem: 'ecto', desc: 'ULTIMATE: night falls — a sandstorm lulls every foe to sleep, then the snake strikes (sleepers take extra damage).', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'roar', fx: 'ult_storm', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'timing', n: 2 },
    eff: [{ t: 'zone', at: 'self', kind: 'sand', r: 5, dur: 3, tick: { status: { s: 'drowsy', dur: 1.2 } }, enemy: true }, { t: 'aoe', at: 'self', r: 5, power: 70, knock: 4, aura: 2, delay: 2.4 }], tags: ['ult'] },
  { id: 'hourglass_tail', kind: 'passive', name: 'Hourglass Tail', elem: 'geo', desc: 'Sleep it causes lasts 1 s longer; the hit that wakes a foe deals +30%.', mods: { sleepDur: 1, wakeDmg: 0.3 } },
  { id: 'nightcap', kind: 'passive', name: 'Nightcap', elem: 'ecto', desc: 'Already wearing a nightcap: immune to sleep and drowsiness.', mods: { immune: ['sleep', 'drowsy'] } },
]);

// ===================================================================== Justatue (Metallica, "...And Justice for All")
export const JUSTATUE = L('justatue', [
  { id: 'and_justice_for_all', name: '…And Justice for All', elem: 'geo', desc: 'The scales tip and slam down: justice for all — every foe around is hit and weakened.', cost: 20, cd: 8, aim: 'self', range: 0, anim: 'slam', fx: 'stomp', sfx: 'slam', scale: 'phys', windup: 0.4, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'self', r: 2.6, power: 30, knock: 3, aura: 1, crack: true }, { t: 'status', who: 'aoe', r: 2.8, s: 'weaken', dur: 4, k: 0.2 }], tags: ['aoe'] },
  { id: 'blackened', name: 'Blackened', elem: 'ecto', desc: 'Breathes out a cone of blackened ash that curses; foes close by are blinded.', cost: 16, cd: 7, aim: 'dir', range: 5, anim: 'roar', fx: 'ink', sfx: 'ecto',
    eff: [{ t: 'cone', range: 5, arc: 70, power: 24, aura: 1, status: { s: 'curse', dur: 4, k: 0.15 } }, { t: 'status', who: 'aoe', r: 3, s: 'blind', dur: 1.5 }], tags: ['cone'] },
  { id: 'eye_of_the_beholder', name: 'Eye of the Beholder', elem: 'ecto', desc: 'The blindfold slips: every foe it can see is marked (+20% damage taken).', cost: 10, cd: 9, aim: 'self', range: 0, anim: 'cast', fx: 'sonar', sfx: 'ecto',
    eff: [{ t: 'mark', r: 10, dur: 6, k: 0.2 }], tags: ['mark'] },
  { id: 'shortest_straw', name: 'The Shortest Straw', elem: 'ferro', desc: 'Lashes out with its frayed rope: drags a foe in and binds it.', cost: 18, cd: 8, aim: 'target', range: 7, anim: 'attack2', fx: 'chain', sfx: 'grab',
    eff: [{ t: 'pull', who: 'target', k: 4 }, { t: 'status', who: 'target', s: 'root', dur: 1.4 }, { t: 'melee', power: 16, reach: 8, arc: 30, aura: 1 }], tags: ['grab'] },
  { id: 'harvester_of_sorrow', name: 'Harvester of Sorrow', elem: 'ferro', desc: 'Swings its great scales like a scythe in a wide, heavy arc.', cost: 22, cd: 7, aim: 'target', range: 3.2, anim: 'attack3', fx: 'saw', sfx: 'destroy_metal', scale: 'phys', windup: 0.45, telegraph: 'cone',
    eff: [{ t: 'melee', power: 40, reach: 2.2, arc: 150, knock: 4, lunge: 1.2, aura: 1 }], tags: ['melee'] },
  { id: 'final_verdict', kind: 'ultimate', name: 'Final Verdict', elem: 'geo', desc: 'ULTIMATE: ropes bind every foe in place, then the giant scales come crashing down.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'slam', fx: 'ult_fortress', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'mash', n: 14 },
    eff: [{ t: 'status', who: 'aoe', r: 6, s: 'root', dur: 2 }, { t: 'aoe', at: 'self', r: 4.2, power: 82, knock: 5, up: 3, aura: 2, delay: 1.2, status: { s: 'stun', dur: 1 }, crack: true, destroy: true }], tags: ['ult'] },
  { id: 'blind_justice', kind: 'passive', name: 'Blind Justice', elem: 'geo', desc: 'Justice is blind: immune to blind and confusion.', mods: { immune: ['blind', 'confuse'] } },
  { id: 'cracked_marble', kind: 'passive', name: 'Cracked Marble', elem: 'geo', desc: 'Below 30% HP: +35% defense and reflects 15% of melee damage.', when: { lowHp: 0.3 }, mods: { defMul: 1.35, reflect: 0.15 } },
]);

// ===================================================================== Weirdfin (Radiohead, "Weird Fishes/Arpeggi")
export const WEIRDFIN = L('weirdfin', [
  { id: 'arpeggi', name: 'Arpeggi', elem: 'echo', desc: 'Five rising arpeggio bolts in rainbow colours; they curve toward the foe.', cost: 12, cd: 3, aim: 'dir', range: 10, anim: 'shoot', fx: 'water_bolt', sfx: 'echo', windup: 0.15, beat: true,
    eff: [{ t: 'proj', count: 5, burst: 0.1, power: 9, speed: 18, r: 0.25, aura: 0.5, homing: 1.5 }], tags: ['projectile', 'beat'] },
  { id: 'glowing_lure', name: 'Glowing Lure', elem: 'hydro', desc: 'Dangles its glowing lure: foes nearby drift toward it, entranced.', cost: 15, cd: 9, aim: 'self', range: 0, anim: 'cast', fx: 'sonar', sfx: 'hydro',
    eff: [{ t: 'pull', range: 5, k: 2.5 }, { t: 'status', who: 'aoe', r: 3, s: 'confuse', dur: 1.4 }], tags: ['debuff'] },
  { id: 'weird_fishes', name: 'Weird Fishes', elem: 'hydro', desc: 'Releases a school of eerie ghost fish that hunt down foes.', cost: 18, cd: 6, aim: 'dir', range: 10, anim: 'cast', fx: 'shade', sfx: 'hydro', windup: 0.2,
    eff: [{ t: 'proj', count: 3, spread: 40, power: 16, speed: 12, r: 0.3, aura: 1, homing: 3 }], tags: ['projectile'] },
  { id: 'reckoner', name: 'Reckoner', elem: 'hydro', desc: 'A slow, shimmering wave that reckons with everything in its way.', cost: 22, cd: 8, aim: 'dir', range: 9, anim: 'cast', fx: 'ult_wave', sfx: 'hydro_splash', windup: 0.35, telegraph: 'line',
    eff: [{ t: 'line', range: 9, width: 2.4, power: 36, knock: 3, aura: 1.5, delay: 0.35 }], tags: ['line'] },
  { id: 'house_of_cards', name: 'House of Cards', elem: 'hydro', desc: 'Squirts a cloud of deep-sea ink: foes inside are blinded.', cost: 18, cd: 11, aim: 'point', range: 7, anim: 'shoot', fx: 'ink', sfx: 'hydro_splash',
    eff: [{ t: 'zone', kind: 'ink', r: 2.4, dur: 4.5, tick: { status: { s: 'blind', dur: 0.6 } }, enemy: true }], tags: ['zone'] },
  { id: 'in_rainbows', kind: 'ultimate', name: 'In Rainbows', elem: 'echo', desc: 'ULTIMATE: rainbow arpeggio bands ripple out on every beat; the last one floods the arena.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'cast', fx: 'ult_encore', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'aoe', at: 'self', r: 4.4, power: 30, knock: 2, aura: 1.5, count: 4, interval: 0.4, lastMul: 2, status: { s: 'confuse', dur: 1 } }], tags: ['ult'] },
  { id: 'abyssal_glow', kind: 'passive', name: 'Abyssal Glow', elem: 'hydro', desc: 'Crits deal +35% more; wider beat window.', mods: { critDmg: 0.35, beatWindow: 0.14 } },
]);

// ===================================================================== Rollick (The Rolling Stones)
export const ROLLICK = L('rollick', [
  { id: 'tongue_lash', name: 'Tongue Lash', elem: 'geo', desc: 'The huge tongue lashes out, licks a foe and drags it in.', cost: 15, cd: 7, aim: 'target', range: 7, anim: 'attack2', fx: 'vine', sfx: 'grab',
    eff: [{ t: 'pull', who: 'target', k: 4 }, { t: 'melee', power: 16, reach: 8, arc: 30, aura: 1, status: { s: 'slow', dur: 2, k: 0.3 } }], tags: ['grab'] },
  { id: 'jumpin_jack_flash', name: "Jumpin' Jack Flash", elem: 'geo', desc: 'It\'s a gas: a flash that dazzles foes nearby, then a rolling charge.', cost: 16, cd: 6, aim: 'dir', range: 7, anim: 'spin', fx: 'boulder', sfx: 'geo', scale: 'phys', windup: 0.1,
    eff: [{ t: 'status', who: 'aoe', r: 2, s: 'blind', dur: 1.2 }, { t: 'dash', dist: 7, speed: 15, power: 28, r: 1.0, knock: 4, aura: 1 }], tags: ['dash'] },
  { id: 'gimme_shelter', name: 'Gimme Shelter', elem: 'geo', desc: 'A storm is threatening: every ally on the field takes shelter behind a stone shield.', cost: 20, cd: 13, aim: 'self', range: 0, anim: 'flex', fx: 'shield', sfx: 'geo_wall',
    eff: [{ t: 'buff', who: 'team', s: 'shield', k: 0.22, dur: 7 }], tags: ['buff', 'shield'] },
  { id: 'satisfaction', name: 'Satisfaction', elem: 'geo', desc: 'It can\'t get no satisfaction… so it keeps trying: heals 15% and +20% physical power for 6 s.', cost: 18, cd: 14, aim: 'self', range: 0, anim: 'flex', fx: 'buff_steel', sfx: 'geo',
    eff: [{ t: 'heal', k: 0.15 }, { t: 'buff', s: 'dmg', k: 0.2, dur: 6 }], tags: ['heal', 'buff'] },
  { id: 'get_off_my_cloud', name: 'Get Off of My Cloud', elem: 'echo', desc: 'HEY! YOU! A shouted blast that blows foes far away.', cost: 16, cd: 7, aim: 'dir', range: 4.5, anim: 'roar', fx: 'soundwave', sfx: 'echo_boom',
    eff: [{ t: 'cone', range: 4.5, arc: 90, power: 22, knock: 7, aura: 1 }], tags: ['cone'] },
  { id: 'start_me_up', name: 'Start Me Up', elem: 'echo', desc: 'If you start it up it\'ll never stop: +30% speed for 6 s and +30 energy.', cost: 0, cd: 16, aim: 'self', range: 0, anim: 'headbang', fx: 'buff_echo', sfx: 'echo',
    eff: [{ t: 'buff', s: 'spd', k: 0.3, dur: 6 }, { t: 'buff', s: 'energy', k: 30 }], tags: ['buff'] },
  { id: 'a_bigger_bang', kind: 'ultimate', name: 'A Bigger Bang', elem: 'geo', desc: 'ULTIMATE: rolls itself into a giant boulder, leaps and crashes down with a stadium-sized bang.', cost: 0, cd: 0, aim: 'point', range: 8, anim: 'spin', fx: 'ult_fortress', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'mash', n: 14 },
    eff: [{ t: 'dash', leap: true }, { t: 'aoe', r: 3.4, power: 84, knock: 7, up: 5, aura: 2, delay: 0.35, crack: true, destroy: true }], tags: ['ult'] },
  { id: 'never_stop_rolling', kind: 'passive', name: 'Never Stop Rolling', elem: 'geo', desc: '+10% speed and immune to knockback.', mods: { spdMul: 1.1, knockImmune: true } },
]);

// ===================================================================== Neverdecker (The Smiths)
export const NEVERDECKER = L('neverdecker', [
  { id: 'there_is_a_light', name: 'There Is a Light', elem: 'volto', desc: 'Its windows never go dark: a beam of warm window-light down a line that dazzles foes.', cost: 18, cd: 6, aim: 'dir', range: 10, anim: 'roar', fx: 'star_beam', sfx: 'volto', windup: 0.3, telegraph: 'line',
    eff: [{ t: 'line', range: 10, width: 1.3, power: 34, knock: 2, aura: 1, delay: 0.2, status: { s: 'blind', dur: 1.2 } }], tags: ['line'] },
  { id: 'bigmouth_strikes_again', name: 'Bigmouth Strikes Again', elem: 'hydro', desc: 'Opens its enormous bus-whale mouth and chomps everything in front of it.', cost: 16, cd: 5, aim: 'target', range: 3.2, anim: 'attack', fx: 'bash', sfx: 'hit_heavy', scale: 'phys', windup: 0.3, telegraph: 'cone',
    eff: [{ t: 'melee', power: 30, reach: 2.2, arc: 120, knock: 3, lunge: 1, aura: 1 }], tags: ['melee'] },
  { id: 'gladioli_spray', name: 'Gladioli Spray', elem: 'hydro', desc: 'Its blowhole sprays water and gladioli: allies around it heal, foes are soaked.', cost: 20, cd: 11, aim: 'self', range: 0, anim: 'cast', fx: 'rain', sfx: 'hydro_splash',
    eff: [{ t: 'zone', at: 'self', kind: 'rain', r: 2.8, dur: 5, tick: { heal: 0.03, power: 5, aura: 1 } }], tags: ['zone', 'heal'] },
  { id: 'how_soon_is_now', name: 'How Soon Is Now?', elem: 'echo', desc: 'A wobbling tremolo wave that pierces every foe in line.', cost: 12, cd: 3, aim: 'dir', range: 9, anim: 'roar', fx: 'soundwave', sfx: 'echo', beat: true,
    eff: [{ t: 'proj', power: 20, speed: 11, r: 0.6, aura: 1, pierce: true, knock: 2, wave: true }], tags: ['projectile', 'beat'] },
  { id: 'this_charming_man', name: 'This Charming Man', elem: 'echo', desc: 'Flashes its headlights in a charming wink: the foe is confused for 2.5 s.', cost: 15, cd: 9, aim: 'target', range: 7, anim: 'cast', fx: 'glare', sfx: 'echo',
    eff: [{ t: 'status', who: 'target', s: 'confuse', dur: 2.5 }], tags: ['debuff'] },
  { id: 'heaven_knows', name: "Heaven Knows I'm Miserable Now", elem: 'hydro', desc: 'A gloomy fog horn: every foe nearby loses heart (−25% damage).', cost: 15, cd: 11, aim: 'self', range: 0, anim: 'roar', fx: 'steam', sfx: 'hydro',
    eff: [{ t: 'status', who: 'aoe', r: 5, s: 'weaken', dur: 5, k: 0.25 }], tags: ['debuff'] },
  { id: 'light_never_goes_out', kind: 'ultimate', name: 'There Is a Light That Never Goes Out', elem: 'volto', desc: 'ULTIMATE: every window blazes at once — the team heals 25%, and a sweeping beam of light crosses the arena.', cost: 0, cd: 0, aim: 'dir', range: 13, anim: 'roar', fx: 'ult_beam', sfx: 'ult_start', telegraph: 'line', qte: { type: 'timing', n: 1 },
    eff: [{ t: 'heal', who: 'team', k: 0.25 }, { t: 'line', range: 13, width: 3, power: 72, knock: 5, aura: 2, delay: 0.5 }], tags: ['ult'] },
  { id: 'never_goes_out', kind: 'passive', name: 'Never Goes Out', elem: 'volto', desc: 'Below 40% HP the light still burns: takes 20% less damage, +15% elemental damage.', when: { lowHp: 0.4 }, mods: { takenMul: 0.8, elmMul: 1.15 } },
]);

// ===================================================================== Johnlemon (The Beatles: John)
export const JOHNLEMON = L('johnlemon', [
  { id: 'imagine_peace', name: 'Imagine', elem: 'echo', desc: 'Imagine all the people… the team heals 18% over 4 s and every foe nearby loses the will to fight (−30% damage).', cost: 25, cd: 13, aim: 'self', range: 0, anim: 'cast', fx: 'peace', sfx: 'bio_heal', windup: 0.3,
    eff: [{ t: 'heal', who: 'team', k: 0.18, over: 4 }, { t: 'status', who: 'aoe', r: 6, s: 'weaken', dur: 5, k: 0.3 }], tags: ['heal'] },
  { id: 'instant_karma', name: 'Instant Karma!', elem: 'volto', desc: 'Instant karma\'s gonna get you: a zesty bolt that always finds its mark.', cost: 10, cd: 2.6, aim: 'dir', range: 10, anim: 'shoot', fx: 'zest', sfx: 'volto',
    eff: [{ t: 'proj', power: 22, speed: 18, r: 0.3, aura: 1, homing: 3 }], tags: ['projectile'] },
  { id: 'come_together', name: 'Come Together', elem: 'echo', desc: 'Come together, right now: pulls every foe around it in, then a shockwave.', cost: 20, cd: 10, aim: 'self', range: 0, anim: 'roar', fx: 'whirlpool', sfx: 'echo_boom', windup: 0.2, telegraph: 'circle',
    eff: [{ t: 'pull', range: 6, k: 3 }, { t: 'aoe', at: 'self', r: 2.4, power: 26, knock: 2, aura: 1, delay: 0.3 }], tags: ['aoe'] },
  { id: 'mind_games', name: 'Mind Games', elem: 'echo', desc: 'Playing those mind games together: a cone of swirling sound that confuses.', cost: 15, cd: 8, aim: 'dir', range: 5, anim: 'cast', fx: 'screech', sfx: 'echo',
    eff: [{ t: 'cone', range: 5, arc: 70, power: 16, aura: 1, status: { s: 'confuse', dur: 2 } }], tags: ['cone'] },
  { id: 'give_peace_a_chance', name: 'Give Peace a Chance', elem: 'echo', desc: 'All we are saying: every ally is cleansed and gets a peace-sign shield.', cost: 20, cd: 13, aim: 'self', range: 0, anim: 'cast', fx: 'shield', sfx: 'bio_heal',
    eff: [{ t: 'buff', who: 'team', s: 'cleanse' }, { t: 'buff', who: 'team', s: 'shield', k: 0.2, dur: 6 }], tags: ['buff', 'shield'] },
  { id: 'number_nine_dream', name: '#9 Dream', elem: 'echo', desc: 'A dreamy haze where foes drift off to sleep.', cost: 20, cd: 12, aim: 'point', range: 7, anim: 'cast', fx: 'pollen', sfx: 'sleep', telegraph: 'circle',
    eff: [{ t: 'zone', kind: 'pollen', r: 2.2, dur: 4, tick: { status: { s: 'drowsy', dur: 0.5 } }, enemy: true }], tags: ['zone', 'sleep'] },
  { id: 'lemon_revolution', kind: 'ultimate', name: 'Revolution', elem: 'volto', desc: 'ULTIMATE: you say you want a revolution — four zesty shockwaves spin out and the whole team is fired up (+20% power).', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'headbang', fx: 'ult_storm', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'aoe', at: 'self', r: 4.4, power: 30, knock: 2, aura: 1.5, count: 4, interval: 0.4, lastMul: 1.8, status: { s: 'stun', dur: 0.3 } }, { t: 'buff', who: 'team', s: 'dmg', k: 0.2, dur: 6 }, { t: 'buff', who: 'team', s: 'elm', k: 0.2, dur: 6 }], tags: ['ult'] },
  { id: 'round_glasses', kind: 'passive', name: 'Round Glasses', elem: 'volto', desc: 'Sees clearly: +8% crit chance and +8% elemental damage.', mods: { critChance: 0.08, elmMul: 1.08 } },
]);

// ===================================================================== Starrfish (The Beatles: Ringo)
export const STARRFISH = L('starrfish', [
  { id: 'drum_fill', name: 'Drum Fill', elem: 'echo', desc: 'A rolling fill on the foe\'s head with all five arms.', cost: 12, cd: 4, aim: 'target', range: 6, anim: 'headbang', fx: 'drumroll', sfx: 'echo', beat: true,
    eff: [{ t: 'aoe', at: 'target', r: 1.2, power: 9, count: 5, interval: 0.1, aura: 0.5 }], tags: ['aoe', 'beat'] },
  { id: 'octopuss_garden', name: "Octopus's Garden", elem: 'hydro', desc: 'In the shade: a cosy underwater garden where allies heal and foes are soaked and slowed.', cost: 22, cd: 12, aim: 'self', range: 0, anim: 'cast', fx: 'whirlpool', sfx: 'hydro', windup: 0.3,
    eff: [{ t: 'zone', at: 'self', kind: 'wet', r: 2.8, dur: 6, tick: { heal: 0.03, status: { s: 'slow', dur: 0.6, k: 0.3 } } }], tags: ['zone', 'heal'] },
  { id: 'little_help', name: 'With a Little Help', elem: 'echo', desc: 'Gets by with a little help from its friends: the team gets +15% power for 8 s and +15 energy.', cost: 15, cd: 15, aim: 'self', range: 0, anim: 'roar', fx: 'buff_echo', sfx: 'crowd_cheer',
    eff: [{ t: 'buff', who: 'team', s: 'dmg', k: 0.15, dur: 8 }, { t: 'buff', who: 'team', s: 'elm', k: 0.15, dur: 8 }, { t: 'buff', who: 'team', s: 'energy', k: 15 }], tags: ['buff'] },
  { id: 'yellow_submarine', name: 'Yellow Submarine', elem: 'hydro', desc: 'Dives like a little yellow submarine and surfaces under the foe in a splash.', cost: 18, cd: 7, aim: 'point', range: 7, anim: 'dodge', fx: 'water_dash', sfx: 'hydro_splash', windup: 0.1, telegraph: 'circle',
    eff: [{ t: 'dash', leap: true }, { t: 'aoe', r: 1.9, power: 26, knock: 2, up: 4, aura: 1.2, delay: 0.3 }], tags: ['dash', 'aoe'] },
  { id: 'photograph', name: 'Photograph', elem: 'echo', desc: 'Snaps a photograph: the flash marks the foes in front of it and blinds those close by.', cost: 12, cd: 8, aim: 'dir', range: 6, anim: 'cast', fx: 'glare', sfx: 'echo',
    eff: [{ t: 'cone', range: 6, arc: 60, power: 12, aura: 1, status: { s: 'mark', dur: 5, k: 0.15 } }, { t: 'status', who: 'aoe', r: 3, s: 'blind', dur: 1.2 }], tags: ['cone'] },
  { id: 'peace_and_love', name: 'Peace and Love', elem: 'hydro', desc: 'Peace and love! Heals an ally 22%.', cost: 15, cd: 8, aim: 'ally', range: 8, anim: 'cast', fx: 'heal', sfx: 'bio_heal',
    eff: [{ t: 'heal', who: 'target', k: 0.22 }], tags: ['heal'] },
  { id: 'the_end', kind: 'ultimate', name: 'The End', elem: 'echo', desc: 'ULTIMATE: the one and only drum solo — eight thunderous hits around it, the last one shaking the whole stage.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'headbang', fx: 'ult_encore', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'aoe', at: 'self', r: 3.6, power: 16, knock: 1, aura: 1, count: 8, interval: 0.18, lastMul: 3.5 }], tags: ['ult'] },
  { id: 'steady_beat', kind: 'passive', name: 'Steady Beat', elem: 'echo', desc: 'Keeps perfect time: wider beat window, on-beat hits +35%.', mods: { beatWindow: 0.15, beatMul: 1.35 } },
]);

// ===================================================================== Yokat (Yoko Ono)
export const YOKAT = L('yokat', [
  { id: 'bag_piece', name: 'Bag Piece', elem: 'ecto', desc: 'Slips into a big black bag: intangible for 1.6 s, and whoever is next to it gets confused.', cost: 14, cd: 9, aim: 'self', range: 0, anim: 'cast', fx: 'phase', sfx: 'ecto',
    eff: [{ t: 'buff', s: 'phase', dur: 1.6 }, { t: 'status', who: 'aoe', r: 2.2, s: 'confuse', dur: 1.6 }], tags: ['buff'] },
  { id: 'wish_tree', name: 'Wish Tree', elem: 'ecto', desc: 'Plants a wish tree hung with paper wishes: allies near it heal, foes lose heart.', cost: 20, cd: 11, aim: 'point', range: 7, anim: 'cast', fx: 'spores', sfx: 'bio_heal', windup: 0.3,
    eff: [{ t: 'zone', kind: 'vines', r: 2.4, dur: 6, tick: { heal: 0.035, status: { s: 'weaken', dur: 1, k: 0.15 } } }], tags: ['zone', 'heal'] },
  { id: 'mend_piece', name: 'Mend Piece', elem: 'ecto', desc: 'Glues an ally back together like a broken cup: heals 26%.', cost: 18, cd: 9, aim: 'ally', range: 8, anim: 'cast', fx: 'heal', sfx: 'bio_heal',
    eff: [{ t: 'heal', who: 'target', k: 0.26 }], tags: ['heal'] },
  { id: 'yes_painting', name: 'YES', elem: 'echo', desc: 'Climbs a ladder and finds a tiny "YES" on the ceiling: the team gets +15% power for 8 s.', cost: 15, cd: 15, aim: 'self', range: 0, anim: 'cast', fx: 'buff_echo', sfx: 'echo',
    eff: [{ t: 'buff', who: 'team', s: 'dmg', k: 0.15, dur: 8 }, { t: 'buff', who: 'team', s: 'elm', k: 0.15, dur: 8 }], tags: ['buff'] },
  { id: 'walking_on_thin_ice', name: 'Walking on Thin Ice', elem: 'cryo', desc: 'Its steps crackle into thin ice: a cone that may freeze; foes close by are slowed.', cost: 16, cd: 7, aim: 'dir', range: 5, anim: 'roar', fx: 'frost_cone', sfx: 'cryo',
    eff: [{ t: 'cone', range: 5, arc: 70, power: 22, aura: 1, status: { s: 'frozen', dur: 1.2, chance: 0.35 } }, { t: 'status', who: 'aoe', r: 3, s: 'slow', dur: 2, k: 0.35 }], tags: ['cone'] },
  { id: 'cut_piece', name: 'Cut Piece', elem: 'ecto', desc: 'Snip, snip: ghostly scissors cut the foe\'s defense.', cost: 12, cd: 4, aim: 'target', range: 2.8, anim: 'attack2', fx: 'air_blade', sfx: 'hit_light', windup: 0.15,
    eff: [{ t: 'melee', power: 20, reach: 1.6, arc: 90, knock: 1, lunge: 1.6, aura: 1, status: { s: 'defdown', dur: 4, k: 0.25 } }], tags: ['melee'] },
  { id: 'war_is_over', kind: 'ultimate', name: 'War Is Over!', elem: 'echo', desc: 'ULTIMATE: if you want it — every foe lays down its arms (−35% damage), the team is healed 30% and cleansed.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'cast', fx: 'peace', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'timing', n: 1 },
    eff: [{ t: 'status', who: 'aoe', r: 8, s: 'weaken', dur: 6, k: 0.35 }, { t: 'heal', who: 'team', k: 0.3 }, { t: 'buff', who: 'team', s: 'cleanse' }, { t: 'aoe', at: 'self', r: 4, power: 40, knock: 3, aura: 2 }], tags: ['ult'] },
  { id: 'grapefruit', kind: 'passive', name: 'Grapefruit', elem: 'ecto', desc: 'A book of instructions for everything: skills cost 15% less and recharge 10% faster.', mods: { costMul: 0.85, cdMul: 0.9 } },
  { id: 'dark_glasses', kind: 'passive', name: 'Dark Glasses', elem: 'ecto', desc: 'Round dark glasses: immune to blind; dodge recharges 20% faster.', mods: { immune: ['blind'], dodgeCd: 0.8 } },
]);

// ===================================================================== Blackvolt (legendary, AC/DC "Back in Black")
export const BLACKVOLT = L('blackvolt', [
  { id: 'back_in_black', name: 'Back in Black', elem: 'volto', desc: 'Spreads its black wings and the arena goes dark: every foe is blinded, then silver lightning bursts around it.', cost: 25, cd: 9, aim: 'self', range: 0, anim: 'roar', fx: 'ult_storm', sfx: 'volto', windup: 0.35, telegraph: 'circle',
    eff: [{ t: 'status', who: 'aoe', r: 9, s: 'blind', dur: 2.5 }, { t: 'aoe', at: 'self', r: 4.2, power: 46, knock: 4, aura: 2, delay: 0.5 }], tags: ['aoe'] },
  { id: 'shoot_to_thrill', name: 'Shoot to Thrill', elem: 'volto', desc: 'Three silver lightning bolts that pierce and chain.', cost: 15, cd: 3, aim: 'dir', range: 11, anim: 'shoot', fx: 'zap', sfx: 'volto', windup: 0.15,
    eff: [{ t: 'proj', count: 3, spread: 18, power: 26, speed: 28, r: 0.3, aura: 1, pierce: true, chain: { n: 1, r: 4, k: 0.5 } }], tags: ['projectile'] },
  { id: 'tolling_bell', name: 'Tolling Bell', elem: 'ferro', desc: 'Its great bell tolls once: a shockwave that stuns everything around it.', cost: 22, cd: 10, aim: 'self', range: 0, anim: 'slam', fx: 'slap_ring', sfx: 'destroy_metal', windup: 0.4, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'self', r: 3.6, power: 34, knock: 3, aura: 1, status: { s: 'stun', dur: 1.1 } }], tags: ['aoe'] },
  { id: 'rock_and_roll_aint_noise', name: "Rock and Roll Ain't Noise Pollution", elem: 'echo', desc: 'A blast of pure rock straight down a line.', cost: 22, cd: 8, aim: 'dir', range: 12, anim: 'roar', fx: 'soundwave', sfx: 'echo_boom', windup: 0.3, telegraph: 'line', beat: true,
    eff: [{ t: 'line', range: 12, width: 2, power: 48, knock: 5, aura: 1.5, delay: 0.3 }], tags: ['line', 'beat'] },
  { id: 'thunderstruck', kind: 'ultimate', name: 'Thunderstruck', elem: 'volto', desc: 'ULTIMATE: THUNDER! — eight lightning strikes chase every foe across the arena, the last one a direct hit.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'roar', fx: 'ult_storm', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'aoe', at: 'self', r: 6, power: 30, knock: 2, aura: 2, count: 8, interval: 0.25, lastMul: 2.2, status: { s: 'stun', dur: 0.3 } }], tags: ['ult'] },
  { id: 'silver_lightning', kind: 'passive', name: 'Silver Lightning', elem: 'volto', desc: 'Legendary storm: +20% elemental damage and +10% crit chance.', mods: { elmMul: 1.2, critChance: 0.1 } },
]);

// ===================================================================== Prismoon (legendary, Pink Floyd "The Dark Side of the Moon")
export const PRISMOON = L('prismoon', [
  { id: 'prism_beam', name: 'Prism Beam', elem: 'astro', desc: 'A white beam enters its prism head and splits: a straight beam plus a fan of rainbow rays.', cost: 22, cd: 6, aim: 'dir', range: 13, anim: 'roar', fx: 'star_beam', sfx: 'astro', windup: 0.35, telegraph: 'line',
    eff: [{ t: 'line', range: 13, width: 1.2, power: 40, knock: 2, aura: 2, delay: 0.3 }, { t: 'proj', count: 5, spread: 40, power: 14, speed: 24, r: 0.3, aura: 0.6, pierce: true }], tags: ['line', 'projectile'] },
  { id: 'eclipse', name: 'Eclipse', elem: 'ecto', desc: 'The dark side swallows the light: a zone of total eclipse that curses foes inside.', cost: 22, cd: 10, aim: 'point', range: 9, anim: 'cast', fx: 'gravity', sfx: 'ecto', telegraph: 'circle',
    eff: [{ t: 'zone', kind: 'ink', r: 3, dur: 5, tick: { power: 8, aura: 1, status: { s: 'curse', dur: 1, k: 0.2 } }, enemy: true }], tags: ['zone'] },
  { id: 'time_rewind', name: 'Time', elem: 'astro', desc: 'Ticking clocks chime: restores the HP it lost in the last 4 s.', cost: 20, cd: 15, aim: 'self', range: 0, anim: 'cast', fx: 'rewind', sfx: 'astro',
    eff: [{ t: 'heal', rewind: 4 }], tags: ['heal'] },
  { id: 'great_gig_in_the_sky', name: 'The Great Gig in the Sky', elem: 'astro', desc: 'A wordless, soaring wail: the team heals 20% and every foe nearby is weakened.', cost: 25, cd: 14, aim: 'self', range: 0, anim: 'roar', fx: 'peace', sfx: 'astro',
    eff: [{ t: 'heal', who: 'team', k: 0.2 }, { t: 'status', who: 'aoe', r: 7, s: 'weaken', dur: 5, k: 0.25 }], tags: ['heal'] },
  { id: 'any_colour_you_like', name: 'Any Colour You Like', elem: 'astro', desc: 'Six prism shards in every colour hunt down foes.', cost: 18, cd: 6, aim: 'dir', range: 11, anim: 'cast', fx: 'star_beam', sfx: 'astro',
    eff: [{ t: 'proj', count: 6, spread: 70, power: 16, speed: 14, r: 0.3, aura: 1, homing: 2.5 }], tags: ['projectile'] },
  { id: 'dark_side_of_the_moon', kind: 'ultimate', name: 'The Dark Side of the Moon', elem: 'astro', desc: 'ULTIMATE: a total eclipse drags every foe in — a heartbeat — then a blinding rainbow beam tears across the arena.', cost: 0, cd: 0, aim: 'dir', range: 15, anim: 'roar', fx: 'ult_beam', sfx: 'ult_start', telegraph: 'line', qte: { type: 'timing', n: 1 },
    eff: [{ t: 'zone', at: 'self', kind: 'gravity', r: 6, dur: 2, pull: 3, tick: { power: 8, status: { s: 'blind', dur: 0.6 } }, enemy: true }, { t: 'line', range: 15, width: 3, power: 110, knock: 6, aura: 2, delay: 1.4 }], tags: ['ult'] },
  { id: 'dark_side', kind: 'passive', name: 'Dark Side', elem: 'astro', desc: 'All of it is dark: +20% elemental damage, cooldowns 10% shorter.', mods: { elmMul: 1.2, cdMul: 0.9 } },
]);

export const MOVES = [...BARKORIOUS, ...SANDMANDER, ...JUSTATUE, ...WEIRDFIN, ...ROLLICK, ...NEVERDECKER, ...JOHNLEMON, ...STARRFISH, ...YOKAT, ...BLACKVOLT, ...PRISMOON];
