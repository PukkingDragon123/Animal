// The Kissmet line — gameplay data (models: src/vx/mons/<id>.js, shared parts kiss_parts.js).
// A KISS homage: a goth Draco chimera (lion, eagle, snake and turtle in one) that grows into the
// full chimera, then — holding a Greasepaint Stone — splits into one of four masked legends, each
// leaning into one of its animals. Original designs only: no logos, no likenesses.
// Format: docs/GAMEPLAY.md (see sf_lines.js). Stats B(DMG, ELM, DEF, SPD, HP) at level 1.
// Moves: src/data/moves/sf_kiss.js.
const B = (dmg, elm, def, spd, hp) => ({ dmg, elm, def, spd, hp });
const ULT = (n) => ({ ultHow: { battle: { ev: 'bond_secs', n } }, ultHint: `Stay bonded for ${n} s in total.` });
// the stone split: four hour windows that tile the whole day, so exactly one branch can match
const STONE = 'greasepaint_stone';

export const SPECIES = {
  // ------------------------------------------------------------------ Kissmet → Kissmera → Demonaconda | Starstrut | Spaceshell | Purrcussion (KISS)
  kissmet: {
    name: 'Kissmet', elem: 'draco', family: 'Dragon', stage: 1, line: 'kissmet', role: 'Goth chimera cub — studded swipes, four-headed roars',
    base: B(8, 7, 6, 7, 6), radius: 0.4,
    basic: { type: 'melee', power: 9, range: 1.4, rate: 0.55 },
    start: ['deuce', 'shout_it_out_loud'],
    moves: [
      { id: 'firehouse', how: { eat: { tag: 'spicy', n: 4 } }, hint: 'Share 4 spicy snacks — the snake tail starts spitting fire.' },
      { id: 'strutter', how: { battle: { ev: 'on_beat', n: 15 } }, hint: 'Land 15 on-beat hits — it struts in its platform boots.' },
      { id: 'nothin_to_lose', how: { battle: { ev: 'low_hp_win', n: 1 } }, hint: 'Win from below 40% HP.' },
    ],
    passives: [
      { id: 'greasepaint', how: { level: 6 }, hint: 'Reach Lv.6 — its face paint sets.' },
      { id: 'dressed_to_kill', how: { battle: { ev: 'emote', n: 8 } }, hint: 'Show off for the crowd 8 times in battle.' },
    ],
    ult: 'rock_and_roll_all_nite', ...ULT(60),
    gimmick: { id: 'four_hearts', name: 'Four Hearts', desc: 'Lion, eagle, snake and turtle beat as one: +15% physical damage, +10% defense, +10% crit chance.', mods: { physMul: 1.15, defMul: 1.1, critChance: 0.1 } },
    evolve: [{ to: 'kissmera', cond: { level: 18 }, hint: 'Reach Lv.18 — the cub grows into the full chimera.' }],
    temper: 'curious', catch: 0.35, bond: 55, exp: 62, personality: 'A goth chimera cub: a lion\'s mane, little eagle wings, a turtle shell on its back and a snake for a tail — all four with opinions. Black-and-white star paint, platform-boot paws, studded leather. Sticks its tongue out at everyone.',
  },
  kissmera: {
    name: 'Kissmera', elem: ['draco', 'ecto'], family: 'Dragon', stage: 2, line: 'kissmet', role: 'Goth chimera bruiser — four-legged charges, night curses',
    base: B(11, 10, 8, 9, 8), radius: 0.75,
    basic: { type: 'melee', power: 13, range: 1.8, rate: 0.6 },
    start: ['detroit_rock_city', 'creatures_of_the_night'],
    moves: [
      { id: 'i_love_it_loud', how: { battle: { ev: 'stun', n: 10 } }, hint: 'Stun 10 foes.' },
      { id: 'psycho_circus', how: { activity: { id: 'arcade', n: 2 } }, hint: 'Play at the arcade twice — welcome to the show.' },
      { id: 'firehouse', how: { eat: { tag: 'spicy', n: 4 } }, hint: 'Share 4 spicy snacks.' },
    ],
    passives: [
      { id: 'greasepaint', how: { level: 18 }, hint: 'Its face paint sets.' },
      { id: 'destroyer', how: { battle: { ev: 'ko', n: 15 } }, hint: 'Knock out 15 foes.' },
    ],
    ult: 'rock_and_roll_all_nite', ...ULT(90),
    gimmick: { id: 'chimera_rising', name: 'Chimera Rising', desc: 'All four heads wake at once: +20% physical damage, +15% defense, immune to knockback.', mods: { physMul: 1.2, defMul: 1.15, knockImmune: true } },
    evolve: [
      { to: 'demonaconda', cond: { level: 32, holding: STONE, hours: [0, 6] }, hint: 'At Lv.32, hold a Greasepaint Stone after midnight (0:00–6:00) — the serpent wakes as the Demon.' },
      { to: 'spaceshell', cond: { level: 32, holding: STONE, hours: [6, 12] }, hint: 'At Lv.32, hold a Greasepaint Stone in the morning (6:00–12:00) — the turtle shell launches as the Spaceman.' },
      { to: 'purrcussion', cond: { level: 32, holding: STONE, hours: [12, 18] }, hint: 'At Lv.32, hold a Greasepaint Stone in the afternoon (12:00–18:00) — the lion takes the drum riser as the Catman.' },
      { to: 'starstrut', cond: { level: 32, holding: STONE, hours: [18, 24] }, hint: 'At Lv.32, hold a Greasepaint Stone at showtime (18:00–24:00) — the eagle steps into the spotlight as the Starchild.' },
    ],
    temper: 'territorial', catch: 0.12, bond: 45, exp: 155, personality: 'The full goth chimera: a black-maned lion with eagle wings and talons, a studded turtle shell for armour and a hissing snake for a tail. Four faces under one coat of greasepaint — and every one of them wants the spotlight.',
  },
  demonaconda: {
    name: 'Demonaconda', elem: ['draco', 'pyro'], family: 'Dragon', stage: 3, line: 'kissmet', role: 'Fire-breathing serpent — tongue grabs, thunder, siege slams',
    base: B(16, 14, 9, 9, 11), radius: 1.0,
    basic: { type: 'melee', power: 17, range: 2.1, rate: 0.7 },
    start: ['god_of_thunder', 'lick_it_up'],
    moves: [
      { id: 'war_machine', how: { battle: { ev: 'ko', n: 30 } }, hint: 'Knock out 30 foes.' },
      { id: 'unholy', how: { battle: { ev: 'burned', n: 10 } }, hint: 'Get burned 10 times. It only spits back blacker.' },
      { id: 'firehouse', how: { start: true }, hint: 'It never stopped breathing fire.' },
    ],
    passives: [
      { id: 'hotter_than_hell', how: { start: true }, hint: 'Born in fire.' },
      { id: 'destroyer', how: { battle: { ev: 'ko', n: 15 } }, hint: 'Knock out 15 foes.' },
    ],
    ult: 'heavens_on_fire', ...ULT(90),
    gimmick: { id: 'bat_wing_armour', name: 'Bat-Wing Armour', desc: 'Its bat wings flare and its armour glows: burning hits, burning skin, +15% physical damage.', mods: { burnOnHit: 0.35, emberSkin: 0.15, physMul: 1.15 } },
    evolve: [], temper: 'aggressive', catch: 0, bond: 35, exp: 250, personality: 'The Demon: a blood-red serpent in spiked black armour with bat wings, a topknot of black hair and a tongue that never ends. Breathes fire, spits stage-blood, and swears it\'s the god of thunder.',
  },
  starstrut: {
    name: 'Starstrut', elem: ['draco', 'aero'], family: 'Dragon', stage: 3, line: 'kissmet', role: 'Glam striker-caster — star shots, ballads, wing storms',
    base: B(12, 15, 7, 15, 9), radius: 0.85,
    basic: { type: 'ranged', power: 13, range: 7, rate: 0.6, speed: 16 },
    start: ['love_gun', 'i_was_made_for_lovin_you'],
    moves: [
      { id: 'tears_are_falling', how: { battle: { ev: 'perfect_dodge', n: 8 } }, hint: 'Perfectly dodge 8 attacks.' },
      { id: 'sure_know_something', how: { battle: { ev: 'crit', n: 25 } }, hint: 'Land 25 critical hits.' },
      { id: 'strutter', how: { start: true }, hint: 'It never stopped strutting.' },
    ],
    passives: [
      { id: 'calling_dr_love', how: { activity: { id: 'karaoke', n: 2 } }, hint: 'Sing at karaoke twice.' },
      { id: 'dressed_to_kill', how: { battle: { ev: 'emote', n: 8 } }, hint: 'Show off for the crowd 8 times.' },
    ],
    ult: 'crazy_crazy_nights', ...ULT(90),
    gimmick: { id: 'star_eye', name: 'Star Eye', desc: 'The painted star over its eye blazes: +20% elemental damage, +15% speed, +10% crit chance.', mods: { elmMul: 1.2, spdMul: 1.15, critChance: 0.1 } },
    evolve: [], temper: 'curious', catch: 0, bond: 75, exp: 250, personality: 'The Starchild: a flamboyant black eagle with a painted star over one eye, a bare chest of white feathers, a lion\'s black mane and towering platform boots. Struts, poses, and croons ballads to the crowd.',
  },
  spaceshell: {
    name: 'Spaceshell', elem: ['draco', 'astro'], family: 'Dragon', stage: 3, line: 'kissmet', role: 'Cosmic shell tank — smoking-guitar bolts, torpedoes, rocket rides',
    base: B(10, 16, 14, 8, 11), radius: 0.95,
    basic: { type: 'ranged', power: 13, range: 7, rate: 0.7, speed: 14 },
    start: ['shock_me', 'torpedo_girl'],
    moves: [
      { id: 'cold_gin', how: { eat: { tag: 'cold', n: 5 } }, hint: 'Share 5 cold treats.' },
      { id: 'parasite', how: { battle: { ev: 'reaction', n: 10 } }, hint: 'Trigger 10 elemental reactions.' },
      { id: 'shout_it_out_loud', how: { start: true }, hint: 'Still remembers the roar.' },
    ],
    passives: [
      { id: 'mr_speed', how: { battle: { ev: 'perfect_dodge', n: 10 } }, hint: 'Perfectly dodge 10 attacks.' },
      { id: 'greasepaint', how: { start: true }, hint: 'Silver paint, never smudged.' },
    ],
    ult: 'rocket_ride', ...ULT(90),
    gimmick: { id: 'launch_shell', name: 'Launch Shell', desc: 'Its shell fires its thrusters: a shield, +20% elemental damage, +15% defense.', shield: 0.2, mods: { elmMul: 1.2, defMul: 1.15, shieldMul: 1.2 } },
    evolve: [], temper: 'shy', catch: 0, bond: 65, exp: 250, personality: 'The Spaceman: a silver space turtle whose shell is a rocket ship, with a silver star painted round each eye. Lives on another planet most of the time; plays a guitar that smokes when it solos.',
  },
  purrcussion: {
    name: 'Purrcussion', elem: ['draco', 'echo'], family: 'Dragon', stage: 3, line: 'kissmet', role: 'Lion drummer — pounces, drum solos, healing ballads',
    base: B(16, 10, 10, 13, 10), radius: 0.95,
    basic: { type: 'melee', power: 16, range: 1.9, rate: 0.5 },
    start: ['hooligan', 'hundred_thousand_years'],
    moves: [
      { id: 'beth', how: { battle: { ev: 'heal', n: 600 } }, hint: 'Heal 600 HP in battle.' },
      { id: 'hard_luck_woman', how: { battle: { ev: 'comeback', n: 3 } }, hint: 'Land 3 comeback punches.' },
      { id: 'deuce', how: { start: true }, hint: 'Its paws still remember.' },
    ],
    passives: [
      { id: 'black_diamond', how: { battle: { ev: 'hit_taken', n: 60 } }, hint: 'Take 60 hits.' },
      { id: 'alive', how: { battle: { ev: 'low_hp_win', n: 1 } }, hint: 'Win from below 40% HP.' },
    ],
    ult: 'king_of_the_night_time_world', ...ULT(90),
    gimmick: { id: 'catman_kit', name: 'Catman Kit', desc: 'It drums on its own tortoiseshell: on-beat hits +40%, wider beat window, +15% physical damage.', mods: { beatMul: 1.4, beatWindow: 0.14, physMul: 1.15 } },
    evolve: [], temper: 'territorial', catch: 0, bond: 70, exp: 250, personality: 'The Catman: a big black-maned lion with painted whiskers, green cat eyes and a turtle shell it plays like a drum. Purrs in 4/4. Sings a ballad when a friend is hurt.',
  },
};
