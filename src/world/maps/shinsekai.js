// Shinsekai — "New World", the retro district under Tsutenkaku (Naniwa Ward).
// Layout (x → east, z → south):
//   north     Tsutenkaku on its plaza at the head of the main street (tower_view looks up at it)
//   centre    Shinsekai Hondori (x 22–31) running south to the 新世界 gate + south road (arrival)
//   west row  kushikatsu restaurants facing the street/camera: Fugu Fighters (3D fugu lantern),
//             Fried Zeppelin, Guns N' Skewers, Deep Fried Purple (lucky statue outside)
//   east row  low shops with blade signs reaching into the street (Kushi Kiss, Ramones Ramen, pawn)
//   NW        Genryu dojo + sand training yard (arena `yard`)
//   SW        "Smoke on the Water" sentō with chimney + rotenburo garden (onsen relax spot)
//   NE        Smells Like Teen Spirit Arcade + forecourt
//   east      Janjan lane: Grillz & Thrillz (cosmetics) and Kansai Calling Supplies (goods)
//   SE        Team Metallica back lot behind Ride the Lightning Pachinko + Master of Puppets Pawn
//             (arena `alley`), entered by the narrow alley off Janjan lane or the broken south barricade
// Buildings south/east of walkable streets are kept 1 floor so the camera can see the street.
// Facing convention for points / npcs: degrees, 0 = facing south (+z), 90 = east, 180 = north, 270 = west.
export default {
  id: 'shinsekai', name: 'Shinsekai', area: 'Naniwa Ward', size: [52, 44], base: 'w',
  ops: [
    // tower plaza + ring of cobbles around Tsutenkaku
    ['rect', 16, 0, 21, 13, 'P'], ['ring', 26.5, 7, 4.4, 5.6, 'c'], ['rect', 16, 12, 21, 1, 'c'],
    // main street (Shinsekai Hondori): asphalt between sidewalks, cobble centre stripe
    ['rect', 23, 13, 7, 27, 'a'], ['rect', 26, 13, 1, 27, 'c'],
    // south road + crosswalk at the street mouth
    ['rect', 0, 41, 52, 3, 'a'], ['rect', 0, 41, 52, 1, 'e'], ['rect', 22, 41, 9, 3, 'x', 1],
    // arcade forecourt + Janjan lane (east)
    ['rect', 37, 10, 15, 3, 'P'], ['rect', 31, 20, 21, 4, 'c'],
    // dojo grounds: lawn, raked gravel apron, sand training yard, stone paths
    ['rect', 0, 0, 16, 11, 'g'], ['rect', 3, 10, 13, 1, 'r'], ['rect', 2, 11, 15, 13, 's'], ['rect', 0, 11, 2, 13, 'p'],
    ['rect', 0, 24, 22, 2, 'p'], ['scatter', 0, 0, 16, 10, 'M', 0.18, 4],
    // onsen (sentō) garden: moss, stepping path, raked gravel, rotenburo pool
    ['rect', 0, 26, 17, 14, 'M'], ['rect', 0, 32, 17, 1, 'p'], ['rect', 3, 34, 6, 4, '~'], ['rect', 10, 33, 6, 3, 'r'],
    ['line', [[8, 33], [10.5, 36.5], [13.5, 38.5], [16.5, 39.5]], 1.4, 'p'], ['rect', 16, 32, 1, 8, 'p'],
    // Team Metallica back lot: cracked asphalt, grates, grime
    ['rect', 37, 28, 15, 12, 'a'], ['rect', 48, 24, 2, 4, 'a'], ['scatter', 37, 28, 15, 12, 'T', 0.07, 5], ['scatter', 37, 28, 15, 12, 'c', 0.12, 6],
    ['scatter', 37, 28, 15, 12, 'd', 0.06, 7],
  ],
  buildings: [
    // north backdrop around the tower plaza
    { x: 16, z: 0, w: 6, d: 4, floors: 3, style: 'brick', front: 's', ground: 'shop', signs: [{ text: 'SHINSEKAI 1912\nKISSATEN', color: '#ffd23a', bg: '#140a1e', side: 's', y: 3.2, scale: 0.6 }] },
    { x: 31, z: 0, w: 6, d: 3, floors: 2, style: 'tile', front: 's', ground: 'shop', signs: [{ text: 'TOWER GIFTS\nみやげ', color: '#5ae0ff', bg: '#140a1e', side: 's', y: 3, scale: 0.55 }] },
    // Smells Like Teen Spirit Arcade (north-east)
    { x: 37, z: 1, w: 14, d: 9, floors: 4, style: 'shop', color: '#d8ccff', front: 's', fronts: ['s', 'w'], ground: 'shop', signs: [{ text: 'SMELLS LIKE\nTEEN SPIRIT', color: '#ff4ac8', bg: '#140a1e', side: 's', y: 8.6, scale: 1.05 }, { text: 'ARCADE  ゲームセンター', color: '#3ff0ff', bg: '#140a1e', side: 's', y: 4.3, scale: 0.75 }, { text: 'ゲーム', color: '#ffe45c', bg: '#140a1e', vertical: true, side: 's', at: 0.04 }, { text: 'UFO CATCHER', color: '#5dff9a', bg: '#140a1e', vertical: true, side: 's', at: 0.96 }, { text: 'HI-SCORE 999999', color: '#ff8a3c', bg: '#140a1e', side: 'w', y: 6.4, scale: 0.6 }] },
    // kushikatsu row, west side of the street (fronts face the camera)
    { x: 17, z: 13, w: 5, d: 7, floors: 2, style: 'tile', color: '#f6e6c8', front: 'e', ground: 'shop', signs: [{ text: 'FUGU FIGHTERS\nふぐ料理', color: '#ffe45c', bg: '#140a1e', side: 'e', y: 4.6, scale: 0.72 }, { text: 'ふぐ', color: '#ff5a3a', bg: '#140a1e', vertical: true, side: 'e', at: 0.92 }, { text: '二度づけ禁止', color: '#ff3b4f', bg: '#140a1e', side: 'e', at: 0.2, y: 2.6, scale: 0.4 }] },
    { x: 17, z: 20, w: 5, d: 4, floors: 2, style: 'machiya', front: 'e', ground: 'shop', signs: [{ text: 'FRIED ZEPPELIN\n串カツ', color: '#ff8a3c', bg: '#140a1e', side: 'e', y: 4.6, scale: 0.62 }, { text: '串カツ', color: '#ffd23a', bg: '#140a1e', vertical: true, side: 'e', at: 0.9 }] },
    { x: 17, z: 26, w: 5, d: 7, floors: 3, style: 'shop', color: '#ffe8d8', front: 'e', fronts: ['e', 's'], ground: 'shop', signs: [{ text: 'GUNS N\' SKEWERS', color: '#ff3b4f', bg: '#140a1e', side: 'e', y: 6.8, scale: 0.78 }, { text: '串カツ 100¥', color: '#ffe45c', bg: '#140a1e', side: 'e', y: 3.3, scale: 0.55 }, { text: '揚げ', color: '#5ae0ff', bg: '#140a1e', vertical: true, side: 'e', at: 0.08 }] },
    { x: 17, z: 33, w: 5, d: 6, floors: 2, style: 'brick', front: 'e', ground: 'shop', signs: [{ text: 'DEEP FRIED\nPURPLE', color: '#b46bff', bg: '#140a1e', side: 'e', y: 4.4, scale: 0.72 }, { text: '串', color: '#ff4ac8', bg: '#140a1e', vertical: true, side: 'e', at: 0.12 }, { text: 'LUCKY GOODS', color: '#ffd23a', bg: '#140a1e', side: 's', y: 2.8, scale: 0.45 }] },
    // east side of the street (blade signs reach into the street)
    { x: 31, z: 13, w: 6, d: 7, floors: 1, style: 'tile', color: '#e8f0ff', front: 'w', fronts: ['w', 's'], ground: 'shop', signs: [{ text: 'KUSHI', color: '#ff4ac8', bg: '#140a1e', vertical: true, side: 'w', at: 0.15, y: 1.8 }, { text: 'KUSHI KISS 串カツ', color: '#ff4ac8', bg: '#140a1e', side: 's', y: 2.4, scale: 0.5 }] },
    { x: 31, z: 24, w: 6, d: 5, floors: 1, style: 'shop', color: '#fff4e0', front: 'w', fronts: ['w', 's'], ground: 'shop', signs: [{ text: 'RAMEN', color: '#ffe45c', bg: '#140a1e', vertical: true, side: 'w', at: 0.2, y: 1.8 }, { text: 'RAMONES RAMEN', color: '#ffe45c', bg: '#140a1e', side: 'w', y: 2.2, scale: 0.5 }] },
    { x: 31, z: 29, w: 6, d: 10, floors: 1, style: 'concrete', color: '#c8c4d0', front: 'e', fronts: ['e', 'w'], ground: 'shutter', signs: [{ text: 'MASTER OF PUPPETS\nPAWN 質屋', color: '#ffd23a', bg: '#0a0a0a', side: 'e', y: 2.1, scale: 0.55 }, { text: 'PAWN 質', color: '#ffd23a', bg: '#140a1e', vertical: true, side: 'w', at: 0.12, y: 1.9 }, { text: 'ENTER SANDMAN', color: '#7f9dff', bg: '#140a1e', vertical: true, side: 'w', at: 0.88, y: 1.9 }] },
    // Janjan lane: cosmetics + goods shops face south onto the lane
    { x: 37, z: 13, w: 7, d: 7, floors: 2, style: 'shop', color: '#ffe0f0', front: 's', ground: 'shop', signs: [{ text: 'GRILLZ & THRILLZ', color: '#ff4ac8', bg: '#140a1e', side: 's', y: 4.6, scale: 0.7 }, { text: 'BLING ★ SOUL STONES', color: '#3ff0ff', bg: '#140a1e', side: 's', y: 2.9, scale: 0.42 }, { text: 'きらきら', color: '#ffe45c', bg: '#140a1e', vertical: true, side: 's', at: 0.96 }] },
    { x: 44, z: 13, w: 8, d: 7, floors: 2, style: 'shop', color: '#e0f4ff', front: 's', ground: 'shop', signs: [{ text: 'KANSAI CALLING\nSUPPLIES', color: '#5dff9a', bg: '#140a1e', side: 's', y: 4.7, scale: 0.68 }, { text: 'ELEMON GOODS', color: '#ffffff', bg: '#140a1e', side: 's', y: 2.9, scale: 0.42 }] },
    // Team Metallica turf: pachinko (north of the lot), tenement, alley mouth
    { x: 38, z: 24, w: 10, d: 4, floors: 1, style: 'concrete', color: '#9a96a8', front: 's', fronts: ['s', 'e'], ground: 'shutter', signs: [{ text: 'RIDE THE LIGHTNING  パチンコ', color: '#5ae0ff', bg: '#0a0a14', side: 's', y: 2.2, scale: 0.62, flicker: true }, { text: 'TEAM METALLICA\nNO TRESPASSING', color: '#ff3b4f', bg: '#1a0000', side: 'e', y: 1.9, scale: 0.36 }, { text: 'パチンコ', color: '#ffe45c', bg: '#140a1e', vertical: true, side: 'n', at: 0.5, y: 1.9 }] },
    { x: 50, z: 24, w: 2, d: 4, floors: 1, style: 'apartment', color: '#b8b0a8', front: 's', ground: 'shutter', clutter: false, signs: [{ text: 'KEEP OUT', color: '#ff3b4f', bg: '#140a1e', vertical: true, side: 'w', at: 0.3, y: 1.9, flicker: true }] },
    // sentō + chimney, dojo-side street pillars, street-mouth gate
    { x: 3, z: 26, w: 10, d: 6, floors: 2, style: 'temple', roof: 'tile', color: '#fff0dc', front: 's', ground: 'shoji', signs: [{ text: 'SMOKE ON THE WATER\n銭湯', color: '#7fe8ff', bg: '#1a2a3a', side: 's', y: 3.4, scale: 0.55 }] },
    { x: 13, z: 26, w: 2, d: 2, floors: 6, style: 'concrete', color: '#d8d0c8', front: 's', clutter: false, signs: [{ text: 'ゆ', color: '#ff6a8a', bg: '#140a1e', vertical: true, side: 's', at: 0.5, y: 14.5 }] },
    { x: 21, z: 39, w: 1, d: 1, floors: 2, style: 'stone', clutter: false, signs: [{ text: '新世界  SHINSEKAI', color: '#ffd23a', bg: '#2a0e2e', side: 's', at: 5.5, y: 5.6, scale: 1 }] },
    { x: 30, z: 39, w: 1, d: 1, floors: 2, style: 'stone', clutter: false },
  ],
  props: [
    // landmarks
    ['tsutenkaku', 26.5, 7, 0, 1], ['fugu_lantern', 24.4, 16.5, 0, 1, 0], ['lucky_statue', 23.2, 36.2, 90, 1],
    // tower plaza: sakura, benches, vending, kiosks
    ['sakura', 18, 6, 0, 1.1], ['sakura2', 35, 6.6, 40, 1], ['sakura3', 18.4, 10.6, 0, 1], ['sakura3', 34.6, 10.4, 90, 1],
    ['bench', 20.2, 8.2, 90], ['bench', 32.8, 8.2, 270], ['flowerbed', 21, 11.4, 0], ['vending', 22.4, 4.6, 0],
    ['vending', 23.6, 4.6, 0], ['ramen_stall', 33.6, 4.6, 0], ['streetlamp', 20.5, 12.5], ['streetlamp', 30.5, 12.5],
    ['noticeboard', 21.4, 2.4, 0, 0.9], ['drone', 24, 11, 0, 1, 5.5],
    // main street: lantern strings along both sidewalks, lamps, stalls, signs
    ['lantern_string', 22.55, 15.5, 90, 1], ['lantern_string', 22.55, 21.5, 90, 1], ['lantern_string', 22.55, 28.6, 90, 1], ['lantern_string', 22.55, 35, 90, 1],
    ['lantern_string', 30.45, 16.2, 90, 1], ['lantern_string', 30.45, 25.6, 90, 1], ['lantern_string', 30.45, 31.6, 90, 1], ['lantern_string', 30.45, 36.4, 90, 1],
    ['streetlamp', 22.6, 24.6], ['streetlamp', 30.4, 21.1], ['streetlamp', 22.6, 38.4], ['streetlamp', 30.4, 38.2],
    ['neon_frame', 22.75, 19.4, 90], ['neon_frame', 22.75, 31.4, 90], ['neon_frame', 30.25, 27.4, 270], ['holo_billboard', 30.4, 33.6, 270, 0.8],
    ['vending', 22.7, 26.6, 90], ['vending', 30.35, 18.6, 270], ['trashbins', 22.65, 34, 90], ['bench', 30.35, 23, 90, 0.9],
    ['yatai_takoyaki', 28.6, 30.2, 270], ['icecream_stand', 24.6, 22.2, 90], ['bicycle', 29.4, 35.4, 0], ['bicycle', 29.4, 36.6, 0],
    ['scooter', 23.7, 28, 10], ['noren', 22.15, 16.6, 90], ['noren', 22.15, 22, 90], ['noren', 22.15, 29.6, 90],
    ['noren', 22.15, 36, 90],
    // dojo: the hall, sand training yard with dummies + drum, pines, lanterns
    ['dojo', 9.5, 6.2, 0, 1], ['wooden_dummy', 3.6, 14, 90], ['wooden_dummy', 3.6, 20.6, 90], ['punching_bag', 15.6, 14.6, 270],
    ['punching_bag', 15.6, 20.4, 270], ['taiko', 15.2, 11.6, 315], ['training_dummy', 6, 23.2, 0], ['training_dummy', 13, 23.2, 0],
    ['target_post', 9.5, 23.4, 0], ['stone_lantern', 2.2, 10.6, 0], ['stone_lantern', 16, 10, 0], ['pine', 1.2, 2, 0, 1.4],
    ['pine', 15.4, 1.4, 120, 1.3], ['pine', 1, 22.6, 60, 1.2], ['fence_wood', 1, 13.6, 90], ['fence_wood', 1, 16.6, 90],
    ['fence_wood', 1, 19.6, 90], ['bench_stone', 2.8, 17.4, 90], ['sandbags', 16.2, 17.5, 90],
    // onsen: rotenburo pool, rocks, bamboo screen, milk vending, relax benches
    ['waterfall_rock', 6, 33.6, 0, 0.7, -0.2], ['rock_m', 2.6, 34.6, 30, 0.9], ['rock_m', 9.4, 37.6, 120, 0.8], ['rock_s', 3, 38.2, 0, 1.1],
    ['rock_s', 9.4, 34.4, 0, 1], ['rock_s', 5, 38.5, 0, 0.9], ['bamboo', 1, 33.2, 0, 1.1], ['bamboo', 1, 36.6, 0, 1],
    ['bamboo', 1.2, 39.4, 0, 1.15], ['fence_wood', 2.4, 39.7, 0], ['fence_wood', 4.6, 39.7, 0], ['fence_wood', 6.8, 39.7, 0],
    ['bench', 11.6, 37.4, 0], ['bench', 14.6, 35.4, 270], ['vending', 15.6, 33, 270], ['stone_lantern', 10.2, 32.9, 0],
    ['stone_lantern', 15.8, 38.6, 0], ['noren', 8, 32.15, 0], ['sakura3', 13.6, 39.6, 0, 1], ['pine', 0.8, 27, 0, 1.2],
    // Janjan lane: lanterns over the lane, shop dressing
    ['lantern_string', 39.5, 22, 0], ['lantern_string', 44, 22, 0], ['lantern_string', 48.5, 22, 0], ['lantern_string', 34.5, 22, 0],
    ['noren', 40.5, 20.15, 0], ['noren', 48, 20.15, 0], ['neon_frame', 42.8, 20.5, 0], ['flowerbed', 51, 22, 90, 0.9],
    ['bicycle', 37.6, 23.2, 90], ['vending', 46, 23.4, 180],
    // arcade forecourt
    ['vending', 38, 10.6, 0], ['vending', 39.2, 10.6, 0], ['neon_frame', 41, 10.6, 0], ['neon_frame', 47, 10.6, 0],
    ['holo_billboard', 50.4, 11.6, 270, 0.85], ['bicycle', 48.4, 12.4, 90], ['bicycle', 49.4, 12.4, 90], ['scooter', 50.8, 12.2, 80],
    ['drone', 44, 11.6, 30, 1, 6.2],
    // Team Metallica back lot: crates, barrels, trash fire, tyres, scooters, graffiti screens, barricade
    ['campfire', 38.5, 31, 0, 0.9], ['barrel', 37.9, 29.9, 0], ['barrel', 38.2, 37.8, 0], ['barrel', 50.8, 29, 0],
    ['barrel', 50.9, 30.1, 30], ['crate', 38.4, 28.8, 10], ['crate', 39.3, 28.6, 40, 0.85], ['crate', 38.4, 29.8, 70, 0.8],
    ['crate', 50.6, 37.4, 0], ['crate', 50.8, 38.4, 25, 0.9], ['crate', 47.4, 28.6, 0, 0.9], ['tires', 49.8, 33.6, 90],
    ['scooter', 49.6, 35.6, 80], ['scooter', 38.6, 33.4, 260], ['trashbins', 45.6, 28.55, 0], ['ac_unit', 42.6, 28.5, 0],
    ['ac_unit', 37.5, 35.6, 90], ['holo_billboard', 37.45, 32.4, 90, 0.8], ['neon_frame', 49.2, 28.6, 0], ['cone', 46.8, 39.2, 0],
    ['cone', 47.6, 39.4, 0], ['sandbags', 38.6, 40.2, 0], ['barrier', 41, 40.2, 0], ['sandbags', 43.2, 40.2, 0],
    ['barrier', 45.2, 40.3, 10], ['sandbags', 49.4, 40.2, 0], ['crate', 51.2, 40.2, 0, 0.9], ['fence_metal', 48.6, 39.7, 0],
    ['fence_metal', 39.8, 39.7, 0],
    // south road: hovercars, bus stop, crossing lights, lamps
    ['hovercar', 8, 42.6, 90], ['hovercar', 44, 42.4, 270], ['bus_stop', 13.4, 40.4, 0], ['traffic_light', 21.6, 40.5],
    ['traffic_light', 31.4, 40.5], ['streetlamp', 4, 40.5], ['streetlamp', 36, 40.5], ['streetlamp', 50, 40.5],
    ['trashbins', 34.2, 40.4, 0], ['bicycle', 18.4, 40.4, 90], ['bicycle', 19.4, 40.4, 90],
  ],
  points: {
    arrive: [26.5, 40.4, 180],
    dojo: [9.5, 11.8, 180],
    dojo_yard: [9.5, 17.5],
    dojo_master: [12.2, 12.2, 0],
    arcade: [44, 11.4, 180],
    onsen: [12.6, 36.2, 315],
    cosmetics: [40.5, 21.6, 180],
    shop: [47.6, 21.6, 180],
    alley: [44, 34],
    thrash_spot: [43.2, 29.8, 0],
    tower_view: [26.5, 15, 180],
  },
  npcs: [
    { id: 'dojo_master', char: 'dojo_master', x: 12.2, z: 12.2, face: 0, idle: 'think', talk: 'dojo_master' },
    { id: 'shopkeeper', char: 'shopkeeper', x: 46.2, z: 20.6, face: 20, idle: 'laugh', talk: 'shopkeeper' },
    { id: 'grillz_clerk', char: { random: 88, role: 'artist' }, x: 39, z: 20.6, face: 340, idle: 'wave', talk: 'cosmetics' },
    { id: 'thrash', char: 'thrash', x: 43.2, z: 29.8, face: 0, idle: 'headbang', talk: 'thrash' },
    { id: 'riff', char: 'riff', x: 41.6, z: 35.4, face: 45, idle: 'headbang', wander: 1.5, talk: 'riff' },
    { id: 'moshi', char: 'moshi', x: 46.6, z: 35, face: 315, idle: 'flex', wander: 1, talk: 'moshi' },
    { id: 'kushi_chef', char: { random: 11, role: 'chef' }, x: 22.9, z: 22.4, face: 60, idle: 'laugh' },
    { id: 'tourist_a', char: { random: 31, role: 'tourist' }, x: 25.2, z: 14.6, face: 180, idle: 'point', wander: 3 },
    { id: 'tourist_b', char: { random: 32, role: 'tourist' }, x: 28.2, z: 33, face: 270, wander: 6 },
    { id: 'bather', char: { random: 7, role: 'grandpa' }, x: 13.8, z: 36.8, face: 300, idle: 'stretch' },
    { id: 'gamer', char: { random: 19, role: 'student' }, x: 42.2, z: 11.6, face: 180, idle: 'cheer' },
    { id: 'lookout', char: { random: 66, role: 'punk' }, x: 47.2, z: 23.4, face: 20, idle: 'headbang' },
    { id: 'salaryman', char: { random: 42, role: 'salaryman' }, x: 29.6, z: 20.2, face: 270, idle: 'scratch' },
  ],
  spawns: { start: [26.5, 40.4, 180], fromWorldmap: [26.5, 40.4, 180], arrive: [26.5, 40.4, 180] },
  exits: [
    { x: 22, z: 43, w: 9, d: 1, to: 'worldmap', spawn: 'shinsekai', label: 'Leave Shinsekai' },
  ],
  arenas: { yard: { x: 9.5, z: 17.5, r: 6 }, alley: { x: 44, z: 34, r: 6 } },
  zones: {
    dojo: [2, 11, 15, 13],
    onsen: [0, 26, 17, 14],
    alley: [37, 23, 15, 17],
    arcade: [37, 10, 15, 3],
  },
  lights: [
    { pos: [26.5, 2.5, 12], color: '#7ff0ff', intensity: 3, range: 9 },
    { pos: [26.5, 3.5, 24], color: '#ffb35a', intensity: 3, range: 9 },
    { pos: [44, 3, 34], color: '#ff3b4f', intensity: 2.5, range: 9 },
    { pos: [6, 1.5, 36], color: '#9fe8ff', intensity: 1.6, range: 6 },
  ],
  ambience: { particles: 'neon', music: 'dojo', sound: 'city' },
  water: { deep: '#2a6a8a', shallow: '#8fe0f0', neon: '#ff4fc8' },
};
