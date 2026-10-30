// Unique moves, passives and ultimates of the Talonaka line (a Masayoshi Takanaka homage: a tropical guitar
// eagle that becomes the Captain or the Surfer). Moves are named after Takanaka songs and albums (Blue Lagoon,
// Ready to Fly, Brasilian Skies, Thunder Storm, Tokio Express, Chala Mon Mai Anou, Oh! Tengo Suerte, Sweet Agnes,
// Saudade, Jolly Jive, Seychelles, An Insatiable High, T-Wave) and a few sea puns. NOT shared with other lines.
// Format: src/data/skills.js.
const L = (line, list) => list.map((s) => Object.assign({ line }, s));

// ===================================================================== Talonaka → Takaptain / Hawkabunga
export const TALONAKA = L('talonaka', [
  // ---- Talonaka (the guitar eaglet)
  { id: 'blue_lagoon', name: 'Blue Lagoon', elem: 'hydro', desc: 'Strums a shimmering lagoon riff: a pool of cool water rings it, healing allies inside and slowing foes.', cost: 16, cd: 9, aim: 'self', range: 0, anim: 'cast', fx: 'rain', sfx: 'hydro', windup: 0.2, telegraph: 'circle',
    eff: [{ t: 'zone', at: 'self', kind: 'wet', r: 2.6, dur: 5, tick: { heal: 0.025, power: 5, aura: 1, status: { s: 'slow', dur: 0.6, k: 0.25 } } }], tags: ['zone', 'heal'] },
  { id: 'ready_to_fly', name: 'Ready to Fly', elem: 'aero', desc: 'Spreads its wings mid-solo and takes off: a soaring dash that slices through foes.', cost: 12, cd: 5, aim: 'dir', range: 5, anim: 'dodge', fx: 'gust', sfx: 'aero', windup: 0.05,
    eff: [{ t: 'dash', dist: 5, speed: 18, power: 16, r: 0.9, knock: 1.5, aura: 1, iframe: true }], tags: ['dash'] },
  { id: 'brasilian_skies', name: 'Brasilian Skies', elem: 'echo', desc: 'A samba-fusion run up the neck: five bright notes arc out across the sky. Harder on the beat.', cost: 12, cd: 3.2, aim: 'dir', range: 9, anim: 'shoot', fx: 'riff', sfx: 'guitar_riff', windup: 0.12, beat: true,
    eff: [{ t: 'proj', power: 9, speed: 15, r: 0.25, aura: 0.6, count: 5, spread: 50 }], tags: ['projectile', 'beat'] },
  { id: 'tokio_express', name: 'Tokio Express', elem: 'echo', desc: 'Rides the express riff: three quick shockwaves rattle down a line like a bullet train.', cost: 14, cd: 6, aim: 'dir', range: 7, anim: 'attack2', fx: 'strings', sfx: 'guitar_riff', telegraph: 'line', windup: 0.1,
    eff: [{ t: 'line', range: 7, width: 1.2, power: 14, knock: 1, aura: 1, delay: 0.1, count: 3, interval: 0.18 }], tags: ['line'] },
  { id: 'chala_mon_mai_anou', name: 'Chala Mon Mai Anou', elem: 'hydro', desc: 'A sunny island chant: +25% speed and +20% elemental power for 6 s.', cost: 14, cd: 12, aim: 'self', range: 0, anim: 'flex', fx: 'buff_water', sfx: 'hydro',
    eff: [{ t: 'buff', s: 'spd', k: 0.25, dur: 6 }, { t: 'buff', s: 'elm', k: 0.2, dur: 6 }], tags: ['buff'] },
  // ---- Takaptain (the Captain)
  { id: 'full_speed_ahead', name: 'Full Speed Ahead', elem: 'hydro', desc: 'Spins the ship\'s-wheel guitar and rams ahead at full steam, sweeping foes aside on a bow wave.', cost: 16, cd: 7, aim: 'dir', range: 6, anim: 'attack3', fx: 'water_dash', sfx: 'hydro_splash', scale: 'phys', windup: 0.15,
    eff: [{ t: 'dash', dist: 6, speed: 16, power: 26, r: 1.2, knock: 3, aura: 1 }], tags: ['dash'] },
  { id: 'oh_tengo_suerte', name: 'Oh! Tengo Suerte', elem: 'echo', desc: '"I\'m lucky!" A jaunty riff: for 2.5 s every hit it lands is a critical hit, and +15% damage for 6 s.', cost: 16, cd: 14, aim: 'self', range: 0, anim: 'flex', fx: 'buff_echo', sfx: 'guitar_riff',
    eff: [{ t: 'buff', s: 'quicken', dur: 2.5 }, { t: 'buff', s: 'dmg', k: 0.15, dur: 6 }], tags: ['buff'] },
  { id: 'all_hands_on_deck', name: 'All Hands on Deck', elem: 'hydro', desc: 'The Captain calls the crew: every ally gets a shield and +15% defense for 6 s.', cost: 18, cd: 14, aim: 'self', range: 0, anim: 'roar', fx: 'shield', sfx: 'ferro',
    eff: [{ t: 'buff', who: 'team', s: 'shield', k: 0.2, dur: 6 }, { t: 'buff', who: 'team', s: 'def', k: 0.15, dur: 6 }], tags: ['buff', 'shield'] },
  { id: 'saudade', name: 'Saudade', elem: 'hydro', desc: 'A wistful ballad of the sea: heals the whole team 15% and washes away burns and poison.', cost: 18, cd: 13, aim: 'self', range: 0, anim: 'cast', fx: 'heal', sfx: 'bio_heal',
    eff: [{ t: 'heal', who: 'team', k: 0.15 }, { t: 'buff', who: 'team', s: 'cleanse' }], tags: ['heal'] },
  // ---- Hawkabunga (the Surfer)
  { id: 'hang_ten', name: 'Hang Ten', elem: 'hydro', desc: 'Hangs ten on the surfboard guitar and carves through the foes, leaving a slick wake behind.', cost: 14, cd: 5, aim: 'dir', range: 6, anim: 'dodge', fx: 'surf', sfx: 'whoosh', windup: 0.05,
    eff: [{ t: 'dash', dist: 6, speed: 18, power: 20, r: 1.0, knock: 2, aura: 1, iframe: true }, { t: 'zone', at: 'self', kind: 'wet', r: 1.8, dur: 4 }], tags: ['dash'] },
  { id: 'thunder_storm', name: 'Thunder Storm', elem: 'volto', desc: 'Whips up a squall over the target: rain lashes the area and three lightning strikes crack down. May stun.', cost: 20, cd: 10, aim: 'point', range: 8, anim: 'cast', fx: 'rain', sfx: 'volto', telegraph: 'circle', windup: 0.2,
    eff: [{ t: 'zone', kind: 'rain', r: 2.4, dur: 4, tick: { power: 6, aura: 1 }, enemy: true }, { t: 'aoe', at: 'point', r: 1.6, power: 20, knock: 1, aura: 1, delay: 0.5, count: 3, interval: 0.6, status: { s: 'stun', dur: 0.6, chance: 0.25 } }], tags: ['zone', 'aoe'] },
  { id: 'jolly_jive', name: 'Jolly Jive', elem: 'echo', desc: 'A jolly jive on the board: a wobbling wave of sound that may leave foes dizzy. Harder on the beat.', cost: 14, cd: 5, aim: 'dir', range: 5, anim: 'headbang', fx: 'soundwave', sfx: 'echo', windup: 0.15, beat: true,
    eff: [{ t: 'cone', range: 5, arc: 70, power: 26, knock: 1.5, aura: 1, status: { s: 'confuse', dur: 1.2, chance: 0.4 } }], tags: ['cone', 'beat'] },
  { id: 'sweet_agnes', name: 'Sweet Agnes', elem: 'hydro', desc: 'Plays a sweet beach ballad for a friend: heals an ally 25% over 4 s and cleanses it.', cost: 18, cd: 11, aim: 'ally', range: 8, anim: 'cast', fx: 'heal', sfx: 'bio_heal',
    eff: [{ t: 'heal', who: 'target', k: 0.25, over: 4 }, { t: 'buff', s: 'cleanse' }], tags: ['heal'] },
  // ---- ultimates
  { id: 'seychelles', kind: 'ultimate', name: 'Seychelles', elem: 'hydro', desc: 'ULTIMATE: an island of sound rises from the sea — four tidal riffs crash on the target, each to the beat, the last one a breaker.', cost: 0, cd: 0, aim: 'target', range: 9, anim: 'roar', fx: 'ult_wave', sfx: 'ult_start', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'aoe', at: 'target', r: 2.2, power: 26, knock: 1.5, aura: 1.5, delay: 0.3, count: 4, interval: 0.4, lastMul: 1.8, status: { s: 'slow', dur: 2, k: 0.3 } }], tags: ['ult'] },
  { id: 'an_insatiable_high', kind: 'ultimate', name: 'An Insatiable High', elem: 'hydro', desc: 'ULTIMATE: the Captain steers a ghost-white flagship straight through the arena — the crew is shielded, then a full broadside of cannon-riffs rakes the line.', cost: 0, cd: 0, aim: 'dir', range: 12, anim: 'roar', fx: 'ult_wave', sfx: 'ult_start', telegraph: 'line', qte: { type: 'timing', n: 4 },
    eff: [{ t: 'buff', who: 'team', s: 'shield', k: 0.25, dur: 6 }, { t: 'line', range: 12, width: 2.4, power: 30, knock: 2, aura: 1.5, delay: 0.5, count: 3, interval: 0.35 }], tags: ['ult'] },
  { id: 'the_t_wave', kind: 'ultimate', name: 'T-Wave', elem: 'hydro', desc: 'ULTIMATE: it paddles out, catches a towering wave and rides it straight through the foes — then the whole wave breaks on top of them.', cost: 0, cd: 0, aim: 'dir', range: 9, anim: 'dodge', fx: 'ult_wave', sfx: 'ult_start', telegraph: 'line', qte: { type: 'mash', n: 14 },
    eff: [{ t: 'dash', dist: 9, speed: 22, power: 40, r: 1.6, knock: 3, aura: 1.5, iframe: true }, { t: 'aoe', at: 'self', r: 3.2, power: 50, knock: 4, up: 2, aura: 2, delay: 0.6 }], tags: ['ult'] },
  // ---- passives
  { id: 'aloha_spirit', kind: 'passive', name: 'Aloha Spirit', elem: 'hydro', desc: 'Island time, always: heals received +20% and +5% speed.', mods: { healMul: 1.2, spdMul: 1.05 } },
  { id: 'captains_log', kind: 'passive', name: "Captain's Log", elem: 'hydro', desc: 'Keeps a steady log: takes 12% less damage, and its shields are 25% stronger.', mods: { takenMul: 0.88, shieldMul: 1.25 } },
  { id: 'sea_legs', kind: 'passive', name: 'Sea Legs', elem: 'hydro', desc: 'Never loses its footing on a rolling deck: immune to knockback and slow.', mods: { knockImmune: true, immune: ['slow'] } },
  { id: 'stoked', kind: 'passive', name: 'Stoked', elem: 'hydro', desc: 'Totally stoked: dodge recharges 30% faster and +10% crit chance.', mods: { dodgeCd: 0.7, critChance: 0.1 } },
]);

export const MOVES = [...TALONAKA];
