// Kishiwada countryside farm at dawn — prologue cinematic only.
// Layout (x → east, z → south): treeline along the north edge, red barn +
// silo + farmhouse + kura on the west, fenced pasture in the middle, open dirt
// farmyard below it, corn (west) and cabbage (east) fields on the south side,
// a shallow stream with a plank crossing and the windmill on the east.
// Cinematic beat: the fire wolf bursts out of the treeline, leaps the
// pasture's north fence, cuts through the herd, out through the open south
// gate and skids to a halt in the farmyard in front of the farmer.
// Facing convention for points: degrees, 0 = facing south (+z), 90 = east,
// 180 = north, 270 = west (same as prop rotation / actor yaw).

// --- small layout helpers (deterministic) -----------------------------------
const jit = (i, k) => (((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1) + 1) % 1; // 0..1
// fence line from (x0,z) to (x1,z) or (x,z0)→(x,z1) in 2 m segments, skipping centres listed in `gaps`
function fenceX(z, x0, x1, gaps = []) { const out = []; for (let x = x0 + 1; x < x1; x += 2) if (!gaps.includes(x)) out.push(['fence_farm', x, z, 0]); return out; }
function fenceZ(x, z0, z1, gaps = []) { const out = []; for (let z = z0 + 1; z < z1; z += 2) if (!gaps.includes(z)) out.push(['fence_farm', x, z, 90]); return out; }
// crop rows: rows along x, 2 m props, `skip` = list of [x,z] centres to leave out
function crops(id, xs, zs, skip = []) { const out = []; for (const z of zs) for (const x of xs) if (!skip.some(([a, b]) => a === x && b === z)) out.push([id, x, z, 0]); return out; }

// treeline: three staggered rows of pines / maples with bushes in front, leaving the stream bed clear
const treeline = [];
{
  const rows = [[0.5, 0], [2.2, 1.1], [3.9, 0.4]];
  rows.forEach(([z, off], r) => {
    for (let x = 0.8 + off; x < 40; x += 2.3 + jit(x, r) * 0.6) {
      if (x > 30.6 && x < 34.4) continue;          // stream gap
      if (r === 2 && x > 23.5 && x < 26.8) continue; // the wolf's burst-through gap
      const id = (jit(x, r + 7) < 0.62) ? 'pine' : 'maple';
      treeline.push([id, +x.toFixed(1), +(z + (jit(x, r + 3) - 0.5) * 0.6).toFixed(1), Math.round(jit(x, r + 5) * 360), +((r === 0 ? 1.35 : r === 1 ? 1.15 : 0.95) + jit(x, r + 9) * 0.3).toFixed(2)]);
    }
  });
}

export default {
  id: 'farm', name: 'Kishiwada Farm', area: 'Kishiwada, Osaka Pref.', size: [40, 32], base: 'g',
  ops: [
    // north woods floor + meadow strip
    ['rect', 0, 0, 40, 6, 'G'], ['scatter', 0, 0, 40, 7, 'L', 0.3, 3], ['scatter', 0, 5, 40, 4, 'f', 0.18, 5],
    // pasture grass variation
    ['scatter', 13, 9, 16, 8, 'G', 0.28, 7], ['scatter', 13, 9, 16, 8, 'f', 0.06, 8],
    // farmyard (dirt) + lanes
    ['rect', 3, 16, 28, 2, 'd'], ['rect', 8, 18, 23, 5, 'd'], ['scatter', 26, 21, 6, 2, 'g', 0.35, 11], ['scatter', 8, 22, 6, 1, 'g', 0.4, 12],
    ['line', [[20.5, 32], [20.5, 22]], 2.2, 'd'],                 // south lane
    ['line', [[11.8, 16], [11.8, 6.5]], 2, 'd'],                  // lane up between barn and pen
    ['line', [[30, 20.5], [39.5, 20.5]], 2, 'd'],                 // east lane to the windmill side
    ['line', [[37, 20], [37, 9.5]], 1.6, 'd'],
    // fields
    ['rect', 10, 24, 9, 8, 'F'], ['rect', 23, 24, 9, 8, 'F'], ['rect', 35, 23, 5, 9, 'F'],
    ['rect', 9, 23, 10, 1, 'g'], ['rect', 22, 23, 10, 1, 'g'],
    // stream (shallow, walkable) with a plank crossing
    ['line', [[31.5, -1], [32.4, 5], [34.4, 11], [33, 17], [33.4, 24], [35.2, 33]], 2.2, ','],
    ['rect', 32, 19, 3, 3, 'o'],
    // garden patch by the farmhouse
    ['rect', 1, 26, 1, 5, 'f'],
  ],
  heights: [
    // the woods sit on a gentle rise
    ['rect', 0, 0, 40, 2, 0.8], ['rect', 0, 2, 40, 2, 0.45], ['rect', 0, 4, 40, 1, 0.2],
  ],
  buildings: [
    // minka farmhouse — door to the farmyard (east)
    { x: 1, z: 18, w: 7, d: 6, floors: 2, style: 'machiya', front: 'e', fronts: ['e', 's'], roof: 'tile', ground: 'shoji', clutter: false },
    // white kura storehouse
    { x: 2, z: 26, w: 4, d: 4, floors: 2, style: 'kura', front: 'e', roof: 'tile', clutter: false },
  ],
  props: [
    // --- big farm pieces
    ['barn', 7.5, 12, 0],
    ['silo', 2.4, 10.5, 0], ['silo', 2.2, 14.6, 0, 0.8],
    ['windmill', 37.2, 7.4, 225],
    ['tractor', 12, 21.6, 165],
    ['scarecrow', 27, 27.7, 20], ['scarecrow', 14, 28.3, -15],

    // --- north treeline + undergrowth
    ...treeline,
    ['bush', 3.5, 5.6], ['bush', 9.2, 5.8], ['bush', 15.6, 5.5], ['bush', 21.2, 5.6], ['bush', 28.6, 5.7], ['bush', 36, 4.8],
    ['tallgrass', 25.2, 5.5], ['tallgrass', 23.8, 6.2], ['tallgrass', 26.8, 6.1],   // the burst-through gap
    ['log', 18.4, 6.4, 12], ['stump', 29.6, 6.6], ['mushrooms', 19.9, 4.6], ['mushrooms', 6.3, 4.4], ['rock_m', 12.7, 5.6, 30],

    // --- pasture pen (x 13–29, z 9–17), wide gate on the south side
    ...fenceX(9, 13, 29), ...fenceX(17, 13, 29, [20, 22]), ...fenceZ(13, 9, 17), ...fenceZ(29, 9, 17),
    ['fence_farm', 19.4, 18.1, 62],                                 // gate swung open
    ['trough', 15.2, 14.8, 90], ['trough', 26.8, 15.6, 0],
    ['haystack', 26.6, 11.2, 20], ['haystack', 16, 10.8, -10], ['tallgrass', 18.2, 13.4], ['tallgrass', 24.5, 12.4],

    // --- farmyard dressing
    ['haystack', 10.8, 7.4, 0], ['haystack', 12.6, 7.6, 70, 0.9], ['haystack', 4.6, 16.8, 15],
    ['crate', 10.9, 16.6], ['crate', 11, 17.6, 25], ['barrel', 3.4, 17], ['barrel', 9.9, 17.4],
    ['trough', 5.4, 25, 0], ['lantern_post', 8.6, 19.4], ['lantern_post', 8.6, 23.4], ['bicycle', 8.7, 21.4, 10],
    ['signpost', 22, 23.4, 30], ['noticeboard', 23.9, 18.4, 0],
    ['solar_panel', 7, 29.6, 0], ['solar_panel', 7, 27.8, 0],
    ['drone', 27.5, 25.4, 30, 1, 2.6],                               // 2050: crop-scanning drone hovering over the cabbages
    ['flowerbed', 1.6, 28.3, 90], ['sakura3', 0.9, 25.2],

    // --- fields
    ...crops('corn_row', [11, 13, 15, 17], [25, 26.6, 28.2, 29.8, 31.2], [[13, 28.2], [15, 28.2]]),
    ...crops('cabbage_row', [24, 26, 28, 30], [24.7, 26.2, 27.7, 29.2, 30.7], [[26, 27.7], [28, 27.7]]),
    ...crops('corn_row', [36.5, 38.5], [24, 25.6, 27.2, 28.8, 30.4]),

    // --- stream banks + east side
    ['reeds', 31.2, 2.9], ['reeds', 34.6, 8.4], ['reeds', 35.9, 12.6], ['reeds', 31.6, 14.8], ['reeds', 31.8, 25.4], ['reeds', 35.1, 28.4], ['reeds', 34.9, 16.6],
    ['rock_s', 33.6, 4.8], ['rock_m', 35.9, 10.2, 40], ['rock_s', 31.6, 17.6], ['rock_s', 32.4, 27.6],
    ['lilypad', 33.2, 22.6, 0, 0.7, -0.05],
    ['maple', 38.6, 14.6, 30, 1.1], ['haystack', 36.6, 17.6, -20], ['log', 38.4, 11.2, 80], ['stump', 35.6, 14.4],
    ['fence_farm', 31, 23.4, 0], ['fence_farm', 37, 22.2, 0], ['fence_farm', 39, 22.2, 0],
    // country lane fences between the two fields
    ...fenceZ(19, 24, 32, [29]), ...fenceZ(22.2, 24, 32),
    ['log', 27.4, 18.7, 0, 0.8], ['log', 27.7, 19.4, 8, 0.8], ['crate', 24.6, 22.4, 15], ['barrel', 25.5, 22.6],
    ['flowerbed', 8.7, 17.2, 0], ['maple', 0.9, 16.6, 40, 0.9], ['bush', 0.9, 31, 0, 0.8],
  ],
  points: {
    treeline: [25.2, 4.6, 0],       // fire wolf bursts out here (facing south)
    fence_jump: [25, 9, 343],       // the north pasture fence it clears (heading for the farmyard)
    pasture: [21, 13],              // centre of the pen — the herd grazes here
    wolf_stop: [21.6, 20.4, 262],   // open farmyard spot where it skids to a halt, facing the farmer
    farmer: [15.8, 19.6, 82],       // farmer in the farmyard, facing the wolf
    field: [28.6, 27.7],              // cabbage field centre
    cam_wide: [20, 16],             // frame the whole farm from here
  },
  spawns: { start: [20.5, 29.5, 180] },
  lights: [
    { pos: [7.5, 4.5, 16.2], color: '#ffc27a', intensity: 3, range: 7 },   // lamp over the barn door
    { pos: [8.6, 2.2, 21], color: '#ffb066', intensity: 2, range: 6 },     // farmhouse porch
  ],
  water: { deep: '#2f86b8', shallow: '#7fd6e8' },
  ambience: { particles: 'leaves', music: 'farm', sound: 'farm' },
};
