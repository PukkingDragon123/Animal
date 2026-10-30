// Rainblin → Roygbot (an original homage to the seven rainbow goblins and Takanaka's The Rainbow Goblins album) —
// gameplay data (models: src/vx/mons/<id>.js, shared parts in src/vx/mons/goblin_parts.js). Every Rainblin is one
// of seven colours (red, orange, yellow, green, blue, indigo, violet), picked by its look seed (the model's first
// appearance tier). Own seven and one of them evolves: the other six merge in and the seven become Roygbot, a
// mech run by seven little goblin robots (the engine's squad condition, consume: true).
// Format: src/data/species/sf_lines.js. Moves: src/data/moves/sf_goblins.js.
const B = (dmg, elm, def, spd, hp) => ({ dmg, elm, def, spd, hp });
const SW = { battle: { ev: 'switch_in', n: 10 } }, SWH = 'Switch it back into battle 10 times.';
const ULT = (n) => ({ ultHow: { battle: { ev: 'bond_secs', n } }, ultHint: `Stay bonded for ${n} s in total.` });

export const SPECIES = {
  rainblin: {
    name: 'Rainblin', elem: 'ecto', family: 'Spirit', stage: 1, line: 'rainblin', role: 'Mischief trickster — lasso grabs, colour gobbling, goblin doubles',
    base: B(7, 8, 5, 9, 5), radius: 0.38,
    basic: { type: 'melee', power: 8, range: 1.3, rate: 0.45 },
    start: ['lasso_the_rainbow', 'gobble_de_hue'],
    moves: [
      { id: 'roy_g_bite', how: { level: 8 }, hint: 'Reach Lv.8.' },
      { id: 'seven_goblins', how: { battle: { ev: 'emote', n: 7 } }, hint: 'Show off 7 times in battle — one for each goblin.' },
      { id: 'just_before_sunset', how: { eat: { tag: 'sweet', n: 7 } }, hint: 'Share 7 sweet treats — goblins snack until sunset.' },
    ],
    passives: [
      { id: 'goblin_mode', how: { battle: { ev: 'crit', n: 7 } }, hint: 'Land 7 critical hits.' },
      { id: 'comeback_punch', how: SW, hint: SWH },
    ],
    ult: 'rainbow_valley', ...ULT(60),
    gimmick: { id: 'colour_rush', name: 'Colour Rush', desc: 'Drunk on rainbow: +15% speed, +10% crit chance and its hits heal it a little.', mods: { spdMul: 1.15, critChance: 0.1, lifesteal: 0.08 } },
    evolve: [{ to: 'roygbot', cond: { squad: { of: ['rainblin'], n: 7, consume: true, label: 'Rainbow goblins' } }, hint: 'Gather 7 Rainblins in your team and box (a full rainbow is best!) — the seven merge into one machine.' }],
    temper: 'skittish', catch: 0.5, bond: 45, exp: 52, personality: 'A squat little goblin with huge ears, a long nose and two tusks, dressed head to toe in its own colour. Lassos rainbows and slurps them down like noodles. There are seven of them, and they always find each other.',
  },
  roygbot: {
    name: 'Roygbot', elem: ['ferro', 'astro'], family: 'Machine', stage: 2, line: 'rainblin', role: 'Seven-pilot mech — rainbow beams, rocket punches, light walls',
    base: B(13, 15, 14, 9, 14), radius: 1.0,
    basic: { type: 'melee', power: 17, range: 2.1, rate: 0.7 },
    start: ['roy_g_blast', 'rocket_rainbow_punch'],
    moves: [
      { id: 'crew_roll_call', how: { battle: { ev: 'win', n: 7 } }, hint: 'Win 7 battles — the crew learns its roll call.' },
      { id: 'prism_wall', how: { battle: { ev: 'shield_block', n: 300 } }, hint: 'Absorb 300 damage with shields.' },
      { id: 'pot_o_gold_rush', how: { level: 40 }, hint: 'Reach Lv.40.' },
    ],
    passives: [
      { id: 'seven_strong', how: { start: true }, hint: 'Seven pilots, one machine.' },
      { id: 'goblin_mode', how: { battle: { ev: 'crit', n: 7 } }, hint: 'Land 7 critical hits.' },
    ],
    ult: 'rainbow_paradise', ...ULT(90),
    gimmick: { id: 'full_spectrum', name: 'Full Spectrum', desc: 'All seven pilots at full power: +20% damage, −15% damage taken, immune to knockback.', mods: { dmgMul: 1.2, takenMul: 0.85, knockImmune: true } },
    evolve: [], temper: 'territorial', catch: 0, bond: 60, exp: 260, personality: 'Seven Rainblins rebuilt as one big white battle mech with a rainbow arc behind it. Red captains from the head dome, Orange, Yellow and Green drive from the chest, Blue and Indigo ride the shoulders, Violet minds the engine. They argue constantly and never miss.',
  },
};
