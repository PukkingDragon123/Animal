// Everpunch — the Foo Fighters homage, stage 2 ("Everlong"). Foopod grown into a hulking armoured
// mantis-shrimp brawler: deep-blue plates with rainbow-lit rims under a bold orange "colour and shape"
// wash down its chest and forearms, massive spiked smashing clubs held low and forward, a long rocker
// mane that whips out behind it, two drumstick antennae it plays its own clubs with, sharp glowing
// eyes on stalks split by the striped midband, and three little glowing UFO "foo fighters" forever
// orbiting it. Its punch boils the water: a blink, a white flash, a ring of collapsing bubbles.
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import { eyeRig, mouthRig, eyesScale } from './eyes.js';
import { shade, gradient, layer, poly, ramp, shift, mix, h2 } from './kit.js';
import { denim, B, both, armour, spots, rainbowPlate, bands, hair, hairLocks, blade, eyeHousingP, FX, legRig, step, saccade, rotXYZ, DRIP_FORM, D2R } from './shrimp_parts.js';

const C = {
  ink: '#0e0c1c',
  blue: '#2a44b8', blueHi: '#5a80f2', blueLo: '#172a78', blueDeep: '#0e1a4a',
  rims: ['#3ae8ff', '#5aff8a', '#ffe23a', '#ff8a2a', '#ff3e9a', '#a46aff'],
  chest: ['#ffb43a', '#ff8a26', '#f2582a', '#e0383a', '#c8306a', '#8a3ab0'],
  orange: '#ff8a26', orangeHi: '#ffc860', orangeLo: '#c8501a',
  club: '#f6ead2', clubHi: '#ffffff', clubLo: '#d8bc98', clubBase: '#ff9a3a',
  spike: '#ffe8c4', spikeTip: '#ffffff', spikeRoot: '#ff9a3a',
  hair: { base: '#2a2656', hi: '#5450a8', lo: '#14102c', sheen: '#8c96f4' },
  stick: '#f0d8a8', stickLo: '#c09060',
  stalk: ['#ffb43a', '#f08a2c'], band: ['#3ae8ff', '#ffe23a', '#ff3e9a'],
  ufo: '#ffb04a', ufoHi: '#fff2c4', ufoRim: '#ff6a2a', dim: '#6a5a6e', dimHi: '#9a8a98',
  fan: { root: '#2a44b8', base: '#3a3ad0', edge: '#ff8a26', rim: '#ffc860', keel: '#141e5a', eye: '#3ae8ff', eyeRing: '#0e1a4a', eyeCore: '#ffffff', spine: '#fff0c8' },
};

// ---------------------------------------------------------------- painters
const blueA = armour(C.blue, { top: C.blueHi, bottom: C.blueLo, dots: 7 });
// a plate of the rainbow carapace: deep blue, its top edge lit in one hue of the rainbow
const rimP = (i, o = {}) => layer(armour(C.blue, { top: C.blueHi, bottom: C.blueLo, keel: o.keel, dots: 7, seed: i + 3 }), (p, w, h, face) => {
  if (face === 'down') return;
  const r = C.rims[i % C.rims.length];
  if (face === 'up') { for (let x = 0; x < w; x++) p.px(x, h - 1, r); return; }
  for (let x = 0; x < w; x++) { p.px(x, 0, r); p.px(x, 1, mix(r, C.blueHi, 0.55)); }
});
const chestPs = C.chest.map((c, i) => rainbowPlate(c, i ? C.chest[i - 1] : '#ffffff'));
const orangeP = armour(C.orange, { top: C.orangeHi, bottom: C.orangeLo });
// the merus: blue with the orange wash sweeping along its outer side
const armP = layer(blueA, (p, w, h, face) => { if (face === 'west' || face === 'east') for (let y = Math.round(h * 0.45); y < h - 1; y++) for (let x = 0; x < w; x++) p.px(x, y, y === Math.round(h * 0.45) ? C.orangeHi : C.orange); });
const foreP = layer(armour(C.orange, { top: C.orangeHi, bottom: C.orangeLo, keel: true }), spots(C.orangeLo, { every: 6, skip: 0.6 }));
// the smashing club: a pearly heel with a hairline crack, warming to orange at the wrist
const clubP = (p, w, h, face) => {
  const base = Math.round((h - 1) * 0.78);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c;
    if (face === 'up') { const d = Math.max(Math.abs(x - (w - 1) / 2) / (w / 2), Math.abs(y - (h - 1) / 2) / (h / 2)); c = d > 0.75 ? C.club : d > 0.45 ? '#fff8ee' : C.clubHi; }
    else if (face === 'down') c = C.orangeLo;
    else c = y > base ? (y === h - 1 ? C.orangeLo : C.clubBase) : y < base * 0.45 ? C.clubHi : y < base * 0.85 ? C.club : C.clubLo;
    p.px(x, y, c);
  }
  if (face === 'up' || face === 'down') return;
  p.px(1, 1, '#ffffff'); p.px(2, 2, '#ffffff');
  if (face === 'south') { let x = Math.round(w * 0.6); for (let y = 2; y < base - 1; y++) { p.px(x, y, '#c8a888'); if (y % 3 === 0) x += 1; } }
};
const spikeP = gradient([C.spikeTip, C.spike, C.spikeRoot]);
const tipP = shade(C.spikeTip, { top: '#ffffff', bottom: '#e8dcc8' });
const legP = blueA;
const kneeP = rimP(3);
const footP = gradient([C.blueHi, C.blue, C.blueLo]);
const toeP = gradient([C.orangeHi, C.orange, '#8a2a14']);
const hairBox = hair(C.hair, { lock: 3 });
const hairCapP = (p, w, h, face) => { hairBox(p, w, h, face); if (face !== 'up') return; const m = Math.floor(w / 2); for (let y = 0; y < h; y++) { p.px(m, y, C.hair.lo); p.px(m - 1, y, C.hair.hi); } };
const beardP = hair(C.hair, { lock: 2 });
const beardTipP = (p, w, h) => { const m = (w - 1) / 2; for (let y = 0; y < h; y++) { const half = (w / 2) * (1 - (y / h) ** 1.4); for (let x = 0; x < w; x++) { const d = Math.abs(x - m); if (d > half) continue; p.px(x, y, d > half - 1 ? C.hair.lo : (x + (y >> 1)) % 3 === 0 ? C.hair.hi : C.hair.base); } } };
const stalkP = bands(C.stalk, { every: 2, lit: true });
// drumstick antennae: pale wood with a lit edge and grain ticks, a round white bead tip
const stickP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' || face === 'down' ? C.stick : x === 0 ? '#fff0d0' : y % 6 === 0 ? C.stickLo : C.stick); };
// the face: the orange wash, a deep-blue brow band across the top
const faceP = (p, w, h, face, cube) => {
  if (face !== 'south') { blueA(p, w, h, face, cube); return; }
  const y0 = Math.round(h * 0.3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y < y0 ? (y === 0 ? C.blueHi : C.blue) : y === y0 ? C.blueDeep : ramp([C.orangeHi, C.orange, C.orangeLo], (y - y0) / (h - y0), x, y));
};
const jawP = layer(armour(C.orange, { top: C.orangeHi, bottom: C.orangeLo }), (p, w, h, face) => { if (face === 'up') for (let x = 1; x < w - 1; x += 2) p.px(x, h - 1, '#fff0c8'); });
const mouthIn = (p, w, h) => { p.rect(0, 0, w, h, '#2a0c1e'); p.rect(1, 0, w - 2, Math.max(1, h - 1), '#4a1430'); };
const tailPs = [rimP(4, { keel: true }), rimP(5, { keel: true })];
const fanOuter = blade(C.fan, { eye: true, spines: true, flip: true });
const fanInner = blade({ ...C.fan, root: '#3a3ad0', base: '#5a3ad8', edge: '#ff3e9a', rim: '#ffe23a' }, { spines: true, flip: true });
const telsonP = (p, w, h, face) => { armour('#2a44b8', { top: '#6a8aff', bottom: '#141e5a', keel: true })(p, w, h, face); if (face === 'up') for (let x = 0; x < w; x += 2) p.px(x, 0, C.fan.spine); };
// the foo fighters: little glowing saucers (and a dim version for when it's knocked out or asleep)
const ufoP = (lit) => (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, lit ? (face === 'up' ? C.ufoHi : y === 0 ? C.ufoHi : (x % 3 === 1 && face !== 'down' ? C.ufoRim : C.ufo)) : (face === 'up' ? C.dimHi : C.dim)); };
const domeP = (lit) => (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, lit ? (x === 1 && y < 2 ? '#ffffff' : '#fff8d8') : C.dimHi); };

// ---------------------------------------------------------------- eyes and mouth
// Everpunch's own eye: sharp, flat-topped and slanting down to the nose (a brawler's glare), a glowing
// amber iris with a slit pupil, split by the cyan midband that runs on round the eye's shell
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-3.6, 47.4, 7.087], parentR: 'stalkR', parentL: 'stalkL', glow: 'all', line: '#120a1c', iris: '#ffb02a', irisDark: '#c04a10', pupilColor: '#1a0806', accent: '#3ae8ff', extra: ['smug', 'glint'], map: { open: [
  '.llllllllll.',
  'lllIIIIIIIll',
  'lIIIIIkIIIIl',
  'lIhhIIkIIIIl',
  'lIhhiikiiIIl',
  'cccccccccccc',
  'cccccccccccc',
  '.liiiikiiiil',
  '..liiikiihil',
  '...liiiiiiil',
  '....lllllll.',
] } });
const MOUTH = mouthRig({ chunk: 1, at: [0, 33.3, 9.02], size: [5.4, 2.2], line: '#120a1c', inner: '#4a1430', tongue: '#ff6c8e', def: 'grit', states: ['grit', 'grin', 'o', 'frown', 'flat', 'smile', 'wavy'] });
const EYEP = { band: C.band, lid: C.blue };

// ---------------------------------------------------------------- drip (accessories)
const ACC = { glove: '#ff5a2a', gloveHi: '#ffa060', gloveLo: '#b02a14', tee: '#1a1822', teeHi: '#322e3e', print: '#ff8a26', print2: '#3ae8ff', chain: '#ffd24a', chainLo: '#c8901a', gtr: '#2a2a3a', gtrHi: '#4a4a62', guard: '#ff8a26', neck: '#6a3a1e', mic: '#dfe4ee' };
const gloveP = (p, w, h, face) => { shade(ACC.glove, { top: ACC.gloveHi, bottom: ACC.gloveLo, grain: 0 })(p, w, h, face); if (face !== 'up' && face !== 'down') { p.px(1, 1, '#ffe0c8'); p.px(2, 1, '#ffe0c8'); p.px(1, 2, '#ffe0c8'); } };
const cuffP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' || face === 'down' ? '#d8d8e4' : x % 4 === 1 && y > 0 && y < h - 1 ? C.blue : '#ffffff'); };
const chainP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 3 === 0 ? ACC.chainLo : (x + y) % 3 === 1 ? '#fff0a0' : ACC.chain); };
const orbP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, x === 0 || y === 0 ? C.ufoHi : C.ufo); };
const teeP = (p, w, h, face) => {
  shade(ACC.tee, { top: ACC.teeHi, bottom: '#0c0a12', grain: 0 })(p, w, h, face);
  if (face !== 'south' || w < 20) return;
  const cx = Math.floor(w / 2), cy = Math.floor(h * 0.45);     // an orange saucer beaming a cyan ray
  for (let x = cx - 9; x <= cx + 9; x++) { p.px(x, cy, ACC.print); p.px(x, cy + 1, x % 3 ? ACC.print : '#ffffff'); }
  for (let x = cx - 4; x <= cx + 4; x++) { p.px(x, cy - 1, ACC.print); p.px(x, cy - 2, x > cx - 3 && x < cx + 3 ? '#ffd8a0' : ACC.print); }
  for (let y = cy + 2; y < h - 2; y++) for (let x = cx - 2 - ((y - cy) >> 1); x <= cx + 2 + ((y - cy) >> 1); x++) if ((x + y) % 2) p.px(x, y, ACC.print2);
};
const gtrP = (p, w, h, face) => { shade(ACC.gtr, { top: ACC.gtrHi, bottom: '#0e0c14', grain: 0 })(p, w, h, face); if (face === 'north') { const cx = Math.floor(w / 2); for (let y = 2; y < h - 2; y++) for (let x = cx - 2; x <= cx + 2; x++) p.px(x, y, y % 5 === 2 ? '#c0c4d0' : ACC.guard); } };
const neckP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'north' && y % 3 === 0 ? '#d8dce8' : x === 0 ? '#8a5a2e' : ACC.neck); };
const darkP = shade('#1c1a24', { top: '#3a3448', bottom: '#0e0c14', grain: 0 });
const strapP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (x + y) % 4 === 0 ? C.orange : '#2a2440'); };
const micP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? '#ffffff' : (x + y) % 2 ? ACC.mic : (y % 2 ? '#a8b0c4' : '#ffffff')); };
const A = (id, x = {}) => ({ id, hide: true, ...x });
const GLOVE = [
  B(-18.2, 36.0, 3.2, -7.0, 47.8, 12.8, gloveP, A('acc-gloves')),
  B(-8.0, 38.0, 8.6, -6.4, 42.6, 12.0, gloveP, A('acc-gloves')),
  B(-17.4, 34.4, 3.8, -7.8, 36.4, 12.2, cuffP, A('acc-gloves')),
];
const NECKCHAIN = [
  ...[-1, 1].map((g) => B(-0.3, 24.0, 6.4, 0.3, 33.0, 7.0, chainP, A('acc-chain', { pivot: [0, 24.4, 6.7], rot: [0, 0, -g * 30] }))),
  B(-2.6, 21.4, 6.2, 2.6, 22.4, 8.0, chainP, A('acc-chain')),
  B(-1.3, 22.4, 6.6, 1.3, 23.6, 7.6, orbP, A('acc-chain', { glow: true })),
  B(-0.7, 20.6, 6.8, 0.7, 21.4, 7.4, orbP, A('acc-chain', { glow: true })),
];
const TEE = [
  B(-10.6, 19.4, 5.2, 10.6, 34.0, 6.9, teeP, A('acc-tee')),
  B(-10.6, 19.4, -7.8, 10.6, 34.4, -6.6, teeP, A('acc-tee')),
  B(-11.4, 19.4, -6.6, -10.4, 34.4, 5.2, teeP, A('acc-tee')),
  B(10.4, 19.4, -6.6, 11.4, 34.4, 5.2, teeP, A('acc-tee')),
];
const JEANS = {
  waist: [B(-7.9, 13.4, -5.5, 7.9, 17.6, 4.5, denim(), A('acc-jeans'))],
  thigh: [B(-9.4, 8.6, -3.8, -3.8, 17.0, 1.8, denim({ rip: true }), A('acc-jeans'))],
  shin: [B(-9.0, 2.2, -3.4, -4.2, 8.4, 1.4, denim({ cuff: true }), A('acc-jeans'))],
};
const GUITAR = [
  ...[[-7.0, 18.0, 1.0, 25.0], [-5.4, 24.6, -0.6, 29.0]].map(([x0, y0, x1, y1]) => B(x0, y0, -10.4, x1, y1, -8.6, gtrP, A('acc-guitar', { pivot: [-3.0, 23.0, -9.5], rot: [0, 0, 30] }))),
  B(-3.6, 29.0, -10.0, -2.2, 41.0, -9.0, neckP, A('acc-guitar', { pivot: [-3.0, 23.0, -9.5], rot: [0, 0, 30] })),
  B(-4.0, 41.0, -10.2, -1.8, 43.6, -8.8, darkP, A('acc-guitar', { pivot: [-3.0, 23.0, -9.5], rot: [0, 0, 30] })),
  B(-0.5, 18.0, 6.5, 0.5, 34.0, 7.1, strapP, A('acc-guitar', { pivot: [0, 26.0, 6.8], rot: [0, 0, -42] })),
];
const HEADSET = [
  B(-7.0, 41.6, 1.6, 7.0, 42.6, 2.6, darkP, A('acc-mic')),
  B(-7.2, 36.4, 1.4, -6.2, 42.6, 2.8, darkP, A('acc-mic')),
  B(-7.0, 35.2, 2.6, -6.4, 35.8, 8.6, darkP, A('acc-mic')),
  B(-7.2, 34.6, 8.4, -5.6, 36.4, 10.2, micP, A('acc-mic')),
];

// ---------------------------------------------------------------- the model
const locks = (axis, at, th, top, spec, seed, side) => hairLocks(C.hair, axis, at, th, top, spec, seed, side);
const spike = (x, y, z, ax, len = 3.4, w = 1.8) => {      // a big two-step spike pointing along ax
  const L0 = len * 0.55, L1 = len - L0, wt = w * 0.55, h = w / 2, ht = wt / 2;
  if (ax === 'y') return [B(x - h, y, z - h, x + h, y + L0, z + h, spikeP), B(x - ht, y + L0, z - ht, x + ht, y + len, z + ht, tipP)];
  return [B(x - L0, y - h, z - h, x, y + h, z + h, spikeP), B(x - len, y - ht, z - ht, x - L0, y + ht, z + ht, tipP)];   // '-x'
};
const RIGHT = {
  thigh: { name: 'thighR', parent: 'root', pivot: [-6.6, 16.0, -1.0], cubes: [B(-9.1, 8.8, -3.5, -4.1, 16.8, 1.5, legP), B(-8.7, 10.6, 1.5, -4.5, 15.4, 2.1, orangeP), ...JEANS.thigh] },
  shin: { name: 'shinR', parent: 'thighR', pivot: [-6.6, 9.4, -1.0], cubes: [B(-9.5, 7.8, -3.9, -3.7, 11.0, 1.9, kneeP), B(-8.7, 2.4, -3.1, -4.5, 9.4, 1.1, legP), ...JEANS.shin] },
  foot: { name: 'footR', parent: 'shinR', pivot: [-6.6, 2.6, -1.0], cubes: [
    B(-9.2, 0, -4.2, -4.0, 2.9, 2.6, footP),
    B(-9.0, 0, 2.6, -6.9, 1.8, 5.8, toeP), B(-6.7, 0, 2.6, -4.4, 1.8, 6.2, toeP),
    B(-7.3, 0, -5.4, -5.9, 1.4, -4.2, toeP),
  ] },
  coxa: { name: 'coxaR', parent: 'body', pivot: [-12.5, 31.0, 0], cubes: [B(-14.6, 28.2, -4.6, -10.4, 35.6, 4.0, rimP(2)), ...spike(-12.5, 35.6, -0.3, 'y', 3.6, 2.0)] },
  arm: { name: 'armR', parent: 'body', pivot: [-12.6, 30.6, 0.0], rot: [60, -8, 0], cubes: [B(-15.8, 27.4, -2.6, -9.4, 33.8, 9.0, armP)] },
  fore: { name: 'foreR', parent: 'armR', pivot: [-12.6, 30.6, 8.0], rot: [10, 0, 4], cubes: [B(-15.2, 28.6, 5.4, -10.0, 37.4, 10.6, foreP)] },
  club: { name: 'clubR', parent: 'foreR', pivot: [-12.6, 37.0, 8.0], cubes: [
    B(-16.8, 36.6, 3.8, -8.4, 45.0, 12.2, clubP),
    B(-16.2, 36.0, 4.4, -9.0, 45.6, 11.6, clubP),
    B(-17.4, 37.2, 4.4, -7.8, 44.4, 11.6, clubP),
    ...spike(-15.0, 45.0, 8.0, 'y'), ...spike(-12.6, 45.2, 8.0, 'y', 3.8), ...spike(-10.2, 45.0, 8.0, 'y'),
    ...spike(-17.4, 40.8, 8.0, '-x', 3.2),
    ...GLOVE,
  ] },
  stalk: { name: 'stalkR', parent: 'head', pivot: [-3.6, 41.0, 5.2], rot: [0, 0, 10], cubes: [
    B(-4.25, 40.4, 4.55, -2.95, 45.6, 5.85, stalkP),
    B(-5.6, 45.733, 3.4, -1.6, 49.067, 7.067, eyeHousingP(EYEP, 46.9, 47.9)),
    B(-5.267, 45.4, 3.733, -1.933, 49.4, 7.067, eyeHousingP(EYEP, 46.9, 47.9)),
  ] },
  ant: { name: 'antR', parent: 'head', pivot: [-4.8, 40.6, 7.4], rot: [-14, 0, 30], cubes: [B(-5.25, 40.6, 6.95, -4.35, 52.6, 7.85, stickP), B(-5.6, 52.2, 6.6, -4.0, 54.0, 8.2, tipP)] },
  hair: { name: 'hairR', parent: 'head', pivot: [-6.6, 41.4, 2.6], cubes: locks('z', -7.2, 0.7, 41.8, [[-1.6, 0.6, 35.8, 10, 6, 0], [0.5, 2.7, 35.2, 6, 0, 0.12], [2.6, 4.8, 36.2, 10, -4, 0], [4.7, 6.6, 37.6, 14, -8, 0.1]], 3, -1) },
  max: { name: 'maxR', parent: 'head', pivot: [-3.2, 35.6, 9.0], cubes: [B(-4.0, 34.8, 8.4, -0.4, 36.0, 9.8, beardP), B(-5.0, 31.4, 8.5, -3.6, 35.8, 9.8, beardP)] },
};
const UFO_REST = [[0, 40, 21], [0, 50, -18.5], [21, 34, 0]];
const ufoCubes = (i) => { const [x, y, z] = UFO_REST[i]; return [true, false].flatMap((lit) => {
  const id = lit ? 'ufo-lit' : 'ufo-dim', g = { glow: lit, id, hide: !lit, shadow: false };
  return [B(x - 2.3, y - 0.4, z - 2.3, x + 2.3, y + 0.4, z + 2.3, ufoP(lit), g), B(x - 1.0, y + 0.4, z - 1.0, x + 1.0, y + 1.5, z + 1.0, domeP(lit), g), B(x - 0.7, y - 0.95, z - 0.7, x + 0.7, y - 0.4, z + 0.7, domeP(lit), g)];
}); };
export const def = {
  name: 'everpunch', ppu: 3, scale: 0.48, outline: { color: C.ink, px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    ...both(RIGHT.thigh, RIGHT.shin, RIGHT.foot),
    { name: 'body', parent: 'root', pivot: [0, 16.5, -1.0], cubes: [
      B(-7.6, 13.8, -5.2, 7.6, 20.2, 4.2, blueA),
      B(-6.6, 14.2, 4.0, 6.6, 17.2, 5.2, chestPs[5]),
      B(-7.0, 16.9, 4.0, 7.0, 20.0, 5.5, chestPs[4]),
      B(-10.2, 19.6, -6.6, 10.2, 34.0, 5.2, blueA),
      B(-10.9, 21.0, -6.0, 10.9, 32.0, 4.6, blueA),
      B(-12.6, 28.4, -6.2, 12.6, 34.8, 4.6, rimP(0)),
      // the orange wash: the chest stack, amber → red → magenta → violet
      B(-9.0, 30.4, 4.6, 9.0, 33.6, 6.4, chestPs[0]),
      B(-8.8, 27.2, 4.8, 8.8, 30.6, 6.5, chestPs[1]),
      B(-8.4, 24.0, 4.8, 8.4, 27.4, 6.4, chestPs[2]),
      B(-7.8, 20.8, 4.8, 7.8, 24.2, 6.2, chestPs[3]),
      // the rainbow carapace down the back
      B(-9.6, 29.0, -7.4, 9.6, 34.2, -6.2, rimP(0, { keel: true })),
      B(-9.2, 24.2, -7.3, 9.2, 29.2, -6.2, rimP(1, { keel: true })),
      B(-8.6, 19.6, -7.1, 8.6, 24.4, -6.2, rimP(2, { keel: true })),
      ...NECKCHAIN, ...TEE, ...GUITAR, ...JEANS.waist,
    ] },
    { name: 'head', parent: 'body', pivot: [0, 33.2, 2.6], cubes: [
      B(-6.2, 32.8, -1.8, 6.2, 40.4, 8.6, blueA, { faces: { south: faceP } }),
      B(-6.6, 40.0, -2.4, 6.6, 42.0, 8.0, hairCapP),
      ...HEADSET,
    ] },
    { name: 'hairB1', parent: 'head', pivot: [0, 41.6, -2.2], rot: [42, 0, 0], cubes: locks('x', -2.9, 0.7, 41.8, [[-6.4, -3.9, 33.6, -8, 4, 0], [-4.0, -1.3, 33.0, -3, 6, -0.12], [-1.4, 1.4, 33.4, 0, 5, 0], [1.3, 4.0, 32.8, 3, 6, -0.12], [3.9, 6.4, 33.8, 8, 4, 0]], 21) },
    { name: 'hairB2', parent: 'hairB1', pivot: [0, 33.4, -2.5], rot: [-36, 0, 0], cubes: locks('x', -2.9, 0.7, 33.6, [[-6.0, -3.6, 23.6, -10, 6, 0], [-3.7, -1.1, 22.4, -4, 9, -0.12], [-1.2, 1.2, 23.0, 0, 7, 0], [1.1, 3.7, 22.0, 4, 9, -0.12], [3.6, 6.0, 23.8, 10, 6, 0]], 31) },
    { name: 'jaw', parent: 'head', pivot: [0, 34.8, 7.0], cubes: [
      B(-3.8, 32.0, 5.4, 3.8, 34.8, 9.0, jawP),
      B(-3.5, 34.6, 5.6, 3.5, 35.0, 8.8, mouthIn, { outline: false }),
      ...MOUTH.cubes,
    ] },
    { name: 'beard', parent: 'jaw', pivot: [0, 32.0, 8.0], cubes: [
      B(-2.8, 27.6, 7.0, 2.8, 32.2, 9.4, beardP),
      B(-2.0, 24.8, 7.4, 2.0, 27.8, 9.0, beardP),
      B(-1.8, 21.8, 8.2, 1.8, 25.0, 8.2, beardTipP, { plane: 'z' }),
    ] },
    ...both(RIGHT.stalk, RIGHT.ant, RIGHT.hair, RIGHT.max),
    ...EYES.bones,
    ...both(RIGHT.coxa, RIGHT.arm, RIGHT.fore, RIGHT.club),
    { name: 'tail1', parent: 'body', pivot: [0, 17.6, -5.4], rot: [-40, 0, 0], cubes: [B(-6.0, 14.4, -12.4, 6.0, 20.8, -5.0, tailPs[0])] },
    { name: 'tail2', parent: 'tail1', pivot: [0, 17.6, -12.0], rot: [-14, 0, 0], cubes: [B(-5.0, 14.9, -18.6, 5.0, 20.3, -11.6, tailPs[1])] },
    { name: 'fan', parent: 'tail2', pivot: [0, 17.6, -18.2], rot: [100, 0, 0], cubes: [
      B(-2.0, 17.1, -27.0, 2.0, 18.1, -17.6, telsonP),
      ...[[-52, fanOuter, 17.5], [-26, fanInner, 17.7], [26, fanInner, 17.7], [52, fanOuter, 17.5]].map(([a, P, y]) => B(-2.2, y, -27.2, 2.2, y, -18.2, P, { plane: 'y', mirror: a > 0, pivot: [0, y, -18.2], rot: [0, a, 0] })),
    ] },
    ...[0, 1, 2].map((i) => ({ name: 'ufo' + (i + 1), parent: 'root', pivot: UFO_REST[i], cubes: ufoCubes(i) })),
  ],
  // appearance tiers: normal wears one of the first pair, dripped adds one of the second, ultra dripped the third
  drip: [
    [{ id: 'acc-gloves', name: 'Title-fight gloves' }, { id: 'acc-chain', name: 'Gold foo-orb chain' }],
    [{ id: 'acc-tee', name: 'Saucer band tank' }, { id: 'acc-jeans', name: 'Ripped jeans' }],
    [{ id: 'acc-guitar', name: 'Black guitar on its back' }, { id: 'acc-mic', name: "Drummer's headset mic" }],
  ],
  // where bought gear sits (model units, rest pose)
  attach: {
    head: { bone: 'head', at: [0, 42.0, 2.8], size: 13.2 },
    face: { bone: 'head', at: [0, 47.4, 7.1], size: 11.0 },
    neck: { bone: 'body', at: [0, 33.6, 6.4], size: 12.0 },
    back: { bone: 'body', at: [0, 26.0, -7.4], size: 18.0 },
  },
};

// ---------------------------------------------------------------- animation
const stance = legRig({ body: [0, 16.5, -1.0], hip: [-6.6, 16.0, -1.0], ankle: [-6.6, 2.6, -1.0], L1: 6.6, L2: 6.8 });
const CLUB = { R: [-12.6, 47.0, 8.0], L: [12.6, 47.0, 8.0] };      // the striking face (spiked top of the club)
const MOUTHP = [0, 33.5, 9.6];
const ex = (P, e, m) => { if (e) P.face('eyes', e); if (m) P.face('mouth', m); return P; };
// arm poses, as offsets from the low forward guard (merus 60° down, forearm tipped 70° forward)
function punch(P, S, k, yaw = 10, up = 0) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, (-60 - up) * k, g * yaw * k, 0).rot('fore' + S, (80 + up) * k, 0, 0); }
function cock(P, S, k) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, 10 * k, -g * 25 * k, -g * 8 * k).rot('fore' + S, -42 * k, 0, 0); }
function flex(P, S, k) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, -60 * k, -g * 82 * k, 0).rot('fore' + S, -10 * k, 0, -g * 4 * k); }
// clubs held up like a pair of toms, striking faces up
function toms(P, S, k) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, -26 * k, -g * 14 * k, 0).rot('fore' + S, -46 * k, 0, 0); }
function eyes(P, rY, rP, lY, lP, tilt = 0) { P.rot('stalkR', rP, rY, tilt).rot('stalkL', lP, lY, -tilt); }
// the foo fighters: three orbits, each tilted and at its own speed; o.k pulls them in (0..1), o.low drops
// them toward the ground (dazed / asleep), o.dive = [[i, k, target]] sends ufo i toward a target
const ORB = [{ r: 21, y: 41, tilt: 12, w: 62, ph: 0 }, { r: 18.5, y: 51, tilt: -10, w: -84, ph: 2.1 }, { r: 23, y: 35, tilt: 18, w: 44, ph: 4.2 }];
function ufos(P, time, o = {}) {
  ORB.forEach((u, i) => {
    const a = u.ph + time * u.w * (o.speed || 1) * D2R, r = u.r * (o.r || 1);
    let x = Math.cos(a) * r, z = Math.sin(a) * r, y = u.y + z * Math.sin(u.tilt * D2R) + Math.sin(time * 2.3 + i * 2) * 0.9;
    z *= Math.cos(u.tilt * D2R);
    if (o.low) { y = y + (4 + i * 2.5 + Math.sin(time * 3 + i) * 0.6 - y) * o.low; x *= 1 - 0.55 * o.low; z *= 1 - 0.55 * o.low; }
    const d = o.dive && o.dive[i];
    if (d) { const [k, T] = d; x += (T[0] - x) * k; y += (T[1] - y) * k; z += (T[2] - z) * k; }
    const R = UFO_REST[i]; P.pos('ufo' + (i + 1), x - R[0], y - R[1], z - R[2]).rot('ufo' + (i + 1), 0, (time * 240 + i * 60) % 360, 0);
  });
}

export const anim = {
  start: 'idle', seed: 29,
  breathe: { bone: 'body', amp: 0.012, per: 2.8 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.8, 5.6], dur: 0.13 },
  look: { bone: 'head', yaw: 22, pitch: 10, speed: 4 },
  springs: [
    { bone: 'hairB1', tip: [0, -8, 0], k: 90, d: 7, gain: 1.0, max: 26, axes: [1, 0.3, 1] },
    { bone: 'hairB2', tip: [0, -10, 0], k: 70, d: 6, gain: 1.2, max: 34, axes: [1, 0.3, 1] },
    { bone: 'hairR', tip: [0, -6, 0], k: 120, d: 8, gain: 1.0, max: 28, axes: [1, 0.3, 1] },
    { bone: 'hairL', tip: [0, -6, 0], k: 125, d: 8, gain: 1.0, max: 28, axes: [1, 0.3, 1] },
    { bone: 'beard', tip: [0, -7, 0.4], k: 150, d: 8, gain: 0.8, max: 22 },
    { bone: 'antR', tip: [0, 12, 0], k: 260, d: 9, gain: 0.5, max: 14 },
    { bone: 'antL', tip: [0, 12, 0], k: 265, d: 9, gain: 0.5, max: 14 },
    { bone: 'stalkR', tip: [0, 6, 0], k: 240, d: 10, gain: 0.5, max: 12 },
    { bone: 'stalkL', tip: [0, 6, 0], k: 240, d: 10, gain: 0.5, max: 12 },
    { bone: 'fan', tip: [0, 0, -9], k: 130, d: 8, gain: 0.9, max: 20 },
  ],
  faces: {
    eyes: EYES.slot,
    mouth: MOUTH.slot,
    ufo: { default: 'lit', states: { lit: ['ufo-lit'], dim: ['ufo-dim'] } },
  },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'stagedive', 'drumsolo', 'hairwhip'] },
  clips: {
    // a heavy brawler's bounce: shoulders rolling, clubs swaying low and ready, drumstick antennae ticking
    // out a beat, eyes swivelling on their stalks; the foo fighters circle
    idle: { len: 2.4, loop: true, f(P, t, c) {
      const b = bounce(t, 1.2, { squash: 0.05, stretch: 0.02 }), sway = wave(t, 1 / 2.4), dy = -1.2 + b.u * 1.0;
      stance(P, { dy, dx: 0.6 * sway, rz: -2.2 * sway, rx: 6, ry: 8 * wave(t, 1 / 2.4, 1.3), f: { R: [-0.3, 0, -1.2], L: [0.3, 0, 1.4] } });
      P.sq('body', b.sq);
      for (const [S, ph] of [['R', 0], ['L', Math.PI]]) { const g = S === 'R' ? 1 : -1, roll = wave(t, 1 / 1.2, ph); P.rot('arm' + S, 4 * roll - 3 * b.u, g * 4 * roll, 0).rot('fore' + S, -3 * roll, 0, 0); P.rot('coxa' + S, 0, 0, g * 3 * roll); }
      P.rot('head', 3 - 3 * b.u, -6 * sway, 0);
      const tick = (t * 4) % 1;                                   // the sticks keep time: four ticks a beat
      P.rot('antR', 10 * bump(tick, 0, 0.3), 0, 0).rot('antL', 10 * bump((tick + 0.5) % 1, 0, 0.3), 0, 0);
      eyes(P, saccade(t, [[0, 0], [0.5, 18], [1.1, -6], [1.7, 12]]), saccade(t, [[0, 0], [0.8, -8], [1.5, 4]]), saccade(t, [[0, 0], [0.3, -14], [0.9, 8], [1.9, -18]]), saccade(t, [[0, 2], [0.6, -6], [1.3, 6]]));
      ex(P, t > 1.5 && t < 1.85 ? 'smug' : undefined, t > 1.5 && t < 1.9 ? 'grin' : 'grit');
      P.rot('fan', 4 * b.u, 0, 0).rot('tail1', 0, -4 * sway, 0);
      ufos(P, c.time);
    } },
    // heavy stomping strides, clubs swinging, dust at every footfall
    walk: { len: 1.0, loop: true, f(P, t, c) {
      const u = t / 1.0, s = Math.sin(u * Math.PI * 2), bob = Math.abs(Math.cos(u * Math.PI * 2));
      const fR = step(u, 2.6, 2.4), fL = step(u + 0.5, 2.6, 2.4);
      stance(P, { dy: -1.4 + 1.0 * bob, rx: 8, rz: -3.5 * s, ry: 7 * s, dx: 0.8 * s, f: { R: [0, fR[0], fR[1]], L: [0, fL[0], fL[1]] }, toe: { R: -14 * Math.max(0, fR[0] / 2.4), L: -14 * Math.max(0, fL[0] / 2.4) } });
      P.sq('body', -0.04 * (1 - bob));
      P.rot('armR', -8 * s, 0, 0).rot('armL', 8 * s, 0, 0);
      P.rot('head', 3 - 3 * bob, -5 * s, 0);
      eyes(P, 6 * s, -3, -6 * s, -3);
      P.rot('tail1', 0, 8 * s, 0).rot('fan', 6 * bob, 0, 0);
      ex(P, undefined, 'grit');
      ufos(P, c.time);
      P.burst(0.02, 'dust', 'root', [-6.6, 0.4, 1], { n: 3, speed: 0.6, scale: 0.8 }).burst(0.52, 'dust', 'root', [6.6, 0.4, 1], { n: 3, speed: 0.6, scale: 0.8 });
    } },
    // entrance: sinks low, rears up into a double flex and roars, the foo fighters flaring out wide; then it
    // smashes its clubs together over its head — sparks and a shock ring
    cry: { len: 2.2, next: 'idle', f(P, t, c) {
      const crouch = seg(t, 0, 0.35, E.inout) * (1 - seg(t, 0.35, 0.48, E.out)), up = seg(t, 0.4, 0.62, E.back) * (1 - seg(t, 1.3, 1.5, E.inout));
      const clash = seg(t, 1.42, 1.56, E.in3) * (1 - seg(t, 1.7, 2.1, E.inout)), tr = wave(t, 12) * up;
      stance(P, { dy: -3.4 * crouch + 1.0 * up - 0.8 * clash, rx: 16 * crouch - 12 * up, rz: tr });
      P.sq('body', -0.08 * crouch + 0.05 * up * (1 - seg(t, 0.62, 0.8)) + wob(t, 1.56, -0.05, 4, 6));
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, 18 * crouch, 0, 0); flex(P, S, up + clash); P.rot('arm' + S, -40 * clash, g * 40 * clash, 0).rot('club' + S, 0, 0, -g * 20 * clash); P.rot('stalk' + S, -8 * up, 0, g * 18 * up + tr); }
      P.rot('head', 14 * crouch - 26 * up + tr * 2, 0, 0).rot('jaw', 6 * crouch + 36 * up + 16 * clash);
      P.rot('fan', 26 * up, 0, 0).rot('antR', -30 * up, 0, 10 * up).rot('antL', -30 * up, 0, -10 * up);
      ex(P, crouch > 0.3 ? 'angry' : up > 0.3 ? 'wide' : clash > 0.3 ? 'angry' : t > 1.9 ? 'smug' : undefined, crouch > 0.3 ? 'grit' : up > 0.3 ? 'o' : clash > 0.2 ? 'grin' : t > 1.9 ? 'grin' : undefined); P.blinkOK = false;
      eyesScale(P, 1 - 0.1 * crouch, 1 - 0.2 * crouch + 0.2 * up * (1 - seg(t, 0.62, 0.9)));
      ufos(P, c.time, { speed: 1 + 2 * up, r: 1 + 0.3 * up });
      if (t > 0.6 && t < 1.3) P.stream(FX.bub, 'jaw', MOUTHP, { rate: 40, dir: [0, 0.6, 1], speed: 1.2, spread: 0.6 });
      P.burst(0.62, FX.ring, 'jaw', MOUTHP, { scale: 1.2 }).burst(0.66, 'anger', 'head', [-9, 46, 6], {}).burst(0.78, 'anger', 'head', [9, 45, 6], {});
      P.burst(1.56, FX.flash, 'body', [0, 58, 6], {}).burst(1.56, FX.shock, 'body', [0, 58, 6], { scale: 0.5 }).burst(1.56, 'spark', 'body', [0, 58, 6], { n: 4 });
    } },
    // attack (physical): cocks the right club back by its shoulder… and the punch lands before you see it —
    // the white flash of the cavitation bubble, a ring, a spray of bubbles and sparks
    attack: { len: 1.0, next: 'idle', f(P, t, c) {
      const wind = seg(t, 0, 0.26, E.out) * (1 - seg(t, 0.26, 0.3, E.in)), hit = seg(t, 0.26, 0.3, E.out3) * (1 - seg(t, 0.5, 0.92, E.inout));
      const shake = t > 0.3 && t < 0.46 ? wave(t, 20) * (0.46 - t) * 8 : 0;
      stance(P, { dy: -1.8 * wind - 1.0 * hit, dz: -1.4 * wind + 3.2 * hit, rx: 6 * wind + 12 * hit, ry: 24 * wind - 26 * hit, f: { R: [0, 0, 1.0 * hit], L: [0, 0, -0.6 * hit] } });
      P.sq('body', -0.05 * wind + wob(t, 0.3, 0.05, 5, 8));
      cock(P, 'R', wind); punch(P, 'R', hit, 14, 4); P.rot('armR', shake, 0, 0);
      cock(P, 'L', 0.3 * hit);
      P.rot('head', 8 * wind - 6 * hit, -10 * wind + 14 * hit, 0).rot('jaw', 24 * hit);
      eyes(P, 6 * hit, 4 * wind, -6 * hit, 4 * wind);
      ex(P, wind > 0.1 ? 'angry' : t > 0.28 && t < 0.4 ? 'shut' : hit > 0.1 ? 'angry' : t > 0.7 ? 'smug' : undefined, wind > 0.1 ? 'grit' : hit > 0.1 ? 'o' : t > 0.7 ? 'grin' : undefined); P.blinkOK = false;
      eyesScale(P, 1 + 0.15 * bump(t, 0.28, 0.42), 1 - 0.25 * bump(t, 0.28, 0.42));
      P.rot('fan', 20 * hit, 0, 0);
      ufos(P, c.time);
      const pad = CLUB.R;
      P.burst(0.3, FX.flash, 'clubR', pad, { scale: 1.3 }).burst(0.3, FX.ring, 'clubR', pad, { scale: 1.4 }).burst(0.31, FX.ring, 'clubR', pad, { scale: 0.8 });
      P.burst(0.3, FX.bub, 'clubR', pad, { n: 24, speed: 1.6, scale: 1.4 }).burst(0.3, 'spark', 'clubR', pad, { n: 4, scale: 1.3 }).burst(0.34, 'bubble', 'clubR', pad, { n: 6, speed: 0.9 });
    } },
    // special (Echo): a drum fill of eight punches, faster and faster, then both clubs high… SLAM — a sonic
    // shockwave rolls out full of notes, and the three foo fighters dive-bomb the foe one after another
    special: { len: 3.2, next: 'idle', f(P, t, c) {
      const hits = [0.3, 0.48, 0.62, 0.74, 0.84, 0.92, 1.0, 1.08];
      let tw = 0;
      hits.forEach((h, i) => {
        const S = i % 2 ? 'L' : 'R', g = S === 'R' ? 1 : -1, k = seg(t, h - 0.06, h, E.out3) * (1 - seg(t, h + 0.02, h + 0.1, E.inout));
        punch(P, S, k, 12 - i, 6 + (i % 3) * 8); tw += g * 14 * k;
        P.burst(h, FX.bub, 'club' + S, CLUB[S], { n: 8, speed: 1.2 }).burst(h, 'spark', 'club' + S, CLUB[S], { n: 1 }).burst(h, 'note', 'club' + S, CLUB[S], { n: 1, speed: 1 });
      });
      const raise = seg(t, 1.16, 1.4, E.out) * (1 - seg(t, 1.4, 1.5, E.in3)), slam = seg(t, 1.42, 1.5, E.in3) * (1 - seg(t, 1.9, 2.3, E.inout));
      stance(P, { dy: -1.2 + 1.2 * raise - 3.4 * slam, dz: 1.2 * slam, rx: 6 - 10 * raise + 22 * slam, ry: tw * 0.6 });
      P.sq('body', 0.05 * raise + wob(t, 1.5, -0.08, 4, 6));
      for (const S of ['R', 'L']) { flex(P, S, raise); P.rot('arm' + S, -40 * raise + 40 * slam, 0, 0).rot('fore' + S, 30 * slam, 0, 0); }
      P.rot('head', 6 * slam - 10 * raise, -tw * 0.3, 0).rot('jaw', 30 * slam + 10 * raise);
      ex(P, t < 1.12 ? (Math.floor(t * 10) % 4 === 0 ? 'shut' : 'angry') : raise > 0.3 ? 'wide' : slam > 0.3 ? 'angry' : t > 2.6 ? 'smug' : undefined, t < 1.12 ? 'grit' : raise > 0.3 ? 'o' : slam > 0.2 ? 'o' : t > 2.6 ? 'grin' : undefined); P.blinkOK = false;
      eyesScale(P, 1 + 0.15 * slam, 1 - 0.2 * slam + 0.2 * raise);
      // the dives: each saucer leaves its orbit, streaks at the foe and bursts
      const T = [[-10, 2, 40], [0, 2, 46], [10, 2, 40]], dive = [0, 1, 2].map((i) => { const a = 1.62 + i * 0.16; return [seg(t, a, a + 0.32, E.in) * (1 - seg(t, 2.5, 3.1, E.inout)), T[i]]; });
      ufos(P, c.time, { dive });
      dive.forEach(([k], i) => { const a = 1.62 + i * 0.16; if (k > 0.05 && k < 0.98 && t < a + 0.34) P.stream(FX.orb, 'ufo' + (i + 1), UFO_REST[i], { rate: 70, spread: 0.3, key: 'u' + i }); P.burst(a + 0.32, FX.flash, 'root', T[i], { scale: 1.2 }).burst(a + 0.32, FX.ring, 'root', T[i], {}).burst(a + 0.32, 'spark', 'root', T[i], { n: 4 }); });
      P.burst(1.5, FX.shock, 'root', [0, 1, 14], { scale: 1.3 }).burst(1.54, FX.shock, 'root', [0, 1, 14], { scale: 0.8 }).burst(1.5, FX.flash, 'root', [0, 2, 16], { scale: 1.4 });
      P.burst(1.5, 'dust', 'root', [0, 1, 14], { n: 18, spread: 1, speed: 2.2 }).burst(1.5, 'rock', 'root', [0, 1, 14], { n: 10, dir: [0, 1, 0.4], speed: 1.2 }).burst(1.52, 'note', 'root', [0, 6, 16], { n: 10, speed: 2.4, spread: 1 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t, c) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.24, 0.7, E.inout));
      stance(P, { dz: -2.8 * k, dy: -1.4 * k, rx: -14 * k + wob(t, 0.18, 4, 3, 6), rz: wave(t, 14) * 3 * k, f: { R: [0, 1.6 * bump(t, 0.05, 0.28), -1 * k], L: [0, 0, -0.8 * k] } });
      P.sq('body', -0.1 * k);
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, -24 * k, g * 18 * k, 0).rot('fore' + S, 20 * k, 0, 0); P.rot('stalk' + S, -14 * k, 0, g * 20 * k); }
      P.rot('head', -16 * k, 0, 8 * k).rot('jaw', 24 * k).rot('fan', 24 * k, 0, 0);
      ex(P, t < 0.44 ? 'shut' : 'sad', t < 0.44 ? 'wavy' : 'frown'); P.blinkOK = false; eyesScale(P, 1 + 0.15 * k, 1 - 0.25 * k);
      ufos(P, c.time, { r: 1 + 0.25 * k });
      P.burst(0.02, 'spark', 'body', [0, 28, 9], { n: 3 }).burst(0.02, 'star', 'head', [0, 52, 4], { n: 3 }).burst(0.1, 'sweat', 'head', [-7, 44, 4], { n: 2, dir: [-1, 0.8, 0] }).burst(0.1, 'sweat', 'head', [7, 44, 4], { n: 2, dir: [1, 0.8, 0] });
    } },
    // reels, eyes spinning… and crashes over on its side; the foo fighters sink and circle its head, dimmed
    faint: { len: 2.4, next: 'down', f(P, t, c) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 1.0, 1.1)), fall = seg(t, 1.0, 1.5, E.bounce);
      stance(P, { dy: -1.6 * dizzy, rz: wave(t, 1.4) * 7 * dizzy, ry: wave(t, 1.0) * 12 * dizzy, rx: 6 * dizzy });
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, 26 * dizzy, 0, g * 8 * dizzy); P.rot('stalk' + S, 0, wave(t, 2, g) * 26 * dizzy, g * 16 * dizzy); }
      if (fall > 0) knockedOut(P, fall, t);
      ex(P, t < 1.0 ? 'swirl' : 'x', t < 1.0 ? 'wavy' : 'o'); P.blinkOK = false; P.lookW = 0;
      ufos(P, c.time, { low: seg(t, 0.9, 1.7), speed: 0.6 });
      P.face('ufo', t > 1.4 ? 'dim' : 'lit');
      P.burst(0.3, 'sweat', 'head', [-7, 44, 4], { n: 3, dir: [-1, 0.8, 0] }).burst(0.7, 'tear', 'head', [4, 44, 7], { n: 3, dir: [1, 0.4, 0.6] });
      P.burst(1.5, 'dust', 'root', [-14, 1, 0], { n: 16, spread: 1, speed: 1.6 }).burst(0.5, 'star', 'head', [0, 54, 2], { n: 5 });
    } },
    down: { len: 2.4, loop: true, f(P, t, c) {
      knockedOut(P, 1, t);
      ex(P, 'swirl', 'o'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.4;
      ufos(P, c.time, { low: 1, speed: 0.5 }); P.face('ufo', 'dim');
      P.burst(0.6, FX.bub, 'jaw', MOUTHP, { n: 2, dir: [0, 1, 0], speed: 0.4 });
    } },
    // victory: a headbang, then a big double flex — the foo fighters whirl fast and high in a ring of notes
    win: { len: 2.4, next: 'idle', f(P, t, c) {
      const bang = seg(t, 0.05, 0.9) * (1 - seg(t, 0.85, 1.0)), nod = Math.abs(wave(t, 3.2)) * bang;
      const pose = seg(t, 0.95, 1.2, E.back) * (1 - seg(t, 2.05, 2.35, E.inout)), hopY = hop(Math.max(0, t - 0.9), 0.6, 3, { crouch: 1.6 });
      stance(P, { dy: -1.0 - 1.2 * nod + (t > 0.9 && t < 1.5 ? Math.min(0, hopY.y) : 0), rx: 18 * nod - 8 * pose });
      P.pos('root', 0, t > 0.9 && t < 1.5 ? Math.max(0, hopY.y) : 0, 0);
      P.rot('head', 26 * nod - 16 * pose, 0, 0).rot('jaw', 14 * nod + 26 * pose);
      for (const S of ['R', 'L']) { flex(P, S, pose); P.rot('club' + S, -10 * pose + 6 * wave(t, 6) * pose, 0, 0); }
      P.rot('antR', 20 * nod, 0, 0).rot('antL', 20 * nod, 0, 0);
      ex(P, bang > 0.2 ? 'shut' : pose > 0.5 && t < 1.7 ? 'star' : pose > 0.3 ? 'happy' : t > 2.1 ? 'smug' : undefined, bang > 0.2 ? 'grit' : 'grin'); P.blinkOK = false;
      eyesScale(P, 1 - 0.1 * pose, 1 + 0.12 * pose);
      ufos(P, c.time, { speed: 1 + 3 * pose, r: 1 - 0.15 * pose });
      P.burst(1.15, 'note', 'head', [0, 52, 4], { n: 8, speed: 1.6, spread: 1 }).burst(1.15, 'sparkle', 'head', [0, 50, 4], { n: 12, speed: 1.6 }).burst(1.4, 'dust', 'root', [0, 0.5, 0], { n: 10, spread: 1, speed: 1.2 });
    } },
    // asleep: sat back on its tail, chin on its chest, the foo fighters dimmed and bobbing low like fireflies
    sleep: { len: 3.2, loop: true, f(P, t, c) {
      const br = Math.sin((t / 3.2) * Math.PI * 2);
      stance(P, { dy: -5.2 + br * 0.4, dz: -1.0, rx: 12 + br * 2, f: { R: [0.6, 0, 2.4], L: [-0.6, 0, 2.4] } });
      P.sq('body', -0.03 + br * 0.025);
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, 16, g * 10, 0).rot('fore' + S, -30, 0, 0); P.rot('stalk' + S, 22 + br * 3, 0, g * (24 + br * 3)); P.rot('ant' + S, 30, 0, g * 14); }
      P.rot('head', 22 + br * 3, 0, 4).rot('jaw', 6 + Math.max(0, br) * 6).rot('fan', -16, 0, 0).rot('tail1', 12, 0, 0);
      ex(P, 'closed', 'o'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      ufos(P, c.time, { low: 0.75, speed: 0.25 }); P.face('ufo', 'dim');
      P.burst(0.4, 'z', 'head', [5, 50, 6], {}).burst(1.6, 'z', 'head', [5, 50, 6], {});
    } },
    // fidget: holds its clubs up like toms and plays a fill on them with its own drumstick antennae — head
    // banging to swing the sticks — and finishes with a crash
    drumsolo: { len: 2.4, next: 'idle', f(P, t, c) {
      const up = seg(t, 0, 0.25, E.out) * (1 - seg(t, 1.9, 2.3, E.inout)), hits = [0.36, 0.52, 0.66, 0.78, 0.9, 1.0, 1.1, 1.2, 1.3];
      stance(P, { dy: -1.4, rx: 10 * up });
      for (const S of ['R', 'L']) toms(P, S, up);
      let bang = 0;
      hits.forEach((h, i) => {
        const S = i % 2 ? 'L' : 'R', k = bump(t, h - 0.08, h + 0.04);
        P.rot('ant' + S, 46 * k, 0, (S === 'R' ? -1 : 1) * 10 * k); bang += k;
        P.burst(h, 'note', 'club' + S, CLUB[S], { n: 1, speed: 1 }).burst(h, 'spark', 'club' + S, CLUB[S], { n: 1, scale: 0.5 });
      });
      const crash = seg(t, 1.42, 1.5, E.out3) * (1 - seg(t, 1.8, 2.2, E.inout));
      P.rot('head', 12 * Math.min(1, bang) - 14 * crash, 0, 0).rot('antR', -30 * crash, 0, 20 * crash).rot('antL', -30 * crash, 0, -20 * crash).rot('jaw', 10 * bang + 30 * crash);
      ex(P, crash > 0.3 ? 'wide' : t > 0.3 && t < 1.38 ? (Math.floor(t * 8) % 3 === 0 ? 'shut' : 'angry') : t > 1.85 ? 'happy' : undefined, crash > 0.3 ? 'o' : t > 0.3 && t < 1.38 ? 'grit' : t > 1.85 ? 'grin' : undefined); P.blinkOK = false;
      ufos(P, c.time, { speed: 1 + crash * 2 });
      P.burst(1.46, FX.shock, 'head', [0, 50, 6], { scale: 0.45 }).burst(1.46, 'note', 'head', [0, 52, 6], { n: 6, speed: 1.6 }).burst(1.46, FX.flash, 'head', [0, 52, 8], { scale: 0.6 }).burst(1.7, 'sweat', 'head', [-7, 46, 4], { n: 2, dir: [-1, 1, 0] });
    } },
    // fidget: a big headbang and a whip of the long hair, then a satisfied roll of the shoulders
    hairwhip: { len: 1.7, next: 'idle', f(P, t, c) {
      const dip = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.42, E.in3)), whip = seg(t, 0.32, 0.48, E.out) * (1 - seg(t, 0.95, 1.4, E.inout));
      stance(P, { dy: -1.2 - 1.0 * dip, rx: 18 * dip - 12 * whip });
      P.rot('head', 34 * dip - 30 * whip, 0, 0).rot('head', 0, wave(t, 4) * 10 * seg(t, 1.0, 1.1) * (1 - seg(t, 1.35, 1.6)), 0);
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; P.rot('arm' + S, 10 * dip - 8 * whip, 0, 0); P.rot('coxa' + S, 0, 0, g * 6 * whip); P.rot('stalk' + S, 0, 0, g * 16 * whip); }
      P.rot('jaw', 18 * whip);
      ex(P, dip > 0.4 ? 'closed' : whip > 0.4 ? 'smug' : undefined, whip > 0.3 ? 'grin' : undefined); P.blinkOK = false;
      ufos(P, c.time);
    } },
    // the dance: a heavy stomp groove — stomp, stomp, a club punched at the sky on each beat — a double
    // headbang with the mane whipping, then a spin-stomp and both clubs clashed overhead; the saucers whirl in time
    dance: { len: 2.9, next: 'idle', f(P, t, c) {
      const beat = 0.35, n = Math.floor(t / beat), u = (t % beat) / beat;
      const groove = t < 1.4, side = n % 2 ? 'L' : 'R', g = side === 'R' ? 1 : -1, lift = groove ? bump(u, 0, 0.55) : 0, stomp = groove ? wob(u * beat, 0.55 * beat, 1, 5, 9) : 0;
      const bang = seg(t, 1.4, 1.5) * (1 - seg(t, 2.05, 2.15)), nod = Math.abs(Math.sin(((t - 1.4) / beat) * Math.PI)) * bang;
      const spin = seg(t, 2.1, 2.45, E.inout), clash = seg(t, 2.42, 2.52, E.in3) * (1 - seg(t, 2.7, 2.9, E.inout));
      stance(P, { dy: -1.4 - 1.4 * nod - 1.2 * clash + 0.5 * lift, rz: groove ? 6 * g * lift : 0, rx: 6 + 18 * nod, f: groove ? { [side]: [0, 2.6 * lift, 0.6 * lift] } : {} });
      P.rot('root', 0, 360 * spin, 0).sq('body', -0.05 * Math.abs(stomp) * (groove ? 1 : 0));
      if (groove) { punch(P, side, 0.9 * lift, 0, 70); P.rot('club' + side, -20 * lift, 0, 0); }
      for (const S of ['R', 'L']) { flex(P, S, bang + clash); P.rot('arm' + S, -40 * clash, (S === 'R' ? 1 : -1) * 40 * clash, 0); }
      P.rot('head', 26 * nod + (groove ? 10 * lift : 0) - 14 * clash, 0, 0).rot('jaw', 10 * nod + 28 * clash);
      P.rot('antR', 24 * nod, 0, 0).rot('antL', 24 * nod, 0, 0);
      ex(P, clash > 0.3 ? 'star' : nod > 0.4 ? 'shut' : groove ? (lift > 0.5 ? 'happy' : 'smug') : 'happy', clash > 0.2 ? 'o' : 'grin'); P.blinkOK = false;
      ufos(P, c.time, { speed: 2.2, r: 1 - 0.1 * bang });
      for (let k = 0; k < 8; k++) P.burst(k * beat + 0.04, 'note', 'head', [0, 52, 4], { n: 1, speed: 1, scale: 0.9 });
      for (let k = 0; k < 4; k++) P.burst(k * beat + 0.55 * beat, 'dust', 'root', [(k % 2 ? 1 : -1) * 6.6, 0.5, 1], { n: 3, speed: 0.6 });
      P.burst(2.52, FX.shock, 'body', [0, 58, 6], { scale: 0.5 }).burst(2.52, FX.flash, 'body', [0, 58, 6], {}).burst(2.52, 'note', 'head', [0, 56, 4], { n: 8, speed: 1.8, spread: 1 }).burst(2.52, 'sparkle', 'head', [0, 56, 4], { n: 10, speed: 1.6 });
    } },
    // the signature fidget: a stage dive — a crouch, a leap backwards… and the three foo fighters swoop in
    // under its back and crowd-surf it round, clubs up; it kicks off them and lands on its feet
    stagedive: { len: 3.6, next: 'idle', f(P, t, c) {
      const crouch = seg(t, 0, 0.42, E.inout) * (1 - seg(t, 0.42, 0.52, E.out)), fly = seg(t, 0.45, 0.95, E.out) * (1 - seg(t, 2.45, 2.95, E.inout));
      const surf = seg(t, 0.8, 1.1) * (1 - seg(t, 2.4, 2.6)), bob = Math.sin(t * 5) * surf, land = t > 2.95 ? wob(t, 2.95, -1.6, 3, 6) : 0;
      const rx = -78 * fly, ry0 = 20 * fly + 14 * bob, rz = 8 * Math.sin(t * 3.1) * surf;
      stance(P, { dy: -4.0 * crouch + Math.min(0, land), rx: 14 * crouch });
      P.pos('root', 0, 22 * fly + 1.2 * bob, -2 * fly).rot('root', rx, 0, rz);
      for (const S of ['R', 'L']) { const g = S === 'R' ? 1 : -1; cock(P, S, crouch); flex(P, S, fly); P.rot('arm' + S, -20 * surf * Math.max(0, Math.sin(t * 6 + g)), 0, 0); P.rot('thigh' + S, -40 * fly, 0, -g * 10 * fly).rot('shin' + S, 60 * fly, 0, 0); }
      P.rot('head', 14 * crouch - 20 * fly, 0, 0).rot('jaw', 30 * fly);
      ex(P, crouch > 0.3 ? 'angry' : surf > 0.5 ? (Math.floor(t * 2) % 3 === 0 ? 'happy' : 'star') : fly > 0.3 ? 'wide' : t > 3.0 ? 'smug' : undefined, crouch > 0.3 ? 'grin' : fly > 0.2 ? 'o' : t > 3.0 ? 'grin' : undefined); P.blinkOK = false;
      // the saucers slide in under its back: three points down its spine, carried by the root's tilt and lift
      const dive = [[-4, 20], [4, 30], [0, 40]].map(([x, y], i) => { const v = rotXYZ([x, y, -9.5], rx, 0, rz); return [surf, [v[0], v[1] + 22 * fly + 1.2 * bob - 2.5, v[2] - 2 * fly]]; });
      ufos(P, c.time, { dive });
      if (surf > 0.5) P.stream('note', 'root', [0, 26, -30], { rate: 5, spread: 1, speed: 1 }).stream(FX.orb, 'root', [0, 18, -24], { rate: 30, spread: 1 });
      P.burst(0.5, 'dust', 'root', [0, 0.5, 0], { n: 12, spread: 1, speed: 1.6 }).burst(2.95, 'dust', 'root', [0, 0.5, 0], { n: 14, spread: 1, speed: 1.8 }).burst(1.0, 'sparkle', 'root', [0, 24, -26], { n: 14, speed: 1.6 });
    } },
  },
};
// knocked out on its side: legs kicked up, clubs flopped, stalks drooping, the mane spilled on the ground
function knockedOut(P, k, t = 0) {
  P.rot('root', 0, 0, 84 * k).pos('root', -15 * k, 10.4 * k, 0);
  for (const [S, g] of [['R', 1], ['L', -1]]) {
    P.rot('thigh' + S, (-40 + wave(t, 0.7, g) * 7) * k, 0, -g * 8 * k).rot('shin' + S, 50 * k, 0, 0);
    P.rot('arm' + S, 26 * k, 0, g * 26 * k).rot('fore' + S, 30 * k, 0, 0);
    P.rot('stalk' + S, 30 * k, 0, (g * 30 + wave(t, 0.6, g) * 6) * k).rot('ant' + S, 30 * k, 0, g * 20 * k);
  }
  P.rot('head', 0, 0, 10 * k).rot('jaw', 24 * k).rot('fan', -26 * k, 0, 0).rot('tail1', 0, 0, -10 * k);
}
def.dripForm = DRIP_FORM;
def.anim = anim;
