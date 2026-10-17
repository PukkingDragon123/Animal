// Elemon species: gameplay data. Visual designs live in src/data/designs/*.js
// (same ids). Stats are the five core stats at level 1: DMG (physical power),
// ELM (elemental power + status potency), DEF, SPD, HP.
//
// basic: auto-attack. learn: [level, skillId] offered on level-up.
// ult: signature ultimate (unlocked via soul-stone resonance / Astral tree).
// passives: candidates for passive slots. evolve: [{ to, cond, hint }].
// temper: wild behaviour (skittish | curious | territorial | aggressive | beast).
// catch: base capture chance; bond: starting friendship when caught.
const B = (dmg, elm, def, spd, hp) => ({ dmg, elm, def, spd, hp });

export const SPECIES = {
  // ------------------------------------------------------------ starters
  kindoru: { name: 'Kindoru', elem: 'pyro', family: 'Dragon', stage: 1, base: B(8, 8, 5, 6, 6), radius: 0.45,
    basic: { type: 'melee', power: 10, range: 1.5, rate: 0.7 }, start: ['ember_shot', 'flame_fang'],
    learn: [[6, 'lantern_burst'], [6, 'flame_tail'], [8, 'kindle'], [11, 'heat_wave'], [14, 'blaze_rush'], [18, 'fireworks'], [24, 'meteor_drop']],
    ult: 'festival_inferno', passives: ['hothead', 'fuel_tank', 'overheat_core', 'ember_skin'],
    evolve: [{ to: 'chochidra', cond: { level: 16, wins: 10 }, hint: 'Win 10 battles and reach Lv.16.' }],
    temper: 'curious', catch: 0, bond: 90, exp: 64, personality: 'Hot-headed and fiercely loyal. Will fight anything for a takoyaki.' },
  chochidra: { name: 'Chochidra', elem: 'pyro', family: 'Dragon', stage: 2, base: B(11, 11, 7, 8, 8), radius: 0.6,
    basic: { type: 'melee', power: 13, range: 1.7, rate: 0.68 }, start: [], learn: [[18, 'fireworks'], [24, 'meteor_drop']],
    ult: 'festival_inferno', passives: ['hothead', 'fuel_tank', 'overheat_core', 'ember_skin'],
    evolve: [{ to: 'infernobori', cond: { level: 36, charged: 150 }, hint: 'Land 150 charged attacks and reach Lv.36.' }], temper: 'curious', catch: 0, bond: 90, exp: 142 },
  infernobori: { name: 'Infernobori', elem: 'pyro', family: 'Dragon', stage: 3, base: B(15, 14, 9, 9, 11), radius: 0.85,
    basic: { type: 'melee', power: 17, range: 2.0, rate: 0.72 }, start: [], learn: [], ult: 'festival_inferno', passives: ['hothead', 'fuel_tank', 'overheat_core', 'ember_skin'], evolve: [], temper: 'curious', catch: 0, bond: 90, exp: 240 },

  takopo: { name: 'Takopo', elem: 'hydro', family: 'Aquatic', stage: 1, base: B(5, 8, 5, 8, 6), radius: 0.42,
    basic: { type: 'ranged', power: 7, range: 6.5, rate: 0.6, speed: 16 }, start: ['water_jet', 'bubble_trap'],
    learn: [[6, 'ricochet'], [6, 'riptide_dash'], [8, 'ink_smoke'], [11, 'hydro_barrage'], [14, 'sniper_focus'], [18, 'tidal_lance'], [22, 'whirlpool']],
    ult: 'ink_sniper', passives: ['slick', 'deadeye', 'tactician', 'hydro_shell'],
    evolve: [{ to: 'takommando', cond: { level: 16, precise: 60 }, hint: 'Land 60 precision crits and reach Lv.16.' }], temper: 'shy', catch: 0, bond: 90, exp: 64, personality: 'Calm, analytical, quietly competitive. Always adjusting its goggles.' },
  takommando: { name: 'Takommando', elem: 'hydro', family: 'Aquatic', stage: 2, base: B(7, 11, 7, 11, 8), radius: 0.55,
    basic: { type: 'ranged', power: 9, range: 7.5, rate: 0.55, speed: 18 }, start: [], learn: [[18, 'tidal_lance'], [22, 'whirlpool']], ult: 'ink_sniper', passives: ['slick', 'deadeye', 'tactician', 'hydro_shell'],
    evolve: [{ to: 'admiraken', cond: { level: 36, precise: 300 }, hint: 'Land 300 precision crits and reach Lv.36.' }], temper: 'shy', catch: 0, bond: 90, exp: 142 },
  admiraken: { name: 'Admiraken', elem: 'hydro', family: 'Aquatic', stage: 3, base: B(9, 15, 9, 13, 11), radius: 0.85,
    basic: { type: 'ranged', power: 12, range: 8.5, rate: 0.6, speed: 20 }, start: [], learn: [], ult: 'ink_sniper', passives: ['slick', 'deadeye', 'tactician', 'hydro_shell'], evolve: [], temper: 'shy', catch: 0, bond: 90, exp: 240 },

  mochika: { name: 'Mochika', elem: 'bio', family: 'Beast', stage: 1, base: B(5, 7, 6, 6, 8), radius: 0.42,
    basic: { type: 'melee', power: 8, range: 1.4, rate: 0.72 }, start: ['seed_shot', 'mending_bloom'],
    learn: [[6, 'sleep_pollen'], [6, 'vine_lash'], [8, 'toxic_thorns'], [11, 'petal_dance'], [14, 'photosynth'], [18, 'spore_field']],
    ult: 'sakura_sanctuary', passives: ['green_thumb', 'venom_glands', 'deep_sleep', 'photosynthesis'],
    evolve: [{ to: 'hanashika', cond: { level: 16, healed: 1500 }, hint: 'Heal 1500 HP and reach Lv.16.' }], temper: 'skittish', catch: 0, bond: 90, exp: 64, personality: 'Gentle, sleepy and endlessly kind. Naps in sunbeams.' },
  hanashika: { name: 'Hanashika', elem: 'bio', family: 'Beast', stage: 2, base: B(7, 10, 8, 8, 11), radius: 0.6,
    basic: { type: 'melee', power: 10, range: 1.6, rate: 0.7 }, start: [], learn: [[18, 'spore_field']], ult: 'sakura_sanctuary', passives: ['green_thumb', 'venom_glands', 'deep_sleep', 'photosynthesis'],
    evolve: [{ to: 'shinrinoh', cond: { level: 36, healed: 8000 }, hint: 'Heal 8000 HP and reach Lv.36.' }], temper: 'skittish', catch: 0, bond: 90, exp: 142 },
  shinrinoh: { name: 'Shinrinoh', elem: 'bio', family: 'Spirit', stage: 3, base: B(9, 13, 10, 9, 15), radius: 0.9,
    basic: { type: 'melee', power: 13, range: 2.0, rate: 0.75 }, start: [], learn: [], ult: 'sakura_sanctuary', passives: ['green_thumb', 'venom_glands', 'deep_sleep', 'photosynthesis'], evolve: [], temper: 'skittish', catch: 0, bond: 90, exp: 240 },

  clayki: { name: 'Clayki', elem: 'geo', family: 'Beast', stage: 1, base: B(7, 5, 9, 4, 8), radius: 0.45,
    basic: { type: 'melee', power: 10, range: 1.5, rate: 0.85 }, start: ['pebble_toss', 'hat_guard'],
    learn: [[6, 'stone_wall'], [6, 'rock_slam'], [8, 'armor_up'], [11, 'boulder_roll'], [14, 'earth_spikes'], [18, 'quicksand']],
    ult: 'kiln_fortress', passives: ['bedrock', 'immovable', 'thorny_hide', 'fortify'],
    evolve: [{ to: 'tanukiln', cond: { level: 16, blocked: 60 }, hint: 'Block or parry 60 attacks and reach Lv.16.' }], temper: 'curious', catch: 0, bond: 90, exp: 64, personality: 'Easy-going, stubborn as a mountain, surprisingly funny.' },
  tanukiln: { name: 'Tanukiln', elem: 'geo', family: 'Beast', stage: 2, base: B(10, 7, 12, 5, 11), radius: 0.62,
    basic: { type: 'melee', power: 13, range: 1.7, rate: 0.85 }, start: [], learn: [[18, 'quicksand']], ult: 'kiln_fortress', passives: ['bedrock', 'immovable', 'thorny_hide', 'fortify'],
    evolve: [{ to: 'dogugaia', cond: { level: 36, blocked: 300 }, hint: 'Block or parry 300 attacks and reach Lv.36.' }], temper: 'curious', catch: 0, bond: 90, exp: 142 },
  dogugaia: { name: 'Dogugaia', elem: 'geo', family: 'Golem', stage: 3, base: B(14, 9, 16, 6, 15), radius: 0.95,
    basic: { type: 'melee', power: 17, range: 2.1, rate: 0.9 }, start: [], learn: [], ult: 'kiln_fortress', passives: ['bedrock', 'immovable', 'thorny_hide', 'fortify'], evolve: [], temper: 'curious', catch: 0, bond: 90, exp: 240 },

  komoriff: { name: 'Komoriff', elem: 'echo', family: 'Flyer', stage: 1, base: B(6, 7, 5, 9, 5), radius: 0.4,
    basic: { type: 'ranged', power: 7, range: 5, rate: 0.55, speed: 13 }, start: ['sound_wave', 'riff_slash'],
    learn: [[6, 'feedback_screech'], [6, 'crowd_surf'], [8, 'bass_drop'], [11, 'sonar_ping'], [14, 'amp_up'], [18, 'echo_clone']],
    ult: 'encore_loop', passives: ['perfect_pitch', 'reverb', 'mosh_spirit', 'groupie'],
    evolve: [{ to: 'reverbat', cond: { level: 16, beats: 120 }, hint: 'Land 120 on-beat hits and reach Lv.16.' }], temper: 'curious', catch: 0, bond: 90, exp: 64, personality: 'A mischievous show-off that headbangs to every beat it hears.' },
  reverbat: { name: 'Reverbat', elem: 'echo', family: 'Flyer', stage: 2, base: B(8, 10, 7, 12, 7), radius: 0.55,
    basic: { type: 'ranged', power: 9, range: 5.5, rate: 0.5, speed: 14 }, start: [], learn: [[18, 'echo_clone']], ult: 'encore_loop', passives: ['perfect_pitch', 'reverb', 'mosh_spirit', 'groupie'],
    evolve: [{ to: 'amplifury', cond: { level: 36, beats: 600 }, hint: 'Land 600 on-beat hits and reach Lv.36.' }], temper: 'curious', catch: 0, bond: 90, exp: 142 },
  amplifury: { name: 'Amplifury', elem: 'echo', family: 'Flyer', stage: 3, base: B(10, 14, 9, 14, 10), radius: 0.85,
    basic: { type: 'ranged', power: 12, range: 6.5, rate: 0.55, speed: 16 }, start: [], learn: [], ult: 'encore_loop', passives: ['perfect_pitch', 'reverb', 'mosh_spirit', 'groupie'], evolve: [], temper: 'curious', catch: 0, bond: 90, exp: 240 },

  // ------------------------------------------------------------ the Beatles beetle
  beatlet: { name: 'Beatlet', elem: 'bio', family: 'Bug', stage: 1, base: B(7, 6, 6, 7, 6), radius: 0.38,
    basic: { type: 'melee', power: 9, range: 1.4, rate: 0.62 }, start: ['mop_top_spin', 'seed_shot'],
    learn: [[7, 'twist_and_shout'], [9, 'vine_lash'], [12, 'sleep_pollen'], [15, 'petal_dance']],
    ult: 'sakura_sanctuary', passives: ['with_a_little_help', 'venom_glands'],
    evolve: [
      { to: 'lenshorn', cond: { level: 12, defeat: { lemmo: 20, alpha_lemmo: 1 } }, hint: 'Defeat 20 Lemmo and the Alpha Lemmo in the safari. (Imagine that.)' },
      { to: 'mccarapace', cond: { level: 16, friendship: 180, location: 'dotonbori' }, hint: 'Reach deep friendship, then let it be… by the Dotonbori canal.' },
      { to: 'harrisun', cond: { level: 16, dojo: 3, hours: [5, 8] }, hint: 'Meditate at the dojo 3 times, then wait for the sun to come up.' },
      { to: 'starrab', cond: { level: 16, teamCombos: 25 }, hint: 'Pull off 25 team combos — with a little help from your friends.' },
    ], temper: 'curious', catch: 0.5, bond: 80, exp: 58, personality: 'Sunny, sings constantly, believes all you need is love (and leaves).' },
  lenshorn: { name: 'Lenshorn', elem: 'echo', family: 'Bug', stage: 2, base: B(9, 12, 8, 9, 9), radius: 0.55, basic: { type: 'ranged', power: 11, range: 6, rate: 0.6, speed: 14 },
    start: ['imagine', 'sound_wave'], learn: [[18, 'feedback_screech'], [22, 'bass_drop']], ult: 'encore_loop', passives: ['perfect_pitch', 'groupie'], evolve: [], temper: 'curious', catch: 0, bond: 80, exp: 150 },
  mccarapace: { name: 'McCarapace', elem: 'hydro', family: 'Bug', stage: 2, base: B(9, 11, 9, 9, 10), radius: 0.55, basic: { type: 'ranged', power: 10, range: 6.5, rate: 0.58, speed: 16 },
    start: ['yesterday', 'water_jet'], learn: [[18, 'ricochet'], [22, 'tidal_lance']], ult: 'ink_sniper', passives: ['deadeye', 'slick'], evolve: [], temper: 'curious', catch: 0, bond: 80, exp: 150 },
  harrisun: { name: 'Harrisun', elem: 'pyro', family: 'Bug', stage: 2, base: B(10, 12, 8, 8, 9), radius: 0.55, basic: { type: 'melee', power: 12, range: 1.7, rate: 0.65 },
    start: ['here_comes_the_sun', 'ember_shot'], learn: [[18, 'heat_wave'], [22, 'fireworks']], ult: 'festival_inferno', passives: ['fuel_tank', 'photosynthesis'], evolve: [], temper: 'curious', catch: 0, bond: 80, exp: 150 },
  starrab: { name: 'Starrab', elem: 'geo', family: 'Bug', stage: 2, base: B(11, 9, 11, 8, 10), radius: 0.55, basic: { type: 'melee', power: 12, range: 1.7, rate: 0.6 },
    start: ['octopus_garden', 'pebble_toss'], learn: [[18, 'rock_slam'], [22, 'earth_spikes']], ult: 'kiln_fortress', passives: ['with_a_little_help', 'bedrock'], evolve: [], temper: 'curious', catch: 0, bond: 80, exp: 150 },

  // ------------------------------------------------------------ rolling stone
  pebblips: { name: 'Pebblips', elem: 'geo', family: 'Rock', stage: 1, base: B(7, 6, 8, 7, 6), radius: 0.36, basic: { type: 'melee', power: 9, range: 1.3, rate: 0.66 },
    start: ['rolling_stone', 'pebble_toss'], learn: [[8, 'paint_it_black'], [12, 'boulder_roll'], [16, 'twist_and_shout']], ult: 'kiln_fortress', passives: ['rolling_moss', 'bedrock'],
    evolve: [{ to: 'jaggeode', cond: { level: 14, foods: 8 }, hint: "It can't get no satisfaction… feed it 8 different foods." }], temper: 'skittish', catch: 0.35, bond: 50, exp: 60,
    personality: 'Never stops rolling. Strikes a pose whenever someone looks at it.' },
  jaggeode: { name: 'Jaggeode', elem: 'geo', family: 'Rock', stage: 2, base: B(11, 10, 11, 10, 9), radius: 0.55, basic: { type: 'melee', power: 13, range: 1.7, rate: 0.6 },
    start: ['paint_it_black', 'rolling_stone'], learn: [[18, 'bass_drop'], [22, 'rock_slam']], ult: 'encore_loop', passives: ['rolling_moss', 'groupie'], evolve: [], temper: 'curious', catch: 0, bond: 50, exp: 155 },

  // ------------------------------------------------------------ cast
  zapanda: { name: 'Zapanda', elem: 'volto', family: 'Beast', stage: 1, base: B(7, 8, 5, 9, 6), radius: 0.42, basic: { type: 'melee', power: 9, range: 1.4, rate: 0.55 },
    start: ['zap', 'thunder_fang'], learn: [[8, 'spark_dash'], [12, 'static_field'], [16, 'discharge']], ult: 'lemon_storm', passives: ['slick'], evolve: [], temper: 'curious', catch: 0.4, bond: 70, exp: 62 },
  kanizumo: { name: 'Kanizumo', elem: ['hydro', 'geo'], family: 'Aquatic', stage: 2, base: B(9, 7, 10, 5, 10), radius: 0.62, basic: { type: 'melee', power: 11, range: 1.7, rate: 0.85 },
    start: ['crab_hammer', 'shiko_stomp', 'water_jet', 'bubble_trap'], learn: [], ult: 'kiln_fortress', passives: ['bedrock'], evolve: [], temper: 'territorial', catch: 0.25, bond: 60, exp: 120 },
  studrat: { name: 'Studrat', elem: 'ferro', family: 'Beast', stage: 1, base: B(8, 5, 6, 9, 6), radius: 0.4, basic: { type: 'melee', power: 9, range: 1.3, rate: 0.5 },
    start: ['stud_shot', 'iron_bash', 'chain_whip'], learn: [], ult: null, passives: [], evolve: [], temper: 'aggressive', catch: 0.4, bond: 30, exp: 60 },
  moshbull: { name: 'Moshbull', elem: 'geo', family: 'Beast', stage: 2, base: B(11, 5, 9, 6, 10), radius: 0.7, basic: { type: 'melee', power: 12, range: 1.8, rate: 0.9 },
    start: ['mosh_charge', 'shiko_stomp', 'rock_slam'], learn: [], ult: null, passives: ['immovable'], evolve: [], temper: 'aggressive', catch: 0.3, bond: 25, exp: 110 },
  thrashark: { name: 'Thrashark', elem: ['hydro', 'ferro'], family: 'Aquatic', stage: 2, base: B(11, 9, 8, 9, 9), radius: 0.65, basic: { type: 'melee', power: 12, range: 1.8, rate: 0.62 },
    start: ['sawblade', 'water_jet', 'riptide_dash', 'tidal_lance'], learn: [], ult: 'tsunami', passives: [], evolve: [], temper: 'aggressive', catch: 0.2, bond: 20, exp: 130 },
  lemmo: { name: 'Lemmo', elem: 'volto', family: 'Plant', stage: 1, base: B(5, 6, 5, 7, 5), radius: 0.32, basic: { type: 'melee', power: 7, range: 1.2, rate: 0.7 },
    start: ['zest_spray', 'zap'], learn: [], ult: null, passives: [], evolve: [], temper: 'territorial', catch: 0.65, bond: 60, exp: 34 },
  alpha_lemmo: { name: 'Alpha Lemmo', elem: 'volto', family: 'Plant', stage: 3, boss: true, base: B(11, 12, 10, 6, 22), radius: 1.2, basic: { type: 'melee', power: 14, range: 2.4, rate: 0.95 },
    start: ['zest_spray', 'discharge', 'static_field', 'zap'], learn: [], ult: 'lemon_storm', passives: ['immovable'], evolve: [], temper: 'aggressive', catch: 0.08, bond: 15, exp: 320 },
  kagarou: { name: 'Kagarou', elem: 'pyro', family: 'Beast', stage: 2, rare: true, base: B(12, 10, 7, 12, 9), radius: 0.6, basic: { type: 'melee', power: 13, range: 1.7, rate: 0.55 },
    start: ['flame_fang', 'blaze_rush', 'heat_wave'], learn: [[24, 'fireworks']], ult: 'festival_inferno', passives: ['hothead'], evolve: [], temper: 'aggressive', catch: 0.08, bond: 10, exp: 180,
    personality: 'Proud, wild and suspicious of every human. Earn its trust and it will burn for you.' },
  hotarumi: { name: 'Hotarumi', elem: ['volto', 'bio'], family: 'Bug', stage: 1, rare: true, base: B(5, 9, 5, 9, 5), radius: 0.32, basic: { type: 'ranged', power: 7, range: 5.5, rate: 0.6, speed: 14 },
    start: ['zap', 'sleep_pollen', 'mending_bloom'], learn: [], ult: 'sakura_sanctuary', passives: ['photosynthesis'], evolve: [], temper: 'skittish', catch: 0.3, bond: 60, exp: 70 },
  kappachi: { name: 'Kappachi', elem: 'hydro', family: 'Yokai', stage: 1, base: B(7, 7, 7, 7, 6), radius: 0.4, basic: { type: 'melee', power: 9, range: 1.4, rate: 0.62 },
    start: ['water_jet', 'bubble_trap', 'riptide_dash'], learn: [], ult: 'tsunami', passives: ['slick'], evolve: [], temper: 'curious', catch: 0.45, bond: 55, exp: 64 },
  chochobake: { name: 'Chochobake', elem: 'ecto', family: 'Yokai', stage: 1, rare: true, base: B(5, 9, 5, 8, 6), radius: 0.42, basic: { type: 'ranged', power: 8, range: 5.5, rate: 0.62, speed: 12 },
    start: ['shade_ball', 'lantern_glare', 'phase'], learn: [], ult: null, passives: [], evolve: [], temper: 'skittish', catch: 0.3, bond: 45, exp: 72, eyeSlot: true },
  tengale: { name: 'Tengale', elem: 'aero', family: 'Flyer', stage: 2, rare: true, base: B(9, 9, 7, 11, 8), radius: 0.5, basic: { type: 'melee', power: 11, range: 1.6, rate: 0.55 },
    start: ['air_slash', 'gust', 'tornado', 'tailwind'], learn: [], ult: null, passives: [], evolve: [], temper: 'territorial', catch: 0.18, bond: 30, exp: 130 },
  yukiusa: { name: 'Yukiusa', elem: 'cryo', family: 'Beast', stage: 1, rare: true, base: B(5, 9, 5, 10, 5), radius: 0.32, basic: { type: 'ranged', power: 7, range: 5, rate: 0.6, speed: 14 },
    start: ['ice_shard', 'frost_breath', 'blizzard'], learn: [], ult: null, passives: [], evolve: [], temper: 'skittish', catch: 0.22, bond: 50, exp: 80 },
  cabbunny: { name: 'Cabbunny', elem: 'bio', family: 'Plant', stage: 1, base: B(5, 6, 6, 7, 7), radius: 0.32, basic: { type: 'melee', power: 7, range: 1.2, rate: 0.65 },
    start: ['seed_shot', 'mending_bloom'], learn: [], ult: null, passives: [], evolve: [], temper: 'skittish', catch: 0.6, bond: 70, exp: 40 },
  moglow: { name: 'Moglow', elem: 'geo', family: 'Beast', stage: 1, base: B(7, 5, 7, 5, 7), radius: 0.36, basic: { type: 'melee', power: 9, range: 1.3, rate: 0.7 },
    start: ['pebble_toss', 'quicksand', 'rock_slam'], learn: [], ult: null, passives: [], evolve: [], temper: 'curious', catch: 0.55, bond: 70, exp: 44 },
  mechanyan: { name: 'Mechanyan', elem: ['ferro', 'volto'], family: 'Machine', stage: 2, base: B(9, 9, 9, 9, 8), radius: 0.5, basic: { type: 'melee', power: 11, range: 1.5, rate: 0.6 },
    start: ['zap', 'iron_bash', 'steel_guard', 'spark_dash'], learn: [], ult: null, passives: [], evolve: [], temper: 'curious', catch: 0, bond: 60, exp: 120 },
  idolark: { name: 'Idolark', elem: 'echo', family: 'Flyer', stage: 2, base: B(7, 10, 7, 10, 8), radius: 0.45, basic: { type: 'ranged', power: 9, range: 6, rate: 0.55, speed: 14 },
    start: ['sound_wave', 'feedback_screech', 'amp_up', 'bass_drop'], learn: [], ult: 'encore_loop', passives: ['groupie'], evolve: [], temper: 'curious', catch: 0, bond: 60, exp: 120 },
  marionoir: { name: 'Marionoir', elem: ['ecto', 'ferro'], family: 'Spirit', stage: 3, base: B(10, 13, 10, 10, 12), radius: 0.6, basic: { type: 'ranged', power: 12, range: 6, rate: 0.6, speed: 14 },
    start: ['puppet_strings', 'shade_ball', 'lantern_glare', 'phase'], learn: [], ult: null, passives: [], evolve: [], temper: 'aggressive', catch: 0, bond: 10, exp: 260 },

  // ------------------------------------------------------------ legendaries & boss
  polaris: { name: 'Polaris', elem: ['aero', 'astro'], family: 'Legend', stage: 3, legendary: true, base: B(12, 18, 14, 10, 24), radius: 2.4, basic: { type: 'ranged', power: 16, range: 9, rate: 0.9, speed: 14 },
    start: ['star_beam', 'tornado', 'gravity_well', 'tailwind'], learn: [], ult: 'tsunami', passives: [], evolve: [], temper: 'curious', catch: 0.03, bond: 40, exp: 900 },
  solaris: { name: 'Solaris', elem: ['pyro', 'astro'], family: 'Legend', stage: 3, legendary: true, base: B(18, 16, 13, 12, 22), radius: 1.8, basic: { type: 'melee', power: 20, range: 2.6, rate: 0.8 },
    start: ['flame_fang', 'heat_wave', 'meteor_drop', 'star_beam'], learn: [], ult: 'solar_flare', passives: ['hothead'], evolve: [], temper: 'territorial', catch: 0.03, bond: 40, exp: 900 },
  atomic: { name: 'Atomic', elem: 'nucleo', family: 'Rift', stage: 3, legendary: true, boss: true, base: B(20, 20, 16, 10, 40), radius: 2.2, basic: { type: 'melee', power: 22, range: 3, rate: 0.85 },
    start: ['fission_breath', 'rift_shard', 'tusk_charge', 'gravity_well'], learn: [], ult: 'meltdown', passives: ['immovable'], evolve: [], temper: 'beast', catch: 0.02, bond: 5, exp: 1500 },

  // ------------------------------------------------------------ wild beasts (cannot be tamed)
  rift_boar: { name: 'Rift Boar', elem: 'nucleo', family: 'Wild Beast', stage: 0, beast: true, base: B(12, 6, 10, 9, 14), radius: 0.8, basic: { type: 'melee', power: 14, range: 1.9, rate: 0.9 },
    start: ['tusk_charge'], learn: [], ult: null, passives: ['immovable'], evolve: [], temper: 'beast', catch: 0, bond: 0, exp: 140 },
  oni_bear: { name: 'Oni Bear', elem: 'nucleo', family: 'Wild Beast', stage: 0, beast: true, base: B(15, 7, 12, 6, 18), radius: 0.95, basic: { type: 'melee', power: 17, range: 2.1, rate: 1.0 },
    start: ['iron_bash', 'shiko_stomp', 'rift_shard'], learn: [], ult: null, passives: [], evolve: [], temper: 'beast', catch: 0, bond: 0, exp: 200 },
};

export const speciesOf = (id) => SPECIES[id];
export const elemsOf = (sp) => (Array.isArray(sp.elem) ? sp.elem : [sp.elem]);
export const primaryElem = (sp) => elemsOf(sp)[0];
export const STARTERS = ['kindoru', 'takopo', 'mochika', 'clayki', 'komoriff'];
