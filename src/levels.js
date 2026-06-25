// Handcrafted, BOUNDED levels — one designed arena per species (no more infinite
// procedural streaming). Each level fixes the play space and hand-places the
// things that matter for the run: where you start, where your life's goal sits,
// where predators lurk, the hazards you must dodge, and a few signature
// landmark props. Ambient scenery is still scattered (but bounded to the arena)
// by world.js. Data only — sim/render read it.
//
//   radius        soft-walled arena radius (units from origin)
//   start         player spawn
//   goal          anchor for the reproduction target (nest / mate / hive / female)
//   food          { count, cx, cz, spread } designed feeding ground (omit if noEat)
//   predators     fixed posts where predators patrol (cycled if more are spawned)
//   interactables [{ type, x, z }] hand-placed burrows / mud / mushrooms / fruit
//   hazards       [{ x, z, r, kind, dps }] damage zones to weave through
//   props         [{ build, x, z, s }] signature landmark scenery
//   landmark      optional headline note (for the loading/birth flavour)

export const LEVELS = {
  // Beach gauntlet: dig out high on the sand, dash through crabs to the surf.
  turtle: {
    radius: 46, biomeNote: 'a moonlit nesting beach',
    start: { x: 0, z: -33 }, goal: { x: 0, z: -31 },
    food: { count: 16, cx: 0, cz: 20, spread: 20 },
    predators: [{ x: -11, z: -19 }, { x: 10, z: -23 }, { x: 2, z: -9 }],
    interactables: [],
    hazards: [
      { x: -6, z: -25, r: 3.2, kind: 'crab', dps: 16 },
      { x: 8, z: -15, r: 3.0, kind: 'crab', dps: 16 },
      { x: -4, z: -6, r: 3.0, kind: 'crab', dps: 16 },
    ],
    props: [
      { build: 'log', x: -8, z: -30, s: 1.1 }, { build: 'rock', x: 9, z: -29, s: 1.2 }, { build: 'rock', x: -13, z: -12, s: 1.0 },
      { build: 'coral', x: 12, z: 16, s: 1.3 }, { build: 'coral', x: -14, z: 22, s: 1.1 }, { build: 'seaweedProp', x: 4, z: 28, s: 1.4 },
      { build: 'rock', x: -3, z: 30, s: 1.0 }, { build: 'seaweedProp', x: 16, z: 8, s: 1.2 },
    ],
  },

  // A still river bend: rise off the water, find the dusk swarm. No time to lose.
  mayfly: {
    radius: 38, biomeNote: 'a river bend at dusk',
    start: { x: 0, z: -8 }, goal: { x: 0, z: 12 },
    predators: [{ x: 12, z: 4 }],
    interactables: [],
    hazards: [{ x: -8, z: 6, r: 3.4, kind: 'fish', dps: 22 }],
    props: [
      { build: 'reed', x: -10, z: -6, s: 1.3 }, { build: 'reed', x: 11, z: -2, s: 1.2 }, { build: 'reed', x: -6, z: 14, s: 1.2 },
      { build: 'rock', x: 7, z: 10, s: 1.0 }, { build: 'tree', x: -16, z: 2, s: 1.2 }, { build: 'tree', x: 15, z: 16, s: 1.0 },
      { build: 'reed', x: 4, z: 20, s: 1.1 },
    ],
  },

  // A sunlit meadow with the hive at its heart and flower patches to work.
  bee: {
    radius: 42, biomeNote: 'a flowering summer meadow',
    start: { x: 0, z: 0 }, goal: { x: 0, z: 0 },
    food: { count: 18, cx: 0, cz: 4, spread: 30 },
    predators: [{ x: -16, z: 12 }, { x: 15, z: -10 }],
    interactables: [
      { type: 'mushroom', x: -9, z: 8 }, { type: 'mushroom', x: 12, z: 6 },
      { type: 'mud', x: -7, z: -12 }, { type: 'burrow', x: 14, z: 14 }, { type: 'fruitTree', x: -18, z: -4 },
    ],
    hazards: [{ x: 10, z: 18, r: 3.2, kind: 'wasp', dps: 14 }],
    props: [
      { build: 'tree', x: -20, z: 6, s: 1.3 }, { build: 'tree', x: 19, z: 10, s: 1.1 }, { build: 'bush', x: 8, z: -14, s: 1.1 },
      { build: 'bush', x: -12, z: 16, s: 1.0 }, { build: 'flowerProp', x: 6, z: 9, s: 1.2 }, { build: 'flowerProp', x: -5, z: -6, s: 1.1 },
      { build: 'flowerProp', x: 16, z: -2, s: 1.0 }, { build: 'fern', x: -15, z: -10, s: 1.0 },
    ],
  },

  // The long climb: a river course running uphill (+z) past bears and rapids.
  salmon: {
    radius: 52, biomeNote: 'a rocky river, climbing inland',
    start: { x: 0, z: -36 }, goal: { x: 0, z: 42 },
    food: { count: 14, cx: 0, cz: -22, spread: 22 },
    predators: [{ x: -8, z: 2 }, { x: 9, z: 22 }],
    interactables: [],
    hazards: [
      { x: 6, z: -8, r: 3.4, kind: 'rock', dps: 12 },
      { x: -7, z: 16, r: 3.4, kind: 'rock', dps: 12 },
    ],
    props: [
      { build: 'rock', x: -6, z: -6, s: 1.4 }, { build: 'rock', x: 7, z: 6, s: 1.5 }, { build: 'rock', x: -5, z: 18, s: 1.4 },
      { build: 'rock', x: 6, z: 30, s: 1.3 }, { build: 'reed', x: -14, z: -20, s: 1.2 }, { build: 'reed', x: 13, z: -28, s: 1.1 },
      { build: 'tree', x: -20, z: 0, s: 1.3 }, { build: 'tree', x: 19, z: 20, s: 1.2 }, { build: 'tree', x: -18, z: 36, s: 1.1 },
    ],
  },

  // The abyss: a dark seabed arena. The giant female glows far across it.
  angler: {
    radius: 46, biomeNote: 'the lightless deep-sea floor',
    start: { x: 0, z: 0 }, goal: { x: 6, z: 34 },
    predators: [],
    interactables: [],
    hazards: [],
    props: [
      { build: 'rock', x: -12, z: 10, s: 1.5 }, { build: 'rock', x: 14, z: -8, s: 1.4 }, { build: 'coral', x: -8, z: 24, s: 1.3 },
      { build: 'rock', x: 10, z: 20, s: 1.3 }, { build: 'coral', x: 18, z: 12, s: 1.2 }, { build: 'rock', x: -16, z: -14, s: 1.4 },
    ],
  },
};

export function levelFor(id) { return LEVELS[id] || LEVELS.turtle; }
