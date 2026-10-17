// Test street (Dotonbori-like) for environment development.
export default {
  id: 'test', name: 'Test Street', size: [32, 24], base: 'w',
  ops: [
    ['rect', 0, 9, 32, 6, 'a'], ['rect', 0, 11, 32, 1, '='], ['rect', 14, 9, 3, 6, 'x'],
    ['rect', 0, 17, 32, 4, '-'], ['rect', 12, 17, 6, 4, 'o'],
    ['rect', 0, 21, 32, 3, 'p'],
  ],
  buildings: [
    { x: 1, z: 2, w: 6, d: 6, floors: 4, style: 'shop', front: 's', sign: { text: 'たこ焼き', color: '#ff5a3a', vertical: true, side: 's', at: 0.15 } },
    { x: 8, z: 1, w: 5, d: 7, floors: 6, style: 'tile', front: 's', signs: [{ text: 'ABBEY ROAD\nお好み焼き', color: '#5ae0ff', side: 's' }, { text: 'ラーメン', color: '#ffe23a', vertical: true, side: 's', at: 0.9 }] },
    { x: 14, z: 3, w: 4, d: 5, floors: 2, style: 'machiya', front: 's' },
    { x: 19, z: 0, w: 6, d: 8, floors: 9, style: 'office', front: 's', sign: { text: 'HOTEL KANSAI-FORNIA', color: '#ff5ac8', side: 's', y: 4.5 } },
    { x: 26, z: 2, w: 5, d: 6, floors: 3, style: 'brick', front: 's', sign: { text: 'BOHEMIAN RHAP-SODA', color: '#a0ff6a', side: 's' } },
  ],
  props: [['vending', 7.5, 8.3, 180], ['streetlamp', 3, 15.6], ['streetlamp', 13, 15.6], ['streetlamp', 23, 15.6], ['sakura', 30, 22.5], ['bench', 5, 22.5], ['yatai_takoyaki', 9, 22.6], ['lantern_string', 20, 16.2]],
  spawns: { start: [15, 13] },
};
