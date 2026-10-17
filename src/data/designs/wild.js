// Elemon — wild / safari / legendary / farm designs (voxel DSL, see docs/MODELING.md).
// Model space is absolute: metres, +y up, +z = front, left = +x.

export const DESIGNS = {};
export const LORE = {};

// ---------------------------------------------------------------- helpers
const D2R = Math.PI / 180;
// n items around the y axis: f(angle, x, z, i) → shape tuple (x/z = unit circle * r around centre)
function ring(n, r, y, a0, f, cx = 0, cz = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    out.push(f(a, cx + Math.sin(a) * r, cz + Math.cos(a) * r, i));
  }
  return out;
}
// 3x3 rotation matrices (Euler XYZ, degrees — same convention as voxel.js / THREE)
function eulerM(r) {
  const [x, y, z] = r.map((v) => v * D2R);
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  return [[c * e, -c * f, d], [a * f + b * e * d, a * e - b * f * d, -b * c], [b * f - a * e * d, b * e + a * f * d, a * c]];
}
function mulM(A, B) { return A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j])); }
function mEuler(m) {
  const y = Math.asin(Math.max(-1, Math.min(1, m[0][2])));
  let x, z;
  if (Math.abs(m[0][2]) < 0.9999999) { x = Math.atan2(-m[1][2], m[2][2]); z = Math.atan2(-m[0][1], m[0][0]); } else { x = Math.atan2(m[2][1], m[1][1]); z = 0; }
  return [x / D2R, y / D2R, z / D2R];
}
function apM(M, v) { return [0, 1, 2].map((i) => M[i][0] * v[0] + M[i][1] * v[1] + M[i][2] * v[2]); }
// Rigidly rotate shape tuples about `pivot` by Euler `rot` (deg), optionally translate by `move`.
function xf(shapes, pivot, rot, move = [0, 0, 0]) {
  const W = eulerM(rot);
  const P = (v) => { const q = apM(W, [v[0] - pivot[0], v[1] - pivot[1], v[2] - pivot[2]]); return [q[0] + pivot[0] + move[0], q[1] + pivot[1] + move[1], q[2] + pivot[2] + move[2]]; };
  return shapes.map((t) => {
    const k = t[0], o = t.slice();
    if (k === 'cap' || k === 'cyl') { o[1] = P(t[1]); o[2] = P(t[2]); return o; }
    o[1] = P(t[1]);
    const oi = k === 'tor' || k === 'poly' ? 5 : 4;
    const opts = Object.assign({}, o[oi] || {});
    opts.rot = mEuler(mulM(W, eulerM(opts.rot || [0, 0, 0])));
    if (k === 'tor' && opts.axis) { // fold the axis choice into the rotation
      const pre = opts.axis === 'x' ? [0, 0, -90] : opts.axis === 'z' ? [90, 0, 0] : [0, 0, 0];
      opts.rot = mEuler(mulM(W, mulM(eulerM((o[oi] && o[oi].rot) || [0, 0, 0]), eulerM(pre))));
      delete opts.axis;
    }
    o[oi] = opts;
    return o;
  });
}
const P3 = (pivot, rot, v) => { const q = apM(eulerM(rot), [v[0] - pivot[0], v[1] - pivot[1], v[2] - pivot[2]]); return [q[0] + pivot[0], q[1] + pivot[1], q[2] + pivot[2]]; };

// ---------------------------------------------------------------- 1. Kappachi
DESIGNS.kappachi = {
  id: 'kappachi', vs: 0.024, arch: 'biped',
  pal: {
    g: '#47bb68', gd: '#2f8f50', gl: '#9fe58c', y: '#f3e690', yd: '#c7b04c',
    sh: '#8a7a34', shd: '#3d2f14', shl: '#d8c472', bk: '#ffb32e', bkd: '#d9761a',
    hr: '#1c5a56', hrl: '#2c8577', cer: '#eef5f2', cerd: '#b9c9c6', wat: '#4fd0ff', wl: '#e4fbff',
    ck: '#ff8da0', cu: '#1f5a24', cul: '#6fb04a', cuc: '#e3f7a8',
  },
  anim: { quirk: ['hop', 'flex', 'shakeoff', 'happy', 'scratch'], bounce: 1.3, gait: 1.15, maxSpeed: 3.5 },
  parts: [
    { n: 'body', p: [0, 0.2, 0], s: [
      ['ell', [0, 0.3, 0.0], [0.145, 0.14, 0.13], 'g'],
      ['ell', [0, 0.29, 0.07], [0.11, 0.12, 0.08], 'y', { paint: 1, stripes: { axis: 'y', p: 0.048, w: 0.014, col: 'yd', o: 0.005 } }],
    ] },
    { n: 'shell', parent: 'body', p: [0, 0.3, -0.05], s: [
      ['ell', [0, 0.335, -0.085], [0.185, 0.2, 0.135], 'sh'],
      // scute grooves (lattice-aligned slabs)
      ['box', [0.072, 0.34, -0.2], [0.012, 0.25, 0.1], 'shd', { paint: 1 }],
      ['box', [-0.072, 0.34, -0.2], [0.012, 0.25, 0.1], 'shd', { paint: 1 }],
      ['box', [0, 0.264, -0.2], [0.072, 0.012, 0.1], 'shd', { paint: 1 }],
      ['box', [0, 0.408, -0.2], [0.072, 0.012, 0.1], 'shd', { paint: 1 }],
      ['box', [0.15, 0.336, -0.2], [0.07, 0.012, 0.1], 'shd', { paint: 1, m: 1 }],
      // rim
      ['box', [0, 0.335, -0.04], [0.3, 0.3, 0.065], 'shl', { paint: 1 }],
    ] },
    { n: 'head', parent: 'body', p: [0, 0.42, 0.0], s: [
      ['ell', [0, 0.565, 0.02], [0.2, 0.172, 0.172], 'g'],
      // hair cap under the plate + spiky okappa ring
      ['box', [0, 0.74, 0], [0.3, 0.075, 0.3], 'hr', { paint: 1 }],
      ...ring(10, 0.165, 0.665, Math.PI / 10, (a, x, z) => ['cap', [x * 0.85, 0.69, z * 0.85], [x * 1.25, 0.625 - (z > 0.1 ? 0.0 : 0.02), z * 1.2], 0.045, 0.012, 'hr', { tip: 'hrl', tipT: 0.75 }]),
      // dish (sara)
      ['cyl', [0, 0.71, 0], [0, 0.775, 0], 0.118, 'cer', { stripes: { axis: 'y', p: 0.2, w: 0.024, col: 'cerd', o: 0.7 } }],
      ['cyl', [0, 0.748, 0], [0, 0.82, 0], 0.092, 'cer', { sub: 1 }],
      ['cyl', [0, 0.725, 0], [0, 0.752, 0], 0.092, 'wat', { glow: 1 }],
      ['sph', [0.035, 0.752, 0.03], 0.018, 'wl', { glow: 2 }],
      ['sph', [-0.04, 0.752, -0.02], 0.012, 'wl', { glow: 2 }],
      // beak
      ['ell', [0, 0.51, 0.185], [0.072, 0.036, 0.068], 'bk'],
      ['box', [0, 0.5, 0.205], [0.08, 0.005, 0.08], 'bkd', { paint: 1 }],
      // cheeks
      ['ell', [0.135, 0.515, 0.12], [0.04, 0.025, 0.04], 'ck', { m: 1, paint: 1 }],
    ] },
    { n: 'armL', parent: 'body', p: [0.13, 0.38, 0.02], s: [
      ['cap', [0.13, 0.38, 0.02], [0.19, 0.25, 0.04], 0.036, 0.03, 'g'],
      ['ell', [0.2, 0.215, 0.055], [0.04, 0.035, 0.045], 'g'],
      ['cap', [0.2, 0.2, 0.08], [0.205, 0.17, 0.1], 0.016, 0.012, 'g'],
      ['cap', [0.225, 0.2, 0.06], [0.24, 0.17, 0.07], 0.016, 0.012, 'g'],
      ['ell', [0.215, 0.185, 0.08], [0.03, 0.02, 0.03], 'gl'],
    ] },
    { n: 'armR', parent: 'body', p: [-0.13, 0.38, 0.02], s: [
      ['cap', [-0.13, 0.38, 0.02], [-0.19, 0.25, 0.04], 0.036, 0.03, 'g'],
      ['ell', [-0.2, 0.215, 0.055], [0.04, 0.035, 0.045], 'g'],
      ['cap', [-0.2, 0.2, 0.08], [-0.205, 0.17, 0.1], 0.016, 0.012, 'g'],
      ['cap', [-0.225, 0.2, 0.06], [-0.24, 0.17, 0.07], 0.016, 0.012, 'g'],
      // cucumber snack
      ['cap', [-0.22, 0.1, 0.14], [-0.2, 0.33, 0.05], 0.034, 0.032, 'cu', { spots: { col: 'cul', d: 0.22, s: 0.018 } }],
      ['sph', [-0.2, 0.35, 0.045], 0.034, 'cu', { sub: 1 }],
      ['ell', [-0.2, 0.325, 0.05], [0.03, 0.012, 0.03], 'cuc', { paint: 1 }],
    ] },
    { n: 'legL', parent: 'body', p: [0.075, 0.2, 0], mirror: true, s: [
      ['cap', [0.075, 0.2, 0], [0.085, 0.06, 0.01], 0.048, 0.04, 'g'],
      ['ell', [0.09, 0.03, 0.05], [0.055, 0.03, 0.08], 'g'],
      ['ell', [0.09, 0.02, 0.1], [0.06, 0.016, 0.04], 'gl'],
    ] },
  ],
  eyes: { part: 'head', at: [0.085, 0.585, 0.18], dir: [0.38, 0.12, 1], style: 'big', iris: '#e8960f', px: 0.75 },
  mouth: { part: 'head', at: [0, 0.505, 0.25], dir: [0, 0, 1], style: 'beak', px: 0.6 },
  fx: [{ part: 'head', at: [0.09, 0.71, 0.05], type: 'drip', rate: 0.6, scale: 0.7 }],
};
LORE.kappachi = {
  name: 'Kappachi', element: 'hydro', stage: 1, height: '0.8 m',
  desc: 'A kappa imp that guards the canals of Dōtonbori. The water in its head-dish is its life force — bow to it, and it bows back, spilling its power.',
  personality: 'Mischievous prankster with a soft spot for cucumbers and sumo.',
  look: 'Green kappa child with a turtle shell, a glossy water dish ringed by a teal bowl-cut, a yellow beak and webbed hands clutching a cucumber.',
};

// ---------------------------------------------------------------- 2. Chochobake
DESIGNS.chochobake = {
  id: 'chochobake', vs: 0.028, arch: 'floater',
  pal: {
    p: '#efa457', pd: '#d9652e', rib: '#5a2f17', lac: '#221a22', lacl: '#4a3a48', gold: '#e8b443', red: '#d62c2c',
    in: '#ff8a1e', inr: '#7a1020', tg: '#ff5f86', tgd: '#c23a5e', gh: '#bfe6ff', ghd: '#7fb4ff', hd: '#8ef0ff',
  },
  anim: { quirk: ['spin', 'sway', 'shakeoff', 'happy'], bounce: 1, hover: 0.22, maxSpeed: 3 },
  parts: [
    { n: 'body', p: [0, 0.9, 0], s: [
      // paper lantern: glowing paper with protruding bamboo ribs
      ['ell', [0, 0.56, 0], [0.285, 0.31, 0.275], 'p', { glow: 1, grad: { axis: 'y', to: 'pd', a: 0.75, b: 0.3 } }],
      ...[0.336, 0.42, 0.504, 0.588, 0.672, 0.756].map((y) => { const k = Math.sqrt(Math.max(0, 1 - ((y - 0.56) / 0.31) ** 2)); return ['tor', [0, y, 0], 0.28 * k, 0.016, 'rib']; }),
      // flat eye disc so the single eye decal sits cleanly (ribs carved in front of it)
      ['cyl', [0, 0.63, 0.27], [0, 0.63, 0.4], 0.165, 'p', { sub: 1 }],
      ['cyl', [0, 0.63, 0.18], [0, 0.63, 0.272], 0.155, 'p', { glow: 1 }],
      ['cyl', [0, 0.63, 0.18], [0, 0.63, 0.272], 0.155, 'p', { paint: 1, grad: { axis: 'y', to: 'pd', a: 0.75, b: 0.3 } }],
      // lacquered top cap + hanger
      ['cyl', [0, 0.82, 0], [0, 0.9, 0], 0.15, 'lac'],
      ['cyl', [0, 0.85, 0], [0, 0.875, 0], 0.16, 'gold'],
      ['tor', [0, 0.95, 0], 0.055, 0.016, 'lac', { axis: 'z' }],
      // torn mouth with glowing interior
      ['ell', [0, 0.43, 0.26], [0.17, 0.055, 0.09], 'p', { sub: 1 }],
      ['ell', [0, 0.43, 0.19], [0.17, 0.07, 0.07], 'in', { paint: 1, glow: 2 }],
      ['ell', [0, 0.41, 0.2], [0.12, 0.03, 0.05], 'inr', { paint: 1 }],
    ] },
    { n: 'jaw', parent: 'body', p: [0, 0.43, 0.24], sway: { axis: 'x', amp: 0.12, freq: 1.1 }, s: [
      ['cap', [0, 0.425, 0.22], [0, 0.39, 0.33], 0.052, 0.05, 'tg'],
      ['cap', [0, 0.39, 0.33], [0.01, 0.25, 0.35], 0.05, 0.046, 'tg'],
      ['cap', [0.01, 0.25, 0.35], [0.03, 0.15, 0.31], 0.046, 0.04, 'tg'],
      ['box', [0, 0.3, 0.38], [0.014, 0.14, 0.05], 'tgd', { paint: 1 }],
    ] },
    { n: 'skirt', parent: 'body', p: [0, 0.3, 0], sway: { axis: 'z', amp: 0.07, freq: 0.9 }, s: [
      ...ring(7, 0.15, 0.3, 0.45, (a, x, z, i) => ['poly', [x, 0.0, z], [[-0.07, 0.33], [0.07, 0.33], [0.065, 0.22 - (i % 3) * 0.03], [0.035, 0.17 - (i % 2) * 0.05], [0.0, 0.215 - (i % 3) * 0.02], [-0.03, 0.15 - ((i + 1) % 3) * 0.035], [-0.065, 0.21 - (i % 2) * 0.03]], 0.014, 'p', { glow: 1, rot: [0, a / D2R, 0], grad: { axis: 'y', to: 'pd', a: 0.3, b: 0.12 } }]),
    ] },
    { n: 'armL', parent: 'body', p: [0.24, 0.5, 0.1], mirror: true, s: [
      ['cap', [0.24, 0.5, 0.1], [0.31, 0.5, 0.25], 0.042, 0.026, 'gh', { glow: 1 }],
      ['ell', [0.32, 0.47, 0.285], [0.045, 0.05, 0.03], 'gh', { glow: 1, rot: [-30, 0, 0] }],
      ['cap', [0.29, 0.45, 0.3], [0.29, 0.38, 0.3], 0.014, 0.011, 'gh', { glow: 1 }],
      ['cap', [0.32, 0.44, 0.305], [0.32, 0.36, 0.31], 0.014, 0.011, 'gh', { glow: 1 }],
      ['cap', [0.35, 0.45, 0.3], [0.35, 0.38, 0.3], 0.014, 0.011, 'gh', { glow: 1 }],
    ] },
    { n: 'orbit', p: [0, 0.95, 0], spin: { axis: 'y', speed: 1.4 }, s: [
      ['sph', [0.34, 0.98, 0], 0.042, 'hd', { glow: 2 }],
      ['cap', [0.34, 0.98, 0], [0.34, 1.08, -0.03], 0.037, 0.008, 'gh', { glow: 2 }],
    ] },
  ],
  eyes: { part: 'body', at: [0, 0.63, 0.28], dir: [0, 0, 1], style: 'cyclops', mirror: false, iris: '#9a3cff', px: 1.2, cmap: { s: '#ffffff' } },
  mouth: { style: 'none' },
  decals: [
    { part: 'body', at: [0, 0.58, -0.28], dir: [0, 0, -1], px: 1, rows: ['...r...', '.r.r.r.', 'r..r..r', '...r...', '..r.r..', '.r...r.', 'r.....r'], cmap: { r: '#c8202a' } },
  ],
  fx: [
    { part: 'body', at: [0, 0.93, 0], type: 'wisp', rate: 0.8, scale: 0.8 },
    { part: 'orbit', at: [0.34, 1.02, 0], type: 'wisp', rate: 0.6, scale: 0.6, color: '#7fe8ff' },
  ],
};
LORE.chochobake = {
  name: 'Chochobake', element: 'ecto', stage: 1, height: '0.9 m',
  desc: 'When a festival lantern turns one hundred years old it tears open a mouth and wakes up. It haunts the night markets of Shinsekai, licking passers-by and giggling.',
  personality: 'Playful trickster; lonely when the festival lights go out.',
  look: 'Glowing paper chōchin with bamboo ribs, one huge eye, a long lolling tongue, torn paper tatters, limp yūrei hands and an orbiting hitodama flame.',
};

// ---------------------------------------------------------------- 3. Tengale
{
  const S = [0.13, 0.64, -0.04], WR = [26, 0, 22];
  const F = [0.4, 0.64, -0.09];
  const fanPts = [[0, 0]], veins = [];
  for (let k = 0; k <= 14; k++) {
    const phi = (-84 + k * (126 / 14)) * D2R, r = k % 2 ? 0.17 : 0.25;
    fanPts.push([Math.cos(phi) * r, Math.sin(phi) * r]);
    if (k % 2 === 0) veins.push(['cap', F, [F[0] + Math.cos(phi) * 0.22, F[1] + 0.02, F[2] + Math.sin(phi) * 0.22], 0.017, 0.012, 'leafd', { paint: 1 }]);
  }
  const wing = xf([
    ['poly', [0, 0.64, 0], [[0.1, 0.04], [0.4, 0.04], [0.42, -0.06], [0.38, -0.2], [0.34, -0.28], [0.3, -0.2], [0.26, -0.29], [0.22, -0.2], [0.18, -0.28], [0.14, -0.19], [0.1, -0.16]], 0.019, 'f', { plane: 'xz' }],
    ['poly', [0, 0.64, 0], [[0.1, 0.04], [0.4, 0.04], [0.41, -0.05], [0.1, -0.06]], 0.024, 'f2', { plane: 'xz' }],
    ['cap', [0.13, 0.645, -0.0], [0.41, 0.655, 0.0], 0.042, 0.026, 'f'],
    ['poly', F, fanPts, 0.02, 'leaf', { plane: 'xz' }],
    ...veins,
    ['sph', F, 0.035, 'leafd'],
  ], S, WR);
  const tail = xf([
    ['poly', [0, 0.36, 0], [[-0.06, -0.08], [0.06, -0.08], [0.13, -0.36], [0.08, -0.32], [0.045, -0.4], [0, -0.35], [-0.045, -0.4], [-0.08, -0.32], [-0.13, -0.36]], 0.019, 'f', { plane: 'xz', stripes: { axis: 'x', p: 0.09, w: 0.03, col: 'f2', o: 0.03 } }],
  ], [0, 0.36, -0.1], [-38, 0, 0]);
  const hat = xf([
    ['cyl', [0, 0.935, 0.06], [0, 1.0, 0.06], 0.06, 'lac'],
    ['sph', [0, 1.0, 0.06], 0.046, 'lac'],
    ['tor', [0, 0.95, 0.06], 0.062, 0.013, 'sash'],
  ], [0, 0.94, 0.06], [18, 0, 0]);
  DESIGNS.tengale = {
    id: 'tengale', vs: 0.027, arch: 'flyer',
    pal: {
      f: '#1d1e2a', f2: '#323a58', sheen: '#46598f', red: '#d8282a', redd: '#97171b', wh: '#f4f1e8', lac: '#0f0d12',
      leaf: '#5cc24c', leafd: '#2c7a30', wood: '#b47c40', woodd: '#734a24', hanao: '#d61f2c', leg: '#3c3846', sash: '#f09a2a', bk: '#2b2733',
    },
    anim: { quirk: ['nod', 'flex', 'sway', 'stretch'], hover: 0.22, flap: 0.75, bounce: 0.8, maxSpeed: 5 },
    parts: [
      { n: 'body', p: [0, 0.42, 0], s: [
        ['ell', [0, 0.48, -0.01], [0.165, 0.205, 0.15], 'f', { top: 'f2', topT: 0.6, dither: { col: 'f2', amt: 0.12 } }],
        ['tor', [0, 0.615, 0.0], 0.105, 0.032, 'sash'],
        ['sph', [0.068, 0.535, 0.135], 0.05, 'wh', { m: 1, noise: 0.008, noiseScale: 0.02 }],
        ['cap', [0.068, 0.585, 0.12], [0.068, 0.55, 0.14], 0.012, 0.012, 'sash', { m: 1 }],
      ] },
      { n: 'head', parent: 'body', p: [0, 0.66, 0.0], s: [
        ['ell', [0, 0.8, 0.02], [0.18, 0.165, 0.165], 'f', { top: 'f2', topT: 0.7 }],
        // flat red tengu mask
        ['ell', [0, 0.8, 0.112], [0.165, 0.128, 0.082], 'red'],
        ['cap', [0, 0.775, 0.17], [0, 0.765, 0.4], 0.036, 0.026, 'red'],
        ['sph', [0, 0.765, 0.4], 0.03, 'red'],
        ['ell', [0.03, 0.755, 0.2], [0.012, 0.01, 0.012], 'redd', { m: 1 }],
        // bushy white brows
        ['cap', [0.03, 0.902, 0.172], [0.158, 0.935, 0.1], 0.03, 0.016, 'wh', { m: 1 }],
        ['ell', [0, 0.705, 0.158], [0.05, 0.028, 0.045], 'bk'],
        // swept-back crest feathers
        ['cap', [0, 0.87, -0.08], [0, 0.92, -0.24], 0.04, 0.008, 'f'],
        ['cap', [0.06, 0.85, -0.09], [0.1, 0.87, -0.22], 0.034, 0.008, 'f', { m: 1 }],
        ...hat,
      ] },
      { n: 'wingL', parent: 'body', p: S, mirror: true, s: wing },
      { n: 'tail', parent: 'body', p: [0, 0.36, -0.1], s: tail },
      { n: 'legL', parent: 'body', p: [0.07, 0.31, 0], mirror: true, s: [
        ['ell', [0.07, 0.275, 0.0], [0.06, 0.065, 0.06], 'f'],
        ['cap', [0.07, 0.22, 0.01], [0.07, 0.11, 0.02], 0.02, 0.018, 'leg'],
        ['cap', [0.07, 0.1, 0.02], [0.04, 0.095, 0.085], 0.013, 0.01, 'leg'],
        ['cap', [0.07, 0.1, 0.02], [0.07, 0.095, 0.095], 0.013, 0.01, 'leg'],
        ['cap', [0.07, 0.1, 0.02], [0.1, 0.095, 0.085], 0.013, 0.01, 'leg'],
        ['box', [0.07, 0.072, 0.03], [0.046, 0.013, 0.08], 'wood'],
        ['box', [0.07, 0.03, 0.03], [0.032, 0.03, 0.013], 'woodd'],
        ['cap', [0.035, 0.092, 0.085], [0.105, 0.092, 0.085], 0.011, 0.011, 'hanao'],
      ] },
    ],
    eyes: { part: 'head', at: [0.09, 0.832, 0.19], dir: [0.22, 0.04, 1], style: 'anime', iris: '#f5b40f', px: 0.8 },
    mouth: { part: 'head', at: [0, 0.7, 0.2], dir: [0, -0.1, 1], style: 'beak', px: 0.6 },
    fx: [{ part: 'wingL', at: P3(S, WR, [0.58, 0.64, -0.1]), type: 'leaf', rate: 0.6, mirror: true }],
  };
}
LORE.tengale = {
  name: 'Tengale', element: 'aero', stage: 1, height: '1.0 m',
  desc: 'A crow-tengu that trains alone on the cedar slopes of Mt. Ikoma. One sweep of its leaf-fan wings can blow a delivery drone clean out of the Osaka sky.',
  personality: 'Proud, stern hermit who secretly loves teaching young trainers.',
  look: 'Glossy black crow in a red long-nosed tengu mask, white bushy brows, black tokin cap, yamabushi pom-pom sash, yatsude-leaf-fan wingtips and one-toothed geta.',
};

// ---------------------------------------------------------------- 4. Yukiusa
{
  const flake = (c, R, glow) => [0, 60, 120].map((a) => ['box', c, [R, 0.0095, 0.0095], 'icel', { rot: [0, 0, a], glow }])
    .concat([0, 60, 120, 180, 240, 300].map((a) => ['box', [c[0] + Math.cos(a * D2R) * R * 0.66, c[1] + Math.sin(a * D2R) * R * 0.66, c[2]], [0.0095, R * 0.3, 0.0095], 'icel', { rot: [0, 0, a], glow }]));
  DESIGNS.yukiusa = {
    id: 'yukiusa', vs: 0.018, arch: 'hopper',
    pal: {
      w: '#e4eefc', b: '#adc8ef', bd: '#86a8dc', bel: '#f7fbff', ice: '#8fdcff', iced: '#4fb4e8', icel: '#6fe4ff', tipg: '#62f2ff',
      pk: '#ffb3c6', nose: '#ff8fae', fr: '#c7e2ff',
    },
    anim: { quirk: ['sniff', 'hop', 'shakeoff', 'sway'], bounce: 1.1, maxSpeed: 4 },
    parts: [
      { n: 'body', p: [0, 0.13, 0], s: [
        ['ell', [0, 0.135, -0.02], [0.12, 0.12, 0.135], 'w', { back: 'b', backT: 0.5, top: 'b', topT: 0.7, dither: { col: 'fr', amt: 0.12 } }],
        ['ell', [0, 0.16, 0.06], [0.088, 0.1, 0.075], 'bel'],
        ['tor', [0, 0.22, 0.03], 0.075, 0.035, 'w', { rot: [-18, 0, 0], noise: 0.01, noiseScale: 0.025 }],
        // tiny frost shards on the back
        ['cap', [0.05, 0.23, -0.07], [0.07, 0.28, -0.1], 0.016, 0.004, 'ice', { m: 1 }],
        ['cap', [0, 0.25, -0.1], [0, 0.29, -0.14], 0.016, 0.004, 'ice'],
      ] },
      { n: 'head', parent: 'body', p: [0, 0.22, 0.05], s: [
        ['ell', [0, 0.275, 0.075], [0.118, 0.098, 0.092], 'w', { top: 'b', topT: 0.8 }],
        ['ell', [0.07, 0.235, 0.09], [0.05, 0.04, 0.05], 'w', { m: 1, noise: 0.006, noiseScale: 0.02 }],
        ['ell', [0, 0.248, 0.155], [0.035, 0.026, 0.02], 'bel'],
        ['ell', [0, 0.262, 0.168], [0.012, 0.009, 0.008], 'nose'],
        ['ell', [0.078, 0.245, 0.12], [0.026, 0.016, 0.02], 'pk', { m: 1, paint: 1 }],
      ] },
      { n: 'earL', parent: 'head', p: [0.045, 0.345, 0.06], mirror: true, s: [
        ['cap', [0.045, 0.34, 0.06], [0.06, 0.41, 0.05], 0.034, 0.03, 'w'],
        ['cap', [0.06, 0.4, 0.05], [0.09, 0.53, 0.02], 0.032, 0.012, 'ice', { tip: 'tipg', tipT: 0.72 }],
        ['cap', [0.075, 0.46, 0.035], [0.09, 0.53, 0.02], 0.016, 0.008, 'tipg', { glow: 2 }],
        ['cap', [0.06, 0.41, 0.06], [0.1, 0.45, 0.07], 0.012, 0.004, 'iced'],
        ['cap', [0.07, 0.44, 0.03], [0.05, 0.49, 0.0], 0.01, 0.004, 'iced'],
      ] },
      { n: 'legFL', parent: 'body', p: [0.045, 0.1, 0.085], mirror: true, s: [
        ['cap', [0.045, 0.1, 0.085], [0.05, 0.02, 0.105], 0.026, 0.024, 'w'],
      ] },
      { n: 'legBL', parent: 'body', p: [0.08, 0.11, -0.05], mirror: true, s: [
        ['ell', [0.085, 0.095, -0.04], [0.052, 0.075, 0.09], 'w', { dither: { col: 'fr', amt: 0.12 } }],
        ['ell', [0.09, 0.02, 0.035], [0.036, 0.02, 0.07], 'w'],
        ['ell', [0.09, 0.012, 0.06], [0.03, 0.01, 0.04], 'pk', { paint: 1 }],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.12, -0.14], s: [
        ['sph', [0, 0.13, -0.16], 0.045, 'w', { noise: 0.008, noiseScale: 0.02 }],
        ...flake([0, 0.144, -0.198], 0.085, 1),
      ] },
    ],
    eyes: { part: 'head', at: [0.052, 0.285, 0.155], dir: [0.3, 0.05, 1], style: 'big', iris: '#f0466a', px: 0.68 },
    mouth: { part: 'head', at: [0, 0.236, 0.172], dir: [0, -0.15, 1], style: 'w', px: 0.45 },
    decals: [{ part: 'head', at: [0, 0.345, 0.12], dir: [0, 0.6, 1], px: 0.7, rows: ['..c..', 'c.c.c', '.ccc.', 'c.c.c', '..c..'], cmap: { c: { c: '#3fc8ff', glow: 1 } } }],
    fx: [
      { part: 'earL', at: [0.09, 0.53, 0.02], type: 'snow', rate: 0.6, scale: 0.6, mirror: true },
      { part: 'tail', at: [0, 0.13, -0.2], type: 'snow', rate: 0.4, scale: 0.5 },
    ],
  };
}
LORE.yukiusa = {
  name: 'Yukiusa', element: 'cryo', stage: 1, height: '0.5 m',
  desc: 'Said to be a snow-rabbit sculpture that a lonely child wished to life. It only appears on still winter nights, and melts away if you stare too long.',
  personality: 'Painfully shy; hides its face in its paws, then peeks.',
  look: 'Frosty blue-white rabbit with nanten-berry red eyes, icicle-crystal ears with glowing cyan tips, a snowflake puff tail and a frost mark on its brow.',
};
