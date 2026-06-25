// Feature tests for the new systems: interactables (fruit/mushroom/hive/burrow),
// nest building, and quest-based unlocks. Pure sim — no WebGL.
import { createRun, step } from '../src/sim.js';
import { CONFIG as C } from '../src/config.js';
import { recordRun, checkUnlocks } from '../src/quests.js';
import { runRewards, addExp } from '../src/evolution.js';
import { applySkills, speciesSkills, unlockSkill, SKILLS } from '../src/skills.js';

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

// skill-tree bonuses + visuals stack onto a run
{
  const base = createRun({ speciesId: 'rabbit', seed: 50 });
  const { bonus, visuals } = applySkills(['swift', 'sturdy', 'keen', 'longlegs', 'giant', 'ancient', 'bigears']);
  const up = createRun({ speciesId: 'rabbit', seed: 50, bonus, visuals });
  ok('skill: faster', up.mods.speed > base.mods.speed);
  ok('skill: longer life', up.lifespan > base.lifespan);
  ok('skill: more hits', up.hitsLeft > base.hitsLeft || base.mods.frail);
  ok('skill: bigger feeding range', up.mods.eat > base.mods.eat);
  ok('skill: bigger size', up.mods.size > base.mods.size);
  ok('skill: visuals carried into the run', up.visuals && up.visuals.giant === true && up.visuals.ears > 1);
}

// skill-tree economy: prereqs, gene spend, EXP levels, run rewards
{
  const sv = { genes: 100, exp: 0, level: 1, skills: {}, unlocked: ['rabbit'] };
  ok('skill: blocked before prereq', unlockSkill(sv, 'rabbit', 'giant') === false);
  ok('skill: buy root succeeds', unlockSkill(sv, 'rabbit', 'swift') === true);
  ok('skill: genes spent', sv.genes === 100 - SKILLS.swift.cost);
  ok('skill: recorded', speciesSkills(sv, 'rabbit').includes('swift'));
  ok('skill: child now buyable', unlockSkill(sv, 'rabbit', 'longlegs') === true);
  ok('skill: applySkills aggregates', (() => { const a = applySkills(speciesSkills(sv, 'rabbit')); return a.bonus.speedMul > 1 && a.visuals.legs > 1; })());
  ok('skill: cannot overspend', (() => { const poor = { genes: 0, skills: {} }; return unlockSkill(poor, 'rabbit', 'swift') === false; })());
  const lv0 = sv.level; const gained = addExp(sv, 1000);
  ok('evo: EXP levels up', sv.level > lv0 && gained > 0);
  const rw = runRewards({ meals: 10, offspring: 1, maxStageIndex: 2, reproduced: true, nestBuilt: false });
  ok('evo: run rewards positive', rw.genes > 0 && rw.exp > 0);
}

// arcade: AoE bite chomps several foods at once and builds score + combo
{
  const s = createRun({ speciesId: 'rabbit', seed: 21 });
  const off = [1.8, -1.8, 2.1, -2.1];                 // between walk-over radius and bite radius
  for (let i = 0; i < 4; i++) { s.food[i].alive = true; s.food[i].x = s.player.x + off[i]; s.food[i].z = s.player.z; }
  const m0 = s.meals;
  step(s, { mx: 0, mz: 0, attack: true }, DT);
  ok('bite: AoE eats multiple at once', s.meals - m0 >= 3);
  ok('bite: score increased', s.score > 0);
  ok('bite: combo built', s.combo >= 2);
}

// infinite world: far entities recycle back around the roaming player
{
  const s = createRun({ speciesId: 'rabbit', seed: 22 });
  s.player.x += 600; s.player.z += 600;               // teleport far past the old arena
  step(s, { mx: 0, mz: 0 }, DT);
  const near = s.food.some(f => (f.x - s.player.x) ** 2 + (f.z - s.player.z) ** 2 < (C.world.spawnR + 4) ** 2);
  ok('infinite: food streams back around the player', near);
  ok('infinite: no wall — player roams past the old radius', Math.hypot(s.player.x, s.player.z) > C.world.radius);
}

// combat: a bitten predator takes damage and can be killed (apex moment)
{
  const s = createRun({ speciesId: 'rabbit', seed: 31 });
  const pr = s.predators[0]; pr.domain = 'any'; pr.x = s.player.x + 1.2; pr.z = s.player.z;
  pr.health = C.predator.biteDamage;                  // one clean bite finishes it
  const k0 = s.kills, sc0 = s.score;
  step(s, { mx: 0, mz: 0, attack: true }, DT);
  ok('kill: a bite kills a weakened predator', s.kills > k0);
  ok('kill: awards the kill score', s.score >= sc0 + C.arcade.scoreKill);
  ok('kill: emits a killed event', s.events.some(e => e.t === 'killed'));
}

// combat: a healthy predator only loses health from one bite (not one-shot)
{
  const s = createRun({ speciesId: 'rabbit', seed: 32 });
  const pr = s.predators[0]; pr.domain = 'any'; pr.x = s.player.x + 1.2; pr.z = s.player.z;
  pr.health = pr.maxHealth = C.predator.health;
  step(s, { mx: 0, mz: 0, attack: true }, DT);
  ok('combat: predator wounded but not dead', pr.health < C.predator.health && pr.health > 0);
  ok('combat: predator shows a hurt flash', pr.hurt > 0);
}

// courtship: a mate must be wooed (court ≥ 1) before reproducing
{
  const s = createRun({ speciesId: 'rabbit', seed: 41 });
  s.time = s.lifespan * 0.45; step(s, { mx: 0, mz: 0 }, DT);     // grow to adult → mate appears
  ok('court: a mate is placed at adulthood', !!s.mate);
  const farPreds = () => s.predators.forEach(p => { p.x = s.player.x + 200; p.z = s.player.z + 200; p.aggro = false; });
  farPreds();
  // near + fed but not yet courted → reproduction is gated
  s.player.x = s.mate.x; s.player.z = s.mate.z; s.stats.hunger = 95; s.reproduceCooldown = 0; s.mate.court = 0;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('court: reproduction gated until courted', s.reproduced === false);
  // offering a gift (attack near the mate) raises courtship
  const c0 = s.mate.court || 0;
  farPreds(); s.player.x = s.mate.x; s.player.z = s.mate.z; s.stats.hunger = 95;
  step(s, { mx: 0, mz: 0, attack: true }, DT);
  ok('court: a gift raises courtship', (s.mate.court || 0) > c0);
  ok('court: emits a gift event', s.events.some(e => e.t === 'gift'));
  // fully courted → reproduces, and the brief mating window opens
  farPreds(); s.mate.court = 1; s.stats.hunger = 95; s.reproduceCooldown = 0; s.player.x = s.mate.x; s.player.z = s.mate.z;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('court: reproduces once fully courted', s.reproduced === true && s.offspring >= 1);
  ok('court: opens a mating animation window', s.matingTimer > 0);
}

// dynasty: a continued offspring run carries generation + accumulated score,
// and the inherited bloodline bonus makes it a touch hardier than gen 1
{
  const s = createRun({ speciesId: 'rabbit', seed: 61, generation: 3, lineageScore: 500 });
  ok('lineage: generation carried into the run', s.generation === 3);
  ok('lineage: dynasty score carried into the run', s.lineageScore === 500);
}

// mud: wallowing masks your scent so predators lose the trail
{
  const s = createRun({ speciesId: 'rabbit', seed: 71 });
  const mud = find(s, 'mud');
  ok('mud: a puddle exists in a land biome', !!mud);
  s.player.x = mud.x; s.player.z = mud.z; s.scent = 1; s.scentMask = 0;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('mud: wallowing masks scent', s.scentMask > 0);
  ok('mud: emits a mud event', s.events.some(e => e.t === 'mud'));
  s.player.x = mud.x; s.player.z = mud.z;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('mud: scent decays while masked', s.scent < 1);
}

// burrow home: attack to dive in (a healing den); moving pops you back out
{
  const s = createRun({ speciesId: 'rabbit', seed: 81 });
  const b = find(s, 'burrow');
  s.player.x = b.x; s.player.z = b.z; s.stats.health = 40;
  step(s, { mx: 0, mz: 0, attack: true }, DT);
  ok('den: attacking at a burrow dives in', s.inBurrow === true);
  ok('den: emits a denEnter event', s.events.some(e => e.t === 'denEnter'));
  const h1 = s.stats.health;
  step(s, { mx: 0, mz: 0 }, DT);                     // rest underground → heal
  ok('den: denning heals you', s.stats.health > h1);
  step(s, { mx: 1, mz: 0 }, DT);                     // any movement pops you out
  ok('den: moving exits the den', s.inBurrow === false);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
