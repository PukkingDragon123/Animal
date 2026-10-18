// Woodbub — a carved wooden baby (Hydro), the first stage of the Nirvana line. Pale lacquered
// birch with a wandering grain and the odd knot, walnut pegs at every joint, a single curl of wood
// shaving for hair. It never touches the ground: it drifts and swims as if underwater, bubbles
// streaming off it. A split-cane fishing rod is pegged into a socket in its back and arcs over its
// head; on the hook dangles a creased dollar bill, always just out of reach in front of its face —
// and it keeps reaching for it. (An original homage to the swimming-baby album cover: no likeness.)
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { B, flipX, twin, rod, eyeKit, eyeCubes, eyeFaces, fill, isSide, mix, shift, cyc } from './nt_common.js';
import { PALE, WALNUT, INK, wood, woodFace, brass, chromeP, cane, corkP, lineP, hookP, billP, CHROME, mixM } from './nirvana_parts.js';

// ---------------------------------------------------------------- painters
const W1 = wood(PALE, { seed: 3 }), W2 = wood(PALE, { seed: 7, per: 6 }), W3 = wood(PALE, { seed: 11 }), W4 = wood(PALE, { seed: 17, per: 6 });
const WL = wood(WALNUT, { seed: 5, per: 4, knots: 0 });
const WL2 = wood(WALNUT, { seed: 9, per: 3, knots: 0, rings: false });
// the belly: a carved navel and the round of the tummy
const bellyP = (p, w, h, face, cube) => {
  W2(p, w, h, face, cube);
  if (face !== 'south') return;
  const cx = (w - 1) / 2, cy = h * 0.55;
  p.px(Math.floor(cx), Math.round(cy), PALE.deep); p.px(Math.ceil(cx), Math.round(cy), PALE.lo); p.px(Math.floor(cx), Math.round(cy) - 1, PALE.lo);
  for (let x = 1; x < w - 1; x++) { const y = Math.round(h - 2 - Math.sin((x / (w - 1)) * Math.PI) * 1.2); p.px(x, y, mixM(PALE.base, PALE.lo, 0.6)); }
};
// the hips block: a seam where the carved pieces meet
const hipsP = (p, w, h, face, cube) => { W3(p, w, h, face, cube); if (isSide(face)) for (let x = 0; x < w; x++) { p.px(x, 0, PALE.deep); p.px(x, 1, PALE.spec); } };
// the back: a walnut-ringed socket the rod is pegged into is a separate cube; here a few carving marks
const backP = (p, w, h, face, cube) => { W1(p, w, h, face, cube); };
// the face: plain lacquered wood, a soft chisel line under the brow
const faceP = (p, w, h, face, cube) => {
  woodFace(PALE, { seed: 21 })(p, w, h, face, cube);
};
const browP = (p, w, h, face, cube) => {
  woodFace(PALE, { seed: 23 })(p, w, h, face, cube);
  if (face === 'south') for (let x = 1; x < w - 1; x++) p.px(x, h - 1, PALE.lo);
};
// little carved toes and fingers
const footP = (p, w, h, face, cube) => {
  W4(p, w, h, face, cube);
  if (face === 'up') for (let k = 1; k < 4; k++) { const x = Math.round((w * k) / 4); for (let y = Math.max(0, h - 4); y < h; y++) p.px(x, y, PALE.lo); }
  if (face === 'south') for (let k = 1; k < 4; k++) { const x = Math.round((w * k) / 4); for (let y = 0; y < h; y++) p.px(x, y, PALE.lo); }
};
const handP = (p, w, h, face, cube) => {
  W4(p, w, h, face, cube);
  if (face === 'down' || face === 'south' || face === 'north') for (let k = 1; k < 3; k++) { const x = Math.round((w * k) / 3); for (let y = Math.max(0, h - 3); y < h; y++) p.px(x, y, PALE.lo); }
};
// a curled wood shaving: a ribbon rising from the scalp and winding into a loose spiral
const shaving = (o = {}) => (p, w, h) => {
  const cx = (w - 1) / 2 + (o.dx || 0), cy = h * 0.4, R0 = Math.min(w, h) * 0.36, turns = o.turns || 1.35;
  for (let y = h - 1; y > cy + R0 - 0.5; y--) { p.px(Math.round(cx), y, '#c08a4a'); p.px(Math.round(cx) + 1, y, '#f6d8a0'); }
  for (let a = 0; a < turns * Math.PI * 2; a += 0.03) {
    const r = R0 * (1 - a / (turns * Math.PI * 2 + 1.2)), x = cx + Math.sin(a) * r * (o.flip ? -1 : 1), y = cy + Math.cos(a) * r;
    const nx = Math.sin(a) * (o.flip ? -1 : 1), ny = Math.cos(a);
    p.px(Math.round(x), Math.round(y), '#c08a4a');
    p.px(Math.round(x - nx * 0.9), Math.round(y - ny * 0.9), a < 2 ? '#fde6b6' : '#efc888');
  }
};
// mouth states (a small carved mouth, dark inside)
const MOUTHS = {
  o: (p, w, h) => { const cx = (w - 1) / 2, cy = (h - 1) / 2; fill(p, w, h, (x, y) => { const d = ((x - cx) / 1.25) ** 2 + ((y - cy) / 1.3) ** 2; return d <= 1 ? (d > 0.45 ? '#4a2010' : '#7a3424') : null; }); },
  smile: (p, w, h) => { for (let x = 1; x < w - 1; x++) { const y = Math.round(h * 0.3 + Math.sin((x / (w - 1)) * Math.PI) * h * 0.4); p.px(x, y, '#4a2010'); } },
  open: (p, w, h) => { const cx = (w - 1) / 2, cy = (h - 1) / 2; fill(p, w, h, (x, y) => { const d = ((x - cx) / (w / 2)) ** 2 + ((y - cy) / (h / 2)) ** 2; return d <= 1 ? (d > 0.6 ? '#4a2010' : y > cy + 0.3 ? '#c85a5a' : '#6a2818') : null; }); },
  flat: (p, w, h) => { for (let x = 1; x < w - 1; x++) p.px(x, Math.round(h / 2), '#4a2010'); },
};

// ---------------------------------------------------------------- eyes
// painted on the carved face: big rounded kawaii eyes, a deep pool-blue iris with a caustic-blue glow
// in the lower third
const EYES = eyeKit({ iris: '#16222e', irisHi: '#1e3446', accent: ['#2a74a8', '#62c4ec'], line: '#1a0e08', shape: 'round' });
const EYE_STATES = { open: EYES.open, sleepy: EYES.sleepy, sad: EYES.sad, angry: EYES.angry, happy: EYES.happy, closed: EYES.closed, hurt: EYES.hurt, swirl: EYES.swirl };

// ---------------------------------------------------------------- the rod (model coordinates)
const A = [-2.4, 15.0, -4.15], Bp = [-5.6, 22.4, -5.7], Cp = [-6.7, 28.4, -3.7], Dp = [-6.3, 33.0, 0.4], Ep = [-4.1, 34.8, 4.6], F = [-1.6, 34.2, 8.2];
const LINE = 10.2, H = [F[0], F[1] - LINE, F[2]];
const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const reelAt = lerp3(A, Bp, 0.36);
const ROD = {
  base: [
    rod(lerp3(A, Bp, -0.08), lerp3(A, Bp, 0.1), 1.67, 1.67, WL2),                               // the walnut socket collar
    rod(A, lerp3(A, Bp, 0.3), 1.17, 1.17, corkP),                                               // cork grip
    rod(lerp3(A, Bp, 0.3), Bp, 1.0, 1.0, cane({ per: 9 }), { over: 0.3 }),
    rod(Bp, Cp, 0.9, 0.9, cane({ per: 10, off: 3 }), { over: 0.3 }),
    // the reel: a little chrome spool on the outer side, a crank handle
    B([reelAt[0] - 2.3, reelAt[1] - 1.1, reelAt[2] - 1.1], [1.33, 2.2, 2.2], chromeP),
    B([reelAt[0] - 2.3, reelAt[1] - 1.1, reelAt[2] - 1.1], [1.33, 2.2, 2.2], chromeP, { pivot: [reelAt[0] - 1.63, reelAt[1], reelAt[2]], rot: [45, 0, 0] }),
    B([reelAt[0] - 1.1, reelAt[1] - 0.4, reelAt[2] - 0.4], [0.8, 0.8, 0.8], chromeP),
    B([reelAt[0] - 2.75, reelAt[1] - 0.2, reelAt[2] - 0.2], [0.45, 0.4, 1.7], chromeP, { outline: false }),
    B([reelAt[0] - 3.05, reelAt[1] - 0.25, reelAt[2] + 1.1], [0.6, 0.5, 0.5], brass(), { outline: false }),
  ],
  mid: [rod(Cp, Dp, 0.8, 0.8, cane({ per: 10, off: 5 }), { over: 0.3 }), rod(Dp, Ep, 0.72, 0.72, cane({ per: 10, off: 1 }), { over: 0.3 })],
  tip: [rod(Ep, F, 0.62, 0.62, cane({ per: 11, off: 7 }), { over: 0.2 }), B([F[0] - 0.4, F[1] - 0.4, F[2] - 0.2], [0.8, 0.8, 0.8], chromeP)],
};
const BILL_TOP = H[1] - 0.75;

// ---------------------------------------------------------------- the model
const HEAD_Y = 21.33;
export const def = {
  name: 'woodbub', ppu: 3, scale: 0.3, outline: { color: INK, px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    // the torso swims tilted forward a little (rest pose); everything hangs off it
    { name: 'body', parent: 'root', pivot: [0, 17, 0], rot: [14, 0, 0], cubes: [
      B([-4.33, 12.67, -3.5], [8.67, 8.33, 7], W1, { faces: { north: backP } }),
      B([-4.83, 13.33, -3.0], [9.67, 5.0, 6.0], W2),
      B([-3.5, 13.67, 3.5], [7.0, 5.0, 1.17], bellyP),
      B([-3.83, 21.0, -3.0], [7.67, 0.5, 6.0], W1),
      B([-4.17, 10.67, -3.17], [8.33, 2.67, 6.33], hipsP),
      B([-3.5, 10.0, -2.83], [7.0, 0.67, 5.67], W3),
      B([-2.17, 20.67, -1.83], [4.33, 1.17, 3.67], WL),                                          // the neck peg
      B([-5.0, 18.27, -1.33], [0.67, 2.67, 2.67], WL), B([4.33, 18.27, -1.33], [0.67, 2.67, 2.67], WL, { mirror: true }),   // shoulder pegs
    ] },
    { name: 'head', parent: 'body', pivot: [0, 21.3, 0.2], rot: [-6, 0, 0], cubes: [
      B([-5.17, HEAD_Y, -4.67], [10.33, 9.33, 9.33], W1, { faces: { south: faceP } }),
      B([-5.67, 22.17, -2.83], [11.33, 4.33, 7.17], W2),                                         // chubby cheeks
      B([-3.83, 20.83, -2.33], [7.67, 0.5, 6.33], W3),                                            // under the chin
      B([-4.5, 30.67, -4.0], [9.0, 0.67, 8.0], W3),                                              // the crown of the head
      B([-4.5, 22.5, -5.33], [9.0, 7.0, 0.67], W2),                                              // back of the head
      B([-4.5, 26.83, 4.67], [9.0, 3.5, 0.5], browP),                                            // the brow
      B([-5.83, 24.17, -1.0], [0.67, 2.33, 1.67], W4), B([5.17, 24.17, -1.0], [0.67, 2.33, 1.67], W4, { mirror: true }),   // ears
      B([-0.83, 23.33, 4.67], [1.67, 1.17, 0.67], W3),                                           // button nose
      ...eyeCubes(EYE_STATES, 'open', [-4.0, 23.5, 4.69], [2.67, 3.0, 0]),
      ...Object.entries(MOUTHS).map(([k, fn]) => B([-1.17, 21.9, 4.69], [2.33, 1.33, 0], fn, { plane: 'z', id: 'mouth-' + k, hide: k !== 'o' })),
    ] },
    { name: 'curl', parent: 'head', pivot: [0.3, 31.2, 1.6], cubes: [
      B([0.3, 31.0, -0.6], [0, 4.33, 4.67], shaving({ turns: 1.4 }), { plane: 'x' }),
      B([-1.9, 31.0, 1.6], [4.33, 4.33, 0], shaving({ turns: 1.2, flip: true, dx: 0.5 }), { plane: 'z' }),
    ] },
    ...twin({ name: 'armR', parent: 'body', pivot: [-5.4, 19.6, 0], cubes: [
      B([-7.33, 15.67, -1.33], [2.67, 4.33, 2.67], W2),
    ] }),
    ...twin({ name: 'foreR', parent: 'armR', pivot: [-6.0, 16.0, 0], cubes: [
      B([-7.17, 12.67, -1.17], [2.33, 3.67, 2.33], W3),
      B([-7.33, 10.67, -1.33], [2.67, 2.33, 2.67], handP),
      B([-6.33, 11.33, 1.33], [0.83, 1.33, 0.83], W4),                                           // thumb
      B([-7.6, 15.17, -0.67], [0.5, 1.33, 1.33], WL),                                            // elbow peg
    ] }),
    ...twin({ name: 'legR', parent: 'body', pivot: [-2.33, 12.0, 0], cubes: [
      B([-3.83, 7.33, -1.67], [3.0, 4.33, 3.33], W2),
    ] }),
    ...twin({ name: 'shinR', parent: 'legR', pivot: [-2.33, 7.67, 0], cubes: [
      B([-3.67, 4.33, -1.33], [2.67, 3.67, 2.67], W3),
      B([-3.83, 3.17, -1.5], [3.0, 1.33, 4.33], footP),
      B([-4.1, 7.0, -0.67], [0.5, 1.33, 1.33], WL),                                              // knee peg
    ] }),
    // the rod: pegged into the back, arcing up past the right side of the head and out over the face
    { name: 'rodA', parent: 'body', pivot: A, cubes: ROD.base },
    { name: 'rodB', parent: 'rodA', pivot: Cp, cubes: ROD.mid },
    { name: 'rodC', parent: 'rodB', pivot: Ep, cubes: ROD.tip },
    // the line hangs plumb (its rest pose undoes the body's swim tilt), the hook and the bill below
    { name: 'line', parent: 'rodC', pivot: F, rot: [-14, 0, 0], cubes: [
      B([F[0] - 0.17, H[1], F[2] - 0.17], [0.33, LINE, 0.33], lineP, { outline: false }),
      B([F[0], H[1] - 1.0, F[2] - 0.6], [0, 1.33, 1.0], hookP, { plane: 'x' }),
    ] },
    { name: 'bill', parent: 'line', pivot: [H[0], BILL_TOP, H[2]], cubes: [
      B([H[0] - 3.17, BILL_TOP - 2.67, H[2]], [3.17, 2.67, 0], billP(-1), { plane: 'z', pivot: [H[0], BILL_TOP, H[2]], rot: [0, 24, 0] }),
      B([H[0], BILL_TOP - 2.67, H[2]], [3.17, 2.67, 0], billP(1), { plane: 'z', pivot: [H[0], BILL_TOP, H[2]], rot: [0, -24, 0] }),
    ] },
  ],
  // gear: model units, rest pose
  attach: {
    head: { bone: 'head', at: [0, 31.34, 0], size: 10 },
    face: { bone: 'head', at: [0, 25.0, 4.7], size: 8 },
    neck: { bone: 'body', at: [0, 20.9, 2.8], size: 5 },
    back: { bone: 'body', at: [0, 16.8, -3.5], size: 8.5 },
  },
};

// ---------------------------------------------------------------- animation
const MOUTH = [0, 22.5, 5.0], BILL = [H[0], BILL_TOP - 1.3, H[2]], HANDR = [-6.8, 11.2, 0.6], HANDL = [6.8, 11.2, 0.6];
// a lazy flutter kick; k scales it
function kick(P, t, hz = 1.3, k = 1) {
  const a = wave(t, hz), b = wave(t, hz, -1.1);
  P.rot('legR', (16 + 13 * a) * k, 0, -4 * k).rot('legL', (16 - 13 * a) * k, 0, 4 * k);
  P.rot('shinR', (14 + 12 * b) * k, 0, 0).rot('shinL', (14 - 12 * b) * k, 0, 0);
}
// the arms out front, sculling slowly (k 0..1)
function scull(P, t, k = 1, hz = 0.55) {
  const a = wave(t, hz), b = wave(t, hz, 1.6);
  P.rot('armR', (-52 + 9 * a) * k, (-12 + 6 * b) * k, (-22 + 7 * b) * k).rot('armL', (-52 + 9 * a) * k, (12 - 6 * b) * k, (22 - 7 * b) * k);
  P.rot('foreR', (-30 + 8 * b) * k, 0, 0).rot('foreL', (-30 + 8 * b) * k, 0, 0);
}
export const anim = {
  start: 'idle', seed: 23,
  breathe: { bone: 'body', amp: 0.016, per: 2.8 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.4], dur: 0.13 },
  look: { bone: 'head', yaw: 26, pitch: 12, speed: 3 },
  springs: [
    { bone: 'curl', tip: [0, 4, 1], k: 170, d: 8, gain: 0.8, max: 24 },
    { bone: 'rodB', tip: [2.6, 6.4, 8.3], k: 230, d: 11, gain: 0.35, max: 9 },
    { bone: 'rodC', tip: [2.5, -0.6, 3.6], k: 190, d: 9, gain: 0.45, max: 13 },
    { bone: 'line', tip: [0, -LINE, 0], k: 34, d: 2.4, gain: 1.0, max: 38, axes: [1, 0.2, 1] },
    { bone: 'bill', tip: [1.6, -2.2, 0], k: 60, d: 2.6, gain: 1.0, max: 34, axes: [0.6, 1, 0.6] },
    { bone: 'shinR', tip: [0, -4, 1.5], k: 220, d: 11, gain: 0.3, max: 12, axes: [1, 0, 0] },
    { bone: 'shinL', tip: [0, -4, 1.5], k: 220, d: 11, gain: 0.3, max: 12, axes: [1, 0, 0] },
  ],
  faces: {
    eyes: eyeFaces(EYE_STATES, 'open'),
    mouth: { default: 'o', states: Object.fromEntries(Object.keys(MOUTHS).map((k) => [k, ['mouth-' + k]])) },
  },
  fidget: { every: [6, 11], clips: ['grab', 'roll', 'yawn'] },
  clips: {
    // drifting, dreamy: a slow bob, a lazy flutter kick, hands sculling — and every few seconds it
    // reaches for the bill (leaning in carries the rod and the bill along with it), misses, and sighs
    // out a stream of bubbles
    idle: { len: 3.6, loop: true, f(P, t, c) {
      const u = t / 3.6, bob = Math.sin(u * Math.PI * 2), side = c.loopN % 2 ? 'L' : 'R', sg = side === 'R' ? 1 : -1;
      P.pos('body', 0, 0.9 * bob, 0).rot('body', 2 * Math.sin(u * Math.PI * 2 + 1), 0, 1.6 * Math.sin(u * Math.PI * 2 + 0.4));
      kick(P, t, 1.1, 0.8); scull(P, t, 1);
      const reach = seg(u, 0.42, 0.56, E.out3) * (1 - seg(u, 0.68, 0.8, E.inout));
      const lean = seg(u, 0.44, 0.58, E.back) * (1 - seg(u, 0.66, 0.82, E.inout));
      P.rot('arm' + side, (-60 * reach), sg * 8 * reach, sg * 14 * reach).rot('fore' + side, 26 * reach, 0, 0);
      P.rot('body', 6 * lean, 0, 0).pos('body', 0, 0.3 * lean, 0.8 * lean).rot('head', 6 * lean, 0, 0);
      P.lookW = 1 - 0.8 * reach;
      const sigh = bump(u, 0.8, 0.92);
      P.rot('head', -4 * sigh, 0, 0).sq('body', -0.03 * sigh);
      P.face('eyes', reach > 0.3 ? 'open' : sigh > 0.2 ? 'sad' : (u < 0.3 || u > 0.92) ? 'sleepy' : undefined);
      P.face('mouth', sigh > 0.25 ? 'open' : reach > 0.4 ? 'flat' : 'o');
      P.burst(3.6 * 0.82, 'bubble', 'head', MOUTH, { n: 6, dir: [0, 1, 0.4], speed: 0.7, spread: 0.4 });
      P.stream('bubble', 'head', MOUTH, { rate: 0.7, dir: [0, 1, 0.3], speed: 0.4, spread: 0.3 });
    } },
    // swimming: a breaststroke — hands glide forward, sweep out and back, legs frog-kick, the whole
    // body surging forward on each kick and gliding after it
    walk: { len: 1.3, loop: true, f(P, t) {
      const u = t / 1.3;
      const sweep = key([[0, 0], [0.12, 0.2], [0.42, 1, 'out'], [0.62, 0.3, 'inout'], [1, 0]], u);       // arms out & back
      const fwd = key([[0, 1], [0.16, 0.85], [0.42, 0.2, 'out'], [0.7, 0.55, 'inout'], [1, 1]], u);      // arms forward
      const kickO = key([[0, 0.2], [0.3, 1, 'inout'], [0.46, 0, 'in3'], [1, 0.2]], u);               // knees open
      const surge = key([[0, 0], [0.4, 0, 'inout'], [0.52, 1, 'out'], [1, 0, 'inout']], u);
      P.pos('body', 0, 0.6 * surge - 0.3, 1.4 * surge).rot('body', 6 * surge - 3, 0, 0).sq('body', 0.05 * surge - 0.03 * kickO);
      P.rot('armR', -100 * fwd - 20, -30 * sweep, -50 * sweep).rot('armL', -100 * fwd - 20, 30 * sweep, 50 * sweep);
      P.rot('foreR', -20 * (1 - fwd) - 10, 0, 0).rot('foreL', -20 * (1 - fwd) - 10, 0, 0);
      P.rot('legR', 30 - 30 * kickO, 0, -24 * kickO).rot('legL', 30 - 30 * kickO, 0, 24 * kickO);
      P.rot('shinR', 20 + 70 * kickO, 0, 0).rot('shinL', 20 + 70 * kickO, 0, 0);
      P.rot('head', -5 * surge, 0, 0);
      P.face('mouth', 'o');
      P.burst(0.62, 'bubble', 'shinR', [-2.3, 4, 0], { n: 3, dir: [0, 0.4, -1], speed: 0.6 }).burst(0.62, 'bubble', 'shinL', [2.3, 4, 0], { n: 3, dir: [0, 0.4, -1], speed: 0.6 });
      P.stream('bubble', 'head', MOUTH, { rate: 1.2, dir: [0, 1, 0], speed: 0.4, spread: 0.3 });
    } },
    // battle cry: curls up tight into a ball… then bursts open, arms and legs flung wide, and wails
    // a great column of bubbles; the rod whips and the bill flips
    cry: { len: 2.2, next: 'idle', f(P, t) {
      const tuck = seg(t, 0, 0.42, E.inout) * (1 - seg(t, 0.46, 0.56, E.out));
      const open = seg(t, 0.48, 0.62, E.back) * (1 - seg(t, 1.6, 2.1, E.inout));
      P.lookW = 1 - Math.max(tuck, open); P.blinkOK = false;
      P.pos('body', 0, -1.2 * tuck + 1.4 * open, -0.6 * tuck).rot('body', 16 * tuck - 14 * open, 0, 0);
      P.sq('body', -0.12 * tuck + 0.08 * open * (1 - seg(t, 0.62, 0.8)) + wob(t, 0.62, 0.05, 3, 5));
      P.rot('legR', -70 * tuck + 26 * open, 0, -30 * open).rot('legL', -70 * tuck + 26 * open, 0, 30 * open);
      P.rot('shinR', 95 * tuck + 6 * open, 0, 0).rot('shinL', 95 * tuck + 6 * open, 0, 0);
      P.rot('armR', -40 * tuck - 40 * open, 0, 24 * tuck - 92 * open + wave(t, 6) * 8 * open).rot('armL', -40 * tuck - 40 * open, 0, -24 * tuck + 92 * open - wave(t, 6.3) * 8 * open);
      P.rot('foreR', -70 * tuck - 10 * open, 0, 0).rot('foreL', -70 * tuck - 10 * open, 0, 0);
      P.rot('head', 24 * tuck - 26 * open + wave(t, 11) * 2.5 * open, wave(t, 4) * 4 * open, 0);
      P.face('eyes', tuck > 0.4 ? 'closed' : open > 0.3 ? 'angry' : undefined).face('mouth', open > 0.3 ? 'open' : 'flat');
      P.burst(0.56, 'bubble', 'head', MOUTH, { n: 18, dir: [0, 1, 0.6], speed: 1.8, spread: 0.6 }).burst(0.56, 'ring', 'body', [0, 17, 0], { scale: 0.9 });
      P.burst(0.6, 'buck', 'bill', BILL, { n: 3, speed: 1 });
      if (t > 0.6 && t < 1.55) P.stream('bubble', 'head', MOUTH, { rate: 26, dir: [0, 1, 0.5], speed: 1.4, spread: 0.35 });
    } },
    // cast-slam: leans back, then whips its whole body forward in a half-flip so the rod comes over
    // the top and slams the hook (and the bill) down on whatever is in front of it
    attack: { len: 1.35, next: 'idle', f(P, t) {
      const back = seg(t, 0, 0.34, E.out) * (1 - seg(t, 0.36, 0.44, E.in));
      const flip = seg(t, 0.36, 0.52, E.in3) * (1 - seg(t, 0.72, 1.25, E.inout));
      const imp = t > 0.52 ? wob(t, 0.52, 1, 3, 6) : 0;
      P.lookW = 1 - Math.max(back, flip); P.blinkOK = false;
      P.pos('root', 0, 0, -1.5 * back + 5.5 * flip).pos('body', 0, 1.6 * back - 2.2 * flip, 0);
      P.rot('body', -26 * back + 64 * flip + 5 * imp, 0, 0).sq('body', -0.06 * back + 0.06 * flip);
      P.rot('head', 10 * back - 30 * flip, 0, 0);
      P.rot('rodB', -14 * back + 18 * flip, 0, 0).rot('rodC', -16 * back + 26 * flip, 0, 0).rot('line', 30 * back - 70 * flip, 0, 0);
      P.rot('armR', -120 * back - 30 * flip, 0, -30 * back).rot('armL', -120 * back - 30 * flip, 0, 30 * back);
      P.rot('legR', -40 * back + 50 * flip, 0, 0).rot('legL', -40 * back + 50 * flip, 0, 0).rot('shinR', 60 * back, 0, 0).rot('shinL', 60 * back, 0, 0);
      P.face('eyes', back > 0.2 || flip > 0.2 ? 'angry' : undefined).face('mouth', flip > 0.3 ? 'open' : 'flat');
      P.burst(0.53, 'spark', 'bill', BILL, { scale: 1.4 }).burst(0.53, 'star', 'bill', BILL, { n: 4 }).burst(0.53, 'splash', 'bill', BILL, { n: 12, speed: 1.4 });
      P.burst(0.54, 'buck', 'bill', BILL, { n: 4, speed: 1.2 }).burst(0.53, 'bubble', 'bill', BILL, { n: 8, speed: 1 });
    } },
    // special (Hydro): the lure whirl — it spins like a top so the line flies out in a wide circle,
    // throwing a spiral of bubbles and a flurry of bills, then thrusts both hands out and blasts a
    // torrent of bubbles at the foe
    special: { len: 2.9, next: 'idle', f(P, t) {
      const tuck = seg(t, 0, 0.36, E.inout) * (1 - seg(t, 0.38, 0.5));
      const spin = seg(t, 0.38, 1.62, E.inout), whirl = bump(t, 0.38, 1.62);
      const thrust = seg(t, 1.68, 1.82, E.back) * (1 - seg(t, 2.35, 2.85, E.inout));
      P.lookW = 1 - Math.max(whirl, thrust); P.blinkOK = false;
      P.rot('root', 0, 720 * spin, 0).pos('body', 0, -1 * tuck + 1.6 * whirl, 0);
      P.rot('body', 10 * tuck - 18 * whirl + 10 * thrust, 0, 0).sq('body', -0.08 * tuck + 0.05 * thrust);
      P.rot('line', 64 * whirl, 0, 20 * whirl).rot('rodC', -10 * whirl, 0, 0);
      P.rot('armR', -30 * tuck - 30 * whirl - 95 * thrust, 0, 20 * tuck - 70 * whirl + 18 * thrust).rot('armL', -30 * tuck - 30 * whirl - 95 * thrust, 0, -20 * tuck + 70 * whirl - 18 * thrust);
      P.rot('foreR', -60 * tuck + 5 * thrust, 0, 0).rot('foreL', -60 * tuck + 5 * thrust, 0, 0);
      P.rot('legR', -40 * tuck + 20 * whirl + 30 * thrust, 0, -20 * whirl).rot('legL', -40 * tuck + 20 * whirl + 30 * thrust, 0, 20 * whirl).rot('shinR', 70 * tuck, 0, 0).rot('shinL', 70 * tuck, 0, 0);
      P.face('eyes', whirl > 0.3 ? 'angry' : thrust > 0.3 ? 'angry' : undefined).face('mouth', thrust > 0.3 ? 'open' : 'o');
      if (whirl > 0.2) P.stream('bubble', 'bill', BILL, { rate: 40, dir: [0, 0.6, 0], speed: 0.6, spread: 0.9 }).stream('buck', 'bill', BILL, { rate: 8, speed: 0.8, key: 'b' });
      if (t > 1.72 && t < 2.35) { P.stream('bubble', 'foreR', HANDR, { rate: 60, dir: [0, -1, 0.2], speed: 2.8, spread: 0.3, key: 'r' }).stream('bubble', 'foreL', HANDL, { rate: 60, dir: [0, -1, 0.2], speed: 2.8, spread: 0.3, key: 'l' }); }
      P.burst(1.72, 'ring', 'body', [0, 15, 8], { scale: 1.1 }).burst(1.72, 'splash', 'body', [0, 15, 8], { n: 16, dir: [0, 0.3, 1], speed: 2 });
    } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.2, 0.65, E.inout));
      P.pos('root', 0, 0, -2.6 * k).rot('body', -20 * k + wob(t, 0.2, 4, 3, 6), 0, wave(t, 14) * 4 * k).sq('body', -0.1 * k);
      P.rot('head', -14 * k, 10 * k, 6 * k).rot('armR', -30 * k, 0, -50 * k).rot('armL', -30 * k, 0, 50 * k).rot('legR', -20 * k, 0, 0).rot('legL', -10 * k, 0, 0);
      P.face('eyes', t < 0.45 ? 'hurt' : undefined).face('mouth', t < 0.45 ? 'open' : 'o');
      P.burst(0.02, 'chip', 'body', [0, 17, 4], { n: 7, speed: 1.2 }).burst(0.02, 'spark', 'body', [0, 17, 5], {}).burst(0.04, 'bubble', 'head', MOUTH, { n: 5, speed: 0.8 });
    } },
    // dazed, it drifts… then rolls over onto its side and sinks to the floor, rod sticking up
    faint: { len: 2.4, next: 'down', f(P, t) {
      const daze = seg(t, 0, 0.3) * (1 - seg(t, 0.8, 1.0)), fall = seg(t, 0.85, 1.75, E.inout), land = t > 1.75 ? wob(t, 1.75, 1, 2.5, 6) : 0;
      P.rot('body', 0, wave(t, 1.2) * 14 * daze, wave(t, 1.6) * 10 * daze).rot('head', 0, 0, wave(t, 1.6, 1) * 12 * daze);
      ko(P, fall, land);
      P.face('eyes', 'swirl').face('mouth', 'o'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.3, 'bubble', 'head', MOUTH, { n: 5, speed: 0.5 }).burst(1.78, 'dust', 'root', [0, 0.5, 0], { n: 6, spread: 1, speed: 0.6 }).burst(1.78, 'bubble', 'body', [0, 8, 0], { n: 8, speed: 0.6 });
    } },
    down: { len: 3.0, loop: true, f(P, t) {
      ko(P, 1, 0);
      P.rot('armL', 0, 0, wave(t, 0.33) * 4).rot('legL', wave(t, 0.33, 1) * 3, 0, 0);
      P.face('eyes', 'swirl').face('mouth', 'o'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.burst(0.6, 'bubble', 'head', MOUTH, { n: 1, speed: 0.3 }).burst(2.1, 'bubble', 'head', MOUTH, { n: 2, speed: 0.3 });
    } },
    // victory: it finally catches the bill — lunges, the rod bends down into its arms, it hugs the note
    // to its chest with a little happy wiggle, then lets it spring back up on the line
    win: { len: 3.0, next: 'idle', f(P, t) {
      const prep = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.4));
      const lunge = seg(t, 0.32, 0.56, E.back) * (1 - seg(t, 0.62, 0.9, E.inout));
      const hug = seg(t, 0.6, 0.8, E.out) * (1 - seg(t, 2.4, 2.8, E.inout));
      const wig = bump(t, 0.9, 2.3);
      P.lookW = 0; P.blinkOK = false;
      P.pos('root', 0, 0, -1 * prep + 3 * lunge).rot('body', -10 * prep + 22 * lunge, wave(t, 2.2) * 10 * wig, wave(t, 2.2, 1) * 6 * wig);
      P.pos('body', 0, 1.2 * wig * Math.abs(wave(t, 2.2)), 0).sq('body', -0.05 * prep + 0.04 * lunge);
      P.rot('armR', -120 * lunge - 70 * hug, 0, 10 * lunge + 30 * hug).rot('armL', -120 * lunge - 70 * hug, 0, -10 * lunge - 30 * hug);
      P.rot('foreR', -70 * hug, 0, 0).rot('foreL', -70 * hug, 0, 0);
      P.rot('rodB', 10 * lunge + 18 * hug, 0, 0).rot('rodC', 14 * lunge + 30 * hug, 0, 0).rot('line', 40 * hug, 0, 0);
      P.rot('head', 8 * hug + wave(t, 2.2, 0.5) * 5 * wig, 0, wave(t, 2.2) * 6 * wig);
      kick(P, t, 2.2, wig);
      P.face('eyes', lunge > 0.3 ? 'open' : hug > 0.4 ? 'happy' : undefined).face('mouth', hug > 0.4 ? 'smile' : 'o');
      P.burst(0.7, 'buck', 'body', [0, 18, 6], { n: 8, speed: 1.4 }).burst(0.7, 'sparkle', 'body', [0, 18, 6], { n: 8 }).burst(0.72, 'bubble', 'head', MOUTH, { n: 8, speed: 1 });
      P.burst(1.5, 'buck', 'body', [0, 20, 6], { n: 4, speed: 1 });
    } },
    // asleep: curled up like a baby in the womb, sunk low, turning slowly, thumb by its mouth
    sleep: { len: 4.0, loop: true, f(P, t) {
      const br = Math.sin((t / 4) * Math.PI * 2);
      P.pos('body', 0, -3.2 + 0.4 * br, 0).rot('body', 14, 8 * Math.sin((t / 4) * Math.PI * 2 + 1), 4).sq('body', -0.03 + 0.03 * br);
      P.rot('legR', -78, 0, 6).rot('legL', -74, 0, -6).rot('shinR', 104, 0, 0).rot('shinL', 100, 0, 0);
      P.rot('armR', -62, 0, 28).rot('armL', -40, 0, -20).rot('foreR', -92, 0, 0).rot('foreL', -80, 0, 0);
      P.rot('head', 20 + 2 * br, 0, 6);
      P.face('eyes', 'closed').face('mouth', 'o'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.8, 'z', 'head', [3, 31, 4], {}).burst(2.6, 'z', 'head', [3, 31, 4], {}).burst(1.6, 'bubble', 'head', MOUTH, { n: 1, speed: 0.3 });
    } },
    // fidget: a sudden kick-lunge for the bill — which swings away, of course; it grabs at water
    grab: { len: 2.6, next: 'idle', f(P, t) {
      const wind = seg(t, 0.05, 0.4, E.inout) * (1 - seg(t, 0.42, 0.5));
      const go = seg(t, 0.44, 0.66, E.back) * (1 - seg(t, 1.2, 1.9, E.inout));
      const clap = bump(t, 0.72, 0.9), slump = seg(t, 1.1, 1.4) * (1 - seg(t, 2.1, 2.5));
      P.lookW = 1 - go;
      P.pos('root', 0, 0, -1 * wind + 4 * go).rot('body', -8 * wind + 20 * go - 6 * slump, 0, 0).sq('body', -0.06 * wind + 0.05 * go);
      P.rot('legR', -40 * wind + 34 * go, 0, -16 * wind).rot('legL', -40 * wind + 34 * go, 0, 16 * wind).rot('shinR', 70 * wind, 0, 0).rot('shinL', 70 * wind, 0, 0);
      P.rot('armR', -110 * go - 20 * slump, 0, -26 * go + 22 * clap).rot('armL', -110 * go - 20 * slump, 0, 26 * go - 22 * clap);
      P.rot('head', 8 * go + 10 * slump, 0, 0);
      P.face('eyes', go > 0.3 && t < 1.1 ? 'open' : slump > 0.3 ? 'sad' : undefined).face('mouth', go > 0.3 && t < 1.1 ? 'flat' : slump > 0.3 ? 'open' : 'o');
      P.burst(0.48, 'bubble', 'shinR', [-2.3, 4, 0], { n: 5, dir: [0, 0, -1], speed: 1 }).burst(0.48, 'bubble', 'shinL', [2.3, 4, 0], { n: 5, dir: [0, 0, -1], speed: 1 });
      P.burst(0.82, 'bubble', 'foreR', HANDR, { n: 3, speed: 0.6 }).burst(1.3, 'bubble', 'head', MOUTH, { n: 8, dir: [0, 1, 0.3], speed: 0.8 });
    } },
    // fidget: a lazy barrel roll
    roll: { len: 2.4, next: 'idle', f(P, t) {
      const r = seg(t, 0.3, 1.8, E.inout), k = bump(t, 0.2, 2.0);
      P.rot('body', 6 * k, 0, 360 * r).pos('body', 0, 1.4 * k, 0);
      P.rot('armR', -20 * k, 0, 30 * k).rot('armL', -20 * k, 0, -30 * k).rot('legR', -20 * k, 0, 0).rot('legL', -20 * k, 0, 0).rot('shinR', 40 * k, 0, 0).rot('shinL', 40 * k, 0, 0);
      P.face('eyes', k > 0.3 ? 'happy' : undefined).face('mouth', k > 0.3 ? 'smile' : 'o'); P.lookW = 1 - k;
      if (k > 0.3) P.stream('bubble', 'body', [0, 14, -2], { rate: 10, speed: 0.5, spread: 0.8 });
    } },
    // fidget: a huge, slow yawn that lets out one big bubble
    yawn: { len: 2.6, next: 'idle', f(P, t) {
      const y = seg(t, 0.2, 0.8, E.inout) * (1 - seg(t, 1.6, 2.2, E.inout));
      P.rot('head', -18 * y, 0, 4 * y).rot('body', -6 * y, 0, 0).sq('body', 0.05 * y);
      P.rot('armR', -150 * y, 0, -30 * y).rot('armL', -150 * y, 0, 30 * y).rot('foreR', 10 * y, 0, 0).rot('foreL', 10 * y, 0, 0);
      P.rot('legR', 30 * y, 0, -6 * y).rot('legL', 30 * y, 0, 6 * y);
      P.face('eyes', y > 0.3 ? 'closed' : undefined).face('mouth', y > 0.3 ? 'open' : 'o'); P.lookW = 1 - y; P.blinkOK = y < 0.2;
      P.burst(1.0, 'bubble', 'head', MOUTH, { n: 1, dir: [0, 1, 0.2], speed: 0.5, scale: 2.6 }).burst(1.4, 'bubble', 'head', MOUTH, { n: 3, speed: 0.5 });
    } },
  },
};
// knocked out: rolled onto its left side on the floor, the rod sticking up out of its back
function ko(P, k, land = 0) {
  P.rot('body', -6 * k, 0, -86 * k).pos('body', 1.2 * k, -10.6 * k - 0.6 * Math.max(0, land), 0);
  P.rot('head', 6 * k, 0, -10 * k).rot('armR', -30 * k, 0, -30 * k).rot('armL', -10 * k, 0, 40 * k).rot('foreR', -30 * k, 0, 0);
  P.rot('legR', 20 * k, 0, -10 * k).rot('legL', 6 * k, 0, 8 * k).rot('shinR', 30 * k, 0, 0).rot('shinL', 10 * k, 0, 0);
  P.rot('line', 0, 0, 80 * k);
}
def.anim = anim;
