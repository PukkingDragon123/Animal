// CityBuilder: lays out the walkable city in metres (x east, z south, y up; the camera looks from the
// south-east). Geometry is low-poly (boxes, quads, prisms) wearing pixel-art textures from pixtex.js,
// merged into one mesh per (group, texture). Groups let the camera cut buildings open: every building
// has, per storey k, a 'front' group (south + east walls, facing the camera), a 'back' group (north +
// west walls), an 'in' group (floor slab, inner walls, furniture) and one 'roof' group.
// The same calls stamp the collision / height grid (nav.js), place voxel props (voxprops.js), doors that
// swing open as you approach, interactables (examine / use prompts), named spots, and zones.
import * as THREE from '../../../vendor/three.module.js';
import { CityNav, CELL } from './nav.js';
import * as TX from './pixtex.js';
import { propMeshes, PROPS } from './voxprops.js';
import { glowInfo } from '../render/glow.js';
import { surfaceMaterial } from '../render/surface.js';
import { mergeLights } from '../render/pools.js';
import { skirt } from '../render/skirt.js';
import { mergeCity, mergeKey, PROXY_MAT, SHADOW_LAYER } from './merge.js';

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const FH = 3;   // storey height of enterable buildings (nav levels are 3 m apart)

export class CityBuilder {
  constructor(w, d, o = {}) {
    this.w = w; this.d = d; this.nav = new CityNav(w, d);
    this.groups = new Map(); this.props = []; this.spots = {}; this.zones = []; this.inter = []; this.doors = []; this.lamps = []; this.buildings = []; this.updaters = [];
    this.night = !!o.night; this.mm = [];
  }
  /** minimap colour for a rect (painted in call order) */
  paint(x0, z0, x1, z1, col) { this.mm.push([x0, z0, x1, z1, col]); }
  // ---------------------------------------------------------------- raw geometry
  acc(gk, tex) {
    let G = this.groups.get(gk); if (!G) { G = new Map(); this.groups.set(gk, G); }
    const k = tex.userData.key; let A = G.get(k); if (!A) { A = { tex, P: [], N: [], U: [], I: [] }; G.set(k, A); }
    return A;
  }
  /** quad a-b-c-d (a bottom-left, b bottom-right, c top-right, d top-left, counter-clockwise seen from the front) */
  quad(gk, tex, a, b, c, d, o = {}) {
    const A = this.acc(gk, tex), n = nrm(cross(sub(b, a), sub(d, a))), [tw, th] = tex.userData.size, base = A.P.length / 3;
    if (!o.decal) A.solid = true;          // a mesh of nothing but decals (windows, signs on walls) casts no shadow
    let uv;
    if (o.fit) uv = o.flipU ? [[1, 0], [0, 0], [0, 1], [1, 1]] : [[0, 0], [1, 0], [1, 1], [0, 1]];
    else { const lu = len(sub(b, a)) / tw, lv = len(sub(d, a)) / th, u0 = (o.u0 || 0) / tw, v0 = (o.v0 || 0) / th; uv = [[u0, v0], [u0 + lu, v0], [u0 + lu, v0 + lv], [u0, v0 + lv]]; }
    for (const p of [a, b, c, d]) A.P.push(p[0], p[1], p[2]);
    for (let i = 0; i < 4; i++) A.N.push(n[0], n[1], n[2]);
    for (const t of uv) A.U.push(t[0], t[1]);
    A.I.push(base, base + 1, base + 2, base, base + 2, base + 3);
    return this;
  }
  tri(gk, tex, a, b, c) {
    const A = this.acc(gk, tex); A.solid = true;
    const n = nrm(cross(sub(b, a), sub(c, a))), [tw, th] = tex.userData.size, base = A.P.length / 3;
    for (const p of [a, b, c]) { A.P.push(p[0], p[1], p[2]); A.N.push(n[0], n[1], n[2]); }
    // planar UVs from the dominant axis
    const ax = Math.abs(n[0]) > Math.abs(n[2]) ? 2 : 0;
    for (const p of [a, b, c]) A.U.push(p[ax] / tw, p[1] / th);
    A.I.push(base, base + 1, base + 2);
  }
  /** axis-aligned box; tex for the sides, o.top for the top (defaults to tex), o.skip: { top, bottom, n, s, e, w } */
  box(gk, tex, x0, y0, z0, x1, y1, z1, o = {}) {
    const S = o.skip || {}, top = o.top || tex, uv = { u0: o.u0, v0: o.v0 };
    if (!S.top) this.quad(gk, top, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], { u0: x0, v0: -z1 });
    if (o.bottom) this.quad(gk, top, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    if (!S.s) this.quad(gk, o.s || tex, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], { ...uv, u0: o.u0 ?? x0, v0: o.v0 ?? y0 });
    if (!S.n) this.quad(gk, o.n || tex, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], { ...uv, u0: o.u0 ?? -x1, v0: o.v0 ?? y0 });
    if (!S.e) this.quad(gk, o.e || tex, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], { ...uv, u0: o.u0 ?? -z1, v0: o.v0 ?? y0 });
    if (!S.w) this.quad(gk, o.w || tex, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], { ...uv, u0: o.u0 ?? z0, v0: o.v0 ?? y0 });
    return this;
  }
  /** a picture quad (sign, window, poster) on a wall plane, facing 's' | 'n' | 'e' | 'w'; (x, z) = centre on the wall line */
  decal(gk, tex, x, y, z, face, w, h, o = {}) {
    const off = o.off ?? 0.02, hw = w / 2;
    const P = { s: [[x - hw, z + off], [x + hw, z + off]], n: [[x + hw, z - off], [x - hw, z - off]], e: [[x + off, z + hw], [x + off, z - hw]], w: [[x - off, z - hw], [x - off, z + hw]] }[face];
    const [a, b] = P;
    this.quad(gk, tex, [a[0], y, a[1]], [b[0], y, b[1]], [b[0], y + h, b[1]], [a[0], y + h, a[1]], { fit: true, decal: true });
  }
  // ---------------------------------------------------------------- ground
  /** a walkable ground patch at height y (level 0) */
  ground(x0, z0, x1, z1, tex, o = {}) {
    const y = o.y || 0, gk = o.gk || 'ground';
    this.quad(gk, tex, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], { u0: x0, v0: -z1 });
    if (gk === 'ground') this.paint(x0, z0, x1, z1, o.mm || mmCol(tex));
    if (o.walk !== false) this.nav.open(x0, z0, x1, z1, o.L || 0, y); else this.nav.block(x0, z0, x1, z1, o.L || 0);
    return this;
  }
  /** a street: asphalt with a dashed centre line running along 'x' or 'z' */
  street(x0, z0, x1, z1, o = {}) {
    this.ground(x0, z0, x1, z1, o.tex || TX.asphalt());
    const along = o.dir || (x1 - x0 > z1 - z0 ? 'x' : 'z'), dash = TX.dashTex();
    if (o.line !== false) {
      if (along === 'x') { const zc = (z0 + z1) / 2; for (let x = x0 + 1; x < x1 - 1; x += 3) this.quad('ground', dash, [x, 0.012, zc + 0.08], [x + 3, 0.012, zc + 0.08], [x + 3, 0.012, zc - 0.08], [x, 0.012, zc - 0.08], { fit: true }); }
      else { const xc = (x0 + x1) / 2; for (let z = z0 + 1; z < z1 - 1; z += 3) this.quad('ground', dash, [xc - 0.08, 0.012, z], [xc - 0.08, 0.012, z + 3], [xc + 0.08, 0.012, z + 3], [xc + 0.08, 0.012, z], { fit: true }); }
    }
    return this;
  }
  /** zebra crossing over a street: stripes across 'x' or 'z' */
  crossing(x0, z0, x1, z1, dir = 'x') {
    const z = TX.zebraTex();
    if (dir === 'x') this.quad('ground', z, [x0, 0.014, z1], [x1, 0.014, z1], [x1, 0.014, z0], [x0, 0.014, z0], { u0: x0, v0: 0 });
    else this.quad('ground', z, [x0, 0.014, z0], [x0, 0.014, z1], [x1, 0.014, z1], [x1, 0.014, z0], { u0: z0, v0: 0 });
  }
  /** a raised sidewalk with a curb on every side (h metres high) */
  sidewalk(x0, z0, x1, z1, o = {}) {
    const h = o.h ?? 0.12, tex = o.tex || TX.pavers(), curb = TX.concrete('#b8b4ac');
    this.box('ground', curb, x0, 0, z0, x1, h, z1, { top: tex, skip: o.skip });
    this.nav.open(x0, z0, x1, z1, 0, h); this.paint(x0, z0, x1, z1, o.mm || mmCol(tex));
    return this;
  }
  /** water at y (blocked); a quay wall drops to it along the given sides */
  water(x0, z0, x1, z1, o = {}) {
    const y = o.y ?? -0.8, tex = TX.water(o.col || '#3a7ab0');
    this.quad('water', tex, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], { u0: x0, v0: -z1 });
    this.nav.block(x0, z0, x1, z1, 0); this.paint(x0, z0, x1, z1, '#3a6aa0');
    return this;
  }
  /** a raised or sunken block of ground (terraces, plinths, piers): walkable top at y */
  plinth(x0, z0, x1, z1, y, tex, side, o = {}) { this.box(o.gk || 'ground', side || TX.concrete(), x0, o.y0 ?? Math.min(0, y - 1), z0, x1, y, z1, { top: tex, skip: o.skip }); this.nav.open(x0, z0, x1, z1, 0, y); this.paint(x0, z0, x1, z1, o.mm || mmCol(tex)); return this; }
  // ---------------------------------------------------------------- props, lights, spots, zones, interactions
  prop(kind, x, z, o = {}) {
    const P = PROPS[kind]; if (!P) return this;
    const L = o.L || 0, y = o.y ?? this.nav.ground(x, z, L), yaw = o.yaw || 0;
    this.props.push({ kind, x, y, z, yaw, s: o.s || 1, nolight: o.light === false });
    if (o.collide !== false && P.r) {
      if (Array.isArray(P.r)) { let [w, d] = P.r; if (Math.abs(Math.sin(yaw)) > 0.7) [w, d] = [d, w]; this.nav.block(x - w / 2, z - d / 2, x + w / 2, z + d / 2, L); }
      else this.nav.block(x - P.r, z - P.r, x + P.r, z + P.r, L);
    }
    return this;
  }
  /** an explicit light (props with glowing voxels light themselves): a pool of `color` light of radius r around
   *  (x, y, z), `intensity` = its brightness right below; halo: size (m) of the glow sprite at night, 0 = none */
  light(x, y, z, o = {}) {
    const c = new THREE.Color(o.color ?? 0xffd8a0), k = o.intensity ?? 1;
    (this.lights = this.lights || []).push({ x, y, z, r: o.r ?? 8, col: [c.r * k, c.g * k, c.b * k], sh: o.sh ?? Math.max(0.8, y - this.nav.ground(x, z, o.L || 0)), halo: o.halo ?? 0 });
    return this;
  }
  /** a string of lanterns between two points (Chinatown) */
  lanterns(x0, z0, x1, z1, y = 4.2, n = 6) { for (let i = 0; i <= n; i++) { const t = i / n, sag = Math.sin(t * Math.PI) * 0.6; this.props.push({ kind: 'lantern', x: x0 + (x1 - x0) * t, y: y - sag - 1, z: z0 + (z1 - z0) * t, yaw: 0 }); } }
  /** a resident who stands (or idles) at a spot and talks when you press E: lines are strings or async (app, npc) => {} */
  npc(o) {
    const n = { L: 0, yaw: 0, name: '', lines: [], ...o };
    this.npcs = this.npcs || []; this.npcs.push(n);
    this.interact({ npc: n.id, x: n.x, z: n.z, L: n.L, r: 1.8, label: o.label || 'Talk' + (n.name ? ' to ' + n.name : ''), icon: 'chat', act: async (app) => {
      const a = app.world.actor(n.id), me = app.world.player;
      if (a && me) { a.face(me); me.face(a); if (a.anim && a.anim.face) a.anim.face('smile', 3); a.play('talk', { restart: true }); }
      if (typeof n.lines === 'function') await n.lines(app, n);
      else { const L = Array.isArray(n.lines[0]) ? n.lines[(n.said = ((n.said ?? -1) + 1) % n.lines.length)] : n.lines; await app.say(n.name, ...L); }
      if (a) a.play(n.clip || 'idle');   // seated / posed NPCs go back to their pose
    } });
    return n;
  }
  spot(name, x, z, yaw = 0, L = 0) { this.spots[name] = [x, z, yaw, this.nav.ground(x, z, L)]; return this; }
  zone(name, x0, z0, x1, z1, o = {}) { const Z = { name, label: o.label || name, sub: o.sub || '', music: o.music, bed: o.bed, step: o.step, rect: [x0, z0, x1, z1] }; this.zones.push(Z); this.nav.setZone(x0, z0, x1, z1, Z); return Z; }
  /** an interactable: { x, z, L, y, r, label ('Examine TV'), verb, icon, act: async (app, it) => {} } */
  interact(o) { const it = { r: 1.3, L: 0, icon: 'eye', ...o }; it.y = o.y ?? this.nav.ground(o.x, o.z, it.L) + 1.2; this.inter.push(it); return it; }
  // ---------------------------------------------------------------- walls & doors
  /** a wall run from (x0, z0) to (x1, z1) between heights y0 and y1, thickness t centred on the line;
   *  outer texture on the side the normal points to (o.face: 's' | 'n' | 'e' | 'w'), inner on the other;
   *  gaps: [{ at (metres from the start), w, y0, y1 }] cut doorways / openings */
  wall(gk, x0, z0, x1, z1, y0, y1, tex, o = {}) {
    const t = o.t ?? 0.2, inner = o.inner || tex, gaps = (o.gaps || []).slice().sort((a, b) => a.at - b.at), L = o.L ?? Math.round(y0 / FH);
    const lenW = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / lenW, uz = (z1 - z0) / lenW;
    // the normal: rotate the run direction by -90° (right-hand side when walking from start to end)
    const nx = uz, nz = -ux, side = o.flip ? -1 : 1, ox = nx * side * t / 2, oz = nz * side * t / 2;
    // align 'outer': the outer face sits on the line and the wall's thickness goes inward
    const sh = o.align === 'outer' ? -1 : 0;
    const P = (s, y, k) => [x0 + ux * s + ox * (k + sh), y, z0 + uz * s + oz * (k + sh)];
    const piece = (s0, s1, ya, yb) => {
      if (s1 - s0 < 0.001 || yb - ya < 0.001) return;
      // outer face (normal +n·side), inner face, top cap and end caps
      const outer = side > 0 ? [P(s1, ya, 1), P(s0, ya, 1), P(s0, yb, 1), P(s1, yb, 1)] : [P(s0, ya, 1), P(s1, ya, 1), P(s1, yb, 1), P(s0, yb, 1)];
      const innerQ = side > 0 ? [P(s0, ya, -1), P(s1, ya, -1), P(s1, yb, -1), P(s0, yb, -1)] : [P(s1, ya, -1), P(s0, ya, -1), P(s0, yb, -1), P(s1, yb, -1)];
      this.quad(o.outerGk || gk, tex, ...outer, { u0: (side > 0 ? -(s1) : s0) + (o.u0 || 0), v0: ya });
      if (o.inner !== false) this.quad(o.innerGk || gk, inner, ...innerQ, { u0: s0, v0: ya });
      const cap = o.cap || TX.solid('#d8d0c4');
      this.quad(gk, cap, P(s0, yb, 1), P(s1, yb, 1), P(s1, yb, -1), P(s0, yb, -1));
      this.quad(gk, cap, P(s0, ya, -1), P(s0, ya, 1), P(s0, yb, 1), P(s0, yb, -1));
      this.quad(gk, cap, P(s1, ya, 1), P(s1, ya, -1), P(s1, yb, -1), P(s1, yb, 1));
    };
    let s = 0;
    for (const g of gaps) {
      const a = g.at - g.w / 2, b = g.at + g.w / 2;
      piece(s, a, y0, y1);
      piece(a, b, y0, g.y0 ?? y0); piece(a, b, g.y1 ?? y0 + 2.2, y1);
      s = b;
    }
    piece(s, lenW, y0, y1);
    if (o.collide !== false) {
      const L0 = L;
      let s2 = 0;
      const cx = ox * sh, cz = oz * sh;
      const seg = (sa, sb) => { if (sb - sa > 0.01) this.nav.wall(x0 + ux * sa + cx, z0 + uz * sa + cz, x0 + ux * sb + cx, z0 + uz * sb + cz, L0, Math.max(t, 0.2)); };
      for (const g of gaps) { if ((g.y0 ?? y0) > y0 + 0.3) continue; seg(s2, g.at - g.w / 2); s2 = g.at + g.w / 2; }
      seg(s2, lenW);
    }
    return this;
  }
  /** a swinging door in a doorway: centre (x, z), wall runs along 'x' or 'z', width w; opens when you come near */
  door(x, z, axis, o = {}) {
    const w = o.w || 1.0, h = o.h || 2.15, L = o.L || 0, y = o.y ?? L * FH, tex = o.tex || TX.doorTex(o.col || '#7a3a2a'), gk = 'door' + this.doors.length;
    // the panel is built around its hinge at local origin, extending along +local x
    const t = 0.06;
    const D = { x, z, y, axis, w, h, L, gk, open: 0, want: 0, hinge: axis === 'x' ? [x - w / 2, z] : [x, z - w / 2], swing: o.swing || 1, sfx: o.sfx !== false, locked: !!o.locked };
    this.box(gk, TX.solid(o.edge || '#5a2a1e'), 0, 0, -t / 2, w, h, t / 2, { s: tex, n: tex, top: TX.solid('#5a2a1e') });
    this.doors.push(D);
    if (D.locked) this.nav.block(x - (axis === 'x' ? w / 2 : 0.1), z - (axis === 'z' ? w / 2 : 0.1), x + (axis === 'x' ? w / 2 : 0.1), z + (axis === 'z' ? w / 2 : 0.1), L);
    return D;
  }
  // ---------------------------------------------------------------- buildings
  /**
   * A building on footprint (x, z, w, d).
   *  floors, fh (storey height; enterable buildings use 3 m), wall (texture), trim (colour), base (plinth colour)
   *  roof: { type: 'flat' | 'gable' | 'hip', tex, h, ridge: 'x' | 'z', eave }
   *  door: { side: 's' | 'n' | 'e' | 'w', at: 0..1 along the side, tex, w, act } (several allowed: doors: [...])
   *  windows: { tex, lit, every (m), skip: [sides] }, bay: true (Victorian bay windows on the street side)
   *  shop: { sign, bg, fg, awning: [a, b], side } — a shopfront on the ground floor
   *  enter: true → walkable interior; interior(C, B) builds rooms / furniture / stairs (see B.gk)
   */
  building(o) {
    const id = this.buildings.length, { x, z, w, d } = o, enter = !!o.enter, fh = enter ? FH : o.fh || 3.2, floors = o.floors || 2, H = floors * fh;
    const wallT = o.wall || TX.plaster('#e8d8c0'), trim = TX.solid(o.trim || '#f4ece0'), inner = o.inner || TX.wallpaper();
    const B = { id, x, z, w, d, floors, fh, H, enter, name: o.name || 'building' + id, o, gk: (k, part) => `b${id}:f${k}:${part}` };
    this.buildings.push(B); this.paint(x, z, x + w, z + d, o.mm || (enter ? '#e8b878' : '#c8786a'));
    const doors = o.doors || (o.door ? [o.door] : []);
    const sides = { s: [x, z + d, x + w, z + d], e: [x + w, z + d, x + w, z], n: [x + w, z, x, z], w: [x, z, x, z + d] };
    const sideLen = (sd) => (sd === 's' || sd === 'n' ? w : d);
    const front = (sd) => sd === 's' || sd === 'e';
    // outer walls, storey by storey (each storey's walls in its own group so the camera can cut them)
    for (let k = 0; k < floors; k++) for (const sd of ['s', 'e', 'n', 'w']) {
      const [ax, az, bx, bz] = sides[sd], L = sideLen(sd), y0 = k * fh, y1 = (k + 1) * fh;
      const gaps = k === 0 ? doors.filter((dr) => dr.side === sd).map((dr) => ({ at: dr.at * L, w: dr.w || 1.1, y1: 2.3 })) : [];
      const gk = B.gk(k, front(sd) ? 'front' : 'back');
      this.wall(gk, ax, az, bx, bz, y0, y1, wallT, { gaps, inner, t: 0.2, flip: true, align: 'outer', collide: enter ? k === 0 || enter : false, L: enter ? k : 0, innerGk: enter && !front(sd) ? B.gk(k, 'in') : gk, u0: 0 });
      // trim band at the floor line and a base course
      const bandY = y1 - 0.12;
      if (k < floors - 1 || o.roof?.type !== 'flat') this.band(gk, sd, ax, az, bx, bz, bandY, 0.12, 0.08, trim);
      if (k === 0) this.band(gk, sd, ax, az, bx, bz, 0, 0.35, 0.05, TX.solid(o.base || '#8a8078'));
      // windows across this storey (skipping doors and the shopfront)
      const win = o.windows || {};
      if (win.skip && win.skip.includes(sd)) continue;
      const shopHere = o.shop && k === 0 && (o.shop.side || 's') === sd;
      if (shopHere) continue;
      const every = win.every || 2.4, n = Math.max(1, Math.floor((L - 0.6) / every)), step = L / n;
      for (let i = 0; i < n; i++) {
        const at = step * (i + 0.5);
        if (k === 0 && doors.some((dr) => dr.side === sd && Math.abs(dr.at * L - at) < (dr.w || 1.1) / 2 + 0.7)) continue;
        this.windowAt(gk, sd, ax, az, bx, bz, at, y0 + (k === 0 ? 0.95 : 0.85), win, B);
      }
    }
    // doors: swinging panels for enterable buildings, painted doors otherwise
    for (const dr of doors) {
      const [ax, az, bx, bz] = sides[dr.side], L = sideLen(dr.side), t = dr.at * L, ux = (bx - ax) / L, uz = (bz - az) / L, cx = ax + ux * t, cz = az + uz * t;
      const axis = dr.side === 's' || dr.side === 'n' ? 'x' : 'z';
      // step and frame
      this.band(B.gk(0, front(dr.side) ? 'front' : 'back'), dr.side, cx - ux * 0.65, cz - uz * 0.65, cx + ux * 0.65, cz + uz * 0.65, 2.25, 0.14, 0.1, trim);
      if (enter && !dr.painted) {
        const D = this.door(cx, cz, axis, { w: dr.w || 1.0, tex: dr.tex, col: dr.col, L: 0 });
        D.building = id;
      } else {
        const face = dr.side;
        this.decal(B.gk(0, front(face) ? 'front' : 'back'), dr.tex || TX.doorTex(dr.col || '#7a3a2a', dr.kind), cx, 0, cz, face, dr.w || 1.0, 2.2, { off: 0.03 });
        if (dr.act || dr.label) this.interact({ x: cx + (face === 'e' ? 0.7 : face === 'w' ? -0.7 : 0), z: cz + (face === 's' ? 0.7 : face === 'n' ? -0.7 : 0), label: dr.label || 'Knock', icon: 'door', act: dr.act || (async (app) => app.say('', 'The door is locked.')) });
      }
      // a doorstep outside
      const ox = dr.side === 'e' ? 0.3 : dr.side === 'w' ? -0.3 : 0, oz = dr.side === 's' ? 0.3 : dr.side === 'n' ? -0.3 : 0;
      this.box('ground', TX.concrete('#c8c0b4'), cx - (axis === 'x' ? 0.7 : 0.3) + ox, 0, cz - (axis === 'z' ? 0.7 : 0.3) + oz, cx + (axis === 'x' ? 0.7 : 0.3) + ox, 0.08, cz + (axis === 'z' ? 0.7 : 0.3) + oz);
    }
    // shopfront: big windows, sign board, awning
    if (o.shop) this.shopfront(B, o.shop, sides);
    if (o.bay) for (let k = 1; k < floors; k++) this.bayWindow(B, k);
    // roof
    this.roof(B, o.roof || { type: 'flat' });
    // collision / interior
    if (!enter) this.nav.block(x, z, x + w, z + d, 0);
    else {
      B.holes = [];
      for (let k = 0; k < floors; k++) { if (k > 0) this.nav.open(x + 0.1, z + 0.1, x + w - 0.1, z + d - 0.1, k, k * FH); this.nav.mark(x, z, x + w, z + d, k, id); }
      if (o.interior) o.interior(this, B);
      // floor slabs (upper ones leave the stairwells open); o.floors: per-storey floor textures
      for (let k = 0; k < floors; k++) {
        const ft = (o.floorTexs && o.floorTexs[k]) || o.floorTex || TX.planks(), y = k * FH + 0.02;
        for (const [rx0, rz0, rx1, rz1] of cutRect([x, z, x + w, z + d], B.holes.filter((h) => h[4] === k))) {
          this.quad(B.gk(k, 'in'), ft, [rx0, y, rz1], [rx1, y, rz1], [rx1, y, rz0], [rx0, y, rz0], { u0: rx0, v0: -rz1 });
          if (k > 0) this.box(B.gk(k, 'in'), TX.solid('#d8d0c4'), rx0, k * FH - 0.25, rz0, rx1, k * FH, rz1, { skip: { top: true }, bottom: true });
        }
      }
    }
    return B;
  }
  /** a thin horizontal band (cornice, trim, step) standing proud of a wall side */
  band(gk, sd, ax, az, bx, bz, y, h, out, tex) {
    const mnx = Math.min(ax, bx), mxx = Math.max(ax, bx), mnz = Math.min(az, bz), mxz = Math.max(az, bz);
    if (sd === 's') this.box(gk, tex, mnx - out, y, mxz - 0.02, mxx + out, y + h, mxz + out);
    if (sd === 'n') this.box(gk, tex, mnx - out, y, mnz - out, mxx + out, y + h, mnz + 0.02);
    if (sd === 'e') this.box(gk, tex, mxx - 0.02, y, mnz - out, mxx + out, y + h, mxz + out);
    if (sd === 'w') this.box(gk, tex, mnx - out, y, mnz - out, mnx + 0.02, y + h, mxz + out);
  }
  windowAt(gk, sd, ax, az, bx, bz, at, y, win, B) {
    const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, cx = ax + ux * at, cz = az + uz * at, ww = win.w || 1.0, wh = win.h || 1.4;
    const lit = (win.lit ?? 0.35) > ((Math.sin(cx * 12.9 + cz * 78.2 + y) * 43758.5) % 1 + 1) % 1;
    const tex = win.tex || TX.windowTex(win.frame || '#f2ead8', win.curtain || ['#d87a6a', '#7aa0c8', '#e8c86a', '#9ac87a'][Math.floor(Math.abs(cx + cz)) % 4], this.night && lit);
    this.decal(gk, tex, cx, y, cz, sd, ww, wh, { off: 0.03 });
    // sill
    const so = 0.12;
    if (sd === 's') this.box(gk, TX.solid('#e8e0d0'), cx - ww / 2 - 0.08, y - 0.08, cz, cx + ww / 2 + 0.08, y, cz + so);
    if (sd === 'n') this.box(gk, TX.solid('#e8e0d0'), cx - ww / 2 - 0.08, y - 0.08, cz - so, cx + ww / 2 + 0.08, y, cz);
    if (sd === 'e') this.box(gk, TX.solid('#e8e0d0'), cx, y - 0.08, cz - ww / 2 - 0.08, cx + so, y, cz + ww / 2 + 0.08);
    if (sd === 'w') this.box(gk, TX.solid('#e8e0d0'), cx - so, y - 0.08, cz - ww / 2 - 0.08, cx, y, cz + ww / 2 + 0.08);
    if (B && B.enter) this.decal(gk.replace(/:back$/, ':in'), TX.windowTex('#f2ead8', '#e8e0d0', false), cx, y, cz, { s: 'n', n: 's', e: 'w', w: 'e' }[sd], ww, wh, { off: 0.22 });
  }
  shopfront(B, S, sides) {
    const sd = S.side || 's', [ax, az, bx, bz] = sides[sd], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, gk = B.gk(0, sd === 's' || sd === 'e' ? 'front' : 'back');
    const doorAt = ((B.o.doors || [B.o.door]).find((dr) => dr && dr.side === sd) || { at: 0.5 }).at * L;
    // windows either side of the door
    for (const [s0, s1] of [[0.4, doorAt - 0.8], [doorAt + 0.8, L - 0.4]]) {
      if (s1 - s0 < 1) continue;
      const c = (s0 + s1) / 2, cx = ax + ux * c, cz = az + uz * c;
      this.decal(gk, TX.shopWindowTex(S.frame || '#2a2a34', this.night, B.id), cx, 0.45, cz, sd, s1 - s0, 1.85, { off: 0.03 });
    }
    // sign board over the shop
    const sx = ax + ux * L / 2, sz = az + uz * L / 2, sw = Math.min(L - 0.6, S.signW || Math.max(2.4, (S.sign || '').length * 0.42 + 0.6));
    const tex = TX.signTex(S.sign || 'SHOP', S.bg || '#c83a3a', S.fg || '#ffe8a0', { w: sw, h: 0.75 });
    const off = 0.16, o2 = { s: [0, off], n: [0, -off], e: [off, 0], w: [-off, 0] }[sd];
    this.band(gk, sd, sx - ux * sw / 2, sz - uz * sw / 2, sx + ux * sw / 2, sz + uz * sw / 2, 2.5, 0.85, 0.14, TX.solid(S.board || '#3a2a2a'));
    this.decal(gk, tex, sx + o2[0], 2.55, sz + o2[1], sd, sw, 0.75, { off: 0.01 });
    // awning: a sloped striped canopy above the windows
    if (S.awning) {
      const at = TX.awningTex(S.awning[0], S.awning[1]), y1 = 2.45, y0 = 2.05, dep = 1.1, x0 = ax + ux * 0.3, z0 = az + uz * 0.3, x1 = bx - ux * 0.3, z1 = bz - uz * 0.3, n = { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] }[sd];
      const A = [x0, y1, z0], Bp = [x1, y1, z1], C = [x1 + n[0] * dep, y0, z1 + n[1] * dep], D = [x0 + n[0] * dep, y0, z0 + n[1] * dep];
      if (sd === 's' || sd === 'w') { this.quad(gk, at, D, C, Bp, A); this.quad(gk, at, A, Bp, C, D); } else { this.quad(gk, at, C, D, A, Bp); this.quad(gk, at, Bp, A, D, C); }
    }
  }
  bayWindow(B, k) {
    const { x, z, w, d, fh } = B, gk = B.gk(k, 'front'), bw = Math.min(2.6, w * 0.45), cx = x + w * 0.3, y0 = k * fh + 0.2, y1 = (k + 1) * fh - 0.3, dep = 0.6;
    const wallT = B.o.wall || TX.plaster(), trim = TX.solid(B.o.trim || '#f4ece0');
    this.box(gk, wallT, cx - bw / 2, y0, z + d, cx + bw / 2, y1, z + d + dep, { top: trim });
    this.box(gk, trim, cx - bw / 2 - 0.08, y1, z + d - 0.02, cx + bw / 2 + 0.08, y1 + 0.15, z + d + dep + 0.1);
    this.decal(gk, TX.windowTex('#f2ead8', '#e8c86a', this.night), cx, y0 + 0.5, z + d + dep, 's', bw - 0.5, 1.5, { off: 0.03 });
  }
  roof(B, R) {
    const { x, z, w, d, H } = B, gk = `b${B.id}:roof`, type = R.type || 'flat', tex = R.tex || (type === 'flat' ? TX.concrete('#9a968e') : TX.shingles(R.col || '#5a4a5a')), wallT = B.o.wall || TX.plaster();
    if (type === 'flat') {
      this.box(gk, tex, x, H, z, x + w, H + 0.05, z + d, { skip: { n: true, s: true, e: true, w: true } });
      const p = TX.solid(B.o.trim || '#f4ece0'), ph = R.parapet ?? 0.5, t = 0.2;
      this.box(gk, p, x - 0.05, H, z - 0.05, x + w + 0.05, H + ph, z + t); this.box(gk, p, x - 0.05, H, z + d - t, x + w + 0.05, H + ph, z + d + 0.05);
      this.box(gk, p, x - 0.05, H, z, x + t, H + ph, z + d); this.box(gk, p, x + w - t, H, z, x + w + 0.05, H + ph, z + d);
      if (R.tank) this.box(gk, TX.metalRoof('#8a9aa8'), x + w * 0.6, H, z + d * 0.2, x + w * 0.6 + 1.4, H + 1.6, z + d * 0.2 + 1.4);
      return;
    }
    const rh = R.h || Math.min(w, d) * 0.45, e = R.eave ?? 0.4, ridge = R.ridge || (w >= d ? 'x' : 'z');
    if (type === 'gable') {
      if (ridge === 'x') {
        const zm = z + d / 2, y = H + rh;
        this.quad(gk, tex, [x - e, H - 0.15, z + d + e], [x + w + e, H - 0.15, z + d + e], [x + w + e, y, zm], [x - e, y, zm]);
        this.quad(gk, tex, [x + w + e, H - 0.15, z - e], [x - e, H - 0.15, z - e], [x - e, y, zm], [x + w + e, y, zm]);
        this.tri(gk, wallT, [x + w, H, z + d], [x + w, H, z], [x + w, y, zm]); this.tri(gk, wallT, [x, H, z], [x, H, z + d], [x, y, zm]);
      } else {
        const xm = x + w / 2, y = H + rh;
        this.quad(gk, tex, [x + w + e, H - 0.15, z + d + e], [x + w + e, H - 0.15, z - e], [xm, y, z - e], [xm, y, z + d + e]);
        this.quad(gk, tex, [x - e, H - 0.15, z - e], [x - e, H - 0.15, z + d + e], [xm, y, z + d + e], [xm, y, z - e]);
        this.tri(gk, wallT, [x, H, z + d], [x + w, H, z + d], [xm, y, z + d]); this.tri(gk, wallT, [x + w, H, z], [x, H, z], [xm, y, z]);
      }
      return;
    }
    // hip roof (Chinatown: green tiles with upturned eaves)
    const y = H + rh, inset = Math.min(w, d) / 2 * 0.9, a = [x - e, H - 0.1, z + d + e], b = [x + w + e, H - 0.1, z + d + e], c = [x + w + e, H - 0.1, z - e], dd = [x - e, H - 0.1, z - e];
    const r0 = [x + inset, y, z + d - inset], r1 = [x + w - inset, y, z + d - inset], r2 = [x + w - inset, y, z + inset], r3 = [x + inset, y, z + inset];
    this.quad(gk, tex, a, b, r1, r0); this.quad(gk, tex, b, c, r2, r1); this.quad(gk, tex, c, dd, r3, r2); this.quad(gk, tex, dd, a, r0, r3);
    if (R.cap !== false) this.box(gk, TX.solid(R.capCol || '#c83a3a'), r3[0] - 0.1, y - 0.05, r3[2] - 0.1, r1[0] + 0.1, y + 0.2, r1[2] + 0.1);
    if (R.upturn) for (const p of [a, b, c, dd]) this.box(gk, TX.solid(R.capCol || '#c83a3a'), p[0] - 0.15, p[1], p[2] - 0.15, p[0] + 0.15, p[1] + 0.45, p[2] + 0.15);
  }
  /** interior wall on storey k inside building B (groups: in), with door gaps; collides on that storey */
  iwall(B, k, x0, z0, x1, z1, o = {}) {
    const y0 = k * FH, y1 = y0 + (o.h || FH - 0.05), tex = o.tex || B.o.inner || TX.wallpaper();
    return this.wall(B.gk(k, 'in'), x0, z0, x1, z1, y0, y1, tex, { gaps: (o.gaps || []).map((g) => ({ ...g, y1: g.y1 ?? y0 + 2.2 })), inner: o.tex2 || tex, t: o.t ?? 0.12, L: k });
  }
  /** a stair flight inside building B from storey k to k + 1: rect, climbing toward dir */
  stairs(B, k, x0, z0, x1, z1, dir, o = {}) {
    const gk = B.gk(k, 'in'), tex = o.tex || TX.planks('#8a5a36'), side = TX.solid(o.side || '#6a4428'), n = 12;
    const y0 = k * FH, y1 = (k + 1) * FH;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, yy = y0 + (y1 - y0) * t1;
      let bx0 = x0, bx1 = x1, bz0 = z0, bz1 = z1;
      if (dir === 'n') { bz1 = z1 - (z1 - z0) * t0; bz0 = z1 - (z1 - z0) * t1; } if (dir === 's') { bz0 = z0 + (z1 - z0) * t0; bz1 = z0 + (z1 - z0) * t1; }
      if (dir === 'e') { bx0 = x0 + (x1 - x0) * t0; bx1 = x0 + (x1 - x0) * t1; } if (dir === 'w') { bx1 = x1 - (x1 - x0) * t0; bx0 = x1 - (x1 - x0) * t1; }
      this.box(gk, side, bx0, y0, bz0, bx1, yy, bz1, { top: tex });
    }
    this.nav.stairs(x0, z0, x1, z1, dir, k, y0, y1);
    if (B.holes) B.holes.push([x0, z0, x1, z1, k + 1]);
    // the stairwell is open on the storey above: block the hole's edges except the landing
    if (o.rail !== false) { const r = TX.solid('#6a4428'); if (dir === 'n' || dir === 's') { this.box(B.gk(k + 1, 'in'), r, x0 - 0.06, y1, z0, x0, y1 + 0.9, z1); this.box(B.gk(k + 1, 'in'), r, x1, y1, z0, x1 + 0.06, y1 + 0.9, z1); } else { this.box(B.gk(k + 1, 'in'), r, x0, y1, z0 - 0.06, x1, y1 + 0.9, z0); this.box(B.gk(k + 1, 'in'), r, x0, y1, z1, x1, y1 + 0.9, z1 + 0.06); } }
    return this;
  }
  /** a furniture block inside B on storey k (blocks walking): box with side / top textures */
  furniture(B, k, x0, z0, x1, z1, h, tex, o = {}) {
    const y0 = k * FH + (o.y || 0);
    this.box(o.gk || B.gk(k, 'in'), tex, x0, y0, z0, x1, y0 + h, z1, { top: o.top || tex, s: o.s, n: o.n, e: o.e, w: o.w });
    if (o.collide !== false) this.nav.block(x0 + 0.05, z0 + 0.05, x1 - 0.05, z1 - 0.05, k);
    return this;
  }
  // ---------------------------------------------------------------- finish
  finalize(stage) {
    if (this.skirt !== false) skirt(this);
    const root = new THREE.Group(); root.name = 'city';
    const groups = {}, lights = [];
    // the solid-colour batches (districts/home/kit.js batchSolids): one vertex-coloured mesh per group
    const solidMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0, side: THREE.DoubleSide });
    for (const gk of (this.solidBatches || new Map()).keys()) if (!this.groups.has(gk)) this.groups.set(gk, new Map());
    for (const [gk, G] of this.groups) {
      const grp = new THREE.Group(); grp.name = gk;
      const sb = this.solidBatches && this.solidBatches.get(gk);
      if (sb && sb.I.length) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(sb.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(sb.N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(sb.C, 3));
        g.setIndex(sb.I); g.computeBoundingSphere();
        const m = new THREE.Mesh(g, gk === 'ground' ? solidMat : solidMat.clone()); m.castShadow = m.userData.cast = gk !== 'ground'; m.receiveShadow = true; m.name = gk + ':solids';
        grp.add(m);
      }
      for (const A of G.values()) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(A.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(A.N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(A.U, 2));
        g.setIndex(A.I); g.computeBoundingSphere();
        const water = gk === 'water';
        // Standard materials: roughness, metalness, pixel relief and glass panes by the texture's family (render/surface.js);
        // interiors reflect the sky far less than the street does
        const inner = /:in$/.test(gk);
        const m = surfaceMaterial(A.tex, { side: water ? THREE.FrontSide : THREE.DoubleSide, transparent: water, opacity: water ? 0.88 : 1, env: inner ? 0.3 : 1 });
        // glowing pixels (lit windows, signs, screens): an emissive twin of the texture, scaled by the mood
        const gi = water ? null : glowInfo(A.tex, this.night);
        if (gi) {
          m.emissive.set(0xffffff); m.emissiveMap = gi.map;
          if (stage && stage.glowMat) stage.glowMat(m, gi.k, gi.always); else m.emissiveIntensity = gi.k;
          if (this.night || gi.always) windowLights(A, gi, lights);
        }
        const mesh = new THREE.Mesh(g, m); mesh.castShadow = mesh.userData.cast = !water && gk !== 'ground' && !!A.solid; mesh.receiveShadow = true;
        grp.add(mesh);
      }
      shadowProxy(grp);
      groups[gk] = grp; root.add(grp);
    }
    // the merged copy of everything static outside (city/merge.js): the buildings' own groups are only drawn while
    // the cutaway needs them (control.js); the ground and the skirt are drawn merged only
    if (this.merge !== false && !(typeof location !== 'undefined' && /[?&]nomerge=1/.test(location.search))) {
      this.merged = mergeCity(this, root, stage);
      for (const gk in groups) {
        const bid = mergeKey(gk); if (bid === null) continue;
        groups[gk].userData.merged = true; groups[gk].visible = false;
      }
    }
    // doors: re-parent each panel to a hinge pivot
    for (const D of this.doors) {
      const grp = groups[D.gk]; if (!grp) continue;
      const piv = new THREE.Group(); piv.position.set(D.hinge[0], D.y, D.hinge[1]); piv.rotation.y = D.axis === 'x' ? 0 : -Math.PI / 2;
      root.remove(grp); piv.add(grp); root.add(piv); D.pivot = piv; D.base = piv.rotation.y;
      const b = this.buildings[D.building]; if (b) b.doorPivots = (b.doorPivots || []).concat(piv);
    }
    // voxel props: instanced per kind and per 32 m tile, so the camera and the sun's shadow box only draw the
    // tiles they see; every prop with glowing voxels (lamps, lanterns, neon, vending machines) throws light
    const P = new THREE.Group(); P.name = 'props'; root.add(P);
    const tiles = new Map(), halos = [];
    for (const p of this.props) { const k = Math.floor(p.x / 32) + ',' + Math.floor(p.z / 32); if (!tiles.has(k)) tiles.set(k, []); tiles.get(k).push(p); }
    for (const list of tiles.values()) {
      const pg = propMeshes(list, stage.mats);
      for (const im of [...pg.children]) {
        if (im.isInstancedMesh) { im.computeBoundingSphere(); im.frustumCulled = true; if (im.material === stage.mats.glow) propLights(im, list, lights, this.nav, halos); }
        P.add(im);
      }
    }
    if (stage && stage.addLights) stage.addLights(mergeLights(lights).concat(halos, this.lights || []));
    // building group handles for the cutaway
    for (const B of this.buildings) {
      B.groups = []; for (let k = 0; k < B.floors; k++) B.groups.push({ front: groups[B.gk(k, 'front')], back: groups[B.gk(k, 'back')], in: groups[B.gk(k, 'in')] });
      B.roofG = groups[`b${B.id}:roof`];
    }
    const water = groups.water;
    // the minimap: 1 px per metre
    const MW = Math.ceil(this.w), MH = Math.ceil(this.d), col = new Array(MW * MH).fill('#2a2438');
    for (const [x0, z0, x1, z1, c] of this.mm) for (let zz = Math.max(0, Math.floor(z0)); zz < Math.min(MH, Math.ceil(z1)); zz++) for (let xx = Math.max(0, Math.floor(x0)); xx < Math.min(MW, Math.ceil(x1)); xx++) col[zz * MW + xx] = c;
    const minimap = { w: MW, h: MH, col };
    const city = {
      minimap, npcs: this.npcs || [],
      city: true, root, nav: this.nav, spots: this.spots, zones: this.zones, inter: this.inter, doors: this.doors, buildings: this.buildings, lamps: [], lights, size: [this.w, 30, this.d],
      update: (dt, t) => { if (water) for (const m of water.children) if (m.material.map) m.material.map.offset.set(Math.sin(t * 0.2) * 0.05, t * 0.01); for (const f of this.updaters) f(dt, t); },
    };
    return city;
  }
}
// ---------------------------------------------------------------- shadows
// one merged, invisible shadow caster per group (instead of one per texture): the sun's shadow pass draws a
// single mesh per building part. It draws nothing in the camera's pass and follows the group's visibility.
// fades and ghosting walk every child of a group and set these: the proxy must never draw or write depth
for (const [k, v] of Object.entries({ colorWrite: false, depthWrite: false, transparent: false, opacity: 1 })) Object.defineProperty(PROXY_MAT, k, { get: () => v, set() {}, configurable: true });
function shadowProxy(grp) {
  const cast = grp.children.filter((m) => m.isMesh && m.castShadow);
  if (cast.length < 2) return;
  let nv = 0, ni = 0; for (const m of cast) { nv += m.geometry.attributes.position.count; ni += m.geometry.index.count; }
  const P = new Float32Array(nv * 3), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni); let ov = 0, oi = 0;
  for (const m of cast) {
    const g = m.geometry, pa = g.attributes.position.array, ia = g.index.array;
    P.set(pa, ov * 3); for (let k = 0; k < ia.length; k++) I[oi + k] = ia[k] + ov;
    ov += pa.length / 3; oi += ia.length; m.castShadow = m.userData.cast = false;
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setIndex(new THREE.BufferAttribute(I, 1)); geo.computeBoundingSphere();
  const px = new THREE.Mesh(geo, PROXY_MAT); px.castShadow = true; px.receiveShadow = false; px.userData.proxy = true; px.userData.cast = true; px.renderOrder = -10;
  px.layers.set(SHADOW_LAYER);     // drawn by the shadow cameras only (no empty draw call in the colour pass)
  grp.add(px);
}
// ---------------------------------------------------------------- light sources
// lit window / sign quads → small pools on the street in front of them (night only)
function windowLights(A, gi, out) {
  const c = gi.col, mx = Math.max(c[0], c[1], c[2], 1e-4), col = [c[0] / mx, c[1] / mx, c[2] / mx], I = A.I, P = A.P, N = A.N;
  for (let i = 0; i < I.length;) {
    const quad = I[i + 3] === I[i] && I[i + 4] === I[i + 2], b = I[i]; i += quad ? 6 : 3;
    if (!quad) continue;
    const ny = N[b * 3 + 1]; if (Math.abs(ny) > 0.5) continue;
    const p = (k) => [P[(b + k) * 3], P[(b + k) * 3 + 1], P[(b + k) * 3 + 2]], a = p(0), bb = p(1), d = p(3), cc = p(2);
    const area = Math.hypot(bb[0] - a[0], bb[1] - a[1], bb[2] - a[2]) * Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
    const x = (a[0] + cc[0]) / 2, y = (a[1] + cc[1]) / 2, z = (a[2] + cc[2]) / 2;
    if (y > 6.5 || area < 0.2) continue;
    const k = Math.min(0.5, gi.frac * gi.k * area * 0.5) * (y > 3 ? 0.5 : 1); if (k < 0.04) continue;
    out.push({ x: x + N[b * 3] * 0.7, y, z: z + N[b * 3 + 2] * 0.7, r: Math.min(6.5, 3 + Math.sqrt(area) * 1.4), col: col.map((v) => v * k), sh: 1.7 });
  }
}
// glowing voxels of a prop kind → where its light sits, its colour and how much glows (cached per geometry)
const GLOW_STATS = new WeakMap();
function glowStats(geo) {
  if (GLOW_STATS.has(geo)) return GLOW_STATS.get(geo);
  const p = geo.attributes.position.array, c = geo.attributes.color ? geo.attributes.color.array : null, idx = geo.index ? geo.index.array : null;
  const n = idx ? idx.length : p.length / 3, cen = [0, 0, 0], col = [0, 0, 0]; let area = 0;
  const v = (i) => (idx ? idx[i] : i);
  for (let t = 0; t < n; t += 3) {
    const i0 = v(t) * 3, i1 = v(t + 1) * 3, i2 = v(t + 2) * 3;
    const ux = p[i1] - p[i0], uy = p[i1 + 1] - p[i0 + 1], uz = p[i1 + 2] - p[i0 + 2], wx = p[i2] - p[i0], wy = p[i2 + 1] - p[i0 + 1], wz = p[i2 + 2] - p[i0 + 2];
    const ar = 0.5 * Math.hypot(uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx); area += ar;
    for (let k = 0; k < 3; k++) { cen[k] += (p[i0 + k] + p[i1 + k] + p[i2 + k]) / 3 * ar; if (c) col[k] += (c[i0 + k] + c[i1 + k] + c[i2 + k]) / 3 * ar; }
  }
  const s = area > 0 ? { cen: cen.map((x) => x / area), col: c ? col.map((x) => x / area) : [1, 0.85, 0.6], area: area / 2 } : null;   // half the faces look away
  GLOW_STATS.set(geo, s); return s;
}
// light profiles by prop kind: pool radius (m), brightness right below, shape height, halo size (m)
const LIGHT_KINDS = [
  [/flood/i, { r: 14, i: 2.0, halo: 2.4 }], [/lanternBig/i, { r: 6, i: 0.6, halo: 1.6 }], [/lantern/i, { r: 4, i: 0.38, halo: 1.0 }], [/lamp/i, { r: 10.5, i: 1.6, halo: 2.0 }],
  [/bulb|string|fairy/i, { r: 3.2, i: 0.32, halo: 0.45 }], [/glowPane|win/i, { r: 4.5, i: 0.6, sh: 1.6, halo: 0 }], [/neon|sign|marquee/i, { r: 4.5, i: 0.7, sh: 1.8, halo: 1.4 }],
  [/vending|gacha|atm|kiosk|machine|cooler|monitor|screen|tv|heal|tank|server/i, { r: 3, i: 0.42, sh: 1.2, halo: 0.9 }], [/tlight|traffic/i, { r: 2.2, i: 0.2, halo: 0.5 }], [/candle|altar|burner/i, { r: 2.4, i: 0.35, halo: 0.5 }],
];
const _m4 = new THREE.Matrix4(), _v3 = new THREE.Vector3();
function propLights(im, list, out, nav, halos) {
  const st = glowStats(im.geometry); if (!st) return;
  const kind = im.userData.prop || '', prof = (LIGHT_KINDS.find(([re]) => re.test(kind)) || [0, null])[1];
  const mx = Math.max(st.col[0], st.col[1], st.col[2], 1e-4), WARM = [1, 0.8, 0.58], col = st.col.map((v, k) => (0.15 + 0.85 * v / mx) * 0.62 + WARM[k] * 0.38);   // light through paper / glass reads warmer than the glow
  const arr = list.filter((p) => p.kind === kind);   // instance i is the i-th prop of this kind in the tile
  for (let i = 0; i < im.count; i++) {
    if (arr[i] && arr[i].nolight) continue;
    im.getMatrixAt(i, _m4); const s = _m4.getMaxScaleOnAxis(), q = _v3.set(...st.cen).applyMatrix4(_m4), a = st.area * s * s;
    const I = prof ? prof.i : Math.min(1.0, 0.2 + 0.6 * Math.sqrt(a)), R = prof ? prof.r : Math.min(8, 2.2 + 4 * Math.sqrt(a));
    const gy = nav && q.x > 0 && q.z > 0 && q.x < nav.w && q.z < nav.d ? nav.ground(q.x, q.z, 0) : 0;
    out.push({ x: q.x, y: q.y, z: q.z, r: R * Math.sqrt(s), col: col.map((v) => v * I), sh: prof && prof.sh ? prof.sh : Math.min(6, Math.max(0.8, q.y - gy)) });
    const h = (prof ? prof.halo : Math.min(1.2, 0.5 + Math.sqrt(a))) * s;
    if (h > 0 && halos) halos.push({ x: q.x, y: q.y, z: q.z, r: 0, halo: h, col: st.col.map((v) => v / mx), hcol: col });
  }
}
// a rect minus holes → rects covering the rest (holes are axis-aligned and inside the rect)
function cutRect(R, holes) {
  let rects = [R];
  for (const [hx0, hz0, hx1, hz1] of holes) {
    const out = [];
    for (const [x0, z0, x1, z1] of rects) {
      if (hx1 <= x0 || hx0 >= x1 || hz1 <= z0 || hz0 >= z1) { out.push([x0, z0, x1, z1]); continue; }
      if (hz0 > z0) out.push([x0, z0, x1, hz0]); if (hz1 < z1) out.push([x0, hz1, x1, z1]);
      const a = Math.max(z0, hz0), b = Math.min(z1, hz1);
      if (hx0 > x0) out.push([x0, a, hx0, b]); if (hx1 < x1) out.push([hx1, a, x1, b]);
    }
    rects = out;
  }
  return rects;
}
const MM = { asphalt: '#4a4a58', pavers: '#b8b0a4', grass: '#6aa058', cobble: '#9a8e84', planks: '#a87a4a', dirt: '#b89468', concrete: '#a8a49c', tiles: '#d8d4cc', water: '#3a6aa0' };
function mmCol(tex) { const k = tex.userData.key || ''; for (const n in MM) if (k.startsWith(n)) return MM[n]; return '#8a8a8a'; }
export { TX, CELL };
