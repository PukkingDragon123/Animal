// Rig renderer: detailed, volumetric pixel-art creatures with fluid animation.
//
// A design is a rig of parts (bones) built from smooth 2D shapes in a nominal
// pixel space (¾ view, facing LEFT, y down). Each frame is rasterized at any
// output scale with 3×3 supersampling (clean, hand-drawn-looking silhouettes),
// then shaded like a painted sprite:
//   · light from the top-left on per-pixel normals (shape volume), 5 hue-shifted
//     tones per material with dithered transitions only along band edges,
//   · soft contact shadows / ambient occlusion where parts overlap,
//   · warm bounce light on undersides, a crisp rim light on the far edge,
//   · gloss highlights, fluffy jagged feather/fur edges, multi-stop gradients
//     (yellow → orange → red flame feathers), flat painted markings,
//   · dark warm selective outline (darker on the shadow side) + inner contours.
// Animation clips are smooth eased poses with squash & stretch and secondary
// motion (feathers, tails, ears lag behind the body), rendered at 24 fps.
//
// shapes: ['ell', cx, cy, rx, ry, col, o] ['circ', cx, cy, r, col, o] ['cap', x1, y1, x2, y2, r1, r2, col, o]
//         ['path', pts, col, o] (pts: [x,y] | [cx,cy,x,y] | [c1x,c1y,c2x,c2y,x,y])  ['curve', pts, r0, r1, col, o]
//         ['line', pts, col] ['dot', x, y, col]
// options: rot, puff, tilt [nx,ny], flat, gloss, glow, paint, sub, line:false, band (−2..2),
//          fluff: { n, amp, from, to } (jagged tufts on an ellipse edge, angles in degrees, 0 = right, 90 = down)
//          grad: [[t, col], ...] with gradA: [x, y], gradB: [x, y] (gradient along A→B in rest space)
// parts: { n, parent, p: [px, py], z, s: [...], show: 'expr' | ['expr', ...] | '!expr', bond, hide, line: false }
// design: { size, anchor, pal, ink, parts, anim, bond, forms, pad: { clip: [l, t, r, b] } }
import { ramp, bayer, mix } from './color.js';
import { Surf, P } from './surface.js';

export const FPS = 24;
const TAU = Math.PI * 2;
const LIGHT = norm([-0.5, -0.78, 0.62]);
function norm(v) { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); }

// ------------------------------------------------------------------ affine helpers
function mul(m, n) { return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]]; }
function inv(m) { const det = m[0] * m[3] - m[1] * m[2] || 1e-9; const a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det; return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])]; }
const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
function bone(px, py, q) {
  const r = ((q.rot || 0) * Math.PI) / 180, cs = Math.cos(r), sn = Math.sin(r), sx = q.sx ?? 1, sy = q.sy ?? 1;
  const a = cs * sx, b = sn * sx, c = -sn * sy, d = cs * sy, ex = px + (q.dx || 0), ey = py + (q.dy || 0);
  return [a, b, c, d, ex - (a * px + c * py), ey - (b * px + d * py)];
}

// ------------------------------------------------------------------ shapes (rest space) → hit(x, y) = [nx, ny, nz, height] | null
function ellHit(cx, cy, rx, ry, rot, puff, fl) {
  const r = (rot * Math.PI) / 180, cs = Math.cos(r), sn = Math.sin(r), m = Math.max(rx, ry) * (1 + (fl ? fl.amp : 0));
  return {
    bb: [cx - m - 1, cy - m - 1, cx + m + 1, cy + m + 1],
    hit(x, y) {
      const dx = x - cx, dy = y - cy, u = (dx * cs + dy * sn) / rx, v = (-dx * sn + dy * cs) / ry;
      let d2 = u * u + v * v;
      if (fl) {
        let a = (Math.atan2(dy, dx) * 180) / Math.PI; if (a < 0) a += 360;
        const lo = fl.from ?? 0, hi = fl.to ?? 360;
        const inArc = lo <= hi ? a >= lo && a <= hi : a >= lo || a <= hi;
        if (inArc) {
          const ph = ((a - lo + 360) % 360) / 360 * (fl.n || 10), t = ph - Math.floor(ph);
          const tri = 1 - Math.abs(t * 2 - 1);                 // 0 at the notch, 1 at the tuft tip
          const k = 1 + fl.amp * (tri * tri) - fl.amp * 0.35;
          d2 /= k * k;
        }
      }
      if (d2 > 1) return null;
      return [u * cs - v * sn, u * sn + v * cs, Math.sqrt(1 - d2) * puff + 0.04, Math.sqrt(1 - d2) * Math.min(rx, ry)];
    },
  };
}
function capHit(x1, y1, x2, y2, r1, r2, puff) {
  const vx = x2 - x1, vy = y2 - y1, ll = vx * vx + vy * vy || 1e-6, m = Math.max(r1, r2);
  return {
    bb: [Math.min(x1, x2) - m - 1, Math.min(y1, y2) - m - 1, Math.max(x1, x2) + m + 1, Math.max(y1, y2) + m + 1],
    hit(x, y) {
      let t = ((x - x1) * vx + (y - y1) * vy) / ll; t = Math.max(0, Math.min(1, t));
      const r = r1 + (r2 - r1) * t, dx = x - (x1 + vx * t), dy = y - (y1 + vy * t), d = Math.hypot(dx, dy);
      if (d > r) return null;
      const k = d / Math.max(0.4, r), rr = Math.max(0.4, r);
      return [dx / rr, dy / rr, Math.sqrt(Math.max(0, 1 - k * k)) * puff + 0.04, Math.sqrt(Math.max(0, 1 - k * k)) * r];
    },
  };
}
function flatten(pts) {
  const out = [[pts[0][0], pts[0][1]]];
  let px = pts[0][0], py = pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const q = pts[i];
    if (q.length === 2) { out.push([q[0], q[1]]); px = q[0]; py = q[1]; continue; }
    for (let k = 1; k <= 10; k++) {
      const t = k / 10, u = 1 - t;
      out.push(q.length === 4 ? [u * u * px + 2 * u * t * q[0] + t * t * q[2], u * u * py + 2 * u * t * q[1] + t * t * q[3]]
        : [u * u * u * px + 3 * u * u * t * q[0] + 3 * u * t * t * q[2] + t * t * t * q[4], u * u * u * py + 3 * u * u * t * q[1] + 3 * u * t * t * q[3] + t * t * t * q[5]]);
    }
    px = q[q.length - 2]; py = q[q.length - 1];
  }
  return out;
}
// inflated volume for any outline (distance field → rounded normals), cached on the shape
function domeOf(s, pts, roundK) {
  if (s._dome) return s._dome;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const R = 0.25, gw = Math.ceil((x1 - x0) / R) + 3, gh = Math.ceil((y1 - y0) / R) + 3, ox = x0 - R, oy = y0 - R;
  const dist = new Float32Array(gw * gh).fill(-1);
  const segs = pts.map((p, i) => [pts[(i + pts.length - 1) % pts.length], p]);
  let D = 0;
  for (let j = 0; j < gh; j++) {
    const y = oy + j * R, xs = [];
    for (const [[xa, ya], [xb, yb]] of segs) if ((ya > y) !== (yb > y)) xs.push(xa + ((y - ya) / (yb - ya)) * (xb - xa));
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let i = Math.max(0, Math.ceil((xs[k] - ox) / R)); i <= Math.min(gw - 1, Math.floor((xs[k + 1] - ox) / R)); i++) {
        const x = ox + i * R;
        let bd = Infinity;
        for (const [[xa, ya], [xb, yb]] of segs) { const vx = xb - xa, vy = yb - ya, l2 = vx * vx + vy * vy || 1e-6; let t = ((x - xa) * vx + (y - ya) * vy) / l2; t = Math.max(0, Math.min(1, t)); bd = Math.min(bd, Math.hypot(x - xa - vx * t, y - ya - vy * t)); }
        dist[j * gw + i] = bd; if (bd > D) D = bd;
      }
    }
  }
  const at = (i, j) => (i < 0 || j < 0 || i >= gw || j >= gh ? -1 : dist[j * gw + i]);
  s._dome = (puff) => ({
    bb: [x0 - 1, y0 - 1, x1 + 1, y1 + 1],
    hit(x, y) {
      const i = Math.round((x - ox) / R), j = Math.round((y - oy) / R), d = at(i, j);
      if (d < 0) return null;
      const gx = Math.max(0, at(i + 2, j)) - Math.max(0, at(i - 2, j)), gy = Math.max(0, at(i, j + 2)) - Math.max(0, at(i, j - 2)), gl = Math.hypot(gx, gy) || 1;
      const t = Math.min(1, d / Math.max(0.6, D * 0.9 * roundK)), k = 1 - t, nz = Math.sqrt(Math.max(0, 1 - k * k));
      return [(-gx / gl) * k, (-gy / gl) * k, nz * puff + 0.04, nz * D];
    },
  });
  return s._dome;
}
function curveHit(pts, r0, r1, puff) {
  const sm = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < 5; k++) { const t = k / 5, t2 = t * t, t3 = t2 * t; sm.push([0, 1].map((a) => 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3))); }
  }
  sm.push(pts[pts.length - 1]);
  const segs = [];
  for (let i = 0; i < sm.length - 1; i++) { const a = i / (sm.length - 1), b = (i + 1) / (sm.length - 1); segs.push(capHit(sm[i][0], sm[i][1], sm[i + 1][0], sm[i + 1][1], r0 + (r1 - r0) * a, r0 + (r1 - r0) * b, puff)); }
  let bb = [Infinity, Infinity, -Infinity, -Infinity];
  for (const s of segs) bb = [Math.min(bb[0], s.bb[0]), Math.min(bb[1], s.bb[1]), Math.max(bb[2], s.bb[2]), Math.max(bb[3], s.bb[3])];
  return { bb, hit(x, y) { let best = null; for (const s of segs) { const r = s.hit(x, y); if (r && (!best || r[3] > best[3])) best = r; } return best; } };
}
function shapeOf(s) {
  const o = (typeof s[s.length - 1] === 'object' && !Array.isArray(s[s.length - 1])) ? s[s.length - 1] : {};
  const puff = o.puff ?? 1;
  switch (s[0]) {
    case 'ell': return { o, col: s[5], h: ellHit(s[1], s[2], s[3], s[4], o.rot || 0, puff, o.fluff) };
    case 'circ': return { o, col: s[4], h: ellHit(s[1], s[2], s[3], s[3], 0, puff, o.fluff) };
    case 'cap': return { o, col: s[7], h: capHit(s[1], s[2], s[3], s[4], s[5], s[6], puff) };
    case 'curve': return { o, col: s[4], h: curveHit(s[1], s[2], s[3], puff) };
    case 'path': { const pts = s._flat || (s._flat = flatten(s[1])); return { o, col: s[2], h: domeOf(s, pts, o.round ?? 1)(puff) }; }
    default: return null;
  }
}

// ------------------------------------------------------------------ eased animation
const ease = (t) => t * t * (3 - 2 * t);
const W = (t) => Math.sin(t * TAU);
// keyframe interpolation over [t, value] pairs with smoothstep easing (t in 0..1)
function kf(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [ta, va] = keys[i - 1], [tb, vb] = keys[i]; return va + (vb - va) * ease((t - ta) / (tb - ta || 1)); }
  return keys[keys.length - 1][1];
}
// clip lengths in frames at 24 fps
export const CLIPS = { idle: 48, walk: 16, run: 12, attack: 14, breath: 24, dash: 16, throw: 18, cast: 16, hurt: 10, faint: 24, buff: 24, happy: 20, sleep: 48, eat: 36 };
const LOOP = { idle: true, walk: true, run: true, happy: true, sleep: true, buff: true };
export const isLoop = (c) => !!LOOP[c];

// pose(design, clip, t) → { bone: {rot, dx, dy, sx, sy}, __expr, __mouth, __show: Set }
function pose(d, clip, t) {
  const A = Object.assign({ bob: 1, sway: 1, flap: 1, hop: 1, lean: 1, lag: 1 }, d.anim || {});
  const o = {}, B = (n, q) => { const c = o[n] || (o[n] = {}); for (const k in q) c[k] = k === 'sx' || k === 'sy' ? (c[k] ?? 1) * q[k] : (c[k] || 0) + q[k]; };
  const names = d._bones;
  const each = (re, fn) => { for (const n of names) if (re.test(n)) fn(n); };
  o.__show = new Set();
  const breathe = (tt, k = 1) => {
    const b = W(tt);
    B('body', { dy: -0.6 * b * A.bob * k, sy: 1 + 0.018 * b * k, sx: 1 - 0.012 * b * k });
    if (names.has('head')) B('head', { dy: -0.4 * W(tt - 0.08) * A.bob * k, rot: 1.2 * W(tt * 0.5) * A.sway });
    each(/^(crest|hair|flame|tuft)/, (n) => B(n, { rot: 3.5 * W(tt - 0.15 * A.lag) * A.sway * k, sy: 1 + 0.03 * W(tt * 2 - 0.2) }));
    each(/^tail/, (n) => B(n, { rot: 4 * W(tt - 0.2 * A.lag) * A.sway * k }));
    each(/^wing/, (n) => B(n, { rot: (n.endsWith('L') ? -1 : 1) * 3 * W(tt - 0.1) * A.flap * k }));
    each(/^ear/, (n) => B(n, { rot: (n.endsWith('L') ? -1 : 1) * 3 * W(tt - 0.18) }));
  };
  // flickering flame parts that grow out of their base (g = 0 hidden … 1 full)
  const fire = (re, g, tt) => { let k = 0; each(re, (n) => { k++; B(n, { sx: Math.max(0.05, g) * (1 + 0.08 * W(tt * 9 + k * 0.37)), sy: 1 + 0.14 * W(tt * 13 + k * 0.61) }); }); };
  // looping rising particles (hearts, Zs, steam): phase offset per part
  const rise = (re, tt, dy, dx = 0, s0 = 0.5, s1 = 1.1) => { let k = 0, cnt = 0; each(re, () => cnt++); each(re, (n) => { const ph = (tt + k++ / cnt) % 1, sc2 = s0 + (s1 - s0) * ph; B(n, { dy: -dy * ph, dx: dx * ph, sx: sc2, sy: sc2 }); }); };
  switch (clip) {
    case 'idle': {
      breathe(t * 2);
      // blink twice per loop, quick
      const bl = (x) => Math.abs(t - x) < 0.022;
      if (bl(0.3) || bl(0.82)) o.__expr = 'closed';
      // a little look-around
      if (names.has('head')) B('head', { rot: kf([[0, 0], [0.45, 0], [0.52, -4], [0.66, -4], [0.72, 0], [1, 0]], t) });
      break;
    }
    case 'walk': case 'run': {
      const run = clip === 'run', s = t * TAU;
      const hop = Math.abs(Math.sin(s)) * (run ? 3.2 : 1.6) * A.hop;
      B('body', { dy: -hop, rot: (run ? -7 : -2) * A.lean, sy: 1 + 0.05 * Math.cos(2 * s) * (run ? 1 : 0.5), sx: 1 - 0.03 * Math.cos(2 * s) });
      if (names.has('head')) B('head', { rot: (run ? -4 : 0) + 2 * Math.sin(2 * s - 0.6), dy: 0.6 * Math.sin(2 * s - 0.6) });
      each(/^leg/, (n) => { const side = n.endsWith('L') ? 0 : Math.PI; B(n, { rot: (run ? 34 : 22) * Math.sin(s + side), dy: -Math.max(0, Math.sin(s + side)) * (run ? 2 : 1) }); });
      each(/^wing/, (n) => B(n, { rot: (n.endsWith('L') ? -1 : 1) * (run ? 22 : 8) * Math.sin(2 * s) * A.flap }));
      each(/^(crest|hair|flame|tuft)/, (n) => B(n, { rot: (run ? 8 : 4) + 4 * Math.sin(2 * s - 1.2 * A.lag) }));
      each(/^tail/, (n) => B(n, { rot: 6 * Math.sin(2 * s - 1.4 * A.lag) }));
      break;
    }
    case 'attack': {      // peck / strike: anticipation → snap → recover
      const lean = kf([[0, 0], [0.3, 9], [0.42, -16], [0.6, -14], [1, 0]], t), dx = kf([[0, 0], [0.3, 3], [0.42, -8], [0.6, -7], [1, 0]], t);
      B('body', { rot: lean * A.lean, dx, sy: kf([[0, 1], [0.3, 0.92], [0.42, 1.06], [0.7, 1], [1, 1]], t), sx: kf([[0, 1], [0.3, 1.06], [0.42, 0.95], [0.7, 1], [1, 1]], t) });
      if (names.has('head')) B('head', { rot: kf([[0, 0], [0.3, 6], [0.42, -14], [0.65, -10], [1, 0]], t) });
      each(/^(crest|hair|flame|tuft)/, (n) => B(n, { rot: kf([[0, 0], [0.32, -8], [0.5, 16], [0.75, -4], [1, 0]], t) }));
      each(/^wing/, (n) => B(n, { rot: (n.endsWith('L') ? -1 : 1) * kf([[0, 0], [0.3, 30], [0.45, -20], [1, 0]], t) }));
      if (t > 0.38 && t < 0.62) { o.__mouth = 'open'; o.__expr = 'fierce'; }
      break;
    }
    case 'breath': {      // inhale, then a long fire breath
      const inh = kf([[0, 0], [0.25, 1], [0.32, 0], [1, 0]], t), blow = t > 0.3 && t < 0.92;
      B('body', { sy: 1 + 0.07 * inh - (blow ? 0.03 : 0), sx: 1 - 0.04 * inh + (blow ? 0.03 : 0), rot: kf([[0, 0], [0.25, 7], [0.34, -8], [0.9, -6], [1, 0]], t), dx: blow ? -2 + 0.6 * W(t * 12) : 0 });
      if (names.has('head')) B('head', { rot: kf([[0, 0], [0.25, 8], [0.34, -6], [0.9, -5], [1, 0]], t) + (blow ? 1.2 * W(t * 16) : 0) });
      each(/^(crest|hair|flame|tuft)/, (n) => B(n, { rot: (blow ? 10 + 5 * W(t * 10) : 0), sy: blow ? 1.08 : 1 }));
      o.__mouth = blow ? 'open' : null; o.__expr = blow ? 'teary' : inh > 0.3 ? 'closed' : null;
      if (blow) o.__show.add('fire');
      fire(/^fire/, kf([[0.3, 0.12], [0.42, 1], [0.84, 1], [0.92, 0.15]], t), t);
      break;
    }
    case 'dash': {
      const k = kf([[0, 0], [0.2, 1], [0.8, 1], [1, 0]], t);
      B('body', { rot: -18 * k * A.lean, sx: 1 + 0.12 * k, sy: 1 - 0.1 * k, dy: -1.5 * k * Math.abs(W(t * 3)) });
      each(/^(crest|hair|flame|tuft|tail)/, (n) => B(n, { rot: 24 * k, sx: 1 + 0.15 * k }));
      each(/^wing/, (n) => B(n, { rot: (n.endsWith('L') ? -1 : 1) * -35 * k }));
      each(/^leg/, (n) => B(n, { rot: (n.endsWith('L') ? 1 : -1) * 30 * W(t * 4) }));
      o.__expr = 'fierce';
      if (k > 0.5) o.__show.add('dashfire');
      fire(/^dashfire/, kf([[0.15, 0.2], [0.3, 1], [0.8, 1], [0.95, 0.3]], t), t * 2);
      break;
    }
    case 'throw': case 'cast': {
      const k = kf([[0, 0], [0.35, 1], [0.5, -0.6], [0.7, -0.5], [1, 0]], t);
      B('body', { rot: 8 * k, dy: -2 * Math.max(0, -k), sy: 1 - 0.04 * k });
      each(/^wing/, (n) => B(n, { rot: (n.endsWith('R') ? 1 : 0.4) * 70 * k }));
      if (names.has('head')) B('head', { rot: 5 * k });
      if (clip === 'throw' && t < 0.48) o.__show.add('chiliHand');
      if (clip === 'throw' && t >= 0.48) { const u = (t - 0.48) / 0.52; o.__show.add('chiliFly'); B('chiliFly', { dx: -78 * u, dy: -12 * Math.sin(u * Math.PI), rot: -540 * u }); }
      if (clip === 'cast') { o.__show.add('fire'); fire(/^fire/, kf([[0.35, 0], [0.5, 0.45], [0.75, 0.4], [0.9, 0]], t), t); }
      o.__mouth = k < 0 ? 'open' : null;
      break;
    }
    case 'hurt': {
      const k = kf([[0, 1], [0.4, 0.7], [1, 0]], t);
      B('body', { dx: 4 * k, rot: 12 * k, sx: 1 - 0.08 * k, sy: 1 + 0.06 * k });
      if (names.has('head')) B('head', { rot: 8 * k });
      each(/^(crest|hair|flame|tuft|tail)/, (n) => B(n, { rot: -14 * k }));
      o.__expr = 'hurt'; o.__mouth = 'open';
      break;
    }
    case 'faint': {
      const k = kf([[0, 0], [0.5, 1], [1, 1]], t), bounce = kf([[0, 0], [0.5, 0], [0.62, -2], [0.75, 0], [1, 0]], t);
      B('body', { rot: 84 * k, dy: 8 * k + bounce, dx: 6 * k, sy: 1 - 0.08 * k });
      each(/^(crest|hair|flame|tuft)/, (n) => B(n, { rot: -10 * k, sy: 1 - 0.2 * k }));
      o.__expr = 'ko';
      break;
    }
    case 'buff': {
      breathe(t * 4, 1.6);
      B('body', { dy: -1.2 * Math.abs(W(t * 2)), sy: 1.04 });
      each(/^(crest|hair|flame|tuft)/, (n) => B(n, { sy: 1.15 + 0.06 * W(t * 4), rot: 3 * W(t * 4) }));
      o.__expr = 'fierce'; o.__show.add('aura');
      fire(/^aura/, 0.85 + 0.15 * Math.abs(W(t * 2)), t * 2);
      break;
    }
    case 'happy': {
      const h = Math.abs(W(t));
      B('body', { dy: -5 * h, sy: 1 + 0.08 * (1 - h) * (h < 0.2 ? 1 : 0) + 0.04 * h, sx: 1 - 0.03 * h });
      each(/^wing/, (n) => B(n, { rot: (n.endsWith('L') ? -1 : 1) * 40 * h }));
      each(/^(crest|hair|flame|tuft)/, (n) => B(n, { rot: 6 * W(t * 2 - 0.2) }));
      o.__expr = 'happy'; o.__mouth = 'open'; o.__show.add('hearts');
      rise(/^heart/, t, 14, 0, 0.5, 1.1);
      break;
    }
    case 'sleep': {
      const b = W(t);
      B('body', { dy: 6 + 0.6 * b, sy: 0.86 + 0.02 * b, sx: 1.06 - 0.01 * b, rot: -4 });
      if (names.has('head')) B('head', { dy: 3, rot: -6 + 2 * b });
      each(/^(crest|hair|flame|tuft)/, (n) => B(n, { rot: -10, sy: 0.9 }));
      each(/^leg/, (n) => B(n, { sy: 0.3, dy: -2 }));
      o.__expr = 'closed'; o.__show.add('zz');
      rise(/^zz/, t, 20, 9, 0.45, 1.15);
      break;
    }
    case 'eat': {         // bring a chili up, chomp it down, the heat hits: tears, steam, a burst of fire
      const lift = kf([[0, 0], [0.14, 1], [0.2, 0], [1, 0]], t);
      const chew = t > 0.2 && t < 0.6 ? Math.abs(W(t * 7)) : 0;
      const gulp = kf([[0, 0], [0.6, 0], [0.64, 1], [0.7, 0], [1, 0]], t);
      const heat = kf([[0, 0], [0.66, 0], [0.74, 1], [1, 1]], t);
      if (t < 0.17) o.__show.add('chiliHand');
      else if (t < 0.6) { o.__show.add('chili'); B('chili', { sx: kf([[0.17, 1], [0.6, 0.12]], t), rot: -6 * chew }); }
      B('body', { sy: 1 - 0.03 * chew - 0.06 * gulp + 0.04 * heat * Math.abs(W(t * 10)), sx: 1 + 0.04 * gulp, dy: -2.5 * heat * Math.abs(W(t * 6)) });
      if (names.has('head')) B('head', { rot: 8 * lift - 5 * chew + 6 * gulp + heat * 4 * W(t * 12), dy: 1.5 * gulp });
      each(/^wing/, (n) => B(n, { rot: (n.endsWith('R') ? 1 : 0.3) * (heat > 0.3 ? 70 * Math.abs(W(t * 8)) : 55 * lift) }));
      each(/^(crest|hair|flame|tuft)/, (n) => B(n, { sy: 1 + 0.3 * heat, rot: 6 * heat * W(t * 10) }));
      o.__mouth = chew > 0.5 || heat > 0.5 ? 'open' : null;
      o.__expr = heat > 0.4 ? 'teary' : chew || gulp > 0.3 ? 'closed' : null;
      if (heat > 0.4) { o.__show.add('tears'); o.__show.add('steam'); rise(/^steam/, t * 3, 9, 0, 0.5, 1.3); }
      if (t > 0.8 && t < 0.97) { o.__show.add('fire'); fire(/^fire/, kf([[0.8, 0.1], [0.85, 0.42], [0.92, 0.38], [0.97, 0.05]], t), t); }
      break;
    }
    default: breathe(t * 2);
  }
  return o;
}

// ------------------------------------------------------------------ design prep
function prep(d, form) {
  const key = form || '';
  d._prep = d._prep || {};
  if (d._prep[key]) return d._prep[key];
  let dd = d;
  if (form && d.forms && d.forms[form]) { const F = d.forms[form]; dd = Object.assign({}, d, { pal: Object.assign({}, d.pal, F.pal), parts: [...d.parts, ...(F.parts || [])] }); }
  const parts = dd.parts.map((p, i) => Object.assign({ idx: i, z: p.z ?? 0 }, p));
  const byName = new Map(parts.map((p) => [p.n, p]));
  const draw = [...parts].sort((a, b) => a.z - b.z || a.idx - b.idx);
  draw.forEach((p, i) => { p.order = i + 1; });
  d._bones = new Set(parts.map((p) => p.n));
  const cols = new Map();
  const colOf = (c) => { const hex = (dd.pal && dd.pal[c]) || c; let e = cols.get(hex); if (!e) { e = { idx: cols.size, hex, ramp: ramp(hex) }; cols.set(hex, e); } return e; };
  const out = { dd, parts, byName, draw, colOf, cols };
  d._prep[key] = out;
  return out;
}
function visible(p, expr, show, bonded) {
  if (p.hide || (p.bond && !bonded)) return false;
  if (p.show == null) return true;
  const list = Array.isArray(p.show) ? p.show : [p.show];
  return list.some((s) => (s[0] === '!' ? !(s.slice(1) === expr || show.has(s.slice(1))) : s === expr || show.has(s) || (s === 'open' && !expr)));
}

// ------------------------------------------------------------------ render one frame
// opts: { clip, frame, scale, expr, bonded, form, flip, light }
export function renderFrame(d, opts = {}) {
  const pr = prep(d, opts.form);
  const dd = pr.dd, sc = opts.scale || 1;
  const clip = opts.clip || 'idle', n = CLIPS[clip] || 24, fi = ((opts.frame || 0) % n + n) % n;
  const po = pose(d, clip, fi / n);
  const expr = opts.expr || po.__expr || null, mouth = po.__mouth || null;
  const show = new Set(po.__show); if (mouth) show.add('mouth:' + mouth); else show.add('mouth:closed');
  if (opts.show) for (const s of opts.show) show.add(s);
  // some clips reach past the frame (fire breath, thrown props): pad = [left, top, right, bottom]
  const pad = (dd.pad && dd.pad[clip]) || [0, 0, 0, 0];
  const w = Math.round((dd.size[0] + pad[0] + pad[2]) * sc), h = Math.round((dd.size[1] + pad[1] + pad[3]) * sc), N = w * h;
  const S = [sc, 0, 0, sc, pad[0] * sc, pad[1] * sc];
  const M = new Map();
  const grow = opts.bonded && dd.bond && dd.bond.grow;
  const worldOf = (p) => {
    if (M.has(p.n)) return M.get(p.n);
    const q = Object.assign({}, po[p.n] || {});
    if (grow && grow[p.n]) { q.sx = (q.sx ?? 1) * grow[p.n]; q.sy = (q.sy ?? 1) * grow[p.n]; }
    const par = p.parent && pr.byName.get(p.parent);
    const m = mul(par ? worldOf(par) : S, bone(p.p[0], p.p[1], q));
    M.set(p.n, m);
    return m;
  };
  const gCol = new Int16Array(N).fill(-1), gPart = new Int16Array(N), gFlag = new Uint8Array(N), gBand = new Int8Array(N), gH = new Float32Array(N);
  const gNx = new Float32Array(N), gNy = new Float32Array(N), gNz = new Float32Array(N);
  const FLAT = 1, GLOSS = 2, GLOW = 4, NOLINE = 8;
  const details = [];
  const SS = [-1 / 3, 0, 1 / 3];
  for (const p of pr.draw) {
    if (!visible(p, expr, show, opts.bonded)) continue;
    const m = worldOf(p), mi = inv(m);
    const rc = Math.hypot(m[0], m[1]) || 1, cs = m[0] / rc, sn = m[1] / rc;
    for (const s of p.s || []) {
      if (s[0] === 'line' || s[0] === 'dot') { details.push([s, m]); continue; }
      const sh = shapeOf(s); if (!sh) continue;
      const o = sh.o, h0 = sh.h;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [bx, by] of [[h0.bb[0], h0.bb[1]], [h0.bb[2], h0.bb[1]], [h0.bb[0], h0.bb[3]], [h0.bb[2], h0.bb[3]]]) { const [X, Y] = ap(m, bx, by); x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y); }
      x0 = Math.max(0, Math.floor(x0) - 1); y0 = Math.max(0, Math.floor(y0) - 1); x1 = Math.min(w - 1, Math.ceil(x1) + 1); y1 = Math.min(h - 1, Math.ceil(y1) + 1);
      const col = o.sub ? null : pr.colOf(sh.col);
      const stops = o.grad ? o.grad.map(([t, c]) => [t, pr.colOf(c).idx]) : null;
      const gA = o.gradA, gB = o.gradB, gv = gA ? [gB[0] - gA[0], gB[1] - gA[1]] : null, gl2 = gv ? gv[0] * gv[0] + gv[1] * gv[1] || 1 : 1;
      const flags = (o.flat ? FLAT : 0) | (o.gloss ? GLOSS : 0) | (o.glow ? GLOW : 0) | (o.line === false || p.line === false ? NOLINE : 0);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        let hits = 0, nx = 0, ny = 0, nz = 0, hh = 0, rx0 = 0, ry0 = 0;
        for (const a of SS) for (const b of SS) {
          const [rx, ry] = ap(mi, x + 0.5 + a, y + 0.5 + b);
          const r = h0.hit(rx, ry);
          if (!r) continue;
          hits++; nx += r[0]; ny += r[1]; nz += r[2]; hh += r[3]; rx0 += rx; ry0 += ry;
        }
        if (hits < 4) continue;
        const i = y * w + x;
        if (o.sub) { if (gPart[i] === p.order || o.subAll) gCol[i] = -1; continue; }
        if (o.paint && (gCol[i] < 0 || gPart[i] !== p.order)) continue;
        let ci = col.idx;
        if (stops) {
          const px2 = rx0 / hits, py2 = ry0 / hits;
          let t = ((px2 - gA[0]) * gv[0] + (py2 - gA[1]) * gv[1]) / gl2;
          for (let k = stops.length - 1; k >= 0; k--) { const edge = stops[k][0] + (bayer(x, y) - 0.5) * 0.03; if (t >= edge) { ci = stops[k][1]; break; } if (k === 0) ci = stops[0][1]; }
        }
        hh /= hits;
        if (!o.paint && gCol[i] === ci && gPart[i] === p.order && gH[i] > hh) continue;   // same surface: keep the higher one
        gCol[i] = ci; gBand[i] = o.band || 0;
        if (o.paint) { if (o.glow) gFlag[i] |= GLOW; if (o.flat) gFlag[i] |= FLAT; continue; }
        let qx = nx / hits, qy = ny / hits, qz = nz / hits;
        if (o.tilt) { qx += o.tilt[0]; qy += o.tilt[1]; }
        const wx = qx * cs - qy * sn, wy = qx * sn + qy * cs, l = Math.hypot(wx, wy, qz) || 1;
        gNx[i] = wx / l; gNy[i] = wy / l; gNz[i] = qz / l; gPart[i] = p.order; gFlag[i] = flags; gH[i] = hh;
      }
    }
  }
  // ---- shading
  const cl = [...pr.cols.values()];
  const L = opts.light ? norm(opts.light) : LIGHT;
  const surf = new Surf(w, h), out = surf.data;
  const band = new Int8Array(N);
  const empty = (x, y) => x < 0 || y < 0 || x >= w || y >= h || gCol[y * w + x] < 0;
  const aoR = Math.max(1, Math.round(1.5 * sc));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (gCol[i] < 0) continue;
    const f = gFlag[i];
    if (f & GLOW) { const z = gNz[i] + (bayer(x, y) - 0.5) * 0.12; band[i] = z > 0.82 ? 11 : z > 0.42 ? 10 : 9; continue; }
    if (f & FLAT) { band[i] = 3; continue; }
    let l = gNx[i] * L[0] + gNy[i] * L[1] + gNz[i] * L[2];
    // contact shadow from parts in front, toward the light
    let occ = 0;
    for (let k = 1; k <= aoR + 1; k++) { const X = x - k, Y = y - k * 2; if (X < 0 || Y < 0) break; const j = Y * w + X; if (gCol[j] >= 0 && gPart[j] > gPart[i] && !(gFlag[j] & NOLINE)) { occ = 1 - (k - 1) / (aoR + 1); break; } }
    l -= 0.38 * occ;
    if (gNy[i] > 0.45) l += 0.1;                                          // warm bounce from below
    if ((empty(x + 1, y) || empty(x, y + 1)) && gNx[i] > 0.25) l += 0.28; // rim light on the far edge
    if ((f & GLOSS) && l > 0.9) { band[i] = 5; continue; }
    const th = [-0.12, 0.18, 0.5, 0.82];
    const dz = (bayer(x, y) - 0.5) * 0.05;
    let b = 1; for (const tq of th) if (l + dz > tq) b++;
    band[i] = Math.min(5, b);
  }
  // cleanup: lone pixels take the surrounding band
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x; if (gCol[i] < 0 || band[i] >= 5) continue;
    const nb = [i - 1, i + 1, i - w, i + w].filter((k) => gCol[k] === gCol[i]);
    if (nb.length === 4 && nb.every((k) => band[k] !== band[i])) { const c2 = {}; for (const k of nb) c2[band[k]] = (c2[band[k]] || 0) + 1; band[i] = +Object.entries(c2).sort((a, b) => b[1] - a[1])[0][0]; }
  }
  const glowPx = [];
  for (let i = 0; i < N; i++) {
    const ci = gCol[i]; if (ci < 0) continue;
    const R = cl[ci].ramp;
    if (band[i] >= 9) { out[i] = P(R[band[i] - 7]); glowPx.push(i); continue; }   // glowing: saturated edge → hot centre
    out[i] = P(R[Math.max(1, Math.min(5, band[i] + gBand[i]))]);
  }
  // inner contours: the front part's edge against a part behind
  const inkHex = dd.ink || '#2a1618';
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, ci = gCol[i]; if (ci < 0 || (gFlag[i] & (NOLINE | GLOW))) continue;
    let e = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const j = Y * w + X; if (gCol[j] >= 0 && gPart[j] < gPart[i] && !(gFlag[j] & NOLINE)) { e = dx > 0 || dy > 0 ? 2 : 1; break; } }
    if (e) out[i] = P(e === 2 ? mix(cl[ci].ramp[1], cl[ci].ramp[0], 0.6) : cl[ci].ramp[1]);
  }
  // details (1-px lines, dots)
  for (const [s, m] of details) {
    const hex = (dd.pal && dd.pal[s[s[0] === 'dot' ? 3 : 2]]) || s[s[0] === 'dot' ? 3 : 2];
    if (s[0] === 'dot') { const [X, Y] = ap(m, s[1], s[2]); surf.px(X, Y, hex); }
    else { const pts = s[1].map(([a, b]) => ap(m, a, b)); for (let k = 1; k < pts.length; k++) surf.line(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], hex); }
  }
  // silhouette outline: dark warm ink, softer on the lit (top/left) side
  const rampOf = new Map();
  for (const C of cl) for (let k = 1; k < 6; k++) rampOf.set(P(C.ramp[k]), C.ramp);
  const src = surf.data, dst = new Uint32Array(src);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (src[i] >>> 24) continue;
    let nb = 0, lit = false;
    const t = (X, Y, l) => { if (nb || X < 0 || Y < 0 || X >= w || Y >= h) return; const v = src[Y * w + X]; if (v >>> 24) { nb = v; lit = l; } };
    t(x, y + 1, true); t(x + 1, y, true); t(x - 1, y, false); t(x, y - 1, false);
    if (!nb) continue;
    const R = rampOf.get(nb);
    dst[i] = P(R ? mix(R[0], inkHex, lit ? 0.35 : 0.7) : inkHex);
  }
  surf.data = dst; surf.touch();
  surf.glow = glowPx;
  // ox/oy: where the nominal frame's top-left sits inside a padded surface
  surf.ox = Math.round(pad[0] * sc); surf.oy = Math.round(pad[1] * sc);
  if (opts.flip) { const f = new Surf(w, h); f.blit(surf, 0, 0, true); f.glow = glowPx.map((i) => i - (i % w) + (w - 1 - (i % w))); f.ox = Math.round(pad[2] * sc); f.oy = surf.oy; return f; }
  return surf;
}

// ------------------------------------------------------------------ cache + player
const cache = new Map();
let uid = 0;
export function frames(d, clip = 'idle', opts = {}) {
  if (!d._uid) d._uid = 'r' + (++uid);
  const key = [d._uid, clip, opts.scale || 1, opts.form || '', opts.bonded ? 1 : 0, opts.expr || '', opts.flip ? 1 : 0, (opts.show || []).join(',')].join('|');
  let f = cache.get(key);
  if (!f) { f = []; for (let i = 0; i < (CLIPS[clip] || 24); i++) f.push(renderFrame(d, Object.assign({}, opts, { clip, frame: i }))); cache.set(key, f); }
  return f;
}
export class RigPlayer {
  constructor(d, opts = {}) { this.d = d; this.opts = Object.assign({}, opts); this.clip = 'idle'; this.t = 0; this.frame = 0; this.base = 'idle'; this.queue = null; this.done = false; }
  play(clip, { then = null, restart = true } = {}) { if (!CLIPS[clip]) clip = 'idle'; if (this.clip === clip && !restart) return; this.clip = clip; this.t = 0; this.frame = 0; this.queue = then; this.done = false; }
  setBase(c) { this.base = c; if (isLoop(this.clip)) this.play(c, { restart: false }); }
  update(dt) {
    this.t += dt;
    const n = CLIPS[this.clip] || 24, step = 1 / FPS;
    while (this.t >= step) {
      this.t -= step;
      if (this.frame < n - 1) this.frame++;
      else if (isLoop(this.clip)) this.frame = 0;
      else if (this.clip === 'faint' || this.clip === 'sleep') this.done = true;
      else { this.done = true; this.clip = this.queue || this.base; this.queue = null; this.frame = 0; }
    }
  }
  current() { return frames(this.d, this.clip, this.opts)[this.frame]; }
}
