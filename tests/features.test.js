// Feature tests for the new systems: interactables (fruit/mushroom/hive/burrow),
// nest building, and quest-based unlocks. Pure sim — no WebGL.
import { createRun, step } from '../src/sim.js';
import { CONFIG as C } from '../src/config.js';
import { recordRun, checkUnlocks } from '../src/quests.js';
import { buyUpgrade, speciesUpgrades, runRewards, addExp, upgradeCost } from '../src/evolution.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) pass++; else { fail++; console.error('  FAIL:', n); } };
const DT = 1 / 60;
const find = (s, t) => s.interactables.find(o => o.type === t);

console.log('feature tests');

// fruit trees drop fruit on bump, then cool down
{
  const s = createRun({ speciesId: 'rabbit', seed: 3 });
  const ft = find(s, 'fruitTree'); ft.cooldown = 0;
  s.player.x = ft.x; s.player.z = ft.z;
  const before = s.fruits.length;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('fruitTree: drops fruit', s.fruits.length > before);
  ok('fruitTree: goes on cooldown', ft.cooldown > 0);
}

// mushrooms give a speed boost and vanish
{
  const s = createRun({ speciesId: 'rabbit', seed: 4 });
  const m = find(s, 'mushroom');
  s.player.x = m.x; s.player.z = m.z;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('mushroom: eaten', m.alive === false);
  ok('mushroom: grants boost', s.boost > 0);
}

// burrows hide the player; predators lose aggro and can't hit
{
  const s = createRun({ speciesId: 'rabbit', seed: 7 });
  const b = find(s, 'burrow');
  s.predators[0].x = b.x + 1; s.predators[0].z = b.z; s.predators[0].aggro = true;
  s.player.x = b.x; s.player.z = b.z;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('burrow: hidden', s.hidden === true);
  ok('burrow: predators de-aggro', s.predators.every(p => !p.aggro));
  ok('burrow: danger zero', s.danger === 0);
}

// beehives sting a non-bee
{
  const s = createRun({ speciesId: 'rabbit', seed: 5 });
  const hive = find(s, 'hive');
  s.player.x = hive.x; s.player.z = hive.z; s.invuln = 0;
  const h0 = s.stats.health;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('hive: stings (health down or knockback)', s.stats.health < h0 || s.invuln > 0);
}

// nest building: salmon must gather twigs, then build, then reproduce
{
  const s = createRun({ speciesId: 'salmon', seed: 2 });
  s.time = s.lifespan * 0.45;            // jump to adulthood
  step(s, { mx: 0, mz: 0 }, DT);
  ok('salmon: adult', s.stage === 'adult');
  ok('salmon: needs materials', s.needsMaterials === true && s.nestBuilt === false);
  ok('salmon: twigs spawned', s.nestTwigs.length > 0);
  ok('salmon: nest site exists', !!s.nest);

  let got = 0;
  for (const tw of s.nestTwigs) {
    if (got >= C.nest.materialsNeeded) break;
    s.player.x = tw.x; s.player.z = tw.z; s.stats.hunger = 90;
    step(s, { mx: 0, mz: 0 }, DT);
    if (!tw.alive) got++;
  }
  ok('salmon: gathered enough twigs', s.nestMaterials >= C.nest.materialsNeeded);

  s.player.x = s.nest.x; s.player.z = s.nest.z; s.stats.hunger = 90;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('salmon: nest built', s.nestBuilt === true);

  s.player.x = s.nest.x; s.player.z = s.nest.z; s.stats.hunger = 95; s.reproduceCooldown = 0;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('salmon: reproduced at the nest', s.reproduced === true && s.offspring >= 1);
}

// bees skip twig-gathering (too short-lived) — nest is ready on adulthood
{
  const s = createRun({ speciesId: 'bee', seed: 1 });
  s.time = s.lifespan * 0.45;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('bee: adult', s.stage === 'adult');
  ok('bee: nest pre-built (no twigs)', s.nestBuilt === true && s.needsMaterials === false);
}

// quest-based unlock chain
{
  const save = { unlocked: ['rabbit'], flags: { reproduced: {}, adult: {}, elderAny: false, meals15: false } };
  recordRun(save, { speciesId: 'rabbit', reproduced: true, maxStageIndex: 2, meals: 5 });
  let newly = checkUnlocks(save);
  ok('quest: reproduce-as-rabbit unlocks Bee', newly.includes('bee') && save.unlocked.includes('bee'));

  recordRun(save, { speciesId: 'bee', reproduced: false, maxStageIndex: 2, meals: 3 });
  checkUnlocks(save);
  ok('quest: adult-as-bee unlocks Penguin', save.unlocked.includes('penguin'));

  recordRun(save, { speciesId: 'penguin', reproduced: false, maxStageIndex: 3, meals: 20 });
  checkUnlocks(save);
  ok('quest: reach-elder unlocks Salmon', save.unlocked.includes('salmon'));
  ok('quest: 15-meals unlocks Fox', save.unlocked.includes('fox'));
  ok('quest: locked until earned (Shark still locked)', !save.unlocked.includes('shark'));
}

// attack: bonk + stun a predator (fight back)
{
  const s = createRun({ speciesId: 'rabbit', seed: 11 });
  const pr = s.predators[0]; pr.x = s.player.x + 1.4; pr.z = s.player.z; pr.aggro = true; const x0 = pr.x;
  step(s, { mx: 0, mz: 0, attack: true }, DT);
  ok('attack: predator stunned', pr.stun > 0);
  ok('attack: predator knocked back', pr.x !== x0);
  ok('attack: predator lost aggro', pr.aggro === false);
  ok('attack: blood emitted', s.events.some(e => e.t === 'blood'));
}

// attack: hunter lunge-kills prey just out of contact range
{
  const s = createRun({ speciesId: 'fox', seed: 9 });
  const pr = s.prey[0]; pr.alive = true; pr.x = s.player.x + 2.3; pr.z = s.player.z;
  const m0 = s.meals;
  step(s, { mx: 0, mz: 0, attack: true }, DT);
  ok('attack hunt: lunge-kills prey', s.meals > m0);
}

// persistent upgrades stack onto a run
{
  const base = createRun({ speciesId: 'rabbit', seed: 50 });
  const up = createRun({ speciesId: 'rabbit', seed: 50, upgrades: { speed: 5, vitality: 3, longevity: 5, senses: 5, fertility: 3 } });
  ok('upgrade: faster', up.mods.speed > base.mods.speed);
  ok('upgrade: longer life', up.lifespan > base.lifespan);
  ok('upgrade: more hits', up.hitsLeft > base.hitsLeft || base.mods.frail);
  ok('upgrade: fertility≥3 → fertile', up.mods.fertile === true);
  ok('upgrade: bigger feeding range', up.mods.eat > base.mods.eat);
}

// evolution economy: spend genes, level via EXP, run rewards
{
  const sv = { genes: 100, exp: 0, level: 1, evolution: {}, unlocked: ['rabbit'] };
  ok('evo: buy succeeds', buyUpgrade(sv, 'rabbit', 'speed') === true);
  ok('evo: genes spent', sv.genes === 100 - upgradeCost(0));
  ok('evo: level recorded', speciesUpgrades(sv, 'rabbit').speed === 1);
  ok('evo: cannot overspend', (() => { const poor = { genes: 0, evolution: {} }; return buyUpgrade(poor, 'rabbit', 'speed') === false; })());
  const lv0 = sv.level; const gained = addExp(sv, 1000);
  ok('evo: EXP levels up', sv.level > lv0 && gained > 0);
  const rw = runRewards({ meals: 10, offspring: 1, maxStageIndex: 2, reproduced: true, nestBuilt: false });
  ok('evo: run rewards positive', rw.genes > 0 && rw.exp > 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
