// Bubblion — the water starter (Hydro), a Prince homage. A haughty little black-and-white
// lionfish prince living inside a big wobbly ball of water: bold zebra stripes, a lion's mane of
// banded fin rays over a ruffled shirt-collar of frills (a jabot cascades under the chin), venom
// spines, long feathery pectoral fins, pouty black lips, heavy-lidded eyes drawn with dramatic
// eyeliner, and a tilted gold crown set with a single purple raindrop. It swims laps inside its
// ball, rides it like a bouncy castle, and snipes with water bullets.
//
// The ball's rim and highlights are a cut-out disc that turns to face the camera. The engine has
// no billboard bones, so faceCamera() does it locally: every clip streams a tiny "probe" through
// the Animator (which resolves bone frames in world space) and reads the camera from the FX stage.
// Without an FX stage the ball falls back to a fixed pair of crossed rings.
import * as THREE from '../../../vendor/three.module.js';
import { E, seg, bump, wob, wave, key, bounce, hop } from '../anim.js';
import { defineFx } from '../fx.js';
import { shade, ramp, dith, shift } from './kit.js';

const D2R = Math.PI / 180;
const R = 15, BC = [0, 15, 0];          // the water ball: radius and centre (it rests on the ground)
const FC = [0, 14.8, 0];               // the fish's centre: it swims and turns about this point
const MC = [0, 15.0, 4.6];             // centre of the mane round the face
const LIPS = [0, 12.2, 7.8];           // bubbles and water bullets leave from here

// ---------------------------------------------------------------- palette
const K = '#0b0b10';                                          // ink: pupils, liner, trim
const BLK = ['#3c3c4a', '#25252f', '#17171e', '#0f0f15'];      // black stripes, lit → shadow
const WHT = ['#ffffff', '#eef0f6', '#d2d6e0', '#a7adbd'];      // white stripes, lit → shadow
const GRY = ['#a6aab8', '#808494', '#5f6374'];                 // pinstripes, pleats, membranes
const GOLD = ['#fff3b0', '#ffd23e', '#eba52a', '#ba721c', '#784414'];
const AME = ['#ecd2ff', '#b47ef4', '#7a3ed2', '#3e1680'];      // the one purple: the raindrop jewel
const WA = { edge: '#3d8cc6', edgeLit: '#7ccbec', edgeLow: '#2b6aa6', rim: '#aee4f8', rimHi: '#e8faff', rimLow: '#78c2ea', film: '#94d8f2', deep: '#5aaede', deep2: '#3f8ecb', sheen: '#cff8f0' };

// model-space position of texel (i, j) on a face (or plane) of cube c — lets the stripes run on
// across neighbouring boxes
function tp(c, face, i, j, w, h) {
  const [ox, oy, oz] = c.o, [sx, sy, sz] = c.s, u = (i + 0.5) / w, v = (j + 0.5) / h;
  switch (face) {
    case 'south': return [ox + u * sx, oy + sy - v * sy, oz + sz];
    case 'north': return [ox + sx - u * sx, oy + sy - v * sy, oz];
    case 'east': return [ox + sx, oy + sy - v * sy, oz + sz - u * sz];
    case 'west': return [ox, oy + sy - v * sy, oz + u * sz];
    case 'up': return [ox + u * sx, oy + sy, oz + v * sz];
    case 'down': return [ox + u * sx, oy, oz + sz - v * sz];
    default: return c.plane === 'x' ? [ox, oy + sy - v * sy, oz + u * sz] : c.plane === 'y' ? [ox + u * sx, oy, oz + v * sz] : [ox + u * sx, oy + sy - v * sy, oz];
  }
}
const segD = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))); return Math.hypot(px - ax - t * dx, py - ay - t * dy); };

// ---------------------------------------------------------------- fish painters
// zebra bands: rings round the fish that bow back toward the tail at the back and the belly;
// 1 = black, 0 = white, 2 = a grey pinstripe splitting the white
function zebra(x, y, z) {
  const yy = y - FC[1], s = z + 0.085 * yy * yy, f = ((((s + 0.3) / 2.4) % 1) + 1) % 1;
  return f < 0.42 ? 1 : f > 0.64 && f < 0.78 ? 2 : 0;
}
const tone = (y) => Math.min(1, Math.max(0, (18.8 - y) / 8.4));        // lit back → darker belly
function skin(band = zebra) {
  return (p, w, h, face, c) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const [x, y, z] = tp(c, face, i, j, w, h), b = band(x, y, z), cols = b === 1 ? BLK : b === 2 ? GRY : WHT;
      let col = ramp(cols, face === 'up' ? 0 : face === 'down' ? 1 : tone(y), i, j);
      if (face !== 'up' && face !== 'down' && j === 0) col = b === 1 ? BLK[0] : '#ffffff';       // lit top edge
      if (face !== 'up' && face !== 'down' && j === h - 1) col = shift(col, -0.25);                // seam
      p.px(i, j, col);
    }
  };
}
const body = skin();
// the face: white, with a black masquerade mask across the eyes (the lionfish's eye-band, drawn like
// dramatic stage make-up) sweeping up into points at the temples; faint whiskers on the cheeks
const face = (p, w, h, f, c) => {
  body(p, w, h, f, c); if (f !== 'south') return;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const [x, y] = tp(c, f, i, j, w, h), ax = Math.abs(x), t = tone(y) * 0.7;
    const mask = ((ax - 2.0) / 1.9) ** 2 + ((y - 15.95) / 1.2) ** 2 < 1 || (ax < 0.7 && y > 15.45 && y < 16.5) || segD(ax, y, 3.1, 16.8, 3.8, 17.55) < 0.36;
    const top = mask && !(((ax - 2.0) / 1.9) ** 2 + ((y + 0.34 - 15.95) / 1.2) ** 2 < 1 || (ax < 0.7 && y + 0.34 < 16.5) || segD(ax, y + 0.34, 3.1, 16.8, 3.8, 17.55) < 0.36);
    const whisk = segD(ax, y, 2.85, 14.1, 3.85, 13.6) < 0.18 || segD(ax, y, 2.75, 13.35, 3.85, 12.6) < 0.18;
    p.px(i, j, mask ? (top ? BLK[0] : BLK[2]) : whisk ? GRY[1] : ramp(WHT, t, i, j));
  }
};
// eyes: 10 × 8 texels drawn on the black mask, the outer corner at x = 0 (the left eye is mirrored).
// Heavy lids, small dot pupils: unimpressed, never cute. Closed states are drawn in light tones
const EC = { K, W: '#ffffff', w: '#d6dae4', G: '#8c90a2' };
const EYES = {
  proud: ['..........', '..........', '..........', '..GGGGGGG.', '.WWWWWKKW.', '..WWWWKKW.', '....wwww..', '..........'],
  side: ['..........', '..........', '..........', '..GGGGGGG.', '.KKWWWWWW.', '..KKWWWWw.', '....wwww..', '..........'],
  up: ['..........', '...WWWW...', '.WWWKKWWW.', 'WWWWKKWWWW', '.WWWWWWWW.', '...wwww...', '..........', '..........'],
  wide: ['..........', '...WWWW...', '.WWWWWWWW.', 'WWWWWKWWWW', '.WWWWWWWW.', '...wwww...', '..........', '..........'],
  glare: ['..........', '..........', '..........', '.GG.......', '.WWGGG....', '..WWWKKG..', '....wKK...', '..........'],
  closed: ['..........', '..........', '..........', '..........', '.GGGGGGGG.', 'G.........', '..........', '..........'],
  smug: ['..........', '..........', '..........', 'W........W', '.WW....WW.', '...WWWW...', '..........', '..........'],
  shut: ['..........', 'WW........', '..WWW.....', '.....WWWW.', '..WWW.....', 'WW........', '..........', '..........'],
  x: ['..........', '.WW....WW.', '...W..W...', '....WW....', '....WW....', '...W..W...', '.WW....WW.', '..........'],
};
const stamp = (rows) => (p) => rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (EC[r[x]]) p.px(x, y, EC[r[x]]); });
const EYEP = Object.fromEntries(Object.entries(EYES).map(([k, rows]) => [k, stamp(rows)]));
EYEP.swirl = (p) => { stamp(['..........', '...WWWW...', '.WWWWWWWW.', 'WWWWWWWWWW', '.WWWWWWWW.', '...wwww...', '..........', '..........'])(p); for (let a = 0; a < 14; a += 0.15) { const r = a * 0.2; if (r < 2.6) p.px(Math.round(4.5 + Math.cos(a) * r * 1.3), Math.round(3 + Math.sin(a) * r * 0.6), K); } };
// a lionfish fin ray: a banded spine in a membrane whose edge ruffles like a shirt frill
const rayP = (ph = 0) => (p, w, h) => {
  const cx = (w - 1) / 2;
  for (let j = 0; j < h; j++) {
    const v = (j + 0.5) / h, hw = (w / 2) * Math.min(1, 0.1 + 1.2 * Math.sqrt(v)) * (0.8 + 0.2 * Math.abs(Math.sin(j * 0.9 + ph))), dark = Math.floor((j + ph) / 3) % 2 === 0;
    for (let i = 0; i < w; i++) {
      const dx = Math.abs(i - cx); if (dx > hw) continue;
      const edge = dx > hw - 1;
      p.px(i, j, dx < 0.6 ? (dark ? BLK[2] : '#ffffff') : dark ? (edge ? BLK[3] : BLK[1]) : edge ? WHT[2] : WHT[1]);
    }
  }
};
// ruffles (the Purple Rain shirt): pleats fanning from a gathered base to a scalloped edge with a
// black picot trim. ruffleP points up (collar petals round the face); jabotP hangs (under the chin)
const ruffleP = (p, w, h) => {
  const cx = (w - 1) / 2;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const v = (j + 0.5) / h, hw = (w / 2) * (1 - 0.42 * v), dx = i - cx; if (Math.abs(dx) > hw + 0.1) continue;
    const sc = 1.5 * Math.abs(Math.sin(((i + 0.5) * Math.PI) / 3)); if (j < sc - 0.5) continue;
    const pl = (dx / hw + 1) * 1.5, fold = pl % 1, trim = j < sc + 0.5;
    p.px(i, j, trim ? K : fold > 0.72 ? (v > 0.55 ? GRY[0] : WHT[2]) : fold < 0.25 ? '#ffffff' : WHT[1]);
  }
};
const jabotP = (p, w, h) => {
  const n = Math.max(2, Math.round(w / 6));
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = (i + 0.5) / w, sc = h - 1 - 1.8 * Math.abs(Math.sin(u * Math.PI * n)); if (j > sc + 0.5) continue;
    const fold = (u * n * 2.4) % 1, edge = j > sc - 0.6;
    p.px(i, j, edge ? GRY[2] : j === 0 ? WHT[3] : fold > 0.74 ? GRY[0] : fold < 0.3 ? '#ffffff' : WHT[1]);
  }
};
// a venom spine: a banded needle with a scrap of membrane near the base
const spineP = (p, w, h) => {
  for (let j = 0; j < h; j++) {
    const v = (j + 0.5) / h, dark = Math.floor(j / 2.5) % 2 === 1;
    p.px(1, j, j < 2 ? '#ffffff' : dark ? BLK[1] : '#ffffff'); p.px(2, j, j < 1 ? 0 : dark ? BLK[2] : WHT[2]);
    if (v > 0.45) { p.px(0, j, dark ? GRY[1] : WHT[1]); p.px(3, j, dark ? GRY[2] : WHT[3]); }
  }
};
// pectoral fan: banded rays radiating from the root through a pale membrane that ruffles at its
// edge; free ray tips reach past the scalloped edge (feathery)
function pectoralP(root, side) {
  return (p, w, h, f, c) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const [x, y] = tp(c, f, i, j, w, h), dx = (x - root[0]) * side, dy = y - root[1]; if (dx <= 0) continue;
      const r = Math.hypot(dx, dy), a = Math.atan2(dy, dx) / D2R; if (a < -42 || a > 36) continue;
      const kf = (a + 42) / 13, k = Math.round(kf), perp = Math.abs(kf - k) * 13 * D2R * r;
      const len = 6.8 + 1.2 * Math.sin((k / 6) * Math.PI), memb = len - 1.0 - 1.2 * Math.abs(Math.sin(kf * Math.PI)), onRay = perp < 0.3;
      if (r > len || (!onRay && r > memb)) continue;
      const band = Math.floor(r / 1.3) % 2 === 0;
      let col = onRay ? (band ? BLK[1] : '#ffffff') : band ? WHT[2] : WHT[1];
      if (!onRay && r > memb - 0.45) col = band ? GRY[1] : WHT[3];
      if (onRay && r > len - 0.6) col = '#ffffff';
      p.px(i, j, col);
    }
  };
}
// small soft fins and the tail fan: rays from the root, white membrane, rows of black spots
function fanP(root, spread, len, o = {}) {        // root: [z, y]; opens toward −z, or up / down
  return (p, w, h, f, c) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const [, y, z] = tp(c, f, i, j, w, h), du = o.up ? y - root[1] : o.down ? root[1] - y : root[0] - z, dv = o.up || o.down ? z - root[0] : y - root[1];
      if (du < -0.15) continue;
      const r = Math.hypot(du, dv), a = Math.atan2(dv, du) / D2R, edge = len * (1 - 0.18 * (a / spread) ** 2);
      if (Math.abs(a) > spread || r > edge) continue;
      const step = spread / (o.rays || 4), kf = (a + spread) / step, perp = Math.abs(kf - Math.round(kf)) * step * D2R * r, onRay = perp < 0.22;
      let col = WHT[1];
      if (r < (o.base ?? 0.9)) col = BLK[1];
      else if (onRay) col = Math.floor(r / 0.9) % 2 ? K : GRY[1];
      else if (r > edge - 0.4) col = WHT[2];
      p.px(i, j, col);
    }
  };
}
// the crown: a studded gold band, hollow and dark inside; cut-out points; a purple raindrop
const crownBand = (p, w, h, f) => {
  if (f === 'up') { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, i === 0 || j === 0 || i === w - 1 || j === h - 1 ? GOLD[1] : (i + j) % 2 ? '#3a2408' : '#4a3010'); return; }
  if (f === 'down') { p.rect(0, 0, w, h, GOLD[4]); return; }
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, ramp(GOLD.slice(0, 4), j / Math.max(1, h - 1), i, j));
  for (let i = 1; i < w - 1; i += 3) { p.px(i, 1, '#fffbe0'); p.px(i, 2, GOLD[3]); }
};
const crownPts = (n) => (p, w, h) => {
  const pw = w / n;
  for (let k = 0; k < n; k++) {
    const xm = k * pw + pw / 2;
    for (let j = 0; j < h; j++) {
      const v = (j + 0.5) / h, half = (pw / 2) * Math.min(1, v * 1.1), a = Math.round(xm - half), b = Math.round(xm + half) - 1;
      for (let i = a; i <= b; i++) p.px(i, j, i === b ? GOLD[3] : i === a ? GOLD[0] : ramp([GOLD[0], GOLD[1], GOLD[2]], v, i, j));
    }
    const px = Math.floor(xm - 0.5); p.px(px, 0, '#ffffff'); p.px(px + 1, 0, '#d8d8ec'); p.px(px, 1, '#e6e6f4'); p.px(px + 1, 1, '#a8a8c4');    // a pearl on the tip
  }
};
const raindrop = (p, w, h) => {
  const cx = (w - 1) / 2;
  for (let j = 0; j < h; j++) {
    const v = (j + 0.5) / h, half = v < 0.45 ? (v / 0.45) * w * 0.34 : Math.sqrt(Math.max(0, 1 - ((v - 0.64) / 0.36) ** 2)) * (w / 2);
    for (let i = 0; i < w; i++) { const dx = i - cx; if (Math.abs(dx) > half + 0.2) continue; const edge = Math.abs(dx) > half - 0.8 || j === h - 1; p.px(i, j, edge ? (dx > 0 || v > 0.75 ? AME[3] : AME[2]) : dx < 0 && v < 0.8 ? AME[0] : AME[1]); }
  }
  p.px(Math.floor(cx), Math.round(h * 0.5), '#ffffff');
};
const lipP = shade('#3a3a48', { top: '#5c5e6e', bottom: '#1c1c24', grain: 0 });
const upperLip = (p, w, h, f) => { lipP(p, w, h, f); if (f === 'south') { p.px(Math.floor(w / 2) - 1, 0, '#1c1c24'); p.px(Math.floor(w / 2), 0, '#1c1c24'); } };
const lowerLip = (p, w, h, f) => { lipP(p, w, h, f); if (f === 'south') { p.hl(1, 3, 0, '#8a8ea0'); p.px(1, 0, '#ffffff'); p.px(2, 0, '#ffffff'); } if (f === 'up') { p.hl(1, w - 2, h - 1, '#7a7e8e'); p.px(1, h - 1, '#ffffff'); } };
// thin arched brows (the outer end at x = 0): a sculpted, faintly sardonic arch
const browP = (p) => { for (const [x, y] of [[0, 2], [1, 1], [2, 1], [3, 0], [4, 0], [5, 0], [6, 0], [7, 1]]) { p.px(x, y, K); p.px(x, y + 1, x > 1 && x < 7 ? BLK[1] : K); } };
const tentacle = (p, w, h) => { for (let j = 0; j < h; j++) { const dark = (j >> 1) % 2 === 0; p.px(1, j, dark ? BLK[1] : '#ffffff'); if (j > 1 && j % 2 === 0) p.px(j % 4 === 0 ? 0 : 2, j, dark ? GRY[1] : WHT[2]); } };

// ---------------------------------------------------------------- water painters
// the ball seen face-on: a crisp cyan edge, a bright Fresnel rim (widest on the lit upper left),
// a thin film line inside, and water pooling in a deeper crescent along the bottom
const disc = (p, w, h) => {
  const c = (w - 1) / 2, Rt = w / 2;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const dx = i - c, dy = c - j, e = Rt - Math.hypot(dx, dy); if (e <= 0) continue;
    const a = Math.atan2(dy, dx), lit = Math.cos(a - 2.3), low = Math.max(0, -dy / Rt), rimW = 1.3 + 1.2 * Math.max(0, lit) + 0.8 * low * low;
    let col = 0;
    if (e < 1) col = lit > 0.35 ? WA.edgeLit : low > 0.6 ? WA.edgeLow : WA.edge;
    else if (e < 1 + rimW) col = lit > 0.6 ? WA.rimHi : low > 0.55 ? WA.rimLow : WA.rim;
    else if (e < 2.4 + rimW && e > 1.4 + rimW && lit > -0.2) col = WA.film;                       // thin inner film line
    else if (low > 0.32) {                                                                        // pooled water
      const band = 4.5 * ((low - 0.32) / 0.68) ** 0.8, f = e - 1 - rimW;
      if (f < band) col = f < band * 0.5 ? WA.deep2 : f < band - 0.9 ? WA.deep : dith(0, WA.film, 0.5, i, j);
    }
    if (col) p.px(i, j, col);
  }
  for (let a = 3.55; a < 4.2; a += 0.01) { const r = Rt - 3.1; p.px(Math.round(c + Math.cos(a) * r), Math.round(c - Math.sin(a) * r), WA.sheen); }
};
// highlights on the near surface: a big window-arc upper left, a pane beside it, sparkle dots,
// and a thin reflected arc lower right
const gloss = (p, w, h) => {
  const c = (w - 1) / 2, Rt = w / 2;
  const arc = (a0, a1, r, th, col) => { for (let a = a0; a <= a1; a += 0.004) { const m = Math.sin(((a - a0) / (a1 - a0)) * Math.PI), t = th * (0.3 + 0.7 * m); for (let k = 0; k < t; k += 0.5) p.px(Math.round(c + Math.cos(a) * (r - k)), Math.round(c - Math.sin(a) * (r - k)), col); } };
  arc(1.92, 2.92, Rt - 4.3, 3.2, '#ffffff');
  arc(2.18, 2.56, Rt - 8.8, 1.7, '#ffffff');
  const dot = (a, r, s) => p.rect(Math.round(c + Math.cos(a) * r), Math.round(c - Math.sin(a) * r), s, s, '#ffffff');
  dot(3.1, Rt - 5.3, 2); dot(3.28, Rt - 5.9, 1); dot(1.68, Rt - 5.1, 1);
  arc(-0.95, -0.4, Rt - 3.4, 1.5, '#dcf6ff');
};
// the fallback ring (no camera available): a thinner rim seen from the side
const ringX = (p, w, h) => {
  const c = (w - 1) / 2, Rt = w / 2;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const e = Rt - Math.hypot(i - c, j - c); if (e > 0 && e < 2.4) p.px(i, j, e < 1 ? WA.edge : WA.rim); }
};
const innerBub = (p) => { p.px(1, 0, '#ffffff'); p.px(2, 0, WA.rim); p.px(0, 1, '#ffffff'); p.px(0, 2, WA.rim); p.px(3, 1, WA.film); p.px(3, 2, WA.deep); p.px(1, 3, WA.film); p.px(2, 3, WA.deep); p.px(1, 1, '#ffffff'); };
// the burst: the rim tears into dashes (a), then a crown of droplets flies out (b)
const popP = (f) => (p, w, h) => {
  const c = (w - 1) / 2, R0 = 45;
  if (f === 0) {
    for (let a = 0; a < Math.PI * 2; a += 0.004) {
      if (Math.floor((a / (Math.PI * 2)) * 18) % 2) continue;
      for (let k = 0; k < 2.6; k += 0.5) { const r = R0 + 1 + k + 2.2 * Math.sin(a * 5); p.px(Math.round(c + Math.cos(a) * r), Math.round(c - Math.sin(a) * r), k < 1 ? '#ffffff' : WA.rim); }
    }
  } else {
    for (let n = 0; n < 24; n++) {
      const a = (n / 24) * Math.PI * 2 + 0.11 * Math.sin(n * 7), r0 = R0 + 3 + ((n * 37) % 7);
      for (let k = 0; k < 4; k++) { const r = r0 + k; p.px(Math.round(c + Math.cos(a) * r), Math.round(c - Math.sin(a) * r), k === 3 ? '#ffffff' : k > 0 ? WA.rim : WA.film); }
      const rr = r0 + 6; p.rect(Math.round(c + Math.cos(a) * rr), Math.round(c - Math.sin(a) * rr), 2, 2, n % 3 ? WA.film : '#ffffff');
    }
  }
};
const puddleP = (p, w, h) => {
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const dx = (i - cx) / (w / 2), dy = (j - cy) / (h / 2), a = Math.atan2(dy, dx), r = Math.hypot(dx, dy), edge = 0.86 + 0.08 * Math.sin(a * 3 + 1) + 0.05 * Math.sin(a * 7);
    if (r > edge) continue;
    let col = r > edge - 0.08 ? '#4b95c9' : r > edge - 0.22 ? '#7cc4e8' : '#9cd8f2';
    if (segD(i, j, w * 0.26, h * 0.32, w * 0.42, h * 0.22) < 0.8 || segD(i, j, w * 0.48, h * 0.2, w * 0.54, h * 0.19) < 0.7) col = '#ffffff';
    p.px(i, j, col);
  }
};
const contactP = (p, w, h) => {      // the ball's soft contact shadow: a solid core with a dithered rim
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const r = Math.hypot((i - cx) / (w / 2), (j - cy) / (h / 2)); if (r < 0.55 || (r < 0.95 && dith(0, 1, 1 - (r - 0.55) / 0.4, i, j))) p.px(i, j, '#34404e'); }
};

// ---------------------------------------------------------------- particles
const bubSpr = (p, w, h) => {
  const c = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - c, y - c); if (d > c + 0.3) continue; if (d > c - 1) p.px(x, y, x + y < w - 2 ? '#e8fbff' : '#6ab8e2'); else if ((x + y) % 5 === 0 && d > c - 2) p.px(x, y, '#bfeefc'); }
  p.px(2, 2, '#ffffff'); p.px(3, 2, '#ffffff'); p.px(2, 3, '#ffffff'); p.px(2, 1, '#ffffff'); p.px(1, 2, '#ffffff');
};
defineFx('bblion-bub', { w: 9, h: 9, paint: bubSpr, life: [1.0, 1.6], size: [0.035, 0.075], speed: [0.2, 0.45], grav: -0.9, drag: 1.3, spread: 0.35, wob: 1.6 });
const shotSpr = (f) => (p, w, h) => {
  const c = (w - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - c, y - c); if (d > c + 0.2) continue; p.px(x, y, d > c - 1 ? '#2a72b4' : (x - c) + (y - c) < -3 ? '#c8f2ff' : '#5ac0ee'); }
  for (let t = 0; t < 9; t += 0.25) { const a = t + f * 0.8, r = t * 0.55; if (r < c - 1) p.px(Math.round(c + Math.cos(a) * r), Math.round(c + Math.sin(a) * r), '#ffffff'); }
  p.px(3, 3, '#ffffff'); p.px(4, 3, '#ffffff'); p.px(3, 4, '#ffffff');
};
defineFx('bblion-shot', { w: 13, h: 13, frames: [0, 1, 2, 3].map(shotSpr), fps: 16, life: [0.6, 0.6], size: [0.2, 0.14], speed: [6.5, 6.5], grav: 0.2, drag: 0.05, spread: 0.0 });
const jetSpr = (p) => { p.rect(1, 1, 3, 3, '#7ad2f6'); p.px(2, 0, '#c8f2ff'); p.px(0, 2, '#c8f2ff'); p.px(1, 1, '#ffffff'); p.px(4, 2, '#3a8ac4'); p.px(2, 4, '#3a8ac4'); p.px(3, 3, '#4aa2d8'); };
defineFx('bblion-jet', { w: 5, h: 5, paint: jetSpr, life: [0.2, 0.34], size: [0.07, 0.03], speed: [4.2, 6.2], grav: 2.5, drag: 0.8, spread: 0.08 });
defineFx('bblion-ring', { w: 32, h: 32, paint: (p, w) => { const m = (w - 1) / 2; for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x - m, y - m); if (d < m + 0.2 && d > m - 2.4) p.px(x, y, d > m - 1 ? '#bdeeff' : '#ffffff'); } }, life: [0.32, 0.32], size: [0.12, 1.0], speed: [0, 0], grav: 0, fade: true });
const glintSpr = (p, w) => { const c = (w - 1) / 2; for (let i = 0; i < w; i++) { const d = Math.abs(i - c) / c, col = d < 0.3 ? '#ffffff' : '#bff0ff'; if (d < 0.99) { p.px(i, c, col); p.px(c, i, col); } } p.px(c - 1, c - 1, '#e8fbff'); p.px(c + 1, c + 1, '#e8fbff'); p.px(c + 1, c - 1, '#e8fbff'); p.px(c - 1, c + 1, '#e8fbff'); };
defineFx('bblion-glint', { w: 9, h: 9, paint: glintSpr, glow: true, life: [0.4, 0.7], size: [0.11, 0.02], speed: [0.1, 0.5], grav: 0, drag: 1.2, spread: 1, fade: true, spin: 1.5 });
const rainSpr = (p, w, h) => { const cx = (w - 1) / 2; for (let y = 0; y < h; y++) { const v = y / (h - 1), half = v < 0.45 ? (v / 0.45) * 1.2 : Math.sqrt(Math.max(0, 1 - ((v - 0.66) / 0.34) ** 2)) * (w / 2); for (let x = 0; x < w; x++) { const d = Math.abs(x - cx); if (d > half) continue; p.px(x, y, d > half - 1 || v > 0.92 ? '#5a26b0' : x < cx && v > 0.45 && v < 0.75 ? '#f0dcff' : '#a66cf0'); } } };
defineFx('bblion-rain', { w: 5, h: 8, paint: rainSpr, life: [0.55, 0.85], size: [0.07, 0.06], speed: [0.6, 1.2], grav: 7, drag: 0.3, spread: 0.12 });

// ---------------------------------------------------------------- the model
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler();
// a ray's rotation: twist about its own length, sweep back, then roll round the face (degrees → Euler XYZ)
function rayRot(roll, sweep, twist) {
  _q1.setFromEuler(_e.set(0, 0, roll * D2R)); _q2.setFromEuler(_e.set(-sweep * D2R, 0, 0)); _q1.multiply(_q2);
  _q2.setFromEuler(_e.set(0, twist * D2R, 0)); _q1.multiply(_q2); _e.setFromQuaternion(_q1, 'XYZ');
  return [_e.x / D2R, _e.y / D2R, _e.z / D2R];
}
const sectorOf = (phi) => { const a = ((phi % 360) + 360) % 360; return a >= 50 && a <= 130 ? 'maneT' : a > 130 && a < 250 ? 'maneR' : a >= 290 || a < 50 ? 'maneL' : 'jab'; };
const MANE = { maneT: [], maneL: [], maneR: [], jab: [] };
// outer ring: long banded lionfish rays round the face (shorter low down; the jabot hangs beneath)
for (let k = 0; k < 14; k++) {
  const phi = -60 + k * (300 / 13), s = Math.sin(phi * D2R), cs = Math.cos(phi * D2R);
  const L = Math.round((7.2 + 0.6 * Math.abs(cs) - 1.6 * Math.max(0, -s)) * 3) / 3, r0 = 3.3, B = [MC[0] + r0 * cs, MC[1] + r0 * s, MC[2] - 1.2];
  MANE[sectorOf(phi)].push(P([B[0] - 1.5, B[1], B[2]], [3, L, 0], rayP(k * 2), { plane: 'z', pivot: B, rot: rayRot(phi - 90, 28 + 8 * Math.max(0, -s), k % 2 ? 16 : -16) }));
}
// inner ring: the ruffled collar, pleated petals framing the face
for (let k = 0; k < 12; k++) {
  const phi = -48 + k * (276 / 11), s = Math.sin(phi * D2R), cs = Math.cos(phi * D2R), r0 = 3.4, B = [MC[0] + r0 * cs, MC[1] + r0 * s, MC[2] - 0.2];
  MANE[sectorOf(phi)].push(P([B[0] - 4 / 3, B[1], B[2]], [8 / 3, 3, 0], ruffleP, { plane: 'z', pivot: B, rot: rayRot(phi - 90, 16, k % 2 ? 8 : -8) }));
}
// the jabot: two tiers of ruffles cascading from under the chin
MANE.jab.push(
  P([-2.8, 8.8, 5.0], [5.6, 2, 0], jabotP, { plane: 'z', pivot: [0, 10.8, 5.0], rot: [-18, 0, 0] }),
  P([-2.2, 7.4, 5.2], [4.4, 2, 0], jabotP, { plane: 'z', pivot: [0, 9.4, 5.2], rot: [-24, 0, 0] }),
  P([-1.5, 6.1, 5.4], [3.0, 2, 0], jabotP, { plane: 'z', pivot: [0, 8.1, 5.4], rot: [-30, 0, 0] }),
  P([-0.5, 10.1, 5.0], [1, 1, 2 / 3], (p, w, h, f) => { p.rect(0, 0, w, h, '#e6e6f4'); if (f === 'south') { p.px(0, 0, '#ffffff'); p.px(w - 1, h - 1, '#9a9ab8'); } }),
);
// venom spines along the back: crossed planes so they read from every side
const SPINES = [[1.2, 6.2, -4], [0.4, 7.0, -12], [-0.4, 7.2, -20], [-1.2, 6.6, -28], [-2.0, 5.8, -36], [-2.8, 4.8, -44], [-3.5, 3.8, -52]];
const spineCubes = SPINES.flatMap(([z, L, lean]) => {
  const y = z > -1.6 ? 18.5 : 17.5, pv = [0, y, z];
  return [P([-2 / 3, y, z], [4 / 3, L, 0], spineP, { plane: 'z', pivot: pv, rot: [lean, 0, 0] }), P([0, y, z - 2 / 3], [0, L, 4 / 3], spineP, { plane: 'x', pivot: pv, rot: [lean, 0, 0] })];
});
const eyeParts = (side) => Object.keys(EYEP).map((k) => P(side < 0 ? [-3.67, 14.6, 6.46] : [1 / 3, 14.6, 6.46], [10 / 3, 8 / 3, 0], EYEP[k], { plane: 'z', mirror: side > 0, id: (side < 0 ? 'eR-' : 'eL-') + k, hide: k !== 'proud' }));
const ROOT_R = [-3.1, 13.6], ROOT_L = [3.1, 13.6];

export const def = {
  name: 'bubblion', ppu: 3, scale: 0.4, outline: { color: '#0b0b10', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'shadow', parent: 'root', pivot: [0, 0, 0], cubes: [P([-6, 0.04, -4.2], [12, 0, 8.4], contactP, { plane: 'y', shadow: false, id: 'contact' })] },
    { name: 'puddle', parent: 'root', pivot: [0, 0, 0], cubes: [P([-9, 0.07, -5], [18, 0, 12], puddleP, { plane: 'y', shadow: false, id: 'puddle', hide: true })] },
    { name: 'float', parent: 'root', pivot: BC, cubes: [] },
    { name: 'ball', parent: 'float', pivot: BC, cubes: [] },
    { name: 'bbY', parent: 'ball', pivot: BC, cubes: [] },
    { name: 'bbX', parent: 'bbY', pivot: BC, cubes: [
      P([-R, 0, 0], [2 * R, 2 * R, 0], disc, { plane: 'z', glow: true, id: 'disc' }),
      P([-R, 0, 0.25], [2 * R, 2 * R, 0], gloss, { plane: 'z', glow: true, id: 'gloss' }),
      ...[0, 1].map((f) => P([-18, -3, 0.15], [36, 36, 0], popP(f), { plane: 'z', glow: true, id: 'pop-' + 'ab'[f], hide: true })),
    ] },
    { name: 'cage', parent: 'ball', pivot: BC, cubes: [P([0, 0, -R], [0, 2 * R, 2 * R], ringX, { plane: 'x', glow: true, id: 'cage' })] },
    ...['b1', 'b2', 'b3'].map((b) => ({ name: b, parent: 'ball', pivot: BC, cubes: [P([-2 / 3, BC[1] - 2 / 3, -2 / 3], [4 / 3, 4 / 3, 4 / 3], innerBub, { outline: false, shadow: false, id: 'inner' })] })),
    { name: 'swim', parent: 'float', pivot: FC, cubes: [] },
    { name: 'fish', parent: 'swim', pivot: FC, cubes: [
      P([-3.1, 11.6, -1.8], [6.2, 6.6, 3.6], body),
      P([-2.8, 11.2, -1.4], [5.6, 0.4, 2.8], body),
      P([-2.6, 18.2, -1.4], [5.2, 0.4, 2.8], body),
    ] },
    { name: 'head', parent: 'fish', pivot: [0, 14.8, 1.6], cubes: [
      P([-3.7, 11.4, 1.4], [7.4, 6.8, 5.0], body, { faces: { south: face } }),
      P([-4.0, 11.8, 1.8], [8.0, 4.2, 4.2], body),
      P([-3.2, 18.2, 1.8], [6.4, 0.6, 4.2], body),
      P([-2.9, 10.9, 2.0], [5.8, 0.5, 4.0], body),
      P([-1.1, 12.6, 6.3], [2.2, 0.6, 0.9], upperLip),
      P([-1.0, 12.0, 6.35], [2.0, 0.9, 0.8], '#120c14', { outline: false }),
      ...eyeParts(-1), ...eyeParts(1),
    ] },
    { name: 'jaw', parent: 'head', pivot: [0, 12.6, 6.6], cubes: [P([-1.35, 11.6, 6.2], [2.7, 1, 1.4], lowerLip)] },
    { name: 'gum', parent: 'jaw', pivot: [0, 12.1, 7.7], cubes: [P([-1.5, 10.6, 9.2], [3, 3, 0], bubSpr, { plane: 'z', id: 'gum', hide: true })] },
    { name: 'browR', parent: 'head', pivot: [-2.0, 17.95, 6.5], rot: [0, 0, 3], cubes: [
      P([-3.33, 17.5, 6.48], [8 / 3, 1, 0], browP, { plane: 'z' }),
      P([-3.9, 17.95, 6.5], [1, 8 / 3, 0], tentacle, { plane: 'z', pivot: [-3.4, 18.0, 6.55], rot: [-24, 0, 26] }),
    ] },
    { name: 'browL', parent: 'head', pivot: [2.0, 18.3, 6.5], rot: [0, 0, -7], cubes: [
      P([0.67, 17.85, 6.48], [8 / 3, 1, 0], browP, { plane: 'z', mirror: true }),
      P([2.9, 18.3, 6.5], [1, 8 / 3, 0], tentacle, { plane: 'z', pivot: [3.4, 18.35, 6.55], rot: [-24, 0, -26] }),
    ] },
    { name: 'crown', parent: 'head', pivot: [0.8, 18.7, 4.0], rot: [6, 0, -14], cubes: [
      P([-0.95, 18.6, 2.5], [3.5, 1.2, 3.0], crownBand),
      P([-0.95, 19.8, 5.5], [3.5, 2, 0], crownPts(3), { plane: 'z' }),
      P([-0.95, 19.8, 2.5], [3.5, 2, 0], crownPts(3), { plane: 'z' }),
      P([-0.95, 19.8, 2.5], [0, 2, 3.0], crownPts(2), { plane: 'x' }),
      P([2.55, 19.8, 2.5], [0, 2, 3.0], crownPts(2), { plane: 'x' }),
      P([0.8 - 5 / 6, 18.75, 5.58], [5 / 3, 2, 0], raindrop, { plane: 'z' }),
    ] },
    { name: 'maneT', parent: 'head', pivot: MC, cubes: MANE.maneT },
    { name: 'maneL', parent: 'head', pivot: MC, cubes: MANE.maneL },
    { name: 'maneR', parent: 'head', pivot: MC, cubes: MANE.maneR },
    { name: 'jab', parent: 'head', pivot: [0, 11.1, 5.0], cubes: MANE.jab },
    { name: 'spines', parent: 'fish', pivot: [0, 18.4, -1.0], cubes: spineCubes },
    { name: 'finR1', parent: 'fish', pivot: [-3.1, 13.6, 0.6], rot: [-18, -24, 34], cubes: [P([-6.9, 10.8, 0.6], [3.8, 5.2, 0], pectoralP(ROOT_R, -1), { plane: 'z' })] },
    { name: 'finR2', parent: 'finR1', pivot: [-6.9, 13.6, 0.6], cubes: [P([-11.5, 8.1, 0.6], [4.6, 10.2, 0], pectoralP(ROOT_R, -1), { plane: 'z' })] },
    { name: 'finL1', parent: 'fish', pivot: [3.1, 13.6, 0.6], rot: [-18, 24, -34], cubes: [P([3.1, 10.8, 0.6], [3.8, 5.2, 0], pectoralP(ROOT_L, 1), { plane: 'z' })] },
    { name: 'finL2', parent: 'finL1', pivot: [6.9, 13.6, 0.6], cubes: [P([6.9, 8.1, 0.6], [4.6, 10.2, 0], pectoralP(ROOT_L, 1), { plane: 'z' })] },
    { name: 'tail1', parent: 'fish', pivot: [0, 14.8, -1.6], cubes: [
      P([-2.4, 12.2, -4.0], [4.8, 5.4, 2.4], body),
      P([-1.4, 13.3, -5.8], [2.8, 3.0, 1.9], body),
      P([0, 16.8, -5.6], [0, 3, 3.4], fanP([-3.9, 16.8], 70, 3.0, { up: true, rays: 3, base: 0.5 }), { plane: 'x' }),
      P([0, 9.8, -5.4], [0, 3, 3.0], fanP([-3.9, 12.8], 70, 2.8, { down: true, rays: 3, base: 0.5 }), { plane: 'x' }),
    ] },
    { name: 'tail2', parent: 'tail1', pivot: [0, 14.8, -5.6], cubes: [P([0, 10.9, -10.4], [0, 7.8, 4.9], fanP([-5.5, 14.8], 44, 4.9, { rays: 4 }), { plane: 'x' })] },
  ],
};

// ---------------------------------------------------------------- the camera-facing ball
const PROBE = 'bblion:probe';
const FRAMES = new WeakMap();           // per animator (its pose's bone list) → the ball's world frame at the last update
function hookFx(fx) {
  if (fx.__bblion || typeof fx.emit !== 'function') return;
  const emit = fx.emit;
  fx.emit = function (kind, pos, o) { if (kind === PROBE) { if (o && o.probe) o.probe(pos, o.dir); return; } return emit.call(this, kind, pos, o); };
  fx.__bblion = true;
}
function eyeOf(stage) {
  const v = stage && stage.view;
  if (v && v.target && Number.isFinite(v.dist)) { const y = v.yaw * D2R, p = v.pitch * D2R; return [v.target.x + Math.sin(y) * Math.cos(p) * v.dist, v.target.y + Math.sin(p) * v.dist, v.target.z + Math.cos(y) * Math.cos(p) * v.dist]; }
  const c = stage && stage.cam; return c ? [c.position.x, c.position.y, c.position.z] : null;
}
// turn the rim disc (bones bbY → bbX) toward the camera, and drop the fallback ring when that works
function faceCamera(P, c) {
  const fx = c.fx; if (!fx) return;
  hookFx(fx);
  let st = FRAMES.get(P.names); if (!st) FRAMES.set(P.names, (st = {}));
  P.stream(PROBE, 'ball', BC, { dir: [0, 0, 1], probe: (pos, d) => { st.pos = pos; st.fz = d; } });
  P.stream(PROBE, 'ball', BC, { dir: [0, 1, 0], probe: (pos, d) => { st.fy = d; } });
  const eye = eyeOf(fx.stage); if (!eye || !st.fz || !st.fy) return;
  const dx = eye[0] - st.pos.x, dy = eye[1] - st.pos.y, dz = eye[2] - st.pos.z, L = Math.hypot(dx, dy, dz) || 1, fy = st.fy, fz = st.fz;
  const xx = fy.y * fz.z - fy.z * fz.y, xy = fy.z * fz.x - fy.x * fz.z, xz = fy.x * fz.y - fy.y * fz.x;
  const lx = (dx * xx + dy * xy + dz * xz) / L, ly = (dx * fy.x + dy * fy.y + dz * fy.z) / L, lz = (dx * fz.x + dy * fz.y + dz * fz.z) / L;
  P.rot('bbY', 0, Math.atan2(lx, lz) / D2R, 0).rot('bbX', -Math.asin(Math.max(-1, Math.min(1, ly))) / D2R, 0, 0);
  P.scl('cage', 0.001);
}

// ---------------------------------------------------------------- animation helpers
// squash (a < 0) / stretch (a > 0) the ball about its centre, keeping its bottom on the ground;
// returns how far the centre dropped (units) so the fish can sink with it
function squash(P, a) { const k = Math.max(0.3, 1 + a); P.sq('ball', a).pos('ball', 0, -R * (1 - k), 0); return R * (1 - k); }
// scale the whole ball about its centre (swell, burst, re-form)
const swell = (P, s) => P.scl('ball', s, s, s);
// little bubbles rising inside the ball, popping at the top (they stay inside the sphere)
const INNER = [['b1', -6.0, 2.6, 3.4, 0.0], ['b2', 5.4, -2.8, 2.7, 0.4], ['b3', 1.8, 6.4, 4.1, 0.7]];
function innerBubbles(P, T, on = 1) {
  for (const [b, x, z, per, ph] of INNER) {
    const u = ((((T / per + ph) % 1) + 1) % 1), y = -10.5 + u * 20, lim = Math.sqrt(Math.max(0, (R - 2.2) ** 2 - y * y));
    let wx = x + Math.sin(u * 8 + ph * 6) * 1.1, wz = z + Math.cos(u * 6 + ph * 5) * 0.9;
    const rr = Math.hypot(wx, wz); if (rr > lim && rr > 0) { wx *= lim / rr; wz *= lim / rr; }
    P.pos(b, wx, y, wz).scl(b, on * (u < 0.1 ? u / 0.1 : u > 0.95 ? 0 : 1) + 0.001);
  }
}
// always-on life: the fins ripple, the tail and spines sway, the mane breathes.
// k: energy; swim: 0 hovering → 1 swimming (fins fold back, the tail beats harder)
function alive(P, T, k = 1, swim = 0) {
  const hz = 0.9 + 1.1 * swim;
  for (const [s, sg, ph] of [['R', 1, 0], ['L', -1, 1.2]]) {
    P.rot('fin' + s + '1', wave(T, hz, ph) * 6 * k, sg * (wave(T, hz * 0.5, ph) * 5 * k - 34 * swim), sg * wave(T, hz, ph + 0.5) * 8 * k);
    P.rot('fin' + s + '2', wave(T, hz, ph - 1.2) * 10 * k, sg * wave(T, hz, ph - 1.4) * 8 * k, sg * wave(T, hz, ph - 1.1) * 18 * k);
  }
  const tb = 1.2 + 2 * swim;
  P.rot('tail1', 0, wave(T, tb) * (4 + 8 * swim) * k, 0).rot('tail2', 0, wave(T, tb, -1.1) * (8 + 14 * swim) * k, 0);
  P.rot('spines', wave(T, 0.6) * 2.5 * k, 0, 0).rot('jab', wave(T, 0.8, 1) * 3 * k, 0, 0);
  for (const [m, a] of [['maneT', 0], ['maneL', 1.4], ['maneR', 2.6]]) P.scl(m, 1 + wave(T, 0.55, a) * 0.025 * k);
}
// every clip starts here
function base(P, c, o = {}) {
  faceCamera(P, c);
  alive(P, c.time, o.k ?? 1, o.swim ?? 0);
  innerBubbles(P, c.time, o.bubbles ?? 1);
}
// the idle lap: hover at the front, swim a loop round the inside of the ball, glide back to the front
const LAP = [[0, [0, 0, 2.2, 0]], [1.3, [0.2, 0.3, 2.4, 0]], [1.75, [2.0, 0.6, 2.0, 70]], [2.25, [3.6, 1.0, -0.4, 155]], [2.75, [1.0, 1.2, -2.8, 240]],
  [3.25, [-2.8, 0.7, -1.4, 318]], [3.75, [-2.8, -0.2, 1.6, 382]], [4.25, [-0.5, -0.3, 2.6, 368]], [4.8, [0, 0, 2.2, 360]]];
function lap(t) {
  const [x, y, z, hd] = key(LAP, t), a = key(LAP, Math.min(4.8, t + 0.06)), b = key(LAP, Math.max(0, t - 0.06));
  const turn = (a[3] - b[3]) / 0.12, climb = (a[1] - b[1]) / 0.12, swim = seg(t, 1.25, 1.7) * (1 - seg(t, 3.9, 4.45));
  return { x, y, z, hd, swim, bank: Math.max(-26, Math.min(26, -turn * 0.11)), pitch: Math.max(-16, Math.min(16, -climb * 9)) };
}
const MANES = ['maneT', 'maneL', 'maneR'];
// puff the mane (s: scale) and flare it forward (deg)
const mane = (P, s, fl = 0) => { for (const m of MANES) P.scl(m, s); P.rot('maneT', fl, 0, 0).rot('maneL', 0, -fl, 0).rot('maneR', 0, fl, 0); };
const fins = (P, up, fwd = 0) => P.rot('finR1', 0, fwd, -up).rot('finL1', 0, -fwd, up);     // raise (deg) / sweep forward
// knocked out: lying on its side in a puddle, fins limp, mane flattened, crown askew
function koPose(P, k = 1) {
  P.pos('swim', 0, -10.5 * k, 1.2 * k).rot('swim', 0, 14 * k, 0).rot('fish', 4 * k, 0, -84 * k);
  P.scl('maneL', 1 - 0.45 * k).rot('maneL', 0, -40 * k, 0).scl('jab', 1 - 0.3 * k);
  P.rot('finL1', 30 * k, 50 * k, -40 * k).rot('finR1', 0, -10 * k, 30 * k).rot('finR2', 0, 0, 25 * k);
  P.rot('crown', 0, 0, -40 * k).pos('crown', 2.6 * k, -1.6 * k, 0.4 * k);
  P.rot('jaw', 12 * k).rot('spines', -20 * k, 0, 0).scl('spines', 1 - 0.2 * k);
}
const RAIN = [[-9, 0], [-4.5, -3], [0, 2], [4.5, -2], [9, 1], [-6, 4], [6, 4]];

export const anim = {
  start: 'idle', seed: 5,
  breathe: { bone: 'fish', amp: 0.018, per: 2.6 },
  blink: { slot: 'eyes', closed: 'closed', every: [2.4, 5.2], dur: 0.12 },
  look: { bone: 'head', yaw: 24, pitch: 12, speed: 5 },
  springs: [
    { bone: 'maneT', tip: [0, 7, -3], k: 140, d: 9, gain: 0.7, max: 14 },
    { bone: 'maneL', tip: [7, 0, -3], k: 140, d: 9, gain: 0.7, max: 14 },
    { bone: 'maneR', tip: [-7, 0, -3], k: 140, d: 9, gain: 0.7, max: 14 },
    { bone: 'jab', tip: [0, -4, 1], k: 120, d: 8, gain: 0.8, max: 16 },
    { bone: 'spines', tip: [0, 6, -2], k: 150, d: 9, gain: 0.7, max: 16 },
    { bone: 'finR1', tip: [-4, -1, -2], k: 110, d: 8, gain: 0.45, max: 16 },
    { bone: 'finR2', tip: [-4, -1, -1], k: 90, d: 7, gain: 0.8, max: 22 },
    { bone: 'finL1', tip: [4, -1, -2], k: 110, d: 8, gain: 0.45, max: 16 },
    { bone: 'finL2', tip: [4, -1, -1], k: 90, d: 7, gain: 0.8, max: 22 },
    { bone: 'tail2', tip: [0, 0, -4.5], k: 130, d: 8, gain: 0.8, max: 20 },
    { bone: 'browR', tip: [-1, 2, 0], k: 220, d: 12, gain: 0.4, max: 10 },
    { bone: 'browL', tip: [1, 2, 0], k: 220, d: 12, gain: 0.4, max: 10 },
    { bone: 'crown', tip: [0, 2, 0], k: 260, d: 13, gain: 0.35, max: 8 },
  ],
  faces: {
    eyes: { default: 'proud', states: { ...Object.fromEntries(Object.keys(EYEP).map((k) => [k, ['eR-' + k, 'eL-' + k]])), aim: ['eR-glare', 'eL-shut'] } },
    shell: { default: 'on', states: { on: ['disc', 'gloss', 'cage', 'inner'], off: [] } },
    pop: { default: 'off', states: { off: [], a: ['pop-a'], b: ['pop-b'] } },
    puddle: { default: 'off', states: { off: [], on: ['puddle'] } },
    contact: { default: 'on', states: { on: ['contact'], off: [] } },
    gum: { default: 'off', states: { off: [], on: ['gum'] } },
  },
  fidget: { every: [5, 9], clips: ['crown', 'preen', 'blow'] },
  clips: {
    // hovers at the front, chin up, tosses its mane; swims a lap round the inside of the
    // bouncing ball; glides back to the front and poses
    idle: { len: 4.8, loop: true, f(P, t, c) {
      const S = lap(t);
      base(P, c, { swim: S.swim });
      const b = bounce(t, 1.6, { squash: 0.08, stretch: 0.04, sharp: 5 });
      P.pos('float', 0, b.u * 2.2, 0); const drop = squash(P, b.sq);
      P.rot('ball', wave(t, 1 / 1.6, 1) * 1.5, 0, wave(t, 1 / 4.8) * 2.5);
      P.pos('swim', S.x, S.y - drop * 0.8 - (1 - b.u) * 0.5, S.z).rot('swim', 0, S.hd, 0).rot('fish', S.pitch, 0, S.bank);
      P.lookW = 1 - S.swim;
      const hov = 1 - S.swim, toss = key([[0.35, 0], [0.55, 1, 'out'], [0.8, -0.35], [1.05, 0]], t), pose = bump(t, 4.25, 4.8);
      P.rot('head', -6 * hov - 5 * pose, 18 * toss, -4 * toss).rot('fish', 0, 0, 3 * toss).rot('browL', 0, 0, 12 * bump(t, 0.4, 1.3));
      mane(P, 1 + 0.1 * pose); fins(P, 14 * pose);
      P.stream('bblion-bub', 'head', LIPS, { rate: 0.7 + S.swim * 3.5, dir: [0, 0.5, 0.6], speed: 0.6 });
    } },
    // the ball bounds forward in big squashy hops while the fish paddles furiously inside
    walk: { len: 0.8, loop: true, f(P, t, c) {
      base(P, c, { swim: 1, k: 1.3 });
      const h = hop(t, 0.8, 4.2, { crouch: 1.4 }), air = h.air ? Math.sin(h.k * Math.PI) : 0;
      P.pos('float', 0, Math.max(0, h.y), 0); const drop = squash(P, h.sq);
      P.rot('ball', h.air ? -6 + 12 * h.k : 5 * (h.sq / -0.2), 0, 0);
      const ph = (t / 0.8) * Math.PI * 4;
      P.pos('swim', 0, h.air ? -1.4 * Math.cos(h.k * Math.PI) : -drop * 0.9, 1.2).rot('fish', 14 - 8 * air, 0, Math.sin(ph / 2) * 4);
      for (const [s, sg] of [['R', 1], ['L', -1]]) P.rot('fin' + s + '1', 0, sg * (8 + Math.sin(ph) * 30), sg * Math.cos(ph) * 14).rot('fin' + s + '2', 0, sg * Math.sin(ph - 0.8) * 22, 0);
      P.rot('tail1', 0, Math.sin(ph) * 12, 0).rot('tail2', 0, Math.sin(ph - 1) * 20, 0).rot('head', -8 * air, 0, 0);
      P.face('eyes', 'glare'); P.lookW = 0.4;
      P.burst(0.8 * 0.63, 'splash', 'root', [0, 0.6, 3], { n: 6, dir: [0, 1, 0.3], speed: 0.8 });
      P.stream('bblion-bub', 'head', LIPS, { rate: 5, dir: [0, 0.4, -0.6], speed: 0.8 });
    } },
    // entrance: sucks in a breath, then PUFFS — mane flared, spines up, roaring — the ball swells
    // until it bursts in a ring of droplets, hangs a beat in the air, and re-forms round it
    cry: { len: 2.4, next: 'idle', f(P, t, c) {
      const BURST = 0.95, REFORM = 1.22;
      base(P, c, { k: 1.3, bubbles: t < BURST || t > REFORM + 0.15 ? 1 : 0 });
      const suck = seg(t, 0, 0.36, E.inout) * (1 - seg(t, 0.36, 0.46, E.out));
      const puff = seg(t, 0.38, 0.56, E.back) * (1 - seg(t, 1.55, 2.05, E.inout)), strain = seg(t, 0.45, BURST, E.in);
      if (t < BURST) {
        const s = 1 - 0.04 * suck + 0.2 * strain + wave(t, 13) * 0.012 * strain;
        P.scl('ball', s * (1 + 0.06 * suck), s * (1 - 0.1 * suck), s * (1 + 0.06 * suck));
        P.pos('float', 0, R * (s - 1) - 1.4 * suck, 0);
      } else {
        const re = seg(t, REFORM, REFORM + 0.32, E.back), s = t < REFORM ? 1.2 + 0.25 * seg(t, BURST, BURST + 0.15, E.out) : 0.25 + 0.75 * re;
        swell(P, s); P.pos('float', 0, t < REFORM ? R * 0.2 * (1 - seg(t, BURST, REFORM, E.in)) : 0, 0);
        P.face('shell', t < REFORM ? 'off' : 'on').face('pop', t < BURST + 0.07 ? 'a' : t < BURST + 0.16 ? 'b' : 'off');
        if (t > REFORM + 0.32) squash(P, wob(t, REFORM + 0.32, 0.07, 2.6, 4.5));
      }
      const fall = t > BURST ? -2.4 * bump(t, BURST, REFORM + 0.35) : 0;
      P.pos('swim', 0, 1.0 * strain + fall, 1.6).sq('fish', -0.1 * suck + 0.05 * puff);
      mane(P, 1 - 0.14 * suck + 0.32 * puff, 16 * puff); P.scl('jab', 1 + 0.2 * puff);
      P.rot('spines', 16 * puff, 0, 0).scl('spines', 1 + 0.25 * puff); fins(P, 40 * puff - 10 * suck, 20 * puff);
      P.rot('head', 10 * suck - 24 * puff + wave(t, 12) * 3 * puff, 0, wave(t, 9) * 4 * puff).rot('jaw', 34 * puff);
      P.rot('browR', 0, 0, 10 * puff).rot('browL', 0, 0, -10 * puff);
      P.face('eyes', suck > 0.3 ? 'shut' : t > BURST && t < REFORM + 0.1 ? 'wide' : puff > 0.3 ? 'glare' : undefined);
      P.blinkOK = puff < 0.1; P.lookW = 1 - puff;
      P.burst(BURST, 'bblion-ring', 'float', BC, {}).burst(BURST, 'splash', 'float', BC, { n: 22, spread: 1, speed: 1.7 })
        .burst(BURST, 'bblion-bub', 'float', BC, { n: 14, spread: 1, speed: 2 }).burst(BURST, 'drop', 'float', [0, 27, 0], { n: 8, spread: 1, speed: 1.5 });
      P.burst(REFORM, 'bblion-glint', 'float', BC, { n: 8, spread: 1, speed: 0.9 });
      if (puff > 0.5 && t < BURST) P.stream('bblion-bub', 'head', LIPS, { rate: 14, dir: [0, 1, 0.5], speed: 1.4, spread: 0.5 });
    } },
    // physical: backs up, coils, and rams the ball's wall — the whole ball lunges and flattens
    // against the target with a splash
    attack: { len: 1.1, next: 'idle', f(P, t, c) {
      base(P, c, { k: 1.2, swim: seg(t, 0.25, 0.4) * (1 - seg(t, 0.5, 0.8)) });
      const back = seg(t, 0, 0.3, E.out) * (1 - seg(t, 0.3, 0.38, E.in)), lunge = seg(t, 0.3, 0.42, E.in3) * (1 - seg(t, 0.55, 1.0, E.inout)), smack = bump(t, 0.41, 0.66);
      P.pos('float', 0, 1.0 * lunge, -2.6 * back + 8 * lunge).rot('ball', -10 * back + 6 * lunge, 0, 0);
      const sz = 1 - 0.24 * smack + 0.06 * lunge * (1 - smack), sxy = 1 + 0.11 * smack;
      P.scl('ball', sxy, sxy, sz).pos('ball', 0, R * (sxy - 1), R * (1 - sz));
      squash(P, -0.08 * back + wob(t, 0.66, 0.07, 3, 5));
      P.pos('swim', 0, 0, -3.4 * back + 3.4 * lunge).rot('fish', 8 * back - 10 * lunge, 0, 0).rot('tail1', 0, 24 * back, 0).rot('tail2', 0, 30 * back, 0);
      P.scl('head', 1 + 0.1 * smack, 1 + 0.05 * smack, 1 - 0.2 * smack); mane(P, 1 + 0.12 * smack, -10 * lunge); fins(P, -20 * lunge + 30 * smack, -30 * lunge);
      P.face('eyes', smack > 0.3 ? 'shut' : back > 0.15 || lunge > 0.15 ? 'glare' : undefined); P.lookW = 1 - lunge;
      P.burst(0.43, 'splash', 'float', [0, 15, 15], { n: 16, dir: [0, 0.3, 1], speed: 1.5, spread: 0.8 }).burst(0.43, 'bblion-ring', 'float', [0, 15, 15.5], {})
        .burst(0.43, 'star', 'float', [0, 18, 16], { n: 3 }).burst(0.43, 'spark', 'float', [0, 15, 16], {});
    } },
    // special (water): squints down its aim, puffs its cheeks, and spits a spinning water bullet;
    // the ball recoils — then it blows the "smoke" off its lips like a gunslinger
    special: { len: 1.8, next: 'idle', f(P, t, c) {
      base(P, c, { k: 0.9 });
      const aim = seg(t, 0.05, 0.4, E.out) * (1 - seg(t, 0.95, 1.3, E.inout)), charge = seg(t, 0.1, 0.5, E.inout) * (1 - seg(t, 0.52, 0.56)), fire = seg(t, 0.52, 0.58, E.out) * (1 - seg(t, 0.62, 1.1, E.inout));
      squash(P, -0.08 * charge + 0.06 * fire + wob(t, 0.62, 0.06, 3, 4.5));
      P.pos('float', 0, 0, -2.8 * fire).rot('ball', -6 * fire, 0, 0);
      P.pos('swim', 0, 0.4 * aim, 2.6 * aim - 2.4 * fire).rot('fish', -4 * charge + 10 * fire, 0, 4 * aim);
      P.scl('head', 1 + 0.1 * charge, 1 + 0.04 * charge, 1 + 0.04 * charge).rot('jaw', -6 * charge + 30 * fire).pos('jaw', 0, 0, 0.5 * charge);
      P.rot('crown', 0, 0, wave(t, 11) * 6 * charge); mane(P, 1 + 0.08 * charge - 0.06 * fire, 8 * charge); fins(P, -16 * fire, 10 * charge);
      P.face('eyes', aim > 0.3 && t < 1.12 ? 'aim' : t >= 1.12 && t < 1.62 ? 'smug' : undefined);
      P.blinkOK = false; P.lookW = 0.6;
      P.burst(0.55, 'bblion-shot', 'head', LIPS, { n: 1, dir: [0, 0.02, 1] }).burst(0.55, 'splash', 'head', LIPS, { n: 6, dir: [0, 0.2, 1], spread: 0.25, speed: 1.2 })
        .burst(0.57, 'bblion-ring', 'float', [0, 13, 15.5], {});
      if (t > 0.55 && t < 0.72) P.stream('bblion-jet', 'head', LIPS, { rate: 90, dir: [0, 0.03, 1] });
      if (t < 0.5) P.stream('bblion-bub', 'head', [0, 12.2, 9.2], { rate: 10 * charge, dir: [0, 0, -1], speed: 0.3, spread: 0.6 });
      const blow = bump(t, 1.12, 1.45); P.rot('jaw', -8 * blow).rot('head', -6 * blow, 0, 0);
      P.burst(1.25, 'bblion-bub', 'head', LIPS, { n: 1, dir: [0, 1, 0.2], speed: 0.4 });
    } },
    // hit: the ball jiggles violently and throws droplets, the fish is knocked about inside and
    // its crown pops up off its head and drops back on
    hurt: { len: 0.7, next: 'idle', f(P, t, c) {
      base(P, c, { k: 1.4 });
      const k = seg(t, 0, 0.06, E.out) * (1 - seg(t, 0.16, 0.6, E.inout));
      P.pos('float', 0, 0, -2.6 * k).rot('ball', -10 * k + wob(t, 0.06, 6, 4, 6), 0, wob(t, 0.06, 5, 3.3, 6));
      P.scl('ball', 1 + 0.09 * k, 1 - 0.1 * k, 1 - 0.07 * k); squash(P, wob(t, 0.1, 0.07, 4, 6));
      P.pos('swim', 0, 0.8 * k, -3 * k).rot('fish', -18 * k, 0, wave(t, 14) * 8 * k).rot('swim', 0, wob(t, 0.05, 25, 2.5, 5), 0);
      mane(P, 1 - 0.1 * k, -12 * k); fins(P, 30 * k, -20 * k);
      P.face('eyes', t < 0.42 ? 'x' : undefined); P.lookW = 1 - k;
      const up = bump(t, 0.04, 0.5); P.pos('crown', 0, 5 * up, 0).rot('crown', 0, 360 * seg(t, 0.04, 0.5), 18 * up);
      P.burst(0.03, 'drop', 'float', BC, { n: 10, spread: 1, speed: 1.6 }).burst(0.03, 'spark', 'float', [0, 16, 15], {}).burst(0.5, 'bblion-glint', 'head', [0.8, 20, 4], { n: 2 });
    } },
    // the ball wobbles drunkenly and pops; the fish drops to the ground and flops onto its side
    faint: { len: 2.6, next: 'down', f(P, t, c) {
      const POP = 0.62, LAND = POP + 0.42;
      base(P, c, { k: 0.6, bubbles: t < POP ? 1 : 0 });
      const dizzy = seg(t, 0, 0.25) * (1 - seg(t, POP - 0.05, POP));
      if (t < POP) { squash(P, wave(t, 3.2) * 0.07 * dizzy); P.rot('ball', wave(t, 2.1) * 8 * dizzy, 0, wave(t, 1.7, 1) * 10 * dizzy); }
      else swell(P, 1 + 0.25 * seg(t, POP, POP + 0.16, E.out));
      P.face('shell', t < POP ? 'on' : 'off').face('pop', t < POP ? 'off' : t < POP + 0.07 ? 'a' : t < POP + 0.16 ? 'b' : 'off');
      P.face('puddle', t > LAND - 0.02 ? 'on' : 'off').face('contact', t < POP ? 'on' : 'off');
      P.burst(POP, 'bblion-ring', 'float', BC, {}).burst(POP, 'splash', 'float', BC, { n: 20, spread: 1, speed: 1.6 }).burst(POP, 'bblion-bub', 'float', BC, { n: 10, spread: 1, speed: 1.6 });
      const fall = seg(t, POP, LAND, E.in), lie = seg(t, POP + 0.1, LAND + 0.12, E.out);
      P.rot('swim', 0, wave(t, 1.3) * 18 * dizzy, 0);
      if (t < LAND) P.pos('swim', 0, -10.5 * fall, 1.2 * fall).rot('fish', 0, 0, -84 * lie);
      else {
        koPose(P, 1);
        for (const t0 of [LAND, 1.5, 1.95]) { const f = bump(t, t0, t0 + 0.3) * (t0 === LAND ? 1 : 0.7); P.pos('swim', 0, 2.2 * f, 0).rot('tail1', 0, 26 * f, 0).rot('tail2', 0, 22 * f, 0).rot('fish', 0, 0, 10 * f); }
      }
      P.burst(LAND, 'splash', 'root', [0, 1, 1], { n: 12, dir: [0, 1, 0], spread: 1, speed: 1.1 }).burst(LAND, 'star', 'head', [0, 18, 5], { n: 4 });
      P.face('eyes', t < LAND ? 'wide' : 'swirl'); P.blinkOK = false; P.lookW = 0;
      if (t < LAND) { fins(P, 50 * fall); mane(P, 1 + 0.15 * fall); }
    } },
    // knocked out: lying in its puddle, flopping weakly now and then, swirly-eyed
    down: { len: 2.4, loop: true, f(P, t, c) {
      base(P, c, { k: 0.25, bubbles: 0 });
      P.face('shell', 'off').face('puddle', 'on').face('contact', 'off').face('eyes', 'swirl'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.4;
      swell(P, 0.001); koPose(P, 1);
      const f = bump(t, 0.9, 1.3);
      P.pos('swim', 0, 1.2 * f, 0).rot('tail1', 0, 22 * f, 0).rot('tail2', 0, 20 * f, 0).rot('fish', 0, 0, 6 * f).rot('jaw', 6 * wave(t, 0.8));
      P.burst(1.3, 'drop', 'root', [0, 1, 0], { n: 3, dir: [0, 1, 0], speed: 0.6 }).burst(0.3, 'bblion-bub', 'head', LIPS, { n: 1, dir: [0, 1, 0], speed: 0.2 });
    } },
    // victory: a bounce with a pirouette inside the ball, a crown toss caught on its head, and a
    // dramatic pose under a shower of purple rain
    win: { len: 3.0, next: 'idle', f(P, t, c) {
      base(P, c, { k: 1.2 });
      const h = t < 1.0 ? hop(t, 1.0, 6, { crouch: 1.6 }) : { y: 0, sq: wob(t, 1.0, -0.12, 2.6, 5) };
      P.pos('float', 0, Math.max(0, h.y), 0); const drop = squash(P, h.sq);
      const spin = seg(t, 0.25, 0.85, E.inout);
      P.pos('swim', 0, -drop * 0.8, 1.6).rot('swim', 0, 360 * spin, 0);
      const flick = bump(t, 1.06, 1.3), air = seg(t, 1.16, 1.76, E.lin), cy = air > 0 && air < 1 ? 7.5 * Math.sin(air * Math.PI) : 0;
      P.pos('crown', 0, cy, 0).rot('crown', 0, 720 * air, 0);
      P.rot('head', 14 * flick - 20 * bump(t, 1.2, 1.8), 0, 0);
      const catchK = Math.max(0, wob(t, 1.76, 1, 3, 6)); P.sq('fish', -0.08 * catchK).pos('crown', 0, -0.6 * catchK, 0);
      const pose = seg(t, 1.9, 2.2, E.back);
      P.rot('finR1', 0, 30 * pose, -100 * pose).rot('finR2', 0, 0, -20 * pose).rot('finL1', 0, -14 * pose, 18 * pose);
      P.rot('head', -16 * pose, -26 * pose, 7 * pose).rot('fish', 0, 0, -6 * pose); mane(P, 1 + 0.18 * pose, 10 * pose);
      P.rot('browL', 0, 0, 14 * pose);
      P.face('eyes', t > 1.16 && t < 1.76 ? 'up' : pose > 0.3 ? 'smug' : undefined); P.lookW = 1 - Math.max(spin < 1 ? spin : 0, pose);
      P.burst(1.77, 'bblion-glint', 'head', [0.8, 21, 4], { n: 6, spread: 1, speed: 0.7 }).burst(2.0, 'bblion-glint', 'float', [-8, 24, 6], { n: 3, speed: 0.4 });
      if (t > 1.95) for (const [x, z] of RAIN) P.stream('bblion-rain', 'root', [x, 38, z], { rate: 4, dir: [0, -1, 0], key: 'r' + x + z });
    } },
    // asleep: floating low in the ball, fins drooping, crown slipped over one eye, slow bubbles
    sleep: { len: 4.0, loop: true, f(P, t, c) {
      base(P, c, { k: 0.35 });
      const br = Math.sin((t / 4.0) * Math.PI * 2);
      squash(P, -0.05 + br * 0.025);
      P.pos('swim', 0, -3.2 + br * 0.5, 0.8).rot('fish', 10 + br * 2, 0, 9).rot('head', 6, 0, 0);
      fins(P, -22); mane(P, 0.94, -6); P.rot('spines', -10, 0, 0);
      P.rot('crown', 0, 0, -26).pos('crown', -0.6, -0.8, 0.3);
      P.face('eyes', 'closed'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.5;
      P.burst(0.6, 'bblion-bub', 'head', LIPS, { n: 1, dir: [0, 1, 0.2], speed: 0.3 }).burst(2.6, 'bblion-bub', 'head', LIPS, { n: 2, dir: [0, 1, 0.2], speed: 0.3 });
      P.burst(1.3, 'z', 'head', [3, 21, 5], {}).burst(3.1, 'z', 'head', [3, 21, 5], {});
    } },
    // fidget: the crown slips; it glances up, nudges it back with a fin, and pretends nothing happened
    crown: { len: 2.6, next: 'idle', f(P, t, c) {
      base(P, c, { k: 0.8 });
      squash(P, bounce(t, 1.3, { squash: 0.05, stretch: 0.02 }).sq);
      const slip = seg(t, 0.15, 0.35, E.in) * (1 - seg(t, 1.05, 1.3, E.back)), reach = seg(t, 0.55, 0.95, E.inout) * (1 - seg(t, 1.25, 1.6, E.inout)), proud = seg(t, 1.45, 1.7, E.out) * (1 - seg(t, 2.3, 2.6));
      P.rot('crown', 0, 0, -28 * slip).pos('crown', -1.2 * slip, -1.1 * slip, 0.3 * slip);
      P.rot('finR1', 0, 60 * reach, -110 * reach).rot('finR2', 0, 0, -30 * reach);
      P.rot('head', -8 * reach - 12 * proud, 10 * proud, -6 * reach); P.rot('browL', 0, 0, 12 * proud);
      P.face('eyes', t > 0.3 && t < 1.25 ? 'up' : proud > 0.3 ? 'smug' : undefined); P.lookW = 1 - Math.max(reach, proud);
      P.burst(1.15, 'bblion-glint', 'head', [0.8, 21, 4], { n: 2 }).burst(1.6, 'bblion-bub', 'head', LIPS, { n: 1, dir: [0, 1, 0.3] });
    } },
    // fidget: admires its reflection in the ball's wall, flexing mane and fins
    preen: { len: 2.6, next: 'idle', f(P, t, c) {
      base(P, c, { k: 0.8, swim: bump(t, 0.1, 0.6) * 0.5 });
      squash(P, bounce(t, 1.3, { squash: 0.05, stretch: 0.02 }).sq);
      const turn = seg(t, 0.1, 0.5, E.inout) * (1 - seg(t, 2.0, 2.45, E.inout)), flex = bump(t, 0.7, 1.9);
      P.pos('swim', -3.2 * turn, 0, 1 * turn).rot('swim', 0, -70 * turn, 0);
      mane(P, 1 + 0.16 * flex, 12 * flex); fins(P, 30 * flex, 20 * flex); P.rot('head', -10 * flex, 0, 8 * wave(t, 1.5) * flex);
      P.face('eyes', turn > 0.5 ? (flex > 0.5 ? 'smug' : 'side') : undefined); P.lookW = 1 - turn;
      P.burst(1.1, 'bblion-glint', 'float', [-13, 18, 4], { n: 3, speed: 0.3 });
    } },
    // fidget: blows a bubble from its pout — it grows, it pops in its face; it composes itself
    blow: { len: 2.4, next: 'idle', f(P, t, c) {
      base(P, c, { k: 0.8 });
      squash(P, bounce(t, 1.2, { squash: 0.05, stretch: 0.02 }).sq);
      const grow = seg(t, 0.25, 1.05, E.inout), POP = 1.1, flinch = seg(t, POP, POP + 0.08, E.out) * (1 - seg(t, POP + 0.3, POP + 0.7, E.inout)), recover = seg(t, 1.7, 2.0, E.out) * (1 - seg(t, 2.2, 2.4));
      P.face('gum', t > 0.25 && t < POP ? 'on' : 'off');
      P.scl('gum', 0.15 + 1.1 * grow).rot('jaw', -6 * grow * (t < POP ? 1 : 0)).pos('jaw', 0, 0, 0.4 * grow * (t < POP ? 1 : 0));
      P.pos('swim', 0, 0, -1.6 * flinch).rot('head', -14 * flinch - 10 * recover, -18 * recover, wave(t, 9) * 4 * flinch);
      mane(P, 1 + 0.2 * flinch, -8 * flinch); fins(P, 26 * flinch);
      P.face('eyes', t < POP ? (grow > 0.35 ? 'wide' : undefined) : t < POP + 0.45 ? 'shut' : recover > 0.2 ? 'smug' : undefined); P.lookW = 1 - Math.max(flinch, recover);
      P.burst(POP, 'splash', 'head', [0, 12.2, 10.3], { n: 8, spread: 1, speed: 0.8 }).burst(POP, 'bblion-ring', 'head', [0, 12.2, 10.3], { scale: 0.3 });
    } },
  },
};
def.anim = anim;
