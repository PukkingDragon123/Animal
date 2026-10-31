// Kohlossus — the community garden's guardian: a GIANT, gentle, permanently drowsy cabbage-rabbit (Bio).
// One huge soft pear of a body — wide and heavy at the bottom, a smaller round head melting straight into it with
// no neck — in leaf green, with a big pale belly that is one enormous cabbage leaf (a pale midrib up the middle,
// veins branching up and out, a frilly scalloped rim). Its eyes are ALWAYS closed: content little arcs, as if it
// is dozing even while it guards. Rosy cheeks, a tiny nose and a tiny smile; two small rabbit ears made of curled
// cabbage leaves; a seedling sprouting from the top of its head; short stubby arms, short stubby feet and a
// Brussels-sprout tail. When it is cross the eyes stay shut, the brows furrow and the cheeks puff up. An original
// design.
//
// Build notes: the body is a body of revolution (two blended ellipsoids: a wide belly and a smaller head) built as
// thin stacked slabs, each a ring of six crossed boxes (the face slab is one broad flat plate); every texel is lit from the ideal smooth surface in model space, so
// the steps read as one soft shape. The belly leaf is painted in front-projected (x, y) space so its veins run
// straight across the steps. The head slabs hang on their own bone (nods, the sleepy head-tilt). Eyes and mouth
// are hand-pixelled state planes (closed-eye arcs, brows); the cheeks are small bones that puff. Clips: idle (slow
// breathing), sleep, walk (a heavy waddle), run, cry, angry, stomp, attack (the cabbage throw), special (the belly
// flop), cast, hurt, faint, down, win, munch and yawn (fidgets).
import { E, seg, bump, wob, wave, hop } from '../anim.js';
import { chunky } from './eyes.js';
import { h2 } from './kit.js';
import { blackGold } from '../model.js';

const TAU = Math.PI * 2;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const C = {
  body: ['#bde688', '#9cd264', '#7ebc4c', '#63a03c', '#4b8230', '#386426'],
  belly: ['#f2fbd6', '#e0f2b8', '#cce79c', '#b4d884', '#98c46a'],
  bellyEdge: ['#cfe8a4', '#b4d886', '#98c46c', '#7eae58'],
  vein: '#fbffec', veinSh: '#a8c87c', rib: '#cdeea2',
  ear: ['#b8e286', '#94cc62', '#74b048', '#5a9238', '#44742c'], earIn: ['#cdeb96', '#b3dd7a', '#98cc60', '#7eb64e'],
  sprout: ['#e4fbb0', '#b8e676', '#8acb4e', '#64a634', '#4a8428'], stem: ['#a8d870', '#80b850', '#5e963a'],
  sproutBall: ['#d8f2a0', '#b0dc74', '#86c050', '#62a03a', '#4a8030'],
  blush: ['#f7b8ae', '#f2a19a', '#e88a8a'],
  ink: '#203018', line: '#26341c', inner: '#6a2e2e', tongue: '#f0909a', nose: '#3e5a2a', noseHi: '#7a9a56',
  heart: ['#f2f8d4', '#dcecb0', '#c4de92', '#a8ca78'], pale: ['#c8e69a', '#a8d47e', '#88bc66', '#6aa252'], wax: ['#8cc08e', '#6aa478', '#4e8a64', '#386e52'], crib: '#e6f4cc',
};

// ---------------------------------------------------------------- painting helpers
// the model-space point under texel (i, j) of a face
function at(c, f, i, j, w, h) {
  const [ox, oy, oz] = c.o, [sx, sy, sz] = c.s, u = (i + 0.5) / w, v = (j + 0.5) / h;
  if (f === 'south') return [ox + u * sx, oy + sy * (1 - v), oz + sz];
  if (f === 'north') return [ox + sx * (1 - u), oy + sy * (1 - v), oz];
  if (f === 'east') return [ox + sx, oy + sy * (1 - v), oz + sz * (1 - u)];
  if (f === 'west') return [ox, oy + sy * (1 - v), oz + sz * u];
  if (f === 'up') return [ox + u * sx, oy + sy, oz + sz * v];
  if (f === 'down') return [ox + u * sx, oy, oz + sz * (1 - v)];
  return [ox + u * sx, oy + sy * (1 - v), oz];
}
const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
const LIT = norm([-0.35, 0.85, 0.4]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// a painterly ramp: light l (−1..1) picks a tone, with an ordered-dither seam on each band's dark side
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function tone(cols, l, x, y, bias = 0) {
  const t = clamp01((0.95 - l) / 2.3 + bias), s = t * (cols.length - 1), i = Math.floor(s), f = s - i;
  if (i >= cols.length - 1) return cols[cols.length - 1];
  return f > 0.6 && ((f - 0.6) / 0.4) * 16 > B4[(x & 3) + (y & 3) * 4] + 0.5 ? cols[i + 1] : cols[i];
}
// lit like an ellipsoid (centre O, radii R) — arms, feet, tail, the held cabbage
const ovoid = (O, R, fn) => (p, w, h, face, c) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h), n = norm([(q[0] - O[0]) / R[0] ** 2, (q[1] - O[1]) / R[1] ** 2, (q[2] - O[2]) / R[2] ** 2]);
    p.px(i, j, fn(dot(n, LIT), n, i, j, q));
  }
};

// ---------------------------------------------------------------- the body: a soft pear of revolution
const AZ = 0.9;                                                 // depth / width
const ELL = [[9.4, 10.0, 12.2, 2.4], [19.8, 8.6, 9.2, 2.2]];      // [centre y, radius y, radius x, squareness]: the belly, the head
// a soft union of the two (no crease where the head melts into the belly)
const Rp = (y) => ELL.reduce((a, [cy, ry, rx, e]) => { const k = 1 - Math.abs((y - cy) / ry) ** e; return a + (k > 0 ? rx * Math.sqrt(k) : 0) ** 8; }, 0) ** (1 / 8);
function bodyN(q) {
  const rho = Math.hypot(q[0], q[2] / AZ);
  if (rho < 1e-3) return [0, 1, 0];
  const d = Math.max(-5, Math.min(5, (Rp(q[1] + 0.06) - Rp(q[1] - 0.06)) / 0.12));
  return norm([q[0] / rho, -d, q[2] / (AZ * AZ * rho)]);
}
// the belly leaf, in front-projected (x, y): centre, radii, a scalloped rim
const BELLY = { y: 9.5, rx: 9.0, ry: 7.6 };
function bellyAt(q) {
  const bx = q[0] / BELLY.rx, by = (q[1] - BELLY.y) / BELLY.ry, th = Math.atan2(by, bx);
  return Math.hypot(bx, by) / (1 + 0.045 * Math.cos(th * 11) + 0.02 * Math.cos(th * 5 + 1));
}
const bellyCol = (q, r, l, i, j) => {
  if (r > 0.9) return tone(C.bellyEdge, l, i, j, r > 0.965 ? 0.22 : 0);        // the frilly leaf rim
  const ax = Math.abs(q[0]), y = q[1];
  if (ax < 0.42 && y < BELLY.y + BELLY.ry * 0.86) return ax > 0.3 ? C.veinSh : C.vein;   // the midrib
  if (ax > 0.42 && r < 0.84) {                                                 // veins branching up and out
    const v = (y - 0.72 * ax + 0.02 * ax * ax) / 2.5, f = ((v % 1) + 1) % 1, fade = ax < 6.6 - r * 2;
    if (fade && f < 0.085) return C.vein;
    if (fade && f > 0.93) return C.veinSh;
    // fine veinlets between
    const g = (((y + 0.9 * ax) / 1.25) % 1 + 1) % 1;
    if (r < 0.7 && f > 0.3 && f < 0.7 && g < 0.06 && h2(i >> 1, j >> 1, 3) < 0.7) return tone(C.belly, l, i, j, -0.12);
  }
  return tone(C.belly, l, i, j);
};
const skinCol = (q, n, l, i, j) => {
  let bias = 0;
  if (q[1] < 2.2) bias += (2.2 - q[1]) * 0.09;                                  // contact shadow
  // wrapper-leaf ribs sweeping up the back and sides (it is a cabbage, after all)
  const lon = Math.atan2(q[0], q[2] / AZ);
  if (Math.abs(lon) > 1.15 && q[1] > 1.5 && q[1] < 25) {
    const f = (((lon * 7) / TAU + 0.05 * Math.sin(q[1] * 0.32) + 10) % 1);
    if (Math.abs(f - 0.5) < 0.022) return tone(C.body, l, i, j, -0.2);
    if (Math.abs(f - 0.5) < 0.04) return tone(C.body, l, i, j, 0.12);
  }
  const g = h2(i >> 1, j >> 1, 11);
  if (g < 0.035) bias -= 0.12; else if (g > 0.975) bias += 0.1;                // soft painted flecks
  return tone(C.body, l, i, j, bias);
};
const bodyP = (p, w, h, face, c) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h), n = bodyN(q), l = dot(n, LIT);
    const r = n[2] > 0.16 && q[1] < BELLY.y + BELLY.ry + 0.4 ? bellyAt(q) : 9;
    p.px(i, j, r < 1 ? bellyCol(q, r, l, i, j) : skinCol(q, n, l, i, j));
  }
};
// the cheeks: the body's own skin with a soft rosy blush
const cheekP = (p, w, h, face, c) => {
  bodyP(p, w, h, face, c);
  if (face === 'down' || face === 'north') return;
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const d = face === 'south' ? Math.hypot((i - cx) / (w * 0.46), (j - cy) / (h * 0.42)) : 0.75 + (j / h) * 0.2;
    if (d < 0.62) p.px(i, j, (i + j) % 7 === 0 && d < 0.4 ? C.blush[0] : C.blush[1]);
    else if (d < 1 && (d < 0.82 ? (i + j) & 1 : !((i & 1) || (j & 1)))) p.px(i, j, C.blush[d < 0.82 ? 1 : 2]);
  }
};
// small parts lit as ellipsoids
const armP = (O, R) => ovoid(O, R, (l, n, i, j, q) => (q[1] < O[1] - R[1] * 0.55 ? tone(C.belly.slice(1), l, i, j, 0.05) : tone(C.body, l, i, j)));
const footP = (O, R) => ovoid(O, R, (l, n, i, j, q) => {
  if (n[1] < -0.55) return C.belly[3];                                           // pale soles
  const u = (q[0] - (O[0] - R[0])) / (2 * R[0]), toe = q[2] > O[2] + R[2] * 0.4 && n[1] < 0.7 && (Math.abs(u - 1 / 3) < 0.03 || Math.abs(u - 2 / 3) < 0.03);
  return toe ? tone(C.body, l, i, j, 0.32) : tone(C.body, l, i, j, 0.04);         // two little toe creases, no claws
});
const sproutBallP = (O, R) => ovoid(O, R, (l, n, i, j, q) => {
  const lon = Math.atan2(n[0], n[2]), f = ((lon * 5 + n[1] * 3) / TAU + 10) % 1;
  if (n[1] > 0.8) return tone(C.sprout, l, i, j, -0.1);
  return Math.abs(f - 0.5) < 0.05 ? tone(C.sproutBall, l, i, j, 0.25) : tone(C.sproutBall, l, i, j);
});
const heldCab = (o, s) => { const O = [o[0] + s[0] / 2, o[1] + s[1] / 2, o[2] + s[2] / 2], R = [s[0] / 2, s[1] / 2, s[2] / 2]; return ovoid(O, R, (l, n, i, j) => { const lon = Math.atan2(n[0], n[2]); if (n[1] > 0.7) return tone(C.heart, l, i, j); const rib = Math.abs(((lon * 4) / TAU + 10) % 1 - 0.5) < 0.04; return rib ? C.crib : tone(n[1] < -0.2 ? C.wax : C.pale, l, i, j); }); };
// an ear leaf: one midrib through all its boxes, veins branching up and out, a crinkled pale rim; the front (inner
// ear) is the pale heart of the leaf, the back the darker outer leaf
const earP = (x0) => (p, w, h, face, c) => {
  const hw = c.s[0] / 2;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = at(c, face, i, j, w, h), ax = Math.abs(q[0] - x0), t = clamp01((32.6 - q[1]) / 7);
    const inner = face === 'south', L = inner ? C.earIn : C.ear, l = face === 'up' ? 0.7 : face === 'down' ? -0.6 : 0.45 - t * 0.8 - (face === 'east' || face === 'west' ? 0.25 : 0);
    let col = tone(L, l, i, j);
    if (face === 'south' || face === 'north') {
      if (ax < 0.24) col = inner ? C.vein : C.rib;
      else { const f = (((q[1] - 0.95 * ax) / 1.15) % 1 + 1) % 1; if (f < 0.12 && ax < hw - 0.4) col = inner ? C.vein : C.rib; else if (f > 0.9 && ax < hw - 0.4) col = tone(L, l, i, j, 0.2); }
      if (ax > hw - 0.32) col = ((Math.round(q[1] * 4) & 3) === 0) ? tone(L, l, i, j, 0.3) : (inner ? C.earIn[0] : C.ear[0]);   // crinkled rim
    }
    p.px(i, j, col);
  }
};
// a seedling leaf (cut-out plane): pointed oval, pale midrib, darker underside half
const sproutLeafP = (p, w, h) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = (i + 0.5) / w * 2 - 1, v = (j + 0.5) / h * 2 - 1, lim = (1 - u * u) * 1.05 * (u < 0 ? 0.8 + 0.2 * (u + 1) : 1);
    if (Math.abs(v) > lim) continue;
    const edge = Math.abs(v) > lim - 0.28;
    p.px(i, j, Math.abs(v) < 0.12 && u > -0.85 ? C.sprout[0] : edge ? C.sprout[4] : v < 0 ? (h2(i, j, 5) < 0.1 ? C.sprout[0] : C.sprout[1]) : C.sprout[2]);
  }
};
const stemP = (p, w, h, face) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(i, j, face === 'up' ? C.stem[0] : face === 'east' || face === 'north' ? C.stem[2] : C.stem[1]); };
// a tiny soft nose: a rounded little triangle with a glint
const noseP = chunky((q, W, H) => { const cx = (W - 1) / 2; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const hw = (W / 2) * (1 - y / H) + 0.2; if (Math.abs(x - cx) <= hw && !(y === 0 && (x === 0 || x === W - 1))) q.px(x, y, C.nose); } q.px(Math.floor(cx) - 1 < 0 ? 0 : Math.floor(cx) - 1, 0, C.noseHi); }, 1);

// ---------------------------------------------------------------- the face: hand-pixelled closed eyes, brows, mouth
// drawn on a coarse grid (chunky); the right eye has its outer corner at x = 0, the left eye is its mirror
const stroke = (q, pts, c, t = 1) => {
  for (let k = 0; k < pts.length - 1; k++) {
    const [a, b] = [pts[k], pts[k + 1]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2) + 1;
    for (let s = 0; s <= n; s++) { const x = Math.floor(a[0] + ((b[0] - a[0]) * s) / n), y = Math.floor(a[1] + ((b[1] - a[1]) * s) / n); for (let d = 0; d < t; d++) q.px(x, y + d, c); }
  }
};
const curve = (x0, x1, f, n = 14) => Array.from({ length: n + 1 }, (_, k) => { const x = x0 + ((x1 - x0) * k) / n; return [x, f(x)]; });
// a tapered brush arc: thin at the ends, two cells thick through the middle
const arc = (q, W, y0, depth, o = {}) => {
  const x0 = o.x0 ?? 1.5, x1 = o.x1 ?? W - 2.5, cx = (x0 + x1) / 2, hw = (x1 - x0) / 2, f = (x) => y0 + depth * (1 - ((x - cx) / hw) ** 2) + (o.tilt || 0) * ((x - cx) / hw);
  stroke(q, curve(x0, x1, f), o.c || C.ink);
  stroke(q, curve(cx - hw * 0.55, cx + hw * 0.55, (x) => f(x) + (o.down ? 1 : depth >= 0 ? -1 : 1) * (o.thin ? 0 : 1), 8), o.c || C.ink);
};
const EYE_ART = {
  // content: a soft downward arc with a little outer lash
  calm: (q, W) => { arc(q, W, 4.6, 2.3, { down: true }); q.px(0, 5, C.ink); },
  sleepy: (q, W) => { arc(q, W, 5.8, 1.3, { down: true }); q.px(0, 7, C.ink); },
  happy: (q, W) => { arc(q, W, 7.5, -2.6); },
  // cross: the shut line pulled down at the inside, a thick brow furrowed down toward the nose
  angry: (q, W) => { arc(q, W, 5.6, 1.0, { tilt: 0.9 }); stroke(q, [[0.5, 1], [W - 1.5, 3.5]], C.ink, 2); },
  worried: (q, W) => { arc(q, W, 6, 1.6); stroke(q, [[1, 3.6], [W - 2, 1.4]], C.ink); },
  // scrunched tight (hurt)
  squeeze: (q, W) => { stroke(q, [[1.5, 2.5], [W - 2.5, 5.5], [1.5, 8.5]], C.ink); stroke(q, [[1.5, 3.5], [W - 3.5, 5.5], [1.5, 7.5]], C.ink); stroke(q, [[1, 0.6], [W - 2, 2.4]], C.ink); },
  dizzy: (q, W) => { stroke(q, curve(1, W - 2, (x) => 5.5 + Math.sin((x - 1) * 1.15) * 1.4, 20), C.ink); },
};
const EYE_STATES = Object.keys(EYE_ART);
const eyeTex = (s) => chunky((q, W) => EYE_ART[s](q, W), 1);
const ellG = (q, cx, cy, rx, ry, c, keep) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1 && (!keep || keep(x, y))) q.px(x, y, c); };
const MOUTH_ART = {
  smile: (q, W) => { const cx = W / 2; stroke(q, curve(cx - 2.2, cx + 2.2, (x) => 2.2 + 1.4 * (1 - ((x - cx) / 2.2) ** 2)), C.line); },
  // a pursed little pout: the lips pushed into a tiny downward bow
  pout: (q, W) => { const cx = W / 2; stroke(q, curve(cx - 1.5, cx + 1.5, (x) => 3.6 - 1.1 * (1 - ((x - cx) / 1.5) ** 2)), C.line); },
  chew: (q, W) => { const cx = W / 2; stroke(q, curve(cx - 2.4, cx, (x) => 2.6 + Math.sin(((x - cx + 2.4) / 2.4) * Math.PI) * 1.1, 8), C.line); stroke(q, curve(cx, cx + 2.4, (x) => 2.6 + Math.sin(((x - cx) / 2.4) * Math.PI) * 1.1, 8), C.line); },
  o: (q, W) => { const cx = W / 2; ellG(q, cx, 3.5, 1.5, 1.6, C.line); ellG(q, cx, 3.6, 0.9, 1.0, C.inner); },
  yawn: (q, W, H) => { const cx = W / 2; ellG(q, cx, H / 2, 2.9, H / 2, C.line); ellG(q, cx, H / 2, 2.1, H / 2 - 0.9, C.inner); ellG(q, cx, H - 2, 1.5, 0.9, C.tongue); },
  grin: (q, W, H) => { const cx = W / 2, top = 1.2, keep = (x, y) => y + 0.5 >= top; ellG(q, cx, top, 3.3, H - 1.6, C.line, keep); ellG(q, cx, top, 2.5, H - 2.5, C.inner, (x, y) => y + 0.5 >= top + 1); ellG(q, cx, H - 2.2, 1.3, 0.8, C.tongue); },
  wavy: (q, W) => { stroke(q, curve(1.5, W - 1.5, (x) => 3 + Math.sin((x - 1.5) * 1.6) * 0.9, 18), C.line); },
};
const MOUTH_STATES = Object.keys(MOUTH_ART);
const mouthTex = (s) => chunky((q, W, H) => MOUTH_ART[s](q, W, H), 1);

// ---------------------------------------------------------------- geometry
const P = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
// thin slabs (thinner where the curve turns fast), each a ring of crossed boxes; the face is one broad flat slab
const CUTS = [0, 1.1, 2.2, 3.4, 4.7, 6.1, 7.7, 11.0, 12.6, 13.9, 15.1, 16.3, 17.5, 18.4, 19.2, 23.8, 24.8, 25.7, 26.5, 27.2, 27.8, 28.4];
const FACE = [19.2, 23.8], HEAD_Y = 17.5;                 // slabs from HEAD_Y up hang on the head bone
const slabR = (y0, y1) => { const s = Array.from({ length: 9 }, (_, k) => Rp(y0 + ((y1 - y0) * k) / 8)), mx = Math.max(...s), mean = s.reduce((a, b) => a + b, 0) / s.length; return 0.55 * mx + 0.45 * mean; };
const RING = [[1.0, 0.38], [0.38, 1.0], [0.93, 0.62], [0.62, 0.93], [0.82, 0.8], [0.8, 0.82]], RING_FACE = [[1.0, 0.38], [0.74, 1.0], [0.93, 0.68], [0.84, 0.86]];
const slab = (y0, y1) => { const R = slabR(y0, y1); return (y0 === FACE[0] ? RING_FACE : RING).map(([a, b]) => P([-R * a, y0, -R * AZ * b], [2 * R * a, y1 - y0, 2 * R * AZ * b], bodyP)); };
const bodyCubes = (bone) => CUTS.slice(0, -1).map((y, k) => [y, CUTS[k + 1]]).filter(([y]) => (y >= HEAD_Y) === (bone === 'head')).flatMap(([a, b]) => slab(a, b));
const FZ = slabR(...FACE) * AZ;                            // the flat of the face
const EY = 22.0, EX = 2.85, MY = 20.0, CY = 20.5, CX = 4.6;
const eyeBone = (side) => {
  const x = side * EX, n = side < 0 ? 'R' : 'L';
  return { name: 'eye' + n, parent: 'head', pivot: [x, EY, FZ + 0.05], cubes: EYE_STATES.map((s) => ({ o: [x - 1.8, EY - 1.6, FZ + 0.05], s: [3.6, 3.2, 0], plane: 'z', mirror: side > 0, tex: eyeTex(s), id: 'e' + n + '-' + s, hide: s !== 'calm', outline: false })) };
};
const cheekBone = (side) => ({ name: 'cheek' + (side < 0 ? 'R' : 'L'), parent: 'head', pivot: [side * CX, CY, FZ], cubes: [P([side * CX - 1.4, CY - 0.95, FZ - 1.3], [2.8, 1.9, 1.56], cheekP, { outline: false })] });
// a small rounded clump of boxes lit as one ellipsoid (arms)
const nub = (O, R, tex, set) => set.map(([a, b, c]) => P([O[0] - R[0] * a, O[1] - R[1] * b, O[2] - R[2] * c], [2 * R[0] * a, 2 * R[1] * b, 2 * R[2] * c], tex));
// small leafy rabbit ears: a short stalk and a broad leaf, and a rounded tip that curls forward on its own bone
const EAR = (side) => {
  const x = side * 4.6, n = side < 0 ? 'R' : 'L', tex = earP(x);
  return [{ name: 'ear' + n, parent: 'head', pivot: [x, 25.6, -0.2], rot: [-8, side * 10, side * -22], cubes: [
    P([x - 0.8, 25.0, -0.85], [1.6, 1.6, 1.3], tex), P([x - 1.6, 26.4, -0.85], [3.2, 1.8, 1.2], tex), P([x - 2.0, 28.0, -0.8], [4.0, 2.4, 1.1], tex),
  ] }, { name: 'ear' + n + '2', parent: 'ear' + n, pivot: [x, 30.3, -0.3], rot: [20, 0, side * -6], cubes: [
    P([x - 1.7, 30.2, -0.75], [3.4, 1.4, 1.0], tex), P([x - 1.0, 31.5, -0.7], [2.0, 1.0, 0.9], tex),
  ] }];
};
const ARM = (side) => {
  const n = side < 0 ? 'R' : 'L', O = [side * 11.9, 10.9, 2.2], R = [2.3, 3.6, 2.5];
  return { name: 'arm' + n, parent: 'body', pivot: [side * 11.0, 14.8, 1.6], rot: [-12, 0, side * 6], cubes: nub(O, R, armP(O, R), [[1, 0.9, 0.66], [0.72, 1, 0.72], [0.66, 0.9, 1]]) };
};
const FOOT = (side) => {
  const n = side < 0 ? 'R' : 'L', x = side * 5.8, O = [x, 1.0, 6.4], R = [3.4, 2.6, 4.8];
  return { name: 'foot' + n, parent: 'root', pivot: [x, 1.4, 4.6], cubes: [P([x - 3.1, 0, 2.2], [6.2, 2.8, 8.6], footP(O, R)), P([x - 2.5, 0, 10.6], [5.0, 2.0, 0.8], footP(O, R))] };
};
const TAILO = [0, 5.4, -11.0], TAILR = [2.5, 2.4, 2.4];
const tailCubes = [[0.97, 0.6, 0.6], [0.6, 0.97, 0.6], [0.6, 0.6, 0.97], [0.84, 0.76, 0.76]].map(([a, b, c]) => P([TAILO[0] - TAILR[0] * a, TAILO[1] - TAILR[1] * b, TAILO[2] - TAILR[2] * c], [2 * TAILR[0] * a, 2 * TAILR[1] * b, 2 * TAILR[2] * c], sproutBallP(TAILO, TAILR)));
const CAB = [[9.6, 3.5, 1.9], [5.6, 5.0, 5.4]];   // the cabbage it pulls out to eat (or throw): [o, s] of its bounding ball
const cabBall = ((o, s) => { const t = heldCab(o, s), O = [o[0] + s[0] / 2, o[1] + s[1] / 2, o[2] + s[2] / 2], R = s.map((v) => v / 2); return [[0.97, 0.62, 0.62], [0.62, 0.97, 0.62], [0.62, 0.62, 0.97]].map(([a, b, c]) => P([O[0] - R[0] * a, O[1] - R[1] * b, O[2] - R[2] * c], [2 * R[0] * a, 2 * R[1] * b, 2 * R[2] * c], t, { id: 'heldcab', hide: true })); })(...CAB);
const TOPY = 28.5;
const KEEP = new Set([...C.blush, C.inner, C.tongue]);

export const def = {
  name: 'kohlossus', ppu: 3, scale: 1.35, outline: { color: C.ink, px: 1.6 },
  // the ultra-drip form gilds it, but the rosy cheeks and the mouth keep their colours
  dripForm: { map: (c, glow) => (KEEP.has(c) ? c : blackGold(c, glow)) },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    FOOT(-1), FOOT(1),
    { name: 'body', parent: 'root', pivot: [0, 0.4, 0], cubes: bodyCubes('body') },
    { name: 'head', parent: 'body', pivot: [0, HEAD_Y, 0], cubes: [...bodyCubes('head'), P([-0.75, 20.55, FZ + 0.06], [1.5, 1.0, 0], noseP, { plane: 'z', outline: false })] },
    eyeBone(-1), eyeBone(1), cheekBone(-1), cheekBone(1),
    { name: 'mouth', parent: 'head', pivot: [0, MY, FZ + 0.05], cubes: MOUTH_STATES.map((s) => ({ o: [-1.7, MY - 0.9, FZ + 0.05], s: [3.4, 1.8, 0], plane: 'z', tex: mouthTex(s), id: 'm-' + s, hide: s !== 'smile', outline: false })) },
    ...EAR(-1), ...EAR(1),
    // the seedling on top of its head
    { name: 'sprout', parent: 'head', pivot: [0.4, TOPY - 0.2, 0.4], cubes: [
      P([0.0, TOPY - 0.6, 0.0], [0.8, 2.6, 0.8], stemP),
      P([-3.0, TOPY + 1.2, 0.4], [3.2, 1.7, 0], sproutLeafP, { plane: 'z', mirror: true, pivot: [0.4, TOPY + 2.0, 0.4], rot: [0, 18, -24], outline: false }),
      P([0.8, TOPY + 1.2, 0.4], [3.2, 1.7, 0], sproutLeafP, { plane: 'z', pivot: [0.4, TOPY + 2.0, 0.4], rot: [0, -18, 24], outline: false }),
    ] },
    ARM(-1), ARM(1),
    { name: 'cab', parent: 'armL', pivot: [12.4, 6.0, 4.6], cubes: cabBall },
    { name: 'tail', parent: 'body', pivot: [0, 5.4, -9.4], cubes: tailCubes },
  ],
  attach: {
    head: { bone: 'head', at: [0, TOPY, 0], size: 12 },
    face: { bone: 'head', at: [0, EY, FZ], size: 12 },
    neck: { bone: 'body', at: [0, 17.5, 9.4], size: 12 },
    back: { bone: 'body', at: [0, 12, -10.6], size: 12 },
  },
};

// ---------------------------------------------------------------- animation
const TOP = [0.4, TOPY + 2, 0.4], HAND = [12.4, 6.0, 4.6];
/** squash the body down by dy (units) while the feet stay planted */
const squat = (P, dy) => P.pos('body', 0, dy, 0).sq('body', dy * 0.018);
const ears = (P, out, back = 0, curl = 0) => P.rot('earR', back, 0, -out).rot('earL', back, 0, out).rot('earR2', curl, 0, 0).rot('earL2', curl, 0, 0);
const eyes = (P, s) => P.face('eyes', s);
const mouth = (P, s) => P.face('mouth', s);
const puff = (P, k) => P.scl('cheekR', 1 + 0.6 * k, 1 + 0.5 * k, 1 + 2.2 * k).scl('cheekL', 1 + 0.6 * k, 1 + 0.5 * k, 1 + 2.2 * k);
const arms = (P, rx, rz, lx = rx, lz = rz) => P.rot('armR', rx, 0, -rz).rot('armL', lx, 0, lz);
export const anim = {
  start: 'idle', seed: 77,
  breathe: { bone: 'body', amp: 0.02, per: 4.4 },
  look: { bone: 'head', yaw: 8, pitch: 4, speed: 1.6 },
  springs: [
    { bone: 'earR', tip: [0, 5, 0], k: 150, d: 8, gain: 0.6, max: 14 },
    { bone: 'earL', tip: [0, 5, 0], k: 155, d: 8, gain: 0.6, max: 14 },
    { bone: 'earR2', tip: [0, 2, 0], k: 110, d: 6, gain: 1.0, max: 26 },
    { bone: 'earL2', tip: [0, 2, 0], k: 115, d: 6, gain: 1.0, max: 26 },
    { bone: 'sprout', tip: [0, 3, 0], k: 90, d: 5, gain: 1.2, max: 26 },
    { bone: 'tail', tip: [0, 0, -2.4], k: 200, d: 10, gain: 0.7, max: 16 },
    { bone: 'armR', tip: [0, -6, 0], k: 260, d: 14, gain: 0.25, max: 8 },
    { bone: 'armL', tip: [0, -6, 0], k: 260, d: 14, gain: 0.25, max: 8 },
  ],
  faces: {
    eyes: { default: 'calm', states: Object.fromEntries(EYE_STATES.map((s) => [s, ['eR-' + s, 'eL-' + s]])) },
    mouth: { default: 'smile', states: Object.fromEntries(MOUTH_STATES.map((s) => [s, ['m-' + s]])) },
    cab: { default: 'off', states: { on: ['heldcab'], off: [] } },
  },
  fidget: { every: [5, 9], clips: ['munch', 'yawn', 'munch'] },
  clips: {
    // dozing on guard: one slow, deep breath — the belly swells, the head lifts and settles, the ears and sprout
    // drift; every other breath it nods off a little and catches itself
    idle: { len: 4.4, loop: true, f(P, t, c) {
      const br = Math.sin((t / 4.4) * TAU), inh = br * 0.5 + 0.5, nod = (c.loopN % 2) * bump(t, 2.4, 3.9);
      P.scl('body', 1 + 0.014 * inh, 1, 1 + 0.03 * inh).pos('body', 0, 0.35 * inh, 0);
      P.rot('head', -2 * inh + 7 * nod - 3 * bump(t, 3.7, 4.3) * (c.loopN % 2), 0, wave(t, 1 / 8.8) * 2.5);
      ears(P, 2 + 3 * inh, 2 - 4 * inh + 6 * nod); arms(P, 0, 2 + 2 * inh);
      P.rot('sprout', 0, 0, wave(t, 1 / 4.4, 1) * 6);
      eyes(P, nod > 0.5 ? 'sleepy' : 'calm'); mouth(P, 'smile'); P.lookW = 1 - nod;
    } },
    // fast asleep: slumped, the head tipped to one side, enormous slow breaths, ears drooping, z's
    sleep: { len: 5.2, loop: true, f(P, t) {
      const br = Math.sin((t / 5.2) * TAU), inh = br * 0.5 + 0.5;
      squat(P, -1.0); P.scl('body', 1 + 0.025 * inh, 1 + 0.015 * inh, 1 + 0.05 * inh).rot('body', 3, 0, 5);
      P.rot('head', 7 - 2 * inh, 0, 4 + inh * 1.5); ears(P, 24, 18, 20); arms(P, 4, -2);
      P.rot('sprout', 20, 0, 16 + 4 * inh);
      eyes(P, 'sleepy'); mouth(P, br > 0.55 ? 'o' : 'smile'); P.lookW = 0; P.breathW = 0;
      P.burst(0.6, 'z', 'head', [5, TOPY + 1, 4], {}).burst(2.2, 'z', 'head', [5, TOPY + 1, 4], {}).burst(3.8, 'z', 'head', [5, TOPY + 1, 4], {});
    } },
    // a heavy waddle: it rocks its whole weight from one stubby foot to the other
    walk: { len: 1.2, loop: true, f(P, t) {
      const ph = (t / 1.2) * TAU, s = Math.sin(ph), lr = Math.max(0, s), ll = Math.max(0, -s), dy = Math.abs(Math.cos(ph));
      P.pos('body', s * 0.9, dy * 0.7, 0).rot('body', 2, s * 3, -s * 8).sq('body', -0.035 * (1 - dy));
      P.rot('head', 0, 0, s * 4).pos('footR', 0, ll * 1.4, -s * 2.4).rot('footR', -14 * ll, 0, 0).pos('footL', 0, lr * 1.4, s * 2.4).rot('footL', -14 * lr, 0, 0);
      arms(P, s * 16, 8 + 6 * dy, -s * 16, 8 + 6 * dy); ears(P, 4 + s * 4, -4 * dy);
      eyes(P, 'calm'); mouth(P, 'smile');
      P.burst(0.3, 'dust', 'root', [5.8, 0, 6], { n: 3 }).burst(0.9, 'dust', 'root', [-5.8, 0, 6], { n: 3 });
    } },
    run: { len: 0.7, loop: true, f(P, t) {
      const h = hop(t, 0.7, 2.0, { crouch: 0.8, air: [0.22, 0.62] });
      if (h.air) P.pos('root', 0, h.y, 0); else squat(P, h.y);
      P.sq('body', h.sq * 0.8).rot('body', h.air ? -4 : 5, 0, 0);
      const k = h.air ? Math.sin(h.k * Math.PI) : 0;
      P.rot('footR', 22 * k, 0, 0).rot('footL', 22 * k, 0, 0); arms(P, -30 * k, 20 + 20 * k); ears(P, 8, -12 * k);
      eyes(P, 'calm'); mouth(P, 'o');
    } },
    // battle cry: it rears up, arms high, and lets out one huge sleepy bellow — eyes still shut
    cry: { len: 2.2, next: 'idle', f(P, t) {
      const crouch = bump(t, 0.05, 0.4), up = seg(t, 0.35, 0.6, E.back) * (1 - seg(t, 1.3, 1.6, E.inout)), slam = bump(t, 1.3, 1.65);
      squat(P, -2.0 * crouch + 1.4 * up - 2.4 * slam); P.rot('body', -12 * up + 5 * slam, 0, 0).rot('head', -10 * up, 0, 0);
      arms(P, -40 * up, 70 * up); ears(P, -6 * up, -16 * up); puff(P, 0.6 * up);
      eyes(P, 'angry'); mouth(P, up > 0.2 ? 'yawn' : 'pout');
      P.burst(1.32, 'dust', 'root', [0, 0, 6], { n: 14 }).burst(1.32, 'ring', 'root', [0, 0.2, 4], { scale: 1.4 }).burst(0.7, 'anger', 'head', [8, TOPY, 4], {}).burst(0.75, 'leaf', 'sprout', TOP, { n: 6 });
    } },
    // ANGRY: eyes stay shut, but the brows furrow, the cheeks puff out, it swells up and huffs, a foot stamps
    angry: { len: 2.0, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const k = seg(t, 0, 0.3, E.back) * (1 - seg(t, 1.65, 2.0)), stamp = Math.max(0, Math.sin(t * TAU * 2.6)) * k, tr = wave(t, 11) * k;
      P.scl('body', 1 + 0.05 * k, 1 + 0.03 * k, 1 + 0.06 * k).rot('body', 0, 0, tr * 1.2).rot('head', 4 * k, 0, -tr);
      P.pos('footR', 0, 1.6 * stamp, 0.3 * stamp).rot('footR', -16 * stamp, 0, 0); squat(P, -0.5 * (1 - stamp) * k);
      puff(P, k * (0.85 + 0.15 * Math.sin(t * 9))); ears(P, -4 * k, -18 * k); arms(P, -14 * k, 26 * k);
      eyes(P, 'angry'); mouth(P, 'pout');
      P.stream('steam', 'head', [-3, TOPY - 1, 2], { rate: 9 * k, dir: [-0.4, 1, 0], speed: 1.1 }).stream('steam', 'head', [3, TOPY - 1, 2], { rate: 9 * k, dir: [0.4, 1, 0], speed: 1.1 });
      for (const s of [0.1, 0.48, 0.87, 1.25]) P.burst(s + 0.08, 'dust', 'footR', [-5.8, 0, 6], { n: 3 });
      P.burst(0.3, 'anger', 'head', [7, TOPY, 4], {});
    } },
    // STOMP: it heaves its weight onto one side, lifts a stubby foot… and drops it (the ground shakes)
    stomp: { len: 1.6, next: 'idle', f(P, t) {
      const lift = seg(t, 0.05, 0.6, E.out) * (1 - seg(t, 0.62, 0.72, E.in3)), hit = bump(t, 0.7, 1.1);
      P.pos('footL', 0, 5.5 * lift, 1.6 * lift).rot('footL', -24 * lift, 0, 0).rot('body', 0, 0, -10 * lift + 4 * hit).pos('body', -1.4 * lift, 0.8 * lift - 2.2 * hit, 0).sq('body', -0.09 * hit + wob(t, 0.72, 0.03, 4, 6));
      P.rot('head', 0, 0, 4 * lift); ears(P, 6 * lift, -8 * lift + 10 * hit); arms(P, -10 * lift, 10 + 30 * lift); puff(P, 0.7 * lift + 0.3 * hit);
      eyes(P, lift > 0.15 || hit > 0.2 ? 'angry' : 'calm'); mouth(P, lift > 0.2 ? 'pout' : hit > 0.2 ? 'o' : 'smile');
      P.burst(0.72, 'dust', 'root', [5.8, 0, 6], { n: 16 }).burst(0.72, 'rock', 'root', [5.8, 0, 6], { n: 5 }).burst(0.74, 'ring', 'root', [5.8, 0.2, 4], { scale: 1.2 }).burst(0.8, 'leaf', 'sprout', TOP, { n: 4 });
    } },
    // physical: produces a cabbage, winds back and lobs it underarm with its whole weight
    attack: { len: 1.4, next: 'idle', f(P, t) {
      const show = seg(t, 0.0, 0.14, E.back), back = seg(t, 0.08, 0.42, E.out) * (1 - seg(t, 0.42, 0.5, E.in)), thr = seg(t, 0.44, 0.56, E.in3) * (1 - seg(t, 0.8, 1.2, E.inout));
      P.face('cab', t < 0.54 ? 'on' : 'off').scl('cab', show, show, show);
      P.rot('armL', 40 * back - 110 * thr, -20 * back, 20 - 10 * back).rot('body', 0, 18 * back - 24 * thr, 0).pos('root', 0, 0, -1 * back + 2 * thr);
      squat(P, -1.2 * back + 0.6 * thr); P.rot('head', 4 * back - 6 * thr, 0, 0); ears(P, 4, -10 * thr); puff(P, 0.5 * back);
      eyes(P, 'angry'); mouth(P, thr > 0.3 ? 'o' : 'pout');
      P.burst(0.54, 'leaf', 'armL', HAND, { n: 8, dir: [0, 0.4, 1], speed: 3 }).burst(0.55, 'dust', 'root', [0, 0, 6], { n: 4 });
    } },
    // special: the BELLY FLOP — a deep crouch, a ponderous leap, and the whole giant lands flat on its belly
    special: { len: 2.2, next: 'idle', f(P, t) {
      P.blinkOK = false;
      const crouch = bump(t, 0.0, 0.45), rise = seg(t, 0.4, 0.75, E.out) * (1 - seg(t, 0.75, 1.0, E.in3)), flat = seg(t, 0.92, 1.02, E.in3) * (1 - seg(t, 1.6, 2.05, E.inout));
      P.pos('root', 0, 8 * rise + 3.5 * flat, 2 * rise + 5 * flat).rot('root', 78 * flat + 16 * rise, 0, 0); squat(P, -2.4 * crouch);
      P.sq('body', -0.16 * flat + 0.1 * rise + wob(t, 1.0, -0.07, 4, 5)); arms(P, -60 * rise - 50 * flat, 60 * rise + 50 * flat);
      ears(P, 10, -20 * rise - 30 * flat); P.rot('head', -20 * flat, 0, 0).rot('footR', 30 * rise + 40 * flat, 0, 0).rot('footL', 30 * rise + 40 * flat, 0, 0);
      eyes(P, flat > 0.3 ? 'squeeze' : rise > 0.2 ? 'happy' : 'angry'); mouth(P, rise > 0.3 ? 'o' : flat > 0.3 ? 'wavy' : 'pout'); puff(P, flat * 0.6);
      P.burst(1.0, 'dust', 'root', [0, 0, 12], { n: 24, speed: 3 }).burst(1.0, 'rock', 'root', [0, 0, 12], { n: 8 }).burst(1.02, 'ring', 'root', [0, 0.2, 12], { scale: 2 }).burst(1.02, 'leaf', 'body', [0, 16, 8], { n: 12, speed: 2 });
    } },
    // cast: shakes itself like a wet dog — compost, leaves and spores fly
    cast: { len: 1.5, next: 'idle', f(P, t) {
      const k = seg(t, 0.1, 0.3) * (1 - seg(t, 1.1, 1.4)), sh = Math.sin(t * TAU * 5) * k;
      P.rot('body', 0, sh * 14, sh * 7).rot('head', 0, sh * 8, sh * 6).rot('root', 0, sh * 5, 0); ears(P, 8 + sh * 18, -6); arms(P, 0, 20 + sh * 20);
      eyes(P, 'squeeze'); mouth(P, 'wavy');
      P.stream('leaf', 'head', TOP, { rate: 20 * k, dir: [0, 1, 0], speed: 3, spread: 1 }).stream('dust', 'body', [0, 6, 0], { rate: 14 * k, speed: 2, spread: 1 });
    } },
    hurt: { len: 0.8, next: 'idle', f(P, t) {
      const k = seg(t, 0, 0.08, E.out) * (1 - seg(t, 0.25, 0.8, E.inout));
      P.pos('root', 0, 0.5 * k, -2.2 * k).rot('body', -10 * k + wob(t, 0.2, 3, 3, 6), 0, 0).sq('body', -0.1 * k).rot('head', -6 * k, 0, 6 * k);
      ears(P, 14 * k, -16 * k); arms(P, -20 * k, 30 * k); P.blinkOK = false;
      eyes(P, t < 0.45 ? 'squeeze' : 'worried'); mouth(P, t < 0.45 ? 'o' : 'wavy');
      P.burst(0.02, 'leaf', 'head', [0, 24, 6], { n: 6 }).burst(0.06, 'sweat', 'head', [7, TOPY - 1, 4], {});
    } },
    // it sways, totters, and topples over backwards onto its round back, little feet in the air
    faint: { len: 2.4, next: 'down', f(P, t) {
      const tot = seg(t, 0, 0.9) * (1 - seg(t, 1.0, 1.1)), fall = seg(t, 1.0, 1.5, E.bounce);
      P.rot('body', 0, 0, wave(t, 1.4) * 8 * tot).rot('head', 0, 0, wave(t, 1.4, 1) * 6 * tot).rot('root', -80 * fall, 0, 0).pos('root', 0, 9.5 * fall, 4 * fall);
      P.rot('footR', 12 * fall, 0, 0).rot('footL', 12 * fall, 0, 0); ears(P, 26 * fall, 24 * fall); arms(P, 0, 40 * fall);
      eyes(P, t < 1.0 ? 'worried' : 'dizzy'); mouth(P, 'wavy'); P.blinkOK = false; P.lookW = 0;
      P.burst(1.0, 'star', 'head', [0, TOPY + 2, 2], { n: 5 }).burst(1.48, 'dust', 'root', [0, 0, -4], { n: 16 }).burst(1.48, 'leaf', 'sprout', TOP, { n: 8 });
    } },
    down: { len: 3.4, loop: true, f(P, t) {
      const br = Math.sin((t / 3.4) * TAU) * 0.5 + 0.5;
      P.rot('root', -80, 0, 0).pos('root', 0, 9.5, 4).rot('footR', 12 + 10 * bump(t, 0.8, 1.3), 0, 0).rot('footL', 12, 0, 0); ears(P, 26, 24); arms(P, 0, 40);
      P.scl('body', 1, 1, 1 + 0.04 * br);
      eyes(P, 'dizzy'); mouth(P, 'wavy'); P.blinkOK = false; P.lookW = 0; P.breathW = 0.6;
    } },
    // victory: a heavy happy hop, both stubby arms up, a big content grin and a wiggle
    win: { len: 2.4, next: 'idle', f(P, t) {
      const h = hop(t, 1.2, 2.4, { crouch: 1, air: [0.22, 0.6] }), raise = seg(t, 0.2, 0.5, E.back) * (1 - seg(t, 2.0, 2.35));
      if (h.air && t < 1.2) P.pos('root', 0, h.y, 0); else squat(P, t < 1.2 ? h.y : 0); P.sq('body', t < 1.2 ? h.sq * 0.7 : wob(t, 1.2, 0.04, 3, 4));
      arms(P, -20 * raise, 30 + 90 * raise); ears(P, 6 + 8 * Math.sin(t * 10) * raise, -4); P.rot('head', 0, 0, Math.sin(t * 5) * 5 * raise).rot('body', 0, 0, Math.sin(t * 5) * 3 * raise);
      eyes(P, 'happy'); mouth(P, 'grin');
      P.burst(0.6, 'sparkle', 'head', [0, TOPY, 6], { n: 6 }).burst(0.65, 'leaf', 'sprout', TOP, { n: 6 }).burst(1.3, 'heart', 'head', [5, TOPY, 5], {});
    } },
    // fidget: pulls a little cabbage out of nowhere, munches it with big puffy cheeks, pats its belly, content
    munch: { len: 3.0, next: 'idle', f(P, t) {
      const lift = seg(t, 0.05, 0.4, E.back) * (1 - seg(t, 2.0, 2.3)), chew = lift * Math.max(0, Math.sin(t * TAU * 3.2)), pat = bump(t, 2.3, 2.6) + bump(t, 2.6, 2.9);
      P.face('cab', t > 0.08 && t < 2.15 ? 'on' : 'off').scl('cab', 1 - 0.55 * seg(t, 0.6, 2.0), 1 - 0.55 * seg(t, 0.6, 2.0), 1 - 0.55 * seg(t, 0.6, 2.0));
      P.rot('armL', -85 * lift, 0, -26 * lift).rot('armR', -70 * lift - 18 * pat, 0, 22 * lift - 10 + 14 * pat).rot('head', 8 * lift - 4 * chew, 0, 0);
      puff(P, 0.35 * chew + 0.15 * lift); ears(P, 4, 6 * chew); P.scl('body', 1 + 0.02 * pat, 1, 1 + 0.03 * pat);
      eyes(P, 'happy'); mouth(P, lift > 0.2 ? (chew > 0.3 ? 'chew' : 'o') : 'smile');
      for (const k of [0.6, 1.0, 1.4, 1.8]) P.burst(k, 'leaf', 'armL', HAND, { n: 2, speed: 1 });
      P.burst(2.4, 'heart', 'head', [4, TOPY, 6], {});
    } },
    // fidget: a vast slow yawn and a stretch
    yawn: { len: 3.0, next: 'idle', f(P, t) {
      const k = seg(t, 0.2, 0.9, E.inout) * (1 - seg(t, 1.9, 2.5, E.inout)), sh = wob(t, 2.3, 0.04, 3, 5);
      P.rot('head', -12 * k, 0, 4 * k).sq('body', 0.05 * k + sh); arms(P, -50 * k, 40 * k); ears(P, -6 * k, -10 * k);
      P.rot('sprout', -14 * k, 0, 0);
      eyes(P, k > 0.3 ? 'squeeze' : 'calm'); mouth(P, k > 0.3 ? 'yawn' : k > 0.08 ? 'o' : 'smile');
      P.burst(2.5, 'z', 'head', [5, TOPY + 1, 4], {});
    } },
  },
};
def.anim = anim;
