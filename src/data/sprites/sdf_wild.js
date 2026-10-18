// Wild Tokonmon (city + safari) as 3D models for the 3D → pixel renderer (src/px/sdf.js).
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
const mx = (s) => mirror({ n: 'x', p: [0, 0, 0], s: [s] }).s[0];          // mirror one shape
const sym = (s) => [s, mx(s)];
// shared FX: floating hearts (happy) and sleep z's
const hearts = (y0) => [[-16, y0, 6, 3.4], [17, y0 + 8, 2, 2.8]].map(([x, y, z, r], i) => ({ n: 'heart' + i, p: [x, y, z], bill: true, show: 'hearts', s: [
  ['sph', [x - r * 0.5, y + r * 0.3, z], r * 0.62, 'heart'], ['sph', [x + r * 0.5, y + r * 0.3, z], r * 0.62, 'heart'],
  ['cone', [x, y + r * 0.1, z], [x, y - r * 1, z], r * 0.75, r * 0.12, 'heart', { k: r * 0.4 }]] }));
const zzz = (x, y) => [0, 1, 2].map((i) => ({ n: 'zz' + i, p: [x, y, 0], bill: true, show: 'zz', s: [
  ['box', [x, y + 3, 0], [3, 0.8, 0.8], 0.3, 'zz'], ['box', [x, y - 3, 0], [3, 0.8, 0.8], 0.3, 'zz'], ['box', [x, y, 0], [3.9, 0.8, 0.8], 0.3, 'zz', { rot: [0, 0, 52] }]] }));
// zig-zag spark between two points (a lightning bolt), `n` kinks, `amp` sideways throw
function bolt(a, b, n, amp, r, seed = 1, bow = 0) {
  const pts = [];
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s = i === 0 || i === n ? 0 : (i % 2 ? 1 : -1) * amp * (0.7 + 0.3 * Math.sin(seed * 7.1 + i * 3.3));
    pts.push([a[0] + d[0] * t + s * 0.7, a[1] + d[1] * t + s + bow * Math.sin(Math.PI * t), a[2] + d[2] * t + s * 0.4, r * (i === 0 || i === n ? 0.7 : 1)]);
  }
  return pts;
}

// ---------------------------------------------------------------- Lemmo (Volto)
// The lemon battery that walks: a plump lemon on two stubby feet, a copper prong and a
// zinc nail stuck in its head like antennae with a little arc crackling between them,
// a sprig of two leaves for ears, and a permanent sour pout. Squeeze it and it squirts
// a jet of electric juice with its eyes screwed shut.
{
  const E = 6.2, EY = 22.6, EZ = 11.6;
  const eye = (x) => [
    ['ell', [x, EY, EZ], [3.6, 4.5, 5], 'eye', paintOn(['head'])],
    ['ell', [x + 0.15 * Math.sign(x), EY - 1.3, EZ + 0.5], [2.7, 2.9, 5], 'iris', paintOn(['head'])],
    ['ell', [x, EY - 2.4, EZ + 0.6], [1.8, 1.3, 5], 'iris2', paintOn(['head'])],
    ['ell', [x - 1.2, EY + 1.8, EZ + 1], [1.5, 1.7, 4], 'shine', paintOn(['head'])],
    ['ell', [x + 1.3, EY - 2.3, EZ + 1], [0.8, 0.8, 4], 'shine', paintOn(['head'])],
  ];
  const line = (x, y, rz, len = 3) => ['ell', [x, y, EZ + 0.4], [len, 0.95, 5], 'eye', paintOn(['head'], { rot: [0, 0, rz] })];
  const zapGrad = (a, b) => ({ a, b, stops: [[0, 'zCore'], [0.3, 'zY'], [0.7, 'zO']] });
  // dimples in the peel (kept off the face)
  const DIMPLES = [[11.5, 27.5], [14.2, 21.5], [9.5, 12.5], [4.5, 30.8], [12.6, 15.8]];
  const dimples = DIMPLES.flatMap(([x, y]) => {
    const ny = (y - 20) / 13.2, nx = x / 16.4, z = 12.2 * Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    return sym(['sph', [x, y, z], 1.25, 'dimple', paintOn(['head'])]);
  });
  const backDimples = [[6, 26], [-8, 24], [10, 16], [-4, 14], [0, 30]].map(([x, y]) => {
    const ny = (y - 20) / 13.2, nx = x / 16.4, z = -12.2 * Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    return ['sph', [x, y, z], 1.25, 'dimple', paintOn(['head'])];
  });
  SPRITES.lemmo = {
    id: 'lemmo', size: [96, 96], anchor: [48, 91], unit: 1, yaw: -24, pitch: 16, ink: '#4a280c',
    pal: {
      peel: { c: '#ffe23a', gloss: true, ramp: ['#6a3412', '#b4661c', '#e49a22', '#f8cc2c', '#ffe43c', '#fff6a0'] },
      dimple: { c: '#f2c42c', ramp: ['#5a3010', '#a45a18', '#d48a20', '#eab826', '#f6d034', '#ffe878'] },
      leaf: { c: '#4a9a38', gloss: true, ramp: ['#0f2a14', '#1c4e1e', '#2f7a2a', '#4a9a38', '#7fc04a', '#c4ec7a'] },
      vein: { c: '#a8dc6a', ramp: ['#1c4e1e', '#3a7a2a', '#6aaa40', '#a8dc6a', '#cdf08a', '#eaffc0'] },
      stem: '#7a6a2a',
      copper: { c: '#d07a3a', gloss: true, ramp: ['#3a1a10', '#6a2e18', '#a85226', '#d07a3a', '#f0a468', '#ffd8b0'] },
      zinc: { c: '#b8c4d0', gloss: true, ramp: ['#2a3040', '#4a5668', '#7a8898', '#b8c4d0', '#dde6ee', '#ffffff'] },
      foot: { c: '#e89a2c', ramp: ['#4a2410', '#8a4a18', '#c27420', '#e89a2c', '#f8c25a', '#ffe8a0'] },
      eye: '#24140a', iris: '#1c5434', iris2: '#3a9a50', shine: { c: '#ffffff', flat: true }, blush: '#ff9a5a',
      lip: { c: '#ee8a30', ramp: ['#4a1a0c', '#8a3a14', '#c45a1e', '#ee8a30', '#ffb050', '#ffe0a0'] }, mouthIn: '#6a1a14', tongue: '#ff7a6a',
      juice: { c: '#fff2a0', gloss: true, ramp: ['#7a5a10', '#c8a020', '#f0d040', '#fff2a0', '#fffad0', '#ffffff'] },
      zCore: { c: '#ffffff', emit: true, heat: 1, fire: ['#5a3aa0', '#a080e0', '#ffd23a', '#ffe23a', '#fff59a', '#ffffff'] },
      zY: { c: '#ffe23a', emit: true, heat: 0.56, fire: ['#5a3aa0', '#a080e0', '#ffd23a', '#ffe23a', '#fff59a', '#ffffff'] },
      zArc: { c: '#ffe23a', emit: true, heat: 0.42, fire: ['#4a2a8a', '#8a6ad8', '#ffc81e', '#ffe23a', '#fff59a', '#ffffff'] },
      zO: { c: '#ffd23a', emit: true, heat: 0.44, fire: ['#5a3aa0', '#a080e0', '#ffd23a', '#ffe23a', '#fff59a', '#ffffff'] },
      heart: { c: '#ff4f7e', gloss: true }, zz: { c: '#cfe6ff', flat: true },
    },
    anim: { bob: 1.3, sway: 1.2, lag: 1.2, hop: 1.4 },
    pad: { breath: [72, 8, 0, 0], throw: [56, 0, 0, 0], dash: [0, 0, 24, 0] },
    parts: [
      { n: 'body', p: [0, 26, 0], s: [] },
      ...both({ n: 'legL', parent: 'body', p: [6.4, 5, 1.5], s: [
        ['ell', [6.6, 2.7, 2.6], [3.9, 2.7, 4.8], 'foot'],
      ] }),
      // the lemon (nubs left and right)
      { n: 'head', parent: 'body', p: [0, 7, 0], noShadow: true, s: [
        ['ell', [0, 20, 0], [16.4, 13.2, 12.2], 'peel'],
        ...sym(['cone', [13.6, 20.4, 0], [20.6, 21.6, 0], 4.4, 1.5, 'peel', { k: 3.2 }]),
        ['ell', [0, 33, -0.5], [2.6, 1.4, 2.6], 'stem', { k: 0.8 }],
        ...dimples, ...backDimples,
        ...sym(['ell', [10.6, 17.4, 9.4], [2.8, 1.8, 4], 'blush', paintOn(['head'])]),
      ] },
      // expressions
      { n: 'eyes', parent: 'head', p: [0, EY, EZ], show: ['open', 'fierce'], s: [...eye(E), ...eye(-E)] },
      { n: 'lids', parent: 'head', p: [0, EY, EZ], show: 'fierce', s: sym(['ell', [E, EY + 3.8, EZ], [4.6, 2.4, 5], 'peel', paintOn(['head'], { rot: [0, 0, 16] })]) },
      { n: 'eyesClosed', parent: 'head', p: [0, EY, EZ], show: 'closed', s: [line(E, EY - 1, 0), line(-E, EY - 1, 0)] },
      { n: 'eyesHappy', parent: 'head', p: [0, EY, EZ], show: 'happy', s: [line(E - 1.4, EY, 34, 2.2), line(E + 1.4, EY, -34, 2.2), line(-E - 1.4, EY, 34, 2.2), line(-E + 1.4, EY, -34, 2.2)] },
      // sour squeeze: > < eyes (firing, hurt)
      { n: 'eyesSqueeze', parent: 'head', p: [0, EY, EZ], show: ['teary', 'hurt'], s: [line(E + 0.6, EY + 1.3, -26, 2.6), line(E + 0.6, EY - 1.3, 26, 2.6), line(-E - 0.6, EY + 1.3, 26, 2.6), line(-E - 0.6, EY - 1.3, -26, 2.6)] },
      { n: 'eyesKO', parent: 'head', p: [0, EY, EZ], show: 'ko', s: [line(E, EY, 45, 2.8), line(E, EY, -45, 2.8), line(-E, EY, 45, 2.8), line(-E, EY, -45, 2.8)] },
      // the sour pout (closed) / an O of a mouth (open)
      { n: 'pout', parent: 'head', p: [0, 15, 12], show: 'mouth:closed', s: [
        ['tor', [0, 15.2, 11.9], 1.75, 1.05, 'lip', { rot: [108, 0, 0] }],
        ['ell', [0, 15.2, 12.4], [1, 1, 2], 'mouthIn', paintOn(['pout', 'head'])],
      ] },
      { n: 'mouth', parent: 'head', p: [0, 15, 12], show: 'mouth:open', s: [
        ['ell', [0, 14.6, 11.8], [3.3, 3, 3], 'mouthIn', paintOn(['head'])],
        ['ell', [0, 12.6, 12], [2.2, 1.4, 3], 'tongue', paintOn(['head'])],
      ] },
      // leaf sprig = ears
      ...both({ n: 'earL', parent: 'head', p: [1.5, 33, -0.8], s: [
        ['ell', [6.4, 35.2, -1.6], [6, 1.3, 3.1], 'leaf', { rot: [0, 18, 24] }],
        ['cone', [9.6, 36.6, -2.6], [12.8, 38.4, -3.6], 1.6, 0.4, 'leaf', { k: 1.2 }],
        ['ell', [6.4, 35.6, -1.6], [5.6, 0.9, 1], 'vein', paintOn(['earL'], { rot: [0, 18, 24] })],
      ] }),
      // copper prong (creature's left) with a terminal knob, zinc nail (right) with a flat head
      { n: 'crestCu', parent: 'head', p: [4.4, 31, 4], s: [
        ['cone', [4.4, 30, 4.2], [8.4, 43.4, 5], 1.45, 1.25, 'copper'],
        ['sph', [8.7, 44.6, 5], 2.3, 'copper', { k: 0.6 }],
        ['tor', [4.5, 31.2, 4.2], 1.9, 0.75, 'copper', { rot: [-14, 0, -10], k: 0.4 }],
      ] },
      { n: 'crestZn', parent: 'head', p: [-4.4, 31, 4], s: [
        ['cone', [-4.4, 30, 4.2], [-8.4, 43.2, 5], 1.35, 1.2, 'zinc'],
        ['ell', [-8.6, 43.8, 5], [3, 0.95, 3], 'zinc', { rot: [0, 0, 16], k: 0.5 }],
        ['tor', [-4.5, 31.2, 4.2], 1.9, 0.75, 'zinc', { rot: [-14, 0, 10], k: 0.4 }],
      ] },
      // the little arc crackling between the terminals
      { n: 'arc', parent: 'crestCu', p: [0, 46, 5], s: [
        ['chain', bolt([7.6, 46.2, 5], [-7.6, 45.4, 5], 5, 1.9, 0.9, 2, 3.2), 'zArc', { wob: 0.35 }],
      ] },
      // juice squirts out when it is hit
      { n: 'starsJuice', parent: 'head', p: [0, 34, 0], show: 'stars', s: [
        ['sph', [9, 40, 6], 1.8, 'juice'], ['cone', [9, 40, 6], [7.6, 36.5, 6], 1.8, 0.5, 'juice', { k: 0.5 }],
        ['sph', [-12, 37, 3], 1.4, 'juice'], ['cone', [-12, 37, 3], [-10.8, 34.2, 3], 1.4, 0.4, 'juice', { k: 0.5 }],
      ] },
      // Squeeze: a jet of electric juice with sparks crackling round it
      ...['fire', 'fire2', 'fire3'].map((n, i) => {
        const a = [0, 14.6, 13], b = [[0, 38, 74], [3, 56, 50], [-3, 24, 62]][i];
        return { n, parent: 'head', p: a, show: 'fire', s: i === 0 ? [
          ['cone', a, b, 1.6, 4.6, 'zY', { grad: zapGrad(a, b), wob: 1 }],
          ['sph', [0, 39.5, 79], 3.6, 'zO', { k: 3, wob: 1 }],
          ...[[1, 30.5, 42, 2], [-1, 23, 50, 1.8], [1.5, 42, 66, 1.6], [-1, 29, 68, 2.1], [0, 25.5, 30, 1.4], [0, 46, 82, 1.3]].map(([x, y, z, r]) => ['sph', [x, y, z], r, 'zY']),
        ] : [
          ['chain', bolt([0, 17, 20], b, 6, 3.2, 0.95, i * 3), 'zArc', { wob: 0.4 }],
        ] };
      }),
      ...hearts(50),
      ...zzz(14, 44),
    ],
    bond: { grow: { crestCu: 1.2, crestZn: 1.2, arc: 1.3 } },
  };
}

// ---------------------------------------------------------------- Cabbunny (Bio)
// A farm bunny that IS a cabbage: a round head of overlapping leaves (dark waxy outer
// leaves cupping it from below, paler leaves round the sides, a tight pale heart on top)
// with a soft cream bunny face peeking out between them. Its ears are the two tallest
// outer leaves, veined and a little floppy at the tips; when it naps they fold down over
// its face and it is just another cabbage in the row.
{
  const C = [0, 19, 0], R = [13.4, 12.8, 13.4];
  const nrm3 = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
  // one cabbage leaf: a shell a little proud of the ball, trimmed by a big sphere so its edge curves
  // (the leaf covers a cap of half-angle `deg` round direction u; Rc sets how cupped its edge is)
  const leaf = (u, e, mat, deg = 60, Rc = 18) => {
    const n = nrm3(u), Rs = 13.2 + e, c = Math.cos(deg * Math.PI / 180);
    const D = -Rs * c + Math.sqrt(Rs * Rs * c * c - Rs * Rs + Rc * Rc);
    return ['ell', C, [R[0] + e, R[1] + e, R[2] + e], mat, { minus: ['sph', [C[0] - n[0] * D, C[1] - n[1] * D, C[2] - n[2] * D], Rc, { k: 0.4 }] }];
  };
  // a pale vein painted across a leaf: from direction u0 to u1 on the ball surface
  const vein = (u0, u1, e, w = 1.05) => {
    const a = nrm3(u0), b = nrm3(u1), r = (R[0] + e);
    const pa = [C[0] + a[0] * r, C[1] + a[1] * r, C[2] + a[2] * r], pb = [C[0] + b[0] * r, C[1] + b[1] * r, C[2] + b[2] * r];
    return ['cone', pa, pb, w, w * 0.6, 'vein', paintOn(['head'])];
  };
  const E = 4.9, EY = 21.6, EZ = 14.2;
  const eye = (x) => [
    ['ell', [x, EY, EZ], [2.9, 3.7, 4], 'eye', paintOn(['head'])],
    ['ell', [x, EY - 1.1, EZ + 0.4], [2.2, 2.4, 4], 'iris', paintOn(['head'])],
    ['ell', [x, EY - 2, EZ + 0.5], [1.5, 1.1, 4], 'iris2', paintOn(['head'])],
    ['ell', [x - 0.9, EY + 1.4, EZ + 0.8], [1.2, 1.4, 3], 'shine', paintOn(['head'])],
    ['ell', [x + 1, EY - 1.9, EZ + 0.8], [0.6, 0.6, 3], 'shine', paintOn(['head'])],
  ];
  const line = (x, y, rz, len = 2.4) => ['ell', [x, y, EZ + 0.3], [len, 0.85, 4], 'eye', paintOn(['head'], { rot: [0, 0, rz] })];
  const leafy = (a, b, i) => ({ a, b, stops: [[0, 'bCore'], [0.3, 'bY'], [0.75, 'bG']] });
  // a big veined ear-leaf (left), drooping forward at the tip
  const earLeaf = (fold) => fold ? [
    ['ell', [5.4, 30.4, 6.6], [6, 1.4, 9.6], 'leafO', { rot: [40, -6, -26], k: 1.5, grad: { a: [4, 33, -3], b: [6, 24, 14], stops: [[0, 'leafM'], [0.5, 'leafO']] } }],
    ['ell', [5.6, 31, 7], [1.05, 1.4, 9], 'vein', paintOn(['earNapL'], { rot: [40, -6, -26] })],
  ] : [
    ['ell', [7, 39, -2.6], [6.2, 10.4, 1.5], 'leafO', { rot: [-8, 10, -14], k: 1.5, grad: { a: [5, 30, -2], b: [9, 50, -4], stops: [[0, 'leafM'], [0.55, 'leafO']] } }],
    ['ell', [8.9, 48.2, -1.9], [4.6, 3.6, 1.3], 'leafO', { rot: [20, 10, -14], k: 2.4 }],
    ['ell', [7.1, 39.4, -1.1], [1.05, 10.2, 1.4], 'vein', paintOn(['earL'], { rot: [-8, 10, -14] })],
    ...[[9.3, 43.5, -58], [9.1, 37.8, -62], [5.4, 42.6, 40], [5.1, 36.8, 44]].map(([x, y, r]) => ['ell', [x, y, -1.2], [0.85, 3.2, 1.4], 'vein', paintOn(['earL'], { rot: [-8, 10, r] })]),
  ];
  SPRITES.cabbunny = {
    id: 'cabbunny', size: [96, 96], anchor: [48, 91], unit: 1, yaw: -24, pitch: 16, ink: '#1c3422',
    pal: {
      heart: { c: '#d8eca0', ramp: ['#2a4e34', '#5e8a48', '#9cc068', '#cce494', '#e2f2b4', '#f4fbd8'] },
      heart2: { c: '#e4f2b0', ramp: ['#2a4e34', '#648e4a', '#a4c86e', '#d6eaa0', '#eaf6c4', '#f8fde4'] },
      leafM: { c: '#a8d070', ramp: ['#1c3a26', '#36643a', '#5e9248', '#8cc062', '#b2da82', '#dcf0b0'] },
      leafO: { c: '#5f9a4a', ramp: ['#14281e', '#224634', '#346a44', '#4e8c4c', '#76ac72', '#b0d4bc'] },
      vein: { c: '#eef6d8', ramp: ['#3a5a36', '#7a9a64', '#bcd6a0', '#e2f0c8', '#f2f9e2', '#ffffff'] },
      fur: { c: '#f6f0e0', ramp: ['#4a3a38', '#8a7a70', '#c6bcaa', '#ebe2ce', '#f8f2e4', '#fffcf4'] },
      nose: { c: '#ffb3d9', gloss: true, ramp: ['#5a2040', '#a04a78', '#e07cae', '#ffa6d0', '#ffcae4', '#fff0f8'] },
      teeth: { c: '#ffffff', ramp: ['#5a5a6a', '#9a9aaa', '#d8dce4', '#f6f8fc', '#ffffff', '#ffffff'] },
      eye: '#2a1a14', iris: '#5c3a26', iris2: '#9a6a40', shine: { c: '#ffffff', flat: true }, blush: '#ff9ab8',
      mouthIn: '#6a2a34', tongue: '#ff8aa8',
      bCore: { c: '#f6fff0', emit: true, heat: 1, fire: ['#1a4a2a', '#2a7a3a', '#4ab04a', '#8ae070', '#c8f8a8', '#ffffff'] },
      bY: { c: '#a8f080', emit: true, heat: 0.66, fire: ['#1a4a2a', '#2a7a3a', '#4ab04a', '#8ae070', '#c8f8a8', '#ffffff'] },
      bG: { c: '#5fd35a', emit: true, heat: 0.5, fire: ['#1a4a2a', '#2a7a3a', '#4ab04a', '#8ae070', '#c8f8a8', '#ffffff'] },
      heart_: { c: '#ff4f7e', gloss: true }, zz: { c: '#cfe6ff', flat: true },
    },
    anim: { bob: 1.2, sway: 1.2, lag: 1.4, hop: 1.6 },
    pad: { breath: [72, 8, 0, 0], throw: [56, 0, 0, 0], dash: [0, 0, 24, 0] },
    parts: [
      { n: 'body', p: [0, 21, 0], s: [] },
      // leaf-stub hind feet
      ...both({ n: 'legL', parent: 'body', p: [7, 5, 0], s: [
        ['ell', [7.4, 2.4, 1.6], [3.6, 2.4, 5.4], 'leafM', { rot: [0, -10, 0] }],
      ] }),
      // the cabbage
      { n: 'head', parent: 'body', p: [0, 7, 0], noShadow: true, s: [
        ['ell', C, R, 'heart'],
        // the face pokes out of the leaves (soft cream fur)
        ['ell', [0, 19.2, 6.9], [10.2, 9.2, 8], 'fur', { k: 1.5 }],
        // inner leaves on the crown
        leaf([0.45, 0.85, 0.25], 0.7, 'heart2', 36), leaf([-0.55, 0.8, -0.3], 0.7, 'heart2', 36), leaf([0.1, 0.7, -0.7], 0.9, 'heart2', 34),
        // mid leaves: up the sides like cheek ruffles, over the top-back, a cup under the chin
        ...sym(leaf([0.92, 0.12, 0.32], 1.5, 'leafM', 35)),
        ...sym(leaf([0.75, 0.3, -0.6], 1.2, 'leafM', 40)),
        leaf([0, 0.45, -0.9], 1.5, 'leafM', 52),
        leaf([0, -0.85, 0.5], 1.5, 'leafM', 34),
        // outer leaves cup the bottom and back
        ...sym(leaf([0.8, -0.55, -0.2], 2.6, 'leafO', 60, 20)),
        leaf([0, -0.5, -0.88], 2.6, 'leafO', 58, 20),
        // veins
        ...sym(vein([0.55, -0.85, -0.1], [0.98, -0.05, -0.12], 2.6)),
        ...sym(vein([0.75, -0.6, -0.25], [0.6, -0.1, -0.8], 2.6, 0.9)),
        vein([0, -0.8, -0.6], [0, 0.05, -1], 2.6),
        ...sym(vein([0.82, -0.3, 0.45], [0.88, 0.42, 0.2], 1.5, 0.9)),
        // face
        ['ell', [0, 18.1, 14.7], [2.3, 1.6, 1.5], 'nose', { k: 0.6 }],
        ['box', [0, 13.9, 13.9], [1.7, 1.25, 0.7], 0.5, 'teeth'],
        ...sym(['ell', [1.4, 15.7, 14.4], [1.5, 0.6, 2], 'eye', paintOn(['head'], { rot: [0, 0, -28] })]),
        ...sym(['ell', [7.2, 17.4, 12.6], [2.1, 1.3, 3], 'blush', paintOn(['head'])]),
      ] },
      { n: 'eyes', parent: 'head', p: [0, EY, EZ], show: ['open', 'fierce', 'teary'], s: [...eye(E), ...eye(-E)] },
      { n: 'lids', parent: 'head', p: [0, EY, EZ], show: 'fierce', s: sym(['ell', [E, EY + 3, EZ], [3.6, 1.9, 4], 'fur', paintOn(['head'], { rot: [0, 0, 16] })]) },
      { n: 'eyesClosed', parent: 'head', p: [0, EY, EZ], show: ['closed', 'hurt'], s: [line(E, EY - 0.8, 0), line(-E, EY - 0.8, 0)] },
      { n: 'eyesHappy', parent: 'head', p: [0, EY, EZ], show: 'happy', s: [line(E - 1.1, EY, 34, 1.7), line(E + 1.1, EY, -34, 1.7), line(-E - 1.1, EY, 34, 1.7), line(-E + 1.1, EY, -34, 1.7)] },
      { n: 'eyesKO', parent: 'head', p: [0, EY, EZ], show: 'ko', s: [line(E, EY, 45, 2.2), line(E, EY, -45, 2.2), line(-E, EY, 45, 2.2), line(-E, EY, -45, 2.2)] },
      { n: 'mouth', parent: 'head', p: [0, 15, 14], show: 'mouth:open', s: [
        ['ell', [0, 13.6, 14.2], [2.2, 2, 2], 'mouthIn', paintOn(['head'])],
        ['ell', [0, 12.6, 14.2], [1.4, 0.9, 2], 'tongue', paintOn(['head'])],
      ] },
      // ears: the two tallest outer leaves (fold over the face for the nap)
      ...both({ n: 'earL', parent: 'head', p: [4.5, 30, -2], show: '!zz', s: earLeaf(false) }),
      ...both({ n: 'earNapL', parent: 'head', p: [4.5, 30, -2], show: 'zz', s: earLeaf(true) }),
      // a tight little cabbage-heart pom-pom tail
      { n: 'tail', parent: 'head', p: [0, 14, -14], s: [
        ['sph', [0, 14, -16.2], 3.6, 'heart2', { k: 1.2 }],
        ['ell', [0, 13.2, -16.6], [3.9, 3.3, 3.8], 'leafM', { minus: ['sph', [0, 18, -19], 4.2, { k: 0.3 }] }],
      ] },
      // leaves torn off when hit
      { n: 'starsLeaf', parent: 'head', p: [0, 30, 0], show: 'stars', s: [
        ['ell', [14, 36, 6], [3.4, 0.9, 2.2], 'leafO', { rot: [20, 30, 40] }], ['ell', [-15, 30, 4], [3, 0.8, 2], 'leafM', { rot: [-30, 10, -20] }],
      ] },
      // Leaf Spray: a gust of Bio light with spinning leaves riding it
      ...['fire', 'fire2', 'fire3'].map((n, i) => {
        const a = [0, 14.5, 15], b = [0, 34, 74];
        const at = (t, dy, dx = 0) => [a[0] + (b[0] - a[0]) * t + dx, a[1] + (b[1] - a[1]) * t + dy, a[2] + (b[2] - a[2]) * t];
        const lf = (q, rot, mat) => [['ell', q, [5.2, 1.2, 3.1], mat, { rot }], ['ell', q, [4.6, 1.5, 0.65], 'vein', paintOn([n], { rot })]];
        const L = [
          [[0.42, 0, 2, [20, 30, 15], 'leafM'], [0.72, -1, -3, [-40, 70, -30], 'leafO'], [1.02, 0, 1, [60, -30, 40], 'leafM']],
          [[0.3, 7.5, 3, [-20, 120, 35], 'leafO'], [0.6, 10, -2, [50, 10, -50], 'leafM'], [0.92, 11, 3, [10, -60, 25], 'leafO']],
          [[0.36, -7, -2, [35, -40, -20], 'leafM'], [0.66, -9.5, 3, [-60, 20, 60], 'leafM'], [0.98, -10.5, -1, [15, 80, -35], 'leafO']],
        ][i];
        return { n, parent: 'head', p: a, show: 'fire', s: [
          ...(i === 0 ? [['cone', a, b, 0.9, 3.2, 'bY', { grad: leafy(a, b), wob: 1 }], ['sph', at(1.04, 0), 3.6, 'bG', { k: 2.5, wob: 1 }]] : []),
          ...L.flatMap(([t, dy, dx, rot, mat]) => lf(at(t, dy, dx), rot, mat)),
          ...[0.5, 0.8].map((t, k) => ['sph', at(t + i * 0.07, (i === 1 ? 3 : i === 2 ? -3 : 4) * (k ? -1 : 1)), 1.3, 'bCore']),
        ] };
      }),
      ...hearts(50).map((p) => Object.assign(p, { s: p.s.map((s) => s.map((v) => (v === 'heart' ? 'heart_' : v))) })),
      ...zzz(14, 42),
    ],
    bond: { grow: { earL: 1.2, earR: 1.2, tail: 1.3 } },
  };
}

// ---------------------------------------------------------------- Kappachi (Hydro)
// A pot-bellied canal kappa from Dotonbori: a big round head with a shallow dish of
// water set into the crown (it sloshes when it moves, and its strength sloshes with it),
// a fringe of reed hair round the dish, a short duck bill with a cheeky grin, a turtle
// shell paved with canal cobbles, webbed hands and feet, and a cucumber it carries
// everywhere like a club.
{
  const E = 5.6, EY = 37.4, EZ = 11.6;
  const eye = (x) => [
    ['ell', [x, EY, EZ], [3.2, 4.1, 5], 'eye', paintOn(['head'])],
    ['ell', [x + 0.1 * Math.sign(x), EY - 1.2, EZ + 0.5], [2.4, 2.6, 5], 'iris', paintOn(['head'])],
    ['ell', [x, EY - 2.2, EZ + 0.6], [1.6, 1.2, 5], 'iris2', paintOn(['head'])],
    ['ell', [x - 1.1, EY + 1.5, EZ + 1], [1.55, 1.65, 4], 'shine', paintOn(['head'])],
    ['ell', [x + 1.2, EY - 2.1, EZ + 1], [0.75, 0.75, 4], 'shine', paintOn(['head'])],
  ];
  const line = (x, y, rz, len = 2.8) => ['ell', [x, y, EZ + 0.4], [len, 0.9, 5], 'eye', paintOn(['head'], { rot: [0, 0, rz] })];
  const waterGrad = (a, b) => ({ a, b, stops: [[0, 'wCore'], [0.3, 'wY'], [0.75, 'wB']] });
  // the dish frame: centre D, tipped forward DT degrees; off() moves along its axis, rim() walks round it
  const DT = 13, D = [0, 45.5, 2.4], up = [0, Math.cos(DT * Math.PI / 180), Math.sin(DT * Math.PI / 180)];
  const off = (q, k) => [q[0] + up[0] * k, q[1] + up[1] * k, q[2] + up[2] * k];
  const rim = (a, r) => [D[0] + Math.sin(a) * r, D[1] - Math.cos(a) * up[2] * r, D[2] + Math.cos(a) * up[1] * r];
  // canal cobbles on the shell: spheres sunk into the dome so only a cap shows
  const S = [0, 17.5, -4.6], SR = [11.4, 11.6, 8.6];
  const cob = [];
  for (const [y, az] of [[0.9, [0]], [0.52, [-1.12, -0.37, 0.37, 1.12]], [0, [-1.26, -0.63, 0, 0.63, 1.26]], [-0.5, [-1.1, -0.37, 0.37, 1.1]]]) {
    const rr = Math.sqrt(1 - y * y);
    for (const a of az) {
      const d = [Math.sin(a) * rr, y, -Math.cos(a) * rr], n = [d[0] / SR[0], d[1] / SR[1], d[2] / SR[2]], l = Math.hypot(...n);
      const p = [S[0] + d[0] * SR[0] - n[0] / l * 1.9, S[1] + d[1] * SR[1] - n[1] / l * 1.9, S[2] + d[2] * SR[2] - n[2] / l * 1.9];
      if (p[2] > -4) continue;
      cob.push(['sph', p, 3.05, 'cobble', { k: 0.5 }]);
    }
  }
  SPRITES.kappachi = {
    id: 'kappachi', size: [96, 96], anchor: [48, 91], unit: 1, yaw: -24, pitch: 16, ink: '#10302e',
    pal: {
      skin: { c: '#3fae8e', ramp: ['#12303a', '#1e4e58', '#2a7476', '#3aa488', '#62c8a0', '#a8eccc'] },
      belly: { c: '#f2e6a6', ramp: ['#4a4a2a', '#8a845a', '#c6bc80', '#eee2a2', '#faf2c4', '#fffbe6'] },
      shell: { c: '#6a7a3a', ramp: ['#1e2412', '#323e1e', '#4a5a2a', '#62723a', '#869448', '#b4bc6a'] },
      cobble: { c: '#a0a85a', ramp: ['#2a3018', '#4a5428', '#6e7a3a', '#949e52', '#bcc274', '#e0e2a4'] },
      beak: { c: '#f2c84a', gloss: true, ramp: ['#4a2a10', '#8a5a1a', '#c48a24', '#f2c040', '#ffdc70', '#fff4c0'] },
      beakD: { c: '#d89a2a', ramp: ['#4a2a10', '#7a4a14', '#a8701e', '#d0942a', '#eab24a', '#fff0b0'] },
      rim: { c: '#e0e8d0', ramp: ['#2e3a3a', '#5a6a6a', '#9aaaa4', '#d0dccc', '#eef4e6', '#ffffff'] },
      water: { c: '#8ff0ff', gloss: true, ramp: ['#123e6a', '#1e6aae', '#2a90e8', '#34b4ff', '#58d2ff', '#8aeaff'] },
      drop: { c: '#8ff0ff', gloss: true, ramp: ['#123e6a', '#1e6aae', '#2fa8ff', '#6adcff', '#a8f4ff', '#ffffff'] },
      hair: { c: '#1f4a3a', ramp: ['#08181a', '#10282a', '#1a3e36', '#285a44', '#3c7656', '#5a9a70'] },
      cuke: { c: '#3a8a3a', gloss: true, ramp: ['#0c2414', '#1a4220', '#2a6a2c', '#3a8a3a', '#62ac4c', '#a8e07a'] }, cukeB: '#a8e07a', cukeEnd: '#d8f0a0',
      web: { c: '#62c8a0', ramp: ['#12303a', '#1e4e58', '#2a7476', '#4ab494', '#7ad8b0', '#b8f4d8'] },
      eye: '#1a1410', iris: '#8a4a12', iris2: '#e09a2a', shine: { c: '#ffffff', flat: true }, blush: '#ff9a8a',
      mouthIn: '#5a1a24', tongue: '#ff7a8a',
      wCore: { c: '#f4ffff', emit: true, heat: 1, fire: ['#1a3a7a', '#2a6ab8', '#3aa0e0', '#6ad8f8', '#b8f4ff', '#ffffff'] },
      wY: { c: '#8ae8ff', emit: true, heat: 0.62, fire: ['#1a3a7a', '#2a6ab8', '#3aa0e0', '#6ad8f8', '#b8f4ff', '#ffffff'] },
      wB: { c: '#2fa8ff', emit: true, heat: 0.46, fire: ['#1a3a7a', '#2a6ab8', '#3aa0e0', '#6ad8f8', '#b8f4ff', '#ffffff'] },
      heart: { c: '#ff4f7e', gloss: true }, zz: { c: '#cfe6ff', flat: true },
    },
    anim: { bob: 1, sway: 1.1, lag: 1.3, hop: 1, flap: 1 },
    pad: { breath: [72, 8, 0, 0], throw: [56, 0, 0, 0], dash: [0, 0, 24, 0] },
    parts: [
      // pot belly with a pale plastron, cobbled shell on the back
      { n: 'body', p: [0, 15, 0], s: [
        ['ell', [0, 15, 0.5], [10.4, 10.2, 9.6], 'skin'],
        ['ell', [0, 14.4, 8], [7.4, 8.4, 4], 'belly', paintOn(['body'])],
        ['ell', S, SR, 'shell', { k: 1.2, minus: ['box', [0, 17, 7], [20, 20, 10.6], 0, { k: 0.8 }] }],
        ...cob,
      ] },
      ...both({ n: 'legL', parent: 'body', p: [5.4, 8, 0.5], s: [
        ['cone', [5.4, 8, 0.5], [5.8, 2.6, 1.4], 3.1, 2.6, 'skin'],
        ['ell', [6, 1.4, 3.4], [3.6, 1.4, 4.4], 'web', { k: 1 }],
        ...[-1.8, 0, 1.8].map((dx) => ['sph', [6 + dx, 1.3, 7.2 - Math.abs(dx) * 0.4], 1.3, 'web', { k: 0.8 }]),
      ] }),
      // arms (webbed hands)
      ...both({ n: 'wingL', parent: 'body', p: [9.4, 21, 1], s: [
        ['cone', [9.4, 21, 1], [12.8, 13, 3.2], 2.9, 2.4, 'skin', { k: 1 }],
        ['ell', [13.1, 11.2, 3.6], [2.4, 2.8, 1.6], 'web', { rot: [0, -20, 10], k: 1 }],
      ] }),
      // the cucumber club (right hand)
      { n: 'cucumber', parent: 'wingR', p: [-13, 11, 4], s: [
        ['chain', [[-12.6, 7.6, 5.6, 2.1], [-13.4, 13, 5.4, 2.5], [-14, 19.4, 4.6, 2.3], [-14.2, 22.6, 4, 1.7]], 'cuke', { k: 1 }],
        ['sph', [-12.5, 7.2, 5.6], 1.5, 'cukeEnd', paintOn(['cucumber'])],
        ...[[-11.6, 12, 7.2], [-12.2, 16.6, 6.6], [-15.4, 15, 6], [-13.2, 20.4, 6]].map((q) => ['sph', q, 0.9, 'cukeB', paintOn(['cucumber'])]),
      ] },
      // the big round head
      { n: 'head', parent: 'body', p: [0, 25, 1], noShadow: true, s: [
        ['ell', [0, 35.4, 1], [12.8, 11.4, 11.2], 'skin', { k: 3 }],
        ...sym(['ell', [9.6, 32.2, 8.6], [2.6, 1.6, 3], 'blush', paintOn(['head'])]),
      ] },
      // duck bill: upper bill + jaw
      { n: 'beak', parent: 'head', p: [0, 31, 11], s: [
        ['ell', [0, 31.4, 12], [5.9, 2, 4.4], 'beak', { k: 1.2 }],
        ...sym(['ell', [2.6, 31.2, 15.2], [0.7, 0.55, 1], 'beakD', paintOn(['beak'])]),
      ] },
      { n: 'jaw', parent: 'beak', p: [0, 30, 9.5], s: [['ell', [0, 29.4, 11.4], [5.1, 1.6, 3.9], 'beakD', { k: 0.6 }]] },
      { n: 'mouth', parent: 'beak', p: [0, 30, 11], show: 'mouth:open', s: [['ell', [0, 29.8, 11.6], [4, 1.4, 3.2], 'mouthIn'], ['ell', [0, 29.2, 12.8], [2.2, 0.8, 1.6], 'tongue']] },
      // eyes
      { n: 'eyes', parent: 'head', p: [0, EY, EZ], show: ['open', 'fierce', 'teary'], s: [...eye(E), ...eye(-E)] },
      { n: 'lids', parent: 'head', p: [0, EY, EZ], show: 'fierce', s: sym(['ell', [E, EY + 3.6, EZ], [4.2, 2.3, 5], 'skin', paintOn(['head'], { rot: [0, 0, 16] })]) },
      { n: 'eyesClosed', parent: 'head', p: [0, EY, EZ], show: 'closed', s: [line(E, EY - 0.8, 0), line(-E, EY - 0.8, 0)] },
      { n: 'eyesHappy', parent: 'head', p: [0, EY, EZ], show: 'happy', s: [line(E - 1.3, EY, 34, 2), line(E + 1.3, EY, -34, 2), line(-E - 1.3, EY, 34, 2), line(-E + 1.3, EY, -34, 2)] },
      { n: 'eyesHurt', parent: 'head', p: [0, EY, EZ], show: 'hurt', s: [line(E + 0.5, EY + 1.2, -26, 2.4), line(E + 0.5, EY - 1.2, 26, 2.4), line(-E - 0.5, EY + 1.2, 26, 2.4), line(-E - 0.5, EY - 1.2, -26, 2.4)] },
      { n: 'eyesKO', parent: 'head', p: [0, EY, EZ], show: 'ko', s: [line(E, EY, 45, 2.6), line(E, EY, -45, 2.6), line(-E, EY, 45, 2.6), line(-E, EY, -45, 2.6)] },
      // the dish: a pale rim set into the crown (tipped a little forward so you can see the water), ringed by reed hair
      { n: 'dish', parent: 'head', p: D, s: [
        ['tor', D, 6.9, 1.6, 'rim', { rot: [DT, 0, 0], k: 0.6 }],
        ['ell', off(D, -1), [7.1, 1.8, 7.1], 'rim', { rot: [DT, 0, 0] }],
      ] },
      { n: 'tuftWater', parent: 'dish', p: off(D, 0.5), s: [['ell', off(D, 0.5), [6.2, 0.9, 6.2], 'water', { rot: [DT, 0, 0] }],
        ['ell', off(rim(Math.PI * 1.22, 3.2), 0.5), [2.2, 2, 1.1], 'shine', paintOn(['tuftWater'], { rot: [DT, 40, 0] })], ['ell', off(rim(Math.PI * 0.62, 3.6), 0.5), [0.9, 2, 0.8], 'shine', paintOn(['tuftWater'], { rot: [DT, 20, 0] })]] },
      { n: 'hair', parent: 'head', p: off(D, -1), s: [
        ...Array.from({ length: 13 }, (_, i) => { const a = (i / 13) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
          if (c > 0.5) return null;
          const len = c > 0 ? 3.6 : 5, r0 = rim(a, 8.2), r1 = rim(a, 8.2 + len);
          return ['cone', off(r0, -0.6), off(r1, -3.2 - len * 0.2), 2.3, 0.5, 'hair', { k: 1.2 }]; }).filter(Boolean),
      ] },
      // water slopping out of the dish when hit
      { n: 'starsDrops', parent: 'head', p: [0, 48, 0], show: 'stars', s: [
        ['sph', [9, 52, 3], 1.7, 'drop'], ['cone', [9, 52, 3], [7.4, 49, 2], 1.7, 0.5, 'drop', { k: 0.5 }],
        ['sph', [-10, 50, -2], 1.4, 'drop'], ['cone', [-10, 50, -2], [-8.4, 47.6, -1.5], 1.4, 0.4, 'drop', { k: 0.5 }],
        ['sph', [2, 55, -4], 1.2, 'drop'],
      ] },
      // Canal Shot: an aimed water jet with a spray of droplets
      ...['fire', 'fire2', 'fire3'].map((n, i) => {
        const a = [0, 30.2, 15], b = [[0, 40, 74], [4, 46, 56], [-4, 32, 60]][i];
        return { n, parent: 'beak', p: a, show: 'fire', s: i === 0 ? [
          ['cone', a, b, 1.6, 4.4, 'wY', { grad: waterGrad(a, b), wob: 1 }],
          ['sph', [0, 41, 79], 4.4, 'wB', { k: 3, wob: 1.2 }],
          ...[[2, 36.6, 48, 1.4], [-2, 34, 40, 1.2], [1, 44, 64, 1.5], [-1.5, 38, 66, 1.6]].map(([x, y, z, r]) => ['sph', [x, y, z], r, 'wCore']),
        ] : [
          ...[0.45, 0.7, 0.95].map((t, k) => ['sph', [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], 2.2 - k * 0.4, 'wY', { wob: 0.3 }]),
        ] };
      }),
      ...hearts(56),
      ...zzz(15, 50),
    ],
    bond: { grow: { dish: 1.12, tuftWater: 1.12, hair: 1.15 } },
  };
}

// ---------------------------------------------------------------- Chochobake (Ecto)
// A hundred-year-old izakaya lantern that tore open and woke up. Red washi paper glowing
// from inside, black lacquer caps with a wire hanging loop, bamboo ribs that break round
// one huge violet eye, and a torn rib-line for a mouth with a long pink tongue lolling
// out of it. When it opens its mouth you can see the ghost-fire burning inside, and it
// spits that fire out as little onibi wisps.
{
  const LC = 32.4, LR = 13.4, LH = 17;                       // lantern centre height, radius, half height
  const rAt = (y) => LR * Math.sqrt(Math.max(0, 1 - ((y - LC) / LH) ** 2));
  const EY = 36.4, EZ = rAt(36.4) - 0.2, MY = 26.2;
  const line = (x, y, rz, len = 3.2) => ['ell', [x, y, EZ + 0.4], [len, 1.05, 5], 'lash', paintOn(['head'], { rot: [0, 0, rz] })];
  const ghostGrad = (a, b) => ({ a, b, stops: [[0, 'gCore'], [0.3, 'gP'], [0.7, 'gV']] });
  // a ghost-fire wisp: round head, tail licking back and up
  const wisp = (q, r, back, mat = 'gP') => [
    ['sph', q, r, mat, { wob: r * 0.12 }],
    ['cone', q, [q[0], q[1] + r * 2.4, q[2] - back], r * 0.94, 0.35, mat, { k: r * 0.5, wob: r * 0.2 }],
  ];
  // torn mouth: a jagged line across the front, on the paper surface
  const tear = Array.from({ length: 9 }, (_, i) => { const x = -8.4 + i * 2.1, y = MY + (i % 2 ? 1.3 : -0.9) + 0.022 * x * x, z = Math.sqrt(Math.max(0, rAt(y) ** 2 - x * x)) + 0.2; return [x, y, z, 1.1]; });
  SPRITES.chochobake = {
    id: 'chochobake', size: [96, 96], anchor: [48, 91], unit: 1, yaw: -24, pitch: 16, ink: '#2a0a14',
    pal: {
      paper: { c: '#d8283a', emit: true, heat: 0.47, fire: ['#2a0a14', '#781428', '#b41e32', '#dc2e3a', '#ff6a5a', '#ffc0a0'] },
      ribP: { c: '#8a1428', emit: true, heat: 0.3, fire: ['#2a0a14', '#5a0c1c', '#7a1226', '#9a1a30', '#b8283a', '#d84a4a'] },
      rib: { c: '#5a0a1a', ramp: ['#14040a', '#2e0810', '#480c18', '#621424', '#842232', '#a8404c'] },
      cap: { c: '#221a1e', gloss: true, ramp: ['#060406', '#0e0a0c', '#181216', '#241a20', '#382a30', '#7a5a62'] },
      wire: { c: '#4a4048', gloss: true, ramp: ['#0a080a', '#1a161a', '#2e282e', '#4a4048', '#6a6068', '#a8a0a8'] },
      sclera: { c: '#fff6e0', ramp: ['#4a3a3a', '#8a7a78', '#d0c4b4', '#f6ecd6', '#fff8e8', '#ffffff'] },
      iris: { c: '#8a5aff', ramp: ['#1a0a3a', '#3a1a7a', '#5a32c0', '#7e52f4', '#a07aff', '#d0b8ff'] }, iris2: { c: '#c49aff', ramp: ['#2a1a5a', '#5a3aa0', '#8a64e0', '#b08cff', '#d0b4ff', '#f0e4ff'] },
      pupil: '#1a0a24', lash: { c: '#2a0614', ramp: ['#12020a', '#1e040e', '#2a0614', '#3a0a1a', '#4a1020', '#5a1628'] }, shine: { c: '#ffffff', flat: true },
      mouthLine: { c: '#3a0612', ramp: ['#12020a', '#1e040e', '#2a0614', '#3a0a1a', '#4a1020', '#5a1628'] },
      tongue: { c: '#ff7aa0', gloss: true, ramp: ['#4a0a2a', '#8a1a4a', '#c43a6c', '#f2668e', '#ff94b4', '#ffd0e0'] }, groove: { c: '#c03a6a', ramp: ['#3a0820', '#6a1238', '#9a2452', '#c03a6a', '#d85a84', '#f08aa8'] },
      tassel: { c: '#ffcf3a', ramp: ['#5a3010', '#9a6418', '#d09424', '#f6c03a', '#ffdc6a', '#fff2b8'] }, tasselD: { c: '#d8283a', ramp: ['#2a0a14', '#5a0c1c', '#8a1428', '#c02232', '#e04a4a', '#ff8a7a'] },
      gCore: { c: '#ffe0f6', emit: true, heat: 1, fire: ['#2a0a4a', '#5a2aa0', '#8a5aff', '#c070ff', '#ff7af2', '#ffe0f6'] },
      gP: { c: '#ff7af2', emit: true, heat: 0.62, fire: ['#2a0a4a', '#5a2aa0', '#8a5aff', '#c070ff', '#ff7af2', '#ffe0f6'] },
      gW: { c: '#c070ff', emit: true, heat: 0.5, fire: ['#2a0a4a', '#5a2aa0', '#8a5aff', '#c070ff', '#ff7af2', '#ffe0f6'] },
      gV: { c: '#8a5aff', emit: true, heat: 0.44, fire: ['#2a0a4a', '#5a2aa0', '#8a5aff', '#c070ff', '#ff7af2', '#ffe0f6'] },
      heart: { c: '#ff4f7e', gloss: true }, zz: { c: '#cfe6ff', flat: true },
    },
    anim: { bob: 2.2, sway: 2.6, lag: 1.6 },
    pad: { breath: [72, 8, 0, 0], throw: [56, 0, 0, 0], dash: [0, 0, 24, 0] },
    parts: [
      { n: 'body', p: [0, 30, 0], s: [] },
      // the lantern hangs from its loop, so it swings like a pendulum
      { n: 'head', parent: 'body', p: [0, 51, 0], noShadow: true, s: [
        ['ell', [0, LC, 0], [LR, LH, LR], 'paper'],
        // bamboo ribs: darker bands painted on the glowing paper (they break round the face)
        ...[20.6, MY, 31.2, 36.4, 41.6].map((y) => ['tor', [0, y, 0], rAt(y), 1.05, 'ribP', paintOn(['head'], { minus: ['ell', [0, 33.4, 14], [9.4, y === MY ? 20 : 12, 8], { k: 0.4 }] })]),
        // lacquer caps
        ['ell', [0, LC + 14.6, 0], [rAt(LC + 14.4) + 0.9, 2.6, rAt(LC + 14.4) + 0.9], 'cap'],
        ['tor', [0, LC + 14.2, 0], rAt(LC + 14.2) + 0.5, 1.2, 'cap', { k: 0.5 }],
        ['ell', [0, LC - 14.6, 0], [rAt(LC - 14.4) + 0.9, 2.6, rAt(LC - 14.4) + 0.9], 'cap'],
        ['tor', [0, LC - 14.2, 0], rAt(LC - 14.2) + 0.5, 1.2, 'cap', { k: 0.5 }],
        // the hanging loop
        ['tor', [0, LC + 19.6, 0], 2.5, 0.9, 'wire', { rot: [90, 0, 0] }],
      ] },
      // one huge eye
      { n: 'eyes', parent: 'head', p: [0, EY, EZ], show: ['open', 'fierce', 'teary'], s: [
        ['ell', [0, EY, EZ], [6.8, 7.2, 5], 'sclera', paintOn(['head'])],
        ['ell', [0, EY - 0.9, EZ + 0.4], [4.8, 5.3, 5], 'iris', paintOn(['head'])],
        ['ell', [0, EY - 3.2, EZ + 0.5], [3.4, 2.2, 5], 'iris2', paintOn(['head'])],
        ['ell', [0, EY - 0.4, EZ + 0.6], [2.4, 3.2, 5], 'pupil', paintOn(['head'])],
        ['ell', [-2, EY + 2, EZ + 1], [2, 2.1, 4], 'shine', paintOn(['head'])],
        ['ell', [2.1, EY - 3.1, EZ + 1], [1, 1, 4], 'shine', paintOn(['head'])],
      ] },
      { n: 'lids', parent: 'head', p: [0, EY, EZ], show: 'fierce', s: [['ell', [0, EY + 6.6, EZ], [8.4, 3.8, 5], 'paper', paintOn(['head'], { rot: [0, 0, -8] })], ['ell', [0, EY + 3.4, EZ + 0.4], [7.2, 1, 5], 'pupil', paintOn(['head'], { rot: [0, 0, -8] })]] },
      { n: 'eyesClosed', parent: 'head', p: [0, EY, EZ], show: 'closed', s: [line(0, EY - 1, 0, 5.4)] },
      { n: 'eyesHappy', parent: 'head', p: [0, EY, EZ], show: 'happy', s: [line(-2.4, EY, 36, 3.4), line(2.4, EY, -36, 3.4)] },
      { n: 'eyesHurt', parent: 'head', p: [0, EY, EZ], show: 'hurt', s: [line(-0.8, EY + 1.9, -24, 4.2), line(-0.8, EY - 1.9, 24, 4.2)] },
      { n: 'eyesKO', parent: 'head', p: [0, EY, EZ], show: 'ko', s: [line(0, EY, 45, 4.4), line(0, EY, -45, 4.4)] },
      // the torn mouth: a jagged seam (closed) / a split showing the ghost-fire inside (open)
      { n: 'seam', parent: 'head', p: [0, MY, 12], show: 'mouth:closed', s: [['chain', tear, 'mouthLine', paintOn(['head'])]] },
      { n: 'mouth', parent: 'head', p: [0, MY, 12], show: 'mouth:open', s: [
        ['ell', [0, MY - 0.6, 12.6], [8.6, 4.4, 6], 'gP', { sub: true, k: 0.6, grad: { a: [0, MY - 3, 8], b: [0, MY + 3, 8], stops: [[0, 'gV'], [0.45, 'gP'], [0.8, 'gCore']] } }],
      ] },
      // the long tongue lolling out (floppy): narrow at the root, wide and round at the tip
      { n: 'tuftTongue', parent: 'head', p: [1.6, MY - 1, 11.5], s: [
        ['ell', [1.6, MY - 1.6, 12.4], [2.6, 2.2, 1.6], 'tongue', { rot: [34, 0, 0], k: 1.4 }],
        ['ell', [1.9, MY - 5.6, 14.2], [3.2, 3.4, 1.4], 'tongue', { rot: [14, 0, 0], k: 2.2 }],
        ['ell', [2.2, MY - 10.6, 14.9], [3.9, 3.6, 1.4], 'tongue', { rot: [-4, 0, 0], k: 2.2 }],
        ['ell', [2.4, MY - 14.6, 14.6], [3.8, 2.8, 1.5], 'tongue', { rot: [-26, 0, 3], k: 2 }],
        ['cone', [1.8, MY - 3, 15], [2.3, MY - 13.4, 16.2], 0.95, 0.8, 'groove', paintOn(['tuftTongue'])],
      ] },
      // paper tassel on a short cord
      { n: 'tuftTassel', parent: 'head', p: [0, LC - 16.4, 0], s: [
        ['cone', [0, LC - 16.4, 0], [0, LC - 18.6, 0], 0.9, 0.9, 'cap'],
        ['sph', [0, LC - 19.4, 0], 1.8, 'tassel', { k: 0.5 }],
        ['cone', [0, LC - 20, 0], [0, LC - 25, 0], 1.3, 2.9, 'tassel', { k: 0.8 }],
        ['ell', [0, LC - 25.2, 0], [2.9, 1, 2.9], 'tassel', { k: 0.8 }],
        ['ell', [0, LC - 21.8, 0], [3, 0.9, 3], 'tasselD', paintOn(['tuftTassel'])],
      ] },
      // a pair of little onibi that drift around it
      ...[[-18, 38, -3, 2.3], [17.5, 21, -5, 2]].map(([x, y, z, r], i) => ({ n: 'wisp' + i, parent: 'body', p: [x, y, z], s: wisp([x, y, z], r, 2, 'gW') })),
      // Onibi Spit: ghost-fire wisps out of the mouth
      ...['fire', 'fire2', 'fire3'].map((n, i) => {
        const a = [0, MY - 0.6, 13], q = [[0, MY + 6, 62], [5, MY + 12, 44], [-4, MY - 1, 34]][i], r = [5, 3.6, 3][i];
        return { n, parent: 'head', p: a, show: 'fire', s: [
          ...wisp(q, r, 12 - i * 2),
          ...(i === 0 ? [['cone', a, [q[0], q[1], q[2] - 4], 1.4, 2.6, 'gV', { wob: 0.8, grad: ghostGrad(a, q) }]] : []),
        ] };
      }),
      ...hearts(58),
      ...zzz(17, 50),
    ],
    bond: { grow: { tuftTongue: 1.25, wisp0: 1.4, wisp1: 1.4 } },
  };
}
