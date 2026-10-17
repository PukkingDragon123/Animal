// 2D pixel-art sprites for Tokonmon (and anything else that animates).
//
// A design is a small rig of PARTS (bones) made of 2D SHAPES drawn in pixel
// coordinates (¾ view, facing LEFT, y down). Every frame the shapes are
// rasterized at pixel resolution with no anti-aliasing, then:
//   · cel-shaded from a light at the top-left (shape "volume" → normals → 3–4
//     hue-shifted bands from the colour's ramp, optional dithered transitions),
//   · contact-shaded where a front part overlaps a back part,
//   · rim-lit on the back edge, glossy highlights where asked,
//   · inner contour lines where parts overlap (soft selout), and a 1-px
//     coloured outline around the silhouette (darkest step of the local ramp),
//   · eyes/mouths stamped from pixel templates (blink/expressions per frame).
// Animation: named clips (idle, move, attack, cast, hurt, faint, happy…) of
// stepped poses at 12 fps, generated per archetype from bone names.
//
// design = {
//   id, size: [w, h], anchor: [ax, ay] (ground point), pal: { key: '#hex' },
//   parts: [{ n, parent?, p: [px, py] (pivot), z?: draw order, s: [shapes], bond?: true, hide?: true }],
//   eyes: [{ part, x, y, style, iris, far?: true, flip?: false }], mouth: { part, x, y, style },
//   anim: { arch: 'biped'|'quad'|'bird'|'floater'|'blob'|'fish'|'serpent', bob, sway, flap, hop, lean, speed },
//   bond: { grow: { part: scale }, aura: 'flame'|'bubbles'|'petals'|'sparks'|'notes'|'leaves', auraColor },
//   forms: { elemental: { pal: {...}, parts: [...], eyes?, glow? } },
//   fx: [{ part, x, y, type, rate, color }]   (particles the scene emits: flame, steam, tear, bubble, spark, petal, note, ember, drip)
// }
// shapes (rest-pose pixel coords):
//   ['ell', cx, cy, rx, ry, col, o]       ['circ', cx, cy, r, col, o]        ['rect', x, y, w, h, col, o]
//   ['cap', x1, y1, x2, y2, r1, r2, col, o]  (tapered capsule)                 ['poly', [[x,y],...], col, o]
//   ['tri', x1, y1, x2, y2, x3, y3, col, o]   ['curve', [[x,y],...], r0, r1, col, o]  (tapered stroke)
//   ['line', [[x,y],...], col]  ['dot', x, y, col]   (1-px details drawn after shading)
// shape options o: { rot (deg, ell/rect), puff (0..1.5 roundness), tilt: [nx, ny], flat, gloss, glow, noise,
//   dither, paint (recolour this part's pixels only), sub (erase), line: false (no contour vs. others),
//   grad: [col2, 'x'|'y', from, to], band: shift (−2..2 force darker/lighter) }
import { ramp, rgb, bayer, mix } from './color.js';
import { Surf, P, noise2 } from './surface.js';

const TAU = Math.PI * 2;
export const FPS = 12;
let LIGHT = norm3([-0.55, -0.75, 0.62]);
function norm3(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

// ------------------------------------------------------------------ 2D affine
// m = [a, b, c, d, e, f]: x' = a x + c y + e ; y' = b x + d y + f
const I = [1, 0, 0, 1, 0, 0];
function mul(m, n) { return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]]; }
function inv(m) { const det = m[0] * m[3] - m[1] * m[2] || 1e-9; const a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det; return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])]; }
const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
function boneMatrix(px, py, pose) {
  const r = ((pose.rot || 0) * Math.PI) / 180, cs = Math.cos(r), sn = Math.sin(r), sx = pose.sx ?? 1, sy = pose.sy ?? 1;
  // T(p + d) · R · S · T(−p)
  const a = cs * sx, b = sn * sx, c = -sn * sy, d = cs * sy;
  const ex = px + (pose.dx || 0), ey = py + (pose.dy || 0);
  return [a, b, c, d, ex - (a * px + c * py), ey - (b * px + d * py)];
}

// ------------------------------------------------------------------ eye & mouth pixel templates
// k outline · s sclera · i iris · I iris dark · p pupil · w highlight · l lid/lash · m mouth dark · t tongue · f fang
const EYES = {
  anime: ['.kkk.', 'kIIIk', 'kwpik', 'kppik', 'kiiwk', '.kkk.'],
  big: ['.kkkk.', 'kIIIIk', 'kwwpik', 'kwppik', 'kipppk', 'kiiiwk', '.kkkk.'],
  round: ['.kk.', 'kwpk', 'kppk', '.kk.'],
  bead: ['kk', 'kw', 'kk'],
  dot: ['k', 'k'],
  sharp: ['kkkkk', 'kwpIk', '.kkik', '..kk.'],
  fierce: ['kk...', 'kkkkk', 'kwpik', '.kkkk'],
  sleepy: ['.....', 'kkkkk', 'kiwik', '.kkk.'],
  cute: ['.kkk.', 'kwwpk', 'kwppk', 'kpppk', '.kkk.'],
  star: ['..k..', '.kwk.', 'kwiik', '.kik.', 'k.k.k'],
  closed: ['.....', '.....', 'kkkkk', '.....'],
  happy: ['.....', '.kkk.', 'k...k', '.....'],
  hurt: ['k...k', '.k.k.', '..k..', '.k.k.'],
  ko: ['k...k', '.k.k.', '..k..', '.k.k.', 'k...k'],
  angry: ['kk...', '.kkkk', 'kwpik', '.kkk.'],
  sad: ['...kk', 'kkkk.', 'kwpik', '.kkk.'],
};
const MOUTHS = {
  smile: ['k...k', '.kkk.'], open: ['.kkk.', 'kmmmk', 'kmtmk', '.kkk.'], fang: ['kkkkk', '.fk.f', '..k..'],
  grin: ['kkkkk', 'kfffk', '.kkk.'], w: ['k.k.k', '.k.k.'], cat: ['k.k.k', '.k.k.'], tiny: ['kk'], line: ['kkk'],
  frown: ['.kkk.', 'k...k'], shout: ['.kkk.', 'kmmmk', 'kmmmk', 'kmtmk', '.kkk.'], none: [],
};
export const EYE_STYLES = Object.keys(EYES);

// ------------------------------------------------------------------ animation (stepped poses per archetype)
export const CLIPS = { idle: 8, move: 6, attack: 6, cast: 6, hurt: 3, faint: 6, happy: 6, special: 8 };
const LOOP = { idle: true, move: true, happy: true, special: true };
const W = (t) => Math.sin(t * TAU);
// pose(design, clip, t (0..1), i (frame), n) → { boneName: { rot, dx, dy, sx, sy } , __eyes: style, __glow }
function pose(design, clip, t, fi, n) {
  const A = Object.assign({ arch: 'biped', bob: 1, sway: 1, flap: 1, hop: 1, lean: 1 }, design.anim || {});
  const o = {}, B = (name, p) => { o[name] = Object.assign(o[name] || {}, p); };
  const names = design._bones;
  const has = (n2) => names.has(n2);
  const bob = A.bob, arch = A.arch;
  const sideBones = (fn) => { for (const nm of names) fn(nm); };
  if (clip === 'idle') {
    const b = W(t), b2 = W(t + 0.15);
    B('body', { dy: (arch === 'floater' || arch === 'fish' ? -1.5 * b : -0.8 * Math.max(0, b)) * bob, sy: 1 + 0.025 * b * bob, sx: 1 - 0.015 * b * bob });
    if (has('head')) B('head', { dy: -0.5 * b2 * bob, rot: 1.5 * W(t * 0.5) * A.sway });
    sideBones((nm) => {
      if (/^tail/.test(nm)) B(nm, { rot: 7 * W(t + 0.1 * (+nm.slice(4) || 0)) * A.sway });
      else if (/^ear/.test(nm)) B(nm, { rot: (nm.endsWith('L') ? -1 : 1) * 4 * Math.max(0, W(t * 0.5 + 0.3)) });
      else if (/^wing/.test(nm)) B(nm, { rot: (nm.endsWith('L') ? -1 : 1) * 6 * W(t) * A.flap });
      else if (/^fin/.test(nm)) B(nm, { rot: (nm.endsWith('L') ? -1 : 1) * 10 * W(t * 2) * A.flap });
      else if (/^arm/.test(nm)) B(nm, { rot: (nm.endsWith('L') ? 1 : -1) * 3 * W(t + 0.25) });
      else if (/^(hair|crest|flame|leaf|tuft)/.test(nm)) B(nm, { rot: 5 * W(t + 0.2) * A.sway, sy: 1 + 0.05 * W(t * 2) });
    });
    o.__eyes = fi === n - 2 ? 'closed' : null;   // a blink near the end of the loop
  } else if (clip === 'move') {
    const h = Math.abs(W(t * 0.5 * 2));
    if (arch === 'floater' || arch === 'fish' || arch === 'serpent') B('body', { dy: -2 * W(t) * bob, rot: -4 * A.lean, dx: -1 });
    else if (arch === 'blob') B('body', { dy: -4 * h * A.hop, sy: 1 - 0.12 * (1 - h), sx: 1 + 0.1 * (1 - h) });
    else B('body', { dy: -2.5 * h * A.hop, rot: -3 * A.lean });
    sideBones((nm) => {
      const s = nm.endsWith('L') || nm.endsWith('F') ? 1 : -1;
      if (/^leg/.test(nm)) { const front = /F[LR]$|^leg[LR]$/.test(nm); B(nm, { rot: 24 * W(t + (s > 0 ? 0 : 0.5) + (front ? 0 : 0.25)) }); }
      else if (/^arm/.test(nm)) B(nm, { rot: -18 * s * W(t) });
      else if (/^wing/.test(nm)) B(nm, { rot: (nm.endsWith('L') ? -1 : 1) * 28 * W(t * 2) * A.flap });
      else if (/^tail/.test(nm)) B(nm, { rot: 10 * W(t + 0.3) });
      else if (/^fin/.test(nm)) B(nm, { rot: 14 * W(t * 2) });
      else if (/^(hair|crest|flame|ear)/.test(nm)) B(nm, { rot: 6 * W(t + 0.2) });
    });
  } else if (clip === 'attack') {
    // anticipation → strike → recover
    const k = [0, 1, 2, 3, 4, 5][fi] ?? 0;
    const lean = [3, 5, -6, -7, -3, 0][k] * A.lean, dx = [2, 3, -6, -7, -3, 0][k];
    B('body', { rot: lean, dx, sy: [1, 0.95, 1.05, 1.04, 1, 1][k], sx: [1, 1.04, 0.97, 0.98, 1, 1][k] });
    if (has('head')) B('head', { rot: [4, 6, -10, -8, -3, 0][k], dx: [1, 1, -2, -2, -1, 0][k] });
    sideBones((nm) => {
      if (/^arm/.test(nm)) B(nm, { rot: [20, 35, -60, -55, -20, 0][k] * (nm.endsWith('R') ? 1 : 0.6) });
      else if (/^wing/.test(nm)) B(nm, { rot: (nm.endsWith('L') ? -1 : 1) * [10, 25, -30, -25, -10, 0][k] });
      else if (/^tail/.test(nm)) B(nm, { rot: [-10, -16, 18, 14, 6, 0][k] });
      else if (/^jaw/.test(nm)) B(nm, { rot: [0, 8, 18, 14, 4, 0][k] });
    });
    o.__eyes = k >= 2 && k <= 3 ? 'fierce' : null;
    o.__mouth = k >= 1 && k <= 3 ? 'open' : null;
  } else if (clip === 'cast') {
    const k = fi;
    B('body', { dy: [0, -1, -3, -4, -3, -1][k] ?? 0, sy: [1, 0.96, 1.05, 1.06, 1.03, 1][k] ?? 1 });
    if (has('head')) B('head', { rot: [0, -4, -8, -8, -5, -2][k] ?? 0 });
    sideBones((nm) => {
      if (/^arm/.test(nm)) B(nm, { rot: (nm.endsWith('L') ? 1 : -1) * ([0, 30, 70, 80, 60, 20][k] ?? 0) });
      else if (/^wing/.test(nm)) B(nm, { rot: (nm.endsWith('L') ? -1 : 1) * ([0, 20, 40, 45, 30, 10][k] ?? 0) });
    });
    o.__glow = k >= 2 && k <= 4;
    o.__mouth = k >= 2 && k <= 4 ? 'open' : null;
  } else if (clip === 'hurt') {
    B('body', { dx: [4, 3, 1][fi] ?? 0, rot: [10, 7, 3][fi] ?? 0, sx: [0.94, 0.97, 1][fi] ?? 1 });
    if (has('head')) B('head', { rot: [8, 5, 2][fi] ?? 0 });
    o.__eyes = 'hurt'; o.__mouth = 'frown';
  } else if (clip === 'faint') {
    const f = Math.min(1, fi / (n - 2));
    B('body', { rot: 70 * f, dy: 4 * f, dx: 3 * f });
    if (has('head')) B('head', { rot: 20 * f });
    o.__eyes = 'ko';
  } else if (clip === 'happy') {
    const h = Math.abs(W(t));
    B('body', { dy: -4 * h, sy: 1 + 0.06 * h });
    sideBones((nm) => { if (/^(arm|wing)/.test(nm)) B(nm, { rot: (nm.endsWith('L') ? 1 : -1) * 40 * h }); if (/^tail/.test(nm)) B(nm, { rot: 18 * W(t * 2) }); });
    o.__eyes = 'happy'; o.__mouth = 'open';
  } else if (clip === 'special') {
    const b = W(t);
    B('body', { dy: -2 * Math.abs(b), rot: 4 * b });
    sideBones((nm) => { if (/^(arm|wing)/.test(nm)) B(nm, { rot: (nm.endsWith('L') ? 1 : -1) * 25 * Math.abs(b) }); });
    o.__mouth = 'open';
  }
  return o;
}

// ------------------------------------------------------------------ design preparation
function prep(design, opts) {
  const key = opts.form || '';
  design._prep = design._prep || {};
  if (design._prep[key]) return design._prep[key];
  let d = design;
  if (opts.form && design.forms && design.forms[opts.form]) {
    const F = design.forms[opts.form];
    d = Object.assign({}, design, { pal: Object.assign({}, design.pal, F.pal || {}), parts: [...design.parts, ...(F.parts || [])], eyes: F.eyes || design.eyes, glowAll: F.glow });
  }
  // parent order & draw order
  const parts = d.parts.map((p, i) => Object.assign({ idx: i, z: p.z ?? 0 }, p));
  const byName = new Map(parts.map((p) => [p.n, p]));
  const depthOf = (p) => (p.parent && byName.get(p.parent) ? depthOf(byName.get(p.parent)) + 1 : 0);
  for (const p of parts) p.depth = depthOf(p);
  const draw = [...parts].sort((a, b) => a.z - b.z || a.idx - b.idx);
  draw.forEach((p, i) => { p.order = i + 1; });
  const cols = new Map();
  const colOf = (c) => { const hexc = (d.pal && d.pal[c]) || c; if (!cols.has(hexc)) cols.set(hexc, { idx: cols.size, hex: hexc, ramp: ramp(hexc) }); return cols.get(hexc); };
  for (const p of parts) for (const s of p.s || []) { const ci = colIdxOf(s); if (ci != null) colOf(s[ci]); const o = s[s.length - 1]; if (o && typeof o === 'object' && o.grad) colOf(o.grad[0]); }
  const out = { d, parts, byName, draw, cols, colOf, colList: () => [...cols.values()] };
  design._bones = new Set(parts.map((p) => p.n));
  design._prep[key] = out;
  return out;
}
function colIdxOf(s) {
  switch (s[0]) { case 'ell': return 5; case 'circ': return 4; case 'rect': return 5; case 'cap': return 7; case 'poly': return 2; case 'path': return 2; case 'tri': return 7; case 'curve': return 4; case 'line': return 2; case 'dot': return 3; default: return null; }
}
// path points: [x, y] line-to · [cx, cy, x, y] quadratic · [c1x, c1y, c2x, c2y, x, y] cubic (from the previous point)
function flatten(pts) {
  const out = [];
  let px = pts[0][0], py = pts[0][1];
  out.push([px, py]);
  for (let i = 1; i < pts.length; i++) {
    const q = pts[i];
    if (q.length === 2) { out.push([q[0], q[1]]); px = q[0]; py = q[1]; continue; }
    const steps = 8;
    for (let k = 1; k <= steps; k++) {
      const t = k / steps, u = 1 - t;
      let x, y;
      if (q.length === 4) { x = u * u * px + 2 * u * t * q[0] + t * t * q[2]; y = u * u * py + 2 * u * t * q[1] + t * t * q[3]; }
      else { x = u * u * u * px + 3 * u * u * t * q[0] + 3 * u * t * t * q[2] + t * t * t * q[4]; y = u * u * u * py + 3 * u * u * t * q[1] + 3 * u * t * t * q[3] + t * t * t * q[5]; }
      out.push([x, y]);
    }
    px = q[q.length - 2]; py = q[q.length - 1];
  }
  return out;
}
// an inflated ("pillowed") volume for any outline: distance-to-edge field → rounded normals
function domeFn(pts, roundK) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const R = 0.5, gw = Math.ceil((x1 - x0) / R) + 3, gh = Math.ceil((y1 - y0) / R) + 3, ox = x0 - R, oy = y0 - R;
  const dist = new Float32Array(gw * gh).fill(-1);
  const inside = (x, y) => { let c = false; for (let i = 0, k = pts.length - 1; i < pts.length; k = i++) { const [xa, ya] = pts[k], [xb, yb] = pts[i]; if ((ya > y) !== (yb > y) && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) c = !c; } return c; };
  let D = 0;
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const x = ox + i * R, y = oy + j * R;
    if (!inside(x, y)) continue;
    let bd = Infinity;
    for (let a = 0, k = pts.length - 1; a < pts.length; k = a++) {
      const [xa, ya] = pts[k], [xb, yb] = pts[a], vx = xb - xa, vy = yb - ya, l2 = vx * vx + vy * vy || 1e-6;
      let t = ((x - xa) * vx + (y - ya) * vy) / l2; t = Math.max(0, Math.min(1, t));
      bd = Math.min(bd, Math.hypot(x - (xa + vx * t), y - (ya + vy * t)));
    }
    dist[j * gw + i] = bd; if (bd > D) D = bd;
  }
  const at = (i, j) => (i < 0 || j < 0 || i >= gw || j >= gh ? -1 : dist[j * gw + i]);
  return {
    fn(puff, flatTop) {
      return {
        bb: [x0 - 1, y0 - 1, x1 + 1, y1 + 1],
        hit(x, y) {
          const i = Math.round((x - ox) / R), j = Math.round((y - oy) / R), d = at(i, j);
          if (d < 0) return null;
          const gx = (Math.max(0, at(i + 1, j)) - Math.max(0, at(i - 1, j))), gy = (Math.max(0, at(i, j + 1)) - Math.max(0, at(i, j - 1)));
          const gl = Math.hypot(gx, gy) || 1;
          const t = Math.min(1, d / Math.max(0.8, D * 0.85 * roundK));
          const k = 1 - t;
          const nz = Math.sqrt(Math.max(0, 1 - k * k));
          return [(-gx / gl) * k, (-gy / gl) * k, nz * puff + 0.05 + flatTop, nz * D];
        },
      };
    },
  };
}

// ------------------------------------------------------------------ rasterize one frame
// opts: { clip, frame, bonded, form, expr, flip, scale } → Surf
export function renderFrame(design, opts = {}) {
  const pr = prep(design, opts);
  const d = pr.d;
  const [w, h] = d.size;
  const clip = opts.clip || 'idle', n = CLIPS[clip] || 6, fi = (opts.frame || 0) % n;
  design._bones = design._bones || new Set(pr.parts.map((p) => p.n));
  const po = pose(design, clip, fi / n, fi, n);
  // world matrices
  const M = new Map();
  const grow = opts.bonded && d.bond && d.bond.grow ? d.bond.grow : null;
  const worldOf = (p) => {
    if (M.has(p.n)) return M.get(p.n);
    const ps = Object.assign({}, po[p.n] || {});
    if (grow && grow[p.n]) { ps.sx = (ps.sx ?? 1) * grow[p.n]; ps.sy = (ps.sy ?? 1) * grow[p.n]; }
    const local = boneMatrix(p.p[0], p.p[1], ps);
    const par = p.parent && pr.byName.get(p.parent);
    const m = par ? mul(worldOf(par), local) : local;
    M.set(p.n, m);
    return m;
  };
  const N = w * h;
  const gCol = new Int16Array(N).fill(-1), gPart = new Int16Array(N), gFlag = new Uint8Array(N), gBand = new Int8Array(N);
  const gNx = new Float32Array(N), gNy = new Float32Array(N), gNz = new Float32Array(N), gNoise = new Float32Array(N), gH = new Float32Array(N);
  const details = [];
  const FLAT = 1, GLOSS = 2, GLOW = 4, NOLINE = 8, DITHER = 16;
  for (const p of pr.draw) {
    if (p.hide || (p.bond && !opts.bonded)) continue;
    const m = worldOf(p), mi = inv(m);
    const rc = Math.hypot(m[0], m[1]) || 1, rcs = m[0] / rc, rsn = m[1] / rc; // rotation for normals
    for (const s of p.s || []) {
      const t = s[0];
      if (t === 'line' || t === 'dot') { details.push({ s, m }); continue; }
      const o = (typeof s[s.length - 1] === 'object' && !Array.isArray(s[s.length - 1])) ? s[s.length - 1] : {};
      const shp = shapeFn(s, o);
      if (!shp) continue;
      // world bbox
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [bx, by] of [[shp.bb[0], shp.bb[1]], [shp.bb[2], shp.bb[1]], [shp.bb[0], shp.bb[3]], [shp.bb[2], shp.bb[3]]]) { const [X, Y] = apply(m, bx, by); x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y); }
      x0 = Math.max(0, Math.floor(x0) - 1); y0 = Math.max(0, Math.floor(y0) - 1); x1 = Math.min(w - 1, Math.ceil(x1) + 1); y1 = Math.min(h - 1, Math.ceil(y1) + 1);
      const col = o.sub ? null : pr.colOf(s[colIdxOf(s)]);
      const col2 = o.grad ? pr.colOf(o.grad[0]) : null;
      const flags = (o.flat ? FLAT : 0) | (o.gloss ? GLOSS : 0) | (o.glow || d.glowAll ? GLOW : 0) | (o.line === false ? NOLINE : 0) | (o.dither ? DITHER : 0);
      const tilt = o.tilt || null;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const [rx, ry] = apply(mi, x + 0.5, y + 0.5);
        const r = shp.hit(rx, ry);
        if (!r) continue;
        const i = y * w + x;
        if (o.sub) { if (gPart[i] === p.order || o.subAll) gCol[i] = -1; continue; }
        if (o.paint && (gCol[i] < 0 || gPart[i] !== p.order)) continue;
        let c = col.idx;
        if (col2) { const ax = o.grad[1] === 'x' ? rx : ry, a = o.grad[2], b = o.grad[3]; let f = (ax - a) / (b - a); f = Math.max(0, Math.min(1, f)); const g = Math.max(0, Math.min(1, (f - 0.38) / 0.24)); if (g >= 1 || (g > 0 && bayer(x, y) < g)) c = col2.idx; }
        // same colour, same part: the shapes merge into one surface (keep the higher one, no seam)
        if (!o.paint && gCol[i] === c && gPart[i] === p.order && gH[i] > (r[3] || 0)) continue;
        gCol[i] = c; gBand[i] = o.band || 0;
        if (!o.paint) {
          let nx = r[0], ny = r[1], nz = r[2];
          if (tilt) { nx += tilt[0]; ny += tilt[1]; }
          // rotate normal by the bone rotation
          const qx = nx * rcs - ny * rsn, qy = nx * rsn + ny * rcs;
          const l = Math.hypot(qx, qy, nz) || 1;
          gNx[i] = qx / l; gNy[i] = qy / l; gNz[i] = nz / l;
          gPart[i] = p.order; gFlag[i] = flags; gH[i] = r[3] || 0;
          gNoise[i] = o.noise ? (noise2(rx * (o.nf || 0.45), ry * (o.nf || 0.45), 7) - 0.5) * o.noise * 2 : 0;
        } else if (o.glow) gFlag[i] |= GLOW;
      }
    }
  }
  // ---- shading → band per pixel (1 deep · 2 shadow · 3 base · 4 light · 5 highlight)
  const surf = new Surf(w, h);
  const out = surf.data;
  const cl = pr.colList();
  const L = opts.light ? norm3(opts.light) : LIGHT;
  const glowPx = [];
  const band = new Int8Array(N);
  const empty = (xx, yy) => xx < 0 || yy < 0 || xx >= w || yy >= h || gCol[yy * w + xx] < 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (gCol[i] < 0) continue;
    const f = gFlag[i];
    if (f & GLOW) { band[i] = 9; continue; }
    if (f & FLAT) { band[i] = 3; continue; }
    let dd = gNx[i] * L[0] + gNy[i] * L[1] + gNz[i] * L[2] + gNoise[i];
    if (f & DITHER) dd += (bayer(x, y) - 0.5) * 0.2;
    let b = dd < 0.02 ? 1 : dd < 0.36 ? 2 : dd < 0.8 ? 3 : 4;
    if ((f & GLOSS) && dd > 0.93) b = 5;
    // contact shadow under/behind a part that sits in front, toward the light
    const j = (y - 2) * w + (x - 1);
    if (y >= 2 && x >= 1 && gCol[j] >= 0 && gPart[j] > gPart[i] && !(gFlag[j] & NOLINE)) b = Math.min(b, 2);
    // thin reflected rim light on the far-side edge
    if (b <= 2 && design.rim !== false && (gNx[i] > 0.3 || gNy[i] > 0.45) && (empty(x + 1, y) || empty(x, y + 1))) b = 2 + (b === 2 && gNx[i] > 0.5 ? 1 : 0);
    band[i] = b;
  }
  // cluster cleanup: a lone pixel whose band differs from all same-colour neighbours takes the majority band
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x, b = band[i];
    if (gCol[i] < 0 || b === 9 || b === 5) continue;
    const nb = [i - 1, i + 1, i - w, i + w].filter((k) => gCol[k] === gCol[i]);
    if (nb.length >= 3 && nb.every((k) => band[k] !== b)) { const c = {}; for (const k of nb) c[band[k]] = (c[band[k]] || 0) + 1; band[i] = +Object.entries(c).sort((a2, b2) => b2[1] - a2[1])[0][0]; }
  }
  for (let i = 0; i < N; i++) {
    const ci = gCol[i]; if (ci < 0) continue;
    const C = cl[ci];
    if (band[i] === 9) { out[i] = P(C.ramp[4]); glowPx.push(i); continue; }
    out[i] = P(C.ramp[Math.max(1, Math.min(5, band[i] + gBand[i]))]);
  }
  // ---- inner contours (soft selout): front part's edge pixels against a part behind
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, ci = gCol[i];
    if (ci < 0 || (gFlag[i] & (NOLINE | GLOW))) continue;
    const me = gPart[i];
    let edge = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
      const j = Y * w + X; if (gCol[j] >= 0 && gPart[j] < me && !(gFlag[j] & NOLINE)) { edge = true; break; }
    }
    if (edge) out[i] = P(design.softLines ? cl[ci].ramp[1] : cl[ci].ramp[0]);
  }
  // ---- details (1-px lines/dots) on top, transformed with their bone
  for (const { s, m } of details) {
    if (s[0] === 'dot') { const [X, Y] = apply(m, s[1], s[2]); surf.px(X, Y, colHex(pr, s[3])); }
    else { const pts = s[1].map(([px, py]) => apply(m, px, py)); for (let k = 1; k < pts.length; k++) surf.line(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], colHex(pr, s[2])); }
  }
  // ---- eyes & mouth
  const expr = opts.expr || po.__eyes;
  for (const e of d.eyes || []) {
    const part = pr.byName.get(e.part); if (!part || part.hide || (part.bond && !opts.bonded)) continue;
    const [X, Y] = apply(worldOf(part), e.x, e.y);
    let rows;
    if (e.map) rows = (expr && e.maps && e.maps[expr]) || (expr && !e.maps && EYES[expr] && expr !== 'fierce' ? EYES[expr] : null) || e.map;
    else { const style = (expr && EYES[expr]) ? expr : e.style || 'anime'; rows = EYES[style] || EYES.anime; }
    stampEye(surf, Math.round(X), Math.round(Y), rows, e, pr);
  }
  if (d.mouth && d.mouth.style !== 'none') {
    const part = pr.byName.get(d.mouth.part);
    if (part) { const [X, Y] = apply(worldOf(part), d.mouth.x, d.mouth.y); stampMouth(surf, Math.round(X), Math.round(Y), MOUTHS[po.__mouth && d.mouth.open !== false ? po.__mouth : d.mouth.style] || MOUTHS.smile, d.mouth, pr); }
  }
  // ---- silhouette outline, selective: the darkest step of the neighbouring colour on the
  //      shadow side (bottom/right), one step softer on the lit side (top/left)
  const rampOf = new Map();
  for (const C of cl) for (let k = 1; k < 6; k++) rampOf.set(P(C.ramp[k]), C.ramp);
  const src = surf.data, dst = new Uint32Array(src), ink = P(d.ink || '#2e222f');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (src[i] >>> 24) continue;
    let nb = 0, lit = false;
    const t = (X, Y, l) => { if (nb || X < 0 || Y < 0 || X >= w || Y >= h) return; const v = src[Y * w + X]; if (v >>> 24) { nb = v; lit = l; } };
    t(x, y + 1, true); t(x + 1, y, true); t(x - 1, y, false); t(x, y - 1, false);
    if (!nb) continue;
    const R = rampOf.get(nb);
    const dark = design.outlineDark ?? 0.55;
    dst[i] = R ? P(lit && design.selout ? mix(R[0], R[1], 0.5) : mix(R[0], '#120a18', dark)) : ink;
  }
  surf.data = dst; surf.touch();
  surf.glow = glowPx;
  if (opts.flip) { const f = new Surf(w, h); f.blit(surf, 0, 0, true); f.glow = glowPx.map((i) => (i - (i % w)) + (w - 1 - (i % w))); return f; }
  return surf;
}
function colHex(pr, c) { return (pr.d.pal && pr.d.pal[c]) || c; }

function stampEye(surf, X, Y, rows, e, pr) {
  const iris = colHex(pr, e.iris || '#3b2a20'), ink = e.ink || '#1c1226';
  const map = Object.assign({ k: ink, s: '#ffffff', i: iris, I: mix(iris, '#1c1226', 0.45), j: mix(iris, '#ffffff', 0.35), p: mix(iris, '#140c1c', 0.75), w: '#ffffff', l: ink, r: '#ff5a6a' }, e.cmap || {});
  const hgt = rows.length, wid = rows[0].length;
  const flip = e.flip;
  for (let j = 0; j < hgt; j++) for (let i = 0; i < wid; i++) {
    const ch = rows[j][flip ? wid - 1 - i : i];
    if (ch === '.' || ch === ' ') continue;
    if (e.far && i === (flip ? 0 : wid - 1)) continue;   // the far eye is slightly cut by the head's turn
    surf.px(X + i - (wid >> 1), Y + j - (hgt >> 1), map[ch] || ink);
  }
}
function stampMouth(surf, X, Y, rows, m, pr) {
  const map = { k: m.ink || '#2a1424', m: '#5a1a2a', t: '#ff7a8a', f: '#ffffff' };
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) { const ch = rows[j][i]; if (ch === '.' || ch === ' ') continue; surf.px(X + i - (rows[j].length >> 1), Y + j, map[ch] || map.k); }
}

// ------------------------------------------------------------------ shape coverage + normals (rest space)
function shapeFn(s, o) {
  const puff = o.puff ?? 1;
  switch (s[0]) {
    case 'circ': return ellFn(s[1], s[2], s[3], s[3], 0, puff);
    case 'ell': return ellFn(s[1], s[2], s[3], s[4], o.rot || 0, puff);
    case 'cap': return capFn(s[1], s[2], s[3], s[4], s[5], s[6], puff);
    case 'rect': { const [x, y, w, hh] = [s[1], s[2], s[3], s[4]]; const r = Math.min(o.round || 0, w / 2, hh / 2); return polyFn(roundRect(x, y, w, hh, r), o.bevel ?? 2, puff, o.rot ? [x + w / 2, y + hh / 2, o.rot] : null); }
    case 'poly': if (o.dome) { if (!s._sdf) s._sdf = domeFn(s[1], o.round ?? 1); return s._sdf.fn(puff, o.flatTop || 0); } return polyFn(s[1], o.bevel ?? 2, puff);
    case 'tri': return polyFn([[s[1], s[2]], [s[3], s[4]], [s[5], s[6]]], o.bevel ?? 1.5, puff);
    case 'curve': return curveFn(s[1], s[2], s[3], puff);
    case 'path': { const key = '_sdf'; if (!s[key]) s[key] = domeFn(flatten(s[1]), o.round ?? 1); return s[key].fn(puff, o.flatTop || 0); }
    default: return null;
  }
}
function ellFn(cx, cy, rx, ry, rot, puff) {
  const r = (rot * Math.PI) / 180, cs = Math.cos(r), sn = Math.sin(r), m = Math.max(rx, ry);
  return {
    bb: [cx - m - 1, cy - m - 1, cx + m + 1, cy + m + 1],
    hit(x, y) {
      const dx = x - cx, dy = y - cy, u = (dx * cs + dy * sn) / rx, v = (-dx * sn + dy * cs) / ry, d2 = u * u + v * v;
      if (d2 > 1) return null;
      const nu = u, nv = v; // normal in ellipse frame → rotate back
      return [nu * cs - nv * sn, nu * sn + nv * cs, Math.sqrt(1 - d2) * puff + 0.05, Math.sqrt(1 - d2) * Math.min(rx, ry)];
    },
  };
}
function capFn(x1, y1, x2, y2, r1, r2, puff) {
  const vx = x2 - x1, vy = y2 - y1, ll = vx * vx + vy * vy || 1e-6, m = Math.max(r1, r2);
  return {
    bb: [Math.min(x1, x2) - m - 1, Math.min(y1, y2) - m - 1, Math.max(x1, x2) + m + 1, Math.max(y1, y2) + m + 1],
    hit(x, y) {
      let t = ((x - x1) * vx + (y - y1) * vy) / ll; t = Math.max(0, Math.min(1, t));
      const r = r1 + (r2 - r1) * t, px = x1 + vx * t, py = y1 + vy * t, dx = x - px, dy = y - py, d = Math.hypot(dx, dy);
      if (d > r) return null;
      const k = d / Math.max(0.5, r);
      return [dx / Math.max(0.5, r), dy / Math.max(0.5, r), Math.sqrt(Math.max(0, 1 - k * k)) * puff + 0.05, Math.sqrt(Math.max(0, 1 - k * k)) * r];
    },
  };
}
function curveFn(pts, r0, r1, puff) {
  // smooth the polyline (Catmull-Rom) then sweep tapered capsules
  const sm = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < 4; k++) { const t = k / 4, t2 = t * t, t3 = t2 * t; sm.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
  }
  sm.push(pts[pts.length - 1]);
  const segs = [];
  for (let i = 0; i < sm.length - 1; i++) { const a = i / (sm.length - 1), b = (i + 1) / (sm.length - 1); segs.push(capFn(sm[i][0], sm[i][1], sm[i + 1][0], sm[i + 1][1], r0 + (r1 - r0) * a, r0 + (r1 - r0) * b, puff)); }
  let bb = [Infinity, Infinity, -Infinity, -Infinity];
  for (const s of segs) bb = [Math.min(bb[0], s.bb[0]), Math.min(bb[1], s.bb[1]), Math.max(bb[2], s.bb[2]), Math.max(bb[3], s.bb[3])];
  return { bb, hit(x, y) { let best = null; for (const s of segs) { const r = s.hit(x, y); if (r && (!best || r[2] > best[2])) best = r; } return best; } };
}
function roundRect(x, y, w, h, r) {
  if (r <= 0.5) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const pts = [], seg = 4;
  const corner = (cx, cy, a0) => { for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * (Math.PI / 2); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0); corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI);
  return pts;
}
function polyFn(pts, bevel, puff, rot) {
  let P2 = pts;
  if (rot) { const [cx, cy, deg] = rot, r = (deg * Math.PI) / 180, cs = Math.cos(r), sn = Math.sin(r); P2 = pts.map(([x, y]) => [cx + (x - cx) * cs - (y - cy) * sn, cy + (x - cx) * sn + (y - cy) * cs]); }
  let bb = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of P2) bb = [Math.min(bb[0], x), Math.min(bb[1], y), Math.max(bb[2], x), Math.max(bb[3], y)];
  // signed area → outward normals
  let area = 0; for (let i = 0, k = P2.length - 1; i < P2.length; k = i++) area += (P2[k][0] * P2[i][1] - P2[i][0] * P2[k][1]);
  const sgn = area > 0 ? 1 : -1;
  return {
    bb,
    hit(x, y) {
      let inside = false;
      for (let i = 0, k = P2.length - 1; i < P2.length; k = i++) {
        const [xa, ya] = P2[k], [xb, yb] = P2[i];
        if ((ya > y) !== (yb > y) && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) inside = !inside;
      }
      if (!inside) return null;
      let bd = Infinity, bn = [0, 0];
      for (let i = 0, k = P2.length - 1; i < P2.length; k = i++) {
        const [xa, ya] = P2[k], [xb, yb] = P2[i], vx = xb - xa, vy = yb - ya, l2 = vx * vx + vy * vy || 1e-6;
        let t = ((x - xa) * vx + (y - ya) * vy) / l2; t = Math.max(0, Math.min(1, t));
        const d = Math.hypot(x - (xa + vx * t), y - (ya + vy * t));
        if (d < bd) { bd = d; const l = Math.sqrt(l2); bn = [(vy / l) * sgn, (-vx / l) * sgn]; }
      }
      const k = Math.max(0, 1 - bd / Math.max(0.5, bevel));
      return [bn[0] * k * 0.9, bn[1] * k * 0.9, (1 - k * 0.6) * puff + 0.1, (1 - k) * bevel + 0.5];
    },
  };
}

// ------------------------------------------------------------------ frame cache & sprite players
const cache = new Map();
let uid = 0;
export function frames(design, clip = 'idle', opts = {}) {
  if (!design._uid) design._uid = 'd' + (++uid);
  const key = `${design._uid}|${clip}|${opts.form || ''}|${opts.bonded ? 1 : 0}|${opts.expr || ''}|${opts.flip ? 1 : 0}`;
  let f = cache.get(key);
  if (!f) {
    const n = CLIPS[clip] || 6;
    f = [];
    for (let i = 0; i < n; i++) f.push(renderFrame(design, Object.assign({}, opts, { clip, frame: i })));
    cache.set(key, f);
  }
  return f;
}
export function clearSpriteCache() { cache.clear(); }
export const isLoop = (clip) => !!LOOP[clip];

// A playing sprite: clip state machine stepped at 12 fps.
export class SpritePlayer {
  constructor(design, opts = {}) {
    this.design = design; this.opts = Object.assign({}, opts);
    this.clip = 'idle'; this.t = 0; this.frame = 0; this.queue = null; this.done = false; this.base = 'idle';
  }
  play(clip, { then = null, restart = true } = {}) {
    if (!CLIPS[clip]) clip = 'idle';
    if (this.clip === clip && !restart) return;
    this.clip = clip; this.t = 0; this.frame = 0; this.done = false; this.queue = then;
  }
  setBase(clip) { this.base = clip; if (isLoop(this.clip)) this.play(clip, { restart: false }); }
  set(o) { Object.assign(this.opts, o); }
  update(dt) {
    this.t += dt;
    const n = CLIPS[this.clip] || 6, step = 1 / (FPS * (this.design.anim && this.design.anim.speed || 1));
    while (this.t >= step) {
      this.t -= step;
      if (this.frame < n - 1) this.frame++;
      else if (isLoop(this.clip)) this.frame = 0;
      else if (this.clip === 'faint') { this.done = true; }
      else { this.done = true; const nx = this.queue || this.base; this.queue = null; this.clip = nx; this.frame = 0; }
    }
  }
  current() { return frames(this.design, this.clip, this.opts)[this.frame]; }
}
