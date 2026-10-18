// Studrat — Team Metallica's scrappy street rat (Ferro). Up on its hind legs in a
// boxer's crouch: a mohawk of chrome spikes it sharpens on train rails, a blood-red
// studded collar, a scrap of denim battle vest sewn to its flank, a safety pin
// through its torn ear and a scaly tail that ends in chain links. Sly red eyes under
// heavy lids, one chipped steel tooth, pink fists in tape wraps held up in a guard.
// It bounces on its toes like a prize fighter and nibbles stolen cheese when it
// thinks nobody is looking.
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import { defineFx } from '../fx.js';
import { shade, gradient, layer, on, poly, ramp, shift, mix, h2 } from './kit.js';
const mixC = (a, b) => mix(a, b, 0.5);

const C = {
  fur: '#867aa0', furHi: '#b2a4c0', furLo: '#5c5076', furDeep: '#3c3252',
  cream: '#e6d8d0', creamHi: '#f8f0e8', creamLo: '#b4a2b2',
  skin: '#f09aa8', skinHi: '#ffccc8', skinLo: '#c86a88', skinDeep: '#8e466e',
  red: '#c81e38', redHi: '#f04a52', redLo: '#8c1436', redDeep: '#560e2e',
  denim: '#4a6aa8', denimHi: '#7a9ad0', denimLo: '#2e4478', stitch: '#e8c87a',
  eye: '#e8283a', eyeHi: '#ff6a58', eyeLo: '#8a0e26', sclera: '#f0e4d6',
  ink: '#1a1420', mouth: '#4a0c1c',
  cheese: '#ffd23e', cheeseHi: '#fff2a0', cheeseLo: '#e09a2a', rind: '#b8682a',
  tape: '#efe8da', tapeLo: '#c4b8a8',
};
// chrome: sky-bright above a dark horizon band, the ground reflected below, hard white glints
const CHROME = ['#ffffff', '#dfe6f4', '#aab4d0', '#5c6488', '#7c86aa', '#9aa4c4'];

// ---------------------------------------------------------------- painters
// fur: clean shaded bands plus staggered little tufts (a dark stroke with a lit tip), sparse and regular
function furP(c, o = {}) {
  const top = o.top || shift(c, 0.2), bot = o.bottom || shift(c, -0.3), base = shade(c, { top, bottom: bot, grain: 0, rim: o.rim, seam: false });
  return (p, w, h, face, cube) => {
    base(p, w, h, face, cube);
    if (face === 'down') return;
    const sx = o.sx || 7, sy = o.sy || 5;
    for (let r = 0, y = 2; y < h - 3; y += sy, r++) for (let x = (r % 2) * (sx >> 1) + 2; x < w - 1; x += sx) {
      const b = face === 'up' ? top : ramp([top, c, bot], y / Math.max(1, h - 1), x, y);
      p.px(x, y, shift(b, -0.12)); p.px(x + 1, y + 1, shift(b, -0.12)); p.px(x - 1, y, shift(b, 0.08));
    }
    if (face === 'up' || face === 'plane') return;
    // fringe: the fur overlaps the next form in little points
    for (let x = 0; x < w; x++) { const k = (x % 3 === 1) ? 2 : 1; for (let y = h - k; y < h; y++) p.px(x, y, shift(bot, -0.18)); }
  };
}
const fur = furP(C.fur, { top: C.furHi, bottom: C.furLo });
const furDark = furP(shift(C.fur, -0.06), { top: C.fur, bottom: C.furDeep });
function chromeP(o = {}) {
  const f0 = o.from ?? 0, f1 = o.to ?? 1;     // the slice of the whole piece this cube covers (0 = top, 1 = bottom)
  return (p, w, h, face) => {
    if (face === 'up') { p.rect(0, 0, w, h, f0 < 0.3 ? CHROME[0] : CHROME[1]); p.px(0, 0, '#ffffff'); return; }
    if (face === 'down') { p.rect(0, 0, w, h, CHROME[3]); return; }
    for (let y = 0; y < h; y++) {
      const t = f0 + (f1 - f0) * (h > 1 ? y / (h - 1) : 0.5);
      const col = t < 0.2 ? CHROME[0] : t < 0.44 ? CHROME[1] : t < 0.62 ? CHROME[3] : t < 0.84 ? CHROME[4] : CHROME[5];
      for (let x = 0; x < w; x++) p.px(x, y, col);
    }
    if (w > 2 && h > 2 && f0 < 0.5) p.px(1, 1, '#ffffff');
  };
}
const chrome = chromeP();
// a little domed stud (3×3 texels) at x, y
function stud(p, x, y) { p.px(x, y, CHROME[1]); p.px(x + 1, y, '#ffffff'); p.px(x + 2, y, CHROME[2]); p.px(x, y + 1, CHROME[2]); p.px(x + 1, y + 1, CHROME[1]); p.px(x + 2, y + 1, CHROME[3]); p.px(x, y + 2, CHROME[3]); p.px(x + 1, y + 2, CHROME[3]); p.px(x + 2, y + 2, '#3a3e5a'); }
const leather = (p, w, h, face) => {
  shade(C.red, { top: C.redHi, bottom: C.redLo, grain: 0 })(p, w, h, face);
  if (face === 'up' || face === 'down') return;
  for (let x = 1; x < w - 1; x += 2) { p.px(x, 1, shift(C.redHi, 0.1)); if (h > 4) p.px(x, h - 2, C.redLo); }   // stitching
};
// the front of the collar: leather with a row of domed studs
const collarFront = (p, w, h, face) => { leather(p, w, h, face); if (face !== 'south' && face !== 'north' && face !== 'east' && face !== 'west') return; for (let x = 2; x < w - 3; x += 5) stud(p, x, Math.max(0, (h >> 1) - 1)); };
const tapeP = (p, w, h, face) => {
  shade(C.tape, { top: '#ffffff', bottom: C.tapeLo, grain: 0 })(p, w, h, face);
  if (face === 'up' || face === 'down') return;
  for (let x = 0; x < w; x++) { if ((x + 1) % 4 === 0) for (let y = 1; y < h - 1; y++) p.px(x, y, C.tapeLo); }       // wraps
  for (let x = 0; x < w; x++) p.px(x, h - 2, '#c8303e');                                                              // a red stripe
  p.px(2, 2, '#d8c8a8'); p.px(w - 3, 1, '#d8c8a8');                                                                      // grime
};
const skinP = shade(C.skin, { top: C.skinHi, bottom: C.skinLo, grain: 0 });
// fists: four knuckle bumps on the end face, finger creases on the palm side, the thumb across the inner side
const fist = (p, w, h, face) => {
  skinP(p, w, h, face);
  const q = (k) => Math.round((k * w) / 4);
  if (face === 'down') {
    p.rect(0, 0, w, h, C.skin);
    for (let k = 0; k < 4; k++) { const x0 = q(k), x1 = q(k + 1) - 1; for (let x = x0; x <= x1; x++) { p.px(x, 0, C.skinHi); p.px(x, 1, x === x0 ? C.skinHi : C.skin); } p.px(x1, 1, C.skinLo); p.px(x1, 2, C.skinLo); }
    for (let x = 0; x < w; x++) p.px(x, h - 1, C.skinLo);
    return;
  }
  if (face === 'north') { for (let k = 1; k < 4; k++) { p.px(q(k) - 1, h - 1, C.skinDeep); p.px(q(k) - 1, h - 2, C.skinLo); } for (let x = 0; x < w; x++) p.px(x, h - 3, C.skinLo); }
  if (face === 'south') { for (let x = 0; x < w; x++) p.px(x, h - 1, C.skinHi); }
  if (face === 'east') { for (let x = 1; x < w - 1; x++) p.px(x, h - 3, C.skinHi); for (let x = 1; x < w - 1; x++) p.px(x, h - 2, C.skinLo); }
};
const footP = (p, w, h, face) => {
  skinP(p, w, h, face);
  const q = (k) => Math.round((k * w) / 3);
  if (face === 'up') {   // three long toes at the front (the last rows of the up face), knuckle creases
    for (let k = 1; k < 3; k++) for (let y = h - 7; y < h; y++) p.px(q(k), y, C.skinLo);
    for (let k = 0; k < 3; k++) { p.px(q(k) + 1, h - 5, C.skinHi); p.px(q(k) + 1, h - 9, C.skinLo); }
    for (let y = 3; y < h - 10; y += 4) p.px(Math.floor(w / 2), y, shift(C.skin, -0.1));
  }
  if (face === 'south') { for (let k = 0; k < 3; k++) { const x = q(k) + 1; p.px(x - 1, h - 1, '#f4ecdc'); p.px(x, h - 1, '#f4ecdc'); p.px(x - 1, h - 2, '#fffaf0'); } for (let k = 1; k < 3; k++) p.vl(q(k), 0, h - 1, C.skinLo); }
};
// scaly pink tail: rings every few texels
const tailP = (p, w, h, face) => {
  shade(C.skin, { top: C.skinHi, bottom: C.skinLo, grain: 0, rim: false })(p, w, h, face);
  if (face === 'north' || face === 'south') return;
  // along the tail: the long axis is the face's width on the side faces and its height on up/down
  const along = face === 'up' || face === 'down' ? h : w;
  for (let i = 2; i < along; i += 3) {
    if (face === 'up' || face === 'down') { for (let x = 0; x < w; x++) p.px(x, i, x % 2 ? C.skinLo : shift(C.skin, -0.12)); }
    else for (let y = 0; y < h; y++) p.px(i, y, y === 0 ? C.skinHi : C.skinLo);
  }
};
// the hips' front: fur framing a pale belly with a ragged fur edge
const bellyFront = (p, w, h, face) => {
  fur(p, w, h, face);
  const cx = w / 2 - 0.5, cy = h * 0.62, rx = w * 0.36, ry = h * 0.62;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2, jag = ((x * 2 + y) % 4) * 0.05;
    if (d > 1 - jag) continue;
    p.px(x, y, d > 0.82 - jag ? C.creamLo : ramp([C.creamHi, C.cream, C.creamLo], (y - (cy - ry)) / (2 * ry), x, y));
  }
  for (const [u, v] of [[-0.3, -0.25], [0.25, 0.05], [-0.1, 0.35]]) { const x = Math.round(cx + u * rx), y = Math.round(cy + v * ry); p.px(x, y, C.creamLo); p.px(x + 1, y + 1, C.creamLo); p.px(x - 1, y + 1, C.creamLo); }
};
const chestFront = (p, w, h, face) => {
  fur(p, w, h, face);
  const cx = w / 2 - 0.5;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const hw = w * (0.18 + 0.2 * (y / h)) - ((x + y) % 3 === 0 ? 1 : 0);
    if (Math.abs(x - cx) > hw || y < 2) continue;
    p.px(x, y, Math.abs(x - cx) > hw - 1.2 ? C.creamLo : y < 4 ? C.creamHi : C.cream);
  }
};
// denim battle-vest scrap: twill, golden stitching, a frayed hem, two studs and an original glyph
// (a tiny skull wearing a mohawk)
const denimP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = y / Math.max(1, h - 1), base = ramp([C.denimHi, C.denim, C.denimLo], 0.15 + t * 0.85, x, y);
    p.px(x, y, (x + y) % 3 === 0 ? shift(base, -0.12) : base);
  }
  if (face !== 'east' && face !== 'west') return;
  for (let x = 1; x < w - 1; x++) if (x % 2) { p.px(x, 1, C.stitch); }
  for (let y = 2; y < h - 2; y++) if (y % 2) { p.px(1, y, C.stitch); p.px(w - 2, y, C.stitch); }
  for (let x = 0; x < w; x++) { if ((x * 7) % 5 < 2) p.px(x, h - 1, 0); else p.px(x, h - 1, '#9ab8e8'); }    // frayed hem
  stud(p, 3, 3); stud(p, w - 6, 3);
  // the patch: a red paint splash with a little white sledgehammer lying in it (an original nod)
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2) + 1;
  for (let y = -4; y <= 4; y++) for (let x = -6; x <= 6; x++) {
    const a = Math.atan2(y, x), r = 3.4 + 1.3 * Math.abs(Math.sin(a * 3 + 0.6)) + (Math.abs(Math.sin(a * 5)) > 0.85 ? 1.2 : 0);
    const d = Math.hypot(x, y * 1.35);
    if (d <= r) p.px(cx + x, cy + y, d > r - 1 ? '#a01426' : x + y < -3 ? '#f04a52' : '#d81e32');
  }
  for (const [dx, dy] of [[-7, -3], [7, 2], [5, -5], [-5, 4]]) p.px(cx + dx, cy + dy, '#d81e32');
  for (let x = -3; x <= 2; x++) p.px(cx + x, cy, '#f4ecdc');
  p.rect(cx + 2, cy - 1, 2, 3, '#f4ecdc'); p.px(cx + 3, cy + 1, '#c8c0b0'); p.px(cx - 3, cy + 1, '#8a2030');
};
const fray = (p, w, h) => { for (let x = 0; x < w; x++) { const l = 1 + ((x * 5) % 3); for (let y = 0; y < l && y < h; y++) if ((x + y) % 2 === 0 || y === 0) p.px(x, y, y === 0 ? C.denimLo : '#8aa8dc'); } };
// cranium front: fur, a darker socket around each eye, scruffy bangs under the mohawk
const furCalm = furP(C.fur, { top: C.furHi, bottom: C.furLo, sx: 9, sy: 6 });
const faceP = (p, w, h, face) => {
  furCalm(p, w, h, face);
  for (let x = 0; x < w; x++) { const l = 1 + ((x * 3) % 4 === 0 ? 2 : (x % 3 === 0 ? 1 : 0)); for (let y = 0; y < l; y++) p.px(x, y, y === l - 1 ? C.furLo : C.furHi); }
  if (face === 'south') { const x0 = Math.round(w * 0.14), y0 = 3; for (let k = 0; k < 5; k++) { p.px(x0 + k, y0 + k, C.skinLo); p.px(x0 + k + 1, y0 + k, '#e8a0b0'); } for (const k of [1, 3]) { p.px(x0 + k + 2, y0 + k - 1, C.ink); p.px(x0 + k - 1, y0 + k + 1, C.ink); } }
};
// a scruffy cheek tuft: jagged strands sticking out sideways
const tuftP = (p, w, h) => { for (let y = 0; y < h; y++) { const l = Math.round(w * (0.4 + 0.6 * Math.abs(Math.sin(y * 1.3)))) ; for (let x = w - l; x < w; x++) p.px(x, y, x === w - l ? C.furLo : y % 3 === 0 ? C.furHi : C.fur); } };
const cheekP = furP(shift(C.fur, 0.06), { top: C.furHi, bottom: C.cream, sx: 5 });
// the muzzle: grey above, cream below, a smirk that curls up at the left corner, whisker pores
const snoutP = (lr) => (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = face === 'up' ? 0 : face === 'down' ? 1 : y / Math.max(1, h - 1);
    p.px(x, y, face === 'up' ? C.furHi : t < 0.42 ? ramp([C.furHi, C.fur], t / 0.42, x, y) : ramp([C.cream, C.creamLo], (t - 0.42) / 0.58, x, y));
  }
  if (face === 'up' || face === 'down') return;
  for (let x = 0; x < w; x++) p.px(x, 0, shift(C.furHi, 0.1));
  if ((face === 'east' || face === 'west') && lr) {
    const left = face === 'east';
    for (let x = 0; x < w; x++) { const y = h - 1 - (left && x < 3 ? 2 - x : 0); p.px(x, y, C.ink); }
    if (left) { p.px(0, h - 4, C.ink); }
  }
  if (face === 'south' && !lr) { const m = Math.floor(w / 2); p.px(m, h - 3, C.creamLo); p.px(m, h - 2, C.skinDeep); p.px(m - 1, h - 1, C.skinDeep); p.px(m + 1, h - 1, C.skinDeep); }
  for (let k = 0; k < 3; k++) p.px(2 + k * 2, Math.round(h * 0.55) + (k % 2), C.creamLo);
};
const noseP = (p, w, h, face) => {
  shade('#e06a88', { top: '#ffb0c0', bottom: '#a84466', grain: 0, rim: false })(p, w, h, face);
  if (face === 'south' && w > 3) { p.px(0, h - 1, '#5a1830'); p.px(w - 1, h - 1, '#5a1830'); p.px(1, 0, '#ffe0e6'); p.px(2, 0, '#ffd0da'); }
};
// a pale muzzle pad under the eyes
const muzzleP = (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.fur : ramp([C.fur, mixC(C.fur, C.cream), C.cream, C.creamLo], y / Math.max(1, h - 1), x, y));
  if (face === 'up' || face === 'down') return;
  for (let x = 0; x < w; x++) if ((x * 3) % 4 === 1) p.px(x, 0, C.furLo);
};
const jawP = (p, w, h, face) => { shade(C.cream, { top: C.creamHi, bottom: C.creamLo, grain: 0 })(p, w, h, face); if (face === 'south') for (let x = 0; x < w; x++) p.px(x, 0, C.ink); };
const mouthP = (p, w, h) => { p.rect(0, 0, w, h, C.mouth); p.rect(1, 1, w - 2, Math.max(1, h - 2), '#6a1428'); };
const tongueP = (p, w, h) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, x === 0 || x === w - 1 ? '#b8304a' : y === 0 ? '#ff9aaa' : '#e8607a'); };
const toothP = (p, w, h, face) => { gradient(['#fffaf0', '#f2e6cc', '#d8c8a4'])(p, w, h, face); if (face === 'south') { p.px(0, 0, '#ffffff'); for (let x = 0; x < w; x++) p.px(x, h - 1, '#b8a888'); } };
// the chipped steel tooth: chrome, with a corner bitten off
const steelTooth = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, y < h * 0.4 ? '#ffffff' : y < h * 0.7 ? CHROME[1] : CHROME[2]); if (face === 'south' || face === 'north') { p.px(w - 1, h - 1, 0); p.px(w - 1, h - 2, 0); p.px(w - 2, h - 1, 0); p.px(0, h - 1, CHROME[3]); } };
const browP = shade(C.furLo, { top: C.fur, bottom: C.furDeep, grain: 0 });
// round ears (cut-out planes): fur rim, pink cup; the torn one has a V bitten out of its rim and a stitched scar
const earP = (torn, back) => (p, w, h) => {
  const cx = (w - 1) / 2, cy = (h - 1) / 2 + 0.4, rx = w / 2, ry = h / 2;
  const notch = (x, y) => torn && poly2(x, y, [[-1, h * 0.12], [w * 0.36, h * 0.3], [-1, h * 0.5]]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (d > 1 || notch(x, y)) continue;
    const nearNotch = torn && poly2(x - 1, y, [[-1, h * 0.12], [w * 0.36, h * 0.3], [-1, h * 0.5]]);
    let col;
    if (d > 0.84 || nearNotch) col = C.ink;
    else if (back || d > 0.5) col = ramp([C.furHi, C.fur, C.furLo], y / h, x, y);
    else col = ramp(['#ffb8c0', C.skin, C.skinLo, C.skinDeep], Math.min(1, (y - cy + ry * 0.6) / (ry * 1.4) + (x - cx) * 0.02), x, y);
    p.px(x, y, col);
  }
  if (torn && !back) { for (let k = 0; k < 4; k++) p.px(Math.round(w * 0.42) + k, Math.round(h * 0.62) + (k % 2), C.skinDeep); }
};
function poly2(x, y, pts) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; }
const whiskerP = (p, w, h) => { for (const [y0, sl] of [[h * 0.3, -0.12], [h * 0.75, 0.1]]) for (let x = 1; x < w; x++) { const y = Math.round(y0 + (w - x) * sl); p.px(x, y, x > w * 0.75 ? '#9a8ea8' : x < w * 0.3 ? '#f4eef6' : '#d8d0e0'); } };
const ringP = (p, w, h) => { const cx = (w - 1) / 2, cy = (h - 1) / 2, r = Math.min(w, h) / 2; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot((x - cx), (y - cy) * w / h); if (d > r || d < r - 1.6) continue; p.px(x, y, x + y < w * 0.7 ? '#ffffff' : y > cy ? CHROME[3] : CHROME[1]); } };
const cheeseP = (bitten) => (p, w, h, face) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? C.cheeseHi : ramp([C.cheeseHi, C.cheese, C.cheeseLo], y / Math.max(1, h - 1), x, y));
  if (face === 'up' || face === 'down') return;
  for (const [hx, hy, r] of [[0.3, 0.4, 1], [0.72, 0.62, 1.4], [0.5, 0.15, 0.8]]) { const X = Math.round(hx * w), Y = Math.round(hy * h); p.px(X, Y, C.cheeseLo); if (r > 1) { p.px(X + 1, Y, C.cheeseLo); p.px(X, Y + 1, C.rind); } }
  if (face === 'north' || face === 'south') for (let x = 0; x < w; x++) p.px(x, h - 1, C.rind);
  if (bitten && face === 'east') { for (let k = 0; k < 3; k++) { p.px(w - 1 - k, 0, 0); p.px(w - 1, k, 0); } p.px(w - 2, 1, 0); }
};

// the little sledgehammer: a battered steel head with polished striking faces, an ash handle, a taped grip
const hammerHead = (p, w, h, face) => {
  const strike = (face === 'east' || face === 'west');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = y / Math.max(1, h - 1);
    p.px(x, y, strike ? (x + y < 2 ? '#ffffff' : t < 0.5 ? CHROME[1] : CHROME[2]) : face === 'up' ? '#8a90a8' : face === 'down' ? '#3a3e56' : t < 0.25 ? '#9aa0b8' : t < 0.8 ? '#6a7090' : '#4a4e68');
  }
  if (!strike && face !== 'up' && face !== 'down') { for (let y = 0; y < h; y++) { p.px(0, y, CHROME[1]); p.px(w - 1, y, '#3a3e56'); } p.px(Math.floor(w / 2), Math.floor(h / 2), '#3a3e56'); p.px(Math.floor(w / 2) + 1, Math.floor(h / 2), '#3a3e56'); }
  if (face === 'south') { p.px(2, 1, '#d81e32'); p.px(3, 1, '#d81e32'); p.px(2, 2, '#a01426'); }
};
const handleP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, face === 'up' ? '#d8a868' : x === 0 ? '#e0b070' : x === w - 1 ? '#8a5a30' : (y % 7 === 3 ? '#9a6a3a' : '#b88450')); };
const gripP = (p, w, h, face) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.px(x, y, (y + (x > 0 ? 1 : 0)) % 3 === 0 ? '#c8303e' : '#2a1e2a'); };

// eyes: 11 × 8 texels; outer corner at x = 0, inner corner (toward the snout) at x = 10.
// Heavy lids lie flat across the top of a red iris; the pupil is a short dark slit. No glints.
function eyeShape(p, lid, o = {}) {
  const top = (x) => lid + (o.slope ?? 0.18) * x, bot = (x) => 6.4 - Math.abs(x - 5.4) ** 2 * 0.07;
  const ix = o.ix ?? 6.2, iy = o.iy ?? 4.3, ir = o.ir ?? 2.3;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 11; x++) {
    const X = x + 0.5, Y = y + 0.5;
    if (Y < top(X) - 1.4 || Y > bot(X) + 1) continue;
    if (Y < top(X) || Y > bot(X) || x === 0 || x === 10) { p.px(x, y, C.ink); continue; }
    const d = Math.hypot(X - ix, (Y - iy) * 1.1);
    if (d < ir) { const v = (Y - top(X)) / 3; p.px(x, y, d < 0.9 && Math.abs(X - ix) < 0.8 ? '#1a0610' : v < 0.35 ? C.eyeLo : d > ir - 0.7 ? '#b81830' : v > 0.9 ? C.eyeHi : C.eye); }
    else p.px(x, y, Y < top(X) + 1 ? '#c8bcae' : C.sclera);
  }
  // the thick lid line (two texels) with a lash flick at the outer corner
  for (let x = 0; x < 11; x++) { const y = Math.floor(top(x + 0.5)) - 1; p.px(x, y, C.ink); }
  if (o.flick !== false) { p.px(0, Math.floor(top(0.5)) - 2, C.ink); }
}
const EYES = {
  sly: (p) => eyeShape(p, 2.7, { slope: 0.04, ix: 6.8, iy: 4.6, ir: 2.4 }),
  glare: (p) => eyeShape(p, 2.6, { slope: 0.26, ix: 6.4, ir: 2.1 }),
  smug: (p) => eyeShape(p, 3.6, { slope: -0.04, ix: 6.4, iy: 5.0 }),
  wide: (p) => eyeShape(p, 1.2, { slope: 0.04, ix: 5.6, iy: 3.9, ir: 1.9 }),
  closed: (p) => { for (let x = 0; x < 11; x++) { const y = Math.round(4.2 + Math.abs(x - 5) * 0.12 + x * 0.08); p.px(x, y, C.ink); p.px(x, y - 1, x > 1 && x < 10 ? C.ink : 0); } p.px(0, 2, C.ink); },
  hurt: (p) => { for (let i = 0; i < 5; i++) { p.px(2 + i, 1 + i, C.ink); p.px(3 + i, 1 + i, C.ink); p.px(2 + i, 7 - i, C.ink); p.px(3 + i, 7 - i, C.ink); } p.px(8, 4, C.ink); },
  x: (p) => { for (let i = 0; i < 7; i++) { p.px(2 + i, 0 + i, C.ink); p.px(3 + i, 0 + i, C.ink); p.px(8 - i, 0 + i, C.ink); p.px(9 - i, 0 + i, C.ink); } },
  swirl: (p) => { for (let a = 0; a < 13; a += 0.22) { const r = a * 0.3, x = Math.round(5.5 + Math.cos(a) * r * 1.2), y = Math.round(4 + Math.sin(a) * r * 0.85); if (r < 4) p.px(x, y, C.ink); } },
};

// ---------------------------------------------------------------- model
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const mirrorCube = (c) => ({ ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: !c.mirror, ...(c.pivot ? { pivot: [-c.pivot[0], c.pivot[1], c.pivot[2]], rot: c.rot ? [c.rot[0], -c.rot[1], -c.rot[2]] : undefined } : {}) });
// a chrome spike: a stud on the skull, a stepped chrome core for volume, and two crossed cut-out
// blades around it so the silhouette is a clean sharp cone from every side
const spikeTri = (p, w, h) => {
  const cx = (w - 1) / 2;
  for (let y = 0; y < h; y++) {
    const half = ((y + 0.6) / h) * (w / 2);
    for (let x = 0; x < w; x++) {
      const dx = x - cx; if (Math.abs(dx) > half) continue;
      const v = y / h, edge = Math.abs(dx) > half - 0.85;
      p.px(x, y, edge ? (dx < 0 ? CHROME[1] : '#3a3e60') : dx < -0.2 ? (v < 0.5 ? '#ffffff' : '#eef2fa') : dx < 1 ? CHROME[1] : CHROME[2]);
    }
  }
};
function spike(y, z, h, w = 2.6) {
  return [
    P([-w * 0.4, y - 0.9, z - w * 0.4], [w * 0.8, 1.3, w * 0.8], chromeP({ from: 0.25, to: 0.95 })),
    ...[0, 60, 120].map((a) => P([-w / 2, y + 0.3, z], [w, h, 0], spikeTri, { plane: 'z', pivot: [0, y, z], rot: [0, a, 0] })),
  ];
}
// a stud growing out of the back fur: two tiers pointing backward, turned to a diamond
const backStud = (y, z) => [P([-0.7, y - 0.7, z - 0.5], [1.4, 1.4, 0.6], chromeP({ from: 0.4, to: 1 }), { pivot: [0, y, z], rot: [0, 0, 45] }), P([-0.35, y - 0.35, z - 1.0], [0.7, 0.7, 0.6], chromeP({ from: 0, to: 0.5 }), { pivot: [0, y, z], rot: [0, 0, 45] })];
// a chain link along −z from (0, y, z): flat (ring in the x–z plane) or upright (ring in the y–z plane)
function link(y, z, upright) {
  const L = 3.0, Wd = 2.2, b = 0.6, a = Wd / 2;
  return upright ? [
    P([-b / 2, y + a - b, z - L], [b, b, L], chrome), P([-b / 2, y - a, z - L], [b, b, L], chrome),
    P([-b / 2, y - a + b, z - L], [b, Wd - 2 * b, b], chrome), P([-b / 2, y - a + b, z - b], [b, Wd - 2 * b, b], chrome),
  ] : [
    P([a - b, y - b / 2, z - L], [b, b, L], chrome), P([-a, y - b / 2, z - L], [b, b, L], chrome),
    P([-a + b, y - b / 2, z - L], [Wd - 2 * b, b, b], chrome), P([-a + b, y - b / 2, z - b], [Wd - 2 * b, b, b], chrome),
  ];
}
const eyeStates = (side) => Object.entries(EYES).map(([k, fn]) => P(side < 0 ? [-4.3, 18.9, 4.42] : [0.5, 18.9, 4.42], [3.8, 2.8, 0], fn, { plane: 'z', mirror: side > 0, id: 'eye-' + k, hide: k !== 'sly' }));
const armCubes = [P([-6.0, 9.0, -0.8], [2.4, 4.8, 2.4], fur)];
const foreCubes = [
  P([-5.9, 5.8, -0.7], [2.2, 3.9, 2.2], fur),
  P([-6.1, 5.0, -0.9], [2.6, 1.4, 2.6], tapeP),
  P([-6.3, 2.3, -1.1], [3.0, 2.8, 3.0], fist),
];
const hipCubes = [
  P([-6.6, 2.0, -3.6], [4.0, 4.6, 6.6], fur),
  P([-6.3, 1.4, -3.0], [3.4, 5.8, 5.4], fur),
  P([-5.6, 0.6, -2.6], [2.4, 1.6, 2.6], fur),
];
export const def = {
  name: 'studrat', ppu: 3, scale: 0.38, outline: { color: C.ink, px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'footR', parent: 'root', pivot: [-3.8, 0, 0.4], cubes: [P([-5.4, 0.02, -2.4], [3.2, 1.4, 7.4], footP, { pivot: [-3.8, 0, 0.4], rot: [0, -10, 0] })] },
    { name: 'footL', parent: 'root', pivot: [3.8, 0, 0.4], cubes: [P([2.2, 0.02, -2.4], [3.2, 1.4, 7.4], footP, { mirror: true, pivot: [3.8, 0, 0.4], rot: [0, 10, 0] })] },
    { name: 'legR', parent: 'root', pivot: [-4.0, 6.6, -0.4], cubes: hipCubes },
    { name: 'legL', parent: 'root', pivot: [4.0, 6.6, -0.4], cubes: hipCubes.map(mirrorCube) },
    { name: 'body', parent: 'root', pivot: [0, 6.0, -0.4], rot: [17, 0, 0], cubes: [
      P([-5.0, 2.8, -3.8], [10.0, 7.4, 7.8], fur, { faces: { south: bellyFront, north: furDark } }),
      P([-5.5, 3.6, -3.3], [11.0, 5.8, 6.8], fur, { faces: { south: bellyFront, north: furDark } }),
      P([-4.4, 9.8, -3.0], [8.8, 4.8, 6.4], fur, { faces: { south: chestFront, north: furDark } }),
      P([-4.8, 10.4, -2.6], [9.6, 3.6, 5.6], fur, { faces: { south: chestFront, north: furDark } }),
      P([-3.2, 13.8, -2.4], [6.4, 2.2, 5.0], fur),
      // the collar: a leather ring round the neck, studs, two short spikes and a steel ring
      P([-3.7, 14.2, 2.6], [7.4, 1.7, 0.6], collarFront),
      P([-3.7, 14.2, -3.0], [7.4, 1.7, 0.6], collarFront),
      P([-3.7, 14.2, -2.4], [0.5, 1.7, 5.0], collarFront),
      P([3.2, 14.2, -2.4], [0.5, 1.7, 5.0], collarFront),
      P([-4.0, 14.6, 2.2], [1.0, 1.0, 1.0], chromeP({ from: 0.3, to: 1 }), { pivot: [-3.7, 15.1, 2.8], rot: [0, 40, 45] }),
      P([-4.6, 14.85, 2.45], [0.5, 0.5, 0.5], chromeP({ from: 0, to: 0.3 }), { pivot: [-3.7, 15.1, 2.8], rot: [0, 40, 45] }),
      P([3.0, 14.6, 2.2], [1.0, 1.0, 1.0], chromeP({ from: 0.3, to: 1 }), { pivot: [3.7, 15.1, 2.8], rot: [0, -40, -45] }),
      P([4.1, 14.85, 2.45], [0.5, 0.5, 0.5], chromeP({ from: 0, to: 0.3 }), { pivot: [3.7, 15.1, 2.8], rot: [0, -40, -45] }),
      P([-0.8, 12.9, 3.25], [1.6, 1.7, 0], ringP, { plane: 'z' }),
      ...backStud(6.6, -3.8), ...backStud(9.2, -3.8), ...backStud(12.0, -3.0),
      // the denim scrap on the left flank, its frayed hem
      P([5.45, 6.2, -2.9], [0.45, 4.6, 5.8], denimP),
      P([5.7, 5.0, -2.9], [0, 1.2, 5.8], fray, { plane: 'x' }),
    ] },
    { name: 'hammer', parent: 'body', pivot: [2.6, 12.0, -4.6], rot: [8, 0, -42], cubes: [
      P([2.2, 6.2, -5.0], [0.8, 11.6, 0.8], handleP, { id: 'hb' }),
      P([2.1, 5.8, -5.1], [1.0, 3.0, 1.0], gripP, { id: 'hb' }),
      P([0.6, 17.6, -5.5], [4.0, 2.1, 1.9], hammerHead, { id: 'hb' }),
    ] },
    { name: 'tail1', parent: 'body', pivot: [0, 4.4, -3.6], rot: [-26, -42, 0], cubes: [P([-0.9, 3.5, -8.8], [1.8, 1.8, 5.4], tailP)] },
    { name: 'tail2', parent: 'tail1', pivot: [0, 4.4, -8.6], rot: [18, -48, 0], cubes: [P([-0.75, 3.65, -13.4], [1.5, 1.5, 5.0], tailP)] },
    { name: 'tail3', parent: 'tail2', pivot: [0, 4.4, -13.2], rot: [58, -14, 0], cubes: [P([-0.6, 3.8, -17.2], [1.2, 1.2, 4.2], tailP)] },
    { name: 'link1', parent: 'tail3', pivot: [0, 4.4, -17.0], rot: [14, 0, 0], cubes: link(4.4, -16.7, false) },
    { name: 'link2', parent: 'link1', pivot: [0, 4.4, -19.3], rot: [8, 0, 0], cubes: link(4.4, -19.0, true) },
    { name: 'link3', parent: 'link2', pivot: [0, 4.4, -21.6], rot: [6, 0, 0], cubes: link(4.4, -21.3, false) },
    { name: 'armR', parent: 'body', pivot: [-4.8, 13.4, 0.4], rot: [-60, 0, 11], cubes: armCubes },
    { name: 'foreR', parent: 'armR', pivot: [-4.8, 9.4, 0.4], rot: [-90, 0, 0], cubes: [
      ...foreCubes,
      // the metal horns (index + little finger) for the victory salute
      P([-4.1, -0.1, -0.1], [0.8, 2.4, 0.8], fist, { id: 'horns', hide: true }),
      P([-6.2, 0.3, -0.1], [0.8, 2.0, 0.8], fist, { id: 'horns', hide: true }),
    ] },
    { name: 'cheese', parent: 'foreR', pivot: [-4.8, 3.7, 0.4], cubes: [
      P([-3.5, 2.4, -1.1], [3.2, 2.4, 3.0], cheeseP(false), { id: 'cheese-a', hide: true }),
      P([-3.5, 4.8, -1.1], [1.8, 1.4, 3.0], cheeseP(false), { id: 'cheese-a', hide: true }),
      P([-3.5, 2.4, -1.1], [3.2, 2.4, 3.0], cheeseP(true), { id: 'cheese-b', hide: true }),
    ] },
    { name: 'armL', parent: 'body', pivot: [4.8, 13.4, 0.4], rot: [-60, 0, -11], cubes: armCubes.map(mirrorCube) },
    { name: 'foreL', parent: 'armL', pivot: [4.8, 9.4, 0.4], rot: [-90, 0, 0], cubes: [
      ...foreCubes.map(mirrorCube),
    ] },
    { name: 'mallet', parent: 'foreL', pivot: [4.8, 3.7, 0.4], cubes: [
      P([4.4, 3.3, -1.6], [0.8, 0.8, 10.8], handleP, { id: 'hh', hide: true }),
      P([4.4, 3.2, -1.7], [1.0, 1.0, 3.0], gripP, { id: 'hh', hide: true }),
      P([3.9, 1.8, 7.6], [1.8, 3.8, 2.0], hammerHead, { id: 'hh', hide: true }),
    ] },
    { name: 'head', parent: 'body', pivot: [0, 15.6, 0.6], rot: [-15, 0, 0], cubes: [
      P([-4.5, 15.2, -3.4], [9.0, 7.6, 7.8], fur, { faces: { south: faceP, north: furDark } }),
      P([-4.0, 15.7, -3.9], [8.0, 6.8, 8.1], fur, { faces: { north: furDark } }),
      P([-5.1, 15.4, -1.2], [10.2, 3.8, 5.2], cheekP),
      P([-4.0, 15.3, 3.6], [8.0, 3.3, 1.6], muzzleP),
      P([-2.6, 15.8, 4.6], [5.2, 3.0, 3.2], snoutP(true)),
      P([-1.6, 16.0, 7.8], [3.2, 2.3, 2.4], snoutP(false)),
      P([-0.85, 14.8, 9.4], [0.8, 1.5, 0.5], toothP),
      P([0.05, 15.2, 9.4], [0.8, 1.1, 0.5], steelTooth),
      ...eyeStates(-1), ...eyeStates(1),
      P([-6.6, 15.0, 1.4], [1.6, 3.6, 0], tuftP, { plane: 'z' }),
      P([5.0, 15.0, 1.4], [1.6, 3.6, 0], tuftP, { plane: 'z', mirror: true }),
      P([-6.2, 15.6, 9.0], [4.4, 2.4, 0], whiskerP, { plane: 'z' }),
      P([1.8, 15.6, 9.0], [4.4, 2.4, 0], whiskerP, { plane: 'z', mirror: true }),
    ] },
    { name: 'nose', parent: 'head', pivot: [0, 17.6, 10.2], cubes: [P([-0.9, 17.2, 9.9], [1.8, 1.2, 0.8], noseP), P([-0.5, 16.8, 9.95], [1.0, 0.5, 0.6], noseP, { outline: false })] },
    { name: 'jaw', parent: 'head', pivot: [0, 16.0, 5.0], cubes: [
      P([-2.1, 14.9, 4.4], [4.2, 1.1, 4.6], jawP),
      P([-1.8, 15.85, 4.6], [3.6, 0.3, 4.2], mouthP, { outline: false }),
      P([-1.0, 15.9, 5.2], [2.0, 0.3, 3.0], tongueP, { outline: false }),
    ] },
    { name: 'browR', parent: 'head', pivot: [-2.5, 21.6, 4.6], rot: [0, 0, -5], cubes: [P([-4.6, 21.2, 4.1], [3.9, 1.2, 1.0], browP)] },
    { name: 'browL', parent: 'head', pivot: [2.5, 21.6, 4.6], rot: [0, 0, 9], cubes: [P([0.7, 21.8, 4.1], [3.9, 1.2, 1.0], browP, { mirror: true })] },
    { name: 'earR', parent: 'head', pivot: [-3.8, 21.4, 0.4], rot: [0, 16, 10], cubes: [
      P([-9.4, 20.2, 0.4], [5.8, 6.0, 0], earP(false, false), { plane: 'z' }),
      P([-9.4, 20.2, 0.2], [5.8, 6.0, 0], earP(false, true), { plane: 'z' }),
    ] },
    { name: 'earL', parent: 'head', pivot: [3.8, 21.4, 0.4], rot: [0, -16, -10], cubes: [
      P([3.6, 20.2, 0.4], [5.8, 6.0, 0], earP(true, false), { plane: 'z', mirror: true }),
      P([3.6, 20.2, 0.2], [5.8, 6.0, 0], earP(true, true), { plane: 'z', mirror: true }),
      // the safety pin through the rim
      P([7.7, 20.6, 0.1], [0.4, 2.6, 0.4], chrome, { pivot: [7.9, 22, 0.3], rot: [0, 0, -20] }),
      P([7.5, 23.0, -0.1], [0.8, 0.8, 1.0], chrome, { pivot: [7.9, 22, 0.3], rot: [0, 0, -20] }),
      P([7.65, 20.2, 0.3], [0.5, 0.5, 0.5], chrome, { pivot: [7.9, 22, 0.3], rot: [0, 0, -20], outline: false }),
    ] },
    { name: 'mo1', parent: 'head', pivot: [0, 22.6, 3.2], rot: [6, 0, 12], cubes: spike(22.6, 3.2, 4.4, 3.0) },
    { name: 'mo2', parent: 'head', pivot: [0, 22.6, 1.0], rot: [-8, 0, -13], cubes: spike(22.6, 1.0, 6.0, 3.4) },
    { name: 'mo3', parent: 'head', pivot: [0, 22.6, -1.2], rot: [-20, 0, 5], cubes: spike(22.6, -1.2, 7.4, 3.8) },
    { name: 'mo4', parent: 'head', pivot: [0, 22.2, -3.2], rot: [-40, 0, -9], cubes: spike(22.2, -3.2, 6.4, 3.4) },
    { name: 'mo5', parent: 'head', pivot: [0, 20.4, -3.8], rot: [-66, 0, 10], cubes: spike(20.4, -3.8, 5.0, 3.0) },
  ],
};

// ---------------------------------------------------------------- effects
// steel studs: a domed chrome stud, spinning as it flies; grit: grinder sparks that arc and fall; crumbs
defineFx('stud', { w: 5, h: 5, paint: (p) => { const c = ['..a..', '.abb.', 'abbcd', '.ccd.', '..d..']; const m = { a: '#ffffff', b: '#c8d2e8', c: '#8a94b4', d: '#4a5076' }; c.forEach((r, y) => [...r].forEach((ch, x) => { if (m[ch]) p.px(x, y, m[ch]); })); }, life: [0.5, 0.9], size: [0.07, 0.07], speed: [2.6, 4.6], grav: 9, drag: 0.4, spread: 0.45, spin: 12 });
defineFx('grit', { w: 3, h: 3, paint: (p) => { p.px(1, 0, '#fff0a0'); p.px(0, 1, '#ffd040'); p.px(1, 1, '#ffffff'); p.px(2, 1, '#ffb040'); p.px(1, 2, '#ff8a20'); }, glow: true, life: [0.22, 0.5], size: [0.045, 0.02], speed: [2.2, 4.4], grav: 7, drag: 1.2, spread: 0.55, tint: [[1, 1, 1], [1, 0.85, 0.5], [1, 0.45, 0.15]] });
defineFx('crumb', { w: 3, h: 3, paint: (p) => { p.px(0, 0, '#fff2a0'); p.px(1, 0, '#ffd23e'); p.px(0, 1, '#ffd23e'); p.px(1, 1, '#e09a2a'); p.px(2, 1, '#e09a2a'); p.px(1, 2, '#b8682a'); }, life: [0.4, 0.7], size: [0.04, 0.04], speed: [0.6, 1.4], grav: 7, drag: 0.6, spread: 0.8, spin: 8 });

// ---------------------------------------------------------------- animation
const FIST_R = [-4.8, 3.7, 0.4], FIST_L = [4.8, 3.7, 0.4], MOHAWK = [0, 27.0, -0.5], NOSE = [0, 18.0, 10.9], TOOTH = [0.5, 15.4, 9.9], MALLET = [4.8, 3.7, 8.6];
const ABC = ['a', 'b', 'c'];
// arm poses, offsets from the guard (solved for this rig): [x, y, z] per bone
const POSE = {
  jab: { armL: [-51, 0, 10], foreL: [69, 0, 0] },
  wind: { armR: [3, -3, -33], foreR: [-19, 0, 0] },
  hook: { armR: [-26, 61, -49], foreR: [60, 0, 0] },
  sky: { armR: [-103, 0, -16], foreR: [74, 0, 0], armL: [-103, 0, 16], foreL: [74, 0, 0] },
  knock: { armR: [-15, 0, 11], foreR: [34, 0, 0], armL: [-15, 0, -11], foreL: [34, 0, 0] },
  rubF: { armR: [-86, 0, -2], foreR: [65, 0, 0], armL: [-86, 0, 2], foreL: [65, 0, 0] },
  rubB: { armR: [-99, 0, 1], foreR: [41, 0, 0], armL: [-99, 0, -1], foreL: [41, 0, 0] },
  eat: { armR: [-19, 0, 5], foreR: [48, 0, 0], armL: [-19, 0, -5], foreL: [48, 0, 0] },
  wipe: { armR: [-43, 8, 4], foreR: [61, 0, 0] },
  horns: { armR: [-108, 0, -30], foreR: [65, 0, 0] },
  draw: { armL: [-97, 16, 37], foreL: [-41, 0, 0] },
  overhead: { armL: [-118, 0, 4], foreL: [69, 0, 0], mallet: [7, 0, 0] },
  slam: { armL: [8, 0, 0], foreL: [0, 0, 0], mallet: [112, 0, 0] },
  shoulder: { armL: [-20, 0, 5], foreL: [-3, 0, 0] },
  dangle: { armR: [40, 0, -6], foreR: [70, 0, 0], armL: [40, 0, 6], foreL: [70, 0, 0] },
};
function pose(P, name, k) { if (k) for (const [b, r] of Object.entries(POSE[name])) P.rot(b, r[0] * k, r[1] * k, r[2] * k); return P; }
// keep the feet planted while the hips rise or sink by dy (the haunches stretch to reach)
function plant(P, dy) { for (const s of ['legR', 'legL']) P.pos(s, 0, dy, 0).scl(s, 1, Math.max(0.4, (5.2 + dy) / 5.2), 1); }
const MO = ['mo1', 'mo2', 'mo3', 'mo4', 'mo5'];
// the mohawk rings like a struck tuning fork: each spike wobbles a beat after the one in front
function shing(P, t, t0, amp = 1) { MO.forEach((m, i) => P.rot(m, wob(t, t0 + i * 0.035, -9 * amp, 6, 8), 0, wob(t, t0 + i * 0.035, 5 * amp, 5, 8) * (i % 2 ? 1 : -1))); }
// tail: a lazy S-wave travelling down to the chain
function tailSway(P, t, hz, amp = 1) { P.rot('tail1', 0, wave(t, hz) * 9 * amp, 0).rot('tail2', 0, wave(t, hz, -0.9) * 10 * amp, 0).rot('tail3', wave(t, hz, -1.8) * 7 * amp, wave(t, hz, -1.8) * 8 * amp, 0); }
export const anim = {
  start: 'idle', seed: 13,
  breathe: { bone: 'body', amp: 0.018, per: 2.2 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.0, 4.6], dur: 0.1 },
  look: { bone: 'head', yaw: 30, pitch: 12, speed: 6 },
  springs: [
    { bone: 'earR', tip: [-2.8, 2.4, 0], k: 160, d: 9, gain: 0.7, max: 20 },
    { bone: 'earL', tip: [2.8, 2.4, 0], k: 160, d: 9, gain: 0.7, max: 20 },
    { bone: 'tail2', tip: [0, 0, -5], k: 140, d: 10, gain: 0.5, max: 10 },
    { bone: 'tail3', tip: [0, 0, -4], k: 130, d: 9, gain: 0.6, max: 12 },
    { bone: 'link1', tip: [0, 0, -3], k: 110, d: 8, gain: 0.8, max: 16 },
    { bone: 'link2', tip: [0, 0, -3], k: 100, d: 7, gain: 0.8, max: 18 },
    { bone: 'link3', tip: [0, 0, -3], k: 90, d: 6.5, gain: 0.9, max: 20 },
    { bone: 'mo3', tip: [0, 5, 0], k: 420, d: 10, gain: 0.25, max: 6 },
    { bone: 'hammer', tip: [0, 5, 0], k: 300, d: 12, gain: 0.25, max: 5 },
  ],
  faces: {
    eyes: { default: 'sly', states: Object.fromEntries(Object.keys(EYES).map((k) => [k, ['eye-' + k]])) },
    cheese: { default: 'off', states: { off: [], whole: ['cheese-a'], bitten: ['cheese-b'] } },
    hand: { default: 'fist', states: { fist: [], horns: ['horns'] } },
    hammer: { default: 'back', states: { back: ['hb'], hand: ['hh'] } },
  },
  fidget: { every: [4.5, 8], clips: ['nibble', 'swagger'] },
  clips: {
    // a prize fighter on its toes: two springy bounces per loop, weight rolling side to side,
    // fists pumping in the guard, chin tucked, a sly tilt of the head, the nose testing the air
    idle: { len: 1.2, loop: true, f(P, t) {
      const b = bounce(t, 0.6, { squash: 0.08, stretch: 0.035 }), dy = b.u * 1.0 - 0.5, sw = wave(t, 1 / 1.2);
      P.pos('body', sw * 0.5, dy, 0).sq('body', b.sq).rot('body', 0, sw * 6, -sw * 3); plant(P, dy);
      P.pos('footR', 0, Math.max(0, -sw) * 0.4, 0).pos('footL', 0, Math.max(0, sw) * 0.4, 0);
      const g = wave(t, 1 / 0.6, 0.9);
      P.rot('armR', -6 * g - b.u * 4, 0, 0).rot('foreR', 9 * g, 0, 0).rot('armL', 6 * g - b.u * 4, 0, 0).rot('foreL', -9 * g, 0, 0);
      P.rot('head', 3 - dy * 3, -sw * 7, 5 + sw * 4);
      const sn = bump(t, 0.15, 0.24) + bump(t, 0.27, 0.36);
      P.scl('nose', 1 + 0.25 * sn, 1 - 0.15 * sn, 1).rot('head', -sn * 2.5, 0, 0).rot('browL', 0, 0, sn * 5);
      tailSway(P, t, 1 / 1.2); P.rot('jaw', 2 + sn * 3);
      P.rot('earR', 0, 0, wob(t, 0.05, 6, 3, 5)).rot('earL', 0, 0, -wob(t, 0.65, 6, 3, 5));
    } },
    // a cocky strut on its hind legs, fists up, shoulders rolling, tail swinging behind
    walk: { len: 0.6, loop: true, f(P, t) {
      const ph = (t / 0.6) * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph), up = Math.abs(c), dy = up * 1.2 - 0.4;
      P.pos('body', 0, dy, 0).rot('body', 4, s * 9, -s * 4).sq('body', -0.05 * (1 - up) + 0.03 * up);
      plant(P, dy);
      P.pos('footR', 0, Math.max(0, s) * 2.0, s * 2.6).pos('footL', 0, Math.max(0, -s) * 2.0, -s * 2.6).rot('footR', -Math.max(0, s) * 18, 0, 0).rot('footL', -Math.max(0, -s) * 18, 0, 0);
      P.rot('legR', -s * 18, 0, 0).rot('legL', s * 18, 0, 0);
      P.rot('armR', 8 * s, 0, 0).rot('armL', -8 * s, 0, 0).rot('foreR', -6 * s).rot('foreL', 6 * s);
      P.rot('head', 2 - dy * 4, -s * 7, s * 3);
      tailSway(P, t, 1 / 0.6, 1.4);
    } },
    // battle cry: crouch, spring up with both fists punched at the sky, screech, then knock the fists together
    cry: { len: 1.9, next: 'idle', f(P, t) {
      const crouch = seg(t, 0, 0.3, E.inout) * (1 - seg(t, 0.3, 0.4, E.out)), up = seg(t, 0.32, 0.5, E.back) * (1 - seg(t, 1.15, 1.35, E.inout));
      const dy = -2.4 * crouch + 1.8 * up * (1 - seg(t, 0.6, 1.0));
      P.pos('body', 0, Math.min(0, dy), 0).sq('body', -0.13 * crouch + 0.12 * up * (1 - seg(t, 0.5, 0.7)) + wob(t, 1.45, 0.06, 3, 5)); plant(P, Math.min(0, dy));
      P.pos('root', 0, Math.max(0, dy), 0);
      P.rot('body', 14 * crouch - 12 * up, 0, 0).rot('head', 22 * crouch - 18 * up + wave(t, 14) * 3 * up, 0, wave(t, 9) * 3 * up);
      P.rot('jaw', 4 * crouch + 40 * up);
      const pump = bump(t, 0.62, 0.8) + bump(t, 0.84, 1.02);
      pose(P, 'sky', up); P.rot('armR', -10 * pump, 0, 0).rot('armL', -10 * pump, 0, 0).rot('foreR', 18 * pump).rot('foreL', 18 * pump);
      const knock = seg(t, 1.22, 1.36, E.in) * (1 - seg(t, 1.5, 1.8, E.inout));
      pose(P, 'knock', knock).pos('body', 0, -0.8 * knock, 0); plant(P, -0.8 * knock);
      pose(P, 'dangle', 0.3 * crouch);
      P.rot('browR', 0, 0, -8 * up).rot('browL', 0, 0, -14 * up);
      P.face('eyes', up > 0.3 ? 'glare' : undefined); P.blinkOK = up < 0.1; P.lookW = 1 - up;
      shing(P, t, 0.46, 1.5); shing(P, t, 1.36, 0.8);
      P.burst(0.48, 'sparkle', 'head', MOHAWK, { n: 7, spread: 1 }).burst(0.52, 'anger', 'head', [6, 26, 3], {});
      P.burst(1.35, 'spark', 'foreR', FIST_R, {}).burst(1.35, 'grit', 'foreR', FIST_R, { n: 14, dir: [0, 0.4, 1], spread: 1 });
    } },
    // jab, jab, hook: steps in behind the lead hand, then turns the whole body into the right hook
    attack: { len: 1.35, next: 'idle', f(P, t) {
      const j1 = seg(t, 0.08, 0.16, E.out3) * (1 - seg(t, 0.21, 0.3, E.inout));
      const j2 = seg(t, 0.29, 0.37, E.out3) * (1 - seg(t, 0.42, 0.52, E.inout));
      const jab = j1 + j2;
      const wind = seg(t, 0.46, 0.64, E.inout) * (1 - seg(t, 0.64, 0.73, E.in));
      const hook = seg(t, 0.64, 0.74, E.in3) * (1 - seg(t, 0.92, 1.3, E.inout));
      const thru = seg(t, 0.74, 0.86, E.out) * (1 - seg(t, 0.92, 1.3, E.inout));
      P.pos('root', 0, 0, key([[0, 0], [0.1, 0.4], [0.16, 2.2], [0.3, 1.8], [0.37, 3.6], [0.55, 3.2], [0.64, 2.6], [0.74, 6.2], [0.95, 5.6], [1.35, 0]], t));
      pose(P, 'jab', jab).pos('armL', 0, 0.4 * jab, 1.4 * jab).scl('foreL', 1, 1 + 0.3 * jab, 1);
      pose(P, 'wind', wind); pose(P, 'hook', hook);
      P.rot('armR', 0, 14 * thru, 0);
      P.rot('body', 5 * jab + 6 * hook, -16 * jab - 24 * wind + 28 * hook + 10 * thru, -3 * jab).rot('head', 2 * jab, 12 * jab + 14 * wind - 20 * hook, 0);
      const dy = -1.4 * wind - 0.5 * jab - 0.6 * hook + wob(t, 0.74, -0.7, 3, 6); P.pos('body', 0, dy, 0); plant(P, dy);
      P.sq('body', -0.07 * wind + 0.07 * hook * (1 - seg(t, 0.74, 0.84)) + wob(t, 0.74, 0.05, 4, 7));
      P.pos('footL', 0, 0.8 * bump(t, 0.04, 0.16), 2.4 * seg(t, 0.04, 0.16) * (1 - seg(t, 0.95, 1.3)));
      P.pos('footR', 0, 0.8 * bump(t, 0.6, 0.74), 2.0 * seg(t, 0.6, 0.74) * (1 - seg(t, 0.95, 1.3)));
      P.rot('jaw', 8 * jab + 16 * hook);
      P.face('eyes', t > 0.04 && t < 1.1 ? 'glare' : undefined); P.lookW = 1 - Math.max(wind, hook);
      P.burst(0.16, 'spark', 'foreL', FIST_L, { scale: 0.6 }).burst(0.37, 'spark', 'foreL', FIST_L, { scale: 0.7 });
      P.burst(0.74, 'spark', 'foreR', FIST_R, { scale: 1.4 }).burst(0.74, 'star', 'foreR', FIST_R, { n: 4 }).burst(0.74, 'grit', 'foreR', FIST_R, { n: 12, dir: [0, 0.5, 1] }).burst(0.75, 'ring', 'foreR', FIST_R, { scale: 0.45 });
    } },
    // special (Ferro): sharpens the mohawk with both fists (grinder sparks), rears back, then three
    // headbangs fling a spray of steel studs; the spikes shoot off and regrow each time
    special: { len: 2.1, next: 'idle', f(P, t) {
      const grab = seg(t, 0.0, 0.18, E.out3) * (1 - seg(t, 0.62, 0.78, E.inout));
      const rub = 0.5 + 0.5 * Math.sin(seg(t, 0.16, 0.62, E.lin) * Math.PI * 6);
      pose(P, 'rubF', grab * (1 - rub)); pose(P, 'rubB', grab * rub);
      P.rot('head', 34 * grab, 0, (rub - 0.5) * 5 * grab).rot('body', 6 * grab, 0, 0);
      if (t > 0.16 && t < 0.62) P.stream('grit', 'head', MOHAWK, { rate: 80, dir: [0, 0.7, -0.6], spread: 0.6 });
      if (t > 0.16 && t < 0.62) MO.forEach((m, i) => P.rot(m, wave(t, 17, i) * 3, 0, wave(t, 13, i) * 3));
      const rear = seg(t, 0.62, 0.84, E.inout) * (1 - seg(t, 0.84, 0.9, E.in));
      P.rot('body', -14 * rear, 0, 0).rot('head', -28 * rear, 0, 0).pos('body', 0, 0, -1.2 * rear);
      let bang = 0;
      for (const b0 of [0.86, 1.08, 1.3]) {
        bang += seg(t, b0, b0 + 0.07, E.in3) * (1 - seg(t, b0 + 0.08, b0 + 0.2, E.inout));
        P.burst(b0 + 0.07, 'stud', 'head', MOHAWK, { n: 10, dir: [0, 1, 0.9], spread: 0.55 }).burst(b0 + 0.07, 'grit', 'head', MOHAWK, { n: 18, dir: [0, 0.6, 1], spread: 0.8 });
        const r = seg(t, b0 + 0.06, b0 + 0.08) * (1 - seg(t, b0 + 0.1, b0 + 0.3, E.back));
        MO.forEach((m) => P.scl(m, 1, 1 - 0.75 * r, 1));
      }
      P.rot('head', 42 * bang, 0, 0).rot('body', 15 * bang, 0, 0).pos('body', 0, -0.8 * bang, 1.0 * bang);
      pose(P, 'dangle', 0.4 * bang);
      P.rot('jaw', 26 * rear + 32 * bang);
      const dy = -1.0 * bang - 0.7 * rear; plant(P, dy);
      P.face('eyes', t > 0.62 && t < 1.6 ? 'glare' : t > 0.15 && t < 0.62 ? 'smug' : undefined); P.lookW = 1 - Math.max(grab, rear, bang);
      P.sq('body', wob(t, 1.5, 0.05, 3, 6)); shing(P, t, 1.5, 0.8);
      P.rot('head', 0, wave(t, 6) * 10 * bump(t, 1.5, 1.85), 0);
    } },
    hurt: { len: 0.65, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.07, E.out) * (1 - seg(t, 0.2, 0.65, E.inout));
      P.pos('root', 0, 0, -2.6 * k).rot('body', -18 * k + wob(t, 0.2, 4, 3, 6), 0, wave(t, 16) * 4 * k).sq('body', -0.14 * k);
      P.rot('head', -16 * k, 0, 8 * k).rot('jaw', 26 * k);
      P.rot('armR', 30 * k, 0, -40 * k).rot('armL', 30 * k, 0, 40 * k).rot('foreR', 50 * k).rot('foreL', 50 * k);
      P.face('eyes', t < 0.42 ? 'hurt' : undefined); P.lookW = 1 - k;
      P.burst(0.02, 'stud', 'head', MOHAWK, { n: 2, dir: [0.4, 1, -0.6], speed: 0.8 }).burst(0.02, 'spark', 'body', [0, 12, 6], {});
      P.scl('mo3', 1, 1 - 0.7 * seg(t, 0.02, 0.05) * (1 - seg(t, 0.3, 0.6, E.back)), 1);
      shing(P, t, 0.03, 1.2);
    } },
    // dazed stagger, knees buckle, flops onto its side
    faint: { len: 2.0, next: 'down', f(P, t) {
      const dizzy = seg(t, 0, 0.25) * (1 - seg(t, 0.8, 0.95)), fall = seg(t, 0.85, 1.3, E.bounce);
      P.rot('body', wave(t, 1.4) * 10 * dizzy, wave(t, 1.6) * 16 * dizzy, wave(t, 2.1) * 10 * dizzy).rot('head', 0, 0, wave(t, 2.1, 1) * 14 * dizzy);
      pose(P, 'dangle', Math.max(dizzy, fall));
      const dy = -1.6 * dizzy; P.pos('body', 0, dy, 0); plant(P, dy);
      P.rot('root', 0, 0, 88 * fall).pos('root', 6 * fall, 6.4 * fall, 0);
      P.rot('legR', -24 * fall, 0, 0).rot('legL', 30 * fall, 0, -20 * fall).rot('jaw', 24 * fall).rot('earR', 0, -30 * fall, 50 * fall);
      P.rot('tail1', 0, 46 * fall, 0).rot('tail2', 0, 48 * fall, 0).rot('tail3', -52 * fall, 0, 0).rot('link1', -14 * fall, 0, 0);
      P.face('eyes', t < 0.85 ? 'swirl' : 'x'); P.blinkOK = false; P.lookW = 1 - Math.max(dizzy, fall);
      P.burst(1.3, 'dust', 'root', [0, 1, 0], { n: 8, spread: 1 }).burst(0.3, 'star', 'head', [0, 28, 0], { n: 5 });
    } },
    down: { len: 2.4, loop: true, f(P, t) {
      P.rot('root', 0, 0, 88).pos('root', 6, 6.4, 0);
      pose(P, 'dangle', 1);
      P.rot('legR', -24 + wave(t, 0.42) * 3, 0, 0).rot('legL', 30, 0, -20).rot('jaw', 24 + wave(t, 0.42) * 3).rot('earR', 0, -30, 50).rot('tail1', 0, 46, 0).rot('tail2', 0, 48, 0).rot('tail3', -52 + 8 * bump(t, 0.8, 1.2), 0, 0).rot('link1', -14, 0, 0);
      P.rot('footL', -10 * bump(t, 1.2, 1.5) * wave(t, 6), 0, 0);
      P.face('eyes', 'x'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.burst(0.4, 'star', 'head', [0, 28, 0], { n: 2 });
    } },
    // victory (a Kill 'Em All nod): a hop and a fist pump, then it draws the sledgehammer off its back,
    // slams it into the ground, shoulders it and throws up the metal horns
    win: { len: 2.7, next: 'idle', f(P, t) {
      const h = t < 0.55 ? hop(t, 0.55, 3.6, { crouch: 1.2 }) : { y: wob(t, 0.55, -0.6, 3, 7), sq: wob(t, 0.55, -0.1, 3, 7) };
      P.pos('root', 0, Math.max(0, h.y), 0).sq('body', h.sq); if (h.y < 0) plant(P, h.y);
      const pump = bump(t, 0.12, 0.5);
      pose(P, 'sky', 0); P.rot('armR', -110 * pump, 0, -10 * pump).rot('foreR', 60 * pump);
      const draw = seg(t, 0.5, 0.68, E.inout) * (1 - seg(t, 0.72, 0.85, E.inout));
      const over = seg(t, 0.72, 0.9, E.out3) * (1 - seg(t, 1.02, 1.14, E.in3));
      const slam = seg(t, 1.02, 1.14, E.in3) * (1 - seg(t, 1.4, 1.7, E.inout));
      const shoulder = seg(t, 1.45, 1.75, E.back) * (1 - seg(t, 2.42, 2.62, E.inout));
      P.face('hammer', t > 0.66 && t < 2.5 ? 'hand' : 'back');
      pose(P, 'draw', draw).rot('body', -6 * draw, 10 * draw, 0).rot('head', 0, -20 * draw, 0);
      pose(P, 'overhead', over).rot('body', -10 * over, 0, 0).rot('head', -14 * over, 0, 0);
      pose(P, 'slam', slam).rot('body', 30 * slam, 0, 0).rot('head', -24 * slam, 0, 0).pos('root', 0, -1.2 * slam, 1 * slam);
      pose(P, 'shoulder', shoulder);
      const back = seg(t, 2.42, 2.52) * (1 - seg(t, 2.55, 2.7)); pose(P, 'draw', back);
      const dyS = -1.6 * over * 0.6 - 1.2 * slam + wob(t, 1.14, -0.8, 3, 6); P.pos('body', 0, dyS, 0); plant(P, dyS);
      P.sq('body', -0.1 * seg(t, 1.12, 1.15) * (1 - seg(t, 1.2, 1.4)) + wob(t, 1.14, 0.06, 4, 7));
      const horns = seg(t, 1.55, 1.72, E.back) * (1 - seg(t, 2.42, 2.6, E.inout));
      pose(P, 'horns', horns).scl('foreR', 1, 1 + 0.25 * horns, 1); P.face('hand', horns > 0.3 ? 'horns' : 'fist');
      const nod = bump(t, 1.8, 1.98) + bump(t, 2.02, 2.2);
      P.rot('head', -10 * horns + 22 * nod, 0, 6 * horns).rot('jaw', 22 * horns + 30 * over).rot('body', 4 * nod, 0, 0);
      P.face('eyes', over > 0.3 || slam > 0.3 ? 'glare' : t > 1.4 ? 'smug' : undefined); P.lookW = 1 - Math.max(over, slam);
      P.burst(1.14, 'ring', 'mallet', MALLET, { scale: 0.8 }).burst(1.14, 'dust', 'mallet', MALLET, { n: 10, spread: 1, speed: 1.2 }).burst(1.14, 'rock', 'mallet', MALLET, { n: 6, dir: [0, 1, 0], speed: 0.9 }).burst(1.14, 'spark', 'mallet', MALLET, { scale: 1.2 });
      P.burst(1.78, 'sparkle', 'head', TOOTH, { n: 3, spread: 0.6 }).burst(1.8, 'note', 'head', [5, 28, 2], {}).burst(2.02, 'note', 'head', [-5, 28, 2], {});
      shing(P, t, 1.15, 1.2); P.burst(0.55, 'dust', 'root', [0, 0.5, 0], { n: 3, speed: 0.6 });
    } },
    // asleep: slumped where it stands, chin on its chest, a snot bubble swelling at its nose
    sleep: { len: 3.2, loop: true, f(P, t) {
      const br = Math.sin((t / 3.2) * Math.PI * 2), dy = -2.6 + br * 0.35;
      P.pos('body', 0, dy, 0).rot('body', 12 + br * 2, 0, 0).sq('body', -0.04 + br * 0.03); plant(P, dy);
      P.rot('head', 10 + br * 3, 0, 12).rot('jaw', 4 + Math.max(0, br) * 6);
      pose(P, 'dangle', 0.8);
      P.rot('earR', 0, 0, 16).rot('earL', 0, 0, -16).rot('tail1', 0, -10, 0);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0;
      P.burst(0.4, 'z', 'head', [4, 26, 4], {}).burst(1.8, 'z', 'head', [4, 26, 4], {});
      P.burst(0.1, 'bubble', 'head', NOSE, { n: 1, speed: 0.1 });
    } },
    // fidget: checks nobody's looking, pulls out a stolen wedge of cheese, hunches over it and nibbles
    // at top speed with both paws, then freezes, caught — and hides it behind its back
    nibble: { len: 2.7, next: 'idle', f(P, t) {
      const look = Math.sin(seg(t, 0.0, 0.5, E.lin) * Math.PI * 2);
      P.rot('head', 0, 26 * look * (1 - seg(t, 0.45, 0.55)), 0);
      P.face('eyes', t < 0.5 ? 'sly' : undefined);
      const dip = bump(t, 0.4, 0.74), eat = seg(t, 0.66, 0.86, E.out3) * (1 - seg(t, 1.9, 2.0, E.out));
      P.rot('armR', 46 * dip, 0, -16 * dip).rot('foreR', -36 * dip);
      pose(P, 'eat', eat).rot('head', 16 * eat, 0, 0).rot('body', 8 * eat, 0, 0);
      const crouch = -1.0 * eat; P.pos('body', 0, crouch, 0); plant(P, crouch);
      P.face('cheese', t > 0.56 && t < 2.24 ? (t > 1.3 ? 'bitten' : 'whole') : 'off');
      const nib = t > 0.9 && t < 1.86 ? Math.max(0, Math.sin(t * Math.PI * 2 * 7.5)) : 0;
      P.rot('jaw', 16 * nib + 3 * eat).rot('head', -5 * nib, 0, 2 * wave(t, 3.7) * eat).scl('nose', 1 + 0.25 * nib, 1 - 0.1 * nib, 1);
      P.rot('armR', 3 * nib).rot('armL', 3 * nib).rot('earR', 0, 0, 4 * nib).rot('earL', 0, 0, -4 * nib);
      if (t > 0.92 && t < 1.84) P.stream('crumb', 'head', [0, 15, 10.5], { rate: 12, dir: [0, -0.2, 1], speed: 0.7 });
      // caught! freeze, eyes wide, ears up — then whip the cheese behind its back
      const startle = seg(t, 1.88, 1.94, E.out) * (1 - seg(t, 2.35, 2.6, E.inout));
      const hide = bump(t, 1.98, 2.38);
      P.rot('armR', 70 * hide, 0, -20 * hide).rot('foreR', -60 * hide);
      P.face('eyes', startle > 0.3 ? 'wide' : eat > 0.5 ? 'smug' : undefined); P.lookW = Math.max(1 - eat, startle);
      P.rot('earR', 0, 0, -20 * startle).rot('earL', 0, 0, 20 * startle).pos('body', 0, 1.0 * startle, 0).rot('head', -10 * startle, 0, 0).sq('body', 0.06 * startle);
      P.burst(1.9, 'sweat', 'head', [5.5, 24, 4], { n: 2, dir: [1, 0.6, 0] });
      tailSway(P, t, 1.4, 0.6 + 1.5 * startle);
    } },
    // fidget: a boxer's swagger — thumb flicked across the nose, a sniff, a shoulder roll, a smirk
    swagger: { len: 1.8, next: 'idle', f(P, t) {
      const wipe = seg(t, 0.1, 0.28, E.out3) * (1 - seg(t, 0.62, 0.8, E.inout));
      const sweep = Math.sin(seg(t, 0.28, 0.58, E.inout) * Math.PI);
      pose(P, 'wipe', wipe); P.rot('armR', 0, 18 * sweep, 0);
      P.rot('head', -6 * wipe, 8 * sweep, -8 * sweep).scl('nose', 1 + 0.3 * sweep, 1 - 0.15 * sweep, 1);
      P.burst(0.42, 'sweat', 'head', NOSE, { n: 1, dir: [-1, 0.5, 0.4], speed: 0.6 });
      const roll = bump(t, 0.8, 1.2), roll2 = bump(t, 1.05, 1.45);
      P.rot('armR', -10 * roll, 0, -12 * roll).rot('armL', -10 * roll2, 0, 12 * roll2).rot('body', 0, 9 * roll - 9 * roll2, 5 * roll - 5 * roll2);
      P.rot('head', 0, 0, 10 * roll - 10 * roll2);
      P.face('eyes', t > 0.3 && t < 1.6 ? 'smug' : undefined).rot('jaw', 6 * bump(t, 1.2, 1.7));
      P.burst(1.25, 'sparkle', 'head', TOOTH, { n: 2, spread: 0.5 });
      const b = bounce(t, 0.6, { squash: 0.05, stretch: 0.02 }), dy = b.u * 0.6 - 0.3; P.pos('body', 0, dy, 0).sq('body', b.sq); plant(P, dy);
    } },
  },
};
def.anim = anim;
