// Walrusk — split final stage of the Beatlet line (Bio): a massive, heavy armoured beetle tank.
// Its psychedelic carapace swirls yellow and purple and is dotted with egg-shaped spots, its
// mandibles have grown into long ivory walrus tusks under two big puffy whisker pads, and its horn
// is stubby, blunt and huge. Heavy-lidded eyes with a small purple iris. Slow, unbothered and
// enormously strong — "goo goo g'joob". From Pepperhorn (the other branch is Abbeyhorn).
// Drip (one per tier): 1 eggshell cap | big daisy · 2 daisy garland | swirl shades pushed up ·
// 3 gold egg chain | psychedelic bass drum on its back.
import { eyeRig } from './eyes.js';
import { shift } from './kit.js';
import { dripMap } from './beetle_parts.js';
import { B, both, chitin, segs, fur, tipP, band, at, GOLD, goldP, pixStates, legs, arm, arms, emote, mand, darts, walkCycle, sharedClips, onBack, E, seg, bump, wob, wave, TAU } from './beetle_parts.js';

const C = {
  purple: ['#b080e8', '#6a3aa8', '#45206e', '#2a1044'], yellow: ['#fff4a0', '#ffd23e', '#e0a020', '#9a6410'], lilac: ['#f0e0ff', '#d0b0f0', '#a080c8', '#6a4a8a'],
  ivory: ['#fffaf0', '#f0e2c8', '#d0b890', '#a08458'], pad: ['#f6e0c8', '#e6c4a4', '#cca482', '#8a6248'], whisk: ['#fff6e0', '#e8d6b4', '#b89a78'], bristle: ['#b89a78', '#8a6e50', '#5e4a36', '#3a2e22'], egg: '#fff8ec', yolk: '#ffb020',
};
// ---------------------------------------------------------------- painters
const shellP = chitin(C.purple, { gloss: '#e8d0ff' });
// the psychedelic carapace: yellow, wavy purple bands, and egg-shaped spots (white with a yolk)
function psychP(p, w, h, face, cube) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [X, Y, Z] = at(face, cube, x, y), u = face === 'east' || face === 'west' ? Z : X;
    const wv = Math.sin(u * 0.55 + Y * 0.32) + Math.sin(Y * 0.5 - u * 0.2) * 0.6;
    let c = face === 'down' ? C.purple[3] : wv > 0.75 ? C.purple[1] : wv > 0.45 ? C.purple[0] : band(C.yellow, face, x, y, h);
    p.px(x, y, c);
  }
  if (face === 'down' || face === 'up') return;
  // egg spots on a coarse grid
  for (let gy = 2; gy < h - 3; gy += 9) for (let gx = 2 + ((gy / 9) & 1) * 5; gx < w - 3; gx += 10) {
    for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) { const v = (j - 2.6) / (j < 2.6 ? 2.6 : 2), uu = (i - 1.5) / 2; if (uu * uu + v * v <= 1) p.px(gx + i, gy + j, (i === 1 || i === 2) && j >= 2 && j <= 3 ? C.yolk : (i + j < 2 ? '#ffffff' : C.egg)); }
  }
}
const bellyP = segs(C.lilac, { every: 1.8 });
const bandArmP = (p, w, h, face, cube) => { shellP(p, w, h, face, cube); if (face !== 'up' && face !== 'down') for (let x = 0; x < w; x++) { p.px(x, 2, C.yellow[1]); p.px(x, 3, C.yellow[2]); } };
const ivoryP = tipP(C.ivory);
const nailP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.ivory[0] : band(C.ivory, face, x, y, h)); };
// the walrus muzzle: two big puffy whisker pads, pocked with whisker pores, a bristle fringe below
function padP(p, w, h, face) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (face !== 'south') { p.px(x, y, face === 'up' ? C.pad[0] : face === 'down' ? C.whisk[2] : band(C.pad, face, x, y, h)); continue; }
    const v = y / (h - 1), edge = x === 0 || x === w - 1;
    let c = v < 0.3 ? C.pad[0] : v < 0.66 ? C.pad[1] : C.pad[2];
    if (edge) c = shift(c, -0.08);
    if (y >= 2 && y < h - 3 && y % 2 === 0 && (x + y) % 3 === 0 && !edge) c = C.pad[3];       // whisker pores in neat rows
    if (y >= h - 3) c = x % 2 ? C.whisk[1] : C.whisk[0];                                       // the stiff cream bristles
    if (y === h - 1 && x % 2) c = C.whisk[2];
    p.px(x, y, c);
  }
}
const hornP = chitin(C.purple, { gloss: '#e8d0ff', dots: false });
// drip painters
const eggP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let c = face === 'up' ? '#f4ecdc' : y > h - 2 ? '#e8dcc4' : C.egg; if (face !== 'up' && face !== 'down' && y === 0 && x % 3 !== 1) c = 0; if (face !== 'up' && face !== 'down' && y === 1 && x % 3 === 0) c = 0; p.px(x, y, c); } if (face === 'up') for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) p.px(x, y, (x + y) % 3 ? '#fff2c0' : C.yolk); };
const daisyP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'south' || face === 'up' ? (Math.abs(x - (w - 1) / 2) < 1.1 && Math.abs(y - (h - 1) / 2) < 1.1 ? C.yolk : '#ffffff') : '#3a8a2a'); };
const leiP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = Math.floor(x / 3) % 3; p.px(x, y, (x % 3 === 1 && y === Math.floor(h / 2)) ? C.yolk : ['#ffffff', '#ff8ad8', '#ffe060'][k]); } };
const swirlP = (p, w, h, face) => { const cx = (w - 1) / 2, cy = (h - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const e = x === 0 || y === 0 || x === w - 1 || y === h - 1; const a = Math.atan2(y - cy, x - cx), r = Math.hypot(x - cx, y - cy); p.px(x, y, e ? C.purple[3] : face === 'south' ? (Math.floor(r * 1.4 - a * 1.2 + 20) % 2 ? '#ff6ad0' : '#ffd23e') : C.purple[2]); } };
const eggPropP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' || (x + y) < 2 ? '#ffffff' : y > h - 2 ? '#e8dcc4' : C.egg); };
const goldEggP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = (y - h * 0.55) / (y < h * 0.55 ? h * 0.55 : h * 0.45), u = (x - (w - 1) / 2) / (w / 2); if (u * u + v * v <= 1) p.px(x, y, x + y < w * 0.6 ? GOLD[0] : Math.abs(y - h * 0.45) < 0.6 && x % 2 ? GOLD[3] : GOLD[1]); } };
const drumHeadP = (p, w, h, face) => { const cx = (w - 1) / 2, cy = (h - 1) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const r = Math.hypot(x - cx, y - cy) / (w / 2), a = Math.atan2(y - cy, x - cx); let c = face === 'north' ? (r > 0.92 ? C.purple[3] : r < 0.3 ? C.yolk : Math.floor(a * 6 / Math.PI + r * 6) % 2 ? '#ff6ad0' : '#ffd23e') : (y % 4 === 0 ? GOLD[1] : C.purple[1]); p.px(x, y, c); } };

// ---------------------------------------------------------------- the model
const R = { hipX: 5.0, hipY: 9.4, ankleY: 2.2, L1: 3.6, L2: 3.6 };
// heavy-lidded eyes: a thick double lid over a white eye with a small purple iris
// (a painted lid with a crease over the top half; lowered lids slide over the eye in the lid colour)
const EYE_OPEN = [
  '...llllll...',
  '.llccccccll.',
  'lcccIIIIcccl',
  'llllllllllll',
  'lsssIIIIsssl',
  'lwwwihkiwwwl',
  '.lwwiiiiwwl.',
  '...llllll...',
];
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-2.6, 27.4, 7.22], line: '#1a0a22', pupilColor: '#10061a', iris: '#a050e0', irisDark: '#4a1a7a', accent: '#8a5ac8',
  map: { open: EYE_OPEN, ...pixStates(EYE_OPEN, { fill: 'c', top: 3 }) } });
const RIGHT = [
  { name: 'thighR', parent: 'root', pivot: [-5.0, 9.4, 0], cubes: [B(-7.2, 5.4, -2.2, -2.8, 10.6, 2.2, shellP)] },
  { name: 'shinR', parent: 'thighR', pivot: [-5.0, 5.8, 0], cubes: [B(-7.0, 2.0, -2.0, -3.0, 6.2, 2.0, shellP)] },
  { name: 'footR', parent: 'shinR', pivot: [-5.0, 2.2, 0], cubes: [
    B(-7.4, 0, -2.4, -2.6, 2.6, 3.4, shellP), B(-7.2, 0, 3.4, -6.0, 1.2, 4.4, nailP), B(-5.6, 0, 3.4, -4.4, 1.2, 4.6, nailP), B(-4.0, 0, 3.4, -2.8, 1.2, 4.4, nailP),
  ] },
  { name: 'elytraR', parent: 'torso', pivot: [-0.1, 25.6, -5.0], cubes: [B(-9.2, 13.6, -7.2, -0.04, 25.6, -4.4, psychP), B(-7.6, 25.6, -6.4, -0.04, 26.6, -3.2, psychP)] },
  { name: 'armR', parent: 'torso', pivot: [-9.6, 23.4, 0], cubes: [B(-12.8, 16.8, -2.6, -8.4, 24.8, 2.6, bandArmP)] },
  { name: 'foreR', parent: 'armR', pivot: [-10.6, 17.4, 0], cubes: [B(-13.4, 10.0, -3.0, -7.8, 17.8, 3.0, bandArmP)] },
  { name: 'handR', parent: 'foreR', pivot: [-10.6, 10.0, 0], cubes: [B(-13.6, 6.4, -3.0, -7.6, 10.2, 3.2, shellP)] },
  { name: 'clawR', parent: 'handR', pivot: [-10.6, 6.6, 1.0], cubes: [B(-13.2, 5.0, 0.6, -12.0, 6.6, 2.6, nailP), B(-11.4, 4.8, 0.6, -10.2, 6.6, 2.8, nailP), B(-9.6, 5.0, 0.6, -8.4, 6.6, 2.6, nailP)] },
  // the walrus tusks
  { name: 'mandR', parent: 'head', pivot: [-2.0, 24.2, 7.6], cubes: [
    B(-2.8, 17.8, 7.0, -1.3, 24.4, 8.4, ivoryP),
    B(-2.5, 15.8, 7.2, -1.6, 17.8, 8.2, ivoryP, { pivot: [-2.05, 17.8, 7.7], rot: [0, 0, -12] }),
  ] },
];
export const def = {
  name: 'walrusk', ppu: 3, scale: 0.74, outline: { color: '#14081c', px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'pelvis', parent: 'root', pivot: [0, 9.4, 0], cubes: [B(-7.4, 6.4, -5.8, 7.4, 14.0, 5.4, psychP)] },
    { name: 'torso', parent: 'pelvis', pivot: [0, 13.4, 0], cubes: [
      B(-8.8, 13.0, -6.2, 8.8, 25.0, 5.6, psychP), B(-9.8, 14.4, -5.4, 9.8, 23.6, 4.8, psychP), B(-8.0, 25.0, -5.4, 8.0, 26.2, 4.4, psychP),
      B(-6.2, 13.4, 5.4, 6.2, 22.6, 6.4, bellyP),
      // dripped: a garland of daisies round its neck
      B(-7.6, 23.2, 5.0, 7.6, 24.4, 6.4, leiP, { id: 'acc-lei', hide: true }), B(-8.2, 23.4, -5.4, -7.0, 24.6, 5.0, leiP, { id: 'acc-lei', hide: true }), B(7.0, 23.4, -5.4, 8.2, 24.6, 5.0, leiP, { id: 'acc-lei', hide: true, mirror: true }),
      // ultra dripped: a huge gold chain with a cracked golden egg
      B(-6.4, 21.0, 6.42, -0.4, 21.8, 6.9, goldP, { pivot: [-6.4, 21.4, 6.66], rot: [0, 0, -30], id: 'acc-eggchain', hide: true }),
      B(0.4, 21.0, 6.42, 6.4, 21.8, 6.9, goldP, { pivot: [6.4, 21.4, 6.66], rot: [0, 0, 30], id: 'acc-eggchain', hide: true }),
      B(-1.8, 14.6, 6.5, 1.8, 18.8, 6.5, goldEggP, { plane: 'z', id: 'acc-eggchain', hide: true, outline: false }), B(-1.4, 15.0, 6.42, 1.4, 18.4, 7.0, goldP, { id: 'acc-eggchain', hide: true }),
    ] },
    // ultra (or): a psychedelic bass drum strapped to its back
    { name: 'bassdrum', parent: 'torso', pivot: [0, 19.4, -7.4], cubes: [
      B(-4.6, 14.8, -10.6, 4.6, 24.0, -7.3, drumHeadP, { id: 'acc-bassdrum', hide: true }),
      B(-5.0, 14.4, -10.9, 5.0, 15.0, -7.1, goldP, { id: 'acc-bassdrum', hide: true }), B(-5.0, 23.8, -10.9, 5.0, 24.4, -7.1, goldP, { id: 'acc-bassdrum', hide: true }),
    ] },
    // three eggs for the juggling fidget
    ...[1, 2, 3].map((i) => ({ name: 'jegg' + i, parent: 'torso', pivot: [0, 20, 12], cubes: [B(-0.9, 18.9, 11.3, 0.9, 21.3, 12.7, eggPropP, { id: 'jegg', hide: true })] })),
    { name: 'head', parent: 'torso', pivot: [0, 24.6, 3.4], cubes: [
      B(-5.0, 23.8, 0.8, 5.0, 29.6, 7.2, shellP),
      B(-4.0, 22.6, 7.0, -0.05, 25.9, 9.0, padP), B(0.05, 22.6, 7.0, 4.0, 25.9, 9.0, padP, { mirror: true }),   // the walrus muzzle: two whisker pads
      // dripped (or): swirl-lens shades pushed up on its brow
      B(-4.4, 28.8, 7.0, -0.9, 30.4, 7.6, swirlP, { id: 'acc-swirl', hide: true }), B(0.9, 28.8, 7.0, 4.4, 30.4, 7.6, swirlP, { id: 'acc-swirl', hide: true, mirror: true }),
      B(-0.9, 29.4, 7.1, 0.9, 29.8, 7.4, goldP, { id: 'acc-swirl', hide: true }),
      // normal (or): a big daisy tucked by its horn
      B(-4.8, 29.4, 3.0, -2.6, 31.6, 3.6, daisyP, { id: 'acc-daisy', hide: true }), B(-4.2, 28.6, 3.2, -3.2, 29.6, 3.4, (p, w, h) => p.rect(0, 0, w, h, '#3a8a2a'), { id: 'acc-daisy', hide: true }),
    ] },
    { name: 'horn', parent: 'head', pivot: [0, 29.4, 4.2], cubes: [
      B(-2.6, 29.2, 2.4, 2.6, 32.8, 6.0, hornP), B(-1.8, 32.8, 3.0, 1.8, 34.8, 5.4, hornP),
      // normal: half an eggshell perched on the horn ("I am the eggman")
      B(-2.3, 34.0, 2.6, 2.3, 36.0, 5.8, eggP, { id: 'acc-egg', hide: true }),
    ] },
    ...both(...RIGHT),
    ...EYES.bones,
  ],
};
def.drip = [
  [{ id: 'acc-egg', name: 'Eggshell cap' }, { id: 'acc-daisy', name: 'Big daisy' }],
  [{ id: 'acc-lei', name: 'Daisy garland' }, { id: 'acc-swirl', name: 'Swirl shades' }],
  [{ id: 'acc-eggchain', name: 'Golden egg chain' }, { id: 'acc-bassdrum', name: 'Psychedelic bass drum' }],
];
def.attach = {
  head: { bone: 'horn', at: [0, 34.8, 4.2], size: 4.4 },
  face: { bone: 'head', at: [0, 27.4, 7.25], size: 10 },
  neck: { bone: 'torso', at: [0, 23.6, 5.6], size: 15 },
  back: { bone: 'torso', at: [0, 19.4, -7.3], size: 17 },
};

// ---------------------------------------------------------------- animation
const HEAD = [0, 33, 4], TUSK = [0, 16.4, 8];
const stompFX = (P, t0, x) => P.burst(t0, 'dust', 'root', [x, 0.5, 1], { n: 5, dir: [0, 0.3, 0], spread: 1, speed: 1.1 });
const shared = sharedClips(R, {
  headTop: HEAD, weight: 0.9,
  downPose: (P, k, t) => { onBack(P, R, k, t, { lift: 5.2, slide: 3 }); mand(P, 12 * k, -10 * k); },
  sleepPose: (P, br) => { legs(P, R, { y: -4.2 + br * 0.3, fR: [0, 2.2], fL: [0, 2.2], spread: 12 }); P.rot('torso', 8 + br * 1.4, 0, 0).sq('torso', br * 0.02).rot('head', 16 + br * 2, 0, 0); arms(P, { out: 16, fwd: 30, bend: 30 }); mand(P, 4 + Math.max(0, br) * 6); },
  hurtExtra: (P, t) => P.burst(0.25, 'sweat', 'head', [5, 29, 5], { n: 1, dir: [1, 1, 0], speed: 0.6 }),
});
export const anim = {
  start: 'idle', seed: 31,
  breathe: { bone: 'torso', amp: 0.026, per: 3.4 },
  blink: { slot: 'eyes', closed: 'closed', every: [3.0, 6.0], dur: 0.18 },
  look: { bone: 'head', yaw: 22, pitch: 10, speed: 2.5 },
  springs: [
    { bone: 'mandR', tip: [0, -6, 0.5], k: 260, d: 12, gain: 0.35, max: 8 },
    { bone: 'mandL', tip: [0, -6, 0.5], k: 260, d: 12, gain: 0.35, max: 8 },
    { bone: 'bassdrum', tip: [0, -2, -2], k: 300, d: 14, gain: 0.3, max: 5 },
  ],
  faces: { eyes: EYES.slot, prop: { default: 'off', states: { on: ['jegg'], off: [] } } },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'juggle', 'scratch', 'yawn'] },
  clips: {
    ...shared,
    // a slow, heavy heave of breath, a lazy sway, a snort now and then, eyes drifting
    idle: { len: 3.6, loop: true, f(P, t) {
      const ph = (t / 3.6) * TAU, br = Math.sin(ph), s = Math.sin(ph / 2);
      legs(P, R, { y: -0.6 + br * 0.25, roll: 2.4 * s });
      P.scl('torso', 1 + 0.03 * br, 1 + 0.015 * br, 1 + 0.03 * br).rot('torso', 0, 2 * s, -1.2 * s).rot('head', -1 * br, -3 * s, 1.5 * s);
      arms(P, { out: 10 + 2 * br, fwd: 4, bend: 8, grip: 6 });
      mand(P, 3 * Math.max(0, br), 0);
      darts(P, t, 0.14, 2.2, 11);
      P.burst(2.6, 'steam', 'head', [0, 24.6, 9], { n: 4, dir: [0, -0.2, 1], speed: 0.6, scale: 0.8 });
      P.face('eyes', t > 2.4 && t < 2.8 ? 'closed' : undefined);
    } },
    // a slow, lumbering stomp; dust at every footfall
    walk: { len: 1.4, loop: true, f(P, t) {
      walkCycle(P, R, t, { len: 1.4, stride: 2.0, lift: 1.4, bob: 0.4, sway: 7, swing: 14, twist: 6, crouch: 0.8, lean: 4, out: 12, bend: 10, heavy: 1 });
      P.rot('head', 2, 0, 0);
      stompFX(P, 0.38, -5); stompFX(P, 1.08, 5);
    } },
    // a cry: rears up, pounds its chest with both fists, and bellows — the ground shakes
    cry: { len: 2.4, next: 'idle', f(P, t) {
      const up = seg(t, 0.05, 0.45, E.inout) * (1 - seg(t, 1.9, 2.3, E.inout)), roar = seg(t, 1.25, 1.4, E.back) * (1 - seg(t, 1.9, 2.25, E.inout));
      legs(P, R, { y: 0.8 * up - 1.0 * roar, pitch: -10 * up + 6 * roar });
      for (const [S, g, t0] of [['R', 1, 0.5], ['L', -1, 0.68], ['R', 1, 0.86], ['L', -1, 1.04]]) { const k = bump(t, t0, t0 + 0.18); arm(P, S, { out: 20 * up, fwd: 50 * up + 30 * k, bend: 80 * up + 30 * k }); P.sq('torso', -0.05 * k); P.burst(t0 + 0.09, 'ring', 'torso', [g * -3, 20, 6.6], { scale: 0.5 }); }
      if (roar > 0.1) arms(P, { out: 60 * roar, fwd: -10 * roar, bend: 20 * roar, grip: 30 * roar });
      P.rot('head', -16 * up - 14 * roar + wave(t, 8) * 3 * roar, 0, 0);
      emote(P, roar > 0.3 ? 'shut' : up > 0.3 ? 'angry' : 'open'); mand(P, 18 * roar, -6 * roar); P.blinkOK = false;
      P.burst(1.3, 'psyring', 'root', [0, 1, 0], { scale: 1.2 }).burst(1.3, 'dust', 'root', [0, 0.5, 0], { n: 16, spread: 1, speed: 2 }).burst(1.32, 'soundring', 'head', [0, 25, 9], { dir: [0, 0.2, 1] });
    } },
    // hammer: both fists high overhead, then slammed down in front
    attack: { len: 1.4, next: 'idle', f(P, t) {
      const lift = seg(t, 0, 0.5, E.inout) * (1 - seg(t, 0.56, 0.66, E.in3)), slam = seg(t, 0.56, 0.66, E.in3) * (1 - seg(t, 0.95, 1.35, E.inout));
      legs(P, R, { y: 0.6 * lift - 2.2 * slam, z: 1.2 * slam, pitch: -14 * lift + 26 * slam, fR: [0, 1.2 * slam], fL: [0, -0.6 * slam] });
      arms(P, { out: 10 + 10 * lift, fwd: 160 * lift + 70 * slam, bend: 30 * lift, grip: 20 });
      P.rot('head', -10 * lift + 16 * slam, 0, 0).sq('torso', 0.04 * lift - 0.08 * slam + wob(t, 0.66, -0.05, 3, 6));
      emote(P, lift > 0.2 || slam > 0.2 ? 'angry' : 'open'); mand(P, 6 + 14 * slam); P.blinkOK = false;
      P.burst(0.66, 'ring', 'root', [0, 0.8, 12], { scale: 1.4 }).burst(0.66, 'dust', 'root', [0, 0.5, 12], { n: 14, spread: 1, speed: 2 }).burst(0.66, 'rock', 'root', [0, 0.5, 12], { n: 10, dir: [0, 1, 0.3], speed: 1.4 });
    } },
    // egg quake: rises up on its toes, arms high — and drops its full weight; a psychedelic shockwave rolls out, eggs flying
    special: { len: 2.6, next: 'idle', f(P, t) {
      const rise = seg(t, 0, 0.7, E.inout) * (1 - seg(t, 0.74, 0.84, E.in3)), drop = t > 0.84 ? 1 - seg(t, 1.5, 2.3, E.inout) : 0, sh = t > 0.84 && t < 1.6 ? wave(t, 16) * (1.6 - t) * 2 : 0;
      legs(P, R, { y: 1.4 * rise - 2.6 * drop + wob(t, 0.84, -1.2, 3, 5), roll: sh, toeR: 14 * rise, toeL: 14 * rise, spread: 8 * drop });
      arms(P, { out: 30 * rise + 50 * drop, fwd: 120 * rise - 20 * drop, bend: 20, grip: 30 });
      P.sq('torso', 0.05 * rise - 0.1 * drop * (1 - seg(t, 0.9, 1.4)) + wob(t, 0.84, -0.06, 3, 5)).rot('head', -16 * rise + 8 * drop, 0, 0);
      emote(P, rise > 0.3 ? 'wide' : drop > 0.5 && t < 1.6 ? 'angry' : 'open'); mand(P, 8 + 18 * drop * (1 - seg(t, 1.5, 2.2))); P.blinkOK = false;
      for (const [i, tt] of [0.84, 1.02, 1.2].entries()) P.burst(tt, 'psyring', 'root', [0, 1 + i * 0.4, 0], { scale: 1.6 + i * 0.5 });
      P.burst(0.84, 'egg', 'root', [0, 1, 4], { n: 24, dir: [0, 1, 0.4], speed: 1.6, spread: 1 }).burst(0.84, 'dust', 'root', [0, 0.5, 0], { n: 20, spread: 1, speed: 2.6 }).burst(0.86, 'rock', 'root', [0, 0.5, 6], { n: 12, dir: [0, 1, 0.5], speed: 1.6 });
    } },
    // victory: a double flex, a chest thump, eggs and flowers popping up around it
    win: { len: 2.6, next: 'idle', f(P, t) {
      const flex = seg(t, 0.1, 0.4, E.back) * (1 - seg(t, 1.2, 1.4, E.inout)), thump = bump(t, 1.4, 1.62) + bump(t, 1.7, 1.92);
      legs(P, R, { y: -0.6 * flex + 0.4 * flex * wave(t, 2), spread: 4 * flex });
      arms(P, { out: 70 * flex, fwd: 10 * flex + 50 * thump, bend: 110 * flex + 60 * thump, grip: 40 * flex });
      P.scl('torso', 1 + 0.06 * flex, 1, 1 + 0.06 * flex).rot('head', -10 * flex, wave(t, 1.5) * 6 * flex, 0).sq('torso', -0.05 * thump);
      emote(P, flex > 0.3 ? 'happy' : thump > 0.3 ? 'shut' : 'open'); mand(P, 6 + 10 * flex); P.blinkOK = false;
      P.burst(0.42, 'egg', 'root', [0, 2, 0], { n: 14, dir: [0, 1, 0], speed: 1.6 }).burst(1.5, 'petal', 'torso', [0, 26, 2], { n: 14, speed: 1.4 }).burst(1.5, 'psyring', 'root', [0, 1, 0], { scale: 1 });
    } },
    // fidget: a long, satisfied scratch of its belly
    scratch: { len: 2.2, next: 'idle', f(P, t) {
      const on = seg(t, 0.1, 0.45, E.inout) * (1 - seg(t, 1.7, 2.1, E.inout)), sc = Math.sin(t * TAU * 4) * on;
      legs(P, R, { y: -0.6, roll: -3 * on });
      arm(P, 'R', { out: 10 * on, fwd: 40 * on, bend: 60 * on + 14 * sc, foreTwist: 20 * on, grip: 30 + 20 * sc }); arm(P, 'L', { out: 10, bend: 8 });
      P.rot('head', 8 * on, 0, -6 * on);
      emote(P, on > 0.4 ? 'sleepy' : 'open', on); mand(P, 4 * on);
    } },
    // fidget: a huge yawn, tusks spreading, arms stretching up
    yawn: { len: 2.6, next: 'idle', f(P, t) {
      const y = bump(t, 0.2, 2.2), st = bump(t, 0.5, 1.9);
      legs(P, R, { y: 0.8 * st - 0.4, pitch: -8 * st, toeR: 8 * st, toeL: 8 * st });
      arms(P, { out: 60 * st, fwd: 40 * st, bend: 30 * st });
      P.rot('head', -24 * y, 0, 0).scl('torso', 1 + 0.05 * y, 1 + 0.03 * y, 1 + 0.05 * y);
      emote(P, y > 0.3 ? 'shut' : 'open', 1); mand(P, 26 * y, -6 * y); P.blinkOK = false;
      P.burst(1.3, 'steam', 'head', [0, 24.6, 9], { n: 6, dir: [0, 0.4, 1], speed: 0.7 });
    } },
    // the walrus shuffle: a heavy stomp-clap from side to side, belly jiggling, tusks swinging, a slow turn, a flex
    dance: { len: 3.2, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.25, E.out) * (1 - seg(t, 2.8, 3.2, E.inout)), ph = t * TAU * 1.25, st = Math.sin(ph), clap = Math.max(0, Math.cos(ph * 2)) ** 6 * on, turn = seg(t, 1.6, 2.4, E.inout), flex = seg(t, 2.4, 2.6, E.back) * (1 - seg(t, 2.85, 3.2));
      legs(P, R, { y: -0.8 - 0.5 * Math.abs(st) * on, roll: 6 * st * on, fR: [1.4 * Math.max(0, st) * on, 0], fL: [1.4 * Math.max(0, -st) * on, 0] });
      P.rot('root', 0, 360 * turn, 0).sq('torso', -0.05 * Math.abs(Math.cos(ph)) * on + 0.04 * flex).rot('head', 6 * Math.abs(st) * on - 10 * flex, 6 * st * on, 4 * st * on);
      arms(P, { out: 30 * on * (1 - clap) + 70 * flex, fwd: 50 * on * (1 - flex), bend: 40 * on + 110 * flex, grip: 30 * flex });
      P.rot('mandR', 0, 0, 8 * st * on).rot('mandL', 0, 0, 8 * st * on);
      emote(P, flex > 0.3 ? 'happy' : 'sleepy', on); mand(P, 4 + 10 * flex); P.blinkOK = false;
      for (const t0 of [0.2, 0.6, 1.0, 1.4]) P.burst(t0, 'ring', 'torso', [0, 18, 12], { scale: 0.4 }).burst(t0, 'note', 'head', [5, 31, 4], { n: 1, dir: [0.4, 1, 0], speed: 0.8 });
      P.burst(2.45, 'psyring', 'root', [0, 1, 0], { scale: 1.1 }).burst(2.45, 'egg', 'root', [0, 3, 2], { n: 10, dir: [0, 1, 0], speed: 1.4 });
      for (const t0 of [0.4, 0.8, 1.2]) P.burst(t0, 'dust', 'root', [0, 0.5, 1], { n: 3, spread: 1, speed: 0.6 });
    } },
    // the juggle: three eggs in a lazy shower — then one goes too high and comes down splat on its own head
    juggle: { len: 4.0, next: 'idle', f(P, t) {
      const on = seg(t, 0.05, 0.4, E.inout) * (1 - seg(t, 3.5, 3.95, E.inout)), splat = t > 3.0;
      P.face('prop', t > 0.3 && t < 3.25 ? 'on' : 'off');
      legs(P, R, { y: -0.6 - 0.8 * bump(t, 3.0, 3.3) });
      for (const i of [1, 2, 3]) {
        const u = ((t * 1.1 + i / 3) % 1 + 1) % 1, hi = i === 2 && t > 2.1, k = hi ? seg(t, 2.1, 3.0, E.lin) : 0;
        let x = u < 0.7 ? -6 + 12 * (u / 0.7) : 6 - 12 * ((u - 0.7) / 0.3), y = u < 0.7 ? Math.sin(Math.PI * u / 0.7) * 12 : -1;
        if (hi) { x = -6 + 6 * k; y = Math.sin(Math.PI * Math.min(1, k * 0.75)) * 22 + (k > 0.66 ? (k - 0.66) * 6 : 0); }
        P.pos('jegg' + i, x, y, hi ? -8 * k : 0).rot('jegg' + i, t * 400 * i, 0, 0);
        if (i === 2 && splat) P.scl('jegg2', 0.01);
      }
      const pump = Math.sin(t * TAU * 1.1 * 1.5);
      arm(P, 'R', { out: 14, fwd: 64 * on, bend: 40 * on + 14 * pump }); arm(P, 'L', { out: 14, fwd: 64 * on, bend: 40 * on - 14 * pump });
      P.rot('head', -16 * on * (t > 2.1 && t < 3.0 ? 1 : 0.4), 0, splat ? wob(t, 3.0, 6, 3, 5) : 0);
      emote(P, splat ? (t < 3.4 ? 'shut' : 'happy') : t > 2.4 ? 'wide' : 'open'); mand(P, splat ? 12 : 4); P.blinkOK = false;
      P.burst(3.0, 'splash', 'head', [0, 33, 5], { n: 18, speed: 1.4, tint: [1, 0.85, 0.3] }).burst(3.0, 'egg', 'head', [0, 33, 5], { n: 6, speed: 1.2 }).burst(3.05, 'drop', 'head', [3, 30, 7], { n: 8, dir: [0, -1, 0.3], speed: 0.6, tint: [1, 0.8, 0.2] });
      P.burst(3.4, 'note', 'head', [5, 31, 4], { n: 3, speed: 1 });
    } },
  },
};
def.anim = anim;
// the ultra-drip form: a black-lacquer shell with gold swirls and gold eggs; ivory tusks turn gold; the purple eye kept
def.dripForm = dripMap({ black: [[240, 330]], gold: [[0, 72]], keep: ['#a050e0', '#4a1a7a'] });

