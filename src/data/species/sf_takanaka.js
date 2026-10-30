// Talonaka → Takaptain / Hawkabunga (a Masayoshi Takanaka homage; "taka" is Japanese for hawk) — gameplay data
// (models: src/vx/mons/<id>.js, shared parts in src/vx/mons/takanaka_parts.js). A tropical guitar eaglet in an
// aloha shirt that splits into the Captain (white uniform, captain's hat, a ship's-wheel guitar) or the Surfer
// (riding the surfboard guitar). The split is decided by how it fights: parry more than you dodge and it takes
// the helm; dodge more than you parry and it rides the wave (strictly more — the two never both apply).
// Format: src/data/species/sf_lines.js. Moves: src/data/moves/sf_takanaka.js.
const B = (dmg, elm, def, spd, hp) => ({ dmg, elm, def, spd, hp });
const SW = { battle: { ev: 'switch_in', n: 10 } }, SWH = 'Switch it back into battle 10 times.';
const ULT = (n) => ({ ultHow: { battle: { ev: 'bond_secs', n } }, ultHint: `Stay bonded for ${n} s in total.` });

export const SPECIES = {
  talonaka: {
    name: 'Talonaka', elem: 'aero', family: 'Bird', stage: 1, line: 'talonaka', role: 'Groovy skirmisher — guitar riffs, lagoon heals and take-off dashes',
    base: B(7, 8, 5, 8, 6), radius: 0.42,
    basic: { type: 'ranged', power: 9, range: 5, rate: 0.55, speed: 14 },
    start: ['blue_lagoon', 'ready_to_fly'],
    moves: [
      { id: 'brasilian_skies', how: { level: 9 }, hint: 'Reach Lv.9.' },
      { id: 'tokio_express', how: { activity: { id: 'karaoke', n: 2 } }, hint: 'Jam at karaoke twice — it learns the express riff.' },
      { id: 'chala_mon_mai_anou', how: { eat: { tag: 'fruit', n: 5 } }, hint: 'Share 5 fruity treats, island style.' },
    ],
    passives: [
      { id: 'aloha_spirit', how: { explore: 'minoh_waterfall' }, hint: 'Listen to the Minoh waterfall together — it reminds it of the sea.' },
      { id: 'comeback_punch', how: SW, hint: SWH },
    ],
    ult: 'seychelles', ...ULT(60),
    gimmick: { id: 'city_pop_groove', name: 'City-Pop Groove', desc: 'Slips into the groove: +15% speed, on-beat hits +30% and a wider beat window.', mods: { spdMul: 1.15, beatMul: 1.3, beatWindow: 0.12 } },
    evolve: [
      { to: 'takaptain', cond: { level: 26, more: ['perfect_parry', 'perfect_dodge'] }, hint: 'Reach Lv.26 having parried more attacks than you dodged — it stands firm and takes the helm as the Captain.' },
      { to: 'hawkabunga', cond: { level: 26, more: ['perfect_dodge', 'perfect_parry'] }, hint: 'Reach Lv.26 having dodged more attacks than you parried — it learns to ride the wave as the Surfer.' },
    ],
    temper: 'curious', catch: 0.45, bond: 60, exp: 60, personality: 'A chubby bald eaglet with a shaggy dark mop, a teal aloha shirt and a red sunburst guitar it never puts down. Lives on island time and solos at the sunset.',
  },
  takaptain: {
    name: 'Takaptain', elem: ['hydro', 'aero'], family: 'Bird', stage: 2, line: 'talonaka', role: 'Commanding tank — helm rams, crew shields, broadside riffs',
    base: B(12, 12, 14, 8, 13), radius: 0.85,
    basic: { type: 'melee', power: 15, range: 1.9, rate: 0.65 },
    start: ['full_speed_ahead', 'all_hands_on_deck'],
    moves: [
      { id: 'oh_tengo_suerte', how: { battle: { ev: 'crit', n: 20 } }, hint: 'Land 20 critical hits — lucky, lucky Captain.' },
      { id: 'saudade', how: { battle: { ev: 'heal', n: 500 } }, hint: 'Heal 500 HP in battle.' },
      { id: 'brasilian_skies', how: { start: true }, hint: 'It still knows the old samba run.' },
    ],
    passives: [
      { id: 'captains_log', how: { battle: { ev: 'shield_ally', n: 15 } }, hint: 'Shield teammates 15 times.' },
      { id: 'sea_legs', how: { battle: { ev: 'perfect_parry', n: 20 } }, hint: 'Perfectly parry 20 attacks.' },
    ],
    ult: 'an_insatiable_high', ...ULT(90),
    gimmick: { id: 'at_the_helm', name: 'At the Helm', desc: 'Takes the wheel: a shield, −15% damage taken, +15% elemental damage and no knockback.', shield: 0.2, mods: { takenMul: 0.85, elmMul: 1.15, knockImmune: true } },
    evolve: [], temper: 'territorial', catch: 0, bond: 65, exp: 245, personality: 'The Captain: a tall bald eagle in a crisp white double-breasted uniform and a gold-leaf captain\'s hat, the aloha collar still open underneath. Steers with a ship\'s-wheel guitar, salutes everyone, dances the hornpipe on deck.',
  },
  hawkabunga: {
    name: 'Hawkabunga', elem: ['hydro', 'echo'], family: 'Bird', stage: 2, line: 'talonaka', role: 'Surfing striker — wave carves, storm squalls, dizzy jives',
    base: B(14, 12, 8, 15, 10), radius: 0.85,
    basic: { type: 'melee', power: 14, range: 1.8, rate: 0.5 },
    start: ['hang_ten', 'thunder_storm'],
    moves: [
      { id: 'jolly_jive', how: { battle: { ev: 'on_beat', n: 25 } }, hint: 'Land 25 on-beat hits.' },
      { id: 'sweet_agnes', how: { eat: { tag: 'sweet', n: 6 } }, hint: 'Share 6 sweet treats on the beach.' },
      { id: 'tokio_express', how: { start: true }, hint: 'It still rides the express riff.' },
    ],
    passives: [
      { id: 'stoked', how: { battle: { ev: 'perfect_dodge', n: 20 } }, hint: 'Perfectly dodge 20 attacks.' },
      { id: 'sea_legs', how: { battle: { ev: 'drowned', n: 5 } }, hint: 'Nearly drown 5 times — every surfer wipes out.' },
    ],
    ult: 'the_t_wave', ...ULT(90),
    gimmick: { id: 'on_the_wave', name: 'On the Wave', desc: 'Catches the perfect wave: +25% speed, +15% physical damage, dodge recharges faster.', mods: { spdMul: 1.25, physMul: 1.15, dodgeCd: 0.75 } },
    evolve: [], temper: 'curious', catch: 0, bond: 70, exp: 245, personality: 'The Surfer: a lean bald eagle with a long sun-bleached mop, a coral aloha shirt flapping open and teal hibiscus board shorts, riding a surfboard that is also its guitar. Stands it on its tail to shred a solo, then paddles back out.',
  },
};
