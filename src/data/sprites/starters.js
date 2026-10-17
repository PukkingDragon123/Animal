// Starter Tokonmon as 2D pixel sprites (src/px/sprite.js format).
// ¾ view facing LEFT; coordinates in pixels; y grows downward.
export const SPRITES = {};

// ------------------------------------------------------------------ Chilichick (Pyro)
// A hot-headed little chick that refuses to admit it's too spicy: crest of three
// chili peppers, angry brows, comic waterfall tears, a green chili clamped in
// its beak like a cigar, a leafy calyx scarf, a flame emblem on its chest and a
// chili-pod tail. One wing flexed — it is ready to fight anyone, right now.
const CHICK_EYE_N = { map: ['..kkkk.', '.kIIIIk', 'kwwIIIk', 'kwwpppk', 'kiipppk', 'kiippik', 'kiiiiik', '.kijwk.', '..kkk..'],
  maps: { closed: ['......', '......', '......', '......', 'kkkkkk', '.kkkk.'], hurt: ['k....k', '.k..k.', '..kk..', '.k..k.', 'k....k'], ko: ['k....k', '.k..k.', '..kk..', '.k..k.', 'k....k'], happy: ['......', '.kkkk.', 'k....k', '......'] } };
const CHICK_EYE_F = { map: ['.kkk.', 'kIIIk', 'kwwpk', 'kwppk', 'kippk', 'kiiik', 'kijik', '.kkk.'],
  maps: { closed: ['.....', '.....', '.....', '.....', 'kkkkk'], hurt: ['k...k', '.k.k.', '..k..', '.k.k.'], ko: ['k...k', '.k.k.', '..k..', '.k.k.'], happy: ['.....', '.kkk.', 'k...k'] } };
SPRITES.chilichick = {
  id: 'chilichick', size: [80, 80], anchor: [40, 75],
  pal: { r: '#ea4a2f', p: '#d01a2e', g: '#45a83a', g2: '#2f7a30', gp: '#8fd84a', y: '#ffc93a', y2: '#ffa630', t: '#8ae4ff', pk: '#ff7b8a', m: '#6a1426', br: '#4a1222', leg: '#ff9a2e' },
  anim: { arch: 'bird', bob: 1.3, hop: 1.4, speed: 1.15, sway: 1.2 },
  outlineDark: 0.6,
  parts: [
    // far wing resting on its hip
    { n: 'wingL', parent: 'body', p: [29, 54], z: -3, s: [['path', [[30, 50], [24, 52, 21, 58], [22, 63], [26, 61], [24, 66], [29, 62], [32, 57]], 'r']] },
    // chili-pod tail curling up behind
    { n: 'tail', parent: 'body', p: [55, 62], z: -2, s: [
      ['curve', [[53, 63], [61, 63], [67, 57], [68, 49], [64, 45]], 4.8, 1.3, 'p', { gloss: true }],
      ['ell', 54, 62.5, 3, 2.2, 'g'],
    ] },
    // stubby legs, wide stance
    { n: 'legL', parent: 'body', p: [35, 66], z: -1, s: [['cap', 35, 66, 33, 72, 2, 1.6, 'leg'], ['cap', 33, 73, 27, 74, 1.3, 1, 'leg'], ['cap', 33, 73, 32, 75.5, 1.2, 1, 'leg'], ['cap', 33, 73, 37, 74.5, 1.1, 1, 'leg']] },
    { n: 'legR', parent: 'body', p: [47, 67], z: 1, s: [['cap', 47, 67, 49, 72.5, 2.1, 1.7, 'leg'], ['cap', 49, 73.5, 43, 75, 1.4, 1, 'leg'], ['cap', 49, 73.5, 49, 76, 1.2, 1, 'leg'], ['cap', 49, 73.5, 54, 75, 1.2, 1, 'leg']] },
    // plump body with a flame emblem
    { n: 'body', p: [41, 66], s: [
      ['ell', 42, 56, 15, 13, 'r'],
      ['path', [[35, 68], [32, 63, 33, 58], [36, 53], [37, 57], [39, 49], [42, 55], [45, 51], [47, 56], [48, 62, 46, 68]], 'y', { paint: true, flat: true }],
      ['path', [[37.5, 67], [36, 63, 37, 60], [39, 57], [40.5, 60], [42, 57.5], [44, 61], [43.5, 66]], '#fff3a8', { paint: true, flat: true }],
      ['path', [[45, 68], [47.5, 62, 46.5, 57], [48, 60], [48.5, 64, 46, 68]], 'y', { paint: true, band: -1 }],
    ] },
    // leafy calyx scarf, knotted at the back, tails flapping
    { n: 'scarf', parent: 'body', p: [40, 48], z: 2, s: [
      ['path', [[23, 46], [32, 50, 44, 50], [53, 45], [55, 49], [44, 55, 32, 55], [23, 51]], 'g'],
      ['tri', 25, 51, 30, 52, 26.5, 56.5, 'g'], ['tri', 33, 53, 38, 53.5, 35, 58, 'g'], ['tri', 41, 53, 46, 52, 44.5, 57, 'g'],
      ['path', [[30, 50.5], [40, 52.5, 50, 48]], 'g2', { paint: true }],
      ['circ', 53, 47.5, 3, 'g'],
    ] },
    { n: 'leafTail', parent: 'scarf', p: [54, 47], z: 1, s: [
      ['path', [[54, 46], [60, 41, 66, 43], [70, 40], [66, 47, 59, 48], [55, 49]], 'g'],
      ['path', [[54, 49], [60, 50, 64, 54], [68, 54], [62, 57, 57, 54], [54, 51]], 'g2'],
    ] },
    // big head
    { n: 'head', parent: 'body', p: [37, 47], z: 3, s: [
      ['ell', 36, 34, 15, 14.5, 'r'],
      ['ell', 42, 41, 3.2, 1.6, 'pk', { flat: true, line: false }],
      ['ell', 23, 40, 2, 1.3, 'pk', { flat: true, line: false }],
      ['line', [[41, 40], [40, 42]], '#e0465a'], ['line', [[43, 40], [42, 42]], '#e0465a'], ['line', [[45, 40], [44, 42]], '#e0465a'],
      // angry brows
      ['cap', 31, 27.5, 41, 23.5, 1.7, 1.3, 'br', { flat: true }],
      ['cap', 21, 25, 27, 27.5, 1.3, 1.6, 'br', { flat: true }],
    ] },
    // pepper crest (three chilis fanning like a mohawk)
    { n: 'crest', parent: 'head', p: [37, 22], z: -1, s: [
      ['curve', [[44, 23], [48, 16], [53, 12], [57, 14]], 3.2, 1, 'p', { gloss: true }],
      ['curve', [[37, 21.5], [37, 13], [39, 6], [43, 3.5]], 3.6, 1, 'p', { gloss: true }],
      ['curve', [[31, 23], [27, 16], [22, 11], [18.5, 12.5]], 3.4, 1, 'p', { gloss: true }],
      ['ell', 44, 23, 3, 1.8, 'g'], ['ell', 37, 21.8, 3.2, 1.8, 'g'], ['ell', 31, 23, 3, 1.8, 'g'],
    ] },
    // beak, open in a grin, chomping a green chili
    { n: 'jaw', parent: 'head', p: [25, 40], z: 2, s: [
      ['path', [[26, 34], [19, 35], [12, 38.5], [19, 40.5], [26, 40]], 'y2', { gloss: true }],
      ['path', [[25, 41], [18, 41.5], [21, 44.5], [26, 43.5]], 'y2'],
      ['ell', 21, 41, 3.2, 1.1, 'm', { flat: true, line: false }],
      ['curve', [[20, 41], [15, 43], [11.5, 46.5]], 2.7, 1.6, 'gp', { gloss: true }],
      ['ell', 20.5, 40.8, 2, 1.4, 'g2'],
      ['circ', 11, 47, 1.3, '#ff7a2a', { glow: true, line: false }],
    ] },
    // comic waterfall tears, streaming outward
    { n: 'tears', parent: 'head', p: [36, 38], z: 4, s: [
      ['curve', [[37, 37], [39, 41], [42.5, 44], [44, 48]], 1.3, 2.1, 't', { flat: true, line: false }],
      ['curve', [[26, 37.5], [24.5, 41], [22, 43.5], [20.5, 46.5]], 1.1, 1.8, 't', { flat: true, line: false }],
      ['circ', 45.5, 51.5, 1.4, 't', { flat: true, line: false }], ['circ', 19, 50, 1.1, 't', { flat: true, line: false }], ['circ', 48, 47, 0.9, 't', { flat: true, line: false }],
      ['line', [[38, 38.5], [40.5, 42]], '#ffffff'], ['line', [[25.5, 39], [24, 41.5]], '#ffffff'],
    ] },
    // near wing, flexed up like a fist
    { n: 'wingR', parent: 'body', p: [52, 55], z: 5, s: [['path', [[49, 57], [52, 49, 57, 44], [60, 38], [64, 40], [62, 43], [66, 44], [63, 47], [65, 50], [60, 52, 53, 60]], 'r']] },
  ],
  eyes: [
    Object.assign({ part: 'head', x: 26, y: 32, iris: '#ffb21e' }, CHICK_EYE_F),
    Object.assign({ part: 'head', x: 36, y: 32, iris: '#ffb21e' }, CHICK_EYE_N),
  ],
  bond: { grow: { crest: 1.3 }, aura: 'flame', auraColor: '#ff7a2a' },
  fx: [{ part: 'crest', x: 43, y: 3, type: 'smoke', rate: 0.5 }, { part: 'jaw', x: 11, y: 47, type: 'smoke', rate: 0.6 }, { part: 'tears', x: 45, y: 51, type: 'tear', rate: 0.9 }],
};
