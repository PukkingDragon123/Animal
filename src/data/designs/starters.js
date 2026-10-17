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
// Deterministic pseudo-random in [0,1) for procedural detail.
const prand = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// Zig-zag glowing crack painted over an ellipsoid surface, from direction d0 to d1.
function crackEll(C, R, d0, d1, { n = 5, amp = 0.18, seed = 1, r = 0.03, col = 'G', glow = 2, mirror = false } = {}) {
  const perp = norm3(cross3(norm3([d1[0] - d0[0], d1[1] - d0[1], d1[2] - d0[2]]), norm3([d0[0] + d1[0], d0[1] + d1[1], d0[2] + d1[2]])));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, j = (i === 0 || i === n) ? 0 : (prand(seed * 31 + i) - 0.5) * 2 * amp;
    pts.push(onEll(C, R, [d0[0] + (d1[0] - d0[0]) * t + perp[0] * j, d0[1] + (d1[1] - d0[1]) * t + perp[1] * j, d0[2] + (d1[2] - d0[2]) * t + perp[2] * j]));
  }
  return stroke(pts, r, col, { glow, jit: 0.05, m: mirror ? 1 : 0 });
}
// Zig-zag glowing crack along a capsule a→b (radii ra→rb) at angle ang around its axis.
function crackCap(a, b, ra, rb, ang, { n = 4, amp = 0.5, seed = 1, r = 0.03, col = 'G', glow = 2, t0 = 0.12, t1 = 0.88, mirror = false } = {}) {
  const ax = norm3([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
  const up = Math.abs(ax[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0];
  const u = norm3(cross3(ax, up)), v = cross3(ax, u);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + (t1 - t0) * (i / n), an = ang + (prand(seed * 17 + i) - 0.5) * 2 * amp, rr = ra + (rb - ra) * t;
    const c = lerp3(a, b, t);
    pts.push([c[0] + (u[0] * Math.cos(an) + v[0] * Math.sin(an)) * rr, c[1] + (u[1] * Math.cos(an) + v[1] * Math.sin(an)) * rr, c[2] + (u[2] * Math.cos(an) + v[2] * Math.sin(an)) * rr]);
  }
  return stroke(pts, r, col, { glow, jit: 0.05, m: mirror ? 1 : 0 });
}
// Nobori festival banner as a flame fin: pole at its front edge, top crossbar, glowing
// flag in the zy plane (centred on base.x) with a flame-tongue top, sheared backwards and
// optionally rolled sideways (deg, + leans toward +x) about its base.
function nobori(base, H, W, ht, { shear = 0.25, roll = 0, pole = 'B', from = 'Y', to = 'F', glow = 2, vs = 0.05 } = {}) {
  const sh = (z, y) => [z - y * shear, y];
  const top = [[0, H], [-W * 0.18, H + W * 0.22], [-W * 0.34, H + W * 0.04], [-W * 0.55, H + W * 0.32], [-W * 0.72, H + W * 0.02], [-W * 0.9, H + W * 0.2], [-W, H - W * 0.05]];
  const pts = [[0, 0.02], ...top, [-W * 1.04, H * 0.6], [-W * 0.96, H * 0.3], [-W, 0.06]].map(([z, y]) => sh(z, y));
  const [x, y, z] = base, ca = Math.cos(roll * D2R), sa = Math.sin(roll * D2R);
  const P = (dy, dz) => [x + dy * sa, y + dy * ca, z + dz];   // point dy above base along the rolled pole
  return [
    ['poly', base, pts, ht, from, { plane: 'zy', glow, jit: 0.04, rot: [0, 0, -roll], grad: { axis: 'y', to, a: y + H * 0.15 * ca, b: y + H * 1.1 * ca } }],
    ['cap', P(-0.02, 0), P(H + 0.05, -(H + 0.05) * shear), vs * 0.75, vs * 0.6, pole],
    ['cap', P(H + 0.04, -(H + 0.04) * shear), P(H + 0.04, -(H + 0.04) * shear - W * 0.55), vs * 0.55, vs * 0.5, pole],
  ];
}
// Outward flag variant: pole vertical at base, flag in the xy plane extending toward +x
// (visible from front and back), flame-tongue top edge, leaning outward by `lean`.
function noboriFlag(base, H, W, ht, { lean = 0.18, pole = 'B', from = 'Y', to = 'F', glow = 2, vs = 0.05 } = {}) {
  const sh = (x, y) => [x + y * lean, y];
  const top = [[0, H], [W * 0.2, H + W * 0.3], [W * 0.38, H + W * 0.06], [W * 0.58, H + W * 0.36], [W * 0.76, H + W * 0.04], [W * 0.92, H + W * 0.22], [W, H - W * 0.06]];
  const pts = [[0, 0.02], ...top, [W * 1.05, H * 0.62], [W * 0.95, H * 0.32], [W, 0.06]].map(([x, y]) => sh(x, y));
  const [x, y, z] = base;
  return [
    ['poly', base, pts, ht, from, { plane: 'xy', glow, jit: 0.04, grad: { axis: 'y', to, a: y + H * 0.15, b: y + H * 1.15 } }],
    ['cap', [x, y - 0.02, z], [x + (H + 0.06) * lean, y + H + 0.06, z], vs * 0.75, vs * 0.6, pole],
    ['cap', [x + (H + 0.05) * lean, y + H + 0.05, z], [x + (H + 0.05) * lean + W * 0.6, y + H + 0.05, z], vs * 0.55, vs * 0.5, pole],
  ];
}
// Uniformly rescale a finished design (geometry, voxel size, pivots, decals, emitters).
function scaleDesign(d, k) {
  const v = (p) => p.map((x) => x * k);
  const so = (o) => {
    if (!o) return o;
    const q = { ...o };
    for (const key of ['noise', 'noiseScale', 'fat', 'round']) if (q[key]) q[key] *= k;
    if (q.stripes) q.stripes = { ...q.stripes, p: q.stripes.p * k, w: q.stripes.w * k, o: (q.stripes.o || 0) * k };
    if (q.spots) q.spots = { ...q.spots, s: (q.spots.s || 0.06) * k };
    if (q.grad) q.grad = { ...q.grad, a: q.grad.a * k, b: q.grad.b * k };
    return q;
  };
  const shape = (t) => {
    const [kind] = t;
    if (kind === 'sph') return [kind, v(t[1]), t[2] * k, t[3], so(t[4])];
    if (kind === 'ell' || kind === 'box') return [kind, v(t[1]), v(t[2]), t[3], so(t[4])];
    if (kind === 'cap') return [kind, v(t[1]), v(t[2]), t[3] * k, t[4] * k, t[5], so(t[6])];
    if (kind === 'cyl') return [kind, v(t[1]), v(t[2]), t[3] * k, t[4], so(t[5])];
    if (kind === 'tor') return [kind, v(t[1]), t[2] * k, t[3] * k, t[4], so(t[5])];
    if (kind === 'poly') return [kind, v(t[1]), t[2].map(v), t[3] * k, t[4], so(t[5])];
    return t;
  };
  const face = (f) => (f ? { ...f, at: v(f.at), ...(f.lift ? { lift: f.lift * k } : {}) } : f);
  return {
    ...d, vs: d.vs * k,
    parts: d.parts.map((p) => ({ ...p, p: v(p.p), s: p.s.map(shape) })),
    eyes: face(d.eyes), mouth: face(d.mouth),
    decals: (d.decals || []).map(face),
    fx: (d.fx || []).map((f) => ({ ...f, at: v(f.at), scale: (f.scale ?? 1) * Math.sqrt(k) })),
  };
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
  const tacks = ring(10, 0.163, 0, (a) => ['sph', [Math.sin(a) * 0.163, 0.58 + Math.cos(a) * 0.163, 0.282], 0.027, 'g', { jit: 0 }]);
  const knuckles = [-0.032, 0, 0.032].map((dx) => ['sph', [0.32 + dx, 0.47, 0.205], 0.022, 'e', { glow: 2, jit: 0 }]);
  const claws = [-0.036, 0, 0.036].map((dx) => ['cap', [0.32 + dx, 0.4, 0.2], [0.32 + dx * 1.2, 0.37, 0.25], 0.021, 0.012, 'h']);
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

// =====================================================================
// PYRO 3 — INFERNOBORI
// =====================================================================
{
  const vs = 0.05;
  const TC = [0, 1.36, 0], TR = [0.46, 0.55, 0.38];            // torso
  const HC = [0, 2.08, 0.12], HR = [0.28, 0.24, 0.27];         // head
  const cr = vs * 0.6;
  const plates = [1.11, 1.27].map((y) => ['ell', [0, y, 0.12], [0.4, 0.062, 0.34], 'P', { jit: 0.05 }]);
  const shide = [[0, 0], [0.07, 0], [0.07, -0.07], [0.12, -0.07], [0.12, -0.15], [0.05, -0.15], [0.05, -0.08], [0, -0.08]];
  const tsuna = [   // yokozuna-style twisted rope belt with zigzag shide papers
    ['tor', [0, 0.97, 0.05], 0.395, 0.06, 'W', { stripes: { axis: 'x', p: 0.1, w: 0.042, col: 'R' } }],
    ['poly', [0.1, 0.92, 0.43], shide, 0.022, 'W', { plane: 'xy', m: 1, rot: [0, 18, 0] }],
    ['poly', [-0.06, 0.92, 0.45], shide, 0.022, 'W', { plane: 'xy' }],
  ];
  const backCracks = [
    crackEll(TC, TR, [0.3, 0.8, -0.6], [0.9, 0.1, -0.4], { seed: 3, r: cr, mirror: true }),
    crackEll(TC, TR, [0.15, 0.2, -1], [0.7, -0.5, -0.5], { seed: 7, r: cr, mirror: true }),
    crackEll(TC, TR, [0.9, 0.5, 0.2], [0.85, -0.4, 0.4], { seed: 11, r: cr, mirror: true }),
  ].flat();
  const horn = (s, root, mid, tip, r0, r1) => tube(bez([s * root[0], root[1], root[2]], [s * mid[0], mid[1], mid[2]], [s * tip[0], tip[1], tip[2]], 5), r0, r1, 'P').map((t, i) => (i === 4 ? [...t.slice(0, 5), 'Y', { glow: 2 }] : t));
  const knuckles = [-0.075, -0.025, 0.025, 0.075].map((dx) => ['sph', [0.64 + dx, 0.93, 0.33], 0.042, 'Y', { glow: 2, jit: 0 }]);
  const toes = [-0.09, 0, 0.09].map((dx) => ['cap', [0.3 + dx, 0.06, 0.3], [0.3 + dx * 1.3, 0.03, 0.4], 0.05, 0.016, 'h']);
  const smallLantern = (c) => [['cyl', [c[0], c[1] - 0.2, c[2]], [c[0], c[1] - 0.1, c[2]], 0.035, 'B'], ...lantern(c, 0.1, 0.125, vs, { glow: 1, ribs: [-0.6, 0.6], capR: 0.66 })];
  DESIGNS.infernobori = {
    id: 'infernobori', vs, arch: 'biped',
    pal: {
      B: '#332a2c', P: '#4d3f3f', Q: '#6f5d58', G: '#ff6a12', g: '#ff5410', Y: '#ffd23f', F: '#ff3d14', h: '#f3e2c4',
      L: '#ff3a24', Lc: '#ff8a2e', r: '#5a0e0c', k: '#1f1517', R: '#c0161d', W: '#fff4e6',
    },
    anim: { quirk: ['roar', 'flex'], bounce: 0.8, gait: 0.85, stride: 0.9, tail: 0.8, maxSpeed: 4 },
    parts: [
      { n: 'body', p: [0, 1.0, 0], s: [
        ['ell', TC, TR, 'B', { dither: { col: 'P', amt: 0.18 } }],
        ['ell', [0, 1.66, 0.04], [0.54, 0.3, 0.37], 'B', { dither: { col: 'P', amt: 0.18 } }],   // broad chest
        ['ell', [0, 1.1, 0.06], [0.42, 0.33, 0.35], 'B'],
        ['ell', [0, 1.08, 0.24], [0.33, 0.34, 0.22], 'g', { paint: 1, glow: 1 }],                // molten belly
        ...plates,
        ...tsuna,
        ...backCracks,
        // chest crest: dark disc (evolved taiko plate)
        ['cyl', [0, 1.6, 0.3], [0, 1.6, 0.44], 0.2, 'P'],
        ['tor', [0, 1.6, 0.42], 0.2, 0.035, 'Q', { axis: 'z' }],
      ] },
      { n: 'nobori1', parent: 'body', p: [0, 1.85, -0.3], sway: { axis: 'x', amp: 0.04, freq: 1.3 }, s: nobori([0, 1.8, -0.3], 0.66, 0.32, 0.035, { vs, shear: 0.3 }) },
      { n: 'noboriL', parent: 'body', p: [0.3, 1.72, -0.3], mirror: true, sway: { axis: 'y', amp: 0.08, freq: 1.3, phase: 0.8 }, s: noboriFlag([0.3, 1.7, -0.32], 0.6, 0.3, 0.035, { vs, lean: 0.3 }) },
      { n: 'nobori3', parent: 'body', p: [0, 1.1, -0.38], sway: { axis: 'x', amp: 0.06, freq: 1.3, phase: 1.6 }, s: nobori([0, 1.08, -0.38], 0.36, 0.22, 0.035, { vs }) },
      { n: 'head', parent: 'body', p: [0, 1.88, 0.1], s: [
        ['sph', [0, 1.88, 0.08], 0.22, 'B'],
        ['ell', HC, HR, 'B', { dither: { col: 'P', amt: 0.15 } }],
        ['box', [0, 2.08, 0.24], [0.22, 0.12, 0.16], 'B', { round: 0.09 }],                       // flat face
        ['ell', [0, 1.98, 0.42], [0.165, 0.1, 0.26], 'P', { belly: 'Q', bellyT: 0.3 }],          // snout
        ['ell', [0, 1.9, 0.38], [0.15, 0.06, 0.24], 'Q', { paint: 1 }],
        ['ell', [0, 2.2, 0.3], [0.24, 0.045, 0.1], 'P'],                                        // brow ridge
        ['sph', [0.055, 2.05, 0.66], 0.03, 'k', { m: 1, sub: 1 }],
        ['sph', [0.055, 2.05, 0.66], 0.045, 'G', { m: 1, paint: 1, glow: 2 }],                     // glowing nostrils
        ...crackEll(HC, HR, [0.6, 0.6, -0.3], [0.85, -0.1, -0.5], { seed: 5, r: cr, mirror: true, n: 4 }),
        // crown of horns
        ...horn(1, [0.16, 2.2, 0.08], [0.36, 2.4, 0.0], [0.46, 2.5, -0.32], 0.11, 0.025),
        ...horn(-1, [0.16, 2.2, 0.08], [0.36, 2.4, 0.0], [0.46, 2.5, -0.32], 0.11, 0.025),
        ...horn(1, [0.24, 2.04, -0.02], [0.4, 2.05, -0.14], [0.48, 2.12, -0.32], 0.06, 0.016),
        ...horn(-1, [0.24, 2.04, -0.02], [0.4, 2.05, -0.14], [0.48, 2.12, -0.32], 0.06, 0.016),
        ['cap', [0, 2.3, 0.0], [0, 2.36, -0.22], 0.06, 0.02, 'P'],
      ] },
      { n: 'armL', parent: 'body', p: [0.53, 1.7, 0.0], mirror: true, s: [
        ['sph', [0.53, 1.7, 0.0], 0.17, 'B'],
        ['cap', [0.55, 1.7, 0.0], [0.62, 1.3, 0.06], 0.16, 0.13, 'B', { dither: { col: 'P', amt: 0.2 } }],
        ['cap', [0.62, 1.3, 0.06], [0.64, 1.0, 0.16], 0.15, 0.16, 'P'],
        ['ell', [0.64, 0.86, 0.2], [0.18, 0.17, 0.18], 'P', { belly: 'B' }],
        ['ell', [0.6, 1.8, 0.0], [0.22, 0.13, 0.25], 'P', { top: 'Q', noise: 0.025, noiseScale: 0.1 }],    // rocky pauldron
        ['ell', [0.6, 1.76, 0.0], [0.235, 0.045, 0.265], 'G', { glow: 2, under: 1 }],
        ['cap', [0.62, 1.88, 0.06], [0.72, 2.06, 0.0], 0.06, 0.015, 'P'],
        ['cap', [0.62, 1.86, -0.1], [0.7, 2.0, -0.2], 0.05, 0.013, 'P'],
        ...crackCap([0.55, 1.7, 0.0], [0.62, 1.3, 0.06], 0.16, 0.13, 0.4, { seed: 2, r: cr }),
        ...crackCap([0.62, 1.3, 0.06], [0.64, 1.0, 0.16], 0.15, 0.16, 2.6, { seed: 4, r: cr }),
        ...knuckles,
      ] },
      { n: 'legL', parent: 'body', p: [0.27, 0.92, -0.02], mirror: true, s: [
        ['sph', [0.27, 0.92, -0.02], 0.21, 'B'],
        ['cap', [0.28, 0.9, 0.0], [0.31, 0.5, 0.12], 0.23, 0.16, 'B', { dither: { col: 'P', amt: 0.18 } }],
        ['cap', [0.31, 0.5, 0.12], [0.31, 0.17, -0.02], 0.16, 0.13, 'P'],
        ['ell', [0.31, 0.1, 0.13], [0.17, 0.1, 0.25], 'P', { top: 'Q' }],
        ...crackCap([0.28, 0.9, 0.0], [0.31, 0.5, 0.12], 0.23, 0.16, 0.2, { seed: 9, r: cr }),
        ...crackCap([0.31, 0.5, 0.12], [0.31, 0.17, -0.02], 0.16, 0.13, 1.2, { seed: 13, r: cr }),
        ...toes,
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.95, -0.3], s: [
        ['sph', [0, 0.95, -0.3], 0.24, 'B'],
        ['cap', [0, 0.95, -0.3], [0, 0.68, -0.7], 0.25, 0.19, 'B', { belly: 'G', bellyT: 0.6, dither: { col: 'P', amt: 0.18 } }],
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 0.68, -0.7], s: [
        ['cap', [0, 0.68, -0.7], [0, 0.5, -1.05], 0.19, 0.15, 'B', { dither: { col: 'P', amt: 0.18 } }],
        ...smallLantern([0, 0.93, -0.86]),
      ] },
      { n: 'tail3', parent: 'tail2', p: [0, 0.5, -1.05], s: [
        ['cap', [0, 0.5, -1.05], [0, 0.55, -1.38], 0.15, 0.115, 'B', { dither: { col: 'P', amt: 0.18 } }],
        ...smallLantern([0, 0.8, -1.2]),
      ] },
      { n: 'tail4', parent: 'tail3', p: [0, 0.55, -1.38], s: [
        ['cap', [0, 0.55, -1.38], [0, 0.84, -1.56], 0.115, 0.085, 'B'],
        ...lantern([0, 1.15, -1.6], 0.2, 0.24, vs, { glow: 1, ribs: [-0.7, -0.35, 0.35, 0.7] }),
      ] },
    ],
    eyes: { part: 'head', at: [0.115, 2.11, 0.4], dir: [0.12, 0.02, 1], style: 'sharp', iris: '#ffd23f', px: 0.85, cmap: { i: { c: '#ffd23f', glow: 2 } } },
    mouth: { part: 'head', at: [0, 1.93, 0.66], dir: [0, -0.25, 1], style: 'zig', px: 0.62 },
    decals: [
      { part: 'body', at: [0, 1.6, 0.46], dir: [0, 0, 1], rows: tomoe(11, { ring: 'g', fill: 'g', bg: '.' }), cmap: { g: { c: '#ffb02a', glow: 2 } }, px: 0.62, lift: vs * 0.5 },
      { part: 'tail4', at: [0.2, 1.15, -1.6], dir: [1, 0, 0], rows: LANTERN_TEXT, cmap: { k: '#2a0d0a' }, px: 0.8, lift: vs * 0.5, mirror: true },
      { part: 'nobori1', at: [0.04, 2.15, -0.56], dir: [1, 0, 0], rows: LANTERN_TEXT, cmap: { k: '#5a0e0c' }, px: 0.8, lift: vs * 0.5, mirror: true },
          ],
    fx: [
      { part: 'tail4', at: [0, 1.48, -1.6], type: 'flame', rate: 1.6, scale: 1.9 },
      { part: 'tail4', at: [0, 1.5, -1.6], type: 'ember', rate: 1.5, scale: 1.3 },
      { part: 'nobori1', at: [0, 2.68, -0.7], type: 'ember', rate: 0.8, scale: 1.1 },
      { part: 'noboriL', at: [0.45, 2.3, -0.62], type: 'ember', rate: 0.5, scale: 1, mirror: true },
      { part: 'body', at: [0, 1.1, 0.45], type: 'ember', rate: 0.5, scale: 1 },
      { part: 'head', at: [0.055, 2.06, 0.7], type: 'smoke', rate: 0.25, scale: 0.6, mirror: true },
      { part: 'armL', at: [0.64, 0.95, 0.36], type: 'ember', rate: 0.4, scale: 0.9, mirror: true },
    ],
  };
  DESIGNS.infernobori = scaleDesign(DESIGNS.infernobori, 0.94);
  LORE.infernobori = {
    name: 'Infernobori', element: 'pyro', stage: 3, height: '2.4 m',
    desc: 'Legends say it stood guard over Osaka through the Long Blackout, its banner-fins blazing like a festival that refused to end. Magma runs through the cracks of its basalt hide.',
    personality: 'Proud, patient guardian; slow to anger, impossible to move once it decides to protect something.',
    look: 'Towering basalt-plated dragon with glowing magma cracks and a molten belly, three tall nobori-banner flame fins on its back, a crown of ember-tipped horns, massive glowing-knuckle fists, a chest crest with a burning mitsudomoe, and a tail strung with small lanterns ending in a great chōchin.',
  };
}

// =====================================================================
// HYDRO 1 — TAKOPO
// =====================================================================
{
  const vs = 0.022;
  const MC = [0, 0.37, -0.02], MR = [0.2, 0.2, 0.19];          // mantle
  const N = 8;
  // goggle lens facing forward-up, sitting on the mantle surface
  const goggle = (sx) => {
    const S = onEll(MC, MR, [sx * 0.4, 0.55, 0.78]), u = norm3([sx * 0.3, 0.5, 1]);
    const at = (k) => [S[0] + u[0] * k, S[1] + u[1] * k, S[2] + u[2] * k];
    return [
      ['cyl', at(-0.02), at(0.045), 0.066, 'o', { jit: 0.03 }],
      ['cyl', at(0.0), at(0.056), 0.047, 'g', { jit: 0.02 }],
      ['sph', [at(0.055)[0] - sx * 0.02, at(0.055)[1] + 0.02, at(0.055)[2]], 0.013, 'w', { jit: 0 }],
      ['sph', [at(0.055)[0] + sx * 0.014, at(0.055)[1] - 0.014, at(0.055)[2]], 0.013, 'G', { jit: 0 }],
    ];
  };
  // tentacles radiate from the skirt, rest on the ground and curl their tips up
  const tents = ring(N, 1, Math.PI / N, (a, sx, cz, i) => {
    const d = [sx, 0, cz], P = (r, y) => [d[0] * r, y, d[2] * r];
    const piv = P(0.1, 0.13);
    if (i === 1) { // water-pistol tentacle: raised to the side, tip pointing forward
      const pts = [piv, P(0.19, 0.09), [0.25, 0.15, 0.13], [0.27, 0.23, 0.18], [0.26, 0.255, 0.255]];
      return { n: 'tent' + (i + 1), parent: 'body', p: piv, s: [
        ['sph', piv, 0.045, 'b'],
        ...tube(pts, 0.044, 0.026, 'b', { belly: 'l', bellyT: 0.3 }),
        ['cyl', [0.26, 0.255, 0.25], [0.258, 0.257, 0.29], 0.024, 'o'],
        ['cyl', [0.258, 0.257, 0.285], [0.257, 0.258, 0.3], 0.013, 'k'],
      ] };
    }
    const pts = [piv, P(0.18, 0.06), P(0.25, 0.035), P(0.31, 0.05), P(0.33, 0.095)];
    return { n: 'tent' + (i + 1), parent: 'body', p: piv, s: [
      ['sph', piv, 0.045, 'b'],
      ...tube(pts, 0.046, 0.016, 'b', { belly: 'l', bellyT: 0.2 }),
    ] };
  });
  DESIGNS.takopo = {
    id: 'takopo', vs, arch: 'octo',
    pal: {
      b: '#3aa8e6', d: '#2378bd', t: '#7fd6ff', l: '#fff0d6', p: '#ff8ea0', o: '#ff9a2e', O: '#ffc15a',
      g: '#1d3a66', G: '#5fd2ff', w: '#ffffff', k: '#1b2a3a',
    },
    anim: { quirk: ['sway', 'nod'], bounce: 1.3, gait: 1, stride: 1, maxSpeed: 3.6 },
    parts: [
      { n: 'body', p: [0, 0.14, 0], s: [
        ['ell', [0, 0.15, 0], [0.16, 0.09, 0.15], 'b', { belly: 'l', bellyT: 0.5 }],
      ] },
      { n: 'head', parent: 'body', p: [0, 0.2, 0], s: [
        ['ell', MC, MR, 'b', { spots: { col: 't', d: 0.13, s: 0.065, seed: 3 } }],
        ['box', [0, 0.31, 0.08], [0.145, 0.085, 0.1], 'b', { round: 0.065 }],          // flat face
        ['ell', [0.11, 0.27, 0.17], [0.032, 0.02, 0.02], 'p', { m: 1, paint: 1, jit: 0 }],  // blush
        ['cap', [0, 0.235, 0.16], [0, 0.23, 0.205], 0.03, 0.027, 'p'],                  // pursed siphon mouth
        // swim goggles pushed up on the forehead
        ['tor', [0, 0.445, -0.02], 0.19, 0.017, 'o', { rot: [-14, 0, 0] }],
        ...goggle(1), ...goggle(-1),
        ['cap', [0.03, 0.5, 0.16], [-0.03, 0.5, 0.16], 0.014, 0.014, 'o'],
      ] },
      ...tents,
    ],
    eyes: { part: 'head', at: [0.074, 0.322, 0.18], dir: [0.1, 0.02, 1], style: 'big', iris: '#1d4f8f', px: 0.85 },
    mouth: { part: 'head', at: [0, 0.232, 0.21], dir: [0, 0, 1], style: 'tiny', px: 1 },
    fx: [
      { part: 'tent2', at: [0.257, 0.258, 0.31], type: 'drip', rate: 0.7, scale: 0.6 },
      { part: 'head', at: [0, 0.24, 0.23], type: 'bubble', rate: 0.35, scale: 0.6 },
    ],
  };
  LORE.takopo = {
    name: 'Takopo', element: 'hydro', stage: 1, height: '0.6 m',
    desc: 'Hatched in the canals beneath Dōtonbori, it calculates the arc of every water shot before it fires. Street vendors keep a respectful distance from its grill-side stare.',
    personality: 'Calm and analytical; quietly counts everything, and gets flustered only when someone orders takoyaki.',
    look: 'Round sky-teal baby octopus with cream suckers, huge calm navy eyes, oversized orange swim goggles pushed up on its forehead, a pursed little siphon mouth, and one tentacle curled up like a water pistol.',
  };
}

// =====================================================================
// HYDRO 2 — TAKOMMANDO
// =====================================================================
{
  const vs = 0.032;
  const MC = [0, 0.84, -0.05], MR = [0.27, 0.31, 0.27];         // mantle
  const N = 8;
  const band = (a, b, r) => ['cyl', a, b, r, 'm', { jit: 0.03 }];   // scope ring around a tentacle
  const tents = ring(N, 1, Math.PI / N, (a, sx, cz, i) => {
    const P = (r, y) => [sx * r, y, cz * r];
    const piv = P(0.13, 0.5);
    if (i === 0) { // sniper tentacle: held level and straight like a rifle
      const pts = [piv, [0.1, 0.52, 0.28], [0.08, 0.55, 0.46], [0.07, 0.56, 0.66]];
      return { n: 'tent1', parent: 'body', p: piv, s: [
        ['sph', piv, 0.07, 'b'],
        ...tube(pts, 0.07, 0.038, 'b', { belly: 'l', bellyT: 0.3 }),
        band([0.093, 0.528, 0.33], [0.09, 0.532, 0.37], 0.07),
        band([0.08, 0.548, 0.48], [0.079, 0.551, 0.52], 0.06),
        ['cyl', [0.07, 0.56, 0.62], [0.069, 0.562, 0.74], 0.034, 'm'],
        ['cyl', [0.069, 0.562, 0.735], [0.069, 0.562, 0.76], 0.024, 'c', { glow: 2 }],
        ['box', [0.08, 0.61, 0.5], [0.02, 0.018, 0.07], 'm'],                                 // scope
        ['cyl', [0.08, 0.61, 0.57], [0.08, 0.61, 0.585], 0.018, 'c', { glow: 2 }],
      ] };
    }
    const pts = [piv, P(0.29, 0.4), P(0.38, 0.2), P(0.44, 0.05), P(0.53, 0.035), P(0.6, 0.075)];
    return { n: 'tent' + (i + 1), parent: 'body', p: piv, s: [
      ['sph', piv, 0.072, 'b'],
      ...tube(pts, 0.072, 0.022, 'b', { belly: 'l', bellyT: 0.25 }),
      band(P(0.33, 0.315), P(0.345, 0.28), 0.066),
    ] };
  });
  DESIGNS.takommando = {
    id: 'takommando', vs, arch: 'octo',
    pal: {
      b: '#2a92d8', d: '#1b5f9e', t: '#62c4f5', l: '#fbe6c8', m: '#3a4250', M: '#6a7484', o: '#ff8a24', O: '#c95f12',
      c: '#6ff3ff', G: '#46d8ff', p: '#e97b8f', k: '#1b2a3a',
    },
    anim: { quirk: ['nod', 'sway'], bounce: 0.9, gait: 0.95, stride: 1, maxSpeed: 4.2 },
    parts: [
      { n: 'body', p: [0, 0.5, 0], s: [
        ['ell', [0, 0.53, -0.02], [0.22, 0.1, 0.2], 'b', { belly: 'l', bellyT: 0.5 }],
      ] },
      { n: 'head', parent: 'body', p: [0, 0.58, -0.02], s: [
        ['ell', MC, MR, 'b', { spots: { col: 't', d: 0.12, s: 0.08, seed: 5 } }],
        ['box', [0, 0.73, 0.09], [0.2, 0.12, 0.14], 'b', { round: 0.085 }],                   // flat face
        ['box', [0, 0.765, 0.165], [0.215, 0.05, 0.085], 'm', { round: 0.03 }],                // visor housing
        ['box', [-0.215, 0.77, 0.15], [0.04, 0.055, 0.06], 'M', { round: 0.015 }],             // rangefinder
        ['cyl', [-0.22, 0.77, 0.2], [-0.22, 0.77, 0.225], 0.03, 'c', { glow: 2 }],
        ['cap', [-0.23, 0.82, 0.14], [-0.25, 1.0, 0.1], 0.019, 0.016, 'M'],                    // antenna
        ['sph', [-0.25, 1.0, 0.1], 0.016, 'o', { glow: 1 }],
        ['cap', [0, 0.655, 0.2], [0, 0.645, 0.258], 0.04, 0.034, 'p'],                         // siphon
        // orange bandana headband + harness belt
        ['tor', [0, 0.885, -0.05], 0.27, 0.032, 'o', { rot: [-6, 0, 0], stripes: { axis: 'x', p: 0.07, w: 0.022, col: 'O' } }],
        ['sph', [0, 0.87, -0.33], 0.05, 'o'],
        ['tor', [0, 0.635, -0.04], 0.255, 0.024, 'm'],
        // water-tank backpack
        ['cap', [0, 0.68, -0.38], [0, 0.95, -0.38], 0.105, 0.105, 'G', { glow: 1, jit: 0.02 }],
        ['cyl', [0, 0.62, -0.38], [0, 0.69, -0.38], 0.112, 'm'],
        ['cyl', [0, 0.94, -0.38], [0, 1.0, -0.38], 0.1, 'm'],
        ['cyl', [0, 0.8, -0.38], [0, 0.83, -0.38], 0.115, 'M'],
        ['cap', [0, 1.0, -0.38], [0, 1.05, -0.38], 0.03, 0.03, 'o'],
        ...tube([[0.09, 0.66, -0.36], [0.24, 0.6, -0.2], [0.24, 0.56, 0.05], [0.16, 0.55, 0.18]], 0.022, 0.022, 'M'),
      ] },
      { n: 'band', parent: 'head', p: [0, 0.87, -0.34], sway: { axis: 'y', amp: 0.3, freq: 1.8 }, s: [
        ...tube([[0.03, 0.87, -0.35], [0.12, 0.82, -0.44], [0.18, 0.72, -0.48]], 0.03, 0.022, 'o'),
        ...tube([[-0.03, 0.87, -0.35], [-0.1, 0.85, -0.47], [-0.16, 0.78, -0.53]], 0.03, 0.022, 'o'),
      ] },
      ...tents,
    ],
    eyes: { part: 'head', at: [0.085, 0.766, 0.255], dir: [0, 0, 1], style: 'visor', iris: '#6ff3ff', px: 0.82 },
    mouth: { part: 'head', at: [0, 0.645, 0.27], dir: [0, 0, 1], style: 'tiny', px: 1 },
    fx: [
      { part: 'tent1', at: [0.069, 0.562, 0.78], type: 'drip', rate: 0.8, scale: 0.8 },
      { part: 'head', at: [0, 1.06, -0.38], type: 'bubble', rate: 0.5, scale: 0.8 },
    ],
  };
  LORE.takommando = {
    name: 'Takommando', element: 'hydro', stage: 2, height: '1.2 m',
    desc: 'Runs silent recon along the rooftops of Shinsekai, ranging targets with its visor before a single pressurised shot. It never fires twice at the same spot.',
    personality: 'Cool, terse and methodical; speaks in clicks and only ever smiles at a perfect hit.',
    look: 'Tactical octopus standing tall on its tentacles: glowing cyan targeting visor with a rangefinder and antenna, orange bandana with flowing tails, gunmetal scope rings on its arms, one tentacle held level as a sniper barrel, and a glowing water-tank backpack feeding it through a hose.',
  };
}

// =====================================================================
// HYDRO 3 — ADMIRAKEN
// =====================================================================
{
  const vs = 0.05;
  const N = 8;
  const tents = ring(N, 1, Math.PI / N, (a, sx, cz, i) => {
    const P = (r, y) => [sx * r, y, cz * r];
    const piv = P(0.28, 0.64);
    let pts;
    if (i === 3 || i === 4) {       // battery arms: rise behind the mantle, cannons aimed forward
      const s = Math.sign(sx);
      pts = [piv, [s * 0.2, 0.6, -0.55], [s * 0.42, 0.95, -0.72], [s * 0.6, 1.4, -0.62], [s * 0.66, 1.72, -0.38], [s * 0.64, 1.86, -0.18]];
    } else if (i === 0 || i === N - 1) {
      pts = [piv, P(0.5, 0.5), P(0.7, 0.34), P(0.84, 0.3), P(0.95, 0.38)];
    } else {
      pts = [piv, P(0.52, 0.44), P(0.72, 0.2), P(0.88, 0.09), P(1.02, 0.1), P(1.1, 0.2)];
    }
    const tip = pts[pts.length - 1], prev = pts[pts.length - 2];
    const u = norm3([tip[0] - prev[0], tip[1] - prev[1], tip[2] - prev[2]]);
    const at = (k) => [tip[0] + u[0] * k, tip[1] + u[1] * k, tip[2] + u[2] * k];
    return { n: 'tent' + (i + 1), parent: 'body', p: piv, s: [
      ['sph', piv, 0.15, 'b'],
      ...tube(pts, 0.155, 0.075, 'b', { belly: 'l', bellyT: 0.2 }),
      // brass cannon nozzle: breech ring, barrel, muzzle flare, dark bore
      ['cyl', at(-0.06), at(0.02), 0.1, 'Y'],
      ['cyl', at(0.0), at(0.34), 0.058, 'c', { jit: 0.04 }],
      ['cyl', at(0.12), at(0.15), 0.07, 'Y'],
      ['cyl', at(0.32), at(0.39), 0.088, 'c'],
      ['cyl', at(0.36), at(0.4), 0.048, 'C', { glow: 2, jit: 0 }],
    ], _muzzle: at(0.44) };
  });
  const hatShape = [[-0.78, 0], [-0.6, 0.15], [-0.32, 0.31], [0, 0.38], [0.32, 0.31], [0.6, 0.15], [0.78, 0], [0.5, 0.06], [0, 0.09], [-0.5, 0.06]];
  const hatInner = hatShape.map(([x, y]) => [x * 0.9, y * 0.8 - 0.004]);
  const SK = [0, 0.82, 0], SR = [0.52, 0.32, 0.48];
  // point on the back-swept (rotated -28° about x) mantle surface along local direction d
  const mantleSurf = (d) => {
    const l = onEll([0, 0, 0], [0.47, 0.6, 0.5], d), t = -28 * D2R;
    return [l[0], 1.6 + l[1] * Math.cos(t) - l[2] * Math.sin(t), -0.26 + l[1] * Math.sin(t) + l[2] * Math.cos(t)];
  };
  const lapel = (sx) => stroke([onEll(SK, SR, [sx * 0.42, 0.9, 0.7]), onEll(SK, SR, [sx * 0.34, 0.2, 1]), onEll(SK, SR, [sx * 0.36, -0.5, 1])], 0.042, 'y');
  const buttons = [1, -1].flatMap((sx) => [0.55, 0.15, -0.25].map((v) => ['sph', onEll(SK, SR, [sx * 0.62, v, 0.85]), 0.045, 'y', { jit: 0 }]));
  DESIGNS.admiraken = {
    id: 'admiraken', vs, arch: 'octo',
    pal: {
      b: '#2b9bd4', d: '#1f78b4', t: '#7fd0f5', l: '#fbe8cc', n: '#1e2a55', N: '#33437e', y: '#f2c14e', Y: '#a8761f',
      w: '#f6f3ea', r: '#d23a3f', k: '#141a26', c: '#d9a441', C: '#5ff0ff', G: '#8ff6ff',
    },
    anim: { quirk: ['nod', 'sway'], bounce: 0.6, gait: 0.8, stride: 0.9, maxSpeed: 3.6 },
    parts: [
      { n: 'body', p: [0, 0.72, 0], s: [
        ['ell', SK, SR, 'b', { belly: 'l', bellyT: 0.5 }],
        ['ell', [0, 0.86, -0.1], [0.56, 0.37, 0.5], 'n', { paint: 1 }],                        // naval coat (open front)
        ['box', [0, 0.82, 0.5], [0.16, 0.4, 0.12], 'b', { paint: 1, belly: 'l', bellyT: 0.5 }],
        ...lapel(1), ...lapel(-1),
        ...buttons,
        ['tor', [0, 0.6, 0], 0.44, 0.045, 'y'],                                                // gold hem
      ] },
      { n: 'head', parent: 'body', p: [0, 1.02, -0.04], s: [
        ['ell', [0, 1.6, -0.26], [0.47, 0.6, 0.5], 'b', { rot: [-28, 0, 0], spots: { col: 't', d: 0.12, s: 0.12, seed: 9 } }],
        ...[[0.55, 0.45, -0.6], [0.7, 0.05, -0.6], [0.35, 0.75, -0.5], [0.8, -0.35, -0.3], [0.0, 0.55, -0.85], [0.25, 0.2, -0.95]].map((d) => ['sph', mantleSurf(d), 0.05, 'G', { m: 1, paint: 1, glow: 1, jit: 0 }]),
        ['ell', [0, 1.25, 0.1], [0.44, 0.32, 0.38], 'b'],                                      // face bulb
        ['box', [0, 1.27, 0.25], [0.35, 0.16, 0.23], 'b', { round: 0.12 }],                    // flat face
        ['tor', [0, 1.05, -0.02], 0.42, 0.045, 'y'],                                           // collar trim
        // curled admiral moustache
        ...tube(bez([0.03, 1.165, 0.49], [0.2, 1.09, 0.5], [0.3, 1.18, 0.45], 4), 0.055, 0.03, 'l', { m: 1 }),
        ['sph', [0.31, 1.23, 0.43], 0.035, 'l', { m: 1 }],
        // monocle chain
        ...tube([[0.33, 1.27, 0.45], [0.42, 1.12, 0.42], [0.44, 1.0, 0.36]], 0.017, 0.017, 'y'),
      ] },
      { n: 'hat', parent: 'head', p: [0, 1.92, -0.12], s: [
        ['poly', [0, 1.9, -0.12], hatShape, 0.14, 'y', { plane: 'xy', rot: [-18, 0, 0] }],
        ['poly', [0, 1.9, -0.12], hatInner, 0.145, 'n', { plane: 'xy', rot: [-18, 0, 0] }],
        ['cyl', [0.0, 2.07, 0.0], [0.0, 2.08, 0.06], 0.1, 'w'],                                 // cockade
        ['cyl', [0.0, 2.07, 0.02], [0.0, 2.08, 0.075], 0.066, 'r'],
      ] },
      { n: 'finL', parent: 'head', p: [0.42, 1.12, -0.06], mirror: true, s: [
        ['ell', [0.56, 1.13, -0.06], [0.2, 0.055, 0.18], 'y', { rot: [0, 0, -20] }],
        ['ell', [0.56, 1.15, -0.06], [0.12, 0.045, 0.11], 'n', { rot: [0, 0, -20] }],
        ...[-0.12, -0.04, 0.04, 0.12].map((dz) => ['cyl', [0.72, 1.06, -0.06 + dz], [0.74, 0.94, -0.06 + dz], 0.026, 'y', { jit: 0.05 }]),
        ['cyl', [0.66, 1.08, 0.08], [0.67, 0.97, 0.09], 0.026, 'y'], ['cyl', [0.66, 1.08, -0.2], [0.67, 0.97, -0.21], 0.026, 'y'],
      ] },
      ...tents.map(({ _muzzle, ...t }) => t),
    ],
    eyes: { part: 'head', at: [0.165, 1.3, 0.48], dir: [0.06, 0.02, 1], style: 'sharp', iris: '#f2c14e', px: 1.05 },
    mouth: { part: 'head', at: [0, 1.06, 0.42], dir: [0, -0.4, 1], style: 'smile', px: 0.75 },
    decals: [
      { part: 'head', at: [0.165, 1.3, 0.48], dir: [0.06, 0.02, 1], rows: pix(11, (x, y, r) => (r > 0.74 && r < 1.02 ? 'y' : '')), cmap: { y: '#f2c14e' }, px: 0.6, lift: 0.05 },
      { part: 'hat', at: [0, 2.075, 0.08], dir: [0, 0, 1], rows: ['.y.', 'yyy', '.y.', 'y.y', '.y.'], cmap: { y: '#f2c14e' }, px: 0.55, lift: 0.02 },
    ],
    fx: [
      ...[3, 4].map((i) => ({ part: 'tent' + (i + 1), at: tents[i]._muzzle, type: 'steam', rate: 0.35, scale: 1 })),
      { part: 'head', at: [0, 2.15, -0.5], type: 'bubble', rate: 0.6, scale: 1.4 },
      { part: 'body', at: [0.3, 0.4, 0.5], type: 'drip', rate: 0.4, scale: 1.2, mirror: true },
    ],
  };
  LORE.admiraken = {
    name: 'Admiraken', element: 'hydro', stage: 3, height: '2.2 m',
    desc: 'Commands the flooded harbour districts from beneath its bicorne, plotting eight cannon arcs at once. Rival trainers swear it predicted their moves before they made them.',
    personality: 'Imperious strategic genius with impeccable manners; strokes its moustache when three moves ahead.',
    look: 'Massive sea-blue kraken in a navy admiral coat with gold buttons and a stand-up collar, a gold-trimmed bicorne hat with a red cockade, gold epaulette fins with fringe, a monocle on one sharp golden eye, a curled cream moustache, and eight tentacles ending in brass cannon nozzles.',
  };
}

// =====================================================================
// BIO 1 — MOCHIKA
// =====================================================================
const SAKURA = ['.p.p.', 'ppppp', '.pyp.', 'pp.pp', '.p.p.'];
{
  const vs = 0.022;
  const C = [0, 0.27, -0.02], R = [0.17, 0.155, 0.21];           // body
  const HC = [0, 0.45, 0.17], HR = [0.15, 0.135, 0.135];          // head
  const spots = [[0.35, 1, 0.3], [-0.42, 1, 0.05], [0.5, 0.85, -0.4], [-0.15, 1, -0.45], [0.05, 1, 0.0], [-0.6, 0.7, 0.45], [0.7, 0.55, 0.05]];
  DESIGNS.mochika = {
    id: 'mochika', vs, arch: 'quad',
    pal: {
      p: '#f7aecb', P: '#e98aae', w: '#fff8f5', h: '#b8707f', n: '#d46a8a', g: '#7dd36a', G: '#4fae4f', y: '#ffe07a', e: '#ffd6e4', k: '#5a3442',
    },
    anim: { quirk: ['sniff', 'stretch'], bounce: 1.4, gait: 1.05, stride: 0.9, tail: 1.5, maxSpeed: 3.6 },
    parts: [
      { n: 'body', p: [0, 0.22, 0], s: [
        ['ell', C, R, 'w', { jit: 0.03 }],
        ['ell', [0, 0.37, -0.04], [0.19, 0.15, 0.24], 'p', { paint: 1, jit: 0.03 }],
      ] },
      { n: 'head', parent: 'body', p: [0, 0.37, 0.13], s: [
        ['sph', [0, 0.38, 0.12], 0.085, 'w'],
        ['ell', HC, HR, 'p', { belly: 'w', bellyT: 0.35, jit: 0.03 }],
        ['box', [0, 0.44, 0.22], [0.115, 0.07, 0.09], 'p', { round: 0.055, jit: 0.03 }],          // flat face
        ['ell', [0, 0.395, 0.285], [0.065, 0.048, 0.055], 'w', { jit: 0.02 }],                   // muzzle
        ['sph', [0, 0.418, 0.336], 0.017, 'n', { jit: 0 }],                                      // nose
        ['ell', [0.085, 0.405, 0.27], [0.03, 0.018, 0.02], 'n', { m: 1, paint: 1, jit: 0 }],      // blush
      ] },
      { n: 'sprout', parent: 'head', p: [0, 0.575, 0.15], sway: { axis: 'z', amp: 0.18, freq: 1.1 }, s: [
        ['cap', [0, 0.57, 0.15], [0.0, 0.64, 0.16], 0.012, 0.01, 'G'],
        ['ell', [0.04, 0.655, 0.16], [0.045, 0.014, 0.025], 'g', { rot: [0, 0, 22] }],
        ['ell', [-0.04, 0.655, 0.16], [0.045, 0.014, 0.025], 'g', { rot: [0, 0, -22] }],
      ] },
      { n: 'earL', parent: 'head', p: [0.1, 0.53, 0.13], mirror: true, s: [
        ['ell', [0.175, 0.585, 0.12], [0.085, 0.036, 0.046], 'p', { rot: [0, -10, 38], jit: 0.03 }],
        ['ell', [0.18, 0.59, 0.14], [0.062, 0.02, 0.022], 'e', { rot: [0, -10, 38], jit: 0.02 }],
      ] },
      { n: 'legFL', parent: 'body', p: [0.085, 0.17, 0.1], mirror: true, s: [
        ['sph', [0.085, 0.17, 0.1], 0.05, 'w'],
        ['cap', [0.088, 0.16, 0.105], [0.092, 0.04, 0.115], 0.044, 0.038, 'w'],
        ['cyl', [0.092, 0.045, 0.115], [0.092, 0.0, 0.118], 0.038, 'h'],
      ] },
      { n: 'legBL', parent: 'body', p: [0.095, 0.18, -0.14], mirror: true, s: [
        ['sph', [0.095, 0.18, -0.14], 0.058, 'w'],
        ['cap', [0.098, 0.17, -0.14], [0.1, 0.04, -0.13], 0.05, 0.04, 'w'],
        ['cyl', [0.1, 0.045, -0.13], [0.1, 0.0, -0.128], 0.04, 'h'],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.32, -0.22], s: [
        ['sph', [0, 0.34, -0.25], 0.05, 'w', { jit: 0.02 }],
      ] },
    ],
    eyes: { part: 'head', at: [0.064, 0.45, 0.31], dir: [0.12, 0.02, 1], style: 'anime', iris: '#b04f7c', px: 0.78 },
    mouth: { part: 'head', at: [0, 0.383, 0.335], dir: [0, -0.3, 1], style: 'smile', px: 0.5 },
    decals: spots.map((d, i) => {
      const at = onEll(C, [R[0] + 0.01, R[1] + 0.01, R[2] + 0.01], d);
      return { part: 'body', at, dir: norm3([d[0] / R[0], d[1] / R[1], d[2] / R[2]].map((v, k) => v * [R[1] * R[2], R[0] * R[2], R[0] * R[1]][k])), rows: SAKURA, cmap: { p: '#fffafc', y: '#ffd36b' }, px: 0.85, lift: 0.01, roll: i * 23 };
    }),
    fx: [
      { part: 'sprout', at: [0, 0.68, 0.16], type: 'spore', rate: 0.4, scale: 0.6, color: '#ffd1e3' },
      { part: 'body', at: [0, 0.45, -0.05], type: 'petal', rate: 0.35, scale: 0.7 },
    ],
  };
  LORE.mochika = {
    name: 'Mochika', element: 'bio', stage: 1, height: '0.6 m',
    desc: 'A fawn as soft as fresh mochi that naps under the cherry trees of Nara Park. Its sprout perks up when someone is hurt, and its gentle breath helps wounds close.',
    personality: 'Sleepy, sweet and endlessly patient; bows politely to everyone it meets.',
    look: 'Round mochi-soft fawn with a pastel-pink back, white belly and legs, sakura flower spots, a two-leaf sprout on its head, little leaf-shaped ears and drowsy gentle eyes.',
  };
}

// =====================================================================
// BIO 2 — HANASHIKA
// =====================================================================
{
  const vs = 0.034;
  const C = [0, 0.78, -0.04], R = [0.2, 0.19, 0.36];             // body
  const HC = [0, 1.2, 0.43], HR = [0.12, 0.11, 0.13];             // head
  // sakura antler (left side; mirrored by m:1): wood beams + blossom clusters + glowing pollen
  const beams = [
    bez([0.05, 1.29, 0.4], [0.17, 1.46, 0.36], [0.23, 1.66, 0.25], 5),
    bez([0.14, 1.42, 0.37], [0.22, 1.47, 0.42], [0.29, 1.52, 0.48], 3),
    bez([0.2, 1.57, 0.3], [0.29, 1.6, 0.31], [0.35, 1.66, 0.34], 3),
    bez([0.23, 1.66, 0.25], [0.27, 1.73, 0.27], [0.29, 1.8, 0.31], 2),
    bez([0.23, 1.66, 0.25], [0.21, 1.74, 0.18], [0.19, 1.79, 0.12], 2),
  ];
  const blooms = [[0.29, 1.53, 0.48, 0.075], [0.35, 1.67, 0.34, 0.08], [0.29, 1.81, 0.31, 0.075], [0.19, 1.8, 0.12, 0.07], [0.21, 1.51, 0.38, 0.06], [0.25, 1.65, 0.22, 0.065], [0.13, 1.41, 0.39, 0.05], [0.24, 1.74, 0.26, 0.06], [0.3, 1.59, 0.3, 0.05]];
  const squash = (p) => [p[0], 1.29 + (p[1] - 1.29) * 0.78, p[2]];
  const antler = [
    ...beams.flatMap((b, i) => tube(b.map(squash), i === 0 ? 0.032 : 0.024, 0.017, 'r', { m: 1 })),
    ...blooms.map(([x, y, z, r]) => [...squash([x, y, z]), r]).flatMap(([x, y, z, r], i) => [
      ['sph', [x, y, z], r, 'B', { m: 1, noise: 0.012, noiseScale: 0.03, spots: { col: 'b', d: 0.35, s: 0.03, seed: i } }],
      ['sph', [x + 0.01, y + r * 0.55, z + r * 0.55], 0.024, 'y', { m: 1, glow: 2, jit: 0 }],
    ]),
  ];
  const mane = [0, 1, 2, 3].map((i) => ['ell', [0, 1.2 - i * 0.075, 0.33 - i * 0.05], [0.03, 0.07, 0.05], i % 2 ? 'b' : 'B', { rot: [-35, 0, 0] }]);
  const spots = [[0.3, 1, 0.5], [-0.3, 1, 0.25], [0.4, 0.9, -0.05], [-0.35, 0.95, -0.35], [0.2, 1, -0.6], [-0.1, 1, 0.0], [0.6, 0.6, 0.3], [-0.65, 0.55, -0.2]];
  DESIGNS.hanashika = {
    id: 'hanashika', vs, arch: 'quad',
    pal: {
      p: '#ec9ab8', P: '#d77a9d', w: '#fff3ee', h: '#6e3d46', r: '#8a5a44', B: '#ffb3cf', b: '#fff0f5', y: '#ffe36b', n: '#c75b82', e: '#ffd1e1', g: '#7fd36a',
    },
    anim: { quirk: ['sniff', 'stretch', 'nod'], bounce: 0.9, gait: 0.95, stride: 1.1, tail: 1.2, maxSpeed: 5 },
    parts: [
      { n: 'body', p: [0, 0.72, 0], s: [
        ['ell', C, R, 'p', { belly: 'w', bellyT: 0.3 }],
        ['ell', [0, 0.85, 0.2], [0.17, 0.17, 0.17], 'p', { belly: 'w', bellyT: 0.3 }],         // chest
        ['ell', [0, 0.74, 0.27], [0.12, 0.12, 0.08], 'w', { paint: 1 }],
      ] },
      { n: 'neck', parent: 'body', p: [0, 0.92, 0.25], s: [
        ['sph', [0, 0.92, 0.25], 0.11, 'p'],
        ['cap', [0, 0.92, 0.26], [0, 1.13, 0.38], 0.105, 0.08, 'p', { front: 'w', frontT: 0.45 }],
        ...mane,
      ] },
      { n: 'head', parent: 'neck', p: [0, 1.13, 0.38], s: [
        ['ell', HC, HR, 'p', { belly: 'w', bellyT: 0.5 }],
        ['box', [0, 1.21, 0.49], [0.1, 0.06, 0.07], 'p', { round: 0.045 }],                   // flat face
        ['ell', [0, 1.14, 0.56], [0.068, 0.058, 0.09], 'w'],                                  // muzzle
        ['sph', [0, 1.165, 0.645], 0.022, 'h', { jit: 0 }],
        ['ell', [0.075, 1.165, 0.54], [0.03, 0.016, 0.02], 'n', { m: 1, paint: 1, jit: 0 }],
        ...antler,
      ] },
      { n: 'earL', parent: 'head', p: [0.09, 1.27, 0.4], mirror: true, s: [
        ['ell', [0.16, 1.3, 0.39], [0.085, 0.032, 0.04], 'p', { rot: [0, -15, 28] }],
        ['ell', [0.165, 1.303, 0.405], [0.06, 0.016, 0.018], 'e', { rot: [0, -15, 28] }],
        ['cap', [0.24, 1.335, 0.37], [0.27, 1.35, 0.365], 0.014, 0.006, 'g'],
      ] },
      { n: 'legFL', parent: 'body', p: [0.11, 0.7, 0.2], mirror: true, s: [
        ['sph', [0.11, 0.7, 0.2], 0.08, 'p'],
        ['cap', [0.11, 0.69, 0.2], [0.12, 0.38, 0.22], 0.07, 0.045, 'p', { front: 'w', frontT: 0.5 }],
        ['cap', [0.12, 0.38, 0.22], [0.12, 0.07, 0.22], 0.042, 0.036, 'w'],
        ['cyl', [0.12, 0.075, 0.225], [0.12, 0.0, 0.23], 0.042, 'h'],
      ] },
      { n: 'legBL', parent: 'body', p: [0.12, 0.74, -0.25], mirror: true, s: [
        ['sph', [0.12, 0.74, -0.25], 0.1, 'p'],
        ['cap', [0.125, 0.72, -0.25], [0.13, 0.44, -0.33], 0.1, 0.05, 'p', { belly: 'w' }],
        ['cap', [0.13, 0.44, -0.33], [0.13, 0.07, -0.28], 0.045, 0.036, 'w'],
        ['cyl', [0.13, 0.075, -0.28], [0.13, 0.0, -0.275], 0.042, 'h'],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.86, -0.38], s: [
        ['ell', [0, 0.92, -0.42], [0.05, 0.08, 0.04], 'w', { rot: [-25, 0, 0] }],
        ['sph', [0, 0.99, -0.44], 0.035, 'B'],
      ] },
    ],
    eyes: { part: 'head', at: [0.06, 1.21, 0.535], dir: [0.18, 0.02, 1], style: 'anime', iris: '#a33d6a', px: 0.72 },
    mouth: { part: 'head', at: [0, 1.11, 0.62], dir: [0, -0.4, 1], style: 'smile', px: 0.5 },
    decals: spots.map((d, i) => ({ part: 'body', at: onEll(C, R, d), dir: norm3([d[0] / R[0] ** 2, d[1] / R[1] ** 2, d[2] / R[2] ** 2].map((v, k) => v * R[k])), rows: SAKURA, cmap: { p: '#fffafc', y: '#ffd36b' }, px: 0.7, lift: 0.015, roll: i * 31 })),
    fx: [
      { part: 'head', at: [0.29, 1.73, 0.31], type: 'petal', rate: 0.5, scale: 0.9, mirror: true },
      { part: 'head', at: [0.35, 1.62, 0.34], type: 'spore', rate: 0.5, scale: 0.7, color: '#ffe36b', mirror: true },
    ],
  };
  LORE.hanashika = {
    name: 'Hanashika', element: 'bio', stage: 2, height: '1.3 m (1.8 m to antler tips)',
    desc: 'Its antlers burst into full sakura bloom whenever it shields a friend. Pollen shaken from the blossoms soothes pain and lulls angry Elemon to sleep.',
    personality: 'Graceful, caring and quietly protective; stamps a hoof when anyone picks on the small.',
    look: 'Slender rose-pink deer with a cream belly and white sakura spots, branching wooden antlers heavy with pink blossoms and glowing pollen, a petal mane along its neck, leaf-shaped ears and long elegant legs.',
  };
}

// =====================================================================
// BIO 3 — SHINRINOH
// =====================================================================
{
  const vs = 0.05;
  const C = [0, 1.22, -0.12], R = [0.36, 0.34, 0.64];             // body
  const HC = [0, 1.9, 0.7], HR = [0.19, 0.17, 0.2];               // head
  // antler-trees: bark beams branching up into a canopy
  const beams = [
    bez([0.08, 2.03, 0.66], [0.2, 2.15, 0.62], [0.3, 2.3, 0.52], 4),
    bez([0.3, 2.3, 0.52], [0.42, 2.36, 0.58], [0.52, 2.4, 0.64], 3),
    bez([0.3, 2.3, 0.52], [0.36, 2.42, 0.4], [0.4, 2.48, 0.3], 3),
    bez([0.18, 2.13, 0.63], [0.12, 2.28, 0.72], [0.1, 2.38, 0.78], 3),
  ];
  const canopy = [
    ['ell', [0.34, 2.46, 0.5], [0.3, 0.13, 0.26], 'g', { m: 1, noise: 0.04, noiseScale: 0.09, dither: { col: 'G', amt: 0.25 } }],
    ['ell', [0.0, 2.52, 0.56], [0.24, 0.12, 0.24], 'g', { noise: 0.04, noiseScale: 0.09, dither: { col: 'G', amt: 0.25 } }],
    ['ell', [0.52, 2.38, 0.66], [0.18, 0.1, 0.17], 'G', { m: 1, noise: 0.035, noiseScale: 0.08, dither: { col: 'g', amt: 0.3 } }],
    ['ell', [0.22, 2.57, 0.4], [0.2, 0.1, 0.2], 'G', { m: 1, noise: 0.035, noiseScale: 0.08 }],
  ];
  const blossoms = [[0.45, 2.55, 0.55], [0.2, 2.62, 0.48], [0.05, 2.62, 0.68], [0.6, 2.45, 0.7], [0.3, 2.5, 0.75], [0.55, 2.52, 0.38]]
    .map((p, i) => ['sph', p, 0.055, i % 2 ? 'B' : 'b', { m: 1, jit: 0.03 }]);
  const fruit = [[0.5, 2.22, 0.66], [0.22, 2.28, 0.74], [0.6, 2.25, 0.45], [0.05, 2.33, 0.86]];
  const lanternFruit = fruit.flatMap(([x, y, z]) => [
    ['cyl', [x, y + 0.14, z], [x, y + 0.03, z], 0.028, 'r', { m: 1 }],
    ['ell', [x, y - 0.03, z], [0.055, 0.065, 0.055], 'o', { m: 1, glow: 2, jit: 0 }],
    ['cyl', [x, y + 0.02, z], [x, y + 0.06, z], 0.035, 'r', { m: 1 }],
  ]);
  // kodama tree spirits perched in the canopy
  const kodama = (x, y, z, s = 1) => [
    ['cap', [x, y, z], [x, y + 0.08 * s, z], 0.04 * s, 0.035 * s, 'K', { glow: 1, jit: 0 }],
    ['sph', [x, y + 0.14 * s, z], 0.058 * s, 'K', { glow: 1, jit: 0 }],
  ];
  const kod = [[0.36, 2.6, 0.6], [-0.44, 2.52, 0.48], [0.02, 2.66, 0.6]];
  const mossStrands = [-0.25, -0.1, 0.05, 0.2].map((z, i) => ['cap', [0.36, 1.35, z + 0.2], [0.4, 1.12 - (i % 2) * 0.06, z + 0.18], 0.045, 0.025, i % 2 ? 'M' : 'm', { m: 1, noise: 0.012, noiseScale: 0.05 }]);
  const rootFoot = (x, z) => [
    ['cap', [x, 0.16, z], [x, 0.0, z], 0.075, 0.09, 'R', { noise: 0.012, noiseScale: 0.06 }],
    ...[[0.14, 0.06], [-0.1, 0.12], [0.02, -0.15], [0.12, -0.08]].map(([dx, dz]) => ['cap', [x, 0.08, z], [x + dx, 0.015, z + dz], 0.04, 0.018, 'R']),
  ];
  const bark = { stripes: { axis: 'x', p: 0.07, w: 0.025, col: 'R' }, noise: 0.012, noiseScale: 0.06 };
  DESIGNS.shinrinoh = {
    id: 'shinrinoh', vs, arch: 'quad',
    pal: {
      w: '#f2ead9', W: '#e2d5bd', p: '#e3a1b8', r: '#7a5538', R: '#55392a', g: '#4f9a46', G: '#77c25a', m: '#5d8f3e', M: '#8bbf5c',
      B: '#ffb3cf', b: '#fff0f5', o: '#ffb347', K: '#e9fff0', h: '#4a3a33', n: '#3a2b2b', j: '#7dffb0',
    },
    anim: { quirk: ['stretch', 'nod'], bounce: 0.6, gait: 0.8, stride: 1, tail: 0.8, maxSpeed: 4.5 },
    parts: [
      { n: 'body', p: [0, 1.15, 0], s: [
        ['ell', C, R, 'w', { belly: 'W', bellyT: 0.4 }],
        ['ell', [0, 1.32, 0.3], [0.33, 0.33, 0.3], 'w', { belly: 'W', bellyT: 0.4 }],          // chest
        // moss cloak over the shoulders
        ['ell', [0, 1.5, 0.25], [0.42, 0.24, 0.42], 'm', { noise: 0.03, noiseScale: 0.08, dither: { col: 'M', amt: 0.3 } }],
        ...mossStrands,
        ['ell', [0, 1.38, -0.4], [0.34, 0.2, 0.3], 'p', { paint: 1, spots: { col: 'b', d: 0.25, s: 0.08, seed: 4 } }],  // sakura rump
      ] },
      { n: 'neck', parent: 'body', p: [0, 1.5, 0.42], s: [
        ['sph', [0, 1.5, 0.42], 0.17, 'w'],
        ['cap', [0, 1.5, 0.44], [0, 1.8, 0.62], 0.17, 0.13, 'w', { front: 'W', frontT: 0.5 }],
        ['ell', [0, 1.6, 0.46], [0.2, 0.14, 0.17], 'm', { noise: 0.03, noiseScale: 0.07, dither: { col: 'M', amt: 0.3 } }],
      ] },
      { n: 'head', parent: 'neck', p: [0, 1.8, 0.62], s: [
        ['ell', HC, HR, 'w'],
        ['box', [0, 1.92, 0.8], [0.15, 0.08, 0.1], 'w', { round: 0.06 }],                       // flat face
        ['ell', [0, 1.8, 0.92], [0.11, 0.09, 0.14], 'W'],                                       // muzzle
        ['sph', [0, 1.84, 1.05], 0.035, 'n', { jit: 0 }],
        ...beams.flatMap((b, i) => tube(b, i === 0 ? 0.05 : 0.035, 0.025, 'r', { m: 1 })),
        ...canopy, ...blossoms, ...lanternFruit,
        ...kod.flatMap(([x, y, z], i) => kodama(x, y, z, i === 2 ? 0.8 : 1)),
      ] },
      { n: 'earL', parent: 'head', p: [0.15, 1.98, 0.66], mirror: true, s: [
        ['ell', [0.26, 2.0, 0.64], [0.13, 0.035, 0.065], 'g', { rot: [0, -15, 22] }],
        ['cap', [0.16, 1.98, 0.645], [0.37, 2.07, 0.62], 0.012, 0.008, 'M'],
      ] },
      { n: 'legFL', parent: 'body', p: [0.2, 1.12, 0.32], mirror: true, s: [
        ['sph', [0.2, 1.12, 0.32], 0.15, 'w'],
        ['cap', [0.2, 1.1, 0.32], [0.22, 0.6, 0.36], 0.13, 0.085, 'w'],
        ['cap', [0.22, 0.62, 0.36], [0.22, 0.14, 0.36], 0.085, 0.075, 'r', bark],
        ...rootFoot(0.22, 0.36),
      ] },
      { n: 'legBL', parent: 'body', p: [0.21, 1.15, -0.5], mirror: true, s: [
        ['sph', [0.21, 1.15, -0.5], 0.17, 'w'],
        ['cap', [0.21, 1.12, -0.5], [0.23, 0.68, -0.62], 0.17, 0.09, 'w'],
        ['cap', [0.23, 0.7, -0.62], [0.23, 0.14, -0.55], 0.085, 0.075, 'r', bark],
        ...rootFoot(0.23, -0.55),
      ] },
      { n: 'tail', parent: 'body', p: [0, 1.36, -0.72], s: [
        ['ell', [0, 1.42, -0.78], [0.07, 0.11, 0.06], 'w', { rot: [-30, 0, 0] }],
        ['ell', [0, 1.53, -0.8], [0.06, 0.04, 0.05], 'G', { noise: 0.015, noiseScale: 0.04 }],
      ] },
    ],
    eyes: { part: 'head', at: [0.085, 1.925, 0.9], dir: [0.15, 0.02, 1], style: 'anime', iris: '#2a9a6a', px: 0.7, cmap: { k: '#2b2420' } },
    mouth: { part: 'head', at: [0, 1.75, 1.0], dir: [0, -0.5, 1], style: 'line', px: 0.6 },
    decals: [
      { part: 'head', at: [0, 2.035, 0.84], dir: [0, 0.6, 1], rows: ['..j..', '.jjj.', 'jjjjj', '.jjj.', '..j..', '..j..'], cmap: { j: { c: '#7dffb0', glow: 2 } }, px: 0.55, lift: 0.025 },
      ...kod.flatMap(([x, y, z], i) => { const s = i === 2 ? 0.8 : 1; return [{ part: 'head', at: [x, y + 0.15 * s, z + 0.06 * s], dir: [0, 0, 1], rows: ['k.k'], cmap: { k: '#1a2a1e' }, px: 0.38 * s, lift: 0.012 }]; }),
    ],
    fx: [
      { part: 'head', at: [0.35, 2.4, 0.55], type: 'leaf', rate: 0.6, scale: 1.2, mirror: true },
      { part: 'head', at: [0.0, 2.6, 0.6], type: 'spore', rate: 0.8, scale: 1, color: '#9dffb8' },
      { part: 'head', at: [0.5, 2.18, 0.66], type: 'glow', rate: 0.6, scale: 0.7, color: '#ffb347', mirror: true },
      { part: 'body', at: [0, 1.35, -0.4], type: 'petal', rate: 0.4, scale: 1.1 },
    ],
  };
  DESIGNS.shinrinoh = scaleDesign(DESIGNS.shinrinoh, 0.82);
  LORE.shinrinoh = {
    name: 'Shinrinoh', element: 'bio', stage: 3, height: '2.3 m',
    desc: 'Said to be as old as the first forest on Mount Ikoma, it carries a living grove upon its antlers where kodama spirits sleep. Where it walks, cracked concrete sprouts moss and blossoms.',
    personality: 'Ancient, serene and unhurried; its calm can end a battle without a single blow.',
    look: 'Majestic ivory stag spirit with a moss cloak over its shoulders, bark-textured legs ending in spreading roots, a sakura-dappled rump, leaf ears, a glowing leaf sigil on its brow and half-lidded jade eyes; its antlers grow into a small tree canopy hung with glowing lantern fruit and tiny kodama spirits.',
  };
}

// Kasa straw hat: shallow stepped cone (stacked discs) with darker weave rings.
// base = brim centre, R = brim radius, H = crown height, tilt = degrees about x.
function kasa(base, R, H, tilt, vs, { col = 'y', weave = 'Y', steps: steps0 = 6 } = {}) {
  let steps = steps0;
  const out = [], rot = [tilt, 0, 0], ca = Math.cos(tilt * D2R), sa = Math.sin(tilt * D2R);
  const at = (h) => [base[0], base[1] + h * ca, base[2] + h * sa];
  steps = Math.max(2, Math.min(steps, Math.round(H / vs) + 1));
  for (let i = 0; i < steps; i++) {
    const t = i / steps, r = R * (1 - t) + vs * 0.8 * t, h0 = H * t, h1 = H * (i + 1) / steps;
    out.push(['cyl', at(h0), at(h1), r, col, { jit: 0.05 }]);
  }
  out.push(['cap', at(H), at(H + vs * 1.2), vs * 0.9, vs * 0.5, weave]);
  for (const f of [0.92, 0.6, 0.3]) out.push(['tor', at(H * (1 - f) + vs * 0.3), R * f, vs * 0.55, weave, { rot }]);
  return out;
}

// =====================================================================
// GEO 1 — CLAYKI
// =====================================================================
{
  const vs = 0.023;
  const HC = [0, 0.445, 0.03], HR = [0.17, 0.148, 0.15];         // head
  const clay = { dither: { col: 'C', amt: 0.12 } };
  DESIGNS.clayki = {
    id: 'clayki', vs, arch: 'biped',
    pal: {
      c: '#bf6744', C: '#a3502f', l: '#f3dcb5', d: '#4a2f25', D: '#33201a', y: '#e8b95e', Y: '#b9862f', g: '#6cc24a', G: '#3f8f35', n: '#2a1a16', p: '#ec8c7c',
    },
    anim: { quirk: ['sway', 'scratch'], bounce: 1.3, gait: 1.1, stride: 1, tail: 1.3, maxSpeed: 3.4 },
    parts: [
      { n: 'body', p: [0, 0.18, 0], s: [
        ['ell', [0, 0.215, 0], [0.15, 0.15, 0.135], 'c', clay],
        ['ell', [0, 0.2, 0.07], [0.12, 0.118, 0.08], 'l', { paint: 1 }],                        // round belly
      ] },
      { n: 'head', parent: 'body', p: [0, 0.33, 0.01], s: [
        ['sph', [0, 0.34, 0.0], 0.08, 'c'],
        ['ell', HC, HR, 'c', clay],
        ['box', [0, 0.43, 0.105], [0.135, 0.075, 0.075], 'c', { round: 0.05 }],                // flat face
        ['ell', [0.062, 0.44, 0.16], [0.06, 0.045, 0.04], 'd', { m: 1, paint: 1, rot: [0, 0, -12] }],   // tanuki mask
        ['ell', [0, 0.395, 0.17], [0.066, 0.045, 0.05], 'l'],                                 // muzzle
        ['sph', [0, 0.418, 0.218], 0.019, 'n', { jit: 0 }],
        ['ell', [0, 0.53, 0.14], [0.03, 0.04, 0.02], 'l', { paint: 1 }],                        // forehead blaze
        ['ell', [0.112, 0.385, 0.14], [0.026, 0.016, 0.018], 'p', { m: 1, paint: 1, jit: 0 }],
      ] },
      { n: 'earL', parent: 'head', p: [0.11, 0.55, 0.0], mirror: true, s: [
        ['ell', [0.125, 0.575, -0.005], [0.048, 0.045, 0.028], 'c'],
        ['ell', [0.128, 0.575, 0.012], [0.026, 0.026, 0.012], 'd'],
      ] },
      { n: 'hat', parent: 'head', p: [0, 0.58, -0.04], s: [
        // kasa straw hat worn tipped back: wide shallow cone, weave rings, leaf stuck on top
        ...kasa([0, 0.578, -0.035], 0.26, 0.1, -16, vs),
      ] },
      { n: 'leaf', parent: 'hat', p: [0, 0.69, -0.065], sway: { axis: 'z', amp: 0.2, freq: 1.2 }, s: [
        ['cap', [0, 0.69, -0.065], [0.0, 0.72, -0.06], 0.01, 0.008, 'G'],
        ['ell', [0.0, 0.75, -0.055], [0.042, 0.055, 0.012], 'g', { rot: [0, 0, -25] }],
        ['cap', [-0.012, 0.72, -0.05], [0.018, 0.785, -0.05], 0.006, 0.006, 'G', { paint: 1 }],
      ] },
      { n: 'armL', parent: 'body', p: [0.135, 0.28, 0.02], mirror: true, s: [
        ['sph', [0.135, 0.28, 0.02], 0.045, 'd'],
        ['cap', [0.14, 0.275, 0.02], [0.17, 0.17, 0.06], 0.043, 0.04, 'd'],
        ['sph', [0.172, 0.16, 0.065], 0.042, 'd'],
      ] },
      { n: 'legL', parent: 'body', p: [0.075, 0.1, 0.0], mirror: true, s: [
        ['sph', [0.075, 0.1, 0.0], 0.055, 'd'],
        ['cap', [0.078, 0.095, 0.0], [0.082, 0.035, 0.02], 0.052, 0.045, 'd'],
        ['ell', [0.083, 0.025, 0.04], [0.05, 0.026, 0.065], 'D'],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.14, -0.11], s: [
        ['sph', [0, 0.14, -0.11], 0.06, 'c'],
        ['cap', [0, 0.14, -0.11], [0, 0.18, -0.23], 0.068, 0.095, 'c', { stripes: { axis: 'z', p: 0.07, w: 0.024, col: 'd', o: -0.2 } }],
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 0.18, -0.23], s: [
        ['ell', [0, 0.25, -0.29], [0.1, 0.11, 0.1], 'c', { noise: 0.008, noiseScale: 0.03, stripes: { axis: 'y', p: 0.07, w: 0.025, col: 'd', o: 0.0 } }],
        ['sph', [0, 0.34, -0.31], 0.055, 'd'],
      ] },
    ],
    eyes: { part: 'head', at: [0.062, 0.445, 0.18], dir: [0.12, 0.02, 1], style: 'anime', iris: '#ffb347', px: 0.72, cmap: { k: '#1a0f0c' } },
    mouth: { part: 'head', at: [0, 0.378, 0.215], dir: [0, -0.3, 1], style: 'smile', px: 0.55 },
    fx: [
      { part: 'body', at: [0, 0.02, 0], type: 'dust', rate: 0.25, scale: 0.6 },
    ],
  };
  LORE.clayki = {
    name: 'Clayki', element: 'geo', stage: 1, height: '0.65 m (0.8 m with hat)',
    desc: 'A tanuki cub fired in the old kilns of Shigaraki. It naps on shop doorsteps for good luck and ducks under its straw hat whenever trouble comes.',
    personality: 'Easy-going and good-humoured, but stubborn as a rock once it has decided where to sit.',
    look: 'Chubby terracotta tanuki cub with a cream round belly, dark tanuki mask and limbs, big fluffy striped tail, an oversized straw kasa hat tipped back on its head with a lucky leaf stuck on top.',
  };
}

// =====================================================================
// GEO 2 — TANUKILN
// =====================================================================
// blue-and-white sometsuke porcelain dish pattern: rim bands + five-petal flower
const SOMETSUKE = pix(15, (x, y, r, a) => {
  if (r > 1.02) return '';
  if (r > 0.86) return 'B';
  if (r > 0.78) return 'W';
  if (r > 0.7) return 'b';
  if (r < 0.14) return 'W';
  if (r < 0.58 && r < (Math.cos(5 * (a + 0.31)) * 0.5 + 0.5) * 0.42 + 0.16) return 'B';
  return 'W';
});
{
  const vs = 0.035;
  const TC = [0, 0.64, 0], TR = [0.28, 0.3, 0.25];               // torso
  const HC = [0, 1.06, 0.03], HR = [0.22, 0.19, 0.19];            // head
  const clay = { dither: { col: 'C', amt: 0.12 } };
  const glaze = (o = {}) => ({ jit: 0.02, spots: { col: 'B', d: 0.32, s: 0.035, seed: 7 }, ...o });
  DESIGNS.tanukiln = {
    id: 'tanukiln', vs, arch: 'biped',
    pal: {
      c: '#b9643f', C: '#9c4e30', l: '#f3dcb5', d: '#4a2f25', D: '#33201a', W: '#f2f5fa', B: '#2a55b5', b: '#7fa3e0',
      y: '#e8b95e', Y: '#b9862f', g: '#6cc24a', G: '#3f8f35', n: '#2a1a16', p: '#ec8c7c', r: '#6b3a22',
    },
    anim: { quirk: ['flex', 'sway', 'scratch'], bounce: 0.9, gait: 0.9, stride: 0.95, tail: 1, maxSpeed: 3.8 },
    parts: [
      { n: 'body', p: [0, 0.5, 0], s: [
        ['ell', TC, TR, 'c', clay],
        ['ell', [0, 0.58, 0.05], [0.26, 0.25, 0.22], 'c', clay],
        // porcelain belly dish
        ['cyl', [0, 0.6, 0.1], [0, 0.6, 0.285], 0.215, 'W', { jit: 0.02 }],
        ['tor', [0, 0.6, 0.27], 0.215, 0.025, 'B', { axis: 'z' }],
        // obi sash + straw-hat shield strapped on the back
        ['tor', [0, 0.8, 0.0], 0.26, 0.03, 'r', { rot: [0, 0, 28] }],
        ...kasa([0, 0.76, -0.27], 0.46, 0.15, -90, vs),
        // ceramic hyōtan gourd at the right hip
        ['cap', [-0.18, 0.86, 0.05], [-0.27, 0.6, 0.14], 0.012, 0.012, 'r'],
        ['sph', [-0.28, 0.46, 0.13], 0.085, 'W', glaze()],
        ['sph', [-0.28, 0.585, 0.13], 0.06, 'W', glaze()],
        ['cyl', [-0.28, 0.63, 0.13], [-0.28, 0.67, 0.13], 0.022, 'r'],
      ] },
      { n: 'head', parent: 'body', p: [0, 0.9, 0.02], s: [
        ['sph', [0, 0.92, 0.01], 0.13, 'c'],
        ['ell', HC, HR, 'c', clay],
        ['box', [0, 1.04, 0.13], [0.17, 0.09, 0.09], 'c', { round: 0.06 }],                    // flat face
        ['ell', [0.078, 1.05, 0.2], [0.075, 0.055, 0.05], 'd', { m: 1, paint: 1, rot: [0, 0, -12] }],   // mask
        ['ell', [0, 0.985, 0.215], [0.085, 0.058, 0.06], 'l'],                                // muzzle
        ['sph', [0, 1.015, 0.272], 0.024, 'n', { jit: 0 }],
        // glazed porcelain helmet cap with cobalt rim + crest
        ['ell', [0, 1.15, 0.02], [0.235, 0.14, 0.205], 'W', glaze({ spots: { col: 'b', d: 0.25, s: 0.04, seed: 2 } })],
        ['ell', [0, 1.11, 0.02], [0.24, 0.05, 0.21], 'B', { paint: 1 }],
        ['cap', [0, 1.27, 0.06], [0, 1.33, 0.11], 0.035, 0.02, 'B'],
        ['ell', [0.14, 0.96, 0.17], [0.03, 0.018, 0.02], 'p', { m: 1, paint: 1, jit: 0 }],
      ] },
      { n: 'earL', parent: 'head', p: [0.15, 1.2, 0.0], mirror: true, s: [
        ['ell', [0.17, 1.24, -0.01], [0.06, 0.06, 0.035], 'c'],
        ['ell', [0.172, 1.24, 0.012], [0.034, 0.034, 0.015], 'd'],
      ] },
      { n: 'armL', parent: 'body', p: [0.27, 0.82, 0.02], mirror: true, s: [
        ['sph', [0.29, 0.86, 0.02], 0.11, 'W', glaze()],                                        // porcelain pauldron
        ['tor', [0.29, 0.8, 0.02], 0.085, 0.022, 'B'],
        ['cap', [0.28, 0.82, 0.02], [0.33, 0.6, 0.06], 0.075, 0.068, 'd'],
        ['cap', [0.33, 0.6, 0.06], [0.35, 0.44, 0.12], 0.075, 0.072, 'W', glaze()],
        ['cyl', [0.35, 0.455, 0.115], [0.352, 0.43, 0.125], 0.08, 'B'],
        ['sph', [0.355, 0.4, 0.14], 0.07, 'd'],
      ] },
      { n: 'legL', parent: 'body', p: [0.14, 0.42, 0.0], mirror: true, s: [
        ['sph', [0.14, 0.42, 0.0], 0.12, 'd'],
        ['cap', [0.15, 0.4, 0.0], [0.16, 0.12, 0.03], 0.12, 0.1, 'd'],
        ['cap', [0.16, 0.32, 0.05], [0.165, 0.14, 0.07], 0.105, 0.1, 'W', glaze()],               // shin guard
        ['cyl', [0.165, 0.15, 0.07], [0.165, 0.12, 0.07], 0.11, 'B'],
        ['ell', [0.165, 0.05, 0.07], [0.1, 0.055, 0.14], 'D'],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.42, -0.2], s: [
        ['sph', [0, 0.42, -0.2], 0.1, 'c'],
        ['cap', [0, 0.42, -0.2], [0, 0.34, -0.42], 0.11, 0.15, 'c', { stripes: { axis: 'z', p: 0.1, w: 0.035, col: 'd', o: -0.4 } }],
        ['tor', [0, 0.38, -0.32], 0.135, 0.022, 'W', { rot: [70, 0, 0] }],
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 0.34, -0.42], s: [
        ['ell', [0, 0.4, -0.55], [0.16, 0.17, 0.16], 'c', { noise: 0.01, noiseScale: 0.04, stripes: { axis: 'y', p: 0.1, w: 0.036, col: 'd' } }],
        ['sph', [0, 0.54, -0.6], 0.08, 'd'],
      ] },
    ],
    eyes: { part: 'head', at: [0.078, 1.055, 0.22], dir: [0.12, 0.02, 1], style: 'anime', iris: '#ffb347', px: 0.72, cmap: { k: '#1a0f0c' } },
    mouth: { part: 'head', at: [0, 0.965, 0.27], dir: [0, -0.3, 1], style: 'smile', px: 0.62 },
    decals: [
      { part: 'body', at: [0, 0.6, 0.3], dir: [0, 0, 1], rows: SOMETSUKE, cmap: { B: '#2a55b5', b: '#7fa3e0', W: '#f2f5fa' }, px: 0.78, lift: vs * 0.5 },
      { part: 'head', at: [0, 1.2, 0.2], dir: [0, 0.5, 1], rows: ['..B..', '.BBB.', 'BBBBB', '.BBB.', '..B..', '..B..'], cmap: { B: '#2a55b5' }, px: 0.6, lift: vs * 0.5 },
    ],
    fx: [
      { part: 'body', at: [0, 0.02, 0], type: 'dust', rate: 0.3, scale: 0.9 },
    ],
  };
  LORE.tanukiln = {
    name: 'Tanukiln', element: 'geo', stage: 2, height: '1.3 m',
    desc: 'Every scar Tanukiln takes is fired hard in its inner kiln, so it only grows tougher. It plants its straw-hat shield in the street and nothing gets past.',
    personality: 'Steadfast, warm and immovable; shares its gourd of tea with friends after every fight.',
    look: 'Sturdy terracotta tanuki armoured in glazed blue-and-white sometsuke porcelain: a dish-shaped belly plate with a cobalt flower, striped pauldrons, bracers and shin guards, a glazed helmet cap, a wide straw-hat shield strapped to its back, a porcelain gourd at the hip and a ringed striped tail.',
  };
}

// =====================================================================
// GEO 3 — DOGUGAIA
// =====================================================================
{
  const vs = 0.055;
  const TC = [0, 1.22, 0], TR = [0.58, 0.55, 0.46];              // torso
  const HC = [0, 2.04, 0.06], HR = [0.42, 0.34, 0.36];             // head
  const cr = vs * 0.62;
  const rope = (o = {}) => ({ stripes: { axis: 'y', p: 0.05, w: 0.022, col: 'S' }, ...o });   // jōmon cord texture
  const cracks = [
    crackEll(TC, TR, [0.55, 0.7, 0.55], [0.95, -0.2, 0.3], { seed: 21, r: cr, col: 'a', mirror: true }),
    crackEll(TC, TR, [0.3, 0.5, -1], [0.8, -0.4, -0.6], { seed: 25, r: cr, col: 'a', mirror: true }),
    crackEll(TC, TR, [0.0, 0.9, -0.5], [0.2, -0.2, -1], { seed: 27, r: cr, col: 'a' }),
  ].flat();
  DESIGNS.dogugaia = {
    id: 'dogugaia', vs, arch: 'biped',
    pal: {
      s: '#a8714f', S: '#8a5a3d', L: '#cfa27a', d: '#3d2a22', a: '#ffb03a', m: '#6a9a48', M: '#93c062', k: '#241812',
    },
    anim: { quirk: ['flex', 'roar'], bounce: 0.5, gait: 0.75, stride: 0.8, tail: 0.7, maxSpeed: 3.2 },
    parts: [
      { n: 'body', p: [0, 0.8, 0], s: [
        ['ell', TC, TR, 's', { dither: { col: 'S', amt: 0.12 } }],
        ['ell', [0, 1.06, 0.1], [0.52, 0.46, 0.42], 's', { dither: { col: 'S', amt: 0.12 } }],          // tanuki belly
        ['ell', [0, 1.62, -0.02], [0.72, 0.22, 0.42], 's', { dither: { col: 'S', amt: 0.12 } }],         // shoulder yoke
        // raised jōmon spiral rings on the belly + cord waist band
        ['tor', [0, 1.06, 0.47], 0.36, 0.035, 'L', { axis: 'z' }],
        ['tor', [0, 1.06, 0.5], 0.24, 0.035, 'L', { axis: 'z' }],
        ['tor', [0, 1.06, 0.52], 0.12, 0.035, 'L', { axis: 'z' }],
        ['sph', [0, 1.06, 0.53], 0.05, 'a', { glow: 2 }],
        ['tor', [0, 0.72, 0.03], 0.47, 0.05, 'L', rope()],
        ['tor', [0, 1.5, 0.0], 0.6, 0.045, 'L', rope()],
        ...cracks,
        // stone kasa shield on the back (the line's straw hat, now fired stone) with moss
        ...kasa([0, 1.42, -0.46], 0.78, 0.22, -98, vs, { col: 'S', weave: 'L' }),
        ['ell', [0.25, 1.95, -0.52], [0.22, 0.08, 0.1], 'm', { noise: 0.03, noiseScale: 0.07, dither: { col: 'M', amt: 0.3 } }],
        // mossy shoulders
        ['ell', [0.46, 1.78, 0.0], [0.3, 0.1, 0.3], 'm', { m: 1, noise: 0.04, noiseScale: 0.09, dither: { col: 'M', amt: 0.3 } }],
        ['cap', [0.6, 1.72, 0.18], [0.64, 1.56, 0.22], 0.04, 0.02, 'm', { m: 1 }],
        ['cap', [0.68, 1.72, -0.1], [0.73, 1.52, -0.12], 0.04, 0.02, 'M', { m: 1 }],
      ] },
      { n: 'head', parent: 'body', p: [0, 1.75, 0.04], s: [
        ['sph', [0, 1.78, 0.03], 0.24, 's'],
        ['ell', HC, HR, 's', { dither: { col: 'S', amt: 0.12 } }],
        ['box', [0, 2.0, 0.24], [0.38, 0.22, 0.22], 's', { round: 0.14 }],                          // flat face
        ['ell', [0, 2.03, 0.4], [0.46, 0.15, 0.14], 'd', { paint: 1 }],                              // tanuki mask band
        // huge shakōki goggle eyes (slit lit by the eye decal)
        ['ell', [0.195, 2.03, 0.43], [0.19, 0.15, 0.11], 'L', { m: 1 }],
        ['tor', [0.195, 2.03, 0.45], 0.18, 0.04, 'd', { m: 1, axis: 'z' }],
        ['ell', [0, 1.83, 0.42], [0.11, 0.055, 0.07], 'L'],                                         // muzzle nub
        // dogū crown ring with knobs
        ['tor', [0, 2.33, 0.04], 0.31, 0.065, 'L', rope()],
        ['sph', [0, 2.43, 0.12], 0.1, 'L'],
        ['sph', [0.23, 2.4, -0.02], 0.08, 'L', { m: 1 }],
        ...crackEll(HC, HR, [0.6, 0.75, -0.4], [0.9, 0.1, -0.5], { seed: 31, r: cr, col: 'a', mirror: true, n: 4 }),
      ] },
      { n: 'earL', parent: 'head', p: [0.32, 2.3, -0.02], mirror: true, s: [
        ['ell', [0.38, 2.38, -0.03], [0.11, 0.11, 0.065], 's'],
        ['ell', [0.385, 2.38, 0.02], [0.06, 0.06, 0.028], 'd'],
      ] },
      { n: 'armL', parent: 'body', p: [0.64, 1.55, 0.0], mirror: true, s: [
        ['sph', [0.64, 1.55, 0.0], 0.2, 's'],
        ['cap', [0.66, 1.5, 0.0], [0.74, 1.12, 0.06], 0.19, 0.17, 's', rope()],
        ['ell', [0.78, 0.86, 0.12], [0.3, 0.29, 0.3], 'S', { dither: { col: 's', amt: 0.2 } }],      // stone fist
        ['cap', [0.58, 0.97, 0.37], [0.98, 0.97, 0.35], 0.075, 0.075, 'L'],                        // knuckle ridge
        ...crackCap([0.66, 1.5, 0.0], [0.74, 1.12, 0.06], 0.19, 0.17, 0.3, { seed: 33, r: cr, col: 'a' }),
        ['sph', [0.78, 0.9, 0.43], 0.045, 'a', { glow: 2 }],
      ] },
      { n: 'legL', parent: 'body', p: [0.3, 0.74, 0.0], mirror: true, s: [
        ['sph', [0.3, 0.74, 0.0], 0.27, 's'],
        ['cap', [0.31, 0.7, 0.0], [0.34, 0.25, 0.05], 0.28, 0.25, 's', { dither: { col: 'S', amt: 0.15 } }],
        ['tor', [0.33, 0.42, 0.03], 0.27, 0.035, 'L', rope()],
        ['tor', [0.34, 0.3, 0.04], 0.255, 0.035, 'L', rope()],
        ['ell', [0.34, 0.1, 0.1], [0.26, 0.12, 0.32], 'S'],
        ...crackCap([0.31, 0.7, 0.0], [0.34, 0.25, 0.05], 0.28, 0.25, 0.9, { seed: 35, r: cr, col: 'a', t1: 0.5 }),
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.82, -0.38], s: [
        ['sph', [0, 0.82, -0.38], 0.2, 's'],
        ['cap', [0, 0.82, -0.38], [0, 0.66, -0.74], 0.2, 0.28, 's', { stripes: { axis: 'z', p: 0.16, w: 0.05, col: 'd', o: -0.5 } }],
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 0.66, -0.74], s: [
        ['ell', [0, 0.82, -0.95], [0.3, 0.33, 0.3], 's', { noise: 0.02, noiseScale: 0.08, stripes: { axis: 'y', p: 0.16, w: 0.055, col: 'd' } }],
        ['sph', [0, 1.08, -1.0], 0.15, 'd'],
        ['ell', [0.0, 1.17, -1.0], [0.12, 0.06, 0.12], 'm', { noise: 0.03, noiseScale: 0.06 }],
      ] },
    ],
    eyes: { part: 'head', at: [0.195, 2.03, 0.54], dir: [0.06, 0, 1], style: 'visor', iris: '#ffb03a', px: 0.68 },
    mouth: { part: 'head', at: [0, 1.8, 0.47], dir: [0, -0.2, 1], style: 'line', px: 0.75 },
    fx: [
      { part: 'body', at: [0, 0.03, 0.2], type: 'dust', rate: 0.6, scale: 1.6 },
      { part: 'body', at: [0, 1.06, 0.6], type: 'glow', rate: 0.6, scale: 1, color: '#ffb03a' },
      { part: 'head', at: [0, 2.52, 0.1], type: 'leaf', rate: 0.25, scale: 1 },
    ],
  };
  LORE.dogugaia = {
    name: 'Dogugaia', element: 'geo', stage: 3, height: '2.5 m',
    desc: 'An ancient dogū figure that woke when tanuki spirits moved into its hollow clay. When it plants its feet, Osaka’s tectonic plates are said to hold their breath.',
    personality: 'Silent, ancient and utterly immovable; gentle with children, merciless to anyone who threatens them.',
    look: 'Colossal fired-clay dogū golem with a tanuki body plan: huge goggle eyes with glowing amber slits in a dark mask band, a rope-patterned crown and tanuki ears, raised jōmon spiral rings on a round belly, a moss-crusted stone kasa shield on its back, mossy shoulders, massive stone fists, bulbous ringed legs, glowing amber cracks and a giant striped stone tail.',
  };
}

// =====================================================================
// ECHO 1 — KOMORIFF
// =====================================================================
// Euler rotation (deg, XYZ) that maps +y onto unit vector u (for tori / discs along u).
function alignY(u) { const c = -Math.asin(Math.max(-1, Math.min(1, u[0]))), a = Math.atan2(u[2], u[1]); return [a / D2R, 0, c / D2R]; }
// Speaker cone along unit direction u from point p: housing cone, light cone face with dark
// surround, neon rim ring and a glowing dust cap.
function speaker(p, u, depth, R, { housing = 'k', face = 'g', ring = 'K', rim = 'c', cap = 'c', vs = 0.02, m = 0, rimGlow = 1 } = {}) {
  const at = (k) => [p[0] + u[0] * k, p[1] + u[1] * k, p[2] + u[2] * k];
  return [
    ['cap', p, at(depth), R * 0.35, R, housing, { m }],
    ['cyl', at(depth + vs * 0.5), at(depth + R * 1.3), R * 1.4, housing, { m, sub: 1 }],     // flatten the front
    ['cyl', at(depth - vs * 0.7), at(depth + vs * 0.5), R * 0.98, ring, { m, jit: 0.02 }],
    ['cyl', at(depth - vs * 0.2), at(depth + vs * 1.0), R * 0.72, face, { m, jit: 0.04 }],
    ['tor', at(depth + vs * 0.3), R * 0.92, vs * 0.6, rim, { m, glow: rimGlow, rot: alignY(u) }],
    ['sph', at(depth + vs * 0.8), Math.max(R * 0.3, vs * 0.9), cap, { m, glow: 2, jit: 0 }],
  ];
}
// Guitar-pick plate (rounded triangle, point down) in the xy plane at c.
const PICK = (s) => [[-0.5 * s, 0.42 * s], [0, 0.55 * s], [0.5 * s, 0.42 * s], [0.42 * s, 0.05 * s], [0, -0.6 * s], [-0.42 * s, 0.05 * s]];
{
  const vs = 0.02;
  const HC = [0, 0.335, 0.02], HR = [0.15, 0.13, 0.13];
  const earU = norm3([0.5, 0.55, 0.62]);
  const band = bez([0.115, 0.43, 0.0], [0.0, 0.56, 0.0], [-0.115, 0.43, 0.0], 6);
  DESIGNS.komoriff = {
    id: 'komoriff', vs, arch: 'flyer',
    pal: {
      u: '#7b4bd6', U: '#5a34a8', D: '#2a1f3d', l: '#c3b0f5', c: '#3ef0ff', q: '#ff4fd8', g: '#6a6280', K: '#16121f', k: '#211a2e', s: '#d0d0dc', w: '#fff1fb',
    },
    anim: { quirk: ['headbang', 'spin', 'hop'], hover: 0.35, flap: 1.15, bounce: 1.2, maxSpeed: 4.5 },
    parts: [
      { n: 'body', p: [0, 0.2, 0], s: [
        ['ell', [0, 0.2, 0], [0.115, 0.105, 0.1], 'u', { belly: 'l', bellyT: 0.1, front: 'l', frontT: 0.5 }],
      ] },
      { n: 'head', parent: 'body', p: [0, 0.26, 0.01], s: [
        ['sph', [0, 0.27, 0.0], 0.07, 'u'],
        ['ell', HC, HR, 'u'],
        ['box', [0, 0.32, 0.08], [0.115, 0.07, 0.075], 'u', { round: 0.05 }],                 // flat face
        ['ell', [0, 0.285, 0.13], [0.07, 0.04, 0.035], 'l'],                                  // muzzle
        ['sph', [0, 0.305, 0.163], 0.012, 'D', { jit: 0 }],
        ['ell', [0, 0.465, 0.03], [0.05, 0.03, 0.06], 'q', { noise: 0.008, noiseScale: 0.02 }], // fluffy tuft
        // headphone band over the head with a neon stripe
        ...tube(band, 0.02, 0.02, 'k'),
        ...stroke(band.map((p) => [p[0], p[1] + 0.012, p[2] + 0.012]), 0.009, 'c', { glow: 1 }),
      ] },
      { n: 'earL', parent: 'head', p: [0.1, 0.42, 0.0], mirror: true, s: [
        ...speaker([0.1, 0.42, 0.0], earU, 0.1, 0.08, { vs }),
      ] },
      { n: 'wingL', parent: 'body', p: [0.09, 0.25, -0.02], mirror: true, s: [
        ['poly', [0.09, 0.25, -0.03], [[0, 0.03], [0.14, 0.09], [0.27, 0.07], [0.31, 0.0], [0.25, -0.05], [0.2, -0.02], [0.15, -0.08], [0.1, -0.03], [0.04, -0.07], [0, -0.04]], 0.01, 'U', { plane: 'xy', jit: 0.03 }],
        ...tube([[0.09, 0.26, -0.03], [0.22, 0.34, -0.03], [0.37, 0.31, -0.03]], 0.018, 0.012, 'D'),
        ...tube([[0.3, 0.33, -0.03], [0.33, 0.24, -0.03]], 0.013, 0.012, 'D'),
        ...tube([[0.26, 0.335, -0.03], [0.24, 0.23, -0.03]], 0.013, 0.012, 'D'),
        ['poly', [0.39, 0.29, -0.03], PICK(0.085), 0.012, 'c', { plane: 'xy', glow: 1, rot: [0, 0, 30] }],
      ] },
      { n: 'legL', parent: 'body', p: [0.045, 0.12, 0.0], mirror: true, s: [
        ['cap', [0.045, 0.12, 0.0], [0.05, 0.05, 0.01], 0.022, 0.016, 'D'],
        ['ell', [0.05, 0.04, 0.025], [0.025, 0.014, 0.03], 'D'],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.15, -0.08], s: [
        ...tube([[0, 0.15, -0.08], [0, 0.1, -0.15], [0, 0.12, -0.22]], 0.012, 0.012, 'k'),
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 0.12, -0.22], s: [
        ...tube([[0, 0.12, -0.22], [0, 0.17, -0.27], [0, 0.22, -0.27]], 0.012, 0.012, 'k'),
        ['cyl', [0, 0.215, -0.27], [0, 0.25, -0.27], 0.02, 'k'],                               // 3.5 mm jack plug
        ['cyl', [0, 0.25, -0.27], [0, 0.31, -0.27], 0.013, 's', { stripes: { axis: 'y', p: 0.03, w: 0.01, col: 'K' } }],
      ] },
    ],
    eyes: { part: 'head', at: [0.058, 0.335, 0.155], dir: [0.12, 0.02, 1], style: 'big', iris: '#2fd8ff', px: 0.72 },
    mouth: { part: 'head', at: [0, 0.27, 0.165], dir: [0, -0.3, 1], style: 'fang', px: 0.55 },
    fx: [
      { part: 'earL', at: [0.1 + earU[0] * 0.13, 0.42 + earU[1] * 0.13, earU[2] * 0.13], type: 'note', rate: 0.8, scale: 0.6, mirror: true },
    ],
  };
  LORE.komoriff = {
    name: 'Komoriff', element: 'echo', stage: 1, height: '0.55 m',
    desc: 'Roosts under the speakers of Amerikamura record shops and remixes every sound it hears. Its ear-cones can blast a riff loud enough to knock a Kindoru off its feet.',
    personality: 'Mischievous prankster with perfect rhythm; can’t stop headbanging when the beat drops.',
    look: 'Round purple bat with lavender fluff, ears that are glowing speaker cones joined by a headphone band, a magenta hair tuft, guitar-pick wing tips in neon cyan and a tail like an audio cable ending in a jack plug.',
  };
}

// =====================================================================
// ECHO 2 — REVERBAT
// =====================================================================
// Glowing equalizer bars (column heights → rows), cyan base, yellow mids, magenta peaks.
function eqRows(heights, H) {
  const rows = [];
  for (let r = 0; r < H; r++) {
    let row = '';
    for (let i = 0; i < heights.length; i++) {
      const lvl = H - r; // 1 = bottom
      row += (heights[i] >= lvl ? (lvl > H * 0.72 ? 'q' : lvl > H * 0.45 ? 'y' : 'c') : '.') + (i < heights.length - 1 ? '.' : '');
    }
    rows.push(row);
  }
  return rows;
}
const EQ_CMAP = { c: { c: '#3ef0ff', glow: 2 }, y: { c: '#fff35a', glow: 2 }, q: { c: '#ff4fd8', glow: 2 } };
{
  const vs = 0.032;
  const HC = [0, 0.86, 0.03], HR = [0.165, 0.15, 0.15];
  const earL = [   // tall swept fin ears facing forward-outward
    ['poly', [0.12, 0.95, -0.03], [[-0.07, 0], [0.07, 0], [0.12, 0.16], [0.1, 0.36], [0.02, 0.2], [-0.05, 0.1]], 0.024, 'u', { plane: 'xy', rot: [-12, -30, -12] }],
    ['poly', [0.126, 0.97, -0.008], [[-0.035, 0], [0.04, 0], [0.075, 0.14], [0.07, 0.27], [0.015, 0.15]], 0.01, 'q', { plane: 'xy', rot: [-12, -30, -12] }],
  ];
  const mohawk = [0, 1, 2, 3, 4].map((i) => ['cap', [0, 0.96 - i * 0.02, 0.08 - i * 0.07], [0, 1.12 - i * 0.03, 0.04 - i * 0.1], 0.035, 0.01, i % 2 ? 'c' : 'q', { glow: 1 }]);
  const studs = ring(9, 0.13, 0, (a, x, z) => ['cap', [x * 1.05, 0.72, z * 1.05 + 0.01], [x * 1.45, 0.72, z * 1.45 + 0.01], 0.025, 0.014, 's']);
  const dials = [0.17, 0.26, 0.35].map((x, i) => [
    ['cyl', [x, 0.86 - i * 0.012, -0.03], [x, 0.86 - i * 0.012, 0.01], 0.024, 'K'],
    ['cyl', [x, 0.86 - i * 0.012, 0.0], [x, 0.86 - i * 0.012, 0.035], 0.018, 'c', { glow: 1 }],
  ]).flat();
  DESIGNS.reverbat = {
    id: 'reverbat', vs, arch: 'flyer',
    pal: {
      u: '#6f3fd0', U: '#4c2a99', D: '#241a36', l: '#b9a2f0', c: '#3ef0ff', q: '#ff4fd8', g: '#6a6280', K: '#16121f', k: '#211a2e', s: '#d6d6e2', w: '#f4f4ff', b: '#1c1726',
    },
    anim: { quirk: ['headbang', 'spin'], hover: 0.42, flap: 1.0, bounce: 1, maxSpeed: 5 },
    parts: [
      { n: 'body', p: [0, 0.55, 0], s: [
        ['ell', [0, 0.56, 0], [0.165, 0.2, 0.14], 'u', { front: 'l', frontT: 0.6 }],
        ['ell', [0, 0.52, 0.06], [0.11, 0.15, 0.09], 'b'],                                        // dark chest panel
        ['tor', [0, 0.72, 0.01], 0.13, 0.03, 'K'],                                               // studded collar
        ...studs,
      ] },
      { n: 'head', parent: 'body', p: [0, 0.74, 0.02], s: [
        ['sph', [0, 0.76, 0.02], 0.09, 'u'],
        ['ell', HC, HR, 'u'],
        ['box', [0, 0.85, 0.1], [0.13, 0.075, 0.08], 'u', { round: 0.05 }],                     // flat face
        ['ell', [0, 0.8, 0.165], [0.075, 0.04, 0.04], 'l'],                                       // muzzle
        ['sph', [0, 0.82, 0.2], 0.02, 'D', { jit: 0 }],
        ...mohawk,
        ...speaker([0.12, 0.93, 0.0], norm3([0.6, 0.3, 0.7]), 0.035, 0.04, { vs, m: 1 }),       // ear-base speakers
      ] },
      { n: 'earL', parent: 'head', p: [0.1, 0.96, -0.02], mirror: true, s: earL },
      { n: 'wingL', parent: 'body', p: [0.12, 0.68, -0.03], mirror: true, s: [
        ['poly', [0.12, 0.66, -0.04], [[0, 0.04], [0.2, 0.18], [0.42, 0.16], [0.52, 0.05], [0.44, -0.08], [0.36, -0.02], [0.28, -0.14], [0.2, -0.05], [0.1, -0.13], [0, -0.06]], 0.013, 'U', { plane: 'xy', jit: 0.03 }],
        ...tube([[0.12, 0.68, -0.04], [0.32, 0.86, -0.04], [0.58, 0.8, -0.04]], 0.026, 0.016, 'D'),
        ...tube([[0.46, 0.83, -0.04], [0.5, 0.64, -0.04]], 0.013, 0.01, 'D'),
        ...tube([[0.38, 0.85, -0.04], [0.36, 0.6, -0.04]], 0.013, 0.01, 'D'),
        ...dials,
        ['poly', [0.6, 0.77, -0.04], PICK(0.12), 0.014, 'q', { plane: 'xy', glow: 1, rot: [0, 0, 30] }],
      ] },
      { n: 'legL', parent: 'body', p: [0.07, 0.4, 0.0], mirror: true, s: [
        ['cap', [0.07, 0.4, 0.0], [0.08, 0.22, 0.02], 0.04, 0.032, 'D'],
        ['ell', [0.08, 0.2, 0.05], [0.045, 0.03, 0.06], 'K'],
        ['cap', [0.08, 0.2, 0.09], [0.08, 0.2, 0.15], 0.022, 0.016, 's'],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.44, -0.12], s: [
        ...tube([[0, 0.44, -0.12], [0, 0.32, -0.24], [0, 0.32, -0.38]], 0.017, 0.017, 'k'),
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 0.32, -0.38], s: [
        ...tube([[0, 0.32, -0.38], [0, 0.4, -0.46], [0, 0.5, -0.46]], 0.017, 0.017, 'k'),
        ['cyl', [0, 0.49, -0.46], [0, 0.55, -0.46], 0.03, 'K'],
        ['cyl', [0, 0.55, -0.46], [0, 0.64, -0.46], 0.015, 's', { stripes: { axis: 'y', p: 0.03, w: 0.008, col: 'K' } }],
      ] },
    ],
    eyes: { part: 'head', at: [0.06, 0.865, 0.18], dir: [0.12, 0.02, 1], style: 'sharp', iris: '#3ef0ff', px: 0.78 },
    mouth: { part: 'head', at: [0, 0.785, 0.2], dir: [0, -0.3, 1], style: 'fang', px: 0.6 },
    decals: [
      { part: 'body', at: [0, 0.53, 0.16], dir: [0, 0, 1], rows: eqRows([3, 6, 8, 5, 7, 4], 8), cmap: EQ_CMAP, px: 0.55, lift: vs * 0.5 },
    ],
    fx: [
      { part: 'head', at: [0.15, 0.95, 0.06], type: 'note', rate: 0.9, scale: 0.8, mirror: true },
      { part: 'wingL', at: [0.6, 0.77, -0.04], type: 'spark', rate: 0.2, scale: 0.5, color: '#ff4fd8', mirror: true },
    ],
  };
  LORE.reverbat = {
    name: 'Reverbat', element: 'echo', stage: 2, height: '1.1 m (1.3 m to ear tips)',
    desc: 'Plays guerrilla gigs on the rooftops of Namba at 3 a.m. The dials on its wings set its sonic blasts from a tickle to a sound wall.',
    personality: 'Cocky, loud and loyal to its band; never admits it practises.',
    look: 'Lean punk bat with tall fin-like ears and a glowing neon mohawk, small speaker cones at its ear roots, a studded collar, a glowing equalizer stripe on its dark chest panel, amp dials along its wing arms, magenta pick-shaped wing tips and a jack-plug cable tail.',
  };
}

// =====================================================================
// ECHO 3 — AMPLIFURY
// =====================================================================
{
  const vs = 0.05;
  const HC = [0, 1.72, 0.05], HR = [0.24, 0.21, 0.21];
  // amp stack on the shoulder: speaker cabinet with glowing slatted grill + amp head with knobs
  const ampStack = [
    ['box', [0.5, 1.5, -0.03], [0.17, 0.15, 0.15], 'K', { round: 0.02, m: 1 }],
    ['box', [0.5, 1.5, 0.11], [0.135, 0.115, 0.03], 'c', { m: 1, glow: 1, stripes: { axis: 'y', p: 0.05, w: 0.022, col: 'D' } }],
    ...[[0.34, 1.36], [0.66, 1.36], [0.34, 1.64], [0.66, 1.64]].map(([x, y]) => ['box', [x, y, 0.11], [0.03, 0.03, 0.035], 's', { m: 1 }]),
    ['box', [0.5, 1.71, -0.03], [0.15, 0.065, 0.12], 'K', { round: 0.015, m: 1 }],
    ['box', [0.5, 1.71, 0.09], [0.13, 0.04, 0.012], 'y', { m: 1, paint: 0 }],
    ...[0.42, 0.5, 0.58].map((x) => ['cyl', [x, 1.71, 0.08], [x, 1.71, 0.14], 0.03, 'K', { m: 1 }]),
  ];
  const wingCones = [[0.64, 1.32, -0.05, 0.2], [1.02, 1.33, -0.05, 0.15]].flatMap(([x, y, z, R]) => speaker([x, y, z], [0, 0, 1], 0.06, R, { vs, rim: 'q', housing: 'D', rimGlow: 1 }));
  const boa = [
    ['tor', [0, 1.46, 0.0], 0.23, 0.06, 'q', { noise: 0.025, noiseScale: 0.05, dither: { col: 'Q', amt: 0.3 } }],
  ];
  DESIGNS.amplifury = {
    id: 'amplifury', vs, arch: 'flyer',
    pal: {
      u: '#6a38c9', U: '#4a2696', D: '#1e1530', l: '#bba5f2', c: '#3ef0ff', q: '#ff4fd8', Q: '#ff9be8', g: '#6a6280', K: '#15111d', k: '#211a2e', s: '#d9d9e6', y: '#ffd84a', w: '#ffffff',
    },
    anim: { quirk: ['headbang', 'roar', 'spin'], hover: 0.5, flap: 0.8, bounce: 0.9, maxSpeed: 5 },
    parts: [
      { n: 'body', p: [0, 1.1, 0], s: [
        ['ell', [0, 1.15, 0], [0.35, 0.42, 0.27], 'u', { front: 'l', frontT: 0.65 }],
        ['ell', [0, 1.36, -0.02], [0.4, 0.17, 0.26], 'u'],                                         // broad chest
        ['ell', [0, 1.1, 0.1], [0.22, 0.3, 0.18], 'D'],                                         // dark chest panel
        ...boa,
        ...ampStack,
      ] },
      { n: 'head', parent: 'body', p: [0, 1.52, 0.03], s: [
        ['sph', [0, 1.55, 0.02], 0.13, 'u'],
        ['ell', HC, HR, 'u'],
        ['box', [0, 1.71, 0.14], [0.19, 0.11, 0.12], 'u', { round: 0.07 }],                      // flat face
        ['ell', [0, 1.62, 0.23], [0.1, 0.055, 0.055], 'l'],                                       // muzzle
        ['sph', [0, 1.65, 0.28], 0.03, 'D', { jit: 0 }],
        // glam pompadour, magenta fading to cyan
        ['ell', [0, 1.93, -0.06], [0.17, 0.12, 0.24], 'q', { rot: [-22, 0, 0], grad: { axis: 'z', to: 'c', a: 0.05, b: -0.3 }, noise: 0.015, noiseScale: 0.05 }],
        ['ell', [0, 1.92, 0.1], [0.1, 0.08, 0.09], 'q', { noise: 0.01, noiseScale: 0.05 }],
        ...speaker([0.16, 1.84, 0.0], norm3([0.6, 0.35, 0.7]), 0.05, 0.06, { vs, m: 1 }),
      ] },
      { n: 'earL', parent: 'head', p: [0.17, 1.86, -0.03], mirror: true, s: [
        ['poly', [0.19, 1.85, -0.05], [[-0.11, 0], [0.11, 0], [0.19, 0.26], [0.16, 0.56], [0.03, 0.32], [-0.08, 0.16]], 0.035, 'u', { plane: 'xy', rot: [-12, -30, -14] }],
        ['poly', [0.196, 1.87, -0.02], [[-0.055, 0], [0.065, 0], [0.12, 0.22], [0.11, 0.42], [0.025, 0.24]], 0.015, 'q', { plane: 'xy', rot: [-12, -30, -14] }],
      ] },
      { n: 'wingL', parent: 'body', p: [0.27, 1.36, -0.05], mirror: true, s: [
        ['poly', [0.27, 1.34, -0.05], [[0, 0.06], [0.35, 0.28], [0.75, 0.26], [1.1, 0.12], [0.98, -0.06], [0.82, 0.0], [0.7, -0.2], [0.52, -0.06], [0.36, -0.22], [0.2, -0.08], [0, -0.12]], 0.03, 'U', { plane: 'xy', jit: 0.03 }],
        ...tube([[0.27, 1.37, -0.05], [0.68, 1.64, -0.05], [1.4, 1.48, -0.05]], 0.045, 0.025, 'D'),
        ...tube([[1.12, 1.56, -0.05], [1.22, 1.26, -0.05]], 0.026, 0.02, 'D'),
        ...tube([[0.92, 1.61, -0.05], [0.96, 1.28, -0.05]], 0.026, 0.02, 'D'),
        ...tube([[0.72, 1.63, -0.05], [0.68, 1.16, -0.05]], 0.026, 0.02, 'D'),
        ...wingCones,
        ['poly', [1.43, 1.45, -0.05], PICK(0.2), 0.03, 'q', { plane: 'xy', glow: 1, rot: [0, 0, 30] }],
      ] },
      { n: 'legL', parent: 'body', p: [0.15, 0.82, 0.0], mirror: true, s: [
        ['sph', [0.15, 0.82, 0.0], 0.13, 'u'],
        ['cap', [0.15, 0.8, 0.0], [0.16, 0.36, 0.03], 0.12, 0.085, 'D'],
        ['box', [0.16, 0.22, 0.05], [0.1, 0.14, 0.12], 'K', { round: 0.03 }],                     // platform boots
        ['box', [0.16, 0.05, 0.07], [0.115, 0.055, 0.16], 's', { round: 0.015 }],
        ['box', [0.16, 0.27, 0.16], [0.08, 0.025, 0.025], 'y'],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.85, -0.18], s: [
        ...tube([[0, 0.85, -0.18], [0, 0.62, -0.36], [0, 0.6, -0.6]], 0.03, 0.03, 'k'),
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 0.6, -0.6], s: [
        ...tube([[0, 0.6, -0.6], [0, 0.72, -0.76], [0, 0.88, -0.78]], 0.03, 0.03, 'k'),
        ['cap', [0, 0.86, -0.78], [0, 1.0, -0.78], 0.035, 0.05, 'K'],                            // microphone
        ['sph', [0, 1.06, -0.78], 0.075, 's', { stripes: { axis: 'y', p: 0.03, w: 0.01, col: 'g' } }],
        ['tor', [0, 1.02, -0.78], 0.075, 0.028, 'y'],
      ] },
    ],
    eyes: { part: 'head', at: [0.085, 1.735, 0.26], dir: [0.12, 0.02, 1], style: 'star', iris: '#ff4fd8', px: 0.9, cmap: { i: { c: '#ff6ae0', glow: 2 }, w: { c: '#ffffff', glow: 1 } } },
    mouth: { part: 'head', at: [0, 1.6, 0.27], dir: [0, -0.3, 1], style: 'grin', px: 0.7 },
    decals: [
      { part: 'body', at: [0, 1.1, 0.26], dir: [0, 0, 1], rows: eqRows([4, 7, 10, 6, 9, 5, 8], 10), cmap: EQ_CMAP, px: 0.62, lift: vs * 0.5 },
    ],
    fx: [
      { part: 'head', at: [0.22, 1.9, 0.06], type: 'note', rate: 1.2, scale: 1.3, mirror: true },
      { part: 'body', at: [0.5, 1.5, 0.2], type: 'note', rate: 0.5, scale: 1.1, color: '#3ef0ff', mirror: true },
      { part: 'head', at: [0, 2.05, 0.1], type: 'star', rate: 1, scale: 1.2, color: '#ffd84a' },
      { part: 'tail2', at: [0, 1.12, -0.78], type: 'spark', rate: 0.3, scale: 0.7, color: '#ff4fd8' },
    ],
  };
  LORE.amplifury = {
    name: 'Amplifury', element: 'echo', stage: 3, height: '2.3 m (3 m wingspan)',
    desc: 'Headlines the neon stadiums of Osaka Bay, where a single power chord from its subwoofer wings can flatten a stage set. It refuses to fight without a spotlight.',
    personality: 'Flamboyant diva who lives for the encore; generous to fans, ruthless to rivals who steal the show.',
    look: 'Towering rockstar bat with amp-stack speaker cabinets on its shoulders (glowing grills, silver corners, knobbed amp heads), huge wings fitted with subwoofer cones and magenta pick tips, glowing star eyes, a magenta-to-cyan glam pompadour, a feather boa, an equalizer chest panel, platform boots and a cable tail ending in a microphone.',
  };
}
