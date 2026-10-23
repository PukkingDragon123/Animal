// Creepetal — a sad, shy, wilting flower (Bio/Ecto), a Radiohead homage ("Creep"). It is sure it's
// a creep and that it doesn't belong here. Its face is the flower's ivory centre: droopy, watery
// violet block eyes, a small wobbly frown and one single tear that keeps welling up and rolling off its
// cheek. Five periwinkle petals wilt around the face like a hood and shaggy curtains of hair, dip-dyed
// at the tips in a bleached straw blond (the early-90s frontman's bleached mop), with a ragged blond
// fringe swept over one eye. A bent stem body on two little root feet, leaf hands that fidget
// nervously. When startled it folds its petals shut over its face like a bud, then peeks out.
// Signature: a spotlight drops on it — it hides, then, for once, shyly blooms. Its dance is a
// loose-limbed, jittery flail. Yumi's partner: she's shy too.
// Drip: 1 nerdy round glasses | slouchy knit beanie · 2 big hide-away headphones | fairy lights round
// the stem · 3 sticker-covered guitar on its back | a vintage stand mic to hide behind.
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { eyeRig, eyesAt, eyesScale, glance, keepEyes } from './eyes.js';
import { ramp, shift } from './kit.js';
import { B, both, grp, acc, at, fill, band, isSide, jit, pixStates, mouthSet, glasses, beanie, phones, mic, guitar, lights, radioMap, TAU } from './radio_parts.js';

const C = {
  pet: ['#4c54b6', '#7a86e4', '#a8b0f6', '#c6c0f8'], tip: ['#fff4b8', '#f2da84', '#d6b45a'], vein: '#dfe4ff',
  stem: ['#9ccaa0', '#5e9a72', '#3e7254', '#244a38'], leaf: ['#c4ec6a', '#86c842', '#529030', '#2e5a22'], leafVein: '#d6f4aa',
  root: ['#d4c48c', '#a69258', '#78663c', '#4a3e22'],
  disc: ['#fffbf2', '#f8efda', '#ecdfbe', '#cfba90'], stamen: '#e8c45c', stamenLo: '#c29232',
  straw: ['#fff6c4', '#f4de86', '#dcb85c', '#a8842e'],
  tear: '#c8f2ff', tearLo: '#64c0f0', ink: '#251a36',
};
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dith = (d, x, y) => d * 16 > B4[(x & 3) + (y & 3) * 4] + 0.5;

// ---------------------------------------------------------------- painters
// a petal, painted along its own length (hinge → tip): deep periwinkle at the base, lilac, then
// bleached straw tips; a pale centre vein, darker margins, the crinkles of a wilting edge
function petalP(py, len) {
  return (p, w, h, face, cube) => {
    const cx = cube.o[0] + cube.s[0] / 2;
    fill(p, w, h, (x, y) => {
      const [X, Y] = at(face, cube, x, y), t = (Y - py) / len;
      let c = t < 0.2 ? C.pet[0] : t < 0.46 ? C.pet[1] : t < 0.66 ? C.pet[2] : t < 0.74 ? (dith(0.5, x, y) ? C.tip[1] : C.pet[3]) : t < 0.9 ? C.tip[0] : C.tip[1];
      if (face === 'down') return shift(c, -0.25);
      if (face === 'north') c = shift(c, -0.08);
      if ((face === 'south' || face === 'north') && Math.abs(X - cx) < 0.2 && t < 0.86) c = t < 0.66 ? C.vein : '#fffbe0';
      else if ((face === 'south' || face === 'north') && t > 0.1 && t < 0.62 && Math.abs(Math.abs(X - cx) - (t * 2.2)) < 0.17) c = shift(c, 0.1);
      if (isSide(face) && (x === 0 || x === w - 1)) c = shift(c, -0.2);
      if (t > 0.7 && (x * 7 + y * 3) % 9 === 0) c = shift(c, -0.14);
      return c;
    });
  };
}
// the face: the flower's ivory centre, a ring of tiny stamens round its edge
const discP = (p, w, h, face) => {
  if (face === 'up') { fill(p, w, h, (x, y) => ((x * 3 + y) % 7 === 0 ? C.pet[0] : (x + y) % 5 === 0 ? C.pet[2] : C.pet[1])); return; }
  if (face !== 'south') { fill(p, w, h, (x, y) => ((x + y * 2) % 3 === 0 ? C.stamenLo : (x * 3 + y) % 5 === 0 ? '#fff0a8' : face === 'down' ? C.stamenLo : C.stamen)); return; }
  fill(p, w, h, (x, y) => band(C.disc, face, x, y, h));
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
    const e = Math.min(x, y, w - 1 - x, h - 1 - y);
    if (e === 0) p.px(x, y, (x + y) % 2 ? C.stamenLo : C.stamen); else if (e === 1 && (x * 3 + y) % 4 === 0) p.px(x, y, C.stamen);
  }
};
const calyxP = (p, w, h, face) => fill(p, w, h, (x, y) => { const c = band(C.stem, face, x, y, h); return isSide(face) && x % 3 === 0 ? shift(c, -0.1) : c; });
const sepalStar = (p, w, h) => {
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2;
  fill(p, w, h, (x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy), lim = R * (0.42 + 0.58 * Math.abs(Math.cos(a * 2.5 + Math.PI / 4)) ** 2); return r > lim ? undefined : r > lim - 1 ? C.stem[3] : r < R * 0.3 ? C.stem[2] : C.stem[1]; });
};
// the stem: fibres running up, a softer pale belly stripe down the front
const stemP = (p, w, h, face) => fill(p, w, h, (x, y) => {
  let c = band(C.stem, face, x, y, h);
  if (isSide(face) && x % 3 === 1) c = shift(c, -0.08);
  if (face === 'south' && Math.abs(x + 0.5 - w / 2) < w * 0.22) c = shift(c, 0.16);
  return c;
});
// a base rosette of leaves hiding the root joints
const skirtP = (p, w, h, face) => fill(p, w, h, (x, y) => {
  const c = band(C.leaf, face, x, y, h);
  if (face === 'up') return (x + y) % 5 === 0 ? C.leaf[2] : c;
  if (isSide(face) && y === h - 1 && x % 4 === 1) return 0;
  return isSide(face) && x % 4 === 0 ? C.leaf[2] : c;
});
// a leaf hand: a pale midrib, side veins sweeping up, a darker margin
const leafP = (p, w, h, face) => fill(p, w, h, (x, y) => {
  let c = band(C.leaf, face, x, y, h);
  if (face === 'south' || face === 'north') {
    const m = Math.abs(x + 0.5 - w / 2);
    if (m < 0.6) c = C.leafVein; else if ((y + Math.round(m)) % 3 === 0 && m < w / 2 - 1) c = shift(c, 0.12);
    if (x === 0 || x === w - 1) c = C.leaf[3];
  }
  return c;
});
const rootP = (p, w, h, face) => fill(p, w, h, (x, y) => { const c = band(C.root, face, x, y, h); return isSide(face) && (x * 5 + y * 3) % 7 === 0 ? shift(c, -0.15) : c; });
// the bleached fringe: combed strands, darker roots, a ragged hem
const fringeP = (p, w, h, face) => fill(p, w, h, (x, y) => {
  if (!isSide(face)) return face === 'up' ? C.straw[1] : C.straw[3];
  let c = y < 2 ? C.straw[2] : ramp([C.straw[0], C.straw[1], C.straw[2]], y / h, x, y);
  if ((x + Math.floor(jit(Math.floor(x / 2)) * 3)) % 3 === 0) c = shift(c, -0.1);
  if (y >= h - 2 && (x + Math.floor(jit(x) * 4)) % 4 === 0) return 0;
  return c;
});
const tearP = (p, w, h) => fill(p, w, h, (x, y) => (x === 0 && y <= 1 ? '#ffffff' : y > h * 0.7 || x === w - 1 ? C.tearLo : C.tear));
// the spotlight: a cone of dithered light (glow planes) and a pool of light on the floor
const coneP = (dense) => (p, w, h) => {
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1), half = (0.1 + 0.9 * v) * (w / 2);
    for (let x = 0; x < w; x++) { const u = Math.abs(x + 0.5 - w / 2) / half; if (u > 1) continue; const d = u > 0.93 ? 0.5 : (1 - u * u) * (dense - 0.16 * v); if (dith(d, x, y)) p.px(x, y, u > 0.93 ? '#ffe6a8' : '#fff8e4'); }
  }
};
const poolP = (p, w, h) => fill(p, w, h, (x, y) => { const r = Math.hypot(x + 0.5 - w / 2, y + 0.5 - h / 2) / (w / 2); return r > 1 ? undefined : r > 0.9 ? (dith(0.6, x, y) ? '#ffe6a8' : undefined) : dith(0.42 - 0.2 * r, x, y) ? '#fff8e4' : undefined; });
const strapP = (p, w, h) => fill(p, w, h, (x, y) => (y === 0 ? '#6a5a7a' : (x + y) % 4 === 0 ? '#2a2236' : '#3a3048'));

// ---------------------------------------------------------------- face
// eyes in the Cobblemon language, drawn bigger and more expressive: a droopy dark block (no whites),
// its lash line stepping down to the outer corner, a two-tone violet iris, a square pupil block with a
// 2×2 highlight cluster and one low glint; every key emotion hand-drawn
const EYE = {
  open: [
    '......llll',
    '...lllIIII',
    '.llIIIIIII',
    'lIIIIIIIII',
    'IIIIhhkkII',
    'iiiihhkkii',
    'iiiikkkkii',
    '.iiikkkhii',
    '..iiiiiii.',
    '...iiiii..',
  ],
  angry: [
    '..........',
    '..........',
    '.lll......',
    'llllll....',
    'lIIIllll..',
    'Iiiihhllll',
    'iiiikkkkll',
    '.iiikkkhII',
    '..iiiiiii.',
    '...iiiii..',
  ],
  sad: [
    '..........',
    '.......lll',
    '.....lllll',
    '...llllIII',
    '.llllhkkII',
    'lllIhhkkii',
    'lIIikkkkii',
    '.iiikkkhii',
    '..iiiiiii.',
    '...bbbbb..',
  ],
  happy: [
    '..........',
    '..........',
    '..........',
    '...llll...',
    '..lIIIIl..',
    '.lII..IIl.',
    'lII....IIl',
    'II......II',
    '..........',
    '..........',
  ],
  closed: [
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    '......llll',
    '..llllllll',
    'llll......',
    '..........',
    '..........',
  ],
  shock: [
    '....llllll',
    '..llwwwwww',
    '.lwwwwwwww',
    'lwwwwwwwww',
    'wwwwwhkwww',
    'wwwwwkkwws',
    'swwwwwwwws',
    '.swwwwwwss',
    '..sswwwss.',
    '...sssss..',
  ],
  smug: [
    '..........',
    '..........',
    '..........',
    '..........',
    'llllllllll',
    'llllllllll',
    'IIIIhkkkII',
    '.iiikkkhii',
    '..iiiiiii.',
    '...iiiii..',
  ],
  sleepy: [
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
    'llllllllll',
    'llllllllll',
    '.IIIkkkhII',
    '..iiiiiii.',
    '...iiiii..',
  ],
  wide: [
    '...lllllll',
    '.llIIIIIII',
    'lIIIIIIIII',
    'IIIIIIIIII',
    'IIIIIhkIII',
    'iiiiikkiii',
    'iiiiiiiiii',
    '.iiiiiiiii',
    '..iiiiiii.',
    '...iiiii..',
  ],
  teary: [
    '......llll',
    '...lllIIII',
    '.llIIIIIII',
    'lIIIIIIIII',
    'IIIIhhkkII',
    'iiiihhkkii',
    'iiiikkkkii',
    '.bbikkkhbb',
    '..bbbbbbb.',
    '...bbbbb..',
  ],
};
const EYES = eyeRig({ style: 'pix', chunk: 1, extra: ['smug'], at: [-2.05, 15.3, 2.62], line: C.ink, iris: '#7a70e8', irisDark: '#3a2c8a', pupilColor: '#140c2a', map: { ...pixStates(EYE.open), ...EYE } });
const MOUTH = mouthSet({
  sad: ['........', '...ll...', '..l..l..', '.l....l.', '........'],
  wobble: ['........', '........', '.ll..ll.', 'l..ll..l', '........'],
  o: ['...ll...', '..lmml..', '..lmml..', '...ll...', '........'],
  smile: ['........', '........', '.l....l.', '..llll..', '........'],
  grin: ['........', '.llllll.', '.lmmmml.', '..lttl..', '...ll...'],
  wail: ['...ll...', '..lmml..', '.lmmmml.', '.lmttml.', '.llllll.'],
  open: ['..llll..', '.lmmmml.', '.lmttml.', '..llll..', '........'],
  flat: ['........', '........', '..llll..', '........', '........'],
  grit: ['........', '.llllll.', '.lwlwwl.', '.llllll.', '........'],
}, { at: [0, 12.3, 2.63], def: 'sad', pal: { line: C.ink, inner: '#3a1838', tongue: '#e0789a' } });

// ---------------------------------------------------------------- the model
// petals: each hangs on a fixed hinge bone (rotated to its place round the rim) and folds about the
// rim itself, so one x-rotation closes it over the face (a bud), opens it (a bloom) or lets it wilt
// (th: its place round the rim; droop: how far it has sagged round toward the ground; fold: how far
// it leans forward; the hinge bone carries th + droop, the petal bone the fold, so a fold always
// turns about the rim and a bloom / bud just takes the droop back out)
const PETS = [
  { n: 'petTop', th: 0, droop: 0, fold: 108, at: [0, 19.0, 0.9], w: 4.6, L: 1.8 },
  { n: 'petUpR', th: 58, droop: 84, fold: 36, at: [-3.8, 17.2, 0.9], w: 4.6, L: 3.8 },
  { n: 'petLoR', th: 118, droop: 44, fold: 26, at: [-3.9, 13.2, 0.7], w: 4.2, L: 4.0 },
];
const petalBones = (q) => {
  const [x, y, z] = q.at, P2 = petalP(y, q.L + 2.5), w = q.w, c = q.n === 'petTop' ? 34 : 22;
  return [
    { name: 'hinge' + q.n.slice(3), parent: 'head', pivot: q.at, rot: [0, 0, q.th + q.droop], cubes: [] },
    { name: q.n, parent: 'hinge' + q.n.slice(3), pivot: q.at, rot: [q.fold, 0, 0], cubes: [
      B(x - 1.3, y - 0.6, z - 0.3, x + 1.3, y + 1.4, z + 0.3, P2),
      B(x - w / 2, y + 1.2, z - 0.32, x + w / 2, y + 1.2 + q.L, z + 0.32, P2, { pivot: [x, y + 1.2, z], rot: [c * 0.35, 0, 0] }),
      B(x - w * 0.32, y + 1.0 + q.L, z - 0.3, x + w * 0.32, y + 2.5 + q.L, z + 0.3, P2, { pivot: [x, y + 1.2 + q.L * 0.94, z + q.L * 0.94 * Math.sin(c * 0.35 * Math.PI / 180)], rot: [c, 0, 0] }),
    ] },
  ];
};
const ARM = [
  { name: 'armR', parent: 'body', pivot: [-1.8, 6.6, 0.4], cubes: [B(-3.4, 6.25, 0.05, -1.6, 6.95, 0.75, stemP)] },
  { name: 'handR', parent: 'armR', pivot: [-3.2, 6.6, 0.4], cubes: [B(-4.4, 3.2, 0.0, -2.0, 6.9, 0.8, leafP), B(-3.8, 2.3, 0.1, -2.6, 3.2, 0.7, leafP)] },
  { name: 'footR', parent: 'root', pivot: [-1.5, 1.0, 0.4], cubes: [B(-2.7, 0, -1.0, -0.4, 1.9, 1.6, rootP), B(-2.4, 0, 1.6, -0.8, 1.1, 2.7, rootP)] },
];
const SPIRAL = [[-2.25, 2.9, 0], [0, 3.5, 2.25], [2.25, 4.1, 0], [0, 4.7, -2.25], [-2.25, 5.3, 0], [0, 5.9, 2.25], [2.25, 6.5, 0], [0.4, 7.2, -2.0], [-1.6, 8.6, 0.6]];
export const def = {
  name: 'creepetal', ppu: 3, scale: 0.4, outline: { color: C.ink, px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: [0, 1.8, 0], cubes: [
      B(-2.6, 1.2, -2.4, 2.6, 2.4, 2.6, skirtP),
      ...[0, 90, 180, 270].map((a) => B(-1.0, 1.0, 2.0, 1.0, 1.7, 4.4, leafP, { pivot: [0, 1.4, 0], rot: [0, a + 45, 0] })),
      B(-1.9, 2.4, -1.7, 1.9, 7.6, 1.9, stemP),
      // dripped (or): fairy lights wound round the stem
      ...lights({ pts: SPIRAL, id: 'acc-lights', every: 1.5, bulb: 0.6 }),
      // ultra: the guitar strap across the front
      ...acc('acc-guitar', [B(-2.4, 4.6, 1.92, 2.4, 5.3, 2.2, strapP, { pivot: [0, 4.95, 2.05], rot: [0, 0, 36] })]),
    ] },
    { name: 'neck', parent: 'body', pivot: [0, 7.4, 0.1], rot: [6, 0, 0], cubes: [B(-1.3, 7.2, -1.2, 1.3, 11.8, 1.4, stemP)] },
    { name: 'head', parent: 'neck', pivot: [0, 11.6, 0.2], rot: [0, 0, 0], cubes: [
      B(-4.5, 11.0, -0.2, 4.5, 19.0, 2.6, discP),
      B(-3.9, 11.5, -2.4, 3.9, 18.5, -0.2, calyxP),
      B(-2.4, 12.6, -3.4, 2.4, 17.4, -2.4, calyxP),
      B(-4.6, 10.4, -3.45, 4.6, 19.6, -3.45, sepalStar, { plane: 'z' }),
      // normal: nerdy round glasses · or a slouchy knit beanie
      ...glasses({ x: -2.05, y: 15.35, z: 2.68, r: 1.95, tx: 4.6, temple: 5.6, id: 'acc-glasses', col: '#3a2620' }),
      ...beanie({ x0: -4.1, x1: 4.1, y: 18.4, z0: -2.6, z1: 2.4, h: 3.8, id: 'acc-beanie', cols: ['#8a94a4', '#5e6878', '#40485a', '#262c38'], stripe: '#e8b83a' }),
      // dripped: big hide-away headphones
      ...phones({ x: 4.55, y: 15.2, z: 0.6, r: 2.3, behind: -4.1, id: 'acc-phones', accent: '#9aa6f4' }),
    ] },
    ...PETS.slice(0, 1).flatMap(petalBones),
    ...both(...PETS.slice(1).flatMap(petalBones)),
    // the bleached fringe swept over the right eye
    { name: 'fringe', parent: 'head', pivot: [-1.2, 19.0, 2.9], cubes: [
      B(-4.5, 16.6, 2.6, -1.0, 19.3, 3.3, fringeP, { pivot: [-1.0, 19.0, 3.0], rot: [0, 0, -16] }),
      B(-1.6, 17.9, 2.62, 1.4, 19.3, 3.2, fringeP, { pivot: [0, 19.0, 2.9], rot: [0, 0, 6] }),
    ] },
    { name: 'tear', parent: 'head', pivot: [3.0, 13.4, 2.8], cubes: [B(2.65, 12.5, 2.62, 3.35, 13.5, 3.12, tearP, { outline: false })] },
    ...EYES.bones,
    { name: 'mouth', parent: 'head', pivot: [0, 12.3, 2.63], cubes: MOUTH.cubes },
    ...both(...ARM),
    // ultra: a sticker-covered guitar slung on its back
    { name: 'guitar', parent: 'body', pivot: [0, 5.0, -2.3], rot: [0, 0, -34], cubes: guitar({ x: 0, y: 1.2, z: -3.2, k: 0.62, id: 'acc-guitar', cols: ['#ff9ab8', '#e8608a', '#a83460', '#5a1834'] }) },
    // ultra (or): a vintage stand mic out front, to hide behind
    { name: 'mic', parent: 'root', pivot: [-4.6, 0, 4.4], cubes: mic({ x: -4.6, y: 10.6, z: 4.4, k: 0.62, stand: true, ground: 0, id: 'acc-mic' }) },
    // the spotlight (signature fidget): a cone of light and a pool on the floor
    { name: 'spot', parent: 'root', pivot: [0, 0, 0], cubes: [
      ...[0, 60, 120].map((a) => B(-12, 0, 0, 12, 46, 0, coneP(0.34), { plane: 'z', glow: true, pivot: [0, 0, 0], rot: [0, a, 0], id: 'spot-on', hide: true })),
      ...[30, 90, 150].map((a) => B(-12, 0, 0, 12, 46, 0, coneP(0.2), { plane: 'z', glow: true, pivot: [0, 0, 0], rot: [0, a, 0], id: 'spot-dim', hide: true })),
      B(-9.5, 0.15, -9.5, 9.5, 0.15, 9.5, poolP, { plane: 'y', glow: true, id: 'spot-on', hide: true }),
    ] },
  ],
};
def.drip = [
  [{ id: 'acc-glasses', name: 'Nerdy round glasses' }, { id: 'acc-beanie', name: 'Slouchy knit beanie' }],
  [{ id: 'acc-phones', name: 'Hide-away headphones' }, { id: 'acc-lights', name: 'Fairy lights' }],
  [{ id: 'acc-guitar', name: 'Sticker-covered guitar' }, { id: 'acc-mic', name: 'Vintage stand mic' }],
];
def.attach = {
  head: { bone: 'head', at: [0, 19.6, 0.2], size: 9 },
  face: { bone: 'head', at: [0, 15.7, 2.7], size: 9 },
  neck: { bone: 'neck', at: [0, 9.6, 1.4], size: 3 },
  back: { bone: 'body', at: [0, 5.0, -1.8], size: 4 },
};

// ---------------------------------------------------------------- posing helpers
const PET = ['petTop', 'petUpR', 'petUpL', 'petLoR', 'petLoL'];
const FOLD = Object.fromEntries(PETS.flatMap((q) => [[q.n, q.fold], [q.n.replace(/R$/, 'L'), q.fold]]));
const DROOP = Object.fromEntries(PETS.flatMap((q) => [[q.n, q.droop], [q.n.replace(/R$/, 'L'), -q.droop]]));
const SIDE = { petTop: 0, petUpR: -1, petUpL: 1, petLoR: -1, petLoL: 1 };
// petals: bloom (open star), hide (closed bud over the face), peek (the left side lifts off the bud),
// flare (swept back), limp (wilt further), shiver (nervous trembling), fling (dance: flung about)
function petals(P, o = {}) {
  const b = o.bloom || 0, hd = o.hide || 0, pk = o.peek || 0, fl = o.flare || 0, lim = o.limp || 0, t = o.t || 0;
  PET.forEach((n, i) => {
    const rx = FOLD[n], rz = DROOP[n], s = SIDE[n];
    let fx = (-16 - rx) * b + (122 - rx) * hd - 26 * fl + (s === 0 ? 14 : 10) * lim, fz = -rz * Math.min(1, b + hd) + rz * 0.3 * lim;
    if (s > 0) fx -= 78 * pk * hd; else if (s === 0) fx -= 26 * pk * hd;
    if (o.shiver) fx += Math.sin(t * 38 + i * 1.9) * 3 * o.shiver;
    if (o.fling) { fx += Math.sin(t * 9 + i * 1.3) * 22 * o.fling; fz += Math.sin(t * 7 + i * 2.1) * 10 * o.fling * (s || 1); }
    P.rot(n, fx, 0, 0).rot('hinge' + n.slice(3), 0, 0, fz);
  });
}
// a leaf arm: swing (forward), lift (raise in front), out (raise to the side), bend (wrist curl), flop
const arm = (P, S, o = {}) => { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, -(o.lift || 0), g * (o.swing || 0), -g * (o.out || 0)).rot('hand' + S, -(o.bend || 0), g * (o.turn || 0), -g * (o.flop || 0)); };
const clasp = (P, k = 1, tap = 0, rub = 0) => { for (const [S, g] of [['R', 1], ['L', -1]]) arm(P, S, { swing: 56 * k, lift: (22 + 8 * tap + 5 * rub * g) * k, bend: (16 + 14 * tap) * k, turn: 6 * rub * g * k }); };
const face = (P, e, m) => { if (e) P.face('eyes', e); if (m) P.face('mouth', m); };
const HEAD_TOP = [0, 21, 1], MOUTHP = [0, 12.5, 3.2], CHEEK = [3.0, 12.4, 3.0];
const step = (P, S, k, z = 0) => P.pos('foot' + S, 0, 0.9 * k, z * k);
// keeping the tear: it wells, rolls and drips off (u: 0 → 1 over its life)
function tear(P, u, t0, t) {
  const well = seg(u, 0, 0.25), roll = seg(u, 0.45, 0.9, E.in), gone = seg(u, 0.9, 0.97);
  P.scl('tear', Math.max(0.01, (0.25 + 0.75 * well) * (1 - gone))).pos('tear', 0, -1.4 * roll, 0.1 * roll);
}
// lying wilted on its side (k 0 → 1)
function wilted(P, k, t = 0) {
  P.rot('root', 0, 0, -78 * k).pos('root', -5.5 * k, 2.2 * k, 0);
  P.rot('neck', 18 * k, 0, 0).rot('head', 10 * k, 0, -12 * k);
  arm(P, 'L', { out: -20 * k, swing: 10 * k, bend: 20 * k }); arm(P, 'R', { out: 40 * k, swing: 20 * k, bend: 10 * k });
  P.rot('footR', 0, 0, 10 * k).rot('footL', 0, 0, -20 * k);
  petals(P, { limp: k, t });
}

// ---------------------------------------------------------------- animation
export const anim = {
  start: 'idle', seed: 13,
  breathe: { bone: 'body', amp: 0.02, per: 2.8 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 4.6], dur: 0.15 },
  look: { bone: 'head', yaw: 20, pitch: 10, speed: 4 },
  springs: [
    { bone: 'petTop', tip: [0, 5, 0], k: 120, d: 7, gain: 0.7, max: 16 },
    { bone: 'petUpR', tip: [0, 5.5, 0], k: 110, d: 7, gain: 0.7, max: 18 },
    { bone: 'petUpL', tip: [0, 5.5, 0], k: 110, d: 7, gain: 0.7, max: 18 },
    { bone: 'petLoR', tip: [0, 5.5, 0], k: 100, d: 6, gain: 0.8, max: 20 },
    { bone: 'petLoL', tip: [0, 5.5, 0], k: 100, d: 6, gain: 0.8, max: 20 },
    { bone: 'fringe', tip: [0, -2, 0.5], k: 200, d: 10, gain: 0.6, max: 12, axes: [1, 0.3, 1] },
    { bone: 'handR', tip: [0, -3.5, 0], k: 170, d: 9, gain: 0.5, max: 18 },
    { bone: 'handL', tip: [0, -3.5, 0], k: 170, d: 9, gain: 0.5, max: 18 },
    { bone: 'guitar', tip: [0, 8, 0], k: 220, d: 12, gain: 0.3, max: 8 },
  ],
  faces: { eyes: EYES.slot, mouth: MOUTH.slot, spot: { default: 'off', states: { off: [], on: ['spot-on', 'spot-dim'], dim: ['spot-dim'] } } },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'spotlight', 'hide', 'peek', 'dance'] },
  clips: {
    // a sad sway: drooping one way and the other, leaves clasped and tapping, shy glances down and
    // away (one quick look at you, then away again), and the tear welling up and rolling off
    idle: { len: 4.0, loop: true, f(P, t, c) {
      const sw = Math.sin((t / 4) * TAU), sw2 = Math.sin((t / 4) * TAU * 2 + 0.6);
      P.rot('body', 2, sw * 4, sw * 4).rot('neck', 2 + sw2 * 2, 0, -sw * 3).rot('head', 2 - sw2 * 3, sw * 6, -sw * 7);
      const tap = Math.max(bump(t % 1, 0.08, 0.22), bump(t % 1, 0.3, 0.44));
      clasp(P, 1, tap, wave(t, 0.5));
      petals(P, { t, shiver: 0.25 });
      const [gx, gy] = glance(t, [[-0.25, -0.3], [-0.3, -0.35], [0.05, 0.05], [0.3, -0.25], [0.1, -0.35], [-0.2, -0.2]], 0.66, 0.08);
      eyesAt(P, gx, gy); P.lookW = 0.35;
      tear(P, t / 4);
      P.burst(3.75, 'tear', 'head', [2.95, 11.6, 3.0], { n: 1, speed: 0.2 });
      const lookAt = t > 1.32 && t < 1.98, sigh = bump(t, 2.5, 3.4);
      face(P, sigh > 0.4 ? 'sad' : lookAt && t > 1.8 ? 'shock' : (t > 0.4 && t < 1.2) ? 'teary' : undefined, sigh > 0.2 ? 'wobble' : 'sad');
      if (lookAt && t > 1.8) eyesScale(P, 1.08, 1.12);
      P.sq('body', -0.04 * sigh).rot('head', 6 * sigh, 0, 0);
      if (c.loopN % 2 === 1) P.burst(3.0, 'sweat', 'head', [-5, 19, 2], { n: 1 });
    } },
    // a timid shuffle: little hops on its root feet, head down, leaves held close
    walk: { len: 0.8, loop: true, f(P, t) {
      const ph = (t / 0.8) * TAU, hh = Math.abs(Math.sin(ph)), s = Math.sin(ph);
      P.pos('root', 0, 0.7 * hh, 0).rot('body', 4, s * 6, s * 5).sq('body', -0.05 * (1 - hh) + 0.03 * hh);
      step(P, s > 0 ? 'R' : 'L', hh, 0.8); P.rot('head', 4 + 3 * hh, -s * 4, -s * 4);
      clasp(P, 0.8, 0, s);
      petals(P, { t, shiver: 0.2 }); face(P, 'sad', 'sad'); eyesAt(P, 0, -0.3); P.lookW = 0.2;
    } },
    // battle cry: it tries to be brave — a deep breath, a half bloom and a wail… then its voice cracks
    // and it ducks back behind its petals
    cry: { len: 2.3, next: 'idle', f(P, t) {
      const inh = seg(t, 0, 0.4) * (1 - seg(t, 0.4, 0.5)), up = seg(t, 0.42, 0.6, E.back) * (1 - seg(t, 1.3, 1.5)), crack = bump(t, 1.3, 1.65), duck = seg(t, 1.55, 1.8, E.out) * (1 - seg(t, 2.0, 2.3));
      P.pos('root', 0, 1.2 * up, 0).sq('body', -0.08 * inh + 0.08 * up).rot('body', -6 * up, 0, 0).rot('head', 6 * inh - 22 * up + 12 * crack + wave(t, 9) * 3 * up, 0, wave(t, 6) * 4 * up);
      arm(P, 'R', { out: 70 * up, lift: 30 * inh, swing: 50 * inh + 10 * up, flop: 20 * up }); arm(P, 'L', { out: 70 * up, lift: 30 * inh, swing: 50 * inh + 10 * up, flop: 20 * up });
      petals(P, { bloom: 0.5 * up, flare: 0.4 * up, hide: 0.7 * duck, t, shiver: crack });
      face(P, inh > 0.3 ? 'closed' : crack > 0.3 ? 'shock' : up > 0.3 ? 'shut' : duck > 0.3 ? 'teary' : undefined, up > 0.3 ? 'wail' : crack > 0.3 ? 'o' : 'wobble'); P.blinkOK = false;
      if (t > 0.55 && t < 1.3) P.stream('rh-note', 'head', MOUTHP, { rate: 7, dir: [0, 0.8, 0.6], speed: 1.2 });
      P.burst(0.6, 'rh-petal', 'head', HEAD_TOP, { n: 8, speed: 1.4 }).burst(1.35, 'sweat', 'head', [5, 19, 2], { n: 2 }).burst(0.62, 'tear', 'head', [-2, 14, 3], { n: 2, dir: [-1, 1, 0], speed: 1.2 }).burst(0.62, 'tear', 'head', [2, 14, 3], { n: 2, dir: [1, 1, 0], speed: 1.2 });
    } },
    // attack: a petal storm — it rears back with its petals swept, then whips both leaves forward
    attack: { len: 1.05, next: 'idle', f(P, t) {
      const bk = seg(t, 0, 0.3, E.out) * (1 - seg(t, 0.3, 0.38, E.in)), hit = seg(t, 0.32, 0.42, E.in3) * (1 - seg(t, 0.6, 1.0, E.inout));
      P.pos('root', 0, 0.6 * bk, -1.4 * bk + 2.6 * hit).rot('body', -10 * bk + 14 * hit, 0, 0).rot('head', -14 * bk + 16 * hit, 0, 0).sq('body', -0.06 * bk + wob(t, 0.42, 0.06, 4, 7));
      for (const S of ['R', 'L']) arm(P, S, { out: 50 * bk, swing: -30 * bk + 70 * hit, lift: 60 * hit, flop: -30 * bk + 30 * hit });
      petals(P, { flare: bk, bloom: 0.3 * hit, t });
      face(P, bk > 0.2 ? 'angry' : hit > 0.3 ? 'angry' : undefined, bk > 0.2 ? 'grit' : hit > 0.2 ? 'open' : 'sad'); P.blinkOK = false;
      P.burst(0.4, 'rh-storm', 'body', [0, 10, 5], { n: 22, dir: [0, 0.15, 1] }).burst(0.4, 'ring', 'body', [0, 10, 6], { scale: 0.5 }).burst(0.42, 'spark', 'body', [0, 10, 8], {});
    } },
    // special: a petal vortex — it shuts into a bud and spins, petals whirling round it, then bursts open
    // and the storm flies out ahead… then it wilts back, a little embarrassed
    special: { len: 2.5, next: 'idle', f(P, t) {
      const shut = seg(t, 0, 0.25, E.out) * (1 - seg(t, 1.25, 1.35, E.out)), spin = seg(t, 0.2, 1.3, E.inout), burst = seg(t, 1.3, 1.45, E.back) * (1 - seg(t, 1.95, 2.4, E.inout));
      P.rot('root', 0, 720 * spin, 0).pos('root', 0, 1.6 * bump(t, 0.2, 1.3) + 0.8 * burst, 0).sq('body', 0.06 * bump(t, 0.2, 1.3) - 0.08 * bump(t, 1.25, 1.45));
      petals(P, { hide: shut, bloom: burst, flare: 0.3 * burst, t, shiver: shut * 0.5 });
      for (const S of ['R', 'L']) arm(P, S, { out: 30 * shut + 80 * burst, swing: 40 * shut, lift: 20 * shut, flop: 20 * burst });
      P.rot('head', -16 * burst, 0, 0);
      face(P, shut > 0.3 ? 'closed' : burst > 0.3 ? 'wide' : t > 2.0 ? 'sad' : undefined, burst > 0.3 ? 'open' : t > 2.0 ? 'wobble' : 'sad'); P.blinkOK = false;
      if (t > 0.25 && t < 1.3) for (let k = 0; k < 3; k++) { const a = t * 9 + k * 2.1; P.stream('rh-petal', 'root', [Math.cos(a) * 9, 4 + k * 4, Math.sin(a) * 9], { rate: 22, dir: [-Math.sin(a), 0.3, Math.cos(a)], speed: 2.2, key: 'v' + k }); }
      P.burst(1.32, 'rh-storm', 'head', [0, 15, 5], { n: 46, dir: [0, 0.1, 1], spread: 0.55 }).burst(1.32, 'ring', 'head', [0, 15, 4], { scale: 1.1 }).burst(1.32, 'sparkle', 'head', HEAD_TOP, { n: 10, speed: 1.6 });
      P.burst(2.05, 'sweat', 'head', [5, 19, 2], { n: 2 });
    } },
    // hurt: a flinch, the petals snap shut, a tear and a few petals shaken loose
    hurt: { len: 0.75, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.25, 0.75, E.inout));
      P.pos('root', 0, 0, -1.8 * k).rot('body', -14 * k + wob(t, 0.2, 4, 3, 6), 0, wave(t, 14) * 4 * k).sq('body', -0.12 * k).rot('head', -10 * k, 0, 8 * k);
      clasp(P, 1.3 * k); petals(P, { hide: 0.75 * k, t, shiver: k });
      face(P, t < 0.5 ? 'shut' : 'teary', 'wail'); P.blinkOK = false;
      P.burst(0.02, 'rh-petal', 'head', HEAD_TOP, { n: 6, speed: 1.6 }).burst(0.02, 'spark', 'head', [0, 15, 4], {}).burst(0.06, 'tear', 'head', [2.5, 14, 3], { n: 2, dir: [1, 1, 0], speed: 1.4 });
    } },
    // faint: it wilts — the stem buckles, petals go limp and fall, and it keels over
    faint: { len: 2.2, next: 'down', f(P, t) {
      const sag = seg(t, 0, 0.9, E.inout), fall = seg(t, 0.9, 1.35, E.bounce);
      P.rot('neck', 30 * sag * (1 - fall), 0, 0).rot('head', 16 * sag * (1 - fall), 0, wave(t, 2) * 8 * (1 - fall)).rot('body', 8 * sag * (1 - fall), 0, wave(t, 1.6) * 6 * sag * (1 - fall)).sq('body', -0.1 * sag * (1 - fall));
      wilted(P, fall, t); if (fall < 0.01) petals(P, { limp: sag, t });
      arm(P, 'R', { out: -15 * sag * (1 - fall) }); arm(P, 'L', { out: -15 * sag * (1 - fall) });
      face(P, t < 0.5 ? 'teary' : 'swirl', 'wobble'); P.blinkOK = false; P.lookW = 0;
      P.burst(0.5, 'rh-petal', 'head', HEAD_TOP, { n: 6, speed: 0.6 }).burst(1.3, 'dust', 'root', [0, 0, 0], { n: 8 }).burst(1.32, 'rh-petal', 'head', [0, 15, 3], { n: 8, speed: 1 }).burst(1.0, 'star', 'head', HEAD_TOP, { n: 4 });
    } },
    down: { len: 3.0, loop: true, f(P, t) {
      wilted(P, 1, t); P.breathW = 0.4; P.blinkOK = false; P.lookW = 0;
      face(P, 'swirl', 'wobble'); P.scl('tear', 0.01);
      P.rot('handR', 0, 0, 12 * bump(t, 1.2, 1.5)).rot('petTop', 6 * bump(t, 2.0, 2.4), 0, 0);
    } },
    // win: a shy little hop and a half bloom, a real smile… then it notices you looking and hides
    win: { len: 2.7, next: 'idle', f(P, t) {
      const air = Math.max(0, Math.sin(seg(t, 0.1, 0.5, E.lin) * Math.PI)), crouch = bump(t, 0, 0.14) + bump(t, 0.48, 0.62);
      const glow = seg(t, 0.1, 0.4, E.back) * (1 - seg(t, 1.7, 1.9)), shy = seg(t, 1.75, 1.95, E.out) * (1 - seg(t, 2.35, 2.7, E.inout));
      P.pos('root', 0, 2.4 * air, 0).rot('root', 0, 360 * seg(t, 0.12, 0.5, E.inout), 0).sq('body', -0.1 * crouch + 0.06 * air);
      petals(P, { bloom: 0.8 * glow, hide: 0.8 * shy, peek: shy, t });
      P.rot('head', -14 * glow, 0, wave(t, 2) * 6 * glow);
      for (const S of ['R', 'L']) arm(P, S, { out: 70 * glow, flop: 30 * glow * (0.5 + 0.5 * wave(t, 3)), swing: 50 * shy, lift: 20 * shy });
      face(P, glow > 0.3 ? 'happy' : shy > 0.3 ? 'shock' : undefined, glow > 0.5 ? 'grin' : glow > 0.2 ? 'smile' : 'o'); P.blinkOK = false;
      if (shy > 0.3) eyesAt(P, 0.3, -0.1);
      P.burst(0.3, 'rh-petal', 'head', HEAD_TOP, { n: 12, speed: 1.4 }).burst(0.5, 'sparkle', 'head', HEAD_TOP, { n: 8, speed: 1.2 }).burst(1.78, 'sweat', 'head', [5, 19, 2], { n: 2 });
    } },
    // asleep: folded shut into a bud, head bowed, breathing slow
    sleep: { len: 3.4, loop: true, f(P, t) {
      const br = Math.sin((t / 3.4) * TAU);
      P.pos('root', 0, -0.4 + br * 0.15, 0).sq('body', -0.05 + br * 0.03).rot('neck', 14, 0, 4).rot('head', 12 + br * 3, 0, 6);
      petals(P, { hide: 0.92, t }); clasp(P, 1.1);
      face(P, 'closed', 'flat'); P.blinkOK = false; P.lookW = 0; P.breathW = 0; P.scl('tear', 0.01);
      P.burst(0.5, 'z', 'head', [3, 21, 3], {}).burst(1.9, 'z', 'head', [3, 21, 3], {});
    } },
    // the dance: a loose, jittery flail — hips swinging, head jerking, leaves thrown about on the beat,
    // petals flung everywhere, lost in it… then it freezes, notices you, and hides
    dance: { len: 2.9, next: 'idle', f(P, t) {
      const live = seg(t, 0, 0.15) * (1 - seg(t, 2.15, 2.25)), bt = t / 0.36, n = Math.floor(bt), ph = bt - n, kick = Math.sin(Math.min(1, ph * 1.4) * Math.PI), sd = n % 2 ? 1 : -1;
      const jerk = (n % 3 === 0 ? 1 : -1) * Math.min(1, ph * 5) * live, caught = seg(t, 2.25, 2.4, E.out) * (1 - seg(t, 2.6, 2.9, E.inout));
      P.rot('body', 0, sd * 18 * kick * live, sd * 12 * kick * live).pos('root', sd * 0.8 * kick * live, 0.5 * kick * live, 0).sq('body', -0.06 * (1 - kick) * live);
      P.rot('neck', 0, 0, -sd * 10 * kick * live).rot('head', (-10 + 8 * kick) * live, jerk * 16, jerk * 10);
      arm(P, 'R', { out: (sd > 0 ? 100 : 20) * kick * live, swing: 20 * live, flop: (sd > 0 ? 50 : -30) * kick * live, bend: 30 * kick * live });
      arm(P, 'L', { out: (sd < 0 ? 100 : 20) * kick * live, swing: 20 * live, flop: (sd < 0 ? 50 : -30) * kick * live, bend: 30 * kick * live });
      step(P, sd > 0 ? 'R' : 'L', kick * live, 0.6);
      petals(P, { fling: live, bloom: 0.25 * live, hide: 0.85 * caught, peek: caught, t });
      if (caught > 0) clasp(P, caught);
      face(P, t > 2.2 && t < 2.32 ? 'shock' : caught > 0.3 ? 'teary' : live > 0.5 ? (n % 4 === 3 ? 'happy' : 'closed') : undefined, live > 0.4 ? (ph < 0.4 ? 'o' : 'smile') : caught > 0.2 ? 'wobble' : 'sad'); P.blinkOK = false;
      for (const t0 of [0.36, 0.72, 1.08, 1.44, 1.8]) P.burst(t0, 'rh-note', 'head', [sd * 4, 20, 2], { n: 1, dir: [sd * 0.5, 1, 0.2], speed: 1.1 });
      P.burst(0.9, 'rh-petal', 'head', HEAD_TOP, { n: 5, speed: 1.4 }).burst(1.8, 'rh-petal', 'head', HEAD_TOP, { n: 5, speed: 1.4 }).burst(2.16, 'sparkle', 'head', HEAD_TOP, { n: 8, speed: 1.2 }).burst(2.26, 'sweat', 'head', [5, 19, 2], { n: 2 });
    } },
    // signature: the spotlight drops on it — it jumps and shuts into a bud, trembles, peeks up at the
    // light… and slowly, shyly, for once, it blooms; then the light clicks off and it wilts back, mortified
    spotlight: { len: 4.8, next: 'idle', f(P, t) {
      const on = t > 0.12 && t < 4.0;
      P.face('spot', !on ? 'off' : t < 0.2 || (t > 0.26 && t < 0.3) ? 'dim' : 'on');
      const jump = bump(t, 0.16, 0.42), shut = seg(t, 0.2, 0.36, E.out) * (1 - seg(t, 1.7, 2.6, E.inout)), pk = seg(t, 0.95, 1.15) * (1 - seg(t, 1.55, 1.7));
      const bloom = seg(t, 1.9, 3.1, E.inout3) * (1 - seg(t, 4.0, 4.3, E.in)), off = seg(t, 4.0, 4.15);
      P.pos('root', 0, 1.6 * jump, 0).sq('body', 0.1 * jump - 0.05 * shut + wob(t, 0.42, -0.06, 3, 6));
      petals(P, { hide: shut, peek: pk, bloom, t, shiver: shut * (1 - pk) * 0.8 });
      clasp(P, Math.max(shut, 1 - bloom) * (1 - 0.6 * bloom), 0, wave(t, 6) * shut);
      for (const S of ['R', 'L']) if (bloom > 0) arm(P, S, { out: 55 * bloom * (1 - off), flop: 25 * bloom, lift: 10 * bloom });
      P.rot('neck', -12 * bloom, 0, 0).rot('head', -14 * bloom - 10 * pk, wave(t, 0.5) * 6 * bloom, -6 * pk + wave(t, 0.4) * 4 * bloom).rot('body', 0, 0, wave(t, 0.5) * 3 * bloom);
      if (pk > 0) eyesAt(P, 0.35 * pk, 0.45 * pk);
      const e = t < 0.2 ? undefined : t < 0.5 ? 'shock' : t < 1.9 ? (pk > 0.4 ? 'wide' : 'closed') : t < 2.5 ? 'closed' : t < 4.0 ? 'happy' : t < 4.25 ? 'wide' : 'sad';
      face(P, e, t < 0.5 && t > 0.15 ? 'o' : bloom > 0.6 ? 'smile' : t > 4.1 ? 'wobble' : 'sad'); P.blinkOK = false; P.lookW = 0;
      if (on) P.stream('rh-mote', 'root', [0, 30, 0], { rate: 6, spread: 1 });
      P.burst(3.0, 'sparkle', 'head', HEAD_TOP, { n: 12, speed: 1.4 }).burst(3.0, 'rh-petal', 'head', HEAD_TOP, { n: 10, speed: 1 }).burst(2.4, 'rh-note', 'head', [3, 20, 2], { n: 2, speed: 0.8 });
      P.burst(4.12, 'sweat', 'head', [5, 19, 2], { n: 3 }).burst(0.18, 'star', 'head', HEAD_TOP, { n: 3 });
    } },
    // fidget: something startles it — the petals fold shut over its face; it trembles, then the left
    // petals lift and one eye peeks out to check… and it slowly relaxes
    hide: { len: 2.8, next: 'idle', f(P, t) {
      const shut = seg(t, 0.1, 0.26, E.out) * (1 - seg(t, 2.2, 2.7, E.inout)), pk = seg(t, 1.2, 1.5, E.out), tr = 1 - seg(t, 1.2, 1.4);
      P.sq('body', -0.08 * shut + wob(t, 0.26, 0.05, 4, 6)).pos('root', 0, -0.4 * shut, 0).rot('head', 6 * shut - 6 * pk, 0, -6 * pk);
      petals(P, { hide: shut, peek: pk, t, shiver: shut * tr });
      clasp(P, 1 + 0.2 * shut, 0, wave(t, 7) * shut * tr);
      const [gx] = glance(t, [[0.3, 0], [0.45, 0.1], [0.2, -0.1], [0.4, 0.15]], 0.32, 0.06);
      if (pk > 0) eyesAt(P, gx * pk, 0.2 * pk);
      face(P, t < 0.14 ? 'shock' : t < 1.2 ? 'closed' : t < 2.2 ? 'wide' : 'sad', 'wobble'); P.blinkOK = t > 1.6; P.lookW = 0;
      P.burst(0.12, 'sweat', 'head', [5, 19, 2], { n: 2 });
    } },
    // fidget: hiding half behind its petals it peeks round at you — once quick (and ducks), once longer
    // with the tiniest smile
    peek: { len: 2.6, next: 'idle', f(P, t) {
      const hid = seg(t, 0, 0.2, E.out) * (1 - seg(t, 2.1, 2.5, E.inout)), p1 = bump(t, 0.4, 0.75), p2 = seg(t, 1.05, 1.25, E.out) * (1 - seg(t, 1.9, 2.1));
      const pk = Math.max(p1, p2);
      petals(P, { hide: 0.9 * hid, peek: pk, t });
      P.rot('head', -6 * pk, 10 * pk, -10 * pk).pos('head', 0.6 * pk, 0, 0).rot('body', 0, 0, -4 * pk);
      clasp(P, 1, bump(t % 0.5, 0.05, 0.25) * hid);
      eyesAt(P, 0.4 * pk, 0.15 * pk);
      face(P, p1 > 0.5 ? 'wide' : p2 > 0.3 ? (t > 1.5 ? 'happy' : 'open') : hid > 0.5 ? 'closed' : undefined, p2 > 0.3 && t > 1.5 ? 'smile' : 'sad'); P.blinkOK = false; P.lookW = 0;
    } },
  },
};
def.anim = anim;
// the ultra-drip form: black-lacquer petals tipped in gold, a gold stem and leaves, a champagne face,
// a diamond tear; the eyes keep their colours
def.dripForm = {
  map: keepEyes(EYES, radioMap({ black: [[180, 320]], gold: [[30, 180]], swap: { [C.tear]: '#ffffff', [C.tearLo]: '#bfe2ff' }, keep: ['#fff8e4', '#ffe6a8'] })),
  fx: { 'rh-petal': 'rh-petalg', 'rh-storm': 'rh-stormg', 'rh-note': 'rh-noteg' },
};
