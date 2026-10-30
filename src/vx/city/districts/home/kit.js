// Building kit for Sunset Row.
//  - Rig: an oriented local frame for furniture (x across the front, z from the back (0) toward the front, y up),
//    so one piece can stand against any wall facing 's' | 'n' | 'e' | 'w'.
//  - Furniture built from boxes wearing pixel textures plus fitted pixel decals (fronts, tops, screens).
//  - Dollhouse partitions: the lower metre always stands; the upper part lives in its own group and slides down
//    whenever it stands between the camera (south-east) and the player, like a cutaway dollhouse.
//  - Runtime hooks (one updater per building): glowing textures get an emissive map, atlases animate, and
//    "toggle" groups (a lamp that switches, a plant that perks up) are re-parented into their storey so the
//    engine's cutaway hides them with the rest of that floor.
import * as THREE from '../../../../../vendor/three.module.js';
import { TX } from '../../build.js';
import * as T from './tex.js';

export const FH = 3, CUT = 1.0;
const ROT = {
  s: { f: 's', b: 'n', r: 'e', l: 'w' },
  n: { f: 'n', b: 's', r: 'w', l: 'e' },
  e: { f: 'e', b: 'w', r: 'n', l: 's' },
  w: { f: 'w', b: 'e', r: 's', l: 'n' },
};
export const S = (c) => TX.solid(c);

export class Rig {
  constructor(C, gk, x, y, z, face = 's', L = 0) { Object.assign(this, { C, gk, x, y, z, face, L }); }
  /** local (lx, lz) → world [x, z] */
  P(lx, lz) {
    const { x, z } = this;
    switch (this.face) {
      case 'n': return [x - lx, z - lz];
      case 'e': return [x + lz, z - lx];
      case 'w': return [x - lz, z + lx];
      default: return [x + lx, z + lz];
    }
  }
  W(side) { return ROT[this.face][side]; }
  box(tex, x0, y0, z0, x1, y1, z1, o = {}) {
    const [ax, az] = this.P(x0, z0), [bx, bz] = this.P(x1, z1), q = { top: o.top };
    for (const s of ['f', 'b', 'l', 'r']) if (o[s]) q[this.W(s)] = o[s];
    if (o.skip) { q.skip = {}; for (const k in o.skip) q.skip[k === 'top' ? 'top' : this.W(k)] = o.skip[k]; }
    if (o.bottom) q.bottom = true;
    this.C.box(o.gk || this.gk, tex, Math.min(ax, bx), this.y + y0, Math.min(az, bz), Math.max(ax, bx), this.y + y1, Math.max(az, bz), q);
    if (o.block) this.block(x0, z0, x1, z1);
    return this;
  }
  block(x0, z0, x1, z1, pad = 0.04) { const [ax, az] = this.P(x0, z0), [bx, bz] = this.P(x1, z1); this.C.nav.block(Math.min(ax, bx) + pad, Math.min(az, bz) + pad, Math.max(ax, bx) - pad, Math.max(az, bz) - pad, this.L); return this; }
  /** a fitted picture on a face: side 'f'|'b' → plane at local z, centred on local x = c; 'l'|'r' → plane at local x, centred on local z = c */
  pic(tex, side, c, plane, y, w, h, off = 0.006, gk) {
    const [wx, wz] = side === 'f' || side === 'b' ? this.P(c, plane) : this.P(plane, c);
    this.C.decal(gk || this.gk, tex, wx, this.y + y, wz, this.W(side), w, h, { off });
    return this;
  }
  /** a fitted picture lying flat at height y; its bottom edge faces the local front */
  top(tex, x0, z0, x1, z1, y, gk) {
    const a = this.P(x0, z1), b = this.P(x1, z1), c = this.P(x1, z0), d = this.P(x0, z0), Y = this.y + y;
    this.C.quad(gk || this.gk, tex, [a[0], Y, a[1]], [b[0], Y, b[1]], [c[0], Y, c[1]], [d[0], Y, d[1]], { fit: true });
    return this;
  }
  /** world point of local (lx, lz) as { x, z } */
  at(lx, lz) { const [x, z] = this.P(lx, lz); return { x, z }; }
}
/** a rig whose footprint is the world rect (x0, z0)–(x1, z1), its front facing `face`; R.w / R.d = local width / depth */
export function rig(C, gk, L, face, x0, z0, x1, z1, y = L * FH + 0.02) {
  let ox, oz, w, d;
  if (face === 'n') { ox = x1; oz = z1; w = x1 - x0; d = z1 - z0; }
  else if (face === 'e') { ox = x0; oz = z1; w = z1 - z0; d = x1 - x0; }
  else if (face === 'w') { ox = x1; oz = z0; w = z1 - z0; d = x1 - x0; }
  else { ox = x0; oz = z0; w = x1 - x0; d = z1 - z0; }
  const R = new Rig(C, gk, ox, y, oz, face, L); R.w = w; R.d = d; return R;
}

// ---------------------------------------------------------------- floors & walls
/** a floor patch (tiled in metres) or rug (fit) lying at height y */
export function floor(C, gk, tex, x0, z0, x1, z1, y, fit = false) {
  C.quad(gk, tex, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], fit ? { fit: true } : { u0: x0, v0: -z1 });
}
/**
 * A dollhouse partition on storey k from (x0, z0) to (x1, z1) (axis-aligned). o.a / o.b: the textures on the
 * north|east side (a) and the south|west side (b). gaps: [{ at, w }] doorways (metres from the start).
 * Returns the upper part's group key, for posters and shelves that should lower with it.
 */
/**
 * The nav grid is 25 cm and walls block 10 cm either side of their line, so a doorway's clear opening depends on
 * where its edges fall. This moves a gap of width w (≤ 1.3 m) onto the grid; a 1.25 m gap then always leaves a
 * clear 1.0 m (four whole cells), comfortable for the 0.52 m walker steered with keys. All doorways here use 1.25.
 */
export function snapGap(c, w) { if (w > 1.3) return c; const n = Math.round((c - w / 2 + 0.11) / 0.25); return Math.round((n * 0.25 - 0.11 + w / 2) * 1000) / 1000; }
/** the door `at` (0..1 along side sd of a building at x, z, w, d) whose gap is nav-friendly, for a wanted world centre c */
export function doorAt(x, z, w, d, sd, c, gw = 1.25) { const s = snapGap(c, gw); return sd === 's' ? (s - x) / w : sd === 'n' ? (x + w - s) / w : sd === 'e' ? (z + d - s) / d : (s - z) / d; }
export function partition(C, B, k, x0, z0, x1, z1, o = {}) {
  const y0 = k * FH, xw = z0 === z1;
  // C.wall puts its outer texture on the right-hand side of the run: walking east that is north, walking south that is east
  const [ax, az, bx, bz] = xw ? [Math.min(x0, x1), z0, Math.max(x0, x1), z0] : [x0, Math.min(z0, z1), x0, Math.max(z0, z1)];
  const s0 = xw ? ax : az, gaps = (o.gaps || []).map((g) => ({ ...g, at: snapGap(s0 + g.at, g.w) - s0, y1: y0 + (g.h || 2.2) }));
  const ta = o.a || B.o.inner, tb = o.b || ta, cap = o.cap || S('#e8dcc8');
  C.wall(B.gk(k, 'in'), ax, az, bx, bz, y0, y0 + CUT, ta, { gaps, inner: tb, t: 0.12, L: k, cap });
  B.walls = B.walls || [];
  const gk = `b${B.id}:f${k}:w${B.walls.length}`;
  C.wall(gk, ax, az, bx, bz, y0 + CUT, y0 + FH - 0.05, ta, { gaps, inner: tb, t: 0.12, L: k, collide: false, cap });
  // skirting along both faces
  const sk = S(o.skirt || '#f4ece0');
  for (const s of [-1, 1]) {
    if (xw) for (const [a, b] of spans(ax, bx, gaps.map((g) => [ax + g.at - g.w / 2, ax + g.at + g.w / 2]))) C.box(B.gk(k, 'in'), sk, a, y0, az + s * 0.06 - 0.012, b, y0 + 0.1, az + s * 0.06 + 0.012);
    else for (const [a, b] of spans(az, bz, gaps.map((g) => [az + g.at - g.w / 2, az + g.at + g.w / 2]))) C.box(B.gk(k, 'in'), sk, ax + s * 0.06 - 0.012, y0, a, ax + s * 0.06 + 0.012, y0 + 0.1, b);
  }
  B.walls.push({ gk, k, ax: xw ? 'x' : 'z', at: xw ? az : ax, a0: xw ? ax : az, a1: xw ? bx : bz });
  return gk;
}
function spans(a, b, holes) { const out = []; let s = a; for (const [h0, h1] of holes.sort((p, q) => p[0] - q[0])) { if (h0 > s) out.push([s, h0]); s = Math.max(s, h1); } if (b > s) out.push([s, b]); return out; }
/** the low stub of the outer south / east walls that stays when the engine cuts the façade away (inside only) */
export function stubs(C, B, k, o = {}) {
  const { x, z, w, d } = B, y0 = k * FH, h = CUT, cap = S(o.cap || B.o.trim || '#f4ece0'), inner = o.inner || B.o.inner, outer = B.o.wall;
  const gk = B.gk(k, 'in');
  for (const [a, b] of spans(x, x + w, (o.s || []).map(([c, ww]) => [c - ww / 2, c + ww / 2]))) C.box(gk, outer, a, y0, z + d - 0.19, b, y0 + h, z + d - 0.03, { n: inner, top: cap });
  for (const [a, b] of spans(z, z + d, (o.e || []).map(([c, ww]) => [c - ww / 2, c + ww / 2]))) C.box(gk, outer, x + w - 0.19, y0, a, x + w - 0.03, y0 + h, b, { w: inner, top: cap });
}
/** the outer-wall band strips on upper floors that the engine leaves walkable: block them again */
export function fixUpperWalls(C, B) {
  const { x, z, w, d } = B;
  for (let k = 1; k < B.floors; k++) { C.nav.block(x, z, x + w, z + 0.25, k); C.nav.block(x, z + d - 0.25, x + w, z + d, k); C.nav.block(x, z, x + 0.25, z + d, k); C.nav.block(x + w - 0.25, z, x + w, z + d, k); }
}
/** a window on one of B's outer walls at world coordinate c along that side (x for s/n, z for e/w), storey k */
export function windowOn(C, B, k, side, c, o = {}) {
  const { x, z, w, d } = B, sides = { s: [x, z + d, x + w, z + d], e: [x + w, z + d, x + w, z], n: [x + w, z, x, z], w: [x, z, x, z + d] };
  const [ax, az, bx, bz] = sides[side], at = side === 's' ? c - x : side === 'n' ? x + w - c : side === 'e' ? z + d - c : c - z;
  const front = side === 's' || side === 'e', gk = B.gk(k, front ? 'front' : 'back');
  C.windowAt(gk, side, ax, az, bx, bz, at, k * FH + (o.y ?? (k === 0 ? 0.95 : 0.85)), { frame: o.frame || '#f6f0e2', curtain: o.curtain || '#e8a0a8', w: o.w, h: o.h, lit: o.lit }, B);
}

// ---------------------------------------------------------------- façade pieces
/** a canted bay on the south face: back width wb at the wall (z = zf), front width wf, depth dep, between y0 and y1 */
export function bay(C, gk, cx, zf, y0, y1, o) {
  const wb = o.wb ?? 3.0, wf = o.wf ?? 1.9, dep = o.dep ?? 0.62;
  const A = [cx - wb / 2, zf], Bq = [cx - wf / 2, zf + dep], Cq = [cx + wf / 2, zf + dep], D = [cx + wb / 2, zf];
  const face = (p, q) => C.quad(gk, o.wall, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]]);
  face(A, Bq); face(Bq, Cq); face(Cq, D);
  C.quad(gk, o.trim, [A[0], y1, A[1]], [Bq[0], y1, Bq[1]], [Cq[0], y1, Cq[1]], [D[0], y1, D[1]]);
  C.quad(gk, o.trim, [A[0], y0, A[1]], [D[0], y0, D[1]], [Cq[0], y0, Cq[1]], [Bq[0], y0, Bq[1]]);
  const win = (p, q, tex, inset, wy0, wy1) => {
    const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz * 0.025, nz = ux * 0.025;
    const a = [p[0] + ux * inset + nx, p[1] + uz * inset + nz], b = [q[0] - ux * inset + nx, q[1] - uz * inset + nz];
    C.quad(gk, tex, [a[0], wy0, a[1]], [b[0], wy0, b[1]], [b[0], wy1, b[1]], [a[0], wy1, a[1]], { fit: true });
    C.quad(gk, o.trim, [a[0] - ux * 0.06 + nx, wy0 - 0.1, a[1] - uz * 0.06 + nz], [b[0] + ux * 0.06 + nx, wy0 - 0.1, b[1] + uz * 0.06 + nz], [b[0] + ux * 0.06 + nx, wy0, b[1] + uz * 0.06 + nz], [a[0] - ux * 0.06 + nx, wy0, a[1] - uz * 0.06 + nz]);
  };
  const wy0 = y0 + 0.55, wy1 = y1 - 0.25;
  win(Bq, Cq, o.win, 0.2, wy0, wy1); win(A, Bq, o.side, 0.17, wy0, wy1); win(Cq, D, o.side, 0.17, wy0, wy1);
  // a cap band on top
  const e = 0.08;
  C.quad(gk, o.trim, [A[0] - e, y1 + 0.12, A[1]], [Bq[0] - e, y1 + 0.12, Bq[1] + e], [Cq[0] + e, y1 + 0.12, Cq[1] + e], [D[0] + e, y1 + 0.12, D[1]]);
  for (const [p, q] of [[A, Bq], [Bq, Cq], [Cq, D]]) C.quad(gk, o.trim, [p[0], y1, p[1]], [q[0], y1, q[1]], [q[0], y1 + 0.12, q[1]], [p[0], y1 + 0.12, p[1]]);
}


// ---------------------------------------------------------------- runtime: glow, animation, toggles, smart walls
/** register a building's runtime hooks; call once per building after its interior is built */
export function live(C, B, o = {}) {
  const toggles = B.toggles || [], anims = B.anims || [];
  let ready = false;
  C.updaters.push((dt, t) => {
    if (!B.groups || !B.groups[0] || !B.groups[0].in) return;
    if (!ready) {
      ready = true;
      const root = B.groups[0].in.parent;
      for (const W of B.walls || []) { const g = root.getObjectByName(W.gk); if (g && B.groups[W.k].in) { B.groups[W.k].in.add(g); W.g = g; W.s = 1; } }
      for (const tg of toggles) { const g = root.getObjectByName(tg.gk); if (g) { if (B.groups[tg.k] && B.groups[tg.k].in) B.groups[tg.k].in.add(g); tg.g = g; if (tg.init) { try { tg.on = !!tg.init(globalThis.__app); } catch (e) { /* keep the default */ } } g.visible = !!tg.on; } }
      // glowing textures: screens, lamp shades, coolers
      const seen = new Set();
      const walk = (g) => { for (const m of g.children) { if (m.children && m.children.length) walk(m); const mt = m.material; if (!mt || !mt.map || !mt.map.userData.srGlow || seen.has(mt)) continue; seen.add(mt); mt.emissive && mt.emissive.set(0xffffff); mt.emissiveMap = mt.map; mt.emissiveIntensity = 0.9; mt.needsUpdate = true; } };
      walk(root);
    }
    for (const a of anims) { const fr = a.frame(t); if (fr !== a.cur) { a.cur = fr; a.tex.offset.x = fr / a.tex.userData.frames; } }
    const app = globalThis.__app, cc = app && app.world && app.world.city, pl = app && app.world && app.world.player;
    const p = pl && pl.g.position, inside = cc && cc.inside === B.id ? cc.L : -1;
    // engine workaround: walking in while the building was faded (you stood behind it) leaves it see-through,
    // because the cutaway never restores opacity while you are inside — make it solid again once
    if (inside >= 0 && !B.srSolid) { B.srSolid = true; opaque(B); } else if (inside < 0) B.srSolid = false;
    if (!B.walls || !B.walls.length) return;
    for (const W of B.walls) {
      if (!W.g) continue;
      let cut = false;
      if (p && inside === W.k) cut = W.ax === 'x' ? p.z < W.at - 0.05 && p.x > W.a0 - 2.5 && p.x < W.a1 + 2.5 : p.x < W.at - 0.05 && p.z > W.a0 - 2.5 && p.z < W.a1 + 2.5;
      else if (inside < 0 && (B.fade ?? 1) < 0.9) cut = true;
      const want = cut ? 0.02 : 1; W.s += (want - W.s) * (1 - Math.exp(-dt * 9));
      const y0 = W.k * FH + CUT; W.g.scale.y = W.s; W.g.position.y = y0 * (1 - W.s); W.g.visible = W.s > 0.05;
    }
  });
}
function opaque(B) {
  const fix = (g) => { if (!g) return; for (const m of g.children) { const mt = m.material; if (!mt || !mt.transparent || mt.map && mt.map.userData && mt.map.userData.key === 'water') continue; mt.transparent = false; mt.opacity = 1; mt.depthWrite = true; mt.needsUpdate = true; m.castShadow = true; } };
  for (const G of B.groups || []) { fix(G.front); fix(G.back); fix(G.in); }
  fix(B.roofG);
}
/** a group that can be switched on/off at runtime (storey k of B) → { gk, set(on) } */
export function toggle(B, k, name, on = false, init) {
  const tg = { gk: `b${B.id}:f${k}:t:${name}`, k, on, init, set(v) { tg.on = v; if (tg.g) tg.g.visible = v; } };
  (B.toggles = B.toggles || []).push(tg);
  return tg;
}
/** animate an atlas texture: frame(t) → frame index */
export function anim(B, tex, frame) { (B.anims = B.anims || []).push({ tex, frame, cur: -1 }); }

// ---------------------------------------------------------------- furniture (local frame: back at z = 0)
export function sofa(R, o = {}) {
  const w = o.w ?? R.w, d = o.d ?? R.d, fab = T.fabric(o.col || '#c86a5a'), fab2 = T.fabric(T.lt(o.col || '#c86a5a', 0.08)), legs = T.wood(o.wood || '#5a3a24');
  for (const x of [0.06, w - 0.12]) for (const z of [0.06, d - 0.12]) R.box(legs, x, 0, z, x + 0.06, 0.1, z + 0.06);
  R.box(fab, 0, 0.1, 0.12, w, 0.4, d);                               // base
  R.box(fab, 0, 0.1, 0, w, 0.86, 0.24);                              // back
  R.box(fab2, 0, 0.1, 0, 0.2, 0.62, d); R.box(fab2, w - 0.2, 0.1, 0, w, 0.62, d);   // arms
  R.box(T.fabric(o.trim || T.dk(o.col || '#c86a5a', 0.15)), -0.01, 0.6, 0, 0.21, 0.66, d); R.box(T.fabric(o.trim || T.dk(o.col || '#c86a5a', 0.15)), w - 0.21, 0.6, 0, w + 0.01, 0.66, d);
  const n = o.seats || Math.max(1, Math.round((w - 0.4) / 0.6)), cw = (w - 0.4) / n;
  for (let i = 0; i < n; i++) {
    const x0 = 0.2 + i * cw + 0.015, x1 = 0.2 + (i + 1) * cw - 0.015;
    R.box(fab2, x0, 0.4, 0.26, x1, 0.52, d - 0.02);                  // seat cushion
    R.box(fab2, x0, 0.42, 0.2, x1, 0.82, 0.34);                      // back cushion
  }
  if (o.pillows !== false) { const pc = o.pillow || '#f2c84a'; R.box(T.fabric(pc), 0.24, 0.5, 0.3, 0.6, 0.82, 0.44); R.pic(T.cushion(pc, o.pat || 'dot'), 'f', 0.42, 0.44, 0.48, 0.34, 0.32, 0.003); if (n > 1) { const p2 = o.pillow2 || '#7ab0d8'; R.box(T.fabric(p2), w - 0.6, 0.5, 0.3, w - 0.24, 0.82, 0.44); R.pic(T.cushion(p2, 'stripe'), 'f', w - 0.42, 0.44, 0.48, 0.34, 0.32, 0.003); } }
  if (o.throw) R.box(T.knit(o.throw), w - 0.55, 0.52, 0.34, w - 0.2, 0.545, d + 0.02);
  R.block(0, 0, w, d);
}
export function table(R, o = {}) {
  const w = o.w ?? R.w, d = o.d ?? R.d, h = o.h ?? 0.75, wd = T.wood(o.col || '#a87a4a'), top = o.top || wd, lg = o.leg ?? 0.06;
  R.box(wd, 0, h - 0.05, 0, w, h, d, { top });
  if (o.apron !== false) R.box(T.wood(T.dk(o.col || '#a87a4a', 0.1)), 0.05, h - 0.14, 0.05, w - 0.05, h - 0.05, d - 0.05);
  for (const x of [0.04, w - 0.04 - lg]) for (const z of [0.04, d - 0.04 - lg]) R.box(wd, x, 0, z, x + lg, h - 0.05, z + lg);
  if (o.shelf) R.box(wd, 0.06, 0.12, 0.06, w - 0.06, 0.15, d - 0.06);
  if (o.block !== false) R.block(0, 0, w, d);
}
export function chair(R, o = {}) {
  const w = o.w ?? 0.44, d = o.d ?? 0.44, x = o.x ?? 0, z = o.z ?? 0, sh = o.seat ?? 0.46, wd = T.wood(o.col || '#8a5a36');
  for (const lx of [x + 0.03, x + w - 0.07]) for (const lz of [z + 0.03, z + d - 0.07]) R.box(wd, lx, 0, lz, lx + 0.04, sh, lz + 0.04);
  R.box(wd, x, sh, z, x + w, sh + 0.04, z + d, o.cushion ? { top: T.fabric(o.cushion) } : {});
  if (o.cushion) R.box(T.fabric(o.cushion), x + 0.03, sh + 0.04, z + 0.06, x + w - 0.03, sh + 0.08, z + d - 0.03);
  R.box(wd, x + 0.03, sh + 0.04, z, x + 0.07, sh + 0.5, z + 0.04); R.box(wd, x + w - 0.07, sh + 0.04, z, x + w - 0.03, sh + 0.5, z + 0.04);
  R.box(wd, x + 0.03, sh + 0.32, z, x + w - 0.03, sh + 0.48, z + 0.035);
  if (o.block) R.block(x, z, x + w, z + d);
}
export function cabinet(R, o = {}) {
  const w = o.w ?? R.w, d = o.d ?? R.d, h = o.h ?? 0.9, x = o.x ?? 0, col = o.col || '#f4ece0', body = o.body || T.paint(col);
  R.box(body, x, 0.08, 0, x + w, h, d, { top: o.top || body });
  R.box(S('#3a2a22'), x + 0.04, 0, 0.04, x + w - 0.04, 0.08, d - 0.06);
  R.pic(o.front || T.cabFront(round2(w), round2(h - 0.08), col, { drawer: o.drawer, n: o.n, knob: o.knob }), 'f', x + w / 2, d, 0.08, w, h - 0.08);
  if (o.counter) R.box(o.counter, x - 0.02, h, -0.0, x + w + 0.02, h + 0.04, d + 0.03);
  if (o.block !== false) R.block(x, 0, x + w, d);
}
const round2 = (v) => Math.round(v * 100) / 100;
export function upperCab(R, o = {}) {
  const w = o.w ?? R.w, x = o.x ?? 0, y = o.y ?? 1.45, h = o.h ?? 0.7, d = o.d ?? 0.34, col = o.col || '#f4ece0', body = T.paint(col);
  R.box(body, x, y, 0, x + w, y + h, d);
  R.pic(T.cabFront(round2(w), round2(h), col, { n: o.n, up: true, knob: o.knob }), 'f', x + w / 2, d, y, w, h);
  R.box(S(T.dk(col, 0.1)), x - 0.02, y + h, -0.0, x + w + 0.02, y + h + 0.04, d + 0.02);
}
export function bookshelf(R, o = {}) {
  const w = o.w ?? R.w, d = o.d ?? R.d, h = o.h ?? 1.9, wd = T.wood(o.col || '#8a5a36'), rows = o.rows || Math.round((h - 0.15) / 0.38), rh = (h - 0.12) / rows;
  R.box(wd, 0, 0, 0, 0.04, h, d); R.box(wd, w - 0.04, 0, 0, w, h, d); R.box(wd, 0, h - 0.04, 0, w, h, d); R.box(wd, 0, 0, 0, w, 0.08, d);
  R.box(T.wood(T.dk(o.col || '#8a5a36', 0.3)), 0.04, 0.08, 0, w - 0.04, h - 0.04, 0.03);
  for (let i = 0; i < rows; i++) {
    const y = 0.08 + i * rh;
    if (i > 0) R.box(wd, 0.04, y - 0.02, 0.03, w - 0.04, y + 0.01, d);
    const bh = round2(rh - 0.06), bw = round2(w - 0.08);
    R.box(S('#e8e0c8'), 0.05, y + 0.01, 0.05, w - 0.05, y + 0.01 + bh * 0.9, d - 0.05, { skip: { f: true } });
    R.pic(T.books(bw, bh, (o.seed || 1) * 10 + i, { toys: o.toys, pal: o.pal }), 'f', w / 2, d - 0.05, y + 0.01, bw, bh, 0.002);
  }
  if (o.block !== false) R.block(0, 0, w, d);
}
export function bed(R, o = {}) {
  // local: width w across, length d from the headboard (z = 0) to the foot
  const w = o.w ?? R.w, d = o.d ?? R.d, wd = T.wood(o.wood || '#8a5a36'), q = o.quilt || T.quilt(), qc = o.quiltSide || '#e8705a';
  R.box(wd, 0, 0, 0, w, 0.32, d);
  R.box(S('#f4f0e8'), 0.04, 0.32, 0.08, w - 0.04, 0.5, d - 0.04);
  R.box(T.quiltTop(qc, o.key || 'a'), 0.0, 0.3, 0.42, w, 0.56, d + 0.01, { top: S('#f4f0e8') });
  R.top(q, 0.0, 0.42, w, d + 0.01, 0.562);
  R.box(wd, -0.02, 0, -0.06, w + 0.02, o.head ?? 1.05, 0.06);
  R.box(T.wood(T.lt(o.wood || '#8a5a36', 0.1)), -0.05, (o.head ?? 1.05), -0.08, w + 0.05, (o.head ?? 1.05) + 0.05, 0.08);
  R.box(wd, -0.02, 0, d - 0.04, w + 0.02, o.foot ?? 0.62, d + 0.04);
  const pn = w > 1.3 ? 2 : 1, pw = (w - 0.2) / pn;
  for (let i = 0; i < pn; i++) R.box(S('#f8f4ec'), 0.1 + i * pw + 0.03, 0.5, 0.1, 0.1 + (i + 1) * pw - 0.03, 0.66, 0.42, { top: T.pillow(o.pillow || '#f8f4ec') });
  R.block(-0.02, -0.06, w + 0.02, d + 0.04);
}
export function wardrobe(R, o = {}) {
  const w = o.w ?? R.w, d = o.d ?? R.d, h = o.h ?? 2.05, col = o.col || '#e8dcc8';
  R.box(T.paint(col), 0, 0, 0, w, h, d, { top: T.paint(T.dk(col, 0.05)) });
  R.box(T.paint(T.dk(col, 0.08)), -0.03, h, -0.0, w + 0.03, h + 0.06, d + 0.04);
  R.pic(T.wardrobeFront(col), 'f', w / 2, d, 0.02, w - 0.04, h - 0.06);
  R.block(0, 0, w, d);
}
/** floor lamp at local (x, z): a pole and a glowing shade (switchable through a toggle group) */
export function floorLamp(R, x, z, o = {}) {
  const h = o.h ?? 1.55, pole = S(o.pole || '#3a3a44'), sw = 0.2;
  R.box(pole, x - 0.13, 0, z - 0.13, x + 0.13, 0.04, z + 0.13); R.box(pole, x - 0.02, 0.04, z - 0.02, x + 0.02, h, z + 0.02);
  const off = T.lampShadeOff(o.shade || '#e8dcc0'), on = T.lampShade(o.shade || '#f8e8c0');
  R.box(off, x - sw, h - 0.05, z - sw, x + sw, h + 0.3, z + sw);
  if (o.toggle) R.box(on, x - sw - 0.006, h - 0.056, z - sw - 0.006, x + sw + 0.006, h + 0.306, z + sw + 0.006, { gk: o.toggle.gk });
  R.block(x - 0.18, z - 0.18, x + 0.18, z + 0.18);
}
export function tableLamp(R, x, y, z, o = {}) {
  const sw = o.s ?? 0.12;
  R.box(S(o.base || '#e8b040'), x - 0.06, y, z - 0.06, x + 0.06, y + 0.2, z + 0.06);
  R.box(o.glow === false ? T.lampShadeOff(o.shade || '#f8e8c0') : T.lampShade(o.shade || '#f8e8c0'), x - sw, y + 0.18, z - sw, x + sw, y + 0.38, z + sw);
}
/** a potted plant at local (x, z); kind: 'leafy' | 'tall' | 'fern' | 'cactus' | 'flower' */
export function plant(R, x, z, o = {}) {
  const s = o.s ?? 1, ph = 0.32 * s, pw = 0.17 * s, pot = o.pot ? S(o.pot) : T.terracotta(), y = o.y ?? 0, leaf = o.leaf || '#4a8a42', gk = o.gk;
  R.box(pot, x - pw, y, z - pw, x + pw, y + ph, z + pw, { gk }); R.box(S(T.dk(o.pot || '#c8704a', 0.15)), x - pw - 0.02, y + ph - 0.05, z - pw - 0.02, x + pw + 0.02, y + ph, z + pw + 0.02, { gk });
  R.box(T.soil(), x - pw + 0.02, y + ph - 0.02, z - pw + 0.02, x + pw - 0.02, y + ph + 0.005, z + pw - 0.02, { gk });
  const L = T.leaves(leaf), L2 = T.leaves(T.lt(leaf, 0.12)), k = o.kind || 'leafy', top = y + ph;
  if (k === 'tall') { R.box(S('#6a4a32'), x - 0.025, top, z - 0.025, x + 0.025, top + 0.9 * s, z + 0.025, { gk }); for (const [dx, dy, dz, r] of [[0, 0.95, 0, 0.26], [0.12, 0.72, 0.05, 0.2], [-0.1, 0.62, -0.06, 0.18], [0.02, 1.15, 0.03, 0.18]]) R.box(dy > 1 ? L2 : L, x + dx * s - r * s, top + dy * s - r * s * 0.8, z + dz * s - r * s, x + dx * s + r * s, top + dy * s + r * s * 0.8, z + dz * s + r * s, { gk }); }
  else if (k === 'cactus') { R.box(S('#5a9a5a'), x - 0.06 * s, top, z - 0.06 * s, x + 0.06 * s, top + 0.4 * s, z + 0.06 * s, { gk }); R.box(S('#5a9a5a'), x + 0.06 * s, top + 0.16 * s, z - 0.03, x + 0.14 * s, top + 0.22 * s, z + 0.03, { gk }); R.box(S('#5a9a5a'), x + 0.1 * s, top + 0.22 * s, z - 0.03, x + 0.14 * s, top + 0.32 * s, z + 0.03, { gk }); R.box(S('#f06a8a'), x - 0.03, top + 0.4 * s, z - 0.03, x + 0.03, top + 0.45 * s, z + 0.03, { gk }); }
  else if (k === 'wilted') { R.box(S('#8a8a4a'), x - 0.02, top, z - 0.02, x + 0.02, top + 0.25 * s, z + 0.02, { gk }); R.box(S('#9a9a52'), x - 0.02, top + 0.2 * s, z - 0.02, x + 0.16 * s, top + 0.24 * s, z + 0.03, { gk }); R.box(S('#a8a05a'), x + 0.12 * s, top + 0.08 * s, z - 0.06, x + 0.18 * s, top + 0.22 * s, z + 0.05, { gk }); R.box(S('#9a9a52'), x - 0.16 * s, top + 0.06 * s, z - 0.03, x - 0.02, top + 0.12 * s, z + 0.06, { gk }); }
  else {
    const n = k === 'fern' ? 7 : 5;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.4, rr = (k === 'fern' ? 0.16 : 0.1) * s, h = (0.22 + ((i * 37) % 10) / 40) * s, lx = x + Math.cos(a) * rr, lz = z + Math.sin(a) * rr; R.box(i & 1 ? L : L2, lx - 0.09 * s, top + 0.04, lz - 0.09 * s, lx + 0.09 * s, top + h, lz + 0.09 * s, { gk }); }
    R.box(L2, x - 0.1 * s, top + 0.1, z - 0.1 * s, x + 0.1 * s, top + 0.42 * s, z + 0.1 * s, { gk });
    if (k === 'flower') for (let i = 0; i < 5; i++) { const a = i * 1.3; R.box(S(['#f06a7a', '#f8d84a', '#ffffff', '#e88ad0', '#f08a3a'][i]), x + Math.cos(a) * 0.1 * s - 0.03, top + 0.38 * s + (i % 2) * 0.05, z + Math.sin(a) * 0.1 * s - 0.03, x + Math.cos(a) * 0.1 * s + 0.03, top + 0.44 * s + (i % 2) * 0.05, z + Math.sin(a) * 0.1 * s + 0.03, { gk }); }
  }
  if (o.block !== false && !o.y) R.block(x - pw, z - pw, x + pw, z + pw);
}
/** a TV on a low stand: returns the screen texture (an atlas) */
export function tvStand(R, o = {}) {
  const w = o.w ?? R.w, d = o.d ?? R.d, h = o.h ?? 0.5, col = o.col || '#6a4a32', wd = T.wood(col);
  R.box(wd, 0, 0.06, 0, w, h, d, { top: T.wood(T.lt(col, 0.06)) }); R.box(S('#2a2220'), 0.05, 0, 0.05, w - 0.05, 0.06, d - 0.05);
  R.pic(T.cabFront(round2(w), round2(h - 0.06), col, { n: 3, knob: '#d8c890' }), 'f', w / 2, d, 0.06, w, h - 0.06);
  const tw = o.tw ?? 1.12, th = o.th ?? 0.66, tx = w / 2, ty = h + 0.1, tz = 0.18, scr = o.screen || T.tvAtlas();
  R.box(S('#2a2a32'), tx - 0.18, h, tz - 0.08, tx + 0.18, h + 0.03, tz + 0.08); R.box(S('#2a2a32'), tx - 0.03, h + 0.03, tz - 0.02, tx + 0.03, ty, tz + 0.02);
  R.box(S('#1e1e26'), tx - tw / 2, ty, tz - 0.035, tx + tw / 2, ty + th, tz + 0.035);
  R.pic(scr, 'f', tx, tz + 0.035, ty + 0.04, tw - 0.08, th - 0.08, 0.004);
  R.box(S('#e8473a'), tx + tw / 2 - 0.07, ty + 0.012, tz + 0.035, tx + tw / 2 - 0.05, ty + 0.028, tz + 0.04);
  if (o.block !== false) R.block(0, 0, w, d);
  return scr;
}
export function desk(R, o = {}) {
  const w = o.w ?? R.w, d = o.d ?? R.d, h = o.h ?? 0.74, col = o.col || '#c89a62', wd = T.wood(col);
  R.box(wd, 0, h - 0.04, 0, w, h, d);
  R.box(T.paint(o.drawers || '#f4ece0'), w - 0.45, 0, 0.02, w - 0.02, h - 0.04, d - 0.02);
  R.pic(T.cabFront(0.43, round2(h - 0.04), o.drawers || '#f4ece0', { n: 1, drawer: true }), 'f', w - 0.235, d - 0.02, 0, 0.43, h - 0.04);
  R.box(wd, 0.02, 0, 0.04, 0.06, h - 0.04, d - 0.04); R.box(wd, 0.06, h - 0.2, 0.02, w - 0.45, h - 0.04, 0.05);
  if (o.block !== false) R.block(0, 0, w, d);
}
export function officeChair(R, x, z, o = {}) {
  const c = S(o.col || '#e8473a'), m = S('#3a3a44');
  R.box(m, x - 0.25, 0, z - 0.03, x + 0.25, 0.04, z + 0.03); R.box(m, x - 0.03, 0, z - 0.25, x + 0.03, 0.04, z + 0.25); R.box(m, x - 0.03, 0.04, z - 0.03, x + 0.03, 0.42, z + 0.03);
  R.box(c, x - 0.24, 0.42, z - 0.22, x + 0.24, 0.5, z + 0.22); R.box(c, x - 0.22, 0.5, z + (o.back ?? -0.22) - 0.03, x + 0.22, 1.0, z + (o.back ?? -0.22) + 0.05);
}
/** monitor + keyboard + tower on a desk top (local y = desk height) */
export function pc(R, x, y, z, o = {}) {
  const scr = T.pcAtlas();
  R.box(S('#e8e4dc'), x - 0.1, y, z - 0.08, x + 0.1, y + 0.02, z + 0.08); R.box(S('#e8e4dc'), x - 0.03, y + 0.02, z - 0.02, x + 0.03, y + 0.14, z + 0.02);
  R.box(S('#e8e4dc'), x - 0.33, y + 0.12, z - 0.05, x + 0.33, y + 0.56, z + 0.03);
  R.pic(scr, 'f', x, z + 0.03, y + 0.15, 0.6, 0.38, 0.003);
  R.box(S('#3a3a44'), x - 0.24, y, z + 0.18, x + 0.24, y + 0.02, z + 0.34); R.top(T.keyboardTop(), x - 0.24, z + 0.18, x + 0.24, z + 0.34, y + 0.021);
  R.box(S('#e8e4dc'), x + 0.32, y, z + 0.22, x + 0.38, y + 0.025, z + 0.31);
  return scr;
}
export function rugAt(C, gk, tex, x0, z0, x1, z1, y) { floor(C, gk, tex, x0, z0, x1, z1, y, true); }
/** a framed picture on a wall face (world): face s|n|e|w, centre (x, z) on the wall surface, bottom y */
export function frame(C, gk, tex, x, y, z, face, w, h) {
  const t = 0.03, o = { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] }[face];
  if (face === 's' || face === 'n') C.box(gk, S('#5a3a24'), x - w / 2, y, Math.min(z, z + o[1] * t), x + w / 2, y + h, Math.max(z, z + o[1] * t), { skip: { [face]: true } });
  else C.box(gk, S('#5a3a24'), Math.min(x, x + o[0] * t), y, z - w / 2, Math.max(x, x + o[0] * t), y + h, z + w / 2, { skip: { [face]: true } });
  C.decal(gk, tex, x + o[0] * t, y, z + o[1] * t, face, w, h, { off: 0.003 });
}
/** a small boxy plush toy at local (x, y, z): kind 'bear' | 'chick' | 'blob' */
export function plush(R, x, y, z, kind = 'bear', o = {}) {
  const s = o.s ?? 1, gk = o.gk;
  if (kind === 'bear') {
    const b = S('#a8784a'), l = S('#e8c8a0');
    R.box(b, x - 0.1 * s, y, z - 0.08 * s, x + 0.1 * s, y + 0.16 * s, z + 0.08 * s, { gk }); R.box(b, x - 0.09 * s, y + 0.16 * s, z - 0.08 * s, x + 0.09 * s, y + 0.32 * s, z + 0.08 * s, { gk });
    R.box(b, x - 0.1 * s, y + 0.3 * s, z - 0.03 * s, x - 0.05 * s, y + 0.36 * s, z + 0.02 * s, { gk }); R.box(b, x + 0.05 * s, y + 0.3 * s, z - 0.03 * s, x + 0.1 * s, y + 0.36 * s, z + 0.02 * s, { gk });
    R.box(l, x - 0.04 * s, y + 0.18 * s, z + 0.08 * s, x + 0.04 * s, y + 0.23 * s, z + 0.1 * s, { gk }); R.box(S('#2a2220'), x - 0.05 * s, y + 0.25 * s, z + 0.08 * s, x - 0.03 * s, y + 0.27 * s, z + 0.085 * s, { gk }); R.box(S('#2a2220'), x + 0.03 * s, y + 0.25 * s, z + 0.08 * s, x + 0.05 * s, y + 0.27 * s, z + 0.085 * s, { gk });
    R.box(S('#2a3a6a'), x - 0.05 * s, y + 0.12 * s, z + 0.08 * s, x + 0.05 * s, y + 0.16 * s, z + 0.09 * s, { gk });
  } else if (kind === 'chick') {
    const b = S('#e8473a');
    R.box(b, x - 0.12 * s, y, z - 0.11 * s, x + 0.12 * s, y + 0.22 * s, z + 0.11 * s, { gk }); R.box(S('#c83a32'), x - 0.13 * s, y + 0.04 * s, z - 0.05 * s, x + 0.13 * s, y + 0.14 * s, z + 0.05 * s, { gk });
    R.box(S('#f8c840'), x - 0.02 * s, y + 0.22 * s, z - 0.04 * s, x + 0.03 * s, y + 0.3 * s, z + 0.02 * s, { gk }); R.box(S('#f8d84a'), x - 0.06 * s, y + 0.22 * s, z - 0.02 * s, x - 0.02 * s, y + 0.27 * s, z + 0.02 * s, { gk });
    R.box(S('#f8a030'), x - 0.03 * s, y + 0.1 * s, z + 0.11 * s, x + 0.03 * s, y + 0.13 * s, z + 0.15 * s, { gk });
    R.box(S('#1a1a22'), x - 0.07 * s, y + 0.14 * s, z + 0.11 * s, x - 0.04 * s, y + 0.18 * s, z + 0.115 * s, { gk }); R.box(S('#1a1a22'), x + 0.04 * s, y + 0.14 * s, z + 0.11 * s, x + 0.07 * s, y + 0.18 * s, z + 0.115 * s, { gk });
  } else {
    const c = o.col || '#4a8ad8', b = S(c);
    R.box(b, x - 0.11 * s, y, z - 0.1 * s, x + 0.11 * s, y + 0.18 * s, z + 0.1 * s, { gk }); R.box(b, x - 0.08 * s, y + 0.18 * s, z - 0.07 * s, x + 0.08 * s, y + 0.22 * s, z + 0.07 * s, { gk });
    R.box(S(T.lt(c, 0.3)), x - 0.06 * s, y + 0.03 * s, z + 0.1 * s, x + 0.06 * s, y + 0.1 * s, z + 0.105 * s, { gk });
    R.box(S('#1a1a22'), x - 0.06 * s, y + 0.12 * s, z + 0.1 * s, x - 0.03 * s, y + 0.15 * s, z + 0.105 * s, { gk }); R.box(S('#1a1a22'), x + 0.03 * s, y + 0.12 * s, z + 0.1 * s, x + 0.06 * s, y + 0.15 * s, z + 0.105 * s, { gk });
  }
}
/** a short stack of books lying flat */
export function bookStack(R, x, y, z, n = 3) { const cols = ['#c8402a', '#2e5a8a', '#e8b040', '#3a7a4a', '#7a3a6a']; for (let i = 0; i < n; i++) R.box(S(cols[(i * 3 + Math.round(x * 10)) % 5]), x - 0.12 + (i % 2) * 0.02, y + i * 0.045, z - 0.09, x + 0.12 + (i % 2) * 0.02, y + (i + 1) * 0.045 - 0.004, z + 0.09); }
export function mug(R, x, y, z, c = '#f4f0e8') { R.box(S(c), x - 0.04, y, z - 0.04, x + 0.04, y + 0.1, z + 0.04); R.box(S(c), x + 0.04, y + 0.03, z - 0.01, x + 0.06, y + 0.07, z + 0.01); R.box(S('#5a3a22'), x - 0.03, y + 0.095, z - 0.03, x + 0.03, y + 0.1, z + 0.03); }

// ---------------------------------------------------------------- draw-call diet: solid-colour boxes → one vertex-coloured mesh per group
/**
 * While the district builds, every box whose faces are all plain TX.solid colours (trim, sills, little props,
 * plush toys...) goes into one vertex-coloured mesh per group instead of one mesh per colour. The meshes are
 * attached to the matching groups on the first frame, so the cutaway, fades and toggles treat them like the rest.
 * Returns finish(B): restores C.box and registers the attach step (B: any building of ours, to find the root).
 */
export function batchSolids(C) {
  const orig = C.box, acc = new Map(), col = new THREE.Color();
  const solid = (t) => { const m = t && t.userData && /^solid(#[0-9a-fA-F]{6})/.exec(t.userData.key || ''); return m ? m[1] : null; };
  const A = (gk) => { let a = acc.get(gk); if (!a) { a = { P: [], N: [], C: [], I: [] }; acc.set(gk, a); } return a; };
  const quad = (a, c, n, p0, p1, p2, p3) => { const b = a.P.length / 3; for (const p of [p0, p1, p2, p3]) { a.P.push(p[0], p[1], p[2]); a.N.push(n[0], n[1], n[2]); a.C.push(c.r, c.g, c.b); } a.I.push(b, b + 1, b + 2, b, b + 2, b + 3); };
  C.box = function (gk, tex, x0, y0, z0, x1, y1, z1, o = {}) {
    const base = solid(tex), f = { top: solid(o.top || tex), s: solid(o.s || tex), n: solid(o.n || tex), e: solid(o.e || tex), w: solid(o.w || tex) };
    if (!base || Object.values(f).some((v) => !v) || o.u0 !== undefined || o.v0 !== undefined) return orig.call(this, gk, tex, x0, y0, z0, x1, y1, z1, o);
    const a = A(gk), S = o.skip || {}, cc = (h) => col.set(h).clone();
    if (!S.top) quad(a, cc(f.top), [0, 1, 0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
    if (o.bottom) quad(a, cc(f.top), [0, -1, 0], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    if (!S.s) quad(a, cc(f.s), [0, 0, 1], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
    if (!S.n) quad(a, cc(f.n), [0, 0, -1], [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
    if (!S.e) quad(a, cc(f.e), [1, 0, 0], [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
    if (!S.w) quad(a, cc(f.w), [-1, 0, 0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    return this;
  };
  return (B) => {
    C.box = orig;
    let done = false;
    C.updaters.push(() => {
      if (done || !B.groups || !B.groups[0] || !B.groups[0].in) return;
      done = true;
      const root = B.groups[0].in.parent, mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
      for (const [gk, a] of acc) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(a.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(a.N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(a.C, 3));
        g.setIndex(a.I); g.computeBoundingSphere();
        const m = new THREE.Mesh(g, gk === 'ground' ? mat : mat.clone()); m.castShadow = gk !== 'ground'; m.receiveShadow = true; m.name = gk + ':solids';
        let grp = root.getObjectByName(gk); if (!grp) { grp = new THREE.Group(); grp.name = gk; root.add(grp); }
        grp.add(m);
      }
    });
  };
}
