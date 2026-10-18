// San Francisco legendaries — gameplay data (docs/ROSTER.md). Strong (stat sum 80+) and rare.
// Moves: src/data/moves/sf_wild.js.
const B = (dmg, elm, def, spd, hp) => ({ dmg, elm, def, spd, hp });

export const SPECIES = {
  blackvolt: {
    name: 'Blackvolt', elem: ['volto', 'aero'], family: 'Legend', stage: 3, legendary: true, role: 'Legendary thunderbird — blackouts, silver lightning, tolling bells',
    base: B(18, 20, 13, 16, 18), radius: 1.8,
    basic: { type: 'ranged', power: 18, range: 9, rate: 0.75, speed: 22 },
    start: ['back_in_black', 'shoot_to_thrill'],
    moves: [
      { id: 'tolling_bell', how: { level: 50 }, hint: 'Reach Lv.50.' },
      { id: 'rock_and_roll_aint_noise', how: { battle: { ev: 'on_beat', n: 100 } }, hint: 'Land 100 on-beat hits.' },
    ],
    passives: [{ id: 'silver_lightning', how: { start: true }, hint: 'Its birthright.' }],
    ult: 'thunderstruck', ultHow: { battle: { ev: 'bond_secs', n: 120 } }, ultHint: 'Stay bonded for 2 minutes in total.',
    gimmick: { id: 'black_thunder', name: 'Black Thunder', desc: 'The sky goes black: a shield, +30% elemental damage, +20% speed, +12% crit chance.', shield: 0.2, mods: { elmMul: 1.3, spdMul: 1.2, critChance: 0.12 } },
    evolve: [], temper: 'territorial', catch: 0.03, bond: 40, exp: 900, personality: 'An all-black thunderbird with silver lightning in its feathers and a great bell that tolls when it lands. When it returns, the whole city goes back in black.',
  },
  prismoon: {
    name: 'Prismoon', elem: ['astro', 'ecto'], family: 'Legend', stage: 3, legendary: true, role: 'Legendary prism dragon — rainbow beams, eclipses, rewinding time',
    base: B(15, 23, 14, 12, 20), radius: 2.0,
    basic: { type: 'ranged', power: 17, range: 10, rate: 0.8, speed: 18 },
    start: ['prism_beam', 'eclipse'],
    moves: [
      { id: 'time_rewind', how: { level: 50 }, hint: 'Reach Lv.50. Ticking away the moments…' },
      { id: 'great_gig_in_the_sky', how: { battle: { ev: 'bond_secs', n: 120 } }, hint: 'Stay bonded for 2 minutes in total.' },
      { id: 'any_colour_you_like', how: { battle: { ev: 'reaction', n: 20 } }, hint: 'Trigger 20 elemental reactions.' },
    ],
    passives: [{ id: 'dark_side', how: { start: true }, hint: 'Its birthright.' }],
    ult: 'dark_side_of_the_moon', ultHow: { battle: { ev: 'bond_secs', n: 120 } }, ultHint: 'Stay bonded for 2 minutes in total.',
    gimmick: { id: 'prism_crown', name: 'Prism Crown', desc: 'Light pours through its head: a shield, +30% elemental damage, +10% crit chance, shorter cooldowns.', shield: 0.2, mods: { elmMul: 1.3, critChance: 0.1, cdMul: 0.85 } },
    evolve: [], temper: 'curious', catch: 0.03, bond: 40, exp: 900, personality: 'A black crystal dragon whose prism head splits every ray of light into a rainbow. Some say it has no dark side — it\'s all dark.',
  },
};
