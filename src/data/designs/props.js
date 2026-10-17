// Elemon prop kit — world dressing for futuristic Osaka (2050), voxel DSL
// (docs/MODELING.md). Props stand on y = 0 centred on x = z = 0, front = +z,
// 1 world unit = 1 m. Each prop is (usually) one static part 'body'; animated
// bits (canopies, blades, rotors, lanterns) are extra parts with sway/spin.
//
//   DESIGNS[id]   design objects (arch 'static', anim.bounce 0)
//   PROP_META[id] { footprint:[w,d] m, solid, destructible, hp, debris:[hex],
//                   light: null | { color, intensity, y, range, night },
//                   tags:[…], colliders?: [[x, z, w, d], …] (only when the
//                   blocking shape is not one rectangle, e.g. gates) }
//
// Palette: warm stone, vermilion, cream walls, teal roofs, pastel shop
// colours, cyan/magenta neon. Glow voxels (glow:2) bloom at night.

const D = {}, M = {};

// ---------------------------------------------------------------- palette
export const PROP_PAL = {
  // stone
  st: '#b8ad9a', stD: '#8f8575', stL: '#d6ccb8', stK: '#6b645a', stW: '#c9bfa9',
  // moss / foliage
  ms: '#7fa64e', msD: '#5a8239', msL: '#a3c766',
  lf: '#5d9f42', lfD: '#3e7b35', lfL: '#93cc62', lfK: '#2c5a2b',
  pn: '#2f6a4c', pnD: '#1f4c3a', pnL: '#4f9161', pnK: '#173a2e',
  gr: '#6fb24a', grD: '#4f8f38', grL: '#b4d96a', grY: '#d7d77a',
  // wood / bark
  wd: '#a8744a', wdD: '#7c5333', wdL: '#c99a68', wdK: '#5a3b25', wdP: '#e2c296',
  bk: '#6a5146', bkD: '#4b3932', bkL: '#86685a',
  // reds / vermilion
  vm: '#e2482e', vmD: '#b33422', vmL: '#f47a52',
  rd: '#d83a3c', rdD: '#a42a30', rdL: '#f2686a',
  // walls / roofs
  cr: '#f4e9d2', crD: '#ddccad', crL: '#fffaee',
  wh: '#f4f2ec', whD: '#d8d6d0',
  tl: '#3d8d89', tlD: '#2a6869', tlL: '#5fb2a7',
  cg: '#72b59f', cgD: '#4f8e7d', cgL: '#9bd2bc',
  rf: '#4b5362', rfD: '#363c49', rfL: '#6a7382',
  gd: '#f2c24c', gdD: '#c7902c', gdL: '#ffe28a',
  // metal / dark
  mt: '#a9b1bb', mtD: '#6f7884', mtL: '#d5dbe1', mtK: '#3d434d',
  ink: '#252932', inkL: '#3a404c',
  // neon (use with glow)
  nc: '#3ff0ff', nm: '#ff4ac8', ny: '#ffe45c', no: '#ff8a3c', nv: '#9d6bff', ng: '#5dff9a', nw: '#eafcff', nr: '#ff3b4f',
  // pastels
  pp: '#ffb6cb', pm: '#a6e6cf', py: '#fff0a6', pv: '#cdb8ff', pb: '#a8d6ff', po: '#ffc8a0',
  // sakura / maple
  sk: '#ffb0ca', skL: '#ffd3e3', skD: '#ee8bb0', skW: '#fff0f5', skK: '#d9739a',
  mp: '#e0462e', mpO: '#f2892e', mpD: '#b02a24', mpY: '#f7c04a',
  // earth / water / straw
  dt: '#8a6a4a', dtD: '#6a4f36', dtL: '#a8865e',
  wa: '#4fb4e2', waD: '#2c84bf', waL: '#a6e6ff', waW: '#e8fbff',
  hy: '#e6c46a', hyD: '#c49e46', hyL: '#f4dc92',
  // misc
  k: '#16141c', w: '#ffffff',
};
const P = PROP_PAL;

// ---------------------------------------------------------------- helpers
const E = 1e-3;
const cl = (o) => (o ? { ...o } : {});
// box from min/max corners (metres)
const box = (x0, y0, z0, x1, y1, z1, c, o) => ['box', [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [Math.abs(x1 - x0) / 2 + E, Math.abs(y1 - y0) / 2 + E, Math.abs(z1 - z0) / 2 + E], c, cl(o)];
// box from centre + half extents
const bx = (c, h, col, o) => ['box', c, h, col, cl(o)];
const cyl = (a, b, r, c, o) => ['cyl', a, b, r, c, cl(o)];
const vcyl = (x, z, y0, y1, r, c, o) => ['cyl', [x, y0, z], [x, y1, z], r, c, cl(o)];
const cap = (a, b, r0, r1, c, o) => ['cap', a, b, r0, r1, c, cl(o)];
const sph = (c, r, col, o) => ['sph', c, r, col, cl(o)];
const ell = (c, r, col, o) => ['ell', c, r, col, cl(o)];
const tor = (c, R, r, col, o) => ['tor', c, R, r, col, cl(o)];
const poly = (c, pts, h, col, o) => ['poly', c, pts, h, col, cl(o)];
// one voxel snapped to the lattice
const vox = (vs, x, y, z, c, o) => { const s = (v) => Math.round(v / vs) * vs; return ['box', [s(x), s(y), s(z)], [vs * 0.45, vs * 0.45, vs * 0.45], c, cl(o)]; };
// regular n-gon points (for 'poly' with plane 'xz' → prisms along y)
const ngon = (n, r, rot = 0) => Array.from({ length: n }, (_, i) => [Math.cos(rot + (i / n) * Math.PI * 2) * r, Math.sin(rot + (i / n) * Math.PI * 2) * r]);
const prism = (n, x, z, y0, y1, r, c, o, rot = Math.PI / n) => poly([x, (y0 + y1) / 2, z], ngon(n, r, rot), (y1 - y0) / 2 + E, c, Object.assign({ plane: 'xz' }, o));
// polyline tube (one capsule per segment)
function tube(pts, r0, r1, col, o) {
  const out = [], n = pts.length - 1;
  for (let i = 0; i < n; i++) out.push(cap(pts[i], pts[i + 1], r0 + (r1 - r0) * (i / n), r0 + (r1 - r0) * ((i + 1) / n), col, o));
  return out;
}
// quadratic bezier → points
function bez(a, b, c, n = 6) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([0, 1, 2].map((k) => u * u * a[k] + 2 * u * t * b[k] + t * t * c[k])); }
  return out;
}
// seeded rng (mulberry32)
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// 3×5 pixel font (subset) for signage
const FONT = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'], M: ['#.#', '###', '###', '#.#', '#.#'],
  N: ['##.', '#.#', '#.#', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'], P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  W: ['#.#', '#.#', '###', '###', '#.#'], Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
  7: ['###', '..#', '.#.', '.#.', '.#.'], '-': ['...', '...', '###', '...', '...'], ' ': ['...', '...', '...', '...', '...'],
  '!': ['#', '#', '#', '.', '#'], '.': ['.', '.', '.', '.', '#'], '¥': ['#.#', '.#.', '###', '.#.', '.#.'],
};
// Pixel bitmap (rows of chars) → run-length boxes on a plane.
// plane 'xy' (faces ±z) or 'zy' (faces ±x); o = origin (top-left centre), px = pixel size, d = depth (half thickness)
function bitmap(rows, o, px, d, cmap, plane = 'xy', opts) {
  const out = [];
  rows.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      const ch = row[c];
      if (ch === '.' || ch === ' ' || !cmap[ch]) { c++; continue; }
      let e = c; while (e + 1 < row.length && row[e + 1] === ch) e++;
      const y = o[1] - r * px;
      const u0 = c * px, u1 = e * px;
      const col = cmap[ch];
      const oo = Object.assign({ jit: 0.02 }, opts, typeof col === 'object' ? col : {});
      const cc = typeof col === 'object' ? col.c : col;
      delete oo.c;
      if (plane === 'xy') out.push(bx([o[0] + (u0 + u1) / 2, y, o[2]], [(u1 - u0) / 2 + px * 0.5 - E, px * 0.5 - E, d], cc, oo));
      else out.push(bx([o[0], y, o[2] - (u0 + u1) / 2], [d, px * 0.5 - E, (u1 - u0) / 2 + px * 0.5 - E], cc, oo));
      c = e + 1;
    }
  });
  return out;
}
function textRows(str, gap = 1) {
  const rows = ['', '', '', '', ''];
  [...str].forEach((ch, i) => { const g = FONT[ch] || FONT[' ']; for (let r = 0; r < 5; r++) rows[r] += (i ? '.'.repeat(gap) : '') + g[r]; });
  return rows;
}
// text centred at c on the xy plane (front +z), pixel px, colour col
function text(str, c, px, d, col, opts, gap = 1) {
  const rows = textRows(str, gap);
  const w = rows[0].length;
  return bitmap(rows.map((r) => r.replace(/#/g, 'a')), [c[0] - ((w - 1) * px) / 2, c[1] + 2 * px, c[2]], px, d, { a: col }, 'xy', opts);
}

// Japanese hip roof as stacked slabs. c = [x, y0, z] base centre; hx/hz half
// size at the eave; step = inset per layer; th = layer thickness; n layers.
// The ridge stops shrinking along the long axis (hip-and-gable look).
function hipRoof(c, hx, hz, n, step, th, col, o = {}, { ridge = null, trim = null, minHz = null } = {}) {
  const out = [];
  const mz = minHz ?? th;
  for (let i = 0; i < n; i++) {
    const ax = Math.max(hx - i * step, Math.abs(hx - hz) + mz), az = Math.max(hz - i * step, mz);
    out.push(bx([c[0], c[1] + th * (i + 0.5), c[2]], [ax, th / 2, az], col, o));
  }
  if (trim) out.push(bx([c[0], c[1] + th * 0.5, c[2]], [hx + E, th / 2 + E, hz + E], trim, { paint: 1, jit: 0.03 }), bx([c[0], c[1] + th * 0.5, c[2]], [hx - th * 1.2, th, hz - th * 1.2], col, { paint: 1, ...o }));
  if (ridge) {
    const ax = Math.max(hx - (n - 1) * step, Math.abs(hx - hz) + mz);
    out.push(bx([c[0], c[1] + th * (n + 0.5), c[2]], [ax * 0.98, th / 2, mz * 0.6 + E], ridge, { jit: 0.03 }));
  }
  return out;
}

function prop(id, vs, parts, meta, extra = {}) {
  const isParts = Array.isArray(parts) && parts.length && !Array.isArray(parts[0]) && parts[0].n;
  D[id] = Object.assign({ id: 'prop_' + id, vs, arch: 'static', anim: { bounce: 0 }, pal: P, parts: isParts ? parts : [{ n: 'body', p: [0, 0, 0], s: parts }] }, extra);
  M[id] = Object.assign({ footprint: [1, 1], solid: true, destructible: false, hp: 0, debris: [], light: null, tags: [] }, meta);
}

// =====================================================================
// NATURE
// =====================================================================

// ---- cherry trees ---------------------------------------------------
// Bark with horizontal lenticel bands, a broad cloud canopy of lumpy pink
// blobs (lighter on top, deeper underneath, white blossom speckle), a few
// fallen petals on the ground and drifting petal particles.
function cherry(seed, { vs = 0.1, scale = 1, blobs, limbs, pink = 'sk', top = 'skL', under = 'skD', speck = 'skW', petals = 26, weep = 0, lean = [0.1, 0.05], trunkH = 1.5 } = {}) {
  const r = rng(seed), S = scale;
  const body = [];
  const tTop = [lean[0] * S, trunkH * S, lean[1] * S];
  for (let i = 0; i < 4; i++) {
    const a = i * 1.57 + 0.4 + r() * 0.5;
    body.push(cap([0, 0.35 * S, 0], [Math.cos(a) * 0.55 * S, 0.02, Math.sin(a) * 0.55 * S], 0.15 * S, 0.07 * S, 'bk', { jit: 0.05 }));
  }
  body.push(cap([0, 0, 0], tTop, 0.24 * S, 0.17 * S, 'bk', { stripes: { axis: 'y', p: 0.3, w: 0.1, col: 'bkD' }, jit: 0.05 }));
  for (const l of limbs) body.push(...tube(bez(tTop, [l[0] * 0.35 * S, (l[1] - 0.2) * S, l[2] * 0.35 * S], [l[0] * S, l[1] * S, l[2] * S], 3), 0.14 * S, 0.07 * S, 'bk', { jit: 0.05 }));
  for (let i = 0; i < petals; i++) {
    const a = r() * 6.283, d = (0.6 + r() * 1.7) * S;
    body.push(vox(vs, Math.cos(a) * d, 0, Math.sin(a) * d, r() < 0.5 ? 'sk' : 'skL', { jit: 0.04 }));
  }
  const crown = [];
  const O = { noise: 0.13 * S, noiseScale: 0.3 * S, top, topT: 0.42, belly: under, bellyT: 0.3, dither: { col: speck, amt: 0.09 }, jit: 0.05 };
  for (const b of blobs) crown.push(ell([b[0] * S, b[1] * S, b[2] * S], [b[3] * S, b[4] * S, b[5] * S], pink, O));
  if (weep) {
    // shidare: clumps of cascading blossom strands arching out of the dome rim
    const clumps = 7;
    for (let c = 0; c < clumps; c++) {
      const a0 = (c / clumps) * 6.283 + r() * 0.4;
      for (let i = 0; i < weep; i++) {
        const a = a0 + (i - (weep - 1) / 2) * 0.16, d = (1.05 + r() * 0.5) * S;
        const ca = Math.cos(a), sa = Math.sin(a), yR = (3.55 + r() * 0.2) * S, yE = (0.45 + r() * 0.9) * S;
        crown.push(...tube(bez([ca * d, yR, sa * d], [ca * (d + 0.45 * S), yR + 0.05, sa * (d + 0.45 * S)], [ca * (d + 0.35 * S), yE, sa * (d + 0.35 * S)], 4), 0.07 * S, 0.12 * S, i % 2 ? pink : top, { noise: 0.05, noiseScale: 0.14, dither: { col: i % 2 ? top : speck, amt: 0.3 }, belly: under, bellyT: 0.5, jit: 0.05 }));
      }
    }
  }
  return [
    { n: 'body', p: [0, 0, 0], s: body },
    { n: 'crown', p: [tTop[0], tTop[1], tTop[2]], s: crown, sway: { axis: 'z', amp: 0.012, freq: 0.35 } },
  ];
}
const petalFx = (pts) => pts.map((at) => ({ part: 'crown', at, type: 'petal', rate: 0.35, scale: 1.2 }));
const TREE = (w, tags, extra = {}) => Object.assign({ footprint: [w, w], solid: true, destructible: false, hp: 0, debris: [], light: null, tags }, extra);

prop('sakura', 0.105, cherry(11, { vs: 0.105,
  limbs: [[1.05, 2.5, 0.35], [-0.9, 2.6, -0.3], [0.2, 2.6, -0.95], [-0.3, 2.55, 1.0], [0.1, 3.1, 0.05]],
  blobs: [
    [1.1, 2.8, 0.35, 1.0, 0.72, 0.95], [-0.95, 2.9, -0.3, 1.0, 0.72, 1.0], [0.2, 2.95, -1.0, 0.95, 0.68, 0.85],
    [-0.3, 2.85, 1.05, 0.95, 0.68, 0.9], [0.1, 3.45, 0.05, 1.15, 0.72, 1.1], [1.0, 3.25, -0.7, 0.7, 0.55, 0.7], [-1.0, 3.3, 0.6, 0.7, 0.55, 0.7],
  ],
}), TREE(0.8, ['park', 'tree', 'sakura']), { fx: petalFx([[0.9, 2.3, 0.6], [-0.8, 2.4, -0.2], [0.1, 2.3, -0.9]]) });

// sakura2: a sacred old yaezakura — wide, low, deeper pink, propped on a
// wooden crutch, trunk wrapped in a shimenawa rope with paper shide.
{
  const parts = cherry(23, {
    vs: 0.115, pink: 'sk', top: 'skL', under: 'skK', speck: 'skW', petals: 30, trunkH: 1.25, lean: [-0.15, 0.05],
    limbs: [[1.9, 2.0, 0.3], [-1.6, 2.35, -0.35], [0.1, 2.75, -0.9], [-0.3, 2.6, 1.0], [0.2, 3.0, 0.1]],
    blobs: [
      [1.95, 2.3, 0.3, 0.95, 0.6, 0.9], [1.05, 2.75, 0.55, 0.9, 0.62, 0.85], [-1.55, 2.6, -0.35, 1.0, 0.62, 0.95], [-0.7, 3.05, -0.55, 0.9, 0.6, 0.85],
      [0.15, 3.0, -0.95, 0.95, 0.6, 0.8], [-0.3, 2.9, 1.0, 0.95, 0.6, 0.8], [0.2, 3.45, 0.15, 1.1, 0.6, 1.0],
    ],
  });
  const b = parts[0].s;
  b.push(cap([-0.08, 0, 0], [-0.15, 1.25, 0.05], 0.36, 0.27, 'bk', { stripes: { axis: 'y', p: 0.3, w: 0.1, col: 'bkD' }, dither: { col: 'bkL', amt: 0.12 }, jit: 0.05 }));
  // shimenawa + shide
  b.push(tor([-0.1, 0.85, 0.02], 0.36, 0.07, 'hy', { dither: { col: 'hyD', amt: 0.3 }, jit: 0.04 }));
  for (const a of [0.6, 1.57, 2.5]) {
    const x = -0.1 + Math.cos(a) * 0.42, z = 0.02 + Math.sin(a) * 0.42;
    b.push(...bitmap(['#.', '##', '.#', '##', '#.'], [x - 0.05, 0.78, z], 0.055, 0.02, { '#': 'w' }, 'xy', { rot: [0, (Math.PI / 2 - a) * 57.3, 0] }));
  }
  // wooden crutch under the long limb
  b.push(cyl([1.55, 0, 0.3], [1.5, 1.72, 0.28], 0.07, 'wd', { jit: 0.04 }));
  b.push(cap([1.5, 1.62, 0.28], [1.3, 1.85, 0.28], 0.05, 0.05, 'wd'), cap([1.5, 1.62, 0.28], [1.72, 1.86, 0.28], 0.05, 0.05, 'wd'));
  b.push(bx([1.5, 1.45, 0.28], [0.09, 0.05, 0.09], 'k'));
  prop('sakura2', 0.115, parts, TREE(0.9, ['park', 'tree', 'sakura', 'shrine', 'castle']), { fx: petalFx([[1.6, 1.9, 0.4], [-1.3, 2.1, -0.3], [0.2, 2.2, 1.0]]) });
}

prop('sakura3', 0.1, cherry(37, {
  scale: 0.78, pink: 'skL', top: 'skW', under: 'sk', speck: 'w', petals: 16, lean: [-0.15, 0.1],
  limbs: [[0.9, 2.5, 0.3], [-0.8, 2.6, -0.2], [0.0, 2.7, -0.9], [-0.1, 3.0, 0.7]],
  blobs: [[0.95, 2.8, 0.3, 0.95, 0.75, 0.9], [-0.85, 2.9, -0.25, 0.95, 0.75, 0.95], [0.05, 3.0, -0.9, 0.9, 0.7, 0.85], [-0.05, 3.5, 0.45, 1.05, 0.75, 1.0]],
}), TREE(0.6, ['park', 'tree', 'sakura']), { fx: petalFx([[0.7, 1.9, 0.4], [-0.6, 2.0, -0.3]]) });

// ---- Japanese black pine (niwaki) -------------------------------------
{
  const vs = 0.08;
  const T = [[0, 0, 0], [0.28, 0.85, 0.08], [0.1, 1.6, 0.0], [-0.22, 2.3, 0.05], [-0.05, 2.95, 0]];
  const body = [];
  const barkO = { dither: { col: '#3a302c', amt: 0.32 }, jit: 0.06 };
  const radii = [0.24, 0.18, 0.15, 0.12, 0.09];
  for (let i = 0; i < T.length - 1; i++) body.push(cap(T[i], T[i + 1], radii[i], radii[i + 1], '#5a4943', barkO));
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.8; body.push(cap([0, 0.3, 0], [Math.cos(a) * 0.5, 0.02, Math.sin(a) * 0.5], 0.14, 0.06, '#5a4943', barkO)); }
  // branches → pads
  const pads = [
    { from: T[1], c: [1.35, 1.05, 0.35], r: [0.75, 0.2, 0.55] },
    { from: T[2], c: [-1.05, 1.65, 0.25], r: [0.7, 0.2, 0.55] },
    { from: T[2], c: [0.75, 1.95, -0.45], r: [0.6, 0.19, 0.5] },
    { from: T[3], c: [-0.85, 2.45, -0.4], r: [0.55, 0.18, 0.45] },
    { from: T[3], c: [0.55, 2.6, 0.35], r: [0.55, 0.18, 0.45] },
    { from: T[4], c: [-0.05, 3.15, 0], r: [0.62, 0.24, 0.55] },
  ];
  const crown = [];
  for (const p of pads) {
    body.push(...tube(bez(p.from, [(p.from[0] + p.c[0]) / 2, p.from[1] + 0.05, (p.from[2] + p.c[2]) / 2], [p.c[0] * 0.8, p.c[1] - 0.08, p.c[2] * 0.8], 3), 0.1, 0.05, '#5a4943', barkO));
    crown.push(ell(p.c, p.r, 'pn', { noise: 0.06, noiseScale: 0.11, top: 'pnL', topT: 0.5, belly: 'pnD', bellyT: 0.3, dither: { col: 'pnK', amt: 0.12 }, jit: 0.06 }));
    crown.push(ell([p.c[0], p.c[1] + p.r[1] * 0.4, p.c[2]], [p.r[0] * 0.55, p.r[1] * 0.7, p.r[2] * 0.55], 'pnL', { noise: 0.04, noiseScale: 0.09, dither: { col: '#7fb27a', amt: 0.12 }, under: 1, jit: 0.06 }));
  }
  // bamboo crutch under the long branch (kanzashi support)
  body.push(cyl([1.55, 0, 0.42], [1.5, 0.98, 0.4], 0.045, '#c9b46a', { stripes: { axis: 'y', p: 0.32, w: 0.05, col: '#9c8a48' }, jit: 0.03 }));
  body.push(bx([1.5, 0.92, 0.4], [0.07, 0.04, 0.07], '#2a2420'));
  prop('pine', vs, [
    { n: 'body', p: [0, 0, 0], s: body },
    { n: 'crown', p: [0.1, 1.6, 0], s: crown, sway: { axis: 'z', amp: 0.008, freq: 0.3 } },
  ], TREE(0.7, ['park', 'tree', 'garden', 'castle']));
}

// ---- momiji (Japanese maple) ---------------------------------------
{
  const vs = 0.085;
  const body = [];
  const barkO = { dither: { col: '#5e4a40', amt: 0.25 }, jit: 0.05 };
  const fork = [0.05, 1.0, 0];
  body.push(cap([0, 0, 0], fork, 0.17, 0.13, '#7a6458', barkO));
  for (let i = 0; i < 3; i++) { const a = i * 2.09 + 0.3; body.push(cap([0, 0.25, 0], [Math.cos(a) * 0.4, 0.02, Math.sin(a) * 0.4], 0.11, 0.05, '#7a6458', barkO)); }
  const stems = [[0.75, 2.3, 0.3], [-0.7, 2.4, -0.15], [0.05, 2.6, -0.7], [-0.15, 2.5, 0.7], [0.1, 2.9, 0]];
  for (const s of stems) body.push(...tube(bez(fork, [s[0] * 0.3, 1.7, s[2] * 0.3], s, 3), 0.1, 0.05, '#7a6458', barkO));
  const r = rng(91);
  for (let i = 0; i < 18; i++) { const a = r() * 6.283, d = 0.5 + r() * 1.4; body.push(vox(vs, Math.cos(a) * d, 0, Math.sin(a) * d, r() < 0.5 ? 'mp' : 'mpO')); }
  const crown = [];
  const O = (top, d, amt = 0.1) => ({ noise: 0.1, noiseScale: 0.24, top, topT: 0.6, belly: 'mpD', bellyT: 0.25, dither: { col: d, amt }, jit: 0.06 });
  const L = [
    [0.8, 2.3, 0.3, 0.75, 0.45, 0.7, 'mp', 'mpO', 'mpD'], [-0.75, 2.4, -0.15, 0.75, 0.45, 0.7, 'mp', 'mpO', 'mpD'], [0.05, 2.45, -0.75, 0.7, 0.42, 0.65, 'mpD', 'mp', 'mp'],
    [-0.15, 2.45, 0.75, 0.7, 0.42, 0.65, 'mp', 'mpO', 'mpD'], [0.15, 2.95, 0.05, 0.85, 0.5, 0.8, 'mp', 'mpO', 'mpD'], [-0.4, 3.1, -0.3, 0.5, 0.34, 0.5, 'mpO', 'mpY', 'mp'],
    [1.15, 2.0, -0.35, 0.45, 0.3, 0.45, 'mp', 'mpO', 'mpD'], [-1.1, 2.05, 0.4, 0.45, 0.3, 0.42, 'mpD', 'mp', 'mp'],
  ];
  for (const l of L) crown.push(ell([l[0], l[1], l[2]], [l[3], l[4], l[5]], l[6], O(l[7] === 'mpO' ? '#ee6232' : l[7], l[8] === 'mpD' ? 'mpO' : l[8], 0.12)));
  prop('maple', vs, [
    { n: 'body', p: [0, 0, 0], s: body },
    { n: 'crown', p: fork, s: crown, sway: { axis: 'z', amp: 0.012, freq: 0.4 } },
  ], TREE(0.5, ['park', 'tree', 'autumn', 'garden']), { fx: [{ part: 'crown', at: [0.6, 2.0, 0.4], type: 'leaf', rate: 0.3, color: '#e0582c' }, { part: 'crown', at: [-0.6, 2.1, -0.3], type: 'leaf', rate: 0.3, color: '#f08a2c' }] });
}

// ---- bamboo cluster -------------------------------------------------
{
  const vs = 0.07;
  const r = rng(5);
  const culms = [];
  const spots = [[0, 0], [0.28, 0.14], [-0.21, 0.21], [0.14, -0.28], [-0.35, -0.14], [0.42, -0.14], [-0.07, 0.42]];
  spots.forEach(([x, z], i) => {
    const h = 3.4 + r() * 1.5, lean = [(x) * 0.3, (z) * 0.3];
    const thick = i % 3 === 0 ? 0.06 : 0.035;
    const col = i % 2 ? '#7fb54c' : '#93c25a';
    culms.push(cap([x, 0, z], [x + lean[0], h, z + lean[1]], thick, thick * 0.7, col, { stripes: { axis: 'y', p: 0.42, w: 0.07, col: '#5f8f3a', o: r() * 0.4 }, grad: { axis: 'y', to: '#b7cf6a', a: 0, b: h }, jit: 0.04 }));
    // feathery leaf fans near the top
    for (let k = 0; k < 3; k++) {
      const y = h * (0.66 + k * 0.12), a = r() * 6.283;
      const lx = x + lean[0] * (y / h), lz = z + lean[1] * (y / h);
      const ex = lx + Math.cos(a) * 0.45, ez = lz + Math.sin(a) * 0.45;
      culms.push(cap([lx, y, lz], [ex, y - 0.12, ez], 0.03, 0.03, '#6a9a3c', { jit: 0.03 }));
      culms.push(ell([ex, y - 0.16, ez], [0.3, 0.06, 0.13], k % 2 ? '#4f8a36' : '#6aa844', { rot: [0, -a * 57.3, -12], top: '#8cc45a', topT: 0.6, jit: 0.06 }));
      culms.push(ell([ex + Math.cos(a + 1.3) * 0.12, y - 0.22, ez + Math.sin(a + 1.3) * 0.12], [0.24, 0.05, 0.1], '#5a9a3e', { rot: [0, -(a + 1.3) * 57.3, -15], top: '#8cc45a', topT: 0.6, jit: 0.06 }));
    }
  });
  const body = [];
  // shoots + leaf litter
  body.push(cap([0.45, 0, 0.3], [0.47, 0.32, 0.31], 0.08, 0.02, '#8a6a40', { stripes: { axis: 'y', p: 0.08, w: 0.03, col: '#5e4628' } }));
  body.push(cap([-0.3, 0, -0.42], [-0.31, 0.22, -0.43], 0.06, 0.02, '#8a6a40', { stripes: { axis: 'y', p: 0.08, w: 0.03, col: '#5e4628' } }));
  body.push(ell([0, 0, 0], [0.62, 0.06, 0.62], '#a89a62', { dither: { col: '#7a8a46', amt: 0.4 }, jit: 0.05 }));
  prop('bamboo', vs, [
    { n: 'body', p: [0, 0, 0], s: body },
    { n: 'culms', p: [0, 0, 0], s: culms, sway: { axis: 'x', amp: 0.018, freq: 0.45 } },
  ], TREE(1.0, ['park', 'garden', 'shrine', 'bamboo']));
}

// ---- azalea bush ----------------------------------------------------
prop('bush', 0.06, [
  ell([0, 0.42, 0], [0.62, 0.45, 0.55], 'lf', { noise: 0.07, noiseScale: 0.12, top: 'lfL', topT: 0.5, belly: 'lfD', spots: { col: 'pp', d: 0.16, s: 0.07 }, jit: 0.06 }),
  ell([0.45, 0.32, 0.15], [0.42, 0.34, 0.4], 'lf', { noise: 0.06, noiseScale: 0.11, top: 'lfL', topT: 0.5, belly: 'lfD', spots: { col: '#ff8fb0', d: 0.16, s: 0.07, seed: 3 }, jit: 0.06 }),
  ell([-0.42, 0.3, -0.1], [0.42, 0.32, 0.4], 'lf', { noise: 0.06, noiseScale: 0.11, top: 'lfL', topT: 0.5, belly: 'lfD', spots: { col: 'skW', d: 0.12, s: 0.07, seed: 7 }, jit: 0.06 }),
  ell([0, 0.04, 0], [0.75, 0.06, 0.6], 'lfD', { under: 1 }),
], { footprint: [1.4, 1.1], solid: true, tags: ['park', 'garden', 'nature'] });

// ---- flower bed -----------------------------------------------------
{
  const vs = 0.06, s = [];
  // stone kerb + soil
  s.push(box(-1.0, 0, -0.45, 1.0, 0.25, 0.45, 'st', { dither: { col: 'stD', amt: 0.25 }, stripes: { axis: 'x', p: 0.4, w: 0.05, col: 'stK' }, jit: 0.05 }));
  s.push(box(-0.9, 0.15, -0.35, 0.9, 0.3, 0.35, 'dt', { sub: 1 }));
  s.push(box(-0.9, 0.05, -0.35, 0.9, 0.2, 0.35, 'dt', { dither: { col: 'dtD', amt: 0.35 }, jit: 0.06 }));
  const cols = ['#ff5a6e', '#ffd84a', '#ff9ec4', '#ffffff', '#ff7a3a', '#c79bff'];
  const r = rng(77);
  // leafy carpet, then tulips standing out of it
  s.push(ell([0, 0.24, 0], [0.86, 0.09, 0.32], '#5fa344', { noise: 0.03, noiseScale: 0.06, top: '#7cbc55', jit: 0.06 }));
  for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) {
    const x = -0.75 + i * 0.215 + (j % 2) * 0.1, z = -0.13 + j * 0.26;
    const h = 0.42 + r() * 0.12;
    const c = cols[(i + j * 3) % cols.length];
    s.push(box(x - 0.01, 0.25, z - 0.01, x + 0.01, h, z + 0.01, '#4f8f38', { jit: 0.03 }));
    s.push(box(x - 0.05, h, z - 0.05, x + 0.05, h + 0.1, z + 0.05, c, { jit: 0.05 }));
    s.push(box(x - 0.01, h + 0.06, z - 0.06, x + 0.01, h + 0.11, z + 0.06, 'k', { sub: 1 }));
  }
  prop('flowerbed', vs, s, { footprint: [2, 0.9], solid: true, tags: ['park', 'garden', 'street'] });
}

// ---- tall grass (stealth grass) ---------------------------------------
{
  const vs = 0.06, r = rng(19), blades = [];
  for (let i = 0; i < 15; i++) {
    const a = i * 2.4 + r() * 0.5, d = 0.12 + Math.sqrt(r()) * 0.3;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const h = 0.75 + r() * 0.4 - d * 0.4, out = 0.12 + d * 0.5;
    const col = ['gr', 'grD', 'lf', '#86c050'][i % 4];
    blades.push(...tube(bez([x, 0.1, z], [x * 1.05, h * 0.55, z * 1.05], [x + Math.cos(a) * out, h, z + Math.sin(a) * out], 2), 0.085, 0.025, col, { tip: i % 3 ? 'grL' : 'grY', tipT: 0.8, jit: 0.05 }));
  }
  blades.push(ell([0, 0.14, 0], [0.48, 0.22, 0.48], 'grD', { noise: 0.04, noiseScale: 0.08, top: 'gr', jit: 0.06 }));
  prop('tallgrass', vs, [
    { n: 'body', p: [0, 0, 0], s: [ell([0, 0.02, 0], [0.5, 0.04, 0.5], 'grD')] },
    { n: 'blades', p: [0, 0, 0], s: blades, sway: { axis: 'x', amp: 0.05, freq: 0.55 } },
  ], { footprint: [1.1, 1.1], solid: false, tags: ['nature', 'grass', 'stealth', 'encounter'] });
}

// ---- rocks ----------------------------------------------------------
const ROCK = (top) => ({ noise: 0.05, noiseScale: 0.14, top, topT: 0.6, dither: { col: 'stD', amt: 0.22 }, jit: 0.06 });
prop('rock_s', 0.05, [
  bx([0, 0.16, 0], [0.26, 0.17, 0.2], 'st', { round: 0.08, rot: [4, 20, -6], noise: 0.03, noiseScale: 0.1, top: 'stL', topT: 0.6, dither: { col: 'stD', amt: 0.22 }, jit: 0.06 }),
  bx([0.2, 0.08, 0.12], [0.12, 0.09, 0.1], 'stD', { round: 0.04, rot: [0, -25, 8], dither: { col: 'stK', amt: 0.2 }, jit: 0.06 }),
], { footprint: [0.6, 0.5], solid: true, tags: ['nature', 'rock'] });

prop('rock_m', 0.06, [
  bx([0, 0.36, 0], [0.5, 0.38, 0.4], 'st', { round: 0.16, rot: [6, 30, -5], ...ROCK('ms') }),
  bx([0.42, 0.2, 0.25], [0.24, 0.2, 0.22], 'stD', { round: 0.08, rot: [0, -20, 10], noise: 0.04, noiseScale: 0.1, top: 'stL', dither: { col: 'stK', amt: 0.2 }, jit: 0.06 }),
  bx([-0.4, 0.14, -0.2], [0.2, 0.15, 0.18], 'st', { round: 0.06, rot: [0, 40, -8], noise: 0.03, top: 'msL', dither: { col: 'stD', amt: 0.2 }, jit: 0.06 }),
], { footprint: [1.2, 1.0], solid: true, tags: ['nature', 'rock'] });

{
  const s = [
    ell([0, 0.85, 0], [1.25, 0.95, 1.05], 'st', { noise: 0.12, noiseScale: 0.32, dither: { col: 'stD', amt: 0.2 }, jit: 0.06 }),
    ell([0.85, 0.45, 0.55], [0.6, 0.5, 0.55], 'stW', { noise: 0.08, noiseScale: 0.22, dither: { col: 'stD', amt: 0.2 }, jit: 0.06 }),
    ell([-0.9, 0.35, -0.4], [0.55, 0.4, 0.5], 'stD', { noise: 0.07, noiseScale: 0.2, dither: { col: 'stK', amt: 0.2 }, jit: 0.06 }),
    // moss cap: organic blobs painted over the crown, darker at the fringe
    ell([0.05, 1.75, -0.1], [1.0, 0.42, 0.85], 'msD', { paint: 1, noise: 0.12, noiseScale: 0.25, dither: { col: 'ms', amt: 0.4 }, jit: 0.06 }),
    ell([0.05, 1.85, -0.1], [0.82, 0.35, 0.7], 'ms', { paint: 1, noise: 0.1, noiseScale: 0.22, dither: { col: 'msL', amt: 0.25 }, jit: 0.06 }),
    ell([0.95, 0.95, 0.55], [0.4, 0.15, 0.4], 'msD', { paint: 1, noise: 0.08, noiseScale: 0.15, dither: { col: 'ms', amt: 0.4 } }),
    ell([-0.95, 0.75, -0.4], [0.35, 0.12, 0.35], 'msD', { paint: 1, noise: 0.08, noiseScale: 0.15 }),
  ];
  // ferns at the foot
  const r = rng(4);
  for (let i = 0; i < 7; i++) {
    const a = 0.3 + i * 0.85 + r() * 0.3, d = 1.15 + r() * 0.2;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    for (let k = 0; k < 3; k++) { const b = a + (k - 1) * 0.6; s.push(cap([x, 0.02, z], [x + Math.cos(b) * 0.3, 0.32 + r() * 0.1, z + Math.sin(b) * 0.3], 0.05, 0.03, k === 1 ? 'lf' : 'lfD', { tip: 'lfL', jit: 0.05 })); }
  }
  prop('rock_l', 0.08, s, { footprint: [2.4, 2.0], solid: true, tags: ['nature', 'rock', 'landmark-small'] });
}

// ---- fallen log -------------------------------------------------------
{
  const s = [
    cap([-1.05, 0.3, 0], [1.05, 0.3, 0.05], 0.3, 0.28, 'bk', { dither: { col: 'bkD', amt: 0.3 }, top: 'bkL', topT: 0.7, jit: 0.06 }),
    // cut ends with growth rings
    cyl([-1.36, 0.3, 0], [-1.2, 0.3, 0], 0.26, 'wdP', { paint: 1, jit: 0.03 }),
    tor([-1.3, 0.3, 0], 0.17, 0.025, 'wdL', { axis: 'x', paint: 1 }), tor([-1.3, 0.3, 0], 0.08, 0.025, 'wdL', { axis: 'x', paint: 1 }),
    cyl([1.2, 0.3, 0.05], [1.36, 0.3, 0.05], 0.24, 'wdP', { paint: 1, jit: 0.03 }),
    tor([1.3, 0.3, 0.05], 0.15, 0.025, 'wdL', { axis: 'x', paint: 1 }),
    // moss blanket + shelf fungus + a sprout
    ell([0.2, 0.58, 0], [0.75, 0.12, 0.25], 'ms', { paint: 1, dither: { col: 'msL', amt: 0.3 } }),
    ell([-0.6, 0.5, 0.0], [0.3, 0.12, 0.25], 'msD', { paint: 1 }),
    ell([0.5, 0.36, 0.3], [0.13, 0.03, 0.08], '#e8c48a', { top: '#c98a4a', jit: 0.04 }),
    ell([0.66, 0.28, 0.31], [0.1, 0.025, 0.07], '#e8c48a', { top: '#c98a4a', jit: 0.04 }),
    cap([-0.3, 0.58, 0.05], [-0.25, 0.85, 0.08], 0.03, 0.02, 'lf'),
    ell([-0.22, 0.86, 0.1], [0.08, 0.03, 0.06], 'lfL'), ell([-0.3, 0.82, 0.02], [0.07, 0.03, 0.05], 'lf'),
  ];
  prop('log', 0.06, s, { footprint: [2.6, 0.7], solid: true, tags: ['nature', 'forest'] });
}

// ---- tree stump with an axe -----------------------------------------
{
  const s = [];
  for (let i = 0; i < 5; i++) { const a = i * 1.256 + 0.3; s.push(cap([0, 0.25, 0], [Math.cos(a) * 0.52, 0.02, Math.sin(a) * 0.52], 0.12, 0.05, 'bk', { dither: { col: 'bkD', amt: 0.3 } })); }
  s.push(vcyl(0, 0, 0, 0.55, 0.34, 'bk', { dither: { col: 'bkD', amt: 0.3 }, jit: 0.06 }));
  s.push(vcyl(0, 0, 0.5, 0.58, 0.3, 'wdP', { paint: 1, jit: 0.03 }));
  for (const R of [0.22, 0.13, 0.05]) s.push(tor([0, 0.56, 0], R, 0.02, 'wdL', { paint: 1, jit: 0.02 }));
  // axe
  s.push(cap([0.05, 0.56, 0.05], [0.42, 1.0, 0.25], 0.03, 0.03, '#b98a52', { jit: 0.03 }));
  s.push(poly([0.02, 0.6, 0.03], [[-0.14, -0.05], [0.12, -0.08], [0.12, 0.1], [-0.12, 0.06]], 0.025, 'mtL', { rot: [0, -33, 40], jit: 0.03 }));
  s.push(ell([-0.3, 0.06, 0.32], [0.08, 0.06, 0.08], '#e8c48a', { top: '#b5763e' }));
  s.push(cap([-0.3, 0, 0.32], [-0.3, 0.05, 0.32], 0.025, 0.025, 'cr'));
  s.push(ell([0.25, 0.42, -0.25], [0.15, 0.1, 0.12], 'ms', { paint: 1 }));
  prop('stump', 0.04, s, { footprint: [0.8, 0.8], solid: true, tags: ['nature', 'forest', 'farm'] });
}

// ---- mushrooms --------------------------------------------------------
{
  const caps = [], stems = [];
  const shroom = (x, z, h, r, cap0, spot, stem = '#f3e7cf') => {
    caps.push(ell([x, h, z], [r, r * 0.62, r], cap0, { spots: spot ? { col: spot, d: 0.22, s: r * 0.28 } : undefined, jit: 0.04 }));
    caps.push(ell([x, h - r * 0.62, z], [r * 1.1, r * 0.6, r * 1.1], 'k', { sub: 1 }));
    stems.push(ell([x, h - r * 0.04, z], [r * 0.88, r * 0.06, r * 0.88], '#f6ead2', { under: 1 }));
    stems.push(cap([x, 0, z], [x, h, z], r * 0.32, r * 0.26, stem, { jit: 0.03 }));
  };
  shroom(0.02, 0, 0.36, 0.17, '#e23b3b', 'w');
  shroom(0.2, 0.12, 0.2, 0.1, '#e8553f', 'w');
  shroom(-0.18, 0.08, 0.24, 0.11, '#c98a4a', '#e8c48a');
  shroom(-0.07, -0.2, 0.15, 0.07, '#c98a4a', null);
  shroom(0.22, -0.12, 0.11, 0.055, '#e23b3b', 'w');
  const s = [...caps, ell([0, 0, 0], [0.42, 0.08, 0.36], 'ms', { noise: 0.02, noiseScale: 0.05, dither: { col: 'msL', amt: 0.3 } }), ...stems];
  prop('mushrooms', 0.034, s,{ footprint: [0.6, 0.5], solid: false, tags: ['nature', 'forest'] });
}

// ---- reeds / cattails ---------------------------------------------------
{
  const vs = 0.05, r = rng(8), st = [];
  for (let i = 0; i < 16; i++) {
    const a = r() * 6.283, d = Math.sqrt(r()) * 0.38, x = Math.cos(a) * d, z = Math.sin(a) * d;
    const h = 1.0 + r() * 0.6, lx = x + Math.cos(a) * 0.12, lz = z + Math.sin(a) * 0.12;
    if (i % 3 === 0) {
      st.push(cap([x, 0, z], [lx, h, lz], 0.025, 0.02, '#7da04a'));
      st.push(cap([lx, h - 0.06, lz], [lx, h - 0.28, lz], 0.05, 0.05, '#6b4128', { jit: 0.04 }));
      st.push(cap([lx, h, lz], [lx, h + 0.1, lz], 0.015, 0.015, '#9a8a5a'));
    } else {
      st.push(...tube(bez([x, 0, z], [x, h * 0.6, z], [x + Math.cos(a) * 0.35, h * 0.85, z + Math.sin(a) * 0.35], 3), 0.035, 0.018, i % 2 ? '#6f9c45' : '#88b553', { tip: '#c8c27a', jit: 0.04 }));
    }
  }
  prop('reeds', vs, [
    { n: 'body', p: [0, 0, 0], s: [ell([0, 0.02, 0], [0.45, 0.04, 0.45], '#5a7a3a')] },
    { n: 'stalks', p: [0, 0, 0], s: st, sway: { axis: 'z', amp: 0.05, freq: 0.5 } },
  ], { footprint: [0.9, 0.9], solid: false, tags: ['nature', 'water', 'grass'] });
}

// ---- lily pads + lotus ----------------------------------------------------
{
  const s = [];
  const pad = (x, z, R, a) => {
    s.push(vcyl(x, z, 0, 0.03, R, '#4f9a3e', { stripes: { axis: 'x', p: 0.12, w: 0.03, col: '#6fb850' }, jit: 0.05 }));
    s.push(poly([x, 0.015, z], [[0, 0], [Math.cos(a - 0.3) * R * 1.2, Math.sin(a - 0.3) * R * 1.2], [Math.cos(a + 0.3) * R * 1.2, Math.sin(a + 0.3) * R * 1.2]], 0.05, 'k', { plane: 'xz', sub: 1 }));
  };
  pad(0, 0, 0.42, 0.6); pad(0.62, 0.35, 0.28, 2.6); pad(-0.5, 0.42, 0.24, -1.2); pad(-0.35, -0.5, 0.3, 1.9);
  // lotus
  for (let i = 0; i < 8; i++) { const a = i * 0.785; s.push(ell([Math.cos(a) * 0.09, 0.12, Math.sin(a) * 0.09], [0.07, 0.11, 0.04], i % 2 ? '#ff9ec4' : '#ffc4dc', { rot: [0, -a * 57.3, 0], top: 'skW', jit: 0.04 })); }
  s.push(ell([0, 0.16, 0], [0.06, 0.05, 0.06], '#ffd84a'));
  s.push(ell([0.62, 0.15, 0.35], [0.05, 0.1, 0.05], '#ff9ec4', { tip: 'skW' }));
  prop('lilypad', 0.04, s, { footprint: [1.4, 1.2], solid: false, tags: ['nature', 'water'] });
}

// ---- waterfall rock ---------------------------------------------------------
{
  const vs = 0.1, s = [];
  const RO = (c) => ({ noise: 0.1, noiseScale: 0.28, top: 'ms', topT: 0.55, dither: { col: c, amt: 0.22 }, jit: 0.06 });
  s.push(ell([0, 1.0, -0.35], [1.55, 1.25, 0.9], 'st', RO('stD')));
  s.push(ell([1.15, 0.6, 0.15], [0.7, 0.65, 0.65], 'stD', RO('stK')));
  s.push(ell([-1.2, 0.55, 0.1], [0.75, 0.6, 0.7], 'stW', RO('stD')));
  s.push(ell([0.0, 2.15, -0.5], [0.85, 0.45, 0.6], 'stW', RO('stD')));
  // channel carved in the top, water falling over the lip into a pool
  s.push(box(-0.35, 1.9, -0.6, 0.35, 2.6, 0.7, 'k', { sub: 1 }));
  s.push(box(-0.32, 1.85, -0.55, 0.32, 1.95, 0.45, 'wa', { glow: 1, jit: 0.04 }));
  s.push(box(-0.33, 0.05, 0.35, 0.33, 1.95, 0.5, 'waL', { glow: 1, stripes: { axis: 'x', p: 0.2, w: 0.1, col: 'waW' }, jit: 0.06 }));
  s.push(box(-0.33, 0.05, 0.25, 0.33, 1.9, 0.38, 'wa', { glow: 1, under: 1 }));
  s.push(ell([0, 0.04, 1.05], [1.0, 0.07, 0.62], 'wa', { glow: 1, dither: { col: 'waL', amt: 0.3 }, jit: 0.05 }));
  s.push(ell([0, 0.08, 0.62], [0.5, 0.1, 0.22], 'waW', { glow: 1, dither: { col: 'waL', amt: 0.4 } }));
  // pool rim stones
  const r = rng(12);
  for (let i = 0; i < 9; i++) { const a = -0.2 + i * 0.42, x = Math.cos(a) * 1.15, z = 1.05 + Math.sin(a) * 0.72; if (z < 0.6) continue; s.push(ell([x, 0.1, z], [0.2 + r() * 0.08, 0.14, 0.18], i % 2 ? 'st' : 'stW', { noise: 0.03, top: 'stL', dither: { col: 'stD', amt: 0.2 } })); }
  prop('waterfall_rock', vs, s, { footprint: [3.2, 2.2], solid: true, tags: ['nature', 'water', 'park', 'landmark-small'] },
    { fx: [{ part: 'body', at: [0, 0.25, 0.65], type: 'steam', rate: 0.6, scale: 1.4 }, { part: 'body', at: [0, 1.9, 0.48], type: 'drip', rate: 1 }] });
}

// =====================================================================
// PARK / CULTURE
// =====================================================================

// ---- stone lantern (kasuga tōrō) -----------------------------------------
{
  const vs = 0.04, s = [];
  const ST = { dither: { col: 'stD', amt: 0.25 }, jit: 0.05 };
  s.push(prism(6, 0, 0, 0, 0.16, 0.4, 'st', ST));
  s.push(vcyl(0, 0, 0.16, 0.26, 0.28, 'stW', ST));
  s.push(vcyl(0, 0, 0.26, 0.98, 0.12, 'st', ST));
  s.push(tor([0, 0.62, 0], 0.12, 0.03, 'stW', { jit: 0.04 }));
  s.push(vcyl(0, 0, 0.92, 1.0, 0.24, 'stW', ST));
  s.push(prism(6, 0, 0, 1.0, 1.1, 0.36, 'st', ST));
  // fire box: glowing paper behind a front window, sun & moon cut-outs on the sides
  s.push(prism(6, 0, 0, 1.1, 1.44, 0.24, 'st', ST));
  s.push(box(-0.09, 1.16, 0.1, 0.09, 1.38, 0.3, 'k', { sub: 1 }));
  s.push(cyl([0.12, 1.27, 0], [0.3, 1.27, 0], 0.07, 'k', { sub: 1 }));
  s.push(cyl([-0.12, 1.27, 0], [-0.3, 1.27, 0], 0.075, 'k', { sub: 1 }));
  s.push(cyl([-0.12, 1.29, 0.04], [-0.3, 1.29, 0.04], 0.06, 'st', ST));
  s.push(prism(6, 0, 0, 1.13, 1.41, 0.15, '#ffc46a', { glow: 2, jit: 0.04 }));
  // roof with upturned warabide corners, moss on top, onion finial
  s.push(prism(6, 0, 0, 1.44, 1.52, 0.52, 'st', ST));
  s.push(prism(6, 0, 0, 1.52, 1.58, 0.42, 'st', ST));
  s.push(prism(6, 0, 0, 1.58, 1.64, 0.31, 'st', ST));
  s.push(prism(6, 0, 0, 1.64, 1.7, 0.19, 'st', ST));
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i / 6) * Math.PI * 2; s.push(sph([Math.cos(a) * 0.5, 1.56, Math.sin(a) * 0.5], 0.05, 'st', ST)); }
  s.push(prism(6, 0, 0, 1.5, 1.7, 0.42, 'ms', { paint: 1, dither: { col: 'msD', amt: 0.4 } }));
  s.push(vcyl(0, 0, 1.7, 1.76, 0.08, 'stW', ST));
  s.push(sph([0, 1.84, 0], 0.09, 'st', ST));
  s.push(cap([0, 1.88, 0], [0, 1.98, 0], 0.05, 0.015, 'st', ST));
  s.push(ell([0.22, 0.17, 0.18], [0.12, 0.05, 0.1], 'ms', { paint: 1 }));
  prop('stone_lantern', vs, s, { footprint: [0.8, 0.8], solid: true, destructible: true, hp: 120, debris: ['#b8ad9a', '#8f8575', '#7fa64e'], light: { color: '#ffb35a', intensity: 1.6, y: 1.27, range: 4.5, night: true }, tags: ['park', 'shrine', 'castle', 'garden', 'light'] });
}

// ---- torii gate ------------------------------------------------------------
{
  const vs = 0.07, s = [];
  const V = { dither: { col: 'vmD', amt: 0.1 }, jit: 0.04 };
  for (const sx of [1, -1]) {
    s.push(cap([sx * 1.5, 0, 0], [sx * 1.42, 3.05, 0], 0.18, 0.15, 'vm', V));
    s.push(vcyl(sx * 1.5, 0, 0, 0.36, 0.22, 'ink', { jit: 0.03 }));
    s.push(vcyl(sx * 1.5, 0, 0.36, 0.42, 0.2, 'gd', { jit: 0.03 }));
    s.push(vcyl(sx * 1.5, 0, -0.04, 0.06, 0.3, 'stW', { dither: { col: 'stD', amt: 0.2 } }));
  }
  // nuki (tie beam), gakuzuka + plaque, shimaki, kasagi with upswept ends
  s.push(box(-2.05, 2.32, -0.1, 2.05, 2.52, 0.1, 'vm', V));
  s.push(box(-0.1, 2.52, -0.08, 0.1, 2.98, 0.08, 'vm', V));
  s.push(box(-0.3, 2.44, 0.06, 0.3, 2.94, 0.14, 'ink', { jit: 0.03 }));
  s.push(box(-0.24, 2.5, 0.12, 0.24, 2.88, 0.16, 'gd', { jit: 0.04 }));
  s.push(box(-0.2, 2.54, 0.14, 0.2, 2.84, 0.18, 'ink', { jit: 0.02 }));
  s.push(...bitmap(['a.a', '.a.', 'aaa', '.a.', 'a.a', '...', 'aaa', 'a.a', 'aaa'], [-0.07, 2.79, 0.19], 0.035, 0.012, { a: 'gd' }));
  s.push(box(-2.3, 2.95, -0.13, 2.3, 3.16, 0.13, 'vm', V));
  s.push(poly([0, 0, 0], [[-2.66, 3.62], [-2.3, 3.45], [-1.4, 3.38], [0, 3.36], [1.4, 3.38], [2.3, 3.45], [2.66, 3.62], [2.6, 3.36], [2.2, 3.17], [0, 3.15], [-2.2, 3.17], [-2.6, 3.36]], 0.18, 'ink', { jit: 0.03, top: 'inkL' }));
  prop('torii', vs, s, { footprint: [5.3, 0.5], solid: false, colliders: [[-1.48, 0, 0.5, 0.5], [1.48, 0, 0.5, 0.5]], tags: ['shrine', 'park', 'landmark-small', 'gate'] });
}

// ---- park bench --------------------------------------------------------------
{
  const vs = 0.04, s = [];
  const IR = { jit: 0.03 };
  for (const sx of [0.68, -0.68]) {
    s.push(...tube([[sx, 0, 0.24], [sx, 0.44, 0.2], [sx, 0.6, 0.24]], 0.035, 0.03, '#2f5b55', IR));
    s.push(...tube([[sx, 0, -0.22], [sx, 0.44, -0.2], [sx, 0.9, -0.3]], 0.035, 0.03, '#2f5b55', IR));
    s.push(cap([sx, 0.6, 0.26], [sx, 0.62, -0.2], 0.035, 0.035, '#2f5b55', IR));
    s.push(box(sx - 0.04, 0.4, -0.22, sx + 0.04, 0.44, 0.24, '#2f5b55', IR));
    s.push(sph([sx, 0.61, 0.28], 0.05, 'gd', { jit: 0.03 }));
  }
  for (let i = 0; i < 4; i++) { const z = -0.15 + i * 0.11; s.push(box(-0.8, 0.44, z - 0.04, 0.8, 0.49, z + 0.04, i % 2 ? 'wd' : 'wdL', { dither: { col: 'wdD', amt: 0.08 }, jit: 0.05 })); }
  for (let i = 0; i < 3; i++) { const y = 0.6 + i * 0.11, z = -0.24 - i * 0.025; s.push(box(-0.8, y - 0.04, z - 0.02, 0.8, y + 0.04, z + 0.02, i % 2 ? 'wdL' : 'wd', { dither: { col: 'wdD', amt: 0.08 }, jit: 0.05 })); }
  prop('bench', vs, s, { footprint: [1.7, 0.6], solid: true, destructible: true, hp: 50, debris: ['#a8744a', '#c99a68', '#2f5b55'], tags: ['park', 'street'] });
}

// ---- stone bench ---------------------------------------------------------------
prop('bench_stone', 0.05, [
  box(-0.55, 0, -0.18, -0.3, 0.36, 0.18, 'stD', { dither: { col: 'stK', amt: 0.2 }, jit: 0.05 }),
  box(0.3, 0, -0.18, 0.55, 0.36, 0.18, 'stD', { dither: { col: 'stK', amt: 0.2 }, jit: 0.05 }),
  bx([0, 0.42, 0], [0.75, 0.07, 0.25], 'st', { round: 0.03, dither: { col: 'stD', amt: 0.2 }, top: 'stL', topT: 0.7, jit: 0.05 }),
  ell([-0.45, 0.04, 0.12], [0.18, 0.07, 0.1], 'ms', { dither: { col: 'msD', amt: 0.3 } }),
  ell([0.6, 0.46, -0.15], [0.14, 0.04, 0.1], 'ms', { paint: 1 }),
], { footprint: [1.5, 0.5], solid: true, tags: ['park', 'garden', 'shrine'] });

// ---- 2050 vending machine ----------------------------------------------------
{
  const vs = 0.04, s = [];
  s.push(bx([0, 0.93, -0.02], [0.52, 0.93, 0.38], 'wh', { round: 0.05, jit: 0.03 }));
  s.push(box(-0.53, 0.06, -0.4, 0.53, 0.14, 0.37, 'tl', { paint: 1, jit: 0.03 }));
  s.push(box(-0.53, 1.66, -0.4, 0.53, 1.86, 0.37, 'tl', { paint: 1, jit: 0.03 }));
  // display window (recessed, backlit) with three shelves of drinks
  s.push(box(-0.44, 0.92, 0.3, 0.3, 1.62, 0.4, 'k', { sub: 1 }));
  s.push(box(-0.44, 0.92, 0.26, 0.3, 1.62, 0.3, '#dff6ff', { glow: 1, jit: 0.02 }));
  const cans = ['#ff4b4b', '#ff9a2e', '#ffe24a', '#4fd36b', '#3fa8ff', '#ffffff', '#c86bff', '#ff6bb5'];
  for (let row = 0; row < 3; row++) {
    const y = 1.0 + row * 0.22;
    s.push(box(-0.44, y - 0.04, 0.26, 0.3, y - 0.02, 0.36, 'mtL', { jit: 0.02 }));
    for (let i = 0; i < 6; i++) {
      const x = -0.38 + i * 0.12;
      s.push(box(x - 0.035, y, 0.28, x + 0.035, y + 0.13, 0.33, cans[(i + row * 3) % cans.length], { glow: 1, jit: 0.03 }));
      s.push(box(x - 0.015, y - 0.04, 0.34, x + 0.015, y - 0.02, 0.37, row === 1 && i === 2 ? 'nr' : 'ng', { glow: 2 }));
    }
  }
  // payment column, slot, dispenser, light bar, side holo-ad
  s.push(box(0.34, 1.2, 0.36, 0.48, 1.42, 0.39, 'nc', { glow: 2, stripes: { axis: 'y', p: 0.08, w: 0.04, col: '#1a6a8a' } }));
  s.push(box(0.36, 1.0, 0.36, 0.46, 1.1, 0.39, 'mtK'));
  s.push(box(0.39, 1.03, 0.38, 0.43, 1.07, 0.4, 'nm', { glow: 2 }));
  s.push(box(-0.36, 0.22, 0.3, 0.36, 0.44, 0.4, 'k', { sub: 1 }));
  s.push(box(-0.36, 0.22, 0.28, 0.36, 0.44, 0.31, 'ink'));
  s.push(box(-0.36, 0.4, 0.31, 0.36, 0.44, 0.37, 'mtK'));
  s.push(box(-0.5, 1.76, 0.35, 0.5, 1.8, 0.4, 'nm', { glow: 2 }));
  s.push(box(0.53, 0.5, -0.3, 0.56, 1.5, 0.25, 'nc', { glow: 1, stripes: { axis: 'y', p: 0.1, w: 0.03, col: '#7ff8ff' } }));
  s.push(...bitmap(['.aa.', 'abba', 'abba', 'abba', 'abba', 'abba', '.aa.'], [0.565, 1.2, 0.0], 0.06, 0.012, { a: { c: 'nm', glow: 2 }, b: { c: 'w', glow: 2 } }, 'zy'));
  s.push(box(-0.53, 0, -0.42, 0.53, 0.05, 0.4, 'mtD'));
  prop('vending', vs, s, { footprint: [1.1, 0.85], solid: true, destructible: true, hp: 120, debris: ['#f4f2ec', '#3d8d89', '#ff4ac8', '#3ff0ff'], light: { color: '#bff4ff', intensity: 2.2, y: 1.3, range: 4.5, night: true }, tags: ['street', 'shop', 'neon', 'light'] });
}

// ---- recycling bins ------------------------------------------------------------
{
  const vs = 0.04, s = [];
  s.push(box(-0.72, 0, -0.26, 0.72, 0.06, 0.26, 'mtD'));
  const bins = [[-0.47, '#3f8fe0', 'hole'], [0, '#4fb05a', 'slot'], [0.47, '#f08a2c', 'flap']];
  for (const [x, col, kind] of bins) {
    s.push(bx([x, 0.47, 0], [0.21, 0.41, 0.21], 'whD', { round: 0.03, jit: 0.03 }));
    s.push(box(x - 0.22, 0.74, -0.22, x + 0.22, 0.88, 0.22, col, { paint: 1, jit: 0.03 }));
    s.push(bx([x, 0.9, 0], [0.22, 0.04, 0.22], col, { round: 0.02, jit: 0.03 }));
    if (kind === 'hole') s.push(cyl([x, 0.8, 0.1], [x, 0.8, 0.3], 0.07, 'k', { sub: 1 }));
    else if (kind === 'slot') s.push(box(x - 0.12, 0.78, 0.1, x + 0.12, 0.83, 0.3, 'k', { sub: 1 }));
    else s.push(box(x - 0.13, 0.76, 0.12, x + 0.13, 0.86, 0.3, 'k', { sub: 1 }), box(x - 0.12, 0.83, 0.16, x + 0.12, 0.86, 0.19, 'ink'));
    s.push(box(x - 0.12, 0.38, 0.2, x + 0.12, 0.58, 0.22, 'w', { jit: 0.02 }));
    s.push(box(x - 0.06, 0.44, 0.215, x + 0.06, 0.52, 0.23, col));
  }
  prop('trashbins', vs, s, { footprint: [1.45, 0.5], solid: true, destructible: true, hp: 40, debris: ['#d8d6d0', '#3f8fe0', '#4fb05a', '#f08a2c'], tags: ['street', 'park'] });
}

// ---- futuristic street lamp -------------------------------------------------
{
  const vs = 0.04, s = [];
  s.push(cap([0, 0, 0], [0, 0.5, 0], 0.17, 0.1, 'mtK', { jit: 0.03 }));
  s.push(tor([0, 0.42, 0], 0.12, 0.025, 'nc', { glow: 2 }));
  s.push(vcyl(0, 0, 0.5, 3.4, 0.055, 'mt', { stripes: { axis: 'y', p: 0.9, w: 0.04, col: 'mtD' }, jit: 0.03 }));
  s.push(...tube(bez([0, 3.35, 0], [0, 3.9, 0.05], [0, 3.82, 0.6], 4), 0.05, 0.045, 'mt', { jit: 0.03 }));
  s.push(cap([0, 3.82, 0.45], [0, 3.8, 1.05], 0.1, 0.08, 'mtK', { jit: 0.03 }));
  s.push(box(-0.05, 3.7, 0.48, 0.05, 3.74, 1.08, 'nw', { glow: 3 }));
  s.push(box(-0.07, 3.92, 0.55, 0.07, 3.94, 0.95, 'nc', { glow: 2 }));
  s.push(box(-0.16, 2.2, 0.04, 0.16, 2.9, 0.07, 'nm', { glow: 1, stripes: { axis: 'y', p: 0.12, w: 0.04, col: '#ff9ce0' } }));
  s.push(cap([0, 2.2, 0.06], [0, 2.9, 0.06], 0.02, 0.02, 'mtK'));
  prop('streetlamp', vs, s, { footprint: [0.35, 0.35], solid: true, destructible: true, hp: 80, debris: ['#a9b1bb', '#3d434d', '#3ff0ff'], light: { color: '#cfefff', intensity: 5, y: 3.6, range: 9, night: true }, tags: ['street', 'park', 'light', 'neon'] });
}

// ---- chōchin lanterns -----------------------------------------------------------
// Paper lantern (vertical axis) centred at c: glowing paper, darker ribs, black caps.
function chochin(c, r, h, paper = '#ff5a3c', rib = '#c2341f', glow = 2, mark = null) {
  const [x, y, z] = c, out = [];
  out.push(ell(c, [r, h, r], paper, { glow, stripes: { axis: 'y', p: h * 0.36, w: h * 0.08, col: rib, o: y }, jit: 0.03 }));
  if (mark) out.push(ell([x, y, z + r * 0.6], [r * 0.45, h * 0.35, r * 0.5], mark, { paint: 1, glow }));
  out.push(vcyl(x, z, y - h - 0.02, y - h * 0.8, r * 0.62, 'ink', { jit: 0.02 }));
  out.push(vcyl(x, z, y + h * 0.8, y + h + 0.02, r * 0.55, 'ink', { jit: 0.02 }));
  return out;
}
{
  const vs = 0.04, s = [];
  s.push(box(-0.16, 0, -0.16, 0.16, 0.16, 0.16, 'st', { dither: { col: 'stD', amt: 0.25 } }));
  s.push(box(-0.06, 0.16, -0.06, 0.06, 2.3, 0.06, 'wd', { dither: { col: 'wdD', amt: 0.15 }, jit: 0.04 }));
  s.push(box(-0.06, 2.06, -0.06, 0.06, 2.14, 0.62, 'wd', { jit: 0.04 }));
  s.push(box(-0.14, 2.3, -0.14, 0.14, 2.36, 0.14, 'rf'));
  s.push(cap([0, 2.06, 0.08], [0, 1.9, 0.3], 0.02, 0.02, 'wdD'));
  const lan = [cyl([0, 2.06, 0.5], [0, 1.94, 0.5], 0.012, 'ink'), ...chochin([0, 1.72, 0.5], 0.17, 0.22, '#ff5a3c', '#b8301e', 2, '#ffd9a0')];
  prop('lantern_post', vs, [
    { n: 'body', p: [0, 0, 0], s },
    { n: 'lantern', p: [0, 2.06, 0.5], s: lan, sway: { axis: 'x', amp: 0.06, freq: 0.5 } },
  ], { footprint: [0.4, 0.4], solid: true, destructible: true, hp: 40, debris: ['#a8744a', '#ff5a3c', '#252932'], light: { color: '#ff8a5a', intensity: 1.8, y: 1.7, range: 4.5, night: true }, tags: ['street', 'shrine', 'festival', 'light'] });
}
{
  const vs = 0.05, s = [];
  for (const sx of [-2, 2]) {
    s.push(box(sx - 0.07, 0, -0.07, sx + 0.07, 2.85, 0.07, 'wd', { dither: { col: 'wdD', amt: 0.15 }, jit: 0.04 }));
    s.push(box(sx - 0.1, 2.85, -0.1, sx + 0.1, 2.92, 0.1, 'ink'));
    s.push(box(sx - 0.12, 0, -0.12, sx + 0.12, 0.12, 0.12, 'st'));
  }
  const rope = bez([-2, 2.7, 0], [0, 2.05, 0], [2, 2.7, 0], 10);
  s.push(...tube(rope, 0.02, 0.02, '#3a2a22', { jit: 0.02 }));
  const parts = [{ n: 'body', p: [0, 0, 0], s }];
  const N = 6;
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N, u = 1 - t;
    const x = -2 * u * u + 2 * t * t, y = u * u * 2.7 + 2 * u * t * 2.05 + t * t * 2.7;
    const red = i % 2 === 0;
    parts.push({ n: 'lan' + (i + 1), p: [x, y, 0], sway: { axis: 'x', amp: 0.09, freq: 0.55, phase: i * 1.1 }, s: [cyl([x, y, 0], [x, y - 0.12, 0], 0.012, 'ink'), ...chochin([x, y - 0.32, 0], 0.15, 0.19, red ? '#ff5a3c' : '#fff1d6', red ? '#b8301e' : '#e2b98a', 2, red ? '#ffd9a0' : '#ff7a5a')] });
  }
  prop('lantern_string', vs, parts, { footprint: [4.3, 0.3], solid: false, colliders: [[-2, 0, 0.3, 0.3], [2, 0, 0.3, 0.3]], destructible: true, hp: 30, debris: ['#ff5a3c', '#fff1d6', '#a8744a'], light: { color: '#ff8a5a', intensity: 2.5, y: 2.2, range: 6, night: true }, tags: ['street', 'festival', 'shrine', 'light'] });
}

export const DESIGNS = D;
export const PROP_META = M;
