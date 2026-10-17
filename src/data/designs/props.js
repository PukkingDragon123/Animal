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
  K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'], M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['###', '#.#', '#.#', '#.#', '###'], P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'], Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
  7: ['###', '..#', '.#.', '.#.', '.#.'], '-': ['...', '...', '###', '...', '...'], ' ': ['...', '...', '...', '...', '...'],
  '!': ['#', '#', '#', '.', '#'], '.': ['.', '.', '.', '.', '#'], '¥': ['#.#', '.#.', '###', '.#.', '.#.'],
};
// Pixel bitmap (rows of chars) → run-length boxes on a plane.
// plane 'xy' (faces ±z) or 'zy' (faces ±x); o = origin (top-left centre), px = pixel size, d = depth (half thickness)
function bitmap(rows, o, px, d, cmap, plane = 'xy', opts) {
  const out = [];
  if (opts && opts.snap) {
    // align pixel centres with the voxel lattice so every pixel maps to whole voxels
    const v = opts.snap, odd = Math.round(px / v) % 2 === 1;
    const sn = (q) => (odd ? Math.round(q / v) * v : (Math.floor(q / v) + 0.5) * v);
    o = plane === 'xy' ? [sn(o[0]), sn(o[1]), o[2]] : [o[0], sn(o[1]), sn(o[2])];
    opts = { ...opts }; delete opts.snap;
  }
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

// Hip roof as stacked slabs. c = [x, y0, z] base centre; hx/hz half size at
// the eave; step = inset per layer; th = layer thickness; n layers; optional
// ridge cap colour.
function hipRoof(c, hx, hz, n, step, th, col, o = {}, ridge = null) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const ax = Math.max(hx - i * step, Math.abs(hx - hz) + th), az = Math.max(hz - i * step, th);
    out.push(bx([c[0], c[1] + th * (i + 0.5), c[2]], [ax, th / 2, az], col, o));
  }
  if (ridge) {
    const ax = Math.max(hx - (n - 1) * step, Math.abs(hx - hz) + th);
    out.push(bx([c[0], c[1] + th * (n + 0.5), c[2]], [ax * 0.98, th / 2, th * 0.6 + E], ridge, { jit: 0.03 }));
  }
  return out;
}

function prop(id, vs, parts, meta, extra = {}) {
  const isParts = Array.isArray(parts) && parts.length && !Array.isArray(parts[0]) && parts[0].n;
  const list = isParts ? parts : [{ n: 'body', p: [0, 0, 0], s: parts }];
  // ground cut: drop cells centred below y = 0 (never visible, but they cost faces)
  for (const pt of list) pt.s.push(['box', [0, -50 - vs * 0.5, 0], [1000, 50, 1000], 'k', { sub: 1 }]);
  D[id] = Object.assign({ id: 'prop_' + id, vs, arch: 'static', anim: { bounce: 0 }, pal: P, parts: list }, extra);
  M[id] = Object.assign({ footprint: [1, 1], solid: true, destructible: false, hp: 0, debris: [], light: null, tags: [] }, meta);
}

// =====================================================================
// NATURE
// =====================================================================

// ---- cherry trees ---------------------------------------------------
// Bark with horizontal lenticel bands, a broad cloud canopy of lumpy pink
// blobs (lighter on top, deeper underneath, white blossom speckle), a few
// fallen petals on the ground and drifting petal particles.
function cherry(seed, { vs = 0.1, scale = 1, blobs, limbs, pink = 'sk', top = 'skL', under = 'skD', speck = 'skW', petals = 26, lean = [0.1, 0.05], trunkH = 1.5 } = {}) {
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
  const vs = 0.05, s = [];
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
  s.push(box(-0.36, 2.26, 0.06, 0.36, 3.14, 0.14, 'ink', { jit: 0.03 }));
  s.push(box(-0.32, 2.3, 0.12, 0.32, 3.1, 0.17, 'gd', { jit: 0.04 }));
  s.push(box(-0.25, 2.37, 0.14, 0.25, 3.03, 0.2, 'ink', { jit: 0.02 }));
  s.push(...bitmap(['..#..', '#####', '..#..', '.#.#.', '#...#', '#.#.#', '#####'], [-0.14, 2.91, 0.21], vs, 0.03, { '#': 'gd' }, 'xy', { snap: vs }));
  s.push(box(-2.3, 2.95, -0.13, 2.3, 3.16, 0.13, 'vm', V));
  s.push(poly([0, 0, 0], [[-2.66, 3.62], [-2.3, 3.45], [-1.4, 3.38], [0, 3.36], [1.4, 3.38], [2.3, 3.45], [2.66, 3.62], [2.6, 3.36], [2.2, 3.17], [0, 3.15], [-2.2, 3.17], [-2.6, 3.36]], 0.18, 'ink', { jit: 0.03, top: 'inkL' }));
  prop('torii', vs, s, { footprint: [5.3, 0.5], solid: false, colliders: [[-1.48, 0, 0.5, 0.5], [1.48, 0, 0.5, 0.5]], tags: ['shrine', 'park', 'landmark-small', 'gate'] });
}

// ---- park bench --------------------------------------------------------------
{
  const vs = 0.043, s = [];
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
  const vs = 0.05, s = [];
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
  s.push(...bitmap(['.aa.', 'abba', 'abba', 'abba', 'abba', 'abba', '.aa.'], [0.575, 1.25, 0.1], 0.1, 0.03, { a: { c: 'nm', glow: 2 }, b: { c: 'w', glow: 2 } }, 'zy', { snap: vs }));
  s.push(box(-0.53, 0, -0.42, 0.53, 0.05, 0.4, 'mtD'));
  prop('vending', vs, s, { footprint: [1.1, 0.85], solid: true, destructible: true, hp: 120, debris: ['#f4f2ec', '#3d8d89', '#ff4ac8', '#3ff0ff'], light: { color: '#bff4ff', intensity: 2.2, y: 1.3, range: 4.5, night: true }, tags: ['street', 'shop', 'neon', 'light'] });
}

// ---- recycling bins ------------------------------------------------------------
{
  const vs = 0.055, s = [];
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
  s.push(...tube(rope, 0.032, 0.032, '#3a2a22', { jit: 0.02 }));
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

// ---- fences (2 m segments along x, tileable) -------------------------------
{
  // yotsume-gaki: bamboo lattice tied with black rope
  const vs = 0.045, s = [];
  const BB = (y) => ({ stripes: { axis: 'y', p: 0.3, w: 0.04, col: '#9c8a48', o: y }, jit: 0.04 });
  for (const sx of [-0.99, 0.99]) {
    s.push(vcyl(sx, 0, 0, 1.08, 0.06, '#8a6a40', { dither: { col: '#6b5030', amt: 0.2 }, jit: 0.04 }));
    s.push(vcyl(sx, 0, 1.08, 1.12, 0.07, 'ink'));
  }
  for (let i = 0; i < 9; i++) { const x = -0.8 + i * 0.2; s.push(vcyl(x, 0, 0, 0.92, 0.027, '#c9b46a', BB(i * 0.07))); }
  for (const y of [0.32, 0.62, 0.86]) for (const z of [0.05, -0.05]) s.push(cyl([-1.0, y, z], [1.0, y, z], 0.027, '#bba45a', { stripes: { axis: 'x', p: 0.45, w: 0.04, col: '#9c8a48' }, jit: 0.04 }));
  for (let i = 0; i < 9; i += 2) for (const y of [0.32, 0.62, 0.86]) s.push(vox(vs, -0.8 + i * 0.2, y, 0.09, 'ink'));
  prop('fence_wood', vs, s, { footprint: [2, 0.25], solid: true, destructible: true, hp: 40, debris: ['#c9b46a', '#8a6a40', '#252932'], tags: ['park', 'garden', 'shrine', 'fence'] });
}
{
  const vs = 0.05, s = [];
  for (const sx of [-0.97, 0.97]) { s.push(box(sx - 0.05, 0, -0.05, sx + 0.05, 1.08, 0.05, 'mtK', { jit: 0.03 })); s.push(box(sx - 0.06, 1.08, -0.06, sx + 0.06, 1.12, 0.06, 'mt')); }
  s.push(bx([0, 1.02, 0], [1.0, 0.04, 0.05], 'mt', { round: 0.02, jit: 0.03 }));
  s.push(box(-1.0, 0.94, 0.04, 1.0, 0.96, 0.06, 'nc', { glow: 2 }));
  s.push(box(-1.0, 0.1, -0.03, 1.0, 0.15, 0.03, 'mtD'));
  for (let i = 0; i < 13; i++) { const x = -0.85 + i * 0.1415; s.push(box(x - 0.012, 0.15, -0.012, x + 0.012, 0.94, 0.012, i % 3 === 1 ? 'mtL' : 'mtD', { jit: 0.02 })); }
  prop('fence_metal', vs, s, { footprint: [2, 0.2], solid: true, destructible: true, hp: 70, debris: ['#a9b1bb', '#3d434d', '#3ff0ff'], tags: ['street', 'park', 'fence', 'rooftop'] });
}

// ---- castle wall segment (ishigaki + plastered dobei with tile cap) ---------
{
  const vs = 0.08, s = [];
  const SO = { stripes: { axis: 'y', p: 0.32, w: 0.06, col: 'stK' }, spots: { col: 'stL', d: 0.3, s: 0.16, seed: 2 }, dither: { col: 'stD', amt: 0.18 }, jit: 0.06 };
  for (let i = 0; i < 5; i++) s.push(box(-1.0, i * 0.32, -0.5, 1.0, (i + 1) * 0.32, 0.62 - i * 0.07, i % 2 ? 'stW' : 'st', SO));
  s.push(box(-1.0, 1.6, -0.35, 1.0, 2.42, 0.18, 'cr', { jit: 0.03 }));
  s.push(box(-1.0, 1.6, 0.14, 1.0, 1.84, 0.22, 'rf', { stripes: { axis: 'x', p: 0.16, w: 0.04, col: 'rfD' }, jit: 0.03 }));
  for (const x of [-0.5, 0.5]) s.push(box(x - 0.08, 2.0, 0.1, x + 0.08, 2.16, 0.25, 'k', { sub: 1 }), box(x - 0.08, 2.0, 0.08, x + 0.08, 2.16, 0.1, 'ink'));
  s.push(box(-1.0, 2.42, -0.6, 1.0, 2.5, 0.45, 'rf', { stripes: { axis: 'x', p: 0.16, w: 0.08, col: 'rfD' }, jit: 0.04 }));
  s.push(box(-1.0, 2.5, -0.45, 1.0, 2.58, 0.3, 'rf', { stripes: { axis: 'x', p: 0.16, w: 0.08, col: 'rfD' }, jit: 0.04 }));
  s.push(box(-1.0, 2.58, -0.2, 1.0, 2.7, 0.06, 'rfD', { jit: 0.03 }));
  s.push(box(-1.0, 2.42, 0.4, 1.0, 2.47, 0.46, 'whD', { paint: 1 }));
  s.push(box(-1.0, 0, 0.2, 1.0, 0.7, 0.7, 'ms', { paint: 1, spots: { col: 'msD', d: 0.5, s: 0.12 }, grad: { axis: 'y', to: 'st', a: 0.1, b: 0.75 }, dither: { col: 'stW', amt: 0.35 } }));
  prop('castle_wall', vs, s, { footprint: [2, 1.2], solid: true, tags: ['castle', 'wall', 'park'] });
}

// ---- fountain ------------------------------------------------------------------
{
  const vs = 0.07, s = [];
  const SO = { dither: { col: 'stD', amt: 0.2 }, jit: 0.05 };
  s.push(prism(12, 0, 0, 0, 0.48, 1.3, 'st', { ...SO, top: 'stL', topT: 0.7 }));
  s.push(prism(12, 0, 0, 0.18, 0.6, 1.1, 'k', { sub: 1 }));
  s.push(prism(12, 0, 0, 0.12, 0.34, 1.12, 'wa', { glow: 1, dither: { col: 'waL', amt: 0.25 }, jit: 0.04 }));
  s.push(tor([0, 0.5, 0], 1.2, 0.03, 'nc', { glow: 2 }));
  s.push(vcyl(0, 0, 0.3, 1.45, 0.14, 'stW', SO));
  s.push(cap([0, 0.86, 0], [0, 1.0, 0], 0.15, 0.55, 'st', SO));
  s.push(vcyl(0, 0, 0.96, 1.08, 0.55, 'st', SO));
  s.push(vcyl(0, 0, 1.0, 1.1, 0.47, 'wa', { glow: 1, dither: { col: 'waL', amt: 0.3 } }));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; s.push(...tube(bez([Math.cos(a) * 0.52, 1.02, Math.sin(a) * 0.52], [Math.cos(a) * 0.7, 0.95, Math.sin(a) * 0.7], [Math.cos(a) * 0.72, 0.32, Math.sin(a) * 0.72], 3), 0.045, 0.06, i % 2 ? 'waL' : 'waW', { glow: 1, jit: 0.05 })); }
  s.push(vcyl(0, 0, 0.86, 1.06, 0.3, 'st', SO));
  s.push(cap([0, 1.4, 0], [0, 1.52, 0], 0.08, 0.28, 'stW', SO));
  s.push(vcyl(0, 0, 1.5, 1.56, 0.24, 'wa', { glow: 1 }));
  s.push(sph([0, 1.66, 0], 0.09, 'stW', SO));
  s.push(cap([0, 1.7, 0], [0, 1.82, 0], 0.04, 0.02, 'waL', { glow: 2 }));
  prop('fountain', vs, s, { footprint: [2.6, 2.6], solid: true, light: { color: '#7fe8ff', intensity: 1.5, y: 0.8, range: 4, night: true }, tags: ['park', 'plaza', 'water'] },
    { fx: [{ part: 'body', at: [0, 1.8, 0], type: 'drip', rate: 3, scale: 1.2 }, { part: 'body', at: [0, 0.45, 0.6], type: 'steam', rate: 0.5, scale: 1.2 }] });
}

// ---- direction signpost --------------------------------------------------------
{
  const vs = 0.04, s = [];
  s.push(box(-0.06, 0, -0.06, 0.06, 2.2, 0.06, 'wd', { dither: { col: 'wdD', amt: 0.18 }, jit: 0.05 }));
  s.push(poly([0, 2.24, 0], [[-0.12, 0], [0.12, 0], [0, 0.1]], 0.1, 'vm', { jit: 0.03 }));
  const arrows = [[1.85, 0.2, 'tl', 'w'], [1.5, -0.5, 'vm', 'w'], [1.15, 0.9, 'cr', 'wdK']];
  for (const [y, ang, col, ink] of arrows) {
    const o = { rot: [0, ang * 57.3, 0], jit: 0.03 };
    s.push(poly([0, y, 0.08], [[-0.05, -0.1], [0.55, -0.1], [0.68, 0], [0.55, 0.1], [-0.05, 0.1]], 0.025, col, o));
    s.push(poly([0, y, 0.1], [[0.08, -0.025], [0.45, -0.025], [0.45, 0.025], [0.08, 0.025]], 0.012, ink, o));
  }
  s.push(box(-0.14, 0, -0.14, 0.14, 0.1, 0.14, 'st'));
  prop('signpost', vs, s, { footprint: [0.35, 0.35], solid: true, destructible: true, hp: 30, debris: ['#a8744a', '#3d8d89', '#e2482e'], tags: ['park', 'route', 'street'] });
}

// ---- notice board -----------------------------------------------------------------
{
  const vs = 0.056, s = [];
  for (const sx of [-0.78, 0.78]) s.push(box(sx - 0.05, 0, -0.05, sx + 0.05, 2.0, 0.05, 'wdD', { dither: { col: 'wdK', amt: 0.2 }, jit: 0.04 }));
  s.push(box(-0.82, 0.8, -0.04, 0.82, 1.8, 0.04, 'wd', { jit: 0.04 }));
  s.push(box(-0.74, 0.86, 0.0, 0.74, 1.74, 0.06, '#c99a68', { dither: { col: '#b5875a', amt: 0.3 }, jit: 0.04 }));
  const posters = [[-0.5, 1.45, 0.34, 0.42, '#fff3d6', '#e2482e'], [-0.05, 1.5, 0.4, 0.34, '#a8d6ff', '#2a6869'], [0.45, 1.38, 0.36, 0.5, '#ffd3e3', '#d9739a'], [-0.32, 1.02, 0.5, 0.22, '#fff0a6', '#c7902c'], [0.22, 1.0, 0.3, 0.2, '#ffffff', '#5d9f42']];
  for (const [x, y, w, h, c, a] of posters) {
    s.push(box(x - w / 2, y - h / 2, 0.04, x + w / 2, y + h / 2, 0.08, c, { jit: 0.02 }));
    s.push(box(x - w / 2 + 0.05, y + h / 2 - 0.12, 0.06, x + w / 2 - 0.05, y + h / 2 - 0.06, 0.09, a));
    s.push(box(x - w / 2 + 0.05, y - h / 2 + 0.06, 0.06, x + w / 4, y - h / 2 + 0.09, 0.09, a, { jit: 0.02 }));
    s.push(vox(vs, x, y + h / 2 - 0.02, 0.1, 'rd'));
  }
  s.push(box(-0.95, 1.8, -0.22, 0.95, 1.86, 0.24, 'rf', { jit: 0.03 }));
  s.push(box(-0.88, 1.86, -0.14, 0.88, 1.92, 0.16, 'rf', { jit: 0.03 }));
  s.push(box(-0.8, 1.92, -0.04, 0.8, 1.97, 0.06, 'rfD'));
  prop('noticeboard', vs, s, { footprint: [1.7, 0.4], solid: true, destructible: true, hp: 40, debris: ['#a8744a', '#c99a68', '#fff3d6', '#e2482e'], tags: ['park', 'town', 'quest'] });
}

// ---- mamachari bicycle (front +z) ----------------------------------------------------
{
  const vs = 0.032, s = [];
  const FR = '#7fd1b9', zf = 0.5, zr = -0.5, ry = 0.33;
  for (const z of [zf, zr]) {
    s.push(tor([0, ry, z], 0.3, 0.035, 'ink', { axis: 'x', jit: 0.02 }));
    s.push(tor([0, ry, z], 0.25, 0.018, 'mtL', { axis: 'x', jit: 0.02 }));
    s.push(cyl([-0.04, ry, z], [0.04, ry, z], 0.04, 'mt'));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; s.push(cyl([0, ry + Math.cos(a) * 0.25, z + Math.sin(a) * 0.25], [0, ry - Math.cos(a) * 0.25, z - Math.sin(a) * 0.25], 0.008, 'mtL')); }
    s.push(tor([0, ry, z], 0.34, 0.025, FR, { axis: 'x' }), box(-0.06, 0, z - 0.4, 0.06, ry, z + 0.4, 'k', { sub: 1 }));
  }
  s.push(...tube([[0, ry, zr], [0, 0.38, -0.1], [0, 0.35, 0.18], [0, 0.85, 0.4], [0, ry, zf]], 0.03, 0.03, FR, { jit: 0.03 }));
  s.push(cap([0, ry, zr], [0, 0.78, -0.24], 0.025, 0.025, FR));
  s.push(cap([0, 0.38, -0.1], [0, 0.82, -0.26], 0.03, 0.03, FR));
  s.push(ell([0, 0.86, -0.27], [0.08, 0.035, 0.12], '#6a3f2a', { jit: 0.03 }));
  s.push(cap([0, 0.85, 0.4], [0, 1.0, 0.36], 0.025, 0.025, 'mt'));
  s.push(cyl([-0.26, 1.0, 0.32], [0.26, 1.0, 0.32], 0.02, 'mt'));
  s.push(cap([0.26, 1.0, 0.32], [0.3, 0.98, 0.24], 0.025, 0.025, 'ink'), cap([-0.26, 1.0, 0.32], [-0.3, 0.98, 0.24], 0.025, 0.025, 'ink'));
  s.push(box(-0.17, 0.72, 0.46, 0.17, 0.92, 0.74, 'mtL', { jit: 0.02 }), box(-0.14, 0.76, 0.49, 0.14, 0.95, 0.71, 'k', { sub: 1 }));
  s.push(box(-0.17, 0.72, 0.46, 0.17, 0.92, 0.74, 'mtD', { paint: 1, stripes: { axis: 'y', p: 0.06, w: 0.03, col: 'mtL' } }));
  s.push(sph([0, 0.8, 0.77], 0.045, 'ny', { glow: 2 }));
  s.push(box(-0.12, 0.62, -0.72, 0.12, 0.66, -0.32, 'mtD'));
  s.push(cap([0.05, 0.33, -0.15], [0.16, 0.0, -0.2], 0.015, 0.015, 'mtD'));
  s.push(vox(vs, 0, 0.62, -0.74, 'nr', { glow: 2 }));
  prop('bicycle', vs, s, { footprint: [0.5, 1.7], solid: true, destructible: true, hp: 40, debris: ['#7fd1b9', '#252932', '#a9b1bb'], tags: ['street', 'town'] });
}

// ---- 2050 hover car (front +z) -------------------------------------------------------
{
  const vs = 0.07, s = [];
  // lower body + greenhouse as extruded side profiles (z, y), rounded with fat
  s.push(poly([0, 0, 0], [[-2.0, 0.44], [2.0, 0.44], [2.12, 0.6], [2.02, 0.76], [0.9, 0.9], [-1.7, 0.96], [-2.06, 0.86], [-2.1, 0.56]], 0.8, 'wh', { plane: 'zy', fat: 0.08, belly: 'whD', bellyT: 0.6, jit: 0.03 }));
  s.push(poly([0, 0, 0], [[1.0, 0.86], [0.3, 1.26], [-0.8, 1.32], [-1.6, 1.0], [-1.65, 0.88]], 0.6, '#24354f', { plane: 'zy', fat: 0.06, jit: 0.03 }));
  s.push(box(-0.7, 1.28, -1.1, 0.7, 1.45, 0.3, 'wh', { paint: 1, jit: 0.03 }));
  s.push(box(-0.7, 0.9, -0.12, 0.7, 1.45, 0.0, 'wh', { paint: 1, jit: 0.03 }));
  s.push(box(-0.7, 1.0, 0.45, 0.7, 1.12, 0.62, '#5f87b3', { paint: 1 }));
  s.push(box(-0.95, 0.62, -2.2, 0.95, 0.68, 2.2, 'tl', { paint: 1 }));
  s.push(box(-0.95, 0.36, -2.2, 0.95, 0.5, 2.2, 'mtK', { paint: 1 }));
  s.push(box(-0.72, 0.64, 2.06, 0.72, 0.74, 2.22, 'nw', { glow: 3 }));
  s.push(box(-0.8, 0.66, -2.24, 0.8, 0.76, -2.1, 'nr', { glow: 2 }));
  s.push(box(-0.25, 0.8, -2.14, 0.25, 0.86, -1.98, 'nc', { glow: 2 }));
  for (const [x, z] of [[0.6, 1.35], [-0.6, 1.35], [0.6, -1.35], [-0.6, -1.35]]) {
    s.push(vcyl(x, z, 0.3, 0.4, 0.28, 'mtK'));
    s.push(vcyl(x, z, 0.26, 0.3, 0.22, 'nc', { glow: 2 }));
  }
  s.push(box(0.84, 0.94, 0.62, 0.98, 1.0, 0.76, 'mtK'), box(-0.98, 0.94, 0.62, -0.84, 1.0, 0.76, 'mtK'));
  prop('hovercar', vs, [{ n: 'body', p: [0, 0.75, 0], s, sway: { axis: 'x', amp: 0.012, freq: 0.35 } }],
    { footprint: [2.0, 4.3], solid: true, light: { color: '#7ff4ff', intensity: 1.2, y: 0.3, range: 3.5, night: true }, tags: ['street', 'vehicle', 'city'] });
}

// ---- e-scooter (moped, front +z) ---------------------------------------------------------
{
  const vs = 0.046, s = [];
  const BO = '#ffb6cb';
  for (const z of [0.55, -0.5]) { s.push(tor([0, 0.2, z], 0.15, 0.06, 'ink', { axis: 'x' })); s.push(cyl([-0.05, 0.2, z], [0.05, 0.2, z], 0.08, 'mtL')); }
  s.push(ell([0, 0.52, -0.38], [0.22, 0.28, 0.42], BO, { belly: '#e891ad', jit: 0.03 }));
  s.push(box(-0.16, 0.26, -0.15, 0.16, 0.34, 0.42, 'cr', { jit: 0.03 }));
  s.push(ell([0, 0.72, 0.48], [0.2, 0.48, 0.12], BO, { jit: 0.03, rot: [-14, 0, 0] }));
  s.push(ell([0, 0.86, -0.36], [0.18, 0.06, 0.32], '#6a3f2a', { jit: 0.03 }));
  s.push(ell([0, 0.36, 0.55], [0.1, 0.12, 0.22], BO));
  s.push(cap([0, 1.1, 0.52], [0, 1.2, 0.48], 0.04, 0.04, 'mt'));
  s.push(cyl([-0.3, 1.2, 0.48], [0.3, 1.2, 0.48], 0.022, 'mt'));
  s.push(cap([0.3, 1.2, 0.48], [0.34, 1.18, 0.42], 0.03, 0.03, 'ink'), cap([-0.3, 1.2, 0.48], [-0.34, 1.18, 0.42], 0.03, 0.03, 'ink'));
  s.push(cyl([0, 1.08, 0.6], [0, 1.08, 0.66], 0.08, 'mtL'), cyl([0, 1.08, 0.64], [0, 1.08, 0.68], 0.06, 'nw', { glow: 3 }));
  s.push(box(-0.08, 0.66, -0.82, 0.08, 0.72, -0.78, 'nr', { glow: 2 }));
  s.push(box(-0.23, 0.48, -0.5, 0.23, 0.52, -0.2, 'nc', { glow: 2, paint: 1 }));
  s.push(box(-0.14, 0.78, -0.86, 0.14, 0.9, -0.7, 'mtD', { jit: 0.03 }));
  prop('scooter', vs, s, { footprint: [0.6, 1.6], solid: true, destructible: true, hp: 60, debris: ['#ffb6cb', '#fffaee', '#252932'], tags: ['street', 'vehicle', 'town'] });
}

// ---- delivery drone (hovering, spinning rotors) ---------------------------------------
{
  const vs = 0.035, Y = 1.75, s = [];
  s.push(ell([0, Y, 0], [0.22, 0.09, 0.26], 'wh', { belly: 'mtL', jit: 0.03 }));
  s.push(ell([0, Y + 0.03, 0], [0.23, 0.03, 0.27], 'no', { paint: 1 }));
  s.push(sph([0, Y - 0.07, 0.18], 0.045, 'ink'), vox(vs, 0, Y - 0.07, 0.23, 'nc', { glow: 2 }));
  const hubs = [[0.42, 0.42], [-0.42, 0.42], [0.42, -0.42], [-0.42, -0.42]];
  for (const [x, z] of hubs) { s.push(cap([0, Y, 0], [x, Y + 0.04, z], 0.035, 0.03, 'mtL')); s.push(vcyl(x, z, Y, Y + 0.1, 0.05, 'mtK')); s.push(vox(vs, x, Y - 0.03, z, z > 0 ? 'ng' : 'nr', { glow: 2 })); }
  for (const sx of [0.12, -0.12]) { s.push(cap([sx, Y - 0.05, 0.1], [sx, Y - 0.22, 0.1], 0.015, 0.015, 'mtD'), cap([sx, Y - 0.05, -0.1], [sx, Y - 0.22, -0.1], 0.015, 0.015, 'mtD'), cyl([sx, Y - 0.22, -0.18], [sx, Y - 0.22, 0.18], 0.017, 'mtD')); }
  s.push(cyl([0, Y - 0.08, 0], [0, Y - 0.38, 0], 0.01, 'ink'));
  s.push(box(-0.15, Y - 0.68, -0.15, 0.15, Y - 0.38, 0.15, '#c8935a', { dither: { col: '#b07c48', amt: 0.2 }, jit: 0.04 }));
  s.push(box(-0.16, Y - 0.55, -0.03, 0.16, Y - 0.37, 0.03, '#e8d4a0', { paint: 1 }));
  s.push(box(0.04, Y - 0.62, 0.15, 0.12, Y - 0.56, 0.17, 'nm', { glow: 1 }));
  const parts = [{ n: 'body', p: [0, Y, 0], s, sway: { axis: 'z', amp: 0.03, freq: 0.6 } }];
  hubs.forEach(([x, z], i) => parts.push({ n: 'rotor' + (i + 1), parent: 'body', p: [x, Y + 0.12, z], spin: { axis: 'y', speed: i % 2 ? 26 : -26 }, s: [
    box(x - 0.24, Y + 0.115, z - 0.025, x + 0.24, Y + 0.125, z + 0.025, 'ink', { jit: 0.02 }), box(x - 0.025, Y + 0.115, z - 0.24, x + 0.025, Y + 0.125, z + 0.24, 'ink', { jit: 0.02 }), vcyl(x, z, Y + 0.1, Y + 0.14, 0.04, 'no'),
  ] }));
  prop('drone', vs, parts, { footprint: [0.9, 0.9], solid: false, destructible: true, hp: 25, debris: ['#f4f2ec', '#ff8a3c', '#c8935a'], tags: ['street', 'city', 'sky', 'vehicle'] });
}

// ---- bus stop shelter --------------------------------------------------------------------
{
  const vs = 0.08, s = [];
  s.push(box(-1.6, 0, -0.75, 1.6, 0.08, 0.6, 'stL', { stripes: { axis: 'x', p: 0.4, w: 0.04, col: 'st' }, jit: 0.03 }));
  for (const x of [-1.45, 1.45]) s.push(box(x - 0.05, 0.08, -0.6, x + 0.05, 2.45, -0.5, 'mtK', { jit: 0.03 }));
  s.push(box(-1.45, 0.25, -0.58, 1.45, 2.25, -0.54, '#bfe3ee', { stripes: { axis: 'x', p: 0.6, w: 0.04, col: '#9cc6d3' }, jit: 0.02 }));
  s.push(box(-1.1, 0.7, -0.53, -0.1, 2.05, -0.49, 'nm', { glow: 2, grad: { axis: 'y', to: 'nv', a: 0.7, b: 2.05 } }));
  s.push(...bitmap(['..aa..', '.aaaa.', 'aabbaa', 'aaaaaa', '.a..a.', '.a..a.'], [-0.85, 1.75, -0.47], 0.08, 0.03, { a: { c: 'nw', glow: 2 }, b: { c: 'nc', glow: 3 } }, 'xy', { snap: vs }));
  s.push(ell([0, 2.5, -0.1], [1.75, 0.12, 0.8], 'tl', { top: 'tlL', topT: 0.6, jit: 0.03 }));
  s.push(box(-1.8, 2.3, -1.0, 1.8, 2.44, 0.8, 'k', { sub: 1 }));
  s.push(box(-1.7, 2.38, 0.5, 1.7, 2.42, 0.56, 'nc', { glow: 2 }));
  s.push(box(-0.9, 0.42, -0.45, 0.9, 0.48, -0.15, 'wd', { stripes: { axis: 'z', p: 0.1, w: 0.03, col: 'wdD' }, jit: 0.04 }));
  for (const x of [-0.8, 0.8]) s.push(box(x - 0.03, 0.08, -0.4, x + 0.03, 0.42, -0.2, 'mtK'));
  // stop pole with round sign
  s.push(vcyl(1.95, 0.35, 0, 2.5, 0.04, 'mt'));
  s.push(cyl([1.95, 2.55, 0.33], [1.95, 2.55, 0.4], 0.26, 'w', { jit: 0.02 }));
  s.push(tor([1.95, 2.55, 0.41], 0.24, 0.03, 'nc', { axis: 'z', glow: 2 }));
  s.push(...bitmap(['.aaa.', 'abbba', 'aaaaa', '.a.a.'], [1.79, 2.67, 0.42], 0.08, 0.03, { a: 'tlD', b: '#bfe3ee' }, 'xy', { snap: vs }));
  s.push(box(1.82, 1.4, 0.36, 2.08, 1.9, 0.4, 'ny', { glow: 1, stripes: { axis: 'y', p: 0.08, w: 0.03, col: '#c7a42a' } }));
  prop('bus_stop', vs, s, { footprint: [3.2, 1.3], solid: true, destructible: true, hp: 100, debris: ['#3d8d89', '#bfe3ee', '#ff4ac8', '#3d434d'], light: { color: '#ff7ad8', intensity: 2, y: 1.4, range: 5, night: true }, tags: ['street', 'city', 'neon', 'light'] });
}

// ---- traffic light (Japanese horizontal head over the road, +x) -------------------------
{
  const vs = 0.05, s = [];
  s.push(cap([0, 0, 0], [0, 0.3, 0], 0.14, 0.09, 'mtK'));
  s.push(vcyl(0, 0, 0.3, 4.75, 0.075, 'mt', { jit: 0.03 }));
  s.push(cap([0, 4.6, 0], [2.5, 4.62, 0], 0.06, 0.045, 'mt'));
  s.push(cap([0, 4.2, 0], [0.9, 4.58, 0], 0.03, 0.03, 'mt'));
  s.push(bx([2.3, 4.45, 0], [0.62, 0.2, 0.13], 'mtK', { round: 0.05, jit: 0.03 }));
  const lamps = [[1.9, 'ng', 3], [2.3, '#6a5a24', 0], [2.7, '#5a2424', 0]];
  for (const [x, c, g] of lamps) {
    s.push(cyl([x, 4.45, 0.08], [x, 4.45, 0.16], 0.14, g ? c : c, g ? { glow: g } : { jit: 0.02 }));
    s.push(cyl([x, 4.45, 0.12], [x, 4.45, 0.3], 0.17, 'mtK', { jit: 0.02 }), cyl([x, 4.42, 0.12], [x, 4.42, 0.32], 0.15, 'k', { sub: 1 }), box(x - 0.2, 4.2, 0.12, x + 0.2, 4.45, 0.33, 'k', { sub: 1 }));
  }
  // pedestrian signal
  s.push(box(0.1, 2.3, -0.13, 0.42, 3.05, 0.13, 'mtK', { jit: 0.03 }));
  s.push(box(0.15, 2.72, 0.1, 0.37, 2.98, 0.15, '#4a1e22'));
  s.push(box(0.15, 2.38, 0.1, 0.37, 2.64, 0.15, '#0e2a24'));
  s.push(...bitmap(['.a.', 'aaa', '.a.', 'a.a'], [0.21, 2.6, 0.15], 0.05, 0.02, { a: { c: 'ng', glow: 3 } }, 'xy', { snap: vs }));
  s.push(box(-0.12, 1.1, 0.06, 0.12, 1.35, 0.16, 'ny', { jit: 0.02 }), box(-0.04, 1.18, 0.15, 0.04, 1.26, 0.18, 'nr', { glow: 2 }));
  s.push(box(-0.28, 3.4, 0.08, 0.28, 3.72, 0.11, 'tl', { jit: 0.02 }), box(-0.22, 3.53, 0.1, 0.22, 3.59, 0.12, 'w'));
  prop('traffic_light', vs, s, { footprint: [0.35, 0.35], solid: true, destructible: true, hp: 90, debris: ['#a9b1bb', '#3d434d', '#5dff9a'], light: { color: '#5dff9a', intensity: 1.2, y: 4.4, range: 4, night: true }, tags: ['street', 'city', 'light'] });
}

// ---- traffic cone ------------------------------------------------------------------------
prop('cone', 0.035, [
  box(-0.2, 0, -0.2, 0.2, 0.05, 0.2, '#e8641c', { jit: 0.03 }),
  cap([0, 0.04, 0], [0, 0.7, 0], 0.16, 0.03, '#ff7a1f', { jit: 0.04 }),
  box(-0.2, 0.3, -0.2, 0.2, 0.38, 0.2, 'w', { paint: 1, jit: 0.02 }),
  box(-0.2, 0.5, -0.2, 0.2, 0.55, 0.2, 'w', { paint: 1, jit: 0.02 }),
], { footprint: [0.4, 0.4], solid: true, destructible: true, hp: 20, debris: ['#ff7a1f', '#ffffff'], tags: ['street', 'construction'] });

// ---- construction barrier with cute frog mascot stands ---------------------------------
{
  const vs = 0.043, s = [];
  for (const sx of [-0.75, 0.75]) {
    s.push(bx([sx, 0.07, 0], [0.22, 0.07, 0.18], 'no', { round: 0.03, jit: 0.03 }));
    s.push(ell([sx, 0.4, 0], [0.17, 0.27, 0.14], 'gr', { belly: '#fff3c4', bellyT: 0.0, front: '#fff3c4', frontT: 0.7, jit: 0.03 }));
    s.push(sph([sx, 0.78, 0.0], 0.17, 'gr', { jit: 0.03 }));
    for (const ex of [-0.08, 0.08]) { s.push(sph([sx + ex, 0.92, 0.04], 0.065, 'w')); s.push(sph([sx + ex, 0.93, 0.09], 0.03, 'k')); }
    s.push(box(sx - 0.07, 0.73, 0.15, sx + 0.07, 0.74, 0.18, 'k'));
    for (const ex of [-0.12, 0.12]) s.push(ell([sx + ex, 0.76, 0.12], [0.03, 0.02, 0.02], '#ff8fa0', { paint: 1 }));
    s.push(cap([sx, 0.55, 0.12], [sx * 0.9, 0.6, 0.2], 0.045, 0.04, 'gr'));
  }
  s.push(box(-0.75, 0.55, 0.15, 0.75, 0.67, 0.22, 'ny', { stripes: { axis: 'x', p: 0.24, w: 0.12, col: 'ink' }, jit: 0.02 }));
  s.push(vcyl(-0.75, -0.02, 0.95, 1.02, 0.03, 'mtK'), sph([-0.75, 1.07, -0.02], 0.05, 'no', { glow: 2 }));
  prop('barrier', vs, s, { footprint: [1.9, 0.45], solid: true, destructible: true, hp: 40, debris: ['#ffe45c', '#252932', '#6fb24a', '#ff8a3c'], light: { color: '#ff9a3c', intensity: 0.6, y: 1.05, range: 2.5, night: true }, tags: ['street', 'construction'] });
}

// ---- wooden crate -------------------------------------------------------------------------
{
  const vs = 0.06, s = [];
  s.push(box(-0.45, 0, -0.45, 0.45, 0.9, 0.45, 'wdD', { jit: 0.05 }));
  const PL = { stripes: { axis: 'y', p: 0.24, w: 0.06, col: 'wdD' }, dither: { col: 'wdL', amt: 0.1 }, jit: 0.06 };
  s.push(box(-0.33, 0.12, 0.38, 0.33, 0.78, 0.46, 'k', { sub: 1 }), box(-0.33, 0.12, 0.38, 0.33, 0.78, 0.4, 'wd', PL));
  s.push(box(-0.33, 0.12, -0.46, 0.33, 0.78, -0.38, 'k', { sub: 1 }), box(-0.33, 0.12, -0.4, 0.33, 0.78, -0.38, 'wd', PL));
  s.push(box(0.38, 0.12, -0.33, 0.46, 0.78, 0.33, 'k', { sub: 1 }), box(0.38, 0.12, -0.33, 0.4, 0.78, 0.33, 'wd', PL));
  s.push(box(-0.46, 0.12, -0.33, -0.38, 0.78, 0.33, 'k', { sub: 1 }), box(-0.4, 0.12, -0.33, -0.38, 0.78, 0.33, 'wd', PL));
  s.push(box(-0.33, 0.85, -0.33, 0.33, 0.92, 0.33, 'k', { sub: 1 }), box(-0.33, 0.8, -0.33, 0.33, 0.85, 0.33, 'wd', { stripes: { axis: 'x', p: 0.22, w: 0.06, col: 'wdD' }, jit: 0.06 }));
  s.push(poly([0, 0.45, 0.41], [[-0.36, -0.3], [-0.26, -0.36], [0.36, 0.3], [0.26, 0.36]], 0.03, 'wdL', { jit: 0.05 }));
  s.push(poly([0.41, 0.45, 0], [[-0.36, 0.3], [-0.26, 0.36], [0.36, -0.3], [0.26, -0.36]], 0.03, 'wdL', { plane: 'zy', jit: 0.05 }));
  prop('crate', vs, s, { footprint: [0.9, 0.9], solid: true, destructible: true, hp: 40, debris: ['#a8744a', '#7c5333', '#c99a68'], tags: ['street', 'dock', 'warehouse', 'farm'] });
}

// ---- wooden barrel --------------------------------------------------------------------------
{
  const vs = 0.05, s = [];
  s.push(ell([0, 0.48, 0], [0.36, 0.62, 0.36], 'wd', { dither: { col: 'wdD', amt: 0.18 }, jit: 0.06 }));
  s.push(box(-0.5, 0.96, -0.5, 0.5, 1.4, 0.5, 'k', { sub: 1 }), box(-0.5, -0.4, -0.5, 0.5, -0.03, 0.5, 'k', { sub: 1 }));
  for (const [y, R] of [[0.1, 0.29], [0.3, 0.34], [0.66, 0.34], [0.86, 0.29]]) s.push(tor([0, y, 0], R, 0.03, 'mtK', { jit: 0.03 }));
  s.push(vcyl(0, 0, 0.9, 0.97, 0.25, 'wdL', { paint: 1, stripes: { axis: 'x', p: 0.1, w: 0.03, col: 'wdD' } }));
  s.push(vcyl(0.12, 0.1, 0.94, 0.98, 0.04, 'wdK'));
  prop('barrel', vs, s, { footprint: [0.75, 0.75], solid: true, destructible: true, hp: 50, debris: ['#a8744a', '#7c5333', '#3d434d'], tags: ['street', 'dock', 'farm', 'warehouse'] });
}

// ---- sandbag wall ------------------------------------------------------------------------------
{
  const vs = 0.05, s = [];
  const rows = [[4, 0.09], [3, 0.27], [2, 0.45]];
  rows.forEach(([n, y], r) => {
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 0.46;
      s.push(bx([x, y, 0], [0.21, 0.09, 0.17], (i + r) % 2 ? '#b9a676' : '#a8956a', { round: 0.07, dither: { col: '#968459', amt: 0.18 }, top: '#cdb98a', topT: 0.7, jit: 0.05 }));
      s.push(bx([x + 0.2, y, 0], [0.03, 0.05, 0.08], '#7d6c48', { round: 0.02 }));
    }
  });
  prop('sandbags', vs, s, { footprint: [1.9, 0.45], solid: true, destructible: true, hp: 80, debris: ['#c4b083', '#a28f62'], tags: ['construction', 'training', 'safari'] });
}

// ---- straw training dummy -----------------------------------------------------------------
{
  const vs = 0.04, s = [];
  const STR = { stripes: { axis: 'y', p: 0.08, w: 0.02, col: 'hyD' }, dither: { col: 'hyL', amt: 0.15 }, jit: 0.05 };
  s.push(box(-0.32, 0, -0.06, 0.32, 0.08, 0.06, 'wdD'), box(-0.06, 0, -0.32, 0.06, 0.08, 0.32, 'wdD'));
  s.push(vcyl(0, 0, 0, 1.75, 0.05, 'wd', { jit: 0.04 }));
  s.push(ell([0, 1.1, 0], [0.22, 0.36, 0.2], 'hy', STR));
  for (const y of [0.86, 1.34]) s.push(tor([0, y, 0], 0.17, 0.025, 'wdK'));
  s.push(cyl([-0.48, 1.32, 0], [0.48, 1.32, 0], 0.035, 'wd'));
  for (const sx of [-0.45, 0.45]) s.push(ell([sx, 1.32, 0], [0.09, 0.07, 0.07], 'hy', STR));
  s.push(sph([0, 1.62, 0], 0.15, 'hy', STR));
  s.push(tor([0, 1.66, 0], 0.145, 0.028, 'rd', { jit: 0.03 }));
  s.push(cap([0.0, 1.66, -0.15], [0.1, 1.5, -0.24], 0.025, 0.015, 'rd'));
  s.push(cyl([0, 1.1, 0.15], [0, 1.1, 0.22], 0.13, 'w', { paint: 1 }), cyl([0, 1.1, 0.15], [0, 1.1, 0.22], 0.085, 'rd', { paint: 1 }), cyl([0, 1.1, 0.15], [0, 1.1, 0.23], 0.04, 'w', { paint: 1 }));
  s.push(vox(vs, -0.05, 1.63, 0.14, 'k'), vox(vs, 0.05, 1.63, 0.14, 'k'));
  prop('training_dummy', vs, s, { footprint: [0.6, 0.6], solid: true, destructible: true, hp: 60, debris: ['#e6c46a', '#a8744a', '#d83a3c'], tags: ['training', 'dojo', 'farm'] });
}

// ---- archery target on an easel -------------------------------------------------------------
{
  const vs = 0.04, s = [];
  s.push(cap([0, 1.55, -0.05], [-0.42, 0, 0.15], 0.03, 0.03, 'wd'), cap([0, 1.55, -0.05], [0.42, 0, 0.15], 0.03, 0.03, 'wd'), cap([0, 1.5, -0.08], [0, 0, -0.55], 0.03, 0.03, 'wd'));
  const T = { rot: [-12, 0, 0] };
  s.push(cyl([0, 1.0, 0.08], [0, 1.0, 0.2], 0.46, 'hy', { ...T, dither: { col: 'hyD', amt: 0.25 } }));
  const rings = [[0.42, 'w'], [0.34, 'rd'], [0.26, 'w'], [0.18, 'rd'], [0.1, 'ny']];
  for (const [r, c] of rings) s.push(cyl([0, 1.0, 0.18], [0, 1.0, 0.24], r, c, { ...T, paint: 1, jit: 0.02 }));
  s.push(box(-0.5, 0.48, 0.05, 0.5, 0.54, 0.25, 'wdD'));
  s.push(cap([0.12, 1.06, 0.2], [0.2, 1.12, 0.62], 0.012, 0.012, 'wdL'), ell([0.2, 1.12, 0.6], [0.035, 0.035, 0.05], 'w'));
  s.push(cap([-0.08, 0.9, 0.2], [-0.16, 0.86, 0.6], 0.012, 0.012, 'wdL'), ell([-0.16, 0.86, 0.58], [0.035, 0.035, 0.05], 'rd'));
  prop('target_post', vs, s, { footprint: [0.9, 0.8], solid: true, destructible: true, hp: 40, debris: ['#e6c46a', '#d83a3c', '#ffffff'], tags: ['training', 'dojo', 'park'] });
}

// ---- stack of painted tyres ----------------------------------------------------------------------
{
  const vs = 0.06, s = [];
  const RB = { dither: { col: '#3a3a44', amt: 0.2 }, jit: 0.04 };
  [['#3f8fe0', 0.13], ['#ffd84a', 0.39], ['#e2482e', 0.65]].forEach(([c, y], i) => {
    s.push(tor([i * 0.03, y, 0], 0.27, 0.13, '#2b2b33', RB));
    s.push(vcyl(i * 0.03, 0, y + 0.02, y + 0.09, 0.42, c, { paint: 1, jit: 0.03 }));
  });
  s.push(tor([0.66, 0.4, 0.05], 0.27, 0.13, '#2b2b33', { rot: [0, 15, 90], ...RB }));
  s.push(cyl([0.6, 0.4, 0.02], [0.8, 0.4, 0.07], 0.42, '#4fb05a', { paint: 1, jit: 0.03 }));
  prop('tires', vs, s, { footprint: [1.3, 0.8], solid: true, destructible: true, hp: 60, debris: ['#2b2b33', '#ffd84a', '#3f8fe0', '#e2482e'], tags: ['training', 'playground', 'street'] });
}

// ---- punching bag on a stand (bag swings) ------------------------------------------------------
{
  const vs = 0.046, s = [];
  s.push(box(-0.7, 0, -0.35, 0.3, 0.06, 0.35, 'mtK', { jit: 0.03 }));
  s.push(box(-0.62, 0.06, -0.05, -0.52, 2.4, 0.05, '#2f5b55', { jit: 0.03 }));
  s.push(box(-0.62, 2.3, -0.05, 0.18, 2.4, 0.05, '#2f5b55', { jit: 0.03 }));
  s.push(cap([-0.57, 1.95, 0], [-0.3, 2.3, 0], 0.03, 0.03, '#2f5b55'));
  s.push(box(-0.63, 0.5, -0.06, -0.51, 0.62, 0.06, 'ny', { jit: 0.02 }));
  const bag = [
    cyl([0.05, 2.3, 0], [0.05, 1.62, 0], 0.012, 'mtD'),
    cap([0.05, 1.62, 0], [-0.03, 1.55, 0], 0.012, 0.012, 'mtD'), cap([0.05, 1.62, 0], [0.13, 1.55, 0], 0.012, 0.012, 'mtD'),
    vcyl(0.05, 0, 0.62, 1.52, 0.21, 'rd', { jit: 0.04 }),
    vcyl(0.05, 0, 1.46, 1.56, 0.19, 'ink'), vcyl(0.05, 0, 0.58, 0.66, 0.19, 'ink'),
    vcyl(0.05, 0, 0.9, 0.96, 0.215, 'w', { jit: 0.02 }), vcyl(0.05, 0, 1.2, 1.26, 0.215, 'w', { jit: 0.02 }),
  ];
  prop('punching_bag', vs, [
    { n: 'body', p: [0, 0, 0], s },
    { n: 'bag', p: [0.05, 2.3, 0], s: bag, sway: { axis: 'z', amp: 0.035, freq: 0.7 } },
  ], { footprint: [1.0, 0.7], solid: true, destructible: true, hp: 60, debris: ['#d83a3c', '#252932', '#a9b1bb'], tags: ['training', 'dojo', 'gym'] });
}

// ---- mook jong wooden dummy ---------------------------------------------------------------------
{
  const vs = 0.052, s = [];
  const WO = { stripes: { axis: 'y', p: 0.14, w: 0.03, col: 'wd' }, jit: 0.05 };
  for (const sx of [-0.6, 0.6]) s.push(box(sx - 0.05, 0, -0.25, sx + 0.05, 1.85, -0.15, 'wdD', { jit: 0.04 }));
  for (const y of [0.5, 1.3]) s.push(box(-0.65, y - 0.04, -0.24, 0.65, y + 0.04, -0.16, 'wdD', { jit: 0.04 }));
  s.push(vcyl(0, 0, 0.3, 1.72, 0.15, 'wdL', WO));
  s.push(vcyl(0, 0, 1.68, 1.74, 0.13, 'wdD'));
  s.push(cap([0, 1.4, 0.1], [0.24, 1.44, 0.48], 0.035, 0.03, 'wdL', WO), cap([0, 1.4, 0.1], [-0.24, 1.44, 0.48], 0.035, 0.03, 'wdL', WO));
  s.push(cap([0, 1.1, 0.1], [0, 1.08, 0.5], 0.035, 0.03, 'wdL', WO));
  s.push(...tube([[0, 0.62, 0.1], [0.04, 0.48, 0.38], [0.04, 0.12, 0.42]], 0.045, 0.04, 'wdL', WO));
  s.push(box(-0.7, 0, -0.35, 0.7, 0.05, 0.1, 'wd'));
  prop('wooden_dummy', vs, s, { footprint: [1.4, 0.7], solid: true, destructible: true, hp: 90, debris: ['#c99a68', '#7c5333'], tags: ['training', 'dojo'] });
}

// ---- taiko drum on a stand -------------------------------------------------------------------------
{
  const vs = 0.052, s = [];
  for (const sx of [-0.52, 0.52]) {
    s.push(cap([sx, 0, 0.35], [sx, 0.85, -0.12], 0.045, 0.045, 'wdD'), cap([sx, 0, -0.35], [sx, 0.85, 0.12], 0.045, 0.045, 'wdD'));
    s.push(box(sx - 0.05, 0, -0.4, sx + 0.05, 0.06, 0.4, 'wdK'));
  }
  s.push(box(-0.56, 0.62, -0.05, 0.56, 0.68, 0.05, 'wdD'));
  s.push(ell([0, 1.05, 0], [0.47, 0.47, 0.34], '#8a2c1f', { jit: 0.04 }));
  s.push(box(-0.6, 0.4, 0.27, 0.6, 1.7, 0.6, 'k', { sub: 1 }), box(-0.6, 0.4, -0.6, 0.6, 1.7, -0.27, 'k', { sub: 1 }));
  s.push(cyl([0, 1.05, 0.22], [0, 1.05, 0.29], 0.42, 'mtK', { jit: 0.02 }), cyl([0, 1.05, -0.29], [0, 1.05, -0.22], 0.42, 'mtK'));
  s.push(cyl([0, 1.05, 0.24], [0, 1.05, 0.31], 0.39, '#efe2c4', { jit: 0.03 }), cyl([0, 1.05, -0.31], [0, 1.05, -0.24], 0.39, '#efe2c4'));
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; s.push(vox(vs, Math.cos(a) * 0.4, 1.05 + Math.sin(a) * 0.4, 0.3, 'gd')); }
  s.push(tor([0, 1.05, 0], 0.46, 0.025, 'gd', { axis: 'z', jit: 0.03 }));
  s.push(cyl([0, 1.05, 0.3], [0, 1.05, 0.33], 0.17, 'rd', { paint: 1 }), cyl([0, 1.05, 0.3], [0, 1.05, 0.33], 0.1, '#efe2c4', { paint: 1 }), cyl([0.03, 1.08, 0.3], [0.03, 1.08, 0.33], 0.05, 'rd', { paint: 1 }));
  s.push(cap([0.3, 0.7, 0.2], [0.6, 0.72, 0.05], 0.025, 0.02, 'wdP'), cap([0.32, 0.7, 0.1], [0.62, 0.72, -0.05], 0.025, 0.02, 'wdP'));
  prop('taiko', vs, s, { footprint: [1.2, 0.9], solid: true, destructible: true, hp: 70, debris: ['#8a2c1f', '#efe2c4', '#7c5333'], tags: ['festival', 'dojo', 'shrine'] });
}

// ---- campfire --------------------------------------------------------------------------------------
{
  const vs = 0.04, s = [];
  const r = rng(31);
  for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2; s.push(ell([Math.cos(a) * 0.42, 0.06, Math.sin(a) * 0.42], [0.1 + r() * 0.03, 0.08, 0.09], i % 2 ? 'st' : 'stD', { noise: 0.02, top: 'stL', dither: { col: 'stK', amt: 0.2 } })); }
  s.push(ell([0, 0.02, 0], [0.32, 0.04, 0.32], '#3a2e2a', { dither: { col: '#5a4a40', amt: 0.3 } }));
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.3; s.push(cap([Math.cos(a) * 0.3, 0.04, Math.sin(a) * 0.3], [Math.cos(a) * 0.04, 0.42, Math.sin(a) * 0.04], 0.045, 0.035, 'bk', { tip: '#2a2220', tipT: 0.6, dither: { col: 'bkD', amt: 0.2 } })); }
  s.push(ell([0, 0.1, 0], [0.17, 0.1, 0.17], 'no', { glow: 2, dither: { col: 'nr', amt: 0.3 } }));
  s.push(ell([0, 0.14, 0], [0.08, 0.08, 0.08], 'ny', { glow: 3 }));
  prop('campfire', vs, s, { footprint: [1.0, 1.0], solid: true, light: { color: '#ff9a3a', intensity: 4, y: 0.6, range: 6, night: false }, tags: ['camp', 'safari', 'forest', 'light'] },
    { fx: [{ part: 'body', at: [0, 0.2, 0], type: 'flame', rate: 1, scale: 1.6 }, { part: 'body', at: [0, 0.35, 0], type: 'ember', rate: 1 }, { part: 'body', at: [0, 0.8, 0], type: 'smoke', rate: 0.6 }] });
}

// ---- dome tent ---------------------------------------------------------------------------------------
{
  const vs = 0.07, s = [];
  s.push(ell([0, 0, 0], [1.05, 1.0, 0.9], 'tl', { top: 'tlL', topT: 0.75, dither: { col: 'tlD', amt: 0.06 }, jit: 0.04 }));
  s.push(ell([0, 0, 0], [1.07, 0.6, 0.92], 'no', { paint: 1, jit: 0.04 }));
  s.push(ell([0, 0, 0], [1.08, 0.35, 0.93], 'tlD', { paint: 1, jit: 0.04 }));
  for (const a of [45, -45]) s.push(tor([0, 0, 0], 1.0, 0.035, 'ink', { axis: 'x', rot: [0, a, 0] }));
  s.push(ell([0.1, 0.0, 0.75], [0.45, 0.72, 0.3], 'k', { sub: 1 }));
  s.push(ell([0.1, 0.0, 0.55], [0.42, 0.68, 0.22], 'inkL', { under: 1 }));
  s.push(cap([0.58, 0.05, 0.72], [0.62, 0.7, 0.62], 0.08, 0.05, 'no', { jit: 0.04 }));
  for (const [x, z] of [[1.2, 0.5], [-1.2, 0.5], [1.2, -0.5], [-1.2, -0.5]]) s.push(vcyl(x, z, 0, 0.1, 0.04, 'mtD'));
  s.push(box(-0.5, 0, 1.0, 0.7, 0.04, 1.45, '#e2482e', { stripes: { axis: 'x', p: 0.2, w: 0.08, col: '#f4e9d2' } }));
  prop('tent', vs, s, { footprint: [2.2, 1.9], solid: true, destructible: true, hp: 50, debris: ['#3d8d89', '#ff8a3c', '#252932'], tags: ['camp', 'safari', 'forest'] });
}

// ---- safari jeep (zebra livery, front +z) -------------------------------------------------------
{
  const vs = 0.09, s = [];
  const ZB = { stripes: { axis: 'x', p: 0.42, w: 0.14, col: 'ink' }, jit: 0.04 };
  s.push(poly([0, 0, 0], [[-2.0, 0.5], [2.05, 0.5], [2.1, 0.95], [1.95, 1.15], [0.95, 1.2], [0.85, 1.05], [-1.95, 1.05], [-2.05, 0.9]], 0.9, 'w', { plane: 'zy', ...ZB, rot: [0, 0, 0] }));
  s.push(box(-0.8, 0.75, -1.85, 0.8, 1.2, 0.8, 'k', { sub: 1 }));
  s.push(box(-0.8, 0.7, -1.85, 0.8, 0.76, 0.8, '#6a5a44', { jit: 0.04 }));
  for (const z of [0.2, -1.0]) { s.push(box(-0.7, 0.76, z - 0.25, 0.7, 0.98, z + 0.2, '#7a4a2a', { jit: 0.04 })); s.push(box(-0.7, 0.98, z - 0.3, 0.7, 1.35, z - 0.18, '#7a4a2a', { jit: 0.04 })); }
  s.push(box(-0.88, 1.18, 0.88, 0.88, 1.75, 0.96, 'mtK', { jit: 0.03 }), box(-0.78, 1.25, 0.86, 0.78, 1.68, 0.98, 'k', { sub: 1 }), box(-0.78, 1.25, 0.9, 0.78, 1.68, 0.94, '#a8d6ff', { jit: 0.02 }));
  for (const sx of [0.82, -0.82]) { s.push(...tube([[sx, 1.05, 0.0], [sx, 1.9, -0.2], [sx, 1.9, -1.6], [sx, 1.05, -1.8]], 0.045, 0.045, 'mtK')); }
  s.push(cyl([-0.82, 1.9, -0.2], [0.82, 1.9, -0.2], 0.045, 'mtK'), cyl([-0.82, 1.9, -1.6], [0.82, 1.9, -1.6], 0.045, 'mtK'));
  s.push(box(-0.85, 1.94, -1.7, 0.85, 1.99, -0.1, '#c9b07a', { stripes: { axis: 'z', p: 0.3, w: 0.06, col: '#a8925e' }, jit: 0.04 }));
  for (const [x, z] of [[0.85, 1.3], [-0.85, 1.3], [0.85, -1.3], [-0.85, -1.3]]) {
    s.push(tor([x, 0.42, z], 0.3, 0.14, '#2b2b33', { axis: 'x', dither: { col: '#3a3a44', amt: 0.2 } }));
    s.push(cyl([x - 0.12, 0.42, z], [x + 0.12, 0.42, z], 0.18, 'mtL'));
    s.push(cyl([x * 1.02 - 0.05, 0.42, z], [x * 1.02 + 0.05, 0.42, z], 0.07, 'mtK'));
    s.push(box(x - 0.2, 0.42, z - 0.55, x + 0.2, 0.86, z + 0.55, 'k', { sub: 1 }));
  }
  s.push(tor([0, 0.95, -2.15], 0.28, 0.11, '#2b2b33', { axis: 'z' }), cyl([0, 0.95, -2.2], [0, 0.95, -2.1], 0.17, '#c9b07a'));
  s.push(box(-0.95, 0.5, 2.05, 0.95, 0.62, 2.2, 'mtK'));
  for (const sx of [0.6, -0.6]) s.push(cyl([sx, 0.95, 2.05], [sx, 0.95, 2.16], 0.1, 'ny', { glow: 2 }));
  s.push(box(-0.35, 0.82, 2.08, 0.35, 1.08, 2.14, 'mtD', { stripes: { axis: 'y', p: 0.07, w: 0.035, col: 'mtK' } }));
  prop('safari_jeep', vs, s, { footprint: [2.0, 4.4], solid: true, tags: ['safari', 'vehicle'] });
}

// ---- coin-op tower viewer (binoculars) ------------------------------------------------------------
{
  const vs = 0.04, s = [];
  s.push(prism(8, 0, 0, 0, 0.08, 0.3, 'mtK'));
  s.push(vcyl(0, 0, 0.08, 1.05, 0.08, 'tl', { jit: 0.03 }));
  s.push(vcyl(0, 0, 0.98, 1.1, 0.12, 'tlD'));
  const R = { rot: [-12, 0, 0], jit: 0.03 };
  s.push(bx([0, 1.28, 0], [0.26, 0.17, 0.2], 'tl', { round: 0.08, ...R }));
  s.push(bx([0, 1.42, 0.08], [0.28, 0.04, 0.16], 'tlD', { round: 0.03, ...R }));
  for (const sx of [0.12, -0.12]) {
    s.push(cyl([sx, 1.3, 0.12], [sx, 1.34, 0.3], 0.085, 'gd', { jit: 0.03 }));
    s.push(cyl([sx, 1.34, 0.28], [sx, 1.35, 0.32], 0.06, '#9fe0ff', { glow: 1 }));
    s.push(cyl([sx, 1.24, -0.2], [sx, 1.22, -0.3], 0.05, 'ink'));
  }
  s.push(box(-0.1, 1.0, 0.1, 0.1, 1.14, 0.2, 'gd', { jit: 0.03 }), box(-0.03, 1.08, 0.19, 0.03, 1.1, 0.21, 'ink'));
  s.push(cyl([0.26, 1.24, 0], [0.42, 1.18, 0], 0.025, 'mtK'));
  prop('binoculars', vs, s, { footprint: [0.6, 0.6], solid: true, destructible: true, hp: 60, debris: ['#3d8d89', '#f2c24c', '#3d434d'], tags: ['rooftop', 'observatory', 'park'] });
}

// ---- outdoor AC unit (fan spins) --------------------------------------------------------------------
{
  const vs = 0.04, s = [];
  for (const sx of [-0.32, 0.32]) s.push(box(sx - 0.04, 0, -0.18, sx + 0.04, 0.12, 0.18, 'mtD'));
  s.push(bx([0, 0.45, 0], [0.43, 0.32, 0.16], 'cr', { round: 0.03, jit: 0.03 }));
  s.push(cyl([-0.1, 0.45, 0.04], [-0.1, 0.45, 0.2], 0.24, 'k', { sub: 1 }));
  s.push(cyl([-0.1, 0.45, 0.0], [-0.1, 0.45, 0.04], 0.24, 'ink'));
  for (let i = -2; i <= 2; i++) s.push(box(-0.34, 0.45 + i * 0.09 - 0.012, 0.13, 0.14, 0.45 + i * 0.09 + 0.012, 0.15, 'mtD'));
  s.push(box(0.2, 0.2, 0.15, 0.38, 0.7, 0.17, 'crD', { stripes: { axis: 'y', p: 0.06, w: 0.03, col: '#c4b494' } }));
  s.push(...tube([[0.43, 0.3, -0.05], [0.55, 0.3, -0.05], [0.58, 0.0, -0.1]], 0.035, 0.035, '#e8e2d0'));
  s.push(...tube([[0.43, 0.22, 0.05], [0.52, 0.18, 0.05], [0.52, 0.0, 0.05]], 0.025, 0.025, 'mtL'));
  const fan = [];
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; fan.push(ell([-0.1 + Math.cos(a) * 0.11, 0.45 + Math.sin(a) * 0.11, 0.07], [0.1, 0.05, 0.015], 'mtL', { rot: [0, 0, a * 57.3 + 20] })); }
  fan.push(cyl([-0.1, 0.45, 0.05], [-0.1, 0.45, 0.1], 0.045, 'mtK'));
  prop('ac_unit', vs, [
    { n: 'body', p: [0, 0, 0], s },
    { n: 'fan', p: [-0.1, 0.45, 0.07], s: fan, spin: { axis: 'z', speed: 9 } },
  ], { footprint: [0.95, 0.4], solid: true, destructible: true, hp: 60, debris: ['#f4e9d2', '#a9b1bb', '#252932'], tags: ['rooftop', 'city', 'alley'] });
}

// ---- rooftop FRP water tank --------------------------------------------------------------------------
{
  const vs = 0.07, s = [];
  for (const [x, z] of [[-0.85, -0.65], [0.85, -0.65], [-0.85, 0.65], [0.85, 0.65]]) s.push(box(x - 0.06, 0, z - 0.06, x + 0.06, 0.6, z + 0.06, 'mtD', { jit: 0.03 }));
  s.push(box(-0.95, 0.5, -0.75, 0.95, 0.6, 0.75, 'mtK', { jit: 0.03 }));
  s.push(box(-0.9, 0.6, -0.7, 0.9, 1.98, 0.7, '#a9c9d6', { stripes: { axis: 'y', p: 0.46, w: 0.07, col: '#86a9b8' }, jit: 0.03 }));
  for (let i = -3; i <= 3; i++) { const x = i * 0.27; s.push(box(x - 0.03, 0.6, -0.72, x + 0.03, 1.98, 0.72, '#86a9b8', { paint: 1 })); }
  for (let i = -2; i <= 2; i++) { const z = i * 0.27; s.push(box(-0.92, 0.6, z - 0.03, 0.92, 1.98, z + 0.03, '#86a9b8', { paint: 1 })); }
  s.push(vcyl(0.35, 0.2, 1.98, 2.08, 0.2, 'mtL'), vcyl(0.35, 0.2, 2.08, 2.12, 0.12, 'mtD'));
  for (const sx of [-0.3, 0.3]) s.push(box(sx - 0.03, 0, 0.74, sx + 0.03, 2.1, 0.8, 'mt'));
  for (let y = 0.25; y < 2.1; y += 0.25) s.push(box(-0.3, y - 0.02, 0.75, 0.3, y + 0.02, 0.79, 'mtL'));
  s.push(...tube([[-0.9, 0.8, 0.3], [-1.1, 0.8, 0.3], [-1.1, 0.0, 0.3]], 0.05, 0.05, 'mtL'));
  prop('water_tank', vs, s, { footprint: [2.0, 1.7], solid: true, tags: ['rooftop', 'city'] });
}

// ---- rooftop antenna mast -------------------------------------------------------------------------
{
  const vs = 0.046, s = [];
  s.push(box(-0.3, 0, -0.3, 0.3, 0.16, 0.3, 'stD', { dither: { col: 'stK', amt: 0.2 } }));
  s.push(vcyl(0, 0, 0.16, 3.2, 0.04, 'mt', { jit: 0.03 }));
  for (const a of [0.5, 2.6, 4.7]) s.push(cyl([0, 1.2, 0], [Math.cos(a) * 0.26, 0.16, Math.sin(a) * 0.26], 0.025, 'mtD'));
  for (const [y, len] of [[2.95, 0.9], [2.45, 0.7]]) {
    s.push(cyl([0, y, -0.1], [0, y, len], 0.02, 'mtL'));
    for (let i = 0; i < 6; i++) { const z = -0.05 + i * (len / 6), w = 0.32 - i * 0.03; s.push(box(-w, y - 0.012, z - 0.012, w, y + 0.012, z + 0.012, 'mtL')); }
  }
  // satellite dish
  s.push(cyl([0, 1.75, 0.06], [0, 1.75, 0.12], 0.38, 'wh', { jit: 0.03 }));
  s.push(tor([0, 1.75, 0.14], 0.37, 0.04, 'whD', { axis: 'z', jit: 0.03 }));
  s.push(cyl([0, 1.75, 0.12], [0, 1.75, 0.14], 0.22, 'whD', { paint: 1 }));
  s.push(cap([0, 1.75, 0.06], [0, 1.75, -0.04], 0.04, 0.04, 'mtD'));
  s.push(cap([0, 1.42, 0.14], [0, 1.72, 0.55], 0.022, 0.022, 'mtD'), box(-0.04, 1.7, 0.53, 0.04, 1.8, 0.62, 'mtK'));
  s.push(sph([0, 3.24, 0], 0.05, 'nr', { glow: 3 }));
  prop('antenna', vs, s, { footprint: [0.6, 0.6], solid: true, destructible: true, hp: 40, debris: ['#a9b1bb', '#f4f2ec', '#ff3b4f'], light: { color: '#ff3b4f', intensity: 0.8, y: 3.24, range: 3, night: true }, tags: ['rooftop', 'city'] });
}

// ---- solar panel array -----------------------------------------------------------------------------------
{
  const vs = 0.058, s = [];
  const R = { rot: [28, 0, 0] };
  for (const sx of [-0.85, 0.85]) { s.push(box(sx - 0.03, 0, 0.3, sx + 0.03, 0.42, 0.36, 'mtD')); s.push(box(sx - 0.03, 0, -0.42, sx + 0.03, 1.0, -0.36, 'mtD')); s.push(box(sx - 0.03, 0, -0.45, sx + 0.03, 0.05, 0.4, 'mtD')); }
  s.push(bx([0, 0.75, 0], [1.05, 0.03, 0.62], 'mtK', R));
  s.push(bx([0, 0.79, 0.02], [1.0, 0.02, 0.57], '#2a3f7a', { ...R, stripes: { axis: 'x', p: 0.2, w: 0.05, col: '#8fa6d6' }, jit: 0.03 }));
  for (let i = -2; i <= 2; i++) s.push(bx([0, 0.79 - Math.sin(28 * Math.PI / 180) * i * 0.23, Math.cos(28 * Math.PI / 180) * i * 0.23 + 0.02], [1.0, 0.025, 0.018], '#8fa6d6', { ...R, paint: 1 }));
  s.push(bx([0.4, 0.76, 0.15], [0.14, 0.03, 0.1], '#cfe0ff', { ...R, paint: 1, glow: 1 }));
  prop('solar_panel', vs, s, { footprint: [2.1, 1.1], solid: true, destructible: true, hp: 50, debris: ['#2a3f7a', '#d5dbe1', '#6f7884'], tags: ['rooftop', 'farm', 'city'] });
}

// ---- holographic billboard (~3×2 m panel on legs) ------------------------------------------------------
const MASCOT = [
  '..aa......aa..',
  '.abba....abba.',
  '.abbaaaaaabba.',
  'aaaaaaaaaaaaaa',
  'aawwaaaaaawwaa',
  'aawkaaaaaawkaa',
  'aaaaaannaaaaaa',
  'aaccaa..aaccaa',
  '.aaaaammaaaaa.',
  '..aaaaaaaaaa..',
];
{
  const vs = 0.062, s = [];
  for (const sx of [-1.38, 1.38]) { s.push(box(sx - 0.09, 0, -0.12, sx + 0.09, 1.2, 0.12, 'mtK', { jit: 0.03 })); s.push(box(sx - 0.18, 0, -0.25, sx + 0.18, 0.08, 0.25, 'mtD')); }
  s.push(box(-1.62, 1.08, -0.12, 1.62, 3.3, 0.06, 'mtK', { jit: 0.03 }));
  s.push(box(-1.5, 1.2, 0.0, 1.5, 3.18, 0.07, '#5a1f8a', { glow: 1, grad: { axis: 'y', to: '#2a1a5a', a: 1.2, b: 3.18 }, stripes: { axis: 'y', p: 0.18, w: 0.06, col: '#7a2a9a' }, jit: 0.02 }));
  const px = 2 * vs;
  s.push(...bitmap(MASCOT, [-0.78, 3.0, 0.06], px, 0.04, { a: { c: '#2fb8d0', glow: 1 }, b: { c: 'nm', glow: 2 }, w: { c: 'nw', glow: 2 }, k: { c: 'ink' }, n: { c: 'nm', glow: 2 }, c: { c: '#ff9ad8', glow: 1 }, m: { c: 'ink' } }, 'xy', { paint: 1, snap: vs }));
  s.push(...text('ELEMON', [0, 1.62, 0.06], vs, 0.04, 'ny', { glow: 3, paint: 1, snap: vs }));
  s.push(box(-1.62, 3.3, -0.06, 1.62, 3.36, 0.12, 'nc', { glow: 2 }));
  s.push(box(-1.62, 1.02, -0.06, 1.62, 1.08, 0.12, 'nc', { glow: 2 }));
  prop('holo_billboard', vs, s, { footprint: [3.2, 0.5], solid: true, destructible: true, hp: 120, debris: ['#3d434d', '#ff4ac8', '#3ff0ff', '#9d6bff'], light: { color: '#ff4fd8', intensity: 3, y: 2.2, range: 6, night: true }, tags: ['city', 'street', 'neon', 'light'] });
}

// ---- vertical neon sign frame (オオサカ) ----------------------------------------------------------------
const KANA = {
  o: ['....#..', '#######', '...##..', '..#.#..', '.#..#..', '#...#..', '..###..'],
  sa: ['.#...#.', '#######', '.#...#.', '.#...#.', '.....#.', '....#..', '..##...'],
  ka: ['..#....', '#######', '..#...#', '..#...#', '.#....#', '.#...#.', '#..##..'],
  ra: ['.#####.', '.......', '#######', '......#', '.....#.', '....#..', '..##...'],
  bar: ['...#...', '...#...', '...#...', '...#...', '...#...', '...#...', '...#...'],
  me: ['.....#.', '.....#.', '.#..#..', '..##...', '...##..', '..#..#.', '##.....'],
  n: ['.#.....', '..#...#', '......#', '.....#.', '....#..', '..##...', '##.....'],
};
{
  const vs = 0.055, s = [];
  s.push(box(-0.08, 0, -0.38, 0.08, 4.6, -0.24, 'mtK', { jit: 0.03 }));
  s.push(box(-0.28, 0, -0.55, 0.28, 0.1, -0.08, 'mtD'));
  s.push(box(-0.52, 0.9, -0.24, 0.52, 4.6, 0.1, 'ink', { jit: 0.02 }));
  // neon tube border
  s.push(box(-0.52, 0.9, 0.1, 0.52, 4.6, 0.16, 'nm', { glow: 2 }), box(-0.44, 0.98, 0.08, 0.44, 4.52, 0.2, 'k', { sub: 1 }));
  s.push(box(-0.44, 0.98, 0.04, 0.44, 4.52, 0.1, 'ink'));
  const glyphs = ['o', 'o', 'sa', 'ka'];
  glyphs.forEach((g, i) => s.push(...bitmap(KANA[g], [-0.33, 4.29 - i * 0.88, 0.165], 0.11, 0.03, { '#': { c: i % 2 ? 'ny' : 'nc', glow: 2 } }, 'xy', { snap: vs })));
  for (const y of [1.0, 2.8, 4.5]) s.push(box(-0.08, y - 0.04, -0.24, 0.08, y + 0.04, -0.1, 'mt'));
  prop('neon_frame', vs, s, { footprint: [1.0, 0.6], solid: true, destructible: true, hp: 60, debris: ['#252932', '#ff4ac8', '#3ff0ff', '#ffe45c'], light: { color: '#ff5ad0', intensity: 2.4, y: 2.6, range: 5, night: true }, tags: ['city', 'street', 'neon', 'dotonbori', 'light'] });
}

// ---- noren (shop curtain in a doorway; panels sway) ---------------------------------------------------
{
  const vs = 0.05, s = [];
  for (const sx of [-0.92, 0.92]) s.push(box(sx - 0.06, 0, -0.06, sx + 0.06, 2.2, 0.06, 'wdD', { dither: { col: 'wdK', amt: 0.2 }, jit: 0.04 }));
  s.push(box(-1.05, 2.2, -0.08, 1.05, 2.32, 0.08, 'wdD', { jit: 0.04 }));
  s.push(box(-0.98, 2.0, 0.1, 0.98, 2.12, 0.14, 'rf'));
  s.push(cyl([-0.95, 1.98, 0.12], [0.95, 1.98, 0.12], 0.025, 'wdK'));
  const parts = [{ n: 'body', p: [0, 0, 0], s }];
  const crest = ['..aaaa..', '.a....a.', 'a..aa..a', 'a.a..a.a', 'a.a..a.a', 'a..aa..a', '.a....a.', '..aaaa..'];
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 0.6;
    const panel = [box(x - 0.28, 1.0, 0.1, x + 0.28, 1.97, 0.14, '#2c3f78', { dither: { col: '#34488a', amt: 0.15 }, jit: 0.03 })];
    panel.push(box(x - 0.28, 1.0, 0.1, x + 0.28, 1.06, 0.14, '#1f2d58', { paint: 1 }));
    parts.push({ n: 'noren' + (i + 1), p: [x, 1.98, 0.12], s: panel, sway: { axis: 'x', amp: 0.05, freq: 0.5, phase: i * 0.9 } });
  }
  // white crest spanning the middle panel
  parts[2].s.push(...bitmap(crest, [-0.35, 1.85, 0.12], 0.1, 0.03, { a: 'w' }, 'xy', { paint: 1, snap: vs }));
  parts[1].s.push(box(-0.6, 1.25, 0.1, -0.55, 1.75, 0.14, 'w', { paint: 1 }));
  parts[3].s.push(box(0.55, 1.25, 0.1, 0.6, 1.75, 0.14, 'w', { paint: 1 }));
  prop('noren', vs, parts, { footprint: [2.1, 0.3], solid: false, colliders: [[-0.92, 0, 0.2, 0.2], [0.92, 0, 0.2, 0.2]], destructible: true, hp: 20, debris: ['#2c3f78', '#ffffff', '#7c5333'], tags: ['shop', 'street', 'dojo', 'onsen'] });
}

// ---- street food stalls ------------------------------------------------------------------------------
const HIRA = {
  ta: ['.#.....', '####...', '.#..###', '.#.....', '#..#...', '#..#...', '#...###'],
  ko: ['.#####.', '.......', '.......', '.......', '#......', '#......', '.######'],
  dash: ['.......', '.......', '.......', '#######', '.......', '.......', '.......'],
};
const OCTO = ['..aaaa..', '.aaaaaa.', 'aawaawaa', 'aakaakaa', 'aaaaaaaa', '.aaccaa.', 'a.a..a.a', 'a..aa..a'];
// yatai cart base: wooden box on two cart wheels with a counter
function yataiBase(s, { w = 1.0, d = 0.5, body = 'wd', panel = 'cr', wheel = 'wdD' } = {}) {
  s.push(box(-w, 0.32, -d, w, 0.95, d, body, { stripes: { axis: 'y', p: 0.16, w: 0.03, col: 'wdD' }, jit: 0.05 }));
  s.push(box(-w + 0.08, 0.42, d - 0.02, w - 0.08, 0.86, d + 0.02, panel, { jit: 0.03 }));
  s.push(box(-w - 0.05, 0.95, -d - 0.05, w + 0.05, 1.01, d + 0.2, 'wdL', { jit: 0.04 }));
  for (const sx of [-1, 1]) {
    s.push(tor([sx * (w + 0.1), 0.34, 0], 0.3, 0.05, wheel, { axis: 'x', jit: 0.04 }));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; s.push(cyl([sx * (w + 0.1), 0.34 + Math.cos(a) * 0.3, Math.sin(a) * 0.3], [sx * (w + 0.1), 0.34 - Math.cos(a) * 0.3, -Math.sin(a) * 0.3], 0.025, wheel)); }
    s.push(cyl([sx * (w + 0.04), 0.34, 0], [sx * (w + 0.16), 0.34, 0], 0.06, 'ink'));
  }
  for (const [x, z] of [[-w + 0.05, d - 0.05], [w - 0.05, d - 0.05], [-w + 0.05, -d + 0.05], [w - 0.05, -d + 0.05]]) s.push(box(x - 0.04, 1.0, z - 0.04, x + 0.04, 2.15, z + 0.04, 'wdD', { jit: 0.04 }));
}
{
  const vs = 0.07, s = [];
  yataiBase(s, { panel: '#fff3dc' });
  s.push(...bitmap(OCTO, [-0.25, 0.88, 0.56], 0.07, 0.03, { a: '#ff6a4a', w: 'w', k: 'k', c: '#ff9a8a' }, 'xy', { snap: vs }));
  // grill with takoyaki
  s.push(box(-0.75, 1.0, -0.15, 0.15, 1.08, 0.38, 'ink', { jit: 0.02 }));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const x = -0.6 + i * 0.21, z = 0.02 + j * 0.21; s.push(sph([x, 1.13, z], 0.075, '#d18a3c', { top: '#6a3a1a', topT: 0.7, jit: 0.05 })); s.push(vox(vs, x, 1.17, z, (i + j) % 2 ? 'w' : '#5d9f42')); }
  s.push(box(0.35, 1.0, -0.1, 0.8, 1.06, 0.3, 'wdP'));
  for (let i = 0; i < 3; i++) s.push(box(0.4 + i * 0.13, 1.06, 0.0, 0.48 + i * 0.13, 1.1, 0.2, '#e8c890'));
  // striped awning roof + red noren with たこ
  s.push(box(-1.15, 2.15, -0.7, 1.15, 2.25, 0.8, 'rd', { stripes: { axis: 'x', p: 0.3, w: 0.15, col: 'w' }, jit: 0.03 }));
  s.push(box(-1.05, 2.25, -0.55, 1.05, 2.33, 0.6, 'rdD', { jit: 0.03 }));
  for (let i = 0; i < 8; i++) s.push(sph([-1.0 + i * 0.285, 2.15, 0.8], 0.07, i % 2 ? 'w' : 'rd'));
  s.push(box(-1.0, 1.62, 0.66, 1.0, 2.15, 0.72, 'rd', { jit: 0.03 }));
  s.push(...bitmap(HIRA.ta, [-0.55, 2.1, 0.7], 0.07, 0.03, { '#': 'w' }, 'xy', { snap: vs, paint: 1 }));
  s.push(...bitmap(HIRA.ko, [0.08, 2.1, 0.7], 0.07, 0.03, { '#': 'w' }, 'xy', { snap: vs, paint: 1 }));
  // octopus mascot on the roof
  s.push(sph([0, 2.68, 0], 0.32, '#ff6a4a', { belly: '#ff9a8a', jit: 0.04 }));
  s.push(tor([0, 2.66, 0], 0.32, 0.04, 'w', { jit: 0.02 }), sph([0.28, 2.72, -0.1], 0.06, 'w'));
  for (const ex of [-0.11, 0.11]) { s.push(sph([ex, 2.7, 0.27], 0.06, 'w')); s.push(sph([ex, 2.7, 0.31], 0.03, 'k')); }
  s.push(cyl([0, 2.56, 0.28], [0, 2.56, 0.36], 0.05, '#ff9a8a'));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; s.push(cap([Math.cos(a) * 0.15, 2.42, Math.sin(a) * 0.15], [Math.cos(a) * 0.42, 2.38, Math.sin(a) * 0.42], 0.08, 0.04, '#ff6a4a')); }
  const lan = [cyl([1.0, 2.15, 0.75], [1.0, 2.0, 0.75], 0.015, 'ink'), ...chochin([1.0, 1.78, 0.75], 0.15, 0.2, '#ff5a3c', '#b8301e', 2, '#ffd9a0')];
  prop('yatai_takoyaki', vs, [
    { n: 'body', p: [0, 0, 0], s },
    { n: 'lantern', p: [1.0, 2.15, 0.75], s: lan, sway: { axis: 'x', amp: 0.05, freq: 0.5 } },
  ], { footprint: [2.4, 1.3], solid: true, destructible: true, hp: 100, debris: ['#a8744a', '#d83a3c', '#ffffff', '#ff6a4a'], light: { color: '#ffb066', intensity: 3, y: 2.0, range: 5, night: true }, tags: ['shop', 'street', 'festival', 'dotonbori', 'food', 'light'] },
    { fx: [{ part: 'body', at: [-0.3, 1.25, 0.1], type: 'steam', rate: 0.8 }] });
}

// ---- pastel ice-cream kiosk with a giant soft-serve on the roof ------------------------------------
{
  const vs = 0.08, s = [];
  s.push(box(-1.0, 0, -0.8, 1.0, 2.2, 0.7, 'pp', { stripes: { axis: 'x', p: 0.36, w: 0.18, col: '#fff3f6' }, jit: 0.03 }));
  s.push(box(-1.02, 0, -0.82, 1.02, 0.3, 0.72, 'pm', { jit: 0.03 }));
  s.push(box(-0.7, 0.95, 0.5, 0.7, 1.8, 0.75, 'k', { sub: 1 }));
  s.push(box(-0.7, 0.95, 0.44, 0.7, 1.8, 0.5, '#ffeef4', { jit: 0.02 }));
  s.push(box(-0.82, 0.9, 0.5, 0.82, 0.98, 0.95, 'w', { jit: 0.02 }));
  const tubs = ['#fff3dc', '#ffb6cb', '#a6e6cf', '#c79bff', '#ffe28a', '#8a5a3a'];
  tubs.forEach((c, i) => s.push(box(-0.64 + i * 0.24, 0.98, 0.56, -0.48 + i * 0.24, 1.06, 0.86, c)));
  // menu board
  s.push(box(-0.6, 1.3, 0.47, 0.6, 1.72, 0.5, 'ink'));
  for (let i = 0; i < 3; i++) { const x = -0.36 + i * 0.36; s.push(poly([x, 1.44, 0.52], [[-0.08, 0.06], [0.08, 0.06], [0, -0.12]], 0.04, '#e0a95a')); s.push(sph([x, 1.56, 0.52], 0.08, tubs[i + 1])); }
  // awning + neon fascia
  s.push(box(-1.12, 2.2, -0.9, 1.12, 2.32, 1.0, 'pm', { stripes: { axis: 'x', p: 0.32, w: 0.16, col: 'w' }, jit: 0.03 }));
  for (let i = 0; i < 8; i++) s.push(sph([-0.98 + i * 0.28, 2.2, 1.0], 0.08, i % 2 ? 'w' : 'pm'));
  s.push(box(-0.95, 1.86, 0.7, 0.95, 2.18, 0.76, 'w'));
  s.push(...text('ICE', [0.15, 2.02, 0.79], 0.08, 0.03, 'nm', { glow: 2, snap: vs }));
  s.push(poly([-0.55, 1.96, 0.79], [[-0.08, 0.04], [0.08, 0.04], [0, -0.14]], 0.03, 'no', { glow: 2 }), sph([-0.55, 2.06, 0.79], 0.09, 'nm', { glow: 2 }));
  // giant soft-serve
  s.push(cap([0, 2.32, 0], [0, 3.35, 0], 0.12, 0.42, '#e0a95a', { stripes: { axis: 'y', p: 0.18, w: 0.05, col: '#b87a34' }, dither: { col: '#eebd72', amt: 0.15 }, jit: 0.04 }));
  const sw = [[3.45, 0.36, 0.15], [3.72, 0.28, 0.14], [3.96, 0.19, 0.13], [4.16, 0.1, 0.11]];
  sw.forEach(([y, R, r], i) => s.push(tor([0, y, 0], R, r, i % 2 ? '#ffb6cb' : '#fff3dc', { jit: 0.03 })));
  s.push(sph([0, 3.45, 0], 0.3, '#fff3dc'), cap([0, 4.2, 0], [0.05, 4.42, 0.02], 0.1, 0.03, '#ffb6cb'));
  s.push(sph([0.12, 4.32, 0.12], 0.08, '#e23b3b'), cap([0.12, 4.38, 0.12], [0.18, 4.52, 0.1], 0.015, 0.015, '#5d9f42'));
  s.push(tor([0, 3.47, 0], 0.36, 0.15, '#ff4ac8', { paint: 1, spots: { col: '#ffe45c', d: 0.15, s: 0.06 } }));
  prop('icecream_stand', vs, s, { footprint: [2.1, 1.7], solid: true, destructible: true, hp: 100, debris: ['#ffb6cb', '#a6e6cf', '#fff3dc', '#e0a95a'], light: { color: '#ff8ad8', intensity: 2, y: 2.0, range: 5, night: true }, tags: ['shop', 'park', 'street', 'food', 'light'] });
}

// ---- ramen yatai with stools, steaming pot and red lanterns -------------------------------------------
{
  const vs = 0.073, s = [];
  yataiBase(s, { panel: '#7a2a1e', body: 'wdD' });
  s.push(box(-1.05, 0.95, 0.5, 1.05, 1.0, 0.85, 'wdL', { jit: 0.04 }));
  // pot + bowls
  s.push(vcyl(-0.55, -0.1, 1.0, 1.32, 0.24, 'mt', { jit: 0.03 }), vcyl(-0.55, -0.1, 1.28, 1.34, 0.26, 'mtD'), vcyl(-0.55, -0.1, 1.3, 1.34, 0.21, '#e8c890', { glow: 0 }));
  for (const x of [0.05, 0.45, 0.85]) {
    s.push(cap([x, 1.0, 0.65], [x, 1.1, 0.65], 0.06, 0.1, '#c22a2a', { jit: 0.03 }), vcyl(x, 0.65, 1.07, 1.1, 0.085, '#f2d28a'));
    s.push(vox(vs, x + 0.03, 1.12, 0.65, '#f4e9d2'), vox(vs, x - 0.03, 1.12, 0.68, '#5d9f42'));
  }
  // roof
  s.push(box(-1.2, 2.15, -0.75, 1.2, 2.25, 0.85, 'wdK', { stripes: { axis: 'x', p: 0.2, w: 0.04, col: 'wdD' }, jit: 0.04 }));
  s.push(box(-1.1, 2.25, -0.6, 1.1, 2.32, 0.7, 'wdD'));
  // noren ラーメン
  const N = ['ra', 'dash', 'me', 'n'];
  N.forEach((g, i) => {
    const x = -0.81 + i * 0.54;
    s.push(box(x - 0.26, 1.6, 0.77, x + 0.26, 2.15, 0.84, 'rd', { jit: 0.03 }));
    s.push(...bitmap(g === 'dash' ? HIRA.dash : KANA[g], [x - 0.23, 2.08, 0.8], vs, 0.03, { '#': 'w' }, 'xy', { snap: vs, paint: 1 }));
  });
  // stools
  for (const x of [-0.6, 0.0, 0.6]) { s.push(box(x - 0.035, 0, 1.115, x + 0.035, 0.5, 1.185, 'mtD')); s.push(vcyl(x, 1.15, 0.46, 0.55, 0.16, '#c22a2a', { jit: 0.03 })); s.push(vcyl(x, 1.15, 0.02, 0.06, 0.12, 'mtD')); }
  const lan = (x) => [cyl([x, 2.15, 0.85], [x, 2.02, 0.85], 0.015, 'ink'), ...chochin([x, 1.82, 0.85], 0.14, 0.18, '#ff5a3c', '#b8301e', 2, '#ffd9a0')];
  prop('ramen_stall', vs, [
    { n: 'body', p: [0, 0, 0], s },
    { n: 'lanternA', p: [-1.12, 2.15, 0.85], s: lan(-1.12), sway: { axis: 'x', amp: 0.05, freq: 0.5 } },
    { n: 'lanternB', p: [1.12, 2.15, 0.85], s: lan(1.12), sway: { axis: 'x', amp: 0.05, freq: 0.5, phase: 1.3 } },
  ], { footprint: [2.5, 1.4], solid: true, destructible: true, hp: 110, debris: ['#7c5333', '#d83a3c', '#a9b1bb', '#ffffff'], light: { color: '#ffa860', intensity: 3, y: 2.0, range: 5.5, night: true }, tags: ['shop', 'street', 'food', 'night-market', 'light'] },
    { fx: [{ part: 'body', at: [-0.55, 1.4, -0.1], type: 'steam', rate: 1.2, scale: 1.2 }] });
}

// =====================================================================
// FARM (opening cinematic)
// =====================================================================

// ---- red barn with a gambrel roof (gable faces +z) -----------------------------------------------------
{
  const vs = 0.12, s = [];
  const W = 2.8, Dz = 3.5, WALL = 3.0;
  const prof = (o) => [[-W - o, WALL - o * 0.4], [-W + 0.5 - o * 0.6, 4.6 + o * 0.6], [-1.25, 5.85 + o], [0, 6.15 + o], [1.25, 5.85 + o], [W - 0.5 + o * 0.6, 4.6 + o * 0.6], [W + o, WALL - o * 0.4]];
  const RED = '#c4402f', REDD = '#9a2f24';
  // roof shell first, then the red body overwrites the inside
  s.push(poly([0, 0, 0], [...prof(0.22), [W + 0.22, WALL - 0.3], [-W - 0.22, WALL - 0.3]], Dz + 0.25, 'rf', { stripes: { axis: 'z', p: 0.48, w: 0.12, col: 'rfD' }, jit: 0.04 }));
  for (const z of [Dz + 0.12, -Dz - 0.12]) s.push(poly([0, 0, z], [[-W, 0], ...prof(0), [W, 0]], 0.14, 'k', { sub: 1 }));
  s.push(poly([0, 0, 0], [[-W, 0], ...prof(0), [W, 0]], Dz, RED, { jit: 0.05 }));
  // board texture: vertical boards on gables, horizontal-ish seams on the long sides
  for (const z of [Dz, -Dz]) s.push(box(-W, 0, z - 0.06, W, 6.2, z + 0.06, RED, { paint: 1, stripes: { axis: 'x', p: 0.36, w: 0.07, col: REDD }, jit: 0.05 }));
  for (const x of [W, -W]) s.push(box(x - 0.06, 0, -Dz, x + 0.06, WALL, Dz, RED, { paint: 1, stripes: { axis: 'z', p: 0.36, w: 0.07, col: REDD }, jit: 0.05 }));
  s.push(box(-W - 0.1, 0, -Dz - 0.1, W + 0.1, 0.36, Dz + 0.1, 'st', { paint: 1, dither: { col: 'stD', amt: 0.3 } }));
  // white gable trim
  const tr = prof(0.02);
  for (let i = 0; i < tr.length - 1; i++) s.push(cap([tr[i][0], tr[i][1], Dz + 0.14], [tr[i + 1][0], tr[i + 1][1], Dz + 0.14], 0.08, 0.08, 'wh', { jit: 0.02 }));
  // big sliding doors with X braces + hayloft door
  const door = (x0, x1, y0, y1, z) => {
    s.push(box(x0, y0, z - 0.04, x1, y1, z + 0.08, '#a8342a', { stripes: { axis: 'x', p: 0.3, w: 0.06, col: REDD }, jit: 0.04 }));
    s.push(box(x0, y0, z + 0.06, x1, y0 + 0.14, z + 0.16, 'wh'), box(x0, y1 - 0.14, z + 0.06, x1, y1, z + 0.16, 'wh'));
    s.push(box(x0, y0, z + 0.06, x0 + 0.14, y1, z + 0.16, 'wh'), box(x1 - 0.14, y0, z + 0.06, x1, y1, z + 0.16, 'wh'));
    s.push(cap([x0 + 0.1, y0 + 0.1, z + 0.11], [x1 - 0.1, y1 - 0.1, z + 0.11], 0.07, 0.07, 'wh'), cap([x1 - 0.1, y0 + 0.1, z + 0.11], [x0 + 0.1, y1 - 0.1, z + 0.11], 0.07, 0.07, 'wh'));
  };
  door(-1.3, 0.0, 0, 2.6, Dz); door(0.0, 1.3, 0, 2.6, Dz);
  door(-0.55, 0.55, 3.6, 4.7, Dz);
  s.push(box(-1.5, 2.6, Dz, 1.5, 2.72, Dz + 0.3, 'wdD'));
  s.push(box(-0.1, 4.75, Dz, 0.1, 5.3, Dz + 0.5, 'wdD'), box(-0.06, 4.3, Dz + 0.4, 0.06, 4.75, Dz + 0.48, 'mtK'));
  // side windows
  for (const z of [-1.6, 1.6]) for (const sx of [1, -1]) { s.push(box(sx * W - 0.08, 1.4, z - 0.4, sx * W + 0.08, 2.2, z + 0.4, 'wh')); s.push(box(sx * W - 0.12, 1.5, z - 0.3, sx * W + 0.12, 2.1, z + 0.3, '#2a3a4a')); s.push(box(sx * W - 0.14, 1.78, z - 0.3, sx * W + 0.14, 1.82, z + 0.3, 'wh')); }
  // solar strip on the right slope (2050)
  s.push(poly([0, 0, 0], [[1.35, 5.95], [2.38, 4.95], [2.55, 5.05], [1.45, 6.1]], 2.2, '#2a3f7a', { paint: 1, stripes: { axis: 'z', p: 0.36, w: 0.07, col: '#8fa6d6' } }));
  // cupola + weathervane
  s.push(box(-0.45, 6.1, -0.45, 0.45, 6.75, 0.45, 'wh', { jit: 0.03 }));
  s.push(box(-0.3, 6.25, 0.42, 0.3, 6.6, 0.5, '#2a3a4a'), box(-0.3, 6.25, -0.5, 0.3, 6.6, -0.42, '#2a3a4a'));
  s.push(...hipRoof([0, 6.75, 0], 0.62, 0.62, 4, 0.14, 0.12, 'rf'));
  s.push(box(-0.05, 7.1, -0.05, 0.05, 7.8, 0.05, 'mtK'), box(-0.4, 7.56, -0.05, 0.4, 7.64, 0.05, 'mtK'), poly([0.45, 7.6, 0], [[-0.1, 0.16], [0.16, 0], [-0.1, -0.16]], 0.05, 'mtK'), poly([-0.45, 7.6, 0], [[-0.14, 0.16], [0.08, 0.16], [0.08, -0.16], [-0.14, -0.16]], 0.05, 'gd'));
  prop('barn', vs, s, { footprint: [6.0, 7.4], solid: true, tags: ['farm', 'building', 'cinematic'] });
}

// ---- grain silo ------------------------------------------------------------------------------------------
{
  const vs = 0.1, s = [];
  s.push(vcyl(0, 0, 0, 0.3, 1.3, 'stL', { dither: { col: 'st', amt: 0.3 } }));
  s.push(vcyl(0, 0, 0.3, 6.4, 1.1, 'mtL', { stripes: { axis: 'y', p: 0.4, w: 0.1, col: 'mt' }, jit: 0.03 }));
  s.push(vcyl(0, 0, 4.6, 5.2, 1.12, 'tl', { paint: 1, jit: 0.03 }));
  s.push(sph([0, 6.3, 0], 1.12, 'mtL', { jit: 0.03 }), box(-1.3, 5.2, -1.3, 1.3, 6.3, 1.3, 'k', { sub: 1 }), vcyl(0, 0, 5.2, 6.35, 1.1, 'mtL', { stripes: { axis: 'y', p: 0.4, w: 0.1, col: 'mt' } }));
  s.push(vcyl(0, 0, 7.3, 7.6, 0.18, 'mtD'), cap([0, 7.6, 0], [0, 7.8, 0], 0.26, 0.05, 'mtD'));
  // ladder cage on the front
  for (const sx of [-0.2, 0.2]) s.push(box(sx - 0.03, 0.3, 1.12, sx + 0.03, 7.0, 1.18, 'mtD'));
  for (let y = 0.5; y < 7.0; y += 0.3) s.push(box(-0.2, y - 0.02, 1.12, 0.2, y + 0.02, 1.18, 'mtD'));
  for (let y = 2.4; y < 7.0; y += 0.8) s.push(tor([0, y, 1.22], 0.3, 0.05, 'mtD'));
  s.push(box(-0.45, 0.3, 1.0, 0.45, 1.5, 1.16, 'mtD', { jit: 0.03 }), box(-0.35, 0.4, 1.1, 0.35, 1.4, 1.18, 'mtK'));
  prop('silo', vs, s, { footprint: [2.6, 2.6], solid: true, tags: ['farm', 'building', 'cinematic'] });
}

// ---- hay bale stack -------------------------------------------------------------------------------------
{
  const vs = 0.07, s = [];
  const bale = (x, y, z, ry = 0) => {
    s.push(bx([x, y + 0.23, z], [0.45, 0.23, 0.25], 'hy', { round: 0.05, rot: [0, ry, 0], stripes: { axis: 'y', p: 0.12, w: 0.03, col: 'hyD' }, dither: { col: 'hyL', amt: 0.18 }, jit: 0.06 }));
    for (const dx of [-0.22, 0.22]) s.push(bx([x + dx * Math.cos(ry * Math.PI / 180), y + 0.23, z - dx * Math.sin(ry * Math.PI / 180)], [0.03, 0.24, 0.26], '#8a6a3a', { rot: [0, ry, 0], paint: 1 }));
  };
  bale(-0.5, 0, 0, 0); bale(0.48, 0, 0.05, 4); bale(-0.02, 0, -0.55, 90);
  bale(-0.05, 0.46, 0.0, 0); bale(0.3, 0.46, -0.5, 80);
  bale(0.1, 0.92, -0.2, 20);
  const r = rng(6);
  for (let i = 0; i < 14; i++) { const a = r() * 6.28, d = 0.95 + r() * 0.35; s.push(vox(vs, Math.cos(a) * d, 0, Math.sin(a) * d, r() < 0.5 ? 'hy' : 'hyL')); }
  s.push(cyl([0.95, 0.0, 0.45], [0.75, 1.3, 0.5], 0.025, 'wdL'), box(0.65, 1.28, 0.42, 0.88, 1.32, 0.58, 'mtD'));
  for (const dz of [-0.06, 0, 0.06]) s.push(cyl([0.76 - 0.0, 1.3, 0.5 + dz], [0.72, 1.55, 0.5 + dz], 0.015, 'mtD'));
  prop('haystack', vs, s, { footprint: [1.9, 1.4], solid: true, destructible: true, hp: 40, debris: ['#e6c46a', '#c49e46', '#f4dc92'], tags: ['farm', 'cinematic'] });
}

// ---- farm post-and-rail fence (2 m, tileable) --------------------------------------------------------------
{
  const vs = 0.06, s = [];
  for (const sx of [-0.94, 0.94]) { s.push(box(sx - 0.07, 0, -0.07, sx + 0.07, 1.12, 0.07, 'wd', { dither: { col: 'wdD', amt: 0.2 }, jit: 0.05 })); s.push(poly([sx, 1.14, 0], [[-0.08, -0.03], [0.08, -0.03], [0, 0.06]], 0.08, 'wdD')); }
  for (const y of [0.35, 0.68, 0.98]) s.push(box(-1.0, y - 0.06, 0.07, 1.0, y + 0.06, 0.13, 'wdL', { dither: { col: 'wd', amt: 0.25 }, jit: 0.06 }));
  s.push(ell([0.5, 0.04, 0.05], [0.25, 0.08, 0.18], 'gr', { noise: 0.03, top: 'grL' }));
  prop('fence_farm', vs, s, { footprint: [2, 0.25], solid: true, destructible: true, hp: 30, debris: ['#c99a68', '#a8744a'], tags: ['farm', 'fence', 'cinematic'] });
}

// ---- water trough ------------------------------------------------------------------------------------------
{
  const vs = 0.05, s = [];
  for (const sx of [-0.62, 0.62]) { s.push(cap([sx, 0, 0.28], [sx, 0.42, -0.1], 0.04, 0.04, 'wdD'), cap([sx, 0, -0.28], [sx, 0.42, 0.1], 0.04, 0.04, 'wdD')); }
  s.push(box(-0.8, 0.3, -0.28, 0.8, 0.72, 0.28, 'wd', { stripes: { axis: 'y', p: 0.14, w: 0.03, col: 'wdD' }, jit: 0.05 }));
  s.push(box(-0.72, 0.38, -0.2, 0.72, 0.8, 0.2, 'k', { sub: 1 }));
  s.push(box(-0.72, 0.38, -0.2, 0.72, 0.62, 0.2, 'wa', { dither: { col: 'waL', amt: 0.25 }, jit: 0.04 }));
  s.push(box(-0.82, 0.68, -0.3, 0.82, 0.74, 0.3, 'mtD', { paint: 1 }));
  s.push(ell([-0.6, 0.62, 0.22], [0.15, 0.06, 0.06], 'ms', { paint: 1 }));
  prop('trough', vs, s, { footprint: [1.7, 0.7], solid: true, destructible: true, hp: 50, debris: ['#a8744a', '#4fb4e2'], tags: ['farm', 'cinematic'] });
}

// ---- futuristic tractor (front +z) ----------------------------------------------------------------------------
{
  const vs = 0.08, s = [];
  const BODY = '#3fae6a', BODYD = '#2c8650', CREAM = '#f4e9d2';
  // wheels
  for (const sx of [0.78, -0.78]) {
    s.push(tor([sx, 0.66, -0.55], 0.48, 0.2, '#2b2b33', { axis: 'x', stripes: { axis: 'z', p: 0.2, w: 0.08, col: '#3c3c46' }, jit: 0.04 }));
    s.push(cyl([sx - 0.16, 0.66, -0.55], [sx + 0.16, 0.66, -0.55], 0.32, 'ny', { jit: 0.03 }));
    s.push(cyl([sx * 1.12 - 0.04, 0.66, -0.55], [sx * 1.12 + 0.04, 0.66, -0.55], 0.12, 'mtK'));
    s.push(tor([sx * 0.95, 0.38, 1.05], 0.25, 0.12, '#2b2b33', { axis: 'x', jit: 0.04 }));
    s.push(cyl([sx * 0.95 - 0.1, 0.38, 1.05], [sx * 0.95 + 0.1, 0.38, 1.05], 0.16, 'ny'));
  }
  // chassis + rounded hood + cab
  s.push(box(-0.45, 0.45, -1.1, 0.45, 0.85, 1.3, 'mtK', { jit: 0.03 }));
  s.push(poly([0, 0, 0], [[-0.2, 0.7], [1.5, 0.7], [1.62, 0.95], [1.45, 1.2], [0.2, 1.32], [-0.2, 1.3]], 0.42, BODY, { plane: 'zy', fat: 0.06, top: '#5fca88', topT: 0.7, jit: 0.04 }));
  s.push(box(-0.5, 0.88, 1.6, 0.5, 1.02, 1.7, 'nw', { glow: 3 }));
  s.push(box(-0.5, 0.75, -1.25, 0.5, 1.1, 0.0, BODYD, { jit: 0.04 }));
  for (const sx of [0.62, -0.62]) s.push(ell([sx, 1.1, -0.55], [0.26, 0.12, 0.62], BODY, { top: '#5fca88', jit: 0.04 }));
  s.push(bx([0, 1.6, -0.5], [0.5, 0.46, 0.55], '#24354f', { round: 0.12, jit: 0.03 }));
  s.push(box(-0.52, 1.14, -1.07, 0.52, 1.35, 0.07, BODY, { paint: 1 }));
  for (const [x, z] of [[0.45, 0.0], [-0.45, 0.0], [0.45, -1.0], [-0.45, -1.0]]) s.push(box(x - 0.06, 1.14, z - 0.06, x + 0.06, 2.06, z + 0.06, CREAM, { paint: 1 }));
  s.push(box(-0.52, 1.6, 0.0, 0.52, 1.85, 0.08, '#5f87b3', { paint: 1 }));
  s.push(bx([0, 2.1, -0.5], [0.6, 0.06, 0.66], CREAM, { round: 0.04, jit: 0.03 }));
  s.push(box(-0.6, 2.02, 0.12, 0.6, 2.06, 0.18, 'nc', { glow: 2 }));
  s.push(box(0.26, 2.15, -0.94, 0.34, 2.4, -0.86, 'mtK'), sph([0.3, 2.46, -0.9], 0.06, 'no', { glow: 2 }));
  s.push(box(-0.43, 1.0, 0.25, 0.43, 1.06, 1.45, 'nc', { glow: 1, paint: 1, stripes: { axis: 'z', p: 0.3, w: 0.08, col: BODY } }));
  s.push(box(-0.3, 0.4, -1.45, 0.3, 0.7, -1.15, 'mtD'));
  prop('tractor', vs, s, { footprint: [2.0, 3.4], solid: true, tags: ['farm', 'vehicle', 'cinematic'] });
}

// ---- kakashi scarecrow ---------------------------------------------------------------------------------------
{
  const vs = 0.043, s = [];
  s.push(vcyl(0, 0, 0, 1.75, 0.04, 'wd'));
  s.push(cyl([-0.62, 1.32, 0], [0.62, 1.32, 0], 0.035, 'wd'));
  s.push(box(-0.2, 0.75, -0.12, 0.2, 1.42, 0.12, '#2c3f78', { jit: 0.04 }));
  s.push(box(-0.21, 0.75, -0.13, 0.21, 0.82, 0.13, 'w', { paint: 1 }));
  s.push(box(-0.04, 0.82, 0.11, 0.04, 1.42, 0.14, 'w'));
  for (const sx of [1, -1]) {
    s.push(cyl([sx * 0.18, 1.32, 0], [sx * 0.5, 1.3, 0], 0.11, '#2c3f78', { jit: 0.04 }));
    for (let i = 0; i < 4; i++) s.push(cap([sx * 0.55, 1.3, 0], [sx * (0.68 + (i % 2) * 0.04), 1.22 + i * 0.04, -0.06 + i * 0.04], 0.025, 0.015, 'hy'));
  }
  s.push(ell([0.1, 1.1, 0.13], [0.06, 0.06, 0.01], '#e2482e', { paint: 1 }));
  s.push(sph([0, 1.6, 0], 0.17, '#d9c49a', { dither: { col: '#c4ad80', amt: 0.3 }, jit: 0.05 }));
  s.push(vox(vs, -0.06, 1.64, 0.16, 'k'), vox(vs, 0.06, 1.64, 0.16, 'k'), box(-0.06, 1.53, 0.14, 0.06, 1.55, 0.18, 'k'), box(-0.08, 1.56, 0.14, -0.06, 1.58, 0.18, 'k'), box(0.06, 1.56, 0.14, 0.08, 1.58, 0.18, 'k'));
  [[1.72, 0.44], [1.76, 0.36], [1.8, 0.27], [1.84, 0.18], [1.88, 0.1], [1.92, 0.04]].forEach(([y, r], i) => s.push(vcyl(0, 0, y, y + 0.04, r, i % 2 ? 'hyD' : 'hy', { dither: { col: 'hyL', amt: 0.2 }, jit: 0.05 })));
  s.push(tor([0, 1.74, 0], 0.17, 0.02, '#a8342a'));
  // a crow on the arm
  s.push(ell([-0.45, 1.44, 0], [0.06, 0.06, 0.1], 'ink'), sph([-0.45, 1.52, 0.07], 0.045, 'ink'), cap([-0.45, 1.52, 0.11], [-0.45, 1.51, 0.16], 0.015, 0.005, 'gd'), cap([-0.45, 1.43, -0.08], [-0.45, 1.46, -0.18], 0.03, 0.01, 'ink'));
  prop('scarecrow', vs, s, { footprint: [0.5, 0.5], solid: true, destructible: true, hp: 30, debris: ['#e6c46a', '#2c3f78', '#a8744a'], tags: ['farm', 'cinematic'] });
}

// ---- crop rows (2 m along x) ---------------------------------------------------------------------------------
const soilRow = (s) => { s.push(bx([0, 0.06, 0], [1.0, 0.1, 0.32], 'dt', { round: 0.08, dither: { col: 'dtD', amt: 0.3 }, top: 'dtL', topT: 0.8, jit: 0.06 })); };
{
  const vs = 0.05, s = [];
  soilRow(s);
  for (let i = 0; i < 5; i++) {
    const x = -0.8 + i * 0.4, a0 = i * 0.7;
    for (let k = 0; k < 5; k++) { const a = a0 + k * 1.256; s.push(ell([x + Math.cos(a) * 0.14, 0.2, Math.sin(a) * 0.14], [0.13, 0.05, 0.1], '#5f9f46', { rot: [0, -a * 57.3, 12], top: '#7fbf5a', jit: 0.05 })); }
    s.push(sph([x, 0.26, 0], 0.13, '#a8d878', { top: '#c8ec98', topT: 0.6, stripes: { axis: 'x', p: 0.08, w: 0.02, col: '#8cc060' }, jit: 0.04 }));
  }
  prop('cabbage_row', vs, s, { footprint: [2, 0.7], solid: false, destructible: true, hp: 20, debris: ['#a8d878', '#5f9f46', '#8a6a4a'], tags: ['farm', 'crops', 'cinematic'] });
}
{
  const vs = 0.05, r = rng(14), st = [];
  const body = []; soilRow(body);
  for (let i = 0; i < 6; i++) {
    const x = -0.85 + i * 0.34, h = 1.7 + r() * 0.35, lean = (r() - 0.5) * 0.1;
    st.push(cap([x, 0.1, 0], [x + lean, h, 0], 0.035, 0.025, '#6f9c45'));
    for (let k = 0; k < 4; k++) { const y = 0.4 + k * 0.32, a = k * 2.3 + i; st.push(...tube(bez([x, y, 0], [x + Math.cos(a) * 0.3, y + 0.2, Math.sin(a) * 0.3], [x + Math.cos(a) * 0.45, y - 0.1, Math.sin(a) * 0.45], 2), 0.035, 0.025, k % 2 ? '#5f9f46' : '#7fb550', { tip: '#c8c27a', tipT: 0.8 })); }
    const ey = 0.95 + r() * 0.25;
    st.push(ell([x + 0.07, ey, 0.05], [0.05, 0.13, 0.05], 'ny', { rot: [0, 0, -15], dither: { col: '#e8c040', amt: 0.3 } }), ell([x + 0.07, ey - 0.05, 0.05], [0.06, 0.1, 0.06], '#8cc060', { rot: [0, 0, -15] }));
    st.push(cap([x + lean, h, 0], [x + lean + 0.1, h + 0.18, 0], 0.025, 0.01, '#d8b860'), cap([x + lean, h, 0], [x + lean - 0.08, h + 0.15, 0.05], 0.025, 0.01, '#d8b860'));
  }
  prop('corn_row', vs, [
    { n: 'body', p: [0, 0, 0], s: body },
    { n: 'stalks', p: [0, 0, 0], s: st, sway: { axis: 'x', amp: 0.03, freq: 0.45 } },
  ], { footprint: [2, 0.7], solid: true, destructible: true, hp: 25, debris: ['#6f9c45', '#ffe45c', '#8a6a4a'], tags: ['farm', 'crops', 'cinematic', 'stealth'] });
}

// ---- farm windmill (lattice tower, spinning multi-blade wheel) -----------------------------------------------
{
  const vs = 0.07, s = [];
  const H = 6.2, B = 0.95, T = 0.28;
  const corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  for (const [cx, cz] of corners) s.push(cyl([cx * B, 0, cz * B], [cx * T, H, cz * T], 0.05, 'mtD', { jit: 0.03 }));
  for (let lv = 0; lv < 4; lv++) {
    const y0 = lv * (H / 4), y1 = (lv + 1) * (H / 4), w0 = B + (T - B) * (lv / 4), w1 = B + (T - B) * ((lv + 1) / 4);
    for (let f = 0; f < 4; f++) {
      const [ax, az] = corners[f], [bx2, bz] = corners[(f + 1) % 4];
      s.push(cyl([ax * w0, y0, az * w0], [bx2 * w1, y1, bz * w1], 0.03, 'mt'), cyl([bx2 * w0, y0, bz * w0], [ax * w1, y1, az * w1], 0.03, 'mt'));
      s.push(cyl([ax * w1, y1, az * w1], [bx2 * w1, y1, bz * w1], 0.035, 'mtD'));
    }
  }
  for (const [cx, cz] of corners) s.push(box(cx * B - 0.15, 0, cz * B - 0.15, cx * B + 0.15, 0.2, cz * B + 0.15, 'stL'));
  s.push(box(-0.45, H - 0.05, -0.45, 0.45, H + 0.05, 0.45, 'wd', { jit: 0.04 }));
  s.push(cap([0, H + 0.3, -0.3], [0, H + 0.3, 0.45], 0.14, 0.12, 'mtK'));
  s.push(cyl([0, H + 0.3, -0.3], [0, H + 0.3, -1.9], 0.04, 'mtD'));
  s.push(poly([0, H + 0.45, -2.1], [[0.45, -0.25], [-0.45, -0.25], [-0.55, 0.5], [0.4, 0.3]], 0.03, 'rd', { plane: 'zy', jit: 0.03 }));
  s.push(cyl([-0.06, H + 0.48, -2.1], [0.06, H + 0.48, -2.1], 0.16, 'w', { paint: 1 }));
  s.push(vcyl(0, 0, 0.2, H, 0.025, 'wdL'));
  const wheel = [cyl([0, H + 0.3, 0.42], [0, H + 0.3, 0.6], 0.15, 'mtK')];
  const N = 16;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 360;
    wheel.push(poly([0, H + 0.3, 0.55], [[0.18, -0.05], [1.45, -0.16], [1.45, 0.16], [0.18, 0.05]], 0.025, i % 2 ? 'w' : 'rd', { rot: [0, 0, a], jit: 0.03 }));
  }
  wheel.push(tor([0, H + 0.3, 0.55], 1.0, 0.03, 'mtD', { axis: 'z' }));
  prop('windmill', vs, [
    { n: 'body', p: [0, 0, 0], s },
    { n: 'wheel', p: [0, H + 0.3, 0.55], s: wheel, spin: { axis: 'z', speed: 1.4 } },
  ], { footprint: [2.2, 2.2], solid: true, tags: ['farm', 'landmark-small', 'cinematic'] });
}

// =====================================================================
// LANDMARKS
// =====================================================================

// ---- Osaka Castle tenshu (5 tiers on an ishigaki base, ~22 m) -------------------------------------------
{
  const vs = 0.2, s = [];
  const pal = Object.assign({}, P, { cg: '#56a48a', cgD: '#3c8370', cgL: '#7cc4aa' });
  const STONE = { stripes: { axis: 'y', p: 0.6, w: 0.2, col: 'stK' }, spots: { col: 'stL', d: 0.3, s: 0.5 }, dither: { col: 'stD', amt: 0.18 }, jit: 0.06 };
  // battered stone base
  const BH = 5.0;
  for (let i = 0; i < 5; i++) s.push(box(-7.5 + i * 0.3, i, -6.5 + i * 0.3, 7.5 - i * 0.3, i + 1, 6.5 - i * 0.3, i % 2 ? 'stW' : 'st', STONE));
  for (const [cx, cz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) for (let i = 0; i < 5; i++) s.push(box(cx * (7.5 - i * 0.3) - 0.7 * cx, i, cz * (6.5 - i * 0.3) - 0.7 * cz, cx * (7.5 - i * 0.3), i + 1, cz * (6.5 - i * 0.3), 'stL', { paint: 1, stripes: { axis: 'y', p: 0.5, w: 0.2, col: 'stD' }, jit: 0.05 }));
  s.push(box(-6.3, BH - 0.2, -5.3, 6.3, BH, 5.3, 'stD', { dither: { col: 'stK', amt: 0.3 } }));
  s.push(box(-6.3, BH - 1.0, 5.0, 6.3, BH - 0.2, 5.4, 'ms', { paint: 1, spots: { col: 'stW', d: 0.55, s: 0.4 } }));
  // tiers: [hx, hz, wallH]
  const tiers = [[5.2, 4.3, 2.6], [4.4, 3.6, 2.2], [3.6, 2.9, 2.0], [2.8, 2.2, 1.8], [2.1, 1.7, 2.0]];
  const ROOF = { stripes: { axis: 'x', p: 0.4, w: 0.2, col: 'cgD' }, belly: 'cr', bellyT: 0.5, jit: 0.04 };
  const ROOFZ = { stripes: { axis: 'z', p: 0.4, w: 0.2, col: 'cgD' }, belly: 'cr', bellyT: 0.5, jit: 0.04 };
  let y = BH;
  tiers.forEach(([hx, hz, wh], t) => {
    const top = t === tiers.length - 1;
    const next = tiers[t + 1];
    // walls (reach down into the roof below)
    const y0 = t === 0 ? y : y - 1.2;
    s.push(box(-hx, y0, -hz, hx, y + wh, hz, top ? 'ink' : 'cr', { jit: 0.03 }));
    if (!top) s.push(box(-hx - 0.01, y, -hz - 0.01, hx + 0.01, y + 0.4, hz + 0.01, 'crD', { paint: 1 }));
    // windows
    const wy0 = y + wh * 0.38, wy1 = y + wh * 0.72;
    const nX = Math.max(2, Math.floor((hx * 2) / 1.5)), nZ = Math.max(2, Math.floor((hz * 2) / 1.5));
    for (let i = 0; i < nX; i++) { const x = -hx + (i + 0.5) * (hx * 2 / nX); s.push(box(x - 0.3, wy0, -hz - 0.05, x + 0.3, wy1, hz + 0.05, top ? 'gd' : '#2c3140', { paint: 1 })); }
    for (let i = 0; i < nZ; i++) { const z = -hz + (i + 0.5) * (hz * 2 / nZ); s.push(box(-hx - 0.05, wy0, z - 0.3, hx + 0.05, wy1, z + 0.3, top ? 'gd' : '#2c3140', { paint: 1 })); }
    if (top) s.push(box(-hx - 0.05, y + wh - 0.3, -hz - 0.05, hx + 0.05, y + wh, hz + 0.05, 'gd', { paint: 1 }));
    y += wh;
    // roof: hipped eave stepping up to the next tier
    const ex = hx + 1.0, ez = hz + 1.0;
    const nL = top ? 7 : Math.ceil((ex - next[0]) / 0.28) + 1;
    const step = top ? 0.26 : 0.28;
    for (let i = 0; i < nL; i++) {
      const ax = Math.max(ex - i * step, top ? 1.4 : 0.2), az = Math.max(ez - i * step, top ? 0.3 : 0.2);
      s.push(box(-ax, y + i * 0.2, -az, ax, y + (i + 1) * 0.2, az, 'cg', i % 2 ? ROOF : ROOFZ));
    }
    // upturned corners + gold eave rim
    for (const [cx, cz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) s.push(box(cx * ex - 0.4 * cx, y + 0.2, cz * ez - 0.4 * cz, cx * (ex + 0.2), y + 0.4, cz * (ez + 0.2), 'cg', { jit: 0.04 }));
    s.push(box(-ex - 0.2, y, -ez - 0.2, ex + 0.2, y + 0.2, ez + 0.2, 'gd', { paint: 1 }), box(-ex + 0.2, y, -ez + 0.2, ex - 0.2, y + 0.2, ez - 0.2, 'cg', { paint: 1, ...ROOF }));
    // chidori-hafu gables on the front/back of lower roofs, side gables on tier 2
    if (t <= 2) {
      const gw = t === 0 ? 2.6 : 2.0, gh = t === 0 ? 1.7 : 1.35;
      for (const sz of [1, -1]) {
        const z = sz * (ez - 0.9);
        s.push(poly([0, y + 0.2, z], [[-gw - 0.3, 0], [gw + 0.3, 0], [0, gh + 0.25]], 0.75, 'cg', { jit: 0.04 }));
        s.push(poly([0, y + 0.2, z + sz * 0.72], [[-gw, 0.05], [gw, 0.05], [0, gh]], 0.08, 'cr', { jit: 0.03 }));
        s.push(poly([0, y + 0.25, z + sz * 0.78], [[-gw + 0.2, 0.25], [gw - 0.2, 0.25], [0, gh - 0.2]], 0.06, 'gd', { jit: 0.03 }));
        s.push(poly([0, y + 0.3, z + sz * 0.82], [[-gw + 0.5, 0.35], [gw - 0.5, 0.35], [0, gh - 0.45]], 0.06, 'cr'));
      }
    }
    if (t === 1) {
      for (const sx of [1, -1]) {
        const x = sx * (ex - 0.9);
        s.push(poly([x, y + 0.2, 0], [[-1.9, 0], [1.9, 0], [0, 1.3]], 0.75, 'cg', { plane: 'zy', jit: 0.04 }));
        s.push(poly([x + sx * 0.72, y + 0.2, 0], [[-1.6, 0.05], [1.6, 0.05], [0, 1.05]], 0.08, 'cr', { plane: 'zy' }));
        s.push(poly([x + sx * 0.78, y + 0.3, 0], [[-1.2, 0.2], [1.2, 0.2], [0, 0.75]], 0.06, 'gd', { plane: 'zy' }));
      }
    }
    if (top) {
      // ridge, gable ends (irimoya) and golden shachihoko
      const ry = y + nL * 0.2;
      s.push(box(-1.6, ry, -0.2, 1.6, ry + 0.3, 0.2, 'cgD', { jit: 0.03 }));
      for (const sx of [1, -1]) {
        s.push(poly([sx * 1.5, y + 0.6, 0], [[-1.2, 0], [1.2, 0], [0, 0.9]], 0.12, 'cr', { plane: 'zy' }));
        s.push(poly([sx * 1.62, y + 0.75, 0], [[-0.8, 0.1], [0.8, 0.1], [0, 0.6]], 0.06, 'gd', { plane: 'zy' }));
        const fx = sx * 1.45, fy = ry + 0.3;
        s.push(ell([fx, fy + 0.35, 0], [0.18, 0.4, 0.2], 'gd', { top: 'gdL', jit: 0.04 }));
        s.push(cap([fx, fy + 0.6, 0], [fx - sx * 0.35, fy + 1.05, 0], 0.16, 0.08, 'gd', { jit: 0.04 }));
        s.push(poly([fx - sx * 0.42, fy + 1.12, 0], [[-0.2, -0.05], [0.2, -0.05], [0.3, 0.25], [0, 0.08], [-0.3, 0.25]], 0.06, 'gdL', { plane: 'zy' }));
        s.push(sph([fx + sx * 0.12, fy + 0.25, 0.12], 0.06, 'k'), sph([fx + sx * 0.12, fy + 0.25, -0.12], 0.06, 'k'));
      }
      y = ry;
    } else {
      y += (nL - 1) * 0.2;
    }
    // gold tiger/crane panels on the top tier
  });
  // the top floor's gold relief panels + balcony rail
  s.push(box(-2.2, 5.0 + 2.6 + 3.4 + 3.2 + 3.0 - 0.1, -1.8, 2.2, 5.0 + 2.6 + 3.4 + 3.2 + 3.0 + 0.1, 1.8, 'gd', { paint: 1 }));
  prop('osaka_castle', vs, s, { footprint: [15, 13], solid: true, light: { color: '#ffe6b0', intensity: 6, y: 9, range: 18, night: true }, tags: ['landmark', 'castle', 'park', 'osaka', 'light'] }, { pal });
}

// ---- Tsūtenkaku (Shinsekai tower, ~24 m) ------------------------------------------------------------------
{
  const vs = 0.14, s = [];
  const MT = { jit: 0.03 };
  // arched four-leg base
  s.push(box(-3.3, 0, -3.3, 3.3, 6.3, 3.3, 'mtL', MT));
  for (const ax of ['x', 'z']) {
    const A = ax === 'z' ? [[0, 3.0, -4], [0, 3.0, 4]] : [[-4, 3.0, 0], [4, 3.0, 0]];
    s.push(cyl(A[0], A[1], 2.25, 'k', { sub: 1 }));
    s.push(ax === 'z' ? box(-2.25, -0.1, -4, 2.25, 3.0, 4, 'k', { sub: 1 }) : box(-4, -0.1, -2.25, 4, 3.0, 2.25, 'k', { sub: 1 }));
  }
  s.push(box(-2.9, 0.6, -2.9, 2.9, 5.6, 2.9, 'k', { sub: 1 }));
  s.push(box(-2.9, 5.5, -2.9, 2.9, 5.7, 2.9, 'mtD'));
  s.push(box(-3.4, 5.9, -3.4, 3.4, 6.3, 3.4, 'mt', MT));
  s.push(box(-3.45, 6.0, -3.45, 3.45, 6.15, 3.45, 'nm', { paint: 1, glow: 2 }));
  for (const [cx, cz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) s.push(box(cx * 3.3 - cx * 1.0, 0, cz * 3.3 - cz * 1.0, cx * 3.3, 0.5, cz * 3.3, 'stD'));
  // tapering shaft
  let y = 6.3, hw = 2.1;
  while (y < 17) {
    const y1 = Math.min(17, y + 0.84);
    s.push(box(-hw, y, -hw, hw, y1, hw, 'mtL', MT));
    s.push(box(-hw - 0.01, y, -hw - 0.01, hw + 0.01, y + 0.14, hw + 0.01, 'mt', { paint: 1 }));
    for (const sz of [1, -1]) s.push(box(-hw, y, sz * hw - 0.07, hw, y1, sz * hw + 0.07, 'mtL', { paint: 1, stripes: { axis: 'x', p: 0.56, w: 0.14, col: 'mt' } }));
    for (const sx of [1, -1]) s.push(box(sx * hw - 0.07, y, -hw, sx * hw + 0.07, y1, hw, 'mtL', { paint: 1, stripes: { axis: 'z', p: 0.56, w: 0.14, col: 'mt' } }));
    for (const [cx, cz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) s.push(box(cx * hw - cx * 0.14, y, cz * hw - cz * 0.14, cx * hw, y1, cz * hw, (Math.round(y / 0.84) % 2) ? 'nc' : 'nm', { paint: 1, glow: 2 }));
    y = y1; hw -= 0.05;
  }
  // sign band with ELEMON on all four faces
  s.push(box(-1.95, 14.2, -1.95, 1.95, 15.6, 1.95, 'ink', MT));
  for (const [ang, fn] of [[0, (t) => t], [180, null], [90, null], [-90, null]]) {
    const shapes = text('ELEMON', [0, 14.9, 1.97], 0.14, 0.04, 'ny', { glow: 2, snap: vs });
    for (const t of shapes) {
      const c = t[1], h = t[2];
      const a = ang * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      const cx = c[0] * ca + c[2] * sa, cz = -c[0] * sa + c[2] * ca;
      const hx = Math.abs(h[0] * ca) + Math.abs(h[2] * sa), hz = Math.abs(h[0] * sa) + Math.abs(h[2] * ca);
      s.push(['box', [cx, c[1], cz], [hx, h[1], hz], t[3], t[4]]);
    }
  }
  // observation decks (octagonal)
  s.push(prism(8, 0, 0, 16.9, 17.3, 2.6, 'mt', MT));
  s.push(prism(8, 0, 0, 17.3, 20.0, 3.0, 'mtL', MT));
  s.push(prism(8, 0, 0, 18.0, 19.3, 3.06, '#ffd890', { paint: 1, glow: 1, stripes: { axis: 'x', p: 0.7, w: 0.14, col: 'mtD' } }));
  s.push(prism(8, 0, 0, 20.0, 20.3, 3.3, 'mt', MT));
  s.push(prism(8, 0, 0, 20.3, 21.8, 2.0, 'mtL', MT));
  s.push(prism(8, 0, 0, 20.75, 21.4, 2.05, 'nc', { paint: 1, glow: 2, stripes: { axis: 'x', p: 0.56, w: 0.14, col: 'mtD' } }));
  s.push(prism(8, 0, 0, 21.8, 22.0, 2.2, 'mt'));
  // the glowing light ball + antenna
  s.push(vcyl(0, 0, 22.0, 22.5, 0.6, 'mtD'));
  s.push(sph([0, 23.4, 0], 1.15, 'nc', { glow: 2, grad: { axis: 'y', to: 'nm', a: 22.6, b: 24.4 }, stripes: { axis: 'y', p: 0.42, w: 0.14, col: '#bffcff' } }));
  s.push(vcyl(0, 0, 24.4, 26.2, 0.08, 'mt'), sph([0, 26.3, 0], 0.12, 'nr', { glow: 3 }));
  prop('tsutenkaku', vs, s, { footprint: [6.8, 6.8], solid: true, colliders: [[-2.75, -2.75, 1.1, 1.1], [2.75, -2.75, 1.1, 1.1], [-2.75, 2.75, 1.1, 1.1], [2.75, 2.75, 1.1, 1.1]], light: { color: '#7ff0ff', intensity: 6, y: 23, range: 14, night: true }, tags: ['landmark', 'shinsekai', 'neon', 'osaka', 'light'] });
}

// ---- Umeda Sky (twin towers joined by a floating ring garden, ~32 m) ----------------------------------------
{
  const vs = 0.22, s = [];
  const GL = '#5f8db6', GLD = '#4a729a', FR = '#c9d6e0';
  const H = 29.0, cx0 = 5.0, hx = 2.9, hz = 2.6;
  for (const sx of [1, -1]) {
    const x = sx * cx0;
    s.push(box(x - hx, 0, -hz, x + hx, H, hz, GL, { stripes: { axis: 'y', p: 0.88, w: 0.22, col: FR }, grad: { axis: 'y', to: '#7fb0d6', a: 3, b: H }, jit: 0.025 }));
    // mullions: paint thin vertical slabs on each face
    for (let i = 0; i <= 5; i++) { const xx = x - hx + i * (hx * 2 / 5); s.push(box(xx - 0.1, 2.6, -hz - 0.05, xx + 0.1, H, hz + 0.05, FR, { paint: 1 })); }
    for (let i = 0; i <= 4; i++) { const zz = -hz + i * (hz * 2 / 4); s.push(box(x - hx - 0.05, 2.6, zz - 0.1, x + hx + 0.05, H, zz + 0.1, FR, { paint: 1 })); }
    // reflective sky band + lit floors (night)
    s.push(box(x - hx - 0.05, 16, -hz - 0.05, x + hx + 0.05, 22, hz + 0.05, GLD, { paint: 1, stripes: { axis: 'y', p: 0.66, w: 0.22, col: FR } }));
    s.push(box(x - hx - 0.05, 9.2, -hz - 0.05, x + hx + 0.05, 9.7, hz + 0.05, '#ffe2a0', { paint: 1, glow: 1 }));
    s.push(box(x - hx - 0.05, 24.5, -hz - 0.05, x + hx + 0.05, 25.0, hz + 0.05, '#ffe2a0', { paint: 1, glow: 1 }));
    // lobby
    s.push(box(x - hx - 0.3, 0, -hz - 0.3, x + hx + 0.3, 2.6, hz + 0.3, 'ink', { stripes: { axis: 'x', p: 1.1, w: 0.22, col: 'mtD' }, jit: 0.02 }));
    s.push(box(x - hx - 0.4, 2.6, -hz - 0.4, x + hx + 0.4, 3.0, hz + 0.4, FR));
    // LED edge strips
    for (const [ex, ez] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) s.push(box(x + ex * hx - ex * 0.22, 3.0, ez * hz - ez * 0.22, x + ex * hx, H, ez * hz, 'nc', { paint: 1, glow: 2 }));
  }
  // escalator tubes crossing the atrium
  s.push(cyl([-2.2, 20.5, 1.2], [2.2, 24.0, 1.2], 0.5, '#bfe9f5', { glow: 1, stripes: { axis: 'x', p: 0.66, w: 0.22, col: FR } }));
  s.push(cyl([2.2, 22.0, -1.2], [-2.2, 25.5, -1.2], 0.5, '#bfe9f5', { glow: 1, stripes: { axis: 'x', p: 0.66, w: 0.22, col: FR } }));
  s.push(box(-2.2, 14.0, -0.6, 2.2, 14.6, 0.6, FR), box(-2.2, 14.6, -0.6, 2.2, 14.7, 0.6, 'nm', { glow: 1 }));
  // floating ring garden on top
  const Y = H, T = 1.8;
  s.push(box(-8.3, Y, -3.0, 8.3, Y + T, 3.0, FR, { jit: 0.02 }));
  s.push(vcyl(0, 0, Y - 0.2, Y + T, 6.6, FR, { jit: 0.02 }));
  s.push(vcyl(0, 0, Y - 0.6, Y + T + 0.6, 3.3, 'k', { sub: 1 }));
  s.push(vcyl(0, 0, Y - 0.25, Y + 0.1, 6.7, 'nc', { paint: 1, glow: 2 }));
  s.push(vcyl(0, 0, Y - 0.25, Y + T, 3.5, 'nm', { paint: 1, glow: 1 }));
  s.push(box(-8.4, Y + 0.6, -3.1, 8.4, Y + 1.2, 3.1, '#9fd0e6', { paint: 1, glow: 1 }));
  s.push(vcyl(0, 0, Y + 0.6, Y + 1.2, 6.7, '#9fd0e6', { paint: 1, glow: 1 }));
  s.push(vcyl(0, 0, Y + 0.6, Y + 1.2, 3.4, 'nm', { paint: 1, glow: 1 }));
  // garden deck: grass, trees, glass rail
  s.push(vcyl(0, 0, Y + T - 0.22, Y + T, 6.4, 'gr', { paint: 1, dither: { col: 'grD', amt: 0.3 } }));
  s.push(box(-8.1, Y + T - 0.22, -2.8, 8.1, Y + T, 2.8, 'gr', { paint: 1, dither: { col: 'grD', amt: 0.3 } }));
  s.push(vcyl(0, 0, Y + T - 0.3, Y + T + 0.4, 3.45, 'k', { sub: 1 }));
  const r = rng(29);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.2, d = 5.0, x = Math.cos(a) * d * 1.2, z = Math.sin(a) * d * 0.5;
    if (Math.abs(x) < 3.5 && Math.abs(z) < 3.5 && Math.hypot(x, z) < 3.6) continue;
    s.push(vcyl(x, z, Y + T, Y + T + 0.7, 0.12, 'bk'));
    s.push(sph([x, Y + T + 1.2, z], 0.6 + r() * 0.25, i % 3 ? 'lf' : 'sk', { noise: 0.1, noiseScale: 0.3, top: i % 3 ? 'lfL' : 'skL', jit: 0.05 }));
  }
  s.push(tor([0, Y + T + 0.35, 0], 3.55, 0.08, 'nc', { glow: 2 }));
  s.push(box(-8.3, Y + T, 2.9, 8.3, Y + T + 0.45, 3.0, '#bfe9f5', { glow: 1 }), box(-8.3, Y + T, -3.0, 8.3, Y + T + 0.45, -2.9, '#bfe9f5', { glow: 1 }));
  s.push(vcyl(6.2, 0, Y + T, Y + T + 2.2, 0.1, 'mt'), sph([6.2, Y + T + 2.3, 0], 0.15, 'nr', { glow: 3 }));
  prop('umeda_sky', vs, s, { footprint: [16.6, 6.0], solid: true, colliders: [[-5, 0, 6.4, 5.8], [5, 0, 6.4, 5.8]], light: { color: '#7ff0ff', intensity: 6, y: 29, range: 16, night: true }, tags: ['landmark', 'umeda', 'city', 'neon', 'osaka', 'light'] });
}

// ---- red Ferris wheel (~21 m; the wheel spins, gondolas counter-spin to stay level) -------------------------------
{
  const vs = 0.15, Hc = 11.6, Rw = 9.0, SPIN = 0.09;
  const s = [];
  // station platform + booth
  s.push(box(-5.2, 0, -3.0, 5.2, 0.6, 3.0, 'stL', { stripes: { axis: 'x', p: 0.9, w: 0.15, col: 'st' }, jit: 0.03 }));
  s.push(box(-1.6, 0, 3.0, 1.6, 0.3, 3.6, 'st'));
  s.push(box(2.8, 0.6, 1.0, 4.6, 2.9, 2.6, 'cr', { jit: 0.03 }), box(2.6, 2.9, 0.8, 4.8, 3.15, 2.8, 'rd', { jit: 0.03 }));
  s.push(box(3.0, 1.4, 2.55, 4.4, 2.4, 2.7, '#2a3a4a'), box(2.9, 2.5, 2.62, 4.5, 2.8, 2.72, 'nm', { glow: 2 }));
  // A-frame supports
  for (const sz of [1, -1]) {
    for (const sx of [1, -1]) s.push(cap([sx * 4.6, 0.6, sz * 2.0], [0, Hc, sz * 1.15], 0.32, 0.22, 'wh', { jit: 0.03 }));
    s.push(cyl([-2.9, 4.2, sz * 1.7], [2.9, 4.2, sz * 1.7], 0.16, 'wh'));
    s.push(cyl([-1.6, 7.8, sz * 1.45], [1.6, 7.8, sz * 1.45], 0.14, 'wh'));
  }
  s.push(cyl([0, Hc, -1.5], [0, Hc, 1.5], 0.4, 'mtK'));
  const parts = [{ n: 'body', p: [0, 0, 0], s }];
  // wheel
  const w = [];
  for (const z of [0.72, -0.72]) {
    w.push(tor([0, Hc, z], Rw, 0.22, 'rd', { axis: 'z', jit: 0.03 }));
    w.push(tor([0, Hc, z], Rw - 0.9, 0.13, 'rd', { axis: 'z', jit: 0.03 }));
  }
  const N = 16;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    for (const z of [0.72, -0.72]) w.push(cyl([ca * 0.8, Hc + sa * 0.8, z * 0.6], [ca * Rw, Hc + sa * Rw, z], 0.09, 'rdL'));
    w.push(cyl([ca * Rw, Hc + sa * Rw, -0.72], [ca * Rw, Hc + sa * Rw, 0.72], 0.12, 'rdD'));
  }
  for (const z of [0.9, -0.9]) w.push(tor([0, Hc, z], Rw + 0.05, 0.08, '#ff6a9a', { axis: 'z', glow: 1 }));
  for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; for (const z of [0.95, -0.95]) w.push(vox(vs, Math.cos(a) * Rw, Hc + Math.sin(a) * Rw, z, i % 2 ? 'ny' : 'nc', { glow: 2 })); }
  w.push(cyl([0, Hc, -0.95], [0, Hc, 0.95], 1.2, 'rd', { jit: 0.03 }), tor([0, Hc, 0.98], 1.0, 0.1, 'nc', { axis: 'z', glow: 2 }), tor([0, Hc, -0.98], 1.0, 0.1, 'nc', { axis: 'z', glow: 2 }));
  parts.push({ n: 'wheel', p: [0, Hc, 0], s: w, spin: { axis: 'z', speed: SPIN } });
  const cols = ['pp', 'pm', 'py', 'pb', 'pv', 'po', 'w', 'tlL'];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, px = Math.cos(a) * Rw, py = Hc + Math.sin(a) * Rw;
    const c = cols[i % cols.length];
    parts.push({ n: 'cab' + (i + 1), parent: 'wheel', p: [px, py, 0], spin: { axis: 'z', speed: -SPIN }, s: [
      cyl([px, py, 0], [px, py - 0.45, 0], 0.07, 'mtK'),
      ell([px, py - 1.05, 0], [0.62, 0.62, 0.42], c, { jit: 0.03 }),
      ell([px, py - 1.0, 0], [0.64, 0.24, 0.44], '#2a3a4a', { paint: 1 }),
      ell([px, py - 0.55, 0], [0.4, 0.14, 0.3], 'w'),
    ] });
  }
  prop('ferris_wheel', vs, parts, { footprint: [10.4, 6.0], solid: true, light: { color: '#ff8ad8', intensity: 5, y: 12, range: 14, night: true }, tags: ['landmark', 'umeda', 'amusement', 'neon', 'osaka', 'light'] });
}

// ---- Elemon League stadium (~30 m bowl with light towers) --------------------------------------------------------
{
  const vs = 0.25, s = [];
  const RO = 14.5, WT = 7.5;
  s.push(vcyl(0, 0, 0, WT, RO, 'cr', { jit: 0.03 }));
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; s.push(bx([Math.cos(a) * RO, WT / 2, Math.sin(a) * RO], [0.35, WT / 2 + 0.01, 0.35], 'crD', { rot: [0, -a * 57.3, 0], paint: 1 })); }
  s.push(vcyl(0, 0, 0, 1.0, RO + 0.05, 'tlD', { paint: 1 }), vcyl(0, 0, 0, 1.0, RO - 0.4, 'cr', { paint: 1 }));
  s.push(tor([0, 6.55, 0], RO, 0.26, 'nc', { paint: 1, glow: 2 }));
  s.push(tor([0, 2.75, 0], RO, 0.2, 'nm', { paint: 1, glow: 2 }));
  // stepped seating bowl
  const steps = 9;
  for (let i = 0; i <= steps; i++) s.push(vcyl(0, 0, 7.0 - i * 0.72, WT + 1, 13.6 - i * 0.78, 'k', { sub: 1 }));
  s.push(vcyl(0, 0, 0.5, 7.0, 13.65, 'tl', { paint: 1, stripes: { axis: 'y', p: 2.16, w: 0.72, col: 'nm' } }));
  s.push(vcyl(0, 0, 0.5, 7.0, 13.65, 'py', { paint: 1, stripes: { axis: 'y', p: 2.16, w: 0.72, col: 'tl', o: 0.72 } }));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; s.push(bx([Math.cos(a) * 10, 4, Math.sin(a) * 10], [3.8, 4, 0.3], 'whD', { rot: [0, -a * 57.3, 0], paint: 1 })); }
  // field
  const fr = 13.6 - steps * 0.78;
  s.push(vcyl(0, 0, 0.3, 0.6, fr + 0.1, 'gr', { paint: 1, stripes: { axis: 'x', p: 1.5, w: 0.75, col: 'grL' } }));
  s.push(tor([0, 0.5, 0], 2.6, 0.15, 'w', { paint: 1 }), box(-fr, 0.3, -0.12, fr, 0.6, 0.12, 'w', { paint: 1 }));
  s.push(tor([0, 0.5, 0], fr - 0.5, 0.15, 'w', { paint: 1 }));
  s.push(vcyl(0, 0, 0.3, 0.6, 1.0, 'nc', { paint: 1, glow: 1 }));
  // entrance gate + two-line LEAGUE sign on the outer wall
  s.push(box(-2.0, 0, 12.0, 2.0, 3.4, 15, 'k', { sub: 1 }));
  s.push(box(-2.0, 0, 12.0, 2.0, 3.4, 12.3, 'ink'));
  s.push(box(-2.4, 3.4, 13.9, 2.4, 3.7, 14.9, 'nc', { glow: 2 }));
  s.push(box(-3.6, 3.8, 13.6, 3.6, 7.3, 14.7, 'ink', { jit: 0.02 }));
  s.push(box(-3.7, 3.7, 14.6, 3.7, 7.4, 14.85, 'nm', { glow: 2 }), box(-3.45, 3.95, 14.5, 3.45, 7.15, 14.95, 'k', { sub: 1 }));
  s.push(...text('ELEMON', [0, 6.35, 14.6], 0.25, 0.1, 'ny', { glow: 2, snap: vs }));
  s.push(...text('LEAGUE', [0, 4.75, 14.6], 0.25, 0.1, 'nc', { glow: 2, snap: vs }));
  // grandstand roof over the back half
  for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; s.push(cyl([Math.cos(a) * 14.2, WT, Math.sin(a) * 14.2], [Math.cos(a) * 14.2, 9.2, Math.sin(a) * 14.2], 0.16, 'mtL')); }
  s.push(vcyl(0, 0, 9.2, 9.5, 15.3, 'wh', { jit: 0.02 }), vcyl(0, 0, 9.0, 9.7, 11.0, 'k', { sub: 1 }), box(-16, 9.0, 0.5, 16, 9.7, 16, 'k', { sub: 1 }));
  s.push(vcyl(0, 0, 9.0, 9.25, 11.15, 'nc', { paint: 1, glow: 2 }));
  // light towers
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i / 4) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), R = 16.2;
    s.push(box(ca * R - 0.3, 0, sa * R - 0.3, ca * R + 0.3, 15, sa * R + 0.3, 'mt', { stripes: { axis: 'y', p: 1.5, w: 0.25, col: 'mtD' }, jit: 0.03 }));
    s.push(bx([ca * (R - 0.4), 15.6, sa * (R - 0.4)], [1.6, 1.0, 0.25], 'mtK', { rot: [0, 90 - a * 57.3, 0] }));
    s.push(bx([ca * (R - 0.7), 15.6, sa * (R - 0.7)], [1.4, 0.8, 0.1], 'nw', { rot: [0, 90 - a * 57.3, 0], glow: 3, stripes: { axis: 'y', p: 0.5, w: 0.25, col: '#9fd8ff' } }));
  }
  prop('stadium', vs, s, { footprint: [29, 29], solid: true, light: { color: '#e8f6ff', intensity: 8, y: 15, range: 30, night: true }, tags: ['landmark', 'league', 'arena', 'neon', 'light'] });
}

// ---- traditional dojo (~10 m wide, irimoya roof) ------------------------------------------------------------------
{
  const vs = 0.12, s = [];
  const WD = 'wdK', HX = 4.4, HZ = 3.2, Y0 = 0.84, YT = 4.0;
  s.push(box(-5.4, 0, -4.2, 5.4, 0.6, 4.2, 'st', { dither: { col: 'stD', amt: 0.25 }, stripes: { axis: 'y', p: 0.3, w: 0.06, col: 'stK' }, jit: 0.05 }));
  for (let i = 0; i < 3; i++) s.push(box(-1.3 + i * 0.1, 0, 4.2, 1.3 - i * 0.1, 0.6 - i * 0.2, 4.55 + (2 - i) * 0.3, 'stW', { dither: { col: 'stD', amt: 0.2 } }));
  s.push(box(-5.0, 0.6, -3.8, 5.0, Y0, 3.8, 'wd', { stripes: { axis: 'x', p: 0.36, w: 0.06, col: 'wdD' }, jit: 0.05 }));
  // walls + timber frame
  s.push(box(-HX, Y0, -HZ, HX, YT, HZ, 'cr', { jit: 0.03 }));
  s.push(box(-HX - 0.01, Y0, -HZ - 0.01, HX + 0.01, 1.5, HZ + 0.01, 'wdD', { paint: 1, stripes: { axis: 'y', p: 0.24, w: 0.04, col: WD } }));
  for (const y of [[Y0, Y0 + 0.2], [3.1, 3.3], [3.8, YT]]) s.push(box(-HX - 0.08, y[0], -HZ - 0.08, HX + 0.08, y[1], HZ + 0.08, WD, { jit: 0.03 }));
  for (let i = 0; i <= 6; i++) { const x = -HX + i * (HX * 2 / 6); for (const sz of [1, -1]) s.push(box(x - 0.12, Y0, sz * HZ - 0.08, x + 0.12, YT, sz * HZ + 0.08, WD, { jit: 0.03 })); }
  for (let i = 0; i <= 4; i++) { const z = -HZ + i * (HZ * 2 / 4); for (const sx of [1, -1]) s.push(box(sx * HX - 0.08, Y0, z - 0.12, sx * HX + 0.08, YT, z + 0.12, WD, { jit: 0.03 })); }
  // shoji windows on the sides and back
  const SHO = { paint: 1, stripes: { axis: 'y', p: 0.24, w: 0.04, col: 'wdD' } };
  for (let i = 0; i < 4; i++) { const z = -HZ + (i + 0.5) * (HZ * 2 / 4); s.push(box(-HX - 0.02, 1.7, z - 0.5, HX + 0.02, 2.95, z + 0.5, '#f6eedb', SHO), box(-HX - 0.03, 1.7, z - 0.03, HX + 0.03, 2.95, z + 0.03, 'wdD', { paint: 1 })); }
  for (let i = 0; i < 6; i++) { if (i === 2 || i === 3) continue; const x = -HX + (i + 0.5) * (HX * 2 / 6); s.push(box(x - 0.48, 1.7, -HZ - 0.02, x + 0.48, 2.95, HZ + 0.02, '#f6eedb', SHO), box(x - 0.03, 1.7, -HZ - 0.03, x + 0.03, 2.95, HZ + 0.03, 'wdD', { paint: 1 })); }
  // entrance: lattice sliding doors, noren, plaque, lanterns
  s.push(box(-1.4, Y0, HZ - 0.02, 1.4, 3.05, HZ + 0.06, '#e8d8b0', { stripes: { axis: 'x', p: 0.24, w: 0.04, col: 'wdD' }, jit: 0.03 }));
  s.push(box(-0.02, Y0, HZ, 0.02, 3.05, HZ + 0.08, WD));
  s.push(box(-1.4, 2.25, HZ + 0.06, 1.4, 3.08, HZ + 0.12, '#2c3f78', { jit: 0.03 }));
  for (const x of [-0.7, 0.0, 0.7]) s.push(box(x - 0.03, 2.25, HZ + 0.05, x + 0.03, 2.8, HZ + 0.14, '#1f2d58'));
  s.push(cyl([-0.35, 2.62, HZ + 0.1], [-0.35, 2.62, HZ + 0.16], 0.2, 'w', { paint: 1 }), cyl([-0.35, 2.62, HZ + 0.1], [-0.35, 2.62, HZ + 0.16], 0.1, '#2c3f78', { paint: 1 }), cyl([0.35, 2.62, HZ + 0.1], [0.35, 2.62, HZ + 0.16], 0.2, 'w', { paint: 1 }), cyl([0.35, 2.62, HZ + 0.1], [0.35, 2.62, HZ + 0.16], 0.1, '#2c3f78', { paint: 1 }));
  s.push(box(-1.1, 3.3, HZ + 0.06, 1.1, 3.9, HZ + 0.2, 'wdL', { jit: 0.04 }), box(-1.0, 3.38, HZ + 0.18, 1.0, 3.82, HZ + 0.22, 'wd'));
  s.push(...text('DOJO', [0, 3.6, HZ + 0.24], 0.12, 0.04, 'ink', { snap: vs }, 1));
  for (const sx of [1.85, -1.85]) s.push(...chochin([sx, 3.35, HZ + 0.6], 0.2, 0.28, '#fff1d6', '#e2b98a', 2, '#d83a3c'), box(sx - 0.05, 3.62, HZ + 0.55, sx + 0.05, 4.02, HZ + 0.65, 'ink'));
  // irimoya roof: hipped skirt + gable
  const ROOF = { stripes: { axis: 'x', p: 0.36, w: 0.12, col: 'rfD' }, belly: 'crD', bellyT: 0.5, jit: 0.04 };
  const ROOFZ = { stripes: { axis: 'z', p: 0.36, w: 0.12, col: 'rfD' }, belly: 'crD', bellyT: 0.5, jit: 0.04 };
  const EX = 5.7, EZ = 4.5;
  let y = YT;
  for (let i = 0; i < 15; i++) { const ax = EX - i * 0.19, az = EZ - i * 0.19; s.push(box(-ax, y, -az, ax, y + 0.12, az, 'rf', i % 2 ? ROOF : ROOFZ)); y += 0.12; }
  for (const [cx, cz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) s.push(box(cx * EX - cx * 0.5, YT + 0.12, cz * EZ - cz * 0.5, cx * (EX + 0.15), YT + 0.36, cz * (EZ + 0.15), 'rf', { jit: 0.04 }));
  s.push(box(-EX - 0.1, YT, -EZ - 0.1, EX + 0.1, YT + 0.12, EZ + 0.1, 'rfL', { paint: 1 }), box(-EX + 0.15, YT, -EZ + 0.15, EX - 0.15, YT + 0.12, EZ - 0.15, 'rf', { paint: 1, ...ROOF }));
  const GX = 3.3, gz = EZ - 15 * 0.19 + 0.2, ridge = y + 1.5;
  s.push(poly([0, 0, 0], [[-gz - 0.25, y - 0.15], [gz + 0.25, y - 0.15], [0.2, ridge], [-0.2, ridge]], GX + 0.35, 'rf', { plane: 'zy', stripes: { axis: 'z', p: 0.36, w: 0.12, col: 'rfD' }, jit: 0.04 }));
  for (const sx of [1, -1]) {
    s.push(poly([sx * (GX + 0.2), 0, 0], [[-gz + 0.1, y - 0.1], [gz - 0.1, y - 0.1], [0, ridge - 0.25]], 0.14, 'cr', { plane: 'zy', jit: 0.03 }));
    s.push(poly([sx * (GX + 0.3), 0, 0], [[-gz + 0.5, y + 0.05], [gz - 0.5, y + 0.05], [0, ridge - 0.65]], 0.06, 'wdD', { plane: 'zy', stripes: { axis: 'z', p: 0.36, w: 0.12, col: 'cr' } }));
  }
  s.push(box(-GX - 0.4, ridge - 0.05, -0.28, GX + 0.4, ridge + 0.3, 0.28, 'rfD', { jit: 0.03 }));
  for (const sx of [1, -1]) s.push(box(sx * (GX + 0.25) - 0.25, ridge - 0.1, -0.3, sx * (GX + 0.25) + 0.25, ridge + 0.55, 0.3, 'rfL', { jit: 0.03 }));
  prop('dojo', vs, s, { footprint: [10.8, 8.4], solid: true, light: { color: '#ffd0a0', intensity: 2.5, y: 3, range: 6, night: true }, tags: ['dojo', 'building', 'landmark', 'training'] });
}

// ---- giant crab sign (Dotonbori style shopfront; claws and legs sway) ----------------------------------------------
{
  const vs = 0.1, s = [];
  const CR = '#e8452c', CRD = '#b8301e', CRL = '#ff7a52', BEL = '#f7b07a';
  // shopfront
  s.push(box(-4.0, 0, -1.6, 4.0, 3.2, -0.1, 'wdK', { jit: 0.03 }));
  s.push(box(-3.7, 0.3, -0.2, -0.9, 2.6, -0.05, '#ffd890', { glow: 1, stripes: { axis: 'x', p: 0.7, w: 0.1, col: 'wdK' } }));
  s.push(box(0.9, 0.3, -0.2, 3.7, 2.6, -0.05, '#ffd890', { glow: 1, stripes: { axis: 'x', p: 0.7, w: 0.1, col: 'wdK' } }));
  s.push(box(-0.8, 0, -0.3, 0.8, 2.6, 0.0, 'k', { sub: 1 }), box(-0.8, 0, -0.35, 0.8, 2.6, -0.3, 'ink'));
  for (let i = 0; i < 3; i++) s.push(box(-0.78 + i * 0.53, 1.8, -0.05, -0.28 + i * 0.53, 2.6, 0.02, 'rd', { jit: 0.03 }));
  s.push(box(-4.2, 2.6, -1.6, 4.2, 3.2, 0.5, 'wd', { jit: 0.03 }));
  // fascia wall with bulb border
  s.push(box(-4.0, 3.2, -1.6, 4.0, 7.8, -0.3, '#7a1f1a', { stripes: { axis: 'y', p: 0.4, w: 0.1, col: '#8a2a22' }, jit: 0.03 }));
  for (let i = 0; i <= 26; i++) { const x = -3.9 + i * 0.3; s.push(vox(vs, x, 7.6, -0.2, i % 2 ? 'ny' : 'no', { glow: 2 }), vox(vs, x, 3.4, -0.2, i % 2 ? 'no' : 'ny', { glow: 2 })); }
  for (let i = 0; i <= 13; i++) { const y = 3.4 + i * 0.3; s.push(vox(vs, -3.9, y, -0.2, i % 2 ? 'ny' : 'no', { glow: 2 }), vox(vs, 3.9, y, -0.2, i % 2 ? 'no' : 'ny', { glow: 2 })); }
  // crab body (+ uplights on the shop cornice)
  for (const x of [-2.5, 0, 2.5]) s.push(box(x - 0.2, 3.2, 0.2, x + 0.2, 3.35, 0.45, 'mtK'), box(x - 0.15, 3.35, 0.25, x + 0.15, 3.42, 0.4, 'nw', { glow: 3 }));
  s.push(box(-0.5, 5.0, -0.3, 0.5, 5.6, 0.4, 'mtK'));
  s.push(ell([0, 5.5, 0.9], [1.7, 0.72, 1.05], CR, { belly: BEL, bellyT: 0.35, spots: { col: CRL, d: 0.25, s: 0.25 }, jit: 0.04 }));
  for (const [x, z] of [[0.6, 1.2], [-0.6, 1.2], [0, 0.7], [1.0, 0.6], [-1.0, 0.6]]) s.push(sph([x, 6.1, z], 0.18, CRL, { jit: 0.03 }));
  s.push(ell([0, 5.15, 1.85], [0.6, 0.18, 0.12], CRD));
  for (const sx of [0.4, -0.4]) {
    s.push(cap([sx, 5.85, 1.55], [sx * 1.15, 6.55, 1.85], 0.1, 0.08, CR));
    s.push(sph([sx * 1.15, 6.7, 1.9], 0.2, 'w', { glow: 1 }), sph([sx * 1.15, 6.72, 2.06], 0.1, 'k'));
  }
  const parts = [{ n: 'body', p: [0, 0, 0], s }];
  // claws
  parts.push({ n: 'clawL', p: [1.4, 5.3, 1.5], mirror: true, sway: { axis: 'x', amp: 0.1, freq: 0.55 }, s: [
    cap([1.4, 5.3, 1.5], [2.35, 5.0, 2.2], 0.28, 0.22, CR, { jit: 0.04 }),
    cap([2.35, 5.0, 2.2], [2.55, 5.55, 2.9], 0.22, 0.3, CR, { jit: 0.04 }),
    ell([2.55, 5.85, 3.25], [0.45, 0.36, 0.62], CR, { belly: BEL, spots: { col: CRL, d: 0.25, s: 0.2 }, jit: 0.04 }),
    cap([2.5, 6.1, 3.6], [2.4, 6.15, 4.25], 0.2, 0.06, CRD, { jit: 0.04 }),
    cap([2.6, 5.65, 3.6], [2.55, 5.75, 4.15], 0.17, 0.05, CR, { jit: 0.04 }),
  ] });
  // legs (4 per side)
  [0.85, 0.35, -0.15, -0.6].forEach((z, i) => {
    const root = [1.45, 5.35, z + 0.9];
    parts.push({ n: 'legL' + (i + 1), p: root, mirror: true, sway: { axis: 'z', amp: 0.12, freq: 0.8, phase: i * 1.2 }, s: [
      cap(root, [2.9, 6.1, z + 0.75], 0.17, 0.14, CR, { jit: 0.04 }),
      cap([2.9, 6.1, z + 0.75], [3.55, 4.7, z + 0.85], 0.14, 0.05, CR, { tip: CRD, tipT: 0.7, jit: 0.04 }),
      sph([2.9, 6.1, z + 0.75], 0.15, CRL),
    ] });
  });
  prop('crab_sign', vs, parts, { footprint: [8.4, 2.2], solid: true, light: { color: '#ff7a4a', intensity: 4, y: 5, range: 9, night: true }, tags: ['landmark', 'dotonbori', 'shop', 'neon', 'osaka', 'light'] });
}

// ---- giant puffer-fish lantern (hangs from a post arm and sways) ---------------------------------------------------
{
  const vs = 0.08, s = [];
  s.push(box(-2.6, 0, -0.8, -1.8, 0.4, 0.0, 'st', { dither: { col: 'stD', amt: 0.25 } }));
  s.push(box(-2.35, 0.4, -0.55, -2.05, 6.6, -0.25, 'wdD', { jit: 0.04 }));
  s.push(box(-2.35, 6.3, -0.55, 0.2, 6.6, -0.25, 'wdD', { jit: 0.04 }));
  s.push(cap([-2.2, 5.2, -0.4], [-1.0, 6.35, -0.4], 0.08, 0.08, 'wdD'));
  s.push(box(-0.15, 6.15, -0.55, 0.15, 6.3, -0.25, 'mtK'));
  const C = [0, 4.1, 0];
  const f = [cyl([0, 6.15, -0.4], [0, 5.45, -0.1], 0.04, 'ink')];
  f.push(ell(C, [1.45, 1.32, 1.55], '#f6e6c4', { glow: 1, belly: 'w', bellyT: 0.2, stripes: { axis: 'y', p: 0.32, w: 0.08, col: '#dcc49a' }, jit: 0.03 }));
  f.push(ell([0, 4.6, -0.1], [1.42, 0.85, 1.5], '#a8835a', { paint: 1, spots: { col: '#6a4a32', d: 0.35, s: 0.28 } }));
  for (let i = 0; i < 46; i++) {
    const u = (i + 0.5) / 46, th = Math.acos(1 - u * 1.6), ph = i * 2.399;
    const d = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
    if (d[2] > 0.75 && d[1] < 0.5) continue;
    const p0 = [C[0] + d[0] * 1.35, C[1] + d[1] * 1.25, C[2] + d[2] * 1.45];
    f.push(cap(p0, [p0[0] + d[0] * 0.32, p0[1] + d[1] * 0.32, p0[2] + d[2] * 0.32], 0.08, 0.02, '#7a5a40'));
  }
  for (const sx of [0.72, -0.72]) { f.push(sph([sx, 4.65, 1.1], 0.34, 'w', { glow: 2 })); f.push(sph([sx * 1.05, 4.66, 1.36], 0.17, 'k')); }
  f.push(tor([0, 3.85, 1.48], 0.24, 0.11, '#ff7a7a', { axis: 'z', glow: 1 }), sph([0, 3.85, 1.52], 0.13, '#5a1a1a'));
  for (const sx of [1, -1]) f.push(poly([sx * 1.45, 4.0, 0.3], [[0, -0.3], [0.55, -0.55], [0.7, 0.0], [0.55, 0.5], [0, 0.3]], 0.05, '#f2c27a', { plane: 'zy', rot: [0, sx * 20, 0], glow: 1, stripes: { axis: 'y', p: 0.2, w: 0.06, col: '#d89a50' } }));
  f.push(poly([0, 4.1, -1.62], [[0, -0.2], [-0.75, -0.75], [-0.9, 0.0], [-0.75, 0.75], [0, 0.2]], 0.06, '#f2c27a', { plane: 'zy', glow: 1, stripes: { axis: 'y', p: 0.22, w: 0.06, col: '#d89a50' } }));
  f.push(poly([0, 5.35, -0.6], [[0.3, 0], [-0.4, 0], [-0.55, 0.45]], 0.05, '#f2c27a', { plane: 'zy', glow: 1 }));
  prop('fugu_lantern', vs, [
    { n: 'body', p: [0, 0, 0], s },
    { n: 'fugu', p: [0, 6.15, -0.4], s: f, sway: { axis: 'z', amp: 0.035, freq: 0.35 } },
  ], { footprint: [3.2, 3.2], solid: true, colliders: [[-2.2, -0.4, 0.8, 0.8]], light: { color: '#ffe0a0', intensity: 3.5, y: 4.1, range: 7, night: true }, tags: ['landmark', 'shinsekai', 'dotonbori', 'shop', 'osaka', 'light'] });
}

// ---- neon runner billboard (an Elemon breaking the finish tape) ------------------------------------------------------
{
  const vs = 0.12, s = [];
  // rooftop frame
  for (const x of [-3.6, -1.2, 1.2, 3.6]) { s.push(box(x - 0.12, 0, -0.75, x + 0.12, 2.2, -0.5, 'mtD')); s.push(cap([x, 0, 0.2], [x, 2.1, -0.55], 0.08, 0.08, 'mtD')); s.push(box(x - 0.2, 0, -0.95, x + 0.2, 0.15, 0.4, 'mtK')); }
  s.push(box(-4.5, 1.95, -0.6, 4.5, 2.2, 0.4, 'mtK'));
  // glowing panel (front layer) with rays, tape and the runner painted on it
  const Z0 = 0.06, Z1 = 0.18;
  s.push(box(-4.3, 2.3, Z0, 4.3, 10.3, Z1, '#1d2f8a', { glow: 1, jit: 0.02 }));
  const cx = 0.7, cy = 6.6;
  for (let i = 0; i < 14; i++) { const a = (i / 14) * 360; s.push(bx([cx + Math.cos(a * Math.PI / 180) * 3.2, cy + Math.sin(a * Math.PI / 180) * 3.2, 0.12], [3.0, 0.22, 0.2], '#3554c8', { rot: [0, 0, a], paint: 1, glow: 1 })); }
  s.push(box(-4.3, 5.35, Z0, 4.3, 5.55, Z1, 'nr', { paint: 1, glow: 2 }));
  const FG = { paint: 1, glow: 1 };
  const fig = [
    sph([cx + 0.25, cy + 2.0, 0.12], 0.75, '#dff4ff', FG),
    cap([cx - 0.2, cy + 2.5, 0.12], [cx - 0.55, cy + 3.3, 0.12], 0.26, 0.08, '#dff4ff', FG), cap([cx + 0.65, cy + 2.55, 0.12], [cx + 0.95, cy + 3.3, 0.12], 0.26, 0.08, '#dff4ff', FG),
    ell([cx, cy + 0.4, 0.12], [0.72, 1.15, 0.3], '#dff4ff', { ...FG, rot: [0, 0, 12] }),
    cap([cx - 0.5, cy + 1.0, 0.12], [cx - 1.5, cy + 2.5, 0.12], 0.3, 0.22, '#dff4ff', FG), cap([cx + 0.5, cy + 1.05, 0.12], [cx + 1.6, cy + 2.55, 0.12], 0.3, 0.22, '#dff4ff', FG),
    sph([cx - 1.55, cy + 2.6, 0.12], 0.28, '#dff4ff', FG), sph([cx + 1.65, cy + 2.65, 0.12], 0.28, '#dff4ff', FG),
    cap([cx - 0.2, cy - 0.6, 0.12], [cx - 1.2, cy - 1.0, 0.12], 0.32, 0.26, '#dff4ff', FG), cap([cx - 1.2, cy - 1.0, 0.12], [cx - 1.4, cy - 2.2, 0.12], 0.26, 0.2, '#dff4ff', FG),
    cap([cx + 0.3, cy - 0.7, 0.12], [cx + 1.2, cy - 1.5, 0.12], 0.32, 0.26, '#dff4ff', FG), cap([cx + 1.2, cy - 1.5, 0.12], [cx + 2.3, cy - 1.1, 0.12], 0.26, 0.2, '#dff4ff', FG),
    ...tube(bez([cx + 0.6, cy - 0.4, 0.12], [cx + 2.2, cy - 0.3, 0.12], [cx + 2.6, cy + 1.0, 0.12], 4), 0.25, 0.42, 'ny', FG),
    ell([cx + 0.1, cy + 0.3, 0.12], [0.4, 0.7, 0.3], 'nc', { paint: 1, glow: 2, rot: [0, 0, 12] }),
    sph([cx - 0.05, cy + 2.15, 0.12], 0.13, 'ink', FG), sph([cx + 0.55, cy + 2.15, 0.12], 0.13, 'ink', FG),
    ell([cx + 0.25, cy + 1.7, 0.12], [0.22, 0.1, 0.3], '#ff8ad0', FG),
  ];
  s.push(...fig);
  s.push(...text('ELEMON', [0, 3.25, 0.12], 0.24, 0.1, 'ny', { paint: 1, glow: 2, snap: vs }));
  // back structure (added after the paint so it stays unlit metal)
  s.push(box(-4.45, 2.15, -0.3, 4.45, 10.45, 0.0, 'mtK', { stripes: { axis: 'x', p: 1.2, w: 0.12, col: 'mtD' }, jit: 0.02 }));
  for (let i = 0; i <= 28; i++) { const x = -4.2 + i * 0.3; s.push(vox(vs, x, 10.2, 0.24, i % 2 ? 'ny' : 'nw', { glow: 2 }), vox(vs, x, 2.4, 0.24, i % 2 ? 'nw' : 'ny', { glow: 2 })); }
  for (let i = 0; i <= 26; i++) { const y = 2.4 + i * 0.3; s.push(vox(vs, -4.2, y, 0.24, i % 2 ? 'ny' : 'nw', { glow: 2 }), vox(vs, 4.2, y, 0.24, i % 2 ? 'nw' : 'ny', { glow: 2 })); }
  prop('runner_board', vs, s, { footprint: [9, 1.6], solid: true, light: { color: '#8fb0ff', intensity: 6, y: 6, range: 12, night: true }, tags: ['landmark', 'dotonbori', 'neon', 'osaka', 'light'] });
}

// ---- drummer mascot statue (original: striped tunic, cone hat, goggle-glasses; arms drum) ---------------------------
{
  const vs = 0.045, s = [];
  s.push(box(-0.55, 0, -0.45, 0.55, 0.6, 0.45, 'tl', { jit: 0.03 }), box(-0.58, 0.52, -0.48, 0.58, 0.6, 0.48, 'gd'), box(-0.58, 0, -0.48, 0.58, 0.08, 0.48, 'gd'));
  s.push(box(-0.32, 0.18, 0.44, 0.32, 0.42, 0.5, 'cr'), box(-0.24, 0.26, 0.48, 0.24, 0.34, 0.52, 'tlD'));
  for (const sx of [0.15, -0.15]) { s.push(cap([sx, 0.6, 0], [sx * 1.1, 0.98, 0], 0.11, 0.12, '#2c3f78')); s.push(ell([sx * 1.1, 0.66, 0.08], [0.11, 0.08, 0.17], 'rd')); }
  s.push(ell([0, 1.35, 0], [0.37, 0.47, 0.31], '#ffd84a', { stripes: { axis: 'x', p: 0.16, w: 0.07, col: '#2c3f78' }, jit: 0.03 }));
  s.push(tor([0, 1.78, 0], 0.2, 0.07, 'w', { jit: 0.03 }));
  s.push(cap([0.28, 1.72, 0.05], [-0.25, 1.3, 0.3], 0.03, 0.03, 'rdD'));
  s.push(cyl([0, 1.22, 0.24], [0, 1.22, 0.5], 0.3, 'rd', { jit: 0.03 }), cyl([0, 1.22, 0.49], [0, 1.22, 0.53], 0.27, '#f6ead2'));
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; s.push(vox(vs, Math.cos(a) * 0.29, 1.22 + Math.sin(a) * 0.29, 0.5, 'gd')); }
  s.push(sph([0, 2.12, 0], 0.34, '#ffe0c4', { jit: 0.03 }));
  for (const sx of [0.13, -0.13]) {
    s.push(tor([sx, 2.14, 0.3], 0.09, 0.028, 'ink', { axis: 'z' }), cyl([sx, 2.14, 0.28], [sx, 2.14, 0.32], 0.07, 'w'), vox(vs, sx, 2.14, 0.33, 'k'));
    s.push(box(sx - 0.08, 2.27, 0.25, sx + 0.08, 2.31, 0.32, 'ink'));
    s.push(ell([sx * 1.9, 2.02, 0.24], [0.06, 0.035, 0.03], '#ff9aa0', { paint: 1 }));
  }
  s.push(sph([0, 2.06, 0.34], 0.05, '#ffb8a0'), box(-0.09, 1.93, 0.28, 0.09, 1.95, 0.34, 'k'), box(-0.11, 1.95, 0.28, -0.09, 1.97, 0.34, 'k'), box(0.09, 1.95, 0.28, 0.11, 1.97, 0.34, 'k'));
  s.push(tor([0, 2.36, 0], 0.27, 0.06, 'w'));
  s.push(cap([0, 2.38, 0], [0.03, 3.05, -0.05], 0.27, 0.04, 'rd', { stripes: { axis: 'y', p: 0.16, w: 0.08, col: 'w' }, jit: 0.03 }));
  s.push(sph([0.04, 3.08, -0.05], 0.09, 'ny'));
  const arm = (sx, ph) => ({ n: sx > 0 ? 'armL' : 'armR', p: [sx * 0.36, 1.66, 0], sway: { axis: 'x', amp: 0.28, freq: 2.2, phase: ph }, s: [
    cap([sx * 0.36, 1.66, 0], [sx * 0.42, 1.42, 0.38], 0.1, 0.09, '#ffd84a', { stripes: { axis: 'y', p: 0.12, w: 0.05, col: '#2c3f78' } }),
    sph([sx * 0.42, 1.42, 0.42], 0.08, 'w'),
    cap([sx * 0.42, 1.42, 0.45], [sx * 0.12, 1.36, 0.6], 0.025, 0.02, 'wdL'), sph([sx * 0.12, 1.36, 0.6], 0.035, 'rd'),
  ] });
  prop('drummer_statue', vs, [{ n: 'body', p: [0, 0, 0], s }, arm(1, 0), arm(-1, Math.PI)],
    { footprint: [1.2, 1.0], solid: true, tags: ['landmark', 'dotonbori', 'mascot', 'osaka'] });
}

// ---- lucky god statue (original: pointy-headed, fox-eared, soles out) ------------------------------------------------
{
  const vs = 0.04, s = [];
  const G = { top: 'gdL', topT: 0.6, belly: 'gdD', bellyT: 0.4, jit: 0.04 };
  s.push(prism(8, 0, 0, 0, 0.42, 0.62, 'st', { dither: { col: 'stD', amt: 0.2 }, jit: 0.05 }), prism(8, 0, 0, 0.42, 0.5, 0.66, 'vm'));
  s.push(box(-0.3, 0, 0.78, 0.3, 0.24, 1.04, 'wd', { jit: 0.04 }), box(-0.26, 0.2, 0.82, 0.26, 0.26, 1.0, 'wdK', { stripes: { axis: 'z', p: 0.08, w: 0.04, col: 'wd' } }));
  s.push(ell([0, 0.94, -0.02], [0.36, 0.42, 0.32], 'gd', G));
  s.push(ell([0, 0.84, 0.12], [0.3, 0.3, 0.22], 'gd', G));
  for (const sx of [0.16, -0.16]) {
    s.push(cap([sx, 0.64, 0.05], [sx * 1.05, 0.62, 0.42], 0.13, 0.11, 'gd', G));
    s.push(ell([sx * 1.05, 0.66, 0.52], [0.1, 0.14, 0.07], 'gdL', { jit: 0.03 }));
    s.push(ell([sx * 1.05, 0.66, 0.57], [0.08, 0.11, 0.03], '#fff2b0', { paint: 1 }));
    s.push(cap([sx * 1.9, 1.15, 0.0], [sx * 1.5, 0.82, 0.3], 0.09, 0.08, 'gd', G), sph([sx * 1.45, 0.78, 0.36], 0.08, 'gd', G));
  }
  s.push(ell([0, 1.55, 0.0], [0.29, 0.3, 0.27], 'gd', G));
  s.push(cap([0, 1.72, -0.02], [0.02, 2.12, -0.06], 0.22, 0.02, 'gd', G));
  for (const sx of [0.17, -0.17]) s.push(cap([sx, 1.72, -0.02], [sx * 1.6, 2.0, -0.04], 0.1, 0.03, 'gd', G));
  for (const sx of [0.13, -0.13]) {
    s.push(box(sx - 0.03, 1.62, 0.22, sx + 0.03, 1.64, 0.3, 'ink'), box(sx - 0.07, 1.58, 0.22, sx - 0.03, 1.61, 0.29, 'ink'), box(sx + 0.03, 1.58, 0.22, sx + 0.07, 1.61, 0.29, 'ink'));
    s.push(box(sx - 0.06, 1.7, 0.21, sx + 0.06, 1.72, 0.27, 'gdD'));
    s.push(ell([sx * 1.35, 1.5, 0.2], [0.05, 0.03, 0.05], '#ff9a6a', { paint: 1 }));
  }
  s.push(box(-0.12, 1.42, 0.22, 0.12, 1.48, 0.29, 'ink'), box(-0.1, 1.45, 0.25, 0.1, 1.48, 0.3, 'w'), box(-0.15, 1.47, 0.22, -0.12, 1.51, 0.28, 'ink'), box(0.12, 1.47, 0.22, 0.15, 1.51, 0.28, 'ink'));
  s.push(sph([0, 1.76, 0.24], 0.045, '#5dffb0', { glow: 2 }));
  s.push(...tube(bez([0, 0.7, -0.3], [0.45, 0.65, -0.45], [0.42, 1.1, -0.35], 4), 0.1, 0.06, 'gd', { tip: 'w', tipT: 0.75 }));
  prop('lucky_statue', vs, s, { footprint: [1.35, 2.1], solid: true, tags: ['landmark', 'shinsekai', 'mascot', 'osaka', 'shrine'] });
}

// ---- Elemon League HQ sign --------------------------------------------------------------------------------------------
{
  const vs = 0.1, s = [];
  s.push(box(-4.6, 0, -0.9, 4.6, 0.6, 0.9, 'wh', { stripes: { axis: 'y', p: 0.3, w: 0.1, col: 'whD' }, jit: 0.03 }));
  s.push(box(-4.65, 0.55, 0.85, 4.65, 0.62, 0.95, 'nc', { glow: 2 }));
  for (const sx of [1, -1]) {
    s.push(box(sx * 4.0 - 0.45, 0.6, -0.45, sx * 4.0 + 0.45, 5.4, 0.45, 'wh', { jit: 0.03 }));
    s.push(box(sx * 4.0 - 0.47, 0.6, -0.47, sx * 4.0 + 0.47, 5.4, 0.47, 'tl', { paint: 1, stripes: { axis: 'y', p: 0.9, w: 0.2, col: 'wh' } }));
    s.push(box(sx * 4.0 - 0.5, 5.4, -0.5, sx * 4.0 + 0.5, 5.7, 0.5, 'nc', { glow: 2 }));
    s.push(box(sx * 4.0 - 0.3, 5.7, -0.3, sx * 4.0 + 0.3, 5.9, 0.3, 'wh'));
  }
  s.push(box(-3.6, 1.4, -0.3, 3.6, 3.6, 0.25, '#1f2d58', { jit: 0.02 }));
  s.push(box(-3.65, 1.35, 0.2, 3.65, 3.65, 0.3, 'gd'), box(-3.5, 1.5, 0.15, 3.5, 3.5, 0.35, 'k', { sub: 1 }));
  s.push(...text('ELEMON LEAGUE', [0, 2.9, 0.25], 0.1, 0.05, 'ny', { glow: 2, snap: vs }));
  s.push(...text('HQ', [0, 2.05, 0.25], 0.1, 0.05, 'nc', { glow: 2, snap: vs }));
  // crest
  s.push(box(-0.5, 3.6, -0.2, 0.5, 4.0, 0.2, 'wh'));
  s.push(cyl([0, 4.9, -0.12], [0, 4.9, 0.12], 0.95, '#1f2d58'));
  s.push(tor([0, 4.9, 0], 0.95, 0.12, 'gd', { axis: 'z' }), tor([0, 4.9, 0.12], 0.78, 0.05, 'nc', { axis: 'z', glow: 2 }));
  const star = Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 0.25 : 0.62; return [Math.cos(a) * r, Math.sin(a) * r]; });
  s.push(poly([0, 4.88, 0.14], star, 0.05, 'ny', { glow: 2 }));
  prop('league_hq_sign', vs, s, { footprint: [9.2, 1.8], solid: true, light: { color: '#ffe45c', intensity: 3, y: 3, range: 7, night: true }, tags: ['landmark', 'league', 'neon', 'light'] });
}

export const DESIGNS = D;
export const PROP_META = M;
