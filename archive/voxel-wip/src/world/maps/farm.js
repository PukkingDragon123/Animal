// Kishiwada farm at dawn — prologue cinematic (environments.md §1, art_direction.md §6 "farm at dawn").
// HD-2D side-scroll stage set (docs/SCENES.md): the camera sits south (+z) looking north at a
// long east–west Senshu farm strip, early summer, with the Izumi ridge on the horizon.
//
//   back   z 0–8    satoyama woods + farmstead: kominka farmhouse, kura, yakisugi barn, cow shed,
//                   onion-drying hut, vinyl greenhouses, agrivoltaic array, hokora + jizō
//   play   z 8–16   farmyard, pasture (herd), cabbage field (Cabbunny / Moglow), packed-earth lane
//   front  z 16–24  irrigation channel, utility poles with crows, garden plots and the flooded
//                   rice paddies that mirror the dawn sky (Polaris's shadow sweeps across them)
//
// Story beats (src/story/chapter1.js prologue): Kagarou bursts out of the bamboo brush at
// `treeline`, clears the pasture's back fence at `fence_jump`, crosses the herd and skids to a
// halt at `wolf_stop` facing the farmer; the sky whale passes behind the set (negative z).
// Facing: 0 = toward the camera (+z), 90 = right (+x), 180 = away, 270 = left.

const W = 80, D = 24;
// 2 m fence segments along x (rot 0) or z (rot 90), skipping gap centres
const fenceX = (z, x0, x1, gaps = []) => { const o = []; for (let x = x0 + 1; x < x1; x += 2) if (!gaps.includes(x)) o.push(['fence_farm', x, z, 0]); return o; };
const fenceZ = (x, z0, z1) => { const o = []; for (let z = z0 + 1; z < z1; z += 2) o.push(['fence_farm', x, z, 90]); return o; };
const rows = (id, xs, zs, rot = 0, y) => { const o = []; for (const z of zs) for (const x of xs) o.push(y == null ? [id, x, z, rot] : [id, x, z, rot, 1, y]); return o; };

export default {
  id: 'farm', name: 'Kishiwada Farm', area: 'Kishiwada, Osaka Pref.', size: [W, D], base: 'g',
  view: 'side',
  // low pitch: big dawn sky over the Izumi ridge, the farm strip in the lower half
  cam: { pitch: 0.1, fov: 28, dist: 24, minDist: 13, maxDist: 32, lookY: 2.6, z: 12, minX: 16, maxX: 64 },
  backdrop: [
    { kind: 'mountains', z: -125, x0: -90, x1: 170, height: 30, color: '#2a2850', color2: '#6a4f8a', seed: 4 },     // far Izumi-Katsuragi ridge (fog lifts it toward lilac)
    { kind: 'mountains', z: -70, x0: -60, x1: 140, height: 15, color: '#1b1d3a', color2: '#5a4a78', seed: 9 },      // near ridge, mist in the valleys
    { kind: 'hills', z: -34, x0: -40, x1: 120, height: 9, color: '#1e3034', color2: '#3a3a52', seed: 3 },           // foothill orchards
    { kind: 'trees', z: -6, x0: -20, x1: 100, y0: -2.5, height: 7.5, color: '#203828', color2: '#2a3430', seed: 7 }, // satoyama woods behind the farm
  ],
  ops: [
    // back: woods floor, farmstead yard
    ['rect', 0, 0, W, 8, 'G'], ['scatter', 0, 0, W, 4, 'L', 0.18, 3], ['scatter', 0, 3, W, 5, 'g', 0.35, 4],
    ['rect', 4, 7, 30, 6, 'd'], ['scatter', 4, 7, 30, 1, 'g', 0.3, 5], ['scatter', 4, 12, 30, 1, 'g', 0.12, 6],
    // pasture grass, cabbage + onion field
    ['rect', 37, 6, 16, 7, 'g'], ['scatter', 37, 6, 16, 7, 'G', 0.3, 7], ['scatter', 37, 6, 16, 7, 'f', 0.05, 8],
    ['rect', 56, 7, 13, 6, 'F'], ['rect', 65, 4, 5, 3, 'F'],
    // the farm lane (packed earth with grass verges) running the whole strip
    ['rect', 0, 13, W, 3, 'd'], ['scatter', 34, 13, W - 34, 1, 'g', 0.3, 11], ['scatter', 0, 15, W, 1, 'g', 0.22, 12],
    // irrigation channel, pole verge, garden plots (west) and flooded paddies (east)
    ['rect', 0, 16, W, 1, ','], ['rect', 0, 17, W, 1, 'g'],
    ['rect', 0, 18, 30, 6, 'F'], ['rect', 9, 18, 1, 6, 'g'], ['rect', 19, 18, 1, 6, 'g'],
    ['rect', 30, 18, 50, 6, '~'], ['rect', 30, 18, 1, 6, 'g'], ['rect', 42, 18, 1, 6, 'g'], ['rect', 54, 18, 1, 6, 'g'], ['rect', 66, 18, 1, 6, 'g'], ['rect', 30, 21, 50, 1, 'g'],
  ],
  props: [
    // ---- satoyama woods + bamboo brush along the back edge (Kagarou's cover)
    ['bamboo', 1.2, 1.4, 0, 1.1], ['pine', 3.2, 0.8, 40, 1.2], ['bamboo', 2.6, 5.6, 90], ['kaki_tree', 2.4, 7.6, 0, 0.95],
    ['pine', 16.4, 0.8, 120, 1.1], ['bamboo', 22.8, 1.2, 0, 1.15], ['pine', 33.4, 1.0, 200, 1.25], ['maple', 35.6, 0.8, 30, 1.0],
    ['bamboo', 48.4, 1.0, 0, 1.2], ['bamboo', 50.6, 2.2, 120, 1.1], ['bamboo', 52.4, 0.9, 60, 1.25], ['bush', 49.4, 3.6, 10], ['bush', 51.6, 4.2, 70],
    ['tallgrass', 47.6, 4.3], ['tallgrass', 50.4, 5.0], ['susuki', 46.6, 4.8],
    ['pine', 57.4, 0.6, 300, 1.15], ['bamboo', 62.6, 0.8, 30, 1.1], ['pine', 70.2, 0.7, 80, 1.2], ['bamboo', 79, 1.4, 0, 1.1],
    // ---- farmstead: kominka, kura, yakisugi barn
    ['kominka', 10, 3.9, 0],
    ['kura', 19, 3.2, 0],
    ['yakisugi_barn', 28.2, 3.4, 0],
    ['tractor', 35.2, 4.6, 270],
    ['hand_pump', 5.4, 9.2], ['dog_house', 14.6, 9.4, 15], ['kei_truck', 18.6, 10.2, 0], ['harvest_crates', 22.0, 7.6, 10], ['tarp_pile', 33.3, 7.4, 0],
    ['chicken_coop', 24.6, 8.4, 0], ['haystack', 31.6, 7.6, 20, 0.9], ['crate', 33.9, 9.0, 15], ['barrel', 3.3, 8.6],
    ['lantern_post', 4.0, 12.4], ['vending', 15.9, 7.5, 0],
    // ---- pasture (the herd grazes here); open front gate where the wolf runs out
    ['cow_shed', 43.2, 2.3, 0],
    ...fenceX(5.9, 37, 53), ...fenceZ(37, 5, 13), ...fenceZ(53, 5, 13), ...fenceX(12.6, 37, 53, [42, 44, 46]),
    ['fence_farm', 41.4, 13.4, 300], ['trough', 39.6, 8.0, 90], ['haystack', 51.2, 7.4, 0, 0.85],
    // ---- onion-drying hut, greenhouses, solar sharing over the onion beds
    ['onion_hut', 56.2, 3.2, 0],
    ['greenhouse', 61.0, 3.5, 0], ['greenhouse', 65.6, 3.5, 0],
    ['agrivoltaic', 69.6, 5.4, 0], ...rows('onion_row', [68.6, 70.6], [4.9, 5.9]),
    ['drone', 63, 9.2, 30, 1, 2.6],
    // ---- cabbage field (Cabbunny hides in the rows)
    ...rows('cabbage_row', [57.2, 59.4, 61.6, 63.8, 66.0], [7.8, 9.0, 10.2, 11.4]),
    ['scarecrow', 68.2, 9.8, 20], ['bird_scarer', 55.6, 11.6, 0],
    // ---- east end: hokora under the camphor, jizō, honour stand, vending glow
    ['kusu_tree', 76.6, 2.6, 0], ['hokora', 75.2, 5.6, 0], ['jizo', 72.4, 5.0, 0], ['stone_lantern', 78.4, 6.0, 0, 0.8],
    ['veg_stand', 72.2, 8.4, 0], ['vending', 74.6, 8.2, 0], ['harvest_crates', 70.4, 8.6, 0],
    // ---- signs (text on panels)
    ['sign_board', 7.6, 12.4, 0], ['notice_sign', 54.6, 12.8, 0], ['notice_sign', 77.6, 12.6, 0],
    // ---- foreground: utility poles + wires (crows), garden plots, paddies, grasses
    ...[4, 22, 40, 58, 76].flatMap((x) => [['utility_pole', x, 17.3], ['power_wires', x, 17.3]]), ['utility_pole', 94, 17.3],
    ...rows('cabbage_row', [1.4, 3.6, 6.0], [19.0, 20.6]), ...rows('onion_row', [11.2, 13.4, 15.8], [19.0, 20.6, 22.2]), ...rows('cabbage_row', [21.4, 23.8, 26.2], [19.2, 21.0, 22.8]),
    ['scarecrow', 7.0, 22.6, -20],
    ...rows('paddy_rice', [32.5, 35, 37.5, 40], [19.5], 0, -0.32), ...rows('paddy_rice', [56.5, 59, 61.5, 64], [19.5, 23], 0, -0.32),
    ...rows('paddy_rice', [44.5, 47, 49.5, 52], [23], 0, -0.32),
    ['susuki', 8.6, 17.6], ['tallgrass', 28.8, 17.7], ['susuki', 41.0, 17.7], ['reeds', 46.6, 17.6], ['susuki', 58.6, 17.7], ['reeds', 67.4, 17.6], ['tallgrass', 75.4, 17.6],
    ['reeds', 30.4, 22.8], ['reeds', 54.4, 21.4],
    // ---- far: offshore wind turbines in the bay (far left) and the morning ridge
    ['wind_turbine', -16, -72, 0, 0.9], ['wind_turbine', -4, -80, 0, 0.8], ['wind_turbine', 8, -76, 0, 0.85],
  ],
  panels: [
    { x: 7.6, y: 1.6, z: 12.52, w: 2.5, h: 0.96, kind: 'sign', title: '久保農園', lines: ['KUBO FARM'], bg: '#f4e9d2', fg: '#3a2418', accent: '#7c2a1e', ppm: 56 },
    { x: 54.6, y: 1.72, z: 12.9, w: 1.12, h: 0.7, kind: 'sign', title: 'トコンモン保護区域', lines: ['PROTECTED TOKONMON', 'NO CAPTURE', 'WITHOUT LICENSE'], bg: '#ffffff', fg: '#1a2a6a', accent: '#c8281e', ppm: 80 },
    { x: 77.6, y: 1.72, z: 12.7, w: 1.12, h: 0.7, kind: 'sign', title: '岸和田市', lines: ['KISHIWADA CITY'], bg: '#1d4fa8', fg: '#ffffff', accent: '#ffffff', ppm: 64 },
    { x: 72.2, y: 1.51, z: 8.86, w: 1.5, h: 0.4, kind: 'sign', title: '無人販売 100円', lines: ['HARVEST MOON'], bg: '#f4e9d2', fg: '#2a2a2a', accent: '#c8281e', ppm: 72 },
  ],
  points: {
    treeline: [50.2, 3.2, 200],      // Kagarou bursts out of the bamboo brush (back)
    fence_jump: [48.6, 5.9, 200],    // clears the pasture's back fence
    pasture: [45, 9.3],              // herd grazes here
    wolf_stop: [44.6, 14.4, 270],    // front-centre: skids to a halt on the lane, facing the farmer
    farmer: [39.4, 14.2, 90],        // Old Man Kubo on the lane by the pasture gate, facing the wolf
    field: [61.6, 9.6],              // cabbage field (Cabbunny + Moglow)
    cam_wide: [44, 10],              // establishing shot target
    house: [10, 8.2, 0],             // in front of the kominka engawa
    shrine: [74.6, 7.0, 180],        // hokora / jizō
    stand: [72.2, 9.6, 180],         // honour stand
    start: [30, 14.6, 90],
  },
  spawns: { start: [30, 14.6, 90] },
  exits: [{ x: 0, z: 13, w: 1, d: 3, to: 'worldmap', spawn: 'farm', label: 'Osaka' }],
  lights: [
    { pos: [7.5, 1.6, 7.6], color: '#ffb35c', intensity: 3, range: 6 },     // lamplight spilling from the engawa
    { pos: [25.6, 2.9, 6.4], color: '#ffc27a', intensity: 2.5, range: 6 },  // barn door lamp
    { pos: [74.6, 1.6, 9.0], color: '#bff4ff', intensity: 2.5, range: 5 },  // vending machine glow at the lane end
  ],
  water: { deep: '#8a6a9a', shallow: '#e8a88a' },
  ambience: { particles: 'mist', music: 'farm', sound: 'farm' },
};
