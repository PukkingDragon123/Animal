// Four wild Tokonmon as hand-pixel art (see src/px/pixmon.js for the painter).
// Views are drawn facing left; the game mirrors them for the other side.
import { FX } from '../../px/pixmon.js';

const TAU = Math.PI * 2, RD = Math.round;
// a leaf/blade outline from its base (x, y) along angle a: length, half-width, sideways bend of the tip
function leafPts(x, y, a, len, wid, bend = 0, n = 10, fat = 0.75) {
  const ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux, A = [], B = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n, w = k === n ? 0 : wid * Math.sin(Math.PI * Math.pow(t, fat)), b = bend * t * t;
    const cx = x + ux * len * t + px * b, cy = y + uy * len * t + py * b;
    A.push([cx + px * w, cy + py * w]); B.push([cx - px * w, cy - py * w]);
  }
  return [...A, ...B.reverse()];
}
// a point along that leaf's midrib
function leafAt(x, y, a, len, bend, t) { const ux = Math.cos(a), uy = Math.sin(a), b = bend * t * t; return [x + ux * len * t - uy * b, y + uy * len * t + ux * b]; }
// stable per-frame jitter
const hash = (a) => { const s = Math.sin(a * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

// ================================================================== LEMMO
// The lemon battery that walks: a plump lemon lying on its side on two stubby
// feet, a nub at either end, a permanently sour pout. A copper strip and a zinc
// nail are stuck in its head like antennae with a little arc crackling between
// them; a sprig of two leaves for ears.
const LEM_PAL = {
  peel: { ramp: ['#fff6a0', '#ffe445', '#efb92c', '#c47e34'], line: '#4a2418', lineLit: '#a0681e', th: [0.8, 0.42, 0.06] },
  feet: { ramp: ['#d6ee74', '#8cc044', '#4e8a36', '#2e5a30'], line: '#142612', lineLit: '#36582a' },
  copper: { ramp: ['#ffd4ae', '#f0874c', '#bc542e', '#7c3026'], line: '#3a1210', lineLit: '#7a2c1c', gloss: true, spec: 0.88, specC: '#fff2e0' },
  zinc: { ramp: ['#f6faff', '#c2cce4', '#8892ba', '#585e8a'], line: '#20223c', lineLit: '#4a4e78', gloss: true, spec: 0.9 },
  leaf: { ramp: ['#d8f27a', '#86c84c', '#43923c', '#265e32'], line: '#16301a', lineLit: '#2a5a26' },
  stem: { ramp: ['#d2c07a', '#9a8248', '#665234', '#40322a'], line: '#22180e' },
  juice: { ramp: ['#ffffec', '#fff47c', '#ffd83e', '#f0aa2c'], line: '#7a4a14', lineLit: '#b8861e', th: [0.62, 0.32, 0.08] },
};
const LEYE = {   // near eye / far eye: heavy, sour lids
  open: [['kkkkk', '.kWkk', '.kkkk', '..kk.'], ['kkkk', 'kWk.', 'kkk.', '.k..']],
  fierce: [['k....', '.kk..', '.kkkk', '.kWkk', '..kk.'], ['...k', '..k.', 'kkk.', 'kWk.', '.k..']],
  closed: [['.....', '.....', 'k...k', '.kkk.'], ['....', '....', 'k.k.', '.k..']],
  sleep: [['.....', '.....', '.....', 'kkkkk'], ['....', '....', '....', 'kkk.']],
  happy: [['.....', '..k..', '.k.k.', 'k...k'], ['....', '.k..', 'k.k.', '....']],
  hurt: [['k....', '.kk..', '...kk', '.kk..', 'k....'], ['..k.', 'kk..', '..k.']],
  ko: [['k...k', '.k.k.', '..k..', '.k.k.', 'k...k'], ['k.k.', '.k..', 'k.k.']],
};
const LEYEMAP = { k: '#2a1410', W: '#ffffff' };
function sparkArc(P, ax, ay, bx, by, ph, rise = 1) {
  // a jagged little arc between two points, re-struck every couple of frames
  const n = Math.max(3, RD(Math.hypot(bx - ax, by - ay) / 2.2)), seed = (ph >> 1) * 7.31; let px = ax, py = ay;
  for (let k = 1; k <= n; k++) {
    const t = k / n, j = k < n ? (k % 2 ? -1 : 1) * (hash(seed + k) > 0.35 ? 2 : 1) * (hash(seed) > 0.5 ? 1 : -1) : 0;
    const x = RD(ax + (bx - ax) * t), y = RD(ay + (by - ay) * t - Math.sin(t * Math.PI) * rise + j);
    P.ink(px, py, x, y, '#ffffff'); px = x; py = y;
  }
  P.dot(ax - 1, ay - 1 - (ph >> 1) % 2, '#fff27a'); P.dot(bx + 1, by - 1 - ((ph >> 1) + 1) % 2, '#a8f4ff');
}
function lemonJuice(P, x, y, m) {
  // a squirt of electric lemon juice: a jet that arcs down, droplets breaking off, sparks crackling along it
  const len = 6 + m.k * 30, ph = m.ph;
  const pts = [];
  for (let s = 0; s <= len; s += 3) pts.push([x - s - 1, y + s * s * 0.006 + Math.sin(s * 0.5 + ph) * 0.7, 1.2 + s * 0.045 + ((s / 3 + ph) % 3 === 0 ? 0.45 : 0)]);
  P.tube(pts, 'juice', { glow: true, round: 2.2, grp: 'fx-juice' });
  for (let k = 0; k < 5; k++) { const s = (ph * 3 + k * 7) % Math.max(5, len | 0); if (s < 4) continue; P.circ(x - s - 3, y + 4 + ((k * 5 + ph) % 4) + RD(s * s * 0.006), 1 + (k % 2) * 0.5, 'juice', { glow: true, round: 1.5, grp: 'fx-drop' + k }); }
  for (let k = 0; k < 4; k++) { const s = (ph * 4 + k * 9) % Math.max(6, len | 0), xx = x - s - 3, yy = y - 4 - ((k * 3 + ph) % 3) + RD(s * s * 0.006); P.ink(xx, yy, xx - 1, yy - 1, '#ffffff'); P.ink(xx - 1, yy - 1, xx - 3, yy - 1, k % 2 ? '#a8f4ff' : '#ffffff'); P.dot(xx - 3, yy, '#fff27a'); }
}
function lemmo(P, m) {
  const back = m.view === 'back', sq = m.sq, tilt = m.tilt || 0, lean = m.lean;
  const X = 40 + m.dx, base = 61 + m.bob;
  const rx = 14 + sq, ry = 10.5 - sq;
  const cy = base - 3 - ry, top = cy - ry;
  const rot = (back ? -0.06 : 0.07) + (back ? 0 : lean * 0.04) - tilt * 0.2, c = Math.cos(rot), s = Math.sin(rot);
  const fx = X - lean;
  const spark = m.clip !== 'faint' && m.clip !== 'sleep' && (m.ph % 6 !== 5);
  // ---- feet
  const feet = () => {
    const nearUp = m.step > 0 ? 2 : 0, farUp = m.step < 0 ? 2 : 0;
    const fl = back ? 0 : -1;
    P.ell(X - 6 + fl, base - 0.5 - farUp, 3.4, 2.2, 'feet', { grp: 'footF' });
    P.ell(X + 5 + fl, base - nearUp, 3.9, 2.5, 'feet', { grp: 'footN' });
    if (!back) { P.stamp(X - 10, base + 1 - farUp, ['d.d'], { d: '#2e5a30' }, { on: true }); P.stamp(X + 1, base + 1 - nearUp, ['d.d'], { d: '#2e5a30' }, { on: true }); }
  };
  // ---- the sprig of leaves (ears) and the electrodes
  const sprig = (sx, sy, flip) => {
    const flop = Math.sin(m.t * TAU * (m.clip === 'idle' ? 1 : 2)) * 0.08, droop = tilt * 0.7;
    P.tube([[sx, sy + 1, 1.1], [sx + (flip ? -1 : 1), sy - 2, 1]], 'stem', { grp: 'stem', round: 1 });
    const aF = Math.PI + 0.22 - droop - flop, aN = -0.22 + droop + flop;
    P.poly(leafPts(sx - 1, sy - 1, aF, 11, 3.2, -2), 'leaf', { grp: 'leafF', round: 2 });
    P.poly(leafPts(sx + 1, sy - 1, aN, 12, 3.5, 2), 'leaf', { grp: 'leafN', round: 2 });
    for (const [a, l, b, x0, col] of [[aF, 11, -2, sx - 1, '#d8f27a'], [aN, 12, 2, sx + 1, '#d8f27a']]) { const [ax, ay] = leafAt(x0, sy - 1, a, l, b, 0.3), [bx, by] = leafAt(x0, sy - 1, a, l, b, 0.8); P.line(ax, ay, bx, by, col); }
  };
  const droopE = RD(tilt * 4);
  // the copper strip (splays toward d) and the zinc nail (splays the other way)
  const copper = (bx, by, d) => {
    const tx = bx + d * (3 + droopE), ty = by - 8 + droopE;
    P.poly([[bx - 1, by + 2], [tx - 1, ty], [tx + 1, ty], [bx + 1, by + 2]], 'copper', { grp: 'cu', round: 1 });
    P.line(bx + (d < 0 ? -1 : 0), by, tx + (d < 0 ? 0 : -1), ty + 1, '#ffb07a');
    return [tx, ty - 1];
  };
  const zinc = (bx, by, d) => {
    const tx = bx + d * (2 + droopE), ty = by - 7 + droopE;
    P.tube([[bx, by + 1, 0.8], [tx, ty, 0.8]], 'zinc', { grp: 'zn', round: 1 });
    P.ell(tx, ty - 1, 2.2, 1, 'zinc', { grp: 'znH' });
    return [tx, ty - 2];
  };

  if (!back) {
    feet();
    sprig(X + 1, top + 1);
    // the lemon on its side: a plump ellipse with a nub at each end
    P.ell(X, cy, rx, ry, 'peel', { rot, grp: 'body' });
    P.ell(X - c * (rx - 0.5), cy - s * (rx - 0.5), 2.6, 2.4, 'peel', { rot, grp: 'body' });
    P.ell(X + c * (rx - 0.5), cy + s * (rx - 0.5), 2.8, 2.6, 'peel', { rot, grp: 'body' });
    // peel pores and a glint
    for (const [dx, dy] of [[-6, -6], [3, -7], [9, -4], [12, 1], [7, 4], [1, 6], [-9, 4], [-12, -1]]) P.stamp(X + dx, cy + dy, ['p'], { p: '#e3ad2c' }, { onMat: 'peel' });
    P.stamp(X - 8, cy - 8, ['.ww', 'w..'], { w: '#fffce0' }, { onMat: 'peel' });
    // electrodes stuck in the head, arc between them
    const A = copper(X - 2, top + 2, -1), B = zinc(X + 3, top + 1, 1);
    if (spark) sparkArc(P, A[0], A[1], B[0], B[1], m.ph, m.fx.has('aura') || m.fx.has('cast') ? 3 : 1);
    // face: sour eyes, a puckered pout
    const ex = m.eyes, e = LEYE[ex] || LEYE.open;
    const ey = cy - 5 + (ex === 'happy' || ex === 'closed' ? 1 : 0);
    P.stamp(fx - 4, ey, e[0], LEYEMAP, { on: true });
    P.stamp(fx - 12, ey, e[1], LEYEMAP, { on: true });
    const hot = m.fx.has('blush');
    P.stamp(fx - 3, cy + 1, [hot ? 'rrrr' : '.rr.'], { r: hot ? '#ff6a3a' : '#ffa25a' }, { on: true });
    P.stamp(fx - 13, cy + 1, ['r'], { r: hot ? '#ff6a3a' : '#ffa25a' }, { on: true });
    const mx = fx - 9, my = cy + 1;
    const LIP = { l: '#e0782e', L: '#ffb35a', k: '#5a1e14', t: '#ff7a6a' };
    if (m.mouth === 0) P.stamp(mx - 1, my, ['.kk.', 'k..k'], LIP, { on: true });
    else if (m.mouth === 1) P.stamp(mx - 1, my, ['.kk.', 'kkkk', 'ktkk', '.ll.'], LIP, { on: true });
    else P.stamp(mx - 1, my - 1, ['.LLL.', 'Lkkkl', 'lkkkl', 'lkttl', '.lll.'], LIP, { on: true });
  } else {
    feet();
    P.ell(X, cy, rx, ry, 'peel', { rot, grp: 'body' });
    P.ell(X - c * (rx - 0.5), cy - s * (rx - 0.5), 2.8, 2.6, 'peel', { rot, grp: 'body' });
    P.ell(X + c * (rx - 0.5), cy + s * (rx - 0.5), 2.6, 2.4, 'peel', { rot, grp: 'body' });
    for (const [dx, dy] of [[-6, -6], [3, -7], [9, -4], [-11, 0], [1, 1], [7, 4], [-3, 6], [11, 2]]) P.stamp(X + dx, cy + dy, ['p'], { p: '#e3ad2c' }, { onMat: 'peel' });
    P.stamp(X - 7, cy - 8, ['.ww', 'w..'], { w: '#fffce0' }, { onMat: 'peel' });
    // battery marks under each electrode
    P.stamp(X + 3, cy - 3, ['.m.', 'mmm', '.m.'], { m: '#c47e34' }, { onMat: 'peel' }); P.stamp(X - 6, cy - 2, ['mmm'], { m: '#c47e34' }, { onMat: 'peel' });
    sprig(X, top + 1, true);
    const B = zinc(X - 3, top + 1, -1), A = copper(X + 2, top + 2, 1);
    if (spark) sparkArc(P, B[0], B[1], A[0], A[1], m.ph, 1);
  }
  // ---- effects
  if (m.fx.has('breath')) lemonJuice(P, fx - 10, cy + 2, m);
  if (m.fx.has('toss')) { const t = m.k, x = X - 16 - t * 32, y = top - 4 - Math.sin(t * Math.PI) * 12; P.circ(x, y, 2.6, 'juice', { glow: true, round: 2, grp: 'fly' }); P.dot(x + 4, y - 1, '#ffffff'); P.dot(x + 5, y + 1, '#a8f4ff'); P.dot(x - 1, y - 4, '#ffffff'); }
  if (m.fx.has('dash')) { FX.dash(P, X + rx + 1, cy, m); if (m.ph % 2) sparkArc(P, X + rx + 3, cy + 5, X + rx + 12, cy + 3, m.ph, 1); }
  if (m.fx.has('swipe')) FX.swipe(P, fx - rx - 4, cy - 1);
  if (m.fx.has('hit')) FX.hit(P, X + 2, cy - 3, m);
  if (m.fx.has('aura') || m.fx.has('cast')) FX.aura(P, X, cy + 1, rx + 5, ry + 4, m, '#fff04a');
  if (m.fx.has('sparkle')) FX.sparkle(P, X, cy - 2, m, '#fff6a0');
  if (m.fx.has('zz')) FX.zz(P, X + 10, top - 6, m);
  if (m.fx.has('steam')) FX.steam(P, fx - 2, top - 6, m);
  if (m.fx.has('hearts')) FX.hearts(P, X + 12, top - 4, m);
  if (m.fx.has('bond')) FX.aura(P, X, cy + 1, rx + 6, ry + 5, m, '#7af0ff');
}

// ================================================================== CABBUNNY
// A farm bunny that IS a cabbage: a round head of overlapping leaves — dark waxy
// outer leaves cupping it from below, paler leaves round the sides, a tight pale
// heart on top — with a soft cream bunny face peeking out. Its ears are the two
// tallest outer leaves, veined and floppy at the tips.
const CAB_PAL = {
  outer: { ramp: ['#86c46a', '#3f8a52', '#26604c', '#173c40'], line: '#0a201e', lineLit: '#204a36', th: [0.66, 0.34, 0.02], gloss: true, spec: 0.9, specC: '#c8f0a4' },
  mid: { ramp: ['#eefab0', '#b4e070', '#78b45a', '#4a8452'], line: '#14321e', lineLit: '#3a6a32', th: [0.66, 0.34, 0.02] },
  heart: { ramp: ['#fdffe8', '#eef8b8', '#cfe48a', '#9cbc66'], line: '#284a24', lineLit: '#5a7a3a' },
  face: { ramp: ['#fffcf2', '#fff0d8', '#f0caa8', '#c8948e'], line: '#4a2a2e', lineLit: '#9a6a5a' },
  carrot: { ramp: ['#ffd08a', '#ff9a3a', '#e0642a', '#a8402c'], line: '#4a1a14', lineLit: '#8a3a1c' },
  leafx2: { ramp: ['#e8ff9a', '#9ee05a', '#4aa83e', '#2a6a36'], line: '#14321e' },
};
const CEYE = {
  open: [['.kk.', 'kWWk', 'kWkk', 'kkgk', '.kk.'], ['.kk', 'kWk', 'kkk', '.k.']],
  fierce: [['k...', '.kk.', 'kWkk', 'kkgk', '.kk.'], ['..k', '.k.', 'kWk', '.k.']],
  closed: [['....', '....', 'k..k', '.kk.'], ['...', '...', 'k.k', '.k.']],
  sleep: [['....', '....', '....', 'kkkk'], ['...', '...', '...', 'kkk']],
  happy: [['....', '.kk.', 'k..k', '....'], ['...', '.k.', 'k.k', '...']],
  hurt: [['k...', '.kk.', '...k', '.kk.', 'k...'], ['..k', 'kk.', '..k']],
  ko: [['k..k', '.kk.', '.kk.', 'k..k'], ['k.k', '.k.', 'k.k']],
};
const CEYEMAP = { k: '#24161c', W: '#ffffff', g: '#4a7a5a' };
// a line drawn only over one group's pixels (veins that stop where another part overlaps)
function gline(P, x0, y0, x1, y1, c, grp) {
  const g = P.g(grp); x0 = RD(x0); y0 = RD(y0); x1 = RD(x1); y1 = RD(y1);
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let k = 0; k <= n; k++) { const x = RD(x0 + ((x1 - x0) * k) / n), y = RD(y0 + ((y1 - y0) * k) / n); if (P.inb(x, y) && P.grp[y * P.w + x] === g) P.px(x, y, c); }
}
function cabbunny(P, m) {
  const back = m.view === 'back', sq = m.sq, tilt = m.tilt || 0, lean = m.lean;
  const X = 40 + m.dx, base = 61 + m.bob;
  const rx = 12 + sq, ry = 11 - sq;
  const cy = base - 1 - ry, top = cy - ry;
  const fx = X - 6 - lean, fy = cy + 1;
  const sleep = m.clip === 'sleep';
  const sway = Math.sin(m.t * TAU * (m.clip === 'idle' ? 1 : 2)), flap = m.clip === 'happy' ? (m.arm ? 0.25 : -0.1) : m.clip === 'run' || m.clip === 'walk' ? -m.bob * 0.07 : 0;
  // ---- an ear: one of the two tallest outer leaves — pale inner face, pale midrib, the tip flopping outward
  const ear = (bx, by, a, len, wid, bend, grp, front) => {
    P.poly(leafPts(bx, by, a, len, wid, bend, 14, 1.15), 'outer', { grp, round: 2.5 });
    if (front) P.poly(leafPts(bx, by, a, len - 3, wid - 1.5, bend * 0.75, 14, 1.15), 'mid', { paint: true, grp, lit: 0.02 });
    let [px, py] = leafAt(bx, by, a, len, bend, 0.08);
    for (let k = 1; k <= 7; k++) { const [x, y] = leafAt(bx, by, a, len, bend, 0.08 + k * 0.1); gline(P, px, py, x, y, front ? '#f6fdd8' : '#8cc86a', grp); px = x; py = y; }
  };
  const feet = () => {
    const nearUp = m.step > 0 ? 2 : 0, farUp = m.step < 0 ? 2 : 0;
    P.ell(X - 6, base - 0.5 - farUp, 3.6, 2.1, 'face', { grp: 'footF' });
    P.ell(X + 5, base - nearUp, 4, 2.3, 'face', { grp: 'footN' });
    if (!back) { P.stamp(X - 10, base + 1 - farUp, ['p.p'], { p: '#d8a49a' }, { on: true }); P.stamp(X + 1, base + 1 - nearUp, ['p.p'], { p: '#d8a49a' }, { on: true }); }
  };
  // a wrapping leaf: an ellipse with a pale midrib curving up from its base
  const wrap = (x, y, rxx, ryy, rot, mat, grp, curve = 0, vc) => {
    P.ell(x, y, rxx, ryy, mat, { rot, grp });
    vc = vc || (mat === 'outer' ? '#8cc86a' : '#f6fdd0');
    const sn = Math.sin(rot), cs = Math.cos(rot); let px = null, py = null;
    for (let k = 0; k <= 8; k++) { const t = -0.92 + k * 0.2, q = (1 - t * t) * curve; const x2 = x - sn * ryy * t + cs * q, y2 = y + cs * ryy * t + sn * q; if (px !== null) gline(P, px, py, x2, y2, vc, grp); px = x2; py = y2; }
  };
  const heart = (x, y) => {
    P.ell(x, y, 6, 3.6, 'heart', { grp: 'heart' });
    P.ell(x + 2, y + 1.5, 4, 2.6, 'heart', { grp: 'heart2' });
    P.stamp(x - 3, y - 2, ['.ww', 'w..'], { w: '#ffffff' }, { onMat: 'heart' });
  };
  // paws by arm pose
  const paws = () => {
    const A = {
      0: [[fx + 3, fy + 6], [fx - 4, fy + 6]],
      1: [[fx + 1, fy - 8], [fx - 7, fy - 8]],
      2: [[fx - 11, fy - 4], [fx - 7, fy - 8]],
      3: [[fx - 4, fy + 6], [fx - 9, fy + 5]],
      4: [[fx - 1, fy + 5], [fx - 7, fy + 5]],
    }[m.arm] || [];
    A.forEach(([x, y], k) => { P.ell(x, y, k ? 2.2 : 2.5, 1.8, 'face', { grp: 'paw' + k }); P.stamp(x - 1, y + 1, ['p.p'], { p: '#d89a92' }, { on: true }); });
  };
  const carrot = (len) => {
    const x0 = fx - 4, y0 = fy + 3, a = 2.55, ux = Math.cos(a), uy = Math.sin(a), ex = x0 + ux * len, ey = y0 + uy * len;
    P.poly(leafPts(ex, ey, a + Math.PI, len + 1, 2, 0, 8, 0.45), 'carrot', { grp: 'carrot', round: 2 });
    P.tube([[ex, ey, 1], [ex - 3, ey + 2, 0.8]], 'leafx2', { grp: 'ctop' }); P.tube([[ex, ey, 1], [ex - 1, ey + 4, 0.8]], 'leafx2', { grp: 'ctop' });
  };

  if (!back) {
    feet();
    const fA = -Math.PI / 2 - 0.32 - sway * 0.04 - flap - tilt * 1.2, nA = -Math.PI / 2 + 0.24 + sway * 0.05 + flap + tilt * 1.1;
    if (!sleep) { ear(X - 3, top + 4, fA, 15, 3.3, -3.2, 'earF', true); ear(X + 4, top + 3, nA, 16, 3.8, 3.6, 'earN', true); }
    // the cabbage: tight heart on top, the face peeking out of it, dark outer leaves wrapping the sides and cupping from below
    P.ell(X + 1, cy, rx, ry, 'mid', { grp: 'ball' });
    heart(X + 2, top + 3);
    wrap(X - 9, cy, 3.6, 8.5, 0.35, 'mid', 'sideF', 0.6);
    wrap(X - 10, cy + 6, 3.6, 5, 0.6, 'outer', 'outF', 0);
    P.ell(fx, fy, 8, 7, 'face', { grp: 'face' });
    P.ell(fx - 1, fy + 2, 5, 3, 'face', { paint: true, grp: 'face', lit: 0.12 });
    wrap(X + 6, top + 4, 5.5, 3, -0.5, 'mid', 'hood', 0);
    wrap(X + 8, cy - 1, 6, 9.5, -0.25, 'mid', 'sideN', -1.4);
    wrap(X + 7, cy + 7, 7, 4.6, -0.42, 'outer', 'outN', 0);
    wrap(X - 2, cy + 9, 9.5, 3.6, 0.06, 'outer', 'outC', 0);
    if (m.arm === 4 && m.clip === 'eat') carrot(Math.max(3, 9 - Math.floor(Math.max(0, m.t - 0.15) * 16)));
    paws();
    // face: eyes, nose, mouth, blush
    const ex = m.eyes, e = CEYE[ex] || CEYE.open, dy = ex === 'happy' || ex === 'closed' || ex === 'sleep' ? 1 : 0;
    P.stamp(fx + 1, fy - 4 + dy, e[0], CEYEMAP, { on: true });
    P.stamp(fx - 6, fy - 4 + dy, e[1], CEYEMAP, { on: true });
    const hot = m.fx.has('blush');
    P.stamp(fx + 2, fy + 1, [hot ? 'rrr' : 'rr'], { r: hot ? '#ff6a8a' : '#ffb0b4' }, { on: true }); P.stamp(fx - 7, fy + 1, ['r'], { r: hot ? '#ff6a8a' : '#ffb0b4' }, { on: true });
    const N = { n: '#ff8aa0', N: '#d8607a', k: '#6a2a3a', t: '#ff7a8a' };
    if (m.mouth === 0) P.stamp(fx - 3, fy, ['nN', 'k.', '.k'], N, { on: true });
    else P.stamp(fx - 4, fy, m.mouth === 1 ? ['.nN', '.kk', '.tk'] : ['.nN', 'kkk', 'ktk', '.k.'], N, { on: true });
    if (sleep) {
      // asleep: the ear-leaves fold down over its face like a blanket
      ear(X - 1, top + 3, Math.PI * 0.72, 13, 3.5, 1.5, 'earF', false);
      ear(X + 5, top + 2, Math.PI * 0.6, 15, 4, 1.5, 'earN', false);
    }
  } else {
    feet();
    const lA = -Math.PI / 2 - 0.3 - sway * 0.04 - flap - tilt * 1.2, rA = -Math.PI / 2 + 0.3 + sway * 0.04 + flap + tilt * 1.2;
    ear(X - 3, top + 4, lA, 15, 3.6, -3.4, 'earF', false); ear(X + 3, top + 4, rA, 15, 3.6, 3.4, 'earN', false);
    P.ell(X, cy, rx, ry, 'mid', { grp: 'ball' });
    heart(X, top + 3);
    wrap(X - 6, cy - 1, 6.5, 10, 0.25, 'mid', 'sideF', 1.2);
    wrap(X + 6, cy - 1, 6.5, 10, -0.25, 'mid', 'sideN', -1.2);
    wrap(X - 7, cy + 7, 6.5, 4.6, 0.45, 'outer', 'outF', 0);
    wrap(X + 7, cy + 7, 6.5, 4.6, -0.45, 'outer', 'outN', 0);
    wrap(X, cy + 9, 8, 3.4, 0, 'outer', 'outC', 0);
    P.circ(X, cy + 5, 3.2, 'face', { grp: 'tail' });             // cotton tail
    P.stamp(X - 2, cy + 3, ['.w', 'w.'], { w: '#ffffff' }, { onMat: 'face' });
  }
  // ---- effects
  if (m.fx.has('breath')) FX.breath(P, fx - 6, fy + 2, m, 'leaf');
  if (m.fx.has('toss')) { const t = m.k, x = fx - 12 - t * 30, y = fy - 4 - Math.sin(t * Math.PI) * 12; P.circ(x, y, 2.8, 'mid', { grp: 'fly' }); P.ell(x + 1, y + 1, 2.2, 1.6, 'outer', { grp: 'fly2' }); P.px(x - 1, y - 1, '#f2fcc8'); }
  if (m.fx.has('dash')) FX.dash(P, X + rx + 2, cy, m);
  if (m.fx.has('swipe')) FX.swipe(P, fx - 10, fy);
  if (m.fx.has('hit')) FX.hit(P, X + 3, cy - 4, m);
  if (m.fx.has('aura') || m.fx.has('cast')) FX.aura(P, X, cy + 1, rx + 5, ry + 4, m, '#a8ff7a');
  if (m.fx.has('sparkle')) FX.sparkle(P, X, cy - 2, m, '#d8ffb0');
  if (m.fx.has('zz')) FX.zz(P, X + 10, top - 6, m);
  if (m.fx.has('steam')) FX.steam(P, fx, top - 4, m);
  if (m.fx.has('hearts')) FX.hearts(P, X + 12, top - 2, m);
  if (m.fx.has('bond')) FX.aura(P, X, cy + 1, rx + 6, ry + 5, m, '#7af0ff');
}

// ================================================================== KAPPACHI
// A pot-bellied canal kappa from Dōtonbori: a big round green head with a
// shallow dish of water set into its crown (it sloshes), a fringe of reed hair
// round the dish, a short duck bill with a cheeky grin, a turtle shell on its
// back paved like canal cobbles, webbed hands and feet — and a cucumber it
// carries like a club.
const KAP_PAL = {
  skin: { ramp: ['#d4f08c', '#8cc858', '#559c4a', '#356e4a'], line: '#12281c', lineLit: '#2e5a2a', th: [0.68, 0.3, -0.04] },
  belly: { ramp: ['#fffbd8', '#f4e6a2', '#d6bc74', '#a68a5c'], line: '#3e2e1c', lineLit: '#8a7448' },
  reed: { ramp: ['#a8e8c8', '#4cb4a0', '#2a7e80', '#1c4c5c'], line: '#0c2230', lineLit: '#1e4a52', th: [0.66, 0.34, 0.04] },
  dish: { ramp: ['#fffbea', '#efe2c4', '#c4ac98', '#8e767c'], line: '#2e2026', lineLit: '#6a5450' },
  pool: { ramp: ['#e8fbff', '#8ee0ff', '#3fa8ec', '#2a64c4'], line: '#16285e', lineLit: '#2a4a9a', flat: true },
  bill: { ramp: ['#fff2a0', '#ffcc4a', '#e8962e', '#b0602a'], line: '#4a2214', lineLit: '#8a4a1c' },
  shell: { ramp: ['#e6dcc4', '#b8a88e', '#857868', '#574a52'], line: '#221a24', lineLit: '#4a4048', th: [0.7, 0.4, 0.08] },
  rim: { ramp: ['#c8c070', '#8a8a44', '#5a6034', '#36402c'], line: '#161c10', lineLit: '#3a4224' },
  cuke: { ramp: ['#d8f08a', '#7cc04a', '#3e8a3a', '#22562e'], line: '#102a14', lineLit: '#2a5226', gloss: true, spec: 0.93, specC: '#f0ffd0' },
  flower: { ramp: ['#fff8b0', '#ffe04a', '#e8b02a', '#b07a20'], line: '#4a3010' },
};
const KEYE = {
  open: [['.kkk.', 'kWWkk', 'kWkkk', 'kkkkk', 'kkkgk', '.kkk.'], ['.kk', 'kWk', 'kkk', 'kgk', '.k.']],
  fierce: [['kk...', '.kkkk', 'kWkkk', 'kkkgk', '.kkk.'], ['..k', 'kk.', 'kWk', 'kgk', '.k.']],
  closed: [['.....', '.....', '.....', 'k...k', '.kkk.'], ['...', '...', '...', 'k.k', '.k.']],
  sleep: [['.....', '.....', '.....', '.....', 'kkkkk'], ['...', '...', '...', '...', 'kkk']],
  happy: [['.....', '.....', '.kkk.', 'k...k', '.....'], ['...', '...', '.k.', 'k.k', '...']],
  hurt: [['.....', 'k....', '.kk..', '...kk', '.kk..', 'k....'], ['...', '..k', 'kk.', '..k']],
  ko: [['.....', 'k...k', '.k.k.', '..k..', '.k.k.', 'k...k'], ['...', 'k.k', '.k.', 'k.k']],
};
const KEYEMAP = { k: '#1a1424', W: '#ffffff', g: '#3a8aa0' };
// a cucumber from its stem end (x0, y0) toward (x1, y1): bumpy, with a dried flower at the tip
function cucumber(P, x0, y0, x1, y1, grp = 'cuke') {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  P.tube([[x0, y0, 2.1], [x0 + dx * 0.35, y0 + dy * 0.35, 2.6], [x0 + dx * 0.8, y0 + dy * 0.8, 2.4], [x1, y1, 1.7]], 'cuke', { grp, round: 2 });
  for (let k = 1; k < 5; k++) { const t = k / 5.2, sx = -uy * (k % 2 ? 1 : -1), sy = ux * (k % 2 ? 1 : -1); P.px(x0 + dx * t + sx, y0 + dy * t + sy, k % 2 ? '#e8ffb0' : '#2a6a30'); }
  P.px(x0 - ux * 2, y0 - uy * 2, '#5a4a20');
  P.stamp(x1 + ux * 2 - 1, y1 + uy * 2 - 1, ['.f.', 'fFf', '.f.'], { f: '#ffe04a', F: '#fff8b0' }, { mat: 'flower', grp: grp + 'f' });
}
function kappachi(P, m) {
  const back = m.view === 'back', sq = m.sq, tilt = m.tilt || 0, lean = m.lean + (tilt ? RD(tilt * 2) : 0);
  const X = 41 + m.dx, base = 61 + m.bob;
  const brx = 10 + sq, bry = 9 - sq;
  const bx = X + 1 - RD(lean / 2), by = base - 3 - bry;
  const hx = X - 2 - lean, hy = by - bry - 8 + RD(tilt * 2), HR = 12;
  const top = hy - HR;
  const slosh = RD(Math.sin(m.t * TAU * (m.clip === 'idle' ? 1 : 2)) * 1.4) - Math.sign(m.lean);
  // ---- feet: webbed, three toes forward (left)
  const feet = () => {
    const nearUp = m.step > 0 ? 2 : 0, farUp = m.step < 0 ? 2 : 0;
    if (tilt < 0.6) { P.tube([[X - 5, by + 4, 2.4], [X - 6, base - 1 - farUp, 2.2]], 'skin', { grp: 'legF' }); P.tube([[X + 5, by + 4, 2.6], [X + 5, base - 1 - nearUp, 2.4]], 'skin', { grp: 'legN' }); }
    P.ell(X - 8, base - farUp, 4, 1.8, 'skin', { grp: 'footF' });
    P.ell(X + 3, base + 0.5 - nearUp, 4.6, 2, 'skin', { grp: 'footN' });
    if (!back) { P.stamp(X - 12, base - farUp, ['d.d.', '.l.l'], { d: '#2c6444', l: '#d4f08c' }, { on: true }); P.stamp(X - 2, base - nearUp, ['d.d.d', '.l.l.'], { d: '#2c6444', l: '#d4f08c' }, { on: true }); }
  };
  // ---- a webbed hand at (x, y)
  const hand = (x, y, grp, r = 2.4) => { P.ell(x, y, r, r - 0.3, 'skin', { grp }); P.stamp(x - 2, y - 2, ['d.d', '...'], { d: '#2c6444' }, { on: true }); };
  // ---- the shell, paved like canal cobbles
  const shell = (cx, cy, rx, ry, full) => {
    P.ell(cx, cy, rx + 1.5, ry + 1.5, 'rim', { grp: 'rim' });
    P.ell(cx, cy - 0.5, rx, ry, 'shell', { grp: 'shell' });
    const rows = full ? 6 : 5, rh = (2 * ry) / rows;
    for (let r = 1; r < rows; r++) {
      const y0 = cy - ry + r * rh;
      for (let x = cx - rx; x <= cx + rx; x++) { const u = (x - cx) / rx; gline(P, x, y0 + (1 - u * u) * 1.6, x, y0 + (1 - u * u) * 1.6, '#4a3e48', 'shell'); }
    }
    for (let r = 0; r < rows; r++) {
      const y0 = cy - ry + r * rh, off = r % 2 ? 2.5 : 0;
      for (let x = cx - rx - 2 + off; x <= cx + rx; x += 5) {
        const u = (x - cx) / rx, ya = y0 + (1 - u * u) * 1.6 + 1, yb = y0 + rh + (1 - u * u) * 1.6 - 1;
        gline(P, x, ya, x, yb, '#4a3e48', 'shell');
        gline(P, x + 1, ya, x + 2, ya, '#f4ecd8', 'shell');                        // lit top-left of each cobble
        if ((r * 7 + x) % 3 === 0) gline(P, x, yb + 1, x, yb + 1, '#6a9a4a', 'shell');   // moss in the joints
      }
    }
  };
  // ---- the head: reed fringe round a dish of water set into the crown
  const head = (faceOn) => {
    P.circ(hx, hy, HR, 'skin', { grp: 'head' });
    if (faceOn) P.ell(hx - 4, hy + 4, 6, 4, 'skin', { paint: true, grp: 'head', lit: 0.1 });
    // reed hair: a band round the crown with a ragged lower edge, a few blades flaring out at the sides
    const fr = (x) => { const u = (x - hx) / HR, tooth = [0, 1, 3, 1][((x | 0) % 4 + 4) % 4]; return (faceOn ? hy - 8 + u * u * (x < hx ? 3 : 5) + (x < hx ? 0 : u * 2) : hy - 2 + u * u * 2) + tooth; };
    P.shape(hx - HR - 2, top - 2, hx + HR + 2, hy + 4, (x, y) => Math.hypot(x - hx, y - hy) <= HR + 0.9 && y < fr(x), 'reed', { grp: 'hair', round: 3 });
    for (const [a, l] of [[Math.PI + 0.55, 5], [Math.PI + 0.15, 4], [-0.5, 5], [-0.12, 4]]) P.poly(leafPts(hx + 1 + Math.cos(a) * 9, top + 5 + Math.sin(a) * 2, a, l, 1.3, 0, 6, 0.6), 'reed', { grp: 'hair' });
    for (const [x, y] of [[-8, 3], [-4, 5], [5, 5], [9, 3]]) gline(P, hx + x, top + y, hx + x - Math.sign(x), top + y + 2, '#7ad0b8', 'hair');
    // the dish set into the crown: we look down into it, so its far inner wall shows and the water sits toward us
    const dx = hx + 1, dy = top + 1;
    P.ell(dx, dy + 1, 6.6, 3.2, 'dish', { grp: 'dish', rz: 2 });
    P.ell(dx, dy, 6.6, 3.4, 'dish', { grp: 'dish' });
    P.ell(dx, dy, 5.2, 2.5, 'dish', { paint: true, grp: 'dish', flat: true, light: 0.2, relight: true });
    if (m.clip !== 'faint' || tilt < 0.5) {
      P.ell(dx, dy + 0.7, 5, 1.9, 'pool', { grp: 'pool', light: 0.5 });
      P.stamp(dx - 3 + slosh, dy, ['ww.W'], { w: '#e8fbff', W: '#ffffff' }, { onMat: 'pool' });
      P.stamp(dx + 1 - slosh, dy + 2, ['dd'], { d: '#2a64c4' }, { onMat: 'pool' });
    }
  };
  // ---- the cucumber and the near arm, by pose
  const club = (eat) => {
    const sx = X + 6, sy = by - 5;                           // near shoulder
    if (m.arm === 1) { const h = [X + 8, top + 2]; P.tube([[sx, sy, 2.2], [h[0], h[1] + 4, 1.9]], 'skin', { grp: 'armN' }); cucumber(P, h[0] + 3, h[1] + 1, h[0] - 13, h[1] - 7); hand(h[0], h[1] + 1, 'handN'); return; }
    if (m.arm === 2) { const h = [hx - 8, hy + 6]; P.tube([[sx, sy, 2.2], [h[0], h[1], 1.9]], 'skin', { grp: 'armN' }); hand(h[0], h[1], 'handN'); return; }
    if (m.arm === 3) { const h = [X - 4, by - 1]; P.tube([[sx, sy, 2.2], [h[0], h[1], 1.9]], 'skin', { grp: 'armN' }); hand(h[0], h[1], 'handN'); return; }
    if (m.arm === 4) { const h = [hx - 3, hy + 10], len = eat; cucumber(P, h[0] + 3, h[1] + 1, h[0] + 3 - len * 0.9, h[1] + 1 - len * 0.45); P.tube([[sx, sy, 2.2], [h[0] + 1, h[1], 1.9]], 'skin', { grp: 'armN' }); hand(h[0], h[1], 'handN'); return; }
    const h = [X + 7, by + 2];
    P.tube([[sx, sy, 2.2], [h[0], h[1], 1.9]], 'skin', { grp: 'armN' });
    cucumber(P, h[0], h[1] + 3, h[0] + 7, h[1] - 15);
    hand(h[0], h[1], 'handN');
  };

  if (!back) {
    shell(bx + 9, by - 4, 7, 10, false);
    P.tube([[bx - 7, by - 4, 2], [bx - 10, by + 2, 1.8]], 'skin', { grp: 'armF' }); hand(bx - 10, by + 3, 'handF', 2.1);
    feet();
    P.ell(bx, by, brx, bry, 'skin', { grp: 'body' });
    P.ell(bx - 3, by + 1, brx - 3, bry - 1, 'belly', { paint: true, grp: 'body' });
    P.stamp(bx - 7, by - 1, ['..ddd..', 'dd...dd'], { d: '#d6bc74' }, { onMat: 'belly' }); P.stamp(bx - 6, by + 4, ['ddddd'], { d: '#d6bc74' }, { onMat: 'belly' });
    head(true);
    // face: big cheeky eyes, a short duck bill with a grin running up into the cheek
    const ex = m.eyes, e = KEYE[ex] || KEYE.open, dy = ex === 'happy' || ex === 'closed' || ex === 'sleep' ? 1 : 0;
    P.stamp(hx - 5, hy - 2 + dy, e[0], KEYEMAP, { on: true });
    P.stamp(hx - 11, hy - 2 + dy, e[1], KEYEMAP, { on: true });
    const hot = m.fx.has('blush');
    P.stamp(hx - 3, hy + 5, [hot ? 'rrrr' : '.rrr'], { r: hot ? '#ff6a6a' : '#f0a07a' }, { on: true });
    const kx = hx - 16, ky = hy + 2;
    const BK = { b: '#fff2a0', B: '#ffcc4a', D: '#e8962e', d: '#b0602a', k: '#4a2214', r: '#8a2a3a', t: '#ff7a8a' };
    if (m.mouth === 0) {
      P.stamp(kx, ky, ['...bbbB.', '.bDbbBBD', 'bbbBBBDD', '.kkkkkkk', '..ddddD.'], BK, { mat: 'bill', grp: 'bill' });
      P.stamp(kx + 8, ky + 1, ['..k', '.k.', 'k..'], BK, { on: true });                 // the grin curls up into the cheek
    } else if (m.mouth === 1) {
      P.stamp(kx, ky - 1, ['...bbbB.', '.bDbbBBD', 'bbbBBBDD', '.krrrrrk', '..krttkk', '...dddD.'], BK, { mat: 'bill', grp: 'bill' });
      P.stamp(kx + 8, ky + 1, ['.k', 'k.'], BK, { on: true });
    } else P.stamp(kx - 1, ky - 2, ['....bbbB.', '..bDbbBBD', '.bbbBBBDD', '.krrrrrrk', '..krrttrk', '...krttk.', '....dddD.'], BK, { mat: 'bill', grp: 'bill' });
    club(Math.max(4, 12 - Math.floor(Math.max(0, m.t - 0.15) * 16)));
  } else {
    feet();
    P.ell(bx, by, brx, bry, 'skin', { grp: 'body' });
    P.tube([[bx - 9, by - 4, 2.1], [bx - 12, by + 2, 1.9]], 'skin', { grp: 'armF' }); hand(bx - 12, by + 3, 'handF');
    head(false);
    shell(bx, by - 3, 10, 11, true);
    // the near arm (now on the right) with the cucumber
    if (m.arm === 1) { cucumber(P, X + 12, top + 3, X - 2, top - 5); P.tube([[bx + 9, by - 5, 2.1], [X + 11, top + 4, 1.9]], 'skin', { grp: 'armN' }); hand(X + 11, top + 3, 'handN'); }
    else if (m.arm === 2 || m.arm === 3) { P.tube([[bx + 9, by - 5, 2.1], [bx + 12, by - 1, 1.9]], 'skin', { grp: 'armN' }); hand(bx + 12, by, 'handN'); }
    else { P.tube([[bx + 9, by - 5, 2.1], [bx + 12, by + 1, 1.9]], 'skin', { grp: 'armN' }); cucumber(P, bx + 12, by + 5, bx + 18, by - 12); hand(bx + 12, by + 2, 'handN'); }
  }
  // spilt drops when it lurches
  if (m.clip === 'attack' || m.clip === 'hurt' || m.clip === 'run' || m.clip === 'dash') if (m.ph % 3 !== 2) { const s = m.ph % 3; P.circ(hx + 1 + (m.clip === 'hurt' ? -7 : 8) + s * (m.clip === 'hurt' ? -1 : 1), top - 2 - s, 1, 'water', { glow: true, round: 1, grp: 'drop' }); }
  // ---- effects
  if (m.fx.has('breath')) FX.breath(P, hx - 17, hy + 3, m, 'water');
  if (m.fx.has('toss')) { const t = m.k, x = hx - 12 - t * 30, y = hy - 4 - Math.sin(t * Math.PI) * 12, a = t * 9; cucumber(P, x + Math.cos(a) * 5, y + Math.sin(a) * 5, x - Math.cos(a) * 5, y - Math.sin(a) * 5, 'fly'); }
  if (m.fx.has('dash')) FX.dash(P, X + 16, by - 4, m);
  if (m.fx.has('swipe')) FX.swipe(P, hx - 18, hy + 2);
  if (m.fx.has('hit')) FX.hit(P, X + 2, hy - 2, m);
  if (m.fx.has('aura') || m.fx.has('cast')) FX.aura(P, X, by - 8, 18, 20, m, '#7ad8ff');
  if (m.fx.has('sparkle')) FX.sparkle(P, X, hy + 4, m, '#c8f4ff');
  if (m.fx.has('zz')) FX.zz(P, X + 10, top - 4, m);
  if (m.fx.has('steam')) FX.steam(P, hx, top - 4, m);
  if (m.fx.has('hearts')) FX.hearts(P, X + 13, top, m);
  if (m.fx.has('bond')) FX.aura(P, X, by - 8, 19, 21, m, '#7af0ff');
}

// ================================================================== CHOCHOBAKE
// A hundred-year-old izakaya paper lantern that tore open and woke up: red washi
// glowing from inside, black lacquer caps top and bottom with a wire hanging
// loop, bamboo ribs that break round one huge violet eye, a torn rib for a mouth
// with a long pink tongue lolling out. It floats, and spits onibi ghost-fire.
const CHO_PAL = {
  paper: { ramp: ['#ffd486', '#ff8a40', '#e43c3c', '#a01e40'], line: '#34081c', lineLit: '#74162c', th: [0.82, 0.58, 0.22] },
  lacquer: { ramp: ['#6e5e84', '#3e3252', '#262034', '#16101c'], line: '#07050b', lineLit: '#2a2236', th: [0.82, 0.5, 0.15], gloss: true, spec: 0.9, specC: '#c8b8e8' },
  wire: { ramp: ['#ecdcb4', '#b49c72', '#7a6650', '#4e4038'], line: '#1a1210', lineLit: '#3a2e26' },
  tongue: { ramp: ['#ffd6e4', '#ff7aa4', '#e0457e', '#a42a62'], line: '#46081e', lineLit: '#8a1a40' },
  onibi: { ramp: ['#f8f4ff', '#bcb2ff', '#8270f4', '#5040c8'], line: '#1a1250', lineLit: '#3a2a8a', th: [0.6, 0.32, 0.08] },
};
const OEYE = {   // the one huge eye, 11×10 (o outline, W sclera, V/v/i iris, k pupil, s shine)
  open: ['...ooooo...', '.ooVVVVWoo.', '.oVvvvvVWo.', 'oVsvvvvvVWo', 'oVssvkkvVWo', 'oVvvkkkkVwo', 'oVvvvkkvVwo', '.oVvvvvsVo.', '.ooVViiVoo.', '...ooooo...'],
  fierce: ['...........', 'oo.........', '.ooooo.....', 'oVvvvoooo..', 'oVssvkkvooo', 'oVvvkkkkVwo', 'oVvvvkkvVwo', '.oVvvvvsVo.', '.ooVViiVoo.', '...ooooo...'],
  closed: ['...........', '...........', '...........', '...........', '...........', 'oo.......oo', '.ooo...ooo.', '...ooooo...'],
  sleep: ['...........', '...........', '...........', '...........', '...........', '...........', 'ooooooooooo', '.oooooooooo', '.o..o.o..o.'],
  happy: ['...........', '...........', '...........', '...ooooo...', '.ooooooooo.', 'ooo.....ooo', 'o.........o'],
  hurt: ['...........', 'oo.........', '..ooo......', '.....oooo..', '..ooo......', 'oo.........'],
  ko: ['...ooooo...', '.oo.....oo.', 'o...ooo...o', 'o..o...o..o', 'o..o.oo.o.o', 'o..o..o..o.', 'o...ooo..o.', '.o......o..', '..oooooo...'],
};
const OEYEMAP = { o: '#22061c', W: '#f6eeff', w: '#c8b4ec', V: '#5a26a8', v: '#9a4ef0', i: '#d29cff', k: '#160624', s: '#ffffff' };
const OMOUTH = [   // the torn rib: paper fibres (f) like little teeth along the top edge
  ['k.............k', '.kkfkkkfkkkfkk.', '..kkkkkkkkkkk..', '....kkggkkk....'],
  ['k.............k', '.kfkkkfkkkfkkk.', '.kkkkkkkkkkkkk.', '..kkkkkkkkkkk..', '...kkkgggkkk...', '.....kkkkk.....'],
  ['kk...........kk', '.kfkkkfkkkfkkk.', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', '.kkkkkgggkkkkk.', '..kkkkkkkkkkk..', '....kkkkkkk....'],
];
const OMOUTHMAP = { k: '#26061a', f: '#ffdcb8', g: '#6a1430' };
const FIRE_KANJI = ['.....kk.....', '.....kk.....', '.k...kk...k.', '.kk..kk..kk.', '..k..kk..k..', '.....kk.....', '....kkkk....', '...kk..kk...', '..kk....kk..', '.kk......kk.', 'kk........kk'];
// onibi ghost-fire: a round glowing head trailing a wisp up and behind it (P.flame drawn round-headed)
function onibi(P, x, y, h, w, lean, grp) { P.flame(x, y, h, w, lean, 'onibi', { glow: true, round: Math.max(1.6, w * 0.8), grp }); }
function chochobake(P, m) {
  const back = m.view === 'back', sq = m.sq, tilt = m.tilt || 0;
  const loop = m.clip === 'idle' || m.clip === 'walk' || m.clip === 'run' || m.clip === 'buff' || m.clip === 'happy' || m.clip === 'sleep';
  const float = loop ? RD(Math.sin(m.t * TAU * (m.clip === 'idle' || m.clip === 'sleep' ? 1 : 2)) * 1.5) : 0;
  const X = 40 + m.dx, rx = 12 + sq, ry = 16 - sq;
  const cy = 34 + m.bob + float + RD(tilt * 8);
  const k = (m.lean * 0.07 + tilt * 0.22) * (back ? -1 : 1);
  const sh = (y) => RD((cy - y) * k);                          // lean/tilt as a shear: the top swings forward
  const dim = m.clip === 'sleep' ? 0.12 : tilt * 0.5;          // the light inside dims when it sleeps or faints
  const ph = m.ph, sw = Math.sin(m.t * TAU * (loop ? 2 : 1));
  const ctop = cy - ry + 1, cbot = cy + ry - 1;
  // ---- wire hanging loop
  const wx = X - sh(ctop - 6);
  P.tube([[wx - 3, ctop - 3, 0.6], [wx - 3, ctop - 6, 0.6], [wx - 1, ctop - 8, 0.6], [wx + 1, ctop - 8, 0.6], [wx + 3, ctop - 6, 0.6], [wx + 3, ctop - 3, 0.6]], 'wire', { grp: 'wire', round: 1 });
  // ---- the tongue hangs behind when seen from the back
  const tongue = (front) => {
    if (m.clip === 'eat' && m.arm === 4) {        // licking: the tongue curls up and round
      const c = Math.sin(m.t * TAU * 3);
      P.tube([[X - 7, cy + 7, 2.2], [X - 12, cy + 6 + RD(c), 2.4], [X - 15, cy + 2 + RD(c), 2.1], [X - 14, cy - 1 + RD(c), 1.6]], 'tongue', { grp: 'tongue', round: 2 });
      return;
    }
    const s1 = RD(sw * 1), s2 = RD(sw * 2), lim = m.clip === 'sleep' || m.clip === 'faint' ? 1 : 0;
    const o = front ? 0 : 8;
    const pts = [[X - 7 + o - sh(cy + 7), cy + 7, 2], [X - 9 + o - sh(cy + 10), cy + 10, 2.4], [X - 11 + o + s1 - sh(cy + 14), cy + 14, 2.6], [X - 11 + o + s2 + lim, cy + 18 + lim, 2.8], [X - 9 + o + s2 + lim * 2, cy + 21 + lim, 2.2]];
    P.tube(pts, 'tongue', { grp: 'tongue', round: 2 });
    if (front) for (let j = 0; j < 3; j++) { const [a, b] = [pts[j], pts[j + 1]]; gline(P, a[0], a[1] + 1, b[0], b[1] - 1, '#e0457e', 'tongue'); }
    P.px(pts[1][0] - 1, pts[1][1], '#ffd6e4'); P.px(pts[2][0] - 1, pts[2][1], '#ffd6e4');
  };
  if (back) tongue(false);
  // ---- the paper body, glowing from inside
  const gx = X - 2, gy = cy - 2;
  const heat = (x, y) => { const xx = x + sh(y); const d = Math.hypot((xx - gx) / (rx * 0.98), (y - gy) / (ry * 0.98)); return 1.02 - d * 1.05 - (xx - X) / rx * 0.08 - (y - cy) / ry * 0.06 - dim; };
  const notch = (y) => { const f = ((y - (cy - ry) - 0.5) % 3 + 3) % 3; return f < 1 ? 0.9 : 0; };
  P.shape(X - rx - 4, cy - ry, X + rx + 4, cy + ry, (x, y) => { const v = (y - cy) / ry, w = rx * Math.sqrt(Math.max(0, 1 - v * v)) - notch(y); return Math.abs(x + sh(y) - X) <= w; }, 'paper', { grp: 'paper', heat });
  // bamboo ribs: rings bowing down toward us, broken round the eye and the mouth
  const ex = X - 4, ey = cy - 4;
  for (let r = 1; r < 10; r++) {
    const y0 = cy - ry + r * 3 - 0.5, v = (y0 - cy) / ry; if (Math.abs(v) >= 0.95) continue;
    const w = rx * Math.sqrt(1 - v * v);
    for (let x = -w + 1; x <= w - 1; x++) {
      const y = RD(y0 + (1 - (x / w) ** 2) * 1.2), X2 = RD(X + x - sh(y));
      if (!back && (((X2 - ex) / 6.6) ** 2 + ((y - ey) / 6.2) ** 2 < 1)) continue;
      if (!back && y > cy + 2 && y < cy + 11 && X2 > X - 12 - sh(y) && X2 < X + 5 - sh(y)) continue;
      const hv = heat(X2 + 0.5, y + 0.5);
      gline(P, X2, y, X2, y, hv > 0.56 ? '#e2642e' : hv > 0.2 ? '#b8283a' : '#701432', 'paper');
    }
  }
  if (!back) {
    // the eye, and the torn rib of a mouth
    const e = OEYE[m.eyes] || OEYE.open;
    P.stamp(ex - 5 - sh(ey), ey - 5, e, OEYEMAP, { on: true });
    const mo = OMOUTH[Math.min(2, m.mouth)];
    P.stamp(X - 10 - sh(cy + 5), cy + 4, mo, OMOUTHMAP, { on: true });
    const hot = m.fx.has('blush');
    if (hot) { P.stamp(X - 14 - sh(cy), cy + 1, ['rr'], { r: '#ffd0a0' }, { on: true }); P.stamp(X + 3 - sh(cy), cy + 1, ['rrr'], { r: '#ffd0a0' }, { on: true }); }
  } else {
    P.stamp(X - 6 - sh(cy), cy - 6, FIRE_KANJI, { k: '#2a0816' }, { on: true });
  }
  // ---- lacquer caps
  const cap = (y0, y1, hw, top) => {
    const sx = sh((y0 + y1) / 2);
    P.shape(X - hw - 2 - sx, y0 - 1, X + hw + 2 - sx, y1 + 1, (x, y) => { const xx = x + sx - X; const e = top ? (y > y1 - 1.2 ? 1 - ((y - y1 + 1.2) / 1.4) ** 2 * 0.25 : 1) : (y < y0 + 1.2 ? 1 - ((y0 + 1.2 - y) / 1.4) ** 2 * 0.25 : 1); return Math.abs(xx) <= hw * e && y >= y0 && y <= y1; }, 'lacquer', { grp: top ? 'capT' : 'capB', round: 2 });
    P.line(X - hw + 1 - sx, top ? y0 + 1 : y1 - 1, X - 1 - sx, top ? y0 + 1 : y1 - 1, '#8a7aa2');
  };
  cap(ctop - 3, ctop + 1, 7, true);
  cap(cbot - 1, cbot + 2, 6, false);
  if (!back) tongue(true);
  // ---- effects
  const mx = X - 9 - sh(cy + 6), my = cy + 6;
  if (m.fx.has('breath')) {
    // spits a stream of onibi wisps that drift up as they fly
    const len = 6 + m.k * 30;
    for (let j = 0; j < 4; j++) { const s = (ph * 2 + j * 9) % Math.max(6, len | 0); onibi(P, mx - s - 3, my + RD(Math.sin(s * 0.35 + j) * 2) - RD(s * 0.12), 7 + (j % 2) * 2 + RD(s * 0.05), 3 + (j % 2) * 0.5 + s * 0.02, 4, 'fx-oni' + j); }
    for (let j = 0; j < 4; j++) { const s = (ph * 3 + j * 9) % Math.max(6, len | 0); P.dot(mx - s - 4, my - 6 - ((j * 3 + ph) % 5), j % 2 ? '#b8b0ff' : '#ffffff'); }
  }
  if (m.fx.has('toss')) { const t = m.k, x = mx - 6 - t * 24, y = my - 4 - Math.sin(t * Math.PI) * 14; onibi(P, x, y + 3, 10, 3.8, 5, 'fly'); P.dot(x + 6, y - 3, '#ffffff'); P.dot(x - 4, y - 5, '#bcb2ff'); }
  if (m.fx.has('dash')) { FX.dash(P, X + rx + 1, cy, m); onibi(P, X + rx + 4, cy + 9, 7, 3, 6, 'fx-dash'); }
  if (m.fx.has('swipe')) FX.swipe(P, X - rx - 4, cy + 2);
  if (m.fx.has('hit')) FX.hit(P, X + 3, cy - 6, m);
  if (m.fx.has('aura') || m.fx.has('cast')) FX.aura(P, X, cy + 1, rx + 5, ry + 4, m, '#b8a0ff');
  if (m.fx.has('sparkle')) FX.sparkle(P, X, cy - 2, m, '#ffd0f0');
  if (m.fx.has('zz')) FX.zz(P, X + 11, ctop - 8, m);
  if (m.fx.has('steam')) FX.steam(P, X - 2, ctop - 8, m);
  if (m.fx.has('hearts')) FX.hearts(P, X + 14, ctop - 2, m);
  if (m.fx.has('bond')) FX.aura(P, X, cy + 1, rx + 6, ry + 5, m, '#7af0ff');
}

export const SPRITES = {
  lemmo: { id: 'lemmo', kind: 'pix', w: 80, h: 72, anchor: [40, 65], pal: LEM_PAL, draw: lemmo },
  cabbunny: { id: 'cabbunny', kind: 'pix', w: 80, h: 72, anchor: [40, 65], pal: CAB_PAL, draw: cabbunny },
  kappachi: { id: 'kappachi', kind: 'pix', w: 80, h: 72, anchor: [40, 65], pal: KAP_PAL, draw: kappachi },
  chochobake: { id: 'chochobake', kind: 'pix', w: 80, h: 72, anchor: [40, 65], pal: CHO_PAL, draw: chochobake },
};
