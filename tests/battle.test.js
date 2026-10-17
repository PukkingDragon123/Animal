import { ok, section, done } from './_h.js';
import { createBattle, step, command, order, trainerCommand, resolveQte, resumeMatch, unitById, activeOf, DT } from '../src/battle/sim.js';
import { createElemon, battleSnapshot } from '../src/game/elemon.js';
import { SPECIES, STARTERS } from '../src/data/species.js';
import { SKILLS } from '../src/data/skills.js';

const snap = (sp, lv = 5, extra = {}) => { const m = createElemon(sp, { level: lv }); Object.assign(m.skills, extra); return battleSnapshot(m); };
function duel(a, b, opts = {}) {
  // mechanic tests drive units directly: classic rules (no auto-control, instant switch, no bonding) unless asked
  const rules = Object.assign({ orders: false, switchTime: 0, bond: false }, opts.rules || {});
  return createBattle({ seed: opts.seed ?? 7, arena: opts.arena, rules, clock: opts.clock,
    sides: [{ trainers: [{ id: 'p', name: 'P', ai: 'pai' in opts ? opts.pai : 'normal', isPlayer: opts.player ?? false, team: Array.isArray(a) ? a : [a] }] },
            { trainers: [{ id: 'e', name: 'E', ai: opts.eai ?? 'normal', team: Array.isArray(b) ? b : [b] }] }] });
}
function run(st, maxT = 180, onTick) { let n = 0; const evs = []; while (!st.over && st.t < maxT) { step(st, DT); for (const e of st.events) evs.push(e); if (st.qte) resolveQte(st, st.qte.id, 0.8); onTick && onTick(st, n++); } return evs; }

section('every species & skill data is valid');
for (const [id, sp] of Object.entries(SPECIES)) {
  for (const s of [...sp.start, ...sp.learn.map((x) => x[1]), ...(sp.passives || []), sp.ult].filter(Boolean)) ok(`${id} skill ${s} exists`, !!SKILLS[s]);
  for (const e of sp.evolve) ok(`${id} evolves to ${e.to}`, !!SPECIES[e.to]);
}
for (const s of Object.values(SKILLS)) if (s.kind !== 'passive') ok(`${s.id} has effects`, Array.isArray(s.eff) && s.eff.length > 0);

section('AI vs AI duels finish for every starter matchup');
const durs = [];
for (const a of STARTERS) for (const b of STARTERS) {
  const st = duel(snap(a, 8), snap(b, 8), { seed: a.length * 31 + b.length });
  const evs = run(st);
  ok(`${a} vs ${b} ends`, st.over, st.t);
  durs.push(st.t);
  if (a === 'chilichick' && b === 'bubblion') ok('hits happen', evs.some((e) => e.type === 'hit'));
}
const avg = durs.reduce((x, y) => x + y, 0) / durs.length;
console.log('   avg duel length', avg.toFixed(1) + 's', 'min', Math.min(...durs).toFixed(1), 'max', Math.max(...durs).toFixed(1));
ok('duels last a sensible time', avg > 15 && avg < 120, avg);

section('determinism');
{
  const s1 = duel(snap('chilichick', 10), snap('strawbaa', 10), { seed: 99 }); run(s1);
  const s2 = duel(snap('chilichick', 10), snap('strawbaa', 10), { seed: 99 }); run(s2);
  ok('same seed → same result', s1.t === s2.t && s1.result.winner === s2.result.winner, [s1.t, s2.t]);
}

section('reactions: hydro aura + pyro hit → steam explosion');
{
  const st = duel(snap('chilichick', 10), snap('lemmo', 10), { pai: null, eai: 'tutorial', player: true });
  const me = activeOf(st, 'p'), foe = activeOf(st, 'e');
  foe.brain = { paused: true }; foe.x = 0; foe.z = -2; me.x = 0; me.z = 2;
  foe.aura = { e: 'hydro', amt: 1, t: 6 };
  command(st, me.id, { type: 'skill', id: 'ember_shot', x: foe.x, z: foe.z });
  const evs = run(st, 3);
  ok('steam explosion triggered', evs.some((e) => e.type === 'reaction' && e.id === 'steam'), evs.filter((e) => e.type === 'reaction'));
  ok('steam zone created', evs.some((e) => e.type === 'zone' && e.kind === 'steam'));
}

section('parry reflects/staggers and records parry! for combos');
{
  const st = duel(snap('kanizumo', 10), snap('chilichick', 10), { pai: null, player: true, eai: 'tutorial' });
  const me = activeOf(st, 'p'), foe = activeOf(st, 'e');
  foe.brain = { paused: true };
  me.x = 0; me.z = 0.6; foe.x = 0; foe.z = -0.6; foe.face = 0; me.face = Math.PI;
  command(st, foe.id, { type: 'attack', id: me.id });
  step(st, DT); step(st, DT);
  command(st, me.id, { type: 'parry' });
  const evs = run(st, st.t + 1.0);
  ok('parry event', evs.some((e) => e.type === 'parry'), evs.map((e) => e.type).filter((t) => t !== 'beat'));
  ok('attacker staggered', evs.some((e) => e.type === 'stagger'));
  ok('history has parry!', me.hist.some((h) => h.a === 'parry!'));
  command(st, me.id, { type: 'attack', id: foe.id });
  const ev2 = run(st, st.t + 1);
  ok('riposte combo fires', ev2.some((e) => e.type === 'combo' && e.id === 'riposte'), ev2.filter((e) => e.type === 'combo'));
}

section('grab → parry struggle → attack = reversal suplex');
{
  const st = duel(snap('kanizumo', 12), snap('studrat', 10), { pai: null, player: true, eai: 'tutorial' });
  const me = activeOf(st, 'p'), foe = activeOf(st, 'e');
  foe.brain = { paused: true };
  me.x = 0; me.z = 0.5; foe.x = 0; foe.z = -0.6; me.face = Math.PI;
  command(st, me.id, { type: 'grab' });
  let evs = run(st, st.t + 0.4);
  ok('grab connects', evs.some((e) => e.type === 'grab'), evs.map((e) => e.type));
  // wait until the struggle telegraph, then parry
  let gotStruggle = false;
  for (let i = 0; i < 60 && !gotStruggle; i++) { step(st, DT); if (st.events.some((e) => e.type === 'struggle')) gotStruggle = true; }
  ok('struggle telegraphed', gotStruggle);
  command(st, me.id, { type: 'parry' });
  evs = run(st, st.t + 0.5);
  ok('struggle parried', me.hist.some((h) => h.a === 'parry!'));
  command(st, me.id, { type: 'attack' });
  evs = run(st, st.t + 0.5);
  ok('suplex combo', evs.some((e) => e.type === 'combo' && e.id === 'reversal_suplex'), evs.filter((e) => e.type === 'combo'));
}

section('charge + attack = elemental strike; dodge i-frames');
{
  const st = duel(snap('chilichick', 10), snap('bubblion', 10), { pai: null, player: true, eai: 'tutorial' });
  const me = activeOf(st, 'p'), foe = activeOf(st, 'e'); foe.brain = { paused: true };
  me.x = 0; me.z = 0.4; foe.x = 0; foe.z = -0.8;
  command(st, me.id, { type: 'charge', on: true });
  run(st, st.t + 0.6);
  command(st, me.id, { type: 'attack', id: foe.id });
  const evs = run(st, st.t + 0.8);
  ok('elemental strike', evs.some((e) => e.type === 'combo' && e.id === 'elemental_strike'));
  command(st, me.id, { type: 'dodge', dx: 1, dz: 0 });
  step(st, DT);
  ok('dodge grants iframes', me.iframes > 0);
}

section('switching, tag strike and team combo');
{
  const st = duel([snap('chilichick', 10), snap('beatlet', 8)], snap('moshbull', 10), { pai: null, player: true, eai: 'tutorial' });
  const foe = activeOf(st, 'e'); foe.brain = { paused: true };
  const first = activeOf(st, 'p');
  ok('switch works', trainerCommand(st, 'p', { type: 'switch' }));
  const second = activeOf(st, 'p');
  ok('new active unit', second && second.id !== first.id && second.species === 'beatlet');
  second.x = 0; second.z = 0.2; foe.x = 0; foe.z = -0.9;
  command(st, second.id, { type: 'attack', id: foe.id });
  const evs = run(st, st.t + 0.6);
  ok('tag strike combo', evs.some((e) => e.type === 'combo' && e.id === 'tag_strike'), evs.filter((e) => e.type === 'combo'));
  st.sides[0].meter = 100;
  ok('team combo starts (bench assist)', trainerCommand(st, 'p', { type: 'team' }));
  ok('team combo needs qte', st.qte && st.qte.kind === 'team');
  resolveQte(st, st.qte.id, 1);
  const e2 = run(st, st.t + 0.2);
  ok('team combo hits', st.stats.teamCombos === 1);
}

section('3v3 battle with allies resolves');
{
  const st = createBattle({ seed: 3, sides: [
    { trainers: [{ id: 'p', isPlayer: false, ai: 'ally', team: [snap('chilichick', 8), snap('beatlet', 7)] }, { id: 'mika', ai: 'ally', team: [snap('zapanda', 8)] }, { id: 'coach', ai: 'ally', team: [snap('kanizumo', 9)] }] },
    { trainers: [{ id: 'thrash', ai: 'punk', team: [snap('thrashark', 9)] }, { id: 'riff', ai: 'punk', team: [snap('studrat', 8)] }, { id: 'moshi', ai: 'punk', team: [snap('moshbull', 8)] }] }] });
  const evs = run(st, 240);
  ok('3v3 ends', st.over, st.t);
  console.log('   3v3 length', st.t.toFixed(1), 'winner side', st.result && st.result.winner, 'reactions', st.stats.reactions, 'switches', st.stats.switches);
}

section('capture flow');
{
  const st = duel(snap('chilichick', 10), snap('lemmo', 4), { pai: null, player: true, eai: 'wild', rules: { capture: true, wild: true } });
  const foe = activeOf(st, 'e'); foe.hp = 1;
  ok('capture command accepted', trainerCommand(st, 'p', { type: 'capture', gem: 'quartz', gemMul: 3 }));
  resolveQte(st, st.qte.id, 1);
  run(st, st.t + 4);
  ok('battle ends by capture or break free', st.over ? st.result.reason === 'capture' : foe.state !== 'captured');
}
section('Tokonmon rules: orders with delay, auto-control, bonding, ultimates');
{
  const st = duel(snap('chilichick', 10, { ult: 'ghost_pepper_meltdown' }), snap('bubblion', 10), { pai: null, player: true, eai: 'tutorial', rules: { orders: true, bond: true, switchTime: 7, switchCd: 15 } });
  const me = activeOf(st, 'p'), foe = activeOf(st, 'e');
  ok('player unit is auto-controlled', me.auto === true);
  ok('order accepted', order(st, me.id, { type: 'dodge', dx: 1, dz: 0 }));
  ok('order is delayed', !!me.order && me.order.t > 0.1 && me.order.t < 0.3, me.order && me.order.t);
  let fired = false;
  for (let i = 0; i < 20 && !fired; i++) { step(st, DT); if (st.events.some((e) => e.type === 'orderGo')) fired = true; }
  ok('order executes after the delay', fired && st.t > 0.15, st.t);
  me.ult = 100;
  ok('ultimate refused while not bonded', command(st, me.id, { type: 'ult', id: foe.id }) && (step(st, DT), st.stats.ults === 0));
  ok('bond', trainerCommand(st, 'p', { type: 'bond' }));
  ok('bonded = direct control', me.bonded && !me.auto);
  ok('orders are instant when bonded', order(st, me.id, { type: 'move', x: 1, z: 1 }) && !me.order);
  me.ult = 100; me.act = null; me.state = 'idle';
  command(st, me.id, { type: 'ult', id: foe.id });
  const evs = run(st, st.t + 4);
  ok('ultimate fires when bonded', st.stats.ults === 1);
  ok('ultimate ends the bond', !me.bonded && evs.some((e) => e.type === 'unbond' && e.reason === 'ult'));
  ok('bond cooldown after ultimate', st.trainers[0].bondCd > 10);
  ok('ult meter does not fill while unbonded', (me.ult = 0, run(st, st.t + 2), me.ult === 0));
}

section('Tokonmon rules: 7 s switch, 15 s cooldown, comeback punch, emotes');
{
  const a = snap('chilichick', 10), b = snap('beatlet', 10);
  a.passives = ['comeback_punch'];
  const st = duel([a, b], snap('moshbull', 10), { pai: null, player: true, eai: 'normal', rules: { orders: true, bond: true, switchTime: 7, switchCd: 15 } });
  const first = activeOf(st, 'p');
  ok('switch starts', trainerCommand(st, 'p', { type: 'switch' }));
  ok('field empty while switching', !first.onField && !activeOf(st, 'p').onField);
  run(st, st.t + 3.5);
  ok('still switching at 3.5 s', !!st.trainers[0].switching);
  run(st, st.t + 3.6);
  const second = activeOf(st, 'p');
  ok('incoming arrives after 7 s', second.onField && second.species === 'beatlet' && !st.trainers[0].switching);
  ok('15 s cooldown', st.trainers[0].switchCd > 14);
  ok('cannot switch during cooldown', !trainerCommand(st, 'p', { type: 'switch' }));
  run(st, st.t + 15.2);
  if (!st.over) {
    ok('switch back after cooldown', trainerCommand(st, 'p', { type: 'switch', to: first.id }));
    run(st, st.t + 7.2);
    ok('comeback punch ready on return', first.comeback > 0 || st.units.some((u) => u.id === first.id && u.k.dealt > 0));
  }
  const s2 = duel(snap('chilichick', 10), snap('bubblion', 10), { pai: null, player: true, eai: 'tutorial', rules: { orders: false, bond: true } });
  const u = activeOf(s2, 'p'); activeOf(s2, 'e').brain = { paused: true };
  u.st.push({ s: 'burn', t: 5, k: 3, tick: 1 });
  command(s2, u.id, { type: 'emote', id: 'shake' });
  const ev = run(s2, s2.t + 0.3);
  ok('shake emote cleanses burn', ev.some((e) => e.type === 'emote' && e.id === 'shake') && !u.st.some((x) => x.s === 'burn'));
  run(s2, s2.t + 4);
  command(s2, u.id, { type: 'emote', id: 'taunt' });
  run(s2, s2.t + 0.2);
  ok('taunt riles the foe', activeOf(s2, 'e').buffs.some((x) => x.s === 'riled'));
}

section('Tokonmon rules: match clock, halftime, arenas');
{
  const st = duel(snap('chilichick', 30), snap('bubblion', 30), { pai: 'normal', eai: 'normal', clock: { len: 40 }, arena: { type: 'rocky' }, rules: { bond: true } });
  ok('arena type set', st.arena.type === 'rocky' && st.arena.boost === 'geo');
  let ht = false;
  for (let i = 0; i < 30 * 25 && !ht && !st.over; i++) { step(st, DT); if (st.paused === 'halftime') ht = true; }
  ok('halftime pauses the match', ht || st.over);
  if (ht) {
    const t = st.t; step(st, DT);
    ok('paused match does not advance', st.t === t);
    ok('resume with a new arena', resumeMatch(st, { arena: 'water' }) && st.arena.type === 'water');
    run(st, 60);
    ok('match ends by KO or time', st.over && ['ko', 'time'].includes(st.result.reason), st.result && st.result.reason);
  }
}

done('battle');
