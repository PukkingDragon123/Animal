// Barkorious — the king of Pier 39 (Hydro / Echo). A giant, heavyset sea lion who runs
// the docks: glossy dark-chocolate hide with warm highlights, a broad caramel muzzle with
// thick whiskers on springs, heavy-lidded eyes that never hurry, a gold crown worn at a jaunty
// tilt, a heavy gold chain with a scallop-shell medallion, and a
// loud 90s knit sweater across its chest and shoulders. Smooth, unbothered, generous:
// it is always nodding to a beat, and it raps in barks.
// An homage to a Brooklyn legend's vibe — an original design, never a likeness. Album
// winks: a toddler's curls peeking out under the cocked crown and a "baby picture" fidget
// on a white cloud backdrop; in victory it leans on a black, chrome-trimmed rock shaped
// like the hood of a classic car.
import { E, seg, bump, wob, wave, key } from '../anim.js';
import { defineFx } from '../fx.js';
import { poly, ramp, shift, mix, h2 } from './kit.js';
import { eyeRig, eyesAt, eyesScale, glance, keepEyes } from './eyes.js';
import { blackGold } from '../model.js';

const C = {
  // hide: glossy dark chocolate, warm highlights; a warmer mask on the face
  hide: '#5a3424', hideHi: '#87573a', hideLo: '#3a1f16', hideDeep: '#26120c', gloss: '#b98258', spec: '#f2c896',
  mask: '#a26a42', maskLo: '#7e4c30',
  belly: '#84533a', bellyHi: '#a46c4a', bellyLo: '#603927',
  mz: '#c48a58', mzHi: '#e4b47c', mzLo: '#98613a', mzDeep: '#5e3420',
  nose: '#2a1611', noseHi: '#6a4636',
  flip: '#4a2c20', flipHi: '#663e2c', flipLo: '#2e1a12', flipUnder: '#3e2a21', flipRim: '#6a4c3c', nail: '#d8c4a0',
  whisk: '#fbf3dc', whiskLo: '#c4b08c',
  curl: '#3a2216', curlHi: '#946244', curlLo: '#160a07',
  lid: '#9e6842', lidHi: '#b47e52', white: '#f4e6c8', whiteLo: '#cdb898', eye: '#2a140c', iris: '#d08a2a', glint: '#ffffff', lowLid: '#6a3a24',
  gold: '#efb52c', goldHi: '#ffe07a', goldSpec: '#fffbe6', goldLo: '#b57610', goldDeep: '#734408',
  ruby: '#e3233d', rubyHi: '#ff8a96', sapph: '#2d6bea', sapphHi: '#9cc4ff', emer: '#17ad5f', emerHi: '#8af0b0',
  velvet: '#a3172b', velvetHi: '#d83446', velvetLo: '#640b1a',
  pearl: '#f4f1ea', pearlLo: '#c9c2d8',
  mouth: '#4a0f17', mouthHi: '#7c1f29', tongue: '#dc6370', tongueHi: '#f69aa3', tooth: '#f7f1de', toothLo: '#cfc4a6',
  rock: '#1d1b22', rockHi: '#3b3944', rockLo: '#0d0c11', rockGloss: '#8a8898',
  chrome: '#cfd5df', chromeLo: '#7c8494', chromeDeep: '#3c4250',
  ink: '#170b08',
  // the sweater: loud 90s luxury knit
  kBlue: '#2a47bd', kTeal: '#13a197', kRed: '#d92d36', kGold: '#f3b52b', kPurple: '#7b3aa6', kCream: '#f6ebd2', kInk: '#1d1529',
};

// ---------------------------------------------------------------- painters
const tx = (u) => Math.round(u * 3);
const isSide = (f) => f === 'south' || f === 'north' || f === 'east' || f === 'west';
// x offset of a face inside its box-UV strip (west | south | east | north), so patterns run on around corners
const wrapX = (face, cube) => { const w = tx(cube.s[0]), d = tx(cube.s[2]); return face === 'south' ? d : face === 'east' ? d + w : face === 'north' ? 2 * d + w : 0; };
const fill = (p, w, h, fn) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, fn(x, y)); };

// glossy hide: clean top-lit bands, a lit rim, a soft wet sheen band with hot specks, a dark seam
function hide(o = {}) {
  const c = o.c || C.hide, hi = o.hi || C.hideHi, lo = o.lo || C.hideLo, gl = o.gloss || C.gloss, sp = o.spec || C.spec, k = o.seed || 1, top = mix(hi, c, 0.35);
  return (p, w, h, face) => {
    fill(p, w, h, (x, y) => (face === 'up' ? ramp([top, top, c], Math.abs(x - (w - 1) * 0.42) / (w * 0.55), x, y) : face === 'down' ? (o.under || (y % 5 === 2 ? C.bellyLo : C.belly)) : ramp([hi, c, c, lo], h > 1 ? y / (h - 1) : 0.5, x, y)));
    if (face === 'up') {   // a long wet sheen along the back, a little off-centre
      const x0 = Math.round(w * 0.38);
      for (let y = 1; y < h - 1; y++) { if (h2(7, y >> 2, k) < 0.18) continue; p.px(x0, y, gl); p.px(x0 + 1, y, hi); if (h2(y >> 1, 3, k) > 0.8) p.px(x0, y, sp); }
      for (let y = 2; y < h - 2; y++) if (h2(11, y >> 2, k) < 0.4) p.px(x0 + 3, y, hi);
      return;
    }
    if (!isSide(face)) return;
    for (let x = 0; x < w; x++) p.px(x, 0, shift(hi, 0.4));
    if (h > 4) {
      const gy = Math.max(1, Math.round(h * 0.12)), sheen = mix(hi, gl, 0.45);
      for (let x = 0; x < w; x++) {
        const s = Math.floor((x + k * 7) / 6), on = h2(s, 3, k) < 0.8;
        if (on) p.px(x, gy, sheen);
        if (on && h > 9 && h2(s, 4, k) < 0.5) p.px(x, gy + 1, mix(hi, c, 0.5));
        if (h2(x >> 1, 9, k) > 0.86) p.px(x, gy, sp);
      }
    }
    if (h > 2) for (let x = 0; x < w; x++) p.px(x, h - 1, shift(lo, -0.6));
  };
}
// the warm under-belly: softer, with soft fat creases
function belly(o = {}) {
  const c = o.c || C.belly;
  return (p, w, h, face) => {
    fill(p, w, h, (x, y) => (face === 'up' ? C.bellyHi : face === 'down' ? (y % 6 === 3 ? C.bellyLo : y % 6 === 2 ? C.bellyHi : c) : ramp([C.bellyHi, c, C.bellyLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
    if (!isSide(face)) return;
    for (let y0 = o.y0 ?? 3; y0 < h - 1; y0 += 5) for (let x = 0; x < w; x++) {
      const y = y0 + Math.round(Math.sin((x / Math.max(1, w - 1)) * Math.PI) * 1.2);
      if (y < h - 1) p.px(x, y, shift(c, -0.9));
      if (y - 1 >= 0) p.px(x, y - 1, shift(c, 0.45));
    }
    for (let x = 0; x < w; x++) p.px(x, h - 1, shift(C.bellyLo, -0.6));
  };
}
// neck: hide with two heavy folds across the throat
const neckBase = hide({ seed: 3 });
const neckP = (p, w, h, face, cube) => {
  neckBase(p, w, h, face, cube);
  if (!isSide(face)) return;
  for (const f of face === 'north' ? [0.3, 0.55, 0.8] : [0.42, 0.68]) {
    const y0 = Math.round(h * f);
    for (let x = 0; x < w; x++) { const y = y0 + Math.round(Math.sin((x / (w - 1)) * Math.PI) * (face === 'south' ? 1.4 : 0.6)); p.px(x, y, C.hideDeep); p.px(x, y - 1, shift(C.hide, 0.55)); }
  }
};
// the chubby double chin
const chinBase = belly({ y0: 2 });
const chinP = (p, w, h, face, cube) => { chinBase(p, w, h, face, cube); if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, 0, shift(C.bellyHi, 0.4)); };

// ---- the knit: 90s luxury sweater bands that run on around every corner of the box
const tri = (x, per) => { const u = (((x % per) + per) % per) / per; return u < 0.5 ? u * 2 : 2 - u * 2; };
const zz = (x, per, amp) => Math.round(tri(x, per) * amp);
const KNIT = [
  [2, (x, y) => (y === 0 ? C.kGold : x % 4 === 1 ? C.kGold : C.kRed)],
  [1, () => C.kInk],
  [6, (x, y) => { const r = zz(x, 8, 4); return y === r || y === r + 1 ? C.kGold : y === r + 2 ? shift(C.kBlue, -0.9) : C.kBlue; }],
  [1, () => C.kInk],
  [5, (x, y) => { const dx = Math.abs(((((x + 4) % 8) + 8) % 8) - 4), d = dx + Math.abs(y - 2); return d === 0 ? C.kCream : d <= 2 ? C.kRed : dx === 4 && y === 2 ? C.kGold : C.kTeal; }],
  [1, () => C.kInk],
  [6, (x, y) => { const r = zz(x + 3, 10, 5); return y === r ? C.kInk : y > r ? (y === 5 && (x % 10) === 8 ? C.kCream : C.kPurple) : C.kGold; }],
  [1, () => C.kInk],
  [2, (x) => (x % 2 ? shift(C.kBlue, -0.7) : C.kBlue)],
];
const KNIT_H = KNIT.reduce((s, [n]) => s + n, 0);
function knit(gx, row) { let y = ((row % KNIT_H) + KNIT_H) % KNIT_H; for (const [n, f] of KNIT) { if (y < n) return f(gx, y); y -= n; } return C.kInk; }
const sweater = (p, w, h, face, cube) => {
  if (face === 'down') return fill(p, w, h, (x) => (x % 2 ? shift(C.kBlue, -1.1) : shift(C.kBlue, -0.6)));
  const W = tx(cube.s[0]), D = tx(cube.s[2]), ox = wrapX(face, cube);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let gx = ox + x, row = y, lit = 0.12 - (y / Math.max(1, h - 1)) * 0.5;
    if (face === 'up') {   // the yoke: bands run concentric to the edges (or only from the sides), continuing the sides
      const dF = cube.back ? 99 : h - 1 - y, dB = cube.back ? 99 : y, dW = x, dE = w - 1 - x, d = Math.min(dF, dB, dW, dE);
      row = d; lit = 0.25;
      gx = d === dF ? D + x : d === dW ? y : d === dE ? D + W + (D - 1 - y) : 2 * D + W + (W - 1 - x);
    }
    let col = knit(gx, row);
    if (gx % 2) col = shift(col, -0.22);       // knit columns
    p.px(x, y, shift(col, lit));
  }
};
// ribbing for the collar, hem and cuffs
const rib = (c, stripe) => (p, w, h, face) => fill(p, w, h, (x, y) => {
  let col = face === 'up' ? shift(c, 0.3) : face === 'down' ? shift(c, -1.2) : x % 2 ? shift(c, -0.6) : c;
  if (stripe && isSide(face) && y === Math.floor(h / 2)) col = x % 2 ? shift(stripe, -0.4) : stripe;
  if (isSide(face) && y === 0) col = shift(col, 0.35);
  if (isSide(face) && y === h - 1 && h > 2) col = shift(col, -0.5);
  return col;
});

// ---- gold, gems, velvet, pearl
const goldP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? C.goldHi : face === 'down' ? C.goldLo : ramp([C.goldHi, C.gold, C.gold, C.goldLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (isSide(face)) { for (let x = 0; x < w; x++) { p.px(x, 0, C.goldSpec); if (h > 2) p.px(x, h - 1, C.goldDeep); } if (w > 3 && h > 3) p.px(1, 1, '#ffffff'); }
  if (face === 'up' && w > 2 && h > 2) p.px(1, 1, C.goldSpec);
};
// heavy twisted links: diagonal seams every three texels, a hot glint on each link
const chainP = (p, w, h, face) => fill(p, w, h, (x, y) => {
  const k = (x + (face === 'up' || face === 'down' ? 0 : y)) % 3;
  if (face === 'down') return k === 0 ? C.goldDeep : C.goldLo;
  if (k === 0) return C.goldDeep;
  if (k === 1 && (y === 0 || face === 'up')) return C.goldSpec;
  return ramp([C.goldHi, C.gold, C.goldLo], h > 1 ? y / (h - 1) : 0, x, y);
});
function gem(p, cx, cy, rx, ry, c, hi) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
    const d = ((x - cx) / (rx + 0.45)) ** 2 + ((y - cy) / (ry + 0.45)) ** 2;
    if (d <= 1) p.px(x, y, d > 0.6 ? shift(c, -0.7) : c);
  }
  p.px(Math.round(cx - rx * 0.45), Math.round(cy - ry * 0.45), hi);
}
const crownBand = (p, w, h, face) => {
  goldP(p, w, h, face);
  if (!isSide(face)) return;
  for (let x = 0; x < w; x++) { p.px(x, 1, x % 2 ? C.goldLo : C.goldSpec); p.px(x, h - 2, x % 2 ? C.goldLo : C.goldHi); }
  const cy = (h - 1) / 2, cx = (w - 1) / 2;
  if (face === 'south') { gem(p, cx, cy, 2, 1.2, C.ruby, C.rubyHi); gem(p, cx - 6.5, cy, 1, 1, C.sapph, C.sapphHi); gem(p, cx + 6.5, cy, 1, 1, C.sapph, C.sapphHi); }
  else { gem(p, cx, cy, 1.4, 1, C.emer, C.emerHi); gem(p, cx - 6.5, cy, 0.8, 0.8, C.ruby, C.rubyHi); gem(p, cx + 6.5, cy, 0.8, 0.8, C.ruby, C.rubyHi); }
};
const velvetP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? C.velvetHi : face === 'down' ? C.velvetLo : ramp([C.velvetHi, C.velvet, C.velvetLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  const cx = Math.floor(w / 2);
  if (face === 'up') { const cy = Math.floor(h / 2); for (let i = 0; i < w; i++) p.px(i, cy, C.gold); for (let j = 0; j < h; j++) p.px(cx, j, C.gold); p.px(cx, cy, C.goldSpec); }
  if (isSide(face)) { for (let y = 0; y < h; y++) p.px(cx, y, y === 0 ? C.goldSpec : C.gold); for (let x = 1; x < w - 1; x += 3) if (x !== cx) p.px(x, 1, shift(C.velvetHi, 0.5)); }
};
const pearlP = (p, w, h, face) => { fill(p, w, h, (x, y) => (face === 'up' ? '#ffffff' : ramp(['#ffffff', C.pearl, C.pearlLo], h > 1 ? y / (h - 1) : 0, x, y))); if (isSide(face) && w > 2) p.px(1, 1, '#ffffff'); };
// a scallop rib: bright at the rim, darker toward the hinge, a hot line down the middle
const ribP = (p, w, h, face) => fill(p, w, h, (x, y) => {
  if (face === 'up') return C.goldHi;
  if (face === 'down') return C.goldLo;
  const t = y / Math.max(1, h - 1);
  if (face === 'south' && x === Math.floor(w / 2) && t < 0.75) return C.goldSpec;
  return ramp([C.goldHi, C.gold, C.goldLo], t * 0.9 + 0.05, x, y);
});
// the toddler curls: tight little spirals, a lit arc on each
const CURL = ['hhm', 'mdl', 'mll'];
const curlP = (p, w, h, face) => fill(p, w, h, (x, y) => {
  if (face === 'down') return C.curlLo;
  const k = CURL[(y + (face === 'up' ? 1 : 0)) % 3][(x + ((y / 3) | 0)) % 3];
  return k === 'h' ? C.curlHi : k === 'm' ? C.curl : k === 'd' ? C.curlLo : shift(C.curl, -0.5);
});

// ---- face
const headBase = hide({ seed: 6 });
// the face: a warm mask around the eyes fading up into the dark crown of the head, a smug crease
const faceP = (p, w, h, face, cube) => {
  headBase(p, w, h, face, cube);
  const cx = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = (y - h * 0.22) / (h * 0.78);
    if (t < 0) continue;
    p.px(x, y, ramp([C.mask, C.mask, C.maskLo], t, x, y));
  }
  for (let x = 2; x < w - 2; x++) if (Math.abs(x - cx) > 2.5) p.px(x, Math.round(h * 0.22), shift(C.hideHi, 0.3));
  p.px(Math.floor(cx), Math.round(h * 0.3), C.hideDeep); p.px(Math.ceil(cx), Math.round(h * 0.3) + 1, C.hideDeep);
};
const jowlBase = hide({ seed: 13 });
const jowlP = (p, w, h, face, cube) => {
  jowlBase(p, w, h, face, cube);
  if (face === 'south') fill(p, w, h, (x, y) => ramp([C.mask, C.maskLo, shift(C.maskLo, -0.4)], y / Math.max(1, h - 1), x, y));
  if (face === 'east' || face === 'west') for (let y = 1; y < h - 1; y++) for (let x = 0; x < w; x++) { const f = face === 'west' ? x / (w - 1) : 1 - x / (w - 1); if (f > 0.55) p.px(x, y, f > 0.8 ? C.mask : ((x + y) % 2 ? C.mask : C.hide)); }
};
const palate = (p, w, h) => fill(p, w, h, (x, y) => (y % 3 === 1 ? C.mouthHi : C.mouth));
const muzzleP = (p, w, h, face) => {
  if (face === 'down') return palate(p, w, h);
  fill(p, w, h, (x, y) => (face === 'up' ? C.mzHi : ramp([C.mzHi, C.mz, C.mz, C.mzLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (face === 'up') { for (let x = 0; x < w; x++) p.px(x, h - 1, shift(C.mzHi, 0.3)); return; }
  for (let x = 0; x < w; x++) p.px(x, 0, shift(C.mzHi, 0.35));
  if (face === 'south') {
    const cx = Math.floor(w / 2);
    for (let y = 1; y < h - 1; y++) p.px(cx, y, shift(C.mzLo, -0.5));          // the split lip
    for (let x = 0; x < w; x++) p.px(x, h - 1, C.mzDeep);                       // the mouth line…
    p.px(w - 3, h - 2, C.mzDeep); p.px(w - 2, h - 2, C.mzDeep); p.px(w - 1, h - 3, C.mzDeep);   // …with a sly curl at one corner
  } else if (face !== 'north') for (let x = 0; x < w; x++) p.px(x, h - 1, C.mzDeep);
};
// whisker pads: a few neat rows of pores where the whiskers grow
const padP = (p, w, h, face) => {
  if (face === 'down') return palate(p, w, h);
  fill(p, w, h, (x, y) => (face === 'up' ? C.mzHi : ramp([C.mzHi, C.mz, C.mzLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (!isSide(face) || face === 'north') return;
  for (let x = 0; x < w; x++) p.px(x, 0, shift(C.mzHi, 0.35));
  for (const y of [3, 5, 7]) for (let x = 2 + (y % 4 === 1 ? 1 : 0); x < w - 1; x += 3) p.px(x, y, C.mzLo);
  for (let x = 0; x < w; x++) p.px(x, h - 1, C.mzDeep);
};
const noseP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? C.noseHi : face === 'down' ? '#140a08' : ramp([C.noseHi, C.nose, C.nose], h > 1 ? y / (h - 1) : 0, x, y)));
  if (face === 'up') for (let x = 2; x < w - 2; x++) if (x % 3) p.px(x, h - 2, shift(C.noseHi, 0.6));       // wet shine
  if (face === 'south') {
    const cx = (w - 1) / 2;
    for (const s of [-1, 1]) { p.px(Math.round(cx + s * 3), 1, '#080403'); p.px(Math.round(cx + s * 2.5), 2, '#080403'); p.px(Math.round(cx + s * 3.5), 2, '#080403'); }
    p.px(Math.round(cx), 0, shift(C.noseHi, 0.5));
  }
};
const jawP = (p, w, h, face) => {
  if (face === 'up') return fill(p, w, h, (x, y) => (x === 0 || x === w - 1 ? C.mzLo : y % 3 === 1 ? C.mouthHi : C.mouth));
  fill(p, w, h, (x, y) => (face === 'down' ? C.mzDeep : ramp([C.mz, C.mzLo, C.mzDeep], h > 1 ? y / (h - 1) : 0, x, y)));
  if (isSide(face)) for (let x = 0; x < w; x++) p.px(x, 0, C.mzDeep);
};
const tongueP = (p, w, h, face) => fill(p, w, h, (x) => (face === 'up' ? (x === Math.floor(w / 2) ? C.tongue : C.tongueHi) : face === 'down' ? shift(C.tongue, -0.6) : C.tongue));
const toothP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'down' ? C.toothLo : y === 0 ? '#ffffff' : C.tooth));

// ---- flippers: dark rounded leather, faint finger ridges from the wrist, tiny pale nails
const flipP = (o = {}) => (p, w, h, face) => {
  if (face === 'down') {
    fill(p, w, h, (x, y) => { const e = Math.min(x, w - 1 - x, y, h - 1 - y); return e === 0 ? C.flipRim : y % 4 === 2 && e > 1 ? C.flipLo : C.flipUnder; });
    return;
  }
  if (face === 'up') {
    fill(p, w, h, (x, y) => { const e = Math.min(x, w - 1 - x); return e === 0 ? C.flipLo : e === 1 ? C.flip : C.flipHi; });
    if (o.ridges) for (let k = 1; k <= 3; k++) { const x = Math.round((w * k) / 4); for (let y = o.ridges[0]; y <= o.ridges[1]; y++) p.px(x, y, mix(C.flipHi, C.mzLo, 0.25)); }
    if (o.nails != null) for (let k = 1; k <= 3; k++) { const x = Math.round((w * k) / 4); p.px(x, Math.round(h * o.nails), C.nail); }
    if (o.lobes) for (let x = 0; x < w; x++) { const edge = ((x * 5) % w) < 2; p.px(x, o.lobes > 0 ? 0 : h - 1, edge ? C.flipLo : C.flip); }
    return;
  }
  fill(p, w, h, (x, y) => ramp([C.flipHi, C.flip, C.flipLo], h > 1 ? y / (h - 1) : 0, x, y));
  if (h > 1) for (let x = 0; x < w; x++) p.px(x, 0, C.flipRim);
};

// ---- the black rock shaped like the hood of a classic car: lacquer-black, chrome trim
const rockP = (p, w, h, face) => {
  fill(p, w, h, (x, y) => (face === 'up' ? C.rockHi : face === 'down' ? C.rockLo : ramp([C.rockHi, C.rock, C.rock, C.rockLo], h > 1 ? y / (h - 1) : 0.5, x, y)));
  if (face === 'up') for (let x = 0; x < w; x++) { const y = Math.round(h * 0.3 + x * 0.25); if (y < h) { p.px(x, y, C.rockGloss); if (x % 6 === 2) p.px(x, y, '#ffffff'); } }
  if (isSide(face)) { for (let x = 0; x < w; x++) p.px(x, 0, C.rockGloss); for (let x = 2; x < w; x += 9) p.px(x, 1, '#ffffff'); }
};
const chromeP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? '#ffffff' : face === 'down' ? C.chromeLo : ramp(['#ffffff', C.chrome, C.chromeLo, C.chromeDeep], h > 1 ? y / (h - 1) : 0.5, x, y)));
const grilleP = (p, w, h, face) => fill(p, w, h, (x, y) => (face !== 'south' ? C.chromeLo : x % 2 ? C.rockLo : y === 0 ? '#ffffff' : C.chrome));

// ---- whiskers: four thick pale bristles fanning out from the pad (root at the right edge)
const whiskP = (p, w, h) => {
  for (const [r, sl] of [[4, -0.22], [6.5, -0.05], [9, 0.11], [11.5, 0.28]]) for (let d = 0; d < w; d++) {
    const x = w - 1 - d, y = Math.round(r + sl * d + 0.007 * d * d);
    if (y < 0 || y >= h - 1) break;
    const tip = d > w * 0.75;
    p.px(x, y, tip ? '#fffdf6' : C.whisk);
    if (!tip) p.px(x, y + 1, C.whiskLo);
  }
};

// ---- eyes (hand-pixelled at full texture resolution, Pokémon-style): never cute — a heavy brown lid line sits low
// and level across the eye like a hood, so only a slit of white shows round a small warm-brown iris with a dark
// pupil; no sparkle. Laid back by default; the clips open it wide only when something really surprises it.
const EYES = eyeRig({ style: 'pix', chunk: 1, at: [-3.5, 26.1, 8.05], line: C.ink, iris: '#a8601e', irisDark: '#5a2e10', pupilColor: '#140804', extra: ['smug', 'glint'], map: {
  open: [
    '..llllllll..',
    '.llllllllll.',
    'lwwwIIIIwwwl',
    'lswwhkkiwwsl',
    '.ssswiiiwss.',
    '...ssssss...',
  ],
  happy: ['............', '..llllllll..', '.l........l.', 'l..........l', '............', '............'],
  closed: ['............', '............', 'llllllllllll', '.llllllllll.', '............', '............'],
} });
// drip painters: black-lens shades with gold rims, a mink stole, a gold mic
const shadeP = (p, w, h) => fill(p, w, h, (x, y) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? (x + y) % 3 ? C.gold : C.goldHi : y === 1 && x === 1 ? '#8a8aa0' : y < h / 2 ? '#24242e' : '#101016'));
const minkP = (p, w, h, face) => fill(p, w, h, (x, y) => { const tip = (x * 5 + y * 3) % 7; return face === 'down' ? '#3a2416' : tip === 0 ? '#c8a07a' : tip < 3 ? '#8a5e3c' : face === 'up' ? '#a87a52' : '#6e4a30'; });
const micP = (p, w, h, face) => fill(p, w, h, (x, y) => (face === 'up' ? C.goldHi : (x + y) % 2 ? '#3a3440' : '#b8bcc8'));

// ---------------------------------------------------------------- the model
const B = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const flipX = (c) => { const m = { ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: !c.mirror }; if (c.pivot) m.pivot = [-c.pivot[0], c.pivot[1], c.pivot[2]]; if (c.rot) m.rot = [c.rot[0], -c.rot[1], -c.rot[2]]; return m; };
const twin = (b) => [b, { ...b, name: b.name.replace(/R$/, 'L'), parent: /R$/.test(b.parent) ? b.parent.replace(/R$/, 'L') : b.parent, pivot: [-b.pivot[0], b.pivot[1], b.pivot[2]], ...(b.rot ? { rot: [b.rot[0], -b.rot[1], -b.rot[2]] } : {}), cubes: b.cubes.map(flipX) }];

// the chain: a heavy U of twisted gold draped over the sweater, its ends running back over the shoulders
const CHAIN = (() => {
  const out = [], N = 12, Z = 7.85, pts = [];
  for (let i = 0; i <= N; i++) { const a = -Math.PI / 2 + (Math.PI * i) / N; pts.push([8.4 * Math.sin(a), 13.6 - 5.6 * Math.cos(a)]); }
  for (let i = 0; i < N; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, L = Math.hypot(x1 - x0, y1 - y0) + 0.5;
    out.push(B([cx - L / 2, cy - 0.7, Z], [L, 1.4, 1.2], chainP, { pivot: [cx, cy, Z + 0.6], rot: [0, 0, (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI] }));
  }
  for (const s of [-1, 1]) out.push(B([s * 8.4 - 0.7, 13.13, -4.4], [1.4, 1.2, 13], chainP));
  out.push(B([-9.1, 13.13, -5.6], [18.2, 1.2, 1.2], chainP));
  return out;
})();
// the medallion: a chunky gold scallop shell, ribs fanning up from the hinge, a pearl set in the hinge
const SHELL = (() => {
  const out = [], H = [0, 3.4, 8.95];
  for (const a of [-51, -34, -17, 0, 17, 34, 51]) {
    const f = Math.abs(a) / 51, len = 3.9 - f * 0.6, dz = 0.36 - f * 0.3;
    out.push(B([H[0] - 0.62, H[1], H[2] - 0.33 + dz], [1.24, len, 0.67], ribP, { pivot: H, rot: [0, 0, -a] }));
  }
  out.push(B([-1.85, 2.75, 9.15], [3.7, 1.2, 0.8], goldP));
  out.push(B([-0.67, 3.05, 9.75], [1.33, 1.33, 0.9], pearlP));
  out.push(B([-0.5, 7, 8.9], [1, 1.3, 0.6], goldP));
  return out;
})();
// the crown: gold band set with gems, eight points with ball tips, a velvet cap, orb and cross
const CR = { x: -0.33, y: 29.33, z: 3.5 };
const CROWN = (() => {
  const x0 = CR.x - 3.67, x1 = CR.x + 3.67, z0 = CR.z - 3.67, z1 = CR.z + 3.67, y0 = CR.y, yb = y0 + 2.33, out = [
    B([x0, y0, z0], [x1 - x0, yb - y0, z1 - z0], crownBand),
    B([x0 + 0.67, y0 + 1.33, z0 + 0.67], [x1 - x0 - 1.33, 2.34, z1 - z0 - 1.33], velvetP),
    B([CR.x - 0.67, y0 + 3.67, CR.z - 0.67], [1.33, 1.33, 1.33], goldP),
    B([CR.x - 0.17, y0 + 5, CR.z - 0.17], [0.33, 1.17, 0.33], goldP, { outline: false }),
    B([CR.x - 0.5, y0 + 5.42, CR.z - 0.17], [1, 0.33, 0.33], goldP, { outline: false }),
  ];
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  for (const [cx, cz] of [[x0, z0], [CR.x, z0], [x1, z0], [x1, CR.z], [x1, z1], [CR.x, z1], [x0, z1], [x0, CR.z]]) {
    const big = cx === CR.x && cz === z1, sw = big ? 1.5 : 1.17, sh = big ? 2.33 : 1.67;
    const px = cl(cx - sw / 2, x0, x1 - sw), pz = cl(cz - 0.58, z0, z1 - 1.17);
    out.push(B([px, yb, pz], [sw, sh, 1.17], goldP));
    out.push(B([px + sw / 2 - 0.42, yb + sh, pz + 0.17], [0.83, 0.83, 0.83], goldP));
  }
  return out;
})();
const HOOD = { id: 'hood', hide: true }, HX = -18.75, HZ = 5.5;
const leather = hide({ seed: 14, c: C.flip, hi: C.flipHi, lo: C.flipLo, gloss: '#8a6650', spec: '#d8b898', under: C.flipUnder });

export const def = {
  name: 'barkorious', ppu: 3, scale: 1.15, outline: { color: '#140a07', px: 1.5 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    // the hindquarters lie on the dock, sloping down to the tail; the front props up on the fore flippers
    { name: 'rear', parent: 'root', pivot: [0, 3, -10], cubes: [
      B([-8.67, -3.14, -20], [17.33, 12, 12], hide({ seed: 9 }), { pivot: [0, 8.86, -14], rot: [-19, 0, 0] }),
      B([-6.67, -3, -26], [13.33, 9, 8], hide({ seed: 10 }), { pivot: [0, 6, -22], rot: [-19, 0, 0] }),
      B([-4.67, -1.46, -30], [9.33, 5.5, 5], hide({ seed: 11 }), { pivot: [0, 4.04, -27.5], rot: [-19, 0, 0] }),
    ] },
    ...twin({ name: 'hindR', parent: 'rear', pivot: [-2.6, 0.4, -28.5], rot: [0, 30, 0], cubes: [
      B([-4.77, 0.05, -34.17], [4.33, 1, 5.67], flipP({ ridges: [3, 16], nails: 0.25 })),
      B([-5.27, 0.05, -36.83], [5.33, 0.67, 2.67], flipP({ lobes: 1 })),
    ] }),
    { name: 'body', parent: 'root', pivot: [0, 4, -10], cubes: [] },
    { name: 'torso', parent: 'body', pivot: [0, 3, -1], cubes: [
      B([-9.33, 1.67, -15], [18.67, 6, 20.33], belly(), { pivot: [0, 4, -5], rot: [-5, 0, 0] }),
      B([-10, 3, -6], [20, 10, 13.33], belly()),
      B([-10.5, 5, -6.5], [21, 8.33, 14.33], sweater),
      B([-10.17, 4.33, -14.33], [20.33, 8.33, 9], sweater, { pivot: [0, 4.33, -6], rot: [-9, 0, 0], back: true }),
      B([-7.33, 12.67, -4], [14.67, 2, 11], rib(C.kRed, C.kGold)),
    ] },
    { name: 'chain', parent: 'torso', pivot: [0, 13.8, 2], cubes: CHAIN.map((c) => ({ ...c, id: 'acc-chain', hide: true })) },
    { name: 'medal', parent: 'chain', pivot: [0, 8, 8.9], cubes: SHELL.map((c) => ({ ...c, id: 'acc-chain', hide: true })) },
    ...twin({ name: 'armR', parent: 'body', pivot: [-9.5, 10.5, 2.5], cubes: [
      B([-12.83, 4.33, -0.33], [4.67, 7, 5.67], sweater, { pivot: [-9.5, 10.5, 2.5], rot: [0, 0, -7] }),
      B([-13.17, 3.17, -0.67], [5.33, 1.33, 6.33], rib(C.kBlue), { pivot: [-9.5, 10.5, 2.5], rot: [0, 0, -7] }),
      B([-12.67, 0.5, 0], [4.33, 3, 5], leather, { pivot: [-9.5, 10.5, 2.5], rot: [0, 0, -7] }),
    ] }),
    ...twin({ name: 'flipR', parent: 'armR', pivot: [-11.8, 0.5, 2.5], rot: [0, -30, 0], cubes: [
      B([-14.07, 0, 0.67], [4.67, 1.33, 4], flipP({ ridges: [0, 11] })),
      B([-14.4, 0.05, 4.33], [5.33, 0.83, 5.33], flipP({ ridges: [0, 9], nails: 0.55 })),
      B([-13.73, 0.05, 9.5], [4, 0.67, 2.67], flipP(), { pivot: [-11.73, 0.4, 9.5], rot: [-8, 0, 0] }),
    ] }),
    // drip 3 (or): a black cane with a gold knob, planted beside the left fore flipper
    { name: 'cane', parent: 'flipL', pivot: [12.3, 0.8, 8.6], cubes: [
      B([11.95, 0.0, 8.3], [0.7, 9.6, 0.7], '#16121a'), B([11.6, 9.4, 7.95], [1.4, 1.4, 1.4], goldP), B([11.85, 0.0, 8.2], [0.9, 0.5, 0.9], goldP),
    ].map((c) => ({ ...c, id: 'acc-cane', hide: true })) },
    // drip 3: a gold mic gripped upright in the left fore flipper
    { name: 'mic', parent: 'flipL', pivot: [12.3, 0.8, 7.6], cubes: [
      B([11.75, 0.8, 7.05], [1.1, 5.0, 1.1], goldP), B([11.2, 5.6, 6.5], [2.2, 2.4, 2.2], micP), B([11.45, 5.3, 6.75], [1.7, 0.45, 1.7], goldP),
    ].map((c) => ({ ...c, id: 'acc-mic', hide: true })) },
    { name: 'neck', parent: 'body', pivot: [0, 13, 1], cubes: [
      B([-6.67, 12, -3.33], [13.33, 10.67, 9.67], neckP, { pivot: [0, 13, 1], rot: [12, 0, 0] }),
      B([-4.67, 16, 5], [9.33, 2.33, 3.67], chinP, { pivot: [0, 16, 5], rot: [6, 0, 0] }),
    ] },
    { name: 'head', parent: 'neck', pivot: [0, 21.5, 3.5], cubes: [
      B([-6.67, 20.17, -0.67], [13.33, 4.67, 9], jowlP),
      B([-5.67, 23.5, -1.67], [11.33, 5.67, 9.67], hide({ seed: 6 }), { faces: { south: faceP } }),
      B([-4.67, 29.17, -0.67], [9.33, 0.67, 7.67], hide({ seed: 7 })),
      B([-1.83, 24, 8], [3.67, 1, 3], hide({ seed: 15, c: C.mask, hi: mix(C.mask, C.mzHi, 0.4), lo: C.maskLo })),
      B([-3, 20.83, 8], [6, 3.17, 3.67], muzzleP), B([-2.67, 20.83, 11.67], [5.33, 2.83, 1.33], muzzleP),
      B([-4.33, 20.33, 8.33], [3, 3, 3.33], padP), flipX(B([-4.33, 20.33, 8.33], [3, 3, 3.33], padP)),
      B([-1.83, 23.33, 11], [3.67, 1.33, 2.17], noseP),
      B([-6.5, 25.67, 0.67], [0.83, 1.33, 1.67], hide({ seed: 8 })), flipX(B([-6.5, 25.67, 0.67], [0.83, 1.33, 1.67], hide({ seed: 8 }))),
      B([6.17, 24.83, 1], [0.5, 1.17, 1.17], goldP), B([6.17, 24.5, 1.33], [0.5, 0.5, 0.5], goldP, { outline: false }),   // a small gold hoop in the left ear
      B([-2.5, 20, 11.67], [0.67, 0.83, 0.67], toothP, { outline: false }),
      B([1.83, 20, 11.67], [0.67, 0.83, 0.67], goldP, { outline: false }),          // one gold fang
      // drip 2 (or): a full gold grill, diamonds set in it
      B([-2.75, 19.9, 11.55], [5.5, 0.8, 0.9], goldP, { id: 'acc-grill', hide: true }), B([-1.2, 20.05, 12.4], [0.5, 0.45, 0.1], '#e8fbff', { id: 'acc-grill', hide: true, glow: true }), B([0.7, 20.05, 12.4], [0.5, 0.45, 0.1], '#e8fbff', { id: 'acc-grill', hide: true, glow: true }),
      // the toddler curls, peeking out from under the cocked crown
      B([2, 29.5, 5.67], [1.5, 1.33, 1.5], curlP), B([3.33, 29.5, 4.5], [1.5, 1.5, 1.5], curlP),
      B([0.83, 29.33, 6.83], [1.33, 1.17, 1.17], curlP), B([2.83, 29.17, 7], [1.17, 1.17, 1.17], curlP),
      B([4.17, 29.17, 2.67], [1.33, 1.33, 1.33], curlP), B([3.67, 28.67, 6.5], [1.17, 1.17, 1], curlP),
    ] },
    ...EYES.bones,
    // drip 2 (or): black-lens shades with gold rims, pushed up on the brow
    { name: 'shades', parent: 'head', pivot: [0, 28.2, 8.2], rot: [-10, 0, 0], cubes: [
      B([-5.0, 27.3, 8.15], [4.2, 1.8, 0.4], shadeP), B([0.8, 27.3, 8.15], [4.2, 1.8, 0.4], shadeP), B([-0.8, 28.2, 8.2], [1.6, 0.4, 0.3], goldP),
      B([-5.85, 28.1, 1.0], [0.4, 0.4, 7.4], goldP), B([5.45, 28.1, 1.0], [0.4, 0.4, 7.4], goldP),
    ].map((c) => ({ ...c, id: 'acc-shades', hide: true })) },
    { name: 'jaw', parent: 'head', pivot: [0, 20.83, 8.33], cubes: [
      B([-2.5, 19, 8.33], [5, 1.83, 4.33], jawP),
      B([-1.5, 20.83, 9], [3, 0.5, 2.67], tongueP, { outline: false }),
      B([-2.17, 20.83, 11.5], [0.5, 0.67, 0.5], toothP, { outline: false }),
      B([1.67, 20.83, 11.5], [0.5, 0.67, 0.5], toothP, { outline: false }),
      B([0.33, 19, 11.83], [1.67, 0.5, 3.33], tongueP, { id: 'tongue-out', hide: true, outline: false, pivot: [1.17, 20.83, 11.83], rot: [62, 0, -10] }),
    ] },
    ...twin({ name: 'whiskR', parent: 'head', pivot: [-4.13, 21.83, 10.5], cubes: [B([-11.13, 19.5, 10.5], [7, 4.67, 0], whiskP, { plane: 'z', pivot: [-4.13, 21.83, 10.5], rot: [0, -22, 0] })] }),
    { name: 'crown', parent: 'head', pivot: [CR.x, CR.y, CR.z], rot: [-4, 0, 13], cubes: [
      ...CROWN,                                                     // the crown is its signature: always worn
    ] },
    // drip 3 (or): a mink stole round the shoulders, the tails hanging down its chest
    { name: 'stole', parent: 'torso', pivot: [0, 14, 1], cubes: [
      B([-9.2, 12.8, -4.6], [4.4, 3.0, 11.6], minkP), B([4.8, 12.8, -4.6], [4.4, 3.0, 11.6], minkP), B([-6.4, 13.6, -6.0], [12.8, 2.6, 3.0], minkP),
      B([-7.6, 7.4, 6.4], [2.6, 5.8, 1.6], minkP, { pivot: [-6.3, 13.2, 7.2], rot: [0, 0, 8] }), B([5.0, 7.4, 6.4], [2.6, 5.8, 1.6], minkP, { pivot: [6.3, 13.2, 7.2], rot: [0, 0, -8] }),
      B([-7.3, 6.2, 6.6], [2.0, 1.4, 1.2], '#2a1a12', { pivot: [-6.3, 13.2, 7.2], rot: [0, 0, 8] }), B([5.3, 6.2, 6.6], [2.0, 1.4, 1.2], '#2a1a12', { pivot: [6.3, 13.2, 7.2], rot: [0, 0, -8] }),
    ].map((c) => ({ ...c, id: 'acc-mink', hide: true })) },
    // the victory prop: a black car-hood rock that rises out of the dock (hidden otherwise)
    { name: 'hood', parent: 'root', pivot: [HX, 0, HZ], cubes: [
      B([HX - 4.75, 0, HZ - 4.5], [9.5, 3.67, 9], rockP, HOOD),
      B([HX - 4.5, 3.33, HZ - 4], [9, 1.67, 7.67], rockP, { ...HOOD, pivot: [HX, 3.33, HZ], rot: [7, 0, 0] }),
      B([HX - 5.08, 0.67, HZ + 4.17], [10.17, 1, 0.67], chromeP, HOOD),
      B([HX - 4, 1.67, HZ + 4.33], [8, 1.67, 0.33], grilleP, HOOD),
      B([HX - 0.33, 4.83, HZ - 3.5], [0.67, 0.33, 6.67], chromeP, { ...HOOD, pivot: [HX, 3.33, HZ], rot: [7, 0, 0] }),
      B([HX - 0.5, 4.5, HZ + 2.33], [1, 1.33, 1], chromeP, HOOD),
    ] },
  ],
};

// ---------------------------------------------------------------- effects
const NOTE_A = ['...........', '......#....', '......##...', '......#.#..', '......#..#.', '......#..#.', '......#.#..', '......#....', '...####....', '..#####....', '..#####....', '...###.....', '...........'];
const NOTE_B = ['...........', '...#######.', '...#######.', '...#.....#.', '...#.....#.', '...#.....#.', '...#.....#.', '.###...###.', '####..####.', '####..####.', '.##....##..', '...........', '...........'];
const noteSpr = (rows) => (p, w, h) => {
  const at = (x, y) => y >= 0 && y < rows.length && x >= 0 && x < rows[y].length && rows[y][x] === '#';
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (at(x, y)) p.px(x, y, !at(x, y - 1) ? '#fff6c0' : !at(x, y + 1) || !at(x + 1, y) ? '#e8981c' : '#ffd23c');
    else if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) p.px(x, y, '#6a3a08');
  }
};
defineFx('goldnote', { w: 11, h: 13, frames: [noteSpr(NOTE_A), noteSpr(NOTE_B)], glow: true, life: [1.0, 1.5], size: [0.16, 0.2], speed: [0.7, 1.3], grav: -0.7, drag: 0.9, spread: 0.6, wob: 1.4, fade: true });
defineFx('barkring', { w: 32, h: 32, paint: (p, w, h) => {
  const m = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot(x - m, y - m);
    if (d <= m + 0.3 && d > m - 1.8) p.px(x, y, d > m - 0.8 ? '#e4fdff' : '#7fe2ff');
    else if (d <= m - 4 && d > m - 5.3 && (x + y) % 2 === 0) p.px(x, y, '#b8f2ff');
  }
}, glow: true, life: [0.34, 0.42], size: [0.2, 1.3], speed: [1.6, 2.2], grav: 0, drag: 2.2, spread: 0.03, fade: true });
defineFx('slamring', { w: 56, h: 16, paint: (p, w, h) => {
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const e = Math.hypot((x - cx) / (cx + 0.5), (y - cy) / (cy + 0.5)); if (e <= 1 && e > 0.78) p.px(x, y, e > 0.9 ? '#f2fdff' : '#9fe4ff'); }
}, glow: true, life: [0.5, 0.55], size: [0.15, 0.85], speed: [0, 0], grav: 0, fade: true });
defineFx('bling', { w: 13, h: 13, paint: (p, w) => {
  const c = 6;
  for (let i = 0; i < w; i++) { const d = Math.abs(i - c), col = d < 2 ? '#ffffff' : d < 4 ? '#fff2a8' : '#ffc43a'; if (d < 6) { p.px(i, c, col); p.px(c, i, col); } }
  for (let k = -2; k <= 2; k++) { const col = Math.abs(k) < 2 ? '#ffffff' : '#ffe27a'; p.px(c + k, c + k, col); p.px(c + k, c - k, col); }
}, glow: true, life: [0.5, 0.5], size: [0, 0.3], speed: [0, 0], grav: 0, pop: true, spin: 1.5 });
// a soft white studio cloud (the baby-picture backdrop)
defineFx('cloud', { w: 20, h: 16, paint: (p, w, h) => {
  const blobs = [[0.5, 0.58, 0.36], [0.3, 0.62, 0.26], [0.7, 0.6, 0.27], [0.45, 0.38, 0.27], [0.64, 0.42, 0.22]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let inside = 0, lit = -1;
    for (const [bx, by, br] of blobs) { const dx = x / w - bx, dy = (y / h - by) * (h / w), d = Math.hypot(dx, dy) / br; if (d < 1) { inside = 1; lit = Math.max(lit, -dy / br - dx / br * 0.4); } }
    if (inside) p.px(x, y, lit > 0.35 ? '#ffffff' : lit > -0.25 ? '#eef2f8' : '#c9d2e2');
  }
}, life: [2.0, 2.4], size: [0.55, 0.8], speed: [0.05, 0.18], grav: -0.03, drag: 2, spread: 1, fade: true });
// the camera flash
defineFx('flash', { w: 23, h: 23, paint: (p, w) => {
  const c = 11;
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - c, y - c); if (d < 3.2) p.px(x, y, '#ffffff'); else if (d < 4.6 && (x + y) % 2 === 0) p.px(x, y, '#fff8e0'); }
  for (let i = 0; i < w; i++) { const d = Math.abs(i - c); if (d < 11) { p.px(i, c, d < 6 ? '#ffffff' : '#fff2c0'); p.px(c, i, d < 6 ? '#ffffff' : '#fff2c0'); } }
  for (let k = -5; k <= 5; k++) { p.px(c + k, c + k, '#fffbe8'); p.px(c + k, c - k, '#fffbe8'); }
}, glow: true, life: [0.28, 0.28], size: [0, 1.1], speed: [0, 0], grav: 0, pop: true });

// ---------------------------------------------------------------- animation
const BEAT = 60 / 92;                       // it lives at 92 bpm
const MOUTH = [0, 20.6, 12.6];
const CROWN_TOP = [CR.x, CR.y + 6, CR.z];
// the head-nod: drops hard on the beat, floats back up between beats
const nodC = (u) => (u < 0.16 ? E.out(u / 0.16) : 1 - E.inout((u - 0.16) / 0.84));
// squash/stretch the torso about its base and keep the neck seated in the collar, the shoulders on the sides
function squash(P, a) {
  const k = Math.max(0.3, 1 + a), sx = 1 / Math.sqrt(k) - 1;
  P.sq('torso', a).pos('neck', 0, 10 * (k - 1), 0).pos('armR', -9.5 * sx, 0, 0).pos('armL', 9.5 * sx, 0, 0);
}
// both fore flippers up in front of the chest, blades turned to face each other (open 0 = slapped together)
function clapPose(P, k, open) {
  P.rot('armR', -80 * k, 0, (20 + 24 * open) * k).rot('armL', -80 * k, 0, -(20 + 24 * open) * k);
  P.rot('flipR', 0, (75 - 26 * open) * k, 90 * k).rot('flipL', 0, -(75 - 26 * open) * k, -90 * k);
}
// KO: rolled over onto its right side, belly to the crowd, head flopped on the dock, tongue out
const KO = { roll: 80, lift: 8.8, armR: [-70, 0, 25], armL: [0, 0, -45], flipL: [0, 0, -20], neck: [0, 0, 18], head: [8, 0, 12], hindL: [0, 0, -20] };
function ko(P, k) {
  P.rot('root', 0, 0, KO.roll * k).pos('root', 0, KO.lift * k, 0);
  for (const n of ['armR', 'armL', 'flipL', 'neck', 'head', 'hindL']) P.rot(n, KO[n][0] * k, KO[n][1] * k, KO[n][2] * k);
  P.rot('jaw', 22 * k).rot('crown', 24 * k, 0, 20 * k).pos('crown', 0, -1 * k, 1.5 * k);
}

export const anim = {
  start: 'idle', seed: 39,
  breathe: { bone: 'torso', amp: 0.014, per: 3.3 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.4, 5.2], dur: 0.14 },
  look: { bone: 'head', yaw: 24, pitch: 12, speed: 3.5 },
  springs: [
    { bone: 'whiskR', tip: [-6.5, -1, -2], k: 150, d: 7, gain: 0.9, max: 22 },
    { bone: 'whiskL', tip: [6.5, -1, -2], k: 150, d: 7, gain: 0.9, max: 22 },
    { bone: 'chain', tip: [0, -6, 6.5], k: 80, d: 5, gain: 1, max: 14, axes: [0.35, 0.2, 1] },
    { bone: 'medal', tip: [0, -3, 0], k: 110, d: 6, gain: 1, max: 22, axes: [0.5, 0.4, 1] },
    { bone: 'crown', tip: [0, 3, 0], k: 260, d: 11, gain: 0.5, max: 9 },
    { bone: 'hindR', tip: [-3, 0, -7], k: 160, d: 9, gain: 0.5, max: 14, axes: [1, 0.4, 0.4] },
    { bone: 'hindL', tip: [3, 0, -7], k: 160, d: 9, gain: 0.5, max: 14, axes: [1, 0.4, 0.4] },
  ],
  faces: {
    eyes: EYES.slot,
    tongue: { default: 'in', states: { in: [], out: ['tongue-out'] } },
    prop: { default: 'off', states: { off: [], on: ['hood'] } },
  },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'photo', 'clap', 'chain'] },
  clips: {
    // always on the beat: heavy head-nod, the neck a hair behind, chest pumping, a hind flipper
    // tapping time, lips mouthing the bars, a smug lid — and now and then a lazy flipper wave
    idle: { len: BEAT * 8, loop: true, f(P, t) {
      const b = t / BEAT, i = Math.floor(b), u = b - i, n = nodC(u), nl = nodC((u + 0.88) % 1), sway = Math.sin(b * Math.PI);
      P.rot('head', -3 + 11 * n, sway * 5, -sway * 3).rot('neck', 4 * nl, sway * 2.5, sway * 2);
      squash(P, -0.035 * n);
      P.rot('body', 0, sway * 1.2, sway * 1.4).rot('rear', 0, -sway * 2.2, -sway);
      P.rot('chain', 0, 0, -sway * 2.5);
      const tap = u < 0.12 ? 0 : u < 0.62 ? E.out((u - 0.12) / 0.5) : 1 - E.in3((u - 0.62) / 0.38);
      P.rot('hindL', 18 * tap, 0, 0);
      P.rot('jaw', 5 * bump(u, 0.42, 0.85) * (i % 2));
      const flick = bump(b, 2.5, 2.75) + bump(b, 6.5, 6.7) * 0.8;
      P.rot('whiskR', 0, -10 * flick, -12 * flick).rot('whiskL', 0, 10 * flick, 12 * flick);
      const smug = seg(b, 1.9, 2.3, E.back) * (1 - seg(b, 3.6, 4.1));
      // eyes: unhurried glances on the off-beats, a smug lid on the brag, a lazy blink-squash on the nod
      const [gx, gy] = glance(t, [[0, 0], [0.35, 0], [0.35, 0], [0, 0], [-0.3, 0.05], [0, 0]], BEAT * 2, 0.12);
      eyesAt(P, gx * (1 - smug), gy).face('eyes', smug > 0.4 ? 'smug' : undefined); eyesScale(P, 1, 1 - 0.18 * n);
      // 'sup: a lazy wave of the right flipper, leaning onto the left
      const w = seg(b, 4.85, 5.3, E.back) * (1 - seg(b, 6.6, 7.3, E.inout));
      P.rot('armR', -48 * w, 0, -22 * w).rot('flipR', 30 * w, (30 + wave(t, 1.7) * 24) * w, 0);
      P.rot('body', 0, 0, -2.5 * w).rot('head', 0, -6 * w, 4 * w);
      if (b > 5.4 && b < 6.4) { P.face('eyes', 'happy'); P.blinkOK = false; eyesScale(P, 1.08, 0.9); }
      P.burst(BEAT * 1.05, 'bling', 'crown', CROWN_TOP, {}).burst(BEAT * 4.1, 'bling', 'medal', [1.6, 6.6, 9.8], {});
    } },
    // the galumph: chest heaves up and forward, fore flippers reach and slap down, the back humps
    // and drags the hips up behind with a thump
    walk: { len: 1.05, loop: true, f(P, t) {
      const u = t / 1.05;
      const up = key([[0, 0], [0.2, 1, 'out'], [0.38, 0, 'in'], [1, 0]], u);
      const reach = key([[0, 0.1], [0.22, 1, 'out'], [0.38, 0.75, 'in'], [0.92, 0, 'inout'], [1, 0.1]], u);
      const land = wob(u, 0.38, 1, 3, 8), hump = key([[0, 0], [0.42, 0], [0.63, 1, 'out'], [0.84, 0, 'in'], [1, 0]], u), thump = wob(u, 0.84, 1, 3, 8);
      P.pos('body', 0, 2.2 * up - 0.3 * hump, 1.4 * up).rot('body', -8 * up + 4 * hump, 0, 0).rot('torso', 3 * hump, 0, 0);
      squash(P, 0.08 * up - 0.15 * Math.max(0, land) - 0.03 * hump);
      P.rot('neck', 7 * up - 5 * land - 3 * hump).rot('head', 4 * up - 5 * land, 0, 0);
      P.rot('armR', -30 * reach - 6 * up, 0, -6 * up).rot('armL', -30 * reach - 6 * up, 0, 6 * up);
      P.rot('flipR', 14 * up, 0, 0).rot('flipL', 14 * up, 0, 0);
      P.pos('rear', 0, 1.3 * hump, 1.8 * hump).rot('rear', -6 * hump + 3 * thump, 0, 0).sq('rear', 0.05 * hump - 0.06 * Math.max(0, thump));
      P.rot('hindR', 6 * hump, -16 * hump, 0).rot('hindL', 6 * hump, 16 * hump, 0);
      P.burst(0.4, 'dust', 'flipR', [-15, 0.6, 9], { n: 3, spread: 0.8, speed: 0.6 }).burst(0.4, 'dust', 'flipL', [15, 0.6, 9], { n: 3, spread: 0.8, speed: 0.6 });
      P.burst(0.89, 'dust', 'rear', [0, 0.6, -21], { n: 3, spread: 0.8, speed: 0.5 });
    } },
    // battle cry: draws a huge breath, rears up and lets out a bark that shakes the pier
    cry: { len: 2.3, next: 'idle', f(P, t) {
      const load = seg(t, 0, 0.38, E.inout) * (1 - seg(t, 0.38, 0.5, E.out));
      const rear = seg(t, 0.4, 0.58, E.back) * (1 - seg(t, 1.6, 2.0, E.inout));
      const bark = seg(t, 0.5, 0.58, E.out) * (1 - seg(t, 1.45, 1.65, E.inout));
      const land = t > 1.98 ? wob(t, 1.98, 1, 2.6, 6) : 0;
      P.lookW = 1 - rear; P.blinkOK = false;
      P.pos('body', 0, -1.2 * load + 2.4 * rear, -1 * load).rot('body', 6 * load - 24 * rear, 0, 0);
      squash(P, -0.07 * load + 0.08 * rear * (1 - seg(t, 0.6, 0.9)) - 0.08 * Math.max(0, land));
      P.scl('torso', 1 + 0.05 * load, 1, 1 + 0.06 * load);
      P.rot('neck', 10 * load - 12 * rear).rot('head', 14 * load - 20 * rear + wave(t, 7) * 5 * bark, wave(t, 5) * 6 * bark, wave(t, 6.3) * 4 * bark);
      P.rot('jaw', 3 * load + 44 * bark + wave(t, 11) * 4 * bark);
      P.rot('armR', -30 * rear, 0, -24 * rear).rot('armL', -30 * rear, 0, 24 * rear).rot('flipR', 0, 0, wave(t, 3) * 10 * rear).rot('flipL', 0, 0, -wave(t, 3) * 10 * rear);
      P.face('eyes', load > 0.3 ? 'angry' : bark > 0.3 ? 'shut' : t > 1.65 ? 'smug' : undefined);
      eyesScale(P, 1 + 0.15 * bark, 1 - 0.15 * load - 0.3 * bark); eyesAt(P, 0, 0.15 * bark);
      P.burst(0.2, 'anger', 'head', [5.6, 30.5, 6], {});
      if (t > 0.56 && t < 1.45) P.stream('barkring', 'head', MOUTH, { rate: 7, dir: [0, 0.35, 1] });
      P.burst(0.56, 'barkring', 'head', MOUTH, { dir: [0, 0.3, 1], scale: 1.6 });
      for (const [tb, n] of [[0.6, 7], [0.95, 5], [1.3, 5]]) P.burst(tb, 'goldnote', 'head', [0, 31, 7], { n, dir: [0, 1, 0.4], spread: 0.8, speed: 1.6 });
      P.burst(1.98, 'dust', 'root', [0, 0.6, 8], { n: 10, spread: 1, speed: 1.2 });
    } },
    // body slam: rears up high… then belly-flops forward with everything it has
    attack: { len: 1.5, next: 'idle', f(P, t) {
      const up = seg(t, 0, 0.42, E.out3) * (1 - seg(t, 0.42, 0.56, E.in3));
      const slam = seg(t, 0.44, 0.56, E.in3) * (1 - seg(t, 0.85, 1.4, E.inout));
      const imp = t >= 0.56 ? wob(t, 0.56, 1, 2.4, 5.5) : 0;
      const flat = seg(t, 0.53, 0.58, E.out) * (1 - seg(t, 0.62, 1.1, E.out));
      P.lookW = 1 - Math.max(up, slam);
      P.pos('root', 0, 0, -1.5 * up + 7 * slam);
      P.pos('body', 0, 3.2 * up - 1.2 * flat, -1 * up).rot('body', -34 * up + 10 * flat, 0, 0);
      squash(P, 0.1 * up * (1 - flat) - 0.26 * flat + 0.06 * imp);
      P.rot('rear', 4 * up, 0, 0).sq('rear', -0.08 * up);
      P.rot('neck', -10 * up + 4 * flat).rot('head', -12 * up - 6 * flat + 6 * imp, 0, 0);
      P.rot('jaw', 30 * up + 18 * flat);
      P.rot('armR', -46 * up, 0, -40 * up - 30 * flat).rot('armL', -46 * up, 0, 40 * up + 30 * flat);
      P.rot('flipR', 0, 0, 20 * up + 26 * flat).rot('flipL', 0, 0, -20 * up - 26 * flat);
      P.face('eyes', up > 0.2 ? 'angry' : flat > 0.3 ? 'shut' : t > 1.1 ? 'smug' : undefined);
      eyesScale(P, 1 + 0.2 * flat, 1 - 0.35 * flat + 0.1 * up);
      P.pos('crown', 0, 2.4 * bump(t, 0.56, 0.9), 0).rot('crown', -12 * bump(t, 0.56, 0.9), 0, 0);
      P.burst(0.56, 'slamring', 'root', [0, 0.6, 12], {}).burst(0.56, 'dust', 'root', [0, 0.8, 12], { n: 16, spread: 1, speed: 1.6 });
      P.burst(0.56, 'splash', 'root', [0, 1, 12], { n: 26, dir: [0, 1, 0.3], spread: 0.9, speed: 1.5 }).burst(0.57, 'rock', 'root', [0, 1, 14], { n: 6 }).burst(0.56, 'star', 'root', [0, 4, 16], { n: 4 });
    } },
    // the flow: bark-raps on a quick beat — every bar throws gold notes and sea spray
    special: { len: 3.0, next: 'idle', f(P, t) {
      const on = seg(t, 0.05, 0.35, E.back) * (1 - seg(t, 2.65, 3.0, E.inout));
      const bt = 0.3, b = (t - 0.4) / bt, u = b - Math.floor(b), live = t > 0.4 && t < 2.2;
      const hk = live ? nodC(u) : 0, fin = seg(t, 2.2, 2.32, E.out) * (1 - seg(t, 2.6, 2.95, E.inout));
      P.lookW = 1 - 0.5 * on; P.blinkOK = false;
      P.rot('head', 12 * hk - 4 * on - 18 * fin, wave(t, 0.8) * 8 * on, 0).rot('neck', 5 * hk - 8 * fin);
      P.rot('jaw', (live ? 30 * bump(u, 0, 0.5) : 0) + 46 * fin);
      squash(P, -0.04 * hk + 0.05 * fin);
      // the rapper's hand: flipper held out front, chopping down on every bar
      P.rot('armR', -50 * on + 12 * hk * on - 25 * fin, 0, -14 * on).rot('flipR', 40 * on - 12 * hk * on, 25 * on, 0);
      P.rot('armL', -10 * on, 0, 8 * on);
      P.face('eyes', fin > 0.3 ? 'glint' : on > 0.5 ? (live && u < 0.3 ? 'shut' : 'happy') : undefined);
      eyesScale(P, 1 + 0.08 * hk, 1 - 0.2 * hk + 0.2 * fin);
      for (let k = 0; k < 6; k++) {
        const tk = 0.4 + k * bt;
        P.burst(tk, 'goldnote', 'head', MOUTH, { n: 3, dir: [0, 0.6, 1], speed: 1.8, spread: 0.5 }).burst(tk, 'splash', 'head', MOUTH, { n: 12, dir: [0, 0.5, 1], speed: 2.4, spread: 0.35, scale: 1.8 });
        if (k % 2 === 0) P.burst(tk, 'barkring', 'head', MOUTH, { dir: [0, 0.2, 1] });
      }
      if (live) P.stream('drop', 'head', MOUTH, { rate: 40, dir: [0, 0.4, 1], speed: 2, spread: 0.3, scale: 1.6 });
      P.burst(2.22, 'barkring', 'head', MOUTH, { scale: 2, dir: [0, 0.4, 1] }).burst(2.22, 'goldnote', 'head', [0, 30, 9], { n: 10, spread: 1, speed: 2 }).burst(2.22, 'splash', 'head', MOUTH, { n: 40, dir: [0, 1, 0.5], speed: 2.6, spread: 0.6, scale: 1.8 });
    } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.2, 0.65, E.inout));
      P.pos('root', 0, 0, -2.4 * k).rot('body', -10 * k + wob(t, 0.2, 3, 3, 6), 0, wave(t, 14) * 3 * k);
      squash(P, -0.12 * k);
      P.rot('neck', -8 * k).rot('head', -18 * k, 14 * k, 8 * k).rot('jaw', 28 * k);
      P.rot('armR', -14 * k, 0, -18 * k).rot('armL', -14 * k, 0, 18 * k);
      P.pos('crown', 0, 1.2 * k, 0).rot('crown', 0, 0, 10 * k);
      P.face('eyes', t < 0.1 ? 'wide' : t < 0.42 ? 'shut' : t < 0.6 ? 'sad' : undefined);
      eyesScale(P, 1 + 0.3 * bump(t, 0, 0.14), 1 + 0.4 * bump(t, 0, 0.14) - 0.25 * bump(t, 0.14, 0.42));
      P.burst(0.02, 'spark', 'torso', [0, 10, 9], {}).burst(0.02, 'star', 'head', [0, 31, 5], { n: 3 }).burst(0.05, 'sweat', 'head', [5, 29, 7], { n: 2, dir: [1, 1, 0] });
    } },
    // dizzy… then it topples over onto its side with a thud
    faint: { len: 2.4, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.3) * (1 - seg(t, 0.9, 1.05)), fall = seg(t, 0.95, 1.45, E.bounce);
      P.rot('body', 0, wave(t, 1.4) * 8 * dizzy, wave(t, 1.8) * 6 * dizzy).rot('head', 0, wave(t, 1.8, 1) * 10 * dizzy, wave(t, 1.8) * 12 * dizzy);
      ko(P, fall);
      P.face('eyes', t < 0.9 ? 'swirl' : t < 1.45 ? 'shock' : 'x').face('tongue', t > 1.3 ? 'out' : 'in'); P.blinkOK = false; P.lookW = 0;
      eyesScale(P, 1 + 0.25 * bump(t, 0.9, 1.45), 1 + 0.3 * bump(t, 0.9, 1.45)); eyesAt(P, 0.3 * wave(t, 1.8) * dizzy, 0);
      P.burst(0.3, 'sweat', 'head', [-6, 29, 7], { n: 2, dir: [-1, 1, 0.2] });
      for (const z of [-12, -2, 8]) P.burst(1.45, 'dust', 'root', [-11, 9, z], { n: 6, spread: 1, speed: 1.2 });
      P.burst(1.45, 'dust', 'root', [-9, 10, 16], { n: 8, spread: 1, speed: 1.4 }).burst(1.47, 'dust', 'root', [-6, 6, -28], { n: 6, spread: 1, speed: 1.2 });
      P.burst(1.0, 'star', 'head', [0, 31, 5], { n: 5 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      ko(P, 1);
      P.rot('armL', 0, 0, wave(t, 0.42) * 5).rot('flipL', 0, 0, Math.max(0, wave(t, 0.84)) * 8);
      P.face('eyes', 'x').face('tongue', 'out'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.6;
      P.stream('star', 'head', [0, 31, 5], { rate: 1.2, spread: 0.6, speed: 0.5 });
    } },
    // victory: a black car-hood rock rises out of the dock; it leans a flipper on the hood, flips the
    // crown into the air, catches it on its head and nods — knew it
    win: { len: 3.6, next: 'idle', f(P, t) {
      const rise = seg(t, 0.12, 0.42, E.back) * (1 - seg(t, 3.15, 3.45, E.in));
      const lift = seg(t, 0.02, 0.22, E.out) * (1 - seg(t, 3.0, 3.35, E.inout)), lean = seg(t, 0.32, 0.6, E.back) * (1 - seg(t, 2.95, 3.3, E.inout));
      P.face('prop', t > 0.1 && t < 3.45 ? 'on' : 'off').scl('hood', 1, Math.max(0.02, rise), 1);
      P.burst(0.14, 'dust', 'root', [HX, 0.6, HZ], { n: 12, spread: 1, speed: 1.2 }).burst(0.42, 'bling', 'hood', [HX, 6.6, HZ + 2.8], {});
      const arm = 46 * lift - 6 * lean;
      P.rot('armR', 0, 0, -arm).rot('flipR', 0, 0, arm).rot('body', 0, 6 * lean, 7 * lean).pos('body', -0.8 * lean, -0.5 * lean, 0).rot('neck', 0, 0, -9 * lean).rot('head', 0, 8 * lean, -6 * lean);
      P.pos('armL', 0, 0.5 * lean, 0).rot('armL', 0, 0, -6 * lean);
      // the crown toss (while leaning on the hood)
      const ct = t - 0.8, dip = seg(ct, 0, 0.3, E.inout) * (1 - seg(ct, 0.3, 0.38, E.out));
      const look = seg(ct, 0.3, 0.42, E.back) * (1 - seg(ct, 1.3, 1.62, E.inout));
      const fly = ct >= 0.36 && ct < 1.62, ft = (ct - 0.36) / 1.26, hy = fly ? 60 * ft * (1 - ft) : 0;
      const land = ct > 1.62 ? wob(ct, 1.62, 1, 3.2, 6) : 0, A = ((22 * dip - 30 * look) * Math.PI) / 180;
      P.lookW = 0; P.blinkOK = false;
      P.rot('head', 16 * dip - 22 * look + 5 * land, 0, 0).rot('neck', 6 * dip - 8 * look);
      squash(P, -0.06 * dip + 0.04 * look - 0.06 * Math.max(0, land));
      P.pos('crown', 0, hy * Math.cos(A), -hy * Math.sin(A)).rot('crown', fly ? -720 * ft : 0, 0, 0);
      P.scl('head', 1 + 0.06 * Math.max(0, land), 1 - 0.08 * Math.max(0, land), 1 + 0.06 * Math.max(0, land));
      P.burst(2.42, 'bling', 'crown', CROWN_TOP, {}).burst(2.42, 'sparkle', 'crown', [CR.x, CR.y + 2, CR.z], { n: 8 }).burst(2.46, 'goldnote', 'head', [0, 31, 6], { n: 6, spread: 0.9, speed: 1.5 });
      const nod = bump(ct, 1.75, 2.05) + bump(ct, 2.1, 2.4) * 0.8;
      P.rot('head', 10 * nod, -10 * seg(ct, 1.7, 1.9) * (1 - seg(ct, 2.3, 2.6)), 0);
      P.face('eyes', fly ? 'glint' : ct > 1.62 && ct < 1.75 ? 'shut' : ct > 1.75 ? (ct > 2.45 && ct < 2.65 ? 'wink' : 'smug') : t < 0.6 ? 'happy' : undefined);
      eyesAt(P, 0, fly ? 0.3 * Math.sin(ft * Math.PI) : 0); eyesScale(P, 1, 1 - 0.3 * Math.max(0, land));
    } },
    // asleep on the dock like every sea lion at Pier 39: flat on its belly, nose to the sky, snoring
    sleep: { len: 4.2, loop: true, f(P, t) {
      const br = Math.sin((t / 4.2) * Math.PI * 2), inh = Math.max(0, br), snore = bump(t, 0.4, 1.9);
      P.pos('body', 0, -3.1 + 0.25 * br, 0).rot('body', 2, 0, 0);
      P.pos('armR', 0, 3.1, 0).pos('armL', 0, 3.1, 0).rot('armR', 0, 0, -16).rot('armL', 0, 0, 16).rot('flipR', 0, 0, 16).rot('flipL', 0, 0, -16);
      squash(P, -0.05 + 0.06 * br);
      P.rot('neck', -2 + br, 0, 6).rot('head', -17 - 3 * inh, 14, 16).rot('jaw', 5 + 7 * inh + wave(t, 22) * 2.5 * snore);
      P.rot('crown', -10, 0, 6).pos('crown', 0, -0.3, -0.8);
      P.rot('whiskR', 0, 0, wave(t, 11) * 4 * snore).rot('whiskL', 0, 0, -wave(t, 11, 1) * 4 * snore);
      P.rot('hindL', 8 + 4 * br, 0, 0).rot('hindR', 6, 0, 0);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0; eyesScale(P, 1, 0.85 + 0.15 * inh);
      for (const tz of [0.9, 2.1, 3.3]) P.burst(tz, 'z', 'head', [-3, 30, 11], { scale: 1.8 });
    } },
    // dance: the big-man two-step — a heavy bounce on the beat, shoulders rocking side to side, both fore flippers up
    // waving in the air on the hook, and a cool lean-back finish with a bling off the crown
    dance: { len: BEAT * 6, next: 'idle', f(P, t) {
      const b = t / BEAT, u = b % 1, n = Math.floor(b), hit = nodC(u), side = n % 2 ? 1 : -1, on = seg(b, 0, 0.4) * (1 - seg(b, 5.4, 6));
      const wave2 = bump(b, 2, 4), fin = seg(b, 4.3, 4.6, E.back) * (1 - seg(b, 5.4, 5.9));
      P.rot('head', -3 + 12 * hit * on - 10 * fin, side * 8 * on, -side * 5 * on).rot('neck', 5 * hit * on, side * 3 * on, 0);
      squash(P, -0.05 * hit * on);
      P.rot('body', 0, side * 6 * on * (1 - fin) + 8 * fin, side * 4 * on * (1 - fin) + 4 * fin).rot('rear', 0, -side * 3 * on, 0);
      P.rot('armR', -60 * wave2 - 20 * on * Math.max(0, side) * (1 - wave2), 0, -30 * wave2).rot('armL', -60 * wave2 - 20 * on * Math.max(0, -side) * (1 - wave2), 0, 30 * wave2);
      P.rot('flipR', 0, wave(t, 1.6) * 30 * wave2, 0).rot('flipL', 0, -wave(t, 1.6) * 30 * wave2, 0).rot('jaw', 6 * hit * on);
      P.face('eyes', fin > 0.3 ? 'smug' : wave2 > 0.5 ? 'happy' : u < 0.3 ? 'happy' : 'smug'); P.blinkOK = false;
      eyesScale(P, 1, 1 - 0.18 * hit * on);
      for (let k = 0; k < 5; k++) P.burst(BEAT * (0.4 + k), 'goldnote', 'head', [k % 2 ? 8 : -8, 31, 6], { n: 1, dir: [k % 2 ? 0.5 : -0.5, 1, 0.3], speed: 1.2 });
      P.burst(BEAT * 4.4, 'bling', 'crown', CROWN_TOP, {}).burst(BEAT * 4.4, 'sparkle', 'crown', [CR.x, CR.y + 2, CR.z], { n: 6 });
    } },
    // fidget: a smug sea-lion clap — three slaps, a bark on each
    clap: { len: 2.0, next: 'idle', f(P, t) {
      const up = seg(t, 0.05, 0.35, E.back) * (1 - seg(t, 1.5, 1.9, E.inout));
      const open = t > 0.45 && t < 1.35 ? 0.5 + 0.5 * Math.cos(((t - 0.6) / 0.3) * Math.PI * 2) : 1;
      P.pos('body', 0, -0.6 * up, -0.8 * up).rot('body', -8 * up, 0, 0);
      clapPose(P, up, open);
      for (const tc of [0.6, 0.9, 1.2]) { const k = bump(t, tc - 0.05, tc + 0.15); P.rot('jaw', 24 * k).rot('head', -5 * k, 0, 0); P.burst(tc, 'goldnote', 'head', [0, 24, 14], { n: 1, speed: 1.2 }).burst(tc, 'spark', 'body', [0, 17, 14], { scale: 0.5 }); }
      P.face('eyes', up > 0.4 ? 'happy' : undefined); if (up > 0.4) P.blinkOK = false;
      for (const tc of [0.6, 0.9, 1.2]) eyesScale(P, 1 + 0.08 * bump(t, tc - 0.05, tc + 0.15), 1 - 0.2 * bump(t, tc - 0.05, tc + 0.15));
      P.lookW = 1 - up * 0.6;
    } },
    // fidget: straightens the chain, gives the shell a flip so it catches the light
    chain: { len: 2.3, next: 'idle', f(P, t) {
      const reach = seg(t, 0.1, 0.45, E.out) * (1 - seg(t, 1.35, 1.7, E.inout));
      const tug = bump(t, 0.6, 0.85) + bump(t, 0.95, 1.2) * 0.7;
      P.rot('armR', -48 * reach, 0, 30 * reach);
      P.pos('chain', 0, 0.8 * tug, 0.3 * tug).rot('chain', -4 * tug, 0, 6 * bump(t, 0.6, 1.2));
      P.rot('head', 16 * reach - 6 * seg(t, 1.4, 1.7) * (1 - seg(t, 1.9, 2.2)), -10 * reach, 0).rot('neck', 6 * reach);
      const flip = seg(t, 0.9, 1.3, E.out); P.rot('medal', 0, flip < 1 ? 360 * flip : 0, 0);   // one full turn, then back to 0 (same look) so the hand-off doesn't unspin
      P.burst(1.3, 'bling', 'medal', [0, 5.6, 10], {}).burst(1.32, 'sparkle', 'medal', [0, 5, 10], { n: 5 });
      P.face('eyes', reach > 0.5 && t < 1.3 ? 'sleepy' : t > 1.3 && t < 1.42 ? 'glint' : t > 1.42 && t < 2.0 ? 'smug' : undefined); P.blinkOK = !(t > 1.3 && t < 2.0);
      eyesAt(P, 0, -0.35 * reach);
    } },
    // fidget: the baby picture — sits up sweet in front of a white studio cloud… flash… cool again
    photo: { len: 2.8, next: 'idle', f(P, t) {
      const pose = seg(t, 0.15, 0.45, E.back) * (1 - seg(t, 1.65, 2.05, E.inout)), cute = t > 0.48 && t < 1.2;
      const caught = seg(t, 1.2, 1.32, E.out) * (1 - seg(t, 2.35, 2.75, E.inout));
      P.pos('body', 0, 1.2 * pose, -0.8 * pose).rot('body', -10 * pose, 0, 0);
      clapPose(P, pose, 0.55);
      P.rot('head', -6 * pose + 7 * bump(t, 1.35, 1.8), 0, (cute ? 14 : 4) * pose).rot('neck', 0, 0, 5 * pose);
      P.face('eyes', cute ? 'wide' : t > 1.15 && t < 1.32 ? 'shut' : caught > 0.2 ? 'smug' : undefined); P.blinkOK = !cute;
      eyesScale(P, 1 + 0.15 * (cute ? 1 : 0), 1 + 0.2 * (cute ? 1 : 0)); eyesAt(P, cute ? 0.2 * wave(t, 1.5) : 0, 0);
      P.burst(1.3, 'sweat', 'head', [5.8, 29.5, 7], { n: 1, dir: [1, 1, 0.2] });
      for (const [tb, x, y, z] of [[0.15, -14, 10, -12], [0.2, 14, 10, -12], [0.25, -8, 21, -14], [0.3, 8, 21, -14], [0.35, 0, 27, -12], [0.4, -19, 4, -4], [0.45, 19, 4, -4], [0.5, 0, 14, -17], [0.42, -15, 2, 9], [0.47, 15, 2, 9], [0.52, 0, 2, 14]]) P.burst(tb, 'cloud', 'root', [x, y, z], { n: 2, spread: 0.6 });
      P.burst(1.15, 'flash', 'head', [0, 26, 17], {}).burst(1.17, 'sparkle', 'head', [0, 26, 15], { n: 8 });
    } },
  },
};
def.anim = anim;
// where bought gear sits (model units; size = the width of that part)
def.attach = {
  head: { bone: 'head', at: [0, 29.2, 3.5], size: 9.4 },
  face: { bone: 'head', at: [0, 26.1, 8.1], size: 11.4 },
  neck: { bone: 'torso', at: [0, 13.4, 7.4], size: 13.4 },
  back: { bone: 'torso', at: [0, 13.4, -10], size: 18 },
};
// appearance tiers: normal wears one of the first list, dripped adds one of the second, ultra dripped one of the third
// (the jewelled crown and the loud knit sweater are its signature: always worn)
def.drip = [
  [{ id: 'acc-chain', name: 'Shell-medallion chain' }, { id: 'acc-shades', name: 'Gold-rim shades' }],
  [{ id: 'acc-mink', name: 'Mink stole' }, { id: 'acc-grill', name: 'Diamond grill' }],
  [{ id: 'acc-mic', name: 'Gold mic' }, { id: 'acc-cane', name: 'Gold-knob cane' }],
];

// the ultra-drip form: the eyes keep their own colours, and pale creams that blackGold would lacquer black turn
// champagne gold instead, so the face stays readable in black and gold
const _lum = (c) => { const n = parseInt(c.slice(1, 7), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (Math.max(r, g, b) + Math.min(r, g, b)) / 510; };
def.dripForm = { map: keepEyes(EYES, (c, glow) => { const v = blackGold(c, glow); return !glow && typeof c === 'string' && c[0] === '#' && _lum(c) > 0.8 && _lum(v) < 0.35 ? '#f2dca0' : v; }) };
