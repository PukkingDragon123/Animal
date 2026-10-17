// Dotonbori — the neon canal district (night is its best look).
// Layout (x → east, z → south):
//   z 1–11   north-bank shop row, facades + signs facing the canal (and the camera)
//   z 11–17  Dotonbori street (pedestrian): stalls, neon frames, vending, bikes
//   z 18–20  north river walk (boardwalk) with lantern strings
//   z 21–27  the canal; the wide Ebisu bridge plaza spans x 19–35 (3v3 arena, r 7)
//   z 28–31  south river walk; z 32–34 south street; low shops along the south edge
//   x 20–33  Ebisu-bashi-suji arcade running off the south edge
// Facing convention for points / npcs: degrees, 0 = facing south (+z), 90 = east,
// 180 = north, 270 = west (same as prop rotation).

const BX = 27, BZ = 24;   // bridge plaza / arena centre
// prop near the arena rim at angle `deg` (0 = east, 90 = south), turned to face the centre
const rim = (id, deg, r = 8.4, s = 1) => {
  const a = (deg * Math.PI) / 180;
  return [id, +(BX + Math.cos(a) * r).toFixed(2), +(BZ + Math.sin(a) * r).toFixed(2), Math.round((Math.atan2(-Math.cos(a), -Math.sin(a)) * 180) / Math.PI), s];
};

export default {
  id: 'dotonbori', name: 'Dotonbori', area: 'Namba, Chuo Ward', size: [56, 40], base: 'c',
  ops: [
    ['rect', 0, 0, 56, 2, 'a'],                                   // service alley behind the shops
    ['rect', 0, 11, 56, 7, 'c'], ['rect', 0, 11, 56, 1, 'w'],     // Dotonbori street, sidewalk strip at the shop fronts
    ['rect', 0, 14, 56, 1, 't'],                                  // tactile guide line down the street
    ['rect', 0, 18, 56, 3, 'o'],                                  // north river walk
    ['rect', 0, 21, 56, 7, '-'],                                  // canal
    ['rect', 0, 28, 56, 4, 'o'],                                  // south river walk
    ['rect', 0, 32, 56, 3, 'c'], ['rect', 0, 34, 56, 1, 'w'],     // south street
    // Ebisu bridge plaza (spans the canal) + the plaza ends on both walks
    ['rect', 19, 18, 17, 14, 'P'], ['circle', BX, BZ, 7.3, 'p'], ['ring', BX, BZ, 6.6, 7.3, 'T'], ['circle', BX, BZ, 1.6, 'T'],
    // arcade street heading south
    ['rect', 20, 35, 14, 5, 'c'], ['rect', 26, 35, 2, 5, 't'],
  ],
  buildings: [
    // ---- north bank (fronts south onto the street + canal)
    { x: 0, z: 2, w: 6, d: 9, floors: 5, style: 'tile', front: 's', fronts: ['s'], color: '#f2e6f0',
      signs: [{ text: 'KARAOKE\nQUEEN', color: '#ff5ac8', side: 's', y: 7.5, scale: 0.42 }, { text: 'カラオケ', color: '#5ae0ff', vertical: true, side: 's', at: 0.92 },
        { text: '酒場', color: '#ff4a3a', vertical: true, side: 's', at: 0.1, y: 11, scale: 0.75 }] },
    { x: 6, z: 3, w: 7, d: 8, floors: 3, style: 'shop', front: 's', color: '#fff2a8', ground: 'shop',
      signs: [{ text: 'YELLOW SUBMARINE\nSOFT-SERVE', color: '#ffe23a', side: 's', y: 4.6, scale: 0.36 }, { text: 'アイス', color: '#ff8ad8', vertical: true, side: 's', at: 0.94, scale: 0.8 }] },
    { x: 13, z: 1, w: 6, d: 10, floors: 6, style: 'tile', front: 's', color: '#e8eef6',
      signs: [{ text: "OCTOPUS'S GARDEN\nTAKOYAKI", color: '#ff7a3a', side: 's', y: 4.4, scale: 0.34 }, { text: 'たこ焼き', color: '#ff5a3a', vertical: true, side: 's', at: 0.06 },
        { text: '居酒屋', color: '#ffe23a', vertical: true, side: 's', at: 0.94, y: 12 }, { text: 'RAMEN 2F', color: '#5ae0ff', side: 's', y: 8.4, scale: 0.4 },
        { text: 'LIVE MUSIC', color: '#c08bff', side: 's', y: 14.4, scale: 0.36 }] },
    { x: 19, z: 2, w: 9, d: 9, floors: 4, style: 'shop', front: 's', color: '#ffe8e0',
      signs: [{ text: 'RED HOT CHILI CRABBERS', color: '#ff4a3a', side: 's', y: 9.6, scale: 0.42 }, { text: 'かに', color: '#ffe45c', vertical: true, side: 's', at: 0.03, y: 8 },
        { text: '道頓堀', color: '#5ae0ff', vertical: true, side: 's', at: 0.97, y: 8.4, scale: 0.8 }] },
    { x: 28, z: 3, w: 9, d: 8, floors: 2, style: 'concrete', front: 's', ground: 'shop', clutter: false,
      signs: [{ text: 'ドラッグ', color: '#5dff9a', vertical: true, side: 's', at: 0.96, scale: 0.7 }, { text: 'PAPERBACK WRITER BOOKS', color: '#9fd8ff', side: 's', y: 2.6, scale: 0.3 }] },
    { x: 37, z: 2, w: 7, d: 9, floors: 3, style: 'brick', front: 's', color: '#ffe0cc', ground: 'shop',
      signs: [{ text: 'ABBEY ROAD\nお好み焼き', color: '#5ae0ff', side: 's', y: 5.2, scale: 0.42 }, { text: 'お好み焼', color: '#ff9a3a', vertical: true, side: 's', at: 0.04 }] },
    { x: 44, z: 1, w: 6, d: 10, floors: 7, style: 'office', front: 's', fronts: ['s', 'e'],
      signs: [{ text: 'HOTEL\nKANSAI-FORNIA', color: '#ff5ac8', side: 's', y: 15, scale: 0.4 }, { text: 'ホテル', color: '#c08bff', vertical: true, side: 's', at: 0.94, y: 8 },
        { text: 'LIVE HOUSE\nB1', color: '#ffe23a', side: 's', y: 4.6, scale: 0.34, at: 0.4 }, { text: 'スシ', color: '#5dff9a', vertical: true, side: 's', at: 0.06, y: 10.5, scale: 0.8 }] },
    { x: 50, z: 2, w: 6, d: 9, floors: 5, style: 'shop', front: 's', fronts: ['s', 'e'], color: '#e8f6ff',
      signs: [{ text: 'SMELLS LIKE\nTEEN SPIRIT\nARCADE', color: '#a0ff6a', side: 's', y: 8.6, scale: 0.36 }, { text: 'ゲーム', color: '#ff5ac8', vertical: true, side: 's', at: 0.06 },
        { text: 'GAME CENTER', color: '#ffe23a', side: 'e', y: 9, scale: 0.4 }] },
    // ---- south bank (low; fronts north onto the south street — blade signs read from the camera side)
    { x: 0, z: 35, w: 7, d: 5, floors: 2, style: 'shop', front: 'n', fronts: ['n', 'e'], color: '#f0e8ff',
      signs: [{ text: 'BOHEMIAN\nRHAP-SODA', color: '#a0ff6a', side: 'n', y: 3.2, scale: 0.36 }, { text: 'ソーダ', color: '#5ae0ff', vertical: true, side: 'n', at: 0.92, scale: 0.65 }, { text: 'SODA BAR', color: '#ff8ad8', side: 'e', y: 3.4, scale: 0.34 }] },
    { x: 7, z: 35, w: 7, d: 5, floors: 1, style: 'machiya', front: 'n', roof: 'tile', clutter: false,
      signs: [{ text: 'UDON STOP ME NOW', color: '#ffe23a', side: 'n', y: 2.4, scale: 0.3 }, { text: 'うどん', color: '#ff7a3a', vertical: true, side: 'n', at: 0.06, scale: 0.6, y: 2.2 }] },
    { x: 14, z: 35, w: 6, d: 5, floors: 2, style: 'tile', front: 'n', fronts: ['n', 'e'],
      signs: [{ text: '串カツ', color: '#ff5a3a', vertical: true, side: 'n', at: 0.9, scale: 0.65 }, { text: 'KUSHIKATSU\nKISS', color: '#ff5ac8', side: 'e', y: 3.3, scale: 0.36 }] },
    { x: 34, z: 35, w: 7, d: 5, floors: 2, style: 'shop', front: 'n', fronts: ['n', 'w'], color: '#ffe8f0',
      signs: [{ text: "SWEET CHILD O' MINE\nCRÊPES", color: '#ff8ad8', side: 'n', y: 3.3, scale: 0.3 }, { text: 'クレープ', color: '#ffe23a', vertical: true, side: 'n', at: 0.08, scale: 0.6 }, { text: 'CRÊPES', color: '#5ae0ff', side: 'w', y: 3.3, scale: 0.36 }] },
    { x: 41, z: 35, w: 7, d: 5, floors: 1, style: 'tile', front: 'n', clutter: false,
      signs: [{ text: 'WONDERWALL GYOZA', color: '#9fd8ff', side: 'n', y: 2.4, scale: 0.3 }, { text: '餃子', color: '#ff5a3a', vertical: true, side: 'n', at: 0.92, scale: 0.6, y: 2.2 }] },
    { x: 48, z: 35, w: 8, d: 5, floors: 2, style: 'concrete', front: 'n', fronts: ['n', 'e'],
      signs: [{ text: "LIVIN' ON A PRAWN\nTEMPURA", color: '#ffb03a', side: 'n', y: 3.3, scale: 0.3 }, { text: '天ぷら', color: '#5dff9a', vertical: true, side: 'n', at: 0.06, scale: 0.65 }] },
  ],
  props: [
    // ---- landmarks
    ['crab_sign', 23.5, 12.15, 0],
    ['runner_board', 32.5, 7, 0, 1, 6],                       // on the drugstore roof, facing the bridge
    ['fugu_lantern', 47.2, 13.4, 0],
    ['drummer_statue', 18.6, 33.1, 30],

    // ---- Dotonbori street (north bank)
    ['icecream_stand', 9.4, 12.7, 0],
    ['yatai_takoyaki', 16, 15.2, 0],
    ['noren', 40.5, 11.35, 0], ['noren', 3, 11.3, 0],
    ['vending', 5.4, 11.55, 0], ['vending', 12.3, 11.55, 0], ['vending', 49.2, 11.55, 0], ['trashbins', 18.2, 11.5, 0],
    ['neon_frame', 0.8, 11.6, 0], ['neon_frame', 13.5, 11.6, 0], ['neon_frame', 36.4, 11.6, 0], ['neon_frame', 43.6, 11.6, 0], ['neon_frame', 55.2, 11.6, 0],
    ['bicycle', 6.6, 16.6, 85], ['bicycle', 7.3, 16.8, 95], ['bicycle', 44.6, 16.6, 90], ['scooter', 52.4, 16.4, 80],
    ['streetlamp', 4.5, 17.5], ['streetlamp', 12.5, 17.5], ['streetlamp', 42.5, 17.5], ['streetlamp', 50.5, 17.5],
    ['holo_billboard', 52.5, 12.4, 0], ['barrier', 34.6, 12.3, 0], ['cone', 33.3, 12.4],
    ['ac_unit', 13.8, 1.2, 180, 1, 9], ['ac_unit', 0.6, 1.6, 180, 1, 6],
    ['drone', 12, 23.5, 70, 1, 7.5], ['drone', 44, 25, 250, 1, 8.5],

    // ---- north river walk
    ['bench', 7.6, 19.6, 0], ['bench', 10.6, 19.6, 0], ['flowerbed', 4.6, 19.7, 0], ['flowerbed', 13.6, 19.7, 0],
    ['lantern_string', 2.6, 18.5, 0], ['lantern_string', 7.6, 18.5, 0], ['lantern_string', 12.6, 18.5, 0],
    ['lantern_string', 40.6, 18.5, 0], ['lantern_string', 45.6, 18.5, 0], ['lantern_string', 50.6, 18.5, 0],
    ['bench', 44, 19.6, 0], ['flowerbed', 39.6, 19.7, 0], ['streetlamp', 16.5, 20.5], ['streetlamp', 37.5, 20.5],

    // ---- Ebisu bridge plaza: destructible dressing around the arena rim
    ['lantern_post', 19.5, 21.4], ['lantern_post', 19.5, 26.6], ['lantern_post', 34.5, 21.4], ['lantern_post', 34.5, 26.6],
    ['fence_metal', 19.3, 22.9, 90], ['fence_metal', 19.3, 25.1, 90], ['fence_metal', 34.7, 22.9, 90], ['fence_metal', 34.7, 25.1, 90],
    rim('crate', 238), rim('barrel', 246, 8.9), rim('neon_frame', 258), rim('signpost', 282, 8.2), rim('crate', 296), rim('crate', 300, 9.2), rim('barrel', 304),
    rim('barrel', 58), rim('crate', 66, 8.8), rim('lantern_post', 98, 8.2), rim('cone', 106, 8.2), rim('ramen_stall', 124, 8.9), rim('barrel', 136),
    ['bicycle', 33.2, 31, 10], ['cone', 20.4, 31.3],

    // ---- south river walk
    ['lantern_string', 2.6, 29.6, 0], ['lantern_string', 7.6, 29.6, 0], ['lantern_string', 12.6, 29.6, 0],
    ['lantern_string', 40.6, 29.6, 0], ['lantern_string', 45.6, 29.6, 0], ['lantern_string', 50.6, 29.6, 0],
    ['streetlamp', 4.5, 28.4], ['streetlamp', 16.5, 28.4], ['streetlamp', 38.5, 28.4], ['streetlamp', 49.5, 28.4],
    ['bench', 9.6, 28.4, 180], ['bench', 43.6, 28.4, 180], ['flowerbed', 1.6, 28.4, 0], ['flowerbed', 54.4, 28.4, 0],
    ['holo_billboard', 51, 31.3, 0],

    // ---- south street + arcade
    ['yatai_takoyaki', 4.6, 33, 180], ['ramen_stall', 46.5, 33.1, 180],
    ['vending', 13.4, 34.4, 180], ['vending', 41.4, 34.4, 180], ['trashbins', 19, 34.4, 180],
    ['neon_frame', 20.5, 35.6, 90], ['neon_frame', 33.5, 35.6, 270],
    ['lantern_string', 24.4, 35.6, 0], ['lantern_string', 29.6, 35.6, 0], ['lantern_string', 24.4, 38.6, 0], ['lantern_string', 29.6, 38.6, 0],
    ['bicycle', 21.2, 37.6, 0], ['bicycle', 21.9, 37.8, 0], ['scooter', 32.6, 37.4, 180], ['cone', 31.5, 39.3],
    ['streetlamp', 22.5, 33.6], ['streetlamp', 31.5, 33.6], ['barrel', 6.8, 33.4], ['crate', 2.5, 33.4],
  ],
  points: {
    arrive: [2, 14.5, 90],            // spawn — walking in from the west end of the street
    icecream: [9.4, 14.6, 180],       // in front of Yellow Submarine Soft-Serve (stand at z 12.7)
    icecream_table: [9.1, 18.4, 0],   // benches on the river walk facing the canal
    vendor: [16, 13.7, 0],            // behind the takoyaki yatai
    taro: [18.8, 16.3, 270],          // kid hanging around the stall
    punks_enter: [54.5, 19, 270],     // Team Metallica walks in along the east river walk
    bridge: [BX, BZ],                 // centre of the Ebisu bridge plaza
    restaurant: [40.5, 13.2, 180],    // in front of Abbey Road Okonomiyaki
    hoshino: [43.4, 14.6, 225],       // archaeologist waiting by the restaurant
    canal_view: [12, 30, 180],        // south walk, looking across the canal at the signs
  },
  arenas: { bridge: { x: BX, z: BZ, r: 7 } },
  npcs: [
    { id: 'tourist_a', char: { random: 101, role: 'tourist' }, x: 14, z: 30, face: 180, wander: 5, idle: 'point' },
    { id: 'tourist_b', char: { random: 102, role: 'tourist' }, x: 41.6, z: 30.6, face: 180, wander: 4, idle: 'cheer' },
    { id: 'salaryman', char: 'salaryman', x: 46, z: 15.5, face: 270, wander: 6, idle: 'think' },
    { id: 'shopper', char: { random: 202, role: 'shopper' }, x: 35, z: 14.5, face: 0, wander: 5 },
    { id: 'students', char: { random: 303, role: 'student_sailor' }, x: 8.4, z: 32.8, face: 90, wander: 3, idle: 'laugh' },
    { id: 'chef', char: { random: 404, role: 'chef' }, x: 46.5, z: 34.4, face: 180, idle: 'wave' },
  ],
  spawns: { start: [2, 14.5], fromWorldmap: [2, 14.5] },
  exits: [{ x: 0, z: 11, w: 1, d: 7, to: 'worldmap', spawn: 'dotonbori', label: 'Namba' }],
  lights: [
    { pos: [BX, 5, BZ], color: '#ff6ad8', intensity: 3, range: 12 },
    { pos: [9.4, 3, 14], color: '#ffe680', intensity: 3, range: 7 },
  ],
  water: { deep: '#0e2a52', shallow: '#1f7fa8', neon: '#ff4fd0' },
  ambience: { particles: 'neon', music: 'dotonbori', sound: 'canal_night' },
};
