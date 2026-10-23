// Spaceshell — a stone-split final of the Kissmet line (Draco/Astro): the Spaceman, a KISS homage
// that leans into the chimera's turtle. A stocky silver space turtle whose shell is a rocket ship:
// riveted chrome scutes, twin boosters that fire, eagle-feather fins and an antenna with a blinking
// tip. A white greasepaint face with a silver star round each spaced-out eye, a sweep of dark hair,
// a chrome plastron with a star, silver moon-platform boots — and a silver-burst single-cut guitar
// that smokes whenever it solos. Chimera hints: the eagle-feather fins, a black lion's ruff collar,
// and a little banded snake tail that peeks out under the boosters.
// Signature: the rocket solo — the guitar smokes harder and harder, then fires rockets out of its headstock.
// Drip (one per tier): 1 star visor pushed up | light-up head antenna · 2 ringed-planet chain |
// rocket bracers · 3 orbiting flying saucer | a Saturn ring round its middle.
import {
  K, CH, B, both, at, fill, isSide, shift, ramp, fur, leather, chrome, spike, spikeP, painted, shellP, bootP, soleP, scalesP, flames, chain, quillP,
  chimMane, snakeBands, snakeHead, cobEyes, legs, arm, arms, emote, sharedClips, onBack, walkCycle, glances, kissForm, starPts, inPoly, E, seg, bump, wob, wave, TAU,
} from './kiss_parts.js';
import { bounce } from '../anim.js';

const C = { eye: '#4ad8ff', eyeLo: '#1a6aa8', eyeHi: '#b8f4ff', skin: '#8a96a0', skinHi: '#b4c0c8', skinLo: '#56606c', beak: ['#5a6070', '#3a3e4c', '#24262e', '#121318'], hair: '#1c1a28', hairHi: '#3c3a58', burst: ['#f4f6fa', '#b8bcc8', '#5a5e6c', '#141418'] };
const SILVER = ['#ffffff', '#d4d8e4', '#9aa0b4', '#4a4e60'];
// ---------------------------------------------------------------- painters
const skinP = scalesP(C.skin, { size: 3, top: C.skinHi, bottom: C.skinLo });
const suitP = chrome({ cols: SILVER });
const suitStud = (p, w, h, face, cube) => { suitP(p, w, h, face, cube); if (isSide(face)) for (let y = 2; y < h - 1; y += 4) for (let x = 2; x < w - 1; x += 4) p.px(x, y, '#ffffff').px(x + 1, y + 1, SILVER[3]); };
// the plastron: chrome plates with seams and a black-rimmed silver star
const STAR = starPts(0, 13.6, 2.3, 0.45, 0, false);
const plastronP = (p, w, h, face, cube) => {
  suitP(p, w, h, face, cube);
  if (face !== 'south') return;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [X, Y] = at(face, cube, x, y);
    if (Math.abs(X) < 0.16 || Math.abs(Y - 11.4) < 0.16 || Math.abs(Y - 15.8) < 0.16) p.px(x, y, SILVER[3]);
    if (inPoly(STAR, X, Y)) { const e = !inPoly(STAR, X + 0.34, Y) || !inPoly(STAR, X - 0.34, Y) || !inPoly(STAR, X, Y + 0.34) || !inPoly(STAR, X, Y - 0.34); p.px(x, y, e ? K.paint : Y > 14 ? '#ffffff' : SILVER[1]); }
  }
};
const ruffP = chimMane(71, { s: 5, tipH: 2.5 });
const hairP = fur(C.hair, { hi: C.hairHi, lo: '#0c0a14', line: '#06050a', tip: '#4a4a78', s: 5, tipH: 2.5, pt: 0.6, seed: 13 });
// the face: white paint over the upper face with a silver star round each eye, rimmed in black
const EYE = [1.85, 21.0];
const SR = starPts(-EYE[0], EYE[1] + 0.1, 2.35, 0.5, 0, false), SL = starPts(EYE[0], EYE[1] + 0.1, 2.35, 0.5, 0, false);
const inStar = (X, Y) => inPoly(SR, X, Y) || inPoly(SL, X, Y);
const faceP = painted(skinP, { mask: { x: 0, y: 21.0, rx: 3.6, ry: 2.9, col: K.white, lo: K.whiteLo, line: K.whiteLine },
  marks: [{ fn: (X, Y) => { if (!inStar(X, Y)) return null; const e = !inStar(X + 0.34, Y) || !inStar(X - 0.34, Y) || !inStar(X, Y + 0.34) || !inStar(X, Y - 0.34); return e ? K.paint : Y > EYE[1] + 0.9 ? '#eef0f6' : SILVER[1]; } }] });
const beakP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'down' ? K.mouth : face === 'up' ? C.beak[0] : ramp(C.beak, h > 1 ? y / (h - 1) : 0.5, x, y))); if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, h - 1, C.beak[3]); };
const jawP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? K.mouth : y === 0 ? C.beak[3] : ramp([C.beak[1], C.beak[2]], h > 1 ? y / (h - 1) : 0.5, x, y)));
// the rocket shell: riveted chrome scutes
const shellBig = shellP({ cols: ['#ffffff', '#c8ccd8', '#8a90a4', '#3a3e4c'], studCols: ['#ffffff', '#5a5e70', '#3a3e4c', '#22242c'], stud: true, rim: 8.4, size: 2.8 });
const shellTop = shellP({ cols: ['#ffffff', '#c8ccd8', '#8a90a4', '#3a3e4c'], studCols: ['#ffffff', '#5a5e70', '#3a3e4c', '#22242c'], stud: true, size: 2.8 });
const boosterP = (p, w, h, face) => { suitP(p, w, h, face); if (isSide(face)) for (let x = 0; x < w; x++) { p.px(x, Math.floor(h * 0.3), K.blood[1]).px(x, Math.floor(h * 0.3) + 1, K.blood[2]); } };
const nozzleP = chrome({ cols: ['#8a8e9c', '#4a4e5c', '#24262e', '#0c0d10'] });
// eagle-feather fins (planes x): a long silver feather edged in black
const finP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = y / (h - 1), u = x / (w - 1), half = 0.5 * Math.sin(Math.min(1, v * 1.15) * Math.PI) * (1 - 0.35 * v) + 0.05; if (Math.abs(u - 0.5 - 0.15 * v) > half) continue; const edge = Math.abs(u - 0.5 - 0.15 * v) > half - 0.12; p.px(x, y, edge ? '#16141c' : Math.abs(u - 0.5 - 0.15 * v) < 0.04 ? SILVER[3] : (x + y) % 4 === 0 ? SILVER[2] : SILVER[1]); } };
const bootStar = painted(chrome({ cols: ['#ffffff', '#e4e8f0', '#b0b6c8', '#6a7084'] }), { sym: true, marks: [{ star: [-3.0, 3.4, 1.15, 0.45, 0], col: K.paint }] });
const sole = soleP({ cols: ['#ffffff', '#a4aabc', '#6a7084', '#3a3e4c'] }), trim = chrome();
const beltP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? '#3a3444' : '#16141c')); if (face === 'south') { const m = Math.floor(w / 2); p.rect(m - 2, 0, 4, h, SILVER[1]).rect(m - 1, 1, 2, h - 2, '#ffffff'); } };
const tailP = snakeBands('z', { per: 1.6 });
const sheadP = snakeHead({ eye: (X, Y, Z) => (Z < -8.2 && Z > -8.9 && Y > 8.35 && Y < 8.9 ? (Math.abs(Z + 8.55) < 0.17 ? 'k' : 'i') : null) });
// the silver-burst single-cut guitar: silver at the centre bursting to black, three black pickups
const guitarP = (p, w, h, face) => {
  const cx = (w - 1) / 2, cy = (h - 1) * 0.55;
  fill(p, w, h, (x, y) => { if (face === 'up' || face === 'down') return '#e8e8f0'; const d = Math.hypot((x - cx) / (w / 2), (y - cy) / (h / 2)); return face !== 'south' ? '#f0f0f6' : d < 0.4 ? C.burst[0] : d < 0.65 ? C.burst[1] : d < 0.85 ? C.burst[2] : C.burst[3]; });
  if (face === 'south') { const m = Math.floor(w / 2); for (const fy of [0.28, 0.45, 0.62]) p.rect(m - 2, Math.floor(h * fy), 4, 2, '#141418').px(m - 1, Math.floor(h * fy), '#8a8a96'); for (let y = 2; y < h - 2; y++) if (y % 3) p.px(m, y, '#ffffff'); p.rect(m - 2, Math.floor(h * 0.8), 4, 1, SILVER[2]); }
};
const fretP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'south' ? (y % 3 === 0 ? SILVER[2] : '#3a2414') : '#24160c'));
const headstockP = (p, w, h, face) => { fill(p, w, h, () => '#141418'); if (face === 'south') for (let y = 1; y < h; y += 2) { p.px(0, y, SILVER[1]); p.px(w - 1, y, SILVER[1]); } };
const strapP = (p, w, h) => fill(p, w, h, (x, y) => (y === 0 ? '#4a4458' : (x + y) % 4 === 0 ? SILVER[2] : '#1c1924'));
// drip painters
const visorP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'south' ? (y === 0 || y === h - 1 ? SILVER[1] : x + y < 4 ? '#c8f4ff' : '#3a8ad8') : SILVER[2]));
const bulbP = (p, w, h) => fill(p, w, h, (x, y) => (x === 0 && y === 0 ? '#ffffff' : '#ff3a5a'));
const planetP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? '#a8c8ff' : y % 3 === 0 ? '#6a8ad8' : y % 3 === 1 ? '#8aaaf0' : '#4a6ab8'));
const ringP = (inner, cols = ['#e8d8a8', '#b8a070', '#fff4c8']) => (p, w, h) => { const cx = w / 2, cy = h / 2; fill(p, w, h, (x, y) => { const r = Math.hypot((x + 0.5 - cx) / (w / 2), (y + 0.5 - cy) / (h / 2)); if (r > 1 || r < inner) return null; const k = Math.floor((r - inner) / (1 - inner) * 5); return cols[k % cols.length]; }); };
const saucerP = chrome({ cols: ['#ffffff', '#c8ccd8', '#8a90a4', '#4a4e60'] });
const domeP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? '#c8f4ff' : x + y < 3 ? '#ffffff' : '#7ac8f0'));
const lightsP = (p, w, h, face) => { saucerP(p, w, h, face); if (isSide(face)) for (let x = 1; x < w; x += 3) p.px(x, Math.floor(h / 2), ['#ff3a5a', '#3affb0', '#ffd23a'][(x / 3) % 3 | 0]); };

// ---------------------------------------------------------------- the model
const R = { hipX: 3.0, hipY: 8.6, ankleY: 3.2, L1: 2.8, L2: 2.6 };
// spaced-out eyes: whites under a heavy lid that droops at the outer corner, an ice-blue iris (dark top,
// pale bottom) gazing up and in, a round pupil and a glint
const EYE_MAPS = {
  open: ['...llllll', '.lllwIIIl', 'lwwwhkkIw', '.wwwikkiw', '..wwicciw', '...wwww..'],
  angry: ['l........', 'llll.....', 'lwwwlll..', '.wwwikkll', '..wwicciw', '...wwww..'],
  sad: ['.........', '......ll.', '...lllIl.', '.lllikkIw', '..wwicciw', '...wwww..'],
  happy: ['.........', '..llll...', '.llllll..', 'lll..lll.', 'll....ll.', '.........'],
  closed: ['.........', '.........', '.........', 'llllllll.', '.llllll..', '.........'],
  shock: ['...llllll', '.lllwwwwl', 'lwwwwkwww', '.wwwwwwww', '..wwwwwww', '...wwww..'],
  wide: ['...llllll', '.lllwwwwl', 'lwwwhIIww', '.wwwIkkww', '..wwwwwww', '...wwww..'],
  smug: ['.........', '.........', 'lllllllll', '.wwwikkiw', '..wwicciw', '...wwww..'],
  sleepy: ['.........', '.........', '.........', 'lllllllll', '..wwicciw', '...wwww..'],
  teary: ['...llllll', '.lllwIIIl', 'lwwwhkkIw', '.wwwikkiw', '..bbiccib', '...bbbb..'],
};
const EYES = cobEyes({ at: [-EYE[0], EYE[1], 3.86], line: '#0c0c14', pupilColor: '#06060c', iris: C.eye, irisDark: C.eyeLo, accent: C.eyeHi, maps: EYE_MAPS });
const A = (id, c) => ({ ...c, id, hide: true });
const sp = (id, x, y, z, s, len, rot) => spike(x, y, z, s, len, { x: { pivot: [x, y, z], rot } }).map((c) => (id ? A(id, c) : c));
const SILV = { hi: '#ffffff', base: '#c8ccd8', lo: '#8a90a4', deep: '#4a5064', spec: '#ffffff' };
const CHAIN = chain([[-3.0, 17.0, 2.6], [-2.6, 15.6, 3.6], [-1.3, 14.6, 3.6], [0, 14.3, 3.6], [1.3, 14.6, 3.6], [2.6, 15.6, 3.6], [3.0, 17.0, 2.6]], { len: 1.0, w: 0.7, t: 0.34, step: 0.75, gold: SILV }).map((c) => A('acc-chain', c));
const RIGHT = [
  { name: 'thighR', parent: 'root', pivot: [-3.0, 8.6, 0], cubes: [B(-4.4, 5.4, -1.7, -1.6, 9.2, 1.7, suitStud)] },
  { name: 'shinR', parent: 'thighR', pivot: [-3.0, 5.8, 0], cubes: [B(-4.1, 3.0, -1.4, -1.9, 5.8, 1.4, skinP)] },
  { name: 'footR', parent: 'shinR', pivot: [-3.0, 3.2, 0], cubes: [B(-4.6, 0, -2.4, -1.4, 1.8, 3.4, sole), B(-4.4, 1.8, -2.1, -1.6, 4.8, 3.0, bootStar), B(-4.5, 4.6, -1.9, -1.5, 5.2, 2.0, trim)] },
  { name: 'armR', parent: 'torso', pivot: [-5.4, 16.4, 0.2], cubes: [B(-7.0, 12.8, -1.4, -4.6, 16.8, 1.6, suitStud)] },
  { name: 'foreR', parent: 'armR', pivot: [-5.8, 13.0, 0.2], cubes: [
    B(-6.9, 9.8, -1.3, -4.7, 13.2, 1.5, skinP),
    // dripped (or): rocket bracers with little thrusters
    A('acc-bracers', B(-7.1, 10.4, -1.5, -4.5, 12.4, 1.7, suitStud)), A('acc-bracers', B(-7.9, 10.6, -1.0, -7.1, 12.6, 0.0, boosterP)), A('acc-bracers', B(-7.9, 10.6, 0.4, -7.1, 12.6, 1.4, boosterP)),
  ] },
  { name: 'handR', parent: 'foreR', pivot: [-5.8, 9.8, 0.2], cubes: [B(-7.1, 8.2, -1.4, -4.5, 10.0, 1.8, skinP), ...[-6.9, -6.1, -5.3].map((x) => B(x, 7.6, 1.0, x + 0.6, 8.4, 1.8, spikeP({ down: true })))] },
  // an eagle-feather fin on each side of the shell
  { name: 'finR', parent: 'shell', pivot: [-6.0, 14.0, -5.0], rot: [0, 0, 18], cubes: [B(-6.1, 9.4, -9.2, -6.1, 18.4, -3.0, finP, { plane: 'x', outline: false })] },
];
export const def = {
  name: 'spaceshell', ppu: 3, scale: 0.56, outline: { color: '#0a0a12', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'pelvis', parent: 'root', pivot: [0, 8.6, 0], cubes: [B(-4.6, 7.4, -3.0, 4.6, 10.2, 3.0, suitStud), B(-4.7, 9.4, -3.1, 4.7, 10.4, 3.2, beltP)] },
    // the little snake tail, peeking out under the boosters
    { name: 'stail', parent: 'pelvis', pivot: [0, 8.0, -2.8], rot: [0, -50, 0], cubes: [B(-0.7, 7.4, -6.6, 0.7, 8.8, -2.6, tailP)] },
    { name: 'snek', parent: 'stail', pivot: [0, 8.2, -6.2], rot: [0, 70, 0], cubes: [B(-0.9, 7.6, -9.0, 0.9, 9.0, -6.0, sheadP)] },
    { name: 'torso', parent: 'pelvis', pivot: [0, 9.8, 0], cubes: [
      B(-5.0, 9.8, -3.0, 5.0, 17.4, 3.4, plastronP),
      B(-4.2, 16.6, -2.6, 4.2, 18.4, 3.4, ruffP),
      // dripped: a chain with a ringed-planet pendant
      ...CHAIN, A('acc-chain', B(-0.9, 12.6, 3.5, 0.9, 14.4, 4.4, planetP)), A('acc-chain', B(-2.0, 13.5, 3.95, 2.0, 13.5, 3.95, ringP(0.55), { plane: 'y', pivot: [0, 13.5, 3.95], rot: [20, 0, 16] })),
      // the guitar strap
      B(-5.2, 13.8, 3.42, 5.2, 14.5, 3.72, strapP, { pivot: [0, 14.15, 3.57], rot: [0, 0, 40] }),
    ] },
    // the silver-burst single-cut, slung across the front
    { name: 'guitar', parent: 'torso', pivot: [-1.0, 10.8, 4.2], rot: [0, 0, -50], cubes: [
      B(-3.4, 7.4, 3.6, 1.6, 12.0, 4.8, guitarP), B(-3.4, 12.0, 3.7, -0.6, 13.4, 4.7, guitarP),
      B(-1.35, 12.0, 3.95, -0.65, 19.6, 4.45, fretP), B(-1.75, 19.6, 3.85, -0.25, 21.2, 4.55, headstockP),
    ] },
    { name: 'shell', parent: 'torso', pivot: [0, 13.0, -3.0], cubes: [
      B(-6.0, 7.4, -7.0, 6.0, 18.0, -2.8, shellBig), B(-4.8, 8.6, -8.4, 4.8, 16.8, -7.0, shellTop), B(-3.4, 10.0, -9.2, 3.4, 15.4, -8.4, shellTop),
      // twin boosters and their nozzles
      B(-4.6, 5.6, -10.4, -1.8, 11.4, -7.6, boosterP), B(1.8, 5.6, -10.4, 4.6, 11.4, -7.6, boosterP),
      B(-4.2, 4.6, -10.0, -2.2, 5.6, -8.0, nozzleP), B(2.2, 4.6, -10.0, 4.2, 5.6, -8.0, nozzleP),
      // the antenna
      B(-0.2, 18.0, -6.2, 0.2, 21.6, -5.8, trim), B(-0.5, 21.6, -6.5, 0.5, 22.4, -5.5, bulbP, { glow: true }),
    ] },
    { name: 'thrust', parent: 'shell', pivot: [0, 4.6, -9.0], cubes: [-3.2, 3.2].flatMap((x) => [0, 1].flatMap((f) => [
      B(x - 1.4, 0.4, -9.0, x + 1.4, 4.6, -9.0, flames(f + 1, 1), { plane: 'z', glow: true, id: 'th-' + f, hide: true, pivot: [x, 4.6, -9.0], rot: [0, 0, 180] }),
      B(x, 0.4, -10.4, x, 4.6, -7.6, flames(f + 3, 1), { plane: 'x', glow: true, id: 'th-' + f, hide: true, pivot: [x, 4.6, -9.0], rot: [180, 0, 0] }),
    ])) },
    { name: 'head', parent: 'torso', pivot: [0, 17.6, 0.6], cubes: [
      B(-3.4, 17.4, -1.8, 3.4, 23.4, 3.8, skinP, { faces: { south: faceP } }),
      B(-2.4, 17.9, 3.8, 2.4, 19.8, 5.4, beakP),
      // a sweep of dark hair, a fringe falling to one side
      B(-3.7, 22.4, -2.2, 3.7, 24.6, 3.6, hairP), B(-3.7, 18.4, -2.6, 3.7, 24.0, -1.2, hairP),
      B(-3.9, 19.0, -2.0, -3.3, 23.4, 2.4, hairP), B(3.3, 19.0, -2.0, 3.9, 23.4, 2.4, hairP, { mirror: true }),
      B(-3.6, 22.9, 3.4, 1.2, 24.0, 4.2, hairP, { pivot: [-1.2, 23.4, 3.8], rot: [0, 0, 8] }),
      // normal: a star visor pushed up on the hair
      A('acc-visor', B(-3.6, 23.9, 3.5, 3.6, 25.2, 4.3, visorP)), A('acc-visor', B(-3.9, 24.2, -1.0, -3.6, 24.8, 4.0, trim)), A('acc-visor', B(3.6, 24.2, -1.0, 3.9, 24.8, 4.0, trim)),
      // normal (or): a light-up head antenna
      A('acc-antenna', B(-2.6, 24.4, 0.2, -2.2, 27.4, 0.6, trim, { pivot: [-2.4, 24.4, 0.4], rot: [0, 0, 14] })), A('acc-antenna', B(-3.4, 27.0, -0.1, -2.4, 28.0, 0.9, bulbP, { glow: true })),
    ] },
    ...EYES.bones,
    { name: 'jaw', parent: 'head', pivot: [0, 18.2, 3.0], cubes: [B(-2.2, 17.0, 2.4, 2.2, 18.0, 5.2, jawP)] },
    // ultra dripped: a little flying saucer orbiting its head
    { name: 'orbit', parent: 'head', pivot: [0, 25.6, 0.6], cubes: [
      A('acc-ufo', B(4.4, 25.4, -0.6, 7.8, 26.2, 2.8, lightsP)), A('acc-ufo', B(5.2, 26.2, 0.2, 7.0, 27.2, 2.0, domeP)),
    ] },
    // ultra (or): a Saturn ring round its middle
    { name: 'saturn', parent: 'pelvis', pivot: [0, 11.4, 0], rot: [14, 0, 8], cubes: [A('acc-saturn', B(-10, 11.4, -10, 10, 11.4, 10, ringP(0.68), { plane: 'y', outline: false }))] },
    ...both(...RIGHT),
  ],
};
def.drip = [
  [{ id: 'acc-visor', name: 'Star visor' }, { id: 'acc-antenna', name: 'Light-up antenna' }],
  [{ id: 'acc-chain', name: 'Ringed-planet chain' }, { id: 'acc-bracers', name: 'Rocket bracers' }],
  [{ id: 'acc-ufo', name: 'Orbiting saucer' }, { id: 'acc-saturn', name: 'Saturn ring' }],
];
def.attach = {
  head: { bone: 'head', at: [0, 24.6, 0.6], size: 8 },
  face: { bone: 'head', at: [0, 21.0, 3.9], size: 7 },
  neck: { bone: 'torso', at: [0, 17.2, 3.2], size: 8 },
  back: { bone: 'shell', at: [0, 13.0, -9.2], size: 9 },
};

// ---------------------------------------------------------------- animation
const HEAD = [0, 26, 1], MOUTH = [0, 18.2, 5.8], GHEAD = [-1.0, 21.2, 4.2], ANT = [0, 22.4, -6.0], NOZZLES = [0, 3.8, -9.0];
const beak = (P, k) => P.rot('jaw', 26 * k, 0, 0);
const thrust = (P, t, on) => P.face('thrust', on ? (Math.floor(t * 14) % 2 ? 'b' : 'a') : 'off');
// fingers on the strings: left hand up the neck, right hand at the strings (k), strumming (s)
const play = (P, k, s = 0) => { arm(P, 'L', { out: 10 * k, fwd: 60 * k, bend: 70 * k, twist: -30 * k }); arm(P, 'R', { out: 6 * k, fwd: 40 * k, bend: 60 * k - 26 * s }); };
const shared = sharedClips(R, {
  headTop: HEAD, weight: 0.5,
  // stuck on its rocket shell, legs and arms waving
  downPose: (P, k, t) => { onBack(P, R, k, t, { lift: 7.6, slide: 1 }); beak(P, 0.4 * k); P.rot('pelvis', 0, wave(t, 0.3) * 20 * k, 0); },
  // asleep inside its shell: head, arms and legs pulled in
  sleepPose: (P, br) => { legs(P, R, { y: -2.6 + br * 0.15, fR: [0, 0.6], fL: [0, 0.6], spread: 10 }); P.pos('head', 0, -2.6, -2.4).rot('head', 10 + br * 2, 0, 0); arms(P, { out: 4, fwd: 30, bend: 90 }); P.rot('torso', 4, 0, 0); },
});
export const anim = {
  start: 'idle', seed: 37,
  breathe: { bone: 'torso', amp: 0.016, per: 2.8 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.4], dur: 0.16 },
  look: { bone: 'head', yaw: 28, pitch: 12, speed: 4 },
  springs: [
    { bone: 'guitar', tip: [0, 8, 0], k: 220, d: 11, gain: 0.35, max: 8 },
    { bone: 'finR', tip: [0, 4, -3], k: 200, d: 10, gain: 0.4, max: 10 },
    { bone: 'finL', tip: [0, 4, -3], k: 200, d: 10, gain: 0.4, max: 10 },
    { bone: 'stail', tip: [0, 0, -3], k: 140, d: 8, gain: 0.8, max: 16 },
    { bone: 'snek', tip: [0, 0, -2], k: 140, d: 8, gain: 0.8, max: 16 },
  ],
  faces: { eyes: EYES.slot, thrust: { default: 'off', states: { off: [], a: ['th-0'], b: ['th-1'] } } },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'rocketsolo', 'rocketsolo', 'hide'] },
  clips: {
    ...shared,
    // a dreamy sway on another planet's gravity; the guitar smoulders, the antenna blinks, the saucer orbits
    idle: { len: 3.0, loop: true, f(P, t, c) {
      const b = bounce(t, 1.5, { squash: 0.03, stretch: 0.02 }), s = Math.sin((t / 3.0) * TAU), lick = c.loopN % 2 ? bump(t, 1.0, 2.0) : 0, strum = Math.abs(Math.sin(t * TAU * 2)) * lick;
      legs(P, R, { y: -0.3 + b.u * 0.4, roll: 3 * s }); P.sq('torso', b.sq).rot('torso', 0, 4 * s, -2 * s).rot('head', 4 + 3 * Math.cos((t / 3) * TAU * 2), -10 * s, 8 * s);
      play(P, 0.5 + 0.5 * lick, strum); beak(P, 0.08 + 0.2 * lick);
      P.rot('orbit', 0, t * 120, 0).rot('saturn', 0, t * 40, 0).scl('shell', 1, 1, 1);
      glances(P, t, [[0, 0.05], [-0.25, 0.1], [0.2, 0.05], [0, 0.1], [0.3, 0]], 0.6); thrust(P, t, false);
      P.face('eyes', lick > 0.4 ? 'closed' : 'sleepy');
      P.stream('smoke', 'guitar', GHEAD, { rate: 1.2 + 4 * lick, dir: [0, 1, 0], speed: 0.3, scale: 0.6 });
      if (Math.floor(t * 2) % 3 === 0) P.stream('sparkle', 'shell', ANT, { rate: 6, spread: 0.3, key: 'a' });
    } },
    // a low-gravity waddle in moon boots: each step a little float
    walk: { len: 1.0, loop: true, f(P, t) {
      const w = walkCycle(P, R, t, { len: 1.0, stride: 1.4, lift: 1.4, bob: 0.9, sway: 6, swing: 18, twist: 4, crouch: 0.3, lean: 3, out: 10, bend: 30, heavy: 1 });
      P.pos('root', 0, 0.6 * Math.abs(w.c), 0).rot('head', -2, -w.s * 6, 0); play(P, 0.3, 0); beak(P, 0.05); thrust(P, t, false); P.face('eyes', 'sleepy');
      P.burst(0.05, 'dust', 'root', [-3, 0.3, 0], { n: 2, speed: 0.4 }).burst(0.55, 'dust', 'root', [3, 0.3, 0], { n: 2, speed: 0.4 });
    } },
    // battle cry: a screaming guitar bend, head thrown back, the antenna crackling
    cry: { len: 2.2, next: 'idle', f(P, t) {
      const crouch = bump(t, 0, 0.34), up = seg(t, 0.3, 0.48, E.back) * (1 - seg(t, 1.6, 2.0, E.inout)), bend = Math.abs(Math.sin(t * TAU * 4)) * up;
      legs(P, R, { y: -1.4 * crouch + 0.3 * up, pitch: -8 * up, spread: 6 * up }); P.rot('torso', 10 * crouch - 16 * up, 0, 0).rot('head', 10 * crouch - 26 * up, 0, wave(t, 4) * 6 * up);
      play(P, 1, bend); P.rot('guitar', 0, 0, 30 * up); beak(P, 0.1 + 0.8 * up);
      emote(P, crouch > 0.3 ? 'angry' : up > 0.3 ? 'shut' : 'open'); P.blinkOK = false; thrust(P, t, false);
      if (up > 0.5) P.stream('soundring', 'guitar', [-1, 10, 4.6], { rate: 6, dir: [0, 0.3, 1], tint: [0.7, 0.9, 1] }).stream('cosmic', 'guitar', [-1, 10, 4.6], { rate: 16, spread: 1, key: 'c' });
      P.burst(0.55, 'kbolt', 'shell', ANT, { n: 4, speed: 0.4 }).burst(0.55, 'ring', 'root', [0, 1, 0], {});
    } },
    // Shock Me: a sharp strum and a bolt of lightning off the headstock
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const back = seg(t, 0, 0.22, E.out) * (1 - seg(t, 0.24, 0.3, E.in)), hit = seg(t, 0.28, 0.38, E.out) * (1 - seg(t, 0.6, 0.95, E.inout));
      legs(P, R, { y: -1.0 * back, z: -0.6 * back + 0.6 * hit, pitch: -8 * back + 10 * hit, fR: [0, 1 * hit] });
      P.rot('torso', 0, 20 * back - 20 * hit, 0); play(P, 1, hit); P.rot('guitar', -20 * hit, 0, -30 * hit); beak(P, 0.6 * hit);
      emote(P, back > 0.2 || hit > 0.2 ? 'angry' : 'open'); P.blinkOK = false; thrust(P, t, false);
      P.burst(0.32, 'kbolt', 'guitar', GHEAD, { n: 3, dir: [0, 0, 1], speed: 2 }).burst(0.32, 'spark', 'guitar', GHEAD, { n: 2 }).burst(0.34, 'cosmic', 'guitar', GHEAD, { n: 8, speed: 1.4 });
    } },
    // special: boosters roar — it lifts off, hovers in a ring of silver fire and cosmic dust, and lands
    special: { len: 2.6, next: 'idle', f(P, t) {
      const ign = seg(t, 0.1, 0.4) * (1 - seg(t, 2.0, 2.2)), lift = seg(t, 0.35, 0.9, E.out) * (1 - seg(t, 1.8, 2.2, E.in)), land = bump(t, 2.15, 2.4);
      P.pos('root', 0, 7 * lift + wave(t, 3) * 0.4 * lift, 0); legs(P, R, { y: -1.2 * land - 0.6 * bump(t, 0.1, 0.35), fR: [1.2 * lift, -0.6 * lift], fL: [1.6 * lift, 0.4 * lift] });
      P.rot('torso', 8 * lift, 0, wave(t, 2) * 3 * lift); arms(P, { out: 40 * lift, fwd: 10, bend: 30 }); beak(P, 0.4 * lift);
      thrust(P, t, ign > 0.2); P.face('eyes', ign > 0.2 ? (lift > 0.5 ? 'wide' : 'angry') : t > 2.3 ? 'smug' : 'sleepy'); P.blinkOK = false;
      if (ign > 0.3) P.stream('fire', 'shell', NOZZLES, { rate: 50, dir: [0, -1, 0], speed: 1.6, spread: 0.3 }).stream('smoke', 'shell', NOZZLES, { rate: 10, dir: [0, -1, 0], speed: 0.6, key: 's' }).stream('cosmic', 'root', [0, 2, 0], { rate: 20, spread: 1, key: 'c' });
      P.burst(0.4, 'ring', 'root', [0, 0.5, 0], { scale: 2 }).burst(2.2, 'dust', 'root', [0, 0.5, 0], { n: 14, spread: 1, speed: 1.4 });
    } },
    // victory: a rocket hop and a spin, a landing, the guitar held up to the sky and a shower of stars
    win: { len: 2.6, next: 'idle', f(P, t) {
      const air = Math.max(0, Math.sin(seg(t, 0.2, 0.9, E.lin) * Math.PI)), up = seg(t, 1.0, 1.2, E.back) * (1 - seg(t, 2.2, 2.55, E.inout)), land = bump(t, 0.85, 1.1);
      P.pos('root', 0, 6 * air, 0).rot('root', 0, 360 * seg(t, 0.2, 0.9, E.inout), 0); legs(P, R, { y: -1.4 * land - 0.8 * bump(t, 0, 0.2), spread: 6 * up });
      arms(P, { out: 30 * air + 20 * up, fwd: 150 * up, bend: 10 }); P.rot('guitar', 0, 0, 120 * up).pos('guitar', 0, 6 * up, 0); beak(P, 0.5 * up);
      thrust(P, t, air > 0.1); P.face('eyes', air > 0.3 ? 'wide' : up > 0.3 ? 'happy' : 'sleepy'); P.blinkOK = false;
      if (air > 0.2) P.stream('fire', 'shell', NOZZLES, { rate: 40, dir: [0, -1, 0], speed: 1.4, spread: 0.3 });
      P.burst(1.1, 'sstar', 'head', HEAD, { n: 12, speed: 2 }).burst(1.1, 'cosmic', 'head', HEAD, { n: 12, speed: 1.6 }).burst(1.0, 'dust', 'root', [0, 0.5, 0], { n: 10, spread: 1, speed: 1.2 });
    } },
    // the space walk: a slow-motion low-gravity slide on each beat, the guitar swung side to side, booster puffs,
    // a floating spin and a landing pointed at the stars
    dance: { len: 3.2, next: 'idle', f(P, t) {
      const bt = t * 1.5, n = Math.floor(bt), ph = bt - n, glide = Math.sin(ph * Math.PI), side = n % 2 ? 1 : -1, on = seg(t, 0, 0.2) * (1 - seg(t, 2.1, 2.2));
      const float = Math.max(0, Math.sin(seg(t, 2.1, 2.8, E.lin) * Math.PI)), fin = seg(t, 2.75, 2.9, E.back) * (1 - seg(t, 3.0, 3.2));
      legs(P, R, { y: -0.4 * on, roll: side * 6 * on, ['f' + (side > 0 ? 'R' : 'L')]: [0.6 * glide * on, -2.2 * glide * on] });
      P.pos('root', side * 0.6 * glide * on, 0.8 * glide * on + 4 * float, 0).rot('root', 0, 360 * seg(t, 2.1, 2.8, E.inout), 0);
      P.rot('torso', 0, -side * 14 * on, side * 6 * on).rot('head', -6 * fin, side * 12 * on, -side * 8 * on);
      play(P, on, glide); P.rot('guitar', 0, 0, side * 20 * on); arm(P, 'R', { out: 30 * fin, fwd: 170 * fin, bend: 0 });
      beak(P, 0.15 + 0.3 * fin); thrust(P, t, float > 0.1);
      P.face('eyes', fin > 0.3 ? 'happy' : on > 0.5 ? 'closed' : 'sleepy'); P.blinkOK = false;
      for (const t0 of [0.05, 0.72, 1.39, 2.05]) P.burst(t0, 'smoke', 'shell', NOZZLES, { n: 3, dir: [0, -1, 0], speed: 0.6, scale: 0.7 }).burst(t0, 'note', 'guitar', GHEAD, { n: 1, speed: 1 });
      P.burst(2.85, 'sstar', 'handR', [-5.8, 8, 1], { n: 8, dir: [0, 1, 0], speed: 2 }).burst(2.85, 'cosmic', 'head', HEAD, { n: 10, speed: 1.4 });
    } },
    // signature: the rocket solo. It closes its eyes and shreds; the guitar smokes harder and harder, the head goes
    // back… and rockets scream out of the headstock and burst into silver stars. A spaced-out cackle.
    rocketsolo: { len: 4.0, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.3, E.back) * (1 - seg(t, 3.5, 3.95, E.inout)), shred = Math.abs(Math.sin(t * TAU * 5)) * on, heat = seg(t, 0.4, 2.0), aim = seg(t, 1.9, 2.15, E.back) * (1 - seg(t, 3.2, 3.6, E.inout)), cackle = bump(t, 2.8, 3.6);
      legs(P, R, { y: -0.8 * on, spread: 8 * on, roll: wave(t, 2) * 4 * on }); P.rot('torso', -8 * aim, 0, 0).rot('head', -20 * aim - 10 * cackle * Math.abs(Math.sin(t * 18)), 0, wave(t, 2) * 6 * on * (1 - aim));
      play(P, on, shred * (1 - aim)); P.rot('guitar', 50 * aim, 0, 60 * aim).pos('guitar', 0, 2 * aim, 1 * aim); beak(P, 0.15 + 0.5 * cackle * Math.abs(Math.sin(t * 20)));
      P.face('eyes', cackle > 0.3 ? 'happy' : aim > 0.3 ? 'wide' : 'closed'); P.blinkOK = false; thrust(P, t, false);
      P.stream('smoke', 'guitar', GHEAD, { rate: 2 + 18 * heat * (1 - aim * 0.5), dir: [0, 1, 0], speed: 0.6, spread: 0.5 });
      for (const t0 of [2.2, 2.4, 2.6]) P.burst(t0, 'fire', 'guitar', GHEAD, { n: 6, dir: [0, 1, 0], speed: 3, spread: 0.2 }).burst(t0 + 0.35, 'sstar', 'guitar', [-1, 30, 4.2], { n: 10, speed: 2.4 }).burst(t0 + 0.35, 'cosmic', 'guitar', [-1, 30, 4.2], { n: 8, speed: 1.8 });
      for (const t0 of [0.6, 1.0, 1.4]) P.burst(t0, 'note', 'guitar', GHEAD, { n: 1, speed: 1 });
    } },
    // something spooks it: it pulls everything into its shell, peeks out, and pops back with a shrug
    hide: { len: 3.0, next: 'idle', f(P, t) {
      const jump = bump(t, 0.05, 0.3), inK = seg(t, 0.25, 0.45, E.out) * (1 - seg(t, 2.1, 2.35, E.back)), peek = bump(t, 1.0, 1.9), shrug = bump(t, 2.35, 2.9);
      P.pos('root', 0, 1.2 * jump, 0); legs(P, R, { y: -2.6 * inK, spread: 10 * inK, fR: [0, 0.6 * inK], fL: [0, 0.6 * inK] });
      P.pos('head', 0, -2.6 * inK + 1.2 * peek, -2.4 * inK + 1.0 * peek).rot('head', 0, wave(t, 1.2) * 30 * peek, 0); arms(P, { out: 4 * inK + 50 * shrug, fwd: 30 * inK, bend: 90 * inK + 40 * shrug });
      beak(P, 0.4 * jump + 0.2 * shrug); P.rot('head', 0, 0, 12 * shrug);
      P.face('eyes', jump > 0.3 ? 'shock' : peek > 0.3 ? 'wide' : shrug > 0.3 ? 'happy' : inK > 0.5 ? 'closed' : 'sleepy'); P.blinkOK = false; thrust(P, t, false);
      glances(P, t, [[0, 0], [-0.4, 0], [0.4, 0], [0, 0]], 0.3);
      P.burst(0.08, 'sweat', 'head', [3, 23, 3], { n: 3, dir: [1, 1, 0], speed: 1 }).burst(2.4, 'cosmic', 'head', HEAD, { n: 5, speed: 1 });
    } },
  },
};
def.anim = anim;
// the ultra-drip form: chrome turns gold (a gold rocket shell), the suit gold, the snake black and gold;
// white paint and ice-blue eyes kept; the boosters burn blue
def.dripForm = kissForm({ keep: [C.eye, C.eyeLo, C.eyeHi, '#c8f4ff', '#7ac8f0', '#3a8ad8'] });
