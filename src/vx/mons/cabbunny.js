// Cabbunny — a bunny that IS a cabbage (Bio). A round head of overlapping leaves: dark waxy outer
// leaves cupping it from below, paler leaves wrapped round the sides and a tight pale heart on
// top, with a soft cream bunny face peeking out between them. Its ears are the two tallest outer
// leaves, veined and floppy at the tips. Half-lidded, sly and sleepy.
//
// Music homage (Bad Bunny, original): its one signature item — heart-shaped shades worn low on the
// nose so the eyes peer over them (pushed up for its game face) — painted claw tips, a summer burst of
// petals in its specials, and a dembow swagger in its idle.
//
// Build notes: the ball is a stepped sphere painted as one sphere in model space (heart whorl on
// top, two shingled rows of wrap leaves below). Each cupping leaf hangs on two bones — a yaw
// holder round the ball and a tilt bone at its base — so clips can fan the rosette open.
import { defineFx } from '../fx.js';
import { E, seg, bump, wob, wave, hop } from '../anim.js';
import { h2 } from './kit.js';

const TAU = Math.PI * 2;
const C = {
  heart: ['#fbffe2', '#eef8be', '#d8eba0', '#bcd688'], swirl: '#b2cd7c',
  pale: ['#dcf2a2', '#c0e486', '#9cce6a', '#76b058'], paleRib: '#f4fcdc',
  mid: ['#a8da74', '#88c462', '#68a852', '#4a8a46'], midRib: '#e4f6c4',
  wax: ['#7aba7a', '#5aa266', '#408654', '#2c6646'], bloom: '#9cc8b0', waxRib: '#d6eebe', waxVein: '#7cb47c',
  inner: ['#a6d67e', '#86c06a', '#64a056'],
  ear: ['#c4e68e', '#9ccf6a', '#78b456', '#548e46'],
  fur: ['#fffcf4', '#fff4e2', '#ffe2c6', '#eec4a6'], furLine: '#c49480',
  nose: ['#ffd2e6', '#ff9ec8', '#e0709e', '#a84a72'], pad: '#f6a2bc',
  nail: ['#ff4aa6', '#30dcc8'], frame: ['#ffb0d8', '#ff4fa0', '#c02a72'], lens: ['#1a0a22', '#36104a', '#6a1a6a', '#b02a7a'],
  petal: ['#ffd0dc', '#ff6a8a', '#e8304e', '#a8183a'], palm: ['#8ee070', '#4cb35a', '#2c8048'],
  ink: '#1c3022', lid: '#20141a',
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
    let nx = q[0] - O[0], ny = q[1] - O[1], nz = q[2] - O[2];
    const L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
    p.px(i, j, fn(nx * LIT[0] + ny * LIT[1] + nz * LIT[2], q, [nx, ny, nz], i, j, face));
  }
};
function stamp(p, rows, map, x0 = 0, y0 = 0) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = map[r[i]]; if (c) p.px(x0 + i, y0 + j, c); } }); }
const frac = (x) => ((x % 1) + 1) % 1;

// ---------------------------------------------------------------- the cabbage ball
const B = [0, 8.4, 0], BR = 6.4;
// a voxel sphere: six boxes whose silhouettes step 0.45 → 0.65 → 0.85 → 0.97 of the radius on every axis
const SPHERE = [[0.97, 0.45, 0.45], [0.45, 0.97, 0.45], [0.45, 0.45, 0.97], [0.85, 0.65, 0.65], [0.65, 0.85, 0.65], [0.65, 0.65, 0.85]];
const LTH = [0.6, 0.0, -0.55];          // light thresholds for the 4-tone ramps
const NA = 5, SPAN = TAU / NA;          // leaves per wrap row
// the wrap leaf under direction n: { row, d (angle from its midrib), top (height of its arched tip) }
function wrapLeaf(n) {
  const th = Math.atan2(n[0], n[2]), near = (off) => ((th - off) % SPAN + SPAN * 1.5) % SPAN - SPAN / 2;
  const dA = near(SPAN / 2), dB = near(0);
  const topA = 0.6 + 0.2 * Math.cos((dA / (SPAN / 2)) * (Math.PI / 2)), topB = 0.12 + 0.26 * Math.cos((dB / (SPAN / 2)) * (Math.PI / 2));
  if (n[1] <= topB) return { row: 'B', d: dB, top: topB };
  if (n[1] <= topA) return { row: 'A', d: dA, top: topA };
  return null;
}
const ballP = orb(B, BR, (l, q, n) => {
  const lf = wrapLeaf(n);
  if (!lf) {   // the heart: tight pale leaves whorling round the crown
    const r = Math.hypot(n[0], n[2]), a = Math.atan2(n[2], n[0]);
    return r > 0.1 && frac((a / TAU) * 3 + r * 2.4) < 0.1 ? C.swirl : band(C.heart, [0.85, 0.45, 0], l);
  }
  const M = lf.row === 'A' ? C.pale : C.mid, rho = BR * Math.sqrt(Math.max(0.05, 1 - n[1] * n[1])), s = lf.d * rho, y = n[1] * BR, u = Math.abs(lf.d) / (SPAN / 2);
  if (u > 0.93 || lf.top - n[1] < 0.04) return M[3];                                 // rim
  if (Math.abs(s) < 0.2) return lf.row === 'A' ? C.paleRib : C.midRib;               // midrib
  if (Math.abs(s) > 0.6 && frac((y - Math.abs(s) * 0.8) / 2.0) < 0.13) return M[0];  // a few veins
  return band(M, LTH, l);
});

// ---------------------------------------------------------------- leaves
// Leaves are one-texel-thin boxes with cut-out outlines: the front and back faces carry the leaf
// (different colours inside and out), the edges stay clear, and a dark rim is painted round the
// shape in place of an outline hull. shape(x, y) > 0 inside (x across from the midrib, y up).
const leafShape = (y0, y1, W, wave = 0.08) => (x, y) => {
  const t = (y - y0) / (y1 - y0); if (t < 0 || t > 1) return -1;
  const s = Math.sqrt(Math.max(0, Math.sin(Math.PI * Math.pow(t, 0.78)))), hw = (W / 2) * Math.max(s, t < 0.16 ? 0.17 : 0) * (1 + wave * Math.sin(y * 4.4 + x * 0.6));
  return hw - Math.abs(x);
};
const cutLeaf = (shape, fill) => (p, w, h, face, c) => {
  if (face !== 'south' && face !== 'north') return;
  const T = 0.34;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h), x = q[0] - (c.mid || 0), y = q[1];
    if (shape(x, y) <= 0) continue;
    const rim = shape(x, y + T) <= 0 || shape(x + T, y) <= 0 || shape(x - T, y) <= 0 || shape(x, y - T) <= 0;
    p.px(i, j, rim ? C.ink : fill(x, y, face, shape(x, y)));
  }
};
// the cupping outer leaves: dark waxy green outside with a bloom along the curled margin, a fat pale
// midrib and sweeping veins; a lighter green inside
const CUP_Y0 = 2.2;
const waxFill = (H) => (x, y, face, d) => {
  const ax = Math.abs(x), t = (y - CUP_Y0) / H, rib = 0.3 + Math.max(0, 0.5 - t * 0.9);
  if (face === 'north') return ax < rib ? C.waxRib : t > 0.6 ? C.inner[0] : t > 0.3 ? C.inner[1] : C.inner[2];
  if (ax < rib) return C.waxRib;
  if (d < 0.75 && t > 0.45) return C.bloom;
  if (ax > rib + 0.4 && frac((y - ax * 0.75) / 1.8) < 0.12) return C.waxVein;
  return t > 0.68 ? C.wax[0] : t > 0.38 ? C.wax[1] : t > 0.14 ? C.wax[2] : C.wax[3];
};
// the ear leaves: fresh green inside with a bright midrib and branching veins, dark waxy behind
const EAR_Y0 = 13.2, EAR_Y1 = 24.2, EAR_W = 5.2, earShape = leafShape(EAR_Y0, EAR_Y1, EAR_W, 0.06);
const earFill = (x, y, face, d) => {
  const ax = Math.abs(x), rib = Math.max(0.17, 0.5 - (y - EAR_Y0) * 0.035);
  if (face === 'north') return ax < rib ? C.wax[0] : d < 0.7 ? C.wax[2] : C.wax[1];
  if (ax < rib) return C.paleRib;
  if (ax > rib + 0.3 && frac((y - ax * 0.85) / 1.5) < 0.16) return C.ear[0];
  return d < 0.7 ? C.ear[2] : ax < 1.0 ? C.ear[0] : C.ear[1];
};
const earLeaf = cutLeaf(earShape, earFill);

// ---------------------------------------------------------------- bunny parts
const furP = (p, w, h, face) => {
  const F = C.fur;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let col = face === 'up' ? F[0] : face === 'down' ? F[3] : j < h * 0.3 ? F[0] : j < h * 0.8 ? F[1] : F[2];
    if (face === 'east' || face === 'west') col = j < h * 0.5 ? F[1] : F[2];
    p.px(i, j, col);
  }
  if (face !== 'up' && face !== 'down') for (let i = 0; i < w; i += 3) p.px(i + (Math.floor(i / 3) % 2), h - 1, F[3]);
};
// the face: cream fur, a paler muzzle round the nose with whisker dots, tufted cheeks
const faceP = (p, w, h, face, c) => {
  furP(p, w, h, face);
  if (face !== 'south') return;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h), d = (q[0] / 2.3) ** 2 + ((q[1] - 5.5) / 1.4) ** 2;
    if (d < 1) p.px(i, j, d > 0.75 ? C.fur[1] : C.fur[0]);
    for (const s of [-1, 1]) for (const [wx, wy] of [[1.5, 5.8], [1.9, 5.4], [1.5, 5.0]]) if (Math.abs(q[0] - s * wx) < 0.17 && Math.abs(q[1] - wy) < 0.17) p.px(i, j, C.furLine);
  }
  for (let j = Math.floor(h * 0.5); j < h; j += 2) { p.px(0, j, C.fur[2]); p.px(w - 1, j, C.fur[2]); }
};
const muzzleP = (p, w, h, face) => {
  furP(p, w, h, face);
  if (face === 'south') for (const s of [-1, 1]) for (const [dx, dy] of [[3, 2], [4, 3], [3, 4]]) p.px(Math.round((w - 1) / 2 + s * dx), dy, C.furLine);
};
const noseP = (p, w, h, face) => {
  const N = C.nose;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? N[0] : face === 'down' ? N[3] : j === 0 ? N[0] : j < h - 1 ? N[1] : N[2]);
  if (face === 'south') { p.px(0, h - 1, N[3]); p.px(w - 1, h - 1, N[3]); p.px(1, 0, '#ffffff'); }
};
// hind feet: a heel pad and three toe beans on the sole (the top rows of a down face are the toes)
const footP = (p, w, h, face) => {
  furP(p, w, h, face);
  if (face !== 'down') return;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, C.fur[2]);
  for (const x of [1, Math.floor(w / 2), w - 2]) { p.px(x, 1, C.pad); p.px(x, 2, C.pad); }
  for (let j = Math.floor(h * 0.45); j < h - 2; j++) for (let i = 2; i < w - 2; i++) p.px(i, j, C.pad);
};
const pawP = (p, w, h, face) => furP(p, w, h, face);
// painted claws: glossy nail-polish tips
const nailP = (k) => (p, w, h, face) => { const c = C.nail[k % 2]; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' || (i === 0 && j === 0) ? '#ffffff' : face === 'down' ? '#5a1840' : c); };
// the pom-pom tail: a tiny tight cabbage heart
const tailP = (p, w, h, face) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const a = Math.atan2(j - (h - 1) / 2, i - (w - 1) / 2), r = Math.hypot(j - (h - 1) / 2, i - (w - 1) / 2);
    p.px(i, j, r > 0.8 && frac((a / TAU) * 2 + r * 0.45) < 0.14 ? C.swirl : face === 'up' ? C.heart[0] : face === 'down' ? C.heart[3] : j < h * 0.4 ? C.heart[1] : C.heart[2]);
  }
};

// ---------------------------------------------------------------- the shades, the flower
// heart-shaped lenses (10 × 8 texels): a hot-pink frame round a dark tint fading to magenta, a hard glint
const LENS = ['.PPP..PPP.', 'PaaaPPaaaP', 'paggaaaaap', 'pabgbbbbbp', '.pccccccp.', '..pddddp..', '...pddp...', '....pp....'];
const lensP = (p) => stamp(p, LENS, { P: C.frame[0], p: C.frame[1], a: C.lens[0], b: C.lens[1], c: C.lens[2], d: C.lens[3], g: '#ffffff' });
const frameP = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? C.frame[0] : face === 'down' ? C.frame[2] : j === 0 ? C.frame[0] : C.frame[1]); };
// a tropical flower (five ruffled petals, a long beaded stamen) and a palm frond behind it
const flowerP = (p, w, h) => {
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), R = (w / 2) * (0.62 + 0.38 * Math.abs(Math.cos(a * 2.5)));
    if (r > R) continue;
    p.px(x, y, r < 1.4 ? C.petal[3] : r > R - 1 ? C.petal[2] : r < R * 0.55 ? C.petal[2] : (Math.cos(a * 2.5) > 0.7 && r > R * 0.6) ? C.petal[0] : C.petal[1]);
  }
  for (let k = 0; k < 4; k++) p.px(Math.round(cx + k), Math.round(cy - k), k === 3 ? '#fff27a' : '#ffd0e0');      // stamen
};
const palmP = (p, w, h) => {
  const cy = Math.floor(h / 2);
  for (let x = 0; x < w; x++) {
    p.px(x, cy, C.palm[2]);
    if (x > 0 && x % 2 === 0) { const L = Math.round(Math.sin((x / w) * Math.PI) * (h / 2 - 0.5)) + 1; for (let k = 1; k <= L; k++) { p.px(x + Math.floor(k / 2), cy - k, k < L ? C.palm[1] : C.palm[0]); p.px(x + Math.floor(k / 2), cy + k, k < L ? C.palm[2] : C.palm[1]); } }
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

// ---------------------------------------------------------------- face: eyes and mouth
// eyes: 9 × 7 texels, outer corner at x = 0, placed high so they peer over the low-slung shades
const EK = { line: '#0a1810', dark: '#16281e', acc: ['#2a7a4e', '#7ad890'] }, EW = 9, EH = 7;
const EYES = {
  sly: eyeOpen(EW, EH, EK, [0.16, 0.12]),                // sleepy-sly: a heavy lid, barely tilted in
  heavy: eyeOpen(EW, EH, EK, [0.36, 0.06]),
  sharp: eyeOpen(EW, EH, EK, [0.26, 0.38]),
  wide: eyeOpen(EW, EH, EK),
  smirk: eyeOpen(EW, EH, EK, [0.34, -0.06]),
  happy: eyeArc(EW, EH, EK, true),
  closed: eyeArc(EW, EH, EK, false),
  hurt: eyeHurt(EW, EH, EK),
  x: eyeX(EW, EH, EK),
  swirl: eyeSwirl(EW, EH, EK),
};
// states are per eye so it can wink
const EYE_SLOTS = { ...Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eR-' + k, 'eL-' + k]])), wink: ['eR-happy', 'eL-smirk'] };
const MM = { k: '#5a2a32', m: '#3a1420', t: '#ff8aa8', w: '#ffffff', W: '#e4e0d8' };
const MOUTHS = {
  shut: ['....kk....', '.kkk..kkk.', '....wW....', '....wW....', '..........'],
  smirk: ['....kk....', '.kkk..kk..', '....wWk.kk', '....wW....', '..........'],
  open: ['....kk....', '.kkkkkkkk.', '.kmmwWmmk.', '.kmmwWmmk.', '..kmttmk..', '...kkkk...'],
};

// ---------------------------------------------------------------- geometry
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const FZ = 6.83;      // the face plane
const eyeStates = (side) => Object.entries(EYES).map(([k, fn]) => P(side < 0 ? [-3.25, 8.2, FZ] : [0.25, 8.2, FZ], [3, 2.333, 0], fn, { plane: 'z', mirror: side > 0, id: (side < 0 ? 'eR-' : 'eL-') + k, hide: k !== 'sly' }));
// five waxy cupping leaves round the ball: [name, yaw, tilt, width, height]
const CUPS = [['A', -64, 30, 8.6, 7.2], ['B', 64, 30, 8.6, 7.2], ['C', -128, 28, 9.2, 8.6], ['D', 128, 28, 9.2, 8.6], ['E', 180, 24, 9.2, 8.2], ['F', -26, 40, 6.0, 4.6], ['G', 26, 40, 6.0, 4.6]];
const cupBones = CUPS.flatMap(([n, yaw, tilt, W, H]) => [
  { name: 'cup' + n, parent: 'body', pivot: [0, CUP_Y0, 0], rot: [0, yaw, 0], cubes: [] },
  { name: 'leaf' + n, parent: 'cup' + n, pivot: [0, CUP_Y0, 5.0], rot: [tilt, 0, 0], cubes: [
    P([-W / 2, CUP_Y0, 4.85], [W, H, 0.333], cutLeaf(leafShape(CUP_Y0, CUP_Y0 + H, W, 0.1), waxFill(H)), { outline: false }),
  ] },
]);
// an ear: one broad cut-out leaf in two segments; the upper half is a sprung bone that flops
const EAR_J = 18.6;
const ear = (s) => {
  const x = s * 2.5, n = s < 0 ? 'R' : 'L', cube = (y0, y1) => { const c = P([x - EAR_W / 2 - 0.4, y0, -0.85], [EAR_W + 0.8, y1 - y0, 0.333], earLeaf, { outline: false }); c.mid = x; return c; };
  return [
    { name: 'ear' + n, parent: 'body', pivot: [x, 13.8, -0.7], rot: [-12, s * -6, s * -14], cubes: [cube(EAR_Y0, EAR_J + 0.4)] },
    { name: 'ear' + n + '2', parent: 'ear' + n, pivot: [x, EAR_J, -0.7], rot: [12, 0, s * -14], cubes: [cube(EAR_J - 0.2, EAR_Y1)] },
  ];
};
const nails = (x0, y0, z0, n, k0) => Array.from({ length: n }, (_, k) => P([x0 + k * 0.6, y0, z0], [0.4, 0.5, 0.45], nailP(k + k0)));

export const def = {
  name: 'cabbunny', ppu: 3, scale: 0.36, outline: { color: C.ink, px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    // big cream hind feet with painted claws (pivot at the heel)
    { name: 'footR', parent: 'root', pivot: [-3.0, 0, -2.6], cubes: [P([-4.4, 0, -2.6], [2.8, 2.0, 6.0], footP), ...nails(-4.2, 0, 3.4, 3, 0)] },
    { name: 'footL', parent: 'root', pivot: [3.0, 0, -2.6], cubes: [P([1.6, 0, -2.6], [2.8, 2.0, 6.0], footP), ...nails(1.8, 0, 3.4, 3, 1)] },
    // the cabbage: a stepped sphere, heart on top, wrap leaves round it
    { name: 'body', parent: 'root', pivot: [0, 2.0, 0], cubes: [
      ...SPHERE.map(([a, b, c]) => P([B[0] - a * BR, B[1] - b * BR, B[2] - c * BR], [2 * a * BR, 2 * b * BR, 2 * c * BR], ballP)),
    ] },
    ...cupBones,
    // the bunny face peeking out of the leaves
    { name: 'face', parent: 'body', pivot: [0, 8.4, 0], cubes: [
      P([-3.4, 4.0, 4.2], [6.8, 6.8, 2.6], faceP),
      P([-2.4, 10.8, 4.0], [4.8, 0.533, 2.4], furP),                                          // the brow, rounding the top
      P([-4.2, 3.8, 4.4], [1.6, 3.0, 2.0], furP), P([2.6, 3.8, 4.4], [1.6, 3.0, 2.0], furP),     // cheek puffs
      ...eyeStates(-1), ...eyeStates(1),
      ...Object.entries(MOUTHS).map(([k, rows]) => P([-1.667, 5.95 - rows.length / 3, 6.84], [3.333, rows.length / 3, 0], (p) => stamp(p, rows, MM), { plane: 'z', id: 'm-' + k, hide: k !== 'shut' })),
    ] },
    { name: 'nose', parent: 'face', pivot: [0, 6.4, 7.1], cubes: [P([-0.667, 6.0, 6.7], [1.333, 0.8, 0.6], noseP)] },
    // heart shades, worn low on the nose (P.pos('shades', 0, 1.7) puts them on properly)
    { name: 'shades', parent: 'face', pivot: [0, 8.4, 5.6], cubes: [
      P([-3.6, 5.6, 7.62], [3.333, 2.667, 0], lensP, { plane: 'z' }),
      P([0.267, 5.6, 7.62], [3.333, 2.667, 0], lensP, { plane: 'z', mirror: true }),
      P([-0.5, 7.8, 7.36], [1.0, 0.4, 0.4], frameP),
      P([-3.9, 7.8, 4.0], [0.4, 0.4, 3.6], frameP), P([3.5, 7.8, 4.0], [0.4, 0.4, 3.6], frameP),
    ] },
    { name: 'pawR', parent: 'body', pivot: [-1.7, 4.4, 5.8], cubes: [P([-2.6, 2.7, 5.8], [1.8, 1.6, 2.0], pawP), ...nails(-2.5, 2.7, 7.75, 3, 0)] },
    { name: 'pawL', parent: 'body', pivot: [1.7, 4.4, 5.8], cubes: [P([0.8, 2.7, 5.8], [1.8, 1.6, 2.0], pawP), ...nails(0.9, 2.7, 7.75, 3, 1)] },
    { name: 'tail', parent: 'body', pivot: [0, 6.6, -6.4], cubes: [P([-1.6, 5.6, -9.0], [3.2, 2.8, 2.2], tailP), P([-1.2, 5.2, -8.6], [2.4, 3.6, 2.0], tailP), P([-1.2, 5.8, -9.6], [2.4, 2.4, 1.0], tailP)] },
    ...ear(-1), ...ear(1),
  ],
};
// gear anchors (model units)
def.attach = {
  head: { bone: 'body', at: [0, 14.8, 0], size: 7.6 },
  face: { bone: 'face', at: [0, 9.4, 6.9], size: 6.8 },
  neck: { bone: 'body', at: [0, 4.2, 6.2], size: 6.0 },
  back: { bone: 'body', at: [0, 8.4, -6.4], size: 9.6 },
};

// ---------------------------------------------------------------- effects of its own
// a torn-off cabbage leaf: round, pale-ribbed, fluttering
defineFx('cabbageleaf', {
  w: 7, h: 7, frames: [0, 1].map((k) => (p, w, h) => {
    const cols = k ? ['#cbe88e', '#a8d070', '#6faa52'] : ['#6faa52', '#438c56', '#2f6e4a'];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = x - 3, dy = y - 3.4, r = Math.hypot(dx * 1.05, dy);
      if (r > 3.3 || (y === 6 && x !== 3)) continue;
      p.px(x, y, x === 3 ? '#f0fad0' : r > 2.5 ? cols[2] : dx < 0 ? cols[0] : cols[1]);
    }
  }),
  life: [0.9, 1.5], size: [0.1, 0.09], speed: [0.8, 1.8], grav: 1.1, drag: 1.8, spread: 0.8, flutter: true,
});

// ---------------------------------------------------------------- animation
const CUPN = CUPS.map((c) => c[0]);
const CROWN = [0, 15.2, 0], BEAT = 0.65;
// keep the feet planted while the ball sinks by dy (the haunches squash)
function feet(P, dy, lift = [0, 0]) { ['footR', 'footL'].forEach((s, k) => P.pos(s, 0, lift[k], 0).scl(s, 1, Math.max(0.45, (2.0 + Math.min(0, dy) - lift[k]) / 2.0), 1)); }
// fan the leaf rosette open by a degrees (closes when negative), optionally rippling round the ring
function flare(P, a, t = 0, ripple = 0) { CUPN.forEach((n, k) => P.rot('leaf' + n, a + (ripple ? Math.sin(t * 14 + k * 1.3) * ripple : 0), 0, 0)); return P; }
// ears: spread (+ out / − in), lift (+ up / − back), flop (tips forward)
function ears(P, spread, lift = 0, flop = 0) {
  P.rot('earR', -lift, 0, spread).rot('earL', -lift, 0, -spread);
  if (flop) P.rot('earR2', flop, 0, 0).rot('earL2', flop, 0, 0);
  return P;
}
const twitch = (P, t, k = 1) => P.pos('nose', 0, Math.sin(t * 60) * 0.12 * k, 0).scl('nose', 1 + Math.abs(Math.sin(t * 60)) * 0.12 * k, 1, 1);
// 0 = shades low on the nose (eyes peer over), 1 = pushed up into a proper game face
const shades = (P, k, tilt = 0) => P.pos('shades', 0, 1.7 * k, 0.15 * k).rot('shades', 0, 0, tilt);

export const anim = {
  start: 'idle', seed: 9,
  breathe: { bone: 'body', amp: 0.018, per: 2.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.5], dur: 0.14 },
  look: { bone: 'face', yaw: 14, pitch: 8, speed: 3.5 },
  springs: [
    { bone: 'earR2', tip: [0, 4.6, 0], k: 110, d: 7, gain: 1.1, max: 34 },
    { bone: 'earL2', tip: [0, 4.6, 0], k: 115, d: 7, gain: 1.1, max: 34 },
    { bone: 'earR', tip: [0, 5, 0], k: 190, d: 10, gain: 0.6, max: 14 },
    { bone: 'earL', tip: [0, 5, 0], k: 195, d: 10, gain: 0.6, max: 14 },
    { bone: 'tail', tip: [0, 0, -2.4], k: 220, d: 10, gain: 0.8, max: 20 },
    ...CUPN.map((n, k) => ({ bone: 'leaf' + n, tip: [0, 7, 0], k: 200 + k * 9, d: 10, gain: 0.45, max: 12, axes: [1, 0, 0.4] })),
  ],
  faces: {
    eyes: { default: 'sly', states: EYE_SLOTS },
    mouth: { default: 'shut', states: Object.fromEntries(Object.keys(MOUTHS).map((k) => [k, ['m-' + k]])) },
  },
  fidget: { every: [5, 9], clips: ['peek', 'thump', 'yawn'] },
  clips: {
    // swagger: leaning back cool, nodding to a dembow groove (boom — ch-boom — chick), shades bouncing on the nose
    idle: { len: BEAT * 4, loop: true, f(P, t) {
      const bt = t / BEAT, ph = bt % 1, dip = Math.exp(-ph * 9) * (1 - Math.exp(-ph * 60)), off = Math.exp(-((ph + 0.25) % 1) * 12) * 0.5;
      const sway = Math.sin((t / (BEAT * 2)) * Math.PI);
      P.pos('body', 0, -0.8 * dip - 0.3 * off, 0).sq('body', -0.06 * dip - 0.025 * off).rot('body', -6, sway * 4, sway * 4.5);
      feet(P, -0.8 * dip);
      P.rot('face', 9 * dip + 4 * off, sway * 6, -sway * 3 * off);
      shades(P, 0).pos('shades', 0, 0.18 * dip, 0);
      ears(P, 6 + sway * 4, -4 - 4 * dip);
      const pat = bump(ph, 0, 0.35) * (Math.floor(bt) % 2);      // the right paw taps on beats 2 and 4
      P.rot('pawR', -24 * pat, 0, -10 * pat).rot('pawL', -6 * dip, 0, 0);
      twitch(P, t, bump(t, 1.7, 2.05));
      flare(P, 2 + 3 * dip);
    } },
    // a rabbit hop with attitude: crouch, spring, tuck, land and settle; ears and rosette trail behind
    walk: { len: 0.72, loop: true, f(P, t) {
      const h = hop(t, 0.72, 3.2, { crouch: 0.9, air: [0.18, 0.6] });
      if (h.air) P.pos('root', 0, h.y, 0); else { P.pos('body', 0, h.y, 0); feet(P, h.y); }
      P.sq('body', h.sq * 0.8).rot('body', h.air ? -10 * Math.sin(h.k * Math.PI) + 6 * h.k : 2, 0, 0);
      const kick = h.air ? Math.sin(h.k * Math.PI) : 0;
      P.rot('footR', 30 * kick, 0, 0).rot('footL', 30 * kick, 0, 0).pos('footR', 0, 0.6 * kick, -1.2 * kick).pos('footL', 0, 0.6 * kick, -1.2 * kick);
      P.rot('pawR', -30 * kick, 0, 0).rot('pawL', -30 * kick, 0, 0);
      ears(P, 6, -8 * kick); flare(P, 4 * kick);
    } },
    // battle cry: shades pushed up into a game face, then it rears up, ears snapping upright, rosette fanned like a frill — and a thump
    cry: { len: 2.0, next: 'idle', f(P, t) {
      const on = seg(t, 0.05, 0.22, E.back) * (1 - seg(t, 1.6, 1.85, E.inout)), up = seg(t, 0.3, 0.52, E.back) * (1 - seg(t, 1.3, 1.6, E.inout)), crouch = bump(t, 0.15, 0.4);
      const thump = bump(t, 1.12, 1.26);
      P.rot('pawR', -80 * bump(t, 0, 0.3), 0, 0);                // a paw flicks the shades up
      shades(P, on);
      P.pos('body', 0, -1 * crouch + 1.4 * up, 0).sq('body', -0.1 * crouch + 0.12 * up * (1 - seg(t, 0.52, 0.8)) + wob(t, 1.26, -0.06, 4, 6)).rot('body', -10 * up, 0, wave(t, 7) * 2 * up);
      feet(P, -1 * crouch); P.pos('footR', 0, 2 * thump, 0).rot('footR', -20 * thump, 0, 0);
      ears(P, -8 * up, 26 * up);
      flare(P, 38 * up, t, 4 * up);
      P.rot('pawR', -50 * up, 0, -20 * up).rot('pawL', -50 * up, 0, 20 * up);
      twitch(P, t, up);
      P.face('mouth', up > 0.3 && t < 1.15 ? 'open' : undefined);
      P.burst(0.5, 'cabbageleaf', 'body', CROWN, { n: 6, speed: 1.4 }).burst(0.52, 'petal', 'body', CROWN, { n: 6, speed: 1.2 });
      P.burst(1.26, 'dust', 'root', [-3, 0.4, 2], { n: 5, dir: [0, 0.3, 1], spread: 1, speed: 0.7, scale: 0.6 });
    } },
    // attack: shades on, then a hop-kick — crouch, leap, lean back mid-air and drive both hind feet into the target
    attack: { len: 1.2, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.14, E.back) * (1 - seg(t, 0.95, 1.15, E.inout));
      const crouch = seg(t, 0.06, 0.26, E.inout) * (1 - seg(t, 0.26, 0.34, E.out));
      const air = seg(t, 0.28, 0.46, E.out) * (1 - seg(t, 0.66, 0.88, E.in)), kick = seg(t, 0.4, 0.5, E.in3) * (1 - seg(t, 0.6, 0.78, E.inout));
      const fwd = seg(t, 0.28, 0.5, E.out) * (1 - seg(t, 0.64, 0.94, E.inout));
      shades(P, on);
      P.pos('root', 0, 4.5 * air, 6 * fwd - 1.5 * crouch);
      P.pos('body', 0, -1.2 * crouch, 0).sq('body', -0.14 * crouch + 0.1 * air * (1 - kick) + wob(t, 0.88, -0.1, 3.5, 6));
      feet(P, -1.2 * crouch);
      P.rot('body', -38 * kick + 10 * crouch, 0, 0);
      P.rot('footR', -75 * kick, 0, 0).rot('footL', -75 * kick, 0, 0).pos('footR', 0, 3.5 * kick, 3.5 * kick).pos('footL', 0, 3.5 * kick, 3.5 * kick);
      P.rot('pawR', -40 * air, 0, 0).rot('pawL', -40 * air, 0, 0);
      ears(P, 10 * air, -16 * air); flare(P, 10 * air);
      P.face('mouth', kick > 0.5 ? 'open' : t > 0.9 ? 'smirk' : undefined);
      P.burst(0.5, 'spark', 'root', [0, 5, 10], { scale: 1.2 }).burst(0.5, 'star', 'root', [0, 5, 10], { n: 4 }).burst(0.51, 'cabbageleaf', 'root', [0, 5, 9], { n: 4, dir: [0, 0.5, 1] });
      P.burst(0.88, 'dust', 'root', [0, 0.4, 0], { n: 6, spread: 1, speed: 0.8, scale: 0.6 });
    } },
    // special (Bio): leaf storm — shades on, it whirls like a top with the rosette fanned flat and flings a gale of leaves and petals
    special: { len: 2.1, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.15, E.back) * (1 - seg(t, 1.8, 2.05, E.inout));
      const gather = seg(t, 0.05, 0.3, E.inout) * (1 - seg(t, 0.3, 0.4)), spin = seg(t, 0.32, 0.5, E.in) * (1 - seg(t, 1.35, 1.6, E.inout));
      const fling = seg(t, 1.25, 1.35, E.out) * (1 - seg(t, 1.6, 1.9, E.inout));
      shades(P, on);
      P.rot('root', 0, (1080 * seg(t, 0.32, 1.45, E.inout)) % 360, 0).pos('root', 0, 1.6 * spin + 0.6 * wave(t, 6) * spin, 0);
      P.pos('body', 0, -1 * gather, 0).sq('body', -0.12 * gather + 0.06 * spin + wob(t, 1.5, -0.08, 3, 5));
      feet(P, -1 * gather);
      flare(P, -12 * gather + 62 * spin + 20 * fling, t, 6 * spin);
      ears(P, 34 * spin, -10 * spin, 10 * spin);
      P.rot('pawR', 0, 0, -50 * spin).rot('pawL', 0, 0, 50 * spin);
      P.face('mouth', fling > 0.3 ? 'open' : undefined);
      if (spin > 0.3) P.stream('cabbageleaf', 'body', [0, 9, 0], { rate: 34 * spin, dir: [1, 0.35, 0], speed: 2.2, spread: 0.6 }).stream('leaf', 'body', [0, 6, 0], { rate: 20 * spin, dir: [-1, 0.5, 0], speed: 2.4, spread: 0.7 }).stream('petal', 'body', CROWN, { rate: 8 * spin, speed: 1.6 });
      P.burst(1.3, 'cabbageleaf', 'body', [0, 9, 6], { n: 22, dir: [0, 0.25, 1], speed: 4.2, spread: 0.35 }).burst(1.3, 'leaf', 'body', [0, 9, 6], { n: 16, dir: [0, 0.2, 1], speed: 5, spread: 0.3 }).burst(1.31, 'petal', 'body', [0, 9, 6], { n: 10, dir: [0, 0.3, 1], speed: 3.6, spread: 0.4 }).burst(1.32, 'sparkle', 'body', [0, 10, 7], { n: 8, speed: 1.6 });
    } },
    // knocked back; the shades knocked crooked, outer leaves flutter off, ears flail
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.18, 0.6, E.inout)), skew = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.4, 0.7, E.inout));
      P.pos('root', 0, 0, -2.4 * k).sq('body', -0.22 * k + wob(t, 0.18, 0.08, 3.5, 6)).rot('body', -14 * k + wob(t, 0.18, 6, 3, 6), 0, wave(t, 14) * 3 * k);
      feet(P, -1 * k);
      shades(P, 0, 22 * skew).pos('shades', 0.4 * skew, -0.9 * skew, 0);
      flare(P, 24 * k); ears(P, 20 * k, -18 * k);
      P.face('eyes', t < 0.45 ? 'hurt' : undefined).face('mouth', t < 0.42 ? 'open' : undefined);
      P.burst(0.03, 'cabbageleaf', 'body', [0, 9, 0], { n: 5, speed: 1.6 }).burst(0.03, 'spark', 'body', [0, 9, 7], {});
    } },
    // dizzy, it keels over onto its side; the shades slide off its nose, ears flopped across the ground
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.85, 1.0)), fall = seg(t, 0.9, 1.4, E.bounce), slip = seg(t, 0.2, 0.9, E.inout);
      P.rot('body', 0, wave(t, 1.4) * 14 * dizzy, wave(t, 2) * 9 * dizzy);
      P.rot('root', 0, 0, 82 * fall).pos('root', -6.6 * fall, 3.4 * fall, 0);
      shades(P, 0, -28 * slip).pos('shades', -0.6 * slip, -1.6 * slip, 0.3 * slip);
      ears(P, -10 * fall, -20 * fall, 30 * fall);
      flare(P, 14 * fall);
      P.rot('footR', 30 * fall, 0, 0).rot('footL', -20 * fall, 0, 0);
      P.face('eyes', t > 0.25 ? 'swirl' : 'wide').face('mouth', t > 0.25 ? 'open' : undefined); P.blinkOK = false; P.lookW = 0;
      P.burst(1.4, 'cabbageleaf', 'body', [0, 9, 0], { n: 4, speed: 0.8 }).burst(1.0, 'star', 'body', CROWN, { n: 5 });
    } },
    down: { len: 2.8, loop: true, f(P, t) {
      P.rot('root', 0, 0, 82).pos('root', -6.6, 3.4, 0);
      shades(P, 0, -28).pos('shades', -0.6, -1.6, 0.3);
      ears(P, -10, -20, 30); flare(P, 14 + wave(t, 1 / 2.8) * 2);
      P.rot('footR', 30 + bump(t, 1.6, 1.8) * 16, 0, 0).rot('footL', -20, 0, 0);
      P.face('eyes', 'swirl').face('mouth', 'open'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.burst(1.2, 'cabbageleaf', 'body', CROWN, { n: 1, speed: 0.4 });
    } },
    // victory: a binky (a leap with a mid-air twist), then it tips the shades down its nose and winks
    win: { len: 2.1, next: 'idle', f(P, t) {
      const h = t < 0.9 ? hop(t, 0.9, 7, { crouch: 1.4 }) : { y: wob(t, 0.9, -1.0, 3, 6), sq: wob(t, 0.9, -0.14, 3, 6), air: false };
      if (h.y > 0) P.pos('root', 0, h.y, 0); else { P.pos('body', 0, h.y, 0); feet(P, h.y); }
      const tw = Math.sin(seg(t, 0.24, 0.64) * Math.PI);
      P.sq('body', h.sq).rot('body', 0, 50 * tw, -24 * tw).rot('footR', 30 * tw, 0, -20 * tw).rot('footL', 30 * tw, 0, 20 * tw);
      ears(P, 18 * tw, 10 * tw, -10 * tw); flare(P, 24 * tw);
      const tip = seg(t, 1.05, 1.25, E.back) * (1 - seg(t, 1.8, 2.05, E.inout));
      P.rot('pawR', -70 * tip, 0, -16 * tip);
      shades(P, -0.45 * tip);
      P.face('eyes', t < 0.9 ? 'wide' : tip > 0.4 ? 'wink' : 'smirk').face('mouth', tip > 0.3 ? 'smirk' : undefined).rot('face', 0, 0, -6 * tip).rot('earL', 0, 0, 14 * bump(t, 1.4, 1.6));
      P.burst(0.45, 'cabbageleaf', 'body', CROWN, { n: 6, speed: 1.4 }).burst(0.46, 'petal', 'body', CROWN, { n: 6, speed: 1.2 }).burst(0.9, 'dust', 'root', [0, 0.4, 0], { n: 5, spread: 1, speed: 0.8, scale: 0.6 }).burst(1.3, 'sparkle', 'face', [2, 10.5, 8], { n: 3 });
    } },
    // asleep, curled into a plain cabbage: shades pushed up on the heart, ears folded over the face, Zzz
    sleep: { len: 3.4, loop: true, f(P, t) {
      const br = Math.sin((t / 3.4) * TAU);
      P.pos('body', 0, -1.2 + br * 0.22, 0).sq('body', -0.06 + br * 0.03); feet(P, -1.2);
      shades(P, 0).rot('shades', -60, 0, 0).pos('shades', 0, 3.4, -3.2);
      P.rot('earR', 112, 0, -26).rot('earL', 112, 0, 26).rot('earR2', 30, 0, 0).rot('earL2', 30, 0, 0);
      flare(P, -10 + br * 1.5);
      P.rot('pawR', -20, 0, 0).rot('pawL', -20, 0, 0).rot('face', 6, 0, 0);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.6, 'z', 'body', [4, 15, 4], {}).burst(1.9, 'z', 'body', [4, 15, 4], {});
    } },
    // fidget: tips the shades right down its nose for a long, sly look over the top, then nudges them back
    peek: { len: 2.2, next: 'idle', f(P, t) {
      const down = seg(t, 0.15, 0.4, E.out) * (1 - seg(t, 1.5, 1.75, E.back)), push = bump(t, 1.4, 1.85);
      P.rot('pawR', -78 * (bump(t, 0.05, 0.45) + push), 0, -14 * (bump(t, 0.05, 0.45) + push));
      shades(P, -0.9 * down);
      P.rot('face', 8 * down, 0, -5 * down).rot('body', 0, 0, -3 * down);
      P.face('eyes', down > 0.5 ? (t > 0.7 && t < 1.15 ? 'sly' : 'heavy') : undefined).face('mouth', down > 0.5 ? 'smirk' : undefined);
      ears(P, 4 * down, 0, 0); P.rot('earR', 0, 0, -12 * bump(t, 0.8, 1.0));
    } },
    // fidget: a warning thump of the hind foot, ears pricked
    thump: { len: 1.5, next: 'idle', f(P, t) {
      const alert = seg(t, 0.05, 0.2, E.back) * (1 - seg(t, 1.1, 1.4, E.inout));
      ears(P, -6 * alert, 16 * alert);
      for (const t0 of [0.35, 0.72]) { const k = bump(t, t0, t0 + 0.2); P.pos('footR', 0, 1.8 * k, -0.6 * k).rot('footR', -24 * k, 0, 0); P.sq('body', wob(t, t0 + 0.2, -0.05, 4, 8)); P.burst(t0 + 0.2, 'dust', 'root', [-3, 0.3, 1.5], { n: 3, dir: [0, 0.3, 1], spread: 1, speed: 0.6, scale: 0.5 }); }
      P.face('eyes', alert > 0.4 ? 'sharp' : undefined); twitch(P, t, alert);
    } },
    // fidget: a huge sleepy yawn, buck teeth on show; the ears droop, then shake back up
    yawn: { len: 2.0, next: 'idle', f(P, t) {
      const y = seg(t, 0.1, 0.5, E.inout) * (1 - seg(t, 1.1, 1.35, E.inout)), shake = bump(t, 1.35, 1.8);
      P.rot('face', -12 * y, 0, 0).rot('body', -5 * y, 0, wave(t, 9) * 4 * shake).sq('body', 0.06 * y);
      ears(P, 14 * y + wave(t, 10) * 12 * shake, -16 * y, 20 * y);
      P.rot('pawR', -60 * bump(t, 0.4, 1.1), 0, 0);
      P.face('eyes', y > 0.3 ? 'closed' : undefined).face('mouth', y > 0.3 ? 'open' : undefined); P.blinkOK = y < 0.1;
    } },
  },
};
def.anim = anim;
