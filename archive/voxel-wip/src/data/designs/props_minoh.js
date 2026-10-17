// Props for the Minoh Safari Reserve trails (waterfall, bamboo grove, maple
// ridge). See docs/SCENES.md, docs/MODELING.md and docs/refs/environments.md §8.
// Voxel prop DSL (arch 'static'); props stand on y = 0 centred on x = z = 0,
// front = +z (the camera side of a side-scroll stage set), 1 unit = 1 m.
// Ids are prefixed `mn_` so they never clash with the other prop modules.
//
// Palette (environments.md §8, art_direction.md §6 "Forest safari: Minoh"):
// waterfall = white + cool blue-green, bamboo = green verticals, maple ridge =
// scarlet / orange / gold. Forest shadows go teal, bark is purple-brown.
import { PROP_PAL } from './props.js';

const D = {}, M = {};
const P = Object.assign({}, PROP_PAL, {
  // falls / stream
  fw: '#e8fbff', fwL: '#ffffff', fwB: '#a6e6ff', fwC: '#8ff8e2', fwT: '#30e1b9', fwD: '#0b8a8f',
  // gorge rock (dark, wet) + moss
  rk: '#5a5450', rkD: '#3e3a3a', rkL: '#77706a', rkK: '#2e2a2e', rkW: '#4a4448',
  mo: '#7fa64e', moD: '#5a8239', moL: '#a2a947', moT: '#547e64', moK: '#374e4a',
  // cedar (sugi) + dark foreground bark
  cb: '#7a4a3a', cbD: '#5a3428', cd: '#2f5240', cdD: '#264638', cdL: '#4f7a58', cdK: '#173634',
  tk: '#3a2e34', tkD: '#2a2228', tkM: '#3e5a34',
  // bamboo (moso culms, sasa)
  bm: '#7fae4e', bmL: '#9cc25e', bmN: '#d8e8c0', bmR: '#4f7a34', bmO: '#a8a85a', bmOD: '#7f7f3c',
  bmH: '#a9c29a', bmHN: '#dfe9d6', bmHR: '#8aa47c', bmF: '#4f7a3a', bmFN: '#a8c08a',
  bl: '#4f8a36', blD: '#3a6e2c', blL: '#8cc45a',
  ssK: '#123f36', ssD: '#1a5a44', ss: '#239063', ssM: '#1e7a52', ssL: '#91db69', ssW: '#e8eec0', ssS: '#4f7a3a',
  // susuki (pampas / silver grass)
  su: '#9aab4a', suD: '#6f8a3a', suY: '#c8b45a', suT: '#e6d48a', suK: '#3f5a2a', suS: '#b8a868',
  pl: '#efe6d0', plW: '#fffaf0', plG: '#d8c290',
  // ferns
  fn: '#3f8f4a', fnD: '#2a6a3e', fnL: '#7fc25a', fnS: '#4a7a36', fnK: '#1f4a34',
  // momiji (three colour groups) + bark
  mb: '#694f62', mbD: '#4c3a48', mbL: '#86687a',
  mS: '#d8333a', mSL: '#f05a3a', mSD: '#7a1f2a', mSs: '#b02a34',
  mO: '#ec7a2e', mOL: '#f7a043', mOD: '#a8402a', mOs: '#d8602a',
  mG: '#f2b83a', mGL: '#ffd860', mGD: '#b8782a', mGs: '#e09a2a',
  lc: '#b8432e', lcL: '#d8752e',
  // lemons
  lm: '#f7e04a', lmL: '#fff08a', lmD: '#d8b830', lg: '#2f6a3a', lgL: '#5a9a44', lgD: '#1d4a34',
  // macaques
  mq: '#8a7b6b', mqD: '#6a5b4e', mqL: '#a8998a', mqF: '#e07a7a', mqFD: '#c05a62',
  // wood / timber / fences
  tm: '#a8744a', tmD: '#7c5333', tmL: '#c99a68', tmK: '#5a3b25', cab: '#6a4a34', cabD: '#4a3222',
  bw: '#6a5146', bwD: '#4b3932', bwL: '#8a6a4a', bwT: '#a89a58',
  kraft: '#c8a070', kraftD: '#a88050', fry: '#e8a838', fryL: '#f6cf62', fryR: '#d8603a', oil: '#f0b848',
});

// ---------------------------------------------------------------- helpers (same DSL as props.js)
const E = 1e-3;
const cl = (o) => (o ? { ...o } : {});
const box = (x0, y0, z0, x1, y1, z1, c, o) => ['box', [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [Math.abs(x1 - x0) / 2 + E, Math.abs(y1 - y0) / 2 + E, Math.abs(z1 - z0) / 2 + E], c, cl(o)];
const bx = (c, h, col, o) => ['box', c, h, col, cl(o)];
const cyl = (a, b, r, c, o) => ['cyl', a, b, r, c, cl(o)];
const vcyl = (x, z, y0, y1, r, c, o) => ['cyl', [x, y0, z], [x, y1, z], r, c, cl(o)];
const cap = (a, b, r0, r1, c, o) => ['cap', a, b, r0, r1, c, cl(o)];
const sph = (c, r, col, o) => ['sph', c, r, col, cl(o)];
const ell = (c, r, col, o) => ['ell', c, r, col, cl(o)];
const tor = (c, R, r, col, o) => ['tor', c, R, r, col, cl(o)];
const poly = (c, pts, h, col, o) => ['poly', c, pts, h, col, cl(o)];
const vox = (vs, x, y, z, c, o) => { const s = (v) => Math.round(v / vs) * vs; return ['box', [s(x), s(y), s(z)], [vs * 0.45, vs * 0.45, vs * 0.45], c, cl(o)]; };
function tube(pts, r0, r1, col, o) {
  const out = [], n = pts.length - 1;
  for (let i = 0; i < n; i++) out.push(cap(pts[i], pts[i + 1], r0 + (r1 - r0) * (i / n), r0 + (r1 - r0) * ((i + 1) / n), col, o));
  return out;
}
function bez(a, b, c, n = 6) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([0, 1, 2].map((k) => u * u * a[k] + 2 * u * t * b[k] + t * t * c[k])); }
  return out;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// pixel bitmap (rows of chars) → run-length boxes on the xy plane (faces ±z); o = top-left pixel centre
function bitmap(rows, o, px, d, cmap, opts) {
  const out = [];
  rows.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      const ch = row[c];
      if (!cmap[ch]) { c++; continue; }
      let e = c; while (e + 1 < row.length && row[e + 1] === ch) e++;
      const y = o[1] - r * px, u0 = c * px, u1 = e * px;
      out.push(bx([o[0] + (u0 + u1) / 2, y, o[2]], [(u1 - u0) / 2 + px * 0.5 - E, px * 0.5 - E, d], cmap[ch], Object.assign({ jit: 0.02 }, opts)));
      c = e + 1;
    }
  });
  return out;
}
const FONT = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], E: ['###', '#..', '##.', '#..', '###'], G: ['.##', '#..', '#.#', '#.#', '.##'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'], R: ['##.', '#.#', '##.', '#.#', '#.#'], ' ': ['.', '.', '.', '.', '.'],
};
function text(str, c, px, d, col, opts) {
  const rows = ['', '', '', '', ''];
  [...str].forEach((ch, i) => { const g = FONT[ch] || FONT[' ']; for (let r = 0; r < 5; r++) rows[r] += (i ? '.' : '') + g[r]; });
  const w = rows[0].length;
  return bitmap(rows.map((r) => r.replace(/#/g, 'a')), [c[0] - ((w - 1) * px) / 2, c[1] + 2 * px, c[2]], px, d, { a: col }, opts);
}
const MAPLE_LEAF = ['....#....', '.#..#..#.', '.##.#.##.', '..#####..', '#########', '.#######.', '...###...', '....#....', '....#....'];
// paper lantern (chōchin), vertical axis, centred at c
function chochin(c, r, h, paper, rib, glow = 2, mark = null) {
  const [x, y, z] = c, out = [];
  out.push(ell(c, [r, h, r], paper, { glow, stripes: { axis: 'y', p: h * 0.36, w: h * 0.08, col: rib, o: y }, jit: 0.03 }));
  if (mark) out.push(ell([x, y, z + r * 0.6], [r * 0.45, h * 0.35, r * 0.5], mark, { paint: 1, glow }));
  out.push(vcyl(x, z, y - h - 0.02, y - h * 0.8, r * 0.62, 'ink', { jit: 0.02 }));
  out.push(vcyl(x, z, y + h * 0.8, y + h + 0.02, r * 0.55, 'ink', { jit: 0.02 }));
  return out;
}

// cut: drop cells below y = cut (never visible; they cost faces). back: carve
// away everything behind z = back (scenery only ever seen from the front).
function prop(id, vs, parts, meta, extra = {}) {
  const isParts = Array.isArray(parts) && parts.length && !Array.isArray(parts[0]) && parts[0].n;
  const list = isParts ? parts : [{ n: 'body', p: [0, 0, 0], s: parts }];
  const cut = extra.cut ?? 0, back = extra.back;
  for (const pt of list) {
    if (cut !== false) pt.s.push(['box', [0, cut - 50 - vs * 0.5, 0], [1000, 50, 1000], 'k', { sub: 1 }]);
    if (back != null) pt.s.push(['box', [0, 0, back - 50 - vs * 0.5], [1000, 1000, 50], 'k', { sub: 1 }]);
  }
  const ex = Object.assign({}, extra); delete ex.cut; delete ex.back;
  D[id] = Object.assign({ id: 'prop_' + id, vs, arch: 'static', anim: { bounce: 0 }, pal: P, parts: list }, ex);
  M[id] = Object.assign({ footprint: [1, 1], solid: true, destructible: false, hp: 0, debris: [], light: null, tags: ['minoh'] }, meta);
}
const TREE = (w, tags, extra = {}) => Object.assign({ footprint: [w, w], solid: true, round: true, destructible: false, hp: 0, debris: [], light: null, tags: ['minoh', 'tree', ...tags] }, extra);

// =====================================================================
// COVER: the sneaking grass (dark, distinct clumps that sway)
// =====================================================================

// ---- sasa: kumazasa dwarf bamboo, dark glossy leaves with pale autumn margins
{
  const vs = 0.045, r = rng(41);
  const core = [], leaves = [];
  core.push(ell([0, 0.03, 0], [0.66, 0.06, 0.52], 'ssK'));
  core.push(ell([0, 0.4, -0.02], [0.52, 0.38, 0.4], 'ssD', { noise: 0.07, noiseScale: 0.13, top: 'ssM', topT: 0.6, dither: { col: 'ssK', amt: 0.3 }, jit: 0.05 }));
  const tops = [];
  for (let i = 0; i < 12; i++) {
    const a = i * 2.39 + r() * 0.4, d = 0.08 + Math.sqrt(r()) * 0.44;
    const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.8;
    const h = 0.66 + r() * 0.36 - d * 0.22;
    const tx = x * 1.25, tz = z * 1.25;
    core.push(cap([x, 0.02, z], [tx, h, tz], 0.024, 0.02, 'ssS'));
    tops.push([tx, h, tz, a]);
  }
  for (const [x, y, z, a0] of tops) {
    const n = 4 + Math.floor(r() * 2);
    for (let k = 0; k < n; k++) {
      const a = a0 + (k - (n - 1) / 2) * 0.95 + r() * 0.3;
      const L = 0.26 + r() * 0.1, droop = -0.05 - r() * 0.14;
      const ex = x + Math.cos(a) * L, ez = z + Math.sin(a) * L * 0.85, ey = y + droop + (k % 2) * 0.05;
      const pale = r() < 0.3;
      leaves.push(cap([x, y, z], [ex, ey, ez], 0.046, 0.014, pale ? 'ss' : (k % 2 ? 'ssM' : 'ss'), { tip: pale ? 'ssW' : 'ssL', tipT: pale ? 0.62 : 0.8, jit: 0.05 }));
    }
  }
  prop('mn_sasa', vs, [
    { n: 'body', p: [0, 0, 0], s: core },
    { n: 'leaves', p: [0, 0, 0], s: leaves, sway: { axis: 'x', amp: 0.045, freq: 0.6 } },
  ], { footprint: [1.3, 1.1], solid: false, tags: ['minoh', 'nature', 'grass', 'stealth', 'bamboo'] });
}

// ---- susuki: Japanese silver grass with drooping silver-gold plumes
{
  const vs = 0.045, r = rng(57);
  const base = [], blades = [], plumes = [];
  base.push(ell([0, 0.03, 0], [0.5, 0.06, 0.42], 'suK'));
  base.push(ell([0, 0.32, 0], [0.34, 0.32, 0.28], 'suD', { noise: 0.05, noiseScale: 0.1, dither: { col: 'suK', amt: 0.3 }, jit: 0.05 }));
  for (let i = 0; i < 24; i++) {
    const a = i * 2.39 + r() * 0.5, d = 0.05 + r() * 0.2;
    const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.8;
    const h = 0.8 + r() * 0.5, out = 0.35 + r() * 0.42;
    const col = ['su', 'suD', 'suY', 'su'][i % 4];
    blades.push(...tube(bez([x, 0.05, z], [x * 1.4, h * 0.85, z * 1.4], [x + Math.cos(a) * out, h * (0.62 + r() * 0.2), z + Math.sin(a) * out * 0.8], 3), 0.034, 0.012, col, { tip: 'suT', tipT: 0.72, jit: 0.05 }));
  }
  for (let i = 0; i < 9; i++) {
    const a = i * 0.72 + r() * 0.5, d = 0.06 + r() * 0.14;
    const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.7;
    const h = 1.3 + r() * 0.45, lean = 0.1 + r() * 0.2;
    const tx = x + Math.cos(a) * lean, tz = z + Math.sin(a) * lean * 0.7;
    plumes.push(cap([x, 0.1, z], [tx, h, tz], 0.02, 0.017, 'suS'));
    const da = a + 0.5;
    plumes.push(...tube(bez([tx, h - 0.04, tz], [tx + Math.cos(da) * 0.14, h + 0.14, tz + Math.sin(da) * 0.1], [tx + Math.cos(da) * 0.34, h - 0.02, tz + Math.sin(da) * 0.24], 3), 0.06, 0.03, 'pl', { dither: { col: 'plW', amt: 0.35 }, tip: 'plG', tipT: 0.8, jit: 0.04 }));
    plumes.push(...tube(bez([tx, h - 0.16, tz], [tx + Math.cos(da - 0.9) * 0.14, h - 0.06, tz], [tx + Math.cos(da - 0.9) * 0.28, h - 0.22, tz + Math.sin(da - 0.9) * 0.2], 2), 0.045, 0.024, 'plG', { dither: { col: 'pl', amt: 0.4 }, jit: 0.04 }));
  }
  prop('mn_susuki', vs, [
    { n: 'body', p: [0, 0, 0], s: base },
    { n: 'blades', p: [0, 0, 0], s: blades, sway: { axis: 'x', amp: 0.04, freq: 0.5 } },
    { n: 'plumes', p: [0, 0, 0], s: plumes, sway: { axis: 'z', amp: 0.045, freq: 0.42 } },
  ], { footprint: [1.3, 1.1], solid: false, tags: ['minoh', 'nature', 'grass', 'stealth', 'autumn'] });
}

// ---- fern cluster
{
  const vs = 0.04, r = rng(63), base = [], fr = [];
  base.push(ell([0, 0.03, 0], [0.32, 0.06, 0.26], 'fnK'));
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9 + r() * 0.3, L = 0.46 + r() * 0.2, up = 0.36 + r() * 0.2;
    const pts = bez([0, 0.05, 0], [Math.cos(a) * L * 0.35, up, Math.sin(a) * L * 0.3], [Math.cos(a) * L, up * 0.45, Math.sin(a) * L * 0.8], 6);
    fr.push(...tube(pts, 0.022, 0.014, 'fnS'));
    for (let k = 1; k < pts.length; k++) {
      const [x, y, z] = pts[k], w = 0.13 * (1 - k / (pts.length + 1)) + 0.035;
      for (const sd of [-1, 1]) { const b = a + sd * 1.35; fr.push(cap([x, y, z], [x + Math.cos(b) * w, y - 0.035, z + Math.sin(b) * w * 0.8], 0.028, 0.014, k % 2 ? 'fn' : 'fnD', { tip: 'fnL', tipT: 0.6, jit: 0.05 })); }
    }
  }
  prop('mn_fern', vs, [{ n: 'body', p: [0, 0, 0], s: base }, { n: 'fronds', p: [0, 0, 0], s: fr, sway: { axis: 'z', amp: 0.05, freq: 0.55 } }],
    { footprint: [0.8, 0.7], solid: false, tags: ['minoh', 'nature', 'forest'] });
}

// =====================================================================
// TREES
// =====================================================================

// ---- sugi (Japanese cedar): straight fibrous trunk, drooping tiers of dark
// needles with teal shadows. Scenery tree, back half carved away.
{
  const vs = 0.16, r = rng(71), H = 12.5;
  const body = [], crown = [];
  body.push(cap([0, 0, 0], [0.05, H - 0.8, 0.02], 0.36, 0.08, 'cb', { stripes: { axis: 'x', p: 0.3, w: 0.1, col: 'cbD' }, jit: 0.05 }));
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.5; body.push(cap([0, 0.7, 0], [Math.cos(a) * 0.75, 0.02, Math.sin(a) * 0.75], 0.22, 0.08, 'cb', { dither: { col: 'cbD', amt: 0.3 } })); }
  const T = 8;
  for (let t = 0; t < T; t++) {
    const u = t / (T - 1), y = 3.6 + u * (H - 3.8), R = 2.0 * (1 - u) + 0.4;
    const O = { noise: 0.18, noiseScale: 0.45, top: 'cdL', topT: 0.55, belly: 'cdK', bellyT: 0.15, dither: { col: 'cdD', amt: 0.18 }, jit: 0.05 };
    crown.push(ell([0, y, 0], [R, 0.62 + 0.12 * (1 - u), R * 0.8], 'cd', O));
    const n = 4 + Math.floor(R * 2);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * 6.283 + r() * 0.6;
      crown.push(ell([Math.cos(a) * R * 0.92, y - 0.3, Math.sin(a) * R * 0.7], [0.32 + R * 0.12, 0.36, 0.4], k % 3 ? 'cd' : 'cdD', Object.assign({}, O, { noise: 0.1, noiseScale: 0.3 })));
    }
  }
  crown.push(cap([0, H - 1.2, 0], [0, H + 0.5, 0], 0.36, 0.06, 'cd', { top: 'cdL', dither: { col: 'cdD', amt: 0.2 } }));
  prop('mn_cedar', vs, [
    { n: 'body', p: [0, 0, 0], s: body },
    { n: 'crown', p: [0, 3.5, 0], s: crown, sway: { axis: 'z', amp: 0.006, freq: 0.25 } },
  ], TREE(0.8, ['forest', 'cedar']), { back: -0.5 });
}

// ---- dark foreground trunk (Muramasa-style frame; its crown is above the frame)
{
  const vs = 0.1, s = [];
  s.push(cap([0, 0, 0], [0.18, 15, 0.05], 0.44, 0.3, 'tk', { stripes: { axis: 'x', p: 0.3, w: 0.1, col: 'tkD' }, jit: 0.05 }));
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.3; s.push(cap([0, 0.8, 0], [Math.cos(a) * 0.9, 0.02, Math.sin(a) * 0.8], 0.28, 0.1, 'tk', { dither: { col: 'tkD', amt: 0.3 } })); }
  s.push(cap([0.1, 6.2, 0], [1.4, 7.4, 0.2], 0.14, 0.06, 'tk'), cap([0.12, 9.5, 0], [-1.3, 10.6, 0.1], 0.13, 0.05, 'tk'));
  s.push(cap([0, 0.2, 0.3], [0.1, 3.6, 0.32], 0.2, 0.12, 'tkM', { paint: 1, dither: { col: 'moK', amt: 0.4 } }));
  prop('mn_trunk', vs, s, TREE(0.9, ['forest', 'frame']), { back: -0.2 });
}

// ---- big momiji: wide layered clouds of leaves in one of three colour groups
function bigMaple(seed, C) {
  const vs = 0.1, r = rng(seed);
  const body = [], crown = [];
  const BO = { dither: { col: 'mbD', amt: 0.28 }, jit: 0.05 };
  const fork = [0.25, 2.3, 0];
  body.push(...tube(bez([0, 0, 0], [0.05, 1.3, 0], fork, 3), 0.34, 0.22, 'mb', BO));
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.4; body.push(cap([0, 0.5, 0], [Math.cos(a) * 0.7, 0.02, Math.sin(a) * 0.6], 0.2, 0.07, 'mb', BO)); }
  const limbs = [[-2.5, 3.9, 0.3], [2.7, 4.2, -0.2], [0.4, 5.6, 0], [-1.3, 5.1, -0.6], [1.5, 5.0, 0.7], [-0.4, 4.2, 1.0]];
  for (const l of limbs) body.push(...tube(bez(fork, [(fork[0] + l[0]) * 0.5, l[1] * 0.72, l[2] * 0.5], l, 4), 0.17, 0.06, 'mb', BO));
  body.push(ell([0.15, 0.45, 0.25], [0.3, 0.35, 0.2], 'moT', { paint: 1, dither: { col: 'mbD', amt: 0.4 } }));
  const blobs = [
    [-2.6, 4.0, 0.2, 1.5, 0.7, 1.2], [2.8, 4.3, -0.1, 1.6, 0.72, 1.2], [0.2, 4.6, 0.6, 1.9, 0.8, 1.3],
    [-1.3, 5.3, -0.4, 1.6, 0.75, 1.2], [1.4, 5.5, 0.3, 1.5, 0.7, 1.1], [0.2, 6.25, -0.1, 1.3, 0.62, 1.0],
    [-3.5, 3.4, 0.5, 0.9, 0.45, 0.8], [3.6, 3.6, 0.4, 0.9, 0.45, 0.8], [0.0, 3.7, 1.2, 1.2, 0.5, 0.7],
  ];
  const O = { noise: 0.17, noiseScale: 0.4, top: C.top, topT: 0.5, belly: C.under, bellyT: 0.15, dither: { col: C.speck, amt: 0.14 }, jit: 0.05 };
  for (const b of blobs) crown.push(ell([b[0], b[1], b[2]], [b[3], b[4], b[5]], C.base, O));
  // ragged fringe clusters + hand-placed silhouettes on the edges
  for (let i = 0; i < 36; i++) {
    const b = blobs[Math.floor(r() * blobs.length)], a = r() * 6.283;
    const x = b[0] + Math.cos(a) * b[3] * 0.98, z = b[2] + Math.sin(a) * b[5] * 0.7, y = b[1] - b[4] * (0.3 + r() * 0.55);
    crown.push(ell([x, y, z], [0.22 + r() * 0.12, 0.14, 0.2], r() < 0.3 ? C.top : C.base, { noise: 0.05, noiseScale: 0.12, belly: C.under, bellyT: 0.3, jit: 0.06 }));
  }
  for (let i = 0; i < 28; i++) { const a = r() * 6.283, d = 0.7 + r() * 2.6; body.push(vox(vs, Math.cos(a) * d, 0, Math.sin(a) * d * 0.7, r() < 0.5 ? C.litter : C.base)); }
  return [
    { n: 'body', p: [0, 0, 0], s: body },
    { n: 'crown', p: fork, s: crown, sway: { axis: 'z', amp: 0.008, freq: 0.32 } },
  ];
}
const MAPLE_COL = {
  red: { base: 'mS', top: 'mSL', under: 'mSD', speck: 'mSs', litter: 'lc', fx: ['#e0462e', '#c8263a'] },
  orange: { base: 'mO', top: 'mOL', under: 'mOD', speck: 'mOs', litter: 'lcL', fx: ['#f2892e', '#e0582c'] },
  gold: { base: 'mG', top: 'mGL', under: 'mGD', speck: 'mGs', litter: 'mGs', fx: ['#f7c04a', '#f2a02e'] },
};
for (const [k, C] of Object.entries(MAPLE_COL)) {
  prop('mn_maple_' + k, 0.1, bigMaple({ red: 101, orange: 202, gold: 303 }[k], C), TREE(0.7, ['autumn', 'maple']),
    { fx: [{ part: 'crown', at: [1.2, 3.4, 0.9], type: 'leaf', rate: 0.35, color: C.fx[0], scale: 1.6 }, { part: 'crown', at: [-1.6, 3.2, 0.5], type: 'leaf', rate: 0.3, color: C.fx[1], scale: 1.6 }] });
}

// ---- overhead maple branch (L4 foreground: leaves dip into the top of the frame)
{
  const vs = 0.08, r = rng(88), body = [], lv = [];
  const pts = bez([-3.2, 3.2, 0], [-0.8, 1.6, 0.1], [2.4, 0.9, 0.2], 6);
  body.push(...tube(pts, 0.17, 0.05, 'mb', { dither: { col: 'mbD', amt: 0.3 } }));
  const tw = [[-1.2, 2.0, 0.2, -0.6, 0.9], [0.4, 1.3, 0.2, 0.9, 0.4], [1.6, 1.0, 0.1, 2.2, 0.1], [-0.2, 1.6, 0.0, 0.0, 0.6]];
  for (const [x, y, z, ex, ey] of tw) body.push(cap([x, y, z], [ex, ey, z + 0.1], 0.06, 0.03, 'mb'));
  const cl0 = [[-1.9, 1.9, 0.2, 1.0], [-0.6, 0.9, 0.2, 0.9], [0.9, 0.5, 0.25, 0.85], [2.3, 0.2, 0.2, 0.7], [-0.1, 1.5, -0.1, 0.8], [1.5, 1.2, 0.1, 0.7], [-2.8, 2.6, 0.1, 0.9]];
  for (const [x, y, z, s] of cl0) {
    lv.push(ell([x, y, z], [0.9 * s, 0.42 * s, 0.6 * s], 'mS', { noise: 0.1, noiseScale: 0.24, top: 'mSL', topT: 0.5, belly: 'mSD', bellyT: 0.2, dither: { col: 'mO', amt: 0.12 }, jit: 0.05 }));
    for (let i = 0; i < 4; i++) { const a = r() * 6.283; lv.push(ell([x + Math.cos(a) * 0.8 * s, y - 0.2 * s, z + Math.sin(a) * 0.4 * s], [0.2, 0.13, 0.18], r() < 0.4 ? 'mO' : 'mS', { belly: 'mSD', bellyT: 0.3, jit: 0.06 })); }
  }
  prop('mn_maple_branch', vs, [{ n: 'body', p: [0, 0, 0], s: body }, { n: 'leaves', p: [-3, 3, 0], s: lv, sway: { axis: 'z', amp: 0.012, freq: 0.4 } }],
    { footprint: [0.2, 0.2], solid: false, tags: ['minoh', 'autumn', 'frame'] }, { cut: -2, fx: [{ part: 'leaves', at: [0.5, 0.3, 0.3], type: 'leaf', rate: 0.25, color: '#e0462e', scale: 1.6 }] });
}

// ---- lemon tree (the Lemmo's grove)
{
  const vs = 0.065, r = rng(97), body = [], crown = [];
  body.push(...tube(bez([0, 0, 0], [0.1, 0.7, 0], [0.05, 1.25, 0.05], 3), 0.14, 0.1, '#7a6a5a', { dither: { col: '#5a4e44', amt: 0.3 } }));
  for (const [ex, ey, ez] of [[0.7, 1.9, 0.2], [-0.6, 2.0, -0.2], [0.1, 2.3, 0.6], [0.0, 2.2, -0.6]]) body.push(cap([0.05, 1.2, 0.05], [ex, ey, ez], 0.08, 0.04, '#7a6a5a'));
  const blobs = [[0.0, 2.35, 0.0, 1.15, 0.85, 1.0], [0.85, 2.0, 0.25, 0.7, 0.6, 0.65], [-0.85, 2.05, -0.1, 0.72, 0.6, 0.65], [0.1, 2.0, 0.75, 0.7, 0.55, 0.5], [0.0, 2.95, 0.0, 0.7, 0.5, 0.65]];
  const O = { noise: 0.08, noiseScale: 0.2, top: 'lgL', topT: 0.55, belly: 'lgD', bellyT: 0.2, dither: { col: '#3e7a40', amt: 0.18 }, jit: 0.05 };
  for (const b of blobs) crown.push(ell([b[0], b[1], b[2]], [b[3], b[4], b[5]], 'lg', O));
  for (let i = 0; i < 26; i++) {
    const b = blobs[Math.floor(r() * 4)], a = r() * 6.283, v = -0.4 + r() * 0.9;
    const x = b[0] + Math.cos(a) * b[3] * Math.sqrt(1 - v * v) * 1.02, z = b[2] + Math.sin(a) * b[5] * Math.sqrt(1 - v * v) * 1.02, y = b[1] + v * b[4];
    crown.push(ell([x, y - 0.04, z], [0.085, 0.11, 0.085], 'lm', { top: 'lmL', topT: 0.4, belly: 'lmD', bellyT: 0.5, jit: 0.04 }));
  }
  for (let i = 0; i < 10; i++) { const a = r() * 6.283, d = 0.4 + r() * 0.5; crown.push(vox(vs, Math.cos(a) * d * 1.1, 2.5 + r() * 0.6, Math.sin(a) * d, '#fff8f0')); }
  for (const [x, z] of [[0.6, 0.5], [-0.5, 0.7], [0.9, -0.2]]) body.push(ell([x, 0.07, z], [0.08, 0.07, 0.1], 'lm', { top: 'lmL', jit: 0.04 }));
  prop('mn_lemon_tree', vs, [{ n: 'body', p: [0, 0, 0], s: body }, { n: 'crown', p: [0, 1.3, 0], s: crown, sway: { axis: 'z', amp: 0.01, freq: 0.45 } }],
    TREE(0.7, ['orchard', 'lemon']));
}

// =====================================================================
// BAMBOO
// =====================================================================

// moso culms: node rings (dark line over a powdery white band), leaf sprays only up high
function culms(seed, { vs = 0.075, n = 4, H = 16, spread = 1.1, col = 'bm', node = 'bmN', ring = 'bmR', grad = 'bmL', leaves = true, rad = [0.085, 0.13], lean = 0.5, old = 0 } = {}) {
  const r = rng(seed), body = [], top = [];
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2 * spread + (r() - 0.5) * 0.4, z = (r() - 0.5) * spread * 0.9;
    const h = H * (0.82 + r() * 0.28), rd = rad[0] + r() * (rad[1] - rad[0]);
    const lx = (r() - 0.5) * lean, lz = (r() - 0.5) * lean * 0.5;
    const isOld = r() < old;
    const c = isOld ? 'bmO' : col, nd = isOld ? 'bmOD' : ring;
    const o = r() * 0.45, P0 = [x, 0, z], P1 = [x + lx, h, z + lz];
    body.push(cap(P0, P1, rd, rd * 0.72, c, { stripes: { axis: 'y', p: 0.46, w: vs * 0.9, col: node, o }, grad: { axis: 'y', to: isOld ? 'bmOD' : grad, a: 0, b: h }, jit: 0.03 }));
    for (let y = o + vs * 1.1; y < h - 0.2; y += 0.46) {
      const t = y / h, cx = x + lx * t, cz = z + lz * t, rr = rd * (1 - 0.28 * t) + vs * 0.3;
      body.push(cyl([cx, y, cz], [cx, y + vs * 0.8, cz], rr, nd, { paint: 1, jit: 0.02 }));
    }
    if (!leaves) continue;
    for (let k = 0; k < 5; k++) {
      const t = 0.68 + k * 0.07, y = h * t, a = r() * 6.283;
      const cx = x + lx * t, cz = z + lz * t, L = 0.7 + r() * 0.5;
      const ex = cx + Math.cos(a) * L, ez = cz + Math.sin(a) * L * 0.5;
      top.push(cap([cx, y, cz], [ex, y - 0.2, ez], 0.03, 0.025, nd));
      for (let j = 0; j < 3; j++) {
        const b = a + (j - 1) * 0.7;
        top.push(ell([ex + Math.cos(b) * 0.25, y - 0.32 - j * 0.06, ez + Math.sin(b) * 0.15], [0.34, 0.06, 0.13], j % 2 ? 'blD' : 'bl', { rot: [0, -b * 57.3, -14], top: 'blL', topT: 0.6, jit: 0.06 }));
      }
    }
  }
  body.push(ell([0, 0, 0], [spread + 0.5, 0.06, spread * 0.6 + 0.3], '#a89a62', { dither: { col: '#7a8a46', amt: 0.4 }, jit: 0.05 }));
  const parts = [{ n: 'body', p: [0, 0, 0], s: body, sway: { axis: 'x', amp: 0.004, freq: 0.3 } }];
  if (top.length) parts.push({ n: 'canopy', p: [0, 0, 0], s: top, sway: { axis: 'x', amp: 0.006, freq: 0.4 } });
  return parts;
}
prop('mn_culms', 0.075, culms(131, { n: 4 }), TREE(1.6, ['bamboo']), { back: -1.2 });
prop('mn_culms_b', 0.075, culms(257, { n: 3, old: 0.5, spread: 0.9 }), TREE(1.4, ['bamboo']), { back: -1.2 });
prop('mn_culms_far', 0.1, culms(389, { vs: 0.1, n: 5, spread: 1.6, col: 'bmH', node: 'bmHN', ring: 'bmHR', grad: 'bmHN', leaves: false, rad: [0.09, 0.12] }), TREE(2.2, ['bamboo']), { back: -1.5 });
prop('mn_culm_fg', 0.075, culms(433, { n: 1, H: 17, col: 'bmF', node: 'bmFN', ring: 'bmR', grad: 'bmF', leaves: false, rad: [0.17, 0.19], lean: 0.2 }), TREE(0.6, ['bamboo', 'frame']), { back: -0.3 });

// ---- shibagaki: brushwood fence between bamboo posts, tied rails, ragged top
{
  const vs = 0.035, r = rng(141), s = [];
  for (const sx of [-0.96, 0.96]) {
    s.push(vcyl(sx, 0, 0, 1.18, 0.045, 'bwT', { stripes: { axis: 'y', p: 0.32, w: 0.03, col: 'bmOD' }, jit: 0.03 }));
    s.push(vcyl(sx, 0, 1.16, 1.2, 0.05, 'bmOD'));
  }
  s.push(box(-0.92, 0.04, -0.05, 0.92, 1.0, 0.05, 'bw', { stripes: { axis: 'x', p: 0.07, w: 0.025, col: 'bwD' }, dither: { col: 'bwL', amt: 0.22 }, jit: 0.06 }));
  for (let i = 0; i < 26; i++) { const x = -0.9 + i * 0.072 + (r() - 0.5) * 0.02, h = 1.0 + r() * 0.13; s.push(cap([x, 0.95, (r() - 0.5) * 0.06], [x + (r() - 0.5) * 0.06, h, (r() - 0.5) * 0.08], 0.018, 0.012, r() < 0.5 ? 'bwD' : 'bwL')); }
  for (const y of [0.32, 0.74]) {
    s.push(cyl([-0.96, y, 0.07], [0.96, y, 0.07], 0.03, 'bwT', { jit: 0.03 }));
    for (const x of [-0.6, 0, 0.6]) s.push(box(x - 0.025, y - 0.05, 0.05, x + 0.025, y + 0.05, 0.11, '#2a2420'));
  }
  s.push(box(-0.96, 0.99, -0.07, 0.96, 1.04, 0.07, 'bwT', { jit: 0.03 }));
  prop('mn_shibagaki', vs, s, { footprint: [2.0, 0.25], solid: true, destructible: true, hp: 30, debris: ['#6a5146', '#a89a58'], tags: ['minoh', 'bamboo', 'fence'] });
}

// ---- fallen culm with a few dry leaves
{
  const vs = 0.06, s = [];
  s.push(cap([-1.9, 0.12, -0.2], [1.9, 0.16, 0.25], 0.12, 0.1, 'bmO', { stripes: { axis: 'x', p: 0.45, w: 0.06, col: 'bmOD' }, jit: 0.04 }));
  s.push(cyl([-1.98, 0.12, -0.21], [-1.86, 0.12, -0.2], 0.08, '#e8d8a0', { paint: 1 }));
  for (const [x, z] of [[-0.6, 0.0], [0.7, 0.15], [1.4, 0.2]]) s.push(cap([x, 0.2, z], [x + 0.4, 0.5, z + 0.3], 0.025, 0.02, 'bmOD'), ell([x + 0.5, 0.48, z + 0.36], [0.22, 0.04, 0.08], '#b8a868', { rot: [0, -30, -10] }));
  s.push(ell([-1.2, 0.04, 0.3], [0.4, 0.05, 0.25], '#a89a62', { dither: { col: '#7a8a46', amt: 0.4 } }));
  prop('mn_fallen_culm', vs, s, { footprint: [3.6, 0.5], solid: true, tags: ['minoh', 'bamboo', 'nature'] });
}

// ---- bamboo pole with a hanging paper lantern (the lantern ghosts' haunt)
{
  const vs = 0.04, s = [];
  s.push(box(-0.14, 0, -0.14, 0.14, 0.14, 0.14, 'st', { dither: { col: 'stD', amt: 0.25 } }));
  s.push(vcyl(0, 0, 0.1, 2.5, 0.045, 'bwT', { stripes: { axis: 'y', p: 0.34, w: 0.03, col: 'bmOD' }, jit: 0.03 }));
  s.push(cap([0, 2.3, 0], [0, 2.35, 0.55], 0.025, 0.025, 'bwT'));
  s.push(box(-0.16, 2.48, -0.16, 0.16, 2.54, 0.16, 'tmK'));
  const lan = [cyl([0, 2.32, 0.5], [0, 2.18, 0.5], 0.012, 'ink'), ...chochin([0, 1.92, 0.5], 0.17, 0.24, '#fff1d6', '#e2b98a', 2, '#e2482e')];
  prop('mn_chochin_post', vs, [{ n: 'body', p: [0, 0, 0], s }, { n: 'lantern', p: [0, 2.33, 0.5], s: lan, sway: { axis: 'x', amp: 0.07, freq: 0.45 } }],
    { footprint: [0.35, 0.35], solid: true, destructible: true, hp: 30, debris: ['#a89a58', '#fff1d6'], light: { color: '#ffb070', intensity: 2, y: 1.9, range: 5, night: true }, tags: ['minoh', 'bamboo', 'shrine', 'light'] });
}

// ---- stone trail marker with a carved bamboo-leaf emblem
{
  const vs = 0.04, s = [];
  s.push(box(-0.3, 0, -0.25, 0.3, 0.14, 0.25, 'stD', { dither: { col: 'stK', amt: 0.25 } }));
  s.push(box(-0.16, 0.14, -0.14, 0.16, 1.15, 0.14, 'st', { dither: { col: 'stD', amt: 0.25 }, jit: 0.05 }));
  s.push(poly([0, 1.15, 0], [[-0.16, 0], [0.16, 0], [0, 0.12]], 0.14, 'st', { dither: { col: 'stD', amt: 0.2 } }));
  s.push(...bitmap(['...#..', '..##..', '.###..', '..#.##', '..####', '..#.#.', '..#...', '..#...'], [-0.1, 0.95, 0.145], 0.04, 0.012, { '#': 'stK' }));
  s.push(ell([0, 0.16, 0], [0.22, 0.14, 0.18], 'mo', { paint: 1, dither: { col: 'moD', amt: 0.4 } }));
  prop('mn_marker', vs, s, { footprint: [0.5, 0.45], solid: true, destructible: true, hp: 80, debris: ['#b8ad9a', '#8f8575'], tags: ['minoh', 'route'] });
}

// =====================================================================
// WATERFALL GORGE
// =====================================================================

// gorge rock wall: rounded, weathered columns with soft strata, moss on every
// ledge and cap, hanging ferns and dark wet seeps
function cliff(seed, W, H, { D = 2.4, vs = 0.14, notch = null } = {}) {
  const r = rng(seed), s = [];
  const RO = (o = 0) => ({ round: 0.45, noise: 0.3, noiseScale: 1.1, top: 'moD', topT: 0.6, stripes: { axis: 'y', p: 1.9 + r() * 0.6, w: 0.16, col: 'rkD', o: o + r() }, dither: { col: r() < 0.5 ? 'rkD' : 'rkL', amt: 0.12 }, jit: 0.05 });
  const cols = Math.max(2, Math.round(W / 1.7));
  for (let i = 0; i < cols; i++) {
    const x0 = -W / 2 + (i / cols) * W, x1 = -W / 2 + ((i + 1) / cols) * W;
    const h = H * (0.8 + r() * 0.22), zf = 0.15 + r() * 0.45;
    s.push(box(x0 - 0.2, -0.5, -D, x1 + 0.2, h, zf, r() < 0.55 ? 'rk' : 'rkW', RO(i)));
    // a bulging boulder face + a mossy ledge with ferns
    s.push(ell([(x0 + x1) / 2 + (r() - 0.5) * 0.5, 0.8 + r() * h * 0.6, zf], [(x1 - x0) * 0.45, 0.8 + r() * 0.8, 0.5], r() < 0.5 ? 'rkL' : 'rk', { noise: 0.2, noiseScale: 0.7, top: 'mo', topT: 0.55, dither: { col: 'rkD', amt: 0.15 }, jit: 0.05 }));
    const ly = 1.5 + r() * (h - 3);
    s.push(box(x0, ly - 0.35, zf - 0.2, x1, ly, zf + 0.35, 'rkL', { round: 0.15, noise: 0.12, noiseScale: 0.5, top: 'mo', topT: 0.45, dither: { col: 'rk', amt: 0.2 }, jit: 0.05 }));
    for (let k = 0; k < 3; k++) { const fx = x0 + r() * (x1 - x0); s.push(cap([fx, ly, zf + 0.2], [fx + (r() - 0.5) * 0.6, ly - 0.45 - r() * 0.3, zf + 0.5], 0.08, 0.04, k % 2 ? 'fn' : 'fnD', { tip: 'fnL', tipT: 0.6 })); }
    s.push(ell([(x0 + x1) / 2, h - 0.1, zf * 0.5 - D * 0.3], [(x1 - x0) * 0.62, 0.4, D * 0.62], 'mo', { paint: 1, noise: 0.15, noiseScale: 0.5, dither: { col: 'moL', amt: 0.25 } }));
  }
  for (let i = 0; i < Math.round(W * 0.8); i++) { const x = -W / 2 + r() * W, y = 0.5 + r() * H * 0.8; s.push(ell([x, y, 0.5], [0.3 + r() * 0.4, 0.5 + r() * 0.9, 0.7], r() < 0.6 ? 'moD' : 'moT', { paint: 1, noise: 0.12, noiseScale: 0.35, dither: { col: 'mo', amt: 0.3 } })); }
  for (let i = 0; i < 3; i++) { const x = -W / 2 + r() * W; s.push(ell([x, H * 0.35, 0.6], [0.14, H * 0.35, 0.9], 'rkK', { paint: 1, noise: 0.06, noiseScale: 0.3 })); }
  if (notch) s.push(box(notch[0], notch[1], -D - 1, notch[2], H + 2, 2, 'k', { sub: 1 }));
  return s;
}
prop('mn_cliff', 0.14, cliff(151, 6, 10), { footprint: [6, 2.4], solid: true, tags: ['minoh', 'rock', 'gorge'] }, { cut: -0.6, back: -2.2 });
prop('mn_cliff_lo', 0.14, cliff(163, 5, 6, { D: 2 }), { footprint: [5, 2], solid: true, tags: ['minoh', 'rock', 'gorge'] }, { cut: -0.6, back: -1.8 });

// ---- Minoh Falls: a single white ribbon off a dark rock lip into a misty basin,
// moss and ferns on the ledges, momiji shrubs framing it (the trail's hero backdrop)
{
  const vs = 0.14, r = rng(171);
  const rock = cliff(177, 14, 15.5, { D: 3.2, notch: [-1.3, 14.3, 1.3] });
  // recessed dark wet groove behind the ribbon + the overhanging lip
  rock.push(box(-1.7, -1, -0.9, 1.7, 14.3, 2, 'k', { sub: 1 }));
  rock.push(box(-1.8, -0.8, -1.2, 1.8, 14.3, -0.75, 'rkK', { dither: { col: 'fwD', amt: 0.12 }, noise: 0.08, noiseScale: 0.4, jit: 0.04 }));
  rock.push(box(-1.6, 13.9, -1.0, 1.6, 14.45, 0.95, 'rkD', { noise: 0.06, noiseScale: 0.3, top: 'rkL', dither: { col: 'rkK', amt: 0.2 } }));
  rock.push(box(-1.2, 14.3, -2.5, 1.2, 14.6, 0.8, 'fwB', { dither: { col: 'fw', amt: 0.3 } }));
  // momiji shrubs on the ledges (Minoh's autumn frame) + ferns at the foot
  for (const [x, y, z, c] of [[-5.2, 9.8, 1.0, 'mS'], [5.6, 7.4, 1.0, 'mO'], [-4.0, 4.6, 1.2, 'mS'], [4.4, 12.6, 0.8, 'mS'], [-6.0, 13.6, 0.5, 'mG']]) {
    const tl = c === 'mS' ? 'mSL' : c === 'mO' ? 'mOL' : 'mGL';
    rock.push(cap([x - 0.6, y - 0.9, z - 0.3], [x, y - 0.1, z], 0.1, 0.06, 'mb'));
    for (const [dx, dy, dz, sx, sy] of [[0, 0, 0, 0.75, 0.42], [0.85, -0.3, 0.2, 0.55, 0.32], [-0.8, -0.15, 0.1, 0.5, 0.3], [0.3, 0.38, -0.1, 0.5, 0.3], [1.4, -0.6, 0.3, 0.32, 0.2]]) {
      rock.push(ell([x + dx, y + dy, z + dz], [sx, sy, sx * 0.75], c, { noise: 0.1, noiseScale: 0.22, top: tl, topT: 0.45, belly: 'mSD', bellyT: 0.15, dither: { col: tl, amt: 0.12 }, jit: 0.05 }));
    }
  }
  // splash boulders and the basin foam
  for (const [x, z, s0] of [[-2.6, 1.2, 1.1], [2.5, 1.4, 1.0], [-3.8, 2.0, 0.8], [3.6, 2.2, 0.9], [1.6, 2.6, 0.5]]) rock.push(ell([x, -0.3, z], [s0, s0 * 0.7, s0 * 0.8], 'rkD', { noise: 0.1, noiseScale: 0.3, top: 'mo', topT: 0.7, dither: { col: 'rkK', amt: 0.25 } }));
  const water = [];
  const ribbon = (y0, y1, w0, w1, z, col, o) => poly([0, (y0 + y1) / 2, z], [[-w0, (y1 - y0) / 2], [w0, (y1 - y0) / 2], [w1, -(y1 - y0) / 2], [-w1, -(y1 - y0) / 2]], 0.17, col, o);
  const bands = [[14.35, 10.6, 1.05, 1.12], [10.7, 7.0, 1.12, 1.22], [7.1, 3.4, 1.22, 1.36], [3.5, -0.5, 1.36, 1.55]];
  const parts = [{ n: 'body', p: [0, 0, 0], s: rock }];
  bands.forEach(([y0, y1, w0, w1], i) => {
    const s = [ribbon(y1, y0, w0, w1, 0.6, 'fw', { stripes: { axis: 'x', p: 0.42, w: 0.14, col: 'fwL', o: i * 0.11 }, dither: { col: 'fwB', amt: 0.16 }, side: 'fwC', sideT: 0.5, jit: 0.04 })];
    s.push(ribbon(y1 + 0.05, y0 - 0.05, w0 * 0.55, w1 * 0.55, 0.78, 'fwL', { dither: { col: 'fw', amt: 0.35 }, jit: 0.02 }));
    parts.push({ n: 'fall' + i, p: [0, y0, 0.6], s, sway: { axis: 'z', amp: 0.006, freq: 1.1 + i * 0.37, phase: i * 1.7 } });
  });
  water.push(ell([0, -0.28, 1.5], [2.4, 0.16, 1.3], 'fwL', { dither: { col: 'fwB', amt: 0.3 }, jit: 0.03 }));
  for (let i = 0; i < 26; i++) { const a = r() * 3.14, d = 0.6 + r() * 2.2; water.push(sph([Math.cos(a) * d * 1.3, -0.1 + r() * 1.6 * (1 - d / 3.2), 1.4 + Math.sin(a) * d * 0.5], 0.22 + r() * 0.28, r() < 0.5 ? 'fw' : 'fwL', { jit: 0.03 })); }
  parts.push({ n: 'spray', p: [0, 0, 1.5], s: water, sway: { axis: 'x', amp: 0.01, freq: 0.8 } });
  const fx = [{ part: 'spray', at: [0, 0.3, 1.8], type: 'steam', rate: 2.5, scale: 4.5 }, { part: 'spray', at: [-1.4, 0.2, 2.2], type: 'steam', rate: 1.2, scale: 3.2 }, { part: 'spray', at: [1.5, 0.2, 2.0], type: 'steam', rate: 1.2, scale: 3.2 }];
  for (const y of [13.6, 11.2, 8.8, 6.4, 4.0, 1.8]) for (const x of [-0.6, 0.5]) fx.push({ part: 'body', at: [x + (y % 2) * 0.2, y, 1.0], type: 'drip', rate: 1.6, color: '#ffffff', scale: 1.4 });
  prop('mn_falls', vs, parts, { footprint: [14, 3.2], solid: true, tags: ['minoh', 'water', 'landmark'], light: { color: '#bff4ff', intensity: 2.2, y: 2, range: 9, night: true } }, { cut: -1.2, back: -3, fx });
}

// ---- mist emitter: wet pebbles that breathe slow spray (falls basin, stream)
prop('mn_mist', 0.05, [ell([0, 0.04, 0], [0.22, 0.06, 0.16], 'rkD', { top: 'mo', topT: 0.6 }), ell([0.2, 0.03, 0.1], [0.12, 0.05, 0.1], 'rkW')],
  { footprint: [0.3, 0.3], solid: false, tags: ['minoh', 'emitter'] }, { fx: [{ part: 'body', at: [0, 0.4, 0], type: 'steam', rate: 0.7, scale: 3.6 }] });

// ---- stepping stones across the shallows
{
  const vs = 0.05, s = [];
  for (const [x, z, rr] of [[-0.75, 0.15, 0.34], [0.05, -0.2, 0.3], [0.8, 0.2, 0.32]]) {
    s.push(ell([x, 0.0, z], [rr, 0.16, rr * 0.85], 'rkW', { top: 'rkL', topT: 0.7, dither: { col: 'rkD', amt: 0.2 }, jit: 0.05 }));
    s.push(ell([x, 0.12, z], [rr * 0.6, 0.06, rr * 0.5], 'mo', { paint: 1, dither: { col: 'moD', amt: 0.4 } }));
  }
  prop('mn_stepstones', vs, s, { footprint: [2.2, 0.8], solid: false, tags: ['minoh', 'water', 'rock'] }, { cut: -0.3 });
}

// ---- riverside railing: weathered timber posts + two rails, moss on the caps
{
  const vs = 0.04, s = [];
  for (const sx of [-0.96, 0.96]) { s.push(box(sx - 0.06, 0, -0.06, sx + 0.06, 0.95, 0.06, 'tmD', { dither: { col: 'tmK', amt: 0.2 }, jit: 0.04 })); s.push(box(sx - 0.07, 0.95, -0.07, sx + 0.07, 1.0, 0.07, 'mo', { dither: { col: 'moD', amt: 0.4 } })); }
  for (const y of [0.45, 0.85]) s.push(box(-1.0, y - 0.04, -0.035, 1.0, y + 0.04, 0.035, y > 0.6 ? 'tm' : 'tmD', { stripes: { axis: 'x', p: 0.5, w: 0.03, col: 'tmK' }, jit: 0.04 }));
  prop('mn_rail', vs, s, { footprint: [2.0, 0.2], solid: true, destructible: true, hp: 30, debris: ['#a8744a', '#7c5333'], tags: ['minoh', 'fence', 'route'] });
}

// ---- vermilion arched footbridge (deck = walkable tiles; this is the dressing)
{
  const vs = 0.05, s = [];
  const L = 2.3, Wd = 1.15;
  // dark arch opening + stone abutments
  s.push(poly([0, -0.4, 0], [[-1.9, -0.6], [1.9, -0.6], [1.9, 0.5], [1.2, 0.62], [0, 0.72], [-1.2, 0.62], [-1.9, 0.5]], Wd - 0.05, '#16262c', { plane: 'xy', jit: 0.03 }));
  for (const sx of [-1, 1]) s.push(box(sx * 1.9, -1.0, -Wd, sx * 2.45, 0.28, Wd, 'st', { dither: { col: 'stD', amt: 0.3 }, top: 'mo', topT: 0.6, jit: 0.05 }));
  for (const sz of [-1, 1]) {
    const z = sz * (Wd + 0.02);
    // arched fascia beam
    s.push(...tube(bez([-L, 0.18, z], [0, 0.55, z], [L, 0.18, z], 8), 0.11, 0.11, 'vm', { jit: 0.03 }));
    s.push(...tube(bez([-L, 0.02, z], [0, 0.38, z], [L, 0.02, z], 8), 0.06, 0.06, 'vmD', { jit: 0.03 }));
    // posts with bronze giboshi finials, two rails
    for (const x of [-L, -L / 2, 0, L / 2, L]) {
      const yb = 0.18 + 0.37 * (1 - (x / L) ** 2);
      s.push(box(x - 0.06, yb, z - 0.06, x + 0.06, yb + 0.95, z + 0.06, 'vm', { jit: 0.03 }));
      if (Math.abs(x) === L) s.push(sph([x, yb + 1.04, z], 0.1, 'gd', { top: 'gdL', jit: 0.03 }), cap([x, yb + 1.1, z], [x, yb + 1.24, z], 0.05, 0.01, 'gd'));
    }
    s.push(...tube(bez([-L, 1.02, z], [0, 1.4, z], [L, 1.02, z], 8), 0.045, 0.045, 'vm', { jit: 0.03 }));
    s.push(...tube(bez([-L, 0.62, z], [0, 1.0, z], [L, 0.62, z], 8), 0.03, 0.03, 'vmD', { jit: 0.03 }));
  }
  prop('mn_footbridge', vs, s, { footprint: [4.6, 2.4], solid: false, tags: ['minoh', 'bridge', 'water'] }, { cut: -1.1 });
}

// ---- mossy stone wall (ishigaki) segment with ferns in the cracks
{
  const vs = 0.05, r = rng(181), s = [];
  for (let row = 0; row < 3; row++) {
    let x = -1.0 + (row % 2) * 0.2;
    while (x < 1.0) {
      const w = 0.35 + r() * 0.3, y = row * 0.38;
      s.push(bx([Math.min(x + w / 2, 0.98), y + 0.2, 0], [w / 2 - 0.02, 0.19, 0.35], r() < 0.5 ? 'st' : 'stW', { round: 0.07, noise: 0.03, noiseScale: 0.1, top: 'mo', topT: 0.6, dither: { col: 'stD', amt: 0.25 }, jit: 0.06 }));
      x += w;
    }
  }
  s.push(box(-1.0, 1.1, -0.36, 1.0, 1.22, 0.36, 'mo', { dither: { col: 'moD', amt: 0.4 }, noise: 0.04, noiseScale: 0.1 }));
  for (const [x, y] of [[-0.55, 0.45], [0.4, 0.8], [0.8, 0.2]]) for (let k = 0; k < 3; k++) s.push(cap([x, y, 0.32], [x + (k - 1) * 0.18, y + 0.2, 0.5], 0.04, 0.02, 'fn', { tip: 'fnL' }));
  prop('mn_moss_wall', vs, s, { footprint: [2.0, 0.75], solid: true, tags: ['minoh', 'wall', 'shrine'] });
}

// =====================================================================
// RANGER POST & STALL
// =====================================================================

// ---- ranger cabin: dark board siding, deep eave over a porch, trail map,
// first-aid box (green cross), radio mast with a solar panel, lit windows
{
  const vs = 0.07, s = [], mast = [];
  const W = 3.2, Dp = 1.8, Hw = 2.9;
  s.push(box(-W - 0.1, 0, -Dp - 0.1, W + 0.1, 0.35, Dp + 0.1, 'stD', { dither: { col: 'stK', amt: 0.3 }, jit: 0.05 }));
  s.push(box(-W, 0.35, -Dp, W, Hw, Dp, 'cab', { stripes: { axis: 'x', p: 0.21, w: 0.035, col: 'cabD' }, jit: 0.04 }));
  for (const sx of [-W, W]) for (const sz of [-Dp, Dp]) s.push(box(sx - 0.1, 0.35, sz - 0.1, sx + 0.1, Hw, sz + 0.1, 'tmD', { jit: 0.04 }));
  // front: door, window, porch deck + posts
  s.push(box(0.75, 0.35, Dp, 1.65, 2.35, Dp + 0.06, 'tmK', { stripes: { axis: 'x', p: 0.3, w: 0.04, col: '#3a2618' }, jit: 0.03 }));
  s.push(box(1.0, 1.7, Dp + 0.05, 1.4, 2.1, Dp + 0.08, '#e8c070', { glow: 1 }));
  s.push(box(1.48, 1.25, Dp + 0.05, 1.56, 1.33, Dp + 0.1, 'gd'));
  s.push(box(-2.3, 1.15, Dp - 0.02, -0.5, 2.25, Dp + 0.08, 'tmL', { jit: 0.03 }));
  s.push(box(-2.2, 1.25, Dp + 0.02, -0.6, 2.15, Dp + 0.1, '#e8c070', { glow: 1, dither: { col: '#f6d890', amt: 0.3 } }));
  s.push(box(-1.43, 1.25, Dp + 0.05, -1.37, 2.15, Dp + 0.12, 'tmL'), box(-2.2, 1.68, Dp + 0.05, -0.6, 1.74, Dp + 0.12, 'tmL'));
  s.push(box(-2.4, 1.05, Dp, -0.4, 1.13, Dp + 0.3, 'tm'));
  for (let i = 0; i < 4; i++) s.push(ell([-2.1 + i * 0.5, 1.2, Dp + 0.22], [0.12, 0.1, 0.1], i % 2 ? '#e2482e' : '#f7c04a', { top: 'lf', topT: 0.4 }));
  s.push(box(-W - 0.3, 0.35, Dp, W + 0.3, 0.45, Dp + 1.3, 'tm', { stripes: { axis: 'x', p: 0.3, w: 0.04, col: 'tmD' }, jit: 0.04 }));
  for (const sx of [-W - 0.15, W + 0.15]) s.push(box(sx - 0.08, 0.45, Dp + 1.12, sx + 0.08, 3.25, Dp + 1.28, 'tmD', { jit: 0.04 }));
  // trail map board (three trails: white-blue falls, green bamboo, red maple)
  s.push(box(2.0, 1.0, Dp, 3.0, 2.2, Dp + 0.08, 'tmK'));
  s.push(...bitmap([
    'cccccccccccc', 'c....bb....c', 'c.ww.b..rr.c', 'c.w..bb.r..c', 'c.ww..b.rr.c', 'c..w.bb..r.c', 'c.www.b.rrrc', 'c..g.......c', 'cccccccccccc',
  ], [2.06, 2.13, Dp + 0.1], 0.08, 0.02, { c: '#f4e9d2', '.': '#e2d6b8', w: '#7fd8f0', b: '#3fae4e', r: '#e0462e', g: '#7a5a3a' }));
  // first-aid box with a green cross
  s.push(box(-3.0, 1.5, Dp, -2.5, 2.0, Dp + 0.16, 'wh'));
  s.push(box(-2.8, 1.6, Dp + 0.15, -2.7, 1.9, Dp + 0.18, '#1ebc73'), box(-2.9, 1.7, Dp + 0.15, -2.6, 1.8, Dp + 0.18, '#1ebc73'));
  // RANGER plank over the door
  s.push(box(0.35, 2.45, Dp, 2.05, 2.8, Dp + 0.06, '#2f5a3e'));
  s.push(...text('RANGER', [1.2, 2.62, Dp + 0.08], 0.05, 0.015, 'cr'));
  // deep gable roof (ridge along x), dark green metal with ribs, big front eave
  const roofO = { stripes: { axis: 'x', p: 0.28, w: 0.06, col: '#2a4a40' }, jit: 0.03 };
  s.push(poly([0, 0, 0], [[-Dp, Hw], [Dp, Hw], [0, Hw + 1.25]], W, 'cab', { plane: 'zy', stripes: { axis: 'z', p: 0.21, w: 0.035, col: 'cabD' } }));
  s.push(bx([0, Hw + 0.64, -Dp / 2 - 0.25], [W + 0.45, 0.09, Dp / 2 + 0.6], '#3a5a50', Object.assign({ rot: [-34.8, 0, 0] }, roofO)));
  s.push(bx([0, Hw + 0.47, Dp / 2 + 0.7], [W + 0.45, 0.09, Dp / 2 + 1.25], '#3a5a50', Object.assign({ rot: [24, 0, 0] }, roofO)));
  s.push(box(-W - 0.45, Hw + 1.18, -0.12, W + 0.45, Hw + 1.32, 0.12, '#2a4a40'));
  // radio mast + small solar panel + red beacon
  mast.push(vcyl(2.4, -0.6, Hw + 0.8, 6.8, 0.04, 'mtD'));
  for (const y of [4.6, 5.6]) mast.push(cyl([2.15, y, -0.6], [2.65, y, -0.6], 0.025, 'mtD'));
  mast.push(bx([2.4, 6.85, -0.6], [0.06, 0.06, 0.06], 'nr', { glow: 2 }));
  mast.push(bx([1.7, 4.2, -0.5], [0.45, 0.04, 0.3], '#2a3e6a', { rot: [30, 0, 0], stripes: { axis: 'x', p: 0.15, w: 0.02, col: 'mtL' } }));
  prop('mn_ranger_cabin', vs, [{ n: 'body', p: [0, 0, 0], s }, { n: 'mast', p: [0, 0, 0], s: mast }],
    { footprint: [6.6, 3.8], solid: true, light: { color: '#ffd27a', intensity: 2.2, y: 1.8, range: 6, night: true }, tags: ['minoh', 'safari', 'building'] });
}

// ---- safari gate: timber frame (not a shrine torii), lashed beams, hanging board
{
  const vs = 0.06, s = [];
  const lo = { dither: { col: 'tmD', amt: 0.2 }, stripes: { axis: 'y', p: 0.5, w: 0.04, col: 'tmD' }, jit: 0.04 };
  for (const sx of [-2.7, 2.7]) {
    s.push(ell([sx, 0.1, 0], [0.45, 0.22, 0.4], 'st', { dither: { col: 'stD', amt: 0.3 }, top: 'mo', topT: 0.7 }));
    s.push(vcyl(sx, 0, 0, 3.75, 0.21, 'tm', lo));
    s.push(tor([sx, 3.0, 0], 0.22, 0.04, '#c8b07a'), tor([sx, 3.45, 0], 0.22, 0.04, '#c8b07a'));
  }
  s.push(cyl([-3.25, 3.55, 0], [3.25, 3.55, 0], 0.2, 'tm', { stripes: { axis: 'x', p: 0.6, w: 0.04, col: 'tmD' }, jit: 0.04 }));
  s.push(cyl([-3.3, 3.55, 0], [-3.18, 3.55, 0], 0.17, 'tmL', { paint: 1 }), cyl([3.18, 3.55, 0], [3.3, 3.55, 0], 0.17, 'tmL', { paint: 1 }));
  s.push(cyl([-2.7, 2.95, 0], [2.7, 2.95, 0], 0.12, 'tmD', { jit: 0.04 }));
  // little roof cap over the main beam
  s.push(bx([0, 3.86, 0], [3.45, 0.06, 0.42], 'tmK', { rot: [0, 0, 0] }), bx([0, 3.95, 0], [3.3, 0.06, 0.3], 'tmK'));
  // hanging board (text is a panel in the map) + rope ties
  s.push(box(-1.7, 2.0, -0.06, 1.7, 2.75, 0.06, '#5a3b25', { jit: 0.03 }));
  s.push(box(-1.76, 1.96, -0.07, 1.76, 2.0, 0.07, 'tmK'), box(-1.76, 2.75, -0.07, 1.76, 2.79, 0.07, 'tmK'));
  for (const x of [-1.3, 1.3]) s.push(box(x - 0.02, 2.79, -0.02, x + 0.02, 2.85, 0.02, '#c8b07a'));
  prop('mn_safari_gate', vs, s, { footprint: [6.4, 0.6], solid: false, colliders: [[-2.7, 0, 0.5, 0.5], [2.7, 0, 0.5, 0.5]], tags: ['minoh', 'safari', 'gate'] });
}

// ---- trail map board on two posts (bamboo & maple ranger posts)
{
  const vs = 0.05, s = [];
  for (const sx of [-0.75, 0.75]) s.push(box(sx - 0.05, 0, -0.05, sx + 0.05, 1.9, 0.05, 'tmD', { jit: 0.04 }));
  s.push(box(-0.85, 0.95, -0.04, 0.85, 1.85, 0.04, 'tmK'));
  s.push(box(-0.95, 1.85, -0.18, 0.95, 1.93, 0.14, '#3a5a50'));
  s.push(...bitmap([
    'cccccccccccccccc', 'c..............c', 'c.ww...bb...rr.c', 'c..w..bb.b..r..c', 'c.ww...b...rrr.c', 'c..w..bbb....r.c', 'c.www..b...rr..c', 'c......g.......c', 'c.....ggg......c', 'cccccccccccccccc',
  ], [-0.75, 1.79, 0.05], 0.1, 0.02, { c: '#f4e9d2', '.': '#e2d6b8', w: '#7fd8f0', b: '#3fae4e', r: '#e0462e', g: '#7a5a3a' }));
  prop('mn_trailmap', vs, s, { footprint: [1.7, 0.3], solid: true, destructible: true, hp: 40, debris: ['#a8744a', '#f4e9d2'], tags: ['minoh', 'safari', 'route'] });
}

// ---- momiji tempura stall: wooden counter, wok of golden oil, baskets of fried
// maple leaves, kraft paper bags, crimson noren with a white maple leaf, lantern
{
  const vs = 0.05, s = [], wok = [], noren = [];
  const r = rng(201);
  s.push(box(-1.45, 0, -0.6, 1.45, 0.92, 0.6, 'tm', { stripes: { axis: 'x', p: 0.24, w: 0.03, col: 'tmD' }, jit: 0.04 }));
  s.push(box(-1.45, 0, 0.58, 1.45, 0.14, 0.64, 'tmK'));
  s.push(box(-0.62, 0.22, 0.6, 0.62, 0.82, 0.64, 'cr'));
  s.push(...bitmap(MAPLE_LEAF, [-0.28, 0.73, 0.65], 0.07, 0.015, { '#': 'vm' }));
  s.push(box(-1.55, 0.92, -0.7, 1.55, 0.99, 0.76, 'tmL', { jit: 0.03 }));
  for (const sx of [-1.45, 1.45]) for (const sz of [-0.55, 0.55]) s.push(box(sx - 0.06, 0.92, sz - 0.06, sx + 0.06, 2.45, sz + 0.06, 'tmD', { jit: 0.04 }));
  // shingle roof (two slabs) + ridge
  s.push(bx([0, 2.62, 0.25], [1.75, 0.07, 0.75], 'tmK', { rot: [16, 0, 0], stripes: { axis: 'z', p: 0.18, w: 0.04, col: '#3a2618' } }));
  s.push(bx([0, 2.62, -0.55], [1.75, 0.07, 0.45], 'tmK', { rot: [-22, 0, 0] }));
  s.push(box(-1.8, 2.7, -0.2, 1.8, 2.82, 0.0, '#3a2618'));
  // baskets of fried leaves (left) + bag stack (far left)
  for (const [x, z] of [[-0.55, 0.25], [-0.05, 0.3]]) {
    s.push(vcyl(x, z, 0.99, 1.07, 0.24, '#c8a868', { stripes: { axis: 'y', p: 0.04, w: 0.015, col: '#a8884a' } }));
    for (let i = 0; i < 9; i++) { const a = r() * 6.283, d = r() * 0.16; s.push(ell([x + Math.cos(a) * d, 1.09 + r() * 0.05, z + Math.sin(a) * d], [0.075, 0.025, 0.06], ['fry', 'fryL', 'fryR'][i % 3], { rot: [0, r() * 180, 0], jit: 0.04 })); }
  }
  for (let i = 0; i < 4; i++) {
    const x = -1.25 + (i % 2) * 0.24, y = 0.99 + Math.floor(i / 2) * 0.3;
    s.push(box(x - 0.1, y, 0.1 - 0.06, x + 0.1, y + 0.28, 0.1 + 0.06, 'kraft', { top: 'kraftD', jit: 0.03 }));
    s.push(box(x - 0.03, y + 0.1, 0.165, x + 0.03, y + 0.16, 0.17, 'vm'));
  }
  // wok over a burner (right)
  wok.push(box(0.55, 0.99, -0.3, 1.25, 1.12, 0.35, 'mtK'));
  wok.push(ell([0.9, 1.3, 0.02], [0.4, 0.2, 0.34], '#2a2a30', { jit: 0.02 }));
  wok.push(ell([0.9, 1.42, 0.02], [0.36, 0.2, 0.3], 'k', { sub: 1 }));
  wok.push(ell([0.9, 1.33, 0.02], [0.33, 0.05, 0.27], 'oil', { glow: 1, dither: { col: 'fryL', amt: 0.3 } }));
  for (let i = 0; i < 5; i++) wok.push(ell([0.78 + (i % 3) * 0.12, 1.38, -0.08 + Math.floor(i / 3) * 0.16], [0.07, 0.02, 0.055], i % 2 ? 'fryL' : 'fry', { rot: [0, i * 40, 0] }));
  wok.push(tor([0.9, 1.4, 0.02], 0.38, 0.025, '#3a3a44', { jit: 0.02 }));
  wok.push(cap([1.25, 1.4, 0.02], [1.5, 1.48, 0.1], 0.025, 0.02, 'tmD'));
  wok.push(box(0.7, 1.12, -0.05, 1.1, 1.15, 0.1, 'no', { glow: 2 }));
  // a long-handled wire skimmer resting on the edge
  wok.push(cap([0.5, 1.45, 0.3], [0.85, 1.36, 0.1], 0.015, 0.015, 'tmL'), tor([0.92, 1.36, 0.06], 0.07, 0.012, 'mtL', { rot: [90, 0, 0] }));
  // crimson noren with a white maple leaf, hanging from the front eave
  for (let i = 0; i < 3; i++) {
    const x = -1.0 + i * 1.0;
    noren.push(box(x - 0.47, 1.85, 0.74, x + 0.47, 2.42, 0.78, '#b33831', { jit: 0.03 }));
    if (i === 1) noren.push(...bitmap(MAPLE_LEAF, [x - 0.2, 2.33, 0.795], 0.05, 0.012, { '#': 'wh' }));
    else noren.push(box(x - 0.47, 1.85, 0.735, x + 0.47, 1.9, 0.785, '#6e2727'));
  }
  noren.push(cyl([-1.55, 2.44, 0.76], [1.55, 2.44, 0.76], 0.025, 'tmK'));
  // paper lantern at the front corner
  const lan = [cyl([1.6, 2.44, 0.8], [1.6, 2.3, 0.8], 0.012, 'ink'), ...chochin([1.6, 2.05, 0.8], 0.16, 0.22, '#ff5a3c', '#b8301e', 2, '#ffd9a0')];
  prop('mn_tempura_stall', vs, [
    { n: 'body', p: [0, 0, 0], s }, { n: 'wok', p: [0.9, 1.3, 0], s: wok },
    { n: 'noren', p: [0, 2.44, 0.76], s: noren, sway: { axis: 'x', amp: 0.035, freq: 0.5 } },
    { n: 'lantern', p: [1.6, 2.44, 0.8], s: lan, sway: { axis: 'x', amp: 0.06, freq: 0.55 } },
  ], { footprint: [3.0, 1.4], solid: true, destructible: false, light: { color: '#ffb066', intensity: 3, y: 2.0, range: 6, night: true }, tags: ['minoh', 'food', 'stall'] },
  { fx: [{ part: 'wok', at: [0.9, 1.55, 0.02], type: 'steam', rate: 0.8, scale: 1.2 }] });
}

// =====================================================================
// JAPANESE MACAQUES (wild animals, not Tokonmon): sit, groom, snatch
// =====================================================================
function macaque(s, o = [0, 0, 0], yaw = 0, pose = 'sit') {
  const c = Math.cos(yaw), sn = Math.sin(yaw);
  const T = (x, y, z) => [o[0] + x * c + z * sn, o[1] + y, o[2] - x * sn + z * c];
  const F = { dither: { col: 'mqL', amt: 0.2 }, jit: 0.05 };
  s.push(ell(T(0, 0.26, -0.02), [0.17, 0.2, 0.15], 'mq', F));
  s.push(ell(T(0, 0.08, -0.14), [0.08, 0.05, 0.04], 'mqF'));
  s.push(cap(T(0, 0.12, -0.15), T(0, 0.2, -0.24), 0.035, 0.025, 'mqD'));
  s.push(sph(T(0, 0.5, 0.05), 0.115, 'mq', F));
  s.push(ell(T(0, 0.56, 0.08), [0.12, 0.05, 0.08], 'mqL', { paint: 1 }));
  s.push(ell(T(0, 0.48, 0.14), [0.068, 0.075, 0.035], 'mqF', { jit: 0.03 }));
  s.push(ell(T(0, 0.43, 0.16), [0.04, 0.025, 0.02], 'mqFD'));
  for (const sx of [-1, 1]) {
    s.push(bx(T(sx * 0.03, 0.505, 0.172), [0.012, 0.012, 0.012], 'ink'));
    s.push(ell(T(sx * 0.1, 0.5, 0.06), [0.025, 0.04, 0.03], 'mqF'));
    if (pose === 'sit') {
      s.push(cap(T(sx * 0.1, 0.12, 0.02), T(sx * 0.12, 0.2, 0.18), 0.07, 0.05, 'mq', F));
      s.push(cap(T(sx * 0.12, 0.18, 0.18), T(sx * 0.11, 0.03, 0.2), 0.045, 0.035, 'mqD'));
      s.push(cap(T(sx * 0.14, 0.36, 0.03), T(sx * 0.15, 0.22, 0.15), 0.045, 0.035, 'mq', F));
      s.push(ell(T(sx * 0.13, 0.21, 0.2), [0.035, 0.025, 0.04], 'mqFD'));
    } else if (pose === 'groom') {
      s.push(cap(T(sx * 0.1, 0.12, 0.02), T(sx * 0.12, 0.2, 0.18), 0.07, 0.05, 'mq', F));
      s.push(cap(T(sx * 0.12, 0.18, 0.18), T(sx * 0.11, 0.03, 0.2), 0.045, 0.035, 'mqD'));
      s.push(cap(T(sx * 0.14, 0.36, 0.05), T(sx * 0.09, 0.42, 0.24), 0.045, 0.035, 'mq', F));
      s.push(ell(T(sx * 0.06, 0.43, 0.27), [0.03, 0.03, 0.03], 'mqFD'));
    } else { // snatch: clutching a stolen paper bag of tempura, crisps spilling
      s.push(cap(T(sx * 0.1, 0.12, 0.02), T(sx * 0.13, 0.22, 0.17), 0.07, 0.05, 'mq', F));
      s.push(cap(T(sx * 0.13, 0.2, 0.17), T(sx * 0.12, 0.03, 0.18), 0.045, 0.035, 'mqD'));
      s.push(cap(T(sx * 0.14, 0.36, 0.05), T(sx * 0.09, 0.33, 0.2), 0.045, 0.035, 'mq', F));
    }
  }
  if (pose === 'snatch') {
    s.push(box(...T(-0.08, 0.24, 0.18), ...T(0.08, 0.44, 0.28), 'kraft', { top: 'kraftD', jit: 0.03 }));
    s.push(bx(T(0, 0.33, 0.29), [0.025, 0.025, 0.01], 'vm'));
    for (const [x, y, z] of [[0.05, 0.47, 0.22], [-0.03, 0.46, 0.25], [0.12, 0.05, 0.3], [-0.1, 0.02, 0.34]]) s.push(ell(T(x, y, z), [0.05, 0.015, 0.04], 'fry', { jit: 0.04 }));
  }
}
{
  const s = []; macaque(s, [0, 0, 0], 0, 'sit');
  prop('mn_macaque_sit', 0.022, s, { footprint: [0.4, 0.4], solid: false, tags: ['minoh', 'animal', 'monkey'] });
}
{
  const s = []; macaque(s, [0.12, 0, -0.06], 0.3, 'sit'); macaque(s, [-0.2, 0, -0.3], 0.55, 'groom');
  prop('mn_macaque_groom', 0.022, s, { footprint: [0.7, 0.6], solid: false, tags: ['minoh', 'animal', 'monkey'] });
}
{
  const s = []; macaque(s, [0, 0, 0], -0.3, 'snatch');
  prop('mn_macaque_snatch', 0.022, s, { footprint: [0.4, 0.4], solid: false, tags: ['minoh', 'animal', 'monkey'] });
}

export const DESIGNS = D;
export const PROP_META = M;
