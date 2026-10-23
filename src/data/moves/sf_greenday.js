// Unique moves, passives and ultimates of the Green Day line (Grenaday → Armagreddon). Every name is
// a Green Day song. NOT shared with other lines. Format: src/data/skills.js.
//
// Self-damage: Having a Blast and Last Night on Earth carry a { t: 'recoil', k, ko, delay } effect —
// k × max HP of damage to the user after the blast (ko: true always knocks it out; src/battle/sim.js
// runRecoil). The AI only fires Last Night on Earth with a teammate left or against a hurt foe.
const L = (line, list) => list.map((s) => Object.assign({ line }, s));

// ===================================================================== Grenaday → Armagreddon (Green Day)
export const GRENADAY = L('grenaday', [
  { id: 'horseshoes_and_handgrenades', name: 'Horseshoes and Handgrenades', elem: 'pyro', desc: 'Close only counts in horseshoes and hand grenades: lobs a little grenade that goes off where it lands. Hold to let it cook for a bigger bang.', cost: 12, cd: 3.2, aim: 'point', range: 8, anim: 'shoot', fx: 'rock_lob', sfx: 'pyro_boom', charge: { max: 1.0, mult: 1.8 },
    eff: [{ t: 'proj', power: 22, speed: 11, r: 0.32, aura: 1, arc: true, explode: { r: 1.4, k: 1 }, status: { s: 'burn', dur: 3, chance: 0.35, k: 0.25 } }], tags: ['projectile', 'charge'] },
  { id: 'basket_case', name: 'Basket Case', elem: 'pyro', desc: 'Do you have the time to listen to it whine? A spinning tantrum of sparks that may confuse everything around it.', cost: 14, cd: 6, aim: 'self', range: 0, anim: 'spin', fx: 'fire_spin', sfx: 'pyro', scale: 'phys', windup: 0.2, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'self', r: 2.2, power: 22, knock: 2.5, aura: 1, status: { s: 'confuse', dur: 1.4, chance: 0.4 } }], tags: ['aoe'] },
  { id: 'burnout', name: 'Burnout', elem: 'pyro', desc: 'Peels out across the floor on its high-tops, leaving a strip of burning rubber.', cost: 14, cd: 6, aim: 'dir', range: 6, anim: 'attack3', fx: 'fire_dash', sfx: 'pyro', scale: 'phys', windup: 0.1,
    eff: [{ t: 'dash', dist: 6, speed: 16, power: 20, r: 0.9, knock: 2, aura: 1, trail: 'fire' }], tags: ['dash'] },
  { id: 'letterbomb', name: 'Letterbomb', elem: 'pyro', desc: 'Slips a letterbomb onto the ground: the first foe to step on it gets the message, loudly.', cost: 16, cd: 9, aim: 'point', range: 7, anim: 'cast', fx: 'fireworks', sfx: 'pyro_boom', windup: 0.2,
    eff: [{ t: 'summon', kind: 'trap', r: 0.9, dur: 12, power: 30, aura: 1.5, status: { s: 'stun', dur: 0.8 } }], tags: ['trap', 'strategy'] },
  { id: 'having_a_blast', name: 'Having a Blast', elem: 'pyro', desc: 'Goes off at point-blank range: a big blast all around it that also scorches itself (−20% of its own HP).', cost: 20, cd: 10, aim: 'self', range: 0, anim: 'roar', fx: 'fire_nova', sfx: 'pyro_boom', windup: 0.4, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'self', r: 2.8, power: 46, knock: 5, up: 3, aura: 1.5, destroy: true }, { t: 'recoil', k: 0.2 }], tags: ['aoe'] },
  // ---- Armagreddon (the bomb)
  { id: 'american_idiot', name: 'American Idiot', elem: 'nucleo', desc: 'Don\'t wanna be an idiot: it unzips and screams a cone of irradiated static.', cost: 18, cd: 6, aim: 'dir', range: 5.5, anim: 'roar', fx: 'rad_cone', sfx: 'nucleo', windup: 0.3,
    eff: [{ t: 'cone', range: 5.5, arc: 70, power: 34, knock: 2, aura: 1.5, status: { s: 'radiation', dur: 4, k: 0.3 } }], tags: ['cone'] },
  { id: 'twenty_one_guns', name: '21 Guns', elem: 'pyro', desc: 'One more salute: twenty-one little warheads fan out from its fins at once.', cost: 18, cd: 6, aim: 'dir', range: 9, anim: 'shoot', fx: 'fireball', sfx: 'pyro_boom', windup: 0.2,
    eff: [{ t: 'proj', power: 6, speed: 15, r: 0.22, aura: 0.4, count: 21, spread: 100 }], tags: ['projectile'] },
  { id: 'know_your_enemy', name: 'Know Your Enemy', elem: 'nucleo', desc: 'Violence is an energy: every foe in range is marked and takes +18% damage.', cost: 12, cd: 10, aim: 'self', range: 0, anim: 'roar', fx: 'sonar', sfx: 'nucleo',
    eff: [{ t: 'mark', r: 10, dur: 6, k: 0.18 }], tags: ['mark'] },
  { id: 'holiday', name: 'Holiday', elem: 'pyro', desc: 'Takes a holiday from reason: +30% elemental power and +15% speed for 6 s.', cost: 15, cd: 13, aim: 'self', range: 0, anim: 'flex', fx: 'buff_fire', sfx: 'pyro',
    eff: [{ t: 'buff', s: 'elm', k: 0.3, dur: 6 }, { t: 'buff', s: 'spd', k: 0.15, dur: 6 }], tags: ['buff'] },
  { id: 'give_me_novacaine', name: 'Give Me Novacaine', elem: 'nucleo', desc: 'Numbs itself: shakes off burns, poison and slows and wraps itself in a shield worth 25% HP.', cost: 18, cd: 13, aim: 'self', range: 0, anim: 'flex', fx: 'shield', sfx: 'geo_wall',
    eff: [{ t: 'buff', s: 'cleanse' }, { t: 'buff', s: 'shield', k: 0.25, dur: 7 }], tags: ['buff', 'shield'] },
  { id: 'boulevard_of_broken_dreams', kind: 'ultimate', name: 'Boulevard of Broken Dreams', elem: 'pyro', desc: 'ULTIMATE: walks the lonely road — it tears down a strip of burning road, then the whole boulevard behind it goes up in a line of explosions.', cost: 0, cd: 0, aim: 'dir', range: 10, anim: 'attack3', fx: 'ult_inferno', sfx: 'ult_start', telegraph: 'line', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'dash', dist: 8, speed: 14, power: 28, r: 1.1, knock: 2, aura: 1, iframe: true, trail: 'fire' }, { t: 'line', range: 10, width: 2.4, power: 56, knock: 4, up: 3, aura: 2, delay: 0.8, destroy: true }], tags: ['ult'] },
  { id: 'last_night_on_earth', kind: 'ultimate', name: 'Last Night on Earth', elem: 'nucleo', desc: 'ULTIMATE: its last night on earth. Everyone freezes as the countdown starts — then it goes nuclear: a mushroom cloud flattens the whole field (huge damage, radiation) and knocks Armagreddon out too.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'roar', fx: 'ult_meltdown', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'mash', n: 20 },
    eff: [
      { t: 'status', who: 'aoe', r: 12, s: 'stun', dur: 1.4 },
      { t: 'aoe', at: 'self', r: 12, power: 240, knock: 12, up: 6, aura: 3, delay: 1.6, destroy: true, crack: true, status: { s: 'radiation', dur: 6, k: 0.5 } },
      { t: 'recoil', k: 1, ko: true, delay: 1.65 },
    ], tags: ['ult'] },
  { id: 'brain_stew', kind: 'passive', name: 'Brain Stew', elem: 'pyro', desc: 'An insomniac: it can\'t be put to sleep, and Heat builds 20% faster.', mods: { immune: ['sleep', 'drowsy'], heatGain: 1.2 } },
  { id: 'walking_contradiction', kind: 'passive', name: 'Walking Contradiction', elem: 'pyro', desc: 'Below 40% HP it hits 30% harder — and takes 10% more.', when: { lowHp: 0.4 }, mods: { dmgMul: 1.3, takenMul: 1.1 } },
  { id: 'restless_heart_syndrome', kind: 'passive', name: 'Restless Heart Syndrome', elem: 'nucleo', desc: 'Its core never rests: Heat builds 40% faster and it deals +10% elemental damage.', mods: { heatGain: 1.4, elmMul: 1.1 } },
]);

export const MOVES = [...GRENADAY];
