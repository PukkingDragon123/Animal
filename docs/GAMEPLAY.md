# Tokonmon gameplay data guide

How Tokonmon fight, learn and grow, and how to write their data. Read `docs/TOKONMON.md` first; the rules
there (bible §5–7) are the owner's and must not change.

## The rules in code

| Rule (owner) | Where |
|---|---|
| Auto-control with a little delay on orders (dodge, attack, charge…) | `order()` in `src/battle/sim.js` (`ORDER_DELAY`: dodge 0.25 s … charge 0.5 s, shorter with Speed and friendship); the buddy AI profile in `src/battle/ai.js` |
| Bonding: full control, a special gimmick, wears the trainer's hat | `trainerCommand(st, T, { type: 'bond' })`; `species.gimmick` (mods/shield/heal); the bond overlay in the design (`bond.parts/grow/hat`) |
| Ultimates only when bonded; using one ends the bond | `beginUlt` (bonded-only), `endBond(…, 'ult')`; the ult meter only fills while bonded |
| Elemental Form at the final evolution | bonded + final + Spectral stone + soul meter → `trainerCommand elemental` |
| Switch takes 7 s (field empty, the foe can charge), 15 s cooldown | `rules.switchTime`, `rules.switchCd`, `doSwitch` / `completeSwitch` |
| Switch out and come back → extra punch | passive `comeback_punch` (`mods.comeback`) |
| Emotes: taunt, dance, shake… | `EMOTES` in sim.js: taunt, dance, shake, flex, bow |
| Stadium: pick rocky/grassy/water at kickoff and halftime | `spec.clock` (halftime pause), `setArenaType`, `resumeMatch`, `ARENA_TYPES` |
| Skills/passives gained through battles, exploring, activities, quests, eating | `src/data/progress.js` (`how` conditions, `BattleTracker`, `recordEat/Visit/Activity/Quest`) |
| Unlock during battle (burned, crit, drowned…) | `BattleTracker.feed(events)` → live unlock stamps |
| Moves learned one by one, not shared, except discs | unique moves carry `line`; `DISC_SKILLS` (the classic library) are taught by vinyl discs |
| Rename skills and ultimates | `mon.names[id]`, `renameSkill()`; the sim shows `skillName(u, id)` |
| Skill levels, levelled only by use | `mon.skillXp`, `SKILL_XP` thresholds (Lv 1–5): +12% power and −5% cooldown per level |
| Stat chart: levels upgrade stats, marks grant passives | `allocate()`; `STAT_MARKS` (5 / 15 / 30 points per stat) |
| Heartbox breaks open after bonded KOs | `gimmick: { breakAt: 3, into: 'inbloom' }` → `crack` / `transform` events |

## Species (`src/data/species/*.js`, each exports `SPECIES`)

```js
chilichick: {
  name: 'Chilichick', elem: 'pyro' | ['pyro', 'echo'], family: 'Bird', stage: 1, line: 'chilichick',
  role: 'Close-range striker — fast attacks, fast movement',    // one line, shown on the phone
  base: B(dmg, elm, def, spd, hp), radius: 0.4,                // level-1 stats (sum ≈ 30–35 base forms, 50–60 finals, legends 80+)
  basic: { type: 'melee' | 'ranged', power, range, rate, speed? },   // auto-attack
  start: ['pepper_peck', 'hot_tears'],                        // known from the start / on evolving (2 signature moves)
  moves: [{ id, how, hint }],                                 // 3–5 unique moves, each with its own unlock
  passives: [{ id, how, hint }],                              // 2–4 passives (unique ones + common ones like comeback_punch)
  ult: 'ghost_pepper_meltdown', ultHow, ultHint,              // the ultimate (bonded-only) and how it unlocks
  gimmick: { id, name, desc, mods, shield?, heal?, breakAt?, into? },   // the bond gimmick (active while bonded)
  evolve: [{ to, cond, hint }],                              // cond: level, wins, friendship, precise, healed, blocked, beats, charged, teamCombos, dojo, foods, location, hours, defeat
  temper, catch, bond, exp, personality,
}
```
- Register a new module in `src/data/species/index.js` (`EXTRA_SPECIES`). Later modules override entries
  of `src/data/species.js`, so a kept species can be upgraded there without editing species.js.
- Wild-only beasts (`beast: true`) and legendaries (`legendary: true, boss: true`) keep their flags.
- Every species id must have a design in `src/data/designs/*` (the content test checks this).

### Unlock conditions (`how`), see `src/data/progress.js`
`{ start }`, `{ level }`, `{ eat: { tag | food, n } }`, `{ battle: { ev, n } }`, `{ uses: { skill, n } }`,
`{ explore: mapId }`, `{ activity: { id, n } }` (dojo, onsen, arcade, karaoke, listen, hangout, train_dmg…),
`{ quest }`, `{ friendship }`, `{ stat: { dmg: n } }`, `{ disc: true }`, `{ all: [...] }`, `{ any: [...] }`.
- Battle events (`ev`): burned, crit, drowned, drown_foe, perfect_dodge, perfect_parry, ko, bond_ko,
  on_beat, switch_in, comeback, emote, reaction, steam, heal (HP), hit_taken, shield_block (HP), stun,
  bond_secs, ult, win, win_bonded, low_hp_win, flawless, stadium_win.
- Taste tags (`src/data/foods.js`): spicy sweet sour salty umami savory fried cold hot seafood veggie fruit meat dairy fizzy.
  Foods: see `FOODS` (e.g. `super_spicy_curry`, `ghost_pepper_kushikatsu`, `octopus_garden_sundae`, `momiji_tempura`).
- Maps for `explore`: farm, castle_park, dotonbori, yellow_submarine, abbey_road, umeda, league_lobby, food_hall,
  stadium, shinsekai, dojo, onsen, arcade, grillz_shop, kansai_calling, minoh_waterfall, minoh_bamboo, minoh_maple.
- **Make unlocks fun and thematic**, mixing kinds: at most one or two plain `level` unlocks per species; the
  rest come from eating, battle moments, exploring, activities and quests that fit the creature's personality.
  Every unlock needs a short, playful `hint` (it is the clue the player reads on the phone).

## Moves (`src/data/moves/*.js`, each exports `MOVES`)
Unique to an evolution line: give each skill `line: '<base species id>'` (use the `L(line, [...])` helper as in
`moves/starters.js`). Register the module in `src/data/moves/index.js` (`EXTRA_MOVES.push(...)`).

```js
{ id, name, elem, desc, kind: 'active' (default) | 'ultimate' | 'passive',
  cost, cd, aim: 'dir' | 'point' | 'target' | 'self' | 'ally', range, windup, recover,
  anim: 'attack' | 'attack2' | 'attack3' | 'shoot' | 'cast' | 'roar' | 'slam' | 'stomp' | 'spin' | 'flex' | 'dodge' | 'parry' | 'headbang',
  fx, sfx, scale: 'phys' (physical) | default elemental, telegraph: 'circle' | 'line' | 'cone',
  charge: { max, mult, grow }, beat: true (on-beat bonus), qte (ultimates: { type: 'rhythm', beats } | { type: 'mash', n } | { type: 'timing', n }),
  eff: [ ...effect primitives ], tags }
```
Effect primitives (see `runEffects` in sim.js for every field):
`proj` (power, speed, r, count, spread, pierce, bounce, homing, arc, burst, crit:'center', status, aura),
`melee` (power, reach, arc, lunge, count, interval, status), `aoe` (at: self|target|point, r, power, knock, up,
count, interval, delay, lastMul, status, destroy, crack), `cone` (range, arc, power, status), `line` (range, width,
power, delay), `zone` (kind, r, dur, pull, tick: { power, heal, status, aura }), `dash` (dist, speed, power, r,
iframe, trail | leap), `heal` (who: self|team|target, k, over, rewind), `buff` (s: shield|energy|cleanse|phase|
guard|spd|def|dmg|elm|focus|kindle|amp…, k, dur, who), `wall` (len, hp, dur, ring), `pull` (range, k | who:'target'),
`summon` (kind: trap|clone), `status` (who: aoe|target, s, dur, k), `mark` (r, dur, k).
Statuses: burn poison sleep drowsy stun frozen slow root confuse blind weaken defdown curse mark radiation regen.
Passive `mods`: dmgMul physMul elmMul spdMul defMul takenMul healMul shieldMul ultGain cdMul costMul critChance
critDmg burnOnHit lifesteal shieldRegen regen reflect emberSkin immune:[…] knockImmune lowHpDmg comeback
beatWindow beatMul chargeSpeed heatGain dodgeCd stagger teamGain reverb mosh groupie poisonStacks sleepDur wakeDmg.
Conditional passives add `when: { bonded | unbonded | bondT: s | switchedIn: s | lowHp: f | highHp: f | arena | wet | burning | form }`.

Balance targets: basic skills 15–30 power, big skills 35–50, ultimates 55–90 (often multi-hit); cooldowns 2–14 s;
costs 8–30 energy. Each line needs a clear role (striker, sharpshooter, tank, healer, controller, trickster…).
Common passives anyone can earn are in `src/data/moves/common.js` (reuse them, don't duplicate).

## Checks
`npm test` (battle tests run AI duels for every starter; content tests check every species has a design and every
referenced skill exists) and `node -e "import('./src/data/species.js')"` for a quick load.
