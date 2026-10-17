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

// Uniformly scale a design's geometry (shapes, pivots, face anchors, fx anchors) by k.
function scaled(d, k, vs) {
  const v = (a) => a.map((x) => x * k);
  const so = (o) => {
    if (!o) return o;
    const r = Object.assign({}, o);
    for (const key of ['fat', 'noise', 'noiseScale', 'round']) if (r[key] != null) r[key] *= k;
    if (r.stripes) r.stripes = Object.assign({}, r.stripes, { p: r.stripes.p * k, w: r.stripes.w * k, o: (r.stripes.o || 0) * k });
    if (r.spots) r.spots = Object.assign({}, r.spots, { s: (r.spots.s || 0.06) * k });
    if (r.grad) r.grad = Object.assign({}, r.grad, { a: r.grad.a * k, b: r.grad.b * k });
    return r;
  };
  const sh = (t) => {
    const o = t.slice();
    switch (t[0]) {
      case 'sph': o[1] = v(t[1]); o[2] = t[2] * k; o[4] = so(t[4]); break;
      case 'ell': case 'box': o[1] = v(t[1]); o[2] = v(t[2]); o[4] = so(t[4]); break;
      case 'cap': o[1] = v(t[1]); o[2] = v(t[2]); o[3] = t[3] * k; o[4] = t[4] * k; o[6] = so(t[6]); break;
      case 'cyl': o[1] = v(t[1]); o[2] = v(t[2]); o[3] = t[3] * k; o[5] = so(t[5]); break;
      case 'tor': o[1] = v(t[1]); o[2] = t[2] * k; o[3] = t[3] * k; o[5] = so(t[5]); break;
      case 'poly': o[1] = v(t[1]); o[2] = t[2].map(v); o[3] = t[3] * k; o[5] = so(t[5]); break;
      default: break;
    }
    while (o.length && o[o.length - 1] === undefined) o.pop();
    return o;
  };
  const face = (f) => (f ? Object.assign({}, f, f.at ? { at: v(f.at) } : {}) : f);
  return Object.assign({}, d, {
    vs: vs || d.vs * k,
    parts: d.parts.map((p) => Object.assign({}, p, { p: v(p.p), s: p.s.map(sh) })),
    eyes: face(d.eyes), mouth: face(d.mouth),
    decals: d.decals ? d.decals.map(face) : d.decals,
    fx: d.fx ? d.fx.map((f) => Object.assign({}, f, { at: v(f.at), scale: (f.scale ?? 1) * k })) : d.fx,
    anim: d.anim ? Object.assign({}, d.anim, d.anim.hover ? { hover: d.anim.hover * k } : {}) : d.anim,
  });
}

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

// ---------------------------------------------------------------- 5. Cabbunny
{
  const leaf = (a, y, tilt, w, h, col) => xf([
    ['ell', [0, y, 0.135], [w, h, 0.026], col, { rot: [tilt, 0, 0] }],
    ['cap', [0, y - h * 0.85, 0.15], [0, y + h * 0.7, 0.16 + tilt * 0.0012], 0.011, 0.006, 'vein', { paint: 1 }],
  ], [0, 0, 0], [0, a, 0]);
  const leaves = [];
  for (let i = 0; i < 7; i++) leaves.push(...leaf(i * (360 / 7) + 25, 0.12, 22, 0.085, 0.105, 'lf'));
  for (let i = 0; i < 7; i++) leaves.push(...leaf(i * (360 / 7) + 50, 0.085, 30, 0.08, 0.08, 'lfd'));
  DESIGNS.cabbunny = {
    id: 'cabbunny', vs: 0.016, arch: 'hopper',
    pal: {
      cb: '#c5ec86', lf: '#86cc4f', lfd: '#5aa83a', vein: '#e8f7bf', hd: '#e9f6bb', hdd: '#c9e68c', or: '#ff8a1e', ord: '#e05f10',
      ft: '#f3eccb', pk: '#ff9db0', nose: '#ff7f9a',
    },
    anim: { quirk: ['happy', 'hop', 'spin', 'sniff'], bounce: 1.3, maxSpeed: 3.5 },
    parts: [
      { n: 'body', p: [0, 0.13, 0], s: [
        ['sph', [0, 0.14, -0.01], 0.135, 'cb', { stripes: { axis: 'y', p: 0.048, w: 0.016, col: 'hdd', o: 0.008 } }],
        ...leaves,
      ] },
      { n: 'head', parent: 'body', p: [0, 0.25, 0.03], s: [
        ['ell', [0, 0.3, 0.05], [0.108, 0.088, 0.088], 'hd', { top: 'hdd', topT: 0.55, back: 'hdd', backT: 0.4 }],
        ['ell', [0.068, 0.262, 0.07], [0.042, 0.035, 0.042], 'hd', { m: 1 }],
        ['cap', [0, 0.39, 0.02], [0, 0.33, -0.06], 0.01, 0.01, 'cb', { paint: 1 }],
        ['ell', [0, 0.27, 0.125], [0.032, 0.024, 0.02], 'hd'],
        ['ell', [0, 0.284, 0.14], [0.012, 0.009, 0.008], 'nose'],
        ['ell', [0.07, 0.262, 0.105], [0.024, 0.015, 0.02], 'pk', { m: 1, paint: 1 }],
        // little sprout curl on top
        ['cap', [0, 0.38, 0.03], [0.0, 0.42, 0.0], 0.012, 0.01, 'lfd'],
        ['ell', [0.025, 0.425, 0.0], [0.028, 0.01, 0.018], 'lf', { rot: [0, 0, 20] }],
      ] },
      { n: 'earL', parent: 'head', p: [0.045, 0.37, 0.03], mirror: true, s: xf([
        ['ell', [0.045, 0.44, 0.03], [0.036, 0.085, 0.016], 'lf'],
        ['ell', [0.045, 0.43, 0.042], [0.022, 0.06, 0.008], 'lfd', { paint: 1 }],
        ['cap', [0.045, 0.37, 0.045], [0.045, 0.5, 0.045], 0.008, 0.008, 'vein', { paint: 1 }],
        ['ell', [0.045, 0.505, 0.03], [0.04, 0.045, 0.03], 'or', { paint: 1, grad: { axis: 'y', to: 'ord', a: 0.48, b: 0.53 } }],
      ], [0.045, 0.37, 0.03], [-8, 0, -18]) },
      { n: 'legFL', parent: 'body', p: [0.05, 0.05, 0.09], mirror: true, s: [
        ['ell', [0.055, 0.025, 0.1], [0.03, 0.025, 0.038], 'ft'],
      ] },
      { n: 'legBL', parent: 'body', p: [0.085, 0.06, -0.03], mirror: true, s: [
        ['ell', [0.095, 0.028, 0.0], [0.035, 0.026, 0.065], 'ft'],
        ['ell', [0.095, 0.01, 0.025], [0.025, 0.008, 0.035], 'pk', { paint: 1 }],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.12, -0.13], s: [
        ['sph', [0, 0.13, -0.155], 0.035, 'ft', { noise: 0.006, noiseScale: 0.015 }],
      ] },
    ],
    eyes: { part: 'head', at: [0.045, 0.31, 0.13], dir: [0.3, 0.05, 1], style: 'anime', iris: '#5a3a1a', px: 0.78 },
    mouth: { part: 'head', at: [0, 0.262, 0.145], dir: [0, -0.1, 1], style: 'cat', px: 0.5 },
    fx: [{ part: 'head', at: [0.03, 0.43, 0.0], type: 'spore', rate: 0.25, scale: 0.5 }],
  };
}
LORE.cabbunny = {
  name: 'Cabbunny', element: 'bio', stage: 1, height: '0.45 m',
  desc: 'Farmers find Cabbunny napping in their cabbage rows and can never tell it apart from the harvest. It regrows a fresh outer leaf every morning.',
  personality: 'Sunny, bouncy and always hungry — mostly for itself.',
  look: 'Round layered-cabbage body with a pale cabbage-heart head, leaf ears dipped carrot-orange, a sprout curl and a beaming face.',
};

// ---------------------------------------------------------------- 6. Moglow
{
  const star = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.31;
    star.push(['cap', [0, 0.19, 0.345], [Math.cos(a) * 0.045, 0.19 + Math.sin(a) * 0.04, 0.36], 0.011, 0.009, 'pk']);
  }
  const claws = (x0, z0) => [-0.036, -0.012, 0.012, 0.036].map((dx, i) => ['cap', [x0 + dx, 0.035, z0 + 0.04], [x0 + dx * 1.6 + 0.015, 0.012, z0 + 0.125 - Math.abs(dx) * 0.6], 0.014, 0.007, 'cl']);
  DESIGNS.moglow = scaled({
    id: 'moglow', vs: 0.018, arch: 'quad',
    pal: {
      f: '#6f5242', fd: '#5a4234', fl: '#9c7a62', dust: '#7e604e', face: '#c8a586', pk: '#ff8aa6', pkd: '#e0647f', paw: '#f0c7a8', cl: '#f7efe0',
      hel: '#ffc928', held: '#d99a12', heli: '#5a4630', lamp: '#8a8f99', lampg: '#fff4b0', blk: '#2a2420',
    },
    anim: { quirk: ['sniff', 'scratch', 'shakeoff', 'stretch'], bounce: 0.9, gait: 1.2, stride: 0.8, maxSpeed: 2.6 },
    parts: [
      { n: 'body', p: [0, 0.18, 0], s: [
        ['ell', [0, 0.19, -0.04], [0.16, 0.15, 0.21], 'f', { dither: { col: 'dust', amt: 0.25 } }],
        ['ell', [0, 0.14, 0.02], [0.12, 0.09, 0.15], 'fl', { paint: 1, belly: 'fl', bellyT: 0.2 }],
      ] },
      { n: 'head', parent: 'body', p: [0, 0.24, 0.12], s: [
        ['ell', [0, 0.245, 0.17], [0.13, 0.115, 0.115], 'f', { dither: { col: 'dust', amt: 0.25 } }],
        ['cap', [0, 0.22, 0.24], [0, 0.195, 0.33], 0.06, 0.04, 'f'],
        ['ell', [0, 0.235, 0.26], [0.11, 0.05, 0.05], 'face', { paint: 1 }],
        ['cap', [0, 0.22, 0.27], [0, 0.195, 0.33], 0.05, 0.045, 'face', { paint: 1 }],
        ['sph', [0, 0.19, 0.345], 0.03, 'pk'],
        ...star,
        ['sph', [0, 0.19, 0.372], 0.014, 'pkd'],
        ['ell', [0.085, 0.205, 0.235], [0.03, 0.018, 0.02], 'pk', { m: 1, paint: 1 }],
        // miner helmet + lamp
        ['ell', [0, 0.315, 0.15], [0.125, 0.085, 0.125], 'hel', { top: 'hel', stripes: { axis: 'x', p: 0.144, w: 0.018, col: 'held', o: -0.009 } }],
        ['cyl', [0, 0.292, 0.15], [0, 0.31, 0.15], 0.14, 'held'],
        ['ell', [0, 0.27, 0.16], [0.11, 0.03, 0.1], 'heli', { sub: 0, paint: 1 }],
        ['box', [0, 0.335, 0.262], [0.03, 0.03, 0.014], 'held'],
        ['cyl', [0, 0.338, 0.262], [0, 0.338, 0.3], 0.038, 'lamp'],
        ['cyl', [0, 0.338, 0.296], [0, 0.338, 0.31], 0.03, 'lampg', { glow: 2 }],
      ] },
      { n: 'legFL', parent: 'body', p: [0.11, 0.16, 0.1], mirror: true, s: [
        ['cap', [0.11, 0.16, 0.1], [0.15, 0.05, 0.13], 0.045, 0.04, 'f'],
        ['ell', [0.165, 0.038, 0.15], [0.075, 0.032, 0.07], 'paw', { rot: [0, 0, -10] }],
        ...claws(0.165, 0.15),
      ] },
      { n: 'legBL', parent: 'body', p: [0.1, 0.12, -0.15], mirror: true, s: [
        ['cap', [0.1, 0.12, -0.15], [0.11, 0.04, -0.14], 0.045, 0.035, 'f'],
        ['ell', [0.115, 0.022, -0.115], [0.04, 0.022, 0.06], 'paw'],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.15, -0.24], s: [
        ['cap', [0, 0.15, -0.24], [0, 0.13, -0.32], 0.022, 0.012, 'pk'],
      ] },
    ],
    eyes: { part: 'head', at: [0.06, 0.255, 0.27], dir: [0.4, 0.0, 1], style: 'sleepy', iris: '#2a1c14', px: 0.72 },
    mouth: { part: 'head', at: [0, 0.16, 0.315], dir: [0, -0.5, 1], style: 'tiny', px: 0.6 },
    fx: [
      { part: 'head', at: [0, 0.338, 0.33], type: 'glow', rate: 0.6, scale: 0.5, color: '#fff2a0' },
      { part: 'legFL', at: [0.17, 0.02, 0.2], type: 'dust', rate: 0.15, scale: 0.5, mirror: true },
    ],
  }, 1.2, 0.019);
}
LORE.moglow = {
  name: 'Moglow', element: 'geo', stage: 1, height: '0.5 m',
  desc: 'Moglow tunnels under the rice paddies by lamplight, sniffing out buried geodes with its star-shaped nose. Farmers follow its glow to find spring water.',
  personality: 'Sleepy, diligent and very proud of its helmet.',
  look: 'Dusty brown velvet mole with a pink star nose, a yellow miner\'s helmet with a glowing headlamp, and huge pale digging claws.',
};

// ---------------------------------------------------------------- 7. Mechanyan
{
  const ear = (side) => {
    const x = 0.13 * side;
    return [
      ['poly', [x, 0.8, 0.0], [[-0.08, -0.02], [0.08, -0.02], [0.0, 0.16]], 0.035, 'w', { rot: [0, 0, -16 * side] }],
      ['poly', [x, 0.8, 0.03], [[-0.048, 0.0], [0.048, 0.0], [0.0, 0.11]], 0.012, 'r', { rot: [0, 0, -16 * side] }],
    ];
  };
  DESIGNS.mechanyan = {
    id: 'mechanyan', vs: 0.026, arch: 'biped',
    pal: {
      w: '#f3f5fa', wg: '#c7cedc', r: '#e8323c', rd: '#a8202a', dk: '#262a38', vis: '#121624', gold: '#ffcc33', goldd: '#c98e12',
      led: '#5ff6ff', cab: '#2c2f3a', plug: '#f0f0f0', pin: '#c8ccd6',
    },
    anim: { quirk: ['nod', 'happy', 'spin', 'flex'], bounce: 1.0, gait: 1.1, maxSpeed: 4 },
    parts: [
      { n: 'body', p: [0, 0.22, 0], s: [
        ['ell', [0, 0.35, 0], [0.165, 0.155, 0.135], 'w', { stripes: { axis: 'y', p: 0.208, w: 0.026, col: 'wg', o: 0.0 } }],
        ['ell', [0, 0.32, 0.075], [0.1, 0.095, 0.07], 'wg', { paint: 1 }],
        ['box', [0, 0.32, 0.13], [0.06, 0.035, 0.04], 'r', { paint: 1 }],
        // collar + suzu bell
        ['tor', [0, 0.49, 0.0], 0.115, 0.03, 'r'],
        ['sph', [0, 0.44, 0.14], 0.045, 'gold'],
        ['box', [0, 0.43, 0.18], [0.03, 0.005, 0.02], 'goldd', { paint: 1 }],
        ['sph', [0, 0.415, 0.18], 0.01, 'dk'],
        // back battery pack
        ['box', [0, 0.37, -0.13], [0.09, 0.1, 0.035], 'wg', { round: 0.02 }],
        ['box', [0, 0.4, -0.16], [0.05, 0.02, 0.01], 'led', { glow: 2 }],
      ] },
      { n: 'head', parent: 'body', p: [0, 0.5, 0.0], s: [
        ['ell', [0, 0.68, 0.02], [0.225, 0.19, 0.19], 'w'],
        // red racing stripe
        ['box', [0, 0.82, 0.0], [0.039, 0.09, 0.25], 'r', { paint: 1 }],
        // seam ring
        ['tor', [0, 0.62, 0.02], 0.205, 0.016, 'wg'],
        // visor glass
        ['ell', [0, 0.705, 0.115], [0.19, 0.075, 0.1], 'vis'],
        // muzzle + nose
        ['ell', [0, 0.61, 0.15], [0.085, 0.05, 0.06], 'w'],
        ['ell', [0, 0.635, 0.205], [0.018, 0.012, 0.01], 'r'],
        // whisker vents
        ...[0.62, 0.595].map((y) => ['box', [0.16, y, 0.13], [0.035, 0.006, 0.03], 'dk', { m: 1, rot: [0, -35, 0], paint: 1 }]),
        ...ear(1), ...ear(-1),
        // antennae
        ['cyl', [0.158, 0.9, 0.0], [0.2, 1.04, 0.0], 0.014, 'dk', { m: 1 }],
        ['sph', [0.2, 1.045, 0.0], 0.024, 'led', { m: 1, glow: 2 }],
      ] },
      { n: 'armL', parent: 'body', p: [0.15, 0.44, 0.0], s: [
        ['sph', [0.15, 0.44, 0.0], 0.045, 'wg'],
        ['cap', [0.16, 0.42, 0.0], [0.2, 0.28, 0.03], 0.04, 0.036, 'w'],
        ['sph', [0.205, 0.255, 0.04], 0.045, 'w'],
        // koban coin
        ['ell', [0.215, 0.255, 0.1], [0.045, 0.065, 0.012], 'gold', { rot: [-10, 0, 0] }],
        ['ell', [0.215, 0.255, 0.112], [0.03, 0.045, 0.004], 'goldd', { rot: [-10, 0, 0], paint: 1 }],
      ] },
      { n: 'beckon', parent: 'body', p: [-0.15, 0.44, 0.0], sway: { axis: 'x', amp: 0.35, freq: 1.6, move: 0 }, s: [
        ['sph', [-0.15, 0.44, 0.0], 0.045, 'wg'],
        ['cap', [-0.17, 0.46, 0.0], [-0.24, 0.6, 0.02], 0.04, 0.036, 'w'],
        ['sph', [-0.25, 0.64, 0.04], 0.05, 'w'],
        ['ell', [-0.25, 0.64, 0.088], [0.03, 0.03, 0.01], 'r'],
        ...[-0.022, 0, 0.022].map((dx) => ['sph', [-0.25 + dx, 0.675, 0.085], 0.01, 'r']),
      ] },
      { n: 'legL', parent: 'body', p: [0.08, 0.22, 0], mirror: true, s: [
        ['cap', [0.08, 0.22, 0], [0.085, 0.08, 0.0], 0.045, 0.04, 'w'],
        ['sph', [0.085, 0.13, 0.01], 0.032, 'wg'],
        ['ell', [0.088, 0.04, 0.035], [0.06, 0.042, 0.08], 'r', { top: 'w', topT: 0.8 }],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.27, -0.12], s: [
        ['cap', [0, 0.27, -0.12], [0, 0.28, -0.27], 0.025, 0.025, 'cab', { stripes: { axis: 'z', p: 0.078, w: 0.026, col: 'dk' } }],
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 0.28, -0.27], s: [
        ['cap', [0, 0.28, -0.27], [0, 0.42, -0.36], 0.025, 0.025, 'cab'],
      ] },
      { n: 'tail3', parent: 'tail2', p: [0, 0.42, -0.36], s: [
        ['cap', [0, 0.42, -0.36], [0, 0.55, -0.33], 0.025, 0.025, 'cab'],
        ['box', [0, 0.6, -0.33], [0.045, 0.05, 0.032], 'plug', { round: 0.015 }],
        ['box', [0, 0.6, -0.295], [0.03, 0.01, 0.004], 'r', { paint: 1 }],
        ['box', [0.02, 0.67, -0.33], [0.008, 0.025, 0.013], 'pin'],
        ['box', [-0.02, 0.67, -0.33], [0.008, 0.025, 0.013], 'pin'],
      ] },
    ],
    eyes: { part: 'head', at: [0.085, 0.71, 0.21], dir: [0.18, 0, 1], style: 'visor', iris: '#5ff6ff', px: 0.95, cmap: { k: { c: '#5ff6ff', glow: 2 } } },
    mouth: { part: 'head', at: [0, 0.6, 0.21], dir: [0, -0.2, 1], style: 'cat', px: 0.6 },
    fx: [{ part: 'head', at: [0.2, 1.05, 0], type: 'spark', rate: 0.15, scale: 0.4, mirror: true }],
  };
}
LORE.mechanyan = {
  name: 'Mechanyan', element: 'ferro', stage: 1, height: '1.0 m',
  desc: 'Built in a Den-Den Town workshop as a lucky shop mascot, it learned to battle by watching League broadcasts. Its beckoning paw never stops — it is always calling in good fortune.',
  personality: 'Upbeat, loyal and a little bit of a show-off.',
  look: 'White-and-red robo maneki-neko with an LED visor, antenna ears, a gold suzu bell and koban coin, a raised beckoning paw and a power-cable tail ending in a plug.',
};

// ---------------------------------------------------------------- 8. Idolark
{
  const S = [0.12, 0.33, -0.02], WR = [26, 0, 24];
  const wing = xf([
    ['poly', [0, 0.33, 0], [[0.09, 0.07], [0.3, 0.06], [0.43, -0.01], [0.41, -0.08], [0.37, -0.12], [0.33, -0.09], [0.29, -0.15], [0.25, -0.11], [0.21, -0.16], [0.17, -0.12], [0.12, -0.15], [0.09, -0.1]], 0.016, 'yl', { plane: 'xz', grad: { axis: 'x', to: 'pkd', a: 0.24, b: 0.43 } }],
    ['cap', [0.11, 0.335, 0.03], [0.32, 0.34, 0.04], 0.03, 0.018, 'pk'],
    ['poly', [0, 0.33, 0], [[0.1, 0.05], [0.3, 0.045], [0.33, 0.0], [0.1, -0.01]], 0.02, 'ylb', { plane: 'xz' }],
  ], S, WR);
  const star5 = (c, R, r, col, o = {}) => { const pts = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return ['poly', c, pts, 0.011, col, o]; };
  DESIGNS.idolark = {
    id: 'idolark', vs: 0.02, arch: 'flyer',
    pal: {
      pk: '#ffb0d4', pkd: '#ff7cb6', yl: '#ffe680', ylb: '#fff4c2', lav: '#cdb8ff', lavd: '#8f78e8', wh: '#ffffff', or: '#ffa63d',
      mic: '#ff4f9e', gold: '#ffd23f', rib: '#ff6fae', ribd: '#d9407f', ck: '#ff7fae',
    },
    anim: { quirk: ['spin', 'happy', 'sway', 'headbang'], hover: 0.2, flap: 1.25, bounce: 1.2, maxSpeed: 5 },
    parts: [
      { n: 'body', p: [0, 0.27, 0], s: [
        ['ell', [0, 0.27, -0.01], [0.135, 0.13, 0.13], 'pk'],
        ['ell', [0, 0.25, 0.05], [0.1, 0.1, 0.09], 'yl', { paint: 1 }],
        star5([0, 0.335, 0.125], 0.035, 0.015, 'gold', { rot: [-20, 0, 0] }),
      ] },
      { n: 'head', parent: 'body', p: [0, 0.37, 0.0], s: [
        ['ell', [0, 0.48, 0.02], [0.145, 0.13, 0.135], 'pk'],
        ['ell', [0, 0.455, 0.09], [0.1, 0.07, 0.07], 'ylb', { paint: 1 }],
        ['ell', [0, 0.45, 0.165], [0.03, 0.022, 0.03], 'or'],
        ['ell', [0.085, 0.45, 0.115], [0.03, 0.018, 0.02], 'ck', { m: 1, paint: 1 }],
        // headset: band, ear cups, mic boom
        ['tor', [0, 0.48, 0.0], 0.152, 0.022, 'wh', { axis: 'z' }],
        ['box', [0, 0.39, 0.0], [0.2, 0.09, 0.05], 'lav', { sub: 1 }],
        ['cyl', [0.13, 0.47, 0.01], [0.17, 0.47, 0.01], 0.055, 'lav', { m: 1 }],
        ['cyl', [0.165, 0.47, 0.01], [0.176, 0.47, 0.01], 0.038, 'mic', { m: 1 }],
        ['cap', [0.16, 0.45, 0.04], [0.12, 0.405, 0.155], 0.015, 0.012, 'lavd'],
        ['sph', [0.105, 0.4, 0.17], 0.03, 'mic', { glow: 1 }],
        // lark crest feathers (sprout from the band)
        ['cap', [0, 0.6, -0.01], [0.0, 0.7, -0.06], 0.03, 0.008, 'pkd'],
        ['cap', [0.03, 0.59, 0.0], [0.07, 0.67, -0.03], 0.024, 0.007, 'yl', { m: 1 }],
      ] },
      { n: 'wingL', parent: 'body', p: S, mirror: true, s: wing },
      { n: 'tail', parent: 'body', p: [0, 0.22, -0.13], s: [
        ['cap', [0, 0.22, -0.12], [0, 0.2, -0.2], 0.05, 0.03, 'pk'],
        ['ell', [0.055, 0.25, -0.2], [0.055, 0.035, 0.022], 'rib', { rot: [0, 0, 22], m: 1 }],
        ['sph', [0, 0.235, -0.2], 0.026, 'ribd'],
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 0.23, -0.2], s: [
        ['poly', [0.035, 0, 0], [[-0.19, 0.245], [-0.22, 0.255], [-0.4, 0.13], [-0.37, 0.135], [-0.36, 0.1]], 0.011, 'rib', { plane: 'zy', m: 1, grad: { axis: 'z', to: 'ribd', a: -0.25, b: -0.4 } }],
      ] },
      { n: 'legL', parent: 'body', p: [0.05, 0.16, 0.0], mirror: true, s: [
        ['cap', [0.05, 0.16, 0.0], [0.05, 0.06, 0.01], 0.014, 0.012, 'or'],
        ['cap', [0.05, 0.06, 0.01], [0.05, 0.05, 0.05], 0.012, 0.01, 'or'],
      ] },
    ],
    eyes: { part: 'head', at: [0.058, 0.495, 0.15], dir: [0.3, 0.05, 1], style: 'star', iris: '#29c9ff', px: 0.95 },
    mouth: { part: 'head', at: [0, 0.44, 0.19], dir: [0, -0.1, 1], style: 'beak', px: 0.5 },
    fx: [
      { part: 'head', at: [0.105, 0.42, 0.19], type: 'note', rate: 1.2, scale: 0.7 },
      { part: 'head', at: [0, 0.62, 0], type: 'star', rate: 0.8, scale: 0.5, color: '#ffe680' },
    ],
  };
}
LORE.idolark = {
  name: 'Idolark', element: 'echo', stage: 1, height: '0.7 m',
  desc: 'Idolark rehearse at dawn on the rooftops of Namba, and a flock harmonising can drown out a stadium. They will only perform encores for trainers who clap on the beat.',
  personality: 'Bubbly diva who lives for applause.',
  look: 'Pastel pink-and-yellow lark with sparkly star eyes, a lavender headset-mic crest, frilly gradient wings and a ribbon-bow tail.',
};

// ---------------------------------------------------------------- 9. Marionoir
{
  const V = 0.028, HX = 11 * V; // lattice-aligned string x
  const diamond = (c, w, h, col) => ['poly', c, [[0, h], [w, 0], [0, -h], [-w, 0]], 0.3, col, { paint: 1 }];
  const ruff = ring(10, 0.13, 0.97, 0.0, (a, x, z, i) => ['cap', [x * 0.6, 0.975, z * 0.6], [x * 1.5, 1.02 + (i % 2) * 0.025, z * 1.5], 0.038, 0.008, i % 2 ? 'stl' : 'blk', { tip: 'stll', tipT: 0.8 }]);
  const peplum = ring(10, 0.12, 0.6, Math.PI / 10, (a, x, z, i) => ['cap', [x * 0.7, 0.66, z * 0.7], [x * 1.65, 0.5, z * 1.65], 0.05, 0.012, i % 2 ? 'stl' : 'blk', { tip: i % 2 ? 'stll' : 'blk2', tipT: 0.75 }]);
  const str = (x, y0, y1, z = 0) => ['box', [x, (y0 + y1) / 2, z], [V * 0.5, (y1 - y0) / 2, V * 0.5], 'str', { glow: 1 }];
  DESIGNS.marionoir = {
    id: 'marionoir', vs: V, arch: 'floater',
    pal: {
      blk: '#17151d', blk2: '#2c2836', stl: '#8a93a6', stld: '#4f5668', stll: '#d3dae6', por: '#f2eee6', porsh: '#cfc9d8',
      wood: '#4e3220', woodl: '#7d5232', str: '#b45cff', bell: '#c9d0de', lip: '#5a2a6a', crk: '#2a2230',
    },
    anim: { quirk: ['sway', 'spin', 'headbang', 'roar'], hover: 0.18, bounce: 0.8, maxSpeed: 3 },
    parts: [
      { n: 'body', p: [0, 0.75, 0], s: [
        ['ell', [0, 0.86, 0], [0.18, 0.135, 0.115], 'blk'],
        diamond([0, 0.86, 0], 0.05, 0.075, 'stl'),
        diamond([0.11, 0.9, 0], 0.04, 0.06, 'stld'),
        diamond([-0.11, 0.9, 0], 0.04, 0.06, 'stld'),
        diamond([0.11, 0.79, 0], 0.035, 0.05, 'blk2'),
        diamond([-0.11, 0.79, 0], 0.035, 0.05, 'blk2'),
        ...[0.93, 0.86, 0.79].map((y) => ['sph', [0, y, 0.11], 0.017, 'stll']),
        ['sph', [0, 0.715, 0], 0.062, 'stl'],
        ['ell', [0, 0.635, 0], [0.13, 0.07, 0.095], 'blk'],
        ...peplum,
        ...ruff,
        ['sph', [0, 0.995, 0], 0.045, 'stl'],
      ] },
      { n: 'head', parent: 'body', p: [0, 1.0, 0], s: [
        ['ell', [0, 1.15, 0.01], [0.15, 0.16, 0.145], 'por', { back: 'porsh', backT: 0.3 }],
        // jester cap: black dome + two drooping horns (black / steel) with bells
        ['ell', [0, 1.245, -0.01], [0.162, 0.1, 0.157], 'blk'],
        ['cap', [0.08, 1.27, -0.01], [0.22, 1.37, -0.03], 0.062, 0.036, 'blk'],
        ['cap', [0.22, 1.37, -0.03], [0.3, 1.27, -0.05], 0.036, 0.018, 'blk'],
        ['sph', [0.305, 1.24, -0.05], 0.034, 'bell'],
        ['cap', [-0.08, 1.27, -0.01], [-0.2, 1.4, -0.02], 0.062, 0.036, 'stl'],
        ['cap', [-0.2, 1.4, -0.02], [-0.29, 1.31, -0.04], 0.036, 0.018, 'stl'],
        ['sph', [-0.295, 1.28, -0.04], 0.034, 'bell'],
        ['tor', [0, 1.2, 0.0], 0.15, 0.019, 'stl', { rot: [8, 0, 0] }],
        str(0, 1.33, 1.53),
      ] },
      { n: 'armL', parent: 'body', p: [0.2, 0.93, 0], mirror: true, s: [
        ['sph', [0.2, 0.935, 0], 0.062, 'stl', { stripes: { axis: 'y', p: 0.056, w: 0.028, col: 'stld' } }],
        ['cap', [0.215, 0.89, 0], [0.26, 0.77, 0.0], 0.036, 0.03, 'blk'],
        ['sph', [0.268, 0.745, 0.0], 0.034, 'stl'],
        ['cap', [0.275, 0.72, 0.0], [HX, 0.62, 0.0], 0.03, 0.026, 'blk', { stripes: { axis: 'y', p: 0.056, w: 0.028, col: 'stld' } }],
        ['sph', [HX, 0.6, 0.0], 0.026, 'stl'],
        ['ell', [HX, 0.55, 0.01], [0.035, 0.045, 0.022], 'por'],
        ['cap', [HX - 0.022, 0.525, 0.015], [HX - 0.03, 0.43, 0.03], 0.013, 0.008, 'por'],
        ['cap', [HX, 0.515, 0.02], [HX + 0.002, 0.41, 0.04], 0.013, 0.008, 'por'],
        ['cap', [HX + 0.022, 0.525, 0.015], [HX + 0.032, 0.43, 0.03], 0.013, 0.008, 'por'],
        str(HX, 0.6, 1.53),
      ] },
      { n: 'legL', parent: 'body', p: [0.07, 0.58, 0], mirror: true, sway: { axis: 'x', amp: 0.12, freq: 0.8, phase: 0 }, s: [
        ['cap', [0.07, 0.57, 0], [0.08, 0.4, 0.02], 0.042, 0.034, 'blk', { stripes: { axis: 'y', p: 0.084, w: 0.028, col: 'stld' } }],
        ['sph', [0.08, 0.38, 0.02], 0.04, 'stl'],
        ['cap', [0.08, 0.36, 0.02], [0.08, 0.19, 0.0], 0.033, 0.028, 'blk'],
        ['cap', [0.08, 0.15, 0.0], [0.09, 0.13, 0.12], 0.04, 0.016, 'blk'],
        ['cap', [0.09, 0.13, 0.12], [0.09, 0.19, 0.17], 0.016, 0.01, 'stl'],
        ['sph', [0.09, 0.2, 0.17], 0.018, 'bell'],
      ] },
      { n: 'ctrl', p: [0, 1.55, 0], sway: { axis: 'z', amp: 0.06, freq: 0.7 }, s: [
        ['box', [0, 1.554, 0], [HX + 0.03, 0.024, 0.024], 'wood', { stripes: { axis: 'x', p: 0.112, w: 0.028, col: 'woodl' } }],
        ['box', [0, 1.554, 0], [0.024, 0.024, 0.2], 'wood'],
        ['sph', [0, 1.56, 0], 0.045, 'stl'],
        ['sph', [HX + 0.03, 1.554, 0], 0.032, 'stl', { m: 1 }],
        ['sph', [0, 1.554, 0.2], 0.03, 'stl'],
        ['sph', [0, 1.554, -0.2], 0.03, 'stl'],
      ] },
    ],
    eyes: { part: 'head', at: [0.062, 1.16, 0.15], dir: [0.28, 0.02, 1], style: 'sharp', iris: '#c060ff', px: 0.8, cmap: { i: { c: '#c868ff', glow: 2 } } },
    mouth: { part: 'head', at: [0, 1.065, 0.15], dir: [0, -0.2, 1], style: 'zig', px: 0.62 },
    decals: [
      // pierrot diamonds above/below the eyes
      { part: 'head', at: [0.062, 1.225, 0.14], dir: [0.28, 0.25, 1], px: 0.5, rows: ['.k.', 'kkk', '.k.', '.k.'], cmap: { k: '#17151d' }, mirror: true },
      { part: 'head', at: [0.066, 1.105, 0.145], dir: [0.3, -0.1, 1], px: 0.5, rows: ['.k.', '.k.', 'kpk', '.k.'], cmap: { k: '#17151d', p: { c: '#b45cff', glow: 2 } }, mirror: true },
      // cracks
      { part: 'head', at: [-0.085, 1.21, 0.12], dir: [-0.45, 0.25, 1], px: 0.45, rows: ['k.....', '.k....', '.kk...', '...k.k', '...kk.', '....k.', '....k.', '.....k'], cmap: { k: '#2a2230' } },
      // marionette jaw lines
      { part: 'head', at: [0.05, 1.03, 0.13], dir: [0.25, -0.45, 1], px: 0.45, rows: ['k', 'k', 'k', 'k'], cmap: { k: '#2a2230' }, mirror: true },
    ],
    fx: [
      { part: 'ctrl', at: [HX + 0.03, 1.554, 0], type: 'wisp', rate: 0.5, scale: 0.6, mirror: true },
      { part: 'head', at: [0, 1.32, 0.0], type: 'wisp', rate: 0.25, scale: 0.5 },
    ],
  };
}
LORE.marionoir = {
  name: 'Marionoir', element: 'ecto', element2: 'ferro', stage: 2, height: '1.6 m',
  desc: 'Team Metallica\'s admin pulls its strings — or so everyone thinks. Some say the crossbar floats on its own, and the admin is the one dancing.',
  personality: 'Theatrical, cruel and always smiling; bows after every knockout.',
  look: 'Jointed black-and-steel harlequin marionette with a cracked porcelain face, glowing violet eyes, a two-horned jester cap, and a floating wooden control bar trailing purple strings.',
};

// ---------------------------------------------------------------- 10. Polaris (legendary sky whale)
{
  const BODY = { c: [0, 1.8, 0.9], r: [1.5, 1.32, 3.7] };
  const HEAD = { c: [0, 1.62, 3.15], r: [1.3, 1.08, 1.85] };
  const topY = (x, z) => {
    let best = null;
    for (const e of [BODY, HEAD]) {
      const q = 1 - (x / e.r[0]) ** 2 - ((z - e.c[2]) / e.r[2]) ** 2;
      if (q > 0) { const y = e.c[1] + e.r[1] * Math.sqrt(q); if (best == null || y > best) best = y; }
    }
    return best ?? 0;
  };
  const onTop = (x, z, lift = 0) => [x, topY(x, z) - 0.02 + lift, z];
  const stars = [], lines = [];
  const constel = (pts, big) => {
    const P = pts.map(([x, z]) => onTop(x, z));
    P.forEach((p, i) => stars.push(['sph', p, big && i === 0 ? 0.16 : 0.115, 'st', { paint: 1, glow: 2 }]));
    for (let i = 0; i + 1 < P.length; i++) lines.push(['cap', P[i], P[i + 1], 0.055, 0.055, 'cl', { paint: 1, glow: 1 }]);
    return P;
  };
  // Little Dipper: handle tip = Polaris on the forehead
  const ld = constel([[0, 3.95], [0.16, 3.0], [0.32, 2.2], [0.26, 1.45], [-0.32, 1.25], [-0.42, 0.5], [0.18, 0.62], [0.26, 1.45]], true);
  // Big Dipper further back
  constel([[0.55, 0.0], [0.75, -0.65], [0.45, -1.3], [0.62, -1.95], [0.05, -2.15], [-0.1, -1.5], [0.45, -1.3]]);
  // scattered faint stars (deterministic)
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 26; i++) {
    const z = -2.4 + rnd() * 6.2, x = (rnd() * 2 - 1) * 1.05;
    stars.push(['sph', onTop(x, z), 0.07, rnd() < 0.5 ? 'st' : 'st2', { paint: 1, glow: 2 }]);
  }
  const pol = onTop(0, 3.95, 0.06);
  const polaris = [
    ['ell', pol, [0.5, 0.07, 0.09], 'st', { glow: 3, rot: [0, 0, 0] }],
    ['ell', pol, [0.09, 0.07, 0.5], 'st', { glow: 3 }],
    ['ell', pol, [0.26, 0.07, 0.06], 'st', { glow: 3, rot: [0, 45, 0] }],
    ['ell', pol, [0.26, 0.07, 0.06], 'st', { glow: 3, rot: [0, -45, 0] }],
  ];
  // pectoral fin (humpback-style, long, swept back) with knobbed leading edge
  const finPts = [[0.0, 0.35], [0.5, 0.3], [1.3, 0.05], [2.1, -0.35], [2.9, -0.85], [3.25, -1.15], [3.0, -1.2], [2.3, -0.95], [1.5, -0.7], [0.8, -0.55], [0.1, -0.45]];
  const FP = [1.25, 1.25, 2.35];
  const fin = xf([
    ['poly', [FP[0], FP[1], FP[2]], finPts, 0.1, 'au1', { plane: 'xz', glow: 1, grad: { axis: 'x', to: 'au2', a: FP[0] + 0.3, b: FP[0] + 3.0 } }],
    ...[0.6, 1.2, 1.8, 2.4].map((u, i) => ['sph', [FP[0] + u, FP[1], FP[2] + 0.32 - u * 0.42], 0.13 - i * 0.015, 'au1', { glow: 1 }]),
    ['poly', [FP[0], FP[1] + 0.0, FP[2]], [[0.1, -0.35], [0.8, -0.45], [1.5, -0.6], [2.3, -0.85], [3.0, -1.12], [2.95, -1.22], [2.3, -0.97], [1.5, -0.72], [0.8, -0.57], [0.1, -0.47]], 0.12, 'au3', { plane: 'xz', glow: 1, paint: 1 }],
  ], FP, [8, 18, -24]);
  const fluke = [
    ['poly', [0, 2.25, 0], [[0, -3.85], [0.6, -3.95], [1.35, -4.25], [2.05, -4.75], [2.15, -5.05], [1.75, -5.0], [1.3, -4.88], [0.8, -4.85], [0.3, -4.75], [0, -4.6], [-0.3, -4.75], [-0.8, -4.85], [-1.3, -4.88], [-1.75, -5.0], [-2.15, -5.05], [-2.05, -4.75], [-1.35, -4.25], [-0.6, -3.95]], 0.11, 'au1', { plane: 'xz', glow: 1, grad: { axis: 'z', to: 'au2', a: -4.1, b: -4.95 } }],
    ['poly', [0, 2.25, 0], [[1.3, -4.8], [1.75, -4.92], [2.15, -5.05], [1.75, -5.0], [1.3, -4.88], [0.8, -4.85], [0.3, -4.75], [0, -4.6], [-0.3, -4.75], [-0.8, -4.85], [-1.3, -4.88], [-1.75, -5.0], [-2.15, -5.05], [-1.75, -4.92], [-1.3, -4.8], [-0.8, -4.76], [-0.3, -4.66], [0, -4.5], [0.3, -4.66], [0.8, -4.76]], 0.14, 'au3', { plane: 'xz', glow: 1, paint: 1 }],
  ];
  DESIGNS.polaris = {
    id: 'polaris', vs: 0.1, arch: 'flyer',
    pal: {
      nv: '#1c2766', nv2: '#2b2a7a', bel: '#a8f2e4', beld: '#6fcfc4', mid: '#3d5aa8', mo: '#121638',
      st: '#fff4c4', st2: '#bfe4ff', cl: '#7fc8ff', au1: '#3ff0c8', au2: '#8a62ff', au3: '#ff7ad6',
    },
    anim: { quirk: ['sway', 'roar', 'nod'], hover: 1.6, flap: 0.3, bounce: 0.4, tail: 0.12, maxSpeed: 4.5 },
    parts: [
      { n: 'body', p: [0, 1.8, 0.6], s: [
        ['ell', BODY.c, BODY.r, 'nv', { grad: { axis: 'y', to: 'bel', a: 1.75, b: 0.75 } }],
        ['ell', HEAD.c, HEAD.r, 'nv', { grad: { axis: 'y', to: 'bel', a: 1.62, b: 0.62 } }],
        // full lower jaw / throat pouch
        ['ell', [0, 1.12, 2.75], [1.3, 0.8, 2.15], 'bel', { grad: { axis: 'y', to: 'beld', a: 1.4, b: 0.5 } }],
        // gentle eye patch
        ['cyl', [1.0, 1.62, 2.35], [1.4, 1.62, 2.35], 0.44, 'bel', { m: 1 }],
        ['cyl', [1.3, 1.62, 2.35], [1.4, 1.62, 2.35], 0.5, 'beld', { m: 1, paint: 1 }],
        // ventral grooves on throat / chest
        ['ell', [0, 0.7, 2.55], [1.2, 0.68, 2.6], 'bel', { paint: 1, stripes: { axis: 'x', p: 0.2, w: 0.1, col: 'beld', o: 0.05 } }],
        // mouth line, rising toward the eye
        ['box', [0, 1.3, 3.65], [1.6, 0.05, 1.55], 'mo', { paint: 1, rot: [5, 0, 0] }],
        // small dorsal hump
        ['poly', [0, 0, 0], [[-0.9, 2.95], [-1.5, 3.38], [-2.05, 3.48], [-1.95, 2.9]], 0.12, 'nv2', { plane: 'zy' }],
        ...lines, ...stars, ...polaris,
      ] },
      { n: 'finL', parent: 'body', p: FP, mirror: true, sway: { axis: 'z', amp: 0.22, freq: 0.45, move: 0.6 }, s: fin },
      { n: 'tail', parent: 'body', p: [0, 1.95, -2.2], s: [
        ['cap', [0, 1.95, -2.0], [0, 2.1, -3.1], 1.05, 0.68, 'nv', { grad: { axis: 'y', to: 'bel', a: 2.0, b: 1.1 } }],
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 2.1, -3.1], sway: { axis: 'x', amp: 0.08, freq: 0.5, phase: 0 }, s: [
        ['cap', [0, 2.1, -3.1], [0, 2.22, -4.05], 0.68, 0.36, 'nv', { grad: { axis: 'y', to: 'bel', a: 2.2, b: 1.6 } }],
      ] },
      { n: 'tail3', parent: 'tail2', p: [0, 2.22, -4.0], sway: { axis: 'x', amp: 0.16, freq: 0.5, phase: -0.9 }, s: [
        ['cap', [0, 2.22, -3.95], [0, 2.25, -4.5], 0.36, 0.2, 'nv'],
        ...fluke,
      ] },
    ],
    eyes: { part: 'body', at: [1.45, 1.62, 2.35], dir: [1, 0, 0], style: 'big', iris: '#2c46b8', px: 1.15 },
    mouth: { style: 'none' },
    fx: [
      { part: 'body', at: pol, type: 'star', rate: 1.2, scale: 2.2 },
      { part: 'body', at: onTop(0.3, 0.8), type: 'star', rate: 0.8, scale: 1.8 },
      { part: 'body', at: onTop(0.4, -1.4), type: 'star', rate: 0.8, scale: 1.8 },
      { part: 'tail3', at: [1.9, 2.25, -4.95], type: 'star', rate: 0.6, scale: 1.5, mirror: true },
    ],
  };
}
LORE.polaris = {
  name: 'Polaris', element: 'aero', element2: 'astro', stage: 1, legendary: true, height: '10 m (length)',
  desc: 'The great sky whale that swims the jet stream above Osaka Bay. Sailors once steered by the star on its brow; it is said to sing the aurora into being.',
  personality: 'Ancient, gentle and patient; it guides the lost home.',
  look: 'Colossal indigo whale whose back carries the Little and Big Dipper in glowing stars, a pale aurora-teal grooved belly, and long luminous aurora fins and flukes.',
};

// ---------------------------------------------------------------- 11. Solaris (legendary sun lion)
{
  const H = [0, 2.95, 1.45];
  const spikes = [];
  // corona layer: each spike = glowing red-orange base + brighter yellow tip
  const layer = (n, a0, z, r0, len, rad, cb, ct, alt = 0.25, gap = 0) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      if (gap && Math.abs(ca) < gap && sa > 0) continue;
      const down = sa < -0.5 ? 0.4 : sa < -0.1 ? 0.7 : 1;
      const L = (len + (i % 2) * alt) * down;
      const p0 = [H[0] + ca * r0, H[1] + sa * r0 * 0.78, H[2] + z];
      const p1 = [H[0] + ca * (r0 + L), H[1] + sa * (r0 + L) * 0.72, H[2] + z - L * 0.3];
      const pm = [p0[0] + (p1[0] - p0[0]) * 0.55, p0[1] + (p1[1] - p0[1]) * 0.55, p0[2] + (p1[2] - p0[2]) * 0.55];
      spikes.push(['cap', p0, pm, rad, rad * 0.62, cb, { glow: 1 }]);
      spikes.push(['cap', pm, p1, rad * 0.62, 0.05, ct, { glow: 2 }]);
    }
  };
  layer(16, Math.PI / 16, -0.5, 1.12, 1.0, 0.22, 'c3', 'c2', 0.3, 0.28);
  layer(16, 0, -0.12, 1.12, 0.55, 0.17, 'c2', 'c1', 0.2, 0.36);
  const CR = [0, 4.05, 1.72];
  const rays = [];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, R = i % 2 ? 0.44 : 0.52; rays.push(['cap', [Math.cos(a) * 0.3, CR[1] + Math.sin(a) * 0.3, CR[2]], [Math.cos(a) * R, CR[1] + Math.sin(a) * R, CR[2]], 0.075, 0.03, 'c1', { glow: 2 }]); }
  const paw = (x, z) => [
    ['ell', [x, 0.2, z + 0.12], [0.44, 0.25, 0.46], 'fur', { grad: { axis: 'y', to: 'amb', a: 0.5, b: 0.1 } }],
    ...[-0.25, -0.085, 0.085, 0.25].map((dx) => ['cap', [x + dx, 0.18, z + 0.48], [x + dx * 1.1, 0.06, z + 0.7], 0.085, 0.04, 'au']),
  ];
  const greave = (x, y0, y1, z) => [
    ['cap', [x, y0, z], [x, y1, z], 0.37, 0.35, 'au', { top: 'aul', topT: 0.7 }],
    ['cyl', [x, y0 - 0.02, z], [x, y0 + 0.08, z], 0.4, 'aud'],
    ['sph', [x, (y0 + y1) / 2, z + 0.34], 0.09, 'c1', { glow: 2 }],
  ];
  DESIGNS.solaris = {
    id: 'solaris', vs: 0.1, arch: 'quad',
    pal: {
      fur: '#fff1d8', furd: '#efd2a2', amb: '#f0a24a', bel: '#ffe6bd', au: '#f7b324', aul: '#fff09a', aud: '#a8600a', mane: '#f28a22', maned: '#c94f12', nose: '#6a2f16', clw: '#fff1c2',
      c0: '#fff6c8', c1: '#ffd84a', c2: '#ff9a1c', c3: '#ff4a12', disk: '#fff4b8', mz: '#fffaf0', mk: '#ff8a1a',
    },
    anim: { quirk: ['roar', 'stretch', 'shakeoff', 'nod'], gait: 0.65, stride: 0.8, bounce: 0.6, tail: 0.6, maxSpeed: 3.5 },
    parts: [
      { n: 'body', p: [0, 2.2, -0.4], s: [
        ['ell', [0, 2.2, 0.7], [1.0, 0.95, 0.95], 'fur', { belly: 'furd', bellyT: 0.35 }],
        ['ell', [0, 2.15, -0.6], [0.9, 0.78, 1.5], 'fur', { belly: 'furd', bellyT: 0.35 }],
        ['ell', [0, 2.2, -1.7], [0.9, 0.82, 0.75], 'fur', { belly: 'furd', bellyT: 0.35 }],
        // golden armour: segmented back plates, chest plate with sun gem, pauldrons
        ...[0.2, -0.45, -1.1, -1.75].map((z, i) => ['ell', [0, 2.82 - (i === 3 ? 0.0 : 0.02), z], [0.66, 0.24, 0.36], 'au', { top: 'aul', topT: 0.82 }]),
        ['ell', [0, 2.05, 1.45], [0.62, 0.62, 0.32], 'au', { rot: [-18, 0, 0], top: 'aul', topT: 0.85 }],
        ['tor', [0, 2.12, 1.72], 0.2, 0.06, 'aud', { axis: 'z', rot: [-18, 0, 0] }],
        ['sph', [0, 2.12, 1.74], 0.17, 'c0', { glow: 2 }],
        ['ell', [0.9, 2.55, 0.7], [0.34, 0.48, 0.66], 'au', { m: 1, rot: [0, 0, -25], top: 'aul', topT: 0.85 }],
        ['ell', [0.97, 2.5, 0.7], [0.22, 0.3, 0.5], 'aud', { m: 1, rot: [0, 0, -25], paint: 1, side: 'au', sideT: 0.95 }],
      ] },
      { n: 'head', parent: 'body', p: [0, 2.75, 1.4], s: [
        // tufted mane ruff framing the face
        ['ell', [0, 2.95, 1.55], [1.32, 1.05, 0.66], 'mane', { noise: 0.07, noiseScale: 0.22, grad: { axis: 'z', to: 'maned', a: 1.9, b: 0.95 } }],
        ['ell', [0, 2.4, 1.85], [0.95, 0.72, 0.55], 'mane', { noise: 0.06, noiseScale: 0.2 }],
        ...spikes,
        ['ell', [0, 3.0, 1.98], [0.7, 0.7, 0.7], 'fur'],
        ['ell', [0, 2.75, 2.55], [0.4, 0.34, 0.38], 'mz'],
        ['sph', [0.16, 2.66, 2.78], 0.17, 'mz', { m: 1 }],
        ['poly', [0, 2.92, 2.9], [[-0.21, 0.07], [0.21, 0.07], [0.05, -0.1], [-0.05, -0.1]], 0.07, 'nose'],
        ['box', [0, 2.76, 2.95], [0.02, 0.06, 0.05], 'nose', { paint: 1 }],
        ['ell', [0, 2.45, 2.42], [0.3, 0.15, 0.3], 'mz'],
        // amber brow ridges
        ['cap', [0.1, 3.36, 2.55], [0.48, 3.4, 2.32], 0.07, 0.05, 'amb', { m: 1 }],
        // sun markings under the eyes
        ['cap', [0.25, 2.98, 2.58], [0.45, 2.75, 2.45], 0.055, 0.03, 'mk', { m: 1, paint: 1 }],
        // golden forehead plate + gem
        ['poly', [0, 0, 2.55], [[-0.36, 3.36], [0.36, 3.36], [0.18, 3.62], [0, 3.72], [-0.18, 3.62]], 0.11, 'au', { rot: [-30, 0, 0] }],
        ['sph', [0, 3.5, 2.47], 0.1, 'c0', { glow: 2 }],
        // ears poking from the mane
        ['ell', [0.55, 3.55, 1.85], [0.19, 0.22, 0.13], 'fur', { m: 1 }],
        ['ell', [0.55, 3.55, 1.96], [0.1, 0.13, 0.04], 'amb', { m: 1, paint: 1 }],
      ] },
      { n: 'crest', parent: 'head', p: CR, spin: { axis: 'z', speed: 0.35 }, s: [
        ['cyl', [0, CR[1], CR[2] - 0.05], [0, CR[1], CR[2] + 0.05], 0.3, 'disk', { glow: 3 }],
        ['tor', CR, 0.3, 0.06, 'c3', { axis: 'z', glow: 1 }],
        ...rays,
      ] },
      { n: 'legFL', parent: 'body', p: [0.6, 2.0, 0.8], mirror: true, s: [
        ['cap', [0.6, 2.0, 0.8], [0.63, 0.45, 0.92], 0.46, 0.36, 'fur', { grad: { axis: 'y', to: 'amb', a: 0.9, b: 0.2 } }],
        ...greave(0.63, 0.75, 1.35, 0.9),
        ...paw(0.63, 0.92),
      ] },
      { n: 'legBL', parent: 'body', p: [0.58, 2.0, -1.7], mirror: true, s: [
        ['ell', [0.6, 1.9, -1.7], [0.45, 0.65, 0.6], 'fur'],
        ['cap', [0.62, 1.4, -1.86], [0.63, 0.45, -1.72], 0.36, 0.33, 'fur', { grad: { axis: 'y', to: 'amb', a: 0.9, b: 0.2 } }],
        ...greave(0.63, 0.7, 1.2, -1.75),
        ...paw(0.63, -1.78),
      ] },
      { n: 'tail', parent: 'body', p: [0, 2.45, -2.3], s: [
        ['cap', [0, 2.45, -2.3], [0, 2.7, -3.1], 0.17, 0.14, 'fur'],
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 2.7, -3.1], s: [
        ['cap', [0, 2.7, -3.1], [0, 3.25, -3.6], 0.14, 0.12, 'fur', { grad: { axis: 'y', to: 'amb', a: 2.8, b: 3.3 } }],
        ['tor', [0, 2.85, -3.25], 0.15, 0.06, 'au', { rot: [50, 0, 0] }],
      ] },
      { n: 'tail3', parent: 'tail2', p: [0, 3.25, -3.6], s: [
        ['sph', [0, 3.3, -3.62], 0.26, 'c3', { glow: 1 }],
        ['cap', [0, 3.35, -3.62], [0, 3.85, -3.7], 0.24, 0.05, 'c1', { glow: 2 }],
      ] },
    ],
    eyes: { part: 'head', at: [0.3, 3.16, 2.6], dir: [0.3, 0.04, 1], style: 'sharp', iris: '#ffb21a', px: 1.15, cmap: { i: { c: '#ffd84a', glow: 2 } } },
    mouth: { part: 'head', at: [0, 2.58, 2.92], dir: [0, -0.3, 1], style: 'fang', px: 0.85 },
    fx: [
      { part: 'tail3', at: [0, 3.8, -3.7], type: 'flame', rate: 1.2, scale: 3 },
      { part: 'head', at: [0, 3.9, 0.6], type: 'ember', rate: 2.5, scale: 3 },
      { part: 'head', at: [1.6, 3.3, 0.9], type: 'flame', rate: 0.5, scale: 2.0, mirror: true },
      { part: 'crest', at: [0, 4.05, 1.85], type: 'star', rate: 1.0, scale: 2.5 },
    ],
  };
}
LORE.solaris = {
  name: 'Solaris', element: 'pyro', element2: 'astro', stage: 1, legendary: true, height: '4.5 m',
  desc: 'The sun-king that rose from the first dawn over Kansai. Where it walks, frost melts and crops ripen; when it roars, noon comes early.',
  personality: 'Regal, proud and fiercely protective of all things that grow.',
  look: 'Colossal golden lion clad in sun-gold armour plates, with a blazing corona mane of layered orange-to-yellow spikes, a spinning sun-disk crest and a flame-tipped tail.',
};

// ---------------------------------------------------------------- 12. Atomic (final boss)
{
  const CH = { c: [0, 2.55, 1.45], r: [1.3, 1.15, 1.25] };
  const TO = { c: [0, 2.42, -0.3], r: [1.42, 1.05, 2.05] };
  const HI = { c: [0, 2.45, -2.1], r: [1.25, 1.0, 1.0] };
  const topAt = (x, z) => { let b = 0; for (const e of [CH, TO, HI]) { const q = 1 - (x / e.r[0]) ** 2 - ((z - e.c[2]) / e.r[2]) ** 2; if (q > 0) b = Math.max(b, e.c[1] + e.r[1] * Math.sqrt(q)); } return b; };
  const sideAt = (y, z) => { let b = 0; for (const e of [CH, TO, HI]) { const q = 1 - ((y - e.c[1]) / e.r[1]) ** 2 - ((z - e.c[2]) / e.r[2]) ** 2; if (q > 0) b = Math.max(b, e.r[0] * Math.sqrt(q)); } return b; };
  // chunky nuclear crystal: hex-ish prism body (glow 1) + bright pyramid tip (glow 2)
  const crystal = (base, h, r, lean) => {
    const at = (k) => [base[0] + lean[0] * h * k, base[1] + h * k, base[2] + lean[1] * h * k];
    return [
      ['cap', base, at(0.6), r, r * 0.92, 'cr', { top: 'crl', topT: 0.6, side: 'crd', sideT: 0.75 }],
      ['cap', at(0.6), at(1), r * 0.92, 0.03, 'crg', { glow: 1 }],
      ['cap', at(0.55), at(0.8), r * 0.42, r * 0.2, 'crc', { glow: 2 }],
    ];
  };
  const cluster = (x, z, h, r) => [
    ...crystal([x, topAt(x, z) - 0.25, z], h, r, [x * 0.12, -0.18]),
    ...crystal([x + 0.38, topAt(x + 0.38, z - 0.3) - 0.25, z - 0.3], h * 0.6, r * 0.65, [0.42, -0.2]),
    ...crystal([x - 0.36, topAt(x - 0.36, z + 0.25) - 0.25, z + 0.25], h * 0.5, r * 0.6, [-0.45, 0.05]),
  ];
  const spine = [
    ...cluster(0.05, 1.75, 2.0, 0.4),
    ...cluster(-0.1, 0.45, 1.6, 0.34),
    ...cluster(0.1, -0.85, 1.35, 0.3),
    ...cluster(-0.05, -2.05, 1.1, 0.27),
  ];
  // rift cracks on the flanks
  const crack = [[3.05, 1.2], [2.7, 0.75], [2.95, 0.25], [2.45, -0.2], [2.7, -0.75], [2.25, -1.3], [2.55, -1.85]];
  const cracks = [];
  for (let i = 0; i + 1 < crack.length; i++) {
    const [y0, z0] = crack[i], [y1, z1] = crack[i + 1];
    cracks.push(['cap', [sideAt(y0, z0) - 0.03, y0, z0], [sideAt(y1, z1) - 0.03, y1, z1], 0.085, 0.085, 'rift', { paint: 1, glow: 2, m: 1 }]);
  }
  // snout width helper for teeth
  const sw = (z) => 0.5 * Math.sqrt(Math.max(0, 1 - ((z - 5.05) / 1.38) ** 2));
  const upperTeeth = [], lowerTeeth = [];
  for (let z = 4.35; z < 6.2; z += 0.27) {
    const w = sw(z) * 0.92;
    upperTeeth.push(['cap', [w, 2.82, z], [w * 1.02, 2.52, z + 0.03], 0.075, 0.018, 'th', { m: 1 }]);
    const z2 = z + 0.13, w2 = sw(z2) * 0.85;
    if (z2 < 6.15) lowerTeeth.push(['cap', [w2, 2.78, z2], [w2 * 1.03, 3.06, z2 + 0.02], 0.07, 0.018, 'th', { m: 1 }]);
  }
  // tattered wing: built flat (u = outward, v = forward) then raised into a V
  const W0 = [0.85, 3.3, 1.1], WR = [-26, 0, 36];
  const P = (u, v) => [W0[0] + u, W0[1], W0[2] + v];
  const pts = [[0, 0.35], [0.9, 0.75], [1.8, 0.95], [3.0, 0.8], [4.3, 0.45], [3.75, -0.2], [4.0, -0.55], [4.5, -1.05], [3.65, -1.2], [3.8, -1.7], [3.6, -2.25], [2.95, -1.95], [2.8, -2.4], [2.2, -2.65], [1.55, -1.85], [0.9, -1.95], [0.3, -1.3], [0, -0.6]];
  const fingers = [[4.3, 0.45], [4.5, -1.05], [3.6, -2.25], [2.2, -2.65]];
  const wing = xf([
    ['poly', [W0[0], W0[1], W0[2]], pts, 0.08, 'mem', { plane: 'xz', grad: { axis: 'x', to: 'mem2', a: W0[0] + 1.5, b: W0[0] + 4.4 } }],
    ['sph', P(2.95, -0.6), 0.22, 'mem', { sub: 1 }],
    ['sph', P(2.35, -1.5), 0.17, 'mem', { sub: 1 }],
    ['sph', P(3.4, -1.45), 0.14, 'mem', { sub: 1 }],
    ['cap', P(1.2, -0.2), P(2.4, -0.9), 0.075, 0.075, 'rift', { paint: 1, glow: 1 }],
    ['cap', P(2.4, -0.9), P(2.0, -1.9), 0.075, 0.075, 'rift', { paint: 1, glow: 1 }],
    ['cap', P(0, 0.2), P(1.8, 0.95), 0.2, 0.14, 'bnl'],
    ['cap', P(1.8, 0.95), P(2.0, 1.4), 0.12, 0.03, 'th'],
    ...fingers.map(([u, v]) => ['cap', P(1.8, 0.95), P(u, v), 0.11, 0.04, 'bnl', { tip: 'th', tipT: 0.88 }]),
  ], W0, WR);
  const claws = (x, z) => [-0.26, -0.09, 0.09, 0.26].map((dx) => ['cap', [x + dx, 0.2, z + 0.42], [x + dx * 1.15, 0.05, z + 0.72], 0.085, 0.03, 'th']);
  DESIGNS.atomic = {
    id: 'atomic', vs: 0.13, arch: 'quad',
    pal: {
      sc: '#262a31', sc2: '#1a1d23', pl: '#3a404c', pll: '#565e6e', bel: '#4a4a3c', beld: '#34342a', th: '#e6dfc6', bn: '#1c1a20',
      mem: '#3a2238', mem2: '#1e1420', bnl: '#6b6372', cr: '#46d92a', crl: '#a8ff7a', crd: '#1f8a2a', crc: '#c8ff6a', crg: '#5cff3a', rift: '#58ff7a', gum: '#5a1424', hn: '#2e2a30', hnt: '#c9c2a8',
    },
    anim: { quirk: ['roar', 'sniff', 'shakeoff', 'stretch'], gait: 0.55, stride: 0.75, bounce: 0.5, tail: 0.7, maxSpeed: 4 },
    parts: [
      { n: 'body', p: [0, 2.4, 0], s: [
        ['ell', CH.c, CH.r, 'sc', { belly: 'bel', bellyT: 0.35, dither: { col: 'sc2', amt: 0.25 } }],
        ['ell', TO.c, TO.r, 'sc', { belly: 'bel', bellyT: 0.35, dither: { col: 'sc2', amt: 0.25 } }],
        ['ell', HI.c, HI.r, 'sc', { belly: 'bel', bellyT: 0.35, dither: { col: 'sc2', amt: 0.25 } }],
        ['ell', [0, 1.6, -0.2], [1.1, 0.5, 2.6], 'bel', { paint: 1, stripes: { axis: 'z', p: 0.39, w: 0.13, col: 'beld' } }],
        // armoured dorsal plates (osteoderms)
        ...[1.6, 0.9, 0.2, -0.5, -1.2, -1.9].flatMap((z) => [0.85, -0.85].map((x) => ['ell', [x, topAt(x, z) - 0.12, z], [0.32, 0.16, 0.3], 'pl', { top: 'pll', topT: 0.8 }])),
        ...cracks,
        ...spine,
      ] },
      { n: 'neck', parent: 'body', p: [0, 2.9, 2.4], s: [
        ['cap', [0, 2.85, 2.3], [0, 3.1, 3.45], 0.88, 0.72, 'sc', { belly: 'bel', bellyT: 0.4, dither: { col: 'sc2', amt: 0.25 } }],
        ...crystal([0.2, 3.6, 2.75], 1.0, 0.26, [0.15, -0.3]),
        ...crystal([-0.22, 3.68, 3.15], 0.8, 0.22, [-0.15, -0.3]),
      ] },
      { n: 'head', parent: 'neck', p: [0, 3.15, 3.45], s: [
        ['ell', [0, 3.3, 3.78], [0.8, 0.56, 0.72], 'sc', { dither: { col: 'sc2', amt: 0.2 } }],
        ['box', [0, 3.42, 4.2], [0.62, 0.2, 0.13], 'sc2'],
        ['ell', [0, 3.0, 5.05], [0.52, 0.3, 1.38], 'sc', { dither: { col: 'sc2', amt: 0.2 }, belly: 'gum', bellyT: 0.6 }],
        ['sph', [0.16, 3.22, 6.05], 0.11, 'sc2', { m: 1 }],
        ...[4.7, 5.2, 5.6].map((z) => ['ell', [0, 3.2 + 0.0, z], [0.16, 0.1, 0.18], 'pl', { top: 'pll' }]),
        // menacing brow ridges
        ['cap', [0.12, 3.62, 4.28], [0.78, 3.86, 3.85], 0.13, 0.08, 'pl', { m: 1, top: 'pll', topT: 0.7 }],
        // swept-back horns
        ['cap', [0.5, 3.62, 3.45], [0.95, 4.2, 2.75], 0.2, 0.13, 'hn', { m: 1 }],
        ['cap', [0.95, 4.2, 2.75], [1.1, 4.45, 2.05], 0.13, 0.03, 'hn', { m: 1, tip: 'hnt', tipT: 0.5 }],
        // crystal crown
        ...crystal([0, 3.72, 3.45], 1.0, 0.24, [0, -0.4]),
        ...crystal([0.32, 3.68, 3.3], 0.62, 0.17, [0.3, -0.35]),
        ...crystal([-0.32, 3.68, 3.3], 0.62, 0.17, [-0.3, -0.35]),
        // rift crack along the snout
        ['cap', [0.42, 3.12, 4.5], [0.38, 3.05, 5.1], 0.075, 0.075, 'rift', { m: 1, paint: 1, glow: 2 }],
        ['cap', [0.38, 3.05, 5.1], [0.3, 3.12, 5.6], 0.075, 0.075, 'rift', { m: 1, paint: 1, glow: 2 }],
        ...upperTeeth,
      ] },
      { n: 'jaw', parent: 'head', p: [0, 2.85, 3.8], s: [
        ['ell', [0, 2.72, 3.98], [0.66, 0.32, 0.55], 'sc', { belly: 'bel', bellyT: 0.3 }],
        ['ell', [0, 2.66, 4.95], [0.5, 0.2, 1.3], 'sc', { belly: 'bel', bellyT: 0.3 }],
        ['box', [0, 2.8, 4.9], [0.6, 0.07, 1.5], 'gum', { paint: 1 }],
        ...lowerTeeth,
      ] },
      { n: 'wingL', parent: 'body', p: W0, mirror: true, s: wing },
      { n: 'legFL', parent: 'body', p: [1.0, 2.25, 1.5], mirror: true, s: [
        ['cap', [1.0, 2.25, 1.5], [1.38, 1.15, 1.75], 0.55, 0.42, 'sc', { dither: { col: 'sc2', amt: 0.25 } }],
        ['ell', [1.2, 2.45, 1.55], [0.55, 0.45, 0.6], 'pl', { top: 'pll', topT: 0.7 }],
        ['cap', [1.38, 1.15, 1.75], [1.42, 0.32, 1.85], 0.42, 0.36, 'sc'],
        ['ell', [1.44, 0.2, 2.08], [0.46, 0.22, 0.56], 'sc'],
        ...claws(1.44, 2.08),
      ] },
      { n: 'legBL', parent: 'body', p: [1.05, 2.2, -2.0], mirror: true, s: [
        ['ell', [1.15, 1.9, -2.05], [0.58, 0.75, 0.7], 'sc', { dither: { col: 'sc2', amt: 0.25 } }],
        ['cap', [1.25, 1.35, -2.25], [1.38, 0.32, -2.0], 0.44, 0.36, 'sc'],
        ['ell', [1.4, 0.2, -1.75], [0.46, 0.22, 0.56], 'sc'],
        ...claws(1.4, -1.75),
      ] },
      { n: 'tail', parent: 'body', p: [0, 2.45, -2.9], s: [
        ['cap', [0, 2.45, -2.9], [0, 2.32, -4.4], 0.88, 0.66, 'sc', { belly: 'bel', bellyT: 0.4, dither: { col: 'sc2', amt: 0.25 } }],
        ...crystal([0.12, 2.95, -3.35], 1.0, 0.26, [0.15, -0.3]),
        ...crystal([-0.18, 2.85, -4.0], 0.75, 0.22, [-0.2, -0.3]),
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 2.32, -4.4], s: [
        ['cap', [0, 2.32, -4.4], [0, 2.05, -5.7], 0.66, 0.45, 'sc', { belly: 'bel', bellyT: 0.4, dither: { col: 'sc2', amt: 0.25 } }],
        ...crystal([0.1, 2.72, -4.85], 0.75, 0.2, [0.15, -0.35]),
        ...crystal([-0.12, 2.52, -5.4], 0.6, 0.17, [-0.15, -0.35]),
      ] },
      { n: 'tail3', parent: 'tail2', p: [0, 2.05, -5.7], s: [
        ['cap', [0, 2.05, -5.7], [0, 1.75, -6.85], 0.45, 0.24, 'sc', { belly: 'bel', bellyT: 0.4 }],
        ...crystal([0.06, 2.3, -6.1], 0.5, 0.15, [0.12, -0.4]),
        ...crystal([-0.06, 2.1, -6.55], 0.42, 0.13, [-0.12, -0.4]),
      ] },
      { n: 'tail4', parent: 'tail3', p: [0, 1.75, -6.85], s: [
        ['cap', [0, 1.75, -6.85], [0, 1.6, -7.5], 0.24, 0.12, 'sc'],
        // crystal tail blade
        ['cap', [0, 1.62, -7.3], [0, 1.95, -8.35], 0.28, 0.04, 'cr', { top: 'crl', topT: 0.6, side: 'crd', sideT: 0.75 }],
        ['cap', [0, 1.7, -7.6], [0, 1.85, -8.1], 0.12, 0.04, 'crg', { glow: 1 }],
        ['cap', [0, 1.62, -7.3], [0.45, 1.55, -8.0], 0.18, 0.03, 'crg', { glow: 1 }],
        ['cap', [0, 1.62, -7.3], [-0.45, 1.55, -8.0], 0.18, 0.03, 'crg', { glow: 1 }],
      ] },
    ],
    eyes: { part: 'head', at: [0.33, 3.43, 4.36], dir: [0, 0, 1], style: 'sharp', iris: '#d8ff3a', px: 1.0, cmap: { i: { c: '#d8ff3a', glow: 2 }, w: { c: '#ffffff', glow: 2 } } },
    mouth: { part: 'head', at: [0, 2.82, 6.45], dir: [0, -0.1, 1], style: 'zig', px: 0.7 },
    fx: [
      { part: 'body', at: [0.3, 5.4, 1.4], type: 'rift', rate: 1.2, scale: 3 },
      { part: 'body', at: [-0.2, 4.8, 0.1], type: 'rift', rate: 1.0, scale: 3 },
      { part: 'head', at: [0, 4.6, 3.1], type: 'rift', rate: 1.0, scale: 2.5 },
      { part: 'tail4', at: [0, 1.95, -8.3], type: 'rift', rate: 1.0, scale: 2.5 },
      { part: 'head', at: [0, 2.7, 6.2], type: 'smoke', rate: 0.8, scale: 3, color: '#3a5a3a' },
    ],
  };
}
LORE.atomic = {
  name: 'Atomic', element: 'nucleo', stage: 1, legendary: true, boss: true, height: '6 m',
  desc: 'Born in the reactor rift beneath the old bay, Atomic has watched humanity poison the world for a century. It intends to burn everything down to bedrock and let the world begin again.',
  personality: 'Cold, patient and utterly certain it is right.',
  look: 'Colossal dragon-crocodile in dark armoured scales, jagged double-toothed jaws, tattered rift-torn wings, rows of glowing green nuclear crystals down its spine and tail, and green rift cracks bleeding light.',
};

// ---------------------------------------------------------------- 13. Rift Boar (wild beast)
{
  const bristles = [];
  for (let i = 0; i < 13; i++) {
    const z = 1.05 - i * 0.12, y = 1.42 - Math.abs(z - 0.45) * 0.3;
    const h = 0.42 - Math.abs(z - 0.5) * 0.18;
    const rift = i % 4 === 1;
    bristles.push(['cap', [0, y - 0.12, z], [((i % 3) - 1) * 0.06, y + h, z - 0.2], 0.085, 0.015, rift ? 'tk' : 'br', rift ? { glow: 1 } : { tip: 'brt', tipT: 0.72 }]);
    if (i > 1 && i < 11) bristles.push(['cap', [0.13, y - 0.16, z + 0.04], [0.24, y + h * 0.55, z - 0.14], 0.07, 0.012, 'br', { m: 1, tip: 'brt', tipT: 0.7 }]);
  }
  const tusk = (side) => [
    ['cap', [0.15 * side, 0.64, 1.5], [0.3 * side, 0.82, 1.68], 0.075, 0.06, 'cr', { top: 'crl', side: 'crd', sideT: 0.8 }],
    ['cap', [0.3 * side, 0.82, 1.68], [0.27 * side, 1.08, 1.56], 0.06, 0.012, 'tk', { glow: 1 }],
  ];
  DESIGNS.rift_boar = {
    id: 'rift_boar', vs: 0.045, arch: 'quad',
    pal: {
      h: '#4a382c', hd: '#31251c', hl: '#6f5a48', br: '#1f1712', brt: '#8a7f74', sn: '#8f6c62', snd: '#4a3030', hf: '#1a1512',
      tk: '#5cff3a', tkc: '#d8ffa0', rg: '#5cff3a', scar: '#b8968a', crd: '#1f8a2a', crl: '#a8ff7a', cr: '#46d92a',
    },
    parts: [
      { n: 'body', p: [0, 0.95, 0], s: [
        ['ell', [0, 1.0, 0.4], [0.52, 0.55, 0.62], 'h', { dither: { col: 'hd', amt: 0.3 }, belly: 'hd', bellyT: 0.5 }],
        ['ell', [0, 0.86, -0.5], [0.44, 0.44, 0.58], 'h', { dither: { col: 'hd', amt: 0.3 }, belly: 'hd', bellyT: 0.5 }],
        ['ell', [0, 1.15, 0.35], [0.42, 0.3, 0.5], 'hl', { paint: 1, dither: { col: 'h', amt: 0.4 } }],
        ...bristles,
        // scars + rift corruption
        ['cap', [0.49, 1.1, 0.6], [0.46, 0.82, 0.18], 0.03, 0.03, 'scar', { paint: 1 }],
        ['cap', [0.5, 1.0, 0.68], [0.47, 0.78, 0.42], 0.03, 0.03, 'scar', { paint: 1 }],
        ['cap', [-0.42, 1.0, -0.2], [-0.49, 0.84, 0.15], 0.035, 0.035, 'rg', { paint: 1, glow: 2 }],
        ['cap', [-0.49, 0.84, 0.15], [-0.47, 0.98, 0.48], 0.035, 0.035, 'rg', { paint: 1, glow: 2 }],
        ['cap', [-0.28, 1.12, -0.5], [-0.45, 1.5, -0.66], 0.1, 0.02, 'cr', { top: 'crl', side: 'crd', sideT: 0.8 }],
        ['cap', [-0.12, 1.16, -0.72], [-0.18, 1.4, -0.92], 0.075, 0.015, 'cr', { top: 'crl', side: 'crd', sideT: 0.8 }],
        ['cap', [-0.38, 1.35, -0.6], [-0.43, 1.47, -0.64], 0.04, 0.015, 'tkc', { glow: 2 }],
      ] },
      { n: 'head', parent: 'body', p: [0, 1.0, 0.9], s: [
        ['ell', [0, 0.95, 1.1], [0.34, 0.38, 0.42], 'h', { dither: { col: 'hd', amt: 0.3 } }],
        ['cap', [0, 0.86, 1.3], [0, 0.74, 1.74], 0.23, 0.18, 'h', { dither: { col: 'hd', amt: 0.25 } }],
        ['cyl', [0, 0.73, 1.74], [0, 0.73, 1.84], 0.18, 'sn'],
        ['sph', [0.065, 0.73, 1.84], 0.035, 'snd', { m: 1 }],
        ['ell', [0, 0.62, 1.5], [0.19, 0.1, 0.24], 'hd'],
        // ears
        ['cap', [0.22, 1.22, 0.98], [0.33, 1.42, 0.86], 0.085, 0.02, 'h', { m: 1 }],
        // face scar
        ['cap', [-0.04, 1.2, 1.38], [-0.27, 0.92, 1.36], 0.028, 0.028, 'scar', { paint: 1 }],
        ...tusk(1), ...tusk(-1),
      ] },
      { n: 'legFL', parent: 'body', p: [0.28, 0.8, 0.55], mirror: true, s: [
        ['cap', [0.28, 0.85, 0.55], [0.29, 0.15, 0.6], 0.17, 0.11, 'h', { dither: { col: 'hd', amt: 0.3 } }],
        ['cap', [0.29, 0.14, 0.61], [0.29, 0.03, 0.65], 0.11, 0.095, 'hf'],
      ] },
      { n: 'legBL', parent: 'body', p: [0.26, 0.75, -0.6], mirror: true, s: [
        ['ell', [0.28, 0.72, -0.6], [0.18, 0.27, 0.24], 'h', { dither: { col: 'hd', amt: 0.3 } }],
        ['cap', [0.29, 0.5, -0.66], [0.29, 0.12, -0.58], 0.12, 0.1, 'h'],
        ['cap', [0.29, 0.12, -0.58], [0.29, 0.03, -0.53], 0.1, 0.09, 'hf'],
      ] },
      { n: 'tail', parent: 'body', p: [0, 1.0, -1.05], s: [
        ['cap', [0, 1.0, -1.05], [0, 0.75, -1.15], 0.04, 0.03, 'h'],
        ['sph', [0, 0.72, -1.16], 0.06, 'br'],
      ] },
    ],
    eyes: { part: 'head', at: [0.17, 1.1, 1.42], dir: [0.42, 0.18, 1], style: 'fierce', iris: '#ff2a2a', px: 1.0, cmap: { i: { c: '#ff3020', glow: 2 } } },
    mouth: { part: 'head', at: [0, 0.6, 1.7], dir: [0, -0.4, 1], style: 'fang', px: 0.6 },
    fx: [
      { part: 'head', at: [0.28, 1.08, 1.58], type: 'rift', rate: 0.5, scale: 0.6, mirror: true },
      { part: 'body', at: [-0.42, 1.5, -0.66], type: 'rift', rate: 0.5, scale: 0.6 },
      { part: 'legFL', at: [0.29, 0.03, 0.66], type: 'dust', rate: 0.4, scale: 0.8, mirror: true },
    ],
    anim: { quirk: ['sniff', 'shakeoff', 'roar', 'scratch'], gait: 1.1, stride: 0.9, bounce: 1.1, maxSpeed: 7 },
  };
}
LORE.rift_boar = {
  name: 'Rift Boar', element: 'nucleo', stage: 0, height: '1.6 m', wild: true,
  desc: 'A mountain inoshishi swollen by rift radiation. It charges anything that moves and cannot be tamed — only driven off.',
  personality: 'Feral, territorial, relentless.',
  look: 'Hulking scarred boar with a bristling dark mane, glowing green rift-crystal tusks, crystal growths on its back and furious red eyes.',
};

// ---------------------------------------------------------------- 14. Oni Bear (wild beast)
{
  const shide = (x, z) => ['poly', [x, 0, z], [[-0.04, 1.32], [0.05, 1.32], [0.05, 1.2], [-0.02, 1.2], [-0.02, 1.1], [0.05, 1.1], [0.05, 0.98], [-0.04, 0.98], [-0.04, 1.08], [0.02, 1.08], [0.02, 1.14], [-0.04, 1.14]], 0.012, 'pp', { rot: [0, Math.atan2(x, z) / D2R, 0] }];
  const crk = [[1.62, 0.55], [1.55, 0.25], [1.62, 0.0], [1.5, -0.3], [1.55, -0.6]];
  const cracks = [];
  for (let i = 0; i + 1 < crk.length; i++) cracks.push(['cap', [((i % 2) - 0.5) * 0.14, crk[i][0], crk[i][1]], [(((i + 1) % 2) - 0.5) * 0.14, crk[i + 1][0], crk[i + 1][1]], 0.06, 0.06, 'rg', { paint: 1, glow: 2 }]);
  const claws = (x, z) => [-0.1, -0.035, 0.035, 0.1].map((dx) => ['cap', [x + dx, 0.07, z + 0.12], [x + dx * 1.1, 0.02, z + 0.28], 0.035, 0.012, 'cl']);
  DESIGNS.oni_bear = {
    id: 'oni_bear', vs: 0.05, arch: 'quad',
    pal: {
      f: '#1d1b20', fd: '#121014', fl: '#34303a', wh: '#f2eee4', mz: '#a9845e', mzd: '#6d5238', hn: '#c42a22', hnd: '#5a0f0c', hnb: '#e6c76a',
      cl: '#efe9da', rg: '#5cff3a', rope: '#d8b56a', roped: '#9a7a3a', pp: '#fbfaf4', crd: '#1f8a2a', crl: '#a8ff7a', cr: '#46d92a', crc: '#c8ff6a',
    },
    anim: { quirk: ['roar', 'sniff', 'shakeoff', 'stretch'], gait: 0.85, stride: 0.9, bounce: 0.9, maxSpeed: 6 },
    parts: [
      { n: 'body', p: [0, 1.0, 0], s: [
        ['ell', [0, 1.05, 0.35], [0.62, 0.62, 0.7], 'f', { dither: { col: 'fl', amt: 0.25 } }],
        ['ell', [0, 0.98, -0.5], [0.56, 0.56, 0.65], 'f', { dither: { col: 'fl', amt: 0.25 } }],
        // moon crescent on the chest
        ['poly', [0, 0, 0.9], [[-0.54, 1.02], [-0.38, 0.92], [0, 0.74], [0.38, 0.92], [0.54, 1.02], [0.4, 0.78], [0, 0.58], [-0.4, 0.78]], 0.45, 'wh', { paint: 1 }],
        ...cracks,
        // rift crystals on the shoulders
        ['cap', [0.2, 1.5, 0.45], [0.32, 1.92, 0.3], 0.12, 0.02, 'cr', { top: 'crl', side: 'crd', sideT: 0.8 }],
        ['cap', [-0.12, 1.55, 0.2], [-0.2, 1.85, 0.05], 0.09, 0.02, 'cr', { top: 'crl', side: 'crd', sideT: 0.8 }],
        ['cap', [0.25, 1.65, 0.38], [0.3, 1.82, 0.32], 0.05, 0.02, 'crc', { glow: 2 }],
        // frayed shimenawa rope with paper shide
        ['tor', [0, 1.28, 0.78], 0.46, 0.065, 'rope', { rot: [-55, 0, 0], stripes: { axis: 'x', p: 0.15, w: 0.05, col: 'roped' } }],
        shide(0.32, 1.12), shide(-0.36, 1.08),
      ] },
      { n: 'head', parent: 'body', p: [0, 1.35, 0.95], s: [
        ['ell', [0, 1.42, 1.2], [0.44, 0.4, 0.4], 'f', { dither: { col: 'fl', amt: 0.2 } }],
        ['ell', [0, 1.3, 1.52], [0.24, 0.2, 0.22], 'mz'],
        ['ell', [0, 1.4, 1.7], [0.1, 0.07, 0.06], 'fd'],
        ['ell', [0, 1.18, 1.45], [0.2, 0.09, 0.18], 'mzd'],
        // round bear ears
        ['sph', [0.36, 1.75, 1.08], 0.13, 'f', { m: 1 }],
        ['sph', [0.37, 1.75, 1.15], 0.07, 'fl', { m: 1 }],
        // oni horns
        ['cap', [0.17, 1.72, 1.32], [0.27, 1.98, 1.28], 0.09, 0.06, 'hn', { m: 1 }],
        ['cap', [0.27, 1.98, 1.28], [0.24, 2.18, 1.18], 0.06, 0.012, 'hn', { m: 1, tip: 'hnd', tipT: 0.5 }],
        ['tor', [0.19, 1.79, 1.31], 0.08, 0.025, 'hnb', { m: 1, rot: [0, 0, -20] }],
        // lower fangs
        ['cap', [0.12, 1.2, 1.6], [0.13, 1.33, 1.66], 0.035, 0.01, 'cl', { m: 1 }],
        // rift crack across the brow
        ['cap', [0.06, 1.82, 1.2], [-0.12, 1.76, 1.0], 0.05, 0.05, 'rg', { paint: 1, glow: 2 }],
        ['cap', [-0.12, 1.76, 1.0], [-0.02, 1.68, 0.88], 0.05, 0.05, 'rg', { paint: 1, glow: 2 }],
      ] },
      { n: 'legFL', parent: 'body', p: [0.38, 1.0, 0.55], mirror: true, s: [
        ['cap', [0.38, 1.05, 0.55], [0.4, 0.12, 0.62], 0.22, 0.16, 'f', { dither: { col: 'fl', amt: 0.25 } }],
        ['ell', [0.4, 0.08, 0.68], [0.18, 0.08, 0.2], 'fd'],
        ...claws(0.4, 0.68),
      ] },
      { n: 'legBL', parent: 'body', p: [0.36, 0.95, -0.65], mirror: true, s: [
        ['ell', [0.38, 0.85, -0.65], [0.24, 0.35, 0.3], 'f', { dither: { col: 'fl', amt: 0.25 } }],
        ['cap', [0.39, 0.6, -0.7], [0.4, 0.12, -0.6], 0.17, 0.15, 'f'],
        ['ell', [0.4, 0.08, -0.5], [0.18, 0.08, 0.2], 'fd'],
        ...claws(0.4, -0.5),
      ] },
      { n: 'tail', parent: 'body', p: [0, 1.1, -1.1], s: [['sph', [0, 1.08, -1.12], 0.1, 'f']] },
    ],
    eyes: { part: 'head', at: [0.17, 1.52, 1.53], dir: [0.4, 0.1, 1], style: 'fierce', iris: '#ffb020', px: 1.0, cmap: { i: { c: '#ffc23a', glow: 2 } } },
    mouth: { part: 'head', at: [0, 1.17, 1.6], dir: [0, -0.3, 1], style: 'fang', px: 0.6 },
    fx: [
      { part: 'body', at: [0.0, 1.62, 0.0], type: 'rift', rate: 0.8, scale: 1.0 },
      { part: 'body', at: [0.3, 1.9, 0.3], type: 'rift', rate: 0.5, scale: 0.8 },
      { part: 'head', at: [0.25, 2.18, 1.18], type: 'ember', rate: 0.6, scale: 0.6, mirror: true, color: '#ff4a2a' },
    ],
  };
}
LORE.oni_bear = {
  name: 'Oni Bear', element: 'nucleo', stage: 0, height: '2.4 m (reared)', wild: true,
  desc: 'Once the guardian of a mountain shrine, this moon bear was twisted by the rift; its sacred rope now hangs in tatters. It rears to 2.4 m and roars at anything that nears the old torii.',
  personality: 'Enraged, grieving, untameable.',
  look: 'Huge black moon bear with a white crescent chest, red oni horns banded in gold, glowing rift cracks down its spine, shoulder crystals, a frayed shimenawa with paper shide and long ivory claws.',
};

// ---------------------------------------------------------------- 15–18. Farm animals (opening cinematic, not Elemon)
DESIGNS.cow = {
  id: 'cow', vs: 0.05, arch: 'quad',
  pal: { w: '#f4f1ea', k: '#26232a', pk: '#f2a7a8', pkd: '#c97a7c', hn: '#efe4c4', hf: '#3a3230', strap: '#c8302c', bell: '#e8b830', belld: '#8a6414' },
  anim: { quirk: ['sniff', 'shakeoff', 'nod'], gait: 0.8, stride: 0.8, bounce: 0.6, maxSpeed: 2.5 },
  parts: [
    { n: 'body', p: [0, 0.95, 0], s: [
      ['ell', [0, 0.95, -0.05], [0.33, 0.33, 0.62], 'w', { spots: { col: 'k', d: 0.42, s: 0.22, seed: 3 } }],
      ['ell', [0, 0.62, -0.35], [0.15, 0.09, 0.14], 'pk'],
      ...[[0.06, -0.3], [-0.06, -0.3], [0.06, -0.42], [-0.06, -0.42]].map(([x, z]) => ['cap', [x, 0.58, z], [x, 0.5, z], 0.03, 0.025, 'pkd']),
    ] },
    { n: 'head', parent: 'body', p: [0, 1.1, 0.55], s: [
      ['ell', [0, 1.13, 0.74], [0.17, 0.2, 0.27], 'w'],
      ['ell', [0.08, 1.22, 0.7], [0.11, 0.13, 0.16], 'k', { paint: 1 }],
      ['ell', [0, 1.0, 0.94], [0.15, 0.1, 0.085], 'pk'],
      ['sph', [0.06, 1.02, 1.01], 0.022, 'pkd', { m: 1 }],
      ['cap', [0.12, 1.3, 0.68], [0.24, 1.37, 0.66], 0.035, 0.02, 'hn', { m: 1 }],
      ['ell', [0.25, 1.2, 0.64], [0.1, 0.04, 0.06], 'w', { m: 1, rot: [0, 0, -20] }],
      ['ell', [0.27, 1.19, 0.66], [0.06, 0.02, 0.03], 'pk', { m: 1, rot: [0, 0, -20], paint: 1 }],
      // collar + cowbell
      ['tor', [0, 1.0, 0.58], 0.17, 0.03, 'strap', { rot: [-60, 0, 0] }],
      ['cyl', [0, 0.84, 0.68], [0, 0.94, 0.68], 0.06, 'bell'],
      ['cyl', [0, 0.82, 0.68], [0, 0.85, 0.68], 0.075, 'bell'],
      ['sph', [0, 0.81, 0.68], 0.025, 'belld'],
    ] },
    { n: 'legFL', parent: 'body', p: [0.2, 0.75, 0.38], mirror: true, s: [
      ['cap', [0.2, 0.8, 0.38], [0.2, 0.08, 0.4], 0.085, 0.07, 'w'],
      ['cap', [0.2, 0.09, 0.4], [0.2, 0.02, 0.41], 0.075, 0.075, 'hf'],
    ] },
    { n: 'legBL', parent: 'body', p: [0.2, 0.75, -0.48], mirror: true, s: [
      ['cap', [0.2, 0.8, -0.48], [0.2, 0.08, -0.48], 0.09, 0.07, 'w', { spots: { col: 'k', d: 0.4, s: 0.22, seed: 3 } }],
      ['cap', [0.2, 0.09, -0.48], [0.2, 0.02, -0.47], 0.075, 0.075, 'hf'],
    ] },
    { n: 'tail', parent: 'body', p: [0, 1.15, -0.64], s: [
      ['cap', [0, 1.15, -0.64], [0, 0.75, -0.72], 0.025, 0.02, 'w'],
      ['ell', [0, 0.7, -0.72], [0.04, 0.07, 0.04], 'k'],
    ] },
  ],
  eyes: { part: 'head', at: [0.13, 1.17, 0.88], dir: [0.6, 0.1, 1], style: 'bead', iris: '#2a1c14', px: 1.0 },
  mouth: { style: 'none' },
};
LORE.cow = { name: 'Cow', element: 'none', stage: 0, height: '1.4 m', farm: true, desc: 'Grandpa\'s dairy cow, Hanako. She has never once been impressed by an Elemon.', personality: 'Placid and unbothered.', look: 'Black-and-white Holstein with a pink muzzle, little horns and a red collar with a brass cowbell.' };

DESIGNS.chicken = {
  id: 'chicken', vs: 0.016, arch: 'biped',
  pal: { w: '#f7f5ee', wd: '#ddd8cc', r: '#e23a32', y: '#ffc23a', yd: '#e09a1a' },
  anim: { quirk: ['sniff', 'shakeoff', 'hop', 'nod'], gait: 1.6, stride: 1.2, bounce: 1.3, maxSpeed: 3 },
  parts: [
    { n: 'body', p: [0, 0.2, 0], s: [
      ['ell', [0, 0.2, -0.02], [0.11, 0.1, 0.14], 'w', { belly: 'wd', bellyT: 0.5 }],
      ['ell', [0, 0.24, 0.07], [0.08, 0.09, 0.07], 'w'],
      ['ell', [0, 0.28, -0.14], [0.05, 0.08, 0.05], 'w', { rot: [-30, 0, 0] }],
      ['ell', [0, 0.31, -0.16], [0.035, 0.07, 0.03], 'wd', { rot: [-35, 0, 0] }],
    ] },
    { n: 'head', parent: 'body', p: [0, 0.3, 0.08], s: [
      ['ell', [0, 0.35, 0.1], [0.055, 0.06, 0.055], 'w'],
      ['sph', [0, 0.415, 0.085], 0.022, 'r'],
      ['sph', [0, 0.425, 0.11], 0.02, 'r'],
      ['sph', [0, 0.41, 0.135], 0.017, 'r'],
      ['cap', [0, 0.345, 0.15], [0, 0.335, 0.185], 0.018, 0.006, 'y'],
      ['ell', [0, 0.305, 0.14], [0.015, 0.022, 0.012], 'r'],
    ] },
    { n: 'wingL', parent: 'body', p: [0.1, 0.24, 0.0], mirror: true, s: [
      ['ell', [0.1, 0.21, -0.03], [0.025, 0.065, 0.1], 'w', { rot: [-10, 0, 0], back: 'wd' }],
    ] },
    { n: 'legL', parent: 'body', p: [0.04, 0.12, 0.0], mirror: true, s: [
      ['cap', [0.04, 0.12, 0.0], [0.045, 0.02, 0.01], 0.01, 0.009, 'y'],
      ['cap', [0.045, 0.012, 0.01], [0.03, 0.008, 0.05], 0.008, 0.006, 'yd'],
      ['cap', [0.045, 0.012, 0.01], [0.06, 0.008, 0.05], 0.008, 0.006, 'yd'],
      ['cap', [0.045, 0.012, 0.01], [0.045, 0.008, -0.025], 0.008, 0.006, 'yd'],
    ] },
  ],
  eyes: { part: 'head', at: [0.035, 0.36, 0.14], dir: [0.8, 0.05, 1], style: 'bead', iris: '#1c1410', px: 0.9 },
  mouth: { part: 'head', at: [0, 0.335, 0.19], dir: [0, 0, 1], style: 'beak', px: 0.5 },
};
LORE.chicken = { name: 'Chicken', element: 'none', stage: 0, height: '0.4 m', farm: true, desc: 'One of the farm\'s hens. Lays an egg every morning and chases the shiba every afternoon.', personality: 'Fussy and fearless.', look: 'Plump white hen with a red comb and wattle and a yellow beak and feet.' };

DESIGNS.pig = {
  id: 'pig', vs: 0.025, arch: 'quad',
  pal: { p: '#f6b3b8', pd: '#e2878f', pl: '#ffd0d3', sn: '#ee8f98', snd: '#8a3a44', hf: '#6a4a44' },
  anim: { quirk: ['sniff', 'shakeoff', 'happy'], gait: 1.2, stride: 0.8, bounce: 1.0, maxSpeed: 2.5 },
  parts: [
    { n: 'body', p: [0, 0.32, 0], s: [
      ['ell', [0, 0.33, -0.02], [0.22, 0.2, 0.32], 'p', { belly: 'pl', bellyT: 0.4 }],
    ] },
    { n: 'head', parent: 'body', p: [0, 0.38, 0.25], s: [
      ['ell', [0, 0.4, 0.33], [0.16, 0.15, 0.14], 'p'],
      ['cyl', [0, 0.36, 0.44], [0, 0.36, 0.5], 0.075, 'sn'],
      ['sph', [0.028, 0.36, 0.5], 0.015, 'snd', { m: 1 }],
      ['poly', [0.1, 0.5, 0.3], [[-0.05, 0], [0.05, 0], [0.02, 0.09]], 0.012, 'pd', { m: 1, rot: [30, 0, -25] }],
      ['ell', [0.1, 0.33, 0.43], [0.03, 0.018, 0.02], 'pd', { m: 1, paint: 1 }],
    ] },
    { n: 'legFL', parent: 'body', p: [0.12, 0.2, 0.18], mirror: true, s: [
      ['cap', [0.12, 0.22, 0.18], [0.12, 0.04, 0.19], 0.05, 0.045, 'p'],
      ['cap', [0.12, 0.04, 0.19], [0.12, 0.012, 0.2], 0.045, 0.045, 'hf'],
    ] },
    { n: 'legBL', parent: 'body', p: [0.12, 0.2, -0.2], mirror: true, s: [
      ['cap', [0.12, 0.22, -0.2], [0.12, 0.04, -0.2], 0.055, 0.045, 'p'],
      ['cap', [0.12, 0.04, -0.2], [0.12, 0.012, -0.19], 0.045, 0.045, 'hf'],
    ] },
    { n: 'tail', parent: 'body', p: [0, 0.4, -0.33], s: [
      ['tor', [0, 0.43, -0.37], 0.035, 0.013, 'pd', { axis: 'z' }],
      ['box', [0.03, 0.4, -0.37], [0.02, 0.02, 0.03], 'pd', { sub: 1 }],
      ['cap', [0, 0.41, -0.33], [0.02, 0.41, -0.37], 0.014, 0.013, 'pd'],
    ] },
  ],
  eyes: { part: 'head', at: [0.075, 0.44, 0.44], dir: [0.4, 0.05, 1], style: 'bead', iris: '#1c1410', px: 0.9 },
  mouth: { style: 'none' },
};
LORE.pig = { name: 'Pig', element: 'none', stage: 0, height: '0.6 m', farm: true, desc: 'The farm pig, Butaro. Sleeps in the sun and snores like a tractor.', personality: 'Lazy and content.', look: 'Round pink pig with a big snout, perky ears and a curly tail.' };

DESIGNS.farm_dog = {
  id: 'farm_dog', vs: 0.022, arch: 'quad',
  pal: { o: '#e08a3c', od: '#b8662a', w: '#fbf4e6', k: '#1e1a1c', col: '#2f6fd8', tag: '#ffd23f', pk: '#ff8f9a' },
  anim: { quirk: ['sniff', 'shakeoff', 'happy', 'scratch'], gait: 1.2, bounce: 1.2, tail: 1.5, maxSpeed: 5 },
  parts: [
    { n: 'body', p: [0, 0.33, 0], s: [
      ['ell', [0, 0.34, -0.03], [0.14, 0.14, 0.27], 'o', { belly: 'w', bellyT: 0.35, top: 'od', topT: 0.85 }],
      ['ell', [0, 0.36, 0.15], [0.1, 0.12, 0.1], 'w', { paint: 1 }],
      ['tor', [0, 0.44, 0.2], 0.095, 0.022, 'col', { rot: [-50, 0, 0] }],
      ['sph', [0, 0.38, 0.29], 0.022, 'tag'],
    ] },
    { n: 'head', parent: 'body', p: [0, 0.46, 0.22], s: [
      ['ell', [0, 0.5, 0.29], [0.13, 0.115, 0.115], 'o'],
      ['ell', [0, 0.45, 0.39], [0.075, 0.06, 0.08], 'w'],
      ['ell', [0.07, 0.46, 0.35], [0.06, 0.05, 0.06], 'w', { m: 1, paint: 1 }],
      ['ell', [0, 0.48, 0.475], [0.025, 0.018, 0.015], 'k'],
      ['ell', [0.05, 0.56, 0.38], [0.025, 0.012, 0.012], 'w', { m: 1 }],
      ['poly', [0.075, 0.6, 0.27], [[-0.045, 0], [0.045, 0], [0.012, 0.1]], 0.02, 'o', { m: 1, rot: [0, -10, -12] }],
      ['poly', [0.075, 0.6, 0.29], [[-0.025, 0.01], [0.025, 0.01], [0.008, 0.065]], 0.006, 'pk', { m: 1, rot: [0, -10, -12] }],
    ] },
    { n: 'legFL', parent: 'body', p: [0.075, 0.27, 0.15], mirror: true, s: [
      ['cap', [0.075, 0.28, 0.15], [0.078, 0.03, 0.17], 0.04, 0.032, 'o', { grad: { axis: 'y', to: 'w', a: 0.14, b: 0.08 } }],
    ] },
    { n: 'legBL', parent: 'body', p: [0.08, 0.27, -0.2], mirror: true, s: [
      ['ell', [0.085, 0.26, -0.21], [0.05, 0.08, 0.07], 'o'],
      ['cap', [0.085, 0.2, -0.22], [0.085, 0.03, -0.2], 0.035, 0.032, 'o', { grad: { axis: 'y', to: 'w', a: 0.14, b: 0.08 } }],
    ] },
    { n: 'tail', parent: 'body', p: [0, 0.42, -0.27], s: [
      ['tor', [0, 0.52, -0.25], 0.075, 0.04, 'o', { axis: 'x', belly: 'w', bellyT: 0.3 }],
      ['box', [0, 0.47, -0.17], [0.06, 0.06, 0.05], 'o', { sub: 1 }],
    ] },
  ],
  eyes: { part: 'head', at: [0.055, 0.53, 0.39], dir: [0.35, 0.05, 1], style: 'round', iris: '#2a1810', px: 0.7 },
  mouth: { part: 'head', at: [0, 0.43, 0.47], dir: [0, -0.3, 1], style: 'cat', px: 0.5 },
};
LORE.farm_dog = { name: 'Shiba', element: 'none', stage: 0, height: '0.6 m', farm: true, desc: 'Pochi, the family shiba inu. Herds the chickens, guards the gate and greets every sunrise with a bark.', personality: 'Loyal, bold and a little stubborn.', look: 'Red-tan shiba inu with white urajiro markings, pointed ears, a curled tail and a blue collar with a gold tag.' };
