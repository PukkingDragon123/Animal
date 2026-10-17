// Osaka Castle Park — training ground.
// Layout (x → east, z → south):
//   north     the castle on its walled island (raised 1.4 m) inside a deep moat,
//             reached by a stepped stone causeway; Osaka Business Park towers NE
//   z 20–24   sakura promenade along the moat (benches face the castle)
//   centre    main path from the south torii gate up to the causeway plaza
//   east      training ground: sand arena (r 7) ringed by destructible gear,
//             east path where rivals walk in, Purple Rain Café in the SE corner
//   west      tea house, koi pond with waterfall, sakura lawn where kids play
// Facing convention for points / npcs: degrees, 0 = facing south (+z),
// 90 = east, 180 = north, 270 = west (same as prop rotation).

const AX = 35, AZ = 33;   // arena centre
// prop on the arena rim at angle `deg` (0 = east, 90 = south), turned to face the centre
const rim = (id, deg, r = 8.2, s = 1) => {
  const a = (deg * Math.PI) / 180;
  return [id, +(AX + Math.cos(a) * r).toFixed(2), +(AZ + Math.sin(a) * r).toFixed(2), Math.round((Math.atan2(-Math.cos(a), -Math.sin(a)) * 180) / Math.PI), s];
};

export default {
  id: 'castle_park', name: 'Osaka Castle Park', area: 'Chuo Ward, Osaka', size: [50, 44], base: 'g',
  ops: [
    // outer woods beside the moat
    ['rect', 0, 0, 5, 20, 'G'], ['rect', 39, 0, 11, 20, 'G'], ['scatter', 0, 0, 5, 20, 'M', 0.2, 2], ['scatter', 39, 0, 11, 20, 'M', 0.15, 3],
    // moat + castle island (gravel court, grass under the walls) + stepped causeway
    ['rect', 5, 0, 34, 20, '-'],
    ['rect', 10, 0, 24, 16, 'r'], ['rect', 10, 0, 1, 16, 'G'], ['rect', 33, 0, 1, 16, 'G'], ['rect', 10, 15, 24, 1, 'G'],
    ['rect', 20, 13, 4, 7, 'p'],
    // sakura lawn strip + promenade along the moat
    ['rect', 0, 20, 50, 2, 'k'], ['rect', 0, 22, 50, 3, 'p'],
    ['rect', 17, 20, 10, 5, 'P'],                                        // causeway plaza
    // west garden lawn (petals) — painted before its paths
    ['scatter', 0, 25, 20, 18, 'k', 0.25, 9], ['scatter', 0, 25, 20, 18, 'G', 0.12, 19], ['scatter', 11, 37, 8, 6, 'f', 0.18, 4],
    // main path + gate plaza
    ['rect', 20, 25, 4, 19, 'p'], ['rect', 17, 39, 10, 5, 'P'],
    // training ground: gravel apron, sand ring, pedestal apron on the west rim
    ['circle', AX, AZ, 8.6, 'r'], ['circle', AX, AZ, 7.5, 'A'],
    ['rect', 24, 29, 3, 9, 'P'],
    // east path (rivals arrive from the east edge) + café forecourt
    ['rect', 45, 25, 3, 13, 'p'], ['line', [[42.5, 33], [50, 33]], 3, 'p'], ['rect', 43, 37, 7, 2, 'P'],
    // tea-house path and pond walk
    ['rect', 7, 26, 13, 2, 'p'],
    ['line', [[19.9, 33.5], [14.2, 33.5], [13.6, 38.4], [10, 40.6], [4.5, 40.2]], 1.6, 'p'],
    ['circle', 8.5, 35, 3.6, '~'],
    ['rect', 0, 43, 17, 1, 'G'], ['rect', 27, 43, 16, 1, 'G'],
  ],
  heights: [
    ['rect', 10, 0, 24, 16, 1.4],              // island plateau (moat tiles keep their depth)
    ['ramp', 20, 16, 4, 4, 1.4, 0, 'z'],        // causeway steps down to the plaza
  ],
  buildings: [
    // corner turrets (yagura) on the island
    { x: 10, z: 11, w: 4, d: 5, floors: 2, style: 'kura', roof: 'tile', front: 's', fronts: ['s', 'e'], clutter: false },
    { x: 30, z: 11, w: 4, d: 5, floors: 2, style: 'kura', roof: 'tile', front: 's', fronts: ['s', 'w'], clutter: false },
    // Osaka Business Park skyline (NE, behind the moat)
    { x: 42, z: 0, w: 7, d: 6, floors: 10, style: 'tower', front: 's', fronts: ['s', 'w'],
      signs: [{ text: 'OBP 2050', color: '#3ff0ff', side: 's', y: 26, scale: 0.55 }, { text: 'ELEMON BANK', color: '#ffe45c', side: 'w', y: 22, scale: 0.4 }] },
    { x: 42, z: 9, w: 7, d: 6, floors: 5, style: 'office', front: 's', fronts: ['s', 'w'],
      sign: { text: 'エレモン研究所', color: '#5dff9a', side: 's', y: 12, scale: 0.36 } },
    // tea house in the west garden
    { x: 1, z: 25, w: 6, d: 5, floors: 1, style: 'temple', front: 'e', fronts: ['e', 's'], roof: 'tile', clutter: false,
      sign: { text: '茶屋 さくら', color: '#ffb0ca', side: 'e', y: 2.4, scale: 0.42 } },
    // park café in the SE corner (band-pun name)
    { x: 43, z: 39, w: 7, d: 5, floors: 1, style: 'shop', front: 'n', fronts: ['n', 'w'], color: '#efe2ff',
      signs: [{ text: 'PURPLE RAIN CAFÉ', color: '#c08bff', side: 'n', y: 2.5, scale: 0.36 }, { text: 'カフェ', color: '#ff7ad8', side: 'w', vertical: true, at: 0.2, scale: 0.6 }] },
  ],
  props: [
    // --- the castle + walls
    ['osaka_castle', 22, 6.8, 0],
    ['castle_wall', 15, 15.4, 0], ['castle_wall', 17, 15.4, 0], ['castle_wall', 19, 15.4, 0],
    ['castle_wall', 25, 15.4, 0], ['castle_wall', 27, 15.4, 0], ['castle_wall', 29, 15.4, 0],
    ['castle_wall', 33.4, 1, 90], ['castle_wall', 33.4, 3, 90], ['castle_wall', 33.4, 5, 90], ['castle_wall', 33.4, 7, 90], ['castle_wall', 33.4, 9, 90],
    ['castle_wall', 10.6, 1, 270], ['castle_wall', 10.6, 3, 270], ['castle_wall', 10.6, 5, 270], ['castle_wall', 10.6, 7, 270], ['castle_wall', 10.6, 9, 270],
    ['pine', 12.4, 2.6, 0, 1.15], ['pine', 12.6, 8.4, 120], ['pine', 31.6, 3.2, 200, 1.1], ['pine', 31.8, 8.8, 60],
    ['stone_lantern', 20.4, 14.2], ['stone_lantern', 23.6, 14.2],

    // --- outer woods (NW strip, NE corner)
    ['pine', 1.6, 1.8, 0, 1.2], ['bamboo', 3.6, 4.2], ['pine', 2.4, 7.6, 90], ['bamboo', 1.2, 11.2], ['pine', 3.2, 13.6, 200, 1.1], ['bamboo', 3.8, 17.6], ['pine', 1.4, 17.2, 40],
    ['pine', 40.2, 8.4, 30], ['bamboo', 39.8, 3.2], ['pine', 40.6, 16.8, 150, 1.1], ['pine', 44.4, 17.4], ['sakura2', 48.4, 17.6], ['bush', 47.6, 8.2], ['bamboo', 39.8, 12.6],

    // --- sakura promenade (trees + benches facing the castle on the lawn strip)
    ['sakura', 1.5, 20.6], ['sakura2', 5.5, 20.7], ['sakura', 9.6, 20.6, 90], ['sakura3', 13.6, 20.6], ['sakura2', 29.4, 20.7, 180],
    ['sakura', 33.5, 20.6, 40], ['sakura3', 37.5, 20.6], ['sakura2', 41.5, 20.7, 270], ['sakura', 45.5, 20.6, 120],
    ['bench', 3.5, 21.3, 180], ['bench', 7, 21.3, 180], ['bench', 11.6, 21.3, 180], ['bench', 31.5, 21.3, 180], ['bench', 39.5, 21.3, 180], ['bench', 43.5, 21.3, 180],
    ['vending', 15.6, 20.8, 0], ['vending', 16.8, 20.8, 0], ['trashbins', 48.4, 21, 0],
    ['streetlamp', 4.5, 24.6], ['streetlamp', 12.5, 24.6], ['streetlamp', 28.5, 24.6], ['streetlamp', 43.5, 24.6],
    ['stone_lantern', 17.5, 20.6], ['stone_lantern', 26.5, 20.6], ['signpost', 26.4, 24.4, 200],
    ['lilypad', 7.5, 17.8, 0, 1, -0.5], ['lilypad', 36.4, 12, 40, 1, -0.5],

    // --- main path + gate
    ['torii', 22, 42.3, 0],
    ['stone_lantern', 18.4, 39.6], ['stone_lantern', 25.6, 39.6],
    ['streetlamp', 19.4, 28.5], ['streetlamp', 19.4, 35.6], ['streetlamp', 24.6, 26.6], ['streetlamp', 24.6, 38.4],
    ['flowerbed', 17.6, 41.4, 90], ['flowerbed', 26.4, 41.4, 90], ['noticeboard', 18.6, 38.3, 0], ['bicycle', 27.6, 40.8, 80], ['bicycle', 28.4, 41, 100],
    ...[1, 3, 5, 7, 9, 11, 13, 15, 29, 31, 33, 35, 37, 39, 41].map((x) => ['fence_wood', x, 43.5, 0]),

    // --- training ground (destructible rim gear; gaps N for the coach, W for the pods, E for the path)
    rim('training_dummy', 225), rim('sandbags', 245), rim('target_post', 296), rim('sandbags', 316), rim('tires', 338),
    rim('tires', 24), rim('sandbags', 44), rim('training_dummy', 64), rim('target_post', 90), rim('sandbags', 112),
    rim('training_dummy', 132), rim('tires', 150), rim('punching_bag', 210, 8.6),
    ['crate', 38.6, 24.2], ['barrel', 39.6, 24.4], ['wooden_dummy', 31, 24.4, 0],
    ['holo_billboard', 43.6, 27.4, 330], ['drone', 31.5, 29.5, 30, 1, 4.6], ['drone', 39.2, 37, 210, 1, 5.2],
    ['noticeboard', 27, 27.8, 45],

    // --- east path + café corner
    ['sakura', 48.6, 26.4], ['sakura3', 48.6, 29.8, 60], ['sakura2', 48.6, 36.6, 200],
    ['vending', 48.4, 31, 270], ['trashbins', 44.4, 36.4, 90], ['streetlamp', 44.4, 30.5],
    ['bench', 42.5, 41.8, 90], ['icecream_stand', 45.2, 36.6, 180],

    // --- west garden: tea house, pond, sakura lawn, kids' corner
    ['waterfall_rock', 6.6, 31.4, 0], ['reeds', 11.6, 32.4], ['reeds', 4.8, 37.6], ['lilypad', 9.6, 36.2, 0, 1, -0.4], ['lilypad', 7.2, 37.4, 50, 0.8, -0.4],
    ['rock_m', 12.4, 36.6, 30], ['stone_lantern', 13, 31.6], ['stone_lantern', 4.6, 39.4], ['bench', 15.2, 36.6, 270], ['bench_stone', 9.4, 39.4, 180],
    ['stone_lantern', 7.6, 24.6], ['vending', 7.7, 29.6, 90], ['bench_stone', 9.4, 28.6, 0], ['flowerbed', 3.8, 30.6, 0],
    ['sakura2', 1.6, 33.4], ['sakura', 2.2, 38.4, 50], ['sakura3', 1.8, 42], ['sakura', 6.6, 42.2, 300], ['sakura2', 13.6, 29.4, 140],
    ['sakura', 17.4, 30.6, 220], ['sakura3', 11.6, 25, 30], ['sakura', 16.6, 37.6, 10], ['bush', 18.6, 26.6],
    ['tires', 13.8, 41.2, 20], ['tires', 15.6, 42, 160], ['flowerbed', 10.8, 42.4, 0],
    ['streetlamp', 14.5, 32.5], ['streetlamp', 10.5, 28.4],
  ],
  points: {
    gate: [22, 41.2, 180],            // player spawn, just inside the torii
    mika_meet: [22, 33.2, 0],         // Mika waits on the main path, facing the gate
    ground_center: [AX, AZ],
    coach: [AX, 25.4, 0],             // north rim of the arena, facing in
    kaito_enter: [47, 33, 270],       // east path, walking in from the east edge
    pedestals: [25, 33, 90],          // centre of the clear 2×6 apron (x 24–26, z 30–36) on the west rim; pods in a N–S row
    bench_night: [7, 21.3, 180],    // bench under the sakura, facing the castle across the moat
    castle_view: [22, 21.5, 180],     // causeway plaza, framing the castle
  },
  arenas: { main: { x: AX, z: AZ, r: 7 } },
  npcs: [
    { id: 'jogger', char: { random: 31, role: 'jogger' }, x: 9, z: 23, face: 90, wander: 12, idle: 'stretch' },
    { id: 'pigeon_man', char: { random: 77, role: 'grandpa' }, x: 14.3, z: 35.4, face: 270, idle: 'point', talk: 'park_pigeons' },
    { id: 'kid_a', char: { random: 5, role: 'kid' }, x: 13.6, z: 39.6, face: 90, wander: 3, idle: 'cheer' },
    { id: 'kid_b', char: { random: 12, role: 'kid' }, x: 16.4, z: 40.4, face: 270, wander: 3, idle: 'hop' },
    { id: 'tea_granny', char: 'granny', x: 8.2, z: 26.6, face: 90, idle: 'bow', talk: 'park_tea' },
  ],
  spawns: { start: [22, 41.2], fromWorldmap: [22, 41.2] },
  exits: [{ x: 20, z: 43, w: 4, d: 1, to: 'worldmap', spawn: 'castle_park', label: 'Osaka' }],
  lights: [
    { pos: [22, 10, 17], color: '#ffe2b0', intensity: 6, range: 16 },   // castle floodlights
    { pos: [15, 5, 16.5], color: '#ffd9a0', intensity: 5, range: 12 }, { pos: [29, 5, 16.5], color: '#ffd9a0', intensity: 5, range: 12 },
    { pos: [AX, 6, AZ], color: '#bfe8ff', intensity: 3, range: 12 },    // training-ground flood
  ],
  water: { deep: '#1d5a78', shallow: '#4aa6c4', neon: '#ff9ad0' },
  ambience: { particles: 'sakura', music: 'park', sound: 'park' },
};
