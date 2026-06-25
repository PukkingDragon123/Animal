// Headless simulation tests (no WebGL). Validates the deterministic core for the
// five-species roster: stages, eating, reproduction, death, determinism, life
// goals, and that every species boots.
import { createRun, step, liveDna } from '../src/sim.js';
import { SPECIES_LIST } from '../src/species.js';
import { CONFIG as C } from '../src/config.js';

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; } else { fail++; console.error('  FAIL:', name); } };
const approx = (a, b, e = 1e-6) => Math.abs(a - b) <= e;

const DT = 1 / 60;

// steer toward the nearest alive food / reproduction target, dodging predators
function aiInput(s) {
  const P = s.player;
  let best = null, bd = Infinity;
  const consider = (e) => { if (!e || e.alive === false || e.active === false) return; const d = (e.x - P.x) ** 2 + (e.z - P.z) ** 2; if (d < bd) { bd = d; best = e; } };
  if ((s.stage === 'adult' || s.stage === 'elder') && (s.mate || s.nest)) consider(s.mate || s.nest);
  else { for (const f of s.food) consider(f); for (const p of s.prey) consider(p); }
  if (!best) return { mx: Math.sin(s.time), mz: Math.cos(s.time), sprint: false };
  const dx = best.x - P.x, dz = best.z - P.z, d = Math.hypot(dx, dz) || 1;
  let ax = dx / d, az = dz / d;
  for (const pr of s.predators) { if (!pr.aggro) continue; const pdx = P.x - pr.x, pdz = P.z - pr.z, pd = Math.hypot(pdx, pdz) || 1; if (pd < 6) { ax += (pdx / pd) * 1.5; az += (pdz / pd) * 1.5; } }
  const al = Math.hypot(ax, az) || 1;
  return { mx: ax / al, mz: az / al, sprint: bd > 9 };
}

console.log('sim tests');

// 1) boots for every species without throwing, sane initial state
for (const id of SPECIES_LIST) {
  let s;
  try { s = createRun({ speciesId: id, seed: 12345 }); } catch (e) { console.error('  THROW boot', id, e.message); fail++; continue; }
  ok(`${id}: boots`, !!s && s.alive === true);
  ok(`${id}: full needs`, s.stats.hunger === 100 && s.stats.health === 100);
  ok(`${id}: baby stage`, s.stage === 'baby');
  ok(`${id}: born event`, s.events.some(e => e.t === 'born'));
  ok(`${id}: has life goals`, Array.isArray(s.goals) && s.goals.length >= 3);
  // grazers/hunters have targets; mayfly + anglerfish never eat and have none
  const hasTargets = s.food.length > 0 || s.prey.length > 0;
  ok(`${id}: has food/prey unless it never eats`, s.species.noEat ? !hasTargets : hasTargets);
}

// 2) determinism — same seed, same scripted input → identical trajectory
{
  const a = createRun({ speciesId: 'turtle', seed: 777 });
  const b = createRun({ speciesId: 'turtle', seed: 777 });
  let identical = true;
  for (let i = 0; i < 1800; i++) {
    const ia = aiInput(a), ib = aiInput(b);
    step(a, ia, DT); step(b, ib, DT);
    if (!approx(a.player.x, b.player.x) || !approx(a.stats.hunger, b.stats.hunger) || a.stage !== b.stage) { identical = false; break; }
  }
  ok('determinism: identical runs', identical);
}

// 3) eating works — a fed grazer banks meals + run DNA
{
  const s = createRun({ speciesId: 'salmon', seed: 42 });
  s.predators.length = 0;          // isolate feeding from the bears
  s.stats.hunger = 50;
  for (let i = 0; i < 60 * 25; i++) step(s, aiInput(s), DT);
  ok('eating: ate at least one meal', s.meals > 0);
  ok('eating: gained run DNA', liveDna(s) > 0);
}

// 4) stages advance over a full life; old age kills if nothing else does
{
  const s = createRun({ speciesId: 'turtle', seed: 9 });
  s.predators.length = 0;          // isolate the age clock from danger
  s.mods.frail = false;
  const seen = new Set();
  for (let i = 0; i < 60 * 460 && s.alive; i++) {
    s.stats.hunger = 80;           // keep fed so we test the age clock, not starvation
    step(s, aiInput(s), DT);
    seen.add(s.stage);
  }
  ok('stages: reached juvenile', seen.has('juvenile'));
  ok('stages: reached adult', seen.has('adult'));
  ok('stages: reached elder', seen.has('elder'));
  ok('death: died by old age when fed & safe', !s.alive && s.cause === 'oldAge');
}

// 5) reproduction is reachable — drive an adult turtle onto its nest
{
  const s = createRun({ speciesId: 'turtle', seed: 5 });
  s.predators.length = 0;
  s.mods.frail = false;
  s.time = s.lifespan * 0.45;       // fast-forward into adulthood
  for (let i = 0; i < 60 * 120 && s.alive && !s.reproduced; i++) {
    s.stats.hunger = 90;
    step(s, aiInput(s), DT);
  }
  ok('reproduction: produced offspring', s.reproduced && s.offspring >= 1);
}

// 6) lifespans land in sane bands; the mayfly is the shortest-lived of all
{
  const turtle = createRun({ speciesId: 'turtle', seed: 1 });
  ok('lifespan: starter turtle in 90–400s band', turtle.lifespan >= 90 && turtle.lifespan <= 400);
  const mayfly = createRun({ speciesId: 'mayfly', seed: 1 });
  let shortest = true;
  for (const id of SPECIES_LIST) { if (id === 'mayfly') continue; if (createRun({ speciesId: id, seed: 1 }).lifespan <= mayfly.lifespan) shortest = false; }
  ok('lifespan: mayfly is the shortest-lived', shortest);
}

// 7) predators can actually end a run (a passive hatchling on the gull beach)
{
  let died = false;
  for (let seed = 1; seed <= 8 && !died; seed++) {
    const s = createRun({ speciesId: 'turtle', seed });
    for (let i = 0; i < 60 * 220 && s.alive; i++) step(s, { mx: 0, mz: 0, sprint: false }, DT); // sit still
    if (!s.alive && (s.cause === 'predator' || s.cause === 'starved')) died = true;
  }
  ok('danger: a passive hatchling eventually dies', died);
}

// 8) life goals advance in order and award live action EXP
{
  const s = createRun({ speciesId: 'turtle', seed: 8 });
  s.predators.length = 0;
  let goalEvt = false;
  for (let i = 0; i < 60; i++) { step(s, { mx: 0, mz: 0 }, DT); if (s.events.some(e => e.t === 'goal')) goalEvt = true; }
  ok('goals: first goal (hatch) completes', s.goals[0].done && s.goalIndex >= 1);
  ok('goals: a goal event fires', goalEvt);
  ok('goals: completing a goal awards action EXP', s.actionExp >= C.xp.goal);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
