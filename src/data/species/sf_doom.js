// Metalfang → Wyvillain → Doomsdrake (an MF DOOM homage) — gameplay data (models: src/vx/mons/<id>.js,
// shared parts in src/vx/mons/doom_parts.js). A little Draco wyvern in a riveted metal face mask that
// sips from an unlabelled brown bottle, pulls up a hooded cloak, and finally suits up in villain iron as
// "the Doom". Format: src/data/species/sf_lines.js. Moves: src/data/moves/sf_doom.js.
const B = (dmg, elm, def, spd, hp) => ({ dmg, elm, def, spd, hp });
const SW = { battle: { ev: 'switch_in', n: 10 } }, SWH = 'Switch it back into battle 10 times.';
const ULT = (n) => ({ ultHow: { battle: { ev: 'bond_secs', n } }, ultHint: `Stay bonded for ${n} s in total.` });

export const SPECIES = {
  metalfang: {
    name: 'Metalfang', elem: 'draco', family: 'Dragon', stage: 1, line: 'metalfang', role: 'Masked mischief — bottle-burp fire and rhyme-dime volleys',
    base: B(7, 9, 6, 7, 6), radius: 0.4,
    basic: { type: 'ranged', power: 9, range: 5, rate: 0.6, speed: 13 },
    start: ['one_beer', 'rhymes_like_dimes'],
    moves: [
      { id: 'the_mic', how: { level: 8 }, hint: 'Reach Lv.8 — it finds a microphone and won\'t give it back.' },
      { id: 'kon_karne', how: { eat: { tag: 'spicy', n: 4 } }, hint: 'Share 4 spicy dishes with it. Mm… food.' },
      { id: 'potholderz', how: { battle: { ev: 'burned', n: 6 } }, hint: 'Get burned 6 times — it learns to hold the hot stuff.' },
    ],
    passives: [
      { id: 'mm_food', how: { eat: { tag: 'fizzy', n: 5 } }, hint: 'Share 5 fizzy drinks with it.' },
      { id: 'comeback_punch', how: SW, hint: SWH },
    ],
    ult: 'madvillainy', ...ULT(60),
    gimmick: { id: 'metal_face_mask', name: 'Metal Face', desc: 'Tightens the mask straps: +15% elemental damage, +10% crit chance, immune to blind.', mods: { elmMul: 1.15, critChance: 0.1, immune: ['blind'] } },
    evolve: [{ to: 'wyvillain', cond: { level: 16, activity: { id: 'karaoke', n: 3 } }, hint: 'Reach Lv.16 after spitting bars at karaoke 3 times — it pulls up a hooded cloak.' }],
    temper: 'curious', catch: 0.45, bond: 50, exp: 60, personality: 'A pocket-sized wyvern in a riveted metal mask that never, ever comes off. Sips from a plain brown bottle, burps sparks, and mumbles rhymes under its breath.',
  },
  wyvillain: {
    name: 'Wyvillain', elem: ['draco', 'ecto'], family: 'Dragon', stage: 2, line: 'metalfang', role: 'Hooded ambusher — shadow raids, wheezing accordion waves, gas clouds',
    base: B(10, 11, 7, 10, 8), radius: 0.6,
    basic: { type: 'ranged', power: 12, range: 6, rate: 0.6, speed: 14 },
    start: ['rap_ambush', 'accordion'],
    moves: [
      { id: 'gas_drawls', how: { level: 22 }, hint: 'Reach Lv.22.' },
      { id: 'curls', how: { battle: { ev: 'perfect_dodge', n: 8 } }, hint: 'Perfectly dodge 8 attacks — slip away like smoke.' },
      { id: 'fancy_clown', how: { battle: { ev: 'emote', n: 8 } }, hint: 'Taunt and show off 8 times in battle.' },
    ],
    passives: [
      { id: 'illest_villains', how: { battle: { ev: 'ko', n: 15 } }, hint: 'Knock out 15 foes.' },
      { id: 'mm_food', how: { eat: { tag: 'fizzy', n: 5 } }, hint: 'Share 5 fizzy drinks with it.' },
    ],
    ult: 'madvillainy', ...ULT(90),
    gimmick: { id: 'hood_up', name: 'Hood Up', desc: 'Pulls the hood low: +20% speed, +15% elemental damage, dodge recharges 25% faster.', mods: { spdMul: 1.2, elmMul: 1.15, dodgeCd: 0.75 } },
    evolve: [{ to: 'doomsdrake', cond: { level: 34, battle: { ev: 'ko', n: 30 } }, hint: 'Reach Lv.34 after knocking out 30 foes — the villain suits up in iron and becomes the Doom.' }],
    temper: 'skittish', catch: 0.15, bond: 45, exp: 150, personality: 'Wears a ragged green hooded cloak over the mask and only talks in rhymes. Nobody has seen its face. Nobody ever will.',
  },
  doomsdrake: {
    name: 'Doomsdrake', elem: ['draco', 'ferro'], family: 'Dragon', stage: 3, line: 'metalfang', role: 'Iron supervillain — fazer beams, meat-grinder spins, doomsday meteors',
    base: B(14, 16, 12, 9, 12), radius: 1.0,
    basic: { type: 'ranged', power: 16, range: 7, rate: 0.65, speed: 15 },
    start: ['fazers', 'meat_grinder'],
    moves: [
      { id: 'anti_matter', how: { battle: { ev: 'ko', n: 40 } }, hint: 'Knock out 40 foes.' },
      { id: 'all_caps', how: { level: 40 }, hint: 'Reach Lv.40 — REMEMBER, ALL CAPS WHEN YOU SPELL THE NAME.' },
      { id: 'red_and_gold', how: { battle: { ev: 'shield_block', n: 400 } }, hint: 'Absorb 400 damage with shields.' },
    ],
    passives: [
      { id: 'supervillain', how: { start: true }, hint: 'Born in iron.' },
      { id: 'illest_villains', how: { battle: { ev: 'ko', n: 15 } }, hint: 'Knock out 15 foes.' },
    ],
    ult: 'operation_doomsday', ...ULT(90),
    gimmick: { id: 'villain_iron', name: 'Villain Iron', desc: 'The cloak flares and the armour locks: −15% damage taken, +20% elemental damage, immune to knockback.', mods: { takenMul: 0.85, elmMul: 1.2, knockImmune: true } },
    evolve: [], temper: 'territorial', catch: 0, bond: 40, exp: 250, personality: 'The Doom: a towering dragon in riveted iron armour, a gold-buckled belt and a long hooded cloak, its metal face lit from inside. Plays the villain on purpose — and always has the last verse.',
  },
};
