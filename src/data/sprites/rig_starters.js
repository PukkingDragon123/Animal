// Starter Tokonmon rigs (src/px/rig.js). Nominal 96×96 space, ¾ view facing left.
export const SPRITES = {};

// ---------------------------------------------------------------- helpers
// a flame-shaped feather from base (bx,by) to tip (tx,ty), width w, curl bends the tip sideways
function feather(bx, by, tx, ty, w, curl = 0) {
  const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const P = (a, b) => [bx + ux * a + nx * b, by + uy * a + ny * b];
  const tip = [tx + nx * curl, ty + ny * curl];
  return [P(0, w * 0.4), [...P(L * 0.45, w * 1.15), ...P(L * 0.85, w * 0.35 + curl * 0.6), ...tip], [...P(L * 0.72, -w * 0.25 + curl * 0.3), ...P(L * 0.35, -w * 1.0), ...P(0, -w * 0.4)]];
}
// a breath jet: narrow at the mouth, swelling, ending in three licking tongues
function jet(bx, by, tx, ty, w) {
  const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const P = (a, b) => [bx + ux * a * L + nx * b * w, by + uy * a * L + ny * b * w];
  return [P(0, 0.22), [...P(0.3, 0.62), ...P(0.6, 0.95)], [...P(0.8, 1.18), ...P(0.86, 0.86)], P(0.98, 0.78), P(0.88, 0.42), P(1.04, 0.04), P(0.9, -0.34), P(0.99, -0.72),
    [...P(0.82, -1.08), ...P(0.6, -0.92)], [...P(0.3, -0.58), ...P(0, -0.22)]];
}
const heart = (cx, cy, r, col) => [['circ', cx - r * 0.52, cy - r * 0.3, r * 0.62, col, { gloss: true }], ['circ', cx + r * 0.52, cy - r * 0.3, r * 0.62, col, { gloss: true }],
  ['path', [[cx - r * 1.08, cy - r * 0.12], [cx + r * 1.08, cy - r * 0.12], [cx, cy + r * 1.15]], col]];
const zee = (cx, cy, r, col) => [['cap', cx - r, cy - r, cx + r, cy - r, r * 0.3, r * 0.3, col, { flat: true }], ['cap', cx + r, cy - r, cx - r, cy + r, r * 0.3, r * 0.3, col, { flat: true }], ['cap', cx - r, cy + r, cx + r, cy + r, r * 0.3, r * 0.3, col, { flat: true }]];
const FLAME = (y0, o0, r0, d0) => [[0, y0], [0.26, o0], [0.56, r0], [0.84, d0]];
// gradient options along a feather (base → tip)
const along = (bx, by, tx, ty, stops) => ({ grad: stops, gradA: [bx, by], gradB: [tx, ty], puff: 0.65 });

// ---------------------------------------------------------------- Chilichick (Pyro)
// A round fluffy fire chick. Its crest, wing tips and tail are flames that run
// yellow → orange → chili red; big glossy eyes that water up whenever it eats
// (and it is always eating chili peppers); rosy cheeks, a small orange beak.
{
  const crest = [
    [38, 26, 26, 9, 4.2, -2], [44, 23, 38, 3, 5, -1.5], [50, 22, 53, 0, 5.6, 1], [56, 24, 66, 7, 5, 2], [60, 28, 74, 18, 4.2, 2.5],
  ];
  const tail = [[70, 70, 86, 58, 4.4, -1], [71, 74, 89, 68, 4, 0], [70, 78, 86, 79, 3.4, 1]];
  const wingTips = [[66, 64, 77, 72, 3.2, 1], [64, 68, 73, 78, 3, 1], [61, 71, 67, 81, 2.6, 0.5]];
  SPRITES.chilichick = {
    id: 'chilichick', size: [96, 96], anchor: [48, 93], ink: '#3a1810',
    pal: {
      y: '#ffd447', y2: '#ffc23a', o: '#ff9a2e', o2: '#ff7a24', ch: '#fff0a0',
      fy: '#ffbe2e', fo: '#ff7420', fr: '#e8352a', fd: '#a81c2c',
      bk: '#ff8a14', bkd: '#c84a10', m: '#7a1a24', tg: '#ff6a7a',
      eye: '#2c140e', iris: '#6e3418', iris2: '#b0582a', w: '#ffffff', bl: '#ff8fa0', ft: '#b8622c',
      chili: '#f02a24', stem: '#4fae3a', tear: '#9ee8ff', fire: '#ffb02e',
      fl: '#ff5868', hrt: '#ff5a86', zz: '#d8ecff', stm: '#fff3ea', core: '#fffbe6',
    },
    anim: { bob: 1.2, sway: 1.1, lag: 1.2, hop: 1.2 },
    pad: { breath: [56, 0, 0, 0], throw: [48, 0, 0, 0], dash: [0, 0, 12, 0] },
    parts: [
      // far wing + far foot (behind)
      { n: 'wingL', parent: 'body', p: [30, 60], z: -3, s: [['ell', 26, 64, 7, 10, 'o', { rot: 25 }], ['path', feather(24, 70, 18, 80, 3, -1), 'fr', along(24, 70, 18, 80, FLAME('fo', 'fo', 'fr', 'fd'))]] },
      { n: 'legL', parent: 'body', p: [40, 84], z: -2, s: [['cap', 40, 83, 39, 89, 2.2, 1.8, 'ft'], ['cap', 39, 90, 33, 91, 1.5, 1.2, 'ft'], ['cap', 39, 90, 40, 92.5, 1.4, 1.1, 'ft'], ['cap', 39, 90, 44, 91.5, 1.4, 1.1, 'ft']] },
      // tail flames
      { n: 'tail', parent: 'body', p: [70, 74], z: -1, s: tail.map(([bx, by, tx, ty, wd, cu]) => ['path', feather(bx, by, tx, ty, wd, cu), 'fr', along(bx, by, tx, ty, FLAME('fy', 'fo', 'fr', 'fd'))]) },
      // round fluffy body, orange underside
      { n: 'body', p: [48, 86], s: [
        ['ell', 48, 65, 25, 21.5, 'y', { fluff: { n: 11, amp: 0.07, from: 15, to: 165 }, grad: [[0, 'y'], [0.5, 'y2'], [0.78, 'o']], gradA: [48, 44], gradB: [48, 87] }],
        // soft feather scallops, one tone darker, following the shading
        ...[[30, 74], [36, 79], [44, 81], [52, 80], [59, 77], [34, 69], [27, 66], [62, 72]].map(([x, y]) => ['curve', [[x - 2.4, y - 1], [x, y + 0.8], [x + 2.4, y - 1]], 0.55, 0.55, y > 75 ? 'o' : 'y2', { paint: true, band: -1 }]),
      ] },
      // fluffy chest bib
      { n: 'chest', parent: 'body', p: [44, 60], z: 1, line: false, s: [
        ['ell', 42, 61, 13.5, 11, 'ch', { fluff: { n: 9, amp: 0.14, from: 20, to: 160 }, puff: 0.55 }],
      ] },
      // near foot
      { n: 'legR', parent: 'body', p: [54, 84], z: 2, s: [['cap', 54, 83, 55, 89, 2.3, 1.9, 'ft'], ['cap', 55, 90.5, 49, 92, 1.5, 1.2, 'ft'], ['cap', 55, 90.5, 55.5, 93.5, 1.5, 1.1, 'ft'], ['cap', 55, 90.5, 61, 92.5, 1.5, 1.2, 'ft']] },
      // crest flames (behind the head top)
      { n: 'crest', parent: 'head', p: [50, 26], z: 2, s: crest.map(([bx, by, tx, ty, wd, cu]) => ['path', feather(bx, by, tx, ty, wd, cu), 'fr', along(bx, by, tx, ty, FLAME('fy', 'fo', 'fr', 'fd'))]) },
      // big round head
      { n: 'head', parent: 'body', p: [46, 58], z: 3, line: false, s: [
        ['ell', 45, 40, 22, 19.5, 'y', { fluff: { n: 14, amp: 0.05, from: 200, to: 340 }, grad: [[0, 'y'], [0.8, 'y2']], gradA: [45, 22], gradB: [45, 60] }],
        ['ell', 56, 50, 4.6, 2.4, 'bl', { flat: true, line: false }],
        ['ell', 29, 49.5, 2.6, 1.8, 'bl', { flat: true, line: false }],
      ] },
      // eyes — open (default)
      { n: 'eyes', parent: 'head', p: [42, 41], z: 4, show: '!closed', s: [] },
      { n: 'eyeN', parent: 'eyes', p: [50, 41], z: 5, show: ['open', 'fierce', 'teary'], line: false, s: [
        ['ell', 50, 40.5, 5.2, 7.1, 'eye', { flat: true }], ['ell', 50.6, 44.2, 3.9, 3.3, 'iris', { flat: true }], ['ell', 50.9, 45.2, 2.4, 1.6, 'iris2', { flat: true }],
        ['circ', 48.2, 37.6, 2.2, 'w', { flat: true }], ['circ', 52.2, 44.9, 1, 'w', { flat: true }], ['circ', 51.2, 36.4, 0.7, 'w', { flat: true }],
      ] },
      { n: 'eyeF', parent: 'eyes', p: [33, 41], z: 5, show: ['open', 'fierce', 'teary'], line: false, s: [
        ['ell', 33, 40.8, 3.6, 6.4, 'eye', { flat: true }], ['ell', 33.4, 44.2, 2.7, 2.9, 'iris', { flat: true }], ['ell', 33.6, 45, 1.6, 1.4, 'iris2', { flat: true }],
        ['circ', 31.8, 38, 1.6, 'w', { flat: true }], ['circ', 34.6, 44.8, 0.6, 'w', { flat: true }],
      ] },
      // fierce brows (attack)
      { n: 'brow', parent: 'head', p: [42, 33], z: 6, show: 'fierce', s: [['cap', 45, 33.5, 54, 31, 1.2, 1, 'eye', { flat: true }], ['cap', 30, 32, 36, 34, 1, 1.1, 'eye', { flat: true }]] },
      // teary eyes: welling tears + streams
      { n: 'tears', parent: 'head', p: [42, 47], z: 7, show: ['teary', 'tears'], line: false, s: [
        ['curve', [[52, 47], [54, 52], [55, 57]], 1.2, 1.8, 'tear', { flat: true }], ['curve', [[33, 47], [31.5, 51], [30.5, 55]], 1, 1.5, 'tear', { flat: true }],
        ['circ', 58.5, 30, 1.6, 'tear', { flat: true }], ['circ', 25, 32, 1.3, 'tear', { flat: true }], ['dot', 58, 29, 'w'],
      ] },
      // closed / happy / hurt / ko eyes
      { n: 'eyesClosed', parent: 'head', p: [42, 42], z: 5, show: 'closed', s: [['curve', [[46, 42], [50, 44], [54, 42]], 1, 1, 'eye', { flat: true }], ['curve', [[30, 42], [33, 43.6], [36, 42]], 0.9, 0.9, 'eye', { flat: true }]] },
      { n: 'eyesHappy', parent: 'head', p: [42, 42], z: 5, show: 'happy', s: [['curve', [[46, 44], [50, 40], [54, 44]], 1, 1, 'eye', { flat: true }], ['curve', [[30, 44], [33, 40.5], [36, 44]], 0.9, 0.9, 'eye', { flat: true }]] },
      { n: 'eyesHurt', parent: 'head', p: [42, 42], z: 5, show: 'hurt', s: [['curve', [[46, 38], [52, 41.5], [46, 45]], 0.9, 0.9, 'eye', { flat: true }], ['curve', [[37, 38.5], [31, 41.5], [37, 44.5]], 0.85, 0.85, 'eye', { flat: true }]] },
      { n: 'eyesKO', parent: 'head', p: [42, 42], z: 5, show: 'ko', s: [['cap', 46.5, 38.5, 53.5, 45.5, 0.9, 0.9, 'eye', { flat: true }], ['cap', 53.5, 38.5, 46.5, 45.5, 0.9, 0.9, 'eye', { flat: true }], ['cap', 30.5, 39, 35.5, 44.5, 0.8, 0.8, 'eye', { flat: true }], ['cap', 35.5, 39, 30.5, 44.5, 0.8, 0.8, 'eye', { flat: true }]] },
      // heat flush (over the cheeks while it suffers)
      { n: 'flush', parent: 'head', p: [42, 50], z: 4, show: 'tears', line: false, s: [
        ['ell', 56.5, 50.5, 6, 3.2, 'fl', { flat: true }], ['ell', 28.8, 50, 3.2, 2.4, 'fl', { flat: true }],
      ] },
      // beak: a small cone between the eyes, tip pointing down-left; lower mandible shows under it
      { n: 'beakLo', parent: 'beak', p: [40, 53], z: 7, s: [
        ['path', [[35.2, 52.2], [39, 54, 43.6, 51.4], [42.4, 55.4, 38, 55.2], [35, 54.4, 35.2, 52.2]], 'bkd'],
      ] },
      { n: 'beak', parent: 'head', p: [40, 50], z: 8, s: [
        ['path', [[36.4, 47.4], [40.8, 46.2, 45.4, 47.8], [45, 51, 40.4, 52.6], [35.6, 53.6, 32.2, 51.6], [33.6, 49.2, 36.4, 47.4]], 'bk', { gloss: true, grad: [[0, 'bk'], [0.75, 'bkd']], gradA: [42, 47], gradB: [34, 53] }],
        ['dot', 41.5, 48.6, 'bkd'],
      ] },
      // open mouth: the lower jaw drops and shows a red mouth + tongue
      { n: 'jaw', parent: 'beak', p: [40, 53], z: 7.5, show: 'mouth:open', s: [
        ['path', [[44.5, 51.6], [39, 53.2, 33.6, 52], [35.4, 58.4, 40.8, 59], [45, 55.8, 44.5, 51.6]], 'bkd'],
        ['ell', 39.2, 54.4, 4.6, 2.5, 'm', { flat: true, line: false }], ['ell', 40, 55.6, 2.8, 1.3, 'tg', { flat: true, line: false }],
      ] },
      // fire breath: an outer jet, a hotter middle, a white-hot core, two side licks
      ...[
        ['fire', -44, 46, 13, [[0, 'fy'], [0.28, 'fo'], [0.62, 'fr'], [0.9, 'fd']], 9.1],
        ['fireUp', -12, 36, 5.5, [[0, 'fy'], [0.4, 'fo'], [0.8, 'fr']], 9.2],
        ['fireDn', -8, 64, 6, [[0, 'fy'], [0.4, 'fo'], [0.8, 'fr']], 9.2],
        ['fireMid', -28, 50, 8.4, [[0, 'ch'], [0.32, 'fy'], [0.78, 'fo']], 9.3],
        ['fireCore', 4, 52, 4.2, [[0, 'core'], [0.55, 'ch'], [0.9, 'fy']], 9.4],
      ].map(([n, tx, ty, wd, st, z]) => ({ n, parent: 'beak', p: [33, 52.5], z, show: 'fire', line: false,
        s: [['path', jet(33, 52.5, tx, ty, wd), 'fy', { glow: true, grad: st, gradA: [33, 52.5], gradB: [tx, ty] }]] })),
      { n: 'fireSpark', parent: 'fire', p: [-30, 46], z: 9.5, show: 'fire', line: false, s: [['circ', -36, 36, 1.6, 'fo', { glow: true }], ['circ', -40, 58, 1.3, 'fr', { glow: true }], ['circ', -20, 33, 1.1, 'fy', { glow: true }], ['circ', -48, 47, 1.2, 'fr', { glow: true }]] },
      // near wing with flame-tipped feathers
      { n: 'wingR', parent: 'body', p: [62, 60], z: 6, s: [
        ['ell', 64, 64, 8, 10.5, 'y2', { rot: -18, grad: [[0, 'y2'], [0.7, 'o']], gradA: [62, 55], gradB: [66, 75] }],
        // covert / primary feather rows
        ['curve', [[58, 61], [62, 64.5], [69, 63]], 0.55, 0.55, 'y2', { paint: true, band: -1 }],
        ['curve', [[59, 67], [63.5, 70.5], [70.5, 68.5]], 0.55, 0.55, 'o', { paint: true, band: -1 }],
        ['curve', [[63, 59], [62, 64], [63.5, 72]], 0.5, 0.5, 'y2', { paint: true, band: -1 }],
        ...wingTips.map(([bx, by, tx, ty, wd, cu]) => ['path', feather(bx, by, tx, ty, wd, cu), 'fr', along(bx, by, tx, ty, FLAME('o', 'fo', 'fr', 'fd'))]),
      ] },
      // the chili: held in the wing, clamped in the beak, or flying
      { n: 'chiliHand', parent: 'wingR', p: [68, 78], z: 6.5, show: 'chiliHand', s: [
        ['curve', [[66, 77], [70.5, 80.6], [76, 81.4], [80.5, 79.6]], 3.4, 1.3, 'chili', { gloss: true }],
        ['path', [[63, 74.5], [66.5, 74.6], [67.4, 77.6], [64.6, 79], [62.6, 77]], 'stem'], ['cap', 63.4, 75.4, 60.6, 72.6, 0.8, 0.6, 'stem'],
      ] },
      { n: 'chili', parent: 'beak', p: [35, 52], z: 8.5, show: 'chili', s: [
        ['curve', [[36, 52], [30, 54.2], [23.5, 54.2], [18, 50.4]], 1.8, 3.8, 'chili', { gloss: true }],
        ['path', [[19.5, 47.2], [16.2, 45.4], [13.8, 48.4], [15.6, 52], [18.8, 52.2]], 'stem'], ['cap', 15, 46.8, 12.4, 42.8, 1, 0.7, 'stem'],
      ] },
      { n: 'chiliFly', p: [30, 52], z: 12, show: 'chiliFly', s: [
        ['curve', [[37, 53], [32, 54], [27, 53.4], [23, 51]], 1.2, 2.6, 'chili', { gloss: true }],
        ['path', [[37, 51], [40, 50.6], [40.6, 53.6], [38, 55], [36.2, 53.6]], 'stem'],
      ] },
      // dash: flames streaming off the back
      ...[[66, 64, 97, 54, 7, 2], [68, 72, 101, 70, 8, -1], [64, 80, 95, 85, 6, -2]].map(([bx, by, tx, ty, wd, cu], i) => ({ n: 'dashfire' + i, parent: 'body', p: [bx, by], z: -6, show: 'dashfire', line: false,
        s: [['path', feather(bx, by, tx, ty, wd, cu), 'fy', Object.assign({ glow: true }, along(bx, by, tx, ty, [[0, 'ch'], [0.3, 'fy'], [0.62, 'fo'], [0.88, 'fr']]))]] })),
      // spicy buff: a ring of flames rising behind it
      ...[[16, 90, 8, 54, 5, -2], [28, 92, 22, 40, 6.5, -1], [42, 92, 40, 30, 6, 0], [58, 92, 62, 32, 6.5, 1], [72, 92, 80, 44, 6.5, 2], [82, 90, 92, 58, 5, 2]].map(([bx, by, tx, ty, wd, cu], i) => ({ n: 'aura' + i, p: [bx, by], z: -8, show: 'aura', line: false,
        s: [['path', feather(bx, by, tx, ty, wd, cu), 'fy', Object.assign({ glow: true }, along(bx, by, tx, ty, [[0, 'fy'], [0.35, 'fo'], [0.7, 'fr'], [0.9, 'fd']]))]] })),
      // happy hearts, sleepy Zs, heat steam
      { n: 'heart0', p: [20, 30], z: 12, show: 'hearts', s: heart(20, 30, 3.6, 'hrt') },
      { n: 'heart1', p: [76, 22], z: 12, show: 'hearts', s: heart(76, 22, 3, 'hrt') },
      ...[0, 1, 2].map((i) => ({ n: 'zz' + i, p: [66, 30], z: 12, show: 'zz', s: zee(66, 30, 3.2, 'zz') })),
      { n: 'steam0', parent: 'head', p: [21, 34], z: 9, show: 'steam', line: false, s: [['circ', 21, 34, 3.4, 'stm', { fluff: { n: 7, amp: 0.2 }, puff: 0.5 }], ['circ', 18, 31, 2.2, 'stm', { puff: 0.5 }]] },
      { n: 'steam1', parent: 'head', p: [70, 32], z: 9, show: 'steam', line: false, s: [['circ', 70, 32, 3.8, 'stm', { fluff: { n: 7, amp: 0.2 }, puff: 0.5 }], ['circ', 73.5, 29, 2.4, 'stm', { puff: 0.5 }]] },
    ],
    bond: { grow: { crest: 1.3, tail: 1.2 }, aura: 'flame', auraColor: '#ff7a2a' },
    fx: [{ part: 'crest', x: 53, y: 2, type: 'ember', rate: 0.6 }],
  };
}
