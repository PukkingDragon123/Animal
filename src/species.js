// Species roster — SPECIFIC, real species with researched biology (scientific
// name, IUCN status, accurate diet/predators/lifespan/signature struggle, and
// true facts). Internal ids are kept stable (rabbit/fox/…) so saves & quests
// don't break; `name`/`latin`/`status`/`facts` carry the authenticity.
// All gameplay differences are data here; sim, meshes and HUD read these.

export const FOODS = {
  grass:   { id: 'grass',   build: 'grass',       color: 0x57bf43, label: 'grasses' },
  flower:  { id: 'flower',  build: 'flowerFood',  color: 0xff7ab0, label: 'nectar' },
  fish:    { id: 'fish',    build: 'fishFood',    color: 0x9ad7ec, label: 'fish' },
  seaweed: { id: 'seaweed', build: 'seaweedFood', color: 0x37b06a, label: 'jellyfish' },
  bug:     { id: 'bug',     build: 'bug',         color: 0xc9a24a, label: 'insects' },
  berry:   { id: 'berry',   build: 'berry',       color: 0xd0394b, label: 'berries' },
};

export const SPECIES = {
  rabbit: {
    id: 'rabbit', name: 'European Rabbit', latin: 'Oryctolagus cuniculus', status: 'Endangered', biome: 'forest', build: 'rabbit',
    colors: { body: 0xb79468, belly: 0xf4ecdd, accent: 0xe7a6b0, eye: 0x2a2320 },
    baseScale: 1.0, speedMult: 1.12, swims: false,
    diet: { kind: 'graze', food: 'grass' },
    predatorBuild: 'fox', predatorCount: 3,
    reproduce: 'mate', struggle: 'predators',
    desc: 'Fast, fluffy, and on every predator’s menu.',
    dietName: 'Grasses', dietIcon: '🌿', rating: { speed: 4, size: 3, life: 3 }, rarity: 'Common',
    ability: 'Crepuscular Sprint — quick bursts, dives into burrows',
    facts: [
      'Foxes alone account for about 28% of wild rabbit deaths.',
      'Most wild rabbits never survive their first year.',
      'You can breed again the day after giving birth. No rest.',
    ],
  },
  bee: {
    id: 'bee', name: 'Western Honey Bee', latin: 'Apis mellifera', status: 'Least Concern', biome: 'meadow', build: 'bee',
    colors: { body: 0xffd23f, belly: 0xffe9a0, accent: 0x2b2520, eye: 0x201c18 },
    baseScale: 0.62, speedMult: 1.25, swims: false, flying: true,
    diet: { kind: 'graze', food: 'flower' },
    predatorBuild: 'bird', predatorCount: 2,
    reproduce: 'nest', struggle: 'shortlife',
    desc: 'Tiny wings, tinier lifespan, works to death.',
    dietName: 'Nectar', dietIcon: '🌸', rating: { speed: 5, size: 1, life: 1 }, rarity: 'Common',
    ability: 'Pollinator — fast flight, one-shot barbed sting',
    facts: [
      'A worker bee lives just 4–8 weeks, then works itself to death.',
      'Your barbed sting tears loose in mammal skin — using it can kill you.',
      'You will visit thousands of flowers for a few drops of honey.',
    ],
  },
  meerkat: {
    id: 'meerkat', name: 'Meerkat', latin: 'Suricata suricatta', status: 'Least Concern', biome: 'savanna', build: 'meerkat',
    colors: { body: 0xc7a878, belly: 0xe7d8bb, accent: 0x5a4632, eye: 0x14110e },
    baseScale: 0.85, speedMult: 1.06, swims: false,
    diet: { kind: 'graze', food: 'bug' },
    predatorBuild: 'bird', predatorCount: 3,
    reproduce: 'mate', struggle: 'predators',
    desc: 'A desert mongoose that lives or dies by its lookouts.',
    dietName: 'Insects', dietIcon: '🦂', rating: { speed: 3, size: 2, life: 3 }, rarity: 'Common',
    ability: 'Sentinel — spots danger early; venom-resistant',
    facts: [
      'A sentinel stands guard with different screams for hawks vs jackals.',
      'Cape cobras slither into the burrow to eat the pups.',
      'You dig all day for scorpions — and shrug off their venom.',
    ],
  },
  monarch: {
    id: 'monarch', name: 'Monarch Butterfly', latin: 'Danaus plexippus', status: 'Vulnerable', biome: 'meadow', build: 'butterfly',
    colors: { body: 0xf06a1e, belly: 0xffae5a, accent: 0x201813, eye: 0x201813 },
    baseScale: 0.6, speedMult: 1.18, swims: false, flying: true,
    diet: { kind: 'graze', food: 'flower' },
    predatorBuild: 'bird', predatorCount: 1,
    reproduce: 'nest', struggle: 'shortlife',
    desc: 'Beautiful, toxic, and racing a 3,000 km clock.',
    dietName: 'Nectar', dietIcon: '🌼', rating: { speed: 4, size: 1, life: 1 }, rarity: 'Rare',
    ability: 'Toxic Wings — milkweed poison wards off most birds',
    facts: [
      'Summer adults live just 2–5 weeks.',
      'One special generation flies 3,000+ km to Mexico — their kids forget the way.',
      'A lifetime of milkweed makes you poisonous. Small comfort.',
    ],
  },
  penguin: {
    id: 'penguin', name: 'Emperor Penguin', latin: 'Aptenodytes forsteri', status: 'Near Threatened', biome: 'arctic', build: 'penguin',
    colors: { body: 0x2c3550, belly: 0xf4f7fb, accent: 0xff9b30, eye: 0x14110e },
    baseScale: 1.08, speedMult: 0.95, swims: false,
    diet: { kind: 'graze', food: 'fish' },
    predatorBuild: 'seal', predatorCount: 2,
    reproduce: 'mate', struggle: 'cold',
    desc: 'The biggest penguin — adorable, freezing, edible.',
    dietName: 'Fish', dietIcon: '🐟', rating: { speed: 3, size: 4, life: 4 }, rarity: 'Rare',
    ability: 'Huddle — shares colony warmth in the glow',
    facts: [
      'Males fast ~115 days, incubating one egg on their feet through the −40°C winter.',
      'Huddles rotate: everyone takes a turn freezing on the outside.',
      'Leopard seals wait exactly where you must enter the water.',
    ],
  },
  turtle: {
    id: 'turtle', name: 'Leatherback Turtle', latin: 'Dermochelys coriacea', status: 'Vulnerable', biome: 'ocean', build: 'turtle',
    colors: { body: 0x3b4a63, belly: 0xc9c6b0, accent: 0x6f7fa0, eye: 0x1c1812 },
    baseScale: 1.0, speedMult: 0.92, swims: true,
    diet: { kind: 'graze', food: 'seaweed' },
    predatorBuild: 'bird', predatorCount: 3,
    reproduce: 'nest', struggle: 'hatchling',
    desc: 'Born on a beach that is actively trying to kill you.',
    dietName: 'Jellyfish', dietIcon: '🪼', rating: { speed: 2, size: 4, life: 5 }, rarity: 'Rare',
    ability: 'Jelly Gulp — throat spines trap soft prey',
    facts: [
      'Only about 1 in 1,000 hatchlings ever reaches adulthood.',
      'Ghost crabs and herons pick you off on the crawl to the sea.',
      'You eat almost nothing but jellyfish — backward throat spines stop them escaping.',
    ],
  },
  salmon: {
    id: 'salmon', name: 'Sockeye Salmon', latin: 'Oncorhynchus nerka', status: 'Least Concern', biome: 'river', build: 'salmon',
    colors: { body: 0xe23b2e, belly: 0xeaf0f3, accent: 0x2f7a4f, eye: 0x161210 },
    baseScale: 0.95, speedMult: 1.05, swims: true,
    diet: { kind: 'graze', food: 'bug' },
    predatorBuild: 'bear', predatorCount: 2,
    reproduce: 'nest', struggle: 'upstream',
    desc: 'Climb the river, spawn once, die. That’s the plan.',
    dietName: 'Insects', dietIcon: '🐛', rating: { speed: 4, size: 2, life: 2 }, rarity: 'Epic',
    ability: 'Semelparous Leap — one all-or-nothing spawning run',
    facts: [
      'You climb rivers for weeks without eating, then spawn once and die.',
      'Bears pick off the big humped males first.',
      'Your spent body fertilizes the entire forest. You’re welcome.',
    ],
  },
  fox: {
    id: 'fox', name: 'Red Fox', latin: 'Vulpes vulpes', status: 'Least Concern', biome: 'forest', build: 'fox',
    colors: { body: 0xe8732f, belly: 0xf6ebd6, accent: 0x3a2a22, eye: 0x14110e },
    baseScale: 1.1, speedMult: 1.05, swims: false,
    diet: { kind: 'hunt', preyBuild: 'rabbit', preyCount: 6 },
    predatorBuild: null, predatorCount: 0,
    reproduce: 'mate', struggle: 'hunt',
    desc: 'The cleverest hunter — when the pounce connects.',
    dietName: 'Rabbits', dietIcon: '🐰', rating: { speed: 4, size: 4, life: 3 }, rarity: 'Epic',
    ability: 'Mouse Pounce — ATTACK to snatch fleeing prey',
    facts: [
      'You dive face-first into snow to catch mice you can only hear.',
      'Miss the pounce and dinner sprints clean away.',
      'Omnivore by necessity: rabbits today, berries tomorrow.',
    ],
  },
  shark: {
    id: 'shark', name: 'Great White Shark', latin: 'Carcharodon carcharias', status: 'Vulnerable', biome: 'ocean', build: 'shark',
    colors: { body: 0x7793a6, belly: 0xeef3f6, accent: 0x4f6675, eye: 0x101314 },
    baseScale: 1.25, speedMult: 1.08, swims: true,
    diet: { kind: 'hunt', preyBuild: 'fish', preyCount: 8 },
    predatorBuild: null, predatorCount: 0,
    reproduce: 'mate', struggle: 'keepMoving',
    desc: 'Apex ambusher — and perpetually, tiringly hungry.',
    dietName: 'Fish & seals', dietIcon: '🐟', rating: { speed: 4, size: 5, life: 4 }, rarity: 'Legendary',
    ability: 'Ram Ventilator — must keep swimming to breathe',
    facts: [
      'Stop swimming and you suffocate — you must move to breathe.',
      '95% of your muscle is built for one explosive ambush.',
      'Everyone fears you, yet most lunges miss and you go hungry.',
    ],
  },
};

// progression order (also the carousel order)
export const SPECIES_LIST = ['rabbit', 'bee', 'monarch', 'meerkat', 'penguin', 'turtle', 'salmon', 'fox', 'shark'];

export function speciesOf(id) { return SPECIES[id] || SPECIES.rabbit; }
export function foodOf(id) { return FOODS[id]; }
