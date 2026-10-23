// Gradcub — stage 1 of the bear line (Echo). The dropout who graduated anyway: a fluffy plush cub
// with chocolate fur painted in clumps (caramel tips, fuzz round every silhouette), a fresh caesar
// with 360 waves and a crisp line-up, amber glass teddy eyes, and a violet varsity knit with a big
// letter-free crest, striped ribbing and sleeves bursting with pink daisies, yellow stars and cyan
// dots. Cocky and warm: it nods to every beat, two-steps, dozes off in class, and tears up its own
// diploma. Drip: shutter shades or a mortarboard; a gold bear-piece chain or a teddy backpack; big
// kicks or a gold mic. An original plush that winks at a rapper's college albums — never their mascot.
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { fur, fringe, halo, gold, GOLD, chain, shutter, sneaker, piece, waves, rib, luxe, fill, wrapX, isSide, edgeLine, sh } from './bear_parts.js';
import { eyeRig, eyesAt, eyesScale, glance, mouthArt, keepEyes } from './eyes.js';
import { blackGold } from '../model.js';
import { poly, ramp, shift, h2 } from './kit.js';

const C = {
  fur: '#8a5634', furHi: '#b27a4a', furLo: '#5c3820', furLine: '#3a2012', furEdge: '#4c2c16', furTip: '#d39a5e', furLite: '#a26a40',
  hair: '#2e1a10', hairHi: '#5a3a24',
  muz: '#f0d2a0', muzHi: '#fff0c8', muzLo: '#c89e6c', muzLine: '#6a4026',
  nose: '#2a1810', noseHi: '#5e3e30', noseSpec: '#c8aca0',
  inEar: '#e8a0b8', inEarLo: '#c87898', inEarDeep: '#a05878',
  vio: '#5c2ca0', vioHi: '#7c4cc4', vioLo: '#3e1c72', vioEdge: '#2c1256', vioTip: '#9a6ad8', vioLite: '#6e3eb6',
  pink: '#ff4aa8', pinkHi: '#ffa0d2', pinkLo: '#c41e76',
  yel: '#ffd23e', yelHi: '#fff4a0', yelLo: '#e0961a',
  cyan: '#2ed0e8', cyanHi: '#b0f6ff', cyanLo: '#1a86b4',
  white: '#fff6fa', pad: '#e8b890', padLo: '#c08a64',
  shade: '#ff3a9a', shadeHi: '#ffa6d4', shadeLo: '#b8186a', lensGap: '#2a0c28',
  cap: '#2c2744', capHi: '#4e4870', capLo: '#17131f', capSheen: '#6a6290',
  bag: '#f2a8c4', bagHi: '#ffd0e0', bagLo: '#c87898', bagLine: '#8a4a68',
  knit: '#5a2a9e', knitHi: '#7a4ac2', knitLo: '#3c1a70', crest: '#fff0c8', crestLo: '#e8c880',
  paper: '#fff8e6', paperLo: '#e6d8b8', seal: '#d8203a',
  ink: '#1e120c',
};

// ---------------------------------------------------------------- painters
const furP = (seed, o = {}) => fur(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furEdge, tip: C.furTip, lite: C.furLite, s: 10, pt: 0.6, seed, ...o });
const headFur = furP(11), headFur2 = furP(23, { s: 9 }), legFur = furP(31, { s: 8 });
const fuzz = (seed, o = {}) => fringe(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furLine, tip: C.furTip, seed, ...o });
const headHalo = halo(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furLine, tip: C.furTip, n: 26, depth: 0.16, inner: 0.76, sq: 2.7, seed: 4 });
const earHalo = halo(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furLine, tip: C.furTip, n: 14, depth: 0.2, inner: 0.6, sq: 2.2, seed: 8 });
const cheekFringe = fuzz(73, { tw: 3.6, lean: 0.12 });
const hairP = waves(C.hair, { hi: C.hairHi });

// the Graduation pattern, grown into the fur: pink daisies, yellow four-point stars, cyan dot pairs
function motif(put, type) {
  if (type < 2) {
    const R = type === 0 ? 3.6 : 2.6;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), pet = R * (0.62 + 0.38 * Math.abs(Math.cos(a * 2.5 + 0.3)));
      if (r > pet + 0.35) continue;
      put(dx, dy, r < R * 0.36 ? (dx + dy < 0 ? C.yelHi : C.yel) : r < R * 0.5 ? C.yelLo : r > pet - 0.75 ? C.pinkLo : dx + dy < 0 ? C.pinkHi : C.pink);
    }
  } else if (type === 2) {
    for (let i = -3; i <= 3; i++) { const c = Math.abs(i) < 1 ? C.white : Math.abs(i) < 3 ? C.yel : C.yelLo; put(i, 0, c); put(0, i, c); }
    put(-1, -1, C.yelHi); put(1, 1, C.yelLo); put(1, -1, C.yel); put(-1, 1, C.yel);
  } else { put(0, 0, C.cyan); put(1, 0, C.cyanLo); put(0, -1, C.cyanHi); put(3, 2, C.cyan); put(3, 1, C.cyanHi); }
}
const gradPattern = (seed, cell = 8) => (face, cube, w, h) => {
  if (face === 'down') return null;
  const m = new Map(), ox = cube && isSide(face) ? wrapX(face, cube) : 0;
  const i0 = Math.floor((ox - 8) / cell), i1 = Math.ceil((ox + w + 8) / cell);
  for (let j = -1; j * cell < h + cell; j++) for (let i = i0; i <= i1; i++) {
    const X = i * cell + ((j & 1) ? cell / 2 : 0) + Math.round((h2(i, j, seed) - 0.5) * 3), Y = j * cell + 3 + Math.round((h2(j, i, seed) - 0.5) * 3);
    const r = h2(i, j, seed + 1), type = face === 'up' ? (r < 0.5 ? 3 : 2) : r < 0.34 ? 0 : r < 0.56 ? 1 : r < 0.8 ? 2 : 3;
    motif((dx, dy, c) => { const x = X + dx - ox, y = Y + dy; if (x >= 0 && x < w && y >= 0 && y < h) m.set(y * w + x, c); }, type);
  }
  return (x, y) => { const c = m.get(y * w + x); if (!c) return null; const t = h > 1 ? y / (h - 1) : 0.5; return t > 0.8 ? sh(c, -0.12) : t < 0.12 ? sh(c, 0.06) : c; };
};
// the varsity knit: violet in vertical ribs; the sleeves carry the colour explosion and two stripes
const knitBase = (x, y, h, face) => { const c = face === 'up' ? C.knitHi : face === 'down' ? C.knitLo : ramp([C.knitHi, C.knit, C.knit, C.knitLo], h > 1 ? y / (h - 1) : 0.5, x, y); return x % 2 && face !== 'up' ? sh(c, -0.07) : c; };
const knit = (o = {}) => (p, w, h, face, cube) => {
  fill(p, w, h, (x, y) => knitBase(x, y, h, face));
  if (face === 'down') return;
  if (o.pattern) { const U = gradPattern(o.seed || 3, o.cell || 7)(face, cube, w, h); if (U) fill(p, w, h, (x, y) => U(x, y)); }
  if (o.stripes && isSide(face)) for (const [yy, c] of [[h - 3, C.yel], [h - 5, C.pink]]) for (let x = 0; x < w; x++) p.px(x, yy, x % 2 ? sh(c, -0.12) : c);
  if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, 0, sh(C.knitHi, 0.1));
};
// the crest: a cream shield with a pink border, a bear head and a star — no letters
const crestP = (p, w, h, face, cube) => {
  knit()(p, w, h, face, cube);
  if (face !== 'south') return;
  const cx = (w - 1) / 2, y0 = Math.round(h * 0.1), y1 = Math.round(h * 0.92), hw = w * 0.27;
  const inShield = (x, y, k = 0) => { if (y < y0 + k || y > y1 - k) return false; const t = (y - y0) / (y1 - y0), half = (t < 0.55 ? hw : hw * Math.sqrt(Math.max(0, 1 - ((t - 0.55) / 0.45) ** 2))) - k; return Math.abs(x - cx) <= half; };
  fill(p, w, h, (x, y) => (inShield(x, y) ? (inShield(x, y, 2) ? (y < h * 0.5 ? C.crest : C.crestLo) : x < cx ? C.pinkHi : C.pink) : null));
  const by = h * 0.4;
  fill(p, w, h, (x, y) => { const head = Math.hypot(x - cx, (y - by) * 1.1) < hw * 0.42, ear = Math.hypot(x - cx + hw * 0.36, y - by + hw * 0.36) < hw * 0.17 || Math.hypot(x - cx - hw * 0.36, y - by + hw * 0.36) < hw * 0.17; return head || ear ? (x + y < cx + by ? C.furHi : C.fur) : null; });
  p.px(Math.round(cx - 1), Math.round(by), C.ink).px(Math.round(cx + 1), Math.round(by), C.ink).px(Math.round(cx), Math.round(by + 1.5), C.ink);
  const sy = Math.round(h * 0.72); for (let i = -2; i <= 2; i++) { p.px(Math.round(cx) + i, sy, C.yel); p.px(Math.round(cx), sy + i, C.yel); } p.px(Math.round(cx), sy, '#ffffff');
};
const bodyKnit = knit(), sleeveKnit = knit({ pattern: true, stripes: true, seed: 7, cell: 7 });
const ribHem = rib(C.pink, null, { stripes: [C.yel, C.pink, C.pink, C.yel] }), ribCuff = rib(C.pink, null, { stripes: [C.yel, C.pink, C.yel] }), ribCollar = rib(C.yel, null, { stripes: [C.pink, C.yel] });
const muzP = fur(C.muz, { hi: C.muzHi, lo: C.muzLo, line: shift(C.muz, -0.12), lite: C.muzHi, ramp: [C.muzHi, C.muz, C.muz, shift(C.muz, -0.06)], s: 8, rowH: 6, tipH: 2.5, seed: 5, y0: 2 });
const noseP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? C.noseHi : face === 'down' ? '#140a06' : y === 0 ? C.noseHi : y >= h - 1 ? '#140a06' : C.nose));
  if (face === 'south') { p.px(1, 1, C.noseSpec); p.px(2, 1, C.noseSpec); p.px(1, 2, C.noseHi); }
};
const earP = (seed) => { const f = furP(seed, { s: 7 }); return (p, w, h, face, cube) => {
  f(p, w, h, face, cube);
  if (face !== 'south') return;
  const cx = w / 2, cy = h / 2 + 0.3, rx = w / 2 - 2.2, ry = h / 2 - 2.2;
  fill(p, w, h, (x, y) => { const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2; return d < 1 ? (d < 0.35 ? C.inEarDeep : d < 0.7 ? C.inEarLo : C.inEar) : null; });
}; };
const footP = (seed) => { const f = furP(seed, { s: 7, tipH: 3 }); return (p, w, h, face, cube) => { f(p, w, h, face, cube); if (face === 'south') for (const fx of [0.33, 0.67]) { const x = Math.round(w * fx); for (let y = Math.floor(h * 0.3); y < h; y++) p.px(x, y, C.furLine); } }; };
const soleP = (p, w, h) => {
  fill(p, w, h, () => C.furLo);
  const cx = w / 2, cy = h * 0.58;
  fill(p, w, h, (x, y) => { const d = ((x + 0.5 - cx) / (w * 0.4)) ** 2 + ((y + 0.5 - cy) / (h * 0.36)) ** 2; return d < 1 ? C.pad : null; });
  for (const fx of [0.25, 0.5, 0.75]) { const x = Math.round(w * fx - 0.5); p.rect(x, 1, 2, 2, C.pad); }
};
const pawP = (seed) => { const f = furP(seed, { s: 7, tipH: 3 }); return (p, w, h, face, cube) => { f(p, w, h, face, cube); if (face === 'down') fill(p, w, h, (x, y) => (x > 0 && x < w - 1 && y > 0 && y < h - 1 ? C.pad : null)); }; };

// ---- drip
const goldP = gold();
const lens = shutter({ frame: C.shade, hi: C.shadeHi, lo: C.shadeLo, gap: C.lensGap, gapLo: '#4a1a40', bar: 2, round: 4, bridge: 1.5,
  gapFn: (lx, y, L, row) => { const d = lx + y * 1.4 - (L ? 4 : 10); return row > 0 && d > 0 && d < 2.5 ? '#7a3a6a' : null; } });
const barP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? C.shadeHi : face === 'down' ? C.shadeLo : y === 0 ? C.shadeHi : y === h - 1 ? C.shadeLo : C.shade)); if (face === 'south') { p.px(2, 0, '#ffffff'); p.px(3, 0, '#ffffff'); } };
const boardP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? ((x + y) % 3 === 0 ? C.cap : C.capHi) : face === 'down' ? C.capLo : y === 0 ? C.capSheen : C.cap));
  if (face === 'up') for (let i = 0; i < w; i++) { p.px(i, 0, C.capSheen); p.px(i, h - 1, C.capSheen); p.px(0, i, C.capSheen); p.px(w - 1, i, C.capSheen); }
};
const capP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? C.capHi : ramp([C.capHi, C.cap, C.cap, C.capLo], h > 1 ? y / (h - 1) : 0.5, x, y))); if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, h - 1, '#0a0810'); };
const tasselP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? GOLD.hi : x % 2 ? GOLD.base : y < 2 ? GOLD.spec : GOLD.hi)); };
const pieceP = piece({ gem: C.pink });
// the teddy backpack: a pink plush bear on its back — ears, button eyes, a stitched muzzle
const bagP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? C.bagHi : face === 'down' ? C.bagLo : ramp([C.bagHi, C.bag, C.bag, C.bagLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (!isSide(face)) return;
  for (let x = 0; x < w; x++) if (x % 2) p.px(x, h - 1, C.bagLine);
  if (face !== 'north') return;
  const cx = (w - 1) / 2, ey = Math.round(h * 0.38);
  p.rect(Math.round(cx - 4), ey, 2, 2, C.ink).rect(Math.round(cx + 3), ey, 2, 2, C.ink); p.px(Math.round(cx - 4), ey, '#ffffff'); p.px(Math.round(cx + 3), ey, '#ffffff');
  fill(p, w, h, (x, y) => (((x - cx) / 3.4) ** 2 + ((y - h * 0.62) / 2.2) ** 2 < 1 ? C.white : null));
  p.rect(Math.round(cx - 1), Math.round(h * 0.55), 3, 2, C.ink); p.px(Math.round(cx), Math.round(h * 0.55) + 2, C.ink);
};
const bagStrap = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? C.bagHi : x === 0 ? C.bagHi : x === w - 1 ? C.bagLine : C.bagLo));
const kicks = sneaker({ up: '#f4f2f6', upHi: '#ffffff', upLo: '#c8c4d4', panel: C.pink, sole: '#8a5ad8', soleLo: '#5a2ca0', lace: '#ffd23e' });
const micHead = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? '#f0f0f8' : (x + y) % 2 ? '#a8a8b8' : y === 0 ? '#ffffff' : '#d8d8e4'));
const micBody = (p, w, h, face) => { gold()(p, w, h, face); if (isSide(face)) for (let y = 2; y < h; y += 3) p.px(Math.floor(w / 2), y, GOLD.deep); };

// the prop for the 'dropout' fidget: a diploma — rolled, unrolled (a seal and scrawl, no words), crumpled
const rollP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' || face === 'down' ? (Math.hypot(x - w / 2 + 0.5, y - h / 2 + 0.5) < 1 ? C.paperLo : C.paper) : y === Math.floor(h / 2) || y === Math.floor(h / 2) - 1 ? C.seal : ramp([C.paper, C.paper, C.paperLo], x / Math.max(1, w - 1), x, y))); };
const paperP = (p, w, h) => {
  fill(p, w, h, (x, y) => (x === 0 || x === w - 1 ? C.paperLo : y === 0 || y === h - 1 ? C.paperLo : C.paper));
  for (let y = 2; y < h - 4; y += 2) for (let x = 2; x < w - 2; x++) if ((x * 7 + y * 3) % 5) p.px(x, y, '#b8a888');
  const cx = w - 4, cy = h - 3; fill(p, w, h, (x, y) => (Math.hypot(x - cx, y - cy) < 2.2 ? C.seal : null)); p.px(cx, cy + 3, C.seal).px(cx - 1, cy + 3, C.seal);
};
const ballP = (p, w, h, face) => fill(p, w, h, (x, y) => ((x * 3 + y * 5) % 4 === 0 ? C.paperLo : (x + y) % 3 === 0 ? '#ffffff' : C.paper));

// ---------------------------------------------------------------- face
// eyes: amber teddy glass eyes, round with a big black pupil and one hot glint (hand-pixelled, low-res)
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-2.6, 17.6, 5.44], line: '#2a1408', iris: '#f0a838', irisDark: '#a85e10', accent: '#ffd890', extra: ['smug', 'glint'], map: { open: [
  '............',
  '.llllllllll.',
  'llllllllllll',
  '.IIIIIIIIII.',
  '.IhhIkkkIII.',
  '.ihhikkkkii.',
  '.iiikkkkiii.',
  '.iiiikkiiii.',
  '..iiiiiiii..',
  '............',
] } });
// mouths on the muzzle (full resolution): a one-sided smirk by default
const smirk = (p, w, h) => { const L = C.muzLine, cx = Math.floor(w / 2), y = h - 3; p.px(cx, 0, L).px(cx, 1, L).px(cx, 2, L); for (let x = 1; x < w - 3; x++) p.px(x, y, L); p.px(0, y - 1, L); p.px(w - 3, y - 1, L).px(w - 2, y - 2, L).px(w - 1, y - 3, L); for (let x = cx - 2; x <= cx + 1; x++) p.px(x, y + 1, sh(C.muz, -0.14)); };
const MOUTHS = ['smirk', 'grin', 'o', 'frown', 'grit', 'flat', 'wavy', 'tongue'];
const mouthTex = (s) => (s === 'smirk' ? smirk : mouthArt(s, { chunk: 1, line: C.muzLine, inner: '#4a1420', tongue: '#e86a7a' }));

// ---------------------------------------------------------------- the model
const B = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const A = (id, c) => ({ ...c, id, hide: true });
const CHAIN = chain([[-3.3, 10.9, 3.4], [-3.05, 9.7, 4.55], [-2.0, 8.4, 4.72], [0, 7.85, 4.78], [2.0, 8.4, 4.72], [3.05, 9.7, 4.55], [3.3, 10.9, 3.4]], { len: 1.25, w: 0.85, t: 0.4, step: 0.9 }).map((c) => A('acc-chain', c));
const KICK = (x0, m) => [A('acc-kicks', B([x0 - 0.35, 0, -2.4], [4.9, 2.3, 5.9], kicks, { mirror: m })), A('acc-kicks', B([x0, 2.2, -2.0], [4.2, 1.0, 4.0], kicks, { mirror: m }))];
export const def = {
  name: 'gradcub', ppu: 3, scale: 0.42, outline: { color: '#1e120c', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'legR', parent: 'root', pivot: [-2.7, 4.4, 0.2], cubes: [B([-4.6, 1.3, -1.6], [3.8, 3.5, 3.6], legFur), B([-4.8, 0, -2.0], [4.2, 1.7, 5.0], footP(41), { faces: { down: soleP } }), ...KICK(-4.8, false)] },
    { name: 'legL', parent: 'root', pivot: [2.7, 4.4, 0.2], cubes: [B([0.8, 1.3, -1.6], [3.8, 3.5, 3.6], legFur, { mirror: true }), B([0.6, 0, -2.0], [4.2, 1.7, 5.0], footP(43), { faces: { down: soleP }, mirror: true }), ...KICK(0.6, true)] },
    // the body: the varsity knit with its crest; ribbed, striped hem and collar
    { name: 'body', parent: 'root', pivot: [0, 7.2, 0], cubes: [
      B([-5.2, 3.6, -4.0], [10.4, 7.6, 8.0], bodyKnit),
      B([-5.8, 4.4, -3.6], [11.6, 5.8, 7.2], bodyKnit),
      B([-4.6, 4.0, -4.5], [9.2, 6.8, 9.0], bodyKnit, { faces: { south: crestP } }),
      B([-5.5, 3.1, -4.3], [11.0, 1.2, 8.6], ribHem),
      B([-3.9, 10.9, -3.3], [7.8, 0.9, 6.6], ribCollar),
      // the teddy backpack straps (front)
      A('acc-pack', B([-4.3, 5.0, 4.42], [1.0, 5.8, 0.4], bagStrap)), A('acc-pack', B([3.3, 5.0, 4.42], [1.0, 5.8, 0.4], bagStrap)),
    ] },
    { name: 'chain', parent: 'body', pivot: [0, 10.9, 3.6], cubes: CHAIN },
    { name: 'medal', parent: 'chain', pivot: [0, 7.7, 4.85], cubes: [
      A('acc-chain', B([-0.4, 7.2, 4.6], [0.8, 0.7, 0.45], goldP)),
      A('acc-chain', B([-1.5, 4.2, 4.55], [3.0, 3.0, 0.45], goldP)),
      A('acc-chain', B([-1.8, 3.9, 5.02], [3.6, 3.6, 0], pieceP, { plane: 'z' })),
    ] },
    { name: 'pack', parent: 'body', pivot: [0, 10.4, -4.5], cubes: [
      A('acc-pack', B([-3.7, 4.2, -7.8], [7.4, 6.6, 3.2], bagP)),
      A('acc-pack', B([-3.9, 10.2, -6.9], [2.2, 2.2, 1.3], bagP)), A('acc-pack', B([1.7, 10.2, -6.9], [2.2, 2.2, 1.3], bagP)),
      A('acc-pack', B([-4.3, 4.8, -5.0], [0.5, 5.6, 1.0], bagStrap)), A('acc-pack', B([3.8, 4.8, -5.0], [0.5, 5.6, 1.0], bagStrap)),
    ] },
    { name: 'armR', parent: 'body', pivot: [-5.5, 10.2, 0.2], rot: [0, 0, -8], cubes: [
      B([-8.5, 6.0, -1.6], [3.2, 4.9, 3.4], sleeveKnit), B([-8.65, 5.0, -1.75], [3.5, 1.1, 3.7], ribCuff), B([-8.35, 3.2, -1.45], [2.9, 2.0, 3.1], pawP(51)),
      // the gold mic, held low in the right paw
      A('acc-mic', B([-7.35, 2.2, 1.3], [0.9, 4.0, 0.9], micBody)), A('acc-mic', B([-7.8, 6.1, 0.85], [1.8, 1.9, 1.8], micHead)),
    ] },
    { name: 'armL', parent: 'body', pivot: [5.5, 10.2, 0.2], rot: [0, 0, 8], cubes: [B([5.3, 6.0, -1.6], [3.2, 4.9, 3.4], sleeveKnit), B([5.15, 5.0, -1.75], [3.5, 1.1, 3.7], ribCuff), B([5.45, 3.2, -1.45], [2.9, 2.0, 3.1], pawP(53), { mirror: true })] },
    // the diploma prop, held in the right paw for the 'dropout' fidget
    { name: 'prop', parent: 'armR', pivot: [-6.9, 3.6, 1.2], cubes: [
      B([-9.6, 3.0, 0.6], [5.4, 1.2, 1.2], rollP, { id: 'p-roll', hide: true }),
      B([-11.4, 3.4, 1.9], [4.6, 5.4, 0], paperP, { plane: 'z', id: 'p-paper', hide: true }),
      B([-7.6, 3.0, 0.5], [1.6, 1.5, 1.5], ballP, { id: 'p-ball', hide: true }),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 11.2, 0.4], cubes: [
      B([-6.3, 11.2, -4.6], [12.6, 9.6, 9.2], headFur),
      B([-6.9, 12.4, -3.8], [13.8, 6.4, 7.6], headFur2),
      B([-5.0, 10.3, -4.0], [10, 11.2, 8.0], headFur),
      B([-5.1, 11.6, -5.4], [10.2, 8.8, 10.8], headFur2),
      B([-5.5, 20.4, -5.0], [11.0, 1.6, 10.1], hairP),
      B([-8.1, 9.3, 0.3], [16.2, 13.6, 0], headHalo, { plane: 'z' }),
      B([0.2, 9.3, -6.9], [0, 13.6, 13.4], headHalo, { plane: 'x' }),
      B([-2.9, 11.5, 5.0], [5.8, 3.7, 2.5], muzP),
      B([-2.4, 15.0, 5.0], [4.8, 0.6, 2.0], muzP),
      B([-2.3, 10.6, 5.0], [4.6, 1.5, 2.3], muzP),
      B([-1.45, 14.55, 7.0], [2.9, 1.15, 1.2], noseP),
      B([-0.85, 13.85, 6.95], [1.7, 0.8, 1.1], noseP),
      ...MOUTHS.map((s) => B([-2.2, 11.65, 7.53], [4.4, 2.0, 0], mouthTex(s), { plane: 'z', id: 'm-' + s, hide: s !== 'smirk', outline: false })),
      B([-6.6, 10.2, 4.75], [3.6, 1.5, 0], cheekFringe, { plane: 'z' }),
      B([3.0, 10.2, 4.75], [3.6, 1.5, 0], cheekFringe, { plane: 'z', mirror: true }),
    ] },
    ...EYES.bones,
    // drip: hot-pink shutter shades
    { name: 'shades', parent: 'head', pivot: [0, 18.2, 5.6], cubes: [
      A('acc-shades', B([-5.6, 18.9, 5.3], [11.2, 0.7, 0.55], barP)),
      A('acc-shades', B([-5.6, 15.8, 5.74], [11.2, 3.6, 0], lens, { plane: 'z' })),
      A('acc-shades', B([-6.95, 18.95, -0.4], [0.45, 0.5, 6.0], barP)), A('acc-shades', B([6.5, 18.95, -0.4], [0.45, 0.5, 6.0], barP)),
      A('acc-shades', B([-6.95, 18.95, 5.3], [1.4, 0.5, 0.45], barP)), A('acc-shades', B([5.55, 18.95, 5.3], [1.4, 0.5, 0.45], barP)),
    ] },
    // drip (or): a mortarboard cocked back, its tassel swinging
    { name: 'cap', parent: 'head', pivot: [0, 21.8, 0], rot: [-7, 0, 6], cubes: [
      A('acc-cap', B([-5.8, 20.9, -5.3], [11.6, 1.9, 10.6], capP)),
      A('acc-cap', B([-6.6, 22.8, -6.6], [13.2, 0.75, 13.2], boardP)),
      A('acc-cap', B([-0.6, 23.55, -0.6], [1.2, 0.45, 1.2], goldP)),
      A('acc-cap', B([-8.9, 23.56, -0.15], [8.9, 0.22, 0.3], goldP, { pivot: [0, 23.65, 0], rot: [0, 45, 0] })),
    ] },
    { name: 'tassel', parent: 'cap', pivot: [-6.35, 23.6, 6.35], rot: [7, 0, -6], cubes: [
      A('acc-cap', B([-6.5, 21.4, 6.2], [0.3, 2.2, 0.3], goldP)),
      A('acc-cap', B([-6.7, 20.75, 6.0], [0.7, 0.7, 0.7], goldP)),
      A('acc-cap', B([-6.85, 18.4, 5.85], [1.0, 2.4, 1.0], tasselP)),
    ] },
    // round teddy ears up on the crown's corners
    { name: 'earR', parent: 'head', pivot: [-5.0, 20.2, -0.6], rot: [0, 0, 16], cubes: [
      B([-8.4, 19.6, -1.4], [5.0, 3.4, 1.7], earP(61)), B([-7.75, 18.9, -1.4], [3.7, 4.8, 1.7], earP(62)),
      B([-8.8, 18.55, -0.55], [5.9, 5.5, 0], earHalo, { plane: 'z' }),
    ] },
    { name: 'earL', parent: 'head', pivot: [5.0, 20.2, -0.6], rot: [0, 0, -16], cubes: [
      B([3.4, 19.6, -1.4], [5.0, 3.4, 1.7], earP(63), { mirror: true }), B([4.05, 18.9, -1.4], [3.7, 4.8, 1.7], earP(64), { mirror: true }),
      B([2.9, 18.55, -0.55], [5.9, 5.5, 0], earHalo, { plane: 'z', mirror: true }),
    ] },
  ],
};
// appearance tiers: normal wears one of the first list, dripped adds the second, ultra dripped the third
def.drip = [
  [{ id: 'acc-shades', name: 'Shutter shades' }, { id: 'acc-cap', name: 'Mortarboard' }],
  [{ id: 'acc-chain', name: 'Bear-piece chain' }, { id: 'acc-pack', name: 'Teddy backpack' }],
  [{ id: 'acc-kicks', name: 'Big kicks' }, { id: 'acc-mic', name: 'Gold mic' }],
];
// the ultra-drip form: black lacquer and gold, but the amber glass eyes stay amber
def.dripForm = { map: keepEyes(EYES, luxe(blackGold)) };
// where bought gear sits (model units): the crown, between the eyes, the front of the neck, the middle of the back
def.attach = {
  head: { bone: 'head', at: [0, 22.0, 0], size: 11 },
  face: { bone: 'head', at: [0, 17.6, 5.6], size: 10.2 },
  neck: { bone: 'body', at: [0, 10.8, 4.4], size: 7.8 },
  back: { bone: 'body', at: [0, 7.4, -4.5], size: 9.2 },
};

// ---------------------------------------------------------------- animation
const TAU = Math.PI * 2;
const FUR_TINT = [0.62, 0.42, 0.28], VIO_TINT = [0.5, 0.32, 0.8];
const groove = (ph) => (ph < 0.14 ? E.out(ph / 0.14) : 1 - E.inout(Math.min(1, (ph - 0.14) / 0.62)));
function air(P, y) { P.pos('root', 0, Math.max(0, y), 0); }
// arms: z out (+ = away from the body), x forward (− = forward/up)
function arms(P, rz, rx, lz = rz, lx = rx) { P.rot('armR', rx, 0, -rz).rot('armL', lx, 0, lz); }
const face = (P, e, m) => { if (e) P.face('eyes', e); if (m) P.face('mouth', m); if (e) P.blinkOK = false; return P; };
export const anim = {
  start: 'idle', seed: 21,
  breathe: { bone: 'body', amp: 0.018, per: 2.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.4, 5.0], dur: 0.12 },
  look: { bone: 'head', yaw: 30, pitch: 14, speed: 5 },
  springs: [
    { bone: 'tassel', tip: [0, -5.2, 0], k: 85, d: 5, gain: 1.3, max: 46 },
    { bone: 'chain', tip: [0, -3.2, 1.2], k: 130, d: 7, gain: 0.8, max: 16, axes: [1, 0.3, 1] },
    { bone: 'medal', tip: [0, -2.8, 0.2], k: 110, d: 5, gain: 1.0, max: 24, axes: [1, 0.2, 1] },
    { bone: 'pack', tip: [0, -3.5, -2.5], k: 190, d: 10, gain: 0.45, max: 9, axes: [1, 0.3, 1] },
    { bone: 'earR', tip: [-1.2, 2.2, 0], k: 240, d: 10, gain: 0.6, max: 14 },
    { bone: 'earL', tip: [1.2, 2.2, 0], k: 240, d: 10, gain: 0.6, max: 14 },
  ],
  faces: { eyes: EYES.slot, mouth: { default: 'smirk', states: Object.fromEntries(MOUTHS.map((s) => [s, ['m-' + s]])) }, prop: { default: 'off', states: { off: [], roll: ['p-roll'], paper: ['p-paper'], ball: ['p-ball'] } } },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'dropout', 'shades', 'polish', 'shake'] },
  clips: {
    // a laid-back head-nod groove over four beats, eyes flicking about; on the fourth it leans back, smug
    idle: { len: 3.2, loop: true, f(P, t) {
      const per = 0.8, ph = (t % per) / per, g = groove(ph), gh = groove(((t - 0.07) % per + per) % per / per);
      const sway = wave(t, 1 / 1.6), sway2 = wave(t, 1 / 1.6, 1.2), lean = bump(t, 2.35, 3.2) ** 0.7;
      P.pos('body', 0, -0.6 * g, 0).sq('body', -0.05 * g + 0.012 * (1 - g)).rot('body', 1.5 * g - 5 * lean, sway2 * 4 + 6 * lean, sway * 2.4);
      P.rot('head', 8 * gh - 2 - 7 * lean, -sway2 * 3 - 4 * lean, -sway * 2.5 + 3 * lean);
      arms(P, 3 + 5 * gh + sway * 2 + 4 * lean, -3 + sway * 6 + 8 * lean, 3 + 5 * gh - sway * 2 + 4 * lean, -3 - sway * 6 + 8 * lean);
      P.rot('legR', 0, -4 * lean, 0).rot('legL', 0, 4 * lean, 0);
      const [gx, gy] = glance(t, [[0, 0], [-0.35, 0], [0, 0], [0.35, 0.1]], 0.8);
      eyesAt(P, gx, gy); eyesScale(P, 1, 1 - 0.12 * g);
      if (lean > 0.3) face(P, 'smug');
      if (t > 1.2 && t < 1.5) P.face('mouth', 'flat');
    } },
    // a swaggering strut: bounce on every step, shoulders roll, arms swing loose
    walk: { len: 0.72, loop: true, f(P, t) {
      const ph = (t / 0.72) * TAU, s = Math.sin(ph), c = Math.cos(ph), up = (Math.cos(2 * ph) + 1) / 2;
      P.pos('body', 0, 0.75 * up - 0.3, 0).rot('body', 4, s * 6, s * 4).sq('body', -0.04 * (1 - up) + 0.02 * up);
      P.rot('legR', -s * 26, 0, 0).pos('legR', 0, Math.max(0, c) * 1.1, 0).rot('legL', s * 26, 0, 0).pos('legL', 0, Math.max(0, -c) * 1.1, 0);
      arms(P, 6 + Math.abs(s) * 4, s * 24, 6 + Math.abs(s) * 4, -s * 24);
      P.rot('head', -4 + up * 5, -s * 5, -s * 4); eyesScale(P, 1, 1 + 0.06 * up);
    } },
    // the hype: crouch, spring up with both arms thrown high, land, pump the fists and shout
    cry: { len: 2.1, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.32, E.inout) * (1 - seg(t, 0.32, 0.42, E.out));
      const h = t < 0.38 ? 0 : t < 0.9 ? Math.sin(((t - 0.38) / 0.52) * Math.PI) * 4.2 : 0;
      const land = t > 0.9 ? wob(t, 0.9, -0.16, 2.6, 6) : 0;
      const up = seg(t, 0.34, 0.5, E.back) * (1 - seg(t, 1.7, 2.05, E.inout));
      const pump = t > 0.95 && t < 1.7 ? Math.abs(Math.sin((t - 0.95) * Math.PI * 2.7)) : 0;
      air(P, h); P.pos('body', 0, -1.4 * crouch + (t > 0.9 ? Math.min(0, land * 6) : 0), 0).sq('body', -0.16 * crouch + 0.13 * (t > 0.36 && t < 0.62 ? 1 - seg(t, 0.5, 0.62) : 0) + land);
      arms(P, 12 * crouch + 118 * up - 22 * pump, 18 * crouch - 18 * up, 12 * crouch + 118 * up - 22 * pump, 18 * crouch - 18 * up);
      P.rot('head', 14 * crouch - 22 * up + 6 * pump, 0, wave(t, 3) * 3 * up);
      eyesScale(P, 1 + 0.2 * up * (1 - pump), 1 + 0.3 * up * (1 - pump) - 0.15 * crouch);
      face(P, t < 0.34 ? 'smug' : t < 0.95 ? 'wide' : t < 1.75 ? 'shut' : 'happy', t < 0.34 ? 'flat' : t < 0.95 ? 'o' : t < 1.75 ? 'grin' : 'smirk');
      P.burst(0.52, 'bear-note', 'head', [0, 22, 3], { n: 5, spread: 1 }).burst(1.1, 'bear-note', 'head', [0, 22, 3], { n: 4, spread: 1 }).burst(1.45, 'bear-note', 'head', [0, 22, 3], { n: 4, spread: 1 });
      P.burst(0.52, 'bear-star', 'body', [0, 12, 4], { n: 8, speed: 1.2 }).burst(0.92, 'dust', 'root', [0, 0.5, 1], { n: 6, speed: 0.6, spread: 1 });
    } },
    // a bear swipe: twist back with the paw cocked, then rake across with the whole body
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const wind = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.4, E.in)), hit = seg(t, 0.3, 0.44, E.in3) * (1 - seg(t, 0.56, 0.95, E.inout));
      P.pos('root', 0, 0, -1.5 * wind + 5.2 * hit).rot('body', -6 * wind + 14 * hit, -28 * wind + 26 * hit, 4 * wind - 6 * hit);
      P.sq('body', -0.08 * wind + 0.06 * hit * (1 - seg(t, 0.44, 0.54)) + wob(t, 0.46, 0.06, 4, 7));
      P.rot('armR', 36 * wind - 84 * hit, 0, -86 * wind + 52 * hit).rot('armL', -20 * wind + 24 * hit, 0, 18 * wind + 14 * hit);
      P.rot('head', -8 * wind + 14 * hit, 18 * wind - 14 * hit, 0).rot('legR', -10 * hit, 0, 0).rot('legL', 12 * wind, 0, 0);
      eyesScale(P, 1 + 0.15 * hit, 1 - 0.2 * wind);
      face(P, t < 0.62 ? 'angry' : undefined, t < 0.32 ? 'grit' : t < 0.7 ? 'grin' : undefined);
      P.burst(0.12, 'anger', 'head', [5.5, 22, 3], {});
      P.burst(0.4, 'bear-slash', 'body', [0.5, 9, 11], { n: 1 }).burst(0.42, 'spark', 'body', [1, 9, 11], {}).burst(0.42, 'bear-star', 'body', [1, 9, 11], { n: 5 }).burst(0.42, 'bear-fluff', 'body', [1, 9, 9], { n: 4, tint: FUR_TINT });
    } },
    // the colour explosion: gather the sparkle in, then a twirling leap with arms flung wide — confetti and notes everywhere
    special: { len: 2.5, next: 'idle', f(P, t) {
      const gather = seg(t, 0, 0.6, E.inout) * (1 - seg(t, 0.6, 0.7, E.out));
      const h = t < 0.62 ? 0 : t < 1.12 ? Math.sin(((t - 0.62) / 0.5) * Math.PI) * 5 : 0;
      const wide = seg(t, 0.62, 0.78, E.back) * (1 - seg(t, 1.9, 2.4, E.inout));
      air(P, h); P.rot('root', 0, 360 * seg(t, 0.62, 1.12, E.inout), 0);
      P.pos('body', 0, -1.6 * gather + (t > 1.12 ? wob(t, 1.12, -1, 2.5, 6) : 0), 0).sq('body', -0.14 * gather + 0.12 * bump(t, 0.6, 0.85) + (t > 1.12 ? wob(t, 1.12, -0.14, 2.5, 6) : 0));
      arms(P, -30 * gather + 108 * wide, -60 * gather - 6 * wide, -30 * gather + 108 * wide, -60 * gather - 6 * wide);
      P.rot('head', 16 * gather - 24 * wide, 0, 0); eyesScale(P, 1 + 0.25 * wide, 1 + 0.3 * wide - 0.3 * gather);
      face(P, t < 0.62 ? 'closed' : t < 1.9 ? 'star' : 'happy', t < 0.62 ? 'flat' : t < 1.9 ? 'grin' : 'smirk');
      if (t < 0.62) P.stream('bear-star', 'body', [0, 9, 3], { rate: 16, spread: 1, speed: 0.6 });
      P.burst(0.74, 'bear-confetti', 'body', [0, 12, 2], { n: 70, dir: [0, 1, 0.3], spread: 0.9 }).burst(0.74, 'bear-note', 'head', [0, 20, 2], { n: 9, spread: 1, speed: 1.5 });
      P.burst(0.74, 'ring', 'body', [0, 9, 2], { scale: 2 }).burst(0.76, 'sparkle', 'body', [0, 12, 2], { n: 14, speed: 2.2 }).burst(0.74, 'bear-star', 'body', [0, 12, 3], { n: 12, speed: 2.4 });
      if (t > 0.76 && t < 1.6) P.stream('bear-confetti', 'body', [0, 18, 0], { rate: 45, dir: [0, 1, 0], spread: 1, speed: 0.9 });
      P.burst(1.12, 'dust', 'root', [0, 0.5, 1], { n: 6, speed: 0.6, spread: 1 });
    } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.22, 0.65, E.inout));
      P.pos('root', 0, 0, -2.4 * k).rot('body', -15 * k + wob(t, 0.22, 4, 3, 6), 0, wave(t, 14) * 3 * k).sq('body', -0.14 * k);
      P.rot('head', -16 * k, 0, 6 * k).pos('shades', 0, 0.7 * k, 0.2 * k).rot('shades', -10 * k, 0, 8 * k);
      arms(P, 40 * k, -20 * k); eyesScale(P, 1 + 0.2 * k, 1 - 0.25 * k);
      face(P, 'shut', 'wavy');
      P.burst(0.02, 'bear-fluff', 'body', [0, 12, 3], { n: 7, speed: 1.4, tint: FUR_TINT }).burst(0.02, 'bear-fluff', 'body', [0, 8, 3], { n: 4, speed: 1.2, tint: VIO_TINT }).burst(0.02, 'spark', 'body', [0, 11, 6], {}).burst(0.1, 'sweat', 'head', [-6, 21, 3], { n: 2 });
    } },
    // dizzy, the shades knocked up crooked, then a flop onto its side
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.95, 1.4, E.bounce), slip = seg(t, 0.2, 0.6, E.back);
      P.rot('body', 0, wave(t, 1.4) * 16 * dizzy, wave(t, 2) * 9 * dizzy).rot('head', 0, 0, wave(t, 2, 1) * 12 * dizzy);
      P.pos('shades', 0.3 * slip, 1.9 * slip, -0.25 * slip).rot('shades', -16 * slip, 0, 16 * slip).pos('cap', 1.6 * slip, -0.4 * slip, 0).rot('cap', 0, 0, -30 * slip);
      P.rot('root', 0, 0, 82 * fall).pos('root', -2 * fall, 4.6 * fall, 0);
      arms(P, 30 * dizzy + 10 * fall, -10 * fall, 30 * dizzy - 36 * fall, -40 * fall);
      P.rot('legR', -10 * fall, 0, 0).rot('legL', -34 * fall, 0, -8 * fall).rot('head', 0, 0, 10 * fall);
      face(P, t < 1.2 ? 'swirl' : 'x', t < 1.0 ? 'wavy' : 'tongue'); P.lookW = 1 - dizzy;
      P.burst(1.0, 'star', 'head', [0, 23, 0], { n: 5 }).burst(1.38, 'dust', 'root', [-8, 1, 1], { n: 8, spread: 1, speed: 0.8 });
    } },
    down: { len: 2.6, loop: true, f(P, t) {
      P.rot('root', 0, 0, 82).pos('root', -2, 4.6, 0);
      arms(P, 10, -10, -36 + wave(t, 0.4) * 3, -40); P.rot('legR', -10, 0, 0).rot('legL', -34 + wave(t, 0.4, 1) * 4, 0, -8).rot('head', 0, 0, 10);
      P.pos('shades', 0.3, 1.9, -0.25).rot('shades', -16, 0, 16).pos('cap', 1.6, -0.4, 0).rot('cap', 0, 0, -30);
      face(P, 'x', 'tongue'); P.lookW = 0; P.breathW = 0.5;
      P.stream('star', 'head', [0, 22, 2], { rate: 1.2, spread: 0.6, speed: 0.4 });
    } },
    // graduation day: a big twirling jump with a fist in the air (the cap, if worn, goes flying), then the cool pose
    win: { len: 2.8, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.28, E.inout) * (1 - seg(t, 0.28, 0.36, E.out));
      const h = t < 0.34 ? 0 : t < 0.98 ? Math.sin(((t - 0.34) / 0.64) * Math.PI) * 6.5 : 0;
      const fist = seg(t, 0.3, 0.46, E.back) * (1 - seg(t, 1.1, 1.4, E.inout));
      air(P, h); P.rot('root', 0, 360 * seg(t, 0.36, 0.98, E.inout), 0);
      P.pos('body', 0, -1.4 * crouch + (t > 0.98 ? wob(t, 0.98, -1, 2.6, 6) : 0), 0).sq('body', -0.15 * crouch + 0.12 * bump(t, 0.32, 0.6) + (t > 0.98 ? wob(t, 0.98, -0.15, 2.6, 6) : 0));
      P.rot('armR', -30 * fist, 0, -112 * fist).rot('armL', -20 * fist, 0, 30 * fist).rot('head', 10 * crouch - 18 * fist, 0, 0);
      const capT = seg(t, 0.36, 1.5, E.lin), capY = capT > 0 && capT < 1 ? Math.sin(capT * Math.PI) * 11 : 0;
      P.pos('cap', 0, capY, 0).rot('cap', 0, 540 * seg(t, 0.36, 1.5), 0);
      const pose = seg(t, 1.45, 1.7, E.back) * (1 - seg(t, 2.55, 2.8, E.inout));
      P.rot('armR', -34 * pose, 0, -108 * pose).rot('armL', 16 * pose, 0, 34 * pose).rot('body', 0, -12 * pose, 0).rot('head', -8 * pose, 10 * pose, 0);
      eyesScale(P, 1 + 0.2 * fist, 1 + 0.2 * fist);
      face(P, t < 0.34 ? 'closed' : t < 1.45 ? 'happy' : 'glint', t < 1.45 ? 'grin' : 'smirk');
      if (t > 0.5 && t < 1.6) P.stream('bear-confetti', 'body', [0, 26, 0], { rate: 34, dir: [0, 1, 0], spread: 1, speed: 0.6 });
      P.burst(0.5, 'bear-note', 'head', [0, 22, 2], { n: 6 }).burst(0.98, 'dust', 'root', [0, 0.5, 1], { n: 6, speed: 0.6, spread: 1 }).burst(1.7, 'bear-star', 'armR', [-7, 2.5, 1], { n: 6 }).burst(1.72, 'sparkle', 'head', [-2.5, 18, 6], { n: 2, speed: 0.2 });
    } },
    // dozing in class: sat on the floor, head sinking, the shades sliding down its nose, a jolt awake
    sleep: { len: 4.0, loop: true, f(P, t) {
      const sink = seg(t, 0, 3.3, E.inout) * (1 - seg(t, 3.42, 3.6, E.out)), jolt = bump(t, 3.38, 3.7), br = Math.sin((t / 4) * TAU * 2);
      P.pos('root', 0, -2.0, 0.4).rot('legR', -84, -6, 0).rot('legL', -84, 6, 0).pos('legR', 0, 0.9, 0).pos('legL', 0, 0.9, 0);
      P.rot('body', -8 + sink * 6, 0, 0).sq('body', -0.04 + br * 0.015);
      P.rot('head', 12 + 18 * sink - 10 * jolt, 0, 4 * sink).pos('shades', 0, -0.9 * sink, 0.5 * sink).rot('shades', 8 * sink, 0, 0);
      arms(P, 4, -30 + 10 * sink, 4, -26 + 10 * sink);
      face(P, jolt > 0.3 ? 'shock' : 'closed', jolt > 0.3 ? 'o' : br > 0.3 ? 'o' : 'flat'); P.lookW = 0; P.breathW = 0;
      P.burst(0.6, 'z', 'head', [3, 23, 4], {}).burst(1.7, 'z', 'head', [3, 23, 4], {}).burst(2.8, 'z', 'head', [3, 23, 4], {}).burst(3.4, 'sweat', 'head', [5, 21, 4], { n: 1 });
    } },
    // the dance: a bouncy two-step with shoulder pops and a clap, a spin, and the finish — arms folded, chin up
    dance: { len: 3.0, next: 'idle', f(P, t) {
      const per = 0.5, ph = (t % per) / per, g = groove(ph), on = seg(t, 0, 0.15) * (1 - seg(t, 1.95, 2.05));
      const sx = Math.sin((t / per) * Math.PI), pop = Math.max(0, Math.sin((t / per) * Math.PI * 2));
      P.pos('root', sx * 1.5 * on, 0, 0).pos('body', 0, -0.7 * g * on, 0).sq('body', -0.06 * g * on).rot('body', 0, -sx * 12 * on, sx * 5 * on);
      P.rot('legR', 0, 0, 0).pos('legR', 0, Math.max(0, -sx) * 1.2 * on, 0).pos('legL', 0, Math.max(0, sx) * 1.2 * on, 0);
      arms(P, (14 + 10 * pop) * on, (-30 + sx * 40) * on, (14 + 10 * pop) * on, (-30 - sx * 40) * on);
      const clap = bump(t, 1.15, 1.45); arms(P, -24 * clap, -60 * clap);
      P.rot('head', (8 * g - 4) * on, sx * 10 * on, -sx * 6 * on);
      const spin = seg(t, 2.0, 2.4, E.inout), hopY = bump(t, 2.0, 2.4) * 2.4;
      P.rot('root', 0, 360 * spin, 0).pos('root', 0, hopY, 0);
      const fin = seg(t, 2.35, 2.55, E.back) * (1 - seg(t, 2.85, 3.0));
      P.rot('armR', -62 * fin, 0, 46 * fin).rot('armL', -56 * fin, 0, -46 * fin).rot('body', -6 * fin, 0, 0).rot('head', -10 * fin, 12 * fin, 0).pos('body', 0, wob(t, 2.42, -0.8, 3, 6), 0);
      eyesScale(P, 1, 1 - 0.15 * g * on);
      face(P, t < 2.0 ? (t % 1 < 0.5 ? 'happy' : 'smug') : t < 2.35 ? 'shut' : 'glint', t < 2.0 ? 'grin' : 'smirk');
      if (t > 0.1 && t < 2.0) P.stream('bear-note', 'head', [0, 22, 2], { rate: 3, spread: 1 });
      P.burst(1.3, 'bear-star', 'armR', [-3, 6, 6], { n: 4 }).burst(2.45, 'sparkle', 'head', [0, 22, 4], { n: 10, speed: 1.4 }).burst(2.45, 'bear-note', 'head', [0, 22, 2], { n: 5 }).burst(2.42, 'dust', 'root', [0, 0.5, 1], { n: 5 });
    } },
    // the signature: it pulls out its diploma, unrolls it, reads it… shrugs, crumples it and tosses it over its shoulder
    dropout: { len: 3.4, next: 'idle', f(P, t) {
      const reach = seg(t, 0.05, 0.4, E.inout), show = seg(t, 0.45, 0.75, E.back) * (1 - seg(t, 1.45, 1.65, E.inout));
      const shrug = bump(t, 1.15, 1.55), crush = bump(t, 1.6, 1.85), wind = seg(t, 1.85, 2.05, E.inout) * (1 - seg(t, 2.05, 2.2, E.in3));
      const fly = seg(t, 2.1, 2.9, E.lin), dust = bump(t, 2.5, 3.1);
      P.rot('armR', 30 * reach * (1 - show) - 104 * show + 30 * crush - 150 * wind + 40 * seg(t, 2.05, 2.2) * (1 - seg(t, 2.4, 2.7)), 0, -34 * show + 10 * crush);
      P.rot('armL', -60 * show - 50 * crush - 40 * dust, 0, -10 * show + 30 * crush).rot('armR', -40 * dust, 0, 20 * dust);
      P.rot('head', 14 * show - 8 * shrug - 14 * wind, -16 * show, 8 * shrug * 0).rot('body', 0, -10 * show + 20 * wind, 0).pos('body', 0, 0.8 * shrug, 0);
      arms(P, 18 * shrug, 0);
      // the diploma flies off behind it, tumbling
      if (t > 2.12) P.pos('prop', 2 * fly, -14 * Math.sin(fly * Math.PI) - 4 * fly, 8 * fly - 14 * fly * fly).rot('prop', 720 * fly, 0, 380 * fly).scl('prop', 1 + 0.4 * fly);
      P.face('prop', t < 0.38 ? 'off' : t < 0.62 ? 'roll' : t < 1.62 ? 'paper' : t < 2.8 ? 'ball' : 'off');
      eyesAt(P, -0.4 * show, -0.3 * show); eyesScale(P, 1, 1 - 0.2 * shrug);
      face(P, show > 0.5 && t < 1.15 ? 'smug' : shrug > 0.3 ? 'closed' : crush > 0.3 ? 'angry' : t > 2.3 ? 'happy' : undefined, show > 0.5 && t < 1.15 ? 'flat' : shrug > 0.3 ? 'wavy' : crush > 0.2 ? 'grit' : t > 2.3 ? 'grin' : undefined);
      P.burst(2.12, 'bear-confetti', 'armR', [-7, 6, 2], { n: 16, dir: [0, 1, -0.5], spread: 0.8 }).burst(2.2, 'bear-note', 'head', [0, 22, 2], { n: 3 }).burst(2.7, 'dust', 'armR', [-7, 4, 3], { n: 3, scale: 0.5 });
    } },
    // fidget: tips the shades up for a cool look and a wink, then slides them back with a glint
    shades: { len: 2.3, next: 'idle', f(P, t) {
      const reach = seg(t, 0.05, 0.4, E.inout) * (1 - seg(t, 0.62, 0.85, E.inout)) + seg(t, 1.45, 1.65, E.inout) * (1 - seg(t, 1.85, 2.1, E.inout));
      const lift = seg(t, 0.38, 0.62, E.back) * (1 - seg(t, 1.6, 1.8, E.in));
      P.rot('armR', -118 * reach, 10 * reach, -26 * reach).rot('head', -6 * lift, 8 * lift, 0);
      P.pos('shades', 0, 2.5 * lift, -0.6 * lift).rot('shades', -28 * lift, 0, 0);
      face(P, t > 0.95 && t < 1.3 ? 'wink' : lift > 0.5 ? 'smug' : undefined, lift > 0.5 ? 'smirk' : undefined);
      P.burst(1.85, 'sparkle', 'shades', [-3, 18, 6.5], { n: 2, speed: 0.2 });
    } },
    // fidget: lifts the star, breathes on it, rubs it to a shine
    polish: { len: 2.5, next: 'idle', f(P, t) {
      const hold = seg(t, 0.1, 0.45, E.inout) * (1 - seg(t, 1.95, 2.25, E.inout)), huff = bump(t, 0.6, 1.0), rub = seg(t, 1.05, 1.15) * (1 - seg(t, 1.75, 1.85));
      P.rot('armL', -70 * hold, -10 * hold, 10 * hold).pos('medal', 0, 2.2 * hold, 1.6 * hold).rot('medal', -40 * hold, 0, 0);
      P.rot('head', 16 * hold + 6 * huff, 0, 0);
      P.rot('armR', -60 * rub + Math.sin(t * 26) * 10 * rub, Math.cos(t * 26) * 10 * rub, 10 * rub);
      eyesAt(P, 0, -0.4 * hold);
      face(P, huff > 0.3 ? 'closed' : t > 1.85 ? 'glint' : undefined, huff > 0.3 ? 'o' : t > 1.85 ? 'smirk' : 'flat');
      if (t > 0.65 && t < 0.95) P.stream('steam', 'head', [0, 11, 8], { rate: 12, dir: [0, -0.4, 1], spread: 0.3, speed: 0.6, scale: 0.6 });
      P.burst(1.9, 'sparkle', 'medal', [0, 6, 6], { n: 4, speed: 0.4 }).burst(1.92, 'bear-star', 'medal', [0, 6, 6], { n: 2, speed: 0.3 });
    } },
    // fidget: a full-body fur shake, like shaking off rain — tufts fly, ears flap
    shake: { len: 1.5, next: 'idle', f(P, t) {
      const k = seg(t, 0.1, 0.25) * (1 - seg(t, 0.95, 1.2)), s = Math.sin(t * TAU * 6.5);
      P.rot('body', 0, s * 16 * k, s * 6 * k).rot('head', 0, -s * 22 * k, -s * 8 * k).sq('body', -0.05 * bump(t, 0, 0.14) + wob(t, 1.0, 0.05, 3, 6));
      arms(P, 14 * k + s * 6 * k, 0); P.pos('body', 0, -0.5 * bump(t, 0, 0.16), 0);
      face(P, k > 0.3 ? 'shut' : t > 1.15 ? 'happy' : undefined, k > 0.3 ? 'wavy' : undefined);
      if (k > 0.5) P.stream('bear-fluff', 'body', [0, 12, 0], { rate: 18, spread: 1, speed: 1.6, tint: FUR_TINT }).stream('bear-fluff', 'body', [0, 7, 0], { rate: 10, spread: 1, speed: 1.4, tint: VIO_TINT, key: 'v' });
    } },
  },
};
def.anim = anim;
