// Gradcub — stage 1 of the bear line (Echo). The dropout who graduated anyway: a fluffy
// plush cub with chocolate fur painted in clumps (caramel tips, fuzzy tufts round every
// silhouette), hot-pink shutter shades it never takes off, a gold star chain, a violet knit
// sweater exploding with pink daisies, yellow stars and cyan dots, a small teal backpack, and
// a mortarboard cocked back with a gold tassel that swings to every beat. Cocky, warm, always
// nodding its head; it dozes off in class and throws its cap when it wins. An original design
// that winks at a rapper's college albums — never their mascot.
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import { fur, fringe, halo, gold, GOLD, chain, rib, shutter, fill, wrapX, isSide, edgeLine, plant, cyc, tx } from './bear_parts.js';
import { poly, ramp, shift, mix, h2 } from './kit.js';

const C = {
  fur: '#8a5634', furHi: '#b27a4a', furLo: '#5c3820', furLine: '#3a2012', furEdge: '#4c2c16', furTip: '#d39a5e', furLite: '#a26a40',
  muz: '#f0d2a0', muzHi: '#fff0c8', muzLo: '#c89e6c', muzLine: '#6a4026',
  nose: '#2a1810', noseHi: '#5e3e30', noseSpec: '#c8aca0',
  inEar: '#eaa884', inEarLo: '#c27858', inEarDeep: '#9a5a44',
  brow: '#3a2014', browHi: '#5e3822',
  knit: '#5a2a9e', knitHi: '#7a4ac2', knitLo: '#3c1a70', knitLine: '#26104c',
  pink: '#ff4aa8', pinkHi: '#ffa0d2', pinkLo: '#c41e76',
  yel: '#ffd23e', yelHi: '#fff4a0', yelLo: '#e0961a',
  cyan: '#2ed0e8', cyanHi: '#b0f6ff', cyanLo: '#1a86b4',
  white: '#fff6fa',
  shade: '#ff3a9a', shadeHi: '#ffa6d4', shadeLo: '#b8186a', lensGap: '#2a0c28',
  pack: '#1ea0ac', packHi: '#62d6d8', packLo: '#13707e', packLine: '#0b4450',
  cap: '#2c2744', capHi: '#4e4870', capLo: '#17131f', capSheen: '#6a6290',
  ink: '#1e120c', mouth: '#3e0e16', tongue: '#d85a6a',
  sclera: '#f6efe2', iris: '#3a1e0e', glint: '#ffffff',
};

// ---------------------------------------------------------------- painters
const furP = (seed, o = {}) => fur(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furEdge, tip: C.furTip, lite: C.furLite, s: 10, seed, ...o });
const headFur = furP(11);
const headFur2 = furP(23, { s: 9 });
const legFur = furP(31, { s: 8 });
const fuzz = (seed, o = {}) => fringe(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furLine, tip: C.furTip, seed, ...o });
const headHalo = halo(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furLine, tip: C.furTip, n: 26, depth: 0.16, inner: 0.76, sq: 2.7, seed: 4 });
const earHalo = halo(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furLine, tip: C.furTip, n: 14, depth: 0.2, inner: 0.6, sq: 2.2, seed: 8 });
const muzP = fur(C.muz, { hi: C.muzHi, lo: C.muzLo, line: shift(C.muz, -0.12), lite: C.muzHi, ramp: [C.muzHi, C.muz, C.muz, shift(C.muz, -0.06)], s: 8, rowH: 6, tipH: 2.5, seed: 5, y0: 2 });
// the muzzle front: cream fluff, a short philtrum and a one-sided smirk
const muzFront = (p, w, h, face, cube) => {
  muzP(p, w, h, face, cube);
  if (face !== 'south') return;
  const cx = Math.floor(w / 2), L = C.muzLine, y0 = h - 6;
  p.vl(cx, y0, y0 + 1, L);                                       // philtrum
  p.hl(cx - 4, cx + 3, y0 + 2, L);                               // the mouth
  p.px(cx - 5, y0 + 1, L);                                       // one corner tucked
  p.px(cx + 4, y0 + 1, L); p.px(cx + 5, y0, L);                  // the other lifts: a smirk
  p.hl(cx - 2, cx + 1, y0 + 3, shift(C.muz, -0.16));             // a soft shadow under the lip
};
const noseP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? C.noseHi : face === 'down' ? '#140a06' : y === 0 ? C.noseHi : y >= h - 1 ? '#140a06' : C.nose));
  if (face === 'south') { p.px(1, 1, C.noseSpec); p.px(2, 1, C.noseSpec); p.px(1, 2, C.noseHi); p.px(0, h - 1, '#140a06'); p.px(w - 1, h - 1, '#140a06'); }
  if (face === 'up') { p.px(1, h - 1, C.noseSpec); p.px(2, h - 1, C.noseSpec); }
};
// round ears: fur outside, a warm inner ear in front
const earP = (seed) => { const f = furP(seed, { s: 7 }); return (p, w, h, face, cube) => {
  f(p, w, h, face, cube);
  if (face !== 'south') return;
  const cx = w / 2, cy = h / 2 + 0.3, rx = w / 2 - 2.2, ry = h / 2 - 2.2;
  fill(p, w, h, (x, y) => { const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2; return d < 1 ? (d < 0.35 ? C.inEarDeep : d < 0.7 ? C.inEarLo : C.inEar) : null; });
}; };
const browP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? C.browHi : y === 0 ? C.browHi : y === h - 1 ? '#1e0e08' : C.brow)); if (face === 'south') for (let x = 1; x < w; x += 3) p.px(x, h - 1, C.brow); };

// the sweater: deep violet knit in vertical ribs, scattered with daisies, stars and dots
function motif(p, w, h, X0, Y0, type, ox) {
  const put = (dx, dy, c) => { const x = X0 + dx - ox, y = Y0 + dy; if (x >= 0 && x < w && y >= 0 && y < h) p.px(x, y, c); };
  if (type < 2) {                                 // daisy: five pink petals round a yellow eye
    const R = type === 0 ? 3.6 : 2.6;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), pet = R * (0.62 + 0.38 * Math.abs(Math.cos(a * 2.5 + 0.3)));
      if (r > pet + 0.35) continue;
      if (r < R * 0.36) put(dx, dy, dx + dy < 0 ? C.yelHi : C.yel);
      else if (r < R * 0.5) put(dx, dy, C.yelLo);
      else put(dx, dy, r > pet - 0.75 ? C.pinkLo : dx + dy < 0 ? C.pinkHi : C.pink);
    }
  } else if (type === 2) {                        // a four-point star
    for (let i = -3; i <= 3; i++) { const c = Math.abs(i) < 1 ? C.white : Math.abs(i) < 3 ? C.yel : C.yelLo; put(i, 0, c); put(0, i, c); }
    put(-1, -1, C.yelHi); put(1, 1, C.yelLo); put(1, -1, C.yel); put(-1, 1, C.yel);
  } else {                                        // a pair of cyan dots
    put(0, 0, C.cyan); put(1, 0, C.cyanLo); put(0, -1, C.cyanHi); put(3, 2, C.cyan); put(3, 1, C.cyanHi);
  }
}
function knit(o = {}) {
  return (p, w, h, face, cube) => {
    fill(p, w, h, (x, y) => {
      const t = h > 1 ? y / (h - 1) : 0.5;
      let c = face === 'up' ? C.knitHi : face === 'down' ? C.knitLo : ramp([C.knitHi, C.knit, C.knit, C.knitLo], t, x, y);
      return (x % 2) && face !== 'up' ? shift(c, -0.07) : c;
    });
    if (face === 'down') return;
    const ox = isSide(face) ? wrapX(face, cube) : 0, cell = o.cell || 8, seed = o.seed || 3;
    const i0 = Math.floor((ox - 8) / cell), i1 = Math.ceil((ox + w + 8) / cell);
    for (let j = -1; j * cell < h + cell; j++) for (let i = i0; i <= i1; i++) {
      const X = i * cell + ((j & 1) ? cell / 2 : 0) + Math.round((h2(i, j, seed) - 0.5) * 3), Y = j * cell + 3 + Math.round((h2(j, i, seed) - 0.5) * 3);
      const r = h2(i, j, seed + 1), type = face === 'up' ? (r < 0.5 ? 3 : 2) : r < 0.34 ? 0 : r < 0.56 ? 1 : r < 0.8 ? 2 : 3;
      motif(p, w, h, X, Y, type, ox);
    }
    if (o.stripes && isSide(face)) for (const [yy, c] of [[h - 3, C.yel], [h - 5, C.pink]]) for (let x = 0; x < w; x++) p.px(x, yy, x % 2 ? shift(c, -0.12) : c);
    if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, 0, shift(C.knitHi, 0.1));
  };
}
const sweater = knit({ seed: 3 }), sleeve = knit({ seed: 7, stripes: true, cell: 7 });
const ribHem = rib(C.pink, null, { stripes: [C.yel, C.pink, C.pink, C.yel] });
const ribCuff = rib(C.pink, null, { stripes: [C.yel, C.pink, C.yel] });
const ribCollar = rib(C.yel, null, { stripes: [C.pink, C.yel] });
const strapP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? C.packHi : x === 0 ? C.packHi : x === w - 1 ? C.packLine : C.pack)); if (isSide(face)) for (let y = 1; y < h; y += 3) p.px(Math.floor(w / 2), y, C.packLo); };
// the backpack: teal canvas, piped seams, a zipped front pocket with a star patch
const packP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? C.packHi : face === 'down' ? C.packLine : ramp([C.packHi, C.pack, C.pack, C.packLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (!isSide(face)) return;
  for (let x = 0; x < w; x++) { p.px(x, 0, shift(C.packHi, 0.15)); p.px(x, h - 1, C.packLine); }
  for (let y = 0; y < h; y++) { p.px(0, y, C.packLo); p.px(w - 1, y, C.packLo); }
  if (face === 'north') { for (let x = 2; x < w - 2; x++) p.px(x, 2, x % 2 ? C.yelLo : C.yel); }
};
const pocketP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? C.packHi : ramp([C.pack, C.packLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (face !== 'north') return;
  for (let x = 1; x < w - 1; x++) p.px(x, 1, x % 2 ? C.yelLo : C.yel);
  for (let y = 0; y < h; y++) { p.px(0, y, C.packLine); p.px(w - 1, y, C.packLine); } for (let x = 0; x < w; x++) p.px(x, h - 1, C.packLine);
  // a round patch with a pink star
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2) + 1;
  fill(p, w, h, (x, y) => { const d = Math.hypot(x - cx, y - cy); return d < 3.2 ? (d > 2.4 ? C.white : null) : null; });
  for (let i = -2; i <= 2; i++) { p.px(cx + i, cy, C.pink); p.px(cx, cy + i, C.pink); } p.px(cx, cy, C.pinkHi);
};
const pullP = (p, w, h) => { fill(p, w, h, (x, y) => (y === 0 ? C.yelLo : x === 0 ? C.pinkHi : C.pink)); };
// mortarboard: black twill board, thin bright edge, a skull cap below
const boardP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? ((x + y) % 3 === 0 ? C.cap : C.capHi) : face === 'down' ? C.capLo : y === 0 ? C.capSheen : C.cap));
  if (face !== 'up') return;
  for (let i = 0; i < w; i++) { p.px(i, 0, C.capSheen); p.px(i, h - 1, C.capSheen); p.px(0, i, C.capSheen); p.px(w - 1, i, C.capSheen); }
  for (let i = 3; i < w - 3; i++) { const j = w - 1 - i; if (i > w * 0.18 && i < w * 0.5) { p.px(i, j - 4, C.capSheen); p.px(i, j - 5, C.capSheen); } }
};
const capP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? C.capHi : ramp([C.capHi, C.cap, C.cap, C.capLo], h > 1 ? y / (h - 1) : 0.5, x, y))); if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, h - 1, '#0a0810'); };
const goldP = gold();
const tasselP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? GOLD.hi : x % 2 ? GOLD.base : y < 2 ? GOLD.spec : GOLD.hi)); if (isSide(face)) { for (let x = 0; x < w; x++) p.px(x, 1, GOLD.lo); } };
const tasselFringe = (p, w, h) => { for (let x = 0; x < w; x++) { const L = h - ((x * 7) % 3 === 0 ? 1 : 0); for (let y = 0; y < L; y++) p.px(x, y, x % 2 ? GOLD.lo : y === L - 1 ? GOLD.spec : GOLD.base); } };
// the medallion: a gold star with a pink stone
const starP = (p, w, h) => {
  const cx = (w - 1) / 2, cy = (h - 1) / 2 + 0.3, pts = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? w * 0.22 : w * 0.52; pts.push([cx + 0.5 + Math.cos(a) * r, cy + 0.5 + Math.sin(a) * r]); }
  poly(p, pts, (x, y) => (x + y < cx + cy - 1 ? GOLD.hi : x + y > cx + cy + 2 ? GOLD.lo : GOLD.base));
  edgeLine(p, GOLD.deep);
  p.px(Math.round(cx), Math.round(cy), C.pinkHi); p.px(Math.round(cx) + 1, Math.round(cy), C.pink); p.px(Math.round(cx), Math.round(cy) + 1, C.pinkLo); p.px(Math.round(cx) - 2, Math.round(cy) - 2, GOLD.spec);
};
// feet: fur above, three toe grooves in front, a cream felt sole with stitching
const footP = (seed) => { const f = furP(seed, { s: 7, tipH: 3 }); return (p, w, h, face, cube) => {
  f(p, w, h, face, cube);
  if (face === 'south') for (const fx of [0.33, 0.67]) { const x = Math.round(w * fx); for (let y = Math.floor(h * 0.3); y < h; y++) p.px(x, y, C.furLine); }
}; };
const soleP = (p, w, h) => {
  fill(p, w, h, () => C.furLo);
  const cx = w / 2, cy = h * 0.58;
  fill(p, w, h, (x, y) => { const d = ((x + 0.5 - cx) / (w * 0.4)) ** 2 + ((y + 0.5 - cy) / (h * 0.36)) ** 2; return d < 1 ? (d > 0.72 && (x + y) % 2 ? C.muzLo : C.muz) : null; });
  for (const fx of [0.25, 0.5, 0.75]) { const x = Math.round(w * fx - 0.5); p.px(x, 1, C.muz); p.px(x + 1, 1, C.muz); p.px(x, 2, C.muzLo); p.px(x + 1, 2, C.muz); }
};
const pawP = (seed) => { const f = furP(seed, { s: 7, tipH: 3 }); return (p, w, h, face, cube) => {
  f(p, w, h, face, cube);
  if (face === 'down') { fill(p, w, h, (x, y) => (x > 0 && x < w - 1 && y > 0 && y < h - 1 ? C.muz : null)); }
}; };
const mouthP = (p, w, h) => { fill(p, w, h, (x, y) => (y === 0 ? C.mouth : x > 0 && x < w - 1 && y > 0 ? C.tongue : '#5a1420')); };

// eyes (under the shades): 10 × 6 texels, outer corner at x = 0. Flat, heavy upper lids — cool, never cute
const EYEB = (p) => { poly(p, [[0, 1], [10, 1.4], [10, 4.4], [8, 5.6], [2.5, 5.6], [0.4, 3.6]], C.ink); poly(p, [[1.2, 2.4], [9, 2.4], [9, 4.2], [7.6, 4.8], [2.8, 4.8], [1.4, 3.6]], C.sclera); };
const EYES = {
  cool: (p) => { EYEB(p); p.rect(5, 2, 3, 3, C.iris); p.px(5, 2, C.glint); p.hl(0, 9, 1, C.ink); p.hl(1, 9, 2, C.ink); },
  wide: (p) => { poly(p, [[0, 0.4], [10, 0.6], [10, 4.6], [8, 5.8], [2.5, 5.8], [0.4, 4]], C.ink); poly(p, [[1.2, 1.4], [9, 1.4], [9, 4.4], [7.6, 5], [2.8, 5], [1.4, 3.8]], C.sclera); p.rect(5, 2, 2, 2, C.iris); },
  glare: (p) => { p.hl(0, 9, 2, C.ink); p.hl(0, 9, 3, C.ink); p.hl(2, 8, 4, C.ink); p.hl(2, 8, 3, C.sclera); p.rect(5, 3, 2, 1, C.iris); p.px(0, 1, C.ink); },
  closed: (p) => { for (let x = 0; x < 10; x++) p.px(x, 3 + (x > 2 && x < 8 ? 1 : 0), C.ink); for (let x = 1; x < 9; x++) p.px(x, 4 + (x > 3 && x < 7 ? 1 : 0), C.ink); },
  swirl: (p) => { EYEB(p); p.hl(1, 9, 1, C.ink); for (let a = 0; a < 13; a += 0.3) { const r = a * 0.22, x = Math.round(5 + Math.cos(a) * r * 1.4), y = Math.round(3.4 + Math.sin(a) * r * 0.75); if (r < 2.8) p.px(x, y, C.ink); } },
  x: (p) => { for (let i = 0; i < 5; i++) { p.px(3 + i, 1 + i, C.ink); p.px(4 + i, 1 + i, C.ink); p.px(7 - i, 1 + i, C.ink); p.px(8 - i, 1 + i, C.ink); } },
};
// shutter-shade lenses: the default smoky slats, a diagonal shine, and a hot flash
const lens = (kind) => shutter({ frame: C.shade, hi: C.shadeHi, lo: C.shadeLo, gap: C.lensGap, gapLo: '#4a1a40', bar: 2, round: 4, bridge: 1.5,
  gapFn: (lx, y, L, row) => {
    if (kind === 'shine') { const d = lx + y * 1.4 - (L ? 4 : 9); if (d > 0 && d < 3) return d < 1.5 ? '#ffffff' : '#ffc8e6'; }
    if (kind === 'flash') return row === 0 ? '#ffffff' : '#ffe0f0';
    if (kind === 'cool' && row === 2 && lx > 4 && lx < 9) return '#6a2a5a';
    return null;
  } });
const barP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? C.shadeHi : face === 'down' ? C.shadeLo : y === 0 ? C.shadeHi : y === h - 1 ? C.shadeLo : C.shade)); if (face === 'south') { p.px(2, 0, '#ffffff'); p.px(3, 0, '#ffffff'); } };

// ---------------------------------------------------------------- the model
const B = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const eyeStates = (side) => Object.entries(EYES).map(([k, fn]) => B(side < 0 ? [-4.25, 16.9, 5.43] : [1.05, 16.9, 5.43], [3.2, 2.0, 0], fn, { plane: 'z', mirror: side > 0, id: (side < 0 ? 'eyeR-' : 'eyeL-') + k, hide: k !== 'cool' }));
const LENS = ['dark', 'cool', 'shine', 'flash'];
const CHAIN = chain([[-3.3, 10.9, 3.4], [-3.05, 9.7, 4.55], [-2.0, 8.4, 4.72], [0, 7.75, 4.78], [2.0, 8.4, 4.72], [3.05, 9.7, 4.55], [3.3, 10.9, 3.4]], { len: 1.15, w: 0.78, t: 0.36, step: 0.86 });
export const def = {
  name: 'gradcub', ppu: 3, scale: 0.41, outline: { color: '#1e120c', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'legR', parent: 'root', pivot: [-2.7, 4.4, 0.2], cubes: [
      B([-4.6, 1.3, -1.6], [3.8, 3.5, 3.6], legFur),
      B([-4.8, 0, -2.0], [4.2, 1.7, 5.0], footP(41), { faces: { down: soleP } }),
    ] },
    { name: 'legL', parent: 'root', pivot: [2.7, 4.4, 0.2], cubes: [
      B([0.8, 1.3, -1.6], [3.8, 3.5, 3.6], legFur, { mirror: true }),
      B([0.6, 0, -2.0], [4.2, 1.7, 5.0], footP(43), { faces: { down: soleP }, mirror: true }),
    ] },
    { name: 'body', parent: 'root', pivot: [0, 7.2, 0], cubes: [
      B([-5.2, 3.6, -4.0], [10.4, 7.6, 8.0], sweater),
      B([-5.8, 4.4, -3.6], [11.6, 5.8, 7.2], sweater),
      B([-4.6, 4.0, -4.5], [9.2, 6.8, 9.0], sweater),
      B([-5.5, 3.1, -4.3], [11.0, 1.2, 8.6], ribHem),
      B([-3.9, 10.9, -3.3], [7.8, 0.9, 6.6], ribCollar),
      B([-4.3, 5.0, 4.42], [1.0, 5.8, 0.4], strapP),
      B([3.3, 5.0, 4.42], [1.0, 5.8, 0.4], strapP),
    ] },
    { name: 'chain', parent: 'body', pivot: [0, 10.9, 3.6], cubes: CHAIN },
    { name: 'medal', parent: 'chain', pivot: [0, 7.6, 4.85], cubes: [
      B([-0.35, 7.2, 4.62], [0.7, 0.6, 0.4], goldP),
      B([-0.9, 5.45, 4.6], [1.8, 1.8, 0.36], goldP),
      B([-1.35, 4.85, 4.99], [2.7, 2.7, 0], starP, { plane: 'z' }),
    ] },
    { name: 'pack', parent: 'body', pivot: [0, 10.4, -4.5], cubes: [
      B([-3.8, 4.4, -7.4], [7.6, 6.4, 2.9], packP),
      B([-3.4, 10.6, -7.1], [6.8, 0.7, 2.4], packP),
      B([-2.9, 4.8, -8.2], [5.8, 3.4, 0.9], pocketP),
      B([-1.0, 11.1, -6.3], [2.0, 0.6, 0.45], strapP),
      B([-0.3, 7.4, -8.24], [0.6, 1.1, 0], pullP, { plane: 'z' }),
      B([-4.25, 4.8, -5.2], [0.45, 5.6, 1.0], strapP),
      B([3.8, 4.8, -5.2], [0.45, 5.6, 1.0], strapP),
    ] },
    { name: 'armR', parent: 'body', pivot: [-5.5, 10.2, 0.2], rot: [0, 0, -8], cubes: [
      B([-8.5, 6.0, -1.6], [3.2, 4.9, 3.4], sleeve),
      B([-8.65, 5.0, -1.75], [3.5, 1.1, 3.7], ribCuff),
      B([-8.35, 3.2, -1.45], [2.9, 2.0, 3.1], pawP(51)),
    ] },
    { name: 'armL', parent: 'body', pivot: [5.5, 10.2, 0.2], rot: [0, 0, 8], cubes: [
      B([5.3, 6.0, -1.6], [3.2, 4.9, 3.4], sleeve),
      B([5.15, 5.0, -1.75], [3.5, 1.1, 3.7], ribCuff),
      B([5.45, 3.2, -1.45], [2.9, 2.0, 3.1], pawP(53), { mirror: true }),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 11.2, 0.4], cubes: [
      B([-6.0, 10.8, -4.8], [12, 10.4, 9.6], headFur),
      B([-6.8, 12.0, -4.2], [13.6, 7.0, 8.4], headFur2),
      B([-5.0, 10.2, -4.2], [10, 11.6, 8.4], headFur),
      B([-5.2, 11.4, -5.4], [10.4, 9.0, 10.8], headFur2),
      B([-8.1, 9.3, 0.3], [16.2, 13.6, 0], headHalo, { plane: 'z' }),
      B([0.2, 9.3, -6.9], [0, 13.6, 13.4], headHalo, { plane: 'x' }),
      B([-2.9, 11.5, 5.0], [5.8, 3.7, 2.5], muzP, { faces: { south: muzFront } }),
      B([-2.4, 15.0, 5.0], [4.8, 0.6, 2.0], muzP),
      B([-1.45, 14.55, 7.0], [2.9, 1.15, 1.2], noseP),
      B([-0.85, 13.85, 6.95], [1.7, 0.8, 1.1], noseP),
      ...eyeStates(-1), ...eyeStates(1),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 12.0, 5.6], cubes: [
      B([-2.3, 10.6, 5.0], [4.6, 1.5, 2.3], muzP),
      B([-2.1, 11.55, 5.05], [4.2, 0.4, 2.2], mouthP, { outline: false }),
    ] },
    { name: 'shades', parent: 'head', pivot: [0, 18.0, 5.6], cubes: [
      B([-5.6, 18.6, 5.3], [11.2, 0.7, 0.55], barP),
      ...LENS.map((k) => B([-5.6, 16.1, 5.72], [11.2, 3.2, 0], lens(k), { plane: 'z', id: 'lens-' + k, hide: k !== 'dark' })),
      B([-6.95, 18.65, -0.4], [0.45, 0.5, 6.0], barP),
      B([6.5, 18.65, -0.4], [0.45, 0.5, 6.0], barP),
      B([-6.95, 18.65, 5.3], [1.4, 0.5, 0.45], barP),
      B([5.55, 18.65, 5.3], [1.4, 0.5, 0.45], barP),
    ] },
    { name: 'browR', parent: 'head', pivot: [-2.7, 19.9, 5.5], rot: [0, 0, -5], cubes: [B([-4.5, 19.45, 5.05], [3.6, 1.0, 0.8], browP)] },
    { name: 'browL', parent: 'head', pivot: [2.7, 19.9, 5.5], rot: [0, 0, 5], cubes: [B([0.9, 19.45, 5.05], [3.6, 1.0, 0.8], browP, { mirror: true })] },
    { name: 'earR', parent: 'head', pivot: [-5.6, 18.6, -0.6], rot: [0, 0, 18], cubes: [
      B([-9.0, 17.9, -1.4], [5.0, 3.4, 1.7], earP(61)),
      B([-8.35, 17.2, -1.4], [3.7, 4.8, 1.7], earP(62)),
      B([-9.4, 16.85, -0.55], [5.9, 5.5, 0], earHalo, { plane: 'z' }),
    ] },
    { name: 'earL', parent: 'head', pivot: [5.6, 18.6, -0.6], rot: [0, 0, -18], cubes: [
      B([4.0, 17.9, -1.4], [5.0, 3.4, 1.7], earP(63), { mirror: true }),
      B([4.65, 17.2, -1.4], [3.7, 4.8, 1.7], earP(64), { mirror: true }),
      B([3.5, 16.85, -0.55], [5.9, 5.5, 0], earHalo, { plane: 'z', mirror: true }),
    ] },
    { name: 'cap', parent: 'head', pivot: [0, 21.6, 0], rot: [-7, 0, 6], cubes: [
      B([-4.5, 20.8, -4.2], [9.0, 1.8, 8.6], capP),
      B([-6.2, 22.6, -6.2], [12.4, 0.75, 12.4], boardP),
      B([-0.6, 23.35, -0.6], [1.2, 0.45, 1.2], goldP),
      B([-8.4, 23.36, -0.15], [8.4, 0.22, 0.3], goldP, { pivot: [0, 23.45, 0], rot: [0, 45, 0] }),
    ] },
    { name: 'tassel', parent: 'cap', pivot: [-6.0, 23.4, 6.0], rot: [7, 0, -6], cubes: [
      B([-6.15, 21.3, 5.85], [0.3, 2.1, 0.3], goldP),
      B([-6.35, 20.65, 5.65], [0.7, 0.7, 0.7], goldP),
      B([-6.5, 18.4, 5.5], [1.0, 2.3, 1.0], tasselP),
      B([-6.5, 17.5, 6.0], [1.0, 0.95, 0], tasselFringe, { plane: 'z' }),
      B([-6.0, 17.5, 5.5], [0, 0.95, 1.0], tasselFringe, { plane: 'x' }),
    ] },
  ],
};

// ---------------------------------------------------------------- animation
const TAU = Math.PI * 2;
const FUR_TINT = [0.62, 0.42, 0.28];
// the groove: the body dips on each beat, recovers slowly (0..1 curve per beat)
const groove = (ph) => (ph < 0.14 ? E.out(ph / 0.14) : 1 - E.inout(Math.min(1, (ph - 0.14) / 0.62)));
// hop the whole cub (root) with feet leaving the ground
function air(P, y, sq = 0) { P.pos('root', 0, Math.max(0, y), 0).sq('body', sq); }
// arms: z out (+ = away from the body), x forward (− = forward/up)
function arms(P, rz, rx, lz = rz, lx = rx) { P.rot('armR', rx, 0, -rz).rot('armL', lx, 0, lz); }
export const anim = {
  start: 'idle', seed: 21,
  breathe: { bone: 'body', amp: 0.018, per: 2.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.4, 5.0], dur: 0.12 },
  look: { bone: 'head', yaw: 30, pitch: 14, speed: 5 },
  springs: [
    { bone: 'tassel', tip: [0, -5.5, 0], k: 85, d: 5, gain: 1.3, max: 48 },
    { bone: 'chain', tip: [0, -3.2, 1.2], k: 130, d: 7, gain: 0.8, max: 16, axes: [1, 0.3, 1] },
    { bone: 'medal', tip: [0, -2.4, 0.2], k: 110, d: 5, gain: 1.0, max: 26, axes: [1, 0.2, 1] },
    { bone: 'earR', tip: [-1.2, 2.2, 0], k: 260, d: 11, gain: 0.5, max: 12 },
    { bone: 'earL', tip: [1.2, 2.2, 0], k: 260, d: 11, gain: 0.5, max: 12 },
    { bone: 'pack', tip: [0, -3.5, -2.5], k: 190, d: 10, gain: 0.45, max: 9, axes: [1, 0.3, 1] },
    { bone: 'cap', tip: [0, 1.4, 0], k: 320, d: 14, gain: 0.35, max: 7 },
  ],
  faces: {
    eyes: { default: 'cool', states: Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eyeR-' + k, 'eyeL-' + k]]).concat([['wink', ['eyeR-cool', 'eyeL-closed']]])) },
    lens: { default: 'dark', states: Object.fromEntries(LENS.map((k) => [k, ['lens-' + k]])) },
  },
  fidget: { every: [5, 9], clips: ['shades', 'polish', 'flick'] },
  clips: {
    // a laid-back head-nod groove: dip on the beat, the head nods a beat-fraction later, a lazy sway
    idle: { len: 1.6, loop: true, f(P, t) {
      const per = 0.8, ph = (t % per) / per, g = groove(ph), gh = groove(((t - 0.07) % per + per) % per / per);
      const sway = wave(t, 1 / 1.6), sway2 = wave(t, 1 / 1.6, 1.2);
      P.pos('body', 0, -0.55 * g, 0).sq('body', -0.045 * g + 0.012 * (1 - g)).rot('body', 1.5 * g, sway2 * 4, sway * 2.4);
      P.rot('head', 7 * gh - 2, -sway2 * 3, -sway * 2.5);
      arms(P, 3 + 4 * gh + sway * 2, -3 + sway * 6, 3 + 4 * gh - sway * 2, -3 - sway * 6);
      P.rot('legR', 0, 0, 0).pos('legR', 0, 0, 0);
      P.rot('browL', 0, 0, -9 * bump(t, 0.85, 1.45)).pos('browL', 0, 0.35 * bump(t, 0.85, 1.45), 0);
      P.rot('jaw', 3 * gh);
      P.face('lens', t > 0.9 && t < 1.05 ? 'cool' : undefined);
    } },
    // a swaggering strut: bounce on every step, shoulders roll, arms swing loose
    walk: { len: 0.72, loop: true, f(P, t) {
      const ph = (t / 0.72) * TAU, s = Math.sin(ph), c = Math.cos(ph), up = (Math.cos(2 * ph) + 1) / 2;
      P.pos('body', 0, 0.75 * up - 0.3, 0).rot('body', 4, s * 6, s * 4).sq('body', -0.04 * (1 - up) + 0.02 * up);
      P.rot('legR', -s * 26, 0, 0).pos('legR', 0, Math.max(0, c) * 1.1, 0).rot('legL', s * 26, 0, 0).pos('legL', 0, Math.max(0, -c) * 1.1, 0);
      arms(P, 6 + Math.abs(s) * 4, s * 24, 6 + Math.abs(s) * 4, -s * 24);
      P.rot('head', -4 + up * 5, -s * 5, -s * 4).rot('jaw', 2);
    } },
    // the hype: crouch, spring up with both arms thrown high, land, pump the fists and shout
    cry: { len: 2.1, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.32, E.inout) * (1 - seg(t, 0.32, 0.42, E.out));
      const h = t < 0.38 ? 0 : t < 0.9 ? Math.sin(((t - 0.38) / 0.52) * Math.PI) * 4.2 : 0;
      const land = t > 0.9 ? wob(t, 0.9, -0.16, 2.6, 6) : 0;
      const up = seg(t, 0.34, 0.5, E.back) * (1 - seg(t, 1.7, 2.05, E.inout));
      const pump = t > 0.95 && t < 1.7 ? Math.abs(Math.sin((t - 0.95) * Math.PI * 2.7)) : 0;
      air(P, h); P.pos('body', 0, -1.4 * crouch, 0).sq('body', -0.16 * crouch + 0.13 * (t > 0.36 && t < 0.62 ? 1 - seg(t, 0.5, 0.62) : 0) + land);
      if (t > 0.9) P.pos('body', 0, Math.min(0, land * 6), 0);
      arms(P, 12 * crouch + 138 * up - 26 * pump, 18 * crouch - 12 * up, 12 * crouch + 138 * up - 26 * pump, 18 * crouch - 12 * up);
      P.rot('head', 14 * crouch - 22 * up + 6 * pump, 0, wave(t, 3) * 3 * up).rot('jaw', 4 * crouch + 26 * up + 8 * pump);
      P.rot('browR', 0, 0, 10 * crouch - 6 * up).rot('browL', 0, 0, -10 * crouch + 6 * up).pos('browR', 0, 0.4 * up, 0).pos('browL', 0, 0.4 * up, 0);
      P.face('lens', t > 0.5 && t < 0.62 ? 'flash' : t >= 0.62 && t < 0.78 ? 'shine' : undefined);
      P.burst(0.52, 'bear-note', 'head', [0, 22, 3], { n: 5, spread: 1 }).burst(1.1, 'bear-note', 'head', [0, 22, 3], { n: 4, spread: 1 }).burst(1.45, 'bear-note', 'head', [0, 22, 3], { n: 4, spread: 1 });
      P.burst(0.52, 'bear-star', 'body', [0, 12, 4], { n: 8, speed: 1.2 }).burst(0.92, 'dust', 'root', [0, 0.5, 1], { n: 6, speed: 0.6, spread: 1 });
    } },
    // a bear swipe: twist back with the paw cocked, then rake across with the whole body
    attack: { len: 1.0, next: 'idle', f(P, t) {
      const wind = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.4, E.in)), hit = seg(t, 0.3, 0.44, E.in3) * (1 - seg(t, 0.56, 0.95, E.inout));
      P.pos('root', 0, 0, -1.5 * wind + 5.2 * hit).rot('body', -6 * wind + 14 * hit, -28 * wind + 26 * hit, 4 * wind - 6 * hit);
      P.sq('body', -0.08 * wind + 0.06 * hit * (1 - seg(t, 0.44, 0.54)) + wob(t, 0.46, 0.06, 4, 7));
      P.rot('armR', 30 * wind - 72 * hit, 0, 70 * wind - 60 * hit).rot('armL', -20 * wind + 20 * hit, 0, 18 * wind + 10 * hit);
      P.rot('head', -8 * wind + 14 * hit, 18 * wind - 14 * hit, 0).rot('jaw', 22 * hit);
      P.rot('browR', 0, 0, 12 * (wind + hit)).rot('browL', 0, 0, -12 * (wind + hit));
      P.rot('legR', -10 * hit, 0, 0).rot('legL', 12 * wind, 0, 0);
      P.face('lens', hit > 0.6 ? 'shine' : undefined);
      P.burst(0.42, 'spark', 'armR', [-7, 4, 8], {}).burst(0.42, 'bear-star', 'armR', [-7, 4, 8], { n: 5 }).burst(0.42, 'bear-fluff', 'armR', [-7, 4, 6], { n: 4, tint: FUR_TINT });
    } },
    // the colour explosion: gather, leap with arms flung wide, cap flying, confetti and notes everywhere
    special: { len: 2.6, next: 'idle', f(P, t) {
      const gather = seg(t, 0, 0.6, E.inout) * (1 - seg(t, 0.6, 0.7, E.out));
      const h = t < 0.62 ? 0 : t < 1.12 ? Math.sin(((t - 0.62) / 0.5) * Math.PI) * 5 : 0;
      const wide = seg(t, 0.62, 0.78, E.back) * (1 - seg(t, 1.9, 2.4, E.inout));
      air(P, h); P.pos('body', 0, -1.6 * gather + (t > 1.12 ? wob(t, 1.12, -1, 2.5, 6) : 0), 0).sq('body', -0.14 * gather + 0.12 * bump(t, 0.6, 0.85) + (t > 1.12 ? wob(t, 1.12, -0.14, 2.5, 6) : 0));
      arms(P, -30 * gather + 120 * wide, -60 * gather + 10 * wide, -30 * gather + 120 * wide, -60 * gather + 10 * wide);
      P.rot('head', 16 * gather - 24 * wide, 0, 0).rot('jaw', 30 * wide);
      // the cap flies off, spins, and drops back on
      const capT = seg(t, 0.7, 1.75, E.lin), capY = capT > 0 && capT < 1 ? Math.sin(capT * Math.PI) * 13 : 0;
      P.pos('cap', 0, capY, 0).rot('cap', 0, 720 * seg(t, 0.7, 1.75, E.out), 0);
      if (t > 1.75) P.pos('cap', 0, wob(t, 1.75, -0.6, 3, 7), 0).sq('head', wob(t, 1.75, -0.05, 3, 7));
      P.face('lens', t > 0.25 && t < 0.4 ? 'shine' : t > 0.7 && t < 0.86 ? 'flash' : undefined);
      if (t < 0.62) P.stream('bear-star', 'body', [0, 9, 3], { rate: 16, spread: 1, speed: 0.6 });
      P.burst(0.74, 'bear-confetti', 'body', [0, 12, 2], { n: 70, dir: [0, 1, 0.3], spread: 0.9 }).burst(0.74, 'bear-note', 'head', [0, 20, 2], { n: 9, spread: 1, speed: 1.5 });
      P.burst(0.74, 'ring', 'body', [0, 9, 2], { scale: 2 }).burst(0.76, 'sparkle', 'body', [0, 12, 2], { n: 14, speed: 2.2 }).burst(0.74, 'bear-star', 'body', [0, 12, 3], { n: 12, speed: 2.4 });
      if (t > 0.76 && t < 1.6) P.stream('bear-confetti', 'body', [0, 16, 0], { rate: 45, dir: [0, 1, 0], spread: 1, speed: 0.9 });
      P.burst(1.12, 'dust', 'root', [0, 0.5, 1], { n: 6, speed: 0.6, spread: 1 }).burst(1.76, 'sparkle', 'head', [0, 24, 0], { n: 6 });
    } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.22, 0.65, E.inout));
      P.pos('root', 0, 0, -2.4 * k).rot('body', -15 * k + wob(t, 0.22, 4, 3, 6), 0, wave(t, 14) * 3 * k).sq('body', -0.14 * k);
      P.rot('head', -16 * k, 0, 6 * k).rot('jaw', 24 * k).pos('shades', 0, 0.7 * k, 0.2 * k).rot('shades', -10 * k, 0, 8 * k);
      arms(P, 40 * k, -20 * k);
      P.rot('browR', 0, 0, -14 * k).rot('browL', 0, 0, 14 * k).pos('browR', 0, 0.5 * k, 0).pos('browL', 0, 0.5 * k, 0);
      P.burst(0.02, 'bear-fluff', 'body', [0, 12, 3], { n: 7, speed: 1.4, tint: FUR_TINT }).burst(0.02, 'spark', 'body', [0, 11, 6], {});
    } },
    // dizzy, shades slipping, then a flop onto its side; the cap tumbles off
    faint: { len: 2.2, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.95, 1.05)), fall = seg(t, 0.95, 1.4, E.bounce);
      P.rot('body', 0, wave(t, 1.4) * 16 * dizzy, wave(t, 2) * 9 * dizzy).rot('head', 0, 0, wave(t, 2, 1) * 12 * dizzy);
      const slip = seg(t, 0.2, 0.7, E.out);
      P.pos('shades', -0.4 * slip, -1.0 * slip, 0.4 * slip).rot('shades', 8 * slip, 0, -22 * slip);
      P.rot('root', 0, 0, 82 * fall).pos('root', -2 * fall, 4.6 * fall, 0);
      arms(P, 30 * dizzy + 150 * fall, -10 * fall, 30 * dizzy + 20 * fall, 20 * fall);
      P.rot('legR', -20 * fall, 0, 0).rot('legL', 25 * fall, 0, -10 * fall).rot('jaw', 22 * fall).rot('head', 0, 0, 10 * fall);
      const cf = seg(t, 1.0, 1.6, E.out);
      P.pos('cap', -3 * cf, -2.2 * cf, 3 * cf).rot('cap', 30 * cf, 0, 40 * cf);
      P.face('eyes', 'swirl').face('lens', 'dark'); P.blinkOK = false; P.lookW = 1 - dizzy;
      P.burst(1.0, 'star', 'head', [0, 23, 0], { n: 5 }).burst(1.38, 'dust', 'root', [-8, 1, 1], { n: 8, spread: 1, speed: 0.8 });
    } },
    down: { len: 2.6, loop: true, f(P, t) {
      P.rot('root', 0, 0, 82).pos('root', -2, 4.6, 0);
      arms(P, 150, -10 + wave(t, 0.4) * 4, 20, 20); P.rot('legR', -20 + wave(t, 0.4, 1) * 5, 0, 0).rot('legL', 25, 0, -10).rot('jaw', 22).rot('head', 0, 0, 10);
      P.pos('shades', -0.4, -1.0, 0.4).rot('shades', 8, 0, -22).pos('cap', -3, -2.2, 3).rot('cap', 30, 0, 40);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.stream('star', 'head', [0, 22, 2], { rate: 1.2, spread: 0.6, speed: 0.4 });
    } },
    // graduation day: the cap goes up, a little shimmy, the cap comes down — then the cool pose
    win: { len: 2.8, next: 'idle', f(P, t) {
      const grab = seg(t, 0.05, 0.3, E.inout) * (1 - seg(t, 0.42, 0.62, E.inout)), toss = bump(t, 0.3, 0.62);
      const capT = seg(t, 0.36, 1.62, E.lin), capY = capT > 0 && capT < 1 ? Math.sin(capT * Math.PI) * 17 : 0;
      P.pos('cap', 0, capY, 0).rot('cap', 360 * seg(t, 0.36, 1.62, E.inout), 540 * seg(t, 0.36, 1.62), 0);
      if (t > 1.62) P.pos('cap', 0, wob(t, 1.62, -0.7, 3, 7), 0).sq('head', wob(t, 1.62, -0.06, 3, 7));
      P.rot('armR', -40 * grab - 60 * toss, 0, -120 * grab - 40 * toss);
      const dance = seg(t, 0.62, 0.8) * (1 - seg(t, 1.45, 1.6)), sh = Math.sin((t - 0.62) * Math.PI * 4.4);
      P.pos('body', 0, -0.6 * Math.abs(sh) * dance - 1.2 * bump(t, 0.2, 0.36), 0).rot('body', 0, sh * 10 * dance, sh * 6 * dance).sq('body', -0.05 * Math.abs(sh) * dance);
      arms(P, 30 * dance + 10 * Math.abs(sh) * dance, -50 * dance * (sh > 0 ? 1 : 0.5), 30 * dance + 10 * Math.abs(sh) * dance, -50 * dance * (sh < 0 ? 1 : 0.5));
      P.rot('head', -16 * toss - 10 * seg(t, 0.4, 1.2) * (1 - seg(t, 1.3, 1.6)), sh * 8 * dance, 0).rot('jaw', 20 * dance);
      // the pose: right paw points to the sky, left fist on the hip, one brow up
      const pose = seg(t, 1.7, 1.95, E.back) * (1 - seg(t, 2.55, 2.8, E.inout));
      P.rot('armR', -40 * pose, 0, -150 * pose).rot('armL', 20 * pose, 0, 40 * pose).rot('body', 0, -12 * pose, 0).rot('head', -6 * pose, 10 * pose, 0);
      P.rot('browL', 0, 0, -12 * pose).pos('browL', 0, 0.5 * pose, 0);
      P.face('lens', t > 2.0 && t < 2.2 ? 'shine' : undefined);
      if (t > 0.6 && t < 1.5) P.stream('bear-confetti', 'body', [0, 24, 0], { rate: 30, dir: [0, 1, 0], spread: 1, speed: 0.7 });
      P.burst(0.7, 'bear-note', 'head', [0, 22, 2], { n: 6 }).burst(1.64, 'sparkle', 'head', [0, 24, 0], { n: 8 }).burst(1.95, 'bear-star', 'armR', [-9, 24, 2], { n: 6 });
    } },
    // dozing in class: sat on the floor, head sinking, a jolt awake, sinking again
    sleep: { len: 4.0, loop: true, f(P, t) {
      const sink = seg(t, 0, 3.3, E.inout) * (1 - seg(t, 3.42, 3.6, E.out)), jolt = bump(t, 3.38, 3.7), br = Math.sin((t / 4) * TAU * 2);
      P.pos('root', 0, -2.0, 0.4).rot('legR', -84, -6, 0).rot('legL', -84, 6, 0).pos('legR', 0, 0.9, 0).pos('legL', 0, 0.9, 0);
      P.rot('body', -8 + sink * 6, 0, 0).sq('body', -0.04 + br * 0.015);
      P.rot('head', 12 + 18 * sink - 10 * jolt, 0, 4 * sink).rot('jaw', 6 * sink);
      arms(P, 4, -30 + 10 * sink, 4, -26 + 10 * sink);
      P.rot('cap', 10 * sink, 0, 0).pos('cap', 0, -0.3 * sink, 0.5 * sink);
      P.face('eyes', 'closed').face('lens', 'dark'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.6, 'z', 'head', [3, 23, 4], {}).burst(1.7, 'z', 'head', [3, 23, 4], {}).burst(2.8, 'z', 'head', [3, 23, 4], {});
      P.burst(3.4, 'sweat', 'head', [5, 21, 4], { n: 1 });
    } },
    // fidget: tips the shades up for a cool look and a wink, then slides them back with a glint
    shades: { len: 2.3, next: 'idle', f(P, t) {
      const reach = seg(t, 0.05, 0.4, E.inout) * (1 - seg(t, 0.62, 0.85, E.inout)) + seg(t, 1.45, 1.65, E.inout) * (1 - seg(t, 1.85, 2.1, E.inout));
      const lift = seg(t, 0.38, 0.62, E.back) * (1 - seg(t, 1.6, 1.8, E.in));
      P.rot('armR', -118 * reach, 10 * reach, -26 * reach).rot('head', -6 * lift, 8 * lift, 0);
      P.pos('shades', 0, 2.3 * lift, -0.6 * lift).rot('shades', -28 * lift, 0, 0);
      P.rot('browR', 0, 0, -8 * lift).rot('browL', 0, 0, 8 * lift).pos('browR', 0, 0.6 * lift, 0).pos('browL', 0, 0.9 * lift, 0);
      P.face('eyes', t > 0.95 && t < 1.25 ? 'wink' : undefined).face('lens', t > 1.8 && t < 2.0 ? 'shine' : undefined);
      P.burst(1.85, 'sparkle', 'shades', [-3, 18, 6.5], { n: 2, speed: 0.2 });
    } },
    // fidget: lifts the star, breathes on it, rubs it to a shine
    polish: { len: 2.5, next: 'idle', f(P, t) {
      const hold = seg(t, 0.1, 0.45, E.inout) * (1 - seg(t, 1.95, 2.25, E.inout)), huff = bump(t, 0.6, 1.0), rub = seg(t, 1.05, 1.15) * (1 - seg(t, 1.75, 1.85));
      P.rot('armL', -70 * hold, -10 * hold, 10 * hold).pos('medal', 0, 2.2 * hold, 1.6 * hold).rot('medal', -40 * hold, 0, 0);
      P.rot('head', 16 * hold + 6 * huff, 0, 0).rot('jaw', 18 * huff);
      P.rot('armR', -60 * rub + Math.sin(t * 26) * 10 * rub, Math.cos(t * 26) * 10 * rub, 10 * rub);
      if (t > 0.65 && t < 0.95) P.stream('steam', 'head', [0, 11, 8], { rate: 12, dir: [0, -0.4, 1], spread: 0.3, speed: 0.6, scale: 0.6 });
      P.burst(1.9, 'sparkle', 'medal', [0, 8, 6], { n: 4, speed: 0.4 }).burst(1.92, 'bear-star', 'medal', [0, 8, 6], { n: 2, speed: 0.3 });
      P.face('eyes', huff > 0.3 ? 'closed' : undefined);
    } },
    // fidget: a sharp head flick that throws the tassel over
    flick: { len: 1.3, next: 'idle', f(P, t) {
      const k = key([[0, 0], [0.14, -0.5], [0.3, 1, 'out3'], [0.62, 0.15], [1.0, 0]], t);
      P.rot('head', -6 * Math.abs(k), 0, 16 * k).rot('body', 0, 0, -4 * k).pos('body', 0, -0.4 * bump(t, 0, 0.3), 0);
      P.rot('browL', 0, 0, -10 * bump(t, 0.3, 1.0)).pos('browL', 0, 0.4 * bump(t, 0.3, 1.0), 0);
      P.face('lens', t > 0.42 && t < 0.58 ? 'shine' : undefined);
    } },
  },
};
def.anim = anim;
