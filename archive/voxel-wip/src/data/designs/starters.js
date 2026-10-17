// Tokonmon — the 3 starter lines (9 designs), SDF design DSL (docs/MODELING.md).
// Study notes, colour tables and Do/Don't: docs/refs/tokonmon_starters.md.
// Model space is absolute: metres, +y up, +z = front, left = +x.
//   Pyro  : chilichick → riffrooster (guitarist) | funkadoodle (bassist)
//   Hydro : bubblion   → princeidon (king)       | purple_rain (queen)
//   Bio   : strawbaa   → ramberry (giant ram)    | pennyewe (nurse ewe)
// Every final has forms.elemental; every design has a bond overlay (gimmick
// parts, growth, trainer-hat anchor, aura).

export const DESIGNS = {};
export const LORE = {};

// ---------------------------------------------------------------- helpers
const D2R = Math.PI / 180;
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mx = (p) => [-p[0], p[1], p[2]];
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
// Paint-only stroke along a polyline (markings, tear streams, seams).
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
// Cubic bezier sampled into n+1 points.
function bez3(a, b, c, d, n = 8) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const k0 = u * u * u, k1 = 3 * u * u * t, k2 = 3 * u * t * t, k3 = t * t * t;
    out.push([0, 1, 2].map((j) => k0 * a[j] + k1 * b[j] + k2 * c[j] + k3 * d[j]));
  }
  return out;
}
// Procedural pixel art: n×m rows from f(x, y, r, a) → char ('.' = empty); x,y in [-1,1], y up.
function pix(n, f, m = n) {
  const rows = [];
  for (let j = 0; j < m; j++) {
    let row = '';
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) / n) * 2 - 1, y = 1 - ((j + 0.5) / m) * 2;
      row += f(x, y, Math.hypot(x, y), Math.atan2(y, x)) || '.';
    }
    rows.push(row);
  }
  return rows;
}
// Deterministic pseudo-random in [0,1) for procedural detail.
const prand = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// Euler rotation (deg, XYZ) that maps +y onto unit vector u (for tori / discs along u).
function alignY(u) { u = norm3(u); const c = -Math.asin(Math.max(-1, Math.min(1, u[0]))), a = Math.atan2(u[2], u[1]); return [a / D2R, 0, c / D2R]; }
// n points around the y axis (rings of spines, studs, leaves…): f(angle, x, z, i).
function ring(n, r, a0, f) {
  const out = [];
  for (let i = 0; i < n; i++) { const a = a0 + (i / n) * Math.PI * 2; out.push(f(a, Math.sin(a) * r, Math.cos(a) * r, i)); }
  return out;
}
// Star polygon (n points, outer R, inner r) for 'poly' shapes; jag adds uneven point lengths.
function starPts(n, R, r, a0 = 90, jag = 0, seed = 1) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (a0 + (i * 180) / n) * D2R;
    const rr = i % 2 ? r : R * (1 - jag * prand(seed + i));
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return pts;
}
// Orthonormal frame for props (instruments, parasols, tridents): U along, V across (hint),
// W = U × V out of the face. P(u, v, w) maps local → model space; rot is the Euler (deg, XYZ)
// to give 'poly' (xy plane) and 'ell' shapes the frame's orientation.
function frame(O, U, Vh) {
  U = norm3(U); const W = norm3(cross3(U, Vh)), V = cross3(W, U);
  const P = (u, v = 0, w = 0) => [O[0] + U[0] * u + V[0] * v + W[0] * w, O[1] + U[1] * u + V[1] * v + W[1] * w, O[2] + U[2] * u + V[2] * v + W[2] * w];
  const m13 = W[0], y = Math.asin(Math.max(-1, Math.min(1, m13)));
  const x = Math.abs(m13) < 0.9999999 ? Math.atan2(-W[1], W[2]) : Math.atan2(V[2], V[1]);
  const z = Math.abs(m13) < 0.9999999 ? Math.atan2(-V[0], U[0]) : 0;
  return { P, U, V, W, rot: [x / D2R, y / D2R, z / D2R] };
}
// Flame tongue: a glowing teardrop from base b rising along dir, banded core → mid → outer.
function tongue(b, dir, len, r, { outer = '#ff5a1f', mid = '#ffc233', core = '#fff6c9', glow = 2, m = 0 } = {}) {
  // hard cel bands along the tongue: hot core at the base → mid → outer colour at the tip
  const d = norm3(dir), at = (k) => add3(b, d.map((v) => v * len * k));
  return [
    ['cap', b, at(1), r, r * 0.1, outer, { glow, m, jit: 0.02 }],
    ['cap', b, at(0.55), r * 1.02, r * 0.5, mid, { glow, m, jit: 0.02 }],
    ['cap', b, at(0.22), r * 1.04, r * 0.76, core, { glow: Math.min(3, glow + 1), m, jit: 0 }],
  ];
}

// =====================================================================
// PYRO — CHILICHICK (base)  · docs/refs/tokonmon_starters.md §1
// A plump glossy chili pod with a chick's face, calyx beret + curled stem,
// always chewing a green pepper, two waterfall tears, hiccups fire.
// =====================================================================
{
  const vs = 0.023;
  const HC = [0, 0.375, 0.0], HR = [0.2, 0.18, 0.188];      // upper gourd (head mass, widest at the cheeks)
  const BC = [0, 0.2, -0.015], BR = [0.135, 0.15, 0.14];     // lower gourd, blended into one teardrop pod
  const gourd = [
    ['ell', HC, HR, 'r', { belly: 'R', bellyT: 0.75 }],
    ['ell', BC, BR, 'r', { blend: 0.07, belly: 'R', bellyT: 0.55 }],
  ];
  const eyeL = [0.086, 0.37, 0.17];
  // tear streams: from under each eye, sliding down the cheeks onto the body
  const tearHead = (s) => [onEll(HC, HR, [s * 0.44, -0.12, 0.9]), onEll(HC, HR, [s * 0.52, -0.36, 0.8]), onEll(HC, HR, [s * 0.56, -0.5, 0.7])];
  const tearBody = (s) => [onEll(HC, HR, [s * 0.56, -0.5, 0.7]), onEll(BC, BR, [s * 0.66, 0.3, 0.7]), onEll(BC, BR, [s * 0.7, -0.05, 0.7]), onEll(BC, BR, [s * 0.66, -0.35, 0.68])];
  const tears = (pts) => [...stroke(pts, 0.025, 't', { glow: 1, jit: 0 }), ...stroke(pts.slice(0, -1), 0.008, 'T', { glow: 1, jit: 0 })];
  // pepper lobes: two shallow vertical grooves down the front, painted a step darker
  const groove = (s, y0, y1, C = HC, R = HR) => stroke([onEll(C, R, [s * 0.36, y0, 0.93]), onEll(C, R, [s * 0.42, (y0 + y1) / 2, 0.9]), onEll(C, R, [s * 0.4, y1, 0.9])], 0.011, 'R', { jit: 0.02 });
  const SPARK = starPts(7, 0.088, 0.036, 96, 0.32, 7);
  DESIGNS.chilichick = {
    id: 'chilichick', vs, arch: 'biped',
    pal: {
      r: '#e8321e', R: '#b8202c', h: '#ff8a5c', H: '#ffe3c8',
      g: '#3e9e3a', G: '#8fd45a', q: '#1e5e46',
      y: '#ffd34d', Y: '#fff1b8', o: '#e89a2e',
      b: '#ffa41c', B: '#c9601a',
      t: '#6fd3ff', T: '#e8fbff',
      j: '#52b844', J: '#b6ee7a', p: '#ff5c7a',
      f: '#ff5a1f', F: '#ffc233', c: '#fff6c9',
    },
    anim: { quirk: ['eat', 'hop', 'shakeoff', 'happy', 'eat'], bounce: 1.35, gait: 1.35, stride: 1.25, tail: 1.2, maxSpeed: 5.6, dodgeSpin: 1 },
    parts: [
      // head and body are one glossy gourd (no neck): a single part, so the pod never splits
      { n: 'body', p: [0, 0.16, 0], s: [
        ...gourd,
        ...groove(1, 0.55, -0.4), ...groove(-1, 0.55, -0.4),
        ...groove(1, 0.2, -0.75, BC, BR), ...groove(-1, 0.2, -0.75, BC, BR),
        // chest bib: an uneven 7-point spark of cream-yellow down (the line's motif)
        ['poly', [0.006, 0.19, 0.14], SPARK, 0.07, 'Y', { paint: 1, rot: [10, 0, 0] }],
        ['poly', [0.006, 0.19, 0.14], starPts(7, 0.04, 0.02, 110, 0.3, 3), 0.07, 'y', { paint: 1, rot: [10, 0, 0] }],
        ...tears(tearHead(1)), ...tears(tearHead(-1)),
        ...tears(tearBody(1)), ...tears(tearBody(-1)),
        // waxy specular streaks on the lit side (exocarp gloss)
        ...stroke([onEll(HC, HR, [-0.46, 0.64, 0.58]), onEll(HC, HR, [-0.62, 0.44, 0.6]), onEll(HC, HR, [-0.7, 0.24, 0.62])], 0.012, 'H', { jit: 0 }),
        ...stroke([onEll(BC, BR, [-0.66, 0.4, 0.6]), onEll(BC, BR, [-0.78, 0.0, 0.58])], 0.012, 'h', { jit: 0 }),
        // cheek down-tufts puffing out at the widest point
        ['ell', [0.185, 0.335, 0.03], [0.04, 0.045, 0.055], 'y', { m: 1 }],
        ['cap', [0.195, 0.345, 0.04], [0.244, 0.368, 0.05], 0.025, 0.006, 'y', { m: 1 }],
        ['cap', [0.2, 0.33, 0.035], [0.246, 0.318, 0.045], 0.025, 0.006, 'y', { m: 1 }],
        ['cap', [0.195, 0.315, 0.02], [0.234, 0.29, 0.025], 0.023, 0.006, 'o', { m: 1 }],
        // calyx beret: a 5-point green star cap draped over the top + a little beret puff
        ['poly', [0.012, 0.52, -0.012], starPts(5, 0.172, 0.085, 98), 0.075, 'g', { plane: 'xz', rot: [-8, 0, 10], paint: 1 }],
        ['poly', [0.012, 0.52, -0.012], starPts(5, 0.1, 0.05, 98), 0.075, 'G', { plane: 'xz', rot: [-8, 0, 10], paint: 1 }],
        ['ell', [0.016, 0.54, -0.014], [0.092, 0.042, 0.09], 'g', { rot: [-8, 0, 10], top: 'G', topT: 0.8 }],
        // beak (upper mandible)
        ['cap', [0, 0.322, 0.158], [0, 0.302, 0.262], 0.05, 0.012, 'b', { belly: 'B', bellyT: 0.65 }],
        // the pepper it is always chewing, sticking out of the beak like a lollipop
        ['cap', [-0.012, 0.296, 0.24], [-0.11, 0.262, 0.275], 0.026, 0.02, 'j'],
        ['cap', [-0.11, 0.262, 0.275], [-0.165, 0.238, 0.266], 0.02, 0.006, 'j'],
        ...stroke([[-0.04, 0.305, 0.266], [-0.12, 0.277, 0.292]], 0.006, 'J', { jit: 0 }),
        ['cap', [0.012, 0.3, 0.238], [0.03, 0.302, 0.232], 0.013, 0.01, 'q'],
      ] },
      { n: 'jaw', parent: 'body', p: [0, 0.3, 0.17], s: [
        ['cap', [0, 0.29, 0.155], [0, 0.28, 0.236], 0.036, 0.01, 'B'],
      ] },
      { n: 'stem', parent: 'body', p: [0.016, 0.57, -0.014], sway: { axis: 'z', amp: 0.12, freq: 1.6 }, s: [
        ...tube(bez3([0.016, 0.55, -0.014], [0.0, 0.62, -0.045], [0.06, 0.685, -0.025], [0.066, 0.64, 0.03], 8), 0.026, 0.012, 'q', {}),
        ['sph', [0.066, 0.64, 0.03], 0.014, 'q'],
      ] },
      { n: 'crest', parent: 'body', p: [0, 0.5, -0.11], s: [
        ...tongue([0, 0.5, -0.12], [0, 1, -0.55], 0.11, 0.032),
        ...tongue([0.035, 0.48, -0.13], [0.35, 0.9, -0.6], 0.08, 0.026),
        ...tongue([-0.035, 0.48, -0.13], [-0.35, 0.9, -0.6], 0.08, 0.026),
      ] },
      { n: 'wingL', parent: 'body', p: [0.135, 0.25, 0.0], mirror: true, s: [
        ['ell', [0.155, 0.19, -0.005], [0.036, 0.075, 0.068], 'y', { rot: [0, 0, 16], belly: 'o', bellyT: 0.5 }],
        ['cap', [0.17, 0.15, 0.028], [0.188, 0.108, 0.036], 0.021, 0.007, 'o'],
        ['cap', [0.17, 0.15, -0.008], [0.19, 0.103, -0.01], 0.021, 0.007, 'o'],
        ['cap', [0.165, 0.15, -0.042], [0.18, 0.112, -0.056], 0.019, 0.006, 'o'],
      ] },
      { n: 'legL', parent: 'body', p: [0.06, 0.1, 0.0], mirror: true, s: [
        ['cap', [0.06, 0.1, 0.0], [0.066, 0.03, 0.012], 0.026, 0.021, 'b'],
        ['cap', [0.066, 0.022, 0.012], [0.068, 0.014, 0.078], 0.017, 0.011, 'b'],
        ['cap', [0.066, 0.022, 0.012], [0.108, 0.014, 0.062], 0.015, 0.009, 'b'],
        ['cap', [0.066, 0.022, 0.012], [0.026, 0.014, 0.062], 0.015, 0.009, 'b'],
        ['cap', [0.066, 0.022, 0.012], [0.066, 0.016, -0.03], 0.013, 0.008, 'B'],
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.12, -0.1], s: [
        ...tube(bez([0, 0.13, -0.09], [0, 0.07, -0.15], [0, 0.085, -0.2], 4), 0.055, 0.032, 'r', { belly: 'R', bellyT: 0.4 }),
      ] },
      { n: 'tail2', parent: 'tail', p: [0, 0.085, -0.2], sway: { axis: 'x', amp: 0.08, freq: 1.3 }, s: [
        ...tube(bez([0, 0.085, -0.2], [0, 0.1, -0.255], [0, 0.175, -0.245], 4), 0.032, 0.008, 'r'),
        ...stroke([[0, 0.1, -0.22], [0, 0.15, -0.25]], 0.007, 'h', { jit: 0 }),
      ] },
    ],
    eyes: {
      part: 'body', at: eyeL, dir: [0.42, 0.04, 1], style: 'big', iris: '#ffb12b', px: 0.68, depth: 1,
      rows: ['..kkk..', '.kkkkk.', 'kwwkkik', 'kwwkkik', 'kikkkak', 'kaaaawk', '.kbbbk.', '..bbb..'],
      cmap: { i: '#8a2a22', a: '#ffb12b', b: '#7fdcff' },
    },
    mouth: { part: 'body', at: [0, 0.3, 0.245], dir: [0, -0.1, 1], style: 'beak', px: 0.55 },
    decals: [
      // hot flush: three pink hatch lines on each cheek
      { part: 'body', at: [0.148, 0.312, 0.128], dir: [0.75, -0.15, 0.65], rows: ['..p..p..p', '.p..p..p.', 'p..p..p..'], cmap: { p: '#ff7a96' }, px: 0.55, mirror: true },
    ],
    fx: [
      { part: 'body', at: [0.135, 0.16, 0.12], type: 'drip', rate: 1.4, scale: 0.7, mirror: true },
      { part: 'body', at: [0.15, 0.3, 0.12], type: 'steam', rate: 0.25, scale: 0.35, mirror: true },
      { part: 'stem', at: [0.065, 0.66, 0.035], type: 'steam', rate: 0.35, scale: 0.4 },
      { part: 'crest', at: [0, 0.6, -0.17], type: 'flame', rate: 0.35, scale: 0.4 },
      { part: 'jaw', at: [0, 0.29, 0.25], type: 'ember', rate: 0.5, scale: 0.6 },
      { part: 'tail2', at: [0, 0.21, -0.3], type: 'ember', rate: 0.6, scale: 0.6 },
    ],
    bond: {
      // blazing crest: the little flame behind the stem becomes a tall fire mohawk, the chest spark glows
      parts: [
        { n: 'mohawk', parent: 'body', p: [0, 0.52, -0.1], s: [
          ...tongue([0, 0.53, -0.04], [0, 1, -0.25], 0.2, 0.045),
          ...tongue([0, 0.5, -0.12], [0, 1, -0.75], 0.2, 0.042),
          ...tongue([0, 0.44, -0.17], [0, 0.6, -1], 0.17, 0.036),
          ...tongue([0, 0.37, -0.19], [0, 0.2, -1], 0.13, 0.03),
        ] },
        { n: 'sparkGlow', parent: 'body', p: [0, 0.2, 0.16], s: [
          ['poly', [0.008, 0.195, 0.172], SPARK, 0.006, 'F', { glow: 2, rot: [12, 0, 0] }],
          ['poly', [0.008, 0.195, 0.176], starPts(7, 0.036, 0.018, 110, 0.3, 3), 0.006, 'c', { glow: 3, rot: [12, 0, 0] }],
        ] },
      ],
      grow: { crest: 1.9 },
      hat: { part: 'body', at: [0.01, 0.55, -0.01], scale: 0.82, tilt: -6, roll: 10 },
      aura: 'flame', auraColor: [3.0, 1.6, 0.5, 1],
    },
  };
  LORE.chilichick = {
    name: 'Chilichick', element: 'pyro', stage: 1, height: '0.6 m',
    desc: 'A chili pod that stood up and grew a face. It cannot stop eating peppers even though every bite makes it cry, and the heat it swallows comes back out as hiccups of fire. Its tears hiss into steam the moment they touch its cheeks.',
    personality: 'Teary but stubborn. Cries at every bite, then reaches for a hotter pepper; brave, loud and a little dramatic.',
    look: 'A glossy red habanero-shaped chick with two soft pepper lobes, a green star-shaped calyx beret with a curled stem cowlick, a small flame crest behind it, yellow cheek down-tufts, a cream spark-shaped chest bib, stubby yellow wings and short orange legs. A green pepper always sticks out of its beak, and two bright blue tear streams run down its flushed cheeks.',
    evolves: ['riffrooster', 'funkadoodle'],
  };
}

// =====================================================================
// PYRO/ECHO — RIFFROOSTER (main final)  · tokonmon_starters.md §2
// Lean upright gamecock rock guitarist: flame comb, hackle mane, dried
// tear-track war paint, sunburst pepper-gourd guitar slung diagonally,
// burning sickle tail. Close range, fast, scary (dark-cored) fire.
// =====================================================================
{
  const vs = 0.04;
  const HC = [0, 1.59, 0.05], HR = [0.12, 0.13, 0.14];
  const G = frame([-0.1, 1.0, 0.27], [Math.cos(42 * D2R), Math.sin(42 * D2R), 0], [-Math.sin(42 * D2R), Math.cos(42 * D2R), -0.32]);
  const GK = 1.16, P = (u, v = 0, w = 0) => G.P(u * GK, v * GK, w), gr = G.rot;
  const hand = P(0.44, 0.0, 0.02);                                   // fretting hand on the neck
  const pick = P(-0.06, -0.05, 0.08);                                // picking hand over the strings
  const ristra = [[0.2, 1.22, 0.23], [0.24, 1.4, 0.04], [0.08, 1.24, -0.2], [-0.12, 1.02, -0.2], [-0.27, 0.86, -0.06], [-0.3, 0.8, 0.12]];
  const ristraPeppers = [];
  for (let i = 0; i < ristra.length - 1; i++) for (let t = 0.15; t < 1; t += 0.36) {
    const a = lerp3(ristra[i], ristra[i + 1], t);
    ristraPeppers.push(['cap', a, [a[0] * 1.06, a[1] - 0.055, a[2] * 1.06 + 0.01], 0.026, 0.008, 'p'], ['sph', a, 0.016, 'q']);
  }
  // three sickle tail feathers (black root → crimson → burning tip)
  const sickle = (x, k) => bez3([x, 1.0, -0.16], [x * 1.6, 1.42 + k * 0.05, -0.36], [x * 2.2, 1.6 + k * 0.08, -0.66 - k * 0.04], [x * 2.4, 1.36 + k * 0.1, -0.92 - k * 0.06], 8);
  const SK = [[-0.055, -1], [0, 1], [0.055, 0]].map(([x, k]) => sickle(x, k));
  const scale = (n) => ['cap', [0.125 * n, 0.5, 0.05], [0.12 * n, 0.12, 0.0], 0.047, 0.036, 'y', { stripes: { axis: 'y', p: 0.085, w: 0.014, col: 'v', o: 0.01 } }];
  DESIGNS.riffrooster = {
    id: 'riffrooster', vs, arch: 'biped',
    pal: {
      r: '#c4182c', R: '#74103a', l: '#f0503a', T: '#c4182c',
      m: '#ff7a1a', M: '#ffc23d', n: '#a8301c',
      c: '#ff3a2e', C: '#ffd27a',
      k: '#1c1220', K: '#4a3550',
      y: '#e9b44c', Y: '#ffe8a8', u: '#9c6a2e', v: '#cf9440',
      e: '#2b0b0e', g: '#b3201a', a: '#ffb12e', w: '#f6e7c8', s: '#d8d8e0', b: '#3a1a14', x: '#ff7a2e',
      p: '#d9261c', q: '#3e7a2e',
      f: '#ff5a1f', F: '#ffc233', h: '#fff6c9', z: '#fff0d6',
    },
    anim: { quirk: ['headbang', 'flex', 'roar', 'headbang'], bounce: 0.9, gait: 1.25, stride: 1.15, tail: 0.8, maxSpeed: 7.2, dodgeSpin: 1 },
    parts: [
      { n: 'body', p: [0, 0.9, 0], s: [
        ['ell', [0, 1.08, -0.01], [0.21, 0.3, 0.18], 'r'],
        ['ell', [0, 1.25, 0.02], [0.27, 0.14, 0.18], 'r', { blend: 0.08 }],
        ['ell', [0, 0.88, -0.05], [0.18, 0.12, 0.17], 'r', { blend: 0.06 }],
        ['cap', [0, 1.3, 0.0], [0, 1.5, 0.04], 0.1, 0.08, 'r', { blend: 0.04 }],
        ['ell', [0, 1.13, 0.16], [0.15, 0.22, 0.09], 'l', { paint: 1 }],
        // saddle feathers fanning over the hips like a jacket hem
        ...[70, 105, 140, 180, 220, 255, 290].map((a, i) => ['cap', [Math.sin(a * D2R) * 0.15, 0.94, Math.cos(a * D2R) * 0.14 - 0.05], [Math.sin(a * D2R) * 0.25, 0.7 + (i % 2) * 0.04, Math.cos(a * D2R) * 0.22 - 0.07], 0.06, 0.016, 'r', { tip: 'k', tipT: 0.62 }]),
        // the chili ristra strap
        ...tube(ristra, 0.014, 0.014, 'n'),
        ...ristraPeppers,
      ] },
      { n: 'head', parent: 'body', p: [0, 1.48, 0.03], s: [
        ['ell', HC, HR, 'r'],
        ['ell', [0, 1.55, 0.1], [0.08, 0.07, 0.09], 'r', { blend: 0.04 }],
        // dried tear tracks → soot war paint
        ...stroke([onEll(HC, HR, [0.74, -0.22, 0.62]), onEll(HC, HR, [0.74, -0.55, 0.46]), onEll(HC, HR, [0.64, -0.88, 0.28])], 0.016, 'k', { jit: 0 }),
        ...stroke([onEll(HC, HR, [-0.74, -0.22, 0.62]), onEll(HC, HR, [-0.74, -0.55, 0.46]), onEll(HC, HR, [-0.64, -0.88, 0.28])], 0.016, 'k', { jit: 0 }),
        // short hooked bone-yellow beak
        ['cap', [0, 1.57, 0.165], [0, 1.548, 0.262], 0.046, 0.014, 'y', { belly: 'u', bellyT: 0.6 }],
        ['cap', [0, 1.548, 0.262], [0, 1.515, 0.272], 0.014, 0.007, 'y'],
        // wattles: two small flame-red drops
        ['ell', [0.03, 1.47, 0.16], [0.024, 0.048, 0.024], 'c', { m: 1, glow: 1 }],
        // pepper-stem toothpick in the beak corner (still always eating a pepper)
        ['cap', [-0.035, 1.535, 0.205], [-0.11, 1.515, 0.275], 0.013, 0.01, 'q'],
      ] },
      { n: 'jaw', parent: 'head', p: [0, 1.54, 0.16], s: [
        ['cap', [0, 1.538, 0.16], [0, 1.522, 0.235], 0.03, 0.01, 'u'],
      ] },
      // single comb: five sawtooth points, each a live flame tongue
      { n: 'comb', parent: 'head', p: [0, 1.68, 0.04], s: [
        ['poly', [0, 1.66, 0.04], [[0.15, -0.04], [0.16, 0.05], [0.12, 0.12], [0.09, 0.04], [0.06, 0.16], [0.02, 0.06], [-0.02, 0.19], [-0.05, 0.06], [-0.09, 0.17], [-0.11, 0.04], [-0.16, 0.12], [-0.15, -0.05]].map(([z, y]) => [z, y]), 0.026, 'c', { plane: 'zy', glow: 1, grad: { axis: 'y', to: 'C', a: 1.74, b: 1.86 } }],
        ...tongue([0, 1.77, 0.17], [0, 1, 0.45], 0.08, 0.036, { outer: 'c', mid: 'F', core: 'h' }),
        ...tongue([0, 1.8, 0.09], [0, 1, 0.2], 0.1, 0.04, { outer: 'c', mid: 'F', core: 'h' }),
        ...tongue([0, 1.83, 0.01], [0, 1, -0.05], 0.11, 0.042, { outer: 'c', mid: 'F', core: 'h' }),
        ...tongue([0, 1.81, -0.06], [0, 1, -0.3], 0.1, 0.04, { outer: 'c', mid: 'F', core: 'h' }),
        ...tongue([0, 1.76, -0.13], [0, 0.8, -0.6], 0.09, 0.036, { outer: 'c', mid: 'F', core: 'h' }),
      ] },
      // hackle mane: long shaggy feathers falling past the shoulders like 90s rocker hair
      { n: 'mane', parent: 'head', p: [0, 1.6, -0.03], sway: { axis: 'x', amp: 0.05, freq: 1.4 }, s: [
        ...[-100, -76, -52, -28, -8, 12, 34, 58, 82, 104].flatMap((a, i) => {
          const ar = a * D2R, sa = Math.sin(ar), ca = -Math.cos(ar), alt = i % 2;
          const r0 = [sa * 0.1, 1.6 - Math.abs(sa) * 0.11, 0.03 + ca * 0.1];
          const r1 = [sa * 0.2, 1.42 - alt * 0.05, 0.0 + ca * 0.17];
          const r2 = [sa * 0.25, 1.2 - (i % 3) * 0.06, -0.02 + ca * 0.21];
          return [['cap', r0, r1, 0.05, 0.036, alt ? 'M' : 'm'], ['cap', r1, r2, 0.036, 0.008, alt ? 'M' : 'm', { tip: 'n', tipT: 0.55 }]];
        }),
      ] },
      // fretting wing-arm (left): primaries as fingers around the guitar neck
      { n: 'armL', parent: 'body', p: [0.25, 1.28, 0.0], s: [
        ['sph', [0.25, 1.28, 0.0], 0.085, 'r'],
        ['cap', [0.25, 1.28, 0.0], [0.37, 1.07, 0.06], 0.075, 0.058, 'r'],
        ['cap', [0.37, 1.07, 0.06], [hand[0] + 0.03, hand[1] - 0.02, hand[2] - 0.02], 0.056, 0.045, 'r'],
        ['cap', [0.37, 1.1, 0.04], [0.42, 0.9, -0.04], 0.04, 0.012, 'k'],
        ['cap', [0.36, 1.08, 0.0], [0.39, 0.92, -0.1], 0.036, 0.01, 'k'],
        ['cap', hand, add3(hand, [-0.05, 0.05, 0.06]), 0.03, 0.014, 'k'],
        ['cap', hand, add3(hand, [-0.07, 0.0, 0.06]), 0.03, 0.014, 'k'],
        ['cap', hand, add3(hand, [-0.06, -0.05, 0.05]), 0.028, 0.012, 'k'],
      ] },
      // picking wing-arm (right) with the studded black leather wristband
      { n: 'armR', parent: 'body', p: [-0.25, 1.28, 0.0], s: [
        ['sph', [-0.25, 1.28, 0.0], 0.085, 'r'],
        ['cap', [-0.25, 1.28, 0.0], [-0.36, 1.04, -0.01], 0.075, 0.058, 'r'],
        ['cap', [-0.36, 1.04, -0.01], [pick[0] - 0.03, pick[1], pick[2] - 0.05], 0.056, 0.045, 'r'],
        ['cap', [-0.36, 1.06, -0.02], [-0.42, 0.88, -0.1], 0.04, 0.012, 'k'],
        ['cyl', lerp3([-0.36, 1.04, -0.01], [pick[0] - 0.03, pick[1], pick[2] - 0.05], 0.62), lerp3([-0.36, 1.04, -0.01], [pick[0] - 0.03, pick[1], pick[2] - 0.05], 0.8), 0.06, 'k'],
        ...[0, 1, 2].map((i) => ['sph', lerp3([-0.36, 1.04, -0.01], [pick[0] - 0.03, pick[1], pick[2] - 0.05], 0.66 + i * 0.06).map((v, j) => v + [0, 0.055, 0.02][j]), 0.016, 'p']),
        ['cap', pick, add3(pick, [0.04, 0.05, 0.05]), 0.03, 0.014, 'k'],
        ['cap', pick, add3(pick, [0.06, 0.0, 0.05]), 0.03, 0.014, 'k'],
        ['cap', pick, add3(pick, [0.05, -0.05, 0.04]), 0.028, 0.012, 'k'],
      ] },
      // the pepper-gourd guitar: 3-tone fire sunburst, flame-tongue horns, feather pickguard,
      // ember pickups, rooster-comb headstock with six inline pegs
      { n: 'guitar', parent: 'armL', p: hand, s: [
        ['ell', P(-0.12, 0, 0), [0.205 * GK, 0.19 * GK, 0.055], 'e', { rot: gr }],
        ['ell', P(0.085, 0.01, 0), [0.13 * GK, 0.145 * GK, 0.052], 'e', { rot: gr, blend: 0.05 }],
        ...tube(bez(P(0.1, 0.1, 0), P(0.24, 0.17, 0), P(0.34, 0.12, 0), 4), 0.05, 0.01, 'e'),
        ...tube(bez(P(0.08, -0.11, 0), P(0.18, -0.16, 0), P(0.25, -0.11, 0), 4), 0.045, 0.01, 'e'),
        ['ell', P(-0.11, 0, 0), [0.18 * GK, 0.168 * GK, 0.2], 'g', { rot: gr, paint: 1 }],
        ['ell', P(0.075, 0.01, 0), [0.105 * GK, 0.122 * GK, 0.2], 'g', { rot: gr, paint: 1 }],
        ['ell', P(-0.07, 0, 0), [0.125 * GK, 0.115 * GK, 0.2], 'a', { rot: gr, paint: 1 }],
        // feather pickguard with the line's spark motif
        ['poly', P(-0.1, -0.08, 0.05), [[-0.16, 0.0], [-0.1, 0.06], [0.02, 0.075], [0.12, 0.06], [0.2, 0.02], [0.24, -0.01], [0.16, -0.04], [0.04, -0.06], [-0.08, -0.06]].map(([u, v]) => [u * GK, v * GK]), 0.025, 'w', { rot: gr, paint: 1 }],
        ['poly', P(-0.02, -0.1, 0.05), starPts(7, 0.045, 0.02, 90, 0.3, 7), 0.025, 'g', { rot: gr, paint: 1 }],
        // ember pickups + bridge
        ...[-0.19, -0.1, -0.01].map((u) => ['box', P(u, 0.0, 0.048), [0.014, 0.05, 0.014], 'x', { rot: gr, glow: 2 }]),
        ['box', P(-0.26, 0, 0.048), [0.02, 0.06, 0.014], 's', { rot: gr }],
        // neck + frets + strings
        ['box', P(0.42, 0, 0.005), [0.24 * GK, 0.036, 0.03], 'b', { rot: gr }],
        ...[0.3, 0.38, 0.46, 0.53, 0.6].map((u) => ['box', P(u, 0, 0.03), [0.012, 0.04, 0.02], 's', { rot: gr, paint: 1 }]),
        ...stroke([P(-0.27, 0, 0.055), P(0.66, 0, 0.035)], 0.014, 's', { jit: 0 }),
        // rooster-comb headstock + six inline pegs
        ['poly', P(0.73, 0.0, 0), [[-0.08, -0.04], [-0.08, 0.04], [-0.05, 0.085], [-0.025, 0.05], [0.01, 0.1], [0.035, 0.05], [0.07, 0.09], [0.09, 0.03], [0.1, -0.04]].map(([u, v]) => [u * GK, v * GK]), 0.026, 'e', { rot: gr }],
        ['poly', P(0.73, 0.0, 0), [[-0.06, 0.05], [-0.05, 0.085], [-0.025, 0.05], [0.01, 0.1], [0.035, 0.05], [0.07, 0.09], [0.09, 0.03], [0.09, 0.06], [0.07, 0.1], [0.035, 0.07], [0.01, 0.12], [-0.025, 0.07], [-0.05, 0.1]].map(([u, v]) => [u * GK, v * GK]), 0.028, 'c', { rot: gr }],
        ...[0, 1, 2, 3, 4, 5].map((i) => ['sph', P(0.665 + i * 0.033, -0.055, 0.0), 0.017, 's']),
      ] },
      { n: 'legL', parent: 'body', p: [0.11, 0.84, -0.01], mirror: true, s: [
        ['cap', [0.11, 0.86, -0.01], [0.13, 0.54, 0.04], 0.1, 0.07, 'T'],
        ['cap', [0.13, 0.58, 0.04], [0.133, 0.47, 0.05], 0.07, 0.046, 'T', { tip: 'R', tipT: 0.5 }],
        scale(1),
        ['cap', [0.12, 0.1, 0.0], [0.13, 0.03, 0.17], 0.03, 0.02, 'y'],
        ['cap', [0.12, 0.1, 0.0], [0.2, 0.03, 0.12], 0.028, 0.018, 'y'],
        ['cap', [0.12, 0.1, 0.0], [0.05, 0.03, 0.13], 0.028, 0.018, 'y'],
        ['cap', [0.12, 0.08, -0.01], [0.12, 0.03, -0.1], 0.024, 0.014, 'u'],
        // spur
        ['cap', [0.115, 0.22, -0.03], [0.11, 0.18, -0.12], 0.024, 0.008, 'y', { tip: 'z', tipT: 0.55 }],
      ] },
      { n: 'tail', parent: 'body', p: [0, 1.0, -0.16], s: [
        ...SK.flatMap((pts) => tube(pts.slice(0, 5), 0.05, 0.036, 'k')),
      ] },
      { n: 'tail2', parent: 'tail', p: SK[1][4], sway: { axis: 'x', amp: 0.06, freq: 1.2 }, s: [
        ...SK.flatMap((pts) => tube(pts.slice(4), 0.036, 0.014, 'r', { tip: 'c', tipT: 0.7 })),
        ...SK.flatMap((pts) => tongue(pts[7], [0, 0.1, -1], 0.13, 0.04)),
      ] },
    ],
    eyes: {
      part: 'head', at: [0.085, 1.61, 0.12], dir: [0.78, 0.06, 0.62], style: 'fierce', iris: '#f2e6d0', px: 0.62,
      rows: ['bbbbb.', 'kiidik', '.kkkk.'], cmap: { b: '#1c1220', k: '#5a0c22', d: '#1c1220' },
    },
    mouth: { part: 'head', at: [0, 1.545, 0.25], dir: [0, -0.1, 1], style: 'beak', px: 0.5 },
    fx: [
      { part: 'comb', at: [0, 1.88, 0.06], type: 'flame', rate: 0.5, scale: 0.55 },
      { part: 'comb', at: [0, 1.86, -0.08], type: 'flame', rate: 0.4, scale: 0.45 },
      { part: 'tail2', at: SK[1][8], type: 'flame', rate: 0.6, scale: 0.6 },
      { part: 'tail2', at: SK[0][8], type: 'ember', rate: 0.6, scale: 0.7 },
      { part: 'legL', at: [0.12, 0.08, 0.0], type: 'ember', rate: 0.5, scale: 0.6, mirror: true },
      { part: 'guitar', at: P(-0.1, 0, 0.07), type: 'note', rate: 0.25, scale: 0.8, color: '#f389f5' },
    ],
    bond: {
      // blazing crest: the comb flames triple and stream back; the mane is partly fire; spurs white-hot
      parts: [
        { n: 'combFire', parent: 'comb', p: [0, 1.8, 0.0], s: [
          ...tongue([0, 1.8, 0.14], [0, 0.85, -0.5], 0.2, 0.04),
          ...tongue([0, 1.83, 0.04], [0, 0.7, -0.7], 0.26, 0.045),
          ...tongue([0, 1.8, -0.06], [0, 0.5, -0.9], 0.28, 0.042),
          ...tongue([0, 1.74, -0.13], [0, 0.25, -1], 0.24, 0.036),
        ] },
        { n: 'maneFire', parent: 'mane', p: [0, 1.4, -0.12], s: [
          ...[-70, -25, 25, 70].flatMap((a) => tongue([Math.sin(a * D2R) * 0.2, 1.45, -Math.cos(a * D2R) * 0.17], [Math.sin(a * D2R) * 0.4, -0.2, -1], 0.16, 0.035)),
        ] },
        { n: 'spurL', parent: 'legL', mirror: true, p: [0.115, 0.2, -0.04], s: [
          ['cap', [0.115, 0.22, -0.03], [0.11, 0.17, -0.14], 0.03, 0.01, 'z', { glow: 3 }],
        ] },
      ],
      grow: { comb: 1.45, mane: 1.12 },
      hat: { part: 'head', at: [0, 1.665, 0.07], scale: 0.74, tilt: 14, roll: -6 },
      aura: 'flame', auraColor: [3.0, 1.2, 0.7, 1],
    },
    forms: {
      elemental: {
        // scary fire on the body: black-red core with pink-white rim lines; waist down is living flame
        pal: { T: '#ff6a1f', r: '#6a0c2a', R: '#3b0a26', l: '#c4183c', m: '#ff2e55', M: '#fff0d6', n: '#8a0e3e', c: '#ff2e55', C: '#fff0d6', a: '#fff3c0', g: '#ff5a1f', y: '#ffcf8a', u: '#c2421e', x: '#fff0d6', p: '#ff5a1f' },
        parts: [
          // crown of five pillar flames
          { n: 'pillars', parent: 'head', p: [0, 1.75, 0.03], s: [
            ...[0.15, 0.075, 0.0, -0.075, -0.14].flatMap((z, i) => tongue([0, 1.8 + (i === 2 ? 0.03 : 0), z], [0, 1, z * 0.8], 0.34 - Math.abs(i - 2) * 0.06, 0.05, { outer: 'c', mid: 'F', core: 'h', glow: 3 })),
          ] },
          // waist down: fire feathers with hard cel bands
          { n: 'flameSkirt', parent: 'body', p: [0, 0.86, -0.02], s: [
            ...[0, 40, 80, 120, 160, 200, 240, 280, 320].flatMap((a) => tongue([Math.sin(a * D2R) * 0.17, 0.92, Math.cos(a * D2R) * 0.15 - 0.04], [Math.sin(a * D2R) * 0.5, -1, Math.cos(a * D2R) * 0.45], 0.26, 0.05, { outer: 'f', mid: 'F', core: 'h', glow: 2 })),
          ] },
          { n: 'legFireL', parent: 'legL', mirror: true, p: [0.13, 0.5, 0.04], s: [
            ...tongue([0.16, 0.74, 0.02], [0.35, -1, -0.1], 0.34, 0.065, { glow: 2 }),
            ...tongue([0.15, 0.5, 0.06], [0.25, -1, 0.2], 0.3, 0.055, { glow: 2 }),
            ...tongue([0.1, 0.62, -0.05], [-0.1, -1, -0.4], 0.32, 0.06, { glow: 2 }),
          ] },
          // tear tracks glow like magma cracks; the strings turn to fire; spectral stone at the chest
          { n: 'magma', parent: 'head', p: [0, 1.56, 0.1], s: [
            ...[1, -1].flatMap((s2) => tube([onEll(HC, HR, [s2 * 0.74, -0.22, 0.62]), onEll(HC, HR, [s2 * 0.74, -0.55, 0.46]), onEll(HC, HR, [s2 * 0.64, -0.88, 0.28])].map((q) => [q[0] * 1.06, q[1], q[2] + 0.008]), 0.016, 0.012, 'F', { glow: 3 })),
          ] },
          { n: 'fireStrings', parent: 'guitar', p: hand, s: [
            ...tube([P(-0.27, 0.02, 0.07), P(0.66, 0.02, 0.05)], 0.014, 0.014, 'F', { glow: 3 }),
            ...tube([P(-0.27, -0.02, 0.07), P(0.66, -0.02, 0.05)], 0.012, 0.012, 'h', { glow: 3 }),
          ] },
          { n: 'stone', parent: 'body', p: [0, 1.22, 0.19], s: [
            ['ell', [0, 1.22, 0.205], [0.035, 0.05, 0.025], '#a8f4ff', { glow: 3 }],
          ] },
        ],
        eyes: { rows: ['bbbbb.', 'kggdgk', '.kkkk.'], cmap: { b: '#1c1220', k: '#ff2e55', d: '#1c1220', g: { c: '#fff0d6', glow: 3 } } },
        fx: [
          { part: 'pillars', at: [0, 2.12, 0.0], type: 'flame', rate: 1.2, scale: 0.9 },
          { part: 'flameSkirt', at: [0, 0.7, 0.0], type: 'flame', rate: 1.6, scale: 1.1 },
          { part: 'legFireL', at: [0.14, 0.2, -0.04], type: 'flame', rate: 0.8, scale: 0.7, mirror: true },
          { part: 'flameSkirt', at: [0, 0.8, 0.1], type: 'ember', rate: 1.2, scale: 0.9 },
        ],
        anim: { scale: 1.12, maxSpeed: 8, bounce: 0.8 },
      },
    },
  };
  LORE.riffrooster = {
    name: 'Riffrooster', element: 'pyro/echo', stage: 2, height: '1.85 m',
    desc: 'Chilichick grown into a gamecock rock guitarist. It plays a guitar grown from a hardened giant chili gourd and swings it like a blade, every strike landing on the beat. When it gets serious its fire turns dark at the core and bright only at the edges, and the whole arena goes quiet.',
    personality: 'Cool, cocky and cold-eyed on stage; secretly still the crybaby who could not stop eating peppers.',
    look: 'A tall upright crimson rooster with a five-point flame comb, a long orange-gold hackle mane, soot-black war paint where its tears used to run, bone-yellow beak and long scaly legs with spurs, and three long black-to-crimson sickle tail feathers burning at the tips. It holds a sunburst pepper-gourd guitar diagonally across its body on a chili-ristra strap, a pepper stem in its beak like a toothpick.',
  };
}

// =====================================================================
// PYRO/ECHO — FUNKADOODLE (alt final)  · tokonmon_starters.md §3
// Crouched funk-punk rooster bassist: frizzle mohawk ripening red → lime,
// pepper-ring shades, flared bell-bottom leg feathers with burning hems,
// green bell-pepper bass held low and horizontal. Slap = fire shockwaves.
// =====================================================================
{
  const vs = 0.04;
  const HC = [0, 1.33, 0.03], HR = [0.17, 0.165, 0.165];
  const TC = [0, 0.98, -0.03], TR = [0.255, 0.27, 0.22];
  const B = frame([-0.24, 0.8, 0.27], [1, 0.1, 0.12], [0, 1, -0.28]);
  const P = B.P, br = B.rot;
  const fret = P(0.62, 0.0, 0.04), slap = P(-0.02, -0.04, 0.09);
  const lensL = onEll(HC, HR, [0.42, 0.18, 0.88]);
  // frizzle mohawk: feathers along the midline, curling outward; red root → amber → lime tips
  const crestF = [[0.14, 0.95, 0.42], [0.08, 1.12, 0.1], [0.0, 1.2, -0.12], [-0.08, 1.12, -0.38], [-0.14, 0.95, -0.62], [-0.18, 0.7, -0.85]];
  const crest = crestF.flatMap(([z, h, lean], i) => {
    const b0 = [0, HC[1] + Math.sqrt(Math.max(0, 1 - (z / HR[2]) ** 2)) * HR[1] - 0.02, HC[2] + z];
    const p1 = [0, b0[1] + 0.12 * h, b0[2] + lean * 0.05];
    const p2 = [0, b0[1] + 0.22 * h, b0[2] + lean * 0.14];
    const p3 = [0, b0[1] + 0.32 * h - 0.02, b0[2] + lean * 0.3 + 0.03];
    const side = (i % 2 ? 1 : -1) * 0.07;
    p2[0] += side * 0.5; p3[0] += side * 1.6;
    return [['cap', b0, p1, 0.052, 0.044, 'c'], ['cap', p1, p2, 0.044, 0.036, 'a'], ['cap', p2, p3, 0.036, 0.012, 'L']];
  });
  // bell-bottom leg: thigh forward-down to a bent knee, flare of cream feathers to a burning hem
  const leg = (s) => {
    const hip = [s * 0.15, 0.72, -0.02], knee = [s * 0.21, 0.44, 0.14], ank = [s * 0.21, 0.1, 0.02];
    return [
      ['cap', hip, knee, 0.11, 0.085, 'b'],
      ['cap', knee, lerp3(knee, ank, 0.45), 0.08, 0.11, 'w', { stripes: { axis: 'y', p: 0.09, w: 0.03, col: 's', o: 0.02 } }],
      ['cap', lerp3(knee, ank, 0.45), [ank[0], 0.13, ank[2] + 0.01], 0.11, 0.17, 'w', { stripes: { axis: 'y', p: 0.09, w: 0.03, col: 's', o: 0.02 } }],
      ['cyl', [ank[0], 0.16, ank[2] + 0.01], [ank[0], 0.07, ank[2] + 0.01], 0.17, 'W', { sub: 0 }],
      ['cap', [ank[0], 0.07, 0.03], [ank[0], 0.03, 0.22], 0.05, 0.035, 'y'],
      ['cap', [ank[0], 0.07, 0.03], [ank[0] + s * 0.1, 0.03, 0.18], 0.045, 0.03, 'y'],
      ['cap', [ank[0], 0.07, 0.03], [ank[0] - s * 0.09, 0.03, 0.18], 0.045, 0.03, 'y'],
    ];
  };
  const hem = (s) => ring(9, 0.15, 0.2, (a, x, z) => tongue([s * 0.21 + x, 0.09, 0.03 + z], [x * 0.6, 1, z * 0.6], 0.12, 0.04)).flat();
  DESIGNS.funkadoodle = {
    id: 'funkadoodle', vs, arch: 'biped',
    pal: {
      b: '#f25a2a', B: '#b02a3c', d: '#521338', h: '#ff9a5a',
      c: '#ff3b2f', a: '#ffb020', L: '#a8eb3a', l: '#e6ff9a',
      w: '#ffe9b8', W: '#e0a86a', s: '#ff8a1f', v: '#fff0cc',
      g: '#5dbb46', G: '#2c6e3a', n: '#173d25', z: '#d2f7a0', t: '#6b4a2a',
      x: '#ff7a2e', e: '#1d1a33', p: '#e8321e', o: '#ff9a3d',
      y: '#ffb52e', Y: '#c26a1e', k: '#3a1a14',
    },
    anim: { quirk: ['spin', 'hop', 'happy', 'headbang', 'sway'], bounce: 1.7, gait: 1.2, stride: 1.0, tail: 1.4, maxSpeed: 6.6, dodgeSpin: 1 },
    parts: [
      { n: 'body', p: [0, 0.82, 0], s: [
        ['ell', TC, TR, 'b', { rot: [-12, 0, 0] }],
        ['ell', [0, 0.78, -0.06], [0.24, 0.16, 0.2], 'b', { blend: 0.06 }],
        ['cap', [0, 1.14, -0.06], [0, 1.26, 0.0], 0.13, 0.11, 'b', { blend: 0.05 }],
        // round fluffy chest, cream bib with the line's spark
        ['ell', [0, 1.0, 0.15], [0.17, 0.2, 0.1], 'v', { paint: 1 }],
        ['poly', [0, 1.0, 0.17], starPts(7, 0.11, 0.05, 92, 0.3, 11), 0.08, 'a', { paint: 1, rot: [-12, 0, 0] }],
        ['poly', [0, 1.0, 0.17], starPts(7, 0.05, 0.025, 110, 0.3, 5), 0.08, 'c', { paint: 1, rot: [-12, 0, 0] }],
        // frizzled shoulders
        ...[1, -1].flatMap((s) => [0, 1, 2, 3].map((i) => ['cap', [s * (0.18 + i * 0.02), 1.16 - i * 0.05, -0.02 + i * 0.02], [s * (0.3 + i * 0.03), 1.22 - i * 0.07, 0.02 + i * 0.02], 0.045, 0.012, 'b', { tip: 'h', tipT: 0.6 }])),
      ] },
      { n: 'head', parent: 'body', p: [0, 1.22, 0.0], s: [
        ['ell', HC, HR, 'b'],
        // wide grinning beak
        ['ell', [0, 1.285, 0.175], [0.1, 0.05, 0.08], 'y', { belly: 'Y', bellyT: 0.5 }],
        ['cap', [0, 1.3, 0.2], [0, 1.275, 0.285], 0.05, 0.014, 'y'],
        ['ell', [0.035, 1.17, 0.15], [0.03, 0.06, 0.03], 'c', { m: 1 }],
        // pepper-ring shades: red chili-slice rims, dark lenses, bridge and temple arms
        ['ell', add3(lensL, [0.008, 0.004, 0.016]), [0.072, 0.03, 0.072], 'e', { m: 1, rot: alignY([0.42, 0.18, 0.88]) }],
        ['tor', add3(lensL, [0.01, 0.004, 0.02]), 0.074, 0.024, 'p', { m: 1, rot: alignY([0.42, 0.18, 0.88]) }],
        ['cap', [0.04, lensL[1] + 0.01, lensL[2] + 0.03], [-0.04, lensL[1] + 0.01, lensL[2] + 0.03], 0.016, 0.016, 'p'],
        ['cap', add3(lensL, [0.07, 0.0, -0.02]), [0.17, lensL[1], -0.04], 0.014, 0.014, 'p', { m: 1 }],
        // sweat stripes: the tear-track echo of Chilichick
        ...stroke([onEll(HC, HR, [0.66, -0.2, 0.7]), onEll(HC, HR, [0.7, -0.5, 0.52])], 0.014, 's', { m: 1, jit: 0 }),
      ] },
      { n: 'jaw', parent: 'head', p: [0, 1.26, 0.15], s: [
        ['ell', [0, 1.24, 0.165], [0.085, 0.032, 0.065], 'Y'],
      ] },
      { n: 'crest', parent: 'head', p: [0, 1.48, 0.0], sway: { axis: 'z', amp: 0.1, freq: 2.2 }, s: crest },
      // fretting wing-arm (left) reaching out along the long bass neck
      { n: 'armL', parent: 'body', p: [0.24, 1.15, 0.0], s: [
        ['sph', [0.24, 1.15, 0.0], 0.085, 'b'],
        ['cap', [0.24, 1.15, 0.0], [0.42, 0.98, 0.12], 0.075, 0.06, 'b'],
        ['cap', [0.42, 0.98, 0.12], add3(fret, [0.0, 0.04, -0.03]), 0.06, 0.048, 'b'],
        ['cap', [0.4, 1.0, 0.1], [0.46, 0.84, 0.02], 0.04, 0.012, 'B'],
        ['cap', fret, add3(fret, [0.04, 0.05, 0.05]), 0.03, 0.012, 'B'],
        ['cap', fret, add3(fret, [0.06, -0.01, 0.05]), 0.03, 0.012, 'B'],
      ] },
      // slapping wing-arm (right) with the big alula "thumb"
      { n: 'armR', parent: 'body', p: [-0.24, 1.15, 0.0], s: [
        ['sph', [-0.24, 1.15, 0.0], 0.085, 'b'],
        ['cap', [-0.24, 1.15, 0.0], [-0.37, 0.95, 0.03], 0.075, 0.06, 'b'],
        ['cap', [-0.37, 0.95, 0.03], add3(slap, [-0.02, 0.03, -0.03]), 0.06, 0.05, 'b'],
        ['cap', [-0.36, 0.97, 0.02], [-0.42, 0.8, -0.06], 0.04, 0.012, 'B'],
        ['cap', slap, add3(slap, [0.02, 0.1, 0.03]), 0.034, 0.018, 'y'],
        ['cap', slap, add3(slap, [0.06, -0.02, 0.04]), 0.03, 0.012, 'B'],
      ] },
      // the green bell-pepper bass: lobed offset body, long neck, stem-curl headstock, coal strings
      { n: 'bass', parent: 'armL', p: fret, s: [
        ['ell', P(-0.12, -0.01, 0), [0.21, 0.2, 0.065], 'g', { rot: br }],
        ['ell', P(0.07, 0.02, 0), [0.15, 0.16, 0.06], 'g', { rot: br, blend: 0.06 }],
        ...tube(bez(P(0.08, 0.12, 0), P(0.2, 0.18, 0), P(0.28, 0.13, 0), 4), 0.05, 0.012, 'g'),
        ...tube(bez(P(0.06, -0.12, 0), P(0.15, -0.17, 0), P(0.22, -0.13, 0), 4), 0.045, 0.012, 'g'),
        ...stroke([P(-0.3, 0.07, 0.06), P(-0.1, 0.1, 0.07), P(0.12, 0.08, 0.06)], 0.014, 'G', { jit: 0 }),
        ...stroke([P(-0.3, -0.07, 0.06), P(-0.1, -0.1, 0.07), P(0.1, -0.09, 0.06)], 0.014, 'G', { jit: 0 }),
        ...stroke([P(-0.2, 0.13, 0.06), P(-0.06, 0.16, 0.05)], 0.012, 'z', { jit: 0 }),
        // seed-strip bridge
        ...[-0.05, 0.0, 0.05].map((v) => ['sph', P(-0.24, v, 0.06), 0.016, 'v']),
        // long neck + headstock (pepper stem curl)
        ['box', P(0.55, 0, 0.01), [0.4, 0.04, 0.03], 'k', { rot: br }],
        ...[0.25, 0.37, 0.48, 0.58, 0.68, 0.78].map((u) => ['box', P(u, 0, 0.035), [0.01, 0.045, 0.02], 'W', { rot: br, paint: 1 }]),
        ...tube(bez3(P(0.94, 0, 0), P(1.06, 0.02, 0), P(1.1, 0.12, 0), P(1.02, 0.12, 0), 6), 0.045, 0.022, 't'),
        ...tube([P(-0.24, 0.022, 0.065), P(0.95, 0.022, 0.04)], 0.012, 0.012, 'x', { glow: 2 }),
        ...tube([P(-0.24, -0.022, 0.065), P(0.95, -0.022, 0.04)], 0.012, 0.012, 'x', { glow: 2 }),
      ] },
      { n: 'legL', parent: 'body', p: [0.15, 0.72, -0.02], mirror: true, s: [...leg(1), ...ring(7, 0.155, 0.4, (a, x, z) => tongue([0.21 + x, 0.075, 0.03 + z], [x * 1.2, 1, z * 1.2], 0.07, 0.035)).flat()] },
      { n: 'tail', parent: 'body', p: [0, 0.86, -0.22], sway: { axis: 'y', amp: 0.12, freq: 2.2 }, s: [
        ['sph', [0, 0.9, -0.3], 0.13, 'b', { noise: 0.025, noiseScale: 0.05 }],
        ...[-0.08, 0, 0.08].map((x) => ['cap', [x, 0.95, -0.36], [x * 1.8, 1.04, -0.44], 0.04, 0.012, 'c', { tip: 'L', tipT: 0.55 }]),
      ] },
    ],
    eyes: {
      // the shades ARE the default face; when hurt they "slip" and teary Chilichick eyes show
      part: 'head', at: add3(lensL, [0.03, 0.012, 0.06]), dir: [0.42, 0.18, 0.88], style: 'round', iris: '#ffb12b', px: 0.55, depth: 1,
      rows: ['......', '....o.', '...o..', '..o...', '......'],
      cmap: { o: '#ff9a3d', b: '#7fdcff', a: '#ffb12b' },
      variants: {
        closed: ['......', '....o.', '...o..', '..o...', '......'],
        happy: ['......', '.oooo.', 'o....o', '......', '......'],
        sad: ['......', '......', '.oooo.', '......', '......'],
        angry: ['ooo...', '...oo.', '......', '......', '......'],
        hurt: ['.kkkk.', 'kwwkak', 'kwkkak', 'kaaaak', '.bbbb.'],
      },
    },
    mouth: { part: 'head', at: [0, 1.27, 0.25], dir: [0, -0.1, 1], style: 'beak', px: 0.5 },
    fx: [
      { part: 'legL', at: [0.21, 0.1, 0.05], type: 'flame', rate: 0.35, scale: 0.55, mirror: true },
      { part: 'bass', at: P(0.3, 0.0, 0.08), type: 'note', rate: 0.4, scale: 0.9, color: '#a8eb3a' },
      { part: 'crest', at: [0, 1.75, -0.05], type: 'ember', rate: 0.4, scale: 0.6 },
    ],
    bond: {
      // blazing crest: the frizzle mohawk ignites from the roots up; feathers puff on the beat
      parts: [
        { n: 'crestFire', parent: 'crest', p: [0, 1.5, 0.0], s: [
          ...crestF.flatMap(([z, h, lean]) => tongue([0, HC[1] + Math.sqrt(Math.max(0, 1 - (z / HR[2]) ** 2)) * HR[1] + 0.02, HC[2] + z], [0, 1, lean * 0.4], 0.24 * h, 0.05)),
        ] },
      ],
      grow: { tail: 1.35, crest: 1.15 },
      hat: { part: 'head', at: [0.075, 1.465, 0.04], scale: 0.86, tilt: 4, roll: -24 },
      aura: 'flame', auraColor: [2.6, 2.2, 0.6, 1],
    },
    forms: {
      elemental: {
        // walking speaker of fire: concentric fire rings orbit the torso; flares become pure flame;
        // the mohawk turns lime-to-white plasma; the bass splits open on glowing seed-embers
        pal: { c: '#e6ff9a', a: '#f4ffd0', L: '#ffffff', w: '#ffb020', W: '#ff5a1f', s: '#ff3b2f', x: '#fff0d6', g: '#3f9a34', b: '#ff4a22' },
        parts: [
          { n: 'ringA', parent: 'body', p: [0, 0.98, -0.03], spin: { axis: 'y', speed: 2.4 }, s: [
            ['tor', [0, 0.98, -0.03], 0.42, 0.03, '#ff7a1a', { rot: [12, 0, 8], glow: 2, stripes: { axis: 'x', p: 0.16, w: 0.06, col: '#fff6c9' } }],
          ] },
          { n: 'ringB', parent: 'body', p: [0, 0.98, -0.03], spin: { axis: 'y', speed: -1.7 }, s: [
            ['tor', [0, 0.98, -0.03], 0.56, 0.026, '#ff3b2f', { rot: [-10, 0, -6], glow: 2, stripes: { axis: 'z', p: 0.2, w: 0.07, col: '#ffc233' } }],
          ] },
          { n: 'plasma', parent: 'crest', p: [0, 1.5, 0.0], s: [
            ...crestF.flatMap(([z, h, lean]) => tongue([0, HC[1] + Math.sqrt(Math.max(0, 1 - (z / HR[2]) ** 2)) * HR[1] + 0.06, HC[2] + z], [0, 1, lean * 0.5], 0.3 * h, 0.05, { outer: '#a8eb3a', mid: '#e6ff9a', core: '#ffffff', glow: 3 })),
          ] },
          { n: 'flareFireL', parent: 'legL', mirror: true, p: [0.21, 0.1, 0.02], s: hem(1) },
          { n: 'seeds', parent: 'bass', p: fret, s: [
            ['ell', P(-0.12, 0, 0.055), [0.1, 0.09, 0.02], '#ff5a1f', { rot: br, glow: 2 }],
            ...[[-0.16, 0.03], [-0.1, -0.04], [-0.06, 0.04], [-0.14, -0.03], [-0.09, 0.0]].map(([u, v]) => ['sph', P(u, v, 0.07), 0.016, '#fff6c9', { glow: 3 }]),
          ] },
          { n: 'stone', parent: 'body', p: [0, 1.12, 0.2], s: [['ell', [0, 1.12, 0.215], [0.035, 0.05, 0.025], '#a8f4ff', { glow: 3 }]] },
        ],
        fx: [
          { part: 'plasma', at: [0, 1.85, 0.0], type: 'flame', rate: 0.9, scale: 0.8, color: '#e6ff9a' },
          { part: 'flareFireL', at: [0.21, 0.12, 0.05], type: 'flame', rate: 1.0, scale: 0.9, mirror: true },
          { part: 'body', at: [0, 0.98, 0.3], type: 'note', rate: 0.8, scale: 1.0, color: '#ffc233' },
        ],
        anim: { scale: 1.12, bounce: 1.9 },
      },
    },
  };
  LORE.funkadoodle = {
    name: 'Funkadoodle', element: 'pyro/echo', stage: 2, height: '1.65 m',
    desc: "The band's bassist. Every thumb-slap on its bell-pepper bass stamps a ring of fire across the ground on the beat, and every finger-pop bursts a pillar of flame under the nearest foe. It never takes its pepper-ring shades off, unless something really hurts.",
    personality: 'A joker and a show-off with unstoppable groove; still a little teary behind the shades.',
    look: 'A crouched, bouncy tangerine rooster with a tall frizzled mohawk that ripens from red to amber to lime tips, round sunglasses with red chili-slice rims, a wide grin, a cream spark-shaped bib, flared cream bell-bottom leg feathers with orange stripes and burning hems, a round frizzled pompom tail, and a long green bell-pepper bass held low and sideways with glowing coal strings.',
  };
}

// =====================================================================
// HYDRO — BUBBLION (base)  · tokonmon_starters.md §4
// A chubby baby lionfish prince inside a soft, wobbly ball of water. The
// pipeline has no alpha, so the ball is opaque water whose surface shows
// the fish through it (water-tinted bands, face, sailor stripes, caustics);
// the lips, brow frills, fins, spines, tail and the tilted gold crown poke
// through the membrane, which dimples around them.
// =====================================================================
{
  const vs = 0.026;
  const BC = [0, 0.345, 0], BR = [0.35, 0.33, 0.35];
  const on = (d) => onEll(BC, BR, d);
  const crownC = [0.03, 0.66, 0.0], crownTilt = [0, 0, -13];
  const crownPt = (i) => {
    const a = (i / 5) * Math.PI * 2 + 0.3, x = Math.sin(a) * 0.085, z = Math.cos(a) * 0.085;
    const c = Math.cos(13 * D2R), s2 = Math.sin(13 * D2R);
    const rot = ([px, py, pz]) => [crownC[0] + px * c + py * s2, crownC[1] - px * s2 + py * c, crownC[2] + pz];
    return { base: rot([x, 0.04, z]), tip: rot([x * 1.08, 0.14, z * 1.08]) };
  };
  const spine = (k) => {
    const a = (-38 + k * 19) * D2R;
    const b = [Math.sin(a) * 0.09, 0.6, -0.12 + Math.cos(a) * 0.02];
    return { b, t: [Math.sin(a) * 0.22, 0.86 - Math.abs(k - 2) * 0.03, -0.3 - Math.cos(a) * 0.04] };
  };
  const fin = (s) => {
    const r = [s * 0.3, 0.33, 0.06];
    const pts = [[0, 0.02], [0.05, 0.1], [0.12, 0.13], [0.19, 0.1], [0.24, 0.04], [0.26, -0.03], [0.22, -0.1], [0.14, -0.12], [0.06, -0.08], [0, -0.03]].map(([u, v]) => [u * s, v]);
    return { r, pts };
  };
  const F = fin(1);
  // side profile of the chubby lionfish inside the ball (z, y), painted through the water
  const FISH = [[0.34, 0.37], [0.27, 0.5], [0.14, 0.565], [0.0, 0.575], [-0.13, 0.52], [-0.22, 0.44], [-0.31, 0.52], [-0.35, 0.47], [-0.31, 0.37], [-0.35, 0.27], [-0.31, 0.22], [-0.22, 0.31], [-0.13, 0.22], [0.0, 0.17], [0.14, 0.18], [0.27, 0.24], [0.34, 0.31]].map(([z, y]) => [z * 0.92, 0.37 + (y - 0.37) * 0.86]);
  const band = (z, half) => ['ell', [0, 0.37, z], [0.5, half, 0.034], 'O', { paint: 1, jit: 0 }];
  DESIGNS.bubblion = {
    id: 'bubblion', vs, arch: 'blob',
    pal: {
      W: '#7fdbff', D: '#2f8fd0', E: '#1a5fa8', H: '#e9fcff', Q: '#bff4ff',
      O: '#df6f6c', C: '#e6f1ee', N: '#34509a', K: '#3d5f9e', o: '#ee5a4e', c: '#fff2e4',
      L: '#cdb8f5', V: '#9a82d6', S: '#7a4cc8',
      g: '#ffc83a', G: '#c7862a', y: '#fff0a0', P: '#f7f3ff', p: '#ff7a96',
    },
    anim: { quirk: ['sway', 'happy', 'nod', 'spin'], bounce: 1.6, gait: 0.7, stride: 1, tail: 1.3, maxSpeed: 2.2, dodgeSpin: 0 },
    parts: [
      { n: 'body', p: [0, 0.2, 0], s: [
        ['ell', BC, BR, 'W', { belly: 'D', bellyT: 0.42, jit: 0.03 }],
        ['ell', [0, 0.05, 0], [0.3, 0.12, 0.3], 'E', { paint: 1 }],
        // the lionfish seen through the water: a banded body wrapped round the ball's middle
        ['poly', [0, 0, 0], FISH.map(([z, y]) => [z * 1.07, 0.37 + (y - 0.37) * 1.09]), 0.5, 'K', { plane: 'zy', paint: 1, jit: 0 }],
        ['poly', [0, 0, 0], FISH, 0.5, 'C', { plane: 'zy', paint: 1, jit: 0 }],
        band(0.09, 0.15), band(-0.05, 0.155), band(-0.175, 0.11),
        ['poly', [0, 0, 0], FISH.filter(([z]) => z < -0.2), 0.5, 'O', { plane: 'zy', paint: 1, jit: 0 }],
        // face (cream) with thin stripes through the eyes, sailor collar behind the head
        ['ell', [0, 0.385, 0.32], [0.232, 0.19, 0.1], 'K', { paint: 1, jit: 0 }],
        ['ell', [0, 0.385, 0.32], [0.21, 0.17, 0.1], 'C', { paint: 1, jit: 0 }],
        ...[0.12, -0.12].flatMap((x) => stroke([on([x * 2.2, 0.55, 0.75]), on([x * 2.6, 0.1, 0.86]), on([x * 2.2, -0.35, 0.86])], 0.012, 'O', { jit: 0 })),
        ['ell', [0, 0.37, 0.225], [0.5, 0.14, 0.012], 'N', { paint: 1, jit: 0 }],
        ['ell', [0, 0.37, 0.19], [0.5, 0.145, 0.012], 'N', { paint: 1, jit: 0 }],
        // water highlights: a window-shaped glint top-left, a small one, caustic lines
        ['poly', on([-0.46, 0.64, 0.6]), [[-0.08, -0.045], [0.06, -0.05], [0.08, 0.04], [-0.05, 0.06]], 0.05, 'H', { paint: 1, rot: [-35, -35, 18] }],
        ['sph', on([-0.25, 0.78, 0.58]), 0.022, 'H', { paint: 1 }],
        ...stroke([on([0.15, 0.85, -0.4]), on([0.45, 0.75, -0.3]), on([0.6, 0.6, 0.1]), on([0.42, 0.72, 0.5])], 0.01, 'Q', { jit: 0 }),
        ...stroke([on([-0.62, 0.15, -0.6]), on([-0.8, 0.0, -0.1]), on([-0.62, 0.12, 0.45])], 0.01, 'Q', { jit: 0 }),
        ...stroke([on([0.3, -0.5, 0.8]), on([0.62, -0.42, 0.5]), on([0.75, -0.5, 0.0])], 0.01, 'Q', { jit: 0 }),
        // surface-tension dimple where the crown pierces the top
        ['tor', [crownC[0], 0.665, 0], 0.1, 0.02, 'Q', { paint: 1, rot: crownTilt }],
        // the pouty lips pushed out through the membrane, and soft frilly brows
        ['tor', on([0, -0.12, 1]).map((v, i) => v + [0, 0, 0.01][i]), 0.026, 0.017, 'p', { axis: 'z' }],
        ...[1, -1].map((s) => ['cap', on([s * 0.32, 0.5, 0.82]), add3(on([s * 0.32, 0.5, 0.82]), [s * 0.03, 0.06, 0.02]), 0.016, 0.006, 'c']),
        ...[1, -1].map((s) => ['cap', on([s * 0.4, 0.46, 0.8]), add3(on([s * 0.4, 0.46, 0.8]), [s * 0.05, 0.04, 0.01]), 0.013, 0.005, 'o']),
      ] },
      // the crown, tilted, its five pearl-tipped points piercing the top of the ball
      { n: 'crown', parent: 'body', p: crownC, sway: { axis: 'z', amp: 0.05, freq: 1.1 }, over: true, s: [
        ['cyl', [crownC[0] - 0.009, 0.62, 0], [crownC[0] + 0.012, 0.705, 0], 0.1, 'g', { rot: crownTilt }],
        ['cyl', [crownC[0] - 0.009, 0.6, 0], [crownC[0] + 0.016, 0.74, 0], 0.075, 'g', { rot: crownTilt, sub: 1 }],
        ['tor', [crownC[0] + 0.004, 0.695, 0], 0.1, 0.014, 'y', { rot: crownTilt }],
        ...[0, 1, 2, 3, 4].flatMap((i) => { const q = crownPt(i); return [['cap', q.base, q.tip, 0.03, 0.01, 'g'], ['sph', q.tip, 0.022, 'P']]; }),
        ['sph', [crownC[0] - 0.002, 0.66, 0.1], 0.018, 'p', { glow: 1 }],
      ] },
      // dorsal spines fanned behind the crown like a punk crest, pearl bubbles on the tips
      { n: 'tail2', parent: 'body', p: [0, 0.6, -0.12], sway: { axis: 'x', amp: 0.07, freq: 1.4 }, s: [
        ...[0, 1, 2, 3, 4].flatMap((k) => { const q = spine(k); return [['cap', q.b, q.t, 0.022, 0.01, 'c', { stripes: { axis: 'y', p: 0.07, w: 0.03, col: 'o', o: 0.0 } }], ['sph', q.t, 0.024, 'P']]; }),
      ] },
      { n: 'finL', parent: 'body', p: F.r, mirror: true, s: [
        ['poly', F.r, F.pts, 0.012, 'L', { rot: [0, -28, -14] }],
        ...[0.4, 0.7, 1.0].map((k) => ['poly', F.r, F.pts.map(([u, v]) => [u * k, v * k]), 0.03, k === 1 ? 'L' : 'V', { rot: [0, -28, -14], paint: 1 }]).reverse(),
        ...[[0.08, 0.06], [0.15, 0.08], [0.2, 0.0], [0.13, -0.06], [0.06, -0.02]].map(([u, v]) => ['sph', add3(F.r, [u * Math.cos(28 * D2R), v + u * Math.sin(-14 * D2R) * 0, u * Math.sin(28 * D2R)]), 0.016, 'S', { paint: 1 }]),
      ] },
      { n: 'tail', parent: 'body', p: [0, 0.36, -0.33], sway: { axis: 'y', amp: 0.18, freq: 1.6 }, s: [
        ['poly', [0, 0.36, -0.33], [[0.02, 0.03], [-0.07, 0.12], [-0.15, 0.1], [-0.13, 0.0], [-0.15, -0.1], [-0.07, -0.1], [0.02, -0.03]], 0.012, 'L', { plane: 'zy' }],
        ...[[-0.08, 0.05], [-0.11, -0.04], [-0.06, -0.05]].map(([z, y]) => ['sph', [0, 0.36 + y, -0.33 + z], 0.014, 'S', { paint: 1 }]),
      ] },
    ],
    eyes: {
      part: 'body', at: on([0.3, 0.2, 0.93]), dir: [0.3, 0.2, 1], style: 'big', iris: '#24306e', px: 0.68,
      rows: ['.kkkk.', 'kkkkkk', 'kiwiik', 'kwwwik', 'kiwiik', '.kkkk.'],
    },
    mouth: { part: 'body', at: on([0, -0.12, 1]).map((v, i) => v + [0, 0, 0.03][i]), dir: [0, 0, 1], style: 'tiny', px: 0.6 },
    fx: [
      { part: 'body', at: [0, 0.32, 0.4], type: 'bubble', rate: 0.6, scale: 0.7 },
      { part: 'body', at: [0.1, 0.62, 0.1], type: 'bubble', rate: 0.4, scale: 0.6 },
      { part: 'crown', at: [crownC[0], 0.8, 0], type: 'star', rate: 0.3, scale: 0.5 },
    ],
    bond: {
      // bubbles: satellite bubbles orbit the ball (each a loaded water bullet); a bubble jewel on the crown
      parts: [
        { n: 'satellites', parent: 'body', p: [0, 0.36, 0], spin: { axis: 'y', speed: 1.6 }, s: [
          ...[0, 1, 2, 3].flatMap((i) => {
            const a = (i / 4) * Math.PI * 2, c = [Math.sin(a) * 0.5, 0.3 + (i % 2) * 0.18, Math.cos(a) * 0.5];
            return [['sph', c, 0.065, 'W', { belly: 'D', bellyT: 0.5 }], ['sph', add3(c, [-0.025, 0.03, 0.04]), 0.018, 'H', { paint: 1 }]];
          }),
        ] },
        { n: 'jewel', parent: 'crown', p: [crownC[0], 0.78, 0], s: [
          ['sph', [crownC[0] + 0.02, 0.79, 0.0], 0.045, 'Q', { belly: 'W', bellyT: 0.3 }],
          ['sph', [crownC[0] + 0.005, 0.81, 0.03], 0.012, 'H', { paint: 1 }],
        ] },
      ],
      grow: { body: 1.06 },
      hat: { part: 'body', at: [-0.1, 0.665, -0.02], scale: 0.74, tilt: -4, roll: 12 },
      aura: 'bubbles', auraColor: [0.9, 1.9, 2.6, 1],
    },
  };
  LORE.bubblion = {
    name: 'Bubblion', element: 'hydro', stage: 1, height: '0.75 m',
    desc: 'A baby lionfish that lives inside its own soft ball of water and never leaves it. It bounces everywhere instead of swimming, and puckers up to spit spinning bubble-bullets with sniper patience. The bullets pop with a small blast, a trick it is very proud of.',
    personality: 'A spoiled little prince: proud, a bit lazy, smug when it hits and dramatic about its crown.',
    look: 'A wobbly round ball of cyan water with a chubby cream-and-coral banded lionfish inside. Its pouty pink lips and frilly brows press out of the front, lavender fan fins with purple spots stick out of the sides like little wings, five pearl-tipped spines fan up behind a tilted gold crown whose points pierce the top of the ball, and a sailor collar of two navy stripes sits behind its head.',
    evolves: ['princeidon', 'purple_rain'],
  };
}
