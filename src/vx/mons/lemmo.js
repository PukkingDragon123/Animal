// Lemmo — the lemon battery that walks (Volto). A plump lemon lying on its side on two stubby
// green feet, a nub at either end and a permanently sour pout. A copper strip and a zinc nail are
// stuck in its head like antennae with a little arc crackling between them, and a sprig of two
// glossy leaves makes its ears. Squeeze one and you get a jolt of juice and a sour look you will
// never forget.
//
// Music homage (Lemonade, original): a glossy golden peel, long wavy golden locks of zest framing its face, big
// round cartoon eyes, a tiny baseball bat it carries on its shoulder and swings through glass ('Hold Up'), a bee
// hair-clip, honeycomb cells pressed into its back and branded on the bat, and a buzzing hive of little bees.
//
// Build notes: the peel is one ideal ellipsoid painted across the stepped boxes that approximate
// it (orb()), so the light bands flow over every step. The electrodes sit on one sprung 'rig'
// bone, so the arc plane between their tips can never come loose; when a clip splays them apart,
// splay() re-aims and stretches the arc onto the new tips.
import { defineFx } from '../fx.js';
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import { shift, h2 } from './kit.js';
import { eyeRig, eyesAt, eyesScale, glance, keepEyes } from './eyes.js';
import { blackGold } from '../model.js';

const D2R = Math.PI / 180;
const C = {
  hi: '#fffbd0', lite: '#ffee52', peel: '#ffd726', shd: '#f8b41e', deep: '#e88c18', pore: ['#f6cc30', '#eeac1e', '#d88618'],
  wood: ['#f2cc8e', '#dcaa68', '#b8844a', '#8a5a30'], grip: ['#3e3a42', '#26232a'], hive: ['#ffd84a', '#c8901c', '#7a4a10'],
  bee: { y: '#ffd23a', k: '#1e1a20', w: '#e8f6ff', W: '#ffffff' },
  green: ['#e6f05c', '#d0e246', '#b6cc3a'],
  ink: '#3a200e', lid: '#2a120c', sclera: '#fffbe8', scleraLo: '#e8dcbc',
  leaf: ['#e0f68a', '#9ad458', '#5aa844', '#357a34', '#1e4c26'], rib: '#f2fcc0',
  stem: ['#bca85c', '#8c7642', '#5e4c2e'],
  cu: ['#ffe2c4', '#f6a46c', '#d6703c', '#a24a28', '#6e2c1e'], verd: ['#86e0c4', '#3c9e88'],
  zn: ['#ffffff', '#e2e8f6', '#b4bed8', '#808aae', '#545c82'],
  foot: ['#e8f694', '#b0d85c', '#78b044', '#467a36', '#2a5028'],
  lip: ['#ffdc84', '#f8b444', '#e08a2c', '#a8521c'], mouth: '#4a140c', tongue: '#ff8a70',
  arc: ['#ffffff', '#fff7a8', '#ffe23a', '#9af0ff'],
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

// ---------------------------------------------------------------- the peel
const O = [0, 8.8, 0], R = [8.8, 6.7, 6.7];
const PEEL = [C.hi, C.lite, C.peel, C.shd, C.deep];
// pores: a few dimples spread over the peel (a Fibonacci sphere), kept off the face
const PORES = [];
for (let k = 0; k < 30; k++) {
  const y = 1 - (2 * (k + 0.5)) / 30, r = Math.sqrt(1 - y * y), a = k * 2.39996 + 0.7, v = [Math.cos(a) * r, y, Math.sin(a) * r];
  if (v[2] > 0.55 && Math.abs(v[0]) < 0.62 && v[1] > -0.75) continue;
  PORES.push(v);
}
function poreAt(q) {
  const u = [(q[0] - O[0]) / R[0], (q[1] - O[1]) / R[1], (q[2] - O[2]) / R[2]], d = Math.hypot(...u);
  for (const v of PORES) { const e = Math.hypot(u[0] / d - v[0], (u[1] / d - v[1]) * 1.6, u[2] / d - v[2]) * d * 7.4; if (e < 0.34) return true; }
  return false;
}
const peel = orb(O, R, (l, q, n, i, j) => {
  let col = band(PEEL, [0.97, 0.42, -0.2, -0.74], l);
  // the stem end (−x) keeps a faint green flush, dithered in
  const g = (-q[0] - 6.6) / 2.4;
  if (g > 0) { const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][(i & 3) + (j & 3) * 4]; if (g * 16 > B) col = l > 0.42 ? C.green[0] : l > -0.2 ? C.green[1] : C.green[2]; }
  if (l > 0.982) col = '#ffffff';
  if (poreAt(q)) col = l > 0.42 ? C.pore[0] : l > -0.2 ? C.pore[1] : C.pore[2];
  return col;
});
// the face: the peel plus little pucker creases bracketing the pout
const FACE_O = [-5.4, 13.0];          // top-left (model x, y) of the face box's front
const face = (p, w, h, f, c) => {
  peel(p, w, h, f, c);
  if (f !== 'south') return;
  const T = (x, y) => [Math.round((x - FACE_O[0]) * 3), Math.round((FACE_O[1] - y) * 3)];
  for (const s of [-1, 1]) { const [a, b] = T(s * 1.6, 7.2); p.px(a, b, C.shd); p.px(a + s, b - 1, C.shd); const [a2, b2] = T(s * 1.6, 5.4); p.px(a2, b2, C.shd); p.px(a2 + s, b2 + 1, C.shd); }
};
// the back: battery polarity marks pressed into the peel under each electrode (+ copper, − zinc)
const backFace = (p, w, h, f, c) => {
  face(p, w, h, f, c);
  if (f !== 'north') return;
  const T = (x, y) => [Math.round((c.o[0] + c.s[0] - x) * 3), Math.round((c.o[1] + c.s[1] - y) * 3)];
  const ink = '#e89a1c', lit = '#fff6a0';
  const [px, py] = T(-2.4, 11.2); for (let k = -2; k <= 2; k++) { p.px(px + k, py, ink); p.px(px, py + k, ink); } p.px(px - 2, py - 1, lit); p.px(px - 1, py - 2, lit);
  const [mx, my] = T(2.4, 11.2); for (let k = -2; k <= 2; k++) p.px(mx + k, my, ink); p.px(mx - 2, my - 1, lit);
  // a little cluster of honeycomb cells pressed into the peel below them
  for (const [hx, hy] of [[-0.9, 7.6], [0.9, 7.6], [0, 6.2], [-1.8, 6.2], [1.8, 6.2]]) { const [cx, cy] = T(hx, hy); hexCell(p, cx, cy, ink, C.hive[0]); }
};
// a honeycomb cell: a 5 × 4 texel hexagon outline with a honey-lit middle
function hexCell(p, cx, cy, edge, fill) {
  for (const [dx, dy] of [[-1, -2], [0, -2], [1, -2], [-2, -1], [2, -1], [-2, 0], [2, 0], [-1, 1], [0, 1], [1, 1]]) p.px(cx + dx, cy + dy, edge);
  for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0]]) p.px(cx + dx, cy + dy, fill);
}
// the stem end: a nub with a dry five-point calyx scar
const stemNub = (p, w, h, f, c) => {
  peel(p, w, h, f, c);
  if (f !== 'west') return;
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const dx = i - cx, dy = j - cy, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), star = 1.2 + 1.6 * Math.max(0, Math.cos(a * 5 + 0.6)) ** 2;
    if (r < star) p.px(i, j, r < 0.9 ? '#6a4a22' : r < star - 0.6 ? '#6a9a36' : '#94b440');
  }
};

// ---------------------------------------------------------------- electrodes, arc, leaves, feet
const metal = (cols, o = {}) => (p, w, h, face) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let k;
    if (face === 'up') k = 0; else if (face === 'down') k = 4;
    else { const u = w > 1 ? i / (w - 1) : 0.5; k = u < 0.25 ? 1 : u > 0.75 ? 3 : 2; if (face === 'east' || face === 'north') k = Math.min(4, k + 1); }
    p.px(i, j, cols[k]);
  }
  if (face !== 'up' && face !== 'down') for (let i = 0; i < w; i++) p.px(i, 0, cols[0]);
  if (o.after) o.after(p, w, h, face);
};
// copper strip: bevelled edges, a clip hole near the top, green verdigris where it meets the juice
const copper = metal(C.cu, { after: (p, w, h, face) => {
  if (face === 'up' || face === 'down') return;
  if (face === 'south' || face === 'north') { p.px(Math.floor(w / 2), 2, C.cu[4]); p.px(Math.floor(w / 2), 3, C.cu[3]); }
  for (let j = h - 7; j < h; j++) for (let i = 0; i < w; i++) if (h2(i, j, face.length) < 0.16 + (j - h + 7) * 0.07) p.px(i, j, (i + j) & 1 ? C.verd[0] : C.verd[1]);
} });
// zinc nail: a galvanised shaft with grip rings under a cross-hatched head
const nail = metal(C.zn, { after: (p, w, h, face) => { if (face === 'up' || face === 'down') return; for (const y of [2, 4, 6]) for (let i = 0; i < w; i++) p.px(i, y, C.zn[3]); } });
const nailHead = (p, w, h, face) => {
  metal(C.zn)(p, w, h, face);
  if (face === 'up') { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, (i + j) % 2 === 0 ? C.zn[1] : C.zn[2]); p.px(0, 0, C.zn[0]); p.px(1, 0, C.zn[0]); p.px(0, 1, C.zn[0]); }
};
// the arc: a jagged white-hot bolt from the copper tip (left) to the nail head (right). Three
// frames make it crackle; the big frames are thicker and fork. Drawn for a plane seen from the
// front (bows upward) or from above (no bow), both with their ends on the mid-line.
function bolt(seed, big, top) {
  return (p, w, h) => {
    const mid = (h - 1) / 2, pts = [];
    for (let x = 0; x < w; x++) {
      const bow = top ? 0 : Math.sin((x / (w - 1)) * Math.PI) * (big ? 2.2 : 1.2);
      const step = Math.floor(x / 3), jit = x < 2 || x > w - 3 ? 0 : (hsh(step * 7.3 + seed * 13.1) - 0.5) * (big ? 4.4 : 2.6);
      pts.push(Math.round(mid - bow + jit));
    }
    const put = (x, y, c) => { if (y >= 0 && y < h) p.px(x, y, c); };
    for (let x = 0; x < w; x++) {
      const y = pts[x], yn = x + 1 < w ? pts[x + 1] : y;
      for (let yy = Math.min(y, yn); yy <= Math.max(y, yn); yy++) {
        put(x, yy - 1, big ? C.arc[1] : C.arc[3]); put(x, yy + 1, big ? C.arc[1] : C.arc[3]);
        if (big) { put(x, yy - 2, C.arc[3]); put(x, yy + 2, C.arc[3]); }
      }
      for (let yy = Math.min(y, yn); yy <= Math.max(y, yn); yy++) put(x, yy, C.arc[0]);
    }
    if (big) for (const [x0, dir] of [[Math.floor(w * 0.3), -1], [Math.floor(w * 0.62), 1]]) {
      let y = pts[x0]; for (let k = 1; k < 5; k++) { y += dir * (hsh(seed + k) > 0.4 ? 1 : 0) + dir; put(x0 + k, y, k < 3 ? C.arc[0] : C.arc[1]); }
    }
    for (const x of [0, w - 1]) { put(x, Math.round(mid), C.arc[0]); put(x, Math.round(mid) - 1, C.arc[1]); put(x, Math.round(mid) + 1, C.arc[1]); }
  };
}
// half a leaf blade: the midrib runs down the right edge, the tip is at the top. Glossy, veined.
const halfLeaf = (lit) => (p, w, h) => {
  const G = C.leaf;
  for (let j = 0; j < h; j++) {
    const t = 1 - (j + 0.5) / h, wd = Math.max(0, (w - 0.3) * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.03)), 0.7) * (1 - 0.2 * t));
    const x0 = Math.round(w - 1 - wd);
    for (let x = x0; x < w; x++) {
      const edge = x === x0, d = w - 1 - x;
      let col = edge ? (lit ? G[2] : G[3]) : lit ? (d < wd * 0.5 ? G[1] : G[2]) : (d < wd * 0.5 ? G[2] : G[3]);
      if (!edge && d > 0 && (j + d * 2) % 7 === 0) col = lit ? G[0] : G[1];        // veins slant up and out
      if (x === w - 1) col = C.rib;
      p.px(x, j, col);
    }
  }
  if (lit) { const y = Math.floor(h * 0.32); p.px(w - 2, y, '#f6ffd0'); p.px(w - 2, y + 1, G[0]); p.px(w - 3, y + 1, G[0]); }
};
const stemP = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? C.stem[0] : (i === 0 ? C.stem[0] : j > h - 2 ? C.stem[2] : C.stem[1])); };
// stubby green feet: soft gumdrops with two toe nicks
const footP = (toe) => (p, w, h, face) => {
  const F = C.foot;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let col = face === 'up' ? F[1] : face === 'down' ? F[4] : j === 0 ? F[0] : j < h * 0.5 ? F[1] : j < h - 1 ? F[2] : F[3];
    if (face === 'east' || face === 'west' || face === 'north') col = shift(col, -0.06);
    p.px(i, j, col);
  }
  if (toe && face === 'south') for (const x of [Math.round(w / 3), Math.round((2 * w) / 3)]) for (let j = Math.floor(h * 0.4); j < h - 1; j++) p.px(x, j, F[3]);
  // soles (seen when it lies feet-up): a paler pad, toe pads at the front (the top rows of a down face)
  if (face === 'down') for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const edge = i === 0 || i === w - 1 || j === h - 1 || (!toe && j === 0);
    p.px(i, j, edge ? F[3] : toe && i % 3 === 1 ? F[0] : F[1]);
  }
  if (toe && face === 'up') for (const x of [Math.round(w / 3), Math.round((2 * w) / 3)]) p.px(x, h - 1, F[2]);
};
// little nub hands, a thumb pressed round whatever they hold
const handP = (p, w, h, face) => { footP(false)(p, w, h, face); if (face === 'south' || face === 'up') { p.px(1, face === 'up' ? h - 1 : 1, C.foot[3]); p.px(1, face === 'up' ? h - 2 : 2, C.foot[3]); } };
// the bat: pale ash with a few grain flecks, black grip tape wound up the handle, honeycomb cells branded on the barrel
const woodP = (p, w, h, face) => {
  const W = C.wood;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let col = face === 'up' ? W[0] : face === 'down' ? W[3] : i === 0 ? W[0] : i === w - 1 ? W[2] : W[1];
    if (face !== 'up' && face !== 'down' && i > 0 && (i * 7 + j * 3) % 11 === 0) col = W[2];
    p.px(i, j, col);
  }
};
const gripP = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' || face === 'down' ? C.grip[1] : (i + j) % 3 === 0 ? C.grip[0] : C.grip[1]); };
const barrelP = (p, w, h, face) => { woodP(p, w, h, face); if (face !== 'up' && face !== 'down') hexCell(p, Math.floor(w / 2), Math.floor(h * 0.42), C.hive[2], C.hive[0]); };
// a bee: black-and-gold stripes, a dark head, glassy wings (9 × 6 texels, flying right)
const BEE = ['...ww.ww.', '...wWwWw.', '.ykykykk.', 'kykykykkk', '.ykykykk.', '...ykyk..'];
const beeP = (p) => stamp(p, BEE, C.bee);

// ---------------------------------------------------------------- face: eyes and mouth
// eyes (hand-pixelled at full texture resolution, Pokémon-style): big round cartoon whites ringed in ink, an amber
// iris with a darker top and a dark pupil, one big glint and one small one, a shaded rim low on the white. Its own:
// the only Tokonmon with a golden-amber iris on a white this big.
const EYES = eyeRig({ style: 'pix', chunk: 1, parent: 'body', at: [-2.9, 10.4, 6.36], line: '#1e0c04', iris: '#f2a21e', irisDark: '#a85a0e', pupilColor: '#2a1206', extra: ['smug', 'glint'], map: {
  open: [
    '............',
    '.llllllllll.',
    'llllllllllll',
    '.ssssssssss.',
    '.wwwIIIIwww.',
    '.wwIkkkkIww.',
    '.wwihhkkiww.',
    '.wwihkkkiww.',
    '.wwiiikhiww.',
    '.wwwiiiiwww.',
    '..wwwwwwww..',
    '............',
  ],
  happy: ['............', '............', '............', '...llllll...', '.ll......ll.', 'l..........l', 'l..........l', '............', '............', '............', '............', '............'],
  closed: ['............', '............', '............', '............', '............', '............', 'l..........l', '.ll......ll.', '...llllll...', '............', '............', '............'],
} });
// long wavy golden locks of zest: S-waves of gold with darker gold troughs and a lit crest on each wave
const lockP = (ph) => (p, w, h) => {
  for (let j = 0; j < h; j++) {
    const v = j / (h - 1), half = (w / 2) * (0.55 + 0.45 * Math.sin(Math.min(1, v * 1.25) * Math.PI * 0.5)) * (v > 0.9 ? 1 - (v - 0.9) * 6 : 1), sh = Math.sin(v * Math.PI * 3.2 + ph) * w * 0.18;
    for (let i = 0; i < w; i++) {
      const u = i + 0.5 - w / 2 - sh; if (Math.abs(u) > half) continue;
      const wave = Math.sin(v * Math.PI * 6.4 + ph + u * 0.5);
      p.px(i, j, Math.abs(u) > half - 0.8 ? '#b8740e' : wave > 0.6 ? '#fff4a0' : wave < -0.5 ? '#d89418' : '#ffd23a');
    }
  }
};
// drip painters
const sashP = (p, w, h, f) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, f === 'up' || f === 'down' ? '#e8dcc8' : j === 0 || j === h - 1 ? '#ffd23e' : (i + j) % 7 === 0 ? '#ffe680' : '#fffaf0'); };
const discoP = (p, w, h, f) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, f === 'down' ? '#5a6078' : (i + j) % 2 ? ((i * 3 + j) % 5 === 0 ? '#ffffff' : '#c8d0e4') : '#8a92aa'); };
const diamondP = (p, w, h, f) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, f === 'up' ? '#ffffff' : (i + j) % 2 ? '#bff0ff' : '#e8fbff'); };
const hatP = (p, w, h, f) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, f === 'down' ? '#c8bea8' : f === 'up' ? '#ffffff' : j === 0 ? '#ffffff' : '#f4efe4'); };
const honeyP = (p, w, h, f) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const c = (i + (Math.floor(j / 2) % 2) * 2) % 4 === 0; p.px(i, j, f === 'down' ? C.hive[2] : c ? C.hive[2] : j === 0 ? '#fff0a0' : C.hive[0]); } };
const crownPts = (p, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (j >= Math.abs((i % 4) - 1.5) * 1.6) p.px(i, j, j === h - 1 ? C.hive[1] : (i % 4 === 1 || i % 4 === 2) && j < 2 ? '#fff6c0' : '#ffd84a'); };
// the pursed lips: a round pucker, a dark pit in the middle, creases gathering into it
const lipsP = (p, w, h, face) => {
  const L = C.lip;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? L[0] : face === 'down' ? L[3] : j === 0 ? L[0] : j < h - 1 ? L[1] : L[2]);
  if (face === 'south') { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, 0); stamp(p, ['.LLLLL.', 'LlLdLlL', 'ldkkkdl', 'oldddlo', '.ooooo.'], { L: L[0], l: L[1], d: L[3], k: C.mouth, o: L[2] }); }
};
const MM = { k: C.mouth, t: C.tongue, T: '#ffb49a', l: C.lip[1], L: C.lip[0], d: C.lip[3], w: '#fff6dc', o: C.lip[2] };
const MOUTHS = {
  // a little smile, a sulky frown, a startled o (flat mouths drawn on the face)
  smile: ['............', '............', '.l........l.', '..l......l..', '...llllll...', '............', '............', '............'],
  frown: ['............', '............', '...llllll...', '..l......l..', '.l........l.', '............', '............', '............'],
  o: ['............', '....LLLL....', '...lkkkkl...', '...lkkkkl...', '...lkkkkl...', '....dddd....', '............', '............'],
  // shouting: a sour square yell with everted lips
  open: ['...LLLLLL...', '..lkkkkkkl..', '.lkkkkkkkkl.', '.lkkkkkkkkl.', '.lkkttttkkl.', '..lktTTtkl..', '...dllllo...', '............'],
  // gritted teeth: a wide, flat grimace
  grit: ['............', '.LLLLLLLLLL.', 'lkwwwwwwwwkl', 'lkwkwwkwwkkl', '.lkkkkkkkkl.', '..dddddddd..', '............', '............'],
};
const mouthP = (rows) => (p) => stamp(p, rows, MM);

// ---------------------------------------------------------------- geometry
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
// electrodes: pivot, length to the tip, rest lean (degrees about z; + leans toward −x)
const CU = { piv: [-2.3, 15.2, 1.4], len: 6.2, ang: 17 };
const ZN = { piv: [2.4, 15.2, 1.4], len: 6.2, ang: -14 };
const tipOf = (e, a = 0) => { const r = (e.ang + a) * D2R; return [e.piv[0] - Math.sin(r) * e.len, e.piv[1] + Math.cos(r) * e.len, e.piv[2]]; };
const T0 = tipOf(CU), T1 = tipOf(ZN), ARC_LEN = Math.hypot(T1[0] - T0[0], T1[1] - T0[1]), ARC_ANG = Math.atan2(T1[1] - T0[1], T1[0] - T0[0]) / D2R;
const ABC = ['a', 'b', 'c'];
const arcPlanes = (big) => ABC.flatMap((f, k) => [
  P([T0[0], T0[1] - (big ? 2.2 : 1.6), T0[2]], [ARC_LEN, big ? 4.4 : 3.2, 0], bolt(k + (big ? 10 : 0), big, false), { plane: 'z', glow: true, id: 'arc-' + (big ? 'big' : '') + f, hide: true }),
  P([T0[0], T0[1], T0[2] - (big ? 1.8 : 1.3)], [ARC_LEN, 0, big ? 3.6 : 2.6], bolt(k + 5 + (big ? 10 : 0), big, true), { plane: 'y', glow: true, id: 'arc-' + (big ? 'big' : '') + f, hide: true }),
]);
const FZ = 6.35;      // the face plane (front of the face box + a hair)
const LEAF_Y = 16.1, LEAF_Z = -2.6;
// the bat (held at the grip, BAT_P), drawn standing up from the hand; BAT_REST leans it back over the shoulder
const BAT_P = [-6.6, 5.6, 4.0], BAT_REST = [-16, 0, 46], BAT_TIP = [-6.6, 14.0, 4.0];
const batCubes = [
  P([-7.1, 4.5, 3.5], [1.0, 0.5, 1.0], woodP), P([-6.9, 5.0, 3.7], [0.6, 3.6, 0.6], gripP), P([-7.05, 8.6, 3.55], [0.9, 1.6, 0.9], woodP),
  P([-7.433, 10.2, 3.167], [1.667, 3.6, 1.667], barrelP), P([-7.267, 13.8, 3.333], [1.333, 0.4, 1.333], woodP),
];
// the hive: three bees on an orbit round it (shown by the 'bees' slot)
const beeCubes = [[0, 11.5], [130, 14.5], [250, 9.5]].flatMap(([a, y]) => { const x = Math.sin(a * D2R) * 10, z = Math.cos(a * D2R) * 10; return [P([x - 1.5, y - 1, z], [3, 2, 0], beeP, { plane: 'z', id: 'bee', hide: true }), P([x, y - 1, z - 1.5], [0, 2, 3], beeP, { plane: 'x', id: 'bee', hide: true })]; });
const leaf = (side) => [
  P([-2, LEAF_Y, LEAF_Z], [2, 8.333, 0], halfLeaf(side > 0), { plane: 'z', pivot: [0, LEAF_Y, LEAF_Z], rot: [0, 26, 0] }),
  P([0, LEAF_Y, LEAF_Z], [2, 8.333, 0], halfLeaf(side < 0), { plane: 'z', pivot: [0, LEAF_Y, LEAF_Z], rot: [0, -26, 0], mirror: true }),
];

// the lemon's six boxes (half-extents about O): long core, body, tall, deep face, deep-tall, wide-deep
const LEMON = [[8.2, 3.0, 3.0], [6.8, 4.6, 4.6], [4.4, 6.6, 4.2], [5.4, 4.2, 6.3], [3.6, 5.6, 5.6], [6.0, 3.4, 5.4]];
// the bee clip: a striped body and two glassy wings
const clipBodyP = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'down' ? '#8a6a10' : (i >> 1) % 2 ? C.bee.k : j === 0 || face === 'up' ? '#ffe878' : C.bee.y); };
const wingP = (p, w, h) => { const cx = (w - 1) / 2, cy = (h - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = ((x - cx) / (w / 2)) ** 2 + ((y - cy) / (h / 2)) ** 2; if (d <= 1) p.px(x, y, d > 0.6 ? '#9ad4f0' : '#eaf8ff'); } };

export const def = {
  name: 'lemmo', ppu: 3, scale: 0.33, outline: { color: C.ink, px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    // stubby feet (pivot at the heel, so a tap lifts the toes)
    { name: 'footR', parent: 'root', pivot: [-3.1, 0, -1.6], cubes: [P([-4.8, 0, -1.6], [3.4, 2.8, 3.4], footP(false)), P([-4.633, 0, 1.8], [3.067, 1.8, 1.333], footP(true))] },
    { name: 'footL', parent: 'root', pivot: [3.1, 0, -1.6], cubes: [P([1.4, 0, -1.6], [3.4, 2.8, 3.4], footP(false)), P([1.567, 0, 1.8], [3.067, 1.8, 1.333], footP(true))] },
    // the lemon: a plump, chunky ellipsoid of six nested boxes (distinct extents on every axis so no
    // faces coincide), the deep one a big flat face; a nub at either end
    { name: 'body', parent: 'root', pivot: [0, 2.2, 0], rot: [0, 0, -3], cubes: [
      ...LEMON.map(([a, b, c], k) => P([O[0] - a, O[1] - b, O[2] - c], [2 * a, 2 * b, 2 * c], k === 3 ? backFace : peel)),
      P([-9.4, 7.6, -1.2], [1.2, 2.4, 2.4], stemNub),               // stem-end nub
      P([8.2, 7.6, -1.2], [1.4, 2.4, 2.4], peel),                   // tip nub
      P([9.6, 8.2, -0.6], [0.8, 1.2, 1.2], peel),
      ...Object.entries(MOUTHS).map(([k, rows]) => P([-2, 5.0, FZ], [4, 2.667, 0], mouthP(rows), { plane: 'z', id: 'm-' + k, hide: true })),
    ] },
    ...EYES.bones,
    // hair: long wavy golden locks of zest falling either side of the face (front and side planes, sprung)
    ...[-1, 1].map((sd) => ({ name: sd < 0 ? 'lockR' : 'lockL', parent: 'body', pivot: [sd * 6.2, 14.4, 3.6], cubes: [
      P([sd * 6.9 - 1.7, 3.0, 4.9], [3.4, 11.6, 0], lockP(sd < 0 ? 0 : 2), { plane: 'z', mirror: sd > 0 }),
      P([sd * 8.4, 3.6, -3.4], [0, 10.6, 3.4], lockP(1.4), { plane: 'x' }),
      P([sd * 7.2 - 1.6, 12.2, -2.6], [3.2, 3.4, 0], lockP(3), { plane: 'z' }),
    ] })),
    { name: 'mouth', parent: 'body', pivot: [0, 6.3, 6.3], cubes: [P([-1.167, 5.467, 6.15], [2.333, 1.667, 0.6], lipsP, { id: 'm-lips' })] },
    // the electrodes ride one sprung rig so the arc between them always lands on both tips
    { name: 'rig', parent: 'body', pivot: [0, 15.4, 1.4], cubes: [] },
    { name: 'copper', parent: 'rig', pivot: CU.piv, rot: [0, 0, CU.ang], cubes: [P([CU.piv[0] - 0.75, CU.piv[1] - 1.2, CU.piv[2] - 0.25], [1.5, CU.len + 1.2, 0.5], copper)] },
    { name: 'zinc', parent: 'rig', pivot: ZN.piv, rot: [0, 0, ZN.ang], cubes: [
      P([ZN.piv[0] - 0.333, ZN.piv[1] - 1.2, ZN.piv[2] - 0.333], [0.667, ZN.len + 0.8, 0.667], nail),
      P([ZN.piv[0] - 1, ZN.piv[1] + ZN.len - 0.45, ZN.piv[2] - 1], [2, 0.5, 2], nailHead),
    ] },
    { name: 'arc', parent: 'rig', pivot: T0, rot: [0, 0, ARC_ANG], cubes: [...arcPlanes(false), ...arcPlanes(true)] },
    // the sprig: a short twig and two folded leaves for ears
    { name: 'sprig', parent: 'body', pivot: [0, 15.4, LEAF_Z], cubes: [P([-0.333, 14.8, LEAF_Z - 0.333], [0.667, 1.8, 0.667], stemP)] },
    { name: 'leafR', parent: 'sprig', pivot: [0, LEAF_Y, LEAF_Z], rot: [-16, -14, 58], cubes: leaf(-1) },
    { name: 'leafL', parent: 'sprig', pivot: [0, LEAF_Y, LEAF_Z], rot: [-16, 14, -58], cubes: leaf(1) },
    // stubby nub hands; the right one carries the bat
    { name: 'armR', parent: 'body', pivot: [-6.2, 5.6, 4.0], cubes: [P([-7.6, 4.6, 3.0], [2.0, 2.0, 2.0], handP)] },
    { name: 'bat', parent: 'armR', pivot: BAT_P, rot: BAT_REST, cubes: batCubes },
    { name: 'armL', parent: 'body', pivot: [6.2, 5.6, 4.0], cubes: [P([5.6, 4.6, 3.0], [2.0, 2.0, 2.0], handP)] },
    { name: 'bees', parent: 'root', pivot: [0, 11, 0], cubes: beeCubes },
    // a quirk: a little bee hair-clip pinned on its shoulder (a nod to its hive)
    { name: 'clip', parent: 'body', pivot: [4.8, 13.4, 2.2], rot: [0, -18, 14], cubes: [
      P([3.6, 13.4, 1.4], [2.4, 1.4, 1.6], clipBodyP), P([6.0, 13.5, 1.6], [0.8, 1.2, 1.2], C.bee.k),
      P([3.8, 14.8, 2.2], [1.4, 1.333, 0], wingP, { plane: 'z', pivot: [4.5, 14.8, 2.2], rot: [0, 0, 18] }),
      P([4.9, 14.8, 2.2], [1.4, 1.333, 0], wingP, { plane: 'z', pivot: [5.6, 14.8, 2.2], rot: [0, 0, -12] }),
    ].map((c) => ({ ...c, id: 'acc-clip', hide: true })) },
    // drip 1 (or): a big diamond ring on the free hand — put a ring on it
    { name: 'ring', parent: 'armL', pivot: [6.6, 5.6, 4], cubes: [
      P([5.45, 5.3, 4.9], [2.3, 0.6, 0.3], '#ffd23e'), P([6.0, 5.9, 4.85], [1.2, 1.1, 0.8], diamondP, { glow: true }),
    ].map((c) => ({ ...c, id: 'acc-ring', hide: true })) },
    // drip 2: a rodeo-queen sash across the body, white and gold
    { name: 'sash', parent: 'body', pivot: [0, 8.8, 6.4], cubes: [P([-7.8, 8.0, 6.3], [15.6, 1.2, 0.4], sashP, { pivot: [0, 8.6, 6.5], rot: [0, 0, 34], id: 'acc-sash', hide: true })] },
    // drip 2 (or): a chrome disco ball on a gold chain
    { name: 'disco', parent: 'body', pivot: [0, 4.4, 6.0], cubes: [
      P([-2.6, 4.6, 5.8], [5.2, 0.35, 0.35], '#ffd23e'), P([-1.0, 1.9, 5.7], [2.0, 2.0, 2.0], discoP), P([-0.15, 3.9, 6.55], [0.3, 0.7, 0.3], '#ffd23e'),
    ].map((c) => ({ ...c, id: 'acc-disco', hide: true })) },
    // drip 3: a honeycomb crown between the electrodes
    { name: 'crown', parent: 'body', pivot: [0, 15.4, -0.4], cubes: [
      P([-1.8, 15.2, -2.2], [3.6, 1.2, 3.6], honeyP), P([-1.8, 16.4, 1.45], [3.6, 1.6, 0], crownPts, { plane: 'z' }), P([-1.8, 16.4, -2.25], [3.6, 1.6, 0], crownPts, { plane: 'z' }),
      P([-0.4, 16.8, 1.3], [0.8, 0.8, 0.4], '#ffffff', { glow: true }),
    ].map((c) => ({ ...c, id: 'acc-crown', hide: true })) },
    // drip 3 (or): a white cowboy hat slung on its back by the cord
    { name: 'hat', parent: 'body', pivot: [0, 13.2, -6.6], rot: [-12, 0, 10], cubes: [
      P([-4.6, 5.8, -7.6], [9.2, 7.0, 0.5], hatP), P([-2.5, 6.8, -10.4], [5.0, 4.8, 2.8], hatP), P([-2.55, 6.8, -8.0], [5.1, 4.8, 0.5], '#3a2a1e'),
      P([-5.3, 5.8, -7.4], [0.8, 7.0, 1.4], hatP), P([4.5, 5.8, -7.4], [0.8, 7.0, 1.4], hatP),
      P([-0.2, 12.6, -7.4], [0.4, 2.4, 0.4], '#3a2a1e', { pivot: [0, 12.8, -7.2], rot: [30, 0, 0] }),
    ].map((c) => ({ ...c, id: 'acc-hat', hide: true })) },
  ],
};
// appearance tiers: normal wears one of the first list, dripped adds one of the second, ultra dripped one of the third
def.drip = [
  [{ id: 'acc-clip', name: 'Bee hair-clip' }, { id: 'acc-ring', name: 'Diamond ring' }],
  [{ id: 'acc-sash', name: 'Rodeo-queen sash' }, { id: 'acc-disco', name: 'Disco-ball chain' }],
  [{ id: 'acc-crown', name: 'Honeycomb crown' }, { id: 'acc-hat', name: 'White cowboy hat' }],
];
// gear anchors (model units): the lemon is its own head, so everything rides the body bone
def.attach = {
  head: { bone: 'body', at: [0, 15.5, -0.6], size: 8.8 },
  face: { bone: 'body', at: [0, 10.3, 6.35], size: 10.8 },
  neck: { bone: 'body', at: [0, 4.4, 5.6], size: 6.0 },
  back: { bone: 'body', at: [0, 8.8, -6.3], size: 10.8 },
};

// ---------------------------------------------------------------- effects of its own
// electric lemon juice: a yellow droplet with a white glint
defineFx('lemmojuice', {
  w: 5, h: 7, paint: (p, w, h) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = y / (h - 1), half = (v < 0.45 ? (v / 0.45) * 0.8 : Math.sqrt(Math.max(0, 1 - ((v - 0.6) / 0.4) ** 2))) * (w / 2), d = Math.abs(x - (w - 1) / 2);
      if (d > half) continue;
      p.px(x, y, d > half - 1 || v > 0.9 ? '#e0a01a' : x < w / 2 - 0.5 && v > 0.45 && v < 0.75 ? '#ffffff' : '#ffec50');
    }
  },
  life: [0.45, 0.8], size: [0.07, 0.06], speed: [1.2, 2.4], grav: 8, drag: 0.4, spread: 0.45,
});

// ---------------------------------------------------------------- animation
const TIPS = [[T0[0], T0[1] + 0.4, T0[2]], [T1[0], T1[1] + 0.4, T1[2]]];
const MID = [(T0[0] + T1[0]) / 2, (T0[1] + T1[1]) / 2 + 0.8, T0[2]];
const MOUTH = [0, 6.3, 7.0];
// keep the feet on the ground while the lemon rises or sinks by dy units (they stretch / squash)
function feet(P, dy, lift = [0, 0]) {
  ['footR', 'footL'].forEach((s, k) => { const l = lift[k]; P.pos(s, 0, l, 0).scl(s, 1, Math.max(0.35, (2.8 + dy - l) / 2.8), 1); });
}
// the arc: 3 crackling frames, now and then a blackout; k < 1 sputters, k ≥ 1.5 is the big arc
function crackle(P, t, k = 1) {
  const f = Math.floor(t * 15);
  if (k <= 0 || (k < 1 && hsh(f * 0.37) > k) || (k < 1.5 && hsh(f + 0.5) < 0.08)) return P.face('arc', 'off');
  return P.face('arc', (k >= 1.5 ? 'big' : '') + ABC[f % 3]);
}
// lean both electrodes outward by a degrees (in when negative) and re-aim the arc onto the new tips
function splay(P, a) {
  if (!a) return P;
  const c1 = tipOf(CU, a), z1 = tipOf(ZN, -a);
  P.rot('copper', 0, 0, a).rot('zinc', 0, 0, -a);
  const ang = Math.atan2(z1[1] - c1[1], z1[0] - c1[0]) / D2R;
  return P.pos('arc', c1[0] - T0[0], c1[1] - T0[1], 0).rot('arc', 0, 0, ang - ARC_ANG).scl('arc', Math.hypot(z1[0] - c1[0], z1[1] - c1[1]) / ARC_LEN, 1, 1);
}
// roll back onto its round back by a degrees (faint / down), turning about the lemon's long axis;
// the centre glides from its standing height down to resting on its back, a little behind
function rollBack(P, a, A = 72) {
  const r = -a * D2R, cy = O[1], rest = 6.6, s = Math.min(1, a / A);
  return P.rot('root', -a, 0, 0).pos('root', 0, rest + (cy - rest) * (1 - s) - cy * Math.cos(r), -cy * Math.sin(r) - 1.2 * s);
}
const ears = (P, a) => P.rot('leafR', 0, 0, a).rot('leafL', 0, 0, -a);   // + droops the leaves, − lifts them
// aim the bat by its absolute XYZ angles [x, z] (degrees): [0, 0] straight up, [90, c] level and
// pointing round the compass (c = 0 forward, +90 to its right, −90 to its left); k blends from the rest pose
const batAim = (P, x, z, k = 1) => P.rot('bat', (x - BAT_REST[0]) * k, 0, (z - BAT_REST[2]) * k);
// the hive: bees on (k > 0), circling at speed rev (turns per second), drifting up by lift units
const hive = (P, t, rev = 0.7, lift = 0) => P.face('bees', 'on').rot('bees', 0, t * 360 * rev, 0).pos('bees', 0, wave(t, 1.3) * 0.7 + lift, 0);

export const anim = {
  start: 'idle', seed: 5,
  breathe: { bone: 'body', amp: 0.018, per: 2.2 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.4, 5], dur: 0.12 },
  look: { bone: 'body', yaw: 16, pitch: 7, speed: 4 },
  springs: [
    { bone: 'rig', tip: [0, 6, 0], k: 170, d: 8, gain: 0.8, max: 14, axes: [1, 0.3, 1] },
    { bone: 'leafR', tip: [0, 8.3, 0], k: 120, d: 7, gain: 1.1, max: 32 },
    { bone: 'leafL', tip: [0, 8.3, 0], k: 125, d: 7, gain: 1.1, max: 32 },
    { bone: 'sprig', tip: [0, 2, 0], k: 260, d: 12, gain: 0.5, max: 12 },
    { bone: 'armR', tip: [-1.6, 0, 0], k: 230, d: 11, gain: 0.5, max: 9 },
    { bone: 'armL', tip: [1.6, 0, 0], k: 230, d: 11, gain: 0.6, max: 12 },
    { bone: 'clip', tip: [0, 1.5, 0], k: 260, d: 10, gain: 0.6, max: 14 },
    { bone: 'lockR', tip: [0, -9, 1], k: 120, d: 6, gain: 0.9, max: 18, axes: [1, 0.3, 1] },
    { bone: 'lockL', tip: [0, -9, 1], k: 125, d: 6, gain: 0.9, max: 18, axes: [1, 0.3, 1] },
  ],
  faces: {
    eyes: EYES.slot,
    mouth: { default: 'pout', states: { pout: ['m-lips'], open: ['m-open'], grit: ['m-grit'], smile: ['m-smile'], frown: ['m-frown'], o: ['m-o'] } },
    arc: { default: 'a', states: Object.fromEntries([...ABC.map((f) => [f, ['arc-' + f]]), ...ABC.map((f) => ['big' + f, ['arc-big' + f]]), ['off', []]]) },
    bees: { default: 'off', states: { off: [], on: ['bee'] } },
  },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'zap', 'pucker', 'buzz'] },
  clips: {
    // grumpy bouncing: two springy bobs on planted feet, a slow sour rock; the bat taps its shoulder
    // in time with an impatient foot, the other hand on its hip
    idle: { len: 1.6, loop: true, f(P, t) {
      const b = bounce(t, 0.8, { squash: 0.1, stretch: 0.045 }), big = t < 0.8 ? 1 : 0.65, dy = b.u * 1.15 * big;
      P.pos('body', 0, dy, 0).sq('body', b.sq * big).rot('body', 0, 0, wave(t, 1 / 1.6) * 3.2);
      const tap = bump(t, 0.98, 1.12) + bump(t, 1.16, 1.3);
      feet(P, dy); P.rot('footR', -24 * tap, 0, 0);
      P.rot('bat', 0, 0, -12 * tap + b.u * 3).rot('armR', 0, 0, -6 * tap);
      P.rot('armL', 0, -20, 24);
      const pk = Math.max(0, -b.sq) * 8;
      P.scl('mouth', 1 + 0.12 * pk, 1 - 0.08 * pk, 1 + 0.35 * pk);
      P.rot('rig', 0, 0, wave(t, 1 / 1.6, 0.8) * 2.5);
      ears(P, -b.u * 6 * big);
      crackle(P, t);
      // eyes: sharp little side-eye darts, a sour smug lid now and then, a squashy blink on each landing
      const [gx, gy] = glance(t, [[0, 0], [0.4, 0], [0.4, 0], [-0.3, 0.1], [0, 0]], 0.4);
      eyesAt(P, gx, gy).face('eyes', t > 0.95 && t < 1.35 ? 'smug' : undefined); eyesScale(P, 1 - 0.3 * b.sq, 1 + 0.6 * b.sq);
    } },
    // a strut: rolling over each step, the bat riding its shoulder, the free hand swinging
    walk: { len: 0.64, loop: true, f(P, t) {
      const ph = (t / 0.64) * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph), dy = Math.abs(c) * 1.1;
      const lr = Math.max(0, s) * 1.9, ll = Math.max(0, -s) * 1.9;
      P.pos('body', 0, dy, 0).rot('body', 6, s * 5, s * 8).sq('body', -0.07 * (1 - Math.abs(c)) + 0.03 * Math.abs(c));
      feet(P, dy, [lr, ll]); P.pos('footR', 0, 0, s * 1.8).pos('footL', 0, 0, -s * 1.8).rot('footR', -14 * Math.max(0, s), 0, 0).rot('footL', -14 * Math.max(0, -s), 0, 0);
      P.rot('armL', -s * 28, 0, 10).rot('bat', s * 5, 0, -Math.abs(c) * 6);
      P.rot('rig', 0, 0, -s * 4); ears(P, -Math.abs(c) * 8);
      crackle(P, t); P.face('eyes', 'smug'); eyesScale(P, 1, 1 - 0.08 * (1 - Math.abs(c)));
    } },
    // battle cry: crouch, spring up with the bat thrust at the sky, electrodes flung wide, the arc roaring; land and shout
    cry: { len: 1.9, next: 'idle', f(P, t) {
      const h = t < 1.0 ? hop(t, 1.0, 5.5, { crouch: 1.6, air: [0.32, 0.72] }) : { y: 0, sq: wob(t, 1.0, -0.1, 3, 6) };
      const up = seg(t, 0.3, 0.45, E.back) * (1 - seg(t, 1.45, 1.8, E.inout)), shout = seg(t, 0.95, 1.05) * (1 - seg(t, 1.5, 1.7));
      if (h.y > 0) P.pos('root', 0, h.y, 0); else { P.pos('body', 0, h.y, 0); feet(P, h.y); }
      P.sq('body', h.sq).rot('body', -8 * up + wave(t, 11) * 3 * shout, 0, wave(t, 9) * 5 * shout);
      batAim(P, -8, 10, up).pos('armR', 0, 3 * up, 0).rot('armL', 0, 0, 50 * up);
      splay(P, 24 * up + wob(t, 0.45, 6, 4, 5));
      ears(P, -28 * up);
      crackle(P, t, up > 0.3 ? 2 : 1);
      P.face('eyes', t < 0.3 ? 'angry' : up > 0.3 ? (shout > 0.3 ? 'shut' : 'angry') : t > 1.6 ? 'smug' : undefined).face('mouth', up > 0.3 && t < 1.6 ? 'open' : t < 0.3 ? 'frown' : undefined);
      eyesScale(P, 1 + 0.12 * up, 1 - 0.2 * shout + 0.1 * up); P.burst(0.46, 'anger', 'body', [5.6, 16, 5], {});
      P.burst(0.45, 'bolt', 'rig', MID, { n: 4, speed: 4 }).burst(0.45, 'spark', 'bat', BAT_TIP, { scale: 1.3 }).burst(0.47, 'spark', 'rig', TIPS[1], {});
      P.burst(0.72, 'dust', 'root', [0, 0.5, 0], { n: 5, dir: [0, 0.2, 1], spread: 1, speed: 0.7, scale: 0.6 });
      if (t > 0.5 && t < 1.5) P.stream('spark', 'rig', TIPS[(Math.floor(t * 9)) % 2], { rate: 10 }).stream('bolt', 'bat', BAT_TIP, { rate: 8, speed: 3 });
    } },
    // attack: 'Hold Up' — wind the bat back behind its shoulder, then a full swing through the target;
    // window glass bursts on contact, juice and sparks with it
    attack: { len: 1.15, next: 'idle', f(P, t) {
      const K = key([[0, [-16, 46]], [0.3, [62, 140]], [0.36, [74, 128]], [0.44, [90, -20], 'out'], [0.52, [86, -105]], [0.78, [70, -95]], [1.05, [-16, 46]]], t);
      batAim(P, K[0], K[1]);
      const wind = seg(t, 0, 0.3, E.out) * (1 - seg(t, 0.34, 0.42, E.in)), fol = seg(t, 0.38, 0.5, E.out) * (1 - seg(t, 0.7, 1.05, E.inout));
      P.rot('body', -6 * wind + 8 * fol, 34 * wind - 38 * fol + wob(t, 0.5, -6, 3, 6), 4 * wind);
      P.pos('root', 0, 0.8 * bump(t, 0.34, 0.54), -1.5 * wind + 4.5 * fol).pos('armR', 0, 1.6 * wind + 2.4 * fol, 2.2 * fol);
      P.sq('body', -0.1 * wind + 0.06 * fol * (1 - seg(t, 0.46, 0.56)) + wob(t, 0.5, -0.07, 4, 7));
      feet(P, -0.8 * wind);
      P.rot('armL', 0, 0, 30 * wind - 20 * fol); ears(P, 10 * wind - 22 * fol);
      crackle(P, t, fol > 0.5 ? 2 : 1);
      P.face('eyes', t < 0.44 ? 'angry' : t < 0.72 ? 'shut' : 'smug').face('mouth', t > 0.2 && t < 0.44 ? 'grit' : t < 0.72 ? 'open' : 'smile');
      eyesScale(P, 1 + 0.15 * fol, 1 - 0.15 * wind - 0.3 * bump(t, 0.42, 0.6)); eyesAt(P, -0.3 * wind + 0.3 * fol, 0);
      P.burst(0.44, 'shard', 'bat', BAT_TIP, { n: 14, speed: 1.3, spread: 1 }).burst(0.44, 'spark', 'bat', BAT_TIP, { scale: 1.5 }).burst(0.45, 'star', 'bat', BAT_TIP, { n: 4 }).burst(0.46, 'lemmojuice', 'bat', BAT_TIP, { n: 5, speed: 1.2 });
    } },
    // special (Volto): it raises the bat like a lightning rod until the arc roars, then levels it and
    // fires a crackling volley of lightning down the bat at the target
    special: { len: 2.0, next: 'idle', f(P, t) {
      const charge = seg(t, 0.05, 0.75, E.inout) * (1 - seg(t, 0.82, 0.9)), fire = seg(t, 0.82, 0.92, E.out) * (1 - seg(t, 1.3, 1.7, E.inout));
      const shake = charge * (0.4 + 0.6 * seg(t, 0.4, 0.8));
      P.pos('body', 0, -1.2 * charge + 0.8 * fire, -1.5 * fire).sq('body', -0.14 * charge + 0.1 * fire * (1 - seg(t, 0.92, 1.05)) + wob(t, 1.0, -0.06, 4, 6));
      feet(P, -1.2 * charge + 0.8 * fire);
      P.rot('body', -6 * charge - 8 * fire + wave(t, 17) * 2.2 * shake, wave(t, 13, 1) * 2 * shake, wave(t, 19, 2) * 2.4 * shake);
      const aim = seg(t, 0.78, 0.86, E.out) * (1 - seg(t, 1.35, 1.75, E.inout));
      batAim(P, -6 + 96 * aim + wave(t, 19) * 2 * shake, 8 - 8 * aim, Math.max(charge, aim)).pos('armR', 0, 3.2 * charge + 1.2 * aim, 2 * aim);
      splay(P, 26 * charge + 18 * fire + wave(t, 21) * 3 * shake + wob(t, 0.9, 8, 5, 5));
      ears(P, -40 * charge - 20 * fire); P.rot('armL', 0, 0, 40 * charge);
      crackle(P, t, charge > 0.2 || fire > 0.1 ? 2 : 1);
      P.face('eyes', charge > 0.15 ? (charge > 0.8 ? 'glint' : 'angry') : fire > 0.2 ? 'shut' : t > 1.6 ? 'smug' : undefined).face('mouth', charge > 0.4 ? 'grit' : fire > 0.2 ? 'open' : undefined);
      eyesScale(P, 1 + 0.06 * wave(t, 19) * shake, 1 + 0.06 * wave(t, 17) * shake - 0.3 * fire); eyesAt(P, 0, 0.3 * charge);
      if (charge > 0.2) P.stream('spark', 'bat', BAT_TIP, { rate: 16 * charge }).stream('bolt', 'rig', MID, { rate: 10 * charge, speed: 2 }).stream('bolt', 'bat', BAT_TIP, { rate: 8 * charge, speed: 2 });
      P.burst(0.86, 'ring', 'bat', BAT_TIP, { scale: 1.4 }).burst(0.86, 'spark', 'rig', MID, { scale: 1.8 }).burst(0.86, 'bolt', 'rig', MID, { n: 12, speed: 7, spread: 1 });
      if (t > 0.86 && t < 1.3) P.stream('bolt', 'bat', BAT_TIP, { rate: 60, dir: [0, 1, 0], speed: 11, spread: 0.22 }).stream('spark', 'bat', BAT_TIP, { rate: 14, dir: [0, 1, 0], speed: 5, spread: 0.3 });
      if (t > 1.2 && t < 1.8) P.stream('smoke', 'bat', BAT_TIP, { rate: 4, scale: 0.5 }).stream('smoke', 'rig', TIPS[1], { rate: 4, scale: 0.5, key: 'z' });
    } },
    // squeezed flat, a squirt of juice flies out, pops back sour
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.06, E.out) * (1 - seg(t, 0.14, 0.5, E.inout));
      P.pos('root', 0, 0, -2.2 * k).sq('body', -0.3 * k + wob(t, 0.16, 0.1, 3.5, 6)).rot('body', -10 * k + wob(t, 0.16, 5, 3, 6), 0, wave(t, 15) * 3 * k);
      feet(P, -1.4 * k);
      P.rot('bat', 0, 0, 24 * k + wob(t, 0.16, -8, 3, 5)).rot('armL', 0, 0, 40 * k);
      splay(P, 18 * k); ears(P, -30 * k);
      crackle(P, t, t < 0.3 ? 0.5 : 1);
      P.face('eyes', t < 0.08 ? 'shock' : t < 0.42 ? 'shut' : t < 0.62 ? 'teary' : undefined).face('mouth', t < 0.42 ? 'open' : t < 0.62 ? 'frown' : undefined);
      eyesScale(P, 1 + 0.3 * bump(t, 0, 0.1) + 0.25 * k, 1 + 0.35 * bump(t, 0, 0.1) - 0.45 * k);
      P.burst(0.05, 'sweat', 'body', [-6, 14, 5], { n: 2, dir: [-1, 1, 0.3] }).burst(0.45, 'tear', 'body', [-2.9, 8.2, 6.8], { n: 1, dir: [-0.3, -1, 0.5] });
      P.burst(0.03, 'lemmojuice', 'body', MOUTH, { n: 6, dir: [0, 0.8, 0.6], speed: 1.2 }).burst(0.03, 'spark', 'body', [0, 9, 6.5], {}).burst(0.05, 'bolt', 'rig', MID, { n: 3, speed: 3 });
    } },
    // the arc sputters out, it wobbles, lets the bat drop, and rolls back onto its round back, feet in the air
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.85, 1.0)), fall = seg(t, 0.9, 1.4, E.bounce), drop = seg(t, 0.5, 0.9, E.in);
      P.rot('body', 0, wave(t, 1.5) * 16 * dizzy, wave(t, 2.1) * 10 * dizzy);
      rollBack(P, 72 * fall);
      batAim(P, 50, 120, drop).rot('armR', 0, 0, 20 * drop).rot('armL', 0, 0, -30 * fall);
      P.rot('footR', -40 * fall + wob(t, 1.4, 12, 3, 4), 0, -18 * fall).rot('footL', -30 * fall + wob(t, 1.45, -10, 3, 4), 0, 16 * fall);
      splay(P, -10 * fall); ears(P, 30 * fall);
      crackle(P, t, t < 0.9 ? 0.7 - t * 0.6 : 0);
      P.face('eyes', t < 0.25 ? 'shock' : t < 0.9 ? 'swirl' : t < 1.4 ? 'wide' : 'x').face('mouth', t > 0.25 ? 'open' : 'o'); P.blinkOK = false; P.lookW = 0;
      eyesScale(P, 1 + 0.3 * bump(t, 0, 0.25) + 0.2 * bump(t, 0.9, 1.4), 1 + 0.35 * bump(t, 0, 0.25) + 0.25 * bump(t, 0.9, 1.4)); eyesAt(P, 0.3 * wave(t, 2.1) * dizzy, 0);
      P.burst(0.2, 'spark', 'rig', TIPS[0], {}).burst(0.5, 'spark', 'rig', TIPS[1], {}).burst(0.75, 'bolt', 'rig', MID, { n: 2 });
      P.burst(1.4, 'smoke', 'rig', MID, { n: 6, spread: 1 }).burst(1.0, 'star', 'body', [0, 16, 0], { n: 5 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      rollBack(P, 72 + wave(t, 1 / 2.4) * 3);                 // rocking gently on its round back
      batAim(P, 50, 120).rot('armR', 0, 0, 20).rot('armL', 0, 0, -30);
      P.rot('footR', -40 + bump(t, 1.2, 1.36) * -14, 0, -18).rot('footL', -30, 0, 16);
      splay(P, -10); ears(P, 30);
      P.face('arc', t > 1.9 && t < 1.97 ? 'a' : 'off');
      P.face('eyes', 'swirl').face('mouth', 'open'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.4; eyesScale(P, 1 + 0.06 * wave(t, 0.8), 1 - 0.06 * wave(t, 0.8));
      P.stream('smoke', 'rig', MID, { rate: 1.4, scale: 0.6 });
    } },
    // victory: a hop with a full spin and a ring of sparks; then it twirls the bat like a baton while
    // its hive circles, and settles it back on its shoulder, smug and sour
    win: { len: 2.4, next: 'idle', f(P, t) {
      const h = t < 0.9 ? hop(t, 0.9, 6, { crouch: 1.4 }) : { y: wob(t, 0.9, -1.0, 3, 6), sq: wob(t, 0.9, -0.14, 3, 6) };
      if (h.y > 0) P.pos('root', 0, h.y, 0); else { P.pos('body', 0, h.y, 0); feet(P, h.y); }
      P.sq('body', h.sq).rot('root', 0, (360 * seg(t, 0.22, 0.66, E.inout)) % 360, 0);      // % 360: ends at 0 so the fade back to idle doesn't unwind it
      const flare = seg(t, 0.2, 0.32) * (1 - seg(t, 1.0, 1.3));
      splay(P, 20 * flare + wob(t, 0.9, 8, 4, 5)); ears(P, -30 * flare);
      crackle(P, t, flare > 0.3 ? 2 : 1);
      const tw = seg(t, 1.0, 1.15, E.out) * (1 - seg(t, 1.9, 2.15, E.inout));
      batAim(P, 90, 46 - 720 * seg(t, 1.05, 1.9, E.inout), tw).pos('armR', 0, 2 * tw, 1.4 * tw);
      const smug = seg(t, 1.0, 1.15);
      P.face('eyes', t < 0.22 ? 'angry' : t < 0.66 ? 'star' : t < 0.9 ? 'happy' : t < 1.35 ? 'glint' : t > 2.0 && t < 2.2 ? 'wink' : 'smug').face('mouth', t < 1.35 ? 'smile' : undefined);
      eyesScale(P, 1 + 0.2 * bump(t, 0.22, 0.66), 1 + 0.2 * bump(t, 0.22, 0.66) + 0.5 * Math.min(0, h.sq));
      P.rot('body', -6 * smug + wave(t, 2.2) * 3 * smug, 0, 0).rot('armL', 0, -20 * smug, 24 * smug);
      P.scl('mouth', 1 + 0.2 * smug, 1, 1 + 0.6 * smug);
      if (t > 0.9) hive(P, t, 0.8, 1.5 - 1.5 * seg(t, 0.9, 1.4, E.out));
      P.burst(0.9, 'ring', 'root', [0, 1, 0], {}).burst(0.9, 'spark', 'rig', MID, { scale: 1.5 }).burst(0.92, 'bolt', 'rig', MID, { n: 6, speed: 4 }).burst(0.9, 'dust', 'root', [0, 0.5, 0], { n: 5, spread: 1, speed: 0.8, scale: 0.6 });
    } },
    // asleep: sunk onto squashed feet, the bat hugged close, ears drooped, the arc out but for a stray spark, Zzz
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * Math.PI * 2), dy = -0.9 + br * 0.25;
      P.pos('body', 0, dy, 0).sq('body', -0.05 + br * 0.035).rot('body', 4, 0, 2); feet(P, dy);
      batAim(P, -10, 24).rot('armL', 0, 0, -10);
      splay(P, -6); ears(P, 34 + br * 3); P.rot('rig', 6, 0, 0);
      P.scl('mouth', 0.85 + Math.max(0, br) * 0.2, 0.9, 0.7);
      P.face('arc', t > 2.2 && t < 2.27 ? 'a' : 'off');
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0; eyesScale(P, 1, 0.88 + 0.12 * br);
      P.burst(0.5, 'z', 'body', [4, 16, 3], {}).burst(1.7, 'z', 'body', [4, 16, 3], {}).burst(2.24, 'spark', 'rig', MID, { scale: 0.4 });
    } },
    // dance: the hand-flip routine — the bat parked on its shoulder, hip pops left-right on the beat, the free hand
    // flipping and waving to show off the ring, a stomp-turn, and a finish with the hand held high, sparkles
    dance: { len: 3.2, next: 'idle', f(P, t) {
      const beat = (t / 0.4) % 1, n = Math.floor(t / 0.4), hit = Math.exp(-beat * 8), side = n % 2 ? 1 : -1;
      const on = seg(t, 0, 0.2) * (1 - seg(t, 2.9, 3.2)), turn = seg(t, 1.6, 2.0, E.inout), fin = seg(t, 2.4, 2.55, E.back) * (1 - seg(t, 2.95, 3.2));
      P.pos('body', side * 0.9 * on * (1 - fin), 0.6 * hit * on, 0).sq('body', -0.08 * hit * on).rot('body', 0, side * 10 * on * (1 - fin) + 360 * turn, side * 9 * on * (1 - fin));
      feet(P, 0, [side < 0 ? 1.2 * hit * on : 0, side > 0 ? 1.2 * hit * on : 0]);
      const flip = Math.sin(t * Math.PI * 5);
      P.rot('armL', -50 * on - 70 * fin, 40 * flip * on * (1 - fin), 30 * on + 40 * fin).pos('armL', 0, 2.4 * on + 2 * fin, 1.2 * on);
      P.rot('bat', 0, 0, 6 * hit * on); ears(P, -10 * hit * on - 20 * fin); splay(P, 8 * hit * on + 14 * fin);
      crackle(P, t, fin > 0.3 ? 2 : 1);
      P.face('eyes', fin > 0.3 ? 'glint' : beat < 0.35 ? 'smug' : 'happy').face('mouth', fin > 0.3 ? 'smile' : beat < 0.3 ? 'o' : 'smile'); P.blinkOK = false;
      eyesScale(P, 1 + 0.1 * hit * on, 1 - 0.2 * hit * on + 0.1 * fin);
      for (let k = 0; k < 6; k++) P.burst(0.2 + k * 0.4, 'note', 'body', [k % 2 ? 7 : -7, 16, 3], { n: 1, dir: [k % 2 ? 0.5 : -0.5, 1, 0.3], speed: 1 });
      P.burst(2.45, 'sparkle', 'armL', [6.6, 7, 5], { n: 10, speed: 1.4 }).burst(2.45, 'sparkle', 'body', [0, 16, 4], { n: 6, speed: 1 });
      if (fin > 0.3) hive(P, t, 1.2, 1);
    } },
    // fidget: the sour hits — a full-body shudder, face squeezed, the pout squirts a drop of juice
    pucker: { len: 1.5, next: 'idle', f(P, t) {
      const k = seg(t, 0.08, 0.3, E.out) * (1 - seg(t, 0.95, 1.3, E.inout)), shiv = bump(t, 0.25, 1.0);
      P.sq('body', -0.08 * k + wave(t, 14) * 0.03 * shiv).rot('body', wave(t, 13) * 2.5 * shiv, 0, wave(t, 17, 1) * 3 * shiv);
      feet(P, -0.5 * k);
      P.scl('mouth', 1 - 0.25 * k, 1 - 0.1 * k, 1 + 1.1 * k);
      P.rot('bat', 0, 0, wave(t, 13) * 4 * shiv).rot('armL', 0, 0, 30 * k);
      ears(P, -24 * k); splay(P, -6 * k + wave(t, 15) * 3 * shiv);
      crackle(P, t);
      P.face('eyes', k > 0.4 ? 'shut' : t > 1.1 ? 'smug' : undefined).face('mouth', t > 1.1 ? 'frown' : undefined); P.blinkOK = k < 0.1;
      eyesScale(P, 1 + 0.1 * k, 1 - 0.35 * k + 0.05 * wave(t, 14) * shiv);
      P.burst(0.62, 'lemmojuice', 'mouth', MOUTH, { n: 2, dir: [0, 0.6, 1], speed: 0.9 });
    } },
    // fidget: the arc fizzles, it peers up at its electrodes… and gets zapped for its trouble
    zap: { len: 1.9, next: 'idle', f(P, t) {
      const peer = seg(t, 0.1, 0.4, E.inout) * (1 - seg(t, 0.8, 0.9)), jolt = seg(t, 0.84, 0.9, E.out) * (1 - seg(t, 1.0, 1.5, E.inout));
      P.rot('body', -10 * peer + wob(t, 0.86, -8, 4, 5), 0, 0);
      P.pos('root', 0, 2.6 * bump(t, 0.84, 1.08), 0).sq('body', 0.1 * jolt * (1 - seg(t, 0.95, 1.05)) + wob(t, 1.08, -0.1, 3.5, 6));
      P.rot('bat', 0, 0, -20 * jolt).rot('armL', 0, 0, 60 * jolt);
      splay(P, -8 * peer + 30 * jolt); ears(P, -50 * jolt);
      crackle(P, t, t < 0.8 ? (t < 0.3 ? 1 : 0.35) : jolt > 0.2 ? 2 : 1);
      P.face('eyes', jolt > 0.2 ? 'shock' : peer > 0.4 ? 'angry' : t > 1.5 ? 'sad' : undefined).face('mouth', jolt > 0.2 ? 'open' : peer > 0.4 ? 'o' : t > 1.5 ? 'frown' : undefined); P.blinkOK = jolt < 0.1;
      eyesAt(P, 0, 0.45 * peer); eyesScale(P, 1 + 0.4 * jolt, 1 + 0.5 * jolt);
      P.burst(0.9, 'sweat', 'body', [6, 15, 5], { n: 2, dir: [1, 1, 0.3] }).burst(1.5, 'anger', 'body', [-6, 16, 5], {});
      P.burst(0.85, 'spark', 'rig', MID, { scale: 1.3 }).burst(0.85, 'bolt', 'rig', MID, { n: 4, speed: 3 }).burst(1.1, 'smoke', 'rig', MID, { n: 3, scale: 0.5 });
    } },
    // fidget: its hive drops by — the bees circle, it follows them round with a sour squint and shoos
    // them off with a lazy wave of the bat
    buzz: { len: 2.6, next: 'idle', f(P, t) {
      const inn = seg(t, 0, 0.5, E.out), out = seg(t, 1.9, 2.5, E.in);
      hive(P, t, 0.75, 5 * (1 - inn) + 7 * out);
      if (t > 2.45) P.face('bees', 'off');
      const ang = ((t * 0.75 * 360) % 360) * D2R;
      P.rot('body', 0, Math.sin(ang) * 10 * (1 - out), Math.cos(ang) * 3);
      const shoo = bump(t, 1.6, 2.1);
      P.rot('bat', 0, 0, -40 * shoo + wave(t, 6) * 10 * shoo).pos('armR', 0, 1.2 * shoo, 0);
      P.face('eyes', t > 0.4 && t < 1.6 ? 'smug' : shoo > 0.3 ? 'angry' : undefined);
      eyesAt(P, Math.sin(ang) * 0.45 * (1 - out), 0.15);
      ears(P, wave(t, 2) * 6);
      crackle(P, t);
    } },
  },
};
def.anim = anim;

// the ultra-drip form: the eyes keep their own colours, and pale creams that blackGold would lacquer black turn
// champagne gold instead, so the face stays readable in black and gold
const _lum = (c) => { const n = parseInt(c.slice(1, 7), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (Math.max(r, g, b) + Math.min(r, g, b)) / 510; };
def.dripForm = { map: keepEyes(EYES, (c, glow) => { const v = blackGold(c, glow); return !glow && typeof c === 'string' && c[0] === '#' && _lum(c) > 0.8 && _lum(v) < 0.35 ? '#f2dca0' : v; }) };
