// Song / artist / album-cover Tokonmon (docs/TOKONMON.md §3, studies in docs/refs/tokonmon_roster.md §10.5–10.6,
// §11, §13 and docs/refs/music_albums.md). Voxel DSL: docs/MODELING.md. Model space is absolute: metres,
// +y up, +z = front, left = +x. Every design here is a single-stage final with a bonding overlay
// (`bond`) and an Elemental Form (`forms.elemental`).
//
//   Team Metallica / metal bullies : sandmare (Ecto/Geo, "Enter Sandman") · ironmaw (Ferro, "Iron Man")
//   Elite Four (Beatles) partners  : yellowsub (Hydro/Ferro) · blackbyrd (Aero) · lucydiamond (Astro/Cryo)
//   Other artists                  : thrillghoul (Ecto, "Thriller") · ziggystar (Astro/Volto, "Ziggy Stardust")
//
// Originality: each song is reduced to one or two transformed motifs (sand hourglass, iron-filing field lines,
// porthole eyes, string-shaft feathers, brilliant-cut diamond, V-chevron carapace, kumadori bolt). No logos,
// lyrics, album compositions or real likenesses.

export const DESIGNS = {};
export const LORE = {};

// ---------------------------------------------------------------- helpers
const D2R = Math.PI / 180;
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const mx = (p) => [-p[0], p[1], p[2]];
// Smooth tapered tube through points (one capsule per segment).
function tube(pts, r0, r1, col, opts = {}) {
  const out = [], n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const ra = r0 + (r1 - r0) * (i / n), rb = r0 + (r1 - r0) * ((i + 1) / n);
    out.push(['cap', pts[i], pts[i + 1], ra, rb, col, { ...opts }]);
  }
  return out;
}
// Quadratic / cubic bezier sampled into n+1 points.
function bez(a, b, c, n = 6) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([0, 1, 2].map((k) => u * u * a[k] + 2 * u * t * b[k] + t * t * c[k])); }
  return out;
}
function bez3(a, b, c, d, n = 8) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([0, 1, 2].map((k) => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k])); }
  return out;
}
// Procedural pixel art: n×m rows from f(x, y, r, a) → char ('.' = empty); x,y in [-1,1], y up.
function pix(n, f, m = n) {
  const rows = [];
  for (let j = 0; j < m; j++) {
    let row = '';
    for (let i = 0; i < n; i++) { const x = ((i + 0.5) / n) * 2 - 1, y = 1 - ((j + 0.5) / m) * 2; row += f(x, y, Math.hypot(x, y), Math.atan2(y, x)) || '.'; }
    rows.push(row);
  }
  return rows;
}
// Euler rotation (degrees, three.js XYZ) that turns local +z into direction n.
function rotTo(n) { const v = norm3(n); return [Math.atan2(-v[1], v[2]) / D2R, Math.asin(Math.max(-1, Math.min(1, v[0]))) / D2R, 0]; }
// Carve the half-space beyond a plane (point p, outward normal n) — flat facets on SDF solids.
const cutPlane = (p, n, big = 1.2) => { const u = norm3(n); return ['box', add3(p, u, big), [big, big, big], 'k', { sub: 1, rot: rotTo(u) }]; };
// 5-point star polygon (outer radius R, inner r), rotated by a0 (rad), in the u,v plane.
const star5 = (R, r = R * 0.45, a0 = 0) => Array.from({ length: 10 }, (_, i) => { const a = a0 + Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R; return [Math.cos(a) * rr, Math.sin(a) * rr]; });
// Emissive paint that displays ≈ the given colour unshaded (glow:1 multiplies linear colour by 1.6):
// used for deliberately flat, cel-free colour fields (Edelmann swirls, neon trims).
function flat(hex, k = 0.97) {
  const n = parseInt(hex.slice(1), 16), out = [];
  for (const s of [16, 8, 0]) {
    const c = ((n >> s) & 255) / 255, lin = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const l2 = (lin / 1.6) * k, sr = l2 <= 0.0031308 ? l2 * 12.92 : 1.055 * Math.pow(l2, 1 / 2.4) - 0.055;
    out.push(Math.max(0, Math.min(255, Math.round(sr * 255))));
  }
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}
// Uniformly scale (k) shapes about origin o, then translate by t (keeps sizes/opts consistent).
function xform(shapes, k = 1, o = [0, 0, 0], t = [0, 0, 0]) {
  const P = (p) => [o[0] + k * (p[0] - o[0]) + t[0], o[1] + k * (p[1] - o[1]) + t[1], o[2] + k * (p[2] - o[2]) + t[2]];
  const so = (q) => {
    if (!q) return q;
    const r = { ...q };
    for (const key of ['noise', 'noiseScale', 'fat', 'round', 'blend']) if (r[key]) r[key] *= k;
    if (r.stripes) r.stripes = { ...r.stripes, p: r.stripes.p * k, w: r.stripes.w * k, o: (r.stripes.o || 0) * k };
    if (r.grad) { const ax = { x: 0, y: 1, z: 2 }[r.grad.axis || 'y']; r.grad = { ...r.grad, a: o[ax] + k * (r.grad.a - o[ax]) + t[ax], b: o[ax] + k * (r.grad.b - o[ax]) + t[ax] }; }
    return r;
  };
  return shapes.map((s) => {
    const [kind] = s;
    if (kind === 'sph') return [kind, P(s[1]), s[2] * k, s[3], so(s[4])];
    if (kind === 'ell' || kind === 'box') return [kind, P(s[1]), s[2].map((v) => v * k), s[3], so(s[4])];
    if (kind === 'cap') return [kind, P(s[1]), P(s[2]), s[3] * k, s[4] * k, s[5], so(s[6])];
    if (kind === 'cyl') return [kind, P(s[1]), P(s[2]), s[3] * k, s[4], so(s[5])];
    if (kind === 'tor') return [kind, P(s[1]), s[2] * k, s[3] * k, s[4], so(s[5])];
    if (kind === 'poly') return [kind, P(s[1]), s[2].map(([u, v]) => [u * k, v * k]), s[3] * k, s[4], so(s[5])];
    return s;
  });
}
// Point on the surface of the union of axis-aligned ellipsoids (centres C[], radii R[]) seen from C[0]
// along direction d (d is in units of the first ellipsoid's radii, like onEll).
function onEllU(C, R, d) {
  const dir = norm3([d[0] * R[0][0], d[1] * R[0][1], d[2] * R[0][2]]), o = C[0];
  const sd = (p) => Math.min(...C.map((c, i) => { const r = R[i], q = [(p[0] - c[0]) / r[0], (p[1] - c[1]) / r[1], (p[2] - c[2]) / r[2]]; return (Math.hypot(q[0], q[1], q[2]) - 1) * Math.min(...r); }));
  let lo = 0, hi = 3;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (sd(add3(o, dir, m)) < 0) lo = m; else hi = m; }
  return add3(o, dir, lo);
}
// Rigidly rotate shapes about a pivot by Euler degrees (three.js XYZ order); composes with each shape's own rot.
const eulM = (r) => { const [a, b, c] = r.map((v) => v * D2R), ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  return [[cb * cc, -cb * sc, sb], [ca * sc + sa * sb * cc, ca * cc - sa * sb * sc, -sa * cb], [sa * sc - ca * sb * cc, sa * cc + ca * sb * sc, ca * cb]]; };
const mulM = (A, B) => A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
const mEul = (m) => { const y = Math.asin(Math.max(-1, Math.min(1, m[0][2]))); return Math.abs(m[0][2]) < 0.99999 ? [Math.atan2(-m[1][2], m[2][2]) / D2R, y / D2R, Math.atan2(-m[0][1], m[0][0]) / D2R] : [Math.atan2(m[2][1], m[1][1]) / D2R, y / D2R, 0]; };
function rotShapes(shapes, piv, rot) {
  const M = eulM(rot);
  const P = (p) => { const d = [p[0] - piv[0], p[1] - piv[1], p[2] - piv[2]]; return [0, 1, 2].map((i) => piv[i] + M[i][0] * d[0] + M[i][1] * d[1] + M[i][2] * d[2]); };
  const O = (o) => ({ ...(o || {}), rot: mEul(mulM(M, eulM((o && o.rot) || [0, 0, 0]))) });
  return shapes.map((s) => {
    const [k] = s;
    if (k === 'sph') return [k, P(s[1]), s[2], s[3], s[4]];
    if (k === 'cap') return [k, P(s[1]), P(s[2]), s[3], s[4], s[5], s[6]];
    if (k === 'cyl') return [k, P(s[1]), P(s[2]), s[3], s[4], s[5]];
    if (k === 'ell' || k === 'box') return [k, P(s[1]), s[2], s[3], O(s[4])];
    if (k === 'tor') return [k, P(s[1]), s[2], s[3], s[4], O(s[5])];
    if (k === 'poly') return [k, P(s[1]), s[2], s[3], s[4], O(s[5])];
    return s;
  });
}
const rotPt = (p, piv, rot) => rotShapes([['sph', p, 0.01, 'k']], piv, rot)[0][1];
// Roll (deg) that lines up a decal's rows with direction `along` when it faces `dir` (model.js placeDecal: YXZ).
function decalRoll(dir, along) {
  const d = norm3(dir), yaw = Math.atan2(d[0], d[2]), pitch = -Math.asin(Math.max(-1, Math.min(1, d[1])));
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch);
  const u0 = [cy, 0, -sy], v0 = [sy * sx, cx, cy * sx];                 // Ry·Rx applied to +x and +y
  const a = norm3(along);
  return Math.atan2(a[0] * v0[0] + a[1] * v0[1] + a[2] * v0[2], a[0] * u0[0] + a[1] * u0[1] + a[2] * u0[2]) / D2R;
}
// Deterministic pseudo-random in [0,1).
const prand = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// =====================================================================
// SANDMARE (Ecto/Geo, "Enter Sandman") — roster §10.5
// A gaunt night mare of compacted dark sand: hourglass hooves, a mane and tail of dream-sand pouring
// UPWARD (an hourglass turned by the wind), blank pale Fuseli-mare eyes, a spinning dream-vortex in a
// hollow chest, and a black sand-snake coiled round its neck that you only notice when it moves.
// =====================================================================
{
  const vs = 0.044;
  const pal = {
    b: '#3d3548', d: '#2b2434', D: '#1e1828', l: '#8e7fb8',            // compacted night-sand body, near-black + violet rim
    s: '#d8b88a', S: '#ffe8a0', o: '#a8804e',                          // dream-sand gold
    g: '#9ec8f2', G: '#f4faff', w: '#4a3628',                          // hourglass glass + dark wood caps
    v: '#8a5aff', p: '#ff7af2', x: '#1c1030', X: '#3a1d5c',            // Ecto dream-vortex
    n: '#1e1828', N: '#30283e', e: '#ffd86a',                           // sand-snake (black on black) + gold eyes
    L: '#2a2232', c: '#d0dae4', r: '#c0182a',                           // battle-vest strap: leather, chrome studs, red
    k: '#120c18',
  };
  // one leg: list of joints from the shoulder/hip to the fetlock, then an hourglass hoof
  const hourglass = (x, z, k = 1.18) => [
    ['cyl', [x, 0.0, z], [x, 0.04 * k, z], 0.1 * k, 'w', { jit: 0.02 }],
    ['ell', [x, 0.11 * k, z], [0.082 * k, 0.085 * k, 0.082 * k], 'g', { jit: 0.02 }],
    ['ell', [x, 0.085 * k, z], [0.1 * k, 0.06 * k, 0.1 * k], 's', { paint: 1, top: 'S', topT: 0.8, jit: 0.02 }],   // sand pooled in the lower bulb
    ['cyl', [x, 0.16 * k, z], [x, 0.21 * k, z], 0.03 * k, 'S', { glow: 1, jit: 0 }],                 // the trickle through the waist
    ['ell', [x, 0.265 * k, z], [0.075 * k, 0.07 * k, 0.075 * k], 'g', { jit: 0.02 }],
    ['ell', [x, 0.235 * k, z], [0.06 * k, 0.03 * k, 0.06 * k], 's', { paint: 1, jit: 0.02 }],        // the last sand draining
    ['ell', [x + 0.03 * k, 0.29 * k, z + 0.05 * k], [0.025 * k, 0.025 * k, 0.025 * k], 'G', { paint: 1, glow: 1, jit: 0 }],   // glint
    ['cyl', [x, 0.32 * k, z], [x, 0.36 * k, z], 0.09 * k, 'w', { jit: 0.02 }],
  ];
  const legShapes = (pts, rads, x, z) => [
    ['sph', pts[0], rads[0], 'b'],
    ...pts.slice(0, -1).map((p, i) => ['cap', p, pts[i + 1], rads[i], rads[i + 1], i >= 2 ? 'd' : 'b', { blend: 0.03 }]),
    ...hourglass(x, z),
  ];
  const FL = [[0.17, 1.22, 0.48], [0.17, 0.98, 0.5], [0.165, 0.64, 0.53], [0.165, 0.42, 0.55]];
  const BL = [[0.17, 1.24, -0.62], [0.185, 0.92, -0.5], [0.18, 0.64, -0.74], [0.175, 0.42, -0.7]];
  // dream-sand streams that pour up and back (mane ribbons rooted on the neck crest)
  const stream = (root, ctrl, tip, r0, r1, n = 6) => tube(bez(root, ctrl, tip, n), r0, r1, 's', { grad: { axis: 'y', to: 'S', a: root[1] + 0.08, b: tip[1] }, jit: 0.03 });
  const stream3 = (a, b, c, d, r0, r1, n = 7) => tube(bez3(a, b, c, d, n), r0, r1, 's', { grad: { axis: 'y', to: 'S', a: a[1] + 0.08, b: d[1] }, jit: 0.03 });
  const NECK0 = [0, 1.52, 0.56], NECK1 = [0, 1.96, 0.86];
  const neckAxis = norm3([NECK1[0] - NECK0[0], NECK1[1] - NECK0[1], NECK1[2] - NECK0[2]]);
  const neckTilt = Math.atan2(neckAxis[2], neckAxis[1]) / D2R;
  // the vortex: spinning disc of spiral arms set into the chest hollow
  const VC = [0, 1.25, 0.66];
  const spiral = [];
  for (let arm = 0; arm < 2; arm++) for (let i = 0; i < 9; i++) {
    const t = i / 8, a = arm * Math.PI + t * 4.2, r = 0.02 + t * 0.12;
    spiral.push(['sph', [VC[0] + Math.cos(a) * r, VC[1] + Math.sin(a) * r, VC[2] + 0.04], 0.022 + t * 0.012, t < 0.45 ? 'p' : 'v', { paint: 1, glow: 2, jit: 0 }]);
  }
  DESIGNS.sandmare = {
    id: 'sandmare', vs, arch: 'quad', pal,
    anim: { quirk: ['shakeoff', 'sniff', 'stretch'], bounce: 0.7, gait: 0.85, stride: 0.9, tail: 0.8, maxSpeed: 5 },
    parts: [
      { n: 'body', p: [0, 1.25, 0], s: [
        ['ell', [0, 1.24, -0.04], [0.27, 0.27, 0.66], 'b'],                                          // gaunt barrel
        ['ell', [0, 1.27, 0.46], [0.29, 0.34, 0.3], 'b', { blend: 0.12 }],                           // deep chest
        ['ell', [0, 1.3, -0.6], [0.3, 0.32, 0.33], 'b', { blend: 0.12 }],                            // hindquarters
        ['ell', [0, 1.06, 0.0], [0.22, 0.12, 0.5], 'd', { paint: 1, belly: 'D', bellyT: 0.3 }],       // tucked belly
        ['ell', [0, 1.5, -0.1], [0.24, 0.1, 0.8], 'l', { paint: 1, top: 'l', topT: 0.7 }],            // rim along the spine
        // the ghostly chest hollow
        ['sph', [0, 1.25, 0.86], 0.2, 'k', { sub: 1 }],
        ['sph', [0, 1.25, 0.72], 0.21, 'x', { paint: 1 }],
        ['tor', [0, 1.25, 0.735], 0.175, 0.035, 'X', { axis: 'z', paint: 1, glow: 1 }],
      ] },
      { n: 'vortex', parent: 'body', p: VC, spin: { axis: 'z', speed: -2.6 }, s: [
        ['cyl', [VC[0], VC[1], VC[2] - 0.03], [VC[0], VC[1], VC[2] + 0.05], 0.15, 'x', { jit: 0 }],
        ...spiral,
        ['sph', [VC[0], VC[1], VC[2] + 0.05], 0.035, 'G', { paint: 1, glow: 3, jit: 0 }],
      ] },
      { n: 'neck', parent: 'body', p: NECK0, s: [
        ['cap', NECK0, NECK1, 0.2, 0.14, 'b'],
        ['ell', lerp3(NECK0, NECK1, 0.45), [0.12, 0.2, 0.12], 'l', { paint: 1, top: 'l', topT: 0.85 }],
      ] },
      { n: 'snake', parent: 'neck', p: [0, 1.62, 0.62], sway: { axis: 'y', amp: 0.12, freq: 0.7 }, s: [
        ['tor', [0, 1.6, 0.62], 0.215, 0.05, 'n', { rot: [neckTilt, 0, 0], stripes: { axis: 'y', p: 0.07, w: 0.03, col: 'N' } }],
        ['tor', [0, 1.78, 0.74], 0.17, 0.042, 'n', { rot: [neckTilt, 0, 0], stripes: { axis: 'y', p: 0.07, w: 0.03, col: 'N' } }],
        ...tube(bez([0.19, 1.6, 0.74], [0.2, 1.48, 0.86], [0.1, 1.5, 0.92], 4), 0.05, 0.045, 'n'),
        ['ell', [0.08, 1.52, 0.95], [0.055, 0.04, 0.075], 'n'],                                        // snake head on the breast
        ['sph', [0.11, 1.545, 0.98], 0.013, 'e', { glow: 2, jit: 0 }], ['sph', [0.05, 1.545, 0.99], 0.013, 'e', { glow: 2, jit: 0 }],
      ] },
      { n: 'head', parent: 'neck', p: NECK1, s: [
        ['ell', [0, 2.02, 0.9], [0.15, 0.16, 0.19], 'b'],                                              // skull
        ['cap', [0, 2.0, 0.98], [0, 1.88, 1.27], 0.135, 0.1, 'b', { blend: 0.06 }],                    // long muzzle
        ['ell', [0, 1.86, 1.23], [0.105, 0.075, 0.1], 'd', { blend: 0.04 }],                            // soft nose
        ['ell', [0, 2.13, 0.97], [0.1, 0.05, 0.16], 'l', { paint: 1 }],                                 // rim on the forehead
        ['sph', [0.05, 1.87, 1.33], 0.022, 'k', { m: 1, sub: 1 }],                                       // nostrils
        ['cap', [0.08, 2.12, 0.84], [0.11, 2.34, 0.8], 0.055, 0.012, 'b', { m: 1 }],                    // ears
        ['cap', [0.08, 2.14, 0.86], [0.1, 2.3, 0.83], 0.025, 0.008, 'X', { m: 1, paint: 1 }],
        // studded halter strap (the Team Metallica battle-vest piece)
        ['tor', [0, 1.95, 1.13], 0.125, 0.026, 'L', { rot: [-62, 0, 0] }],
        ...[-0.09, 0, 0.09].map((dx) => ['sph', [dx, 1.99 - Math.abs(dx) * 0.6, 1.2 - Math.abs(dx) * 0.5], 0.022, 'c', { jit: 0 }]),
        // the forelock: a short pour of sand between the ears (the hat sits here)
        ...stream([0, 2.16, 0.88], [0, 2.3, 0.92], [0, 2.36, 0.82], 0.06, 0.02, 4),
      ] },
      { n: 'maneA', parent: 'neck', p: [0, 2.0, 0.78], sway: { axis: 'x', amp: 0.09, freq: 1.1 }, s: [
        ['cap', [0, 2.1, 0.8], [0, 1.94, 0.68], 0.075, 0.08, 's'],                                      // sand crest along the neck
        ...stream3([0, 2.1, 0.76], [0, 2.32, 0.78], [0, 2.32, 0.46], [0, 2.52, 0.3], 0.085, 0.025),
        ...stream3([0.07, 2.02, 0.72], [0.12, 2.22, 0.66], [0.14, 2.2, 0.4], [0.16, 2.36, 0.22], 0.07, 0.02),
      ] },
      { n: 'maneB', parent: 'neck', p: [0, 1.82, 0.68], sway: { axis: 'x', amp: 0.1, freq: 1.1, phase: 1.1 }, s: [
        ['cap', [0, 1.94, 0.7], [0, 1.74, 0.6], 0.08, 0.085, 's'],
        ...stream3([0, 1.9, 0.66], [0, 2.14, 0.66], [0, 2.12, 0.3], [0, 2.34, 0.1], 0.09, 0.025),
        ...stream3([-0.07, 1.82, 0.62], [-0.13, 2.04, 0.58], [-0.15, 2.0, 0.26], [-0.17, 2.16, 0.06], 0.07, 0.02),
      ] },
      { n: 'maneC', parent: 'neck', p: [0, 1.64, 0.58], sway: { axis: 'x', amp: 0.11, freq: 1.1, phase: 2.2 }, s: [
        ['cap', [0, 1.74, 0.62], [0, 1.58, 0.52], 0.08, 0.08, 's'],
        ...stream3([0, 1.72, 0.58], [0, 1.96, 0.54], [0, 1.92, 0.18], [0, 2.12, -0.04], 0.085, 0.022),
        ...stream3([0.08, 1.64, 0.54], [0.14, 1.84, 0.46], [0.15, 1.8, 0.16], [0.17, 1.94, -0.04], 0.065, 0.018),
      ] },
      { n: 'legFL', parent: 'body', p: FL[0], mirror: true, s: legShapes(FL, [0.13, 0.085, 0.06, 0.055], 0.165, 0.55) },
      { n: 'legBL', parent: 'body', p: BL[0], mirror: true, s: [
        ['ell', [0.17, 1.12, -0.58], [0.12, 0.22, 0.2], 'b'],
        ...legShapes(BL, [0.14, 0.1, 0.065, 0.055], 0.175, -0.7),
      ] },
      { n: 'tail', parent: 'body', p: [0, 1.48, -0.88], s: [
        ...stream([0, 1.46, -0.86], [0, 1.66, -1.02], [0, 1.82, -1.04], 0.1, 0.075, 4),
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 1.82, -1.04], s: [
        ...stream([0, 1.82, -1.04], [0, 2.02, -1.06], [0, 2.1, -1.26], 0.075, 0.05, 4),
        ...stream([0.05, 1.86, -1.06], [0.12, 2.0, -1.16], [0.14, 2.02, -1.32], 0.05, 0.02, 4),
      ] },
      { n: 'tail3', parent: 'tail2', p: [0, 2.1, -1.26], s: [
        ...stream([0, 2.1, -1.26], [0, 2.16, -1.42], [0, 2.1, -1.56], 0.05, 0.015, 4),
        ...stream([-0.03, 2.06, -1.3], [-0.1, 2.08, -1.42], [-0.12, 1.98, -1.52], 0.035, 0.012, 3),
      ] },
    ],
    eyes: { part: 'head', at: [0.12, 2.06, 1.02], dir: [0.62, 0.12, 0.78], style: 'anime', px: 0.95,
      rows: ['..kkk.', '.kgggk', 'kgggk.', '.kkk..'], cmap: { g: { c: '#e8f0ff', glow: 2 } } },
    mouth: { part: 'head', at: [0, 1.8, 1.24], dir: [0, -0.5, 0.85], style: 'line', px: 0.7 },
    fx: [
      { part: 'maneA', at: [0, 2.46, 0.3], type: 'dust', rate: 1.2, scale: 0.7, color: '#d8b88a' },
      { part: 'maneB', at: [0, 2.26, 0.12], type: 'gem', rate: 0.6, scale: 0.5, color: '#ffe8a0' },
      { part: 'tail3', at: [0, 2.1, -1.56], type: 'dust', rate: 1.2, scale: 0.7, color: '#d8b88a' },
      { part: 'legFL', at: [0.165, 0.02, 0.55], type: 'dust', rate: 0.4, scale: 0.5, color: '#a8804e', mirror: true },
      { part: 'vortex', at: [0, 1.25, 0.74], type: 'wisp', rate: 0.5, scale: 0.6, color: '#8a5aff' },
    ],
    // Bonded: the hidden sand-snake wakes and rears beside the mare's head; the sand mane and tail swell.
    bond: {
      parts: [
        { n: 'snakeRear', parent: 'neck', p: [0.2, 1.62, 0.72], sway: { axis: 'z', amp: 0.08, freq: 1.4 }, s: [
          ...tube(bez3([0.2, 1.62, 0.72], [0.34, 1.78, 0.86], [0.2, 1.98, 0.7], [0.3, 2.14, 0.84], 7), 0.05, 0.04, 'n', { stripes: { axis: 'y', p: 0.07, w: 0.028, col: 'N' } }),
          ['ell', [0.31, 2.17, 0.9], [0.06, 0.045, 0.085], 'n'],
          ['ell', [0.31, 2.155, 0.97], [0.04, 0.02, 0.04], 'N', { paint: 1 }],
          ['sph', [0.345, 2.19, 0.93], 0.016, 'e', { glow: 2, jit: 0 }], ['sph', [0.275, 2.19, 0.93], 0.016, 'e', { glow: 2, jit: 0 }],
          ['cap', [0.31, 2.15, 0.98], [0.31, 2.13, 1.06], 0.01, 0.006, 'r'],                                 // flicking tongue
        ] },
      ],
      grow: { maneA: 1.3, maneB: 1.3, maneC: 1.25, tail2: 1.2, tail3: 1.3 },
      hat: { part: 'head', at: [0, 2.17, 0.93], scale: 1.0, tilt: 14 },
      aura: 'sparks', auraColor: [2.2, 1.75, 0.85, 1],
    },
    // Elemental Form "Hourglass Nightmare": a great hourglass set into the ribcage runs both ways and the mane
    // becomes a spinning sandstorm halo. (The ghost mare-heads of the study are an attack VFX, not body parts.)
    forms: {
      elemental: {
        pal: { b: '#2e2740', d: '#211a2d', l: '#9a86e0', s: '#ffd27a', S: '#fff2c0', X: '#7a3ad0' },
        parts: [
          { n: 'hourglassBig', parent: 'body', p: [0, 1.25, 0.79], s: [
            ['ell', [0, 1.09, 0.79], [0.15, 0.16, 0.12], 'g', { blend: 0.05 }], ['ell', [0, 1.42, 0.79], [0.15, 0.16, 0.12], 'g', { blend: 0.05 }],
            ['cyl', [0, 0.9, 0.79], [0, 0.96, 0.79], 0.2, 'w'], ['cyl', [0, 1.56, 0.79], [0, 1.62, 0.79], 0.2, 'w'],
            ...[0, 1, 2, 3].map((i) => { const a = (i + 0.5) * Math.PI / 2; return ['cyl', [Math.sin(a) * 0.17, 0.93, 0.79 + Math.cos(a) * 0.1], [Math.sin(a) * 0.17, 1.6, 0.79 + Math.cos(a) * 0.1], 0.032, 'w']; }),
            ['ell', [0, 1.04, 0.79], [0.16, 0.07, 0.13], 's', { paint: 1, glow: 1 }],                       // sand falling down…
            ['ell', [0, 1.47, 0.79], [0.16, 0.07, 0.13], 's', { paint: 1, glow: 1 }],                       // …and pouring up
            ['cyl', [0, 1.1, 0.79], [0, 1.41, 0.79], 0.03, 'S', { glow: 2, jit: 0 }],
            ['ell', [0.06, 1.47, 0.9], [0.03, 0.05, 0.02], 'G', { paint: 1, glow: 1, jit: 0 }],
          ] },
          { n: 'sandHalo', parent: 'neck', p: [0, 2.14, 0.58], spin: { axis: 'z', speed: 1.2 }, s: [
            ['tor', [0, 2.14, 0.58], 0.4, 0.045, 's', { axis: 'z', glow: 1 }],
            ...Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2, c = [Math.cos(a), Math.sin(a)], t = [-c[1], c[0]];
              const P = (r, k) => [c[0] * r + t[0] * k, 2.14 + c[1] * r + t[1] * k, 0.58];
              return tube(bez(P(0.4, 0), P(0.56, 0.06), P(0.66, 0.2), 4), 0.06, 0.015, 's', { grad: { axis: 'y', to: 'S', a: 1.7, b: 2.7 }, glow: 1 }); }).flat(),
          ] },
        ],
        eyes: { cmap: { g: { c: '#f2e8ff', glow: 3 } } },
        fx: [
          { part: 'sandHalo', at: [0, 2.55, 0.56], type: 'dust', rate: 2, scale: 0.9, color: '#ffd27a' },
          { part: 'hourglassBig', at: [0, 1.25, 0.92], type: 'gem', rate: 1, scale: 0.6, color: '#fff2c0' },
          { part: 'neck', at: [0, 1.9, 0.6], type: 'wisp', rate: 0.6, scale: 0.8, color: '#8a5aff' },
        ],
      },
    },
  };
  LORE.sandmare = {
    name: 'Sandmare', element: 'ecto', element2: 'geo', stage: 1, final: true, height: '1.6 m at the shoulder',
    desc: 'Team Metallica rides it into the night. Wherever it gallops, a fine gold dust settles on windowsills, and everyone on the block has the same bad dream. Its hooves are hourglasses: when the last grain falls, it turns them over and the nightmare starts again.',
    personality: 'Sleepy and menacing at once: it lolls its head, yawns, then charges without warning. Secretly afraid of the dawn.',
    look: 'Gaunt night mare of compacted near-black sand with a violet rim, a mane and tail of gold dream-sand pouring upward like an hourglass turned by the wind, glass hourglass hooves, blank glowing white eyes, a spinning violet dream-vortex in a hollow chest and a black sand-snake coiled round its neck like a scarf.',
  };
}

// =====================================================================
// IRONMAW (Ferro, "Iron Man") — roster §10.6
// A low steel beast (hyena × bear) turned to iron by a magnetic field: an enormous riveted vise-trap maw
// with gear-tooth edges, and fur of iron filings that bristles along curved field lines between a red
// shoulder pole and a blue hip pole. Rust at the joints, an old scar riveted shut, a chain collar.
// =====================================================================
{
  const vs = 0.045;
  const pal = {
    b: '#66738a', B: '#8a98ae', d: '#4a5468', D: '#30374a', h: '#d0dae4',          // gunmetal plates
    f: '#4e5866', F: '#a8b4c0',                                                      // iron filings
    r: '#a0522d', R: '#d07a3a',                                                      // rust
    c: '#c8d0dc', t: '#e8eef4',                                                      // rivets, teeth
    x: '#1a1420', m: '#ff6a2b', M: '#ffd23f',                                        // maw interior + molten glow
    N: '#e8402a', S: '#2f7aff', e: '#5ff4ff',                                        // poles, eyes
    k: '#14161e',
  };
  // body volume (for placing filings on its surface): two blended ellipsoids
  const E1 = { c: [0, 1.04, 0.28], r: [0.47, 0.45, 0.52] }, E2 = { c: [0, 0.86, -0.46], r: [0.35, 0.33, 0.46] };
  const ellSd = (p, e) => { const q = [(p[0] - e.c[0]) / e.r[0], (p[1] - e.c[1]) / e.r[1], (p[2] - e.c[2]) / e.r[2]]; return (Math.hypot(q[0], q[1], q[2]) - 1) * Math.min(...e.r); };
  const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  const bodySd = (p) => smin(ellSd(p, E1), ellSd(p, E2), 0.25);
  const yc = (z) => { const t = Math.max(0, Math.min(1, (z - E2.c[2]) / (E1.c[2] - E2.c[2]))); return E2.c[1] + (E1.c[1] - E2.c[1]) * t; };
  // surface point + normal at body station z, angle th (deg; 0 = +x side, 90 = spine)
  const surf = (z, th) => {
    const o = [0, yc(z), z], d = [Math.cos(th * D2R), Math.sin(th * D2R), 0];
    let lo = 0, hi = 1.2;
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (bodySd(add3(o, d, m)) < 0) lo = m; else hi = m; }
    const p = add3(o, d, lo), e = 0.01;
    const n = norm3([bodySd(add3(p, [e, 0, 0])) - bodySd(add3(p, [-e, 0, 0])), bodySd(add3(p, [0, e, 0])) - bodySd(add3(p, [0, -e, 0])), bodySd(add3(p, [0, 0, e])) - bodySd(add3(p, [0, 0, -e]))]);
    return { p, n };
  };
  const NODE_N = { z: 0.36, th: 18 }, NODE_S = { z: -0.62, th: 14 };
  // one field line of filings: spikes standing out of the hide, leaning back along the line
  const fieldLine = (amp, n, len, opts = {}) => {
    const out = [], groove = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, z = NODE_N.z + (NODE_S.z - NODE_N.z) * t, th = NODE_N.th + (NODE_S.th - NODE_N.th) * t + amp * Math.sin(Math.PI * t);
      const { p, n: nn } = surf(z, th);
      groove.push(p);
      if (i === 0 || i === n) continue;
      const L = len * (0.75 + 0.35 * Math.sin(Math.PI * t));
      const dir = norm3(add3(nn, [0, 0, -1], 0.4));
      out.push(['cap', add3(p, nn, -0.05), add3(p, dir, L), 0.048, 0.012, 'f', { tip: 'F', tipT: 0.6, m: 1, ...opts }]);
    }
    return { spikes: out, groove: tube(groove, 0.035, 0.035, 'D', { paint: 1, m: 1 }) };
  };
  const LINES = [fieldLine(30, 9, 0.15), fieldLine(60, 9, 0.18), fieldLine(-30, 8, 0.11)];
  // a glowing field line floating off the hide (bond / elemental magnetism made visible)
  const glowArc = (amp, off, r = 0.035, n = 10) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n, z = NODE_N.z + (NODE_S.z - NODE_N.z) * t, th = NODE_N.th + (NODE_S.th - NODE_N.th) * t + amp * Math.sin(Math.PI * t);
      const { p, n: nn } = surf(z, th); pts.push(add3(p, nn, 0.06 + off * Math.sin(Math.PI * t))); }
    return tube(pts, r, r, 'N', { glow: 2, m: 1, jit: 0, grad: { axis: 'z', to: 'S', a: NODE_N.z, b: NODE_S.z } });
  };
  const nodeAt = (spec, col) => { const { p, n } = surf(spec.z, spec.th); return { p, n, s: [
    ['sph', add3(p, n, 0.02), 0.095, 'd', { m: 1 }],
    ['sph', add3(p, n, 0.06), 0.072, col, { m: 1, glow: 2, jit: 0 }],
  ] }; };
  const NN = nodeAt(NODE_N, 'N'), SS = nodeAt(NODE_S, 'S');
  // gear-tooth row along a curve (square teeth)
  const teeth = (pts, h, w, col, up = 1) => pts.map((p) => ['box', [p[0], p[1] + up * h * 0.5, p[2]], [w, h * 0.5, w], col, { round: 0.012, jit: 0 }]);
  const arcPts = (cx, cy, cz, rx, rz, n, a0 = -80, a1 = 80) => Array.from({ length: n }, (_, i) => { const a = (a0 + (a1 - a0) * (i / (n - 1))) * D2R; return [cx + Math.sin(a) * rx, cy, cz + Math.cos(a) * rz]; });
  const rivetRow = (a, b, n, r = 0.026, col = 'c', o = {}) => Array.from({ length: n }, (_, i) => ['sph', lerp3(a, b, n === 1 ? 0.5 : i / (n - 1)), r, col, { jit: 0, ...o }]);
  const pawShapes = (x, y, z, k = 1) => [
    ['ell', [x, y + 0.02, z + 0.05], [0.16 * k, 0.09 * k, 0.19 * k], 'd', { top: 'b', topT: 0.6 }],
    ...[-1, 0, 1].map((i) => ['cap', [x + i * 0.075 * k, y + 0.02, z + 0.18 * k], [x + i * 0.09 * k, -0.0, z + 0.28 * k], 0.04 * k, 0.014, 'h']),
  ];
  // chain collar: alternating links hanging under the neck
  const chain = [];
  for (let i = 0; i < 14; i++) {
    const a = (-140 + 280 * (i / 13)) * D2R;                    // a loose chain collar hanging round the neck
    const p = [Math.sin(a) * 0.42, 0.98 - Math.cos(a) * 0.42, 0.66 + Math.cos(a) * 0.04];
    chain.push(['tor', p, 0.062, 0.04, 'F', { axis: i % 2 ? 'x' : 'z', rot: [0, 0, -a / D2R], jit: 0 }]);
  }
  const HK = 1.18, HO = [0, 1.0, 0.7], HX = (p) => xform([['sph', p, 0.1, 'b']], HK, HO)[0][1];
  DESIGNS.ironmaw = {
    id: 'ironmaw', vs, arch: 'quad', pal,
    anim: { quirk: ['shakeoff', 'roar', 'sniff'], bounce: 0.5, gait: 0.7, stride: 0.8, tail: 0.6, maxSpeed: 3.6 },
    parts: [
      { n: 'body', p: [0, 1.0, 0], s: [
        ['ell', E1.c, E1.r, 'b', { top: 'B', topT: 0.7 }],                                              // massive iron shoulders
        ['ell', E2.c, E2.r, 'b', { blend: 0.25 }],                                                      // sloping hindquarters
        ['ell', [0, 0.72, 0.0], [0.34, 0.2, 0.7], 'd', { paint: 1, belly: 'D', bellyT: 0.35 }],          // dark underside
        // shoulder plate seams + rivets
        ['tor', [0, 1.04, 0.28], 0.47, 0.022, 'd', { axis: 'z', paint: 1 }],
        ...rivetRow([0.47, 1.0, 0.36], [0.44, 1.3, 0.3], 3, 0.028, 'c', { m: 1 }),
        // old scar on the left flank, riveted shut
        ['cap', [0.43, 1.12, -0.02], [0.35, 0.84, -0.3], 0.03, 0.03, 'D', { paint: 1 }],
        ...rivetRow([0.44, 1.07, -0.06], [0.37, 0.88, -0.25], 3, 0.026, 'R'),
        // field-line grooves in the hide, then the pole sockets
        ...LINES.flatMap((l) => l.groove),
        ['tor', [0, 0.88, -0.32], 0.36, 0.02, 'd', { axis: 'z', paint: 1 }],
        ...NN.s, ...SS.s,
      ] },
      { n: 'filings', parent: 'body', p: [0, 1.0, -0.05], s: [
        ...LINES.flatMap((l) => l.spikes),   // two upper arcs (toward the spine) + one lower arc (toward the belly)
        // the dorsal ridge where the field lines from both sides meet
        ...Array.from({ length: 6 }, (_, i) => { const z = 0.42 - i * 0.2, { p, n } = surf(z, 90); const L = 0.2 + 0.08 * Math.sin(Math.PI * (i + 0.5) / 6);
          return ['cap', add3(p, n, -0.05), add3(p, norm3(add3(n, [0, 0, -1], 0.5)), L), 0.06, 0.014, 'f', { tip: 'F', tipT: 0.6 }]; }),
      ] },
      { n: 'head', parent: 'body', p: [0, 1.0, 0.7], s: xform([
        ['ell', [0, 1.1, 0.8], [0.3, 0.22, 0.26], 'b', { top: 'B', topT: 0.6 }],                         // iron skull
        ['box', [0, 1.03, 1.1], [0.21, 0.1, 0.2], 'b', { round: 0.08, blend: 0.06 }],                     // upper jaw
        ['cap', [0, 1.15, 0.92], [0, 1.12, 1.24], 0.14, 0.1, 'b', { blend: 0.06, top: 'B', topT: 0.6 }],  // muzzle bridge
        ['ell', [0, 1.13, 1.32], [0.075, 0.05, 0.05], 'k'],                                                // iron nose
        ...[1, -1].map((sx) => ['box', [sx * 0.16, 1.28, 0.93], [0.17, 0.05, 0.22], 'B', { round: 0.04, rot: [14, 0, sx * -16] }]),   // angry V brow plates
        ...rivetRow([-0.27, 1.33, 1.06], [-0.08, 1.27, 1.12], 3, 0.026, 'c'), ...rivetRow([0.08, 1.27, 1.12], [0.27, 1.33, 1.06], 3, 0.026, 'c'),
        ['sph', [0.18, 1.18, 1.1], 0.05, 'x', { m: 1, sub: 1 }],                                        // deep-set eye sockets
        ['sph', [0.18, 1.18, 1.1], 0.06, 'k', { m: 1, paint: 1 }],
        ['box', [0, 0.95, 1.04], [0.21, 0.035, 0.2], 'x', { round: 0.03 }],                               // the dark maw roof
        ...teeth(arcPts(0, 0.85, 1.04, 0.2, 0.21, 9), 0.1, 0.036, 't', 1),                                 // upper gear teeth hang into the gap
        ['ell', [0, 0.92, 0.86], [0.2, 0.07, 0.18], 'm', { glow: 2 }],                                   // molten throat glow
        ['ell', [0, 0.92, 0.88], [0.1, 0.04, 0.1], 'M', { paint: 1, glow: 3 }],
        // ears: short round hyena ears behind the brow
        ['cap', [0.2, 1.22, 0.66], [0.26, 1.4, 0.6], 0.085, 0.055, 'b', { m: 1 }],
        ['cap', [0.215, 1.25, 0.69], [0.255, 1.37, 0.65], 0.045, 0.03, 'D', { m: 1, paint: 1 }],
      ], HK, HO) },
      { n: 'jaw', parent: 'head', p: HX([0, 0.88, 0.7]), s: xform([
        ['box', [0, 0.69, 1.0], [0.34, 0.15, 0.3], 'b', { round: 0.1, belly: 'd', bellyT: 0.3 }],         // the vise-trap lower jaw (underbite)
        ['ell', [0, 0.78, 0.74], [0.27, 0.14, 0.17], 'b', { blend: 0.06 }],
        ['box', [0, 0.825, 0.99], [0.28, 0.03, 0.25], 'x', { round: 0.025, paint: 1, top: 'x', topT: 0.4 }],
        ...teeth(arcPts(0, 0.82, 1.0, 0.29, 0.28, 9), 0.1, 0.038, 't', 1),                                // lower gear teeth
        ['cyl', [0.32, 0.86, 0.74], [0.39, 0.86, 0.74], 0.08, 'h', { m: 1 }],                            // vise hinge bolts
        ['cyl', [0.38, 0.86, 0.74], [0.41, 0.86, 0.74], 0.042, 'D', { m: 1 }],
        ...rivetRow([0.345, 0.68, 0.86], [0.345, 0.68, 1.16], 3, 0.028, 'c', { m: 1 }),
        ['ell', [0.34, 0.74, 0.92], [0.02, 0.06, 0.09], 'r', { m: 1, paint: 1, dither: { col: 'R', amt: 0.4 } }],
      ], HK, HO) },
      { n: 'collar', parent: 'body', p: [0, 1.3, 0.66], sway: { axis: 'x', amp: 0.05, freq: 1.6 }, s: chain },
      { n: 'legFL', parent: 'body', p: [0.32, 1.0, 0.42], mirror: true, s: [
        ['sph', [0.32, 1.0, 0.42], 0.22, 'b'],
        ['cap', [0.33, 1.0, 0.42], [0.36, 0.56, 0.48], 0.21, 0.15, 'b'],
        ['cap', [0.36, 0.56, 0.48], [0.36, 0.13, 0.52], 0.15, 0.13, 'd'],
        ['sph', [0.36, 0.56, 0.48], 0.15, 'r', { paint: 1, dither: { col: 'R', amt: 0.35 } }],           // rust bloom at the elbow
        ...rivetRow([0.5, 0.86, 0.47], [0.5, 0.66, 0.5], 2, 0.026),
        ...pawShapes(0.36, 0.07, 0.52),
      ] },
      { n: 'legBL', parent: 'body', p: [0.25, 0.86, -0.58], mirror: true, s: [
        ['sph', [0.25, 0.86, -0.58], 0.19, 'b'],
        ['cap', [0.26, 0.86, -0.58], [0.28, 0.46, -0.66], 0.18, 0.12, 'b'],
        ['cap', [0.28, 0.46, -0.66], [0.28, 0.12, -0.58], 0.12, 0.1, 'd'],
        ['sph', [0.28, 0.46, -0.66], 0.12, 'r', { paint: 1, dither: { col: 'R', amt: 0.35 } }],
        ...pawShapes(0.28, 0.06, -0.6, 0.85),
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.98, -0.86], s: [
        ['cap', [0, 0.98, -0.86], [0, 1.1, -1.06], 0.09, 0.06, 'b'],
        ...[[0, 1], [0.7, 0.7], [-0.7, 0.7]].map(([sx, sy]) => ['cap', [0, 1.1, -1.06], [sx * 0.12, 1.1 + sy * 0.16, -1.18], 0.045, 0.012, 'f', { tip: 'F', tipT: 0.6 }]),
      ] },
    ],
    eyes: { part: 'head', at: HX([0.18, 1.18, 1.12]), dir: [0.45, 0, 1], px: 0.85, rows: ['kkkk', 'kggk', '.kk.'], cmap: { g: { c: '#5ff4ff', glow: 3 } } },
    mouth: { part: 'head', style: 'none', at: HX([0, 0.86, 1.2]) },
    fx: [
      { part: 'body', at: NN.p, type: 'spark', rate: 0.25, scale: 0.6, color: '#e8402a', mirror: true },
      { part: 'body', at: SS.p, type: 'spark', rate: 0.25, scale: 0.6, color: '#2f7aff', mirror: true },
    ],
    // Bonded: the field switches on. Glowing red→blue field lines arc off the hide and the filings bristle outward.
    bond: {
      parts: [
        { n: 'fieldArcs', parent: 'body', p: [0, 1.0, -0.05], s: [...glowArc(34, 0.16), ...glowArc(66, 0.22), ...glowArc(-30, 0.12, 0.032)] },
      ],
      grow: { filings: 1.16, tail: 1.2 },
      hat: { part: 'head', at: HX([0, 1.34, 0.98]), scale: 1.3, tilt: 12 },
      aura: 'sparks', auraColor: [1.5, 1.9, 2.5, 1],
    },
    // Elemental Form "Iron Revenant": the filings rise into a huge magnetic mane, scrap metal orbits it, the maw
    // grows a second molten inner jaw and the poles float free as two hovering magnet cores joined by an arc.
    forms: {
      elemental: {
        pal: { b: '#566278', B: '#7d8aa2', d: '#3c4558', f: '#3a4250', F: '#c8f4ff', D: '#24293a' },
        parts: [
          { n: 'ironMane', parent: 'body', p: [0, 1.35, 0.4], sway: { axis: 'x', amp: 0.04, freq: 1.2 }, s: [
            ...Array.from({ length: 9 }, (_, i) => { const a = (-80 + 160 * (i / 8)) * D2R, base = [Math.sin(a) * 0.4, 1.22 + Math.cos(a) * 0.22, 0.42];
              const tip = [Math.sin(a) * 0.95, 1.3 + Math.cos(a) * 0.75, 0.05 - Math.abs(Math.sin(a)) * 0.1];
              const seg = tube(bez(base, [Math.sin(a) * 0.7, 1.35 + Math.cos(a) * 0.6, 0.38], tip, 4), 0.09, 0.016, 'f');
              seg[seg.length - 1][6] = { tip: 'F', tipT: 0.3 }; return seg; }).flat(),
            ...Array.from({ length: 6 }, (_, i) => { const a = (-60 + 120 * (i / 5)) * D2R, base = [Math.sin(a) * 0.3, 1.28 + Math.cos(a) * 0.2, 0.2];
              return ['cap', base, [Math.sin(a) * 0.62, 1.45 + Math.cos(a) * 0.52, -0.2], 0.07, 0.014, 'f', { tip: 'F', tipT: 0.55 }]; }),
          ] },
          { n: 'innerJaw', parent: 'head', p: HX([0, 0.9, 0.86]), s: xform([
            ['box', [0, 0.9, 0.92], [0.15, 0.03, 0.12], 'x', { round: 0.02 }],
            ...teeth(arcPts(0, 0.87, 0.94, 0.14, 0.12, 7), 0.08, 0.03, 'M', 1).map((t) => [...t.slice(0, 4), { ...t[4], glow: 2 }]),
          ], HK, HO) },
          { n: 'scrapRing', parent: 'body', p: [0, 1.15, -0.1], spin: { axis: 'y', speed: 0.9 }, s: [
            ...Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2, c = [Math.sin(a) * 0.95, 1.15 + Math.sin(a * 3) * 0.12, -0.1 + Math.cos(a) * 1.05];
              return i % 3 === 0 ? ['tor', c, 0.07, 0.035, 'B', { axis: 'x', rot: [0, a / D2R, 20] }]
                : i % 3 === 1 ? ['box', c, [0.08, 0.05, 0.03], 'd', { round: 0.015, rot: [30, a / D2R, 15] }]
                  : ['cyl', c, add3(c, [0.04, 0.12, 0]), 0.035, 'h']; }),
          ] },
          { n: 'poleN', parent: 'body', p: [0, 1.9, 0.32], sway: { axis: 'z', amp: 0.06, freq: 1.0 }, s: [
            ['sph', [0, 1.9, 0.32], 0.11, 'N', { glow: 2, jit: 0 }], ['tor', [0, 1.9, 0.32], 0.15, 0.03, 'h', { axis: 'z' }],
          ] },
          { n: 'poleS', parent: 'body', p: [0, 1.55, -0.72], sway: { axis: 'z', amp: 0.06, freq: 1.0, phase: 1.5 }, s: [
            ['sph', [0, 1.55, -0.72], 0.1, 'S', { glow: 2, jit: 0 }], ['tor', [0, 1.55, -0.72], 0.14, 0.03, 'h', { axis: 'z' }],
            ...tube(bez([0, 1.6, -0.62], [0, 2.0, -0.2], [0, 1.94, 0.22], 8), 0.032, 0.032, 'S', { glow: 2, jit: 0, grad: { axis: 'z', to: 'N', a: -0.6, b: 0.2 } }),
          ] },
        ],
        eyes: { cmap: { g: { c: '#c8f4ff', glow: 3 } } },
        fx: [
          { part: 'poleN', at: [0, 1.9, 0.32], type: 'spark', rate: 1.2, scale: 0.8, color: '#e8402a' },
          { part: 'poleS', at: [0, 1.55, -0.72], type: 'spark', rate: 1.2, scale: 0.8, color: '#2f7aff' },
          { part: 'innerJaw', at: HX([0, 0.92, 0.95]), type: 'ember', rate: 1, scale: 0.8 },
        ],
      },
    },
  };
  LORE.ironmaw = {
    name: 'Ironmaw', element: 'ferro', stage: 1, final: true, height: '1.8 m',
    desc: 'They say it was an ordinary scavenger until it wandered into the magnetic field of a reactor that was being switched off, and came out iron. Nobody paid it any mind afterwards, so now it pays everyone back. Team Metallica feeds it scrap bikes.',
    personality: 'Slow, heavy and unstoppable once it starts; it holds a grudge for years, but it never bites anyone who once shared a meal with it.',
    look: 'Low gunmetal hyena-bear with a massive shoulder hump and sloping back, an enormous riveted vise-trap jaw with gear teeth and a molten glow inside, tiny pale-cyan eyes under an angry V brow plate, iron-filing spikes bristling along curved field lines between a red shoulder pole and a blue hip pole, rust at the joints, a riveted scar and a loose chain collar.',
  };
}

// =====================================================================
// YELLOWSUB (Hydro/Ferro, "Yellow Submarine") — roster §11.1, music_albums §A3
// A toy-round yellow submarine-whale that swims through the air: a whale's face whose big front porthole
// is its eye, two little porthole-eyes behind, a periscope crest that looks around on its own, flipper
// fins, a whale fluke with a propeller, riveted seams (Ferro) and flat, unshaded Edelmann-like swirl bands.
// =====================================================================
{
  const vs = 0.045;
  const pal = {
    b: '#ffd21f', B: '#fff27a', d: '#e08a1a', l: '#fff4c4', o: '#e86a1a',          // hull ramp + cream belly + trim
    a: '#d8a03a', A: '#8a5a1a',                                                       // brass
    c: '#b8c4d0', g: '#8ff0ff', G: '#ffffff', k: '#3a2010', x: '#2a1a14',            // rivets, glass, ink
    y: '#ffd23f',                                                                     // Elite Four gold braid
    p: flat('#ff6fae'), s: flat('#6ab8ff'), m: flat('#7fe8b0'), v: flat('#8a5aff'), w: flat('#fffbe0'),   // flat swirl inks
  };
  const HC = [0, 0.86, 0.02], HR = [0.5, 0.47, 0.86];                // main hull
  const FC = [0, 0.87, 0.42], FR = [0.53, 0.5, 0.52];                // bulbous whale head
  const hull = (d) => onEllU([HC, FC], [HR, FR], d);
  // flat swirl band riding the hull side (paint), wave phase/offset per band
  // a long art-nouveau whiplash band: a small curl behind the eye, then a wave sweeping back and up
  const band = (col, y0, y1, amp, ph, r = 0.055, curl = 1) => {
    const pts = [];
    for (let i = 0; i <= 7; i++) { const a = Math.PI * 1.5 * (1 - i / 7) * curl + ph * 0, rr = 0.075 * (1 - i / 9);
      pts.push(hull([1, (y0 + Math.sin(a) * rr - 0.86) / 0.47, (0.44 + Math.cos(a) * rr) / 0.86])); }
    for (let i = 1; i <= 18; i++) { const t = i / 18, z = 0.44 - t * 1.08, y = y0 + (y1 - y0) * t + amp * Math.sin(t * Math.PI * 2.2 + ph); pts.push(hull([1, (y - 0.86) / 0.47, z / 0.86])); }
    return tube(pts, r * 0.8, r, col, { paint: 1, glow: 1, jit: 0, m: 1 });
  };
  const porthole = (c, n, R, glass = 'g') => {
    const u = norm3(n);
    return [
      ['cyl', add3(c, u, -0.05), add3(c, u, 0.02), R * 0.82, glass, { jit: 0.02 }],
      ['tor', add3(c, u, 0.01), R, R * 0.24, 'a', { rot: rotTo(u).map((v, i) => (i === 0 ? v + 90 : v)), jit: 0.03 }],
    ];
  };
  const EYE = hull([0.62, 0.15, 0.78]), EYEN = norm3([0.62, 0.08, 0.78]);
  const PH1 = hull([0.9, 0.38, 0.12]), PH2 = hull([0.88, 0.4, -0.2]);
  DESIGNS.yellowsub = {
    id: 'yellowsub', vs, arch: 'swimmer', pal,
    anim: { quirk: ['spin', 'happy', 'sway'], hover: 0.42, bounce: 1, tail: 1.1, maxSpeed: 4 },
    parts: [
      { n: 'body', p: [0, 0.86, 0], s: [
        ['ell', HC, HR, 'b', { top: 'B', topT: 0.75, jit: 0.025 }],
        ['ell', FC, FR, 'b', { blend: 0.2, top: 'B', topT: 0.75, jit: 0.025 }],
        ['ell', [0, 0.62, 0.15], [0.42, 0.24, 0.8], 'l', { paint: 1, belly: 'l', bellyT: 0.35 }],        // cream whale belly
        ...[-0.18, -0.06, 0.06, 0.18].map((x) => ['cap', [x, 0.46, 0.7], [x * 1.2, 0.4, -0.2], 0.022, 0.022, 'd', { paint: 1 }]),   // throat grooves
        // riveted hull seams (Ferro)
        ['tor', [0, 0.86, -0.32], 0.47, 0.028, 'o', { axis: 'z', paint: 1 }],
        ...Array.from({ length: 7 }, (_, i) => { const a = (-75 + i * 25) * D2R; return ['sph', [Math.cos(a) * 0.475, 0.86 + Math.sin(a) * 0.45, -0.3], 0.028, 'c', { jit: 0, m: 1 }]; }),
        // flat Edelmann swirl bands (deliberately unshaded) + a little flower-power motif
        ...band('p', 0.8, 0.96, 0.08, 0.0), ...band('s', 0.64, 0.8, 0.08, 0.0),
        // portholes: two small porthole-eyes behind the big front eye
        ...porthole(PH1, [1, 0.4, 0.15], 0.1), ...porthole(mx(PH1), [-1, 0.4, 0.15], 0.1),
        ...porthole(PH2, [1, 0.42, -0.15], 0.085), ...porthole(mx(PH2), [-1, 0.42, -0.15], 0.085),
        // the big front porthole (main eye)
        ...porthole(EYE, EYEN, 0.165), ...porthole(mx(EYE), mx(EYEN), 0.165),
        // the happy little hatch-mouth: brass rim round the lip
        ['tor', [0, 0.62, 0.9], 0.11, 0.028, 'a', { rot: [-70, 0, 0] }],
        // dorsal hatch dome with a gold braid ring (the Elite Four accent)
        ['ell', [0, 1.3, 0.02], [0.17, 0.12, 0.17], 'b', { blend: 0.05 }],
        ['tor', [0, 1.3, 0.02], 0.165, 0.038, 'y', { jit: 0.02 }],
      ] },
      { n: 'periscope', parent: 'body', p: [0, 1.28, 0.36], sway: { axis: 'y', amp: 0.55, freq: 0.45 }, s: [
        ['cyl', [0, 1.2, 0.36], [0, 1.72, 0.36], 0.05, 'a'],
        ['tor', [0, 1.36, 0.36], 0.06, 0.025, 'y'],
        ['cap', [0, 1.74, 0.34], [0, 1.78, 0.5], 0.075, 0.07, 'a'],
        ['cyl', [0, 1.78, 0.52], [0, 1.78, 0.57], 0.06, 'g'],
        ['sph', [0.025, 1.8, 0.57], 0.02, 'G', { glow: 1, jit: 0 }],
      ] },
      { n: 'finL', parent: 'body', p: [0.42, 0.66, 0.3], mirror: true, s: [
        ['ell', [0.62, 0.56, 0.22], [0.26, 0.05, 0.15], 'b', { rot: [0, -20, -24], belly: 'd', bellyT: 0.5 }],
        ['ell', [0.78, 0.49, 0.16], [0.1, 0.04, 0.09], 'o', { rot: [0, -20, -24], paint: 1 }],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.88, -0.66], s: [
        ['cap', [0, 0.88, -0.6], [0, 0.92, -1.0], 0.3, 0.15, 'b', { top: 'B', topT: 0.75, belly: 'l', bellyT: 0.5, jit: 0.025 }],
        ['tor', [0, 0.9, -0.8], 0.24, 0.026, 'o', { axis: 'z', paint: 1 }],
        ['poly', [0, 1.06, -0.92], [[0, -0.05], [0.04, 0.22], [-0.16, 0.26], [-0.16, -0.02]], 0.03, 'b', { plane: 'zy' }],     // dorsal rudder
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 0.92, -1.0], s: [
        ['cap', [0, 0.92, -1.0], [0, 0.92, -1.14], 0.14, 0.09, 'b'],
        // whale fluke (horizontal) with orange trim
        ['poly', [0, 0.92, -1.14], [[0.05, 0.06], [0.42, -0.02], [0.46, -0.16], [0.3, -0.12], [0, -0.03], [-0.3, -0.12], [-0.46, -0.16], [-0.42, -0.02], [-0.05, 0.06]], 0.035, 'b', { plane: 'xz' }],
        ['poly', [0, 0.92, -1.14], [[0.42, -0.02], [0.46, -0.16], [0.3, -0.12], [-0.3, -0.12], [-0.46, -0.16], [-0.42, -0.02], [-0.3, -0.06], [0.3, -0.06]], 0.05, 'o', { plane: 'xz', paint: 1 }],
        ['cyl', [0, 0.92, -1.12], [0, 0.92, -1.24], 0.035, 'a'],
      ] },
      { n: 'prop', parent: 'tail2', p: [0, 0.92, -1.24], spin: { axis: 'z', speed: 9 }, s: [
        ['sph', [0, 0.92, -1.25], 0.05, 'a'],
        ...[0, 1, 2].map((i) => { const a = i * 120; return ['ell', [Math.cos(a * D2R) * 0.11, 0.92 + Math.sin(a * D2R) * 0.11, -1.25], [0.11, 0.045, 0.02], 'a', { rot: [0, 25, a] }]; }),
      ] },
    ],
    eyes: { part: 'body', at: add3(EYE, EYEN, 0.03), dir: EYEN, style: 'big', iris: '#2fa8ff', px: 0.95 },
    mouth: { part: 'body', at: [0, 0.62, 0.91], dir: [0, -0.35, 1], style: 'smile', px: 1.0 },
    decals: [
      { part: 'body', at: add3(PH1, [1, 0.4, 0.15], 0.03), dir: [1, 0.4, 0.15], rows: ['.kk.', 'kiik', 'kiwk', '.kk.'], cmap: { i: '#2fa8ff' }, px: 0.8, mirror: true },
      { part: 'body', at: add3(PH2, [1, 0.42, -0.15], 0.03), dir: [1, 0.42, -0.15], rows: ['.kk.', 'kiik', 'kiwk', '.kk.'], cmap: { i: '#2fa8ff' }, px: 0.7, mirror: true },
      // flower-power motif on the flank (flat)
      { part: 'body', at: hull([0.9, -0.25, -0.5]), dir: [1, -0.2, -0.45], rows: pix(7, (x, y, r, a) => (r < 0.32 ? 'y' : r < 0.95 && Math.cos(a * 5) > 0.1 ? 'p' : '.')), cmap: { y: { c: '#ffd23f', glow: 1 }, p: { c: flat('#ff6fae'), glow: 1 } }, px: 0.9, mirror: true },
    ],
    fx: [
      { part: 'prop', at: [0, 0.92, -1.32], type: 'bubble', rate: 1.5, scale: 1.2 },
      { part: 'periscope', at: [0, 1.82, 0.5], type: 'bubble', rate: 0.3, scale: 0.6 },
    ],
    // Bonded: battle stations. The periscope extends, the propeller grows and two brass torpedo tubes
    // slide out under the flippers, each loaded with a glowing bubble-torpedo.
    bond: {
      parts: [
        { n: 'tubes', parent: 'body', p: [0, 0.5, 0.4], s: [
          ...[1, -1].flatMap((sx) => [
            ['cyl', [sx * 0.42, 0.52, 0.12], [sx * 0.42, 0.52, 0.66], 0.09, 'a'],
            ['tor', [sx * 0.42, 0.52, 0.6], 0.09, 0.035, 'y', { axis: 'z' }],
            ['tor', [sx * 0.42, 0.52, 0.22], 0.09, 0.03, 'A', { axis: 'z' }],
            ['sph', [sx * 0.42, 0.52, 0.68], 0.075, 's', { glow: 2, jit: 0 }],
          ]),
        ] },
      ],
      grow: { periscope: 1.35, prop: 1.4 },
      hat: { part: 'body', at: [0, 1.38, 0.02], scale: 1.1, tilt: 0 },
      aura: 'bubbles', auraColor: [0.8, 1.6, 2.6, 1],
    },
    // Elemental Form "Pepper Fleet": the hull's swirls spill off into a ring of flat psychedelic ribbons,
    // two mini-subs dock and orbit as drones, and the propeller trails a rainbow-band jet.
    forms: {
      elemental: {
        pal: { b: '#ffd84a', B: '#fff27a', d: '#f08a24' },
        parts: [
          { n: 'swirlRing', parent: 'body', p: [0, 0.9, 0], spin: { axis: 'y', speed: 0.7 }, s: [
            ...['p', 's', 'm'].flatMap((col, k) => {
              const pts = Array.from({ length: 33 }, (_, i) => { const a = (i / 32) * Math.PI * 2; return [Math.sin(a) * 0.98, 0.98 + Math.sin(a * 4) * 0.07 - k * 0.085 + Math.cos(a) * 0.12, Math.cos(a) * 1.22]; });
              return tube(pts, 0.042, 0.042, col, { glow: 1, jit: 0 });
            }),
          ] },
          { n: 'drones', parent: 'body', p: [0, 1.0, 0], spin: { axis: 'y', speed: -1.1 }, s: [
            ...[1, -1].flatMap((sx) => { const c = [sx * 1.2, 1.32, -0.25 * sx], f = sx;
              return [
                ['ell', c, [0.15, 0.14, 0.26], 'b', { top: 'B', topT: 0.7, belly: 'l', bellyT: 0.5, jit: 0.02 }],
                ['cyl', add3(c, [0, 0.12, 0.06]), add3(c, [0, 0.24, 0.06]), 0.03, 'a'],
                ['cap', add3(c, [0, 0.24, 0.05]), add3(c, [0, 0.25, 0.12]), 0.04, 0.035, 'a'],
                ['cyl', add3(c, [0.11, 0.03, 0.1]), add3(c, [0.15, 0.03, 0.1]), 0.06, 'g'], ['cyl', add3(c, [-0.11, 0.03, 0.1]), add3(c, [-0.15, 0.03, 0.1]), 0.06, 'g'],
                ['tor', add3(c, [0.135, 0.03, 0.1]), 0.065, 0.024, 'a', { axis: 'x' }], ['tor', add3(c, [-0.135, 0.03, 0.1]), 0.065, 0.024, 'a', { axis: 'x' }],
                ['tor', add3(c, [0, 0, -0.06]), 0.145, 0.022, 'o', { axis: 'z', paint: 1 }],
                ['cap', add3(c, [0, 0, -0.22]), add3(c, [0, 0, -0.34]), 0.06, 0.035, 'a'],
                ['ell', add3(c, [0, 0, -0.36]), [0.12, 0.02, 0.05], 'o', { rot: [0, 0, f * 0] }],
              ]; }),
          ] },
          { n: 'jet', parent: 'tail2', p: [0, 0.92, -1.3], s: [
            ...['p', 'y', 'm', 's', 'v'].map((col, i) => ['cyl', [0, 0.92, -1.3 - i * 0.09], [0, 0.92, -1.39 - i * 0.09], 0.12 - i * 0.017, col, { glow: col === 'y' ? 2 : 1, jit: 0 }]),
          ] },
        ],
        fx: [
          { part: 'jet', at: [0, 0.92, -1.75], type: 'bubble', rate: 3, scale: 1.4 },
          { part: 'swirlRing', at: [0, 1.4, 0.9], type: 'note', rate: 0.6, scale: 1.0, color: '#ff6fae' },
        ],
      },
    },
  };
  LORE.yellowsub = {
    name: 'Yellowsub', element: 'hydro', element2: 'ferro', stage: 1, final: true, height: '2.2 m long',
    desc: 'The Elite Four drummer\'s partner. It sails through the air over the stadium as if the sky were a sea of green, and everyone it passes starts humming. The portholes along its side blink one after another when it is thinking.',
    personality: 'Jolly, friendly and endlessly optimistic; it treats every battle like a cruise with friends, but its periscope never stops looking for an opening.',
    look: 'Round toy-like yellow submarine-whale floating in the air, a big blue anime eye behind a brass front porthole on each side, two little porthole-eyes along its flank, a happy hatch mouth, a swivelling brass periscope crest, yellow flipper fins, a whale fluke with a brass propeller, riveted orange seams, a gold braid ring round its dorsal hatch and flat pink and sky swirl bands on its hull.',
  };
}

// =====================================================================
// BLACKBYRD (Aero, "Blackbird") — roster §11.2
// A sleek night songbird: glossy black with blue iridescence, a golden bill and eye-ring as its only
// warm colour, one white feather at the throat (the White Album nod), very long wings whose six primaries
// each carry a fine bright shaft line like the six strings of an acoustic guitar, and a long tapering tail.
// =====================================================================
{
  const vs = 0.032;
  const pal = {
    b: '#1b1b28', B: '#262636', i: '#2e3858', I: '#6a8aff',            // plumage + iridescent sheen
    s: '#e8f0ff', W: '#ffffff', h: '#ffe6b0', H: '#ff9ab8',               // string lines, throat feather, dawn (elemental)
    o: '#ffb21f', O: '#ffd86a', e: '#e08a10',                            // bill, eye-ring
    L: '#2a2a3a', y: '#ffd23f', k: '#08080e',                            // legs, Elite Four gold braid
  };
  const S = [0.11, 0.7, 0.02];                                           // shoulder (wing pivot)
  const HC = [0, 0.89, 0.12], HR = [0.13, 0.125, 0.135], EN = norm3([0.76, 0.1, 0.64]);
  const EP = (() => { const t = 1 / Math.hypot(EN[0] / HR[0], EN[1] / HR[1], EN[2] / HR[2]); return add3(HC, EN, t); })();
  const EYE_N = norm3([EP[0] - HC[0], (EP[1] - HC[1]) * (HR[0] / HR[1]) ** 2, (EP[2] - HC[2]) * (HR[0] / HR[2]) ** 2]);
  const W = [0.5, 0.7, -0.05];                                           // wrist (primaries fan from here)
  const WROT = [0, 6, 12];
  const prim = [], strings = [];
  for (let k = 0; k < 6; k++) {
    const th = 2 + k * 13, L = 0.64 - k * 0.05, d = [Math.cos(th * D2R), 0, -Math.sin(th * D2R)];
    const root = add3(W, d, -0.04), c = add3(root, d, L / 2);
    prim.push(['box', c, [L / 2, 0.034, 0.044], 'b', { rot: [0, th, 0], round: 0.032, top: 'i', topT: 0.9 }]);
    // the six "strings": 1-px moonlit shaft lines (decals lie flat on each primary's top)
    const at = rotPt(add3(add3(root, d, L * 0.5 + 0.02), [0, 1, 0], 0.034), S, WROT), up = rotPt(add3(S, [0, 1, 0]), S, WROT), al = rotPt(add3(S, d), S, WROT);
    const nUp = [up[0] - S[0], up[1] - S[1], up[2] - S[2]], nAl = [al[0] - S[0], al[1] - S[1], al[2] - S[2]];
    const n = Math.round((L - 0.12) / (vs * 0.9));
    strings.push({ part: 'wingL', at, dir: nUp, roll: decalRoll(nUp, nAl), rows: ['w'.repeat(n)], cmap: { w: { c: 's', glow: 1 } }, px: 0.9, lift: 0.006 });
    strings.push({ part: 'wingR', at: mx(at), dir: mx(nUp), roll: decalRoll(mx(nUp), mx(nAl)), rows: ['w'.repeat(n)], cmap: { w: { c: 's', glow: 1 } }, px: 0.9, lift: 0.006 });
  }
  const secondaries = [0.16, 0.25, 0.34, 0.43].map((x, i) => ['ell', [x, 0.7, -0.2], [0.06, 0.034, 0.13], 'b', { rot: [0, -8 + i * 4, 0], top: 'i', topT: 0.8 }]);
  const wing = rotShapes([
    ['poly', [0, 0.7, 0], [[0.07, 0.08], [0.32, 0.07], [0.54, 0.02], [0.58, -0.08], [0.5, -0.2], [0.08, -0.17]], 0.038, 'b', { plane: 'xz', top: 'i', topT: 0.75 }],
    ['cap', [0.09, 0.705, 0.04], [0.54, 0.705, 0.0], 0.05, 0.035, 'B', { top: 'i', topT: 0.6 }],          // leading edge
    ...secondaries, ...prim,
  ], S, WROT);
  DESIGNS.blackbyrd = {
    id: 'blackbyrd', vs, arch: 'flyer', pal,
    anim: { quirk: ['nod', 'sway', 'happy'], hover: 0.3, flap: 0.55, bounce: 0.8, maxSpeed: 6 },
    parts: [
      { n: 'body', p: [0, 0.62, 0], s: [
        ['ell', [0, 0.67, 0.06], [0.125, 0.15, 0.15], 'b', { top: 'B', topT: 0.6 }],                       // slim chest
        ['cap', [0, 0.63, 0.0], [0, 0.56, -0.26], 0.12, 0.07, 'b', { blend: 0.06, top: 'i', topT: 0.7 }],  // slender back to the tail root
      ] },
      { n: 'head', parent: 'body', p: [0, 0.8, 0.08], s: [
        ['ell', HC, HR, 'b', { top: 'i', topT: 0.8 }],
        ['ell', [0, 0.82, 0.12], [0.1, 0.07, 0.1], 'b', { blend: 0.05 }],
        // golden bill, slightly open in song
        ['cap', [0, 0.875, 0.22], [0, 0.85, 0.42], 0.045, 0.01, 'o'],
        ['cap', [0, 0.84, 0.21], [0, 0.808, 0.36], 0.032, 0.008, 'e'],
        // golden eye-rings
        // the single white throat feather
        ['ell', [0, 0.75, 0.2], [0.04, 0.06, 0.03], 'W', { rot: [-20, 0, 0] }],
        // crown tuft (hat sits behind it)
        ['cap', [0, 0.99, 0.1], [0, 1.03, -0.02], 0.04, 0.012, 'b', { top: 'i', topT: 0.6 }],
      ] },
      { n: 'wingL', parent: 'body', p: S, mirror: true, s: wing },
      { n: 'tail', parent: 'body', p: [0, 0.56, -0.24], sway: { axis: 'x', amp: 0.05, freq: 1.2 }, s: rotShapes([
        ['poly', [0, 0.56, -0.24], [[-0.06, 0.02], [0.06, 0.02], [0.11, -0.46], [0.07, -0.56], [0.03, -0.5], [0, -0.6], [-0.03, -0.5], [-0.07, -0.56], [-0.11, -0.46]], 0.036, 'b', { plane: 'xz', top: 'i', topT: 0.75 }],
        ['cap', [0, 0.595, -0.3], [0, 0.59, -0.74], 0.03, 0.026, 's', { paint: 1, glow: 1, jit: 0 }],
      ], [0, 0.56, -0.24], [-14, 0, 0]) },
      { n: 'legL', parent: 'body', p: [0.06, 0.5, 0.0], mirror: true, s: [
        ['cap', [0.06, 0.5, 0.0], [0.065, 0.32, 0.04], 0.03, 0.022, 'L'],
        ['tor', [0.063, 0.42, 0.02], 0.032, 0.016, 'y', { jit: 0 }],                                     // gold braid band (Elite Four)
        ['cap', [0.065, 0.32, 0.04], [0.04, 0.3, 0.12], 0.018, 0.012, 'L'], ['cap', [0.065, 0.32, 0.04], [0.09, 0.3, 0.12], 0.018, 0.012, 'L'],
        ['cap', [0.065, 0.32, 0.04], [0.065, 0.3, -0.04], 0.016, 0.012, 'L'],
      ] },
    ],
    // anime eye inside the golden eye-ring (hand-drawn expressions so the ring survives blinks)
    eyes: { part: 'head', at: EP, dir: EYE_N, iris: '#4a2c14', px: 0.56, cmap: { o: '#ffc83a' },
      rows: ['..ooo..', '.okkko.', 'okwiiko', 'okiiiko', 'okiiiko', '.okkko.', '..ooo..'],
      variants: {
        closed: ['..ooo..', '.o...o.', 'o.....o', 'okkkkko', 'o.....o', '.o...o.', '..ooo..'],
        happy: ['..ooo..', '.o...o.', 'o..k..o', 'o.k.k.o', 'ok...ko', '.o...o.', '..ooo..'],
        hurt: ['..ooo..', '.ok..o.', 'o.kk..o', 'o...kko', 'o.kk..o', '.ok..o.', '..ooo..'],
        ko: ['..ooo..', '.o...o.', 'o.k.k.o', 'o..k..o', 'o.k.k.o', '.o...o.', '..ooo..'],
        angry: ['..ooo..', '.okk.o.', 'okwikko', 'okiiiko', 'okiiiko', '.okkko.', '..ooo..'],
        sad: ['..ooo..', '.o.kko.', 'okkiiko', 'okwiiko', 'okiiiko', '.okkko.', '..ooo..'],
      } },
    mouth: { part: 'head', style: 'none', at: [0, 0.85, 0.3] },
    decals: strings,
    fx: [
      { part: 'wingL', at: rotPt(add3(W, [Math.cos(4 * D2R), 0, -Math.sin(4 * D2R)], 0.5), S, [0, 6, 12]), type: 'spark', rate: 0.25, scale: 0.5, color: '#e8f0ff', mirror: true },
    ],
    // Bonded: the night-flight trail. Two moonlit streamers unfurl from the tail and the long wings stretch wider.
    bond: {
      parts: [
        { n: 'streamers', parent: 'tail', p: [0, 0.56, -0.5], sway: { axis: 'y', amp: 0.12, freq: 1.3 }, s: [
          ...[1, -1].flatMap((sx) => tube(bez3([sx * 0.05, 0.53, -0.62], [sx * 0.16, 0.5, -0.9], [sx * 0.04, 0.42, -1.05], [sx * 0.18, 0.4, -1.3], 7), 0.032, 0.026, 's', { glow: 1, jit: 0 })),
        ] },
      ],
      grow: { wingL: 1.15, wingR: 1.15, tail: 1.15 },
      hat: { part: 'head', at: [0, 0.99, 0.1], scale: 0.85, tilt: 6 },
      aura: 'notes', auraColor: [1.2, 2.0, 1.5, 1],
    },
    // Elemental Form "Into the Light": the plumage turns pearl-white with black string lines (inverted), the
    // wings grow long luminous streamer feathers and a dawn halo rises behind the head.
    forms: {
      elemental: {
        pal: { b: '#eceaf2', B: '#ffffff', i: '#c8d2ec', s: '#1b1b28', L: '#c8c4d4' },
        parts: [
          { n: 'dawnHalo', parent: 'head', p: [0, 0.92, -0.06], spin: { axis: 'z', speed: 0.6 }, s: [
            ['tor', [0, 0.92, -0.06], 0.24, 0.03, 'h', { axis: 'z', glow: 2 }],
            ...Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2, L = i % 2 ? 0.08 : 0.14;
              return ['cap', [Math.cos(a) * 0.27, 0.92 + Math.sin(a) * 0.27, -0.06], [Math.cos(a) * (0.27 + L), 0.92 + Math.sin(a) * (0.27 + L), -0.06], 0.028, 0.012, i % 2 ? 'H' : 'h', { glow: 2 }]; }),
          ] },
          { n: 'lightL', parent: 'wingL', mirror: true, p: S, s: rotShapes([
            ...[0, 2, 4].flatMap((k) => { const th = 2 + k * 13, d = [Math.cos(th * D2R), 0, -Math.sin(th * D2R)], tip = add3(W, d, 0.6 - k * 0.05);
              return tube(bez(tip, add3(tip, [0.12, 0, -0.18]), add3(tip, [0.05, -0.06, -0.5]), 5), 0.036, 0.014, 'h', { glow: 1, jit: 0 }); }),
          ], S, WROT) },
        ],
        eyes: { iris: '#c88a20' },
        fx: [
          { part: 'dawnHalo', at: [0, 1.2, -0.06], type: 'star', rate: 1, scale: 0.7, color: '#ffe6b0' },
          { part: 'lightL', at: rotPt(add3(W, [1, 0, -0.3], 0.9), S, WROT), type: 'glow', rate: 1.2, scale: 0.6, color: '#ffe6b0', mirror: true },
        ],
      },
    },
  };
  LORE.blackbyrd = {
    name: 'Blackbyrd', element: 'aero', stage: 1, final: true, height: '1.0 m (2.1 m wingspan)',
    desc: 'The Elite Four bassist\'s partner. It sings on the stadium roof in the dead of night, and trainers who hear it swear their broken bonds feel mended by morning. Each of its six long primaries hums a different note when the wind crosses it.',
    personality: 'Gentle, patient and quietly brave; it waits for its moment, then flies straight into the dark without hesitating.',
    look: 'Sleek glossy black songbird with a deep-blue sheen, a golden bill and golden eye-rings around gentle brown eyes, a single white throat feather, very long wings whose six fingered primaries each carry a fine moonlit shaft line like a guitar string, a long tapering tail and a gold braid band on one leg.',
  };
}
