// Shinsekai props (street strip, Team Metallica back alley, dojo, onsen, arcade,
// Grillz & Thrillz, Kansai Calling records) — voxel DSL (docs/MODELING.md).
// Merged into the prop library by designs/index.js. Ids are prefixed `ss_`.
// Props stand on y = 0 centred on x = z = 0, front = +z, 1 unit = 1 m.
// Wall-mounted pieces (signs, shutters, posters, pipes…) are modelled from
// y = 0 up and placed with a y override so they skip navigation.
//
// Design notes follow docs/refs/environments.md §7 (Shinsekai), §9 (facades)
// and §10 (gods-of-light lore murals). Everything is an original design:
// no real logos, mascots or signage are reproduced.
import { PROP_PAL } from './props.js';

const D = {}, M = {};

// ---------------------------------------------------------------- palette
const P = Object.assign({}, PROP_PAL, {
  // Shinsekai street (§7c)
  twr: '#b7bcc4', twrD: '#80868f', twrL: '#dde1e6', twrK: '#4c525c',
  lan: '#d83a3c', lanD: '#9e2228', bulb: '#ffd27a', bulbL: '#fff1c4', shy: '#ffd23f', shyD: '#d8a420',
  tileF: '#e9e2d6', dwd: '#5a3b25', dwdD: '#3e2818', gold: '#d8a53a', goldL: '#f2cf6a', goldD: '#9e7424',
  skin: '#ffcfa0', skinD: '#e8a878', crumb: '#c98a34', crumbL: '#ebb658', crumbD: '#9a5e20', sauce: '#4a2210',
  // dojo (§7.1)
  tat: '#c9c27a', tatF: '#a9b86a', tatB: '#2a3550', hin: '#e3c495', hinD: '#c9a46e', beam: '#6b4a2b', beamD: '#4a3220',
  shoji: '#f4efe2', sumi: '#1b1a19', straw: '#d4b56a', strawD: '#a88a44', sak: '#2f6a3a', sakL: '#4f8f4a',
  // onsen (§7.2)
  ohin: '#e7c999', ost: '#8d8a83', ostL: '#b4b0a6', otl: '#5a8fb8', otlW: '#eef4f8', omur: '#3d6fb0', oind: '#2a3a6b', ored: '#c43a3a', obkt: '#f2c53d',
  // arcade (§7.3)
  aceil: '#0d0b18', acarp: '#2a1b4a', apk: '#ff7ac8', apkL: '#ffc2e4', awh: '#f6f3ff',
  // bling (§7.4)
  vel: '#1a1420', velL: '#2e2438', blg: '#f2c24c', blgL: '#ffe7a0', gls: '#eafcff',
  // records (§7.4)
  crt: '#a8744a', crtD: '#7c5333', tung: '#ffcf8a', vin: '#16141c', grv: '#3a404c',
  // back alley (§7.5)
  asph: '#2b2a2e', wet: '#4a4f6a', rust: '#6b4b3a', rustL: '#8a6a52', gLime: '#b6ff3c', gPink: '#ff3fa4', chrome: '#d5dbe1', gK: '#111111',
  sod: '#ffb35c', paper: '#e8e0cf', paperD: '#c8bea8',
  // lore mural pigments (§10)
  plas: '#efe4cc', plasD: '#e8dcc4', soot: '#1e1b18', vmn: '#d9381e', bgr: '#9a3a24', ych: '#c9a227', mal: '#3e8e5e', azu: '#2a4d8f', vio: '#6b4a9a',
  gof: '#f6f2e8', gleaf: '#d4af37', gleafD: '#8a6a1f', silv: '#8d8f94', silvD: '#5d5f66',
  // element colours (skill-disc labels, lanterns)
  ePyro: '#ff6a2b', eHydro: '#2fa8ff', eBio: '#5fd35a', eGeo: '#d39a5c', eEcho: '#b26bff', eVolto: '#ffe23a', eCryo: '#9fefff',
  eAero: '#a8f5c8', eEcto: '#8a5aff', eFerro: '#b8c4d0', eAstro: '#ffd98a', eNucleo: '#8aff3a',
});
const ELEM = ['ePyro', 'eHydro', 'eBio', 'eGeo', 'eEcho', 'eVolto', 'eCryo', 'eAero', 'eEcto', 'eFerro', 'eAstro', 'eNucleo'];

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
const ngon = (n, r, rot = 0) => Array.from({ length: n }, (_, i) => [Math.cos(rot + (i / n) * Math.PI * 2) * r, Math.sin(rot + (i / n) * Math.PI * 2) * r]);
const prism = (n, x, z, y0, y1, r, c, o, rot = Math.PI / n) => poly([x, (y0 + y1) / 2, z], ngon(n, r, rot), (y1 - y0) / 2 + E, c, Object.assign({ plane: 'xz' }, o));
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
// 3×5 pixel font (Latin + digits + a few symbols) for in-world lettering
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
  '¥': ['#.#', '.#.', '###', '.#.', '.#.'], '&': ['.#.', '#.#', '.#.', '#.#', '.##'], "'": ['#', '#', '.', '.', '.'], ':': ['.', '#', '.', '#', '.'],
  '★': ['..#..', '#####', '.###.', '.#.#.', '#...#'], '♥': ['.#.#.', '#####', '#####', '.###.', '..#..'], '/': ['..#', '..#', '.#.', '#..', '#..'],
};
// Japanese glyphs as pixel bitmaps (7–9 px) for noren and small plaques
const JP = {
  yu: ['........', '#..####.', '#.#.#..#', '#.#.#..#', '#..####.', '#...#...', '...#....', '..#.....'], // ゆ
  kushi: ['...#...', '#######', '#..#..#', '#######', '...#...', '.#####.', '.#.#.#.', '.#####.', '...#...'], // 串
  ka: ['..#....', '#######', '..#...#', '..#...#', '.#....#', '.#...#.', '#..##..'], // カ
  tsu: ['#..#..#', '.#..#.#', '......#', '.....#.', '....#..', '..##...', '##.....'], // ツ
  yu2: ['.#.....', '.#.###.', '##.#.#.', '.#.###.', '.#..#..', '.#..#..', '....#..'],
};
// Pixel bitmap (rows of chars) → run-length boxes on a plane ('xy' faces ±z, 'zy' faces ±x)
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
// text centred at c on the xy plane (front +z)
function text(str, c, px, d, col, opts, gap = 1) {
  const rows = textRows(str, gap);
  const w = rows[0].length;
  return bitmap(rows.map((r) => r.replace(/#/g, 'a')), [c[0] - ((w - 1) * px) / 2, c[1] + 2 * px, c[2]], px, d, { a: col }, 'xy', opts);
}
// letters stacked vertically (blade signs); c = centre of the first letter
function vtext(str, c, px, d, col, opts, gap = 1) {
  const out = [];
  [...str].forEach((ch, i) => { out.push(...text(ch, [c[0], c[1] - i * (5 + gap) * px, c[2]], px, d, typeof col === 'function' ? col(i) : col, opts)); });
  return out;
}
// lettering with a dark outline (graffiti / poster type): outline layer behind, fill in front
function otext(str, c, px, d, col, ink, opts, gap = 1) {
  const out = [];
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]]) out.push(...text(str, [c[0] + dx * px, c[1] + dy * px, c[2] - d * 0.6], px, d, ink, opts, gap));
  out.push(...text(str, [c[0], c[1], c[2] + d * 0.5], px, d, col, opts, gap));
  return out;
}
// marquee lettering: one light bulb per font pixel
function bulbText(str, c, px, r, col, gap = 1) {
  const rows = textRows(str, gap), w = rows[0].length, out = [];
  rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') out.push(sph([c[0] + (i - (w - 1) / 2) * px, c[1] + (2 - j) * px, c[2]], r, col, { glow: 2 })); });
  return out;
}
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

// =====================================================================
// SHINSEKAI STREET
// =====================================================================

// ---- the tower (original Tsūtenkaku-like design, ~29 m): arched four-leg base with marquee bulbs,
// lattice shaft with alternating neon corner tubes, a long vertical TOKONMON sponsor sign, a neon clock,
// an octagonal observation deck and a "weather" light ball on top.
{
  const vs = 0.16, s = [];
  const MT = { jit: 0.03 };
  const B = 3.8;
  s.push(box(-B, 0, -B, B, 7.0, B, 'twr', MT));
  for (const ax of ['x', 'z']) {
    const A = ax === 'z' ? [[0, 3.7, -B - 1], [0, 3.7, B + 1]] : [[-B - 1, 3.7, 0], [B + 1, 3.7, 0]];
    s.push(cyl(A[0], A[1], 2.6, 'k', { sub: 1 }));
    s.push(ax === 'z' ? box(-2.6, -0.1, -B - 1, 2.6, 3.7, B + 1, 'k', { sub: 1 }) : box(-B - 1, -0.1, -2.6, B + 1, 3.7, 2.6, 'k', { sub: 1 }));
  }
  s.push(box(-B + 0.5, 0.6, -B + 0.5, B - 0.5, 6.4, B - 0.5, 'k', { sub: 1 }));
  // painted ceiling inside the arch (flower/peacock fan in Showa colours)
  s.push(box(-B + 0.5, 6.25, -B + 0.5, B - 0.5, 6.45, B - 0.5, '#e8c46a', { spots: { col: '#3d8d89', d: 0.4, s: 0.5, seed: 4 } }));
  // leg plinths, cream leg panels, cornice with a magenta neon band
  for (const [cx, cz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    s.push(box(cx * B - cx * 1.3, 0, cz * B - cz * 1.3, cx * (B + 0.15), 0.6, cz * (B + 0.15), 'stD', { dither: { col: 'st', amt: 0.3 } }));
    s.push(box(cx * B - cx * 1.0, 1.0, cz * (B + 0.02), cx * B - cx * 0.2, 3.2, cz * (B + 0.02), 'tileF', { paint: 1 }));
  }
  s.push(box(-B - 0.25, 6.6, -B - 0.25, B + 0.25, 7.3, B + 0.25, 'twrL', MT));
  s.push(box(-B - 0.27, 6.8, -B - 0.27, B + 0.27, 6.98, B + 0.27, 'nm', { paint: 1, glow: 2 }));
  // marquee bulbs along each arch (front + back + sides) and up the leg edges
  for (const face of [1, -1]) {
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * Math.PI, x = Math.cos(a) * 2.75, y = 3.7 + Math.sin(a) * 2.75;
      s.push(sph([x, y, face * (B + 0.06)], 0.11, 'bulb', { glow: 2 }));
      s.push(sph([face * (B + 0.06), y, x], 0.11, 'bulb', { glow: 2 }));
    }
    for (let y = 0.9; y < 3.7; y += 0.42) for (const sx of [-2.75, 2.75]) { s.push(sph([sx, y, face * (B + 0.06)], 0.11, 'bulb', { glow: 2 })); s.push(sph([face * (B + 0.06), y, sx], 0.11, 'bulb', { glow: 2 })); }
  }
  // tapering lattice shaft with neon corner tubes
  let y = 7.3, hw = 2.35;
  while (y < 19) {
    const y1 = Math.min(19, y + 0.96);
    s.push(box(-hw, y, -hw, hw, y1, hw, 'twr', MT));
    s.push(box(-hw - 0.01, y, -hw - 0.01, hw + 0.01, y + 0.16, hw + 0.01, 'twrD', { paint: 1 }));
    for (const sz of [1, -1]) s.push(box(-hw, y, sz * hw - 0.08, hw, y1, sz * hw + 0.08, 'twrL', { paint: 1, stripes: { axis: 'x', p: 0.64, w: 0.16, col: 'twrD' } }));
    for (const sx of [1, -1]) s.push(box(sx * hw - 0.08, y, -hw, sx * hw + 0.08, y1, hw, 'twrL', { paint: 1, stripes: { axis: 'z', p: 0.64, w: 0.16, col: 'twrD' } }));
    for (const [cx, cz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) s.push(box(cx * hw - cx * 0.16, y, cz * hw - cz * 0.16, cx * hw, y1, cz * hw, (Math.round(y / 0.96) % 2) ? 'nc' : 'nm', { paint: 1, glow: 2 }));
    const ang = (Math.atan2(y1 - y, hw) * 180) / Math.PI;
    for (const d of [1, -1]) {
      for (const sx of [1, -1]) s.push(bx([sx * (hw + 0.08), (y + y1) / 2, 0], [0.08, 0.07, hw * 1.05], 'twrD', { rot: [d * ang, 0, 0] }));
      s.push(bx([0, (y + y1) / 2, -(hw + 0.08)], [hw * 1.05, 0.07, 0.08], 'twrD', { rot: [0, 0, d * ang] }));
      s.push(bx([-hw * 0.62, (y + y1) / 2, hw + 0.08], [hw * 0.4, 0.07, 0.08], 'twrD', { rot: [0, 0, d * ang * 1.6] }), bx([hw * 0.62, (y + y1) / 2, hw + 0.08], [hw * 0.4, 0.07, 0.08], 'twrD', { rot: [0, 0, d * ang * 1.6] }));
    }
    y = y1; hw -= 0.04;
  }
  // vertical sponsor sign down the front: TOKONMON (original), yellow on ink with a cyan tube border
  s.push(box(-0.95, 8.1, 2.2, 0.95, 17.2, 2.75, 'ink', MT));
  s.push(box(-0.95, 8.1, 2.75, 0.95, 17.2, 2.82, 'nc', { glow: 2 }), box(-0.79, 8.26, 2.7, 0.79, 17.04, 2.9, 'k', { sub: 1 }));
  s.push(...vtext('TOKONMON', [0, 16.5, 2.8], 0.16, 0.08, (i) => (i % 2 ? 'ny' : 'nw'), { glow: 2, snap: vs }));
  // neon clock just under the deck (front)
  s.push(cyl([0, 18.15, 2.1], [0, 18.15, 2.5], 0.75, 'ink'), tor([0, 18.15, 2.5], 0.7, 0.07, 'ny', { axis: 'z', glow: 2 }));
  s.push(box(-0.04, 18.15, 2.5, 0.04, 18.7, 2.6, 'nw', { glow: 2 }), box(0, 18.11, 2.5, 0.42, 18.19, 2.6, 'nw', { glow: 2 }));
  // octagonal observation deck with a warm window band, crown with a cyan neon ring
  s.push(prism(8, 0, 0, 19.0, 19.4, 3.1, 'twrD', MT));
  s.push(prism(8, 0, 0, 19.4, 22.0, 3.3, 'twrL', MT));
  s.push(prism(8, 0, 0, 19.8, 21.5, 3.36, '#ffd890', { paint: 1, glow: 1, stripes: { axis: 'x', p: 0.8, w: 0.16, col: 'twrK' } }));
  s.push(prism(8, 0, 0, 22.0, 22.35, 3.55, 'twrD', MT));
  s.push(prism(8, 0, 0, 22.35, 23.9, 2.2, 'twrL', MT));
  s.push(prism(8, 0, 0, 22.8, 23.45, 2.26, 'nc', { paint: 1, glow: 2, stripes: { axis: 'x', p: 0.64, w: 0.16, col: 'twrK' } }));
  s.push(prism(8, 0, 0, 23.9, 24.1, 2.35, 'twrD'));
  // "weather" light ball + antenna
  s.push(vcyl(0, 0, 24.1, 24.6, 0.65, 'twrK'));
  s.push(sph([0, 25.6, 0], 1.15, 'nc', { glow: 2, grad: { axis: 'y', to: 'nv', a: 24.6, b: 26.6 }, stripes: { axis: 'y', p: 0.48, w: 0.16, col: '#bffcff' } }));
  s.push(vcyl(0, 0, 26.6, 28.6, 0.09, 'twr'), sph([0, 28.7, 0], 0.16, 'nr', { glow: 3 }));
  prop('ss_tower', vs, s, { footprint: [7.6, 7.6], solid: true, light: { color: '#7ff0ff', intensity: 6, y: 18, range: 16, night: true }, tags: ['landmark', 'shinsekai', 'neon', 'light'] });
}

// ---- 新世界 arch gate over the Hondori mouth: red posts, marquee "SHINSEKAI" in bulbs, a fan crest
// (the 新世界 kanji are an in-world panel placed on the crest), hanging red lanterns.
{
  const vs = 0.06, s = [];
  const W = 3.4;
  for (const sx of [-1, 1]) {
    const x = sx * W;
    s.push(box(x - 0.24, 0, -0.24, x + 0.24, 0.35, 0.24, 'stD', { dither: { col: 'st', amt: 0.3 } }));
    s.push(box(x - 0.17, 0.35, -0.17, x + 0.17, 4.5, 0.17, 'lan', { jit: 0.03 }));
    for (const yy of [0.5, 1.6, 4.2]) s.push(box(x - 0.2, yy, -0.2, x + 0.2, yy + 0.12, 0.2, 'gold'));
    for (let yy = 0.9; yy < 4.1; yy += 0.4) s.push(sph([x, yy, 0.19], 0.07, 'bulb', { glow: 2 }));
  }
  // sign box
  s.push(box(-W - 0.3, 4.25, -0.25, W + 0.3, 5.6, 0.25, 'lanD', { jit: 0.02 }));
  s.push(box(-W - 0.2, 4.35, 0.22, W + 0.2, 5.5, 0.27, '#2a0e1e'));
  s.push(...bulbText('SHINSEKAI', [0, 4.93, 0.3], 0.17, 0.065, 'bulbL'));
  for (let x = -W - 0.2; x <= W + 0.21; x += 0.24) { s.push(sph([x, 4.33, 0.27], 0.06, 'bulb', { glow: 2 })); s.push(sph([x, 5.52, 0.27], 0.06, 'bulb', { glow: 2 })); }
  // fan crest above (panel with 新世界 goes on its face)
  const fan = []; for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI; fan.push([Math.cos(a) * 1.75, Math.sin(a) * 1.25]); }
  s.push(poly([0, 5.6, 0], fan, 0.2, 'lan', { jit: 0.03 }));
  s.push(poly([0, 5.6, 0.12], fan.map(([u, v]) => [u * 0.88, v * 0.86]), 0.08, '#2a0e1e'));
  for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI; s.push(sph([Math.cos(a) * 1.75, 5.6 + Math.sin(a) * 1.25, 0.2], 0.07, 'bulb', { glow: 2 })); }
  s.push(sph([0, 7.0, 0], 0.18, 'gold', { glow: 1 }));
  // lanterns hanging under the box
  for (let i = 0; i < 6; i++) { const x = -2.5 + i; s.push(cyl([x, 4.25, 0.1], [x, 4.05, 0.1], 0.015, 'ink'), ...chochin([x, 3.82, 0.1], 0.15, 0.2, i % 2 ? '#fff1d6' : '#ff5a3c', i % 2 ? '#e2b98a' : '#b8301e', 2, i % 2 ? '#ff7a5a' : '#ffd9a0')); }
  prop('ss_arch_gate', vs, s, { footprint: [7.2, 0.5], solid: false, light: { color: '#ffd27a', intensity: 4, y: 4.9, range: 8, night: true }, tags: ['landmark', 'shinsekai', 'gate', 'light'] });
}

// ---- giant 3D sign: a fist holding a kushikatsu skewer (wall-mounted; place with a y override ~3)
{
  const vs = 0.05, s = [];
  s.push(box(-0.5, 0.3, -0.1, 0.5, 1.3, 0.02, 'ink'));
  s.push(box(-0.08, 0.7, 0.0, 0.08, 0.86, 0.45, 'mtD'));
  // striped cuff + wrist coming from the left
  s.push(cyl([-1.0, 0.8, 0.62], [-0.46, 0.82, 0.62], 0.3, 'w', { stripes: { axis: 'x', p: 0.2, w: 0.09, col: 'lan' } }));
  s.push(cyl([-0.5, 0.82, 0.62], [-0.28, 0.83, 0.62], 0.24, 'skin'));
  s.push(ell([0.05, 0.85, 0.62], [0.42, 0.36, 0.34], 'skin', { belly: 'skinD', jit: 0.03 }));
  for (let i = 0; i < 4; i++) s.push(ell([0.33, 1.02 - i * 0.14, 0.7], [0.14, 0.075, 0.2], 'skin', { belly: 'skinD' }));
  s.push(cap([-0.05, 1.05, 0.88], [0.25, 1.12, 0.86], 0.09, 0.08, 'skin'));
  // skewer + three breaded pieces with sauce glaze on top
  s.push(cyl([0.18, 0.55, 0.66], [0.62, 2.8, 0.66], 0.035, '#c9a06a'));
  for (const [t, r] of [[0.42, 0.25], [0.62, 0.27], [0.83, 0.23]]) {
    const cx = 0.18 + (0.62 - 0.18) * t, cy = 0.55 + (2.8 - 0.55) * t;
    s.push(ell([cx, cy, 0.66], [r, r * 0.85, r * 0.9], 'crumb', { top: 'sauce', topT: 0.62, dither: { col: 'crumbL', amt: 0.35 }, noise: 0.025, noiseScale: 0.08 }));
  }
  s.push(cap([0.47, 2.07, 0.86], [0.47, 1.9, 0.9], 0.04, 0.03, 'sauce'));
  prop('ss_kushi_hand', vs, s, { footprint: [1.6, 0.6], solid: false, light: { color: '#ffcf8a', intensity: 2, y: 1.8, range: 4, night: true }, tags: ['shinsekai', 'sign', 'food'] });
}

// ---- giant 3D sign: the FRIED ZEPPELIN — a breaded kushikatsu airship with fins and a spinning prop
{
  const vs = 0.06, s = [];
  s.push(box(-0.12, 0.0, -0.12, 0.12, 0.7, 0.06, 'ink'), box(-0.08, 0.5, 0.0, 0.08, 0.62, 0.55, 'mtD'));
  s.push(ell([0, 1.15, 0.6], [1.8, 0.58, 0.58], 'crumb', { top: 'crumbL', topT: 0.5, belly: 'crumbD', dither: { col: 'crumbL', amt: 0.3 }, noise: 0.03, noiseScale: 0.1 }));
  s.push(ell([0.3, 1.5, 0.6], [1.2, 0.2, 0.5], 'sauce', { paint: 1 }));
  // skewer through the nose, gondola with lit windows, fins
  s.push(cyl([-2.2, 1.15, 0.6], [2.35, 1.15, 0.6], 0.04, '#c9a06a'));
  s.push(box(-0.6, 0.38, 0.38, 0.6, 0.66, 0.82, 'lan', { round: 0.05 }));
  for (let i = 0; i < 4; i++) s.push(box(-0.45 + i * 0.3, 0.46, 0.81, -0.33 + i * 0.3, 0.58, 0.84, 'bulbL', { glow: 2 }));
  for (const [dy, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) s.push(poly([-1.55, 1.15 + dy * 0.45, 0.6 + dz * 0.45], [[-0.4, 0], [0.3, 0], [-0.4, 0.5]].map(([u, v]) => [u, v * (dy || dz)]), 0.05, 'lan', { plane: dz ? 'zy' : 'xy', rot: dz ? [0, 90, 0] : [0, 0, 0] }));
  const prop1 = [cyl([-1.92, 1.15, 0.6], [-1.85, 1.15, 0.6], 0.08, 'ink'), box(-1.96, 0.75, 0.55, -1.92, 1.55, 0.65, 'mtL'), box(-1.96, 1.1, 0.2, -1.92, 1.2, 1.0, 'mtL')];
  prop('ss_zeppelin_sign', vs, [
    { n: 'body', p: [0, 0, 0], s },
    { n: 'prop', p: [-1.94, 1.15, 0.6], s: prop1, spin: { axis: 'x', speed: 6 } },
  ], { footprint: [4, 1], solid: false, light: { color: '#ffcf8a', intensity: 2.5, y: 1.0, range: 5, night: true }, tags: ['shinsekai', 'sign', 'food'] });
}

// ---- open-front kushikatsu counter: stainless counter, sauce trays ("no double dipping"), cabbage,
// a fryer, red stools, a tiled hood with a 串カツ noren and two lanterns
{
  const vs = 0.06, s = [];
  // back fryer bench
  s.push(box(-1.6, 0, -0.75, 1.6, 0.9, -0.3, 'mtD', { jit: 0.02 }));
  s.push(box(-1.2, 0.9, -0.7, -0.2, 1.05, -0.35, 'mt'), box(-1.12, 1.0, -0.64, -0.28, 1.06, -0.41, '#c8962e', { glow: 1 }));
  for (let i = 0; i < 5; i++) s.push(cyl([-1.05 + i * 0.18, 1.06, -0.55], [-0.95 + i * 0.18, 1.3, -0.5], 0.03, 'crumb'));
  s.push(box(0.2, 0.9, -0.7, 1.5, 0.96, -0.35, 'wdL'));
  for (let i = 0; i < 6; i++) s.push(ell([0.32 + i * 0.2, 0.99, -0.52], [0.07, 0.05, 0.12], 'crumb', { dither: { col: 'crumbL', amt: 0.3 } }));
  // front counter
  s.push(box(-1.6, 0, 0.0, 1.6, 0.95, 0.5, 'dwd', { stripes: { axis: 'y', p: 0.24, w: 0.04, col: 'dwdD' }, jit: 0.04 }));
  s.push(box(-1.6, 0.4, 0.5, 1.6, 0.5, 0.52, 'lan'));
  s.push(box(-1.7, 0.95, -0.05, 1.7, 1.01, 0.62, 'mtL', { jit: 0.02 }));
  for (const x of [-1.0, 0.0, 1.0]) {
    s.push(box(x - 0.24, 1.01, 0.12, x + 0.24, 1.07, 0.4, 'mt'), box(x - 0.2, 1.04, 0.15, x + 0.2, 1.08, 0.37, 'sauce'));
    s.push(ell([x + 0.42, 1.06, 0.26], [0.12, 0.06, 0.12], 'w'), ell([x + 0.42, 1.1, 0.26], [0.1, 0.05, 0.1], 'lfL', { dither: { col: 'lf', amt: 0.4 } }));
  }
  // hood + noren + lanterns
  for (const sx of [-1.6, 1.6]) s.push(box(sx - 0.06, 0.95, -0.75, sx + 0.06, 2.45, -0.63, 'dwdD'));
  s.push(box(-1.8, 2.4, -0.8, 1.8, 2.55, 0.7, 'rf', { stripes: { axis: 'x', p: 0.18, w: 0.05, col: 'rfD' } }));
  s.push(box(-1.85, 2.38, 0.6, 1.85, 2.48, 0.72, 'rfD'));
  const G = [JP.kushi, JP.ka, JP.tsu];
  G.forEach((g, i) => {
    const x = -1.1 + i * 1.1;
    s.push(box(x - 0.5, 1.78, 0.58, x + 0.5, 2.38, 0.63, 'lan', { jit: 0.02 }));
    s.push(...bitmap(g, [x - (g[0].length - 1) * 0.03, 2.3, 0.62], 0.06, 0.02, { '#': 'w' }, 'xy', { snap: vs, paint: 1 }));
  });
  // stools
  for (const x of [-1.1, -0.35, 0.4, 1.15]) { s.push(box(x - 0.03, 0, 0.82, x + 0.03, 0.5, 0.88, 'mtD')); s.push(vcyl(x, 0.85, 0.46, 0.56, 0.17, 'lan', { jit: 0.03 })); s.push(vcyl(x, 0.85, 0.0, 0.04, 0.13, 'mtD')); }
  const lan = (x) => [cyl([x, 2.38, 0.66], [x, 2.25, 0.66], 0.015, 'ink'), ...chochin([x, 2.03, 0.66], 0.15, 0.2, '#ff5a3c', '#b8301e', 2, '#ffd9a0')];
  s.push(...lan(-1.75), ...lan(1.75));
  prop('ss_kushi_counter', vs, s, { footprint: [3.3, 1.3], solid: true, destructible: true, hp: 100, debris: ['#5a3b25', '#a9b1bb', '#d83a3c', '#c98a34'], light: { color: '#ffb066', intensity: 3, y: 2.0, range: 5.5, night: true }, tags: ['shinsekai', 'shop', 'food', 'light'] },
    { fx: [{ part: 'body', at: [-0.7, 1.3, -0.52], type: 'steam', rate: 0.9, scale: 1.0 }] });
}

// ---- striped canvas awnings (facade-mounted; 3 m wide; scalloped valance)
function awning(id, w, a, b) {
  const vs = 0.05, s = [];
  const hw = w / 2;
  const slope = [];
  for (let i = 0; i <= 6; i++) { const t = i / 6; slope.push([-0.0 + t * 1.0, 2.95 - t * 0.5]); }
  s.push(poly([0, 0, 0], [[0, 2.95], [1.0, 2.45], [1.0, 2.38], [0, 2.85]].map(([z, y]) => [y, z]), hw, a, { plane: 'zy', rot: [0, 0, 0], stripes: { axis: 'x', p: 0.5, w: 0.25, col: b, o: -hw }, jit: 0.02 }));
  for (let x = -hw; x < hw - 0.01; x += 0.25) s.push(ell([x + 0.125, 2.32, 1.0], [0.125, 0.12, 0.03], Math.round((x + hw) / 0.25) % 2 ? a : b));
  for (const sx of [-hw, hw]) s.push(box(sx - 0.02, 2.4, 0.0, sx + 0.02, 2.96, 1.0, 'mtD'));
  s.push(box(-hw, 2.9, -0.04, hw, 3.0, 0.06, 'mtD'));
  prop(id, vs, s, { footprint: [w, 1.0], solid: false, tags: ['shinsekai', 'street', 'facade'] });
}
awning('ss_awning_red', 3, '#e04048', '#fff4e6');
awning('ss_awning_green', 3, '#2f8a5a', '#f6f0dc');
awning('ss_awning_blue', 2.5, '#2f5fb0', '#f4f6ff');
awning('ss_awning_yellow', 2.5, '#ffc83a', '#ff7a3a');

// ---- sampuru (plastic food) window case: lit shelves of kushikatsu, doteyaki, ramune
{
  const vs = 0.04, s = [];
  s.push(box(-0.7, 0, -0.25, 0.7, 0.8, 0.25, 'dwd', { jit: 0.03 }));
  s.push(box(-0.72, 0.8, -0.27, 0.72, 0.86, 0.27, 'mtL'));
  s.push(box(-0.7, 0.86, -0.25, 0.7, 1.9, -0.2, '#fff4dc', { glow: 1 }));
  for (const sx of [-0.7, 0.7]) s.push(box(sx - 0.03, 0.86, -0.25, sx + 0.03, 1.94, 0.25, 'mtL'));
  s.push(box(-0.72, 1.9, -0.27, 0.72, 1.98, 0.27, 'mtL'));
  s.push(box(-0.66, 1.92, 0.2, 0.66, 1.94, 0.24, 'gls', { glow: 1 }));
  for (let row = 0; row < 2; row++) {
    const y = 0.9 + row * 0.48;
    s.push(box(-0.68, y, -0.2, 0.68, y + 0.03, 0.2, 'gls'));
    for (let i = 0; i < 4; i++) {
      const x = -0.5 + i * 0.33, kind = (i + row) % 4;
      s.push(ell([x, y + 0.05, 0.02], [0.13, 0.025, 0.1], 'w'));
      if (kind === 0) for (let k = 0; k < 3; k++) s.push(cyl([x - 0.08 + k * 0.08, y + 0.06, -0.05], [x - 0.06 + k * 0.08, y + 0.2, 0.05], 0.035, 'crumb'));
      else if (kind === 1) s.push(ell([x, y + 0.1, 0.02], [0.09, 0.05, 0.08], '#8a4a24', { top: '#c87a3a' }), vox(vs, x, y + 0.15, 0.04, 'lfL'));
      else if (kind === 2) s.push(vcyl(x, 0.02, y + 0.03, y + 0.26, 0.045, '#7fe6ff', { glow: 1 }), sph([x, y + 0.22, 0.02], 0.025, 'w'));
      else s.push(ell([x, y + 0.08, 0.02], [0.1, 0.05, 0.08], '#f2d28a', { top: '#e8a040' }), vox(vs, x, y + 0.12, 0.05, 'lan'));
      s.push(box(x - 0.06, y + 0.03, 0.14, x + 0.06, y + 0.07, 0.17, 'w'));
    }
  }
  prop('ss_sampuru', vs, s, { footprint: [1.4, 0.5], solid: true, destructible: true, hp: 50, debris: ['#eafcff', '#5a3b25', '#c98a34'], light: { color: '#fff0c8', intensity: 1.4, y: 1.4, range: 3.5, night: true }, tags: ['shinsekai', 'shop', 'food'] });
}

// ---- Showa utility pole with transformer, insulators, sagging wires (±6 m) and a little street lamp
{
  const vs = 0.05, s = [];
  s.push(vcyl(0, 0, 0, 8.6, 0.15, '#c8c4bc', { dither: { col: '#b0aca4', amt: 0.2 }, jit: 0.03 }));
  s.push(vcyl(0, 0, 0.3, 1.9, 0.16, 'shy', { stripes: { axis: 'y', p: 0.3, w: 0.15, col: 'k' } }));
  s.push(box(-0.12, 2.3, 0.14, 0.12, 2.6, 0.18, '#2f5fb0'), box(-0.09, 2.36, 0.17, 0.09, 2.54, 0.19, 'w'));
  for (const yy of [7.6, 8.2]) {
    s.push(box(-0.9, yy, -0.06, 0.9, yy + 0.12, 0.06, 'mtD'));
    for (const xx of [-0.75, -0.25, 0.25, 0.75]) s.push(vcyl(xx, 0, yy + 0.12, yy + 0.26, 0.04, '#e8e4f0'));
  }
  s.push(vcyl(0.32, -0.25, 6.0, 6.9, 0.22, 'mt'), vcyl(0.32, -0.25, 6.88, 6.95, 0.24, 'mtD'));
  for (const yy of [7.86, 8.46]) for (const side of [-1, 1]) s.push(...tube(bez([side * 0.75, yy, 0], [side * 3.4, yy - 0.75, 0], [side * 6.05, yy, 0], 8), 0.03, 0.03, 'ink'));
  s.push(...tube(bez([0.1, 5.4, 0], [0.1, 5.6, 0.4], [0.1, 5.5, 0.8], 3), 0.035, 0.035, 'mtD'));
  s.push(box(0.0, 5.36, 0.7, 0.2, 5.46, 0.95, 'mtD'), box(0.02, 5.33, 0.72, 0.18, 5.36, 0.93, 'bulbL', { glow: 3 }));
  prop('ss_util_pole', vs, s, { footprint: [0.35, 0.35], solid: true, destructible: false, light: { color: '#ffe0a8', intensity: 2.5, y: 5.3, range: 6, night: true }, tags: ['shinsekai', 'street', 'showa', 'light'] });
}

// ---- stacked plastic crates of ramune bottles (kid-friendly stand-in for the street's beer crates)
{
  const vs = 0.04, s = [];
  const crate = (x, y, z, c) => {
    s.push(box(x - 0.24, y, z - 0.18, x + 0.24, y + 0.26, z + 0.18, c, { jit: 0.02 }));
    s.push(box(x - 0.2, y + 0.06, z + 0.17, x + 0.2, y + 0.2, z + 0.19, 'k', { sub: 1 }));
    s.push(box(x - 0.21, y + 0.06, z - 0.15, x + 0.21, y + 0.27, z + 0.15, 'k', { sub: 1 }));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const bx0 = x - 0.14 + i * 0.14, bz = z - 0.07 + j * 0.14; s.push(vcyl(bx0, bz, y + 0.04, y + 0.36, 0.045, '#8fe8ff', { glow: 0 }), sph([bx0, y + 0.32, bz], 0.025, '#d8f6ff'), vcyl(bx0, bz, y + 0.36, y + 0.4, 0.03, j ? 'eHydro' : 'eBio')); }
  };
  crate(-0.26, 0, 0, '#ffd23f'); crate(0.26, 0, 0, '#3f8fe0'); crate(0.0, 0.27, 0, '#ff6a4a');
  prop('ss_soda_crates', vs, s, { footprint: [1.0, 0.45], solid: true, destructible: true, hp: 30, debris: ['#ffd23f', '#3f8fe0', '#8fe8ff'], tags: ['shinsekai', 'street', 'clutter'] });
}

// ---- row of potted plants with a morning-glory trellis (Osaka residents line the street with pots)
{
  const vs = 0.04, s = [];
  const r = rng(9);
  const pots = [[-0.75, 0.16, '#b5643a'], [-0.35, 0.12, '#3d6fb0'], [0.05, 0.18, '#b5643a'], [0.45, 0.11, '#e8e4dc'], [0.78, 0.14, '#7a5a3a']];
  for (const [x, rr, c] of pots) {
    s.push(cap([x, 0, 0], [x, rr * 1.6, 0], rr * 0.75, rr, c, { jit: 0.03 }));
    s.push(vcyl(x, 0, rr * 1.5, rr * 1.65, rr * 0.95, '#4a3426'));
    for (let k = 0; k < 4; k++) s.push(ell([x + (r() - 0.5) * rr, rr * 1.7 + 0.1 + r() * 0.2, (r() - 0.5) * rr], [rr * 0.7, rr * 0.6, rr * 0.6], k % 2 ? 'lf' : 'lfL', { noise: 0.02 }));
    if (r() > 0.4) s.push(sph([x + 0.04, rr * 1.7 + 0.32, 0.06], 0.04, ['#ff6aa8', '#ffd23f', '#ff5a3c'][Math.floor(r() * 3)]));
  }
  // trellis + vine
  s.push(box(-0.95, 0, -0.12, -0.92, 1.6, -0.09, 'wdD'), box(-0.3, 0, -0.12, -0.27, 1.6, -0.09, 'wdD'));
  for (let y = 0.4; y < 1.65; y += 0.3) s.push(box(-0.95, y, -0.12, -0.27, y + 0.03, -0.09, 'wdD'));
  for (let i = 0; i < 14; i++) { const x = -0.92 + r() * 0.62, y = 0.4 + r() * 1.2; s.push(ell([x, y, -0.08], [0.08, 0.07, 0.04], i % 3 ? 'lf' : 'lfD')); if (i % 3 === 0) s.push(sph([x + 0.03, y + 0.02, -0.04], 0.045, '#7a5aff')); }
  prop('ss_planters', vs, s, { footprint: [1.9, 0.4], solid: true, destructible: true, hp: 20, debris: ['#b5643a', '#5d9f42'], tags: ['shinsekai', 'street', 'plants'] });
}

// ---- sentō karahafu entrance: posts, a cusped gable with gold ridge ornaments, ゆ noren (indigo + red)
{
  const vs = 0.06, s = [];
  for (const sx of [-1.55, 1.55]) {
    s.push(box(sx - 0.14, 0, -0.14, sx + 0.14, 3.0, 0.14, 'dwd', { stripes: { axis: 'y', p: 0.6, w: 0.03, col: 'dwdD' } }));
    s.push(box(sx - 0.2, 0, -0.2, sx + 0.2, 0.25, 0.2, 'st'));
  }
  s.push(box(-1.75, 2.9, -0.2, 1.75, 3.15, 0.2, 'dwd'));
  // karahafu: an undulating curved gable — layered slabs following a cusped profile, plus the white bargeboard
  const prof = []; for (let i = 0; i <= 16; i++) { const t = i / 16, u = (t - 0.5) * 2; prof.push([u * 2.25, 3.15 + 1.25 * Math.cos(u * Math.PI / 2) ** 2 - 0.25 * Math.abs(u) ** 3]); }
  const roofPts = [...prof, [2.25, 3.0], [-2.25, 3.0]];
  s.push(poly([0, 0, -0.1], roofPts, 0.75, 'rf', { stripes: { axis: 'x', p: 0.2, w: 0.06, col: 'rfD' }, jit: 0.03 }));
  s.push(poly([0, -0.12, 0.7], prof.map(([u, v]) => [u * 0.98, v]).concat([[2.1, 3.05], [-2.1, 3.05]]), 0.05, 'w'));
  s.push(poly([0, 0.2, 0.62], [[-1.6, 3.15], [1.6, 3.15], [1.2, 3.95], [-1.2, 3.95]], 0.04, 'ohin'));
  s.push(ell([0, 4.25, 0.72], [0.32, 0.22, 0.06], 'gold', { glow: 0 }), sph([0, 4.25, 0.76], 0.1, 'goldL'));
  for (const sx of [-1, 1]) s.push(ell([sx * 2.15, 3.08, 0.66], [0.16, 0.1, 0.08], 'gold'));
  // split noren with ゆ on each half
  const halves = [[-0.75, 'oind'], [0.75, 'ored']];
  for (const [x, c] of halves) {
    s.push(box(x - 0.72, 1.95, 0.18, x + 0.72, 2.9, 0.22, c, { dither: { col: c === 'oind' ? '#34488a' : '#d85050', amt: 0.12 }, jit: 0.03 }));
    s.push(...bitmap(JP.yu, [x - 0.28, 2.66, 0.215], 0.08, 0.025, { '#': 'w' }, 'xy', { snap: vs, paint: 1 }));
  }
  s.push(cyl([-1.5, 2.92, 0.2], [1.5, 2.92, 0.2], 0.03, 'dwdD'));
  // paper lamp beside the door
  s.push(...chochin([1.95, 2.1, 0.25], 0.17, 0.24, '#fff1d6', '#e2b98a', 2, '#ff7a5a'), cyl([1.95, 2.9, 0.25], [1.95, 2.36, 0.25], 0.015, 'ink'));
  prop('ss_sento_gate', vs, s, { footprint: [3.6, 0.5], solid: false, light: { color: '#ffd8a0', intensity: 2.2, y: 2.4, range: 5, night: true }, tags: ['shinsekai', 'onsen', 'facade', 'light'] });
}

// ---- shateki (cork-gun shooting gallery): prize shelves, striped curtains, bulb fascia, cork guns
{
  const vs = 0.05, s = [];
  s.push(box(-1.5, 0, -0.7, 1.5, 2.7, -0.6, '#2a1430'));
  for (let k = 0; k < 3; k++) {
    const y = 0.9 + k * 0.5;
    s.push(box(-1.3, y, -0.6, 1.3, y + 0.05, -0.25, 'wdL'));
    for (let i = 0; i < 8; i++) {
      const x = -1.15 + i * 0.33, c = ['#ff6aa8', '#ffd23f', '#5fd35a', '#2fa8ff', '#b26bff', '#ff6a2b'][(i + k * 2) % 6];
      if ((i + k) % 3 === 0) s.push(ell([x, y + 0.14, -0.42], [0.1, 0.1, 0.08], c), sph([x - 0.04, y + 0.17, -0.34], 0.018, 'k'), sph([x + 0.04, y + 0.17, -0.34], 0.018, 'k'));
      else if ((i + k) % 3 === 1) s.push(box(x - 0.09, y + 0.05, -0.5, x + 0.09, y + 0.28, -0.34, c), box(x - 0.09, y + 0.15, -0.34, x + 0.09, y + 0.18, -0.33, 'w'));
      else s.push(vcyl(x, -0.42, y + 0.05, y + 0.25, 0.06, c), sph([x, y + 0.28, -0.42], 0.05, 'gold'));
    }
  }
  for (const sx of [-1, 1]) s.push(box(sx * 1.5 - 0.12, 0, -0.7, sx * 1.5 + 0.12, 2.4, 0.4, 'w', { stripes: { axis: 'z', p: 0.3, w: 0.15, col: 'lan' } }));
  s.push(box(-1.65, 2.4, -0.75, 1.65, 2.8, 0.45, 'lan', { jit: 0.02 }));
  for (let x = -1.55; x <= 1.56; x += 0.2) s.push(sph([x, 2.6, 0.46], 0.055, 'bulb', { glow: 2 }));
  s.push(box(-1.45, 0, 0.1, 1.45, 0.92, 0.4, 'wd', { stripes: { axis: 'x', p: 0.3, w: 0.04, col: 'wdD' } }));
  s.push(box(-1.5, 0.92, 0.05, 1.5, 0.98, 0.48, 'wdL'));
  for (const x of [-0.8, 0.0, 0.8]) s.push(box(x - 0.3, 0.99, 0.2, x + 0.15, 1.05, 0.28, 'dwd'), box(x + 0.1, 1.0, 0.18, x + 0.32, 1.04, 0.3, 'mtD'), box(x - 0.3, 0.97, 0.18, x - 0.15, 1.0, 0.3, 'dwdD'));
  for (let i = 0; i < 6; i++) s.push(sph([-1.2 + i * 0.12, 1.0, 0.38], 0.025, '#e8c896'));
  prop('ss_shateki', vs, s, { footprint: [3.2, 1.1], solid: true, destructible: true, hp: 80, debris: ['#d83a3c', '#ffffff', '#ffd23f'], light: { color: '#ffd27a', intensity: 2.5, y: 2.4, range: 5, night: true }, tags: ['shinsekai', 'game', 'stall', 'light'] });
}

// ---- smart-ball machines (old bagatelle): two tilted glass-topped tables with pins and white balls
{
  const vs = 0.04, s = [];
  for (const x of [-0.62, 0.62]) {
    for (const [dx, dz] of [[-0.45, -0.3], [0.45, -0.3], [-0.45, 0.3], [0.45, 0.3]]) s.push(box(x + dx - 0.03, 0, dz - 0.03, x + dx + 0.03, 0.85, dz + 0.03, 'mtD'));
    s.push(box(x - 0.52, 0.85, -0.42, x + 0.52, 1.0, 0.42, '#f2efe6', { rot: [-12, 0, 0] }));
    s.push(box(x - 0.48, 0.97, -0.38, x + 0.48, 1.0, 0.38, '#dfeef6', { rot: [-12, 0, 0], paint: 1 }));
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { const px = x - 0.36 + i * 0.18 + (j % 2) * 0.09, pz = -0.28 + j * 0.18; s.push(vcyl(px, pz, 0.95 - pz * 0.21, 1.02 - pz * 0.21, 0.012, 'gold')); }
    for (let i = 0; i < 4; i++) s.push(sph([x - 0.3 + i * 0.2, 1.0 - 0.1 * 0.21, 0.1], 0.03, 'w'));
    s.push(box(x - 0.5, 0.85, 0.42, x + 0.5, 0.95, 0.46, 'lan'));
    for (let i = 0; i < 6; i++) s.push(sph([x - 0.4 + i * 0.16, 0.9, 0.47], 0.025, (i % 2 ? 'ny' : 'nm'), { glow: 2 }));
  }
  prop('ss_smartball', vs, s, { footprint: [2.4, 0.9], solid: true, destructible: true, hp: 60, debris: ['#f2efe6', '#d83a3c', '#a9b1bb'], tags: ['shinsekai', 'game'] });
}

// ---- hand-painted movie billboard: an original kaiju Tokonmon over a burning skyline (wall-mounted)
{
  const vs = 0.06, s = [];
  s.push(box(-2.7, 0, -0.1, 2.7, 3.0, 0.0, 'dwdD'));
  s.push(box(-2.6, 0.1, 0.0, 2.6, 2.9, 0.06, '#ff9a5a', { grad: { axis: 'y', to: '#5a3a9a', a: 0.4, b: 2.9 } }));
  // skyline
  const r = rng(77);
  for (let x = -2.55; x < 2.5; x += 0.3) { const h = 0.4 + r() * 0.8; s.push(box(x, 0.1, 0.06, x + 0.26, 0.1 + h, 0.1, '#2a1a3a')); if (r() > 0.4) s.push(box(x + 0.08, 0.2 + h * 0.5, 0.1, x + 0.14, 0.26 + h * 0.5, 0.12, 'bulb', { glow: 1 })); }
  // kaiju: round purple body, spiky back, little arms, roaring beam
  s.push(ell([0.6, 1.25, 0.12], [0.85, 0.8, 0.06], '#7a3ab8', { belly: '#c89aff', bellyT: 0.2 }));
  s.push(ell([0.2, 2.0, 0.14], [0.45, 0.4, 0.06], '#7a3ab8'));
  for (let i = 0; i < 5; i++) s.push(poly([1.1 - i * 0.2, 1.6 + i * 0.17, 0.12], [[-0.12, 0], [0.12, 0], [0.04, 0.32]], 0.04, '#ffd23f'));
  s.push(ell([0.05, 2.08, 0.2], [0.09, 0.07, 0.03], 'w'), sph([0.03, 2.08, 0.22], 0.04, 'k'));
  s.push(box(-0.2, 1.88, 0.18, 0.1, 1.94, 0.2, 'k'));
  s.push(cap([-0.25, 1.9, 0.2], [-2.4, 2.45, 0.2], 0.08, 0.22, '#7ff0ff', { glow: 1 }));
  s.push(cap([0.1, 1.25, 0.16], [-0.3, 1.45, 0.18], 0.07, 0.06, '#7a3ab8'));
  for (let i = 0; i < 6; i++) s.push(ell([-2.2 + i * 0.35, 0.35 + (i % 2) * 0.12, 0.13], [0.16, 0.16, 0.04], i % 2 ? '#ffd23f' : '#ff5a3c'));
  // painted title
  s.push(...otext('MONSTER', [-0.4, 0.72, 0.18], 0.06, 0.025, '#ffe45c', '#2a0e1e'));
  s.push(box(-2.75, -0.05, 0.0, 2.75, 0.1, 0.12, 'dwd'), box(-2.75, 2.9, 0.0, 2.75, 3.05, 0.12, 'dwd'));
  for (const x of [-2.2, -1.0, 0.2, 1.4, 2.4]) s.push(cap([x, 3.05, 0.1], [x, 3.25, 0.45], 0.03, 0.03, 'mtD'), box(x - 0.08, 3.15, 0.4, x + 0.08, 3.25, 0.55, 'mtD'), sph([x, 3.12, 0.48], 0.05, 'bulbL', { glow: 2 }));
  prop('ss_movie_board', vs, s, { footprint: [5.4, 0.4], solid: false, light: { color: '#ffd8a0', intensity: 2, y: 2.6, range: 5, night: true }, tags: ['shinsekai', 'sign', 'cinema'] });
}

// ---- a row of red chōchin hung along an eave (facade-mounted, ~4 m)
{
  const vs = 0.05, s = [];
  s.push(box(-2.1, 0.92, -0.04, 2.1, 1.0, 0.06, 'dwd'));
  for (let i = 0; i < 7; i++) {
    const x = -1.8 + i * 0.6, white = i === 3;
    s.push(cyl([x, 0.92, 0.12], [x, 0.78, 0.12], 0.012, 'ink'));
    s.push(...chochin([x, 0.52, 0.12], 0.17, 0.25, white ? '#fff1d6' : '#ff4a3c', white ? '#e2b98a' : '#a8241c', 2, white ? '#ff5a3c' : '#ffd9a0'));
  }
  prop('ss_lantern_eave', vs, s, { footprint: [4.2, 0.4], solid: false, light: { color: '#ff8a5a', intensity: 2.5, y: 0.5, range: 6, night: true }, tags: ['shinsekai', 'street', 'festival', 'light'] });
}

// =====================================================================
// TEAM METALLICA BACK ALLEY (kid-friendly metal graffiti, posters, strays)
// =====================================================================

// ---- corrugated rolling shutters covered in original graffiti (two variants)
function shutter(id, tags, seed) {
  const vs = 0.05, s = [];
  s.push(box(-1.6, 2.6, -0.25, 1.6, 3.0, 0.12, 'mtD', { jit: 0.02 }));
  for (const sx of [-1.55, 1.55]) s.push(box(sx - 0.05, 0, -0.05, sx + 0.05, 2.6, 0.1, 'mtK'));
  s.push(box(-1.5, 0, -0.05, 1.5, 2.6, 0.04, 'rustL', { stripes: { axis: 'y', p: 0.1, w: 0.05, col: 'rust' }, dither: { col: '#5a3a2a', amt: 0.08 } }));
  s.push(box(-1.5, 0, 0.0, 1.5, 0.1, 0.06, 'mtK'));
  const r = rng(seed);
  for (let i = 0; i < 14; i++) { const x = -1.35 + r() * 2.7, y = 0.2 + r() * 2.2; s.push(box(x, y, 0.04, x + 0.08 + r() * 0.1, y + 0.06 + r() * 0.08, 0.06, ['#ffffff', 'gPink', 'gLime', 'eHydro', 'shy'][Math.floor(r() * 5)])); }
  s.push(...tags);
  prop(id, vs, s, { footprint: [3.2, 0.3], solid: false, tags: ['alley', 'shutter', 'graffiti'] });
}
shutter('ss_shutter_a', [
  ...otext('MOSH', [-0.25, 1.75, 0.08], 0.12, 0.025, 'gLime', 'gK'),
  ...otext('PIT', [0.6, 0.85, 0.08], 0.1, 0.025, 'gPink', 'gK'),
  ...['★'].flatMap(() => otext('★', [-1.0, 0.75, 0.08], 0.1, 0.025, 'chrome', 'gK')),
], 3);
shutter('ss_shutter_b', [
  ...otext('THRASH', [0, 1.6, 0.08], 0.09, 0.025, 'gPink', 'gK'),
  ...otext('♥', [-0.9, 0.7, 0.08], 0.1, 0.025, 'gLime', 'gK'),
  ...otext('TM', [0.7, 0.75, 0.08], 0.12, 0.025, 'chrome', 'gK'),
], 8);

// ---- big graffiti piece: a cartoon skull with horns made of guitar headstocks (wall-mounted)
{
  const vs = 0.06, s = [];
  s.push(ell([0, 1.5, 0], [2.1, 1.35, 0.05], 'gPink', { dither: { col: '#ff7ac8', amt: 0.2 } }));
  s.push(ell([0, 1.5, 0.02], [1.95, 1.2, 0.05], '#3a1a5a', { paint: 1 }));
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; s.push(poly([Math.cos(a) * 1.7, 1.5 + Math.sin(a) * 1.0, 0.04], [[-0.12, 0], [0.12, 0], [0, 0.35]], 0.03, 'gLime', { rot: [0, 0, (a * 180) / Math.PI - 90] })); }
  // skull
  s.push(ell([0, 1.55, 0.08], [0.72, 0.62, 0.05], 'chrome', { top: '#ffffff', topT: 0.5 }));
  s.push(box(-0.42, 0.8, 0.06, 0.42, 1.2, 0.12, 'chrome'));
  for (const sx of [-1, 1]) s.push(ell([sx * 0.28, 1.58, 0.14], [0.17, 0.2, 0.03], 'gK'), sph([sx * 0.25, 1.64, 0.17], 0.05, 'gLime', { glow: 1 }));
  s.push(poly([0, 1.3, 0.14], [[-0.08, 0], [0.08, 0], [0, 0.14]], 0.02, 'gK'));
  for (let i = 0; i < 5; i++) s.push(box(-0.34 + i * 0.17, 0.86, 0.12, -0.26 + i * 0.17, 1.12, 0.15, i % 2 ? '#ffffff' : 'chrome'));
  s.push(box(-0.42, 0.98, 0.12, 0.42, 1.0, 0.16, 'gK'));
  // guitar-headstock horns with tuning pegs
  for (const sx of [-1, 1]) {
    s.push(cap([sx * 0.55, 1.95, 0.1], [sx * 1.05, 2.55, 0.1], 0.1, 0.09, 'gK'));
    s.push(poly([sx * 1.2, 2.7, 0.1], [[-0.2, -0.25], [0.2, -0.25], [0.28, 0.25], [-0.12, 0.35]].map(([u, v]) => [u * sx, v]), 0.04, 'gPink', { rot: [0, 0, -sx * 35] }));
    for (let k = 0; k < 3; k++) s.push(sph([sx * (1.0 + k * 0.12) + sx * 0.18, 2.5 + k * 0.14, 0.14], 0.045, 'chrome'));
  }
  // lightning bolts + lettering
  for (const sx of [-1, 1]) s.push(poly([sx * 1.45, 1.1, 0.08], [[0, 0.5], [0.18, 0.5], [0.06, 0.15], [0.22, 0.15], [-0.05, -0.45], [0.04, -0.05], [-0.12, -0.05]], 0.03, 'shy'));
  s.push(...otext('TEAM METALLICA', [0, 0.42, 0.1], 0.07, 0.025, 'gLime', 'gK'));
  prop('ss_skull_piece', vs, s, { footprint: [4.2, 0.3], solid: false, tags: ['alley', 'graffiti', 'metal'] });
}

// ---- layered, torn metal gig posters (original "bands" named after Tokonmon) (wall-mounted)
{
  const vs = 0.04, s = [];
  const posters = [
    [-0.8, 1.2, 0.7, 1.0, 'paper', 'IRON', 'MAW', '#c8283a'], [0.0, 1.35, 0.75, 1.05, '#ffd23f', 'MOSH', 'NITE', 'gK'],
    [0.8, 1.15, 0.7, 0.95, '#2a2632', 'STUD', 'RAT', 'gLime'], [-0.4, 0.45, 0.8, 0.7, '#f4f2ee', 'LIVE', '¥500', '#2a4d8f'],
    [0.5, 0.4, 0.7, 0.7, 'gPink', 'LOUD', '!!!', 'gK'],
  ];
  posters.forEach(([x, y, w, h, bg, a, b, ink], i) => {
    const z = 0.01 + i * 0.03;
    s.push(box(x - w / 2, y - h / 2, z, x + w / 2, y + h / 2, z + 0.03, bg, { jit: 0.03 }));
    s.push(...text(a, [x, y + h * 0.2, z + 0.04], 0.04, 0.012, ink));
    s.push(...text(b, [x, y - h * 0.15, z + 0.04], 0.035, 0.012, ink));
    s.push(box(x - w / 2 + 0.05, y - h / 2 + 0.05, z + 0.03, x - w / 2 + 0.1, y - h / 2 + 0.1, z + 0.045, 'paperD'));
  });
  prop('ss_gig_posters', vs, s, { footprint: [2.4, 0.2], solid: false, tags: ['alley', 'poster', 'metal'] });
}

// ---- oil drum with a fire, dented, rust ribs
{
  const vs = 0.04, s = [];
  s.push(vcyl(0, 0, 0, 0.9, 0.3, 'rustL', { stripes: { axis: 'y', p: 0.3, w: 0.04, col: 'rust' }, dither: { col: '#4a3226', amt: 0.15 }, jit: 0.03 }));
  s.push(vcyl(0, 0, 0.82, 0.92, 0.25, 'k', { sub: 1 }));
  s.push(vcyl(0, 0, 0.7, 0.84, 0.25, 'no', { glow: 2, dither: { col: 'nr', amt: 0.4 } }));
  s.push(ell([0, 0.86, 0], [0.16, 0.1, 0.16], 'ny', { glow: 3 }));
  for (let i = 0; i < 4; i++) { const a = i * 1.6; s.push(cap([Math.cos(a) * 0.12, 0.78, Math.sin(a) * 0.12], [Math.cos(a) * 0.05, 1.0, Math.sin(a) * 0.05], 0.035, 0.03, '#3a2a22')); }
  prop('ss_drum_fire', vs, s, { footprint: [0.7, 0.7], solid: true, round: true, light: { color: '#ff8a3a', intensity: 3.5, y: 1.1, range: 6.5, night: false }, tags: ['alley', 'fire', 'light'] },
    { fx: [{ part: 'body', at: [0, 1.0, 0], type: 'flame', rate: 1, scale: 1.3 }, { part: 'body', at: [0, 1.1, 0], type: 'ember', rate: 0.8 }, { part: 'body', at: [0, 1.6, 0], type: 'smoke', rate: 0.5 }] });
}

// ---- the gang couch + their "sound system" amp stack
{
  const vs = 0.05, s = [];
  s.push(box(-1.0, 0.08, -0.4, 1.0, 0.45, 0.35, '#7a2a3a', { round: 0.06, dither: { col: '#5a1a2a', amt: 0.12 } }));
  s.push(box(-1.0, 0.45, -0.42, 1.0, 1.0, -0.15, '#7a2a3a', { round: 0.08 }));
  for (const sx of [-1, 1]) s.push(box(sx * 1.0 - 0.15, 0.08, -0.42, sx * 1.0 + 0.12, 0.75, 0.35, '#6a2232', { round: 0.07 }));
  s.push(box(-0.85, 0.45, -0.12, -0.02, 0.58, 0.32, '#8a3446', { round: 0.05 }), box(0.02, 0.45, -0.12, 0.85, 0.58, 0.32, '#8a3446', { round: 0.05 }));
  s.push(box(0.3, 0.55, 0.05, 0.6, 0.6, 0.2, 'paper', { paint: 1 }));
  s.push(box(-0.6, 0.62, -0.42, -0.35, 0.85, -0.38, 'shy'));
  for (const [x, z] of [[-0.9, -0.3], [0.9, -0.3], [-0.9, 0.25], [0.9, 0.25]]) s.push(box(x - 0.04, 0, z - 0.04, x + 0.04, 0.1, z + 0.04, 'k'));
  // amp stack
  const ax = 1.75;
  for (let k = 0; k < 2; k++) {
    const y = k * 0.62;
    s.push(box(ax - 0.42, y, -0.32, ax + 0.42, y + 0.6, 0.28, 'gK', { round: 0.03 }));
    s.push(box(ax - 0.36, y + 0.06, 0.27, ax + 0.36, y + 0.54, 0.3, '#3a3a40', { stripes: { axis: 'y', p: 0.06, w: 0.02, col: '#26262a' } }));
    for (const sx of [-0.17, 0.17]) s.push(cyl([ax + sx, y + 0.3, 0.29], [ax + sx, y + 0.3, 0.31], 0.14, '#1a1a1e'));
  }
  s.push(box(ax - 0.42, 1.24, -0.3, ax + 0.42, 1.5, 0.25, 'gK'), box(ax - 0.36, 1.3, 0.24, ax + 0.36, 1.36, 0.27, 'gold'));
  for (let i = 0; i < 5; i++) s.push(sph([ax - 0.28 + i * 0.14, 1.42, 0.26], 0.03, 'chrome'));
  s.push(sph([ax + 0.32, 1.32, 0.27], 0.025, 'nr', { glow: 2 }));
  prop('ss_gang_couch', vs, s, { footprint: [3.0, 0.8], solid: true, destructible: true, hp: 80, debris: ['#7a2a3a', '#111111', '#d5dbe1'], tags: ['alley', 'furniture', 'metal'] });
}

// ---- stray cats (Moshi's spot): orange tabby, black cat, calico, food bowls and a cardboard box shelter
{
  const vs = 0.025, s = [];
  const cat = (x, z, c, c2, face = 0, sit = true) => {
    const f = face;
    s.push(ell([x, 0.14, z], [0.11, 0.13, 0.15], c, { belly: c2, dither: c2 ? { col: c2, amt: 0.1 } : undefined }));
    s.push(sph([x, 0.32, z + 0.08 * Math.cos(f)], 0.095, c));
    for (const sx of [-1, 1]) s.push(poly([x + sx * 0.055, 0.4, z + 0.08], [[-0.035, 0], [0.035, 0], [0, 0.07]], 0.015, c));
    for (const sx of [-1, 1]) s.push(sph([x + sx * 0.035, 0.33, z + 0.17], 0.015, '#ffe45c'), vox(vs, x + sx * 0.035, 0.33, z + 0.18, 'k'));
    s.push(...tube(bez([x, 0.06, z - 0.13], [x + 0.18, 0.05, z - 0.2], [x + 0.2, 0.2, z - 0.08], 4), 0.025, 0.02, c));
  };
  cat(-0.35, 0.05, '#f0a040', '#fff0d8'); cat(0.15, -0.05, '#26222a', '#3a3440'); cat(0.55, 0.15, '#f4f0e8', '#e08a3a');
  for (const x of [-0.1, 0.35]) s.push(vcyl(x, 0.3, 0, 0.06, 0.09, x < 0 ? '#3f8fe0' : '#ff6aa8'), vcyl(x, 0.3, 0.04, 0.07, 0.07, '#a86a3a'));
  s.push(box(-0.95, 0, -0.35, -0.55, 0.36, 0.1, '#c8a06a', { jit: 0.03 }), box(-0.9, 0.04, 0.05, -0.6, 0.3, 0.12, 'k', { sub: 1 }));
  s.push(box(-0.92, 0.04, -0.3, -0.58, 0.07, 0.08, '#ff9ab8'));
  prop('ss_stray_cats', vs, s, { footprint: [1.6, 0.6], solid: false, tags: ['alley', 'animals', 'cats'] });
}

// ---- steel fire escape (two landings, zig-zag stairs; wall-mounted, ~6 m)
{
  const vs = 0.05, s = [];
  for (const y of [3.0, 6.0]) {
    s.push(box(-1.4, y - 0.08, 0, 1.4, y, 1.0, 'mtK', { stripes: { axis: 'x', p: 0.15, w: 0.05, col: '#2a2e36' } }));
    s.push(box(-1.4, y, 0.96, 1.4, y + 1.0, 1.0, 'mtK', { stripes: { axis: 'x', p: 0.2, w: 0.04, col: 'k' } }), box(-1.4, y + 0.06, 0.97, 1.4, y + 0.94, 1.01, 'k', { sub: 1 }));
    s.push(box(-1.4, y + 0.94, 0.94, 1.4, y + 1.0, 1.02, 'mtK'));
    for (const x of [-1.4, -0.7, 0, 0.7, 1.4]) s.push(box(x - 0.025, y, 0.95, x + 0.025, y + 1.0, 1.0, 'mtK'));
  }
  for (const [y0, y1, dir] of [[0.0, 2.95, 1], [3.0, 5.95, -1]]) {
    const n = 10;
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = dir * (-1.1 + t * 2.0), y = y0 + t * (y1 - y0); s.push(box(x - 0.12, y - 0.03, 0.15, x + 0.12, y, 0.75, 'mtK')); }
    s.push(...tube([[dir * -1.1, y0 + 0.9, 0.78], [dir * 0.9, y1 + 0.9, 0.78]], 0.025, 0.025, 'mtK'));
  }
  s.push(box(-1.45, 6.0, 0, 1.45, 6.05, 0.05, 'rust'));
  prop('ss_fire_escape', vs, s, { footprint: [2.8, 1.0], solid: false, tags: ['alley', 'building'] });
}

// ---- pipes, meters and a cable tangle (wall-mounted) with dripping water
{
  const vs = 0.04, s = [];
  s.push(vcyl(-0.9, 0.12, 0, 4.2, 0.07, 'mt', { stripes: { axis: 'y', p: 1.0, w: 0.04, col: 'mtD' } }));
  s.push(cyl([-0.9, 2.4, 0.12], [0.9, 2.4, 0.12], 0.06, 'rustL', { stripes: { axis: 'x', p: 0.6, w: 0.05, col: 'rust' } }));
  s.push(vcyl(0.9, 0.12, 0.3, 2.45, 0.06, 'rustL'), cyl([0.9, 0.3, 0.12], [1.1, 0.25, 0.12], 0.06, 'rustL'));
  for (const [x, y] of [[-0.4, 1.4], [0.15, 1.45]]) s.push(box(x - 0.15, y - 0.2, 0.0, x + 0.15, y + 0.2, 0.14, '#c8c4bc'), cyl([x, y + 0.05, 0.14], [x, y + 0.05, 0.17], 0.08, '#eafcff'), vox(vs, x, y + 0.05, 0.18, 'k'));
  for (let i = 0; i < 5; i++) s.push(...tube(bez([-1.0, 3.6 - i * 0.07, 0.2], [0, 3.0 - i * 0.12, 0.25 + i * 0.03], [1.1, 3.5 - i * 0.05, 0.2], 6), 0.025, 0.025, ['k', '#3a3a40', '#2a2632', 'ink', '#4a4658'][i]));
  prop('ss_pipes', vs, s, { footprint: [2.2, 0.3], solid: false, tags: ['alley', 'building'] },
    { fx: [{ part: 'body', at: [1.12, 0.22, 0.12], type: 'drip', rate: 0.6 }] });
}

// ---- chain-link fence segment (2 m) and a variant with the mesh peeled open (the gap the kids use)
function chainlink(id, gap) {
  const vs = 0.035, s = [];
  for (const sx of [-1, 1]) s.push(vcyl(sx, 0, 0, 2.1, 0.035, 'mt'));
  s.push(cyl([-1, 2.05, 0], [1, 2.05, 0], 0.03, 'mt'), cyl([-1, 0.08, 0], [1, 0.08, 0], 0.025, 'mt'));
  for (let i = -8; i <= 8; i++) {
    for (const d of [1, -1]) {
      const x0 = i * 0.2, ok = (x) => !gap || !(x > 0.0 && x < 1.0);
      const pts = [];
      for (let k = 0; k <= 10; k++) { const y = 0.1 + k * 0.19, x = x0 + d * (k * 0.19) * 0.5; if (x > -0.98 && x < 0.98 && ok(x) && !(gap && y < 1.2 && x > -0.1 && x < 1)) pts.push([x, y, 0]); }
      for (let k = 0; k + 1 < pts.length; k++) s.push(cap(pts[k], pts[k + 1], 0.012, 0.012, 'mtD'));
    }
  }
  if (gap) { s.push(...tube(bez([0.0, 1.2, 0], [0.4, 0.8, 0.35], [0.95, 1.1, 0.25], 4), 0.02, 0.02, 'mtD')); }
  s.push(box(-0.5, 1.3, 0.03, 0.1, 1.75, 0.05, '#ffd23f'), ...text('NO', [-0.2, 1.53, 0.06], 0.05, 0.01, 'gK'));
  prop(id, vs, s, { footprint: [2.0, 0.2], solid: !gap, tags: ['alley', 'fence'] });
}
chainlink('ss_chainlink', false);
chainlink('ss_chainlink_gap', true);

// ---- flickering sodium lamp on a bracket pole
{
  const vs = 0.04, s = [];
  s.push(vcyl(0, 0, 0, 4.0, 0.06, 'mtD', { jit: 0.03 }));
  s.push(...tube(bez([0, 3.9, 0], [0, 4.3, 0.1], [0, 4.2, 0.8], 4), 0.045, 0.04, 'mtD'));
  s.push(ell([0, 4.12, 0.85], [0.16, 0.08, 0.26], 'mtK'), box(-0.1, 4.04, 0.7, 0.1, 4.07, 1.0, 'sod', { glow: 3 }));
  s.push(box(-0.12, 1.6, 0.05, 0.12, 2.0, 0.08, 'paper'), box(-0.1, 1.7, 0.08, 0.1, 1.74, 0.09, 'gK'));
  prop('ss_sodium_lamp', vs, s, { footprint: [0.3, 0.3], solid: true, light: { color: '#ffb35c', intensity: 4.5, y: 4.0, range: 9, night: true }, tags: ['alley', 'light'] });
}

// ---- puddle reflecting neon (flat, walkable)
{
  const vs = 0.05, s = [];
  s.push(ell([0, 0.015, 0], [0.9, 0.02, 0.45], 'wet'));
  s.push(ell([0.2, 0.03, 0.05], [0.5, 0.012, 0.12], 'nm', { glow: 1 }), ell([-0.3, 0.03, -0.1], [0.35, 0.012, 0.08], 'nc', { glow: 1 }));
  s.push(ell([0.45, 0.025, -0.2], [0.25, 0.012, 0.1], 'sod', { glow: 1 }));
  prop('ss_puddle', vs, s, { footprint: [1.8, 0.9], solid: false, tags: ['alley', 'water'] });
}

// ---- dented dumpster with a lid and stickers
{
  const vs = 0.05, s = [];
  s.push(box(-0.85, 0.12, -0.45, 0.85, 1.15, 0.45, '#2f6a4a', { stripes: { axis: 'x', p: 0.3, w: 0.04, col: '#245438' }, jit: 0.03 }));
  s.push(box(-0.9, 1.15, -0.5, 0.9, 1.25, 0.48, '#26553c', { rot: [-6, 0, 0] }));
  for (const sx of [-0.7, 0.7]) s.push(cyl([sx, 0.07, 0.35], [sx, 0.07, 0.2], 0.07, 'k'));
  s.push(box(-0.3, 0.5, 0.45, 0.1, 0.75, 0.47, 'gPink'), box(0.25, 0.7, 0.45, 0.5, 0.9, 0.47, 'gLime'));
  prop('ss_dumpster', vs, s, { footprint: [1.7, 0.95], solid: true, destructible: true, hp: 150, debris: ['#2f6a4a', '#111111'], tags: ['alley', 'clutter'] });
}

export const DESIGNS = D;
export const PROP_META = M;
