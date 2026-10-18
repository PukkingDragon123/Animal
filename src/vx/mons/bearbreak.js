// Bearbreak — stage 2 of the bear line (Echo). The cub grew up and the colour drained out: a
// lanky grey teen bear in a long, minimal charcoal coat over a pale knit, sleek grey fur, its
// shutter shades pushed up on its head, heavy-lidded eyes that rarely look up. One red thing
// is left in its world — a deflated heart balloon it never lets go of, drifting on a string at
// its shoulder. It sways alone, sighs, and sings its sorrow through an auto-tuned shockwave
// while the balloon glows. An original design that winks at a rapper's heartbreak album.
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { fur, fringe, halo, shutter, eye, fill, wrapX, isSide, edgeLine } from './bear_parts.js';
import { shade, poly, ramp, shift, mix, h2 } from './kit.js';

const C = {
  fur: '#8c8c93', furHi: '#b2b2b8', furLo: '#606068', furEdge: '#4c4c55', furTip: '#c6c6cc', furLite: '#a4a4ab',
  muz: '#c9c6c0', muzHi: '#e2dfda', muzLo: '#a29f99', muzLine: '#5e5c5a',
  nose: '#26262c', noseHi: '#4e4e58', noseSpec: '#a8a8b4',
  inEar: '#b4aeb0', inEarLo: '#8e888c',
  coat: '#4a4c55', coatHi: '#676a75', coatLo: '#34353c', coatLine: '#232429', coatSeam: '#3e4048',
  knit: '#bdbcb7', knitHi: '#d8d7d2', knitLo: '#94938e', knitLine: '#7a7974',
  pants: '#393a42', pantsHi: '#50525c', pantsLo: '#27282e',
  shoe: '#d2d2d0', shoeHi: '#f0f0ee', shoeLo: '#a2a2a4', shoePanel: '#8a8a90', sole: '#f4f4f0', soleLo: '#b8b8b6',
  shade: '#d4d6dc', shadeHi: '#ffffff', shadeLo: '#8e9098', lensGap: '#3a3c46',
  red: '#d42230', redHi: '#ff5a5e', redLo: '#8e1222', redDeep: '#5c0a18', redSpec: '#ffd4d6', crease: '#a8182a',
  glow: '#ff4a52', glowHi: '#ffd0d0', glowLo: '#e0202e',
  string: '#e8e6e2',
  ink: '#16141a', mouth: '#2e1a20', tongue: '#b8606a',
};

// ---------------------------------------------------------------- painters
const furP = (seed, o = {}) => fur(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furEdge, tip: C.furTip, lite: C.furLite, s: 9, tipH: 3.5, pt: 0.6, seed, ...o });
const headFur = furP(12), headFur2 = furP(24, { s: 8 });
const fuzz = (seed, o = {}) => fringe(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furEdge, tip: C.furTip, seed, tw: 3.4, short: 0.55, ...o });
const headHalo = halo(C.fur, { hi: C.furHi, lo: C.furLo, line: C.furEdge, tip: C.furTip, n: 24, depth: 0.11, inner: 0.8, sq: 2.6, seed: 6 });
const muzP = fur(C.muz, { hi: C.muzHi, lo: C.muzLo, line: shift(C.muz, -0.14), lite: C.muzHi, ramp: [C.muzHi, C.muz, C.muz, shift(C.muz, -0.06)], s: 8, rowH: 6, tipH: 2.5, seed: 9, y0: 2 });
// a long muzzle with a flat, slightly downturned mouth
const muzFront = (p, w, h, face, cube) => {
  muzP(p, w, h, face, cube);
  if (face !== 'south') return;
  const cx = Math.floor(w / 2), y0 = h - 5, L = C.muzLine;
  p.vl(cx, y0 - 1, y0, L);
  p.hl(cx - 3, cx + 3, y0 + 1, L); p.px(cx - 4, y0 + 2, L); p.px(cx + 4, y0 + 2, L);
  p.hl(cx - 2, cx + 2, y0 + 2, shift(C.muz, -0.14));
};
// the face: sleek fur with tired shadows under the eyes
const faceP = (p, w, h, face, cube) => {
  headFur2(p, w, h, face, cube);
  if (face !== 'south') return;
  const ey = Math.round(h * 0.47);
  for (const ex of [Math.round(w * 0.27), Math.round(w * 0.73)]) { p.hl(ex - 3, ex + 2, ey, C.furLo); p.hl(ex - 2, ex + 1, ey + 1, shift(C.furLo, 0.1)); }
};
const noseP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? C.noseHi : face === 'down' ? '#121216' : y === 0 ? C.noseHi : y >= h - 1 ? '#121216' : C.nose));
  if (face === 'south' && w > 3) { p.px(1, 1, C.noseSpec); p.px(2, 1, C.noseHi); }
};
const earP = (seed) => { const f = furP(seed, { s: 6, tipH: 2.5 }); return (p, w, h, face, cube) => {
  f(p, w, h, face, cube);
  if (face !== 'south') return;
  const cx = w / 2, cy = h / 2 + 0.3, rx = w / 2 - 1.8, ry = h / 2 - 1.8;
  fill(p, w, h, (x, y) => { const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2; return d < 1 ? (d < 0.45 ? C.inEarLo : C.inEar) : null; });
}; };
const browP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? C.furHi : y === 0 ? C.furLo : '#3c3c44'));

// the coat: clean charcoal wool, a soft lit shoulder, darts and a dark hem; the front opens in a long V over the knit
const coatBase = shade(C.coat, { top: C.coatHi, bottom: C.coatLo, grain: 0.02 });
const coatP = (o = {}) => (p, w, h, face, cube) => {
  coatBase(p, w, h, face, cube);
  if (!isSide(face)) return;
  if (o.hem) { for (let x = 0; x < w; x++) { p.px(x, h - 1, C.coatLine); p.px(x, h - 2, C.coatSeam); } }
  if (o.dart && (face === 'east' || face === 'west')) for (let y = 2; y < h - 2; y++) p.px(Math.floor(w / 2), y, C.coatSeam);
  if (o.pocket && face === 'south') { const py = Math.round(h * 0.22); p.hl(1, w - 2, py, C.coatLine); p.hl(1, w - 2, py - 1, C.coatHi); }
  if (o.cuff) { const cy = h - 3; p.hl(0, w - 1, cy, C.coatLine); p.hl(0, w - 1, cy + 1, C.coatHi); }
  if (o.vent && face === 'north') for (let y = Math.floor(h * 0.4); y < h; y++) p.px(Math.floor(w / 2), y, C.coatLine);
};
const knitAt = (x, y, h) => { const t = h > 1 ? y / (h - 1) : 0.5, c = ramp([C.knitHi, C.knit, C.knit, C.knitLo], t, x, y); return x % 2 ? shift(c, -0.08) : c; };
const torsoP = (p, w, h, face, cube) => {
  coatP({ dart: true })(p, w, h, face, cube);
  if (face !== 'south') return;
  const cx = (w - 1) / 2;
  for (let y = 0; y < h; y++) {
    const half = 1 + (1 - y / (h - 1)) ** 1.3 * 6;
    for (let x = 0; x < w; x++) {
      const d = Math.abs(x - cx);
      if (d < half - 0.5) p.px(x, y, y < 3 && d < 3 ? (y === 0 ? C.knitHi : C.knitLo) : knitAt(x, y, h));
      else if (d < half + 0.5) p.px(x, y, C.coatHi);                        // the lapel's lit fold
      else if (d < half + 1.5 && y < h * 0.62) p.px(x, y, C.coatLo);         // the lapel's shadow
    }
  }
  p.px(Math.round(cx), h - 2, C.coatLine); p.px(Math.round(cx) + 1, h - 2, C.coatLine);   // the one button
};
const collarP = (p, w, h, face, cube) => { coatBase(p, w, h, face, cube); if (face === 'up') fill(p, w, h, (x, y) => (x > 1 && x < w - 2 && y > 1 && y < h - 2 ? C.knitLo : null)); if (face === 'south') fill(p, w, h, (x, y) => (Math.abs(x - (w - 1) / 2) < 3 ? knitAt(x, y, h) : null)); };
const sleeveP = coatP({ cuff: true });
const pantsP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? C.pantsHi : face === 'down' ? C.pantsLo : ramp([C.pantsHi, C.pants, C.pants, C.pantsLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (face === 'south' || face === 'north') for (let y = 1; y < h; y++) p.px(Math.floor(w / 2), y, y % 4 === 0 ? C.pants : C.pantsHi);
};
// high-top sneakers: pale grey upper, a darker grey side panel, white sole, laces — no logos
const shoeP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? C.shoeHi : face === 'down' ? C.soleLo : y >= h - 2 ? (y === h - 1 ? C.soleLo : C.sole) : ramp([C.shoeHi, C.shoe, C.shoeLo], y / Math.max(1, h - 3), x, y)));
  if ((face === 'east' || face === 'west') && h > 3) for (let x = Math.floor(w * 0.3); x < Math.floor(w * 0.75); x++) for (let y = 1; y < h - 2; y++) if (x - w * 0.3 < y * 1.6 + 2) p.px(x, y, C.shoePanel);
  if (face === 'up') for (let y = 1; y < Math.floor(h * 0.6); y += 2) { p.px(Math.floor(w / 2) - 1, y, C.shoePanel); p.px(Math.floor(w / 2), y, C.shoePanel); }
};
const upperP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? C.shoeLo : ramp([C.shoeHi, C.shoe], y / Math.max(1, h - 1), x, y)));
  if (face === 'south') { for (let y = 0; y < h; y++) p.px(Math.floor(w / 2), y, C.shoePanel); for (let y = 1; y < h; y += 2) { p.px(Math.floor(w / 2) - 1, y, C.shoePanel); p.px(Math.floor(w / 2) + 1, y, C.shoePanel); } }
  if (face === 'east' || face === 'west') fill(p, w, h, (x, y) => (Math.abs(x - w / 2) < 2 && y > 0 ? C.shoePanel : null));
};
const pawP = (seed) => furP(seed, { s: 6, tipH: 2.5 });
const mouthP = (p, w, h) => fill(p, w, h, (x, y) => (y === 0 ? C.mouth : x > 0 && x < w - 1 && y > 0 ? C.tongue : '#4a2028'));
// the heart balloon: glossy red, wrinkled where it has lost its air; a hot glowing twin for the special
const heartP = (glow) => (p, w, h, face) => {
  const [hi, base, lo, deep] = glow ? [C.glowHi, C.glow, C.glowLo, C.redLo] : [C.redHi, C.red, C.redLo, C.redDeep];
  fill(p, w, h, (x, y) => (face === 'up' ? hi : face === 'down' ? lo : ramp([hi, base, base, lo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (face === 'down') return;
  if (!glow) for (let k = 0; k < 3; k++) { const y0 = Math.round(h * (0.3 + k * 0.22)); for (let x = 1 + k; x < w - 1; x += 3) p.px(x, Math.min(h - 1, y0 + ((x >> 1) % 2)), C.crease); }
  if (face === 'south' || face === 'west') { p.px(1, 1, C.redSpec); p.px(2, 1, glow ? '#ffffff' : C.redSpec); p.px(1, 2, hi); }
  if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, h - 1, deep);
};
const stringP = (p, w, h) => fill(p, w, h, (x, y) => (y % 3 === 0 ? '#b8b6b2' : C.string));
const knotP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? C.redHi : y === h - 1 ? C.redDeep : C.redLo));
const lens = shutter({ frame: C.shade, hi: C.shadeHi, lo: C.shadeLo, gap: C.lensGap, gapLo: '#4e5060', bar: 2, round: 4, bridge: 1.5 });
const barP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? C.shadeHi : face === 'down' ? C.shadeLo : y === 0 ? C.shadeHi : y === h - 1 ? C.shadeLo : C.shade));
// a single tear track (toggled)
const tearP = (f) => (p, w, h) => { for (let y = 0; y < h; y++) { const c = (y + f) % 4 === 0 ? '#ffffff' : '#9ad8f4'; p.px(0, y, c); if (y > h * 0.6) p.px(1, y, '#5aa8d8'); } };

// eyes: simple Pokémon-style — dark shapes, one glint, the lid cut by the shape (6 × 5 texels)
const EI = { ink: '#141218' };
const EYES = {
  mope: eye('cut', { ...EI, cut: 0.44, slope: 0.42, gx: 0.6 }),
  wide: eye('oval', EI),
  glare: eye('cut', { ...EI, cut: 0.4, slope: -0.55 }),
  closed: eye('closed', { ...EI, bend: 0.12, slope: 0.3 }),
  soft: eye('happy', { ...EI, bend: 0.36 }),
  swirl: eye('swirl', EI),
  x: eye('x', EI),
};

// ---------------------------------------------------------------- the model
const B = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const eyeStates = (side) => Object.entries(EYES).map(([k, fn]) => B(side < 0 ? [-3.25, 31.0, 4.63] : [1.25, 31.0, 4.63], [2.0, 1.7, 0], fn, { plane: 'z', mirror: side > 0, id: (side < 0 ? 'eyeR-' : 'eyeL-') + k, hide: k !== 'mope' }));
// the heart balloon, centred at x = −7, built of lobes; a glowing twin (inflated) toggles on for the special
const HX = -7.0;
const heartCubes = (glow) => [
  B([HX - 1.2, 23.5, 0.1], [2.4, 1.4, 1.8], heartP(glow)),
  B([HX - 2.6, 24.7, -0.1], [5.2, 2.2, 2.2], heartP(glow)),
  B([HX - 3.5, 26.6, -0.3], [3.5, 3.2, 2.6], heartP(glow)),
  B([HX, 26.3, -0.3], [3.4, 2.9, 2.6], heartP(glow)),
  B([HX - 2.9, 25.6, -0.2], [5.8, 1.4, 2.4], heartP(glow)),
].map((c) => (glow ? { ...c, glow: true, inflate: 0.12, id: 'heart-glow', hide: true } : { ...c, id: 'heart-dull' }));
export const def = {
  name: 'bearbreak', ppu: 3, scale: 0.42, outline: { color: '#141318', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    // legs: thigh → shin → foot (high-tops)
    { name: 'thighR', parent: 'root', pivot: [-2.0, 15.2, 0], cubes: [B([-3.35, 8.4, -1.4], [2.7, 7.2, 2.8], pantsP)] },
    { name: 'shinR', parent: 'thighR', pivot: [-2.0, 8.6, 0], cubes: [B([-3.25, 1.7, -1.3], [2.5, 7.1, 2.6], pantsP)] },
    { name: 'footR', parent: 'shinR', pivot: [-2.0, 1.7, 0], cubes: [B([-3.6, 0, -1.9], [3.2, 1.5, 5.0], shoeP), B([-3.45, 1.3, -1.7], [2.9, 1.9, 3.6], upperP)] },
    { name: 'thighL', parent: 'root', pivot: [2.0, 15.2, 0], cubes: [B([0.65, 8.4, -1.4], [2.7, 7.2, 2.8], pantsP)] },
    { name: 'shinL', parent: 'thighL', pivot: [2.0, 8.6, 0], cubes: [B([0.75, 1.7, -1.3], [2.5, 7.1, 2.6], pantsP)] },
    { name: 'footL', parent: 'shinL', pivot: [2.0, 1.7, 0], cubes: [B([0.4, 0, -1.9], [3.2, 1.5, 5.0], shoeP, { mirror: true }), B([0.55, 1.3, -1.7], [2.9, 1.9, 3.6], upperP, { mirror: true })] },
    { name: 'body', parent: 'root', pivot: [0, 15.2, 0], cubes: [
      B([-4.6, 13.8, -2.9], [9.2, 12.4, 5.6], coatP({ dart: true, vent: true }), { faces: { south: torsoP } }),
      B([-5.0, 23.4, -2.6], [10.0, 2.6, 5.0], coatP()),
      B([-3.3, 25.4, -2.5], [6.6, 2.5, 5.2], collarP),
    ] },
    // the coat skirt: three panels that swing
    { name: 'coatB', parent: 'body', pivot: [0, 14.2, -2.9], cubes: [B([-4.6, 6.6, -3.15], [9.2, 7.8, 0.55], coatP({ hem: true, vent: true }))] },
    { name: 'coatR', parent: 'body', pivot: [-4.6, 14.2, 0], cubes: [B([-4.85, 6.6, -2.9], [0.55, 7.8, 5.4], coatP({ hem: true })), B([-4.85, 6.6, 2.15], [2.6, 7.8, 0.55], coatP({ hem: true, pocket: true }))] },
    { name: 'coatL', parent: 'body', pivot: [4.6, 14.2, 0], cubes: [B([4.3, 6.6, -2.9], [0.55, 7.8, 5.4], coatP({ hem: true })), B([2.25, 6.6, 2.15], [2.6, 7.8, 0.55], coatP({ hem: true, pocket: true }))] },
    // arms: upper → fore (sleeve, cuff, paw)
    { name: 'armR', parent: 'body', pivot: [-5.1, 25.0, 0], cubes: [B([-6.5, 18.8, -1.45], [2.7, 6.6, 2.9], sleeveP)] },
    { name: 'foreR', parent: 'armR', pivot: [-5.15, 19.2, 0], cubes: [B([-6.45, 13.2, -1.4], [2.6, 6.2, 2.8], sleeveP), B([-6.3, 10.8, -1.2], [2.3, 2.5, 2.4], pawP(51))] },
    { name: 'armL', parent: 'body', pivot: [5.1, 25.0, 0], cubes: [B([3.8, 18.8, -1.45], [2.7, 6.6, 2.9], sleeveP)] },
    { name: 'foreL', parent: 'armL', pivot: [5.15, 19.2, 0], cubes: [B([3.85, 13.2, -1.4], [2.6, 6.2, 2.8], sleeveP), B([4.0, 10.8, -1.2], [2.3, 2.5, 2.4], pawP(53), { mirror: true })] },
    // the balloon on its string, held in the right paw
    { name: 'string1', parent: 'foreR', pivot: [-5.4, 11.8, 0.9], rot: [-4, 0, 20], cubes: [B([-5.5, 11.8, 0.8], [0.2, 6.0, 0.2], stringP, { outline: false })] },
    { name: 'string2', parent: 'string1', pivot: [-5.4, 17.8, 0.9], rot: [0, 0, -12], cubes: [B([-5.5, 17.8, 0.8], [0.2, 5.4, 0.2], stringP, { outline: false })] },
    { name: 'balloon', parent: 'string2', pivot: [-5.4, 23.2, 0.9], rot: [0, 0, -8], cubes: [
      B([-5.8, 22.9, 0.5], [0.8, 0.8, 0.8], knotP),
      ...heartCubes(false), ...heartCubes(true),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 26.6, 0.4], cubes: [
      B([-4.8, 27.0, -4.0], [9.6, 8.6, 8.0], headFur),
      B([-5.3, 28.0, -3.4], [10.6, 5.6, 6.8], headFur2),
      B([-4.0, 26.6, -3.4], [8.0, 9.6, 6.8], headFur),
      B([-4.0, 27.6, -4.6], [8.0, 7.6, 9.2], headFur2, { faces: { south: faceP } }),
      B([-6.2, 25.9, 0.2], [12.4, 11.0, 0], headHalo, { plane: 'z' }),
      B([0.2, 25.9, -5.6], [0, 11.0, 11.0], headHalo, { plane: 'x' }),
      B([-2.2, 27.4, 4.3], [4.4, 2.9, 2.6], muzP, { faces: { south: muzFront } }),
      B([-1.8, 30.1, 4.3], [3.6, 0.5, 2.1], muzP),
      B([-1.1, 29.5, 6.55], [2.2, 1.1, 1.0], noseP),
      B([-0.6, 29.0, 6.5], [1.2, 0.6, 0.9], noseP),
      ...eyeStates(-1), ...eyeStates(1),
      ...[0, 1, 2].map((f) => B([-2.6, 27.6, 4.66], [0.5, 3.4, 0], tearP(f), { plane: 'z', id: 'tear-' + 'abc'[f], hide: true })),
      B([-4.5, 26.5, 4.0], [3.0, 1.1, 0], fuzz(81), { plane: 'z' }),
      B([1.5, 26.5, 4.0], [3.0, 1.1, 0], fuzz(83), { plane: 'z', mirror: true }),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 27.9, 4.6], cubes: [
      B([-1.8, 26.7, 4.2], [3.6, 1.3, 2.4], muzP),
      B([-1.6, 27.65, 4.25], [3.2, 0.35, 2.2], mouthP, { outline: false }),
    ] },
    { name: 'browR', parent: 'head', pivot: [-2.3, 33.3, 4.6], rot: [0, 0, 12], cubes: [B([-3.75, 32.95, 4.35], [2.9, 0.65, 0.6], browP)] },
    { name: 'browL', parent: 'head', pivot: [2.3, 33.3, 4.6], rot: [0, 0, -12], cubes: [B([0.85, 32.95, 4.35], [2.9, 0.65, 0.6], browP)] },
    { name: 'earR', parent: 'head', pivot: [-4.2, 34.0, -1.0], rot: [0, 0, 30], cubes: [B([-6.6, 33.4, -1.7], [3.8, 2.6, 1.4], earP(61)), B([-6.1, 32.9, -1.7], [2.8, 3.6, 1.4], earP(62))] },
    { name: 'earL', parent: 'head', pivot: [4.2, 34.0, -1.0], rot: [0, 0, -30], cubes: [B([2.8, 33.4, -1.7], [3.8, 2.6, 1.4], earP(63), { mirror: true }), B([3.3, 32.9, -1.7], [2.8, 3.6, 1.4], earP(64), { mirror: true })] },
    // the shades, pushed up and resting on top of the head (lenses face the sky)
    { name: 'shades', parent: 'head', pivot: [0, 36.0, -0.8], rot: [-74, 0, 0], cubes: [
      B([-4.9, 35.7, -1.05], [9.8, 0.6, 0.5], barP),
      B([-4.9, 33.1, -0.82], [9.8, 2.85, 0], lens, { plane: 'z' }),
      B([-5.35, 35.75, -4.6], [0.4, 0.45, 3.6], barP),
      B([4.95, 35.75, -4.6], [0.4, 0.45, 3.6], barP),
    ] },
  ],
};

// ---------------------------------------------------------------- animation
const TAU = Math.PI * 2, LEG = 6.8;
const GREY = [0.62, 0.62, 0.66];
// bend both knees so the hips drop by d while the feet stay planted
function knees(P, d, sides = ['R', 'L']) {
  const th = (Math.acos(Math.max(-1, Math.min(1, 1 - Math.max(0, d) / (2 * LEG)))) * 180) / Math.PI;
  for (const s of sides) P.pos('thigh' + s, 0, -d, 0).rot('thigh' + s, -th, 0, 0).rot('shin' + s, 2 * th, 0, 0).rot('foot' + s, -th, 0, 0);
}
// the resting stance: right paw holding the string a little forward, left paw in the coat pocket
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
    { bone: 'earR', tip: [-1, 2, 0], k: 220, d: 11, gain: 0.5, max: 10 },
    { bone: 'earL', tip: [1, 2, 0], k: 220, d: 11, gain: 0.5, max: 10 },
  ],
  faces: {
    eyes: { default: 'mope', states: Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eyeR-' + k, 'eyeL-' + k]])) },
    heart: { default: 'dull', states: { dull: ['heart-dull'], glow: ['heart-glow'] } },
    tear: { default: 'off', states: { off: [], a: ['tear-a'], b: ['tear-b'], c: ['tear-c'] } },
  },
  fidget: { every: [6, 10], clips: ['sigh', 'look'] },
  clips: {
    // alone with its thoughts: a slow weight shift, head hung, the balloon bobbing at its shoulder
    idle: { len: 4.0, loop: true, f(P, t) {
      const sw = wave(t, 0.25), sw2 = wave(t, 0.25, 1.4), lookUp = bump(t, 1.1, 2.4);
      stance(P); drift(P, t);
      P.pos('body', sw * 0.35, -0.15 + Math.abs(sw) * 0.1, 0).rot('body', 5, sw2 * 3, -sw * 1.6);
      knees(P, 0.25 + Math.max(0, sw) * 0.5, ['L']); knees(P, 0.25 + Math.max(0, -sw) * 0.5, ['R']);
      P.rot('head', 13 - 16 * lookUp, -10 * lookUp + sw2 * 3, 4 * lookUp - sw * 2);
      P.rot('armR', -sw * 2, 0, 0).rot('browR', 0, 0, 4 * lookUp).rot('browL', 0, 0, -4 * lookUp);
      P.face('eyes', lookUp > 0.6 ? 'wide' : undefined);
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
    } },
    // the wail: a breath in, the head thrown back, an auto-tuned cry rippling out
    cry: { len: 2.4, next: 'idle', f(P, t) {
      const inhale = seg(t, 0, 0.45, E.inout) * (1 - seg(t, 0.45, 0.6)), wail = seg(t, 0.45, 0.7, E.back) * (1 - seg(t, 1.8, 2.3, E.inout));
      stance(P, 1 - 0.6 * wail); drift(P, t, 1.4);
      P.pos('body', 0, 0.5 * inhale + 0.3 * wail, 0).rot('body', 5 - 6 * inhale - 8 * wail, 0, 0).sq('body', 0.03 * inhale);
      P.rot('head', 13 - 10 * inhale - 40 * wail + wave(t, 6) * 2 * wail, 0, wave(t, 3) * 3 * wail).rot('jaw', 6 * inhale + 34 * wail + wave(t, 9) * 4 * wail);
      P.rot('armL', -10 * wail, 0, 30 * wail).rot('foreL', -20 * wail, 0, 10 * wail).rot('armR', 0, 0, -20 * wail);
      P.rot('browR', 0, 0, 10 * wail).rot('browL', 0, 0, -10 * wail);
      P.face('eyes', wail > 0.3 ? 'closed' : undefined).face('tear', wail > 0.3 ? 'abc'[Math.floor(t * 8) % 3] : 'off'); P.lookW = 1 - wail;
      for (const tb of [0.62, 1.0, 1.38]) P.burst(tb, 'bear-tune', 'head', [0, 30, 5], { n: 1 });
      if (wail > 0.4) P.stream('bear-bluenote', 'head', [0, 33, 4], { rate: 6, spread: 0.8 });
      P.burst(0.7, 'tear', 'head', [-2.4, 30.5, 5], { n: 4, dir: [-1, 0.6, 0.5], speed: 1.4 }).burst(0.7, 'tear', 'head', [2.4, 30.5, 5], { n: 4, dir: [1, 0.6, 0.5], speed: 1.4 });
    } },
    // the heartbreak hook: the left paw leaves the pocket, the body coils, then a long looping hook
    attack: { len: 1.1, next: 'idle', f(P, t) {
      const wind = seg(t, 0, 0.34, E.inout) * (1 - seg(t, 0.34, 0.42, E.in)), hit = seg(t, 0.34, 0.48, E.in3) * (1 - seg(t, 0.62, 1.05, E.inout));
      stance(P, 1 - Math.max(wind, hit) * 0.5); drift(P, t, 1);
      P.pos('root', 0, 0, -1.2 * wind + 4.5 * hit).rot('body', -4 * wind + 10 * hit, -24 * wind + 30 * hit, 3 * wind - 4 * hit);
      P.rot('armL', 30 * wind - 82 * hit, 0, 50 * wind - 30 * hit).rot('foreL', -50 * wind + 4 * hit, 0, 12 * wind);
      P.rot('head', -6 * wind + 6 * hit, 16 * wind - 18 * hit, 0).rot('jaw', 10 * hit);
      P.rot('thighR', -16 * hit, 0, 0).rot('shinR', 18 * hit, 0, 0).rot('thighL', 12 * wind + 10 * hit, 0, 0);
      P.rot('coatR', -18 * hit, 0, -10 * hit).rot('coatL', 10 * wind, 0, 16 * hit).rot('coatB', 14 * hit, 0, 0);
      P.face('eyes', wind > 0.2 || hit > 0.2 ? 'glare' : undefined);
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
      P.rot('head', 10 * dip - 34 * sing + wave(t, 5) * 2 * sing, 0, 0).rot('jaw', 30 * sing + wave(t, 7.5) * 5 * sing);
      P.rot('armL', -16 * sing, 0, 40 * sing).rot('foreL', -30 * sing, 0, 0);
      P.face('heart', lift > 0.35 && sing > 0.05 ? 'glow' : 'dull').face('eyes', sing > 0.3 ? 'closed' : undefined); P.lookW = 1 - sing;
      for (const tb of [1.0, 1.35, 1.7, 2.05]) { P.burst(tb, 'bear-tunered', 'balloon', [-7, 27, 1], { n: 1, scale: 1.4 }); P.burst(tb + 0.1, 'bear-tune', 'body', [0, 22, 3], { n: 1, scale: 1.8 }); }
      if (sing > 0.3) P.stream('bear-bluenote', 'head', [0, 33, 4], { rate: 7, spread: 1 }).stream('bear-heart', 'balloon', [-7, 27, 1], { rate: 4, spread: 0.8 });
      P.burst(0.9, 'sparkle', 'balloon', [-7, 27, 1], { n: 8, speed: 1.2 });
    } },
    hurt: { len: 0.7, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.24, 0.7, E.inout));
      stance(P); drift(P, t, 1.5);
      P.pos('root', 0, 0, -2.2 * k).rot('body', -14 * k + wob(t, 0.24, 3, 3, 6), 0, wave(t, 13) * 3 * k).rot('head', -18 * k, 0, 8 * k).rot('jaw', 16 * k);
      P.rot('armL', -10 * k, 0, 40 * k).rot('coatB', -16 * k, 0, 0).rot('coatR', 10 * k, 0, 0).rot('coatL', 10 * k, 0, 0);
      P.rot('browR', 0, 0, 12 * k).rot('browL', 0, 0, -12 * k);
      P.face('eyes', t < 0.4 ? 'x' : undefined);
      P.burst(0.02, 'bear-fluff', 'body', [0, 22, 3], { n: 6, speed: 1.3, tint: GREY }).burst(0.02, 'spark', 'body', [0, 21, 4], {});
    } },
    // the knees give, it sinks to the floor and tips over; the balloon sinks with it
    faint: { len: 2.6, next: 'down', f(P, t) {
      const sway = seg(t, 0, 0.3) * (1 - seg(t, 0.6, 0.7)), kneel = seg(t, 0.55, 1.05, E.in), tip = seg(t, 1.2, 1.7, E.bounce);
      stance(P, 1 - kneel * 0.5); drift(P, t, 0.5);
      P.rot('body', 0, wave(t, 1.3) * 10 * sway, wave(t, 1.8) * 6 * sway).rot('head', 10 * kneel, 0, wave(t, 1.8, 1) * 10 * sway);
      P.pos('thighR', 0, -6.6 * kneel, 0).pos('thighL', 0, -6.6 * kneel, 0).pos('body', 0, -6.6 * kneel, 0);
      P.rot('thighR', -84 * kneel, 0, 0).rot('thighL', -84 * kneel, 0, 0).rot('shinR', 84 * kneel, 0, 0).rot('shinL', 84 * kneel, 0, 0).rot('footR', 40 * kneel, 0, 0).rot('footL', 40 * kneel, 0, 0);
      P.rot('body', 18 * kneel, 0, 0).rot('coatB', -30 * kneel, 0, 0).rot('coatR', -40 * kneel, 0, 0).rot('coatL', -40 * kneel, 0, 0);
      P.rot('root', 0, 0, 78 * tip).pos('root', -3 * tip, 3.4 * tip, 0);
      P.rot('armL', -30 * tip, 0, -10 * tip).rot('armR', 0, 0, -50 * tip);
      P.rot('string1', 0, 0, 60 * seg(t, 1.0, 2.0)).rot('string2', 0, 0, 40 * seg(t, 1.0, 2.0)).scl('balloon', 1, 1 - 0.25 * seg(t, 1.2, 2.4), 1);
      P.face('eyes', t > 0.6 ? 'swirl' : undefined); P.blinkOK = t < 0.6; P.lookW = 1 - kneel;
      P.burst(1.05, 'dust', 'root', [0, 1, 2], { n: 6, spread: 1 }).burst(1.68, 'dust', 'root', [-8, 1, 1], { n: 8, spread: 1, speed: 0.8 }).burst(1.2, 'star', 'head', [0, 37, 0], { n: 4 });
    } },
    down: { len: 3.0, loop: true, f(P, t) {
      stance(P, 0.5); drift(P, t, 0.3);
      P.pos('thighR', 0, -6.6, 0).pos('thighL', 0, -6.6, 0).pos('body', 0, -6.6, 0).rot('body', 18, 0, 0).rot('head', 10, 0, 0);
      P.rot('thighR', -84, 0, 0).rot('thighL', -84, 0, 0).rot('shinR', 84, 0, 0).rot('shinL', 84, 0, 0).rot('footR', 40, 0, 0).rot('footL', 40, 0, 0);
      P.rot('coatB', -30, 0, 0).rot('coatR', -40, 0, 0).rot('coatL', -40, 0, 0).rot('root', 0, 0, 78).pos('root', -3, 3.4, 0);
      P.rot('armL', -30 + wave(t, 0.33) * 3, 0, -10).rot('armR', 0, 0, -50).rot('string1', 0, 0, 60).rot('string2', 0, 0, 40).scl('balloon', 1, 0.75, 1);
      P.face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.6;
    } },
    // a rare good moment: the balloon fills and rises, the bear looks up and almost smiles
    win: { len: 3.2, next: 'idle', f(P, t) {
      const up = seg(t, 0.2, 0.9, E.back) * (1 - seg(t, 2.5, 3.2, E.inout)), nod = bump(t, 1.4, 1.9), sway = seg(t, 1.0, 1.3) * (1 - seg(t, 2.4, 2.8));
      stance(P); drift(P, t, 1 - up * 0.5);
      inflate(P, up); P.rot('string1', 0, 0, -16 * up).rot('string2', 0, 0, 10 * up).pos('string1', 0, 1.5 * up, 0);
      P.rot('head', 13 - 30 * up + 10 * nod, -14 * up, 4 * up).rot('body', 5 - 7 * up, wave(t, 0.8) * 5 * sway, wave(t, 0.8, 1) * 3 * sway).pos('body', 0, 0.3 * up, 0);
      P.rot('browR', 0, 0, -6 * up).rot('browL', 0, 0, 6 * up);
      P.face('eyes', up > 0.5 ? 'soft' : undefined).face('heart', up > 0.6 && t < 2.4 ? 'glow' : 'dull');
      if (up > 0.5) P.stream('bear-heart', 'balloon', [-7, 27, 1], { rate: 3, spread: 0.7 });
      P.burst(0.7, 'sparkle', 'balloon', [-7, 28, 1], { n: 6 }).burst(1.5, 'bear-bluenote', 'head', [0, 34, 3], { n: 3 });
    } },
    // asleep on the floor, knees hugged to its chest, the balloon tied to its wrist hovering over it
    sleep: { len: 4.0, loop: true, f(P, t) {
      const br = Math.sin((t / 4) * TAU);
      P.pos('root', 0, -11.6, 0).rot('body', 22 + br * 1.5, 0, 0);
      P.pos('thighR', 0, -1.0, 0).pos('thighL', 0, -1.0, 0).rot('thighR', -112, 6, 0).rot('thighL', -112, -6, 0).rot('shinR', 118, 0, 0).rot('shinL', 118, 0, 0).rot('footR', -6, 0, 0).rot('footL', -6, 0, 0);
      P.rot('armR', -58, 0, 16).rot('foreR', -70, 0, 26).rot('armL', -58, 0, -16).rot('foreL', -70, 0, -26); str(P, 128, -42);
      P.rot('coatB', -20, 0, 0).rot('coatR', -60, 0, -10).rot('coatL', -60, 0, 10);
      P.rot('head', 22 + br * 2, 0, 8).rot('jaw', 2);
      drift(P, t, 0.6);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.burst(0.5, 'z', 'head', [3, 36, 4], {}).burst(1.8, 'z', 'head', [3, 36, 4], {}).burst(3.1, 'z', 'head', [3, 36, 4], {});
    } },
    // fidget: a long sigh — shoulders up, breath in, then everything drops
    sigh: { len: 2.6, next: 'idle', f(P, t) {
      const inn = seg(t, 0.1, 0.9, E.inout) * (1 - seg(t, 1.0, 1.5, E.in)), drop = seg(t, 1.0, 1.5, E.out) * (1 - seg(t, 2.0, 2.6, E.inout));
      stance(P); drift(P, t);
      P.pos('body', 0, 0.6 * inn - 0.5 * drop, 0).sq('body', 0.04 * inn - 0.03 * drop).rot('body', 5 - 4 * inn + 6 * drop, 0, 0);
      P.rot('armR', 0, 0, 4 * inn).rot('armL', 0, 0, -4 * inn).rot('head', 13 - 12 * inn + 10 * drop, 0, 0).rot('jaw', 8 * drop);
      knees(P, 0.6 * drop);
      P.face('eyes', inn > 0.5 ? 'closed' : undefined);
      if (t > 1.05 && t < 1.6) P.stream('steam', 'head', [0, 27.5, 7], { rate: 10, dir: [0, -0.3, 1], spread: 0.3, speed: 0.5, scale: 0.7 });
    } },
    // fidget: looks up at the balloon, nudges it with a paw, watches it bob, looks away
    look: { len: 3.0, next: 'idle', f(P, t) {
      const look = seg(t, 0.1, 0.5, E.inout) * (1 - seg(t, 2.4, 2.9, E.inout)), tap = bump(t, 0.9, 1.5);
      stance(P); drift(P, t, 1);
      P.rot('head', 13 - 26 * look, -28 * look, 6 * look).rot('body', 5 - 3 * look, -8 * look, 0);
      P.rot('armL', -30 * tap, 0, -60 * tap).rot('foreL', -50 * tap, 0, -20 * tap);
      P.rot('string2', 30 * bump(t, 1.2, 1.7), 0, -20 * bump(t, 1.2, 1.9)).rot('balloon', 0, 30 * bump(t, 1.2, 2.2), 0);
      P.face('eyes', look > 0.5 && t < 2.2 ? 'wide' : undefined);
      P.burst(1.25, 'bear-heart', 'balloon', [-7, 28, 1], { n: 1, speed: 0.4 });
    } },
  },
};
def.anim = anim;
