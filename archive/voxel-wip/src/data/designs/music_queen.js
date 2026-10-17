// Queen (Champions) partner Tokonmon. See docs/refs/tokonmon_roster.md §12 and docs/refs/characters.md §6.
// Voxel/SDF DSL: docs/MODELING.md. Model space is absolute: metres, +y up, +z = front, left = +x.
//   killerqueen  (Ecto/Bio)   rococo queen bee: pouf, striped satin gown-abdomen, hatpin stinger, lace fan
//   bohemoth     (Echo/Ecto)  curtain-cloaked void behemoth with four top-lit opera masks in a diamond
//   dontstopmeow (Volto)      jet-black cheetah-cat with white op-art ring targets and a comet tail
//   radiogaga    (Echo/Volto) Art Deco chrome robot with a cathedral-radio head and a tuning-dial eye
//   bitesdust    (Geo)        laid-back sandstone lizard strung like a bass, woofer chest, tuning-peg tail
// Shared Champion accent: crown-gold #ffcf3a + royal violet #5a2a8a. No crest, logos, lyrics or likenesses.

export const DESIGNS = {};
export const LORE = {};

// ---------------------------------------------------------------- helpers
const D2R = Math.PI / 180;
// n items around the y axis: f(angle, x, z, i) → shape tuple
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
// Rigidly rotate shape tuples about `pivot` by Euler `rot` (deg), then translate by `move`.
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
    if (k === 'tor' && opts.axis) {
      const pre = opts.axis === 'x' ? [0, 0, -90] : opts.axis === 'z' ? [90, 0, 0] : [0, 0, 0];
      opts.rot = mEuler(mulM(W, mulM(eulerM((o[oi] && o[oi].rot) || [0, 0, 0]), eulerM(pre))));
      delete opts.axis;
    }
    o[oi] = opts;
    return o;
  });
}
const P3 = (pivot, rot, v) => { const q = apM(eulerM(rot), [v[0] - pivot[0], v[1] - pivot[1], v[2] - pivot[2]]); return [q[0] + pivot[0], q[1] + pivot[1], q[2] + pivot[2]]; };
// Smooth tapered tube through points (one capsule per segment).
function tube(pts, r0, r1, col, opts = {}) {
  const out = [], n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const ra = r0 + (r1 - r0) * (i / n), rb = r0 + (r1 - r0) * ((i + 1) / n);
    out.push(['cap', pts[i], pts[i + 1], ra, rb, col, { ...opts }]);
  }
  return out;
}
// Quadratic bezier sampled into n+1 points.
function bez(a, b, c, n = 6) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([0, 1, 2].map((k) => u * u * a[k] + 2 * u * t * b[k] + t * t * c[k]));
  }
  return out;
}
// Procedural pixel art: n×n rows from f(x, y, r, a) → char; x,y in [-1,1], y up.
function pix(w, h, f) {
  const rows = [];
  for (let j = 0; j < h; j++) {
    let row = '';
    for (let i = 0; i < w; i++) {
      const x = ((i + 0.5) / w) * 2 - 1, y = 1 - ((j + 0.5) / h) * 2;
      row += f(x, y, Math.hypot(x, y), Math.atan2(y, x)) || '.';
    }
    rows.push(row);
  }
  return rows;
}

// ================================================================ 1. KILLERQUEEN
// Ecto/Bio queen bee, "Killer Queen": a rococo grande dame. Gold royal-jelly pouf with a crown-pin,
// feather-boa fuzz collar, violet bodice, black/gold striped satin gown that IS her abdomen (pannier
// hips), jewelled hatpin stinger, four Ecto ghost-wings with eye-spots, four arms (lace fan, claws).
{
  const STR = { axis: 'y', p: 0.112, w: 0.05, col: 'y', o: 0.02 };
  // A ghost-wing pointing along +y from the origin, fanned by `ang` (deg toward +x), leaned back by `tilt`.
  const wing = (root, ang, len, wid, tilt, spot = true) => {
    const th = 0.024;
    const s = [
      ['ell', [0, len * 0.5, 0], [wid, len * 0.5, th], 'we', { glow: 1, jit: 0 }],
      ['ell', [0, len * 0.48, 0], [wid * 0.74, len * 0.42, th * 1.3], 'w1', { paint: 1, glow: 1, jit: 0 }],
    ];
    if (spot) s.push(
      ['sph', [0, len * 0.68, 0], wid * 0.46, 'we', { paint: 1, glow: 1, jit: 0 }],
      ['sph', [0, len * 0.68, 0], wid * 0.28, 'wd', { paint: 1, jit: 0 }],
    );
    return xf(s, [0, 0, 0], [tilt, 0, -ang], root);
  };
  // lace fan: half-disc opening upward from the hand, facing +z, scalloped lace edge + violet guard
  const fanPts = [];
  for (let i = 0; i <= 14; i++) { const a = (i / 14) * Math.PI, r = i % 2 ? 0.215 : 0.24; fanPts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  const fanShapes = (c) => xf([
    ['poly', [0, 0, 0], fanPts, 0.024, 'fa', { jit: 0 }],
    ['tor', [0, 0, 0], 0.215, 0.026, 'y', { paint: 1, axis: 'z', jit: 0 }],
    ['sph', [0, 0, 0], 0.075, 'rv', { paint: 1, jit: 0 }],
    ['sph', [0, 0, 0], 0.034, 'rv'],
  ], [0, 0, 0], [-12, 0, 34], c);
  const FAN = [-0.27, 1.075, 0.15];
  DESIGNS.killerqueen = {
    id: 'killerqueen', vs: 0.027, arch: 'flyer',
    pal: {
      g0: '#1a1420', g1: '#3a2a40', y: '#ffcf3a', yd: '#c8902a', yl: '#fff0b0',
      f: '#f6efe0', fv: '#c9b8ff', pf: '#ffd866', pfd: '#e09a34', pfl: '#fff2c0',
      w1: '#a98aff', we: '#ff7af2', wd: '#3a1a6a',
      st: '#d0dae4', sj: '#ff3a8a', fa: '#f6eefa', fr: '#9a6ad8', cl: '#14121c',
      rv: '#5a2a8a', rvl: '#8a52c8', sk: '#f8eae6', ck: '#ffa8c8', lc: '#fbf6ff',
      gs: '#b07aff', ge: '#ff9af0',
    },
    anim: { quirk: ['sway', 'think', 'spin', 'happy'], bounce: 0.8, hover: 0.07, maxSpeed: 4.2 },
    parts: [
      { n: 'body', p: [0, 0.9, 0], s: [
        // violet satin bodice with a stomacher point and gold lacing
        ['ell', [0, 1.0, -0.01], [0.105, 0.12, 0.085], 'rv', { top: 'rvl', topT: 0.6 }],
        ['cap', [0, 1.04, 0.045], [0, 0.88, 0.06], 0.06, 0.025, 'rv', { blend: 0.03 }],
        // échelle: a ladder of three little gold bows down the stomacher
        ...[0.92, 0.97, 1.02].flatMap((y, i) => [
          ['ell', [0.018 - i * 0.002, y, 0.085 - i * 0.004], [0.02, 0.012, 0.012], 'y', { m: 1, jit: 0, rot: [0, 0, -18] }],
          ['sph', [0, y, 0.088 - i * 0.004], 0.011, 'yd', { jit: 0 }],
        ]),
        // feather-boa fuzz collar (bee fuzz)
        ['tor', [0, 1.085, -0.005], 0.1, 0.052, 'f', { noise: 0.012, noiseScale: 0.035, dither: { col: 'fv', amt: 0.25 }, jit: 0.04 }],
        ['sph', [0, 1.06, 0.08], 0.046, 'f', { noise: 0.01, noiseScale: 0.03, dither: { col: 'fv', amt: 0.25 }, jit: 0.04 }],
        // puffed sleeves (upper pair) and lace ruffle at the waist
        ['sph', [0.14, 1.06, -0.01], 0.055, 'rv', { m: 1, top: 'rvl', topT: 0.5 }],
        ['tor', [0, 0.89, 0], 0.078, 0.024, 'lc', { noise: 0.008, noiseScale: 0.025, jit: 0 }],
      ] },
      { n: 'gown', parent: 'body', p: [0, 0.88, 0], sway: { axis: 'z', amp: 0.035, freq: 0.7 }, s: [
        // the abdomen IS the gown: narrow waist → wide pannier hips → tapered tip
        ['cap', [0, 0.88, 0], [0, 0.7, -0.02], 0.075, 0.24, 'g0', { stripes: STR, top: 'g1', topT: 0.5 }],
        ['ell', [0, 0.56, -0.03], [0.245, 0.29, 0.21], 'g0', { blend: 0.07, stripes: STR, top: 'g1', topT: 0.5 }],
        ['ell', [0.13, 0.63, -0.03], [0.145, 0.125, 0.17], 'g0', { m: 1, blend: 0.08, stripes: STR, top: 'g1', topT: 0.5 }],
        ['cap', [0, 0.42, -0.04], [0, 0.16, -0.09], 0.2, 0.055, 'g0', { blend: 0.1, stripes: STR }],
      ] },
      { n: 'stinger', parent: 'gown', p: [0, 0.17, -0.08], s: [
        ['sph', [0, 0.17, -0.085], 0.036, 'sj', { glow: 1 }],
        ['cap', [0, 0.15, -0.09], [0, 0.0, -0.17], 0.02, 0.007, 'st', { jit: 0 }],
      ] },
      { n: 'head', parent: 'body', p: [0, 1.12, 0], s: [
        ['cap', [0, 1.1, -0.01], [0, 1.19, 0.0], 0.04, 0.04, 'sk'],
        ['ell', [0, 1.275, 0.015], [0.168, 0.155, 0.15], 'sk'],
        ['ell', [0, 1.2, 0.05], [0.09, 0.06, 0.09], 'sk', { blend: 0.05 }],
        ['ell', [0.105, 1.22, 0.115], [0.03, 0.017, 0.02], 'ck', { m: 1, paint: 1, jit: 0 }],
        // royal-jelly hair cap + towering three-lobed pouf with rococo side curls
        ['ell', [0, 1.33, -0.035], [0.168, 0.125, 0.155], 'pf', { noise: 0.008, noiseScale: 0.04, grad: { axis: 'y', to: 'pfd', a: 1.36, b: 1.22 } }],
        ['ell', [0, 1.47, -0.05], [0.17, 0.11, 0.155], 'pf', { noise: 0.012, noiseScale: 0.045, grad: { axis: 'y', to: 'pfd', a: 1.48, b: 1.38 } }],
        ['ell', [0, 1.59, -0.06], [0.165, 0.1, 0.14], 'pf', { noise: 0.013, noiseScale: 0.045, grad: { axis: 'y', to: 'pfl', a: 1.6, b: 1.72 } }],
        ['sph', [0.075, 1.67, -0.06], 0.08, 'pf', { noise: 0.01, noiseScale: 0.04, grad: { axis: 'y', to: 'pfl', a: 1.64, b: 1.74 } }],
        ['sph', [-0.06, 1.69, -0.07], 0.085, 'pf', { noise: 0.01, noiseScale: 0.04, grad: { axis: 'y', to: 'pfl', a: 1.64, b: 1.76 } }],
        ['sph', [-0.01, 1.765, -0.07], 0.045, 'pfl', { noise: 0.006, noiseScale: 0.03 }],
        ['sph', [0.16, 1.36, -0.03], 0.055, 'pf', { m: 1, noise: 0.008, noiseScale: 0.035, grad: { axis: 'y', to: 'pfd', a: 1.38, b: 1.3 } }],
        ['sph', [0.14, 1.28, -0.075], 0.05, 'pf', { m: 1, noise: 0.008, noiseScale: 0.035, grad: { axis: 'y', to: 'pfd', a: 1.3, b: 1.22 } }],
        // violet ribbon + pearl strand around the pouf
        ['tor', [0, 1.525, -0.05], 0.15, 0.018, 'rv', { rot: [8, 0, 0], jit: 0 }],
        ['tor', [0, 1.635, -0.06], 0.125, 0.013, 'lc', { rot: [-6, 0, 0], jit: 0 }],
        // tiny crown-pin at the front of the pouf
        ['cyl', [0, 1.64, 0.055], [0, 1.665, 0.06], 0.035, 'y', { jit: 0 }],
        ...[-1, 0, 1].map((i) => ['cap', [i * 0.024, 1.665, 0.062], [i * 0.03, 1.705, 0.066], 0.011, 0.005, 'y', { jit: 0 }]),
        ['sph', [0, 1.65, 0.09], 0.015, 'sj', { glow: 1 }],
      ] },
      { n: 'antL', parent: 'head', p: [0.05, 1.39, 0.09], mirror: true, s: [
        ...tube(bez([0.05, 1.39, 0.09], [0.07, 1.52, 0.15], [0.16, 1.55, 0.2], 4), 0.016, 0.013, 'g0'),
        ['sph', [0.17, 1.555, 0.205], 0.027, 'y', { glow: 1, jit: 0 }],
      ] },
      // upper right arm: holds the lace fan up beside her face
      { n: 'armR', parent: 'body', p: [-0.145, 1.06, 0], s: [
        ['cap', [-0.145, 1.06, 0], [-0.24, 0.93, 0.04], 0.03, 0.025, 'g0'],
        ['sph', [-0.24, 0.93, 0.04], 0.04, 'lc', { noise: 0.009, noiseScale: 0.025, jit: 0 }],
        ['cap', [-0.24, 0.93, 0.04], [-0.27, 1.05, 0.14], 0.025, 0.02, 'g0'],
        ['ell', [-0.27, 1.07, 0.15], [0.028, 0.034, 0.026], 'cl'],
      ] },
      { n: 'fan', parent: 'armR', p: FAN, sway: { axis: 'z', amp: 0.1, freq: 1.3 }, s: fanShapes(FAN) },
      // upper left arm: hand on the pannier hip (akimbo), black-lacquered claws
      { n: 'armL', parent: 'body', p: [0.145, 1.06, 0], s: [
        ['cap', [0.145, 1.06, 0], [0.27, 0.94, -0.02], 0.03, 0.025, 'g0'],
        ['sph', [0.27, 0.94, -0.02], 0.04, 'lc', { noise: 0.009, noiseScale: 0.025, jit: 0 }],
        ['cap', [0.27, 0.94, -0.02], [0.17, 0.86, 0.06], 0.025, 0.02, 'g0'],
        ['ell', [0.16, 0.85, 0.075], [0.032, 0.025, 0.032], 'cl'],
        ...[-1, 0, 1].map((i) => ['cap', [0.15, 0.845, 0.085 + i * 0.018], [0.1, 0.835, 0.095 + i * 0.026], 0.01, 0.005, 'cl', { jit: 0 }]),
      ] },
      // lower pair: slim arms folded at the stomacher, claws demurely crossed
      { n: 'arm2L', parent: 'body', p: [0.09, 0.96, 0.03], mirror: true, s: [
        ['cap', [0.09, 0.96, 0.03], [0.13, 0.87, 0.08], 0.022, 0.019, 'g0'],
        ['cap', [0.13, 0.87, 0.08], [0.035, 0.83, 0.12], 0.019, 0.016, 'g0'],
        ['ell', [0.03, 0.825, 0.125], [0.024, 0.018, 0.02], 'cl'],
      ] },
      // four Ecto ghost-wings held like a fan behind her
      { n: 'fwingL', parent: 'body', p: [0.05, 1.06, -0.09], mirror: true, sway: { axis: 'z', amp: 0.035, freq: 13 }, s: wing([0.05, 1.06, -0.09], 40, 0.66, 0.135, -24) },
      { n: 'hwingL', parent: 'body', p: [0.05, 0.98, -0.1], mirror: true, sway: { axis: 'z', amp: 0.03, freq: 13, phase: 1.2 }, s: wing([0.05, 0.98, -0.1], 98, 0.42, 0.095, -16) },
    ],
    eyes: {
      part: 'head', at: [0.066, 1.285, 0.15], dir: [0.32, 0.02, 1], iris: '#b06a10', px: 0.68,
      rows: ['.kkkkk', 'kkiiwk', '.kiiik', '.kjjk.'], cmap: { j: '#ffd24a' },
    },
    mouth: { part: 'head', at: [0, 1.205, 0.145], dir: [0, -0.1, 1], px: 0.62, rows: { closed: ['....k', 'kkkk.'], open: ['kkkkk', 'krrrk', '.kkk.'] } },
    fx: [
      { part: 'fan', at: [FAN[0] - 0.08, FAN[1] + 0.2, FAN[2]], type: 'bubble', rate: 0.5, scale: 0.6, color: '#ffe8b0' },
      { part: 'stinger', at: [0, 0.0, -0.17], type: 'glow', rate: 0.4, scale: 0.4, color: '#ff7af2' },
    ],
    bond: {
      // "Royal Court": two spectral worker bees attend her while bonded; her wings swell
      parts: [
        { n: 'court', parent: 'body', p: [0, 1.1, 0], spin: { axis: 'y', speed: 1.6 }, s: [
          ...[0, 1].flatMap((i) => {
            const a = i * Math.PI + 0.6, x = Math.sin(a) * 0.48, z = Math.cos(a) * 0.48, y = 1.0 + i * 0.16;
            return [
              ['ell', [x, y, z], [0.055, 0.05, 0.065], 'w1', { glow: 1, stripes: { axis: 'z', p: 0.045, w: 0.018, col: 'wd' }, jit: 0 }],
              ['ell', [x + 0.03, y + 0.055, z - 0.01], [0.05, 0.03, 0.014], 'we', { glow: 1, jit: 0, rot: [0, 0, -30] }],
              ['ell', [x - 0.03, y + 0.055, z - 0.01], [0.05, 0.03, 0.014], 'we', { glow: 1, jit: 0, rot: [0, 0, 30] }],
            ];
          }),
        ] },
      ],
      grow: { fwingL: 1.22, fwingR: 1.22, hwingL: 1.18, hwingR: 1.18 },
      hat: { part: 'head', at: [0, 1.775, -0.065], scale: 0.6, tilt: -6 },
      aura: 'bubbles', auraColor: [2.2, 1.8, 1.0, 1],
    },
    forms: {
      // "Dynamite Monarch": ghost-silk train to the floor, six-spike crown, orbiting spectral swarm,
      // champagne bubbles turned to golden sparks
      elemental: {
        pal: { g1: '#4a2a6a', w1: '#d89aff', wd: '#7a1a8a', fv: '#ff9ae8', rv: '#7a2aa8', rvl: '#b070e0' },
        parts: [
          { n: 'train', parent: 'gown', p: [0, 0.5, -0.1], sway: { axis: 'x', amp: 0.05, freq: 0.8 }, s: [
            ['cap', [0, 0.62, -0.16], [0, 0.04, -0.6], 0.22, 0.18, 'gs', { glow: 1, grad: { axis: 'z', to: 'ge', a: -0.3, b: -0.7 }, jit: 0 }],
            ['ell', [0, 0.05, -0.58], [0.34, 0.05, 0.25], 'gs', { glow: 1, blend: 0.08, grad: { axis: 'z', to: 'ge', a: -0.4, b: -0.85 }, jit: 0 }],
            ...[-0.22, -0.07, 0.07, 0.22].map((x, i) => ['sph', [x, 0.02, -0.83 - (i % 2) * 0.05], 0.065, 'gs', { sub: 1 }]),
          ] },
          { n: 'crown', parent: 'head', p: [0, 1.47, -0.05], s: [
            ['tor', [0, 1.45, -0.05], 0.17, 0.022, 'y', { jit: 0 }],
            ...ring(6, 0.17, 1.45, 0, (a, x, z) => ['cap', [x, 1.45, z - 0.05], [x * 1.18, 1.62, z * 1.18 - 0.05], 0.03, 0.008, 'y', { jit: 0, tip: 'yl', tipT: 0.7 }]),
            ...ring(6, 0.18, 1.45, Math.PI / 6, (a, x, z) => ['sph', [x, 1.45, z - 0.05], 0.018, 'sj', { glow: 2 }]),
          ] },
          { n: 'swarm', parent: 'body', p: [0, 1.0, 0], spin: { axis: 'y', speed: -0.9 }, s: [
            ...ring(6, 0.6, 0, 0.3, (a, x, z, i) => ['ell', [x, 0.78 + (i % 3) * 0.16, z], [0.04, 0.035, 0.05], 'w1', { glow: 1, stripes: { axis: 'z', p: 0.035, w: 0.013, col: 'wd' }, jit: 0 }]),
            ...ring(6, 0.6, 0, 0.3, (a, x, z, i) => ['ell', [x, 0.82 + (i % 3) * 0.16, z], [0.045, 0.022, 0.012], 'we', { glow: 1, jit: 0 }]),
          ] },
        ],
        eyes: { iris: '#b0208a', cmap: { j: '#ff8af0' } },
        fx: [
          { part: 'swarm', at: [0.6, 0.9, 0], type: 'spark', rate: 1.2, scale: 0.7, color: '#ffcf3a' },
          { part: 'crown', at: [0, 1.62, -0.05], type: 'star', rate: 0.8, scale: 0.6, color: '#fff0b0' },
          { part: 'train', at: [0, 0.1, -0.6], type: 'wisp', rate: 0.8, scale: 0.8, color: '#d89aff' },
        ],
        anim: { hover: 0.12 },
      },
    },
  };
}
LORE.killerqueen = {
  name: 'Killerqueen', element: 'ecto', element2: 'bio', stage: 3, height: '1.7 m',
  desc: 'The Champions\' grande dame. She drifts into the stadium on four ghost-wings, fans herself once, and the crowd falls silent. Her hatpin stinger never runs dry, and her champagne-gold bubbles send rivals into a dizzy, fizzing sleep.',
  personality: 'Elegant, witty and quietly lethal; adores applause and never raises her voice.',
  look: 'Tall upright queen bee with a towering gold royal-jelly pouf and tiny crown-pin, a white-violet feather-boa fuzz collar, a violet bodice, a black-and-gold striped satin gown-abdomen with pannier hips, a jewelled hatpin stinger, four violet ghost-wings with pink eye-spots, a lace fan and black-lacquered claws.',
};

// ================================================================ 2. BOHEMOTH
// Echo/Ecto, "Bohemian Rhapsody": a behemoth-sized void cloaked in a stage-curtain mantle (red lining,
// gold valance and tie-backs), parted in front on a starry void; four original porcelain opera masks
// float in a diamond around it, always top-lit (bright brows, black below the cheekbones).
// Top = falsetto, left = tenor, right = baritone, bottom-front = bass (its jaw opens; it carries the
// expressive eyes). Mask faces are crisp pixel decals on flat gilded face-plates.
{
  // pixel faces (k ink, g gold, e Echo-glow pupil, o glowing open mouth); x+ = screen right
  const FACE = {
    falsetto: [
      '.....gg.....',
      '.....gg.....',
      '............',
      '.ggg....ggg.',
      'g...g..g...g',
      '............',
      '.kkkk..kkkk.',
      '..kk....kk..',
      '............',
      '............',
      '.....kk.....',
      '....kook....',
      '.....kk.....',
    ],
    tenor: [
      '.ggg......ggg.',
      'g...g....g...g',
      '..............',
      '..kkk....kkk..',
      '.kkekk..kkekk.',
      '..kkk....kkk..',
      '..............',
      '..............',
      '.....kkkk.....',
      '....kooook....',
      '....kooook....',
      '.....kook.....',
      '......kk......',
    ],
    baritone: [
      '.........ggg..',
      '........g...g.',
      '.gggg.........',
      '..............',
      '..kkkk..kkkk..',
      '..kekk..kkek..',
      '...kk....kk...',
      '..............',
      '.gg...........',
      'g..g.......kk.',
      '.g...k....kk..',
      '......kkkkk...',
    ],
    bass: [
      '.gggggg..gggggg.',
      'g......gg......g',
      '................',
    ],
  };
  const FCMAP = { k: '#1e1a2a', g: '#ffcf3a', e: { c: '#5ff4ff', glow: 2 }, o: { c: '#b26bff', glow: 2 } };
  // A porcelain mask facing +z (then turned by yaw) at c, height ≈ 0.36·s, with a flat face-plate,
  // a gilded rim, a dark violet inside, and the top-light fall-off baked into the lower face.
  const mask = (c, s, yaw = 0, jowls = false) => {
    const [x, y, z] = c, fz = z + 0.045 * s;
    const sh = [
      ['ell', [x, y + 0.01 * s, z], [0.15 * s, 0.17 * s, 0.09 * s], 'gd', { jit: 0 }],
      ['ell', [x, y - 0.1 * s, z], [0.105 * s, 0.09 * s, 0.08 * s], 'gd', { blend: 0.05 * s, jit: 0 }],
    ];
    if (jowls) for (const sx of [1, -1]) sh.push(['ell', [x + sx * 0.09 * s, y - 0.08 * s, z], [0.08 * s, 0.08 * s, 0.08 * s], 'gd', { blend: 0.03 * s, jit: 0 }]);
    sh.push(
      ['box', [x, y, fz + 0.2 * s], [0.3 * s, 0.3 * s, 0.2 * s], 'gd', { sub: 1 }],
      // porcelain face-plate, lit from above
      ['box', [x, y, fz], [0.3 * s, 0.3 * s, 0.032 * s], 'mp', { paint: 1, grad: { axis: 'y', to: 'ms', a: y - 0.04 * s, b: y - 0.13 * s }, jit: 0.02 }],
      ['box', [x, y - 0.22 * s, fz], [0.3 * s, 0.1 * s, 0.034 * s], 'mb', { paint: 1, grad: { axis: 'y', to: 'ms', a: y - 0.25 * s, b: y - 0.13 * s }, jit: 0 }],
      // dark violet inside / back
      ['box', [x, y, z - 0.2 * s], [0.3 * s, 0.3 * s, 0.2 * s], 'mi', { paint: 1, jit: 0 }],
    );
    return yaw ? xf(sh, c, [0, yaw, 0]) : sh;
  };
  const faceDecal = (part, c, s, yaw, kind, dy = 0) => {
    const d = [Math.sin(yaw * D2R), 0, Math.cos(yaw * D2R)], f = 0.06 * s;
    return { part, at: [c[0] + d[0] * f, c[1] + dy * s, c[2] + d[2] * f], dir: d, rows: FACE[kind], cmap: FCMAP, px: 0.52 * s, depth: 1 };
  };
  const SB = 1.55, ST = 1.1, SS = 1.35; // bass / falsetto / side mask scales
  const T = [0, 2.3, 0.04], L = [0.78, 1.62, 0.26], R = [-0.78, 1.62, 0.26], B = [0, 1.02, 0.6];
  // stage-curtain mantle: a bell with vertical pleats, parted in front on a starry void
  const pleats = ring(14, 1, 0, Math.PI / 14, (a, sx, sz) => ['cap', [sx * 0.42, 1.42, sz * 0.36 - 0.05], [sx * 0.66, 0.06, sz * 0.62 - 0.03], 0.075, 0.1, 'vf', { blend: 0.06 }]);
  const OPEN = [[-0.36, -0.05], [0.36, -0.05], [0.05, 1.2], [-0.05, 1.2]];
  const OPENR = [[-0.44, -0.05], [0.44, -0.05], [0.07, 1.32], [-0.07, 1.32]];
  DESIGNS.bohemoth = {
    id: 'bohemoth', vs: 0.036, arch: 'floater',
    pal: {
      v: '#120e18', vf: '#2a2036', vd: '#0a0812', vi: '#140f24', lr: '#c0182a', ld: '#6a0e1a',
      mp: '#f4ece0', ml: '#c8b8a8', ms: '#6a5a8a', mb: '#1e1a2a', mi: '#3a2a4a',
      gd: '#ffcf3a', gk: '#b0802a', rv: '#5a2a8a', eg: '#5ff4ff', eo: '#b26bff', st: '#c9a8ff',
      ck: '#d8c8ff', sp: '#2a2638', sl: '#fff6d0',
    },
    anim: { quirk: ['sway', 'roar', 'nod', 'spin'], bounce: 0.6, hover: 0.04, maxSpeed: 2.6 },
    parts: [
      { n: 'body', p: [0, 0.9, 0], s: [
        ['cap', [0, 1.55, -0.06], [0, 0.1, -0.03], 0.42, 0.68, 'v'],
        ['ell', [0, 1.56, -0.09], [0.58, 0.34, 0.44], 'v', { blend: 0.14, top: 'vf', topT: 0.7 }],
        ['sph', [0, 1.72, -0.1], 0.32, 'v', { blend: 0.14, top: 'vf', topT: 0.7 }],
        ['cap', [0, 1.78, -0.1], [0, 1.98, -0.1], 0.22, 0.1, 'v', { blend: 0.1 }],
        ...pleats,
        // curtain gathered into a gold canopy ring with a finial (the top mask floats above it)
        ...ring(10, 0.2, 0, 0, (a, sx, sz) => ['cap', [sx * 0.75, 1.96, sz * 0.75 - 0.1], [sx * 3.0, 1.55, sz * 2.4 - 0.1], 0.05, 0.08, 'vf', { blend: 0.05 }]),
        ['tor', [0, 1.95, -0.1], 0.15, 0.035, 'gd', { jit: 0 }],
        ['sph', [0, 2.02, -0.1], 0.06, 'gd', { jit: 0 }],
        ['box', [0, -0.2, 0], [1.2, 0.2, 1.2], 'v', { sub: 1 }],
        // red lining at the hem, gold valance band across the shoulders
        ['box', [0, 0.04, 0], [1.2, 0.045, 1.2], 'lr', { paint: 1, jit: 0.04 }],
        ['box', [0, 1.4, 0], [1.2, 0.03, 1.2], 'gd', { paint: 1, jit: 0.03 }],
        // gold tie-back ropes + tassels holding the parted curtains
        ...[1, -1].flatMap((sx) => [
          ...tube(bez([sx * 0.2, 0.62, 0.6], [sx * 0.45, 0.6, 0.52], [sx * 0.62, 0.66, 0.2], 4), 0.024, 0.024, 'gd', { jit: 0 }),
          ['sph', [sx * 0.22, 0.6, 0.6], 0.04, 'gd', { jit: 0 }],
          ['cap', [sx * 0.22, 0.57, 0.61], [sx * 0.23, 0.42, 0.62], 0.025, 0.045, 'gk', { jit: 0 }],
        ]),
        // parted curtains: red lining rim, then the void inside
        ['poly', [0, 0, 0.62], OPEN, 0.5, 'v', { sub: 1 }],
        ['poly', [0, 0, 0.62], OPENR, 0.52, 'lr', { paint: 1, jit: 0.04 }],
        ['box', [0, 0.6, 0.0], [0.42, 0.7, 0.22], 'vi', { paint: 1, jit: 0 }],
        // starry stage-void
        ...[[0.12, 0.35], [-0.16, 0.52], [0.05, 0.8], [-0.06, 0.22], [0.2, 0.62], [-0.1, 0.98]].map(([sx, sy], i) => ['sph', [sx * (1 - sy * 0.6), sy, 0.16], 0.022 + (i % 2) * 0.008, 'st', { glow: 2, jit: 0 }]),
      ] },
      { n: 'armL', parent: 'body', p: [0.5, 1.42, -0.04], mirror: true, s: [
        ['cap', [0.48, 1.48, -0.05], [0.8, 0.96, 0.16], 0.2, 0.25, 'v'],
        ['cap', [0.62, 1.3, 0.04], [0.88, 0.9, 0.2], 0.07, 0.09, 'vf', { blend: 0.06 }],
        ['cyl', [0.82, 0.96, 0.17], [0.86, 0.85, 0.2], 0.25, 'lr', { jit: 0.03 }],
        ['cyl', [0.83, 0.93, 0.175], [0.88, 0.8, 0.21], 0.2, 'lr', { sub: 1 }],
        // big porcelain hand, gilded fingertips
        ['ell', [0.86, 0.76, 0.22], [0.11, 0.13, 0.085], 'mp', { grad: { axis: 'y', to: 'ms', a: 0.78, b: 0.64 } }],
        ...[-1, 0, 1, 2].map((i) => ['cap', [0.86 + i * 0.045 - 0.02, 0.68, 0.26], [0.86 + i * 0.058 - 0.03, 0.5 + Math.abs(i - 0.5) * 0.04, 0.3], 0.034, 0.026, 'mp', { tip: 'gd', tipT: 0.78, grad: { axis: 'y', to: 'ms', a: 0.66, b: 0.54 } }]),
        ['cap', [0.77, 0.76, 0.27], [0.73, 0.64, 0.34], 0.034, 0.026, 'mp', { tip: 'gd', tipT: 0.75 }],
      ] },
      // the four voices
      { n: 'head', parent: 'body', p: B, sway: { axis: 'z', amp: 0.04, freq: 0.6, phase: 0 }, s: mask(B, SB, 0, true) },
      { n: 'jaw', parent: 'head', p: [B[0], B[1] - 0.08 * SB, B[2] + 0.02], s: [
        // the bass's deep-open mouth: a glowing throat and a heavy lower jowl that drops when it sings
        ['ell', [B[0], B[1] - 0.105 * SB, B[2] + 0.045 * SB], [0.06 * SB, 0.03 * SB, 0.012 * SB], 'eo', { glow: 2, jit: 0 }],
        ['ell', [B[0], B[1] - 0.105 * SB, B[2] + 0.045 * SB], [0.075 * SB, 0.042 * SB, 0.01 * SB], 'mb', { under: 1, jit: 0 }],
      ] },
      { n: 'maskTop', parent: 'body', p: T, sway: { axis: 'z', amp: 0.06, freq: 0.5, phase: 1.6 }, s: mask(T, ST) },
      { n: 'maskL', parent: 'body', p: L, sway: { axis: 'x', amp: 0.06, freq: 0.55, phase: 3.1 }, s: mask(L, SS, 20) },
      { n: 'maskR', parent: 'body', p: R, sway: { axis: 'x', amp: 0.06, freq: 0.55, phase: 4.7 }, s: mask(R, SS, -20) },
    ],
    eyes: {
      part: 'head', at: [B[0] + 0.058 * SB, B[1] + 0.005 * SB, B[2] + 0.06 * SB], dir: [0, 0, 1], px: 0.62,
      rows: ['.kkkk.', 'kkeekk', '.kkkk.'], cmap: { k: '#1e1a2a', e: { c: '#5ff4ff', glow: 2 } },
    },
    mouth: { part: 'head', style: 'none' },
    decals: [
      faceDecal('maskTop', T, ST, 0, 'falsetto', 0.0),
      faceDecal('maskL', L, SS, 20, 'tenor', -0.01),
      faceDecal('maskR', R, SS, -20, 'baritone', -0.01),
      faceDecal('head', B, SB, 0, 'bass', 0.075),
    ],
    fx: [
      { part: 'maskL', at: [L[0], L[1] - 0.1, L[2] + 0.12], type: 'note', rate: 0.45, scale: 0.8, color: '#b26bff' },
      { part: 'maskTop', at: [T[0], T[1] + 0.05, T[2] + 0.1], type: 'note', rate: 0.25, scale: 0.6, color: '#5ff4ff' },
      { part: 'body', at: [0, 0.1, 0.4], type: 'wisp', rate: 0.6, scale: 1.0, color: '#8a5aff' },
    ],
    bond: {
      // echo after-images: each mask gains a receding violet echo behind it; masks swell
      parts: [
        { n: 'echoes', parent: 'body', p: [0, 1.5, 0], sway: { axis: 'y', amp: 0.08, freq: 0.9 }, s: [
          ...[[T, ST, 0], [L, SS, 20], [R, SS, -20], [B, SB, 0]].flatMap(([c, k, yaw]) => {
            const o = [c[0] * 1.14, c[1] + (c[1] > 2 ? 0.08 : c[1] < 1.2 ? -0.05 : 0.04), c[2] - 0.18];
            return xf([
              ['ell', o, [0.15 * k, 0.18 * k, 0.03 * k], 'eo', { glow: 1, jit: 0 }],
              ['ell', [o[0], o[1], o[2] + 0.01], [0.115 * k, 0.145 * k, 0.04 * k], 'eo', { sub: 1 }],
            ], o, [0, yaw, 0]);
          }),
        ] },
      ],
      grow: { maskTop: 1.15, maskL: 1.12, maskR: 1.12, head: 1.06 },
      hat: { part: 'maskTop', at: [T[0], T[1] + 0.165 * ST, T[2] - 0.02], scale: 1.05, tilt: -4 },
      aura: 'notes', auraColor: [1.8, 1.0, 2.6, 1],
    },
    forms: {
      // Elemental Form: a ring of eight echo masks orbits, the curtain opens on a bright starry
      // stage-void, and a fixed spotlight beams down from above
      elemental: {
        pal: { vi: '#2a1a5a', st: '#fff0b0', lr: '#e02a40', vf: '#4a2a6a', gd: '#ffe27a', eg: '#ff7af2' },
        parts: [
          { n: 'chorus', parent: 'body', p: [0, 1.4, 0], spin: { axis: 'y', speed: 0.7 }, s: [
            ...ring(8, 1.06, 0, 0, (a, x, z, i) => {
              const c = [x, 1.2 + (i % 2) * 0.34, z];
              return xf([
                ['ell', c, [0.1, 0.12, 0.05], 'ck', { glow: 1, grad: { axis: 'y', to: 'eo', a: c[1] - 0.02, b: c[1] - 0.1 }, jit: 0 }],
                ['ell', [c[0] + 0.036, c[1] + 0.012, c[2] + 0.045], [0.024, 0.014, 0.03], 'ck', { sub: 1 }],
                ['ell', [c[0] - 0.036, c[1] + 0.012, c[2] + 0.045], [0.024, 0.014, 0.03], 'ck', { sub: 1 }],
              ], c, [0, a / D2R, 0]);
            }).flat(),
          ] },
          { n: 'spot', parent: 'body', p: [0, 2.8, 0.1], s: [
            ['cyl', [0, 2.9, 0.0], [0, 2.74, 0.1], 0.09, 'sp'],
            ['cyl', [0, 2.76, 0.09], [0, 2.72, 0.115], 0.07, 'sl', { glow: 3, jit: 0 }],
            ['tor', [0, 2.84, 0.05], 0.1, 0.018, 'gd', { rot: [30, 0, 0], jit: 0 }],
            // fixed beam: four glowing edge-rays fanning down around the top mask
            ...[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => ['cap', [sx * 0.04, 2.72, 0.11 + sz * 0.02], [sx * 0.46, 1.3, 0.25 + sz * 0.22], 0.012, 0.02, 'sl', { glow: 2, jit: 0 }]),
          ] },
        ],
        eyes: { cmap: { k: '#1e1a2a', e: { c: '#ff7af2', glow: 2 } } },
        fx: [
          { part: 'spot', at: [0, 2.45, 0.2], type: 'glow', rate: 1.5, scale: 1.2, color: '#fff0b0' },
          { part: 'chorus', at: [1.06, 1.4, 0], type: 'note', rate: 1.2, scale: 0.8, color: '#5ff4ff' },
          { part: 'body', at: [0, 0.6, 0.2], type: 'star', rate: 0.8, scale: 0.6, color: '#fff0b0' },
        ],
        anim: { hover: 0.1 },
      },
    },
  };
}
LORE.bohemoth = {
  name: 'Bohemoth', element: 'echo', element2: 'ecto', stage: 3, height: '2.4 m',
  desc: 'A stage curtain that learned to sing. Four masks float around its void, and each one carries a different voice, from a whisper-high falsetto to a bass that rattles the stadium seats. When all four sing at once, the echo keeps going long after the song ends.',
  personality: 'Dramatic, moody and grand; switches from tender ballad to thunder without warning.',
  look: 'Towering dark velvet curtain-mantle with a red lining, a gold valance, gold tie-back ropes and a canopy finial, parted in front on a starry void; two huge cloaked arms with porcelain hands; four original gilded porcelain opera masks in a diamond (serene falsetto on top, heroic tenor, smirking baritone, heavy-jowled bass), always lit from above.',
};

// ================================================================ 3. DONTSTOPMEOW
// Volto speed cat, "Don't Stop Me Now": a jet-black cheetah-proportioned house cat (small head, big
// ears, deep chest, thin waist, long legs) with white concentric op-art ring targets on both flanks,
// lightning-bolt tear marks, crackling whiskers, a royal-violet collar with a crown-gold tag, and a
// very long tail ending in a glowing comet tuft. Always grinning; it never stops.
{
  // concentric ring target painted through both flanks (x axis), centred at (y, z)
  const target = (y, z, r) => [
    ['cyl', [0, y, z], [0.4, y, z], r, 'wr', { paint: 1, m: 1, jit: 0 }],
    ['cyl', [0, y, z], [0.4, y, z], r * 0.74, 'f0', { paint: 1, m: 1, jit: 0 }],
    ['cyl', [0, y, z], [0.4, y, z], r * 0.5, 'wr', { paint: 1, m: 1, jit: 0 }],
    ['cyl', [0, y, z], [0.4, y, z], r * 0.25, 'f0', { paint: 1, m: 1, jit: 0 }],
  ];
  const FUR = { top: 'f2', topT: 0.62, jit: 0.03 };
  DESIGNS.dontstopmeow = {
    id: 'dontstopmeow', vs: 0.024, arch: 'quad',
    pal: {
      f0: '#14121c', f1: '#24202e', f2: '#3a364a', f3: '#6a6680', wr: '#f4f2ee', y: '#ffe23a', yw: '#fffbe0',
      nz: '#ff8fa8', cv: '#5a2a8a', gd: '#ffcf3a', in: '#3a2a3a',
    },
    anim: { quirk: ['hop', 'stretch', 'spin', 'shakeoff', 'happy'], bounce: 1.6, gait: 1.25, stride: 1.25, tail: 1.3, maxSpeed: 7.5, dodgeSpin: 1 },
    parts: [
      { n: 'body', p: [0, 0.62, 0], s: [
        // deep chest → thin waist → lean haunch
        ['ell', [0, 0.65, 0.19], [0.14, 0.17, 0.18], 'f1', { ...FUR }],
        ['cap', [0, 0.68, 0.12], [0, 0.67, -0.24], 0.13, 0.11, 'f1', { blend: 0.08, ...FUR }],
        ['ell', [0, 0.68, -0.3], [0.13, 0.14, 0.15], 'f1', { blend: 0.07, ...FUR }],
        ['ell', [0, 0.56, 0.21], [0.1, 0.085, 0.11], 'f0', { blend: 0.05 }],
        ...target(0.67, -0.08, 0.165),
        // royal-violet collar with a crown-gold tag
        ['tor', [0, 0.86, 0.33], 0.085, 0.024, 'cv', { rot: [-38, 0, 0], jit: 0 }],
        ['cyl', [0, 0.79, 0.43], [0, 0.79, 0.45], 0.032, 'gd', { jit: 0 }],
        ['sph', [0, 0.79, 0.455], 0.012, 'yw', { glow: 1, jit: 0 }],
      ] },
      { n: 'neck', parent: 'body', p: [0, 0.82, 0.3], s: [
        ['cap', [0, 0.78, 0.27], [0, 0.92, 0.4], 0.085, 0.07, 'f1', { ...FUR }],
      ] },
      { n: 'head', parent: 'neck', p: [0, 0.93, 0.42], s: [
        ['ell', [0, 0.985, 0.45], [0.142, 0.125, 0.128], 'f1', { ...FUR }],
        ['ell', [0, 0.93, 0.55], [0.08, 0.06, 0.065], 'f1', { blend: 0.04, ...FUR }],
        ['ell', [0.1, 0.925, 0.49], [0.06, 0.05, 0.055], 'f1', { m: 1, blend: 0.03 }],
        ['sph', [0, 0.96, 0.612], 0.02, 'nz', { jit: 0 }],
        // crackling whiskers
        ...[-1, 1].flatMap((sy) => [['cap', [0.07, 0.928 + sy * 0.014, 0.57], [0.21, 0.94 + sy * 0.045, 0.57], 0.012, 0.008, 'y', { m: 1, glow: 1, jit: 0 }]]),
      ] },
      { n: 'earL', parent: 'head', p: [0.075, 1.06, 0.44], mirror: true, s: [
        ['cap', [0.075, 1.05, 0.44], [0.14, 1.25, 0.42], 0.072, 0.014, 'f1', { jit: 0.03 }],
        ['cap', [0.082, 1.06, 0.475], [0.136, 1.21, 0.448], 0.042, 0.009, 'in', { jit: 0 }],
        ['sph', [0.141, 1.25, 0.42], 0.018, 'y', { glow: 1, jit: 0 }],
      ] },
      { n: 'legFL', parent: 'body', p: [0.075, 0.58, 0.24], mirror: true, s: [
        ['cap', [0.075, 0.6, 0.24], [0.09, 0.3, 0.26], 0.066, 0.046, 'f1', { ...FUR }],
        ['cap', [0.09, 0.3, 0.26], [0.09, 0.05, 0.28], 0.046, 0.038, 'f1'],
        ['ell', [0.09, 0.038, 0.31], [0.048, 0.036, 0.064], 'f1', { top: 'f2', topT: 0.5 }],
      ] },
      { n: 'legBL', parent: 'body', p: [0.08, 0.62, -0.3], mirror: true, s: [
        ['ell', [0.085, 0.56, -0.3], [0.078, 0.14, 0.12], 'f1', { ...FUR }],
        ['cap', [0.09, 0.46, -0.33], [0.09, 0.2, -0.41], 0.055, 0.038, 'f1'],
        ['cap', [0.09, 0.2, -0.41], [0.09, 0.05, -0.35], 0.038, 0.036, 'f1'],
        ['ell', [0.09, 0.038, -0.32], [0.048, 0.036, 0.064], 'f1', { top: 'f2', topT: 0.5 }],
      ] },
      // very long tail curving up into a comet tuft
      { n: 'tail', parent: 'body', p: [0, 0.74, -0.42], s: [
        ['cap', [0, 0.74, -0.42], [0, 0.78, -0.64], 0.045, 0.04, 'f1', { ...FUR }],
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 0.78, -0.64], s: [
        ['cap', [0, 0.78, -0.64], [0, 0.9, -0.82], 0.04, 0.035, 'f1', { ...FUR }],
      ] },
      { n: 'tail3', parent: 'tail2', p: [0, 0.9, -0.82], s: [
        ['cap', [0, 0.9, -0.82], [0, 1.08, -0.9], 0.035, 0.032, 'f1', { ...FUR }],
      ] },
      { n: 'tail4', parent: 'tail3', p: [0, 1.08, -0.9], s: [
        ['cap', [0, 1.08, -0.9], [0, 1.2, -0.86], 0.032, 0.04, 'f1'],
        // comet tuft: a white-hot head with a flame-like tail streaming back
        ['sph', [0, 1.25, -0.84], 0.072, 'y', { glow: 2, jit: 0 }],
        ['sph', [0, 1.26, -0.82], 0.045, 'yw', { glow: 3, jit: 0 }],
        ...tube(bez([0, 1.25, -0.87], [0, 1.22, -1.0], [0, 1.1, -1.12], 4), 0.06, 0.012, 'y', { glow: 2, jit: 0 }),
        ...tube(bez([0, 1.29, -0.88], [0, 1.33, -1.0], [0, 1.28, -1.1], 3), 0.035, 0.01, 'y', { glow: 2, jit: 0 }),
      ] },
    ],
    eyes: {
      part: 'head', at: [0.06, 1.0, 0.56], dir: [0.42, 0.08, 1], iris: '#5ff4ff', px: 0.66,
      rows: ['.kkkk.', 'kiiwik', 'kiwwwk', 'kiiwik', '.kiik.'], cmap: { i: { c: '#5ff4ff', glow: 1 } },
    },
    mouth: {
      part: 'head', at: [0, 0.912, 0.6], dir: [0, -0.25, 1], px: 0.6,
      rows: { closed: ['kkkkkkkk', 'kwrrrrwk', '.krttrk.', '..kkkk..'], open: ['kkkkkkkk', 'kwrrrrwk', 'krrttrrk', '.krttrk.', '..kkkk..'] },
    },
    decals: [
      // lightning-bolt tear marks (the cheetah tear-line)
      { part: 'head', at: [0.068, 0.945, 0.565], dir: [0.45, -0.1, 1], px: 0.5, mirror: true, rows: ['y..', 'yy.', '.y.', '.yy', '..y'], cmap: { y: { c: '#ffe23a', glow: 2 } } },
    ],
    fx: [
      { part: 'tail4', at: [0, 1.25, -0.86], type: 'spark', rate: 1.6, scale: 0.8, color: '#ffe23a' },
      { part: 'head', at: [0.18, 0.94, 0.56], type: 'spark', rate: 0.5, scale: 0.4, mirror: true, color: '#fffbe0' },
    ],
    bond: {
      // the charge builds: a crackling bolt crest rises along its spine, the comet tuft and ears swell
      parts: [
        { n: 'crest', parent: 'body', p: [0, 0.86, 0], sway: { axis: 'x', amp: 0.05, freq: 6 }, s: [
          ...[[0.2, 0.06], [0.04, 0.08], [-0.12, 0.07], [-0.27, 0.06]].map(([z, h], i) => ['poly', [0, 0.84 - i * 0.012, z], [[-0.05, 0], [0.04, 0], [0.0, h * 0.55], [0.035, h * 0.5], [-0.03, h * 1.6], [-0.005, h * 0.75], [-0.04, h * 0.8]], 0.016, 'y', { plane: 'zy', glow: 2, jit: 0 }]),
        ] },
      ],
      grow: { tail4: 1.5, earL: 1.12, earR: 1.12 },
      hat: { part: 'head', at: [0, 1.1, 0.43], scale: 0.8, tilt: -8 },
      aura: 'sparks', auraColor: [2.6, 2.3, 0.6, 1],
    },
    forms: {
      // Elemental Form: the flank rings lift off as spinning lightning gears, the fur's edges run
      // white-hot, and a lightning afterimage streaks one step behind it
      elemental: {
        pal: { f2: '#d8d0ff', f3: '#ffffff', in: '#ffe23a', cv: '#7a2aa8' },
        parts: [
          { n: 'gearL', parent: 'body', p: [0.3, 0.68, -0.08], mirror: true, spin: { axis: 'x', speed: 9 }, s: [
            ['tor', [0.3, 0.68, -0.08], 0.17, 0.02, 'y', { axis: 'x', glow: 2, jit: 0 }],
            ['tor', [0.3, 0.68, -0.08], 0.1, 0.018, 'yw', { axis: 'x', glow: 2, jit: 0 }],
            ...[0, 1, 2, 3, 4, 5].map((i) => { const a = i * Math.PI / 3; return ['cap', [0.3, 0.68 + Math.sin(a) * 0.1, -0.08 + Math.cos(a) * 0.1], [0.3, 0.68 + Math.sin(a + 0.4) * 0.21, -0.08 + Math.cos(a + 0.4) * 0.21], 0.016, 0.008, 'y', { glow: 2, jit: 0 }]; }),
          ] },
          { n: 'afterimage', parent: 'body', p: [0, 0.7, -0.4], sway: { axis: 'y', amp: 0.06, freq: 5 }, s: [
            ...[[0.95, 0.05], [0.78, -0.02], [0.62, 0.04], [0.42, -0.03], [0.22, 0.02]].map(([y, dz], i) => ['cap', [0, y, -0.2 + dz], [0, y + (i % 2 ? 0.03 : -0.03), -0.62 - i * 0.04 + dz], 0.022, 0.006, 'yw', { glow: 2, jit: 0 }]),
            ['ell', [0, 0.7, -0.6], [0.09, 0.13, 0.08], 'y', { glow: 1, jit: 0, dither: { col: 'yw', amt: 0.4 } }],
          ] },
        ],
        eyes: { cmap: { i: { c: '#ffffff', glow: 2 } }, iris: '#ffffff' },
        fx: [
          { part: 'gearL', at: [0.3, 0.85, -0.08], type: 'spark', rate: 2, scale: 0.7, mirror: true, color: '#ffe23a' },
          { part: 'body', at: [0, 0.5, -0.5], type: 'spark', rate: 2.5, scale: 0.9, color: '#fffbe0' },
        ],
        anim: { maxSpeed: 9 },
      },
    },
  };
}
LORE.dontstopmeow = {
  name: 'Dontstopmeow', element: 'volto', stage: 3, height: '1.1 m (2.4 m with tail)',
  desc: 'It starts every race at a stroll and finishes it as a streak of lightning. The longer it runs the faster it gets, and its trainer has never once seen it stop to rest. The rings on its flanks hum louder with every lap.',
  personality: 'Joyful, restless and unstoppable; grins through every fight like it is having the time of its life.',
  look: 'Lean jet-black cheetah-cat with big ears, a deep chest, a thin waist and long legs, white concentric ring targets on both flanks, yellow lightning-bolt tear marks, crackling yellow whiskers, bright cyan star-glint eyes, a huge fanged grin, a royal-violet collar with a gold tag and a very long tail ending in a glowing comet tuft.',
};

// ================================================================ 4. RADIOGAGA
// Echo/Volto radio robot, "Radio Ga Ga": an upright Art Deco chrome robot whose head is a walnut
// cathedral-arch radio cabinet. The fretwork grille is its mouth (it glows when it speaks), one big
// glowing tuning dial is its eye (the needle shows its mood: happy right, sad left) next to a
// smaller knob eye, and a telescopic antenna breaks the outline. Stepped Deco shoulders, a violet
// chevron chest plate with a gold sunburst, segmented ring limbs, big chrome hands made for the
// overhead double-clap.
{
  // dial-eye needle expressions (9×9; k ticks/hub, r needle)
  const TICKS = '.k..k..k.';
  const dial = (needle) => {
    const g = Array.from({ length: 9 }, () => Array(9).fill('.'));
    for (let i = 0; i < 9; i++) if (TICKS[i] === 'k') g[0][i] = 'k';
    g[1][0] = 'k'; g[1][8] = 'k';
    for (const [r, c] of needle) g[r][c] = 'r';
    if (g[5][4] === '.') g[5][4] = 'k';
    return g.map((row) => row.join(''));
  };
  const DIAL = {
    normal: dial([[2, 4], [3, 4], [4, 4]]),
    happy: dial([[2, 7], [3, 6], [4, 5]]),
    sad: dial([[2, 1], [3, 2], [4, 3]]),
    closed: dial([[5, 1], [5, 2], [5, 3]]),
    angry: dial([[3, 7], [4, 6], [4, 5]]),
    hurt: dial([[6, 5], [7, 6], [3, 3], [2, 2]]),
    ko: dial([[3, 3], [3, 5], [4, 4], [5, 3], [5, 5]]),
  };
  // fretwork grille (mouth): gothic tracery; open = the gaps glow with sound
  const FRET = [
    '....ffffffff....',
    '..ff..f..f..ff..',
    '.f....f..f....f.',
    'f..f..f..f..f..f',
    'f..f..f..f..f..f',
    'f..f..f..f..f..f',
    'f..f..f..f..f..f',
    'ffffffffffffffff',
  ];
  const FRET_OPEN = FRET.map((row, r) => row.split('').map((ch, c) => {
    if (ch !== '.') return ch;
    const inside = r === 0 ? false : r === 1 ? c >= 3 && c <= 12 : r === 2 ? c >= 2 && c <= 13 : true;
    return inside ? 'o' : '.';
  }).join(''));
  // Deco sunburst for the chest plate
  const SUN = pix(15, 8, (x, y, r, a) => {
    const yy = (y + 1) * 0.5 * 1.0, rr = Math.hypot(x, yy * 1.9);
    if (yy < 0.02) return 'g';
    if (rr < 0.42) return 'g';
    const ang = Math.atan2(yy, x) / Math.PI * 9;
    return Math.abs(ang - Math.round(ang)) < 0.2 && rr < 1.15 ? 'g' : '.';
  });
  const CH = { jit: 0.02 };
  // gothic (cathedral) arch outline: straight sides of height hs, pointed arch of height h
  const gothic = (hw, hs, h, n = 8) => {
    const c = (hw * hw - h * h) / (2 * hw), r = hw - c, a1 = Math.atan2(h, -c); // right-hand arc centre (c, hs)
    const pts = [[-hw, 0], [hw, 0]];
    for (let i = 0; i <= n; i++) { const t = a1 * (i / n); pts.push([c + Math.cos(t) * r, hs + Math.sin(t) * r]); }
    for (let i = n - 1; i >= 0; i--) { const t = a1 * (i / n); pts.push([-(c + Math.cos(t) * r), hs + Math.sin(t) * r]); }
    return pts;
  };
  const HB = 1.15; // head base height
  DESIGNS.radiogaga = {
    id: 'radiogaga', vs: 0.028, arch: 'biped',
    pal: {
      w0: '#3a1e14', w1: '#6e4128', w2: '#a8693e', w3: '#d8985a', gc: '#e8d8b0', gd2: '#a89870', fw: '#4a2a1a',
      c0: '#bcc8d6', c1: '#7a869a', c2: '#5a6470', cw: '#eef4fa', br: '#d8a03a', dg: '#ffe8a0', nd: '#d8283a',
      gd: '#ffcf3a', rv: '#5a2a8a', bk: '#1e1418', ko: '#ffe23a',
    },
    anim: { quirk: ['nod', 'sway', 'cheer', 'shrug'], bounce: 0.9, gait: 0.9, maxSpeed: 3.2 },
    parts: [
      { n: 'body', p: [0, 0.8, 0], s: [
        // Deco chest with stepped (ziggurat) shoulders
        ['box', [0, 0.93, 0], [0.21, 0.14, 0.125], 'c0', { round: 0.04, ...CH, top: 'cw', topT: 0.7 }],
        ['box', [0.22, 1.0, 0], [0.08, 0.06, 0.105], 'c0', { m: 1, round: 0.02, ...CH, top: 'cw', topT: 0.7 }],
        ['box', [0.285, 0.97, 0], [0.055, 0.05, 0.095], 'c1', { m: 1, round: 0.015, ...CH }],
        ['box', [0, 1.07, 0], [0.14, 0.02, 0.105], 'br', { round: 0.01, jit: 0 }],
        // violet chevron plate on a brass backing (sunburst decal on top)
        ['poly', [0, 0.95, 0.11], [[-0.19, 0.09], [0.19, 0.09], [0.14, -0.05], [0, -0.17], [-0.14, -0.05]], 0.025, 'br', { jit: 0 }],
        ['poly', [0, 0.955, 0.122], [[-0.165, 0.07], [0.165, 0.07], [0.12, -0.045], [0, -0.14], [-0.12, -0.045]], 0.025, 'rv', { jit: 0 }],
        // segmented waist + hips
        ['cyl', [0, 0.8, 0], [0, 0.7, 0], 0.09, 'c1', CH],
        ['tor', [0, 0.775, 0], 0.09, 0.022, 'c0', CH],
        ['tor', [0, 0.725, 0], 0.09, 0.022, 'c0', CH],
        ['box', [0, 0.66, 0], [0.14, 0.05, 0.1], 'c0', { round: 0.03, ...CH, top: 'cw', topT: 0.7 }],
        ['box', [0, 0.66, 0.095], [0.06, 0.035, 0.012], 'br', { round: 0.01, jit: 0 }],
      ] },
      { n: 'neck', parent: 'body', p: [0, 1.07, 0], s: [
        ['cyl', [0, 1.06, 0], [0, 1.13, 0], 0.06, 'c1', CH],
        ['tor', [0, 1.1, 0], 0.06, 0.016, 'br', { jit: 0 }],
      ] },
      { n: 'head', parent: 'neck', p: [0, 1.14, 0], s: [
        // walnut cathedral-arch cabinet on a dark plinth, brass rim behind the outline
        ['poly', [0, HB + 0.02, -0.03], gothic(0.248, 0.24, 0.285), 0.07, 'br', { jit: 0 }],
        ['poly', [0, HB + 0.02, 0.0], gothic(0.235, 0.24, 0.27), 0.13, 'w1', { top: 'w2', topT: 0.6, jit: 0.03 }],
        ['box', [0, HB + 0.01, 0], [0.26, 0.025, 0.15], 'w0', { round: 0.012, jit: 0.03 }],
        ['cap', [0, HB + 0.56, -0.01], [0, HB + 0.64, -0.01], 0.03, 0.008, 'br', { jit: 0 }],
        // recessed burl face panel
        ['poly', [0, HB + 0.06, 0.14], gothic(0.19, 0.2, 0.22), 0.022, 'w1', { sub: 1 }],
        ['poly', [0, HB + 0.06, 0.112], gothic(0.19, 0.2, 0.22), 0.012, 'w2', { paint: 1, jit: 0.03 }],
        // recessed grille (mouth) with glowing cream cloth
        ['box', [0, HB + 0.125, 0.12], [0.135, 0.06, 0.03], 'w1', { sub: 1 }],
        ['box', [0, HB + 0.125, 0.09], [0.135, 0.06, 0.012], 'gc', { paint: 1, glow: 1, jit: 0 }],
        // tuning-dial eye: brass bezel around a glowing dial face
        ['tor', [-0.08, HB + 0.33, 0.112], 0.075, 0.02, 'br', { axis: 'z', jit: 0 }],
        ['cyl', [-0.08, HB + 0.33, 0.09], [-0.08, HB + 0.33, 0.11], 0.068, 'dg', { glow: 1, jit: 0 }],
        // smaller knob eye: bakelite knob with a brass ring and a glowing pointer
        ['cyl', [0.1, HB + 0.33, 0.09], [0.1, HB + 0.33, 0.145], 0.046, 'bk', { jit: 0 }],
        ['tor', [0.1, HB + 0.33, 0.12], 0.047, 0.012, 'br', { axis: 'z', jit: 0 }],
        ['sph', [0.1, HB + 0.35, 0.148], 0.012, 'dg', { glow: 2, jit: 0 }],
        // side knobs
        ['cyl', [0.23, HB + 0.18, 0.02], [0.27, HB + 0.18, 0.02], 0.036, 'bk', { m: 1, jit: 0 }],
      ] },
      { n: 'antL', parent: 'head', p: [0.12, HB + 0.42, -0.02], s: [
        ['cyl', [0.12, HB + 0.4, -0.02], [0.15, HB + 0.55, -0.03], 0.028, 'c0', CH],
        ['cyl', [0.15, HB + 0.55, -0.03], [0.18, HB + 0.68, -0.04], 0.021, 'c0', CH],
        ['cyl', [0.18, HB + 0.68, -0.04], [0.205, HB + 0.8, -0.05], 0.016, 'c1', CH],
        ['sph', [0.207, HB + 0.81, -0.05], 0.036, 'nd', { glow: 1, jit: 0 }],
      ] },
      { n: 'armL', parent: 'body', p: [0.3, 0.98, 0], mirror: true, s: [
        ['cyl', [0.3, 0.98, 0], [0.33, 0.77, 0.01], 0.05, 'c0', CH],
        ...[0.92, 0.86, 0.8].map((y) => ['tor', [0.3 + (0.98 - y) * 0.14, y, 0.005], 0.051, 0.016, 'c1', CH]),
        ['sph', [0.33, 0.76, 0.01], 0.058, 'br', { jit: 0 }],
        ['cyl', [0.33, 0.76, 0.01], [0.34, 0.57, 0.03], 0.048, 'c0', CH],
        ...[0.7, 0.64].map((y) => ['tor', [0.335, y, 0.02], 0.049, 0.016, 'c1', CH]),
        // big chrome clapping hand
        ['cyl', [0.34, 0.58, 0.03], [0.342, 0.545, 0.03], 0.058, 'br', { jit: 0 }],
        ['ell', [0.35, 0.45, 0.035], [0.06, 0.11, 0.088], 'cw', { ...CH }],
        ['cap', [0.35, 0.48, 0.11], [0.34, 0.42, 0.16], 0.03, 0.024, 'cw', CH],
        ['box', [0.326, 0.41, 0.035], [0.014, 0.07, 0.08], 'c1', { paint: 1, jit: 0 }],
      ] },
      { n: 'legL', parent: 'body', p: [0.09, 0.62, 0], mirror: true, s: [
        ['cyl', [0.09, 0.63, 0], [0.095, 0.36, 0.0], 0.062, 'c0', CH],
        ...[0.56, 0.49, 0.42].map((y) => ['tor', [0.092, y, 0], 0.063, 0.017, 'c1', CH]),
        ['sph', [0.095, 0.35, 0.0], 0.068, 'br', { jit: 0 }],
        ['cyl', [0.095, 0.35, 0], [0.095, 0.1, 0.0], 0.056, 'c0', CH],
        ...[0.27, 0.2].map((y) => ['tor', [0.095, y, 0], 0.057, 0.016, 'c1', CH]),
        // stepped Deco foot
        ['box', [0.09, 0.035, 0.03], [0.075, 0.035, 0.115], 'c1', { round: 0.015, ...CH }],
        ['box', [0.09, 0.085, 0.0], [0.06, 0.02, 0.085], 'c0', { round: 0.01, ...CH }],
      ] },
    ],
    eyes: {
      part: 'head', at: [-0.08, HB + 0.33, 0.116], dir: [0, 0, 1], px: 0.54, mirror: false,
      rows: DIAL.normal, variants: DIAL, cmap: { k: '#3a1e14', r: '#d8283a' },
    },
    mouth: {
      part: 'head', at: [0, HB + 0.125, 0.1], dir: [0, 0, 1], px: 0.6,
      rows: { closed: FRET, open: FRET_OPEN }, cmap: { f: '#4a2a1a', o: { c: '#fff2c0', glow: 2 } },
    },
    decals: [
      { part: 'body', at: [0, 0.97, 0.15], dir: [0, 0, 1], px: 0.66, rows: SUN, cmap: { g: { c: '#ffcf3a', glow: 1 } } },
    ],
    fx: [
      { part: 'antL', at: [0.207, HB + 0.83, -0.05], type: 'spark', rate: 0.8, scale: 0.6, color: '#ffe23a' },
      { part: 'head', at: [0, HB + 0.13, 0.16], type: 'note', rate: 0.25, scale: 0.6, color: '#b26bff' },
    ],
    bond: {
      // "Broadcast": the antenna telescopes out and radio-wave rings pulse around its tip
      parts: [
        { n: 'waves', parent: 'antL', p: [0.207, HB + 0.81, -0.05], spin: { axis: 'y', speed: 2.2 }, s: [
          ['tor', [0.207, HB + 0.81, -0.05], 0.09, 0.012, 'ko', { glow: 2, jit: 0 }],
          ['tor', [0.207, HB + 0.79, -0.05], 0.16, 0.012, 'ev', { glow: 2, jit: 0, rot: [12, 0, 0] }],
          ['tor', [0.207, HB + 0.77, -0.05], 0.23, 0.012, 'ko', { glow: 1, jit: 0, rot: [-10, 0, 0] }],
        ] },
      ],
      grow: { antL: 1.35, armL: 1.08, armR: 1.08 },
      hat: { part: 'head', at: [0, HB + 0.5, 0], scale: 1.0, tilt: -4 },
      aura: 'notes', auraColor: [2.4, 2.0, 0.8, 1],
    },
    forms: {
      // Elemental Form: skyscraper-stepped shoulder towers, a sunburst halo of radio towers, the
      // antenna crowned as a broadcast tower with orbiting signal rings, the grille blazing white-gold
      elemental: {
        pal: { gc: '#fff6d8', dg: '#fffbe8', rv: '#6a2aa8', c1: '#9aa6c0' },
        parts: [
          { n: 'towers', parent: 'body', p: [0, 1.0, 0], s: [
            ...[1, -1].flatMap((sx) => [
              ['box', [sx * 0.24, 1.09, -0.01], [0.06, 0.06, 0.07], 'c0', { round: 0.01, jit: 0.02 }],
              ['box', [sx * 0.24, 1.19, -0.01], [0.045, 0.05, 0.055], 'c0', { round: 0.01, jit: 0.02 }],
              ['box', [sx * 0.24, 1.27, -0.01], [0.03, 0.035, 0.04], 'c1', { round: 0.008, jit: 0.02 }],
              ['cap', [sx * 0.24, 1.3, -0.01], [sx * 0.24, 1.42, -0.01], 0.012, 0.005, 'br', { jit: 0 }],
              ['sph', [sx * 0.24, 1.43, -0.01], 0.016, 'nd', { glow: 2, jit: 0 }],
              // lit windows
              ...[1.07, 1.11, 1.18, 1.22].map((y) => ['box', [sx * 0.24, y, 0.055 - (y > 1.15 ? 0.015 : 0)], [0.03, 0.008, 0.01], 'dg', { paint: 1, glow: 2, jit: 0 }]),
            ]),
          ] },
          { n: 'halo', parent: 'head', p: [0, 1.36, -0.16], s: [
            ...Array.from({ length: 9 }, (_, i) => {
              const a = (-80 + i * 20) * D2R, x = Math.sin(a), y = Math.cos(a);
              return [
                ['cap', [x * 0.24, 1.36 + y * 0.24, -0.17], [x * 0.46, 1.36 + y * 0.46, -0.17], 0.016, 0.008, 'gd', { glow: 1, jit: 0 }],
                ['sph', [x * 0.48, 1.36 + y * 0.48, -0.17], 0.022, 'ko', { glow: 2, jit: 0 }],
              ];
            }).flat(),
            ['tor', [0, 1.36, -0.17], 0.25, 0.014, 'gd', { axis: 'z', glow: 1, jit: 0 }],
          ] },
          { n: 'signal', parent: 'antL', p: [0.207, HB + 0.83, -0.05], spin: { axis: 'y', speed: -1.8 }, s: [
            ['cap', [0.207, HB + 0.83, -0.05], [0.207, HB + 0.96, -0.05], 0.03, 0.006, 'br', { jit: 0 }],
            ...[HB + 0.84, HB + 0.89].map((y, i) => ['tor', [0.207, y, -0.05], 0.06 + i * 0.03, 0.01, 'br', { jit: 0 }]),
            ['tor', [0.207, HB + 0.88, -0.05], 0.2, 0.013, 'ev', { glow: 2, jit: 0, rot: [20, 0, 10] }],
            ['tor', [0.207, HB + 0.88, -0.05], 0.28, 0.013, 'ko', { glow: 2, jit: 0, rot: [-15, 0, -20] }],
          ] },
        ],
        fx: [
          { part: 'signal', at: [0.207, HB + 0.96, -0.05], type: 'spark', rate: 2, scale: 0.8, color: '#ffe23a' },
          { part: 'halo', at: [0, 1.84, -0.17], type: 'note', rate: 1.0, scale: 0.8, color: '#b26bff' },
        ],
      },
    },
  };
  DESIGNS.radiogaga.pal.ev = '#b26bff';
}
LORE.radiogaga = {
  name: 'Radiogaga', element: 'echo', element2: 'volto', stage: 3, height: '1.6 m (1.9 m with antenna)',
  desc: 'Built from a forgotten 1930s radio and the chrome of a dozen Art Deco elevators, it still picks up stations nobody else can hear. When it raises its hands for the double-clap, the whole stadium claps with it, right on the beat.',
  personality: 'Warm, nostalgic and gently sentimental; its dial needle droops when the music stops.',
  look: 'Upright Art Deco chrome robot with stepped shoulders, ringed segmented limbs and big chrome hands; its head is a walnut cathedral-arch radio cabinet with a fretwork-grille mouth, a glowing tuning-dial eye with a red needle, a smaller knob eye and a telescopic antenna; a violet chevron chest plate with a gold sunburst.',
};

// ================================================================ 5. BITESDUST
// Geo, "Another One Bites the Dust": a low, long, laid-back sand lizard / armadillo of packed dust
// and sandstone plates, strung like a bass: four taut metal strings run from a nut on its brow over
// its back (the plate seams are the frets) to a tuning-peg headstock at the tail tip. Its throat is
// a woofer cone that puffs dust rings on the beat. Half-lidded cool eyes, a sly smile.
{
  const SX = [-0.075, -0.025, 0.025, 0.075]; // string x positions
  const SR = 0.011;
  const strings = (a, b) => SX.map((x) => ['cyl', [x, a[1], a[2]], [x, b[1], b[2]], SR, 'sw', { glow: 1, jit: 0 }]);
  const PLATE = { top: 'pl', topT: 0.35, stripes: { axis: 'z', p: 0.1, w: 0.018, col: 'pd', o: 0.02 }, jit: 0.04 };
  const HS = [0, 0.5, -1.38]; // headstock centre at the tail tip
  DESIGNS.bitesdust = {
    id: 'bitesdust', vs: 0.025, arch: 'quad',
    pal: {
      d0: '#5a3a3a', d1: '#7a5a5a', d2: '#c8a87a', d3: '#f0d8b0', d4: '#fff2d8',
      pl: '#a87a5a', pll: '#d8a87a', pd: '#6a4a3a', sw: '#e4ecf4', wc: '#2a2a36', wl: '#4a4a5a', dc: '#1a1420', su: '#3a3a46',
      gd: '#ffcf3a', rv: '#5a2a8a', ck: '#e8a088',
    },
    anim: { quirk: ['nod', 'headbang', 'sway', 'shakeoff'], bounce: 0.8, gait: 0.85, stride: 0.9, tail: 0.8, maxSpeed: 3.4 },
    parts: [
      { n: 'body', p: [0, 0.4, 0], s: [
        // long low armoured body with a raised chest
        ['ell', [0, 0.4, -0.08], [0.25, 0.2, 0.42], 'd2', { ...PLATE, belly: 'd3', bellyT: 0.4 }],
        ['ell', [0, 0.44, 0.24], [0.22, 0.22, 0.2], 'd2', { blend: 0.1, ...PLATE, belly: 'd3', bellyT: 0.4 }],
        // shoulder & hip plate ridges
        ['ell', [0.17, 0.5, 0.2], [0.09, 0.09, 0.12], 'pl', { m: 1, blend: 0.04, top: 'pll', topT: 0.6, jit: 0.04 }],
        ['ell', [0.18, 0.47, -0.36], [0.1, 0.1, 0.13], 'pl', { m: 1, blend: 0.04, top: 'pll', topT: 0.6, jit: 0.04 }],
        // the bridge on the hips, the strings over the back
        ['box', [0, 0.62, -0.36], [0.1, 0.03, 0.025], 'pd', { round: 0.01, jit: 0 }],
        ['box', [0, 0.65, -0.36], [0.095, 0.008, 0.012], 'gd', { jit: 0 }],
        ...strings([0, 0.66, 0.34], [0, 0.66, -0.36]),
        // woofer throat: surround, cone, dust cap
        ['cap', [0, 0.36, 0.3], [0, 0.32, 0.47], 0.02, 0.135, 'd2', { sub: 1 }],
        ['tor', [0, 0.33, 0.41], 0.125, 0.026, 'su', { rot: [76, 0, 0], jit: 0 }],
        ['cap', [0, 0.36, 0.3], [0, 0.32, 0.47], 0.03, 0.15, 'wc', { paint: 1, jit: 0 }],
        ['tor', [0, 0.345, 0.37], 0.07, 0.008, 'wl', { rot: [76, 0, 0], paint: 1, fat: 0.01, jit: 0 }],
        ['sph', [0, 0.345, 0.355], 0.045, 'dc', { jit: 0 }],
      ] },
      { n: 'head', parent: 'body', p: [0, 0.55, 0.4], s: [
        ['ell', [0, 0.6, 0.55], [0.155, 0.11, 0.17], 'd2', { belly: 'd3', bellyT: 0.35 }],
        ['ell', [0, 0.56, 0.7], [0.11, 0.072, 0.09], 'd2', { blend: 0.05, belly: 'd3', bellyT: 0.35 }],
        ['ell', [0.12, 0.57, 0.52], [0.06, 0.06, 0.07], 'd2', { m: 1, blend: 0.04 }],
        // sandstone head plate (shades go here) + the nut where the strings start
        ['ell', [0, 0.665, 0.52], [0.13, 0.05, 0.14], 'pl', { top: 'pll', topT: 0.6, jit: 0.04 }],
        ['box', [0, 0.68, 0.43], [0.1, 0.022, 0.018], 'd4', { round: 0.008, jit: 0 }],
        ...strings([0, 0.665, 0.42], [0, 0.665, 0.34]),
        // nostrils
        ['sph', [0.035, 0.6, 0.78], 0.012, 'd0', { m: 1, jit: 0 }],
      ] },
      { n: 'legFL', parent: 'body', p: [0.17, 0.36, 0.22], mirror: true, s: [
        ['cap', [0.17, 0.38, 0.22], [0.21, 0.08, 0.27], 0.075, 0.06, 'd2', { top: 'pl', topT: 0.6 }],
        ['ell', [0.215, 0.04, 0.31], [0.07, 0.04, 0.08], 'd2', { top: 'd3', topT: 0.5 }],
        ...[-1, 0, 1].map((i) => ['cap', [0.215 + i * 0.035, 0.03, 0.36], [0.215 + i * 0.045, 0.02, 0.4], 0.016, 0.01, 'd0', { jit: 0 }]),
      ] },
      { n: 'legBL', parent: 'body', p: [0.18, 0.36, -0.34], mirror: true, s: [
        ['cap', [0.18, 0.38, -0.34], [0.22, 0.08, -0.3], 0.085, 0.064, 'd2', { top: 'pl', topT: 0.6 }],
        ['ell', [0.225, 0.04, -0.26], [0.074, 0.04, 0.085], 'd2', { top: 'd3', topT: 0.5 }],
        ...[-1, 0, 1].map((i) => ['cap', [0.225 + i * 0.035, 0.03, -0.21], [0.225 + i * 0.045, 0.02, -0.17], 0.016, 0.01, 'd0', { jit: 0 }]),
      ] },
      // the tail is the bass neck: strings keep running to a tuning-peg headstock
      { n: 'tail', parent: 'body', p: [0, 0.42, -0.46], s: [
        ['cap', [0, 0.42, -0.46], [0, 0.4, -0.8], 0.15, 0.11, 'd2', { ...PLATE }],
        ...strings([0, 0.65, -0.37], [0, 0.53, -0.8]),
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 0.4, -0.8], s: [
        ['cap', [0, 0.4, -0.8], [0, 0.43, -1.12], 0.11, 0.075, 'd2', { ...PLATE }],
        ...strings([0, 0.53, -0.8], [0, 0.52, -1.12]),
      ] },
      { n: 'tail3', parent: 'tail2', p: [0, 0.43, -1.12], s: [
        ['cap', [0, 0.43, -1.12], [0, 0.48, -1.3], 0.075, 0.06, 'd2', { ...PLATE }],
        ...strings([0, 0.52, -1.12], [0, 0.535, -1.28]),
        // headstock: violet face, four tuning pegs with crown-gold tips
        ['box', [HS[0], HS[1], HS[2]], [0.09, 0.035, 0.11], 'pd', { round: 0.03, jit: 0.03, rot: [-12, 0, 0] }],
        ['box', [HS[0], HS[1] + 0.03, HS[2]], [0.07, 0.012, 0.085], 'rv', { round: 0.01, jit: 0, rot: [-12, 0, 0] }],
        ...[[1, -1.32], [1, -1.42], [-1, -1.32], [-1, -1.42]].flatMap(([sx, z]) => [
          ['cyl', [sx * 0.08, HS[1] + (z + 1.38) * -0.2, z], [sx * 0.15, HS[1] + (z + 1.38) * -0.2, z], 0.014, 'sw', { jit: 0 }],
          ['ell', [sx * 0.16, HS[1] + (z + 1.38) * -0.2, z], [0.014, 0.03, 0.022], 'gd', { jit: 0 }],
        ]),
      ] },
    ],
    eyes: {
      part: 'head', at: [0.085, 0.63, 0.66], dir: [0.55, 0.15, 1], iris: '#ffcf3a', px: 0.6,
      rows: ['kkkkk', 'kiiwk', '.kkk.'],
    },
    mouth: { part: 'head', at: [0.02, 0.535, 0.75], dir: [0.2, -0.3, 1], px: 0.55, rows: { closed: ['.....k', 'kkkkk.'], open: ['kkkkkk', 'krrrrk', '.kkkk.'] } },
    fx: [
      { part: 'body', at: [0, 0.3, 0.5], type: 'dust', rate: 0.7, scale: 0.8, color: '#f0d0a0' },
    ],
    bond: {
      // the groove builds: a ring of dust and pebbles circles its feet, the woofer pumps harder,
      // the strings blaze
      parts: [
        { n: 'groove', parent: 'body', p: [0, 0.08, -0.1], spin: { axis: 'y', speed: 1.4 }, s: [
          ...ring(10, 0.62, 0.08, 0, (a, x, z, i) => i % 2
            ? ['ell', [x, 0.08 + (i % 3) * 0.02, z - 0.1], [0.05, 0.04, 0.05], 'pl', { noise: 0.008, noiseScale: 0.03, jit: 0.05 }]
            : ['sph', [x, 0.07, z - 0.1], 0.065, 'd3', { noise: 0.012, noiseScale: 0.03, jit: 0.04 }]),
          ['tor', [0, 0.06, -0.1], 0.62, 0.02, 'd3', { jit: 0.05 }],
        ] },
      ],
      grow: { tail3: 1.25, head: 1.06 },
      hat: { part: 'head', at: [0, 0.68, 0.56], scale: 0.85, tilt: -6 },
      aura: 'notes', auraColor: [2.2, 1.6, 0.9, 1],
    },
    forms: {
      // Elemental Form ("Groove Monolith"): polished red-gold plates; four giant glowing strings
      // rise from the ground behind it to a floating stone headstock above its head; a ring of
      // floating stone speaker-cones pulses dust shockwaves
      elemental: {
        pal: { pl: '#c8502a', pll: '#ffb85a', pd: '#7a2a1a', sw: '#fff6d0', d2: '#d8b080', rv: '#7a2aa8' },
        parts: [
          { n: 'monolith', parent: 'body', p: [0, 0.6, -0.55], s: [
            ['box', [0, 0.04, -0.6], [0.2, 0.04, 0.09], 'pl', { round: 0.02, top: 'pll', topT: 0.6, jit: 0.04 }],
            ...SX.map((x) => ['cyl', [x * 1.6, 0.08, -0.6], [x * 1.2, 1.42, -0.2], 0.014, 'sw', { glow: 2, jit: 0 }]),
            ['box', [0, 1.5, -0.2], [0.17, 0.09, 0.05], 'pl', { round: 0.03, top: 'pll', topT: 0.6, jit: 0.04, rot: [-16, 0, 0] }],
            ['box', [0, 1.5, -0.165], [0.13, 0.065, 0.02], 'rv', { round: 0.01, jit: 0, rot: [-16, 0, 0] }],
            ...[[1, 1.47], [1, 1.55], [-1, 1.47], [-1, 1.55]].map(([sx, y]) => ['ell', [sx * 0.2, y, -0.2], [0.03, 0.02, 0.02], 'gd', { jit: 0 }]),
          ] },
          { n: 'cones', parent: 'body', p: [0, 0.75, -0.1], spin: { axis: 'y', speed: 0.6 }, s: [
            ...ring(5, 0.78, 0.75, 0.3, (a, x, z) => {
              const c = [x, 0.82, z - 0.1];
              return xf([
                ['cyl', [c[0], c[1], c[2] - 0.05], [c[0], c[1], c[2] + 0.05], 0.12, 'pl', { top: 'pll', topT: 0.6, jit: 0.04 }],
                ['cap', [c[0], c[1], c[2] - 0.02], [c[0], c[1], c[2] + 0.07], 0.02, 0.1, 'pl', { sub: 1 }],
                ['tor', [c[0], c[1], c[2] + 0.04], 0.095, 0.015, 'su', { axis: 'z', jit: 0 }],
                ['sph', [c[0], c[1], c[2] + 0.0], 0.035, 'dc', { jit: 0 }],
              ], c, [0, a / D2R, 0]);
            }).flat(),
          ] },
        ],
        eyes: { iris: '#ff8a3a' },
        fx: [
          { part: 'cones', at: [0.78, 0.82, -0.1], type: 'dust', rate: 1.5, scale: 1.0, color: '#f0d0a0' },
          { part: 'monolith', at: [0, 1.0, -0.4], type: 'spark', rate: 1.0, scale: 0.6, color: '#fff6d0' },
          { part: 'body', at: [0, 0.05, 0.2], type: 'dust', rate: 1.2, scale: 1.2, color: '#d39a5c' },
        ],
      },
    },
  };
}
LORE.bitesdust = {
  name: 'Bitesdust', element: 'geo', stage: 3, height: '0.75 m (2.0 m long with tail)',
  desc: 'It never hurries. It just finds the groove, nods its head, and lets the ground do the work. Every pluck of the strings on its back sends a shockwave through the arena floor, and by the fourth note somebody is always flat on their back in the dust.',
  personality: 'Cool, quiet and laid-back; unbothered by anything that is not on the beat.',
  look: 'Low, long sand-coloured lizard-armadillo with banded sandstone plates, four bright metal strings running from a nut on its brow over its back to a violet tuning-peg headstock with gold peg tips at the tail tip, a dark woofer-cone throat with a dust cap, short sturdy clawed legs and half-lidded gold eyes over a sly smile.',
};
