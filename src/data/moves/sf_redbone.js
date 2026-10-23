// Unique moves, passives and ultimates of the Blowhale line (a Redbone homage: a floating tartan
// balloon whale with a red bone spine and a slow funk groove). Moves are named after Redbone songs and
// albums; one passive borrows the "stay woke" hook of the slow-funk song that shares the name. NOT
// shared with other lines. Format: src/data/skills.js.
const L = (line, list) => list.map((s) => Object.assign({ line }, s));

// ===================================================================== Blowhale → Tartanic
export const BLOWHALE = L('blowhale', [
  // ---- Blowhale (the little balloon whale)
  { id: 'message_from_a_drum', name: 'Message from a Drum', elem: 'echo', desc: 'Drums on its own taut balloon belly: a booming ring that knocks foes back. Bigger on the beat.', cost: 12, cd: 4, aim: 'self', range: 0, anim: 'slam', fx: 'bassdrop', sfx: 'echo_boom', windup: 0.2, telegraph: 'circle', beat: true,
    eff: [{ t: 'aoe', at: 'self', r: 2.2, power: 20, knock: 3, aura: 1 }], tags: ['aoe', 'beat'] },
  { id: 'niki_hoeky', name: 'Niki Hoeky', elem: 'aero', desc: 'Puffs out three bouncy little air-balloons that ricochet between foes.', cost: 10, cd: 2.8, aim: 'dir', range: 9, anim: 'shoot', fx: 'bubble', sfx: 'bubble_pop',
    eff: [{ t: 'proj', power: 9, speed: 12, r: 0.3, aura: 0.6, count: 3, spread: 30, bounce: 2 }], tags: ['projectile'] },
  { id: 'maggie', name: 'Maggie', elem: 'echo', desc: 'Hums a sweet slow song to an ally: heals 22% over 4 s.', cost: 18, cd: 10, aim: 'ally', range: 8, anim: 'cast', fx: 'heal', sfx: 'bio_heal',
    eff: [{ t: 'heal', who: 'target', k: 0.22, over: 4 }], tags: ['heal'] },
  { id: 'witch_queen', name: 'The Witch Queen of New Orleans', elem: 'ecto', desc: 'Calls up a swampy voodoo mist over the target: foes in it are cursed and hit 15% softer.', cost: 18, cd: 9, aim: 'point', range: 8, anim: 'cast', fx: 'shade', sfx: 'ecto', windup: 0.3, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'point', r: 2.2, power: 18, knock: 1, aura: 1, delay: 0.4, status: { s: 'curse', dur: 4, k: 0.15 } }, { t: 'status', who: 'aoe', r: 2.4, s: 'weaken', dur: 4, k: 0.15 }], tags: ['aoe', 'debuff'] },
  { id: 'crazy_cajun_cakewalk', name: 'Crazy Cajun Cakewalk', elem: 'aero', desc: 'Struts through the air in a high-stepping cakewalk, bumping every foe on the way.', cost: 14, cd: 6, aim: 'dir', range: 6, anim: 'attack3', fx: 'surf', sfx: 'whoosh', windup: 0.15, beat: true,
    eff: [{ t: 'dash', dist: 6, speed: 11, power: 18, r: 1.1, knock: 2.5, aura: 1 }], tags: ['dash', 'beat'] },
  // ---- Tartanic (the giant)
  { id: 'redbone_wail', name: 'Redbone', elem: 'echo', desc: 'Its red bone spine glows and all three bagpipe drones wail one long falsetto note: a sound line that may stun.', cost: 18, cd: 6, aim: 'dir', range: 9, anim: 'roar', fx: 'soundwave', sfx: 'echo_boom', windup: 0.3, telegraph: 'line',
    eff: [{ t: 'line', range: 9, width: 1.8, power: 32, knock: 3, aura: 1, delay: 0.2, status: { s: 'stun', dur: 0.6, chance: 0.3 } }], tags: ['line'] },
  { id: 'cycles_spin', name: 'Cycles', elem: 'aero', desc: 'Rolls over and over in a slow barrel-roll groove: a funk cyclone that drags foes round and heals allies inside.', cost: 22, cd: 10, aim: 'self', range: 0, anim: 'spin', fx: 'tornado', sfx: 'aero', windup: 0.25, telegraph: 'circle',
    eff: [{ t: 'zone', at: 'self', kind: 'groove', r: 3, dur: 5, pull: 1.2, tick: { heal: 0.02, power: 9, aura: 0.5, status: { s: 'slow', dur: 0.6, k: 0.3 } } }], tags: ['zone', 'heal'] },
  { id: 'already_here', name: 'Already Here', elem: 'aero', desc: 'Lets a little air out and zips across the arena like a loose balloon — it was already there.', cost: 12, cd: 7, aim: 'dir', range: 7, anim: 'dodge', fx: 'gust', sfx: 'whoosh', windup: 0.05,
    eff: [{ t: 'dash', dist: 7, speed: 22, power: 12, r: 1.1, knock: 2, aura: 1, iframe: true }], tags: ['dash'] },
  // ---- ultimate
  { id: 'come_and_get_your_love', kind: 'ultimate', name: 'Come and Get Your Love', elem: 'echo', desc: 'ULTIMATE: hey! The groove drops and nobody can resist — every foe is pulled into the funk, four bass shockwaves roll out, and the team is healed 25%.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'headbang', fx: 'ult_encore', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'pull', range: 6, k: 3 }, { t: 'aoe', at: 'self', r: 4, power: 26, knock: 2, aura: 1.5, count: 4, interval: 0.45, lastMul: 1.8 }, { t: 'heal', who: 'team', k: 0.25 }], tags: ['ult'] },
  // ---- passives
  { id: 'stay_woke', kind: 'passive', name: 'Stay Woke', elem: 'echo', desc: 'Never sleeps through the groove: immune to sleep and drowsiness, ultimate charges 15% faster.', mods: { immune: ['sleep', 'drowsy'], ultGain: 1.15 } },
  { id: 'red_bone_spine', kind: 'passive', name: 'Red Bone Spine', elem: 'ferro', desc: 'Its glossy red spine takes the knocks: −12% damage taken, and it shrugs off knockback.', mods: { takenMul: 0.88, knockImmune: true } },
]);

export const MOVES = [...BLOWHALE];
