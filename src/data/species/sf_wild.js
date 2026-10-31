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
  // ---- opening story cast
  wheezowl: {
    name: 'Wheezowl', elem: ['aero', 'echo'], family: 'Bird', stage: 2, gift: true, role: 'Family support — sunny healing patches, sweater-thread snares, shields',
    base: B(6, 12, 9, 9, 12), radius: 0.55,
    basic: { type: 'ranged', power: 10, range: 7, rate: 0.7, speed: 14 },
    start: ['island_in_the_sun', 'sweater_song'],
    moves: [
      { id: 'say_it_aint_so', how: { friendship: 150 }, hint: 'Grow close — say it ain\'t so.' },
      { id: 'buddy_holly', how: { level: 10 }, hint: 'Reach Lv.10.' },
      { id: 'surf_wax_america', how: { battle: { ev: 'perfect_dodge', n: 5 } }, hint: 'Perfectly dodge 5 attacks.' },
    ],
    passives: [
      { id: 'blue_album', how: { battle: { ev: 'heal', n: 600 } }, hint: 'Heal 600 HP for the family.' },
      { id: 'big_heart', how: { activity: { id: 'hangout', n: 3 } }, hint: 'Hang out together 3 times.' },
    ],
    ult: 'only_in_dreams', ...ULT,
    gimmick: { id: 'cardigan_wings', name: 'Cardigan Wings', desc: 'Wraps everyone in its hand-knit cardigan: a shield, heals +30%, +10% elemental damage.', shield: 0.2, mods: { healMul: 1.3, elmMul: 1.1 } },
    evolve: [], temper: 'shy', catch: 0, bond: 120, exp: 150, personality: 'The family\'s owl — Mom. Round thick-rimmed glasses, a hand-knit cardigan with one loose thread, and a soft hoot like a guitar hook. Gentle, a little nerdy, always there.',
  },
  mopzart: {
    name: 'Mopzart', elem: 'echo', family: 'Beast', stage: 2, npc: true, role: 'Sleepy maestro — lullabies, marches and laments that buff friends and sap foes',
    base: B(5, 13, 8, 4, 12), radius: 0.55,
    basic: { type: 'ranged', power: 10, range: 7, rate: 0.9, speed: 12 },
    start: ['little_night_music', 'rondo_alla_turca'],
    moves: [
      { id: 'magic_flute', how: { level: 8 }, hint: 'Reach Lv.8.' },
      { id: 'lacrimosa', how: { level: 14 }, hint: 'Reach Lv.14.' },
      { id: 'twinkle_variations', how: { battle: { ev: 'on_beat', n: 30 } }, hint: 'Land 30 on-beat hits.' },
    ],
    passives: [
      { id: 'corded_coat', how: { level: 6 }, hint: 'Reach Lv.6.' },
      { id: 'maestro', how: { battle: { ev: 'on_beat', n: 40 } }, hint: 'Land 40 on-beat hits.' },
    ],
    ult: 'requiem', ...ULT,
    gimmick: { id: 'powdered_periwig', name: 'Powdered Periwig', desc: 'Its corded coat puffs up like a periwig: +20% elemental damage, on-beat hits +35%, longer sleeps.', mods: { elmMul: 1.2, beatMul: 1.35, sleepDur: 1 } },
    evolve: [], temper: 'shy', catch: 0, bond: 60, exp: 150, personality: 'A very old mop dog whose corded coat curls like a powdered periwig. Sleeps through everything except a wrong note.',
  },
  dreadrake: {
    name: 'Dreadrake', elem: ['hydro', 'ferro'], family: 'Bird', stage: 2, role: 'Bruiser — humbling stomps, heavy hooks, iron-feathered charges',
    base: B(13, 8, 10, 9, 10), radius: 0.6,
    basic: { type: 'melee', power: 13, range: 1.6, rate: 0.55 },
    start: ['humble_stomp', 'duckworth_hook'],
    moves: [
      { id: 'swimming_pools', how: { battle: { ev: 'drown_foe', n: 5 } }, hint: 'Soak foes until they nearly drown, 5 times.' },
      { id: 'dna_rush', how: { level: 12 }, hint: 'Reach Lv.12.' },
      { id: 'alright', how: { battle: { ev: 'low_hp_win', n: 1 } }, hint: 'Win from below 40% HP — we gon\' be alright.' },
      { id: 'squabble_up', how: { battle: { ev: 'ko', n: 10 } }, hint: 'Knock out 10 foes.' },
    ],
    passives: [
      { id: 'loyalty', how: { friendship: 180 }, hint: 'Earn its loyalty (deep friendship).' },
      { id: 'pride', how: { battle: { ev: 'low_hp_win', n: 2 } }, hint: 'Win 2 battles from below 40% HP.' },
    ],
    ult: 'maad_city', ...ULT,
    gimmick: { id: 'dread_crown', name: 'Dread Crown', desc: 'Dreadlocks swing like a crown: +20% physical damage, −10% damage taken, immune to knockback.', mods: { physMul: 1.2, takenMul: 0.9, knockImmune: true } },
    evolve: [], temper: 'aggressive', catch: 0.08, bond: 35, exp: 160, personality: 'A muscle-bound mallard with heavy dreadlocks and iron-grey feathers — the street punk Spike\'s partner. Talks little, hits hard, stays humble.',
  },
  // ---- the community garden's guardian (garden.js): Farmer Aldo's partner
  kohlossus: {
    name: 'Kohlossus', elem: 'bio', family: 'Plant', stage: 2, npc: true, role: 'Garden guardian tank — belly-flops, cabbage barrages, a wall of leaves',
    base: B(13, 9, 14, 4, 18), radius: 1.15,
    basic: { type: 'melee', power: 15, range: 2.1, rate: 0.9 },
    start: ['belly_flop', 'cabbage_barrage'],
    moves: [
      { id: 'leaf_wall', how: { level: 10 }, hint: 'Reach Lv.10.' },
      { id: 'root_stomp', how: { battle: { ev: 'ko', n: 8 } }, hint: 'Knock out 8 foes who came for the cabbages.' },
      { id: 'compost_cloud', how: { eat: { tag: 'veggie', n: 3 } }, hint: 'Share 3 veggie dishes. It recycles everything.' },
      { id: 'second_helping', how: { friendship: 150 }, hint: 'Become good friends — there is always room for seconds.' },
    ],
    passives: [
      { id: 'thick_leaves', how: { level: 8 }, hint: 'Reach Lv.8.' },
      { id: 'well_fed', how: { battle: { ev: 'low_hp_win', n: 1 } }, hint: 'Win a battle from below 40% HP.' },
    ],
    ult: 'harvest_quake', ...ULT,
    gimmick: { id: 'cabbage_cape', name: 'Cabbage Cape', desc: 'Its leafy ruff swells into a cape of armour-hard leaves: a shield, +25% defense, +15% physical damage.', shield: 0.22, mods: { defMul: 1.25, physMul: 1.15 } },
    evolve: [], temper: 'territorial', catch: 0, bond: 80, exp: 170, personality: 'An enormous, very round rabbit-shaped Tokonmon that is mostly cabbage — leaf ears, a leafy ruff, a cabbage heart for a belly. It guards the community garden with its whole weight, and its whole weight is a lot.',
  },
  barkorious_forced: {
    name: 'Barkorious', elem: ['hydro', 'echo'], family: 'Aquatic', stage: 3, boss: true, revertsTo: 'barkorious', role: 'BOSS — forced-bond rampage: fish cannon, belly-flop quakes',
    base: B(12, 10, 11, 5, 22), radius: 1.4,
    basic: { type: 'melee', power: 18, range: 2.3, rate: 0.85 },
    start: ['fish_cannon', 'big_poppa'],
    moves: [
      { id: 'red_eyed_roar', how: { level: 1 }, hint: 'Forced.' },
      { id: 'kick_in_the_door', how: { level: 1 }, hint: 'Forced.' },
    ],
    passives: [{ id: 'forced_bond', how: { start: true }, hint: 'The forced bond.' }, { id: 'king_of_the_pier', how: { start: true }, hint: 'Still the king.' }],
    ult: 'notorious', ...ULT,
    gimmick: { id: 'red_eyes', name: 'Red Eyes', desc: 'The forced bond flares: a shield and +20% damage.', shield: 0.2, mods: { dmgMul: 1.2 } },
    evolve: [], temper: 'beast', catch: 0, bond: 0, exp: 420, personality: 'Barkorious under a forced bond: giant, furious and red-eyed, a rigged fish cannon strapped to its back. It isn\'t itself — it reverts to Barkorious once the bond is broken.',
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
