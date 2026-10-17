// Chuo / Namba stage-set props — Kishiwada farm (prologue), Osaka Castle Park,
// Dotonbori and the two Dotonbori interiors (Yellow Submarine Soft-Serve,
// Abbey Road Okonomiyaki). Voxel prop DSL (docs/MODELING.md, arch 'static'),
// same conventions as props.js: props stand on y = 0 centred on x = z = 0,
// front = +z (toward the side-scroll camera), 1 unit = 1 m.
// Reference study: docs/refs/environments.md §1–§4, §9, §11.
//
//   DESIGNS[id]   design objects (merged into the prop library by designs/index.js)
//   PROP_META[id] { footprint:[w,d], solid, destructible, hp, debris, light, tags }
//
// Text on props uses the 3×5 pixel font (Latin only); Japanese text lives on
// map `panels` and building signs instead.
import { PROP_PAL } from './props.js';

const D = {}, M = {};
const P = Object.assign({}, PROP_PAL, {
  // Senshu farm (environments.md §1 palette)
  kw: '#4a4f5a', kwD: '#363c49', kwL: '#5d6370',           // kawara roof
  pl: '#f1ece0', plD: '#d9d2c2',                            // plaster
  nk: '#3a3d44',                                            // namako tile
  ys: '#2a2624', ysL: '#3d3632',                            // yakisugi boards
  ru: '#8b5a3c', ruD: '#6a4230', ga: '#9aa3ab', gaD: '#7a838b', // rust / galvanised
  lit: '#ffb35c', litL: '#ffd98a',                          // lit window
  sd: '#7fbf4a', sdD: '#5a9a38',                            // rice seedlings
  cb: '#a8d07a', cbL: '#d8eeb0', cbD: '#6f9a4a',            // cabbage
  ed: '#8a6a4a', edL: '#a8865e', edD: '#6a4f36',            // earth
  // castle (§2)
  cp: '#f3f1ea', cpD: '#c9cfd6', cu: '#7fb6a2', cuD: '#3f6e62', cuL: '#5d9584',
  au: '#d4a637', auL: '#ffe28a', auD: '#9a6f1f',
  gn: '#c2b9a8', gnM: '#9b9284', gnK: '#5b544b',
  // Dotonbori + interiors (§3, §4)
  sub: '#ffd21f', subD: '#d99a10', mag: '#e8318a', cyn: '#1fb5c8', pur: '#6c3fb5', lim: '#9be13c', crm: '#fff4d6', brs: '#c9a24a', chr: '#d5dbe1',
  oak: '#8a5a3a', oakL: '#b98a5e', oakD: '#5a3b25', stl: '#2b2b2e', stlL: '#4a4a50', ppr: '#f4ecd8', rink: '#c8281e', lan: '#d93a2b',
});

// ---------------------------------------------------------------- helpers (same DSL helpers as props.js)
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
// 3×5 pixel font (Latin subset, extended with the letters the sign bank needs)
const FONT = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'], N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['###', '#.#', '#.#', '#.#', '###'],
  P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
  6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'], 9: ['###', '#.#', '###', '..#', '##.'],
  '-': ['...', '...', '###', '...', '...'], ' ': ['..', '..', '..', '..', '..'], '!': ['#', '#', '#', '.', '#'], '.': ['.', '.', '.', '.', '#'],
  "'": ['#', '#', '.', '.', '.'], '&': ['.#.', '#.#', '.#.', '#.#', '.##'], '¥': ['#.#', '.#.', '###', '.#.', '.#.'], '★': ['.#.', '###', '.#.', '#.#', '...'],
};
function bitmap(rows, o, px, d, cmap, plane = 'xy', opts) {
  const out = [];
  if (opts && opts.snap) {
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
function text(str, c, px, d, col, opts, gap = 1) {
  const rows = textRows(str, gap);
  const w = rows[0].length;
  return bitmap(rows.map((r) => r.replace(/#/g, 'a')), [c[0] - ((w - 1) * px) / 2, c[1] + 2 * px, c[2]], px, d, { a: col }, 'xy', opts);
}
// stepped tile roof. c = [x, y0, z] eave-level centre; hx/hz half size at the eave; layers shrink
// by `step` in z every layer and in x only while x > gx (gx = gable half-width → irimoya; gx = hx → gable)
function steppedRoof(c, hx, hz, n, step, th, col, o = {}, gx = hx, ridge = null) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const ax = Math.max(gx, hx - i * step), az = Math.max(th, hz - i * step);
    out.push(bx([c[0], c[1] + th * (i + 0.5), c[2]], [ax, th / 2, az], col, o));
  }
  if (ridge) {
    const ax = Math.max(gx, hx - (n - 1) * step);
    out.push(bx([c[0], c[1] + th * (n + 0.35), c[2]], [ax + 0.05, th * 0.6, Math.max(th, hz - (n - 1) * step) * 0.6 + 0.04], ridge, { jit: 0.03 }));
  }
  return out;
}
// chōchin paper lantern (vertical axis)
function chochin(c, r, h, paper = '#ff5a3c', rib = '#c2341f', glow = 2, mark = null) {
  const [x, y, z] = c, out = [];
  out.push(ell(c, [r, h, r], paper, { glow, stripes: { axis: 'y', p: h * 0.36, w: h * 0.08, col: rib, o: y }, jit: 0.03 }));
  if (mark) out.push(ell([x, y, z + r * 0.6], [r * 0.45, h * 0.35, r * 0.5], mark, { paint: 1, glow }));
  out.push(vcyl(x, z, y - h - 0.02, y - h * 0.8, r * 0.62, 'ink', { jit: 0.02 }));
  out.push(vcyl(x, z, y + h * 0.8, y + h + 0.02, r * 0.55, 'ink', { jit: 0.02 }));
  return out;
}
function prop(id, vs, parts, meta, extra = {}) {
  const isParts = Array.isArray(parts) && parts.length && !Array.isArray(parts[0]) && parts[0].n;
  const list = isParts ? parts : [{ n: 'body', p: [0, 0, 0], s: parts }];
  for (const pt of list) pt.s.push(['box', [0, -50 - vs * 0.5, 0], [1000, 50, 1000], 'k', { sub: 1 }]);
  D[id] = Object.assign({ id: 'prop_' + id, vs, arch: 'static', anim: { bounce: 0 }, pal: P, parts: list }, extra);
  M[id] = Object.assign({ footprint: [1, 1], solid: true, destructible: false, hp: 0, debris: [], light: null, tags: [] }, meta);
}
const WOOD = (c = 'wdK', amt = 0.18) => ({ dither: { col: c, amt }, jit: 0.04 });
const KAWARA = { stripes: { axis: 'x', p: 0.2, w: 0.06, col: 'kwD' }, top: 'kwL', topT: 0.6, jit: 0.03 };

// =====================================================================
// KISHIWADA FARM (prologue at dawn) — environments.md §1
// =====================================================================

// ---- kominka farmhouse: irimoya kawara roof, engawa with lit glass doors, doma entrance ----
{
  const vs = 0.1, s = [];
  s.push(box(-5.1, 0, -2.9, 5.1, 0.32, 2.5, 'st', { dither: { col: 'stD', amt: 0.3 }, jit: 0.05 }));
  // plaster walls between dark timber posts
  s.push(box(-4.9, 0.32, -2.7, 4.9, 3.0, 2.3, 'pl', { dither: { col: 'plD', amt: 0.06 }, jit: 0.02 }));
  for (const x of [-4.9, -3.4, -1.6, 0.2, 1.8, 3.4, 4.9]) s.push(box(x - 0.11, 0.32, 2.2, x + 0.11, 3.0, 2.42, 'wdK', WOOD('#3e2a1c')));
  s.push(box(-4.95, 2.72, 2.2, 4.95, 2.92, 2.44, 'wdK', WOOD('#3e2a1c')));             // nageshi beam
  s.push(box(-4.95, 0.32, 2.2, 4.95, 0.46, 2.44, 'wdK'));
  // doma entrance (left): wide sliding wooden doors, one pulled open onto a warm-lit earthen floor
  s.push(box(-4.75, 0.32, 2.2, -1.75, 2.6, 2.44, 'wdD', { stripes: { axis: 'x', p: 0.25, w: 0.04, col: 'wdK' }, jit: 0.04 }));
  s.push(box(-3.2, 0.34, 1.8, -1.85, 2.5, 2.5, 'k', { sub: 1 }));
  s.push(box(-3.2, 0.34, 1.6, -1.85, 2.5, 1.8, '#5a3b25', { jit: 0.04 }));
  s.push(box(-3.1, 0.34, 1.82, -1.95, 0.4, 2.3, 'ed', { dither: { col: 'edD', amt: 0.3 } }));
  s.push(box(-3.15, 1.2, 1.62, -1.9, 2.3, 1.66, 'lit', { glow: 1 }));
  s.push(box(-4.7, 1.6, 2.44, -3.3, 2.55, 2.48, 'wdK', { stripes: { axis: 'x', p: 0.14, w: 0.07, col: 'litL' } }));  // lattice transom
  // engawa: wooden veranda, glass sliding doors glowing with morning lamplight
  s.push(box(-1.5, 0.32, 2.3, 4.95, 0.58, 3.15, 'wdL', { stripes: { axis: 'x', p: 0.3, w: 0.03, col: 'wd' }, jit: 0.04 }));
  for (const x of [-1.4, 1.0, 3.4, 4.85]) s.push(box(x - 0.08, 0, 2.95, x + 0.08, 0.34, 3.12, 'st'));
  s.push(box(-1.4, 0.58, 2.2, 4.8, 2.6, 2.3, 'litL', { glow: 1, stripes: { axis: 'x', p: 0.8, w: 0.08, col: 'wdK' } }));
  s.push(box(-1.4, 1.55, 2.25, 4.8, 1.62, 2.34, 'wdK'));
  s.push(box(-1.4, 0.58, 2.24, 4.8, 0.66, 2.34, 'wdK'));
  for (let i = 0; i < 8; i++) s.push(box(-1.3 + i * 0.8, 0.66, 2.3, -0.7 + i * 0.8, 1.5, 2.33, '#ffe9c4', { glow: 1, stripes: { axis: 'y', p: 0.28, w: 0.04, col: '#d9b98a' } }));
  // stepping stone + geta at the engawa
  s.push(box(0.3, 0, 3.2, 1.1, 0.18, 3.7, 'stW', { jit: 0.04 }), box(0.45, 0.18, 3.35, 0.6, 0.24, 3.6, 'wd'), box(0.75, 0.18, 3.35, 0.9, 0.24, 3.6, 'wd'));
  // irimoya roof: hipped skirt + gable top, deep eaves
  s.push(box(-5.7, 2.95, -3.55, 5.7, 3.05, 3.65, 'wdK'));
  s.push(...steppedRoof([0, 3.0, 0.05], 5.85, 3.75, 12, 0.3, 0.24, 'kw', KAWARA, 4.1, 'kwD'));
  for (const sx of [-1, 1]) {
    s.push(poly([sx * 4.18, 4.6, 0.05], [[-2.0, 0], [2.0, 0], [0, 1.45]], 0.06, 'pl', { plane: 'zy', jit: 0.02 }));
    s.push(box(sx * 4.12, 4.62, -1.9, sx * 4.26, 4.72, 2.0, 'wdK'));
    s.push(box(sx * 4.12, 4.7, -0.07, sx * 4.26, 5.75, 0.07, 'wdK'));
    s.push(sph([sx * 4.2, 6.05, 0.05], 0.26, 'kwD', { jit: 0.03 }));                     // onigawara
  }
  // ridge smoke vent (kemuridashi) with a little gable cap
  s.push(box(-3.0, 5.8, -0.35, -2.0, 6.25, 0.45, 'kwD', { jit: 0.03 }), box(-3.1, 6.25, -0.5, -1.9, 6.35, 0.6, 'kw'));
  // potted plants + water jar by the door
  for (const [x, c] of [[-4.6, 'lf'], [-1.6, 'msL']]) { s.push(vcyl(x, 2.75, 0, 0.35, 0.18, '#9e4539', { jit: 0.04 })); s.push(sph([x, 0.55, 2.75], 0.25, c, { noise: 0.05, noiseScale: 0.1, top: 'lfL', jit: 0.06 })); }
  s.push(vcyl(-1.05, 2.8, 0, 0.55, 0.28, 'kwD', { jit: 0.03 }), vcyl(-1.05, 2.8, 0.5, 0.56, 0.22, 'wa'));
  prop('kominka', vs, s, { footprint: [10.2, 5.8], solid: true, light: { color: '#ffb35c', intensity: 2.5, y: 1.6, range: 6, night: true }, tags: ['farm', 'house', 'building'] },
    { fx: [{ part: 'body', at: [-2.5, 6.4, 0.05], type: 'smoke', rate: 0.6, scale: 1.4 }] });
}

// ---- kura storehouse: white plaster, namako diamond tiles, heavy gable roof ----
{
  const vs = 0.08, s = [];
  s.push(box(-2.0, 0, -2.0, 2.0, 0.24, 2.0, 'st', { dither: { col: 'stD', amt: 0.3 } }));
  s.push(box(-1.85, 0.24, -1.85, 1.85, 4.6, 1.85, 'wh', { dither: { col: 'whD', amt: 0.05 }, jit: 0.02 }));
  s.push(box(-1.9, 0.24, -1.9, 1.9, 1.55, 1.9, 'nk', { jit: 0.02 }));
  // namako: white raised joints in a diamond grid on the front + sides
  const rows = [];
  const W = 48, H = 16;
  for (let r = 0; r < H; r++) { let row = ''; for (let c = 0; c < W; c++) row += ((c + r) % 6 === 0 || (c - r + 600) % 6 === 0) ? 'w' : '.'; rows.push(row); }
  s.push(...bitmap(rows, [-1.88, 1.5, 1.93], vs, 0.035, { w: 'w' }, 'xy', { snap: vs }));
  s.push(...bitmap(rows, [1.93, 1.5, 1.88], vs, 0.035, { w: 'w' }, 'zy', { snap: vs }));
  s.push(...bitmap(rows, [-1.93, 1.5, 1.88], vs, 0.035, { w: 'w' }, 'zy', { snap: vs }));
  s.push(box(-1.95, 1.55, -1.95, 1.95, 1.7, 1.95, 'whD'));
  // heavy kura door: stepped plaster frame, dark studded door slightly open
  s.push(box(-0.75, 0.24, 1.85, 0.75, 2.5, 2.05, 'whD', { jit: 0.02 }));
  s.push(box(-0.55, 0.24, 1.9, 0.55, 2.3, 2.1, 'k', { sub: 1 }));
  s.push(box(-0.55, 0.24, 1.86, 0.55, 2.3, 1.9, '#2a2420'));
  s.push(box(-0.55, 0.24, 1.95, -0.05, 2.3, 2.02, 'wdK', { spots: { col: 'mtD', d: 0.08, s: 0.06, seed: 4 } }));
  // high window with thick open shutters + iron wall anchors
  s.push(box(-0.4, 3.2, 1.86, 0.4, 3.85, 1.92, 'ink'));
  for (const sx of [-1, 1]) s.push(box(sx * 0.42, 3.15, 1.85, sx * 0.78, 3.9, 2.02, 'wh', { jit: 0.02 }));
  for (const x of [-1.4, 1.4]) for (const y of [2.4, 3.6]) s.push(box(x - 0.08, y - 0.08, 1.85, x + 0.08, y + 0.08, 1.93, 'ink'));
  // gable roof with deep eaves, onigawara ends and a white crest disc
  s.push(...steppedRoof([0, 4.55, 0], 2.45, 2.55, 9, 0.27, 0.2, 'kw', KAWARA, 2.45, 'kwD'));
  for (const sx of [-1, 1]) {
    s.push(poly([sx * 1.88, 4.6, 0], [[-1.85, 0], [1.85, 0], [0, 1.55]], 0.06, 'wh', { plane: 'zy', jit: 0.02 }));
    s.push(sph([sx * 2.45, 6.55, 0], 0.22, 'kwD'));
  }
  s.push(tor([0, 5.35, 1.82], 0.16, 0.035, 'ink', { axis: 'z' }));
  prop('kura', vs, s, { footprint: [4, 4], solid: true, tags: ['farm', 'building', 'storehouse'] });
}

// ---- yakisugi barn (naya): charred boards, rusty corrugated roof, open front full of hay ----
{
  const vs = 0.1, s = [];
  s.push(box(-4.0, 0, -2.6, 4.0, 3.4, 2.6, 'ys', { stripes: { axis: 'x', p: 0.3, w: 0.1, col: 'ysL' }, jit: 0.02 }));
  s.push(box(-4.05, 0, -2.65, 4.05, 0.3, 2.65, 'st', { dither: { col: 'stD', amt: 0.3 } }));
  s.push(box(-3.4, 0, -2.1, 1.0, 2.9, 2.8, 'k', { sub: 1 }));                      // open bay (deep)
  s.push(box(-3.4, 0, -2.25, 1.0, 2.9, -2.1, '#6a4a32', { stripes: { axis: 'x', p: 0.3, w: 0.04, col: '#4e3624' }, jit: 0.03 }));
  s.push(box(-3.4, 2.75, -2.2, 1.0, 2.9, 2.0, '#4e3624'));
  for (const z of [-1.0, 0.4]) s.push(box(-3.4, 2.55, z - 0.07, 1.0, 2.7, z + 0.07, 'wdK'));
  s.push(box(-3.45, 2.9, 2.0, 1.05, 3.05, 2.65, 'wdK'));
  for (const x of [-3.45, -1.2, 1.05]) s.push(box(x - 0.1, 0, 2.45, x + 0.1, 2.95, 2.65, 'wdK'));
  // inside: hay bales, pitchfork, a hanging bulb and a parked hand-tiller
  for (const [x, y, z] of [[-3.0, 0, 0.6], [-2.1, 0, 0.6], [-2.55, 0.5, 0.6], [-3.0, 0, 1.3]]) s.push(box(x - 0.42, y, z - 0.3, x + 0.42, y + 0.5, z + 0.3, 'hy', { stripes: { axis: 'x', p: 0.28, w: 0.04, col: 'hyD' }, dither: { col: 'hyL', amt: 0.2 }, jit: 0.04 }));
  s.push(cap([-0.4, 0.05, 1.7], [-0.25, 2.0, 1.75], 0.03, 0.03, 'wd'), box(-0.4, 1.95, 1.65, -0.1, 2.25, 1.8, 'mtD'));
  s.push(cyl([-1.2, 2.9, 1.5], [-1.2, 2.55, 1.5], 0.02, 'ink'), sph([-1.2, 2.48, 1.5], 0.09, 'litL', { glow: 3 }));
  s.push(box(0.0, 0, 0.8, 0.7, 0.55, 1.6, '#d83a3c', { jit: 0.04 }), tor([0.35, 0.25, 1.65], 0.22, 0.06, 'ink', { axis: 'z' }), cap([0.35, 0.55, 0.9], [0.35, 1.05, 0.2], 0.03, 0.03, 'mtD'));
  // closed sliding door (right) of galvanised sheet, rust streaks
  s.push(box(1.25, 0, 2.6, 3.7, 2.8, 2.72, 'ga', { stripes: { axis: 'x', p: 0.14, w: 0.05, col: 'gaD' }, dither: { col: 'ru', amt: 0.12 }, jit: 0.03 }));
  s.push(box(1.2, 2.8, 2.6, 3.75, 2.9, 2.8, 'ink'));
  // corrugated rust roof (gable along x)
  s.push(...steppedRoof([0, 3.35, 0], 4.45, 3.05, 9, 0.33, 0.18, 'ru', { stripes: { axis: 'x', p: 0.2, w: 0.07, col: 'ruD' }, dither: { col: '#a8705a', amt: 0.05 }, top: '#9a6448', topT: 0.7, jit: 0.03 }, 4.45, 'ruD'));
  for (const sx of [-1, 1]) s.push(poly([sx * 4.02, 3.4, 0], [[-2.55, 0], [2.55, 0], [0, 1.45]], 0.05, 'ys', { plane: 'zy', stripes: { axis: 'z', p: 0.25, w: 0.05, col: 'ysL' } }));
  // lamp over the door + tool rack outside
  s.push(box(-1.4, 3.05, 2.65, -1.0, 3.15, 2.95, 'mtD'), box(-1.3, 2.95, 2.8, -1.1, 3.05, 2.9, 'litL', { glow: 3 }));
  s.push(box(3.9, 0, 0.0, 4.15, 2.0, 1.6, 'wdD'));
  for (const z of [0.3, 0.8, 1.3]) s.push(cap([4.2, 0.1, z], [4.25, 1.9, z + 0.05], 0.025, 0.025, 'wd'));
  prop('yakisugi_barn', vs, s, { footprint: [8, 5.2], solid: true, light: { color: '#ffc27a', intensity: 3, y: 2.9, range: 7, night: true }, tags: ['farm', 'barn', 'building'] });
}

// ---- white kei truck (EV), seen side-on (long axis = x, cab at +x) ----
{
  const vs = 0.05, s = [];
  for (const x of [-1.15, 1.1]) for (const z of [-0.62, 0.62]) {
    s.push(cyl([x, 0.28, z - 0.11], [x, 0.28, z + 0.11], 0.28, 'ink', { jit: 0.02 }));
    s.push(cyl([x, 0.28, z + Math.sign(z) * 0.1], [x, 0.28, z + Math.sign(z) * 0.13], 0.15, 'mtL'));
  }
  s.push(box(-1.7, 0.38, -0.72, 1.72, 0.62, 0.72, 'whD', { jit: 0.02 }));
  // cab
  s.push(box(0.72, 0.6, -0.74, 1.72, 1.82, 0.74, 'wh', { round: 0.06, jit: 0.02 }));
  s.push(box(0.85, 1.12, -0.76, 1.6, 1.7, 0.76, '#4e6a88', { top: '#8fb4d8', topT: 0.9, jit: 0.02 }));
  s.push(box(1.7, 1.12, -0.62, 1.76, 1.72, 0.62, '#4e6a88', { jit: 0.02 }));
  s.push(box(1.18, 0.65, -0.76, 1.22, 1.1, 0.76, 'whD'));
  s.push(box(1.72, 0.66, -0.55, 1.78, 0.8, -0.35, 'nw', { glow: 2 }), box(1.72, 0.66, 0.35, 1.78, 0.8, 0.55, 'nw', { glow: 2 }));
  s.push(box(1.73, 0.4, -0.2, 1.79, 0.58, 0.2, '#f2d84a'));                        // yellow kei plate
  s.push(box(1.4, 1.25, 0.76, 1.48, 1.4, 0.92, 'ink'));
  // flat bed with drop-side gates + yellow harvest crates
  s.push(box(-1.7, 0.62, -0.74, 0.7, 0.68, 0.74, 'mtD'));
  s.push(box(-1.7, 0.68, 0.66, 0.7, 1.05, 0.74, 'wh', { stripes: { axis: 'x', p: 0.6, w: 0.03, col: 'whD' } }));
  s.push(box(-1.7, 0.68, -0.74, 0.7, 1.05, -0.66, 'wh'));
  s.push(box(-1.74, 0.68, -0.74, -1.66, 1.05, 0.74, 'wh'));
  for (const [x, z, c] of [[-1.25, 0.25, '#f9c22b'], [-0.6, 0.25, '#4d65b4'], [-1.25, -0.35, '#f9c22b'], [-0.6, -0.35, '#f9c22b'], [-0.95, 0.0, '#f9c22b']]) {
    const y0 = x === -0.95 ? 1.06 : 0.68;
    s.push(box(x - 0.3, y0, z - 0.22, x + 0.3, y0 + 0.38, z + 0.22, c, { jit: 0.02 }), box(x - 0.2, y0 + 0.24, z + 0.2, x + 0.2, y0 + 0.3, z + 0.24, 'k', { sub: 1 }));
    s.push(sph([x - 0.12, y0 + 0.42, z], 0.13, x < -1 ? 'cb' : '#e8d29a', { top: x < -1 ? 'cbL' : '#f6e8c0', jit: 0.04 }), sph([x + 0.13, y0 + 0.4, z + 0.05], 0.12, x < -1 ? 'cb' : '#e8d29a', { jit: 0.04 }));
  }
  s.push(box(0.55, 0.45, 0.72, 0.68, 0.6, 0.76, 'nc', { glow: 2 }));                // EV charge port light
  prop('kei_truck', vs, s, { footprint: [3.4, 1.5], solid: true, destructible: true, hp: 160, debris: ['#f4f2ec', '#252932', '#f9c22b'], tags: ['farm', 'vehicle'] });
}

// ---- utility pole (concrete, transformer, crossarm) with a wire span to +x ----
function utilityPole() {
  const vs = 0.05, s = [];
  s.push(cap([0, 0, 0], [0, 8.4, 0], 0.17, 0.12, '#b8b4ac', { dither: { col: '#9a968e', amt: 0.18 }, jit: 0.03 }));
  s.push(vcyl(0, 0, 0.4, 2.0, 0.19, '#f9c22b', { stripes: { axis: 'y', p: 0.4, w: 0.2, col: '#252932' } }));
  s.push(box(-0.13, 3.0, 0.15, 0.13, 3.4, 0.2, '#2a6ad0'), box(-0.1, 3.05, 0.19, 0.1, 3.35, 0.21, 'w', { paint: 1, stripes: { axis: 'y', p: 0.1, w: 0.04, col: '#2a6ad0' } }));
  s.push(box(-0.08, 7.75, -0.85, 0.08, 7.9, 0.85, 'mtD'));
  s.push(box(-0.08, 7.05, -0.6, 0.08, 7.18, 0.6, 'mtD'));
  for (const z of [-0.75, 0, 0.75]) s.push(vcyl(0, z, 7.9, 8.1, 0.06, 'w'));
  for (const z of [-0.5, 0.5]) s.push(vcyl(0, z, 7.18, 7.34, 0.05, 'w'));
  s.push(vcyl(0, 0.38, 5.6, 6.5, 0.24, '#8f979e', { jit: 0.03 }), vcyl(0, 0.38, 6.5, 6.58, 0.26, '#6f7884'));
  s.push(cap([0, 6.55, 0.38], [0, 7.1, 0.5], 0.03, 0.03, 'ink'));
  s.push(cap([0, 3.2, 0], [0, 7.0, 0], 0.05, 0.05, '#c9c4ba'));                   // step bolts / conduit
  return s;
}
// power-line span (pole tops at x = 0 and x = span) with crows; fine voxels so the wires read as 1–2 px lines
function wireSpan(span, vs) {
  const s = [];
  const wires = [[8.05, -0.75], [8.05, 0.75], [7.36, 0.5]];
  for (const [y, z] of wires) s.push(...tube(bez([0, y, z], [span / 2, y - 1.3, z], [span, y, z], 12), 0.026, 0.026, '#3a3644'));
  s.push(...tube(bez([0, 5.0, 0.2], [span / 2, 4.2, 0.2], [span, 5.0, 0.2], 12), 0.03, 0.03, '#3a3644'));
  for (const t of [0.3, 0.37, 0.72]) {
    const x = span * t, y = 8.05 - 4 * t * (1 - t) * 1.3;
    s.push(ell([x, y + 0.13, -0.75], [0.12, 0.09, 0.07], '#1c1a22'), sph([x + 0.1, y + 0.2, -0.75], 0.06, '#1c1a22'), vox(vs, x + 0.17, y + 0.2, -0.75, '#4a4450'));
    s.push(cap([x - 0.08, y + 0.11, -0.75], [x - 0.22, y + 0.05, -0.75], 0.045, 0.02, '#1c1a22'));
  }
  return s;
}
prop('utility_pole', 0.05, utilityPole(), { footprint: [0.4, 0.4], solid: true, tags: ['farm', 'street', 'pole'] });
prop('power_wires', 0.035, wireSpan(18, 0.035), { footprint: [0.2, 0.2], solid: false, tags: ['farm', 'street', 'pole'] });

// ---- hokora roadside shrine + mini torii + offerings ----
{
  const vs = 0.04, s = [];
  s.push(box(-0.5, 0, -0.45, 0.5, 0.42, 0.4, 'st', { dither: { col: 'stD', amt: 0.3 }, jit: 0.05 }));
  s.push(box(-0.4, 0.42, -0.35, 0.4, 0.5, 0.3, 'stW'));
  s.push(box(-0.3, 0.5, -0.3, 0.3, 1.0, 0.2, 'wd', { stripes: { axis: 'x', p: 0.12, w: 0.03, col: 'wdD' }, jit: 0.04 }));
  s.push(box(-0.16, 0.56, 0.18, 0.16, 0.92, 0.24, 'wdK', { stripes: { axis: 'x', p: 0.08, w: 0.03, col: 'lit' } }));
  s.push(...steppedRoof([0, 0.98, -0.05], 0.44, 0.48, 5, 0.08, 0.06, 'cg', { top: 'cgL', topT: 0.6 }, 0.44, 'cgD'));
  s.push(...bitmap(['a.', 'aa', '.a', 'aa'], [-0.04, 0.95, 0.27], 0.04, 0.012, { a: 'w' }, 'xy'));
  // mini torii
  for (const sx of [-0.28, 0.28]) s.push(vcyl(sx, 0.62, 0, 0.62, 0.035, 'vm'));
  s.push(box(-0.4, 0.62, 0.58, 0.4, 0.68, 0.66, 'k'), box(-0.33, 0.52, 0.59, 0.33, 0.56, 0.65, 'vm'));
  // offerings: sake cups, sakaki vases, a little stone fox
  for (const sx of [-0.3, 0.3]) { s.push(vcyl(sx, 0.08, 0.42, 0.6, 0.05, 'w')); s.push(sph([sx, 0.68, 0.08], 0.07, 'lfD', { top: 'lf' })); }
  s.push(vcyl(0, 0.27, 0.42, 0.47, 0.04, 'w'));
  s.push(ell([0.38, 0.12, 0.62], [0.06, 0.12, 0.05], 'stW'), sph([0.38, 0.27, 0.64], 0.05, 'stW'), box(0.35, 0.18, 0.66, 0.41, 0.21, 0.69, 'vm'));
  prop('hokora', vs, s, { footprint: [1, 0.9], solid: true, tags: ['farm', 'shrine'] });
}

// ---- three roadside jizō in red bibs and knit caps under a small roof ----
{
  const vs = 0.03, s = [];
  s.push(box(-0.75, 0, -0.3, 0.75, 0.12, 0.3, 'st', { dither: { col: 'stD', amt: 0.3 } }));
  for (const [i, x] of [-0.48, 0, 0.48].entries()) {
    const h = i === 1 ? 0.62 : 0.54;
    s.push(cap([x, 0.12, 0], [x, 0.12 + h * 0.62, 0], 0.17, 0.14, 'stW', { dither: { col: 'stD', amt: 0.2 }, jit: 0.04 }));
    s.push(sph([x, 0.12 + h * 0.8, 0.01], 0.13, 'stW', { jit: 0.04 }));
    s.push(ell([x, 0.12 + h * 0.52, 0.06], [0.16, 0.12, 0.13], 'vm', { jit: 0.03 }));
    s.push(ell([x, 0.12 + h * 0.92, 0], [0.13, 0.08, 0.13], i === 1 ? '#e2482e' : '#d83a3c', { jit: 0.04 }));
    s.push(vox(vs, x - 0.045, 0.12 + h * 0.8, 0.13, 'stK'), vox(vs, x + 0.045, 0.12 + h * 0.8, 0.13, 'stK'));
  }
  for (const sx of [-0.72, 0.72]) s.push(box(sx - 0.04, 0, -0.28, sx + 0.04, 1.2, -0.2, 'wdD'));
  s.push(box(-0.85, 1.2, -0.45, 0.85, 1.26, 0.38, 'wdD', { stripes: { axis: 'x', p: 0.12, w: 0.03, col: 'wdK' } }));
  for (const x of [-0.25, 0.25]) { s.push(vcyl(x, 0.24, 0.12, 0.3, 0.04, 'cg')); s.push(sph([x, 0.36, 0.24], 0.06, '#f9c22b')); }
  prop('jizo', vs, s, { footprint: [1.5, 0.6], solid: true, tags: ['farm', 'shrine'] });
}

// ---- honour-system vegetable stand (coin box, produce bags, hand-made sign board) ----
{
  const vs = 0.04, s = [];
  for (const x of [-0.78, 0.78]) for (const z of [-0.36, 0.36]) s.push(box(x - 0.04, 0, z - 0.04, x + 0.04, z > 0 ? 1.75 : 1.95, z + 0.04, 'wd', WOOD('wdD')));
  for (const y of [0.45, 0.95]) s.push(box(-0.82, y, -0.4, 0.82, y + 0.05, 0.42, 'wdL', { stripes: { axis: 'x', p: 0.2, w: 0.02, col: 'wd' } }));
  s.push(box(-0.82, 0.45, -0.42, 0.82, 1.2, -0.38, 'wdL', { stripes: { axis: 'x', p: 0.2, w: 0.02, col: 'wd' } }));
  s.push(box(-0.92, 1.76, -0.55, 0.92, 1.82, 0.62, '#4f8e7d', { stripes: { axis: 'x', p: 0.1, w: 0.03, col: '#3d6e62' }, rot: [-8, 0, 0] }));
  const veg = [['cb', 'cbL'], ['#e8d29a', '#f6e8c0'], ['#5a2a6a', '#8a4a9a'], ['#e2482e', '#f47a52']];
  veg.forEach(([c, t], i) => {
    const x = -0.6 + i * 0.4;
    s.push(box(x - 0.15, 0.5, -0.05, x + 0.15, 0.56, 0.3, 'wdP'));
    s.push(sph([x - 0.06, 0.65, 0.1], 0.1, c, { top: t, jit: 0.04 }), sph([x + 0.07, 0.64, 0.16], 0.09, c, { top: t, jit: 0.04 }));
    s.push(ell([x, 1.1, 0.12], [0.13, 0.13, 0.1], i % 2 ? '#eef2f4' : '#e6f0e6', { jit: 0.03 }), sph([x, 1.1, 0.16], 0.08, c, { paint: 1 }));
  });
  s.push(box(0.52, 1.0, 0.25, 0.75, 1.22, 0.42, '#d83a3c', { jit: 0.02 }), box(0.58, 1.2, 0.3, 0.7, 1.23, 0.36, 'ink'));
  s.push(box(-0.8, 1.3, 0.38, 0.8, 1.72, 0.44, 'cr', { jit: 0.02 }));                   // sign board (text = panel)
  prop('veg_stand', vs, s, { footprint: [1.7, 0.9], solid: true, destructible: true, hp: 40, debris: ['#a8744a', '#a8d07a', '#e8d29a'], tags: ['farm', 'shop'] });
}

// ---- onion-drying hut (tamanegi-goya): slatted shed hung with onion bunches ----
{
  const vs = 0.06, s = [];
  for (const x of [-2.0, -0.67, 0.67, 2.0]) for (const z of [-1.4, 1.4]) s.push(box(x - 0.07, 0, z - 0.07, x + 0.07, 2.9, z + 0.07, 'wdD', WOOD()));
  for (let y = 0.5; y < 2.8; y += 0.38) { s.push(box(-2.05, y, -1.48, 2.05, y + 0.12, -1.38, 'wd', WOOD('wdD', 0.12))); for (const sx of [-1, 1]) s.push(box(sx * 2.0 - 0.05, y, -1.4, sx * 2.0 + 0.05, y + 0.12, 1.4, 'wd', WOOD('wdD', 0.12))); }
  for (let y = 1.6; y < 2.8; y += 0.38) s.push(box(-2.05, y, 1.38, 2.05, y + 0.12, 1.48, 'wd', WOOD('wdD', 0.12)));
  for (const y of [2.55]) for (const z of [-0.7, 0, 0.7]) s.push(box(-2.0, y, z - 0.04, 2.0, y + 0.08, z + 0.04, 'wdK'));
  const r = rng(17);
  for (const z of [-0.7, 0, 0.7]) for (let x = -1.8; x <= 1.8; x += 0.3) {
    const len = 0.5 + r() * 0.35;
    s.push(cap([x, 2.55, z], [x + (r() - 0.5) * 0.06, 2.55 - len * 0.5, z], 0.025, 0.025, '#8a7a3a'));
    s.push(ell([x, 2.55 - len, z], [0.13, len * 0.45, 0.12], r() < 0.5 ? '#d9a85a' : '#c99448', { dither: { col: '#e8c27a', amt: 0.3 }, jit: 0.05 }));
  }
  s.push(...steppedRoof([0, 2.9, 0], 2.4, 1.8, 6, 0.28, 0.12, 'ga', { stripes: { axis: 'x', p: 0.12, w: 0.04, col: 'gaD' }, dither: { col: 'ru', amt: 0.18 } }, 2.4, 'gaD'));
  prop('onion_hut', vs, s, { footprint: [4.2, 3], solid: true, tags: ['farm', 'building'] });
}

// ---- vinyl greenhouse tunnel (arched end faces the camera, open door, tomatoes inside) ----
{
  const vs = 0.1, s = [];
  s.push(cyl([0, 0.45, -3.5], [0, 0.45, 3.5], 2.05, '#e3ebee', { stripes: { axis: 'z', p: 0.9, w: 0.08, col: '#b9c4c9' }, dither: { col: '#f4f8fa', amt: 0.15 }, jit: 0.02 }));
  s.push(cyl([0, 0.45, -3.6], [0, 0.45, 3.6], 1.93, 'k', { sub: 1 }));
  // end walls: film with an open door
  s.push(poly([0, 0, 3.22], [[-1.93, 0], [1.93, 0], [1.85, 0.7], [1.55, 1.45], [0.95, 2.05], [0, 2.32], [-0.95, 2.05], [-1.55, 1.45], [-1.85, 0.7]], 0.04, '#d9e3e7', { plane: 'xy', dither: { col: '#eef4f6', amt: 0.2 } }));
  s.push(box(-0.5, 0, 3.1, 0.5, 1.9, 3.4, 'k', { sub: 1 }));
  s.push(box(-0.55, 0, 3.18, -0.5, 1.95, 3.28, 'mt'), box(0.5, 0, 3.18, 0.55, 1.95, 3.28, 'mt'), box(-0.55, 1.9, 3.18, 0.55, 1.95, 3.28, 'mt'));
  s.push(box(0.6, 0, 3.24, 1.55, 1.85, 3.28, '#c9d4d8', { stripes: { axis: 'x', p: 0.3, w: 0.03, col: 'mt' } }));
  // tomato rows inside (seen through the door)
  for (const x of [-1.1, 0, 1.1]) {
    s.push(box(x - 0.3, 0, -1.0, x + 0.3, 0.15, 3.0, 'ed', { dither: { col: 'edD', amt: 0.3 } }));
    for (let z = -0.8; z < 2.9; z += 0.6) {
      s.push(cap([x, 0.1, z], [x, 1.5, z], 0.04, 0.03, '#c9b46a'));
      s.push(ell([x, 1.0, z], [0.22, 0.55, 0.22], 'lfD', { noise: 0.05, noiseScale: 0.1, top: 'lf', jit: 0.06 }));
      s.push(sph([x + 0.15, 0.8, z + 0.12], 0.06, '#e2482e'), sph([x - 0.12, 1.15, z - 0.1], 0.055, '#f47a52'));
    }
  }
  s.push(box(-2.0, 0, -3.6, 2.0, 0.08, 3.6, 'ed'));
  prop('greenhouse', 0.1, s, { footprint: [4.1, 7.0], solid: true, tags: ['farm', 'building'] });
}

// ---- rice seedlings for a flooded paddy (2×2 m patch; place on water with a y override) ----
{
  const vs = 0.04, s = [];
  const r = rng(29);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    const x = -0.8 + i * 0.4 + (r() - 0.5) * 0.05, z = -0.8 + j * 0.4;
    for (let k = 0; k < 3; k++) { const a = r() * 6.28; s.push(cap([x, 0, z], [x + Math.cos(a) * 0.06, 0.28 + r() * 0.12, z + Math.sin(a) * 0.04], 0.025, 0.02, k ? 'sd' : 'sdD', { jit: 0.05 })); }
  }
  prop('paddy_rice', vs, s, { footprint: [2, 2], solid: false, tags: ['farm', 'crop', 'water'] });
}

// ---- onion rows (2 m along x) ----
{
  const vs = 0.04, s = [];
  s.push(box(-1.0, 0, -0.3, 1.0, 0.1, 0.3, 'ed', { dither: { col: 'edL', amt: 0.3 }, jit: 0.05 }));
  const r = rng(41);
  for (let x = -0.85; x < 0.9; x += 0.24) for (const z of [-0.12, 0.13]) {
    s.push(sph([x, 0.13, z], 0.08, '#e8d29a', { top: '#f6e8c0', jit: 0.04 }));
    for (let k = 0; k < 3; k++) s.push(cap([x, 0.18, z], [x + (r() - 0.5) * 0.18, 0.45 + r() * 0.2, z + (r() - 0.5) * 0.12], 0.025, 0.02, k ? '#5d9f42' : '#93cc62'));
  }
  prop('onion_row', vs, s, { footprint: [2, 0.7], solid: false, destructible: true, hp: 10, debris: ['#5d9f42', '#e8d29a'], tags: ['farm', 'crop'] });
}

// ---- broadleaf trees: persimmon by the house, big camphor over the shrine ----
function broadleaf(seed, { vs = 0.09, h = 2.4, spread = 1.6, blobs = 7, size = 0.9, leaf = '#3e7b35', top = '#5d9f42', under = '#2c5a2b', speck = '#93cc62', fruit = null, bark = '#5e5048' } = {}) {
  const r = rng(seed), body = [], crown = [];
  const barkO = { dither: { col: '#3e342e', amt: 0.25 }, jit: 0.05 };
  body.push(cap([0, 0, 0], [0.1, h * 0.55, 0], 0.26 * size, 0.18 * size, bark, barkO));
  for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4; body.push(cap([0, 0.3, 0], [Math.cos(a) * 0.5 * size, 0.02, Math.sin(a) * 0.5 * size], 0.14 * size, 0.06, bark, barkO)); }
  const tips = [];
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + r(); const tip = [Math.cos(a) * spread * 0.6, h * (0.85 + r() * 0.2), Math.sin(a) * spread * 0.45]; tips.push(tip); body.push(...tube(bez([0.1, h * 0.5, 0], [tip[0] * 0.4, h * 0.75, tip[2] * 0.4], tip, 3), 0.13 * size, 0.06, bark, barkO)); }
  const O = { noise: 0.12 * size, noiseScale: 0.28, top, topT: 0.45, belly: under, bellyT: 0.3, dither: { col: speck, amt: 0.07 }, jit: 0.05 };
  for (let i = 0; i < blobs; i++) {
    const a = r() * 6.283, d = r() * spread * 0.8;
    crown.push(ell([Math.cos(a) * d, h * (0.95 + r() * 0.35), Math.sin(a) * d * 0.7], [spread * (0.45 + r() * 0.25), size * (0.55 + r() * 0.2), spread * (0.4 + r() * 0.2)], leaf, O));
  }
  crown.push(ell([0, h * 1.3, 0], [spread * 0.6, size * 0.7, spread * 0.5], leaf, O));
  if (fruit) for (let i = 0; i < 9; i++) { const a = r() * 6.283; crown.push(sph([Math.cos(a) * spread * 0.85, h * (0.9 + r() * 0.4), Math.sin(a) * spread * 0.55 + 0.25], 0.09, fruit, { glow: 0 })); }
  return [{ n: 'body', p: [0, 0, 0], s: body }, { n: 'crown', p: [0, h * 0.6, 0], s: crown, sway: { axis: 'z', amp: 0.01, freq: 0.35 } }];
}
prop('kaki_tree', 0.09, broadleaf(7, { h: 2.3, spread: 1.7, size: 0.95, leaf: '#3f8236', top: '#6aab48', under: '#285a2a', fruit: '#9fc24a' }), { footprint: [0.7, 0.7], solid: true, tags: ['farm', 'tree'] });
prop('kusu_tree', 0.11, broadleaf(19, { vs: 0.11, h: 3.6, spread: 2.9, blobs: 10, size: 1.4, leaf: '#356e34', top: '#5a9a42', under: '#21482a', speck: '#7fb85a', bark: '#4e4440' }), { footprint: [1.0, 1.0], solid: true, tags: ['farm', 'tree', 'shrine'] });

// ---- chicken coop with a mesh run ----
{
  const vs = 0.05, s = [];
  s.push(box(-0.9, 0.3, -0.6, 0.3, 1.25, 0.5, 'wd', { stripes: { axis: 'x', p: 0.2, w: 0.03, col: 'wdD' }, jit: 0.04 }));
  for (const [x, z] of [[-0.85, -0.55], [0.25, -0.55], [-0.85, 0.45], [0.25, 0.45]]) s.push(box(x - 0.04, 0, z - 0.04, x + 0.04, 0.3, z + 0.04, 'wdD'));
  s.push(box(-1.05, 1.25, -0.75, 0.45, 1.32, 0.65, 'ga', { stripes: { axis: 'x', p: 0.12, w: 0.04, col: 'gaD' }, rot: [10, 0, 0], dither: { col: 'ru', amt: 0.15 } }));
  s.push(box(-0.45, 0.35, 0.5, -0.15, 0.7, 0.54, 'k'));
  s.push(box(-0.45, 0.06, 0.55, -0.15, 0.1, 1.1, 'wdL', { rot: [-35, 0, 0] }));
  s.push(box(0.3, 0.55, -0.3, 0.6, 0.9, 0.3, 'wdL'), box(0.32, 0.6, -0.26, 0.58, 0.85, 0.26, 'hy'));
  // mesh run (posts + light rails)
  for (const [x, z] of [[0.35, 0.55], [1.3, 0.55], [1.3, -0.55], [0.35, -0.55]]) s.push(box(x - 0.03, 0, z - 0.03, x + 0.03, 0.9, z + 0.03, 'wdD'));
  for (const y of [0.15, 0.45, 0.85]) { s.push(box(0.35, y, 0.54, 1.3, y + 0.03, 0.57, '#c9c9c4')); s.push(box(1.29, y, -0.55, 1.32, y + 0.03, 0.55, '#c9c9c4')); }
  for (let x = 0.45; x < 1.3; x += 0.1) s.push(box(x, 0, 0.55, x + 0.015, 0.88, 0.565, '#b8b8b4'));
  s.push(ell([0.9, 0.06, 0.1], [0.3, 0.04, 0.3], 'hyL'));
  prop('chicken_coop', vs, s, { footprint: [2.4, 1.3], solid: true, destructible: true, hp: 50, debris: ['#a8744a', '#9aa3ab'], tags: ['farm'] });
}

// ---- open-front cow shed: board back wall, stalls, hay rack, lean roof ----
{
  const vs = 0.08, s = [];
  s.push(box(-3.0, 0, -1.9, 3.0, 2.6, -1.7, 'wd', { stripes: { axis: 'x', p: 0.3, w: 0.04, col: 'wdD' }, dither: { col: 'wdK', amt: 0.1 }, jit: 0.04 }));
  for (const sx of [-3.0, 3.0]) s.push(box(sx - 0.1, 0, -1.9, sx + 0.1, 2.6, 1.6, 'wd', { stripes: { axis: 'z', p: 0.3, w: 0.04, col: 'wdD' }, jit: 0.04 }));
  for (const x of [-3.0, -1.0, 1.0, 3.0]) s.push(box(x - 0.1, 0, 1.5, x + 0.1, 3.1, 1.7, 'wdK', WOOD('#3e2a1c')));
  for (const x of [-1.0, 1.0]) s.push(box(x - 0.05, 0.3, -1.7, x + 0.05, 1.2, 0.9, 'wdD'), box(x - 0.05, 1.15, -1.7, x + 0.05, 1.25, 1.2, 'wdK'));
  s.push(box(-2.9, 1.3, -1.7, 2.9, 1.9, -1.35, 'wdD', { stripes: { axis: 'x', p: 0.15, w: 0.05, col: 'hy' } }));
  s.push(box(-2.9, 1.9, -1.65, 2.9, 2.15, -1.4, 'hy', { dither: { col: 'hyL', amt: 0.3 }, noise: 0.03 }));
  s.push(box(-2.9, 0, -1.7, 2.9, 0.12, 1.5, 'hyD', { dither: { col: 'ed', amt: 0.3 } }));
  s.push(box(-2.6, 0, 0.8, -1.4, 0.45, 1.2, 'stW'), box(-2.5, 0.35, 0.86, -1.5, 0.43, 1.14, 'wa'));
  // lean-to corrugated roof, high at the front, stepping down to the back
  for (let i = 0; i < 9; i++) { const z1 = 2.25 - i * 0.5, y = 3.15 - i * 0.07; s.push(box(-3.35, y, z1 - 0.52, 3.35, y + 0.12, z1, 'ga', { stripes: { axis: 'x', p: 0.16, w: 0.05, col: 'gaD' }, dither: { col: 'ru', amt: 0.12 }, jit: 0.03 })); }
  s.push(box(-3.35, 2.95, 2.1, 3.35, 3.15, 2.3, 'ruD'));
  prop('cow_shed', vs, s, { footprint: [6.2, 3.8], solid: true, tags: ['farm', 'building'] });
}

// ---- dog house with a red roof, name plate and bowl ----
{
  const vs = 0.04, s = [];
  s.push(box(-0.45, 0, -0.4, 0.45, 0.62, 0.4, 'wdL', { stripes: { axis: 'y', p: 0.12, w: 0.02, col: 'wd' }, jit: 0.04 }));
  for (const sx of [-1, 1]) s.push(box(0, 0.6, -0.5, sx * 0.58, 0.66, 0.5, 'rd', { rot: [0, 0, sx * 33], jit: 0.03 }));
  s.push(poly([0, 0.62, 0.4], [[-0.45, 0], [0.45, 0], [0, 0.3]], 0.02, 'wdL', { plane: 'xy' }));
  s.push(ell([0, 0.25, 0.42], [0.18, 0.25, 0.1], 'k', { sub: 1 }), box(-0.18, 0, 0.3, 0.18, 0.25, 0.45, 'k', { sub: 1 }));
  s.push(box(-0.12, 0.72, 0.4, 0.12, 0.8, 0.42, 'w'));
  s.push(vcyl(0.35, 0.65, 0, 0.08, 0.12, '#d83a3c'), vcyl(0.35, 0.65, 0.06, 0.09, 0.09, '#a8744a'));
  prop('dog_house', vs, s, { footprint: [0.9, 0.8], solid: true, destructible: true, hp: 30, debris: ['#c99a68', '#d83a3c'], tags: ['farm'] });
}

// ---- hand pump well with bucket ----
{
  const vs = 0.03, s = [];
  s.push(box(-0.45, 0, -0.45, 0.45, 0.15, 0.45, 'stW', { dither: { col: 'stD', amt: 0.25 } }));
  s.push(vcyl(0, 0, 0.15, 1.0, 0.09, '#3f5a52', { jit: 0.03 }), vcyl(0, 0, 1.0, 1.08, 0.11, '#2f4640'));
  s.push(cap([0, 0.8, 0.05], [0, 0.72, 0.32], 0.045, 0.04, '#3f5a52'));
  s.push(cap([0, 1.08, -0.05], [0, 1.35, -0.45], 0.03, 0.025, '#2f4640'));
  s.push(vcyl(0.0, 0.32, 0.15, 0.4, 0.13, 'ga', { stripes: { axis: 'y', p: 0.1, w: 0.02, col: 'gaD' } }), vcyl(0, 0.32, 0.36, 0.4, 0.1, 'wa'));
  s.push(ell([-0.25, 0.155, 0.25], [0.22, 0.01, 0.15], 'waD'));
  prop('hand_pump', vs, s, { footprint: [0.9, 0.9], solid: true, tags: ['farm'] });
}

// ---- agrivoltaic "solar sharing" array on stilts over crops ----
{
  const vs = 0.07, s = [];
  for (const x of [-1.8, 0, 1.8]) for (const z of [-0.9, 0.9]) s.push(box(x - 0.05, 0, z - 0.05, x + 0.05, 2.7, z + 0.05, 'mtL', { jit: 0.02 }));
  for (const z of [-0.9, 0.9]) s.push(box(-1.9, 2.6, z - 0.04, 1.9, 2.7, z + 0.04, 'mt'));
  for (const x of [-1.25, 0, 1.25]) s.push(box(x - 0.45, 2.75, -1.05, x + 0.45, 2.8, 1.05, '#1f2a4a', { stripes: { axis: 'z', p: 0.35, w: 0.03, col: '#5a7ab8' }, rot: [16, 0, 0], jit: 0.02 }));
  prop('agrivoltaic', vs, s, { footprint: [3.8, 2], solid: false, tags: ['farm', 'tech', '2050'] });
}

// ---- yellow + blue harvest crates (some full) ----
{
  const vs = 0.04, s = [];
  const crate = (x, y, z, c, fill) => {
    s.push(box(x - 0.27, y, z - 0.19, x + 0.27, y + 0.3, z + 0.19, c, { jit: 0.02 }));
    s.push(box(x - 0.13, y + 0.2, z + 0.17, x + 0.13, y + 0.25, z + 0.21, 'k', { sub: 1 }));
    s.push(box(x - 0.23, y + 0.27, z - 0.15, x + 0.23, y + 0.31, z + 0.15, 'k', { sub: 1 }));
    if (fill) for (const [dx, dz] of [[-0.12, -0.06], [0.12, 0.05], [0, 0.08], [-0.1, 0.08]]) s.push(sph([x + dx, y + 0.3, z + dz], 0.1, fill, { jit: 0.04 }));
  };
  crate(-0.3, 0, 0, '#f9c22b', '#e8d29a'); crate(0.3, 0, 0, '#f9c22b', 'cb'); crate(0, 0.31, -0.05, '#4d65b4', null); crate(0.0, 0, 0.45, '#f9c22b', '#e8d29a');
  prop('harvest_crates', vs, s, { footprint: [1.1, 0.9], solid: true, destructible: true, hp: 20, debris: ['#f9c22b', '#4d65b4', '#e8d29a'], tags: ['farm'] });
}

// ---- blue tarp pile weighed down with old tyres ----
{
  const vs = 0.05, s = [];
  s.push(ell([0, 0.25, 0], [0.85, 0.5, 0.6], '#3a6ad0', { noise: 0.06, noiseScale: 0.25, top: '#5a8ae8', topT: 0.6, jit: 0.04 }));
  s.push(ell([0.5, 0.2, 0.2], [0.45, 0.35, 0.35], '#3a6ad0', { noise: 0.05, noiseScale: 0.2, jit: 0.04 }));
  for (const [x, z] of [[-0.35, 0.1], [0.4, -0.1]]) s.push(tor([x, 0.68 - Math.abs(x) * 0.25, z], 0.2, 0.08, 'ink'));
  prop('tarp_pile', vs, s, { footprint: [1.6, 1.2], solid: true, destructible: true, hp: 30, debris: ['#3a6ad0', '#252932'], tags: ['farm'] });
}

// ---- bird scarer: bamboo pole with glinting CDs and a yellow eyeball balloon ----
{
  const vs = 0.03, s = [];
  s.push(cap([0, 0, 0], [0.05, 2.5, 0], 0.035, 0.025, '#c9b46a', { stripes: { axis: 'y', p: 0.35, w: 0.03, col: '#9c8a48' } }));
  s.push(cap([0.05, 2.45, 0], [0.9, 2.2, 0], 0.025, 0.02, '#c9b46a'));
  const cds = [];
  for (const [i, x] of [0.35, 0.6, 0.85].entries()) { cds.push(cyl([x, 2.3 - i * 0.05, 0], [x, 2.0 - i * 0.05, 0], 0.008, '#d8d8d8')); cds.push(cyl([x, 1.92 - i * 0.05, -0.012], [x, 1.92 - i * 0.05, 0.012], 0.09, 'mtL', { stripes: { axis: 'x', p: 0.06, w: 0.02, col: '#c9a8ff' }, glow: 1 })); }
  const ball = [cyl([0.08, 2.4, 0], [0.12, 1.7, 0.05], 0.008, '#d8d8d8'), sph([0.12, 1.5, 0.05], 0.2, '#f9c22b', { jit: 0.02 }), tor([0.12, 1.5, 0.24], 0.1, 0.03, '#d83a3c', { axis: 'z' }), sph([0.12, 1.5, 0.23], 0.06, 'ink'), vox(vs, 0.16, 1.55, 0.26, 'w')];
  prop('bird_scarer', vs, [{ n: 'body', p: [0, 0, 0], s }, { n: 'cds', p: [0.6, 2.3, 0], s: cds, sway: { axis: 'x', amp: 0.12, freq: 0.7 } }, { n: 'ball', p: [0.08, 2.4, 0], s: ball, sway: { axis: 'x', amp: 0.08, freq: 0.5, phase: 1 } }],
    { footprint: [0.4, 0.4], solid: false, tags: ['farm'] });
}

// ---- susuki (Japanese silver grass) clump with plumes ----
{
  const vs = 0.04, s = [], plumes = [];
  const r = rng(53);
  for (let i = 0; i < 16; i++) { const a = r() * 6.283, l = 0.6 + r() * 0.5; s.push(cap([0, 0, 0], [Math.cos(a) * l * 0.5, l, Math.sin(a) * l * 0.35], 0.03, 0.02, i % 3 ? '#7a9a4a' : '#9ab85a')); }
  for (let i = 0; i < 6; i++) { const a = r() * 6.283, x = Math.cos(a) * 0.2, z = Math.sin(a) * 0.15; plumes.push(cap([x, 0.3, z], [x * 1.6, 1.3 + r() * 0.3, z * 1.4], 0.015, 0.015, '#a8a070')); plumes.push(ell([x * 1.8 + 0.06, 1.38 + r() * 0.3, z * 1.5], [0.07, 0.2, 0.05], '#e6d6c6', { rot: [0, 0, -20], dither: { col: '#f2c6b6', amt: 0.4 } })); }
  prop('susuki', vs, [{ n: 'body', p: [0, 0, 0], s }, { n: 'plumes', p: [0, 0.3, 0], s: plumes, sway: { axis: 'z', amp: 0.08, freq: 0.6 } }], { footprint: [0.8, 0.8], solid: false, tags: ['farm', 'grass'] });
}

// ---- wooden sign board on two posts with a little roof (text = map panel; board face 2.6×1.0 m at y 1.1–2.1, z +0.1) ----
{
  const vs = 0.04, s = [];
  for (const sx of [-1.25, 1.25]) s.push(box(sx - 0.07, 0, -0.07, sx + 0.07, 2.45, 0.07, 'wdD', WOOD()));
  s.push(box(-1.32, 1.08, 0.02, 1.32, 2.12, 0.1, 'wdL', { stripes: { axis: 'y', p: 0.2, w: 0.02, col: 'wd' } }));
  s.push(box(-1.45, 2.42, -0.28, 1.45, 2.5, 0.34, 'kw', KAWARA), box(-1.35, 2.5, -0.18, 1.35, 2.56, 0.24, 'kwD'));
  prop('sign_board', vs, s, { footprint: [2.6, 0.3], solid: true, destructible: true, hp: 30, debris: ['#a8744a'], tags: ['sign'] });
}
// ---- white metal notice sign on a pole (text = map panel) ----
{
  const vs = 0.03, s = [];
  s.push(vcyl(0, 0, 0, 2.2, 0.035, 'mt'));
  s.push(box(-0.6, 1.35, 0.04, 0.6, 2.15, 0.07, 'w', { jit: 0.01 }), box(-0.6, 1.35, 0.03, 0.6, 2.15, 0.04, 'mtD'));
  s.push(box(-0.6, 2.05, 0.07, 0.6, 2.15, 0.08, '#2a6ad0', { paint: 1 }));
  prop('notice_sign', vs, s, { footprint: [0.3, 0.3], solid: true, destructible: true, hp: 20, debris: ['#ffffff'], tags: ['sign'] });
}

// ---- offshore wind turbine for the far bay (spinning rotor) ----
{
  const vs = 0.25, s = [];
  s.push(cap([0, 0, 0], [0, 26, 0], 0.9, 0.5, 'wh', { jit: 0.02 }));
  s.push(vcyl(0, 0, 0, 2.5, 1.1, '#f9c22b'));
  s.push(box(-0.6, 25.6, -1.6, 0.6, 26.8, 1.0, 'wh'));
  const blades = [];
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; blades.push(cap([0, 26.2, 1.2], [Math.cos(a) * 11, 26.2 + Math.sin(a) * 11, 1.2], 0.45, 0.2, 'w')); }
  blades.push(sph([0, 26.2, 1.3], 0.7, 'whD'));
  prop('wind_turbine', vs, [{ n: 'body', p: [0, 0, 0], s }, { n: 'rotor', p: [0, 26.2, 1.2], s: blades, spin: { axis: 'z', speed: 0.6 } }], { footprint: [2, 2], solid: true, tags: ['farm', 'far', '2050'] });
}


// =====================================================================
// OSAKA CASTLE PARK (training ground) — environments.md §2
// =====================================================================

// ---- ishigaki stone wall section (8 m along x) with curved batter, dobei plaster wall + tile cap ----
function ishigaki(seed, w = 8, h = 5.5, dobei = true) {
  const vs = 0.1, s = [], r = rng(seed);
  const rows = Math.round(h / 0.55);
  s.push(box(-w / 2, 0, -1.3, w / 2, h, -0.4, 'gnK'));
  for (let i = 0; i < rows; i++) {
    const t = i / (rows - 1), zf = 1.0 * (1 - t) * (1 - t) - 0.35, y0 = i * 0.55;
    s.push(box(-w / 2, y0, -1.3, w / 2, y0 + 0.55, zf - 0.08, 'gnK'));
    let x = -w / 2 - r() * 0.6;
    while (x < w / 2) {
      const bw = 0.7 + r() * 0.9, x0 = Math.max(-w / 2, x + 0.06), x1 = Math.min(w / 2, x + bw - 0.06);
      const c = ['gn', 'gnM', 'stW', 'gn'][Math.floor(r() * 4)];
      if (x1 - x0 > 0.15) s.push(box(x0, y0 + 0.06, -1.2, x1, y0 + 0.55 - 0.06, zf + r() * 0.08, c, { dither: { col: r() < 0.5 ? 'gnM' : 'gnK', amt: 0.12 }, jit: 0.05 }));
      x += bw;
    }
  }
  // moss + little ferns in the joints
  for (let k = 0; k < 7; k++) { const x = -w / 2 + r() * w, y = 0.3 + r() * (h - 0.8), t = y / h; s.push(ell([x, y, 1.0 * (1 - t) * (1 - t) - 0.3], [0.35, 0.12, 0.2], 'ms', { paint: 1, dither: { col: 'msD', amt: 0.3 } })); }
  for (let k = 0; k < 3; k++) { const x = -w / 2 + 0.5 + r() * (w - 1), y = 1.5 + r() * (h - 2.5), t = y / h; s.push(sph([x, y, 1.0 * (1 - t) * (1 - t) - 0.2], 0.2, 'lfD', { top: 'lf', noise: 0.05, noiseScale: 0.08 })); }
  if (dobei) {
    s.push(box(-w / 2, h, -1.0, w / 2, h + 0.35, -0.3, 'kwD'));
    s.push(box(-w / 2, h + 0.35, -0.95, w / 2, h + 1.45, -0.4, 'cp', { jit: 0.02 }));
    for (let x = -w / 2 + 0.7; x < w / 2; x += 1.6) s.push(box(x - 0.1, h + 0.75, -0.4, x + 0.1, h + 0.95, -0.38, 'ink'));
    s.push(box(-w / 2, h + 1.45, -1.25, w / 2, h + 1.6, -0.1, 'kw', KAWARA), box(-w / 2, h + 1.6, -1.05, w / 2, h + 1.72, -0.3, 'kw', KAWARA), box(-w / 2, h + 1.72, -0.82, w / 2, h + 1.84, -0.53, 'kwD'));
  }
  return s;
}
prop('ishigaki_wall', 0.1, ishigaki(5), { footprint: [8, 1.6], solid: true, tags: ['castle', 'wall'] });
prop('ishigaki_wall2', 0.1, ishigaki(11), { footprint: [8, 1.6], solid: true, tags: ['castle', 'wall'] });

// ---- Sakuramon-style masugata gate: koraimon gate between stone pylons, giant feature stone behind ----
{
  const vs = 0.1, s = [];
  for (const [sx, seed] of [[-1, 21], [1, 33]]) for (const sh of ishigaki(seed, 3.2, 5.5, true)) {
    if (sh[0] === 'box') { const c = sh[1].slice(); c[0] = c[0] + sx * 3.6; s.push(['box', c, sh[2], sh[3], sh[4]]); }
    else { const c = sh[1].slice(); c[0] += sx * 3.6; s.push([sh[0], c, ...sh.slice(2)]); }
  }
  // gate: two thick pillars with iron bands, tie beam, small kawara roof, doors swung open
  for (const sx of [-1, 1]) {
    s.push(box(sx * 1.95 - 0.25, 0, -0.2, sx * 1.95 + 0.25, 4.7, 0.3, 'wdK', { stripes: { axis: 'y', p: 0.9, w: 0.08, col: 'ink' }, jit: 0.03 }));
    s.push(box(sx * 1.95 - 0.12, 0, -0.9, sx * 1.95 + 0.12, 3.6, -0.6, 'wdK'));
    s.push(box(sx * 1.95 - 0.08, 0.1, 0.3, sx * 1.95 + sx * -0.05 + sx * 1.2, 3.8, 0.42, 'oakD', { rot: [0, sx * -70, 0], spots: { col: 'au', d: 0.05, s: 0.08, seed: 3 }, stripes: { axis: 'y', p: 0.6, w: 0.06, col: 'ink' } }));
  }
  s.push(box(-2.5, 4.1, -0.25, 2.5, 4.45, 0.35, 'wdK'), box(-2.3, 3.55, -0.15, 2.3, 3.75, 0.25, 'wdK'));
  s.push(...steppedRoof([0, 4.6, 0.05], 2.9, 1.05, 5, 0.18, 0.16, 'kw', KAWARA, 2.9, 'kwD'));
  for (const sx of [-1, 1]) s.push(sph([sx * 2.95, 5.55, 0.05], 0.18, 'kwD'));
  s.push(box(-0.3, 3.85, 0.3, 0.3, 4.1, 0.36, 'au'));
  // the masugata court floor + the giant feature stone (an octopus-shaped mottle, hidden detail)
  s.push(box(-2.0, 0, -4.5, 2.0, 0.06, 0.3, 'p' === 'p' ? 'gn' : 'gn', { dither: { col: 'gnM', amt: 0.3 } }));
  s.push(box(-3.4, 0, -5.0, 3.4, 4.8, -4.3, 'gn', { dither: { col: 'stW', amt: 0.18 }, jit: 0.03 }));
  s.push(box(-3.5, 0, -5.1, 3.5, 4.9, -4.7, 'gnK'));
  s.push(ell([-1.4, 1.5, -4.28], [0.55, 0.45, 0.04], 'gnM', { paint: 1 }));
  for (let k = 0; k < 5; k++) { const a = -0.3 - k * 0.32; s.push(...tube(bez([-1.4, 1.2, -4.28], [-1.4 + Math.cos(a) * 0.6, 1.0 + Math.sin(a) * 0.5, -4.28], [-1.4 + Math.cos(a) * 1.1, 0.6 + Math.sin(a) * 0.5, -4.28], 4), 0.1, 0.05, 'gnM', { paint: 1 })); }
  prop('castle_gate', vs, s, { footprint: [10.2, 1.8], solid: true, tags: ['castle', 'gate', 'landmark'] });
}

// ---- yagura corner turret: white plaster, black lower boards, copper-green roofs with gold fish ----
{
  const vs = 0.08, s = [];
  s.push(box(-2.6, 0, -2.0, 2.6, 2.7, 2.0, 'cp', { jit: 0.02 }));
  s.push(box(-2.65, 0, -2.05, 2.65, 0.9, 2.05, 'ink', { stripes: { axis: 'x', p: 0.3, w: 0.04, col: '#3a3640' } }));
  for (const x of [-1.6, 0, 1.6]) s.push(box(x - 0.35, 1.3, 2.0, x + 0.35, 1.9, 2.06, 'ink', { stripes: { axis: 'x', p: 0.14, w: 0.06, col: 'cpD' } }));
  s.push(...steppedRoof([0, 2.6, 0], 3.2, 2.6, 4, 0.22, 0.18, 'cu', { stripes: { axis: 'x', p: 0.22, w: 0.06, col: 'cuD' }, top: 'cuL', topT: 0.6 }, 2.2));
  s.push(box(-1.9, 3.3, -1.5, 1.9, 5.0, 1.5, 'cp', { jit: 0.02 }));
  for (const x of [-0.9, 0.9]) s.push(box(x - 0.3, 3.9, 1.5, x + 0.3, 4.5, 1.56, 'ink', { stripes: { axis: 'x', p: 0.14, w: 0.06, col: 'cpD' } }));
  s.push(...steppedRoof([0, 4.95, 0], 2.55, 2.1, 9, 0.22, 0.17, 'cu', { stripes: { axis: 'x', p: 0.22, w: 0.06, col: 'cuD' }, top: 'cuL', topT: 0.6 }, 1.5, 'cuD'));
  s.push(poly([0, 5.2, 1.4], [[-0.9, 0], [0.9, 0], [0, 0.85]], 0.08, 'cp', { plane: 'xy' }), box(-0.95, 5.15, 1.36, 0.95, 5.25, 1.5, 'au'));
  for (const sx of [-1, 1]) { s.push(ell([sx * 1.45, 6.75, 0], [0.12, 0.26, 0.12], 'au', { glow: 1, rot: [0, 0, sx * 15] }), cap([sx * 1.45, 6.95, 0], [sx * 1.25, 7.15, 0], 0.08, 0.04, 'auL', { glow: 1 })); }
  prop('yagura', vs, s, { footprint: [5.2, 4], solid: true, tags: ['castle', 'landmark'] });
}

// ---- moat railing (2 m): granite posts + two wooden rails ----
{
  const vs = 0.05, s = [];
  for (const sx of [-0.95, 0.95]) s.push(box(sx - 0.12, 0, -0.12, sx + 0.12, 1.0, 0.12, 'gn', { dither: { col: 'gnM', amt: 0.2 } }), box(sx - 0.14, 0.95, -0.14, sx + 0.14, 1.05, 0.14, 'gnM'));
  for (const y of [0.45, 0.85]) s.push(box(-0.95, y, -0.05, 0.95, y + 0.09, 0.05, 'wd', WOOD('wdD', 0.12)));
  prop('moat_rail', vs, s, { footprint: [2, 0.3], solid: true, destructible: true, hp: 40, debris: ['#c2b9a8', '#a8744a'], tags: ['castle', 'fence'] });
}

// ---- bonbori lantern pole (pink/white paper, glows at dusk) ----
{
  const vs = 0.04, s = [], lan = [];
  s.push(box(-0.07, 0, -0.07, 0.07, 1.9, 0.07, 'vm', { jit: 0.03 }), box(-0.14, 0, -0.14, 0.14, 0.12, 0.14, 'st'));
  lan.push(box(-0.22, 1.9, -0.22, 0.22, 1.96, 0.22, 'ink'));
  lan.push(box(-0.18, 1.96, -0.18, 0.18, 2.5, 0.18, 'skW', { glow: 2, stripes: { axis: 'y', p: 0.27, w: 0.04, col: 'sk' } }));
  lan.push(box(-0.19, 2.08, 0.17, 0.19, 2.38, 0.19, 'sk', { glow: 2, paint: 1 }));
  lan.push(box(-0.24, 2.5, -0.24, 0.24, 2.56, 0.24, 'ink'), box(-0.12, 2.56, -0.12, 0.12, 2.64, 0.12, 'ink'));
  lan.push(cap([0, 2.64, 0], [0, 2.78, 0], 0.03, 0.03, 'ink'));
  prop('bonbori', vs, [{ n: 'body', p: [0, 0, 0], s }, { n: 'lamp', p: [0, 1.9, 0], s: lan, sway: { axis: 'x', amp: 0.02, freq: 0.4 } }],
    { footprint: [0.35, 0.35], solid: true, destructible: true, hp: 30, debris: ['#e2482e', '#fff0f5'], light: { color: '#ffe9c4', intensity: 2.2, y: 2.2, range: 5, night: true }, tags: ['castle', 'park', 'light', 'festival'] });
}

// ---- blue hanami tarp with bento, cups, sake bottle, shoes at the edge ----
{
  const vs = 0.04, s = [];
  s.push(box(-1.2, 0, -0.9, 1.2, 0.03, 0.9, '#3a6ad0', { stripes: { axis: 'x', p: 0.6, w: 0.03, col: '#5a8ae8' }, jit: 0.02 }));
  for (const [x, z] of [[-0.35, -0.1], [0.25, -0.15]]) { s.push(box(x - 0.2, 0.03, z - 0.14, x + 0.2, 0.12, z + 0.14, 'ink')); s.push(box(x - 0.17, 0.09, z - 0.11, x + 0.17, 0.13, z + 0.11, '#c22a2a', { paint: 1 })); for (const [dx, c] of [[-0.1, 'w'], [0, '#f9c22b'], [0.1, '#93cc62']]) s.push(sph([x + dx, 0.12, z], 0.05, c)); }
  s.push(vcyl(0.75, -0.3, 0.03, 0.42, 0.07, '#2f6a4c'), vcyl(0.75, -0.3, 0.42, 0.5, 0.03, '#2f6a4c'), box(0.68, 0.15, -0.24, 0.82, 0.3, -0.22, 'w'));
  for (const [x, z, c] of [[0.5, 0.2, 'w'], [0.62, 0.3, '#ffb6cb'], [-0.75, 0.25, 'w']]) s.push(vcyl(x, z, 0.03, 0.13, 0.04, c));
  s.push(...tube([[-0.8, 0.1, -0.4], [-0.6, 0.1, -0.4]], 0.015, 0.015, '#c9a46a'), sph([-0.75, 0.1, -0.4], 0.035, '#ffb6cb'), sph([-0.68, 0.1, -0.4], 0.035, 'w'), sph([-0.61, 0.1, -0.4], 0.035, '#93cc62'));
  for (const x of [-0.9, -0.55, 0.4, 0.8]) for (const dx of [-0.05, 0.05]) s.push(box(x + dx - 0.04, 0, 0.95, x + dx + 0.04, 0.06, 1.12, x > 0 ? '#e2482e' : 'ink'));
  s.push(box(0.1, 0.03, 0.35, 0.5, 0.12, 0.7, '#ffb6cb', { round: 0.03 }));
  prop('hanami_tarp', vs, s, { footprint: [2.4, 1.8], solid: false, tags: ['park', 'hanami'] });
}

// ---- overhanging sakura bough (foreground frame; hangs from above, no trunk in view) ----
{
  const vs = 0.09, s = [], r = rng(61);
  const main = bez([-4.0, 7.6, 0.2], [-0.5, 5.6, 0.0], [3.2, 6.4, -0.2], 8);
  s.push(...tube(main, 0.3, 0.1, 'bk', { dither: { col: 'bkD', amt: 0.25 }, jit: 0.05 }));
  const O = { noise: 0.12, noiseScale: 0.28, top: 'skL', topT: 0.45, belly: 'skD', bellyT: 0.3, dither: { col: 'skW', amt: 0.09 }, jit: 0.05 };
  for (let i = 1; i < main.length; i++) {
    const p = main[i];
    s.push(...tube(bez(p, [p[0] + 0.3, p[1] - 0.5, p[2] + 0.3], [p[0] + (r() - 0.5) * 1.2, p[1] - 0.8 - r() * 0.5, p[2] + (r() - 0.5) * 0.6], 3), 0.07, 0.04, 'bk'));
    s.push(ell([p[0] + (r() - 0.5) * 0.8, p[1] - 0.5 - r() * 0.5, p[2] + (r() - 0.5) * 0.6], [0.8 + r() * 0.4, 0.45 + r() * 0.2, 0.6], 'sk', O));
  }
  prop('sakura_bough', vs, [{ n: 'body', p: [0, 6.5, 0], s, sway: { axis: 'z', amp: 0.012, freq: 0.3 } }], { footprint: [0.2, 0.2], solid: false, tags: ['park', 'sakura', 'foreground'] },
    { fx: [{ part: 'body', at: [-1.0, 5.2, 0.2], type: 'petal', rate: 0.5, scale: 1.3 }, { part: 'body', at: [1.8, 5.4, 0], type: 'petal', rate: 0.5, scale: 1.3 }] });
}

// ---- ume (plum) trees, pink + white ----
prop('ume_tree', 0.08, broadleaf(83, { vs: 0.08, h: 1.9, spread: 1.4, blobs: 8, size: 0.75, leaf: '#f5a0b8', top: '#ffd3e3', under: '#d9739a', speck: '#ffffff', bark: '#3a2e2a' }), { footprint: [0.6, 0.6], solid: true, tags: ['park', 'tree', 'plum'] });
prop('ume_tree_w', 0.08, broadleaf(97, { vs: 0.08, h: 1.8, spread: 1.3, blobs: 8, size: 0.7, leaf: '#fff0f5', top: '#ffffff', under: '#e6c6d6', speck: '#ffb6cb', bark: '#3a2e2a' }), { footprint: [0.6, 0.6], solid: true, tags: ['park', 'tree', 'plum'] });

// ---- starter pedestals: three soul-stone plinths in a row (x −1.5 / 0 / +1.5) + the bracelet case ----
{
  const vs = 0.04, s = [];
  const ring = ['#ff5000', '#00cdf9', '#99e65f'];
  ring.forEach((c, i) => {
    const x = (i - 1) * 1.5;
    s.push(vcyl(x, 0, 0, 0.08, 0.5, 'gn', { dither: { col: 'gnM', amt: 0.2 } }));
    s.push(tor([x, 0.08, 0], 0.4, 0.04, c, { glow: 2 }));
    s.push(box(x - 0.08, 0, -0.75, x + 0.08, 0.95, -0.6, 'gnM'), box(x - 0.14, 0.95, -0.78, x + 0.14, 1.02, -0.57, 'gnK'));
    s.push(ell([x, 1.16, -0.68], [0.09, 0.15, 0.09], 'nc', { glow: 2 }));
    s.push(ell([x, 1.16, -0.68], [0.05, 0.08, 0.05], c, { glow: 3 }));
  });
  // bracelet display case
  s.push(box(2.45, 0, -0.3, 2.95, 0.8, 0.2, 'wdK'), box(2.45, 0.8, -0.3, 2.95, 1.18, 0.2, '#bfe8ee', { glow: 1 }), box(2.5, 0.84, -0.25, 2.9, 1.14, 0.15, 'k', { sub: 1 }));
  s.push(tor([2.7, 0.95, -0.05], 0.1, 0.025, 'mtL', { axis: 'x' }), sph([2.7, 1.05, -0.05], 0.035, 'nc', { glow: 3 }));
  s.push(box(2.42, 1.18, -0.33, 2.98, 1.22, 0.23, 'wdK'));
  prop('starter_pedestals', vs, s, { footprint: [4.8, 1.2], solid: false, light: { color: '#7ff0ff', intensity: 1.5, y: 1.0, range: 4, night: true }, tags: ['park', 'story'] });
}

// ---- CHERRY BOMB CRÊPES food truck (side-on, serving hatch toward the camera) ----
{
  const vs = 0.06, s = [];
  for (const x of [-1.5, 1.4]) for (const z of [-0.85, 0.85]) { s.push(cyl([x, 0.36, z - 0.12], [x, 0.36, z + 0.12], 0.36, 'ink')); s.push(cyl([x, 0.36, z + Math.sign(z) * 0.1], [x, 0.36, z + Math.sign(z) * 0.14], 0.18, 'mtL')); }
  s.push(box(-2.4, 0.42, -0.95, 2.3, 2.75, 0.95, 'crL', { round: 0.12, jit: 0.02 }));
  s.push(box(-2.42, 0.42, -0.97, 2.32, 1.15, 0.97, 'pp', { jit: 0.02 }));
  s.push(box(-2.42, 1.15, -0.97, 2.32, 1.22, 0.97, '#e8318a'));
  s.push(box(1.45, 1.4, -0.97, 2.32, 2.3, 0.97, '#4e6a88'));                         // windscreen / cab windows
  s.push(box(2.3, 0.6, -0.6, 2.38, 0.75, -0.35, 'nw', { glow: 2 }), box(2.3, 0.6, 0.35, 2.38, 0.75, 0.6, 'nw', { glow: 2 }));
  // serving hatch + propped awning
  s.push(box(-1.9, 1.35, 0.85, 0.9, 2.3, 1.0, 'k', { sub: 1 }));
  s.push(box(-1.9, 1.35, 0.6, 0.9, 2.3, 0.7, '#5a3a4a'));
  s.push(box(-1.95, 1.3, 0.85, 0.95, 1.38, 1.25, 'wh'));
  s.push(box(-2.0, 2.42, 0.95, 1.0, 2.5, 1.75, 'pp', { stripes: { axis: 'x', p: 0.4, w: 0.2, col: 'w' }, rot: [-12, 0, 0] }));
  for (let i = 0; i < 7; i++) s.push(sph([-1.85 + i * 0.47, 2.38, 1.78], 0.07, i % 2 ? 'w' : 'pp'));
  for (const [x, c] of [[-1.4, '#ffd9a0'], [-0.6, '#ffb6cb'], [0.2, '#c99a68']]) { s.push(poly([x, 1.62, 0.9], [[-0.12, 0.12], [0.12, 0.12], [0, -0.22]], 0.06, '#e8b86a')); s.push(sph([x, 1.78, 0.9], 0.1, c)); }
  // roof sign: cherries + CREPES
  s.push(box(-1.6, 2.75, -0.1, 0.9, 3.3, 0.1, '#2a1a30'));
  s.push(...text('CREPES', [-0.35, 3.02, 0.12], 0.06, 0.03, 'nm', { glow: 2, snap: vs }));
  for (const dx of [-0.2, 0.1]) s.push(sph([1.3 + dx, 3.0, 0.0], 0.16, '#e2232e', { glow: 1 }));
  s.push(cap([1.1, 3.1, 0], [1.25, 3.5, 0], 0.025, 0.025, '#5d9f42'), cap([1.4, 3.1, 0], [1.25, 3.5, 0], 0.025, 0.025, '#5d9f42'), ell([1.32, 3.52, 0], [0.12, 0.05, 0.05], '#5d9f42'));
  prop('food_truck', vs, s, { footprint: [4.8, 2.0], solid: true, destructible: false, light: { color: '#ff9ad0', intensity: 2, y: 2.0, range: 5, night: true }, tags: ['park', 'shop', 'food', 'vehicle'] });
}

// ---- HERE COMES THE SUN TEA kiosk: wooden stall, sun emblem, red parasol over a mōsen bench ----
{
  const vs = 0.05, s = [], um = [];
  s.push(box(-1.1, 0, -0.6, 1.1, 1.0, 0.5, 'wd', { stripes: { axis: 'x', p: 0.25, w: 0.03, col: 'wdD' }, jit: 0.04 }));
  s.push(box(-1.2, 1.0, -0.65, 1.2, 1.07, 0.65, 'wdL'));
  for (const sx of [-1.05, 1.05]) s.push(box(sx - 0.05, 1.0, -0.55, sx + 0.05, 2.3, -0.45, 'wdD'));
  s.push(box(-1.3, 2.3, -0.9, 1.3, 2.4, 0.5, 'kw', KAWARA));
  s.push(box(-1.05, 1.95, -0.48, 1.05, 2.3, -0.42, '#f4ecd8'));
  s.push(vcyl(0, -0.4, 2.0, 2.3, 0.0, 'w'));
  s.push(cyl([0, 2.12, -0.38], [0, 2.12, -0.34], 0.12, '#f9c22b', { glow: 1 }));
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s.push(cap([Math.cos(a) * 0.16, 2.12 + Math.sin(a) * 0.16, -0.36], [Math.cos(a) * 0.26, 2.12 + Math.sin(a) * 0.26, -0.36], 0.025, 0.015, '#f79617', { glow: 1 })); }
  s.push(vcyl(-0.6, 0.0, 1.07, 1.25, 0.12, 'mtD'), cap([-0.48, 1.2, 0], [-0.36, 1.25, 0], 0.025, 0.02, 'mtD'));
  for (const x of [0.1, 0.35, 0.6]) s.push(vcyl(x, 0.1, 1.07, 1.17, 0.05, '#7a9a4a'));
  // red mōsen bench + nodate parasol
  s.push(box(1.7, 0.42, -0.3, 3.3, 0.5, 0.3, '#c22a2a'), box(1.7, 0.38, -0.32, 3.3, 0.42, 0.32, 'wd'));
  for (const x of [1.8, 3.2]) for (const z of [-0.25, 0.25]) s.push(box(x - 0.03, 0, z - 0.03, x + 0.03, 0.4, z + 0.03, 'wdD'));
  s.push(vcyl(2.5, -0.5, 0, 2.2, 0.03, 'wdK'));
  um.push(cap([2.5, 2.25, -0.5], [2.5, 2.05, -0.5], 0.05, 1.25, '#d83a3c', { stripes: { axis: 'y', p: 0.06, w: 0.02, col: '#a42a30' } }));
  um.push(cap([2.5, 2.25, -0.5], [2.5, 2.05, -0.5], 0.04, 1.15, 'k', { sub: 1, fat: -0.06 }));
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; um.push(cap([2.5, 2.22, -0.5], [2.5 + Math.cos(a) * 1.15, 2.06, -0.5 + Math.sin(a) * 1.15], 0.015, 0.015, '#f4ecd8')); }
  prop('tea_kiosk', vs, [{ n: 'body', p: [0, 0, 0], s }, { n: 'parasol', p: [2.5, 2.2, -0.5], s: um }], { footprint: [4.4, 1.3], solid: true, light: { color: '#ffd9a0', intensity: 1.5, y: 1.8, range: 4, night: true }, tags: ['park', 'shop', 'food'] },
    { fx: [{ part: 'body', at: [-0.6, 1.3, 0], type: 'steam', rate: 0.6 }] });
}

// ---- training gear rack: bamboo staves, red mitts, kettlebell, rope, towels ----
{
  const vs = 0.04, s = [];
  for (const sx of [-0.8, 0.8]) s.push(box(sx - 0.05, 0, -0.2, sx + 0.05, 1.6, -0.1, 'wd', WOOD()));
  for (const y of [0.7, 1.5]) s.push(box(-0.85, y, -0.22, 0.85, y + 0.07, -0.08, 'wdD'));
  for (let i = 0; i < 6; i++) s.push(cap([-0.65 + i * 0.12, 0.05, 0.05], [-0.62 + i * 0.12, 1.6, -0.14], 0.025, 0.02, '#c9b46a', { stripes: { axis: 'y', p: 0.25, w: 0.03, col: '#9c8a48' } }));
  for (const x of [0.2, 0.45]) s.push(ell([x, 1.25, -0.02], [0.1, 0.13, 0.08], '#d83a3c'), box(x - 0.08, 1.05, -0.05, x + 0.08, 1.12, 0.02, 'w'));
  s.push(box(0.55, 1.2, -0.12, 0.8, 1.5, -0.06, 'w', { stripes: { axis: 'y', p: 0.12, w: 0.03, col: '#4d65b4' } }));
  s.push(sph([0.5, 0.15, 0.15], 0.15, 'ink'), tor([0.5, 0.33, 0.15], 0.08, 0.025, 'ink', { axis: 'z' }));
  s.push(tor([-0.4, 0.06, 0.2], 0.18, 0.04, '#c9a46a'), tor([-0.4, 0.12, 0.2], 0.14, 0.04, '#c9a46a'));
  prop('gear_rack', vs, s, { footprint: [1.8, 0.6], solid: true, destructible: true, hp: 30, debris: ['#a8744a', '#c9b46a', '#d83a3c'], tags: ['park', 'training'] });
}

// ---- granite stone marker / stele (text = map panel; face 0.8×1.3 m at y 0.45–1.75, z +0.14) ----
{
  const vs = 0.05, s = [];
  s.push(box(-0.7, 0, -0.35, 0.7, 0.35, 0.35, 'gnM', { dither: { col: 'gnK', amt: 0.2 } }));
  s.push(box(-0.45, 0.35, -0.12, 0.45, 1.85, 0.12, 'gn', { dither: { col: 'stW', amt: 0.15 }, jit: 0.03 }));
  s.push(box(-0.5, 1.85, -0.15, 0.5, 1.92, 0.15, 'gnM'));
  s.push(sph([-0.55, 0.42, 0.3], 0.18, 'bush' === 'x' ? 'lf' : 'lfD', { top: 'lf', noise: 0.04, noiseScale: 0.08 }));
  prop('stone_marker', vs, s, { footprint: [1.4, 0.7], solid: true, tags: ['park', 'sign'] });
}

export const DESIGNS = D;
export const PROP_META = M;
