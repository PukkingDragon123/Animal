// Starter Tokonmon as 3D models for the 3D → pixel renderer (src/px/sdf.js).
// Units ≈ sprite pixels; y up, ground at y = 0, the creature faces +z.
export const SPRITES = {};

// ---------------------------------------------------------------- helpers
// mirror a left part (+x) into its right twin (−x)
function mirror(p) {
  const fx = (v) => (Array.isArray(v) && typeof v[0] === 'number' ? [-v[0], ...v.slice(1)] : v);
  const shape = (s) => {
    const out = s.map((v, i) => {
      if (i === 0) return v;
      if (s[0] === 'chain' && i === 1) return v.map((q) => [-q[0], q[1], q[2], q[3]]);
      if (Array.isArray(v) && v.length === 3 && typeof v[0] === 'number' && !(s[0] === 'ell' && i === 2) && !(s[0] === 'box' && i === 2)) return fx(v);
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const o = Object.assign({}, v);
        if (o.rot) o.rot = [o.rot[0], -o.rot[1], -o.rot[2]];
        if (o.grad) o.grad = Object.assign({}, o.grad, { a: fx(o.grad.a), b: fx(o.grad.b) });
        if (o.minus) o.minus = shape(o.minus);
        if (o.on) o.on = o.on.map((n) => n.replace(/L$/, 'R'));
        return o;
      }
      return v;
    });
    return out;
  };
  return Object.assign({}, p, { n: p.n.replace(/L$/, 'R'), parent: p.parent && p.parent.replace(/L$/, 'R'), p: fx(p.p), s: p.s.map(shape) });
}
const both = (p) => [p, mirror(p)];
const paintOn = (on, extra = {}) => Object.assign({ paint: true, on }, extra);

// ---------------------------------------------------------------- Chilichick (Pyro)
// A tiny, round, chubby fire chick that never lets go of its chili pepper. It
// hugs a big glossy chili in both wings, nibbles it constantly, cries from the
// heat (its eyes are always watery) and breathes the heat back out as fire.
// A little three-feather flame tuft on its head flickers when it gets fired up.
{
  const E = 6.6, EY = 33.4, EZ = 15.2;       // eye centre (x mirrored), eye height, surface depth
  const eyeL = (x) => [
    ['ell', [x, EY, EZ], [3.5, 4.7, 5], 'eye', paintOn(['body'])],
    ['ell', [x + 0.2 * Math.sign(x), EY - 1.5, EZ + 0.5], [2.6, 2.7, 5], 'iris', paintOn(['body'])],
    ['ell', [x, EY - 2.4, EZ + 0.6], [1.7, 1.2, 5], 'iris2', paintOn(['body'])],
    ['ell', [x - 1.2, EY + 1.9, EZ + 1], [1.5, 1.7, 4], 'shine', paintOn(['body'])],
    ['ell', [x + 1.3, EY - 2.3, EZ + 1], [0.75, 0.75, 4], 'shine', paintOn(['body'])],
  ];
  const lid = (x, rz, y = EY + 3.6) => ['ell', [x, y, EZ], [4.4, 2.4, 5], 'down', paintOn(['body'], { rot: [0, 0, rz] })];
  const line = (x, y, rz, len = 3.2) => ['ell', [x, y, EZ + 0.4], [len, 0.75, 5], 'eye', paintOn(['body'], { rot: [0, 0, rz] })];
  const flameGrad = (a, b) => ({ a, b, stops: [[0, 'down'], [0.4, 'down2'], [0.75, 'ember']] });
  const fireGrad = (a, b) => ({ a, b, stops: [[0, 'fCore'], [0.14, 'fY'], [0.42, 'fO'], [0.76, 'fR']] });
  // the chili it hugs: a fat glossy pod lying across its belly, calyx + curly stem on the right
  const POD = [[-12.5, 9.6, 16.4, 1.5], [-8, 11.6, 19.6, 3.3], [-2, 13.6, 21, 4.3], [4.2, 15.6, 20.6, 4.1], [9.6, 17.6, 18.2, 3.2]];
  SPRITES.chilichick = {
    id: 'chilichick', size: [96, 96], anchor: [48, 91], unit: 1, yaw: -22, pitch: 16, ink: '#33140e',
    pal: {
      down: '#ffc63e', down2: '#ff9c2a', ember: '#ec4a28', belly: '#fff0c4',
      beak: { c: '#ff8414', gloss: true }, beakD: '#cc5410', mouthIn: '#8c1c2a', tongue: '#ff6f86',
      eye: '#22100e', iris: '#7a2a1a', iris2: '#c0582a', shine: { c: '#ffffff', flat: true }, blush: '#ff8a80',
      tear: { c: '#9fe8ff', gloss: true }, foot: '#e0782a',
      chiliP: { c: '#ee2a26', gloss: true, ramp: ['#3c0a1e', '#7a1028', '#b0182a', '#e8282a', '#ff5034', '#ffa080'] },
      leaf: { c: '#4aa83a', ramp: ['#0f2a1e', '#1f5a2e', '#2e7f34', '#4aa83a', '#7cc94a', '#c4ec7a'] }, stem: { c: '#3a8a34', ramp: ['#0f2a1e', '#1f5a2e', '#2a7030', '#3a8a34', '#62ad40', '#a8dc6a'] },
      fCore: { c: '#fffbe0', emit: true, heat: 1 }, fY: { c: '#ffd23a', emit: true, heat: 0.78 }, fO: { c: '#ff8a1e', emit: true, heat: 0.58 }, fR: { c: '#e8382a', emit: true, heat: 0.4 },
      heart: { c: '#ff4f7e', gloss: true }, zz: { c: '#cfe6ff', flat: true }, steam: '#fff4ec',
    },
    anim: { bob: 1.3, sway: 1.1, lag: 1.2, hop: 1.3 },
    pad: { breath: [72, 8, 0, 0], throw: [56, 0, 0, 0], dash: [0, 0, 24, 0], eat: [16, 0, 0, 0] },
    parts: [
      // ---- one round, chubby body (head and body are a single ball, chick-style)
      { n: 'body', p: [0, 18, 0], noShadow: true, s: [
        ['ell', [0, 20, 0], [18.5, 17.5, 17.5], 'down', { grad: { a: [0, 40, 0], b: [0, 4, 0], stops: [[0, 'down'], [0.66, 'down2']] } }],
        ['ell', [0, 33, 2], [14.5, 12.5, 13.5], 'down', { k: 9 }],
        // fluffy cheek tufts that stick out a little at the sides
        ...[1, -1].map((sx) => ['ell', [sx * 15.5, 27.5, 5], [4.2, 3.6, 4.2], 'down', { k: 3 }]),
        ['ell', [0, 15.5, 13.5], [11.5, 10, 7.5], 'belly', paintOn(['body'])],
        ...[-7.6, -3.8, 0, 3.8, 7.6].map((x) => ['sph', [x, 24.4 - 0.04 * x * x, 14], 2.3, 'belly', paintOn(['body'])]),
        ...eyeL(E), ...eyeL(-E),
        // the watery lower lid it always has + rosy cheeks
        ...[E, -E].map((x) => ['ell', [x, EY - 4.4, EZ + 0.3], [3.2, 0.7, 5], 'tear', paintOn(['body'])]),
        ...[E + 4.4, -E - 4.4].map((x) => ['ell', [x, 28.6, 12.8], [3.2, 1.9, 4], 'blush', paintOn(['body'])]),
      ] },
      { n: 'lids', parent: 'body', p: [0, EY, EZ], show: 'fierce', s: [lid(E, 14), lid(-E, -14), line(E + 0.4, EY + 3.3, 16, 3.8), line(-E - 0.4, EY + 3.3, -16, 3.8)] },
      { n: 'eyesClosed', parent: 'body', p: [0, EY, EZ], show: 'closed', s: [line(E, EY - 1, 0), line(-E, EY - 1, 0)] },
      { n: 'eyesHappy', parent: 'body', p: [0, EY, EZ], show: 'happy', s: [line(E - 1.4, EY, 34, 2), line(E + 1.4, EY, -34, 2), line(-E - 1.4, EY, 34, 2), line(-E + 1.4, EY, -34, 2)] },
      { n: 'eyesHurt', parent: 'body', p: [0, EY, EZ], show: 'hurt', s: [line(E + 0.6, EY + 1.2, 28, 2.2), line(E + 0.6, EY - 1.2, -28, 2.2), line(-E - 0.6, EY + 1.2, -28, 2.2), line(-E - 0.6, EY - 1.2, 28, 2.2)] },
      { n: 'eyesKO', parent: 'body', p: [0, EY, EZ], show: 'ko', s: [line(E, EY, 45, 2.6), line(E, EY, -45, 2.6), line(-E, EY, 45, 2.6), line(-E, EY, -45, 2.6)] },
      { n: 'teary', parent: 'body', p: [0, EY, EZ], show: 'teary', s: [E, -E].map((x) => ['ell', [x, EY - 2.6, EZ + 0.6], [3, 1.6, 5], 'tear', paintOn(['body'])]) },
      // small beak + jaw
      { n: 'beak', parent: 'body', p: [0, 28, 16], s: [
        ['ell', [0, 28.6, 15.8], [3.2, 2.1, 2.5], 'beak'],
        ['cone', [0, 28.4, 16.2], [0, 26.8, 20.4], 2.5, 0.65, 'beak', { k: 1.4 }],
      ] },
      { n: 'jaw', parent: 'beak', p: [0, 26.9, 15.6], s: [['cone', [0, 26.8, 15.8], [0, 25.8, 19], 2.2, 0.6, 'beakD']] },
      { n: 'mouth', parent: 'beak', p: [0, 27, 16], show: 'mouth:open', s: [['ell', [0, 26.6, 16.4], [2.3, 1.5, 2.3], 'mouthIn'], ['ell', [0, 26, 17.2], [1.3, 0.7, 1.3], 'tongue']] },
      // three rounded flame feathers on the head
      { n: 'crest', parent: 'body', p: [0, 44, 1], s: [
        ['cone', [0, 43, 2], [0.8, 53.5, -0.5], 4.4, 2.1, 'down', { k: 2.6, grad: flameGrad([0, 44, 2], [0.8, 54, -0.5]) }],
        ['cone', [-4, 42.5, 2.5], [-8.4, 50, 1.4], 3.6, 1.7, 'down', { k: 2.4, grad: flameGrad([-4, 43, 2.5], [-8.4, 50.5, 1.4]) }],
        ['cone', [4, 42.5, 2.5], [8.6, 49.6, 1.8], 3.6, 1.7, 'down', { k: 2.4, grad: flameGrad([4, 43, 2.5], [8.6, 50, 1.8]) }],
      ] },
      // stubby feet
      ...both({ n: 'legL', parent: 'body', p: [7, 5, 3], s: [
        ['cone', [7, 5, 3], [7.3, 1.8, 4], 2, 1.6, 'foot'],
        ['cone', [7.3, 1.4, 4.4], [6.2, 0.9, 9], 1.2, 0.9, 'foot'], ['cone', [7.3, 1.4, 4.4], [10.2, 0.9, 8], 1.1, 0.8, 'foot'], ['cone', [7.3, 1.4, 4.4], [3.8, 0.9, 7.8], 1.1, 0.8, 'foot'],
      ] }),
      // flame tail tuft
      { n: 'tail', parent: 'body', p: [0, 18, -15], s: [
        ['cone', [-3, 18, -15], [-6.5, 23.5, -23], 2.8, 1.1, 'down', { k: 1.6, grad: flameGrad([-3, 18, -15], [-6.5, 23.5, -23]) }],
        ['cone', [3, 18, -15], [6.5, 23.5, -23], 2.8, 1.1, 'down', { k: 1.6, grad: flameGrad([3, 18, -15], [6.5, 23.5, -23]) }],
        ['cone', [0, 19, -16], [0, 26.5, -24], 3, 1.2, 'down', { k: 1.6, grad: flameGrad([0, 19, -16], [0, 26.5, -24]) }],
      ] },
      // stubby wings wrapped around the chili it hugs
      ...both({ n: 'wingL', parent: 'body', p: [14, 22, 6], s: [
        ['ell', [14.6, 18, 11], [4, 7.6, 5.6], 'down', { rot: [-34, -26, 26], grad: flameGrad([14, 25, 7], [11, 12, 19]) }],
        // the wing tip wrapped over the chili's end, like a little hand
        ['ell', [10.4, 14.4, 20.4], [3.4, 3.8, 2.6], 'down2', { k: 2.2, grad: { a: [11, 18, 20], b: [9, 11, 21], stops: [[0, 'down2'], [0.6, 'ember']] } }],
      ] }),
      // the chili: held in its wings (hidden while it is eaten or thrown)
      { n: 'chiliHand', parent: 'body', p: [0, 18, 19], show: '!noHand', s: [
        ['chain', POD, 'chiliP', { k: 0.6 }],
        ['ell', [11.4, 18.4, 17.4], [2.8, 2.2, 2.6], 'leaf', { k: 1 }],
        ...[0, 1, 2].map((i) => ['cone', [11.4, 18.6, 17.4], [11.4 + [2.8, 0.4, 3.4][i], 18.8 + [-2.2, -2.8, 1][i], 17.4 + [0.6, 2.2, -1.6][i]], 1.5, 0.4, 'leaf', { k: 0.8 }]),
        ['chain', [[12, 20, 17.2, 0.9], [13.6, 22.8, 16.8, 0.75], [12.6, 25, 16, 0.6]], 'stem', { k: 0.6 }],
      ] },
      // ---- props + effects
      { n: 'tears', parent: 'body', p: [0, 29, 15], show: 'tears', s: [
        ...[E, -E].map((x) => ['chain', [[x, 28.6, 15.6, 0.9], [x * 1.25, 24, 15, 1.3], [x * 1.45, 19, 13.4, 1.6]], 'tear']),
        ['sph', [19, 38, 7], 1.4, 'tear'], ['sph', [-19, 39, 7], 1.2, 'tear'], ['sph', [21, 32, 5], 1, 'tear'],
      ] },
      ...['fire', 'fire2', 'fire3', 'fire4'].map((n, i) => {
        const a = [0, 26.6, 20], b = [[0, 29, 73], [6, 37, 57], [-6, 20, 59], [0, 27, 43]][i], r = [[2.2, 11], [1.6, 6.5], [1.6, 6.5], [1.6, 6]][i];
        const g = i === 3 ? { a, b, stops: [[0, 'fCore'], [0.5, 'fY'], [0.9, 'fO']] } : fireGrad(a, b);
        return { n, parent: 'beak', p: a, show: 'fire', s: [
          ['cone', a, b, r[0], r[1], 'fY', { grad: g, wob: 1.6 }],
          ...(i === 0 ? [['sph', [4, 34, 63], 6.5, 'fO', { k: 5, grad: g, wob: 2 }], ['sph', [-5, 23, 67], 6, 'fO', { k: 5, grad: g, wob: 2 }], ['sph', [1, 30, 79], 6.5, 'fR', { k: 6, grad: g, wob: 2.4 }],
            ['sph', [6, 40, 75], 3, 'fR', { grad: g, wob: 1 }], ['sph', [-6, 17, 77], 2.6, 'fR', { grad: g, wob: 1 }]] : []),
        ] };
      }),
      { n: 'chili', parent: 'beak', p: [0, 26.6, 20], show: 'chili', s: [
        ['chain', [[0, 26.6, 19.6, 1.6], [1.6, 25, 24.4, 2.8], [3.6, 23.8, 29.4, 2.6], [5.2, 24.4, 32.8, 1.6]], 'chiliP'],
        ['sph', [5.4, 24.8, 33.2], 1.9, 'leaf'], ['cone', [5.6, 25.2, 33.6], [6.8, 28.2, 35.4], 0.75, 0.55, 'stem'],
      ] },
      { n: 'chiliFly', p: [0, 30, 24], show: 'chiliFly', s: [
        ['chain', [[0, 30, 20, 1.5], [0, 28.6, 24.6, 2.7], [0, 29.4, 29.6, 2.5], [0, 31.6, 33, 1.4]], 'chiliP'],
        ['sph', [0, 30, 19], 1.9, 'leaf'],
      ] },
      ...[[6, 20, -12, 12, 28, -42], [-7, 18, -12, -14, 24, -44], [0, 30, -10, 0, 42, -38]].map(([x0, y0, z0, x1, y1, z1], i) => ({ n: 'dashfire' + i, parent: 'body', p: [x0, y0, z0], show: 'dashfire', s: [
        ['cone', [x0, y0, z0], [x1, y1, z1], 5, 1.2, 'fY', { grad: fireGrad([x0, y0, z0], [x1, y1, z1]) }]] })),
      ...[100, 128, 152, 180, 208, 232, 260].map((a, i) => { const r = a * Math.PI / 180, x = Math.sin(r) * 19, z = Math.cos(r) * 15 - 4, h = 36 + (i % 3) * 8 + (i === 3 ? 9 : 0); return { n: 'aura' + i, p: [x, 0, z], show: 'aura', s: [
        ['cone', [x, 4, z], [x * 1.18, h, z * 1.1], 6.4, 0.6, 'fY', { grad: { a: [x, 0, z], b: [x, h, z], stops: [[0, 'fY'], [0.3, 'fO'], [0.7, 'fR']] } }],
        ['cone', [x * 1.05, h * 0.55, z], [x * 1.45, h * 0.86, z * 1.15], 3.2, 0.5, 'fO', { k: 2, grad: { a: [x, 0, z], b: [x, h, z], stops: [[0, 'fY'], [0.3, 'fO'], [0.7, 'fR']] } }]] }; }),
      ...[[-17, 54, 6, 3.4], [18, 60, 2, 2.8]].map(([x, y, z, r], i) => ({ n: 'heart' + i, p: [x, y, z], bill: true, show: 'hearts', s: [
        ['sph', [x - r * 0.5, y + r * 0.3, z], r * 0.62, 'heart'], ['sph', [x + r * 0.5, y + r * 0.3, z], r * 0.62, 'heart'],
        ['cone', [x, y + r * 0.1, z], [x, y - r * 1, z], r * 0.75, r * 0.12, 'heart', { k: r * 0.4 }]] })),
      ...[0, 1, 2].map((i) => ({ n: 'zz' + i, p: [14, 48, 0], bill: true, show: 'zz', s: [
        ['box', [14, 51, 0], [3, 0.7, 0.7], 0.3, 'zz'], ['box', [14, 45, 0], [3, 0.7, 0.7], 0.3, 'zz'], ['box', [14, 48, 0], [3.9, 0.7, 0.7], 0.3, 'zz', { rot: [0, 0, 52] }]] })),
      ...[[-17, 48, 4], [17, 50, 2]].map(([x, y, z], i) => ({ n: 'steam' + i, p: [x, y, z], bill: true, show: 'steam', s: [
        ['sph', [x, y, z], 3.4, 'steam'], ['sph', [x + 2.6 * Math.sign(x), y + 2.6, z], 2.3, 'steam', { k: 1.5 }], ['sph', [x - 1.2 * Math.sign(x), y + 3.4, z], 2, 'steam', { k: 1.5 }]] })),
    ],
    bond: { grow: { crest: 1.45, tail: 1.2 } },
  };
}

// ---------------------------------------------------------------- Bubblion (Aqua)
// A little lionfish prince that swims through the air in its own "soft & wet"
// bubbles. Its striped ribbon fins flow like a lion's mane, it wears a tiny gold
// crown with a sea-glass gem, and it pouts like royalty when it doesn't get its way.
{
  const E = 7.6, EY = 33.6, EZ = 13;
  const eye = (x) => [
    ['ell', [x, EY, EZ], [3.4, 4.3, 5], 'eye', paintOn(['body'])],
    ['ell', [x, EY - 1.4, EZ + 0.4], [2.6, 2.6, 5], 'iris', paintOn(['body'])],
    ['ell', [x - 1.1, EY + 1.6, EZ + 1], [1.4, 1.5, 4], 'shine', paintOn(['body'])],
    ['ell', [x + 1.2, EY - 2, EZ + 1], [0.7, 0.7, 4], 'shine', paintOn(['body'])],
  ];
  const line = (x, y, rz, len = 3) => ['ell', [x, y, EZ + 0.4], [len, 0.7, 5], 'eye', paintOn(['body'], { rot: [0, 0, rz] })];
  const ribbon = (a, b, w, i) => ['cone', a, b, w, 0.6, 'finA', { k: 0.8, grad: { a, b, stops: [[0, 'finA'], [0.22, 'finB'], [0.42, 'finA'], [0.62, 'finC'], [0.82, 'finA']] } }];
  SPRITES.bubblion = {
    id: 'bubblion', size: [96, 96], anchor: [48, 91], unit: 1, yaw: -24, pitch: 16, ink: '#2a1830',
    pal: {
      body: '#ffb48e', body2: '#f08066', belly: '#fff2e0', stripe: '#c0485a', mane: '#e84a56', ray: '#fff0dc', spine: '#fff4ea', spine2: '#a82a46',
      finA: '#fff4ea', finB: '#ff8a70', finC: '#b23a52',
      crown: { c: '#ffc83a', gloss: true, ramp: ['#5a2a18', '#9a5a1e', '#d08a26', '#ffc83a', '#ffe680', '#fffbe0'] }, gem: { c: '#3ad0d8', gloss: true },
      eye: '#1e1430', iris: '#2a5a9a', shine: { c: '#ffffff', flat: true }, lips: '#ff5a7a', blush: '#ff9aa8',
      bub: { c: '#bff4ff', gloss: true, ramp: ['#3a6a9a', '#5aa0c8', '#8ad4ec', '#bff4ff', '#e4fcff', '#ffffff'] },
      water: { c: '#7fd8f0', gloss: true, ramp: ['#1e4a7a', '#3a86c0', '#5ab8e0', '#8ad8f0', '#bfeeff', '#ffffff'] },
      heart: { c: '#ff4f7e', gloss: true }, zz: { c: '#cfe6ff', flat: true }, steam: '#fff4ec',
      fCore: { c: '#f4ffff', emit: true, heat: 1, fire: ['#1a3a7a', '#2a6ab8', '#3aa0e0', '#6ad8f8', '#b8f4ff', '#ffffff'] },
      fY: { c: '#8ae8ff', emit: true, heat: 0.75, fire: ['#1a3a7a', '#2a6ab8', '#3aa0e0', '#6ad8f8', '#b8f4ff', '#ffffff'] },
    },
    anim: { bob: 1.6, sway: 1.3, lag: 1.5, flap: 1.4 },
    pad: { breath: [72, 8, 0, 0], throw: [56, 0, 0, 0], dash: [0, 0, 24, 0] },
    parts: [
      // floating body (no legs): chubby and round, bold lionfish bands
      { n: 'body', p: [0, 30, 0], noShadow: true, s: [
        ['ell', [0, 30, 0], [15.5, 15, 17], 'body', { grad: { a: [0, 0, 17], b: [0, 0, -17], stops: [[0, 'body'], [0.3, 'stripe'], [0.39, 'body'], [0.56, 'stripe'], [0.65, 'body'], [0.8, 'stripe'], [0.88, 'body']] } }],
        ['ell', [0, 24, 8], [11, 8.5, 10], 'belly', paintOn(['body'])],
        ...eye(E), ...eye(-E),
        ...[E + 3.4, -E - 3.4].map((x) => ['ell', [x, 28.4, 12], [2.8, 1.7, 4], 'blush', paintOn(['body'])]),
      ] },
      { n: 'lids', parent: 'body', p: [0, EY, EZ], show: 'fierce', s: [E, -E].map((x) => ['ell', [x, EY + 3.8, EZ], [4.4, 2.4, 5], 'body', paintOn(['body'], { rot: [0, 0, x > 0 ? 14 : -14] })]) },
      { n: 'eyesClosed', parent: 'body', p: [0, EY, EZ], show: ['closed', 'happy', 'hurt', 'ko'], s: [line(E, EY - 0.6, 0), line(-E, EY - 0.6, 0)] },
      // pouty lips that open
      { n: 'jaw', parent: 'body', p: [0, 25.4, 15.4], s: [['ell', [0, 25.6, 15.6], [2.6, 1.5, 1.8], 'lips', { k: 0.8 }], ['ell', [0, 27.2, 15.4], [2.4, 1.2, 1.7], 'lips', { k: 0.8 }]] },
      { n: 'mouth', parent: 'body', p: [0, 26, 15], show: 'mouth:open', s: [['ell', [0, 25.4, 16.4], [1.7, 1.4, 1.2], 'eye']] },
      // the mane: a pale fin-membrane collar behind the face with striped lionfish spines radiating out of it
      { n: 'tuftMane', parent: 'body', p: [0, 32, 0], s: [
        ['ell', [0, 33, -2.5], [20, 19.5, 2.2], 'mane', { k: 2 }],
        ...[-40, -10, 20, 50, 75, 105, 130, 160, 190, 220].map((a) => { const r = a * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r); const A = [c * 15, 33 + sn * 14.5, -2], Bp = [c * 24, 33 + sn * 23, -5]; return ['cone', A, Bp, 2.4, 0.5, 'spine', { k: 1.2, grad: { a: A, b: Bp, stops: [[0, 'spine2'], [0.2, 'spine'], [0.42, 'spine2'], [0.6, 'spine'], [0.8, 'spine2']] } }]; }),
        ...[15, 45, 75, 105, 135, 165].map((a) => ['ell', [0, 33, -2.5], [0.8, 20.5, 3.2], 'ray', paintOn(['tuftMane'], { rot: [0, 0, a] })]),
      ] },
      // small fan pectoral fins
      ...both({ n: 'wingL', parent: 'body', p: [13, 24, 4], s: [
        ['ell', [17, 22, 2], [1.4, 5.5, 6], 'finA', { rot: [-20, 30, -30], grad: { a: [13, 24, 4], b: [22, 18, -2], stops: [[0, 'finB'], [0.4, 'finA'], [0.75, 'finC']] } }],
      ] }),
      // tail fan
      { n: 'tail', parent: 'body', p: [0, 30, -16], s: [
        ['ell', [0, 31, -21], [1.5, 8.5, 6], 'finA', { rot: [12, 0, 0], k: 2.5, grad: { a: [0, 31, -16], b: [0, 31, -27], stops: [[0, 'finB'], [0.35, 'finA'], [0.65, 'finC'], [0.85, 'finA']] } }],
      ] },
      // tiny crown + gem, and two curly feelers
      { n: 'crown', parent: 'body', p: [0, 44.6, 6], s: [
        ['tor', [0, 44.6, 6], 4.8, 1.15, 'crown', { k: 0.6 }],
        ...[0, 72, 144, 216, 288].map((a) => { const r = a * Math.PI / 180; return ['cone', [Math.sin(r) * 4.8, 45, 6 + Math.cos(r) * 4.8], [Math.sin(r) * 5.1, 49.6, 6 + Math.cos(r) * 5.1], 1.25, 0.35, 'crown', { k: 0.8 }]; }),
        ['sph', [0, 45.4, 11], 1.5, 'gem'],
      ] },
      // the soft & wet water ball it lives in
      { n: 'ball', parent: 'body', p: [0, 31, -2], glass: true, s: [['sph', [0, 31, -2], 26.5, 'water']] },
      // bubbles: a ring of floating bubbles (idle), blown bubbles (attacks)
      ...[[-29, 50, 6, 2.2], [27, 60, 2, 1.6], [-31, 22, -4, 1.4], [29, 14, 8, 1.2]].map(([x, y, z, r], i) => ({ n: 'bubble' + i, p: [x, y, z], bill: true, s: [['sph', [x, y, z], r, 'bub']] })),
      ...['fire', 'fire2', 'fire3'].map((n, i) => {
        const a = [0, 25.6, 15], b = [[0, 28, 70], [6, 36, 54], [-6, 20, 56]][i];
        return { n, parent: 'body', p: a, show: 'fire', s: [
          ['sph', [b[0] * 0.45, a[1] + (b[1] - a[1]) * 0.45, a[2] + (b[2] - a[2]) * 0.45], 3.2 + i, 'bub'],
          ['sph', b, 5.5 - i, 'bub'],
          ['cone', a, b, 1.2, 3.2, 'fY', { wob: 1.2, grad: { a, b, stops: [[0, 'fCore'], [0.4, 'fY']] } }],
        ] };
      }),
      ...[[-16, 64, 6, 3.4], [17, 72, 2, 2.8]].map(([x, y, z, r], i) => ({ n: 'heart' + i, p: [x, y, z], bill: true, show: 'hearts', s: [
        ['sph', [x - r * 0.5, y + r * 0.3, z], r * 0.62, 'heart'], ['sph', [x + r * 0.5, y + r * 0.3, z], r * 0.62, 'heart'],
        ['cone', [x, y + r * 0.1, z], [x, y - r * 1, z], r * 0.75, r * 0.12, 'heart', { k: r * 0.4 }]] })),
      ...[0, 1, 2].map((i) => ({ n: 'zz' + i, p: [14, 54, 0], bill: true, show: 'zz', s: [
        ['box', [14, 57, 0], [3, 0.7, 0.7], 0.3, 'zz'], ['box', [14, 51, 0], [3, 0.7, 0.7], 0.3, 'zz'], ['box', [14, 54, 0], [3.9, 0.7, 0.7], 0.3, 'zz', { rot: [0, 0, 52] }]] })),
    ],
    bond: { grow: { tuftMane: 1.3, crown: 1.2 } },
  };
}

// ---------------------------------------------------------------- Strawbaa (Bio)
// A strawberry sheep from Strawberry Fields: its wool is a ripe strawberry (seeds
// and all) under a leafy calyx cap, it has a soft cream face, curly little horns
// and floppy ears. A gentle healer that plants strawberry vines and rams when pushed.
{
  const E = 5.8, EY = 27.6, EZ = 21.6;
  const eye = (x) => [
    ['ell', [x, EY, EZ], [2.9, 3.8, 4], 'eye', paintOn(['head'])],
    ['ell', [x, EY - 1.2, EZ + 0.4], [2.1, 2.1, 4], 'iris', paintOn(['head'])],
    ['ell', [x - 0.9, EY + 1.3, EZ + 0.8], [1.1, 1.2, 3], 'shine', paintOn(['head'])],
    ['ell', [x + 1, EY - 1.8, EZ + 0.8], [0.55, 0.55, 3], 'shine', paintOn(['head'])],
  ];
  const line = (x, y, rz, len = 2.4) => ['ell', [x, y, EZ + 0.3], [len, 0.6, 4], 'eye', paintOn(['head'], { rot: [0, 0, rz] })];
  // fluffy strawberry wool: overlapping puffs, a strawberry taper toward the rump
  const PUFFS = [[0, 26, 2, 12], [8, 23, -2, 9.5], [-8, 23, -2, 9.5], [0, 29, -8, 11], [6, 18, 5, 8], [-6, 18, 5, 8], [0, 18, -10, 9], [7, 29, 2, 8.5], [-7, 29, 2, 8.5], [0, 20, -16, 7], [5, 16, -12, 6.5], [-5, 16, -12, 6.5]];
  const puffs = PUFFS.map(([x, y, z, r]) => ['sph', [x, y, z], r, 'berry', { k: 3.2 }]);
  // seeds sit exactly on the wool surface: march out from the centre until we leave the puffs
  const inside = (x, y, z) => PUFFS.some(([a, b, c, r]) => (x - a) ** 2 + (y - b) ** 2 + (z - c) ** 2 < r * r);
  const seeds = [];
  for (let k = 0; k < 70; k++) {
    const yy = 1 - (k / 69) * 1.7, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), a = k * 2.399;
    const d = [Math.cos(a) * rr, yy, Math.sin(a) * rr];
    let t = 0; while (t < 30 && inside(d[0] * t, 23 + d[1] * t, -3 + d[2] * t)) t += 0.25;
    const p = [d[0] * (t - 0.4), 23 + d[1] * (t - 0.4), -3 + d[2] * (t - 0.4)];
    if (p[2] > 9 && Math.abs(p[0]) < 9 && p[1] < 32) continue;                 // keep the face clear
    seeds.push(['sph', p, 1.05, 'seed', paintOn(['body'])]);
  }
  SPRITES.strawbaa = {
    id: 'strawbaa', size: [96, 96], anchor: [48, 91], unit: 1, yaw: -26, pitch: 16, ink: '#3a1420',
    pal: {
      berry: { c: '#f2385a', ramp: ['#4a0c2a', '#8c1638', '#c42446', '#f2385a', '#ff6a78', '#ffb0a8'] }, seed: '#ffd85a',
      face: '#fff0e2', ear: '#ffc0c4', horn: '#f6dcc0', hoof: '#5a3a44', leaf: { c: '#5cb84a', ramp: ['#103020', '#24602c', '#3a8a3a', '#5cb84a', '#8ad860', '#ccf090'] }, stem: '#3c8a34',
      eye: '#2a1420', iris: '#5a2a3a', shine: { c: '#ffffff', flat: true }, blush: '#ff8aa0', nose: '#c86a7a',
      vine: { c: '#4aa040', ramp: ['#103020', '#24602c', '#3a8a3a', '#4aa040', '#7ccc54', '#c4ec80'] }, flower: { c: '#ffffff', flat: true },
      heart: { c: '#ff4f7e', gloss: true }, zz: { c: '#cfe6ff', flat: true }, steam: '#fff4ec',
      fCore: { c: '#f6fff0', emit: true, heat: 1, fire: ['#1a4a2a', '#2a7a3a', '#4ab04a', '#8ae070', '#c8f8a8', '#ffffff'] },
      fY: { c: '#a8f080', emit: true, heat: 0.75, fire: ['#1a4a2a', '#2a7a3a', '#4ab04a', '#8ae070', '#c8f8a8', '#ffffff'] },
    },
    anim: { bob: 1, sway: 1, lag: 1.2, hop: 1.1 },
    pad: { breath: [72, 8, 0, 0], throw: [56, 0, 0, 0], dash: [0, 0, 24, 0] },
    parts: [
      { n: 'body', p: [0, 18, 0], s: [...puffs, ...seeds] },
      ...both({ n: 'legFL', parent: 'body', p: [5.5, 9, 8], s: [['cone', [5.5, 10, 8], [5.6, 2.4, 8.4], 2.7, 2.4, 'hoof'], ['ell', [5.6, 1.8, 8.9], [2.8, 1.8, 3.1], 'hoof']] }),
      ...both({ n: 'legBL', parent: 'body', p: [5.5, 9, -11], s: [['cone', [5.5, 10, -11], [5.6, 2.4, -11.2], 2.7, 2.4, 'hoof'], ['ell', [5.6, 1.8, -10.8], [2.8, 1.8, 3.1], 'hoof']] }),
      { n: 'tail', parent: 'body', p: [0, 20, -18], s: [['sph', [0, 21, -20], 3.6, 'berry', { k: 1.5 }]] },
      // head pokes out of the wool at the front
      { n: 'head', parent: 'body', p: [0, 25, 12], noShadow: true, s: [
        ['ell', [0, 26.4, 15.2], [10.6, 9.8, 8.2], 'face', { k: 2 }],
        ['ell', [0, 22.4, 20.8], [5.4, 4, 3.6], 'face', { k: 2.5 }],
        ['ell', [0, 23.4, 24.2], [1.7, 1.05, 1], 'nose', paintOn(['head'])],
        ...eye(E), ...eye(-E),
        ...[E + 2.6, -E - 2.6].map((x) => ['ell', [x, 23.2, 19.4], [2.3, 1.4, 3], 'blush', paintOn(['head'])]),
      ] },
      { n: 'eyesClosed', parent: 'head', p: [0, EY, EZ], show: ['closed', 'hurt', 'ko'], s: [line(E, EY - 0.6, 0), line(-E, EY - 0.6, 0)] },
      { n: 'eyesHappy', parent: 'head', p: [0, EY, EZ], show: 'happy', s: [line(E - 1, EY, 30, 1.6), line(E + 1, EY, -30, 1.6), line(-E - 1, EY, 30, 1.6), line(-E + 1, EY, -30, 1.6)] },
      { n: 'lids', parent: 'head', p: [0, EY, EZ], show: 'fierce', s: [E, -E].map((x) => ['ell', [x, EY + 2.8, EZ], [3.4, 1.8, 4], 'face', paintOn(['head'], { rot: [0, 0, x > 0 ? 14 : -14] })]) },
      { n: 'jaw', parent: 'head', p: [0, 20.8, 20.6], s: [['ell', [0, 20.4, 21.2], [2.4, 1.1, 1.7], 'face', { k: 1 }]] },
      { n: 'mouth', parent: 'head', p: [0, 21, 21.6], show: 'mouth:open', s: [['ell', [0, 20.9, 22.8], [1.6, 1.2, 1], 'eye']] },
      // floppy ears + little curled horns
      ...both({ n: 'earL', parent: 'head', p: [9, 28, 14], s: [['ell', [12.4, 26.4, 14.4], [4.8, 1.7, 2.6], 'ear', { rot: [0, 10, -30] }]] }),
      ...both({ n: 'hornL', parent: 'head', p: [7, 32, 15], s: [['tor', [8.4, 32.2, 16.4], 2.5, 1.25, 'horn', { rot: [0, 90, 0], k: 0.8 }]] }),
      // the calyx cap and stem
      { n: 'tuftCalyx', parent: 'body', p: [0, 38, 0], s: [
        ['ell', [0, 38.2, 0], [6.4, 2.4, 6.4], 'leaf', { k: 1.2 }],
        ...[0, 72, 144, 216, 288].map((a) => { const r = (a + 18) * Math.PI / 180; return ['cone', [Math.sin(r) * 3, 38.6, Math.cos(r) * 3], [Math.sin(r) * 11, 34.6, Math.cos(r) * 11], 2.9, 0.8, 'leaf', { k: 1.4 }]; }),
        ['chain', [[0, 39.2, 0, 1.5], [0.4, 43.4, 0.6, 1.2], [2.2, 45.8, -0.6, 1]], 'stem', { k: 0.8 }],
      ] },
      // strawberry vines (its gimmick) + small white flowers
      ...[[-22, 6], [22, 4], [-14, 20], [16, 22]].map(([x, z], i) => ({ n: 'vine' + i, p: [x, 0, z], show: 'vines', s: [
        ['chain', [[x, 0, z, 1.4], [x * 1.08, 6, z + 2, 1.1], [x * 1.02, 11, z - 1, 0.9], [x * 1.12, 14, z + 1, 0.7]], 'vine'],
        ['sph', [x * 1.12, 14.6, z + 1], 2.2, 'berry'], ['ell', [x * 1.06, 8, z + 2.4], [1.6, 0.7, 1.6], 'flower'],
      ] })),
      ...['fire', 'fire2', 'fire3'].map((n, i) => {
        const a = [0, 24, 22], b = [[0, 28, 70], [6, 36, 54], [-6, 20, 56]][i];
        return { n, parent: 'head', p: a, show: 'fire', s: [['cone', a, b, 1.6, 6 - i, 'fY', { wob: 1.4, grad: { a, b, stops: [[0, 'fCore'], [0.4, 'fY']] } }]] };
      }),
      ...[[-16, 56, 6, 3.4], [17, 64, 2, 2.8]].map(([x, y, z, r], i) => ({ n: 'heart' + i, p: [x, y, z], bill: true, show: 'hearts', s: [
        ['sph', [x - r * 0.5, y + r * 0.3, z], r * 0.62, 'heart'], ['sph', [x + r * 0.5, y + r * 0.3, z], r * 0.62, 'heart'],
        ['cone', [x, y + r * 0.1, z], [x, y - r * 1, z], r * 0.75, r * 0.12, 'heart', { k: r * 0.4 }]] })),
      ...[0, 1, 2].map((i) => ({ n: 'zz' + i, p: [14, 48, 0], bill: true, show: 'zz', s: [
        ['box', [14, 51, 0], [3, 0.7, 0.7], 0.3, 'zz'], ['box', [14, 45, 0], [3, 0.7, 0.7], 0.3, 'zz'], ['box', [14, 48, 0], [3.9, 0.7, 0.7], 0.3, 'zz', { rot: [0, 0, 52] }]] })),
    ],
    bond: { grow: { hornL: 1.8, hornR: 1.8 } },
  };
}
