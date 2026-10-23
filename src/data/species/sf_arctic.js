// The Arctic Monkeys line — gameplay data (models: src/vx/mons/snoozaque.js, piledrilla.js,
// fluorescape.js; moves: src/data/moves/sf_arctic.js). Format: src/data/species/sf_lines.js.
// Stats B(DMG, ELM, DEF, SPD, HP).
//   Snoozaque → Piledrilla → Fluorescape: a fat, always-sleepy snow monkey in a leather jacket, a
//   gorilla on giant ice knuckles, and a giant fluorescent ape in glowing crystal armour.
const B = (dmg, elm, def, spd, hp) => ({ dmg, elm, def, spd, hp });
const SW = { battle: { ev: 'switch_in', n: 10 } }, SWH = 'Switch it back into battle 10 times.';
const ULT = (n) => ({ ultHow: { battle: { ev: 'bond_secs', n } }, ultHint: `Stay bonded for ${n} s in total.` });

export const SPECIES = {
  // ------------------------------------------------------------------ Snoozaque → Piledrilla → Fluorescape (Arctic Monkeys)
  snoozaque: {
    name: 'Snoozaque', elem: 'cryo', family: 'Beast', stage: 1, line: 'snoozaque', role: 'Sleepy bruiser — frosty slaps and packed snowballs',
    base: B(8, 7, 7, 4, 8), radius: 0.44,
    basic: { type: 'melee', power: 9, range: 1.4, rate: 0.8 },
    start: ['snap_out_of_it', 'mardy_bum'],
    moves: [
      { id: 'when_the_sun_goes_down', how: { level: 10 }, hint: 'Reach Lv.10.' },
      { id: 'dancefloor', how: { activity: { id: 'karaoke', n: 2 } }, hint: 'Take it out to sing twice — it bets it looks good on the dancefloor.' },
      { id: 'fake_tales_of_san_francisco', how: { explore: 'chinatown' }, hint: 'Walk the streets of San Francisco together — fake tales, real snow.' },
    ],
    passives: [
      { id: 'still_take_you_home', how: { battle: { ev: 'perfect_dodge', n: 5 } }, hint: 'Perfectly dodge 5 attacks — it was only pretending to sleep.' },
      { id: 'cornerstone', how: SW, hint: SWH },
    ],
    ult: 'brianstorm', ...ULT(60),
    gimmick: { id: 'snow_cap', name: 'Snow Cap', desc: 'The snow piles up on its quiff: a frosty shield, +15% defense and +10% elemental damage.', shield: 0.15, mods: { defMul: 1.15, elmMul: 1.1 } },
    evolve: [{ to: 'piledrilla', cond: { level: 18, hours: [20, 5] }, hint: 'Reach Lv.18 and level up after the sun goes down (20:00–05:00).' }],
    temper: 'curious', catch: 0.45, bond: 55, exp: 60,
    personality: 'A fat, fluffy snow monkey that is never fully awake. Slicked-back quiff with snow on it, a black leather jacket with the collar up, and a comb in its back pocket for emergencies.',
  },
  piledrilla: {
    name: 'Piledrilla', elem: ['cryo', 'geo'], family: 'Beast', stage: 2, line: 'snoozaque', role: 'Ice-knuckle tank — pile-driver slams, walls of ice',
    base: B(12, 8, 11, 5, 11), radius: 0.8,
    basic: { type: 'melee', power: 14, range: 1.9, rate: 0.9 },
    start: ['piledriver_waltz', 'r_u_mine'],
    moves: [
      { id: 'brick_by_brick', how: { battle: { ev: 'perfect_parry', n: 5 } }, hint: 'Perfectly parry 5 attacks — then it builds the wall itself.' },
      { id: 'do_i_wanna_know', how: { level: 26 }, hint: 'Reach Lv.26.' },
      { id: 'crying_lightning', how: { eat: { tag: 'cold', n: 6 } }, hint: 'Share 6 cold treats with it.' },
    ],
    passives: [
      { id: 'dangerous_animals', how: { battle: { ev: 'stun', n: 20 } }, hint: 'Stun 20 foes.' },
      { id: 'cornerstone', how: SW, hint: SWH },
    ],
    ult: 'brianstorm', ...ULT(90),
    gimmick: { id: 'ice_knuckles', name: 'Ice Knuckles', desc: 'The ice thickens on its fists: +25% physical damage and it can\'t be knocked back, but −10% speed.', mods: { physMul: 1.25, knockImmune: true, spdMul: 0.9 } },
    evolve: [{ to: 'fluorescape', cond: { level: 34, activity: { id: 'karaoke', n: 3 } }, hint: 'Croon at the karaoke 3 times and reach Lv.34 — the lounge-singer years begin.' }],
    temper: 'territorial', catch: 0.15, bond: 45, exp: 150,
    personality: 'A frost-white gorilla that knuckle-walks on giant fists of ice. Its leather jacket lost its sleeves when the arms grew, so now it is a vest. The pompadour is a crest now. Still half asleep.',
  },
  fluorescape: {
    name: 'Fluorescape', elem: ['cryo', 'astro'], family: 'Beast', stage: 3, line: 'snoozaque', role: 'Fluorescent crooner — crystal beams and mirrorball dazzle',
    base: B(13, 15, 12, 7, 13), radius: 1.05,
    basic: { type: 'melee', power: 17, range: 2.1, rate: 0.85 },
    start: ['fluorescent_adolescent', 'better_be_a_mirrorball'],
    moves: [
      { id: 'star_treatment', how: { activity: { id: 'karaoke', n: 5 } }, hint: 'Give it the star treatment: 5 nights of karaoke.' },
      { id: 'four_out_of_five', how: { battle: { ev: 'crit', n: 40 } }, hint: 'Land 40 critical hits.' },
      { id: 'piledriver_waltz', how: { start: true }, hint: 'It still has the knuckles.' },
    ],
    passives: [
      { id: 'body_paint', how: { start: true }, hint: 'Born glowing.' },
      { id: 'still_take_you_home', how: { battle: { ev: 'perfect_dodge', n: 5 } }, hint: 'Perfectly dodge 5 attacks.' },
    ],
    ult: 'tranquility_base', ...ULT(90),
    gimmick: { id: 'blacklight', name: 'Blacklight', desc: 'Every crystal glows at once: a regrowing shield, +25% elemental damage, shields 20% stronger.', shield: 0.2, mods: { elmMul: 1.25, shieldRegen: 0.02, shieldMul: 1.2 } },
    evolve: [], temper: 'territorial', catch: 0, bond: 60, exp: 250,
    personality: 'A giant midnight-violet ape in glowing fluorite-crystal armour, with a long slicked-back mane and sleepy eyes that shine. Conjures ice mirrorballs and croons to them with its eyes closed.',
  },
};
