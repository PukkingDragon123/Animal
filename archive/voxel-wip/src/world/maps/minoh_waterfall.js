// Minoh Safari Reserve — Waterfall Trail. HD-2D side-scroll stage set (docs/SCENES.md,
// docs/refs/environments.md §8 Trail A). Dominant colour: white + cool blue-green.
// Read left → right along the strip (x), depth z: 0 = far back, 24 = camera side.
//   x  0–24  trailhead: exit to Minoh Station, timber safari gate, ranger cabin, camp
//   x 24–30  Autumn Leaves Tempura stall (momiji tempura; a macaque has stolen a bag)
//   x 30–66  riverside walk under cedar terraces; sasa / tall-grass cover by the river;
//            battle clearing; the river runs along the front of the strip
//   x 66–80  stream junction (Kappachi shallows) + vermilion footbridge
//   x 80–94  Minoh Falls: the hero backdrop, plunge pool, viewing deck (trail end)
//   x 94–104 mossy stone steps up through the gorge → Bamboo Trail
// Layers: back terraces + gorge cliffs (z 0–6) · play strip (z 6–18) · front river and
// near bank with dark trunks framing the shot (z 18–24) · cedar wall + ridges behind.
// Facing for points / npcs: 0 = toward the camera (+z), 90 = right (+x), 180 = away, 270 = left.

const W = 104, D = 24;
// deterministic helpers
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const r = rng(2026);
const R2 = (v) => Math.round(v * 100) / 100;

// ---------------------------------------------------------------- terrain
const ops = [
  ['scatter', 0, 0, W, D, 'g', 0.35, 3], ['scatter', 0, 0, W, 7, 'M', 0.45, 5],
  // riverside trail: stone pavers at the trailhead and the falls, packed earth between
  ['rect', 0, 9, 30, 3, 'p'], ['line', [[30, 10.5], [44, 11.2], [58, 10.4], [72, 10.8]], 3, 'd'],
  ['scatter', 30, 9, 42, 4, 'p', 0.12, 9], ['rect', 79, 9, 17, 3.5, 'p'],
  ['rect', 4, 12, 22, 3, 'd'], ['scatter', 4, 12, 22, 3, 'g', 0.25, 11],   // trailhead yard / camp
  ['scatter', 0, 13, 66, 5, 'f', 0.05, 13],
  // front river (left → stream junction), shallow margins Kappachi can wade
  ['rect', 0, 17, 70, 6, ','], ['line', [[-1, 20], [20, 20.4], [40, 19.8], [58, 20.2], [70, 19.6]], 2.6, '~'],
  ['rect', 0, 23, 70, 1, 'G'],
  // outflow from the plunge pool, past the footbridge, into the river
  ['line', [[81, 6.5], [76.6, 10.6], [71.5, 15], [66, 19.5]], 4.4, ','], ['line', [[81, 6.5], [76.6, 10.6], [71.5, 15], [66.5, 19.6]], 2.4, '~'],
  ['rect', 74, 9, 6, 3, 'o'],                               // footbridge deck
  // plunge pool + shallow rim + the hidden nook beside the falls
  ['rect', 78, 2, 16, 6, ','], ['rect', 80, 2, 12, 5, '~'], ['rect', 78, 3, 2, 4, 'M'],
  ['rect', 82, 8, 9, 4, 'o'],                               // falls viewing deck
  // rocky front bank right of the junction
  ['rect', 72, 17, 32, 7, 'M'], ['scatter', 72, 13, 32, 11, 'r', 0.18, 17],
  // mossy stone steps up to the Bamboo Trail
  ['rect', 96, 7, 8, 6, 'p'],
];
const heights = [];
// back terraces (stepped diorama slope; 0.7 m steps keep the player on the strip)
const terr = [4.3, 3.6, 2.9, 2.2, 1.5, 0.6];
for (let x = 0; x < W; x += 4) {
  const v = r() * 0.6;
  for (let z = 0; z < 6; z++) {
    if (x >= 6 && x < 24 && z >= 1) { heights.push(['rect', x, z, 4, 1, z < 2 ? 0.7 : 0]); continue; } // cabin yard is flat
    if (x >= 76 && x < 96 && z >= 2) continue;              // pool basin
    heights.push(['rect', x, z, 4, 1, R2(terr[z] + (z < 5 ? v : 0))]);
  }
}
heights.push(['rect', 82, 8, 9, 4, 0.25], ['rect', 74, 9, 6, 3, 0.3], ['rect', 78, 3, 2, 4, 0.1]);
heights.push(['ramp', 96, 7, 8, 6, 0.15, 2.1, 'x']);
for (let z = 0; z < 7; z++) heights.push(['rect', 96, z, 8, 1, R2(Math.max(2.8, terr[Math.min(5, z)] + 2.2))]);
heights.push(['rect', 72, 18, 32, 6, 0.2], ['rect', 70, 21, 34, 3, 0.45]);

// ---------------------------------------------------------------- props
const props = [];
const P = (...a) => props.push(a);
// the falls (hero) + the gorge walls that frame it ("narrow sky between gorge walls")
P('mn_falls', 86, 1.4, 0, 1, -0.45);
P('mn_cliff', 75.2, 0.4, 0, 1.15, 0.6); P('mn_cliff', 96.8, 0.2, 0, 1.2, 1.2); P('mn_cliff_lo', 70.2, 0.6, 0, 1.1, 1.6);
P('mn_cliff', 102.6, -0.6, 0, 1.25, 2.2); P('mn_cliff_lo', 64.8, -0.4, 0, 1.0, 2.8);
P('mn_cliff', 79.5, -2.6, 0, 1.4, 1.2); P('mn_cliff', 92.6, -2.8, 0, 1.45, 1.4);
// cedars crowning the gorge + the cedar wall behind the whole strip
for (const [x, z, y, s] of [[74, -0.8, 11.6, 0.8], [77.5, -2, 13.6, 0.9], [95, -1.5, 14, 0.85], [99, -1, 12.8, 0.8], [103, -2, 14, 0.9], [68.5, -0.5, 8.4, 0.85], [82, -3.5, 16.5, 0.75], [90.5, -3.6, 16.8, 0.8]]) P('mn_cedar', x, z, r() * 360, s, y);
for (let x = 1; x < 66; x += 4.2 + r() * 1.6) P('mn_cedar', R2(x), R2(-2.5 - r() * 3), R2(r() * 360), R2(0.95 + r() * 0.35), R2(4.3 + r() * 0.4));
for (let x = 3; x < 64; x += 7 + r() * 3) { if (x > 6 && x < 22) continue; P('mn_cedar', R2(x), R2(1.4 + r() * 1.2), R2(r() * 360), R2(0.8 + r() * 0.25)); }
// momiji accents on the terraces (Minoh's autumn), mossy rocks, ferns
for (const [x, z, k, s] of [[44, 3.4, 'red', 1.05], [27.5, 2.8, 'orange', 0.9], [58, 3.0, 'red', 0.95], [36, 2.2, 'gold', 0.8], [66.5, 4.2, 'red', 0.85], [3, 3.2, 'orange', 0.85]]) P('mn_maple_' + k, x, z, R2(r() * 40 - 20), s);
for (let x = 1.5; x < 95; x += 3 + r() * 3) { if (x > 6 && x < 23) continue; if (x > 77 && x < 94) continue; P(r() < 0.6 ? 'mn_fern' : 'rock_m', R2(x), R2(4.3 + r() * 0.9), R2(r() * 360), R2(1.2 + r() * 0.6)); }
for (let x = 2; x < 96; x += 5 + r() * 4) { if (x > 6 && x < 23) continue; if (x > 77 && x < 94) continue; P(r() < 0.5 ? 'rock_l' : 'mn_fern', R2(x), R2(2.2 + r() * 1.5), R2(r() * 360), R2(0.8 + r() * 0.5)); }

// -- trailhead: gate, cabin, camp, warnings
P('mn_safari_gate', 7.2, 8.6, 0, 1);
P('mn_ranger_cabin', 14.6, 3.2, 0, 1);
P('safari_jeep', 3.6, 4.4, 90, 1);
P('mn_trailmap', 9.6, 7.2, 0, 1);
P('noticeboard', 20.4, 7.4, 0, 1);
P('tent', 23, 3.4, 200, 1.05); P('campfire', 19.2, 14.6, 0, 1); P('log', 19.2, 16.1, 0, 0.6); P('stump', 17.4, 15.2, 0, 0.75);
P('crate', 22.4, 15.6, 15, 0.9); P('crate', 23.2, 16.1, 40, 0.75); P('barrel', 21.6, 16.4, 0, 0.9);
P('binoculars', 5.2, 15.8, 30, 1); P('signpost', 2.4, 8.4, 270, 1);
P('lantern_post', 11.6, 8.5, 0, 1); P('lantern_post', 3.4, 13.4, 0, 1);
P('mn_macaque_sit', 13.2, 2.0, 20, 1.1, 5.0);                 // on the cabin roof
// -- Autumn Leaves Tempura stall (+ a snatcher with a stolen bag, and the warning)
P('mn_tempura_stall', 26.2, 7.0, 0, 1);
P('noticeboard', 29.1, 7.4, 0, 0.75);
P('bench', 23.6, 8.0, 0, 1);
P('mn_macaque_snatch', 31.2, 8.0, 330, 1.1);
P('mn_rail', 29.6, 16.9, 0, 1); P('mn_macaque_sit', 29.0, 16.9, 0, 1.1, 1.0);
// -- riverside walk
for (const x of [36, 47, 58, 68.5]) P('lantern_post', x, 8.4, 0, 1);
for (const x of [38.5, 41.0, 49.5, 52]) P('mn_rail', x, 16.9, 0, 1);
P('bench_stone', 40.6, 8.0, 0, 1);
P('stone_lantern', 38.6, 6.8, 0, 0.95); P('stone_lantern', 49.4, 6.8, 0, 0.95);  // clearing rim (destructible)
P('log', 61.6, 7.4, 10, 0.9); P('stump', 34.2, 7.2, 0, 0.9);
P('mn_marker', 44, 7.2, 0, 1);
// cover: sasa / tall grass patches (match safari.grass)
const cover = (id, x0, z0, w, d, n, s0 = 1.05) => { for (let i = 0; i < n; i++) { const x = x0 + 0.5 + ((i * 0.618) % 1) * (w - 1), z = z0 + 0.5 + ((i * 0.382 + 0.17) % 1) * (d - 1); P(id, R2(x), R2(z), R2(r() * 360), R2(s0 + r() * 0.25)); } };
cover('mn_sasa', 29, 13.2, 6, 3.4, 9);
cover('mn_sasa', 51, 5.6, 6, 2.8, 7, 1.1);
cover('tallgrass', 55, 13.2, 5, 3.4, 9, 1.25);
cover('tallgrass', 62, 6, 5, 3, 7, 1.25); P('mn_fern', 63, 6.6, 0, 1.6); P('mn_fern', 66.2, 8.2, 90, 1.4);
cover('mn_sasa', 93.5, 13, 4, 3.4, 6, 1.1);
// -- stream junction (Kappachi shallows) + footbridge
P('mn_footbridge', 77, 10.6, 0, 1, 0.12);
P('mn_stepstones', 68.4, 16.2, 30, 1, -0.2); P('mn_stepstones', 34, 18.4, 0, 1, -0.2);
for (const [x, z] of [[64.2, 17.4], [71.6, 13.2], [73.6, 16.8], [26.6, 17.4], [45.5, 18.2], [12, 17.6], [60, 18.0]]) P('reeds', x, z, R2(r() * 360), R2(1 + r() * 0.3));
for (const [x, z] of [[67.5, 18.4], [24, 19.4], [52, 19.0]]) P('lilypad', x, z, R2(r() * 360), 0.9, -0.3);
P('mn_mist', 70.5, 14.5); P('mn_mist', 75.5, 12.8);
// -- the falls basin: deck, bench, viewer, mist, rim rocks
P('mn_rail', 83.2, 8.25, 0, 1, 0.25); P('mn_rail', 89.2, 8.25, 0, 1, 0.25);
P('bench', 86, 12.6, 180, 1); P('binoculars', 90.6, 9.2, 200, 1);
P('lantern_post', 81.2, 12.6, 0, 1); P('lantern_post', 92.2, 12.6, 0, 1);
P('mn_mist', 83, 6.4); P('mn_mist', 88.6, 6.6); P('mn_mist', 86, 5.2);
for (const [x, z, s] of [[79.4, 7.4, 0.9], [92.8, 7.2, 1.0], [93.6, 4.0, 1.2], [78.6, 2.6, 1.0]]) P('rock_l', x, z, R2(r() * 360), s, -0.2);
P('mn_maple_red', 94.4, 2.6, 15, 0.8, 1.2);                   // momiji framing the falls
P('mn_maple_orange', 77.6, 1.4, 200, 0.75, 1.0);
P('mn_fern', 79, 4.2, 0, 1.4); P('mn_fern', 78.6, 6.2, 60, 1.2);
// -- stone steps to the Bamboo Trail
for (const x of [97, 99.5, 102]) P('mn_rail', x, 13.3, 0, 1);
P('signpost', 101, 7.4, 90, 1); P('stone_lantern', 97.6, 6.8, 0, 0.9);
// -- front: river bank, boulders, dark framing trunks (Muramasa), overhead maple branches
for (const x of [9, 37, 63, 100]) P('mn_trunk', x, 23.2, R2(r() * 30), R2(1 + r() * 0.15));
P('mn_maple_branch', 30, 22.6, 0, 1.1, 6.4); P('mn_maple_branch', 82, 22.8, 180, 1.0, 6.8);
for (let x = 2; x < 70; x += 3.5 + r() * 3) P(r() < 0.55 ? 'mn_fern' : 'reeds', R2(x), R2(22.6 + r() * 1.1), R2(r() * 360), R2(1.2 + r() * 0.5));
for (const [x, z, s] of [[74, 20, 1.2], [80, 21.6, 1.4], [88.5, 20.8, 1.1], [95, 22, 1.3], [102.5, 20.2, 1.0]]) P('rock_l', x, z, R2(r() * 360), s);
for (const [x, z] of [[77, 18.6], [84.6, 19.2], [91.5, 18.6], [98, 18.8], [76, 22.8], [90, 23]]) P('mn_fern', x, z, R2(r() * 360), 1.5);
for (const [x, z] of [[86.5, 17.2], [96, 16.8]]) P('rock_m', x, z, R2(r() * 360), 1.0);

export default {
  id: 'minoh_waterfall', name: 'Minoh — Waterfall Trail', area: 'Minoh Safari Reserve', size: [W, D], base: 'G', view: 'side',
  cam: { pitch: 0.2, fov: 26, dist: 24, minDist: 13, maxDist: 32, lookY: 1.8, z: 11.5 },
  backdrop: [
    { kind: 'trees', z: -26, height: 15, y0: 2, color: '#2a4a3e', color2: '#3d6052', seed: 4 },
    { kind: 'hills', z: -48, height: 22, y0: 0, color: '#4f7468', color2: '#7f9e96', seed: 6 },
    { kind: 'mountains', z: -85, height: 38, y0: 0, color: '#8aa6a8', color2: '#b8ccd0', seed: 2 },
  ],
  ops, heights, props,
  panels: [
    { x: 7.2, y: 2.375, z: 8.68, w: 3.3, h: 0.7, kind: 'calligraphy', title: '箕面サファリ保護区', lines: ['MINOH SAFARI RESERVE'], bg: '#5a3b25', fg: '#ffe9b0', accent: '#ffd27a' },
    { x: 26.2, y: 3.15, z: 7.3, w: 2.8, h: 0.55, kind: 'sign', title: 'もみじ天ぷら', lines: ['AUTUMN LEAVES TEMPURA'], bg: '#3a2618', fg: '#ffe9b0', accent: '#ff8a3c' },
    { x: 29.1, y: 1.12, z: 7.72, w: 1.15, h: 0.85, kind: 'menu', title: 'お品書き MENU', lines: ['Momiji Tempura ¥400', 'Yuzu Cider     ¥350'] },
    { x: 20.0, y: 1.42, z: 7.72, w: 0.78, h: 0.95, kind: 'poster', title: '野獣注意', lines: ['BEWARE:', 'RIFT BOAR', '& ONI BEAR'], bg: '#ffe45c', fg: '#2a1a12', accent: '#e2482e' },
    { x: 20.85, y: 1.42, z: 7.72, w: 0.78, h: 0.95, kind: 'poster', title: 'サルに注意', lines: ["DON'T FEED", 'THE', 'MONKEYS!'], bg: '#f4e9d2', fg: '#2a1a12', accent: '#3d8d89' },
  ],
  points: {
    entrance: [4.5, 11.2, 90],
    ranger: [16.6, 8.4, 0],
    camp: [18.4, 13.4, 135],
    stall: [26.2, 9.2, 180],
    clearing: [44, 11.6],
    bridge: [77, 10.6, 90],
    junction: [69.2, 14.2],
    trail_end: [82.8, 10.6, 180],
    falls_view: [86.4, 10.4, 180],
    steps: [99.5, 10.2, 90],
    from_bamboo: [101.6, 10.4, 270],
  },
  npcs: [
    { id: 'ranger', char: 'ranger', x: 16.6, z: 8.4, face: 0, idle: 'think', wander: 1.2, talk: 'ranger' },
    { id: 'hiker', char: { random: 5, role: 'tourist' }, x: 88.6, z: 10.6, face: 180, idle: 'point', wander: 1.5 },
  ],
  spawns: {
    start: [4.5, 11.2, 90],
    fromWorldmap: [4.5, 11.2, 90],
    entrance: [4.5, 11.2, 90],
    from_bamboo: [101.6, 10.4, 270],
  },
  exits: [
    { x: 0, z: 7, w: 1, d: 10, to: 'worldmap', spawn: 'minoh_waterfall', label: 'Leave the reserve' },
    { x: 103, z: 7, w: 1, d: 6, to: 'minoh_bamboo', spawn: 'from_waterfall', label: 'Bamboo Trail' },
  ],
  hotspots: [
    { id: 'stall', x: 26.2, z: 7.4, y: 1.3, r: 1.1, kind: 'order', label: 'Momiji Tempura', approach: [26.2, 9.2], face: 180, menu: 'minoh' },
  ],
  zooms: {
    stall: { from: [26.2, 1.55, 10.4], look: [26.2, 1.45, 6.6], fov: 46, kind: 'order' },
    falls: { from: [86.4, 2.2, 15.5], look: [86, 7.5, 2], fov: 50, kind: 'look' },
  },
  arenas: { clearing: { x: 44, z: 11.6, r: 6 } },
  zones: { pool: [78, 2, 16, 10], camp: [14, 12, 12, 6] },
  lights: [
    { pos: [86, 1.4, 5.2], color: '#8fe8ff', intensity: 2.6, range: 10 },
    { pos: [86, 8, 3.6], color: '#bff4ff', intensity: 1.6, range: 10 },
    { pos: [70, 0.8, 15.5], color: '#8fe8ff', intensity: 1.2, range: 7 },
  ],
  ambience: { particles: 'mist', music: 'safari', sound: 'safari' },
  water: { deep: '#126a86', shallow: '#47c9c4', neon: '#9dffe8' },
  safari: {
    grass: [[29, 13.2, 6, 3.4], [51, 5.6, 6, 2.8], [55, 13.2, 5, 3.4], [62, 6, 5, 3], [93.5, 13, 4, 3.4]],
    spawns: [
      { species: 'lemmo', x: 32, z: 14.8, r: 2.6, level: [7, 11], weight: 4 },
      { species: 'lemmo', x: 57.5, z: 14.8, r: 2.4, level: [7, 11], weight: 4 },
      { species: 'lemmo', x: 64.5, z: 7.5, r: 2.2, level: [8, 12], weight: 3 },
      { species: 'kappachi', x: 34, z: 17.6, r: 2.6, level: [8, 12], weight: 3 },
      { species: 'kappachi', x: 69.6, z: 15.4, r: 2.2, level: [8, 12], weight: 3 },
      { species: 'kappachi', x: 85, z: 7.6, r: 1.5, level: [9, 12], weight: 1 },
      { species: 'cabbunny', x: 54, z: 7, r: 2.6, level: [7, 10], weight: 3 },
      { species: 'cabbunny', x: 95.5, z: 14.6, r: 2, level: [7, 10], weight: 2 },
      { species: 'hotarumi', x: 85.5, z: 11.5, r: 3, level: [10, 13], weight: 1, hours: [18, 22], rare: true },
      { species: 'rollingstone', x: 88, z: 16, r: 2.2, level: [9, 13], weight: 1, rare: true },
    ],
    beasts: [
      { species: 'rift_boar', path: [[32, 10.6], [40, 12.6], [50, 10.2], [60, 11.6], [68, 9.8], [58, 13.4], [45, 9.6]], speed: 2.2 },
    ],
    fragments: [[79, 4.6]],
  },
};
