// Voxel engine: "3D pixel art". Shapes (SDF primitives) are voxelized on a
// global lattice, then meshed with per-vertex ambient occlusion and baked
// per-voxel colour jitter — the MagicaVoxel look, but generated from code.
//
// Shape tuples (model space, metres, +y up, +z = front):
//   ['sph',  c, r, col, opts]
//   ['ell',  c, [rx,ry,rz], col, opts]
//   ['box',  c, [hx,hy,hz], col, opts]          (opts.round = corner radius)
//   ['cap',  a, b, r0, r1, col, opts]            tapered capsule / round cone
//   ['cyl',  a, b, r, col, opts]
//   ['tor',  c, R, r, col, opts]                 (opts.axis 'x'|'y'|'z', default 'y')
//   ['poly', c, [[u,v]...], halfThick, col, opts] extruded polygon (opts.plane 'xy'|'zy'|'xz')
// opts:
//   m:1 mirror across x · sub:1 carve · paint:1 recolour only · under:1 fill empties only
//   glow:1..3 emissive · rot:[x,y,z] degrees · noise:amp · fat:extra radius
//   belly/top/front/back/side:'key' paint by surface normal · tip:'key', tipT
//   stripes:{axis,p,w,col,o} · spots:{col,d,s} · grad:{axis,to,a,b} · dither:{col,amt}
//   jit: colour jitter (default .07)
import * as THREE from '../../vendor/three.module.js';
import { hash3, vnoise3 } from '../core/rng.js';

const S2L = new Float32Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; S2L[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
export const srgbToLinear = (b) => S2L[b & 255];

export function parseColor(c) {
  if (typeof c === 'number') return c & 0xffffff;
  if (typeof c !== 'string') return 0xff00ff;
  let s = c.trim();
  if (s[0] === '#') s = s.slice(1);
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  const v = parseInt(s, 16);
  return Number.isFinite(v) ? v : 0xff00ff;
}
export function mixRGB(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
}
export function scaleRGB(a, f) {
  const r = Math.min(255, Math.max(0, Math.round(((a >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((a >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((a & 255) * f)));
  return (r << 16) | (g << 8) | b;
}

// ---------------------------------------------------------------- grid
const FILLED = 0x80000000;
export class VoxelGrid {
  constructor(ox, oy, oz, nx, ny, nz, vs) {
    this.ox = ox; this.oy = oy; this.oz = oz;   // lattice index of cell (0,0,0)
    this.nx = nx; this.ny = ny; this.nz = nz; this.vs = vs;
    this.data = new Uint32Array(nx * ny * nz);
  }
  idx(i, j, k) { return (i * this.ny + j) * this.nz + k; }
  inb(i, j, k) { return i >= 0 && j >= 0 && k >= 0 && i < this.nx && j < this.ny && k < this.nz; }
  get(i, j, k) { return this.inb(i, j, k) ? this.data[this.idx(i, j, k)] : 0; }
  filled(i, j, k) { return this.inb(i, j, k) && this.data[this.idx(i, j, k)] !== 0; }
  set(i, j, k, rgb, glow = 0) { if (this.inb(i, j, k)) this.data[this.idx(i, j, k)] = (FILLED | ((glow & 3) << 29) | (rgb & 0xffffff)) >>> 0; }
  clear(i, j, k) { if (this.inb(i, j, k)) this.data[this.idx(i, j, k)] = 0; }
  // world (model) position of a cell centre
  cx(i) { return (i + this.ox) * this.vs; }
  cy(j) { return (j + this.oy) * this.vs; }
  cz(k) { return (k + this.oz) * this.vs; }
  count() { let n = 0; for (let i = 0; i < this.data.length; i++) if (this.data[i]) n++; return n; }
}

// ---------------------------------------------------------------- SDFs
function sdEllipsoid(px, py, pz, rx, ry, rz) {
  const k0 = Math.hypot(px / rx, py / ry, pz / rz);
  const k1 = Math.hypot(px / (rx * rx), py / (ry * ry), pz / (rz * rz));
  return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}
function sdRoundBox(px, py, pz, hx, hy, hz, r) {
  const qx = Math.abs(px) - hx + r, qy = Math.abs(py) - hy + r, qz = Math.abs(pz) - hz + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, Math.max(qy, qz)), 0) - r;
}
function sdRoundCone(px, py, pz, s) { // s precomputed: ax..,bax..,l2,rr,a2,il2,r1,r2
  const pax = px - s.ax, pay = py - s.ay, paz = pz - s.az;
  const y = pax * s.bx + pay * s.by + paz * s.bz;
  const z = y - s.l2;
  const qx = pax * s.l2 - s.bx * y, qy = pay * s.l2 - s.by * y, qz = paz * s.l2 - s.bz * y;
  const x2 = qx * qx + qy * qy + qz * qz;
  const y2 = y * y * s.l2, z2 = z * z * s.l2;
  const k = Math.sign(s.rr) * s.rr * s.rr * x2;
  if (Math.sign(z) * s.a2 * z2 > k) return Math.sqrt(x2 + z2) * s.il2 - s.r2;
  if (Math.sign(y) * s.a2 * y2 < k) return Math.sqrt(x2 + y2) * s.il2 - s.r1;
  return (Math.sqrt(x2 * s.a2 * s.il2) + y * s.rr) * s.il2 - s.r1;
}
function sdCylinder(px, py, pz, s) {
  const pax = px - s.ax, pay = py - s.ay, paz = pz - s.az;
  const baba = s.l2, paba = pax * s.bx + pay * s.by + paz * s.bz;
  const qx = pax * baba - s.bx * paba, qy = pay * baba - s.by * paba, qz = paz * baba - s.bz * paba;
  const x = Math.hypot(qx, qy, qz) - s.r * baba;
  const y = Math.abs(paba - baba * 0.5) - baba * 0.5;
  const x2 = x * x, y2 = y * y * baba;
  const d = Math.max(x, y) < 0 ? -Math.min(x2, y2) : (x > 0 ? x2 : 0) + (y > 0 ? y2 : 0);
  return (Math.sign(d) * Math.sqrt(Math.abs(d))) / baba;
}
function sdPolygon2(px, py, v) {
  let d = (px - v[0][0]) ** 2 + (py - v[0][1]) ** 2, s = 1;
  for (let i = 0, j = v.length - 1; i < v.length; j = i, i++) {
    const ex = v[j][0] - v[i][0], ey = v[j][1] - v[i][1];
    const wx = px - v[i][0], wy = py - v[i][1];
    const t = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey || 1e-9)));
    const bx = wx - ex * t, by = wy - ey * t;
    d = Math.min(d, bx * bx + by * by);
    const c1 = py >= v[i][1], c2 = py < v[j][1], c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}

// Euler (deg, XYZ order) → inverse rotation matrix rows, to map p → local.
function invRot(rot) {
  const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rot[0] * Math.PI / 180, rot[1] * Math.PI / 180, rot[2] * Math.PI / 180));
  m.invert();
  const e = m.elements; // column-major
  return [e[0], e[4], e[8], e[1], e[5], e[9], e[2], e[6], e[10]];
}

// Compile a shape tuple into {sdf(x,y,z), aabb, col, opts}
export function compileShape(t, pal) {
  const kind = t[0];
  let sdf, aabb, colKey, opts;
  const col = (k) => resolveCol(k, pal);
  const R = (o) => (o && o.rot ? invRot(o.rot) : null);
  if (kind === 'sph' || kind === 'ell' || kind === 'box' || kind === 'tor' || kind === 'poly') {
    const c = t[1];
    let ext;
    if (kind === 'sph') { const r = t[2]; colKey = t[3]; opts = t[4] || {}; ext = r; sdf = (x, y, z) => Math.hypot(x, y, z) - r; }
    else if (kind === 'ell') { const r = t[2]; colKey = t[3]; opts = t[4] || {}; ext = Math.max(r[0], r[1], r[2]); sdf = (x, y, z) => sdEllipsoid(x, y, z, r[0], r[1], r[2]); }
    else if (kind === 'box') { const h = t[2]; colKey = t[3]; opts = t[4] || {}; const rr = Math.min(opts.round || 0, h[0], h[1], h[2]); ext = Math.hypot(h[0], h[1], h[2]); sdf = (x, y, z) => sdRoundBox(x, y, z, h[0], h[1], h[2], rr); }
    else if (kind === 'tor') {
      const RR = t[2], r = t[3]; colKey = t[4]; opts = t[5] || {}; ext = RR + r;
      const ax = opts.axis || 'y';
      sdf = ax === 'y' ? (x, y, z) => Math.hypot(Math.hypot(x, z) - RR, y) - r
        : ax === 'x' ? (x, y, z) => Math.hypot(Math.hypot(y, z) - RR, x) - r
          : (x, y, z) => Math.hypot(Math.hypot(x, y) - RR, z) - r;
    } else { // poly
      const pts = t[2], h = t[3]; colKey = t[4]; opts = t[5] || {};
      let m = 0; for (const p of pts) m = Math.max(m, Math.hypot(p[0], p[1]));
      ext = Math.hypot(m, h);
      const plane = opts.plane || 'xy';
      const ex = (d2, w) => { const a = Math.max(d2, 0), b = Math.max(w, 0); return Math.min(Math.max(d2, w), 0) + Math.hypot(a, b); };
      sdf = plane === 'xy' ? (x, y, z) => ex(sdPolygon2(x, y, pts), Math.abs(z) - h)
        : plane === 'zy' ? (x, y, z) => ex(sdPolygon2(z, y, pts), Math.abs(x) - h)
          : (x, y, z) => ex(sdPolygon2(x, z, pts), Math.abs(y) - h);
    }
    const rm = R(opts);
    const base = sdf;
    if (rm) sdf = (x, y, z) => { const dx = x - c[0], dy = y - c[1], dz = z - c[2]; return base(rm[0] * dx + rm[1] * dy + rm[2] * dz, rm[3] * dx + rm[4] * dy + rm[5] * dz, rm[6] * dx + rm[7] * dy + rm[8] * dz); };
    else sdf = (x, y, z) => base(x - c[0], y - c[1], z - c[2]);
    aabb = [c[0] - ext, c[1] - ext, c[2] - ext, c[0] + ext, c[1] + ext, c[2] + ext];
    if (!rm && kind === 'ell') { const r = t[2]; aabb = [c[0] - r[0], c[1] - r[1], c[2] - r[2], c[0] + r[0], c[1] + r[1], c[2] + r[2]]; }
    if (!rm && kind === 'box') { const h = t[2]; aabb = [c[0] - h[0], c[1] - h[1], c[2] - h[2], c[0] + h[0], c[1] + h[1], c[2] + h[2]]; }
  } else if (kind === 'cap' || kind === 'cyl') {
    const a = t[1], b = t[2];
    let r1, r2;
    if (kind === 'cap') { r1 = t[3]; r2 = t[4]; colKey = t[5]; opts = t[6] || {}; }
    else { r1 = r2 = t[3]; colKey = t[4]; opts = t[5] || {}; }
    const s = { ax: a[0], ay: a[1], az: a[2], bx: b[0] - a[0], by: b[1] - a[1], bz: b[2] - a[2], r1, r2, r: r1 };
    s.l2 = s.bx * s.bx + s.by * s.by + s.bz * s.bz || 1e-9;
    s.rr = r1 - r2; s.a2 = s.l2 - s.rr * s.rr; s.il2 = 1 / s.l2;
    sdf = kind === 'cap' ? (x, y, z) => sdRoundCone(x, y, z, s) : (x, y, z) => sdCylinder(x, y, z, s);
    const m = Math.max(r1, r2);
    aabb = [Math.min(a[0], b[0]) - m, Math.min(a[1], b[1]) - m, Math.min(a[2], b[2]) - m, Math.max(a[0], b[0]) + m, Math.max(a[1], b[1]) + m, Math.max(a[2], b[2]) + m];
    opts._seg = s; // for tip painting
  } else {
    throw new Error('voxel: unknown shape ' + kind);
  }
  if (opts.noise) {
    const amp = opts.noise, base = sdf, sc = opts.noiseScale || 0.08;
    sdf = (x, y, z) => base(x, y, z) + amp * (vnoise3(x / sc, y / sc, z / sc) * 2 - 1);
    aabb = aabb.map((v, i) => (i < 3 ? v - amp : v + amp));
  }
  if (opts.fat) { const f = opts.fat, base = sdf; sdf = (x, y, z) => base(x, y, z) - f; aabb = aabb.map((v, i) => (i < 3 ? v - f : v + f)); }
  return { sdf, aabb, col: col(colKey), colKey, opts, pal };
}

export function resolveCol(k, pal) {
  if (k == null) return 0xff00ff;
  if (typeof k === 'number') return k;
  if (k[0] === '#') return parseColor(k);
  if (pal && pal[k] != null) return parseColor(pal[k]);
  return 0xff00ff;
}

// Expand mirrored shapes into explicit pairs (mirror = evaluate at -x).
function expandMirror(shapes) {
  const out = [];
  for (const s of shapes) {
    out.push({ s, mx: false });
    if (s.opts.m) out.push({ s, mx: true });
  }
  return out;
}

const _n = [0, 0, 0];
function gradient(f, x, y, z, e) {
  _n[0] = f(x + e, y, z) - f(x - e, y, z);
  _n[1] = f(x, y + e, z) - f(x, y - e, z);
  _n[2] = f(x, y, z + e) - f(x, y, z - e);
  const l = Math.hypot(_n[0], _n[1], _n[2]) || 1;
  _n[0] /= l; _n[1] /= l; _n[2] /= l;
  return _n;
}

// Paint a voxel colour for shape `sh` at model point (x,y,z) (already mirrored if needed).
function paintColor(sh, x, y, z, i, j, k, vs) {
  const o = sh.opts, pal = sh.pal;
  let c = sh.col;
  if (o.grad) {
    const g = o.grad, v = g.axis === 'x' ? x : g.axis === 'z' ? z : y;
    const t = Math.max(0, Math.min(1, (v - g.a) / ((g.b - g.a) || 1e-6)));
    c = mixRGB(c, resolveCol(g.to, pal), t);
  }
  if (o.belly || o.top || o.front || o.back || o.side) {
    const n = gradient(sh.sdf, x, y, z, vs * 0.75);
    if (o.belly && n[1] < -(o.bellyT ?? 0.25)) c = resolveCol(o.belly, pal);
    if (o.top && n[1] > (o.topT ?? 0.55)) c = resolveCol(o.top, pal);
    if (o.front && n[2] > (o.frontT ?? 0.55)) c = resolveCol(o.front, pal);
    if (o.back && n[2] < -(o.backT ?? 0.55)) c = resolveCol(o.back, pal);
    if (o.side && Math.abs(n[0]) > (o.sideT ?? 0.6)) c = resolveCol(o.side, pal);
  }
  if (o.tip && o._seg) {
    const s = o._seg;
    const t = ((x - s.ax) * s.bx + (y - s.ay) * s.by + (z - s.az) * s.bz) * s.il2;
    if (t > (o.tipT ?? 0.7)) c = resolveCol(o.tip, pal);
  }
  if (o.stripes) {
    const st = o.stripes, v = st.axis === 'x' ? x : st.axis === 'z' ? z : y;
    const m = (((v - (st.o || 0)) % st.p) + st.p) % st.p;
    if (m < st.w) c = resolveCol(st.col, pal);
  }
  if (o.spots) {
    const sp = o.spots, sc = sp.s || 0.06;
    if (vnoise3(x / sc + (sp.seed || 0), y / sc, z / sc) > 1 - (sp.d ?? 0.25)) c = resolveCol(sp.col, pal);
  }
  if (o.dither) {
    const d = o.dither;
    if (hash3(i * 7 + 3, j * 13 + 1, k * 5 + 11) < (d.amt ?? 0.3)) c = resolveCol(d.col, pal);
  }
  const jit = o.jit ?? 0.07;
  if (jit > 0) c = scaleRGB(c, 1 + (hash3(i, j, k) - 0.5) * 2 * jit);
  return c;
}

// Voxelize shapes on the lattice (centres at integer multiples of vs).
export function voxelize(shapeTuples, { vs, pal, pad = 1 }) {
  const compiled = shapeTuples.map((t) => compileShape(t, pal));
  const list = expandMirror(compiled);
  if (!list.length) return new VoxelGrid(0, 0, 0, 1, 1, 1, vs);
  let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const { s, mx: m } of list) {
    if (s.opts.sub || s.opts.paint) continue;
    const b = s.aabb;
    const x0 = m ? -b[3] : b[0], x1 = m ? -b[0] : b[3];
    mn[0] = Math.min(mn[0], x0); mx[0] = Math.max(mx[0], x1);
    mn[1] = Math.min(mn[1], b[1]); mx[1] = Math.max(mx[1], b[4]);
    mn[2] = Math.min(mn[2], b[2]); mx[2] = Math.max(mx[2], b[5]);
  }
  if (!Number.isFinite(mn[0])) return new VoxelGrid(0, 0, 0, 1, 1, 1, vs);
  const lo = mn.map((v) => Math.floor(v / vs) - pad), hi = mx.map((v) => Math.ceil(v / vs) + pad);
  const g = new VoxelGrid(lo[0], lo[1], lo[2], hi[0] - lo[0] + 1, hi[1] - lo[1] + 1, hi[2] - lo[2] + 1, vs);
  const half = vs * 0.5;
  for (const { s, mx: m } of list) {
    const o = s.opts;
    const b = s.aabb;
    const bx0 = m ? -b[3] : b[0], bx1 = m ? -b[0] : b[3];
    const i0 = Math.max(0, Math.floor((bx0 - half) / vs) - g.ox), i1 = Math.min(g.nx - 1, Math.ceil((bx1 + half) / vs) - g.ox);
    const j0 = Math.max(0, Math.floor((b[1] - half) / vs) - g.oy), j1 = Math.min(g.ny - 1, Math.ceil((b[4] + half) / vs) - g.oy);
    const k0 = Math.max(0, Math.floor((b[2] - half) / vs) - g.oz), k1 = Math.min(g.nz - 1, Math.ceil((b[5] + half) / vs) - g.oz);
    const thr = o.thr ?? 0;
    const glow = o.glow ? Math.min(3, o.glow | 0 || 1) : 0;
    for (let i = i0; i <= i1; i++) {
      const wx = (i + g.ox) * vs, ex = m ? -wx : wx;
      for (let j = j0; j <= j1; j++) {
        const wy = (j + g.oy) * vs;
        for (let k = k0; k <= k1; k++) {
          const wz = (k + g.oz) * vs;
          if (s.sdf(ex, wy, wz) > thr) continue;
          const id = g.idx(i, j, k);
          if (o.sub) { g.data[id] = 0; continue; }
          if (o.paint && !g.data[id]) continue;
          if (o.under && g.data[id]) continue;
          const c = paintColor(s, ex, wy, wz, i + g.ox, j + g.oy, k + g.oz, vs);
          const gl = o.paint && !o.glow ? (g.data[id] >>> 29) & 3 : glow;
          g.data[id] = (FILLED | (gl << 29) | c) >>> 0;
        }
      }
    }
  }
  return g;
}

// ---------------------------------------------------------------- mesher
// face table: normal, 4 corners (unit cube offsets), tangent axes for AO
const FACES = [
  { n: [1, 0, 0], c: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { n: [-1, 0, 0], c: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 0, 1], c: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]] },
  { n: [0, 0, -1], c: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] },
];
const AO_LEVELS = [0.36, 0.6, 0.82, 1.0];

class GeoBuilder {
  constructor() { this.pos = []; this.nrm = []; this.col = []; this.idx = []; this.n = 0; }
  quad(p, n, cols, flip) {
    for (let q = 0; q < 4; q++) { this.pos.push(p[q][0], p[q][1], p[q][2]); this.nrm.push(n[0], n[1], n[2]); this.col.push(cols[q][0], cols[q][1], cols[q][2]); }
    const b = this.n;
    if (flip) this.idx.push(b + 1, b + 2, b + 3, b + 1, b + 3, b);
    else this.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    this.n += 4;
  }
  build() {
    if (!this.n) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}

// Mesh a grid. offset = model-space point subtracted from positions (pivot).
// Returns { lit: BufferGeometry|null, glow: BufferGeometry|null, faces }.
export function meshGrid(g, { offset = [0, 0, 0], ao = true, glowBoost = [1, 1.6, 2.6, 4.0], occ = null } = {}) {
  // occ(li, lj, lk): optional occupancy in *lattice* coords (e.g. union of all
  // parts of a model) so AO darkens crevices where separate parts meet.
  const solid = occ ? (i, j, k) => occ(i + g.ox, j + g.oy, k + g.oz) : (i, j, k) => g.filled(i, j, k);
  const lit = new GeoBuilder(), glw = new GeoBuilder();
  const vs = g.vs, h = vs * 0.5;
  const P = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const aoV = [0, 0, 0, 0];
  let faces = 0;
  for (let i = 0; i < g.nx; i++) for (let j = 0; j < g.ny; j++) for (let k = 0; k < g.nz; k++) {
    const v = g.data[g.idx(i, j, k)];
    if (!v) continue;
    const glow = (v >>> 29) & 3;
    const rgb = v & 0xffffff;
    const lr = S2L[(rgb >> 16) & 255], lg = S2L[(rgb >> 8) & 255], lb = S2L[rgb & 255];
    const x0 = (i + g.ox) * vs - h - offset[0], y0 = (j + g.oy) * vs - h - offset[1], z0 = (k + g.oz) * vs - h - offset[2];
    for (let f = 0; f < 6; f++) {
      const F = FACES[f], n = F.n;
      if (g.filled(i + n[0], j + n[1], k + n[2])) continue;
      faces++;
      for (let q = 0; q < 4; q++) {
        const c = F.c[q];
        P[q][0] = x0 + c[0] * vs; P[q][1] = y0 + c[1] * vs; P[q][2] = z0 + c[2] * vs;
        let a = 3;
        if (ao && !glow) {
          // the two tangent directions toward this corner
          const ti = [0, 0, 0], tj = [0, 0, 0];
          let ax = 0;
          for (let d = 0; d < 3; d++) {
            if (n[d] !== 0) continue;
            const s = c[d] ? 1 : -1;
            if (ax === 0) ti[d] = s; else tj[d] = s;
            ax++;
          }
          const bi = i + n[0], bj = j + n[1], bk = k + n[2];
          const s1 = solid(bi + ti[0], bj + ti[1], bk + ti[2]) ? 1 : 0;
          const s2 = solid(bi + tj[0], bj + tj[1], bk + tj[2]) ? 1 : 0;
          const cc = solid(bi + ti[0] + tj[0], bj + ti[1] + tj[1], bk + ti[2] + tj[2]) ? 1 : 0;
          a = s1 && s2 ? 0 : 3 - (s1 + s2 + cc);
        }
        aoV[q] = a;
        const m = glow ? glowBoost[glow] : AO_LEVELS[a];
        C[q][0] = lr * m; C[q][1] = lg * m; C[q][2] = lb * m;
      }
      const flip = aoV[0] + aoV[2] < aoV[1] + aoV[3];
      (glow ? glw : lit).quad(P, n, C, flip);
    }
  }
  return { lit: lit.build(), glow: glw.build(), faces };
}

// Cast a ray (from point along dir) through a grid; returns first filled cell centre or null.
export function rayHit(g, from, dir, maxDist = 2) {
  const step = g.vs * 0.35;
  const l = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  const d = [dir[0] / l, dir[1] / l, dir[2] / l];
  for (let t = 0; t < maxDist; t += step) {
    const x = from[0] + d[0] * t, y = from[1] + d[1] * t, z = from[2] + d[2] * t;
    const i = Math.round(x / g.vs) - g.ox, j = Math.round(y / g.vs) - g.oy, k = Math.round(z / g.vs) - g.oz;
    if (g.filled(i, j, k)) return { x, y, z, t };
  }
  return null;
}

// ---------------------------------------------------------------- pixel decals
// Build a 1-pixel-thick voxel slab from rows of characters. cmap: char → colour
// (number/'#hex'/palette key), or {c, glow}. '.' and ' ' are transparent.
// Local frame: +x right, +y up, slab faces +z; centred on (0,0,0).
export function decalGeometry(rows, cmap, px, pal, { depth = 1, mirror = false } = {}) {
  const h = rows.length, w = Math.max(...rows.map((r) => r.length));
  const g = new VoxelGrid(0, 0, 0, w, h, depth, px);
  for (let r = 0; r < h; r++) {
    const row = rows[r];
    for (let c = 0; c < w; c++) {
      const ch = row[mirror ? w - 1 - c : c];
      if (!ch || ch === '.' || ch === ' ') continue;
      const e = cmap[ch];
      if (e == null) continue;
      const isObj = typeof e === 'object';
      const col = resolveCol(isObj ? e.c : e, pal);
      for (let d = 0; d < depth; d++) g.set(c, h - 1 - r, d, col, isObj ? e.glow || 0 : 0);
    }
  }
  // centre: x mid, y mid, z front face at 0
  const off = [((w - 1) * px) / 2, ((h - 1) * px) / 2, (depth - 1) * px + px * 0.5];
  return meshGrid(g, { offset: off, ao: false });
}
