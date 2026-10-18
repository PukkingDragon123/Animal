// San Francisco roster: species/skill data integrity, the new evolution events
// (burn_faint_bonded, ko_bonded, shield_ally…), team synergies, forms, drip tiers and gear.
import { ok, section, done } from './_h.js';
import { createBattle, step, command, trainerCommand, resolveQte, activeOf, DT } from '../src/battle/sim.js';
import { createElemon, battleSnapshot, evolutionOptions, condProgress, statsOf, equipGear, modelOf, dripTag, rollDrip, gearSlots } from '../src/game/elemon.js';
import { SPECIES, STARTERS } from '../src/data/species.js';
import { SKILLS } from '../src/data/skills.js';
import { ITEMS } from '../src/data/items.js';
import { GEAR } from '../src/data/gear.js';
import { BATTLE_EVENTS, BattleTracker, bump, recordActivity } from '../src/data/progress.js';
import { weatherOf } from '../src/game/time.js';
import { SPECIES as SF_LINES } from '../src/data/species/sf_lines.js';
import { SPECIES as SF_WILD } from '../src/data/species/sf_wild.js';
import { SPECIES as SF_LEGENDS } from '../src/data/species/sf_legends.js';
import { MOVES as M1 } from '../src/data/moves/sf_lines.js';
import { MOVES as M2 } from '../src/data/moves/sf_wild.js';
import * as S from '../src/game/state.js';

const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const NEW = ['pidgun', 'jungeon', 'paradove', 'trashcoon', 'dynacoon', 'hellcoon', 'gradcub', 'bearbreak', 'yeezilla', 'polobruin', 'foopod', 'everpunch', 'barkorious',
  'woodbub', 'hartbox', 'utero', 'grillfin', 'astroshark', 'sandmander', 'justatue', 'creepetal', 'plastree', 'weirdfin', 'snarlpup', 'wonderwoof', 'supernoir', 'coolpillar',
  'pupalace', 'killaqueen', 'bohemonarch', 'zapkit', 'thundersabre', 'zeppra', 'stairgasus', 'rollick', 'neverdecker', 'johnlemon', 'starrfish', 'yokat', 'blackvolt', 'prismoon',
  'beatlet', 'pepperhorn', 'abbeyhorn', 'walrusk'];
const COND_KEYS = new Set(['level', 'wins', 'friendship', 'precise', 'healed', 'blocked', 'beats', 'charged', 'teamCombos', 'dojo', 'foods', 'location', 'hours', 'defeat', 'battle', 'activity', 'more', 'weather', 'holding']);
const snap = (sp, lv = 10, extra = {}, opts = {}) => { const m = createElemon(sp, Object.assign({ level: lv, form: 'm', look: 1 }, opts)); Object.assign(m.skills, extra); return battleSnapshot(m); };
const duel = (a, b, rules = {}, more = {}) => createBattle({ seed: more.seed ?? 5, rules: Object.assign({ orders: false, switchTime: 0, bond: false }, rules),
  sides: [{ trainers: [{ id: 'p', name: 'P', ai: more.pai === undefined ? 'normal' : more.pai, isPlayer: !!more.player, team: Array.isArray(a) ? a : [a] }, ...(more.allies || [])] },
          { trainers: [{ id: 'e', name: 'E', ai: more.eai || 'normal', team: Array.isArray(b) ? b : [b] }] }] });
function run(st, maxT, onTick) { const evs = []; while (!st.over && st.t < maxT) { step(st, DT); for (const e of st.events) evs.push(e); if (st.qte) resolveQte(st, st.qte.id, 0.8); onTick && onTick(st); } return evs; }

section('new species data');
const MODS = [SF_LINES, SF_WILD, SF_LEGENDS];
for (const id of NEW) ok(`${id} is registered`, !!SPECIES[id] && MODS.some((m) => m[id]));
for (const id of ['lenshorn', 'starrab']) ok(`retired ${id} removed`, !SPECIES[id]);
for (const id of ['mccarapace', 'harrisun']) ok(`${id} stays (Fab Four)`, !!SPECIES[id] && /Fab Four/.test(SPECIES[id].role));
for (const mod of MODS) for (const [id, sp] of Object.entries(mod)) {
  ok(`${id} has 2 unique start skills`, sp.start.length === 2 && sp.start.every((s) => SKILLS[s] && SKILLS[s].kind === 'active' && SKILLS[s].line), sp.start);
  ok(`${id} stats/basic/role`, Object.values(sp.base).every((v) => v > 0) && sp.basic && sp.radius > 0 && sp.role && sp.personality && sp.temper);
  for (const m of sp.moves) ok(`${id} move ${m.id}`, !!SKILLS[m.id] && SKILLS[m.id].kind === 'active' && m.hint && m.how);
  for (const u of SPECIES[id].unlocks) {
    ok(`${id} unlock ${u.id} (${u.kind})`, !!SKILLS[u.id] && (u.kind === 'move' ? SKILLS[u.id].kind === 'active' : u.kind === 'passive' ? SKILLS[u.id].kind === 'passive' : SKILLS[u.id].kind === 'ultimate') && typeof u.hint === 'string');
    const evs = JSON.stringify(u.how).match(/"ev":"([a-z_]+)"/g) || [];
    for (const e of evs) ok(`${id} ${u.id} event ${e} exists`, !!BATTLE_EVENTS[e.slice(6, -1)]);
  }
  ok(`${id} gimmick`, sp.gimmick && sp.gimmick.name && sp.gimmick.desc);
  for (const e of sp.evolve) {
    ok(`${id} → ${e.to} exists, hinted, known cond keys`, !!SPECIES[e.to] && e.hint.length > 5 && Object.keys(e.cond).every((k) => COND_KEYS.has(k)), e.cond);
    if (e.cond.battle) ok(`${id} → ${e.to} event exists`, !!BATTLE_EVENTS[e.cond.battle.ev]);
  }
}
ok('legendaries are strong and rare', ['blackvolt', 'prismoon'].every((id) => SPECIES[id].legendary && Object.values(SPECIES[id].base).reduce((a, b) => a + b, 0) >= 80 && SPECIES[id].catch <= 0.05));
const NEWSK = [...M1, ...M2];
ok('signature skills are unique ids', new Set(NEWSK.map((s) => s.id)).size === NEWSK.length);
for (const s of NEWSK) ok(`${s.id} well-formed`, s.kind === 'passive' ? !!s.mods : Array.isArray(s.eff) && s.eff.length > 0 && (s.kind !== 'ultimate' || !!s.qte));

section('every signature skill runs in the sim');
let crashed = [];
for (const sk of NEWSK.filter((s) => s.kind !== 'passive')) {
  const owner = Object.keys(SPECIES).find((id) => SPECIES[id].line === sk.line) || sk.line;
  try {
    const me = snap(owner, 20, sk.kind === 'ultimate' ? { active: [], ult: sk.id } : { active: [sk.id] });
    const st = duel(me, snap('lemmo', 20), sk.kind === 'ultimate' ? { bond: false } : {}, { pai: null, player: true, eai: 'tutorial' });
    const u = activeOf(st, 'p'), f = activeOf(st, 'e'); f.brain = { paused: true }; u.x = 0; u.z = 1.2; f.x = 0; f.z = -1.2; u.energy = 100;
    if (sk.kind === 'ultimate') { u.ult = 100; command(st, u.id, { type: 'ult', id: f.id }); }
    else command(st, u.id, { type: 'skill', id: sk.id, x: f.x, z: f.z, id2: f.id });
    const evs = run(st, 4);
    if (!evs.some((e) => (e.type === 'cast' && e.skill === sk.id) || (e.type === 'ult' && e.skill === sk.id))) crashed.push(sk.id + ' (not cast)');
  } catch (e) { crashed.push(sk.id + ': ' + e.message); }
}
ok('all signature skills cast without errors', crashed.length === 0, crashed);

section('AI duels with the new roster finish');
let unfinished = []; const durs = [];
for (const [i, id] of NEW.entries()) {
  const st = duel(snap(id, 20), snap(STARTERS[i % 3], 20), { bond: true }, { seed: i + 1 });
  try { run(st, 150); } catch (e) { unfinished.push(id + ': ' + e.message); continue; }
  if (!st.over) unfinished.push(id);
  durs.push(st.t);
}
console.log('   avg duel', (durs.reduce((a, b) => a + b, 0) / durs.length).toFixed(1) + 's');
ok('every new species finishes a duel', unfinished.length === 0, unfinished);

section('Jungeon → Paradove: fainting from a burn while bonded');
function bondedFaint(species, burn, killer) {
  const mon = createElemon(species, { level: 30, form: 'f' });
  const st = duel(battleSnapshot(mon), snap('lemmo', 10), { bond: true }, { pai: null, player: true, eai: 'tutorial' });
  const tr = new BattleTracker(st, 0, { [mon.uid]: mon });
  const u = activeOf(st, 'p'), f = activeOf(st, 'e'); f.brain = { paused: true };
  ok(`${species} bonds`, trainerCommand(st, 'p', { type: 'bond' }) && u.bonded);
  u.x = 0; u.z = 0.5; f.x = 0; f.z = -0.6; f.face = 0;
  u.hp = 3; u.shield = 0; // the bond gimmick's shield would soak the finishing blow
  if (burn) u.st.push({ s: 'burn', t: 5, k: 6, tick: 1 });
  if (killer) command(st, f.id, { type: 'attack', id: u.id });
  const evs = run(st, 6, (s2) => tr.feed(s2.events));
  return { mon, u, evs };
}
{
  const { mon, u, evs } = bondedFaint('jungeon', true, false);
  ok('jungeon fainted burning + bonded', evs.some((e) => e.type === 'faint' && e.u === u.id && e.bonded && e.burning));
  ok('sim counts it (k.burnFaintBonded)', u.k.burnFaintBonded === 1 && u.k.faintBonded === 1);
  ok('tracker bumps burn_faint_bonded', mon.prog.ev.burn_faint_bonded === 1);
  ok('jungeon can now evolve into paradove', evolutionOptions(mon).some((e) => e.to === 'paradove'));
  ok('progress row for the event', condProgress(mon, SPECIES.jungeon.evolve[0].cond).some((r) => r.label === BATTLE_EVENTS.burn_faint_bonded && r.ok));
  const m2 = createElemon('jungeon', { level: 30 });
  bump(m2, 'ko_bonded', 3);
  ok('fainting bonded without a burn is not enough', !evolutionOptions(m2).some((e) => e.to === 'paradove'));
  ok('jungeon ♀ keeps its rose model', modelOf(mon) === 'jungeon_rose');
}
{
  const mon = createElemon('jungeon', { level: 30 });
  const st = duel(battleSnapshot(mon), snap('lemmo', 10), { bond: true }, { pai: null, player: true, eai: 'tutorial' });
  const tr = new BattleTracker(st, 0, { [mon.uid]: mon });
  const u = activeOf(st, 'p'); activeOf(st, 'e').brain = { paused: true };
  u.hp = 3; u.st.push({ s: 'burn', t: 5, k: 6, tick: 1 });
  run(st, 6, (s2) => tr.feed(s2.events));
  ok('burn faint while NOT bonded does not count', u.state === 'faint' && !mon.prog.ev.burn_faint_bonded && !evolutionOptions(mon).length);
}

section('Hartbox → Utero: knocked out while bonded');
{
  const { mon, u, evs } = bondedFaint('hartbox', false, true);
  ok('hartbox knocked out by the foe while bonded', evs.some((e) => e.type === 'faint' && e.u === u.id && e.src && e.bonded && !e.burning));
  ok('tracker bumps ko_bonded only', mon.prog.ev.ko_bonded === 1 && !mon.prog.ev.burn_faint_bonded);
  ok('hartbox unfolds into utero', evolutionOptions(mon).map((e) => e.to).join() === 'utero');
}

section('other new evolution conditions');
{
  const b = createElemon('bearbreak', { level: 30 });
  ok('bearbreak: nothing without KOs', evolutionOptions(b).length === 0);
  bump(b, 'ko', 5); bump(b, 'heal_move', 2);
  ok('more KOs than heals → yeezilla', evolutionOptions(b).map((e) => e.to).join() === 'yeezilla');
  bump(b, 'heal_move', 10); b.friendship = 255; bump(b, 'shield_ally', 20);
  ok('maxed friendship + 20 shielded teammates → polobruin only', evolutionOptions(b).map((e) => e.to).join() === 'polobruin');
  const p = createElemon('pupalace', { level: 30 });
  ok('pupalace by day → killaqueen', evolutionOptions(p, { hour: 12, weather: 'clear' }).map((e) => e.to).join() === 'killaqueen');
  ok('pupalace on a thunderstorm night → bohemonarch', evolutionOptions(p, { hour: 23, weather: 'storm' }).map((e) => e.to).join() === 'bohemonarch');
  ok('pupalace on a clear night → nothing', evolutionOptions(p, { hour: 23, weather: 'clear' }).length === 0);
  ok('weather is deterministic: storm on night 3, not on day 3', weatherOf({ day: 3, hour: 22 }) === 'storm' && weatherOf({ day: 3, hour: 14 }) !== 'storm' && weatherOf({ day: 4, hour: 22 }) !== 'storm');
  const d = createElemon('dynacoon', { level: 32 });
  ok('dynacoon needs the highway race', evolutionOptions(d).length === 0 && (recordActivity(d, 'highway_race'), evolutionOptions(d).some((e) => e.to === 'hellcoon')));
  const f = createElemon('foopod', { level: 8 });
  bump(f, 'crit', 49); ok('foopod: 49 crits not yet', !evolutionOptions(f).length);
  bump(f, 'crit', 1); ok('foopod: 50 critical punches → everpunch', evolutionOptions(f).some((e) => e.to === 'everpunch'));
  const pg = createElemon('pidgun', { level: 14 });
  ok('pidgun → jungeon by level', evolutionOptions(pg).some((e) => e.to === 'jungeon'));
}
{
  // shield_ally: Bearbreak's Love Lockdown shields a tag-battle partner
  const bear = createElemon('bearbreak', { level: 20 });
  const st = duel(battleSnapshot(bear), snap('lemmo', 10), {}, { pai: null, player: true, eai: 'tutorial', allies: [{ id: 'mika', ai: 'tutorial', team: [snap('zapanda', 10)] }] });
  const tr = new BattleTracker(st, 0, { [bear.uid]: bear });
  const u = activeOf(st, 'p'); for (const x of st.units) if (x !== u) x.brain = { paused: true };
  u.energy = 100; command(st, u.id, { type: 'skill', id: 'love_lockdown' });
  run(st, 2, (s2) => tr.feed(s2.events));
  ok('shielding a teammate is counted', u.k.shieldAlly === 1 && bear.prog.ev.shield_ally === 1, [u.k.shieldAlly, bear.prog.ev.shield_ally]);
}

section('team synergies');
{
  const four = ['johnlemon', 'mccarapace', 'harrisun', 'starrfish'];
  const st = duel(four.map((id) => snap(id)), snap('lemmo'));
  const mine = st.units.filter((u) => u.side === 0);
  ok('Fab Four: all four boosted (+15% damage & speed)', mine.every((u) => u.mods.dmgMul === 1.15 && u.mods.spdMul === 1.15 && u.synergies.includes('fab_four')));
  ok('Fab Four: synergy event', st.events.some((e) => e.type === 'synergy' && e.id === 'fab_four' && e.units.length === 4));
  const st3 = duel(four.slice(0, 3).map((id) => snap(id)), snap('lemmo'));
  ok('three Beatles: no boost', st3.units.every((u) => !u.mods.dmgMul && !u.synergies));
  const split = createBattle({ seed: 1, rules: { bond: false }, sides: [{ trainers: [{ id: 'p', team: four.slice(0, 2).map((id) => snap(id)) }, { id: 'a', team: four.slice(2).map((id) => snap(id)) }] }, { trainers: [{ id: 'e', team: [snap('lemmo')] }] }] });
  ok('Fab Four split across two trainers: no boost', split.units.every((u) => !u.synergies));
}
{
  const st = duel([snap('johnlemon', 20), snap('yokat', 20)], snap('lemmo', 5), {}, { pai: null, player: true, eai: 'tutorial' });
  const john = activeOf(st, 'p'), foe = activeOf(st, 'e'); foe.brain = { paused: true };
  ok('John & Yoko: Johnlemon elemental damage +20%', john.mods.elmMul === 1.2 * 1 && john.synergies.includes('john_and_yoko'));
  john.hp = Math.round(john.maxHp / 2); const h0 = john.hp;
  run(st, 3.05);
  ok('Yokat (on the bench) heals Johnlemon ~1% HP per second', john.hp - h0 >= 2 && john.hp - h0 <= Math.ceil(john.maxHp * 0.035), [h0, john.hp, john.maxHp]);
  const st2 = duel(snap('johnlemon', 20), snap('yokat', 20));
  ok('opposite sides: no team-up', st2.units.every((u) => !u.synergies && !u.teamHeal));
}

section('forms, drip tiers, gear, save');
{
  const f = createElemon('pidgun', { form: 'f' });
  ok('pidgun ♀ form and model', f.form === 'f' && modelOf(f) === 'pidrose' && battleSnapshot(f).model === 'pidrose');
  let seen = new Set(); for (let i = 0; i < 40; i++) seen.add(createElemon('pidgun').form);
  ok('pidgun form is random m/f', seen.has('m') && seen.has('f') && seen.size === 2);
  ok('species without forms get no form', createElemon('lemmo').form === undefined);
  let x = 0; const seq = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  const tiers = { 1: 0, 2: 0, 3: 0 }; for (let i = 0; i < 4000; i++) tiers[rollDrip(seq)]++;
  ok('drip roll ≈ 85 / 13 / 2 %', tiers[1] > 3200 && tiers[1] < 3600 && tiers[2] > 380 && tiers[2] < 680 && tiers[3] > 30 && tiers[3] < 140, tiers);
  const s = S.newGame(); const st = S.giveStarter(s, 'strawbaa', 5);
  ok('starters are normal drip with a look seed', st.drip === 1 && Number.isInteger(st.look) && dripTag(st) === '');
  ok('wild/gift mons roll drip', [createElemon('lemmo', { wild: true, rng: () => 0.01 }).drip, createElemon('lemmo', { gift: true, rng: () => 0.1 }).drip, createElemon('lemmo', { wild: true, rng: () => 0.5 }).drip].join() === '3,2,1');
  ok('drip tags', dripTag({ drip: 2 }) === 'DRIP' && dripTag({ drip: 3 }) === 'ULTRA DRIP');
  ok('gear catalogue: 12–16 buyable items', Object.keys(GEAR).length >= 12 && Object.keys(GEAR).length <= 16 && Object.keys(GEAR).every((id) => ITEMS[id] && ITEMS[id].kind === 'gear' && ITEMS[id].price > 0));
  s.money = 5000;
  const before = statsOf(st).dmg;
  ok('buy gear', S.buy(s, 'guitar_pick') && s.bag.guitar_pick === 1);
  ok('equip gear from the bag', S.equipGearItem(s, st, 'guitar_pick') && !s.bag.guitar_pick && st.gear.join() === 'guitar_pick');
  ok('gear boosts stats (+6% damage)', Math.abs(statsOf(st).dmg / before - 1.06) < 1e-9);
  ok('one gear slot below Lv.40', gearSlots(st) === 1 && S.buy(s, 'capo') && S.equipGearItem(s, st, 'capo') && st.gear.join() === 'capo' && s.bag.guitar_pick === 1);
  const sn = battleSnapshot(st);
  const bt = duel(sn, snap('lemmo'));
  ok('gear mods reach the sim (capo: cooldowns −6%)', sn.gear.join() === 'capo' && activeOf(bt, 'p').mods.cdMul === 0.94);
  st.level = 40; equipGear(st, 'guitar_pick');
  ok('second gear slot at Lv.40', st.gear.length === 2);
  ok('unequip back to the bag', S.unequipGearItem(s, st, 'capo') && s.bag.capo === 1 && st.gear.join() === 'guitar_pick');
  st.drip = 3; st.look = 12345;
  S.save(s); const l = S.load(); const lm = l.party[0];
  ok('save keeps drip, look and gear', lm.drip === 3 && lm.look === 12345 && lm.gear.join() === 'guitar_pick');
  const old = JSON.parse(JSON.stringify(s)); delete old.party[0].drip; delete old.party[0].look; delete old.party[0].gear;
  old.party.push(Object.assign(JSON.parse(JSON.stringify(old.party[0])), { species: 'lenshorn', uid: 'old2' }));
  localStorage.setItem(S.SAVE_KEY, JSON.stringify(old)); const mg = S.load();
  ok('old saves migrate: drip 1, a look seed, empty gear, retired species remapped', mg.party[0].drip === 1 && Number.isInteger(mg.party[0].look) && Array.isArray(mg.party[0].gear) && mg.party[1].species === 'abbeyhorn');
  S.wipe();
}

done('roster');
