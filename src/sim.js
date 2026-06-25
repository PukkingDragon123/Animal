// Pure simulation core — no rendering, no DOM, no Three.js. Deterministic from
// a seed (fixed timestep + seeded RNG). The renderer reads this state; tests
// drive step() directly in Node. Logic separate from rendering (design §6.4).

import { CONFIG as C } from './config.js';
import { makeRng } from './rng.js';
import { rollMutations, applyMutations } from './mutations.js';
import { speciesOf } from './species.js';
import { biomeOf } from './biomes.js';

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const dist2 = (ax, az, bx, bz) => { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; };

let _eid = 1;
const nextId = () => _eid++;

// a point on a ring around (cx,cz) — the infinite world streams content around the player
function ringAround(rng, cx, cz, minR, maxR) {
  const a = rng.next() * TAU;
  const r = Math.sqrt(rng.range(minR * minR, maxR * maxR));
  return { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r };
}
// if an entity drifts past the despawn ring, recycle it to a fresh spot around the player
function recycleFar(state, e, minR) {
  const P = state.player, dr = C.world.despawnR;
  if (dist2(e.x, e.z, P.x, P.z) > dr * dr) {
    const p = ringAround(state.rng, P.x, P.z, minR || C.world.spawnR * 0.82, C.world.spawnR);
    e.x = p.x; e.z = p.z; return true;
  }
  return false;
}
// arcade scoring: each eat builds a combo multiplier
function gainScore(state, base) {
  state.combo = Math.min(C.arcade.comboMax, state.combo + 1);
  state.comboTimer = C.arcade.comboWindow;
  const g = Math.round(base * (1 + state.combo * 0.15));
  state.score += g;
  return g;
}

// ---------------------------------------------------------------------------
// Run creation
// ---------------------------------------------------------------------------
export function createRun({ speciesId = 'rabbit', seed = 1, bonus = null, visuals = null, generation = 1, lineageScore = 0 }) {
  const rng = makeRng(seed);
  const species = speciesOf(speciesId);
  const biome = biomeOf(species.biome);
  const mutationIds = rollMutations(rng);
  const mods = applyMutations(mutationIds);

  // permanent skill-tree mutations stack on top of the run's random mutation
  if (bonus) {
    mods.speed *= bonus.speedMul || 1;
    mods.life *= bonus.lifeMul || 1;
    mods.eat *= bonus.eatMul || 1;
    mods.size *= bonus.sizeMul || 1;
    mods.extraHits += bonus.extraHits || 0;
    mods.dmg *= bonus.dmgMul || 1;
    if (bonus.fertile) mods.fertile = true;
  }

  // lifespan: base × mutation × struggle (bee = brutally short)
  let lifeMult = mods.life;
  if (species.struggle === 'shortlife') lifeMult *= 0.5;
  const lifespan = C.life.baseLifespanSec * lifeMult;

  // start position depends on the species' signature struggle
  let px = 0, pz = 0;
  if (species.struggle === 'hatchling') { px = 0; pz = -C.world.radius * 0.74; }      // up the beach
  else if (species.struggle === 'upstream') { px = 0; pz = -C.world.radius * 0.72; }   // downstream start

  const state = {
    seed, rng, speciesId, species, biome,
    mutationIds, mods,
    time: 0, lifespan, ageFrac: 0,
    dayPhase: 0.28, light: 1,            // day/night cycle (0 midnight … 0.5 noon)
    stage: 'baby', stageIndex: 0, stageScale: C.life.stageScale.baby,

    player: { x: px, z: pz, vx: 0, vz: 0, heading: 0, speed: 0, moving: false, stillFor: 0 },
    stats: { hunger: C.needs.hungerMax, energy: C.needs.energyMax, health: C.needs.healthMax },
    warmth: species.struggle === 'cold' ? 100 : 0,

    size: species.baseScale * C.life.stageScale.baby * mods.size,
    invuln: 0,
    hitsLeft: mods.frail ? 0 : (1 + mods.extraHits),

    food: [], predators: [], prey: [], warmthSpots: [],
    interactables: [], fruits: [], nestTwigs: [],
    mate: null, nest: null,
    reproduceCooldown: 0, attackCooldown: 0,
    visuals: visuals || {},
    nestMaterials: 0, nestBuilt: false, needsMaterials: false,
    hidden: false, boost: 0, maxStageIndex: 0,

    inWater: false, reachedWater: species.struggle !== 'hatchling',
    reachedAdultBonus: false,

    offspring: 0, meals: 0, dnaRun: 0, reproduced: false,
    score: 0, combo: 0, comboTimer: 0,
    generation, lineageScore,
    scent: 1, scentMask: 0, inBurrow: false, denTimer: 0, kills: 0,
    matingTimer: 0, ambushTimer: 0,
    alive: true, cause: null, lastHurtBy: null,
    danger: 0,
    objective: 'grow',
    events: [],
    quipShown: {},
  };

  // food pickups for grazers
  if (species.diet.kind === 'graze') {
    for (let i = 0; i < C.caps.foodItems; i++) state.food.push(spawnFood(state));
  } else {
    // hunters chase prey entities
    const n = species.diet.preyCount || 6;
    for (let i = 0; i < n; i++) state.prey.push(spawnPrey(state));
  }

  // predators
  const baseCount = species.predatorCount || 0;
  for (let i = 0; i < baseCount; i++) state.predators.push(spawnPredator(state));

  // warmth spots for the cold struggle
  if (species.struggle === 'cold') {
    for (let i = 0; i < 4; i++) {
      const p = ringAround(rng, state.player.x, state.player.z, 6, C.world.spawnR * 0.8);
      state.warmthSpots.push({ id: nextId(), x: p.x, z: p.z, r: 4.2 });
    }
  }

  spawnInteractables(state);

  updateObjective(state);
  state.events.push({ t: 'born' });
  return state;
}

function spawnFood(state) {
  const P = state.player, p = ringAround(state.rng, P.x, P.z, 4, C.world.spawnR);
  return { id: nextId(), x: p.x, z: p.z, phase: state.rng.next() * TAU, alive: true, respawn: 0 };
}

function spawnPrey(state) {
  const P = state.player, p = ringAround(state.rng, P.x, P.z, 8, C.world.spawnR);
  return { id: nextId(), x: p.x, z: p.z, vx: 0, vz: 0, phase: state.rng.next() * TAU,
           heading: state.rng.next() * TAU, retarget: 0, alive: true };
}

function spawnPredator(state) {
  const P = state.player, p = ringAround(state.rng, P.x, P.z, 14, C.world.spawnR);
  const domain = state.species.struggle === 'hatchling' ? 'beach' : 'any';
  return { id: nextId(), x: p.x, z: p.z, vx: 0, vz: 0, heading: state.rng.next() * TAU,
           build: state.species.predatorBuild || 'fox', state: 'wander', aggro: false,
           giveUp: 0, retarget: 0, phase: state.rng.next() * TAU, domain, stun: 0,
           health: C.predator.health, maxHealth: C.predator.health, hurt: 0 };
}

// interactive forest objects: shake fruit trees, forage mushrooms, hide in
// burrows, and beehives (a bee's nest, a sting for everyone else)
function spawnInteractables(state) {
  const I = C.interact, P = state.player, S = C.world.spawnR;
  if (!state.biome.water) {                       // land biomes only
    for (let i = 0; i < I.fruitTrees; i++) { const p = ringAround(state.rng, P.x, P.z, 7, S); state.interactables.push({ id: nextId(), type: 'fruitTree', x: p.x, z: p.z, cooldown: state.rng.range(0, 3), shake: 0 }); }
    for (let i = 0; i < I.mushrooms; i++) { const p = ringAround(state.rng, P.x, P.z, 5, S); state.interactables.push({ id: nextId(), type: 'mushroom', x: p.x, z: p.z, alive: true }); }
    for (let i = 0; i < I.burrows; i++) { const p = ringAround(state.rng, P.x, P.z, 6, S); state.interactables.push({ id: nextId(), type: 'burrow', x: p.x, z: p.z }); }
    for (let i = 0; i < C.mech.mudCount; i++) { const p = ringAround(state.rng, P.x, P.z, 6, S); state.interactables.push({ id: nextId(), type: 'mud', x: p.x, z: p.z, r: 2.6 }); }
  }
  if (state.species.biome === 'meadow' || state.species.biome === 'forest') {
    for (let i = 0; i < I.hives; i++) { const p = ringAround(state.rng, P.x, P.z, 8, S); state.interactables.push({ id: nextId(), type: 'hive', x: p.x, z: p.z, cooldown: 0 }); }
  }
}

// ---------------------------------------------------------------------------
// Stages
// ---------------------------------------------------------------------------
function updateStage(state) {
  const stages = C.life.stages;
  let idx = 0;
  for (let i = 0; i < stages.length; i++) if (state.ageFrac >= stages[i].t) idx = i;
  if (idx > state.maxStageIndex) state.maxStageIndex = idx;
  if (idx !== state.stageIndex) {
    state.stageIndex = idx;
    state.stage = stages[idx].name;
    state.stageScale = C.life.stageScale[state.stage];
    state.events.push({ t: 'stage', stage: state.stage });
    if (state.stage === 'adult') onBecomeAdult(state);
    if (state.stage === 'elder') state.events.push({ t: 'quip', key: 'elder' });
  }
}

function onBecomeAdult(state) {
  if (!state.reachedAdultBonus) { state.dnaRun += C.dna.reachAdult; state.reachedAdultBonus = true; }
  state.events.push({ t: 'quip', key: 'grewUp' });
  // place the reproduction target
  const sp = state.species, P = state.player;
  if (sp.reproduce === 'nest') {
    let nx = P.x, nz = P.z;
    if (sp.struggle === 'upstream') { nz = P.z + 64; }              // spawning ground far upstream
    else if (sp.struggle === 'hatchling') { nz = P.z - 36; }        // nest back toward the beach
    else { const p = ringAround(state.rng, P.x, P.z, 12, 26); nx = p.x; nz = p.z; }
    state.nest = { x: nx, z: nz, active: true };
    state.needsMaterials = sp.struggle !== 'shortlife';     // bees skip twig-gathering (too short-lived)
    state.nestBuilt = !state.needsMaterials;
    if (state.needsMaterials) {
      for (let i = 0; i < C.nest.twigs; i++) { const p = ringAround(state.rng, P.x, P.z, 6, C.world.spawnR); state.nestTwigs.push({ id: nextId(), x: p.x, z: p.z, phase: state.rng.next() * TAU, alive: true }); }
    }
  } else {
    const p = ringAround(state.rng, P.x, P.z, 12, 24);
    state.mate = { x: p.x, z: p.z, active: true, vx: 0, vz: 0, retarget: 0 };
  }
  // life gets a little meaner as you grow up
  if (sp.predatorBuild) state.predators.push(spawnPredator(state));
}

// ---------------------------------------------------------------------------
// Derived movement speed
// ---------------------------------------------------------------------------
function playerSpeed(state) {
  const stageMul = C.move.stageSpeed[state.stage];
  let s = C.move.baseSpeed * stageMul * state.species.speedMult * state.mods.speed;
  if (state.boost > 0) s *= C.interact.boostSpeed;       // mushroom buzz
  return s;
}

// ---------------------------------------------------------------------------
// Main step — dt in seconds
// ---------------------------------------------------------------------------
export function step(state, input, dt) {
  if (!state.alive) return state;

  // 1) age + stages
  state.time += dt;
  state.ageFrac = clamp(state.time / state.lifespan, 0, 1);
  state.dayPhase = (state.dayPhase + dt / C.world.dayLength) % 1;
  state.light = 0.5 - 0.5 * Math.cos(state.dayPhase * TAU);   // 0 = midnight, 1 = noon
  updateStage(state);

  const P = state.player, S = state.stats, sp = state.species;

  // 2) movement
  let mx = input.mx || 0, mz = input.mz || 0;
  const mlen = Math.hypot(mx, mz);
  if (mlen > 1) { mx /= mlen; mz /= mlen; }
  if (state.mods.clumsy && mlen > 0.01) {                     // wobble
    const w = Math.sin(state.time * 9) * 0.28;
    const ca = Math.cos(w), sa = Math.sin(w);
    const rx = mx * ca - mz * sa, rz = mx * sa + mz * ca; mx = rx; mz = rz;
  }
  let spd = playerSpeed(state);
  const wantSprint = input.sprint && S.energy > 0 && (state.stage !== 'baby');
  const canSprint = wantSprint && (state.lastSprint || S.energy > C.needs.sprintFloor);
  if (canSprint) { spd *= C.move.sprintMult; state.lastSprint = S.energy > 0.5; }
  else state.lastSprint = false;

  // smooth the input-driven velocity for a less twitchy feel
  const dvx = mx * spd, dvz = mz * spd, k = Math.min(1, C.move.accel * dt);
  P.vx += (dvx - P.vx) * k; P.vz += (dvz - P.vz) * k;

  // river current pushes downstream (added at integration, not smoothed)
  let curX = 0, curZ = 0;
  if (state.biome.current) { const [cdx, cdz] = state.biome.currentDir; curX = -cdx * state.biome.currentStrength; curZ = -cdz * state.biome.currentStrength; }

  P.x += (P.vx + curX) * dt; P.z += (P.vz + curZ) * dt;
  // infinite world — no wall; content streams around the player (see recycleFar)

  // heading + moving flags
  P.speed = Math.hypot(P.vx + curX, P.vz + curZ);
  P.moving = mlen > 0.05;
  if (P.moving) {
    const target = Math.atan2(P.vx, P.vz);
    let d = ((target - P.heading + Math.PI * 3) % TAU) - Math.PI;
    P.heading += d * clamp(C.move.turnLerp * dt, 0, 1);
  }
  P.stillFor = P.speed < 1.4 ? P.stillFor + dt : 0;

  // 3) needs
  const hungerDrain = C.needs.hungerDrainPerSec * state.mods.hunger
                    + (canSprint ? C.needs.hungerSprintExtra : 0);
  S.hunger = clamp(S.hunger - hungerDrain * dt, 0, C.needs.hungerMax);

  if (canSprint) S.energy = clamp(S.energy - C.needs.energySprintDrain * dt, 0, C.needs.energyMax);
  else S.energy = clamp(S.energy + C.needs.energyRegen * dt, 0, C.needs.energyMax);

  // warmth (cold struggle)
  if (sp.struggle === 'cold') {
    let nearWarm = false;
    for (const w of state.warmthSpots) if (dist2(P.x, P.z, w.x, w.z) < w.r * w.r) { nearWarm = true; break; }
    if (nearWarm) state.warmth = clamp(state.warmth + 26 * dt, 0, 100);
    else state.warmth = clamp(state.warmth - (9 + 5 * (1 - state.light)) * dt, 0, 100); // colder at night
  }

  // health: starvation, cold, suffocation (shark), regen
  let dmg = 0;
  if (S.hunger <= 0) { dmg += C.needs.starveDamage; state.lastHurtBy = 'starved'; }
  if (sp.struggle === 'cold' && state.warmth <= 0) { dmg += C.needs.coldDamage; state.lastHurtBy = 'cold'; }
  if (sp.struggle === 'keepMoving' && P.stillFor > 2.2) { dmg += 10; state.lastHurtBy = 'drowned'; }
  if (dmg > 0) S.health = clamp(S.health - dmg * dt, 0, C.needs.healthMax);
  else if (S.hunger > C.needs.healthRegenHungerGate && state.danger < 0.2)
    S.health = clamp(S.health + C.needs.healthRegen * dt, 0, C.needs.healthMax);

  if (state.invuln > 0) state.invuln -= dt;
  if (state.reproduceCooldown > 0) state.reproduceCooldown -= dt;
  if (state.boost > 0) state.boost -= dt;
  if (state.matingTimer > 0) state.matingTimer -= dt;
  if (state.comboTimer > 0) { state.comboTimer -= dt; if (state.comboTimer <= 0) state.combo = 0; }

  // scent — rises to full unless freshly muddied (masked → predators barely smell you)
  if (state.scentMask > 0) { state.scentMask -= dt; state.scent = Math.max(C.mech.mudDetectMul, state.scent - dt * 0.8); }
  else state.scent = Math.min(1, state.scent + dt * 0.5);

  // denning in a burrow: heals you, and you pop out when you move
  if (state.inBurrow) {
    S.health = clamp(S.health + C.mech.burrowHealPerSec * dt, 0, C.needs.healthMax);
    if (mlen > 0.15) { state.inBurrow = false; state.events.push({ t: 'denExit' }); }
  }

  // water flag (ocean/river underwater, or turtle once in sea)
  state.inWater = !!state.biome.water && (sp.struggle !== 'hatchling' || state.reachedWater);

  // 4) struggle: hatchling reach the sea
  if (sp.struggle === 'hatchling' && !state.reachedWater) {
    if (P.z > 4) {                       // crossed from beach into the sea
      state.reachedWater = true;
      state.dnaRun += 20;
      state.events.push({ t: 'reachedWater' });
      // gulls give up; add a couple of slow sea predators
      for (const pr of state.predators) pr.domain = 'gone';
      state.predators.push(spawnPredator(state)); state.predators[state.predators.length - 1].build = 'fish'; state.predators[state.predators.length - 1].domain = 'water';
    }
  }

  // 5) eating
  const eatR = C.food.eatRadius * state.mods.eat * (0.7 + 0.6 * state.stageScale);
  if (sp.diet.kind === 'graze') {
    for (const f of state.food) {
      if (!f.alive) { f.respawn -= dt; if (f.respawn <= 0) { const p = ringAround(state.rng, P.x, P.z, 4, C.world.spawnR); f.x = p.x; f.z = p.z; f.alive = true; } continue; }
      recycleFar(state, f);                 // drifted away → restream around the player
      if (dist2(P.x, P.z, f.x, f.z) < eatR * eatR) doEat(state, f);
    }
  } else {
    for (const pr of state.prey) {
      if (!pr.alive) continue;
      if (dist2(P.x, P.z, pr.x, pr.z) < (eatR + 0.4) * (eatR + 0.4)) doEat(state, pr, true);
    }
    updatePrey(state, dt);
  }

  // 5b) interactive objects (fruit trees, mushrooms, hives, burrows) + bonus fruit
  updateInteractables(state, dt);

  // 5c) attack verb (fight back / hunt / shake trees)
  if (state.attackCooldown > 0) state.attackCooldown -= dt;
  if (input.attack && state.attackCooldown <= 0) doAttack(state);

  // 6) predators
  updatePredators(state, dt);

  // 7) reproduction
  updateReproduction(state, dt);

  // 7b) unexpected ambush — a predator streams in already hunting
  state.ambushTimer -= dt;
  if (state.species.predatorBuild && state.ambushTimer <= 0) {
    state.ambushTimer = 1;
    if (state.rng.chance(C.mech.ambushChance) && state.stage !== 'baby' && !state.inBurrow && state.predators.length < C.caps.entities) {
      const pr = spawnPredator(state); const p = ringAround(state.rng, P.x, P.z, 9, 13); pr.x = p.x; pr.z = p.z; pr.aggro = true; pr.state = 'chase';
      state.predators.push(pr); state.events.push({ t: 'ambush' }); state.events.push({ t: 'alert' });
    }
  }

  // 8) death checks
  if (S.health <= 0 && state.alive) die(state, state.lastHurtBy || 'starved');
  if (state.time >= state.lifespan && state.alive) die(state, 'oldAge');

  updateObjective(state);
  return state;
}

function doEat(state, item, isPrey) {
  const S = state.stats;
  S.hunger = clamp(S.hunger + C.needs.eatRestore, 0, C.needs.hungerMax);
  state.meals++;
  state.dnaRun += C.dna.perFood;
  const pts = gainScore(state, isPrey ? C.arcade.scorePrey : C.arcade.scoreFood);
  state.events.push({ t: 'eat', x: item.x, z: item.z, combo: state.combo, pts });
  if (state.meals === 1) state.events.push({ t: 'quip', key: 'ateFirst' });
  if (isPrey) {
    state.events.push({ t: 'blood', x: item.x, z: item.z, big: true });   // gore on a kill
    const fresh = spawnPrey(state); item.x = fresh.x; item.z = fresh.z; item.alive = true; item.vx = 0; item.vz = 0;
  } else {
    item.alive = false; item.respawn = 3 + state.rng.next() * 3;
  }
}

function updatePrey(state, dt) {
  const P = state.player;
  for (const pr of state.prey) {
    if (!pr.alive) continue;
    const d2 = dist2(P.x, P.z, pr.x, pr.z);
    if (d2 < C.prey.fleeRadius * C.prey.fleeRadius) {       // flee
      const d = Math.sqrt(d2) || 1;
      const fx = (pr.x - P.x) / d, fz = (pr.z - P.z) / d;
      pr.vx = fx * C.prey.speed; pr.vz = fz * C.prey.speed;
      pr.heading = Math.atan2(pr.vx, pr.vz);
    } else {                                                // wander
      pr.retarget -= dt;
      if (pr.retarget <= 0) { pr.heading = state.rng.next() * TAU; pr.retarget = 1 + state.rng.next() * 2; }
      pr.vx = Math.sin(pr.heading) * C.prey.wanderSpeed;
      pr.vz = Math.cos(pr.heading) * C.prey.wanderSpeed;
    }
    pr.x += pr.vx * dt; pr.z += pr.vz * dt;
    recycleFar(state, pr);
  }
}

function updateInteractables(state, dt) {
  const P = state.player, sp = state.species, I = C.interact;
  const ir = I.radius + state.size * 0.4;
  let hidden = false;
  for (const it of state.interactables) {
    if (it.shake > 0) it.shake -= dt;
    if (it.cooldown > 0) it.cooldown -= dt;
    const near = dist2(P.x, P.z, it.x, it.z) < ir * ir;
    if (!near) continue;
    switch (it.type) {
      case 'fruitTree':
        if (it.cooldown <= 0 && state.fruits.length < 40) {
          it.cooldown = I.fruitCooldown; it.shake = 0.6;
          for (let k = 0; k < I.fruitPerShake; k++) {
            const a = state.rng.next() * TAU, r = 1.3 + state.rng.next();
            state.fruits.push({ id: nextId(), x: it.x + Math.cos(a) * r, z: it.z + Math.sin(a) * r, phase: state.rng.next() * TAU, alive: true });
          }
          state.events.push({ t: 'fruitDrop', x: it.x, z: it.z });
        }
        break;
      case 'mushroom':
        if (it.alive) {
          it.alive = false;
          state.stats.hunger = clamp(state.stats.hunger + 14, 0, C.needs.hungerMax);
          state.boost = I.boostSec; state.dnaRun += 1;
          state.events.push({ t: 'mushroom', x: it.x, z: it.z });
        }
        break;
      case 'hive':
        if (it.cooldown <= 0 && sp.build !== 'bee' && state.invuln <= 0) {
          it.cooldown = 3; state.invuln = C.needs.invulnSec;
          const d = Math.hypot(P.x - it.x, P.z - it.z) || 1;
          P.x += (P.x - it.x) / d * 1.5; P.z += (P.z - it.z) / d * 1.5;
          state.lastHurtBy = 'predator';
          state.events.push({ t: 'sting', x: it.x, z: it.z });
          if (!state.mods.frail) { state.stats.health = clamp(state.stats.health - I.stingDamage * state.mods.dmg, 0, C.needs.healthMax); if (state.stats.health <= 0) die(state, 'predator'); }
          else die(state, 'predator');
        }
        break;
      case 'burrow':
        hidden = true;
        break;
      case 'mud':
        if (dist2(P.x, P.z, it.x, it.z) < (it.r || 2.6) * (it.r || 2.6)) {
          if (state.scentMask <= 0) state.events.push({ t: 'mud', x: P.x, z: P.z });
          state.scentMask = C.mech.mudMaskSec;
        }
        break;
    }
  }
  state.hidden = hidden || state.inBurrow;

  // stream interactables around the roaming player (infinite forest)
  for (const it of state.interactables) {
    if (recycleFar(state, it)) { if (it.type === 'mushroom') it.alive = true; if (it.type === 'fruitTree') it.cooldown = state.rng.range(0, 2); }
  }

  // bonus fruit pickups — any land grazer can snack
  const eatR = C.food.eatRadius * state.mods.eat * (0.7 + 0.6 * state.stageScale);
  for (const f of state.fruits) {
    if (!f.alive) continue;
    if (dist2(P.x, P.z, f.x, f.z) < eatR * eatR) {
      f.alive = false;
      state.stats.hunger = clamp(state.stats.hunger + C.needs.eatRestore * 0.8, 0, C.needs.hungerMax);
      state.meals++; state.dnaRun += C.dna.perFood;
      const pts = gainScore(state, C.arcade.scoreFood);
      state.events.push({ t: 'eat', x: f.x, z: f.z, combo: state.combo, pts });
    }
  }
}

// Context-sensitive ATTACK: dive into a burrow-home, court a mate, then an AoE
// chomp that eats everything in the circle and damages/kills predators.
function doAttack(state) {
  const P = state.player, sp = state.species;
  state.attackCooldown = 0.45;

  // dive into / out of a nearby burrow (a safe den)
  for (const it of state.interactables) {
    if (it.type === 'burrow' && dist2(P.x, P.z, it.x, it.z) < 6.25) {
      state.inBurrow = !state.inBurrow;
      if (state.inBurrow) { P.x = it.x; P.z = it.z; }
      state.events.push({ t: state.inBurrow ? 'denEnter' : 'denExit', x: it.x, z: it.z });
      return;
    }
  }

  const range = C.arcade.biteBase + state.size * 0.7, r2 = range * range;
  state.events.push({ t: 'bite', x: P.x, z: P.z, r: range, heading: P.heading });
  let hits = 0;

  // court a nearby mate by offering a gift (must be well fed)
  if (state.mate && state.mate.active && state.stats.hunger >= C.reproduce.hungerGate &&
      dist2(P.x, P.z, state.mate.x, state.mate.z) < (range + 1.6) * (range + 1.6)) {
    state.mate.court = Math.min(1, (state.mate.court || 0) + C.mech.courtGift);
    state.events.push({ t: 'gift', x: state.mate.x, z: state.mate.z }); hits++;
  }

  if (sp.diet.kind === 'hunt') {
    for (const pr of state.prey) { if (pr.alive && dist2(P.x, P.z, pr.x, pr.z) < r2) { doEat(state, pr, true); hits++; } }
  } else {
    for (const f of state.food) { if (f.alive && dist2(P.x, P.z, f.x, f.z) < r2) { doEat(state, f); hits++; } }
  }
  for (const f of state.fruits) {
    if (!f.alive || dist2(P.x, P.z, f.x, f.z) >= r2) continue;
    f.alive = false; state.meals++;
    state.stats.hunger = clamp(state.stats.hunger + C.needs.eatRestore * 0.8, 0, C.needs.hungerMax);
    const pts = gainScore(state, C.arcade.scoreFood);
    state.events.push({ t: 'eat', x: f.x, z: f.z, combo: state.combo, pts }); hits++;
  }
  // damage predators in the circle; kill them when health runs out
  for (const pr of state.predators) {
    if (pr.domain === 'gone' || dist2(P.x, P.z, pr.x, pr.z) >= r2) continue;
    const d = Math.hypot(pr.x - P.x, pr.z - P.z) || 1;
    pr.x += (pr.x - P.x) / d * 2.3; pr.z += (pr.z - P.z) / d * 2.3; pr.stun = 1.1; pr.hurt = 0.5;
    pr.health -= C.predator.biteDamage;
    state.events.push({ t: 'blood', x: pr.x, z: pr.z });
    if (pr.health <= 0) {
      state.kills++; state.score += C.arcade.scoreKill;
      state.events.push({ t: 'killed', x: pr.x, z: pr.z });
      const np = spawnPredator(state); pr.x = np.x; pr.z = np.z; pr.health = pr.maxHealth; pr.aggro = false; pr.state = 'wander'; pr.stun = 0; pr.hurt = 0;
    } else { pr.aggro = false; pr.giveUp = 0; }
    hits++;
  }
  for (const it of state.interactables) {
    if (it.type !== 'fruitTree' || it.cooldown > 0 || state.fruits.length >= 40) continue;
    if (dist2(P.x, P.z, it.x, it.z) < (range + 1) * (range + 1)) {
      it.cooldown = C.interact.fruitCooldown; it.shake = 0.6;
      for (let k = 0; k < C.interact.fruitPerShake; k++) { const a = state.rng.next() * TAU, rr = 1.3 + state.rng.next(); state.fruits.push({ id: nextId(), x: it.x + Math.cos(a) * rr, z: it.z + Math.sin(a) * rr, phase: state.rng.next() * TAU, alive: true }); }
      state.events.push({ t: 'fruitDrop', x: it.x, z: it.z });
    }
  }
  if (hits) state.events.push({ t: 'bonk', x: P.x, z: P.z });
}

function updatePredators(state, dt) {
  const P = state.player;
  let danger = 0;
  // hidden in a burrow: predators lose track and can't reach you
  if (state.hidden) {
    for (const pr of state.predators) {
      pr.aggro = false; pr.state = 'wander';
      pr.retarget -= dt;
      if (pr.retarget <= 0) { pr.heading = state.rng.next() * TAU; pr.retarget = 1.5 + state.rng.next() * 2.5; }
      pr.vx = Math.sin(pr.heading) * C.predator.wanderSpeed; pr.vz = Math.cos(pr.heading) * C.predator.wanderSpeed;
      pr.x += pr.vx * dt; pr.z += pr.vz * dt; recycleFar(state, pr);
    }
    state.danger = 0; return;
  }
  const aggroR = C.predator.aggroRadius, loseR = C.predator.loseRadius;
  for (const pr of state.predators) {
    if (pr.hurt > 0) pr.hurt -= dt;
    if (pr.domain === 'gone') { pr.x += pr.vx * dt * 0.2; continue; }
    if (pr.domain === 'beach' && state.reachedWater) continue;
    if (pr.stun > 0) { pr.stun -= dt; pr.vx *= 0.82; pr.vz *= 0.82; pr.x += pr.vx * dt; pr.z += pr.vz * dt; continue; }
    const d2 = dist2(P.x, P.z, pr.x, pr.z);
    const d = Math.sqrt(d2) || 1;
    // detection: move/sprint makes you easy to spot; freezing hides you; calmer at night
    const moveDetect = 0.5 + 0.5 * Math.min(1.4, P.speed / C.move.baseSpeed);
    const dayDetect = 0.78 + 0.22 * state.light;
    const effAggro = aggroR * (state.stage === 'baby' ? C.predator.babyAggroMult : 1) * moveDetect * dayDetect * state.scent;

    if (!pr.aggro && d < effAggro) { pr.aggro = true; pr.state = 'chase'; pr.giveUp = 0; state.events.push({ t: 'alert' }); state.events.push({ t: 'quip', key: 'chased' }); }
    if (pr.aggro) {
      if (d > loseR) { pr.giveUp += dt; if (pr.giveUp > C.predator.giveUpSec) { pr.aggro = false; pr.state = 'wander'; } }
      else pr.giveUp = 0;
    }

    if (pr.aggro) {
      const sc = 1 + state.ageFrac * C.predator.escalation; // mild escalation with age
      const ps = C.predator.speed * sc;
      pr.vx = (P.x - pr.x) / d * ps; pr.vz = (P.z - pr.z) / d * ps;
      pr.heading = Math.atan2(pr.vx, pr.vz);
      danger = Math.max(danger, clamp(1 - (d - C.predator.contactRadius) / aggroR, 0, 1));

      if (d < C.predator.contactRadius + state.size * 0.5 && state.invuln <= 0) hitPlayer(state, pr);
    } else {
      pr.retarget -= dt;
      if (pr.retarget <= 0) { pr.heading = state.rng.next() * TAU; pr.retarget = 1.5 + state.rng.next() * 2.5; }
      pr.vx = Math.sin(pr.heading) * C.predator.wanderSpeed;
      pr.vz = Math.cos(pr.heading) * C.predator.wanderSpeed;
    }
    pr.x += pr.vx * dt; pr.z += pr.vz * dt;
    if (pr.domain === 'beach') { if (pr.z > -1) pr.z = -1; }            // gulls patrol the beach side
    else if (!pr.aggro && recycleFar(state, pr)) { pr.state = 'wander'; pr.giveUp = 0; }
  }
  state.danger = danger;
}

function hitPlayer(state, pr) {
  const S = state.stats;
  state.invuln = C.needs.invulnSec;
  // knockback
  const d = Math.hypot(state.player.x - pr.x, state.player.z - pr.z) || 1;
  state.player.x += (state.player.x - pr.x) / d * 1.6;
  state.player.z += (state.player.z - pr.z) / d * 1.6;
  state.events.push({ t: 'hit' });
  state.lastHurtBy = 'predator';

  if (state.mods.frail || state.hitsLeft <= 0) { die(state, 'predator'); return; }
  state.hitsLeft -= 1;
  S.health = clamp(S.health - C.needs.hitDamage * state.mods.dmg, 0, C.needs.healthMax);
  if (S.health <= 0) die(state, 'predator');
}

function updateReproduction(state, dt) {
  const sp = state.species, P = state.player;
  if (state.stage !== 'adult' && state.stage !== 'elder') return;

  // nest species: gather twigs, then build at the nest site before reproducing
  if (sp.reproduce === 'nest') {
    if (!state.nest || !state.nest.active) return;
    if (!state.nestBuilt) {
      const tr = C.food.eatRadius * state.mods.eat + 0.4;
      for (const tw of state.nestTwigs) {
        if (tw.alive && dist2(P.x, P.z, tw.x, tw.z) < tr * tr) { tw.alive = false; state.nestMaterials++; state.events.push({ t: 'twig', x: tw.x, z: tw.z }); }
      }
      if (state.nestMaterials >= C.nest.materialsNeeded &&
          dist2(P.x, P.z, state.nest.x, state.nest.z) < C.nest.buildRadius * C.nest.buildRadius) {
        state.nestBuilt = true; state.events.push({ t: 'nestBuilt', x: state.nest.x, z: state.nest.z });
      }
      if (!state.nestBuilt) return;     // no reproducing until the nest is built
    }
  }

  const target = state.mate || state.nest;
  if (!target || !target.active) return;

  // a roaming mate drifts a little, and is courted when you're near & well-fed
  if (state.mate) {
    state.mate.retarget -= dt;
    if (state.mate.retarget <= 0) { state.mate.dir = state.rng.next() * TAU; state.mate.retarget = 2 + state.rng.next() * 2; }
    state.mate.x += Math.sin(state.mate.dir || 0) * 1.1 * dt;
    state.mate.z += Math.cos(state.mate.dir || 0) * 1.1 * dt;
    const cr = 3.0 + state.size;
    if (state.stats.hunger >= C.reproduce.hungerGate && dist2(P.x, P.z, state.mate.x, state.mate.z) < cr * cr)
      state.mate.court = Math.min(1, (state.mate.court || 0) + C.mech.courtFillPerSec * dt);
  }

  const reach = 2.0 + state.size * 0.6;
  const courted = state.mate ? (state.mate.court || 0) >= 1 : true;   // nest species don't court
  if (courted && state.stats.hunger >= C.reproduce.hungerGate &&
      state.reproduceCooldown <= 0 &&
      dist2(P.x, P.z, target.x, target.z) < reach * reach) {
    const twins = state.mods.fertile && state.rng.chance(0.5);
    const n = twins ? 2 : 1;
    state.offspring += n;
    state.dnaRun += C.dna.dnaPerOffspring * n;
    state.reproduced = true;
    state.matingTimer = 1.4;                  // brief mating animation window
    if (state.mate) state.mate.court = 0;     // reset courtship for the next one
    state.events.push({ t: 'birth', x: target.x, z: target.z, n });
    state.events.push({ t: 'quip', key: 'reproduced' });
    let cd = C.reproduce.nestCooldownSec;
    if (state.mods.fertile) cd *= C.reproduce.fertileCooldownMult;
    state.reproduceCooldown = cd;
    // relocate the target so you can keep going
    if (sp.struggle === 'upstream' || sp.struggle === 'hatchling') { target.x += state.rng.range(-2, 2); } // fixed spot: small nudge
    else { const p = ringAround(state.rng, P.x, P.z, 12, 26); target.x = p.x; target.z = p.z; }
  }
}

function die(state, cause) {
  state.alive = false;
  state.cause = cause;
  // elder longevity bonus
  if (state.stage === 'elder') state.dnaRun += Math.floor(state.time / 10) * 0; // counted live below
  state.events.push({ t: 'death', cause, success: state.reproduced });
}

// ---------------------------------------------------------------------------
// Objective text key (read by the HUD)
// ---------------------------------------------------------------------------
function updateObjective(state) {
  const sp = state.species, S = state.stats;
  let key = 'grow';
  if (sp.struggle === 'hatchling' && !state.reachedWater) key = 'hatchling_reachWater';
  else if (state.stage === 'adult' || state.stage === 'elder') {
    if (sp.reproduce === 'nest') {
      if (!state.nestBuilt) key = (state.nestMaterials >= C.nest.materialsNeeded) ? 'buildNest' : 'gatherTwigs';
      else key = sp.struggle === 'upstream' ? 'upstream' : 'reproduceNest';
    } else key = 'reproduce';
    if (state.stage === 'elder' && state.reproduced) key = 'elder';
  } else if (S.hunger < 28) key = 'findFood';
  else if (sp.struggle === 'cold') key = 'cold';
  else if (sp.struggle === 'keepMoving') key = 'keepMoving';
  else if (sp.struggle === 'hunt' && S.hunger < 50) key = 'hunt';
  else key = 'grow';
  state.objective = key;
}

// Live DNA total including the elder longevity tick (kept out of state mutation noise).
export function liveDna(state) {
  let d = state.dnaRun;
  if (state.stage === 'elder') d += Math.floor((state.time - state.lifespan * C.life.stages[3].t) / 10) * C.dna.elderPer10s;
  return Math.max(0, Math.floor(d));
}
