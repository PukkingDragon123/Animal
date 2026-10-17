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

// "3D that looks 2D": flat colour clusters. Every shape without an explicit `jit` gets `jit: J`
// (default 0) so cel bands + outlines do the shading instead of per-voxel noise.
const OPT_AT = { sph: 4, ell: 4, box: 4, cap: 6, cyl: 5, tor: 5, poly: 5 };
// A `blend` shape smooth-unions its geometry but (in voxel.js) also recolours every filled cell near it;
// so after each blend shape the earlier shapes are re-painted in order, then the blend shape itself:
// only the soft fillet keeps the blend colour.
function flat(shapes, J) {
  const norm = (t) => {
    const i = OPT_AT[t[0]], o = t.slice();
    while (o.length < i) o.push(undefined);
    const opts = Object.assign({}, o[i] || {});
    if (opts.jit == null) opts.jit = J;
    o[i] = opts;
    return o;
  };
  const asPaint = (t) => { const o = t.slice(), i = OPT_AT[t[0]]; o[i] = Object.assign({}, o[i], { paint: 1 }); delete o[i].blend; return o; };
  const src = shapes.map(norm), out = [];
  src.forEach((t, k) => {
    out.push(t);
    const o = t[OPT_AT[t[0]]];
    if (o.blend && !o.sub && !o.paint) {
      for (let j = 0; j < k; j++) { const u = src[j][OPT_AT[src[j][0]]]; if (!u.sub && !u.under) out.push(asPaint(src[j])); }
      out.push(asPaint(t));
    }
  });
  return out;
}
function finish(d, J = 0) {
  const fp = (parts) => (parts || []).map((p) => Object.assign({}, p, { s: flat(p.s, J) }));
  d.parts = fp(d.parts);
  if (d.bond && d.bond.parts) d.bond = Object.assign({}, d.bond, { parts: fp(d.bond.parts) });
  if (d.forms) for (const k of Object.keys(d.forms)) if (d.forms[k].parts) d.forms[k] = Object.assign({}, d.forms[k], { parts: fp(d.forms[k].parts) });
  return d;
}
// uniformly scale shape tuples about point c by k
function sclS(shapes, c, k) {
  const P = (v) => [c[0] + (v[0] - c[0]) * k, c[1] + (v[1] - c[1]) * k, c[2] + (v[2] - c[2]) * k];
  return shapes.map((t) => {
    const o = t.slice();
    switch (t[0]) {
      case 'sph': o[1] = P(t[1]); o[2] = t[2] * k; break;
      case 'ell': case 'box': o[1] = P(t[1]); o[2] = t[2].map((x) => x * k); break;
      case 'cap': o[1] = P(t[1]); o[2] = P(t[2]); o[3] = t[3] * k; o[4] = t[4] * k; break;
      case 'cyl': o[1] = P(t[1]); o[2] = P(t[2]); o[3] = t[3] * k; break;
      case 'tor': o[1] = P(t[1]); o[2] = t[2] * k; o[3] = t[3] * k; break;
      case 'poly': o[1] = P(t[1]); o[2] = t[2].map((q) => [q[0] * k, q[1] * k]); o[3] = t[3] * k; break;
      default: break;
    }
    return o;
  });
}
// points of a regular star / polygon in 2D (for 'poly' shapes)
const starPts = (n, R, r, a0 = Math.PI / 2) => Array.from({ length: n * 2 }, (_, i) => { const a = a0 + (i * Math.PI) / n, k = i % 2 ? r : R; return [Math.cos(a) * k, Math.sin(a) * k]; });
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// element aura colours (HDR, for bond auras)
const AURA = {
  pyro: [2.6, 1.1, 0.35, 1], hydro: [0.5, 1.7, 2.6, 1], bio: [0.9, 2.3, 0.7, 1], geo: [2.2, 1.5, 0.75, 1], echo: [2.4, 0.9, 2.3, 1],
  volto: [2.6, 2.3, 0.5, 1], cryo: [1.2, 2.3, 2.6, 1], aero: [1.4, 2.5, 1.8, 1], ecto: [1.5, 0.8, 2.6, 1], ferro: [1.8, 1.9, 2.1, 1],
  astro: [2.6, 2.1, 1.0, 1], nucleo: [1.3, 2.6, 0.5, 1],
};

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

// ---------------------------------------------------------------- 1. Kappachi (Hydro, ~0.8 m, biped)
// Ref: tokonmon_roster.md §8.1. A round-bellied kappa imp with a big head (~40 %): a shallow dish of sloshing water
// set into its crown ringed by reed-like hair, a turtle shell paved like Dotonbori canal stones, a short duck beak,
// webbed hands and feet, and a cucumber held like a club / snack.
{
  const DY = 0.77; // dish water height
  // canal-stone paving: rounded stones set in dark grout over the shell
  const SC = [0, 0.33, -0.085], SR = [0.2, 0.21, 0.12];
  const stones = [[0, 0.45, 0.066, 0.05], [0.105, 0.41, 0.05, 0.05], [-0.105, 0.41, 0.05, 0.05], [-0.04, 0.33, 0.055, 0.042], [0.08, 0.33, 0.05, 0.042], [0.16, 0.33, 0.03, 0.04], [-0.15, 0.33, 0.04, 0.04],
    [0.03, 0.25, 0.06, 0.04], [-0.1, 0.25, 0.045, 0.04], [0.13, 0.26, 0.04, 0.036], [0, 0.17, 0.06, 0.03]]
    .flatMap(([x, y, rx, ry], i) => {
      const q = Math.max(0.02, 1 - (x / SR[0]) ** 2 - ((y - SC[1]) / SR[1]) ** 2), z = SC[2] - SR[2] * Math.sqrt(q);
      let n = [x / SR[0] ** 2, (y - SC[1]) / SR[1] ** 2, (z - SC[2]) / SR[2] ** 2]; const l = Math.hypot(...n); n = n.map((v) => -v / l);
      const c = [x, y, z - 0.004];
      return xf([['ell', c, [rx, ry, 0.022], i % 3 ? 'sh' : 'shm', { rot: [Math.asin(n[1]) / D2R, 0, 0], top: 'shl', topT: 0.75 }]], c, [0, Math.atan2(n[0], n[2]) / D2R, 0]);
    });
  const fringe = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 + 0.22, cx = Math.sin(a), cz = Math.cos(a), front = cz > 0.55;
    return ['cap', [cx * 0.115, DY - 0.005, cz * 0.115], [cx * 0.2, DY - (front ? 0.055 : 0.1), cz * 0.19], 0.032, 0.012, 'hr', { tip: 'hrl', tipT: 0.7 }];
  });
  const hand = (s) => [
    ['ell', [0.205 * s, 0.25, 0.06], [0.04, 0.034, 0.042], 'g'],
    ...[-0.024, 0, 0.024].map((dz) => ['cap', [0.215 * s, 0.235, 0.07 + dz], [0.24 * s, 0.2, 0.09 + dz * 1.3], 0.014, 0.011, 'g']),
    ['poly', [0.228 * s, 0.218, 0.08], [[-0.03, 0.02], [0.034, 0.02], [0.04, -0.02], [-0.03, -0.02]], 0.006, 'web', { plane: 'zy', rot: [0, 0, 32 * s] }],
  ];
  // River Lord pieces
  const halo = [
    ['tor', [0, DY + 0.2, 0], 0.17, 0.026, 'wat', { glow: 1 }],
    ['tor', [0, DY + 0.2, 0], 0.17, 0.012, 'wl', { glow: 2 }],
    ...[0, 1, 2, 3, 4, 5].map((i) => ['sph', [Math.sin(i * 1.047) * 0.17, DY + 0.2 + (i % 2 ? 0.03 : -0.02), Math.cos(i * 1.047) * 0.17], 0.03, 'watl', { glow: 2 }]),
  ];
  const cape = [-0.12, -0.04, 0.04, 0.12].map((x, i) => ['poly', [x, 0, -0.205 - (i % 2) * 0.01], [[-0.05, 0.47], [0.05, 0.47], [0.065, 0.05], [0.03, -0.0], [0.0, 0.04], [-0.035, -0.01], [-0.065, 0.06]], 0.012, 'wat', { plane: 'xy', glow: 1, stripes: { axis: 'x', p: 0.045, w: 0.012, col: 'watl' } }]);
  DESIGNS.kappachi = finish({
    id: 'kappachi', vs: 0.016, arch: 'biped',
    pal: {
      g: '#3fae8e', gd: '#2a6a7a', gl: '#8fe0b8', web: '#8fe0b8', pl: '#d0d08a', pld: '#a0a85a',
      sh: '#a0a85a', shm: '#8a9446', shl: '#d0d08a', grout: '#4a5428', shrim: '#d0d08a',
      bk: '#f2c84a', bkd: '#c0902a', rim: '#e0e8d0', rimd: '#a8b8a8', wat: '#2fa8ff', watl: '#8ff0ff', wl: '#ffffff',
      hr: '#1f4a3a', hrl: '#2f6a50', ck: '#ff9db0', cu: '#3a8a3a', cul: '#a8e07a', cuc: '#e3f7a8',
    },
    anim: { quirk: ['hop', 'flex', 'shakeoff', 'happy', 'nod'], bounce: 1.3, gait: 1.15, maxSpeed: 3.5 },
    parts: [
      { n: 'body', p: [0, 0.22, 0], s: [
        ['ell', [0, 0.3, 0.0], [0.15, 0.15, 0.135], 'g'],
        // plastron: the pale belly plate in segments
        ['ell', [0, 0.29, 0.07], [0.112, 0.125, 0.08], 'pl', { paint: 1, stripes: { axis: 'y', p: 0.052, w: 0.012, col: 'pld', o: 0.01 } }],
      ] },
      { n: 'shell', parent: 'body', p: [0, 0.33, -0.06], s: [
        ['ell', [0, 0.33, -0.085], [0.2, 0.21, 0.12], 'grout'],
        ...stones,
        ['tor', [0, 0.33, -0.04], 0.19, 0.022, 'shrim', { axis: 'z', rot: [0, 0, 0] }],
      ] },
      { n: 'head', parent: 'body', p: [0, 0.45, 0.0], s: [
        ['ell', [0, 0.6, 0.02], [0.2, 0.172, 0.18], 'g'],
        ['ell', [0.122, 0.54, 0.12], [0.04, 0.024, 0.03], 'ck', { m: 1, paint: 1 }],
        // short duck beak
        ['ell', [0, 0.535, 0.19], [0.078, 0.036, 0.07], 'bk', { blend: 0.015 }],
        ['ell', [0, 0.515, 0.2], [0.07, 0.016, 0.06], 'bkd', { paint: 1 }],
        // the dish (sara): a rim set into the crown, full of glinting water
        ['cyl', [0, DY - 0.06, 0], [0, DY + 0.03, 0], 0.13, 'rim', { side: 'rimd', sideT: 0.95 }],
        ['cyl', [0, DY + 0.005, 0], [0, DY + 0.1, 0], 0.1, 'rim', { sub: 1 }],
        ['cyl', [0, DY - 0.03, 0], [0, DY + 0.006, 0], 0.1, 'wat', { glow: 1 }],
        ['cyl', [0, DY + 0.0, 0], [0, DY + 0.006, 0], 0.075, 'watl', { paint: 1, glow: 1 }],
        ['sph', [0.035, DY + 0.006, 0.03], 0.016, 'wl', { glow: 2 }],
        ['sph', [-0.04, DY + 0.006, -0.025], 0.011, 'wl', { glow: 2 }],
        ...fringe,
      ] },
      { n: 'armL', parent: 'body', p: [0.13, 0.38, 0.02], s: [
        ['cap', [0.13, 0.38, 0.02], [0.2, 0.26, 0.05], 0.036, 0.03, 'g'],
        ...hand(1),
      ] },
      { n: 'armR', parent: 'body', p: [-0.13, 0.38, 0.02], s: [
        ['cap', [-0.13, 0.38, 0.02], [-0.2, 0.26, 0.05], 0.036, 0.03, 'g'],
        ...hand(-1),
        // cucumber held like a club
        ['cap', [-0.215, 0.13, 0.13], [-0.2, 0.37, 0.03], 0.034, 0.031, 'cu', { spots: { col: 'cul', d: 0.2, s: 0.02 } }],
        ['sph', [-0.199, 0.395, 0.022], 0.031, 'cu', { sub: 1 }],
        ['ell', [-0.2, 0.368, 0.03], [0.028, 0.012, 0.028], 'cuc', { paint: 1, rot: [-22, 0, 0] }],
      ] },
      { n: 'legL', parent: 'body', p: [0.075, 0.2, 0], mirror: true, s: [
        ['cap', [0.075, 0.2, 0], [0.085, 0.06, 0.01], 0.05, 0.042, 'g'],
        ['ell', [0.09, 0.025, 0.05], [0.058, 0.026, 0.08], 'g', { top: 'gl', topT: 0.8 }],
        ...[-0.03, 0, 0.03].map((dx) => ['cap', [0.09 + dx, 0.02, 0.09], [0.09 + dx * 1.5, 0.014, 0.14], 0.016, 0.012, 'g']),
        ['ell', [0.09, 0.012, 0.12], [0.05, 0.008, 0.035], 'web'],
      ] },
    ],
    eyes: { part: 'head', at: [0.084, 0.6, 0.178], dir: [0.4, 0.08, 1], style: 'big', iris: '#2a5a6a', px: 0.82 },
    mouth: { part: 'head', at: [0, 0.512, 0.25], dir: [0, 0, 1], style: 'beak', px: 0.55 },
    fx: [{ part: 'head', at: [0.08, DY + 0.01, 0.06], type: 'drip', rate: 0.5, scale: 0.6 }],
    // Bonded gimmick "Overflow": the dish overflows into a spouting fountain, droplets arc over its head.
    bond: {
      parts: [{ n: 'fountain', parent: 'head', p: [0, DY, 0], s: [
        ['cap', [0, DY, 0], [0, DY + 0.12, 0], 0.045, 0.03, 'watl', { glow: 1 }],
        ['sph', [0, DY + 0.13, 0], 0.042, 'wl', { glow: 2 }],
        ...[0, 1, 2, 3, 4].map((i) => { const a = i * 1.2566 + 0.3, c = Math.sin(a), d = Math.cos(a); return ['cap', [c * 0.03, DY + 0.125, d * 0.03], [c * 0.17, DY + 0.03, d * 0.17], 0.022, 0.012, 'wat', { glow: 1 }]; }),
      ] }],
      grow: {},
      hat: { part: 'head', at: [0, 0.69, -0.1], scale: 0.85, tilt: -38 },
      aura: 'bubbles', auraColor: AURA.hydro,
    },
    forms: {
      // "River Lord": the dish water rises into a floating halo ring, a waterfall cape pours from the shell,
      // and the cucumber turns into a jade-glass staff.
      elemental: {
        pal: { cu: '#2fb88a', cul: '#8ff0d0', cuc: '#e8fff6', sh: '#5a9ab0', shm: '#4a8aa0', shl: '#a8e8f0', grout: '#1f4a5a', shrim: '#8ff0ff', pl: '#c8f0e8', pld: '#7ac8c0' },
        parts: [
          { n: 'halo', parent: 'head', p: [0, DY + 0.2, 0], spin: { axis: 'y', speed: 1.2 }, s: halo },
          { n: 'cape', parent: 'shell', p: [0, 0.45, -0.2], sway: { axis: 'x', amp: 0.06, freq: 1.1 }, s: cape },
          { n: 'staff', parent: 'armR', p: [-0.2, 0.26, 0.08], s: [
            ['cap', [-0.22, 0.02, 0.15], [-0.19, 0.62, -0.05], 0.018, 0.018, 'cu', { glow: 1 }],
            ['sph', [-0.19, 0.64, -0.055], 0.04, 'cuc', { glow: 2 }],
            ['tor', [-0.19, 0.64, -0.055], 0.055, 0.01, 'cul', { glow: 1, rot: [70, 0, 0] }],
          ] },
        ],
        eyes: { iris: '#00cdf9' },
        fx: [
          { part: 'halo', at: [0, DY + 0.2, 0.17], type: 'drip', rate: 1.2, scale: 0.6 },
          { part: 'cape', at: [0, 0.02, -0.21], type: 'bubble', rate: 0.8, scale: 0.5 },
        ],
      },
    },
  });
}
LORE.kappachi = {
  name: 'Kappachi', element: 'hydro', stage: 1, height: '0.8 m',
  desc: 'A kappa imp that guards the canals of Dōtonbori. The water in its head-dish is its life force — bow to it, and it bows back, spilling its power.',
  personality: 'Mischievous prankster with a soft spot for cucumbers and sumo.',
  look: 'Round-bellied green kappa with a big head, a glinting water dish set in its crown ringed by reed-like hair, a turtle shell paved like canal stones, a yellow duck beak, webbed hands and feet, and a cucumber club.',
};

// ---------------------------------------------------------------- 2. Chochobake (Ecto, ~0.9 m, floater)
// Ref: tokonmon_roster.md §8.3. A red akachōchin lantern that woke at 100 years old: black lacquer caps, a wire
// hanging loop, ONE huge eye in the paper, a torn rib-line mouth with a long pink tongue, a tassel tail, and the
// Ecto spirit flame inside glowing through the paper in thin horizontal bands between the ribs.
{
  const Y0 = 0.36, Y1 = 0.98, CY = (Y0 + Y1) / 2, RX = 0.29, RY = (Y1 - Y0) / 2 + 0.07;
  const rad = (y) => RX * Math.sqrt(Math.max(0, 1 - ((y - CY) / RY) ** 2));
  const ribsY = [0.42, 0.5, 0.58, 0.66, 0.74, 0.82, 0.9];
  const MY = 0.58; // mouth line (a torn rib)
  // ragged tear across the front: a zig-zag slit carved out of the paper
  const tearPts = [[-0.25, 0.01], [-0.19, 0.05], [-0.13, 0.022], [-0.07, 0.062], [0.0, 0.03], [0.07, 0.064], [0.13, 0.024], [0.19, 0.052], [0.25, 0.01],
    [0.19, -0.04], [0.12, -0.016], [0.06, -0.072], [0.0, -0.034], [-0.06, -0.074], [-0.12, -0.02], [-0.19, -0.046]];
  // Hyakki Lantern: a small ghost lantern on a spectral string
  const mini = (x, z) => [
    ['ell', [x, 1.1, z], [0.07, 0.085, 0.07], 'pap', { glow: 1, stripes: { axis: 'y', p: 0.04, w: 0.012, col: 'rib' } }],
    ['cyl', [x, 1.17, z], [x, 1.2, z], 0.045, 'lac'],
    ['cyl', [x, 1.0, z], [x, 1.03, z], 0.045, 'lac'],
    ['cap', [x, 1.2, z], [x * 0.4, 1.32, z * 0.4], 0.008, 0.008, 'str', { glow: 2 }],
  ];
  DESIGNS.chochobake = finish({
    id: 'chochobake', vs: 0.017, arch: 'floater',
    pal: {
      pap: '#d8283a', papd: '#a01c30', lit: '#ff6a5a', lit2: '#ffc0a0', rib: '#5a0a1a', lac: '#1a1418', lacl: '#4a3a40',
      inr: '#2a0a14', tg: '#ff7aa0', tgd: '#c03a6a', in: '#8a5aff', in2: '#ff7af2', in3: '#ffe0f6', tas: '#ffcf3a', tasd: '#c8901a', str: '#c9a8ff', wire: '#3a3236',
    },
    anim: { quirk: ['sway', 'happy', 'shakeoff', 'spin'], bounce: 1, hover: 0.22, maxSpeed: 3 },
    parts: [
      { n: 'body', p: [0, 0.67, 0], s: [
        // the paper barrel
        ['ell', [0, CY, 0], [RX, RY, RX], 'pap', { belly: 'papd', bellyT: 0.55 }],
        ['box', [0, Y1 + 0.2, 0], [0.4, 0.2, 0.4], 'pap', { sub: 1 }],
        ['box', [0, Y0 - 0.2, 0], [0.4, 0.2, 0.4], 'pap', { sub: 1 }],
        // thin light bands glowing through the paper, between the ribs
        ...ribsY.slice(0, -1).map((y) => ['tor', [0, y + 0.04, 0], rad(y + 0.04) - 0.006, 0.0095, 'lit', { paint: 1, glow: 1 }]),
        // bamboo ribs standing proud of the paper
        ...ribsY.map((y) => ['tor', [0, y, 0], rad(y) + 0.003, 0.012, 'rib']),
        // flat eye patch on the paper above the mouth
        ['cyl', [0, 0.78, 0.2], [0, 0.78, 0.4], 0.155, 'pap', { sub: 1 }],
        ['cyl', [0, 0.78, 0.0], [0, 0.78, 0.218], 0.148, 'pap'],
        ['tor', [0, 0.78, 0.214], 0.148, 0.012, 'rib', { axis: 'z' }],
        // the torn mouth: a ragged slit carved along a rib, glowing violet spirit-flame inside
        ['poly', [0, MY, 0.28], tearPts, 0.14, 'pap', { sub: 1 }],
        ['ell', [0, MY, 0.1], [0.24, 0.075, 0.12], 'inr', { under: 1 }],
        ['ell', [0, MY, 0.16], [0.17, 0.04, 0.06], 'in', { glow: 2 }],
        // lacquer caps + hanging wire loop
        ['cyl', [0, Y1 - 0.01, 0], [0, Y1 + 0.06, 0], 0.17, 'lac', { top: 'lacl', topT: 0.6 }],
        ['cyl', [0, Y1 + 0.06, 0], [0, Y1 + 0.085, 0], 0.13, 'lac'],
        ['tor', [0, Y1 + 0.16, 0], 0.058, 0.013, 'wire', { axis: 'x' }],
        ['cyl', [0, Y0 - 0.06, 0], [0, Y0 + 0.01, 0], 0.17, 'lac', { belly: 'lacl', bellyT: 0.6 }],
      ] },
      { n: 'jaw', parent: 'body', p: [0, MY - 0.02, 0.24], sway: { axis: 'x', amp: 0.1, freq: 1.1 }, s: [
        ['cap', [0, MY - 0.02, 0.2], [0, MY - 0.06, 0.32], 0.05, 0.046, 'tg', { belly: 'tgd', bellyT: 0.5 }],
        ['cap', [0, MY - 0.06, 0.32], [0.01, MY - 0.2, 0.36], 0.046, 0.042, 'tg', { belly: 'tgd', bellyT: 0.5 }],
        ['cap', [0.01, MY - 0.2, 0.36], [0.025, MY - 0.32, 0.32], 0.042, 0.034, 'tg', { belly: 'tgd', bellyT: 0.5 }],
        ['box', [0, MY - 0.17, 0.4], [0.008, 0.14, 0.02], 'tgd', { paint: 1 }],
      ] },
      { n: 'tail', parent: 'body', p: [0, Y0 - 0.06, 0], sway: { axis: 'z', amp: 0.12, freq: 0.9 }, s: [
        ['cap', [0, Y0 - 0.06, 0], [0, Y0 - 0.12, 0], 0.012, 0.012, 'wire'],
        ['sph', [0, Y0 - 0.13, 0], 0.028, 'tas'],
        ['cap', [0, Y0 - 0.14, 0], [0, Y0 - 0.32, 0], 0.03, 0.045, 'tas', { stripes: { axis: 'x', p: 0.022, w: 0.007, col: 'tasd' } }],
      ] },
    ],
    eyes: { part: 'body', at: [0, 0.78, 0.218], dir: [0, 0, 1], style: 'cyclops', mirror: false, iris: '#8a5aff', px: 1.8, cmap: { s: '#fff6e0', k: '#2a0a14' } },
    mouth: { style: 'none' },
    fx: [
      { part: 'body', at: [0, MY + 0.02, 0.22], type: 'wisp', rate: 0.5, scale: 0.6, color: '#c9a8ff' },
      { part: 'body', at: [0, Y1 + 0.1, 0], type: 'ember', rate: 0.25, scale: 0.4, color: '#ff7af2' },
    ],
    // Bonded gimmick "Giggle Flare": the inner flame blazes through every band (glowing rings), the tongue grows.
    bond: {
      parts: [{ n: 'flare', parent: 'body', p: [0, CY, 0], s: [0.46, 0.54, 0.7, 0.86].map((y, i) => ['tor', [0, y, 0], rad(y) + 0.006, 0.012, i % 2 ? 'in2' : 'in3', { glow: 2 }]) }],
      grow: { jaw: 1.35 },
      hat: { part: 'body', at: [0, Y1 + 0.08, 0], scale: 0.85 },
      aura: 'flame', auraColor: AURA.ecto,
    },
    forms: {
      // "Hyakki Lantern" (the night parade): translucent violet paper with the flame fully visible, two small
      // ghost lanterns orbiting on spectral strings, and the tongue trailing as a ribbon of spirit flame.
      elemental: {
        pal: { pap: '#6a3aa8', papd: '#4a2a80', lit: '#ff7af2', lit2: '#ffe0f6', rib: '#2a0a3a', tg: '#ff7af2', tgd: '#8a5aff' },
        parts: [
          { n: 'orbit', parent: 'body', p: [0, 1.1, 0], spin: { axis: 'y', speed: 1.3 }, s: [...mini(0.48, 0), ...mini(-0.48, 0)] },
          { n: 'flameTongue', parent: 'jaw', p: [0.025, MY - 0.32, 0.32], sway: { axis: 'z', amp: 0.25, freq: 1.6 }, s: [
            ['cap', [0.025, MY - 0.32, 0.32], [0.05, MY - 0.5, 0.26], 0.034, 0.022, 'in2', { glow: 2 }],
            ['cap', [0.05, MY - 0.5, 0.26], [0.0, MY - 0.66, 0.18], 0.022, 0.006, 'in3', { glow: 2 }],
          ] },
          { n: 'core', parent: 'body', p: [0, CY, 0], s: [['sph', [0, CY + 0.06, 0], 0.13, 'in3', { glow: 3, under: 1 }]] },
        ],
        eyes: { iris: '#ff7af2' },
        fx: [
          { part: 'orbit', at: [0.48, 1.1, 0], type: 'wisp', rate: 0.8, scale: 0.5, color: '#ff7af2', mirror: true },
          { part: 'body', at: [0, Y1 + 0.12, 0], type: 'flame', rate: 0.8, scale: 0.6, color: '#8a5aff' },
        ],
      },
    },
  });
}
LORE.chochobake = {
  name: 'Chochobake', element: 'ecto', stage: 1, height: '0.9 m',
  desc: 'When a festival lantern turns one hundred years old it tears open a mouth and wakes up. It haunts the night markets of Shinsekai, licking passers-by and giggling.',
  personality: 'Playful trickster; lonely when the festival lights go out.',
  look: 'A red izakaya paper lantern with black lacquer caps and a hanging loop, one huge violet eye, a torn rib for a mouth with a long lolling pink tongue, a golden tassel tail, and a spirit flame glowing through the paper in thin bands.',
};

// ---------------------------------------------------------------- 3. Tengale (Aero, ~1.0 m, flyer)
// Ref: tokonmon_roster.md §8.4. A compact crow-tengu (beak, NO long red nose) dressed as a yamabushi: small black
// hexagonal tokin cap, white robe over indigo hakama, three mint yuigesa pom-poms down the chest, one-tooth geta,
// and wings whose primaries end in big seven-lobed yatsude leaves (the "tengu's fan").
{
  const S = [0.14, 0.64, -0.03];
  // a palmate yatsude leaf (7 lobes) lying in the wing plane, centred at F
  const yatsude = (F, R, col, vein) => {
    const pts = [[0, 0]], veins = [];
    for (let k = 0; k <= 14; k++) {
      const phi = (-80 + k * (160 / 14)) * D2R, r = k % 2 ? R * 0.52 : R;
      pts.push([Math.cos(phi) * r, Math.sin(phi) * r]);
      if (k % 2 === 0) veins.push(['cap', [F[0], F[1] + 0.012, F[2]], [F[0] + Math.cos(phi) * R * 0.85, F[1] + 0.012, F[2] + Math.sin(phi) * R * 0.85], 0.009, 0.006, vein, { paint: 1 }]);
    }
    return [['poly', F, pts, 0.018, col, { plane: 'xz' }], ...veins, ['sph', F, 0.028, vein]];
  };
  const feathers = (x0, z0, n, len, col) => Array.from({ length: n }, (_, i) => ['cap', [x0 + i * 0.045, 0.64, z0], [x0 + i * 0.05 + 0.02, 0.64, z0 - len + i * 0.012], 0.024, 0.01, col]);
  const wingShapes = (R, leafCol) => [
    ['cap', [0.12, 0.645, -0.02], [0.36, 0.65, -0.04], 0.045, 0.028, 'f', { top: 'f2', topT: 0.6 }],
    ['poly', [0, 0.64, 0], [[0.1, 0.03], [0.36, 0.0], [0.38, -0.08], [0.34, -0.2], [0.3, -0.15], [0.26, -0.24], [0.22, -0.17], [0.18, -0.24], [0.14, -0.16], [0.1, -0.14]], 0.02, 'f', { plane: 'xz', top: 'f2', topT: 0.7 }],
    ...feathers(0.14, -0.1, 5, 0.12, 'f'),
    ...yatsude([0.47, 0.64, -0.07], R, leafCol, 'vein'),
  ];
  const WR = [0, 0, 18];
  const wing = xf(wingShapes(0.16, 'leaf'), S, WR);
  // Daitengu Gale: a second pair of leaf-fan wings set lower and further back
  const S2 = [0.12, 0.52, -0.08];
  const wing2 = xf(xf(wingShapes(0.14, 'leaf2'), S, [0, 0, 0], [S2[0] - S[0], S2[1] - S[1], S2[2] - S[2]]), S2, [0, -24, -14]);
  const pompom = (y, z) => ['sph', [0, y, z], 0.032, 'pom', { noise: 0.006, noiseScale: 0.012 }];
  DESIGNS.tengale = finish({
    id: 'tengale', vs: 0.019, arch: 'flyer',
    pal: {
      f: '#2e3248', f2: '#4a5aa0', fd: '#1e2030', robe: '#f2f0e6', robed: '#b8b8c8', hak: '#2f3a6a', hakl: '#4a5a9a', obi: '#1e2030',
      pom: '#a8f5c8', bk: '#f2b33a', bkd: '#a0661a', lac: '#14121a', leaf: '#2f7a3a', leaf2: '#3a9a48', leafl: '#6ac05a', vein: '#c8f0a0',
      wood: '#8a5a3a', woodd: '#5a3a24', hanao: '#d61f2c', leg: '#3c3846', wind: '#a8f5c8', windw: '#ffffff',
    },
    anim: { quirk: ['nod', 'flex', 'sway', 'stretch'], hover: 0.2, flap: 0.7, bounce: 0.8, maxSpeed: 5 },
    parts: [
      { n: 'body', p: [0, 0.42, 0], s: [
        ['ell', [0, 0.5, -0.01], [0.155, 0.2, 0.14], 'robe', { back: 'robed', backT: 0.6 }],
        // V neckline shows the black feathers
        ['poly', [0, 0.64, 0.13], [[-0.07, 0.04], [0.07, 0.04], [0, -0.1]], 0.05, 'f', { paint: 1 }],
        ['cap', [0.075, 0.68, 0.06], [0.005, 0.52, 0.14], 0.016, 0.014, 'robed', { paint: 1, m: 1 }],
        // indigo hakama flaring to the ground
        ['cap', [0, 0.4, 0], [0, 0.17, 0.0], 0.15, 0.2, 'hak', { stripes: { axis: 'x', p: 0.06, w: 0.016, col: 'hakl', o: 0.01 } }],
        ['tor', [0, 0.4, 0.0], 0.148, 0.022, 'obi'],
        // yuigesa: three mint pom-poms down the chest
        pompom(0.62, 0.135), pompom(0.54, 0.145), pompom(0.46, 0.15),
      ] },
      { n: 'head', parent: 'body', p: [0, 0.68, 0.0], s: [
        ['ell', [0, 0.8, 0.02], [0.15, 0.14, 0.14], 'f', { top: 'f2', topT: 0.75 }],
        // sharp crow beak
        ['cap', [0, 0.785, 0.11], [0, 0.755, 0.29], 0.055, 0.01, 'bk', { blend: 0.012 }],
        ['cap', [0, 0.752, 0.12], [0, 0.745, 0.24], 0.03, 0.008, 'bkd'],
        // frowning brow feathers
        ['cap', [0.025, 0.86, 0.13], [0.12, 0.89, 0.08], 0.022, 0.012, 'fd', { m: 1 }],
        // swept-back crest
        ['cap', [0, 0.87, -0.06], [0, 0.9, -0.22], 0.04, 0.008, 'f'],
        ['cap', [0.05, 0.85, -0.07], [0.09, 0.86, -0.2], 0.032, 0.008, 'f', { m: 1 }],
        // tokin: small black hexagonal cap on the forehead, with its cord
        ...xf([
          ['poly', [0, 0.95, 0.07], starPts(3, 0.055, 0.055, 0), 0.03, 'lac', { plane: 'xz' }],
          ['poly', [0, 0.985, 0.07], starPts(3, 0.034, 0.034, 0), 0.02, 'lac', { plane: 'xz' }],
          ['tor', [0, 0.93, 0.07], 0.06, 0.009, 'robe'],
        ], [0, 0.93, 0.07], [16, 0, 0]),
      ] },
      { n: 'wingL', parent: 'body', p: S, mirror: true, s: wing },
      { n: 'tail', parent: 'body', p: [0, 0.4, -0.12], s: xf([
        ['poly', [0, 0.4, 0], [[-0.06, -0.08], [0.06, -0.08], [0.13, -0.34], [0.08, -0.3], [0.045, -0.38], [0, -0.33], [-0.045, -0.38], [-0.08, -0.3], [-0.13, -0.34]], 0.018, 'f', { plane: 'xz', stripes: { axis: 'x', p: 0.09, w: 0.03, col: 'f2', o: 0.03 } }],
      ], [0, 0.4, -0.12], [-40, 0, 0]) },
      { n: 'legL', parent: 'body', p: [0.07, 0.2, 0], mirror: true, s: [
        ['cap', [0.07, 0.2, 0.01], [0.07, 0.1, 0.02], 0.02, 0.018, 'leg'],
        ...[-0.03, 0, 0.03].map((dx) => ['cap', [0.07, 0.095, 0.02], [0.07 + dx, 0.088, 0.085], 0.013, 0.009, 'leg']),
        ['box', [0.07, 0.07, 0.03], [0.045, 0.013, 0.08], 'wood'],
        ['box', [0.07, 0.03, 0.03], [0.035, 0.03, 0.013], 'woodd'],
        ['cap', [0.035, 0.088, 0.08], [0.105, 0.088, 0.08], 0.01, 0.01, 'hanao'],
      ] },
    ],
    eyes: { part: 'head', at: [0.075, 0.815, 0.13], dir: [0.42, 0.04, 1], style: 'sharp', iris: '#ffb11f', px: 0.85, cmap: { k: '#0e0e18' } },
    mouth: { part: 'head', at: [0, 0.75, 0.2], dir: [0, -0.2, 1], style: 'beak', px: 0.55 },
    fx: [{ part: 'wingL', at: P3(S, WR, [0.62, 0.64, -0.07]), type: 'leaf', rate: 0.5, scale: 0.6, mirror: true }],
    // Bonded gimmick "Gale Fans": the leaf-fans swell and a mint wind ring whirls around its waist.
    bond: {
      parts: [{ n: 'gale', parent: 'body', p: [0, 0.36, 0], spin: { axis: 'y', speed: 3 }, s: [
        ['tor', [0, 0.34, 0], 0.27, 0.014, 'wind', { glow: 1, rot: [8, 0, 4] }],
        ...[0, 1, 2].map((i) => ['cap', [Math.sin(i * 2.09) * 0.27, 0.34, Math.cos(i * 2.09) * 0.27], [Math.sin(i * 2.09 + 0.6) * 0.27, 0.38, Math.cos(i * 2.09 + 0.6) * 0.27], 0.02, 0.006, 'windw', { glow: 1 }]),
      ] }],
      grow: { wingL: 1.22, wingR: 1.22 },
      hat: { part: 'head', at: [0, 0.94, 0.0], scale: 0.62, tilt: -4 },
      aura: 'leaves', auraColor: AURA.aero,
    },
    forms: {
      // "Daitengu Gale": a second pair of leaf-fan wings, a vortex halo spinning from the tokin, the robe turned
      // into a mint wind mantle, and a floating hauchiwa fan of wind orbiting its hand.
      elemental: {
        pal: { robe: '#d8fbe8', robed: '#8ad8b0', hak: '#1f6a5a', hakl: '#a8f5c8', leaf: '#4ac060', leafl: '#a8f5c8' },
        parts: [
          { n: 'wing2L', parent: 'body', p: S2, mirror: true, sway: { axis: 'z', amp: 0.35, freq: 1.4 }, s: wing2 },
          { n: 'vortex', parent: 'head', p: [0, 1.06, 0.05], spin: { axis: 'y', speed: 4 }, s: [
            ['tor', [0, 1.06, 0.05], 0.13, 0.012, 'wind', { glow: 2 }],
            ['tor', [0, 1.11, 0.05], 0.09, 0.01, 'windw', { glow: 2 }],
            ...[0, 1, 2, 3].map((i) => ['cap', [Math.sin(i * 1.57) * 0.13, 1.06, 0.05 + Math.cos(i * 1.57) * 0.13], [Math.sin(i * 1.57 + 0.7) * 0.09, 1.11, 0.05 + Math.cos(i * 1.57 + 0.7) * 0.09], 0.01, 0.008, 'wind', { glow: 1 }]),
          ] },
          { n: 'mantle', parent: 'body', p: [0, 0.66, -0.08], sway: { axis: 'x', amp: 0.08, freq: 1.3 }, s: [
            ['poly', [0, 0, -0.15], [[-0.14, 0.68], [0.14, 0.68], [0.24, 0.22], [0.15, 0.28], [0.1, 0.12], [0.03, 0.24], [-0.04, 0.1], [-0.11, 0.26], [-0.2, 0.16], [-0.25, 0.3]], 0.016, 'robe', { plane: 'xy', stripes: { axis: 'x', p: 0.07, w: 0.014, col: 'hakl' } }],
          ] },
          { n: 'fan', parent: 'body', p: [0, 0.5, 0], spin: { axis: 'y', speed: 1.6 }, s: xf([
            ...yatsude([0.36, 0.64, 0.16], 0.1, 'wind', 'windw').map((t) => { const o = t.slice(); const i = t[0] === 'cap' ? 6 : t[0] === 'poly' ? 5 : 4; o[i] = Object.assign({}, o[i], { glow: 1 }); return o; }),
          ], [0.36, 0.64, 0.16], [90, 0, 0]) },
        ],
        eyes: { iris: '#a8f5c8' },
        fx: [
          { part: 'vortex', at: [0, 1.08, 0.05], type: 'leaf', rate: 0.8, scale: 0.5, color: '#a8f5c8' },
          { part: 'body', at: [0, 0.2, 0], type: 'dust', rate: 0.6, scale: 0.8, color: '#d8fbe8' },
        ],
      },
    },
  });
}
LORE.tengale = {
  name: 'Tengale', element: 'aero', stage: 1, height: '1.0 m',
  desc: 'A crow-tengu that trains alone on the cedar slopes of Mt. Ikoma. One sweep of its leaf-fan wings can blow a delivery drone clean out of the Osaka sky.',
  personality: 'Proud, stern hermit who secretly loves teaching young trainers.',
  look: 'Glossy blue-black crow-tengu in a white yamabushi robe and indigo hakama, with a sharp amber beak, a frowning brow, a little black tokin cap, three mint pom-poms down its chest, one-tooth geta and wings that end in great seven-lobed yatsude leaf fans.',
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

// ---------------------------------------------------------------- 5. Cabbunny (Bio farm Tokonmon, ~0.45 m, hopper)
// Ref: tokonmon_roster.md §6. A round cabbage head IS the body; the rabbit face peeks out between the inner
// leaves, two tall veined outer leaves are the ears, leaf-stub hind feet, a tight cabbage-heart pom-pom tail.
{
  // one cabbage leaf built at the front (+z) then swung around the body by `a` degrees
  const leafAt = (a, y, r, w, h, tilt, col, o = {}) => xf([
    ['ell', [0, y, r], [w, h, o.th || 0.016], col, Object.assign({ rot: [tilt, 0, 0] }, o.opt || {})],
    ...(o.vein === false ? [] : [['cap', [0, y - h * 0.9, r + 0.006], [0, y + h * 0.8, r + 0.006 + Math.sin(tilt * D2R) * h * 1.2], 0.0075, 0.005, 'vein', { paint: 1 }]]),
  ], [0, y, 0], [0, a, 0]);
  const outer = [68, 124, 180, 236, 292].flatMap((a, i) => leafAt(a, 0.13 + (i % 2) * 0.01, 0.13, 0.1, 0.104, 12, 'out', { th: 0.019, vein: false }));
  const chin = [-34, 34].flatMap((a) => leafAt(a, 0.085, 0.13, 0.075, 0.07, 24, 'mid', { vein: false }));
  const fresh = (n, y, r, tilt, col) => Array.from({ length: n }, (_, i) => leafAt(i * (360 / n) + 18, y, r, 0.07, 0.085, tilt, col, { th: 0.014 })).flat();
  // ear = one tall outer leaf with a floppy tip
  const ear = [
    ['ell', [0.074, 0.375, -0.012], [0.05, 0.098, 0.02], 'out', { rot: [6, 0, -15] }],
    ['ell', [0.112, 0.452, 0.012], [0.036, 0.042, 0.018], 'out', { rot: [38, 0, -38], blend: 0.02 }],
    ['ell', [0.077, 0.372, 0.0], [0.033, 0.078, 0.013], 'mid', { rot: [6, 0, -15] }],
    ['cap', [0.05, 0.3, 0.012], [0.106, 0.45, 0.034], 0.008, 0.006, 'vein', { paint: 1 }],
  ];
  // Harvest Moon: ornamental-kale rosette cape + tall frills
  const CC = [0, 0.18, -0.115];
  const capeLeaf = (a, len, w, col, rim) => {
    const d = [Math.sin(a * D2R), Math.cos(a * D2R)], c = [CC[0] + d[0] * len, CC[1] + d[1] * len, CC[2] - 0.03];
    return [
      ['ell', c, [w, len, 0.016], col, { rot: [-14 * d[1], 14 * d[0], -a] }],
      ['ell', [c[0] + d[0] * len * 0.55, c[1] + d[1] * len * 0.55, c[2] - 0.004], [w * 0.8, len * 0.42, 0.018], rim, { rot: [-14 * d[1], 14 * d[0], -a] }],
      ['cap', CC, [CC[0] + d[0] * len * 1.7, CC[1] + d[1] * len * 1.7, CC[2] - 0.035], 0.007, 0.004, 'vein', { paint: 1 }],
    ];
  };
  // kale ruffles along the outer edge of each ear, rising past the tip
  const frill = Array.from({ length: 10 }, (_, i) => { const t = i / 9 * 1.25 - 0.75; return ['sph', [0.124 + 0.0255 * t + (i % 2) * 0.006, 0.364 + 0.095 * t, -0.008], 0.019, i === 9 ? 'vein' : 'mid', { blend: 0.008 }]; });
  DESIGNS.cabbunny = finish({
    id: 'cabbunny', vs: 0.014, arch: 'hopper',
    pal: {
      out: '#5f9a4a', mid: '#a8d070', inn: '#cfe58e', heart: '#d8eca0', vein: '#eef6d8', bloom: '#b8d8c0', deep: '#2f5a3a', fresh: '#c4ec7c',
      fur: '#fbf6ea', furd: '#c8c0b0', nose: '#ffb3d9', blush: '#ffb0c0', tooth: '#ffffff',
    },
    anim: { quirk: ['happy', 'hop', 'sniff', 'shakeoff'], bounce: 1.3, maxSpeed: 3.5 },
    parts: [
      { n: 'body', p: [0, 0.12, 0], s: [...outer, ...chin] },
      { n: 'head', parent: 'body', p: [0, 0.165, 0], s: [
        // the rabbit face peeking out (blended in first, then the leaf colours are re-painted over it)
        ['sph', [0, 0.165, -0.005], 0.14, 'inn'],
        ['ell', [0, 0.18, 0.106], [0.084, 0.07, 0.052], 'fur', { blend: 0.025 }],
        ['sph', [0, 0.165, -0.005], 0.14, 'inn', { paint: 1 }],
        ['ell', [0, 0.18, 0.106], [0.084, 0.07, 0.052], 'fur', { paint: 1 }],
        // tight inner leaves folding over the crown: a leafy hood around the face
        ...[[0, 'mid', 0.11], [-58, 'heart', 0.1], [58, 'heart', 0.1]].flatMap(([a, c, w]) => xf([
          ['ell', [0, 0.268, -0.085], [w, 0.016, 0.1], c, { rot: [-38, 0, 0] }],
          ['cap', [0, 0.3, -0.02], [0, 0.225, -0.15], 0.006, 0.006, 'vein', { paint: 1 }]], [0, 0.165, 0], [0, a, 0])),
        ['ell', [0.058, 0.152, 0.13], [0.04, 0.032, 0.03], 'fur', { m: 1, blend: 0.012 }],
        ['ell', [0, 0.156, 0.152], [0.036, 0.026, 0.022], 'fur', { blend: 0.01 }],
        ['ell', [0, 0.172, 0.173], [0.016, 0.012, 0.01], 'nose'],
        ['box', [0, 0.133, 0.162], [0.012, 0.01, 0.006], 'tooth'],
        ['ell', [0.066, 0.165, 0.152], [0.024, 0.013, 0.012], 'blush', { m: 1, paint: 1 }],
        // leafy cheek ruffles framing the face
        ...[1, -1].flatMap((s) => [['ell', [0.105 * s, 0.17, 0.085], [0.024, 0.07, 0.052], 'mid', { rot: [10, 32 * s, -14 * s] }],
          ['cap', [0.112 * s, 0.11, 0.09], [0.11 * s, 0.235, 0.075], 0.006, 0.004, 'vein', { paint: 1 }]]),
      ] },
      { n: 'earL', parent: 'head', p: [0.05, 0.29, -0.01], mirror: true, s: ear },
      { n: 'legFL', parent: 'body', p: [0.05, 0.06, 0.08], mirror: true, s: [
        ['ell', [0.05, 0.024, 0.118], [0.026, 0.022, 0.03], 'fur', { belly: 'furd', bellyT: 0.5 }],
      ] },
      { n: 'legBL', parent: 'body', p: [0.075, 0.06, -0.05], mirror: true, s: [
        ['ell', [0.088, 0.024, -0.005], [0.04, 0.022, 0.066], 'out', { rot: [0, -12, 0], top: 'mid', topT: 0.6 }],
        ['cap', [0.088, 0.04, -0.06], [0.094, 0.042, 0.05], 0.006, 0.005, 'vein', { paint: 1 }],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.11, -0.14], s: [
        ['sph', [0, 0.115, -0.168], 0.04, 'inn', { stripes: { axis: 'x', p: 0.03, w: 0.007, col: 'mid', o: 0.01 } }],
      ] },
    ],
    eyes: { part: 'head', at: [0.044, 0.2, 0.158], dir: [0.35, 0.06, 1], style: 'big', iris: '#4a3020', px: 0.85 },
    mouth: { part: 'head', at: [0, 0.148, 0.175], dir: [0, -0.15, 1], style: 'cat', px: 0.45 },
    fx: [{ part: 'head', at: [0, 0.31, 0.02], type: 'leaf', rate: 0.12, scale: 0.4 }],
    // Bonded gimmick "Morning Regrowth": fresh outer leaves unfurl into a rosette ruff, the leaf ears grow.
    bond: {
      parts: [{ n: 'rosette', parent: 'body', p: [0, 0.07, 0], s: fresh(9, 0.075, 0.15, 58, 'fresh') }],
      grow: { earL: 1.3, earR: 1.3 },
      hat: { part: 'head', at: [0, 0.282, -0.008], scale: 0.6, tilt: -6 },
      aura: 'leaves', auraColor: AURA.bio,
    },
    forms: {
      // "Harvest Moon": ornamental-kale cape and frills, healing pollen motes.
      elemental: {
        pal: { out: '#4f7f74', mid: '#c8a8e0', inn: '#f1e8fa', vein: '#f6f0ff', bloom: '#9fc7c0', fresh: '#dcc2f2', fur: '#fbf6ff' },
        parts: [
          { n: 'cape', parent: 'body', p: CC, s: [
            ...[-112, -84, -56, -28, 0, 28, 56, 84, 112].flatMap((a) => capeLeaf(a, 0.13, 0.062, 'out', 'mid')),
          ] },
          { n: 'frillL', parent: 'earL', p: [0.06, 0.31, -0.01], mirror: true, s: frill },
        ],
        eyes: { iris: '#6a2a8a' },
        fx: [
          { part: 'earL', at: [0.16, 0.52, -0.01], type: 'spore', rate: 0.8, scale: 0.5, color: '#f6e8ff', mirror: true },
          { part: 'cape', at: [0, 0.32, -0.2], type: 'petal', rate: 0.5, scale: 0.4, color: '#e2c8f4' },
        ],
      },
    },
  });
}
LORE.cabbunny = {
  name: 'Cabbunny', element: 'bio', stage: 1, height: '0.45 m',
  desc: 'Farmers find Cabbunny napping in their cabbage rows and can never tell it apart from the harvest. It regrows a fresh outer leaf every morning.',
  personality: 'Sunny, bouncy and always hungry — mostly for itself.',
  look: 'A round cabbage head with a rabbit face peeking out between the pale inner leaves, two tall veined outer leaves for ears, a twitchy pink nose, buck teeth, leaf-stub feet and a cabbage-heart pom-pom tail.',
};

// ---------------------------------------------------------------- 6. Moglow (Geo farm Tokonmon, ~0.5 m, low quad)
// Ref: tokonmon_roster.md §6. A plump star-nosed mole: the glowing star nose IS the lamp ("by lamplight"),
// big spade forepaws with cream claws held out front, and a half-buried geode on its back showing violet crystals.
{
  const NZ = 0.322; // nose tip z
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 + 0.26;
    return ['cap', [Math.cos(a) * 0.028, 0.142 + Math.sin(a) * 0.026, NZ - 0.012], [Math.cos(a) * 0.066, 0.142 + Math.sin(a) * 0.06, NZ + 0.01], 0.014, 0.011, 'ray', { glow: 1, tip: 'lamp', tipT: 0.62 }];
  });
  const claws = (x0, z0) => [-0.05, -0.025, 0, 0.025, 0.05].map((dx) => ['cap', [x0 + dx, 0.05, z0 + 0.03], [x0 + dx * 1.35, 0.016, z0 + 0.1 - Math.abs(dx) * 0.5], 0.013, 0.006, 'cl', { tip: 'cld', tipT: 0.85 }]);
  // a crystal point: prism body + bright tip
  const crys = (b, h, r, lean, col = 'cry', tip = 'cryl') => {
    const t = [b[0] + lean[0] * h, b[1] + h, b[2] + lean[1] * h], m = lerp3(b, t, 0.62);
    return [['cap', b, m, r, r * 0.9, col, { glow: 1 }], ['cap', m, t, r * 0.9, 0.004, tip, { glow: 2 }]];
  };
  const geodeCrys = [
    ...crys([0, 0.335, -0.075], 0.055, 0.017, [0.1, 0.25], 'cry', 'cryw'),
    ...crys([0.026, 0.333, -0.092], 0.042, 0.014, [0.65, -0.1]),
    ...crys([-0.028, 0.333, -0.09], 0.045, 0.014, [-0.65, 0.0]),
    ...crys([0.004, 0.332, -0.112], 0.036, 0.013, [0.1, -0.65], 'cryd', 'cryl'),
  ];
  // Geode Lantern: the back geode grows into a full amethyst shell, cracked open like a lantern
  const crysS = (b, h, r, n, col, tip) => {
    const t = [b[0] + n[0] * h, b[1] + n[1] * h, b[2] + n[2] * h], m = lerp3(b, t, 0.66);
    return [['cap', b, m, r, r * 0.92, col, { side: 'cryd', sideT: 0.85 }], ['cap', m, t, r * 0.92, 0.005, tip, { glow: 1 }]];
  };
  const SC = [0, 0.172, -0.065], SR = [0.172, 0.162, 0.2];
  const shell = [
    ['sph', [0, 0.31, -0.08], 0.06, 'lamp', { glow: 3 }],
    ...[[0, 0, 0.13], [28, 90, 0.1], [30, 145, 0.115], [30, 215, 0.115], [28, 270, 0.1], [56, 105, 0.085], [58, 145, 0.095], [60, 180, 0.1], [58, 215, 0.095], [56, 255, 0.085], [80, 160, 0.07], [80, 200, 0.07]]
      .flatMap(([th, ph, h], i) => {
        const d = [Math.sin(th * D2R) * Math.sin(ph * D2R), Math.cos(th * D2R), Math.sin(th * D2R) * Math.cos(ph * D2R)];
        const k = th > 50 ? 1.0 : 0.94, b = [SC[0] + SR[0] * d[0] * k, SC[1] + SR[1] * d[1] * k, SC[2] + SR[2] * d[2] * k];
        let n = [d[0] / SR[0], d[1] / SR[1], d[2] / SR[2]]; const l = Math.hypot(...n); n = n.map((v) => v / l);
        return crysS(b, h, 0.03 - (th > 50 ? 0.006 : 0), n, i % 4 === 3 ? 'cryd' : 'cry', i % 5 === 0 ? 'cryw' : 'cryl');
      }),
  ];
  DESIGNS.moglow = finish({
    id: 'moglow', vs: 0.013, arch: 'quad',
    pal: {
      fur: '#4b4555', furd: '#36303f', furl: '#686076', sheen: '#a89ab8', face: '#857d92', skin: '#e8a0b0',
      ray: '#ff8fa8', lamp: '#ffd27a', core: '#fff2c4', palm: '#e7b4b4', cl: '#f6ead6', cld: '#b8a088',
      rind: '#8a7a6a', rindd: '#5e5048', rindl: '#a8987e', cry: '#9a6aff', cryd: '#6a3ad8', cryl: '#d8b8ff', cryw: '#ffffff',
    },
    anim: { quirk: ['sniff', 'scratch', 'shakeoff', 'stretch'], bounce: 0.8, gait: 1.25, stride: 0.75, maxSpeed: 2.6 },
    parts: [
      { n: 'body', p: [0, 0.17, 0], s: [
        ['ell', [0, 0.172, -0.065], [0.172, 0.162, 0.2], 'fur', { top: 'furl', topT: 0.82 }],
        ['ell', [0, 0.11, -0.04], [0.13, 0.07, 0.15], 'furd', { paint: 1, belly: 'furd', bellyT: 0.2 }],
        // the half-buried geode
        ['ell', [0, 0.292, -0.085], [0.09, 0.075, 0.085], 'rind', { noise: 0.007, noiseScale: 0.025, top: 'rindl', topT: 0.7 }],
        ['ell', [0, 0.372, -0.085], [0.06, 0.045, 0.056], 'rind', { sub: 1 }],
        ['ell', [0, 0.335, -0.085], [0.046, 0.012, 0.044], 'cryd', { glow: 1 }],
        ['cap', [0.05, 0.34, -0.03], [0.072, 0.3, -0.04], 0.006, 0.006, 'rindd', { paint: 1 }],
        ['cap', [-0.06, 0.33, -0.12], [-0.08, 0.29, -0.12], 0.006, 0.006, 'rindd', { paint: 1 }],
      ] },
      { n: 'geode', parent: 'body', p: [0, 0.3, -0.08], s: geodeCrys },
      { n: 'head', parent: 'body', p: [0, 0.17, 0.1], s: [
        ['ell', [0, 0.168, 0.12], [0.128, 0.118, 0.13], 'fur', { top: 'furl', topT: 0.82 }],
        ['cap', [0, 0.155, 0.19], [0, 0.142, NZ - 0.015], 0.072, 0.042, 'fur', { blend: 0.03 }],
        // lighter face mask so the squinty eyes read
        ['ell', [0, 0.18, 0.205], [0.105, 0.06, 0.06], 'face', { paint: 1 }],
        ['cap', [0, 0.152, 0.25], [0, 0.142, NZ - 0.01], 0.05, 0.04, 'skin', { paint: 1 }],
        ['ell', [0.074, 0.142, 0.205], [0.026, 0.016, 0.02], 'ray', { m: 1, paint: 1 }],
      ] },
      { n: 'nose', parent: 'head', p: [0, 0.142, NZ - 0.02], s: [
        ['cyl', [0, 0.142, NZ - 0.024], [0, 0.142, NZ + 0.004], 0.034, 'lamp', { glow: 2 }],
        ['sph', [0, 0.142, NZ + 0.008], 0.017, 'core', { glow: 3 }],
        ...rays,
      ] },
      { n: 'legFL', parent: 'body', p: [0.12, 0.14, 0.13], mirror: true, s: [
        ['cap', [0.12, 0.14, 0.13], [0.165, 0.065, 0.19], 0.046, 0.04, 'fur'],
        ['ell', [0.18, 0.046, 0.215], [0.07, 0.028, 0.06], 'palm', { rot: [0, 0, -18] }],
        ...claws(0.18, 0.215),
      ] },
      { n: 'legBL', parent: 'body', p: [0.1, 0.1, -0.16], mirror: true, s: [
        ['cap', [0.1, 0.1, -0.16], [0.115, 0.04, -0.15], 0.05, 0.04, 'fur'],
        ['ell', [0.118, 0.022, -0.12], [0.042, 0.022, 0.058], 'palm'],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.14, -0.25], s: [
        ['cap', [0, 0.14, -0.25], [0, 0.12, -0.31], 0.022, 0.012, 'skin'],
      ] },
    ],
    eyes: { part: 'head', at: [0.058, 0.2, 0.232], dir: [0.5, 0.18, 1], style: 'sleepy', rows: ['.kkkk.', 'k....k'], iris: '#2a1c24', px: 0.9 },
    mouth: { part: 'head', at: [0, 0.112, 0.275], dir: [0, -0.5, 1], style: 'smile', px: 0.5 },
    fx: [
      { part: 'nose', at: [0, 0.142, NZ + 0.03], type: 'glow', rate: 0.5, scale: 0.45, color: '#ffd27a' },
      { part: 'geode', at: [0, 0.4, -0.08], type: 'gem', rate: 0.25, scale: 0.35, color: '#d8b8ff' },
      { part: 'legFL', at: [0.18, 0.02, 0.26], type: 'dust', rate: 0.12, scale: 0.45, mirror: true },
    ],
    // Bonded gimmick "Lamp Flare": the star-nose lamp and the geode swell, and crystal gauntlets sprout on the paws (parries).
    bond: {
      parts: [{ n: 'gauntletL', parent: 'legFL', p: [0.17, 0.08, 0.2], mirror: true, s: [
        ...crys([0.17, 0.07, 0.19], 0.07, 0.018, [0.5, -0.3]),
        ...crys([0.2, 0.065, 0.21], 0.05, 0.014, [0.8, 0.1], 'cryd', 'cryl'),
        ...crys([0.145, 0.07, 0.205], 0.045, 0.013, [-0.1, 0.2]),
      ] }],
      grow: { nose: 1.4, geode: 1.5 },
      hat: { part: 'head', at: [0, 0.275, 0.1], scale: 0.52, tilt: 6 },
      aura: 'sparks', auraColor: [2.6, 1.9, 0.9, 1],
    },
    forms: {
      // "Geode Lantern": a full amethyst shell cracked open around a lantern core; the nose beam shines brighter.
      elemental: {
        pal: { fur: '#3e3352', furl: '#6a5c80', face: '#7e6e94', rind: '#5a4a6a', rindd: '#4a3a5a' },
        parts: [{ n: 'shell', parent: 'body', p: [0, 0.3, -0.07], s: shell }],
        eyes: { iris: '#6a3ad8' },
        fx: [
          { part: 'shell', at: [0, 0.48, -0.07], type: 'gem', rate: 1.0, scale: 0.6, color: '#d8b8ff' },
          { part: 'shell', at: [0, 0.32, -0.07], type: 'glow', rate: 0.8, scale: 0.8, color: '#ffd27a' },
          { part: 'nose', at: [0, 0.142, NZ + 0.04], type: 'star', rate: 0.6, scale: 0.4, color: '#fff2c4' },
        ],
      },
    },
  });
}
LORE.moglow = {
  name: 'Moglow', element: 'geo', stage: 1, height: '0.5 m',
  desc: 'Moglow tunnels under the rice paddies by lamplight, sniffing out buried geodes with its star-shaped nose. Farmers follow its glow to find spring water.',
  personality: 'Sleepy, diligent and very proud of the geode on its back.',
  look: 'Plump velvet-violet mole with a star-shaped nose that glows like a warm miner\'s lamp, huge pink spade paws with cream claws, and a half-buried geode on its back cracked open to show glowing amethyst.',
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

// ---------------------------------------------------------------- 10. Polaris (legendary sky whale, Aero/Astro, ~10 m long)
// Ref: tokonmon_roster.md §14.1. A humpback sky-whale: very long white-edged pectoral fins used as wings,
// throat pleats glowing as aurora bands, the Little Dipper on its back with Polaris as a 4-point star on the brow,
// a small kind half-lidded eye, broad serrated flukes trailing aurora streamers. It flies over the farm at dawn.
{
  const BODY = { c: [0, 2.05, 0.5], r: [1.48, 1.38, 3.25] };
  const HEAD = { c: [0, 1.9, 2.85], r: [1.25, 1.06, 2.2] };
  const ELL = [BODY, HEAD];
  const q = (e, x, z) => 1 - (x / e.r[0]) ** 2 - ((z - e.c[2]) / e.r[2]) ** 2;
  const topY = (x, z) => Math.max(...ELL.map((e) => (q(e, x, z) > 0 ? e.c[1] + e.r[1] * Math.sqrt(q(e, x, z)) : -9)));
  const lowY = (x, z) => Math.min(...ELL.map((e) => (q(e, x, z) > 0 ? e.c[1] - e.r[1] * Math.sqrt(q(e, x, z)) : 9)));
  const onTop = (x, z, lift = 0) => [x, topY(x, z) - 0.03 + lift, z];
  // Little Dipper: Polaris (handle tip) on the brow, the bowl over the shoulders
  const LD = [[0, 4.05], [0.2, 3.15], [0.36, 2.35], [0.3, 1.55], [-0.36, 1.3], [-0.5, 0.45], [0.2, 0.6]];
  const stars = [], lines = [];
  const LDP = LD.map(([x, z]) => onTop(x, z));
  LDP.forEach((p, i) => { if (i) stars.push(['sph', [p[0], p[1] + 0.06, p[2]], i === 3 || i === 5 ? 0.21 : 0.17, i % 2 ? 'st' : 'stw', { glow: 1 }]); });
  [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]].forEach(([a, b]) => lines.push(['cap', LDP[a], LDP[b], 0.1, 0.1, 'ln', { paint: 1 }]));
  // faint scattered stars on the back (deterministic)
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 18; i++) { const z = -2.3 + rnd() * 6.0, x = (rnd() * 2 - 1) * 1.05; if (Math.hypot(x, z - 2) > 0.5) stars.push(['sph', onTop(x, z), 0.06, rnd() < 0.5 ? 'st' : 'stw', { paint: 1 }]); }
  const POL = onTop(0, 4.05, 0.1);
  const star4 = (c, R, r, h, col, glow) => ['poly', c, starPts(4, R, r, 0), h, col, { plane: 'xz', glow, rot: [-22, 0, 0] }];
  // aurora throat pleats: lines that follow the lower surface from chin to navel, teal → violet → cyan
  const JC = [0, 1.38, 2.65], JR = [1.2, 0.72, 2.3];
  const pleats = [];
  for (let k = 0; k < 11; k++) {
    const ph = (-72 + k * 14.4) * D2R, zs = [4.55, 3.95, 3.3, 2.65, 2.0, 1.35, 0.75];
    const at = (z) => { const sz = Math.sqrt(Math.max(0, 1 - ((z - JC[2]) / JR[2]) ** 2)) * 0.995; return [JR[0] * Math.sin(ph) * sz, JC[1] - JR[1] * Math.cos(ph) * sz, z]; };
    for (let i = 0; i + 1 < zs.length; i++) pleats.push(['cap', at(zs[i]), at(zs[i + 1]), 0.1, 0.1, i < 2 ? 'a1' : i < 4 ? 'a2' : 'a3', { paint: 1 }]);
  }
  // tubercle knobs on the rostrum and lower jaw
  const knobs = [];
  for (const [x, z] of [[0, 4.6], [0.3, 4.35], [-0.3, 4.35], [0.18, 3.9], [-0.18, 3.9], [0.45, 3.75], [-0.45, 3.75], [0, 4.95]]) knobs.push(['sph', onTop(x, z, -0.02), 0.11, 'nvl']);
  // mouth line: from the snout tip sweeping back and up toward the eye
  const jaw = [[0.0, 1.56, 5.04], [0.32, 1.53, 4.92], [0.6, 1.5, 4.66], [0.8, 1.5, 4.3], [0.95, 1.52, 3.9], [1.06, 1.56, 3.45], [1.13, 1.63, 3.0], [1.18, 1.72, 2.6]];
  const mouth = [];
  for (let i = 0; i + 1 < jaw.length; i++) mouth.push(['cap', jaw[i], jaw[i + 1], 0.095, 0.095, 'mo', { paint: 1, m: 1 }]);
  // pectoral fin (humpback: long, swept, knobbed white leading edge, white underside)
  const FP = [1.15, 1.45, 2.3];
  const finPts = [[0, 0.55], [0.6, 0.5], [1.4, 0.2], [2.3, -0.3], [3.15, -0.95], [3.75, -1.55], [3.5, -1.62], [2.7, -1.25], [1.8, -0.85], [0.9, -0.6], [0, -0.55]];
  const fin = xf([
    ['poly', FP, finPts, 0.13, 'nv', { plane: 'xz', belly: 'bel', bellyT: 0.2 }],
    ...[0.35, 0.95, 1.55, 2.15, 2.75, 3.3].map((u, i) => ['sph', [FP[0] + u, FP[1], FP[2] + 0.55 - u * 0.52 - (u > 2 ? (u - 2) * 0.15 : 0)], 0.16 - i * 0.016, 'fe']),
    ['poly', FP, [[0, 0.55], [0.6, 0.5], [1.4, 0.2], [2.3, -0.3], [3.15, -0.95], [3.75, -1.55], [3.62, -1.6], [3.0, -1.05], [2.2, -0.5], [1.35, -0.05], [0.6, 0.28], [0, 0.32]], 0.15, 'fe', { plane: 'xz', paint: 1 }],
  ], FP, [4, 18, 8]);
  // fluke: broad, serrated trailing edge; streamers of aurora trail from the tips
  const flukePts = [[0, -4.0], [0.6, -4.1], [1.35, -4.4], [2.1, -4.85], [2.35, -5.25], [2.0, -5.3], [1.7, -5.12], [1.4, -5.18], [1.05, -5.0], [0.7, -5.06], [0.35, -4.9], [0, -4.75],
    [-0.35, -4.9], [-0.7, -5.06], [-1.05, -5.0], [-1.4, -5.18], [-1.7, -5.12], [-2.0, -5.3], [-2.35, -5.25], [-2.1, -4.85], [-1.35, -4.4], [-0.6, -4.1]];
  const streamer = (s, col) => [
    ['cap', [2.15 * s, 2.32, -5.2], [2.35 * s, 2.42, -5.9], 0.08, 0.07, col, { glow: 2 }],
    ['cap', [2.35 * s, 2.42, -5.9], [2.3 * s, 2.36, -6.6], 0.07, 0.03, col, { glow: 2 }],
  ];
  // bonded: aurora ribbons flowing from the fins' trailing edges
  const rib = (u0, len, col, w) => {
    const z0 = 0.55 - u0 * 0.52 - 0.95, pts = [];
    for (let i = 0; i <= 6; i++) pts.push([u0 + Math.sin(i * 1.1) * 0.18 + i * 0.05, z0 - i * len / 6]);
    for (let i = 6; i >= 0; i--) pts.push([u0 + Math.sin(i * 1.1) * 0.18 + i * 0.05 + w * (1 - i / 9), z0 - i * len / 6]);
    return ['poly', [FP[0], FP[1] - 0.04, FP[2]], pts, 0.05, col, { plane: 'xz', glow: 1 }];
  };
  const ribbon = xf([rib(0.7, 2.6, 'a1', 0.32), rib(1.6, 3.0, 'a2', 0.3), rib(2.5, 3.2, 'a3', 0.28)], FP, [4, 18, 8]);
  // North Star: giant aurora wings rising above the fins (stacked bands teal / violet / cyan)
  const curtain = (lift, R0, R1, col, sw) => {
    const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10, u = R0 + (R1 - R0) * t; pts.push([u, 0.55 - t * 1.9 + Math.sin(t * 9) * 0.18]); }
    for (let i = 10; i >= 0; i--) { const t = i / 10, u = R0 + (R1 - R0) * t; pts.push([u + 0.2, -0.9 - t * 1.4 + sw * Math.sin(t * 7) * 0.1]); }
    return ['poly', [FP[0], FP[1] + lift, FP[2]], pts, 0.06, col, { plane: 'xz', glow: 1, stripes: { axis: 'x', p: 0.55, w: 0.12, col: 'a4' } }];
  };
  const awing = xf([curtain(0.2, 0.2, 5.4, 'a3', 1), curtain(0.32, 0.5, 4.6, 'a2', -1), curtain(0.44, 0.9, 3.6, 'a1', 1)], FP, [4, 18, 34]);
  // Big Dipper + Cassiopeia-like zigzag on the flanks for the North Star sky body
  const skyStars = [];
  for (const [x, z] of [[0.9, -0.2], [1.0, -0.9], [0.75, -1.55], [0.85, -2.1], [0.3, -2.3], [0.2, -1.65], [0.75, -1.55]]) skyStars.push(['sph', onTop(x, z, 0.04), 0.13, 'stw', { glow: 2 }]);
  for (const [x, z] of [[-0.9, -0.4], [-1.05, -1.0], [-0.8, -1.5], [-1.05, -2.0], [-0.85, -2.5]]) skyStars.push(['sph', onTop(x, z, 0.04), 0.12, 'st', { glow: 2 }]);
  seed = 5;
  for (let i = 0; i < 26; i++) { const z = -2.6 + rnd() * 7.0, a = (rnd() * 2 - 1) * 2.2, e = z > 1.2 ? HEAD : BODY, qq = q(e, 0, z); if (qq <= 0) continue; const R = Math.sqrt(qq); skyStars.push(['sph', [Math.sin(a) * e.r[0] * R * 1.02, e.c[1] + Math.cos(a) * e.r[1] * R * 1.02, z], 0.07, rnd() < 0.5 ? 'st' : 'stw', { glow: 2 }]); }
  DESIGNS.polaris = finish({
    id: 'polaris', vs: 0.08, arch: 'flyer',
    pal: {
      nv: '#2e4a8a', nvd: '#1e2a5a', nvl: '#4a6ab8', rim: '#8aa8ff', bel: '#e8f0ff', beld: '#b8c8e8', fe: '#ffffff', mo: '#121638',
      a1: '#a8f5c8', a2: '#b26bff', a3: '#5ff4ff', a4: '#e8fff6', st: '#ffd98a', stw: '#ffffff', ln: '#9ab8ff', pol: '#fff6c8', cl: '#f4f8ff',
    },
    anim: { quirk: ['sway', 'roar', 'nod'], hover: 1.6, flap: 0.28, bounce: 0.4, tail: 0.12, maxSpeed: 4.5 },
    parts: [
      { n: 'body', p: [0, 2.0, 0.6], s: [
        ['ell', BODY.c, BODY.r, 'nv', { belly: 'bel', bellyT: 0.32}],
        ['ell', HEAD.c, HEAD.r, 'nv', { blend: 0.35, belly: 'bel', bellyT: 0.32}],
        // the heavier lower jaw / throat
        ['ell', [0, 1.38, 2.65], [1.2, 0.72, 2.3], 'bel', { blend: 0.3, top: 'nv', topT: 0.5 }],
        ['ell', BODY.c, BODY.r, 'nv', { paint: 1, belly: 'bel', bellyT: 0.32}],
        ['ell', HEAD.c, HEAD.r, 'nv', { paint: 1, belly: 'bel', bellyT: 0.32}],
        ['ell', [0, 1.3, 2.65], [1.15, 0.62, 2.3], 'bel', { paint: 1 }],
        ...pleats,
        ...mouth,
        // small dorsal hump
        ['poly', [0, 0, 0], [[-1.2, 3.25], [-1.7, 3.75], [-2.25, 3.85], [-2.2, 3.2]], 0.16, 'nv', { plane: 'zy', top: 'nvl', topT: 0.6 }],
        ...knobs,
        ...lines, ...stars,
        star4(POL, 0.8, 0.16, 0.09, 'pol', 1),
        ['sph', [POL[0], POL[1] + 0.05, POL[2]], 0.17, 'pol', { glow: 2 }],
      ] },
      { n: 'finL', parent: 'body', p: FP, mirror: true, sway: { axis: 'z', amp: 0.2, freq: 0.42, move: 0.6 }, s: fin },
      { n: 'tail', parent: 'body', p: [0, 2.15, -2.3], s: [
        ['cap', [0, 2.1, -2.1], [0, 2.25, -3.15], 1.05, 0.66, 'nv', { belly: 'bel', bellyT: 0.4}],
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 2.25, -3.15], sway: { axis: 'x', amp: 0.08, freq: 0.45 }, s: [
        ['cap', [0, 2.25, -3.15], [0, 2.32, -4.05], 0.66, 0.34, 'nv', { belly: 'bel', bellyT: 0.4 }],
      ] },
      { n: 'tail3', parent: 'tail2', p: [0, 2.32, -4.0], sway: { axis: 'x', amp: 0.15, freq: 0.45, phase: -0.9 }, s: [
        ['cap', [0, 2.32, -3.95], [0, 2.32, -4.55], 0.34, 0.18, 'nv'],
        ['poly', [0, 2.32, 0], flukePts, 0.11, 'nv', { plane: 'xz', belly: 'bel', bellyT: 0.2 }],
        ['poly', [0, 2.32, 0], [[2.1, -4.85], [2.35, -5.25], [2.0, -5.3], [1.7, -5.12], [1.4, -5.18], [1.05, -5.0], [0.7, -5.06], [0.35, -4.9], [0, -4.75], [-0.35, -4.9], [-0.7, -5.06], [-1.05, -5.0], [-1.4, -5.18], [-1.7, -5.12], [-2.0, -5.3], [-2.35, -5.25], [-2.1, -4.85], [-1.7, -4.95], [-1.2, -4.85], [-0.6, -4.7], [0, -4.55], [0.6, -4.7], [1.2, -4.85], [1.7, -4.95]], 0.13, 'fe', { plane: 'xz', paint: 1 }],
        ...streamer(1, 'a3'), ...streamer(-1, 'a1'),
      ] },
    ],
    eyes: { part: 'body', at: [1.17, 1.86, 2.45], dir: [1, 0.08, 0.25], style: 'sleepy', rows: ['.kkkkk.', 'kkkkkkk', 'kwwiiik', '.kiiik.', '..kkk..'], iris: '#2c46b8', px: 1.1 },
    mouth: { style: 'none' },
    fx: [
      { part: 'body', at: POL, type: 'star', rate: 1.4, scale: 2.4, color: '#fff6c8' },
      { part: 'body', at: onTop(0.3, 1.0), type: 'star', rate: 0.6, scale: 1.6 },
      { part: 'tail3', at: [2.3, 2.36, -6.4], type: 'smoke', rate: 0.9, scale: 2.2, color: '#f4f8ff', mirror: true },
      { part: 'finL', at: P3(FP, [4, 18, 8], [FP[0] + 3.6, FP[1], FP[2] - 1.6]), type: 'smoke', rate: 0.6, scale: 1.8, color: '#f4f8ff', mirror: true },
    ],
    // Bonded gimmick "Aurora Song": aurora ribbons stream from the fins, the fins stretch, star-motes swirl.
    bond: {
      parts: [{ n: 'ribbonL', parent: 'finL', p: FP, mirror: true, s: ribbon }],
      grow: { finL: 1.12, finR: 1.12 },
      hat: { part: 'body', at: [0, topY(0, 3.5) - 0.04, 3.5], scale: 1.5, tilt: -14 },
      aura: 'sparks', auraColor: AURA.astro,
    },
    forms: {
      // "North Star": a night-sky body full of constellations, giant aurora wings, and Polaris flaring into a beacon.
      elemental: {
        pal: { nv: '#18204e', nvl: '#2c3a7a', bel: '#3a3a8a', fe: '#c8d8ff', mo: '#0a0c24' },
        parts: [
          { n: 'sky', parent: 'body', p: [0, 2.0, 0.6], s: skyStars },
          { n: 'auroraL', parent: 'finL', p: FP, mirror: true, s: awing },
          { n: 'beacon', parent: 'body', p: POL, s: [
            star4([POL[0], POL[1] + 0.12, POL[2]], 1.05, 0.2, 0.08, 'pol', 3),
            ['cap', [POL[0], POL[1] + 0.2, POL[2]], [POL[0], POL[1] + 7.5, POL[2] + 0.6], 0.18, 0.06, 'pol', { glow: 3 }],
          ] },
        ],
        eyes: { iris: '#ffd98a' },
        fx: [
          { part: 'beacon', at: [POL[0], POL[1] + 6, POL[2] + 0.5], type: 'star', rate: 2.0, scale: 2.5, color: '#fff6c8' },
          { part: 'auroraL', at: P3(FP, [4, 18, 34], [FP[0] + 4.5, FP[1] + 0.3, FP[2] - 1.0]), type: 'glow', rate: 1.0, scale: 2.0, color: '#b26bff', mirror: true },
        ],
      },
    },
  });
}
LORE.polaris = {
  name: 'Polaris', element: 'aero', element2: 'astro', stage: 1, legendary: true, height: '10 m (length)',
  desc: 'The great sky whale that swims the jet stream above Osaka Bay. Sailors once steered by the star on its brow; it is said to sing the aurora into being.',
  personality: 'Ancient, gentle and patient; it guides the lost home.',
  look: 'Colossal indigo humpback with very long white-edged pectoral fins for wings, the Little Dipper glowing on its back, Polaris as a four-point star on its brow, aurora-coloured throat pleats and a small, kind, half-lidded eye.',
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

// ---------------------------------------------------------------- 15–18. Farm animals (opening cinematic, NOT Tokonmon)
// Ref: tokonmon_roster.md §7. Real Japanese breeds, realistic-cute proportions (head ~30 %), small bead eyes,
// no element accent, no glow, no bond/forms: humble on purpose next to any Tokonmon. Charm comes from behaviour.
{
  // Holstein dairy cow "Hanako"
  const patch = (c, r, rot, seed) => ['ell', c, r, 'k', { paint: 1, rot, noise: 0.035, noiseScale: 0.09 + seed * 0.01 }];
  DESIGNS.cow = finish({
    id: 'cow', vs: 0.036, arch: 'quad',
    pal: { w: '#f4f2ee', wd: '#d6d2da', k: '#1e1a22', pk: '#f0a8b0', pkd: '#c97a86', hn: '#efe4c4', hf: '#3a3230', strap: '#c8302c', bell: '#d8a03a', belld: '#8a6414', nos: '#7a4450' },
    anim: { quirk: ['sniff', 'shakeoff', 'nod'], gait: 0.8, stride: 0.8, bounce: 0.5, tail: 1.4, maxSpeed: 2.5 },
    parts: [
      { n: 'body', p: [0, 0.95, 0], s: [
        ['ell', [0, 0.92, -0.02], [0.33, 0.36, 0.6], 'w', { belly: 'wd', bellyT: 0.6 }],
        ['ell', [0, 0.97, 0.36], [0.31, 0.34, 0.3], 'w', { blend: 0.08, belly: 'wd', bellyT: 0.6 }],
        ['ell', [0, 0.98, -0.42], [0.32, 0.33, 0.28], 'w', { blend: 0.08, belly: 'wd', bellyT: 0.6 }],
        patch([0.22, 1.02, 0.05], [0.2, 0.25, 0.28], [0, 0, 10], 1),
        patch([-0.2, 1.06, -0.3], [0.22, 0.24, 0.24], [0, 0, -14], 2),
        patch([0.12, 1.14, -0.5], [0.18, 0.16, 0.16], [0, 0, 0], 3),
        patch([-0.22, 0.92, 0.38], [0.16, 0.22, 0.15], [0, 0, 0], 4),
        // udder
        ['ell', [0, 0.57, -0.32], [0.13, 0.09, 0.13], 'pk', { belly: 'pkd', bellyT: 0.6 }],
        ...[[0.05, -0.27], [-0.05, -0.27], [0.05, -0.37], [-0.05, -0.37]].map(([x, z]) => ['cap', [x, 0.51, z], [x, 0.45, z], 0.026, 0.022, 'pkd']),
      ] },
      { n: 'neck', parent: 'body', p: [0, 1.05, 0.5], s: [
        ['cap', [0, 1.02, 0.45], [0, 1.08, 0.66], 0.2, 0.17, 'w'],
        ['tor', [0, 1.03, 0.6], 0.16, 0.028, 'strap', { rot: [-62, 0, 0] }],
        ['cyl', [0, 0.82, 0.67], [0, 0.91, 0.67], 0.055, 'bell'],
        ['cyl', [0, 0.8, 0.67], [0, 0.83, 0.67], 0.068, 'bell'],
        ['sph', [0, 0.79, 0.67], 0.022, 'belld'],
      ] },
      { n: 'head', parent: 'neck', p: [0, 1.12, 0.66], s: sclS([
        ['ell', [0, 1.14, 0.8], [0.15, 0.17, 0.2], 'w', { rot: [24, 0, 0] }],
        ['ell', [0, 1.02, 0.95], [0.125, 0.09, 0.09], 'pk', { blend: 0.03 }],
        ['sph', [0.055, 1.03, 1.05], 0.022, 'nos', { m: 1 }],
        patch([0.08, 1.24, 0.78], [0.1, 0.1, 0.14], [0, 0, 0], 5),
        ['cap', [0.1, 1.28, 0.72], [0.19, 1.34, 0.7], 0.03, 0.018, 'hn', { m: 1 }],
        ['ell', [0.21, 1.18, 0.7], [0.1, 0.04, 0.06], 'w', { m: 1, rot: [0, 0, -18] }],
        ['ell', [0.22, 1.18, 0.72], [0.065, 0.022, 0.03], 'pk', { m: 1, rot: [0, 0, -18], paint: 1 }],
      ], [0, 1.12, 0.66], 1.2) },
      { n: 'legFL', parent: 'body', p: [0.19, 0.78, 0.4], mirror: true, s: [
        ['cap', [0.19, 0.75, 0.4], [0.19, 0.08, 0.41], 0.085, 0.068, 'w'],
        ['cap', [0.19, 0.09, 0.41], [0.19, 0.02, 0.42], 0.07, 0.07, 'hf'],
      ] },
      { n: 'legBL', parent: 'body', p: [0.19, 0.78, -0.46], mirror: true, s: [
        ['ell', [0.2, 0.78, -0.46], [0.12, 0.22, 0.17], 'w'],
        ['cap', [0.2, 0.66, -0.48], [0.2, 0.08, -0.47], 0.085, 0.068, 'w'],
        ['cap', [0.2, 0.09, -0.47], [0.2, 0.02, -0.46], 0.07, 0.07, 'hf'],
      ] },
      { n: 'tail', parent: 'body', p: [0, 1.16, -0.64], s: [
        ['cap', [0, 1.16, -0.64], [0, 0.74, -0.7], 0.026, 0.02, 'w'],
        ['ell', [0, 0.68, -0.7], [0.04, 0.08, 0.04], 'k'],
      ] },
    ],
    eyes: { part: 'head', at: [0.153, 1.18, 0.9], dir: [0.8, 0.1, 0.6], style: 'bead', iris: '#2a1c14', px: 0.9 },
    mouth: { style: 'none' },
  });
}
LORE.cow = { name: 'Cow', element: 'none', stage: 0, height: '1.4 m', farm: true, desc: 'Grandpa\'s dairy cow, Hanako. She has never once been impressed by a Tokonmon.', personality: 'Placid and unbothered.', look: 'Black-and-white Holstein with bold patches, a pink muzzle and udder, little cream horns and a red collar with a brass cowbell.' };

// Nagoya Cochin hen (golden-buff; plainer than any Tokonmon chicken)
DESIGNS.chicken = finish({
  id: 'chicken', vs: 0.011, arch: 'biped',
  pal: { b: '#e0a050', bl: '#f0c27a', bd: '#a05a2a', t: '#6a3a1e', r: '#e0323c', y: '#f2c84a', yd: '#c8962a' },
  anim: { quirk: ['sniff', 'shakeoff', 'hop', 'nod'], gait: 1.6, stride: 1.2, bounce: 1.3, maxSpeed: 3 },
  parts: [
    { n: 'body', p: [0, 0.2, 0], s: [
      ['ell', [0, 0.2, -0.02], [0.11, 0.1, 0.14], 'b', { belly: 'bl', bellyT: 0.4 }],
      ['ell', [0, 0.24, 0.075], [0.08, 0.09, 0.07], 'b', { blend: 0.03, front: 'bl', frontT: 0.5 }],
      // tail fan (darker)
      ['ell', [0, 0.29, -0.14], [0.045, 0.085, 0.055], 'bd', { rot: [-28, 0, 0] }],
      ['ell', [0, 0.31, -0.165], [0.03, 0.065, 0.035], 't', { rot: [-34, 0, 0] }],
    ] },
    { n: 'head', parent: 'body', p: [0, 0.31, 0.08], s: [
      ['ell', [0, 0.35, 0.1], [0.052, 0.058, 0.054], 'b'],
      ['sph', [0, 0.412, 0.085], 0.02, 'r'],
      ['sph', [0, 0.42, 0.108], 0.019, 'r'],
      ['sph', [0, 0.408, 0.13], 0.016, 'r'],
      ['cap', [0, 0.345, 0.145], [0, 0.335, 0.182], 0.017, 0.006, 'y'],
      ['ell', [0, 0.305, 0.138], [0.015, 0.022, 0.012], 'r'],
    ] },
    { n: 'wingL', parent: 'body', p: [0.1, 0.24, 0.0], mirror: true, s: [
      ['ell', [0.098, 0.21, -0.03], [0.026, 0.066, 0.1], 'b', { rot: [-10, 0, 0], back: 'bd', backT: 0.5 }],
    ] },
    { n: 'legL', parent: 'body', p: [0.04, 0.12, 0.0], mirror: true, s: [
      ['cap', [0.04, 0.12, 0.0], [0.045, 0.02, 0.01], 0.011, 0.009, 'y'],
      ['cap', [0.045, 0.012, 0.01], [0.028, 0.008, 0.05], 0.008, 0.006, 'yd'],
      ['cap', [0.045, 0.012, 0.01], [0.062, 0.008, 0.05], 0.008, 0.006, 'yd'],
      ['cap', [0.045, 0.012, 0.01], [0.045, 0.008, -0.025], 0.008, 0.006, 'yd'],
    ] },
  ],
  eyes: { part: 'head', at: [0.036, 0.362, 0.135], dir: [0.8, 0.05, 1], style: 'bead', iris: '#1c1410', px: 0.9 },
  mouth: { part: 'head', at: [0, 0.335, 0.19], dir: [0, 0, 1], style: 'beak', px: 0.5 },
});
LORE.chicken = { name: 'Chicken', element: 'none', stage: 0, height: '0.4 m', farm: true, desc: 'One of the farm\'s hens. Lays an egg every morning and chases the shiba every afternoon.', personality: 'Fussy and fearless.', look: 'Plump golden-buff Nagoya Cochin hen with a darker tail, a red comb and wattle and a yellow beak and feet.' };

// Berkshire "kurobuta" pig (black with six white points)
DESIGNS.pig = finish({
  id: 'pig', vs: 0.018, arch: 'quad',
  pal: { p: '#3a3038', pl: '#51464f', pd: '#2a2228', w: '#f0e8e0', sn: '#e8a0a8', snd: '#8a3a44', hf: '#d8ccc2' },
  anim: { quirk: ['sniff', 'shakeoff', 'happy'], gait: 1.2, stride: 0.8, bounce: 1.0, tail: 1.5, maxSpeed: 2.5 },
  parts: [
    { n: 'body', p: [0, 0.32, 0], s: [
      ['ell', [0, 0.33, -0.03], [0.22, 0.2, 0.32], 'p', { top: 'pl', topT: 0.75, belly: 'pd', bellyT: 0.5 }],
    ] },
    { n: 'head', parent: 'body', p: [0, 0.38, 0.24], s: [
      ['ell', [0, 0.38, 0.33], [0.155, 0.145, 0.14], 'p', { top: 'pl', topT: 0.75 }],
      ['cap', [0, 0.36, 0.4], [0, 0.35, 0.47], 0.085, 0.075, 'p', { blend: 0.03 }],
      ['cap', [0, 0.36, 0.43], [0, 0.35, 0.47], 0.08, 0.075, 'w', { paint: 1 }],
      ['cyl', [0, 0.35, 0.47], [0, 0.35, 0.505], 0.068, 'sn'],
      ['sph', [0.026, 0.35, 0.505], 0.014, 'snd', { m: 1 }],
      // pricked Berkshire ears
      ['poly', [0.09, 0.49, 0.29], [[-0.055, 0], [0.05, 0], [0.012, 0.11]], 0.014, 'p', { m: 1, rot: [-12, -8, -22] }],
      ['poly', [0.09, 0.495, 0.302], [[-0.03, 0.01], [0.028, 0.01], [0.008, 0.07]], 0.006, 'sn', { m: 1, rot: [-12, -8, -22] }],
    ] },
    { n: 'legFL', parent: 'body', p: [0.12, 0.2, 0.18], mirror: true, s: [
      ['cap', [0.12, 0.22, 0.18], [0.12, 0.04, 0.19], 0.05, 0.045, 'p'],
      ['cap', [0.12, 0.09, 0.19], [0.12, 0.04, 0.19], 0.047, 0.045, 'w', { paint: 1 }],
      ['cap', [0.12, 0.04, 0.19], [0.12, 0.012, 0.2], 0.045, 0.045, 'hf'],
    ] },
    { n: 'legBL', parent: 'body', p: [0.12, 0.2, -0.2], mirror: true, s: [
      ['cap', [0.12, 0.22, -0.2], [0.12, 0.04, -0.2], 0.055, 0.045, 'p'],
      ['cap', [0.12, 0.09, -0.2], [0.12, 0.04, -0.2], 0.047, 0.045, 'w', { paint: 1 }],
      ['cap', [0.12, 0.04, -0.2], [0.12, 0.012, -0.19], 0.045, 0.045, 'hf'],
    ] },
    { n: 'tail', parent: 'body', p: [0, 0.4, -0.33], s: [
      ['tor', [0, 0.43, -0.37], 0.035, 0.013, 'p', { axis: 'z' }],
      ['box', [0.03, 0.4, -0.37], [0.02, 0.02, 0.03], 'p', { sub: 1 }],
      ['cap', [0, 0.41, -0.33], [0.02, 0.41, -0.37], 0.014, 0.013, 'p'],
      ['sph', [0.035, 0.44, -0.37], 0.016, 'w'],
    ] },
  ],
  eyes: { part: 'head', at: [0.07, 0.43, 0.43], dir: [0.45, 0.1, 1], style: 'bead', iris: '#1c1410', px: 1.0, cmap: { k: '#0e0a0e', w: '#ffffff' } },
  mouth: { style: 'none' },
});
LORE.pig = { name: 'Pig', element: 'none', stage: 0, height: '0.6 m', farm: true, desc: 'The farm pig, Butaro. Sleeps in the sun and snores like a tractor.', personality: 'Lazy and content.', look: 'Round black Berkshire "kurobuta" pig with six white points (snout, feet and tail tip), a pink snout, pricked ears and a curly tail.' };

// Shiba Inu "Pochi"
DESIGNS.farm_dog = finish({
  id: 'farm_dog', vs: 0.016, arch: 'quad',
  pal: { o: '#d0782a', od: '#8a4a2a', ol: '#e6964a', w: '#f6e6cc', k: '#1e1a1c', col: '#2f6fd8', tag: '#ffd23f', pk: '#e88a8a' },
  anim: { quirk: ['sniff', 'shakeoff', 'happy', 'scratch'], gait: 1.2, bounce: 1.1, tail: 1.6, maxSpeed: 5 },
  parts: [
    { n: 'body', p: [0, 0.33, 0], s: [
      ['ell', [0, 0.34, -0.03], [0.135, 0.135, 0.26], 'o', { top: 'ol', topT: 0.8 }],
      // urajiro: cream chest and belly
      ['ell', [0, 0.3, 0.1], [0.11, 0.13, 0.12], 'w', { paint: 1 }],
      ['ell', [0, 0.24, -0.04], [0.1, 0.06, 0.22], 'w', { paint: 1 }],
      ['tor', [0, 0.44, 0.19], 0.092, 0.02, 'col', { rot: [-52, 0, 0] }],
      ['sph', [0, 0.375, 0.275], 0.02, 'tag'],
    ] },
    { n: 'head', parent: 'body', p: [0, 0.46, 0.22], s: [
      ['ell', [0, 0.5, 0.28], [0.12, 0.11, 0.11], 'o', { top: 'ol', topT: 0.8 }],
      ['cap', [0, 0.47, 0.33], [0, 0.455, 0.41], 0.062, 0.045, 'o', { blend: 0.025 }],
      // urajiro cheeks + muzzle
      ['cap', [0, 0.465, 0.35], [0, 0.455, 0.41], 0.058, 0.045, 'w', { paint: 1 }],
      ['ell', [0.068, 0.46, 0.33], [0.055, 0.045, 0.055], 'w', { m: 1, paint: 1 }],
      ['ell', [0.04, 0.565, 0.355], [0.022, 0.012, 0.012], 'w', { m: 1, paint: 1 }],
      ['ell', [0, 0.47, 0.455], [0.024, 0.017, 0.014], 'k'],
      // pricked triangular ears
      ['poly', [0.068, 0.585, 0.25], [[-0.042, 0], [0.042, 0], [0.008, 0.095]], 0.018, 'o', { m: 1, rot: [-8, -8, -14] }],
      ['poly', [0.068, 0.588, 0.268], [[-0.024, 0.01], [0.024, 0.01], [0.006, 0.06]], 0.006, 'w', { m: 1, rot: [-8, -8, -14] }],
    ] },
    { n: 'legFL', parent: 'body', p: [0.075, 0.27, 0.15], mirror: true, s: [
      ['cap', [0.075, 0.28, 0.15], [0.078, 0.03, 0.17], 0.038, 0.03, 'o'],
      ['cap', [0.078, 0.13, 0.168], [0.078, 0.025, 0.175], 0.034, 0.031, 'w', { paint: 1 }],
    ] },
    { n: 'legBL', parent: 'body', p: [0.08, 0.27, -0.2], mirror: true, s: [
      ['ell', [0.085, 0.26, -0.21], [0.05, 0.08, 0.07], 'o'],
      ['cap', [0.085, 0.2, -0.22], [0.085, 0.03, -0.2], 0.034, 0.03, 'o'],
      ['cap', [0.085, 0.12, -0.21], [0.085, 0.025, -0.2], 0.034, 0.031, 'w', { paint: 1 }],
    ] },
    { n: 'tail', parent: 'body', p: [0, 0.42, -0.26], s: [
      ['tor', [0, 0.53, -0.24], 0.072, 0.038, 'o', { axis: 'x', belly: 'w', bellyT: 0.3 }],
      ['box', [0, 0.47, -0.16], [0.06, 0.06, 0.05], 'o', { sub: 1 }],
    ] },
  ],
  eyes: { part: 'head', at: [0.05, 0.53, 0.37], dir: [0.4, 0.08, 1], style: 'bead', iris: '#2a1810', px: 1.0 },
  mouth: { part: 'head', at: [0, 0.44, 0.45], dir: [0, -0.35, 1], style: 'cat', px: 0.45 },
});
LORE.farm_dog = { name: 'Shiba', element: 'none', stage: 0, height: '0.6 m', farm: true, desc: 'Pochi, the family shiba inu. Herds the chickens, guards the gate and greets every sunrise with a bark.', personality: 'Loyal, bold and a little stubborn.', look: 'Red shiba inu with cream urajiro cheeks, chest and socks, pricked ears, a tightly curled tail and a blue collar with a gold tag.' };
