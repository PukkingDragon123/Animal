// Shared building blocks for two lines — Nirvana (Woodbub → Hartbox → Utero) and Travis Scott
// (Grillfin → Astroshark): box helpers (mirrored twins, oriented rods between two points), the
// house eye style (big rounded Gen 8–9 kawaii eyes and their expression set, painted per eye
// plane), gear attach points, and a few motion helpers.
import * as THREE from '../../../vendor/three.module.js';
import { poly, ramp, shift, mix, h2 } from './kit.js';
export { poly, ramp, shift, mix, h2 };

export const D2R = Math.PI / 180;
export const tx = (u) => Math.round(u * 3);                         // units → texels (ppu 3)
export const isSide = (f) => f === 'south' || f === 'north' || f === 'east' || f === 'west';
// x offset of a face inside its box-UV strip (west | south | east | north), so patterns run on around corners
export const wrapX = (face, cube) => { const w = tx(cube.s[0]), d = tx(cube.s[2]); return face === 'south' ? d : face === 'east' ? d + w : face === 'north' ? 2 * d + w : 0; };
export const fill = (p, w, h, fn) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fn(x, y); if (c) p.px(x, y, c); } };
export const B = (o, s, tex, x = {}) => ({ o, s, tex, ...x });
export const cyc = (t, fps, n) => Math.floor(t * fps) % n;
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

// ---------------------------------------------------------------- mirroring
// the same cube on the other side of the model (x → −x); plane-x cut-outs keep their U
export const flipX = (c) => {
  const m = { ...c, o: [-(c.o[0] + c.s[0]), c.o[1], c.o[2]], mirror: c.plane === 'x' ? !!c.mirror : !c.mirror };
  if (c.pivot) m.pivot = [-c.pivot[0], c.pivot[1], c.pivot[2]];
  if (c.rot) m.rot = [c.rot[0], -c.rot[1], -c.rot[2]];
  return m;
};
const sideName = (n) => (n && /R$/.test(n) ? n.replace(/R$/, 'L') : n);
// a bone named …R and its mirrored twin …L (parents ending in R are mirrored too)
export const twin = (b) => [b, { ...b, name: sideName(b.name), parent: sideName(b.parent), pivot: [-b.pivot[0], b.pivot[1], b.pivot[2]], ...(b.rot ? { rot: [b.rot[0], -b.rot[1], -b.rot[2]] } : {}), cubes: b.cubes.map(flipX) }];

// ---------------------------------------------------------------- oriented rods
const _m4 = new THREE.Matrix4(), _eu = new THREE.Euler();
// Euler XYZ (degrees) that turns local +z toward `fwd` (local +x toward `sideV`)
export function aimZ(fwd, sideV = [1, 0, 0]) {
  const z = new THREE.Vector3(...fwd).normalize(), x = new THREE.Vector3(...sideV);
  x.addScaledVector(z, -x.dot(z)); if (x.lengthSq() < 1e-8) x.set(0, 1, 0).addScaledVector(z, -z.y);
  x.normalize();
  const y = new THREE.Vector3().crossVectors(z, x);
  _eu.setFromRotationMatrix(_m4.makeBasis(x, y, z), 'XYZ');
  return [_eu.x / D2R, _eu.y / D2R, _eu.z / D2R];
}
// a box spanning a → b (rod, cane, strap), w × t thick, its long axis local z. x.over lengthens it.
export function rod(a, b, w, t, tex, x = {}) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d) + (x.over ?? 0), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const { over, sideV, ...rest } = x;
  return { o: [m[0] - w / 2, m[1] - t / 2, m[2] - L / 2], s: [w, t, L], pivot: m, rot: aimZ(d, sideV || [1, 0, 0]), tex, ...rest };
}
// a point along a polyline at arc-length fraction u (0..1); returns [x, y, z]
export function along(pts, u) {
  const L = []; let tot = 0;
  for (let i = 0; i + 1 < pts.length; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1], pts[i + 1][2] - pts[i][2]); L.push(d); tot += d; }
  let s = clamp(u) * tot;
  for (let i = 0; i < L.length; i++) { if (s <= L[i] || i === L.length - 1) { const k = L[i] ? Math.min(1, s / L[i]) : 0; return [0, 1, 2].map((j) => pts[i][j] + (pts[i + 1][j] - pts[i][j]) * k); } s -= L[i]; }
  return pts[pts.length - 1].slice();
}

// ---------------------------------------------------------------- eyes
// The house eye: a big rounded eye (circle / oval / soft teardrop) with a 1-texel dark outline, a dark
// iris tinted with the species' accent, a lighter accent gradient in the lower third, one big white
// catchlight high on the OUTER side and a 1-texel glint low on the inner side. Painted for the
// creature's right eye (outer corner at texel x = 0); the left eye is the mirrored copy.
// Expressions in the same style: happy ^, closed (a soft curve), hurt > <, swirl, x, and lid cuts
// (sleepy / cool: a flat lid line across the top; angry: the lid slants down toward the nose;
// sad: the lid slants down toward the outside).
// o: { iris, irisHi, accent: [mid, light], line, white, shape: 'round'|'tear', cl (catchlight size) }
export function eyeKit(o = {}) {
  const line = o.line || '#140c14', iris = o.iris || '#1c1830', irisHi = o.irisHi || mix(iris, (o.accent || ['#3a6ad0'])[0], 0.35);
  const acc = o.accent || ['#3a6ad0', '#7ab8ff'], white = o.white || '#ffffff', glint = o.glint || white;
  const shapeOf = (W, H) => {
    const cx = (W - 1) / 2, cy = (H - 1) / 2, rx = W / 2, ry = H / 2;
    return (x, y) => {
      let dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (o.shape === 'tear') dx *= 1 + Math.max(0, -dy) * 0.22;           // a little narrower at the top
      return dx * dx + dy * dy <= 1.06;
    };
  };
  // the open eye; cut: fraction of the height removed by a lid line, tilt: texels the lid drops toward the inner side (+) or outer side (−)
  const base = (cut = 0, tilt = 0, k = {}) => (p, W, H) => {
    const ins = shapeOf(W, H), cx = (W - 1) / 2, lidY = (x) => cut * H + tilt * ((x - cx) / Math.max(1, W - 1));
    const on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && ins(x, y) && y + 0.5 >= lidY(x);
    let yTop = H; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (on(x, y)) yTop = Math.min(yTop, y);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!on(x, y)) continue;
      const edge = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1);
      const t = (y + 0.5) / H;
      p.px(x, y, edge ? line : t > 0.78 ? acc[1] : t > 0.6 ? acc[0] : t > 0.46 && k.soft !== false ? irisHi : iris);
    }
    // highlights: one big catchlight high on the outer side, one small glint low on the inner side
    const s = o.cl || (W >= 9 ? 3 : 2), cxl = W >= 9 ? 1 + Math.round(W * 0.06) : 1, cyl = Math.max(1, Math.ceil(yTop + 1 + (cut > 0 ? 0 : (o.clDrop || 0))));
    for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) { const X = cxl + i, Y = cyl + j; if (on(X, Y) && !(s === 3 && i === 2 && j === 2)) { const e = !on(X - 1, Y) || !on(X, Y - 1) || !on(X + 1, Y) || !on(X, Y + 1); if (!e) p.px(X, Y, white); } }
    const gx = W - 3, gy = H - 3; if (on(gx, gy)) p.px(gx, gy, glint);
  };
  // a 2-texel-thick curve: y(x) for x in [x0, x1]
  const stroke = (p, W, H, fy, x0 = 0, x1 = W - 1, th = 2) => {
    for (let x = x0; x <= x1; x++) { const y = Math.round(fy(x)); for (let k = 0; k < th; k++) if (y + k >= 0 && y + k < H) p.px(x, y + k, line); }
  };
  return {
    open: base(0, 0),
    sleepy: base(0.4, 0),                            // a flat lid line across the top: drowsy / cool
    cool: base(0.34, -0.6),
    angry: base(0.3, 2.6),                           // the lid slants down toward the nose
    sad: base(0.3, -2.6),                            // …or down toward the outside
    // happy: a ^ arch
    happy: (p, W, H) => { const cx = (W - 1) / 2; stroke(p, W, H, (x) => H * 0.62 - Math.sqrt(Math.max(0, 1 - ((x - cx) / (W / 2)) ** 2)) * H * 0.42, 0, W - 1); },
    // closed: a soft downward curve
    closed: (p, W, H) => { const cx = (W - 1) / 2; stroke(p, W, H, (x) => H * 0.5 + Math.sqrt(Math.max(0, 1 - ((x - cx) / (W / 2)) ** 2)) * H * 0.2, 0, W - 1); },
    // hurt: > (pointing toward the nose; the mirrored left eye reads <)
    hurt: (p, W, H) => { const cy = (H - 1) / 2; for (let x = 0; x < W - 1; x++) { const d = (x / (W - 2)) * (cy - 0.5); for (const y of [Math.round(d), Math.round(H - 1 - d)]) { p.px(x, y, line); p.px(x + 1, y, line); } } },
    swirl: (p, W, H) => { const cx = (W - 1) / 2, cy = (H - 1) / 2; for (let a = 0; a < 16; a += 0.12) { const r = a * 0.27, x = Math.round(cx + Math.cos(a) * r * (W / H)), y = Math.round(cy + Math.sin(a) * r); if (r < Math.min(W, H) / 2) p.px(x, y, line); } },
    x: (p, W, H) => { for (let i = 0; i < Math.min(W, H) - 1; i++) { const X = Math.round(i * (W - 2) / (Math.min(W, H) - 2)), Y = i; p.px(X, Y, line); p.px(X + 1, Y, line); p.px(W - 2 - X, Y, line); p.px(W - 1 - X, Y, line); } },
  };
}
// eye planes for every state: { o, s } is the creature's RIGHT eye (x < 0); the left eye is its mirror.
// x: extra cube fields (pivot/rot for eyes set into a turned face, glow, …). Returns cubes.
export function eyeCubes(states, def, o, s, x = {}) {
  const out = [];
  for (const [k, fn] of Object.entries(states)) {
    const c = B(o, s, fn, { plane: 'z', id: 'eye-' + k, hide: k !== def, outline: false, ...x });
    out.push(c, flipX(c));
  }
  return out;
}
export const eyeFaces = (states, def) => ({ default: def, states: Object.fromEntries(Object.keys(states).map((k) => [k, ['eye-' + k]])) });

// ---------------------------------------------------------------- motion helpers
// keep feet planted while the hips rise/sink by dy (legs stretch to reach the ground)
export function plant(P, dy, legs, L) { for (const s of legs) { P.pos(s, 0, dy, 0); P.scl(s, 1, Math.max(0.35, (L + dy) / L), 1); } }
// rotate a bone about a point other than its pivot: (rx about x through [y, z]) → extra offset
export function orbitX(P, bone, pivot, about, deg) {
  const r = deg * D2R, c = Math.cos(r), s = Math.sin(r), dy = pivot[1] - about[1], dz = pivot[2] - about[2];
  P.rot(bone, deg, 0, 0).pos(bone, 0, about[1] + dy * c - dz * s - pivot[1], about[2] + dy * s + dz * c - pivot[2]);
}
export function orbitZ(P, bone, pivot, about, deg) {
  const r = deg * D2R, c = Math.cos(r), s = Math.sin(r), dx = pivot[0] - about[0], dy = pivot[1] - about[1];
  P.rot(bone, 0, 0, deg).pos(bone, about[0] + dx * c - dy * s - pivot[0], about[1] + dx * s + dy * c - pivot[1], 0);
}
