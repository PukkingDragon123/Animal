// Rainblin — the rainbow goblin (an original homage to the seven colour goblins of the Rainbow Goblins tale and
// Takanaka's album of the same name). A squat, hunched little goblin with huge pointed ears, a long drooping
// nose, a wide grin with two tusks, long arms and long-toed bare feet, a shaggy dark fringe under a floppy
// pointed hood, a ragged tunic, a rope lasso slung across its chest and coiled on its back. Every Rainblin is
// one of the SEVEN colours — red, orange, yellow, green, blue, indigo or violet — picked by its look seed (the
// first appearance tier holds the seven colour sets: skin, hood and tunic). Gather seven and they merge into
// Roygbot. Signature fidget: "lasso" — it whirls the lasso, ropes a rainbow out of the sky and slurps it down
// like a noodle; second fidget: a hand-rubbing cackle; dance: a hopping goblin jig.
import { E, seg, bump, wob, wave, hop } from '../anim.js';
import { shade } from './kit.js';
import { eyeRig, eyesAt, glance, keepEyes } from './eyes.js';
import { B, L, both, twin, acc, goldP, GOLD, plant, beat, env } from './story_parts.js';
import { RAINBOW, GOB, GK, skinP, clothP, leatherP, buckleP, ropeP, tinP, tuskP, hairP, arcP, mouthP, MOUTH_STATES, GBFX, ARCFX, goblinForm, EYE_GOBLIN } from './goblin_parts.js';
import { crisp } from './takanaka_parts.js';

// seven tinted copies of a cube (or cubes), each tagged with its colour's tier-0 option id
const V = (mk) => RAINBOW.flatMap((c) => acc('gob-' + c, [].concat(mk(c))));
const S = (c) => skinP(c), SI = (c) => skinP(c, { inner: true }), C = (c) => clothP(c), CR = (c) => clothP(c, { ragged: true }), CP = (c) => clothP(c, { ragged: true, patch: true });
const clawP = shade('#2a1a1e', { top: '#4a3a3e', bottom: '#140a0e', grain: 0 });
const lensP = crisp((p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face !== 'south' ? GK.tinLo : x === 0 || y === 0 || x === w - 1 || y === h - 1 ? GK.tinLo : y < h / 2 ? '#ffd27a' : '#e8902a'); if (face === 'south') p.px(1, 1, '#ffffff'); });
const strapP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 ? GK.leatherHi : GK.leatherLo); };
const brewP = crisp((p, w, h, face) => { if (face !== 'up') { tinP(p, w, h, face); return; } const b = RAINBOW.map((k) => GOB[k].band); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, b[Math.floor(((x + y) / (w + h)) * 7) % 7]); });
const prismP = (k) => (p, w, h, face) => { const g = GOB[k]; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? '#ffffff' : (x + y) % 4 === 0 ? '#ffffff' : y < h / 2 ? g.band : g.skin); };
const luteP = crisp((p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'south' || face === 'north' ? GOB[RAINBOW[Math.min(6, Math.floor((y / h) * 7))]].band : GK.leatherLo); if (face === 'north') { const cx = Math.floor(w / 2); for (let y = 0; y < h; y++) p.px(cx, y, '#fffaf0'); } });

// ---------------------------------------------------------------- the model
const FOOT = V((c) => [B([-3.8, 0, -1.0], [2.8, 1.2, 4.4], S(c)), B([-3.4, 0.4, 3.0], [2.0, 1.0, 1.8], S(c), { pivot: [-2.4, 0.9, 3.2], rot: [-26, 0, 0] })]);
const CLAWS = [-3.6, -2.7, -1.8].map((x) => B([x, 0, 4.4], [0.6, 0.6, 0.6], clawP, { pivot: [-2.4, 0.9, 3.2], rot: [-26, 0, 0] }));
const EAR = V((c) => [B([-9.6, 13.6, -1.0], [4.4, 4.0, 1.2], SI(c)), B([-12.4, 14.4, -0.8], [2.9, 2.6, 1.0], SI(c)), B([-14.8, 15.2, -0.6], [2.6, 1.3, 0.8], S(c))]);
const HAND = [...V((c) => [B([-5.7, 3.4, -0.5], [1.2, 3.6, 1.2], S(c)), B([-6.5, 1.4, -1.3], [2.8, 2.2, 2.6], S(c))]), ...[-6.3, -5.4, -4.5].map((x) => B([x, 0.8, 0.6], [0.6, 0.8, 0.6], clawP))];
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-2.7, 16.4, 4.44], line: GK.ink, iris: '#f2e25a', irisDark: '#b89a2a', pupilColor: GK.ink, extra: ['smug'], map: EYE_GOBLIN });
const MOUTH = { default: 'grin', states: Object.fromEntries(MOUTH_STATES.map((s) => [s, ['m-' + s]])) };
const GOG = B([-4.8, 17.4, 4.6], [3.8, 2.4, 0.5], lensP);
export const def = {
  name: 'rainblin', ppu: 3, scale: 0.46, outline: { color: '#160a12', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...twin({ name: 'footR', parent: 'root', pivot: [-2.4, 0.8, 0.6], cubes: [...FOOT, ...CLAWS] }),
    ...twin({ name: 'legR', parent: 'root', pivot: [-2.4, 4.6, 0.4], cubes: V((c) => B([-3.1, 1.0, -0.3], [1.4, 3.8, 1.4], S(c))) }),
    { name: 'body', parent: 'root', pivot: [0, 4.4, 0], cubes: [
      ...V((c) => [B([-4.4, 4.4, -3.4], [8.8, 6.6, 6.8], CP(c)), B([-4.8, 3.4, -3.8], [9.6, 1.8, 7.6], CR(c)), B([-5.0, 9.6, -3.9], [10.0, 1.8, 7.8], C(c))]),
      B([-4.6, 5.8, -3.6], [9.2, 1.2, 7.2], leatherP), B([-0.8, 5.7, 3.62], [1.6, 1.4, 0.3], buckleP),
      // the lasso rope slung from the right shoulder to the left hip
      B([-5.4, 8.6, 3.5], [11.6, 0.8, 0.6], ropeP, { pivot: [0, 8.0, 3.8], rot: [0, 0, -34] }),
      // dripped (or): a tin pail of liquid rainbow on the belt
      ...acc('acc-pail', [B([1.6, 2.8, 3.6], [2.6, 2.8, 2.6], brewP), B([1.8, 5.6, 4.7], [2.2, 0.4, 0.4], tinP)]),
      // ultra (or): a little rainbow lute on the back
      ...acc('acc-guitar', [B([-2.4, 4.6, -5.0], [4.8, 4.8, 1.2], luteP), B([-0.5, 9.4, -4.8], [1.0, 6.0, 0.8], shade(GK.leather)), B([-0.8, 15.2, -4.85], [1.6, 1.6, 0.9], shade(GK.leatherLo))]),
    ] },
    // the coiled lasso on its back (it flies in the lasso fidget)
    { name: 'lasso', parent: 'body', pivot: [0, 7.6, -4.4], cubes: [
      B([-1.9, 9.4, -4.9], [3.8, 0.6, 0.6], ropeP), B([-1.9, 5.8, -4.9], [3.8, 0.6, 0.6], ropeP),
      B([-1.9, 5.8, -4.9], [0.6, 4.2, 0.6], ropeP), B([1.3, 5.8, -4.9], [0.6, 4.2, 0.6], ropeP),
    ] },
    ...twin({ name: 'armR', parent: 'body', pivot: [-4.6, 9.8, 0.2], rot: [0, 0, -8], cubes: V((c) => B([-6.0, 6.6, -1.0], [1.8, 3.8, 2.0], C(c))) }),
    ...twin({ name: 'handR', parent: 'armR', pivot: [-5.1, 6.8, 0.2], rot: [-10, 0, 4], cubes: HAND }),
    { name: 'head', parent: 'body', pivot: [0, 11.0, 0.2], cubes: [
      ...V((c) => [B([-5.4, 10.8, -4.4], [10.8, 8.6, 8.8], S(c)), B([-5.8, 11.4, -3.6], [11.6, 4.0, 7.6], S(c)), B([-1.1, 13.6, 4.2], [2.2, 3.0, 2.0], S(c)), B([-0.8, 13.0, 5.9], [1.6, 1.6, 1.3], S(c), { pivot: [0, 13.8, 6.2], rot: [24, 0, 0] })]),
      ...both(B([-2.3, 10.7, 4.3], [0.6, 1.5, 0.6], tuskP)),
      ...MOUTH_STATES.map((s) => B([-2.0, 10.85, 4.44], [4.0, 5 / 3, 0], mouthP(s), { plane: 'z', id: 'm-' + s, hide: s !== 'grin', outline: false })),
      // the shaggy fringe under the hood and tufts behind the ears
      B([-5.2, 17.9, 4.4], [10.4, 1.2, 0.6], hairP), ...both(B([-6.0, 12.4, -3.6], [0.6, 3.2, 5.0], hairP)),
      // the hood: a floppy cap with a back flap
      ...V((c) => [B([-5.8, 18.6, -4.8], [11.6, 2.4, 9.6], C(c)), B([-4.4, 20.8, -3.8], [8.8, 2.2, 7.6], C(c)), B([-5.8, 12.6, -5.4], [11.6, 6.2, 0.8], CR(c))]),
      // dripped (or): riding goggles pushed up on the hood
      ...acc('acc-goggles', [GOG, L(GOG), B([-6.0, 17.6, -4.6], [12.0, 0.9, 9.4], strapP)]),
    ] },
    { name: 'hoodTip', parent: 'head', pivot: [0, 22.8, -1.0], cubes: [
      ...V((c) => [B([-2.6, 22.6, -3.0], [5.2, 2.4, 5.2], C(c)), B([-1.4, 24.4, -3.6], [2.8, 2.8, 2.8], C(c), { pivot: [0, 24.6, -2.2], rot: [-58, 0, 0] })]),
      B([-0.7, 25.2, -6.8], [1.4, 1.4, 1.4], goldP, { pivot: [0, 24.6, -2.2], rot: [-58, 0, 0] }),
      // ultra (or): a prism crown — seven crystal points round the hood
      ...acc('acc-crown', [B([-4.6, 22.6, -3.8], [9.2, 0.8, 7.6], goldP), ...RAINBOW.map((k, i) => { const a = (i / 7) * Math.PI * 2, x = Math.sin(a) * 3.8, z = -0.1 + Math.cos(a) * 3.2; return B([x - 0.5, 23.2, z - 0.5], [1.0, 2.2, 1.0], prismP(k), { pivot: [x, 23.2, z], rot: [Math.cos(a) * 14, 0, -Math.sin(a) * 14] }); })]),
    ] },
    ...twin({ name: 'earR', parent: 'head', pivot: [-5.4, 16.0, 0], rot: [0, -8, -20], cubes: EAR }),
    ...EYES.bones,
    // the rainbow it lassos (lasso fidget): an arc plane far in front, hidden until roped
    { name: 'rainbow', parent: 'root', pivot: [0, 14, 22], cubes: [B([-12, 14, 22], [24, 12, 0], arcP({ inner: 0.5 }), { plane: 'z', id: 'rb-on', hide: true, outline: false })] },
  ],
  drip: [
    RAINBOW.map((k) => ({ id: 'gob-' + k, name: `${GOB[k].name} goblin (hood & skin)` })),
    [{ id: 'acc-goggles', name: 'Riding goggles' }, { id: 'acc-pail', name: 'Pail of liquid rainbow' }],
    [{ id: 'acc-crown', name: 'Prism crown' }, { id: 'acc-guitar', name: 'Rainbow lute' }],
  ],
  attach: {
    head: { bone: 'head', at: [0, 21, 0], size: 10 },
    face: { bone: 'head', at: [0, 16.4, 4.6], size: 10 },
    neck: { bone: 'body', at: [0, 10.2, 3.8], size: 9 },
    back: { bone: 'body', at: [0, 7.6, -4.4], size: 8 },
  },
};
def.dripForm = { map: keepEyes(EYES, goblinForm) };

// ---------------------------------------------------------------- animation
const LEG = 3.8, LEGS = ['legR', 'legL'], MOUTHP = [0, 11.8, 6], TOP = [0, 26, 0], SPARK = RAINBOW.map((k) => GBFX[k]);
function arms(P, shR, elR, shL = [0, 0, 0], elL = [0, 0, 0]) { P.rot('armR', ...shR).rot('handR', ...elR).rot('armL', ...shL).rot('handL', ...elL); }
const rainbowBurst = (P, t0, bone, at, n = 2) => SPARK.forEach((k, i) => P.burst(t0 + i * 0.02, k, bone, at, { n }));
function fallBack(P, k) {
  P.rot('root', -80 * k, 0, 0).pos('root', 0, 4.2 * k, -1 * k);
  P.rot('legR', -50 * k, 0, 10 * k).rot('legL', -40 * k, 0, -10 * k).rot('footR', -30 * k).rot('footL', -20 * k);
  arms(P, [0, 0, -70 * k], [0, 0, -20 * k], [0, 0, 70 * k], [0, 0, 20 * k]);
  P.rot('head', 14 * k, 0, 16 * k).rot('earR', 0, 0, 20 * k).rot('earL', 0, 0, -20 * k);
}
export const anim = {
  start: 'idle', seed: 77,
  breathe: { bone: 'body', amp: 0.025, per: 1.8 },
  blink: { slot: 'eyes', closed: 'closed', every: [1.8, 4.2], dur: 0.1 },
  look: { bone: 'head', yaw: 30, pitch: 14, speed: 7 },
  springs: [
    { bone: 'hoodTip', tip: [0, 3, -2], k: 120, d: 6, gain: 1.1, max: 26 },
    { bone: 'earR', tip: [-6, 0, 0], k: 200, d: 8, gain: 0.8, max: 16, axes: [1, 0.3, 1] },
    { bone: 'earL', tip: [6, 0, 0], k: 200, d: 8, gain: 0.8, max: 16, axes: [1, 0.3, 1] },
    { bone: 'lasso', tip: [0, -3, -1], k: 160, d: 7, gain: 0.6, max: 10 },
  ],
  faces: { eyes: EYES.slot, mouth: MOUTH, rb: { default: 'off', states: { off: [], on: ['rb-on'] } } },
  fidget: { every: [3, 6], clips: ['dance', 'dance', 'lasso', 'cackle'] },
  clips: {
    // a hunched, sneaky bob — ears twitching, eyes darting, fingers drumming
    idle: { len: 2.0, loop: true, f(P, t, c) {
      const b = beat(t, 0.5), dy = -0.4 * b.pulse;
      P.pos('body', 0, dy, 0).rot('body', 8, wave(t, 0.5) * 6, 0).sq('body', -0.04 * b.pulse); plant(P, LEGS, dy, LEG);
      P.rot('head', -6 + 3 * b.pulse, wave(t, 0.5) * 8, wave(t, 0.5, 1) * 5);
      arms(P, [-10, 0, 0], [-20 + wave(t, 6) * 6, 0, 10], [-10, 0, 0], [-20 + wave(t, 6, 1) * 6, 0, -10]);
      if (c.loopN % 2 === 0) P.rot('earR', 0, 0, -18 * bump(t, 0.8, 1.0)).rot('earL', 0, 0, 18 * bump(t, 1.4, 1.6));
      eyesAt(P, ...glance(t + c.loopN * 1.1, [[0, 0], [0.3, 0], [-0.3, 0.05], [0, 0]], 0.45));
      if (c.loopN % 3 === 2) P.face('eyes', 'smug').face('mouth', 'smirk');
    } },
    // a sneaky tiptoe: high knees, long arms swinging low
    walk: { len: 0.5, loop: true, f(P, t) {
      const ph = (t / 0.5) * Math.PI * 2, s = Math.sin(ph), c2 = Math.cos(ph), dy = Math.abs(c2) * 0.9, lr = Math.max(0, s), ll = Math.max(0, -s);
      P.pos('body', 0, dy, 0).rot('body', 12, s * 8, s * 6);
      P.pos('footR', 0, lr * 2.4, s * 2).rot('footR', -30 * lr, 0, 0).pos('footL', 0, ll * 2.4, -s * 2).rot('footL', -30 * ll, 0, 0);
      P.pos('legR', 0, lr * 1.8, s * 1.4).pos('legL', 0, ll * 1.8, -s * 1.4);
      arms(P, [s * 30, 0, 0], [-10, 0, 0], [-s * 30, 0, 0], [-10, 0, 0]); P.rot('head', -6, -s * 6, 0);
    } },
    // signature: the lasso — whirl it overhead, rope a rainbow out of the sky, haul it in and slurp it like a noodle
    lasso: { len: 4.4, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 1 - env(t, 0.1, 4.2);
      const whirl = env(t, 0.15, 1.5, 0.3, 0.1), toss = seg(t, 1.4, 1.75, E.out), haul = seg(t, 1.95, 2.9, E.inout), gone = seg(t, 2.8, 3.1, E.in);
      // the lasso: from the back up over the head, spinning, then flung out and hauled back in
      const up = Math.max(whirl, 1 - gone) * (t > 0.15 ? 1 : 0), fly = toss * (1 - haul);
      P.pos('lasso', 0, 20 * up - 4 * fly, 4.4 * up + 18 * fly).rot('lasso', 90 * up, (t * 900) % 360 * whirl, 0).scl('lasso', 1 + 1.4 * up);
      arms(P, [-150 * whirl - 60 * toss * (1 - haul), 0, -10], [-20 * whirl, 0, 0], [-40 * haul, 0, 0], [-60 * haul, 0, -20 * haul]);
      arms(P, [60 * haul * (1 - gone), 0, 0], [-40 * haul, 0, 0]);
      // the rainbow: appears where the lasso lands, then shrinks into the goblin's mouth
      const rb = t > 1.65 && t < 3.0;
      P.face('rb', rb ? 'on' : 'off').pos('rainbow', 0, -2 * haul, -16 * haul).scl('rainbow', Math.max(0.05, 1 - 0.95 * haul));
      const slurp = env(t, 2.6, 3.4, 0.1, 0.2), gulp = bump(t, 3.3, 3.6), grin = seg(t, 3.6, 3.8);
      P.scl('head', 1 + 0.08 * gulp, 1 - 0.04 * gulp, 1 + 0.08 * gulp).rot('head', -10 * slurp + 14 * gulp, 0, 0).sq('body', 0.06 * gulp);
      P.face('mouth', slurp > 0.3 ? 'slurp' : gulp > 0.3 ? 'o' : grin > 0.5 ? 'laugh' : whirl > 0.3 ? 'grit' : undefined);
      P.face('eyes', whirl > 0.3 ? 'angry' : toss > 0.5 && haul < 0.2 ? 'shock' : slurp > 0.3 ? 'closed' : grin > 0.5 ? 'happy' : undefined);
      P.burst(1.68, ARCFX, 'root', [0, 18, 22], { n: 3 }); rainbowBurst(P, 3.62, 'head', TOP, 2); P.burst(3.62, ARCFX, 'head', MOUTHP, { n: 2, dir: [0, 1, 0.4] });
    } },
    // a hand-rubbing cackle: hunched low, shoulders shaking, ears wiggling
    cackle: { len: 2.4, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const k = env(t, 0.1, 2.2, 0.2, 0.3), rub = Math.sin(t * Math.PI * 2 * 4) * k, shake = Math.abs(Math.sin(t * Math.PI * 2 * 5)) * k;
      P.rot('body', 16 * k, 0, 0).pos('body', 0, -0.8 * k + 0.3 * shake, 0).rot('head', -14 * k + 6 * shake, 0, 0); plant(P, LEGS, -0.8 * k, LEG);
      arms(P, [-50 * k, 0, 30 * k], [-50 * k, 20 * rub, 30 * k], [-50 * k, 0, -30 * k], [-50 * k, -20 * rub, -30 * k]);
      P.rot('earR', 0, 0, -16 * rub).rot('earL', 0, 0, 16 * rub);
      P.face('eyes', k > 0.3 ? 'smug' : undefined).face('mouth', k > 0.3 ? (shake > 0.5 ? 'laugh' : 'grin') : undefined);
      P.burst(0.6, 'sparkle', 'handR', [-5, 2, 3], { n: 3 }).burst(1.2, 'sparkle', 'handL', [5, 2, 3], { n: 3 });
    } },
    // the dance: a hopping goblin jig — foot to foot, legs kicking out, arms flailing, a spin and a big "ta-da"
    dance: { len: 2.6, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const b = beat(t, 0.26), live = 1 - seg(t, 1.9, 2.0), side = b.n % 2 ? 1 : -1;
      P.pos('root', 0, 1.6 * b.pulse * live, 0).rot('body', 0, side * 14 * live, side * 10 * live);
      const kick = side > 0 ? 'L' : 'R';
      P.rot('leg' + kick, 0, 0, side * 40 * b.pulse * live).pos('foot' + kick, side * 2 * b.pulse * live, 1.8 * b.pulse * live, 0);
      arms(P, [-120 * (side > 0 ? 1 : 0.2) * live, 0, -20 * live], [0, 0, 0], [-120 * (side < 0 ? 1 : 0.2) * live, 0, 20 * live], [0, 0, 0]);
      P.rot('head', 0, -side * 14 * live, side * 10 * live);
      const spin = seg(t, 1.95, 2.3, E.inout), pose = seg(t, 2.25, 2.4, E.back);
      P.rot('root', 0, 360 * spin, 0).pos('root', 0, 2.4 * bump(t, 1.95, 2.3), 0);
      arms(P, [-150 * pose, 0, -30 * pose], [0, 0, 0], [-150 * pose, 0, 30 * pose], [0, 0, 0]);
      P.face('eyes', t > 2.3 ? 'happy' : b.pulse > 0.5 ? 'happy' : undefined).face('mouth', t > 2.3 ? 'laugh' : 'grin');
      P.burst(0.05, 'note', 'head', [5, 24, 2], {}).burst(0.6, 'note', 'head', [-5, 24, 2], {}).burst(1.2, 'note', 'head', [5, 24, 2], {}); rainbowBurst(P, 2.3, 'head', TOP, 1);
    } },
    // battle cry: crouch, then spring up arms wide, ears flat back, a wide toothy shriek
    cry: { len: 1.8, next: 'idle', f(P, t) {
      P.lookW = 1 - seg(t, 0.2, 0.3); P.blinkOK = false;
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.4, E.out)), up = seg(t, 0.32, 0.48, E.back) * (1 - seg(t, 1.35, 1.7, E.inout));
      const dy = -1.2 * crouch + 0.8 * up; P.pos('body', 0, dy, 0).sq('body', -0.12 * crouch + 0.06 * up); plant(P, LEGS, dy, LEG);
      P.rot('head', 10 * crouch - 20 * up, 0, 0).rot('earR', 0, 30 * up, 10 * up).rot('earL', 0, -30 * up, -10 * up);
      arms(P, [0, 0, -80 * up], [0, 0, -20 * up], [0, 0, 80 * up], [0, 0, 20 * up]);
      P.face('eyes', crouch > 0.3 ? 'smug' : up > 0.3 ? 'angry' : undefined).face('mouth', up > 0.3 ? 'laugh' : 'grit');
      for (const r0 of [0.45, 0.65]) P.burst(r0, 'ring', 'head', MOUTHP, { scale: 0.9 }); rainbowBurst(P, 0.46, 'head', MOUTHP, 1);
    } },
    // physical: a leaping claw swipe
    attack: { len: 0.9, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const bk = seg(t, 0, 0.24, E.out) * (1 - seg(t, 0.24, 0.32, E.in)), hit = seg(t, 0.26, 0.38, E.in3) * (1 - seg(t, 0.48, 0.85, E.inout));
      P.pos('root', 0, 1.6 * hit, -1.6 * bk + 5 * hit).rot('body', -8 * bk + 18 * hit, 20 * bk - 30 * hit, 0);
      arms(P, [40 * bk - 130 * hit, 0, -20 * bk], [-30 * bk + 40 * hit, 0, 0], [20 * bk, 0, 20 * bk]);
      P.face('eyes', 'angry').face('mouth', hit > 0.3 ? 'laugh' : 'grit');
      P.burst(0.38, 'spark', 'handR', [-6, 1, 3], { scale: 1.1 }).burst(0.38, 'star', 'handR', [-6, 1, 3], { n: 4 });
    } },
    // special: a rainbow bomb — it gulps a breath and spits a whirling ball of colours
    special: { len: 1.7, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const puff = env(t, 0.1, 0.55, 0.25, 0.05), spit = seg(t, 0.55, 0.65, E.out) * (1 - seg(t, 1.2, 1.6, E.inout));
      P.scl('head', 1 + 0.12 * puff, 1 + 0.04 * puff, 1 + 0.12 * puff).rot('head', 10 * puff - 14 * spit, 0, 0).pos('root', 0, 0, -1.2 * spit);
      arms(P, [20 * puff - 40 * spit, 0, -30 * spit], [0, 0, 0], [20 * puff - 40 * spit, 0, 30 * spit], [0, 0, 0]);
      P.face('eyes', puff > 0.3 ? 'shock' : spit > 0.3 ? 'angry' : t > 1.4 ? 'happy' : undefined).face('mouth', puff > 0.3 ? 'slurp' : spit > 0.3 ? 'o' : 'grin');
      if (t > 0.58 && t < 1.1) { SPARK.forEach((k, i) => P.stream(k, 'head', MOUTHP, { rate: 10, dir: [0, 0.1, 1], speed: 2, spread: 0.3, key: 'r' + i })); }
      P.burst(0.6, ARCFX, 'head', MOUTHP, { n: 4, dir: [0, 0.2, 1], speed: 2 }).burst(0.6, 'ring', 'head', MOUTHP, { scale: 0.8 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.2, 0.7, E.inout));
      P.pos('root', 0, 0, -2 * k).rot('body', -16 * k + wob(t, 0.2, 4, 3, 6), 0, wave(t, 16) * 4 * k).sq('body', -0.14 * k).rot('head', -14 * k, 0, 0).rot('earR', 0, 0, 24 * k).rot('earL', 0, 0, -24 * k);
      arms(P, [0, 0, -40 * k], [0, 0, 0], [0, 0, 40 * k]);
      P.face('eyes', t < 0.45 ? 'x' : 'sad').face('mouth', 'frown'); P.blinkOK = false;
      P.burst(0.02, 'spark', 'body', [0, 8, 4], {}).burst(0.02, 'star', 'head', TOP, { n: 3 });
    } },
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.9, 1.0)), fall = seg(t, 0.9, 1.35, E.bounce);
      P.rot('body', 0, wave(t, 1.6) * 20 * dizzy, wave(t, 2.2) * 12 * dizzy).rot('head', 0, 0, wave(t, 2.2, 1) * 16 * dizzy);
      fallBack(P, fall);
      P.face('eyes', 'swirl').face('mouth', 'o'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.9, 'star', 'head', TOP, { n: 5 }).burst(1.32, 'dust', 'root', [0, 0, -6], { n: 10 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      fallBack(P, 1); P.face('eyes', 'swirl').face('mouth', 'o'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.rot('footR', -20 * bump(t, 0.6, 0.8)).rot('earL', 0, 0, -10 * bump(t, 1.4, 1.7)).burst(1.2, 'star', 'head', [0, 22, 6], { n: 2 });
    } },
    // victory: a hopping spin, then both fists up, cackling
    win: { len: 1.9, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const h = t < 0.8 ? hop(t, 0.8, 6, { crouch: 1.2 }) : { y: wob(t, 0.8, -0.8, 3, 6), sq: wob(t, 0.8, -0.14, 3, 6) };
      P.pos('root', 0, Math.max(0, h.y), 0).sq('body', h.sq).rot('root', 0, 360 * seg(t, 0.15, 0.6, E.inout), 0); if (h.y < 0) plant(P, LEGS, h.y, LEG);
      const pose = seg(t, 0.85, 1.0, E.back);
      arms(P, [-160 * pose, 0, -20 * pose], [0, 0, 0], [-160 * pose, 0, 20 * pose], [0, 0, 0]); P.rot('head', -10 * pose, 0, 0);
      P.face('eyes', 'happy').face('mouth', 'laugh');
      P.burst(0.8, 'ring', 'root', [0, 1, 0], {}); rainbowBurst(P, 0.9, 'head', TOP, 2);
    } },
    // asleep curled up on its side, hood pulled over its eyes, snoring through the long nose
    sleep: { len: 3.0, loop: true, f(P, t) {
      const br = Math.sin((t / 3.0) * Math.PI * 2);
      P.pos('body', 0, -1.2 + br * 0.2, 0).rot('body', 16, 0, 0).sq('body', -0.06 + br * 0.03); plant(P, LEGS, -1.2 + br * 0.2, LEG);
      P.rot('head', 18 + br * 3, 0, 12).rot('hoodTip', 30, 0, 10).rot('earR', 0, 0, 16).rot('earL', 0, 0, -16);
      arms(P, [-40, 0, 30], [-60, 0, 30], [-40, 0, -30], [-60, 0, -30]);
      P.face('eyes', 'closed').face('mouth', br > 0.3 ? 'o' : 'smirk'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', [4, 22, 4], {}).burst(1.6, 'z', 'head', [4, 22, 4], {});
    } },
  },
};
def.anim = anim;
