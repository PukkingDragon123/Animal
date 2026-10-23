// Zapkit — a cute lightning kitten (an homage to the 80s ThunderCats cartoon, stage 1 of the line
// that grows into Thundersabre). A big-headed black kitten in red, black and gold: a wild red
// hero's mane-tuft with a forelock flipped up, red cheek ruffs, gold socks, a gold lightning-bolt
// tail tip that crackles, two tiny sabre fangs, golden slit-pupil eyes — and on its chest an
// original emblem: a gold cat-head mark split by a red bolt. It tries very hard to be a hero.
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import { shade, gradient, layer, on, ramp, shift } from './kit.js';
import { eyeRig, eyesAt, eyesScale, glance } from './eyes.js';
import { B, L, both, twin, acc, region, ell, stroke, cloth, velvet, goldP, silverP, strapP, formMap, beat, env, catEmblem, boltP, SPFX } from './story_parts.js';

const C = {
  fur: '#24202e', furHi: '#423c54', furLo: '#100e16', mark: '#c8202e', markHi: '#ff4a4a',
  hair: '#e0302a', hairHi: '#ff7a4a', hairLo: '#8a1018',
  gold: '#ffc828', goldHi: '#fff08a', goldLo: '#c07a14',
  muzzle: '#f4d488', mask: '#3e3852', nose: '#e84a5a', mouth: '#4a1020', tongue: '#ff7a8a', fang: '#fbf6e8',
  ear: '#e8404a', ink: '#100a0e',
};

// ---------------------------------------------------------------- painters
const furP = (p, w, h, f) => {
  shade(C.fur, { top: C.furHi, bottom: C.furLo })(p, w, h, f);
  if (f === 'down') return;
  for (let y = 1; y < h; y += 3) for (let x = (y * 2) % 4; x < w; x += 4) p.px(x, y, C.furHi);
};
// the back and haunches carry red lightning-stripe markings
const backP = (p, w, h, f) => {
  furP(p, w, h, f);
  if (f === 'down') return;
  const n = Math.max(2, Math.round(w / 7));
  for (let k = 0; k < n; k++) { const x0 = Math.round(((k + 0.5) / n) * w); stroke(p, [[x0 - 1, 0], [x0 + 1, h * 0.25], [x0 - 1, h * 0.4], [x0 + 1, h * 0.6]], C.mark, 1); p.px(x0 - 1, 0, C.markHi); }
};
const sockP = (p, w, h, f) => { gradient([C.goldHi, C.gold, C.goldLo])(p, w, h, f); if (f === 'south') for (let x = 1; x < w; x += 2) p.px(x, h - 1, C.goldLo); };
// the face: black fur, a slightly lighter mask round the eyes and muzzle, whisker dots
const HEAD = { x0: -6, top: 18, w: 12, h: 9.4 };
const faceP = (p, w, h, f) => {
  furP(p, w, h, f);
  const X = (mx) => (mx - HEAD.x0) * (w / HEAD.w), Y = (my) => (HEAD.top - my) * (h / HEAD.h);
  for (const s of [-1, 1]) region(p, w, h, ell(X(2.8 * s), Y(12.8), 8.6, 7.4), (x, y) => ((x + y) % 6 === 0 ? C.fur : C.mask));
  region(p, w, h, ell(X(0), Y(9.6), 8.0, 4.2), (x, y) => ramp(['#fff0b8', C.muzzle, '#d8a858'], y / h, x, y), '#c08a3a');
  // a red flame marking up the forehead
  stroke(p, [[X(0), Y(17.8)], [X(-0.6), Y(16.6)], [X(0.5), Y(15.6)], [X(0), Y(14.8)]], C.mark, 2);
};
const muzzleP = (p, w, h, f) => {
  if (f === 'down') { p.rect(0, 0, w, h, C.mouth); return; }
  shade(C.muzzle, { top: shift(C.muzzle, 0.2), bottom: shift(C.muzzle, -0.25) })(p, w, h, f);
  if (f !== 'south') return;
  const cx = w / 2;
  for (const s of [-1, 1]) { p.px(Math.round(cx + s * 2.6 - 0.5), h - 2, C.ink); p.px(Math.round(cx + s * 1.4 - 0.5), h - 1, C.ink); for (const dy of [2, 4]) p.px(Math.round(cx + s * (w * 0.36) - 0.5), dy, '#a87a3a'); }
  p.px(Math.floor(cx), h - 2, C.ink).px(Math.floor(cx) - 1, h - 2, C.ink);
};
const jawP = (p, w, h, f) => { if (f === 'up') { p.rect(0, 0, w, h, C.mouth); p.rect(1, 1, w - 2, h - 1, C.tongue); return; } shade(C.muzzle, { bottom: '#c8984a' })(p, w, h, f); };
const noseP = gradient(['#ff8a9a', C.nose, '#a82a3a']);
const fangP = gradient(['#ffffff', C.fang, '#d8ccb0']);
const earP = (p, w, h, f) => { furP(p, w, h, f); if (f === 'south') region(p, w, h, (x, y) => x > 0 && x < w - 1 && y > 0 && Math.abs(x + 0.5 - w / 2) < (y / h) * (w / 2 - 0.5) + 0.6, (x, y) => (y < h * 0.4 ? '#ff8a8a' : C.ear)); };
// the hero's mane-tuft: red, dark strands, a hot gold streak
const hairP = (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c = ramp([C.hairHi, C.hair, C.hairLo], f === 'up' ? 0.1 : f === 'down' ? 1 : y / Math.max(1, h - 1), x, y);
    const k = (x * 2 + y) % 5; if (k === 0) c = shift(c, -0.22); else if (k === 2 && y < h * 0.5) c = C.hairHi;
    if ((x + y * 3) % 23 === 0) c = C.gold;
    p.px(x, y, c);
  }
};
const ruffP = (p, w, h, f) => { hairP(p, w, h, f); if (f === 'south' || f === 'north') for (let y = 0; y < h; y += 3) p.px(f === 'south' ? 0 : w - 1, y, 0); };
// drip painters
const capeP = (p, w, h, f) => { velvet(C.hair, { hi: C.hairHi, lo: C.hairLo })(p, w, h, f); if (f !== 'up' && f !== 'down') for (let x = 0; x < w; x++) p.px(x, h - 1, C.gold); };
const beltP = (p, w, h, f) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y === 0 || y === h - 1 ? C.goldLo : '#1a1620'); };
const helmP = (p, w, h, f) => { gradient([C.goldHi, C.gold, C.goldLo])(p, w, h, f); if (f === 'south') { for (let x = 0; x < w; x++) p.px(x, h - 1, C.hairLo); p.rect(Math.floor(w / 2) - 1, 1, 2, 2, C.mark); } };
const bladeP = (p, w, h, f) => { silverP(p, w, h, f); if (f === 'south' || f === 'north') for (let y = 0; y < h; y++) p.px(Math.floor(w / 2), y, '#ffffff'); };
const gemP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, x + y < 2 ? '#ffb0b0' : (x + y) % 3 === 0 ? '#ff3a3a' : '#c80a1a'); };
const scarfP = (p, w, h, f) => { cloth(C.hair, { hi: C.hairHi, lo: C.hairLo, folds: 4 })(p, w, h, f); };

// ---------------------------------------------------------------- the model
const PAW = [B([-3.8, 0, -1.4], [2.8, 1.2, 3.0], sockP)];
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-2.8, 13.0, 8.04], line: '#140a0a', iris: '#ffc81e', irisDark: '#c8701a', accent: '#fff08a', pupilColor: '#100608', extra: ['smug', 'glint'], map: { open: [
  '............',
  '.l..........',
  '.llllllll...',
  '.lIIIIIiill.',
  'liiiikiiiil.',
  'liihikkiiiil',
  'liihikkiiiil',
  'liiiikkiiiil',
  '.licikkiicl.',
  '..lcccccll..',
  '...llllll...',
] } });
const HAIR = [
  B([-3.4, 17.8, -0.6], [6.8, 1.0, 6.4], hairP),
  B([-1.6, 18.2, 4.0], [3.2, 3.2, 2.0], hairP, { pivot: [0, 18.4, 5], rot: [-36, 0, 0] }),
  B([-2.8, 18.0, -4.2], [5.6, 2.6, 5.4], hairP, { pivot: [0, 18.4, 0.6], rot: [26, 0, 0] }),
  ...both(B([-3.2, 18.2, 1.4], [2.0, 2.6, 2.2], hairP, { pivot: [-2.2, 18.4, 2.5], rot: [-8, 0, 16] })),
];
export const def = {
  name: 'zapkit', ppu: 3, scale: 0.4, outline: { color: '#0a060c', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...twin({ name: 'hindR', parent: 'root', pivot: [-2.4, 5.6, -4], cubes: [B([-4.2, 2.2, -6.2], [3.6, 5.0, 4.4], backP)] }),
    ...twin({ name: 'hpawR', parent: 'hindR', pivot: [-2.4, 1.2, -4], cubes: PAW.map((c) => ({ ...c, o: [c.o[0], 0, -4.6] })) }),
    { name: 'body', parent: 'root', pivot: [0, 6, -4], cubes: [
      B([-3.8, 4, -6.4], [7.6, 6.4, 11.4], backP, { faces: { south: furP, down: furP } }),
      B([-1.9, 4.5, 4.9], [3.8, 3.8, 0.5], catEmblem({ base: furP })),
      // tier 2: a belt with a gold buckle round the middle, or a red hero cape
      ...acc('acc-belt', [B([-4.0, 4.6, -2.4], [8.0, 1.2, 6.0], beltP), B([-1.0, 4.4, 3.5], [2.0, 1.6, 0.4], goldP)]),
      // tier 1 (or): a red scarf
      ...acc('acc-scarf', [B([-4.2, 8.6, 0.6], [8.4, 2.0, 5.0], scarfP)]),
    ] },
    { name: 'cape', parent: 'body', pivot: [0, 10.4, 1.6], cubes: acc('acc-cape', [B([-4.4, 10.2, -7.6], [8.8, 0.6, 9.0], capeP), B([-4.4, 4.0, -8.0], [8.8, 6.6, 0.6], capeP)]) },
    { name: 'scarfEnd', parent: 'body', pivot: [2.6, 9.2, 4.6], cubes: acc('acc-scarf', [B([2.0, 5.0, 4.8], [1.8, 4.4, 0.6], scarfP)]) },
    // the storm sword (tier 3) slung across its back
    { name: 'sword', parent: 'body', pivot: [0, 10.8, -2], rot: [0, 0, -50], cubes: acc('acc-sword', [
      B([-0.6, 10.6, -2.6], [1.2, 9.0, 0.6], bladeP), B([-2.0, 9.6, -2.8], [4.0, 1.0, 1.0], goldP), B([-0.5, 6.8, -2.7], [1.0, 2.8, 0.8], strapP('#5a2a1a')), B([-0.7, 9.7, -3.0], [1.4, 0.8, 0.4], gemP),
    ]) },
    ...twin({ name: 'legR', parent: 'body', pivot: [-2.4, 5.6, 3.0], cubes: [B([-3.6, 0.9, 1.8], [2.4, 5.0, 2.4], furP)] }),
    ...twin({ name: 'pawR', parent: 'legR', pivot: [-2.4, 1.2, 3.0], cubes: PAW.map((c) => ({ ...c, o: [c.o[0], 0, 1.6] })) }),
    // tier 1: a little gold claw gauntlet on its right forepaw
    { name: 'claw', parent: 'pawR', pivot: [-2.4, 1.2, 3.0], cubes: acc('acc-claw', [B([-4.0, 0.8, 1.4], [3.2, 2.2, 3.2], goldP), ...[-3.6, -2.6, -1.6].map((x) => B([x, 0.4, 4.4], [0.5, 0.8, 1.6], silverP)), B([-3.0, 2.0, 4.4], [1.2, 0.6, 0.3], gemP)]) },
    { name: 'tail1', parent: 'body', pivot: [0, 8.6, -6.2], rot: [40, 0, 0], cubes: [B([-0.7, 7.9, -11.6], [1.4, 1.4, 5.6], furP)] },
    { name: 'tail2', parent: 'tail1', pivot: [0, 8.6, -11.4], rot: [24, 0, 0], cubes: [B([-0.6, 8.0, -15.8], [1.2, 1.2, 4.6], furP)] },
    { name: 'bolt', parent: 'tail2', pivot: [0, 8.6, -15.6], cubes: [
      B([0, 6.0, -20.4], [0, 5.4, 5.0], boltP, { plane: 'x', glow: true }),
      B([-2.5, 6.0, -17.6], [5.0, 5.4, 0], boltP, { plane: 'z', glow: true }),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 9.6, 3.4], cubes: [
      B([-6, 8.6, -1.2], [12, 9.4, 9.2], furP, { faces: { south: faceP } }),
      B([-5.2, 18.0, -0.4], [10.4, 0.6, 7.6], furP),
      B([-2.2, 9.2, 8.0], [4.4, 2.4, 1.4], muzzleP),
      B([-0.8, 11.2, 9.2], [1.6, 0.9, 0.6], noseP),
      ...both(B([-1.6, 8.3, 8.9], [0.5, 1.0, 0.4], fangP)),
      ...both(B([-7.4, 8.8, 0.8], [1.8, 4.0, 5.6], ruffP)),
      // tier 3 (or): a little gold lightning-rod helm
      ...acc('acc-helm', [B([-5.4, 18.4, 0.2], [10.8, 1.8, 7.2], helmP), B([-0.4, 20.2, 3.2], [0.8, 4.0, 0.8], goldP), B([-1.6, 23.6, 2.6], [3.2, 2.6, 0], boltP, { plane: 'z', glow: true })]),
    ] },
    ...EYES.bones,
    { name: 'jaw', parent: 'head', pivot: [0, 9.3, 7.4], cubes: [B([-1.8, 8.3, 6.9], [3.6, 1.0, 2.2], jawP)] },
    ...twin({ name: 'earR', parent: 'head', pivot: [-4.4, 17.6, 2.6], rot: [0, 0, 14], cubes: [B([-6.2, 17.4, 1.8], [3.6, 2.6, 1.4], earP), B([-5.6, 19.8, 2.0], [2.4, 1.6, 1.0], earP), B([-5.1, 21.2, 2.2], [1.4, 1.2, 0.8], earP)] }),
    { name: 'hair', parent: 'head', pivot: [0, 18.2, 3], cubes: HAIR },
  ],
  drip: [
    [{ id: 'acc-claw', name: 'Gold claw gauntlet' }, { id: 'acc-scarf', name: 'Red hero scarf' }],
    [{ id: 'acc-cape', name: 'Red hero cape' }, { id: 'acc-belt', name: 'Emblem belt' }],
    [{ id: 'acc-sword', name: 'Storm sword' }, { id: 'acc-helm', name: 'Lightning-rod helm' }],
  ],
  attach: {
    head: { bone: 'hair', at: [0, 19.6, 2.6], size: 10 },
    face: { bone: 'head', at: [0, 13, 8.2], size: 10 },
    neck: { bone: 'body', at: [0, 9, 4.6], size: 8 },
    back: { bone: 'body', at: [0, 10.6, -2], size: 8 },
  },
};
// the luxury form: black stays black, the red mane and markings turn gold, the bolt burns blue
def.dripForm = {
  map: formMap(({ h, s, l }, glow) => (glow ? undefined : s < 0.14 ? 'keep' : l < 0.36 && h > 200 && h < 300 ? 'black' : (h < 20 || h > 330) && s > 0.4 ? 'gold' : undefined)),
  fx: { bolt: SPFX.boltblue, 'sp-zap': SPFX.zapblue, note: SPFX.goldnote },
};

// ---------------------------------------------------------------- animation
const TIP = [0, 8.6, -19], TOP = [0, 21, 3], MOUTH = [0, 9, 9.6];
const zaps = (P, t, rate = 6) => P.stream(SPFX.zap, 'bolt', TIP, { rate, spread: 1, speed: 0.6 });
function rear(P, k) {              // up on its hind legs
  P.rot('body', -55 * k, 0, 0).pos('body', 0, -0.6 * k, 0).rot('head', 40 * k, 0, 0).rot('legR', 30 * k).rot('legL', 30 * k).rot('tail1', -30 * k, 0, 0);
  P.rot('hindR', -30 * k).rot('hindL', -30 * k).rot('hpawR', 30 * k).rot('hpawL', 30 * k);
}
function onSide(P, k) {
  P.rot('root', 0, 0, 80 * k).pos('root', 4.6 * k, 4.2 * k, 0).rot('head', 0, 0, -10 * k).rot('jaw', 20 * k);
  P.rot('legR', -20 * k, 0, -20 * k).rot('legL', 20 * k, 0, 10 * k).rot('hindR', 20 * k, 0, -20 * k).rot('hindL', -10 * k, 0, 10 * k).rot('tail1', -30 * k, 0, 0);
}
export const anim = {
  start: 'idle', seed: 41,
  breathe: { bone: 'body', amp: 0.025, per: 1.8 },
  blink: { slot: 'eyes', closed: 'closed', every: [1.8, 4.2], dur: 0.1 },
  look: { bone: 'head', yaw: 32, pitch: 14, speed: 7 },
  springs: [
    { bone: 'earR', tip: [0, 4, 0], k: 220, d: 9, gain: 0.6, max: 16, axes: [1, 0, 1] },
    { bone: 'earL', tip: [0, 4, 0], k: 220, d: 9, gain: 0.6, max: 16, axes: [1, 0, 1] },
    { bone: 'hair', tip: [0, 3, 2], k: 200, d: 9, gain: 0.6, max: 12, axes: [1, 0.3, 1] },
    { bone: 'tail1', tip: [0, 0, -5], k: 150, d: 7, gain: 0.8, max: 20 },
    { bone: 'tail2', tip: [0, 0, -4.6], k: 130, d: 6, gain: 0.9, max: 26 },
    { bone: 'cape', tip: [0, -5, -6], k: 120, d: 6, gain: 0.9, max: 24, axes: [1, 0, 1] },
    { bone: 'scarfEnd', tip: [0, -4, 0], k: 120, d: 6, gain: 1, max: 30 },
  ],
  faces: { eyes: EYES.slot },
  fidget: { every: [3, 6], clips: ['dance', 'dance', 'ho', 'pounce'] },
  clips: {
    // a bouncy kitten: a quick little bob, tail swishing and crackling, ears flicking, eyes darting
    idle: { len: 1.6, loop: true, f(P, t, c) {
      const b = bounce(t, 0.8, { squash: 0.06, stretch: 0.03 });
      P.pos('body', 0, b.u * 0.4, 0).sq('body', b.sq).rot('head', 2 + wave(t, 0.625) * 3, wave(t, 0.625) * 8, wave(t, 0.625, 1) * 6);
      P.rot('tail1', wave(t, 1.25) * 8, wave(t, 0.625) * 22, 0).rot('tail2', wave(t, 1.25, 1) * 10, wave(t, 0.625, 1) * 16, 0);
      const fl = bump(t, 0.9, 1.05) * (c.loopN % 2); P.rot('earR', 0, 0, -18 * fl).rot('earL', 0, 0, 10 * bump(t, 0.3, 0.42) * ((c.loopN + 1) % 2));
      eyesAt(P, ...glance(t + c.loopN * 0.9, [[0, 0], [0.3, 0.05], [-0.3, 0], [0, 0]], 0.45));
      if (c.loopN % 3 === 1) zaps(P, t, 5);
    } },
    // a quick kitten trot, tail up
    walk: { len: 0.5, loop: true, f(P, t) {
      const ph = t / 0.5, s = Math.sin(ph * Math.PI * 2), lift = (v) => Math.max(0, v) * 1.0;
      P.rot('legR', -26 * s).rot('hindL', -26 * s).rot('legL', 26 * s).rot('hindR', 26 * s);
      P.pos('legR', 0, lift(s), 0).pos('hindL', 0, lift(s), 0).pos('legL', 0, lift(-s), 0).pos('hindR', 0, lift(-s), 0);
      P.pos('body', 0, Math.abs(Math.cos(ph * Math.PI * 2)) * 0.5, 0).rot('head', 2, -s * 4, 0).rot('tail1', -20, s * 14, 0);
    } },
    // battle cry: it rears up and tries for a mighty roar — out comes a squeaky mew and a spray of sparks
    cry: { len: 1.8, next: 'idle', f(P, t) {
      P.lookW = 1 - env(t, 0.1, 1.6);
      const crouch = seg(t, 0, 0.25) * (1 - seg(t, 0.25, 0.35)), up = seg(t, 0.3, 0.5, E.back) * (1 - seg(t, 1.3, 1.65, E.inout)), squeak = bump(t, 0.95, 1.2);
      rear(P, 0.6 * up); P.pos('body', 0, -0.8 * crouch, 0).sq('body', -0.12 * crouch);
      P.rot('head', -20 * up + 10 * squeak, 0, wave(t, 6) * 4 * up).rot('jaw', 40 * up - 16 * squeak).scl('hair', 1 + 0.15 * up, 1 + 0.2 * up, 1 + 0.15 * up);
      P.face('eyes', crouch > 0.3 ? 'angry' : squeak > 0.4 ? 'shock' : up > 0.3 ? 'shut' : undefined); P.blinkOK = false;
      if (up > 0.4 && t < 1.0) { P.stream(SPFX.zap, 'head', [0, 18, 4], { rate: 30, spread: 1, speed: 1.2 }); zaps(P, t, 20); }
      P.burst(0.45, 'ring', 'head', MOUTH, { scale: 0.6, tint: [1, 0.95, 0.6] }).burst(1.0, 'sweat', 'head', [6, 17, 4], {});
    } },
    // physical: a butt-wiggle, a pounce and a swipe of the paw
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const wig = t < 0.32 ? Math.sin(t * Math.PI * 2 * 8) * seg(t, 0, 0.1) : 0, crouch = seg(t, 0, 0.15) * (1 - seg(t, 0.32, 0.38));
      const h = seg(t, 0.32, 0.5, E.out) * (1 - seg(t, 0.5, 0.7, E.in)), swipe = bump(t, 0.42, 0.62);
      P.pos('root', 0, 3 * h - 0.6 * crouch, 6 * seg(t, 0.32, 0.6, E.out) * (1 - seg(t, 0.7, 1.0, E.inout))).rot('body', 8 * crouch - 12 * h, 0, 0).rot('hindR', 0, 0, 0);
      P.rot('body', 0, 6 * wig, 0).rot('tail1', -10, 20 * wig, 0).rot('legR', -100 * swipe, 0, 20 * swipe).rot('head', -6 * crouch, 0, 0);
      P.face('eyes', crouch > 0.3 ? 'angry' : swipe > 0.3 ? 'shut' : undefined); P.blinkOK = false;
      P.burst(0.52, 'spark', 'head', [0, 10, 14], {}).burst(0.52, SPFX.zap, 'head', [0, 10, 14], { n: 4 }).burst(0.54, 'star', 'head', [0, 10, 14], { n: 3 });
    } },
    // special (electric): it arches and puffs, static crawls over it, a bolt strikes its tail — and it fires
    special: { len: 1.9, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const arch = seg(t, 0.05, 0.4, E.out) * (1 - seg(t, 0.75, 0.85)), fire = seg(t, 0.8, 0.9, E.out) * (1 - seg(t, 1.4, 1.75, E.inout));
      P.rot('body', 0, 0, 0).pos('body', 0, 1.2 * arch, 0).scl('body', 1 + 0.1 * arch, 1 + 0.12 * arch, 1 + 0.05 * arch).scl('hair', 1 + 0.25 * arch, 1 + 0.35 * arch, 1 + 0.25 * arch);
      P.rot('tail1', -50 * arch, 0, 0).rot('head', 8 * arch - 10 * fire, 0, 0).rot('jaw', 36 * fire).pos('root', 0, 0, -1.2 * fire);
      P.face('eyes', arch > 0.3 ? 'angry' : fire > 0.3 ? 'shut' : t > 1.6 ? 'smug' : undefined);
      if (arch > 0.3) { zaps(P, t, 30); P.stream(SPFX.zap, 'body', [0, 10, -1], { rate: 20, spread: 1, speed: 1, key: 'b' }); }
      for (const y of [30, 24, 18]) P.burst(0.6, 'bolt', 'bolt', [0, y - 10, -17], { n: 1, scale: 1.6 });
      if (fire > 0.3) P.stream('bolt', 'head', MOUTH, { rate: 40, dir: [0, 0, 1], speed: 7, spread: 0.12, scale: 1.2 });
      P.burst(0.82, 'ring', 'head', MOUTH, { scale: 0.9, tint: [1, 0.95, 0.5] }).burst(0.82, 'spark', 'head', MOUTH, {});
    } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.2, 0.65, E.inout));
      P.pos('root', 0, 0.6 * k, -2.2 * k).rot('body', -12 * k, 0, wave(t, 14) * 4 * k).rot('head', -14 * k, 0, 0).rot('jaw', 28 * k).sq('body', -0.12 * k).scl('hair', 1 + 0.2 * k);
      P.face('eyes', t < 0.4 ? 'x' : 'sad'); P.blinkOK = false;
      P.burst(0.02, 'spark', 'body', [0, 10, 6], {}).burst(0.02, SPFX.zap, 'body', [0, 10, 0], { n: 4 }).burst(0.08, 'sweat', 'head', [6, 17, 4], {});
    } },
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.9, 1.0)), fall = seg(t, 0.9, 1.3, E.bounce);
      P.rot('body', 0, wave(t, 1.8) * 16 * dizzy, wave(t, 2.4) * 8 * dizzy).rot('head', 0, 0, wave(t, 2.4, 1) * 14 * dizzy);
      onSide(P, fall); P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.85, 'star', 'head', TOP, { n: 5 }).burst(1.28, 'dust', 'root', [0, 0, 0], { n: 8 }).burst(1.3, 'smoke', 'bolt', TIP, { n: 3 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      onSide(P, 1); P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.rot('tail2', 0, 20 * bump(t, 0.8, 1.2), 0).burst(1.4, SPFX.zap, 'bolt', TIP, { n: 1 });
    } },
    // victory: the hero pose — up on its hind legs, one paw raised to the sky, a bolt answers
    win: { len: 2.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const k = seg(t, 0.1, 0.4, E.back) * (1 - seg(t, 1.6, 1.95, E.inout)), paw = seg(t, 0.35, 0.55, E.back) * (1 - seg(t, 1.5, 1.8));
      rear(P, k); P.rot('legR', -150 * paw, 0, 10 * paw).rot('head', -10 * paw, 0, 0).rot('jaw', 24 * paw);
      P.face('eyes', paw > 0.4 ? 'happy' : undefined);
      for (const y of [-14, -10, -6]) P.burst(0.55, 'bolt', 'pawR', [-2.4, y, 3], { n: 1, scale: 1.4 });
      P.burst(0.58, 'ring', 'pawR', [-2.4, -2, 3], { scale: 0.6, tint: [1, 0.95, 0.6] }).burst(0.6, 'sparkle', 'head', TOP, { n: 8 });
    } },
    // asleep: curled up in a loaf, tail tucked round, the tip sparking now and then
    sleep: { len: 3.0, loop: true, f(P, t) {
      const br = Math.sin((t / 3) * Math.PI * 2);
      P.pos('body', 0, -2.4 + br * 0.15, 0).sq('body', -0.06 + br * 0.03).pos('hindR', 0, -2.4, 0).pos('hindL', 0, -2.4, 0);
      P.rot('legR', -70).rot('legL', -70).rot('pawR', 70).rot('pawL', 70).rot('hindR', 60).rot('hindL', 60).rot('hpawR', -60).rot('hpawL', -60);
      P.rot('head', 16, 0, 8).rot('tail1', -30, 70, 0).rot('tail2', 0, 50, 0).rot('earR', 0, 0, 10).rot('earL', 0, 0, -10);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', [4, 19, 4], {}).burst(1.8, 'z', 'head', [4, 19, 4], {}).burst(2.4, SPFX.zap, 'bolt', TIP, { n: 1 });
    } },
    // the dance: paw-punches to the beat, a butt wiggle, a spin and the hero point
    dance: { len: 2.6, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const b = beat(t, 0.25), live = 1 - seg(t, 1.9, 2.05), side = b.n % 2 ? 1 : -1, up = env(t, 0, 1.95, 0.2, 0.15);
      rear(P, 0.45 * up);
      P.rot(side > 0 ? 'legL' : 'legR', -70 * b.pulse * live, 0, 0).pos('body', 0, 0.4 * b.pulse * live, 0).rot('body', 0, side * 10 * live, 0);
      P.rot('head', 0, -side * 10 * live, side * 8 * live).rot('tail1', 0, side * 30 * live, 0).rot('earR', 0, 0, -10 * b.pulse).rot('earL', 0, 0, 10 * b.pulse);
      const spin = seg(t, 1.95, 2.3, E.inout), pose = seg(t, 2.25, 2.4, E.back);
      P.rot('root', 0, 360 * spin, 0).pos('root', 0, 2 * bump(t, 1.95, 2.3), 0);
      rear(P, 0.7 * pose); P.rot('legR', -140 * pose, 0, 0);
      P.face('eyes', t > 2.3 ? 'wink' : b.pulse > 0.6 ? 'happy' : undefined).rot('jaw', 20 * b.pulse * live + 20 * pose);
      P.burst(0.05, 'note', 'head', [5, 20, 3], {}).burst(0.55, 'note', 'head', [-5, 20, 3], {}).burst(1.05, 'note', 'head', [5, 20, 3], {}).burst(1.55, 'note', 'head', [-5, 20, 3], {}).burst(2.3, SPFX.zap, 'pawR', [-2.4, 0, 3], { n: 5 }).burst(2.32, 'sparkle', 'head', TOP, { n: 6 });
    } },
    // signature fidget: "Thunder… HO!" — paw to the sky, the bolt answers, it gets frizzed, shakes it off, proud anyway
    ho: { len: 3.2, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const k = seg(t, 0.1, 0.45, E.back) * (1 - seg(t, 1.6, 1.9, E.inout)), paw = seg(t, 0.4, 0.6, E.back) * (1 - seg(t, 1.5, 1.75));
      const zap = bump(t, 0.95, 1.15), frizz = seg(t, 1.0, 1.1) * (1 - seg(t, 2.2, 2.6)), shake = t > 2.0 && t < 2.6 ? Math.sin((t - 2.0) * Math.PI * 2 * 6) * (1 - seg(t, 2.0, 2.6)) : 0;
      rear(P, k); P.rot('legR', -150 * paw, 0, 10 * paw).rot('head', -14 * paw, 0, 0).rot('jaw', 30 * paw * (t < 0.95 ? 1 : 0) + 24 * zap);
      P.scl('body', 1 + 0.18 * frizz).scl('hair', 1 + 0.4 * frizz, 1 + 0.6 * frizz, 1 + 0.4 * frizz).scl('tail1', 1 + 0.3 * frizz).pos('root', 0, 1.5 * zap, 0);
      P.rot('root', 0, 0, 10 * shake).rot('head', 0, 0, 16 * shake);
      P.face('eyes', paw > 0.4 && t < 0.95 ? 'shut' : zap > 0.2 ? 'x' : frizz > 0.3 && t < 2.0 ? 'shock' : shake !== 0 ? 'closed' : t > 2.6 ? 'smug' : undefined);
      for (const y of [-18, -13, -8]) P.burst(0.95, 'bolt', 'pawR', [-2.4, y, 3], { n: 1, scale: 1.6 });
      P.burst(0.97, 'ring', 'body', [0, 8, 0], { scale: 0.8, tint: [1, 0.95, 0.5] }).burst(0.97, 'spark', 'pawR', [-2.4, -1, 3], { scale: 1.2 });
      if (frizz > 0.4 && t < 2.0) P.stream(SPFX.zap, 'body', [0, 10, 0], { rate: 16, spread: 1, speed: 1 });
      P.burst(1.3, 'smoke', 'hair', [0, 21, 3], { n: 4 }).burst(2.05, 'dust', 'body', [0, 10, 0], { n: 6, spread: 1 }).burst(2.7, 'sparkle', 'head', TOP, { n: 4 });
    } },
    // fidget: wiggles its rear, pounces on a stray spark and bats it about
    pounce: { len: 2.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const crouch = seg(t, 0, 0.3) * (1 - seg(t, 0.9, 1.0)), wig = t > 0.3 && t < 0.95 ? Math.sin(t * Math.PI * 2 * 7) : 0;
      const jump = bump(t, 0.95, 1.35), bat = t > 1.4 && t < 2.0 ? Math.sin((t - 1.4) * Math.PI * 2 * 3) : 0;
      P.rot('body', 10 * crouch, 6 * wig, 0).pos('body', 0, -1 * crouch, 0).rot('head', -10 * crouch, 0, 0).rot('tail1', -20 * crouch, 30 * wig, 0);
      P.pos('root', 0, 4 * jump, 4 * seg(t, 0.95, 1.35)).rot('body', -14 * jump, 0, 0).rot('legR', -60 * jump - 40 * Math.max(0, bat)).rot('legL', -60 * jump - 40 * Math.max(0, -bat));
      eyesScale(P, 1 + 0.12 * crouch, 1 + 0.18 * crouch);
      P.face('eyes', crouch > 0.3 ? 'wide' : jump > 0.3 ? 'shut' : bat !== 0 ? 'happy' : undefined);
      P.burst(0.2, SPFX.zap, 'root', [0, 3, 12], { n: 2 }).burst(1.3, 'spark', 'root', [0, 1, 12], { scale: 0.6 }).burst(1.5, SPFX.zap, 'root', [0, 2, 12], { n: 3 });
    } },
  },
};
def.anim = anim;
