// Kohlossus — the community garden's guardian: a GIANT, extremely round rabbit that is mostly cabbage (Bio).
// Its body is one huge cabbage head — waxy blue-green wrapper leaves shingled round the bottom, paler leaves
// wrapping the sides, a tight cream-green heart on top — with a soft cream rabbit face and belly peeking out of
// the front. Its ears are two tall veined cabbage leaves (the left one has a bite out of it: it got hungry), a
// crown of pale heart leaves sits between them, and three dark outer leaves hang down its back like a cape. Big
// flat rabbit feet, stubby paws, a cotton tail with a sprout, and a spare cabbage it carries everywhere (and
// throws). Sharp, cross, orange-eyed: it takes the garden VERY seriously. An original design.
//
// Build notes: the ball is a stepped sphere painted as one sphere in model space (wrapper leaves by latitude,
// scalloped edges and pale midribs by longitude, the fur belly where the normal faces front). The face (eyes,
// nose, teeth, mouth) sits on a cut-out plane over it. Clips: idle, walk, run, cry, angry, stomp, attack (the
// cabbage throw), special (the belly flop), cast, hurt, faint, down, win, sleep, munch.
import { E, seg, bump, wob, wave, hop } from '../anim.js';
import { shade } from './kit.js';
import { eyeRig, eyesAt, eyesScale, glance, mouthRig } from './eyes.js';

const TAU = Math.PI * 2;
const C = {
  heart: ['#f2f8d4', '#dcecb0', '#c4de92', '#a8ca78'],
  pale: ['#c8e69a', '#a8d47e', '#88bc66', '#6aa252'],
  wax: ['#8cc08e', '#6aa478', '#4e8a64', '#386e52'], rib: '#e6f4cc', vein: '#b8dca0',
  fur: ['#fffdf6', '#fff4e0', '#f2dcc0', '#d8bc9c'], pink: ['#ffc4d0', '#f49ab0', '#d87090'], tooth: '#fffef8',
  ink: '#1e2a1a', line: '#2a1a12',
};
// ---------------------------------------------------------------- painting helpers
// the model-space point under texel (i, j) of a face
function at(c, f, i, j, w, h) {
  const [ox, oy, oz] = c.o, [sx, sy, sz] = c.s, u = (i + 0.5) / w, v = (j + 0.5) / h;
  if (f === 'south') return [ox + u * sx, oy + sy * (1 - v), oz + sz];
  if (f === 'north') return [ox + sx * (1 - u), oy + sy * (1 - v), oz];
  if (f === 'east') return [ox + sx, oy + sy * (1 - v), oz + sz * (1 - u)];
  if (f === 'west') return [ox, oy + sy * (1 - v), oz + sz * u];
  if (f === 'up') return [ox + u * sx, oy + sy, oz + sz * v];
  if (f === 'down') return [ox + u * sx, oy, oz + sz * (1 - v)];
  return [ox + u * sx, oy + sy * (1 - v), oz];
}
const LIT = ((v) => { const l = Math.hypot(...v); return v.map((x) => x / l); })([-0.3, 0.9, 0.3]);
const band = (cols, l, thr = [0.55, 0.05, -0.5]) => { for (let k = 0; k < thr.length; k++) if (l > thr[k]) return cols[k]; return cols[cols.length - 1]; };
const orb = (O, R, fn) => (p, w, h, face, c) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h);
    const nx = (q[0] - O[0]) / R[0], ny = (q[1] - O[1]) / R[1], nz = (q[2] - O[2]) / R[2], L = Math.hypot(nx, ny, nz) || 1;
    const n = [nx / L, ny / L, nz / L];
    p.px(i, j, fn(n[0] * LIT[0] + n[1] * LIT[1] + n[2] * LIT[2], n, i, j));
  }
};

// ---------------------------------------------------------------- the cabbage body
const BC = [0, 11.2, 0], BR = [10.6, 9.6, 9.8];
const SPHERE = [[0.97, 0.46, 0.46], [0.46, 0.97, 0.46], [0.46, 0.46, 0.97], [0.86, 0.66, 0.66], [0.66, 0.86, 0.66], [0.66, 0.66, 0.86]];
/** wrapper leaves by latitude (scalloped rows), pale midribs by longitude, the fur belly on the front */
const bodyP = orb(BC, BR, (l, n) => {
  const lon = Math.atan2(n[0], n[2]), lat = n[1];
  // the cream belly and face: an egg-shaped window on the front, with a soft fur edge
  const bx = n[0] / 0.66, by = (lat + 0.08) / 0.78, bz = n[2];
  const fur = bz > 0.3 && bx * bx + by * by < 1;
  if (fur) { const edge = bx * bx + by * by > 0.82; return edge ? C.fur[2] : band(C.fur, l, [0.6, 0.15, -0.4]); }
  // three rows of wrapper leaves, each with a scalloped (wavy) top edge; the heart on top
  const row = (k) => -0.55 + k * 0.45 + 0.07 * Math.cos(lon * 5 + k * 1.7);
  if (lat > 0.82) return band(C.heart, l);
  const r = lat < row(0) ? 0 : lat < row(1) ? 1 : lat < row(2) ? 2 : 3, pal = r === 0 ? C.wax : r === 1 ? C.wax : r === 2 ? C.pale : C.heart;
  const top = row(Math.min(2, r)), nearEdge = r < 3 && Math.abs(lat - top) < 0.035;
  const rib = Math.abs(((lon * 5 + r * 1.7) / TAU + 10) % 1 - 0.5) < 0.025 && r < 3;
  if (nearEdge) return C.rib;
  if (rib) return r < 2 ? C.vein : C.rib;
  const vein = Math.abs((((lon * 10 + lat * 9 + r) / TAU) + 10) % 1 - 0.5) < 0.02;
  return vein ? C.vein : band(pal, l - (r === 0 ? 0.15 : 0));
});
// a leaf (ears, cape, crown): a midrib down the middle, veins branching up and out, a pale rim
const leafP = (L, o = {}) => (p, w, h, face) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const t = h > 1 ? j / (h - 1) : 0.5, u = w > 1 ? Math.abs(i / (w - 1) - 0.5) * 2 : 0;
    let c = face === 'up' ? L[0] : face === 'down' ? L[3] : L[Math.min(3, Math.floor(t * 2.2 + u * 1.2))];
    if (face === 'south' || face === 'north' || face === 'plane') {
      if (u < 0.12) c = o.rib || C.rib;
      else if ((j + Math.round(u * w * 0.5 * 0.9)) % 5 === 0) c = o.vein || C.vein;
      if (u > 0.9) c = L[0];
      if (o.bite && t < 0.22 && i > w * 0.55 && Math.hypot(i - w, j - 1) < w * 0.42) c = C.fur[3];
    }
    p.px(i, j, c);
  }
};
const furP = shade(C.fur[1], { top: C.fur[0], bottom: C.fur[3], grain: 0.06 });
const padP = (p, w, h, face) => { furP(p, w, h, face); if (face === 'south' || face === 'down') for (let i = 1; i < w - 1; i += 3) for (let j = Math.floor(h * 0.4); j < h; j++) p.px(i, j, face === 'down' ? C.pink[1] : C.fur[3]); };
const pinkP = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' || j === 0 ? C.pink[0] : face === 'down' ? C.pink[2] : C.pink[1]); };
const toothP = (p, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, j === h - 1 ? '#e0dccc' : C.tooth); };
const cabP = orb([0, 0, 0], [1, 1, 1], () => C.pale[1]);   // replaced per cube below (the held cabbage has its own centre)
const heldCab = (o, s) => { const O = [o[0] + s[0] / 2, o[1] + s[1] / 2, o[2] + s[2] / 2], R = [s[0] / 2, s[1] / 2, s[2] / 2]; return orb(O, R, (l, n) => { const lon = Math.atan2(n[0], n[2]); if (n[1] > 0.7) return band(C.heart, l); const rib = Math.abs(((lon * 4) / TAU + 10) % 1 - 0.5) < 0.04; return rib ? C.rib : band(n[1] < -0.2 ? C.wax : C.pale, l); }); };
void cabP;
/** the face window: a cut-out cream oval with soft cheek fur, drawn over the ball so the features sit on a flat plane */
const faceOvalP = (p, w, h) => {
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const d = Math.hypot((i - cx) / (w / 2), (j - cy) / (h / 2));
    if (d > 1) continue;
    const cheek = Math.hypot((i - w * 0.2) / (w * 0.16), (j - h * 0.68) / (h * 0.16)) < 1 || Math.hypot((i - w * 0.8) / (w * 0.16), (j - h * 0.68) / (h * 0.16)) < 1;
    p.px(i, j, d > 0.9 ? C.fur[2] : cheek ? C.fur[0] : j < h * 0.25 ? C.fur[0] : C.fur[1]);
  }
  // whisker dots on the muzzle
  for (const [x, y] of [[0.36, 0.66], [0.32, 0.72], [0.64, 0.66], [0.68, 0.72]]) p.px(Math.round(x * w), Math.round(y * h), C.fur[3]);
};
const tailP = shade(C.fur[0], { top: '#ffffff', bottom: C.fur[2], grain: 0.1 });

// ---------------------------------------------------------------- geometry
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const ball = SPHERE.map(([a, b, c]) => P([BC[0] - BR[0] * a, BC[1] - BR[1] * b, BC[2] - BR[2] * c], [2 * BR[0] * a, 2 * BR[1] * b, 2 * BR[2] * c], bodyP));
const FZ = BC[2] + BR[2] * 0.97 + 0.06;            // the face plane, just in front of the ball
const EYES = eyeRig({ style: 'gen9', chunk: 1, shape: 'sharp', sclera: true, iris: '#f07a1a', irisDark: '#a83a0a', irisSize: 0.55, pupil: 'round', shine: 2, line: C.line, at: [-3.4, 13.0, FZ + 0.04], size: [4.6, 3.8] });
const MOUTH = mouthRig({ at: [0, 7.4, FZ + 0.04], size: [6.0, 2.6], states: ['grit', 'frown', 'o', 'grin', 'flat', 'smile', 'wavy'], def: 'frown', line: C.line, inner: '#6a2a2a', tongue: '#f4889a', chunk: 1 });
const EAR = (s) => {
  const x = s * 3.4, n = s < 0 ? 'R' : 'L';
  return [{ name: 'ear' + n, parent: 'body', pivot: [x, 19.4, -0.6], rot: [-8, 0, s * -12], cubes: [P([x - 2.5, 19.0, -1.4], [5.0, 13.6, 1.4], leafP(C.pale, { bite: s > 0 }), { faces: { up: leafP(C.heart), north: leafP(C.wax) } })] },
    { name: 'ear' + n + '2', parent: 'ear' + n, pivot: [x, 28.4, -0.6], rot: [10, 0, 0], cubes: [P([x - 2.1, 28.0, -1.2], [4.2, 5.4, 1.0], leafP(C.heart, { bite: s > 0 }))] }];
};
const CROWN = [[-1.6, -24], [1.6, 24], [0, -6], [-0.4, 170], [0.8, 200]];
export const def = {
  name: 'kohlossus', ppu: 3, scale: 1.35, outline: { color: C.ink, px: 1.6 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    // big flat rabbit feet with pink pads
    { name: 'footR', parent: 'root', pivot: [-5.4, 1.2, 0], cubes: [P([-8.6, 0, -3.0], [6.4, 2.6, 10.6], padP), P([-8.2, 0.6, 7.2], [5.6, 1.8, 1.0], furP)] },
    { name: 'footL', parent: 'root', pivot: [5.4, 1.2, 0], cubes: [P([2.2, 0, -3.0], [6.4, 2.6, 10.6], padP, { mirror: true }), P([2.6, 0.6, 7.2], [5.6, 1.8, 1.0], furP)] },
    { name: 'body', parent: 'root', pivot: [0, 2.2, 0], cubes: [
      ...ball,
      // the face window and cheek tufts
      P([-6.6, 5.6, FZ - 0.02], [13.2, 11.2, 0], faceOvalP, { plane: 'z', outline: false }),
      P([-10.8, 7.0, 3.2], [0, 4.2, 4.2], faceOvalP, { plane: 'x', outline: false }), P([10.8, 7.0, 3.2], [0, 4.2, 4.2], faceOvalP, { plane: 'x', outline: false }),
    ] },
    { name: 'nose', parent: 'body', pivot: [0, 10.4, FZ], cubes: [P([-1.2, 9.5, FZ - 0.3], [2.4, 1.6, 1.0], pinkP)] },
    { name: 'teeth', parent: 'body', pivot: [0, 8.2, FZ], cubes: [P([-1.25, 6.9, FZ - 0.1], [1.15, 1.5, 0.45], toothP), P([0.1, 6.9, FZ - 0.1], [1.15, 1.5, 0.45], toothP)] },
    { name: 'mouth', parent: 'body', pivot: [0, 8.4, FZ], cubes: MOUTH.cubes },
    ...EYES.bones.map((b) => Object.assign(b, { parent: 'body' })),
    ...EAR(-1), ...EAR(1),
    // the crown of pale heart leaves between the ears
    { name: 'crown', parent: 'body', pivot: [0, 20.4, 0], cubes: CROWN.map(([x, yaw]) => P([x - 1.6, 19.6, -0.4], [3.2, 3.6, 0], leafP(C.heart), { plane: 'z', pivot: [x, 20, 0], rot: [0, yaw, x * 8], outline: false })) },
    // three dark outer leaves hanging down the back like a cape
    { name: 'cape', parent: 'body', pivot: [0, 17.4, -8.6], cubes: [
      P([-6.8, 6.4, -10.6], [6.2, 11.4, 1.0], leafP(C.wax), { pivot: [-3.6, 17, -9.8], rot: [6, 0, 10] }),
      P([0.6, 6.4, -10.6], [6.2, 11.4, 1.0], leafP(C.wax), { pivot: [3.6, 17, -9.8], rot: [6, 0, -10] }),
      P([-3.4, 4.6, -11.0], [6.8, 13.2, 1.0], leafP(C.wax), { pivot: [0, 17, -10], rot: [10, 0, 0] }),
    ] },
    { name: 'tail', parent: 'body', pivot: [0, 5.4, -10], cubes: [P([-2.6, 3.4, -12.4], [5.2, 4.8, 3.2], tailP), P([-0.4, 8.2, -11.4], [0.8, 1.8, 0.8], '#6aa252'), P([-1.4, 9.6, -11.4], [2.8, 1.4, 0], leafP(C.pale), { plane: 'z' })] },
    // stubby paws; the left one holds the spare cabbage
    { name: 'armR', parent: 'body', pivot: [-9.6, 11.4, 2.0], rot: [0, 0, -12], cubes: [P([-13.4, 6.4, -0.4], [4.4, 6.6, 4.8], furP), P([-13.6, 5.6, 0.4], [4.0, 1.6, 4.0], padP)] },
    { name: 'armL', parent: 'body', pivot: [9.6, 11.4, 2.0], rot: [-20, 0, 12], cubes: [P([9.0, 6.4, -0.4], [4.4, 6.6, 4.8], furP), P([9.6, 5.6, 0.4], [4.0, 1.6, 4.0], padP)] },
    { name: 'cab', parent: 'armL', pivot: [12, 5, 3.4], cubes: [P([8.6, 2.2, 2.2], [6.6, 4.4, 5.0], heldCab([8.6, 1.4, 1.4], [6.6, 6.0, 6.6]), { id: 'heldcab' }), P([9.4, 1.4, 1.4], [5.0, 6.0, 6.6], heldCab([8.6, 1.4, 1.4], [6.6, 6.0, 6.6]), { id: 'heldcab' }), P([9.4, 2.2, 0.6], [5.0, 4.4, 8.2], heldCab([8.6, 1.4, 1.4], [6.6, 6.0, 6.6]), { id: 'heldcab' })] },
  ],
  attach: {
    head: { bone: 'crown', at: [0, 21.4, 0], size: 12 },
    face: { bone: 'body', at: [0, 13, FZ], size: 12 },
    neck: { bone: 'body', at: [0, 5, FZ], size: 12 },
    back: { bone: 'cape', at: [0, 12, -10.8], size: 12 },
  },
};

// ---------------------------------------------------------------- animation
const TOP = [0, 22, 0], FRONT = [0, 9, FZ + 1], HAND = [12, 4, 4];
const ears = (P, spread, back = 0, flop = 0) => P.rot('earR', back, 0, -spread).rot('earL', back, 0, spread).rot('earR2', flop, 0, 0).rot('earL2', flop * 1.2, 0, 0);
/** squash the body down by dy (units) while the feet stay planted */
const squat = (P, dy) => P.pos('body', 0, dy, 0).sq('body', dy * 0.02);
const mouth = (P, s) => P.face('mouth', s);
export const anim = {
  start: 'idle', seed: 77,
  breathe: { bone: 'body', amp: 0.025, per: 2.8 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.4], dur: 0.14 },
  look: { bone: 'body', yaw: 10, pitch: 5, speed: 2.5 },
  springs: [
    { bone: 'earR2', tip: [0, 5, 0], k: 120, d: 7, gain: 1.0, max: 30 },
    { bone: 'earL2', tip: [0, 5, 0], k: 125, d: 7, gain: 1.0, max: 30 },
    { bone: 'earR', tip: [0, 10, 0], k: 170, d: 9, gain: 0.5, max: 14 },
    { bone: 'earL', tip: [0, 10, 0], k: 175, d: 9, gain: 0.5, max: 14 },
    { bone: 'cape', tip: [0, -8, -1], k: 110, d: 7, gain: 0.8, max: 24, axes: [1, 0.2, 1] },
    { bone: 'tail', tip: [0, 0, -2.6], k: 220, d: 10, gain: 0.8, max: 20 },
    { bone: 'crown', tip: [0, 3, 0], k: 230, d: 10, gain: 0.5, max: 14 },
  ],
  faces: { eyes: Object.assign({}, EYES.slot, { default: 'angry' }), mouth: MOUTH.slot, cab: { default: 'on', states: { on: ['heldcab'], off: [] } } },
  fidget: { every: [4, 8], clips: ['munch', 'stomp', 'angry'] },
  clips: {
    // grumpy guard duty: a heavy slow breathe, the ears twitching, a suspicious glance left and right, a huff
    idle: { len: 3.2, loop: true, f(P, t, c) {
      const br = Math.sin((t / 3.2) * TAU), huff = bump(t, 2.2, 2.6) * (c.loopN % 2);
      squat(P, -0.4 * (br * 0.5 + 0.5) - 0.8 * huff); P.rot('body', 0, wave(t, 1 / 3.2) * 4, 0);
      ears(P, 4 + br * 2, -4, 6 * bump(t, 0.6, 0.9) + 8 * huff);
      P.rot('armR', 0, 0, -br * 3).rot('armL', -20 + br * 3, 0, br * 3);
      P.scl('nose', 1 + 0.12 * Math.abs(Math.sin(t * 22)) * bump(t, 1.2, 1.6), 1, 1);
      eyesAt(P, ...glance(t + c.loopN * 1.3, [[0, 0], [-0.35, 0], [-0.35, 0], [0.35, 0], [0, 0]], 0.64, 0.06));
      mouth(P, huff > 0.3 ? 'grit' : 'frown');
      P.burst(2.3, 'steam', 'body', [-1.6, 10, FZ + 1], { n: 2 }).burst(2.3, 'steam', 'body', [1.6, 10, FZ + 1], { n: 2 });
    } },
    // a heavy waddle: rolling side to side, each foot slapping down
    walk: { len: 0.9, loop: true, f(P, t) {
      const ph = (t / 0.9) * TAU, s = Math.sin(ph), lr = Math.max(0, s), ll = Math.max(0, -s), dy = Math.abs(Math.cos(ph));
      P.pos('body', s * 0.8, dy * 0.8, 0).rot('body', 3, s * 4, -s * 9).sq('body', -0.04 * (1 - dy));
      P.pos('footR', 0, lr * 1.6, s * 2).rot('footR', -18 * lr, 0, 0).pos('footL', 0, ll * 1.6, -s * 2).rot('footL', -18 * ll, 0, 0);
      P.rot('armR', -s * 20, 0, -8).rot('armL', -20 + s * 20, 0, 8); ears(P, 6, -6 * dy, 10 * dy);
      mouth(P, 'frown');
    } },
    run: { len: 0.6, loop: true, f(P, t) {
      const h = hop(t, 0.6, 2.4, { crouch: 0.8, air: [0.2, 0.62] });
      if (h.air) P.pos('root', 0, h.y, 0); else squat(P, h.y);
      P.sq('body', h.sq * 0.7).rot('body', h.air ? -8 : 4, 0, 0);
      const k = h.air ? Math.sin(h.k * Math.PI) : 0;
      P.rot('footR', 26 * k, 0, 0).rot('footL', 26 * k, 0, 0).rot('armR', -40 * k, 0, -10).rot('armL', -40 * k, 0, 10); ears(P, 10, -16 * k, 14 * k);
      mouth(P, 'grit');
    } },
    // battle cry: it rears up, ears snap upright, the cape flares, a huge stomp and a bellow
    cry: { len: 2.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const crouch = bump(t, 0.05, 0.4), up = seg(t, 0.35, 0.6, E.back) * (1 - seg(t, 1.3, 1.6, E.inout)), stomp = seg(t, 1.25, 1.35, E.in3);
      squat(P, -2.2 * crouch + 1.6 * up - 2.6 * bump(t, 1.3, 1.6)); P.rot('body', -14 * up + 6 * stomp, 0, 0);
      ears(P, 2 - 4 * up, -20 * up, -10 * up); P.rot('armR', -100 * up, 0, -30 * up).rot('armL', -120 * up, 0, 30 * up);
      P.rot('cape', -30 * up, 0, 0).pos('footR', 0, 3 * bump(t, 0.9, 1.3), 0);
      P.face('eyes', up > 0.3 ? 'angry' : 'angry'); eyesScale(P, 1 + 0.1 * up, 1 + 0.15 * up); mouth(P, up > 0.2 ? 'o' : 'grit');
      P.burst(1.3, 'dust', 'root', [-6, 0, 2], { n: 12 }).burst(1.3, 'rock', 'root', [-6, 0, 3], { n: 5 }).burst(0.7, 'anger', 'body', [8, 20, 4], {}).burst(0.75, 'leaf', 'crown', TOP, { n: 6 });
    } },
    // ANGRY: it puffs up, stamps a foot over and over, steam from its nostrils, ears pinned back
    angry: { len: 1.8, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const puff = seg(t, 0, 0.25, E.back) * (1 - seg(t, 1.5, 1.8)), stamp = Math.max(0, Math.sin(t * TAU * 3.2)) * puff;
      P.scl('body', 1 + 0.06 * puff, 1 + 0.04 * puff, 1 + 0.06 * puff).pos('footR', 0, 2.2 * stamp, 0.4 * stamp).rot('footR', -24 * stamp, 0, 0);
      squat(P, -0.6 * (1 - stamp) * puff); ears(P, -6 * puff, -26 * puff, 8 * puff); P.rot('armR', -30 * puff, 0, -40 * puff).rot('armL', -50 * puff, 0, 30 * puff);
      P.rot('body', wave(t, 6) * 2 * puff, 0, wave(t, 3.2) * 3 * puff);
      P.face('eyes', 'angry'); mouth(P, 'grit');
      P.stream('steam', 'body', [-1.4, 10.6, FZ + 1], { rate: 14 * puff, dir: [-0.4, 0.4, 1], speed: 1.2 }).stream('steam', 'body', [1.4, 10.6, FZ + 1], { rate: 14 * puff, dir: [0.4, 0.4, 1], speed: 1.2 });
      for (const k of [0.15, 0.46, 0.78, 1.09, 1.4]) P.burst(k, 'dust', 'footR', [-5.4, 0, 3], { n: 4 });
      P.burst(0.3, 'anger', 'body', [8, 21, 4], {}).burst(1.0, 'anger', 'body', [-8, 21, 4], {});
    } },
    // STOMP: one enormous foot raised high, held… and slammed down (the ground shakes)
    stomp: { len: 1.6, next: 'idle', f(P, t) {
      const lift = seg(t, 0.05, 0.6, E.out) * (1 - seg(t, 0.62, 0.72, E.in3)), hit = bump(t, 0.7, 1.1);
      P.pos('footL', 0, 7 * lift, 2 * lift).rot('footL', -30 * lift, 0, 0).rot('body', 0, 0, -14 * lift + 6 * hit).pos('body', -1.4 * lift, 1.2 * lift - 2.4 * hit, 0).sq('body', -0.1 * hit);
      ears(P, 6 + 6 * lift, -10 * lift, -14 * lift + 22 * hit); P.rot('armR', 0, 0, -50 * lift).rot('armL', -20, 0, 60 * lift);
      P.face('eyes', 'angry'); eyesScale(P, 1, 1 - 0.3 * hit); mouth(P, lift > 0.3 ? 'grit' : hit > 0.2 ? 'o' : 'frown');
      P.burst(0.72, 'dust', 'root', [5.4, 0, 4], { n: 16 }).burst(0.72, 'rock', 'root', [5.4, 0, 4], { n: 6 }).burst(0.74, 'ring', 'root', [5.4, 0.2, 2], { scale: 1.2 }).burst(0.8, 'leaf', 'crown', TOP, { n: 5 });
    } },
    // physical: winds up and hurls its spare cabbage, then pulls another out of its ruff
    attack: { len: 1.3, next: 'idle', f(P, t) {
      const back = seg(t, 0, 0.36, E.out) * (1 - seg(t, 0.36, 0.44, E.in)), thr = seg(t, 0.38, 0.5, E.in3) * (1 - seg(t, 0.7, 1.1, E.inout));
      P.rot('armL', -20 - 120 * back + 150 * thr, 30 * back, 30 * back).rot('body', 0, 24 * back - 30 * thr, 0).pos('root', 0, 0, -1 * back + 2.4 * thr);
      squat(P, -1.2 * back); P.face('cab', t > 0.46 && t < 1.05 ? 'off' : 'on').scl('cab', t > 1.05 ? seg(t, 1.05, 1.2, E.back) : 1);
      P.face('eyes', 'angry'); mouth(P, thr > 0.3 ? 'o' : 'grit');
      P.burst(0.47, 'leaf', 'armL', HAND, { n: 8, dir: [0, 0.3, 1], speed: 3 }).burst(0.48, 'dust', 'root', [0, 0, 4], { n: 4 });
    } },
    // special: the BELLY FLOP — a crouch, a heavy leap, a tuck, and a quake-sized landing flat on its belly
    special: { len: 2.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const crouch = bump(t, 0.0, 0.45) * 1.2, rise = seg(t, 0.4, 0.75, E.out) * (1 - seg(t, 0.75, 1.0, E.in3)), flat = seg(t, 0.95, 1.02, E.in3) * (1 - seg(t, 1.5, 1.9, E.inout));
      P.pos('root', 0, 9 * rise, 2 * rise + 3 * flat).rot('root', 70 * flat + 20 * rise, 0, 0); squat(P, -2.6 * crouch);
      P.sq('body', -0.18 * flat + 0.12 * rise + wob(t, 1.0, -0.08, 4, 6)); P.rot('armR', -150 * rise - 40 * flat, 0, -40).rot('armL', -150 * rise - 40 * flat, 0, 40);
      ears(P, 10, -30 * rise - 50 * flat, 20 * flat); P.rot('footR', 40 * rise, 0, 0).rot('footL', 40 * rise, 0, 0);
      P.face('eyes', flat > 0.3 ? 'shut' : 'angry'); mouth(P, rise > 0.3 ? 'o' : 'grit');
      P.burst(1.0, 'dust', 'root', [0, 0, 8], { n: 24, speed: 3 }).burst(1.0, 'rock', 'root', [0, 0, 8], { n: 8 }).burst(1.02, 'ring', 'root', [0, 0.2, 8], { scale: 2 }).burst(1.02, 'leaf', 'body', TOP, { n: 12, speed: 2 });
    } },
    // cast: shakes itself like a wet dog — compost, leaves and spores fly
    cast: { len: 1.5, next: 'idle', f(P, t) {
      const k = seg(t, 0.1, 0.3) * (1 - seg(t, 1.1, 1.4)), sh = Math.sin(t * TAU * 6) * k;
      P.rot('body', 0, sh * 18, sh * 10).rot('root', 0, sh * 6, 0); ears(P, 8 + sh * 20, -6, sh * 30); P.rot('cape', 0, sh * 20, 0);
      P.face('eyes', 'shut'); mouth(P, 'grit');
      P.stream('leaf', 'body', TOP, { rate: 22 * k, dir: [0, 1, 0], speed: 3, spread: 1 }).stream('dust', 'body', [0, 6, 0], { rate: 16 * k, speed: 2, spread: 1 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.2, 0.7, E.inout));
      P.pos('root', 0, 0.6 * k, -2.4 * k).rot('body', -12 * k + wob(t, 0.2, 3, 3, 6), 0, 0).sq('body', -0.12 * k); ears(P, 14 * k, -20 * k, 30 * k);
      P.rot('armR', 0, 0, -40 * k).rot('armL', -20, 0, 40 * k); P.face('eyes', t < 0.4 ? 'x' : 'angry'); mouth(P, t < 0.4 ? 'o' : 'grit'); P.blinkOK = false;
      P.burst(0.02, 'leaf', 'body', [0, 16, 6], { n: 6 }).burst(0.06, 'sweat', 'body', [9, 18, 4], {});
    } },
    // it wobbles, totters, and topples onto its back with its feet in the air
    faint: { len: 2.2, next: 'down', f(P, t) {
      const tot = seg(t, 0, 0.9) * (1 - seg(t, 1.0, 1.1)), fall = seg(t, 1.0, 1.45, E.bounce);
      P.rot('body', 0, 0, wave(t, 1.6) * 10 * tot).rot('root', -84 * fall, 0, 0).pos('root', 0, 7 * fall, 9 * fall);
      P.rot('footR', 50 * fall, 0, 0).rot('footL', 50 * fall, 0, 0); ears(P, 30 * fall, 30 * fall, 30 * fall);
      P.face('eyes', t < 1.0 ? 'sad' : 'swirl'); mouth(P, 'wavy'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.0, 'star', 'body', [0, 22, 2], { n: 5 }).burst(1.42, 'dust', 'root', [0, 0, 0], { n: 14 }).burst(1.42, 'leaf', 'body', TOP, { n: 10 });
    } },
    down: { len: 3.0, loop: true, f(P, t) {
      P.rot('root', -84, 0, 0).pos('root', 0, 7, 9).rot('footR', 50 + 8 * bump(t, 0.8, 1.2), 0, 0).rot('footL', 50, 0, 0); ears(P, 30, 30, 30);
      P.face('eyes', 'swirl'); mouth(P, 'wavy'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.6;
    } },
    // victory: a smug little hop, the cabbage held up high like a trophy, a happy wiggle of the ears
    win: { len: 2.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const h = hop(t, 1.1, 3, { crouch: 0.8, air: [0.2, 0.6] }), raise = seg(t, 0.3, 0.6, E.back) * (1 - seg(t, 1.8, 2.15));
      if (h.air) P.pos('root', 0, h.y, 0); else squat(P, h.y);
      P.rot('armL', -20 - 150 * raise, 0, -20 * raise).rot('armR', -40 * raise, 0, -30 * raise); ears(P, 6 + 10 * Math.sin(t * 12) * raise, -6, 0);
      P.face('eyes', 'happy'); mouth(P, 'grin');
      P.burst(0.6, 'sparkle', 'armL', HAND, { n: 6 }).burst(0.65, 'leaf', 'crown', TOP, { n: 6 });
    } },
    sleep: { len: 3.6, loop: true, f(P, t) {
      const br = Math.sin((t / 3.6) * TAU);
      squat(P, -1.8 + br * 0.4); P.rot('body', 6, 0, 4); ears(P, 22, 30, 40); P.rot('armR', -10, 0, 8).rot('armL', -40, 0, -8);
      P.face('eyes', 'closed'); mouth(P, 'flat'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'body', [6, 22, 4], {}).burst(2.0, 'z', 'body', [6, 22, 4], {});
    } },
    // fidget: takes a big crunchy bite of its cabbage, chews furiously, looks around guiltily
    munch: { len: 2.6, next: 'idle', f(P, t) {
      const lift = seg(t, 0.05, 0.4, E.back) * (1 - seg(t, 1.9, 2.3)), chew = lift * Math.max(0, Math.sin(t * TAU * 5));
      P.rot('armL', -20 - 70 * lift, -40 * lift, -30 * lift).rot('body', 4 * lift, 0, 0); P.pos('teeth', 0, -0.4 * chew, 0).scl('body', 1 + 0.02 * chew, 1, 1);
      ears(P, 4, -4, 10 * chew); P.face('eyes', t > 1.9 ? 'angry' : 'happy'); mouth(P, chew > 0.3 ? 'o' : 'flat');
      for (const k of [0.5, 0.9, 1.3, 1.7]) P.burst(k, 'leaf', 'armL', [11, 7, 6], { n: 2, speed: 1 });
      eyesAt(P, ...glance(t, [[0, 0], [0, 0], [0, 0], [-0.4, 0], [0.4, 0]], 0.5, 0.05));
    } },
  },
};
def.anim = anim;
