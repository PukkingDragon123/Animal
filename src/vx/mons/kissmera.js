// Kissmera — stage 2 of the Kissmet line (Draco/Ecto): the full goth chimera, a KISS homage. A
// four-legged black-maned lion under a studded turtle shell with a ridge of chrome spikes; great
// black eagle wings rise from its shoulders, its forelegs end in griffin talons tipped in silver,
// its hind paws stomp in chrome platform boots, and its tail is a banded cobra that rears high over
// the shell with a hood of its own. The white greasepaint face keeps the cub's mash-up — a black
// star round one eye, a bat-wing flare round the other — but its eyes now burn red.
// Signature: the tongue war — the lion and the snake out-tongue each other.
// Drip (one per tier): 1 spiked leg cuffs | silver nose ring · 2 draped silver chains | spiked
// pauldrons · 3 star-body guitar on the shell | twin crowns (the lion's and the snake's).
import {
  K, CH, B, both, at, fill, isSide, shift, ramp, leather, chrome, spike, spikeP, painted, shellP, bootP, soleP, wingP, quillP, tongueP, forkP, starP, inPoly, scalesP,
  chimFur, chimMane, chimHalo, snakeBands, snakeHead, hoodP, chain, cobEyes, mouth, glances, kissForm, feathers, E, seg, bump, wob, wave, TAU,
} from './kiss_parts.js';

const C = { eye: '#e8283a', eyeLo: '#7a0a1c', eyeHi: '#ff8a5a', chest: '#d8d4e4', talon: K.silver };
// ---------------------------------------------------------------- painters
const bodyFur = chimFur(13, { s: 10 }), headFur = chimFur(11), legFur = chimFur(23, { s: 7, tipH: 3 });
const bodyP = (p, w, h, face, cube) => { bodyFur(p, w, h, face, cube); if (face === 'down') fill(p, w, h, (x, y) => ((x + y) % 4 ? '#5e5876' : '#4e4864')); };
const maneP = (seed, o) => chimMane(seed, o), maneHalo = chimHalo({ n: 26, depth: 0.22, inner: 0.62 }), maneHaloX = chimHalo({ n: 20, depth: 0.2, inner: 0.6, seed: 9 });
// the face: white paint, a black star round the right eye, a bat-wing flare round the left
const EYE = [2.3, 19.8];
const BAT = [[-1.5, -0.8], [-0.5, -1.7], [1.1, -1.6], [2.0, -0.6], [2.9, 1.5], [1.8, 1.0], [2.0, 2.6], [1.0, 1.6], [0.3, 2.8], [-0.3, 1.7], [-1.3, 2.0], [-1.7, 0.6]].map(([x, y]) => [EYE[0] + x * 1.3, EYE[1] + y * 1.15]);
const faceP = painted(headFur, { mask: { x: 0, y: 18.5, rx: 4.85, ry: 4.9, col: K.white, lo: K.whiteLo, line: K.whiteLine },
  marks: [{ star: [-EYE[0], EYE[1] + 0.1, 3.6, 0.5, 0], col: K.paint }, { fn: (X, Y) => (inPoly(BAT, X, Y) ? K.paint : null) }] });
const whiteP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? K.white : face === 'down' ? K.whiteLo : ramp([K.white, K.white, K.whiteLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
const muzzleP = (p, w, h, face, cube) => {
  if (face === 'down') { fill(p, w, h, () => K.mouth); for (const x of [Math.round(w * 0.22), Math.round(w * 0.78) - 1]) p.px(x, 0, K.white).px(x, 1, K.white); return; }
  painted(whiteP, { marks: [{ dots: [[-1.4, 14.9], [-2.1, 15.4], [-1.6, 15.9], [1.4, 14.9], [2.1, 15.4], [1.6, 15.9]], r: 0.22 }, { lines: [[-0.5, 14.35, 0.5, 14.35], [0, 14.35, 0, 15.3]], r: 0.17 }] })(p, w, h, face, cube);
  if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, h - 1, K.paint);
};
const jawP = (p, w, h, face) => { if (face === 'up') { fill(p, w, h, (x, y) => (y < 1 || x < 1 || x >= w - 1 ? '#5a1424' : K.mouth)); return; } whiteP(p, w, h, face); if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, 0, K.paint); };
const noseP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? '#3a3040' : y === 0 && x > 0 && x < w - 1 ? '#4a4050' : '#141016')); if (face === 'south' && w > 3) p.px(1, 0, '#8a8098'); };
const fangP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'down' || y === h - 1 ? K.whiteLo : K.white));
// the eagle's chest: pale silver feathers; the griffin forelegs: black feather trousers, scaly shins, silver talons
const chestP = feathers(C.chest, { size: 5, top: '#f4f2fa', bottom: '#9a96ac' });
const trouserP = wingP({ c: '#2a2634', size: 5, from: 0.7 });
const scaleP = scalesP(CH.scale, { size: 3, top: CH.scaleHi, bottom: CH.scaleLo });
const talonP = spikeP({ down: true });
const strapP = leather({ studs: 4 });
const pantsP = leather({ cols: CH.pants });
const bootStar = painted(bootP(), { sym: true, marks: [{ star: [-3.8, 3.2, 1.0, 0.45, 0], col: K.silver[1], rim: K.silver[3] }] });
const sole = soleP(), trim = chrome();
const SHELL_COLS = ['#7cb08c', '#4c7c60', '#2c4c3a', '#101e16'];
const shellBig = shellP({ cols: SHELL_COLS, stud: true, rim: 14.6, size: 3.0 }), shellTop = shellP({ cols: SHELL_COLS, stud: true, size: 3.0 });
const wing = wingP({ c: '#2a2634', size: 6 }), quill = quillP({ c: '#2a2634' });
const tailP = snakeBands('y', { per: 2.4 });
const sheadP = snakeHead({ lip: true, eye: (X, Y, Z) => (Z > -8.2 && Z < -6.9 && Y > 30.9 && Y < 32.0 ? (Math.abs(Z + 7.55) < 0.2 ? 'k' : Y > 31.7 ? 'h' : 'i') : null) });
const sjawP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? K.mouth : face === 'down' ? CH.snakeBelly : y === 0 ? K.paint : CH.snakeBelly));
const hood = hoodP();
// drip painters
const SILVER = { hi: '#ffffff', base: '#c8ccd8', lo: '#8a90a4', deep: '#4a5064', spec: '#ffffff' };
const gemP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'south' && x === 0 && y === 0 ? '#ffd0d8' : face === 'up' ? K.blood[0] : K.blood[1]));
const guitarStar = starP(K.silver[1], { line: K.silver[3], ri: 0.46, hi: '#ffffff' });
const fretP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'south' || face === 'east' ? (y % 3 === 0 ? K.silver[2] : '#2a2018') : '#16141c'));
const headstockP = (p, w, h, face) => { fill(p, w, h, () => '#16141c'); if (isSide(face)) for (let y = 1; y < h; y += 2) { p.px(0, y, K.silver[1]); p.px(w - 1, y, K.silver[1]); } };

// ---------------------------------------------------------------- the model
// fierce red eyes in the Cobblemon block language: no whites, a sharp slanted block with a lash flick, two flat
// reds (dark on top), a slit pupil and a pair of square glints; the black paint round it makes the edge
const EYE_MAPS = {
  open: ['ll..........', '.lllllll....', '..IIIIIIlll.', '..ihhIIkIIl.', '..iiiiikiii.', '...ciikkcc..', '....ccccc...'],
  angry: ['l...........', 'lll.........', '.IIlll......', '..ihhIlll...', '..iiiiikllll', '...iiiikii..', '....iiiii...'],
  sad: ['............', '......llll..', '...llllIIl..', '.lllhhIkIIl.', '..iiiiikiii.', '...iiiikii..', '....iiiii...'],
  happy: ['............', '....llll....', '...llllll...', '..lll..lll..', '.lll....lll.', '.ll......ll.', '............'],
  closed: ['............', '............', 'l...........', '.llllllllll.', '..llllllll..', '............', '............'],
  shock: ['.lllllll....', '..iiiiiilll.', '..iiiiiiiil.', '..iiihkiiii.', '..iiiiiiiii.', '...iiiiiii..', '....iiiii...'],
  wide: ['.lllllll....', '..IIIIIIlll.', '..iiihkiiil.', '..iiiikiiii.', '..iiiiiiiii.', '...iiiiiii..', '....iiiii...'],
  smug: ['............', '............', '............', '..lllllllll.', '..iiiiikiii.', '...iiiikii..', '....iiiii...'],
  sleepy: ['............', '............', '............', '............', '..lllllllll.', '...iiiikii..', '....iiiii...'],
  teary: ['ll..........', '.lllllll....', '..IIIIIIlll.', '..ihhIIkIIl.', '..iiiiikiii.', '...bbiibb...', '....bbbbb...'],
};
const EYES = cobEyes({ at: [-EYE[0], EYE[1], 13.06], line: '#0c0610', pupilColor: '#120206', iris: C.eye, irisDark: C.eyeLo, accent: C.eyeHi, maps: EYE_MAPS });
const A = (id, c) => ({ ...c, id, hide: true });
const sp = (id, x, y, z, s, len, rot) => spike(x, y, z, s, len, { x: { pivot: [x, y, z], rot } }).map((c) => A(id, c));
const swag = (s) => chain([[6.5 * s, 17.6, -8.6], [6.75 * s, 15.0, -5.4], [6.75 * s, 14.4, -2.4], [6.75 * s, 15.0, 0.6], [6.5 * s, 17.6, 3.8]], { len: 1.1, w: 0.8, t: 0.35, step: 0.85, gold: SILVER }).map((c) => A('acc-chains', c));
const RIGHT = [
  // griffin forelegs
  { name: 'legFR', parent: 'body', pivot: [-3.4, 11.2, 5.4], cubes: [
    B(-5.2, 5.0, 3.6, -1.6, 12.4, 7.2, trouserP),
    // dripped (or): spiked pauldrons
    A('acc-pads', B(-5.9, 10.2, 3.0, -1.2, 12.6, 7.8, strapP)), ...sp('acc-pads', -5.9, 11.8, 4.6, 1.0, 2.2, [0, 0, 60]), ...sp('acc-pads', -5.9, 11.0, 6.4, 0.9, 1.9, [0, 0, 75]),
  ] },
  { name: 'pawFR', parent: 'legFR', pivot: [-3.4, 5.2, 5.4], cubes: [
    B(-4.4, 1.4, 4.5, -2.4, 5.6, 6.3, scaleP), B(-4.9, 0, 3.9, -1.9, 1.5, 7.2, scaleP),
    ...[-4.8, -3.75, -2.7].map((x) => B(x, 0, 7.0, x + 0.75, 1.1, 8.5, talonP, { pivot: [x + 0.37, 0.6, 7.0], rot: [16, 0, 0] })), B(-3.75, 0, 3.0, -3.0, 0.9, 4.0, talonP),
    // normal: spiked leg cuffs
    A('acc-cuffs', B(-4.75, 3.6, 4.15, -2.05, 4.9, 6.65, strapP)), ...sp('acc-cuffs', -4.75, 4.25, 5.4, 0.7, 1.4, [0, 0, 90]),
  ] },
  // lion haunches in platform boots
  { name: 'legBR', parent: 'body', pivot: [-3.8, 12.0, -6.4], cubes: [B(-6.0, 5.4, -9.2, -1.6, 13.4, -3.6, legFur)] },
  { name: 'pawBR', parent: 'legBR', pivot: [-3.8, 5.6, -6.2], cubes: [
    B(-5.0, 3.6, -7.4, -2.6, 6.6, -5.0, pantsP), B(-5.5, 0, -8.4, -2.1, 1.8, -3.6, sole), B(-5.3, 1.8, -8.0, -2.3, 4.6, -4.0, bootStar), B(-5.4, 4.4, -7.8, -2.2, 4.9, -4.2, trim),
  ] },
  // great black eagle wings
  { name: 'wingR', parent: 'body', pivot: [-4.4, 18.0, 4.0], rot: [-8, -22, -58], cubes: [
    B(-12.4, 16.2, 3.4, -4.2, 18.6, 4.6, wing), B(-15.8, 11.4, 3.5, -5.0, 16.6, 4.5, wing),
    ...[-17.4, -15.6, -13.8, -12.0].map((x, i) => B(x, 7.4 + i * 0.7, 3.55, x + 1.7, 11.8, 4.45, quill)),
  ] },
];
export const def = {
  name: 'kissmera', ppu: 3, scale: 0.5, outline: { color: '#0c0810', px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: [0, 12.0, -6.4], cubes: [
      B(-5.2, 8.0, -9.4, 5.2, 16.0, 7.4, bodyP), B(-4.8, 8.6, -10.4, 4.8, 15.0, -9.0, bodyP),
      B(-4.6, 7.2, 5.4, 4.6, 15.4, 9.0, chestP),
      B(-5.5, 7.7, -1.4, 5.5, 16.3, 1.4, strapP),
    ] },
    { name: 'shell', parent: 'body', pivot: [0, 16.0, -2.0], cubes: [
      B(-6.2, 13.4, -9.8, 6.2, 18.4, 4.6, shellBig), B(-5.0, 18.4, -8.6, 5.0, 20.4, 3.4, shellTop), B(-3.6, 20.4, -7.0, 3.6, 21.4, 1.8, shellTop),
      ...[-5.6, -2.6, 0.4].flatMap((z) => spike(0, 21.4, z, 1.3, 2.8)),
      // dripped: silver chains draped along the shell
      ...swag(-1), ...swag(1),
    ] },
    // ultra dripped: a star-body guitar strapped to the shell's flank
    { name: 'guitar', parent: 'shell', pivot: [6.6, 16.6, -2.4], rot: [-34, 0, 0], cubes: [
      A('acc-guitar', B(6.7, 12.6, -6.2, 6.7, 20.4, 1.6, guitarStar, { plane: 'x' })),
      A('acc-guitar', B(6.3, 15.4, -3.6, 6.6, 17.6, -1.2, trim)),
      A('acc-guitar', B(6.35, 19.4, -2.75, 7.05, 27.0, -2.05, fretP)),
      A('acc-guitar', B(6.25, 27.0, -3.1, 7.15, 28.8, -1.7, headstockP)),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 15.4, 8.6], cubes: [
      B(-5.0, 14.0, 6.0, 5.0, 23.0, 13.0, headFur, { faces: { south: faceP } }),
      B(-2.8, 14.2, 13.0, 2.8, 17.0, 15.8, muzzleP),
      B(-1.1, 16.2, 15.6, 1.1, 17.2, 16.3, noseP),
      B(-1.9, 13.3, 15.2, -1.2, 14.3, 15.7, fangP), B(1.2, 13.3, 15.2, 1.9, 14.3, 15.7, fangP),
      B(-7.6, 12.6, 5.6, -5.0, 23.4, 12.0, maneP(41)), B(5.0, 12.6, 5.6, 7.6, 23.4, 12.0, maneP(43), { mirror: true }),
      B(-5.4, 11.0, 7.0, 5.4, 14.4, 12.4, maneP(47)), B(-5.4, 7.6, 7.4, 5.4, 13.0, 10.2, maneP(49)),
      // normal (or): a silver ring through the nose
      A('acc-nosering', B(-0.75, 15.0, 16.0, 0.75, 15.35, 16.35, trim)), A('acc-nosering', B(-0.95, 15.1, 16.0, -0.6, 16.4, 16.35, trim)), A('acc-nosering', B(0.6, 15.1, 16.0, 0.95, 16.4, 16.35, trim)),
    ] },
    ...EYES.bones,
    { name: 'jaw', parent: 'head', pivot: [0, 14.2, 13.0], cubes: [B(-2.5, 13.0, 12.6, 2.5, 14.2, 15.4, jawP)] },
    { name: 'tongue', parent: 'jaw', pivot: [0, 14.0, 13.6], cubes: [B(-0.9, 13.75, 13.4, 0.9, 14.2, 17.8, tongueP())] },
    { name: 'mane', parent: 'head', pivot: [0, 22.0, 8.0], cubes: [
      B(-7.4, 11.0, 3.6, 7.4, 25.0, 8.0, maneP(31)),
      B(-6.4, 22.6, 5.0, 6.4, 25.6, 12.4, maneP(37)),
      B(-5.0, 22.8, 11.6, 5.0, 24.8, 13.8, maneP(39)),
      B(-11.0, 8.6, 7.2, 11.0, 29.6, 7.2, maneHalo, { plane: 'z' }),
      B(0, 8.6, 1.8, 0, 29.6, 14.0, maneHaloX, { plane: 'x' }),
      B(-4.4, 24.4, 7.0, -2.0, 28.4, 9.4, maneP(53), { pivot: [-3.2, 24.6, 8.2], rot: [-14, 0, 24] }),
      B(-1.2, 24.6, 7.4, 1.2, 29.2, 9.8, maneP(57), { pivot: [0, 24.8, 8.6], rot: [-18, 0, 0] }),
      B(2.0, 24.4, 7.0, 4.4, 28.4, 9.4, maneP(59), { pivot: [3.2, 24.6, 8.2], rot: [-14, 0, -24] }),
      // ultra (or): the lion's spiked crown
      A('acc-crown', B(-5.6, 25.2, 5.6, 5.6, 26.2, 12.4, trim)),
      ...[-4.2, -2.1, 0, 2.1, 4.2].flatMap((x, i) => sp('acc-crown', x, 26.2, 12.0, i === 2 ? 1.2 : 0.9, i === 2 ? 2.6 : 1.9, [-8, 0, -x * 3])),
      A('acc-crown', B(-0.6, 25.3, 12.35, 0.6, 26.1, 12.7, gemP)),
    ] },
    // the cobra tail: rises behind the shell, leans out to the left and looks forward
    { name: 'tail1', parent: 'body', pivot: [0, 13.2, -9.6], rot: [-38, 0, -14], cubes: [B(-1.3, 13.2, -10.9, 1.3, 19.4, -8.3, tailP)] },
    { name: 'tail2', parent: 'tail1', pivot: [0, 19.0, -9.6], rot: [14, 0, -4], cubes: [B(-1.2, 19.0, -10.8, 1.2, 25.8, -8.4, tailP)] },
    { name: 'tail3', parent: 'tail2', pivot: [0, 25.4, -9.6], rot: [18, 0, 6], cubes: [B(-1.1, 25.4, -10.7, 1.1, 30.6, -8.5, tailP)] },
    { name: 'snake', parent: 'tail3', pivot: [0, 30.2, -9.6], rot: [6, 0, 12], cubes: [
      B(-1.9, 29.6, -10.6, 1.9, 32.4, -6.2, sheadP), B(-1.4, 29.7, -6.4, 1.4, 31.8, -4.8, sheadP),
      B(-4.4, 26.2, -10.3, 4.4, 33.6, -10.3, hood, { plane: 'z' }),
      B(-1.1, 28.9, -5.5, -0.6, 29.7, -5.0, fangP), B(0.6, 28.9, -5.5, 1.1, 29.7, -5.0, fangP),
      // ultra (or): the snake's own little crown
      A('acc-crown', B(-1.7, 32.4, -9.4, 1.7, 33.0, -6.6, trim)), ...[-1.1, 0, 1.1].flatMap((x) => sp('acc-crown', x, 33.0, -8.0, 0.6, 1.2, [0, 0, -x * 10])),
    ] },
    { name: 'sjaw', parent: 'snake', pivot: [0, 29.7, -9.6], cubes: [B(-1.6, 28.8, -10.2, 1.6, 29.7, -5.0, sjawP)] },
    { name: 'stongue', parent: 'sjaw', pivot: [0, 29.2, -5.0], cubes: [B(-0.8, 29.2, -5.0, 0.8, 29.2, -2.2, forkP(), { plane: 'y', outline: false })] },
    ...both(...RIGHT),
  ],
};
def.drip = [
  [{ id: 'acc-cuffs', name: 'Spiked leg cuffs' }, { id: 'acc-nosering', name: 'Silver nose ring' }],
  [{ id: 'acc-chains', name: 'Draped silver chains' }, { id: 'acc-pads', name: 'Spiked pauldrons' }],
  [{ id: 'acc-guitar', name: 'Star-body guitar' }, { id: 'acc-crown', name: 'Twin crowns' }],
];
def.attach = {
  head: { bone: 'mane', at: [0, 25.6, 9.0], size: 12 },
  face: { bone: 'head', at: [0, 19.8, 13.1], size: 10 },
  neck: { bone: 'head', at: [0, 13.0, 11.0], size: 9 },
  back: { bone: 'shell', at: [0, 21.4, -2.0], size: 10 },
};

// ---------------------------------------------------------------- animation
const LEGS = ['FR', 'FL', 'BR', 'BL'];
const HEAD = [0, 29, 10], MOUTH = [0, 14.0, 16.6], SMOUTH = [0, 29.4, -4.4], SHELL = [0, 22, -2];
// leg swings (deg, + forward) and knee bends per leg; splay spreads them sideways
function quad(P, o = {}) { for (const L of LEGS) { const s = L[1] === 'R' ? 1 : -1; P.rot('leg' + L, -(o[L] || 0), 0, -s * (o.splay || 0)).rot('paw' + L, o['k' + L] || 0, 0, 0); } }
// lower the body by d units with the feet kept on the ground (the legs squash)
function crouch(P, d) { P.pos('body', 0, -d, 0); for (const L of LEGS) P.scl('leg' + L, 1, Math.max(0.4, 1 - d / (L[0] === 'F' ? 11.2 : 12)), 1); }
// rear up on the hind legs (the body pitches about the hips, the hind legs stay planted)
const rearUp = (P, k) => P.rot('body', -36 * k, 0, 0).rot('legBR', 36 * k, 0, 0).rot('legBL', 36 * k, 0, 0).pos('body', 0, 0.8 * k, 0).rot('head', 26 * k, 0, 0);
const hiss = (P, k, flick = k) => P.rot('sjaw', 34 * k, 0, 0).scl('stongue', 1, 1, 0.05 + 0.95 * flick);
const sway = (P, t, a = 1) => P.rot('tail1', 0, wave(t, 0.4) * 8 * a, 0).rot('tail2', wave(t, 0.5, 1) * 5 * a, 0, wave(t, 0.4, 1) * 6 * a).rot('tail3', wave(t, 0.5, 2) * 6 * a, 0, 0).rot('snake', wave(t, 0.5, 2.6) * 8 * a, wave(t, 0.4, 2) * 22 * a, 0);
const wings = (P, up, flap = 0) => P.rot('wingR', 0, -10 * up, -30 * up - flap).rot('wingL', 0, 10 * up, 30 * up + flap);
// the snake leans over the shell toward the lion's head (0..1)
// (it comes round the left shoulder; the lion turns to face it)
const leanIn = (P, k) => P.rot('tail1', 20 * k, 0, -30 * k).rot('tail2', 40 * k, 0, -10 * k).rot('tail3', 20 * k, 0, 0).rot('snake', -10 * k, -30 * k, 0);
const downPose = (P, k, t) => {
  P.pos('body', 0, -6.0 * k, 0).rot('body', 0, 0, 78 * k).rot('head', 10 * k, 0, -20 * k);
  quad(P, { FR: 10 * k, FL: -10 * k, BR: -8 * k, BL: 12 * k, splay: -6 * k });
  P.rot('tail1', 20 * k, 0, 20 * k).rot('tail2', 30 * k, 0, 10 * k).rot('tail3', 40 * k, 0, 0).rot('snake', 40 * k + wave(t, 0.7) * 4, 0, 0);
  wings(P, -0.4 * k); mouth(P, 0.5 * k, k); hiss(P, 0.5 * k, 0.6 * k);
};
export const anim = {
  start: 'idle', seed: 23,
  breathe: { bone: 'body', amp: 0.014, per: 2.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 4.8], dur: 0.12 },
  look: { bone: 'head', yaw: 30, pitch: 12, speed: 5 },
  springs: [
    { bone: 'mane', tip: [0, 4, 0], k: 170, d: 9, gain: 0.7, max: 12, axes: [1, 0.3, 1] },
    { bone: 'tail2', tip: [0, 5, 0], k: 140, d: 8, gain: 0.7, max: 12 },
    { bone: 'tail3', tip: [0, 4, 0], k: 120, d: 7, gain: 0.8, max: 14 },
    { bone: 'snake', tip: [0, 0, 4], k: 150, d: 8, gain: 0.6, max: 12 },
    { bone: 'wingR', tip: [-8, 0, 0], k: 200, d: 10, gain: 0.35, max: 10, axes: [1, 0.4, 1] },
    { bone: 'wingL', tip: [8, 0, 0], k: 200, d: 10, gain: 0.35, max: 10, axes: [1, 0.4, 1] },
    { bone: 'tongue', tip: [0, 0, 3], k: 110, d: 6, gain: 1.1, max: 30 },
    { bone: 'guitar', tip: [0, 8, 0], k: 240, d: 12, gain: 0.3, max: 6 },
  ],
  faces: { eyes: EYES.slot },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'tonguewar', 'tonguewar', 'maneflip'] },
  clips: {
    // standing proud: slow breaths, the cobra swaying and looking round on its own, a lion's tongue every few bars
    idle: { len: 2.4, loop: true, f(P, t, c) {
      const br = Math.sin((t / 2.4) * TAU), m = c.loopN % 4, blep = m === 1 ? bump(t, 0.8, 1.9) : 0;
      crouch(P, 0.25 + 0.2 * br); P.rot('body', br * 0.8, 0, 0).rot('head', 3 * br + 6 * blep, wave(t, 0.42) * 6, 5 * blep);
      quad(P, { FR: 2 * br, FL: -2 * br }); sway(P, t); wings(P, 0, 3 * br);
      mouth(P, 0.06 + 0.22 * blep, blep); hiss(P, m % 2 === 0 ? bump(t, 1.4, 1.75) : 0);
      glances(P, t, [[0, 0], [0.3, 0], [-0.3, 0.05], [0, 0]], 0.6);
      P.face('eyes', blep > 0.5 ? 'smug' : undefined);
    } },
    // a prowling diagonal gait: talons and platform boots, head low and level
    walk: { len: 1.0, loop: true, f(P, t) {
      const ph = t * TAU, s = Math.sin(ph), c = Math.cos(ph);
      quad(P, { FR: 22 * s, BL: 22 * s, FL: -22 * s, BR: -22 * s, kFR: 34 * Math.max(0, c), kBL: 30 * Math.max(0, c), kFL: 34 * Math.max(0, -c), kBR: 30 * Math.max(0, -c) });
      P.pos('body', 0, 0.5 * Math.abs(c), 0).rot('body', 0, 3 * s, 2 * c).rot('head', -4 + 2 * Math.cos(ph * 2), -4 * s, 0);
      sway(P, t, 0.6); wings(P, 0, 4 * Math.abs(s)); mouth(P, 0.1, 0); hiss(P, 0);
      P.burst(0.02, 'dust', 'root', [-4, 0.3, 6], { n: 2, speed: 0.4 }).burst(0.52, 'dust', 'root', [4, 0.3, 6], { n: 2, speed: 0.4 });
    } },
    // battle cry: rears up, forepaws clawing the air, the lion roars, wings flare, the cobra spreads its hood and hisses
    cry: { len: 2.4, next: 'idle', f(P, t) {
      const crouchK = bump(t, 0, 0.36), up = seg(t, 0.3, 0.6, E.back) * (1 - seg(t, 1.7, 2.1, E.inout)), land = bump(t, 2.0, 2.3);
      crouch(P, 1.8 * crouchK + 1.2 * land); rearUp(P, up);
      quad(P, { FR: 50 * up + 26 * up * wave(t, 3), FL: 50 * up - 26 * up * wave(t, 3), kFR: 50 * up, kFL: 50 * up });
      wings(P, up, 10 * up * Math.abs(wave(t, 3))); P.rot('head', -20 * up + wave(t, 10) * 3 * up, 0, 0);
      P.rot('tail3', 16 * up, 0, 0).rot('snake', 20 * up, 0, 0).scl('snake', 1 + 0.15 * up, 1 + 0.1 * up, 1); hiss(P, up, up * (0.5 + 0.5 * Math.abs(wave(t, 8))));
      mouth(P, 0.1 + 0.9 * up, 0.9 * up);
      P.face('eyes', crouchK > 0.3 ? 'angry' : up > 0.3 ? 'shut' : undefined); P.blinkOK = false;
      if (up > 0.6) P.stream('soundring', 'head', MOUTH, { rate: 6, dir: [0, 0.3, 1], tint: [1, 0.6, 0.6] });
      P.burst(0.62, 'kstar', 'head', HEAD, { n: 8, speed: 1.6 }).burst(0.7, 'bat', 'snake', [0, 33, -8], { n: 6 }).burst(2.1, 'dust', 'root', [0, 0.5, 6], { n: 12, spread: 1, speed: 1.4 }).burst(2.1, 'ring', 'root', [0, 1, 4], {});
    } },
    // pounce: crouch, spring forward, forepaws rake down — the cobra strikes at the same instant
    attack: { len: 1.2, next: 'idle', f(P, t) {
      const back = seg(t, 0, 0.3, E.out) * (1 - seg(t, 0.32, 0.4, E.in)), air = bump(t, 0.34, 0.62), hit = seg(t, 0.52, 0.62, E.out) * (1 - seg(t, 0.8, 1.15, E.inout)), go = seg(t, 0.34, 0.6, E.out) * (1 - seg(t, 0.8, 1.15, E.inout));
      crouch(P, 2.2 * back + 1.2 * hit); P.pos('root', 0, 3 * air, 6 * go - 1.4 * back).rot('body', 8 * back - 10 * air + 8 * hit, 0, 0);
      quad(P, { FR: -10 * back + 60 * air + 20 * hit, FL: -10 * back + 60 * air + 20 * hit, kFR: 30 * back - 20 * hit, kFL: 30 * back - 20 * hit, BR: -20 * air, BL: -20 * air });
      P.rot('head', 14 * back - 10 * air + 10 * hit, 0, 0); wings(P, 0.6 * air + 0.3 * back);
      P.rot('tail3', -20 * back + 40 * hit, 0, 0).rot('snake', 30 * hit, 0, 0); hiss(P, Math.max(back, hit));
      mouth(P, 0.3 + 0.6 * Math.max(air, hit), 0);
      P.face('eyes', back > 0.2 || go > 0.2 ? 'angry' : undefined); P.blinkOK = false;
      P.burst(0.6, 'spark', 'pawFR', [-3.4, 0.6, 8], { n: 2 }).burst(0.6, 'spark', 'pawFL', [3.4, 0.6, 8], { n: 2 }).burst(0.62, 'star', 'head', [0, 16, 18], { n: 4 }).burst(0.6, 'dust', 'root', [0, 0.5, 8], { n: 10, spread: 1, speed: 1.2 });
    } },
    // special: both heads breathe fire — the lion low and straight, the cobra from high over the shell
    special: { len: 2.4, next: 'idle', f(P, t) {
      const inhale = seg(t, 0, 0.55, E.inout) * (1 - seg(t, 0.6, 0.7, E.out)), fire = seg(t, 0.66, 0.76, E.back) * (1 - seg(t, 1.8, 2.15, E.inout)), shake = fire * wave(t, 14) * 1.2;
      crouch(P, 0.6 * inhale + 1.4 * fire); P.rot('body', -8 * inhale + 4 * fire, 0, shake);
      P.scl('body', 1 + 0.06 * inhale, 1 + 0.03 * inhale, 1 + 0.06 * inhale).rot('head', -16 * inhale + 6 * fire, 0, 0);
      quad(P, { FR: 10 * fire, FL: 10 * fire, splay: 6 * fire }); wings(P, 0.3 * inhale + 0.8 * fire, 6 * fire * Math.abs(wave(t, 6)));
      P.rot('tail3', 20 * fire, 0, 0).rot('snake', 26 * fire - 10 * inhale, 0, 0); hiss(P, Math.max(inhale * 0.3, fire), 0);
      mouth(P, inhale > 0.3 ? 0.1 : 0.9 * fire, 0);
      P.face('eyes', inhale > 0.3 ? 'closed' : fire > 0.3 ? 'angry' : t > 2.0 ? 'smug' : undefined); P.blinkOK = false;
      if (fire > 0.5 && t < 1.85) { P.stream('breath', 'head', MOUTH, { rate: 130, dir: [0, -0.05, 1], spread: 0.16, key: 'l' }); P.stream('breath', 'snake', SMOUTH, { rate: 90, dir: [0, -0.35, 1], spread: 0.16, key: 's' }); }
      P.burst(1.9, 'smoke', 'head', MOUTH, { n: 6, dir: [0, 1, 0.4], speed: 0.7 }).burst(1.9, 'smoke', 'snake', SMOUTH, { n: 4, dir: [0, 1, 0.4], speed: 0.7 });
    } },
    hurt: { len: 0.75, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.06, E.out) * (1 - seg(t, 0.25, 0.75, E.inout));
      P.pos('root', 0, 0, -2.4 * k).rot('body', 10 * k + wob(t, 0.06, 4, 4, 7), 0, wave(t, 14) * 3 * k).rot('head', -18 * k, 0, wave(t, 12) * 8 * k);
      crouch(P, 1.0 * k); quad(P, { FR: -14 * k, FL: -14 * k }); wings(P, 0.7 * k);
      P.rot('snake', -30 * k, 0, 0).rot('tail3', -20 * k, 0, 0); hiss(P, k, 0.3 * k);
      mouth(P, 0.7 * k, 0.2 * k); P.face('eyes', t < 0.42 ? 'x' : undefined); P.blinkOK = false;
      P.burst(0.02, 'spark', 'body', [0, 16, 6], { n: 2 }).burst(0.03, 'star', 'head', HEAD, { n: 3 }).burst(0.1, 'sweat', 'head', [6, 24, 10], { n: 2, dir: [1, 1, 0], speed: 1 }).burst(0.04, 'feather', 'wingR', [-10, 14, 4], { n: 4, speed: 1.2 });
    } },
    // dizzy sway, then it keels over onto its side, the cobra flopping across the shell
    faint: { len: 2.4, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 1.0, 1.1)), fall = seg(t, 1.0, 1.5, E.bounce);
      P.rot('body', 0, wave(t, 1.3) * 10 * dizzy, wave(t, 1.6) * 6 * dizzy).rot('head', 0, wave(t, 1.3, 1) * 16 * dizzy, wave(t, 1.6) * 12 * dizzy);
      crouch(P, 0.8 * dizzy); downPose(P, fall, t);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.6, 'star', 'head', HEAD, { n: 5 }).burst(1.45, 'dust', 'root', [0, 0.5, 0], { n: 16, spread: 1, speed: 1.6 });
    } },
    down: { len: 2.6, loop: true, f(P, t) {
      downPose(P, 1, t); P.rot('pawFL', 14 * bump(t, 0.5, 0.7), 0, 0).rot('snake', 6 * bump(t, 1.4, 1.6), 0, 0);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
    } },
    // asleep like a sphinx, chin on its talons, wings folded, the cobra curled on the shell
    sleep: { len: 3.4, loop: true, f(P, t) {
      const br = Math.sin((t / 3.4) * TAU);
      P.pos('body', 0, -7.4 + br * 0.15, 0).rot('body', 2 + br * 0.6, 0, 0).rot('head', 16 + br * 2, 0, 8);
      quad(P, { FR: 80, FL: 76, BR: 70, BL: 66, kFR: -20, kFL: -18, splay: 8 });
      P.rot('wingR', 0, 20, 30).rot('wingL', 0, -20, -30);
      P.rot('tail1', 30, 0, 10).rot('tail2', 40, 0, 10).rot('tail3', 46, 0, 0).rot('snake', 36, 0, 0); hiss(P, 0);
      mouth(P, 0.08 + Math.max(0, br) * 0.06, 0.15);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'head', HEAD, {}).burst(1.9, 'z', 'snake', [0, 34, -8], {});
    } },
    // victory: rampant — up on its hind legs like a heraldic beast, one forepaw raised, wings wide, both tongues out
    win: { len: 2.6, next: 'idle', f(P, t) {
      const up = seg(t, 0.15, 0.5, E.back) * (1 - seg(t, 2.1, 2.5, E.inout)), crouchK = bump(t, 0, 0.2);
      crouch(P, 1.6 * crouchK); rearUp(P, up);
      quad(P, { FR: 80 * up, FL: 24 * up, kFR: -10 * up, kFL: 60 * up, splay: 4 * up });
      wings(P, 1.1 * up, 12 * up * Math.max(0, wave(t, 2))); P.rot('head', -10 * up, 0, -8 * up);
      P.rot('snake', 14 * up, 0, 0); hiss(P, up * 0.7, up);
      mouth(P, 0.45 * up, up);
      P.face('eyes', up > 0.3 ? (t > 1.2 ? 'smug' : 'shut') : undefined); P.blinkOK = false;
      P.burst(0.5, 'kstar', 'head', HEAD, { n: 10, speed: 1.8 }).burst(0.55, 'sparkle', 'head', HEAD, { n: 10 }).burst(0.55, 'confetti', 'head', HEAD, { n: 20, speed: 1.5 }).burst(0.6, 'bat', 'snake', [0, 33, -8], { n: 4 });
    } },
    // the headbang groove: every beat the lion and the cobra bang their heads together, forepaws stomp in turn,
    // the wings pump — a stomping turn on the spot, and a rampant finish with both tongues out
    dance: { len: 3.0, next: 'idle', f(P, t) {
      const bt = t * 2, n = Math.floor(bt), ph = bt - n, hit = Math.sin(Math.min(1, ph * 1.8) * Math.PI), on = seg(t, 0, 0.15) * (1 - seg(t, 2.05, 2.15)), side = n % 2 ? 1 : -1;
      const turn = seg(t, 1.0, 2.0, E.inout), fin = seg(t, 2.15, 2.4, E.back) * (1 - seg(t, 2.7, 3.0, E.inout));
      crouch(P, 0.8 * hit * on); P.rot('root', 0, 360 * turn, 0);
      quad(P, { FR: (side > 0 ? 24 * hit : 0) * on + 70 * fin, FL: (side < 0 ? 24 * hit : 0) * on + 20 * fin, kFR: (side > 0 ? 40 * hit : 0) * on, kFL: (side < 0 ? 40 * hit : 0) * on + 50 * fin });
      P.rot('head', 26 * hit * on, side * 6 * on, 0).rot('snake', 30 * hit * on, 0, 0).rot('tail3', 10 * hit * on, 0, 0);
      wings(P, 0.4 * on + 1.0 * fin, 14 * hit * on); rearUp(P, 0.7 * fin);
      mouth(P, 0.2 + 0.4 * hit * on + 0.4 * fin, fin + (n % 2 ? 0.6 * hit : 0) * on); hiss(P, 0.4 * hit * on + 0.6 * fin, fin);
      P.face('eyes', fin > 0.3 ? 'smug' : on > 0.5 ? (hit > 0.5 ? 'shut' : 'happy') : undefined); P.blinkOK = false;
      for (const t0 of [0.02, 0.52, 1.02, 1.52]) P.burst(t0, 'dust', 'root', [0, 0.3, 6], { n: 3, spread: 1, speed: 0.7 }).burst(t0 + 0.06, t0 % 1 ? 'note' : 'goldnote', 'head', [0, 28, 10], { n: 1, dir: [0, 1, 0.2], speed: 1 });
      P.burst(2.25, 'kstar', 'head', HEAD, { n: 10, speed: 1.6 }).burst(2.25, 'sparkle', 'snake', [0, 33, -8], { n: 8, speed: 1.2 });
    } },
    // signature: the tongue war. The lion sticks its tongue out at the cobra; the cobra leans in and flicks back a
    // longer one; the lion's gets longer; the cobra's longer still… and then the lion unrolls a ridiculous one and wins.
    tonguewar: { len: 4.0, next: 'idle', f(P, t) {
      const lean = seg(t, 0.4, 0.9, E.inout) * (1 - seg(t, 3.3, 3.8, E.inout)), turn = seg(t, 0.1, 0.4, E.inout) * (1 - seg(t, 3.4, 3.9, E.inout));
      const L1 = bump(t, 0.2, 1.4), S1 = bump(t, 0.9, 2.0), L2 = bump(t, 1.5, 2.6), S2 = bump(t, 2.0, 3.0), win = seg(t, 2.65, 2.85, E.back) * (1 - seg(t, 3.4, 3.8, E.inout)), sulk = seg(t, 3.0, 3.2) * (1 - seg(t, 3.6, 3.95));
      leanIn(P, lean); P.rot('snake', 30 * sulk, 20 * sulk, 0);
      P.rot('head', -4 * win, 55 * turn, 10 * turn); crouch(P, 0.4 + 0.4 * win); P.lookW = 0;
      const tl = Math.max(L1, 1.7 * L2, 2.6 * win), ts = Math.max(1.6 * S1, 2.6 * S2);
      mouth(P, 0.3 + 0.3 * Math.min(1, tl), tl, { droop: 6 }); hiss(P, Math.max(0.5 * S1, 0.7 * S2), ts);
      wings(P, 0.3 * win, 10 * win * Math.abs(wave(t, 4)));
      P.face('eyes', win > 0.3 ? 'smug' : L2 > 0.4 ? 'angry' : S1 > 0.5 || S2 > 0.5 ? 'wide' : L1 > 0.3 ? 'happy' : undefined); P.blinkOK = false;
      P.burst(2.8, 'kstar', 'head', HEAD, { n: 8, speed: 1.5 }).burst(2.8, 'sparkle', 'head', MOUTH, { n: 8 }).burst(3.05, 'sweat', 'snake', [2, 33, -8], { n: 2, dir: [1, 1, 0], speed: 0.8 }).burst(1.55, 'anger', 'head', [-6, 27, 10], {});
    } },
    // a slow-motion rock-star mane flip: head down, mane forward… and whipped back, wings flaring, sparkles flying
    maneflip: { len: 2.6, next: 'idle', f(P, t) {
      const down = seg(t, 0.05, 0.6, E.inout) * (1 - seg(t, 0.7, 0.95, E.out3)), flip = seg(t, 0.7, 0.95, E.out3) * (1 - seg(t, 1.9, 2.5, E.inout)), duck = bump(t, 0.6, 1.2);
      P.rot('head', 34 * down - 22 * flip, 0, -6 * flip).rot('mane', 18 * down - 14 * flip, 0, 0); crouch(P, 1.2 * down);
      quad(P, { FR: -6 * down + 8 * flip, FL: -6 * down + 8 * flip });
      wings(P, 0.9 * flip, 8 * flip * Math.abs(wave(t, 3)));
      P.rot('snake', -30 * duck, 0, 0).rot('tail3', -16 * duck, 0, 0); hiss(P, 0.3 * duck);
      mouth(P, 0.1 + 0.2 * flip, 0);
      P.face('eyes', down > 0.3 ? 'closed' : flip > 0.3 ? 'smug' : undefined); P.blinkOK = false;
      P.burst(0.82, 'sparkle', 'mane', [0, 26, 8], { n: 12, speed: 1.6 }).burst(0.82, 'kstar', 'mane', [0, 26, 8], { n: 4, speed: 1.2 }).burst(0.75, 'sweat', 'snake', [2, 33, -8], { n: 2, dir: [1, 1, 0], speed: 0.8 });
    } },
  },
};
def.anim = anim;
// the ultra-drip form: black-lacquer fur with gold tips, a gold shell and talons, white paint and burning red eyes kept
def.dripForm = kissForm({ keep: [C.eye, C.eyeLo, C.eyeHi], swap: { [CH.furTip]: '#ffd84a', [CH.maneTip]: '#e0a030', [CH.furHi]: '#5a4a3a' } });
