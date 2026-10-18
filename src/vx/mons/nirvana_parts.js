// Shared parts for the Nirvana line — Woodbub → Hartbox → Utero (an original homage: the swimming
// baby and the hooked bill, the heart-shaped box, the winged see-through figure; no logos, cover
// art or likenesses). Painters for carved lacquered wood (wandering grain that runs on around
// corners, knots, end-grain rings), weathered painted wood with crackle, brass fittings, vines,
// the split-cane rod and its tackle, the dollar bill; and the line's own particles.
import { defineFx } from '../fx.js';
import { isSide, wrapX, fill, ramp, shift, mix, h2, poly } from './nt_common.js';

// ---------------------------------------------------------------- palettes
// pale lacquered birch (Woodbub)
export const PALE = { spec: '#fff9ec', hi: '#fbe6c2', base: '#efd09e', mid: '#e2bb84', lo: '#c99a62', deep: '#93683c', grain: '#cf9f66', knot: '#7a4a24', ring: '#b07a44' };
// walnut joints and pegs
export const WALNUT = { spec: '#d8a878', hi: '#b07c50', base: '#8a5a34', mid: '#7a4c2a', lo: '#5e3a20', deep: '#3a2212', grain: '#6a4426', knot: '#2e1a0c', ring: '#5a3820' };
export const BRASS = { spec: '#fff6c8', hi: '#f4d06a', base: '#d6a23c', lo: '#9c6a1e', deep: '#5a3a0e' };
export const CHROME = ['#ffffff', '#dde3ec', '#aab2c2', '#6c7486', '#3e4454'];
export const INK = '#2a160c';

const memo = new Map();
const mixM = (a, b, t) => { const k = a + b + t; let v = memo.get(k); if (v === undefined) { v = mix(a, b, t); memo.set(k, v); } return v; };
const shiftM = (a, t) => { const k = a + '|' + t; let v = memo.get(k); if (v === undefined) { v = shift(a, t); memo.set(k, v); } return v; };
export { mixM, shiftM };

// ---------------------------------------------------------------- carved wood
// Clean top-lit bands; long wandering grain streaks (broken into long segments) that run on around
// the box's corners; now and then a little knot; a glossy lacquer rim on top and a dark seam below;
// end-grain growth rings on the caps. o: { seed, per (grain spacing), knots (chance), rings, gloss }
export function wood(W, o = {}) {
  const seed = o.seed || 1, per = o.per || 7, band = [W.hi, W.base, W.base, W.lo];
  return (p, w, h, face, cube) => {
    const side = isSide(face);
    const col = (x, y) => (face === 'up' ? W.hi : face === 'down' ? W.lo : ramp(band, h > 1 ? y / (h - 1) : 0.5, x, y));
    fill(p, w, h, col);
    if (side) {
      const ox = cube ? wrapX(face, cube) : 0;
      for (let k = -2; k < 400; k++) {
        const gx0 = k * per + Math.floor(h2(k, 1, seed) * (per - 2)) - ox;
        if (gx0 > w + 2) break;
        if (gx0 < -3) continue;
        for (let y = 0; y < h; y++) {
          if (h2(k, Math.floor((y + k * 5) / 7), seed + 3) < 0.2) continue;
          const X = gx0 + Math.round(Math.sin(y * 0.2 + k * 1.7 + seed) * 1.1);
          if (X < 0 || X >= w) continue;
          p.px(X, y, mixM(col(X, y), W.grain, 0.6));
        }
      }
      // a knot (never on tiny faces)
      if (w >= 9 && h >= 9 && h2(seed, w * 7 + h, 11) < (o.knots ?? 0.4) && face !== 'south') {
        const kx = 2 + Math.floor(h2(seed, w, 3) * (w - 5)), ky = 2 + Math.floor(h2(seed, h, 4) * (h - 5));
        for (let y = -2; y <= 2; y++) for (let x = -3; x <= 3; x++) {
          const d = (x / 2.6) ** 2 + (y / 1.7) ** 2; if (d > 1.15) continue;
          p.px(kx + x, ky + y, d < 0.3 ? W.knot : d < 0.7 ? W.ring : mixM(col(kx + x, ky + y), W.grain, 0.8));
        }
      }
      // lacquer: a bright rim with a few hot specks, a gloss streak, a dark seam along the bottom
      for (let x = 0; x < w; x++) p.px(x, 0, h2(x >> 1, 2, seed) > 0.8 ? '#ffffff' : W.spec);
      if (o.gloss !== false && h > 6 && w > 4) { const gx = Math.round(w * 0.22); for (let y = 2; y < h * 0.55; y++) if (h2(gx, y >> 2, seed + 9) > 0.25) p.px(gx, y, mixM(col(gx, y), W.spec, 0.55)); }
      if (h > 3) for (let x = 0; x < w; x++) p.px(x, h - 1, W.deep);
    } else if (o.rings !== false && w >= 5 && h >= 5) {
      // end grain: two soft growth rings
      const cx = (w - 1) / 2 + (h2(seed, 5, 5) - 0.5) * w * 0.2, cy = (h - 1) / 2;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const r = Math.hypot((x - cx) / (w / 2), (y - cy) / (h / 2));
        if (Math.abs(r - 0.36) < 0.09 || Math.abs(r - 0.72) < 0.07) p.px(x, y, mixM(col(x, y), W.grain, 0.55));
      }
      if (face === 'up') { for (let x = 0; x < w; x++) { p.px(x, 0, W.spec); } }
    }
  };
}
// a wooden face (the south face of a head): the plain wood, without knots or the gloss streak
export const woodFace = (W, o = {}) => wood(W, { ...o, knots: 0, gloss: false });

// ---------------------------------------------------------------- brass
export function brass(o = {}) {
  const B = BRASS;
  return (p, w, h, face) => {
    fill(p, w, h, (x, y) => (face === 'up' ? B.hi : face === 'down' ? B.lo : ramp([B.hi, B.base, B.base, B.lo], h > 1 ? y / (h - 1) : 0.5, x, y)));
    if (isSide(face) || face === 'up') {
      for (let x = 0; x < w; x++) p.px(x, 0, B.spec);
      if (h > 2) for (let x = 0; x < w; x++) p.px(x, h - 1, B.deep);
      if (o.rivets && w >= 4 && h >= 4) for (const [x, y] of [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]]) { p.px(x, y, B.spec); if (x + 1 < w) p.px(x + 1, y, B.lo); }
      if (o.screw && w >= 3 && h >= 3) { const cx = w >> 1, cy = h >> 1; p.px(cx, cy, B.deep); p.px(cx - 1, cy, B.lo); p.px(cx + 1, cy, B.lo); }
    }
  };
}
export const chromeP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? CHROME[0] : face === 'down' ? CHROME[3] : ramp([CHROME[0], CHROME[1], CHROME[2], CHROME[3]], h > 1 ? y / (h - 1) : 0.5, x, y)));

// ---------------------------------------------------------------- the rod and its tackle
// split cane, honey-coloured, with red silk wraps edged in gold every `per` texels along its length
// (a rod box has its long axis on local z: the length runs along x on east/west and along y on up/down)
export const CANE = { hi: '#f6cc7c', base: '#dca04a', lo: '#a86a26', node: '#8a5420', wrap: '#a81e2c', wrapHi: '#e0485a', tip: '#f2c64a' };
export function cane(o = {}) {
  const per = o.per || 10, off = o.off || 0;
  return (p, w, h, face) => {
    const along = face === 'up' || face === 'down' ? 'y' : 'x';
    fill(p, w, h, (x, y) => {
      const a = along === 'x' ? x : y, c = (a + off) % per;
      if (face === 'north' || face === 'south') return CANE.lo;
      if (c === 0 || c === 3) return CANE.tip;
      if (c === 1 || c === 2) return face === 'up' ? CANE.wrapHi : CANE.wrap;
      if (c === 6 && along === 'x') return CANE.node;
      return face === 'up' ? CANE.hi : face === 'down' ? CANE.lo : CANE.base;
    });
    if (face === 'east' || face === 'west') for (let x = 0; x < w; x++) if ((x + off) % per > 3) p.px(x, 0, CANE.hi);
  };
}
export const corkP = (p, w, h, face) => fill(p, w, h, (x, y) => {
  if (face === 'north' || face === 'south') return '#a87a48';
  const k = h2(x, y, 31);
  return k < 0.12 ? '#8a5e34' : k > 0.9 ? '#ecd0a0' : face === 'up' ? '#e0bc84' : face === 'down' ? '#b08454' : '#d0aa72';
});
export const lineP = (p, w, h) => fill(p, w, h, (x, y) => (y % 9 === 4 ? '#ffffff' : '#ece8de'));
// the hook: a little silver J (side-on cut-out)
export const hookP = (p, w, h) => {
  const c = (w - 1) / 2;
  for (let y = 0; y < h - 2; y++) p.px(Math.round(c), y, y < 1 ? '#ffffff' : CHROME[1]);
  for (let x = 0; x <= Math.round(c); x++) p.px(x, h - 1, CHROME[2]);
  p.px(0, h - 2, CHROME[1]); p.px(0, h - 3, '#ffffff'); p.px(Math.round(c), h - 2, CHROME[2]);
};
// a dollar bill (one half of a creased note — the hook pierces the crease): pale green paper, a
// darker border, a guilloche-ish oval (a little leaf, no portrait), a corner numeral and a seal
export const BILL = { paper: '#dfe9cf', paperLo: '#c4d4b0', ink: '#4a7a56', inkLo: '#2e5a3c', seal: '#3a8a5a', sealHi: '#7ac89a' };
export function billP(side) {
  return (p, w, h) => {
    fill(p, w, h, (x, y) => ((x + y) % 5 === 0 ? BILL.paperLo : BILL.paper));
    for (let x = 0; x < w; x++) { p.px(x, 0, BILL.ink); p.px(x, h - 1, BILL.inkLo); }
    const outer = side > 0 ? w - 1 : 0, inner = side > 0 ? 0 : w - 1;
    for (let y = 0; y < h; y++) { p.px(outer, y, BILL.ink); p.px(inner, y, BILL.paperLo); }
    for (let x = 1; x < w - 1; x++) if (x % 2) { p.px(x, 1, BILL.paperLo); p.px(x, h - 2, BILL.paperLo); }
    // the crease half nearest the hook carries half of the centre oval
    const cx = side > 0 ? -0.5 : w - 0.5, cy = (h - 1) / 2;
    for (let y = 1; y < h - 1; y++) for (let x = 0; x < w; x++) {
      const d = ((x - cx) / 3.6) ** 2 + ((y - cy) / 2.6) ** 2;
      if (d < 1 && d > 0.62) p.px(x, y, BILL.ink); else if (d <= 0.62 && (x + y) % 2 === 0) p.px(x, y, BILL.paperLo);
    }
    // the numeral "1" in the outer corners, a seal on one side
    const nx = side > 0 ? w - 3 : 2; p.px(nx, 1, BILL.inkLo); p.px(nx, 2, BILL.inkLo); p.px(nx, 3, BILL.inkLo); p.px(nx - side, 1, BILL.inkLo);
    if (side < 0) { const sx = 4, sy = h - 3; p.px(sx, sy, BILL.seal); p.px(sx + 1, sy, BILL.sealHi); p.px(sx, sy - 1, BILL.seal); p.px(sx + 1, sy - 1, BILL.seal); }
    else { p.px(w - 4, h - 3, BILL.ink); p.px(w - 5, h - 3, BILL.ink); p.px(w - 6, h - 3, BILL.ink); }
  };
}

// ---------------------------------------------------------------- particles
const billSpr = (p, w, h) => { fill(p, w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? BILL.ink : (x === (w >> 1) && y === (h >> 1)) ? BILL.inkLo : BILL.paper)); };
defineFx('buck', { w: 9, h: 5, paint: billSpr, life: [1.4, 2.2], size: [0.11, 0.11], speed: [0.6, 1.4], grav: 0.55, drag: 2.2, spread: 1, flutter: true });
const chipSpr = (c) => (p) => { p.px(1, 0, shift(c, 0.25)); p.px(2, 0, c); p.px(0, 1, c); p.px(1, 1, c); p.px(2, 1, shift(c, -0.2)); p.px(1, 2, shift(c, -0.35)); };
defineFx('chip', { w: 3, h: 3, frames: [chipSpr(PALE.base), chipSpr(PALE.lo)], life: [0.5, 0.9], size: [0.05, 0.05], speed: [1.4, 2.8], grav: 7, drag: 0.6, spread: 0.8, spin: 9 });
defineFx('chipred', { w: 3, h: 3, frames: [chipSpr('#b8463e'), chipSpr('#8a5a34')], life: [0.6, 1.0], size: [0.07, 0.07], speed: [1.6, 3.2], grav: 8, drag: 0.5, spread: 0.8, spin: 9 });
