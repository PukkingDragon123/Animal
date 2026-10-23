// Kissmet — stage 1 of the Kissmet line (Draco): a goth chimera cub, a KISS homage. A chubby
// charcoal lion cub with a huge teased black mane (violet tips), a white greasepaint face that
// can't pick a persona — a black star round one eye, a bat-wing flare round the other, whisker
// dots on the muzzle — and two little vampire fangs. Small black eagle wings sprout above a
// studded turtle shell on its back, and its tail is a banded snake that curls round its hip and
// has opinions of its own. Studded leather vest and belt, chrome platform boots for paws.
// Signature: it tries the fire-breathing trick… and the snake does it for it.
// Drip (one per tier): 1 spiked collar | studded wristbands · 2 star-pendant chain | spiked
// shoulder pads · 3 axe-head bass | spiked silver crown.
import { bounce } from '../anim.js';
import {
  K, B, both, at, fur, halo, chain, fill, isSide, shift, ramp, leather, chrome, spike, painted, shellP, bandsP, bootP, soleP, wingP, quillP, flat,
  tongueP, starP, inPoly, cobEyes, legs, arm, arms, emote, sharedClips, onBack, walkCycle, mouth, glances, kissForm, E, seg, bump, wob, wave, TAU,
} from './kiss_parts.js';

const C = {
  fur: '#4a4462', furHi: '#6c648c', furLo: '#2e2a3e', furLine: '#16121e', furTip: '#8a80b0', furLite: '#5a5274', bone: '#f0e4b4', boneLo: '#cab886', boneLine: '#6e5a3a',
  mane: '#1c1824', maneHi: '#3e3454', maneLo: '#0c0a12', maneLine: '#060408', maneTip: '#4c2c86',
  pad: '#b898b8', padLo: '#7a5a7a', nose: '#141016',
  shell: ['#62947a', '#3a624e', '#223c30', '#0c1812'],
  pants: ['#4e4a5c', '#24202e', '#16131c', '#0a090e'],
  eye: '#9a5aff', eyeLo: '#4a1e9a',
};
// ---------------------------------------------------------------- painters
const furP = (seed, o = {}) => fur(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furLine, tip: C.furTip, lite: C.furLite, s: 8, pt: 0.6, seed, ...o });
const headFur = furP(11), limbFur = furP(23, { s: 6, tipH: 2.5 });
const maneP = (seed, o = {}) => fur(C.mane, { hi: C.maneHi, lo: C.maneLo, line: C.maneLine, tip: C.maneTip, s: 7, tipH: 4, pt: 0.5, seed, ...o });
const maneHalo = halo(C.mane, { hi: C.maneHi, lo: C.maneLo, line: C.maneLine, tip: C.maneTip, n: 22, depth: 0.24, inner: 0.66, sq: 2.1, seed: 5 });
const vestP = leather({ studs: 4 });
const pantsP = leather({ cols: C.pants });
// the greasepaint face: a white oval, a black star round the right eye, a bat-wing flare round the left
const EYE = [2.15, 17.3];
const batPts = (ex, ey, s) => [[-1.5, -0.8], [-0.5, -1.7], [1.1, -1.6], [2.0, -0.6], [2.9, 1.5], [1.8, 1.0], [2.0, 2.6], [1.0, 1.6], [0.3, 2.8], [-0.3, 1.7], [-1.3, 2.0], [-1.7, 0.6]].map(([x, y]) => [ex + x * s, ey + y]);
const BAT = batPts(EYE[0], EYE[1], 1).map(([x, y]) => [EYE[0] + (x - EYE[0]) * 1.25, EYE[1] + (y - EYE[1]) * 1.15]);
const faceP = painted(headFur, { mask: { x: 0, y: 16.2, rx: 4.75, ry: 4.7, col: K.white, lo: K.whiteLo, line: K.whiteLine },
  marks: [{ star: [-EYE[0], EYE[1] + 0.1, 3.4, 0.52, 0], col: K.paint }, { fn: (X, Y) => (inPoly(BAT, X, Y) ? K.paint : null) }] });
const whiteP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? K.white : face === 'down' ? K.whiteLo : ramp([K.white, K.white, K.whiteLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
// the muzzle: white paint, whisker dots, a black lip line; its underside is the roof of the mouth with two fangs
const muzzleP = (p, w, h, face, cube) => {
  if (face === 'down') { fill(p, w, h, () => K.mouth); const a = Math.round(w * 0.24), b = Math.round(w * 0.76) - 1; for (const x of [a, b]) { p.px(x, 0, K.white).px(x, 1, K.white); } return; }
  painted(whiteP, { marks: [{ dots: [[-1.3, 13.3], [-1.9, 13.75], [-1.5, 14.2], [1.3, 13.3], [1.9, 13.75], [1.5, 14.2]], r: 0.2 }, { lines: [[-0.4, 12.75, 0.4, 12.75], [0, 12.75, 0, 13.6]], r: 0.16 }] })(p, w, h, face, cube);
  if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, h - 1, K.paint);
};
const jawP = (p, w, h, face) => { if (face === 'up') { fill(p, w, h, (x, y) => (y < 1 || x < 1 || x >= w - 1 ? '#5a1424' : K.mouth)); return; } whiteP(p, w, h, face); if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, 0, K.paint); };
const noseP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? '#3a3040' : y === 0 && x > 0 && x < w - 1 ? '#4a4050' : C.nose)); if (face === 'south' && w > 3) p.px(1, 0, '#8a8098'); };
const fangP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'down' ? K.whiteLo : y === h - 1 ? K.whiteLo : K.white));
// the torso: a studded leather vest open over a turtle's plastron — bone-white plates with dark seams
const torsoP = painted(vestP, { marks: [{ fn: (X, Y) => { const ax = Math.abs(X), v = (Y - 10.4) / 2.5, half = 2.7 * Math.sqrt(Math.max(0, 1 - v * v * v * v)); if (ax > half) return null; if (ax > half - 0.3) return C.boneLine; if (ax < 0.15 || Math.abs(Y - 9.6 - ax * 0.12) < 0.15 || Math.abs(Y - 11.2 + ax * 0.12) < 0.15) return C.boneLine; return ax > half - 0.7 || Y < 8.6 ? C.boneLo : C.bone; } }] });
// the belt: a studded band with a star buckle
const pelvisP = (p, w, h, face, cube) => {
  pantsP(p, w, h, face, cube);
  if (!isSide(face)) return;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [X, Y] = at(face, cube, x, y);
    if (Y > 7.1) p.px(x, y, Y > 7.95 ? '#3a3446' : (x % 3 === 1 && y % 2 === 1) ? K.silver[1] : '#1a1820');
    if (face === 'south' && Y > 6.9 && Math.abs(X) < 0.9 && Math.abs(Y - 7.55) < 0.75 && Math.abs(X) + Math.abs(Y - 7.55) * 0.9 < 0.95) p.px(x, y, K.silver[(x + y) % 2]);
  }
};
const pawP = (seed) => { const f = furP(seed, { s: 6, tipH: 2.5 }); return (p, w, h, face, cube) => { f(p, w, h, face, cube); if (face === 'down') fill(p, w, h, (x, y) => (x > 0 && x < w - 1 && y > 0 && y < h - 1 ? C.pad : null)); if (face === 'south') for (const fx of [0.33, 0.67]) { const x = Math.round(w * fx); for (let y = Math.floor(h * 0.45); y < h; y++) p.px(x, y, C.furLine); } }; };
const bootFront = painted(bootP(), { sym: true, marks: [{ star: [-2.3, 2.7, 0.78, 0.45, 0], col: K.silver[1], rim: K.silver[3] }] });
const sole = soleP();
const cuffTrim = chrome();
const shellBig = shellP({ cols: C.shell, stud: true, rim: 7.0 }), shellTop = shellP({ cols: C.shell, stud: true });
const wing = wingP({ c: '#2a2634', size: 5 }), quill = quillP({ c: '#2a2634' });
// the snake: coral bands (blood red, black, white), a pale belly; its head black with red eyes
const snakeP = (axis) => bandsP({ axis, per: 2.0, cols: [K.blood[1], K.paint, K.white, K.paint], belly: '#d8d0dc' });
const sheadP = (p, w, h, face, cube) => {
  fill(p, w, h, (x, y) => (face === 'up' ? '#2c2834' : face === 'down' ? '#d8d0dc' : ramp(['#3a3444', '#221e2a', '#141218'], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (face === 'up') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((x + y * 2) % 7 === 0) p.px(x, y, K.blood[2]);
  if (face === 'east' || face === 'west') for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [, Y, Z] = at(face, cube, x, y);
    if (Z < -14.3 && Z > -15.1 && Y > 6.2 && Y < 6.95) p.px(x, y, Math.abs(Z + 14.7) < 0.17 ? '#140808' : Y > 6.7 ? '#ff7a5a' : K.blood[1]);   // red eye, slit pupil
    if (y === h - 1) p.px(x, y, K.paint);
  }
};
const sjawP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? K.mouth : face === 'down' ? '#d8d0dc' : y === 0 ? K.paint : '#d8d0dc'));
// the forked tongue (plane, y): the stem at the mouth end (bottom rows), prongs at the tip (top rows)
const fork = (p, w, h) => { const m = Math.floor(w / 2); for (let y = 0; y < h; y++) { const v = 1 - y / (h - 1); if (v < 0.5) { p.px(m, y, K.tongue[1]); p.px(m - 1, y, K.tongue[2]); } else { const s = Math.round((v - 0.5) * 2 * (w / 2 - 1)); p.px(m - 1 - s, y, K.tongue[1]); p.px(m + s, y, K.tongue[1]); } } };
// ---- drip painters
const collarP = leather({ studs: 3 });
const strapP = (p, w, h) => fill(p, w, h, (x, y) => (y === 0 ? '#4a4458' : (x + y) % 4 === 0 ? K.silver[2] : '#1c1924'));
const SILVER = { hi: '#ffffff', base: '#c8ccd8', lo: '#8a90a4', deep: '#4a5064', spec: '#ffffff' };
// the axe-head bass: a black body shaped like an axe blade with a chrome edge
const axeBody = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? '#3a3444' : y === 0 ? '#4a4456' : '#16141c')); if (face === 'south') { const m = Math.floor(w / 2); for (let y = 2; y < h - 2; y++) for (const dx of [-1, 0, 1]) if (y % 3) p.px(m + dx, y, '#d8d8e0'); p.rect(m - 2, Math.floor(h * 0.3), 5, 1, K.silver[2]).rect(m - 2, Math.floor(h * 0.6), 5, 1, K.silver[2]); } };
const bladeP = (p, w, h) => { const pts = [[w, h * 0.12], [w * 0.35, 0], [0, h * 0.18], [w * 0.25, h * 0.5], [0, h * 0.82], [w * 0.35, h], [w, h * 0.88]]; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (!inPoly(pts, x + 0.5, y + 0.5)) continue; const edge = !inPoly(pts, x - 0.6, y + 0.5) || !inPoly(pts, x + 0.5, y - 0.6) || !inPoly(pts, x + 0.5, y + 1.6); p.px(x, y, edge ? K.silver[(x + y) % 2] : x > w * 0.7 ? '#24202c' : '#16141c'); } };
const neckP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'south' ? (y % 3 === 0 ? K.silver[2] : '#2a2018') : '#16141c'));
const headstockP = (p, w, h, face) => { fill(p, w, h, () => '#16141c'); if (face === 'south') for (let y = 1; y < h; y += 2) { p.px(0, y, K.silver[1]); p.px(w - 1, y, K.silver[1]); } };
const gemP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'south' && x === 0 && y === 0 ? '#ffd0d8' : face === 'up' ? K.blood[0] : K.blood[1]));
const plainSilver = chrome();

// ---------------------------------------------------------------- the model
const R = { hipX: 2.3, hipY: 6.2, ankleY: 2.6, L1: 1.9, L2: 1.8 };
// violet chimera eyes in the Cobblemon block language: a white block with a lash flick, a two-tone violet iris
// block on the inner side, a 2×2 pupil and a square glint; the black paint round it makes the edge
const EYE_MAPS = {
  open: ['.llllllll.', 'lwwwIIIIw.', 'wwwwhkkIw.', 'wwwwikkiw.', '.wwwiiiiw.', '..wwwwww..'],
  angry: ['ll........', 'wwlll.....', 'wwwwhll...', 'wwwwikkll.', '.wwwiiiiw.', '..wwwwww..'],
  sad: ['.......ll.', '.....llIw.', '..lllkkIw.', 'llwwikkiw.', '.wwwiiiiw.', '..wwwwww..'],
  happy: ['..........', '...llll...', '..llllll..', '.lll..lll.', '.ll....ll.', '..........'],
  closed: ['..........', '..........', '..........', 'lllllllll.', '.lllllll..', '..........'],
  shock: ['.llllllll.', 'lwwwwwwww.', 'wwwwwkwww.', 'wwwwwkwww.', '.wwwwwwww.', '..wwwwww..'],
  wide: ['.llllllll.', 'lwwwwwwww.', 'wwwwhIIww.', 'wwwwIkkww.', '.wwwwwwww.', '..wwwwww..'],
  smug: ['..........', '..........', '.llllllll.', 'wwwwikkiw.', '.wwwiiiiw.', '..wwwwww..'],
  sleepy: ['..........', '..........', '..........', 'lllllllll.', '.wwwiiiiw.', '..wwwwww..'],
  teary: ['.llllllll.', 'lwwwIIIIw.', 'wwwwhkkIw.', 'wwwwikkiw.', '.bbwiiiib.', '..bbbbbb..'],
};
const EYES = cobEyes({ at: [-EYE[0], EYE[1], 4.06], line: '#0c0814', pupilColor: '#08040e', iris: C.eye, irisDark: C.eyeLo, maps: EYE_MAPS });
const A = (id, c) => ({ ...c, id, hide: true });
const sp = (id, x, y, z, s, len, rot) => spike(x, y, z, s, len, { x: { pivot: [x, y, z], rot } }).map((c) => A(id, c));
const CHAIN = chain([[-3.0, 12.6, 2.4], [-2.7, 11.3, 3.2], [-1.5, 10.3, 3.2], [0, 10.0, 3.2], [1.5, 10.3, 3.2], [2.7, 11.3, 3.2], [3.0, 12.6, 2.4]], { len: 1.0, w: 0.7, t: 0.35, step: 0.75, gold: SILVER }).map((c) => A('acc-chain', c));
const RIGHT = [
  { name: 'thighR', parent: 'root', pivot: [-2.3, 6.2, 0], cubes: [B(-3.4, 4.2, -1.3, -1.2, 6.8, 1.3, pantsP)] },
  { name: 'shinR', parent: 'thighR', pivot: [-2.3, 4.3, 0], cubes: [B(-3.2, 2.6, -1.0, -1.4, 4.6, 1.0, pantsP)] },
  { name: 'footR', parent: 'shinR', pivot: [-2.3, 2.6, 0], cubes: [
    B(-3.8, 0, -2.0, -0.8, 1.5, 2.6, sole), B(-3.6, 1.5, -1.7, -1.0, 3.9, 2.4, bootFront), B(-3.7, 3.7, -1.5, -0.9, 4.2, 1.5, cuffTrim),
  ] },
  { name: 'armR', parent: 'torso', pivot: [-4.3, 11.8, 0.2], cubes: [
    B(-5.6, 9.4, -1.1, -3.6, 12.4, 1.3, limbFur),
    // dripped (or): spiked leather shoulder pads
    A('acc-pads', B(-6.4, 10.0, -1.6, -3.4, 11.8, 1.9, collarP)), ...sp('acc-pads', -6.3, 11.2, -0.6, 0.8, 1.7, [0, 0, 70]), ...sp('acc-pads', -6.3, 10.6, 1.0, 0.8, 1.7, [0, 0, 80]),
  ] },
  { name: 'foreR', parent: 'armR', pivot: [-4.6, 9.6, 0.2], cubes: [
    B(-5.5, 7.6, -1.0, -3.7, 9.8, 1.2, limbFur),
    // normal (or): studded wristbands
    A('acc-cuffs', B(-5.75, 7.7, -1.25, -3.45, 8.8, 1.45, collarP)), ...sp('acc-cuffs', -5.75, 8.25, 0.1, 0.55, 1.0, [0, 0, 90]),
  ] },
  { name: 'handR', parent: 'foreR', pivot: [-4.6, 7.6, 0.2], cubes: [B(-5.8, 6.0, -1.2, -3.4, 7.8, 1.5, pawP(51))] },
  // little black eagle wings above the shell, swept back and up
  { name: 'wingR', parent: 'torso', pivot: [-3.0, 12.2, -3.2], rot: [0, -16, -26], cubes: [
    B(-9.6, 9.6, -3.65, -2.8, 13.4, -2.85, wing), B(-7.8, 13.2, -3.55, -2.8, 14.2, -2.95, wing),
    B(-10.2, 7.0, -3.55, -9.0, 9.8, -2.95, quill), B(-8.9, 7.5, -3.55, -7.7, 9.8, -2.95, quill), B(-7.6, 8.0, -3.55, -6.4, 9.8, -2.95, quill), B(-6.3, 8.6, -3.55, -5.1, 9.8, -2.95, quill),
  ] },
];
export const def = {
  name: 'kissmet', ppu: 3, scale: 0.4, outline: { color: '#0c0810', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'pelvis', parent: 'root', pivot: [0, 6.2, 0], cubes: [B(-3.9, 5.0, -3.0, 3.9, 8.2, 3.0, pelvisP)] },
    { name: 'torso', parent: 'pelvis', pivot: [0, 8.0, 0], cubes: [
      B(-4.0, 7.8, -3.0, 4.0, 12.8, 3.0, torsoP),
      // normal: a spiked dog collar
      A('acc-collar', B(-3.3, 12.3, -2.7, 3.3, 13.3, 3.3, collarP)), ...[-1.8, 0, 1.8].flatMap((x) => sp('acc-collar', x, 12.8, 3.2, 0.7, 1.3, [90, 0, 0])),
      // dripped: a silver chain with a star pendant
      ...CHAIN, A('acc-chain', B(-1.35, 7.9, 3.45, 1.35, 10.2, 3.45, starP(K.silver[1], { line: K.silver[3], hi: '#ffffff' }), { plane: 'z' })),
      // ultra: the bass strap across the chest
      A('acc-axe', B(-4.6, 9.8, 3.02, 4.6, 10.5, 3.32, strapP, { pivot: [0, 10.15, 3.17], rot: [0, 0, -36] })),
    ] },
    // ultra dripped: an axe-head bass slung across the front
    { name: 'axe', parent: 'torso', pivot: [0.8, 7.2, 3.9], rot: [0, 0, 38], cubes: [
      A('acc-axe', B(-0.7, 4.6, 3.4, 2.3, 8.2, 4.4, axeBody)),
      A('acc-axe', B(2.3, 3.6, 3.9, 4.6, 9.2, 3.9, bladeP, { plane: 'z' })),
      A('acc-axe', B(0.45, 8.2, 3.65, 1.15, 14.2, 4.15, neckP)),
      A('acc-axe', B(0.2, 14.2, 3.6, 1.4, 15.6, 4.2, headstockP)),
    ] },
    { name: 'shell', parent: 'torso', pivot: [0, 10.0, -3.0], cubes: [
      B(-5.1, 6.2, -5.4, 5.1, 13.2, -2.8, shellBig), B(-3.8, 7.2, -6.2, 3.8, 12.2, -5.2, shellTop), B(-2.8, 8.2, -6.8, 2.8, 11.2, -6.2, shellTop),
    ] },
    // the snake tail: curls round the left hip and looks forward on its own
    { name: 'tail1', parent: 'pelvis', pivot: [0, 6.0, -2.8], rot: [0, -35, 0], cubes: [B(-0.85, 5.2, -6.6, 0.85, 6.9, -2.4, snakeP('z'))] },
    { name: 'tail2', parent: 'tail1', pivot: [0, 6.0, -6.2], rot: [0, -55, 0], cubes: [B(-0.8, 5.25, -9.2, 0.8, 6.85, -5.9, snakeP('z'))] },
    { name: 'tail3', parent: 'tail2', pivot: [0, 6.0, -8.8], rot: [24, -60, 0], cubes: [B(-0.75, 5.3, -12.0, 0.75, 6.8, -8.5, snakeP('z'))] },
    { name: 'snake', parent: 'tail3', pivot: [0, 6.0, -11.7], rot: [-20, 0, 0], cubes: [
      B(-1.1, 5.45, -14.9, 1.1, 7.05, -11.5, sheadP), B(-0.8, 5.5, -15.6, 0.8, 6.6, -14.8, sheadP),
      B(-0.62, 4.95, -15.45, -0.3, 5.5, -15.15, fangP), B(0.3, 4.95, -15.45, 0.62, 5.5, -15.15, fangP),
    ] },
    { name: 'sjaw', parent: 'snake', pivot: [0, 5.5, -12.2], cubes: [B(-0.9, 4.85, -15.3, 0.9, 5.5, -12.2, sjawP)] },
    { name: 'stongue', parent: 'sjaw', pivot: [0, 5.3, -15.2], cubes: [B(-0.7, 5.3, -17.6, 0.7, 5.3, -15.2, fork, { plane: 'y', outline: false })] },
    { name: 'head', parent: 'torso', pivot: [0, 12.4, 0.4], cubes: [
      B(-5.0, 12.2, -3.6, 5.0, 20.4, 4.0, headFur, { faces: { south: faceP } }),
      B(-2.5, 12.6, 4.0, 2.5, 14.6, 5.9, muzzleP),
      B(-0.95, 13.9, 5.7, 0.95, 14.85, 6.3, noseP),
      B(-1.65, 12.05, 5.45, -1.05, 12.65, 5.85, fangP), B(1.05, 12.05, 5.45, 1.65, 12.65, 5.85, fangP),
      // the mane: side panels framing the face, a ruff under the chin
      B(-6.6, 11.4, -3.6, -4.8, 20.2, 2.6, maneP(41)), B(4.8, 11.4, -3.6, 6.6, 20.2, 2.6, maneP(43), { mirror: true }),
      B(-4.2, 10.8, -1.2, 4.2, 12.4, 3.6, maneP(47)),
    ] },
    ...EYES.bones,
    { name: 'jaw', parent: 'head', pivot: [0, 12.6, 4.2], cubes: [B(-2.2, 11.5, 3.9, 2.2, 12.6, 5.4, jawP)] },
    { name: 'tongue', parent: 'jaw', pivot: [0, 12.5, 4.6], cubes: [B(-0.8, 12.25, 4.4, 0.8, 12.65, 7.7, tongueP())] },
    // the teased mane: back, crown and a big front pompadour, with a fuzzy halo behind; bounces on a spring
    { name: 'mane', parent: 'head', pivot: [0, 20.0, -1.0], cubes: [
      B(-6.0, 11.2, -5.0, 6.0, 20.8, -1.4, maneP(31)),
      B(-5.4, 20.0, -4.4, 5.4, 22.4, 2.8, maneP(37)),
      B(-4.6, 20.3, 2.4, 4.6, 22.0, 4.4, maneP(39)),
      B(-8.6, 9.4, -2.2, 8.6, 25.2, -2.2, maneHalo, { plane: 'z' }),
      B(0, 9.4, -6.8, 0, 25.2, 3.8, maneHalo, { plane: 'x' }),
      B(-3.6, 21.6, -1.6, -1.6, 24.6, 0.4, maneP(53), { pivot: [-2.6, 21.8, -0.6], rot: [-12, 0, 26] }),
      B(-1.0, 21.8, -1.2, 1.0, 25.4, 0.8, maneP(57), { pivot: [0, 22.0, -0.2], rot: [-16, 0, 0] }),
      B(1.6, 21.6, -1.6, 3.6, 24.6, 0.4, maneP(59), { pivot: [2.6, 21.8, -0.6], rot: [-12, 0, -26] }),
      // ultra (or): a spiked silver crown with a blood-red gem
      A('acc-crown', B(-4.9, 22.1, -3.8, 4.9, 23.0, 3.0, plainSilver)),
      ...[-3.6, -1.8, 0, 1.8, 3.6].flatMap((x, i) => sp('acc-crown', x, 23.0, 2.6, i === 2 ? 1.0 : 0.8, i === 2 ? 2.2 : 1.6, [-8, 0, -x * 4])),
      A('acc-crown', B(-0.55, 22.2, 2.95, 0.55, 22.95, 3.3, gemP)),
    ] },
    ...both(...RIGHT),
  ],
};
def.drip = [
  [{ id: 'acc-collar', name: 'Spiked collar' }, { id: 'acc-cuffs', name: 'Studded wristbands' }],
  [{ id: 'acc-chain', name: 'Star-pendant chain' }, { id: 'acc-pads', name: 'Spiked shoulder pads' }],
  [{ id: 'acc-axe', name: 'Axe-head bass' }, { id: 'acc-crown', name: 'Spiked silver crown' }],
];
def.attach = {
  head: { bone: 'mane', at: [0, 22.6, -0.6], size: 10 },
  face: { bone: 'head', at: [0, 17.2, 4.1], size: 10 },
  neck: { bone: 'torso', at: [0, 12.6, 3.0], size: 7 },
  back: { bone: 'shell', at: [0, 10.0, -6.8], size: 8 },
};

// ---------------------------------------------------------------- animation
const HEAD = [0, 24.8, 1], MOUTH = [0, 12.2, 6.6], SMOUTH = [0, 5.6, -16.0], SNAKE_EYE = [0, 7.4, -13.5];
const hiss = (P, k, flick = k) => P.rot('sjaw', -32 * k, 0, 0).scl('stongue', 1, 1, 0.05 + 0.95 * flick);
// the tail rears up behind and over the head (for the fire spit), 0..1
const rear = (P, k) => P.rot('tail1', 62 * k, 30 * k, 0).rot('tail2', -20 * k, 50 * k, 0).rot('tail3', 46 * k, 54 * k, 0).rot('snake', 34 * k, 0, 0);
const rockOn = (P, S, k) => arm(P, S, { out: 30 * k, fwd: 150 * k, bend: 20 * k, wrist: -30 * k });
const shared = sharedClips(R, {
  headTop: HEAD, weight: 0.15,
  // turtle trouble: stuck on its shell, legs paddling, spinning slowly
  downPose: (P, k, t, loop) => { onBack(P, R, k, t, { lift: 5.6, slide: 1 }); P.rot('root', 0, 0, 0).rot('pelvis', 0, (loop ? wave(t, 0.4) * 30 : 0) * k, 0); P.rot('wingR', 0, 0, 30 * k).rot('wingL', 0, 0, -30 * k).rot('tail1', 20 * k, 0, 0); },
  sleepPose: (P, br) => { legs(P, R, { y: -2.6 + br * 0.15, fR: [0, 1.2], fL: [0, 1.2], spread: 8 }); P.rot('torso', 10 + br * 1.5, 0, 0).rot('head', 22 + br * 3, 0, 10); arms(P, { out: 6, fwd: 26, bend: 50 }); P.rot('wingR', 0, 0, 14).rot('wingL', 0, 0, -14).rot('tail2', 0, -14, 0).rot('tail3', 10, -20, 0).rot('snake', 30, 0, 0); },
});
const MOUTHS = { hurt: [0.7, 0.2], faint: [0.5, 1], down: [0.5, 1], sleep: [0.12, 0.25] };
for (const [k, c] of Object.entries(shared)) { const f0 = c.f; c.f = (P, t, cx) => { f0(P, t, cx); mouth(P, MOUTHS[k][0], MOUTHS[k][1]); if (k !== 'sleep') hiss(P, k === 'hurt' ? bump(t, 0, 0.5) : 0.6, 0.4); }; }
export const anim = {
  start: 'idle', seed: 21,
  breathe: { bone: 'torso', amp: 0.02, per: 2.0 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.0, 4.4], dur: 0.11 },
  look: { bone: 'head', yaw: 30, pitch: 12, speed: 6 },
  springs: [
    { bone: 'mane', tip: [0, 3, 0], k: 190, d: 10, gain: 0.7, max: 12, axes: [1, 0.3, 1] },
    { bone: 'tail2', tip: [0, 0, -3], k: 150, d: 8, gain: 0.8, max: 14 },
    { bone: 'tail3', tip: [0, 0, -3], k: 130, d: 7, gain: 0.9, max: 16 },
    { bone: 'snake', tip: [0, 0, -3], k: 160, d: 8, gain: 0.7, max: 14 },
    { bone: 'wingR', tip: [-4, 0, 0], k: 220, d: 11, gain: 0.4, max: 12, axes: [1, 0.4, 1] },
    { bone: 'wingL', tip: [4, 0, 0], k: 220, d: 11, gain: 0.4, max: 12, axes: [1, 0.4, 1] },
    { bone: 'tongue', tip: [0, 0, 2.5], k: 110, d: 6, gain: 1.2, max: 30 },
    { bone: 'axe', tip: [0, 6, 0], k: 260, d: 12, gain: 0.35, max: 8 },
  ],
  faces: { eyes: EYES.slot },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'firetrick', 'firetrick', 'tailtiff'] },
  clips: {
    ...shared,
    // bopping in its platform boots, the snake looking around on its own, a cheeky tongue every other bar
    idle: { len: 2.0, loop: true, f(P, t, c) {
      const b = bounce(t, 0.5, { squash: 0.06, stretch: 0.03 }), sway = Math.sin(t * TAU * 0.5), m = c.loopN % 4, blep = m % 2 ? bump(t, 0.85, 1.75) : 0;
      legs(P, R, { y: -0.3 + b.u * 0.45, roll: sway * 2.5 });
      P.sq('torso', b.sq).rot('head', 4 - b.u * 5, sway * 7, -sway * 4 + 6 * blep);
      arms(P, { out: 8 + b.u * 5, fwd: 4, bend: 24 + b.u * 8 });
      P.rot('tail1', 0, sway * 8, 0).rot('tail2', 0, wave(t, 0.5, 1) * 10, 0).rot('snake', wave(t, 0.5, 2) * 10, wave(t, 0.5, 2.5) * 24, 0);
      P.rot('wingR', 0, 0, -wave(t, 2) * 4).rot('wingL', 0, 0, wave(t, 2) * 4);
      mouth(P, 0.08 + 0.2 * blep, blep); hiss(P, m === 2 ? bump(t, 1.3, 1.55) : 0);
      glances(P, t, [[0, 0], [-0.35, 0.05], [0.3, 0], [0, 0.1]], 0.5);
      P.face('eyes', blep > 0.5 ? 'smug' : undefined);
    } },
    // a stompy strut in its platform boots
    walk: { len: 0.6, loop: true, f(P, t) {
      const w = walkCycle(P, R, t, { len: 0.6, stride: 1.4, lift: 1.2, bob: 0.6, sway: 5, swing: 26, twist: 6, crouch: 0.4, lean: 4, out: 10, bend: 22, heavy: 1 });
      P.rot('head', -4 + Math.sin(w.ph * 2 - 0.6) * 4, -w.s * 4, 0).rot('tail1', 0, w.s * 12, 0).rot('snake', 0, -w.s * 14, 0);
      P.rot('wingR', 0, 0, -6 * Math.abs(w.c)).rot('wingL', 0, 0, 6 * Math.abs(w.c));
      mouth(P, 0.1, 0); hiss(P, 0);
      P.burst(0.02, 'dust', 'root', [-2.3, 0.3, 0], { n: 2, speed: 0.4 }).burst(0.32, 'dust', 'root', [2.3, 0.3, 0], { n: 2, speed: 0.4 });
    } },
    // battle cry: a crouch, then all four voices at once — the cub roars, the wings flare, the snake rears and hisses
    cry: { len: 2.0, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.42, E.out)), up = seg(t, 0.34, 0.5, E.back) * (1 - seg(t, 1.5, 1.85, E.inout));
      legs(P, R, { y: -1.6 * crouch + 0.5 * up + wob(t, 1.85, 0.4, 3, 6), pitch: -10 * up, spread: 6 * up });
      P.sq('torso', -0.12 * crouch + 0.06 * up).rot('head', 14 * crouch - 26 * up + wave(t, 12) * 3 * up, 0, wave(t, 7) * 4 * up);
      arms(P, { out: 20 * crouch + 70 * up, fwd: 20 * up, bend: 30 + 20 * crouch });
      P.rot('wingR', 0, -20 * up, -40 * up + wave(t, 9) * 8 * up).rot('wingL', 0, 20 * up, 40 * up - wave(t, 9) * 8 * up);
      P.rot('tail1', 30 * up, 0, 0).rot('tail3', 20 * up, 0, 0).rot('snake', 30 * up, 0, 0); hiss(P, up, up * (0.5 + 0.5 * Math.abs(wave(t, 8))));
      mouth(P, 0.1 + 0.9 * up, 0.8 * up);
      emote(P, crouch > 0.3 ? 'angry' : up > 0.3 ? 'shut' : 'open'); P.blinkOK = false;
      if (up > 0.5) P.stream('soundring', 'head', MOUTH, { rate: 6, dir: [0, 0.2, 1], tint: [0.8, 0.6, 1] });
      P.burst(0.5, 'ring', 'root', [0, 1, 0], {}).burst(0.52, 'kstar', 'head', HEAD, { n: 6, speed: 1.4 }).burst(0.6, 'bat', 'head', HEAD, { n: 4 }).burst(1.5, 'sweat', 'head', [5, 21, 3], {});
    } },
    // Deuce: right paw, left paw — a two-swipe lunge
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const back = seg(t, 0, 0.2, E.out) * (1 - seg(t, 0.22, 0.3, E.in)), s1 = bump(t, 0.24, 0.46), s2 = bump(t, 0.42, 0.66), go = seg(t, 0.22, 0.34, E.out) * (1 - seg(t, 0.66, 0.98, E.inout));
      legs(P, R, { y: -1.0 * back - 0.6 * go, z: -0.8 * back + 0.8 * go, pitch: -10 * back + 16 * go, fR: [0, 1.2 * go], fL: [0, -0.6 * go] });
      P.pos('root', 0, 0.8 * bump(t, 0.22, 0.4), 3 * go - 1 * back).rot('torso', 0, 24 * s1 - 24 * s2, 0).rot('head', -10 * back + 10 * go, -10 * s1 + 10 * s2, 0);
      arm(P, 'R', { out: 40 * back + 20 * s1, fwd: -20 * back + 110 * s1, bend: 60 - 40 * s1 }); arm(P, 'L', { out: 40 * back + 20 * s2, fwd: -20 * back + 110 * s2, bend: 60 - 40 * s2 });
      mouth(P, 0.3 + 0.5 * Math.max(s1, s2), 0); hiss(P, go);
      emote(P, back > 0.2 || go > 0.2 ? 'angry' : 'open'); P.blinkOK = false;
      P.burst(0.34, 'spark', 'handR', [-4.6, 6.6, 2], { n: 2 }).burst(0.55, 'spark', 'handL', [4.6, 6.6, 2], { n: 2 }).burst(0.55, 'star', 'head', [0, 14, 8], { n: 3 });
    } },
    // Firehouse: points, the snake rears up over its head and spits a jet of fire
    special: { len: 2.2, next: 'idle', f(P, t) {
      const k = seg(t, 0.05, 0.45, E.back) * (1 - seg(t, 1.75, 2.1, E.inout)), spit = seg(t, 0.62, 0.7, E.out) * (1 - seg(t, 1.45, 1.6)), recoil = bump(t, 0.6, 0.85);
      rear(P, k); P.rot('snake', -12 * recoil, 0, 0); hiss(P, Math.max(0.3 * k, spit), spit);
      legs(P, R, { y: -0.8 * k, pitch: 6 * k, spread: 6 * k });
      arm(P, 'R', { out: 20 * k, fwd: 90 * k, bend: 10 }); arm(P, 'L', { out: 30 * k, fwd: 10, bend: 40 });
      P.rot('head', -6 * k, 0, 0).rot('wingR', 0, 0, -20 * spit).rot('wingL', 0, 0, 20 * spit);
      mouth(P, 0.2 + 0.3 * spit, 0);
      emote(P, t < 0.6 ? 'angry' : spit > 0.3 ? 'wide' : t > 1.6 ? 'happy' : 'open'); P.blinkOK = false;
      if (spit > 0.5) P.stream('breath', 'snake', SMOUTH, { rate: 110, dir: [0, -0.15, -1], spread: 0.18 });
      P.burst(0.64, 'fire', 'snake', SMOUTH, { n: 8, dir: [0, 0, -1], speed: 1.2 }).burst(1.55, 'smoke', 'snake', SMOUTH, { n: 5, dir: [0, 1, 0], speed: 0.6 });
    } },
    // victory: a spinning hop, a stomp landing, wings wide, tongue out and a paw thrown up for the horns
    win: { len: 2.4, next: 'idle', f(P, t) {
      const air = Math.max(0, Math.sin(seg(t, 0.12, 0.6, E.lin) * Math.PI)), crouch = bump(t, 0, 0.14) + bump(t, 0.58, 0.8), pose = seg(t, 0.7, 0.9, E.back) * (1 - seg(t, 2.05, 2.35, E.inout));
      legs(P, R, { y: -1.4 * crouch - 0.4 * pose, spread: 10 * pose, roll: -4 * pose });
      P.pos('root', 0, 4 * air, 0).rot('root', 0, 360 * seg(t, 0.14, 0.58, E.inout), 0).sq('torso', -0.12 * crouch + 0.08 * air);
      rockOn(P, 'R', pose); arm(P, 'L', { out: 40 * pose + 60 * air, bend: 30 });
      P.rot('head', -12 * pose, 0, -10 * pose).rot('wingR', 0, -20 * pose, -40 * pose).rot('wingL', 0, 20 * pose, 40 * pose).rot('snake', 20 * pose, 0, 0);
      mouth(P, 0.3 * air + 0.45 * pose, pose); hiss(P, pose * 0.6, pose);
      emote(P, air > 0.3 ? 'happy' : pose > 0.3 ? 'smug' : 'open'); P.blinkOK = false;
      P.burst(0.62, 'dust', 'root', [0, 0.5, 0], { n: 10, spread: 1, speed: 1.2 }).burst(0.75, 'kstar', 'head', HEAD, { n: 8, speed: 1.6 }).burst(0.8, 'sparkle', 'head', HEAD, { n: 8 }).burst(0.8, 'confetti', 'head', HEAD, { n: 16, speed: 1.4 });
    } },
    // the stage sway: a band-in-a-row lean left and right on the beat, platform stomps, an air-bass strum,
    // tongue flicks — then a spin and a split-legged finish with both paws up
    dance: { len: 2.8, next: 'idle', f(P, t) {
      const bt = t * 2, n = Math.floor(bt), ph = bt - n, hit = Math.sin(Math.min(1, ph * 1.8) * Math.PI), side = n % 2 ? 1 : -1, on = seg(t, 0, 0.15) * (1 - seg(t, 1.9, 2.0));
      const spin = seg(t, 1.95, 2.3, E.inout), fin = seg(t, 2.25, 2.4, E.back) * (1 - seg(t, 2.6, 2.8));
      legs(P, R, { y: -0.8 * hit * on - 0.6 * fin, roll: side * 7 * on, pitch: 4 * on, spread: 12 * fin, ['f' + (side > 0 ? 'L' : 'R')]: [1.2 * hit * on, 0] });
      P.rot('torso', 0, side * 14 * on, side * 6 * on).rot('head', -4 * hit * on, -side * 10 * on, -side * 8 * on).rot('root', 0, 360 * spin, 0).pos('root', 0, 2.2 * bump(t, 1.95, 2.3), 0);
      arm(P, 'R', { out: 20 * on + 70 * fin, fwd: 40 * on, bend: 70 * on - 50 * hit * on + 20 * fin }); arm(P, 'L', { out: 30 * on + 70 * fin, fwd: 50 * on, bend: 30 * on, twist: 20 * on });
      P.rot('wingR', 0, 0, -20 * hit * on - 40 * fin).rot('wingL', 0, 0, 20 * hit * on + 40 * fin).rot('tail1', 0, -side * 16 * on, 0).rot('snake', 0, side * 20 * on, 0);
      mouth(P, 0.2 + 0.3 * hit * on + 0.4 * fin, (n % 2 ? hit : 0) * on + fin); hiss(P, fin, fin);
      emote(P, fin > 0.3 ? 'smug' : on > 0.5 ? 'happy' : 'open'); P.blinkOK = false;
      for (const t0 of [0.02, 0.52, 1.02, 1.52]) P.burst(t0, 'dust', 'root', [side * 2.3, 0.3, 0], { n: 2, speed: 0.6 }).burst(t0 + 0.05, t0 % 1 ? 'note' : 'goldnote', 'head', [3, 23, 2], { n: 1, dir: [0.4, 1, 0.2], speed: 0.9 });
      P.burst(2.3, 'kstar', 'head', HEAD, { n: 8, speed: 1.5 }).burst(2.3, 'sparkle', 'head', HEAD, { n: 10, speed: 1.2 });
    } },
    // signature: the fire-breathing trick. A big breath, cheeks puffed… a sad little puff of smoke. The snake
    // rears up behind and does it properly — right over its head. Singed mane, a beat of shock, then the horns.
    firetrick: { len: 3.8, next: 'idle', f(P, t) {
      const puff = seg(t, 0.1, 0.55, E.inout) * (1 - seg(t, 0.62, 0.72)), fizzle = bump(t, 0.62, 1.3), rk = seg(t, 1.3, 1.6, E.back) * (1 - seg(t, 2.5, 2.8, E.inout));
      const jet = seg(t, 1.65, 1.72) * (1 - seg(t, 2.25, 2.35)), shock = seg(t, 2.25, 2.35, E.out) * (1 - seg(t, 2.9, 3.05)), horns = seg(t, 3.0, 3.2, E.back) * (1 - seg(t, 3.55, 3.8, E.inout));
      legs(P, R, { y: -0.6 * puff - 0.9 * shock - 0.3 * horns, pitch: -6 * puff + 8 * fizzle, spread: 8 * horns });
      P.scl('torso', 1 + 0.1 * puff, 1 + 0.04 * puff, 1 + 0.1 * puff).scl('head', 1 + 0.08 * puff, 1, 1 + 0.06 * puff);
      P.rot('head', -18 * puff + 10 * fizzle - 8 * shock, 0, 6 * fizzle).pos('head', 0, -0.8 * shock, 0);
      arms(P, { out: 20 * puff + 50 * shock, fwd: 10, bend: 40 + 40 * fizzle });
      rockOn(P, 'R', horns); arm(P, 'L', { out: 30 * horns, bend: 20 });
      // the snake: rears over the head, spits, then pats the cub with its chin
      rear(P, rk); P.rot('snake', -14 * bump(t, 1.62, 1.85) + 10 * bump(t, 3.1, 3.5), 0, 0); hiss(P, Math.max(0.2 * rk, jet), jet);
      if (jet > 0.5) P.stream('breath', 'snake', SMOUTH, { rate: 120, dir: [0, -0.1, -1], spread: 0.2 });
      P.burst(1.66, 'fire', 'snake', SMOUTH, { n: 8, dir: [0, 0, -1], speed: 1.4 });
      // the mane gets singed
      P.burst(2.3, 'soot', 'head', [0, 23, 0], { n: 8, dir: [0, 1, 0], speed: 0.8 }).burst(2.3, 'ember', 'head', [0, 23, 0], { n: 12, spread: 1 }).burst(2.4, 'sweat', 'head', [5, 21, 3], { n: 2, dir: [1, 1, 0], speed: 1 });
      if (shock > 0.3) P.stream('smoke', 'head', [0, 23.5, 0], { rate: 6, dir: [0, 1, 0], speed: 0.4 });
      P.burst(0.7, 'smoke', 'head', MOUTH, { n: 2, dir: [0, 0.6, 1], speed: 0.3, scale: 0.5 });
      mouth(P, puff > 0.3 ? 0 : fizzle > 0.3 ? 0.25 : shock > 0.3 ? 0.7 : 0.3 * horns, horns);
      emote(P, puff > 0.3 ? 'closed' : fizzle > 0.3 ? 'sad' : jet > 0.3 ? 'wide' : shock > 0.3 ? 'x' : horns > 0.3 ? 'smug' : 'open'); P.blinkOK = false;
      P.burst(3.1, 'kstar', 'head', HEAD, { n: 5, speed: 1.2 });
    } },
    // the snake sneaks round and hisses in its face; the cub jumps out of its boots… then they headbang together
    tailtiff: { len: 3.0, next: 'idle', f(P, t) {
      const sneak = seg(t, 0.05, 0.6, E.inout) * (1 - seg(t, 2.6, 2.95, E.inout)), hs = bump(t, 0.6, 1.0), jump = bump(t, 0.68, 1.05), bang = seg(t, 1.3, 1.45) * (1 - seg(t, 2.5, 2.7)), nod = Math.max(0, Math.sin(t * TAU * 3)) * bang;
      P.rot('tail1', 20 * sneak, 20 * sneak, 0).rot('tail2', 0, 30 * sneak, 0).rot('tail3', 50 * sneak, 10 * sneak, 0).rot('snake', 10 * sneak + 30 * nod, -30 * sneak, 0); hiss(P, hs + 0.3 * nod, hs);
      legs(P, R, { y: -0.4 - 0.6 * nod }); P.pos('root', 0, 2.4 * jump, -0.6 * jump);
      P.rot('head', 28 * nod - 8 * jump, 20 * sneak * (1 - bang) - 20 * hs, 0).rot('torso', 6 * nod, 0, 0);
      arms(P, { out: 60 * jump + 20 * bang, fwd: 20 * jump + 30 * bang, bend: 40 + 40 * bang });
      P.rot('wingR', 0, 0, -50 * jump).rot('wingL', 0, 0, 50 * jump);
      mouth(P, 0.6 * jump + 0.3 * nod, 0.6 * bang);
      emote(P, jump > 0.2 ? 'shock' : bang > 0.3 ? 'shut' : sneak > 0.6 ? 'sleepy' : 'open'); P.blinkOK = false;
      P.burst(0.72, 'sweat', 'head', [5, 21, 3], { n: 3, dir: [1, 1, 0], speed: 1.2 }).burst(0.7, 'anger', 'head', [-5, 23, 2], {});
      for (const t0 of [1.42, 1.75, 2.08, 2.41]) P.burst(t0, 'note', 'head', [0, 24, 2], { n: 1, speed: 1, spread: 0.8 });
    } },
  },
};
def.anim = anim;
// the ultra-drip form: black lacquer fur, a gold shell, gold studs and chrome; white paint and violet eyes kept
def.dripForm = kissForm({ keep: [C.eye, C.eyeLo], swap: { [C.furTip]: '#ffd84a', [C.maneTip]: '#e0a030', [C.furHi]: '#5a4a3a' } });
