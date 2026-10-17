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
// gold valance), parted in front on a starry void; four original porcelain opera masks float in a
// diamond around it, always top-lit (bright brows, black below the cheekbones). Top = falsetto,
// left = tenor, right = baritone, bottom-front = bass (its jaw opens; it carries the expressive eyes).
{
  const MP = 'mp';
  // A porcelain mask facing +z at c, height ≈ 0.36·s. kind: 'falsetto' | 'tenor' | 'baritone' | 'bass'
  const mask = (c, s, kind, yaw = 0) => {
    const [x, y, z] = c, fz = z + 0.07 * s; // front surface depth
    const TL = { grad: { axis: 'y', to: 'ms', a: y - 0.03 * s, b: y - 0.12 * s }, jit: 0.02 };
    const sh = [
      ['ell', [x, y + 0.01 * s, z], [0.145 * s, 0.165 * s, 0.075 * s], MP, { ...TL, side: 'gd', sideT: 0.9 }],
      ['ell', [x, y - 0.1 * s, z + 0.005 * s], [0.1 * s, 0.085 * s, 0.065 * s], MP, { blend: 0.05 * s, ...TL }],
      // black fall-off below the cheekbones (the top-light chiaroscuro, baked in)
      ['box', [x, y - 0.21 * s, z], [0.2 * s, 0.1 * s, 0.2 * s], 'mb', { paint: 1, grad: { axis: 'y', to: 'ms', a: y - 0.24 * s, b: y - 0.13 * s }, jit: 0 }],
      ['ell', [x, y, z - 0.03 * s], [0.15 * s, 0.18 * s, 0.06 * s], 'mi', { paint: 1, back: 'mi', backT: 0.3, jit: 0 }],
    ];
    // almond eye holes (tilt: + = outer corner up), dark sockets, Echo-glow pupils
    const eyes = (tilt, open = 1) => {
      for (const sx of [1, -1]) {
        const e = [x + sx * 0.055 * s, y + 0.015 * s, fz];
        sh.push(['ell', e, [0.045 * s, 0.024 * s * open, 0.04 * s], MP, { sub: 1, rot: [0, 0, sx * tilt] }]);
        sh.push(['ell', [e[0], e[1], e[2] - 0.012 * s], [0.052 * s, 0.032 * s * open, 0.04 * s], 'mb', { paint: 1, jit: 0, rot: [0, 0, sx * tilt] }]);
        if (kind !== 'bass') sh.push(['sph', [e[0], e[1] - 0.003 * s, e[2] - 0.028 * s], 0.015 * s, 'eg', { glow: 2, jit: 0 }]);
      }
    };
    const brows = (outer, inner, w = 0.014) => {
      for (const sx of [1, -1]) sh.push(['cap', [x + sx * 0.02 * s, y + (0.05 + inner) * s, fz + 0.01 * s], [x + sx * 0.1 * s, y + (0.05 + outer) * s, fz - 0.005 * s], w * s, w * 0.75 * s, 'gd', { paint: 1, fat: 0.025 * s, jit: 0 }]);
    };
    if (kind === 'falsetto') {
      // serene: high arched brows, half-closed eyes, a tiny round "oo" mouth, a gilded star on the brow
      eyes(-8, 0.7); brows(0.075, 0.06);
      sh.push(['ell', [x, y - 0.08 * s, fz - 0.005 * s], [0.018 * s, 0.024 * s, 0.03 * s], MP, { sub: 1 }]);
      sh.push(['ell', [x, y - 0.08 * s, fz - 0.03 * s], [0.02 * s, 0.026 * s, 0.03 * s], 'eo', { paint: 1, glow: 2, jit: 0 }]);
      sh.push(['sph', [x, y + 0.135 * s, fz - 0.02 * s], 0.024 * s, 'gd', { glow: 1, jit: 0 }]);
    } else if (kind === 'tenor') {
      // heroic: lifted brows, wide eyes, open singing "ah" mouth glowing with sound
      eyes(6, 1.1); brows(0.06, 0.02, 0.016);
      sh.push(['ell', [x, y - 0.088 * s, fz], [0.045 * s, 0.045 * s, 0.05 * s], MP, { sub: 1 }]);
      sh.push(['ell', [x, y - 0.088 * s, fz - 0.035 * s], [0.045 * s, 0.045 * s, 0.03 * s], 'eo', { paint: 1, glow: 2, jit: 0 }]);
      for (const sx of [1, -1]) sh.push(['cap', [x + sx * 0.12 * s, y + 0.12 * s, fz - 0.04 * s], [x + sx * 0.155 * s, y - 0.03 * s, fz - 0.06 * s], 0.016 * s, 0.01 * s, 'gd', { jit: 0 }]);
    } else if (kind === 'baritone') {
      // smirking: one brow cocked, narrowed eyes, a lopsided crescent grin, a gilded cheek curl
      eyes(10, 0.85);
      sh.push(['cap', [x + 0.02 * s, y + 0.07 * s, fz + 0.01 * s], [x + 0.1 * s, y + 0.115 * s, fz - 0.005 * s], 0.015 * s, 0.011 * s, 'gd', { paint: 1, fat: 0.025 * s, jit: 0 }]);
      sh.push(['cap', [x - 0.02 * s, y + 0.055 * s, fz + 0.01 * s], [x - 0.1 * s, y + 0.05 * s, fz - 0.005 * s], 0.015 * s, 0.011 * s, 'gd', { paint: 1, fat: 0.025 * s, jit: 0 }]);
      sh.push(...tube(bez([x - 0.06 * s, y - 0.072 * s, fz + 0.012 * s], [x - 0.005 * s, y - 0.105 * s, fz + 0.014 * s], [x + 0.07 * s, y - 0.05 * s, fz + 0.01 * s], 4), 0.018 * s, 0.018 * s, MP, { sub: 1 }));
      sh.push(...tube(bez([x - 0.06 * s, y - 0.072 * s, fz - 0.01 * s], [x - 0.005 * s, y - 0.105 * s, fz - 0.01 * s], [x + 0.07 * s, y - 0.05 * s, fz - 0.012 * s], 4), 0.02 * s, 0.02 * s, 'eo', { paint: 1, glow: 2, fat: 0.01 * s, jit: 0 }));
      sh.push(['tor', [x - 0.095 * s, y - 0.035 * s, fz - 0.02 * s], 0.028 * s, 0.009 * s, 'gd', { axis: 'z', jit: 0 }]);
    } else {
      // bass: heavy brow ridge and jowls; the mouth + lower jowl is the separate 'jaw' part
      brows(-0.005, 0.03, 0.018);
      for (const sx of [1, -1]) {
        sh.push(['ell', [x + sx * 0.09 * s, y - 0.075 * s, z + 0.02 * s], [0.075 * s, 0.075 * s, 0.065 * s], MP, { blend: 0.03 * s, grad: { axis: 'y', to: 'ms', a: y - 0.03 * s, b: y - 0.12 * s } }]);
        sh.push(['ell', [x + sx * 0.055 * s, y + 0.015 * s, fz], [0.045 * s, 0.026 * s, 0.04 * s], MP, { sub: 1 }]);
        sh.push(['ell', [x + sx * 0.055 * s, y + 0.015 * s, fz - 0.012 * s], [0.052 * s, 0.034 * s, 0.04 * s], 'mb', { paint: 1, jit: 0 }]);
      }
      sh.push(['ell', [x, y - 0.085 * s, fz], [0.055 * s, 0.032 * s, 0.06 * s], MP, { sub: 1 }]);
      sh.push(['ell', [x, y - 0.09 * s, fz - 0.04 * s], [0.055 * s, 0.03 * s, 0.03 * s], 'eo', { paint: 1, glow: 2, jit: 0 }]);
    }
    return yaw ? xf(sh, c, [0, yaw, 0]) : sh;
  };
  const T = [0, 2.2, 0.06], L = [0.74, 1.6, 0.26], R = [-0.74, 1.6, 0.26], B = [0, 1.02, 0.6];
  const SB = 1.5, ST = 1.05, SS = 1.28; // bass / falsetto / side mask scales
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
        // red lining at the hem
        ['box', [0, 0.04, 0], [1.2, 0.045, 1.2], 'lr', { paint: 1, jit: 0.04 }],
        // gold valance band + tassels across the shoulders
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
      { n: 'head', parent: 'body', p: B, sway: { axis: 'z', amp: 0.04, freq: 0.6, phase: 0 }, s: mask(B, SB, 'bass') },
      { n: 'jaw', parent: 'head', p: [B[0], B[1] - 0.06 * SB, B[2] - 0.02], s: [
        ['ell', [B[0], B[1] - 0.165 * SB, B[2] + 0.01], [0.085 * SB, 0.06 * SB, 0.07 * SB], 'ms', { grad: { axis: 'y', to: 'mb', a: B[1] - 0.15 * SB, b: B[1] - 0.22 * SB } }],
        ['ell', [B[0], B[1] - 0.13 * SB, B[2] + 0.06 * SB], [0.045 * SB, 0.02 * SB, 0.04 * SB], 'eo', { glow: 2, jit: 0 }],
      ] },
      { n: 'maskTop', parent: 'body', p: T, sway: { axis: 'z', amp: 0.06, freq: 0.5, phase: 1.6 }, s: mask(T, ST, 'falsetto') },
      { n: 'maskL', parent: 'body', p: L, sway: { axis: 'x', amp: 0.06, freq: 0.55, phase: 3.1 }, s: mask(L, SS, 'tenor', 20) },
      { n: 'maskR', parent: 'body', p: R, sway: { axis: 'x', amp: 0.06, freq: 0.55, phase: 4.7 }, s: mask(R, SS, 'baritone', -20) },
    ],
    eyes: {
      part: 'head', at: [B[0] + 0.05 * SB, B[1] + 0.015 * SB, B[2] + 0.07 * SB], dir: [0.15, 0.05, 1], px: 0.9,
      rows: ['.kkk.', 'kgggk', 'kgwgk', '.kkk.'], cmap: { g: { c: '#5ff4ff', glow: 2 }, w: { c: '#ffffff', glow: 2 } },
    },
    mouth: { part: 'head', style: 'none' },
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
            const o = [c[0] * 1.14, c[1] + (c[1] > 1.6 ? 0.08 : c[1] < 1.2 ? -0.04 : 0.03), c[2] - 0.16];
            return xf([
              ['ell', o, [0.135 * k, 0.175 * k, 0.03 * k], 'eo', { glow: 1, jit: 0 }],
              ['ell', [o[0], o[1], o[2] + 0.01], [0.105 * k, 0.145 * k, 0.04 * k], 'eo', { sub: 1 }],
            ], o, [0, yaw, 0]);
          }),
        ] },
      ],
      grow: { maskTop: 1.15, maskL: 1.15, maskR: 1.15, head: 1.08 },
      hat: { part: 'maskTop', at: [T[0], T[1] + 0.165 * ST, T[2] - 0.01], scale: 1.0, tilt: -4 },
      aura: 'notes', auraColor: [1.8, 1.0, 2.6, 1],
    },
    forms: {
      // Elemental Form: a ring of eight echo masks orbits, the curtain opens on a bright starry
      // stage-void, and a fixed spotlight beams down from above
      elemental: {
        pal: { vi: '#2a1a5a', st: '#fff0b0', lr: '#e02a40', vf: '#4a2a6a', gd: '#ffe27a', eg: '#ff7af2' },
        parts: [
          { n: 'chorus', parent: 'body', p: [0, 1.4, 0], spin: { axis: 'y', speed: 0.7 }, s: [
            ...ring(8, 1.02, 0, 0, (a, x, z, i) => {
              const c = [x, 1.25 + (i % 2) * 0.32, z];
              return xf([
                ['ell', c, [0.09, 0.12, 0.05], 'ck', { glow: 1, grad: { axis: 'y', to: 'eo', a: c[1] - 0.02, b: c[1] - 0.1 }, jit: 0 }],
                ['ell', [c[0] + 0.034, c[1] + 0.01, c[2] + 0.045], [0.022, 0.015, 0.03], 'ck', { sub: 1 }],
                ['ell', [c[0] - 0.034, c[1] + 0.01, c[2] + 0.045], [0.022, 0.015, 0.03], 'ck', { sub: 1 }],
              ], c, [0, a / D2R, 0]);
            }).flat(),
          ] },
          { n: 'spot', parent: 'body', p: [0, 2.62, 0.1], s: [
            ['cyl', [0, 2.72, 0.02], [0, 2.56, 0.12], 0.09, 'sp'],
            ['cyl', [0, 2.58, 0.11], [0, 2.54, 0.135], 0.07, 'sl', { glow: 3, jit: 0 }],
            ['tor', [0, 2.66, 0.07], 0.1, 0.018, 'gd', { rot: [30, 0, 0], jit: 0 }],
            // fixed beam: four glowing edge-rays fanning down around the top mask
            ...[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => ['cap', [sx * 0.04, 2.54, 0.13 + sz * 0.02], [sx * 0.42, 1.25, 0.25 + sz * 0.22], 0.012, 0.02, 'sl', { glow: 2, jit: 0 }]),
          ] },
        ],
        eyes: { cmap: { g: { c: '#ff7af2', glow: 2 }, w: { c: '#ffffff', glow: 2 } } },
        fx: [
          { part: 'spot', at: [0, 2.3, 0.2], type: 'glow', rate: 1.5, scale: 1.2, color: '#fff0b0' },
          { part: 'chorus', at: [1.02, 1.4, 0], type: 'note', rate: 1.2, scale: 0.8, color: '#5ff4ff' },
          { part: 'body', at: [0, 0.6, 0.2], type: 'star', rate: 0.8, scale: 0.6, color: '#fff0b0' },
        ],
        anim: { hover: 0.1 },
      },
    },
  };
  DESIGNS.bohemoth.pal.ck = '#d8c8ff';
  DESIGNS.bohemoth.pal.sp = '#2a2638';
  DESIGNS.bohemoth.pal.sl = '#fff6d0';
}
LORE.bohemoth = {
  name: 'Bohemoth', element: 'echo', element2: 'ecto', stage: 3, height: '2.4 m',
  desc: 'A stage curtain that learned to sing. Four masks float around its void, and each one carries a different voice, from a whisper-high falsetto to a bass that rattles the stadium seats. When all four sing at once, the echo keeps going long after the song ends.',
  personality: 'Dramatic, moody and grand; switches from tender ballad to thunder without warning.',
  look: 'Towering dark velvet curtain-mantle with a red lining, a gold valance and tassels, parted in front on a starry void; two huge cloaked arms with porcelain hands; four original porcelain opera masks in a diamond (serene falsetto on top, heroic tenor, smirking baritone, heavy-jowled bass), always lit from above.',
};
