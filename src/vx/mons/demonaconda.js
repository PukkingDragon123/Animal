// Demonaconda — a stone-split final of the Kissmet line (Draco/Pyro): the Demon, a KISS homage that
// leans into the chimera's snake. A blood-red serpent rising out of its own coils into an upright,
// armoured torso: black studded armour with a silver bat on the chest and spiked pauldrons, great
// black bat wings with blood-red veins, silver talons, and a long dragon-snake head with a white
// greasepaint face, black bat-wing flares rising off both eyes, slick black hair pulled up into a
// topknot, two silver horns and a forked tongue that never ends. Chimera hints: a black lion's
// ruff round its shoulders, a studded turtle backplate between the wings, eagle talons.
// Signature: the God of Thunder — lightning crowns its horns, then the tongue unrolls all the way.
// Drip (one per tier): 1 spiked choker | flaming torch · 2 crossed chain bandolier | giant bat-wing
// pauldrons · 3 axe-head bass on its back | horned iron crown.
import {
  K, CH, B, both, at, fill, isSide, shift, ramp, leather, chrome, spike, spikeP, painted, shellP, scalesP, tongueP, forkP, flames, inPoly, chain,
  chimMane, cobEyes, mouth, glances, kissForm, E, seg, bump, wob, wave, TAU,
} from './kiss_parts.js';

const C = { eye: '#ffc81e', eyeLo: '#b0600a', eyeHi: '#fff08a', red: '#b0102a', redHi: '#ff4a52', redLo: '#4a0414', belly: '#ecdcc2', bellyLo: '#b8a084', bellyLine: '#6a5038', vein: '#6a1424', membrane: '#24080e', membraneHi: '#3a0e18' };
// ---------------------------------------------------------------- painters
const scaleP = scalesP(C.red, { size: 4, top: C.redHi, bottom: C.redLo });
const scaleBig = scalesP(C.red, { size: 5, top: C.redHi, bottom: C.redLo });
// the serpent's belly plates, banded in model space
const bellyP = (axis = 'y') => (p, w, h, face, cube) => {
  if (face !== 'south') return scaleP(p, w, h, face, cube);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const P3 = at(face, cube, x, y), v = (((axis === 'y' ? P3[1] : P3[2]) / 1.2) % 1 + 1) % 1; p.px(x, y, v < 0.18 ? C.bellyLine : v < 0.35 ? C.bellyLo : C.belly); }
  for (let y = 0; y < h; y++) { p.px(0, y, C.redLo); p.px(w - 1, y, C.redLo); }
};
const coilP = (p, w, h, face, cube) => { scaleBig(p, w, h, face, cube); if (face === 'down') fill(p, w, h, (x, y) => (y % 4 === 0 ? C.bellyLine : C.belly)); };
const armour = leather({ studs: 4 });
const BATSHAPE = [[0, 14.6], [0.6, 13.9], [1.5, 14.5], [2.6, 14.6], [3.2, 13.6], [2.6, 12.9], [2.0, 13.3], [1.4, 12.5], [0.7, 12.9], [0, 11.6], [-0.7, 12.9], [-1.4, 12.5], [-2.0, 13.3], [-2.6, 12.9], [-3.2, 13.6], [-2.6, 14.6], [-1.5, 14.5], [-0.6, 13.9]];
const chestP = painted(armour, { marks: [{ fn: (X, Y) => (inPoly(BATSHAPE, X, Y) ? (Y > 13.8 ? K.silver[0] : K.silver[1]) : null) }] });
const ruffP = chimMane(61, { s: 6, tipH: 3 }), hairP = chimMane(67, { s: 5, tipH: 2.5, tip: '#2a2238' });
const shellBack = shellP({ cols: CH.shell, stud: true, size: 2.4 });
const horn = spikeP();
const talon = spikeP({ down: true });
// the face: white paint over the brow, black bat-wing flares rising off both eyes to the temples, a widow's peak
const EYE = [2.0, 21.3];
const batFlare = (s) => [[-1.6, -0.9], [0.2, -1.3], [1.7, -0.8], [2.6, 0.4], [3.4, 2.1], [2.3, 1.4], [2.4, 2.9], [1.3, 1.6], [0.5, 2.6], [-0.2, 1.2], [-1.2, 1.4], [-1.8, 0.4]].map(([x, y]) => [s * EYE[0] + x * s, EYE[1] + y]);
const BATR = batFlare(-1), BATL = batFlare(1);
const faceP = painted(scaleP, { mask: { x: 0, y: 20.9, rx: 4.0, ry: 3.4, col: K.white, lo: K.whiteLo, line: K.whiteLine },
  marks: [{ fn: (X, Y) => (inPoly(BATR, X, Y) || inPoly(BATL, X, Y) || (Math.abs(X) < 0.5 - (Y - 22.3) * 0.5 && Y > 22.3) ? K.paint : null) }] });
const whiteP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'down' ? K.whiteLo : face === 'up' ? K.white : ramp([K.white, K.white, K.whiteLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
const snoutP = (p, w, h, face) => {
  if (face === 'down') { fill(p, w, h, () => K.mouth); return; }
  whiteP(p, w, h, face);
  if (face === 'up') { const m = Math.floor(w / 2); p.rect(m - 3, h - 3, 2, 2, K.paint).rect(m + 2, h - 3, 2, 2, K.paint); }
  if (isSide(face)) for (let x = 0; x < w; x++) { p.px(x, h - 1, K.paint); p.px(x, h - 2, K.paint); }        // black lips
};
const jawP = (p, w, h, face) => { if (face === 'up') { fill(p, w, h, (x, y) => (x < 1 || x >= w - 1 ? '#5a1424' : K.mouth)); return; } whiteP(p, w, h, face); if (isSide(face)) for (let x = 0; x < w; x++) { p.px(x, 0, K.paint); p.px(x, 1, K.paint); } };
const fangP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'down' || y === h - 1 ? K.whiteLo : K.white));
// bat-wing membrane (plane z): black-red, veined, its lower edge scalloped between the finger bones
const FING = [[0.02, 6.0], [0.32, 7.4], [0.63, 8.8], [1.0, 12.4]];   // [u along the wing, tip height]
const membraneP = (p, w, h) => {
  const top = 16.2, Y = (y) => top - (y + 0.5) / 3;
  for (let x = 0; x < w; x++) {
    const u = (x + 0.5) / w; let i = 0; while (i < FING.length - 2 && u > FING[i + 1][0]) i++;
    const [u0, y0] = FING[i], [u1, y1] = FING[i + 1], f = Math.max(0, Math.min(1, (u - u0) / (u1 - u0))), bot = y0 + (y1 - y0) * f + Math.sin(f * Math.PI) * 2.2;
    for (let y = 0; y < h; y++) { const yy = Y(y); if (yy < bot) continue; const vein = (x + Math.round(yy * 2)) % 9 === 0 || Math.abs(yy - bot) < 0.35; p.px(x, y, vein ? C.vein : (x + y) % 5 === 0 ? C.membraneHi : C.membrane); }
  }
};
const boneP = leather({ cols: ['#4a4456', '#24202c', '#141218', '#08070a'] });
// drip painters
const SILVER = { hi: '#ffffff', base: '#c8ccd8', lo: '#8a90a4', deep: '#4a5064', spec: '#ffffff' };
const iron = chrome({ cols: ['#c8c8d4', '#7a7a8a', '#4a4a58', '#22222a'] });
const torchP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? '#5a3a20' : y % 3 === 0 ? '#2a1a10' : '#6a4426'));
const axeBody = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? '#3a3444' : y === 0 ? '#4a4456' : '#16141c')); if (face === 'north') { const m = Math.floor(w / 2); for (let y = 2; y < h - 2; y++) for (const dx of [-1, 0, 1]) if (y % 3) p.px(m + dx, y, '#d8d8e0'); } };
const bladeP = (p, w, h) => { const pts = [[w, h * 0.12], [w * 0.35, 0], [0, h * 0.18], [w * 0.25, h * 0.5], [0, h * 0.82], [w * 0.35, h], [w, h * 0.88]]; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (!inPoly(pts, x + 0.5, y + 0.5)) continue; const edge = !inPoly(pts, x - 0.6, y + 0.5) || !inPoly(pts, x + 0.5, y - 0.6) || !inPoly(pts, x + 0.5, y + 1.6); p.px(x, y, edge ? K.silver[(x + y) % 2] : '#16141c'); } };
const neckP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'north' ? (y % 3 === 0 ? K.silver[2] : '#2a2018') : '#16141c'));

// ---------------------------------------------------------------- the model
// snake eyes in the Cobblemon block language: no whites, a sharp slanted block, two flat golds, a slanted slit pupil, square glints
const EYE_MAPS = {
  open: ['ll........', '.lllllll..', '.IhhIkIIll', '.iiiikkiii', '..cciikcc.'],
  angry: ['l.........', 'lll.......', '.Ihhlll...', '.iiiikllll', '..iiiikii.'],
  sad: ['..........', '......lll.', '...llllIl.', '.llliikiii', '..iiiikii.'],
  happy: ['..........', '...llll...', '..llllll..', '.lll..lll.', '.ll....ll.'],
  closed: ['..........', '..........', 'l.........', '.lllllllll', '..lllllll.'],
  shock: ['.lllllll..', '.iiiiiilll', '.iiiiiiiii', '.iiiikiiii', '..iiiiiii.'],
  wide: ['.lllllll..', '.IIIIIIlll', '.iihkiiiii', '.iiikiiiii', '..iiiiiii.'],
  smug: ['..........', '..........', '.lllllllll', '.iiiikkiii', '..iiiikii.'],
  sleepy: ['..........', '..........', '..........', '.lllllllll', '..iiiikii.'],
  teary: ['ll........', '.lllllll..', '.IhhIkIIll', '.iiiikkiii', '..bbbbbbb.'],
};
const EYES = cobEyes({ at: [-EYE[0], EYE[1], 5.86], line: '#0a0406', pupilColor: '#120404', iris: C.eye, irisDark: C.eyeLo, accent: C.eyeHi, maps: EYE_MAPS });
const A = (id, c) => ({ ...c, id, hide: true });
const sp = (id, x, y, z, s, len, rot) => spike(x, y, z, s, len, { x: { pivot: [x, y, z], rot } }).map((c) => (id ? A(id, c) : c));
// a coil: n scaled segments round a ring of radius r (centre cz), y from y0, thickness th
const ring = (r, y0, th, n, cz, a0 = 0) => Array.from({ length: n }, (_, i) => {
  const a = a0 + (i / n) * 360, ar = (a * Math.PI) / 180, cx = Math.sin(ar) * r, zc = cz + Math.cos(ar) * r, L = 2 * r * Math.sin(Math.PI / n) + 0.9;
  return B(cx - L / 2, y0, zc - th / 2, cx + L / 2, y0 + th, zc + th / 2, coilP, { pivot: [cx, y0 + th / 2, zc], rot: [0, a, 0] });
});
const BANDOLIER = (s) => chain([[-4.0 * s, 15.4, 5.6], [-2.0 * s, 13.4, 6.0], [0, 11.8, 6.0], [2.2 * s, 10.2, 5.9], [4.0 * s, 9.4, 5.4]], { len: 1.1, w: 0.8, t: 0.35, step: 0.85, gold: SILVER }).map((c) => A('acc-chains', c));
const RIGHT = [
  { name: 'armR', parent: 'torso', pivot: [-5.0, 14.6, 3.2], cubes: [
    B(-6.8, 11.2, 1.8, -4.4, 15.4, 4.6, scaleP), B(-7.4, 13.8, 1.2, -3.8, 16.2, 5.2, armour), ...sp(null, -6.2, 16.2, 3.2, 1.0, 2.4, [0, 0, 22]),
    // dripped (or): giant bat-wing pauldrons
    A('acc-pads', B(-8.6, 13.4, 0.6, -3.6, 16.8, 5.8, armour)), ...sp('acc-pads', -8.0, 16.6, 1.4, 1.1, 3.2, [0, 0, 30]), ...sp('acc-pads', -8.0, 16.6, 4.6, 1.1, 3.2, [0, 0, 30]), ...sp('acc-pads', -8.4, 15.0, 3.2, 1.0, 2.6, [0, 0, 70]),
  ] },
  { name: 'foreR', parent: 'armR', pivot: [-5.6, 11.4, 3.2], cubes: [B(-6.7, 7.8, 1.9, -4.5, 11.6, 4.5, armour), ...sp(null, -6.7, 9.8, 3.2, 0.7, 1.6, [0, 0, 90])] },
  { name: 'handR', parent: 'foreR', pivot: [-5.6, 7.8, 3.2], cubes: [
    B(-7.0, 6.2, 1.8, -4.2, 8.0, 4.6, scaleP),
    ...[-6.9, -6.0, -5.1].map((x) => B(x, 4.6, 3.6, x + 0.65, 6.3, 4.3, talon, { pivot: [x + 0.3, 6.2, 4.0], rot: [-14, 0, 0] })), B(-4.6, 5.2, 2.2, -4.0, 6.4, 2.9, talon),
  ] },
  { name: 'wingR', parent: 'torso', pivot: [-2.8, 14.6, 0.4], rot: [0, -10, -24], cubes: [
    B(-15.0, 15.6, -0.2, -2.8, 16.6, 0.8, boneP),
    B(-15.0, 6.0, -0.05, -14.3, 15.8, 0.55, boneP), B(-11.4, 7.4, -0.05, -10.7, 15.8, 0.55, boneP), B(-7.6, 8.8, -0.05, -6.9, 15.8, 0.55, boneP),
    ...sp(null, -15.1, 16.4, 0.3, 0.8, 2.4, [0, 0, 20]),
    B(-15.0, 5.6, 0.25, -2.8, 16.2, 0.25, membraneP, { plane: 'z', outline: false }),
  ] },
];
export const def = {
  name: 'demonaconda', ppu: 3, scale: 0.6, outline: { color: '#0c0408', px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    // the coils on the ground: a big ring, a smaller ring on top
    { name: 'coil', parent: 'root', pivot: [0, 1.6, -1.0], cubes: [...ring(5.0, 0, 3.2, 7, -1.0), ...ring(3.2, 2.6, 2.8, 6, -1.4, 30)] },
    // the tail tip slips out of the coils at the front and curls, ending in a silver spike
    { name: 'tip1', parent: 'coil', pivot: [-4.8, 1.2, 2.4], rot: [0, -34, 0], cubes: [B(-5.7, 0.2, 2.0, -3.9, 2.1, 7.0, coilP)] },
    { name: 'tip2', parent: 'tip1', pivot: [-4.8, 1.1, 6.6], rot: [0, 50, 0], cubes: [B(-5.4, 0.3, 6.4, -4.2, 1.8, 9.8, scaleP), ...sp(null, -4.8, 1.05, 9.6, 1.0, 2.2, [90, 0, 0])] },
    // the serpent body rising out of the coils
    { name: 'waist', parent: 'root', pivot: [0, 4.0, 3.0], cubes: [B(-2.9, 3.0, 1.0, 2.9, 10.0, 5.6, bellyP('y'))] },
    { name: 'torso', parent: 'waist', pivot: [0, 9.6, 3.2], cubes: [
      B(-4.4, 9.0, 0.6, 4.4, 15.6, 5.8, chestP),
      B(-3.8, 9.8, -1.6, 3.8, 15.0, 0.8, shellBack),
      B(-5.4, 14.4, 0.0, 5.4, 16.8, 6.4, ruffP),
      // normal: a spiked choker
      A('acc-collar', B(-3.0, 16.4, 1.4, 3.0, 17.4, 5.6, armour)), ...[-1.6, 0, 1.6].flatMap((x) => sp('acc-collar', x, 16.9, 5.5, 0.6, 1.2, [90, 0, 0])),
      // dripped: a crossed chain bandolier
      ...BANDOLIER(1), ...BANDOLIER(-1),
    ] },
    // ultra dripped: an axe-head bass slung on its back
    { name: 'axe', parent: 'torso', pivot: [0, 12.0, -2.0], rot: [0, 0, -40], cubes: [
      A('acc-axe', B(-1.6, 6.4, -3.0, 1.6, 10.6, -2.0, axeBody)),
      A('acc-axe', B(-4.4, 5.6, -2.5, -1.6, 11.6, -2.5, bladeP, { plane: 'z' })),
      A('acc-axe', B(-0.35, 10.6, -2.8, 0.35, 18.2, -2.2, neckP)),
      A('acc-axe', B(-0.7, 18.2, -2.9, 0.7, 19.8, -2.1, axeBody)),
    ] },
    { name: 'head', parent: 'torso', pivot: [0, 16.6, 3.2], cubes: [
      B(-4.0, 16.4, 0.2, 4.0, 23.2, 5.8, scaleP, { faces: { south: faceP } }),
      B(-2.7, 16.4, 5.8, 2.7, 19.4, 10.4, snoutP),
      B(-2.3, 15.6, 9.4, -1.6, 16.6, 10.0, fangP), B(1.6, 15.6, 9.4, 2.3, 16.6, 10.0, fangP),
      // slick black hair, swept back
      B(-4.3, 21.4, -0.4, 4.3, 23.8, 4.6, hairP), B(-4.4, 17.6, -0.6, -3.8, 22.6, 3.4, hairP), B(3.8, 17.6, -0.6, 4.4, 22.6, 3.4, hairP, { mirror: true }),
      // silver horns from the temples, raked back
      ...sp(null, -3.4, 22.6, 2.2, 1.2, 3.6, [-30, 0, 22]), ...sp(null, 3.4, 22.6, 2.2, 1.2, 3.6, [-30, 0, -22]),
      // ultra (or): a horned iron crown
      A('acc-crown', B(-4.6, 23.4, -0.6, 4.6, 24.4, 5.0, iron)), ...[-3.2, 0, 3.2].flatMap((x, i) => sp('acc-crown', x, 24.4, 4.6, i === 1 ? 1.2 : 0.9, i === 1 ? 2.8 : 2.0, [-6, 0, -x * 6])),
    ] },
    ...EYES.bones,
    { name: 'knot', parent: 'head', pivot: [0, 23.4, 1.8], cubes: [B(-1.4, 23.2, 0.6, 1.4, 25.2, 3.0, hairP), B(-1.0, 25.0, 0.4, 1.0, 27.6, 2.4, hairP, { pivot: [0, 25.2, 1.4], rot: [-24, 0, 0] })] },
    { name: 'jaw', parent: 'head', pivot: [0, 16.8, 5.2], cubes: [B(-2.4, 15.2, 4.8, 2.4, 16.6, 10.0, jawP)] },
    { name: 'tongue', parent: 'jaw', pivot: [0, 16.2, 6.4], cubes: [B(-1.0, 15.95, 6.2, 1.0, 16.45, 11.2, tongueP())] },
    { name: 'tongue2', parent: 'tongue', pivot: [0, 16.2, 11.0], cubes: [B(-0.9, 15.97, 11.0, 0.9, 16.43, 15.6, tongueP()), B(-1.0, 16.2, 15.4, 1.0, 16.2, 17.2, forkP(K.tongue[1]), { plane: 'y', outline: false })] },
    // normal (or): a flaming torch in the left talons
    { name: 'torch', parent: 'handL', pivot: [5.6, 6.6, 3.2], rot: [30, 0, 0], cubes: [A('acc-torch', B(5.2, 4.0, 2.8, 6.0, 12.0, 3.6, torchP))] },
    { name: 'flame', parent: 'torch', pivot: [5.6, 12.0, 3.2], rot: [-30, 0, 0], cubes: [
      A('acc-torch', B(4.0, 11.6, 3.2, 7.2, 15.6, 3.2, flames(0, 0.95), { plane: 'z', glow: true })), A('acc-torch', B(5.6, 11.6, 1.6, 5.6, 15.6, 4.8, flames(2, 0.85), { plane: 'x', glow: true })),
    ] },
    ...both(...RIGHT),
  ],
};
def.drip = [
  [{ id: 'acc-collar', name: 'Spiked choker' }, { id: 'acc-torch', name: 'Flaming torch' }],
  [{ id: 'acc-chains', name: 'Crossed chain bandolier' }, { id: 'acc-pads', name: 'Bat-wing pauldrons' }],
  [{ id: 'acc-axe', name: 'Axe-head bass' }, { id: 'acc-crown', name: 'Horned iron crown' }],
];
def.attach = {
  head: { bone: 'head', at: [0, 23.8, 2.4], size: 9 },
  face: { bone: 'head', at: [0, 21.3, 5.9], size: 8 },
  neck: { bone: 'torso', at: [0, 16.6, 5.0], size: 7 },
  back: { bone: 'torso', at: [0, 12.4, -1.8], size: 8 },
};

// ---------------------------------------------------------------- animation
const HEAD = [0, 28, 3], MOUTH = [0, 16.2, 10.8], HORNS = [0, 26.5, 2];
// the torch flame (shown only while the torch is worn) flickers by squashing and leaning its planes
const torchFlicker = (P, t) => P.scl('flame', 1 + 0.12 * Math.sin(t * 31), 0.85 + 0.25 * Math.abs(Math.sin(t * 17)), 1).rot('flame', 0, 0, 8 * Math.sin(t * 23));
// bend the serpent: pitch (+ forward), yaw, roll — the waist takes a little more than the torso
const bend = (P, p = 0, y = 0, r = 0) => P.rot('waist', p * 0.55, y * 0.5, r * 0.55).rot('torso', p * 0.45, y * 0.5, r * 0.45);
const rise = (P, k) => P.scl('waist', 1, 1 + 0.32 * k, 1);
// the bat wings: open (0 folded … 1 spread … >1 reaching up), flap (deg)
const wings = (P, open, flap = 0) => P.rot('wingR', 0, -20 * open, -20 * open - flap).rot('wingL', 0, 20 * open, 20 * open + flap);
const armsTo = (P, o) => { for (const [S, g] of [['R', 1], ['L', -1]]) P.rot('arm' + S, -(o.fwd || 0), g * (o.twist || 0), -g * (o.out || 0)).rot('fore' + S, -(o.bend || 0), 0, 0); };
// the tongue: how far it unrolls (0 in … 1 out … 2.5 ridiculous) and how it hangs
const lick = (P, open, out, droop = 22, wag = 0) => { mouth(P, open, Math.min(1, out), { droop }); P.scl('tongue2', 1, 1, Math.max(0.05, out - 0.3)).rot('tongue2', droop * 0.8 * Math.min(1, out), wag, 0); };
const downPose = (P, k, t) => {
  bend(P, -30 * k, 0, 70 * k); P.pos('waist', 0, -1.6 * k, 0).rot('head', 10 * k, 0, 20 * k);
  wings(P, -0.3 * k, -10 * k); armsTo(P, { out: 40 * k, fwd: 20 * k, bend: 20 * k });
  P.rot('tip1', 0, wave(t, 0.6) * 6 * k, 0); lick(P, 0.6 * k, 1.6 * k, 50);
};
export const anim = {
  start: 'idle', seed: 29,
  breathe: { bone: 'torso', amp: 0.018, per: 2.4 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 4.6], dur: 0.12 },
  look: { bone: 'head', yaw: 32, pitch: 14, speed: 5 },
  springs: [
    { bone: 'knot', tip: [0, 3, 0], k: 170, d: 8, gain: 0.8, max: 16 },
    { bone: 'tongue', tip: [0, 0, 4], k: 110, d: 6, gain: 1.0, max: 26 },
    { bone: 'tongue2', tip: [0, 0, 4], k: 90, d: 5, gain: 1.3, max: 34 },
    { bone: 'wingR', tip: [-10, 0, 0], k: 190, d: 10, gain: 0.35, max: 10, axes: [1, 0.4, 1] },
    { bone: 'wingL', tip: [10, 0, 0], k: 190, d: 10, gain: 0.35, max: 10, axes: [1, 0.4, 1] },
    { bone: 'tip2', tip: [0, 0, 3], k: 120, d: 7, gain: 0.9, max: 20 },
    { bone: 'axe', tip: [0, 8, 0], k: 240, d: 12, gain: 0.3, max: 6 },
  ],
  faces: { eyes: EYES.slot },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'thunder', 'thunder', 'bloodspit'] },
  clips: {
    // swaying like a charmed cobra over its coils, wings breathing, the forked tongue tasting the air
    idle: { len: 2.4, loop: true, f(P, t, c) {
      const s = Math.sin((t / 2.4) * TAU), m = c.loopN % 3, taste = bump(t, 0.6, 1.0) + (m === 1 ? bump(t, 1.4, 1.8) : 0);
      bend(P, 3 + 2 * Math.cos((t / 2.4) * TAU * 2), 8 * s, 6 * s); rise(P, 0.05 + 0.05 * Math.cos((t / 2.4) * TAU * 2));
      P.rot('head', -4, -10 * s, -6 * s); wings(P, 0.2 + 0.1 * s, 3 * s); armsTo(P, { out: 14, fwd: 16, bend: 40 + 6 * s });
      P.rot('tip1', 0, 10 * s, 0).rot('tip2', 0, 16 * Math.sin((t / 2.4) * TAU + 1), 0);
      lick(P, 0.12 + 0.12 * taste, 0.3 + 0.9 * taste, 4, wave(t, 6) * 14 * taste);
      glances(P, t, [[0, 0], [-0.3, 0], [0.3, 0.05], [0, 0]], 0.6); torchFlicker(P, t);
      P.face('eyes', taste > 0.5 ? 'smug' : undefined);
    } },
    // a slither: the body ripples, the coils undulate, wings half open for balance
    walk: { len: 1.0, loop: true, f(P, t) {
      const ph = t * TAU, s = Math.sin(ph);
      bend(P, 8, 14 * s, 6 * Math.cos(ph)); P.pos('root', Math.sin(ph) * 0.6, 0.3 * Math.abs(Math.cos(ph)), 0).rot('coil', 0, 6 * s, 0);
      P.rot('head', -6, -12 * s, 0).rot('tip1', 0, 20 * Math.sin(ph + 1), 0).rot('tip2', 0, 26 * Math.sin(ph + 2), 0);
      wings(P, 0.4, 4 * Math.abs(s)); armsTo(P, { out: 18, fwd: 10 + 10 * s, bend: 30 }); lick(P, 0.15, 0.4, 6, wave(t, 5) * 10); torchFlicker(P, t);
    } },
    // battle cry: it rears to full height, wings thrown wide, and roars with the whole tongue out — a burst of fire and bats
    cry: { len: 2.4, next: 'idle', f(P, t) {
      const coilK = bump(t, 0, 0.36), up = seg(t, 0.32, 0.55, E.back) * (1 - seg(t, 1.8, 2.25, E.inout));
      bend(P, 12 * coilK - 16 * up, 0, 0); rise(P, -0.15 * coilK + 0.4 * up);
      wings(P, 0.2 + 1.2 * up, 14 * up * Math.abs(wave(t, 3))); armsTo(P, { out: 20 * coilK + 70 * up, fwd: 30 * up, bend: 40 });
      P.rot('head', 16 * coilK - 26 * up + wave(t, 11) * 3 * up, 0, 0);
      lick(P, 0.15 + 0.85 * up, 0.4 + 1.5 * up, 30, wave(t, 7) * 16 * up);
      P.face('eyes', coilK > 0.3 ? 'angry' : up > 0.3 ? 'wide' : undefined); P.blinkOK = false; torchFlicker(P, t);
      if (up > 0.6 && t < 1.3) P.stream('breath', 'head', MOUTH, { rate: 70, dir: [0, 0.6, 1], spread: 0.3 });
      P.burst(0.6, 'bat', 'head', HEAD, { n: 8, speed: 1.4 }).burst(0.6, 'ring', 'root', [0, 1, 2], {}).burst(0.65, 'kstar', 'head', HEAD, { n: 6, speed: 1.4 });
    } },
    // Lick It Up: the tongue lashes out, wraps a foe and reels it in — then a talon rake
    attack: { len: 1.1, next: 'idle', f(P, t) {
      const back = seg(t, 0, 0.22, E.out) * (1 - seg(t, 0.24, 0.3, E.in)), lash = seg(t, 0.26, 0.36, E.out) * (1 - seg(t, 0.55, 0.75, E.inout)), rake = bump(t, 0.62, 0.9);
      bend(P, -14 * back + 26 * lash + 20 * rake, 0, 0); P.pos('root', 0, 0, 2.6 * lash - 1 * back);
      lick(P, 0.2 + 0.8 * lash, 0.3 + 2.2 * lash, 2, 0); armsTo(P, { out: 30, fwd: -10 * back + 90 * rake, bend: 50 - 40 * rake });
      wings(P, 0.3 + 0.5 * back, 10 * lash);
      P.face('eyes', back > 0.2 || lash > 0.2 || rake > 0.2 ? 'angry' : undefined); P.blinkOK = false; torchFlicker(P, t);
      P.burst(0.36, 'spark', 'head', [0, 16.4, 22], { n: 2 }).burst(0.75, 'spark', 'handR', [-5.6, 5, 5], { n: 2 }).burst(0.75, 'star', 'head', [0, 17, 14], { n: 3 });
    } },
    // the fire breath: it coils back, the chest swells… and the sky catches
    special: { len: 2.4, next: 'idle', f(P, t) {
      const inhale = seg(t, 0, 0.55, E.inout) * (1 - seg(t, 0.62, 0.7, E.out)), fire = seg(t, 0.66, 0.76, E.back) * (1 - seg(t, 1.8, 2.15, E.inout)), shake = fire * wave(t, 14) * 1.2;
      bend(P, -18 * inhale + 14 * fire, 0, shake); rise(P, 0.1 * inhale + 0.2 * fire); P.scl('torso', 1 + 0.08 * inhale, 1 + 0.03 * inhale, 1 + 0.08 * inhale);
      P.rot('head', -20 * inhale + 8 * fire, 0, 0); wings(P, 0.4 * inhale + 1.0 * fire, 8 * fire * Math.abs(wave(t, 5)));
      armsTo(P, { out: 30 + 30 * fire, fwd: 20, bend: 40 }); lick(P, inhale > 0.3 ? 0 : 0.95 * fire, 0.2, 0);
      P.face('eyes', inhale > 0.3 ? 'closed' : fire > 0.3 ? 'angry' : t > 2.0 ? 'smug' : undefined); P.blinkOK = false; torchFlicker(P, t);
      if (fire > 0.5 && t < 1.85) P.stream('breath', 'head', MOUTH, { rate: 150, dir: [0, -0.05, 1], spread: 0.18 });
      P.burst(1.9, 'smoke', 'head', MOUTH, { n: 7, dir: [0, 1, 0.4], speed: 0.7 }).burst(0.72, 'ember', 'head', MOUTH, { n: 12, spread: 1 });
    } },
    hurt: { len: 0.75, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.06, E.out) * (1 - seg(t, 0.25, 0.75, E.inout));
      bend(P, -22 * k + wob(t, 0.06, 4, 4, 7), 0, wave(t, 14) * 4 * k); P.pos('root', 0, 0, -1.6 * k).rot('head', -16 * k, 0, wave(t, 12) * 8 * k);
      wings(P, 0.8 * k, -10 * k); armsTo(P, { out: 40 * k, fwd: 30 * k, bend: 50 * k }); lick(P, 0.7 * k, 0.6 * k, 40);
      P.face('eyes', t < 0.42 ? 'shut' : undefined); P.blinkOK = false; torchFlicker(P, t);
      P.burst(0.02, 'spark', 'torso', [0, 13, 6], { n: 2 }).burst(0.03, 'star', 'head', HEAD, { n: 3 }).burst(0.1, 'sweat', 'head', [4, 23, 4], { n: 2, dir: [1, 1, 0], speed: 1 });
    } },
    // it wavers, then topples sideways across its own coils, tongue lolling
    faint: { len: 2.4, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 1.0, 1.1)), fall = seg(t, 1.0, 1.5, E.bounce);
      bend(P, 0, wave(t, 1.3) * 16 * dizzy, wave(t, 1.6) * 10 * dizzy); P.rot('head', 0, wave(t, 1.3, 1) * 18 * dizzy, wave(t, 1.6) * 12 * dizzy);
      downPose(P, fall, t); P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.6, 'star', 'head', HEAD, { n: 5 }).burst(1.45, 'dust', 'root', [-6, 0.5, 2], { n: 14, spread: 1, speed: 1.4 });
    } },
    down: { len: 2.6, loop: true, f(P, t) { downPose(P, 1, t); P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5; } },
    // asleep: sunk onto its coils, wings wrapped round like a cloak, chin on the coil, the tongue tip out
    sleep: { len: 3.4, loop: true, f(P, t) {
      const br = Math.sin((t / 3.4) * TAU);
      bend(P, 48 + br * 2, 0, 6); rise(P, -0.2); P.rot('head', 20 + br * 3, 0, 10);
      P.rot('wingR', 10, 50, 10).rot('wingL', 10, -50, -10); armsTo(P, { out: 4, fwd: 50, bend: 70 }); lick(P, 0.08, 0.2, 40);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'head', HEAD, {}).burst(1.9, 'z', 'head', HEAD, {});
    } },
    // victory: wings fully up, arms wide, a column of fire straight up — then the tongue wag
    win: { len: 2.6, next: 'idle', f(P, t) {
      const up = seg(t, 0.1, 0.4, E.back) * (1 - seg(t, 2.1, 2.5, E.inout)), blast = bump(t, 0.4, 1.2), wag = seg(t, 1.3, 1.5) * (1 - seg(t, 2.1, 2.4));
      bend(P, -12 * up, 0, 0); rise(P, 0.4 * up); wings(P, 1.4 * up, 16 * up * Math.max(0, wave(t, 2)));
      armsTo(P, { out: 80 * up, fwd: 40 * up, bend: 30 }); P.rot('head', -30 * blast + 6 * wag, 0, 0);
      lick(P, 0.2 + 0.8 * blast + 0.5 * wag, 0.3 + 1.8 * wag, 30, wave(t, 6) * 24 * wag);
      P.face('eyes', blast > 0.3 ? 'shut' : wag > 0.3 ? 'smug' : undefined); P.blinkOK = false; torchFlicker(P, t);
      if (blast > 0.4) P.stream('breath', 'head', MOUTH, { rate: 120, dir: [0, 1, 0.2], spread: 0.2 });
      P.burst(0.45, 'kstar', 'head', HEAD, { n: 8, speed: 1.6 }).burst(0.5, 'bat', 'head', HEAD, { n: 6 }).burst(1.4, 'sparkle', 'head', HEAD, { n: 10 });
    } },
    // the stomp-less stomp: a heavy cobra sway on the beat, wings pumping, claws raking the air, a tongue
    // flick every bar — then it spins on its coils and freezes with the wings up and the tongue all the way out
    dance: { len: 3.0, next: 'idle', f(P, t) {
      const bt = t * 2, n = Math.floor(bt), ph = bt - n, hit = Math.sin(Math.min(1, ph * 1.8) * Math.PI), side = n % 2 ? 1 : -1, on = seg(t, 0, 0.15) * (1 - seg(t, 2.0, 2.1));
      const spin = seg(t, 2.0, 2.4, E.inout), fin = seg(t, 2.35, 2.5, E.back) * (1 - seg(t, 2.75, 3.0));
      bend(P, 14 * hit * on - 10 * fin, side * 18 * on, side * 12 * on); rise(P, 0.1 * (1 - hit) * on + 0.35 * fin); P.rot('root', 0, 360 * spin, 0);
      P.rot('head', 24 * hit * on - 20 * fin, -side * 10 * on, 0); wings(P, 0.4 * on + 1.3 * fin, 18 * hit * on);
      armsTo(P, { out: 30 * on + 70 * fin, fwd: (side > 0 ? 70 : 20) * hit * on + 30 * fin, bend: 50 * on });
      lick(P, 0.2 + 0.4 * hit * on + 0.6 * fin, (n % 2 ? 1.2 * hit : 0.2) * on + 2.2 * fin, 20, wave(t, 6) * 20 * fin);
      P.face('eyes', fin > 0.3 ? 'smug' : on > 0.5 ? (hit > 0.5 ? 'shut' : 'angry') : undefined); P.blinkOK = false; torchFlicker(P, t);
      for (const t0 of [0.02, 0.52, 1.02, 1.52]) P.burst(t0, 'dust', 'root', [0, 0.3, 3], { n: 3, spread: 1, speed: 0.7 }).burst(t0 + 0.06, 'note', 'head', HEAD, { n: 1, dir: [0, 1, 0.2], speed: 1 });
      P.burst(2.4, 'fire', 'head', MOUTH, { n: 10, dir: [0, 0.6, 1], speed: 1.4 }).burst(2.4, 'kstar', 'head', HEAD, { n: 8, speed: 1.5 });
    } },
    // signature: the God of Thunder. Claws to the sky — lightning cracks down onto its horns and crackles
    // round them, the topknot stands on end… and then the tongue unrolls, and unrolls, and wiggles.
    thunder: { len: 3.8, next: 'idle', f(P, t) {
      const raise = seg(t, 0.1, 0.5, E.back) * (1 - seg(t, 2.0, 2.3, E.inout)), zap = bump(t, 0.75, 1.75), tongue = seg(t, 2.1, 2.6, E.out) * (1 - seg(t, 3.3, 3.7, E.inout));
      bend(P, -10 * raise + 10 * tongue, 0, 0); rise(P, 0.3 * raise); wings(P, 0.3 + 1.0 * raise, 6 * zap * Math.abs(wave(t, 9)));
      armsTo(P, { out: 30 * raise, fwd: 160 * raise, bend: 10 }); P.rot('head', -20 * raise + wave(t, 13) * 3 * zap + 10 * tongue, 0, 0);
      P.scl('knot', 1, 1 + 0.4 * zap, 1).rot('knot', -10 * zap, 0, wave(t, 11) * 10 * zap);
      lick(P, 0.15 + 0.6 * tongue, 0.2 + 2.4 * tongue, 34, wave(t, 5) * 28 * tongue);
      P.face('eyes', zap > 0.3 ? 'wide' : tongue > 0.3 ? 'smug' : raise > 0.3 ? 'angry' : undefined); P.blinkOK = false; torchFlicker(P, t);
      for (const t0 of [0.78, 1.0, 1.22, 1.44]) P.burst(t0, 'kbolt', 'head', HORNS, { n: 3, speed: 0.4, spread: 0.5 });
      P.burst(0.78, 'ring', 'head', HORNS, { tint: [0.8, 0.7, 1] }).burst(0.8, 'ring', 'head', HORNS, { scale: 1.6 }).burst(1.2, 'sparkle', 'head', HORNS, { n: 10 }).burst(2.7, 'kstar', 'head', [0, 18, 16], { n: 6, speed: 1.2 });
      if (zap > 0.3) P.stream('spark', 'head', HORNS, { rate: 20, spread: 1 });
    } },
    // stage blood: it rears, opens wide and lets a long drool of black-red stage blood run off its tongue… then licks its lips
    bloodspit: { len: 3.4, next: 'idle', f(P, t) {
      const up = seg(t, 0.05, 0.45, E.back) * (1 - seg(t, 2.9, 3.3, E.inout)), drool = seg(t, 0.5, 0.7) * (1 - seg(t, 1.9, 2.1)), lip = bump(t, 2.1, 2.8);
      bend(P, -8 * up, 0, 0); rise(P, 0.2 * up); P.rot('head', -16 * up + 20 * drool - 6 * lip, 0, 0);
      wings(P, 0.4 + 0.6 * up, 0); armsTo(P, { out: 40 * up, fwd: 30 * up, bend: 60 * up });
      lick(P, 0.2 + 0.7 * drool + 0.3 * lip, 0.4 + 1.6 * drool + 0.8 * lip, 46 * drool + 4, wave(t, 4) * 30 * lip);
      P.face('eyes', drool > 0.3 ? 'angry' : lip > 0.3 ? 'smug' : undefined); P.blinkOK = false; torchFlicker(P, t);
      if (drool > 0.5) P.stream('blood', 'tongue2', [0, 16, 15.6], { rate: 18, dir: [0, -1, 0], speed: 0.4, spread: 0.2 });
      P.burst(0.6, 'bat', 'head', HEAD, { n: 4 }).burst(2.5, 'sparkle', 'head', [0, 17, 11], { n: 6 });
    } },
  },
};
def.anim = anim;
// the ultra-drip form: black-lacquer scales and armour, gold horns, talons, studs and bat, white paint and gold eyes kept
def.dripForm = kissForm({ keep: [C.eye, C.eyeLo, C.eyeHi], swap: { [C.redHi]: '#d8a030', [C.vein]: '#c8902a' } });
