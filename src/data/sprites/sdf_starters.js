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
// A fire chick that lives inside a hollowed-out chili pepper and wears it like a
// parka hood: the green calyx frames its face like hood trim, the stem curls up
// like an antenna and the pod's tip trails behind, burning like a fuse. Its eyes
// are always watery (it can never stop eating chilis), its cheeks are flushed,
// and when the heat gets too much it breathes it out as fire.
{
  const E = 6.9, EY = 46.2, EZ = 16.2;     // eye centre (x mirrored), eye height, surface depth
  const eyeL = (x) => [
    ['ell', [x, EY, EZ], [3.8, 5.3, 5], 'eye', paintOn(['head'])],
    ['ell', [x + 0.2 * Math.sign(x), EY - 1.7, EZ + 0.5], [2.9, 3, 5], 'iris', paintOn(['head'])],
    ['ell', [x, EY - 2.6, EZ + 0.6], [1.9, 1.4, 5], 'iris2', paintOn(['head'])],
    ['ell', [x - 1.3, EY + 2.1, EZ + 1], [1.6, 1.8, 4], 'shine', paintOn(['head'])],
    ['ell', [x + 1.4, EY - 2.5, EZ + 1], [0.8, 0.8, 4], 'shine', paintOn(['head'])],
  ];
  const lid = (x, rz, y = EY + 3.6) => ['ell', [x, y, EZ], [4.4, 2.4, 5], 'down', paintOn(['head'], { rot: [0, 0, rz] })];
  const line = (x, y, rz, len = 3.2) => ['ell', [x, y, EZ + 0.4], [len, 0.75, 5], 'eye', paintOn(['head'], { rot: [0, 0, rz] })];
  const flameGrad = (a, b) => ({ a, b, stops: [[0, 'down'], [0.45, 'down2'], [0.78, 'ember']] });
  const fireGrad = (a, b) => ({ a, b, stops: [[0, 'fCore'], [0.14, 'fY'], [0.42, 'fO'], [0.76, 'fR']] });
  // five pointed sepals fanning back over the hood
  const lobes = [18, 54, 90, 126, 162].map((a) => {
    const r = a * Math.PI / 180, R = 16.2;
    return ['cone', [Math.cos(r) * 14.2, 44.6 + Math.sin(r) * 14.2, 14.6], [Math.cos(r) * (R + 4.4), 44.6 + Math.sin(r) * (R + 4.4), 8.4], 2.6, 0.5, 'leaf', { k: 1.4 }];
  });
  SPRITES.chilichick = {
    id: 'chilichick', size: [96, 96], anchor: [48, 91], unit: 1, yaw: -24, pitch: 16, ink: '#33140e',
    pal: {
      down: '#ffc23a', down2: '#ff9a26', ember: '#ec4a28', belly: '#ffe8b0',
      chili: { c: '#e5222c', gloss: true, ramp: ['#3c0a1e', '#7a1028', '#b0182a', '#e0262c', '#ff4c34', '#ffa080'] }, chiliIn: '#ffd7a0',
      leaf: { c: '#4aa83a', ramp: ['#0f2a1e', '#1f5a2e', '#2e7f34', '#4aa83a', '#7cc94a', '#c4ec7a'] }, stem: { c: '#3a8a34', ramp: ['#0f2a1e', '#1f5a2e', '#2a7030', '#3a8a34', '#62ad40', '#a8dc6a'] },
      beak: { c: '#ff8414', gloss: true }, beakD: '#cc5410', mouthIn: '#8c1c2a', tongue: '#ff6f86',
      eye: '#22100e', iris: '#7a2a1a', iris2: '#c0582a', shine: { c: '#ffffff', flat: true }, blush: '#ff8a80',
      tear: { c: '#9fe8ff', gloss: true }, foot: '#d97a2c',
      fCore: { c: '#fffbe0', emit: true, heat: 1 }, fY: { c: '#ffd23a', emit: true, heat: 0.78 }, fO: { c: '#ff8a1e', emit: true, heat: 0.58 }, fR: { c: '#e8382a', emit: true, heat: 0.4 },
      chiliP: { c: '#ee2a26', gloss: true, ramp: ['#3c0a1e', '#7a1028', '#b0182a', '#e8282a', '#ff5034', '#ffa080'] }, heart: { c: '#ff4f7e', gloss: true }, zz: { c: '#cfe6ff', flat: true }, steam: '#fff4ec',
    },
    anim: { bob: 1.2, sway: 1.1, lag: 1.2, hop: 1.2 },
    pad: { breath: [72, 8, 0, 0], throw: [56, 0, 0, 0], dash: [0, 0, 24, 0], eat: [24, 0, 0, 0] },
    parts: [
      // ---- body
      { n: 'body', p: [0, 18, 0], s: [
        ['ell', [0, 21, 0], [17, 16.5, 15.5], 'down', { grad: { a: [0, 32, 0], b: [0, 6, 0], stops: [[0, 'down'], [0.6, 'down2']] } }],
        ['ell', [0, 15.5, 12], [9.5, 9.5, 8], 'belly', paintOn(['body'])],
        ...[-7, -3.5, 0, 3.5, 7].map((x) => ['sph', [x, 24.2 - 0.04 * x * x, 12.5], 2.2, 'belly', paintOn(['body'])]),
      ] },
      ...both({ n: 'legL', parent: 'body', p: [7, 8, 1], s: [
        ['cone', [7, 9, 1], [7.4, 2.2, 2], 2.3, 1.5, 'foot'],
        ['cone', [7.4, 1.6, 2.4], [6.2, 1, 8], 1.25, 0.85, 'foot'], ['cone', [7.4, 1.6, 2.4], [10.6, 1, 6.8], 1.1, 0.8, 'foot'],
        ['cone', [7.4, 1.6, 2.4], [3.6, 1, 6.4], 1.1, 0.8, 'foot'], ['cone', [7.4, 1.8, 2], [8, 1.1, -2.4], 1, 0.75, 'foot'],
      ] }),
      // tail: three flame-tipped feathers
      { n: 'tail', parent: 'body', p: [0, 14, -13], s: [
        ['cone', [-3.4, 14, -12], [-9.5, 17, -21], 2.6, 1, 'down', { grad: flameGrad([-3.4, 14, -12], [-9.5, 17, -21]) }],
        ['cone', [3.4, 14, -12], [9.5, 17, -21], 2.6, 1, 'down', { grad: flameGrad([3.4, 14, -12], [9.5, 17, -21]) }],
      ] },
      ...both({ n: 'wingL', parent: 'body', p: [14, 28, 0], s: [
        ['ell', [16.2, 22, -1], [4, 9.5, 10.5], 'down', { rot: [12, 0, -12], grad: flameGrad([16, 31, 2], [17, 11, -8]) }],
        ['ell', [17.4, 14, -6.5], [2, 5, 2.6], 'down2', { rot: [30, 0, -8], k: 1.5, grad: flameGrad([17, 19, -4], [17.4, 8, -9]) }],
      ] }),
      // ---- head (merges into the body)
      { n: 'head', parent: 'body', p: [0, 34, 2], noShadow: true, s: [
        ['ell', [0, 45, 3], [15.5, 14.6, 14.6], 'down', { k: 6 }],
        ...both({ s: [['ell', [10.8, 40.8, 13], [3.4, 2, 4], 'blush', paintOn(['head'])]], n: 'xL', p: [0, 0, 0] }).flatMap((x) => x.s),
      ] },
      // eyes (painted onto the head so they wrap the 3D surface)
      { n: 'eyes', parent: 'head', p: [0, EY, EZ], show: ['open', 'fierce', 'teary'], s: [...eyeL(E), ...eyeL(-E),
        // the watery lower lid it always has
        ...[E, -E].map((x) => ['ell', [x, EY - 4.4, EZ + 0.3], [3.2, 0.7, 5], 'tear', paintOn(['head'])])] },
      { n: 'lids', parent: 'head', p: [0, EY, EZ], show: 'fierce', s: [lid(E, 14), lid(-E, -14), line(E + 0.4, EY + 3.3, 16, 3.8), line(-E - 0.4, EY + 3.3, -16, 3.8)] },
      { n: 'eyesClosed', parent: 'head', p: [0, EY, EZ], show: 'closed', s: [line(E, EY - 1, 0), line(-E, EY - 1, 0)] },
      { n: 'eyesHappy', parent: 'head', p: [0, EY, EZ], show: 'happy', s: [line(E - 1.4, EY, 34, 2), line(E + 1.4, EY, -34, 2), line(-E - 1.4, EY, 34, 2), line(-E + 1.4, EY, -34, 2)] },
      { n: 'eyesHurt', parent: 'head', p: [0, EY, EZ], show: 'hurt', s: [line(E + 0.6, EY + 1.2, 28, 2.2), line(E + 0.6, EY - 1.2, -28, 2.2), line(-E - 0.6, EY + 1.2, -28, 2.2), line(-E - 0.6, EY - 1.2, 28, 2.2)] },
      { n: 'eyesKO', parent: 'head', p: [0, EY, EZ], show: 'ko', s: [line(E, EY, 45, 2.6), line(E, EY, -45, 2.6), line(-E, EY, 45, 2.6), line(-E, EY, -45, 2.6)] },
      { n: 'teary', parent: 'head', p: [0, EY, EZ], show: 'teary', s: [E, -E].map((x) => ['ell', [x, EY - 2.6, EZ + 0.6], [3, 1.6, 5], 'tear', paintOn(['head'])]) },
      // beak + jaw
      { n: 'beak', parent: 'head', p: [0, 40, 17], s: [
        ['ell', [0, 41.4, 17.4], [3.7, 2.3, 2.8], 'beak'],
        ['cone', [0, 41.2, 17.8], [0, 39.2, 22.6], 2.8, 0.7, 'beak', { k: 1.4 }],
      ] },
      { n: 'jaw', parent: 'beak', p: [0, 39.6, 16.6], s: [['cone', [0, 39.3, 16.8], [0, 38.3, 20.6], 2.5, 0.6, 'beakD']] },
      { n: 'mouth', parent: 'beak', p: [0, 39.6, 17], show: 'mouth:open', s: [['ell', [0, 39, 17.4], [2.4, 1.6, 2.4], 'mouthIn'], ['ell', [0, 38.4, 18.2], [1.4, 0.7, 1.4], 'tongue']] },
      // ---- the chili hood: the pod's stem end sits on its forehead, the pod runs over the head and hangs down the back
      { n: 'hood', parent: 'head', p: [0, 52, 0], s: [
        ['ell', [0, 47.8, -0.6], [16.6, 16.6, 17.2], 'chili', { minus: ['ell', [0, 43.6, 15.2], [14.6, 12.8, 10], { k: 1.4 }] }],
        ['ell', [0, 43.6, 15.2], [15.3, 13.5, 10.7], 'chiliIn', paintOn(['hood'])],
      ] },
      { n: 'hoodTail', parent: 'hood', p: [0, 46, -14], s: [
        ['chain', [[0, 47, -11, 8.8], [0, 41.5, -19.5, 6.8], [0, 35, -24.5, 5.2], [0, 30, -30, 4], [0, 30.5, -36.5, 2.9], [0, 35.5, -40, 1.8]], 'chili', { k: 4.5 }],
      ] },
      { n: 'flameTip', parent: 'hoodTail', p: [0, 36, -40.2], s: [
        ['cone', [0, 35.8, -40.2], [0, 43.8, -40.6], 2.6, 0.4, 'fY', { grad: { a: [0, 35.8, -40.2], b: [0, 43.8, -40.6], stops: [[0, 'fCore'], [0.3, 'fY'], [0.7, 'fO']] } }],
        ['sph', [0, 36.6, -40.2], 2.2, 'fO', { k: 1.5, grad: { a: [0, 35.8, -40.2], b: [0, 43.8, -40.6], stops: [[0, 'fCore'], [0.3, 'fY'], [0.7, 'fO']] } }],
      ] },
      // the calyx: a little leafy cap with a curly stem antenna
      { n: 'calyx', parent: 'hood', p: [0, 62.6, 8], s: [
        ['ell', [0, 62.8, 8], [6.6, 2.6, 6.4], 'leaf', { k: 1.4 }],
        ...[0, 72, 144, 216, 288].map((a) => { const r = (a + 36) * Math.PI / 180; return ['cone', [Math.sin(r) * 3.6, 63.2, 8 + Math.cos(r) * 3.6], [Math.sin(r) * 10.2, 59.6 - (Math.cos(r) > 0.3 ? 3 : 0), 8 + Math.cos(r) * 10.2], 2.9, 0.9, 'leaf', { k: 1.6 }]; }),
      ] },
      { n: 'stem', parent: 'calyx', p: [0, 64, 8], s: [['chain', [[0, 63.6, 8, 2], [0, 68.4, 9.6, 1.7], [0, 71.4, 12.6, 1.45], [0, 70.8, 15.8, 1.25]], 'stem', { k: 1.2 }]] },
      // ---- props + effects
      { n: 'tears', parent: 'head', p: [0, 42, 16], show: 'tears', s: [
        ...[E, -E].map((x) => ['chain', [[x, 41.6, 16.8, 0.9], [x * 1.25, 37, 16, 1.3], [x * 1.4, 32, 14.4, 1.6]], 'tear']),
        ['sph', [17, 50, 9], 1.4, 'tear'], ['sph', [-17, 51, 9], 1.2, 'tear'], ['sph', [19, 44, 7], 1, 'tear'],
      ] },
      ...['fire', 'fire2', 'fire3', 'fire4'].map((n, i) => {
        const a = [0, 39.4, 21], b = [[0, 42, 74], [6, 50, 58], [-6, 33, 60], [0, 40, 44]][i], r = [[2.2, 11], [1.6, 6.5], [1.6, 6.5], [1.6, 6]][i];
        const g = i === 3 ? { a, b, stops: [[0, 'fCore'], [0.5, 'fY'], [0.9, 'fO']] } : fireGrad(a, b);
        return { n, parent: 'beak', p: a, show: 'fire', s: [
          ['cone', a, b, r[0], r[1], 'fY', { grad: g, wob: 1.6 }],
          ...(i === 0 ? [['sph', [4, 47, 64], 6.5, 'fO', { k: 5, grad: g, wob: 2 }], ['sph', [-5, 36, 68], 6, 'fO', { k: 5, grad: g, wob: 2 }], ['sph', [1, 43, 80], 6.5, 'fR', { k: 6, grad: g, wob: 2.4 }],
            ['sph', [6, 53, 76], 3, 'fR', { grad: g, wob: 1 }], ['sph', [-6, 30, 78], 2.6, 'fR', { grad: g, wob: 1 }], ['sph', [2, 55, 88], 1.8, 'fO', { grad: g }]] : []),
        ] };
      }),
      { n: 'chili', parent: 'beak', p: [0, 39.4, 21], show: 'chili', s: [
        ['chain', [[0, 39.4, 20.4, 1.6], [1.6, 37.8, 25, 2.7], [3.6, 36.6, 30, 2.5], [5.2, 37.2, 33.4, 1.6]], 'chiliP'],
        ['sph', [5.4, 37.6, 33.8], 1.9, 'leaf'], ['cone', [5.6, 38, 34.2], [6.8, 41, 36], 0.75, 0.55, 'stem'],
      ] },
      { n: 'chiliHand', parent: 'wingR', p: [-17, 14, 2], show: 'chiliHand', s: [
        ['chain', [[-18.6, 12.6, 1.6, 1.5], [-20, 12.2, 6.6, 2.7], [-19.6, 13.4, 11.6, 2.5], [-18.4, 15.6, 15, 1.4]], 'chiliP'],
        ['sph', [-18.4, 12.8, 0.6], 1.9, 'leaf'], ['cone', [-18.4, 13, -0.4], [-17.6, 15.6, -2.6], 0.75, 0.55, 'stem'],
      ] },
      { n: 'chiliFly', p: [0, 40, 24], show: 'chiliFly', s: [
        ['chain', [[0, 40, 20, 1.5], [0, 38.6, 24.6, 2.7], [0, 39.4, 29.6, 2.5], [0, 41.6, 33, 1.4]], 'chiliP'],
        ['sph', [0, 40, 19], 1.9, 'leaf'],
      ] },
      ...[[6, 22, -12, 12, 30, -42], [-7, 20, -12, -14, 26, -44], [0, 32, -10, 0, 44, -38]].map(([x0, y0, z0, x1, y1, z1], i) => ({ n: 'dashfire' + i, parent: 'body', p: [x0, y0, z0], show: 'dashfire', s: [
        ['cone', [x0, y0, z0], [x1, y1, z1], 5, 1.2, 'fY', { grad: fireGrad([x0, y0, z0], [x1, y1, z1]) }]] })),
      // spicy buff: a crown of flames flaring up behind it
      ...[100, 128, 152, 180, 208, 232, 260].map((a, i) => { const r = a * Math.PI / 180, x = Math.sin(r) * 19, z = Math.cos(r) * 15 - 4, h = 40 + (i % 3) * 9 + (i === 3 ? 10 : 0); return { n: 'aura' + i, p: [x, 0, z], show: 'aura', s: [
        ['cone', [x, 4, z], [x * 1.18, h, z * 1.1], 6.4, 0.6, 'fY', { grad: { a: [x, 0, z], b: [x, h, z], stops: [[0, 'fY'], [0.3, 'fO'], [0.7, 'fR']] } }],
        ['cone', [x * 1.05, h * 0.55, z], [x * 1.45, h * 0.86, z * 1.15], 3.2, 0.5, 'fO', { k: 2, grad: { a: [x, 0, z], b: [x, h, z], stops: [[0, 'fY'], [0.3, 'fO'], [0.7, 'fR']] } }]] }; }),
      ...[[-16, 64, 6, 3.4], [17, 72, 2, 2.8]].map(([x, y, z, r], i) => ({ n: 'heart' + i, p: [x, y, z], bill: true, show: 'hearts', s: [
        ['sph', [x - r * 0.5, y + r * 0.3, z], r * 0.62, 'heart'], ['sph', [x + r * 0.5, y + r * 0.3, z], r * 0.62, 'heart'],
        ['cone', [x, y + r * 0.1, z], [x, y - r * 1, z], r * 0.75, r * 0.12, 'heart', { k: r * 0.4 }]] })),
      ...[0, 1, 2].map((i) => ({ n: 'zz' + i, p: [14, 58, 0], bill: true, show: 'zz', s: [
        ['box', [14, 61, 0], [3, 0.7, 0.7], 0.3, 'zz'], ['box', [14, 55, 0], [3, 0.7, 0.7], 0.3, 'zz'], ['box', [14, 58, 0], [3.9, 0.7, 0.7], 0.3, 'zz', { rot: [0, 0, 52] }]] })),
      ...[[-16, 60, 4], [16, 62, 2]].map(([x, y, z], i) => ({ n: 'steam' + i, p: [x, y, z], bill: true, show: 'steam', s: [
        ['sph', [x, y, z], 3.4, 'steam'], ['sph', [x + 2.6 * Math.sign(x), y + 2.6, z], 2.3, 'steam', { k: 1.5 }], ['sph', [x - 1.2 * Math.sign(x), y + 3.4, z], 2, 'steam', { k: 1.5 }]] })),
    ],
    bond: { grow: { flameTip: 1.7, tail: 1.15 } },
  };
}

// ---------------------------------------------------------------- Bubblion (Aqua)
// A little lionfish prince that swims through the air in its own "soft & wet"
// bubbles. Its striped ribbon fins flow like a lion's mane, it wears a tiny gold
// crown with a sea-glass gem, and it pouts like royalty when it doesn't get its way.
{
  const E = 7.2, EY = 33.5, EZ = 11.6;
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
      body: '#ff8a76', body2: '#e8605e', belly: '#ffe6cc', stripe: '#a8334a',
      finA: '#fff2e8', finB: '#ff7a68', finC: '#b8364e',
      crown: { c: '#ffc83a', gloss: true, ramp: ['#5a2a18', '#9a5a1e', '#d08a26', '#ffc83a', '#ffe680', '#fffbe0'] }, gem: { c: '#3ad0d8', gloss: true },
      eye: '#1e1430', iris: '#2a5a9a', shine: { c: '#ffffff', flat: true }, lips: '#ff5a7a', blush: '#ff9aa8',
      bub: { c: '#bff4ff', gloss: true, ramp: ['#3a6a9a', '#5aa0c8', '#8ad4ec', '#bff4ff', '#e4fcff', '#ffffff'] },
      heart: { c: '#ff4f7e', gloss: true }, zz: { c: '#cfe6ff', flat: true }, steam: '#fff4ec',
      fCore: { c: '#f4ffff', emit: true, heat: 1, fire: ['#1a3a7a', '#2a6ab8', '#3aa0e0', '#6ad8f8', '#b8f4ff', '#ffffff'] },
      fY: { c: '#8ae8ff', emit: true, heat: 0.75, fire: ['#1a3a7a', '#2a6ab8', '#3aa0e0', '#6ad8f8', '#b8f4ff', '#ffffff'] },
    },
    anim: { bob: 1.6, sway: 1.3, lag: 1.5, flap: 1.4 },
    pad: { breath: [72, 8, 0, 0], throw: [56, 0, 0, 0], dash: [0, 0, 24, 0] },
    parts: [
      // floating body (no legs): round, a little fuller at the front like a pufferfish
      { n: 'body', p: [0, 30, 0], noShadow: true, s: [
        ['ell', [0, 30, 0], [13.5, 13, 15.5], 'body', { grad: { a: [0, 42, 0], b: [0, 18, 0], stops: [[0, 'body'], [0.7, 'body2']] } }],
        ['ell', [0, 25, 7], [9.5, 7.5, 9], 'belly', paintOn(['body'])],
        ...[2, -5, -11].map((z) => ['ell', [0, 31, z], [14.5, 14, 1.5], 'stripe', paintOn(['body'])]),
        ...eye(E), ...eye(-E),
        ['ell', [0, 26.4, 14.6], [2.6, 1.6, 3], 'lips', paintOn(['body'])],
        ...[E + 3, -E - 3].map((x) => ['ell', [x, 28.6, 11], [2.6, 1.6, 4], 'blush', paintOn(['body'])]),
      ] },
      { n: 'lids', parent: 'body', p: [0, EY, EZ], show: 'fierce', s: [E, -E].map((x) => ['ell', [x, EY + 3.6, EZ], [4.2, 2.3, 5], 'body', paintOn(['body'], { rot: [0, 0, x > 0 ? 14 : -14] })]) },
      { n: 'eyesClosed', parent: 'body', p: [0, EY, EZ], show: ['closed', 'happy', 'hurt', 'ko'], s: [line(E, EY - 0.6, 0), line(-E, EY - 0.6, 0)] },
      // little pouty mouth that opens
      { n: 'jaw', parent: 'body', p: [0, 25.6, 14], s: [['ell', [0, 25.6, 14.4], [2.2, 1.3, 1.6], 'lips']] },
      { n: 'mouth', parent: 'body', p: [0, 26, 14], show: 'mouth:open', s: [['ell', [0, 25.2, 14.8], [1.6, 1.4, 1.2], 'eye']] },
      // the mane: ribbon fins fanning back from the head
      { n: 'tuftMane', parent: 'body', p: [0, 38, -2], s: [
        ribbon([0, 40, 2], [0, 56, -10], 2.6), ribbon([5, 39, 1], [12, 53, -12], 2.3), ribbon([-5, 39, 1], [-12, 53, -12], 2.3),
        ribbon([8, 36, -2], [19, 44, -16], 2.1), ribbon([-8, 36, -2], [-19, 44, -16], 2.1),
      ] },
      // fan pectoral fins (like little wings)
      ...both({ n: 'wingL', parent: 'body', p: [12, 28, 2], s: [
        ['ell', [17, 27, -2], [1.4, 8, 8.5], 'finA', { rot: [10, 20, -20] }],
        ...[-50, -15, 20].map((a) => ['ell', [17, 27, -2], [1.6, 8.4, 1], 'finB', paintOn(['wingL'], { rot: [a, 20, -20] })]),
      ] }),
      // tail fan
      { n: 'tail', parent: 'body', p: [0, 30, -14], s: [
        ['ell', [0, 31, -21], [1.4, 9, 7], 'finA', { rot: [12, 0, 0], k: 2 }],
        ...[-30, 0, 30].map((a) => ['ell', [0, 31, -21], [1.6, 9.4, 1.1], 'finC', paintOn(['tail'], { rot: [a + 12, 0, 0] })]),
      ] },
      // tiny crown + gem, and two curly feelers
      { n: 'crown', parent: 'body', p: [0, 42.6, 4], s: [
        ['tor', [0, 42.6, 4], 4.6, 1.1, 'crown', { k: 0.6 }],
        ...[0, 72, 144, 216, 288].map((a) => { const r = a * Math.PI / 180; return ['cone', [Math.sin(r) * 4.6, 43, 4 + Math.cos(r) * 4.6], [Math.sin(r) * 4.9, 47.4, 4 + Math.cos(r) * 4.9], 1.2, 0.35, 'crown', { k: 0.8 }]; }),
        ['sph', [0, 43.4, 8.8], 1.4, 'gem'],
      ] },
      ...both({ n: 'tuftFeelerL', parent: 'body', p: [6, 40, 9], s: [['chain', [[6, 39.5, 9, 0.9], [8.4, 43.6, 10, 0.7], [11, 44.6, 8, 0.55], [11.4, 42.6, 6.4, 0.5]], 'finB']] }),
      // bubbles: a ring of floating bubbles (idle), blown bubbles (attacks)
      ...[[-16, 46, 6, 2.2], [18, 52, 2, 1.6], [-20, 30, -4, 1.4], [15, 18, 8, 1.2]].map(([x, y, z, r], i) => ({ n: 'bubble' + i, p: [x, y, z], bill: true, s: [['sph', [x, y, z], r, 'bub']] })),
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
