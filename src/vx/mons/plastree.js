// Plastree — Creepetal's evolution (Bio/Ferro), a Radiohead homage ("Fake Plastic Trees"). A glossy
// moulded toy tree: a brown plastic trunk with fake bark ridges and the mould's seam line running
// right round it (trunk, roots and canopy alike), a big puffy canopy of shiny fake leaves whose
// lowest locks fall over its brow in a shaggy mid-90s fringe, two branch arms with leafy hands, a
// price tag dangling on a string from one branch and a brass wind-up key in its back that ticks
// round as it goes. Its painted toy face is sad but serene: calm, half-lidded green eyes, a small
// soft mouth. It looks like the real thing. It wears it out.
// Signature: it reaches round, winds itself up — crank, crank, crank — and does a stiff clockwork
// dance until it runs down. Its dance is a jerky, robotic toy routine.
// Drip: 1 paper crown | thick round glasses · 2 a supermarket bag snagged on a branch | fairy lights
// round the canopy · 3 a sticker-covered acoustic guitar | a vintage mic.
import { E, seg, bump, wob, wave } from '../anim.js';
import { eyeRig, eyesAt, eyesScale, glance, keepEyes } from './eyes.js';
import { shift } from './kit.js';
import { B, both, acc, at, fill, band, isSide, jit, pixStates, mouthSet, glasses, crown, bag, guitar, mic, lights, radioMap, TAU } from './radio_parts.js';

const C = {
  bark: ['#d4945e', '#a8693c', '#7c4a26', '#4e2c16'], seam: '#f0c08e', seamLo: '#5a3218',
  leaf: ['#8af276', '#44cc4e', '#24983c', '#126028'], leafLine: '#0e4a22', gloss: '#ffffff',
  tag: '#fff4dc', tagLo: '#d8c8a4', price: '#e8303a', string: '#f4f4f0', ink: '#2a160c',
};
const GOLD = ['#fff4b0', '#ffd23e', '#d0902a', '#8a561a'];
// the mould's seam: a raised line along z = 0 on every side and top face, with a few flash nubs
const seamAt = (face, cube, x, y) => { if (face === 'south' || face === 'north') return 0; const [, Y, Z] = at(face, cube, x, y); const d = Math.abs(Z); return d < 0.17 ? (jit(Math.round(Y * 3)) > 0.86 ? 2 : 1) : d < 0.5 && Z < 0 ? -1 : 0; };

// ---------------------------------------------------------------- painters
// moulded plastic bark: smooth bands, fake ridges wiggling up the trunk, a hard specular streak, the seam
const barkP = (p, w, h, face, cube) => fill(p, w, h, (x, y) => {
  let c = band(C.bark, face, x, y, h);
  if (isSide(face)) {
    const r = (x + Math.round(Math.sin(y * 0.45 + x) * 1.2)) % 4;
    if (r === 0) c = shift(c, -0.14); else if (r === 1) c = shift(c, 0.08);
    if ((face === 'south' || face === 'west') && Math.abs(x + y * 0.4 - w * 0.22) < 0.8) c = '#ffe8cc';
    if ((x * 7 + y * 13) % 47 === 0) c = C.bark[3];
  }
  const s = seamAt(face, cube, x, y);
  return s === 2 ? '#fff0d8' : s === 1 ? C.seam : s === -1 ? shift(c, -0.18) : c;
});
// glossy fake leaves: offset rows of pointed leaves, a dark rim along each lower edge, a white
// specular tick on each, the seam line running over the canopy too
const leafP = (p, w, h, face, cube) => {
  const s = 9, rowH = 6;
  fill(p, w, h, (x, y) => (face === 'down' ? C.leaf[3] : band(C.leaf, face, x, y, h)));
  for (let r = -1; r * rowH < h + rowH; r++) for (let k = -1; k * s < w + s; k++) {
    const x0 = k * s + (r % 2 ? s / 2 : 0), y0 = r * rowH + (face === 'up' ? 0 : 1);
    for (let i = 0; i < s; i++) {
      const u = (i + 0.5) / s, bot = y0 + rowH - 1 + Math.round(Math.sin(u * Math.PI) * 1.6), X = Math.round(x0 + i);
      if (X < 0 || X >= w) continue;
      if (bot >= 0 && bot < h) p.px(X, bot, C.leafLine);
      if (bot - 1 >= 0 && bot - 1 < h) p.px(X, bot - 1, shift(band(C.leaf, face, X, bot, h), -0.12));
    }
    if (face === 'down') continue;
    // a lit upper-left lobe on every leaf and a hard white specular streak: moulded, glossy plastic
    for (let j = 0; j < 3; j++) for (let i = 1; i < 5 - j; i++) { const X = Math.round(x0 + i), Y = y0 + 1 + j; if (X >= 0 && X < w && Y >= 0 && Y < h) p.px(X, Y, shift(band(C.leaf, face, X, Y, h), 0.16)); }
    for (const [dx, dy, c] of [[2, 1, C.gloss], [3, 1, C.gloss], [1, 2, C.gloss], [2, 2, '#d8ffd0']]) { const X = Math.round(x0 + dx), Y = y0 + dy; if (X >= 0 && X < w && Y >= 0 && Y < h) p.px(X, Y, c); }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const sm = seamAt(face, cube, x, y); if (sm > 0) p.px(x, y, sm === 2 ? '#e8ffe0' : '#9af08a'); }
};
const rootP = (p, w, h, face, cube) => { barkP(p, w, h, face, cube); if (face === 'up') fill(p, w, h, (x, y) => ((x + y) % 4 === 0 ? C.bark[0] : undefined)); };
// the wind-up key: brass, its bow pierced by two round holes
const keyP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? GOLD[0] : face === 'down' ? GOLD[3] : y === 1 ? '#ffffff' : band(GOLD, face, x, y, h)));
const bowP = (p, w, h, face) => {
  keyP(p, w, h, face);
  if (face !== 'south' && face !== 'north') return;
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.22;
  fill(p, w, h, (x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); return d < r ? '#3a2410' : d < r + 1 ? GOLD[3] : (x === 0 || y === 0) ? GOLD[0] : undefined; });
};
// the price tag: manila card, a punched hole with a ring, a red price and a barcode
const tagP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (isSide(face) && face !== 'south' && face !== 'north' ? C.tagLo : y === h - 1 ? C.tagLo : C.tag));
  if (face !== 'south' && face !== 'north') return;
  const cx = Math.floor(w / 2);
  p.px(cx, 1, '#2a1a10').px(cx - 1, 1, '#c8b890').px(cx + 1, 1, '#c8b890').px(cx, 0, '#c8b890').px(cx, 2, '#c8b890');
  p.px(0, 0, 0).px(w - 1, 0, 0);
  p.rect(1, 4, w - 2, 2, C.price);
  for (const dx of [1, 3, 5]) p.rect(dx, 4, 1, 2, dx === 3 ? '#ffd8d8' : C.price);
  for (let x = 1; x < w - 1; x++) if (x % 2 || x % 3 === 0) p.rect(x, h - 4, 1, 2, '#1a1414');
};
const stringP = (p, w, h) => fill(p, w, h, () => C.string);
const strapP = (p, w, h) => fill(p, w, h, (x, y) => (y === 0 ? '#c8a07a' : (x + y) % 4 === 0 ? '#6a3a1a' : '#8a5228'));

// ---------------------------------------------------------------- face
// toy-paint eyes in the Cobblemon language: a heavy painted lid line, a flat white sclera block shaded
// under the lid, a sap-green iris block (two flat tones) with a pupil block and a highlight bar; the
// key emotions hand-drawn
const EYE = {
  open: [
    '..lllllll..',
    'lllllllllll',
    'sssssIIIIss',
    'wwwwwihkiww',
    'wwwwwihkiww',
    '.wwwwikkiw.',
    '..wwwiiiiw.',
    '....wwww...',
  ],
  angry: [
    '...........',
    'lll........',
    'llllll.....',
    'sssllllll..',
    'wwwssIlllll',
    '.wwwwihkIl.',
    '..wwwiiiis.',
    '....wwww...',
  ],
  sad: [
    '...........',
    '........lll',
    '.....llllll',
    '..llllllIss',
    'lllllIhkiww',
    '.lsssikkiw.',
    '..wwwiiiiw.',
    '....bbbb...',
  ],
  happy: [
    '...........',
    '...........',
    '....lll....',
    '...llIll...',
    '..ll...ll..',
    '.ll.....ll.',
    'll.......ll',
    '...........',
  ],
  closed: [
    '...........',
    '...........',
    '...........',
    '...........',
    'lllllllllll',
    '.lllllllll.',
    '...........',
    '...........',
  ],
  shock: [
    '.lllllllll.',
    'wwwwwwwwwww',
    'wwwwwwwwwww',
    'wwwwwwhkwww',
    'wwwwwwkkwww',
    'swwwwwwwwws',
    '.sswwwwwss.',
    '...sssss...',
  ],
  smug: [
    '...........',
    '...........',
    '...........',
    'lllllllllll',
    'lllllllllll',
    '.ssssIhkIs.',
    '..wwwiiiiw.',
    '....wwww...',
  ],
  sleepy: [
    '...........',
    '...........',
    '...........',
    '...........',
    'lllllllllll',
    '.lllllllll.',
    '..sssIIIIs.',
    '....wwww...',
  ],
  wide: [
    '.lllllllll.',
    'wwwwwwwwwww',
    'wwwwwIIIIww',
    'wwwwwihkiww',
    'wwwwwikkiww',
    'swwwwiiiiws',
    '.sswwwwwss.',
    '...sssss...',
  ],
  teary: [
    '..lllllll..',
    'lllllllllll',
    'sssssIIIIss',
    'wwwwwihkiww',
    'wwwwwihkiww',
    '.wwwwikkiw.',
    '..bbbbbbbb.',
    '....bbbb...',
  ],
};
const EYES = eyeRig({ style: 'pix', chunk: 1, parent: 'body', extra: ['smug'], at: [-2.3, 15.2, 3.72], line: C.ink, iris: '#46b058', irisDark: '#1c5a2c', pupilColor: '#0c140c', map: { ...pixStates(EYE.open), ...EYE } });
const MOUTH = mouthSet({
  serene: ['.........', '.........', '.l.....l.', '..lllll..', '.........'],
  sad: ['.........', '...lll...', '..l...l..', '.l.....l.', '.........'],
  o: ['...lll...', '..lmmml..', '..lmmml..', '...lll...', '.........'],
  grin: ['.........', '.lllllll.', '.lmmmmml.', '..lmttl..', '...lll...'],
  wail: ['...lll...', '..lmmml..', '.lmmmmml.', '.lmmtmml.', '..lllll..'],
  flat: ['.........', '.........', '..lllll..', '.........', '.........'],
  grit: ['.........', '.lllllll.', '.lwlwlwl.', '.lllllll.', '.........'],
}, { at: [0, 11.5, 3.72], def: 'serene', pal: { line: C.ink, inner: '#4a1a14', tongue: '#e07070' } });

// ---------------------------------------------------------------- the model
const ARM = [
  { name: 'armR', parent: 'body', pivot: [-4.2, 12.0, 0], rot: [0, 0, 12], cubes: [B(-8.6, 11.2, -0.8, -4.0, 12.8, 0.8, barkP)] },
  { name: 'foreR', parent: 'armR', pivot: [-8.0, 12.0, 0], rot: [0, 0, 16], cubes: [B(-8.8, 11.6, -0.7, -7.2, 16.6, 0.7, barkP)] },
  { name: 'handR', parent: 'foreR', pivot: [-8.0, 16.4, 0], cubes: [
    B(-10.4, 15.8, -1.9, -5.6, 19.4, 1.9, leafP), B(-9.6, 19.4, -1.3, -6.4, 20.4, 1.3, leafP),
  ] },
  { name: 'footR', parent: 'root', pivot: [-2.8, 1.4, 0.4], cubes: [B(-5.0, 0, -2.0, -0.8, 2.4, 2.6, rootP), B(-5.4, 0, 2.0, -3.4, 1.2, 3.8, rootP), B(-3.0, 0, 2.2, -1.0, 1.2, 4.0, rootP)] },
];
const CANOPY_LIGHTS = [[-9.0, 21.5, 2.0], [-5.0, 22.6, 6.9], [0, 23.4, 7.5], [5.0, 24.2, 6.9], [9.0, 25.0, 2.0], [7.2, 26.2, -6.0], [0, 27.0, -6.9], [-7.2, 27.8, -5.0], [-7.4, 29.2, 2.6], [-3.0, 30.4, 5.3], [3.0, 31.0, 5.3], [6.9, 31.4, 0]];
export const def = {
  name: 'plastree', ppu: 3, scale: 0.5, outline: { color: '#1a0e08', px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: [0, 2.2, 0], cubes: [
      B(-5.0, 2.0, -4.2, 5.0, 5.0, 4.2, barkP),
      B(-4.4, 4.6, -3.7, 4.4, 20.5, 3.7, barkP),
      // normal (or): thick round glasses in mustard plastic
      ...glasses({ x: -2.3, y: 15.0, z: 3.78, r: 2.1, tx: 4.7, temple: 6.8, id: 'acc-glasses', col: '#e8b830' }),
      // ultra: the guitar's strap over the shoulder
      ...acc('acc-guitar', [B(-5.2, 9.8, 3.75, 5.2, 10.6, 4.05, strapP, { pivot: [0, 10.2, 3.9], rot: [0, 0, -38] })]),
    ] },
    { name: 'key', parent: 'body', pivot: [0, 11.0, -3.7], cubes: [
      B(-1.0, 10.0, -4.3, 1.0, 12.0, -3.6, keyP), B(-0.45, 10.55, -6.9, 0.45, 11.45, -4.3, keyP),
      B(-3.9, 9.1, -7.5, -0.4, 12.9, -6.8, bowP), B(0.4, 9.1, -7.5, 3.9, 12.9, -6.8, bowP, { mirror: true }), B(-0.7, 10.3, -7.7, 0.7, 11.7, -6.6, keyP),
    ] },
    ...EYES.bones,
    { name: 'mouth', parent: 'body', pivot: [0, 11.5, 3.72], cubes: MOUTH.cubes },
    { name: 'canopy', parent: 'body', pivot: [0, 20.0, 0], cubes: [
      B(-8.6, 19.6, -6.4, 8.6, 27.6, 6.4, leafP),
      B(-6.8, 27.6, -5.0, 6.8, 31.4, 5.0, leafP),
      B(-4.0, 31.4, -2.8, 4.0, 33.4, 2.8, leafP),
      B(-10.0, 21.0, -4.0, -8.6, 26.0, 4.0, leafP), B(8.6, 21.0, -4.0, 10.0, 26.0, 4.0, leafP, { mirror: true }),
      B(-6.0, 21.0, 6.4, 6.0, 26.4, 7.4, leafP),
      B(-5.0, 20.4, -7.4, 5.0, 26.0, -6.4, leafP),
      // normal: a paper crown perched on top
      ...crown({ x0: -4.4, x1: 4.4, z0: -3.2, z1: 3.2, y: 33.0, h: 2.6, id: 'acc-crown' }),
      // dripped: fairy lights wound round the canopy
      ...lights({ pts: CANOPY_LIGHTS, id: 'acc-lights', every: 2.2, bulb: 0.8 }),
    ] },
    // the fringe: the lowest leaf locks falling over its brow, longer on one side
    { name: 'fringe', parent: 'canopy', pivot: [0, 20.6, 7.0], cubes: [
      B(-6.6, 17.4, 6.4, -1.8, 21.0, 7.6, leafP), B(-2.2, 18.2, 6.6, 1.8, 21.0, 7.5, leafP), B(1.4, 19.0, 6.4, 5.6, 21.0, 7.4, leafP),
    ] },
    ...both(...ARM),
    // ultra (or): a vintage mic held up in the right hand · dripped (or): a supermarket bag snagged on that branch
    { name: 'micR', parent: 'handR', pivot: [-8.0, 19.6, 1.6], cubes: mic({ x: -8.0, y: 19.6, z: 1.6, k: 0.75, id: 'acc-mic' }) },
    { name: 'bagR', parent: 'handR', pivot: [-8.0, 16.2, 2.2], cubes: bag({ x: -8.0, y: 14.6, z: 2.4, w: 3.8, h: 4.2, d: 2.2, id: 'acc-bag' }) },
    // the price tag on its string, hanging from the left branch
    { name: 'tag1', parent: 'armL', pivot: [7.0, 11.2, 0.6], cubes: [B(6.9, 8.6, 0.5, 7.1, 11.2, 0.7, stringP, { outline: false })] },
    { name: 'tag2', parent: 'tag1', pivot: [7.0, 8.6, 0.6], cubes: [B(5.8, 5.2, 0.42, 8.2, 8.7, 0.78, tagP)] },
    // ultra: a sticker-covered acoustic guitar slung across the front
    { name: 'guitar', parent: 'body', pivot: [0, 7.0, 4.0], rot: [0, 0, 40], cubes: guitar({ x: 0, y: 2.4, z: 3.9, k: 0.8, acoustic: true, id: 'acc-guitar' }) },
  ],
};
def.drip = [
  [{ id: 'acc-crown', name: 'Paper crown' }, { id: 'acc-glasses', name: 'Thick round glasses' }],
  [{ id: 'acc-bag', name: 'Snagged supermarket bag' }, { id: 'acc-lights', name: 'Fairy lights' }],
  [{ id: 'acc-guitar', name: 'Sticker-covered acoustic' }, { id: 'acc-mic', name: 'Vintage mic' }],
];
def.attach = {
  head: { bone: 'canopy', at: [0, 33.4, 0], size: 8 },
  face: { bone: 'body', at: [0, 14.2, 3.75], size: 8.8 },
  neck: { bone: 'body', at: [0, 10.5, 3.75], size: 8.8 },
  back: { bone: 'body', at: [0, 15.5, -3.8], size: 8.8 },
};

// ---------------------------------------------------------------- posing helpers
// a branch arm: up (raise), swing (forward), fwd (forearm forward), bend (forearm in over the head), twist
const arm = (P, S, o = {}) => { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, -(o.lift || 0), g * (o.swing || 0), -g * (o.up || 0)).rot('fore' + S, -(o.fwd || 0), 0, -g * (o.bend || 0)).rot('hand' + S, 0, g * (o.twist || 0), 0); };
const face = (P, e, m) => { if (e) P.face('eyes', e); if (m) P.face('mouth', m); };
// the key ticks round like clockwork: a step of `deg` every `per` seconds, each tick snapping and settling
const tick = (t, per, deg) => { const n = Math.floor(t / per), f = (t - n * per) / per; return -(n + Math.min(1, E.back(Math.min(1, f * 4)))) * deg; };
const HAND_L = [8.0, 17.6, 0], HAND_R = [-8.0, 17.6, 0], TOP = [0, 34, 0], MOUTHP = [0, 11.5, 4.2];
const stomp = (P, S, k) => P.pos('foot' + S, 0, 1.2 * k, 0.3 * k);
// lying stiff on its side, a fallen toy (k 0 → 1)
function fallen(P, k) {
  P.rot('root', 0, 0, 86 * k).pos('root', 13 * k, 5.2 * k, 0);
  arm(P, 'R', { up: -10 * k }); arm(P, 'L', { up: 30 * k });
}

// ---------------------------------------------------------------- animation
export const anim = {
  start: 'idle', seed: 21,
  breathe: { bone: 'canopy', amp: 0.012, per: 3.2 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.2], dur: 0.16 },
  look: { bone: 'canopy', yaw: 8, pitch: 4, speed: 3 },
  springs: [
    { bone: 'tag1', tip: [0, -2.6, 0], k: 60, d: 3, gain: 1.6, max: 50 },
    { bone: 'tag2', tip: [0, -3.4, 0], k: 50, d: 3, gain: 1.8, max: 50 },
    { bone: 'bagR', tip: [0, -3.6, 0], k: 70, d: 4, gain: 1.2, max: 30 },
    { bone: 'canopy', tip: [0, 10, 0], k: 260, d: 12, gain: 0.22, max: 5 },
    { bone: 'fringe', tip: [0, -3, 0.5], k: 220, d: 11, gain: 0.5, max: 10, axes: [1, 0.3, 1] },
    { bone: 'handR', tip: [0, 3, 0], k: 200, d: 10, gain: 0.35, max: 10 },
    { bone: 'handL', tip: [0, 3, 0], k: 200, d: 10, gain: 0.35, max: 10 },
  ],
  faces: { eyes: EYES.slot, mouth: MOUTH.slot },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'windup', 'pricecheck', 'windup'] },
  clips: {
    // a toy rocking gently on its moulded roots, the key ticking round, the tag swaying, a slow calm
    // gaze, a glint running over the plastic leaves now and then, one long sigh
    idle: { len: 6.0, loop: true, f(P, t) {
      const rk = Math.sin((t / 3) * TAU), sigh = bump(t, 3.6, 4.8);
      P.rot('body', 0, rk * 3, rk * 3.5).rot('canopy', -2 * sigh, 0, -rk * 1.5).sq('body', -0.03 * sigh);
      P.rot('key', 0, 0, tick(t, 0.5, 30));
      arm(P, 'R', { up: -6 * sigh + rk * 3, bend: 4 * rk }); arm(P, 'L', { up: -6 * sigh - rk * 3, bend: -4 * rk });
      const [gx, gy] = glance(t, [[0, 0], [-0.35, -0.1], [-0.35, -0.1], [0.3, 0.05], [0, -0.2], [0, -0.2]], 1.0, 0.18);
      eyesAt(P, gx, gy);
      face(P, sigh > 0.4 ? 'sleepy' : undefined, sigh > 0.3 ? 'flat' : 'serene');
      P.burst(0.7, 'rh-glint', 'canopy', [-5, 30, 4], {}).burst(2.6, 'rh-glint', 'canopy', [6, 25, 6.6], {}).burst(4.9, 'rh-glint', 'body', [-3, 12, 3.9], {});
      P.burst(4.0, 'steam', 'body', MOUTHP, { n: 2, dir: [0, 0.4, 1], speed: 0.4, scale: 0.6 });
    } },
    // a wind-up toy waddle: rocking side to side on stiff roots, the key spinning
    walk: { len: 0.9, loop: true, f(P, t) {
      const ph = (t / 0.9) * TAU, s = Math.sin(ph), hh = Math.abs(s);
      P.rot('root', 0, 0, s * 7).pos('root', 0, 0.6 * hh, 0).rot('body', 0, s * 8, 0).sq('body', -0.03 * (1 - hh));
      stomp(P, s > 0 ? 'L' : 'R', hh); P.rot('key', 0, 0, -t * 400);
      arm(P, 'R', { swing: 20 * s, up: 10 }); arm(P, 'L', { swing: -20 * s, up: 10 });
      face(P, 'open', 'serene'); eyesAt(P, 0, -0.1);
    } },
    // battle cry: the key whirs, it creaks up tall, branches flung up, every plastic leaf rattling
    cry: { len: 2.0, next: 'idle', f(P, t) {
      const crouch = bump(t, 0, 0.35), up = seg(t, 0.32, 0.5, E.back) * (1 - seg(t, 1.5, 1.85, E.inout)), rattle = up * wave(t, 18);
      P.pos('root', 0, 0.8 * up, 0).sq('body', -0.08 * crouch + 0.06 * up).rot('body', -4 * up, 0, rattle * 1.5).rot('canopy', rattle * 2, 0, rattle * 3);
      P.rot('key', 0, 0, -seg(t, 0, 1.6) * 1400);
      for (const S of ['R', 'L']) arm(P, S, { up: 60 * up - 10 * crouch, bend: -20 * up, twist: rattle * 10 });
      face(P, crouch > 0.3 ? 'shut' : up > 0.3 ? 'wide' : undefined, up > 0.3 ? 'wail' : 'flat'); P.blinkOK = false;
      if (t > 0.45 && t < 1.4) P.stream('rh-pleaf', 'canopy', [0, 30, 0], { rate: 18, speed: 1.4, spread: 1 });
      P.burst(0.45, 'ring', 'root', [0, 1, 0], {}).burst(0.5, 'rh-note', 'body', MOUTHP, { n: 3, dir: [0, 1, 0.6], speed: 1.2 }).burst(0.5, 'rh-glint', 'canopy', [0, 32, 4], {});
    } },
    // attack (price-tag darts): it draws its tagged branch back and flicks three tags like darts
    attack: { len: 1.1, next: 'idle', f(P, t) {
      const bk = seg(t, 0, 0.3, E.out) * (1 - seg(t, 0.3, 0.38, E.in)), hit = seg(t, 0.32, 0.42, E.in3) * (1 - seg(t, 0.65, 1.05, E.inout));
      P.rot('body', -4 * bk + 6 * hit, -16 * bk + 18 * hit, 0).pos('root', 0, 0, -0.8 * bk + 1.2 * hit).sq('body', wob(t, 0.42, 0.04, 4, 7));
      arm(P, 'L', { up: 30 * bk + 20 * hit, swing: -60 * bk + 80 * hit, bend: 30 * bk - 20 * hit, fwd: 30 * hit });
      arm(P, 'R', { up: 10, swing: 20 * bk });
      face(P, bk > 0.2 || hit > 0.2 ? 'angry' : undefined, bk > 0.2 ? 'grit' : hit > 0.2 ? 'o' : 'serene'); P.blinkOK = false;
      for (const [i, t0] of [0.38, 0.45, 0.52].entries()) P.burst(t0, 'rh-tag', 'handL', HAND_L, { n: 1, dir: [-0.15 + i * 0.15, 0.1, 1] });
      P.burst(0.4, 'rh-glint', 'handL', HAND_L, {}).burst(0.4, 'spark', 'handL', HAND_L, { scale: 0.6 });
    } },
    // special (fake plastic trees): wound tight, it whirls round like a music-box ornament, flinging a
    // storm of glossy plastic leaves and glints, then strikes a pose
    special: { len: 2.5, next: 'idle', f(P, t) {
      const wind = seg(t, 0, 0.5), spin = seg(t, 0.5, 1.9, E.inout), pose = seg(t, 1.9, 2.05, E.back) * (1 - seg(t, 2.25, 2.5));
      P.rot('key', 0, 0, wind * 360 - spin * 1800).rot('root', 0, 900 * spin, 0).pos('root', 0, 1.2 * bump(t, 0.5, 1.9), 0).sq('body', -0.06 * bump(t, 0.3, 0.55) + 0.04 * bump(t, 0.5, 1.9));
      for (const S of ['R', 'L']) arm(P, S, { up: 50 * bump(t, 0.5, 1.9) + 70 * pose, bend: -30 * bump(t, 0.5, 1.9) });
      face(P, wind > 0 && t < 0.5 ? 'shut' : spin > 0 && spin < 1 ? 'closed' : pose > 0.3 ? 'happy' : undefined, spin > 0 && spin < 1 ? 'o' : pose > 0.3 ? 'grin' : 'serene'); P.blinkOK = false;
      if (t > 0.55 && t < 1.85) { const a = t * 14; P.stream('rh-pleaf', 'root', [Math.cos(a) * 8, 22, Math.sin(a) * 8], { rate: 50, dir: [Math.cos(a), 0.3, Math.sin(a)], speed: 2.2 }).stream('rh-glint', 'canopy', [0, 26, 0], { rate: 6, spread: 1 }); }
      for (const t0 of [0.2, 0.32, 0.44]) P.burst(t0, 'spark', 'key', [0, 11, -7.4], { scale: 0.4 });
      P.burst(1.92, 'ring', 'root', [0, 1, 0], { scale: 1.2 }).burst(1.92, 'rh-pleaf', 'canopy', [0, 26, 5], { n: 26, dir: [0, 0.2, 1], speed: 2.6 }).burst(1.95, 'sparkle', 'canopy', TOP, { n: 10, speed: 1.4 });
    } },
    // hurt: plastic clack — it tips back and rocks like a weighted toy, chips of plastic flying
    hurt: { len: 0.85, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.06, E.out), rock = wob(t, 0.06, -16, 2.6, 4.5);
      P.rot('root', rock, 0, rock * 0.4).pos('root', 0, 0, -1.2 * k * (1 - seg(t, 0.2, 0.6))).rot('canopy', rock * 0.3, 0, 0);
      for (const S of ['R', 'L']) arm(P, S, { up: 40 * (1 - seg(t, 0.1, 0.6)) });
      face(P, t < 0.45 ? 'shut' : 'sad', 'grit'); P.blinkOK = false;
      P.burst(0.02, 'shard', 'body', [0, 14, 4], { n: 6 }).burst(0.02, 'spark', 'body', [0, 14, 5], {}).burst(0.04, 'rh-pleaf', 'canopy', [0, 28, 4], { n: 5 });
    } },
    // faint: it runs down — the key slows and stops, it stiffens… and topples over like a dropped toy
    faint: { len: 2.3, next: 'down', f(P, t) {
      const slow = seg(t, 0, 1.0, E.out), fall = seg(t, 1.0, 1.4, E.in), land = wob(t, 1.4, 1, 4, 7);
      P.rot('key', 0, 0, -slow * 260).rot('body', 0, 0, wave(t, 2.5) * 3 * (1 - slow)).sq('body', -0.04 * slow * (1 - fall));
      fallen(P, fall); P.rot('root', 0, 0, 3 * land * (t > 1.4 ? 1 : 0)).pos('root', 0, 0.6 * Math.abs(land) * (t > 1.4 ? 1 : 0), 0);
      face(P, t < 0.9 ? 'sleepy' : 'x', t < 0.9 ? 'flat' : 'o'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.42, 'dust', 'canopy', [0, 24, 0], { n: 10 }).burst(1.42, 'shard', 'canopy', [0, 24, 4], { n: 6 }).burst(1.44, 'rh-pleaf', 'canopy', [0, 26, 0], { n: 8 }).burst(1.5, 'star', 'canopy', [0, 30, 4], { n: 4 });
    } },
    down: { len: 3.0, loop: true, f(P, t) {
      fallen(P, 1); P.breathW = 0.3; P.blinkOK = false; P.lookW = 0;
      P.rot('key', 0, 0, -260 - 20 * seg(t, 1.6, 1.7, E.back));
      face(P, 'x', 'o');
    } },
    // win: it winds itself and spins like a music-box ornament, then holds up its branches, serene
    win: { len: 2.6, next: 'idle', f(P, t) {
      const spin = seg(t, 0.2, 1.4, E.inout), pose = seg(t, 1.35, 1.55, E.back) * (1 - seg(t, 2.25, 2.6, E.inout));
      P.rot('root', 0, 720 * spin, 0).pos('root', 0, 1.0 * bump(t, 0.2, 1.4), 0).rot('key', 0, 0, -t * 500);
      for (const S of ['R', 'L']) arm(P, S, { up: 30 * bump(t, 0.2, 1.4) + 70 * pose, bend: -10 * pose, twist: 20 * pose * wave(t, 2) });
      P.rot('canopy', 0, 0, wave(t, 1.5) * 3 * pose);
      face(P, spin > 0 && spin < 1 ? 'closed' : 'happy', pose > 0.3 ? 'grin' : 'serene'); P.blinkOK = false;
      for (const t0 of [0.3, 0.7, 1.1]) P.burst(t0, 'rh-note', 'canopy', [4, 30, 2], { n: 1, speed: 1 });
      P.burst(1.4, 'sparkle', 'canopy', TOP, { n: 12, speed: 1.4 }).burst(1.4, 'rh-glint', 'canopy', [-6, 28, 6], {}).burst(1.5, 'rh-glint', 'canopy', [6, 30, 5], {});
    } },
    // asleep: run down, the key stopped, branches drooping, now and then one last tick
    sleep: { len: 3.6, loop: true, f(P, t) {
      const br = Math.sin((t / 3.6) * TAU);
      P.pos('root', 0, -0.4 + br * 0.1, 0).rot('canopy', 4 + br * 1.5, 0, 3).sq('body', -0.04 + br * 0.02);
      arm(P, 'R', { up: -20, bend: -10 }); arm(P, 'L', { up: -20, bend: -10 });
      P.rot('key', 0, 0, -12 * seg(t, 2.4, 2.5, E.back));
      face(P, 'closed', 'flat'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.5, 'z', 'canopy', [4, 30, 5], {}).burst(2.0, 'z', 'canopy', [4, 30, 5], {});
    } },
    // the dance: a stiff, jerky clockwork routine — snapping between poses on every beat, a twist,
    // a stomp, branches pumping, the key a blur… a freeze, and one last tick
    dance: { len: 2.9, next: 'idle', f(P, t) {
      const live = 1 - seg(t, 2.3, 2.35), bt = t / 0.32, n = Math.floor(bt), snap = E.back(Math.min(1, (bt - n) * 4)), pv = (n + 7) % 4, pc = n % 4;
      const POSE = [[30, -40, 0, 1], [-30, 40, 1, -1], [0, 0, -1, 1], [20, 20, 1, 1]];
      const A = POSE[pv], Bp = POSE[pc], m = (i) => (A[i] + (Bp[i] - A[i]) * snap) * live;
      P.rot('body', 0, m(0), m(2) * 6).pos('root', 0, 0.5 * Math.abs(Math.sin(bt * Math.PI)) * live, 0).rot('canopy', 0, -m(0) * 0.3, -m(2) * 4);
      arm(P, 'R', { up: 70 * Math.max(0, m(3)) - 20 * Math.max(0, -m(3)), bend: m(1) * 0.8 }); arm(P, 'L', { up: 70 * Math.max(0, -m(3) * 0.5 + m(2) * 0.5 + 0.5 * live) - 10, bend: -m(1) * 0.8 });
      stomp(P, pc % 2 ? 'R' : 'L', bump(bt - n, 0, 0.5) * live);
      P.rot('key', 0, 0, -t * 900 * live - 2070 * (1 - live) + 30 * (t > 2.6 ? E.back(seg(t, 2.6, 2.7, E.lin)) : 0));
      face(P, live > 0.5 ? (pc === 3 ? 'happy' : 'open') : t > 2.6 ? 'happy' : 'sleepy', live > 0.5 ? (pc % 2 ? 'o' : 'grin') : 'serene'); P.blinkOK = false;
      for (let i = 1; i < 8; i++) P.burst(i * 0.32, i % 2 ? 'rh-note' : 'rh-glint', 'canopy', [i % 2 ? 6 : -6, 30, 3], { n: 1, speed: 0.9 });
      P.burst(2.62, 'sparkle', 'canopy', TOP, { n: 10, speed: 1.3 }).burst(2.62, 'spark', 'key', [0, 11, -7.4], { scale: 0.5 });
    } },
    // signature: running down, it reaches round to its key and winds itself — crank, crank, crank —
    // lets go, and clatters into a stiff clockwork dance that slows… and slows… and stops
    windup: { len: 4.6, next: 'idle', f(P, t) {
      const sag = seg(t, 0, 0.4) * (1 - seg(t, 0.5, 0.7)), reach = seg(t, 0.4, 0.7, E.out) * (1 - seg(t, 1.9, 2.05, E.in));
      let crank = 0; for (const c0 of [0.75, 1.15, 1.55]) crank += seg(t, c0, c0 + 0.3, E.inout);
      const go = t > 2.0 ? 1 : 0, rt = Math.max(0, t - 2.0), spd = Math.max(0, 1 - rt / 2.2), ph = (1 - (1 - Math.min(1, rt / 2.2)) ** 2) * 2.2 * 9;   // phase that slows to a stop
      P.sq('body', -0.05 * sag).rot('canopy', 6 * sag, 0, 0);
      // reaching round behind with the right branch, cranking the key in three turns
      arm(P, 'R', { swing: -80 * reach, up: 20 * reach, bend: 70 * reach, fwd: -40 * reach });
      P.rot('body', 0, 22 * reach, -4 * crank * reach);
      P.rot('key', 0, 0, crank * 120 - (go ? ph * 40 : 0) - 30 * sag);
      // released: a clockwork dance, stiff hops and branch pumps, slowing down with the spring
      const beat = Math.sin(ph * Math.PI), hop = Math.abs(beat) * spd;
      P.pos('root', 0, 0.9 * hop * go, 0).rot('root', 0, go * ph * 20, 0).rot('body', 0, 0, beat * 8 * spd * go);
      arm(P, 'L', { up: go * (40 + 40 * beat) * Math.max(spd, 0.2) + 10 * reach }); if (go) arm(P, 'R', { up: (40 - 40 * beat) * Math.max(spd, 0.2) });
      stomp(P, beat > 0 ? 'R' : 'L', hop * go);
      const stopped = rt > 2.2;
      face(P, t < 0.5 ? 'sleepy' : t < 2.0 ? 'shut' : stopped ? (t > 4.2 ? 'sad' : 'sleepy') : spd > 0.4 ? 'happy' : 'open', t < 2.0 && t > 0.6 ? 'grit' : stopped ? 'flat' : spd > 0.4 ? 'grin' : 'o'); P.blinkOK = false; P.lookW = 0;
      for (const c0 of [0.75, 1.15, 1.55]) P.burst(c0 + 0.3, 'spark', 'key', [0, 11, -7.6], { scale: 0.45 }).burst(c0 + 0.3, 'rh-glint', 'key', [2, 12, -7.6], {});
      for (let i = 0; i < 6; i++) P.burst(2.05 + i * 0.3, 'rh-note', 'canopy', [i % 2 ? 6 : -6, 30, 3], { n: 1, speed: 0.8 });
      P.burst(4.3, 'sweat', 'canopy', [7, 22, 5], { n: 2 });
    } },
    // fidget: it lifts the branch with the tag and turns it over to read its own price… and sighs
    pricecheck: { len: 3.2, next: 'idle', f(P, t) {
      const lift = seg(t, 0.1, 0.5, E.out) * (1 - seg(t, 2.4, 2.9, E.inout)), sigh = bump(t, 1.7, 2.6);
      arm(P, 'L', { up: 28 * lift, swing: 44 * lift, bend: -16 * lift, twist: 60 * lift * seg(t, 0.6, 0.9) });
      P.rot('body', 4 * lift, -10 * lift, 0).rot('canopy', 6 * lift + 6 * sigh, 0, 0).sq('body', -0.04 * sigh);
      eyesAt(P, 0.35 * lift, -0.35 * lift);
      face(P, t > 0.9 && t < 1.2 ? 'wide' : sigh > 0.3 ? 'sad' : lift > 0.5 ? 'open' : undefined, sigh > 0.2 ? 'sad' : t > 0.9 && t < 1.4 ? 'o' : 'serene'); P.blinkOK = t > 2.6; P.lookW = 0;
      P.burst(2.0, 'steam', 'body', MOUTHP, { n: 3, dir: [0, 0.3, 1], speed: 0.4, scale: 0.7 }).burst(1.0, 'sweat', 'canopy', [7, 22, 5], { n: 1 });
    } },
  },
};
def.anim = anim;
// the ultra-drip form: a black-lacquer trunk with its seam picked out in gold, a bright gold-leaf
// canopy, the key and tag in gold; eyes kept
def.dripForm = { map: keepEyes(EYES, radioMap({ black: [[300, 31]], gold: [[31, 180]], swap: { [C.seam]: '#ffd23e', '#fff0d8': '#fff4b0', '#9af08a': '#fff4b0', '#e8ffe0': '#ffffff' } })), fx: { 'rh-tag': 'rh-tagg', 'rh-pleaf': 'rh-pleafg', 'rh-note': 'rh-noteg' } };
