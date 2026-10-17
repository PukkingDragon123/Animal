// Elemon roster designs (see docs/MODELING.md for the DSL).
// Small helpers: XF/xf/xfDesign scale + translate shape lists (model space)
// so proportions can be tuned without rewriting coordinates.
const XF = (p, k, o, t) => [o[0] + k * (p[0] - o[0]) + t[0], o[1] + k * (p[1] - o[1]) + t[1], o[2] + k * (p[2] - o[2]) + t[2]];
const AX = { x: 0, y: 1, z: 2 };
function xfOpts(op, k, o, t) {
  if (!op || typeof op !== 'object' || Array.isArray(op)) return op;
  const q = Object.assign({}, op);
  if (q.round) q.round *= k;
  if (q.noise) q.noise *= k;
  if (q.noiseScale) q.noiseScale *= k;
  if (q.fat) q.fat *= k;
  if (q.stripes) { const a = AX[q.stripes.axis || 'y']; q.stripes = Object.assign({}, q.stripes, { p: q.stripes.p * k, w: q.stripes.w * k, o: o[a] + k * ((q.stripes.o || 0) - o[a]) + t[a] }); }
  if (q.grad) { const a = AX[q.grad.axis || 'y']; q.grad = Object.assign({}, q.grad, { a: o[a] + k * (q.grad.a - o[a]) + t[a], b: o[a] + k * (q.grad.b - o[a]) + t[a] }); }
  if (q.spots) q.spots = Object.assign({}, q.spots, { s: (q.spots.s || 0.06) * k });
  return q;
}
function xf(shapes, k = 1, o = [0, 0, 0], t = [0, 0, 0]) {
  return shapes.map((sh) => {
    const s = sh.slice();
    const P = (v) => XF(v, k, o, t);
    switch (s[0]) {
      case 'sph': s[1] = P(s[1]); s[2] *= k; s[4] = xfOpts(s[4], k, o, t); break;
      case 'ell': case 'box': s[1] = P(s[1]); s[2] = s[2].map((v) => v * k); s[4] = xfOpts(s[4], k, o, t); break;
      case 'cap': s[1] = P(s[1]); s[2] = P(s[2]); s[3] *= k; s[4] *= k; s[6] = xfOpts(s[6], k, o, t); break;
      case 'cyl': s[1] = P(s[1]); s[2] = P(s[2]); s[3] *= k; s[5] = xfOpts(s[5], k, o, t); break;
      case 'tor': s[1] = P(s[1]); s[2] *= k; s[3] *= k; s[5] = xfOpts(s[5], k, o, t); break;
      case 'poly': s[1] = P(s[1]); s[2] = s[2].map((q) => [q[0] * k, q[1] * k]); s[3] *= k; s[5] = xfOpts(s[5], k, o, t); break;
      default: break;
    }
    while (s.length && s[s.length - 1] === undefined) s.pop();
    return s;
  });
}
// Scale a whole design about the ground origin (vs unchanged).
function xfDesign(d, k, o = [0, 0, 0], t = [0, 0, 0]) {
  const P = (v) => XF(v, k, o, t);
  const out = Object.assign({}, d);
  out.parts = d.parts.map((pt) => Object.assign({}, pt, { p: P(pt.p), s: xf(pt.s, k, o, t) }));
  for (const key of ['eyes', 'mouth']) if (d[key]) out[key] = Object.assign({}, d[key], { at: P(d[key].at) });
  if (d.decals) out.decals = d.decals.map((dc) => Object.assign({}, dc, { at: P(dc.at) }));
  if (d.fx) out.fx = d.fx.map((f) => Object.assign({}, f, { at: P(f.at), scale: (f.scale || 1) * k }));
  if (d.anim && d.anim.hover) out.anim = Object.assign({}, d.anim, { hover: d.anim.hover * k });
  return out;
}

// ---------------------------------------------------------------- Beatlet
const beatlet = {
  id: 'beatlet', vs: 0.017, arch: 'insect',
  pal: {
    s: '#1b2452', G: '#23808a', S: '#a9c8ff', k: '#121018', w: '#ffffff',
    h: '#7a4626', H: '#9c5f33', d: '#5a311a', f: '#ffe1bd', c: '#ff9c9c',
    b: '#8fd65a', l: '#2b3570', j: '#4a5aa8', n: '#161c3c', N: '#6f8de0',
  },
  anim: { quirk: ['headbang', 'sway', 'happy'], bounce: 1.1 },
  parts: [
    { n: 'body', p: [0, 0.2, -0.05], s: [
      ['ell', [0, 0.19, 0.05], [0.13, 0.1, 0.09], 's'],
      ['ell', [0, 0.2, -0.08], [0.165, 0.145, 0.19], 's', { belly: 'b', bellyT: 0.4, grad: { axis: 'y', to: 's', a: 0.12, b: 0.24 } }],
      ['ell', [0, 0.2, -0.08], [0.165, 0.145, 0.19], 'G', { paint: 1, grad: { axis: 'y', to: 's', a: 0.12, b: 0.25 }, belly: 'b', bellyT: 0.4 }],
      ['ell', [0, 0.14, -0.08], [0.172, 0.035, 0.198], 'G', { belly: 'b', bellyT: 0.3 }],
      ['box', [0, 0.3, -0.1], [0.008, 0.1, 0.2], 'k', { paint: 1 }],
      ['ell', [0.075, 0.335, -0.05], [0.022, 0.03, 0.085], 'S', { paint: 1, m: 1, jit: 0 }],
      ['ell', [0.07, 0.335, 0.015], [0.012, 0.03, 0.016], 'w', { paint: 1, m: 1, jit: 0 }],
    ] },
    { n: 'head', parent: 'body', p: [0, 0.21, 0.11], s: [
      ['ell', [0, 0.285, 0.16], [0.19, 0.15, 0.16], 'h', { noise: 0.007, noiseScale: 0.035, dither: { col: 'H', amt: 0.2 } }],
      ['ell', [0.15, 0.18, 0.14], [0.055, 0.045, 0.1], 'h', { m: 1, noise: 0.006, noiseScale: 0.03, dither: { col: 'H', amt: 0.2 } }],
      ['box', [0, 0.17, 0.3], [0.122, 0.095, 0.14], 'h', { sub: 1 }],
      ...[-0.11, -0.066, -0.022, 0.022, 0.066, 0.11].map((x) => ['box', [x, 0.272, 0.32], [0.0085, 0.0085, 0.1], 'h', { sub: 1 }]),
      ...[-0.088, -0.044, 0, 0.044, 0.088].map((x) => ['box', [x, 0.33, 0.3], [0.0085, 0.06, 0.1], 'd', { paint: 1 }]),
      ['ell', [0, 0.225, 0.18], [0.145, 0.13, 0.12], 'f', { under: 1 }],
      ['ell', [0.095, 0.18, 0.27], [0.026, 0.016, 0.03], 'c', { paint: 1, m: 1 }],
      ['cap', [0, 0.38, 0.2], [0, 0.465, 0.25], 0.046, 0.032, 'n'],
      ['cap', [0, 0.465, 0.25], [0, 0.515, 0.26], 0.032, 0.022, 'n'],
      ['cap', [0, 0.515, 0.26], [0.032, 0.555, 0.27], 0.019, 0.011, 'n', { m: 1, tip: 'N', tipT: 0.55 }],
      ['ell', [0.018, 0.47, 0.285], [0.009, 0.03, 0.01], 'N', { paint: 1, jit: 0 }],
    ] },
    { n: 'legFL', parent: 'body', p: [0.1, 0.13, 0.06], mirror: true, s: [
      ['cap', [0.1, 0.13, 0.06], [0.18, 0.12, 0.11], 0.022, 0.02, 'l'],
      ['sph', [0.18, 0.12, 0.11], 0.021, 'j'],
      ['cap', [0.18, 0.12, 0.11], [0.21, 0.045, 0.15], 0.018, 0.016, 'l'],
      ['ell', [0.215, 0.028, 0.17], [0.028, 0.028, 0.04], 'k', { jit: 0.03 }],
      ['box', [0.215, 0.01, 0.142], [0.018, 0.01, 0.01], 'd'],
    ] },
    { n: 'legML', parent: 'body', p: [0.12, 0.12, -0.06], mirror: true, s: [
      ['cap', [0.12, 0.12, -0.06], [0.21, 0.12, -0.06], 0.022, 0.02, 'l'],
      ['sph', [0.21, 0.12, -0.06], 0.021, 'j'],
      ['cap', [0.21, 0.12, -0.06], [0.245, 0.045, -0.05], 0.018, 0.016, 'l'],
      ['ell', [0.25, 0.028, -0.035], [0.028, 0.028, 0.04], 'k', { jit: 0.03 }],
      ['box', [0.25, 0.01, -0.063], [0.018, 0.01, 0.01], 'd'],
    ] },
    { n: 'legBL', parent: 'body', p: [0.1, 0.12, -0.18], mirror: true, s: [
      ['cap', [0.1, 0.12, -0.18], [0.18, 0.12, -0.23], 0.022, 0.02, 'l'],
      ['sph', [0.18, 0.12, -0.23], 0.021, 'j'],
      ['cap', [0.18, 0.12, -0.23], [0.21, 0.045, -0.25], 0.018, 0.016, 'l'],
      ['ell', [0.215, 0.028, -0.235], [0.028, 0.028, 0.04], 'k', { jit: 0.03 }],
      ['box', [0.215, 0.01, -0.263], [0.018, 0.01, 0.01], 'd'],
    ] },
  ],
  eyes: { part: 'head', at: [0.058, 0.21, 0.29], dir: [0.3, 0, 1], style: 'anime', iris: '#2f6fe0', px: 0.9 },
  mouth: { part: 'head', at: [0, 0.155, 0.29], dir: [0, -0.25, 1], style: 'smile', px: 0.8 },
  fx: [{ part: 'head', at: [0, 0.58, 0.26], type: 'note', rate: 1 }],
};

// ---------------------------------------------------------------- Lenshorn
// John-inspired: white-suit shell, long centre-parted hair, round wire specs,
// a guitar-headstock horn and a peace sign on the elytra.
const LENS_HEAD = [
  ['ell', [0, 0.83, 0.025], [0.188, 0.168, 0.165], 'h', { noise: 0.005, noiseScale: 0.05, dither: { col: 'H', amt: 0.2 } }],
  ['cap', [0.155, 0.8, 0.0], [0.165, 0.66, -0.02], 0.058, 0.045, 'h', { m: 1, noise: 0.005, noiseScale: 0.05, dither: { col: 'H', amt: 0.2 } }],
  ['ell', [0, 0.75, -0.07], [0.15, 0.1, 0.1], 'h', { noise: 0.005, noiseScale: 0.05, dither: { col: 'H', amt: 0.2 } }],
  ['box', [0, 0.77, 0.2], [0.143, 0.135, 0.16], 'h', { sub: 1 }],
  ['ell', [0, 0.8, 0.05], [0.17, 0.155, 0.145], 'f', { under: 1 }],
  ['box', [0, 0.96, 0.1], [0.008, 0.05, 0.12], 'd', { paint: 1 }],
  ['ell', [0.115, 0.735, 0.15], [0.03, 0.018, 0.03], 'c', { paint: 1, m: 1 }],
  ['tor', [0.072, 0.79, 0.19], 0.056, 0.011, 'o', { m: 1, axis: 'z' }],
  ['cap', [0.018, 0.795, 0.2], [-0.018, 0.795, 0.2], 0.01, 0.01, 'o'],
  ['cap', [0.127, 0.8, 0.17], [0.165, 0.81, 0.02], 0.009, 0.009, 'o', { m: 1 }],
  ['cap', [0, 0.9, 0.12], [0, 1.0, 0.11], 0.048, 0.036, 'n'],
  ['poly', [0, 0, 0.105], [[-0.036, 0.99], [0.036, 0.99], [0.064, 1.04], [0.072, 1.12], [0.046, 1.18], [0, 1.195], [-0.046, 1.18], [-0.072, 1.12], [-0.064, 1.04]], 0.02, 'n'],
  ['poly', [0, 0, 0.126], [[-0.022, 1.005], [0.022, 1.005], [0, 1.055]], 0.007, 'P'],
  ...[1.045, 1.095, 1.145].map((y) => ['cyl', [0.06, y, 0.105], [0.095, y, 0.105], 0.009, 'm', { m: 1 }]),
  ...[1.045, 1.095, 1.145].map((y) => ['ell', [0.104, y, 0.105], [0.011, 0.016, 0.011], 'P', { m: 1 }]),
  ['box', [0, 0.992, 0.128], [0.032, 0.005, 0.008], 'P'],
  ...[-0.02, 0, 0.02].map((x) => ['box', [x, 0.97, 0.15], [0.003, 0.03, 0.01], 'm', { paint: 1 }]),
  ['ell', [0.022, 0.95, 0.155], [0.008, 0.025, 0.01], 'N', { paint: 1, jit: 0 }],
];
const LH = (v) => XF(v, 1.15, [0, 0.66, 0.02], [0, 0.04, 0]);
const lenshorn = xfDesign({
  id: 'lenshorn', vs: 0.019, arch: 'biped',
  pal: {
    w: '#f1eee6', W: '#fbfaff', g: '#c3bcd6', e: '#8b5cf6', v: '#8f7ad6', V: '#6c56b8',
    f: '#ffe1bd', c: '#ffb0a0', h: '#8a5532', H: '#a8693e', d: '#5c3420', Y: '#ffe14a', Q: '#7cc04a',
    n: '#17151c', N: '#55506a', m: '#d9dde6', o: '#e9c25a', l: '#2f2a44', L: '#4a4266', s: '#bdb8c8', P: '#f6f0e0',
  },
  anim: { quirk: ['sway', 'headbang', 'nod'], bounce: 0.9, gait: 0.9 },
  parts: [
    { n: 'body', p: [0, 0.44, 0], s: [
      ['ell', [0, 0.63, -0.005], [0.2, 0.095, 0.145], 'W', { belly: 'g', bellyT: 0.6 }],
      ['poly', [0, 0, 0.14], [[-0.12, 0.74], [0.12, 0.74], [0.03, 0.54], [-0.03, 0.54]], 0.07, 'g', { paint: 1 }],
      ['poly', [0, 0, 0.14], [[-0.095, 0.74], [0.095, 0.74], [0.01, 0.55], [-0.01, 0.55]], 0.07, 'g', { sub: 1 }],
      ['ell', [0, 0.47, 0.03], [0.145, 0.19, 0.12], 'v', { under: 1, stripes: { axis: 'y', p: 0.045, w: 0.015, col: 'V' } }],
      ['ell', [0.078, 0.44, -0.085], [0.105, 0.28, 0.1], 'W', { m: 1, rot: [0, 0, 4], belly: 'g', bellyT: 0.55 }],
      ['ell', [0.078, 0.44, -0.085], [0.105, 0.28, 0.1], 'W', { m: 1, rot: [0, 0, 4], paint: 1, grad: { axis: 'y', to: 'W', a: 0.17, b: 0.3 }, belly: 'g', bellyT: 0.55 }],
      ['box', [0, 0.45, -0.2], [0.008, 0.28, 0.08], 'g', { paint: 1 }],
      ['sph', [0, 0.5, 0.15], 0.014, 'o'],
      ['ell', [0.085, 0.67, 0.13], [0.02, 0.026, 0.02], 'Y'],
      ['sph', [0.085, 0.698, 0.135], 0.008, 'Q'],
      ['cyl', [0, 0.47, -0.1], [0, 0.47, -0.3], 0.1, 'e', { paint: 1, glow: 1 }],
      ['cyl', [0, 0.47, -0.1], [0, 0.47, -0.3], 0.08, 'W', { paint: 1 }],
      ['box', [0, 0.47, -0.2], [0.01, 0.09, 0.12], 'e', { paint: 1, glow: 1 }],
      ['box', [0.038, 0.432, -0.2], [0.01, 0.05, 0.12], 'e', { paint: 1, glow: 1, rot: [0, 0, 45] }],
      ['box', [-0.038, 0.432, -0.2], [0.01, 0.05, 0.12], 'e', { paint: 1, glow: 1, rot: [0, 0, -45] }],
      ['ell', [0.13, 0.6, -0.12], [0.022, 0.06, 0.03], '#ffffff', { paint: 1, m: 1, jit: 0 }],
    ] },
    { n: 'head', parent: 'body', p: [0, 0.7, 0.02], s: xf(LENS_HEAD, 1.15, [0, 0.66, 0.02], [0, 0.04, 0]) },
    { n: 'armL', parent: 'body', p: [0.2, 0.64, 0.0], mirror: true, s: [
      ['sph', [0.2, 0.64, 0.0], 0.06, 'W'],
      ['cap', [0.2, 0.64, 0.0], [0.24, 0.51, 0.02], 0.052, 0.042, 'W'],
      ['sph', [0.243, 0.5, 0.024], 0.03, 'L'],
      ['cap', [0.243, 0.5, 0.024], [0.255, 0.39, 0.05], 0.03, 0.025, 'l'],
      ['cap', [0.255, 0.39, 0.05], [0.27, 0.33, 0.08], 0.024, 0.01, 'l'],
      ['cap', [0.255, 0.39, 0.05], [0.235, 0.33, 0.04], 0.02, 0.009, 'l'],
    ] },
    { n: 'legL', parent: 'body', p: [0.08, 0.31, 0.01], mirror: true, s: [
      ['ell', [0.085, 0.27, 0.025], [0.06, 0.075, 0.065], 'W', { belly: 'g', bellyT: 0.6 }],
      ['cap', [0.085, 0.27, 0.02], [0.098, 0.17, 0.03], 0.034, 0.03, 'l'],
      ['sph', [0.098, 0.17, 0.03], 0.033, 'L'],
      ['cap', [0.098, 0.17, 0.03], [0.1, 0.07, 0.0], 0.029, 0.025, 'l'],
      ['ell', [0.1, 0.04, 0.04], [0.056, 0.04, 0.088], 'W', { belly: 's', bellyT: 0.5 }],
      ['box', [0.1, 0.012, 0.04], [0.058, 0.012, 0.088], 's', { round: 0.01 }],
    ] },
  eyes: { part: 'head', at: LH([0.072, 0.79, 0.19]), dir: [0.25, 0, 1], style: 'round', iris: '#7a4a22', px: 0.95 },
  mouth: { part: 'head', at: LH([0, 0.708, 0.18]), dir: [0, -0.35, 1], style: 'smile', px: 0.85, lift: 0.014 },
  fx: [{ part: 'head', at: LH([0, 1.2, 0.1]), type: 'note', rate: 1.2 }],
}, 0.92);

export const DESIGNS = { beatlet, lenshorn };
export const LORE = {};
