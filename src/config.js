// Frozen agency metrics + balance numbers (design/thresholds.md). Data only.
// Tune here, one change at a time — never inside the module that failed a test.

export const CONFIG = {
  sim: {
    hz: 60,                 // fixed timestep
    step: 1000 / 60,        // ms per sim tick
  },

  world: {
    radius: 34,             // island radius (units)
    wallSoftness: 6,        // how far past the edge the soft wall pushes back
  },

  camera: {
    pitchDeg: 52,           // top-down angled
    minDist: 12,
    maxDist: 22,
    follow: 0.10,           // position lerp per frame
    dprCap: 2.0,
  },

  move: {
    baseSpeed: 7.0,         // units/sec at adult, no mutation
    sprintMult: 1.7,
    turnLerp: 12,           // heading approach rate
    stageSpeed: { baby: 0.62, juvenile: 0.85, adult: 1.0, elder: 0.8 },
  },

  needs: {
    hungerMax: 100,
    hungerDrainPerSec: 100 / 70,   // empty in ~70s idle
    hungerSprintExtra: 6,          // extra per sec while sprinting
    eatRestore: 34,

    energyMax: 100,
    energySprintDrain: 100 / 7,    // empty in ~7s of sprint
    energyRegen: 18,
    sprintFloor: 6,                // can't start sprint below this

    healthMax: 100,
    hitDamage: 45,
    starveDamage: 12,              // per sec at 0 hunger
    coldDamage: 14,                // per sec when freezing
    healthRegen: 3,                // per sec when fed & safe
    healthRegenHungerGate: 55,
    invulnSec: 0.45,
  },

  life: {
    baseLifespanSec: 150,          // full life at normal mutations
    stages: [                      // fraction gates of total life
      { name: 'baby', t: 0.0 },
      { name: 'juvenile', t: 0.14 },
      { name: 'adult', t: 0.40 },
      { name: 'elder', t: 0.82 },
    ],
    stageScale: { baby: 0.5, juvenile: 0.78, adult: 1.0, elder: 0.95 },
  },

  predator: {
    aggroRadius: 11,
    loseRadius: 16,
    giveUpSec: 4,
    speed: 6.2,
    wanderSpeed: 2.6,
    contactRadius: 1.0,
  },

  prey: {                          // for hunter species (fox/shark)
    speed: 5.6,
    fleeRadius: 9,
    wanderSpeed: 2.2,
  },

  food: {
    eatRadius: 1.3,
    bobAmp: 0.12,
    spin: 0.8,
  },

  reproduce: {
    hungerGate: 45,
    dnaPerOffspring: 120,
    nestCooldownSec: 6,
    fertileCooldownMult: 0.6,
  },

  dna: {
    perFood: 2,
    reachAdult: 35,
    perOffspring: 120,
    elderPer10s: 1,
  },

  fx: {
    poolSize: 80,
  },

  caps: {
    entities: 26,                  // active predators+prey
    groundProps: 320,              // instanced
    foodItems: 18,
  },

  interact: {
    radius: 1.9,                   // bump distance to trigger an interactable
    fruitTrees: 4, fruitCooldown: 7, fruitPerShake: 2,
    mushrooms: 6, hives: 2, burrows: 2,
    stingDamage: 14,               // angry hive sting (non-bees)
    boostSec: 5, boostSpeed: 1.45, // mushroom speed buzz
  },

  nest: {
    materialsNeeded: 3,            // twigs to collect before building
    twigs: 6,
    buildRadius: 2.2,
  },
};

// Unlock costs live with species, but mirrored here for the meta screen order.
export const UNLOCK_ORDER = ['bee', 'penguin', 'turtle', 'salmon', 'fox', 'shark'];
