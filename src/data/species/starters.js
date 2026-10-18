// The three starter lines — gameplay data (designs: src/data/designs/starters.js).
// Format: docs/GAMEPLAY.md. Stats B(DMG, ELM, DEF, SPD, HP) at level 1.
// Unlock conditions (`how`) are evaluated by src/data/progress.js.
const B = (dmg, elm, def, spd, hp) => ({ dmg, elm, def, spd, hp });

// Bond gimmicks (owner: "a special gimmick like expanding horns, bubbles, fur, etc.")
const BLAZING_CREST = { id: 'blazing_crest', name: 'Blazing Crest', desc: 'Its comb erupts into a crest of fire: +15% speed, +10% physical damage and every hit can burn.', mods: { burnOnHit: 0.3, spdMul: 1.15, physMul: 1.1 } };
const BUBBLES = { id: 'bubbles', name: 'Bubbles', desc: 'A stream of bubbles wraps it in soft armour: a bubble shield that keeps regrowing, +10% crit chance.', shield: 0.22, mods: { shieldRegen: 0.015, critChance: 0.1 } };
const HORNS = { id: 'expanding_horns', name: 'Expanding Horns', desc: 'Its horns grow huge and its wool puffs up: +35% ram damage, +20% defense, heals 10% on bonding.', heal: 0.1, mods: { physMul: 1.35, defMul: 1.2 } };

export const SPECIES = {
  // ------------------------------------------------------------------ Chilichick → Riffrooster / Funkadoodle
  chilichick: {
    name: 'Chilichick', elem: 'pyro', family: 'Bird', stage: 1, line: 'chilichick', role: 'Close-range striker — fast attacks, fast movement',
    base: B(9, 7, 4, 9, 5), radius: 0.4,
    basic: { type: 'melee', power: 9, range: 1.4, rate: 0.5 },
    start: ['pepper_peck', 'hot_tears'],
    moves: [
      { id: 'fire_breath', how: { eat: { tag: 'spicy', n: 5 } }, hint: 'Feed it lots of spicy food.' },
      { id: 'flare_dash', how: { level: 7 }, hint: 'Reach Lv.7.' },
      { id: 'hiccup_fireball', how: { battle: { ev: 'crit', n: 8 } }, hint: 'Land 8 critical hits.' },
      { id: 'scorch_spin', how: { battle: { ev: 'burned', n: 3 } }, hint: 'Get burned 3 times in battle.' },
      { id: 'pepper_rush', how: { eat: { food: 'ghost_pepper_kushikatsu', n: 1 } }, hint: 'Something in Shinsekai is hotter than ghosts.' },
    ],
    passives: [
      { id: 'heat_tolerance', how: { eat: { food: 'super_spicy_curry', n: 1 } }, hint: 'Take it to eat Super Spicy Curry.' },
      { id: 'crybaby_steam', how: { battle: { ev: 'low_hp_win', n: 1 } }, hint: 'Win a battle while crying below 40% HP.' },
      { id: 'quick_beak', how: { uses: { skill: 'pepper_peck', n: 40 } }, hint: 'Use Pepper Peck 40 times.' },
      { id: 'comeback_punch', how: { battle: { ev: 'switch_in', n: 10 } }, hint: 'Switch it back into battle 10 times.' },
    ],
    ult: 'ghost_pepper_meltdown', ultHow: { battle: { ev: 'bond_secs', n: 60 } }, ultHint: 'Stay bonded for 60 s in total.',
    gimmick: BLAZING_CREST,
    evolve: [
      { to: 'riffrooster', cond: { level: 16, wins: 8 }, hint: 'Win 8 battles and reach Lv.16 — it starts strumming everything.' },
      { to: 'funkadoodle', cond: { level: 16, beats: 40 }, hint: 'Land 40 on-beat hits and reach Lv.16 — it gets the groove.' },
    ],
    temper: 'curious', catch: 0, bond: 90, exp: 64, personality: 'Brave, loud and permanently teary. Eats peppers it knows are too hot, every single time.',
  },
  riffrooster: {
    name: 'Riffrooster', elem: ['pyro', 'echo'], family: 'Bird', stage: 2, line: 'chilichick', role: 'Close-range shredder — fast slashes, fast movement, scary fire',
    base: B(16, 12, 7, 15, 9), radius: 0.62,
    basic: { type: 'melee', power: 15, range: 1.8, rate: 0.48 },
    start: ['riff_combo', 'scary_fire'],
    moves: [
      { id: 'power_chord', how: { battle: { ev: 'on_beat', n: 30 } }, hint: 'Land 30 on-beat hits.' },
      { id: 'stage_dive', how: { level: 22 }, hint: 'Reach Lv.22.' },
      { id: 'feedback_howl', how: { activity: { id: 'karaoke', n: 2 } }, hint: 'Take it to the arcade rhythm cabinets twice.' },
    ],
    passives: [
      { id: 'stage_presence', how: { battle: { ev: 'stadium_win', n: 3 } }, hint: 'Win 3 stadium matches.' },
      { id: 'heat_tolerance', how: { eat: { food: 'super_spicy_curry', n: 1 } }, hint: 'Take it to eat Super Spicy Curry.' },
    ],
    ult: 'black_flame_encore', ultHow: { battle: { ev: 'bond_secs', n: 90 } }, ultHint: 'Stay bonded for 90 s in total.',
    gimmick: Object.assign({}, BLAZING_CREST, { desc: 'A crest of black-cored fire: +20% speed, +15% physical damage, burning hits, wider beat window.', mods: { burnOnHit: 0.4, spdMul: 1.2, physMul: 1.15, beatWindow: 0.14 } }),
    evolve: [], temper: 'territorial', catch: 0, bond: 90, exp: 200, personality: 'A front-man. Tears dried into war paint; plays every fight like a sold-out show.',
  },
  funkadoodle: {
    name: 'Funkadoodle', elem: ['pyro', 'echo'], family: 'Bird', stage: 2, line: 'chilichick', role: 'Close-range groove brawler — slap-bass fire shockwaves',
    base: B(14, 14, 8, 13, 10), radius: 0.6,
    basic: { type: 'melee', power: 13, range: 1.7, rate: 0.52 },
    start: ['thumb_slap', 'finger_pop'],
    moves: [
      { id: 'groove_step', how: { battle: { ev: 'emote', n: 10 } }, hint: 'Dance, taunt or show off 10 times in battle.' },
      { id: 'bass_line', how: { level: 22 }, hint: 'Reach Lv.22.' },
      { id: 'funk_out', how: { explore: 'kansai_calling' }, hint: 'Visit the record shop together.' },
    ],
    passives: [
      { id: 'slap_echo', how: { uses: { skill: 'thumb_slap', n: 30 } }, hint: 'Use Thumb Slap 30 times.' },
      { id: 'heat_tolerance', how: { eat: { food: 'super_spicy_curry', n: 1 } }, hint: 'Take it to eat Super Spicy Curry.' },
    ],
    ult: 'slap_happy_finale', ultHow: { battle: { ev: 'bond_secs', n: 90 } }, ultHint: 'Stay bonded for 90 s in total.',
    gimmick: Object.assign({}, BLAZING_CREST, { name: 'Groove Crest', desc: 'Its mohawk blazes red-to-lime: burning hits, on-beat hits +45% and a wider beat window.', mods: { burnOnHit: 0.3, beatMul: 1.45, beatWindow: 0.16, spdMul: 1.15 } }),
    evolve: [], temper: 'curious', catch: 0, bond: 90, exp: 200, personality: 'Never stops moving. Slaps the bass when it is happy, sad, hungry or asleep.',
  },
  // ------------------------------------------------------------------ Bubblion → Princeidon / Purple Rain
  bubblion: {
    name: 'Bubblion', elem: 'hydro', family: 'Aquatic', stage: 1, line: 'bubblion', role: 'Long-range sharpshooter — slow, water bullets',
    base: B(5, 9, 6, 3, 7), radius: 0.42,
    basic: { type: 'ranged', power: 8, range: 8, rate: 0.75, speed: 17 },
    start: ['water_bullet', 'bubble_shield'],
    moves: [
      { id: 'soft_bubble', how: { level: 7 }, hint: 'Reach Lv.7.' },
      { id: 'bubble_barrage', how: { uses: { skill: 'water_bullet', n: 30 } }, hint: 'Fire 30 Water Bullets.' },
      { id: 'crown_glint', how: { battle: { ev: 'crit', n: 10 } }, hint: 'Land 10 precision crits.' },
      { id: 'spin_bullet', how: { explore: 'minoh_waterfall' }, hint: 'Watch the Minoh waterfall together.' },
      { id: 'splash_hop', how: { battle: { ev: 'drowned', n: 5 } }, hint: 'Soak foes until they nearly drown — 5 times.' },
    ],
    passives: [
      { id: 'bouncy_ball', how: { battle: { ev: 'perfect_dodge', n: 5 } }, hint: 'Perfectly dodge 5 attacks.' },
      { id: 'deep_focus', how: { uses: { skill: 'water_bullet', n: 60 } }, hint: 'Fire 60 Water Bullets.' },
      { id: 'comeback_punch', how: { battle: { ev: 'switch_in', n: 10 } }, hint: 'Switch it back into battle 10 times.' },
    ],
    ult: 'soft_and_wet', ultHow: { battle: { ev: 'bond_secs', n: 60 } }, ultHint: 'Stay bonded for 60 s in total.',
    gimmick: BUBBLES,
    evolve: [
      { to: 'princeidon', cond: { level: 16, precise: 40 }, hint: 'Land 40 precision crits and reach Lv.16 — it starts holding court.' },
      { to: 'purple_rain', cond: { level: 16, healed: 400 }, hint: 'Heal 400 HP with your team and reach Lv.16 — on a rainy day.' },
    ],
    temper: 'shy', catch: 0, bond: 90, exp: 64, personality: 'Proud, dramatic and very bouncy. Pretends the crown is not too big.',
  },
  princeidon: {
    name: 'Princeidon', elem: 'hydro', family: 'Aquatic', stage: 2, line: 'bubblion', role: 'Long-range king — tsunamis, bubble armour, slow',
    base: B(9, 17, 12, 5, 15), radius: 0.95,
    basic: { type: 'ranged', power: 14, range: 9, rate: 0.8, speed: 18 },
    start: ['trident_lance', 'tsunami_wave'],
    moves: [
      { id: 'bubble_armor', how: { battle: { ev: 'shield_block', n: 600 } }, hint: 'Absorb 600 damage with shields.' },
      { id: 'royal_decree', how: { level: 24 }, hint: 'Reach Lv.24.' },
      { id: 'maelstrom_crown', how: { battle: { ev: 'steam', n: 5 } }, hint: 'Trigger 5 steam explosions.' },
    ],
    passives: [
      { id: 'regal_poise', how: { battle: { ev: 'flawless', n: 3 } }, hint: 'Win 3 battles without dropping below 70% HP.' },
      { id: 'tidal_soul', how: { battle: { ev: 'bond_secs', n: 180 } }, hint: 'Stay bonded for 3 minutes in total.' },
    ],
    ult: 'royal_tsunami', ultHow: { battle: { ev: 'bond_secs', n: 90 } }, ultHint: 'Stay bonded for 90 s in total.',
    gimmick: Object.assign({}, BUBBLES, { name: 'Bubble Armor', desc: 'Plates of bubble armour that pop and regrow: big regenerating shield, +15% elemental damage.', shield: 0.32, mods: { shieldRegen: 0.025, elmMul: 1.15 } }),
    evolve: [], temper: 'territorial', catch: 0, bond: 90, exp: 220, personality: 'A showman king. Every entrance is a wave; every wave is an entrance.',
  },
  purple_rain: {
    name: 'Purple Rain', elem: 'hydro', family: 'Aquatic', stage: 2, line: 'bubblion', role: 'Long-range queen — rain zones, healing, control',
    base: B(7, 15, 9, 7, 14), radius: 0.85,
    basic: { type: 'ranged', power: 12, range: 9, rate: 0.75, speed: 18 },
    start: ['purple_rain', 'dress_twirl'],
    moves: [
      { id: 'parasol_parry', how: { battle: { ev: 'perfect_parry', n: 5 } }, hint: 'Perfectly parry 5 attacks.' },
      { id: 'queens_bubble', how: { level: 24 }, hint: 'Reach Lv.24.' },
      { id: 'maelstrom_crown', how: { battle: { ev: 'steam', n: 5 } }, hint: 'Trigger 5 steam explosions.' },
    ],
    passives: [
      { id: 'regal_poise', how: { battle: { ev: 'flawless', n: 3 } }, hint: 'Win 3 battles without dropping below 70% HP.' },
      { id: 'big_heart', how: { activity: { id: 'onsen', n: 2 } }, hint: 'Relax at the onsen together twice.' },
    ],
    ult: 'purple_reign', ultHow: { battle: { ev: 'bond_secs', n: 90 } }, ultHint: 'Stay bonded for 90 s in total.',
    gimmick: Object.assign({}, BUBBLES, { name: 'Bubble Gown', desc: 'Her gown fills with bubbles: regenerating shield, heals +20%, +10% elemental damage.', shield: 0.25, mods: { shieldRegen: 0.02, healMul: 1.2, elmMul: 1.1 } }),
    evolve: [], temper: 'curious', catch: 0, bond: 90, exp: 220, personality: 'Elegant, theatrical, kind. Opens her parasol whenever someone is sad.',
  },
  // ------------------------------------------------------------------ Strawbaa → Ramberry / Pennyewe
  strawbaa: {
    name: 'Strawbaa', elem: 'bio', family: 'Beast', stage: 1, line: 'strawbaa', role: 'Baby-lamb healer — little rams, lots of health, strawberry vines that heal and hurt',
    base: B(6, 6, 7, 4, 12), radius: 0.46,
    basic: { type: 'melee', power: 9, range: 1.5, rate: 0.85 },
    start: ['woolly_ram', 'strawberry_vines'],
    moves: [
      { id: 'berry_toss', how: { level: 6 }, hint: 'Reach Lv.6.' },
      { id: 'fluff_up', how: { battle: { ev: 'hit_taken', n: 40 } }, hint: 'Take 40 hits for the team.' },
      { id: 'runner_patch', how: { uses: { skill: 'strawberry_vines', n: 20 } }, hint: 'Plant Strawberry Vines 20 times.' },
      { id: 'sweet_lullaby', how: { eat: { tag: 'sweet', n: 6 } }, hint: 'Share 6 sweet treats.' },
    ],
    passives: [
      { id: 'thick_wool', how: { battle: { ev: 'hit_taken', n: 80 } }, hint: 'Take 80 hits for the team.' },
      { id: 'sweet_scent', how: { eat: { tag: 'fruit', n: 5 } }, hint: 'Eat 5 fruity dishes.' },
      { id: 'berry_bountiful', how: { battle: { ev: 'heal', n: 1500 } }, hint: 'Heal 1500 HP in total.' },
    ],
    ult: 'baa_ram_ewe', ultHow: { battle: { ev: 'bond_secs', n: 60 } }, ultHint: 'Stay bonded for 60 s in total.',
    gimmick: HORNS,
    evolve: [
      { to: 'ramberry', cond: { level: 16, blocked: 30 }, hint: 'Block or absorb 30 attacks and reach Lv.16 — its horns start to grow.' },
      { to: 'pennyewe', cond: { level: 16, healed: 600 }, hint: 'Heal 600 HP and reach Lv.16 — it starts carrying poppies.' },
    ],
    temper: 'curious', catch: 0, bond: 90, exp: 64, personality: 'A tiny baby strawberry lamb with a little red bandana and wool like whipped cream. Gentle, sleepy, unstoppable when a friend is hurt — it heals everyone and smells like strawberries forever.',
  },
  ramberry: {
    name: 'Ramberry', elem: ['bio', 'geo'], family: 'Beast', stage: 2, line: 'strawbaa', role: 'Tank & bruiser — giant horns, vines, huge health',
    base: B(14, 9, 15, 5, 18), radius: 1.0,
    basic: { type: 'melee', power: 16, range: 2.0, rate: 0.9 },
    start: ['horn_charge', 'bramble_wall'],
    moves: [
      { id: 'quake_stomp', how: { battle: { ev: 'stun', n: 10 } }, hint: 'Stun foes 10 times.' },
      { id: 'fields_forever', how: { level: 26 }, hint: 'Reach Lv.26.' },
      { id: 'runner_patch', how: { uses: { skill: 'strawberry_vines', n: 20 } }, hint: 'Plant Strawberry Vines 20 times.' },
    ],
    passives: [
      { id: 'rams_resolve', how: { battle: { ev: 'low_hp_win', n: 2 } }, hint: 'Win 2 battles from below 40% HP.' },
      { id: 'thick_wool', how: { battle: { ev: 'hit_taken', n: 80 } }, hint: 'Take 80 hits for the team.' },
    ],
    ult: 'stampede_forever', ultHow: { battle: { ev: 'bond_secs', n: 90 } }, ultHint: 'Stay bonded for 90 s in total.',
    gimmick: Object.assign({}, HORNS, { desc: 'Its colossal horns expand even further: +40% ram damage, +25% defense, immune to knockback.', mods: { physMul: 1.4, defMul: 1.25, knockImmune: true } }),
    evolve: [], temper: 'territorial', catch: 0, bond: 90, exp: 230, personality: 'A gentle giant who headbutts boulders for fun. Carries tiny friends on its horns.',
  },
  pennyewe: {
    name: 'Pennyewe', elem: 'bio', family: 'Beast', stage: 2, line: 'strawbaa', role: 'Pure healer — poppy auras, cures, sleep',
    base: B(6, 15, 10, 8, 16), radius: 0.8,
    basic: { type: 'ranged', power: 10, range: 7, rate: 0.8, speed: 14 },
    start: ['poppy_aura', 'poppy_toss'],
    moves: [
      { id: 'nurse_call', how: { battle: { ev: 'heal', n: 2000 } }, hint: 'Heal 2000 HP in total.' },
      { id: 'barber_spin', how: { level: 24 }, hint: 'Reach Lv.24.' },
      { id: 'sweet_lullaby', how: { eat: { tag: 'sweet', n: 6 } }, hint: 'Share 6 sweet treats.' },
    ],
    passives: [
      { id: 'berry_bountiful', how: { battle: { ev: 'heal', n: 1500 } }, hint: 'Heal 1500 HP in total.' },
      { id: 'big_heart', how: { activity: { id: 'onsen', n: 2 } }, hint: 'Relax at the onsen together twice.' },
    ],
    ult: 'field_of_poppies', ultHow: { battle: { ev: 'bond_secs', n: 90 } }, ultHint: 'Stay bonded for 90 s in total.',
    gimmick: Object.assign({}, HORNS, { id: 'poppy_halo', name: 'Poppy Halo', desc: 'A halo of poppies blooms in her wool: heals +40%, +10% elemental damage, heals 15% on bonding.', heal: 0.15, mods: { healMul: 1.4, elmMul: 1.1 } }),
    evolve: [], temper: 'shy', catch: 0, bond: 90, exp: 230, personality: 'Kind, organised, unflappable. Hands out poppies to anyone who looks tired.',
  },
};

export const STARTERS = ['chilichick', 'bubblion', 'strawbaa'];
