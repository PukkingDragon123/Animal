// Chinatown + Wharf kit: low-poly helpers on top of CityBuilder (free triangles with metre UVs, beams
// between two points, flared hip roofs with glazed tiles, pent eaves, balconies, blade signs, lantern
// strings) and the pixel-art textures they wear (32 px per metre, crisp hard-edged lettering).
import { TX } from '../build.js';
import { ptex, light, dark, hx, css, dith } from '../pixtex.js';

export const PIXFONT = '"DotGothic16", "IPAGothic", "Noto Sans CJK TC", "Courier New", monospace';

// ---------------------------------------------------------------- crisp lettering (hard alpha, no AA)
let TG = null;
const GCACHE = new Map();
function rasterize(str, size, font, weight) {
  const k = str + '|' + size + '|' + font + '|' + weight;
  if (GCACHE.has(k)) return GCACHE.get(k);
  if (!TG) { const c = document.createElement('canvas'); c.width = 1024; c.height = 160; TG = c.getContext('2d', { willReadFrequently: true }); }
  TG.font = `${weight} ${size}px ${font}`;
  const w = Math.ceil(TG.measureText(str).width) + 4, h = Math.ceil(size * 1.4) + 4;
  TG.clearRect(0, 0, Math.min(1024, w + 4), Math.min(160, h + 4));
  TG.fillStyle = '#fff'; TG.textBaseline = 'middle'; TG.textAlign = 'left';
  TG.fillText(str, 2, Math.round(h / 2));
  const d = TG.getImageData(0, 0, Math.min(1024, w), Math.min(160, h)).data, W = Math.min(1024, w), pts = [];
  let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
  for (let j = 0; j < Math.min(160, h); j++) for (let i = 0; i < W; i++) if (d[(j * W + i) * 4 + 3] > 120) { pts.push(i, j); if (i < minX) minX = i; if (i > maxX) maxX = i; if (j < minY) minY = j; if (j > maxY) maxY = j; }
  const R = { pts, minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
  if (!pts.length) Object.assign(R, { minX: 0, minY: 0, w: 0, h: 0 });
  GCACHE.set(k, R); return R;
}
/** crisp pixel text centred at (cx, cy); o: { font, weight, outline, shadow, vertical, gap, fit (max width px) } → width */
export function crisp(P, str, cx, cy, size, col, o = {}) {
  const font = o.font || PIXFONT, weight = o.weight || 400;
  if (o.vertical) {
    const chars = [...str], gap = o.gap ?? Math.round(size * 0.12), Rs = chars.map((ch) => rasterize(ch, size, font, weight));
    const tot = Rs.reduce((a, R) => a + Math.max(R.h, size * 0.8) + gap, -gap); let y = cy - tot / 2;
    for (const R of Rs) { const hh = Math.max(R.h, size * 0.8); blit(P, R, Math.round(cx - R.w / 2), Math.round(y + (hh - R.h) / 2), col, o); y += hh + gap; }
    return size;
  }
  const R = rasterize(str, size, font, weight);
  blit(P, R, Math.round(cx - R.w / 2), Math.round(cy - R.h / 2), col, o);
  return R.w;
}
export const textW = (str, size, o = {}) => rasterize(str, size, o.font || PIXFONT, o.weight || 400).w;
function blit(P, R, x0, y0, col, o) {
  const g = P.g, put = (dx, dy, c) => { g.fillStyle = c; for (let k = 0; k < R.pts.length; k += 2) g.fillRect(x0 + R.pts[k] - R.minX + dx, y0 + R.pts[k + 1] - R.minY + dy, 1, 1); };
  if (o.outline) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) put(dx, dy, o.outline);
  if (o.shadow) put(1, 1, o.shadow);
  put(0, 0, col);
}

// ---------------------------------------------------------------- geometry
const V = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], len: (a) => Math.hypot(a[0], a[1], a[2]),
  nrm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};
export { V };
/** one triangle with explicit UVs in metres (divided by the texture size); o.up flips it to face upward */
export function tri3(C, gk, tex, a, b, c, ua, ub, uc, o = {}) {
  let n = V.cross(V.sub(b, a), V.sub(c, a)); const l = V.len(n); if (l < 1e-6) return;
  if (o.up && n[1] < 0) { [b, c] = [c, b]; [ub, uc] = [uc, ub]; n = V.mul(n, -1); }
  n = V.mul(n, 1 / l);
  const A = C.acc(gk, tex), [tw, th] = tex.userData.size, base = A.P.length / 3;
  for (const [p, u] of [[a, ua], [b, ub], [c, uc]]) { A.P.push(p[0], p[1], p[2]); A.N.push(n[0], n[1], n[2]); A.U.push(u[0] / tw, u[1] / th); }
  A.I.push(base, base + 1, base + 2);
}
/** quad a-b-c-d with explicit metre UVs */
export function quad4(C, gk, tex, a, b, c, d, ua, ub, uc, ud, o) { tri3(C, gk, tex, a, b, c, ua, ub, uc, o); tri3(C, gk, tex, a, c, d, ua, uc, ud, o); }
/** a square-section beam from p to q (w wide, h tall), e.g. hip ridges, cords, rails, diagonal braces */
export function beam(C, gk, tex, p, q, w = 0.1, h = w, o = {}) {
  const d = V.sub(q, p), L = V.len(d); if (L < 1e-4) return;
  const dn = V.mul(d, 1 / L); let s = V.cross(dn, [0, 1, 0]); if (V.len(s) < 1e-3) s = [1, 0, 0]; s = V.mul(V.nrm(s), w / 2);
  const u = V.mul(V.nrm(V.cross(s, dn)), h / 2);
  const P = (base, ks, ku) => V.add(V.add(base, V.mul(s, ks)), V.mul(u, ku));
  const a0 = P(p, -1, -1), a1 = P(p, 1, -1), a2 = P(p, 1, 1), a3 = P(p, -1, 1), b0 = P(q, -1, -1), b1 = P(q, 1, -1), b2 = P(q, 1, 1), b3 = P(q, -1, 1);
  const uv = (x) => [[0, 0], [L, 0], [L, x], [0, x]];
  const f = (A, B, Cc, D, x) => { const t = uv(x); quad4(C, gk, tex, A, B, Cc, D, t[0], t[1], t[2], t[3]); };
  f(a3, b3, b2, a2, w); f(a1, b1, b0, a0, w); f(a2, b2, b1, a1, h); f(a0, b0, b3, a3, h);
  if (o.caps !== false) { quad4(C, gk, tex, a0, a3, a2, a1, [0, 0], [0, h], [w, h], [w, 0]); quad4(C, gk, tex, b1, b2, b3, b0, [0, 0], [0, h], [w, h], [w, 0]); }
}
/** a box with one texture fitted per face (sign boards, cabinets): o.s/n/e/w/top: textures fitted to that face */
export function fbox(C, gk, base, x0, y0, z0, x1, y1, z1, o = {}) {
  C.box(gk, base, x0, y0, z0, x1, y1, z1, { top: o.topTile || base, skip: o.skip });
  const off = 0.004;
  if (o.s) C.decal(gk, o.s, (x0 + x1) / 2, y0, z1, 's', x1 - x0, y1 - y0, { off });
  if (o.n) C.decal(gk, o.n, (x0 + x1) / 2, y0, z0, 'n', x1 - x0, y1 - y0, { off });
  if (o.e) C.decal(gk, o.e, x1, y0, (z0 + z1) / 2, 'e', z1 - z0, y1 - y0, { off });
  if (o.w) C.decal(gk, o.w, x0, y0, (z0 + z1) / 2, 'w', z1 - z0, y1 - y0, { off });
  if (o.top) C.quad(gk, o.top, [x0, y1 + off, z1], [x1, y1 + off, z1], [x1, y1 + off, z0], [x0, y1 + off, z0], { fit: true });
}
/** a flat picture lying on the ground (rugs, inlays, boards): centre (x, z), size w × d, at height y */
export function floorDecal(C, gk, tex, x, y, z, w, d, o = {}) {
  const hw = w / 2, hd = d / 2;
  if (o.rot) C.quad(gk, tex, [x + hw, y, z + hd], [x + hw, y, z - hd], [x - hw, y, z - hd], [x - hw, y, z + hd], { fit: true });
  else C.quad(gk, tex, [x - hw, y, z + hd], [x + hw, y, z + hd], [x + hw, y, z - hd], [x - hw, y, z - hd], { fit: true });
}

/**
 * A Chinese hip roof: glazed barrel tiles on a concave two-pitch profile, corners flaring up, a fascia of
 * round eave-tile ends, ridge + hip ridges in capCol and curled ridge-end ornaments.
 * o: { x0, z0, x1, z1 (wall rect), y (eave base), e (overhang), rh (rise), tex, eave (fascia tex), cap (tex), flare, skirt (only the lower band, as a lower tier), inset (skirt depth), n }
 */
export function hipRoof(C, gk, o) {
  const e = o.e ?? 0.8, flare = o.flare ?? 0.5, n = o.n || 8, tex = o.tex || tiles('#3f8a5a'), cap = o.cap || TX.solid(o.capCol || '#2e6a44');
  const X0 = o.x0 - e, Z0 = o.z0 - e, X1 = o.x1 + e, Z1 = o.z1 + e, W = X1 - X0, D = Z1 - Z0, m = Math.min(W, D) / 2;
  const y = o.y, rh = o.rh ?? Math.min(W, D) * 0.42;
  const L1 = o.skirt ? (o.inset ?? m * 0.5) : Math.min(m * 0.45, e + 0.5), h1 = o.skirt ? (o.drop ?? L1 * 0.5) : rh * 0.3;
  // rings: rectangle corners [SW, SE, NE, NW] at a height, with the corner flare factor
  const rect = (ins, yy, fl) => ({ c: [[X0 + ins, Z1 - ins], [X1 - ins, Z1 - ins], [X1 - ins, Z0 + ins], [X0 + ins, Z0 + ins]], y: yy, fl });
  const rings = [rect(0, y, flare), rect(L1, y + h1, flare * 0.35)];
  if (!o.skirt) {
    const ridgeX = W >= D, ins = m;
    const c = ridgeX ? [[X0 + ins, (Z0 + Z1) / 2], [X1 - ins, (Z0 + Z1) / 2], [X1 - ins, (Z0 + Z1) / 2], [X0 + ins, (Z0 + Z1) / 2]] : [[(X0 + X1) / 2, Z1 - ins], [(X0 + X1) / 2, Z1 - ins], [(X0 + X1) / 2, Z0 + ins], [(X0 + X1) / 2, Z0 + ins]];
    rings.push({ c, y: y + rh, fl: 0 });
  }
  // a point on ring r, side s (0 S, 1 E, 2 N, 3 W), parameter i / n
  const pt = (R, s, i) => {
    const a = R.c[s], b = R.c[(s + 1) % 4], t = i / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
    const k = Math.pow(Math.abs(2 * t - 1), 3), lift = R.fl * k, out = R.fl * 0.5 * k;
    const nx = [0, 1, 0, -1][s], nz = [1, 0, -1, 0][s];
    // push the corners outward along both side normals
    const tx = (b[0] - a[0]), tz = (b[1] - a[1]), tl = Math.hypot(tx, tz) || 1, dir = t < 0.5 ? -1 : 1;
    return [x + nx * out + (tx / tl) * out * dir * 0.6, R.y + lift, z + nz * out + (tz / tl) * out * dir * 0.6];
  };
  const uAt = (s, p) => [p[0], -p[2], -p[0], p[2]][s];
  const fasciaTex = o.eave || eaveTiles(o.eaveCol || '#2e6a44');
  for (let s = 0; s < 4; s++) {
    let prev = null, vprev = null;
    for (let r = 0; r < rings.length; r++) {
      const row = []; for (let i = 0; i <= n; i++) row.push(pt(rings[r], s, i));
      const v = row.map((p, i) => (prev ? vprev[i] + V.len(V.sub(p, prev[i])) : 0));
      if (prev) for (let i = 0; i < n; i++) {
        const a = prev[i], b = prev[i + 1], c2 = row[i + 1], d = row[i];
        quad4(C, gk, tex, a, b, c2, d, [uAt(s, a), vprev[i]], [uAt(s, b), vprev[i + 1]], [uAt(s, c2), v[i + 1]], [uAt(s, d), v[i]], { up: true });
      }
      if (r === 0) {
        // fascia: a short vertical strip of round tile ends under the eave line
        for (let i = 0; i < n; i++) { const a = row[i], b = row[i + 1], fh = 0.2; quad4(C, gk, fasciaTex, [a[0], a[1] - fh, a[2]], [b[0], b[1] - fh, b[2]], b, a, [uAt(s, a), 0], [uAt(s, b), 0], [uAt(s, b), fh], [uAt(s, a), fh]); }
      }
      prev = row; vprev = v;
    }
  }
  // hip ridges along the corner lines, the main ridge, curled ends, corner hooks
  const corner = (R, k) => pt(R, k, 0);
  for (let k = 0; k < 4; k++) {
    for (let r = 0; r + 1 < rings.length; r++) beam(C, gk, cap, V.add(corner(rings[r], k), [0, 0.08, 0]), V.add(corner(rings[r + 1], k), [0, 0.1, 0]), 0.2, 0.18);
    const c0 = corner(rings[0], k), cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2, ox = Math.sign(c0[0] - cx), oz = Math.sign(c0[2] - cz);
    beam(C, gk, cap, V.add(c0, [0, 0.05, 0]), V.add(c0, [ox * 0.32, 0.5 + flare * 0.3, oz * 0.32]), 0.16, 0.16);
    if (o.hookCol) beam(C, gk, TX.solid(o.hookCol), V.add(c0, [ox * 0.3, 0.45 + flare * 0.3, oz * 0.3]), V.add(c0, [ox * 0.42, 0.62 + flare * 0.3, oz * 0.42]), 0.12, 0.12);
  }
  if (!o.skirt) {
    const R = rings[2], a = [R.c[0][0], R.y, R.c[0][1]], b = [R.c[2][0], R.y, R.c[2][1]];
    const ridgeTex = o.ridgeTex || cap;
    if (V.len(V.sub(a, b)) > 0.05) beam(C, gk, ridgeTex, V.add(a, [0, 0.12, 0]), V.add(b, [0, 0.12, 0]), 0.3, 0.34);
    // ridge-end ornaments: curling tails (or a finial for a pyramid)
    if (V.len(V.sub(a, b)) > 0.4) for (const [p, q] of [[a, b], [b, a]]) { const dd = V.nrm(V.sub(p, q)); beam(C, gk, cap, V.add(p, [0, 0.2, 0]), V.add(p, [dd[0] * 0.35, 0.95, dd[2] * 0.35]), 0.22, 0.22); beam(C, gk, TX.solid(o.hookCol || '#d8a83a'), V.add(p, [dd[0] * 0.35, 0.95, dd[2] * 0.35]), V.add(p, [dd[0] * 0.1, 1.15, dd[2] * 0.1]), 0.16, 0.16); }
    else if (o.finial !== false) { const c = [(a[0] + b[0]) / 2, R.y, (a[2] + b[2]) / 2], g = TX.solid(o.hookCol || '#e0b040'); C.box(gk, g, c[0] - 0.18, c[1], c[2] - 0.18, c[0] + 0.18, c[1] + 0.5, c[2] + 0.18); C.box(gk, g, c[0] - 0.28, c[1] + 0.5, c[2] - 0.28, c[0] + 0.28, c[1] + 0.95, c[2] + 0.28); C.box(gk, g, c[0] - 0.08, c[1] + 0.95, c[2] - 0.08, c[0] + 0.08, c[1] + 1.5, c[2] + 0.08); }
  }
  return { top: y + (o.skirt ? h1 : rh), ring1: rings[1] };
}
/** a single-pitch tiled pent eave along a wall side (shopfront canopies, top-of-facade eaves) */
export function pent(C, gk, sd, a, b, y, dep = 0.9, drop = 0.4, o = {}) {
  // a, b: [x, z] ends of the wall line; the eave sticks out on side sd
  const nx = { s: 0, n: 0, e: 1, w: -1 }[sd], nz = { s: 1, n: -1, e: 0, w: 0 }[sd], tex = o.tex || tiles(o.col || '#3f8a5a'), fl = o.flare ?? 0.22, ext = o.ext ?? 0.25;
  const along = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(along[0], along[1]), ux = along[0] / L, uz = along[1] / L, n = Math.max(2, Math.round(L / 1.2));
  const A = [a[0] - ux * ext, a[1] - uz * ext], Bp = [b[0] + ux * ext, b[1] + uz * ext], LL = L + ext * 2;
  const back = [], front = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, k = Math.pow(Math.abs(2 * t - 1), 4), x = A[0] + (Bp[0] - A[0]) * t, z = A[1] + (Bp[1] - A[1]) * t;
    back.push([x + nx * 0.02, y, z + nz * 0.02]); front.push([x + nx * (dep + k * 0.15), y - drop + k * fl, z + nz * (dep + k * 0.15)]);
  }
  const U = (p) => (sd === 's' || sd === 'n' ? p[0] : p[2]), sl = Math.hypot(dep, drop), fasciaTex = o.eave || eaveTiles(o.eaveCol || dark(o.col || '#3f8a5a', 0.2));
  for (let i = 0; i < n; i++) {
    quad4(C, gk, tex, front[i], front[i + 1], back[i + 1], back[i], [U(front[i]), 0], [U(front[i + 1]), 0], [U(back[i + 1]), sl], [U(back[i]), sl], { up: true });
    const f0 = front[i], f1 = front[i + 1];
    quad4(C, gk, fasciaTex, [f0[0], f0[1] - 0.16, f0[2]], [f1[0], f1[1] - 0.16, f1[2]], f1, f0, [U(f0), 0], [U(f1), 0], [U(f1), 0.16], [U(f0), 0.16]);
  }
  const cap = TX.solid(o.capCol || dark(o.col || '#3f8a5a', 0.3));
  beam(C, gk, cap, [back[0][0], y + 0.06, back[0][2]], [back[n][0], y + 0.06, back[n][2]], 0.16, 0.14);
  for (const i of [0, n]) beam(C, gk, cap, V.add(front[i], [0, 0.04, 0]), V.add(back[i], [0, 0.08, 0]), 0.12, 0.12);
  void LL; void ux;
}
/** a balcony along a wall side between a and b at floor height y: slab, lattice railing, posts */
export function balcony(C, gk, sd, a, b, y, dep = 0.9, o = {}) {
  const nx = { s: 0, n: 0, e: 1, w: -1 }[sd], nz = { s: 1, n: -1, e: 0, w: 0 }[sd], rail = o.rail || lattice(o.railCol || '#c8322a', o.railBg || '#3a2a2a'), slab = TX.solid(o.slab || '#d8d0c0'), post = TX.solid(o.post || o.railCol || '#c8322a');
  const x0 = Math.min(a[0], b[0]) + Math.min(0, nx * dep), x1 = Math.max(a[0], b[0]) + Math.max(0, nx * dep), z0 = Math.min(a[1], b[1]) + Math.min(0, nz * dep), z1 = Math.max(a[1], b[1]) + Math.max(0, nz * dep);
  C.box(gk, slab, x0, y - 0.14, z0, x1, y, z1);
  const rh = o.h ?? 0.95, t = 0.06;
  if (sd === 's' || sd === 'n') {
    const zf = sd === 's' ? z1 : z0;
    C.box(gk, rail, x0, y, zf - t / 2, x1, y + rh, zf + t / 2);
    C.box(gk, rail, x0, y, Math.min(zf, (a[1])), x0 + t, y + rh, Math.max(zf, a[1])); C.box(gk, rail, x1 - t, y, Math.min(zf, a[1]), x1, y + rh, Math.max(zf, a[1]));
    C.box(gk, post, x0 - 0.03, y + rh, zf - 0.07, x1 + 0.03, y + rh + 0.07, zf + 0.07);
    for (let x = x0; x <= x1 + 0.01; x += Math.max(0.8, (x1 - x0) / Math.round((x1 - x0) / 1.4))) C.box(gk, post, x - 0.05, y, zf - 0.05, x + 0.05, y + rh + 0.05, zf + 0.05);
  } else {
    const xf = sd === 'e' ? x1 : x0;
    C.box(gk, rail, xf - t / 2, y, z0, xf + t / 2, y + rh, z1);
    C.box(gk, rail, Math.min(xf, a[0]), y, z0, Math.max(xf, a[0]), y + rh, z0 + t); C.box(gk, rail, Math.min(xf, a[0]), y, z1 - t, Math.max(xf, a[0]), y + rh, z1);
    C.box(gk, post, xf - 0.07, y + rh, z0 - 0.03, xf + 0.07, y + rh + 0.07, z1 + 0.03);
    for (let z = z0; z <= z1 + 0.01; z += Math.max(0.8, (z1 - z0) / Math.round((z1 - z0) / 1.4))) C.box(gk, post, xf - 0.05, y, z - 0.05, xf + 0.05, y + rh + 0.05, z + 0.05);
  }
}
/** a vertical blade sign standing out from a wall at (x, z) on side sd: thin board w out × h tall with art on both faces */
export function bladeSign(C, gk, sd, x, z, y, tex, w = 0.7, h = 2.2, o = {}) {
  const t = 0.1, frame = TX.solid(o.frame || '#d8a83a'), br = TX.solid('#2a2a30');
  if (sd === 'e' || sd === 'w') {
    const s = sd === 'e' ? 1 : -1, xa = x + s * 0.25, xb = x + s * (0.25 + w), x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
    C.box(gk, frame, x0 - 0.04, y - 0.04, z - t / 2 - 0.01, x1 + 0.04, y + h + 0.04, z + t / 2 + 0.01);
    C.decal(gk, tex, (x0 + x1) / 2, y, z + t / 2 + 0.01, 's', x1 - x0, h, { off: 0.005 }); C.decal(gk, tex, (x0 + x1) / 2, y, z - t / 2 - 0.01, 'n', x1 - x0, h, { off: 0.005 });
    C.box(gk, br, Math.min(x, xa), y + h - 0.12, z - 0.03, Math.max(x, xa), y + h - 0.04, z + 0.03); C.box(gk, br, Math.min(x, xa), y + 0.1, z - 0.03, Math.max(x, xa), y + 0.18, z + 0.03);
  } else {
    const s = sd === 's' ? 1 : -1, za = z + s * 0.25, zb = z + s * (0.25 + w), z0 = Math.min(za, zb), z1 = Math.max(za, zb);
    C.box(gk, frame, x - t / 2 - 0.01, y - 0.04, z0 - 0.04, x + t / 2 + 0.01, y + h + 0.04, z1 + 0.04);
    C.decal(gk, tex, x + t / 2 + 0.01, y, (z0 + z1) / 2, 'e', z1 - z0, h, { off: 0.005 }); C.decal(gk, tex, x - t / 2 - 0.01, y, (z0 + z1) / 2, 'w', z1 - z0, h, { off: 0.005 });
    C.box(gk, br, x - 0.03, y + h - 0.12, Math.min(z, za), x + 0.03, y + h - 0.04, Math.max(z, za)); C.box(gk, br, x - 0.03, y + 0.1, Math.min(z, za), x + 0.03, y + 0.18, Math.max(z, za));
  }
}
/** a sagging cord between two points with n + 1 lanterns hanging from it (and the cord drawn) */
export function lanternString(C, x0, z0, x1, z1, y, n = 6, o = {}) {
  const sag = o.sag ?? 0.55, cord = TX.solid(o.cord || '#3a2422'), pts = [];
  const N = Math.max(4, n * 2);
  for (let i = 0; i <= N; i++) { const t = i / N; pts.push([x0 + (x1 - x0) * t, y - Math.sin(t * Math.PI) * sag, z0 + (z1 - z0) * t]); }
  for (let i = 0; i < N; i++) beam(C, o.gk || 'props', cord, pts[i], pts[i + 1], 0.035, 0.035, { caps: false });
  for (let i = 1; i < n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; C.props.push({ kind: o.kind || 'lantern', x, y: y - Math.sin(t * Math.PI) * sag - 1.0 + 0.04, z, yaw: 0 }); }
}
/** a red lacquered column with gold bands and a stone base */
export function column(C, gk, x, z, y0, y1, r = 0.22, o = {}) {
  const lac = lacquer(o.col || '#b8282a'), gold = TX.solid(o.band || '#d8a83a'), stone = TX.concrete(o.stone || '#a8a49c');
  C.box(gk, stone, x - r - 0.08, y0, z - r - 0.08, x + r + 0.08, y0 + 0.28, z + r + 0.08);
  C.box(gk, lac, x - r, y0 + 0.28, z - r, x + r, y1, z + r);
  C.box(gk, gold, x - r - 0.02, y1 - 0.32, z - r - 0.02, x + r + 0.02, y1 - 0.22, z + r + 0.02);
  if (o.collide !== false) C.nav.block(x - r - 0.05, z - r - 0.05, x + r + 0.05, z + r + 0.05, o.L || 0);
}
/** wall line helpers for a building record B: side → [ax, az, bx, bz] (as the engine walks them) */
export function sideLine(B, sd) { const { x, z, w, d } = B; return { s: [x, z + d, x + w, z + d], e: [x + w, z + d, x + w, z], n: [x + w, z, x, z], w: [x, z, x, z + d] }[sd]; }
export function sidePt(B, sd, s) { const [ax, az, bx, bz] = sideLine(B, sd), L = Math.hypot(bx - ax, bz - az); return [ax + ((bx - ax) / L) * s, az + ((bz - az) / L) * s]; }
export const sideLen = (B, sd) => (sd === 's' || sd === 'n' ? B.w : B.d);
export const outN = (sd) => ({ s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] }[sd]);

// ---------------------------------------------------------------- textures
export const tiles = (base = '#3f8a5a') => ptex('ct_tiles' + base, 2, 2, (g, W, H, r, P) => {
  P.fill(dark(base, 0.5));
  for (let x = 0; x < W; x += 6) {
    for (let y = 0; y < H; y += 8) {
      const k = (r() - 0.5) * 0.12, c = k > 0 ? light(base, k) : dark(base, -k);
      P.rect(x + 1, y, 4, 8, c); P.vline(x + 2, y + 1, 6, light(c, 0.28)); P.vline(x + 1, y, 8, dark(c, 0.12)); P.vline(x + 4, y, 8, dark(c, 0.25));
      P.hline(x + 1, y, 4, dark(c, 0.35)); P.px(x + 2, y + 1, light(c, 0.5));
    }
    P.vline(x + 5, 0, H, dark(base, 0.55)); P.vline(x, 0, H, dark(base, 0.35));
  }
  P.speck(18, light(base, 0.6), r);
});
export const eaveTiles = (base = '#2e6a44') => ptex('ct_eave' + base, 1, 0.2, (g, W, H, r, P) => {
  P.fill(dark(base, 0.35));
  for (let x = 0; x < W; x += 6) { P.rect(x + 1, 1, 4, H - 2, base); P.px(x + 2, 2, light(base, 0.4)); P.hline(x + 1, H - 2, 4, dark(base, 0.2)); P.px(x + 3, 3, light(base, 0.15)); }
  P.hline(0, 0, W, dark(base, 0.5));
});
export const lacquer = (c = '#b8282a') => ptex('ct_lac' + c, 1, 1, (g, W, H, r, P) => { P.fill(c); for (let x = 0; x < W; x += 3 + Math.floor(r() * 3)) P.vline(x, 0, H, r() < 0.5 ? light(c, 0.06) : dark(c, 0.08)); P.speck(14, light(c, 0.25), r); });
export const lattice = (frame = '#c8322a', bg = '#3a2a2a') => ptex('ct_lat' + frame + bg, 1, 1, (g, W, H, r, P) => {
  P.fill(bg);
  for (let y = 0; y < H; y += 8) for (let x = 0; x < W; x += 8) { P.rect(x, y, 8, 1, frame); P.rect(x, y, 1, 8, frame); P.rect(x + 3, y + 3, 3, 1, frame); P.rect(x + 3, y + 3, 1, 3, frame); P.px(x + 1, y + 1, light(frame, 0.25)); }
  P.rect(0, 0, W, 2, frame); P.rect(0, H - 2, W, 2, dark(frame, 0.2));
});
/** painted beam: teal and blue bands, a gold-edged cartouche, white strokes (gates, pavilions) */
export const beamPaint = (base = '#2a6a7a') => ptex('ct_beam' + base, 2, 0.5, (g, W, H, r, P) => {
  P.fill(base); P.rect(0, 0, W, 2, '#d8a83a'); P.rect(0, H - 2, W, 2, '#d8a83a'); P.rect(0, 2, W, 1, '#1e3a6a'); P.rect(0, H - 3, W, 1, '#1e3a6a');
  const cx = W / 2; P.rect(cx - 16, 4, 32, H - 8, '#c8322a'); P.rect(cx - 15, 5, 30, H - 10, '#e8c050'); P.rect(cx - 13, 6, 26, H - 12, '#2a4a8a');
  for (let i = 0; i < 6; i++) P.rect(cx - 11 + i * 4, 7, 2, H - 14, i % 2 ? '#5ab0a0' : '#f0e8d0');
  for (const ex of [6, W - 14]) { P.rect(ex, 4, 8, H - 8, '#1e3a6a'); P.rect(ex + 2, 6, 4, H - 12, '#5ab0a0'); P.px(ex + 3, 7, '#f0e8d0'); }
  for (let x = 16; x < cx - 18; x += 6) { P.vline(x, 4, H - 8, '#4a9a8a'); P.vline(x + 1, 5, H - 10, '#f0e8d0'); }
  for (let x = cx + 20; x < W - 16; x += 6) { P.vline(x, 4, H - 8, '#4a9a8a'); P.vline(x + 1, 5, H - 10, '#f0e8d0'); }
});
/** bracket sets (dougong) under the eaves */
export const brackets = () => ptex('ct_brk', 1, 0.5, (g, W, H, r, P) => {
  P.fill('#7a1a1a');
  for (let x = 0; x < W; x += 16) { P.block(x + 2, H - 6, 12, 5, '#2a7a6a'); P.block(x + 4, H - 11, 8, 5, '#3a8a7a'); P.block(x + 1, H - 15, 14, 4, '#2a7a6a'); P.rect(x + 2, H - 7, 12, 1, '#d8a83a'); P.rect(x + 1, H - 16, 14, 1, '#d8a83a'); }
  P.rect(0, 0, W, 1, '#d8a83a');
});
/** a shop or house window, Chinatown style: green frame, lattice transom, maybe a red diamond 福 card */
export const ctWin = (frame = '#2e6a4a', tint = '#4a6a8a', lit = false, fu = false) => ptex('ct_win' + frame + tint + lit + fu, 1, 1.5, (g, W, H, r, P) => {
  P.fill(frame); P.rect(0, 0, W, 1, light(frame, 0.3)); P.rect(0, H - 2, W, 2, dark(frame, 0.35));
  const glass = lit ? '#ffd890' : tint; const tY = 12;
  P.rect(2, 2, W - 4, tY - 3, dark(frame, 0.45));
  for (let x = 3; x < W - 3; x += 4) { P.vline(x, 3, tY - 5, light(frame, 0.2)); }
  P.hline(3, 6, W - 6, light(frame, 0.2));
  P.rect(2, tY, W - 4, H - tY - 3, glass);
  if (!lit) P.dither(2, tY, W - 4, H - tY - 3, light(tint, 0.35), (x, y) => ((x + y * 0.7) % 17 < 4 ? 0.7 : 0.05));
  else P.dither(2, tY, W - 4, H - tY - 3, '#fff0c0', (x, y) => 0.35 - Math.abs(x - W / 2) / W);
  P.vline(Math.floor(W / 2), tY, H - tY - 3, frame); P.hline(2, tY + Math.floor((H - tY) / 2), W - 4, frame);
  if (fu) { const cx = Math.floor(W / 4) + 1, cy = tY + 9; for (let k = 0; k < 5; k++) { P.hline(cx - k, cy - 4 + k, 2 * k + 1, '#d8282a'); P.hline(cx - k, cy + 4 - k, 2 * k + 1, '#d8282a'); } P.px(cx, cy, '#f0c040'); P.hline(cx - 1, cy - 1, 3, '#f0c040'); P.hline(cx - 1, cy + 1, 3, '#f0c040'); }
}, { ppm: 32 });
/** red double door with gold studs and ring pulls (temples, the dojo) or a green shop door */
export const redDoor = (col = '#b8282a', w = 1.6) => ptex('ct_rdoor' + col + w, w, 2.3, (g, W, H, r, P) => {
  P.fill(dark(col, 0.45)); const half = Math.floor(W / 2);
  for (const x0 of [1, half]) {
    P.block(x0, 1, half - 1, H - 2, col, { hk: 0.12, lk: 0.3 });
    for (let y = 8; y < H - 10; y += 8) for (let x = x0 + 4; x < x0 + half - 4; x += 6) { P.px(x, y, '#f0c850'); P.px(x + 1, y, '#a87a28'); P.px(x, y + 1, '#a87a28'); }
  }
  P.vline(half, 0, H, dark(col, 0.6));
  for (const x of [half - 5, half + 3]) { P.rect(x, Math.floor(H * 0.5) - 3, 3, 6, '#e8c050'); P.px(x + 1, Math.floor(H * 0.5), dark(col, 0.5)); }
  P.rect(0, H - 4, W, 4, '#4a3a32');
});
export const shopDoor = (frame = '#2e6a4a') => ptex('ct_sdoor' + frame, 1, 2.2, (g, W, H, r, P) => {
  P.fill(frame); P.rect(3, 3, W - 6, H - 20, '#4a6a88'); P.dither(3, 3, W - 6, H - 20, '#a8c8e0', (x, y) => ((x + y) % 13 < 3 ? 0.7 : 0.08));
  P.rect(3, H - 15, W - 6, 11, dark(frame, 0.2)); P.rect(W - 8, Math.floor(H * 0.5), 3, 6, '#e8c060');
  P.rect(5, 12, W - 10, 6, '#d8282a'); P.hline(7, 15, W - 14, '#f0d060');
});
/** a horizontal shop sign: gold double border, CJK characters on the left, English lettering */
export function signH(en, cjk, bg = '#b8282a', fg = '#f0d060', w = 4, h = 0.7, o = {}) {
  return ptex('ct_signH' + en + cjk + bg + fg + w + h + (o.night ? 'n' : ''), w, h, (g, W, H, r, P) => {
    P.fill(bg); P.rect(0, 0, W, 1, light(bg, 0.25)); P.rect(1, 1, W - 2, 1, fg); P.rect(1, H - 2, W - 2, 1, fg); P.vline(1, 1, H - 2, fg); P.vline(W - 2, 1, H - 2, fg);
    P.rect(0, H - 1, W, 1, dark(bg, 0.5)); P.rect(3, 3, W - 6, 1, dark(bg, 0.2));
    for (const x of [4, W - 6]) { P.rect(x, 4, 2, 2, fg); P.rect(x, H - 6, 2, 2, fg); }
    let cx = W / 2;
    if (cjk) {
      const cs = o.cjkSize || 16, cw = [...cjk].length * (cs + 2);
      crisp(P, cjk, 8 + cw / 2, H / 2, cs, o.cjkCol || fg, { shadow: dark(bg, 0.55) });
      cx = 8 + cw + (W - 8 - cw - 6) / 2 + 2;
      P.vline(8 + cw + 2, 5, H - 10, dark(fg, 0.3));
    }
    crisp(P, en, cx, H / 2, o.size || 16, o.enCol || '#fff4e0', { shadow: dark(bg, 0.6) });
  }, { ppm: 32 });
}
/** a vertical blade sign: characters stacked top to bottom on a coloured board with a border */
export function signV(cjk, bg = '#b8282a', fg = '#f0d060', w = 0.7, h = 2.2, o = {}) {
  return ptex('ct_signV' + cjk + bg + fg + w + h + (o.sub || ''), w, h, (g, W, H, r, P) => {
    P.fill(bg); P.rect(1, 1, W - 2, 1, fg); P.rect(1, H - 2, W - 2, 1, fg); P.vline(1, 1, H - 2, fg); P.vline(W - 2, 1, H - 2, fg);
    P.rect(3, 3, W - 6, 1, dark(bg, 0.25)); P.rect(0, 0, W, 1, light(bg, 0.3));
    const n = [...cjk].length, top = o.sub ? 6 : 4, avail = H - top - (o.sub ? 14 : 6), cs = Math.min(o.size || 16, Math.floor(avail / n) - 2) >= 16 ? 16 : 12;
    crisp(P, cjk, W / 2, top + avail / 2 + 2, cs, fg, { vertical: true, gap: Math.max(2, Math.floor((avail - n * cs) / Math.max(1, n))), shadow: dark(bg, 0.55) });
    if (o.sub) crisp(P, o.sub, W / 2, H - 8, 8, '#fff4e0', { font: PIXFONT });
  }, { ppm: 32 });
}
/** a simple board with lines of text (menus, notices, plaques) */
export function board(key, lines, w, h, o = {}) {
  return ptex('ct_board' + key + w + h, w, h, (g, W, H, r, P) => {
    const bg = o.bg || '#2a2a26', fg = o.fg || '#f0ead8';
    P.fill(o.frame || '#6a4a2a'); P.rect(2, 2, W - 4, H - 4, bg); P.speck(40, light(bg, 0.08), r, 2, 2, W - 4, H - 4);
    const lh = o.lh || 10; let y = 3 + lh / 2 + 1;
    for (const L of lines) {
      if (L && L.rect) { P.rect(L.x, y - lh / 2, L.w, L.h, L.c); y += L.h + 1; continue; }
      if (L) crisp(P, L, W / 2, y, o.size || 8, o.col || fg); y += lh;
    }
  }, { ppm: o.ppm || 32 });
}
/** basketweave terracotta brick paving (Grant Lane) */
export const basket = (base = '#b0604a') => ptex('ct_basket' + base, 1, 1, (g, W, H, r, P) => {
  P.fill(dark(base, 0.45));
  for (let by = 0; by < H; by += 8) for (let bx = 0; bx < W; bx += 8) {
    const hor = ((bx + by) / 8) & 1;
    for (let k = 0; k < 2; k++) {
      const j = (r() - 0.5) * 0.22, c = j > 0 ? light(base, j) : dark(base, -j);
      if (hor) { P.rect(bx, by + k * 4, 7, 3, c); P.hline(bx, by + k * 4, 7, light(c, 0.12)); }
      else { P.rect(bx + k * 4, by, 3, 7, c); P.vline(bx + k * 4, by, 7, light(c, 0.12)); }
    }
  }
  P.speck(30, dark(base, 0.3), r);
});
/** granite slabs (the gate plaza, pavilion platform, stone tables) */
export const granite = (base = '#b8b4ac') => ptex('ct_gran' + base, 2, 2, (g, W, H, r, P) => {
  P.fill(dark(base, 0.3));
  for (let y = 0; y < H; y += 16) for (let x = (y / 16) & 1 ? 12 : 0; x < W + 24; x += 24) { const j = (r() - 0.5) * 0.1, c = j > 0 ? light(base, j) : dark(base, -j); P.block(x, y, 23, 15, c, { hk: 0.1, lk: 0.12 }); P.speck(16, dark(c, 0.15), r, x, y, 23, 15); P.speck(10, light(c, 0.15), r, x, y, 23, 15); }
});
/** white plaster with dark timber posts and rails (the dojo) */
export const timberWall = (plaster = '#ece4d4', wood = '#4a3020') => ptex('ct_timber' + plaster + wood, 2, 3, (g, W, H, r, P) => {
  P.fill(plaster); P.speck(120, dark(plaster, 0.06), r); P.speck(60, light(plaster, 0.05), r);
  P.rect(0, 0, 4, H, wood); P.vline(1, 0, H, light(wood, 0.15)); P.rect(0, H - 14, W, 3, wood); P.rect(0, 10, W, 3, wood); P.hline(0, 10, W, light(wood, 0.15));
  P.rect(0, H - 11, W, 11, '#6a6460'); for (let x = 0; x < W; x += 10) P.vline(x, H - 11, 11, '#4a4642'); P.hline(0, H - 11, W, '#8a8480');
});
/** tatami mats: two 0.9 × 1.8 m mats side by side with black cloth borders */
export const tatami = () => ptex('ct_tatami', 1.8, 1.8, (g, W, H, r, P) => {
  const straw = '#b8b070', edge = '#2a2a24';
  P.fill(straw);
  for (let y = 0; y < H; y += 2) P.hline(0, y, W, dark(straw, 0.08));
  P.speck(80, light(straw, 0.12), r);
  P.rect(0, 0, W, 2, edge); P.rect(0, H - 2, W, 2, edge); P.rect(Math.floor(W / 2) - 1, 0, 2, H, edge); P.rect(0, 0, 1, H, edge); P.rect(W - 1, 0, 1, H, edge);
  for (const x of [0, Math.floor(W / 2) + 1]) for (let y = 4; y < H; y += 9) P.px(x + 1, y, '#e8d8a0');
});
/** a parchment hanging scroll: ink landscape, bamboo or calligraphy */
export function scroll(kind = 'mount', text = '') {
  return ptex('ct_scroll' + kind + text, 0.7, 1.8, (g, W, H, r, P) => {
    P.fill('#6a3a2a'); P.rect(2, 4, W - 4, H - 8, '#3a5a6a'); P.rect(3, 6, W - 6, H - 12, '#ece0c4'); P.speck(40, '#d8c8a4', r, 3, 6, W - 6, H - 12);
    P.rect(0, 0, W, 3, '#3a2418'); P.rect(0, H - 3, W, 3, '#3a2418'); P.rect(W / 2 - 1, 0, 2, 1, '#c8a050');
    const ink = '#2a2a2a';
    if (kind === 'mount') { for (let i = 0; i < 3; i++) { const bx = 4 + i * 6, by = 22 + i * 10, hgt = 16 - i * 3; for (let y = 0; y < hgt; y++) P.hline(bx + y / 2, by - y + 10, Math.max(1, 6 - y / 3), i ? '#6a6a6a' : ink); } P.rect(W - 9, 12, 4, 4, '#c83a2a'); }
    else if (kind === 'bamboo') { for (const x of [7, 13]) { P.vline(x, 10, H - 22, '#3a6a3a'); for (let y = 16; y < H - 14; y += 8) { P.hline(x - 1, y, 3, '#2a4a2a'); P.hline(x + 1, y - 2, 4, '#4a8a4a'); } } }
    else crisp(P, text, W / 2, H / 2, 16, ink, { vertical: true, gap: 4 });
    if (kind !== 'text') P.rect(W - 7, H - 14, 3, 3, '#c83a2a');
  }, { ppm: 32 });
}
/** a xiangqi board with a few pieces mid-game */
export const xiangqi = () => ptex('ct_xq', 0.8, 0.8, (g, W, H, r, P) => {
  P.fill('#d8b878'); const ink = '#6a3a1a';
  for (let i = 0; i < 9; i++) P.vline(3 + i * 2.6, 2, H - 4, ink);
  for (let j = 0; j < 10; j++) P.hline(3, 2 + j * 2.3, W - 6, ink);
  P.rect(3, 12, W - 6, 2, '#c8a868');
  const pcs = [[3, 2, 1], [8, 2, 0], [13, 4, 1], [18, 7, 0], [6, 16, 1], [11, 18, 0], [21, 20, 1], [15, 12, 0], [25, 6, 1]];
  for (const [x, y, red] of pcs) { P.rect(x - 1, y - 1, 3, 3, '#f0e0c0'); P.px(x, y, red ? '#c8282a' : '#202020'); }
}, { ppm: 32 });
/** shop window contents by kind: bakery, herbs, gifts, music, tea, duck, dumpling, produce, bazaar, mahjong */
export function shopWin(kind, wM = 2, hM = 1.9, night = false, frame = '#2e5a3a') {
  return ptex('ct_shop' + kind + frame + night, wM, hM, (g, W, H, r, P) => {
    P.fill(frame); const glass = night ? '#f0d098' : '#3a5068', gx = 2, gy = 2, gw = W - 4, gh = H - 4;
    P.rect(gx, gy, gw, gh, glass);
    const shelf = (y, c = '#8a6a48') => { P.rect(gx, y, gw, 2, c); P.hline(gx, y + 2, gw, dark(c, 0.4)); };
    if (kind === 'bakery') {
      for (const y of [gy + 14, gy + 30, gy + 46]) { if (y > gy + gh - 6) break; shelf(y, '#c8b8a0'); for (let x = gx + 3; x < gx + gw - 6; x += 7) { const t = r(); if (t < 0.5) { P.rect(x, y - 4, 6, 4, '#a8682a'); P.rect(x + 1, y - 4, 4, 2, '#f8d040'); P.px(x + 2, y - 4, '#fff0a0'); } else if (t < 0.8) { P.rect(x, y - 5, 6, 5, '#c88a3a'); P.hline(x + 1, y - 5, 4, '#e8b060'); P.px(x + 2, y - 3, '#8a5a2a'); } else { P.rect(x, y - 5, 6, 5, '#f0a0b0'); P.hline(x + 1, y - 5, 4, '#ffd0d8'); } } }
      P.rect(gx + gw - 18, gy + 3, 14, 7, '#f4ece0'); crisp(P, '$2', gx + gw - 11, gy + 6, 8, '#c8282a');
    } else if (kind === 'herbs') {
      P.rect(gx, gy, gw, gh, '#5a3a22');
      for (let y = gy + 2; y < gy + gh - 12; y += 7) for (let x = gx + 2; x < gx + gw - 4; x += 8) { P.block(x, y, 7, 6, '#8a5a32', { hk: 0.2, lk: 0.3 }); P.px(x + 3, y + 3, '#e8c060'); P.hline(x + 2, y + 1, 3, '#e8dcc0'); }
      shelf(gy + gh - 12, '#6a4a2a');
      for (let x = gx + 3; x < gx + gw - 6; x += 6) { P.rect(x, gy + gh - 20, 5, 8, '#bcd8d8'); P.rect(x + 1, gy + gh - 17, 3, 5, ['#8a5a2a', '#c8a050', '#6a3a2a', '#a87a40'][Math.floor(r() * 4)]); P.hline(x, gy + gh - 21, 5, '#c83a2a'); }
    } else if (kind === 'gifts') {
      for (const y of [gy + 18, gy + 38]) { shelf(y); for (let x = gx + 3; x < gx + gw - 7; x += 8) { const t = r(); if (t < 0.35) { P.rect(x, y - 8, 6, 8, '#f4f0ea'); P.rect(x + 1, y - 10, 2, 2, '#f4f0ea'); P.rect(x + 4, y - 10, 2, 2, '#f4f0ea'); P.px(x + 2, y - 6, '#2a2a2a'); P.px(x + 4, y - 6, '#2a2a2a'); P.rect(x + 5, y - 9, 1, 4, '#f4f0ea'); P.hline(x + 1, y - 4, 4, '#d8282a'); } else if (t < 0.6) { for (let k = 0; k < 4; k++) P.hline(x + 3 - k, y - 9 + k, 2 * k + 1, k & 1 ? '#d8282a' : '#f0c040'); P.vline(x + 3, y - 5, 5, '#6a4a2a'); } else if (t < 0.85) { P.rect(x + 1, y - 9, 5, 7, '#d8282a'); P.hline(x + 1, y - 9, 5, '#f0c040'); P.hline(x + 1, y - 3, 5, '#f0c040'); P.vline(x + 3, y - 2, 2, '#f0c040'); } else { P.rect(x, y - 7, 6, 7, '#4a7ad8'); P.rect(x + 2, y - 5, 2, 2, '#f4f0ea'); } } }
    } else if (kind === 'music') {
      P.rect(gx, gy, gw, gh, '#2a2832');
      for (let i = 0; i < Math.floor(gw / 12); i++) { const x = gx + 4 + i * 12, c = ['#d8282a', '#f0c040', '#3a7ad8', '#f4f0ea', '#2aa070'][i % 5]; P.rect(x + 2, gy + 3, 2, 14, '#6a4a2a'); P.rect(x, gy + 15, 7, 9, c); P.rect(x + 1, gy + 13, 5, 3, c); P.rect(x + 2, gy + 18, 3, 3, '#1a1a1a'); P.hline(x + 1, gy + 2, 4, '#c8c8c8'); }
      for (let x = gx + 3; x < gx + gw - 12; x += 14) { P.block(x, gy + gh - 16, 12, 14, '#1e1e22'); P.dither(x + 2, gy + gh - 13, 8, 8, '#5a5a62', 0.5); P.rect(x + 2, gy + gh - 15, 8, 1, '#e8c060'); }
      shelf(gy + gh - 2, '#4a4a52');
    } else if (kind === 'tea') {
      for (const y of [gy + 14, gy + 28, gy + 42]) { if (y > gy + gh - 4) break; shelf(y, '#6a4a2a'); for (let x = gx + 3; x < gx + gw - 6; x += 6) { const c = ['#c8282a', '#2a6a4a', '#d8a83a', '#2a4a8a', '#8a3a6a'][Math.floor(r() * 5)]; P.rect(x, y - 8, 5, 8, c); P.hline(x, y - 8, 5, light(c, 0.3)); P.rect(x + 1, y - 5, 3, 2, '#f0e0b0'); } }
    } else if (kind === 'duck') {
      P.rect(gx, gy, gw, 2, '#c8c8c8');
      for (let x = gx + 4; x < gx + gw - 8; x += 9) { P.vline(x + 3, gy + 2, 4, '#888'); P.rect(x + 1, gy + 6, 6, 14, '#a8481e'); P.rect(x + 2, gy + 6, 4, 13, '#c8662a'); P.hline(x + 2, gy + 7, 3, '#e8984a'); P.rect(x + 2, gy + 19, 4, 3, '#7a2a12'); }
      shelf(gy + gh - 10, '#c8c8c8'); for (let x = gx + 3; x < gx + gw - 8; x += 10) { P.rect(x, gy + gh - 15, 8, 5, '#d87a3a'); P.hline(x, gy + gh - 15, 8, '#f0a060'); }
    } else if (kind === 'dumpling') {
      for (let y = gy + gh - 6; y > gy + 10; y -= 7) for (let x = gx + 3; x < gx + gw - 10; x += 12) { P.rect(x, y - 6, 11, 6, '#c8a060'); P.hline(x, y - 6, 11, '#e8c888'); for (let k = x + 1; k < x + 10; k += 2) P.px(k, y - 3, '#8a6a3a'); }
      P.dither(gx, gy, gw, 14, '#f4f4f4', 0.25);
    } else if (kind === 'mahjong') {
      P.rect(gx, gy, gw, gh, '#2a4a3a'); for (let y = gy + 6; y < gy + gh - 6; y += 10) for (let x = gx + 4; x < gx + gw - 6; x += 6) { P.rect(x, y, 5, 7, '#f4f0e0'); P.rect(x, y + 5, 5, 2, '#2a8a5a'); P.px(x + 2, y + 2, ['#c8282a', '#2a4a8a', '#2a6a2a'][Math.floor(r() * 3)]); }
    } else {
      for (let i = 0; i < 9; i++) { const x = gx + 4 + Math.floor(r() * (gw - 14)), hh = 6 + Math.floor(r() * 12), ww = 4 + Math.floor(r() * 8); P.block(x, gy + gh - hh - 2, ww, hh, ['#e85a4a', '#f0c840', '#5ab06a', '#4a8ad8', '#e890b0', '#f4f0ea'][i % 6]); }
    }
    if (!night) P.dither(gx, gy, gw, gh, '#c8e0f0', (x, y) => ((x + y * 0.6) % 31 < 5 ? 0.35 : 0));
    P.vline(Math.floor(W / 2), gy, gh, frame);
    P.rect(gx, gy, gw, 1, dark(frame, 0.4));
  }, { ppm: 32 });
}
export { TX, light, dark, hx, css, dith, ptex };
