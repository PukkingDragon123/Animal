// Thundersabre — the tram driver's partner (stage 2 of the storm-cat line, an homage to the 80s
// ThunderCats cartoon). A dark, fierce sabre-toothed storm cat built like a cartoon hero-warrior:
// a storm-charcoal body slashed with gold lightning markings, a huge crimson lion-warrior mane
// streaked black and gold, gold eyes that glow with no pupils, two long ivory sabres that crackle
// with lightning when it swipes, heavy paws, a long tail with a red tuft — and the line's original
// chest emblem, a gold cat-head mark split by a red bolt. Story clip: roar (it roars everyone off
// the tram). Fidgets: charge (its mane gathers a storm and it grounds it) and a sabre-baring yawn.
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import { shade, gradient, layer, on, ramp, shift } from './kit.js';
import { eyeRig, eyesAt, eyesScale, glance } from './eyes.js';
import { B, L, both, twin, acc, region, ell, stroke, goldP, silverP, strapP, formMap, beat, env, catEmblem, boltP, zig, SPFX } from './story_parts.js';

const C = {
  fur: '#2c2a3c', furHi: '#4c4866', furLo: '#14121c', belly: '#4a4658', bellyLo: '#2e2a3a',
  mark: '#ffc828', markLo: '#c07a14',
  mane: '#c8282e', maneHi: '#ff5a3a', maneLo: '#6a0e18', streak: '#1a0a10',
  muzzle: '#6e6a84', nose: '#1a0e14', mouth: '#3a0a12', tongue: '#d85a6a',
  sabre: '#f4ecd8', sabreLo: '#c8b890', claw: '#f0e8d8', ear: '#c8384a', ink: '#0c0810',
};

// ---------------------------------------------------------------- painters
const furP = (p, w, h, f) => {
  shade(C.fur, { top: C.furHi, bottom: C.furLo })(p, w, h, f);
  if (f === 'down') return;
  for (let y = 1; y < h; y += 4) for (let x = (y * 3) % 5; x < w; x += 5) p.px(x, y, C.furHi);
};
// flanks and back: jagged gold lightning markings crossing the dark fur
const stormP = (p, w, h, f) => {
  furP(p, w, h, f);
  if (f === 'down' || f === 'south' || f === 'north') return;
  const n = Math.max(2, Math.round(w / 12));
  for (let k = 0; k < n; k++) {
    const x0 = ((k + 0.5) / n) * w, j = f === 'up' ? w * 0.04 : 2.5;
    zig(p, [[x0 + j, 0], [x0 - j, h * 0.3], [x0 + j * 0.6, h * 0.42], [x0 - j * 0.8, h * 0.7]], C.markLo, C.mark, 1);
  }
};
const bellyP = shade(C.belly, { top: shift(C.belly, 0.15), bottom: C.bellyLo });
const pawP = (p, w, h, f) => { furP(p, w, h, f); if (f === 'south') for (let k = 0; k < 4; k++) { const x = Math.round(((k + 0.5) / 4) * w); p.px(x, h - 1, C.claw); p.px(x, h - 2, C.claw); p.px(x - 1, h - 1, '#a8a090'); } if (f === 'up') for (let x = 2; x < w; x += 3) for (let y = Math.floor(h * 0.6); y < h; y++) p.px(x, y, C.furLo); };
// the mane: crimson locks, black streaks, gold-lit tips, a ragged edge
const maneP = (p, w, h, f) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c = ramp([C.maneHi, C.mane, C.maneLo], f === 'up' ? 0.1 : f === 'down' ? 1 : y / Math.max(1, h - 1), x, y);
    const k = (((x + Math.floor(y / 3) * (f === 'west' ? -1 : 1)) % 6) + 6) % 6;
    if (k === 0 && y % 7 !== 3) c = C.streak; else if (k === 3) c = shift(c, 0.16); else if (k === 4) c = shift(c, 0.06);
    if (f !== 'up' && f !== 'down' && y >= h - 2 && x % 3 === 1) c = C.mark;
    p.px(x, y, c);
  }
  if (f !== 'up' && f !== 'down') for (let x = 0; x < w; x++) if (x % 4 === 2) p.px(x, h - 1, 0);
};
// the face: storm-dark, a lighter muzzle bridge, dark tear-lines under the eyes, a gold bolt on the brow
const HEAD = { x0: -6, top: 29, w: 12, h: 10 };
const faceP = (p, w, h, f) => {
  furP(p, w, h, f);
  const X = (mx) => (mx - HEAD.x0) * (w / HEAD.w), Y = (my) => (HEAD.top - my) * (h / HEAD.h);
  region(p, w, h, (x, y) => Math.abs(x + 0.5 - X(0)) < 3 + (y / h) * 6 && y > Y(25.4), (x, y) => ramp([shift(C.muzzle, 0.15), C.muzzle], y / h, x, y));
  for (const s of [-1, 1]) stroke(p, [[X(2.2 * s), Y(24.2)], [X(2.8 * s), Y(21.6)], [X(3.6 * s), Y(19.4)]], C.ink, 1);
  stroke(p, [[X(0.6), Y(28.8)], [X(-0.5), Y(27.6)], [X(0.5), Y(27.0)], [X(-0.3), Y(26.0)]], C.mark, 2);
};
const muzzleP = (p, w, h, f) => {
  if (f === 'down') { p.rect(0, 0, w, h, C.mouth); return; }
  shade(C.muzzle, { top: shift(C.muzzle, 0.18), bottom: shift(C.muzzle, -0.3) })(p, w, h, f);
  if (f !== 'south') return;
  const cx = w / 2;
  for (let y = Math.floor(h * 0.45); y < h; y++) p.px(Math.floor(cx), y, C.ink);
  for (let x = 1; x < w - 1; x++) { const d = Math.abs(x + 0.5 - cx) / (w / 2); p.px(x, Math.round(h - 1 - (1 - d) * 1.5), C.ink); }
  for (const s of [-1, 1]) for (const dy of [3, 5, 7]) p.px(Math.round(cx + s * w * 0.32 - 0.5), dy, '#2a2836');
};
const jawP = (p, w, h, f) => { if (f === 'up') { p.rect(0, 0, w, h, C.mouth); p.rect(1, 1, w - 2, h - 2, C.tongue); for (let x = 1; x < w - 1; x += 2) p.px(x, 0, C.sabre); return; } shade(C.muzzle, { bottom: C.furLo })(p, w, h, f); };
const noseP = (p, w, h, f) => { shade(C.nose, { top: '#3a2a34' })(p, w, h, f); if (f === 'south' || f === 'up') p.px(1, 0, '#6a5a6a'); };
const sabreP = (p, w, h, f) => { gradient(['#ffffff', C.sabre, C.sabre, C.sabreLo])(p, w, h, f); if (f === 'south' || f === 'east' || f === 'west') { for (let y = 0; y < h; y++) p.px(0, y, '#ffffff'); p.px(Math.floor(w / 2), h - 1, '#a89878'); } };
const earP = (p, w, h, f) => { furP(p, w, h, f); if (f === 'south') region(p, w, h, ell(w / 2, h * 0.65, w * 0.32, h * 0.45), C.ear); };
// lightning crawling along the sabres (glow planes, toggled by the 'arc' slot)
const arcP = (seed) => (p, w, h) => { let x = w / 2; for (let y = 0; y < h; y++) { const xx = Math.round(x); p.px(xx, y, '#ffffff'); p.px(xx + 1, y, '#fff070'); p.px(xx - 1, y, '#ffb02a'); if ((y + seed) % 3 === 0) x += ((y * 7 + seed * 3) % 5) - 2; x = Math.max(1, Math.min(w - 2, x)); } };
// drip painters
const gemP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, x + y < 2 ? '#ffb0b0' : (x + y) % 3 === 0 ? '#ff3a3a' : '#c80a1a'); };
const bladeP = (p, w, h, f) => { silverP(p, w, h, f); if (f === 'south' || f === 'north') for (let y = 0; y < h; y++) { p.px(Math.floor(w / 2), y, '#ffffff'); if (y % 5 === 2) p.px(0, y, '#8ae0ff'); } };
const plateP = catEmblem({ base: goldP, gold: '#fff2a0', goldLo: '#e8b030', line: '#8a5a10', red: '#e8202a' });
const spikeP = gradient(['#ffffff', '#fff2a0', '#e8b030', '#8a5a10']);

// ---------------------------------------------------------------- the model
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-3.0, 25.6, 20.04], glow: 'all', line: '#140808', iris: '#ffd23a', irisDark: '#ff8a1a', accent: '#fff6b0', extra: ['smug', 'glint'], map: { open: [
  'll..........',
  'lcllllll....',
  '.lcwwcclllll',
  '..IcwwwwccI.',
  '...iicwwcii.',
  '....iiiiii..',
  '............',
] } });
const LEG = [B([-7.6, 3.6, 4.6], [4.8, 11.6, 4.8], furP)];
const PAW = [B([-8.0, 0, 4.2], [5.6, 2.6, 6.8], pawP)];
const BRACER = (id) => acc(id, [B([-8.0, 6.0, 4.2], [5.6, 3.0, 5.6], goldP), B([-8.3, 7.0, 6.2], [0.4, 1.2, 1.6], gemP)]);
export const def = {
  name: 'thundersabre', ppu: 3, scale: 0.52, outline: { color: '#0a060c', px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...twin({ name: 'hindR', parent: 'root', pivot: [-5, 15, -13], cubes: [B([-7.8, 7.4, -16.6], [5.4, 9.4, 6.6], stormP), B([-7.2, 2.0, -15.2], [4.2, 6.6, 3.8], furP)] }),
    ...twin({ name: 'hpawR', parent: 'hindR', pivot: [-5, 1.6, -13.6], cubes: [B([-7.8, 0, -15.4], [5.4, 2.4, 6.0], pawP)] }),
    { name: 'body', parent: 'root', pivot: [0, 15, -13], cubes: [
      B([-7, 13, -18], [14, 11, 26], stormP, { faces: { down: bellyP } }),
      B([-8.4, 12, 1], [16.8, 14, 11], stormP, { faces: { south: furP, down: bellyP } }),
      B([-6.2, 12.4, -16.6], [12.4, 0.8, 22], bellyP),
      B([-2.7, 12.4, 11.9], [5.4, 5.4, 0.5], catEmblem({ base: furP })),
      // tier 2: a gold breastplate stamped with the emblem, and pauldrons
      ...acc('acc-plate', [B([-6.8, 12.4, 12.2], [13.6, 8.4, 1.2], plateP), ...both(B([-10.2, 21.4, -0.4], [3.4, 4.4, 9.0], goldP))]),
      // tier 2 (or): a spiked gold collar
      ...acc('acc-collar', [B([-7.2, 19.4, 11.6], [14.4, 1.8, 1.4], goldP), ...[-5.4, -2.7, 0, 2.7, 5.4].map((x) => B([x - 0.5, 18.4, 12.6], [1.0, 1.4, 1.4], spikeP, { pivot: [x, 19.2, 13], rot: [40, 0, 0] }))]),
    ] },
    // the storm sword (tier 3) strapped across the back
    { name: 'sword', parent: 'body', pivot: [0, 25, -6], rot: [0, 0, -58], cubes: acc('acc-sword', [
      B([-1.0, 26.4, -6.8], [2.0, 16.0, 0.9], bladeP), B([-3.6, 25.0, -7.1], [7.2, 1.4, 1.5], goldP), B([-0.7, 20.6, -7.0], [1.4, 4.4, 1.2], strapP('#4a1a12')), B([-1.0, 19.4, -7.2], [2.0, 1.4, 1.6], gemP),
      B([-11.0, 24.6, -5.4], [22.0, 0.8, 0.6], strapP('#2a1a14')),
    ]) },
    ...twin({ name: 'legR', parent: 'body', pivot: [-5.2, 15, 7], cubes: [...LEG, ...BRACER('acc-bracers')] }),
    ...twin({ name: 'pawR', parent: 'legR', pivot: [-5.2, 2.4, 7], cubes: PAW }),
    // tier 1: the claw gauntlet on its right foreleg — a gold vambrace and three blades over the paw
    { name: 'gaunt', parent: 'legR', pivot: [-5.2, 15, 7], cubes: acc('acc-gauntlet', [B([-8.2, 4.4, 4.0], [6.0, 4.8, 6.0], goldP), B([-8.5, 6.0, 6.0], [0.4, 1.6, 2.0], gemP)]) },
    { name: 'claws', parent: 'pawR', pivot: [-5.2, 2.4, 7], cubes: acc('acc-gauntlet', [-7.4, -5.6, -3.8].map((x) => B([x, 0.8, 10.8], [0.7, 1.4, 3.4], silverP))) },
    // the tail: long, drooping, curling up into a red tuft
    { name: 'tail1', parent: 'body', pivot: [0, 22, -17.6], rot: [-46, 0, 0], cubes: [B([-1.3, 20.8, -27], [2.6, 2.6, 9.6], furP)] },
    { name: 'tail2', parent: 'tail1', pivot: [0, 22.1, -26.6], rot: [34, 0, 0], cubes: [B([-1.1, 21.0, -34.8], [2.2, 2.2, 8.4], furP)] },
    { name: 'tuft', parent: 'tail2', pivot: [0, 22.1, -34.4], rot: [20, 0, 0], cubes: [B([-2.1, 20.2, -39.0], [4.2, 3.8, 4.8], maneP)] },
    // the lion-warrior mane round the head and over the shoulders
    { name: 'mane', parent: 'body', pivot: [0, 24, 9], cubes: [
      B([-10.2, 19.6, 5.4], [20.4, 13.6, 7.4], maneP),
      B([-8.0, 31.6, 6.6], [16.0, 3.4, 8.4], maneP),
      B([-8.8, 24.2, -2.6], [17.6, 4.4, 9.4], maneP),
      ...both(B([-12.4, 18.6, 6.4], [2.6, 12.6, 5.8], maneP, { pivot: [-11, 30, 9], rot: [0, 0, -8] })),
    ] },
    ...twin({ name: 'lockR', parent: 'mane', pivot: [-8.6, 21, 11], cubes: [B([-10.0, 12.4, 9.6], [2.8, 9.0, 2.8], maneP)] }),
    { name: 'head', parent: 'body', pivot: [0, 23.6, 12], cubes: [
      B([-6, 19, 11], [12, 10, 9], furP, { faces: { south: faceP } }),
      B([-4.2, 18.6, 20], [8.4, 5.0, 4.4], muzzleP),
      B([-1.6, 22.4, 24.2], [3.2, 1.6, 0.8], noseP),
      ...both(B([-4.4, 12.4, 22.2], [1.3, 6.4, 1.3], sabreP)),
      ...both(B([-4.8, 11.6, 23.6], [2.2, 7.6, 0], arcP(3), { plane: 'z', glow: true, id: 'arc', hide: true }), B([-3.75, 11.6, 21.4], [0, 7.6, 2.8], arcP(5), { plane: 'x', glow: true, id: 'arc', hide: true })),
      // tier 3 (or): a horned gold crown with a red gem
      ...acc('acc-crown', [B([-6.3, 28.6, 12.4], [12.6, 1.6, 7.6], goldP), B([-1.0, 28.8, 19.9], [2.0, 1.6, 0.5], gemP), ...[-4.2, 0, 4.2].map((x, i) => B([x - 0.7, 30.0, 18.4], [1.4, i === 1 ? 3.6 : 2.6, 1.4], spikeP, { pivot: [x, 30, 19], rot: [-12, 0, (i - 1) * -16] })), ...both(B([-7.2, 29.4, 13.4], [1.2, 3.6, 1.2], spikeP, { pivot: [-6.6, 29.4, 14], rot: [0, 0, 34] }))]),
    ] },
    ...EYES.bones,
    { name: 'jaw', parent: 'head', pivot: [0, 19.2, 19], cubes: [B([-3.0, 16.6, 18.6], [6.0, 2.4, 5.2], jawP)] },
    ...twin({ name: 'earR', parent: 'head', pivot: [-5.0, 28.8, 15.8], cubes: [B([-6.6, 28.4, 15.2], [3.0, 3.0, 1.4], earP)] }),
  ],
  drip: [
    [{ id: 'acc-gauntlet', name: 'Claw gauntlet' }, { id: 'acc-bracers', name: 'Gold war bracers' }],
    [{ id: 'acc-plate', name: 'Emblem breastplate' }, { id: 'acc-collar', name: 'Spiked gold collar' }],
    [{ id: 'acc-sword', name: 'Storm sword' }, { id: 'acc-crown', name: 'Horned storm crown' }],
  ],
  attach: {
    head: { bone: 'head', at: [0, 29.6, 15], size: 13 },
    face: { bone: 'head', at: [0, 25.6, 20.2], size: 12 },
    neck: { bone: 'body', at: [0, 19.4, 12.4], size: 15 },
    back: { bone: 'body', at: [0, 25, -6], size: 15 },
  },
};
// the luxury form: the storm fur black lacquer, the mane gold, the eyes and lightning burn blue
def.dripForm = {
  map: formMap(({ h, s, l }, glow) => (glow ? undefined : s < 0.14 ? 'keep' : l < 0.4 && h > 200 && h < 300 ? 'black' : (h < 20 || h > 330) && s > 0.4 ? 'gold' : undefined)),
  fx: { bolt: SPFX.boltblue, 'sp-zap': SPFX.zapblue, spark: SPFX.zapblue, note: SPFX.goldnote },
};

// ---------------------------------------------------------------- animation
const NOSE = [0, 22, 25], MOUTH = [0, 18, 24], TOP = [0, 36, 10], TIP = [0, 22, -38];
const sky = (P, t0, bone, at, n = 3, scale = 1.8) => { for (let i = 0; i < n; i++) P.burst(t0 + i * 0.03, 'bolt', bone, [at[0], at[1] + 6 + i * 6, at[2]], { n: 1, scale }); };
function rear(P, k) {
  P.rot('body', -38 * k, 0, 0).rot('head', 26 * k, 0, 0).rot('legR', 20 * k).rot('legL', 20 * k).rot('tail1', 20 * k, 0, 0);
  P.rot('hindR', -14 * k).rot('hindL', -14 * k).rot('hpawR', 14 * k).rot('hpawL', 14 * k);
}
function onSide(P, k) {
  P.rot('root', 0, 0, 84 * k).pos('root', 15 * k, 8.2 * k, 0).rot('head', 0, 0, -14 * k).rot('jaw', 22 * k);
  P.rot('legL', -16 * k, 0, 24 * k).rot('hindL', 10 * k, 0, 20 * k).rot('legR', 10 * k).rot('tail1', 0, 0, -20 * k);
}
function steps(P, ph, amp = 1) {
  const s = Math.sin(ph * Math.PI * 2), lift = (v) => Math.max(0, v) * 1.6 * amp;
  P.rot('legR', -22 * s * amp).rot('hindL', -18 * s * amp).rot('legL', 22 * s * amp).rot('hindR', 18 * s * amp);
  P.pos('legR', 0, lift(s), 0).pos('hindL', 0, lift(s), 0).pos('legL', 0, lift(-s), 0).pos('hindR', 0, lift(-s), 0);
}
export const anim = {
  start: 'idle', seed: 53,
  breathe: { bone: 'body', amp: 0.018, per: 2.8 },
  blink: { slot: 'eyes', closed: 'closed', every: [3, 6], dur: 0.1 },
  look: { bone: 'head', yaw: 30, pitch: 12, speed: 4 },
  springs: [
    { bone: 'mane', tip: [0, 6, -2], k: 200, d: 9, gain: 0.5, max: 8, axes: [1, 0.2, 1] },
    { bone: 'lockR', tip: [0, -8, 0], k: 120, d: 6, gain: 1, max: 24, axes: [1, 0, 1] },
    { bone: 'lockL', tip: [0, -8, 0], k: 120, d: 6, gain: 1, max: 24, axes: [1, 0, 1] },
    { bone: 'tail1', tip: [0, 0, -9], k: 120, d: 6, gain: 0.8, max: 18 },
    { bone: 'tail2', tip: [0, 0, -8], k: 100, d: 5, gain: 1, max: 24 },
    { bone: 'tuft', tip: [0, 0, -4], k: 100, d: 5, gain: 1.1, max: 30 },
    { bone: 'earR', tip: [0, 3, 0], k: 240, d: 10, gain: 0.5, max: 12, axes: [1, 0, 1] },
    { bone: 'earL', tip: [0, 3, 0], k: 240, d: 10, gain: 0.5, max: 12, axes: [1, 0, 1] },
  ],
  faces: { eyes: EYES.slot, arc: { default: 'off', states: { off: [], on: ['arc'] } } },
  fidget: { every: [4, 8], clips: ['dance', 'dance', 'charge', 'yawn'] },
  clips: {
    // heavy, slow power: deep breaths, the head scanning, the tail tip flicking sparks; now and then a snarl
    idle: { len: 3.0, loop: true, f(P, t, c) {
      const br = Math.sin((t / 3) * Math.PI * 2);
      P.pos('body', 0, br * 0.3, 0).rot('head', br * 2, wave(t, 0.333) * 10, 0).rot('mane', 0, wave(t, 0.333) * 3, 0);
      P.rot('tail1', wave(t, 0.666) * 6, wave(t, 0.333) * 14, 0).rot('tuft', 0, 30 * bump(t, 1.9, 2.3), 0);
      eyesAt(P, ...glance(t + c.loopN * 1.4, [[0, 0], [-0.3, 0], [0, 0], [0.3, 0]], 0.75));
      P.burst(2.05, SPFX.zap, 'tuft', TIP, { n: 2 });
      if (c.loopN % 3 === 2) { const sn = env(t, 0.8, 1.6, 0.12, 0.25); P.rot('jaw', 22 * sn).rot('head', 6 * sn, 0, 0).face('eyes', sn > 0.3 ? 'angry' : undefined); }
    } },
    // a prowl: head low and level, shoulders rolling
    walk: { len: 1.1, loop: true, f(P, t) {
      const ph = t / 1.1, s = Math.sin(ph * Math.PI * 2);
      steps(P, ph);
      P.pos('body', 0, Math.abs(Math.cos(ph * Math.PI * 2)) * 0.5 - 0.4, 0).rot('body', 2, s * 3, s * 3).rot('head', 6, -s * 4, -s * 3).rot('tail1', 0, s * 14, 0);
    } },
    // battle cry: a thunder roar — it rears back, roars, and lightning strikes all round it
    cry: { len: 2.2, next: 'idle', f(P, t) {
      P.lookW = 1 - env(t, 0.1, 2.0);
      const draw = seg(t, 0, 0.35, E.inout) * (1 - seg(t, 0.35, 0.45)), roar = seg(t, 0.4, 0.55, E.back) * (1 - seg(t, 1.6, 1.95, E.inout));
      rear(P, 0.35 * roar); P.pos('body', 0, -0.8 * draw, -1 * draw).rot('head', 10 * draw - 22 * roar + wave(t, 12) * 2 * roar, 0, 0).rot('jaw', 52 * roar).scl('mane', 1 + 0.12 * roar);
      P.face('eyes', draw > 0.3 ? 'angry' : roar > 0.3 ? 'angry' : undefined).face('arc', roar > 0.3 ? 'on' : 'off'); P.blinkOK = false;
      for (const [t0, x, z] of [[0.55, -18, 8], [0.75, 18, -6], [0.95, -10, -20], [1.15, 14, 16]]) sky(P, t0, 'root', [x, 8, z]);
      for (const r0 of [0.55, 0.8, 1.05]) P.burst(r0, 'ring', 'head', MOUTH, { scale: 1.4, tint: [1, 0.95, 0.6] });
      P.burst(0.56, 'dust', 'root', [0, 0, 6], { n: 14, spread: 1, speed: 1.8 });
    } },
    // physical: the lightning-charged sabre swipe — draw back, sabres crackling, and a raking slash
    attack: { len: 1.1, next: 'idle', f(P, t) {
      const bk = seg(t, 0, 0.32, E.out) * (1 - seg(t, 0.32, 0.4, E.in)), hit = seg(t, 0.36, 0.48, E.in3) * (1 - seg(t, 0.62, 1.05, E.inout));
      P.pos('root', 0, 0, -2 * bk + 7 * hit).rot('body', -6 * bk + 6 * hit, 0, 0).rot('head', -24 * bk + 30 * hit, 22 * bk - 30 * hit, -10 * bk + 16 * hit).rot('jaw', 40 * bk + 20 * hit);
      P.rot('legR', -50 * bk + 30 * hit).scl('mane', 1 + 0.08 * bk);
      P.face('eyes', 'angry').face('arc', t > 0.1 && t < 0.75 ? 'on' : 'off'); P.blinkOK = false;
      P.burst(0.48, 'spark', 'head', [0, 14, 30], { scale: 1.6 }).burst(0.48, 'bolt', 'head', [0, 14, 30], { n: 4, scale: 1.4 }).burst(0.5, SPFX.zap, 'head', [0, 14, 28], { n: 6 }).burst(0.5, 'star', 'head', [0, 14, 30], { n: 4 });
    } },
    // special (electric): the storm call — up on its hind legs, bolts strike its raised paws, it slams down in a ring of lightning
    special: { len: 2.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const up = seg(t, 0.1, 0.5, E.back) * (1 - seg(t, 1.1, 1.25, E.in)), slam = seg(t, 1.15, 1.25) * (1 - seg(t, 1.7, 2.1, E.inout));
      rear(P, up); P.rot('legR', -40 * up).rot('legL', -40 * up).rot('head', -16 * up, 0, 0).rot('jaw', 40 * up).scl('mane', 1 + 0.15 * up);
      P.sq('body', -0.08 * slam).rot('head', 10 * slam, 0, 0);
      P.face('eyes', up > 0.3 ? 'angry' : slam > 0.3 ? 'shut' : undefined).face('arc', t > 0.5 && t < 1.8 ? 'on' : 'off');
      sky(P, 0.6, 'pawR', [-5.2, -4, 7], 4, 2); sky(P, 0.7, 'pawL', [5.2, -4, 7], 4, 2);
      if (up > 0.5) P.stream(SPFX.zap, 'mane', [0, 30, 9], { rate: 30, spread: 1, speed: 1.5 });
      P.burst(1.2, 'ring', 'root', [0, 1, 8], { scale: 3, tint: [1, 0.95, 0.5] }).burst(1.2, 'bolt', 'root', [0, 2, 14], { n: 12, spread: 1, speed: 3, scale: 1.4 }).burst(1.21, 'dust', 'root', [0, 0, 8], { n: 16, spread: 1, speed: 2.4 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.2, 0.7, E.inout));
      P.pos('root', 0, 0, -2.8 * k).rot('body', -6 * k, 0, wave(t, 12) * 3 * k).rot('head', -18 * k, 0, 10 * k).rot('jaw', 30 * k);
      P.face('eyes', t < 0.4 ? 'shut' : 'angry'); P.blinkOK = false;
      P.burst(0.02, 'spark', 'body', [0, 22, 12], { scale: 1.4 }).burst(0.03, SPFX.zap, 'body', [0, 20, 0], { n: 5 });
    } },
    faint: { len: 2.4, next: 'down', f(P, t) {
      const sway = seg(t, 0, 0.3) * (1 - seg(t, 1.0, 1.1)), fall = seg(t, 1.0, 1.5, E.bounce);
      P.rot('body', 0, 0, wave(t, 1.6) * 6 * sway).rot('head', 10 * sway, wave(t, 1.6) * 10 * sway, 0).pos('body', 0, -1.4 * sway, 0);
      onSide(P, fall); P.face('eyes', 'swirl').face('arc', 'off'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.95, 'star', 'head', TOP, { n: 5 }).burst(1.45, 'dust', 'root', [-8, 0, 0], { n: 14, spread: 1 }).burst(1.5, 'smoke', 'mane', [0, 30, 9], { n: 4 });
    } },
    down: { len: 2.6, loop: true, f(P, t) {
      onSide(P, 1); P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.rot('tuft', 0, 24 * bump(t, 1, 1.4), 0).burst(1.6, SPFX.zap, 'tuft', TIP, { n: 1 });
    } },
    // victory: the hero pose — reared up, one paw raised to the sky, the lightning answers, a roar
    win: { len: 2.4, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const k = seg(t, 0.1, 0.5, E.back) * (1 - seg(t, 1.9, 2.3, E.inout)), paw = seg(t, 0.45, 0.65, E.back) * (1 - seg(t, 1.8, 2.1));
      rear(P, k); P.rot('legR', -120 * paw, 0, 14 * paw).rot('head', -18 * paw, 0, 0).rot('jaw', 40 * bump(t, 0.75, 1.5)).scl('mane', 1 + 0.1 * paw);
      P.face('eyes', paw > 0.4 ? 'angry' : undefined).face('arc', paw > 0.4 ? 'on' : 'off');
      sky(P, 0.7, 'pawR', [-5.2, -4, 7], 4, 2);
      P.burst(0.72, 'ring', 'pawR', [-5.2, 0, 7], { scale: 1.2, tint: [1, 0.95, 0.6] }).burst(0.8, 'sparkle', 'head', TOP, { n: 10 });
    } },
    // asleep: lying down, chin on its paws, tail curled round, the odd spark from the tuft
    sleep: { len: 3.6, loop: true, f(P, t) {
      const br = Math.sin((t / 3.6) * Math.PI * 2);
      P.pos('body', 0, -9 + br * 0.3, 0).pos('hindR', 0, -9, 0).pos('hindL', 0, -9, 0);
      P.rot('legR', -84).rot('legL', -84).rot('pawR', 84).rot('pawL', 84).rot('hindR', 80).rot('hindL', 80).rot('hpawR', -80).rot('hpawL', -80);
      P.rot('head', 14, 0, 6).pos('head', 0, -1, 0).rot('tail1', 20, 50, 0).rot('tail2', 0, 40, 0);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'head', [6, 30, 16], {}).burst(2.0, 'z', 'head', [6, 30, 16], {}).burst(2.8, SPFX.zap, 'tuft', TIP, { n: 1 });
    } },
    // the dance: a storm stomp — front paws pounding the beat with sparks, mane tossing, tail whipping, then up for a thunder pose
    dance: { len: 3.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const b = beat(t, 0.3), live = 1 - seg(t, 2.3, 2.45), side = b.n % 2 ? 1 : -1;
      const lift = Math.max(0, Math.sin(Math.min(1, b.ph * 1.4) * Math.PI)) * live;
      P.rot(side > 0 ? 'legL' : 'legR', -36 * (1 - b.pulse) * live, 0, 0).pos(side > 0 ? 'legL' : 'legR', 0, 2.4 * (1 - lift) * live, 0);
      P.pos('body', 0, -0.8 * b.pulse * live, 0).rot('body', 0, side * 5 * live, side * 3 * live).rot('head', 8 * b.pulse * live, -side * 14 * live, side * 10 * live);
      P.rot('tail1', -10 * live, side * 30 * live, 0).rot('tuft', 0, side * 30 * live, 0);
      if (b.ph < 0.15 && t < 2.3) P.stream('dust', side > 0 ? 'pawL' : 'pawR', [side * 5.2, 0, 8], { rate: 40, spread: 1, speed: 0.8 });
      for (let i = 0; i < 8; i++) P.burst(i * 0.3 + 0.02, SPFX.zap, i % 2 ? 'pawL' : 'pawR', [i % 2 ? 5.2 : -5.2, 0.5, 8], { n: 3 });
      const pose = seg(t, 2.4, 2.6, E.back);
      rear(P, 0.8 * pose); P.rot('legR', -90 * pose).rot('jaw', 40 * bump(t, 2.5, 3.0)).rot('head', -14 * pose, 0, 0);
      P.face('eyes', pose > 0.4 || b.pulse > 0.6 ? 'angry' : undefined).face('arc', pose > 0.4 ? 'on' : 'off');
      sky(P, 2.55, 'pawR', [-5.2, -4, 7], 3, 1.8);
      P.burst(0.05, 'note', 'head', [7, 34, 12], {}).burst(0.95, 'note', 'head', [-7, 34, 12], {}).burst(1.85, 'note', 'head', [7, 34, 12], {});
    } },
    // story: the angry roar at the passengers — it drops its shoulders, thrusts its head out and ROARS
    roar: { len: 2.6, next: 'idle', f(P, t) {
      P.lookW = 0; P.blinkOK = false;
      const crouch = seg(t, 0, 0.3, E.inout), roar = seg(t, 0.3, 0.42, E.back) * (1 - seg(t, 1.9, 2.4, E.inout)), k = crouch * (1 - seg(t, 2.1, 2.5, E.inout));
      P.rot('body', 10 * k, 0, 0).pos('body', 0, -1.6 * k, 2 * roar).pos('root', 0, 0, 1.2 * roar);
      P.rot('head', -14 * roar + 6 * k + wave(t, 14) * 2 * roar, wave(t, 3) * 8 * roar, 0).pos('head', 0, 0, 2 * roar).rot('jaw', 58 * roar).scl('mane', 1 + 0.18 * roar, 1 + 0.18 * roar, 1 + 0.1 * roar);
      P.rot('legR', -10 * k).rot('legL', -10 * k).rot('tail1', -30 * roar, 0, 0).rot('earR', 0, 0, 30 * roar).rot('earL', 0, 0, -30 * roar);
      P.face('eyes', 'angry').face('arc', roar > 0.3 ? 'on' : 'off');
      for (const r0 of [0.42, 0.62, 0.82, 1.02, 1.22, 1.42]) P.burst(r0, 'ring', 'head', MOUTH, { scale: 1.6, tint: [1, 0.92, 0.6] });
      if (roar > 0.4) { P.stream('dust', 'root', [0, 0, 22], { rate: 30, dir: [0, 0.2, 1], speed: 2.2, spread: 0.6 }); P.stream(SPFX.zap, 'mane', [0, 28, 10], { rate: 18, spread: 1, speed: 1.4 }); }
      P.burst(0.45, 'anger', 'head', [-8, 34, 14], {}).burst(0.9, 'anger', 'head', [8, 34, 14], {}).burst(0.44, 'bolt', 'head', [0, 18, 34], { n: 5, spread: 1, scale: 1.4 });
    } },
    // fidget: the mane gathers static — arcs crawl, the eyes flare — then it grounds it through one paw with a crack
    charge: { len: 3.2, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const build = seg(t, 0.1, 1.6, E.in), slam = bump(t, 1.75, 2.05), ease = seg(t, 2.05, 2.6);
      P.scl('mane', 1 + 0.22 * build * (1 - ease), 1 + 0.26 * build * (1 - ease), 1 + 0.15 * build * (1 - ease)).rot('head', -8 * build * (1 - ease) + 14 * slam, 0, 0).pos('body', 0, 0.8 * build * (1 - ease), 0);
      P.rot('legR', -60 * bump(t, 1.55, 1.85) + 10 * slam).rot('tail1', -20 * build * (1 - ease), 0, 0).rot('tuft', 0, wave(t, 6) * 20 * build * (1 - ease), 0);
      if (build > 0.2 && t < 1.75) { P.stream(SPFX.zap, 'mane', [0, 28, 8], { rate: 10 + 40 * build, spread: 1, speed: 1.2 }); P.stream(SPFX.zap, 'tuft', TIP, { rate: 12 * build, spread: 1, speed: 0.8, key: 't' }); }
      P.face('eyes', build > 0.5 && t < 1.75 ? 'wide' : slam > 0.3 ? 'shut' : t > 2.4 ? 'smug' : undefined).face('arc', build > 0.5 && t < 2.0 ? 'on' : 'off');
      sky(P, 1.8, 'pawR', [-5.2, 2, 7], 3, 1.4);
      P.burst(1.82, 'ring', 'root', [-5, 0.6, 10], { scale: 1.8, tint: [1, 0.95, 0.5] }).burst(1.82, 'dust', 'root', [-5, 0, 10], { n: 12, spread: 1, speed: 1.8 }).burst(1.84, 'rock', 'root', [-5, 1, 10], { n: 6 }).burst(2.5, 'steam', 'head', NOSE, { n: 4, dir: [0, 0.3, 1] });
    } },
    // fidget: a huge slow yawn that shows off both sabres, a lip-smack and a sleepy blink
    yawn: { len: 2.6, next: 'idle', f(P, t) {
      P.blinkOK = false; P.lookW = 0;
      const y = seg(t, 0.2, 0.9, E.inout) * (1 - seg(t, 1.6, 1.9, E.inout)), smack = bump(t, 1.95, 2.1) + bump(t, 2.15, 2.3);
      P.rot('head', -26 * y, 0, 8 * y).rot('jaw', 64 * y + 12 * smack).rot('body', -3 * y, 0, 0).scl('body', 1 + 0.03 * y).rot('earR', 0, 0, 16 * y).rot('earL', 0, 0, -16 * y);
      P.face('eyes', y > 0.3 ? 'closed' : t > 2.0 ? 'sleepy' : undefined);
      P.burst(1.0, 'sparkle', 'head', [-4, 14, 23], { n: 2 }).burst(1.05, 'sparkle', 'head', [4, 14, 23], { n: 2 });
    } },
  },
};
def.anim = anim;
