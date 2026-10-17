// Umeda — futuristic business district, home of the Elemon League (Kansai).
// Layout (x → east, z → south):
//   NW        Umeda Sky twin towers rising out of a garden (pond, pines, maples)
//   N centre  Elemon League HQ tower, forecourt + monument sign
//   centre    League stage: raised metal platform with a blue court circle (arena r 7),
//             holo billboards, light posts, crowd barriers, camera drones
//   NE        Umeda Food Hall with the red Ferris wheel on its roof; outdoor tables
//   east      Grand Front tower + drop-off road (N–S) meeting the main road
//   south     main road (E–W) with crosswalks, hovercar traffic, bus stop; arrival strip
// Facing convention for points / npcs: degrees, 0 = facing south (+z), 90 = east,
// 180 = north, 270 = west (same as prop rotation).

const SX = 27.5, SZ = 23.5;   // stage / arena centre
const lamps = (z, xs) => xs.map((x) => ['streetlamp', x, z]);

export default {
  id: 'umeda', name: 'Umeda', area: 'Kita Ward, Osaka', size: [52, 44], base: 'P',
  ops: [
    // Umeda Sky garden (NW)
    ['rect', 0, 0, 19, 32, 'g'], ['scatter', 0, 0, 19, 32, 'G', 0.25, 5], ['scatter', 0, 10, 19, 22, 'f', 0.06, 6],
    ['rect', 0, 0, 20, 2, 'p'],                                               // service path behind the towers
    ['line', [[19.5, 21], [14, 19], [10.5, 14], [10.5, 9.5]], 2.2, 'p'],      // garden walk to the tower base
    ['line', [[19.5, 28], [12, 27.5], [5, 25], [3.5, 18], [6.5, 10]], 1.6, 'p'],
    ['rect', 3, 9, 15, 2, 'p'],                                              // tower forecourt
    ['circle', 9, 21.5, 3.2, '~'],                                           // koi pond
    // HQ forecourt + stage platform
    ['rect', 19, 11, 17, 5, 'P'], ['rect', 26, 11, 3, 1, 't'],
    ['rect', 20, 16, 15, 15, 'T'], ['circle', SX, SZ, 7.3, 'C'], ['circle', SX, SZ, 1.5, 'T'],
    // planters along the plaza
    ['rect', 36, 30, 2, 1, 'G'], ['rect', 41, 30, 2, 1, 'G'], ['rect', 36, 13, 2, 1, 'G'], ['rect', 43, 13, 2, 1, 'G'],
    // sidewalks + main road (E–W) + crosswalk
    ['rect', 0, 32, 52, 2, 'w'], ['rect', 25, 33, 5, 1, 't'],
    ['rect', 0, 34, 52, 5, 'a'], ['rect', 0, 36, 52, 1, '='], ['rect', 0, 34, 52, 1, 'e'], ['rect', 0, 38, 52, 1, 'e', 2],
    ['rect', 0, 39, 52, 2, 'w'], ['rect', 25, 39, 5, 1, 't'],
    ['rect', 0, 41, 52, 3, 'P'],
    ['rect', 25, 34, 5, 5, 'x'],
    // drop-off road (N–S) on the east, turning circle in front of Grand Front
    ['rect', 46, 11, 6, 23, 'a'], ['rect', 49, 13, 1, 21, '=', 1], ['rect', 46, 11, 6, 2, 'a'],
    ['rect', 45, 11, 1, 23, 'w'], ['rect', 46, 28, 6, 3, 'x', 1],
  ],
  heights: [
    ['rect', 20, 16, 15, 15, 0.3],             // the League stage platform (one easy step up)
  ],
  buildings: [
    // Elemon League HQ: glass podium + stepped tower on top
    { x: 19, z: 0, w: 17, d: 11, floors: 2, style: 'office', front: 's', fronts: ['s', 'e'], color: '#dce8fa', ground: 'glass', clutter: false,
      signs: [{ text: 'ELEMON LEAGUE KANSAI', color: '#ffe45c', side: 's', y: 4.7, scale: 0.5 },
        { text: 'RECEPTION', color: '#9fd8ff', side: 's', y: 2.6, scale: 0.26, at: 0.62 },
        { text: 'LEAGUE HQ', color: '#3ff0ff', side: 'e', y: 4.4, scale: 0.42 }] },
    { x: 21, z: 0, w: 12, d: 8, floors: 8, style: 'tower', y: 6, front: 's', fronts: ['s', 'e'], color: '#e4eeff',
      signs: [{ text: 'エレモンリーグ', color: '#3ff0ff', vertical: true, side: 's', at: 0.04, y: 9 },
        { text: 'ELEMON\nLEAGUE', color: '#ffe45c', side: 's', y: 19.5, scale: 0.55 }, { text: 'ELK', color: '#ff5ac8', side: 'e', y: 19, scale: 0.7 }] },
    // Umeda Food Hall (Ferris wheel on the roof)
    { x: 36, z: 1, w: 10, d: 11, floors: 3, style: 'shop', front: 's', fronts: ['s', 'e'], color: '#fff0dc', ground: 'shop',
      signs: [{ text: 'UMEDA FOOD HALL', color: '#ff8a3c', side: 's', y: 7.4, scale: 0.46 },
        { text: 'RAMEN', color: '#ffe23a', side: 's', at: 0.14, y: 3.3, scale: 0.3 }, { text: 'SUSHI', color: '#5ae0ff', side: 's', at: 0.38, y: 3.3, scale: 0.3 },
        { text: 'CURRY', color: '#ffb03a', side: 's', at: 0.62, y: 3.3, scale: 0.3 }, { text: 'CRÊPE', color: '#ff8ad8', side: 's', at: 0.86, y: 3.3, scale: 0.3 },
        { text: 'フードホール', color: '#5dff9a', vertical: true, side: 's', at: 0.98, scale: 0.7 },
        { text: 'FOOD HALL\n美食街', color: '#ff5ac8', side: 'e', y: 5.5, scale: 0.42 }] },
    // Grand Front tower (NE)
    { x: 46, z: 0, w: 6, d: 10, floors: 13, style: 'office', front: 's', fronts: ['s', 'w'], color: '#dfe9f6',
      signs: [{ text: 'GRAND FRONT 2050', color: '#9fd8ff', side: 's', y: 33, scale: 0.34 }, { text: 'ホテル', color: '#ff5ac8', vertical: true, side: 's', at: 0.92, y: 20 }] },
    // metro entrance on the arrival strip
    { x: 3, z: 41, w: 5, d: 3, floors: 1, style: 'office', front: 'e', fronts: ['e', 's'], color: '#d8e4f0', clutter: false,
      signs: [{ text: '梅田駅', color: '#5ae0ff', vertical: true, side: 'e', at: 0.2, scale: 0.55, y: 1.9 }, { text: 'METRO', color: '#ffe45c', side: 's', y: 2.3, scale: 0.4 }] },
    // garden pavilion café under the Sky Building
    { x: 1, z: 12, w: 4, d: 4, floors: 1, style: 'tile', front: 'e', fronts: ['e', 's'], roof: 'green', clutter: false,
      sign: { text: 'SKY CAFÉ', color: '#5dff9a', side: 'e', y: 2.4, scale: 0.34 } },
  ],
  props: [
    // ---- landmarks
    ['umeda_sky', 10.5, 5, 0],
    ['ferris_wheel', 41, 6.5, 0, 0.95, 9.4],                   // on the food-hall roof (HEP-style)
    ['league_hq_sign', 18.6, 13.8, 0],

    // ---- HQ forecourt
    ['flowerbed', 23, 11.6, 0], ['flowerbed', 32, 11.6, 0], ['vending', 35.4, 13.2, 270], ['noticeboard', 34.2, 15.2, 0],
    ['holo_billboard', 32.8, 13.6, 0, 0.8],

    // ---- League stage dressing (destructible, outside the court circle)
    ['holo_billboard', 19.6, 20.6, 90], ['holo_billboard', 33.6, 17.2, 316], ['holo_billboard', 21.4, 29.8, 136], ['holo_billboard', 33.6, 29.8, 45],
    ['streetlamp', 19.5, 23.5], ['streetlamp', 35.5, 23.5], ['streetlamp', 24.5, 16.5], ['streetlamp', 30.5, 16.5],
    ['barrier', 21.6, 31.4, 0], ['barrier', 23.6, 31.4, 0], ['barrier', 31.4, 31.4, 0], ['barrier', 33.4, 31.4, 0],
    ['cone', 25.3, 31.3], ['cone', 29.7, 31.3],
    ['drone', 24, 20, 30, 1, 6], ['drone', 31.5, 26.5, 220, 1, 6.6], ['drone', 27.5, 15.5, 0, 1, 7.4],

    // ---- food-hall terrace: picnic benches, food stalls, planters
    ['bench', 38.6, 18.2, 0], ['bench', 38.6, 19.8, 180], ['bench', 42.8, 18.2, 0], ['bench', 42.8, 19.8, 180],
    ['bench', 38.6, 23.6, 0], ['bench', 38.6, 25.2, 180], ['bench', 42.8, 23.6, 0], ['bench', 42.8, 25.2, 180],
    ['crate', 38.2, 19, 0, 0.85], ['crate', 39, 19, 0, 0.85], ['crate', 42.4, 19, 0, 0.85], ['crate', 43.2, 19, 0, 0.85],
    ['crate', 38.2, 24.4, 0, 0.85], ['crate', 39, 24.4, 0, 0.85], ['crate', 42.4, 24.4, 0, 0.85], ['crate', 43.2, 24.4, 0, 0.85],
    ['yatai_takoyaki', 37.6, 14.6, 0], ['icecream_stand', 43.6, 14.8, 0], ['ramen_stall', 40.8, 29, 180],
    ['trashbins', 44.6, 21.8, 90], ['vending', 44.6, 27, 270], ['vending', 44.6, 28.2, 270],
    ['maple', 37, 30.5, 0, 0.9], ['maple', 42, 30.5, 90, 0.9], ['sakura3', 37, 13.5], ['sakura3', 44, 13.5, 120],
    ['lantern_string', 40.7, 16.6, 0], ['lantern_string', 40.7, 27, 0],

    // ---- Umeda Sky garden
    ['waterfall_rock', 9, 18.4, 0], ['reeds', 6.2, 22.6], ['reeds', 11.8, 23.4], ['lilypad', 8.2, 22.4, 0, 1, -0.4], ['lilypad', 10.4, 21.6, 60, 0.8, -0.4],
    ['pine', 1.6, 3.2, 0, 1.1], ['pine', 18.4, 2.6, 80], ['bamboo', 0.8, 8.2], ['bamboo', 18.6, 9.2], ['maple', 16.4, 12.6, 30],
    ['pine', 1.4, 27.4, 200, 1.1], ['maple', 3.2, 30.6, 90], ['sakura3', 15.6, 30.4], ['maple', 13.6, 24.2, 10, 0.9], ['pine', 17.6, 16.6, 140, 0.9],
    ['bush', 6, 13.6], ['bush', 19.4, 18.6], ['bush', 19.4, 28.6], ['flowerbed', 19.4, 21, 90], ['flowerbed', 19.4, 26, 90], ['bush', 14.2, 16.2], ['bush', 1.2, 21], ['bush', 18.2, 25.2], ['rock_m', 12.6, 20.6, 40], ['rock_s', 5.8, 19.4],
    ['bench_stone', 9, 25.8, 180], ['bench', 4.4, 16.2, 90], ['bench', 13.4, 26.6, 180], ['stone_lantern', 12.8, 18.4], ['stone_lantern', 5.2, 24.6],
    ['streetlamp', 12.5, 12.5], ['streetlamp', 7.5, 26.5], ['streetlamp', 16.5, 20.5], ['signpost', 19, 25.4, 300],

    // ---- sidewalks
    ...lamps(32.4, [3.5, 9.5, 15.5, 39.5, 44.5]), ...lamps(40.6, [3.5, 9.5, 15.5, 21.5, 33.5, 39.5, 45.5]),
    ['bus_stop', 12, 32.7, 0], ['traffic_light', 24.4, 32.4], ['traffic_light', 30.6, 32.4], ['traffic_light', 24.4, 39.6, 180], ['traffic_light', 30.6, 39.6, 180],
    ['traffic_light', 45.4, 27.6, 270], ['traffic_light', 45.4, 31.4, 270],
    ['bicycle', 19.2, 40.6, 90], ['bicycle', 19.9, 40.8, 90], ['scooter', 35.4, 40.6, 270],
    ['trashbins', 6.6, 32.6, 0], ['vending', 17.6, 32.5, 0], ['vending', 41.6, 32.5, 0],
    ['cone', 45.6, 40.6], 
    ['flowerbed', 1.2, 42.4, 90], ['flowerbed', 50.4, 41.6, 0], ['maple', 10.6, 42.4, 0, 0.85], ['maple', 47.6, 42.4, 60, 0.85],
    ['noticeboard', 24.8, 42.6, 0], ['holo_billboard', 36.6, 42.4, 0], ['signpost', 31, 41.6, 160],

    // ---- traffic (hovercars) on the main road + drop-off road
    ['hovercar', 7.5, 35.2, 90], ['hovercar', 16.5, 37.6, 270], ['hovercar', 38.5, 35.2, 90], ['hovercar', 47.8, 18, 180], ['hovercar', 50.4, 24.4, 0],
    ['hovercar', 50.2, 12.2, 90],
    ['drone', 14, 34, 90, 1, 7], ['drone', 44, 8, 200, 1, 13],
  ],
  points: {
    arrive: [27.5, 42, 180],          // spawn on the arrival strip, facing the crosswalk
    reception: [27.5, 12.4, 180],     // in front of the HQ doors
    receptionist: [29.6, 11.6, 0],    // receptionist at the entrance
    stage: [SX, SZ],
    opponent: [SX, 15.2, 0],          // League opponent steps out of HQ, north of the stage
    foodhall: [41, 13.2, 180],        // food-hall entrance
    lunch_table: [40.7, 19, 270],     // walkway between the two picnic tables on the terrace (tables at x 38.6 / 42.8)
    plaza_view: [27.5, 32.6, 180],    // south edge of the plaza, framing HQ + stage
  },
  arenas: { stage: { x: SX, z: SZ, r: 7 } },
  npcs: [
    { id: 'receptionist', char: 'receptionist', x: 29.6, z: 11.6, face: 0, idle: 'bow', talk: 'league_reception' },
    { id: 'office_a', char: 'salaryman', x: 8.5, z: 32.8, face: 90, wander: 8, idle: 'think' },
    { id: 'office_b', char: { random: 23, role: 'office' }, x: 37.6, z: 40.4, face: 270, wander: 8 },
    { id: 'fan_a', char: { random: 8, role: 'student' }, x: 22.6, z: 32.2, face: 180, idle: 'cheer' },
    { id: 'fan_b', char: { random: 54, role: 'student_sailor' }, x: 32.4, z: 32.2, face: 180, idle: 'cheer' },
    { id: 'diner', char: { random: 44, role: 'shopper' }, x: 42.8, z: 21.8, face: 270, idle: 'eat' },
    { id: 'tourist', char: { random: 60, role: 'tourist' }, x: 7, z: 11, face: 180, wander: 4, idle: 'point' },
  ],
  spawns: { start: [27.5, 41.8, 180], fromWorldmap: [27.5, 41.8, 180] },
  exits: [{ x: 22, z: 43, w: 11, d: 1, to: 'worldmap', spawn: 'umeda', label: 'Osaka' }],
  lights: [
    { pos: [SX, 7, SZ], color: '#e8f6ff', intensity: 5, range: 14 },     // stage flood
    { pos: [27.5, 4, 12.5], color: '#ffe45c', intensity: 3, range: 8 },   // HQ entrance
  ],
  ambience: { particles: null, music: 'league', sound: 'city' },
};
