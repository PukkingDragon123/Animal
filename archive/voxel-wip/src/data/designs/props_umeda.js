// Umeda props: the Sky District strip, the Tokonmon League HQ lobby, the Umeda
// Food Hall and the high-tech stadium (ROCK YOU DOME). Voxel DSL, see
// docs/MODELING.md / docs/SCENES.md. Props stand on y = 0, centred on
// x = z = 0, front = +z, 1 unit = 1 m. Every id is prefixed `um_` so it is
// unique across the prop modules (merged by designs/index.js).
//
// Reference study: docs/refs/environments.md §4.4 (food hall), §5 (Umeda Sky
// District + League HQ lobby), §6 (stadium), §9 (facade kit);
// docs/refs/combat_ui_effects.md §2 (gate pads with 7 LED pips, jumbotron,
// crowd, reporters & camera crew). All emblems, crests and banners are
// original designs (no real logos, crests or faces).
//
// Prop tags used by the stadium (PROP_META.tags):
//   'arena_floor'   the neutral hex floor overlay. It belongs to the default
//                   (no variant) floor: hide it while an arenaFloors variant
//                   (rocky / grassy / water) is active.
//   'arena_rocky' / 'arena_grassy' / 'arena_water'  variant terrain props.
import { PROP_PAL } from './props.js';

const D = {}, M = {};

// ---------------------------------------------------------------- palette
const P = Object.assign({}, PROP_PAL, {
  // League brand (environments.md §5c)
  lv: '#141a3a', lvM: '#1f2a58', lvL: '#2c3a78', lvK: '#0c1026',
  lgd: '#f2c24c', lgdD: '#c7902c', lgdL: '#ffe28a',
  lcy: '#3ff0ff', lmg: '#ff4ac8', lwh: '#f4f6fb',
  holo: '#7ff6ff', holoD: '#3fb8d0', holoL: '#d8fdff',
  // Umeda 2050 materials
  gl: '#9cc8e8', glD: '#5d8fb8', glL: '#cfe8ff', glK: '#2e4a6e',
  al: '#c7ced6', alD: '#9aa3ae', alL: '#e6ebf0',
  ws: '#eef0f0', wsD: '#d4d8dc',
  tb: '#c99a68', tbD: '#9a6e44', tbL: '#e2bf8e',
  lawn: '#6fb24a', lawnD: '#4f8f38',
  fr: '#d83a3c',
  // stadium
  bowl: '#10152b', bowlM: '#1c2340', seat: '#2a3560', seatL: '#3a4a80',
  tA: '#ff4a3d', tAD: '#c2302a', tB: '#3da8ff', tBD: '#2a6fc2',
  led: '#050608',
  // skin tones for crowd figures
  sk1: '#fbd5bb', sk2: '#f3c29f', sk3: '#e4a97f', sk4: '#cc8d62', sk5: '#ad6e47', sk6: '#8a5233',
  hr1: '#1e1b26', hr2: '#3d2b25', hr3: '#6e4431', hr4: '#e9c47c', hr5: '#ff5d7c', hr6: '#3ac6ff',
  // food
  cu: '#a8641e', cuD: '#7a4214', rice: '#fff8ea', chi: '#e8231e', chiD: '#a8140f', chiG: '#3fa83a',
});

// ---------------------------------------------------------------- helpers
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
// vertical prism (n-gon footprint) from y0 to y1
const prism = (n, x, z, y0, y1, r, c, o, rot = Math.PI / n) => poly([x, (y0 + y1) / 2, z], ngon(n, r, rot), (y1 - y0) / 2 + E, c, Object.assign({ plane: 'xz' }, o));
// front-facing (xy) polygon slab centred at c, half thickness h
const plate = (c, pts, h, col, o) => poly(c, pts, h, col, Object.assign({ plane: 'xy' }, o));
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
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
// 3×5 pixel font (signage)
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
  ':': ['.', '#', '.', '#', '.'], '/': ['..#', '..#', '.#.', '#..', '#..'], '&': ['.#.', '#.#', '.#.', '#.#', '.##'], "'": ['#', '#', '.', '.', '.'],
  '+': ['...', '.#.', '###', '.#.', '...'], '¥': ['#.#', '.#.', '###', '.#.', '.#.'], '*': ['...', '#.#', '.#.', '#.#', '...'],
};
// rows of chars → run-length boxes on a front (xy) or side (zy) plane; o = top-left pixel centre
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
      const y = o[1] - r * px, u0 = c * px, u1 = e * px, col = cmap[ch];
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
const textW = (str, px, gap = 1) => textRows(str, gap)[0].length * px;
// text centred at c on the xy plane (front +z)
function text(str, c, px, d, col, opts, gap = 1) {
  const rows = textRows(str, gap);
  const w = rows[0].length;
  return bitmap(rows.map((r) => r.replace(/#/g, 'a')), [c[0] - ((w - 1) * px) / 2, c[1] + 2 * px, c[2]], px, d, { a: col }, 'xy', opts);
}
function prop(id, vs, parts, meta, extra = {}) {
  const isParts = Array.isArray(parts) && parts.length && !Array.isArray(parts[0]) && parts[0].n;
  const list = isParts ? parts : [{ n: 'body', p: [0, 0, 0], s: parts }];
  for (const pt of list) pt.s.push(['box', [0, -50 - vs * 0.5, 0], [1000, 50, 1000], 'k', { sub: 1 }]);
  D[id] = Object.assign({ id: 'prop_' + id, vs, arch: 'static', anim: { bounce: 0 }, pal: P, parts: list }, extra);
  M[id] = Object.assign({ footprint: [1, 1], solid: true, destructible: false, hp: 0, debris: [], light: null, tags: [] }, meta);
}
const STAR5 = (ro, ri, rot = Math.PI / 2) => Array.from({ length: 10 }, (_, i) => { const a = rot + (i / 10) * Math.PI * 2, r = i % 2 ? ri : ro; return [Math.cos(a) * r, Math.sin(a) * r]; });
const HEX = (r) => ngon(6, r, Math.PI / 2);        // pointy-top hexagon (u, v)
const FLAT_HEX = (r) => ngon(6, r, 0);              // flat-top hexagon

// The Tokonmon League emblem (original): a pointy hexagon shield (navy, gold
// rim), a cyan ring, a soul-stone gem with a four-point sparkle, a three-point
// gold crown and two swept wings. Shapes centred at (cx, cy), front plane z0.
function leagueEmblem(cx, cy, z0, S = 1, o = {}) {
  const s = [];
  const G = { jit: 0.02 }, GL = { glow: 2, jit: 0.02 };
  // wings
  for (const sx of [1, -1]) {
    const w = [[0, 0.5], [1.05, 1.0], [1.55, 0.75], [1.25, 0.35], [1.6, 0.15], [1.2, -0.15], [1.45, -0.4], [0.9, -0.45], [0, -0.3]].map(([u, v]) => [sx * (0.9 + u) * S, v * S]);
    s.push(plate([cx, cy + 0.1 * S, z0 - 0.04 * S], w, 0.06 * S, 'lgd', G));
    s.push(plate([cx, cy + 0.1 * S, z0 - 0.02 * S], w.map(([u, v]) => [u * 0.96 + sx * 0.04 * S, v * 0.8 - 0.02 * S]), 0.06 * S, 'lgdD', { paint: 1, stripes: { axis: 'y', p: 0.22 * S, w: 0.07 * S, col: 'lgdL' } }));
  }
  s.push(plate([cx, cy, z0], HEX(1.25 * S), 0.12 * S, 'lgd', G));
  s.push(plate([cx, cy, z0 + 0.06 * S], HEX(1.08 * S), 0.1 * S, 'lv', G));
  s.push(tor([cx, cy, z0 + 0.16 * S], 0.78 * S, 0.06 * S, 'lcy', { axis: 'z', glow: 2 }));
  // soul-stone gem (rhombus, two tones) + sparkle
  s.push(plate([cx, cy + 0.08 * S, z0 + 0.2 * S], [[0, 0.58 * S], [0.36 * S, 0.08 * S], [0, -0.5 * S], [-0.36 * S, 0.08 * S]], 0.06 * S, 'lcy', GL));
  s.push(plate([cx, cy + 0.08 * S, z0 + 0.24 * S], [[0, 0.58 * S], [0.36 * S, 0.08 * S], [0, 0.08 * S], [-0.36 * S, 0.08 * S]], 0.04 * S, 'holoL', { glow: 2, paint: 1 }));
  s.push(plate([cx, cy + 0.08 * S, z0 + 0.24 * S], [[0, -0.5 * S], [0.36 * S, 0.08 * S], [0, 0.08 * S]], 0.04 * S, 'lmg', { glow: 2, paint: 1 }));
  s.push(plate([cx + 0.5 * S, cy + 0.6 * S, z0 + 0.22 * S], [[0, 0.22 * S], [0.05 * S, 0.05 * S], [0.22 * S, 0], [0.05 * S, -0.05 * S], [0, -0.22 * S], [-0.05 * S, -0.05 * S], [-0.22 * S, 0], [-0.05 * S, 0.05 * S]], 0.04 * S, 'w', { glow: 3 }));
  // crown
  s.push(plate([cx, cy + 1.42 * S, z0], [[-0.55, -0.2], [0.55, -0.2], [0.62, 0.35], [0.3, 0.08], [0, 0.5], [-0.3, 0.08], [-0.62, 0.35]].map(([u, v]) => [u * S, v * S]), 0.1 * S, 'lgd', G));
  for (const u of [-0.62, 0, 0.62]) s.push(sph([cx + u * S, cy + 1.42 * S + (u ? 0.38 : 0.53) * S, z0], 0.08 * S, u ? 'lcy' : 'lmg', { glow: 2 }));
  if (o.ribbon !== false) {
    s.push(box(cx - 1.75 * S, cy - 1.75 * S, z0 - 0.06 * S, cx + 1.75 * S, cy - 1.2 * S, z0 + 0.12 * S, 'lv', G));
    s.push(box(cx - 1.8 * S, cy - 1.8 * S, z0 - 0.08 * S, cx + 1.8 * S, cy - 1.15 * S, z0 + 0.1 * S, 'lgd', G));
    s.push(box(cx - 1.72 * S, cy - 1.72 * S, z0 + 0.05 * S, cx + 1.72 * S, cy - 1.23 * S, z0 + 0.2 * S, 'k', { sub: 1 }));
    s.push(box(cx - 1.72 * S, cy - 1.72 * S, z0, cx + 1.72 * S, cy - 1.23 * S, z0 + 0.08 * S, 'lv', G));
  }
  return s;
}

// =====================================================================
// UMEDA SKY DISTRICT (street strip)
// =====================================================================

// ---- League emblem (wall mounted, ~4 m wide) --------------------------------------------------------
{
  const vs = 0.06, s = [];
  s.push(...leagueEmblem(0, 2.4, 0.1, 1.0));
  s.push(...text('TOKONMON', [0, 0.87, 0.24], vs, 0.05, 'lgdL', { glow: 2, snap: vs }));
  prop('um_league_emblem', vs, s, { footprint: [3.6, 0.5], solid: false, light: { color: '#3ff0ff', intensity: 3, y: 2.4, range: 7, night: true }, tags: ['umeda', 'league', 'sign', 'neon', 'light'] });
}

// ---- LED fin facade module (2 m bay, 10 m tall; League HQ glass atrium) ---------------------------
function ledFins(id, c0, c1) {
  const vs = 0.07, s = [];
  for (const x of [-0.66, 0, 0.66]) {
    s.push(box(x - 0.07, 0.3, 0, x + 0.07, 10, 0.75, 'alL', { jit: 0.02, stripes: { axis: 'y', p: 3, w: 0.1, col: 'alD' } }));
    s.push(box(x - 0.045, 0.6, 0.72, x + 0.045, 9.8, 0.8, c0, { glow: 2, jit: 0, grad: { axis: 'y', to: c1, a: 0.6, b: 9.8 }, stripes: { axis: 'y', p: 0.42, w: 0.14, col: 'lvL' } }));
  }
  s.push(box(-1, 0, 0, 1, 0.3, 0.8, 'alD', { jit: 0.02 }), box(-1, 10, -0.05, 1, 10.25, 0.85, 'alL', { jit: 0.02 }));
  s.push(box(-1, 10.05, 0.8, 1, 10.18, 0.88, 'lgd', { glow: 1 }));
  prop(id, vs, s, { footprint: [2, 0.8], solid: true, tags: ['umeda', 'league', 'facade', 'neon'] });
}
ledFins('um_led_fins', 'lcy', 'nv');
ledFins('um_led_fins_g', 'lgd', 'lmg');

// ---- hologram of the reigning champion's partner (a jet-black cheetah-cat with op-art ring targets
//      and a comet tail, rendered as a cyan scanline hologram) — returns shapes centred on (0, 0, 0)
function holoCat(S = 1) {
  const H = { glow: 1, jit: 0.02, stripes: { axis: 'y', p: 0.11 * S, w: 0.035 * S, col: 'holoD' } };
  const HL = { glow: 2, jit: 0.02 };
  const s = [];
  s.push(ell([0, 0, 0], [0.32 * S, 0.27 * S, 0.85 * S], 'holo', Object.assign({ rot: [-8, 0, 0] }, H)));                 // body (leaping)
  s.push(ell([0, 0.12 * S, 0.62 * S], [0.28 * S, 0.27 * S, 0.3 * S], 'holo', H));                                    // chest
  s.push(sph([0, 0.32 * S, 0.98 * S], 0.25 * S, 'holo', H));                                                      // head
  s.push(ell([0, 0.24 * S, 1.2 * S], [0.13 * S, 0.1 * S, 0.12 * S], 'holo', H));                                  // muzzle
  for (const sx of [1, -1]) {
    s.push(cap([sx * 0.13 * S, 0.5 * S, 0.95 * S], [sx * 0.19 * S, 0.72 * S, 0.9 * S], 0.08 * S, 0.02 * S, 'holo', H)); // ears
    s.push(sph([sx * 0.1 * S, 0.37 * S, 1.18 * S], 0.045 * S, 'w', { glow: 3 }));                                   // eyes
    s.push(...tube([[sx * 0.16 * S, -0.05 * S, 0.62 * S], [sx * 0.2 * S, -0.3 * S, 1.0 * S], [sx * 0.18 * S, -0.42 * S, 1.42 * S]], 0.09 * S, 0.06 * S, 'holo', H));  // fore legs reaching
    s.push(...tube([[sx * 0.18 * S, -0.05 * S, -0.55 * S], [sx * 0.2 * S, -0.35 * S, -0.9 * S], [sx * 0.16 * S, -0.3 * S, -1.35 * S]], 0.11 * S, 0.06 * S, 'holo', H)); // hind legs kicking
    s.push(tor([sx * 0.31 * S, 0.02 * S, -0.1 * S], 0.16 * S, 0.03 * S, 'holoL', { axis: 'x', glow: 2, paint: 1 }));   // op-art ring targets
    s.push(tor([sx * 0.31 * S, 0.02 * S, -0.1 * S], 0.07 * S, 0.025 * S, 'lmg', { axis: 'x', glow: 2, paint: 1 }));
  }
  // comet tail (sweeping up) with trailing sparks
  s.push(...tube(bez([0, 0.1 * S, -0.8 * S], [0, 0.2 * S, -1.6 * S], [0, 0.9 * S, -1.9 * S], 5), 0.08 * S, 0.22 * S, 'holo', H));
  s.push(sph([0, 0.95 * S, -1.95 * S], 0.26 * S, 'holoL', HL));
  for (const [x, y, z, r] of [[0.15, 1.3, -2.25, 0.09], [-0.12, 1.5, -2.0, 0.07], [0.05, 1.7, -2.4, 0.06], [-0.2, 1.15, -2.45, 0.05]]) s.push(sph([x * S, y * S, z * S], r * S, 'holoL', HL));
  // crown
  s.push(plate([0, 0.62 * S, 0.98 * S], [[-0.16, 0], [0.16, 0], [0.2, 0.16], [0.08, 0.06], [0, 0.2], [-0.08, 0.06], [-0.2, 0.16]].map(([u, v]) => [u * S, v * S]), 0.06 * S, 'lgdL', HL));
  return s;
}

// ---- holo-statue projector (champion hologram looping above the HQ entrance) -----------------------
{
  const vs = 0.05, s = [];
  s.push(vcyl(0, 0, 0, 0.42, 0.95, 'lv', { jit: 0.02 }), vcyl(0, 0, 0.42, 0.5, 1.0, 'lgd', { jit: 0.02 }));
  s.push(vcyl(0, 0, 0.5, 0.62, 0.7, 'ink', { jit: 0.02 }), vcyl(0, 0, 0.6, 0.66, 0.5, 'holoL', { glow: 3 }));
  s.push(tor([0, 0.3, 0], 0.96, 0.04, 'lcy', { glow: 2 }));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; s.push(vox(vs, Math.cos(a) * 0.82, 0.46, Math.sin(a) * 0.82, i % 2 ? 'lmg' : 'lcy', { glow: 2 })); }
  // light cone rings
  for (const [y, r] of [[1.0, 0.42], [1.45, 0.62], [1.9, 0.8]]) s.push(tor([0, y, 0], r, 0.018, 'holo', { glow: 1 }));
  const parts = [{ n: 'body', p: [0, 0, 0], s }];
  const h = holoCat(1.35);
  // shift the hologram up to y 2.6 (part pivot) — shapes are written in model space
  const up = (t, dy) => { const q = JSON.parse(JSON.stringify(t)); if (q[0] === 'cap' || q[0] === 'cyl') { q[1][1] += dy; q[2][1] += dy; } else q[1][1] += dy; return q; };
  parts.push({ n: 'holo', p: [0, 2.9, 0], s: h.map((t) => up(t, 2.9)), spin: { axis: 'y', speed: 0.55 } });
  prop('um_holo_statue', vs, parts, { footprint: [1.9, 1.9], solid: true, round: true, light: { color: '#7ff6ff', intensity: 5, y: 2.6, range: 8, night: false }, tags: ['umeda', 'league', 'hologram', 'light'] });
}

// ---- Grand Front-style stepped water cascade (6 m) -------------------------------------------------
{
  const vs = 0.08, s = [];
  const ST = { jit: 0.03, stripes: { axis: 'x', p: 1.2, w: 0.08, col: 'wsD' } };
  s.push(box(-3.1, 0, -1.6, 3.1, 0.35, 1.6, 'ws', ST));
  s.push(box(-3, 0.35, -1.5, 3, 0.75, 0.6, 'ws', ST), box(-3, 0.75, -1.5, 3, 1.15, -0.3, 'ws', ST), box(-3, 1.15, -1.5, 3, 1.5, -1.0, 'ws', ST));
  // water: pools on each tread + sheets over each riser
  const W = { glow: 1, jit: 0.03, stripes: { axis: 'x', p: 0.32, w: 0.08, col: 'waL' } };
  s.push(box(-2.9, 0.3, 0.7, 2.9, 0.38, 1.5, 'wa', { jit: 0.04, dither: { col: 'waL', amt: 0.18 } }));
  for (const [y0, y1, z] of [[0.35, 0.75, 0.62], [0.75, 1.15, -0.28], [1.15, 1.5, -0.98]]) {
    s.push(box(-2.9, y0, z, 2.9, y1 + 0.02, z + 0.07, 'waL', W));
    s.push(box(-2.9, y1 - 0.02, z - 0.85, 2.9, y1 + 0.03, z, 'wa', { paint: 1, dither: { col: 'waW', amt: 0.12 } }));
  }
  s.push(box(-3.12, 0.34, -1.62, -2.95, 1.55, 1.62, 'wsD', { jit: 0.02 }), box(2.95, 0.34, -1.62, 3.12, 1.55, 1.62, 'wsD', { jit: 0.02 }));
  s.push(box(-3.12, 0.3, 1.5, 3.12, 0.36, 1.62, 'lcy', { glow: 1 }));
  prop('um_water_steps', vs, s, { footprint: [6.2, 3.2], solid: true, light: { color: '#9fe8ff', intensity: 2, y: 0.8, range: 5, night: true }, tags: ['umeda', 'plaza', 'water'] }, { fx: [{ part: 'body', at: [-1.5, 1.4, -1.0], type: 'drip', rate: 0.6 }, { part: 'body', at: [1.5, 0.7, 0.6], type: 'drip', rate: 0.6 }] });
}

// ---- glass deck railing (2 m) ---------------------------------------------------------------------
{
  const vs = 0.05, s = [];
  for (const x of [-0.96, 0.96]) s.push(box(x - 0.04, 0, -0.05, x + 0.04, 1.12, 0.05, 'alD', { jit: 0.02 }));
  s.push(box(-0.92, 0.1, -0.02, 0.92, 1.0, 0.02, '#bfe9f5', { jit: 0.01, grad: { axis: 'y', to: '#e6fbff', a: 0.1, b: 1.0 } }));
  s.push(box(-0.92, 0.1, -0.025, 0.92, 1.0, 0.025, '#f4feff', { paint: 1, stripes: { axis: 'x', p: 0.9, w: 0.08, col: '#bfe9f5', o: 0.3 } }));
  s.push(box(-1.0, 1.0, -0.06, 1.0, 1.1, 0.06, 'alL', { jit: 0.02 }), box(-1.0, 0.97, 0.04, 1.0, 1.0, 0.07, 'lcy', { glow: 2 }));
  prop('um_glass_rail', vs, s, { footprint: [2, 0.3], solid: true, tags: ['umeda', 'railing', 'foreground'] });
}

// ---- banner flag pole (league banner sways) -------------------------------------------------------
function bannerPole(id, c0, c1, c2) {
  const vs = 0.05, s = [];
  s.push(vcyl(0, 0, 0, 0.12, 0.22, 'alD'), vcyl(0, 0, 0.12, 5.3, 0.05, 'alL', { jit: 0.02 }), sph([0, 5.35, 0], 0.08, 'lgd'));
  s.push(cyl([0, 4.95, 0], [1.0, 4.95, 0], 0.025, 'alL'), cyl([0, 2.45, 0], [1.0, 2.45, 0], 0.025, 'alL'));
  const b = [];
  b.push(box(0.06, 2.5, -0.025, 0.98, 4.9, 0.025, c0, { jit: 0.02 }));
  b.push(box(0.06, 2.5, -0.03, 0.98, 2.62, 0.03, c1, { paint: 1 }), box(0.06, 4.78, -0.03, 0.98, 4.9, 0.03, c1, { paint: 1 }));
  b.push(box(0.06, 2.5, -0.03, 0.14, 4.9, 0.03, c2, { paint: 1 }), box(0.9, 2.5, -0.03, 0.98, 4.9, 0.03, c2, { paint: 1 }));
  b.push(plate([0.52, 4.0, 0.035], HEX(0.32), 0.015, c1, { glow: 1 }), plate([0.52, 4.0, 0.05], HEX(0.22), 0.015, c0));
  b.push(plate([0.52, 4.0, 0.06], STAR5(0.17, 0.07), 0.012, c2, { glow: 2 }));
  b.push(plate([0.52, 3.1, 0.035], [[-0.3, 0.25], [0.3, 0.25], [0.3, -0.05], [0, -0.3], [-0.3, -0.05]], 0.012, c1, { glow: 1 }));
  prop(id, vs, [{ n: 'body', p: [0, 0, 0], s }, { n: 'flag', p: [0.05, 3.7, 0], s: b, sway: { axis: 'y', amp: 0.12, freq: 0.7 } }], { footprint: [0.3, 0.3], solid: true, destructible: true, hp: 40, debris: ['#9aa3ae', '#141a3a', '#3ff0ff'], tags: ['umeda', 'league', 'banner'] });
}
bannerPole('um_banner_pole', 'lv', 'lcy', 'lgd');
bannerPole('um_banner_pole_m', 'lmg', 'lgd', 'lwh');

// ---- timber-lattice canopy (Grand Ring descendant; 6 × 3 m, green roof) ----------------------------
{
  const vs = 0.08, s = [];
  const T = { jit: 0.04, stripes: { axis: 'y', p: 0.5, w: 0.06, col: 'tbD' } };
  for (const x of [-2.8, 2.8]) for (const z of [-1.3, 1.3]) s.push(box(x - 0.14, 0, z - 0.14, x + 0.14, 3.7, z + 0.14, 'tb', T));
  for (const z of [-1.3, -0.45, 0.45, 1.3]) s.push(box(-3.1, 3.55, z - 0.09, 3.1, 3.8, z + 0.09, 'tb', { jit: 0.04 }));
  for (let x = -3; x <= 3.01; x += 0.75) s.push(box(x - 0.08, 3.8, -1.5, x + 0.08, 4.0, 1.5, 'tbL', { jit: 0.04 }));
  s.push(box(-3.05, 4.0, -1.45, 3.05, 4.18, 1.45, 'lawn', { jit: 0.05, dither: { col: 'lawnD', amt: 0.3 } }));
  const r = rng(11);
  for (let i = 0; i < 9; i++) s.push(sph([-2.7 + i * 0.68, 4.25, (r() - 0.5) * 2.2], 0.22 + r() * 0.14, i % 3 ? 'lf' : 'lfL', { noise: 0.05, noiseScale: 0.2, jit: 0.06 }));
  s.push(box(-3.12, 3.62, 1.4, 3.12, 3.7, 1.45, 'no', { glow: 1 }));
  prop('um_timber_canopy', vs, s, { footprint: [6, 3], solid: false, light: { color: '#ffd89a', intensity: 2.5, y: 3.4, range: 6, night: true }, tags: ['umeda', 'canopy', 'timber', 'green'] });
}

// ---- maglev viaduct + train (26 m segment; sits behind the front row at ~7–9 m) ---------------------
{
  const vs = 0.16, s = [];
  const C = { jit: 0.03, stripes: { axis: 'x', p: 6.5, w: 0.16, col: 'stD' } };
  s.push(box(-13, 6.6, -0.9, 13, 7.3, 0.9, 'stL', C));
  s.push(box(-13, 6.45, 0.75, 13, 6.6, 0.95, 'lcy', { glow: 2 }));
  for (const x of [-6.5, 6.5]) { s.push(box(x - 0.55, 0, -0.55, x + 0.55, 6.6, 0.55, 'st', { jit: 0.03 })); s.push(box(x - 0.9, 6.2, -0.8, x + 0.9, 6.6, 0.8, 'stL', { jit: 0.03 })); }
  s.push(box(-13, 7.3, -0.35, 13, 7.5, 0.35, 'mtD', { jit: 0.02 }));
  // train: three sleek cars
  for (const [x0, x1] of [[-11.5, -4.3], [-4.0, 3.2], [3.5, 10.7]]) {
    s.push(box(x0, 7.55, -0.75, x1, 9.15, 0.75, 'w', { round: 0.35, jit: 0.02 }));
    s.push(box(x0 + 0.3, 8.3, 0.7, x1 - 0.3, 8.75, 0.8, '#1c2a48', { jit: 0.01 }));
    s.push(box(x0 + 0.3, 8.33, 0.74, x1 - 0.3, 8.72, 0.82, '#ffe6a0', { glow: 1, paint: 1, stripes: { axis: 'x', p: 0.8, w: 0.12, col: '#1c2a48' } }));
    s.push(box(x0, 7.75, 0.72, x1, 7.88, 0.8, 'lmg', { glow: 2, paint: 1 }));
  }
  s.push(ell([11.3, 8.2, 0], [1.6, 0.7, 0.74], 'w', { jit: 0.02 }), ell([-12.0, 8.2, 0], [1.2, 0.68, 0.74], 'w', { jit: 0.02 }));
  s.push(ell([11.9, 8.4, 0.2], [0.8, 0.3, 0.6], '#1c2a48', { paint: 1 }));
  prop('um_maglev', vs, s, { footprint: [26, 1.8], solid: false, tags: ['umeda', 'background', 'transit'] });
}

// ---- ROCK YOU DOME exterior (disc dome, stepped silver roof, pixel-LED cushion skin) ----------------
{
  const vs = 0.25, s = [];
  const R = 16;
  s.push(vcyl(0, 0, 0, 6.8, R, 'lv', { jit: 0.02 }));
  // LED cushion skin: diamond cushions in league colours
  s.push(vcyl(0, 0, 0.8, 6.6, R + 0.06, 'lvL', { paint: 1, glow: 1, stripes: { axis: 'y', p: 0.75, w: 0.12, col: 'lv' } }));
  s.push(vcyl(0, 0, 0.8, 6.6, R + 0.06, 'lcy', { paint: 1, glow: 1, dither: { col: 'lmg', amt: 0.22 }, spots: { col: 'lgd', d: 0.18, s: 0.5, seed: 4 } }));
  s.push(vcyl(0, 0, 4.4, 5.2, R + 0.08, 'lv', { paint: 1 }));
  s.push(vcyl(0, 0, 0, 0.8, R + 0.1, 'stL', { jit: 0.02 }));
  // stepped silver roof (Kyocera nod)
  const MT = { jit: 0.02, stripes: { axis: 'x', p: 2.0, w: 0.25, col: 'alD' } };
  s.push(vcyl(0, 0, 6.8, 8.0, R + 0.4, 'alL', MT), vcyl(0, 0, 8.0, 9.3, 12.8, 'al', MT), vcyl(0, 0, 9.3, 10.4, 9.0, 'alL', MT), vcyl(0, 0, 10.4, 11.3, 5.2, 'al', MT), vcyl(0, 0, 11.3, 11.8, 2.4, 'alL', MT));
  for (const [y, r] of [[7.9, R + 0.45], [9.2, 12.85], [10.3, 9.05]]) s.push(tor([0, y, 0], r, 0.14, 'lcy', { glow: 2 }));
  // name band facing the street (+z)
  s.push(box(-9.5, 5.0, R - 2.4, 9.5, 6.75, R + 0.5, 'lvK', { jit: 0.02 }));
  s.push(box(-9.6, 4.9, R + 0.3, 9.6, 5.05, R + 0.6, 'lgd', { glow: 1 }), box(-9.6, 6.7, R + 0.3, 9.6, 6.85, R + 0.6, 'lgd', { glow: 1 }));
  s.push(...text('ROCK YOU DOME', [0, 5.9, R + 0.55], 0.25, 0.12, 'lgdL', { glow: 2, snap: vs }));
  // entrance arches
  for (const x of [-6, 0, 6]) { s.push(box(x - 1.6, 0, R - 3, x + 1.6, 3.4, R + 1, 'k', { sub: 1 })); s.push(box(x - 1.6, 0.8, R - 1.2, x + 1.6, 3.4, R - 1.0, '#1a2a4a')); s.push(box(x - 1.7, 3.4, R - 1.0, x + 1.7, 3.6, R + 0.2, 'lcy', { glow: 2 })); }
  // aviation lights + roof masts
  for (const a of [0.7, 2.4]) s.push(vcyl(Math.cos(a) * 6, Math.sin(a) * 6, 10.4, 13.5, 0.15, 'alD'), sph([Math.cos(a) * 6, 13.6, Math.sin(a) * 6], 0.3, 'nr', { glow: 3 }));
  prop('um_dome', vs, s, { footprint: [32, 32], solid: true, light: { color: '#3ff0ff', intensity: 8, y: 6, range: 26, night: true }, tags: ['umeda', 'stadium', 'landmark', 'background', 'neon', 'light'] });
}

// ---- TOKONMON BANK ATM booth ------------------------------------------------------------------------
{
  const vs = 0.04, s = [];
  s.push(box(-0.7, 0, -0.45, 0.7, 2.2, 0.45, 'lv', { jit: 0.02 }));
  s.push(box(-0.72, 2.2, -0.47, 0.72, 2.55, 0.47, 'lgd', { jit: 0.02 }));
  s.push(box(-0.66, 2.24, 0.46, 0.66, 2.51, 0.5, 'lvK'));
  s.push(...text('BANK', [0, 2.37, 0.5], vs, 0.02, 'lgdL', { glow: 2, snap: vs }));
  s.push(box(-0.55, 0.9, 0.3, 0.55, 1.9, 0.5, 'ink', { jit: 0.02 }));
  s.push(box(-0.42, 1.25, 0.49, 0.42, 1.78, 0.52, '#1b4a70'), box(-0.38, 1.3, 0.51, 0.38, 1.72, 0.53, 'lcy', { glow: 2, stripes: { axis: 'y', p: 0.12, w: 0.03, col: '#1b8ab0' } }));
  s.push(box(-0.45, 0.95, 0.5, 0.45, 1.15, 0.62, 'alD', { rot: [20, 0, 0] }));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s.push(vox(vs, -0.12 + i * 0.08, 1.04 + j * 0.03, 0.6 + j * 0.01, 'alL'));
  s.push(box(0.2, 1.02, 0.55, 0.38, 1.06, 0.6, 'ng', { glow: 2 }));
  s.push(plate([0.48, 0.55, 0.47], [[0, 0.16], [0.11, 0], [0, -0.16], [-0.11, 0]], 0.02, 'lcy', { glow: 2 }));
  prop('um_atm', vs, s, { footprint: [1.4, 0.9], solid: true, destructible: true, hp: 80, debris: ['#141a3a', '#f2c24c', '#3ff0ff'], light: { color: '#7ff6ff', intensity: 1.6, y: 1.5, range: 3.5, night: true }, tags: ['umeda', 'street', 'bank', 'light'] });
}

// ---- Umekita-park planter (3 × 1 m) -----------------------------------------------------------------
{
  const vs = 0.07, s = [];
  s.push(box(-1.5, 0, -0.5, 1.5, 0.55, 0.5, 'ws', { jit: 0.03, stripes: { axis: 'x', p: 1.0, w: 0.07, col: 'wsD' } }));
  s.push(box(-1.5, 0.48, -0.5, 1.5, 0.56, 0.5, 'tb', { paint: 1 }));
  s.push(box(-1.42, 0.5, -0.42, 1.42, 0.62, 0.42, 'lawn', { jit: 0.06, dither: { col: 'lawnD', amt: 0.35 } }));
  const r = rng(5);
  for (let i = 0; i < 5; i++) s.push(sph([-1.15 + i * 0.58, 0.82 + r() * 0.1, (r() - 0.5) * 0.3], 0.26 + r() * 0.08, i % 2 ? 'lf' : 'lfD', { noise: 0.05, noiseScale: 0.18, top: 'lfL', jit: 0.06 }));
  for (let i = 0; i < 10; i++) s.push(vox(vs, -1.35 + r() * 2.7, 0.66, 0.36, pick(r, ['pp', 'py', 'w', 'nm']), {}));
  prop('um_planter', vs, s, { footprint: [3, 1], solid: true, destructible: true, hp: 60, debris: ['#eef0f0', '#5d9f42', '#ffb6cb'], tags: ['umeda', 'plaza', 'green'] });
}

// ---- holographic league billboard (replacement with TOKONMON branding) ------------------------------
function holoBoard(id, title, sub, accent) {
  const vs = 0.06, s = [];
  for (const sx of [-1.38, 1.38]) { s.push(box(sx - 0.09, 0, -0.12, sx + 0.09, 1.2, 0.12, 'mtK', { jit: 0.03 })); s.push(box(sx - 0.18, 0, -0.25, sx + 0.18, 0.08, 0.25, 'mtD')); }
  s.push(box(-1.62, 1.08, -0.12, 1.62, 3.3, 0.06, 'mtK', { jit: 0.03 }));
  s.push(box(-1.5, 1.2, 0.0, 1.5, 3.18, 0.07, 'lvM', { glow: 1, grad: { axis: 'y', to: 'lv', a: 1.2, b: 3.18 }, stripes: { axis: 'y', p: 0.18, w: 0.06, col: 'lvL' }, jit: 0.02 }));
  s.push(...leagueEmblem(-0.85, 2.38, 0.06, 0.34, { ribbon: false }).map((t) => { t[t.length - 1] = Object.assign({}, t[t.length - 1], { glow: Math.max(1, t[t.length - 1].glow || 0) }); return t; }));
  s.push(...text(title, [0.42, 2.66, 0.08], vs, 0.03, 'lwh', { glow: 3, snap: vs }));
  s.push(...text(sub, [0.42, 2.12, 0.08], vs, 0.03, accent, { glow: 2, snap: vs }));
  s.push(box(-1.62, 3.3, -0.06, 1.62, 3.36, 0.12, accent, { glow: 2 }), box(-1.62, 1.02, -0.06, 1.62, 1.08, 0.12, accent, { glow: 2 }));
  prop(id, vs, s, { footprint: [3.2, 0.5], solid: true, destructible: true, hp: 120, debris: ['#3d434d', '#ff4ac8', '#3ff0ff', '#141a3a'], light: { color: '#7ff6ff', intensity: 3, y: 2.2, range: 6, night: true }, tags: ['umeda', 'city', 'street', 'neon', 'light'] });
}
holoBoard('um_holo_board', 'TOKONMON', 'LEAGUE', 'lcy');
holoBoard('um_holo_board2', 'RANK', 'MATCH', 'lmg');

// ---- outdoor exhibition-stage light truss tower (destructible; rims the plaza arena) --------------
{
  const vs = 0.05, s = [];
  s.push(box(-0.45, 0, -0.45, 0.45, 0.12, 0.45, 'mtK', { jit: 0.02 }));
  for (const x of [-0.22, 0.22]) for (const z of [-0.22, 0.22]) s.push(box(x - 0.035, 0.12, z - 0.035, x + 0.035, 5.0, z + 0.035, 'alL', { jit: 0.02 }));
  for (let y = 0.4; y < 5; y += 0.45) { s.push(box(-0.22, y - 0.02, 0.19, 0.22, y + 0.02, 0.25, 'alD'), box(-0.22, y - 0.02, -0.25, 0.22, y + 0.02, -0.19, 'alD'), box(0.19, y - 0.02, -0.22, 0.25, y + 0.02, 0.22, 'alD'), box(-0.25, y - 0.02, -0.22, -0.19, y + 0.02, 0.22, 'alD')); }
  s.push(box(-1.1, 5.0, -0.12, 1.1, 5.2, 0.12, 'mtK'));
  for (const x of [-0.8, 0, 0.8]) {
    s.push(cyl([x, 4.85, 0.0], [x, 4.6, 0.32], 0.17, 'ink', { jit: 0.02 }));
    s.push(cyl([x, 4.62, 0.3], [x, 4.58, 0.36], 0.14, 'nw', { glow: 3 }));
  }
  s.push(box(-0.3, 1.6, 0.2, 0.3, 2.5, 0.55, 'ink', { jit: 0.02 }), vcyl(0, 0.56, 1.85, 2.25, 0.16, 'mtD', { rot: [90, 0, 0] }));
  s.push(box(-0.24, 1.0, 0.24, 0.24, 1.08, 0.3, 'lcy', { glow: 2 }));
  prop('um_stage_tower', vs, s, { footprint: [0.9, 0.9], solid: true, destructible: true, hp: 90, debris: ['#e6ebf0', '#252932', '#eafcff'], light: { color: '#eaf6ff', intensity: 5, y: 4.6, range: 10, night: false }, tags: ['umeda', 'stage', 'light'] });
}

// ---- food-terrace picnic table with league parasol ---------------------------------------------------
{
  const vs = 0.06, s = [];
  s.push(box(-0.9, 0.7, -0.42, 0.9, 0.78, 0.42, 'tbL', { jit: 0.03, stripes: { axis: 'x', p: 0.3, w: 0.04, col: 'tbD' } }));
  for (const x of [-0.7, 0.7]) s.push(box(x - 0.05, 0, -0.3, x + 0.05, 0.7, 0.3, 'alD'));
  for (const z of [-0.75, 0.75]) { s.push(box(-0.9, 0.42, z - 0.15, 0.9, 0.48, z + 0.15, 'tb', { jit: 0.03 })); for (const x of [-0.7, 0.7]) s.push(box(x - 0.04, 0, z - 0.04, x + 0.04, 0.42, z + 0.04, 'alD')); }
  s.push(vcyl(0, 0, 0.78, 2.4, 0.035, 'alL'));
  s.push(cap([0, 2.5, 0], [0, 2.15, 0], 0.08, 1.15, 'lv', { stripes: { axis: 'x', p: 0.5, w: 0.25, col: 'lwh' }, jit: 0.02 }));
  s.push(vcyl(0, 0, 2.08, 2.2, 1.17, 'lcy', { glow: 1 }), sph([0, 2.62, 0], 0.07, 'lgd'));
  // a tray + bowls, a pager buzzer
  s.push(box(-0.5, 0.78, -0.2, -0.1, 0.8, 0.12, 'lv'), vcyl(-0.3, -0.04, 0.8, 0.88, 0.1, 'w'), vcyl(-0.3, -0.04, 0.86, 0.885, 0.08, 'cu'));
  s.push(box(0.3, 0.78, 0.0, 0.4, 0.82, 0.08, 'ink'), box(0.32, 0.82, 0.02, 0.38, 0.83, 0.06, 'nr', { glow: 2 }));
  prop('um_picnic_table', vs, s, { footprint: [1.9, 1.9], solid: true, destructible: true, hp: 60, debris: ['#c99a68', '#141a3a', '#f4f6fb'], tags: ['umeda', 'food', 'terrace'] });
}

// ---- Osaka-Station-style curved glass canopy (12 m arch over the station forecourt) ------------------
{
  const vs = 0.12, s = [];
  const Rr = 9.6, yc = -2.2, zh = 2.6;
  s.push(cyl([0, yc, -zh], [0, yc, zh], Rr, '#bfe2f5', { jit: 0.02, stripes: { axis: 'x', p: 1.5, w: 0.12, col: 'al' } }));
  s.push(cyl([0, yc, -zh - 1], [0, yc, zh + 1], Rr - 0.13, 'k', { sub: 1 }));
  s.push(box(-20, -10, -5, 20, 4.4, 5, 'k', { sub: 1 }));
  for (const z of [-zh, -zh / 3, zh / 3, zh]) s.push(tor([0, yc, z], Rr + 0.05, 0.1, 'alL', { axis: 'z' }));
  s.push(box(-8.2, 4.3, -zh - 0.15, 8.2, 4.5, zh + 0.15, 'k', { sub: 1 }));
  for (const x of [-7.4, 7.4]) for (const z of [-zh + 0.2, zh - 0.2]) s.push(box(x - 0.14, 0, z - 0.14, x + 0.14, 4.6, z + 0.14, 'alL', { jit: 0.02 }));
  for (const x of [-7.4, 7.4]) s.push(box(x - 0.18, 4.4, -zh, x + 0.18, 4.7, zh, 'alL'));
  s.push(tor([0, yc, zh + 0.05], Rr + 0.12, 0.05, 'lcy', { axis: 'z', glow: 2 }));
  s.push(box(-20, -10, -5, 20, 4.38, 5, 'k', { sub: 1 }));
  prop('um_station_roof', vs, s, { footprint: [15, 5], solid: false, light: { color: '#bfe9ff', intensity: 3, y: 4.5, range: 9, night: true }, tags: ['umeda', 'station', 'canopy', 'glass'] });
}

// ---- automatic ticket gates (station) ---------------------------------------------------------------
{
  const vs = 0.04, s = [];
  for (const x of [-1.2, -0.4, 0.4, 1.2]) {
    s.push(box(x - 0.1, 0, -0.6, x + 0.1, 1.0, 0.6, 'alL', { jit: 0.02, round: 0.04 }));
    s.push(box(x - 0.1, 0.98, -0.6, x + 0.1, 1.02, 0.6, 'ink'));
    s.push(box(x - 0.08, 1.0, 0.35, x + 0.08, 1.03, 0.55, 'lcy', { glow: 2 }));
    s.push(box(x - 0.11, 0.7, 0.55, x + 0.11, 0.9, 0.62, x < 0 ? 'ng' : 'nr', { glow: 2 }));
    if (x < 1.2) s.push(box(x + 0.1, 0.55, -0.05, x + 0.3, 0.85, 0.05, '#ff9a4a', { jit: 0.02 }));
  }
  prop('um_ticket_gate', vs, s, { footprint: [2.6, 1.2], solid: true, light: { color: '#7ff6ff', intensity: 1.2, y: 1, range: 3, night: true }, tags: ['umeda', 'station'] });
}

// ---- plaza café kiosk (timber + glass, giant 3D coffee-cup sign) -----------------------------------
{
  const vs = 0.065, s = [];
  s.push(box(-1.2, 0, -0.8, 1.2, 0.95, 0.8, 'tb', { jit: 0.03, stripes: { axis: 'x', p: 0.2, w: 0.03, col: 'tbD' } }));
  s.push(box(-1.25, 0.95, -0.85, 1.25, 1.02, 0.85, 'ws'));
  s.push(box(-1.15, 1.02, -0.75, 1.15, 2.2, 0.75, '#bfe2f5', { jit: 0.01 }), box(-1.1, 1.02, -0.7, 1.1, 2.2, 0.7, 'k', { sub: 1 }));
  for (const x of [-1.15, 0, 1.15]) s.push(box(x - 0.05, 1.02, 0.7, x + 0.05, 2.2, 0.8, 'tbD'));
  s.push(box(-1.0, 1.02, -0.6, 1.0, 1.8, -0.5, 'tbD'), vcyl(-0.6, -0.4, 1.02, 1.35, 0.14, 'mtL'), box(0.2, 1.02, -0.5, 0.7, 1.4, -0.2, 'mt'));
  s.push(box(-1.35, 2.2, -0.95, 1.35, 2.4, 0.95, 'tbD'));
  s.push(box(-1.4, 2.0, 0.85, 1.4, 2.25, 1.15, 'pp', { stripes: { axis: 'x', p: 0.4, w: 0.2, col: 'lwh' }, rot: [-18, 0, 0] }));
  // giant cup sign
  s.push(cap([0, 2.45, 0], [0, 3.35, 0], 0.32, 0.42, 'lwh', { jit: 0.02 }), vcyl(0, 0, 2.95, 3.12, 0.41, 'tb', { paint: 1 }));
  s.push(vcyl(0, 0, 3.3, 3.42, 0.44, 'tbD'), tor([0.44, 2.85, 0], 0.16, 0.05, 'lwh', { axis: 'z' }));
  for (const [x, y] of [[-0.1, 3.6], [0.1, 3.85], [-0.05, 4.05]]) s.push(sph([x, y, 0], 0.08, 'w', { glow: 1 }));
  prop('um_kiosk', vs, s, { footprint: [2.4, 1.6], solid: true, destructible: true, hp: 100, debris: ['#c99a68', '#bfe2f5', '#f4f6fb'], light: { color: '#ffd8a0', intensity: 2.5, y: 1.6, range: 4.5, night: true }, tags: ['umeda', 'plaza', 'food', 'light'] }, { fx: [{ part: 'body', at: [0, 3.5, 0], type: 'steam', rate: 0.5 }] });
}

// ---- stadium gate (skybridge portal to the ROCK YOU DOME; escalator rising behind) ------------------
{
  const vs = 0.1, s = [];
  const F = { jit: 0.02 };
  for (const x of [-3.6, 3.6]) {
    s.push(box(x - 0.5, 0, -0.6, x + 0.5, 6.2, 0.6, 'lv', F));
    s.push(box(x - 0.52, 0.4, 0.56, x + 0.52, 5.8, 0.64, 'lcy', { glow: 2, stripes: { axis: 'y', p: 0.5, w: 0.15, col: 'lv' } }));
  }
  s.push(box(-4.3, 5.2, -0.7, 4.3, 6.6, 0.7, 'lvM', F));
  s.push(box(-4.35, 5.15, 0.66, 4.35, 5.28, 0.74, 'lgd', { glow: 1 }), box(-4.35, 6.52, 0.66, 4.35, 6.65, 0.74, 'lgd', { glow: 1 }));
  s.push(...text('STADIUM', [0, 5.9, 0.72], 0.12, 0.05, 'lgdL', { glow: 2, snap: vs }));
  // glass doors + turnstile line
  s.push(box(-3.1, 0, -0.1, 3.1, 5.2, 0.1, '#1a2a4a', F), box(-3.0, 0.1, 0.06, 3.0, 4.9, 0.12, '#5d8fb8', { stripes: { axis: 'x', p: 1.5, w: 0.1, col: 'al' } }));
  s.push(box(-3.0, 0.1, 0.06, 3.0, 4.9, 0.13, '#cfe8ff', { paint: 1, stripes: { axis: 'x', p: 0.9, w: 0.12, col: '#5d8fb8', o: 0.3 } }));
  // escalator tube rising behind toward the dome skybridge
  s.push(cyl([-2.6, 0.6, -1.0], [2.8, 7.2, -5.5], 1.25, '#bfe9f5', { jit: 0.02, stripes: { axis: 'y', p: 0.8, w: 0.12, col: 'al' } }));
  s.push(cyl([-2.6, 0.6, -1.0], [2.8, 7.2, -5.5], 1.12, 'k', { sub: 1 }));
  s.push(cyl([-2.4, 0.4, -1.1], [2.9, 6.9, -5.5], 0.55, 'alD'));
  s.push(box(-4.3, 6.6, -6.5, 4.3, 7.2, -4.6, 'lv', F), box(-4.3, 7.2, -6.5, 4.3, 7.3, -4.6, 'lcy', { glow: 1 }));
  prop('um_stadium_gate', vs, s, { footprint: [8.4, 1.4], solid: true, light: { color: '#3ff0ff', intensity: 4, y: 4, range: 8, night: true }, tags: ['umeda', 'stadium', 'gate', 'neon', 'light'] });
}

// ---- floating hovercar-lane ring light (background sky lanes) --------------------------------------
{
  const vs = 0.06, s = [];
  s.push(tor([0, 0, 0], 1.3, 0.07, 'lcy', { axis: 'z', glow: 2 }), tor([0, 0, 0], 1.12, 0.03, 'lmg', { axis: 'z', glow: 1 }));
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; s.push(sph([Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0], 0.11, 'ny', { glow: 3 })); }
  // shift up so it floats (ground cut otherwise removes the lower half)
  const up = s.map((t) => { const q = JSON.parse(JSON.stringify(t)); q[1][1] += 1.5; return q; });
  prop('um_lane_ring', vs, up, { footprint: [2.6, 0.2], solid: false, tags: ['umeda', 'sky', 'traffic', 'neon'] });
}

// =====================================================================
// TOKONMON LEAGUE HQ LOBBY
// =====================================================================

// ---- reception desk: a sculptural curved monolith (white stone, cyan light seam, gold edge) ---------
{
  const vs = 0.05, s = [];
  const Rr = 4.2, zc = -3.3;
  s.push(vcyl(0, zc, 0, 1.12, Rr, 'ws', { jit: 0.015, stripes: { axis: 'x', p: 0.6, w: 0.05, col: 'wsD' } }));
  s.push(vcyl(0, zc, -1, 2, Rr - 0.75, 'k', { sub: 1 }));
  s.push(box(-6, -1, -9, 6, 3, -0.55, 'k', { sub: 1 }), box(-6, -1, -9, -2.7, 3, 3, 'k', { sub: 1 }), box(2.7, -1, -9, 6, 3, 3, 'k', { sub: 1 }));
  s.push(vcyl(0, zc, 1.04, 1.13, Rr + 0.05, 'lgd', { paint: 1 }));
  s.push(vcyl(0, zc, 0.78, 0.84, Rr + 0.05, 'lcy', { paint: 1, glow: 2 }));
  s.push(vcyl(0, zc, 0, 0.1, Rr + 0.05, 'lvM', { paint: 1 }));
  // inset hex badge on the front
  s.push(plate([0, 0.48, 0.92], HEX(0.26), 0.03, 'lgd'), plate([0, 0.48, 0.94], HEX(0.19), 0.03, 'lv'), plate([0, 0.5, 0.96], [[0, 0.12], [0.08, 0.02], [0, -0.1], [-0.08, 0.02]], 0.02, 'lcy', { glow: 2 }));
  // staff side: monitors and a tablet stand
  for (const x of [-1.2, 1.2]) {
    s.push(box(x - 0.04, 1.12, -0.25, x + 0.04, 1.35, -0.15, 'ink'));
    s.push(box(x - 0.42, 1.3, -0.3, x + 0.42, 1.78, -0.22, 'ink', { rot: [-8, 0, 0] }), box(x - 0.38, 1.34, -0.215, x + 0.38, 1.74, -0.2, 'lcy', { glow: 1, rot: [-8, 0, 0], stripes: { axis: 'y', p: 0.1, w: 0.03, col: '#1b6a90' } }));
  }
  s.push(box(-0.35, 1.12, 0.1, 0.35, 1.16, 0.4, 'alL'), box(-0.15, 1.12, 0.15, 0.15, 1.2, 0.3, 'lmg', { glow: 2 }));
  prop('um_reception_desk', vs, s, { footprint: [5.2, 1.6], solid: true, light: { color: '#7ff6ff', intensity: 2, y: 0.8, range: 4, night: false }, tags: ['league', 'lobby', 'desk'] });
}

// ---- registration kiosk ---------------------------------------------------------------------------
{
  const vs = 0.04, s = [];
  s.push(box(-0.3, 0, -0.22, 0.3, 0.08, 0.22, 'alD'), box(-0.16, 0.08, -0.12, 0.16, 1.05, 0.12, 'lwh', { jit: 0.02 }));
  s.push(box(-0.17, 0.5, 0.11, 0.17, 0.55, 0.14, 'lcy', { glow: 2 }));
  s.push(box(-0.36, 1.0, -0.2, 0.36, 1.48, -0.1, 'lv', { rot: [-22, 0, 0] }));
  s.push(box(-0.32, 1.04, -0.1, 0.32, 1.44, -0.07, 'lcy', { glow: 1, rot: [-22, 0, 0], stripes: { axis: 'y', p: 0.12, w: 0.04, col: '#1b6a90' } }));
  s.push(plate([0, 1.62, -0.12], HEX(0.1), 0.02, 'lgd', { glow: 1 }));
  prop('um_reg_kiosk', vs, s, { footprint: [0.6, 0.5], solid: true, destructible: true, hp: 50, debris: ['#f4f6fb', '#141a3a', '#3ff0ff'], tags: ['league', 'lobby'] });
}

// ---- security gate (two pedestals with glass flaps) -------------------------------------------------
{
  const vs = 0.04, s = [];
  for (const x of [-0.85, 0.85]) {
    s.push(box(x - 0.12, 0, -0.55, x + 0.12, 1.0, 0.55, 'alL', { jit: 0.02, round: 0.03 }));
    s.push(box(x - 0.12, 0.96, -0.55, x + 0.12, 1.02, 0.55, 'ink'));
    s.push(box(x - 0.1, 1.0, 0.3, x + 0.1, 1.03, 0.5, 'ng', { glow: 2 }));
    s.push(box(x - 0.13, 0.6, -0.4, x + 0.13, 0.66, 0.4, 'lcy', { glow: 2 }));
  }
  for (const sx of [1, -1]) s.push(box(sx * 0.73, 0.35, -0.05, sx * 0.25, 1.1, 0.05, '#bfe9f5', { jit: 0.01 }), box(sx * 0.73, 1.06, -0.06, sx * 0.25, 1.1, 0.06, 'lcy', { glow: 1 }));
  prop('um_security_gate', vs, s, { footprint: [2.0, 1.1], solid: true, light: { color: '#5dff9a', intensity: 1, y: 1, range: 2.5, night: false }, tags: ['league', 'lobby', 'gate'] });
}

// ---- hologram pit (sunken ring in the floor; the champion's partner turns above it) ------------------
{
  const vs = 0.05, s = [];
  s.push(vcyl(0, 0, 0, 0.16, 1.75, 'alL', { jit: 0.02 }), vcyl(0, 0, 0.05, 0.3, 1.5, 'k', { sub: 1 }));
  s.push(vcyl(0, 0, 0, 0.06, 1.5, 'lvK', { jit: 0.02 }));
  s.push(vcyl(0, 0, 0, 0.065, 1.5, 'lvL', { paint: 1, stripes: { axis: 'x', p: 0.3, w: 0.05, col: 'lvK' } }));
  s.push(tor([0, 0.14, 0], 1.62, 0.04, 'lcy', { glow: 2 }), tor([0, 0.07, 0], 0.7, 0.04, 'lmg', { glow: 2 }), vcyl(0, 0, 0.05, 0.1, 0.35, 'holoL', { glow: 3 }));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s.push(vox(vs, Math.cos(a) * 1.62, 0.18, Math.sin(a) * 1.62, i % 3 ? 'lcy' : 'lgd', { glow: 2 })); }
  for (const [y, r] of [[0.8, 0.5], [1.4, 0.75], [2.0, 0.9]]) s.push(tor([0, y, 0], r, 0.016, 'holo', { glow: 1 }));
  const up = (t, dy) => { const q = JSON.parse(JSON.stringify(t)); if (q[0] === 'cap' || q[0] === 'cyl') { q[1][1] += dy; q[2][1] += dy; } else q[1][1] += dy; return q; };
  prop('um_holo_pit', vs, [{ n: 'body', p: [0, 0, 0], s }, { n: 'holo', p: [0, 2.4, 0], s: holoCat(1.15).map((t) => up(t, 2.4)), spin: { axis: 'y', speed: 0.45 } }],
    { footprint: [3.4, 3.4], solid: true, round: true, light: { color: '#7ff6ff', intensity: 6, y: 2.2, range: 8, night: false }, tags: ['league', 'lobby', 'hologram', 'light'] });
}

// ---- trophy case (league trophies) --------------------------------------------------------------------
{
  const vs = 0.04, s = [];
  s.push(box(-0.8, 0, -0.3, 0.8, 0.6, 0.3, 'lv', { jit: 0.02 }), box(-0.82, 0.58, -0.32, 0.82, 0.64, 0.32, 'lgd'));
  s.push(box(-0.78, 0.64, -0.28, 0.78, 2.1, 0.28, '#cfeefa', { jit: 0.01 }), box(-0.74, 0.64, -0.24, 0.74, 2.06, 0.3, 'k', { sub: 1 }));
  s.push(box(-0.8, 2.1, -0.3, 0.8, 2.22, 0.3, 'lv'), box(-0.8, 2.08, 0.26, 0.8, 2.12, 0.31, 'lcy', { glow: 2 }));
  s.push(box(-0.74, 1.32, -0.24, 0.74, 1.35, 0.24, '#cfeefa'));
  s.push(box(-0.8, 0.62, -0.3, -0.76, 2.12, 0.3, 'alL'), box(0.76, 0.62, -0.3, 0.8, 2.12, 0.3, 'alL'));
  // cup, star trophy, crystal hex, plaques
  s.push(cap([-0.4, 0.64, 0], [-0.4, 0.8, 0], 0.07, 0.04, 'lgd'), cap([-0.4, 0.8, 0], [-0.4, 1.1, 0], 0.05, 0.16, 'lgd', { jit: 0.02 }));
  for (const sx of [1, -1]) s.push(tor([-0.4 + sx * 0.17, 1.0, 0], 0.06, 0.02, 'lgd', { axis: 'z' }));
  s.push(box(0.1, 0.64, -0.08, 0.3, 0.72, 0.08, 'lv'), vcyl(0.2, 0, 0.72, 0.95, 0.025, 'lgd'), plate([0.2, 1.08, 0], STAR5(0.16, 0.07), 0.03, 'lgdL', { glow: 1 }));
  s.push(prism(6, 0.0, 0.0, 1.35, 1.75, 0.12, '#bff8ff', { glow: 1 }), box(-0.08, 1.35, -0.08, 0.08, 1.38, 0.08, 'lgd'));
  s.push(cap([0.5, 1.35, 0], [0.5, 1.55, 0], 0.06, 0.12, 'alL'), sph([0.5, 1.65, 0], 0.08, 'alL'));
  s.push(cap([-0.5, 1.35, 0], [-0.5, 1.6, 0], 0.08, 0.05, 'lgdD'), plate([-0.5, 1.75, 0], HEX(0.11), 0.03, 'lgd'));
  prop('um_trophy_case', vs, s, { footprint: [1.6, 0.6], solid: true, destructible: true, hp: 60, debris: ['#cfeefa', '#f2c24c', '#141a3a'], light: { color: '#ffe8a0', intensity: 1.5, y: 1.5, range: 3, night: false }, tags: ['league', 'lobby'] });
}

// ---- lounge sofa ---------------------------------------------------------------------------------------
{
  const vs = 0.05, s = [];
  s.push(box(-1.1, 0.08, -0.4, 1.1, 0.42, 0.4, 'lvM', { round: 0.06, jit: 0.02 }));
  s.push(box(-1.1, 0.4, -0.42, 1.1, 0.85, -0.18, 'lvM', { round: 0.08, jit: 0.02 }));
  for (const x of [-1.05, 1.05]) s.push(box(x - 0.12, 0.08, -0.4, x + 0.12, 0.62, 0.4, 'lv', { round: 0.06 }));
  s.push(box(-1.12, 0.4, 0.36, 1.12, 0.44, 0.42, 'lgd'));
  for (const x of [-0.5, 0.5]) s.push(box(x - 0.45, 0.42, -0.16, x + 0.45, 0.5, 0.36, 'lvL', { round: 0.04 }));
  s.push(box(-1.0, 0, -0.35, 1.0, 0.08, 0.35, 'ink'));
  s.push(ell([0.75, 0.62, -0.1], [0.16, 0.14, 0.08], 'lcy', { jit: 0.03 }));
  prop('um_lounge_sofa', vs, s, { footprint: [2.3, 0.85], solid: true, destructible: true, hp: 50, debris: ['#1f2a58', '#f2c24c'], tags: ['league', 'lobby'] });
}

// ---- stanchion pair with velvet rope ---------------------------------------------------------------
{
  const vs = 0.03, s = [];
  for (const x of [-0.95, 0.95]) s.push(vcyl(x, 0, 0, 0.04, 0.16, 'lgdD'), vcyl(x, 0, 0.04, 0.95, 0.03, 'lgd'), sph([x, 0.98, 0], 0.05, 'lgdL'));
  s.push(...tube(bez([-0.92, 0.88, 0], [0, 0.58, 0], [0.92, 0.88, 0], 6), 0.025, 0.025, '#b0182e'));
  prop('um_stanchion', vs, s, { footprint: [2, 0.25], solid: true, destructible: true, hp: 20, debris: ['#f2c24c', '#b0182e'], tags: ['league', 'lobby'] });
}

// ---- TOKONMON GOODS merch shelf (plushies of the starters, caps, phone cases) --------------------------
{
  const vs = 0.04, s = [];
  s.push(box(-1.1, 0, -0.28, 1.1, 2.1, -0.2, 'lv', { jit: 0.02 }));
  for (const x of [-1.1, 1.1]) s.push(box(x - 0.04, 0, -0.28, x + 0.04, 2.1, 0.25, 'tb'));
  for (const y of [0.1, 0.65, 1.2, 1.75]) s.push(box(-1.08, y, -0.24, 1.08, y + 0.05, 0.25, 'tbL'), box(-1.08, y + 0.05, 0.22, 1.08, y + 0.08, 0.25, 'lcy', { glow: 1 }));
  const r = rng(8);
  // plushies: chili chick (red), bubble lionfish (blue, crown), strawberry sheep (pink) — simple round blobs
  const plush = (x, y, k) => {
    const c = ['chi', 'tB', 'pp', 'lgd', 'ng'][k];
    s.push(sph([x, y + 0.14, 0.02], 0.13, c, { jit: 0.03 }), sph([x - 0.04, y + 0.17, 0.13], 0.025, 'ink'), sph([x + 0.04, y + 0.17, 0.13], 0.025, 'ink'));
    if (k === 0) s.push(cap([x, y + 0.27, 0], [x + 0.03, y + 0.36, 0], 0.03, 0.01, 'chiG'));
    if (k === 1) s.push(plate([x, y + 0.3, 0], [[-0.06, 0], [0.06, 0], [0.07, 0.06], [0.03, 0.03], [0, 0.07], [-0.03, 0.03], [-0.07, 0.06]], 0.02, 'lgd'));
    if (k === 2) s.push(sph([x, y + 0.24, 0.0], 0.09, 'w', { noise: 0.02, noiseScale: 0.05 }));
  };
  for (let i = 0; i < 6; i++) plush(-0.85 + i * 0.34, 1.25, i % 3);
  for (let i = 0; i < 6; i++) plush(-0.85 + i * 0.34, 0.15, (i + 1) % 3);
  for (let i = 0; i < 7; i++) s.push(ell([-0.9 + i * 0.3, 0.76, 0.02], [0.12, 0.07, 0.11], pick(r, ['lv', 'chi', 'tB', 'lgd', 'w']), { jit: 0.02 }), box(-0.9 + i * 0.3 - 0.11, 0.7, 0.08, -0.9 + i * 0.3 + 0.11, 0.72, 0.18, 'ink'));
  for (let i = 0; i < 8; i++) s.push(box(-0.95 + i * 0.26 - 0.07, 1.8, -0.15, -0.95 + i * 0.26 + 0.07, 2.04, -0.12, pick(r, ['lmg', 'lcy', 'lgd', 'pp', 'pb', 'ng'])));
  s.push(box(-1.1, 2.1, -0.28, 1.1, 2.45, -0.18, 'lgd'));
  s.push(...text('GOODS', [0, 2.27, -0.16], vs, 0.02, 'lv', { snap: vs }));
  prop('um_merch_shelf', vs, s, { footprint: [2.2, 0.55], solid: true, destructible: true, hp: 60, debris: ['#141a3a', '#e8231e', '#3da8ff', '#ffb6cb'], tags: ['league', 'lobby', 'shop'] });
}

// ---- Elite Four banners: four marching-band military-coat banners (satin colour fields, gold frogging,
//      epaulette fringe, a bass-drum roundel) with each member's stage name — original, no faces/logos ----
function e4Banner(id, col, colD, name) {
  const vs = 0.04, s = [];
  s.push(cyl([-0.85, 4.75, 0], [0.85, 4.75, 0], 0.035, 'lgd'), sph([-0.9, 4.75, 0], 0.06, 'lgdL'), sph([0.9, 4.75, 0], 0.06, 'lgdL'));
  for (const x of [-0.6, 0.6]) s.push(cyl([x, 4.75, 0], [x * 0.2, 5.6, 0], 0.012, 'alD'));
  // swallow-tail banner field
  s.push(plate([0, 2.6, 0], [[-0.75, 2.1], [0.75, 2.1], [0.75, -1.9], [0, -1.45], [-0.75, -1.9]], 0.03, col, { jit: 0.02 }));
  s.push(plate([0, 2.6, 0.01], [[-0.75, 2.1], [0.75, 2.1], [0.75, -1.9], [0, -1.45], [-0.75, -1.9]], 0.035, colD, { paint: 1, stripes: { axis: 'x', p: 1.5, w: 0.08, col: 'lgd', o: 0.04 } }));
  s.push(plate([0, 2.6, 0.01], [[-0.67, 2.0], [0.67, 2.0], [0.67, -1.78], [0, -1.35], [-0.67, -1.78]], 0.036, col, { paint: 1 }));
  // epaulettes with fringe
  for (const sx of [1, -1]) {
    s.push(ell([sx * 0.45, 4.5, 0.05], [0.24, 0.08, 0.05], 'lgd', { jit: 0.02 }));
    for (let i = 0; i < 6; i++) s.push(box(sx * 0.27 + sx * i * 0.07 - 0.015, 4.22, 0.04, sx * 0.27 + sx * i * 0.07 + 0.015, 4.45, 0.07, 'lgdL'));
  }
  // frogging: paired gold braid bars with loops
  for (let i = 0; i < 4; i++) {
    const y = 3.95 - i * 0.28;
    for (const sx of [1, -1]) { s.push(box(sx * 0.08, y - 0.025, 0.035, sx * 0.5, y + 0.025, 0.06, 'lgd')); s.push(tor([sx * 0.53, y, 0.05], 0.05, 0.015, 'lgd', { axis: 'z' })); }
    s.push(sph([0, y, 0.05], 0.035, 'lgdL'));
  }
  // bass-drum roundel
  s.push(cyl([0, 2.45, -0.02], [0, 2.45, 0.08], 0.5, 'lwh', { jit: 0.01 }));
  s.push(tor([0, 2.45, 0.07], 0.47, 0.035, colD, { axis: 'z' }), tor([0, 2.45, 0.08], 0.4, 0.02, 'lgd', { axis: 'z' }));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; s.push(cyl([Math.cos(a) * 0.5, 2.45 + Math.sin(a) * 0.5, -0.02], [Math.cos(a) * 0.5, 2.45 + Math.sin(a) * 0.5, 0.1], 0.03, 'lgd')); }
  s.push(plate([0, 2.47, 0.1], STAR5(0.26, 0.11), 0.02, col, {}));
  s.push(...text('IV', [0, 2.12, 0.1], vs, 0.015, colD, { snap: vs }));
  s.push(...text(name, [0, 1.42, 0.05], vs, 0.02, 'lgdL', { snap: vs }));
  s.push(...text('ELITE', [0, 0.98, 0.05], vs * 0.75, 0.02, 'lwh', {}, 1));
  // tassels
  for (const x of [-0.75, 0.75]) s.push(cyl([x, 0.7, 0.04], [x, 0.4, 0.04], 0.04, 'lgd'), sph([x, 0.36, 0.04], 0.06, 'lgdL'));
  const up = s.map((t) => t);
  prop(id, vs, up, { footprint: [1.6, 0.2], solid: false, tags: ['league', 'lobby', 'banner', 'elite_four'] });
}
e4Banner('um_banner_e4_john', '#4fbf6a', '#2a7a44', 'JOHN');
e4Banner('um_banner_e4_paul', '#3a7ad8', '#24468a', 'PAUL');
e4Banner('um_banner_e4_george', '#ff6a2a', '#a8381a', 'GEORGE');
e4Banner('um_banner_e4_ringo', '#ff5fa8', '#a82a68', 'RINGO');

// ---- Champions banner: royal crest with a crowned lion head (original heraldry, not a real crest) -------
{
  const vs = 0.045, s = [];
  const RP = '#4a1f6e', RPD = '#2c1044', CR = '#b0182e';
  s.push(cyl([-1.2, 5.6, 0], [1.2, 5.6, 0], 0.045, 'lgd'), sph([-1.27, 5.6, 0], 0.08, 'lgdL'), sph([1.27, 5.6, 0], 0.08, 'lgdL'));
  for (const x of [-0.9, 0.9]) s.push(cyl([x, 5.6, 0], [x * 0.2, 6.6, 0], 0.014, 'alD'));
  const field = [[-1.1, 2.6], [1.1, 2.6], [1.1, -2.2], [0.55, -2.6], [0, -2.2], [-0.55, -2.6], [-1.1, -2.2]];
  s.push(plate([0, 3.0, 0], field, 0.035, 'lgd', { jit: 0.02 }));
  s.push(plate([0, 3.0, 0.01], field.map(([u, v]) => [u * 0.93, v * 0.95]), 0.04, RP, { jit: 0.02 }));
  s.push(plate([0, 3.0, 0.02], field.map(([u, v]) => [u * 0.93, v * 0.95]), 0.042, RPD, { paint: 1, stripes: { axis: 'x', p: 0.4, w: 0.12, col: RP } }));
  // shield
  const sh = [[-0.72, 0.75], [0.72, 0.75], [0.72, -0.1], [0, -0.95], [-0.72, -0.1]];
  s.push(plate([0, 3.55, 0.06], sh, 0.04, 'lgd'), plate([0, 3.55, 0.08], sh.map(([u, v]) => [u * 0.86, v * 0.86]), 0.04, 'lwh'));
  s.push(plate([0, 3.55, 0.1], [[-0.62, 0.64], [0, 0.64], [0, -0.8], [-0.62, -0.08]], 0.03, CR, { paint: 1 }));
  // lion head: mane petals, face, muzzle, eyes
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s.push(ell([Math.cos(a) * 0.32, 3.5 + Math.sin(a) * 0.32, 0.14], [0.13, 0.17, 0.04], i % 2 ? 'lgdD' : 'lgd', { rot: [0, 0, a * 57.3 + 90] })); }
  s.push(sph([0, 3.5, 0.16], 0.26, 'lgdL', { jit: 0.02 }), ell([0, 3.38, 0.36], [0.13, 0.09, 0.06], 'lwh'), ell([0, 3.44, 0.42], [0.05, 0.035, 0.03], 'ink'));
  for (const sx of [1, -1]) s.push(ell([sx * 0.1, 3.58, 0.38], [0.04, 0.025, 0.02], 'ink'), sph([sx * 0.22, 3.72, 0.3], 0.07, 'lgdD'));
  // crown
  s.push(plate([0, 3.95, 0.2], [[-0.3, 0], [0.3, 0], [0.36, 0.24], [0.18, 0.1], [0, 0.32], [-0.18, 0.1], [-0.36, 0.24]], 0.05, 'lgd'));
  for (const u of [-0.36, 0, 0.36]) s.push(sph([u, 3.95 + (u ? 0.26 : 0.34), 0.2], 0.05, u ? 'lcy' : CR, { glow: 1 }));
  // stars + scroll
  for (const sx of [1, -1]) s.push(plate([sx * 0.82, 4.95, 0.06], STAR5(0.16, 0.07), 0.02, 'lgdL', { glow: 1 }));
  s.push(...text('CHAMPIONS', [0, 2.15, 0.06], vs, 0.02, 'lgdL', { snap: vs }));
  s.push(box(-0.95, 1.55, 0.03, 0.95, 1.85, 0.06, 'lgd'), ...text('QUEEN', [0, 1.7, 0.08], vs, 0.02, RPD, { snap: vs }));
  for (const x of [-1.1, 0, 1.1]) s.push(cyl([x, 0.75, 0.04], [x, 0.45, 0.04], 0.045, 'lgd'), sph([x, 0.4, 0.04], 0.07, 'lgdL'));
  prop('um_banner_champ', vs, s, { footprint: [2.4, 0.2], solid: false, tags: ['league', 'lobby', 'banner', 'champions'] });
}

// ---- escalator up to the stadium skybridge (rises toward +x) --------------------------------------
{
  const vs = 0.08, s = [];
  const L = 6.0, Hh = 4.2;
  const ang = Math.atan2(Hh, L) * 57.3;
  // truss body (wedge)
  s.push(plate([0, 0, 0], [[-3.2, 0], [3.2, 0], [3.2, Hh + 0.2], [2.6, Hh + 0.2], [-2.9, 0.5], [-3.2, 0.5]], 0.75, 'alL', { plane: 'xy', jit: 0.02 }));
  s.push(plate([0, 0, 0.8], [[-3.0, 0.05], [3.0, 0.05], [3.0, Hh - 0.1], [2.7, Hh - 0.1], [-2.8, 0.45]], 0.04, 'lv', { paint: 1 }));
  // steps (sawtooth on top surface)
  for (let i = 0; i < 18; i++) { const t = i / 18, x = -2.9 + t * 5.5, y = 0.5 + t * (Hh - 0.3); s.push(box(x, y, -0.6, x + 0.3, y + 0.18, 0.6, 'mtD')); }
  // glass balustrades with cyan LED handrails
  for (const z of [-0.72, 0.72]) {
    s.push(plate([0, 0, z], [[-3.0, 0.5], [2.9, Hh], [2.9, Hh + 1.0], [-3.0, 1.5]], 0.03, '#bfe9f5', { plane: 'xy', jit: 0.01 }));
    s.push(cyl([-3.0, 1.5, z], [2.9, Hh + 1.0, z], 0.05, 'lcy', { glow: 2 }));
  }
  prop('um_escalator', vs, s, { footprint: [6.4, 1.6], solid: true, light: { color: '#3ff0ff', intensity: 2, y: 2.5, range: 5, night: false }, tags: ['league', 'lobby'] });
}

// ---- big potted plant ------------------------------------------------------------------------------
{
  const vs = 0.05, s = [];
  s.push(cap([0, 0, 0], [0, 0.6, 0], 0.32, 0.38, 'lwh', { jit: 0.02 }), vcyl(0, 0, 0.55, 0.62, 0.36, 'dtD'));
  s.push(vcyl(0, 0, 0.6, 1.4, 0.05, 'bk'), cyl([0, 1.1, 0], [0.25, 1.6, 0.05], 0.035, 'bk'));
  const r = rng(21);
  for (let i = 0; i < 9; i++) { const a = r() * 6.28, h = 1.3 + r() * 0.9; s.push(ell([Math.cos(a) * 0.35, h, Math.sin(a) * 0.3], [0.32, 0.26, 0.3], i % 3 ? 'lf' : 'lfD', { noise: 0.05, noiseScale: 0.18, top: 'lfL', jit: 0.06 })); }
  prop('um_plant_pot', vs, s, { footprint: [0.8, 0.8], solid: true, round: true, destructible: true, hp: 30, debris: ['#f4f6fb', '#5d9f42'], tags: ['league', 'lobby', 'plant'] });
}

// ---- LED wall bezel (frames the live rankings wall panel: 8.4 × 4.6 m) --------------------------------
{
  const vs = 0.08, s = [];
  s.push(box(-4.45, 0, -0.25, 4.45, 4.9, 0.05, 'lvK', { jit: 0.02 }));
  s.push(box(-4.45, 0, 0.0, 4.45, 0.15, 0.12, 'lgd'), box(-4.45, 4.75, 0.0, 4.45, 4.9, 0.12, 'lgd'));
  s.push(box(-4.45, 0, 0.0, -4.3, 4.9, 0.12, 'lgd'), box(4.3, 0, 0.0, 4.45, 4.9, 0.12, 'lgd'));
  s.push(box(-4.5, 4.9, -0.3, 4.5, 5.1, 0.2, 'lv'), box(-4.5, 4.92, 0.15, 4.5, 5.0, 0.22, 'lcy', { glow: 2 }));
  for (const x of [-4.45, 4.45]) s.push(plate([x, 2.45, 0.1], HEX(0.32), 0.05, 'lgd'), plate([x, 2.45, 0.14], HEX(0.22), 0.03, 'lv'), plate([x, 2.45, 0.17], STAR5(0.15, 0.06), 0.02, 'lcy', { glow: 2 }));
  prop('um_led_frame', vs, s, { footprint: [9, 0.4], solid: false, tags: ['league', 'lobby', 'screen'] });
}

// ---- timber ceiling slats module (Osaka warmth over the navy atrium; 4 × 1.2 m, wall mounted) -----------
{
  const vs = 0.06, s = [];
  s.push(box(-2, 0, -0.05, 2, 1.2, 0.0, 'tbD'));
  for (let i = 0; i < 14; i++) { const x = -1.86 + i * 0.286; s.push(box(x - 0.07, 0, 0, x + 0.07, 1.2, 0.18, i % 4 ? 'tb' : 'tbL', { jit: 0.03 })); }
  s.push(box(-2, -0.02, 0.0, 2, 0.06, 0.2, 'lgd', { glow: 1 }));
  prop('um_timber_slats', vs, s, { footprint: [4, 0.2], solid: false, tags: ['league', 'lobby', 'timber'] });
}

// @@END
export const DESIGNS = D;
export const PROP_META = M;
