// San Francisco single-stage Tokonmon (wild and partners) — gameplay data (docs/ROSTER.md).
// Format: docs/GAMEPLAY.md. Stats B(DMG, ELM, DEF, SPD, HP) at level 1. Moves: src/data/moves/sf_wild.js.
// Fab Four (johnlemon + mccarapace + harrisun + starrfish) and John & Yoko synergies: src/data/synergies.js.
const B = (dmg, elm, def, spd, hp) => ({ dmg, elm, def, spd, hp });
const SW = { battle: { ev: 'switch_in', n: 10 } }, SWH = 'Switch it back into battle 10 times.';
const ULT = { ultHow: { battle: { ev: 'bond_secs', n: 90 } }, ultHint: 'Stay bonded for 90 s in total.' };

export const SPECIES = {
  barkorious: {
    name: 'Barkorious', elem: ['hydro', 'echo'], family: 'Aquatic', stage: 2, role: 'King tank — belly-flop slams, hypnotic flow, big HP',
    base: B(12, 10, 12, 5, 15), radius: 0.95,
    basic: { type: 'melee', power: 14, range: 1.9, rate: 0.85 },
    start: ['big_poppa', 'hypnotize'],
    moves: [
      { id: 'juicy', how: { eat: { tag: 'seafood', n: 5 } }, hint: 'Feed it 5 seafood dishes on the pier.' },
      { id: 'kick_in_the_door', how: { battle: { ev: 'ko', n: 15 } }, hint: 'Knock out 15 foes.' },
      { id: 'mo_money', how: { level: 24 }, hint: 'Reach Lv.24.' },
      { id: 'sky_is_the_limit', how: { battle: { ev: 'stadium_win', n: 2 } }, hint: 'Win 2 stadium matches — the sky\'s the limit.' },
    ],
    passives: [
      { id: 'king_of_the_pier', how: { battle: { ev: 'win', n: 15 } }, hint: 'Win 15 battles.' },
      { id: 'big_heart', how: { activity: { id: 'hangout', n: 3 } }, hint: 'Hang out with friends 3 times.' },
    ],
    ult: 'notorious', ...ULT,
    gimmick: { id: 'gold_chain_crown', name: 'Gold-Chain Crown', desc: 'Crown tilted, chain swinging: a shield, +20% defense, on-beat hits +40%.', shield: 0.2, mods: { defMul: 1.2, beatMul: 1.4, beatWindow: 0.15 } },
    evolve: [], temper: 'territorial', catch: 0.12, bond: 40, exp: 180, personality: 'The giant sea-lion king of Pier 39: a tilted crown, a gold chain and a loud 90s knit. Nods to the beat. Everyone on the pier pays respect.',
  },
  sandmander: {
    name: 'Sandmander', elem: ['geo', 'ecto'], family: 'Beast', stage: 2, role: 'Sleep controller — sleep-sand clouds, hourglass flashes, snake strikes',
    base: B(9, 12, 9, 9, 10), radius: 0.6,
    basic: { type: 'ranged', power: 10, range: 6, rate: 0.65, speed: 13 },
    start: ['enter_sandman', 'exit_light'],
    moves: [
      { id: 'sad_but_true', how: { battle: { ev: 'hit_taken', n: 40 } }, hint: 'Take 40 hits.' },
      { id: 'dont_tread_on_me', how: { battle: { ev: 'perfect_parry', n: 5 } }, hint: 'Perfectly parry 5 attacks.' },
      { id: 'wherever_i_may_roam', how: { level: 22 }, hint: 'Reach Lv.22.' },
      { id: 'the_unforgiven', how: { battle: { ev: 'ko', n: 10 } }, hint: 'Knock out 10 foes. It never forgives.' },
    ],
    passives: [
      { id: 'hourglass_tail', how: { uses: { skill: 'enter_sandman', n: 30 } }, hint: 'Use Enter Sandman 30 times.' },
      { id: 'nightcap', how: { activity: { id: 'onsen', n: 2 } }, hint: 'Relax at the hot spring twice.' },
    ],
    ult: 'enter_night', ...ULT,
    gimmick: { id: 'sleep_sand', name: 'Sleep Sand', desc: 'Its hourglass runs backwards: +15% elemental damage, longer sleeps, waking hits +25%.', mods: { elmMul: 1.15, sleepDur: 1, wakeDmg: 0.25 } },
    evolve: [], temper: 'skittish', catch: 0.2, bond: 40, exp: 140, personality: 'A black desert lizard with a coiled-snake pattern, an hourglass tail and a nightcap. Sprinkles sand in your eyes and says a prayer — then it\'s lights out.',
  },
  justatue: {
    name: 'Justatue', elem: ['geo', 'ferro'], family: 'Golem', stage: 2, role: 'Judge tank — scales that punish, ropes that bind',
    base: B(11, 8, 14, 4, 14), radius: 0.9,
    basic: { type: 'melee', power: 14, range: 1.9, rate: 0.95 },
    start: ['and_justice_for_all', 'blackened'],
    moves: [
      { id: 'eye_of_the_beholder', how: { battle: { ev: 'hit_taken', n: 50 } }, hint: 'Take 50 hits.' },
      { id: 'shortest_straw', how: { level: 20 }, hint: 'Reach Lv.20.' },
      { id: 'harvester_of_sorrow', how: { battle: { ev: 'ko', n: 12 } }, hint: 'Knock out 12 foes.' },
    ],
    passives: [
      { id: 'blind_justice', how: { battle: { ev: 'perfect_parry', n: 5 } }, hint: 'Perfectly parry 5 attacks.' },
      { id: 'cracked_marble', how: { battle: { ev: 'low_hp_win', n: 2 } }, hint: 'Win 2 battles from below 40% HP.' },
    ],
    ult: 'final_verdict', ...ULT,
    gimmick: { id: 'blindfold_off', name: 'Blindfold Off', desc: 'The blindfold drops: a shield, +30% defense, reflects 15% of melee damage.', shield: 0.15, mods: { defMul: 1.3, reflect: 0.15, knockImmune: true } },
    evolve: [], temper: 'territorial', catch: 0.15, bond: 30, exp: 170, personality: 'A cracked, blindfolded statue of justice holding scales and frayed ropes. Weighs every fight. Never changes its verdict.',
  },
  weirdfin: {
    name: 'Weirdfin', elem: ['hydro', 'echo'], family: 'Aquatic', stage: 2, role: 'Eerie sharpshooter — arpeggio bolts, glowing lure',
    base: B(6, 13, 7, 10, 9), radius: 0.55,
    basic: { type: 'ranged', power: 11, range: 8, rate: 0.65, speed: 16 },
    start: ['arpeggi', 'glowing_lure'],
    moves: [
      { id: 'weird_fishes', how: { battle: { ev: 'drown_foe', n: 5 } }, hint: 'Soak foes until they nearly drown, 5 times.' },
      { id: 'reckoner', how: { level: 24 }, hint: 'Reach Lv.24.' },
      { id: 'house_of_cards', how: { eat: { tag: 'seafood', n: 4 } }, hint: 'Feed it 4 seafood dishes. (It doesn\'t ask.)' },
    ],
    passives: [
      { id: 'abyssal_glow', how: { battle: { ev: 'crit', n: 15 } }, hint: 'Land 15 critical hits.' },
      { id: 'comeback_punch', how: SW, hint: SWH },
    ],
    ult: 'in_rainbows', ...ULT,
    gimmick: { id: 'lure_light', name: 'Lure Light', desc: 'Its lure blazes: +20% elemental damage, +10% crit chance, on-beat hits +35%.', mods: { elmMul: 1.2, critChance: 0.1, beatMul: 1.35 } },
    evolve: [], temper: 'skittish', catch: 0.2, bond: 45, exp: 140, personality: 'An eerie deep-sea fish striped in rainbow arpeggio bands. Follows you for a while, then escapes the bottom of the sea.',
  },
  rollick: {
    name: 'Rollick', elem: ['geo', 'echo'], family: 'Rock', stage: 2, role: 'Rolling bruiser — tongue lashes, rolling charges, team shelter',
    base: B(12, 9, 11, 9, 11), radius: 0.6,
    basic: { type: 'melee', power: 13, range: 1.6, rate: 0.6 },
    start: ['tongue_lash', 'jumpin_jack_flash'],
    moves: [
      { id: 'gimme_shelter', how: { battle: { ev: 'hit_taken', n: 50 } }, hint: 'Take 50 hits for the team.' },
      { id: 'satisfaction', how: { eat: { tag: 'savory', n: 8 } }, hint: 'It can\'t get no satisfaction… feed it 8 savory dishes.' },
      { id: 'get_off_my_cloud', how: { level: 20 }, hint: 'Reach Lv.20.' },
      { id: 'start_me_up', how: { activity: { id: 'arcade', n: 2 } }, hint: 'Start up the arcade cabinets twice.' },
    ],
    passives: [
      { id: 'never_stop_rolling', how: { uses: { skill: 'jumpin_jack_flash', n: 30 } }, hint: 'Roll Jumpin\' Jack Flash 30 times.' },
      { id: 'rolling_moss', how: { battle: { ev: 'switch_in', n: 5 } }, hint: 'Keep rolling — switch it back in 5 times.' },
    ],
    ult: 'a_bigger_bang', ...ULT,
    gimmick: { id: 'big_lips', name: 'Big Lips', desc: 'Lips out, tongue out: +20% physical damage, +15% speed, immune to knockback.', mods: { physMul: 1.2, knockImmune: true, spdMul: 1.15 } },
    evolve: [], temper: 'curious', catch: 0.25, bond: 45, exp: 150, personality: 'A rolling boulder with huge lips and an even longer tongue. Has been rolling since before you were born and will never, ever stop.',
  },
  neverdecker: {
    name: 'Neverdecker', elem: ['hydro', 'volto'], family: 'Aquatic', stage: 2, role: 'Bus-whale tank — lit-window beams, gladioli sprays',
    base: B(10, 11, 13, 5, 16), radius: 1.1,
    basic: { type: 'ranged', power: 12, range: 7, rate: 0.8, speed: 14 },
    start: ['there_is_a_light', 'bigmouth_strikes_again'],
    moves: [
      { id: 'gladioli_spray', how: { eat: { tag: 'veggie', n: 5 } }, hint: 'Share 5 veggie dishes — it keeps the stems.' },
      { id: 'how_soon_is_now', how: { activity: { id: 'listen', n: 2 } }, hint: 'Listen to records together twice.' },
      { id: 'this_charming_man', how: { friendship: 150 }, hint: 'Become good friends — it\'s very charming.' },
      { id: 'heaven_knows', how: { battle: { ev: 'hit_taken', n: 60 } }, hint: 'Take 60 hits. It is miserable now.' },
    ],
    passives: [
      { id: 'never_goes_out', how: { battle: { ev: 'low_hp_win', n: 1 } }, hint: 'Win a battle from below 40% HP — the light never goes out.' },
      { id: 'big_heart', how: { activity: { id: 'hangout', n: 3 } }, hint: 'Hang out with friends 3 times.' },
    ],
    ult: 'light_never_goes_out', ...ULT,
    gimmick: { id: 'lit_windows', name: 'Lit Windows', desc: 'Every window lights up: a shield, +20% defense, +15% elemental damage, heals +20%.', shield: 0.25, mods: { defMul: 1.2, elmMul: 1.15, healMul: 1.2 } },
    evolve: [], temper: 'shy', catch: 0.15, bond: 50, exp: 170, personality: 'A red double-decker-bus whale with gladioli sprouting from its blowhole. Its windows never go dark — it will drive you anywhere, as long as it\'s with you.',
  },
  // ---- the Fab Four (with mccarapace + harrisun in src/data/species.js) and Yokat
  johnlemon: {
    name: 'Johnlemon', elem: ['volto', 'echo'], family: 'Plant', stage: 2, role: 'Peace-pop caster — imagine, karma bolts, come-together pulls',
    base: B(7, 14, 8, 10, 10), radius: 0.42,
    basic: { type: 'ranged', power: 11, range: 7, rate: 0.65, speed: 15 },
    start: ['imagine_peace', 'instant_karma'],
    moves: [
      { id: 'come_together', how: { activity: { id: 'hangout', n: 3 } }, hint: 'Hang out with friends 3 times — come together.' },
      { id: 'mind_games', how: { level: 22 }, hint: 'Reach Lv.22.' },
      { id: 'give_peace_a_chance', how: { friendship: 200 }, hint: 'Reach deep friendship. All we are saying…' },
      { id: 'number_nine_dream', how: { eat: { tag: 'sour', n: 5 } }, hint: 'Feed it 5 sour treats. (It\'s a lemon. It gets it.)' },
    ],
    passives: [
      { id: 'round_glasses', how: { battle: { ev: 'crit', n: 15 } }, hint: 'Land 15 critical hits.' },
      { id: 'with_a_little_help', how: { battle: { ev: 'win', n: 10 } }, hint: 'Win 10 battles with your friends.' },
    ],
    ult: 'lemon_revolution', ...ULT,
    gimmick: { id: 'wire_glasses', name: 'Wire Glasses', desc: 'Round glasses on, piano stem out: +20% elemental damage, heals +20%, +8% crit chance.', mods: { elmMul: 1.2, healMul: 1.2, critChance: 0.08 } },
    evolve: [], temper: 'curious', catch: 0.12, bond: 60, exp: 160, personality: 'A lemon in round wire glasses who hums about peace and plays the piano with its stem. Sour on the outside, sweet on the inside.',
  },
  starrfish: {
    name: 'Starrfish', elem: ['hydro', 'echo'], family: 'Aquatic', stage: 2, role: 'Drummer support — drum fills, octopus-garden healing',
    base: B(10, 9, 11, 8, 11), radius: 0.5,
    basic: { type: 'melee', power: 11, range: 1.5, rate: 0.55 },
    start: ['drum_fill', 'octopuss_garden'],
    moves: [
      { id: 'little_help', how: { battle: { ev: 'win', n: 8 } }, hint: 'Win 8 battles with a little help from your friends.' },
      { id: 'yellow_submarine', how: { battle: { ev: 'drown_foe', n: 5 } }, hint: 'Soak foes until they nearly drown, 5 times.' },
      { id: 'photograph', how: { level: 24 }, hint: 'Reach Lv.24.' },
      { id: 'peace_and_love', how: { friendship: 180 }, hint: 'Peace and love! Reach deep friendship.' },
    ],
    passives: [
      { id: 'steady_beat', how: { battle: { ev: 'on_beat', n: 40 } }, hint: 'Land 40 on-beat hits.' },
      { id: 'with_a_little_help', how: { battle: { ev: 'win', n: 10 } }, hint: 'Win 10 battles with your friends.' },
    ],
    ult: 'the_end', ...ULT,
    gimmick: { id: 'star_sticks', name: 'Star Sticks', desc: 'All five arms drumming: a shield, on-beat hits +40%, wider beat window, +15% defense.', shield: 0.12, mods: { beatMul: 1.4, beatWindow: 0.16, defMul: 1.15 } },
    evolve: [], temper: 'curious', catch: 0.15, bond: 65, exp: 160, personality: 'A five-armed starfish who drums on everything — shells, rocks, your head. Ends every sentence with "peace and love!"',
  },
  yokat: {
    name: 'Yokat', elem: ['ecto', 'echo'], family: 'Spirit', stage: 2, role: 'Avant-garde ghost — bag-piece phasing, wish-tree healing',
    base: B(6, 13, 8, 10, 10), radius: 0.42,
    basic: { type: 'ranged', power: 10, range: 7, rate: 0.7, speed: 13 },
    start: ['bag_piece', 'wish_tree'],
    moves: [
      { id: 'mend_piece', how: { battle: { ev: 'heal', n: 600 } }, hint: 'Heal 600 HP — mend what\'s broken.' },
      { id: 'yes_painting', how: { friendship: 180 }, hint: 'Climb the ladder of friendship. YES.' },
      { id: 'walking_on_thin_ice', how: { eat: { tag: 'cold', n: 5 } }, hint: 'Share 5 cold treats.' },
      { id: 'cut_piece', how: { battle: { ev: 'ko', n: 8 } }, hint: 'Knock out 8 foes.' },
    ],
    passives: [
      { id: 'grapefruit', how: { activity: { id: 'listen', n: 3 } }, hint: 'Listen to the sound of the earth turning (records) 3 times.' },
      { id: 'dark_glasses', how: { battle: { ev: 'emote', n: 6 } }, hint: 'Pose 6 times in battle.' },
    ],
    ult: 'war_is_over', ...ULT,
    gimmick: { id: 'wide_black_hat', name: 'Wide Black Hat', desc: 'Hat brim low: +15% elemental damage, heals +25%, faster dodges.', mods: { elmMul: 1.15, healMul: 1.25, dodgeCd: 0.75 } },
    evolve: [], temper: 'shy', catch: 0.1, bond: 55, exp: 160, personality: 'A ghost cat in a wide black hat and round dark glasses. Speaks in instructions ("listen to the sound of the earth turning") and is never far from Johnlemon.',
  },
};
