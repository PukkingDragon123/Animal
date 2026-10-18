// Interior kit for the cutaway dioramas (apartment.js, dojo.js): the wide-palette
// build helpers, decal collectors, a switchable light rig (warm bulbs that fade on
// without recompiling shaders), and builders for furniture and props at 8 voxels
// per metre — stairs, wardrobe, bed, desk, kitchen (stove, wok, rice cooker, sink,
// fridge), round table, altar, fish tank, perch, dog basket, clutter; martial-arts
// hall parts (wooden dummies, weapon racks, drum, gong, lion-dance heads, punching
// bag, bonsai). The second half paints the 2D layer: band posters, calendar, fridge
// magnets, packaging with tiny original illustrations, calligraphy, the neon view
// from a window, notice-board flyers. Every CJK string is listed in INTERIOR_TEXT.
import * as THREE from '../../../vendor/three.module.js';
import { GLOW } from '../fine.js';
import { Kit, h3, noise2 } from '../kit.js';
import { sprite } from '../cards.js';
import { Pen, newSurf } from '../decals.js';
import { shift } from '../../px/paint.js';
import { bx, one, many, ell, cylY, line3, shade, fit, P as CP, C } from './chinatown_parts.js';
export { bx, one, many, ell, cylY, line3, shade, fit, CP, C };

// ------------------------------------------------------------ palette (same trick as chinatown.js)
// build with 16-bit voxels and an unbounded palette, then fold to the 255 colours the mesher takes
export function widePalette(v) {
  v.d = new Uint16Array(v.X * v.Y * v.Z);
  v.c = function (hex, flags = 0) {
    const key = hex + '|' + flags; let i = this.idx.get(key);
    if (i === undefined) { const n = parseInt(hex.slice(1), 16); i = this.pal.length; this.pal.push([(n >> 16) & 255, (n >> 8) & 255, n & 255]); this.flag.push(flags); this.idx.set(key, i); }
    return i;
  };
}
export function foldPalette(v, max = 255) {
  const n = v.pal.length, cnt = new Float64Array(n), d = v.d;
  for (let i = 0; i < d.length; i++) cnt[d[i]]++;
  const rep = new Int32Array(n).map((_, i) => i), live = [];
  for (let i = 1; i < n; i++) if (cnt[i] > 0) live.push(i);
  const dist = (a, b) => { const A = v.pal[a], B = v.pal[b], rm = (A[0] + B[0]) / 2, dr = A[0] - B[0], dg = A[1] - B[1], db = A[2] - B[2]; return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db; };
  while (live.length > max) {
    let best = Infinity, bi = -1, bj = -1;
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j]; if (v.flag[a] !== v.flag[b]) continue;
      const c = dist(a, b) * Math.min(cnt[a], cnt[b]); if (c < best) { best = c; bi = i; bj = j; }
    }
    if (bi < 0) break;
    const a = live[bi], b = live[bj], keep = cnt[a] >= cnt[b] ? a : b, drop = keep === a ? b : a;
    rep[drop] = keep; cnt[keep] += cnt[drop]; live.splice(keep === a ? bj : bi, 1);
  }
  const root = (i) => { while (rep[i] !== i) i = rep[i]; return i; }, map = new Uint8Array(n), pal = [[0, 0, 0]], flag = [0];
  for (const i of live) { map[i] = pal.length; pal.push(v.pal[i]); flag.push(v.flag[i]); }
  for (let i = 1; i < n; i++) map[i] = map[root(i)];
  const d8 = new Uint8Array(d.length); for (let i = 0; i < d.length; i++) d8[i] = map[d[i]];
  const idx = new Map(); for (const [key, i] of v.idx) if (map[root(i)]) idx.set(key, map[root(i)]);
  Object.assign(v, { d: d8, pal, flag, idx }); delete v.c;
  return { colours: n - 1, kept: live.length };
}

// ------------------------------------------------------------ decal collectors (voxel faces → metres)
// S = +z face of layer zl; N = −z face of layer zl; E = +x face of column xl; W = −x face of column xl; U = top of layer yl
export function decalSet(D, vpm = 8) {
  const s = 1 / vpm;
  return {
    S: (x0, y0, x1, y1, zl, paint, q = {}) => D.push({ x: (x0 + x1 + 1) * s / 2, y: y0 * s, z: (zl + 1) * s, w: (x1 - x0 + 1) * s, h: (y1 - y0 + 1) * s, face: 's', paint, ...q }),
    N: (x0, y0, x1, y1, zl, paint, q = {}) => D.push({ x: (x0 + x1 + 1) * s / 2, y: y0 * s, z: zl * s, w: (x1 - x0 + 1) * s, h: (y1 - y0 + 1) * s, face: 'n', paint, ...q }),
    E: (z0, y0, z1, y1, xl, paint, q = {}) => D.push({ x: (xl + 1) * s, y: y0 * s, z: (z0 + z1 + 1) * s / 2, w: (z1 - z0 + 1) * s, h: (y1 - y0 + 1) * s, face: 'e', paint, ...q }),
    W: (z0, y0, z1, y1, xl, paint, q = {}) => D.push({ x: xl * s, y: y0 * s, z: (z0 + z1 + 1) * s / 2, w: (z1 - z0 + 1) * s, h: (y1 - y0 + 1) * s, face: 'w', paint, ...q }),
    U: (x0, z0, x1, z1, yl, paint, q = {}) => D.push({ x: (x0 + x1 + 1) * s / 2, y: (yl + 1) * s, z: (z1 + 1) * s, w: (x1 - x0 + 1) * s, h: (z1 - z0 + 1) * s, face: 'up', paint, ...q }),
  };
}

// ------------------------------------------------------------ switchable lights
// Lights stay in the scene at all times (their count never changes, so toggling never
// recompiles a shader); "off" just zeroes the intensity and dims the bulb meshes.
export function lightRig(st) {
  const R = { sw: [], fixed: [], bulbs: [], on: null };
  const keep = (m) => { m.userData.keep = true; return m; };
  // point light (metres). o: { always, decay }
  R.point = (x, y, z, col, I, dist, o = {}) => {
    const l = new THREE.PointLight(col, o.always ? I : 0, dist, o.decay ?? 1.6); l.position.set(x, y, z); l.userData.I = I;
    st.scene.add(l); (o.always ? R.fixed : R.sw).push(l); return l;
  };
  R.hemi = (sky, ground, I, o = {}) => { const h = new THREE.HemisphereLight(sky, ground, o.always ? I : 0); h.userData.I = I; st.scene.add(h); (o.always ? R.fixed : R.sw).push(h); return h; };
  // a glowing bulb / tube / paper shade (unlit when on, dull when off)
  R.glow = (geo, x, y, z, onCol, offCol, o = {}) => {
    const m = new THREE.Mesh(geo, keep(new THREE.MeshBasicMaterial({ color: offCol, toneMapped: false })));
    m.position.set(x, y, z); if (o.rot) m.rotation.set(...o.rot);
    m.userData.onCol = new THREE.Color(onCol).multiplyScalar(o.k ?? 1.25); m.userData.offCol = new THREE.Color(offCol);
    if (o.always) m.material.color.copy(m.userData.onCol); else R.bulbs.push(m);
    st.scene.add(m); return m;
  };
  R.bulb = (x, y, z, r, onCol = '#fff0c8', offCol = '#4a4640', o) => R.glow(new THREE.SphereGeometry(r, 10, 8), x, y, z, onCol, offCol, o);
  R.box = (x, y, z, w, h, d, onCol, offCol, o) => R.glow(new THREE.BoxGeometry(w, h, d), x, y, z, onCol, offCol, o);
  // a paper / fabric lamp shade (open cone) and a round paper lantern with gold caps and a tassel (metres)
  R.shade = (x, y, z, rTop, rBot, h, onCol, offCol) => { const m = R.glow(new THREE.CylinderGeometry(rTop, rBot, h, 14, 1, true), x, y, z, onCol, offCol, { k: 1.05 }); m.material.side = THREE.DoubleSide; return m; };
  R.lantern = (x, y, z, r, onCol = '#ff6a3a', offCol = '#8a1e1c') => {
    const body = R.glow(new THREE.SphereGeometry(r, 16, 12), x, y, z, onCol, offCol, { k: 1.0 }); body.scale.set(1, 0.86, 1);
    if (typeof document !== 'undefined') {     // paper ribs: darker meridian bands
      const c = document.createElement('canvas'); c.width = 64; c.height = 8; const g = c.getContext('2d');
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 8); g.fillStyle = '#9a8a80'; for (let i = 0; i < 64; i += 4) g.fillRect(i, 0, 1, 8);
      const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; body.material.map = t; body.material.needsUpdate = true;
    }
    const gold = keep(new THREE.MeshLambertMaterial({ color: 0xd8a830 }));
    for (const s of [1, -1]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.42, r * 0.42, r * 0.16, 12), gold); cap.position.set(x, y + s * r * 0.86, z); st.scene.add(cap); }
    const tas = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.06, r * 0.1, r * 0.9, 6), gold); tas.position.set(x, y - r * 1.35, z); st.scene.add(tas);
    return body;
  };
  // lanterns that stay lit-shaded by day and glow when switched on (Lambert + emissive), instanced.
  // pts: [[x, y, z, r], ...] metres; returns the body mesh
  R.lanternsLit = (pts, col = '#d8302c', glow = '#ff5a1a') => {
    const n = pts.length, body = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), keep(new THREE.MeshLambertMaterial({ color: col, emissive: glow, emissiveIntensity: 0 })), n);
    const gold = keep(new THREE.MeshLambertMaterial({ color: 0xd8a830 })), caps = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 10), gold, n * 2), tas = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.1, 0.9, 5), gold, n);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Pp = new THREE.Vector3();
    pts.forEach(([x, y, z, r], i) => {
      body.setMatrixAt(i, M.compose(Pp.set(x, y, z), Q, S.set(r, r * 0.86, r)));
      caps.setMatrixAt(i * 2, M.compose(Pp.set(x, y + r * 0.86, z), Q, S.set(r, r, r))); caps.setMatrixAt(i * 2 + 1, M.compose(Pp.set(x, y - r * 0.86, z), Q, S.set(r, r, r)));
      tas.setMatrixAt(i, M.compose(Pp.set(x, y - r * 1.35, z), Q, S.set(r, r, r)));
    });
    for (const m of [body, caps, tas]) { m.castShadow = true; m.frustumCulled = false; st.scene.add(m); }
    body.userData.lit = true; R.lit.push(body); return body;
  };
  R.lit = [];
  R.set = (on) => {
    for (const m of R.lit) m.material.emissiveIntensity = on ? 1.35 : 0;
    R.on = !!on;
    for (const l of R.sw) l.intensity = on ? l.userData.I : 0;
    for (const m of R.bulbs) m.material.color.copy(on ? m.userData.onCol : m.userData.offCol);
  };
  return R;
}
// level-aware ground (metres): the highest walkable surface at (x, z) at or below yHint (+0.6 m),
// skipping water — for scenes with several floors or roofs overhead
export function groundFn(v) {
  return (x, z, yHint = 99) => {
    const vx = Math.floor(x * v.vpm), vz = Math.floor(z * v.vpm);
    for (let y = Math.min(v.Y - 1, Math.floor((yHint + 0.6) * v.vpm)); y >= 0; y--) { const c = v.get(vx, y, vz); if (c && !(v.flag[c] & 2)) return (y + 1) / v.vpm; }
    return 0;
  };
}
// dev hook for the vx.html viewer: ?shot=name picks a shot, ?vxlights=1 turns the lights on
export function devParam(name) { try { return typeof location !== 'undefined' ? new URLSearchParams(location.search).get(name) : null; } catch (e) { return null; } }

// ------------------------------------------------------------ rotated building
// A Kit whose coordinates are local to (ox, oz) and turned by `deg` about y (local +z maps to:
// 0 → +z, 90 → +x, 180 → −z, 270 → −x). Builders written facing +z can then face any way.
export function rotKit(k, ox, oz, deg = 0) {
  const r = ((deg % 360) + 360) % 360, V = k.v;
  const T = (x, z) => (r === 0 ? [ox + x, oz + z] : r === 90 ? [ox + z, oz - x] : r === 180 ? [ox - x, oz - z] : [ox - z, oz + x]);
  const P = {
    X: V.X, Y: V.Y, Z: V.Z, vpm: V.vpm, s: V.s, get pal() { return V.pal; }, get flag() { return V.flag; },
    c: (hex, f) => V.c(hex, f), m: (q) => V.m(q),
    set(x, y, z, c) { const [wx, wz] = T(x, z); V.set(wx, y, wz, c); },
    get(x, y, z) { const [wx, wz] = T(x, z); return V.get(wx, y, wz); },
    box(x0, y0, z0, x1, y1, z1, c) {
      const f = typeof c === 'function';
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) { const q = f ? c(x, y, z) : c; if (q !== undefined && q !== null) this.set(x, y, z, q); }
      return this;
    },
    top(x, z) { const [wx, wz] = T(x, z); return V.top(wx, wz); },
  };
  const rk = new Kit(P); rk.T = T; return rk;
}

// ------------------------------------------------------------ material functions (voxel colour fns)
// floorboards: rows 1 voxel wide running along `along`, boards of random length with dark end seams
export function planks(k, cols, o = {}) {
  const S = many(k, cols), SEAM = one(k, o.seam || shade(cols[0], -0.32)), L = o.len || 9, AL = o.along || 'x', w = o.w || 1;
  return (x, y, z) => {
    const a = AL === 'x' ? x : z, row = Math.floor((AL === 'x' ? z : x) / w), off = Math.floor(h3(row, 5, o.seed || 7) * L), u = a + off;
    if (((u % L) + L) % L === 0) return SEAM;
    const seg = Math.floor(u / L), wear = o.wear ? noise2(x, z, 7) : 0;
    return S[Math.min(S.length - 1, Math.floor((h3(seg, row, 3) * 0.75 + wear * 0.25) * S.length))];
  };
}
// soft mottled paint (walls)
export function paint(k, cols, sc = 6) { const S = many(k, cols); return (x, y, z) => S[Math.min(S.length - 1, Math.floor((noise2(x + z, y * 1.3, sc) * 0.75 + h3(x, y, z) * 0.25) * S.length))]; }
export function checker(k, a, b, size = 2, ox = 0, oz = 0) { const A = one(k, a), B = one(k, b); return (x, y, z) => ((Math.floor((x - ox) / size) + Math.floor((z - oz) / size)) & 1 ? A : B); }
export function brick(k, hexes, mortar) { const S = many(k, hexes), M = one(k, mortar); return (x, y, z) => { const r = y >> 1, u = x + z + ((r & 1) << 1); if ((y & 1) === 0 && ((u & 3) === 0 || h3(u >> 2, r, 9) < 0.18)) return M; return S[Math.floor(h3(u >> 2, r, 3) * S.length)]; }; }
const pickH = (S, x, y, z) => S[Math.floor(h3(x, y, z) * S.length)];

// ------------------------------------------------------------ architecture
// a wall slab with a hollow core (greedy-mesh cracks then show a dim inner face, not the void)
export function hollowWall(k, x0, y0, z0, x1, y1, z1, outer, inner, o = {}) {
  bx(k, x0, y0, z0, x1, y1, z1, outer);
  if (inner) { const ax = o.axis || (x1 - x0 < z1 - z0 ? 'x' : 'z'); if (ax === 'x') bx(k, x1, y0, z0, x1, y1, z1, inner); else bx(k, x0, y0, z1, x1, y1, z1, inner); }
  const t = o.inset ?? 1, ax = x1 - x0 < z1 - z0 ? 'x' : 'z';
  if (ax === 'x' && x1 - x0 >= 2) bx(k, x0 + 1, y0 + t, z0 + t, x1 - 1, y1 - t, z1 - t, 0);
  if (ax === 'z' && z1 - z0 >= 2) bx(k, x0 + t, y0 + t, z0 + 1, x1 - t, y1 - t, z1 - 1, 0);
}
// close a wall's hollow around an opening (call before carving it)
export function seal(k, x0, y0, z0, x1, y1, z1, col) { bx(k, x0, y0, z0, x1, y1, z1, col); }

// a straight wooden stair rising toward −z: treads x0..x1-1, a panelled stringer at x1 with
// balusters + handrail. zTop = first z of the top tread; y = bottom floor walk height; rise
// in steps of 2 voxels to y + 2·n. Tread depths alternate 2,3. Returns { bottomZ, steps }.
export function stairs(k, o) {
  const v = k.v, { x0, x1, zTop, y, n } = o, T = many(k, o.tread || ['#9a6a40', '#8e6038', '#a6744a']), NOSE = one(k, o.nose || '#6a4428');
  const RIS = one(k, o.riser || '#efe6d2'), STR = one(k, o.stringer || '#6e4a2c'), PAN = many(k, o.panel || ['#7a5434', '#82593a']), RAIL = one(k, o.rail || '#4e321f');
  let z = zTop; const steps = [];
  for (let i = n - 1; i >= 0; i--) { const d = (n - 1 - i) % 2 === 0 ? 2 : 3; steps.push({ i, z0: z, z1: z + d - 1, top: y + 2 * i + 1 }); z += d; }
  for (const s of steps) {
    bx(k, x0, y, s.z0, x1 - 1, s.top - 1, s.z1, (xx, yy, zz) => (zz === s.z1 && yy >= s.top - 1 ? RIS : PAN[0]));
    bx(k, x0, s.top, s.z0, x1 - 1, s.top, s.z1, (xx, yy, zz) => (zz === s.z1 ? NOSE : T[(xx + s.i) % 3 === 0 ? 2 : (s.i & 1)]));
    // stringer: follows the stair line one voxel above the treads, panelled below
    bx(k, x1, y, s.z0, x1, s.top + 1, s.z1, (xx, yy, zz) => (yy >= s.top ? STR : (yy - y) % 6 === 0 || (zz % 5 === 0) ? PAN[1] : PAN[0]));
  }
  // balusters every 3 voxels and a handrail ~0.9 m above the nosing line
  if (o.rail !== false) for (const s of steps) {
    const hy = s.top + 8;
    for (let zz = s.z0; zz <= s.z1; zz++) { v.set(x1, hy, zz, RAIL); if (zz % 3 === 0) bx(k, x1, s.top + 2, zz, x1, hy - 1, zz, RAIL); }
  }
  return { bottomZ: z, steps };
}
// an interior door in a wall plane facing +z (wall layers zw0..zw1, leaf at zLeaf): casing proud of the wall
export function doorZ(k, o) {
  const { x0, x1, y, h = 17, zw0, zw1, zLeaf, zc } = o, F = one(k, o.casing || '#efe6d4'), Dc = many(k, o.leaf || ['#8a5a3a', '#94623e']), PN = one(k, o.panel || shade(o.leaf?.[0] || '#8a5a3a', -0.25)), K = one(k, '#d8b440');
  bx(k, x0 - 1, y, zw0, x1 + 1, y + h + 1, zw1, F);          // seal the wall's hollow around the opening
  bx(k, x0, y, zw0, x1, y + h, zw1, 0);
  bx(k, x0, y, zLeaf, x1, y + h, zLeaf, (xx, yy) => { const u = xx - x0, w = yy - y; return (u === 1 || u === x1 - x0 - 1) && w > 1 && w < h - 1 || ((w === 2 || w === Math.round(h / 2) || w === h - 2) && u > 0 && u < x1 - x0) ? PN : Dc[(u + w) % 5 === 0 ? 1 : 0]; });
  for (let yy = y; yy <= y + h + 1; yy++) { k.v.set(x0 - 1, yy, zc, F); k.v.set(x1 + 1, yy, zc, F); }
  bx(k, x0 - 1, y + h + 1, zc, x1 + 1, y + h + 2, zc, F);
  k.v.set(x1 - 1, y + 8, zLeaf + 1, K);
  return { knob: [x1 - 1, y + 8, zLeaf + 1] };
}
// the same for a door in a wall plane facing −x (wall columns xw0..xw1, the room on the −x side)
export function doorX(k, o) {
  const { z0, z1, y, h = 17, xw0, xw1, xLeaf, xc } = o, F = one(k, o.casing || '#efe6d4'), Dc = many(k, o.leaf || ['#a8282a', '#b03030']), PN = one(k, o.panel || shade(o.leaf?.[0] || '#a8282a', -0.25)), K = one(k, '#d8b440');
  bx(k, xw0, y, z0 - 1, xw1, y + h + 1, z1 + 1, F);
  bx(k, xw0, y, z0, xw1, y + h, z1, 0);
  bx(k, xLeaf, y, z0, xLeaf, y + h, z1, (xx, yy, zz) => { const u = zz - z0, w = yy - y; return ((u === 1 || u === z1 - z0 - 1) && w > 1 && w < h - 1) || ((w === 2 || w === Math.round(h / 2) || w === h - 2) && u > 0 && u < z1 - z0) ? PN : Dc[(u + w) % 5 === 0 ? 1 : 0]; });
  for (let yy = y; yy <= y + h + 1; yy++) { k.v.set(xc, yy, z0 - 1, F); k.v.set(xc, yy, z1 + 1, F); }
  bx(k, xc, y + h + 1, z0 - 1, xc, y + h + 2, z1 + 1, F);
  k.v.set(xLeaf - 1, y + 8, z0 + 1, K); k.v.set(xLeaf - 1, y + 9, z0 + 1, K);
  return { knob: [xLeaf - 1, y + 8, z0 + 1] };
}
// a window opening in a wall facing +z: frame, sill, mullions; glass left open so a painted view shows through
export function windowZ(k, o) {
  const v = k.v, { x0, x1, y0, y1, zw0, zw1 } = o, F = one(k, o.frame || '#efe9dc'), S = one(k, o.sill || '#e2d8c4'), mx = o.mx ?? Math.round((x0 + x1) / 2), my = o.my ?? Math.round(y0 + (y1 - y0) * 0.55);
  bx(k, x0 - 1, y0 - 1, zw0, x1 + 1, y1 + 1, zw1, F);
  bx(k, x0, y0, zw0, x1, y1, zw1, 0);
  for (let x = x0; x <= x1; x++) v.set(x, my, zw0 + 1, F);
  for (let y = y0; y <= y1; y++) { v.set(mx, y, zw0 + 1, F); if (o.mx2) v.set(o.mx2, y, zw0 + 1, F); }
  bx(k, x0 - 2, y0 - 1, zw1 + 1, x1 + 2, y0 - 1, zw1 + 1 + (o.sillD ?? 1), S);
  if (o.bars) for (let x = x0 + 1; x < x1; x += 2) bx(k, x, y0, zw0 - 1, x, y1, zw0 - 1, one(k, '#2a2a30'));
  return { mx, my };
}

// ------------------------------------------------------------ bedroom
// a single bed against walls, head at +x (o.headX) or −x: frame, mattress, quilt (top left for a decal), pillows
export function bed(k, o) {
  const { x0, x1, z0, z1, y } = o, head = o.head || 1, W = many(k, o.wood || ['#6e4a30', '#7a5236', '#634228']), M = one(k, '#efe9e0'), MS = one(k, '#d8d0c4');
  const Q = many(k, o.quilt || ['#c8423a', '#d4503e', '#b8382f']), QD = one(k, shade((o.quilt || ['#c8423a'])[0], -0.3)), PL = many(k, o.pillow || ['#f4efe6', '#e8e2d6']);
  const hx0 = head > 0 ? x1 - 1 : x0, hx1 = head > 0 ? x1 : x0 + 1, bx0 = head > 0 ? x0 : x0 + 2, bx1 = head > 0 ? x1 - 2 : x1;
  bx(k, bx0, y, z0, bx1, y + 1, z1, (x, yy, z) => (yy === y && (x - bx0) % 6 > 1 && z > z0 && z < z1 ? 0 : W[(x + yy) % 3]));     // frame with gaps (legs)
  bx(k, hx0, y, z0, hx1, y + 9, z1, (x, yy, z) => (yy === y + 9 ? W[2] : (yy >= y + 4 && (z - z0) % 3 === 1 && x === (head > 0 ? hx0 : hx1)) ? W[2] : W[0]));   // headboard with slats
  bx(k, bx0, y + 2, z0, bx1, y + 3, z1 - 1, (x, yy, z) => (yy === y + 2 ? MS : M));                       // mattress
  // quilt: covers the foot two-thirds, drapes over the front; rumpled with a fold line and a lump
  const qx0 = head > 0 ? bx0 : bx0 + 6, qx1 = head > 0 ? bx1 - 6 : bx1;
  bx(k, qx0, y + 4, z0, qx1, y + 4, z1 - 1, (x, yy, z) => Q[(x * 3 + z) % 3]);
  bx(k, qx0, y + 1, z1, qx1, y + 4, z1, (x, yy) => (yy === y + 1 ? QD : Q[(x + yy) % 3]));
  for (const [lx, lz, r] of o.lumps || []) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (dx * dx + dz * dz <= r * r && lx + dx >= qx0 && lx + dx <= qx1 && lz + dz < z1 && lz + dz >= z0) k.v.set(lx + dx, y + 5, lz + dz, Q[(dx + dz + 9) % 3]);
  // pillows
  const px0 = head > 0 ? bx1 - 4 : bx0, px1 = head > 0 ? bx1 : bx0 + 4;
  for (const [a, b] of [[z0 + 1, Math.floor((z0 + z1) / 2) - 1], [Math.floor((z0 + z1) / 2) + 1, z1 - 2]]) bx(k, px0, y + 4, a, px1, y + 5, b, (x, yy, z) => (yy === y + 5 && (z === a || z === b || x === px0 || x === px1) ? undefined : PL[(x + z) & 1]));
  return { quilt: [qx0, z0, qx1, z1 - 1, y + 4], drape: [qx0, y + 1, qx1, y + 4, z1], top: y + 4, pillow: [(px0 + px1) / 2, y + 6, (z0 + z1) / 2] };
}
// a big wooden wardrobe against a +z-facing wall, both doors swung open 90°
export function wardrobe(k, o) {
  const v = k.v, { x0, x1, z0, z1, y, h = 19 } = o, W = many(k, o.wood || ['#7a5232', '#845a38', '#70492c']), WD = one(k, o.dark || '#4e321f'), IN = many(k, o.inner || ['#a8835a', '#b08c62']), CH = one(k, '#c8ccd4');
  const top = y + h, mid = o.split ?? Math.round(x0 + (x1 - x0) * 0.58);
  // carcass: back, sides, top, plinth, crown
  bx(k, x0, y, z0, x1, top, z0, IN);
  bx(k, x0, y, z0, x0, top, z1, W); bx(k, x1, y, z0, x1, top, z1, W);
  bx(k, x0, top, z0, x1, top, z1, W);
  bx(k, x0, y, z0, x1, y + 1, z1, (x, yy) => (yy === y ? WD : W[1]));
  bx(k, x0 - 1, top + 1, z0, x1 + 1, top + 1, z1 + 1, W[2]); bx(k, x0, top + 2, z0, x1, top + 2, z1, WD);
  for (let x = x0; x <= x1; x += 3) v.set(x, top + 2, z1 + 1, W[1]);
  // a divider; the right bay holds shelves of folded clothes and a drawer stack
  bx(k, mid, y + 2, z0, mid, top - 1, z1, W[0]);
  const shelves = [];
  for (const sy of [y + 7, y + 11, y + 15]) { bx(k, mid + 1, sy, z0 + 1, x1 - 1, sy, z1, W[1]); shelves.push(sy); }
  bx(k, mid + 1, y + 2, z0 + 1, x1 - 1, y + 6, z1, (x, yy, z) => (z === z1 && (yy === y + 4 || x === Math.round((mid + x1) / 2)) ? WD : z === z1 && yy === y + 3 && x % 4 === 1 ? one(k, '#d8b440') : W[(yy + x) % 2]));
  // the hanging bay: a top shelf, a chrome rail with hooks
  bx(k, x0 + 1, top - 3, z0 + 1, mid - 1, top - 3, z1, W[1]);
  const railY = top - 5, railZ = Math.round((z0 + z1) / 2) + 1;
  bx(k, x0 + 1, railY, railZ, mid - 1, railY, railZ, CH);
  // open doors: hinged at the front corners, swung to point at the camera
  const dw = Math.ceil((x1 - x0 + 1) / 2);
  for (const [dx, side] of [[x0, -1], [x1, 1]]) {
    bx(k, dx, y + 1, z1 + 1, dx, top - 1, z1 + dw, (x, yy, z) => { const u = z - z1, w = yy - y; return (u === 1 || u === dw || w === 1 || w === h - 1) ? W[2] : (u === 3 || u === dw - 2) && w > 3 && w < h - 3 ? WD : ((w === 4 || w === h - 4) && u > 2 && u < dw - 1) ? WD : W[(u + w) % 7 === 0 ? 1 : 0]; });
    v.set(dx + (side < 0 ? 1 : -1), y + 9, z1 + dw - 1, one(k, '#d8b440'));
  }
  return { rail: [x0 + 1, mid - 1, railY, railZ], shelves, mid, top, doorL: { x: x0, z0: z1 + 1, z1: z1 + dw, y0: y + 1, y1: top - 1 }, doorR: { x: x1, z0: z1 + 1, z1: z1 + dw, y0: y + 1, y1: top - 1 }, bay: [mid + 1, x1 - 1] };
}
// garments on a rail along x, seen edge-on: coloured slabs with shoulders, hooks and uneven hems
export function garments(k, x0, x1, railY, railZ, seed = 1, o = {}) {
  const v = k.v, H = one(k, '#9aa0a8'), cols = o.cols || ['#2e5a9c', '#c8423a', '#e8c040', '#f0ece4', '#3a8a5a', '#2a2a30', '#e88aa8', '#8a6ab4', '#d8783a', '#5a7a9a', '#a83a5a', '#4a8ab0'];
  let i = 0;
  for (let x = x0; x <= x1; x += 2) {
    const c = cols[(i + seed) % cols.length], C0 = one(k, c), CL = one(k, shade(c, 0.18)), CD = one(k, shade(c, -0.25)), len = Math.min(o.maxLen ?? 12, 6 + Math.floor(h3(x, seed, 3) * 7)), half = 2 + (h3(x, seed, 4) < 0.3 ? 1 : 0);
    v.set(x, railY + 1, railZ, H); v.set(x, railY, railZ, H);
    for (let dz = -half; dz <= half; dz++) {
      const drop = Math.abs(dz) === half ? 1 : 0, l = len - (Math.abs(dz) === half && h3(x, dz, 5) < 0.5 ? 1 + Math.floor(h3(x, dz, 6) * 3) : 0);
      for (let j = 1 + drop; j <= l; j++) v.set(x, railY - j, railZ + dz, j === l ? CD : dz < 0 ? CL : C0);
    }
    if (h3(x, seed, 8) < 0.35) for (let j = 2; j < len - 2; j += 2) v.set(x, railY - j, railZ + half + 1, CD);  // a sleeve hanging loose
    i++;
  }
}
// a stack of folded clothes / towels on a shelf (fold lines in a darker tone)
export function folded(k, x0, x1, y, z0, z1, n, seed = 1) {
  const cols = ['#e8e4dc', '#2e5a9c', '#c8423a', '#5a9a6a', '#e8c040', '#2a2a30', '#d890b0', '#8a6ab4', '#d8783a'];
  for (let i = 0; i < n; i++) { const c = cols[Math.floor(h3(seed, i, 2) * cols.length)], A = one(k, c), D = one(k, shade(c, -0.28)); const sx = Math.round((h3(seed, i, 3) - 0.5) * 1.6); bx(k, x0 + sx, y + i, z0, x1 + sx, y + i, z1, (x, yy, z) => (z === z1 && (x === x0 + sx || x === x1 + sx) ? D : A)); }
}
// a sneaker pointing along +x (dir 1) or −x: sole, upper, toe cap, laces
export function sneaker(k, x, y, z, col, dir = 1, o = {}) {
  const v = k.v, U = one(k, col), UD = one(k, shade(col, -0.3)), S = one(k, o.sole || '#f2eee6'), L = one(k, o.lace || '#f8f6f0');
  const P = (i, j, c) => v.set(x + dir * i, y + j, z, c);
  for (let i = 0; i < 3; i++) P(i, 0, S);
  P(0, 1, U); P(1, 1, L); P(2, 1, UD);
  if (o.high) P(0, 2, U);
}
export function shoePair(k, x, y, z, col, dir = 1, o = {}) { sneaker(k, x, y, z, col, dir, o); sneaker(k, x + (o.splay ? dir : 0), y, z + 2, col, dir, o); }
// a heap of laundry: a lumpy mound of mixed colours with a sleeve or two trailing
export function laundryPile(k, cx, y, cz, r, seed = 1) {
  const cols = ['#e8e4dc', '#2e5a9c', '#c8423a', '#3a8a5a', '#2a2a30', '#e8c040', '#8a6ab4', '#5a7a9a', '#d8a0b0', '#f0ece4'];
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    const d = Math.hypot(dx, dz * 1.2) / r + (noise2(cx + dx + seed * 9, cz + dz, 2) - 0.5) * 0.5; if (d > 1) continue;
    const hgt = Math.max(1, Math.round((1 - d) * r * 0.8 + 0.5));
    for (let j = 0; j < hgt; j++) k.v.set(cx + dx, y + j, cz + dz, one(k, cols[Math.floor(h3(Math.floor((cx + dx) / 2) + seed, j, Math.floor((cz + dz) / 2)) * cols.length)]));
  }
  for (let s = 0; s < 2; s++) { const a = h3(seed, s, 7) * 6.28, c = one(k, cols[Math.floor(h3(seed, s, 8) * cols.length)]); for (let i = r; i < r + 3; i++) k.v.set(Math.round(cx + Math.cos(a) * i), y, Math.round(cz + Math.sin(a) * i), c); }
}
// a stack of comics / books (alternating cover colours, pages edge light)
export function bookStack(k, x, y, z, n, seed = 1, o = {}) {
  const cols = o.cols || ['#c8423a', '#2e5a9c', '#e8c040', '#3a8a5a', '#f0ece4', '#e88a3a', '#8a4ab4', '#e86a8a'];
  const w = o.w || 2, d = o.d || 3, PG = one(k, '#f2ecd8');
  for (let i = 0; i < n; i++) { const c = one(k, cols[Math.floor(h3(seed, i, 1) * cols.length)]), sx = h3(seed, i, 2) < 0.3 ? 1 : 0; bx(k, x + sx, y + i, z, x + sx + w - 1, y + i, z + d - 1, (xx, yy, zz) => (xx === x + sx + w - 1 && zz > z && zz < z + d - 1 ? PG : c)); }
}
export function skateboard(k, x, y, z, o = {}) {
  const v = k.v, D = many(k, o.deck || ['#e8b830', '#d84a3a', '#2e5a9c']), G = one(k, '#2a2a2e'), W = one(k, '#f0ece0'), M = one(k, '#a8acb4'), L = o.len || 7;
  for (let i = 0; i < L; i++) for (let w = 0; w < 2; w++) v.set(x + i, y + 1, z + w, i === 0 || i === L - 1 ? G : i % 3 === 1 ? D[1] : G);
  for (const i of [1, L - 2]) { v.set(x + i, y, z - 1, W); v.set(x + i, y, z + 2, W); v.set(x + i, y, z, M); v.set(x + i, y, z + 1, M); }
  v.set(x, y + 2, z, G); v.set(x + L - 1, y + 2, z + 1, G);
}
// an acoustic guitar leaning against a wall facing +z (body on the floor, neck up)
export function guitar(k, x, y, z, o = {}) {
  const v = k.v, B = one(k, o.body || '#c87a3a'), BD = one(k, '#8a4a22'), N = one(k, '#5a3a24'), HS = one(k, '#3a2418'), HOLE = one(k, '#1e140e'), ST = one(k, '#e8e4d8');
  for (let j = 0; j < 9; j++) { const w = j < 4 ? 2 : j < 5 ? 1 : 2; for (let i = -w; i <= w; i++) v.set(x + i, y + j, z, (Math.abs(i) === w) ? BD : B); }
  v.set(x, y + 6, z + 1, HOLE); v.set(x, y + 2, z + 1, BD);
  for (let j = 9; j < 16; j++) { v.set(x, y + j, z, N); v.set(x, y + j, z + 1, j % 2 ? ST : N); }
  bx(k, x - 1, y + 16, z, x, y + 17, z, HS);
}
// a little plush toy: kinds 'owl', 'bun', 'bear', 'cat'
export function plush(k, x, y, z, kind = 'bear', o = {}) {
  const v = k.v, c = o.col || { owl: '#8a6a4a', bun: '#f4ecdc', bear: '#c8945a', cat: '#e8a040' }[kind], A = one(k, c), L = one(k, shade(c, 0.25)), E = one(k, '#1e1a1a'), PK = one(k, '#e88aa0');
  if (kind === 'bun') { bx(k, x, y, z, x + 2, y + 1, z + 2, A); v.set(x + 1, y + 2, z + 1, L); v.set(x, y + 1, z + 3, E); v.set(x + 2, y + 1, z + 3, E); v.set(x + 1, y, z + 3, PK); return; }
  bx(k, x, y, z, x + 2, y + 2, z + 1, A); bx(k, x, y + 3, z, x + 2, y + 4, z + 1, A);
  v.set(x, y + 4, z + 2, E); v.set(x + 2, y + 4, z + 2, E);
  if (kind === 'owl') { v.set(x, y + 5, z, A); v.set(x + 2, y + 5, z, A); v.set(x + 1, y + 3, z + 2, one(k, '#e8b030')); bx(k, x, y + 1, z + 2, x + 2, y + 1, z + 2, L); }
  else if (kind === 'cat') { v.set(x, y + 5, z, A); v.set(x + 2, y + 5, z, A); v.set(x + 1, y + 3, z + 2, PK); }
  else { v.set(x - 1, y + 5, z, A); v.set(x + 3, y + 5, z, A); v.set(x + 1, y + 3, z + 2, one(k, '#3a2418')); v.set(x + 1, y + 1, z + 2, L); }
}
export function beanbag(k, cx, y, cz, r, col) {
  const A = one(k, col), D = one(k, shade(col, -0.25)), L = one(k, shade(col, 0.2));
  ell(k.v, cx, y + r * 0.45, cz, r, r * 0.75, r, (x, yy, z) => (yy < y ? undefined : yy === y ? D : (z - cz) < -r * 0.3 && yy > y + 2 ? L : (x + yy) % 4 === 0 ? D : A));
  ell(k.v, cx, y + r * 0.9, cz - r * 0.2, r * 0.6, r * 0.25, r * 0.6, 0);   // the dent where you sit
}
export function backpack(k, x, y, z, col) {
  const A = one(k, col), D = one(k, shade(col, -0.3)), Z = one(k, '#d8d8d0');
  bx(k, x, y, z, x + 3, y + 4, z + 2, (xx, yy, zz) => (zz === z + 2 && yy === y + 2 ? Z : yy === y + 4 && zz < z + 2 ? D : A));
  bx(k, x + 1, y + 1, z + 3, x + 2, y + 2, z + 3, D);
}

// ------------------------------------------------------------ desks, tables, seats
export function desk(k, o) {
  const { x0, x1, z0, z1, y, h = 6 } = o, W = many(k, o.wood || ['#a87a4e', '#b08250', '#9a6e44']), WD = one(k, o.dark || '#6a4a2e'), K = one(k, '#d8b440');
  const top = y + h - 1;
  bx(k, x0, top, z0, x1, top, z1, (x, yy, z) => (z === z1 ? W[2] : W[(x >> 2) % 2]));
  for (const lx of [x0, x0 + 1]) bx(k, lx, y, z1 - 1, lx, top - 1, z1, W[2]);
  bx(k, x0, y, z0, x0 + 1, top - 1, z0, W[2]);
  const dx0 = x1 - 5;
  bx(k, dx0, y, z0, x1, top - 1, z1, (x, yy, z) => (z === z1 && (yy === y + 2 || x === dx0) ? WD : W[0]));
  for (const yy of [y + 1, y + 3]) k.v.set(Math.round((dx0 + x1) / 2), yy, z1 + 1, K);
  bx(k, x0 + 2, top - 1, z0, dx0 - 1, top - 1, z0, WD);        // modesty rail
  return { top: top + 1 };
}
export function chair(k, x, y, z, o = {}) {      // a wooden chair, back toward +z (facing −z)
  const W = many(k, o.wood || ['#8a5a36', '#965f3a']), S = one(k, o.seat || '#c8423a'), sy = y + 3;
  for (const [a, b] of [[x, z], [x + 4, z], [x, z + 4], [x + 4, z + 4]]) bx(k, a, y, b, a, sy - 1, b, W[0]);
  bx(k, x, sy, z, x + 4, sy, z + 4, (xx, yy, zz) => (xx > x && xx < x + 4 && zz > z && zz < z + 4 ? S : W[1]));
  const bz = o.backZ ?? z + 4;
  for (const a of [x, x + 4]) bx(k, a, sy + 1, bz, a, sy + 6, bz, W[0]);
  bx(k, x, sy + 5, bz, x + 4, sy + 6, bz, W[1]); bx(k, x + 2, sy + 1, bz, x + 2, sy + 4, bz, W[1]);
  return { seat: sy + 1 };
}
export function stool(k, cx, y, cz, o = {}) {
  const v = k.v, T = one(k, o.top || '#c8423a'), TL = one(k, shade(o.top || '#c8423a', 0.2)), L = one(k, o.leg || '#8a8e98'), h = o.h || 3;
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bx(k, cx + dx, y, cz + dz, cx + dx, y + h - 1, cz + dz, L);
  bx(k, cx - 1, y + 1, cz - 1, cx + 1, y + 1, cz + 1, (x, yy, z) => (x === cx && z === cz ? undefined : L));
  cylY(v, cx, cz, 1.8, y + h, y + h, (x, yy, z, d) => (d < 1 ? TL : T));
  return { seat: y + h + 1 };
}
// a round dining table on a pedestal; returns the top surface y
export function roundTable(k, cx, y, cz, r, o = {}) {
  const v = k.v, W = many(k, o.wood || ['#7a4a2c', '#84522f', '#70442a']), E = one(k, o.edge || '#5a3420'), h = o.h || 6, top = y + h - 1;
  cylY(v, cx, cz, r, top, top, (x, yy, z, d) => (d > r - 0.9 ? E : W[(Math.floor((x - cx) / 3) + 9) % 3]));
  cylY(v, cx, cz, r - 0.5, top - 1, top - 1, E);
  bx(k, Math.floor(cx) - 1, y, Math.floor(cz) - 1, Math.floor(cx) + 1, top - 2, Math.floor(cz) + 1, (x, yy, z) => ((x + z) & 1 ? W[0] : W[2]));
  for (const [dx, dz] of [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, 0], [2, 0], [0, -2], [0, 2]]) v.set(Math.floor(cx) + dx, y, Math.floor(cz) + dz, E);
  return top + 1;
}

// ------------------------------------------------------------ kitchen
// a run of base cabinets with a worktop, cabinet doors facing +z (front plane z1)
export function counter(k, o) {
  const { x0, x1, z0, z1, y, h = 7 } = o, D = many(k, o.door || ['#e8e0cc', '#e2dac6']), FR = one(k, o.frame || '#b8ac94'), TOP = many(k, o.top || ['#cfc8bc', '#c6bfb2', '#d6d0c4']), K = one(k, '#8a8e98'), KICK = one(k, '#4a4038');
  const top = y + h - 1, step = o.step || 6;
  bx(k, x0, y, z0, x1, top - 1, z1, (x, yy, z) => (yy === y ? KICK : z === z1 && ((x - x0) % step === 0 || yy === top - 2) ? FR : D[(x + yy) % 7 === 0 ? 1 : 0]));
  bx(k, x0, y, z1, x1, y, z1, 0);   // toe kick recess
  bx(k, x0, top, z0, x1, top, z1 + 1, (x, yy, z) => (z === z1 + 1 ? TOP[2] : TOP[Math.floor(h3(x, yy, z) * 2)]));
  for (let x = x0 + 2; x <= x1 - 1; x += step) k.v.set(x, top - 3, z1 + 1, K);
  return { top: top + 1 };
}
export function fridge(k, x0, y, z0, o = {}) {      // an old rounded fridge facing +z, w×d×h
  const v = k.v, w = o.w || 8, d = o.d || 6, h = o.h || 15, A = many(k, o.col || ['#e8e4d6', '#e0dccf']), S = one(k, '#c8c4b6'), H = one(k, '#a8acb4'), x1 = x0 + w - 1, z1 = z0 + d - 1;
  bx(k, x0, y, z0, x1, y + h - 1, z1, (x, yy, z) => ((x === x0 || x === x1) && (yy === y + h - 1) ? undefined : yy === y + 10 && z === z1 ? S : yy === y ? S : A[(yy >> 2) & 1]));
  for (const yy of [y + 11, y + 12, y + 13]) v.set(x1 - 1, yy, z1 + 1, H);
  for (const yy of [y + 6, y + 7, y + 8]) v.set(x1 - 1, yy, z1 + 1, H);
  return { front: z1, x0, x1, y0: y, y1: y + h - 1 };
}
// a two-burner gas range on the worktop with a wok and a steaming pot; returns steam point
export function stove(k, x0, y, z0, o = {}) {
  const v = k.v, B = one(k, '#2a2a2e'), M = many(k, ['#b8bcc4', '#a8acb4']), F = one(k, '#3a6ae8', GLOW), K = one(k, '#d8d8dc');
  bx(k, x0, y, z0, x0 + 11, y, z0 + 4, (x, yy, z) => (z === z0 + 4 ? M[0] : B));
  for (const cx of [x0 + 3, x0 + 8]) { v.set(cx, y + 1, z0 + 2, B); v.set(cx - 1, y + 1, z0 + 2, B); if (o.flame !== false) v.set(cx, y, z0 + 2, F); }
  for (const kx of [x0 + 2, x0 + 4, x0 + 7, x0 + 9]) v.set(kx, y, z0 + 5, K);
  // wok: a shallow dark bowl with a long handle toward +x... and a little stir-fry
  const wx = x0 + 3, wz = z0 + 2;
  for (let dx = -3; dx <= 3; dx++) for (let dz = -2; dz <= 2; dz++) { const d = Math.hypot(dx, dz * 1.3); if (d > 3.2) continue; v.set(wx + dx, y + 2 + (d > 2.2 ? 1 : 0), wz + dz, one(k, d > 2.2 ? '#3a3a40' : '#2a2a30')); }
  for (const [dx, dz, c] of [[-1, 0, '#5a9a3a'], [0, 1, '#e8783a'], [1, -1, '#f0d070'], [0, 0, '#8a4a2a'], [1, 1, '#5a9a3a']]) v.set(wx + dx, y + 3, wz + dz, one(k, c));
  bx(k, wx - 7, y + 3, wz, wx - 4, y + 3, wz, one(k, '#5a3a24'));       // handle out to the left
  // stockpot with a lid ajar
  const px = x0 + 8, pz = z0 + 2;
  cylY(v, px, pz, 2.2, y + 2, y + 5, (x, yy, z, d) => (yy === y + 5 ? one(k, '#d8dce2') : M[(x + yy) & 1]));
  cylY(v, px - 0.5, pz, 2.4, y + 6, y + 6, one(k, '#c8ccd4')); v.set(px, y + 7, pz, B);
  return { steam: [px, y + 7, pz], wok: [wx, y + 4, wz] };
}
export function riceCooker(k, x, y, z, o = {}) {
  const v = k.v, A = one(k, o.col || '#f2eee4'), P = one(k, o.accent || '#e88aa0'), D = one(k, '#3a3a40'), L = one(k, '#ff6a3a', GLOW);
  cylY(v, x + 1.5, z + 1.5, 2, y, y + 3, (xx, yy) => (yy === y + 1 ? P : A));
  cylY(v, x + 1.5, z + 1.5, 1.4, y + 4, y + 4, A); v.set(Math.round(x + 1.5), y + 5, Math.round(z + 1.5), D);
  v.set(Math.round(x + 1.5), y + 2, z + 4, L); v.set(Math.round(x + 2.5), y + 2, z + 4, D);
  return [x + 1.5, y + 5, z + 1.5];
}
export function sink(k, x0, y, z0, w = 8) {          // basin cut into the worktop at y-1, tap behind
  const v = k.v, S = one(k, '#b8bcc4'), SD = one(k, '#8a8e96'), T = one(k, '#c8ccd4');
  bx(k, x0, y - 1, z0 + 1, x0 + w - 1, y - 1, z0 + 4, (x, yy, z) => (x === x0 || x === x0 + w - 1 || z === z0 + 1 || z === z0 + 4 ? S : 0));
  bx(k, x0 + 1, y - 2, z0 + 2, x0 + w - 2, y - 2, z0 + 3, SD);
  const tx = x0 + (w >> 1); bx(k, tx, y, z0, tx, y + 3, z0, T); v.set(tx, y + 3, z0 + 1, T); v.set(tx, y + 2, z0 + 1, T);
  v.set(tx - 2, y, z0, T); v.set(tx + 2, y, z0, T);
}
export function hood(k, x0, x1, y, z0, z1) {
  const A = many(k, ['#9ea2aa', '#8e929a']), D = one(k, '#4a4e56');
  bx(k, x0, y, z0, x1, y + 1, z1, (x, yy, z) => (yy === y ? (z === z1 ? A[1] : D) : A[0]));
  bx(k, x0 + 1, y + 2, z0, x1 - 1, y + 2, z1 - 1, A[1]); bx(k, x0 + 3, y + 3, z0, x1 - 3, y + 6, z0 + 2, A[0]);
}
// a rail of hanging utensils (ladle, spatula, strainer, cleaver) along x at height y
export function utensils(k, x0, x1, y, z) {
  const v = k.v, R = one(k, '#8a8e98'), M = one(k, '#c8ccd4'), W = one(k, '#6a4428'), B = one(k, '#e8a840');
  bx(k, x0, y, z, x1, y, z, R);
  const kinds = ['ladle', 'spatula', 'strainer', 'ladle', 'cleaver', 'spatula'];
  for (let x = x0 + 1, i = 0; x < x1; x += 2, i++) {
    const kd = kinds[i % kinds.length];
    v.set(x, y - 1, z + 1, R);
    if (kd === 'cleaver') { bx(k, x, y - 3, z + 1, x, y - 2, z + 1, W); bx(k, x - 1, y - 6, z + 1, x, y - 4, z + 1, M); continue; }
    bx(k, x, y - 4, z + 1, x, y - 2, z + 1, kd === 'strainer' ? B : M);
    if (kd === 'ladle') { v.set(x, y - 5, z + 1, M); v.set(x, y - 5, z + 2, M); v.set(x, y - 6, z + 1, M); }
    else if (kd === 'spatula') { v.set(x, y - 5, z + 1, M); v.set(x, y - 6, z + 1, M); v.set(x - 1, y - 6, z + 1, M); }
    else { v.set(x, y - 5, z + 1, B); v.set(x - 1, y - 5, z + 1, B); v.set(x, y - 6, z + 1, B); v.set(x - 1, y - 6, z + 1, B); }
  }
}
// tall open shelving along x facing +z (or along z facing −x when o.facing === 'w')
export function shelfUnit(k, o) {
  const { x0, x1, z0, z1, y, h, levels } = o, W = many(k, o.wood || ['#8a6a48', '#7e6040']), BK = one(k, o.back || '#5a4430');
  bx(k, x0, y, z0, x1, y + h, z1, (x, yy, z) => {
    const fw = o.facing === 'w';
    const side = fw ? (z === z0 || z === z1) : (x === x0 || x === x1), back = fw ? x === x1 : z === z0;
    if (side || yy === y || yy === y + h || levels.includes(yy - y)) return W[(x + yy + z) & 1];
    return back ? BK : 0;
  });
}

// ------------------------------------------------------------ living room
// an aquarium on a stand: water (WATER), glass edges, gravel, weed, a glowing light strip
export function fishTank(k, x0, y, z0, w, h, d) {
  const v = k.v, x1 = x0 + w - 1, z1 = z0 + d - 1, y1 = y + h - 1, F = one(k, '#2a2a30'), G = many(k, ['#d8c8a0', '#c8b890', '#a89878', '#e8d8b0']), WA = one(k, '#5ab4c8', 2), LT = one(k, '#c8f0ff', GLOW);
  bx(k, x0, y, z0, x1, y, z1, F); bx(k, x0, y1, z0, x1, y1, z1, F);
  for (const [a, b] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) bx(k, a, y, b, a, y1, b, F);
  bx(k, x0 + 1, y + 1, z0 + 1, x1 - 1, y + 1, z1 - 1, (x, yy, z) => pickH(G, x, yy, z));
  bx(k, x0 + 1, y + 2, z0 + 1, x1 - 1, y1 - 2, z1 - 1, WA);
  for (let i = 0; i < 4; i++) { const x = x0 + 2 + Math.floor(h3(x0, i, 3) * (w - 4)), z = z0 + 1 + (i % 2); for (let j = 2; j < h - 2 - (i % 2); j++) v.set(x + (j % 3 === 0 ? 1 : 0), y + j, z, one(k, i % 2 ? '#3a9a4a' : '#5ab05a')); }
  bx(k, x0 + 1, y1, z0 + 1, x1 - 1, y1, z0 + 1, LT);
  // fish: little bright voxels inside the water (they read through the translucent surface)
  for (const [fx, fy, c] of [[x0 + 3, y + 4, '#ff8a2a'], [x1 - 3, y + 5, '#ffd040'], [x0 + Math.round(w / 2), y + 3, '#ff4a6a']]) { v.set(fx, fy, z0 + 1, one(k, c)); v.set(fx + 1, fy, z0 + 1, one(k, c)); }
  return { light: [(x0 + x1 + 1) / 2, y1, (z0 + z1 + 1) / 2] };
}
// owl perch: crossed feet, a post, a rope-wrapped bar along z, a food cup
export function perch(k, cx, y, cz, o = {}) {
  const v = k.v, W = many(k, o.wood || ['#7a5232', '#845a38']), R = one(k, '#c8a870'), RD = one(k, '#a08450'), top = y + (o.h || 7);
  bx(k, cx - 3, y, cz, cx + 3, y, cz, W[0]); bx(k, cx, y, cz - 3, cx, y, cz + 3, W[0]);
  bx(k, cx, y + 1, cz, cx, top - 1, cz, W[1]);
  bx(k, cx, top, cz - 3, cx, top, cz + 3, (x, yy, z) => ((z + yy) % 2 ? R : RD));
  v.set(cx, top, cz - 4, W[0]); v.set(cx, top, cz + 4, W[0]);
  v.set(cx + 1, top - 2, cz + 2, one(k, '#c8ccd4')); v.set(cx + 1, top - 3, cz + 2, one(k, '#c8ccd4'));
  return { top: top + 1 };
}
// a round wicker dog basket with a blanket and a cushion
export function dogBasket(k, cx, y, cz, r, o = {}) {
  const v = k.v, WK = many(k, ['#b88a50', '#a87a44', '#c8985a']), WD = one(k, '#7a5430'), BL = many(k, o.blanket || ['#c8423a', '#efe4cc']), CU = one(k, o.cushion || '#7a9ab8');
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    const d = Math.hypot(dx, dz); if (d > r + 0.3) continue;
    const x = cx + dx, z = cz + dz;
    v.set(x, y, z, WD);
    if (d > r - 1.1) { const hh = dz > r * 0.3 ? 2 : 3; for (let j = 1; j <= hh; j++) v.set(x, y + j, z, (j + Math.round(Math.atan2(dz, dx) * 4)) % 2 ? WK[0] : WK[2]); v.set(x, y + hh + 1, z, WK[1]); }
    else { v.set(x, y + 1, z, CU); if (dx < r * 0.4 && (dx + dz) < 2) v.set(x, y + 2, z, BL[((dx >> 1) + (dz >> 1)) & 1]); }
  }
  return { top: y + 2 };
}
// a red lacquered sideboard (doors facing +z)
export function sideboard(k, x0, x1, y, z0, z1, o = {}) {
  const R = many(k, o.col || ['#8e2a24', '#9a3028']), GD = one(k, '#d8a840'), DK = one(k, '#5a1a16'), h = o.h || 7;
  bx(k, x0, y, z0, x1, y + h - 1, z1, (x, yy, z) => (yy === y ? DK : z === z1 && ((x - x0) % 7 === 0 || yy === y + h - 1) ? DK : R[(x + yy) % 9 === 0 ? 1 : 0]));
  bx(k, x0 - 1, y + h, z0, x1 + 1, y + h, z1 + 1, one(k, o.top || '#6a2a20'));
  for (let x = x0 + 3; x < x1; x += 7) k.v.set(x, y + 4, z1 + 1, GD);
  return { top: y + h + 1 };
}
// an incense urn + electric candles + oranges on a high shelf (front plane z1)
export function altarShelf(k, x0, x1, y, z0, z1, bh = 8) {
  const v = k.v, R = one(k, '#a8282a'), RD = one(k, '#6e1a1c'), GD = many(k, C.gold), CN = one(k, '#ff4a2a', GLOW), OR = many(k, ['#f08a1e', '#e87a18', '#f8a030']);
  bx(k, x0, y, z0, x1, y, z1, R); bx(k, x0, y - 1, z1, x1, y - 1, z1, RD);
  for (const bx2 of [x0 + 1, x1 - 1]) for (let j = 1; j <= 2; j++) v.set(bx2, y - j, z0, RD);       // brackets
  bx(k, x0, y + 1, z0, x1, y + bh, z0, (x, yy) => (yy === y + bh || x === x0 || x === x1 ? GD[2] : R));      // backboard (decal goes here)
  const mx = Math.round((x0 + x1) / 2);
  cylY(v, mx, z0 + 2, 1.5, y + 1, y + 2, GD[0]); for (const dx of [-1, 0, 1]) { v.set(mx + dx, y + 3, z0 + 2, one(k, '#5a4a3a')); v.set(mx + dx, y + 4, z0 + 2, one(k, '#c8b898')); }
  for (const cxx of [x0 + 2, x1 - 2]) { v.set(cxx, y + 1, z0 + 2, GD[2]); v.set(cxx, y + 2, z0 + 2, R); v.set(cxx, y + 3, z0 + 2, CN); }
  for (const [dx, dz, dy] of [[-4, 2, 1], [-3, 2, 1], [-3, 1, 2], [4, 2, 1], [3, 2, 1], [3, 1, 2]]) v.set(mx + dx, y + dy, z0 + dz, OR[(dx + dz + 9) % 3]);
  return { incense: [mx, y + 4, z0 + 2], candles: [[x0 + 2, y + 3, z0 + 2], [x1 - 2, y + 3, z0 + 2]] };
}
// a small floor shrine for the earth god by the door (red box, gold trim, a red lamp)
export function floorShrine(k, x0, y, z0, o = {}) {
  const v = k.v, R = one(k, '#b02428'), RD = one(k, '#6e1a1c'), GD = one(k, C.gold[0]), L = one(k, '#ff3a2a', GLOW), w = o.w || 5, d = o.d || 4;
  bx(k, x0, y, z0, x0 + d - 1, y + 6, z0 + w - 1, (x, yy, z) => (yy === y + 6 ? GD : x === x0 && yy > y && yy < y + 6 && z > z0 && z < z0 + w - 1 ? RD : R));
  v.set(x0 - 1, y + 1, z0 + 1, L); v.set(x0 - 1, y + 1, z0 + w - 2, L);
  cylY(v, x0 - 2, z0 + (w - 1) / 2, 1, y, y + 1, GD); v.set(x0 - 2, y + 2, Math.round(z0 + (w - 1) / 2), one(k, '#c8b898'));
  return { face: [x0 - 1, z0 + 1, z0 + w - 2, y + 1, y + 5] };
}

// ------------------------------------------------------------ desk-top things
export function laptop(k, x, y, z, o = {}) {      // base on the desk at y, screen standing at the back (z), facing +z
  const v = k.v, A = one(k, o.col || '#5a5e66'), D = one(k, '#2e3036'), w = o.w || 6;
  bx(k, x, y, z, x + w - 1, y, z + 3, (xx, yy, zz) => (zz > z && zz < z + 3 && xx > x && xx < x + w - 1 ? D : A));
  bx(k, x, y + 1, z, x + w - 1, y + 4, z, A);
  return { screen: [x, y + 1, x + w - 1, y + 4, z] };   // decal on the +z face of layer z
}
export function noodleCup(k, x, y, z, col = '#e8402e', o = {}) {   // a 2×2 cup, lid peeled back, chopsticks in it
  const v = k.v, A = one(k, '#f6f2ea'), B = one(k, col), CS = one(k, '#c89a5a');
  bx(k, x, y, z, x + 1, y + 1, z + 1, (xx, yy) => (yy === y + 1 ? B : A));
  if (o.open !== false) { v.set(x, y + 2, z, one(k, '#d8d4cc')); v.set(x + 1, y + 2, z + 1, CS); v.set(x + 1, y + 3, z + 1, CS); }
  return [x, y, x + 1, y + 1, z + 1];
}
export function mug(k, x, y, z, col = '#e8e4dc', o = {}) {
  const v = k.v, A = one(k, col); v.set(x, y, z, A); v.set(x, y + 1, z, A); v.set(x + 1, y, z, one(k, shade(col, -0.25)));
  if (o.pens) { v.set(x, y + 2, z, one(k, '#3a6ac8')); v.set(x, y + 3, z, one(k, '#e8c040')); }
}
// an anglepoise desk lamp: base, two arm segments, a head over (hx, hz); returns the bulb point (voxels)
export function deskLamp(k, x, y, z, o = {}) {
  const v = k.v, A = one(k, o.col || '#3a8a7a'), D = one(k, '#2a2a2e'), dir = o.dir || -1;
  bx(k, x, y, z, x + 1, y, z + 1, D);
  line3(v, [x, y + 1, z], [x, y + 6, z], A);
  line3(v, [x, y + 6, z], [x + dir * 3, y + 8, z + 1], A);
  const hx = x + dir * 4; bx(k, Math.min(hx, hx - dir), y + 7, z + 1, Math.max(hx, hx - dir), y + 8, z + 2, A);
  return [hx + 0.5, y + 6.6, z + 2];
}
// a pendant: cord from yTop down to a cone shade; returns the bulb point (voxels)
export function pendant(k, x, yTop, yShade, z, o = {}) {
  const v = k.v, CO = one(k, '#2a2420'), S = many(k, o.shade || ['#e8d8a8', '#d8c898']);
  for (let y = yShade + 2; y <= yTop; y++) v.set(x, y, z, CO);
  cylY(v, x + 0.5, z + 0.5, 1.2, yShade + 1, yShade + 1, S[0]);
  cylY(v, x + 0.5, z + 0.5, 2.3, yShade, yShade, (xx, yy, zz, d) => (d > 1.6 ? S[1] : undefined));
  return [x + 0.5, yShade - 0.2, z + 0.5];
}
export function crtMonitor(k, x, y, z, o = {}) {      // an old beige CRT facing +z, w=7: returns the screen rect
  const v = k.v, A = many(k, ['#d8d0b8', '#ccc4ac']), D = one(k, '#9a927e'), w = o.w || 7, d = o.d || 6;
  bx(k, x + 1, y, z + 1, x + w - 2, y, z + d - 2, D);
  bx(k, x, y + 1, z + 1, x + w - 1, y + 6, z + d - 1, (xx, yy, zz) => (zz === z + d - 1 && xx > x && xx < x + w - 1 && yy > y + 1 && yy < y + 6 ? one(k, '#1e2a24') : A[(yy + zz) & 1]));
  bx(k, x + 1, y + 2, z, x + w - 2, y + 5, z, A[1]);
  v.set(x + w - 2, y + 1, z + d, one(k, '#3ac85a', GLOW));
  return { screen: [x + 1, y + 2, x + w - 2, y + 5, z + d - 1] };
}

// ------------------------------------------------------------ martial-arts hall parts
// wing-chun wooden dummy on a frame facing +z: trunk, two upper arms, a lower arm, a bent leg
export function woodDummy(k, x, y, z, o = {}) {
  const v = k.v, W = many(k, ['#8a5a32', '#9a6538', '#7e5230']), A = one(k, '#c89a5a'), F = one(k, '#5a3a22');
  bx(k, x - 4, y + 13, z - 1, x + 5, y + 13, z, F); bx(k, x - 4, y + 3, z - 1, x + 5, y + 3, z, F);
  for (const px of [x - 4, x + 5]) bx(k, px, y, z - 1, px, y + 14, z, F);
  cylY(v, x + 0.5, z + 0.5, 1.6, y + 1, y + 16, (xx, yy, zz) => W[(yy + xx) % 3]);
  line3(v, [x - 1, y + 12, z + 2], [x - 2, y + 12, z + 5], A); line3(v, [x + 2, y + 12, z + 2], [x + 3, y + 12, z + 5], A);
  line3(v, [x, y + 9, z + 2], [x, y + 9, z + 5], A);
  line3(v, [x + 1, y + 4, z + 2], [x + 1, y + 2, z + 4], A); v.set(x + 1, y + 1, z + 4, A);
}
// a weapon rack against a +z-facing wall: two rails holding staffs, spears, swords
export function weaponRack(k, x0, x1, y, z, o = {}) {
  const v = k.v, R = many(k, ['#8a2a22', '#9a3226']), W = many(k, ['#c8a060', '#b8904e', '#d4ac6c']), M = one(k, '#c8ccd4'), TS = one(k, '#c8302c'), G = one(k, C.gold[0]);
  bx(k, x0, y, z, x0 + 1, y + 20, z + 1, R[0]); bx(k, x1 - 1, y, z, x1, y + 20, z + 1, R[0]);
  bx(k, x0, y + 1, z, x1, y + 2, z + 2, R[1]); bx(k, x0, y + 17, z, x1, y + 18, z + 2, R[1]);
  let i = 0;
  for (let x = x0 + 3; x <= x1 - 3; x += 2, i++) {
    const kind = o.kinds ? o.kinds[i % o.kinds.length] : ['staff', 'spear', 'staff', 'sword', 'staff', 'broad'][i % 6];
    if (kind === 'staff') bx(k, x, y + 2, z + 1, x, y + 24, z + 1, W[i % 3]);
    else if (kind === 'spear') { bx(k, x, y + 2, z + 1, x, y + 22, z + 1, W[1]); bx(k, x, y + 23, z + 1, x, y + 25, z + 1, M); v.set(x, y + 22, z + 2, TS); v.set(x, y + 21, z + 2, TS); }
    else { bx(k, x, y + 2, z + 1, x, y + 5, z + 1, kind === 'broad' ? one(k, '#3a2418') : W[0]); v.set(x - 1, y + 6, z + 1, G); v.set(x + 1, y + 6, z + 1, G); bx(k, x, y + 6, z + 1, x, y + (kind === 'broad' ? 14 : 16), z + 1, M); if (kind === 'broad') v.set(x + 1, y + 13, z + 1, M); v.set(x, y + 3, z + 2, TS); }
  }
}
// a big drum on a red stand (drumhead facing +z): returns the head rect for a decal
export function drum(k, cx, y, cz, o = {}) {
  const v = k.v, r = o.r || 5, R = many(k, ['#b02428', '#a02024']), HD = one(k, '#e8d8b0'), N = one(k, C.gold[0]), ST = one(k, '#6a2a1e'), d = o.depth || 6;
  for (const [a, b] of [[-r, -2], [r, -2], [-r, d + 1], [r, d + 1]]) bx(k, cx + a, y, cz + b, cx + a, y + r + 3, cz + b, ST);
  bx(k, cx - r, y + 2, cz - 2, cx + r, y + 2, cz - 2, ST); bx(k, cx - r, y + 2, cz + d + 1, cx + r, y + 2, cz + d + 1, ST);
  const yc = y + r + 4;
  for (let z = cz; z <= cz + d; z++) for (let dy = -r - 1; dy <= r + 1; dy++) for (let dx = -r - 1; dx <= r + 1; dx++) {
    const bulge = r + 0.6 + Math.sin(((z - cz) / d) * Math.PI) * 0.8, dd = Math.hypot(dx, dy); if (dd > bulge) continue;
    const face = z === cz || z === cz + d;
    v.set(cx + dx, yc + dy, z, face ? (dd > r - 0.4 ? N : HD) : dd > bulge - 1.2 ? ((z === cz + 1 || z === cz + d - 1) && (Math.round(Math.atan2(dy, dx) * 3) & 1) ? N : R[(z + dy) & 1]) : 0);
  }
  return { head: [cx - r + 1, yc - r + 1, cx + r - 1, yc + r - 1, cz + d], yc };
}
export function gong(k, cx, y, z, o = {}) {        // a bronze gong hanging in a frame (face +z)
  const v = k.v, r = o.r || 5, F = many(k, ['#5a2a1e', '#6a3222']), B = many(k, ['#c8963a', '#d8a848', '#b8862e']), BD = one(k, '#8a6020'), RP = one(k, '#c8302c');
  for (const px of [cx - r - 2, cx + r + 2]) bx(k, px, y, z, px, y + 2 * r + 7, z + 1, F[0]);
  bx(k, cx - r - 3, y + 2 * r + 7, z, cx + r + 3, y + 2 * r + 8, z + 1, F[1]);
  bx(k, cx - r - 3, y, z - 2, cx - r - 1, y, z + 3, F[1]); bx(k, cx + r + 1, y, z - 2, cx + r + 3, y, z + 3, F[1]);
  const yc = y + r + 4;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const d = Math.hypot(dx, dy); if (d > r + 0.3) continue; v.set(cx + dx, yc + dy, z + 1, d > r - 0.8 ? BD : d < 1.6 ? B[1] : (Math.round(d) % 2 ? B[0] : B[2])); }
  line3(v, [cx - 2, yc + r, z + 1], [cx - 3, y + 2 * r + 6, z + 1], RP); line3(v, [cx + 2, yc + r, z + 1], [cx + 3, y + 2 * r + 6, z + 1], RP);
}
// a lion-dance head (facing +z) on a low stand: big mouth, eyes, horn, fur trim
export function lionHead(k, cx, y, cz, o = {}) {
  const v = k.v, M = many(k, o.main || ['#d8302c', '#c8282a']), T = many(k, o.trim || [C.gold[0], C.gold[1]]), FUR = one(k, o.fur || '#f4f0e8'), MO = one(k, '#3a1414'), E = one(k, '#f8f4ec'), PU = one(k, '#1a1a1a'), HN = one(k, o.horn || C.gold[1]), ST = one(k, '#4a3022');
  bx(k, cx - 4, y, cz - 4, cx + 4, y + 3, cz + 4, ST);
  const yb = y + 4;
  ell(v, cx, yb + 6, cz, 7, 6, 6.5, (x, yy, z, d) => (d > 0.82 ? (yy > yb + 9 ? M[1] : T[(x + yy) & 1]) : M[0]));
  bx(k, cx - 5, yb + 1, cz + 3, cx + 5, yb + 4, cz + 7, 0);                 // the mouth gapes open
  bx(k, cx - 5, yb + 1, cz + 2, cx + 5, yb + 1, cz + 6, MO); bx(k, cx - 5, yb, cz + 1, cx + 5, yb, cz + 6, T[0]);
  for (let x = cx - 5; x <= cx + 5; x++) { v.set(x, yb + 4, cz + 7, FUR); v.set(x, yb + 5, cz + 7, x % 2 ? FUR : T[1]); }
  for (let z = cz + 1; z <= cz + 6; z++) v.set(cx - 5, yb + 1, z, FUR), v.set(cx + 5, yb + 1, z, FUR);
  for (const ex of [cx - 3, cx + 3]) { bx(k, ex - 1, yb + 7, cz + 6, ex + 1, yb + 9, cz + 6, E); v.set(ex, yb + 8, cz + 7, PU); bx(k, ex - 2, yb + 10, cz + 6, ex + 2, yb + 10, cz + 6, FUR); }
  bx(k, cx - 1, yb + 6, cz + 7, cx + 1, yb + 6, cz + 7, one(k, '#e8484a'));
  for (let j = 0; j < 4; j++) v.set(cx, yb + 12 + j, cz + 1 - (j >> 1), HN);
  v.set(cx, yb + 16, cz - 1, one(k, '#ff6a8a'));
  for (let a = 0; a < 18; a++) { const t = (a / 18) * Math.PI * 2, x = Math.round(cx + Math.cos(t) * 7.4), yy = Math.round(yb + 6 + Math.sin(t) * 6.2); if (yy > yb + 2) v.set(x, yy, cz + 3, FUR); }
  return { forehead: [cx - 2, yb + 11, cx + 2, yb + 13, cz + 5] };
}
export function punchingBag(k, cx, y, cz, yTop, o = {}) {
  const v = k.v, B = many(k, o.col || ['#a82a24', '#b8342a']), BD = one(k, '#6a1a16'), CH = one(k, '#8a8e98'), L = one(k, '#2a2a2e');
  for (let yy = y + 13; yy <= yTop; yy++) v.set(cx, yy, cz, CH);
  cylY(v, cx, cz, 2.2, y + 3, y + 12, (x, yy, z) => (yy === y + 3 || yy === y + 12 ? BD : yy === y + 8 ? L : B[(x + yy) & 1]));
}
// stone pot with a voxel bonsai: a twisting trunk and flat cloud pads of leaves
export function bonsai(k, cx, y, cz, seed = 1, o = {}) {
  const v = k.v, P = many(k, o.pot || ['#4a6a7a', '#3e5e6e']), PR = one(k, '#c8b898'), T = many(k, ['#5a3a26', '#6a4630', '#4e3220']), L = many(k, ['#3e6e2e', '#4a7c34', '#56883c', '#62944a']), r = o.r || 3;
  bx(k, cx - r - 1, y, cz - r, cx + r + 1, y + 2, cz + r, (x, yy, z) => (yy === y + 2 ? PR : P[(x + z) & 1]));
  bx(k, cx - r, y + 2, cz - r + 1, cx + r, y + 2, cz + r - 1, one(k, '#4a3424'));
  let x = cx, z = cz; const H = o.h || 8;
  for (let j = 0; j < H; j++) { v.set(x, y + 3 + j, z, T[j % 3]); if (j % 3 === 1) x += h3(seed, j, 1) < 0.5 ? -1 : 1; if (j % 4 === 2) z += h3(seed, j, 2) < 0.5 ? -1 : 0; }
  const pads = [[x, y + 3 + H, z, 3.4], [x - 3, y + 2 + Math.round(H * 0.6), z + 1, 2.6], [x + 3, y + 3 + Math.round(H * 0.45), z, 2.4]];
  for (const [px, py, pz, pr] of pads) { line3(v, [cx, y + 3 + Math.round(H * 0.4), cz], [px, py - 1, pz], T[0]); for (let dx = -Math.ceil(pr); dx <= Math.ceil(pr); dx++) for (let dz = -Math.ceil(pr); dz <= Math.ceil(pr); dz++) { const d = Math.hypot(dx, dz * 1.2); if (d > pr) continue; v.set(px + dx, py, pz + dz, L[Math.floor(h3(px + dx, py, pz + dz) * 3)]); if (d < pr - 1.2) v.set(px + dx, py + 1, pz + dz, L[3]); } }
}

// plum-blossom training poles (mui fa jong): a cluster of posts of varied heights on a stone pad
export function plumPoles(k, x0, y, z0, nx = 3, nz = 3, gap = 5, seed = 2) {
  const W = many(k, ['#8a5a32', '#9a6538', '#7e5230']), TOPC = one(k, '#c89a5a'), PAD = many(k, ['#8f8b84', '#99958d']);
  bx(k, x0 - 2, y - 1, z0 - 2, x0 + (nx - 1) * gap + 3, y - 1, z0 + (nz - 1) * gap + 3, (x, yy, z) => PAD[(x + z) & 1]);
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const x = x0 + i * gap, z = z0 + j * gap, h = 6 + Math.floor(h3(i, j, seed) * 9); bx(k, x, y, z, x + 1, y + h - 1, z + 1, (xx, yy) => W[(yy + i) % 3]); bx(k, x, y + h, z, x + 1, y + h, z + 1, TOPC); }
}
// a big glazed fish jar with water and lotus leaves
export function fishJar(k, cx, y, cz, r = 4) {
  const v = k.v, G = many(k, ['#2e5a7a', '#3a6a8a', '#28506e']), RIM = one(k, '#e8e2d4'), WA = one(k, '#3a7a8a', 2), LP = many(k, ['#3e7e3a', '#4a8a44']);
  cylY(v, cx, cz, r, y, y + 5, (x, yy, z, d) => (yy === y + 5 && d > r - 1 ? RIM : d > r - 1 ? G[(Math.round(Math.atan2(z - cz, x - cx) * 4) + yy) % 3] : yy === y ? G[0] : 0));
  cylY(v, cx, cz, r - 1, y + 4, y + 4, WA);
  for (const [dx, dz] of [[-1, 0], [1, 1], [0, -2]]) { v.set(Math.round(cx + dx), y + 5, Math.round(cz + dz), LP[(dx + 9) % 2]); v.set(Math.round(cx + dx + 1), y + 5, Math.round(cz + dz), LP[1]); }
  v.set(Math.round(cx), y + 6, Math.round(cz - 1), one(k, '#f0a0c0')); v.set(Math.round(cx), y + 7, Math.round(cz - 1), one(k, '#ffd0e0'));
}
// a gilt trophy cup on a base
export function trophy(k, x, y, z, h = 4, col = C.gold[0]) {
  const v = k.v, G = one(k, col), GD = one(k, shade(col, -0.3)), B = one(k, '#3a2a22');
  v.set(x, y, z, B); v.set(x, y + 1, z, GD); for (let j = 2; j < h; j++) v.set(x, y + j, z, G);
  v.set(x - 1, y + h - 1, z, G); v.set(x + 1, y + h - 1, z, G); v.set(x, y + h, z, G);
}
// a tea set on a low table top at y: clay pot, four cups, a tin
export function teaSet(k, x, y, z) {
  const v = k.v, POT = one(k, '#8a3a24'), POTL = one(k, '#a24a2c'), CUP = one(k, '#f2eee4'), TIN = one(k, '#2e7a4a');
  bx(k, x, y, z, x + 1, y + 1, z + 1, POT); v.set(x, y + 2, z, POTL); v.set(x + 2, y + 1, z, POT); v.set(x - 1, y + 1, z + 1, POT);
  for (const [dx, dz] of [[3, -1], [3, 2], [-2, -1], [-2, 2]]) v.set(x + dx, y, z + dz, CUP);
  bx(k, x + 4, y, z + 3, x + 4, y + 1, z + 3, TIN);
}

// ------------------------------------------------------------ 2D sprites (cards)
// wisps of steam (billboards over pots and bowls) and a few interior plants
export function interiorSprites() {
  const steam = [0, 1, 2].map((i) => sprite('in-steam' + i, 12, 22, (p, W, H) => {
    for (let k = 0; k < 3; k++) { let x = 3 + k * 3 + p.rand(-1, 1); for (let y = H - 1; y > 2 + k * 3; y--) { x += Math.sin(y * 0.45 + k * 2 + i) * 0.55; const a = y / H; p.px(Math.round(x), y, a > 0.6 ? '#f4f4f0' : a > 0.3 ? '#e4e8ec' : '#d0d6de'); if ((y + k) % 3 === 0) p.px(Math.round(x) + 1, y, '#e8ecf0'); } }
  }, { ppm: 26 }));
  const monstera = sprite('in-monstera', 26, 26, (p, W, H) => {
    for (let f = 0; f < 7; f++) { const a = -Math.PI / 2 + (f - 3) * 0.42, L = 9 + (f % 3) * 2, bxx = W / 2 + Math.cos(a) * L, byy = H - 2 + Math.sin(a) * L; p.line(W / 2, H - 1, Math.round(bxx), Math.round(byy), '#3a6a2a'); p.ell(bxx, byy, 4.5, 3.5, f % 2 ? '#3e8a3a' : '#4a9a44'); p.px(Math.round(bxx) - 1, Math.round(byy) - 1, '#7ac06a'); p.px(Math.round(bxx + 2), Math.round(byy), '#2a5a24'); }
  }, { ppm: 24 });
  const pothos = sprite('in-pothos', 24, 30, (p, W, H) => {
    for (let s = 0; s < 4; s++) { let x = 6 + s * 4; for (let y = 2; y < H - 1; y += 2) { x += Math.sin(y * 0.4 + s) * 1.2; p.px(Math.round(x), y, '#3a6a2a'); if ((y + s) % 4 === 0) { p.ell(x + (s % 2 ? 2 : -2), y, 2.2, 1.6, (y + s) % 8 ? '#5aa04a' : '#e8e070'); p.px(Math.round(x + (s % 2 ? 2 : -2)) - 1, y - 1, '#8ad07a'); } } }
  }, { ppm: 24 });
  const lucky = sprite('in-lucky', 14, 30, (p, W, H) => { for (const [x0, lean] of [[5, -0.06], [8, 0.08], [7, 0]]) for (let y = H - 1; y > 6; y--) { const x = Math.round(x0 + (H - y) * lean); p.px(x, y, (H - y) % 6 === 0 ? '#c8c060' : '#6aa040'); } for (let k = 0; k < 14; k++) { const x = p.rand(2, W - 3), y = p.rand(2, 14); p.ell(x, y, 2.2, 1, k % 3 ? '#5a9a3a' : '#7ab84a'); } p.rect(5, H - 3, 5, 2, '#c8302c'); }, { ppm: 24 });
  return { steam, monstera, pothos, lucky };
}

// garments on hangers, seen from the front (cards hung from a rail): each sprite has its wire hanger
export function garmentSprites() {
  const hanger = (p, W) => { const cx = Math.floor(W / 2); p.px(cx, 0, '#9aa0a8'); p.px(cx + 1, 1, '#9aa0a8'); p.px(cx, 2, '#9aa0a8'); p.line(cx, 3, 3, 7, '#b8bcc4'); p.line(cx, 3, W - 4, 7, '#b8bcc4'); };
  const torso = (p, W, H, c, o = {}) => {
    const D = shift(c, -0.7), L = shift(c, 0.5), top = 6, sh = o.sleeve ?? 5;
    p.rect(4, top, W - 8, H - top - 1, c);                                   // body
    p.poly([[4, top], [0, top + 3], [0, top + sh + 10], [3, top + sh + 10], [4, top + 6]], c); p.poly([[W - 4, top], [W, top + 3], [W, top + sh + 10], [W - 3, top + sh + 10], [W - 4, top + 6]], c);   // sleeves
    p.vl(4, top + 1, H - 2, L); p.vl(W - 5, top + 1, H - 2, D); p.hl(4, W - 5, H - 1, D); p.vl(0, top + 3, top + sh + 10, L); p.vl(W - 1, top + 3, top + sh + 10, D);
    if (o.cuff) { p.hl(0, 3, top + sh + 10, o.cuff); p.hl(W - 3, W - 1, top + sh + 10, o.cuff); }
  };
  const mk = (name, W, H, fn) => sprite('gm-' + name, W, H, (p) => { fn(p, W, H); hanger(p, W); }, { ppm: 40 });
  return [
    mk('hoodie', 24, 30, (p, W, H) => { torso(p, W, H, '#e8b830', { cuff: '#c8961e' }); p.ell(W / 2, 7, 5, 3, '#c8961e'); p.rect(7, H - 10, W - 14, 5, '#d8a628'); p.vl(10, 9, 14, '#f4ecd8'); p.vl(13, 9, 13, '#f4ecd8'); critter(p, W / 2, 16, 3.5, '#e8503a', { ears: 'none' }); }),
    mk('denim', 24, 28, (p, W, H) => { torso(p, W, H, '#3a64a0'); p.vl(Math.floor(W / 2), 7, H - 2, '#2a4a7a'); p.poly([[8, 6], [W / 2, 11], [W - 8, 6]], '#2e5288'); for (let y = 10; y < H - 2; y += 4) p.px(Math.floor(W / 2) + 1, y, '#d8c060'); p.rect(6, 11, 4, 3, '#2e5288'); p.rect(W - 10, 11, 4, 3, '#2e5288'); p.hl(4, W - 5, H - 4, '#d8c060'); }),
    mk('stripes', 22, 24, (p, W, H) => { torso(p, W, H, '#f4f0e8', { sleeve: 1 }); for (let y = 8; y < H - 1; y += 3) p.hl(4, W - 5, y, '#c8302c'); p.ell(W / 2, 6, 3, 1.5, '#d8d0c4'); }),
    mk('qipao', 20, 38, (p, W, H) => { torso(p, W, H, '#c8202a', { sleeve: -3, cuff: '#e8b838' }); for (let y = 8; y < H - 2; y += 5) for (let x = 6; x < W - 6; x += 5) p.px(x + ((y / 5) & 1) * 2, y, '#f0c040'); p.line(W / 2, 7, W - 7, 12, '#f0c040'); p.px(W - 8, 9, '#f8e090'); p.px(W - 7, 12, '#f8e090'); p.vl(6, H - 10, H - 2, '#8a141a'); }),
    mk('flannel', 24, 28, (p, W, H) => { torso(p, W, H, '#3a7a4a'); for (let y = 6; y < H; y++) for (let x = 0; x < W; x++) if (p.s.data[y * W + x] >>> 24 && ((x % 6 < 2) || (y % 6 < 2))) p.px(x, y, (x % 6 < 2) && (y % 6 < 2) ? '#1e2a22' : '#2a4a32'); p.vl(Math.floor(W / 2), 7, H - 2, '#e8e4dc'); }),
    mk('varsity', 24, 28, (p, W, H) => { torso(p, W, H, '#6a3a9a', { cuff: '#f0e8d8' }); p.poly([[4, 6], [0, 9], [0, 21], [3, 21], [4, 12]], '#f0e8d8'); p.poly([[W - 4, 6], [W, 9], [W, 21], [W - 3, 21], [W - 4, 12]], '#f0e8d8'); p.hl(4, W - 5, H - 2, '#f0e8d8'); p.hl(4, W - 5, H - 3, '#e8c040'); p.rect(6, 11, 5, 6, '#f0e8d8'); p.text('T', 7, 11, '#6a3a9a', { mini: true }); }),
    mk('track', 22, 28, (p, W, H) => { torso(p, W, H, '#1e9a9a', { cuff: '#f4f0e8' }); p.vl(1, 10, 20, '#f4f0e8'); p.vl(W - 2, 10, 20, '#f4f0e8'); p.vl(Math.floor(W / 2), 7, H - 2, '#c8ccd4'); p.rect(Math.floor(W / 2) - 1, 7, 3, 3, '#f4f0e8'); }),
  ];
}

// ============================================================ painted decals
// Every CJK string used in the interiors (prepare() loads these glyphs).
export const INTERIOR_TEXT = '福星雜貨福祖先堂上歷代香火十月丙午年初一二三四五六七八九十廿三宜出行嫁娶忌動土華埠晨報利是大吉恭喜發財白米醬油蝦片麵茶辣餅糖普洱龍井菊花金鉗武館強身健體以武會友武德精神忍和報名比賽課程表兒童班醒獅王武聖月光醫館平安如意招財進寶麻辣拉麵牛肉海鮮雲吞湯匙茶葉罐鉗心不倒';
const small = (p, str, x, y, c, o = {}) => p.text(str, x, y, c, o);
function blob(p, cx, cy, rx, ry, T, rim = true) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const u = (x - cx) / rx, w = (y - cy) / ry, d = u * u + w * w; if (d > 1) continue;
    const l = -u * 0.6 - w * 0.75 + (1 - d) * 0.5;
    p.px(x, y, rim && d > 0.78 ? T[0] : l > 0.95 ? T[3] : l > 0.35 ? T[2] : l > -0.3 ? T[1] : T[0]);
  }
}
const glare = (p, W, H, n = 2, a = 0.12) => { for (let i = 0; i < n; i++) { const x0 = Math.round(W * (0.15 + i * 0.45)); for (let y = 0; y < H; y++) for (let d = 0; d < 3 + i; d++) { const x = x0 + d - Math.round(y * 0.6); if (x >= 0 && x < W) p.blend(x, y, '#ffffff', a); } } };
const sub = (p, W, H, x, y, fn) => { const S = newSurf(W, H), q = new Pen(S, 5); fn(q, W, H); p.put(S, x, y); };
// a tiny chibi critter face (used on packaging & posters): body colour, ear style
function critter(p, cx, cy, r, col, o = {}) {
  const D = shift(col, -0.9), L = shift(col, 0.6);
  if (o.ears === 'cat') { p.poly([[cx - r, cy - r * 0.3], [cx - r * 0.7, cy - r * 1.3], [cx - r * 0.2, cy - r * 0.8]], col); p.poly([[cx + r, cy - r * 0.3], [cx + r * 0.7, cy - r * 1.3], [cx + r * 0.2, cy - r * 0.8]], col); }
  if (o.ears === 'bear') { p.ell(cx - r * 0.75, cy - r * 0.75, r * 0.38, r * 0.38, col); p.ell(cx + r * 0.75, cy - r * 0.75, r * 0.38, r * 0.38, col); }
  if (o.ears === 'tuft') { p.line(cx - r * 0.6, cy - r * 0.8, cx - r * 0.9, cy - r * 1.4, D); p.line(cx + r * 0.6, cy - r * 0.8, cx + r * 0.9, cy - r * 1.4, D); }
  blob(p, cx, cy, r, r * 0.9, [D, col, L, shift(col, 1.2)], false);
  const ey = Math.round(cy - r * 0.1), ex = Math.max(1, Math.round(r * 0.38));
  p.px(cx - ex, ey, '#1e1418'); p.px(cx + ex, ey, '#1e1418'); if (r > 5) { p.px(cx - ex, ey - 1, '#1e1418'); p.px(cx + ex, ey - 1, '#1e1418'); p.px(cx - ex + 1, ey - 1, '#ffffff'); p.px(cx + ex + 1, ey - 1, '#ffffff'); }
  p.px(cx, ey + Math.max(1, Math.round(r * 0.3)), o.mouth || '#c8302c');
  if (o.blush !== false) { p.px(cx - ex - 1, ey + 1, '#ff9aa8'); p.px(cx + ex + 1, ey + 1, '#ff9aa8'); }
  if (o.beak) { p.px(cx, ey + 1, '#f0b030'); p.px(cx, ey + 2, '#d89020'); }
}

export const P2 = {
  // -------- bedroom posters (original bands)
  // "NEON TOFU": a glowing cube of tofu with lightning eyes over a pink-to-violet sunset grid
  posterTofu: () => (p, W, H) => {
    p.vgrad(0, 0, W, H, ['#1a0e3a', '#5a1a6a', '#e8466a', '#ffb05a']);
    const hy = Math.round(H * 0.68);
    for (let y = hy; y < H; y++) for (let x = 0; x < W; x++) { const t = (y - hy) / (H - hy); if ((y - hy) % Math.max(2, Math.round(1 + t * 6)) === 0 || Math.abs((x - W / 2) * (1 - t * 0.2)) % Math.round(W / 6) < 1) p.px(x, y, '#ff5ac8'); else p.px(x, y, '#2a0e3a'); }
    blob(p, W / 2, hy - 2, W * 0.3, W * 0.3, ['#ff7a3a', '#ffb04a', '#ffd86a', '#fff2b0'], false);
    for (let y = hy - Math.round(W * 0.3); y < hy; y += 3) p.hl(Math.round(W * 0.2), Math.round(W * 0.8), y, '#5a1a6a');
    const c = Math.round(W / 2), s = Math.round(W * 0.2), ty = Math.round(H * 0.36);
    p.rect(c - s, ty - s, s * 2, s * 2, '#f6f2e6'); p.poly([[c - s, ty - s], [c - s + 4, ty - s - 4], [c + s + 4, ty - s - 4], [c + s, ty - s]], '#ffffff'); p.poly([[c + s, ty - s], [c + s + 4, ty - s - 4], [c + s + 4, ty + s - 4], [c + s, ty + s]], '#d8d0c0');
    p.line(c - s + 3, ty - 2, c - 3, ty - 4, '#3ae8ff'); p.line(c + 3, ty - 4, c + s - 3, ty - 2, '#3ae8ff'); p.px(c, ty + 4, '#ff3a8a'); p.px(c - 1, ty + 5, '#ff3a8a'); p.px(c + 1, ty + 5, '#ff3a8a');
    p.rect(0, 2, W, 12, '#14081e'); small(p, 'NEON TOFU', W / 2, 5, '#3ae8ff', { align: 'center', outline: '#5a1a6a' });
    small(p, 'LIVE @ THE FOGHORN', W / 2, H - 9, '#fff2b0', { align: 'center', mini: true });
    p.frame(0, 0, W, H, '#14081e');
  },
  // "DUMPLING DYNASTY": a crowned dumpling, sunburst, tour dates
  posterDumpling: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#f0d860');
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; if (i % 2) p.poly([[W / 2, H * 0.45], [W / 2 + Math.cos(a) * W, H * 0.45 + Math.sin(a) * W], [W / 2 + Math.cos(a + 0.26) * W, H * 0.45 + Math.sin(a + 0.26) * W]], '#e8a830'); }
    const cx = W / 2, cy = H * 0.47, r = W * 0.27;
    p.ell(cx, cy + r * 0.35, r * 1.15, r * 0.6, '#d8c8a8'); p.ell(cx, cy, r, r * 0.8, '#f6f0e2');
    for (let i = -3; i <= 3; i++) p.line(cx + i * r * 0.22, cy - r * 0.75, cx + i * r * 0.3, cy - r * 0.2, '#d8cbb0');
    p.ell(cx, cy - r * 0.78, r * 0.2, r * 0.12, '#efe6d2');
    p.px(Math.round(cx - r * 0.35), Math.round(cy + 2), '#1e1418'); p.px(Math.round(cx + r * 0.35), Math.round(cy + 2), '#1e1418'); p.hl(Math.round(cx - 2), Math.round(cx + 2), Math.round(cy + 5), '#c8302c');
    p.poly([[cx - r * 0.5, cy - r * 0.9], [cx - r * 0.5, cy - r * 1.4], [cx - r * 0.25, cy - r * 1.1], [cx, cy - r * 1.5], [cx + r * 0.25, cy - r * 1.1], [cx + r * 0.5, cy - r * 1.4], [cx + r * 0.5, cy - r * 0.9]], '#e8302c');
    p.rect(0, 1, W, 11, '#c8302c'); small(p, 'DUMPLING', W / 2, 3, '#fff2c0', { align: 'center' });
    p.rect(0, 12, W, 9, '#1e1418'); small(p, 'DYNASTY', W / 2, 13, '#f0d860', { align: 'center' });
    small(p, 'WORLD TOUR', W / 2, H - 15, '#1e1418', { align: 'center', mini: true }); small(p, 'SF  LA  HK  TPE', W / 2, H - 8, '#c8302c', { align: 'center', mini: true });
    p.frame(0, 0, W, H, '#1e1418');
  },
  // "FOG CITY ROLLERS": a skull-free skate punk flyer — a roller skate with flames over a bridge silhouette
  posterRollers: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#e8e4d8');
    p.vgrad(3, 3, W - 6, H * 0.6, ['#2a5a8a', '#5a8ab0', '#a8c8d8']);
    const by = Math.round(H * 0.52); p.rect(3, by, W - 6, 3, '#c8402e');
    for (const tx of [W * 0.3, W * 0.7]) { p.rect(Math.round(tx) - 1, by - 22, 3, 22, '#c8402e'); p.rect(Math.round(tx) - 2, by - 22, 5, 2, '#c8402e'); }
    for (let x = 3; x < W - 3; x++) { const t = (x - W * 0.3) / (W * 0.4), y = by - 20 + Math.round(18 * (t < 0 || t > 1 ? Math.min(1, Math.abs(t < 0 ? t : t - 1) * 2) : 4 * (t - 0.5) * (t - 0.5))); if (y < by) p.px(x, y, '#c8402e'); }
    for (let i = 0; i < 6; i++) p.ell(8 + i * 9, by - 4 + (i % 2) * 2, 6, 3, '#f0f2f4');
    const sx = Math.round(W * 0.5), sy = Math.round(H * 0.72);
    p.rect(sx - 10, sy - 8, 14, 9, '#1e1e24'); p.rect(sx - 10, sy, 22, 4, '#1e1e24'); p.rect(sx + 4, sy - 2, 8, 3, '#1e1e24');
    for (const wx of [sx - 7, sx + 8]) { p.ell(wx, sy + 6, 3, 3, '#e8302c'); p.px(wx, sy + 6, '#f0d860'); }
    for (let i = 0; i < 5; i++) p.line(sx - 12, sy - 6 + i * 2, sx - 22 - i * 2, sy - 8 + i * 3, i % 2 ? '#ff8a2a' : '#ffd04a');
    small(p, 'FOG CITY', W / 2, H - 24, '#1e1e24', { align: 'center', scale: W > 70 ? 2 : 1 });
    small(p, 'ROLLERS', W / 2, H - 10, '#c8402e', { align: 'center' });
    p.frame(0, 0, W, H, '#8a8478');
  },
  // a Tokonmon fan poster: a round fire-chick critter bursting out of a capsule
  posterMon: () => (p, W, H) => {
    p.vgrad(0, 0, W, H, ['#2a8ad8', '#5ab8f0', '#c8ecff']);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; p.line(W / 2, H * 0.5, W / 2 + Math.cos(a) * W, H * 0.5 + Math.sin(a) * W, i % 2 ? '#ffffff' : '#8ad0ff'); }
    const cx = W / 2, cy = H * 0.52;
    p.ell(cx, cy + W * 0.22, W * 0.3, W * 0.12, '#e8302c'); p.ell(cx, cy + W * 0.26, W * 0.3, W * 0.08, '#f4f0e8'); p.hl(Math.round(cx - W * 0.3), Math.round(cx + W * 0.3), Math.round(cy + W * 0.24), '#1e1418');
    critter(p, cx, cy, W * 0.2, '#ff7a3a', { ears: 'tuft', beak: true });
    for (let i = 0; i < 3; i++) p.poly([[cx - 3 + i * 3, cy - W * 0.2], [cx - 2 + i * 3, cy - W * 0.32 - (i === 1 ? 4 : 0)], [cx + i * 3, cy - W * 0.2]], '#ffd040');
    p.rect(0, 2, W, 10, '#f0c030'); small(p, 'TOKONMON', W / 2, 4, '#1e2a5a', { align: 'center' });
    small(p, 'GOTTA BEFRIEND!', W / 2, H - 9, '#1e2a5a', { align: 'center', mini: true });
    p.frame(0, 0, W, H, '#f0c030');
  },
  // the bedroom door: a hand-made keep-out sign with stickers
  doorSign: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#f4ecd8'); p.frame(0, 0, W, H, '#c8a870');
    small(p, 'KEEP', W / 2, 3, '#c8302c', { align: 'center' }); small(p, 'OUT!', W / 2, 12, '#c8302c', { align: 'center' });
    p.ell(7, H - 7, 4, 4, '#3ab0e8'); p.ell(W - 8, H - 8, 4, 3, '#ffd040'); p.px(7, H - 7, '#ffffff'); p.px(W - 8, H - 8, '#c8302c');
    small(p, ':)', W / 2 - 3, H - 10, '#2e5a9c', { mini: true });
  },
  switchPlate: (on) => (p, W, H) => { p.rect(0, 0, W, H, '#ece6d8'); p.frame(0, 0, W, H, '#b8b0a0'); p.rect(Math.round(W / 2) - 2, on ? 3 : Math.round(H / 2), 4, Math.round(H / 2) - 3, '#d8d0c0'); p.frame(Math.round(W / 2) - 2, 3, 4, H - 6, '#9a9284'); },
  // a corkboard: photos, a ticket stub, a drawing, sticky notes, a schedule
  corkboard: () => (p, W, H) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.px(x, y, (x * 13 + y * 7) % 11 < 2 ? '#a07848' : (x + y * 3) % 7 === 0 ? '#c8a070' : '#b88c5c');
    p.frame(0, 0, W, H, '#6a4a2e'); p.frame(1, 1, W - 2, H - 2, '#8a6038');
    const pin = (x, y, c) => { p.px(x, y, c); p.px(x, y + 1, '#5a3a22'); };
    const photo = (x, y, w, h, sky, sub2) => { p.rect(x, y, w, h, '#f8f6f0'); p.vgrad(x + 1, y + 1, w - 2, h - 5, [sky, shift(sky, 0.5)]); sub2(x + 1, y + 1, w - 2, h - 5); pin(x + (w >> 1), y, '#e83a3a'); };
    photo(4, 4, 18, 16, '#5a8ad0', (x, y, w, h) => { critter(p, x + w / 2, y + h - 4, 4, '#ff8a3a', { ears: 'tuft', beak: true }); });
    photo(25, 6, 16, 15, '#f0a060', (x, y, w, h) => { p.rect(x, y + h - 4, w, 4, '#3a3a50'); p.rect(x + 3, y + 3, 3, h - 7, '#c8402e'); p.rect(x + 10, y + 3, 3, h - 7, '#c8402e'); p.hl(x, x + w, y + 5, '#c8402e'); });
    photo(44, 3, 18, 17, '#8ad0a0', (x, y, w, h) => { critter(p, x + 6, y + h - 5, 4, '#e8e0d0', { ears: 'bear' }); critter(p, x + 13, y + h - 5, 4, '#8a6a4a', { ears: 'tuft', beak: true }); });
    p.rect(6, 24, 14, 12, '#fff27a'); small(p, 'HW!', 8, 26, '#2e5a9c', { mini: true }); small(p, 'MATH', 8, 31, '#2e5a9c', { mini: true }); pin(13, 24, '#3a8ae8');
    p.rect(24, 25, 20, 9, '#f4e4c8'); p.frame(24, 25, 20, 9, '#c8302c'); small(p, 'ADMIT 1', 26, 27, '#c8302c', { mini: true }); pin(34, 25, '#3ac85a');
    p.rect(48, 23, 14, 13, '#ff9ac8'); small(p, 'SAT', 50, 25, '#5a1a4a', { mini: true }); small(p, 'GYM', 50, 30, '#5a1a4a', { mini: true }); pin(55, 23, '#ffd040');
    if (W > 66) { p.rect(65, 5, 14, 30, '#f8f6f0'); for (let i = 0; i < 6; i++) p.hl(67, 77, 9 + i * 4, '#a8b8d8'); small(p, 'TODO', 67, 6, '#c8302c', { mini: true }); pin(72, 5, '#e83a3a'); }
  },
  // manga / comic spines for a bookshelf front
  spines: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#3a2a1e');
    const rows = Math.max(1, Math.floor(H / 16));
    for (let r = 0; r < rows; r++) {
      const y0 = r * Math.floor(H / rows) + 1, hh = Math.floor(H / rows) - 3;
      p.rect(0, y0 + hh, W, 2, '#8a6a48');
      let x = 1, i = 0;
      while (x < W - 2) {
        const w = 3 + ((i * 7 + r * 3) % 3), hb = hh - ((i * 5 + r) % 4), c = ['#c8423a', '#2e5a9c', '#e8c040', '#f0ece4', '#3a8a5a', '#e86a3a', '#8a4ab4', '#2a2a30', '#e88aa8', '#4ab0c8'][(i * 3 + r * 7) % 10];
        if ((i + r) % 9 === 8) { x += 3; i++; continue; }
        p.rect(x, y0 + hh - hb, w, hb, c); p.vl(x, y0 + hh - hb, y0 + hh - 1, shift(c, 0.6)); p.vl(x + w - 1, y0 + hh - hb, y0 + hh - 1, shift(c, -0.8));
        p.hl(x, x + w - 1, y0 + hh - hb + 2, shift(c, c === '#f0ece4' ? -1.2 : 1.2)); p.px(x + 1, y0 + hh - 3, '#f8f4ec');
        x += w; i++;
      }
    }
  },
  // the laptop screen: a Tokonmon fan wiki page / chat with a sprite, lit at night
  laptopScreen: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#1a2238'); p.rect(0, 0, W, 3, '#3a4a7a'); p.px(1, 1, '#ff5a5a'); p.px(3, 1, '#ffd040'); p.px(5, 1, '#5ad05a');
    p.rect(2, 5, Math.round(W * 0.45), H - 7, '#24305a'); critter(p, 2 + W * 0.22, H * 0.55, Math.min(W, H) * 0.18, '#ff8a3a', { ears: 'tuft', beak: true });
    for (let i = 0; i < 4; i++) p.hl(Math.round(W * 0.52), W - 3 - (i % 2) * 4, 7 + i * 4, i === 0 ? '#ffd040' : '#8aa0d0');
  },
  alarmClock: () => (p, W, H) => { p.rect(0, 0, W, H, '#1a1416'); small(p, '6:58', W / 2, Math.floor((H - 5) / 2), '#ff3a2a', { align: 'center', mini: true }); },
  // the view from the bedroom window at night: rooftops, water tanks, neon signs, lanterns
  neonView: () => (p, W, H) => {
    p.vgrad(0, 0, W, H, ['#0a0e22', '#1a1e44', '#3a2a5a', '#6a3a6a']);
    for (let i = 0; i < 40; i++) { const x = (i * 37) % W, y = (i * 23) % Math.round(H * 0.35); p.px(x, y, i % 5 ? '#8a90c0' : '#ffffff'); }
    p.ell(W * 0.82, H * 0.14, 5, 5, '#f4f0d8'); p.ell(W * 0.82 + 2, H * 0.14 - 1, 4.5, 4.5, '#1a1e44');
    // far skyline: pyramid + tower silhouettes with lit windows
    p.poly([[W * 0.62, H * 0.62], [W * 0.66, H * 0.12], [W * 0.7, H * 0.62]], '#22264a'); p.px(Math.round(W * 0.66), Math.round(H * 0.12) - 1, '#ff3a3a');
    for (let i = 0; i < 9; i++) { const x = Math.round((i / 9) * W), w = 8 + ((i * 7) % 9), h = Math.round(H * (0.3 + ((i * 13) % 7) / 20)); p.rect(x, H - h, w, h, '#2a2e52'); for (let j = 0; j < 8; j++) p.px(x + 2 + ((j * 5) % (w - 3)), H - h + 3 + ((j * 7 + i) % (h - 6)), '#ffd890'); }
    // near rooftops with water tanks and a pagoda corner
    const ry = Math.round(H * 0.62);
    p.rect(0, ry, W, H - ry, '#1a1424');
    for (const tx of [W * 0.12, W * 0.48]) { p.rect(Math.round(tx), ry - 12, 9, 9, '#3a2e3a'); p.poly([[tx - 1, ry - 12], [tx + 4.5, ry - 16], [tx + 10, ry - 12]], '#2a2230'); p.vl(Math.round(tx) + 1, ry - 3, ry, '#2a2230'); p.vl(Math.round(tx) + 7, ry - 3, ry, '#2a2230'); }
    p.poly([[W * 0.26, ry], [W * 0.3, ry - 8], [W * 0.42, ry - 8], [W * 0.46, ry]], '#2a5a3a'); p.poly([[W * 0.24, ry - 7], [W * 0.36, ry - 13], [W * 0.48, ry - 7]], '#2f6a44');
    // neon: a pink vertical sign, a teal horizontal one, a red 酒家-style blade, a string of lanterns
    p.rect(Math.round(W * 0.06), Math.round(H * 0.3), 7, Math.round(H * 0.32), '#1a0a18'); p.frame(Math.round(W * 0.06), Math.round(H * 0.3), 7, Math.round(H * 0.32), '#ff4aa8');
    for (let j = 0; j < 4; j++) p.rect(Math.round(W * 0.06) + 2, Math.round(H * 0.33) + j * 6, 3, 4, j % 2 ? '#ff7ac0' : '#ffd0f0');
    p.rect(Math.round(W * 0.52), Math.round(H * 0.42), Math.round(W * 0.26), 8, '#0a1a1e'); p.frame(Math.round(W * 0.52), Math.round(H * 0.42), Math.round(W * 0.26), 8, '#3af0e0');
    small(p, 'KARAOKE', Math.round(W * 0.65), Math.round(H * 0.42) + 2, '#b0fff8', { align: 'center', mini: true });
    p.rect(Math.round(W * 0.88), Math.round(H * 0.35), 6, Math.round(H * 0.3), '#3a0a0a'); p.frame(Math.round(W * 0.88), Math.round(H * 0.35), 6, Math.round(H * 0.3), '#ff5a3a');
    for (let j = 0; j < 3; j++) p.rect(Math.round(W * 0.88) + 2, Math.round(H * 0.38) + j * 7, 2, 4, '#ffd060');
    for (let x = 4; x < W - 4; x += 7) { const y = Math.round(H * 0.22 + Math.sin((x / W) * Math.PI) * 6); p.ell(x, y + 3, 2.2, 2.6, '#ff4a2a'); p.px(x, y + 2, '#ffd47a'); p.px(x, y, '#3a1e1e'); }
    for (let x = 0; x < W; x++) p.px(x, Math.round(H * 0.22 + Math.sin((x / W) * Math.PI) * 6), '#3a1e1e');
  },
  // the kitchen window: a light-well alley with a fire escape and laundry (night)
  alleyView: () => (p, W, H) => {
    p.vgrad(0, 0, W, H, ['#141a34', '#202848', '#2a2a48']);
    p.rect(0, 0, Math.round(W * 0.3), H, '#2a2236'); p.rect(Math.round(W * 0.72), 0, W, H, '#30283e');
    for (let j = 0; j < 4; j++) for (const x0 of [3, Math.round(W * 0.76)]) { const lit = (j + x0) % 3 === 0; p.rect(x0, 4 + j * 12, 6, 7, lit ? '#ffcf7a' : '#1a1a2a'); }
    for (let y = 8; y < H; y += 14) { p.hl(Math.round(W * 0.3), Math.round(W * 0.72), y, '#4a4a58'); for (let x = Math.round(W * 0.3); x < W * 0.72; x += 3) p.vl(x, y - 5, y, '#3a3a48'); }
    for (let x = Math.round(W * 0.32); x < W * 0.7; x += 6) { const c = ['#e8e4dc', '#c84848', '#3a6ab0', '#f0c840'][(x >> 2) % 4]; p.rect(x, 18, 4, 6, c); }
    p.hl(Math.round(W * 0.3), Math.round(W * 0.72), 17, '#6a6a70');
    p.ell(W * 0.5, H - 6, 3, 2, '#1a1418'); p.px(Math.round(W * 0.5) - 2, H - 9, '#1a1418'); p.px(Math.round(W * 0.5) + 2, H - 9, '#1a1418'); p.px(Math.round(W * 0.5) - 1, H - 7, '#f0e060'); p.px(Math.round(W * 0.5) + 1, H - 7, '#f0e060');
  },
  // a wall calendar with Chinese characters: the month, a big red date, lunar notes, a horse
  calendar: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#f8f4ea'); p.rect(0, 0, W, Math.round(H * 0.42), '#c8302c');
    p.rect(Math.round(W / 2) - 1, 1, 3, 2, '#2a2a2a');
    fit(p, '十月', 2, 3, W - 4, Math.round(H * 0.16), '#ffe080', { font: 'serif' });
    // a galloping horse silhouette (year of the horse) in gold
    const hy = Math.round(H * 0.3), hx = Math.round(W / 2);
    p.ell(hx, hy, 7, 3, '#f0c040'); p.ell(hx + 7, hy - 3, 3, 2, '#f0c040'); p.line(hx + 5, hy - 2, hx + 8, hy - 5, '#f0c040');
    for (const [a, b] of [[-5, -8], [-3, -1], [3, 6], [5, 8]]) p.line(hx + a, hy + 2, hx + b, hy + 6, '#f0c040');
    p.line(hx - 7, hy - 1, hx - 10, hy + 3, '#f0c040');
    fit(p, '丙午年', 2, Math.round(H * 0.44), W - 4, Math.round(H * 0.1), '#c8302c', { font: 'pixel' });
    const gy = Math.round(H * 0.56), cw = (W - 4) / 7;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) { const n = r * 7 + c - 2; if (n < 1 || n > 31) continue; const x = Math.round(2 + c * cw), y = gy + r * Math.round((H - gy - 3) / 5); small(p, String(n), x, y, c === 0 || n === 18 ? '#c8302c' : '#3a3a3a', { mini: true }); if (n === 18) p.frame(x - 1, y - 1, n > 9 ? 9 : 5, 7, '#c8302c'); }
  },
  // a tear-off day calendar: big red date, lunar date, good/bad omens
  dayCalendar: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#fbf6ea'); p.rect(0, 0, W, 5, '#c8302c'); small(p, 'OCT', W / 2, 0, '#ffe080', { align: 'center', mini: true });
    small(p, '18', W / 2, 8, '#c8302c', { align: 'center', scale: 2 });
    fit(p, '初七', 2, 24, W - 4, 8, '#3a3a3a', { font: 'pixel' });
    fit(p, '宜出行', 1, 34, W - 2, 7, '#2e7a4a', { font: 'pixel' }); fit(p, '忌動土', 1, 42, W - 2, 7, '#3a3a3a', { font: 'pixel' });
  },
  // the fridge door: magnets, a child's drawing, a takeout menu, a photo, a shopping list
  fridgeFront: () => (p, W, H) => {
    const mag = (x, y, c, sh = 'round') => { if (sh === 'round') { p.ell(x, y, 2.5, 2.5, c); p.px(x - 1, y - 1, shift(c, 0.8)); } else { p.rect(x - 2, y - 2, 5, 4, c); p.hl(x - 2, x + 2, y - 2, shift(c, 0.8)); } };
    p.rect(3, 6, 20, 16, '#ffffff'); p.frame(3, 6, 20, 16, '#e0e0e0');
    critter(p, 9, 15, 4, '#8a6a4a', { ears: 'tuft', beak: true }); critter(p, 17, 17, 3, '#efe6d8', { ears: 'bear' });
    p.line(4, 21, 22, 21, '#3ab03a'); p.ell(20, 9, 2, 2, '#ffd040'); mag(13, 6, '#e8302c');
    p.rect(26, 4, 13, 22, '#f8e8c8'); fit(p, '雲吞', 27, 5, 11, 7, '#c8302c', { font: 'pixel' }); for (let i = 0; i < 6; i++) p.hl(28, 37, 14 + i * 2, '#a89878'); mag(32, 4, '#3a8ae8', 'sq');
    p.rect(5, 26, 14, 11, '#f8f8f4'); p.vgrad(6, 27, 12, 7, ['#8ac8f0', '#f0e0a0']); critter(p, 12, 32, 2.5, '#c8945a', { ears: 'bear' }); mag(12, 26, '#3ac85a');
    p.rect(23, 30, 15, 18, '#fffbe0'); small(p, 'EGGS', 25, 32, '#2e5a9c', { mini: true }); small(p, 'BOKCHOY', 25, 38, '#2e5a9c', { mini: true }); small(p, 'RICE', 25, 44, '#2e5a9c', { mini: true }); mag(30, 30, '#ffd040');
    for (const [x, y, c] of [[8, 42, '#e8302c'], [14, 46, '#f08a2a'], [6, 50, '#3a8ae8'], [32, 54, '#e86aa8'], [20, 56, '#3ac85a']]) mag(x, y, c);
    p.rect(9, 54, 9, 7, '#c8302c'); fit(p, '福', 10, 55, 7, 6, '#ffe080', { font: 'serif' });
  },
  // dry-goods shelf fronts: a rice sack, snack boxes, tea tins, soy sauce, chili jars, noodle packs
  pantry: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#5a4430');
    const rows = 3, rh = Math.floor(H / rows);
    for (let r = 0; r < rows; r++) {
      const y1 = (r + 1) * rh - 2; p.rect(0, y1, W, 2, '#8a6a48');
      let x = 2, i = r * 3;
      while (x < W - 4) {
        const kind = ['tin', 'box', 'bottle', 'jar', 'bag', 'tin', 'box'][i % 7];
        if (kind === 'tin') { const c = ['#c8302c', '#2e7a4a', '#2e5a9c', '#e8b830'][i % 4]; p.rect(x, y1 - 12, 9, 12, c); p.rect(x, y1 - 13, 9, 1, '#d8b440'); p.rect(x + 1, y1 - 9, 7, 5, '#f4ecd8'); fit(p, ['茶', '普洱', '龍井', '菊花'][i % 4], x + 1, y1 - 9, 7, 5, c, { font: 'pixel' }); p.vl(x, y1 - 12, y1 - 1, shift(c, 0.6)); x += 11; }
        else if (kind === 'box') { const c = ['#f0d040', '#e86a2a', '#e8e4dc', '#3a8ac8'][i % 4]; p.rect(x, y1 - 15, 11, 15, c); p.vl(x, y1 - 15, y1 - 1, shift(c, 0.5)); critter(p, x + 5, y1 - 7, 3, ['#ff7a5a', '#f6efe2', '#c8945a', '#ffb0c0'][i % 4], { ears: ['tuft', 'bear', 'cat', 'bear'][i % 4] }); p.rect(x + 1, y1 - 14, 9, 3, '#c8302c'); x += 13; }
        else if (kind === 'bottle') { p.rect(x + 1, y1 - 16, 3, 4, '#3a2a1a'); p.rect(x, y1 - 12, 5, 12, '#2a1a10'); p.rect(x, y1 - 9, 5, 5, '#f4e8c8'); p.px(x + 2, y1 - 7, '#c8302c'); p.vl(x + 1, y1 - 11, y1 - 2, '#5a3a24'); x += 7; }
        else if (kind === 'jar') { p.rect(x, y1 - 8, 7, 8, '#c84a1e'); p.rect(x, y1 - 9, 7, 2, '#e8c040'); p.rect(x + 1, y1 - 6, 5, 3, '#f8f0e0'); p.px(x + 3, y1 - 5, '#c8302c'); p.vl(x + 1, y1 - 8, y1 - 1, '#e87a4a'); x += 9; }
        else { p.rect(x, y1 - 14, 12, 14, '#f4f0e6'); p.poly([[x, y1 - 14], [x + 3, y1 - 17], [x + 9, y1 - 17], [x + 12, y1 - 14]], '#e8e4da'); p.rect(x + 1, y1 - 10, 10, 6, '#c8302c'); fit(p, ['白米', '蝦片', '拉麵'][i % 3], x + 1, y1 - 10, 10, 6, '#fff2c0', { font: 'pixel' }); x += 14; }
        i++;
      }
    }
    glare(p, W, H, 2, 0.06);
  },
  // label on the front of a noodle cup: a red band, a steaming bowl, a tiny critter chef
  noodleLabel: (col = '#e8402e', kind = 0) => (p, W, H) => {
    p.rect(0, 0, W, H, '#f8f4ea'); p.rect(0, 0, W, Math.round(H * 0.28), col);
    small(p, kind % 2 ? 'SPICY' : 'BEEF', W / 2, 1, '#fff2c0', { align: 'center', mini: true });
    p.ell(W / 2, H * 0.62, W * 0.32, H * 0.16, '#d8a050'); p.ell(W / 2, H * 0.56, W * 0.3, H * 0.1, '#f0d070'); p.hl(Math.round(W * 0.3), Math.round(W * 0.7), Math.round(H * 0.56), '#c8302c');
    critter(p, W * 0.78, H * 0.4, Math.max(2, W * 0.12), kind % 2 ? '#ff8a5a' : '#c8945a', { ears: kind % 2 ? 'cat' : 'bear', blush: false });
    fit(p, '麵', 1, Math.round(H * 0.3), Math.round(W * 0.4), Math.round(H * 0.3), col, { font: 'pixel' });
  },
  riceCookerLabel: () => (p, W, H) => { p.rect(0, 0, W, H, '#f4f0e6'); p.ell(W / 2, H / 2, W * 0.3, H * 0.3, '#e88aa0'); p.px(Math.round(W / 2), Math.round(H / 2), '#ff6a3a'); },
  // ancestor board for the altar: red with gold characters
  altarBoard: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#8e1a1c'); p.frame(1, 1, W - 2, H - 2, '#e8b83a'); p.frame(3, 3, W - 6, H - 6, '#c8962c');
    fit(p, '祖先', 4, 4, Math.round(W * 0.4), H - 8, '#f6d060', { vertical: true, outline: '#4a0a0c', font: 'serif' });
    p.rect(Math.round(W * 0.5), 5, Math.round(W * 0.42), H - 10, '#f4ecd8'); p.frame(Math.round(W * 0.5), 5, Math.round(W * 0.42), H - 10, '#e8b83a');
    const px = Math.round(W * 0.5) + 2, pw = Math.round(W * 0.42) - 4; p.vgrad(px, 7, pw, H - 14, ['#d8c8a8', '#b8a888']);
    critter(p, px + pw / 2, H * 0.55, Math.min(pw, H) * 0.28, '#d8cdb8', { ears: 'tuft', beak: true, blush: false });
  },
  envelopes: () => (p, W, H) => {
    for (let i = 0; i < 5; i++) { const x = 1 + i * Math.floor((W - 2) / 5), y = (i % 2) * 3 + 1, w = Math.floor((W - 2) / 5) - 1; p.rect(x, y, w, H - 5, '#d8202a'); p.frame(x, y, w, H - 5, '#a01418'); p.ell(x + w / 2, y + 4, 1.6, 1.6, '#f0c040'); fit(p, i % 2 ? '大吉' : '利是', x, y + 7, w, H - 13, '#f6d060', { vertical: true, font: 'pixel' }); }
  },
  newspaper: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#ece6d6'); fit(p, '華埠晨報', 2, 1, W - 4, Math.round(H * 0.24), '#2a2a2a', { font: 'serif' });
    p.hl(2, W - 3, Math.round(H * 0.27), '#2a2a2a');
    p.rect(3, Math.round(H * 0.32), Math.round(W * 0.4), Math.round(H * 0.34), '#a8a090'); critter(p, 3 + W * 0.2, H * 0.5, Math.min(W, H) * 0.12, '#8a8478', { ears: 'bear', blush: false });
    for (let i = 0; i < 8; i++) p.hl(Math.round(W * 0.48), W - 3, Math.round(H * 0.33) + i * 3, '#8a8478');
    for (let i = 0; i < 4; i++) p.hl(3, W - 3, Math.round(H * 0.72) + i * 3, '#8a8478');
  },
  photoFrame: (who = 0) => (p, W, H) => {
    p.rect(0, 0, W, H, '#5a3a22'); p.frame(1, 1, W - 2, H - 2, '#c8962c'); p.vgrad(2, 2, W - 4, H - 4, who ? ['#c8d8e8', '#e8e0c8'] : ['#e8d0a8', '#c8a880']);
    if (who === 0) { critter(p, W * 0.35, H * 0.6, Math.min(W, H) * 0.18, '#8a6a4a', { ears: 'tuft', beak: true }); critter(p, W * 0.66, H * 0.64, Math.min(W, H) * 0.16, '#e8dccc', { ears: 'bear' }); }
    else { critter(p, W * 0.5, H * 0.58, Math.min(W, H) * 0.24, '#c8945a', { ears: 'bear' }); }
  },
  clockFace: () => (p, W, H) => { const cx = (W - 1) / 2, cy = (H - 1) / 2, r = Math.min(W, H) / 2 - 0.5; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - cx, y - cy); if (d <= r) p.px(x, y, d > r - 1.5 ? '#5a3a22' : '#f8f2e4'); } for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.px(Math.round(cx + Math.cos(a) * (r - 3)), Math.round(cy + Math.sin(a) * (r - 3)), '#3a2a1a'); } p.line(cx, cy, cx + r * 0.5, cy - r * 0.2, '#1e1418'); p.line(cx, cy, cx - r * 0.1, cy - r * 0.7, '#1e1418'); p.px(Math.round(cx), Math.round(cy), '#c8302c'); },
  mirror: () => (p, W, H) => { p.rect(0, 0, W, H, '#c8a060'); p.vgrad(2, 2, W - 4, H - 4, ['#a8c0d4', '#d8e4ec', '#90a8bc']); for (let i = 0; i < 3; i++) p.line(4 + i * 3, H - 5, W - 6 + i * 3 - 6, 5, '#f4f8fc'); p.frame(0, 0, W, H, '#8a6a30'); },
  photoStrip: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#f4f0e8');
    for (let i = 0; i < 3; i++) { const y = 2 + i * Math.floor((H - 2) / 3), h = Math.floor((H - 2) / 3) - 2; p.vgrad(2, y, W - 4, h, ['#ffb0c8', '#ffe0a0']); critter(p, W / 2, y + h * 0.6, Math.min(W, h) * 0.24, ['#ff8a3a', '#8a6a4a', '#e8dccc'][i], { ears: ['tuft', 'tuft', 'bear'][i], beak: i < 2 }); }
    p.rect(W - 8, H - 12, 7, 7, '#3ab0e8'); p.px(W - 5, H - 9, '#ffffff');
  },
  // a patchwork quilt (top) — squares of florals and checks
  quilt: (base = '#c8423a') => (p, W, H) => {
    const sq = 8, cols = [base, '#f0e6d0', '#e8b040', '#3a6a9a', shift(base, -0.6), '#5a9a6a'];
    for (let j = 0; j < Math.ceil(H / sq); j++) for (let i = 0; i < Math.ceil(W / sq); i++) {
      const c = cols[(i * 2 + j * 3) % cols.length], x0 = i * sq, y0 = j * sq;
      p.rect(x0, y0, sq, sq, c);
      const kind = (i + j * 2) % 3;
      if (kind === 0) for (let y = 0; y < sq; y += 2) for (let x = (y >> 1) % 2; x < sq; x += 2) p.px(x0 + x, y0 + y, shift(c, -0.5));
      else if (kind === 1) { p.ell(x0 + 4, y0 + 4, 2, 2, c === '#f0e6d0' ? '#c8423a' : '#f8f0e0'); p.px(x0 + 4, y0 + 4, '#e8b040'); }
      else for (let x = 0; x < sq; x++) p.px(x0 + x, y0 + ((x + 2) % sq), shift(c, 0.5));
      p.hl(x0, x0 + sq - 1, y0, shift(c, -0.9)); p.vl(x0, y0, y0 + sq - 1, shift(c, -0.9));
    }
    for (let k = 1; k < 5; k++) { const y = Math.round(k * H / 5); for (let x = 0; x < W; x += 2) p.px(x, y + Math.round(Math.sin(x * 0.15 + k) * 1.5), '#f8f0e0'); }
  },
  // a round woven rug / an oriental rug
  rug: (o = {}) => (p, W, H) => {
    const a = o.a || '#a8302c', b = o.b || '#2e4a7a', c = o.c || '#e8d8b0', cx = (W - 1) / 2, cy = (H - 1) / 2;
    if (o.round) { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot((x - cx) / (W / 2), (y - cy) / (H / 2)); if (d > 1) continue; const ring = Math.floor(d * 7); p.px(x, y, ring % 3 === 0 ? a : ring % 3 === 1 ? c : b); if ((x + y) % 5 === 0 && d < 0.95) p.px(x, y, shift(a, 0.3)); } return; }
    p.rect(0, 0, W, H, a); p.frame(2, 2, W - 4, H - 4, c); p.frame(4, 4, W - 8, H - 8, b); p.frame(5, 5, W - 10, H - 10, b); p.frame(7, 7, W - 14, H - 14, c);
    for (let x = 8; x < W - 8; x += 6) { p.px(x, 3, b); p.px(x, H - 4, b); }
    for (let y = 9; y < H - 9; y++) for (let x = 9; x < W - 9; x++) { const u = Math.abs(x - cx) / (W / 2 - 9), w2 = Math.abs(y - cy) / (H / 2 - 9); if (u + w2 < 0.5) p.px(x, y, (x + y) % 4 === 0 ? c : b); else if (u + w2 < 0.56) p.px(x, y, c); else if ((x * 3 + y * 5) % 23 === 0) p.px(x, y, c); }
    for (let x = 0; x < W; x += 2) { p.px(x, 0, c); p.px(x, H - 1, c); }
  },
  // the grocery shop sign on the plinth
  shopSign: () => CP.board({ cjk: '福星雜貨', en: 'LUCKY STAR GROCERY', bg: '#2a5a3e', bg2: '#30664a', text: '#f6d466', frame: '#e8b83a' }),
  upsideFu: () => (p, W, H) => { const cx = (W - 1) / 2, cy = (H - 1) / 2, r = Math.min(W, H) / 2 - 0.5; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = (Math.abs(x - cx) + Math.abs(y - cy)) / r; if (d <= 1) p.px(x, y, d > 0.86 ? '#e8b83a' : '#c8242c'); } const S = newSurf(W, H), q = new Pen(S); fit(q, '福', W * 0.22, H * 0.22, W * 0.56, H * 0.56, '#1e1414', { font: 'serif' }); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = S.data[(H - 1 - y) * W + x]; if (c >>> 24) p.s.data[y * W + x] = c; } p.s.touch(); },
  // a cereal-box / snack-box face for a voxel box
  snackBox: (c = '#f0d040', kind = 0) => (p, W, H) => { p.rect(0, 0, W, H, c); p.rect(0, 0, W, Math.round(H * 0.25), '#c8302c'); small(p, ['YUM', 'POP', 'MMM'][kind % 3], W / 2, 1, '#fff2c0', { align: 'center', mini: true }); critter(p, W / 2, H * 0.62, Math.min(W, H) * 0.24, ['#ff7a5a', '#f6efe2', '#c8945a'][kind % 3], { ears: ['tuft', 'bear', 'cat'][kind % 3] }); },
  stickers: () => (p, W, H) => {
    const st = [[0.25, 0.15, '#3ab0e8', 'r'], [0.7, 0.22, '#ffd040', 's'], [0.4, 0.45, '#ff5a8a', 'h'], [0.75, 0.6, '#5ad05a', 'r'], [0.3, 0.75, '#ff8a2a', 's'], [0.65, 0.88, '#b88aff', 'h']];
    for (const [u, w, c, kind] of st) { const x = Math.round(u * W), y = Math.round(w * H); if (kind === 'r') { p.ell(x, y, 4, 4, '#ffffff'); p.ell(x, y, 3, 3, c); p.px(x, y, '#ffffff'); } else if (kind === 's') { p.poly([[x, y - 5], [x + 2, y - 1], [x + 5, y - 1], [x + 2, y + 1], [x + 3, y + 5], [x, y + 2], [x - 3, y + 5], [x - 2, y + 1], [x - 5, y - 1], [x - 2, y - 1]], c); } else { p.ell(x - 2, y - 1, 2.5, 2.5, c); p.ell(x + 2, y - 1, 2.5, 2.5, c); p.poly([[x - 4, y], [x + 4, y], [x, y + 5]], c); } }
    critter(p, W * 0.5, H * 0.3, Math.min(W, H) * 0.12, '#e8503a', { ears: 'none' });
  },
  riceSack: () => (p, W, H) => { p.rect(0, 0, W, H, '#f2eee4'); p.rect(0, Math.round(H * 0.18), W, Math.round(H * 0.5), '#c8302c'); fit(p, '白米', 1, Math.round(H * 0.2), W - 2, Math.round(H * 0.44), '#fff2c0', { font: 'serif' }); p.ell(W / 2, H * 0.84, W * 0.2, H * 0.1, '#e8c040'); for (let x = 0; x < W; x += 3) p.px(x, H - 1, '#c8c0b0'); },
  teaTin: (c = '#2e7a4a', txt = '普洱') => (p, W, H) => { p.rect(0, 0, W, H, c); p.hl(0, W - 1, 1, '#e8c040'); p.hl(0, W - 1, H - 2, '#e8c040'); p.rect(2, 4, W - 4, H - 8, '#f4ecd8'); fit(p, txt, 2, 4, W - 4, H - 8, c, { font: 'serif' }); },
  // ---------------------------------------------------------- dojo
  scroll: (txt, o = {}) => (p, W, H) => {
    p.rect(0, 0, W, H, o.mount || '#3a5a4a'); p.rect(0, 0, W, 3, '#5a3a22'); p.rect(0, H - 3, W, 3, '#5a3a22'); p.px(0, 1, '#d8b440'); p.px(W - 1, 1, '#d8b440');
    const m = Math.max(2, Math.round(W * 0.14)); p.rect(m, 5, W - m * 2, H - 10, '#f2ead6');
    for (let i = 0; i < 30; i++) p.px(m + ((i * 7) % (W - m * 2)), 6 + ((i * 13) % (H - 12)), '#e6dcc2');
    fit(p, txt, m + 1, 7, W - m * 2 - 2, H - 16 - (o.seal === false ? 0 : 5), '#1e1a1a', { vertical: [...txt].length > 1, font: 'serif' });
    if (o.seal !== false) { p.rect(W - m - 5, H - 13, 4, 4, '#c8302c'); p.px(W - m - 4, H - 12, '#f2ead6'); }
  },
  banner: (txt, col = '#c8302c', ink = '#f6d060') => (p, W, H) => {
    p.rect(0, 0, W, H - 4, col); for (let x = 0; x < W; x++) { const t = Math.abs(x - W / 2) / (W / 2); for (let y = H - 4; y < H - Math.round(t * 4); y++) p.px(x, y, col); }
    p.frame(1, 1, W - 2, H - 6, ink); for (let y = 3; y < H - 6; y += 4) { p.px(0, y, shift(col, -0.8)); p.px(W - 1, y, shift(col, -0.8)); }
    fit(p, txt, 3, 3, W - 6, H - 10, ink, { vertical: [...txt].length > 1, font: 'serif', outline: shift(col, -1.2) });
  },
  // notice board for the dojo: the Tokonmon League sign-up, class schedule, kids' drawings, a lost cat, a photo
  dojoBoard: () => (p, W, H) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.px(x, y, (x * 13 + y * 7) % 11 < 2 ? '#a07848' : (x + y * 3) % 7 === 0 ? '#c8a070' : '#b88c5c');
    p.frame(0, 0, W, H, '#4a2e1c'); p.frame(1, 1, W - 2, H - 2, '#6a4428');
    const pin = (x, y, c = '#d83a3a') => { p.px(x, y, c); p.px(x, y + 1, '#5a3a22'); };
    // the League poster (big, centre-left)
    const lw = Math.round(W * 0.36), lh = H - 10;
    sub(p, lw, lh, 4, 5, (q, w, h) => P2.leaguePoster()(q, w, h)); pin(4 + lw / 2, 5);
    let x = 8 + lw;
    // class schedule
    const sw = Math.round(W * 0.26), sh = Math.round(H * 0.6);
    p.rect(x, 6, sw, sh, '#f8f4ea'); p.frame(x, 6, sw, sh, '#2a2a2a'); fit(p, '課程表', x + 2, 7, sw - 4, 9, '#c8302c', { font: 'pixel' });
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    days.forEach((d, i) => { const yy = 19 + i * Math.floor((sh - 16) / 6); small(p, d, x + 2, yy, '#2a2a2a', { mini: true }); p.rect(x + 16, yy, sw - 19, 4, ['#c8e0f0', '#f0d8a8', '#d8f0c8', '#f0c8d0', '#c8e0f0', '#f0e0a0'][i]); small(p, ['KUNGFU', 'LION', 'KIDS', 'TOKON', 'SPAR', 'ALL'][i], x + 17, yy, '#3a3a3a', { mini: true }); });
    pin(x + sw / 2, 6, '#3a8ae8');
    // kids' drawing of a crab
    const dy = 10 + sh;
    p.rect(x, dy, sw, H - dy - 5, '#ffffff'); critter(p, x + sw / 2, dy + (H - dy - 5) / 2 + 1, Math.min(sw, H - dy) * 0.22, '#e8503a', { ears: 'none', mouth: '#1e1418' });
    for (const s of [-1, 1]) { p.line(x + sw / 2 + s * 6, dy + 6, x + sw / 2 + s * 10, dy + 3, '#e8503a'); p.ell(x + sw / 2 + s * 11, dy + 3, 2, 2, '#e8503a'); }
    pin(x + sw / 2, dy, '#3ac85a');
    x += sw + 4;
    // a lost-cat flyer with tear-off tabs, a photo of the coach with a trophy, a sticky note
    const fw = W - x - 4;
    if (fw > 12) {
      p.rect(x, 5, fw, Math.round(H * 0.46), '#f0e070'); small(p, 'LOST', x + fw / 2, 7, '#2a2a2a', { align: 'center', mini: true }); small(p, 'CAT', x + fw / 2, 13, '#2a2a2a', { align: 'center', mini: true });
      critter(p, x + fw / 2, 5 + H * 0.3, Math.min(fw, 20) * 0.22, '#3a3a3a', { ears: 'cat', blush: false, mouth: '#e88aa0' });
      for (let t = 0; t < Math.floor(fw / 4); t++) p.vl(x + 1 + t * 4, 5 + Math.round(H * 0.46) - 6, 5 + Math.round(H * 0.46) - 1, '#d8c860');
      pin(x + fw / 2, 5);
      const py = Math.round(H * 0.56); p.rect(x, py, fw, H - py - 5, '#f8f6f0'); p.vgrad(x + 1, py + 1, fw - 2, H - py - 10, ['#f0b060', '#c8803a']);
      critter(p, x + fw * 0.35, H - 12, 4, '#e8c0a0', { ears: 'none', blush: false }); p.rect(x + fw * 0.62, H - 16, 4, 6, '#f0c040'); p.rect(x + fw * 0.62 - 1, H - 17, 6, 2, '#f0c040');
      pin(x + fw / 2, py, '#ffd040');
    }
  },
  // TOKONMON LEAGUE — SIGN UP: a crab-claw crest, VS lightning, a sign-up sheet with names
  leaguePoster: () => (p, W, H) => {
    p.vgrad(0, 0, W, H, ['#14204a', '#1e3a7a', '#2a1a4a']);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; p.line(W / 2, H * 0.38, W / 2 + Math.cos(a) * W, H * 0.38 + Math.sin(a) * W, i % 2 ? '#2a4a9a' : '#1e3a7a'); }
    const cx = W / 2, cy = H * 0.36, r = W * 0.2;
    p.ell(cx, cy, r, r * 1.1, '#f0c040'); p.ell(cx, cy, r - 2, r * 1.1 - 2, '#c8302c');
    for (const s of [-1, 1]) { p.ell(cx + s * r * 0.45, cy - r * 0.2, r * 0.32, r * 0.42, '#f6efe2'); p.px(Math.round(cx + s * r * 0.45), Math.round(cy - r * 0.62), '#14204a'); p.px(Math.round(cx + s * r * 0.45), Math.round(cy - r * 0.62) + 1, '#14204a'); }
    p.rect(0, 2, W, 9, '#f0c040'); small(p, 'TOKONMON', cx, 3, '#14204a', { align: 'center', mini: W < 60 });
    p.rect(0, 11, W, 7, '#c8302c'); small(p, 'LEAGUE', cx, 12, '#fff2c0', { align: 'center', mini: true });
    const sy = Math.round(H * 0.58);
    p.rect(3, sy, W - 6, H - sy - 3, '#f8f4ea'); small(p, 'SIGN UP', cx, sy + 2, '#c8302c', { align: 'center', mini: true }); fit(p, '報名', 3, sy + 8, W - 6, 7, '#2a2a2a', { font: 'pixel' });
    for (let i = 0; i < 5; i++) { const yy = sy + 17 + i * 4; if (yy > H - 6) break; p.hl(6, W - 7, yy + 3, '#a8a090'); if (i < 3) p.hl(7, 7 + 6 + ((i * 5) % 9), yy + 1, ['#2e5a9c', '#c8302c', '#2e7a4a'][i]); }
    p.frame(0, 0, W, H, '#f0c040');
  },
  // the CRT's screen: the Tokonmon phone app being set up
  crtScreen: () => (p, W, H) => {
    p.rect(0, 0, W, H, '#10241a'); for (let y = 0; y < H; y += 2) p.hl(0, W - 1, y, '#143020');
    p.rect(2, 2, W - 4, 5, '#2a6a3a'); small(p, 'TOKONMON', W / 2, 2, '#c8ffd0', { align: 'center', mini: true });
    p.rect(Math.round(W * 0.35), 9, Math.round(W * 0.3), H - 12, '#1e1e24'); p.rect(Math.round(W * 0.35) + 1, 10, Math.round(W * 0.3) - 2, H - 15, '#3a8ae8'); critter(p, W / 2, H * 0.55, Math.min(W, H) * 0.12, '#e8503a', { ears: 'none', blush: false });
    for (let i = 0; i < 3; i++) p.hl(3, Math.round(W * 0.3), 11 + i * 4, '#6ac87a');
    for (let i = 0; i < 3; i++) p.hl(Math.round(W * 0.7), W - 4, 11 + i * 4, '#6ac87a');
  },
  // drumhead: a painted swirl and a crab claw
  drumHead: () => (p, W, H) => {
    const cx = (W - 1) / 2, cy = (H - 1) / 2, r = Math.min(W, H) / 2 - 0.5;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - cx, y - cy); if (d > r) continue; p.px(x, y, d > r - 1.5 ? '#c8962c' : '#efe2c0'); }
    for (let t = 0; t < 60; t++) { const a = t * 0.2, rr = 1 + t * (r - 4) / 60; p.px(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr), t % 2 ? '#c8302c' : '#a8282a'); }
  },
  nameBoard: () => CP.plaque({ cjk: '金鉗武館', bg: '#1a1c22' }),
  // a lion-dance costume tail hung on the wall: rows of fur scales in red and gold, white fringe
  lionCloth: (main = '#d8302c', trim = '#f0c040') => (p, W, H) => {
    p.rect(0, 0, W, H, main);
    for (let y = 0; y < H - 4; y += 4) for (let x = ((y / 4) & 1) * 3; x < W; x += 6) { p.ell(x + 3, y + 3, 3, 2.5, shift(main, 0.3)); p.hl(x + 1, x + 5, y + 5, trim); }
    for (let x = 0; x < W; x++) for (let y = H - 4; y < H; y++) if ((x + y) % 2 === 0) p.px(x, y, '#f8f4ec');
    p.hl(0, W - 1, H - 5, trim);
  },
  photoTeam: () => (p, W, H) => { p.rect(0, 0, W, H, '#3a2a1e'); p.frame(1, 1, W - 2, H - 2, '#d8b040'); p.vgrad(3, 3, W - 6, H - 6, ['#8ac0e8', '#e8d8b8']); for (let i = 0; i < 4; i++) critter(p, 8 + i * ((W - 14) / 3), H * 0.62, Math.min(W, H) * 0.12, ['#e8c0a0', '#e8503a', '#c8945a', '#ff8a3a'][i], { ears: ['none', 'none', 'bear', 'tuft'][i] }); p.rect(W / 2 - 3, H * 0.62 + 4, 6, 4, '#f0c040'); },
  powerStrip: () => (p, W, H) => { p.rect(0, 0, W, H, '#f0ece4'); for (let i = 0; i < 3; i++) p.rect(2 + i * 5, 2, 3, H - 4, '#2a2a2a'); p.px(W - 3, 2, '#ff3a2a'); },
  couplet: (txt) => CP.couplet({ cjk: txt }),
  teaTray: () => (p, W, H) => { p.rect(0, 0, W, H, '#5a3a22'); p.frame(0, 0, W, H, '#3a2414'); for (let x = 2; x < W - 2; x += 3) p.vl(x, 2, H - 3, '#4a2e1a'); },
  matTop: (col = '#2e5a9c') => (p, W, H) => { p.rect(0, 0, W, H, col); p.frame(0, 0, W, H, shift(col, -0.8)); for (let i = 0; i < 3; i++) p.frame(2 + i * 3, 2 + i * 3, W - 4 - i * 6, H - 4 - i * 6, shift(col, i % 2 ? 0.3 : -0.3)); },
  // the battle ring painted on the courtyard stones
  ringPaint: (o = {}) => (p, W, H) => {
    const cx = (W - 1) / 2, cy = (H - 1) / 2, R = Math.min(W, H) / 2 - 1, wide = Math.max(2, Math.round(R * 0.035));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (Math.abs(d - R + wide) < wide) p.px(x, y, '#f2ead6');
      else if (Math.abs(d - R + wide * 4) < wide * 0.6) p.px(x, y, '#c8302c');
      else if (Math.abs(d - R * 0.22) < wide * 0.6) p.px(x, y, '#f2ead6');
    }
    // start lines on the x axis and a crab-claw emblem in the middle
    for (const s of [-1, 1]) for (let y = Math.round(cy - R * 0.14); y <= Math.round(cy + R * 0.14); y++) for (let w = 0; w < wide; w++) p.px(Math.round(cx + s * R * 0.55) + w, y, '#f2ead6');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - cx, y - cy); if (d < R * 0.2) { const a = Math.atan2(y - cy, x - cx); if (Math.abs(Math.sin(a * 1.5)) > 0.5 && d > R * 0.06) p.px(x, y, '#c8302c'); } }
  },
};
