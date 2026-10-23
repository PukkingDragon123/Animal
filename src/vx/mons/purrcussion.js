// Purrcussion — a stone-split final of the Kissmet line (Draco/Echo): the Catman, a KISS homage that
// leans into the chimera's lion. A big, swaggering bronze lion with a huge black mane, cat-eye
// greasepaint (black almond flares with a green stripe), a white muzzle with black whiskers and a
// black nose, green slit-pupilled eyes, a spiked cat collar, black leather and platform boots — and
// a drum carried at its waist whose shell is a turtle's: it drums on the tortoiseshell with a pair of
// sticks and purrs in 4/4. Chimera hints: the tortoiseshell drum, a banded snake's head at the end of
// its tail, and two black-and-white eagle feathers tucked into its mane.
// Signature: the drum solo — stick twirls, a blinding flurry, a stick flung sky-high and caught, a crash.
// Drip (one per tier): 1 cat bell on the collar | silver hoop earrings · 2 crash cymbal on the drum |
// studded fingerless gloves · 3 floating tom-toms | silver lion crown.
import {
  K, CH, B, both, at, fill, isSide, shift, ramp, fur, leather, chrome, spike, spikeP, painted, shellP, bootP, soleP, inPoly, chain,
  chimMane, chimHalo, snakeBands, snakeHead, cobEyes, tongueP, legs, arm, arms, emote, sharedClips, onBack, walkCycle, glances, kissForm, E, seg, bump, wob, wave, TAU,
} from './kiss_parts.js';
import { bounce } from '../anim.js';

const C = { eye: '#5ad83a', eyeLo: '#1e6a1a', eyeHi: '#c8ff8a', fur: '#8a6440', furHi: '#b0884e', furLo: '#5a3e26', furLine: '#2e1e10', furTip: '#d0a868', chest: '#c8a878', green: '#3ac84a', wood: ['#f4e0b0', '#d8b880', '#a8844e', '#6a5030'] };
// ---------------------------------------------------------------- painters
const furP = (seed, o = {}) => fur(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furLine, tip: C.furTip, s: 8, pt: 0.6, seed, ...o });
const headFur = furP(11), bodyFur = furP(17, { s: 10 }), limbFur = furP(23, { s: 7, tipH: 3 });
const chestP = painted(bodyFur, { marks: [{ fn: (X, Y) => { const half = 2.6 - Math.abs(Y - 15.4) * 0.35; return Math.abs(X) < half && Y < 19.0 && Y > 12.0 ? ((Math.round(X * 3) + Math.round(Y * 3)) % 5 === 0 ? shift(C.chest, -0.12) : C.chest) : null; } }] });
const maneP = (seed, o) => chimMane(seed, o), halo = chimHalo({ n: 28, depth: 0.22, inner: 0.6, seed: 11 });
// the Catman face: black almond cat-eye flares sweeping up and out, a green stripe along their top edge
const EYE = [2.2, 18.4];
const flare = (s) => [[-1.7, -0.7], [-0.4, -1.2], [1.2, -1.1], [2.2, -0.3], [3.3, 1.3], [2.1, 1.0], [1.1, 1.4], [-0.7, 1.3], [-1.8, 0.4]].map(([x, y]) => [s * EYE[0] + x * s, EYE[1] + y]);
const FR = flare(-1), FL = flare(1), FR2 = flare(-1).map(([x, y]) => [x, y - 0.32]), FL2 = flare(1).map(([x, y]) => [x, y - 0.32]);
const faceP = painted(headFur, { marks: [{ fn: (X, Y) => ((inPoly(FR, X, Y) && !inPoly(FR2, X, Y)) || (inPoly(FL, X, Y) && !inPoly(FL2, X, Y)) ? C.green : inPoly(FR, X, Y) || inPoly(FL, X, Y) ? K.paint : null) }] });
const whiteP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'down' ? K.whiteLo : face === 'up' ? K.white : ramp([K.white, K.white, K.whiteLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
// the muzzle: white, black whiskers fanning out, whisker dots, a black lip line; under it, the mouth
const WH = [[1.0, 14.9, 2.9, 15.4], [1.0, 14.3, 2.9, 13.9]];
const muzzleP = (p, w, h, face, cube) => {
  if (face === 'down') { fill(p, w, h, () => K.mouth); for (const x of [Math.round(w * 0.25), Math.round(w * 0.75) - 1]) p.px(x, 0, K.white).px(x, 1, K.white); return; }
  painted(whiteP, { sym: true, marks: [{ lines: WH.map(([a, b, c, d]) => [-a, b, -c, d]), r: 0.11 }, { dots: [[-1.2, 15.5], [-1.7, 15.2]], r: 0.15 }, { lines: [[0, 14.3, 0, 15.1]], r: 0.13 }] })(p, w, h, face, cube);
  if (face === 'south') { const m = Math.floor(w / 2); for (let x = 1; x < w - 1; x++) if (Math.abs(x - m) > 1) p.px(x, h - 1, K.paint); }
};
const noseP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? '#3a2a30' : '#141014')); if (face === 'south') { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Math.abs(x - (w - 1) / 2) > (w / 2) * (1 - y / h) + 0.4) p.px(x, y, K.white); p.px(1, 0, '#6a5a60'); } };
const jawP = (p, w, h, face) => { if (face === 'up') { fill(p, w, h, (x, y) => (x < 1 || x >= w - 1 ? '#5a1424' : K.mouth)); return; } whiteP(p, w, h, face); if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, 0, K.paint); };
const fangP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'down' || y === h - 1 ? K.whiteLo : K.white));
const earP = (p, w, h, face, cube) => { furP(29, { s: 5, tipH: 2 })(p, w, h, face, cube); if (face === 'south') fill(p, w, h, (x, y) => (x > 0 && x < w - 1 && y > 1 ? '#3a2418' : null)); };
const featherP = (p, w, h) => { for (let y = 0; y < h; y++) { const v = y / (h - 1), half = (w / 2) * Math.sin(Math.min(1, v * 1.1 + 0.1) * Math.PI) * 0.9; for (let x = 0; x < w; x++) { const d = Math.abs(x + 0.5 - w / 2); if (d > half) continue; p.px(x, y, d < 0.6 ? '#d8d4e4' : v < 0.35 ? '#f4f2fa' : (x + y) % 3 === 0 ? '#3a3448' : '#1c1824'); } } };
const pantsP = leather({ cols: CH.pants }), studs = leather({ studs: 3 });
const beltP = (p, w, h, face, cube) => { pantsP(p, w, h, face, cube); if (!isSide(face)) return; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [, Y] = at(face, cube, x, y); if (Y > 11.0) p.px(x, y, Y > 11.85 ? '#3a3446' : (x % 3 === 1 && y % 2 === 1) ? K.silver[1] : '#1a1820'); } };
// platform boots with three silver claw slashes
const bootClaw = (p, w, h, face, cube) => { bootP()(p, w, h, face, cube); if (face !== 'south') return; const m = Math.floor(w / 2); for (const dx of [-3, 0, 3]) for (let i = 0; i < 5; i++) p.px(m + dx + Math.round(i * 0.4) - 1, 2 + i, K.silver[1]); };
const sole = soleP(), trim = chrome();
const tailFur = furP(37, { s: 4, tipH: 1.5 });
const tailSnake = snakeBands('z', { per: 1.6 });
const tailHead = snakeHead({ eye: (X, Y, Z) => (Z > -12.6 && Z < -11.9 && Y > 11.0 && Y < 11.5 ? (Math.abs(Z + 12.25) < 0.17 ? 'k' : 'i') : null) });
// the tortoiseshell drum: a white head on top with a silver hoop, tortoiseshell sides between two silver hoops
const tortoise = shellP({ cols: ['#e0a050', '#a8662a', '#5a3216', '#1e0e06'], size: 2.0, lip: false });
const drumP = (p, w, h, face, cube) => {
  if (face === 'up') { fill(p, w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? K.silver[1] : Math.hypot(x - w / 2 + 0.5, y - h / 2 + 0.5) < 1.5 ? '#d8d0c4' : (x + y) % 9 === 0 ? '#e8e2d8' : '#f6f2ea')); return; }
  if (face === 'down') { fill(p, w, h, () => '#3a2210'); return; }
  tortoise(p, w, h, face, cube); for (let x = 0; x < w; x++) { p.px(x, 0, K.silver[0]).px(x, 1, K.silver[2]).px(x, h - 1, K.silver[3]).px(x, h - 2, K.silver[1]); }
  for (let x = 2; x < w; x += 6) for (let y = 2; y < h - 2; y++) if (y % 2) p.px(x, y, K.silver[2]);    // tension rods
};
const stickP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? C.wood[0] : face === 'down' ? C.wood[3] : ramp(C.wood, h > 1 ? y / (h - 1) : 0.5, x, y)));
const tipP = (p, w, h) => fill(p, w, h, () => '#fff8e8');
const strapP = (p, w, h) => fill(p, w, h, (x, y) => (y === 0 ? '#4a4458' : (x + y) % 4 === 0 ? K.silver[2] : '#1c1924'));
// drip painters
const cymbalP = (p, w, h, face) => { const cx = w / 2, cy = h / 2; fill(p, w, h, (x, y) => { const r = Math.hypot((x + 0.5 - cx) / (w / 2), (y + 0.5 - cy) / (h / 2)); if (r > 1) return null; return r < 0.18 ? '#8a5a18' : Math.round(r * 9) % 2 ? '#ffd24a' : '#e0a830'; }); };
const tomP = (p, w, h, face, cube) => { if (face === 'up') { fill(p, w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? K.silver[1] : '#f6f2ea')); return; } fill(p, w, h, (x, y) => (y < 1 ? K.silver[0] : y >= h - 1 ? K.silver[3] : (x + y) % 6 === 0 ? '#3a1018' : '#6a1424')); };
const gloveP = leather({ studs: 2 });

// ---------------------------------------------------------------- the model
const R = { hipX: 3.2, hipY: 10.4, ankleY: 2.4, L1: 4.2, L2: 3.8 };
// green cat eyes: no whites, a tilted almond with a lash flick, a dark-topped green iris, a slit pupil, a glint
const EYE_MAPS = {
  open: ['ll.........', '.llllllll..', '..IIIIkIIl.', '..ihhikiiil', '...iiikiic.', '....cckcc..'],
  angry: ['l..........', 'llll.......', '..IIllll...', '..ihhikllll', '...iiikiic.', '....cckcc..'],
  sad: ['...........', '.......lll.', '....llllIl.', '..lllikiiil', '...iiikiic.', '....cckcc..'],
  happy: ['...........', '...lllll...', '..lllllll..', '.lll...lll.', '.ll.....ll.', '...........'],
  closed: ['...........', '...........', 'l..........', '.llllllllll', '..llllllll.', '...........'],
  shock: ['.llllllll..', '..iiiiiilll', '..iiiiiiiil', '...iiikiii.', '....iiiii..', '...........'],
  wide: ['.llllllll..', '..IIkkkIll.', '..ihkkkkiil', '...ikkkkic.', '....ckkcc..', '...........'],
  smug: ['...........', '...........', '.llllllllll', '..ihhikiiil', '...iiikiic.', '....cckcc..'],
  sleepy: ['...........', '...........', '...........', '.llllllllll', '...iiikiic.', '....cckcc..'],
  teary: ['ll.........', '.llllllll..', '..IIIIkIIl.', '..ihhikiiil', '...bbbkbbb.', '....bbbbb..'],
};
const EYES = cobEyes({ at: [-EYE[0], EYE[1], 4.66], line: '#080c06', pupilColor: '#040804', iris: C.eye, irisDark: C.eyeLo, accent: C.eyeHi, maps: EYE_MAPS });
const A = (id, c) => ({ ...c, id, hide: true });
const sp = (id, x, y, z, s, len, rot) => spike(x, y, z, s, len, { x: { pivot: [x, y, z], rot } }).map((c) => (id ? A(id, c) : c));
const RIGHT = [
  { name: 'thighR', parent: 'root', pivot: [-3.2, 10.4, 0], cubes: [B(-4.6, 6.0, -1.8, -1.8, 11.0, 1.8, pantsP)] },
  { name: 'shinR', parent: 'thighR', pivot: [-3.2, 6.2, 0], cubes: [B(-4.2, 2.4, -1.4, -2.2, 6.6, 1.4, pantsP)] },
  { name: 'footR', parent: 'shinR', pivot: [-3.2, 2.4, 0], cubes: [B(-4.8, 0, -2.2, -1.6, 1.8, 3.2, sole), B(-4.6, 1.8, -1.9, -1.8, 4.6, 2.8, bootClaw), B(-4.7, 4.4, -1.7, -1.7, 4.9, 1.8, trim)] },
  { name: 'armR', parent: 'torso', pivot: [-5.8, 18.6, 0.2], cubes: [B(-7.6, 14.8, -1.6, -5.0, 19.2, 1.8, limbFur)] },
  { name: 'foreR', parent: 'armR', pivot: [-6.3, 15.0, 0.2], cubes: [B(-7.4, 11.6, -1.4, -5.2, 15.2, 1.6, limbFur), B(-7.55, 11.8, -1.55, -5.05, 13.0, 1.75, studs)] },
  { name: 'handR', parent: 'foreR', pivot: [-6.3, 11.6, 0.2], cubes: [
    B(-7.6, 9.8, -1.6, -5.0, 11.8, 2.0, furP(51, { s: 6, tipH: 2 })),
    // dripped (or): studded fingerless gloves, claws out
    A('acc-gloves', B(-7.75, 10.4, -1.75, -4.85, 11.9, 2.15, gloveP)), ...[-7.3, -6.4, -5.5].map((x) => A('acc-gloves', B(x, 9.2, 1.4, x + 0.5, 10.2, 2.0, spikeP({ down: true })))),
  ] },
  // a drumstick held along the paw, tipped back a little: in the drumming pose it points forward over the drum
  { name: 'stickR', parent: 'handR', pivot: [-6.3, 10.6, 0.6], rot: [30, 0, 0], cubes: [B(-6.6, 4.6, 0.3, -6.0, 10.9, 0.9, stickP), B(-6.7, 4.0, 0.2, -5.9, 4.8, 1.0, tipP)] },
  { name: 'earR', parent: 'head', pivot: [-4.2, 23.0, -0.2], rot: [0, 0, 14], cubes: [B(-5.2, 22.4, -0.8, -3.2, 24.8, 0.4, earP)] },
];
export const def = {
  name: 'purrcussion', ppu: 3, scale: 0.58, outline: { color: '#120a06', px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'pelvis', parent: 'root', pivot: [0, 10.4, 0], cubes: [B(-4.6, 9.2, -2.8, 4.6, 12.2, 2.8, beltP)] },
    // the lion's tail, ending in a banded snake's head
    { name: 'tail1', parent: 'pelvis', pivot: [0, 10.6, -2.6], rot: [34, 0, 0], cubes: [B(-0.65, 10.0, -7.6, 0.65, 11.3, -2.4, tailFur)] },
    { name: 'tail2', parent: 'tail1', pivot: [0, 10.6, -7.2], rot: [-58, 0, 0], cubes: [B(-0.6, 10.05, -11.4, 0.6, 11.25, -7.0, tailSnake)] },
    { name: 'tailhead', parent: 'tail2', pivot: [0, 10.7, -11.2], rot: [34, 0, 0], cubes: [B(-0.95, 10.1, -13.6, 0.95, 11.7, -10.9, tailHead)] },
    { name: 'torso', parent: 'pelvis', pivot: [0, 11.8, 0], cubes: [
      B(-5.2, 11.6, -3.0, 5.2, 19.8, 3.4, chestP),
      // the Catman's spiked collar
      B(-3.9, 19.0, -2.5, 3.9, 20.2, 3.1, studs), ...[-2.4, -0.8, 0.8, 2.4].flatMap((x) => sp(null, x, 19.6, 3.0, 0.6, 1.2, [90, 0, 0])),
      // normal: a silver cat bell on the collar
      A('acc-bell', B(-0.8, 17.6, 3.1, 0.8, 19.2, 4.6, chrome())), A('acc-bell', B(-0.3, 17.4, 4.4, 0.3, 17.8, 4.7, (p, w, h) => fill(p, w, h, () => '#141418'))),
      // the drum straps
      B(-5.0, 13.2, 3.42, -3.8, 19.6, 3.72, strapP), B(3.8, 13.2, 3.42, 5.0, 19.6, 3.72, strapP),
    ] },
    // the tortoiseshell drum, carried at the waist
    { name: 'drum', parent: 'torso', pivot: [0, 12.6, 4.2], cubes: [
      B(-4.2, 9.6, 3.4, 4.2, 13.4, 9.2, drumP),
      // dripped: a crash cymbal on a little stand clamped to the drum
      A('acc-cymbal', B(3.6, 13.4, 7.6, 4.0, 18.0, 8.0, trim)), A('acc-cymbal', B(1.0, 18.0, 5.2, 6.6, 18.0, 10.4, cymbalP, { plane: 'y', pivot: [3.8, 18.0, 7.8], rot: [-12, 0, 14] })),
    ] },
    // ultra dripped: two floating tom-toms on star stands, one each side
    { name: 'toms', parent: 'root', pivot: [0, 14, 2], cubes: [-1, 1].flatMap((s) => [
      A('acc-toms', B(s * 9.4 - 1.8, 12.6, 1.0, s * 9.4 + 1.8, 15.4, 4.6, tomP)), A('acc-toms', B(s * 9.4 - 0.2, 6.0, 2.6, s * 9.4 + 0.2, 12.6, 3.0, trim)), A('acc-toms', B(s * 9.4 - 1.2, 5.6, 1.6, s * 9.4 + 1.2, 6.0, 4.0, trim)),
    ]) },
    { name: 'head', parent: 'torso', pivot: [0, 19.6, 0.4], cubes: [
      B(-4.6, 13.0, -2.6, 4.6, 21.6, 4.6, headFur, { faces: { south: faceP } }),
      B(-3.0, 13.2, 4.6, 3.0, 16.2, 7.0, muzzleP),
      B(-1.2, 15.2, 6.8, 1.2, 16.4, 7.4, noseP),
      B(-2.0, 12.4, 6.4, -1.3, 13.4, 6.9, fangP), B(1.3, 12.4, 6.4, 2.0, 13.4, 6.9, fangP),
      B(-6.8, 12.8, -3.0, -4.6, 22.0, 3.6, maneP(41)), B(4.6, 12.8, -3.0, 6.8, 22.0, 3.6, maneP(43), { mirror: true }),
      B(-4.8, 11.2, -0.6, 4.8, 13.4, 4.4, maneP(47)),
      // two eagle feathers tucked into the mane
      B(5.0, 20.4, -1.6, 6.6, 26.8, -1.6, featherP, { plane: 'z', pivot: [5.8, 20.4, -1.6], rot: [0, 0, -22], outline: false }),
      B(4.2, 20.6, -2.2, 5.6, 26.0, -2.2, featherP, { plane: 'z', pivot: [4.9, 20.6, -2.2], rot: [0, 0, -8], outline: false }),
      // normal (or): silver hoop earrings
      A('acc-hoops', B(-6.0, 20.6, 0.0, -5.6, 22.0, 0.4, trim)), A('acc-hoops', B(5.6, 20.6, 0.0, 6.0, 22.0, 0.4, trim)),
      A('acc-hoops', B(-6.2, 20.2, -0.4, -5.4, 20.6, 0.8, trim)), A('acc-hoops', B(5.4, 20.2, -0.4, 6.2, 20.6, 0.8, trim)),
    ] },
    ...EYES.bones,
    { name: 'jaw', parent: 'head', pivot: [0, 13.4, 4.8], cubes: [B(-2.6, 12.2, 4.4, 2.6, 13.4, 6.6, jawP)] },
    { name: 'tongue', parent: 'jaw', pivot: [0, 13.0, 5.0], cubes: [B(-0.9, 12.75, 4.8, 0.9, 13.2, 7.6, tongueP())] },
    { name: 'mane', parent: 'head', pivot: [0, 21.0, -1.0], cubes: [
      B(-6.6, 12.0, -4.4, 6.6, 23.4, -0.8, maneP(31)), B(-5.8, 21.0, -3.6, 5.8, 24.0, 3.6, maneP(37)),
      B(-10.6, 9.4, -1.6, 10.6, 27.4, -1.6, halo, { plane: 'z' }), B(0, 9.4, -6.4, 0, 27.4, 4.2, halo, { plane: 'x' }),
      B(-3.4, 23.0, -1.6, -1.2, 25.6, 0.6, maneP(53), { pivot: [-2.3, 23.2, -0.5], rot: [-12, 0, 22] }), B(-1.1, 23.2, -1.2, 1.1, 26.4, 1.0, maneP(57), { pivot: [0, 23.4, -0.1], rot: [-16, 0, 0] }), B(1.2, 23.0, -1.6, 3.4, 25.6, 0.6, maneP(59), { pivot: [2.3, 23.2, -0.5], rot: [-12, 0, -22] }),
      // ultra (or): a silver lion crown
      A('acc-crown', B(-4.8, 23.6, -2.6, 4.8, 24.6, 3.4, trim)), ...[-3.4, -1.7, 0, 1.7, 3.4].flatMap((x, i) => sp('acc-crown', x, 24.6, 3.0, i === 2 ? 1.1 : 0.85, i === 2 ? 2.4 : 1.7, [-8, 0, -x * 4])),
    ] },
    ...both(...RIGHT),
  ],
};
def.drip = [
  [{ id: 'acc-bell', name: 'Cat bell' }, { id: 'acc-hoops', name: 'Silver hoop earrings' }],
  [{ id: 'acc-cymbal', name: 'Crash cymbal' }, { id: 'acc-gloves', name: 'Studded fingerless gloves' }],
  [{ id: 'acc-toms', name: 'Floating tom-toms' }, { id: 'acc-crown', name: 'Silver lion crown' }],
];
def.attach = {
  head: { bone: 'mane', at: [0, 24.0, 0.0], size: 11 },
  face: { bone: 'head', at: [0, 18.4, 4.7], size: 9 },
  neck: { bone: 'torso', at: [0, 19.6, 3.0], size: 8 },
  back: { bone: 'torso', at: [0, 15.6, -3.2], size: 10 },
};

// ---------------------------------------------------------------- animation
const HEAD = [0, 27, 1], MOUTH = [0, 12.8, 7.6], DRUM = [0, 13.6, 6.4];
const mouth = (P, open, tongue = 0) => P.rot('jaw', 30 * open, 0, 0).scl('tongue', 1, 1, 0.05 + 0.95 * tongue).rot('tongue', 20 * tongue, 0, 0);
// both sticks over the drum: r / l = 0 raised … 1 striking
const sticks = (P, r, l, k = 1) => {
  arm(P, 'R', { out: -20 * k, fwd: (30 + 4 * r) * k, bend: (56 - 6 * r) * k, wrist: (25 - 34 * r) * k });
  arm(P, 'L', { out: -20 * k, fwd: (30 + 4 * l) * k, bend: (56 - 6 * l) * k, wrist: (25 - 34 * l) * k });
};
const tailSway = (P, t, a = 1) => P.rot('tail1', wave(t, 0.5) * 6 * a, wave(t, 0.4) * 16 * a, 0).rot('tail2', 0, wave(t, 0.4, 1) * 14 * a, 0).rot('tailhead', wave(t, 0.5, 2) * 10 * a, wave(t, 0.4, 2) * 20 * a, 0);
const thump = (P, t0, n = 1) => P.burst(t0, 'soundring', 'drum', DRUM, { dir: [0, 1, 0], tint: [1, 0.85, 0.6] }).burst(t0, 'note', 'drum', DRUM, { n, dir: [0, 1, 0.3], speed: 1.2, spread: 0.6 });
const shared = sharedClips(R, {
  headTop: HEAD, weight: 0.4,
  downPose: (P, k, t) => { onBack(P, R, k, t, { lift: 3.4 }); mouth(P, 0.5 * k, k); P.rot('drum', -30 * k, 0, 0); },
  // a cat nap, sat back on its haunches, chin on the drum
  sleepPose: (P, br) => { legs(P, R, { y: -3.4 + br * 0.15, fR: [0, 2.2], fL: [0, 2.2], spread: 14 }); P.rot('torso', 16 + br * 1.5, 0, 0).rot('head', 26 + br * 3, 0, 12); arms(P, { out: 10, fwd: 30, bend: 60 }); mouth(P, 0.05, 0.2); },
});
for (const k of ['hurt', 'faint']) { const f0 = shared[k].f; shared[k].f = (P, t, cx) => { f0(P, t, cx); mouth(P, 0.7, k === 'faint' ? 1 : 0.2); }; }
export const anim = {
  start: 'idle', seed: 41,
  breathe: { bone: 'torso', amp: 0.02, per: 2.2 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.0, 4.4], dur: 0.11 },
  look: { bone: 'head', yaw: 30, pitch: 12, speed: 6 },
  springs: [
    { bone: 'mane', tip: [0, 4, 0], k: 170, d: 9, gain: 0.8, max: 14, axes: [1, 0.3, 1] },
    { bone: 'tail1', tip: [0, 0, -5], k: 140, d: 7, gain: 0.8, max: 16 },
    { bone: 'tail2', tip: [0, 0, -4], k: 120, d: 7, gain: 0.9, max: 18 },
    { bone: 'tailhead', tip: [0, 0, -2], k: 120, d: 7, gain: 0.9, max: 18 },
    { bone: 'earR', tip: [0, 2, 0], k: 260, d: 12, gain: 0.5, max: 12 },
    { bone: 'earL', tip: [0, 2, 0], k: 260, d: 12, gain: 0.5, max: 12 },
    { bone: 'drum', tip: [0, -2, 3], k: 260, d: 12, gain: 0.3, max: 6 },
    { bone: 'tongue', tip: [0, 0, 2.5], k: 110, d: 6, gain: 1.1, max: 28 },
  ],
  faces: { eyes: EYES.slot },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'drumsolo', 'drumsolo', 'groom'] },
  clips: {
    ...shared,
    // a swaggering lean, a lazy backbeat tapped on the tortoiseshell, an ear flick, a purr
    idle: { len: 2.0, loop: true, f(P, t, c) {
      const b = bounce(t, 0.5, { squash: 0.04, stretch: 0.02 }), s = Math.sin(t * TAU * 0.5), r = bump(t % 1, 0.0, 0.18), l = bump(t % 1, 0.5, 0.68), flick = c.loopN % 3 === 2 ? bump(t, 1.2, 1.4) : 0;
      legs(P, R, { y: -0.3 + b.u * 0.4, roll: 2.5 * s }); P.sq('torso', b.sq).rot('torso', 0, 5 * s, 0).rot('head', 4 - b.u * 4, -8 * s, 4 * s);
      sticks(P, r, l * 0.6); tailSway(P, t); P.rot('earR', 0, 0, 20 * flick); mouth(P, 0.06, 0);
      glances(P, t, [[0, 0], [-0.35, 0], [0.3, 0.05], [0, 0]], 0.5);
      P.burst(0.06, 'note', 'drum', DRUM, { n: 1, dir: [0.3, 1, 0.3], speed: 0.6 });
    } },
    // a prowl: shoulders rolling, the drum swinging, the snake-tail lashing
    walk: { len: 0.8, loop: true, f(P, t) {
      const w = walkCycle(P, R, t, { len: 0.8, stride: 1.8, lift: 1.2, bob: 0.5, sway: 5, swing: 10, twist: 8, crouch: 0.6, lean: 6, out: 12, bend: 50 });
      P.rot('head', -6, -w.s * 6, 0).rot('torso', 0, w.s * 6, w.c * 3); sticks(P, 0, 0, 0.6); tailSway(P, t * 2, 1.2); mouth(P, 0.08, 0);
    } },
    // battle cry: sticks thrown up, a lion's roar with the mane flying, a rolling thunder off the drum
    cry: { len: 2.2, next: 'idle', f(P, t) {
      const crouch = bump(t, 0, 0.34), up = seg(t, 0.3, 0.48, E.back) * (1 - seg(t, 1.6, 2.0, E.inout));
      legs(P, R, { y: -1.6 * crouch + 0.4 * up, pitch: -8 * up, spread: 8 * up }); P.rot('torso', 10 * crouch - 14 * up, 0, 0).rot('head', 16 * crouch - 28 * up + wave(t, 11) * 3 * up, 0, 0);
      arms(P, { out: 30 * crouch + 60 * up, fwd: 30 + 100 * up, bend: 40 - 20 * up }); mouth(P, 0.1 + 0.9 * up, 0.6 * up); tailSway(P, t * 3, up);
      emote(P, crouch > 0.3 ? 'angry' : up > 0.3 ? 'shut' : 'open'); P.blinkOK = false;
      if (up > 0.6) P.stream('soundring', 'head', MOUTH, { rate: 6, dir: [0, 0.3, 1], tint: [1, 0.9, 0.5] });
      P.burst(0.55, 'ring', 'root', [0, 1, 0], {}).burst(0.55, 'kstar', 'head', HEAD, { n: 6, speed: 1.4 }).burst(0.5, 'dust', 'root', [0, 0.5, 0], { n: 10, spread: 1, speed: 1.2 });
    } },
    // Hooligan: a crouch, a pounce, both forepaws raking down — sticks and all
    attack: { len: 1.1, next: 'idle', f(P, t) {
      const back = seg(t, 0, 0.26, E.out) * (1 - seg(t, 0.28, 0.36, E.in)), air = bump(t, 0.3, 0.6), rake = seg(t, 0.5, 0.6, E.out) * (1 - seg(t, 0.72, 1.05, E.inout)), go = seg(t, 0.3, 0.56, E.out) * (1 - seg(t, 0.75, 1.05, E.inout));
      legs(P, R, { y: -2.0 * back - 1.0 * rake, z: -0.8 * back, pitch: 14 * back + 20 * rake, fR: [0, 1.6 * go], fL: [0, -0.8 * go] });
      P.pos('root', 0, 3 * air, 4.4 * go - 1 * back); P.rot('head', 12 * back - 10 * air, 0, 0);
      arms(P, { out: 30 * back + 20 * air, fwd: 20 + 120 * air - 40 * rake, bend: 40 - 20 * air }); mouth(P, 0.3 + 0.6 * Math.max(air, rake), 0);
      emote(P, back > 0.2 || go > 0.2 ? 'angry' : 'open'); P.blinkOK = false;
      P.burst(0.58, 'spark', 'handR', [-6.3, 9, 2], { n: 2 }).burst(0.58, 'spark', 'handL', [6.3, 9, 2], { n: 2 }).burst(0.6, 'star', 'head', [0, 16, 10], { n: 4 });
    } },
    // special: a hundred-thousand-year drum roll — a blur of sticks, rings of sound rolling out, a double-hit finish
    special: { len: 2.4, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.2, E.back) * (1 - seg(t, 1.95, 2.3, E.inout)), roll = t < 1.6 ? Math.sin(t * TAU * 8) : 0, fin = bump(t, 1.6, 1.85);
      legs(P, R, { y: -0.8 * on - 0.6 * fin, spread: 8 * on }); P.rot('torso', 6 * on + 10 * fin, 0, 0).rot('head', 10 * on + wave(t, 8) * 6 * on * (t < 1.6 ? 1 : 0), 0, 0);
      sticks(P, Math.max(0, roll) * on + fin, Math.max(0, -roll) * on + fin, 1 + 0.3 * bump(t, 1.4, 1.65)); mouth(P, 0.2 + 0.4 * fin, 0); tailSway(P, t * 3, on);
      P.face('eyes', fin > 0.3 ? 'shut' : on > 0.4 ? 'angry' : undefined); P.blinkOK = false;
      if (on > 0.5 && t < 1.6) P.stream('soundring', 'drum', DRUM, { rate: 8, dir: [0, 1, 0], tint: [1, 0.85, 0.6] }).stream('note', 'drum', DRUM, { rate: 10, dir: [0, 1, 0.3], speed: 1.4, spread: 0.7, key: 'n' });
      P.burst(1.75, 'ring', 'root', [0, 1, 2], { scale: 2 }).burst(1.75, 'dust', 'root', [0, 0.5, 0], { n: 12, spread: 1, speed: 1.6 });
    } },
    // victory: both sticks flung spinning into the air, caught, and a roar with the sticks crossed overhead
    win: { len: 2.6, next: 'idle', f(P, t) {
      const toss = t > 0.25 && t < 1.15 ? Math.sin(((t - 0.25) / 0.9) * Math.PI) : 0, up = seg(t, 0.1, 0.3, E.back) * (1 - seg(t, 2.2, 2.55, E.inout)), roar = seg(t, 1.25, 1.4, E.back) * (1 - seg(t, 2.1, 2.45, E.inout));
      legs(P, R, { y: -1.0 * bump(t, 1.1, 1.3), spread: 8 * roar }); arms(P, { out: 30 * up, fwd: 150 * up, bend: 20 });
      P.pos('stickR', 0, 12 * toss, 0).rot('stickR', t * 1400 * (toss > 0 ? 1 : 0), 0, 0).pos('stickL', 0, 12 * toss, 0).rot('stickL', -t * 1400 * (toss > 0 ? 1 : 0), 0, 0);
      P.rot('stickR', 0, 0, -40 * roar).rot('stickL', 0, 0, 40 * roar); P.rot('head', -24 * roar - 10 * toss, 0, 0); mouth(P, 0.2 + 0.8 * roar, 0.5 * roar);
      P.face('eyes', toss > 0.3 ? 'wide' : roar > 0.3 ? 'shut' : 'happy'); P.blinkOK = false;
      P.burst(1.3, 'kstar', 'head', HEAD, { n: 8, speed: 1.6 }).burst(1.3, 'confetti', 'head', HEAD, { n: 18, speed: 1.4 }).burst(1.3, 'soundring', 'head', MOUTH, { dir: [0, 0.3, 1] });
    } },
    // the headbang groove: a heavy hit on every beat with the whole mane flying, hips rolling, a stick twirl,
    // and both sticks thrown up to point at the sky
    dance: { len: 3.0, next: 'idle', f(P, t) {
      const bt = t * 2, n = Math.floor(bt), ph = bt - n, hit = Math.sin(Math.min(1, ph * 1.8) * Math.PI), side = n % 2 ? 1 : -1, on = seg(t, 0, 0.15) * (1 - seg(t, 2.3, 2.4)), fin = seg(t, 2.35, 2.5, E.back) * (1 - seg(t, 2.8, 3.0));
      legs(P, R, { y: -0.9 * hit * on, roll: side * 6 * on, spread: 6 * fin });
      P.rot('head', 30 * hit * on - 20 * fin, 0, side * 6 * on).rot('torso', 8 * hit * on, side * 8 * on, 0).rot('mane', 10 * hit * on, 0, 0);
      sticks(P, side > 0 ? hit * on : 0.2 * on, side < 0 ? hit * on : 0.2 * on, on); arms(P, { out: 30 * fin, fwd: 160 * fin, bend: 0 });
      P.rot('stickR', t > 1.5 && t < 2.0 ? (t - 1.5) * 1440 : 0, 0, 0);
      mouth(P, 0.2 + 0.4 * hit * on + 0.5 * fin, 0.4 * fin); tailSway(P, t * 2, on);
      P.face('eyes', fin > 0.3 ? 'smug' : on > 0.5 ? (hit > 0.5 ? 'shut' : 'happy') : undefined); P.blinkOK = false;
      for (const t0 of [0.02, 0.52, 1.02, 1.52, 2.02]) thump(P, t0);
      P.burst(2.4, 'kstar', 'head', HEAD, { n: 8, speed: 1.5 }).burst(2.4, 'sparkle', 'head', HEAD, { n: 10 });
    } },
    // signature: the drum solo — sticks twirled through the fingers, a flurry too fast to see, one stick flung
    // sky-high while the other keeps time, a catch behind the back… and a roaring double crash
    drumsolo: { len: 4.2, next: 'idle', f(P, t) {
      const on = seg(t, 0, 0.2, E.back) * (1 - seg(t, 3.8, 4.2, E.inout)), twirl = bump(t, 0.2, 1.0), flurry = seg(t, 1.0, 1.1) * (1 - seg(t, 1.9, 2.0)), toss = t > 2.0 && t < 3.0 ? Math.sin(((t - 2.0) / 1.0) * Math.PI) : 0, crash = bump(t, 3.15, 3.6);
      const fr = Math.sin(t * TAU * 10) * flurry;
      legs(P, R, { y: -0.6 * on - 1.2 * crash, spread: 8 * on }); P.rot('torso', 6 * on + 12 * crash, 0, 0).rot('head', -14 * toss + 12 * crash + wave(t, 10) * 4 * flurry, 0, 0);
      sticks(P, Math.max(0, fr) + crash + (t > 2.0 && t < 3.0 ? bump((t - 2) % 0.5, 0, 0.2) : 0), Math.max(0, -fr) + crash, on);
      P.rot('stickR', twirl * t * 1600, 0, 0).rot('stickL', -twirl * t * 1600, 0, 0);
      P.pos('stickL', 0, 16 * toss, -2 * toss).rot('stickL', toss > 0 ? t * 1800 : 0, 0, 0); arm(P, 'L', { out: 30 * toss, fwd: 60 * toss, bend: 0 });
      mouth(P, 0.15 + 0.8 * crash, 0.5 * crash); tailSway(P, t * 3, on);
      P.face('eyes', crash > 0.3 ? 'shut' : toss > 0.3 ? 'wide' : flurry > 0.3 ? 'angry' : twirl > 0.3 ? 'smug' : undefined); P.blinkOK = false;
      if (flurry > 0.5) P.stream('soundring', 'drum', DRUM, { rate: 10, dir: [0, 1, 0], tint: [1, 0.85, 0.6] }).stream('note', 'drum', DRUM, { rate: 14, dir: [0, 1, 0.3], speed: 1.4, spread: 0.7, key: 'n' });
      P.burst(2.95, 'sweat', 'head', [5, 22, 3], { n: 2, dir: [1, 1, 0], speed: 1 }).burst(2.98, 'star', 'handL', [6.3, 10, 2], { n: 3 });
      P.burst(3.3, 'ring', 'root', [0, 1, 2], { scale: 2.2 }).burst(3.3, 'kstar', 'head', HEAD, { n: 10, speed: 1.8 }).burst(3.3, 'sparkle', 'drum', DRUM, { n: 14, speed: 1.6 }).burst(3.3, 'dust', 'root', [0, 0.5, 0], { n: 12, spread: 1, speed: 1.4 });
    } },
    // a cat at heart: it licks a paw, wipes it over its face and ear, and looks very pleased with itself
    groom: { len: 3.0, next: 'idle', f(P, t) {
      const lift = seg(t, 0.1, 0.4, E.inout) * (1 - seg(t, 2.4, 2.8, E.inout)), lick = bump(t, 0.4, 1.3), wipe = bump(t, 1.3, 2.3), pleased = bump(t, 2.3, 3.0);
      legs(P, R, { y: -0.6 * lift, roll: 3 * lift }); sticks(P, 0, 0, 1 - lift);
      arm(P, 'R', { out: 10 * lift + 30 * wipe, fwd: 110 * lift + 20 * wipe, bend: 110 * lift - 30 * wipe, wrist: 40 * lift });
      P.rot('head', 10 * lick - 10 * wipe - 8 * pleased, -18 * lick + 20 * wipe, -10 * lick + 16 * wipe).rot('earR', 0, 0, 30 * wipe * Math.abs(Math.sin(t * 12)));
      mouth(P, 0.25 * lick * Math.abs(Math.sin(t * 14)) + 0.1, lick * Math.abs(Math.sin(t * 14)));
      P.face('eyes', lick > 0.3 ? 'closed' : wipe > 0.3 ? 'happy' : pleased > 0.3 ? 'smug' : undefined); P.blinkOK = false; tailSway(P, t, 0.6);
      P.burst(2.4, 'sparkle', 'head', [0, 20, 6], { n: 6 });
    } },
  },
};
def.anim = anim;
// the ultra-drip form: black-lacquer fur with gold tips, a gold drum shell and studs, white paint and green eyes kept
def.dripForm = kissForm({ keep: [C.eye, C.eyeLo, C.eyeHi, C.green], swap: { [C.furTip]: '#ffd84a', [C.furHi]: '#6a5030' } });
