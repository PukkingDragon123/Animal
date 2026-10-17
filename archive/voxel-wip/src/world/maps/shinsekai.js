// Shinsekai — "New World", the Showa-retro district under the tower (Naniwa Ward).
// HD-2D side-scroll stage set (docs/SCENES.md, docs/refs/environments.md §7, §9, §11).
// The camera sits south (+z) looking north along one long east–west street strip:
//
//   back   z 0–9    facades facing the camera (fronts at z = 9); the Tsutenkaku Hondori side street
//                  opens at x 58–64 under the 新世界 arch gate, with the tower straddling its far end
//   play   z 9–23   sidewalk (z 9–11), pedestrian street (z 11–21), front kerb (z 21–23)
//   front  z 23–26  sparse low foreground: planters, crates, lantern posts (blurred by the DOF)
//
// West → east: station end (exit) · 1912 Kissaten · Paperback Writer Books · Eye of the Tiger Dojo +
// sand forecourt (arena `yard`) · Kushikatsu Kiss · Smoke on the Water sentō + chimney · Fried Zeppelin
// (kushikatsu stall + menu) · Hondori mouth / arch gate / tower view · Smells Like Teen Spirit Arcade ·
// Shot Through the Heart shateki + Smooth Operator smart ball · Grillz & Thrillz · Kansai Calling
// Supplies (Revolver Records) · the fence gap → Team Metallica back alley (arena `alley`).
// Facing: 0 = toward the camera (+z), 90 = right (+x), 180 = away, 270 = left.

const W = 124, D = 26;
const FZ = 9; // facade front line
// a row of utility poles along the back kerb (wires span ±6 m)
const poles = [6, 42, 78].map((x) => ['ss_util_pole', x, 9.35, 0]);

export default {
  id: 'shinsekai', name: 'Shinsekai', area: 'Naniwa Ward', size: [W, D], base: 'w',
  view: 'side',
  cam: { pitch: 0.15, fov: 24, dist: 25, minDist: 13, maxDist: 36, lookY: 2.6, z: 15 },
  backdrop: [
    { kind: 'skyline', z: -70, x0: -60, x1: 190, height: 30, color: '#3a3a6a', color2: '#4a4478', lit: true, signs: true, seed: 11 },
    { kind: 'skyline', z: -36, x0: -40, x1: 170, height: 16, color: '#2e2a4e', color2: '#3a3058', lit: true, signs: true, seed: 5 },
  ],
  ops: [
    // pedestrian street: stone pavers with a cobble band, sidewalk + tactile line, kerbs
    ['rect', 0, 11, W, 10, 'p'], ['rect', 0, 15, W, 1, 'c'], ['rect', 0, 10, W, 1, 't'], ['rect', 0, 21, W, 1, 'e'],
    // Tsutenkaku Hondori side street (receding under the arch toward the tower)
    ['rect', 58, 0, 6, 11, 'c'], ['rect', 60, 0, 2, 11, 'p'],
    // dojo forecourt: raked gravel apron, sand training yard, stone path to the door
    ['rect', 15, 9, 20, 12, 'r'], ['circle', 25, 15, 6.4, 'A'], ['rect', 24, 9, 2, 2, 'p'],
    // sentō forecourt stones, arcade forecourt glow-tiles
    ['rect', 42, 9, 7, 2, 'p'], ['rect', 64, 9, 12, 2, 'P'],
    // the back alley: wet asphalt, grates, grime
    ['rect', 98, 9, 26, 14, 'a'], ['scatter', 98, 9, 26, 14, 'T', 0.05, 5], ['scatter', 98, 9, 26, 14, 'c', 0.08, 6], ['rect', 98, 21, 26, 1, 'e'],
  ],
  buildings: [
    // ---- west end
    { x: 3, z: 0, w: 7, d: FZ, floors: 3, style: 'brick', color: '#f4e4d8', front: 's', fronts: ['s', 'w'], ground: 'shop', signs: [
      { text: 'SHINSEKAI 1912\n喫茶 KISSATEN', color: '#ffd23a', bg: '#140a1e', side: 's', y: 3.6, scale: 0.55 },
      { text: '珈琲', color: '#ff8a3c', bg: '#140a1e', vertical: true, side: 's', at: 0.06 }] },
    { x: 10, z: 1, w: 5, d: FZ - 1, floors: 2, style: 'tile', color: '#e6efe6', front: 's', ground: 'shop', signs: [
      { text: 'PAPERBACK WRITER\nBOOKS 本', color: '#7fe8ff', bg: '#140a1e', side: 's', y: 3.4, scale: 0.42 }] },
    // ---- dojo walls (the hall itself is the `dojo` prop) — low plastered dobei either side of the hall
    { x: 15, z: 5, w: 4, d: 3, floors: 1, style: 'kura', front: 's', clutter: false, roof: 'tile', signs: [] },
    { x: 31, z: 5, w: 4, d: 3, floors: 1, style: 'kura', front: 's', clutter: false, roof: 'tile', signs: [] },
    // ---- Kushikatsu Kiss
    { x: 35, z: 0, w: 6, d: FZ, floors: 2, style: 'tile', color: '#fff0e0', front: 's', ground: 'shop', signs: [
      { text: 'KUSHIKATSU KISS\n串カツ', color: '#ff4ac8', bg: '#140a1e', side: 's', y: 4.6, scale: 0.55 },
      { text: '串カツ', color: '#ffd23a', bg: '#3a0a10', vertical: true, side: 's', at: 0.94 }] },
    // ---- Smoke on the Water sentō + chimney
    { x: 41, z: 1, w: 8, d: FZ - 1, floors: 2, style: 'temple', roof: 'tile', color: '#fff2e0', front: 's', ground: 'plaster', signs: [
      { text: 'SMOKE ON THE WATER\n銭湯', color: '#7fe8ff', bg: '#1a2a3a', side: 's', y: 4.4, scale: 0.5 }] },
    { x: 47.4, z: 0.5, w: 1.6, d: 1.6, floors: 7, style: 'concrete', color: '#d8d0c8', front: 's', clutter: false, signs: [
      { text: 'ゆ', color: '#ff6a8a', bg: '#140a1e', vertical: true, side: 's', at: 0.5, y: 17 }] },
    // ---- Fried Zeppelin (its east wall lines the Hondori with blade signs)
    { x: 49, z: 0, w: 9, d: FZ, floors: 2, style: 'machiya', front: 's', fronts: ['s', 'e'], ground: 'wood', roof: 'tile', signs: [
      { text: 'FRIED ZEPPELIN 串カツ', color: '#ff8a3c', bg: '#140a1e', side: 's', y: 5.1, scale: 0.5 },
      { text: 'たこ焼き', color: '#ffe45c', bg: '#140a1e', vertical: true, side: 'e', at: 0.25 },
      { text: 'ホルモン', color: '#ff4ac8', bg: '#140a1e', vertical: true, side: 'e', at: 0.6 }] },
    // ---- the arcade (its west wall lines the Hondori)
    { x: 64, z: 0, w: 12, d: FZ, floors: 4, style: 'shop', color: '#d8ccff', front: 's', fronts: ['s', 'w'], ground: 'shop', signs: [
      { text: 'SMELLS LIKE\nTEEN SPIRIT', color: '#ff4ac8', bg: '#140a1e', side: 's', y: 8.0, scale: 0.85 },
      { text: 'ARCADE ゲームセンター', color: '#3ff0ff', bg: '#140a1e', side: 's', y: 4.2, scale: 0.6 },
      { text: 'ゲーム', color: '#ffe45c', bg: '#140a1e', vertical: true, side: 's', at: 0.97 },
      { text: 'UFOキャッチャー', color: '#5dff9a', bg: '#140a1e', vertical: true, side: 'w', at: 0.4 },
      { text: '射的', color: '#ff3b4f', bg: '#140a1e', vertical: true, side: 'w', at: 0.85 }] },
    // ---- Shot Through the Heart (shateki) + Smooth Operator (smart ball)
    { x: 76, z: 1, w: 5, d: FZ - 1, floors: 1, style: 'tile', color: '#ffe8d8', front: 's', ground: 'shop', signs: [
      { text: 'SHOT THROUGH\nTHE HEART 射的', color: '#ff3b4f', bg: '#140a1e', side: 's', y: 2.85, scale: 0.36 }] },
    // ---- Grillz & Thrillz
    { x: 81, z: 0, w: 7, d: FZ, floors: 3, style: 'shop', color: '#ffe0f0', front: 's', ground: 'shop', signs: [
      { text: 'GRILLZ & THRILLZ', color: '#ff4ac8', bg: '#140a1e', side: 's', y: 4.7, scale: 0.55 },
      { text: 'BLING ★ SOUL STONES', color: '#3ff0ff', bg: '#140a1e', side: 's', y: 6.2, scale: 0.4 },
      { text: 'スマートボール', color: '#ffe45c', bg: '#140a1e', vertical: true, side: 's', at: 0.03 },
      { text: 'きらきら', color: '#ff8ad8', bg: '#140a1e', vertical: true, side: 's', at: 0.97 }] },
    // ---- Kansai Calling Supplies (goods + Revolver Records skill discs)
    { x: 88, z: 0, w: 9, d: FZ, floors: 2, style: 'shop', color: '#e0f4ff', front: 's', ground: 'shop', signs: [
      { text: 'KANSAI CALLING\nSUPPLIES', color: '#5dff9a', bg: '#140a1e', side: 's', y: 4.6, scale: 0.55 },
      { text: 'TOKONMON GOODS ・ REVOLVER RECORDS', color: '#ffffff', bg: '#140a1e', side: 's', y: 3.15, scale: 0.3 },
      { text: 'レコード', color: '#ffcf8a', bg: '#140a1e', vertical: true, side: 's', at: 0.96 }] },
    // ---- the alley mouth: pawn shop corner (its east side faces the alley)
    { x: 97, z: 0, w: 4, d: FZ, floors: 3, style: 'concrete', color: '#c8c4d0', front: 's', fronts: ['s', 'e'], ground: 'shutter', signs: [
      { text: 'MASTER OF PUPPETS\nPAWN 質屋', color: '#ffd23a', bg: '#0a0a0a', side: 's', y: 3.3, scale: 0.36 },
      { text: '質', color: '#ffd23a', bg: '#140a1e', vertical: true, side: 's', at: 0.9 }] },
    // ---- Team Metallica back alley (backs of buildings: shutters, service doors, a blazing pachinko corner)
    { x: 101, z: 0, w: 11, d: FZ, floors: 3, style: 'concrete', color: '#9a96a8', front: 's', ground: 'shutter', upper: ['concrete', 'window2', 'ac'], signs: [
      { text: 'RIDE THE LIGHTNING パチンコ', color: '#5ae0ff', bg: '#0a0a14', side: 's', y: 3.4, scale: 0.42, flicker: true },
      { text: 'パチンコ', color: '#ff3b4f', bg: '#140a1e', vertical: true, side: 's', at: 0.04, flicker: true },
      { text: 'TEAM METALLICA\nNO TRESPASSING', color: '#ff3b4f', bg: '#1a0000', side: 's', at: 0.82, y: 6.2, scale: 0.32 }] },
    { x: 112, z: 1, w: 5, d: FZ - 1, floors: 2, style: 'concrete', color: '#a8a0a0', front: 's', ground: 'shutter', signs: [
      { text: 'SEEK & DESTROY\nSCRAP', color: '#b6ff3c', bg: '#0a0a0a', side: 's', y: 3.3, scale: 0.36 }] },
    { x: 117, z: 0, w: 4, d: FZ, floors: 3, style: 'apartment', color: '#b8b0a8', front: 's', ground: 'door', signs: [
      { text: 'SAD BUT TRUE\nLOANS', color: '#ffe45c', bg: '#140a1e', side: 's', y: 3.4, scale: 0.3 },
      { text: 'ローン', color: '#ffe45c', bg: '#140a1e', vertical: true, side: 's', at: 0.92, y: 7 }] },
    { x: 121, z: 1, w: 3, d: FZ - 1, floors: 2, style: 'brick', color: '#d8c0b0', front: 's', ground: 'shutter', signs: [
      { text: "KILL 'EM ALL\n-YOU-CAN-EAT", color: '#ff8a3c', bg: '#140a1e', side: 's', y: 3.3, scale: 0.26 }] },
  ],
  props: [
    // ---- landmark behind the set: the tower straddles the far end of the Hondori
    ['ss_tower', 61, -4.5, 0, 1],
    ['ss_arch_gate', 61, 8.7, 0],
    ['lucky_statue', 57.2, 10.0, 20, 1], ['lucky_statue', 64.9, 10.0, 340, 1],
    ['lantern_string', 61, 3.0, 0], ['lantern_string', 61, 6.0, 0],
    // ---- utility poles along the back kerb
    ...poles,
    // ---- west end: bus stop, kissaten + books dressing
    ['bus_stop', 2.6, 21.6, 0], ['ss_awning_green', 6.5, FZ, 0, 1, 0], ['ss_planters', 8.6, 9.5, 0],
    ['vending', 1.4, 9.6, 0], ['bicycle', 13.2, 9.9, 90], ['bicycle', 14.2, 9.9, 90], ['ss_awning_blue', 12.5, FZ + 1, 0, 1, 0],
    // ---- dojo + forecourt (arena `yard` r 5.5 around 25,15 — dressing stays outside the ring)
    ['dojo', 25, 3.6, 0, 1],
    ['pine', 16.4, 7.4, 30, 1.25], ['pine', 33.6, 7.2, 200, 1.2], ['stone_lantern', 18.0, 9.6, 0], ['stone_lantern', 32.0, 9.6, 0],
    ['wooden_dummy', 16.4, 12.6, 90], ['punching_bag', 16.6, 18.6, 90], ['training_dummy', 33.6, 12.4, 0], ['target_post', 33.4, 18.8, 270],
    ['taiko', 19.6, 9.8, 0], ['sandbags', 21.0, 21.6, 0], ['sandbags', 29.0, 21.6, 0],
    // ---- Kushikatsu Kiss
    ['ss_kushi_hand', 36.6, FZ + 0.05, 0, 1, 2.95], ['ss_awning_red', 38.6, FZ, 0, 1, 0], ['ss_sampuru', 39.8, 9.5, 0], ['noren', 37.6, 9.2, 0],
    ['ss_lantern_eave', 38, FZ + 0.1, 0, 1, 2.75],
    // ---- sentō (door_onsen) + chimney steam
    ['ss_sento_gate', 44.5, 9.25, 0], ['ss_planters', 41.9, 9.5, 0], ['vending', 48.2, 9.6, 0],
    // ---- Fried Zeppelin: the kushikatsu counter + stall menu, the zeppelin sign
    ['ss_zeppelin_sign', 53.2, FZ + 0.05, 0, 1, 3.55], ['ss_kushi_counter', 53.2, 9.85, 0], ['ss_lantern_eave', 53.2, FZ + 0.1, 0, 1, 2.95],
    ['ss_soda_crates', 56.6, 9.5, 0],
    // ---- the arcade forecourt: an outdoor crane cabinet, vending, holo sign
    ['ss_crane_game', 66.4, 9.6, 0], ['ss_crane_game', 67.8, 9.6, 0], ['vending', 74.8, 9.6, 0], ['holo_billboard', 72.6, 4.0, 0, 0.9, 6.2],
    ['neon_frame', 64.6, 10.0, 0],
    // ---- shateki + smart ball
    ['ss_shateki', 78.5, 9.75, 0], ['ss_smartball', 80.0, 12.3, 0], ['ss_awning_yellow', 80.6, FZ, 0, 1, 0],
    // ---- Grillz & Thrillz / Kansai Calling
    ['ss_awning_red', 84.5, FZ, 0, 1, 0], ['ss_planters', 86.7, 9.45, 0],
    ['ss_awning_blue', 92.5, FZ, 0, 1, 0], ['ss_soda_crates', 95.6, 9.5, 0], ['bicycle', 88.6, 9.9, 90],
    // ---- the alley mouth: chain-link fence with the gap
    ['ss_chainlink', 99.0, 9.6, 90], ['ss_chainlink_gap', 99.0, 13.8, 90], ['cone', 99.4, 16.6, 0], ['ss_sodium_lamp', 100.4, 9.6, 0],
    // ---- Team Metallica back alley (arena `alley` r 6 around 110,15.5)
    ['ss_shutter_a', 103.5, FZ + 0.05, 0, 1, 0], ['ss_shutter_b', 108.0, FZ + 0.05, 0, 1, 0], ['ss_skull_piece', 114.5, FZ + 0.05, 0, 1, 2.6],
    ['ss_fire_escape', 110.5, FZ, 0, 1, 0], ['ss_pipes', 116.3, FZ + 0.05, 0, 1, 0], ['ss_gig_posters', 119.0, FZ + 0.05, 0, 1, 0.6],
    ['ac_unit', 101.8, 9.3, 0], ['ac_unit', 112.6, 9.3, 0],
    ['ss_gang_couch', 117.6, 10.1, 0], ['ss_drum_fire', 114.6, 10.2, 0], ['ss_stray_cats', 121.6, 10.0, 0], ['ss_dumpster', 102.8, 10.0, 0],
    ['crate', 123.0, 12.0, 15], ['barrel', 123.1, 13.2, 0], ['tires', 101.2, 21.6, 0],
    ['ss_puddle', 106.0, 19.2, 0], ['ss_puddle', 113.5, 21.0, 30], ['ss_puddle', 103.0, 13.5, 70],
    ['ss_sodium_lamp', 121.2, 21.4, 180], ['scooter', 119.8, 21.0, 80],
    // ---- street furniture along the front kerb (lamps every ~12 m, sparse low foreground)
    ['lantern_post', 12, 21.6, 0], ['lantern_post', 37, 21.6, 0], ['lantern_post', 49, 21.6, 0], ['lantern_post', 70, 21.6, 0], ['lantern_post', 86, 21.6, 0],
    ['streetlamp', 44, 22.2, 180], ['streetlamp', 92, 22.2, 180],
    ['ss_planters', 18.5, 23.6, 0], ['ss_soda_crates', 46.2, 23.4, 0], ['lucky_statue', 74.2, 23.0, 180, 1], ['ss_planters', 96.4, 23.6, 0],
    ['trashbins', 60.2, 22.0, 0], ['ss_kushi_counter', 30, 25.0, 180, 1, 0],
  ],
  panels: [
    // the arch's kanji crest and the dojo's wooden name plaque
    { x: 61, y: 6.32, z: 8.95, w: 2.4, h: 0.72, kind: 'sign', title: '新世界', bg: '#2a0e1e', fg: '#ffd23f', accent: '#ffd23f', ppm: 48 },
    { x: 25, y: 4.55, z: 8.95, w: 3.2, h: 0.86, kind: 'calligraphy', title: '虎の目道場', lines: ['EYE OF THE TIGER DOJO'], bg: '#e3c495', fg: '#1b1a19', accent: '#6b4a2b', ppm: 48 },
    // Fried Zeppelin stall menu (hung on the facade above the counter)
    { x: 53.2, y: 2.35, z: 9.08, w: 3.4, h: 1.15, kind: 'menu', title: 'MENU お品書き', lines: ['Doteyaki ¥500', 'Ghost Pepper Kushikatsu ¥800', 'Kushikatsu ¥600', 'Ramune ¥250'], bg: '#2a1a12', fg: '#ffe9b0', accent: '#ff8a3c', ppm: 56 },
    // "no double dipping" placard on the counter hood + the bath price at the sentō
    { x: 51.4, y: 2.1, z: 10.5, w: 0.62, h: 0.32, kind: 'sign', title: '二度漬け禁止', bg: '#fff4dc', fg: '#c8281e', accent: '#c8281e', ppm: 64 },
    { x: 47.2, y: 1.6, z: 9.1, w: 0.9, h: 0.6, kind: 'sign', title: '入浴料', lines: ['BATH ¥500'], bg: '#1a2a3a', fg: '#7fe8ff', accent: '#7fe8ff', ppm: 64 },
    // Revolver Records window poster + Paperback Writer chalkboard
    { x: 90.0, y: 1.6, z: 9.1, w: 1.0, h: 0.9, kind: 'poster', title: 'SKILL DISCS', lines: ['vinyl that', 'teaches moves!', 'all elements'], bg: '#16141c', fg: '#ffcf8a', accent: '#ff6a2b', ppm: 56 },
    { x: 12.6, y: 0.75, z: 9.3, w: 0.8, h: 0.95, kind: 'chalk', title: 'TODAY', lines: ['new manga', 'Tokonmon', 'field guide'], ppm: 56 },
  ],
  points: {
    arrive: [4.5, 16, 90],
    // story NPC marks on the strip (in front of the matching doors)
    dojo: [25, 11.0, 180], dojo_yard: [25, 15], dojo_master: [27.6, 11.4, 0],
    onsen: [42.6, 11.0, 0], arcade: [72.6, 11.2, 0], cosmetics: [86.2, 11.2, 0], shop: [94.6, 11.2, 0],
    tower_view: [61, 12.5, 180],
    alley: [109.0, 14.0, 180], thrash_spot: [114.6, 12.0, 0],
    kushikatsu: [53.2, 11.6, 180],
  },
  npcs: [
    { id: 'dojo_master', char: 'dojo_master', x: 27.6, z: 11.4, face: 0, idle: 'think', talk: 'dojo_master' },
    { id: 'thrash', char: 'thrash', x: 114.6, z: 12.0, face: 0, idle: 'headbang', talk: 'thrash' },
    { id: 'riff', char: 'riff', x: 107.6, z: 15.4, face: 45, idle: 'headbang', wander: 1.5, talk: 'riff' },
    { id: 'moshi', char: 'moshi', x: 120.2, z: 11.6, face: 0, idle: 'flex', wander: 0.6, talk: 'moshi' },
    { id: 'lookout', char: { random: 66, role: 'punk' }, x: 101.4, z: 12.4, face: 270, idle: 'headbang' },
    // metal bullies hanging around (studded vests, chains, spikes)
    { id: 'bully_a', name: 'Metal Bully', char: { random: 401, role: 'punk' }, x: 104.4, z: 18.6, face: 30, idle: 'headbang', wander: 1.2 },
    { id: 'bully_b', name: 'Metal Bully', char: { random: 402, role: 'punk' }, x: 118.6, z: 17.0, face: 300, idle: 'flex', wander: 1.0 },
    { id: 'bully_c', name: 'Metal Bully', char: { random: 403, role: 'punk' }, x: 96.2, z: 19.2, face: 90, idle: 'headbang', wander: 1.5 },
    { id: 'bully_d', name: 'Metal Bully', char: { random: 404, role: 'punk' }, x: 67.2, z: 12.2, face: 0, idle: 'cheer' },
    // townsfolk
    { id: 'kushi_chef', char: { random: 11, role: 'chef' }, x: 52.4, z: 8.95, face: 0, idle: 'laugh' },
    { id: 'tourist_a', char: { random: 31, role: 'tourist' }, x: 60.0, z: 13.4, face: 180, idle: 'point', wander: 2 },
    { id: 'tourist_b', char: { random: 32, role: 'tourist' }, x: 40.5, z: 16.5, face: 90, wander: 6 },
    { id: 'gamer', char: { random: 19, role: 'student' }, x: 68.6, z: 11.0, face: 180, idle: 'cheer' },
    { id: 'salaryman', char: { random: 42, role: 'salaryman' }, x: 54.6, z: 11.4, face: 180, idle: 'scratch' },
    { id: 'granny_s', char: { random: 7, role: 'grandma' }, x: 9.4, z: 11.0, face: 0, idle: 'wave' },
    { id: 'bather', char: { random: 8, role: 'grandpa' }, x: 46.6, z: 11.2, face: 0, idle: 'stretch' },
    { id: 'shooter_kid', char: { random: 77, role: 'kid' }, x: 78.2, z: 11.2, face: 180, idle: 'cheer' },
  ],
  hotspots: [
    { id: 'door_dojo', x: 25, z: 9.2, y: 1.3, r: 1.0, kind: 'door', to: 'dojo', spawn: 'door', label: 'Eye of the Tiger Dojo', approach: [25, 10.6], face: 180 },
    { id: 'door_onsen', x: 44.5, z: 9.2, y: 1.3, r: 1.0, kind: 'door', to: 'onsen', spawn: 'door', label: 'Smoke on the Water 銭湯', approach: [44.5, 10.6], face: 180 },
    { id: 'door_arcade', x: 70.0, z: 9.1, y: 1.3, r: 1.0, kind: 'door', to: 'arcade', spawn: 'door', label: 'Smells Like Teen Spirit Arcade', approach: [70.0, 10.6], face: 180 },
    { id: 'door_grillz', x: 84.5, z: 9.1, y: 1.3, r: 1.0, kind: 'door', to: 'grillz_shop', spawn: 'door', label: 'Grillz & Thrillz', approach: [84.5, 10.6], face: 180 },
    { id: 'door_records', x: 92.5, z: 9.1, y: 1.3, r: 1.0, kind: 'door', to: 'kansai_calling', spawn: 'door', label: 'Kansai Calling Supplies', approach: [92.5, 10.6], face: 180 },
    { id: 'kushikatsu', x: 53.2, z: 10.2, y: 1.2, r: 1.0, kind: 'order', label: 'Kushikatsu stall', approach: [53.2, 11.6], face: 180 },
    { id: 'tower', x: 61, z: 6.0, y: 3.5, r: 1.2, kind: 'look', label: 'The tower', approach: [61, 12.0], face: 180 },
  ],
  zooms: {
    // first-person at the kushikatsu counter: menu above, chef behind, sauce trays in the lower third
    kushikatsu: { from: [53.2, 1.5, 12.3], look: [53.2, 1.65, 8.6], fov: 46, kind: 'order' },
  },
  spawns: {
    start: [4.5, 16, 90], fromWorldmap: [4.5, 16, 90], arrive: [4.5, 16, 90],
    // returning from the interiors (in front of each door)
    dojo_door: [25, 11.2, 0], onsen_door: [44.5, 11.2, 0], arcade_door: [70, 11.2, 0], grillz_door: [84.5, 11.2, 0], records_door: [92.5, 11.2, 0],
  },
  exits: [
    { x: 0, z: 9, w: 1, d: 14, to: 'worldmap', spawn: 'shinsekai', label: 'Leave Shinsekai' },
  ],
  arenas: { yard: { x: 25, z: 15, r: 5.5 }, alley: { x: 110, z: 15.5, r: 6 } },
  zones: {
    dojo: [15, 9, 20, 12],
    onsen: [41, 9, 8, 4],
    arcade: [64, 9, 12, 4],
    alley: [98, 9, 26, 14],
  },
  lights: [
    { pos: [61, 3.0, 9.6], color: '#ffd27a', intensity: 4, range: 9 },      // arch gate marquee
    { pos: [25, 3.5, 10.5], color: '#ffd0a0', intensity: 3, range: 8 },     // dojo lanterns
    { pos: [44.5, 2.6, 10.4], color: '#9fe8ff', intensity: 2.4, range: 7 }, // sentō
    { pos: [70, 3.0, 10.5], color: '#ff6ad8', intensity: 4, range: 9 },     // arcade glow
    { pos: [86, 3.0, 10.4], color: '#ffd23f', intensity: 3, range: 8 },     // bling + records
    { pos: [104, 2.8, 12], color: '#ff3b4f', intensity: 3.2, range: 9 },    // pachinko LED spill
  ],
  ambience: { particles: 'neon', music: 'dojo', sound: 'city' },
  water: { deep: '#2a6a8a', shallow: '#8fe0f0', neon: '#ff4fc8' },
};
