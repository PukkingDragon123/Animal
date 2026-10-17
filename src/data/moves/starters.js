// Unique moves, passives and ultimates of the three starter lines. These are
// NOT shared with other Tokonmon (only vinyl discs teach shared skills).
// Format: see src/data/skills.js (effect primitives) and docs/GAMEPLAY.md.
// `line` marks the owning evolution line.

const L = (line, list) => list.map((s) => Object.assign({ line }, s));

// ===================================================================== Chilichick line (Pyro / Echo)
export const CHILICHICK = L('chilichick', [
  { id: 'pepper_peck', name: 'Pepper Peck', elem: 'pyro', desc: 'Two quick pecks with a pepper-hot beak. May burn.', cost: 8, cd: 1.6, aim: 'target', range: 2.6, anim: 'attack', fx: 'bite_fire', sfx: 'pyro', scale: 'phys', windup: 0.12, recover: 0.18,
    eff: [{ t: 'melee', power: 14, reach: 1.4, arc: 100, knock: 0.8, lunge: 1.6, count: 2, interval: 0.14, aura: 0.6, status: { s: 'burn', dur: 2, chance: 0.25, k: 0.2 } }], tags: ['melee'] },
  { id: 'hot_tears', name: 'Hot Tears', elem: 'hydro', desc: 'It cries so hard the tears hiss into a cloud of steam around it. Blinds and stings nearby foes.', cost: 15, cd: 7, aim: 'self', range: 0, anim: 'shake', fx: 'steam', sfx: 'sizzle', windup: 0.2,
    eff: [{ t: 'aoe', at: 'self', r: 2.2, power: 14, knock: 1.5, aura: 0.5 }, { t: 'zone', at: 'self', kind: 'steam', r: 2.2, dur: 2.5 }], tags: ['aoe'] },
  { id: 'fire_breath', name: 'Fire Breath', elem: 'pyro', desc: 'Bites the pepper, puffs its cheeks and breathes a roaring cone of fire.', cost: 20, cd: 6, aim: 'dir', range: 4.5, anim: 'roar', fx: 'fire_cone', sfx: 'pyro', windup: 0.3, telegraph: 'cone',
    eff: [{ t: 'cone', range: 4.5, arc: 50, power: 34, aura: 1.2, knock: 1.2, status: { s: 'burn', dur: 3, chance: 0.6, k: 0.25 } }], tags: ['cone'] },
  { id: 'flare_dash', name: 'Flare Dash', elem: 'pyro', desc: 'A blur of red feathers that leaves a strip of fire.', cost: 15, cd: 5, aim: 'dir', range: 6, anim: 'attack3', fx: 'fire_dash', sfx: 'whoosh', scale: 'phys', windup: 0.1,
    eff: [{ t: 'dash', dist: 6, speed: 20, power: 22, r: 0.9, knock: 2, aura: 1, iframe: true, trail: 'fire' }], tags: ['dash'] },
  { id: 'hiccup_fireball', name: 'Hiccup Fireball', elem: 'pyro', desc: 'Hic! A surprise fireball. Hold to swallow it and hiccup a bigger one.', cost: 12, cd: 3, aim: 'dir', range: 8, anim: 'shoot', fx: 'fireball', sfx: 'pyro', charge: { max: 1.0, mult: 2.0 },
    eff: [{ t: 'proj', power: 24, speed: 13, r: 0.35, aura: 1, grow: 1.5 }], tags: ['projectile', 'charge'] },
  { id: 'scorch_spin', name: 'Scorch Spin', elem: 'pyro', desc: 'Spins on one foot in a ring of flame.', cost: 20, cd: 7, aim: 'self', range: 0, anim: 'attack3', fx: 'fire_spin', sfx: 'pyro', scale: 'phys', windup: 0.15,
    eff: [{ t: 'aoe', at: 'self', r: 1.9, power: 30, knock: 3, aura: 1, destroy: true }], tags: ['aoe'] },
  { id: 'pepper_rush', name: 'Pepper Rush', elem: 'pyro', desc: 'Swallows a whole ghost pepper: +30% speed and burning blows for 6 s.', cost: 20, cd: 14, aim: 'self', range: 0, anim: 'roar', fx: 'buff_fire', sfx: 'sizzle',
    eff: [{ t: 'buff', s: 'spd', k: 0.3, dur: 6 }, { t: 'buff', s: 'kindle', k: 0.25, dur: 6, n: 5 }], tags: ['buff'] },
  // ---- Riffrooster (guitarist)
  { id: 'riff_combo', name: 'Riff Combo', elem: 'echo', desc: 'Down-stroke, up-stroke, POWER CHORD: three fast guitar slashes, the last one a fiery shockwave. Lands harder on the beat.', cost: 15, cd: 3, aim: 'target', range: 3, anim: 'attack2', fx: 'riff', sfx: 'guitar_riff', scale: 'phys', windup: 0.1, recover: 0.2, beat: true,
    eff: [{ t: 'melee', power: 16, reach: 1.7, arc: 110, knock: 0.8, lunge: 2, count: 2, interval: 0.16, aura: 0.6 }, { t: 'aoe', at: 'self', r: 2.0, power: 26, knock: 3, aura: 1, delay: 0.36 }], tags: ['melee', 'beat'] },
  { id: 'scary_fire', name: 'Scary Fire', elem: 'pyro', desc: 'Dark-cored black-and-red flames that drip instead of rise. Burns and weakens.', cost: 25, cd: 8, aim: 'dir', range: 5, anim: 'roar', fx: 'scary_fire', sfx: 'pyro_boom', windup: 0.35, telegraph: 'cone',
    eff: [{ t: 'cone', range: 5, arc: 60, power: 40, aura: 1.5, knock: 1.5, status: { s: 'burn', dur: 4, k: 0.35 } }, { t: 'status', who: 'aoe', r: 5, s: 'weaken', dur: 4, k: 0.2 }], tags: ['cone', 'scary'] },
  { id: 'power_chord', name: 'Power Chord', elem: 'echo', desc: 'Knee-slide and strike one huge chord. The shockwave rings out in three waves.', cost: 25, cd: 9, aim: 'self', range: 0, anim: 'attack3', fx: 'soundwave', sfx: 'guitar_riff', windup: 0.3, telegraph: 'circle', beat: true,
    eff: [{ t: 'aoe', at: 'self', r: 2.6, power: 22, knock: 2, aura: 1, count: 3, interval: 0.22, lastMul: 1.6 }], tags: ['aoe', 'beat'] },
  { id: 'stage_dive', name: 'Stage Dive', elem: 'pyro', desc: 'Leaps into the crowd of foes and lands in a burst of flame.', cost: 20, cd: 8, aim: 'point', range: 7, anim: 'attack3', fx: 'meteor', sfx: 'pyro_boom', windup: 0.15, telegraph: 'circle',
    eff: [{ t: 'dash', leap: true }, { t: 'aoe', r: 2.0, power: 34, knock: 3, up: 3, aura: 1.2, delay: 0.3 }], tags: ['dash', 'aoe'] },
  { id: 'feedback_howl', name: 'Feedback Howl', elem: 'echo', desc: 'Holds the guitar to the amp — screeching feedback that confuses and singes.', cost: 20, cd: 10, aim: 'self', range: 0, anim: 'headbang', fx: 'screech', sfx: 'screech', windup: 0.25,
    eff: [{ t: 'aoe', at: 'self', r: 3.2, power: 16, knock: 2, status: { s: 'confuse', dur: 2.2 } }], tags: ['aoe'] },
  { id: 'black_flame_encore', kind: 'ultimate', name: 'Black Flame Encore', elem: 'pyro', desc: 'ULTIMATE: a scary-fire guitar solo — a tornado of black flame and three power chords that land on the downbeat.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'roar', fx: 'ult_inferno', sfx: 'pyro_boom', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'pull', range: 6, k: 2.5 }, { t: 'aoe', at: 'self', r: 3.6, power: 48, knock: 2, aura: 2, count: 3, interval: 0.5, lastMul: 1.8, status: { s: 'burn', dur: 5, k: 0.4 } }], tags: ['ult'] },
  // ---- Funkadoodle (bassist)
  { id: 'thumb_slap', name: 'Thumb Slap', elem: 'echo', desc: 'SLAP! The bass thumps the floor and fire rings roll out along the ground.', cost: 18, cd: 5, aim: 'self', range: 0, anim: 'stomp', fx: 'slap_ring', sfx: 'slap_bass', windup: 0.2, telegraph: 'circle', beat: true,
    eff: [{ t: 'aoe', at: 'self', r: 2.4, power: 18, knock: 1.5, up: 2, aura: 0.8, count: 3, interval: 0.12 }], tags: ['aoe', 'beat'] },
  { id: 'finger_pop', name: 'Finger Pop', elem: 'pyro', desc: 'POP! A pillar of fire erupts under the target.', cost: 18, cd: 4, aim: 'target', range: 7, anim: 'cast', fx: 'fire_pillar', sfx: 'pyro_boom', windup: 0.25, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'target', r: 1.3, power: 34, knock: 1, up: 6, aura: 1.2, delay: 0.25 }], tags: ['aoe'] },
  { id: 'groove_step', name: 'Groove Step', elem: 'echo', desc: 'Slides into the groove: a quick dash and +25% speed for 5 s.', cost: 12, cd: 6, aim: 'dir', range: 5, anim: 'dodge', fx: 'surf', sfx: 'whoosh', windup: 0.05,
    eff: [{ t: 'dash', dist: 4, speed: 18, power: 12, r: 0.8, knock: 1, iframe: true }, { t: 'buff', s: 'spd', k: 0.25, dur: 5 }], tags: ['dash', 'buff'] },
  { id: 'bass_line', name: 'Bass Line', elem: 'echo', desc: 'A low walking bass line rumbles along the floor in a straight line.', cost: 20, cd: 7, aim: 'dir', range: 8, anim: 'attack2', fx: 'spikes', sfx: 'slap_bass', windup: 0.3, telegraph: 'line', beat: true,
    eff: [{ t: 'line', range: 8, width: 1.6, power: 30, knock: 2, up: 2, aura: 1, delay: 0.2 }], tags: ['line', 'beat'] },
  { id: 'funk_out', name: 'Funk Out', elem: 'echo', desc: 'Lays down a groove zone: foes inside slow down, allies heal a little.', cost: 25, cd: 12, aim: 'point', range: 7, anim: 'headbang', fx: 'bassdrop', sfx: 'slap_bass', windup: 0.3,
    eff: [{ t: 'zone', kind: 'groove', r: 2.4, dur: 6, tick: { heal: 0.03, power: 6, status: { s: 'slow', dur: 0.6, k: 0.35 } } }], tags: ['zone'] },
  { id: 'slap_happy_finale', kind: 'ultimate', name: 'Slap-Happy Finale', elem: 'pyro', desc: 'ULTIMATE: a slap-bass solo — every beat sends a fire ring across the arena, the last one a towering pillar.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'headbang', fx: 'ult_encore', sfx: 'slap_bass', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'aoe', at: 'self', r: 4.2, power: 30, knock: 2, up: 3, aura: 1.5, count: 4, interval: 0.5, lastMul: 2.0 }], tags: ['ult'] },
  // ---- shared by the line
  { id: 'ghost_pepper_meltdown', kind: 'ultimate', name: 'Ghost Pepper Meltdown', elem: 'pyro', desc: 'ULTIMATE: eats the hottest pepper in Osaka and erupts — a sweeping inferno breath, tears turning to a steam geyser.', cost: 0, cd: 0, aim: 'dir', range: 6, anim: 'roar', fx: 'ult_inferno', sfx: 'pyro_boom', telegraph: 'cone', qte: { type: 'mash', n: 10 },
    eff: [{ t: 'cone', range: 6, arc: 80, power: 70, aura: 2, knock: 3, status: { s: 'burn', dur: 5, k: 0.4 } }, { t: 'zone', at: 'self', kind: 'steam', r: 3, dur: 3 }], tags: ['ult'] },
  // ---- passives
  { id: 'heat_tolerance', kind: 'passive', name: 'Heat Tolerance', elem: 'pyro', desc: 'Survived the Super Spicy Curry. Immune to burns; Heat builds 25% faster.', mods: { immune: ['burn'], heatGain: 1.25 } },
  { id: 'crybaby_steam', kind: 'passive', name: 'Crybaby Steam', elem: 'pyro', desc: 'Below 40% HP its tears turn to scalding steam: +20% damage and attackers get burned.', when: { lowHp: 0.4 }, mods: { dmgMul: 1.2, emberSkin: 0.12 } },
  { id: 'quick_beak', kind: 'passive', name: 'Quick Beak', elem: 'pyro', desc: '+8% critical-hit chance.', mods: { critChance: 0.08 } },
  { id: 'stage_presence', kind: 'passive', name: 'Stage Presence', elem: 'echo', desc: 'After 10 s bonded it owns the stage: +20% damage and a wider beat window.', when: { bondT: 10 }, mods: { dmgMul: 1.2, beatWindow: 0.15 } },
  { id: 'slap_echo', kind: 'passive', name: 'Slap Echo', elem: 'echo', desc: '25% chance for hits to echo a second time for 40%.', mods: { reverb: 0.25 } },
]);

// ===================================================================== Bubblion line (Hydro)
export const BUBBLION = L('bubblion', [
  { id: 'water_bullet', name: 'Water Bullet', elem: 'hydro', desc: 'A precise, fast water bullet. Hit the centre of the target for a crit. Hold to charge a spiralling round.', cost: 8, cd: 1.8, aim: 'dir', range: 11, anim: 'shoot', fx: 'water_bolt', sfx: 'hydro', charge: { max: 1.0, mult: 2.1 },
    eff: [{ t: 'proj', power: 20, speed: 20, r: 0.25, aura: 1, crit: 'center', grow: 1.3 }], tags: ['projectile', 'charge'] },
  { id: 'bubble_shield', name: 'Bubble Shield', elem: 'hydro', desc: 'Puffs a soft, wobbly bubble around itself that soaks up damage.', cost: 18, cd: 10, aim: 'self', range: 0, anim: 'cast', fx: 'shield', sfx: 'bubble_pop',
    eff: [{ t: 'buff', s: 'shield', k: 0.28, dur: 7 }], tags: ['buff', 'shield'] },
  { id: 'soft_bubble', name: 'Soft Bubble', elem: 'hydro', desc: 'A drifting bubble that swallows the first foe it touches and floats them helplessly.', cost: 20, cd: 9, aim: 'point', range: 8, anim: 'cast', fx: 'bubble', sfx: 'bubble_pop', windup: 0.25,
    eff: [{ t: 'summon', kind: 'trap', r: 0.9, dur: 8, power: 10, aura: 1, status: { s: 'stun', dur: 1.6 } }], tags: ['trap'] },
  { id: 'bubble_barrage', name: 'Bubble Barrage', elem: 'hydro', desc: 'Five bubble bullets in a fan.', cost: 20, cd: 6, aim: 'dir', range: 9, anim: 'shoot', fx: 'water_bolt', sfx: 'hydro', windup: 0.2,
    eff: [{ t: 'proj', count: 5, spread: 40, power: 12, speed: 15, r: 0.25, aura: 0.6 }], tags: ['projectile'] },
  { id: 'crown_glint', name: 'Crown Glint', elem: 'hydro', desc: 'The crown catches the light: the next 3 shots are guaranteed precision crits.', cost: 15, cd: 12, aim: 'self', range: 0, anim: 'cast', fx: 'buff_water', sfx: 'shimmer',
    eff: [{ t: 'buff', s: 'focus', k: 1, dur: 8, n: 3 }], tags: ['buff'] },
  { id: 'spin_bullet', name: 'Spin Bullet', elem: 'hydro', desc: 'A spinning bullet that pierces and ricochets off walls.', cost: 18, cd: 5, aim: 'dir', range: 12, anim: 'shoot', fx: 'water_lance', sfx: 'hydro', windup: 0.25, telegraph: 'line',
    eff: [{ t: 'proj', power: 26, speed: 22, r: 0.3, aura: 1, pierce: true, bounce: 2 }], tags: ['projectile'] },
  { id: 'splash_hop', name: 'Splash Hop', elem: 'hydro', desc: 'Bounces away in its water ball, leaving a wet puddle.', cost: 10, cd: 5, aim: 'dir', range: 4, anim: 'dodge', fx: 'water_dash', sfx: 'splash', windup: 0.05,
    eff: [{ t: 'dash', dist: 4, speed: 16, power: 8, r: 0.8, knock: 1.5, iframe: true }, { t: 'zone', at: 'self', kind: 'wet', r: 1.6, dur: 4 }], tags: ['dash'] },
  // ---- Princeidon (king)
  { id: 'trident_lance', name: 'Trident Lance', elem: 'hydro', desc: 'Three water lances from the trident; they pierce.', cost: 20, cd: 5, aim: 'dir', range: 11, anim: 'shoot', fx: 'water_lance', sfx: 'hydro', windup: 0.3, telegraph: 'line',
    eff: [{ t: 'proj', count: 3, spread: 18, power: 24, speed: 20, r: 0.3, aura: 1, pierce: true }], tags: ['projectile'] },
  { id: 'tsunami_wave', name: 'Tsunami Wave', elem: 'hydro', desc: 'Raises a curling wave and sends it across the arena.', cost: 30, cd: 10, aim: 'dir', range: 10, anim: 'cast', fx: 'ult_wave', sfx: 'splash', windup: 0.5, telegraph: 'line',
    eff: [{ t: 'line', range: 10, width: 3.2, power: 44, knock: 5, aura: 2, delay: 0.3 }], tags: ['line'] },
  { id: 'bubble_armor', name: 'Bubble Armor', elem: 'hydro', desc: 'Plates of bubble armour form over the body: a big shield and +20% defense.', cost: 25, cd: 14, aim: 'self', range: 0, anim: 'flex', fx: 'shield', sfx: 'bubble_pop',
    eff: [{ t: 'buff', s: 'shield', k: 0.4, dur: 9 }, { t: 'buff', s: 'def', k: 0.2, dur: 9 }], tags: ['buff', 'shield'] },
  { id: 'royal_decree', name: 'Royal Decree', elem: 'hydro', desc: 'The king points his trident: nearby foes are marked and take +20% damage.', cost: 15, cd: 12, aim: 'self', range: 0, anim: 'cast', fx: 'sonar', sfx: 'shimmer',
    eff: [{ t: 'mark', r: 7, dur: 6, k: 0.2 }], tags: ['mark'] },
  { id: 'maelstrom_crown', name: 'Maelstrom Crown', elem: 'hydro', desc: 'A whirlpool crowned with foam drags foes in.', cost: 25, cd: 11, aim: 'point', range: 8, anim: 'cast', fx: 'whirlpool', sfx: 'splash', windup: 0.35, telegraph: 'circle',
    eff: [{ t: 'zone', kind: 'whirlpool', r: 2.4, dur: 4, pull: 2.2, tick: { power: 8, aura: 1 } }], tags: ['zone'] },
  { id: 'royal_tsunami', kind: 'ultimate', name: 'Royal Tsunami', elem: 'hydro', desc: 'ULTIMATE: the king rises on a giant curling wave in full bubble armour and brings it crashing down on the whole arena.', cost: 0, cd: 0, aim: 'dir', range: 12, anim: 'roar', fx: 'ult_wave', sfx: 'splash', telegraph: 'line', qte: { type: 'timing', n: 3 },
    eff: [{ t: 'buff', s: 'shield', k: 0.3, dur: 6 }, { t: 'line', range: 12, width: 5, power: 80, knock: 6, up: 3, aura: 2, delay: 0.4 }], tags: ['ult'] },
  // ---- Purple Rain (queen)
  { id: 'purple_rain', name: 'Purple Rain', elem: 'hydro', desc: 'Summons violet clouds: purple rain soaks and stings foes below and gently heals allies.', cost: 25, cd: 9, aim: 'point', range: 9, anim: 'cast', fx: 'rain', sfx: 'rain', windup: 0.4, telegraph: 'circle', beat: true,
    eff: [{ t: 'zone', kind: 'rain', r: 2.6, dur: 6, tick: { power: 9, aura: 1, heal: 0.025 } }], tags: ['zone'] },
  { id: 'dress_twirl', name: 'Dress Twirl', elem: 'hydro', desc: 'A royal twirl: the ruffled gown flares, knocking foes back, and wraps her in bubbles.', cost: 18, cd: 7, aim: 'self', range: 0, anim: 'spin', fx: 'water_spin', sfx: 'splash', windup: 0.15,
    eff: [{ t: 'aoe', at: 'self', r: 2.2, power: 22, knock: 4, aura: 1 }, { t: 'buff', s: 'shield', k: 0.15, dur: 5 }], tags: ['aoe'] },
  { id: 'parasol_parry', name: 'Parasol Parry', elem: 'hydro', desc: 'Opens the fin parasol: blocks attacks from the front and counters.', cost: 12, cd: 8, aim: 'self', range: 0, anim: 'parry', fx: 'guard', sfx: 'parry',
    eff: [{ t: 'buff', s: 'guard', k: 0.7, dur: 3, counter: 18 }], tags: ['guard'] },
  { id: 'queens_bubble', name: "Queen's Bubble", elem: 'hydro', desc: 'Wraps an ally in a royal bubble: shield and a gentle heal over time.', cost: 20, cd: 10, aim: 'ally', range: 8, anim: 'cast', fx: 'heal', sfx: 'bubble_pop',
    eff: [{ t: 'heal', who: 'target', k: 0.18, over: 5 }, { t: 'buff', s: 'shield', k: 0.15, dur: 6 }], tags: ['heal'] },
  { id: 'purple_reign', kind: 'ultimate', name: 'Purple Reign', elem: 'hydro', desc: 'ULTIMATE: the sky turns violet and a royal storm pours over the whole arena — foes drown, allies are restored.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'cast', fx: 'ult_storm', sfx: 'rain', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'heal', who: 'team', k: 0.3 }, { t: 'aoe', at: 'self', r: 6, power: 30, knock: 1, aura: 2, count: 4, interval: 0.5, status: { s: 'slow', dur: 2, k: 0.4 } }], tags: ['ult'] },
  { id: 'soft_and_wet', kind: 'ultimate', name: 'Soft & Wet Barrage', elem: 'hydro', desc: 'ULTIMATE: a storm of spinning bubbles that steal the shine from everything they pop on.', cost: 0, cd: 0, aim: 'dir', range: 10, anim: 'shoot', fx: 'ult_snipe', sfx: 'bubble_pop', telegraph: 'line', qte: { type: 'timing', n: 3 },
    eff: [{ t: 'proj', count: 9, spread: 50, power: 22, speed: 14, r: 0.35, aura: 1, burst: 0.08, status: { s: 'weaken', dur: 3, k: 0.2 } }], tags: ['ult'] },
  // ---- passives
  { id: 'bouncy_ball', kind: 'passive', name: 'Bouncy Ball', elem: 'hydro', desc: 'Its soft water ball shrugs off knockback.', mods: { knockImmune: true } },
  { id: 'deep_focus', kind: 'passive', name: 'Deep Focus', elem: 'hydro', desc: 'Precision crits deal +40% more damage.', mods: { critDmg: 0.4 } },
  { id: 'regal_poise', kind: 'passive', name: 'Regal Poise', elem: 'hydro', desc: 'Above 70% HP: +15% elemental damage.', when: { highHp: 0.7 }, mods: { elmMul: 1.15 } },
  { id: 'tidal_soul', kind: 'passive', name: 'Tidal Soul', elem: 'hydro', desc: 'Bonded for 15 s: the ultimate charges 30% faster.', when: { bondT: 15 }, mods: { ultGain: 1.3 } },
]);

// ===================================================================== Strawbaa line (Bio / Geo)
export const STRAWBAA = L('strawbaa', [
  { id: 'woolly_ram', name: 'Woolly Ram', elem: 'bio', desc: 'Scrapes a hoof, lowers its head and rams. Surprisingly heavy for something so fluffy.', cost: 12, cd: 4, aim: 'dir', range: 5, anim: 'attack3', fx: 'charge_dash', sfx: 'thud', scale: 'phys', windup: 0.25, telegraph: 'line',
    eff: [{ t: 'dash', dist: 5, speed: 14, power: 26, r: 0.9, knock: 4 }], tags: ['dash'] },
  { id: 'strawberry_vines', name: 'Strawberry Vines', elem: 'bio', desc: 'Plants a patch of strawberry vines: ripe berries heal allies who stand in it, thorny tendrils lash and root foes.', cost: 20, cd: 8, aim: 'point', range: 7, anim: 'cast', fx: 'vine', sfx: 'petal', windup: 0.3,
    eff: [{ t: 'zone', kind: 'vines', r: 2.0, dur: 8, tick: { heal: 0.035, power: 7, aura: 0.5, status: { s: 'root', dur: 0.5 } } }], tags: ['zone', 'heal'] },
  { id: 'berry_toss', name: 'Berry Toss', elem: 'bio', desc: 'Lobs a ripe strawberry to an ally — it heals on the spot.', cost: 12, cd: 5, aim: 'ally', range: 8, anim: 'shoot', fx: 'heal', sfx: 'petal',
    eff: [{ t: 'heal', who: 'target', k: 0.16 }], tags: ['heal'] },
  { id: 'fluff_up', name: 'Fluff Up', elem: 'bio', desc: 'Puffs up its wool: a shield and +20% defense.', cost: 15, cd: 10, aim: 'self', range: 0, anim: 'flex', fx: 'shield', sfx: 'petal',
    eff: [{ t: 'buff', s: 'shield', k: 0.22, dur: 7 }, { t: 'buff', s: 'def', k: 0.2, dur: 7 }], tags: ['buff', 'shield'] },
  { id: 'runner_patch', name: 'Runner Patch', elem: 'bio', desc: 'Strawberry runners spread around it: allies nearby regenerate, foes get tangled.', cost: 20, cd: 10, aim: 'self', range: 0, anim: 'stomp', fx: 'spores', sfx: 'petal', windup: 0.2,
    eff: [{ t: 'zone', at: 'self', kind: 'vines', r: 2.8, dur: 6, tick: { heal: 0.025, power: 5, status: { s: 'slow', dur: 0.6, k: 0.3 } } }], tags: ['zone', 'heal'] },
  { id: 'sweet_lullaby', name: 'Sweet Lullaby', elem: 'bio', desc: 'A soft baa-lullaby; strawberry-scented pollen makes foes drowsy.', cost: 20, cd: 10, aim: 'point', range: 7, anim: 'cast', fx: 'pollen', sfx: 'petal', windup: 0.3, telegraph: 'circle',
    eff: [{ t: 'zone', kind: 'pollen', r: 2.2, dur: 4, tick: { status: { s: 'drowsy', dur: 0.4 } } }], tags: ['zone'] },
  // ---- Ramberry (giant ram)
  { id: 'horn_charge', name: 'Horn Charge', elem: 'geo', desc: 'The giant ram lowers its colossal horns and charges, leaving a scar in the ground. Stuns on impact.', cost: 20, cd: 6, aim: 'dir', range: 7, anim: 'attack3', fx: 'charge_dash', sfx: 'thud', scale: 'phys', windup: 0.35, telegraph: 'line',
    eff: [{ t: 'dash', dist: 7, speed: 15, power: 40, r: 1.2, knock: 6 }, { t: 'status', who: 'aoe', r: 1.6, s: 'stun', dur: 0.8 }], tags: ['dash'] },
  { id: 'bramble_wall', name: 'Bramble Wall', elem: 'bio', desc: 'A wall of thorny strawberry brambles bursts out of the ground.', cost: 18, cd: 10, aim: 'point', range: 6, anim: 'slam', fx: 'wall', sfx: 'thud',
    eff: [{ t: 'wall', len: 4, hp: 90, dur: 8 }], tags: ['wall'] },
  { id: 'quake_stomp', name: 'Quake Stomp', elem: 'geo', desc: 'Rears up and stomps: the ground cracks around it and foes are stunned.', cost: 22, cd: 9, aim: 'self', range: 0, anim: 'stomp', fx: 'stomp', sfx: 'thud', scale: 'phys', windup: 0.4, telegraph: 'circle',
    eff: [{ t: 'aoe', at: 'self', r: 2.6, power: 32, knock: 2, up: 2, status: { s: 'stun', dur: 1.0 }, crack: true }], tags: ['aoe'] },
  { id: 'fields_forever', name: 'Fields Forever', elem: 'bio', desc: 'A wide strawberry field grows around it: big healing for allies, roots for foes.', cost: 30, cd: 14, aim: 'self', range: 0, anim: 'cast', fx: 'ult_sakura', sfx: 'petal', windup: 0.4,
    eff: [{ t: 'zone', at: 'self', kind: 'vines', r: 3.4, dur: 7, tick: { heal: 0.04, power: 8, status: { s: 'root', dur: 0.5 } } }], tags: ['zone', 'heal'] },
  { id: 'stampede_forever', kind: 'ultimate', name: 'Strawberry Stampede', elem: 'geo', desc: 'ULTIMATE: horns at full size, it charges back and forth across the arena, vines sprouting in its wake.', cost: 0, cd: 0, aim: 'dir', range: 9, anim: 'attack3', fx: 'charge_dash', sfx: 'thud', telegraph: 'line', qte: { type: 'mash', n: 12 },
    eff: [{ t: 'dash', dist: 9, speed: 18, power: 70, r: 1.5, knock: 7, iframe: true }, { t: 'zone', at: 'self', kind: 'vines', r: 3, dur: 6, tick: { heal: 0.04, power: 8, status: { s: 'root', dur: 0.5 } } }], tags: ['ult'] },
  // ---- Pennyewe (nurse ewe)
  { id: 'poppy_aura', name: 'Poppy Aura', elem: 'bio', desc: 'Twelve poppies bloom around her in a ring; healing pulses on every beat.', cost: 25, cd: 10, aim: 'self', range: 0, anim: 'cast', fx: 'petal_storm', sfx: 'petal', windup: 0.3, beat: true,
    eff: [{ t: 'zone', at: 'self', kind: 'poppies', r: 2.6, dur: 7, tick: { heal: 0.045 } }], tags: ['zone', 'heal'] },
  { id: 'poppy_toss', name: 'Poppy Toss', elem: 'bio', desc: 'Plucks a poppy from her tray and tosses it — it heals an ally or stings a foe.', cost: 10, cd: 2.5, aim: 'dir', range: 9, anim: 'shoot', fx: 'seed', sfx: 'petal',
    eff: [{ t: 'proj', power: 18, speed: 14, r: 0.3, aura: 1, status: { s: 'drowsy', dur: 0.4 } }], tags: ['projectile'] },
  { id: 'nurse_call', name: 'Nurse Call', elem: 'bio', desc: 'Rings her little bell: heals the whole team and cures their ailments.', cost: 30, cd: 14, aim: 'self', range: 0, anim: 'cast', fx: 'heal', sfx: 'bio_heal',
    eff: [{ t: 'heal', who: 'team', k: 0.2 }, { t: 'buff', who: 'team', s: 'cleanse' }], tags: ['heal'] },
  { id: 'barber_spin', name: 'Barber Spin', elem: 'bio', desc: 'Spins like a striped barber pole, scattering petals that knock foes back.', cost: 15, cd: 6, aim: 'self', range: 0, anim: 'spin', fx: 'petal_storm', sfx: 'petal', windup: 0.1,
    eff: [{ t: 'aoe', at: 'self', r: 2.0, power: 20, knock: 3.5, aura: 1 }], tags: ['aoe'] },
  { id: 'field_of_poppies', kind: 'ultimate', name: 'Field of Poppies', elem: 'bio', desc: 'ULTIMATE: the whole arena blooms red — allies are fully restored over time, foes fall asleep among the flowers.', cost: 0, cd: 0, aim: 'self', range: 0, anim: 'cast', fx: 'ult_sakura', sfx: 'bio_heal', telegraph: 'circle', qte: { type: 'rhythm', beats: 4 },
    eff: [{ t: 'heal', who: 'team', k: 0.35 }, { t: 'heal', who: 'team', k: 0.3, over: 6 }, { t: 'status', who: 'aoe', r: 7, s: 'sleep', dur: 2.5 }], tags: ['ult'] },
  // ---- shared by the line
  { id: 'baa_ram_ewe', kind: 'ultimate', name: 'Baa-Ram-Ewe Rush', elem: 'bio', desc: 'ULTIMATE: horns blazing pink, it rams through every foe and leaves a field of strawberries behind.', cost: 0, cd: 0, aim: 'dir', range: 8, anim: 'attack3', fx: 'charge_dash', sfx: 'thud', telegraph: 'line', qte: { type: 'mash', n: 10 },
    eff: [{ t: 'dash', dist: 8, speed: 16, power: 55, r: 1.3, knock: 6, iframe: true }, { t: 'heal', who: 'team', k: 0.2 }], tags: ['ult'] },
  // ---- passives
  { id: 'thick_wool', kind: 'passive', name: 'Thick Wool', elem: 'bio', desc: 'So much wool: takes 12% less damage.', mods: { takenMul: 0.88 } },
  { id: 'sweet_scent', kind: 'passive', name: 'Sweet Scent', elem: 'bio', desc: 'Smells like fresh strawberries: regenerates 0.8% HP per second.', mods: { regen: 0.008 } },
  { id: 'berry_bountiful', kind: 'passive', name: 'Berry Bountiful', elem: 'bio', desc: 'Heals are 30% stronger.', mods: { healMul: 1.3 } },
  { id: 'rams_resolve', kind: 'passive', name: "Ram's Resolve", elem: 'geo', desc: 'Below 40% HP: +35% defense and immune to knockback.', when: { lowHp: 0.4 }, mods: { defMul: 1.35, knockImmune: true } },
]);

export const MOVES = [...CHILICHICK, ...BUBBLION, ...STRAWBAA];
