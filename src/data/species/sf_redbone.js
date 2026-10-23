// Blowhale → Tartanic (a Redbone homage) — gameplay data (models: src/vx/mons/<id>.js, shared parts in
// src/vx/mons/redbone_parts.js). A floating balloon whale whose body is a stitched tartan-and-leather bag
// (a bagpipe bag with flukes) and a red bone spine down its back; it drifts along on a slow funk groove.
// Format: src/data/species/sf_lines.js. Moves: src/data/moves/sf_redbone.js.
const B = (dmg, elm, def, spd, hp) => ({ dmg, elm, def, spd, hp });
const SW = { battle: { ev: 'switch_in', n: 10 } }, SWH = 'Switch it back into battle 10 times.';
const ULT = (n) => ({ ultHow: { battle: { ev: 'bond_secs', n } }, ultHint: `Stay bonded for ${n} s in total.` });

export const SPECIES = {
  blowhale: {
    name: 'Blowhale', elem: ['aero', 'echo'], family: 'Aquatic', stage: 1, line: 'blowhale', role: 'Floaty groover — drum-belly shockwaves and slow funk heals',
    base: B(5, 9, 7, 4, 9), radius: 0.5,
    basic: { type: 'ranged', power: 8, range: 5, rate: 0.8, speed: 10 },
    start: ['message_from_a_drum', 'niki_hoeky'],
    moves: [
      { id: 'maggie', how: { friendship: 120 }, hint: 'Become good friends — it hums a sweet song for you.' },
      { id: 'witch_queen', how: { explore: 'minoh_bamboo' }, hint: 'Drift through the haunted Bamboo Trail together — the Witch Queen is out tonight.' },
      { id: 'crazy_cajun_cakewalk', how: { battle: { ev: 'on_beat', n: 15 } }, hint: 'Land 15 on-beat hits.' },
    ],
    passives: [
      { id: 'stay_woke', how: { activity: { id: 'listen', n: 2 } }, hint: 'Listen to records together twice. Stay woke.' },
      { id: 'comeback_punch', how: SW, hint: SWH },
    ],
    ult: 'come_and_get_your_love', ...ULT(60),
    gimmick: { id: 'tartan_bellows', name: 'Tartan Bellows', desc: 'Puffs itself up like a pipe bag: a shield, +20% defense and +15% elemental damage.', shield: 0.15, mods: { defMul: 1.2, elmMul: 1.15 } },
    evolve: [{ to: 'tartanic', cond: { level: 20, weather: 'fog' }, hint: 'Reach Lv.20, then level it up on a foggy morning — it swallows the fog and swells into a giant.' }],
    temper: 'curious', catch: 0.45, bond: 60, exp: 60, personality: 'A little balloon whale stitched from tartan and leather, with a red bone spine down its back. Floats along on a slow funk groove and squeaks like a set of bagpipes when you squeeze it.',
  },
  tartanic: {
    name: 'Tartanic', elem: ['aero', 'echo'], family: 'Aquatic', stage: 2, line: 'blowhale', role: 'Sky tank — bagpipe-drone blasts, cyclone grooves, team heals',
    base: B(9, 15, 11, 5, 14), radius: 1.15,
    basic: { type: 'ranged', power: 14, range: 6, rate: 0.8, speed: 11 },
    start: ['redbone_wail', 'cycles_spin'],
    moves: [
      { id: 'already_here', how: { level: 28 }, hint: 'Reach Lv.28.' },
      { id: 'witch_queen', how: { start: true }, hint: 'It still knows the Witch Queen.' },
      { id: 'maggie', how: { start: true }, hint: 'Its sweetest song.' },
    ],
    passives: [
      { id: 'red_bone_spine', how: { battle: { ev: 'hit_taken', n: 60 } }, hint: 'Take 60 hits on its tartan hide.' },
      { id: 'stay_woke', how: { activity: { id: 'listen', n: 2 } }, hint: 'Listen to records together twice. Stay woke.' },
    ],
    ult: 'come_and_get_your_love', ...ULT(90),
    gimmick: { id: 'full_skirl', name: 'Full Skirl', desc: 'Every drone sounds at once: a big shield, +25% defense, +20% elemental damage, heals 10%.', heal: 0.1, shield: 0.25, mods: { defMul: 1.25, elmMul: 1.2, knockImmune: true } },
    evolve: [], temper: 'calm', catch: 0.05, bond: 70, exp: 220, personality: 'A giant tartan balloon whale that drifts over the bay with three bagpipe drones on its back and a glossy red bone spine. It moves at exactly one speed: slow funk.',
  },
};
