// Chochobake — a paper-lantern ghost (Ecto) from Chinatown: a hundred-year-old red paper lantern that
// tore open and woke up. Red washi glowing from inside, black lacquer caps top and bottom with a wire
// hanging loop, bamboo ribs that break round one huge violet eye, a torn rib for a mouth with a long
// pink tongue lolling out. It floats and bobs, and spits violet ghost-fire.
//
// Music homage (Thriller, original — no likeness): the red washi is painted like a red jacket with
// black V stripes, one little paper hand wears a white sparkly glove, it does a zombie shuffle in its
// idle and fidgets, and glides backwards and forwards in a moonwalk when it walks.
//
// Build notes: the paper is unlit (glow) so it shines; each glowing box hides a slightly smaller lit
// box inside that carries the outline hull, and a 'dim' twin (lit, darker paper) swaps in through the
// 'paper' slot when its light goes out (sleep, faint).
import { E, seg, bump, wob, wave } from '../anim.js';
import { h2 } from './kit.js';

const D2R = Math.PI / 180, TAU = Math.PI * 2;
const C = {
  hot: ['#ffe2a0', '#ffa860', '#ff6a48', '#e8343c', '#b81e3c'], rib: '#8a1430', ribLit: '#c42a3a',
  dim: ['#c84a48', '#a8343c', '#842434', '#5e1a2c'], dimRib: '#4a1224',
  stripe: '#1c0a14', fiber: '#ffe8c8',
  lac: ['#5a4a6a', '#2e2438', '#1a141e', '#0c080e'], wire: ['#e8d8b0', '#a89070', '#6a5a48'],
  tongue: ['#ffc0d4', '#ff7aa2', '#e0457e', '#a42a62'],
  glove: ['#ffffff', '#eceef8', '#c8ccdc', '#9aa0b8'], tassel: ['#ffe27a', '#f2b632', '#b07a1a'],
  ink: '#2a0a14',
};
// ---------------------------------------------------------------- painting helpers
// the model-space point under texel (i, j) of a face (for cubes without `mirror`)
function at(c, f, i, j, w, h) {
  const [ox, oy, oz] = c.o, [sx, sy, sz] = c.s, u = (i + 0.5) / w, v = (j + 0.5) / h;
  if (f === 'south') return [ox + u * sx, oy + sy * (1 - v), oz + sz];
  if (f === 'north') return [ox + sx * (1 - u), oy + sy * (1 - v), oz];
  if (f === 'east') return [ox + sx, oy + sy * (1 - v), oz + sz * (1 - u)];
  if (f === 'west') return [ox, oy + sy * (1 - v), oz + sz * u];
  if (f === 'up') return [ox + u * sx, oy + sy, oz + sz * v];
  if (f === 'down') return [ox + u * sx, oy, oz + sz * (1 - v)];
  if (c.plane === 'x') return [ox, oy + sy * (1 - v), oz + sz * u];
  if (c.plane === 'y') return [ox + u * sx, oy, oz + sz * v];
  return [ox + u * sx, oy + sy * (1 - v), oz];
}
const LIT = ((v) => { const l = Math.hypot(...v); return v.map((x) => x / l); })([-0.26, 0.92, 0.24]);
// clean pixel-art bands: cols run bright → dark, thr are the descending light levels between them
const band = (cols, thr, l) => { for (let k = 0; k < thr.length; k++) if (l > thr[k]) return cols[k]; return cols[cols.length - 1]; };
// paint boxes as parts of one ellipsoid (centre O, radii R): fn(l, q, n, i, j, face) → colour
const orb = (O, R, fn) => (p, w, h, face, c) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h);
    let nx = (q[0] - O[0]) / (R[0] * R[0]), ny = (q[1] - O[1]) / (R[1] * R[1]), nz = (q[2] - O[2]) / (R[2] * R[2]);
    const L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
    p.px(i, j, fn(nx * LIT[0] + ny * LIT[1] + nz * LIT[2], q, [nx, ny, nz], i, j, face));
  }
};
// stamp a pixel map: rows of characters, map char → colour
function stamp(p, rows, map, x0 = 0, y0 = 0) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = map[r[i]]; if (c) p.px(x0 + i, y0 + j, c); } }); }
const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };


// ---------------------------------------------------------------- the lantern
const frac = (x) => ((x % 1) + 1) % 1;
const LC = [0, 14, 0];
// six boxes (half-extents about LC) making a barrel: distinct extents on every axis so no faces coincide;
// the deep one (index 1) is the big flat front that carries the eye and mouth
const BARREL = [[7.6, 6.0, 5.4], [5.4, 6.4, 7.6], [6.6, 8.6, 4.4], [4.4, 8.8, 6.6], [5.0, 10.0, 5.2], [7.0, 7.4, 6.8]];
// red washi: light glowing through it brightest in the middle of each face, ribs every 2.4 units, and on
// the front and back two black V stripes like a red jacket's
const paperP = (lit) => (p, w, h, face, c) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h), y = q[1] - LC[1], u = face === 'east' || face === 'west' ? q[2] : q[0];
    let col;
    if (face === 'up' || face === 'down') { const r = Math.hypot(q[0], q[2]) / 8; col = lit ? (r < 0.5 ? C.hot[2] : C.hot[3]) : C.dim[2]; p.px(i, j, col); continue; }
    const heat = 1 - (u / 8) ** 2 * 0.9 - (y / 10.5) ** 2 * 0.9;
    col = lit ? (heat > 0.8 ? C.hot[0] : heat > 0.6 ? C.hot[1] : heat > 0.35 ? C.hot[2] : heat > 0.1 ? C.hot[3] : C.hot[4]) : (heat > 0.6 ? C.dim[0] : heat > 0.3 ? C.dim[1] : C.dim[2]);
    if (frac(y / 2.4) < 0.14) col = lit ? (heat > 0.6 ? C.ribLit : C.rib) : C.dimRib;
    if (face === 'south' || face === 'north') {
      const ax = Math.abs(q[0]), yy = q[1];
      if (yy < 16.5 && (Math.abs(ax - (yy - 4.6) * 0.75) < 0.36 || Math.abs(ax - (yy - 6.4) * 0.75) < 0.36)) col = C.stripe;
    }
    p.px(i, j, col);
  }
};
const lacP = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? (i + j) % 7 === 0 ? C.lac[0] : C.lac[1] : face === 'down' ? C.lac[3] : j === 0 ? C.lac[0] : i === 1 ? C.lac[0] : C.lac[2]); };
const wireP = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? C.wire[0] : face === 'down' ? C.wire[2] : C.wire[1]); };
// the tongue: glossy pink with a groove down the middle
const tongueP = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? (i === Math.floor(w / 2) ? C.tongue[2] : C.tongue[0]) : face === 'down' ? C.tongue[3] : i === Math.floor(w / 2) ? C.tongue[2] : i === 0 ? C.tongue[0] : C.tongue[1]); };
// the glove: white with a scatter of rhinestones (the glow plane on its back carries the sparkle)
const gloveP = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? C.glove[0] : face === 'down' ? C.glove[3] : h2(i, j, face.length) < 0.12 ? '#cfe8ff' : j === h - 1 ? C.glove[2] : C.glove[1]); };
const sparkleP = (f) => (p, w, h) => { for (let k = 0; k < 9; k++) { const x = Math.floor(h2(k, f, 7) * w), y = Math.floor(h2(k, f, 8) * h); p.px(x, y, '#ffffff'); if (k % 3 === f % 3) { p.px(x + 1, y, '#bfe4ff'); p.px(x, y + 1, '#bfe4ff'); } } };
const handP = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? C.dim[0] : face === 'down' ? C.dim[3] : j === Math.floor(h / 2) ? C.dimRib : j < h / 2 ? C.dim[0] : C.dim[1]); };
const tasselP = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? C.tassel[0] : i % 2 ? C.tassel[2] : C.tassel[1]); };

// ---------------------------------------------------------------- kawaii eyes
// Gen 8–9 style eyes: a big soft oval with a 1-texel outline, a dark iris tinted with an accent, a lighter
// accent gradient in the lower third, a big catchlight high on the outer side (x small) and a 1-texel glint
// low on the inner side. lid: [y (fraction of the height), slope] cuts the top with a flat lid (angry: slope
// > 0, tilted in; sad: < 0). Other expressions are single-colour strokes: ^ (happy), ◡ (closed), > (hurt).
function eyeOpen(W, H, K, lid) {
  return (p) => {
    const cx = (W - 1) / 2, cy = (H - 1) / 2, rx = W / 2 - 0.02, ry = H / 2 - 0.02;
    const lidAt = (x) => (lid ? lid[0] * H + lid[1] * (x - cx) : -9);
    const inside = (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && y >= lidAt(x) - 0.01;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1) || (lid && y < lidAt(x) + 1.2);
      const t = y / (H - 1);
      p.px(x, y, edge ? K.line : t > 0.8 ? K.acc[1] : t > 0.62 ? K.acc[0] : K.dark);
    }
    const k = W >= 9 && !lid ? 3 : 2, x0 = Math.round(cx - rx * 0.55 + 0.5);
    const y0 = Math.max(Math.round(cy - ry * 0.55 + 0.5), lid ? Math.ceil(lidAt(x0 + 1) + 1.2) : 0);
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) if (inside(x0 + i, y0 + j) && !(k === 3 && (i === 2 && j === 2))) p.px(x0 + i, y0 + j, '#ffffff');
    const gx = Math.round(cx + rx * 0.5), gy = Math.round(cy + ry * 0.48);
    if (inside(gx, gy)) p.px(gx, gy, '#ffffff');
  };
}
// ^ happy (bulging up) or ◡ closed (bulging down): a 2-texel stroke
const eyeArc = (W, H, K, up) => (p) => {
  const cx = (W - 1) / 2, rx = W / 2 - 0.5;
  for (let x = 0; x < W; x++) {
    const u = (x - cx) / rx; if (Math.abs(u) > 1.02) continue;
    const s = Math.sqrt(Math.max(0, 1 - u * u)), y = Math.round(up ? H * 0.62 - H * 0.36 * s : H * 0.4 + H * 0.26 * s);
    p.px(x, y, K.line); p.px(x, y + 1, K.line);
  }
};
// > (hurt): apex on the inner side; the mirrored eye reads <
const eyeHurt = (W, H, K) => (p) => {
  for (let k = 0; k <= 10; k++) {
    const t = k / 10, x = Math.round(1 + t * (W - 3)), a = Math.round(1 + t * ((H - 1) / 2 - 1)), b = Math.round(H - 2 - t * ((H - 1) / 2 - 1));
    p.px(x, a, K.line); p.px(x, a + 1, K.line); p.px(x, b, K.line); p.px(x, b - 1, K.line);
  }
};
const eyeX = (W, H, K) => (p) => { for (let k = 0; k < W - 2; k++) { const y = Math.round(1 + (k * (H - 3)) / (W - 3)); p.px(1 + k, y, K.line); p.px(W - 2 - k, y, K.line); p.px(1 + k, y + 1, K.line); p.px(W - 2 - k, y + 1, K.line); } };
const eyeSwirl = (W, H, K) => (p) => { const cx = (W - 1) / 2, cy = (H - 1) / 2; for (let a = 0; a < 15; a += 0.2) { const r = a * (Math.min(W, H) / 2 - 0.5) / 15; p.px(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), K.line); } };

// ---------------------------------------------------------------- face
// one huge eye: 18 × 15 texels, glowing violet; the outer side (big catchlight) is to its right (x = 0)
const EK = { line: '#0c0418', dark: '#1e0a34', acc: ['#7a2ac8', '#d488ff'] }, EW = 18, EH = 15;
const EYES = {
  open: eyeOpen(EW, EH, EK),
  glare: eyeOpen(EW, EH, EK, [0.3, 0.3]),
  sly: eyeOpen(EW, EH, EK, [0.34, 0.06]),
  happy: eyeArc(EW, EH, EK, true),
  closed: eyeArc(EW, EH, EK, false),
  hurt: eyeHurt(EW, EH, EK),
  x: eyeX(EW, EH, EK),
  swirl: eyeSwirl(EW, EH, EK),
};
// the torn-rib mouth: k inside dark, f torn paper fibres like little teeth, v violet ghost-light deep inside
const MM = { k: '#1e0614', f: C.fiber, v: '#9a48e8', V: '#d498ff', l: C.rib };
const MOUTHS = {
  grin: ['l......................l', '.llf.ff.f.ff.f.ff.f.fll.', '..kkkkkkkkkkkkkkkkkkkk..', '...kkkkkkvVVVVvkkkkkk...', '....kkkkkkvvvvkkkkkk....', '......kkkkkkkkkkkk......', '.........llllll.........'],
  shut: ['........................', '........................', 'l.ff.f.f..f.ff.f..f.ff.l', '.llllllllllllllllllllll.', '........................', '........................', '........................'],
  open: ['ll....................ll', '.llf.ff.f.ff.f.ff.f.fll.', '.kkkkkkkkkkkkkkkkkkkkkk.', '.kkkkkkkvVVVVVVvkkkkkkk.', '..kkkkkkvVVVVVVvkkkkkk..', '..kkkkkkkvvvvvvkkkkkkk..', '....kkkkkkkkkkkkkkkk....', '.......llllllllll.......'],
};

// ---------------------------------------------------------------- geometry
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const FZ = LC[2] + 7.63;
const box = ([a, b, c], tex, x = {}, inset = 0) => P([LC[0] - a + inset, LC[1] - b + inset, LC[2] - c + inset], [2 * (a - inset), 2 * (b - inset), 2 * (c - inset)], tex, x);
const barrelCubes = BARREL.flatMap((e) => [
  box(e, paperP(true), { glow: true, id: 'lit' }),
  box(e, '#3a0a1a', { id: 'lit' }, 0.04),                    // hidden inside: carries the outline hull
  box(e, paperP(false), { id: 'dim', hide: true }),
]);
const tongue = (n, parent, y0, len, wd) => ({ name: n, parent, pivot: [0, y0, 7.9], cubes: [P([-wd / 2, y0 - len, 7.5], [wd, len + 0.2, 0.8], tongueP)] });
const fingers = (x0, z0, tex) => [0, 1, 2].map((k) => P([x0 + k * 0.8, 13.6, z0], [0.667, 1.4, 0.667], tex));

export const def = {
  name: 'chochobake', ppu: 3, scale: 0.42, outline: { color: C.ink, px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: LC, cubes: [
      ...barrelCubes,
      // lacquer caps
      P([-5.4, 23.6, -5.4], [10.8, 0.6, 10.8], lacP), P([-4.8, 24.2, -4.8], [9.6, 1.2, 9.6], lacP), P([-1.2, 25.4, -1.2], [2.4, 0.6, 2.4], lacP),
      P([-5.2, 3.8, -5.2], [10.4, 0.6, 10.4], lacP), P([-4.6, 2.8, -4.6], [9.2, 1.0, 9.2], lacP),
      // the eye and the mouth
      ...Object.entries(EYES).map(([k, fn]) => P([-3, 14.3, FZ], [6, 5, 0], fn, { plane: 'z', glow: true, id: 'eye-' + k, hide: k !== 'open' })),
      ...Object.entries(MOUTHS).map(([k, rows]) => P([-4, 11.6 - rows.length / 3, FZ], [8, rows.length / 3, 0], (p) => stamp(p, rows, MM), { plane: 'z', glow: true, id: 'm-' + k, hide: k !== 'grin' })),
    ] },
    // the wire hanging loop
    { name: 'loop', parent: 'body', pivot: [0, 25.6, 0], cubes: [P([-1.8, 25.6, -0.167], [0.333, 2.0, 0.333], wireP), P([1.467, 25.6, -0.167], [0.333, 2.0, 0.333], wireP), P([-1.8, 27.6, -0.167], [3.6, 0.333, 0.333], wireP)] },
    // the tongue, three sprung segments lolling out of the torn mouth
    tongue('tongue1', 'body', 8.6, 3.0, 2.4), tongue('tongue2', 'tongue1', 5.6, 2.8, 2.2), tongue('tongue3', 'tongue2', 2.8, 2.4, 1.8),
    // a quirk: a gold tassel under the bottom cap
    { name: 'tassel', parent: 'body', pivot: [0, 2.8, -1.6], cubes: [P([-0.2, 1.4, -1.8], [0.4, 1.4, 0.4], tasselP), P([-0.8, -1.4, -2.4], [1.6, 2.8, 1.6], tasselP)] },
    // little paper hands floating at its sides; the right wears the white sparkly glove
    { name: 'handR', parent: 'body', pivot: [-10.4, 12.6, 2.0], cubes: [
      P([-11.6, 11.2, 1.4], [2.4, 2.4, 1.2], gloveP), ...fingers(-11.6, 1.6, gloveP), P([-9.4, 11.8, 1.6], [0.8, 1.2, 0.8], gloveP),
      P([-11.8, 10.4, 1.2], [2.8, 0.8, 1.6], gloveP),
      ...[0, 1, 2].map((f) => P([-11.7, 11.0, 2.66], [2.6, 3.8, 0], sparkleP(f), { plane: 'z', glow: true, id: 'sp-' + f, hide: f > 0 })),
    ] },
    { name: 'handL', parent: 'body', pivot: [10.4, 12.6, 2.0], cubes: [P([9.2, 11.2, 1.4], [2.4, 2.4, 1.2], handP), ...fingers(9.2, 1.6, handP), P([8.4, 11.8, 1.6], [0.8, 1.2, 0.8], handP)] },
  ],
};
// gear anchors (model units): the lantern is all head
def.attach = {
  head: { bone: 'body', at: [0, 25.0, 0], size: 9.6 },
  face: { bone: 'body', at: [0, 16.8, 7.7], size: 10.8 },
  neck: { bone: 'body', at: [0, 4.4, 5.2], size: 9.2 },
  back: { bone: 'body', at: [0, 14.0, -7.6], size: 10.8 },
};

// ---------------------------------------------------------------- animation
const MOUTH = [0, 9.6, 8.2], EYE = [0, 16.8, 8.0], GLOVE = [-10.4, 12.6, 3.0];
const twinkle = (P, t) => P.face('sparkle', 'abc'[Math.floor(t * 8) % 3]);
const hands = (P, r, l) => { P.pos('handR', ...r.p).rot('handR', ...r.r); P.pos('handL', ...l.p).rot('handL', ...l.r); return P; };
// the zombie claws: both hands up to one side (s = −1 its right, +1 its left), palms out
function claws(P, s, k) {
  hands(P, { p: [s * 3 * k, 4 * k, 3 * k], r: [-40 * k, 0, s * 20 * k] }, { p: [s * 3 * k, 4.5 * k, 3 * k], r: [-40 * k, 0, s * 20 * k] });
}

export const anim = {
  start: 'idle', seed: 21,
  breathe: { bone: 'body', amp: 0.02, per: 2.8 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.8, 6], dur: 0.14 },
  look: { bone: 'body', yaw: 18, pitch: 8, speed: 3 },
  springs: [
    { bone: 'tongue1', tip: [0, -3, 0], k: 120, d: 6, gain: 1.0, max: 30 },
    { bone: 'tongue2', tip: [0, -2.8, 0], k: 100, d: 5.5, gain: 1.1, max: 34 },
    { bone: 'tongue3', tip: [0, -2.4, 0], k: 90, d: 5, gain: 1.2, max: 38 },
    { bone: 'tassel', tip: [0, -4, 0], k: 110, d: 6, gain: 1.0, max: 30 },
    { bone: 'loop', tip: [0, 2, 0], k: 200, d: 9, gain: 0.7, max: 20 },
    { bone: 'handR', tip: [0, 2, 0], k: 160, d: 9, gain: 0.5, max: 14 },
    { bone: 'handL', tip: [0, 2, 0], k: 165, d: 9, gain: 0.5, max: 14 },
  ],
  faces: {
    eyes: { default: 'open', states: Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eye-' + k]])) },
    mouth: { default: 'grin', states: Object.fromEntries(Object.keys(MOUTHS).map((k) => [k, ['m-' + k]])) },
    paper: { default: 'lit', states: { lit: ['lit'], dim: ['dim'] } },
    sparkle: { default: 'a', states: { a: ['sp-0'], b: ['sp-1'], c: ['sp-2'] } },
  },
  fidget: { every: [5, 9], clips: ['zombie', 'lick'] },
  clips: {
    // floating and bobbing, swaying as if hung in a breeze, a little zombie shrug to each side, tongue lolling
    idle: { len: 2.4, loop: true, f(P, t) {
      const ph = (t / 2.4) * TAU, bob = Math.sin(ph * 2), side = Math.sin(ph);
      P.pos('body', 0, 1.2 + bob * 0.8, 0).rot('body', 0, side * 6, side * 6).sq('body', bob * 0.025);
      const shrug = Math.sin(ph) * 0.8;
      claws(P, Math.sign(shrug) || 1, Math.abs(shrug) * 0.6);
      P.pos('handR', 0, wave(t, 0.8) * 0.6, 0).pos('handL', 0, wave(t, 0.8, 1.5) * 0.6, 0);
      twinkle(P, t);
      P.face('eyes', t > 1.5 && t < 1.95 ? 'sly' : undefined);
      if (h2(Math.floor(t * 4), 3, 1) < 0.25) P.stream('sparkle', 'handR', GLOVE, { rate: 3 });
    } },
    // the moonwalk: a smooth glide with no bob, leaning back, the gloved hand low, a heel-pop rhythm
    walk: { len: 1.0, loop: true, f(P, t) {
      const ph = (t / 1.0) * TAU, pop = Math.max(0, Math.sin(ph * 2)) ** 3;
      P.pos('body', 0, 1.0 - pop * 0.5, Math.sin(ph) * 0.6).rot('body', -10 + pop * 3, Math.sin(ph) * 5, Math.sin(ph) * 3);
      hands(P, { p: [0, -1 - pop * 0.6, -1 + Math.sin(ph) * 1.5], r: [Math.sin(ph) * 20, 0, -10] }, { p: [0, -1 - pop * 0.6, -1 - Math.sin(ph) * 1.5], r: [-Math.sin(ph) * 20, 0, 10] });
      P.rot('tongue1', 20, 0, 0).rot('tassel', 30, 0, 0);
      twinkle(P, t);
      P.stream('sparkle', 'handR', GLOVE, { rate: 2 });
    } },
    // battle cry: the light flares, it rears back and howls with claws up, ghost-fire bursting round it
    cry: { len: 1.9, next: 'idle', f(P, t) {
      const crouch = bump(t, 0, 0.35), up = seg(t, 0.3, 0.5, E.back) * (1 - seg(t, 1.4, 1.8, E.inout));
      P.pos('body', 0, 1.2 - 1.6 * crouch + 2.2 * up, 0).rot('body', -14 * up + wave(t, 9) * 3 * up, 0, wave(t, 6) * 4 * up).sq('body', -0.1 * crouch + 0.08 * up * (1 - seg(t, 0.5, 0.7)));
      hands(P, { p: [-2 * up, 6 * up, 2 * up], r: [-60 * up, 0, -30 * up] }, { p: [2 * up, 6 * up, 2 * up], r: [-60 * up, 0, 30 * up] });
      P.rot('tongue1', -30 * up, 0, 0);
      twinkle(P, t);
      P.face('eyes', up > 0.3 ? 'glare' : undefined).face('mouth', up > 0.3 ? 'open' : undefined);
      P.burst(0.5, 'ghostfire', 'body', [0, 14, 0], { n: 14, spread: 1, speed: 1.6 }).burst(0.5, 'ring', 'body', [0, 14, 6], { tint: [0.8, 0.5, 1] });
      if (t > 0.5 && t < 1.4) P.stream('ghostfire', 'body', [0, 26, 0], { rate: 10, speed: 0.8 });
    } },
    // attack: tongue lash — a lunge, and the long tongue whips out and slaps the target
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const back = seg(t, 0, 0.25, E.out) * (1 - seg(t, 0.25, 0.32, E.in)), lash = seg(t, 0.28, 0.4, E.out) * (1 - seg(t, 0.55, 0.9, E.inout));
      P.pos('root', 0, 0, -2 * back + 5 * lash).pos('body', 0, 1.2, 0).rot('body', -12 * back + 16 * lash, 0, 0);
      P.rot('tongue1', -100 * lash + 20 * back, 0, 0).rot('tongue2', -30 * lash, 0, 0).rot('tongue3', -20 * lash, 0, 0).scl('tongue1', 1, 1 + 0.5 * lash, 1).scl('tongue2', 1, 1 + 0.4 * lash, 1);
      hands(P, { p: [0, 2 * back, -2 * back], r: [30 * back, 0, 0] }, { p: [0, 2 * back, -2 * back], r: [30 * back, 0, 0] });
      twinkle(P, t);
      P.face('eyes', t < 0.6 ? 'glare' : 'happy').face('mouth', t > 0.2 && t < 0.7 ? 'open' : undefined);
      P.burst(0.4, 'spark', 'body', [0, 9, 18], { scale: 1.3 }).burst(0.4, 'star', 'body', [0, 9, 18], { n: 4 }).burst(0.42, 'heart', 'body', [0, 9, 16], { n: 1, tint: [0.8, 0.4, 1] });
    } },
    // special (Ecto): onibi — it draws its ghost-light up, then spits a volley of three violet fireballs
    special: { len: 2.1, next: 'idle', f(P, t) {
      const draw = seg(t, 0.05, 0.6, E.inout) * (1 - seg(t, 0.6, 0.7));
      P.pos('body', 0, 1.2 + 1.2 * draw, -1 * draw).sq('body', 0.06 * draw);
      let kick = 0;
      for (const t0 of [0.75, 1.05, 1.35]) { kick += bump(t, t0, t0 + 0.18); P.burst(t0, 'ghostfire', 'body', MOUTH, { n: 10, dir: [0, 0.1, 1], speed: 6, spread: 0.15, scale: 1.6 }).burst(t0, 'ring', 'body', [0, 10, 9], { tint: [0.8, 0.5, 1] }); }
      P.rot('body', -10 * draw + 14 * kick, 0, 0).pos('body', 0, 0, -1.4 * kick);
      hands(P, { p: [3 * draw, 3 * draw, 3 * draw], r: [-50 * draw, 0, -20 * draw] }, { p: [-3 * draw, 3 * draw, 3 * draw], r: [-50 * draw, 0, 20 * draw] });
      P.rot('tongue1', -40 * Math.min(1, kick), 0, 0);
      twinkle(P, t);
      P.face('eyes', draw > 0.3 ? 'glare' : undefined).face('mouth', t > 0.7 && t < 1.6 ? 'open' : undefined);
      if (draw > 0.2) P.stream('ghostfire', 'body', [0, 14, 0], { rate: 20 * draw, spread: 1, speed: 0.8 });
    } },
    // knocked back, the light flickering out and back
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.18, 0.6, E.inout));
      P.pos('root', 0, 0, -2.4 * k).pos('body', 0, 1.2, 0).rot('body', -16 * k + wob(t, 0.18, 6, 3, 6), 0, wave(t, 14) * 4 * k).sq('body', -0.12 * k);
      hands(P, { p: [-2 * k, 2 * k, 0], r: [0, 0, -40 * k] }, { p: [2 * k, 2 * k, 0], r: [0, 0, 40 * k] });
      P.face('paper', t > 0.06 && t < 0.18 ? 'dim' : undefined).face('eyes', t < 0.45 ? 'hurt' : undefined).face('mouth', 'open');
      P.burst(0.02, 'spark', 'body', [0, 15, 8], {}).burst(0.03, 'ghostfire', 'body', [0, 14, 4], { n: 5, speed: 1 });
    } },
    // the flame gutters, it sinks, and tips over onto its side, dark
    faint: { len: 2.2, next: 'down', f(P, t) {
      const sink = seg(t, 0.3, 1.0, E.in), fall = seg(t, 0.9, 1.35, E.bounce);
      P.pos('body', 0, 1.2 - 3.2 * sink, 0).rot('body', 0, wave(t, 1.5) * 12 * (1 - fall), wave(t, 2.2) * 8 * (1 - sink));
      P.rot('root', 0, 0, 84 * fall).pos('root', -10 * fall, 8 * fall, 0);
      hands(P, { p: [0, -4 * sink, 0], r: [0, 0, -60 * fall] }, { p: [0, -4 * sink, 0], r: [0, 0, 60 * fall] });
      P.face('paper', t > 0.4 && (t > 1.0 || Math.floor(t * 12) % 3 === 0) ? 'dim' : 'lit').face('eyes', t > 0.3 ? 'swirl' : 'hurt').face('mouth', 'open'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.35, 'smoke', 'body', [0, 26, 0], { n: 5, spread: 1 }).burst(0.9, 'star', 'body', [0, 26, 0], { n: 5 });
    } },
    down: { len: 2.6, loop: true, f(P, t) {
      P.pos('body', 0, -2.0, 0).rot('root', 0, 0, 84).pos('root', -10, 8, 0);
      hands(P, { p: [0, -4, 0], r: [0, 0, -60] }, { p: [0, -4, 0], r: [0, 0, 60] });
      P.face('paper', t > 1.5 && t < 1.58 ? 'lit' : 'dim').face('eyes', 'swirl').face('mouth', 'open'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.3;
      P.stream('smoke', 'body', [0, 26, 0], { rate: 1 });
    } },
    // victory: a spin and a pose — the gloved hand flung up high, glittering, a giggle and a ring of ghost-fire
    win: { len: 2.0, next: 'idle', f(P, t) {
      const spin = seg(t, 0.1, 0.7, E.inout), pose = seg(t, 0.7, 0.85, E.back) * (1 - seg(t, 1.7, 2.0, E.inout));
      P.rot('root', 0, (360 * spin) % 360, 0).pos('body', 0, 1.2 + 3 * Math.sin(spin * Math.PI), 0);
      P.rot('body', -6 * pose, 0, 8 * pose + wave(t, 6) * 2 * pose);
      hands(P, { p: [-2 * pose, 9 * pose, 1 * pose], r: [0, 0, -150 * pose] }, { p: [0, -2 * pose, 2 * pose], r: [0, 0, 20 * pose] });
      twinkle(P, t);
      P.face('eyes', pose > 0.3 ? 'happy' : undefined).face('mouth', pose > 0.3 ? 'open' : undefined);
      if (pose > 0.3) P.stream('sparkle', 'handR', GLOVE, { rate: 14 });
      P.burst(0.72, 'ring', 'root', [0, 2, 0], { tint: [0.8, 0.5, 1] }).burst(0.72, 'ghostfire', 'root', [0, 2, 0], { n: 16, spread: 1, speed: 1.4 });
    } },
    // asleep: drifting low, its light turned down to a soft breathing glow, eye closed, Zzz
    sleep: { len: 3.4, loop: true, f(P, t) {
      const br = Math.sin((t / 3.4) * TAU);
      P.pos('body', 0, -0.6 + br * 0.4, 0).rot('body', 6, 0, 4).sq('body', br * 0.02);
      hands(P, { p: [1, -2, 1], r: [0, 0, -10] }, { p: [-1, -2, 1], r: [0, 0, 10] });
      P.rot('tongue1', 6, 0, 0);
      P.face('paper', br > 0.6 ? 'lit' : 'dim').face('eyes', 'closed').face('mouth', 'shut'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'body', [4, 25, 4], {}).burst(1.8, 'z', 'body', [4, 25, 4], {});
    } },
    // fidget: a full zombie-dance phrase — claws left, claws right, a head jerk and a shoulder shimmy
    zombie: { len: 2.4, next: 'idle', f(P, t) {
      const L = bump(t, 0.1, 0.8), R = bump(t, 0.8, 1.5), jerk = bump(t, 1.55, 1.75), shim = bump(t, 1.7, 2.3);
      claws(P, -1, L); claws(P, 1, R);
      P.pos('body', 0, 1.2 - 0.8 * (L + R) + 0.6 * jerk, 0).rot('body', 0, 12 * L - 12 * R, -10 * L + 10 * R + 14 * jerk + wave(t, 9) * 5 * shim);
      P.pos('root', -1.2 * L + 1.2 * R, 0, 0);
      twinkle(P, t);
      P.face('eyes', jerk > 0.3 ? 'glare' : 'sly').face('mouth', 'grin');
      if (shim > 0.3) P.stream('sparkle', 'handR', GLOVE, { rate: 8 });
    } },
    // fidget: a long lick round its torn mouth, and a giggle
    lick: { len: 1.8, next: 'idle', f(P, t) {
      const k = bump(t, 0.1, 1.2), a = t * 9;
      P.pos('body', 0, 1.2, 0).rot('tongue1', -60 * k, Math.sin(a) * 30 * k, 0).rot('tongue2', -50 * k, 0, Math.cos(a) * 25 * k).rot('tongue3', -40 * k, 0, 0);
      const gig = bump(t, 1.2, 1.7); P.rot('body', 0, 0, wave(t, 10) * 4 * gig).pos('body', 0, wave(t, 10) * 0.4 * gig, 0);
      P.face('eyes', gig > 0.2 ? 'happy' : 'sly').face('mouth', k > 0.2 ? 'open' : undefined);
    } },
  },
};
def.anim = anim;
