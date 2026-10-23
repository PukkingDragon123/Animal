// Polobruin — stage 3b of the bear line (Echo/Fairy-ish hero). The other ending: the bear who chose
// to protect. A strong, upright brown bear in a crisp pink polo with the collar popped high, a fresh
// caesar with 360 waves, warm determined eyes and a chest that's always out. It guards, it blocks,
// it lifts others up — and when it has to, it raises a shield of light shaped like a heart. Drip: a
// gold bear-piece chain or white shutter shades; a heart backpack or a phoenix-feather cape; big
// pink kicks or a gold heart gauntlet. An original hero that winks at a rapper's backpack-and-polo era.
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { fur, fringe, halo, gold, GOLD, chain, shutter, sneaker, piece, waves, rib, luxe, fill, wrapX, isSide, edgeLine, sh } from './bear_parts.js';
import { eyeRig, eyesAt, eyesScale, glance, mouthArt, keepEyes } from './eyes.js';
import { blackGold } from '../model.js';
import { poly, ramp, shift, h2 } from './kit.js';

const C = {
  fur: '#94603a', furHi: '#ba8452', furLo: '#64402a', furEdge: '#4e2e18', furTip: '#d8a468', furLite: '#aa7448',
  hair: '#2a1810', hairHi: '#56382a',
  muz: '#f0d4a8', muzHi: '#fff2d0', muzLo: '#c8a274', muzLine: '#5e3a22',
  nose: '#2a1810', noseHi: '#5e3e30', noseSpec: '#c8aca0', inEar: '#e8a890', inEarLo: '#c27a64', pad: '#e8b890',
  pink: '#f48cb8', pinkHi: '#ffbcd8', pinkLo: '#c85a8c', pinkLine: '#8a2e5c', pinkDot: '#ffa6cc',
  white: '#fbf6f2', emb: '#8a1a3a',
  red: '#e0203a', redHi: '#ff6a7a', redLo: '#8a0e22',
  pack: '#7a1e32', packHi: '#a83a50', packLo: '#4e1020', cream: '#f2e2c4',
  shade: '#f4f4f8', shadeHi: '#ffffff', shadeLo: '#a8aab8', lensGap: '#2a2c3a',
  ink: '#1e120c',
};

// ---------------------------------------------------------------- painters
const furP = (seed, o = {}) => fur(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furEdge, tip: C.furTip, lite: C.furLite, s: 10, tipH: 3.5, pt: 0.6, seed, ...o });
const headFur = furP(11), headFur2 = furP(23, { s: 9 }), limbFur = furP(31, { s: 8, tipH: 3 });
const headHalo = halo(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furEdge, tip: C.furTip, n: 26, depth: 0.13, inner: 0.78, sq: 2.7, seed: 4 });
const hairP = waves(C.hair, { hi: C.hairHi });
const muzP = fur(C.muz, { hi: C.muzHi, lo: C.muzLo, line: shift(C.muz, -0.12), lite: C.muzHi, ramp: [C.muzHi, C.muz, C.muz, shift(C.muz, -0.06)], s: 8, rowH: 6, tipH: 2.5, seed: 5, y0: 2 });
const noseP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? C.noseHi : face === 'down' ? '#140a06' : y === 0 ? C.noseHi : y >= h - 1 ? '#140a06' : C.nose)); if (face === 'south') { p.px(1, 1, C.noseSpec); p.px(2, 1, C.noseSpec); } };
const earP = (seed) => { const f = furP(seed, { s: 7, tipH: 2.5 }); return (p, w, h, face, cube) => { f(p, w, h, face, cube); if (face !== 'south') return; const cx = w / 2, cy = h / 2 + 0.3, rx = w / 2 - 2, ry = h / 2 - 2; fill(p, w, h, (x, y) => { const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2; return d < 1 ? (d < 0.4 ? C.inEarLo : C.inEar) : null; }); }; };
const pawP = (seed) => { const f = furP(seed, { s: 6, tipH: 2.5 }); return (p, w, h, face, cube) => { f(p, w, h, face, cube); if (face === 'down') fill(p, w, h, (x, y) => (x > 0 && x < w - 1 && y > 0 && y < h - 1 ? C.pad : null)); }; };
// the polo: crisp pink piqué (a fine dot weave), a three-button placket and a little embroidered bear
const pique = (x, y, h, face) => { const c = face === 'up' ? C.pinkHi : face === 'down' ? C.pinkLo : ramp([C.pinkHi, C.pink, C.pink, C.pinkLo], h > 1 ? y / (h - 1) : 0.5, x, y); return (x + y * 2) % 4 === 0 && face !== 'down' ? sh(c, 0.12) : c; };
const poloP = (o = {}) => (p, w, h, face, cube) => {
  fill(p, w, h, (x, y) => pique(x, y, h, face));
  if (!isSide(face)) return;
  if (o.hem) for (let x = 0; x < w; x++) { p.px(x, h - 1, C.pinkLine); p.px(x, h - 2, C.pinkLo); }
  if (o.cuff) for (let x = 0; x < w; x++) { p.px(x, h - 2, C.white); p.px(x, h - 1, C.pinkLo); }
  if (face === 'south' && o.front) {
    const cx = Math.round((w - 1) / 2), y1 = Math.round(h * 0.34);
    for (let y = 0; y <= y1; y++) { p.px(cx - 2, y, C.pinkLine); p.px(cx + 2, y, C.pinkLo); for (let x = cx - 1; x <= cx + 1; x++) p.px(x, y, y === y1 ? C.pinkLine : sh(C.pink, 0.08)); }
    for (const by of [Math.round(h * 0.1), Math.round(h * 0.22)]) { p.px(cx, by, C.white); p.px(cx, by + 1, C.shadeLo); }
    // the embroidered bear on the left chest (viewer's right)
    const ex = Math.round(w * 0.72), ey = Math.round(h * 0.2);
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [0, 1], [-1, 1], [1, 1]]) p.px(ex + dx, ey + dy, C.emb);
    p.px(ex - 2, ey - 2, C.emb).px(ex + 2, ey - 2, C.emb).px(ex, ey + 2, C.emb);
  }
  if (face === 'north' && o.back) for (let y = 1; y < h - 2; y++) if (y % 6 === 0) p.px(Math.round(w / 2), y, C.pinkLo);
};
const collarP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? C.pinkHi : face === 'down' ? C.pinkLo : y === 0 ? C.pinkHi : (x + y) % 3 === 0 ? sh(C.pink, 0.1) : C.pink)); if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, h - 1, C.pinkLine); };
const ribP = rib(C.pink, null, { stripes: [C.pinkHi, C.white, C.pink] });
// ---- drip
const goldP = gold(), pieceP = piece({ gem: C.red });
const lens = shutter({ frame: C.shade, hi: C.shadeHi, lo: C.shadeLo, gap: C.lensGap, gapLo: '#40425a', bar: 2, round: 4, bridge: 1.5 });
const barP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? C.shadeHi : face === 'down' ? C.shadeLo : y === 0 ? C.shadeHi : y === h - 1 ? C.shadeLo : C.shade));
const heartAt = (p, w, h, col, hi, lo) => { const m = (w - 1) / 2; fill(p, w, h, (x, y) => { const u = (x - m) / (w / 2), v = (y - h * 0.36) / (h / 2), f = (u * u + v * v - 0.62) ** 3 - u * u * v * v * v * 1.5; return f < 0 ? (x + y < w * 0.55 ? hi : f > -0.003 ? lo : col) : null; }); };
const packP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? C.packHi : face === 'down' ? C.packLo : ramp([C.packHi, C.pack, C.pack, C.packLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (!isSide(face)) return;
  for (let x = 0; x < w; x++) { p.px(x, 0, C.cream); p.px(x, h - 1, C.packLo); }
  if (face === 'north') { const q = { px: (x, y, c) => p.px(x + Math.round(w * 0.2), y + Math.round(h * 0.2), c), s: p.s }; heartAt(q, Math.round(w * 0.6), Math.round(h * 0.55), C.red, C.redHi, C.redLo); }
};
const strapP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? C.packHi : x === 0 ? C.packHi : x === w - 1 ? C.packLo : C.pack));
// the phoenix cape: feather panels fading red → orange → gold, each feather with a dark quill
const featherP = (p, w, h) => {
  fill(p, w, h, (x, y) => { const t = y / (h - 1), fx = x % 4, tipCut = t > 0.82 && (fx === 0 || fx === 3) && y > h - 1 - ((x * 7) % 3); if (tipCut) return null; return fx === 1 && t < 0.9 ? '#7a1a10' : ramp(['#e8302a', '#ff7a2a', '#ffc040', '#fff0a0'], t, x, y); });
  edgeLine(p, '#5a1008');
};
const kicks = sneaker({ up: '#ffffff', upHi: '#ffffff', upLo: '#e0d8e0', panel: C.pink, sole: C.pinkHi, soleLo: C.pinkLo, lace: C.pink });
const gauntP = (p, w, h, face) => { gold()(p, w, h, face); if (face === 'south' || face === 'west' || face === 'east') { const q = { px: (x, y, c) => p.px(x + Math.round(w * 0.2), y + Math.round(h * 0.25), c), s: p.s }; heartAt(q, Math.round(w * 0.6), Math.round(h * 0.5), C.red, C.redHi, C.redLo); } };
// the shield of light (special)
const shieldP = (p, w, h) => { heartAt(p, w, h, '#ff6a9a', '#ffe0ec', '#ff3a7a'); fill(p, w, h, (x, y) => { const d = Math.hypot(x - w / 2, y - h * 0.42) / (w / 2); return p.s.data[y * w + x] >>> 24 && d < 0.5 ? (d < 0.25 ? '#ffffff' : '#ffc8dc') : null; }); };

// ---------------------------------------------------------------- face
// determined hero eyes: whites, a warm brown iris looking ahead, a flat strong top lid (full resolution)
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-2.3, 34.4, 4.83], line: '#22120a', iris: '#9a5428', irisDark: '#4a2410', extra: ['smug', 'glint'], map: { open: [
  'llllllllllll',
  'lsssIIIIssll',
  'lswIIhiIIwwl',
  'lwwIiikkIwwl',
  'lwwIiikkIwwl',
  '.lwwIiiIwwl.',
  '..llwwwwll..',
  '....llll....',
] } });
const MOUTHS = ['smile', 'grin', 'o', 'grit', 'frown', 'flat', 'wavy', 'tongue'];

// ---------------------------------------------------------------- the model
const B = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const A = (id, c) => ({ ...c, id, hide: true });
const CHAIN = chain([[-3.4, 29.0, 3.0], [-3.0, 27.2, 4.0], [-1.8, 25.6, 4.18], [0, 25.0, 4.24], [1.8, 25.6, 4.18], [3.0, 27.2, 4.0], [3.4, 29.0, 3.0]], { len: 1.3, w: 0.9, t: 0.42, step: 0.95 }).map((c) => A('acc-chain', c));
const KICK = (x0, m) => [A('acc-kicks', B([x0 - 0.35, 0, -2.6], [4.5, 2.6, 6.4], kicks, { mirror: m })), A('acc-kicks', B([x0, 2.4, -2.1], [3.8, 1.2, 4.2], kicks, { mirror: m }))];
const CAPE = (x0, w, rz) => [A('acc-cape', B([x0, 12.0, -4.25], [w, 15.6, 0], featherP, { plane: 'z' }))];
export const def = {
  name: 'polobruin', ppu: 3, scale: 0.68, outline: { color: '#1e120c', px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'thighR', parent: 'root', pivot: [-2.6, 17.0, 0], cubes: [B([-4.3, 9.4, -1.8], [3.4, 8.0, 3.6], limbFur)] },
    { name: 'shinR', parent: 'thighR', pivot: [-2.6, 9.6, 0], cubes: [B([-4.2, 2.0, -1.7], [3.2, 7.8, 3.4], limbFur)] },
    { name: 'footR', parent: 'shinR', pivot: [-2.6, 2.0, 0], cubes: [B([-4.5, 0, -2.2], [3.8, 2.2, 5.6], pawP(41)), ...KICK(-4.5, false)] },
    { name: 'thighL', parent: 'root', pivot: [2.6, 17.0, 0], cubes: [B([0.9, 9.4, -1.8], [3.4, 8.0, 3.6], limbFur, { mirror: true })] },
    { name: 'shinL', parent: 'thighL', pivot: [2.6, 9.6, 0], cubes: [B([1.0, 2.0, -1.7], [3.2, 7.8, 3.4], limbFur, { mirror: true })] },
    { name: 'footL', parent: 'shinL', pivot: [2.6, 2.0, 0], cubes: [B([0.7, 0, -2.2], [3.8, 2.2, 5.6], pawP(43), { mirror: true }), ...KICK(0.7, true)] },
    // the polo: torso, a broad chest, square shoulders; the hem sits over the hips
    { name: 'body', parent: 'root', pivot: [0, 17.0, 0], cubes: [
      B([-5.4, 15.8, -3.4], [10.8, 13.4, 6.8], poloP({ back: true }), { faces: { south: poloP({ front: true }) } }),
      B([-5.0, 21.4, -3.8], [10.0, 6.8, 7.6], poloP({ back: true }), { faces: { south: poloP({ front: true }) } }),
      B([-6.3, 26.0, -3.2], [12.6, 3.2, 6.4], poloP()),
      B([-5.7, 15.0, -3.7], [11.4, 1.6, 7.4], poloP({ hem: true })),
      // the backpack straps (front)
      A('acc-pack', B([-4.6, 17.6, 3.75], [1.1, 10.6, 0.45], strapP)), A('acc-pack', B([3.5, 17.6, 3.75], [1.1, 10.6, 0.45], strapP)),
    ] },
    // the popped collar: two halves that stand up round the neck
    { name: 'collarR', parent: 'body', pivot: [-3.0, 28.6, 0], cubes: [
      B([-5.0, 28.4, -4.7], [5.0, 3.6, 0.6], collarP),
      B([-6.0, 28.3, -4.7], [0.7, 3.8, 6.4], collarP, { pivot: [-5.65, 28.3, 0], rot: [0, 0, 10] }),
      B([-6.0, 28.2, 1.6], [3.2, 3.4, 0.6], collarP, { pivot: [-5.6, 28.2, 1.9], rot: [0, -38, 10] }),
    ] },
    { name: 'collarL', parent: 'body', pivot: [3.0, 28.6, 0], cubes: [
      B([0, 28.4, -4.7], [5.0, 3.6, 0.6], collarP),
      B([5.3, 28.3, -4.7], [0.7, 3.8, 6.4], collarP, { pivot: [5.65, 28.3, 0], rot: [0, 0, -10] }),
      B([2.8, 28.2, 1.6], [3.2, 3.4, 0.6], collarP, { pivot: [5.6, 28.2, 1.9], rot: [0, 38, -10] }),
    ] },
    { name: 'chain', parent: 'body', pivot: [0, 29.0, 2.6], cubes: [...CHAIN, A('acc-chain', B([-0.4, 24.4, 4.05], [0.8, 0.7, 0.45], goldP)), A('acc-chain', B([-1.3, 21.8, 4.0], [2.6, 2.6, 0.4], goldP)), A('acc-chain', B([-1.6, 21.5, 4.43], [3.2, 3.2, 0], pieceP, { plane: 'z' }))] },
    { name: 'pack', parent: 'body', pivot: [0, 27.0, -3.4], cubes: [
      A('acc-pack', B([-4.2, 17.0, -7.0], [8.4, 9.6, 3.6], packP)),
      A('acc-pack', B([-3.8, 26.4, -6.4], [7.6, 1.0, 2.8], packP)),
      A('acc-pack', B([-4.6, 17.6, -4.0], [1.1, 10.6, 0.6], strapP)), A('acc-pack', B([3.5, 17.6, -4.0], [1.1, 10.6, 0.6], strapP)),
    ] },
    { name: 'cape', parent: 'body', pivot: [0, 28.6, -3.6], cubes: [...CAPE(-5.6, 5.6, 0), ...CAPE(0, 5.6, 0), A('acc-cape', B([-6.2, 27.4, -4.2], [12.4, 1.4, 1.0], goldP))] },
    { name: 'armR', parent: 'body', pivot: [-6.0, 27.6, 0], rot: [0, 0, -6], cubes: [B([-8.6, 23.2, -1.9], [3.4, 4.8, 3.8], poloP()), B([-8.75, 22.6, -2.05], [3.7, 0.9, 4.1], ribP), B([-8.4, 19.4, -1.6], [3.0, 4.0, 3.2], limbFur)] },
    { name: 'foreR', parent: 'armR', pivot: [-6.9, 19.8, 0], cubes: [B([-8.4, 13.8, -1.6], [3.0, 6.2, 3.2], limbFur), B([-8.7, 11.2, -1.9], [3.6, 2.8, 3.8], pawP(51))] },
    { name: 'armL', parent: 'body', pivot: [6.0, 27.6, 0], rot: [0, 0, 6], cubes: [B([5.2, 23.2, -1.9], [3.4, 4.8, 3.8], poloP()), B([5.05, 22.6, -2.05], [3.7, 0.9, 4.1], ribP), B([5.4, 19.4, -1.6], [3.0, 4.0, 3.2], limbFur, { mirror: true })] },
    { name: 'foreL', parent: 'armL', pivot: [6.9, 19.8, 0], cubes: [
      B([5.4, 13.8, -1.6], [3.0, 6.2, 3.2], limbFur, { mirror: true }), B([5.1, 11.2, -1.9], [3.6, 2.8, 3.8], pawP(53), { mirror: true }),
      A('acc-gaunt', B([5.1, 13.4, -2.0], [3.8, 4.4, 4.0], gauntP)),
    ] },
    // the shield of light: a heart that forms in front of its raised guard (special)
    { name: 'shield', parent: 'body', pivot: [3.4, 25.0, 10.0], cubes: [B([-1.2, 20.6, 10.0], [9.2, 8.6, 0], shieldP, { plane: 'z', glow: true, id: 'p-shield', hide: true })] },
    { name: 'head', parent: 'body', pivot: [0, 29.6, 0.4], cubes: [
      B([-5.2, 29.4, -4.2], [10.4, 9.0, 8.4], headFur),
      B([-5.8, 30.4, -3.6], [11.6, 5.8, 7.2], headFur2),
      B([-4.2, 29.0, -3.6], [8.4, 9.8, 7.2], headFur),
      B([-4.4, 30.0, -4.8], [8.8, 7.8, 9.6], headFur2),
      B([-4.8, 37.6, -4.5], [9.6, 1.6, 9.1], hairP),
      B([-6.8, 28.0, 0.2], [13.6, 12.0, 0], headHalo, { plane: 'z' }),
      B([-2.4, 29.8, 4.4], [4.8, 3.2, 2.6], muzP),
      B([-2.0, 33.0, 4.4], [4.0, 0.5, 2.1], muzP),
      B([-1.9, 29.0, 4.3], [3.8, 1.2, 2.4], muzP),
      B([-1.2, 32.2, 6.7], [2.4, 1.1, 1.0], noseP), B([-0.7, 31.6, 6.65], [1.4, 0.7, 0.9], noseP),
      ...MOUTHS.map((s) => B([-2.0, 29.95, 7.03], [4.0, 1.7, 0], mouthArt(s, { chunk: 1, line: C.muzLine, inner: '#4a1420', tongue: '#e86a7a' }), { plane: 'z', id: 'm-' + s, hide: s !== 'smile', outline: false })),
    ] },
    ...EYES.bones,
    { name: 'shades', parent: 'head', pivot: [0, 35.4, 5.0], cubes: [
      A('acc-shades', B([-5.0, 35.9, 4.8], [10.0, 0.6, 0.5], barP)),
      A('acc-shades', B([-5.0, 32.9, 5.2], [10.0, 3.4, 0], lens, { plane: 'z' })),
      A('acc-shades', B([-6.1, 35.95, -0.6], [0.4, 0.45, 5.6], barP)), A('acc-shades', B([5.7, 35.95, -0.6], [0.4, 0.45, 5.6], barP)),
    ] },
    { name: 'earR', parent: 'head', pivot: [-4.4, 37.4, -0.8], rot: [0, 0, 16], cubes: [B([-7.4, 36.8, -1.6], [4.4, 3.0, 1.6], earP(61)), B([-6.85, 36.2, -1.6], [3.3, 4.2, 1.6], earP(62))] },
    { name: 'earL', parent: 'head', pivot: [4.4, 37.4, -0.8], rot: [0, 0, -16], cubes: [B([3.0, 36.8, -1.6], [4.4, 3.0, 1.6], earP(63), { mirror: true }), B([3.55, 36.2, -1.6], [3.3, 4.2, 1.6], earP(64), { mirror: true })] },
  ],
};
def.drip = [
  [{ id: 'acc-chain', name: 'Bear-piece chain' }, { id: 'acc-shades', name: 'White shutter shades' }],
  [{ id: 'acc-pack', name: 'Heart backpack' }, { id: 'acc-cape', name: 'Phoenix-feather cape' }],
  [{ id: 'acc-kicks', name: 'Big pink kicks' }, { id: 'acc-gaunt', name: 'Heart gauntlet' }],
];
// the ultra-drip form: black lacquer and gold — the polo turns gold, the eyes stay warm brown
def.dripForm = { map: keepEyes(EYES, luxe(blackGold)) };
def.attach = {
  head: { bone: 'head', at: [0, 39.2, 0], size: 9.6 },
  face: { bone: 'head', at: [0, 34.4, 4.9], size: 8.8 },
  neck: { bone: 'body', at: [0, 28.6, 3.8], size: 7.4 },
  back: { bone: 'body', at: [0, 22.0, -3.8], size: 10 },
};

// ---------------------------------------------------------------- animation
const TAU = Math.PI * 2, LEG = 7.6;
const face = (P, e, m) => { if (e) { P.face('eyes', e); P.blinkOK = false; } if (m) P.face('mouth', m); return P; };
function knees(P, d, sides = ['R', 'L']) {
  const th = (Math.acos(Math.max(-1, Math.min(1, 1 - Math.max(0, d) / (2 * LEG)))) * 180) / Math.PI;
  for (const s of sides) P.pos('thigh' + s, 0, -d, 0).rot('thigh' + s, -th, 0, 0).rot('shin' + s, 2 * th, 0, 0).rot('foot' + s, -th, 0, 0);
}
// the hero's guard: feet set wide, fists up loose in front of the chest
function guard(P, k = 1) {
  P.rot('thighR', 0, 0, -5 * k).rot('thighL', 0, 0, 5 * k).rot('footR', 0, 0, 5 * k).rot('footL', 0, 0, -5 * k);
  P.rot('armR', -30 * k, 0, 12 * k).rot('foreR', -128 * k, 0, 30 * k).rot('armL', -34 * k, 0, -12 * k).rot('foreL', -132 * k, 0, -32 * k);
}
export const anim = {
  start: 'idle', seed: 77,
  breathe: { bone: 'body', amp: 0.016, per: 2.8 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.6, 5.4], dur: 0.12 },
  look: { bone: 'head', yaw: 30, pitch: 12, speed: 5 },
  springs: [
    { bone: 'cape', tip: [0, -14, -1], k: 70, d: 5, gain: 1.1, max: 26, axes: [1, 0.2, 0.6] },
    { bone: 'chain', tip: [0, -4, 1], k: 120, d: 7, gain: 0.8, max: 14, axes: [1, 0.3, 1] },
    { bone: 'pack', tip: [0, -6, -2], k: 180, d: 10, gain: 0.45, max: 8, axes: [1, 0.3, 1] },
    { bone: 'collarR', tip: [0, 2.5, 0], k: 260, d: 12, gain: 0.4, max: 10 },
    { bone: 'collarL', tip: [0, 2.5, 0], k: 260, d: 12, gain: 0.4, max: 10 },
    { bone: 'earR', tip: [-1, 2, 0], k: 240, d: 11, gain: 0.5, max: 12 },
    { bone: 'earL', tip: [1, 2, 0], k: 240, d: 11, gain: 0.5, max: 12 },
  ],
  faces: {
    eyes: EYES.slot,
    mouth: { default: 'smile', states: Object.fromEntries(MOUTHS.map((s) => [s, ['m-' + s]])) },
    shield: { default: 'off', states: { off: [], on: ['p-shield'] } },
  },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'pop', 'scan'] },
  clips: {
    // on guard: light on its toes like a fighter, fists loose, chest out, eyes scanning for trouble
    idle: { len: 2.4, loop: true, f(P, t) {
      const b = Math.abs(Math.sin((t / 0.6) * Math.PI)), sw = wave(t, 1 / 2.4);
      guard(P, 0.8); knees(P, 0.6 + 0.6 * (1 - b));
      P.pos('body', sw * 0.4, 0, 0).rot('body', -3, sw * 6, -sw * 2).rot('head', -4, -sw * 8, sw * 2);
      P.rot('foreR', -6 * b, 0, 0).rot('foreL', 6 * b, 0, 0);
      const [gx, gy] = glance(t, [[0, 0], [-0.4, 0], [0, 0], [0.4, 0]], 0.6); eyesAt(P, gx, gy); eyesScale(P, 1, 1 - 0.08 * (1 - b));
    } },
    // a confident stride, chest out, arms swinging loose
    walk: { len: 0.95, loop: true, f(P, t) {
      const ph = (t / 0.95) * TAU, s = Math.sin(ph), c = Math.cos(ph), amp = 22;
      for (const [side, sg] of [['R', 1], ['L', -1]]) {
        const sw = s * sg, kn = Math.max(0, c * sg) * 32;
        P.rot('thigh' + side, -sw * amp - kn * 0.45, 0, 0).rot('shin' + side, kn, 0, 0).rot('foot' + side, sw * amp * 0.7 - kn * 0.5, 0, 0);
        P.rot('arm' + side, sw * 26, 0, 0).rot('fore' + side, -12 - Math.max(0, -sw) * 16, 0, 0);
      }
      const dy = -LEG * 2 * (1 - Math.cos((amp * Math.abs(s) * Math.PI) / 180)) + 0.3 * Math.abs(c);
      P.pos('thighR', 0, dy, 0).pos('thighL', 0, dy, 0).pos('body', 0, dy, 0).rot('body', -3, s * 6, s * 2).rot('head', -2, -s * 4, 0);
    } },
    // the hero's call: it plants its feet and throws one fist to the sky; feathers of fire burst round it
    cry: { len: 2.2, next: 'idle', f(P, t) {
      const load = seg(t, 0, 0.35, E.inout) * (1 - seg(t, 0.35, 0.45, E.out)), up = seg(t, 0.4, 0.6, E.back) * (1 - seg(t, 1.8, 2.2, E.inout));
      guard(P, 1 - up); knees(P, 2 * load + 0.4);
      P.rot('armR', -176 * up, 0, -18 * up).rot('foreR', -8 * up, 0, 0).rot('armL', 10 * up, 0, 20 * up).rot('foreL', -50 * up, 0, -40 * up);
      P.rot('body', 10 * load - 10 * up, 0, 0).rot('head', 12 * load - 18 * up, 0, 0).sq('body', -0.08 * load + 0.06 * up * (1 - seg(t, 0.6, 0.8)));
      eyesScale(P, 1 + 0.15 * up, 1 + 0.2 * up);
      face(P, load > 0.3 ? 'angry' : up > 0.3 ? 'glint' : undefined, load > 0.3 ? 'grit' : up > 0.3 ? 'grin' : undefined);
      P.burst(0.55, 'bear-phoenix', 'body', [0, 24, 0], { n: 16, spread: 1, speed: 1.4 }).burst(0.55, 'sparkle', 'armR', [-7, 10, 0], { n: 10, speed: 1.2 }).burst(0.55, 'ring', 'root', [0, 1, 2], { scale: 2.4 });
      if (up > 0.5) P.stream('bear-phoenix', 'root', [0, 4, 0], { rate: 10, spread: 1, speed: 0.8 });
    } },
    // shoulder-in charge into a rising uppercut
    attack: { len: 1.1, next: 'idle', f(P, t) {
      const wind = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.38, E.in)), dash = seg(t, 0.3, 0.45, E.in3) * (1 - seg(t, 0.62, 1.05, E.inout)), upc = bump(t, 0.38, 0.7);
      guard(P, 1 - upc * 0.7); knees(P, 2.2 * wind + 1.0 * dash);
      P.pos('root', 0, 0, -1.4 * wind + 6 * dash).rot('body', 16 * wind - 8 * upc, -20 * wind + 18 * dash, 0);
      P.rot('armR', 40 * wind - 150 * upc, 0, 10 * upc).rot('foreR', -20 * upc, 0, 0);
      P.rot('head', 10 * wind - 10 * upc, 10 * wind, 0);
      eyesScale(P, 1 + 0.1 * upc, 1 - 0.2 * wind);
      face(P, t < 0.75 ? 'angry' : undefined, wind > 0.3 ? 'grit' : upc > 0.3 ? 'grin' : undefined);
      P.burst(0.5, 'spark', 'body', [-3, 32, 10], { scale: 1.4 }).burst(0.5, 'star', 'body', [-3, 32, 10], { n: 5 }).burst(0.5, 'bear-heart', 'body', [-3, 32, 10], { n: 2 }).burst(0.3, 'dust', 'root', [0, 0.5, 0], { n: 5 });
    } },
    // the special: it raises its guard and a shield of light in the shape of a heart forms on its arm; it pulses
    // a protective ring, once, twice, three times
    special: { len: 3.0, next: 'idle', f(P, t) {
      const raise = seg(t, 0.2, 0.55, E.back) * (1 - seg(t, 2.5, 2.95, E.inout)), brace = bump(t, 0, 0.3);
      guard(P, 1 - raise); knees(P, 1.6 * raise + 1.4 * brace);
      P.rot('armL', -86 * raise, 0, -10 * raise).rot('foreL', -20 * raise, 0, 0).rot('armR', -30 * raise, 0, 30 * raise).rot('foreR', -70 * raise, 0, 30 * raise);
      P.rot('body', -4 * raise, 14 * raise, 0).rot('head', -4 * raise, -10 * raise, 0);
      const pulse = Math.max(bump(t, 0.8, 1.2), bump(t, 1.35, 1.75), bump(t, 1.9, 2.3));
      P.scl('foreL', 1 + 0.06 * pulse, 1 + 0.06 * pulse, 1 + 0.06 * pulse); const sk = Math.max(0.05, seg(t, 0.45, 0.7, E.back) * (1 - seg(t, 2.4, 2.8, E.in)) + 0.1 * pulse); P.scl('shield', sk, sk, 1).rot('shield', 0, -14 * raise, 0);
      P.face('shield', raise > 0.4 ? 'on' : 'off');
      face(P, raise > 0.3 ? 'angry' : undefined, raise > 0.3 ? 'grit' : undefined);
      for (const tb of [0.85, 1.4, 1.95]) P.burst(tb, 'bear-aegis', 'shield', [3.4, 25, 10.4], { n: 1, scale: 1.6 }).burst(tb, 'bear-heart', 'shield', [3.4, 25, 10.4], { n: 3, speed: 1 });
      if (raise > 0.4) P.stream('sparkle', 'foreL', [7, 15, 4], { rate: 10, spread: 1, speed: 0.6 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.24, 0.7, E.inout));
      guard(P, 1); P.rot('armL', -20 * k, 0, 0).rot('armR', -20 * k, 0, 0);
      P.pos('root', 0, 0, -2.6 * k).rot('body', -12 * k + wob(t, 0.24, 3, 3, 6), 0, 0).rot('head', -14 * k, 0, 6 * k); knees(P, 1.2 * k);
      eyesScale(P, 1 + 0.15 * k, 1 - 0.2 * k); face(P, 'shut', 'grit');
      P.burst(0.02, 'spark', 'body', [0, 28, 8], {}).burst(0.02, 'bear-fluff', 'body', [0, 28, 4], { n: 5, tint: [0.66, 0.46, 0.3] }).burst(0.1, 'sweat', 'head', [-5, 38, 3], { n: 2 });
    } },
    // down on one knee, a last look up — then it topples onto its side
    faint: { len: 2.6, next: 'down', f(P, t) {
      const kneel = seg(t, 0.2, 0.7, E.in), tip = seg(t, 1.3, 1.8, E.bounce);
      P.pos('thighR', 0, -7.4 * kneel, 0).pos('thighL', 0, -7.4 * kneel, 0).pos('body', 0, -7.4 * kneel, 0);
      P.rot('thighR', -84 * kneel, 0, 0).rot('shinR', 84 * kneel, 0, 0).rot('footR', 40 * kneel, 0, 0).rot('thighL', -30 * kneel, 0, 0).rot('shinL', 110 * kneel, 0, 0).rot('footL', -60 * kneel, 0, 0);
      P.rot('body', 14 * kneel, 0, 0).rot('head', 20 * kneel - 30 * bump(t, 0.7, 1.3), 0, 0).rot('armR', -20 * kneel, 0, -10 * kneel).rot('armL', -30 * kneel, 0, 10 * kneel);
      P.rot('root', 0, 0, -80 * tip).pos('root', 3 * tip, 4 * tip, 0);
      face(P, t < 0.7 ? 'shut' : t < 1.3 ? 'sad' : 'swirl', t < 1.3 ? 'grit' : 'o');
      P.burst(0.7, 'dust', 'root', [0, 1, 2], { n: 6, spread: 1 }).burst(1.78, 'dust', 'root', [8, 1, 1], { n: 8, spread: 1 }).burst(1.4, 'star', 'head', [0, 40, 0], { n: 4 });
    } },
    down: { len: 3.0, loop: true, f(P, t) {
      P.pos('thighR', 0, -7.4, 0).pos('thighL', 0, -7.4, 0).pos('body', 0, -7.4, 0);
      P.rot('thighR', -84, 0, 0).rot('shinR', 84, 0, 0).rot('footR', 40, 0, 0).rot('thighL', -30, 0, 0).rot('shinL', 110, 0, 0).rot('footL', -60, 0, 0);
      P.rot('body', 14, 0, 0).rot('head', 20, 0, 0).rot('armR', -20 + wave(t, 0.33) * 3, 0, -10).rot('armL', -30, 0, 10).rot('root', 0, 0, -80).pos('root', 3, 4, 0);
      face(P, 'swirl', 'o'); P.lookW = 0; P.breathW = 0.6;
      P.stream('star', 'head', [0, 40, 2], { rate: 1, spread: 0.6, speed: 0.4 });
    } },
    // uplifting: both fists up in a V, then it pops its collar and grins
    win: { len: 2.8, next: 'idle', f(P, t) {
      const v = seg(t, 0.1, 0.35, E.back) * (1 - seg(t, 1.2, 1.45, E.inout)), hopY = bump(t, 0.1, 0.5) * 2.4, pop = seg(t, 1.45, 1.7, E.back) * (1 - seg(t, 2.45, 2.8, E.inout));
      P.pos('root', 0, hopY, 0).rot('armR', -150 * v, 0, -40 * v).rot('armL', -150 * v, 0, 40 * v);
      P.rot('armR', -100 * pop, 0, 30 * pop).rot('foreR', -60 * pop, 0, 50 * pop).rot('armL', -100 * pop, 0, -30 * pop).rot('foreL', -60 * pop, 0, -50 * pop);
      P.rot('collarR', -30 * pop, 0, 18 * pop).rot('collarL', -30 * pop, 0, -18 * pop).rot('head', -14 * v - 8 * pop, 10 * pop, 0).rot('body', -6 * v - 4 * pop, 0, 0);
      eyesScale(P, 1 + 0.15 * v, 1 + 0.2 * v);
      face(P, v > 0.3 ? 'happy' : pop > 0.3 ? 'smug' : undefined, v > 0.3 ? 'grin' : 'smile');
      P.burst(0.3, 'bear-phoenix', 'body', [0, 30, 0], { n: 12, spread: 1 }).burst(0.3, 'sparkle', 'head', [0, 40, 3], { n: 8 }).burst(1.62, 'sparkle', 'body', [0, 30, 4], { n: 8, speed: 0.8 }).burst(1.62, 'bear-heart', 'body', [0, 30, 4], { n: 3 });
    } },
    // asleep sitting cross-legged, arms folded, chin on its chest
    sleep: { len: 4.0, loop: true, f(P, t) {
      const br = Math.sin((t / 4) * TAU);
      P.pos('root', 0, -13.0, 0).rot('thighR', -84, -36, 0).rot('thighL', -84, 36, 0).rot('shinR', 120, 0, 30).rot('shinL', 120, 0, -30);
      P.rot('body', 8 + br * 1.5, 0, 0).rot('armR', -50, 0, 30).rot('foreR', -90, 0, 50).rot('armL', -46, 0, -30).rot('foreL', -90, 0, -50);
      P.rot('head', 24 + br * 2, 0, 6);
      face(P, 'closed', br > 0.4 ? 'o' : 'flat'); P.lookW = 0; P.breathW = 0.5;
      P.burst(0.6, 'z', 'head', [3, 40, 4], {}).burst(2.2, 'z', 'head', [3, 40, 4], {});
    } },
    // the dance: a backpack-era bounce — heel-toe steps, alternating arm pumps, a quick spin, and it lands
    // the finish popping its collar
    dance: { len: 3.0, next: 'idle', f(P, t) {
      const per = 0.5, ph = (t % per) / per, beat = Math.floor(t / per), on = seg(t, 0, 0.1) * (1 - seg(t, 2.0, 2.1));
      const b = Math.abs(Math.sin(ph * Math.PI)), side = beat % 2 ? 1 : -1;
      knees(P, (0.4 + 1.4 * (1 - b)) * on); P.pos('body', 0, 0.3 * b * on, 0).rot('body', 0, side * 10 * on, side * 3 * on);
      P.rot(side > 0 ? 'thighR' : 'thighL', -20 * b * on, 0, 0).rot(side > 0 ? 'footR' : 'footL', 20 * b * on, 0, 0);
      P.rot('armR', (side > 0 ? -120 : -30) * on, 0, -10 * on).rot('foreR', -40 * on, 0, 0).rot('armL', (side < 0 ? -120 : -30) * on, 0, 10 * on).rot('foreL', -40 * on, 0, 0);
      P.rot('head', 8 * (1 - b) * on, side * 8 * on, 0);
      const spin = seg(t, 2.0, 2.4, E.inout), fin = seg(t, 2.35, 2.55, E.back) * (1 - seg(t, 2.85, 3.0));
      P.rot('root', 0, 360 * spin, 0).pos('root', 0, bump(t, 2.0, 2.4) * 2.2, 0);
      P.rot('armR', -100 * fin, 0, 30 * fin).rot('foreR', -60 * fin, 0, 50 * fin).rot('armL', -100 * fin, 0, -30 * fin).rot('foreL', -60 * fin, 0, -50 * fin).rot('collarR', -30 * fin, 0, 18 * fin).rot('collarL', -30 * fin, 0, -18 * fin).rot('head', -10 * fin, 10 * fin, 0);
      face(P, t < 2.0 ? (b > 0.5 ? 'happy' : 'open') : fin > 0.3 ? 'smug' : 'shut', t < 2.0 ? 'grin' : 'smile');
      if (t > 0.1 && t < 2.0) P.stream('bear-note', 'head', [0, 40, 2], { rate: 3, spread: 1 });
      P.burst(2.45, 'sparkle', 'body', [0, 30, 4], { n: 10, speed: 1.2 }).burst(2.45, 'bear-heart', 'body', [0, 30, 4], { n: 3 }).burst(2.4, 'dust', 'root', [0, 0.5, 1], { n: 5 });
    } },
    // the signature: a look left, a look right… both paws to the collar — POP — then a smooth hand over its waves
    // and a wink
    pop: { len: 3.0, next: 'idle', f(P, t) {
      const lookL = bump(t, 0.1, 0.55), lookR = bump(t, 0.5, 0.95), reach = seg(t, 0.95, 1.2, E.inout) * (1 - seg(t, 1.6, 1.85, E.inout)), pop = seg(t, 1.25, 1.35, E.out) * (1 - seg(t, 2.6, 3.0, E.inout));
      const smooth = bump(t, 1.85, 2.5);
      P.rot('head', 0, 30 * lookL - 30 * lookR, 0);
      P.rot('armR', -100 * reach, 0, 30 * reach).rot('foreR', -60 * reach, 0, 50 * reach).rot('armL', -100 * reach, 0, -30 * reach).rot('foreL', -60 * reach, 0, -50 * reach);
      P.rot('collarR', -34 * pop, 0, 20 * pop).rot('collarL', -34 * pop, 0, -20 * pop).sq('body', 0.05 * bump(t, 1.25, 1.5)).rot('body', -4 * pop, 0, 0);
      P.rot('armR', -150 * smooth, 0, -20 * smooth).rot('foreR', -60 * smooth, 0, 0).rot('head', -8 * pop + 6 * smooth, 0, -6 * smooth);
      eyesAt(P, 0.4 * lookL - 0.4 * lookR, 0);
      face(P, lookL + lookR > 0.3 ? 'smug' : pop > 0.3 && t < 2.4 ? 'glint' : t >= 2.4 && t < 2.8 ? 'wink' : undefined, pop > 0.3 ? 'grin' : 'smile');
      P.burst(1.3, 'sparkle', 'body', [0, 31, 3], { n: 12, speed: 1.4 }).burst(1.3, 'bear-heart', 'body', [0, 31, 3], { n: 4, speed: 0.8 }).burst(2.1, 'sparkle', 'head', [0, 39, 2], { n: 5, speed: 0.5 });
    } },
    // fidget: a protector's scan — it shades its eyes with a paw and looks out over the horizon, left to right
    scan: { len: 2.6, next: 'idle', f(P, t) {
      const up = seg(t, 0.1, 0.4, E.inout) * (1 - seg(t, 2.1, 2.5, E.inout)), pan = key([[0, 0], [0.5, 0], [1.2, -1], [2.0, 1], [2.5, 0]], t);
      guard(P, 1 - up); P.rot('armR', -150 * up, 0, 20 * up).rot('foreR', -60 * up, 0, 40 * up).rot('head', -6 * up, 30 * pan * up, 0).rot('body', -2 * up, 10 * pan * up, 0);
      eyesAt(P, 0.4 * pan * up, 0.1 * up); face(P, up > 0.5 ? 'smug' : undefined, 'flat');
    } },
  },
};
def.anim = anim;
