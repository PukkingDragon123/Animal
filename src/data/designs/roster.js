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
  ],
  eyes: { part: 'head', at: LH([0.072, 0.79, 0.19]), dir: [0.25, 0, 1], style: 'round', iris: '#7a4a22', px: 0.95 },
  mouth: { part: 'head', at: LH([0, 0.708, 0.18]), dir: [0, -0.35, 1], style: 'smile', px: 0.85, lift: 0.014 },
  fx: [{ part: 'head', at: LH([0, 1.2, 0.1]), type: 'note', rate: 1.2 }],
}, 0.92);

// Shared biped-beetle limbs (Beatle evolutions), in the pre-scale frame used by
// lenshorn/mccarapace/harrisun (xfDesign(…, 0.92) afterwards).
// c: { sleeve, limb, joint, thigh, feet: 'shoe'|'bare'|'sandal', shoe, sole }
function bbLimbs(c) {
  const feet = c.feet === 'bare'
    ? [['cap', [0.1, 0.07, 0.0], [0.1, 0.03, 0.05], 0.026, 0.02, c.limb],
      ['cap', [0.1, 0.025, 0.05], [0.125, 0.015, 0.11], 0.016, 0.01, c.limb],
      ['cap', [0.1, 0.025, 0.05], [0.075, 0.015, 0.105], 0.016, 0.01, c.limb],
      ['cap', [0.1, 0.03, 0.0], [0.1, 0.015, -0.05], 0.014, 0.009, c.limb]]
    : c.feet === 'sandal'
      ? [['ell', [0.1, 0.035, 0.035], [0.045, 0.03, 0.075], c.limb],
        ['box', [0.1, 0.01, 0.035], [0.055, 0.01, 0.085], c.sole, { round: 0.008 }],
        ['tor', [0.1, 0.04, 0.05], 0.042, 0.009, c.shoe, { axis: 'z' }]]
      : [['ell', [0.1, 0.04, 0.04], [0.056, 0.04, 0.088], c.shoe, { belly: c.sole, bellyT: 0.5 }],
        ['box', [0.1, 0.012, 0.04], [0.058, 0.012, 0.088], c.sole, { round: 0.01 }]];
  return [
    { n: 'armL', parent: 'body', p: [0.2, 0.64, 0.0], mirror: true, s: [
      ['sph', [0.2, 0.64, 0.0], 0.06, c.sleeve],
      ['cap', [0.2, 0.64, 0.0], [0.24, 0.51, 0.02], 0.052, 0.042, c.sleeve],
      ['sph', [0.243, 0.5, 0.024], 0.03, c.joint],
      ['cap', [0.243, 0.5, 0.024], [0.255, 0.39, 0.05], 0.03, 0.025, c.limb],
      ['cap', [0.255, 0.39, 0.05], [0.27, 0.33, 0.08], 0.024, 0.01, c.limb],
      ['cap', [0.255, 0.39, 0.05], [0.235, 0.33, 0.04], 0.02, 0.009, c.limb],
    ] },
    { n: 'legL', parent: 'body', p: [0.08, 0.31, 0.01], mirror: true, s: [
      ['ell', [0.085, 0.27, 0.025], [0.06, 0.075, 0.065], c.thigh, { belly: c.joint, bellyT: 0.6 }],
      ['cap', [0.085, 0.27, 0.02], [0.098, 0.17, 0.03], 0.034, 0.03, c.limb],
      ['sph', [0.098, 0.17, 0.03], 0.033, c.joint],
      ['cap', [0.098, 0.17, 0.03], [0.1, 0.07, 0.0], 0.029, 0.025, c.limb],
      ...feet,
    ] },
  ];
}
// Shared beetle head base (face + window) in the pre-scale frame; LH() maps it.
const BB_FACE = (f) => ['ell', [0, 0.8, 0.05], [0.17, 0.155, 0.145], f, { under: 1 }];
// rotate local (u,v) about z by deg, then offset — for tilted instrument horns
const RZ = (cx, cy, deg) => { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return (u, v) => [cx + u * c - v * s, cy + u * s + v * c]; };

// ---------------------------------------------------------------- McCarapace
// Paul-inspired: violin-bass sunburst shell, left-handed bass-neck horn,
// big doe eyes, neat mop-top, Sgt-Pepper-blue shoulders with gold epaulettes.
const VIOLIN = (() => {
  const r = [[0, 0.74], [0.07, 0.735], [0.12, 0.71], [0.15, 0.665], [0.157, 0.6], [0.142, 0.54], [0.112, 0.495], [0.104, 0.46], [0.118, 0.42], [0.165, 0.37], [0.198, 0.3], [0.196, 0.225], [0.162, 0.165], [0.095, 0.128], [0, 0.118]];
  const l = r.slice(1, -1).reverse().map(([x, y]) => [-x, y]);
  return r.concat(l);
})();
const vio = (k, col, ht = 0.035, extra = {}) => xf([['poly', [0, 0, -0.105], VIOLIN, ht, col, extra]], k, [0, 0.43, -0.105]);
const MC_NECK = (() => {
  const B = [0.055, 0.93], ang = -28, L = 0.2;
  const N = RZ(B[0], B[1], ang);
  const nc = N(0, L / 2), hc = N(0, L + 0.06);
  const out = [
    ['cap', [0.015, 0.86, 0.05], [B[0], B[1], 0.05], 0.05, 0.036, 'S1'],
    ['box', [nc[0], nc[1], 0.045], [0.03, L / 2, 0.022], 'S2', { rot: [0, 0, ang] }],
    ['box', [nc[0], nc[1], 0.07], [0.026, L / 2, 0.006], 'r', { rot: [0, 0, ang] }],
  ];
  for (let i = 0; i < 5; i++) { const q = N(0, 0.03 + i * 0.038 - i * i * 0.0015); out.push(['box', [q[0], q[1], 0.075], [0.028, 0.004, 0.006], 'm', { rot: [0, 0, ang] }]); }
  for (const u of [-0.01, 0.01]) { const a = N(u, 0), b = N(u, L); out.push(['cap', [a[0], a[1], 0.08], [b[0], b[1], 0.08], 0.004, 0.004, 'Z']); }
  out.push(['poly', [hc[0], hc[1], 0.045], [[-0.034, -0.06], [0.034, -0.06], [0.05, 0.02], [0.042, 0.065], [0.02, 0.085], [-0.02, 0.085], [-0.042, 0.065], [-0.05, 0.02]], 0.02, 'S1', { rot: [0, 0, ang] }]);
  out.push(['poly', [hc[0], hc[1], 0.068], [[-0.02, -0.03], [0.02, -0.03], [0.026, 0.04], [0, 0.06], [-0.026, 0.04]], 0.004, 'P', { rot: [0, 0, ang] }]);
  for (const v of [-0.025, 0.025]) for (const sd of [-1, 1]) {
    const a = N(sd * 0.045, v), b = N(sd * 0.085, v), e = N(sd * 0.095, v);
    out.push(['cyl', [a[0], a[1], 0.045], [b[0], b[1], 0.045], 0.009, 'm']);
    out.push(['ell', [e[0], e[1], 0.045], [0.014, 0.014, 0.01], 'P']);
  }
  return { shapes: out, tip: N(0, L + 0.15) };
})();
const MC_HEAD = [
  ['ell', [0, 0.835, 0.03], [0.192, 0.17, 0.168], 'h', { noise: 0.005, noiseScale: 0.05, dither: { col: 'H', amt: 0.18 } }],
  ['ell', [0.165, 0.72, 0.02], [0.05, 0.06, 0.1], 'h', { m: 1, noise: 0.004, noiseScale: 0.04, dither: { col: 'H', amt: 0.18 } }],
  ['ell', [0, 0.73, -0.08], [0.16, 0.09, 0.1], 'h', { noise: 0.004, noiseScale: 0.05, dither: { col: 'H', amt: 0.18 } }],
  ['box', [0, 0.735, 0.2], [0.143, 0.11, 0.16], 'h', { sub: 1 }],
  ...[-0.13, -0.087, -0.044, 0, 0.044, 0.087, 0.13].map((x) => ['box', [x, 0.854, 0.24], [0.01, 0.01, 0.1], 'h', { sub: 1 }]),
  ...[-0.108, -0.065, -0.022, 0.022, 0.065, 0.108].map((x) => ['box', [x, 0.9, 0.22], [0.0075, 0.04, 0.1], 'd', { paint: 1 }]),
  BB_FACE('f'),
  ['ell', [0.112, 0.73, 0.15], [0.03, 0.018, 0.03], 'c', { paint: 1, m: 1 }],
  ...MC_NECK.shapes,
];
const MCH = LH;
const mccarapace = xfDesign({
  id: 'mccarapace', vs: 0.019, arch: 'biped',
  pal: {
    S1: '#3b1a0c', S2: '#7a2e10', S3: '#c45f1a', S4: '#f2a93b', P: '#f3e7c9', m: '#dfe3ea', Z: '#c9ced9', q: '#e6dccb',
    u: '#4f8fe0', U: '#2f63b4', o: '#ffcf4a', v: '#5cc3e6', V: '#2f8bb8', l: '#1f2d4d', L: '#3a5684', r: '#2d1a10',
    f: '#ffe1bd', c: '#ffb0a0', h: '#4a2a18', H: '#653a22', d: '#2c180c',
  },
  anim: { quirk: ['sway', 'happy', 'nod'], bounce: 1, gait: 1 },
  parts: [
    { n: 'body', p: [0, 0.44, 0], s: [
      ...vio(1, 'S1', 0.05, { fat: 0.03 }),
      ['ell', [0, 0.43, -0.16], [0.13, 0.25, 0.05], 'S1'],
      ...xf([['poly', [0, 0, -0.205], VIOLIN, 0.035, 'P', { paint: 1 }]], 1.04, [0, 0.43, -0.205]),
      ...xf([['poly', [0, 0, -0.205], VIOLIN, 0.035, 'S1', { paint: 1 }]], 0.95, [0, 0.43, -0.205]),
      ...vio(0.78, 'S2', 0.2, { paint: 1 }),
      ...vio(0.58, 'S3', 0.2, { paint: 1 }),
      ...vio(0.36, 'S4', 0.2, { paint: 1 }),
      ['ell', [0, 0.63, -0.005], [0.2, 0.095, 0.145], 'u', { belly: 'U', bellyT: 0.6 }],
      ['poly', [0, 0, 0.14], [[-0.12, 0.74], [0.12, 0.74], [0.03, 0.54], [-0.03, 0.54]], 0.07, 'o', { paint: 1 }],
      ['poly', [0, 0, 0.14], [[-0.095, 0.74], [0.095, 0.74], [0.01, 0.55], [-0.01, 0.55]], 0.07, 'o', { sub: 1 }],
      ['ell', [0, 0.47, 0.03], [0.145, 0.19, 0.12], 'v', { under: 1, stripes: { axis: 'y', p: 0.045, w: 0.015, col: 'V' } }],
      ['ell', [0.165, 0.685, -0.01], [0.06, 0.022, 0.07], 'o', { m: 1 }],
      ...[-0.04, -0.013, 0.013, 0.04].map((z) => ['cap', [0.215, 0.675, z], [0.222, 0.645, z], 0.008, 0.006, 'o', { m: 1 }]),
      ['box', [0, 0.575, -0.225], [0.05, 0.016, 0.018], 'm'],
      ['box', [0, 0.515, -0.225], [0.05, 0.016, 0.018], 'm'],
      ['box', [0, 0.32, -0.225], [0.055, 0.01, 0.018], 'S1'],
      ['box', [0, 0.2, -0.215], [0.045, 0.02, 0.016], 'm'],
      ['ell', [0.105, 0.3, -0.21], [0.05, 0.035, 0.012], 'q', { rot: [0, 0, -25] }],
      ...[[0.09, 0.31], [0.12, 0.29]].map(([x, y]) => ['cyl', [x, y, -0.21], [x, y, -0.235], 0.01, 'S1']),
      ...[-0.0621, -0.0207, 0.0207, 0.0621].map((x) => ['box', [x, 0.46, -0.225], [0.008, 0.25, 0.012], 'Z']),
      ['ell', [0.09, 0.6, -0.2], [0.022, 0.05, 0.03], '#fff6e0', { paint: 1, m: 1, jit: 0 }],
    ] },
    { n: 'head', parent: 'body', p: [0, 0.7, 0.02], s: xf(MC_HEAD, 1.15, [0, 0.66, 0.02], [0, 0.04, 0]) },
    ...bbLimbs({ sleeve: 'u', limb: 'l', joint: 'L', thigh: 'u', feet: 'bare', shoe: 'l', sole: 'l' }),
  ],
  eyes: { part: 'head', at: MCH([0.07, 0.785, 0.19]), dir: [0.25, 0, 1], style: 'big', iris: '#2b7fd4', px: 0.85 },
  mouth: { part: 'head', at: MCH([0, 0.708, 0.18]), dir: [0, -0.35, 1], style: 'smile', px: 0.85, lift: 0.014 },
  fx: [
    { part: 'head', at: MCH([MC_NECK.tip[0], MC_NECK.tip[1], 0.05]), type: 'note', rate: 1.1 },
    { part: 'head', at: MCH([MC_NECK.tip[0], MC_NECK.tip[1] - 0.05, 0.05]), type: 'bubble', rate: 0.8, scale: 0.8 },
  ],
}, 0.92);

// ---------------------------------------------------------------- Harrisun
// George-inspired: sitar-neck horn with a tumba gourd, spinning sun halo,
// saffron robe-patterned gourd shell, moustache.
const HS_NECK = (() => {
  const B = [-0.03, 0.96], ang = 14, L = 0.2;
  const N = RZ(B[0], B[1], ang);
  const nc = N(0, L / 2 + 0.05);
  const out = [
    ['ell', [B[0], B[1], 0.07], [0.085, 0.075, 0.07], 'G', { stripes: { axis: 'x', p: 0.034, w: 0.01, col: 'w' } }],
    ['ell', [B[0], B[1] - 0.005, 0.07], [0.087, 0.022, 0.072], 'P', { paint: 1, stripes: { axis: 'x', p: 0.03, w: 0.012, col: 'o' } }],
    ['box', [nc[0], nc[1], 0.06], [0.024, L / 2, 0.02], 'w', { rot: [0, 0, ang] }],
    ['box', [nc[0], nc[1], 0.082], [0.02, L / 2, 0.004], 'P', { rot: [0, 0, ang] }],
  ];
  for (let i = 0; i < 5; i++) { const q = N(0, 0.1 + i * 0.03); out.push(['box', [q[0], q[1], 0.088], [0.026, 0.004, 0.006], 'm', { rot: [0, 0, ang] }]); }
  const t = N(0, L + 0.02);
  out.push(['sph', [t[0], t[1], 0.02], 0.045, 'G', { stripes: { axis: 'x', p: 0.03, w: 0.008, col: 'w' } }]);
  const f0 = N(0, L + 0.04), f1 = N(0, L + 0.1);
  out.push(['cap', [f0[0], f0[1], 0.06], [f1[0], f1[1], 0.06], 0.022, 0.014, 'w']);
  const f = N(0, L + 0.115);
  out.push(['sph', [f[0], f[1], 0.06], 0.02, 'o']);
  for (const v of [0.12, 0.17, 0.22]) { const a2 = N(-0.02, v), b2 = N(-0.06, v); out.push(['cyl', [a2[0], a2[1], 0.06], [b2[0], b2[1], 0.06], 0.008, 'w']); out.push(['sph', [b2[0], b2[1], 0.06], 0.013, 'o']); }
  return { shapes: out, tip: f };
})();
const HS_HEAD = [
  ['ell', [0, 0.83, 0.02], [0.192, 0.172, 0.168], 'h', { noise: 0.006, noiseScale: 0.045, dither: { col: 'H', amt: 0.18 } }],
  ['cap', [0.155, 0.8, 0.0], [0.17, 0.63, -0.03], 0.062, 0.05, 'h', { m: 1, noise: 0.006, noiseScale: 0.045, dither: { col: 'H', amt: 0.18 } }],
  ['ell', [0, 0.72, -0.07], [0.16, 0.12, 0.1], 'h', { noise: 0.006, noiseScale: 0.045, dither: { col: 'H', amt: 0.18 } }],
  ['box', [0, 0.77, 0.2], [0.143, 0.135, 0.16], 'h', { sub: 1 }],
  BB_FACE('f'),
  ['box', [0, 0.96, 0.1], [0.008, 0.05, 0.12], 'd', { paint: 1 }],
  ['ell', [0.112, 0.73, 0.15], [0.03, 0.018, 0.03], 'c', { paint: 1, m: 1 }],
  ...HS_NECK.shapes,
];
const HALO_C = [0, 0.84, -0.2];
const HALO = [
  ['tor', HALO_C, 0.19, 0.018, 'Y', { axis: 'z', glow: 1 }],
  ['tor', HALO_C, 0.15, 0.009, 'O', { axis: 'z', glow: 2 }],
  ...Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, r0 = 0.21, r1 = i % 2 ? 0.25 : 0.28; return ['cap', [HALO_C[0] + Math.cos(a) * r0, HALO_C[1] + Math.sin(a) * r0, HALO_C[2]], [HALO_C[0] + Math.cos(a) * r1, HALO_C[1] + Math.sin(a) * r1, HALO_C[2]], 0.02, 0.006, i % 2 ? 'O' : 'Y', { glow: 1 }]; }),
];
const harrisun = xfDesign({
  id: 'harrisun', vs: 0.019, arch: 'biped',
  pal: {
    s: '#f5841a', S: '#ffb84a', t: '#c9520f', R: '#8c1d33', o: '#ffd34a', Y: '#ffd04a', O: '#ff8a1e',
    v: '#b8323f', V: '#8c1d33', w: '#8a4a1e', G: '#c9782c', P: '#3a2212', m: '#e8ecf2',
    l: '#3a1d14', L: '#5e3424', f: '#ffdcb4', c: '#ffa890', h: '#2e1a12', H: '#4a2c1c', d: '#1c0f0a',
  },
  anim: { quirk: ['sway', 'nod', 'stretch'], bounce: 0.8, gait: 0.85 },
  parts: [
    { n: 'body', p: [0, 0.44, 0], s: [
      ['ell', [0, 0.42, -0.11], [0.215, 0.25, 0.17], 's', { stripes: { axis: 'x', p: 0.06, w: 0.012, col: 't' }, spots: { col: 'R', d: 0.14, s: 0.035, seed: 3 } }],
      ['ell', [0, 0.42, -0.11], [0.215, 0.25, 0.17], 'o', { paint: 1, stripes: { axis: 'y', p: 1, w: 0.024, col: 'o', o: 0.2 }, grad: { axis: 'y', to: 's', a: 0.2, b: 0.2 } }],
      ['ell', [0, 0.42, -0.11], [0.216, 0.03, 0.171], 'o', { paint: 1 }],
      ['ell', [0, 0.25, -0.11], [0.17, 0.05, 0.14], 'R', { paint: 1 }],
      ['ell', [0, 0.63, -0.005], [0.2, 0.095, 0.145], 's', { belly: 't', bellyT: 0.6 }],
      ['poly', [0, 0, 0.14], [[-0.12, 0.74], [0.12, 0.74], [0.03, 0.54], [-0.03, 0.54]], 0.07, 'o', { paint: 1 }],
      ['poly', [0, 0, 0.14], [[-0.095, 0.74], [0.095, 0.74], [0.01, 0.55], [-0.01, 0.55]], 0.07, 'o', { sub: 1 }],
      ['ell', [0, 0.47, 0.03], [0.145, 0.19, 0.12], 'v', { under: 1, stripes: { axis: 'y', p: 0.045, w: 0.015, col: 'V' } }],
      ['ell', [0.12, 0.55, -0.2], [0.03, 0.06, 0.03], '#fff2c8', { paint: 1, m: 1, jit: 0 }],
    ] },
    { n: 'head', parent: 'body', p: [0, 0.7, 0.02], s: xf(HS_HEAD, 1.15, [0, 0.66, 0.02], [0, 0.04, 0]) },
    { n: 'halo', parent: 'head', p: LH(HALO_C), s: xf(HALO, 1.15, [0, 0.66, 0.02], [0, 0.04, 0]), spin: { axis: 'z', speed: 0.6 } },
    ...bbLimbs({ sleeve: 's', limb: 'l', joint: 'L', thigh: 's', feet: 'sandal', shoe: 'R', sole: 'w' }),
  ],
  eyes: { part: 'head', at: LH([0.07, 0.79, 0.19]), dir: [0.25, 0, 1], style: 'anime', iris: '#d07a1a', px: 0.9 },
  mouth: { part: 'head', at: LH([0, 0.7, 0.18]), dir: [0, -0.35, 1], style: 'smile', px: 0.8, lift: 0.014 },
  decals: [{ part: 'head', at: LH([0, 0.735, 0.19]), dir: [0, -0.2, 1], rows: ['.kkk.kkk.', 'kkkkkkkkk', 'kk.....kk'], cmap: { k: '#2a170e' }, px: 0.6, lift: 0.016 }],
  fx: [
    { part: 'head', at: LH([HS_NECK.tip[0], HS_NECK.tip[1] + 0.03, 0.05]), type: 'note', rate: 1 },
    { part: 'halo', at: LH([0.2, 0.84, -0.2]), type: 'ember', rate: 0.6 },
    { part: 'halo', at: LH([-0.2, 0.84, -0.2]), type: 'ember', rate: 0.6 },
  ],
}, 0.92);

// ---------------------------------------------------------------- Starrab
// Ringo-inspired scarab: a bass-drum body (black oyster pearl wrap, chrome
// hoops, star logo), crash-cymbal elytra, drumstick antennae, rings on every leg.
const STAR9 = ['....k....', '....k....', '...kkk...', 'kkkkkkkkk', '.kkkkkkk.', '..kkkkk..', '..kk.kk..', '.kk...kk.', 'k.......k'];
const STAR5 = ['..k..', '.kkk.', 'kkkkk', '.kkk.', '.k.k.'];
const DRUM_Y = 0.42, DRUM_R = 0.27;
function srLeg(n, hip, knee, foot) {
  return { n, parent: 'body', p: hip, mirror: true, s: [
    ['cap', hip, knee, 0.042, 0.034, 'l', { dither: { col: 'L', amt: 0.2 } }],
    ['sph', knee, 0.038, 'L'],
    ['cap', knee, foot, 0.032, 0.02, 'l', { dither: { col: 'L', amt: 0.2 } }],
    ['tor', [knee[0] + (foot[0] - knee[0]) * 0.55, knee[1] + (foot[1] - knee[1]) * 0.55, knee[2] + (foot[2] - knee[2]) * 0.55], 0.032, 0.012, 'o'],
    ['tor', [knee[0] + (foot[0] - knee[0]) * 0.75, knee[1] + (foot[1] - knee[1]) * 0.75, knee[2] + (foot[2] - knee[2]) * 0.75], 0.027, 0.011, 'R'],
    ['cap', foot, [foot[0] + 0.035, 0.012, foot[2] + 0.03], 0.016, 0.008, 'k'],
    ['cap', foot, [foot[0] - 0.01, 0.012, foot[2] + 0.045], 0.016, 0.008, 'k'],
  ] };
}
const starrab = {
  id: 'starrab', vs: 0.025, arch: 'insect',
  pal: {
    p: '#2b2a35', q: '#6f6c80', Q: '#c4c2d4', m: '#dfe4ec', M: '#9aa3b2', w: '#f4f0e4', W: '#d9d2c0',
    g: '#f2b934', G: '#c98a1c', Y: '#ffe07a', l: '#b8683c', L: '#8c4a28', k: '#3a2216', o: '#ffd34a', R: '#e05a8a',
    f: '#f6d9b0', F: '#e9b98a', c: '#ff9c8c', h: '#4a2c1a', H: '#62402a', d: '#2c180c', b: '#7a5530', t: '#f0d29a', T: '#8a5a32', r: '#d8263c',
  },
  anim: { quirk: ['headbang', 'happy', 'sway'], bounce: 1.1, gait: 1.1 },
  parts: [
    { n: 'body', p: [0, DRUM_Y, 0], s: [
      ['cyl', [0, DRUM_Y, -0.2], [0, DRUM_Y, 0.2], DRUM_R, 'p', { dither: { col: 'q', amt: 0.3 }, spots: { col: 'Q', d: 0.18, s: 0.05, seed: 7 } }],
      ['cyl', [0, DRUM_Y, -0.22], [0, DRUM_Y, -0.19], DRUM_R - 0.025, 'w', { jit: 0.02 }],
      ['tor', [0, DRUM_Y, -0.2], DRUM_R, 0.028, 'm', { axis: 'z' }],
      ['tor', [0, DRUM_Y, 0.2], DRUM_R, 0.028, 'm', { axis: 'z' }],
      ...Array.from({ length: 8 }, (_, i) => { const a = (i + 0.5) * Math.PI / 4; return ['box', [Math.cos(a) * (DRUM_R + 0.012), DRUM_Y + Math.sin(a) * (DRUM_R + 0.012), 0], [0.02, 0.02, 0.06], 'M', { rot: [0, 0, a * 180 / Math.PI], round: 0.008 }]; }),
      ['ell', [0, 0.63, 0.17], [0.215, 0.12, 0.13], 'b', { belly: 'T', bellyT: 0.5 }],
      ['ell', [0.07, 0.72, 0.2], [0.035, 0.025, 0.05], 't', { paint: 1, m: 1, jit: 0 }],
      ['cyl', [0, DRUM_Y, 0.18], [0, DRUM_Y, 0.215], DRUM_R - 0.025, 'w', { jit: 0.02 }],
      ['ell', [0.12, DRUM_Y + 0.2, -0.05], [0.04, 0.03, 0.12], '#ffffff', { paint: 1, m: 1, jit: 0 }],
    ] },
    { n: 'wingL', parent: 'body', p: [0.03, 0.71, -0.02], mirror: true, s: [
      ['ell', [0.18, 0.745, -0.07], [0.24, 0.022, 0.25], 'g', { rot: [0, 0, -22] }],
      ['ell', [0.18, 0.772, -0.07], [0.055, 0.03, 0.055], 'G', { rot: [0, 0, -22] }],
      ['tor', [0.18, 0.755, -0.07], 0.11, 0.012, 'G', { rot: [0, 0, -22], paint: 1 }],
      ['tor', [0.18, 0.755, -0.07], 0.18, 0.012, 'G', { rot: [0, 0, -22], paint: 1 }],
      ['ell', [0.22, 0.745, 0.0], [0.05, 0.04, 0.06], 'Y', { paint: 1, jit: 0 }],
      ['cyl', [0.18, 0.74, -0.07], [0.18, 0.8, -0.07], 0.012, 'm'],
    ] },
    { n: 'head', parent: 'body', p: [0, 0.45, 0.22], s: [
      ['ell', [0, 0.5, 0.33], [0.2, 0.18, 0.15], 'b', { noise: 0.004, noiseScale: 0.05 }],
      ['ell', [0, 0.58, 0.32], [0.215, 0.12, 0.16], 'h', { noise: 0.006, noiseScale: 0.04, dither: { col: 'H', amt: 0.2 } }],
      ['box', [0, 0.47, 0.5], [0.15, 0.1, 0.16], 'h', { sub: 1 }],
      ...[-0.12, -0.075, -0.025, 0.025, 0.075, 0.12].map((x) => ['box', [x, 0.575, 0.52], [0.012, 0.012, 0.1], 'h', { sub: 1 }]),
      ['ell', [0, 0.47, 0.35], [0.17, 0.15, 0.13], 'f', { under: 1 }],
      ['cap', [0.1, 0.36, 0.42], [0.05, 0.33, 0.5], 0.03, 0.012, 'b', { m: 1 }],
      ['sph', [0, 0.455, 0.48], 0.036, 'F'],
      ['ell', [0.11, 0.43, 0.43], [0.03, 0.018, 0.03], 'c', { paint: 1, m: 1 }],
    ] },
    { n: 'antL', parent: 'head', p: [0.07, 0.64, 0.33], mirror: true, s: [
      ['cap', [0.07, 0.62, 0.33], [0.2, 0.98, 0.3], 0.017, 0.012, 't', { tip: 'W', tipT: 0.85 }],
      ['ell', [0.205, 0.995, 0.3], [0.02, 0.028, 0.02], 'W'],
      ['tor', [0.09, 0.67, 0.33], 0.022, 0.009, 'k', { rot: [0, 0, -20] }],
    ] },
    srLeg('legFL', [0.15, 0.27, 0.12], [0.31, 0.3, 0.22], [0.37, 0.03, 0.27]),
    srLeg('legML', [0.18, 0.25, 0.0], [0.36, 0.28, 0.02], [0.43, 0.03, 0.03]),
    srLeg('legBL', [0.15, 0.27, -0.12], [0.31, 0.3, -0.22], [0.37, 0.03, -0.29]),
  ],
  eyes: { part: 'head', at: [0.075, 0.49, 0.47], dir: [0.3, 0, 1], style: 'anime', iris: '#3a86d0', px: 0.95 },
  mouth: { part: 'head', at: [0, 0.395, 0.47], dir: [0, -0.3, 1], style: 'grin', px: 0.85, lift: 0.014 },
  decals: [
    { part: 'body', at: [0, DRUM_Y, -0.22], dir: [0, 0, -1], rows: STAR9, cmap: { k: 'r' }, px: 1.2 },
    { part: 'body', at: [DRUM_R, DRUM_Y + 0.02, 0.0], dir: [1, 0.15, 0], rows: STAR5, cmap: { k: 'o' }, px: 1, mirror: true },
    { part: 'head', at: [0.135, 0.44, 0.4], dir: [0.7, 0, 1], rows: ['.k.', 'kkk', '.k.'], cmap: { k: 'o' }, px: 0.7, mirror: true },
  ],
  fx: [
    { part: 'wingL', at: [0.22, 0.8, -0.07], type: 'note', rate: 0.6, mirror: true },
    { part: 'body', at: [0, 0.8, -0.1], type: 'star', rate: 0.5 },
  ],
};

// ---------------------------------------------------------------- Pebblips
// A rolling stone that gathers no moss: river pebble, big red lips, long tongue,
// with a purple crystal crack hinting at the geode inside.
const pebblips = xfDesign({
  id: 'pebblips', vs: 0.015, arch: 'blob',
  pal: {
    g: '#9aa4ab', G: '#77818a', q: '#c3cbd1', Q: '#d3dade', S: '#87919a',
    r: '#e0263c', R: '#a8122a', T: '#ff5d78', U: '#c8264a', w: '#ffffff', v: '#b46cff', k: '#4a4038',
  },
  anim: { quirk: ['spin', 'hop', 'happy'], bounce: 1.4 },
  parts: [
    { n: 'body', p: [0, 0.2, 0], s: [
      ['ell', [0, 0.205, 0], [0.225, 0.18, 0.205], 'g', { noise: 0.003, noiseScale: 0.09, dither: { col: 'G', amt: 0.06 }, top: 'Q', topT: 0.72, belly: 'G', bellyT: 0.5, stripes: { axis: 'y', p: 0.13, w: 0.014, col: 'S', o: 0.05 } }],
      ['ell', [-0.07, 0.3, 0.1], [0.05, 0.04, 0.05], 'q', { paint: 1, jit: 0.02 }],
      ['box', [0.03, 0.38, -0.07], [0.009, 0.012, 0.05], 'v', { paint: 1, glow: 2, rot: [0, 30, 0] }],
      ['box', [-0.02, 0.37, -0.11], [0.009, 0.012, 0.04], 'v', { paint: 1, glow: 2, rot: [0, -40, 0] }],
      ['box', [0.07, 0.375, -0.03], [0.009, 0.012, 0.03], 'v', { paint: 1, glow: 2, rot: [0, -50, 0] }],
      ['ell', [0, 0.15, 0.178], [0.088, 0.045, 0.05], 'r', { jit: 0.03 }],
      ['ell', [-0.03, 0.178, 0.215], [0.02, 0.008, 0.01], 'w', { paint: 1, jit: 0 }],
      
    ] },
    { n: 'jaw', parent: 'body', p: [0, 0.13, 0.2], sway: { axis: 'z', amp: 0.18, freq: 1.4 }, s: [
      ['ell', [0, 0.085, 0.235], [0.042, 0.055, 0.022], 'T', { rot: [-30, 0, 0] }],
      ['ell', [0, 0.05, 0.255], [0.045, 0.03, 0.022], 'T', { rot: [-30, 0, 0] }],
      ['box', [0, 0.08, 0.255], [0.006, 0.045, 0.012], 'U', { paint: 1, rot: [-30, 0, 0] }],
    ] },
    { n: 'legL', parent: 'body', p: [0.09, 0.06, 0.0], mirror: true, s: [
      ['ell', [0.095, 0.025, 0.03], [0.055, 0.028, 0.065], 'G', { dither: { col: 'k', amt: 0.15 }, top: 'S', topT: 0.6 }],
    ] },
  ],
  eyes: { part: 'body', at: [0.08, 0.26, 0.18], dir: [0.35, 0.1, 1], style: 'big', iris: '#3b2a4a', px: 0.95 },
  mouth: { part: 'body', at: [0, 0.152, 0.22], dir: [0, -0.05, 1], style: 'lips', px: 1.45, lift: 0.012 },
  fx: [{ part: 'body', at: [0, 0.4, -0.08], type: 'gem', rate: 0.4, scale: 0.6 }],
}, 1.15);

// ---------------------------------------------------------------- Jaggeode
// Swaggering geode rock-star: split-open amethyst chest, crystal mic-stand
// spikes, big lips + tongue, a long scarf and strutting skinny legs.
const JG_SEAM = [[-0.4, 0.99], [-0.3, 1.03], [-0.2, 0.97], [-0.1, 1.04], [0, 0.98], [0.1, 1.04], [0.2, 0.97], [0.3, 1.03], [0.4, 0.99]];
const jaggeode = xfDesign({
  id: 'jaggeode', vs: 0.026, arch: 'biped',
  pal: {
    g: '#8a8580', G: '#625d59', q: '#a7a29c', Q: '#efe6ff', v: '#9b4dff', V: '#d6a8ff', P: '#5a1fa8',
    r: '#e0263c', R: '#a8122a', T: '#ff5d78', U: '#c8264a', w: '#ffffff',
    s: '#e83a4a', S: '#ffd34a', k: '#1c1824', K: '#3b3550', b: '#f2efe8', f: '#d9d0ca', F: '#c2b7b0',
  },
  anim: { quirk: ['sway', 'flex', 'headbang'], bounce: 1, gait: 0.9, stride: 1.25 },
  parts: [
    { n: 'body', p: [0, 0.75, 0], s: [
      ['ell', [0, 0.8, -0.01], [0.31, 0.31, 0.26], 'g', { noise: 0.018, noiseScale: 0.11, dither: { col: 'G', amt: 0.1 }, spots: { col: 'q', d: 0.14, s: 0.07 }, belly: 'G', bellyT: 0.5 }],
      ['poly', [0, 0, 0], JG_SEAM.concat([[0.4, 1.4], [-0.4, 1.4]]), 0.5, 'g', { sub: 1 }],
      ['poly', [0, 0, 0.2], [[-0.18, 0.95], [-0.08, 0.98], [0, 0.93], [0.08, 0.98], [0.18, 0.95], [0.16, 0.8], [0.19, 0.7], [0.09, 0.62], [0, 0.57], [-0.09, 0.62], [-0.19, 0.7], [-0.16, 0.8]], 0.15, 'Q', { paint: 1 }],
      ['poly', [0, 0, 0.2], [[-0.15, 0.93], [-0.08, 0.95], [0, 0.91], [0.08, 0.95], [0.15, 0.93], [0.13, 0.8], [0.16, 0.71], [0.08, 0.64], [0, 0.6], [-0.08, 0.64], [-0.16, 0.71], [-0.13, 0.8]], 0.15, 'Q', { sub: 1 }],
      ['ell', [0, 0.78, 0.0], [0.24, 0.24, 0.17], 'P', { under: 1 }],
      ...[[0, 0.78, 0.12, 0.26, 0.05], [-0.08, 0.85, 0.12, 0.23, 0.04], [0.08, 0.86, 0.12, 0.24, 0.04], [-0.07, 0.69, 0.12, 0.23, 0.04], [0.08, 0.7, 0.12, 0.22, 0.035], [0, 0.88, 0.12, 0.22, 0.035], [0.12, 0.79, 0.11, 0.2, 0.03], [-0.12, 0.79, 0.11, 0.2, 0.03]].map(([x, y, z0, z1, r], i) => ['cap', [x * 0.8, y, z0], [x, y + (i % 2 ? 0.02 : -0.02), z1], r, 0.008, i % 3 ? 'v' : 'V', { glow: 1 }]),
      ...JG_SEAM.slice(1, -1).flatMap(([x, y], i) => [0.14, -0.14].map((z) => ['cap', [x * 0.8, y - 0.06, z * 0.6], [x * 1.0, y + 0.04, z], 0.05, 0.012, i % 2 ? 'v' : 'P', { glow: 1 }])),
      ['ell', [0, 0.52, 0.0], [0.17, 0.07, 0.13], 'k'],
      ['box', [0, 0.52, 0.0], [0.18, 0.025, 0.14], 'S', { paint: 1 }],
    ] },
    { n: 'head', parent: 'body', p: [0, 1.0, 0.0], s: [
      ['ell', [0, 1.1, 0.0], [0.3, 0.26, 0.26], 'g', { noise: 0.016, noiseScale: 0.11, dither: { col: 'G', amt: 0.1 }, spots: { col: 'q', d: 0.14, s: 0.07 }, top: 'q', topT: 0.7 }],
      ['poly', [0, 0, 0], JG_SEAM.concat([[0.4, 0.6], [-0.4, 0.6]]), 0.5, 'g', { sub: 1 }],
      ['ell', [0, 1.12, 0.12], [0.215, 0.13, 0.14], 'f', { jit: 0.04 }],
      ['ell', [0, 1.12, 0.12], [0.215, 0.13, 0.14], 'F', { paint: 1, belly: 'F', bellyT: 0.6, top: 'f', topT: 2 }],
      ['ell', [0, 1.045, 0.215], [0.11, 0.045, 0.05], 'r', { jit: 0.03 }],
      ['ell', [-0.04, 1.075, 0.26], [0.03, 0.01, 0.01], 'w', { paint: 1, jit: 0 }],
      ...[[0, 0.2], [0.11, 0.12], [-0.12, 0.1]].map(([x, h], i) => ['cap', [x, 1.3, -0.06], [x * 1.3, 1.3 + h + 0.1, -0.12], 0.026, 0.016, 'V', { glow: 1 }]),
      ...[[0, 0.2], [0.11, 0.12], [-0.12, 0.1]].map(([x, h]) => ['sph', [x * 1.3, 1.3 + h + 0.12, -0.12], 0.045, 'Q', { glow: 1 }]),
    ] },
    { n: 'jaw', parent: 'head', p: [0, 1.02, 0.22], s: [
      ['ell', [0, 0.965, 0.28], [0.06, 0.08, 0.03], 'T', { rot: [-25, 0, 0] }],
      ['box', [0, 0.965, 0.29], [0.008, 0.06, 0.02], 'U', { paint: 1, rot: [-25, 0, 0] }],
    ] },
    { n: 'tail', parent: 'body', p: [0.0, 0.98, -0.2], s: [
      ['tor', [0, 0.97, -0.02], 0.27, 0.048, 's', { stripes: { axis: 'x', p: 0.1, w: 0.04, col: 'S' } }],
      ['box', [0, 0.97, 0.28], [0.4, 0.2, 0.25], 's', { sub: 1 }],
      ['cap', [0.22, 0.98, 0.04], [0.23, 0.62, 0.21], 0.05, 0.042, 's', { stripes: { axis: 'y', p: 0.1, w: 0.04, col: 'S' } }],
      ['cap', [-0.22, 0.98, 0.04], [-0.23, 0.74, 0.19], 0.05, 0.044, 's', { stripes: { axis: 'y', p: 0.1, w: 0.04, col: 'S' } }],
      ...[[0.23, 0.6, 0.215], [-0.23, 0.72, 0.195]].flatMap(([x, y, z]) => [-0.03, 0, 0.03].map((dx) => ['cap', [x + dx * 0.6, y, z], [x + dx, y - 0.07, z + 0.01], 0.012, 0.01, 'S'])),
    ], sway: { axis: 'x', amp: 0.05, freq: 1.2 } },
    { n: 'armL', parent: 'body', p: [0.29, 0.92, 0.0], mirror: true, s: [
      ['sph', [0.29, 0.92, 0.0], 0.06, 'G'],
      ['cap', [0.29, 0.92, 0.0], [0.36, 0.72, 0.02], 0.04, 0.034, 'G', { dither: { col: 'g', amt: 0.3 } }],
      ['cap', [0.36, 0.72, 0.02], [0.38, 0.54, 0.06], 0.034, 0.03, 'G', { dither: { col: 'g', amt: 0.3 } }],
      ['tor', [0.378, 0.58, 0.055], 0.04, 0.014, 'v', { glow: 1 }],
      ['ell', [0.385, 0.5, 0.07], [0.055, 0.06, 0.05], 'g', { noise: 0.01, noiseScale: 0.05 }],
    ] },
    { n: 'legL', parent: 'body', p: [0.1, 0.52, 0.0], mirror: true, s: [
      ['cap', [0.1, 0.52, 0.0], [0.115, 0.28, 0.02], 0.045, 0.036, 'k', { stripes: { axis: 'x', p: 0.06, w: 0.02, col: 'K' } }],
      ['cap', [0.115, 0.28, 0.02], [0.12, 0.07, 0.0], 0.036, 0.03, 'k', { stripes: { axis: 'x', p: 0.06, w: 0.02, col: 'K' } }],
      ['ell', [0.12, 0.045, 0.05], [0.05, 0.045, 0.1], 'b', { belly: 'k', bellyT: 0.5 }],
      ['cap', [0.12, 0.03, 0.1], [0.125, 0.03, 0.18], 0.03, 0.01, 'b'],
    ] },
  ],
  eyes: { part: 'head', at: [0.085, 1.14, 0.26], dir: [0.3, 0.05, 1], style: 'sharp', iris: '#a050ff', px: 1.0 },
  mouth: { part: 'head', at: [0, 1.045, 0.26], dir: [0, -0.1, 1], style: 'lips', px: 1.25, lift: 0.014 },
  fx: [
    { part: 'body', at: [0, 0.8, 0.22], type: 'gem', rate: 0.7, color: '#c890ff' },
    { part: 'head', at: [0, 1.62, -0.12], type: 'gem', rate: 0.6, color: '#e0c0ff' },
  ],
}, 0.92);

// ---------------------------------------------------------------- Zapanda
// Mika's partner: red panda with lightning-bolt tail rings, glowing battery
// cheek pouches and little brass goggles.
// zigzag band across a tail segment (zy plane), painted onto the tail voxels
function boltBand(A, B, t, col, len = 0.26, w = 0.022, amp = 0.016) {
  // A,B: segment endpoints [x,y,z]; band sits at fraction t, across the segment (zy plane)
  const dz = B[2] - A[2], dy = B[1] - A[1], L = Math.hypot(dz, dy) || 1;
  const tz = dz / L, ty = dy / L, nz = -ty, ny = tz; // along-tail (t) and across (n) in (z,y)
  const cz = A[2] + dz * t, cy = A[1] + dy * t;
  const pts = [], n = 6;
  for (let i = 0; i <= n; i++) { const u = -len / 2 + (len * i) / n, v = w + (i % 2 ? amp : -amp); pts.push([u * nz + v * tz, u * ny + v * ty]); }
  for (let i = n; i >= 0; i--) { const u = -len / 2 + (len * i) / n, v = -w + (i % 2 ? amp : -amp); pts.push([u * nz + v * tz, u * ny + v * ty]); }
  return ['poly', [0, cy, cz], pts, 0.2, col, { plane: 'zy', paint: 1 }];
}
const zapanda = {
  id: 'zapanda', vs: 0.02, arch: 'quad',
  pal: {
    b: '#d4542a', B: '#e8743c', d: '#a83a1c', w: '#fff6ea', k: '#2a1712', K: '#45281e', p: '#ff9aa0',
    Y: '#e8ff3a', y: '#ffd83a', m: '#d9dee6', o: '#d9a33a', n: '#5a3420', L: '#8fd8f0', z: '#1c1418',
  },
  anim: { quirk: ['scratch', 'hop', 'sniff'], bounce: 1.25, tail: 1.3 },
  parts: [
    { n: 'body', p: [0, 0.28, 0], s: [
      ['ell', [0, 0.29, -0.03], [0.15, 0.14, 0.21], 'b', { belly: 'k', bellyT: 0.35, dither: { col: 'B', amt: 0.12 } }],
      ['ell', [0, 0.37, 0.03], [0.1, 0.06, 0.12], 'B', { paint: 1 }],
    ] },
    { n: 'head', parent: 'body', p: [0, 0.38, 0.16], s: [
      ['ell', [0, 0.5, 0.21], [0.2, 0.165, 0.165], 'b', { dither: { col: 'B', amt: 0.12 } }],
      ['ell', [0.15, 0.43, 0.25], [0.075, 0.07, 0.09], 'w', { m: 1 }],
      ['ell', [0, 0.44, 0.34], [0.085, 0.065, 0.07], 'w'],
      ['ell', [0.07, 0.585, 0.33], [0.025, 0.015, 0.02], 'w', { paint: 1, m: 1 }],
      ['ell', [0.11, 0.47, 0.33], [0.012, 0.05, 0.03], 'd', { paint: 1, m: 1, rot: [0, 0, 20] }],
      ['sph', [0, 0.475, 0.405], 0.024, 'z'],
      ...[[0.15, 0.4, 0.31], [-0.15, 0.4, 0.31]].flatMap(([x, y, z]) => [
        ['cyl', [x, y, z], [x, y + 0.065, z], 0.03, 'Y', { glow: 2 }],
        ['cyl', [x, y + 0.062, z], [x, y + 0.078, z], 0.016, 'm'],
        ['cyl', [x, y - 0.006, z], [x, y + 0.008, z], 0.031, 'z'],
      ]),
      ['tor', [0, 0.6, 0.2], 0.178, 0.014, 'n', { rot: [-18, 0, 0] }],
      ['tor', [0.066, 0.635, 0.325], 0.04, 0.014, 'o', { m: 1, axis: 'z', rot: [-40, 0, 0] }],
      ['cyl', [0.066, 0.632, 0.312], [0.066, 0.646, 0.33], 0.032, 'L', { m: 1, rot: [-40, 0, 0] }],
      ['ell', [0.056, 0.648, 0.334], [0.01, 0.01, 0.006], '#ffffff', { m: 1, paint: 1, jit: 0 }],
      ['cap', [0.024, 0.638, 0.338], [-0.024, 0.638, 0.338], 0.01, 0.01, 'o'],
    ] },
    { n: 'earL', parent: 'head', p: [0.12, 0.6, 0.18], mirror: true, s: [
      ['ell', [0.145, 0.655, 0.18], [0.065, 0.07, 0.035], 'w', { rot: [0, 0, -20] }],
      ['ell', [0.145, 0.65, 0.2], [0.045, 0.05, 0.02], 'K', { rot: [0, 0, -20] }],
    ] },
    { n: 'legFL', parent: 'body', p: [0.09, 0.24, 0.12], mirror: true, s: [
      ['cap', [0.09, 0.24, 0.12], [0.1, 0.05, 0.15], 0.05, 0.042, 'k'],
      ['ell', [0.1, 0.03, 0.17], [0.05, 0.03, 0.06], 'k', { top: 'K', topT: 0.6 }],
    ] },
    { n: 'legBL', parent: 'body', p: [0.09, 0.24, -0.16], mirror: true, s: [
      ['cap', [0.09, 0.24, -0.16], [0.1, 0.05, -0.15], 0.055, 0.044, 'k'],
      ['ell', [0.1, 0.03, -0.12], [0.05, 0.03, 0.065], 'k', { top: 'K', topT: 0.6 }],
    ] },
    { n: 'tail', parent: 'body', p: [0, 0.32, -0.21], s: [
      ['cap', [0, 0.32, -0.21], [0, 0.38, -0.36], 0.075, 0.09, 'z', { dither: { col: 'K', amt: 0.1 } }],
      boltBand([0, 0.32, -0.21], [0, 0.38, -0.36], 0.6, 'y'),
    ] },
    { n: 'tail2', parent: 'tail', p: [0, 0.38, -0.36], s: [
      ['cap', [0, 0.38, -0.36], [0, 0.54, -0.45], 0.09, 0.09, 'z', { dither: { col: 'K', amt: 0.1 } }],
      boltBand([0, 0.38, -0.36], [0, 0.54, -0.45], 0.55, 'y'),
    ] },
    { n: 'tail3', parent: 'tail2', p: [0, 0.54, -0.45], s: [
      ['cap', [0, 0.54, -0.45], [0, 0.7, -0.42], 0.09, 0.07, 'z', { dither: { col: 'K', amt: 0.1 } }],
      boltBand([0, 0.54, -0.45], [0, 0.7, -0.42], 0.45, 'y'),
      ['ell', [0, 0.74, -0.41], [0.06, 0.06, 0.06], 'y', { glow: 1 }],
    ] },
  ],
  eyes: { part: 'head', at: [0.075, 0.505, 0.35], dir: [0.3, 0, 1], style: 'anime', iris: '#4a2412', px: 0.95 },
  mouth: { part: 'head', at: [0, 0.425, 0.39], dir: [0, -0.3, 1], style: 'cat', px: 0.7, lift: 0.01 },
  fx: [
    { part: 'head', at: [0.17, 0.44, 0.31], type: 'spark', rate: 0.5, scale: 0.5, mirror: true },
    { part: 'tail3', at: [0, 0.78, -0.41], type: 'spark', rate: 0.8, scale: 0.6 },
  ],
};

// ---------------------------------------------------------------- Kanizumo
// Coach Gonda's partner: a yokozuna crab — red carapace, black mawashi with a
// white tsuna rope and shide, eyes on stalks, a chonmage topknot, huge claws.
function crabLeg(n, hip, knee, foot) {
  return { n, parent: 'body', p: hip, mirror: true, s: [
    ['cap', hip, knee, 0.05, 0.042, 'r', { top: 'R', topT: 0.5 }],
    ['sph', knee, 0.045, 'R'],
    ['cap', knee, foot, 0.042, 0.016, 'r', { tip: 'w', tipT: 0.82 }],
    ['cap', [(hip[0] + knee[0]) / 2, (hip[1] + knee[1]) / 2 + 0.04, (hip[2] + knee[2]) / 2], [(hip[0] + knee[0]) / 2 + 0.01, (hip[1] + knee[1]) / 2 + 0.08, (hip[2] + knee[2]) / 2], 0.018, 0.005, 'R'],
  ] };
}
const kanizumo = {
  id: 'kanizumo', vs: 0.028, arch: 'insect',
  pal: {
    r: '#d6362a', R: '#f2643e', D: '#9c2318', w: '#f6ead2', W: '#ffffff', k: '#1c1a22', K: '#3a3644', g: '#d6d0c4',
    h: '#121016', H: '#4a4660', c: '#ff9a8a',
  },
  anim: { quirk: ['flex', 'roar', 'happy'], bounce: 0.8, gait: 0.8, stride: 0.9 },
  parts: [
    { n: 'body', p: [0, 0.55, 0], s: [
      ['ell', [0, 0.62, 0], [0.42, 0.3, 0.33], 'r', { top: 'R', topT: 0.8, belly: 'w', bellyT: 0.45, noise: 0.008, noiseScale: 0.09 }],
      ...[[0.16, 0.86, 0.1], [-0.16, 0.86, 0.1], [0.28, 0.8, 0.0], [-0.28, 0.8, 0.0], [0.1, 0.9, -0.08], [-0.1, 0.9, -0.08], [0, 0.88, -0.2]].map((c) => ['sph', c, 0.035, 'R']),
      ['ell', [0, 0.44, 0], [0.43, 0.1, 0.34], 'k', { stripes: { axis: 'y', p: 0.06, w: 0.012, col: 'K' } }],
      ['tor', [0, 0.53, 0], 0.4, 0.04, 'W', { rot: [0, 0, 0], dither: { col: 'g', amt: 0.35 } }],
      ['tor', [0, 0.53, 0], 0.4, 0.04, 'W', { rot: [0, 0, 0], stripes: { axis: 'x', p: 0.08, w: 0.03, col: 'g' }, paint: 1 }],
      ['ell', [0, 0.53, 0.36], [0.08, 0.06, 0.05], 'W'],
      ...[-0.16, 0, 0.16].map((x) => ['poly', [x, 0.42, 0.395], [[-0.025, 0.08], [0.025, 0.08], [0.0, 0.04], [0.03, 0.0], [-0.005, -0.06], [0.0, -0.02], [-0.03, 0.02]], 0.008, 'W']),
      ...[-0.08, 0.08, -0.24, 0.24].map((x) => ['cap', [x, 0.4, 0.37], [x, 0.3, 0.37], 0.012, 0.009, 'k']),
      ['ell', [0.14, 0.62, 0.3], [0.05, 0.03, 0.03], 'c', { paint: 1, m: 1 }],
    ] },
    { n: 'head', parent: 'body', p: [0, 0.86, 0.18], s: [
      ['cap', [0.1, 0.84, 0.2], [0.14, 1.0, 0.24], 0.034, 0.03, 'r'],
      ['cap', [-0.1, 0.84, 0.2], [-0.14, 1.0, 0.24], 0.034, 0.03, 'r'],
      ['sph', [0.14, 1.04, 0.25], 0.075, 'W'],
      ['sph', [-0.14, 1.04, 0.25], 0.075, 'W'],
      ['ell', [0, 0.93, 0.02], [0.11, 0.06, 0.1], 'h'],
      ['cap', [0, 0.97, -0.02], [0, 1.05, 0.08], 0.055, 0.045, 'h'],
      ['ell', [0, 1.06, 0.15], [0.09, 0.035, 0.07], 'h', { rot: [-15, 0, 0] }],
      ['tor', [0, 1.0, 0.03], 0.05, 0.014, 'W', { rot: [55, 0, 0] }],
      ['ell', [0.025, 1.08, 0.13], [0.015, 0.008, 0.05], 'H', { paint: 1, jit: 0 }],
    ] },
    { n: 'armL', parent: 'body', p: [0.36, 0.6, 0.15], mirror: true, s: [
      ['cap', [0.36, 0.6, 0.15], [0.56, 0.56, 0.24], 0.07, 0.06, 'r', { top: 'R', topT: 0.6 }],
      ['ell', [0.62, 0.6, 0.38], [0.14, 0.13, 0.16], 'r', { top: 'R', topT: 0.6, belly: 'w', bellyT: 0.6 }],
      ['cap', [0.6, 0.55, 0.5], [0.57, 0.53, 0.66], 0.065, 0.022, 'r', { tip: 'w', tipT: 0.65 }],
      ['cap', [0.67, 0.66, 0.48], [0.62, 0.64, 0.64], 0.06, 0.02, 'r', { tip: 'w', tipT: 0.65 }],
      ...[[0.67, 0.72, 0.36], [0.56, 0.72, 0.32], [0.72, 0.66, 0.28]].map((c) => ['sph', c, 0.03, 'R']),
    ] },
    crabLeg('legFL', [0.33, 0.5, 0.08], [0.6, 0.68, 0.14], [0.74, 0.02, 0.2]),
    crabLeg('legML', [0.37, 0.48, -0.06], [0.66, 0.66, -0.08], [0.82, 0.02, -0.1]),
    crabLeg('legBL', [0.32, 0.48, -0.2], [0.58, 0.64, -0.32], [0.7, 0.02, -0.44]),
  ],
  eyes: { part: 'head', at: [0.14, 1.04, 0.33], dir: [0.15, 0.05, 1], style: 'anime', iris: '#2a1a14', px: 0.75, mirror: true },
  mouth: { part: 'body', at: [0, 0.66, 0.33], dir: [0, -0.15, 1], style: 'grin', px: 1.5, lift: 0.018 },
  fx: [{ part: 'body', at: [0.1, 0.66, 0.36], type: 'bubble', rate: 1.2, scale: 1.2 }],
};

// ---------------------------------------------------------------- Studrat
// Team Metallica punk's rat: studded leather vest + collar, steel spike
// mohawk, chain-link tail ending in a padlock, notched & pierced ear.
const studrat = {
  id: 'studrat', vs: 0.017, arch: 'quad',
  pal: {
    g: '#878b96', G: '#b9bcc6', d: '#5e626e', p: '#f2a0b0', P: '#d9707f', k: '#221f27', K: '#3a3542',
    m: '#e2e7ef', M: '#9aa3b4', r: '#e8343c', z: '#151318',
  },
  anim: { quirk: ['scratch', 'sniff', 'shakeoff'], bounce: 1.1, tail: 1.2 },
  parts: [
    { n: 'body', p: [0, 0.24, 0], s: [
      ['ell', [0, 0.24, -0.04], [0.125, 0.12, 0.2], 'g', { belly: 'G', bellyT: 0.35, dither: { col: 'd', amt: 0.12 } }],
      ['ell', [0, 0.28, -0.03], [0.133, 0.1, 0.17], 'k', { paint: 1, belly: 'g', bellyT: 0.2 }],
      ['box', [0, 0.36, -0.03], [0.012, 0.02, 0.17], 'K', { paint: 1 }],
      ...[-0.12, -0.04, 0.04, 0.12].flatMap((z) => [0.06, -0.06].map((x) => ['sph', [x, 0.345 - Math.abs(z) * 0.15, z - 0.03], 0.013, 'm'])),
      ...[-0.1, 0, 0.1].map((z) => ['sph', [0.125, 0.26, z - 0.03], 0.012, 'm', { m: 1 }]),
      ...[-0.16, -0.08, 0.0, 0.08].map((z, i) => ['cap', [0, 0.34 - Math.abs(z + 0.04) * 0.2, z - 0.02], [0, 0.45 - Math.abs(z + 0.04) * 0.3 - i * 0.004, z - 0.05], 0.024, 0.003, i % 2 ? 'M' : 'm', { tip: 'M', tipT: 0.5 }]),
      ['tor', [0, 0.3, 0.13], 0.085, 0.022, 'k', { axis: 'z', rot: [-20, 0, 0] }],
      ...Array.from({ length: 7 }, (_, i) => { const a = -Math.PI * 0.05 + (i * Math.PI * 1.1) / 6; return ['cap', [Math.cos(a) * 0.09, 0.3 + Math.sin(a) * 0.09, 0.15], [Math.cos(a) * 0.125, 0.3 + Math.sin(a) * 0.125, 0.16], 0.014, 0.003, 'm']; }),
    ] },
    { n: 'head', parent: 'body', p: [0, 0.32, 0.14], s: [
      ['ell', [0, 0.36, 0.22], [0.11, 0.1, 0.115], 'g', { dither: { col: 'd', amt: 0.1 } }],
      ['cap', [0, 0.34, 0.27], [0, 0.315, 0.38], 0.065, 0.03, 'g', { belly: 'G', bellyT: 0.3 }],
      ['sph', [0, 0.322, 0.395], 0.017, 'p'],
      ['ell', [0, 0.31, 0.3], [0.06, 0.03, 0.06], 'G', { paint: 1 }],
      ...[0.29, 0.25, 0.21, 0.17, 0.13].map((z, i) => ['cap', [0, 0.43 - i * 0.004, z], [0, 0.58 - Math.abs(i - 1.5) * 0.03, z - 0.04], 0.024, 0.003, i % 2 ? 'M' : 'm', { tip: 'M', tipT: 0.5 }]),
    ] },
    { n: 'earL', parent: 'head', p: [0.07, 0.43, 0.2], mirror: true, s: [
      ['ell', [0.1, 0.47, 0.19], [0.06, 0.065, 0.02], 'g', { rot: [0, -20, -25] }],
      ['ell', [0.1, 0.465, 0.205], [0.04, 0.045, 0.01], 'p', { rot: [0, -20, -25] }],
    ] },
    { n: 'legFL', parent: 'body', p: [0.07, 0.2, 0.1], mirror: true, s: [
      ['cap', [0.07, 0.2, 0.1], [0.08, 0.04, 0.12], 0.035, 0.03, 'g'],
      ['ell', [0.08, 0.02, 0.14], [0.035, 0.02, 0.045], 'p'],
    ] },
    { n: 'legBL', parent: 'body', p: [0.075, 0.2, -0.15], mirror: true, s: [
      ['ell', [0.08, 0.2, -0.15], [0.05, 0.07, 0.07], 'g'],
      ['cap', [0.08, 0.17, -0.15], [0.085, 0.04, -0.14], 0.033, 0.028, 'g'],
      ['ell', [0.085, 0.02, -0.11], [0.036, 0.02, 0.055], 'p'],
    ] },
    { n: 'tail', parent: 'body', p: [0, 0.23, -0.23], s: [
      ['cap', [0, 0.23, -0.2], [0, 0.23, -0.25], 0.03, 0.02, 'p'],
      ['tor', [0, 0.24, -0.29], 0.038, 0.011, 'm', { axis: 'x', dither: { col: 'M', amt: 0.3 } }],
    ] },
    { n: 'tail2', parent: 'tail', p: [0, 0.25, -0.32], s: [
      ['tor', [0, 0.26, -0.35], 0.038, 0.011, 'm', { axis: 'y', dither: { col: 'M', amt: 0.3 } }],
    ] },
    { n: 'tail3', parent: 'tail2', p: [0, 0.27, -0.38], s: [
      ['tor', [0, 0.29, -0.41], 0.038, 0.011, 'm', { axis: 'x', rot: [-20, 0, 0], dither: { col: 'M', amt: 0.3 } }],
    ] },
    { n: 'tail4', parent: 'tail3', p: [0, 0.31, -0.44], s: [
      ['tor', [0, 0.33, -0.465], 0.036, 0.011, 'm', { axis: 'y', rot: [-30, 0, 0], dither: { col: 'M', amt: 0.3 } }],
      ['tor', [0, 0.37, -0.5], 0.03, 0.01, 'M', { axis: 'x', rot: [-40, 0, 0] }],
      ['box', [0, 0.34, -0.55], [0.04, 0.035, 0.022], 'K', { round: 0.01, rot: [-40, 0, 0] }],
      ['sph', [0, 0.335, -0.535], 0.009, 'M'],
    ] },
  ],
  eyes: { part: 'head', at: [0.055, 0.38, 0.31], dir: [0.4, 0.05, 1], style: 'fierce', iris: '#ff3a3a', px: 0.8 },
  mouth: { part: 'head', at: [0, 0.29, 0.36], dir: [0, -0.5, 1], style: 'fang', px: 0.6, lift: 0.008 },
  decals: [{ part: 'earL', at: [0.09, 0.49, 0.215], dir: [-0.2, 0, 1], rows: ['k.k.k', '.k.k.', 'k.k.k'], cmap: { k: '#3a1e24' }, px: 0.6 }],
  fx: [{ part: 'head', at: [0, 0.52, 0.22], type: 'spark', rate: 0.5, scale: 0.5, color: '#d8e8ff' }],
};
// notched + pierced scar ear (left only)
studrat.parts.splice(studrat.parts.findIndex((q) => q.n === 'earL'), 1,
  { n: 'earL', parent: 'head', p: [0.07, 0.43, 0.2], s: [
    ['ell', [0.1, 0.47, 0.19], [0.06, 0.065, 0.02], 'g', { rot: [0, -20, -25] }],
    ['ell', [0.1, 0.465, 0.205], [0.04, 0.045, 0.01], 'p', { rot: [0, -20, -25] }],
    ['sph', [0.13, 0.525, 0.19], 0.022, 'g', { sub: 1 }],
    ['tor', [0.15, 0.44, 0.19], 0.016, 0.006, 'm', { axis: 'x' }],
  ] },
  { n: 'earR', parent: 'head', p: [-0.07, 0.43, 0.2], s: [
    ['ell', [-0.1, 0.47, 0.19], [0.06, 0.065, 0.02], 'g', { rot: [0, 20, 25] }],
    ['ell', [-0.1, 0.465, 0.205], [0.04, 0.045, 0.01], 'p', { rot: [0, 20, 25] }],
  ] });

// ---------------------------------------------------------------- Moshbull
// Punk bull of the mosh pit: spiked leather pauldrons, studded straps,
// nose ring, ragged mohawk mane and rock-hard stone horns & hooves.
const moshbull = {
  id: 'moshbull', vs: 0.032, arch: 'quad',
  pal: {
    h: '#3b302d', H: '#544541', n: '#8c7c72', N: '#6e5f57', k: '#1a171c', K: '#34303a', m: '#e0e5ee', M: '#9aa2b0',
    s: '#d9cdb6', S: '#a8987e', r: '#e8442a', R: '#ff8a2a', o: '#ffd34a',
  },
  anim: { quirk: ['roar', 'shakeoff', 'sniff'], bounce: 0.8, gait: 0.85, maxSpeed: 5 },
  parts: [
    { n: 'body', p: [0, 0.8, 0], s: [
      ['ell', [0, 0.86, 0.14], [0.33, 0.34, 0.36], 'h', { belly: 'N', bellyT: 0.5, dither: { col: 'H', amt: 0.12 } }],
      ['ell', [0, 0.8, -0.3], [0.27, 0.27, 0.3], 'h', { belly: 'N', bellyT: 0.5, dither: { col: 'H', amt: 0.12 } }],
      ['box', [0, 0.85, -0.05], [0.4, 0.4, 0.035], 'k', { paint: 1 }],
      ['box', [0, 0.85, -0.38], [0.4, 0.4, 0.03], 'k', { paint: 1 }],
      ...[[0.0, 1.12], [0.17, 1.08], [-0.17, 1.08], [0.29, 0.96], [-0.29, 0.96], [0.33, 0.8], [-0.33, 0.8]].map(([x, y]) => ['sph', [x, y, -0.05], 0.022, 'm']),
      ...[[0.0, 1.07], [0.16, 1.03], [-0.16, 1.03], [0.25, 0.9], [-0.25, 0.9]].map(([x, y]) => ['sph', [x, y, -0.38], 0.02, 'm']),
      ['ell', [0.24, 1.06, 0.26], [0.17, 0.1, 0.19], 'k', { m: 1, top: 'K', topT: 0.7 }],
      ...[[0.24, 0.24], [0.31, 0.3], [0.18, 0.34], [0.3, 0.16]].map(([x, z]) => ['cap', [x, 1.12, z], [x + 0.03, 1.24, z], 0.035, 0.004, 'm', { m: 1, tip: 'M', tipT: 0.5 }]),
      ...[[0.03, 0.28], [-0.03, 0.18], [0.04, 0.08], [-0.03, -0.02], [0.03, -0.12], [-0.02, -0.22], [0.02, -0.32]].map(([x, z], i) => ['cap', [0, 1.13 - Math.max(0, -z) * 0.12, z + 0.04], [x, 1.31 - Math.max(0, -z) * 0.25 + (i % 2 ? -0.03 : 0.02), z - 0.06], 0.07, 0.01, i % 2 ? 'R' : 'r']),
    ] },
    { n: 'head', parent: 'body', p: [0, 0.98, 0.42], s: xf([
      ['ell', [0, 0.94, 0.58], [0.21, 0.2, 0.2], 'h', { dither: { col: 'H', amt: 0.12 } }],
      ['ell', [0, 0.82, 0.74], [0.16, 0.12, 0.11], 'n', { belly: 'N', bellyT: 0.5 }],
      ['ell', [0.06, 0.82, 0.84], [0.025, 0.03, 0.02], 'k', { m: 1 }],
      ['tor', [0, 0.765, 0.85], 0.055, 0.015, 'o', { axis: 'z', rot: [20, 0, 0] }],
      ['cap', [0.15, 1.05, 0.55], [0.32, 1.08, 0.56], 0.06, 0.05, 's', { m: 1 }],
      ['cap', [0.32, 1.08, 0.56], [0.42, 1.22, 0.62], 0.05, 0.028, 's', { m: 1 }],
      ['cap', [0.42, 1.22, 0.62], [0.43, 1.33, 0.7], 0.028, 0.008, 'S', { m: 1 }],
      ['ell', [0.2, 0.95, 0.5], [0.08, 0.03, 0.06], 'h', { m: 1, rot: [0, 0, -30] }],
      ...[[0.06, 0.62], [0.0, 0.52], [-0.05, 0.43]].map(([x, z], i) => ['cap', [x * 0.3, 1.1, z], [x, 1.25 - i * 0.02, z - 0.06], 0.055, 0.01, i % 2 ? 'R' : 'r']),
    ], 1.22, [0, 0.98, 0.42], [0, 0, 0.03]) },
    { n: 'legFL', parent: 'body', p: [0.2, 0.72, 0.26], mirror: true, s: [
      ['cap', [0.2, 0.72, 0.26], [0.21, 0.12, 0.28], 0.1, 0.075, 'h', { dither: { col: 'H', amt: 0.12 } }],
      ['cyl', [0.21, 0.4, 0.278], [0.21, 0.33, 0.28], 0.088, 'k'],
      ...[0, 1, 2].map((i) => ['sph', [0.21 + Math.cos(i * 1.1 - 0.4) * 0.09, 0.365, 0.28 + Math.sin(i * 1.1 - 0.4) * 0.09], 0.017, 'm']),
      ['cyl', [0.21, 0.13, 0.29], [0.21, 0.0, 0.3], 0.085, 'S', { noise: 0.01, noiseScale: 0.05, top: 's', topT: 0.6 }],
    ] },
    { n: 'legBL', parent: 'body', p: [0.17, 0.72, -0.34], mirror: true, s: [
      ['ell', [0.17, 0.72, -0.34], [0.12, 0.17, 0.15], 'h', { dither: { col: 'H', amt: 0.12 } }],
      ['cap', [0.17, 0.6, -0.36], [0.18, 0.12, -0.34], 0.085, 0.07, 'h', { dither: { col: 'H', amt: 0.12 } }],
      ['cyl', [0.18, 0.13, -0.34], [0.18, 0.0, -0.33], 0.08, 'S', { noise: 0.01, noiseScale: 0.05, top: 's', topT: 0.6 }],
    ] },
    { n: 'tail', parent: 'body', p: [0, 0.95, -0.57], s: [
      ['cap', [0, 0.95, -0.57], [0, 0.7, -0.66], 0.025, 0.02, 'h'],
    ] },
    { n: 'tail2', parent: 'tail', p: [0, 0.7, -0.66], s: [
      ['ell', [0, 0.64, -0.67], [0.05, 0.08, 0.05], 'r', { noise: 0.01, noiseScale: 0.03 }],
    ] },
  ],
  eyes: { part: 'head', at: XF([0.11, 0.97, 0.73], 1.22, [0, 0.98, 0.42], [0, 0, 0.03]), dir: [0.55, 0.05, 1], style: 'fierce', iris: '#ff5a2a', px: 0.9 },
  mouth: { part: 'head', at: XF([0, 0.73, 0.79], 1.22, [0, 0.98, 0.42], [0, 0, 0.03]), dir: [0, -0.6, 1], style: 'fang', px: 0.9, lift: 0.016 },
  fx: [
    { part: 'legFL', at: [0.21, 0.02, 0.3], type: 'dust', rate: 0.4, mirror: true },
    { part: 'head', at: XF([0, 0.83, 0.88], 1.22, [0, 0.98, 0.42], [0, 0, 0.03]), type: 'steam', rate: 0.4, scale: 0.6 },
  ],
};

// ---------------------------------------------------------------- Thrashark
// The punk leader's ace: a land shark that "swims" just above the ground, with
// a spinning sawblade dorsal fin, chain necklace, torn studded straps.
const SAW = (() => {
  const pts = [], n = 18, R = 0.25;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 0.6) / n) * Math.PI * 2;
    pts.push([Math.cos(a0) * (R - 0.045), Math.sin(a0) * (R - 0.045)]);
    pts.push([Math.cos(a1) * R, Math.sin(a1) * R]);
  }
  return pts;
})();
const thrashark = xfDesign({
  id: 'thrashark', vs: 0.03, arch: 'swimmer',
  pal: {
    n: '#22345e', N: '#33497c', w: '#eef2f6', W: '#c9d2dc', k: '#17151c', K: '#34303c', m: '#e4e9f1', M: '#99a3b4',
    g: '#121a2e', r: '#e8343c', s: '#f6f8ff',
  },
  anim: { hover: 0.35, quirk: ['roar', 'shakeoff'], tail: 1.3, bounce: 0.6, maxSpeed: 6 },
  parts: [
    { n: 'body', p: [0, 0.28, 0.15], s: [
      ['ell', [0, 0.28, 0.2], [0.24, 0.23, 0.52], 'n', { belly: 'w', bellyT: 0.15, dither: { col: 'N', amt: 0.08 } }],
      ['ell', [0, 0.27, 0.6], [0.19, 0.16, 0.2], 'n', { belly: 'w', bellyT: 0.1 }],
      ['cap', [0, 0.28, 0.62], [0, 0.25, 0.8], 0.13, 0.06, 'n', { belly: 'w', bellyT: 0.1 }],
      ...[0.36, 0.31, 0.26].map((z) => ['box', [0.23, 0.29, z], [0.06, 0.06, 0.007], 'g', { paint: 1, m: 1, rot: [0, 0, 8] }]),
      ['tor', [0, 0.27, 0.42], 0.25, 0.024, 'm', { axis: 'z', rot: [-8, 0, 0], stripes: { axis: 'y', p: 0.06, w: 0.03, col: 'M' } }],
      ['sph', [0, 0.03, 0.47], 0.035, 'm'],
      ['box', [0.12, 0.42, 0.0], [0.035, 0.3, 0.035], 'k', { paint: 1, rot: [0, 0, 40] }],
      ['box', [-0.12, 0.42, 0.0], [0.035, 0.3, 0.035], 'k', { paint: 1, rot: [0, 0, -40] }],
      ['box', [0, 0.42, -0.16], [0.4, 0.4, 0.03], 'k', { paint: 1 }],
      ...[[0.14, 0.5, 0.0], [-0.14, 0.5, 0.0], [0.2, 0.42, -0.16], [-0.2, 0.42, -0.16], [0.0, 0.53, -0.16], [0.24, 0.3, 0.0], [-0.24, 0.3, 0.0]].map((c) => ['sph', c, 0.02, 'm']),
      ['box', [0.22, 0.2, -0.16], [0.06, 0.04, 0.03], 'n', { sub: 0, paint: 1 }],
    ] },
    { n: 'saw', parent: 'body', p: [0, 0.56, 0.04], keep: true, spin: { axis: 'x', speed: 6 }, s: [
      ['poly', [0, 0.56, 0.04], SAW, 0.016, 'm', { plane: 'zy', jit: 0.03 }],
      ['tor', [0, 0.56, 0.04], 0.15, 0.014, 'M', { axis: 'x' }],
      ['cyl', [-0.024, 0.56, 0.04], [0.024, 0.56, 0.04], 0.055, 'M'],
      ['cyl', [-0.03, 0.56, 0.04], [0.03, 0.56, 0.04], 0.022, 'k'],
      ...[0, 1, 2].map((i) => ['sph', [0, 0.56 + Math.sin(i * 2.09 + 0.5) * 0.1, 0.04 + Math.cos(i * 2.09 + 0.5) * 0.1], 0.03, 'k', { sub: 1 }]),
      ['box', [0, 0.72, 0.04], [0.02, 0.05, 0.014], 's', { paint: 1, jit: 0 }],
    ] },
    { n: 'tail', parent: 'body', p: [0, 0.29, -0.26], s: [
      ['cap', [0, 0.29, -0.22], [0, 0.31, -0.55], 0.2, 0.11, 'n', { belly: 'w', bellyT: 0.2, dither: { col: 'N', amt: 0.08 } }],
      ['poly', [0, 0, -0.45], [[0.0, 0.38], [0.06, 0.38], [-0.04, 0.5]], 0.012, 'n', { plane: 'zy' }],
    ] },
    { n: 'tail2', parent: 'tail', p: [0, 0.31, -0.55], s: [
      ['cap', [0, 0.31, -0.55], [0, 0.33, -0.76], 0.11, 0.055, 'n', { belly: 'w', bellyT: 0.2 }],
    ] },
    { n: 'tail3', parent: 'tail2', p: [0, 0.33, -0.76], s: [
      ['poly', [0, 0, 0], [[-0.74, 0.37], [-0.93, 0.76], [-1.01, 0.76], [-0.91, 0.38], [-0.98, 0.1], [-0.91, 0.08], [-0.74, 0.3]], 0.024, 'n', { plane: 'zy' }],
      ...[[-0.95, 0.72], [-0.97, 0.13]].map(([z, y]) => ['cap', [0, y, z], [0, y + (y > 0.4 ? 0.07 : -0.06), z - 0.06], 0.02, 0.003, 'm']),
    ] },
    { n: 'finL', parent: 'body', p: [0.2, 0.17, 0.32], mirror: true, s: [
      ['ell', [0.36, 0.1, 0.22], [0.18, 0.026, 0.09], 'n', { rot: [0, 30, -22], belly: 'W', bellyT: 0.3 }],
      ...[0, 1, 2].map((i) => ['cap', [0.26 + i * 0.07, 0.14 - i * 0.03, 0.31 - i * 0.04], [0.28 + i * 0.07, 0.21 - i * 0.03, 0.32 - i * 0.04], 0.02, 0.003, 'm']),
    ] },
  ],
  eyes: { part: 'body', at: [0.12, 0.35, 0.68], dir: [0.6, 0.2, 1], style: 'fierce', iris: '#ff3a3a', px: 0.95 },
  mouth: { part: 'body', at: [0, 0.19, 0.74], dir: [0, -0.6, 1], style: 'zig', px: 1.0, lift: 0.02 },
  decals: [{ part: 'body', at: [-0.15, 0.41, 0.64], dir: [-0.6, 0.3, 1], rows: ['w..', '.w.', '..w', '.w.', 'w..'], cmap: { w: '#e9eef5' }, px: 0.7 }],
  fx: [
    { part: 'body', at: [0, 0.82, 0.04], type: 'spark', rate: 0.6, scale: 0.6, color: '#ffe6a0' },
    { part: 'body', at: [0, 0.0, 0.1], type: 'dust', rate: 1.2, scale: 1.2 },
  ],
}, 0.87);
thrashark.anim.hover = 0.35;

// ---------------------------------------------------------------- Lemmo
// A lemon battery Elemon: copper + zinc electrodes, leaf sprout, sour squint.
const lemmo = {
  id: 'lemmo', vs: 0.013, arch: 'blob',
  pal: {
    y: '#ffdf2e', Y: '#fff27a', o: '#f2be16', O: '#d9a20e', g: '#5ac83a', G: '#2f8a24', c: '#e07a3a', z: '#bfc6d0',
    p: '#ff9a8a', k: '#3a2a10',
  },
  anim: { quirk: ['hop', 'shakeoff', 'spin'], bounce: 1.5 },
  parts: [
    { n: 'body', p: [0, 0.17, 0], s: [
      ['ell', [0, 0.18, 0], [0.155, 0.17, 0.145], 'y', { dither: { col: 'o', amt: 0.06 }, top: 'Y', topT: 0.8, belly: 'o', bellyT: 0.5 }],
      ['cap', [0, 0.33, -0.005], [0, 0.375, 0.0], 0.04, 0.02, 'y', { tip: 'g', tipT: 0.7 }],
      ['cap', [0, 0.03, 0.0], [0, 0.005, 0.0], 0.04, 0.022, 'o'],
      ['ell', [-0.06, 0.26, 0.09], [0.035, 0.03, 0.03], 'Y', { paint: 1, jit: 0 }],
      ['box', [0.1, 0.33, -0.03], [0.022, 0.05, 0.005], 'c', { rot: [0, 0, -25] }],
      ['cap', [-0.1, 0.3, -0.03], [-0.13, 0.38, -0.03], 0.007, 0.007, 'z'],
      ['cyl', [-0.13, 0.38, -0.03], [-0.135, 0.39, -0.03], 0.016, 'z'],
      ['ell', [0.105, 0.17, 0.11], [0.025, 0.014, 0.02], 'p', { paint: 1, m: 1 }],
    ] },
    { n: 'tail', parent: 'body', p: [0, 0.37, 0], sway: { axis: 'z', amp: 0.18, freq: 1.3 }, s: [
      ['cap', [0, 0.37, 0], [0.01, 0.42, 0.0], 0.008, 0.007, 'G'],
      ['ell', [0.05, 0.44, 0.01], [0.05, 0.012, 0.025], 'g', { rot: [0, 0, 25], top: 'g', belly: 'G', bellyT: 0.3 }],
      ['ell', [-0.035, 0.43, 0.0], [0.035, 0.01, 0.02], 'g', { rot: [0, 0, -30], belly: 'G', bellyT: 0.3 }],
    ] },
  ],
  eyes: { part: 'body', at: [0.058, 0.2, 0.14], dir: [0.35, 0, 1], style: 'sharp', iris: '#3a7a14', px: 0.95 },
  mouth: { part: 'body', at: [0, 0.135, 0.145], dir: [0, -0.25, 1], style: 'w', px: 0.6, lift: 0.008 },
  fx: [
    { part: 'body', at: [0.12, 0.38, -0.03], type: 'spark', rate: 0.6, scale: 0.35 },
    { part: 'body', at: [-0.135, 0.4, -0.03], type: 'spark', rate: 0.4, scale: 0.35 },
  ],
};

// ---------------------------------------------------------------- Alpha Lemmo
// Boss: the Sour King — giant battery-lemon with a crown of leaves, a glowing
// lemon-slice shield, a juice cannon, angry brows and a crackling aura.
const LS_C = [0.82, 1.0, 0.36];
const alpha_lemmo = {
  id: 'alpha_lemmo', vs: 0.042, arch: 'biped',
  pal: {
    y: '#ffd92a', Y: '#fff07a', o: '#f0b412', O: '#c98a0a', g: '#4cbc34', G: '#2a7a20', l: '#8ae05a', w: '#fffbe8', f: '#ffd23a',
    k: '#2e2410', K: '#4a3a16', c: '#e07a3a', C: '#ff9a5a', z: '#bfc6d0', Z: '#8a929e', m: '#d9dee6', E: '#c8ff4a', J: '#fff38a', a: '#ffd23a', b: '#3a5a1a',
  },
  anim: { quirk: ['roar', 'flex', 'stomp'], bounce: 0.7, gait: 0.7, weight: 2 },
  parts: [
    { n: 'body', p: [0, 1.1, 0], s: [
      ['ell', [0, 1.2, 0], [0.62, 0.76, 0.56], 'y', { dither: { col: 'o', amt: 0.06 }, top: 'Y', topT: 0.8, belly: 'o', bellyT: 0.45 }],
      ['cap', [0, 0.47, 0.0], [0, 0.4, 0.0], 0.12, 0.07, 'O'],
      ['ell', [-0.25, 1.65, 0.3], [0.09, 0.07, 0.06], 'Y', { paint: 1, jit: 0 }],
      ['ell', [0.16, 1.47, 0.48], [0.13, 0.04, 0.08], 'K', { rot: [0, 0, 22] }],
      ['ell', [-0.16, 1.47, 0.48], [0.13, 0.04, 0.08], 'K', { rot: [0, 0, -22] }],
      ...[[0.47, 0.95, 0.3, 1], [-0.42, 0.8, 0.34, -1], [0.32, 1.66, 0.3, 1], [-0.4, 1.55, 0.28, -1]].flatMap(([x, y, z, sd]) => [0, 1, 2, 3, 4].map((i) => ['box', [x + sd * (i % 2 ? 0.03 : -0.03), y + i * 0.075, z], [0.026, 0.05, 0.12], 'E', { paint: 1, glow: 2, rot: [0, sd * 35, (i % 2 ? 35 : -35)] }])),
      ['cap', [0.25, 1.45, -0.42], [0.42, 1.75, -0.6], 0.05, 0.045, 'c'],
      ['cyl', [0.42, 1.75, -0.6], [0.45, 1.8, -0.63], 0.08, 'C'],
      ['cap', [-0.25, 1.45, -0.42], [-0.42, 1.75, -0.6], 0.05, 0.045, 'z'],
      ['cyl', [-0.42, 1.75, -0.6], [-0.45, 1.8, -0.63], 0.08, 'Z'],
      ['tor', [0, 1.52, -0.63], 0.53, 0.024, 'k', { axis: 'z' }],
      ['box', [0, 1.2, -0.63], [0.6, 0.6, 0.1], 'k', { sub: 1 }],
    ] },
    { n: 'crown', parent: 'body', p: [0, 1.9, 0], s: [
      ['tor', [0, 1.9, 0], 0.2, 0.05, 'a', { stripes: { axis: 'x', p: 0.08, w: 0.03, col: 'o' } }],
      ...Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2, cx = Math.sin(a), cz = Math.cos(a); return ['ell', [cx * 0.24, 2.12, cz * 0.24], [0.08, 0.2, 0.03], i % 2 ? 'g' : 'l', { rot: [cz * -18, a * 180 / Math.PI, cx * 18], belly: 'G', bellyT: 0.6 }]; }),
      ...Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return ['cap', [Math.sin(a) * 0.2, 1.95, Math.cos(a) * 0.2], [Math.sin(a) * 0.31, 2.3, Math.cos(a) * 0.31], 0.012, 0.005, 'G']; }),
      ...[[0.2, 0.2], [-0.25, 0.1]].map(([x, z]) => ['sph', [x, 2.02, z], 0.05, 'w']),
      ...[[0.2, 0.2], [-0.25, 0.1]].map(([x, z]) => ['sph', [x, 2.05, z + 0.02], 0.02, 'a']),
      ['cap', [0, 1.9, 0], [0, 2.02, 0], 0.07, 0.04, 'O'],
    ], sway: { axis: 'z', amp: 0.05, freq: 1.5 } },
    { n: 'armL', parent: 'body', p: [0.6, 1.3, 0.05], s: [
      ['sph', [0.6, 1.3, 0.05], 0.13, 'G'],
      ['cap', [0.6, 1.3, 0.05], [0.76, 1.05, 0.12], 0.12, 0.1, 'g', { belly: 'G', bellyT: 0.4 }],
      ['cyl', [0.78, 1.05, 0.12], [0.8, 0.65, 0.16], 0.11, 'm', { stripes: { axis: 'y', p: 0.12, w: 0.03, col: 'Z' } }],
      ['cap', [0.8, 0.66, 0.16], [0.81, 0.5, 0.17], 0.13, 0.07, 'y', { stripes: { axis: 'x', p: 0.05, w: 0.018, col: 'o' } }],
      ['cyl', [LS_C[0] - 0.05, LS_C[1], LS_C[2] - 0.05], [LS_C[0] + 0.0, LS_C[1], LS_C[2] + 0.02], 0.47, 'y', { rot: [0, 35, 0] }],
      ['cyl', [LS_C[0] - 0.05, LS_C[1], LS_C[2] - 0.05], [LS_C[0] + 0.0, LS_C[1], LS_C[2] + 0.02], 0.42, 'w', { rot: [0, 35, 0], paint: 1 }],
      ['cyl', [LS_C[0] - 0.05, LS_C[1], LS_C[2] - 0.05], [LS_C[0] + 0.0, LS_C[1], LS_C[2] + 0.02], 0.385, 'f', { paint: 1, dither: { col: 'Y', amt: 0.15 } }],
      ...Array.from({ length: 5 }, (_, i) => ['box', [LS_C[0] - 0.025, LS_C[1], LS_C[2] - 0.015], [0.4, 0.022, 0.08], 'w', { rot: [0, 35, i * 36], paint: 1 }]),
      ['cyl', [LS_C[0] - 0.05, LS_C[1], LS_C[2] - 0.05], [LS_C[0] + 0.0, LS_C[1], LS_C[2] + 0.02], 0.07, 'w', { rot: [0, 35, 0], paint: 1 }],
      ['ell', [LS_C[0] - 0.15, LS_C[1] + 0.2, LS_C[2] + 0.06], [0.08, 0.05, 0.03], '#ffffff', { rot: [0, 35, 0], paint: 1, jit: 0 }],
    ] },
    { n: 'armR', parent: 'body', p: [-0.6, 1.3, 0.05], s: [
      ['sph', [-0.6, 1.3, 0.05], 0.13, 'G'],
      ['cap', [-0.6, 1.3, 0.05], [-0.76, 1.08, 0.08], 0.12, 0.1, 'g', { belly: 'G', bellyT: 0.4 }],
      ['cyl', [-0.78, 1.1, 0.08], [-0.82, 0.55, 0.12], 0.16, 'm', { stripes: { axis: 'y', p: 0.14, w: 0.035, col: 'Z' } }],
      ['cyl', [-0.82, 0.62, 0.12], [-0.83, 0.52, 0.13], 0.19, 'Z'],
      ['cap', [-0.83, 0.52, 0.13], [-0.84, 0.3, 0.14], 0.17, 0.06, 'y', { stripes: { axis: 'x', p: 0.05, w: 0.018, col: 'o' } }],
      ['cyl', [-0.84, 0.36, 0.14], [-0.84, 0.28, 0.14], 0.05, 'J', { glow: 2 }],
      ['cyl', [-0.7, 0.9, 0.12], [-0.68, 0.75, 0.22], 0.05, 'J', { glow: 1 }],
    ] },
    { n: 'legL', parent: 'body', p: [0.25, 0.55, 0], mirror: true, s: [
      ['cap', [0.25, 0.55, 0], [0.3, 0.2, 0.03], 0.13, 0.11, 'g', { belly: 'G', bellyT: 0.5 }],
      ['ell', [0.31, 0.1, 0.1], [0.15, 0.1, 0.2], 'b', { top: 'G', topT: 0.6 }],
    ] },
  ],
  eyes: { part: 'body', at: [0.17, 1.37, 0.5], dir: [0.3, 0.05, 1], style: 'fierce', iris: '#3a8a10', px: 1.0, cmap: { i: { c: '#d8ff3a', glow: 1 } } },
  mouth: { part: 'body', at: [0, 1.12, 0.55], dir: [0, -0.15, 1], style: 'zig', px: 1.1, lift: 0.03 },
  fx: [
    { part: 'body', at: [0.5, 1.6, 0.0], type: 'spark', rate: 1.2, scale: 1.2 },
    { part: 'body', at: [-0.5, 1.2, 0.2], type: 'spark', rate: 1.2, scale: 1.2 },
    { part: 'body', at: [0, 2.04, -0.63], type: 'spark', rate: 2, scale: 1.4, color: '#e8ff7a' },
    { part: 'body', at: [0, 1.3, 0.0], type: 'glow', rate: 2, scale: 4, color: '#e8ff5a' },
    { part: 'armR', at: [-0.84, 0.27, 0.14], type: 'drip', rate: 2, scale: 1.4, color: '#ffe85a' },
  ],
};

// ---------------------------------------------------------------- Kagarou
// The fire wolf of the opening cinematic: soot-black legs that heat up into
// ember orange, a living flame mane, ember eyes.
const kagarou = {
  id: 'kagarou', vs: 0.026, arch: 'quad',
  pal: {
    o: '#ff6a1c', O: '#ff8a2e', r: '#c8361a', R: '#9a2412', y: '#ffd27a', k: '#1c1416', K: '#3a2420',
    F: '#ffd040', f: '#ff8a1e', e: '#ff5a10', w: '#fff1d6',
  },
  anim: { quirk: ['roar', 'shakeoff', 'sniff'], bounce: 0.9, stride: 1.2, maxSpeed: 7, tail: 1.2 },
  parts: [
    { n: 'body', p: [0, 0.64, 0], s: [
      ['ell', [0, 0.64, -0.06], [0.16, 0.16, 0.38], 'o', { grad: { axis: 'y', to: 'r', a: 0.6, b: 0.8 }, belly: 'y', bellyT: 0.45 }],
      ['ell', [0, 0.66, 0.24], [0.18, 0.2, 0.17], 'o', { grad: { axis: 'y', to: 'r', a: 0.62, b: 0.85 }, belly: 'y', bellyT: 0.35 }],
      ['ell', [0, 0.6, 0.33], [0.11, 0.12, 0.08], 'y'],
      ['box', [0, 0.79, -0.06], [0.02, 0.02, 0.32], 'R', { paint: 1 }],
      ...[[0, 0.84, 0.24, 0, 0.98, 0.1], [0.1, 0.8, 0.27, 0.16, 0.92, 0.14], [-0.1, 0.8, 0.27, -0.16, 0.92, 0.14], [0.15, 0.7, 0.3, 0.24, 0.8, 0.2], [-0.15, 0.7, 0.3, -0.24, 0.8, 0.2], [0.06, 0.84, 0.12, 0.08, 0.98, -0.02], [-0.06, 0.84, 0.12, -0.08, 0.97, -0.02], [0, 0.82, 0.02, 0, 0.93, -0.12]].map(([ax, ay, az, bx, by, bz], i) => ['cap', [ax, ay, az], [bx, by, bz], 0.065, 0.012, i % 3 === 0 ? 'F' : 'f', { glow: 1, tip: 'F', tipT: 0.6 }]),
    ] },
    { n: 'head', parent: 'body', p: [0, 0.8, 0.36], s: xf([
      ['ell', [0, 0.88, 0.46], [0.13, 0.12, 0.14], 'o', { belly: 'y', bellyT: 0.4, grad: { axis: 'y', to: 'r', a: 0.88, b: 1.0 } }],
      ['cap', [0, 0.85, 0.54], [0, 0.82, 0.71], 0.08, 0.045, 'o', { belly: 'w', bellyT: 0.2 }],
      ['ell', [0, 0.81, 0.62], [0.06, 0.03, 0.08], 'w', { paint: 1 }],
      ['sph', [0, 0.835, 0.73], 0.026, 'k'],
      ['cap', [0.12, 0.84, 0.44], [0.2, 0.8, 0.38], 0.05, 0.01, 'f', { m: 1, glow: 1 }],
      ['cap', [0.11, 0.8, 0.46], [0.18, 0.74, 0.4], 0.04, 0.01, 'F', { m: 1, glow: 2 }],
    ], 1.25, [0, 0.8, 0.36]) },
    { n: 'earL', parent: 'head', p: XF([0.07, 0.97, 0.43], 1.25, [0, 0.8, 0.36], [0, 0, 0]), mirror: true, s: xf([
      ['cap', [0.07, 0.96, 0.43], [0.11, 1.13, 0.39], 0.045, 0.01, 'o', { tip: 'k', tipT: 0.55 }],
      ['ell', [0.085, 1.02, 0.44], [0.018, 0.04, 0.008], 'R', { paint: 1 }],
    ], 1.25, [0, 0.8, 0.36]) },
    { n: 'legFL', parent: 'body', p: [0.1, 0.6, 0.26], mirror: true, s: [
      ['cap', [0.1, 0.6, 0.26], [0.11, 0.3, 0.29], 0.06, 0.042, 'k', { grad: { axis: 'y', to: 'o', a: 0.32, b: 0.58 } }],
      ['cap', [0.11, 0.3, 0.29], [0.11, 0.06, 0.28], 0.042, 0.036, 'k', { dither: { col: 'K', amt: 0.2 } }],
      ['ell', [0.11, 0.035, 0.31], [0.045, 0.035, 0.065], 'k'],
      ...[[0.15, 0.22, 0.29], [0.08, 0.15, 0.3], [0.14, 0.33, 0.3]].map((c) => ['sph', c, 0.014, 'e', { glow: 2 }]),
    ] },
    { n: 'legBL', parent: 'body', p: [0.1, 0.62, -0.3], mirror: true, s: [
      ['ell', [0.11, 0.56, -0.3], [0.08, 0.13, 0.11], 'o', { grad: { axis: 'y', to: 'k', a: 0.55, b: 0.42 } }],
      ['cap', [0.11, 0.46, -0.32], [0.11, 0.24, -0.38], 0.045, 0.036, 'k', { grad: { axis: 'y', to: 'o', a: 0.3, b: 0.5 } }],
      ['cap', [0.11, 0.24, -0.38], [0.11, 0.06, -0.33], 0.036, 0.032, 'k', { dither: { col: 'K', amt: 0.2 } }],
      ['ell', [0.11, 0.035, -0.3], [0.045, 0.035, 0.065], 'k'],
      ...[[0.15, 0.3, -0.36], [0.07, 0.16, -0.35]].map((c) => ['sph', c, 0.014, 'e', { glow: 2 }]),
    ] },
    { n: 'tail', parent: 'body', p: [0, 0.72, -0.42], s: [
      ['cap', [0, 0.72, -0.42], [0, 0.72, -0.62], 0.06, 0.085, 'o', { grad: { axis: 'z', to: 'r', a: -0.45, b: -0.6 } }],
    ] },
    { n: 'tail2', parent: 'tail', p: [0, 0.72, -0.62], s: [
      ['cap', [0, 0.72, -0.62], [0, 0.82, -0.82], 0.085, 0.03, 'r', { tip: 'f', tipT: 0.35 }],
      ['cap', [0, 0.8, -0.78], [0, 0.95, -0.9], 0.06, 0.01, 'F', { glow: 2 }],
    ] },
  ],
  eyes: { part: 'head', at: XF([0.065, 0.92, 0.57], 1.25, [0, 0.8, 0.36], [0, 0, 0]), dir: [0.45, 0.1, 1], style: 'big', iris: '#ffb020', px: 0.8, cmap: { i: { c: '#ffb428', glow: 2 }, w: '#fff6d0' } },
  mouth: { part: 'head', at: XF([0, 0.79, 0.69], 1.25, [0, 0.8, 0.36], [0, 0, 0]), dir: [0, -0.6, 1], style: 'fang', px: 0.75, lift: 0.012 },
  fx: [
    { part: 'body', at: [0, 0.98, 0.12], type: 'flame', rate: 0.9, scale: 1.1 },
    { part: 'body', at: [0.18, 0.86, 0.18], type: 'flame', rate: 0.5, scale: 0.8, mirror: true },
    { part: 'body', at: [0, 0.95, -0.05], type: 'ember', rate: 1.5 },
    { part: 'tail2', at: [0, 0.97, -0.92], type: 'flame', rate: 0.7, scale: 0.8 },
    { part: 'tail2', at: [0, 0.95, -0.9], type: 'ember', rate: 1 },
  ],
};

// ---------------------------------------------------------------- Hotarumi
// Dusk firefly whose abdomen is a glowing paper lantern (chōchin).
const hotarumi = {
  id: 'hotarumi', vs: 0.013, arch: 'flyer',
  pal: {
    n: '#2e2a4a', N: '#4a4470', f: '#9a92d8', F: '#b9b2ea', p: '#ff6a7a', k: '#1a1622', g: '#e4ff70', G: '#a8d83a', r: '#e8343c',
    W: '#e6f4ff', V: '#9cc4ee', y: '#ffe9a0', c: '#ffb0c8',
  },
  anim: { hover: 0.28, flap: 1.3, quirk: ['sway', 'spin', 'happy'], bounce: 1 },
  parts: [
    { n: 'body', p: [0, 0.32, 0], s: [
      ['ell', [0, 0.32, 0.0], [0.07, 0.065, 0.085], 'n'],
      ['ell', [0, 0.365, 0.055], [0.088, 0.035, 0.07], 'p', { top: 'p', belly: 'n', bellyT: 0.3 }],
      ['box', [0, 0.4, 0.055], [0.007, 0.02, 0.05], 'k', { paint: 1 }],
      ['box', [0, 0.4, 0.06], [0.04, 0.02, 0.007], 'k', { paint: 1 }],
    ] },
    { n: 'head', parent: 'body', p: [0, 0.35, 0.1], s: [
      ['ell', [0, 0.37, 0.15], [0.1, 0.09, 0.085], 'f', { top: 'F', topT: 0.8 }],
      ['ell', [0.07, 0.34, 0.2], [0.02, 0.012, 0.015], 'c', { paint: 1, m: 1 }],
    ] },
    { n: 'antL', parent: 'head', p: [0.035, 0.44, 0.17], mirror: true, s: [
      ['cap', [0.035, 0.44, 0.17], [0.07, 0.53, 0.2], 0.007, 0.006, 'n'],
      ['cap', [0.07, 0.53, 0.2], [0.11, 0.56, 0.18], 0.006, 0.006, 'n'],
      ['sph', [0.115, 0.555, 0.175], 0.014, 'g', { glow: 2 }],
    ] },
    { n: 'tail', parent: 'body', p: [0, 0.29, -0.06], sway: { axis: 'x', amp: 0.12, freq: 0.9 }, s: [
      ['cap', [0, 0.29, -0.06], [0, 0.26, -0.11], 0.025, 0.02, 'n'],
      ['cyl', [0, 0.255, -0.12], [0, 0.235, -0.12], 0.065, 'k'],
      ['ell', [0, 0.15, -0.12], [0.1, 0.1, 0.1], 'g', { glow: 2, stripes: { axis: 'y', p: 0.032, w: 0.008, col: 'G' } }],
      ['cyl', [0, 0.065, -0.12], [0, 0.045, -0.12], 0.06, 'k'],
      ['cap', [0, 0.045, -0.12], [0, 0.0, -0.12], 0.012, 0.02, 'r'],
    ] },
    { n: 'wingL', parent: 'body', p: [0.05, 0.37, -0.01], mirror: true, s: [
      ['ell', [0.17, 0.42, -0.04], [0.14, 0.008, 0.06], 'W', { rot: [0, -15, 12], stripes: { axis: 'x', p: 0.04, w: 0.01, col: 'V' } }],
      ['ell', [0.14, 0.4, -0.1], [0.1, 0.008, 0.045], 'W', { rot: [0, 25, 8], stripes: { axis: 'x', p: 0.04, w: 0.01, col: 'V' } }],
    ] },
    { n: 'legL', parent: 'body', p: [0.04, 0.27, 0.02], mirror: true, s: [
      ...[0.05, 0.0, -0.05].map((z) => ['cap', [0.04, 0.27, z], [0.07, 0.2, z + 0.01], 0.008, 0.006, 'n']),
    ] },
  ],
  eyes: { part: 'head', at: [0.045, 0.38, 0.225], dir: [0.35, 0, 1], style: 'big', iris: '#e4ff70', px: 0.85, cmap: { i: { c: '#d8ff60', glow: 1 } } },
  mouth: { part: 'head', at: [0, 0.32, 0.225], dir: [0, -0.3, 1], style: 'cat', px: 0.55, lift: 0.006 },
  decals: [{ part: 'tail', at: [0, 0.15, -0.02], dir: [0, 0, 1], rows: ['.rrr.', 'r.r.r', 'rrrrr', 'r.r.r', '.rrr.'], cmap: { r: '#d8263c' }, px: 0.9 }],
  fx: [{ part: 'tail', at: [0, 0.15, -0.12], type: 'glow', rate: 2, scale: 0.8, color: '#e4ff70' }],
};

export const DESIGNS = { beatlet, lenshorn, mccarapace, harrisun, starrab, pebblips, jaggeode, zapanda, kanizumo, studrat, moshbull, thrashark, lemmo, alpha_lemmo, kagarou, hotarumi };
export const LORE = {
  beatlet: {
    name: 'Beatlet', element: 'bio', stage: 1, height: '0.55 m',
    desc: 'A kabutomushi grub that hatched under a Shinsekai record shop and has been headbanging ever since. Scientists agree it is more popular than most beetles.',
    personality: 'Cheerful, people-pleasing and impossible to keep still; it shakes its mop-top whenever music plays and sulks when the band breaks up for lunch.',
    look: 'Round glossy blue-black shell with a Bio-green underside, a fluffy brown mop-top helmet with a straight fringe, big blue eyes peeking underneath, a stubby forked horn and six legs in tiny Cuban-heel boots.',
    evolves: ['lenshorn', 'mccarapace', 'harrisun', 'starrab'],
  },
  lenshorn: {
    name: 'Lenshorn', element: 'echo', stage: 2, height: '1.2 m',
    desc: 'Evolves from Beatlet after it defeats 20 Lemmo and the Alpha Lemmo. Imagine all the beetles: it squeezed the sour out of life and now plays only peace and love.',
    personality: 'Dreamy, witty and a little rebellious; answers every argument with a peace sign and a smirk.',
    look: 'White-suit elytra worn like a tailcoat over a violet segmented abdomen, long centre-parted hair, round gold wire specs, a black guitar-headstock horn with six pearl tuners, a glowing violet peace sign on its back and a tiny lemon lapel pin.',
    evolvesFrom: 'beatlet', evolveHint: 'Defeat 20 Lemmo and the Alpha Lemmo, the Sour King, with Beatlet in the party.',
  },
  mccarapace: {
    name: 'McCarapace', element: 'hydro', stage: 2, height: '1.25 m',
    desc: 'Its shell resonates like a hollow violin bass, so its bassline carries for kilometres across the Dotonbori canal. It plays left-handed and walks barefoot, just because.',
    personality: 'Sunny, charming and a perfectionist; hums melodies to itself and always tries to keep the party together.',
    look: 'Sunburst violin-bass shell with cream binding, chrome pickups and four strings, a left-handed bass-neck horn with frets and a 2+2 headstock, neat mop-top, big blue doe eyes, Sgt-Pepper-blue shoulders with gold epaulettes and a sea-blue segmented belly.',
    evolvesFrom: 'beatlet',
  },
  harrisun: {
    name: 'Harrisun', element: 'pyro', stage: 2, height: '1.3 m',
    desc: 'Here comes the sun: at dawn its halo ignites and spins, and every cold Elemon nearby feels that it is all right. Its sitar horn drones a single meditative note while it battles.',
    personality: 'Quiet, spiritual and dryly funny; slow to anger but fierce once its gentle guitar weeps.',
    look: 'Saffron robe-patterned gourd shell with maroon and gold trim, long dark centre-parted hair, a little moustache, a sitar horn (gourd base, fretted neck, tumba and side pegs) and a glowing spinning sun halo that sheds embers.',
    evolvesFrom: 'beatlet',
  },
  starrab: {
    name: 'Starrab', element: 'geo', stage: 2, height: '1.0 m',
    desc: 'A scarab whose body is a bass drum; it keeps the beat for every Elemon in its octopus\'s garden. It wears a ring on every one of its six legs and never misses a fill.',
    personality: 'Easy-going, goofy and steady as a metronome; the heart of any team.',
    look: 'Bass-drum body in black oyster pearl with chrome hoops and lugs, a white rear drum head with a red star logo, crash-cymbal elytra, drumstick antennae, a mop-top fringe with blue eyes and a big friendly nose, and gold and pink rings on every leg.',
    evolvesFrom: 'beatlet',
  },
  pebblips: {
    name: 'Pebblips', element: 'geo', stage: 1, height: '0.45 m',
    desc: 'A rolling stone gathers no moss, so Pebblips never stops rolling. It sticks its tongue out at anything that tries to make it sit still.',
    personality: 'Cheeky, restless and attention-seeking; sulks if nobody notices its lips.',
    look: 'Smooth blue-grey river pebble with faint strata, big red pouting lips, a long pink tongue, stubby stone feet and a glowing purple crack on top that hints at the geode inside.',
    evolves: ['jaggeode'],
  },
  jaggeode: {
    name: 'Jaggeode', element: 'geo', stage: 2, height: '1.5 m',
    desc: 'It split itself open to show off the amethyst inside and still can\'t get no satisfaction. It struts so hard that cave crystals hum along.',
    personality: 'Swaggering, vain and never satisfied; a born frontman who hates being upstaged.',
    look: 'Rough geode boulder split along a jagged seam of glowing amethyst, an open quartz-rimmed crystal chest, smug half-lidded purple eyes, huge red lips and tongue, crystal mic-stand spikes, a striped scarf and skinny striped legs in white boots.',
    evolvesFrom: 'pebblips',
  },
  zapanda: {
    name: 'Zapanda', element: 'volto', stage: 1, height: '0.8 m',
    desc: 'Mika\'s partner. Its cheek pouches are living battery cells that it recharges by napping in the sun on Den-Den Town rooftops.',
    personality: 'Curious, loyal and a little vain about its goggles; zaps people it likes.',
    look: 'Rust-red panda with white mask and ear rims, black legs and belly, glowing yellow battery cells on both cheeks, brass goggles pushed up on its forehead and a fluffy black tail ringed with yellow lightning-bolt zigzags and a glowing tip.',
  },
  kanizumo: {
    name: 'Kanizumo', element: 'hydro', stage: 2, height: '1.1 m',
    desc: 'Coach Gonda\'s partner. It once wrestled the giant mechanical crab sign off a Dotonbori restaurant, then apologised and put it back.',
    personality: 'Tough, jolly and honourable; bows before and after every fight and blows bubbles when it laughs.',
    look: 'Wide red sumo-belly carapace with white underside, a black mawashi under a white yokozuna tsuna rope with paper shide, googly eyes on stalks around a glossy chonmage topknot, two enormous white-tipped claws and six spindly legs.',
  },
  studrat: {
    name: 'Studrat', element: 'ferro', stage: 1, height: '0.55 m',
    desc: 'The Team Metallica punks\' favourite. It sharpens its mohawk on train rails and swears it was a Master of Puppets in a past life.',
    personality: 'Scrappy, suspicious and fiercely loyal to its gang; secretly loves cheese.',
    look: 'Grey rat in a black studded leather vest and spiked collar, a steel-spike mohawk running down its back, red punk eyes and buck teeth, a notched and pierced scarred ear, and a chain-link tail that ends in a padlock.',
  },
  moshbull: {
    name: 'Moshbull', element: 'geo', stage: 2, height: '1.4 m',
    desc: 'When the bass drops it charges, and whatever is in front of it becomes the pit. Its stone horns are said to be meteorite fragments.',
    personality: 'Hot-headed, loud and surprisingly gentle with small Elemon after the show.',
    look: 'Dark charcoal bull with huge stone horns and hooves, spiked leather pauldrons, studded straps and leg bands, a gold nose ring, fierce orange eyes and a ragged red-orange mohawk mane from brow to rump.',
  },
  thrashark: {
    name: 'Thrashark', element: 'hydro', stage: 2, height: '0.7 m (1.6 m long)',
    desc: 'The punk leader\'s ace: a land shark that swims through the air a hand\'s width above the asphalt. The buzzsaw on its back never stops spinning, even when it sleeps.',
    personality: 'Aggressive, showy and restless; circles its opponents like a mosh pit.',
    look: 'Navy hovering shark with white countershading, a spinning steel sawblade dorsal fin, a chain necklace, torn studded leather straps, steel spikes on its fins and tail, fierce red eyes and a jagged toothy grin.',
  },
  lemmo: {
    name: 'Lemmo', element: 'volto', stage: 1, height: '0.45 m',
    desc: 'A wild lemon battery common in the safari zone. Squeeze one and you get a jolt of juice and a sour look you will never forget.',
    personality: 'Grumpy, squinty and easily soured, but bursts with zest when it sparks.',
    look: 'Bright yellow lemon with a leaf sprout, a copper strip and a zinc nail stuck in its top like electrodes, sour squinting green eyes, a wobbly pucker and little sparks.',
    evolves: ['alpha_lemmo'],
  },
  alpha_lemmo: {
    name: 'Alpha Lemmo', element: 'volto', stage: 2, height: '2.3 m',
    desc: 'The Sour King of the safari, a boss Lemmo charged with every grudge in the grove. Beat it with Beatlet in your team and life gives you Lenshorn.',
    personality: 'Bitter, proud and theatrical; monologues before every fight.',
    look: 'Giant battery-lemon with a gold-banded crown of leaves and blossoms, crackling glowing bolts on its peel, furious brows with glowing eyes, a jagged grin, a lemon-slice shield, a citrus-reamer juice cannon arm and copper and zinc electrodes joined by a cable.',
    boss: true,
  },
  kagarou: {
    name: 'Kagarou', element: 'pyro', stage: 2, height: '1.2 m',
    desc: 'The fire wolf from the night Osaka burned in the opening cinematic. Its mane is a living flame, and it only bonds with trainers who do not flinch.',
    personality: 'Wild, proud and aggressive; rare and very hard to bond with, fiercely loyal once it does.',
    look: 'Sleek ember-orange wolf whose soot-black legs glow with ember cracks, a living flame mane and cheek ruffs, a flame-tipped tail, black-tipped tall ears and glowing ember eyes.',
  },
  hotarumi: {
    name: 'Hotarumi', element: 'volto', element2: 'bio', stage: 1, height: '0.55 m',
    desc: 'At dusk, Hotarumi gather along the Okawa river and light their lantern abdomens so lost children can find their way home.',
    personality: 'Shy, gentle and nostalgic; glows brighter when it is happy.',
    look: 'Small lilac firefly with big glowing eyes, a red pronotum with a black cross, delicate pale-blue wings, curly glowing antennae and a ribbed yellow-green paper-lantern abdomen with a red crest and tassel.',
  },
};
