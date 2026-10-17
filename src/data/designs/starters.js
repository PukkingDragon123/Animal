// Elemon — the 15 starter designs (5 elements × 3 stages), voxel DSL (docs/MODELING.md).
// Model space is absolute: metres, +y up, +z = front, left = +x.
//   Pyro  : kindoru → chochidra → infernobori   (festival-lantern fire dragons)
//   Hydro : takopo → takommando → admiraken     (Osaka takoyaki octopus tacticians)
//   Bio   : mochika → hanashika → shinrinoh     (Nara deer → sakura → forest spirit)
//   Geo   : clayki → tanukiln → dogugaia        (Shigaraki tanuki → porcelain → dogū)
//   Echo  : komoriff → reverbat → amplifury     (speaker bats → punk → rockstar)

export const DESIGNS = {};
export const LORE = {};

// ---------------------------------------------------------------- helpers
const D2R = Math.PI / 180;
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// Point on the surface of an axis-aligned ellipsoid (centre c, radii r) along direction d.
function onEll(c, r, d) {
  const t = 1 / Math.hypot(d[0] / r[0], d[1] / r[1], d[2] / r[2]);
  return [c[0] + d[0] * t, c[1] + d[1] * t, c[2] + d[2] * t];
}
// Smooth tapered tube through points (one capsule per segment). opts are cloned per shape.
function tube(pts, r0, r1, col, opts = {}) {
  const out = [], n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const ra = r0 + (r1 - r0) * (i / n), rb = r0 + (r1 - r0) * ((i + 1) / n);
    out.push(['cap', pts[i], pts[i + 1], ra, rb, col, { ...opts }]);
  }
  return out;
}
// Paint-only stroke along a polyline (markings, cracks, seams).
function stroke(pts, r, col, opts = {}) { return tube(pts, r, r, col, { paint: 1, ...opts }); }
// Quadratic bezier sampled into n+1 points.
function bez(a, b, c, n = 6) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1], u * u * a[2] + 2 * u * t * b[2] + t * t * c[2]]);
  }
  return out;
}
// Chōchin paper lantern (vertical axis): glowing paper with a brighter core band,
// painted dark ribs and black lacquer caps. vs = voxel size of the design.
function lantern(c, r, h, vs, { paper = 'L', core = 'Lc', rib = 'r', cap = 'k', glow = 1, ribs = [-0.72, -0.4, 0.4, 0.72], capH = null, capR = 0.62, raised = false } = {}) {
  const [x, y, z] = c, ch = capH ?? h * 0.22;
  const out = [['ell', c, [r, h, r], paper, { glow, jit: 0.03 }]];
  if (core) out.push(['ell', [x, y, z], [r * 1.1, h * 0.5, r * 1.1], core, { paint: 1, glow: glow + 1, jit: 0.03 }]);
  for (const v of ribs) {
    const yy = y + v * h, rr = r * Math.sqrt(Math.max(0.05, 1 - v * v));
    out.push(['tor', [x, yy, z], rr + (raised ? vs * 0.15 : -vs * 0.3), vs * (raised ? 0.62 : 0.6), rib, { jit: 0.02 }]);
  }
  out.push(['cyl', [x, y - h * 0.8, z], [x, y - h - ch, z], r * capR, cap, { jit: 0.02 }]);
  out.push(['cyl', [x, y + h * 0.8, z], [x, y + h + ch, z], r * capR * 0.9, cap, { jit: 0.02 }]);
  return out;
}
// vertical brush-text column painted on festival lanterns (abstract glyphs)
const LANTERN_TEXT = ['.kk.', 'kkkk', '.k.k', 'kk.k', '....', 'kkk.', '.k.k', 'kkkk', '.k..'];
// Procedural pixel art: n×n rows from f(x, y, r, a) → char ('.' = empty); x,y in [-1,1], y up.
function pix(n, f) {
  const rows = [];
  for (let j = 0; j < n; j++) {
    let row = '';
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) / n) * 2 - 1, y = 1 - ((j + 0.5) / n) * 2;
      row += f(x, y, Math.hypot(x, y), Math.atan2(y, x)) || '.';
    }
    rows.push(row);
  }
  return rows;
}
// Mitsudomoe (three-comma festival drum swirl) inside a ring.
function tomoe(n, { ring = 'k', fill = 'r', bg = 'w', rh = 0.36, hs = 0.21, tail = 2.1 } = {}) {
  return pix(n, (x, y, r) => {
    if (r > 1.02) return '.';
    if (r > 0.8) return ring;
    for (let k = 0; k < 3; k++) {
      const a0 = k * Math.PI * 2 / 3 + 0.3;
      if (Math.hypot(x - Math.cos(a0) * rh, y - Math.sin(a0) * rh) < hs) return fill;
      for (let s = 0; s <= 1; s += 0.04) {
        const ang = a0 - s * tail, rr = rh + s * 0.32, w = hs * (1 - s) * 0.75 + 0.015;
        if (Math.hypot(x - Math.cos(ang) * rr, y - Math.sin(ang) * rr) < w) return fill;
      }
    }
    return bg;
  });
}
// n points around the y axis (ring of studs, tentacles…): f(angle, x, z, i).
function ring(n, r, a0, f) {
  const out = [];
  for (let i = 0; i < n; i++) { const a = a0 + (i / n) * Math.PI * 2; out.push(f(a, Math.sin(a) * r, Math.cos(a) * r, i)); }
  return out;
}

// =====================================================================
// PYRO 1 — KINDORU
// =====================================================================
{
  const C = [0, 0.25, -0.03], R = [0.185, 0.155, 0.245];       // body ellipsoid
  const HC = [0, 0.46, 0.22], HR = [0.2, 0.165, 0.17];         // head ellipsoid
  const freckles = [[0.42, 1, 0.42], [-0.42, 1, 0.42], [0.25, 1, 0.02], [-0.25, 1, 0.02], [0.5, 1, -0.38], [-0.5, 1, -0.38], [0.12, 1, -0.6], [-0.12, 1, -0.6], [0.62, 0.8, 0.0], [-0.62, 0.8, 0.0]]
    .map((d) => ['sph', onEll(C, R, d), 0.019, 'e', { paint: 1, glow: 2, jit: 0 }]);
  const chevrons = [0.1, -0.03, -0.155].map((z, i) => ['ell', [0, 0.37, z], [0.2, 0.13 - i * 0.01, 0.026], 'd', { paint: 1 }]);
  DESIGNS.kindoru = {
    id: 'kindoru', vs: 0.024, arch: 'quad',
    pal: {
      b: '#f4592a', o: '#ff8a3a', d: '#a8251d', l: '#ffe4b5', e: '#ffcf4a',
      L: '#ff3a24', Lc: '#ff8a2e', r: '#5a0e0c', k: '#24171a', h: '#fff1d0', t: '#ffb54a', p: '#ff8f86', w: '#fff8ea',
    },
    anim: { quirk: ['shakeoff', 'stretch', 'sniff'], bounce: 1.25, gait: 1.1, stride: 1.1, tail: 1.2, maxSpeed: 4 },
    parts: [
      { n: 'body', p: [0, 0.24, 0], s: [
        ['ell', C, R, 'b', { belly: 'l', bellyT: 0.35 }],
        ['ell', [0, 0.17, 0.06], [0.13, 0.11, 0.21], 'l', { paint: 1 }],
        ...chevrons,
        ...freckles,
      ] },
      { n: 'head', parent: 'body', p: [0, 0.36, 0.16], s: [
        ['sph', [0, 0.37, 0.16], 0.1, 'b'],
        ['ell', HC, HR, 'b', { belly: 'l', bellyT: 0.45 }],
        ['ell', [0, 0.4, 0.29], [0.15, 0.08, 0.1], 'b', { belly: 'l', bellyT: 0.2 }],
        ['ell', [0, 0.355, 0.27], [0.13, 0.05, 0.11], 'l', { paint: 1 }],
        ['cap', [0.07, 0.585, 0.18], [0.1, 0.665, 0.12], 0.036, 0.014, 'h', { m: 1 }],
        ['ell', onEll(HC, HR, [0.68, -0.25, 0.7]), [0.034, 0.022, 0.03], 'p', { m: 1, paint: 1, jit: 0 }],
      ] },
      { n: 'legFL', parent: 'body', p: [0.115, 0.17, 0.12], mirror: true, s: [
        ['sph', [0.115, 0.17, 0.12], 0.066, 'b'],
        ['cap', [0.12, 0.16, 0.13], [0.13, 0.055, 0.15], 0.062, 0.056, 'b', { tip: 'd', tipT: 0.62 }],
        ['ell', [0.13, 0.036, 0.165], [0.064, 0.038, 0.078], 'd'],
        ['sph', [0.108, 0.03, 0.232], 0.019, 'w'], ['sph', [0.152, 0.03, 0.232], 0.019, 'w'],
      ] },
      { n: 'legBL', parent: 'body', p: [0.125, 0.18, -0.15], mirror: true, s: [
        ['sph', [0.125, 0.18, -0.15], 0.075, 'b'],
        ['cap', [0.13, 0.17, -0.15], [0.14, 0.055, -0.13], 0.068, 0.058, 'b', { tip: 'd', tipT: 0.62 }],
        ['ell', [0.14, 0.036, -0.11], [0.066, 0.038, 0.08], 'd'],
        ['sph', [0.118, 0.03, -0.042], 0.019, 'w'], ['sph', [0.162, 0.03, -0.042], 0.019, 'w'],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.24, -0.25], s: [
        ['sph', [0, 0.24, -0.25], 0.08, 'b'],
        ['cap', [0, 0.24, -0.25], [0, 0.27, -0.4], 0.082, 0.064, 'b', { belly: 'l', bellyT: 0.5, stripes: { axis: 'z', p: 0.075, w: 0.026, col: 'd', o: 0.01 } }],
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 0.27, -0.4], s: [
        ['cap', [0, 0.27, -0.4], [0, 0.35, -0.515], 0.064, 0.05, 'b', { stripes: { axis: 'y', p: 0.07, w: 0.024, col: 'd', o: 0.0 } }],
      ] },
      { n: 'tail3', parent: 'tail2', p: [0, 0.35, -0.515], s: [
        ['cap', [0, 0.35, -0.515], [0, 0.455, -0.575], 0.05, 0.038, 'b'],
        ...lantern([0, 0.59, -0.585], 0.1, 0.118, 0.024, { glow: 1 }),
      ] },
    ],
    eyes: { part: 'head', at: [0.088, 0.465, 0.37], dir: [0.42, 0.04, 1], style: 'big', iris: '#5a1c14', px: 0.78 },
    mouth: { part: 'head', at: [0, 0.39, 0.385], dir: [0, -0.15, 1], style: 'fang', px: 0.62 },
    decals: [
      { part: 'tail3', at: [0.1, 0.59, -0.585], dir: [1, 0, 0], rows: LANTERN_TEXT, cmap: { k: '#2a0d0a' }, px: 0.6, lift: 0.012, mirror: true },
    ],
    fx: [
      { part: 'tail3', at: [0, 0.735, -0.585], type: 'flame', rate: 0.9, scale: 0.85 },
      { part: 'tail3', at: [0, 0.75, -0.585], type: 'ember', rate: 0.6, scale: 0.8 },
    ],
  };
  LORE.kindoru = {
    name: 'Kindoru', element: 'pyro', stage: 1, height: '0.7 m',
    desc: 'Born in the glow of Dōtonbori festival stalls, it carries its own lantern so it is never lost in the neon crowds. The flame flares bright whenever it smells takoyaki.',
    personality: 'Hot-headed and fiercely loyal; sulks when ignored, then forgives instantly for a snack.',
    look: 'Chubby vermilion salamander pup with a cream belly, red chevron stripes and glowing ember freckles; two stubby horn nubs; tail ends in a red chōchin paper lantern with a live flame.',
  };
}

// =====================================================================
// PYRO 2 — CHOCHIDRA
// =====================================================================
{
  const vs = 0.034;
  const TC = [0, 0.68, 0], TR = [0.26, 0.29, 0.215];          // torso
  const HC = [0, 1.1, 0.02], HR = [0.19, 0.172, 0.172];        // head
  // two-tone horn: dark red root, cream sweep
  const horn = (s) => tube(bez([s * 0.095, 1.215, -0.01], [s * 0.15, 1.31, -0.1], [s * 0.18, 1.32, -0.28]), 0.058, 0.014, 'h').map((t, i) => (i < 2 ? [...t.slice(0, 5), 'd', t[6]] : t));
  const lapel = (s) => stroke([onEll(TC, TR, [s * 0.7, 0.75, 0.25]), onEll(TC, TR, [s * 0.36, 0.3, 1]), onEll(TC, TR, [s * 0.1, -0.02, 1])], 0.034, 'W');
  const tacks = ring(10, 0.163, 0, (a) => ['sph', [Math.sin(a) * 0.163, 0.58 + Math.cos(a) * 0.163, 0.282], 0.021, 'g', { jit: 0 }]);
  const knuckles = [-0.032, 0, 0.032].map((dx) => ['sph', [0.32 + dx, 0.47, 0.205], 0.022, 'e', { glow: 2, jit: 0 }]);
  const claws = [-0.036, 0, 0.036].map((dx) => ['cap', [0.32 + dx, 0.4, 0.2], [0.32 + dx * 1.2, 0.37, 0.245], 0.017, 0.006, 'h']);
  const toes = [-0.05, 0, 0.05].map((dx) => ['cap', [0.155 + dx, 0.045, 0.19], [0.155 + dx * 1.3, 0.02, 0.25], 0.026, 0.009, 'h']);
  const tailBand = { stripes: { axis: 'z', p: 0.1, w: 0.034, col: 'd', o: 0.02 } };
  DESIGNS.chochidra = {
    id: 'chochidra', vs, arch: 'biped',
    pal: {
      b: '#f0552a', o: '#ff8a3a', d: '#a3221b', l: '#ffe4b5', e: '#ffcf4a', R: '#c0161d', W: '#fff4e6', n: '#5b2a17', g: '#ffc94a',
      L: '#ff3a24', Lc: '#ff8a2e', r: '#5a0e0c', k: '#24171a', h: '#fff1d0', m: '#e2402a', M: '#ff9a4a',
    },
    anim: { quirk: ['flex', 'roar'], bounce: 1.1, gait: 1, stride: 1.05, tail: 1, maxSpeed: 4.5 },
    parts: [
      { n: 'body', p: [0, 0.48, 0], s: [
        ['ell', TC, TR, 'b'],
        ['ell', [0, 0.56, 0.035], [0.245, 0.2, 0.205], 'b'],
        ['ell', [0, 0.9, 0], [0.3, 0.13, 0.2], 'b'],                          // broad shoulders
        // happi coat: crimson yoke above a clean white hem line, white V lapels
        ['box', [0, 1.05, 0], [0.5, 0.29, 0.4], 'R', { paint: 1 }],
        ['box', [0, 0.775, 0], [0.5, 0.017, 0.4], 'W', { paint: 1 }],
        ...lapel(1), ...lapel(-1),
        // taiko drum belly plate
        ['cyl', [0, 0.58, 0.16], [0, 0.58, 0.274], 0.165, 'l', { jit: 0.03 }],
        ['tor', [0, 0.58, 0.262], 0.168, 0.031, 'n', { axis: 'z' }],
        ...tacks,
      ] },
      { n: 'head', parent: 'body', p: [0, 0.96, 0.03], s: [
        ['sph', [0, 0.97, 0.02], 0.115, 'b'],
        ['ell', HC, HR, 'b'],
        ['box', [0, 1.088, 0.1], [0.15, 0.088, 0.11], 'b', { round: 0.05 }],               // flat face plate
        ['ell', [0, 0.99, 0.2], [0.09, 0.056, 0.1], 'b', { belly: 'l', bellyT: 0.25 }],     // muzzle
        ['ell', [0, 0.955, 0.16], [0.11, 0.04, 0.13], 'l', { paint: 1 }],
        ['sph', [0.03, 1.025, 0.298], 0.02, 'k', { m: 1, sub: 1 }],                        // nostrils
        ...horn(1), ...horn(-1),
        // hachimaki headband (twisted red/white) on the forehead, knot at the back
        ['tor', [0, 1.19, 0.015], 0.155, 0.03, 'W', { rot: [-8, 0, 0], stripes: { axis: 'x', p: 0.054, w: 0.021, col: 'R' } }],
        ['sph', [0, 1.17, -0.15], 0.045, 'W', { stripes: { axis: 'y', p: 0.04, w: 0.016, col: 'R' } }],
      ] },
      { n: 'band', parent: 'head', p: [0, 1.17, -0.15], sway: { axis: 'y', amp: 0.25, freq: 1.6 }, s: [
        ...tube([[0.015, 1.17, -0.16], [0.06, 1.13, -0.25], [0.085, 1.05, -0.31]], 0.026, 0.021, 'W', { stripes: { axis: 'y', p: 0.05, w: 0.018, col: 'R' } }),
        ...tube([[-0.015, 1.17, -0.16], [-0.05, 1.15, -0.26], [-0.075, 1.09, -0.34]], 0.026, 0.021, 'W', { stripes: { axis: 'y', p: 0.05, w: 0.018, col: 'R' } }),
      ] },
      { n: 'armL', parent: 'body', p: [0.27, 0.9, 0.02], mirror: true, s: [
        ['sph', [0.27, 0.9, 0.02], 0.09, 'R'],
        ['cap', [0.27, 0.9, 0.02], [0.305, 0.69, 0.05], 0.082, 0.068, 'R', { tip: 'W', tipT: 0.8 }],
        ['cap', [0.305, 0.68, 0.05], [0.32, 0.5, 0.12], 0.066, 0.06, 'b'],
        ['ell', [0.32, 0.44, 0.145], [0.08, 0.078, 0.082], 'b', { belly: 'l', bellyT: 0.5 }],
        ...knuckles, ...claws,
      ] },
      { n: 'legL', parent: 'body', p: [0.135, 0.43, -0.02], mirror: true, s: [
        ['sph', [0.135, 0.43, -0.02], 0.12, 'b'],
        ['cap', [0.145, 0.41, 0.0], [0.155, 0.23, 0.06], 0.13, 0.085, 'b'],
        ['cap', [0.155, 0.23, 0.06], [0.155, 0.09, -0.01], 0.08, 0.066, 'b', { tip: 'd', tipT: 0.55 }],
        ['ell', [0.155, 0.05, 0.07], [0.095, 0.052, 0.14], 'd'],
        ...toes,
      ] },
      { n: 'wingL', parent: 'body', p: [0.11, 0.92, -0.15], mirror: true, s: [
        ['poly', [0.11, 0.93, -0.18], [[0, 0.02], [0.24, 0.17], [0.34, 0.11], [0.28, 0.05], [0.25, -0.03], [0.17, -0.01], [0.13, -0.09], [0.04, -0.06]], 0.017, 'm', { plane: 'xy', rot: [0, 18, 0], grad: { axis: 'x', to: 'M', a: 0.1, b: 0.45 } }],
        ...tube([[0.11, 0.94, -0.17], [0.24, 1.08, -0.22], [0.36, 1.04, -0.26]], 0.03, 0.016, 'd'),
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.46, -0.15], s: [
        ['sph', [0, 0.46, -0.15], 0.125, 'b'],
        ['cap', [0, 0.46, -0.15], [0, 0.34, -0.38], 0.125, 0.1, 'b', { belly: 'l', bellyT: 0.5, ...tailBand }],
        ['cap', [0, 0.55, -0.27], [0, 0.63, -0.33], 0.034, 0.008, 'h'],
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 0.34, -0.38], s: [
        ['cap', [0, 0.34, -0.38], [0, 0.36, -0.6], 0.1, 0.078, 'b', { belly: 'l', bellyT: 0.5, ...tailBand }],
        ['cap', [0, 0.43, -0.45], [0, 0.5, -0.52], 0.03, 0.007, 'h'],
        ['cap', [0, 0.43, -0.57], [0, 0.49, -0.64], 0.026, 0.006, 'h'],
      ] },
      { n: 'tail3', parent: 'tail2', p: [0, 0.36, -0.6], s: [
        ['cap', [0, 0.36, -0.6], [0, 0.53, -0.76], 0.078, 0.06, 'b', { stripes: { axis: 'y', p: 0.1, w: 0.034, col: 'd' } }],
      ] },
      { n: 'tail4', parent: 'tail3', p: [0, 0.53, -0.76], s: [
        ['cap', [0, 0.53, -0.76], [0, 0.68, -0.8], 0.06, 0.046, 'b'],
        ...lantern([0, 0.86, -0.81], 0.13, 0.155, vs, { glow: 1 }),
      ] },
    ],
    eyes: { part: 'head', at: [0.088, 1.108, 0.22], dir: [0.14, 0.03, 1], style: 'anime', iris: '#ffae1a', px: 0.72 },
    mouth: { part: 'head', at: [0, 0.962, 0.29], dir: [0, -0.3, 1], style: 'grin', px: 0.62 },
    decals: [
      { part: 'body', at: [0, 0.58, 0.29], dir: [0, 0, 1], rows: tomoe(13), cmap: { k: '#5b2a17', r: '#c0161d', w: '#ffe9c2' }, px: 0.52, lift: vs * 0.5 },
      { part: 'body', at: [0, 0.87, -0.24], dir: [0, 0.25, -1], rows: tomoe(11, { ring: 'w', fill: 'w', bg: '.' }), cmap: { w: '#fff4e6' }, px: 0.6, lift: vs * 0.5 },
      { part: 'tail4', at: [0.13, 0.86, -0.81], dir: [1, 0, 0], rows: LANTERN_TEXT, cmap: { k: '#2a0d0a' }, px: 0.6, lift: vs * 0.5, mirror: true },
    ],
    fx: [
      { part: 'tail4', at: [0, 1.06, -0.81], type: 'flame', rate: 1.3, scale: 1.25 },
      { part: 'tail4', at: [0, 1.08, -0.81], type: 'ember', rate: 1, scale: 1 },
      { part: 'armL', at: [0.32, 0.48, 0.21], type: 'ember', rate: 0.25, scale: 0.6, mirror: true },
    ],
  };
  LORE.chochidra = {
    name: 'Chochidra', element: 'pyro', stage: 2, height: '1.3 m',
    desc: 'Struts through the night markets drumming on its own belly plate to start impromptu festivals. Its lantern tail burns hotter the louder the crowd cheers.',
    personality: 'Brash showboat who never refuses a challenge; secretly practises its victory poses.',
    look: 'Upright young dragon in a crimson-and-white happi-coat scale pattern, twisted hachimaki headband, taiko-drum belly plate with a mitsudomoe swirl, swept-back cream horns, stubby wings, glowing knuckles and a big lantern tail.',
  };
}
