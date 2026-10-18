// San Francisco locations: which diorama each one uses, where it sits on the phone
// map, named spots for actors (x, z metres + facing), camera shots, battle arenas
// and the hotspots you can tap. Hotspot acts are async functions of the app.
export const LOCATIONS = {
  chinatown: {
    name: 'Chinatown', scene: 'chinatown', mood: 'golden', map: [0.665, 0.25], blurb: 'Grant Avenue under the lanterns. Home.',
    spots: {}, shots: {}, hotspots: [],
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
  { name: 'Golden Gate Bridge', at: [0.13, 0.11] }, { name: "Pier 39", at: [0.63, 0.1] }, { name: 'Alcatraz', at: [0.58, 0.025] },
  { name: 'Lombard Street', at: [0.53, 0.17] }, { name: 'Coit Tower', at: [0.69, 0.16] }, { name: 'Golden Gate Park', at: [0.2, 0.47] },
  { name: 'Haight-Ashbury', at: [0.37, 0.47] }, { name: 'Mission Dolores', at: [0.55, 0.57] }, { name: 'Twin Peaks', at: [0.42, 0.62] }, { name: 'Bayside Ballpark', at: [0.79, 0.4] },
];
