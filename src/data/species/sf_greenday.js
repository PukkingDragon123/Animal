// The Green Day line — gameplay data (models: src/vx/mons/grenaday.js, armagreddon.js; moves:
// src/data/moves/sf_greenday.js). Format: src/data/species/sf_lines.js. Stats B(DMG, ELM, DEF, SPD, HP).
//   Grenaday → Armagreddon: a punk hand grenade that grows into a giant nuclear bomb whose ultimate
//   (Last Night on Earth) blows up the whole field and knocks itself out (the self-KO needs the sim's
//   'recoil' effect — see the moves file).
const B = (dmg, elm, def, spd, hp) => ({ dmg, elm, def, spd, hp });
const SW = { battle: { ev: 'switch_in', n: 10 } }, SWH = 'Switch it back into battle 10 times.';
const ULT = (n) => ({ ultHow: { battle: { ev: 'bond_secs', n } }, ultHint: `Stay bonded for ${n} s in total.` });
const INSOMNIA = { explore: { map: 'chinatown', hour: [0, 4] } }, INSOMNIAH = 'Wander Chinatown with it between midnight and 4:00 — it never sleeps anyway.';

export const SPECIES = {
  // ------------------------------------------------------------------ Grenaday → Armagreddon (Green Day)
  grenaday: {
    name: 'Grenaday', elem: 'pyro', family: 'Machine', stage: 1, line: 'grenaday', role: 'Punk demolitionist — lobbed grenades and point-blank blasts',
    base: B(7, 9, 5, 8, 5), radius: 0.36,
    basic: { type: 'melee', power: 9, range: 1.3, rate: 0.55 },
    start: ['horseshoes_and_handgrenades', 'basket_case'],
    moves: [
      { id: 'burnout', how: { level: 9 }, hint: 'Reach Lv.9.' },
      { id: 'letterbomb', how: { uses: { skill: 'horseshoes_and_handgrenades', n: 25 } }, hint: 'Lob Horseshoes and Handgrenades 25 times — then it starts mailing them.' },
      { id: 'having_a_blast', how: { battle: { ev: 'low_hp_win', n: 1 } }, hint: 'Win a battle from below 40% HP — it is having a blast.' },
    ],
    passives: [
      { id: 'brain_stew', how: INSOMNIA, hint: INSOMNIAH },
      { id: 'walking_contradiction', how: SW, hint: SWH },
    ],
    ult: 'boulevard_of_broken_dreams', ...ULT(60),
    gimmick: { id: 'pulled_pin', name: 'Pulled Pin', desc: 'Pulls its own pin and keeps it out: burning hits, +20% elemental damage, Heat builds 50% faster.', mods: { burnOnHit: 0.3, elmMul: 1.2, heatGain: 1.5 } },
    evolve: [{ to: 'armagreddon', cond: { level: 26, charged: 40 }, hint: 'Land 40 charged attacks and reach Lv.26 — let the fuse burn all the way down.' }],
    temper: 'aggressive', catch: 0.45, bond: 50, exp: 62,
    personality: 'A living pineapple grenade with a dyed-green spiky crop, heavy guyliner and a heart-shaped pin ring. Pulls its own pin when it is bored — and always regrets it.',
  },
  armagreddon: {
    name: 'Armagreddon', elem: ['nucleo', 'pyro'], family: 'Machine', stage: 2, line: 'grenaday', role: 'Doomsday heavy — radioactive blasts and a last-resort nuke',
    base: B(13, 16, 11, 6, 13), radius: 1.0,
    basic: { type: 'melee', power: 16, range: 2.0, rate: 0.85 },
    start: ['american_idiot', 'twenty_one_guns'],
    moves: [
      { id: 'know_your_enemy', how: { battle: { ev: 'ko', n: 25 } }, hint: 'Knock out 25 foes.' },
      { id: 'holiday', how: { activity: { id: 'hangout', n: 3 } }, hint: 'Hang out with friends 3 times — even a bomb needs a holiday.' },
      { id: 'give_me_novacaine', how: { battle: { ev: 'hit_taken', n: 80 } }, hint: 'Take 80 hits — it just wants to feel nothing.' },
    ],
    passives: [
      { id: 'restless_heart_syndrome', how: { start: true }, hint: 'Its core never rests.' },
      { id: 'brain_stew', how: INSOMNIA, hint: INSOMNIAH },
    ],
    ult: 'last_night_on_earth', ...ULT(90),
    gimmick: { id: 'critical_mass', name: 'Critical Mass', desc: 'Its core goes critical: radioactive skin, burning hits, +25% elemental damage — but it takes 10% more damage.', mods: { emberSkin: 0.2, burnOnHit: 0.3, elmMul: 1.25, takenMul: 1.1 } },
    evolve: [], temper: 'aggressive', catch: 0, bond: 40, exp: 245,
    personality: 'A giant nuclear bomb standing nose-down like it is already falling, a spiky green crest bursting out of its tail fins and a zipper for a mouth. Unzip it and the core glows. It counts down for fun.',
  },
};
