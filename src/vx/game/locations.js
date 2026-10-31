// San Francisco locations: which diorama each one uses, where it sits on the phone
// map, named spots for actors (x, z metres + facing), camera shots, battle arenas
// and the hotspots you can tap. Hotspot acts are async functions of the app.
export const LOCATIONS = {
  // the walkable city (one seamless map; see src/vx/scenes/city.js)
  city: {
    name: 'San Francisco', scene: 'city', mood: 'day', map: [0.5, 0.5], blurb: 'The whole city on foot.',
    // the third-person follow camera (src/vx/city/control.js): distance m, pitch °, look-at height m, lens °, look-ahead s;
    // indoor: the closer, steeper framing inside buildings. The yaw is yours (orbit) and eases back behind you as you walk.
    // Close by default (a street-level view; zoom 3.5–10 m with the wheel / pinch / + -).
    follow: { dist: 5.2, pitch: 17, h: 1.3, fov: 42, lead: 0.28, indoor: { dist: 5.0, pitch: 40, h: 1.0, fov: 42, lead: 0.1 } },
    spots: {},
    // passers-by walking the avenue sidewalks (some with a partner at their heel). The city's Tokonmon (pets,
    // helpers, wild ones, birds…) live in src/vx/game/life.js: baked, LOD'd and spawned district by district.
    life: [
      { kind: 'person', n: 12, lanes: [[[3, 31], [101, 31]], [[119, 31], [227, 31]], [[3, 99.2], [101, 99.2]], [[119, 99.2], [227, 99.2]], [[3, 109], [101, 109]], [[119, 109], [227, 109]], [[105, 35], [105, 95]], [[115, 113], [115, 177]]] },
    ],
  },
  chinatown: {
    name: 'Chinatown', scene: 'chinatown', mood: 'golden', map: [0.665, 0.25], blurb: 'Grant Avenue under the lanterns. Home.',
    // x runs along Grant Avenue; the shops face south across the road; Portsmouth Square lies south of it
    spots: { start: [30, 26, 0], home: [38.2, 16.4, Math.PI], bakery: [17.7, 16.4, Math.PI], chess: [44, 36.5, Math.PI], square: [30, 33, 0], tramStop: [54.5, 26, -Math.PI / 2] },
    tram: { spot: [54.5, 26, -Math.PI / 2] },
    follow: { dist: 14, pitch: 30, yaw: 0, h: 1.2 },
    life: [
      { kind: 'person', n: 5, lanes: [[[2, 15.6], [62, 15.6]], [[2, 25.8], [62, 25.8]]] },
      { kind: 'mon', species: ['pidgun', 'pidrose'], n: 3, area: [20, 31, 40, 34], fidget: 'fidget' },
    ],
    hotspots: [
      { id: 'home', label: 'Home', icon: 'door', at: [38.2, 3, 14.6], walk: [38.2, 16.4], act: async (app) => app.story.goHome() },
      { id: 'bakery', label: 'Lucky Moon Bakery', icon: 'bowl', at: [17.7, 3, 14.6], walk: [17.7, 16.4], act: async (app) => app.story.bakery() },
      { id: 'gear', label: 'Gateway Music & Gear', icon: 'gear', at: [3.5, 3, 14.6], walk: [3.5, 16.4], act: async (app) => app.story.gearShop() },
      { id: 'chess', label: 'Xiangqi uncle', icon: 'talk', at: [45, 3, 38], act: async (app) => app.story.chessUncle() },
      { id: 'tram', label: 'Cable car stop', icon: 'map', at: [55, 3.6, 26], walk: [54.5, 26], act: async (app) => app.story.tramStop() },
    ],
  },
  alamo: {
    name: 'Alamo Square', scene: 'alamo', mood: 'golden', map: [0.45, 0.385], blurb: 'The Painted Ladies and the park on the hill.',
    view: { target: [32, 3, 26], dist: 52, yaw: 0, pitch: 36 },
    spots: { start: [20, 21.8, 0], door: [17.5, 21, 0], curb: [26, 22.5, 0], park: [32, 39.5, Math.PI], bench: [17, 38.6, Math.PI], left: [14, 39.5, Math.PI / 2], right: [44, 39.5, -Math.PI / 2] },
    shots: {
      street: { target: [30, 2.4, 27], dist: 26, yaw: 0, pitch: 26 },
      houses: { target: [32, 7, 18], dist: 36, yaw: 0, pitch: 16 },
      park: { target: [30, 3.4, 39.5], dist: 14, yaw: 8, pitch: 22 },
      arena: { target: [30, 3.4, 40], dist: 15, yaw: 90, pitch: 18 },
    },
    arena: { at: [30, 39.5], r: 5, axis: 'x', cam: { dist: 8, yaw: 180, pitch: 20 } },
    life: [
      { kind: 'mon', species: ['pidgun', 'pidrose'], n: 5, area: [6, 34, 58, 35.8], fidget: 'fidget' },
      { kind: 'mon', species: ['pidgun', 'pidrose'], n: 3, area: [6, 21, 58, 22.6], fidget: 'fidget' },
      { kind: 'person', n: 4, lanes: [[[1, 22], [63, 22]], [[1, 35], [63, 35]]] },
    ],
    hotspots: [
      { id: 'ladies', label: 'Painted Ladies', icon: 'star', at: [20, 9, 16], act: async (app) => { await app.world.shot('houses', 1.6); await app.say('', 'Seven Victorian houses in candy colours. Every tourist in San Francisco ends up taking this photo.'); await app.world.shot(app.world.loc.view, 1.4); } },
      { id: 'grass', label: 'Tall grass', icon: 'leaf', at: [40, 5, 40], act: async (app) => app.story.wildBattle('alamo') },
      { id: 'bench', label: 'Rest', icon: 'heart', at: [17, 5.2, 38.6], act: async (app) => app.story.rest() },
    ],
  },
  // the opening's places (interiors carry their own spots, shots, arenas and lights)
  apartment: { name: 'Home', scene: 'apartment', mood: 'golden', hidden: true, parent: 'chinatown', follow: { dist: 9, pitch: 26, yaw: 0, h: 1.0 },
    hotspots: [{ id: 'out', label: 'Go outside', icon: 'door', at: [0, 0, 0], spotAt: 'door', act: async (app) => app.story.goHome() }] },
  dojo: { name: 'Golden Claw Dojo', scene: 'dojo', mood: 'golden', map: [0.68, 0.22], blurb: 'Coach Gonda\'s kung-fu hall behind Grant Avenue.', tram: { spot: null }, follow: { dist: 12, pitch: 30, yaw: 0, h: 1.0 } },
  tram: { name: 'Cable car', scene: 'tram', mood: 'day', hidden: true },
  arena: { name: 'Street Arena', scene: 'arena', mood: 'golden', map: [0.62, 0.2], blurb: 'Painted rings under the freeway: where rookies fight.' },
  pier39: { name: 'Pier 39', scene: 'pier39', mood: 'golden', map: [0.63, 0.1], blurb: 'Sea lions, sourdough and street performers.' },
  lab: {
    name: 'Test Garden', scene: 'lab', mood: 'day', map: [0.5, 0.9], hidden: true,
    view: { target: [16, 2, 14], dist: 30, yaw: 0, pitch: 36 },
    spots: { start: [12, 13.5, 0], a: [10, 16, Math.PI / 2], b: [20, 16, -Math.PI / 2] },
    shots: { close: { target: [15, 2, 15.5], dist: 8, yaw: 0, pitch: 16 } },
    arena: { at: [15, 17], r: 4, axis: 'x' }, hotspots: [],
  },
};
// places on the phone map that are not open yet (shown greyed out)
export const MAP_SIGHTS = [
  { name: 'Golden Gate Bridge', at: [0.13, 0.11] }, { name: 'Alcatraz', at: [0.58, 0.025] },
  { name: 'Lombard Street', at: [0.53, 0.17] }, { name: 'Coit Tower', at: [0.69, 0.16] }, { name: 'Golden Gate Park', at: [0.2, 0.47] },
  { name: 'Haight-Ashbury', at: [0.37, 0.47] }, { name: 'Mission Dolores', at: [0.55, 0.57] }, { name: 'Twin Peaks', at: [0.42, 0.62] }, { name: 'Bayside Ballpark', at: [0.79, 0.4] },
];
