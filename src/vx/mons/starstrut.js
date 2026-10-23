// Starstrut — a stone-split final of the Kissmet line (Draco/Aero): the Starchild, a KISS homage that
// leans into the chimera's eagle. A tall, flamboyant bald-eagle glam rocker: the white feathered head
// is its greasepaint, with one big black star painted over its right eye; a hooked gold beak; a huge
// teased black mane of hair (the lion in it); a black spandex suit slashed to a bare white-feathered
// chest; great black wings tipped in silver; a white eagle's tail; towering chrome platform boots.
// Chimera hints: the lion's mane hair, a live banded snake for a belt (its head is the buckle), and a
// studded turtle-shell pauldron on its left shoulder. Struts, poses, points at the crowd.
// Signature: the guitar smash — a power chord, the guitar overhead… and down.
// Drip (one per tier): 1 star choker | studded bracelets · 2 rhinestone star chain | silver shoulder
// wings · 3 mirror-ball guitar | white feather boa.
import {
  K, CH, B, both, at, fill, isSide, shift, ramp, fur, leather, chrome, spike, spikeP, painted, shellP, bootP, soleP, wingP, quillP, starP, chain,
  chimMane, chimHalo, snakeBands, snakeHead, cobEyes, legs, arm, arms, emote, sharedClips, onBack, walkCycle, glances, kissForm, E, seg, bump, wob, wave, TAU,
} from './kiss_parts.js';
import { bounce } from '../anim.js';

const C = { eye: '#ffb020', eyeLo: '#a05a0a', eyeHi: '#ffe080', white: '#f2f0f6', whiteHi: '#ffffff', whiteLo: '#c8c4d4', whiteLine: '#8a86a0', beak: ['#fff4a0', '#ffd23a', '#e09a1a', '#8a5210'], scale: '#e8b830', scaleLo: '#a07010' };
// ---------------------------------------------------------------- painters
const headFeathers = fur(C.white, { hi: C.whiteHi, lo: C.whiteLo, line: C.whiteLine, s: 7, tipH: 2.5, pt: 0.6, seed: 5 });
const EYE = [2.2, 24.7];
const faceP = painted(headFeathers, { marks: [{ star: [-EYE[0], EYE[1] + 0.15, 2.7, 0.5, 0], col: K.paint }] });
const spandex = leather({ cols: ['#5a5468', '#24202e', '#16131c', '#0a090e'] });
const studLine = leather({ cols: ['#5a5468', '#24202e', '#16131c', '#0a090e'], studs: 3 });
// the suit, slashed to a deep V over a bare white-feathered chest, silver studs along the edges
const chestP = painted(spandex, { marks: [{ fn: (X, Y) => { const half = (Y - 14.2) * 0.52; if (Y < 14.2 || Math.abs(X) > half + 0.36) return null; if (Math.abs(X) > half) return K.silver[(Math.round(Y * 3) % 2) + 1]; return (Math.round(X * 3) + Math.round(Y * 3)) % 7 === 0 ? C.whiteLo : Y > 18.5 ? C.whiteHi : C.white; } }] });
const sleeve = wingP({ c: '#24202c', size: 4, from: 0.85, tip: K.silver[1], tipLo: K.silver[2] });
const handP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? C.scale : (x + y) % 3 === 0 ? C.scaleLo : ramp([C.scale, C.scale, C.scaleLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
const claw = spikeP({ down: true });
const beakP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? C.beak[0] : face === 'down' ? C.beak[3] : ramp(C.beak, h > 1 ? y / (h - 1) : 0.5, x, y))); if (face === 'up') { p.px(1, h - 2, C.beak[3]).px(w - 2, h - 2, C.beak[3]); } };
const jawP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? K.mouth : face === 'down' ? C.beak[3] : y === 0 ? C.beak[3] : ramp([C.beak[1], C.beak[2]], h > 1 ? y / (h - 1) : 0.5, x, y)));
const maneP = (seed, o) => chimMane(seed, o), halo = chimHalo({ n: 26, depth: 0.22, inner: 0.6, seed: 7 });
const tailP = wingP({ c: '#2a2634', size: 4, from: 0.35, tip: C.white, tipLo: C.whiteLo });
const bootStar = painted(bootP(), { sym: true, marks: [{ star: [-2.6, 4.6, 1.1, 0.45, 0], col: K.silver[1], rim: K.silver[3] }] });
const sole = soleP(), trim = chrome();
const wing = wingP({ c: '#24202c', size: 6, tip: K.silver[0], tipLo: K.silver[2] }), quill = quillP({ c: '#24202c', tip: K.silver[0], tipLo: K.silver[2] });
const beltP = snakeBands('x', { per: 1.8 });
const buckleP = snakeHead({ eye: (X, Y, Z, face) => (face === 'south' && Math.abs(Math.abs(X) - 0.5) < 0.22 && Y > 12.3 && Y < 12.7 ? 'i' : null) });
const shellPad = shellP({ cols: CH.shell, stud: true, size: 1.8 });
// drip + prop painters
const SILVER = { hi: '#ffffff', base: '#c8ccd8', lo: '#8a90a4', deep: '#4a5064', spec: '#ffffff' };
const mirrorP = (p, w, h, face) => fill(p, w, h, (x, y) => { const t = ((x >> 1) + (y >> 1)) % 3; return (x + y * 3) % 11 === 0 ? '#ffffff' : t === 0 ? '#e8ecf6' : t === 1 ? '#a8aec4' : '#6a7088'; });
const guitarP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? '#3a3444' : y === 0 ? '#4a4456' : '#141218')); if (face === 'south') { const m = Math.floor(w / 2); for (let y = 2; y < h - 1; y++) if (y % 3) p.px(m, y, '#d8d8e0').px(m - 1, y, '#d8d8e0'); p.rect(m - 3, Math.floor(h * 0.35), 6, 1, K.silver[1]).rect(m - 3, Math.floor(h * 0.62), 6, 1, K.silver[1]); for (let x = 1; x < w - 1; x++) p.px(x, h - 1, K.silver[2]); } };
const fretP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'south' ? (y % 3 === 0 ? K.silver[2] : '#2a2018') : '#16141c'));
const headstockP = (p, w, h, face) => { fill(p, w, h, () => '#16141c'); if (face === 'south') for (let y = 1; y < h; y += 2) { p.px(0, y, K.silver[1]); p.px(w - 1, y, K.silver[1]); } };
const strapP = (p, w, h) => fill(p, w, h, (x, y) => (y === 0 ? '#4a4458' : (x + y) % 4 === 0 ? K.silver[2] : '#1c1924'));
const boaP = fur('#f8f0f8', { hi: '#ffffff', lo: '#d8c4dc', line: '#b098b8', s: 3, tipH: 1.5, seed: 3 });

// ---------------------------------------------------------------- the model
const R = { hipX: 2.6, hipY: 11.0, ankleY: 3.6, L1: 3.8, L2: 3.6 };
// a fierce eagle's eye: no whites, a heavy brow-line lid dipping to the inside, a gold iris (dark top, pale bottom), a round pupil, two glints
const EYE_MAPS = {
  open: ['lll.......', '.lllllllll', '.IIIIIIIll', '.iihkkkiil', '.iiikkkhi.', '..cciikcc.', '...cccc...'],
  angry: ['l.........', 'lllll.....', '.IIIlllll.', '.iihkkllll', '.iiikkkhi.', '..cciikcc.', '...cccc...'],
  sad: ['..........', '.......ll.', '....lllIl.', '.llllkkii.', '.iiikkkhi.', '..cciikcc.', '...cccc...'],
  happy: ['..........', '...llll...', '..llllll..', '.lll..lll.', '.ll....ll.', '..........', '..........'],
  closed: ['..........', '..........', '..........', 'lllllllll.', '.lllllll..', '..........', '..........'],
  shock: ['lll.......', '.lllllllll', '.iiiiiiiil', '.iiiiiiii.', '.iiiikiii.', '..iiiiiii.', '...iiii...'],
  wide: ['lll.......', '.lllllllll', '.IIIIIIIll', '.iiihkiiil', '.iiikkiii.', '..cciiicc.', '...cccc...'],
  smug: ['..........', '..........', '..........', '.lllllllll', '.iiikkkhi.', '..cciikcc.', '...cccc...'],
  sleepy: ['..........', '..........', '..........', '..........', '.lllllllll', '..cciikcc.', '...cccc...'],
  teary: ['lll.......', '.lllllllll', '.IIIIIIIll', '.iihkkkiil', '.iiikkkhi.', '..bbiikbb.', '...bbbb...'],
};
const EYES = cobEyes({ at: [-EYE[0], EYE[1], 3.24], line: '#0c0810', pupilColor: '#0a0604', iris: C.eye, irisDark: C.eyeLo, accent: C.eyeHi, maps: EYE_MAPS });
const A = (id, c) => ({ ...c, id, hide: true });
const sp = (id, x, y, z, s, len, rot) => spike(x, y, z, s, len, { x: { pivot: [x, y, z], rot } }).map((c) => (id ? A(id, c) : c));
const CHAIN = chain([[-2.6, 20.0, 1.8], [-2.2, 18.2, 2.95], [-1.0, 16.8, 2.95], [0, 16.4, 2.95], [1.0, 16.8, 2.95], [2.2, 18.2, 2.95], [2.6, 20.0, 1.8]], { len: 0.9, w: 0.7, t: 0.32, step: 0.7, gold: SILVER }).map((c) => A('acc-chain', c));
const BOA = [[-3.4, 20.0, 0.0], [-3.0, 18.6, 2.4], [-2.2, 16.6, 3.0], [-1.6, 14.4, 3.2], [-1.4, 12.4, 3.4], [3.4, 20.0, 0.0], [3.0, 18.6, 2.4], [2.6, 16.6, 3.0], [2.4, 14.8, 3.2], [2.6, 13.0, 3.4], [-1.6, 20.4, -2.4], [1.6, 20.4, -2.4], [0, 20.6, -2.8]].map(([x, y, z]) => A('acc-boa', B(x - 0.9, y - 0.9, z - 0.8, x + 0.9, y + 0.9, z + 0.8, boaP)));
const RIGHT = [
  { name: 'thighR', parent: 'root', pivot: [-2.6, 11.0, 0], cubes: [B(-3.9, 7.0, -1.5, -1.3, 11.6, 1.5, studLine)] },
  { name: 'shinR', parent: 'thighR', pivot: [-2.6, 7.2, 0], cubes: [B(-3.6, 3.6, -1.2, -1.6, 7.6, 1.2, spandex)] },
  { name: 'footR', parent: 'shinR', pivot: [-2.6, 3.6, 0], cubes: [B(-4.1, 0, -2.0, -1.1, 2.6, 3.0, sole), B(-3.9, 2.6, -1.7, -1.3, 6.6, 2.6, bootStar), B(-4.0, 6.4, -1.5, -1.2, 7.0, 1.6, trim)] },
  { name: 'armR', parent: 'torso', pivot: [-5.0, 19.4, 0.2], cubes: [
    B(-6.6, 15.6, -1.3, -4.4, 20.0, 1.5, sleeve),
    // dripped (or): big silver shoulder wings
    A('acc-pads', B(-7.8, 18.6, -1.8, -3.8, 20.6, 2.2, trim)), ...sp('acc-pads', -7.6, 19.6, -0.8, 1.0, 2.6, [0, 0, 60]), ...sp('acc-pads', -7.6, 19.6, 1.2, 1.0, 2.6, [0, 0, 70]),
  ] },
  { name: 'foreR', parent: 'armR', pivot: [-5.5, 15.8, 0.2], cubes: [
    B(-6.4, 12.6, -1.1, -4.6, 16.0, 1.3, sleeve), B(-6.5, 12.4, -1.2, -4.5, 13.2, 1.4, trim),
    // normal (or): studded silver bracelets
    A('acc-bracelets', B(-6.65, 13.4, -1.35, -4.35, 14.6, 1.55, leather({ studs: 2 }))),
  ] },
  { name: 'handR', parent: 'foreR', pivot: [-5.5, 12.6, 0.2], cubes: [B(-6.6, 10.8, -1.2, -4.4, 12.8, 1.6, handP), ...[-6.5, -5.75, -5.0].map((x) => B(x, 9.8, 0.6, x + 0.55, 11.0, 1.3, claw))] },
  // great black wings, silver-tipped
  { name: 'wingR', parent: 'torso', pivot: [-2.4, 19.0, -2.4], rot: [0, -26, -28], cubes: [
    B(-11.6, 17.6, -3.0, -2.2, 19.8, -2.0, wing), B(-14.6, 12.2, -2.9, -3.0, 18.0, -2.1, wing),
    ...[-16.0, -14.2, -12.4, -10.6].map((x, i) => B(x, 8.4 + i * 0.7, -2.85, x + 1.7, 12.6, -2.15, quill)),
  ] },
];
const bones = [
  { name: 'root', pivot: [0, 0, 0], cubes: [] },
  { name: 'pelvis', parent: 'root', pivot: [0, 11.0, 0], cubes: [
    B(-4.0, 9.4, -2.4, 4.0, 12.6, 2.4, spandex),
    B(-4.25, 11.6, -2.65, 4.25, 12.8, 2.65, beltP), B(-1.0, 11.3, 2.55, 1.0, 13.1, 3.7, buckleP),
  ] },
  { name: 'tail', parent: 'pelvis', pivot: [0, 10.8, -2.2], rot: [24, 0, 0], cubes: [B(-2.8, 7.0, -3.4, 2.8, 11.0, -2.4, tailP)] },
  { name: 'torso', parent: 'pelvis', pivot: [0, 12.4, 0], cubes: [
    B(-4.6, 12.2, -2.6, 4.6, 20.2, 2.8, chestP),
    // normal: a black choker with a silver star
    A('acc-choker', B(-2.6, 19.8, -1.8, 2.6, 20.6, 2.6, leather({ studs: 3 }))), A('acc-choker', B(-0.8, 18.4, 2.66, 0.8, 20.0, 2.66, starP(K.silver[1], { line: K.silver[3] }), { plane: 'z' })),
    // dripped: a rhinestone chain with a star pendant
    ...CHAIN, A('acc-chain', B(-1.2, 14.6, 3.05, 1.2, 16.8, 3.05, starP(K.silver[0], { line: K.silver[2] }), { plane: 'z' })),
    // ultra (or): a white feather boa
    ...BOA,
    // ultra: the guitar strap
    A('acc-mirror', B(-4.8, 16.4, 2.82, 4.8, 17.1, 3.12, strapP, { pivot: [0, 16.75, 2.97], rot: [0, 0, -38] })),
  ] },
  // ultra dripped: a mirror-ball guitar slung low on the right hip
  { name: 'axe', parent: 'torso', pivot: [-1.0, 13.4, 3.6], rot: [0, 0, -52], cubes: [
    A('acc-mirror', B(-3.4, 10.6, 3.0, 1.4, 14.8, 4.2, mirrorP)), A('acc-mirror', B(-2.6, 14.8, 3.1, 0.6, 15.8, 4.1, mirrorP)),
    A('acc-mirror', B(-1.35, 15.8, 3.35, -0.65, 22.2, 3.85, fretP)), A('acc-mirror', B(-1.7, 22.2, 3.3, -0.3, 23.8, 3.9, headstockP)),
  ] },
  // the guitar prop for the smash
  { name: 'guitar', parent: 'torso', pivot: [0.6, 14.0, 4.0], rot: [0, 0, -40], cubes: [
    B(-1.8, 10.2, 3.4, 3.0, 14.4, 4.6, guitarP, { id: 'g-on', hide: true }), B(-1.0, 14.4, 3.5, 2.2, 15.4, 4.5, guitarP, { id: 'g-on', hide: true }),
    B(0.25, 15.4, 3.75, 0.95, 22.4, 4.25, fretP, { id: 'g-on', hide: true }), B(-0.1, 22.4, 3.7, 1.3, 24.0, 4.3, headstockP, { id: 'g-on', hide: true }),
  ] },
  { name: 'head', parent: 'torso', pivot: [0, 20.4, 0.4], cubes: [
    B(-3.9, 20.2, -2.8, 3.9, 27.4, 3.2, headFeathers, { faces: { south: faceP } }),
    // the hooked gold beak
    B(-1.8, 21.0, 3.2, 1.8, 23.5, 6.8, beakP), B(-1.2, 19.8, 6.0, 1.2, 22.4, 7.6, beakP, { pivot: [0, 22.4, 6.4], rot: [18, 0, 0] }),
  ] },
  ...EYES.bones,
  { name: 'jaw', parent: 'head', pivot: [0, 21.2, 3.6], cubes: [B(-1.4, 20.2, 3.2, 1.4, 21.1, 6.0, jawP)] },
  // the big teased mane of hair, with a fuzzy halo behind
  { name: 'hair', parent: 'head', pivot: [0, 26.6, -0.6], cubes: [
    B(-4.8, 26.4, -3.8, 4.8, 29.8, 2.8, maneP(31)), B(-5.2, 19.2, -4.8, 5.2, 28.8, -1.8, maneP(37)),
    B(-5.4, 21, -3.6, -3.8, 28.2, 1.6, maneP(41)), B(3.8, 21, -3.6, 5.4, 28.2, 1.6, maneP(43), { mirror: true }),
    B(-8.6, 17.6, -1.6, 8.6, 32.6, -1.6, halo, { plane: 'z' }), B(0, 17.6, -6, 0, 32.6, 2.4, halo, { plane: 'x' }),
    B(-3.2, 29.2, -1.8, -1, 31.6, 0.4, maneP(53), { pivot: [-2.1, 29.4, -0.7], rot: [-10, 0, 20] }), B(1, 29.2, -1.8, 3.2, 31.6, 0.4, maneP(57), { pivot: [2.1, 29.4, -0.7], rot: [-10, 0, -20] }),
  ] },
  ...both(...RIGHT),
];
// the turtle in it: a studded shell pauldron on the left shoulder only
bones.find((b) => b.name === 'armL').cubes.push(B(3.8, 18.4, -1.9, 7.2, 20.6, 2.3, shellPad), B(4.4, 20.6, -1.2, 6.6, 21.2, 1.6, shellPad));
export const def = { name: 'starstrut', ppu: 3, scale: 0.5, outline: { color: '#0c0810', px: 1.4 }, bones };
def.drip = [
  [{ id: 'acc-choker', name: 'Star choker' }, { id: 'acc-bracelets', name: 'Studded bracelets' }],
  [{ id: 'acc-chain', name: 'Rhinestone star chain' }, { id: 'acc-pads', name: 'Silver shoulder wings' }],
  [{ id: 'acc-mirror', name: 'Mirror-ball guitar' }, { id: 'acc-boa', name: 'White feather boa' }],
];
def.attach = {
  head: { bone: 'hair', at: [0, 29.2, -0.4], size: 10 },
  face: { bone: 'head', at: [0, 24.0, 3.3], size: 8 },
  neck: { bone: 'torso', at: [0, 20.0, 2.0], size: 6 },
  back: { bone: 'torso', at: [0, 16.4, -2.8], size: 9 },
};

// ---------------------------------------------------------------- animation
const HEAD = [0, 31.6, 1], BEAK = [0, 21.2, 7.4], HAND_R = [-5.5, 10.6, 1.6];
const beak = (P, k) => P.rot('jaw', 30 * k, 0, 0);
// the Love Gun: right wing-hand out like a pistol (k), thumb up
const gun = (P, k) => arm(P, 'R', { out: 10 * k, fwd: 88 * k, bend: 6 * k, wrist: -10 * k });
// a hip-shot pose: weight on one leg, a hand on the hip
const hipShot = (P, k, side = 1) => arm(P, side > 0 ? 'L' : 'R', { out: 40 * k, fwd: -20 * k, bend: 100 * k, twist: 40 * k });
const hipLegs = (k, side = 1) => ({ y: -0.3 * k, roll: 5 * side * k, ['f' + (side > 0 ? 'L' : 'R')]: [0.4 * k, 0.8 * k], ['toe' + (side > 0 ? 'L' : 'R')]: -14 * k });
const wings = (P, open, flap = 0) => P.rot('wingR', 0, -14 * open, -26 * open - flap).rot('wingL', 0, 14 * open, 26 * open + flap);
const shared = sharedClips(R, {
  headTop: HEAD, weight: 0.25,
  downPose: (P, k, t) => { onBack(P, R, k, t, { lift: 3.6 }); wings(P, -0.3 * k); beak(P, 0.4 * k); },
  sleepPose: (P, br) => { legs(P, R, { y: -0.4 + br * 0.15, fR: [0, 0.4], fL: [0, -0.2] }); P.rot('torso', 6 + br, 0, 0).rot('head', 28 + br * 3, 0, 10); arms(P, { out: 6, fwd: 10, bend: 30 }); P.rot('wingR', 0, 40, 10).rot('wingL', 0, -40, -10); },
});
export const anim = {
  start: 'idle', seed: 31,
  breathe: { bone: 'torso', amp: 0.016, per: 2.4 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 4.8], dur: 0.11 },
  look: { bone: 'head', yaw: 32, pitch: 14, speed: 6 },
  springs: [
    { bone: 'hair', tip: [0, 4, 0], k: 170, d: 9, gain: 0.8, max: 14, axes: [1, 0.3, 1] },
    { bone: 'wingR', tip: [-8, 0, 0], k: 200, d: 10, gain: 0.35, max: 10, axes: [1, 0.4, 1] },
    { bone: 'wingL', tip: [8, 0, 0], k: 200, d: 10, gain: 0.35, max: 10, axes: [1, 0.4, 1] },
    { bone: 'tail', tip: [0, -3, -1], k: 180, d: 9, gain: 0.6, max: 14 },
    { bone: 'axe', tip: [0, 6, 0], k: 240, d: 12, gain: 0.3, max: 6 },
  ],
  faces: { eyes: EYES.slot, prop: { default: 'off', states: { on: ['g-on'], off: [] } } },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'smash', 'smash', 'crowd'] },
  clips: {
    ...shared,
    // a hip-shot pose, one hand on the hip, rocking on the beat, eyes sweeping the crowd
    idle: { len: 2.4, loop: true, f(P, t, c) {
      const b = bounce(t, 0.6, { squash: 0.03, stretch: 0.02 }), s = Math.sin((t / 2.4) * TAU), pt = c.loopN % 3 === 1 ? bump(t, 0.7, 1.8) : 0;
      hipShot(P, 1); legs(P, R, { y: -0.2 + b.u * 0.3, roll: 5 + 2 * s, fL: [0.4, 0.8], toeL: -14 });
      P.sq('torso', b.sq).rot('torso', 0, 6 * s, -2).rot('head', 2 - 6 * pt, -8 * s + 14 * pt, 6 * s);
      arm(P, 'R', { out: 14 + 30 * pt, fwd: 6 + 70 * pt, bend: 20 - 10 * pt }); wings(P, 0.1 + 0.05 * s, 0);
      beak(P, 0.06 + 0.2 * pt); glances(P, t, [[0, 0], [-0.3, 0.05], [0.25, 0], [0, 0]], 0.6);
      P.face('eyes', pt > 0.5 ? 'smug' : undefined);
    } },
    // a strut in towering platforms: big hip sway, chin up, wings rustling
    walk: { len: 0.8, loop: true, f(P, t) {
      const w = walkCycle(P, R, t, { len: 0.8, stride: 1.8, lift: 1.4, bob: 0.5, sway: 9, swing: 22, twist: 10, crouch: 0.4, lean: -2, out: 12, bend: 20 });
      P.rot('head', -6, -w.s * 6, w.s * 4).rot('pelvis', 0, 0, w.c * 4); wings(P, 0.1, 4 * Math.abs(w.s)); beak(P, 0.05);
    } },
    // battle cry: an eagle's scream, head thrown back, wings flung wide, a star burst
    cry: { len: 2.2, next: 'idle', f(P, t) {
      const crouch = bump(t, 0, 0.34), up = seg(t, 0.3, 0.48, E.back) * (1 - seg(t, 1.6, 2.0, E.inout));
      legs(P, R, { y: -1.4 * crouch + 0.3 * up, pitch: -8 * up, spread: 4 * up });
      P.rot('torso', 10 * crouch - 14 * up, 0, 0).rot('head', 14 * crouch - 30 * up + wave(t, 12) * 3 * up, 0, 0);
      arms(P, { out: 20 * crouch + 80 * up, fwd: 20 * up, bend: 20 }); wings(P, 1.3 * up, 16 * up * Math.abs(wave(t, 3)));
      beak(P, 0.1 + 0.9 * up); emote(P, crouch > 0.3 ? 'angry' : up > 0.3 ? 'shut' : 'open'); P.blinkOK = false;
      if (up > 0.6) P.stream('soundring', 'head', BEAK, { rate: 6, dir: [0, 0.4, 1], tint: [1, 0.9, 0.6] });
      P.burst(0.5, 'sstar', 'head', HEAD, { n: 10, speed: 1.8 }).burst(0.5, 'feather', 'wingR', [-10, 12, -2.5], { n: 5, speed: 1.4 }).burst(0.55, 'kstar', 'head', HEAD, { n: 5, speed: 1.4 });
    } },
    // Love Gun: points a wing-hand like a pistol — bang, bang, bang — and blows the smoke off the claw
    attack: { len: 1.3, next: 'idle', f(P, t) {
      const aim = seg(t, 0, 0.18, E.back) * (1 - seg(t, 1.0, 1.25, E.inout)), blow = bump(t, 0.75, 1.1);
      let kick = 0; for (const t0 of [0.24, 0.38, 0.52]) { kick = Math.max(kick, bump(t, t0, t0 + 0.1)); P.burst(t0, 'sstar', 'handR', HAND_R, { n: 3, dir: [0, -1, 0.6], speed: 2.4, spread: 0.2 }).burst(t0, 'spark', 'handR', HAND_R, { n: 1 }); }
      hipShot(P, aim, 1); legs(P, R, hipLegs(aim, 1)); gun(P, aim); P.rot('armR', 12 * kick, 0, 0).rot('torso', 0, -14 * aim, 0).rot('head', -4 * aim, -16 * aim, 0);
      P.rot('head', 10 * blow, 0, 0); beak(P, 0.4 * blow); wings(P, 0.3 * aim, 0);
      emote(P, blow > 0.3 ? 'smug' : aim > 0.3 ? 'angry' : 'open'); P.blinkOK = false;
      P.burst(0.82, 'smoke', 'handR', HAND_R, { n: 3, dir: [0, 1, 0], speed: 0.4, scale: 0.6 });
    } },
    // special: the star eye blazes and fires a beam of stars and glitter
    special: { len: 2.2, next: 'idle', f(P, t) {
      const charge = seg(t, 0, 0.5, E.inout) * (1 - seg(t, 0.55, 0.65)), beam = seg(t, 0.6, 0.7, E.back) * (1 - seg(t, 1.6, 1.95, E.inout));
      legs(P, R, { y: -0.8 * charge - 0.6 * beam, spread: 6 * beam, pitch: -6 * beam });
      P.rot('torso', -6 * charge + 4 * beam, 0, 0).rot('head', -10 * charge + 4 * beam + wave(t, 14) * 2 * beam, 0, 0);
      arms(P, { out: 60 * charge + 40 * beam, fwd: 30 * beam, bend: 30 }); wings(P, 0.6 * charge + 1.0 * beam, 8 * beam * Math.abs(wave(t, 5)));
      beak(P, 0.2 * beam); P.face('eyes', charge > 0.3 ? 'closed' : beam > 0.3 ? 'star' : t > 1.9 ? 'smug' : undefined); P.blinkOK = false;
      if (beam > 0.5 && t < 1.65) P.stream('sstar', 'head', [-EYE[0], EYE[1], 4], { rate: 40, dir: [0, 0, 1], speed: 3, spread: 0.15 }).stream('sparkle', 'head', [-EYE[0], EYE[1], 4], { rate: 30, dir: [0, 0, 1], speed: 2.4, spread: 0.3, key: 'g' });
      P.burst(0.62, 'ring', 'head', [-EYE[0], EYE[1], 4], { tint: [1, 0.95, 0.7] });
    } },
    // victory: a leaping split, a landing in a power pose, wings up, star eyes
    win: { len: 2.6, next: 'idle', f(P, t) {
      const air = Math.max(0, Math.sin(seg(t, 0.15, 0.7, E.lin) * Math.PI)), crouch = bump(t, 0, 0.18) + bump(t, 0.68, 0.9), pose = seg(t, 0.85, 1.05, E.back) * (1 - seg(t, 2.15, 2.5, E.inout));
      legs(P, R, { y: -1.6 * crouch, fR: [3.2 * air, 3 * air], fL: [3.2 * air, -3 * air], spread: 10 * pose });
      P.pos('root', 0, 5 * air, 0); P.rot('torso', -10 * air, 0, 0);
      arms(P, { out: 70 * air + 90 * pose, fwd: 20 * pose, bend: 10 }); gun(P, pose * 0.6);
      wings(P, 1.0 * air + 1.3 * pose, 10 * pose * Math.max(0, wave(t, 2))); P.rot('head', -16 * pose, 10 * pose, 0); beak(P, 0.4 * pose);
      P.face('eyes', air > 0.3 ? 'shut' : pose > 0.3 ? 'star' : undefined); P.blinkOK = false;
      P.burst(0.4, 'sstar', 'root', [0, 6, 0], { n: 12, speed: 2 }).burst(0.92, 'kstar', 'head', HEAD, { n: 10, speed: 1.8 }).burst(0.92, 'confetti', 'head', HEAD, { n: 20, speed: 1.5 }).burst(0.9, 'dust', 'root', [0, 0.5, 0], { n: 10, spread: 1, speed: 1.2 });
    } },
    // the strut dance: hips swinging, a finger pointing round the crowd on the beat, a spin… and a leaping split to finish
    dance: { len: 3.2, next: 'idle', f(P, t) {
      const bt = t * 2, n = Math.floor(bt), ph = bt - n, hit = Math.sin(Math.min(1, ph * 1.8) * Math.PI), side = n % 2 ? 1 : -1, on = seg(t, 0, 0.15) * (1 - seg(t, 1.95, 2.05));
      const spin = seg(t, 1.5, 2.0, E.inout), air = Math.max(0, Math.sin(seg(t, 2.1, 2.55, E.lin) * Math.PI)), fin = seg(t, 2.55, 2.7, E.back) * (1 - seg(t, 2.95, 3.2));
      legs(P, R, { y: -0.6 * hit * on - 1.2 * bump(t, 2.0, 2.15) - 1.4 * bump(t, 2.5, 2.7), roll: side * 9 * on, fR: [3 * air, 3 * air], fL: [3 * air, -3 * air], spread: 10 * fin });
      P.rot('pelvis', 0, 0, side * 8 * hit * on).rot('torso', 0, -side * 14 * on, -side * 4 * on).rot('root', 0, 360 * spin, 0).pos('root', 0, 5 * air, 0);
      arm(P, 'R', { out: 20 * on + 80 * fin + 60 * air, fwd: (side > 0 ? 90 : 30) * on, bend: 10 }); arm(P, 'L', { out: 40 * on + 80 * fin + 60 * air, fwd: (side < 0 ? 90 : 0) * on - 20 * on, bend: (side > 0 ? 100 : 10) * on });
      wings(P, 0.3 * on + 1.2 * (air + fin), 10 * hit * on); P.rot('head', -6 * hit * on - 12 * fin, side * 16 * on, 0); beak(P, 0.1 + 0.3 * fin);
      P.face('eyes', fin > 0.3 ? 'star' : on > 0.5 ? (hit > 0.6 ? 'smug' : 'open') : undefined); P.blinkOK = false;
      for (const t0 of [0.02, 0.52, 1.02, 1.52]) P.burst(t0 + 0.05, 'sstar', 'handR', HAND_R, { n: 2, dir: [0, 0.2, 1], speed: 1.6 });
      P.burst(2.62, 'kstar', 'head', HEAD, { n: 10, speed: 1.6 }).burst(2.62, 'sparkle', 'root', [0, 4, 0], { n: 12, speed: 1.4 });
    } },
    // signature: the guitar smash — a power chord, a kneel, the guitar swung overhead, brought down on the floor in a
    // shower of splinters and sparks, and a cool look over the shoulder
    smash: { len: 3.8, next: 'idle', f(P, t) {
      const play = seg(t, 0.1, 0.35, E.back) * (1 - seg(t, 1.2, 1.4)), lift = seg(t, 1.3, 1.75, E.out) * (1 - seg(t, 1.9, 2.02, E.in3)), hitT = 2.0, slam = seg(t, 1.9, 2.02, E.in3) * (1 - seg(t, 2.6, 3.0, E.inout)), cool = seg(t, 2.9, 3.15, E.back) * (1 - seg(t, 3.5, 3.8, E.inout));
      P.face('prop', t > 0.08 && t < hitT ? 'on' : 'off');
      const strum = Math.abs(Math.sin(t * TAU * 3)) * play;
      legs(P, R, { y: -0.6 * play - 2.6 * slam, pitch: 10 * slam, spread: 8 * play, fR: [0, 1.6 * slam], fL: [0, -1.6 * slam] });
      P.rot('torso', 6 * play - 14 * lift + 30 * slam, -10 * play, 0).rot('head', -10 * lift + 10 * slam - 6 * cool, 0, -8 * cool + 20 * cool);
      arm(P, 'L', { out: 40 * play + 20 * lift, fwd: 50 * play + 150 * lift + 60 * slam, bend: 50 * play }); arm(P, 'R', { out: 20 * play + 20 * lift, fwd: 30 * play + 150 * lift + 60 * slam, bend: 70 * play - 40 * strum });
      P.rot('guitar', -60 * lift - 40 * slam, 0, 80 * lift + 60 * slam).pos('guitar', 0, 10 * lift, -2 * lift);
      wings(P, 0.3 * play + 1.2 * lift + 0.6 * slam, 6 * play * Math.abs(wave(t, 3))); beak(P, 0.3 * play + 0.8 * slam);
      arm(P, 'R', { out: 30 * cool, fwd: 0, bend: 0 }); hipShot(P, cool, -1);
      P.face('eyes', slam > 0.3 ? 'shut' : lift > 0.3 ? 'angry' : cool > 0.3 ? 'smug' : play > 0.3 ? 'closed' : undefined); P.blinkOK = false;
      for (const t0 of [0.4, 0.73, 1.06]) P.burst(t0, 'goldnote', 'torso', [0, 13, 5], { n: 1, dir: [0.3, 1, 0.5], speed: 1 });
      P.burst(hitT, 'shard', 'root', [0, 1, 5], { n: 18, spread: 1, speed: 2 }).burst(hitT, 'spark', 'root', [0, 1, 5], { n: 6 }).burst(hitT, 'dust', 'root', [0, 0.5, 5], { n: 14, spread: 1, speed: 1.6 }).burst(hitT, 'ring', 'root', [0, 1, 5], {}).burst(hitT + 0.05, 'sstar', 'root', [0, 2, 5], { n: 10, speed: 2 });
    } },
    // crowd work: a hand cupped to its ear, a slow nod… then it points straight at you
    crowd: { len: 2.6, next: 'idle', f(P, t) {
      const ear = seg(t, 0.1, 0.4, E.back) * (1 - seg(t, 1.3, 1.5)), point = seg(t, 1.45, 1.6, E.back) * (1 - seg(t, 2.2, 2.55, E.inout));
      hipShot(P, 1 - point, 1); legs(P, R, { ...hipLegs(1 - point, 1), y: -0.3 - 0.4 * point, spread: 6 * point });
      arm(P, 'R', { out: 70 * ear + 10 * point, fwd: 30 * ear + 90 * point, bend: 140 * ear }); P.rot('head', 6 * ear * Math.sin(t * 8), -24 * ear, 14 * ear);
      wings(P, 0.2 + 0.4 * point, 0); beak(P, 0.15 * ear + 0.5 * point);
      P.face('eyes', ear > 0.5 ? 'sleepy' : point > 0.3 ? 'wide' : undefined); P.blinkOK = false;
      P.burst(1.5, 'sstar', 'handR', HAND_R, { n: 4, dir: [0, 0, 1], speed: 2 });
    } },
  },
};
def.anim = anim;
// the ultra-drip form: black lacquer suit and wings with gold tips and studs, a gold beak, white feathers and gold eyes kept
def.dripForm = kissForm({ keep: [C.eye, C.eyeLo, C.eyeHi], swap: { [C.scale]: '#ffd84a' } });
