// Species roster — five SPECIFIC real species, each a complete, distinct way to
// live (and die). The data here drives everything: sim behaviour, meshes, HUD.
// Every species carries scientific name, IUCN status, true facts, an ordered
// list of LIFE GOALS (the "quest you must complete in this life"), and trait
// flags that switch on its unique playstyle:
//   noEat            — adult never feeds; the lifespan clock is the whole threat
//   forage           — carry food back to a home/hive to feed the colony
//   dark             — lives in near-total darkness, navigates by a glowing lure
//   dieAfterReproduce— semelparous: breeding spends your life (you die soon after)
// `lifeSec` is the base lifespan in seconds (before mutation/struggle scaling).

export const FOODS = {
  jelly:   { id: 'jelly',   build: 'seaweedFood', color: 0x9fe6e0, label: 'jellyfish' },
  flower:  { id: 'flower',  build: 'flowerFood',  color: 0xff7ab0, label: 'nectar' },
  bug:     { id: 'bug',     build: 'bug',         color: 0xc9a24a, label: 'insects' },
  grass:   { id: 'grass',   build: 'grass',       color: 0x57bf43, label: 'algae' },
  berry:   { id: 'berry',   build: 'berry',       color: 0xd0394b, label: 'berries' },
};

export const SPECIES = {
  // 1) STARTER — a dramatic, simple first goal: just reach the sea.
  turtle: {
    id: 'turtle', name: 'Sea Turtle Hatchling', latin: 'Dermochelys coriacea', status: 'Vulnerable',
    biome: 'ocean', build: 'turtle', article: 'a',
    colors: { body: 0x3b4a63, belly: 0xc9c6b0, accent: 0x6f7fa0, eye: 0x1c1812 },
    baseScale: 0.95, speedMult: 0.98, swims: true, lifeSec: 185,
    diet: { kind: 'graze', food: 'jelly' },
    predatorBuild: 'bird', predatorCount: 2,
    reproduce: 'nest', struggle: 'hatchling',
    desc: 'Born on a beach that is actively trying to eat you.',
    dietName: 'Jellyfish', dietIcon: '🪼', rating: { speed: 2, size: 4, life: 5 }, rarity: 'Common', unlockCost: 0,
    ability: 'Mad Dash — sprint past the gulls to the surf',
    lifeGoals: [
      { id: 'hatch', label: 'Dig out of the nest' },
      { id: 'reachSea', label: 'Reach the sea — dodge the gulls!' },
      { id: 'eat', label: 'Eat your first jellyfish' },
      { id: 'adult', label: 'Survive to adulthood' },
      { id: 'reproduce', label: 'Crawl back ashore to nest' },
    ],
    facts: [
      'Only about 1 in 1,000 hatchlings ever reaches adulthood.',
      'Ghost crabs and gulls pick you off on the crawl to the sea.',
      'You navigate to the water by the bright open horizon over the waves.',
    ],
  },

  // 2) The whole circle of life in one frantic burst.
  mayfly: {
    id: 'mayfly', name: 'Mayfly', latin: 'Ephemera danica', status: 'Least Concern',
    biome: 'river', build: 'mayfly', article: 'a',
    colors: { body: 0xe8efb0, belly: 0xfff7d8, accent: 0xb7c374, eye: 0x2a2a1c },
    baseScale: 0.55, speedMult: 1.32, swims: false, flying: true, lifeSec: 70,
    diet: { kind: 'graze', food: 'flower' },
    predatorBuild: 'bird', predatorCount: 1,
    reproduce: 'mate', struggle: 'ephemeral',
    noEat: true, dieAfterReproduce: true,
    desc: 'No mouth, no time. Find a mate before the clock runs out.',
    dietName: 'Nothing (no mouth!)', dietIcon: '⏳', rating: { speed: 5, size: 1, life: 1 }, rarity: 'Common', unlockCost: 0,
    ability: 'Ephemeral — adults cannot eat; race the lifespan clock',
    lifeGoals: [
      { id: 'flight', label: 'Take to the air' },
      { id: 'adult', label: 'Mature — in minutes' },
      { id: 'court', label: 'Join the mating swarm' },
      { id: 'reproduce', label: 'Mate before you die' },
    ],
    facts: [
      'Adult mayflies live from a few hours to a few days.',
      'Adults have no working mouth — they cannot eat at all.',
      'Whole rivers erupt in synchronized swarms, then it is over by morning.',
    ],
  },

  // 3) A working life: forage nectar, fly it home, feed the colony, repeat.
  bee: {
    id: 'bee', name: 'Worker Honey Bee', latin: 'Apis mellifera', status: 'Least Concern',
    biome: 'meadow', build: 'bee', article: 'a',
    colors: { body: 0xffd23f, belly: 0xffe9a0, accent: 0x2b2520, eye: 0x201c18 },
    baseScale: 0.62, speedMult: 1.22, swims: false, flying: true, lifeSec: 120,
    diet: { kind: 'graze', food: 'flower' },
    predatorBuild: 'bird', predatorCount: 1,
    reproduce: 'nest', struggle: 'shortlife',
    forage: true,
    desc: 'Collect nectar, fly it home, feed the hive. Repeat until you drop.',
    dietName: 'Nectar → Honey', dietIcon: '🍯', rating: { speed: 4, size: 1, life: 2 }, rarity: 'Rare', unlockCost: 0,
    ability: 'Forager — carry nectar back to the hive to feed the colony',
    lifeGoals: [
      { id: 'leave', label: 'Leave the hive' },
      { id: 'forage1', label: 'Sip nectar from a flower' },
      { id: 'deliver', label: 'Carry it home to the hive' },
      { id: 'forageN', label: 'Make enough deliveries for winter' },
      { id: 'reproduce', label: 'The colony survives — your work is done' },
    ],
    facts: [
      'A summer worker lives just 4–8 weeks, then works itself to death.',
      'One bee makes about a twelfth of a teaspoon of honey in its whole life.',
      'You can fly the equivalent of several kilometres a day, flower to flower.',
    ],
  },

  // 4) The great migration: upstream against the current, spawn once, die.
  salmon: {
    id: 'salmon', name: 'Pacific Salmon', latin: 'Oncorhynchus nerka', status: 'Least Concern',
    biome: 'river', build: 'salmon', article: 'a',
    colors: { body: 0xe23b2e, belly: 0xeaf0f3, accent: 0x2f7a4f, eye: 0x161210 },
    baseScale: 0.95, speedMult: 1.06, swims: true, lifeSec: 160,
    diet: { kind: 'graze', food: 'bug' },
    predatorBuild: 'bear', predatorCount: 1,
    reproduce: 'nest', struggle: 'upstream',
    dieAfterReproduce: true,
    desc: 'Climb the whole river against the current, spawn once, and die.',
    dietName: 'Insects', dietIcon: '🐛', rating: { speed: 4, size: 3, life: 2 }, rarity: 'Epic', unlockCost: 0,
    ability: 'Semelparous Leap — one all-or-nothing spawning run',
    lifeGoals: [
      { id: 'grow', label: 'Grow strong out at sea' },
      { id: 'upstream', label: 'Turn home and swim upstream' },
      { id: 'reachNest', label: 'Reach the spawning gravel' },
      { id: 'spawn', label: 'Spawn the next generation' },
    ],
    facts: [
      'You climb rivers for weeks without eating, then spawn once and die.',
      'Bears wait at the rapids and pick off the big humped males first.',
      'Your spent body fertilizes the whole forest. You’re welcome.',
    ],
  },

  // 5) FINALE — the loneliest search, in the crushing dark.
  angler: {
    id: 'angler', name: 'Male Anglerfish', latin: 'Ceratias holboelli', status: 'Least Concern',
    biome: 'ocean', build: 'angler', article: 'a',
    colors: { body: 0x232a36, belly: 0x39414f, accent: 0x9ffcff, eye: 0x0c0e12 },
    baseScale: 0.78, speedMult: 1.0, swims: true, lifeSec: 150,
    diet: { kind: 'graze', food: 'grass' },
    predatorBuild: null, predatorCount: 0,
    reproduce: 'mate', struggle: 'anglerfish',
    noEat: true, dark: true,
    desc: 'A tiny male in endless black. Find the giant female — or vanish.',
    dietName: 'Stored reserves', dietIcon: '🔦', rating: { speed: 2, size: 1, life: 2 }, rarity: 'Legendary', unlockCost: 0,
    ability: 'Bioluminescent Lure — your glow is the only light down here',
    lifeGoals: [
      { id: 'survive', label: 'Endure the crushing dark' },
      { id: 'seekFemale', label: 'Follow her faint distant glow' },
      { id: 'findFemale', label: 'Reach the giant female' },
      { id: 'fuse', label: 'Fuse to her and father her young' },
    ],
    facts: [
      'Males are a fraction of the female’s size and spend life searching for her.',
      'When he finds her, the male permanently fuses to her body.',
      'Fused, he loses his eyes and organs — becoming a lifelong sperm supply.',
    ],
  },
};

// progression / carousel order = rough difficulty ramp
export const SPECIES_LIST = ['turtle', 'mayfly', 'bee', 'salmon', 'angler'];

export function speciesOf(id) { return SPECIES[id] || SPECIES.turtle; }
export function foodOf(id) { return FOODS[id]; }
