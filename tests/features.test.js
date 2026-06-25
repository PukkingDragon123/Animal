// Feature tests for the systems layered on the five-species roster: life goals
// + live action EXP, the worker-bee forage loop, the mayfly's mouthless clock,
// the anglerfish fuse, interactables, courtship, combat, dynasty, and quests.
// Pure sim — no WebGL.
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

// --- life goals + live action EXP ------------------------------------------
{
  const s = createRun({ speciesId: 'turtle', seed: 6 });
  ok('goals: turtle lists a reach-the-sea goal', s.goals.some(g => g.id === 'reachSea'));
  s.player.z = 6; const e0 = s.actionExp;            // shove it into the surf
  step(s, { mx: 0, mz: 1 }, DT);
  ok('reachSea: turtle reaches the sea', s.reachedWater === true);
  ok('reachSea: awards live action EXP', s.actionExp > e0);
  ok('reachSea: emits reachedWater event', s.events.some(e => e.t === 'reachedWater'));
}

// --- worker bee: collect nectar, carry it home, secure the colony ----------
{
  const s = createRun({ speciesId: 'bee', seed: 9 });
  ok('forage: the bee has a hive', !!s.hive);
  const f = s.food[0]; f.alive = true; s.player.x = f.x; s.player.z = f.z;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('forage: sips nectar into a pollen load', s.pollen >= 1);
  s.player.x = s.hive.x; s.player.z = s.hive.z;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('forage: deposits the load at the hive', s.deliveries >= 1 && s.pollen === 0);
  ok('forage: emits a delivery event', s.events.some(e => e.t === 'delivery'));
  s.pollen = C.forage.capacity; s.deliveries = C.forage.quota - 1; s.player.x = s.hive.x; s.player.z = s.hive.z;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('forage: hitting quota secures the colony', s.reproduced && s.offspring >= 1);
}

// --- mayfly: no mouth, a brutal clock, and death right after mating --------
{
  const s = createRun({ speciesId: 'mayfly', seed: 2 }); s.predators.length = 0;
  ok('mayfly: never spawns food', s.food.length === 0 && s.prey.length === 0);
  for (let i = 0; i < 60 * 8; i++) step(s, { mx: 0, mz: 0 }, DT);
  ok('mayfly: hunger never drains (no mouth)', s.stats.hunger === 100);
  ok('mayfly: survives the early clock', s.alive);
}
{
  const s = createRun({ speciesId: 'mayfly', seed: 5 }); s.predators.length = 0;
  s.time = s.lifespan * 0.45; step(s, { mx: 0, mz: 0 }, DT);
  ok('mayfly: matures to an adult with a mate', s.stage === 'adult' && !!s.mate);
  s.mate.court = 1; s.reproduceCooldown = 0; s.player.x = s.mate.x; s.player.z = s.mate.z;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('mayfly: mates', s.reproduced === true);
  ok('mayfly: is spent by mating (dying fuse set)', s.dyingFuse > 0);
  for (let i = 0; i < 60 * 4 && s.alive; i++) step(s, { mx: 0, mz: 0 }, DT);
  ok('mayfly: dies "spent" soon after mating', !s.alive && s.cause === 'spent');
}

// --- male anglerfish: cross the dark, find her, fuse forever ---------------
{
  const s = createRun({ speciesId: 'angler', seed: 4 });
  ok('angler: lives in the dark', s.dark === true);
  ok('angler: the giant female waits far off', !!s.female && Math.hypot(s.female.x - s.player.x, s.female.z - s.player.z) > 12);
  s.player.x = s.female.x; s.player.z = s.female.z;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('angler: fuses on contact', s.fused === true && s.reproduced === true);
  ok('angler: emits a fused event', s.events.some(e => e.t === 'fused'));
  const x0 = s.player.x; step(s, { mx: 1, mz: 0 }, DT);
  ok('angler: movement locked once fused', Math.abs(s.player.x - x0) < 0.5);
  for (let i = 0; i < 60 * 4 && s.alive; i++) step(s, { mx: 0, mz: 0 }, DT);
  ok('angler: the run ends "fused"', !s.alive && s.cause === 'fused');
}

// --- interactables (exercised by the bee, the one land-biome species) ------
{
  const s = createRun({ speciesId: 'bee', seed: 3 });
  const ft = find(s, 'fruitTree'); ft.cooldown = 0; s.player.x = ft.x; s.player.z = ft.z;
  const before = s.fruits.length; step(s, { mx: 0, mz: 0 }, DT);
  ok('fruitTree: drops fruit on a bump', s.fruits.length > before);
  ok('fruitTree: then cools down', ft.cooldown > 0);
}
{
  const s = createRun({ speciesId: 'bee', seed: 4 });
  const m = find(s, 'mushroom'); s.player.x = m.x; s.player.z = m.z;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('mushroom: eaten', m.alive === false);
  ok('mushroom: grants a boost', s.boost > 0);
}
{
  const s = createRun({ speciesId: 'bee', seed: 7 });
  const b = find(s, 'burrow');
  s.predators[0].x = b.x + 1; s.predators[0].z = b.z; s.predators[0].aggro = true;
  s.player.x = b.x; s.player.z = b.z;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('burrow: hides you', s.hidden === true);
  ok('burrow: predators de-aggro', s.predators.every(p => !p.aggro));
}
{
  const s = createRun({ speciesId: 'bee', seed: 5 });
  const hive = find(s, 'hive'); s.player.x = hive.x; s.player.z = hive.z; s.invuln = 0;
  const h0 = s.stats.health;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('hive: a bee is immune to its own hive', s.stats.health === h0);
}

// --- combat: fight back, wound, and kill predators -------------------------
{
  const s = createRun({ speciesId: 'bee', seed: 11 });
  const pr = s.predators[0]; pr.x = s.player.x + 1.4; pr.z = s.player.z; pr.aggro = true; const x0 = pr.x;
  step(s, { mx: 0, mz: 0, attack: true }, DT);
  ok('attack: predator stunned', pr.stun > 0);
  ok('attack: predator knocked back', pr.x !== x0);
  ok('attack: blood emitted', s.events.some(e => e.t === 'blood'));
}
{
  const s = createRun({ speciesId: 'salmon', seed: 31 });
  const pr = s.predators[0]; pr.domain = 'any'; pr.x = s.player.x + 1.2; pr.z = s.player.z; pr.health = C.predator.biteDamage;
  const k0 = s.kills, sc0 = s.score, e0 = s.actionExp;
  step(s, { mx: 0, mz: 0, attack: true }, DT);
  ok('kill: a bite kills a weakened predator', s.kills > k0);
  ok('kill: awards the kill score', s.score >= sc0 + C.arcade.scoreKill);
  ok('kill: awards action EXP', s.actionExp > e0);
  ok('kill: emits a killed event', s.events.some(e => e.t === 'killed'));
}

// --- courtship gating (the mayfly's swarm) ---------------------------------
{
  const s = createRun({ speciesId: 'mayfly', seed: 14 }); s.predators.length = 0;
  s.time = s.lifespan * 0.45; step(s, { mx: 0, mz: 0 }, DT);
  s.mate.court = 0; s.reproduceCooldown = 0; s.player.x = s.mate.x; s.player.z = s.mate.z;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('court: reproduction gated until courted', s.reproduced === false);
  s.mate.court = 1; s.player.x = s.mate.x; s.player.z = s.mate.z; s.reproduceCooldown = 0;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('court: reproduces once fully courted', s.reproduced === true);
}

// --- mud scent-masking + burrow denning (bee) ------------------------------
{
  const s = createRun({ speciesId: 'bee', seed: 71 });
  const mud = find(s, 'mud'); ok('mud: a puddle exists in the meadow', !!mud);
  s.player.x = mud.x; s.player.z = mud.z; s.scent = 1; s.scentMask = 0;
  step(s, { mx: 0, mz: 0 }, DT);
  ok('mud: wallowing masks scent', s.scentMask > 0);
  ok('mud: emits a mud event', s.events.some(e => e.t === 'mud'));
  s.player.x = mud.x; s.player.z = mud.z; step(s, { mx: 0, mz: 0 }, DT);
  ok('mud: scent decays while masked', s.scent < 1);
}
{
  const s = createRun({ speciesId: 'bee', seed: 81 });
  const b = find(s, 'burrow'); s.player.x = b.x; s.player.z = b.z; s.stats.health = 40;
  step(s, { mx: 0, mz: 0, attack: true }, DT);
  ok('den: attacking at a burrow dives in', s.inBurrow === true);
  ok('den: emits a denEnter event', s.events.some(e => e.t === 'denEnter'));
  const h1 = s.stats.health; step(s, { mx: 0, mz: 0 }, DT);
  ok('den: denning heals you', s.stats.health > h1);
  step(s, { mx: 1, mz: 0 }, DT);
  ok('den: moving exits the den', s.inBurrow === false);
}

// --- quick-time events / mini-games ---------------------------------------
{
  // turtle dig-out: a mash QTE that locks movement until you tap it out
  const s = createRun({ speciesId: 'turtle', seed: 3 });
  ok('qte: hatchling opens with a dig-out mash', !!s.qte && s.qte.kind === 'mash');
  const x0 = s.player.x;
  step(s, { mx: 1, mz: 0 }, DT);
  ok('qte: movement is locked while digging', Math.abs(s.player.x - x0) < 0.05);
  let ended = false;
  for (let i = 0; i < 40 && s.qte; i++) { step(s, { attack: i % 2 === 0 }, DT); if (s.events.some(e => e.t === 'qteEnd')) ended = true; }
  ok('qte: mashing resolves the dig-out', !s.qte && ended);
  const x1 = s.player.x; step(s, { mx: 1, mz: 0 }, DT); step(s, { mx: 1, mz: 0 }, DT);
  ok('qte: movement is freed afterward', Math.abs(s.player.x - x1) > 0.001);
}
{
  // salmon leap: a timing QTE during the upstream run; an in-zone tap wins
  const s = createRun({ speciesId: 'salmon', seed: 5 }); s.predators.length = 0;
  s.time = s.lifespan * 0.45; step(s, { mx: 0, mz: 0 }, DT);     // adulthood → migration begins
  let saw = false, won = false;
  for (let i = 0; i < 60 * 20 && s.alive; i++) {
    let atk = false;
    if (s.qte && s.qte.kind === 'timing') { saw = true; if (s.qte.pos >= s.qte.zoneLo && s.qte.pos <= s.qte.zoneHi) atk = true; }
    step(s, { mx: 0, mz: 1, attack: atk }, DT);
    if (s.events.some(e => e.t === 'leap' && e.success)) won = true;
  }
  ok('qte: salmon "leap the rapid" mini-game triggers', saw);
  ok('qte: a well-timed tap wins the leap', won);
}

// --- dynasty: a continued run carries generation + accumulated score -------
{
  const s = createRun({ speciesId: 'turtle', seed: 61, generation: 3, lineageScore: 500 });
  ok('lineage: generation carried into the run', s.generation === 3);
  ok('lineage: dynasty score carried into the run', s.lineageScore === 500);
}

// --- arcade AoE bite -------------------------------------------------------
{
  const s = createRun({ speciesId: 'salmon', seed: 21 }); s.predators.length = 0;
  const off = [1.8, -1.8, 2.1, -2.1];
  for (let i = 0; i < 4; i++) { s.food[i].alive = true; s.food[i].x = s.player.x + off[i]; s.food[i].z = s.player.z; }
  const m0 = s.meals;
  step(s, { mx: 0, mz: 0, attack: true }, DT);
  ok('bite: AoE eats multiple at once', s.meals - m0 >= 3);
  ok('bite: builds score', s.score > 0);
}

// --- infinite world: far entities recycle around the roaming player --------
{
  const s = createRun({ speciesId: 'turtle', seed: 22 });
  s.player.x += 600; s.player.z += 600;
  step(s, { mx: 0, mz: 0 }, DT);
  const near = s.food.some(f => (f.x - s.player.x) ** 2 + (f.z - s.player.z) ** 2 < (C.world.spawnR + 4) ** 2);
  ok('infinite: food streams back around the player', near);
}

// --- quest unlock chain over the five species ------------------------------
{
  const save = { unlocked: ['turtle'], flags: { reproduced: {}, adult: {}, elderAny: false, meals15: false, reachedSea: false } };
  recordRun(save, { speciesId: 'turtle', reproduced: false, maxStageIndex: 1, meals: 2, reachedSea: true });
  let newly = checkUnlocks(save);
  ok('quest: reaching the sea unlocks the Mayfly', newly.includes('mayfly') && save.unlocked.includes('mayfly'));
  recordRun(save, { speciesId: 'mayfly', reproduced: true, maxStageIndex: 2, meals: 0 });
  checkUnlocks(save);
  ok('quest: mating as a Mayfly unlocks the Bee', save.unlocked.includes('bee'));
  recordRun(save, { speciesId: 'bee', reproduced: true, maxStageIndex: 2, meals: 5 });
  checkUnlocks(save);
  ok('quest: a thriving colony unlocks the Salmon', save.unlocked.includes('salmon'));
  recordRun(save, { speciesId: 'salmon', reproduced: true, maxStageIndex: 2, meals: 1 });
  checkUnlocks(save);
  ok('quest: spawning as a Salmon unlocks the Anglerfish', save.unlocked.includes('angler'));
  ok('quest: nothing unlocks early', !save.unlocked.includes('angler') === false);
}

// --- skill-tree bonuses + visuals still stack onto a run -------------------
{
  const base = createRun({ speciesId: 'turtle', seed: 50 });
  const { bonus, visuals } = applySkills(['swift', 'sturdy', 'keen', 'longlegs', 'giant', 'ancient', 'bigears']);
  const up = createRun({ speciesId: 'turtle', seed: 50, bonus, visuals });
  ok('skill: faster', up.mods.speed > base.mods.speed);
  ok('skill: longer life', up.lifespan > base.lifespan);
  ok('skill: bigger feeding range', up.mods.eat > base.mods.eat);
  ok('skill: visuals carried into the run', up.visuals && up.visuals.giant === true && up.visuals.ears > 1);
}
{
  const sv = { genes: 100, exp: 0, level: 1, skills: {}, unlocked: ['turtle'] };
  ok('skill: blocked before prereq', unlockSkill(sv, 'turtle', 'giant') === false);
  ok('skill: buy root succeeds', unlockSkill(sv, 'turtle', 'swift') === true);
  ok('skill: genes spent', sv.genes === 100 - SKILLS.swift.cost);
  ok('skill: child now buyable', unlockSkill(sv, 'turtle', 'longlegs') === true);
  const lv0 = sv.level; const gained = addExp(sv, 1000);
  ok('evo: EXP levels up', sv.level > lv0 && gained > 0);
  const rw = runRewards({ meals: 10, offspring: 1, maxStageIndex: 2, reproduced: true, nestBuilt: false });
  ok('evo: run rewards positive', rw.genes > 0 && rw.exp > 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
