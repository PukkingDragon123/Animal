// Species roster + food table. All gameplay differences are data here; the
// sim, meshes and HUD read these. One species teaches one new pattern (L3).

export const FOODS = {
  grass:   { id: 'grass',   build: 'grass',       color: 0x57bf43, label: 'grass' },
  flower:  { id: 'flower',  build: 'flowerFood',  color: 0xff7ab0, label: 'flowers' },
  fish:    { id: 'fish',    build: 'fishFood',    color: 0x9ad7ec, label: 'fish' },
  seaweed: { id: 'seaweed', build: 'seaweedFood', color: 0x37b06a, label: 'seaweed' },
  bug:     { id: 'bug',     build: 'bug',         color: 0xc9a24a, label: 'bugs' },
  berry:   { id: 'berry',   build: 'berry',       color: 0xd0394b, label: 'berries' },
};

export const SPECIES = {
  rabbit: {
    id: 'rabbit', name: 'Rabbit', article: 'a', biome: 'forest', build: 'rabbit',
    colors: { body: 0xd8a878, belly: 0xf4ecdd, accent: 0xf3a9b6, eye: 0x2a2320 },
    baseScale: 1.0, speedMult: 1.12, swims: false,
    diet: { kind: 'graze', food: 'grass' },
    predatorBuild: 'fox', predatorCount: 3,
    reproduce: 'mate', struggle: 'predators', unlockCost: 0,
    desc: 'Fast, fluffy, and constantly hunted.',
    facts: [
      "A rabbit's heart can literally give out from fright.",
      'Almost everything in the forest wants to eat you.',
      'You can breed again a day after giving birth. No rest.',
    ],
  },
  bee: {
    id: 'bee', name: 'Bee', article: 'a', biome: 'meadow', build: 'bee',
    colors: { body: 0xffd23f, belly: 0xffe9a0, accent: 0x2b2520, eye: 0x201c18 },
    baseScale: 0.62, speedMult: 1.25, swims: false, flying: true,
    diet: { kind: 'graze', food: 'flower' },
    predatorBuild: 'bird', predatorCount: 2,
    reproduce: 'nest', struggle: 'shortlife', unlockCost: 60,
    desc: 'Tiny wings, even tinier lifespan.',
    facts: [
      'Worker bees live about five weeks, then drop dead.',
      'Your stinger is barbed — using it kills you.',
      'You will visit over a thousand flowers a day.',
    ],
  },
  penguin: {
    id: 'penguin', name: 'Penguin', article: 'a', biome: 'arctic', build: 'penguin',
    colors: { body: 0x2c3550, belly: 0xf4f7fb, accent: 0xff9b30, eye: 0x14110e },
    baseScale: 1.05, speedMult: 0.95, swims: false,
    diet: { kind: 'graze', food: 'fish' },
    predatorBuild: 'seal', predatorCount: 2,
    reproduce: 'mate', struggle: 'cold', unlockCost: 140,
    desc: 'Adorable. Freezing. Edible.',
    facts: [
      'Huddle for warmth or freeze — survival by shuffling.',
      'Leopard seals lurk right at the ice edge.',
      'You waddle because it actually saves energy. Honest.',
    ],
  },
  turtle: {
    id: 'turtle', name: 'Sea Turtle', article: 'a', biome: 'ocean', build: 'turtle',
    colors: { body: 0x8ec05a, belly: 0xe7e0bf, accent: 0x4f9a63, eye: 0x1c1812 },
    baseScale: 1.0, speedMult: 0.92, swims: true,
    diet: { kind: 'graze', food: 'seaweed' },
    predatorBuild: 'bird', predatorCount: 3,
    reproduce: 'nest', struggle: 'hatchling', unlockCost: 240,
    desc: 'Born on a beach that is trying to kill you.',
    facts: [
      'Only about 1 in 1,000 hatchlings reaches adulthood.',
      'The crawl from nest to sea is the deadliest trip of your life.',
      'Gulls treat your hatching as an all-you-can-eat buffet.',
    ],
  },
  salmon: {
    id: 'salmon', name: 'Salmon', article: 'a', biome: 'river', build: 'salmon',
    colors: { body: 0xf0664f, belly: 0xeaf0f3, accent: 0xb43c30, eye: 0x161210 },
    baseScale: 0.95, speedMult: 1.05, swims: true,
    diet: { kind: 'graze', food: 'bug' },
    predatorBuild: 'bear', predatorCount: 2,
    reproduce: 'nest', struggle: 'upstream', unlockCost: 360,
    desc: 'Swim up. Always up.',
    facts: [
      'You swim hundreds of miles upstream — without eating.',
      'Bears wait at every single waterfall.',
      'You spawn once, then you die. That is the entire plan.',
    ],
  },
  fox: {
    id: 'fox', name: 'Fox', article: 'a', biome: 'forest', build: 'fox',
    colors: { body: 0xf08a3c, belly: 0xf6ebd6, accent: 0x3a2a22, eye: 0x14110e },
    baseScale: 1.1, speedMult: 1.05, swims: false,
    diet: { kind: 'hunt', preyBuild: 'rabbit', preyCount: 6 },
    predatorBuild: null, predatorCount: 0,
    reproduce: 'mate', struggle: 'hunt', unlockCost: 520,
    desc: 'Predator problems: catching dinner.',
    facts: [
      'Miss the pounce and you simply go hungry.',
      'Your prey is faster and twitchier than you would like.',
      'Winter is just hunger, but with snow.',
    ],
  },
  shark: {
    id: 'shark', name: 'Shark', article: 'a', biome: 'ocean', build: 'shark',
    colors: { body: 0x7793a6, belly: 0xeef3f6, accent: 0x4f6675, eye: 0x101314 },
    baseScale: 1.25, speedMult: 1.08, swims: true,
    diet: { kind: 'hunt', preyBuild: 'fish', preyCount: 8 },
    predatorBuild: null, predatorCount: 0,
    reproduce: 'mate', struggle: 'keepMoving', unlockCost: 720,
    desc: 'Apex predator, utterly exhausted.',
    facts: [
      'Stop swimming and you cannot breathe.',
      'That huge body needs constant feeding.',
      'Everyone fears you, yet life is just… tiring.',
    ],
  },
};

export const SPECIES_LIST = ['rabbit', 'bee', 'penguin', 'turtle', 'salmon', 'fox', 'shark'];

export function speciesOf(id) { return SPECIES[id] || SPECIES.rabbit; }
export function foodOf(id) { return FOODS[id]; }
