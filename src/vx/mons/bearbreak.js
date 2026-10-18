// Bearbreak — stage 2 of the bear line (Echo). The cub grew up and the colour drained out: a
// lanky grey teen bear with sleek fur, a crisp buzz with a shaved part, droopy eyes that rarely
// look up, and a belly where the cub's daisies and stars survive only as faded grey markings. One
// red thing is left in its world — a deflated heart balloon it never lets go of, drifting on a
// string at its shoulder. It sways alone, sighs, and sings its sorrow through an auto-tuned
// shockwave while the balloon glows. Drip: shades pushed up or a fur hat; a long minimal coat or
// a cracked-heart chain; big grey high-tops or a little teddy backpack (the cub it used to be).
// An original design that winks at a rapper's heartbreak album.
import { E, seg, bump, wob, wave } from '../anim.js';
import { fur, fringe, halo, gold, chain, shutter, sneaker, fill, wrapX, isSide, edgeLine, sh } from './bear_parts.js';
import { eyeRig, eyesAt, eyesScale, glance, mouthArt } from './eyes.js';
import { shade, poly, ramp, shift, h2 } from './kit.js';

const C = {
  fur: '#93939a', furHi: '#b6b6bc', furLo: '#6c6c74', furEdge: '#5e5e67', furTip: '#c2c2c8', furLite: '#a6a6ad',
  belly: '#b4b3b2', bellyHi: '#cbcac8', bellyLo: '#8e8d8c', ghost: '#d6d5d2', ghostLo: '#9a9998',
  hair: '#3c3c44', hairHi: '#5a5a64', part: '#a8a8b0',
  muz: '#c9c6c0', muzHi: '#e2dfda', muzLo: '#a29f99', muzLine: '#4e4c4a',
  nose: '#26262c', noseHi: '#4e4e58', noseSpec: '#a8a8b4',
  inEar: '#b4aeb0', inEarLo: '#8e888c', pad: '#b8b2ae',
  coat: '#4a4c55', coatHi: '#676a75', coatLo: '#34353c', coatLine: '#232429', coatSeam: '#3e4048',
  knit: '#bdbcb7', knitHi: '#d8d7d2', knitLo: '#94938e',
  shade: '#d4d6dc', shadeHi: '#ffffff', shadeLo: '#8e9098', lensGap: '#3a3c46',
  hat: '#cfcac2', hatHi: '#ece8e0', hatLo: '#9a958e', hatTip: '#6e6a64',
  silver: { hi: '#ffffff', base: '#c8ccd6', lo: '#8a8e9c', deep: '#4e5260', spec: '#ffffff' },
  red: '#d42230', redHi: '#ff5a5e', redLo: '#8e1222', redDeep: '#5c0a18', redSpec: '#ffd4d6', crease: '#a8182a',
  glow: '#ff4a52', glowHi: '#ffd0d0', glowLo: '#e0202e', string: '#e8e6e2',
  cub: '#8a5634', cubHi: '#b27a4a', cubLo: '#5c3820', cream: '#f0d2a0',
  ink: '#16141a',
};

// ---------------------------------------------------------------- painters
const furP = (seed, o = {}) => fur(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furEdge, tip: C.furTip, lite: C.furLite, s: 10, tipH: 3, pt: 0.55, seed, ...o });
const headFur = furP(12), headFur2 = furP(24, { s: 8 }), limbFur = furP(36, { s: 7, tipH: 3 });
const headHalo = halo(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furEdge, tip: C.furTip, n: 24, depth: 0.11, inner: 0.8, sq: 2.6, seed: 6 });
const neckFluff = fringe(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furEdge, tip: C.furTip, seed: 81, tw: 3.4, short: 0.55 });
// the belly: paler fur with the cub's daisies and stars faded to grey ghosts
const ghostPattern = (face, cube, w, h) => {
  if (face !== 'south') return null;
  const m = new Map(), cx = (w - 1) / 2, put = (x, y, c) => { if (x >= 0 && x < w && y >= 0 && y < h && ((x - cx) / (w * 0.36)) ** 2 + ((y - h * 0.56) / (h * 0.44)) ** 2 < 1) m.set(y * w + x, c); };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) put(x, y, ramp([C.bellyHi, C.belly, C.bellyLo], y / (h - 1), x, y));
  [[0.36, 0.42, 0], [0.66, 0.66, 1], [0.4, 0.82, 2], [0.64, 0.3, 2]].forEach(([fx, fy, t]) => {
    const X = Math.round(w * fx), Y = Math.round(h * fy);
    if (t < 2) for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), pet = 2.8 * (0.62 + 0.38 * Math.abs(Math.cos(a * 2.5))); if (r <= pet) put(X + dx, Y + dy, r < 1 ? C.ghostLo : C.ghost); }
    else for (let i = -2; i <= 2; i++) { put(X + i, Y, C.ghost); put(X, Y + i, C.ghost); }
  });
  return (x, y) => m.get(y * w + x) || null;
};
const torsoFur = furP(48, { under: ghostPattern });
const muzP = fur(C.muz, { hi: C.muzHi, lo: C.muzLo, line: shift(C.muz, -0.14), lite: C.muzHi, ramp: [C.muzHi, C.muz, C.muz, shift(C.muz, -0.06)], s: 8, rowH: 6, tipH: 2.5, seed: 9, y0: 2 });
const noseP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? C.noseHi : face === 'down' ? '#121216' : y === 0 ? C.noseHi : y >= h - 1 ? '#121216' : C.nose)); if (face === 'south' && w > 3) { p.px(1, 1, C.noseSpec); p.px(2, 1, C.noseHi); } };
const earP = (seed) => { const f = furP(seed, { s: 6, tipH: 2.5 }); return (p, w, h, face, cube) => { f(p, w, h, face, cube); if (face !== 'south') return; const cx = w / 2, cy = h / 2 + 0.3, rx = w / 2 - 1.8, ry = h / 2 - 1.8; fill(p, w, h, (x, y) => { const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2; return d < 1 ? (d < 0.45 ? C.inEarLo : C.inEar) : null; }); }; };
// a crisp buzz with a shaved part on the right, and a sharp line-up at the brow
const buzzP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'down' ? C.hatLo : (x * 3 + y * 5) % 7 === 0 ? C.hairHi : C.hair));
  if (face === 'up') for (let y = 0; y < h; y++) p.px(Math.round(w * 0.3), y, C.part);
  if (face === 'south') { p.px(Math.round(w * 0.3), 0, C.part); for (let x = 0; x < w; x++) p.px(x, h - 1, '#1e1e24'); }
  if (isSide(face) && face !== 'south') for (let x = 0; x < w; x++) p.px(x, h - 1, '#1e1e24');
};
const pawP = (seed) => { const f = furP(seed, { s: 6, tipH: 2.5 }); return (p, w, h, face, cube) => { f(p, w, h, face, cube); if (face === 'down') fill(p, w, h, (x, y) => (x > 0 && x < w - 1 && y > 0 && y < h - 1 ? C.pad : null)); }; };
// the heart balloon: glossy red, wrinkled where it has lost its air; a hot glowing twin for the special
const heartP = (glow) => (p, w, h, face) => {
  const [hi, base, lo, deep] = glow ? [C.glowHi, C.glow, C.glowLo, C.redLo] : [C.redHi, C.red, C.redLo, C.redDeep];
  fill(p, w, h, (x, y) => (face === 'up' ? hi : face === 'down' ? lo : ramp([hi, base, base, lo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (face === 'down') return;
  if (!glow && face === 'south' && w > 6 && h > 4) { const y0 = Math.round(h * 0.55); for (let x = 2; x < w - 2; x++) p.px(x, y0 + (x % 4 < 2 ? 0 : 1), C.crease); }
  if (face === 'south' || face === 'west') { p.px(1, 1, C.redSpec); p.px(2, 1, glow ? '#ffffff' : C.redSpec); p.px(1, 2, hi); }
  if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, h - 1, deep);
};
const stringP = (p, w, h) => fill(p, w, h, (x, y) => (y % 3 === 0 ? '#b8b6b2' : C.string));
const knotP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? C.redHi : y === h - 1 ? C.redDeep : C.redLo));

// ---- drip
const coatBase = shade(C.coat, { top: C.coatHi, bottom: C.coatLo, grain: 0.02 });
const coatP = (o = {}) => (p, w, h, face, cube) => {
  coatBase(p, w, h, face, cube);
  if (!isSide(face)) return;
  if (o.hem) { for (let x = 0; x < w; x++) { p.px(x, h - 1, C.coatLine); p.px(x, h - 2, C.coatSeam); } }
  if (o.dart && (face === 'east' || face === 'west')) for (let y = 2; y < h - 2; y++) p.px(Math.floor(w / 2), y, C.coatSeam);
  if (o.pocket && face === 'south') { const py = Math.round(h * 0.22); p.hl(1, w - 2, py, C.coatLine); p.hl(1, w - 2, py - 1, C.coatHi); }
  if (o.cuff) { const cy = h - 3; p.hl(0, w - 1, cy, C.coatLine); p.hl(0, w - 1, cy + 1, C.coatHi); }
};
const knitAt = (x, y, h) => { const c = ramp([C.knitHi, C.knit, C.knit, C.knitLo], h > 1 ? y / (h - 1) : 0.5, x, y); return x % 2 ? shift(c, -0.08) : c; };
const coatFront = (p, w, h, face, cube) => {
  coatP({ dart: true })(p, w, h, face, cube);
  if (face !== 'south') return;
  const cx = (w - 1) / 2;
  for (let y = 0; y < h; y++) { const half = 1 + (1 - y / (h - 1)) ** 1.3 * 6; for (let x = 0; x < w; x++) { const d = Math.abs(x - cx); if (d < half - 0.5) p.px(x, y, knitAt(x, y, h)); else if (d < half + 0.5) p.px(x, y, C.coatHi); else if (d < half + 1.5 && y < h * 0.62) p.px(x, y, C.coatLo); } }
  p.px(Math.round(cx), h - 2, C.coatLine); p.px(Math.round(cx) + 1, h - 2, C.coatLine);
};
const collarP = (p, w, h, face, cube) => { coatBase(p, w, h, face, cube); if (face === 'south') fill(p, w, h, (x, y) => (Math.abs(x - (w - 1) / 2) < 3 ? knitAt(x, y, h) : null)); };
const lens = shutter({ frame: C.shade, hi: C.shadeHi, lo: C.shadeLo, gap: C.lensGap, gapLo: '#4e5060', bar: 2, round: 4, bridge: 1.5 });
const barP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? C.shadeHi : face === 'down' ? C.shadeLo : y === 0 ? C.shadeHi : y === h - 1 ? C.shadeLo : C.shade));
const hatP = fur(C.hat, { hi: C.hatHi, lo: C.hatLo, line: '#7a756e', tip: C.hatTip, lite: C.hatHi, s: 9, tipH: 4, pt: 0.7, seed: 91 });
const silverP = gold(C.silver);
// a silver heart with a crack through it
const crackP = (p, w, h) => {
  const m = (w - 1) / 2;
  fill(p, w, h, (x, y) => { const u = (x - m) / (w / 2), v = (y - h * 0.36) / (h / 2), f = (u * u + v * v - 0.62) ** 3 - u * u * v * v * v * 1.5; return f < 0 ? (x + y < w * 0.6 ? C.silver.hi : f > -0.004 ? C.silver.lo : C.silver.base) : null; });
  edgeLine(p, C.silver.deep);
  let x = Math.round(m); for (let y = 1; y < h - 1; y++) { p.px(x, y, C.silver.deep); x += y % 2 ? 1 : -1; }
};
const kicks = sneaker({ up: '#c8c8cc', upHi: '#e8e8ec', upLo: '#9a9aa2', panel: '#6a6a74', sole: '#f2f2ee', soleLo: '#b4b4b0', lace: '#5a5a64' });
const cubFur = fur(C.cub, { hi: C.cubHi, lo: C.cubLo, line: '#4c2c16', tip: '#d39a5e', s: 6, tipH: 2.5, seed: 97 });
const cubFace = (p, w, h, face, cube) => {
  cubFur(p, w, h, face, cube);
  if (face !== 'north') return;
  const cx = (w - 1) / 2, ey = Math.round(h * 0.36);
  for (const sx of [-1, 1]) { const ex = Math.round(cx + sx * 3.2); p.rect(ex - 1, ey, 2, 2, '#f0a838'); p.px(ex - 1, ey, '#ffffff'); p.px(ex, ey + 1, '#1e120c'); }
  fill(p, w, h, (x, y) => (((x - cx) / 3) ** 2 + ((y - h * 0.66) / 2.2) ** 2 < 1 ? C.cream : null));
  p.rect(Math.round(cx) - 1, Math.round(h * 0.56), 2, 2, '#2a1810');
};
const strapP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? C.cubHi : x === 0 ? C.cubHi : x === w - 1 ? '#3a2012' : C.cubLo));

// ---------------------------------------------------------------- face
// eyes: droopy, the outer corner low; a sliver of white, a slate-blue iris, the pupil sunk low (hand-pixelled)
const EYES = eyeRig({ style: 'pix', chunk: 2, at: [-2.15, 31.6, 4.63], line: '#16141a', iris: '#5a78a8', irisDark: '#34486c', extra: ['smug'], map: { open: [
  '..lll',
  '.lwil',
  'lwwkl',
  '.lll.',
] } });
const MOUTHS = ['frown', 'o', 'flat', 'wavy', 'grit', 'smile', 'tongue'];

// ---------------------------------------------------------------- the model
const B = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const A = (id, c) => ({ ...c, id, hide: true });
const HX = -7.0;
const heartCubes = (glow) => [
  B([HX - 1.0, 23.4, 0.2], [2.0, 1.2, 1.6], heartP(glow)),
  B([HX - 2.3, 24.4, -0.05], [4.6, 1.6, 2.1], heartP(glow)),
  B([HX - 3.4, 25.8, -0.3], [6.8, 1.8, 2.6], heartP(glow)),
  B([HX - 3.6, 27.4, -0.3], [3.3, 2.0, 2.6], heartP(glow)),
  B([HX + 0.3, 27.2, -0.3], [3.2, 1.8, 2.6], heartP(glow)),
  B([HX - 3.1, 29.2, -0.15], [2.4, 0.8, 2.3], heartP(glow)),
  B([HX + 0.7, 28.9, -0.15], [2.3, 0.8, 2.3], heartP(glow)),
].map((c) => (glow ? { ...c, glow: true, inflate: 0.12, id: 'heart-glow', hide: true } : { ...c, id: 'heart-dull' }));
const CHAIN = chain([[-2.8, 25.6, 2.0], [-2.5, 24.0, 2.85], [-1.4, 22.6, 3.0], [0, 22.0, 3.05], [1.4, 22.6, 3.0], [2.5, 24.0, 2.85], [2.8, 25.6, 2.0]], { len: 1.0, w: 0.7, t: 0.32, step: 0.76, gold: C.silver }).map((c) => A('acc-chain', c));
export const def = {
  name: 'bearbreak', ppu: 3, scale: 0.42, outline: { color: '#141318', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    // legs: thigh → shin → foot
    { name: 'thighR', parent: 'root', pivot: [-2.0, 15.2, 0], cubes: [B([-3.35, 8.4, -1.4], [2.7, 7.2, 2.8], limbFur)] },
    { name: 'shinR', parent: 'thighR', pivot: [-2.0, 8.6, 0], cubes: [B([-3.25, 1.7, -1.3], [2.5, 7.1, 2.6], limbFur)] },
    { name: 'footR', parent: 'shinR', pivot: [-2.0, 1.7, 0], cubes: [B([-3.5, 0, -1.7], [3.0, 1.9, 4.6], pawP(41)), A('acc-kicks', B([-3.85, 0, -2.2], [3.7, 2.2, 5.6], kicks)), A('acc-kicks', B([-3.6, 2.0, -1.8], [3.2, 1.8, 3.8], kicks))] },
    { name: 'thighL', parent: 'root', pivot: [2.0, 15.2, 0], cubes: [B([0.65, 8.4, -1.4], [2.7, 7.2, 2.8], limbFur)] },
    { name: 'shinL', parent: 'thighL', pivot: [2.0, 8.6, 0], cubes: [B([0.75, 1.7, -1.3], [2.5, 7.1, 2.6], limbFur)] },
    { name: 'footL', parent: 'shinL', pivot: [2.0, 1.7, 0], cubes: [B([0.5, 0, -1.7], [3.0, 1.9, 4.6], pawP(43), { mirror: true }), A('acc-kicks', B([0.15, 0, -2.2], [3.7, 2.2, 5.6], kicks, { mirror: true })), A('acc-kicks', B([0.4, 2.0, -1.8], [3.2, 1.8, 3.8], kicks, { mirror: true }))] },
    { name: 'body', parent: 'root', pivot: [0, 15.2, 0], cubes: [
      B([-4.4, 13.6, -2.7], [8.8, 12.6, 5.4], torsoFur),
      B([-4.8, 22.8, -2.4], [9.6, 3.0, 4.8], furP(52)),
      B([-3.6, 12.6, -2.4], [7.2, 1.4, 4.8], furP(54)),
      B([-3.6, 25.0, 2.35], [7.2, 1.6, 0], neckFluff, { plane: 'z' }),
      // drip: the long coat (torso, shoulders, collar)
      A('acc-coat', B([-4.9, 13.6, -3.1], [9.8, 12.8, 6.0], coatP({ dart: true }), { faces: { south: coatFront } })),
      A('acc-coat', B([-5.2, 23.4, -2.8], [10.4, 2.6, 5.6], coatP())),
      A('acc-coat', B([-3.4, 25.4, -2.7], [6.8, 2.5, 5.6], collarP)),
      // drip: the teddy backpack's straps
      A('acc-pack', B([-3.4, 16.0, 2.75], [0.9, 9.0, 0.4], strapP)), A('acc-pack', B([2.5, 16.0, 2.75], [0.9, 9.0, 0.4], strapP)),
    ] },
    { name: 'coatB', parent: 'body', pivot: [0, 14.2, -3.1], cubes: [A('acc-coat', B([-4.8, 6.6, -3.35], [9.6, 7.8, 0.55], coatP({ hem: true })))] },
    { name: 'coatR', parent: 'body', pivot: [-4.8, 14.2, 0], cubes: [A('acc-coat', B([-5.05, 6.6, -3.1], [0.55, 7.8, 5.8], coatP({ hem: true }))), A('acc-coat', B([-5.05, 6.6, 2.35], [2.7, 7.8, 0.55], coatP({ hem: true, pocket: true })))] },
    { name: 'coatL', parent: 'body', pivot: [4.8, 14.2, 0], cubes: [A('acc-coat', B([4.5, 6.6, -3.1], [0.55, 7.8, 5.8], coatP({ hem: true }))), A('acc-coat', B([2.35, 6.6, 2.35], [2.7, 7.8, 0.55], coatP({ hem: true, pocket: true })))] },
    { name: 'chain', parent: 'body', pivot: [0, 25.6, 2.0], cubes: [...CHAIN, A('acc-chain', B([-0.3, 21.2, 2.85], [0.6, 0.7, 0.4], silverP)), A('acc-chain', B([-1.3, 18.6, 3.08], [2.6, 2.6, 0], crackP, { plane: 'z' })), A('acc-chain', B([-0.9, 19.0, 2.75], [1.8, 1.8, 0.32], silverP))] },
    { name: 'pack', parent: 'body', pivot: [0, 24.0, -3.0], cubes: [
      A('acc-pack', B([-3.2, 15.6, -6.1], [6.4, 6.6, 3.0], cubFur, { faces: { north: cubFace } })),
      A('acc-pack', B([-3.4, 21.8, -5.4], [1.8, 1.8, 1.1], cubFur)), A('acc-pack', B([1.6, 21.8, -5.4], [1.8, 1.8, 1.1], cubFur)),
      A('acc-pack', B([-3.4, 16.4, -3.5], [0.9, 8.6, 0.8], strapP)), A('acc-pack', B([2.5, 16.4, -3.5], [0.9, 8.6, 0.8], strapP)),
    ] },
    // arms: upper → fore (fur, coat sleeves when worn, paw)
    { name: 'armR', parent: 'body', pivot: [-5.1, 25.0, 0], cubes: [B([-6.4, 18.9, -1.35], [2.5, 6.4, 2.7], limbFur), A('acc-coat', B([-6.55, 18.8, -1.5], [2.8, 6.6, 3.0], coatP()))] },
    { name: 'foreR', parent: 'armR', pivot: [-5.15, 19.2, 0], cubes: [B([-6.35, 13.3, -1.3], [2.4, 6.1, 2.6], limbFur), A('acc-coat', B([-6.5, 13.2, -1.45], [2.7, 6.2, 2.9], coatP({ cuff: true }))), B([-6.3, 10.8, -1.2], [2.3, 2.5, 2.4], pawP(51))] },
    { name: 'armL', parent: 'body', pivot: [5.1, 25.0, 0], cubes: [B([3.9, 18.9, -1.35], [2.5, 6.4, 2.7], limbFur), A('acc-coat', B([3.75, 18.8, -1.5], [2.8, 6.6, 3.0], coatP()))] },
    { name: 'foreL', parent: 'armL', pivot: [5.15, 19.2, 0], cubes: [B([3.95, 13.3, -1.3], [2.4, 6.1, 2.6], limbFur), A('acc-coat', B([3.8, 13.2, -1.45], [2.7, 6.2, 2.9], coatP({ cuff: true }))), B([4.0, 10.8, -1.2], [2.3, 2.5, 2.4], pawP(53), { mirror: true })] },
    // the balloon on its string, held in the right paw
    { name: 'string1', parent: 'foreR', pivot: [-5.4, 11.8, 0.9], rot: [-4, 0, 20], cubes: [B([-5.5, 11.8, 0.8], [0.2, 6.0, 0.2], stringP, { outline: false })] },
    { name: 'string2', parent: 'string1', pivot: [-5.4, 17.8, 0.9], rot: [0, 0, -12], cubes: [B([-5.5, 17.8, 0.8], [0.2, 5.4, 0.2], stringP, { outline: false })] },
    { name: 'balloon', parent: 'string2', pivot: [-5.4, 23.2, 0.9], rot: [0, 0, -8], cubes: [B([-5.8, 22.9, 0.5], [0.8, 0.8, 0.8], knotP), ...heartCubes(false), ...heartCubes(true)] },
    { name: 'head', parent: 'body', pivot: [0, 26.6, 0.4], cubes: [
      B([-4.8, 27.0, -4.0], [9.6, 8.4, 8.0], headFur),
      B([-5.3, 28.0, -3.4], [10.6, 5.6, 6.8], headFur2),
      B([-4.0, 26.6, -3.4], [8.0, 9.2, 6.8], headFur),
      B([-4.0, 27.6, -4.6], [8.0, 7.4, 9.2], headFur2),
      B([-4.5, 34.6, -4.3], [9.0, 1.5, 8.7], buzzP),
      B([-6.2, 25.9, 0.2], [12.4, 10.8, 0], headHalo, { plane: 'z' }),
      B([0.2, 25.9, -5.6], [0, 10.8, 11.0], headHalo, { plane: 'x' }),
      B([-2.2, 27.4, 4.3], [4.4, 2.9, 2.6], muzP),
      B([-1.8, 30.1, 4.3], [3.6, 0.5, 2.1], muzP),
      B([-1.8, 26.6, 4.2], [3.6, 1.2, 2.3], muzP),
      B([-1.1, 29.5, 6.55], [2.2, 1.1, 1.0], noseP),
      B([-0.6, 29.0, 6.5], [1.2, 0.6, 0.9], noseP),
      ...MOUTHS.map((s) => B([-1.9, 27.45, 6.93], [3.8, 1.6, 0], mouthArt(s, { line: C.muzLine, inner: '#3a1a22', tongue: '#c86a78' }), { plane: 'z', id: 'm-' + s, hide: s !== 'frown', outline: false })),
      // drip: a big fluffy fur hat
      A('acc-furhat', B([-5.6, 33.9, -4.9], [11.2, 2.6, 9.8], hatP)),
      A('acc-furhat', B([-4.8, 36.3, -4.2], [9.6, 1.8, 8.4], hatP)),
      A('acc-furhat', B([-3.8, 37.9, -3.2], [7.6, 0.7, 6.4], hatP)),
    ] },
    ...EYES.bones,
    { name: 'earR', parent: 'head', pivot: [-4.2, 34.0, -1.0], rot: [0, 0, 30], cubes: [B([-6.6, 33.4, -1.7], [3.8, 2.6, 1.4], earP(61)), B([-6.1, 32.9, -1.7], [2.8, 3.6, 1.4], earP(62))] },
    { name: 'earL', parent: 'head', pivot: [4.2, 34.0, -1.0], rot: [0, 0, -30], cubes: [B([2.8, 33.4, -1.7], [3.8, 2.6, 1.4], earP(63), { mirror: true }), B([3.3, 32.9, -1.7], [2.8, 3.6, 1.4], earP(64), { mirror: true })] },
    // drip: the shades, pushed up and resting on top of the head (lenses face the sky)
    { name: 'shades', parent: 'head', pivot: [0, 36.6, -0.8], rot: [-74, 0, 0], cubes: [
      A('acc-shades', B([-4.9, 36.3, -1.05], [9.8, 0.6, 0.5], barP)),
      A('acc-shades', B([-4.9, 33.7, -0.82], [9.8, 2.85, 0], lens, { plane: 'z' })),
      A('acc-shades', B([-5.35, 36.35, -4.6], [0.4, 0.45, 3.6], barP)), A('acc-shades', B([4.95, 36.35, -4.6], [0.4, 0.45, 3.6], barP)),
    ] },
  ],
};
def.drip = [
  [{ id: 'acc-shades', name: 'Shades pushed up' }, { id: 'acc-furhat', name: 'Fur hat' }],
  [{ id: 'acc-coat', name: 'Long grey coat' }, { id: 'acc-chain', name: 'Cracked-heart chain' }],
  [{ id: 'acc-kicks', name: 'Big grey high-tops' }, { id: 'acc-pack', name: 'Teddy backpack' }],
];
def.attach = {
  head: { bone: 'head', at: [0, 36.1, 0], size: 9 },
  face: { bone: 'head', at: [0, 31.6, 4.7], size: 8 },
  neck: { bone: 'body', at: [0, 25.6, 2.8], size: 6.6 },
  back: { bone: 'body', at: [0, 19.5, -2.8], size: 8.8 },
};

// ---------------------------------------------------------------- animation
const TAU = Math.PI * 2, LEG = 6.8;
const GREY = [0.62, 0.62, 0.66];
const face = (P, e, m) => { if (e) { P.face('eyes', e); P.blinkOK = false; } if (m) P.face('mouth', m); return P; };
// bend both knees so the hips drop by d while the feet stay planted
function knees(P, d, sides = ['R', 'L']) {
  const th = (Math.acos(Math.max(-1, Math.min(1, 1 - Math.max(0, d) / (2 * LEG)))) * 180) / Math.PI;
  for (const s of sides) P.pos('thigh' + s, 0, -d, 0).rot('thigh' + s, -th, 0, 0).rot('shin' + s, 2 * th, 0, 0).rot('foot' + s, -th, 0, 0);
}
// the resting stance: right paw holding the string a little forward, left paw resting at the hip
function stance(P, k = 1) {
  P.rot('armR', -6 * k, 0, -5 * k).rot('foreR', -16 * k, 0, 0).rot('armL', 4 * k, 0, 9 * k).rot('foreL', -14 * k, 0, -12 * k);
  str(P, 22 * k, 5 * k);
}
// keep the balloon string upright against the arm's swing (ax, az: the arm's total x / z offsets)
function str(P, ax, az) { P.rot('string1', ax, 0, az); }
// the balloon drifts and bobs by itself
function drift(P, t, k = 1) { P.rot('string1', wave(t, 0.23) * 4 * k, 0, wave(t, 0.31, 1) * 4 * k).rot('string2', wave(t, 0.41, 2) * 6 * k, 0, wave(t, 0.29) * 5 * k).rot('balloon', wave(t, 0.37, 1) * 6 * k, wave(t, 0.19) * 10 * k, wave(t, 0.53, 2) * 6 * k); }
const inflate = (P, k) => P.scl('balloon', 1 + 0.32 * k, 1 + 0.38 * k, 1 + 0.32 * k);
export const anim = {
  start: 'idle', seed: 33,
  breathe: { bone: 'body', amp: 0.014, per: 3.8 },
  blink: { slot: 'eyes', closed: 'closed', every: [3.0, 6.0], dur: 0.16 },
  look: { bone: 'head', yaw: 26, pitch: 10, speed: 3 },
  springs: [
    { bone: 'string1', tip: [0, 6, 0], k: 40, d: 3.5, gain: 1.2, max: 30 },
    { bone: 'string2', tip: [0, 5.4, 0], k: 36, d: 3.5, gain: 1.3, max: 36 },
    { bone: 'balloon', tip: [-1.6, 4, 0], k: 50, d: 4, gain: 1.1, max: 28 },
    { bone: 'coatB', tip: [0, -7.5, 0], k: 120, d: 8, gain: 0.9, max: 22, axes: [1, 0.2, 0.5] },
    { bone: 'coatR', tip: [0, -7.5, 1.5], k: 120, d: 8, gain: 0.9, max: 22, axes: [1, 0.2, 0.6] },
    { bone: 'coatL', tip: [0, -7.5, 1.5], k: 120, d: 8, gain: 0.9, max: 22, axes: [1, 0.2, 0.6] },
    { bone: 'chain', tip: [0, -4.5, 1], k: 120, d: 7, gain: 0.8, max: 14, axes: [1, 0.3, 1] },
    { bone: 'pack', tip: [0, -5, -2], k: 180, d: 10, gain: 0.45, max: 8, axes: [1, 0.3, 1] },
    { bone: 'earR', tip: [-1, 2, 0], k: 220, d: 11, gain: 0.5, max: 10 },
    { bone: 'earL', tip: [1, 2, 0], k: 220, d: 11, gain: 0.5, max: 10 },
  ],
  faces: {
    eyes: EYES.slot,
    mouth: { default: 'frown', states: Object.fromEntries(MOUTHS.map((s) => [s, ['m-' + s]])) },
    heart: { default: 'dull', states: { dull: ['heart-dull'], glow: ['heart-glow'] } },
  },
  fidget: { every: [6, 10], clips: ['sigh', 'look'] },
  clips: {
    // alone with its thoughts: a slow weight shift, head hung, eyes sliding away, the balloon bobbing at its shoulder
    idle: { len: 4.0, loop: true, f(P, t) {
      const sw = wave(t, 0.25), sw2 = wave(t, 0.25, 1.4), lookUp = bump(t, 1.1, 2.4);
      stance(P); drift(P, t);
      P.pos('body', sw * 0.35, -0.15 + Math.abs(sw) * 0.1, 0).rot('body', 5, sw2 * 3, -sw * 1.6);
      knees(P, 0.25 + Math.max(0, sw) * 0.5, ['L']); knees(P, 0.25 + Math.max(0, -sw) * 0.5, ['R']);
      P.rot('head', 13 - 16 * lookUp, -10 * lookUp + sw2 * 3, 4 * lookUp - sw * 2).rot('armR', -sw * 2, 0, 0);
      const [gx, gy] = glance(t, [[0, -0.2], [0.3, -0.25], [0, -0.2], [-0.3, -0.1]], 1.0);
      eyesAt(P, gx * (1 - lookUp) - 0.35 * lookUp, gy * (1 - lookUp) + 0.2 * lookUp);
      if (lookUp > 0.5) face(P, 'sad', 'flat');
    } },
    // a slow, slouched shuffle; the coat swings, the balloon trails behind
    walk: { len: 1.3, loop: true, f(P, t) {
      const ph = (t / 1.3) * TAU, s = Math.sin(ph), c = Math.cos(ph), amp = 17;
      stance(P); drift(P, t, 0.5);
      for (const [side, sg] of [['R', 1], ['L', -1]]) {
        const sw = s * sg, kn = Math.max(0, c * sg) * 26;
        P.rot('thigh' + side, -sw * amp - kn * 0.45, 0, 0).rot('shin' + side, kn, 0, 0).rot('foot' + side, sw * amp * 0.7 - kn * 0.5, 0, 0);
        P.rot('coat' + side, -Math.max(0, sw) * amp * 0.6, 0, 0);
      }
      const dy = -LEG * 2 * (1 - Math.cos((amp * Math.abs(s) * Math.PI) / 180)) - 0.2;
      P.pos('thighR', 0, dy, 0).pos('thighL', 0, dy, 0).pos('body', 0, dy, 0).rot('body', 7, s * 4, s * 1.5);
      P.rot('head', 14 + Math.abs(c) * 2, -s * 3, 0).rot('armR', -s * 5, 0, 0).rot('coatB', 4 + Math.abs(s) * 4, 0, 0);
      eyesAt(P, 0, -0.25);
    } },
    // the wail: a breath in, the head thrown back, an auto-tuned cry rippling out
    cry: { len: 2.4, next: 'idle', f(P, t) {
      const inhale = seg(t, 0, 0.45, E.inout) * (1 - seg(t, 0.45, 0.6)), wail = seg(t, 0.45, 0.7, E.back) * (1 - seg(t, 1.8, 2.3, E.inout));
      stance(P, 1 - 0.6 * wail); drift(P, t, 1.4);
      P.pos('body', 0, 0.5 * inhale + 0.3 * wail, 0).rot('body', 5 - 6 * inhale - 8 * wail, 0, 0).sq('body', 0.03 * inhale);
      P.rot('head', 13 - 10 * inhale - 40 * wail + wave(t, 6) * 2 * wail, 0, wave(t, 3) * 3 * wail);
      P.rot('armL', -10 * wail, 0, 30 * wail).rot('foreL', -20 * wail, 0, 10 * wail).rot('armR', 0, 0, -20 * wail);
      eyesScale(P, 1, 1 + 0.2 * inhale - 0.2 * wail);
      face(P, t < 0.45 ? 'teary' : t < 1.9 ? 'shut' : 'teary', t < 0.45 ? 'flat' : t < 1.9 ? 'o' : 'wavy'); P.lookW = 1 - wail;
      for (const tb of [0.62, 1.0, 1.38]) P.burst(tb, 'bear-tune', 'head', [0, 30, 5], { n: 1 });
      if (wail > 0.4) P.stream('bear-bluenote', 'head', [0, 33, 4], { rate: 6, spread: 0.8 });
      P.burst(0.7, 'tear', 'head', [-2.4, 30.5, 5], { n: 4, dir: [-1, 0.6, 0.5], speed: 1.4 }).burst(0.7, 'tear', 'head', [2.4, 30.5, 5], { n: 4, dir: [1, 0.6, 0.5], speed: 1.4 });
    } },
    // the heartbreak hook: the left paw comes up, the body coils, then a long looping hook
    attack: { len: 1.1, next: 'idle', f(P, t) {
      const wind = seg(t, 0, 0.34, E.inout) * (1 - seg(t, 0.34, 0.42, E.in)), hit = seg(t, 0.34, 0.48, E.in3) * (1 - seg(t, 0.62, 1.05, E.inout));
      stance(P, 1 - Math.max(wind, hit) * 0.5); drift(P, t, 1);
      P.pos('root', 0, 0, -1.2 * wind + 4.5 * hit).rot('body', -4 * wind + 10 * hit, -24 * wind + 30 * hit, 3 * wind - 4 * hit);
      P.rot('armL', 30 * wind - 82 * hit, 0, 50 * wind - 30 * hit).rot('foreL', -50 * wind + 4 * hit, 0, 12 * wind);
      P.rot('head', -6 * wind + 6 * hit, 16 * wind - 18 * hit, 0);
      P.rot('thighR', -16 * hit, 0, 0).rot('shinR', 18 * hit, 0, 0).rot('thighL', 12 * wind + 10 * hit, 0, 0);
      P.rot('coatR', -18 * hit, 0, -10 * hit).rot('coatL', 10 * wind, 0, 16 * hit).rot('coatB', 14 * hit, 0, 0);
      eyesScale(P, 1 + 0.1 * hit, 1 - 0.15 * wind);
      face(P, t < 0.7 ? 'angry' : undefined, t < 0.36 ? 'grit' : t < 0.7 ? 'o' : undefined);
      P.burst(0.47, 'spark', 'body', [1.5, 22, 10], {}).burst(0.47, 'bear-heart', 'body', [1.5, 22, 10], { n: 3, speed: 1.6 }).burst(0.47, 'star', 'body', [1.5, 22, 10], { n: 4 });
    } },
    // the special: the balloon rises and glows; it sings and the sorrow rings out in stepped waves
    special: { len: 3.0, next: 'idle', f(P, t) {
      const lift = seg(t, 0.4, 0.85, E.back) * (1 - seg(t, 2.35, 2.9, E.inout)), sing = seg(t, 0.8, 1.05, E.out) * (1 - seg(t, 2.2, 2.6, E.inout)), dip = bump(t, 0, 0.45);
      stance(P, 1 - lift); drift(P, t, 0.6);
      P.rot('armR', -150 * lift, 0, -14 * lift).rot('foreR', -10 * lift, 0, 0); str(P, 120 * lift, 0);
      P.rot('string1', 0, 0, -20 * lift).rot('string2', 0, 0, 12 * lift).rot('balloon', 0, 0, 8 * lift);
      inflate(P, lift);
      P.pos('body', 0, -0.6 * dip + 0.4 * sing, 0).rot('body', 6 * dip - 8 * sing, 0, 0);
      P.rot('head', 10 * dip - 34 * sing + wave(t, 5) * 2 * sing, 0, 0);
      P.rot('armL', -16 * sing, 0, 40 * sing).rot('foreL', -30 * sing, 0, 0);
      eyesScale(P, 1, 1 - 0.1 * sing);
      P.face('heart', lift > 0.35 && sing > 0.05 ? 'glow' : 'dull'); face(P, sing > 0.3 ? 'closed' : t < 0.6 ? 'sad' : undefined, sing > 0.3 ? 'o' : 'flat'); P.lookW = 1 - sing;
      for (const tb of [1.0, 1.35, 1.7, 2.05]) { P.burst(tb, 'bear-tunered', 'balloon', [-7, 27, 1], { n: 1, scale: 1.4 }); P.burst(tb + 0.1, 'bear-tune', 'body', [0, 22, 3], { n: 1, scale: 1.8 }); }
      if (sing > 0.3) P.stream('bear-bluenote', 'head', [0, 33, 4], { rate: 7, spread: 1 }).stream('bear-heart', 'balloon', [-7, 27, 1], { rate: 4, spread: 0.8 });
      P.burst(0.9, 'sparkle', 'balloon', [-7, 27, 1], { n: 8, speed: 1.2 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.24, 0.7, E.inout));
      stance(P); drift(P, t, 1.5);
      P.pos('root', 0, 0, -2.2 * k).rot('body', -14 * k + wob(t, 0.24, 3, 3, 6), 0, wave(t, 13) * 3 * k).rot('head', -18 * k, 0, 8 * k);
      P.rot('armL', -10 * k, 0, 40 * k).rot('coatB', -16 * k, 0, 0).rot('coatR', 10 * k, 0, 0).rot('coatL', 10 * k, 0, 0);
      eyesScale(P, 1 + 0.2 * k, 1 - 0.2 * k);
      face(P, 'shut', 'wavy');
      P.burst(0.02, 'bear-fluff', 'body', [0, 22, 3], { n: 6, speed: 1.3, tint: GREY }).burst(0.02, 'spark', 'body', [0, 21, 4], {}).burst(0.12, 'sweat', 'head', [-5, 35, 2], { n: 2 });
    } },
    // the knees give, it sinks to the floor and tips over; the balloon sinks with it
    faint: { len: 2.6, next: 'down', f(P, t) {
      const sway = seg(t, 0, 0.3) * (1 - seg(t, 0.6, 0.7)), kneel = seg(t, 0.55, 1.05, E.in), tip = seg(t, 1.2, 1.7, E.bounce);
      stance(P, 1 - kneel * 0.5); drift(P, t, 0.5);
      P.rot('body', 0, wave(t, 1.3) * 10 * sway, wave(t, 1.8) * 6 * sway).rot('head', 10 * kneel, 0, wave(t, 1.8, 1) * 10 * sway);
      P.pos('thighR', 0, -6.6 * kneel, 0).pos('thighL', 0, -6.6 * kneel, 0).pos('body', 0, -6.6 * kneel, 0);
      P.rot('thighR', -84 * kneel, 0, 0).rot('thighL', -84 * kneel, 0, 0).rot('shinR', 84 * kneel, 0, 0).rot('shinL', 84 * kneel, 0, 0).rot('footR', 40 * kneel, 0, 0).rot('footL', 40 * kneel, 0, 0);
      P.rot('body', 18 * kneel, 0, 0).rot('coatB', -30 * kneel, 0, 0).rot('coatR', -40 * kneel, 0, 0).rot('coatL', -40 * kneel, 0, 0);
      P.rot('root', 0, 0, 78 * tip).pos('root', -3 * tip, 3.4 * tip, 0).rot('armL', -30 * tip, 0, -10 * tip).rot('armR', 0, 0, -50 * tip);
      P.rot('string1', 0, 0, 60 * seg(t, 1.0, 2.0)).rot('string2', 0, 0, 40 * seg(t, 1.0, 2.0)).scl('balloon', 1, 1 - 0.25 * seg(t, 1.2, 2.4), 1);
      face(P, t < 0.6 ? 'teary' : 'swirl', t < 1.2 ? 'wavy' : 'o'); P.lookW = 1 - kneel;
      P.burst(0.3, 'tear', 'head', [-2.2, 31, 5], { n: 2, dir: [-0.5, 0, 1], speed: 0.6 }).burst(1.05, 'dust', 'root', [0, 1, 2], { n: 6, spread: 1 }).burst(1.68, 'dust', 'root', [-8, 1, 1], { n: 8, spread: 1, speed: 0.8 }).burst(1.2, 'star', 'head', [0, 37, 0], { n: 4 });
    } },
    down: { len: 3.0, loop: true, f(P, t) {
      stance(P, 0.5); drift(P, t, 0.3);
      P.pos('thighR', 0, -6.6, 0).pos('thighL', 0, -6.6, 0).pos('body', 0, -6.6, 0).rot('body', 18, 0, 0).rot('head', 10, 0, 0);
      P.rot('thighR', -84, 0, 0).rot('thighL', -84, 0, 0).rot('shinR', 84, 0, 0).rot('shinL', 84, 0, 0).rot('footR', 40, 0, 0).rot('footL', 40, 0, 0);
      P.rot('coatB', -30, 0, 0).rot('coatR', -40, 0, 0).rot('coatL', -40, 0, 0).rot('root', 0, 0, 78).pos('root', -3, 3.4, 0);
      P.rot('armL', -30 + wave(t, 0.33) * 3, 0, -10).rot('armR', 0, 0, -50).rot('string1', 0, 0, 60).rot('string2', 0, 0, 40).scl('balloon', 1, 0.75, 1);
      face(P, 'swirl', 'o'); P.lookW = 0; P.breathW = 0.6;
    } },
    // a rare good moment: the balloon fills and rises, the bear looks up and almost smiles
    win: { len: 3.2, next: 'idle', f(P, t) {
      const up = seg(t, 0.2, 0.9, E.back) * (1 - seg(t, 2.5, 3.2, E.inout)), nod = bump(t, 1.4, 1.9), sway = seg(t, 1.0, 1.3) * (1 - seg(t, 2.4, 2.8));
      stance(P); drift(P, t, 1 - up * 0.5);
      inflate(P, up); P.rot('string1', 0, 0, -16 * up).rot('string2', 0, 0, 10 * up).pos('string1', 0, 1.5 * up, 0);
      P.rot('head', 13 - 30 * up + 10 * nod, -14 * up, 4 * up).rot('body', 5 - 7 * up, wave(t, 0.8) * 5 * sway, wave(t, 0.8, 1) * 3 * sway).pos('body', 0, 0.3 * up, 0);
      eyesAt(P, -0.3 * up, 0.25 * up); eyesScale(P, 1 + 0.1 * up, 1 + 0.15 * up);
      face(P, up > 0.5 ? (t < 1.3 ? 'wide' : 'happy') : undefined, up > 0.5 ? 'smile' : undefined); P.face('heart', up > 0.6 && t < 2.4 ? 'glow' : 'dull');
      if (up > 0.5) P.stream('bear-heart', 'balloon', [-7, 27, 1], { rate: 3, spread: 0.7 });
      P.burst(0.7, 'sparkle', 'balloon', [-7, 28, 1], { n: 6 }).burst(1.5, 'bear-bluenote', 'head', [0, 34, 3], { n: 3 });
    } },
    // asleep on the floor, knees hugged to its chest, the balloon tied to its wrist hovering over it
    sleep: { len: 4.0, loop: true, f(P, t) {
      const br = Math.sin((t / 4) * TAU);
      P.pos('root', 0, -11.6, 0).rot('body', 22 + br * 1.5, 0, 0);
      P.pos('thighR', 0, -1.0, 0).pos('thighL', 0, -1.0, 0).rot('thighR', -112, 6, 0).rot('thighL', -112, -6, 0).rot('shinR', 118, 0, 0).rot('shinL', 118, 0, 0).rot('footR', -6, 0, 0).rot('footL', -6, 0, 0);
      P.rot('armR', -58, 0, 16).rot('foreR', -70, 0, 26).rot('armL', -58, 0, -16).rot('foreL', -70, 0, -26); str(P, 128, -42);
      P.rot('coatB', -20, 0, 0).rot('coatR', -60, 0, -10).rot('coatL', -60, 0, 10).rot('head', 22 + br * 2, 0, 8);
      drift(P, t, 0.6);
      face(P, 'closed', br > 0.4 ? 'o' : 'flat'); P.lookW = 0; P.breathW = 0.5;
      P.burst(0.5, 'z', 'head', [3, 36, 4], {}).burst(1.8, 'z', 'head', [3, 36, 4], {}).burst(3.1, 'z', 'head', [3, 36, 4], {});
    } },
    // fidget: a long sigh — shoulders up, breath in, then everything drops
    sigh: { len: 2.6, next: 'idle', f(P, t) {
      const inn = seg(t, 0.1, 0.9, E.inout) * (1 - seg(t, 1.0, 1.5, E.in)), drop = seg(t, 1.0, 1.5, E.out) * (1 - seg(t, 2.0, 2.6, E.inout));
      stance(P); drift(P, t);
      P.pos('body', 0, 0.6 * inn - 0.5 * drop, 0).sq('body', 0.04 * inn - 0.03 * drop).rot('body', 5 - 4 * inn + 6 * drop, 0, 0);
      P.rot('armR', 0, 0, 4 * inn).rot('armL', 0, 0, -4 * inn).rot('head', 13 - 12 * inn + 10 * drop, 0, 0);
      knees(P, 0.6 * drop); eyesScale(P, 1, 1 - 0.2 * drop);
      face(P, inn > 0.5 ? 'closed' : drop > 0.3 ? 'sleepy' : undefined, inn > 0.4 ? 'flat' : drop > 0.3 ? 'o' : undefined);
      if (t > 1.05 && t < 1.6) P.stream('steam', 'head', [0, 27.5, 7], { rate: 10, dir: [0, -0.3, 1], spread: 0.3, speed: 0.5, scale: 0.7 });
    } },
    // fidget: looks up at the balloon, nudges it with a paw, watches it bob, looks away
    look: { len: 3.0, next: 'idle', f(P, t) {
      const look = seg(t, 0.1, 0.5, E.inout) * (1 - seg(t, 2.4, 2.9, E.inout)), tap = bump(t, 0.9, 1.5);
      stance(P); drift(P, t, 1);
      P.rot('head', 13 - 26 * look, -28 * look, 6 * look).rot('body', 5 - 3 * look, -8 * look, 0);
      P.rot('armL', -30 * tap, 0, -60 * tap).rot('foreL', -50 * tap, 0, -20 * tap);
      P.rot('string2', 30 * bump(t, 1.2, 1.7), 0, -20 * bump(t, 1.2, 1.9)).rot('balloon', 0, 30 * bump(t, 1.2, 2.2), 0);
      eyesAt(P, -0.35 * look, 0.25 * look);
      face(P, look > 0.5 && t < 2.2 ? (t > 1.3 && t < 1.9 ? 'wide' : 'open') : undefined, t > 1.3 && t < 1.9 ? 'o' : undefined);
      P.burst(1.25, 'bear-heart', 'balloon', [-7, 28, 1], { n: 1, speed: 0.4 });
    } },
  },
};
def.anim = anim;
