// Pure simulation core — no rendering, no DOM, no Three.js. Deterministic from
// a seed (fixed timestep + seeded RNG). The renderer reads this state; tests
// drive step() directly in Node. Logic separate from rendering (design §6.4).

import { CONFIG as C } from './config.js';
import { makeRng } from './rng.js';
import { rollMutations, applyMutations } from './mutations.js';
import { speciesOf } from './species.js';
import { biomeOf } from './biomes.js';
import { levelFor } from './levels.js';

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
// Bounded handcrafted maps don't stream — entities live inside the arena.
function recycleFar() { return false; }
// a deterministic point inside the bounded arena (ring from the centre)
function arenaSpot(state, minR, maxR) { return ringAround(state.rng, 0, 0, minR, Math.min(maxR, state.arenaR)); }
// a point near a designed cluster centre, clamped to the arena
function clusterSpot(rng, cx, cz, spread, R) {
  const a = rng.next() * TAU, r = Math.sqrt(rng.next()) * spread;
  let x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
  const rr = Math.hypot(x, z); if (rr > R) { x = x / rr * R; z = z / rr * R; }
  return { x, z };
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
export function createRun({ speciesId = 'turtle', seed = 1, bonus = null, visuals = null, generation = 1, lineageScore = 0 }) {
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

  // lifespan: species base × mutation × struggle (mayfly = brutally short)
  let lifeMult = mods.life;
  if (species.struggle === 'shortlife') lifeMult *= 0.5;
  if (species.struggle === 'ephemeral') lifeMult *= 0.5;     // mayfly: a life measured in minutes
  const lifespan = (species.lifeSec || C.life.baseLifespanSec) * lifeMult;

  // handcrafted, bounded level — fixes the play space and the designed start
  const level = levelFor(speciesId);
  const px = level.start.x, pz = level.start.z;

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
    // life goals (the quest you must complete in this life) + live action EXP
    goals: (species.lifeGoals || []).map(g => ({ id: g.id, label: g.label, done: false })),
    goalIndex: 0, actionExp: 0, hasMoved: false,
    // species-specific playstyle state
    pollen: 0, pollenCollected: 0, deliveries: 0, hive: null,    // worker bee
    female: null, fused: false, dark: !!species.dark,            // anglerfish
    dyingFuse: 0,                                                // semelparous wind-down
    qte: null, qteCooldown: 0, _atkPrev: false,                 // quick-time / mini-game state
    // handcrafted bounded map
    level, arenaR: level.radius, goal: { x: level.goal.x, z: level.goal.z },
    hazards: (level.hazards || []).map(h => ({ ...h, fired: 0 })),
    alive: true, cause: null, lastHurtBy: null,
    danger: 0,
    objective: 'grow',
    events: [],
    quipShown: {},
  };

  // food pickups for grazers (species that never feed — mayfly, anglerfish — get none)
  if (!species.noEat) {
    if (species.diet.kind === 'graze') {
      const n = level.food ? level.food.count : C.caps.foodItems;
      for (let i = 0; i < n; i++) state.food.push(spawnFood(state));
    } else {
      const n = species.diet.preyCount || 6;
      for (let i = 0; i < n; i++) state.prey.push(spawnPrey(state));
    }
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

  // worker bee lives at a hive she must keep flying nectar back to
  if (species.forage) { state.hive = { x: px, z: pz, active: true }; state.nest = state.hive; }
  // male anglerfish: the giant female glows at her designed spot across the dark
  if (species.dark) {
    state.mate = { x: level.goal.x, z: level.goal.z, active: true, isFemale: true, court: 1 };
    state.female = state.mate;
  }
  // hatchling sea turtle: the life opens with a "dig out of the nest" mash
  if (species.struggle === 'hatchling') startQte(state, { kind: 'mash', label: 'DIG OUT!', need: 7, dur: 5, lock: true, effect: 'digout' });

  updateObjective(state);
  state.events.push({ t: 'born' });
  return state;
}

function spawnFood(state) {
  const f = state.level && state.level.food;
  const p = f ? clusterSpot(state.rng, f.cx, f.cz, f.spread, state.arenaR) : arenaSpot(state, 4, state.arenaR);
  return { id: nextId(), x: p.x, z: p.z, phase: state.rng.next() * TAU, alive: true, respawn: 0 };
}

function spawnPrey(state) {
  const p = arenaSpot(state, 8, state.arenaR);
  return { id: nextId(), x: p.x, z: p.z, vx: 0, vz: 0, phase: state.rng.next() * TAU,
           heading: state.rng.next() * TAU, retarget: 0, alive: true };
}

// predators patrol designed posts (cycled if more than there are posts)
function spawnPredator(state) {
  const posts = state.level && state.level.predators;
  let x, z;
  if (posts && posts.length) { const post = posts[state.predators.length % posts.length]; x = post.x + state.rng.range(-2, 2); z = post.z + state.rng.range(-2, 2); }
  else { const p = arenaSpot(state, 14, state.arenaR); x = p.x; z = p.z; }
  const domain = state.species.struggle === 'hatchling' ? 'beach' : 'any';
  return { id: nextId(), x, z, vx: 0, vz: 0, heading: state.rng.next() * TAU,
           build: state.species.predatorBuild || 'fox', state: 'wander', aggro: false,
           giveUp: 0, retarget: 0, phase: state.rng.next() * TAU, domain, stun: 0,
           health: C.predator.health, maxHealth: C.predator.health, hurt: 0 };
}

// hand-placed interactables from the level (burrows, mud, mushrooms, fruit, hive)
function spawnInteractables(state) {
  for (const it of (state.level.interactables || [])) {
    const o = { id: nextId(), type: it.type, x: it.x, z: it.z };
    if (it.type === 'fruitTree') { o.cooldown = state.rng.range(0, 3); o.shake = 0; }
    else if (it.type === 'mushroom') o.alive = true;
    else if (it.type === 'mud') o.r = 2.6;
    else if (it.type === 'hive') o.cooldown = 0;
    state.interactables.push(o);
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
  // place the reproduction target — bee (hive from birth) and anglerfish
  // (female from birth) already have theirs, so they skip this.
  const sp = state.species, P = state.player;
  if (sp.forage || sp.dark) {
    // target already set in createRun
  } else if (sp.reproduce === 'nest') {
    // the nest sits at the level's designed goal (upstream gravel / beach)
    state.nest = { x: state.goal.x, z: state.goal.z, active: true };
    // the journeys (upstream / beach) ARE the work — no twig-gathering on top
    state.needsMaterials = !(sp.struggle === 'shortlife' || sp.struggle === 'upstream' || sp.struggle === 'hatchling');
    state.nestBuilt = !state.needsMaterials;
    if (state.needsMaterials) {
      for (let i = 0; i < C.nest.twigs; i++) { const p = arenaSpot(state, 6, state.arenaR); state.nestTwigs.push({ id: nextId(), x: p.x, z: p.z, phase: state.rng.next() * TAU, alive: true }); }
    }
  } else {
    state.mate = { x: state.goal.x, z: state.goal.z, active: true, vx: 0, vz: 0, retarget: 0 };
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

  // 1b) quick-time events / mini-games — the salmon's run is a string of rapids to leap
  if (state.qteCooldown > 0) state.qteCooldown -= dt;
  if (sp.struggle === 'upstream' && (state.stage === 'adult' || state.stage === 'elder') && !state.reproduced && !state.qte && state.qteCooldown <= 0) {
    startQte(state, { kind: 'timing', label: 'LEAP THE RAPID!', dur: 3.2, speed: 1.15, zone: 0.24, effect: 'leap' });
    state.qteCooldown = 7;
  }
  updateQte(state, input, dt);

  // 2) movement
  let mx = input.mx || 0, mz = input.mz || 0;
  if (state.fused || (state.qte && state.qte.lock)) { mx = 0; mz = 0; }   // fused, or buried during a dig-out mash
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
  // bounded handcrafted arena — a soft wall keeps you inside the designed map
  { const rr = Math.hypot(P.x, P.z), R = state.arenaR; if (rr > R) { const s = R / rr; P.x *= s; P.z *= s; P.vx *= 0.5; P.vz *= 0.5; } }

  // heading + moving flags
  P.speed = Math.hypot(P.vx + curX, P.vz + curZ);
  if (P.speed > 2) state.hasMoved = true;
  P.moving = mlen > 0.05;
  if (P.moving) {
    const target = Math.atan2(P.vx, P.vz);
    let d = ((target - P.heading + Math.PI * 3) % TAU) - Math.PI;
    P.heading += d * clamp(C.move.turnLerp * dt, 0, 1);
  }
  P.stillFor = P.speed < 1.4 ? P.stillFor + dt : 0;

  // 3) needs — species that never feed (mayfly, anglerfish) ignore hunger entirely
  if (!sp.noEat) {
    const hungerDrain = C.needs.hungerDrainPerSec * state.mods.hunger
                      + (canSprint ? C.needs.hungerSprintExtra : 0);
    S.hunger = clamp(S.hunger - hungerDrain * dt, 0, C.needs.hungerMax);
  }

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
      state.actionExp += C.xp.reachSea;
      state.events.push({ t: 'reachedWater' });
      // gulls give up; add a couple of slow sea predators
      for (const pr of state.predators) pr.domain = 'gone';
      state.predators.push(spawnPredator(state)); state.predators[state.predators.length - 1].build = 'fish'; state.predators[state.predators.length - 1].domain = 'water';
    }
  }

  // 5) eating (mayfly + anglerfish never eat — they live off the clock)
  if (!sp.noEat) {
    const eatR = C.food.eatRadius * state.mods.eat * (0.7 + 0.6 * state.stageScale);
    if (sp.diet.kind === 'graze') {
      for (const f of state.food) {
        if (!f.alive) { f.respawn -= dt; if (f.respawn <= 0) { const np = spawnFood(state); f.x = np.x; f.z = np.z; f.alive = true; } continue; }
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
  }

  // 5b) interactive objects (fruit trees, mushrooms, hives, burrows) + bonus fruit
  updateInteractables(state, dt);

  // 5b2) hand-placed hazard zones — crab pits, snapping fish, wasps, rapids
  updateHazards(state, dt);

  // 5c) attack verb (fight back / hunt / shake trees)
  if (state.attackCooldown > 0) state.attackCooldown -= dt;
  if (input.attack && !state.qte && state.attackCooldown <= 0) doAttack(state);   // taps feed the QTE while one is active

  // 6) predators
  updatePredators(state, dt);

  // 7) reproduction / life's purpose — each species chases it its own way
  if (sp.forage) updateForage(state, dt);
  else if (sp.dark) updateAnglerSearch(state, dt);
  else updateReproduction(state, dt);

  // semelparous wind-down: mayfly + salmon are spent by breeding; the anglerfish
  // fuses to the female. A brief beat, then the run ends.
  if (state.dyingFuse > 0) { state.dyingFuse -= dt; if (state.dyingFuse <= 0 && state.alive) die(state, state.fused ? 'fused' : 'spent'); }

  // life-goal progress (each completed goal awards live action EXP)
  advanceGoals(state);

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

  state._atkPrev = !!input.attack;     // remember the tap so the QTE can detect rising edges
  updateObjective(state);
  return state;
}

function doEat(state, item, isPrey) {
  const S = state.stats;
  S.hunger = clamp(S.hunger + C.needs.eatRestore, 0, C.needs.hungerMax);
  state.meals++;
  state.dnaRun += C.dna.perFood;
  state.actionExp += C.xp.eat;
  // worker bee loads nectar into its baskets to carry home
  if (state.species.forage) { state.pollen = Math.min(C.forage.capacity, state.pollen + 1); state.pollenCollected++; }
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
      state.kills++; state.score += C.arcade.scoreKill; state.actionExp += C.xp.kill;
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
    state.dnaRun += C.reproduce.dnaPerOffspring * n;
    state.reproduced = true;
    state.actionExp += C.xp.reproduce;
    state.matingTimer = 1.4;                  // brief mating animation window
    if (state.mate) state.mate.court = 0;     // reset courtship for the next one
    state.events.push({ t: 'birth', x: target.x, z: target.z, n });
    state.events.push({ t: 'family', key: sp.id, n, total: state.offspring });
    state.events.push({ t: 'quip', key: 'reproduced' });
    // semelparous species (mayfly, salmon) are spent by the act of breeding
    if (sp.dieAfterReproduce) state.dyingFuse = sp.struggle === 'ephemeral' ? C.ephemeral.dieFuseSec : 3.2;
    let cd = C.reproduce.nestCooldownSec;
    if (state.mods.fertile) cd *= C.reproduce.fertileCooldownMult;
    state.reproduceCooldown = cd;
    // relocate the target so you can keep going
    if (sp.struggle === 'upstream' || sp.struggle === 'hatchling') { target.x += state.rng.range(-2, 2); } // fixed spot: small nudge
    else { const p = clusterSpot(state.rng, state.goal.x, state.goal.z, 16, state.arenaR); target.x = p.x; target.z = p.z; }
  }
}

// ---------------------------------------------------------------------------
// Quick-time events / mini-games (deterministic; resolved by the attack tap)
//   'mash'   — tap repeatedly to fill a bar before time runs out (dig out)
//   'timing' — a marker sweeps a track; tap inside the target zone (salmon leap)
// ---------------------------------------------------------------------------
function startQte(state, cfg) {
  const q = { kind: cfg.kind, label: cfg.label, time: 0, dur: cfg.dur, lock: !!cfg.lock, effect: cfg.effect || null };
  if (cfg.kind === 'mash') { q.need = cfg.need; q.hits = 0; }
  else { q.pos = 0; q.dir = 1; q.speed = cfg.speed || 1.1; const zw = cfg.zone || 0.22; const lo = state.rng.range(0.14, 0.86 - zw); q.zoneLo = lo; q.zoneHi = lo + zw; }
  state.qte = q;
  state.events.push({ t: 'qteStart', kind: q.kind, label: q.label });
}

function updateQte(state, input, dt) {
  const q = state.qte; if (!q) return;
  q.time += dt;
  const tapped = !!input.attack && !state._atkPrev;
  if (q.kind === 'mash') {
    if (tapped) q.hits++;
    if (q.hits >= q.need) finishQte(state, true);
    else if (q.time >= q.dur) finishQte(state, q.hits >= Math.ceil(q.need * 0.5));  // dig-out: a half-effort still gets you out
  } else {
    q.pos += q.dir * q.speed * dt;
    if (q.pos > 1) { q.pos = 1; q.dir = -1; } else if (q.pos < 0) { q.pos = 0; q.dir = 1; }
    if (tapped) finishQte(state, q.pos >= q.zoneLo && q.pos <= q.zoneHi);
    else if (q.time >= q.dur) finishQte(state, false);
  }
}

function finishQte(state, success) {
  const q = state.qte; if (!q) return;
  applyQteEffect(state, q, success);
  state.events.push({ t: 'qteEnd', kind: q.kind, label: q.label, success });
  state.qte = null;
  state.attackCooldown = 0.3;     // the resolving tap shouldn't also fire an attack
}

function applyQteEffect(state, q, success) {
  const P = state.player;
  if (q.effect === 'digout') {
    if (success) { state.actionExp += C.xp.goal; state.dnaRun += 5; state.events.push({ t: 'quip', key: 'digout' }); }
  } else if (q.effect === 'leap') {
    if (success) { P.z += 9; state.score += 30; state.actionExp += 4; state.events.push({ t: 'leap', x: P.x, z: P.z, success: true }); }
    else { P.z -= 4; state.events.push({ t: 'leap', x: P.x, z: P.z, success: false }); }
    state.qteCooldown = 7;
  }
}

// Hand-placed hazard zones: linger inside one and it hurts (and can kill).
const HAZARD_CAUSE = { crab: 'crab', fish: 'snapped', wasp: 'wasp', rock: 'current' };
function updateHazards(state, dt) {
  if (!state.hazards.length || state.inBurrow) return;
  const P = state.player, S = state.stats;
  for (const h of state.hazards) {
    if (h.fired > 0) h.fired -= dt;
    if (dist2(P.x, P.z, h.x, h.z) < h.r * h.r) {
      S.health = clamp(S.health - h.dps * dt, 0, C.needs.healthMax);
      state.lastHurtBy = HAZARD_CAUSE[h.kind] || 'predator';
      if (h.fired <= 0) { h.fired = 0.45; state.danger = Math.max(state.danger, 0.6); state.events.push({ t: 'hazard', x: P.x, z: P.z, kind: h.kind }); }
      if (S.health <= 0 && state.alive) die(state, HAZARD_CAUSE[h.kind] || 'predator');
    }
  }
}

// Worker bee: ferry nectar back to the hive. Each delivery feeds the colony;
// hit the quota and the colony survives the winter (= you have "reproduced").
function updateForage(state, dt) {
  const P = state.player, hive = state.hive;
  if (!hive) return;
  if (state.pollen > 0 && dist2(P.x, P.z, hive.x, hive.z) < C.forage.depositRadius * C.forage.depositRadius) {
    const n = state.pollen; state.pollen = 0; state.deliveries += n;
    state.score += n * C.forage.scorePerDelivery;
    state.actionExp += n * C.xp.delivery;
    state.dnaRun += n * 4;
    state.events.push({ t: 'delivery', x: hive.x, z: hive.z, n, total: state.deliveries });
    if (!state.reproduced && state.deliveries >= C.forage.quota) {
      state.reproduced = true; state.offspring += 1; state.actionExp += C.xp.reproduce;
      state.events.push({ t: 'birth', x: hive.x, z: hive.z, n: 1 });
      state.events.push({ t: 'family', key: 'bee', n: 1, total: state.deliveries });
      state.events.push({ t: 'quip', key: 'reproduced' });
    }
  }
}

// Male anglerfish: cross the black to reach the giant female. Touch her and you
// fuse — permanently. A grim little victory, then the run gently winds down.
function updateAnglerSearch(state, dt) {
  const P = state.player, f = state.female;
  if (!f || !f.active || state.fused) return;
  if (dist2(P.x, P.z, f.x, f.z) < C.angler.findRadius * C.angler.findRadius) {
    state.fused = true; state.reproduced = true; state.offspring += 1;
    state.actionExp += C.xp.reproduce; state.matingTimer = 1.4;
    state.dyingFuse = C.angler.fuseEndSec;
    state.events.push({ t: 'fused', x: f.x, z: f.z });
    state.events.push({ t: 'birth', x: f.x, z: f.z, n: 1 });
    state.events.push({ t: 'family', key: 'angler', n: 1, total: 1 });
  }
}

// Has the current life-goal been satisfied? (Conditions read existing state.)
function goalDone(state, id) {
  const s = state, f = s.female || s.mate;
  switch (id) {
    case 'hatch': return s.time > 0.4;
    case 'flight': case 'leave': return s.hasMoved;
    case 'reachSea': return s.reachedWater;
    case 'eat': case 'forage1': return s.meals >= 1 || s.pollenCollected >= 1;
    case 'grow': return s.stageIndex >= 1;
    case 'adult': return s.stageIndex >= 2;
    case 'court': return !!(s.mate && (s.mate.court || 0) >= 1);
    case 'deliver': return s.deliveries >= 1;
    case 'forageN': return s.deliveries >= C.forage.quota;
    case 'upstream': return s.stageIndex >= 2;          // the grown adult turns for home
    case 'reachNest': { const n = s.nest; return s.reproduced || (!!n && Math.hypot(s.player.x - n.x, s.player.z - n.z) < C.nest.buildRadius + s.size + 2); }
    case 'spawn': case 'reproduce': return s.reproduced;
    case 'survive': return s.ageFrac >= 0.2 || s.fused;       // (finding her early counts as surviving)
    case 'seekFemale': return !!f && Math.hypot(s.player.x - f.x, s.player.z - f.z) < C.angler.femaleDist * 0.5;
    case 'findFemale': return s.fused || s.reproduced;
    case 'fuse': return s.fused;
    default: return false;
  }
}

// Complete every life-goal whose condition is now met, awarding action EXP.
function advanceGoals(state) {
  const goals = state.goals; if (!goals) return;
  while (state.goalIndex < goals.length && goalDone(state, goals[state.goalIndex].id)) {
    const g = goals[state.goalIndex]; g.done = true; state.goalIndex++;
    state.actionExp += C.xp.goal;
    state.events.push({ t: 'goal', id: g.id, label: g.label, exp: C.xp.goal, index: state.goalIndex, total: goals.length });
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
  // species-specific objective lines take priority
  if (state.fused) { state.objective = 'fused'; return; }
  if (state.dyingFuse > 0) { state.objective = state.fused ? 'fused' : 'spent'; return; }
  if (sp.dark) { state.objective = 'findFemale'; return; }
  if (sp.forage) { state.objective = state.reproduced ? 'forageDone' : (state.pollen > 0 ? 'forageHome' : 'forageOut'); return; }
  if (sp.struggle === 'ephemeral') { state.objective = state.reproduced ? 'mayflyDone' : (state.stageIndex >= 2 ? 'mayflyMate' : 'mayflyGrow'); return; }
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
