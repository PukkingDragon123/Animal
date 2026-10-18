// Kappachi — a pot-bellied kappa (Hydro) who moved into the Japanese Tea Garden in Golden Gate
// Park. A big round teal head with a shallow ceramic dish of water set into its crown (it sloshes,
// and spills when it moves fast), a fringe of reed hair round the dish, a short duck bill with a
// cheeky grin, a turtle shell on its back paved like the garden's stepping stones in moss, webbed
// hands and feet, and a cucumber it carries like a club.
//
// Music homage (California surf rock, original): its one signature item is a little longboard painted
// in early-60s surf-shirt stripes, which it leans on (and waxes with its cucumber); dish water that
// rolls like a wave, sunny humming harmonies in its idle and a hang-ten in its victory.
//
// Build notes: the dish water is its own bone on a soft spring, so it tilts and sloshes by itself
// whenever the head moves; the wave frames roll a foam crest across it. The board stands on the
// ground (a root child), so clips place it: leaned on, carried, ridden, slept on.
import { defineFx } from '../fx.js';
import { E, seg, bump, wob, wave, key, hop } from '../anim.js';
import { h2 } from './kit.js';

const D2R = Math.PI / 180, TAU = Math.PI * 2;
const C = {
  skin: ['#d2fbe2', '#9eecc4', '#6ad2a4', '#45a88c', '#2c7a70'],
  belly: ['#fffad2', '#ffec92', '#f8d468', '#e4b452'], bellyLine: '#e8be62', mask: ['#e4fff0', '#bdf4d6', '#94e2bc'],
  shirt: { c: '#f6eedc', b: '#6ab4e2', n: '#24386e', cLo: '#d8ccb4', bLo: '#4a8cc0', nLo: '#18264e' },
  shell: { rim: ['#8a9a4a', '#6a7a3a', '#4a5a2e'], stone: ['#cfc6b2', '#b6ac98', '#9c927e', '#d8d2c0', '#a8a08a'], moss: ['#6aa046', '#4a7e36'] },
  dish: ['#fbf4e2', '#e8dcc0', '#c4ae94'], glaze: '#3a5aa8',
  water: ['#e8fbff', '#9ae6ff', '#4cb8f0', '#2a7ad0', '#1f4ea0'],
  reed: ['#a8ecd0', '#5cc4a8', '#2e8c86', '#1c5a60'],
  bill: ['#fff2a0', '#ffcc4a', '#e8962e', '#b0602a'], nostril: '#6a3214',
  cuke: ['#c8f08a', '#7cc04a', '#4a9a3e', '#2a6a30', '#1a4a24'], bloom: '#ffe04a',
  board: { deck: '#fbf4e4', deckLo: '#e8dcc4', rail: '#d8c8a8', stripeA: '#ff7a5a', stripeB: '#2ab4b0', stringer: '#a8703e', bottom: '#2ab4b0', bottomLo: '#1e8a8a' },
  ink: '#102a28', lid: '#10201e',
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
const band = (cols, thr, l) => { for (let k = 0; k < thr.length; k++) if (l > thr[k]) return cols[k]; return cols[cols.length - 1]; };
const orb = (O, R, fn) => (p, w, h, face, c) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h);
    let nx = (q[0] - O[0]) / (R[0] * R[0]), ny = (q[1] - O[1]) / (R[1] * R[1]), nz = (q[2] - O[2]) / (R[2] * R[2]);
    const L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
    p.px(i, j, fn(nx * LIT[0] + ny * LIT[1] + nz * LIT[2], q, [nx, ny, nz], i, j, face));
  }
};
function stamp(p, rows, map, x0 = 0, y0 = 0) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = map[r[i]]; if (c) p.px(x0 + i, y0 + j, c); } }); }
const frac = (x) => ((x % 1) + 1) % 1;
// banded fill by a face's own height (limbs and small parts)
const bandFill = (cols) => (p, w, h, face) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let k = face === 'up' ? 0 : face === 'down' ? cols.length - 1 : 1 + Math.min(cols.length - 3, Math.floor((j / h) * (cols.length - 2)));
    if ((face === 'east' || face === 'west') && k > 0) k = Math.min(cols.length - 1, k + 1);
    p.px(i, j, cols[k]);
  }
};

// ---------------------------------------------------------------- skin, belly, shirt, shell
const HO = [0, 18.0, 0.4], HR = [7.0, 6.2, 6.6];
const SK = [C.skin[0], C.skin[1], C.skin[2], C.skin[3], C.skin[4]];
const headSkin = orb(HO, HR, (l) => band(SK, [0.95, 0.5, -0.15, -0.6], l));
// the face: skin with a cheeky grin curling up out of the bill into one cheek more than the other
const faceSkin = (p, w, h, f, c) => {
  headSkin(p, w, h, f, c);
  if (f !== 'south') return;
  // a paler mask round the eyes and bill
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, f, i, j, w, h), d = (q[0] / 4.3) ** 2 + ((q[1] - 17.6) / 3.6) ** 2;
    if (d < 1) p.px(i, j, d > 0.8 ? C.mask[2] : q[1] > 18.6 ? C.mask[0] : C.mask[1]);
  }
  const T = (x, y) => [Math.round((x - c.o[0]) * 3), Math.round((c.o[1] + c.s[1] - y) * 3)];
  // the cheeky grin: curling up out of the bill, high on its left, a short tuck on its right
  for (const [x, y] of [[2.3, 15.6], [2.6, 15.85], [2.9, 16.15], [3.1, 16.5], [3.2, 16.85], [-2.3, 15.6], [-2.6, 15.8]]) { const [a, b] = T(x, y); p.px(a, b, C.skin[4]); p.px(a, b + 1, C.skin[3]); }
};
const skinP = bandFill([C.skin[0], C.skin[1], C.skin[2], C.skin[3], C.skin[4]]);
// the plastron pot belly: soft cream-yellow, rounded light, three smiling scute seams across it
const BO = [0, 7.0, 0.6], BR3 = [4.6, 4.4, 4.6];
const bellyP = orb(BO, BR3, (l, q) => {
  const ax = Math.abs(q[0]), seam = Math.abs(q[1] - (7.4 + ax * ax * 0.07)) < 0.17;
  return seam && q[2] > 4.6 ? C.bellyLine : band(C.belly, [0.8, 0.15, -0.5], l);
});
// surf-shirt stripes (cream, sky, navy), painted down the board's deck
const STRIPE = 'cccbbnbb';
// the shell, paved like garden stepping stones set in moss (Voronoi stones on the back faces)
const STONES = []; for (let k = 0; k < 26; k++) STONES.push([(h2(k, 1, 9) - 0.5) * 11, 3.6 + h2(k, 2, 9) * 9, k]);
const shellP = (p, w, h, face, c) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h);
    if (face !== 'north') { p.px(i, j, face === 'up' ? C.shell.rim[0] : face === 'down' ? C.shell.rim[2] : j < h / 2 ? C.shell.rim[0] : C.shell.rim[1]); continue; }
    let d1 = 1e9, d2 = 1e9, k1 = 0;
    for (const [sx, sy, k] of STONES) { const d = Math.hypot(q[0] - sx, (q[1] - sy) * 1.15); if (d < d1) { d2 = d1; d1 = d; k1 = k; } else if (d < d2) d2 = d; }
    const gap = d2 - d1;
    let col = gap < 0.42 ? (gap < 0.2 ? C.shell.moss[1] : C.shell.moss[0]) : C.shell.stone[k1 % 5];
    if (gap >= 0.42 && gap < 0.75 && h2(i, j, 3) < 0.5) col = C.shell.stone[3];       // lit stone edges
    p.px(i, j, col);
  }
};
// the dish: pale glazed ceramic with an indigo line round the rim
const dishP = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? C.dish[0] : face === 'down' ? C.dish[2] : j === 1 ? C.glaze : j < h / 2 ? C.dish[0] : C.dish[1]); };
// the dish water (a y plane): a round pool; frames roll a foam crest across it like a breaking wave
const waterP = (f) => (p, w, h) => {
  const cx = (w - 1) / 2, cy = (h - 1) / 2, R = w / 2 - 0.4;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const r = Math.hypot(x - cx, y - cy); if (r > R) continue;
    if (f === 'empty') { p.px(x, y, r > R - 1 ? C.dish[2] : (x + y) % 7 === 0 ? C.water[1] : C.dish[1]); continue; }
    let col = r > R - 1 ? C.water[4] : r > R - 2.2 ? C.water[3] : C.water[2];
    if (typeof f === 'number') {                                     // a crest sweeping from back (top rows) to front
      const crest = -R + (f / 4) * 2 * R + Math.sin(x * 0.7) * 0.8, d = y - cy - crest;
      if (d > -0.6 && d < 0.6) col = C.water[0]; else if (d >= 0.6 && d < 2.2) col = C.water[1]; else if (d <= -0.6 && d > -1.8) col = C.water[3];
    } else if (frac((x * 0.37 + y * 0.61) / 3.1) < 0.1 && r < R - 2) col = C.water[1];
    p.px(x, y, col);
  }
  p.px(Math.round(cx - R * 0.45), Math.round(cy - R * 0.45), '#ffffff'); p.px(Math.round(cx - R * 0.45) + 1, Math.round(cy - R * 0.45), '#ffffff');
};
// reed hair: a hanging fringe of blades, ragged at the tips (a z or x plane; blades hang from the top row)
const reedP = (seed) => (p, w, h) => {
  for (let x = 0; x < w; x++) {
    const len = Math.round(h * (0.55 + 0.45 * h2(x >> 1, seed, 5))), bl = (x >> 1) % 2;
    for (let y = 0; y < len; y++) p.px(x, y, y >= len - 1 ? C.reed[3] : y < 2 ? C.reed[0] : bl ? C.reed[1] : C.reed[2]);
  }
};
// the bill: buttery yellow, two nostrils on top, a dark seam along the gape
const billP = (lower) => (p, w, h, face) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? C.bill[0] : face === 'down' ? C.bill[3] : j < h / 2 ? C.bill[1] : C.bill[2]);
  if (face === 'up' && !lower) { const m = Math.floor(w / 2); p.px(m - 2, h - 3, C.nostril); p.px(m + 2, h - 3, C.nostril); }
  if (!lower && (face === 'south' || face === 'east' || face === 'west')) for (let i = 0; i < w; i++) p.px(i, h - 1, C.nostril);
};
// a webbed hand or foot: skin with darker webbing lines between three toes on the top
const webP = (p, w, h, face) => {
  skinP(p, w, h, face);
  if (face === 'up') for (let j = 0; j < h; j++) for (const x of [Math.round(w / 4), Math.round(w / 2), Math.round((3 * w) / 4)]) if (j > h * 0.35) p.px(x, j, C.skin[3]);
  if (face === 'south') for (let i = 0; i < w; i++) if (i % 3 === 1) p.px(i, h - 1, C.skin[4]);
};
// the cucumber: bumpy green, pale stripes, a dried flower at the tip
const cukeP = (p, w, h, face) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let col = face === 'up' ? C.cuke[1] : face === 'down' ? C.cuke[4] : i === 0 ? C.cuke[1] : i === w - 1 ? C.cuke[3] : C.cuke[2];
    if (face !== 'up' && face !== 'down' && i === Math.floor(w / 2) && j % 5 < 3) col = C.cuke[1];
    if (face !== 'up' && face !== 'down' && h2(i, j, face.length) < 0.08) col = C.cuke[0];
    p.px(i, j, col);
  }
};
const flowerP = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? C.bloom : (i + j) % 2 ? C.bloom : '#e8b02a'); };
// the longboard: cream deck with a wooden stringer and two racing stripes near the nose; teal bottom
const BOARD_X = 7.4, BOARD_W = 3.8, BOARD_L = 12.6;
const boardP = (p, w, h, face, c) => {
  const B = C.board;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h);
    let col;
    if (face === 'east') {                       // the deck, striped like an early-60s surf shirt
      const k = STRIPE[((Math.floor((q[2] + 60) * 3) % STRIPE.length) + STRIPE.length) % STRIPE.length];
      col = k === 'c' ? (j > h - 2 ? B.deckLo : B.deck) : C.shirt[k];
      if (Math.abs(q[2] - 0.4) < 0.17) col = B.stringer;
      const y = q[1]; if (y > 9.3 && y < 9.7) col = B.stripeA;
    } else if (face === 'west') col = h2(i >> 1, j >> 2, 3) < 0.15 ? B.bottomLo : B.bottom;
    else col = face === 'up' ? B.rail : B.rail;
    p.px(i, j, col);
  }
};

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
// eyes: 10 × 11 texels (a third of the face), outer corner at x = 0
const EK = { line: '#06121c', dark: '#0e2232', acc: ['#1c6c94', '#5ccaee'] }, EW = 10, EH = 11;
const EYES = {
  chill: eyeOpen(EW, EH, EK),                            // open, bright and cheeky
  grin: eyeArc(EW, EH, EK, true),                        // ^ ^
  fierce: eyeOpen(EW, EH, EK, [0.3, 0.36]),
  wide: eyeOpen(EW, EH, EK),
  sad: eyeOpen(EW, EH, EK, [0.26, -0.3]),
  closed: eyeArc(EW, EH, EK, false),
  hurt: eyeHurt(EW, EH, EK),
  x: eyeX(EW, EH, EK),
  swirl: eyeSwirl(EW, EH, EK),
};

// ---------------------------------------------------------------- geometry
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const FZ = 7.03;      // the face plane (front of the head's face box)
const eyeStates = (side) => Object.entries(EYES).map(([k, fn]) => P(side < 0 ? [-4.0, 17.3, FZ] : [0.667, 17.3, FZ], [3.333, 3.667, 0], fn, { plane: 'z', mirror: side > 0, id: 'eye-' + k, hide: k !== 'chill' }));
// the head: a squashed voxel sphere of six boxes (distinct extents on every axis), the deep one a flat face
const HEAD = [[7.0, 2.6, 3.0], [2.8, 6.0, 3.2], [4.4, 3.6, 6.6], [6.0, 3.8, 4.6], [4.6, 5.2, 4.2], [5.2, 4.6, 5.8]];
const WATER = ['calm', 0, 1, 2, 3, 'empty'];
const ABCD = ['w0', 'w1', 'w2', 'w3'];
const fringe = (n, o, s, plane, piv, rot, seed) => ({ name: 'reed' + n, parent: 'head', pivot: piv, rot, cubes: [P(o, s, reedP(seed), { plane })] });
const toes = (x0) => [0, 1, 2].map((k) => P([x0 + k * 1.2, 0, 3.2], [1.0, 0.8, 1.0], webP));

export const def = {
  name: 'kappachi', ppu: 3, scale: 0.5, outline: { color: C.ink, px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    // webbed feet and short legs
    { name: 'footR', parent: 'root', pivot: [-2.8, 0, -1.4], cubes: [P([-4.6, 0, -1.4], [3.6, 1.2, 4.6], webP), ...toes(-4.5)] },
    { name: 'footL', parent: 'root', pivot: [2.8, 0, -1.4], cubes: [P([1.0, 0, -1.4], [3.6, 1.2, 4.6], webP), ...toes(1.1)] },
    { name: 'legR', parent: 'root', pivot: [-2.8, 4.0, 0], cubes: [P([-3.9, 0.8, -1.1], [2.2, 3.4, 2.2], skinP)] },
    { name: 'legL', parent: 'root', pivot: [2.8, 4.0, 0], cubes: [P([1.7, 0.8, -1.1], [2.2, 3.4, 2.2], skinP)] },
    // the pot belly, the stepping-stone shell on its back
    { name: 'body', parent: 'root', pivot: [0, 3.6, 0], cubes: [
      P([-4.6, 3.6, -3.4], [9.2, 8.6, 7.0], skinP),
      P([-3.6, 4.6, 2.6], [7.2, 4.8, 2.0], bellyP),                 // a pot belly: a cross of a wide and a tall layer,
      P([-2.6, 3.4, 2.6], [5.2, 7.2, 2.3], bellyP),                 // and the round middle pushing out furthest
      P([-2.2, 5.0, 4.8], [4.4, 4.0, 0.6], bellyP),
      P([-5.0, 3.8, -5.4], [10.0, 8.6, 2.2], shellP),
      P([-4.2, 4.6, -6.6], [8.4, 7.0, 1.4], shellP),
      P([-3.0, 5.6, -7.4], [6.0, 5.0, 1.0], shellP),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 12.0, 0.4], cubes: [
      ...HEAD.map(([a, b, c], k) => P([HO[0] - a, HO[1] - b, HO[2] - c], [2 * a, 2 * b, 2 * c], k === 2 ? faceSkin : headSkin)),
      // the dish set into the crown
      P([-4.0, 23.0, -2.8], [8.0, 1.1, 6.4], dishP), P([-3.2, 23.0, -3.6], [6.4, 1.0, 8.0], dishP),
      // the bill (upper)
      P([-2.2, 15.5, 6.4], [4.4, 1.5, 2.8], billP(false)),
      ...eyeStates(-1), ...eyeStates(1),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 15.5, 6.6], cubes: [P([-2.0, 14.6, 6.5], [4.0, 0.9, 2.5], billP(true)), P([-1.8, 15.4, 6.6], [3.6, 0.2, 2.2], '#7a2a3a', { outline: false })] },
    // the water, on a soft spring of its own; frames: calm, a rolling crest (4), empty
    { name: 'water', parent: 'head', pivot: [0, 24.16, 0.4], cubes: WATER.map((f) => P([-3.6, 24.16, -3.2], [7.2, 0, 7.2], waterP(f), { plane: 'y', id: 'wa-' + f, hide: f !== 'calm' })) },
    // reed hair, hanging round the dish
    fringe('F', [-4.8, 20.2, 6.2], [9.6, 3.333, 0], 'z', [0, 23.5, 6.2], [-20, 0, 0], 1),
    fringe('B', [-4.8, 20.0, -5.4], [9.6, 3.667, 0], 'z', [0, 23.5, -5.4], [22, 0, 0], 2),
    fringe('R', [-6.2, 20.0, -4.6], [0, 3.667, 9.6], 'x', [-6.2, 23.5, 0.4], [0, 0, -22], 3),
    fringe('L', [6.2, 20.0, -4.6], [0, 3.667, 9.6], 'x', [6.2, 23.5, 0.4], [0, 0, 22], 4),
    // stubby arms; the right hand carries the cucumber
    { name: 'armR', parent: 'body', pivot: [-4.8, 11.0, 0.2], cubes: [P([-6.6, 8.6, -1.0], [2.2, 3.0, 2.4], skinP), P([-6.5, 6.2, -0.7], [1.8, 2.8, 1.8], skinP), P([-6.9, 4.8, -1.1], [2.6, 1.6, 2.6], webP)] },
    { name: 'cuke', parent: 'armR', pivot: [-5.6, 5.6, 0.2], rot: [22, 0, 20], cubes: [P([-6.6, 4.0, -0.8], [2.0, 9.0, 2.0], cukeP), P([-6.1, 13.0, -0.3], [1.0, 0.8, 1.0], flowerP), P([-6.1, 3.4, -0.3], [1.0, 0.6, 1.0], '#5a4a20')] },
    { name: 'armL', parent: 'body', pivot: [4.8, 11.0, 0.2], cubes: [P([4.4, 8.6, -1.0], [2.2, 3.0, 2.4], skinP), P([4.7, 6.2, -0.7], [1.8, 2.8, 1.8], skinP), P([4.3, 4.8, -1.1], [2.6, 1.6, 2.6], webP)] },
    // the longboard, standing on its tail beside it (nose up, deck facing out)
    { name: 'board', parent: 'root', pivot: [BOARD_X + 0.3, 0, 0.4], rot: [0, -24, 9], cubes: [
      P([BOARD_X, 0, 0.4 - BOARD_W / 2], [0.6, BOARD_L - 2.2, BOARD_W], boardP),
      P([BOARD_X, BOARD_L - 2.2, 0.4 - BOARD_W * 0.38], [0.6, 1.4, BOARD_W * 0.76], boardP),
      P([BOARD_X, BOARD_L - 0.8, 0.4 - BOARD_W * 0.2], [0.6, 0.8, BOARD_W * 0.4], boardP),
      P([BOARD_X - 1.0, 0.6, 0.1], [1.0, 1.6, 0.6], '#1e8a8a'),
    ] },
  ],
};
// gear anchors (model units); a hat should sit round the dish, never over it
def.attach = {
  head: { bone: 'head', at: [0, 24.1, 0.4], size: 9.6 },
  face: { bone: 'head', at: [0, 19.2, 7.05], size: 8.8 },
  neck: { bone: 'body', at: [0, 11.8, 3.4], size: 6.4 },
  back: { bone: 'body', at: [0, 8.2, -7.4], size: 9.0 },
};

// ---------------------------------------------------------------- effects of its own
// a little curling wave: deep blue body, a white foam lip breaking over
defineFx('kappawave', {
  w: 14, h: 10, frames: [0, 1].map((k) => (p, w, h) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const crest = h * (0.25 + 0.55 * (x / w) ** 1.6) + (k ? 1 : 0) * Math.sin(x);
      if (y < crest - 1) continue;
      p.px(x, y, y < crest + 0.5 ? '#ffffff' : y < crest + 2 ? '#bff0ff' : y < h * 0.7 ? '#4cb8f0' : '#2a7ad0');
    }
    for (let x = w - 4; x < w; x++) p.px(x, Math.round(h * 0.2) + (w - 1 - x), '#ffffff');
  }),
  life: [0.5, 0.75], size: [0.16, 0.42], speed: [2.6, 3.6], grav: 1.5, drag: 1.6, spread: 0.25, fps: 8, fade: true,
});

// ---------------------------------------------------------------- animation
const DISH = [0, 24.4, 0.4], MOUTH = [0, 15.2, 9.2], CUKE_TIP = [-5.6, 13.4, 0.2];
// the dish water: a crest rolling across it at `speed` frames per second (0 = calm)
function surf(P, t, speed = 3) { if (!speed) return P.face('water', 'calm'); return P.face('water', ABCD[Math.floor(t * speed) % 4]); }
// spill drops off the dish lip
const spill = (P, n, dir = [0, 0.6, 1]) => P.stream('drop', 'head', DISH, { rate: n, dir, speed: 1.2, spread: 0.6 });
// keep the feet planted while the body sinks/rises by dy (the legs stretch / squash)
function plant(P, dy) { for (const s of ['legR', 'legL']) P.pos(s, 0, dy, 0).scl(s, 1, Math.max(0.4, (3.4 + dy) / 3.4), 1); }
// the board: stood beside it (rest), or carried under the arm (k), following the body's bob dy
const carry = (P, k, dy = 0) => P.rot('board', 0, 0, -9 * k).pos('board', -1.6 * k, (3.2 + dy) * k, 0);
// the board laid flat on the ground under it, nose forward (k blends from standing); roll rocks it on a wave
// the board laid flat under its feet, sideways (nose to its right), k blends from standing; roll rocks it
// along its length, pitch tips the nose up as if riding a wave face
const flat = (P, k, roll = 0, pitch = 0) => P.rot('board', roll, 24 * k, 81 * k - pitch).pos('board', -2.7 * k, 0.3 * k, 0.4 * k);

export const anim = {
  start: 'idle', seed: 13,
  breathe: { bone: 'body', amp: 0.016, per: 2.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.5, 5], dur: 0.12 },
  look: { bone: 'head', yaw: 26, pitch: 12, speed: 4 },
  springs: [
    { bone: 'water', tip: [0, 3, 0], k: 90, d: 4.5, gain: 1.3, max: 16 },
    { bone: 'reedF', tip: [0, -2.6, 0], k: 160, d: 9, gain: 0.9, max: 24 },
    { bone: 'reedB', tip: [0, -2.6, 0], k: 165, d: 9, gain: 0.9, max: 24 },
    { bone: 'reedR', tip: [0, -2.6, 0], k: 150, d: 9, gain: 0.9, max: 24 },
    { bone: 'reedL', tip: [0, -2.6, 0], k: 155, d: 9, gain: 0.9, max: 24 },
    { bone: 'armL', tip: [0, -6, 0], k: 200, d: 11, gain: 0.4, max: 10 },
  ],
  faces: {
    eyes: { default: 'chill', states: Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eye-' + k]])) },
    water: { default: 'calm', states: Object.fromEntries(WATER.map((f) => [typeof f === 'number' ? 'w' + f : f, ['wa-' + f]])) },
  },
  fidget: { every: [5, 9], clips: ['wax', 'munch'] },
  clips: {
    // laid-back: leaning on its board, swaying to an easy surf-rock groove and humming harmonies,
    // the dish water rolling gently, the cucumber riding its shoulder
    idle: { len: 2.4, loop: true, f(P, t) {
      const ph = (t / 2.4) * TAU, sw = Math.sin(ph), bob = Math.abs(Math.sin(ph * 2));
      P.pos('body', 0, -0.35 * bob, 0).rot('body', 0, sw * 4, 3 + sw * 3).sq('body', -0.025 * bob); plant(P, -0.35 * bob);
      P.rot('head', 4 * bob - 2, sw * 6, -sw * 5 - 4);
      P.rot('armL', -10, 0, -26 + sw * 2).rot('armR', 0, 0, 4 + bob * 3).rot('cuke', bob * 3, 0, 0);
      P.rot('jaw', 6 + 6 * Math.max(0, Math.sin(ph * 4)));                // humming along
      P.rot('footR', -10 * bump(t % 1.2, 0.1, 0.3), 0, 0);                // tapping the beat
      surf(P, t, 2.5);
      P.face('eyes', t > 1.4 && t < 1.9 ? 'grin' : undefined);
      P.burst(0.3, 'note', 'head', [7.5, 20, 3], { dir: [0.5, 1, 0.2] }).burst(1.1, 'note', 'head', [8, 22, 2], { dir: [0.8, 1, 0.1] }).burst(1.9, 'note', 'head', [7.5, 21, 3], { dir: [0.3, 1, 0.3] });
    } },
    // a waddle with the board tucked under its arm; water slops over the lip
    walk: { len: 0.7, loop: true, f(P, t) {
      const ph = (t / 0.7) * TAU, s = Math.sin(ph), c = Math.cos(ph), dy = Math.abs(c) * 0.8;
      P.pos('body', 0, dy, 0).rot('body', 4, s * 6, s * 7).sq('body', -0.04 * (1 - Math.abs(c)));
      P.pos('footR', 0, Math.max(0, s) * 1.6, s * 1.8).pos('footL', 0, Math.max(0, -s) * 1.6, -s * 1.8);
      P.pos('legR', 0, Math.max(0, s) * 1.2 + dy * 0.5, s * 1.2).pos('legL', 0, Math.max(0, -s) * 1.2 + dy * 0.5, -s * 1.2);
      P.rot('head', 2 - dy * 3, -s * 4, -s * 3).rot('armR', s * 16, 0, 6).rot('armL', -6, 0, -14);
      carry(P, 1, dy); P.rot('board', 0, 0, s * 3);
      surf(P, t, 6); if (Math.abs(c) > 0.95) spill(P, 6);
    } },
    // battle cry: a big surf whoop — cucumber and board thrown up, the dish water leaping
    cry: { len: 1.9, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.4, E.out)), up = seg(t, 0.32, 0.5, E.back) * (1 - seg(t, 1.4, 1.75, E.inout));
      const dy = -1.4 * crouch + 1.2 * up;
      P.pos('body', 0, dy, 0).sq('body', -0.12 * crouch + 0.08 * up * (1 - seg(t, 0.5, 0.7)) + wob(t, 1.7, 0.04, 3, 5)); plant(P, dy);
      P.rot('head', 14 * crouch - 26 * up + wave(t, 9) * 3 * up, 0, wave(t, 6) * 4 * up).rot('jaw', 6 * crouch + 34 * up);
      P.rot('armR', 0, 0, 10 * crouch - 110 * up + wave(t, 5) * 10 * up).rot('cuke', 30 * up, 0, -20 * up).rot('armL', 0, 0, -10 * crouch + 60 * up);
      surf(P, t, 8);
      P.face('eyes', up > 0.3 ? 'wide' : crouch > 0.3 ? 'fierce' : undefined);
      P.burst(0.5, 'splash', 'head', DISH, { n: 16, dir: [0, 1, 0], speed: 1.6, spread: 0.7 }).burst(0.5, 'note', 'head', [0, 26, 2], { n: 5, speed: 1.6 });
      P.burst(0.9, 'note', 'head', [7, 22, 3], { n: 3, speed: 1.2 });
    } },
    // attack: cucumber bonk — rear back and bring the cucumber down overhead like a club
    attack: { len: 1.05, next: 'idle', f(P, t) {
      const back = seg(t, 0, 0.3, E.out) * (1 - seg(t, 0.32, 0.4, E.in)), hit = seg(t, 0.34, 0.44, E.in3) * (1 - seg(t, 0.56, 0.95, E.inout));
      P.pos('root', 0, 0, -1.5 * back + 4.5 * hit).rot('body', -12 * back + 20 * hit, -16 * back + 6 * hit, 0).sq('body', -0.06 * back + wob(t, 0.46, -0.06, 4, 7));
      P.rot('head', -12 * back + 16 * hit, 0, 0).rot('jaw', 20 * back + 10 * hit);
      P.rot('armR', 0, 0, -150 * back + 40 * hit).rot('cuke', -20 * back + 70 * hit, 0, 0).rot('armL', 0, 0, 30 * back);
      surf(P, t, 7); if (hit > 0.5) spill(P, 30);
      P.face('eyes', t < 0.44 ? 'fierce' : t < 0.7 ? 'grin' : undefined);
      P.burst(0.44, 'spark', 'cuke', CUKE_TIP, { scale: 1.2 }).burst(0.44, 'star', 'cuke', CUKE_TIP, { n: 4 }).burst(0.45, 'splash', 'head', DISH, { n: 10, dir: [0, 0.6, 1], speed: 1.4 });
    } },
    // special (Hydro): the kappa's bow — it bows deep to its foe and the dish pours out as a breaking wave
    special: { len: 2.1, next: 'idle', f(P, t) {
      const gather = seg(t, 0.05, 0.4, E.inout) * (1 - seg(t, 0.5, 0.6)), bow = seg(t, 0.55, 0.78, E.back) * (1 - seg(t, 1.45, 1.85, E.inout));
      P.pos('body', 0, -0.8 * gather, 0).rot('body', -8 * gather + 46 * bow, 0, 0).sq('body', -0.06 * gather); plant(P, -0.8 * gather);
      P.rot('head', -10 * gather + 22 * bow, 0, 0).rot('jaw', 8 * gather);
      P.rot('armR', 30 * bow, 0, 20 * gather - 10 * bow).rot('armL', 30 * bow, 0, -20 * gather + 10 * bow);
      surf(P, t, gather > 0.2 ? 10 : 4);
      P.face('water', t > 0.8 && t < 1.55 ? 'empty' : undefined);
      P.face('eyes', gather > 0.3 ? 'closed' : bow > 0.3 ? 'fierce' : undefined);
      if (gather > 0.3) P.stream('bubble', 'head', DISH, { rate: 12, speed: 0.6 });
      if (t > 0.7 && t < 1.25) P.stream('kappawave', 'head', [0, 25, 4], { rate: 26, dir: [0, 0.6, 1], speed: 1.3, spread: 0.2 }).stream('splash', 'head', [0, 25, 4], { rate: 60, dir: [0, 0.4, 1], speed: 2.2, spread: 0.4 });
      P.burst(0.72, 'ring', 'head', [0, 25, 6], { scale: 1.2 }).burst(1.5, 'splash', 'head', DISH, { n: 8, dir: [0, 1, 0], speed: 0.8 });
    } },
    // knocked back, water slopping out of its dish
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.18, 0.6, E.inout));
      P.pos('root', 0, 0, -2.2 * k).rot('body', -14 * k + wob(t, 0.18, 5, 3, 6), 0, wave(t, 14) * 3 * k).sq('body', -0.14 * k).rot('head', -14 * k, 0, 0).rot('jaw', 26 * k);
      P.rot('armR', 0, 0, -40 * k).rot('armL', 0, 0, 40 * k);
      surf(P, t, 10);
      P.face('eyes', t < 0.45 ? 'hurt' : undefined);
      P.burst(0.02, 'splash', 'head', DISH, { n: 12, dir: [0, 1, -0.6], speed: 1.6 }).burst(0.02, 'spark', 'body', [0, 9, 6], {});
    } },
    // the dish spills dry, it wobbles, then topples back onto its shell like an upturned turtle
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.85, 1.0)), fall = seg(t, 0.9, 1.4, E.bounce);
      P.rot('body', 0, wave(t, 1.4) * 14 * dizzy, wave(t, 2) * 10 * dizzy).rot('head', 0, 0, wave(t, 2, 1) * 12 * dizzy);
      P.rot('root', -82 * fall, 0, 0).pos('root', 0, 7.6 * fall, -1.2 * fall);
      P.rot('footR', -30 * fall, 0, 0).rot('footL', -20 * fall, 0, 0).rot('armR', 0, 0, -60 * fall).rot('armL', 0, 0, 60 * fall).rot('jaw', 24 * fall);
      P.rot('board', 0, 0, -84 * seg(t, 0.4, 0.8, E.bounce));
      P.face('water', t > 0.6 ? 'empty' : 'w0').face('eyes', t > 0.25 ? 'swirl' : 'wide'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.55, 'splash', 'head', DISH, { n: 18, dir: [-0.3, 0.6, 0.6], speed: 1.6 }).burst(1.0, 'star', 'head', [0, 26, 0], { n: 5 });
    } },
    down: { len: 2.6, loop: true, f(P, t) {
      P.rot('root', -82 + wave(t, 1 / 2.6) * 4, 0, 0).pos('root', 0, 7.6, -1.2);              // rocking on its shell
      P.rot('footR', -30 + bump(t, 1.4, 1.6) * -16, 0, 0).rot('footL', -20, 0, 0).rot('armR', 0, 0, -60).rot('armL', 0, 0, 60).rot('jaw', 24);
      P.rot('board', 0, 0, -86);
      P.face('water', 'empty').face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
    } },
    // victory: drops the board flat, hops on and hangs ten — toes over the nose, arms out, riding an
    // invisible wave with spray off the tail
    win: { len: 2.4, next: 'idle', f(P, t) {
      const lay = seg(t, 0.05, 0.35, E.out), ride = seg(t, 0.45, 0.7, E.out) * (1 - seg(t, 2.05, 2.35, E.inout));
      const hopY = Math.sin(seg(t, 0.35, 0.62) * Math.PI) * 4;
      // the board lands flat in front of it, nose forward
      const sway = wave(t, 0.9) * ride, crouch = ride * (0.7 + 0.3 * Math.abs(wave(t, 1.8)));
      flat(P, lay, 4 * sway, 10 * ride);
      P.pos('root', 0, hopY + 1.4 * ride, 0).rot('root', 0, -14 * ride, sway * 5);
      P.pos('body', 0, -1.5 * crouch, 0).rot('body', 10 * ride, 0, sway * 8); plant(P, -1.5 * crouch);
      P.pos('footR', 0, 0, 2.6 * ride).rot('footR', 0, 0, 0).pos('footL', 0, 0, -1.4 * ride);       // one foot walked up to the nose
      P.rot('armR', 0, 0, -78 * ride + sway * 10).rot('armL', 0, 0, 78 * ride - sway * 10).rot('cuke', 40 * ride, 0, 0);
      P.rot('head', -6 * ride, 10 * ride, -sway * 6).rot('jaw', 22 * ride);
      surf(P, t, 6);
      P.face('eyes', ride > 0.4 ? 'grin' : undefined);
      if (ride > 0.5) P.stream('splash', 'root', [6, 0.6, 0], { rate: 30, dir: [1, 0.8, -0.3], speed: 1.4, spread: 0.6 }).stream('splash', 'root', [-8, 1.8, 0], { rate: 10, dir: [-0.6, 1, 0.2], speed: 1, spread: 0.5 });
      P.burst(0.75, 'note', 'head', [0, 27, 2], { n: 4, speed: 1.2 }).burst(1.5, 'note', 'head', [7, 22, 3], { n: 2, speed: 1 });
    } },
    // asleep sitting up, slumped against its board, head lolled onto the rail; the dish water still
    sleep: { len: 3.4, loop: true, f(P, t) {
      const br = Math.sin((t / 3.4) * TAU);
      P.pos('body', 0, -2.4, 0).rot('body', -8, 10, 12 + br * 1.2).sq('body', br * 0.02); plant(P, -2.4);
      P.rot('legR', -60, 0, 10).rot('legL', -60, 0, -10).pos('footR', 0, 0, 1.6).pos('footL', 0, 0, 1.6);
      P.rot('head', 10 + br * 2, 14, 16).rot('armR', 0, 0, -12).rot('armL', -16, 0, -36).rot('cuke', -30, 0, 30).rot('jaw', 4 + Math.max(0, br) * 6);
      surf(P, t, 0);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'head', [3, 22, 8], {}).burst(1.8, 'z', 'head', [3, 22, 8], {});
    } },
    // fidget: waxes its board with the cucumber, round and round, then admires the shine
    wax: { len: 2.6, next: 'idle', f(P, t) {
      const reach = seg(t, 0.05, 0.4, E.inout) * (1 - seg(t, 1.9, 2.3, E.inout)), rub = reach * (t > 0.4 && t < 1.9 ? 1 : 0);
      const a = t * 4 * TAU;
      P.rot('body', 0, 34 * reach, 0).rot('head', 10 * reach, 10 * reach + 12 * bump(t, 1.95, 2.4), 0);
      P.rot('armR', -70 * reach + Math.sin(a) * 8 * rub, 40 * reach, Math.cos(a) * 8 * rub).rot('cuke', 70 * reach, 0, -40 * reach);
      P.rot('board', 0, 0, -6 * reach);
      P.face('eyes', t > 2.0 ? 'grin' : reach > 0.5 ? 'chill' : undefined);
      if (rub > 0.5 && h2(Math.floor(t * 10), 1, 1) < 0.4) P.stream('sparkle', 'board', [BOARD_X + 0.6, 7, 0.4], { rate: 5 });
      surf(P, t, 2);
    } },
    // fidget: a crunchy bite of cucumber, chewed contentedly
    munch: { len: 2.0, next: 'idle', f(P, t) {
      const lift = seg(t, 0.05, 0.35, E.out) * (1 - seg(t, 1.5, 1.85, E.inout)), bite = bump(t, 0.4, 0.62);
      P.rot('armR', -70 * lift, 0, -40 * lift).rot('cuke', 70 * lift, 0, -60 * lift).rot('head', -8 * lift + 6 * bite, 0, 0);
      P.rot('jaw', 30 * bite + (t > 0.62 && t < 1.6 ? 8 + 8 * Math.sin(t * 22) : 0));
      P.face('eyes', t > 0.62 && t < 1.6 ? 'closed' : undefined); P.blinkOK = t < 0.6;
      P.burst(0.6, 'leaf', 'head', MOUTH, { n: 3, speed: 0.8 });
      surf(P, t, 2);
    } },
  },
};
def.anim = anim;
