// Roygbot — seven Rainblins merged into one machine (Roy G. Biv + robot): a big white battle mech with gold trim,
// a ROYGBIV stripe across its chest and a rainbow arc standing behind it like a halo, run by SEVEN little goblin
// robots, one per colour: Red captains it from a glass dome on the head, Orange, Yellow and Green work the
// controls behind the chest glass, Blue and Indigo ride the shoulder hatches and Violet minds the engine from the
// backpack hatch. Long gorilla arms with rainbow-knuckle fists, goblin-ear fins on the head, LED visor eyes.
// Signature fidget: "roll call" — the crew pops up in rainbow order, then the mech strikes a power pose and the
// arc blazes; second fidget: steam vent (the crew fan themselves, the mech wipes its visor); dance: robot pop.
import { E, seg, bump, wob, wave, hop } from '../anim.js';
import { shade, gradient } from './kit.js';
import { eyeRig, eyesAt, glance, keepEyes } from './eyes.js';
import { B, L, both, twin, acc, goldP, GOLD, plant, beat, env } from './story_parts.js';
import { RAINBOW, GOB, GK, armorP, jointP, pistonP, glassP, bayP, grilleP, stripes, arcP, pilot, GBFX, ARCFX, mechForm, EYE_MECH } from './goblin_parts.js';
import { crisp } from './takanaka_parts.js';

const armor = armorP(), armorT = armorP({ trim: true }), chest = stripes(armorT, { y0: 0.8, width: 1 });
const knuckleP = crisp((p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'south' ? GOB[RAINBOW[Math.min(6, Math.floor((x / w) * 7))]].band : GK.joint); if (face === 'south') for (let x = 0; x < w; x++) p.px(x, h - 1, GK.jointLo); });
const vfinP = gradient([GOLD[0], GOLD[1], GOLD[2]]);
const flagP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, GOB[RAINBOW[Math.min(6, Math.floor((y / h) * 7))]].band); };
const capeP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'south' ? GOB[RAINBOW[Math.min(6, Math.floor((x / w) * 7))]].band : face === 'north' ? (y % 7 === 0 ? GOLD[1] : '#2a1e3a') : '#2a1e3a'); };
const spikeP = gradient([GOLD[0], GOLD[1], GOLD[2], '#7a5010']);
const guitarP = crisp((p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'north' || face === 'south' ? GOB[RAINBOW[Math.min(6, Math.floor((y / h) * 7))]].band : GK.joint); if (face === 'north') { const cx = Math.floor(w / 2); for (let y = 2; y < h - 2; y++) for (const dx of [-1, 1]) p.px(cx + dx, y, '#fffaf0'); p.rect(cx - 2, Math.floor(h * 0.4), 5, 2, GK.joint); } });
// booster flames (glow planes; they burn blue in the ultra-drip form)
const flameP = (f) => (p, w, h) => { const cx = w / 2; for (let y = 0; y < h; y++) { const v = y / (h - 1), half = (1 - v) * w * 0.45 * (0.8 + 0.2 * Math.sin(f * 2 + v * 6)); for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) p.px(x, y, v < 0.3 ? '#fff6c8' : v < 0.6 ? '#ffd040' : '#ff6a1e'); } };

// ---------------------------------------------------------------- the model
const P_ = { pR: ['red', 0, 36.6, 0, 'head'], pO: ['orange', -4.0, 20.4, 7.9, 'body'], pY: ['yellow', 0, 20.6, 7.9, 'body'], pG: ['green', 4.0, 20.4, 7.9, 'body'], pB: ['blue', -12.1, 28.6, 0, 'podR'], pI: ['indigo', 12.1, 28.6, 0, 'podL'], pV: ['violet', 4.6, 30.0, -7.8, 'body'] };
const PILOTS = Object.entries(P_).map(([n, [c, x, y, z, parent]]) => ({ name: n, parent, pivot: [x, y, z], cubes: pilot(c, x, y, z) }));
const ORDER = ['pR', 'pO', 'pY', 'pG', 'pB', 'pI', 'pV'];
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-2.3, 32.7, 5.24], line: '#0a1220', iris: '#4ae8ff', irisDark: '#1a8ab8', accent: '#bff8ff', pupilColor: '#0a1a2a', extra: ['smug'], map: EYE_MECH });
const DOME = [
  B([-3.2, 36.4, 2.9], [6.4, 4.4, 0], glassP, { plane: 'z' }), B([-3.2, 36.4, -3.1], [6.4, 4.4, 0], glassP, { plane: 'z' }),
  ...both(B([-3.2, 36.4, -3.1], [0, 4.4, 6.0], glassP, { plane: 'x' })), B([-3.2, 40.8, -3.1], [6.4, 0, 6.0], glassP, { plane: 'y' }),
];
export const def = {
  name: 'roygbot', ppu: 3, scale: 0.56, outline: { color: '#121420', px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...twin({ name: 'footR', parent: 'root', pivot: [-5.2, 1.4, 0.8], cubes: [B([-8.2, 0, -3.6], [6.0, 2.6, 8.8], armorT), B([-7.8, 0, 5.2], [5.2, 1.6, 1.8], jointP), B([-7.6, 0.4, -4.8], [4.8, 1.8, 1.4], jointP)] }),
    ...twin({ name: 'legR', parent: 'root', pivot: [-5.2, 13.0, 0], cubes: [B([-7.2, 8.2, -2.4], [4.0, 5.0, 4.8], jointP), B([-7.8, 6.0, 1.8], [5.2, 3.0, 1.6], armorT), B([-7.8, 1.8, -2.8], [5.2, 5.0, 5.6], armor), B([-6.4, 9.0, 2.4], [1.2, 3.6, 1.2], pistonP)] }),
    { name: 'body', parent: 'root', pivot: [0, 13, 0], cubes: [
      B([-6.6, 11.6, -3.8], [13.2, 3.4, 7.6], jointP),
      B([-7.6, 13.0, -5.2], [15.2, 2.2, 10.4], jointP),
      B([-9.4, 14.6, -6.4], [18.8, 13.4, 12.8], armorT, { faces: { south: chest } }),
      // the cockpit: a dark bay, a frame, the crew of three, glass in front
      B([-6.6, 18.4, 6.4], [13.2, 7.0, 0.4], bayP),
      B([-7.0, 25.4, 6.4], [14.0, 1.0, 3.2], armorT), B([-7.0, 17.4, 6.4], [14.0, 1.2, 3.4], armorT),
      ...both(B([-7.4, 17.4, 6.4], [1.0, 9.0, 3.2], armorT)),
      B([-6.4, 18.6, 9.62], [12.8, 6.8, 0], glassP, { plane: 'z' }),
      // the backpack engine: exhausts, the violet hatch
      B([-6.0, 16.0, -9.6], [12.0, 13.0, 3.4], armorT), ...both(B([-5.6, 13.6, -10.6], [2.6, 3.2, 2.6], jointP)),
      B([2.0, 29.0, -9.4], [5.2, 0.8, 3.4], jointP),
      // tier 1 (or): a seven-colour banner flying from the backpack
      ...acc('acc-banner', [B([-5.4, 28.0, -9.0], [0.6, 16.0, 0.6], goldP), B([-12.4, 37.4, -8.9], [7.0, 6.4, 0], flagP, { plane: 'z' })]),
      // tier 2 (or): a cape lined with the rainbow
      ...acc('acc-cape', [B([-10.0, 6.0, -10.8], [20.0, 21.0, 0.6], capeP), ...both(B([-11.0, 26.4, -8.0], [3.0, 1.4, 3.0], goldP))]),
      // tier 3 (or): a giant rainbow guitar slung across the back
      ...acc('acc-guitar', [B([-4.0, 12.0, -12.0], [8.0, 9.0, 1.6], guitarP, { pivot: [0, 20, -11], rot: [0, 0, 30] }), B([-1.0, 21.0, -11.6], [2.0, 14.0, 1.0], shade(GK.joint), { pivot: [0, 20, -11], rot: [0, 0, 30] }), B([-1.6, 35.0, -11.7], [3.2, 2.6, 1.2], goldP, { pivot: [0, 20, -11], rot: [0, 0, 30] })]),
      // tier 3 (or): twin boosters under the backpack, flames burning
      ...acc('acc-jets', [...both(B([-7.4, 10.4, -11.4], [3.6, 5.6, 3.6], armorT)), ...[-5.6, 5.6].flatMap((x) => [B([x - 1.6, 4.0, -9.6], [3.2, 6.4, 0], flameP(x), { plane: 'z', glow: true }), B([x, 4.0, -11.2], [0, 6.4, 3.2], flameP(x + 3), { plane: 'x', glow: true })])]),
    ] },
    // the rainbow arc standing behind it like a halo
    { name: 'arc', parent: 'body', pivot: [0, 20, -11.4], cubes: [B([-20, 20, -11.4], [40, 20, 0], arcP({ inner: 0.6 }), { plane: 'z', outline: false })] },
    // shoulder pods with hatches
    ...twin({ name: 'podR', parent: 'body', pivot: [-11.8, 26, 0], cubes: [
      B([-15.6, 21.6, -4.6], [6.8, 6.8, 9.2], armorT, { faces: { south: stripes(armorT, { y0: 0.55, width: 1 }) } }),
      B([-13.8, 28.4, -1.8], [3.4, 0.6, 3.4], jointP),
      ...acc('acc-spikes', [B([-16.2, 27.4, -3.0], [1.6, 3.6, 1.6], spikeP, { pivot: [-15.4, 27.4, -2.2], rot: [0, 0, 30] }), B([-16.2, 27.4, 1.2], [1.6, 3.6, 1.6], spikeP, { pivot: [-15.4, 27.4, 2.0], rot: [0, 0, 30] })]),
    ] }),
    ...twin({ name: 'armR', parent: 'body', pivot: [-12.2, 23.0, 0], cubes: [B([-13.8, 15.6, -2.2], [3.6, 6.8, 4.4], jointP), B([-14.4, 13.6, -2.8], [4.8, 3.0, 5.6], armorT), B([-13.0, 16.6, 2.2], [1.0, 4.0, 1.0], pistonP)] }),
    ...twin({ name: 'foreR', parent: 'armR', pivot: [-12.0, 14.6, 0], cubes: [B([-14.8, 7.6, -3.2], [5.6, 6.6, 6.4], armorT, { faces: { south: stripes(armorT, { y0: 0.2, width: 1 }) } }), B([-14.4, 3.6, -2.8], [4.8, 4.2, 5.6], jointP), B([-14.6, 4.2, 2.8], [5.0, 3.0, 0.6], knuckleP)] }),
    { name: 'head', parent: 'body', pivot: [0, 28.0, 0.6], cubes: [
      B([-2.6, 27.6, -2.0], [5.2, 1.8, 4.0], jointP),
      B([-5.2, 29.2, -4.2], [10.4, 6.6, 9.0], armorT),
      B([-4.8, 31.0, 4.6], [9.6, 3.4, 0.6], shade(GK.screen, { top: '#2a3448', bottom: '#0a0e18', grain: 0 })),
      B([-2.0, 29.7, 4.6], [4.0, 1.0, 0.4], grilleP),
      // goblin-ear fins
      ...both(B([-9.4, 31.6, -0.8], [4.4, 1.6, 1.4], armorT, { pivot: [-5.2, 32.4, 0], rot: [0, 0, -18] })),
      // the captain's dome: a ring and glass all round the red pilot
      B([-3.6, 35.6, -3.4], [7.2, 0.8, 6.8], jointP), ...DOME,
      // tier 1 (or): a gold V-fin crest
      ...acc('acc-vfin', [B([-5.4, 34.4, 4.4], [5.2, 1.0, 0.8], vfinP, { pivot: [0, 34.6, 4.8], rot: [0, 0, -28] }), B([0.2, 34.4, 4.4], [5.2, 1.0, 0.8], vfinP, { pivot: [0, 34.6, 4.8], rot: [0, 0, 28] }), B([-0.8, 33.8, 4.5], [1.6, 1.6, 0.8], goldP)]),
    ] },
    ...EYES.bones,
    ...PILOTS,
  ],
  drip: [
    [{ id: 'acc-vfin', name: 'Gold V-fin crest' }, { id: 'acc-banner', name: 'Seven-colour banner' }],
    [{ id: 'acc-cape', name: 'Rainbow-lined cape' }, { id: 'acc-spikes', name: 'Spiked gold pauldrons' }],
    [{ id: 'acc-guitar', name: 'Giant rainbow guitar' }, { id: 'acc-jets', name: 'Twin boosters' }],
  ],
  attach: {
    head: { bone: 'head', at: [0, 41, 0], size: 12 },
    face: { bone: 'head', at: [0, 32.7, 5.4], size: 11 },
    neck: { bone: 'body', at: [0, 27.6, 6.4], size: 14 },
    back: { bone: 'body', at: [0, 21, -9.8], size: 14 },
  },
};
def.dripForm = { map: keepEyes(EYES, mechForm) };

// ---------------------------------------------------------------- animation
const LEG = 10.6, LEGS = ['legR', 'legL'], CHEST = [0, 22, 10], TOP = [0, 42, 0], VENTS = [[-4.3, 13.4, -12], [4.3, 13.4, -12]];
const SPARK = RAINBOW.map((k) => GBFX[k]), PILOT_AT = Object.fromEntries(Object.entries(P_).map(([n, [c, x, y, z]]) => [n, [x, y + 3.4, z + 1]]));
function arms(P, shR, elR, shL = [0, 0, 0], elL = [0, 0, 0]) { P.rot('armR', ...shR).rot('foreR', ...elR).rot('armL', ...shL).rot('foreL', ...elL); }
// the crew bobbing and looking about, each on its own phase (amp: units; look: degrees)
function crew(P, t, amp = 0.3, look = 18) { ORDER.forEach((n, i) => P.pos(n, 0, Math.max(0, Math.sin(t * 4 + i * 1.7)) * amp, 0).rot(n, 0, Math.sin(t * 1.3 + i * 2.1) * look, 0)); }
function fallBack(P, k) {
  P.rot('root', -78 * k, 0, 0).pos('root', 0, 7 * k, -2 * k);
  P.rot('legR', -40 * k, 0, 8 * k).rot('legL', -30 * k, 0, -8 * k).rot('footR', -30 * k).rot('footL', -20 * k);
  arms(P, [10 * k, 0, -50 * k], [-20 * k, 0, 0], [10 * k, 0, 50 * k], [-20 * k, 0, 0]);
  P.rot('head', 16 * k, 0, 14 * k);
}
export const anim = {
  start: 'idle', seed: 91,
  breathe: { bone: 'body', amp: 0.012, per: 2.8 },
  blink: { slot: 'eyes', closed: 'closed', every: [3, 6], dur: 0.1 },
  look: { bone: 'head', yaw: 30, pitch: 10, speed: 4 },
  springs: [
    { bone: 'arc', tip: [0, 10, 0], k: 140, d: 7, gain: 0.5, max: 8, axes: [1, 0, 1] },
    ...ORDER.map((n) => ({ bone: n, tip: [0, 2, 0], k: 220, d: 8, gain: 0.8, max: 16 })),
  ],
  faces: { eyes: EYES.slot },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'rollcall', 'vent'] },
  clips: {
    // a heavy hydraulic sway, the visor scanning, the crew busy at their posts, the arc softly pulsing
    idle: { len: 3.0, loop: true, f(P, t, c) {
      const b = beat(t, 0.75), dy = -0.5 * b.pulse;
      P.pos('body', 0, dy, 0).rot('body', 0, wave(t, 1 / 3) * 4, wave(t, 1 / 3, 1) * 1.5); plant(P, LEGS, dy, LEG);
      arms(P, [wave(t, 1 / 3) * 4, 0, -4], [-6 - 4 * b.pulse, 0, 0], [-wave(t, 1 / 3) * 4, 0, 4], [-6 - 4 * b.pulse, 0, 0]);
      P.rot('head', -2, wave(t, 1 / 3, 0.5) * 10, 0).scl('arc', 1 + 0.03 * Math.sin(t * Math.PI * 2 / 1.5));
      crew(P, t); eyesAt(P, ...glance(t + c.loopN * 1.3, [[0, 0], [0.4, 0], [0, 0], [-0.4, 0]], 0.75));
      if (c.loopN % 3 === 2) VENTS.forEach((v, i) => P.burst(1.2 + i * 0.1, 'steam', 'body', v, { n: 4, dir: [0, 1, -0.4] }));
    } },
    // heavy stomps that shake the crew
    walk: { len: 1.0, loop: true, f(P, t) {
      const ph = (t / 1.0) * Math.PI * 2, s = Math.sin(ph), c2 = Math.cos(ph), dy = Math.abs(c2) * 0.8, lr = Math.max(0, s), ll = Math.max(0, -s);
      P.pos('body', 0, dy - 0.6, 0).rot('body', 2, s * 6, s * 3); plant(P, LEGS, dy - 0.6, LEG);
      P.pos('footR', 0, lr * 3, s * 3.6).rot('footR', -16 * lr, 0, 0).pos('footL', 0, ll * 3, -s * 3.6).rot('footL', -16 * ll, 0, 0);
      P.pos('legR', 0, lr * 2, s * 2.4).pos('legL', 0, ll * 2, -s * 2.4);
      arms(P, [-s * 24, 0, -6], [-14, 0, 0], [s * 24, 0, 6], [-14, 0, 0]); P.rot('head', 0, -s * 6, 0);
      crew(P, t * 2, 0.6, 8);
      P.burst(0.02, 'dust', 'root', [-5, 0, 2], { n: 4 }).burst(0.52, 'dust', 'root', [5, 0, 2], { n: 4 });
    } },
    // signature: roll call — the crew pops up in rainbow order, each with a flash of its colour; then the power pose
    rollcall: { len: 4.4, next: 'idle', f(P, t) {
      P.blinkOK = false;
      ORDER.forEach((n, i) => {
        const t0 = 0.25 + i * 0.32, k = seg(t, t0, t0 + 0.12, E.back) * (1 - seg(t, 3.9, 4.2, E.inout));
        P.pos(n, 0, 1.8 * k, 0).rot(n, 0, 0, wave(t, 3, i) * 10 * k);
        P.burst(t0 + 0.05, SPARK[i], n, PILOT_AT[n], { n: 6 });
      });
      P.rot('head', 0, -30 + 60 * seg(t, 0.2, 2.5), 0);
      const pose = seg(t, 2.6, 2.85, E.back) * (1 - seg(t, 3.9, 4.3, E.inout)), flex = pose * (0.6 + 0.4 * Math.sin(t * Math.PI * 4));
      arms(P, [-20 * pose, 20 * pose, -80 * pose], [0, 0, -100 * flex], [-20 * pose, -20 * pose, 80 * pose], [0, 0, 100 * flex]);
      P.pos('body', 0, -1 * pose, 0).sq('body', 0.03 * pose); plant(P, LEGS, -1 * pose, LEG);
      P.scl('arc', 1 + 0.25 * pose).rot('head', -8 * pose, 0, 0);
      P.face('eyes', t < 2.6 ? 'smug' : pose > 0.4 ? 'happy' : undefined);
      P.burst(2.7, 'ring', 'root', [0, 1, 0], { scale: 2 }).burst(2.7, ARCFX, 'arc', [0, 36, -11], { n: 6, speed: 1.4 }).burst(2.72, 'sparkle', 'body', CHEST, { n: 12 });
    } },
    // steam vent: the boilers blow, the crew fan themselves, the mech wipes its visor
    vent: { len: 2.8, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const blow = env(t, 0.2, 1.4, 0.1, 0.3), wipe = env(t, 1.3, 2.3, 0.2, 0.25), sw = Math.sin((t - 1.3) * Math.PI * 2 * 1.5) * wipe;
      if (blow > 0.2) VENTS.forEach((v, i) => P.stream('steam', 'body', v, { rate: 30, dir: [0, 1, -0.5], speed: 1.4, spread: 0.4, key: 'v' + i }));
      P.sq('body', -0.03 * blow).rot('head', 6 * blow, 0, 0);
      ORDER.forEach((n, i) => P.rot(n, 0, 0, wave(t, 5, i) * 14 * blow).pos(n, 0, -0.4 * blow, 0));
      arms(P, [-110 * wipe, 0, -30 * wipe], [-40 * wipe, 0, -40 * wipe + 20 * sw]);
      P.rot('head', 0, 8 * sw, 0);
      P.face('eyes', blow > 0.4 ? 'closed' : wipe > 0.3 ? 'closed' : t > 2.4 ? 'happy' : undefined);
      P.burst(0.25, 'sweat', 'pY', PILOT_AT.pY, {}).burst(0.4, 'sweat', 'pB', PILOT_AT.pB, {}).burst(2.35, 'sparkle', 'head', [0, 33, 6], { n: 5 });
    } },
    // the dance: a robot pop — hits on every beat, 90° arm poses, head ticks, the crew waving; a spin; a fist to the sky
    dance: { len: 3.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const b = beat(t, 0.3), live = 1 - seg(t, 2.3, 2.4), side = b.n % 2 ? 1 : -1, hit = Math.min(1, b.ph * 6) * live;
      const pose = b.n % 4;
      P.rot('body', 0, side * 12 * hit, side * 4 * hit).pos('body', 0, -0.8 * hit, 0); plant(P, LEGS, -0.8 * hit, LEG);
      arms(P, pose === 0 ? [0, 0, -90 * hit] : pose === 1 ? [-90 * hit, 0, 0] : pose === 2 ? [0, 0, -20 * hit] : [-160 * hit, 0, 0], pose === 0 ? [0, 0, -90 * hit] : [0, 0, 0],
        pose === 2 ? [0, 0, 90 * hit] : pose === 3 ? [-90 * hit, 0, 0] : [0, 0, 20 * hit], pose === 2 ? [0, 0, 90 * hit] : [0, 0, 0]);
      P.rot('head', 0, -side * 20 * hit, side * 8 * hit);
      ORDER.forEach((n, i) => P.pos(n, 0, (i + b.n) % 2 ? 1.2 * b.pulse * live : 0, 0).rot(n, 0, 0, side * 16 * live));
      const spin = seg(t, 2.35, 2.75, E.inout), fin = seg(t, 2.7, 2.85, E.back);
      P.rot('root', 0, 360 * spin, 0); arms(P, [-170 * fin, 0, -10 * fin], [0, 0, 0], [0, 0, 20 * fin]);
      P.scl('arc', 1 + 0.2 * fin);
      P.face('eyes', t > 2.75 ? 'happy' : hit > 0.6 ? 'smug' : undefined);
      P.burst(0.05, 'note', 'head', [7, 40, 2], {}).burst(0.65, 'note', 'head', [-7, 40, 2], {}).burst(1.25, 'note', 'head', [7, 40, 2], {}).burst(1.85, 'note', 'head', [-7, 40, 2], {}).burst(2.75, ARCFX, 'arc', [0, 36, -11], { n: 5 });
    } },
    // battle cry: crouch, then arms flung wide, the arc blazing, the crew shaking their fists
    cry: { len: 2.0, next: 'idle', f(P, t) {
      P.lookW = 1 - seg(t, 0.2, 0.3); P.blinkOK = false;
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.42, E.out)), up = seg(t, 0.34, 0.5, E.back) * (1 - seg(t, 1.5, 1.85, E.inout));
      const dy = -1.6 * crouch + 0.6 * up; P.pos('body', 0, dy, 0).sq('body', -0.08 * crouch + 0.04 * up); plant(P, LEGS, dy, LEG);
      P.rot('head', 10 * crouch - 18 * up, 0, 0); arms(P, [20 * up, 0, -80 * up], [0, 0, -30 * up], [20 * up, 0, 80 * up], [0, 0, 30 * up]);
      P.scl('arc', 1 + 0.3 * up); ORDER.forEach((n, i) => P.rot(n, 0, 0, wave(t, 6, i) * 18 * up).pos(n, 0, 1.2 * up, 0));
      P.face('eyes', crouch > 0.3 || up > 0.3 ? 'angry' : undefined);
      for (const r0 of [0.5, 0.7, 0.9]) P.burst(r0, 'ring', 'head', [0, 30, 6], { scale: 1.6, tint: '#c8f4ff' });
      P.burst(0.5, ARCFX, 'arc', [0, 36, -11], { n: 6, speed: 1.4 }).burst(0.5, 'dust', 'root', [0, 0, 0], { n: 12, spread: 1, speed: 1.6 });
    } },
    // physical: a wound-up rocket punch with the rainbow knuckles
    attack: { len: 1.1, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const bk = seg(t, 0, 0.32, E.out) * (1 - seg(t, 0.32, 0.4, E.in)), hit = seg(t, 0.34, 0.46, E.in3) * (1 - seg(t, 0.6, 1.05, E.inout));
      P.pos('root', 0, 0, -1.4 * bk + 4 * hit).rot('body', -4 * bk + 8 * hit, 28 * bk - 34 * hit, 0);
      arms(P, [40 * bk - 90 * hit, 0, -10 * bk], [-60 * bk + 60 * hit, 0, 0], [-20 * hit, 0, 10 * hit], [-30 * hit, 0, 0]);
      P.pos('foreR', 0, 0, 6 * hit);
      ORDER.forEach((n) => P.rot(n, -20 * hit, 0, 0));
      P.face('eyes', bk > 0.2 || hit > 0.2 ? 'angry' : undefined);
      P.burst(0.46, 'spark', 'foreR', [-12, 6, 6], { scale: 1.6 }).burst(0.46, 'star', 'foreR', [-12, 6, 6], { n: 6 }); SPARK.forEach((k, i) => P.burst(0.47, k, 'foreR', [-12, 6, 6], { n: 2 }));
    } },
    // special: Roy G. Blast — the crew hit their buttons, the chest glass blazes, a seven-colour beam pours out
    special: { len: 2.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const charge = env(t, 0.05, 0.7, 0.4, 0.05), fire = seg(t, 0.65, 0.75, E.out) * (1 - seg(t, 1.6, 2.0, E.inout));
      P.pos('body', 0, -1.2 * charge - 0.4 * fire, 0).rot('body', 6 * charge - 6 * fire, 0, 0); plant(P, LEGS, -1.2 * charge - 0.4 * fire, LEG);
      arms(P, [-20 * charge, 0, -50 * charge], [-50 * charge, 0, 0], [-20 * charge, 0, 50 * charge], [-50 * charge, 0, 0]);
      P.pos('root', 0, 0, -1.6 * fire).scl('arc', 1 + 0.3 * fire);
      ['pO', 'pY', 'pG'].forEach((n, i) => P.rot(n, 30 * bump(t, 0.3 + i * 0.1, 0.5 + i * 0.1), 0, 0));
      P.face('eyes', charge > 0.3 ? 'angry' : fire > 0.3 ? 'angry' : t > 1.9 ? 'happy' : undefined);
      if (t > 0.1 && t < 0.65) P.stream('sparkle', 'body', CHEST, { rate: 30, spread: 0.6, speed: 0.4 });
      if (fire > 0.3) SPARK.forEach((k, i) => P.stream(k, 'body', [(i - 3) * 1.2, 22, 10], { rate: 14, dir: [0, 0, 1], speed: 3, spread: 0.12, key: 'b' + i }));
      P.burst(0.7, 'ring', 'body', CHEST, { scale: 1.8 }).burst(0.7, ARCFX, 'body', CHEST, { n: 6, dir: [0, 0, 1], speed: 2.4 });
    } },
    hurt: { len: 0.8, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.25, 0.8, E.inout));
      P.pos('root', 0, 0, -2 * k).rot('body', -10 * k + wob(t, 0.2, 3, 3, 6), 0, wave(t, 14) * 3 * k).rot('head', -12 * k, 0, 0);
      arms(P, [20 * k, 0, -30 * k], [0, 0, 0], [20 * k, 0, 30 * k]); ORDER.forEach((n, i) => P.rot(n, 0, 0, wave(t, 8, i) * 30 * k));
      P.face('eyes', t < 0.5 ? 'x' : 'angry'); P.blinkOK = false;
      P.burst(0.02, 'spark', 'body', [0, 22, 10], { scale: 1.4 }).burst(0.02, 'smoke', 'body', [0, 28, 0], { n: 4 });
    } },
    // power failure: sparks, a wobble, then it topples backward with the crew dizzy in their seats
    faint: { len: 2.4, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 1.0, 1.1)), fall = seg(t, 1.0, 1.5, E.bounce);
      P.rot('body', 0, wave(t, 1.4) * 10 * dizzy, wave(t, 2) * 6 * dizzy).rot('head', 0, 0, wave(t, 2, 1) * 14 * dizzy);
      fallBack(P, fall); ORDER.forEach((n, i) => P.rot(n, 0, 0, wave(t, 2, i) * 20));
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.scl('arc', 1 - 0.3 * fall);
      P.burst(0.1, 'spark', 'head', [0, 33, 5], {}).burst(0.5, 'spark', 'body', CHEST, {}).burst(1.48, 'dust', 'root', [0, 0, -12], { n: 16, spread: 1 }).burst(1.5, 'star', 'head', TOP, { n: 6 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      fallBack(P, 1); P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.3; P.scl('arc', 0.7);
      ORDER.forEach((n, i) => P.rot(n, 0, 0, wave(t, 0.8, i) * 20));
      P.burst(0.8, 'spark', 'body', CHEST, {}).stream('smoke', 'body', [0, 28, -9], { rate: 2 });
    } },
    // victory: a stomp, a fist to the sky, the crew cheering, the arc flaring
    win: { len: 2.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const h = t < 0.8 ? hop(t, 0.8, 4, { crouch: 1.6 }) : { y: wob(t, 0.8, -1.2, 3, 6), sq: wob(t, 0.8, -0.1, 3, 6) };
      P.pos('root', 0, Math.max(0, h.y), 0).sq('body', h.sq); if (h.y < 0) plant(P, LEGS, h.y, LEG);
      const pose = seg(t, 0.85, 1.0, E.back);
      arms(P, [-170 * pose, 0, -10 * pose], [0, 0, 0], [0, 0, 30 * pose], [-60 * pose, 0, 0]); P.rot('head', -10 * pose, 0, 0).scl('arc', 1 + 0.25 * pose);
      ORDER.forEach((n, i) => P.pos(n, 0, (1 + Math.sin(t * 10 + i)) * 0.8 * pose, 0));
      P.face('eyes', pose > 0.5 ? 'happy' : undefined);
      P.burst(0.8, 'dust', 'root', [0, 0, 0], { n: 14, spread: 1 }).burst(0.95, ARCFX, 'arc', [0, 36, -11], { n: 6 }); SPARK.forEach((k, i) => P.burst(1.0 + i * 0.05, k, ORDER[i], PILOT_AT[ORDER[i]], { n: 3 }));
    } },
    // powered down for the night: head bowed, arms hanging, the arc dimmed, the crew asleep at their posts
    sleep: { len: 3.4, loop: true, f(P, t) {
      const br = Math.sin((t / 3.4) * Math.PI * 2);
      P.pos('body', 0, -1.2 + br * 0.2, 0); plant(P, LEGS, -1.2 + br * 0.2, LEG);
      P.rot('head', 20, 0, 4); arms(P, [6, 0, -2], [-4, 0, 0], [6, 0, 2], [-4, 0, 0]); P.scl('arc', 0.85);
      ORDER.forEach((n, i) => P.rot(n, 30 + Math.sin(t * 1.8 + i) * 4, 0, 10));
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'pR', PILOT_AT.pR, {}).burst(1.4, 'z', 'pY', PILOT_AT.pY, {}).burst(2.4, 'z', 'pB', PILOT_AT.pB, {});
    } },
  },
};
def.anim = anim;
