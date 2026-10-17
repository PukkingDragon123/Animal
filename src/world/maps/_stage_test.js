// Minimal side-scroll stage-set test: a small restaurant interior.
export default {
  id: '_stage_test', name: 'Stage Test', area: 'Test', size: [18, 9], base: 'o', view: 'side', interior: true,
  cam: { pitch: 0.22, fov: 26, dist: 15, minDist: 9, maxDist: 20, lookY: 1.4, z: 5 },
  ops: [['rect', 0, 0, 18, 2, '#'], ['rect', 1, 2, 16, 6, 'o'], ['rect', 6, 2, 6, 2, 'm']],
  rooms: [{ x: 1, z: 2, w: 16, d: 7, h: 3.4, wall: 'plaster', wallColor: '#f1e2c4', side: 'wood', wainscot: { style: 'dark_wood', h: 1.1 }, trim: '#5a3a26',
    windows: [{ x: 1.2, y: 1.4, w: 2.6, h: 1.4, view: 'city' }, { x: 12.2, y: 1.4, w: 2.6, h: 1.4, view: 'city' }] }],
  panels: [
    { x: 9, y: 2.55, z: 2.06, w: 3.2, h: 1.1, kind: 'menu', title: 'MENU お品書き', lines: ['Okonomiyaki ¥900', 'Yakisoba ¥700', 'Ramune ¥250'] },
    { x: 5.2, y: 2.1, z: 2.06, w: 0.9, h: 1.3, kind: 'poster', title: 'ABBEY', lines: ['ROAD', 'live!'] },
  ],
  props: [['bench', 5, 6, 0], ['bench', 12.5, 6, 0], ['barrel', 2.2, 3.2], ['crate', 15.6, 3.2], ['lantern_string', 9, 4.2, 0], ['vending', 16, 2.7, 0]],
  points: { start: [4, 6.6, 90], chef: [9, 3, 0], seat: [12.5, 6.6, 180] },
  spawns: { start: [4, 6.6, 90] },
  hotspots: [{ id: 'counter', x: 9, z: 3.4, kind: 'order', label: 'Order', approach: [9, 5], face: 180 }, { id: 'seat', x: 12.5, z: 6, kind: 'seat', label: 'Sit & eat', approach: [12.5, 6.8], face: 180 }, { id: 'door', x: 1.4, z: 6, kind: 'door', to: 'dotonbori', spawn: 'restaurant', label: 'Exit' }],
  zooms: { counter: { from: [9, 1.6, 6.2], look: [9, 1.7, 2.2], fov: 46, kind: 'order' }, seat: { from: [12.5, 2.1, 8.4], look: [12.5, 0.9, 6], fov: 34, kind: 'eat' } },
  lights: [{ pos: [9, 3, 4], color: '#ffd8a0', intensity: 5, range: 8 }, { pos: [4, 3, 5], color: '#ffc48a', intensity: 3, range: 6 }],
};
