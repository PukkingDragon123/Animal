// Progression & game-state tests: levels, stats, loadout slots, evolutions,
// friendship, items, dojo, time, quests, league, save migration.
import { ok, section, done } from './_h.js';
import * as S from '../src/game/state.js';
import { createElemon, gainExp, allocate, statsOf, equip, learn, evolutionOptions, condProgress, evolve, battleSnapshot, expToNext, SPECTRAL_FRIENDSHIP, addFriendship } from '../src/game/elemon.js';
import { advance, slotOf, clockText } from '../src/game/time.js';
import { questProgress, QUESTS } from '../src/data/quests.js';
import { SPECIES, STARTERS } from '../src/data/species.js';
import { SKILLS } from '../src/data/skills.js';
import { ITEMS } from '../src/data/items.js';
import { MEALS, RANDOM_EVENTS } from '../src/data/events.js';
import { LOCATIONS } from '../src/data/locations.js';

// localStorage shim for save/load
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

section('new game & starter');
const s = S.newGame({ name: 'Test' });
ok('starts in castle park unlocked', s.unlocks.locations.includes('castle_park'));
ok('two active slots at start', s.unlocks.slots.active === 2 && s.unlocks.slots.ult === 0);
for (const id of STARTERS) ok(`starter ${id} has two start skills`, SPECIES[id].start.length === 2);
const mon = S.giveStarter(s, 'chilichick', 5);
ok('starter joins party', s.party.length === 1 && s.party[0] === mon);
ok('dex marks caught', s.dex.caught.chilichick && s.dex.seen.chilichick);

section('levels, EXP and stat points');
const before = statsOf(mon).dmg;
const ups = gainExp(mon, expToNext(5) + expToNext(6) + 1);
ok('two level-ups', ups.length === 2 && mon.level === 7, ups.length);
ok('3 SP + 1 AP per level', mon.sp === 6 && mon.ap === 2);
ok('stats grow with level', statsOf(mon).dmg > before);
ok('level unlock granted one by one (Flare Dash at Lv7)', ups[1].unlocked.some((u) => u.id === 'flare_dash') && mon.skills.known.includes('flare_dash'));
ok('allocate spends SP', allocate(mon, 'dmg', 2) && mon.sp === 4 && mon.alloc.dmg === 2);
ok('cannot overspend', !allocate(mon, 'hp', 99));

section('loadout slots respect unlocks');
learn(mon, 'lantern_burst'); learn(mon, 'flame_tail');
const slots = { active: 2, ult: 0, passive: 0 };
equip(mon, 'lantern_burst', slots);
ok('active list capped at 2', mon.skills.active.length <= 2, mon.skills.active);
ok('passive refused without slot', !equip(mon, 'hothead', slots) || !SKILLS.hothead);
const snap2 = battleSnapshot(mon, slots);
ok('snapshot honours slot count', snap2.skills.length <= 2 && snap2.ult === null);
const snap4 = battleSnapshot(mon, { active: 4, ult: 1, passive: 2 });
ok('snapshot hp positive', snap4.hp > 0 && snap4.maxHp >= snap4.hp);

section('evolution conditions');
const b = createElemon('beatlet', { level: 12 });
ok('beatlet needs lemmo hunting', evolutionOptions(b).length === 0);
b.counters.defeat.lemmo = 20; b.counters.defeat.alpha_lemmo = 1;
ok('beatlet → lenshorn after 20 Lemmo + Alpha', evolutionOptions(b).some((e) => e.to === 'lenshorn'));
const b2 = createElemon('beatlet', { level: 16 }); b2.friendship = 200;
ok('mccarapace only by the canal', !evolutionOptions(b2, { location: 'umeda' }).some((e) => e.to === 'mccarapace') && evolutionOptions(b2, { location: 'dotonbori' }).some((e) => e.to === 'mccarapace'));
const b3 = createElemon('beatlet', { level: 16 }); b3.counters.dojo = 3;
ok('harrisun only at sunrise', !evolutionOptions(b3, { hour: 12 }).some((e) => e.to === 'harrisun') && evolutionOptions(b3, { hour: 6 }).some((e) => e.to === 'harrisun'));
const b4 = createElemon('beatlet', { level: 16 }); b4.counters.teamCombos = 25;
ok('starrab after 25 team combos', evolutionOptions(b4).some((e) => e.to === 'starrab'));
ok('condition progress lists defeats', condProgress(b, SPECIES.beatlet.evolve[0].cond).some((r) => r.label.includes('Lemmo')));
evolve(b, 'lenshorn');
ok('evolve changes species + learns start skills', b.species === 'lenshorn' && SPECIES.lenshorn.start.every((id) => b.skills.known.includes(id)));
for (const [id, sp] of Object.entries(SPECIES)) for (const e of sp.evolve || []) ok(`${id}→${e.to} has a hint`, typeof e.hint === 'string' && e.hint.length > 5);

section('friendship & spectral');
const f = createElemon('bubblion', { level: 5 });
addFriendship(f, 999);
ok('friendship clamps to 255', f.friendship === 255);
ok('spectral at max bond', battleSnapshot(f).spectral && f.friendship >= SPECTRAL_FRIENDSHIP);

section('items & bag');
S.addItem(s, 'takoyaki', 2);
const hp0 = (mon.hp = 0.2);
const r = S.useItemOn(s, 'takoyaki', mon);
ok('takoyaki heals', r.ok && mon.hp > hp0);
ok('food counted for evolutions', mon.counters.foods.includes('takoyaki'));
s.money = 1000;
ok('buy deducts money', S.buy(s, 'quartz', 2) && s.money === 1000 - ITEMS.quartz.price * 2 && s.bag.quartz === 2);
ok('cannot buy without money', !S.buy(s, 'diamond', 1));

section('time, slots and dojo');
const t = { day: 1, hour: 22 };
const adv = advance(t, 3);
ok('day rolls over', t.day === 2 && Math.abs(t.hour - 1) < 1e-9 && adv.rolled);
ok('slots', slotOf(7).id === 'morning' && slotOf(12).id === 'lunch' && slotOf(15).id === 'afternoon' && slotOf(19).id === 'evening' && slotOf(23).id === 'night' && slotOf(2).id === 'night');
ok('clock text', clockText({ day: 2, hour: 13.5 }) === 'Day 2 · Tue 13:30');
const s2 = S.newGame();
const a1 = S.giveStarter(s2, 'kanizumo', 5), a2 = S.giveStarter(s2, 'beatlet', 5);
S.startDojo(s2, a2.uid);
ok('dojo mon excluded from battle team', !S.battleTeam(s2, 3).includes(a2) && S.battleTeam(s2, 3).includes(a1));
const lv0 = a2.level;
S.passTime(s2, 6);
ok('dojo gives EXP over a few hours', a2.exp > 0 && a2.level <= lv0 + 1, [a2.level, a2.exp]);
S.passTime(s2, 24);
ok('dojo levels up slowly over a day', a2.level > lv0 && a2.level < lv0 + 5, a2.level);
ok('benched party member got no dojo EXP', a1.exp === 0);
S.stopDojo(s2, a2.uid);
ok('collect from dojo', !S.inDojo(s2, a2.uid));

section('league ranks');
const s3 = S.newGame();
ok('starts Rookie D', S.rankOf(s3).id === 'D');
ok('rank up returns new rank', S.addLeaguePoints(s3, 120) === 'C' && S.rankOf(s3).id === 'C');
ok('points floor at 0', (S.addLeaguePoints(s3, -999), s3.league.points === 0));

section('quests');
const s4 = S.newGame();
s4.quests.main_soul_link = { step: 0 };
ok('main quest starts at step 0', questProgress(s4, 'main_soul_link').current === 0);
for (const k of ['met_coach', 'got_starter', 'beat_coach']) s4.flags[k] = true;
ok('main quest advances with flags', questProgress(s4, 'main_soul_link').current === 3);
s4.bag.star_fragment = 3; s4.flags.hoshino_met = true;
ok('fallen stars step 2 with 3 fragments', questProgress(s4, 'fallen_stars').current === 2);
for (const [id, q] of Object.entries(QUESTS)) {
  ok(`quest ${id} has steps`, q.steps.length > 0 && q.steps.every((st) => typeof st.done === 'function'));
  for (const it of Object.keys((q.reward && q.reward.items) || {})) ok(`quest ${id} reward ${it} exists`, !!ITEMS[it]);
}

section('meals & events reference real things');
for (const [k, m] of Object.entries(MEALS)) for (const o of m.options) { if (o.stat) ok(`${k}/${o.id} stat key`, ['dmg', 'elm', 'def', 'spd', 'hp'].includes(o.stat.stat)); if (o.food) ok(`${k}/${o.id} food item`, !!ITEMS[o.food]); }
for (const e of RANDOM_EVENTS) for (const o of e.options) for (const it of Object.keys(o.items || {})) ok(`event ${e.id} item ${it}`, !!ITEMS[it]);
for (const [id, L] of Object.entries(LOCATIONS)) ok(`location ${id} has map`, typeof L.map === 'string');

section('save / load round-trip');
S.save(s);
ok('has save', S.hasSave());
const loaded = S.load();
ok('loads party & money', loaded.party.length === s.party.length && loaded.money === s.money && loaded.party[0].species === 'chilichick');
S.wipe();
ok('wipe clears', !S.hasSave());

section('Tokonmon progression: eating, battle unlocks, skill levels, stat marks, renaming');
{
  const P = await import('../src/data/progress.js');
  const E = await import('../src/game/elemon.js');
  const c = E.createElemon('chilichick', { level: 5 });
  for (let i = 0; i < 4; i++) P.recordEat(c, 'red_hot_ramen');
  ok('4 spicy dishes: not yet', !c.skills.known.includes('fire_breath'));
  ok('5th spicy dish teaches Fire Breath', P.recordEat(c, 'mapo_tofu').some((u) => u.id === 'fire_breath'));
  ok('Super Spicy Curry → Heat Tolerance', P.recordEat(c, 'super_spicy_curry').some((u) => u.id === 'heat_tolerance') && c.skills.passives.includes('heat_tolerance'));
  P.bump(c, 'burned', 3);
  ok('burned 3× → Scorch Spin', P.checkUnlocks(c).some((u) => u.id === 'scorch_spin'));
  ok('one by one: moves only learned when earned', !c.skills.known.includes('hiccup_fireball'));
  ok('skill XP levels up by use', P.addSkillXp(c, { pepper_peck: 7 }).some((u) => u.id === 'pepper_peck' && u.to === 2) && P.skillLevelOf(c, 'pepper_peck') === 2);
  ok('snapshot carries skill levels', E.battleSnapshot(c).skillLv.pepper_peck === 2);
  c.sp = 10;
  E.allocate(c, 'spd', 5);
  ok('stat-chart mark grants a passive', c.lastUnlocks.some((u) => u.id === 'light_feet'));
  ok('rename a skill', E.renameSkill(c, 'fire_breath', 'Inferno Hiccup') === 'Inferno Hiccup' && E.battleSnapshot(c).names.fire_breath === 'Inferno Hiccup');
  ok('ult unlocks from bonded time', (P.bump(c, 'bond_secs', 60), P.checkUnlocks(c).some((u) => u.kind === 'ult') && c.skills.ult === 'ghost_pepper_meltdown'));
}

done('game');
