// The density pass: after the districts and the dressing pass (dress.js), every street gets lived in — without
// touching a district's layout, the paths, the doors, the interactables, the spots or the NPCs.
//  - Storefronts: produce stands, florists' buckets, clothes rails, café sets under square umbrellas, A-boards and
//    plants either side of shop doors, by district.
//  - Empty lots and open plazas: a vignette each (a little market of food stalls, a pocket garden, a café terrace).
//  - Landmarks: a square fountain in Chinatown's square and in the park, Tokonmon statues on the wharf and downtown,
//    a food-stall market on the promenade.
//  - Murals on blank walls (pixel-painted: creatures, patterns and lettering, never people).
//  - Laundry strung across the alleys; roof gardens, chairs and strings of lights on flat roofs.
//  - Ground: weeds in the cracks along wall bases, planter strips where the pavement is deep.
//  - Banners on poles down the avenues, in each district's colours (they sway in the wind).
//  - Bare rooms in enterable buildings get furniture against their walls (bookcases, sideboards, palms, boxes).
//  - Steam sources (food stalls, street vents) for the atmosphere layer (render/atmos.js).
// Every prop is a voxel sculpt (fill_props.js) that build.js bakes into its tiled static meshes; murals and laundry
// are geometry in the merged groups: the pass adds triangles, not draw calls.
import * as TX from './pixtex.js';
import { PROPS } from './voxprops.js';
import { roofOccupancy } from './dress.js';
import './fill_props.js';

const rng = (seed) => { let x = (seed >>> 0) || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };
const district = (x, z) => (z < 20 ? 'wharf' : z >= 110 && x < 104 ? 'home' : z >= 110 && x >= 116 ? 'downtown' : z < 98 && z >= 32 && x >= 116 ? 'chinatown' : z < 98 && z >= 32 ? 'park' : 'avenue');

export function fill(C, R) {
  const nav = C.nav, r = rng(20261031), stats = { store: 0, lots: 0, landmarks: 0, murals: 0, laundry: 0, roofs: 0, ground: 0, banners: 0, rooms: 0 };
  const steam = [];
  // ---- spatial checks (as dress.js): keep clear of interactables, spots, NPCs and doors; one thing per footprint
  const keep = [];
  for (const it of C.inter) keep.push([it.x, it.z, 1.8, it.L || 0]);
  for (const k in C.spots) keep.push([C.spots[k][0], C.spots[k][1], 1.6, 0]);
  for (const n of C.npcs || []) keep.push([n.x, n.z, 1.8, n.L || 0]);
  for (const D of C.doors) keep.push([D.x, D.z, 2.0, D.L || 0]);
  for (const [x, z] of R.doors) keep.push([x, z, 1.5, 0]);
  const PG = new Map(), pk = (x, z) => Math.floor(x / 2) + ',' + Math.floor(z / 2);
  const addP = (x, z, rr) => { const k = pk(x, z); if (!PG.has(k)) PG.set(k, []); PG.get(k).push([x, z, rr]); };
  for (const p of C.props) addP(p.x, p.z, 0.5);
  const nearProp = (x, z, d) => { for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (const [px, pz, pr] of PG.get((Math.floor(x / 2) + i) + ',' + (Math.floor(z / 2) + j)) || []) if (Math.hypot(px - x, pz - z) < d + pr) return true; return false; };
  const nearKeep = (x, z, extra = 0, L = 0) => keep.some(([kx, kz, kr, kl]) => kl === L && Math.hypot(kx - x, kz - z) < kr + extra);
  const onCrossing = (x, z, m = 1) => R.crossings.some(([x0, z0, x1, z1]) => x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m);
  const inStreet = (x, z, m = 0) => R.streets.some(([a, b, c, d]) => x > a - m && x < c + m && z > b - m && z < d + m);
  /** a w × d footprint (+ margin m) open, level and free at level L (inside building bid when given) */
  const free = (x, z, w, d, o = {}) => {
    const m = o.m ?? 0.2, L = o.L || 0, h0 = nav.ground(x, z, L);
    if (x - w / 2 - m < 1 || z - d / 2 - m < 1 || x + w / 2 + m > C.w - 1 || z + d / 2 + m > C.d - 1) return false;
    let ok = true;
    nav.each(x - w / 2 - m, z - d / 2 - m, x + w / 2 + m, z + d / 2 + m, (c) => { if (!nav.walk[L][c] || nav.stair[L][c] || Math.abs(nav.h[L][c] - h0) > 0.04 || nav.bid[L][c] !== (o.bid ?? -1)) ok = false; });
    if (!ok) return false;
    if (nearKeep(x, z, o.keep ?? 0, L) || (o.pd !== 0 && nearProp(x, z, o.pd ?? 0.9)) || onCrossing(x, z) || (!o.street && inStreet(x, z, 0.3))) return false;
    return true;
  };
  /** the nearest free spot to (px, pz) within rad (a square spiral of 0.5 m steps) */
  const find = (px, pz, w, d, o = {}, rad = 10) => { for (let s = 0; s <= rad; s += 0.5) for (let i = -s; i <= s; i += 0.5) for (const [x, z] of [[px + i, pz - s], [px + i, pz + s], [px - s, pz + i], [px + s, pz + i]]) if (free(x, z, w, d, o)) return [x, z]; return null; };
  const prop = (kind, x, z, o = {}) => { if (!PROPS[kind]) return; C.prop(kind, x, z, o); addP(x, z, o.pr ?? 0.6); };

  // ---------------------------------------------------------------- storefronts
  const SHOP = {
    chinatown: [['fl_produce', 0.35], ['fl_flowers', 0.2], ['fl_rack', 0.15], ['boxes', 0.15], ['pot', 0.15]],
    downtown: [['fl_cafe', 0.3], ['fl_flowers', 0.15], ['sandwich', 0.2], ['fl_planter', 0.15], ['pot', 0.2]],
    home: [['pot', 0.4], ['fl_planter', 0.25], ['dt_bike', 0.2], ['fl_chair', 0.15]],
    wharf: [['fl_produce', 0.3], ['fl_cafe', 0.3], ['crate', 0.2], ['pot', 0.2]],
    park: [['pot', 0.6], ['fl_planter', 0.4]],
    avenue: [['fl_flowers', 0.25], ['sandwich', 0.25], ['pot', 0.3], ['fl_rack', 0.2]],
  };
  const pickW = (S) => { let t = r() * S.reduce((a, s) => a + s[1], 0); for (const s of S) { t -= s[1]; if (t <= 0) return s[0]; } return S[0][0]; };
  const SIZE = (kind) => { const P = PROPS[kind]; if (!P) return [0.6, 0.6]; const s = P.size, v = P.vpm || 16; return [s[0] / v, s[2] / v]; };
  const fronts = R.doors.map(([x, z, face]) => [x, z, face]);
  for (const D of C.doors) if (D.building !== undefined && (D.L || 0) === 0) { const B = C.buildings[D.building]; if (!B) continue; const face = D.axis === 'x' ? (Math.abs(D.z - (B.z + B.d)) < 0.5 ? 's' : 'n') : (Math.abs(D.x - (B.x + B.w)) < 0.5 ? 'e' : 'w'); fronts.push([D.x, D.z, face]); }
  for (const [x, z, face] of fronts) {
    const nx = face === 'e' ? 1 : face === 'w' ? -1 : 0, nz = face === 's' ? 1 : face === 'n' ? -1 : 0, tx = -nz, tz = nx;
    const set = SHOP[district(x, z)] || SHOP.avenue;
    let n = 0;
    for (const side of r() < 0.5 ? [1, -1] : [-1, 1]) for (const along of [2.0, 3.4]) {
      if (n >= 2) break;
      const kind = pickW(set), [w, d] = SIZE(kind), out = d / 2 + 0.15, px = x + nx * out + tx * side * along, pz = z + nz * out + tz * side * along;
      const yaw = Math.atan2(nx, nz), fw = Math.abs(nx) > 0.5 ? d : w, fd = Math.abs(nx) > 0.5 ? w : d;
      if (!free(px, pz, fw, fd, { m: 0.1, pd: 0.5, keep: -0.2 })) continue;
      // the pavement in front must stay open (a 1.4 m lane past the stand)
      if (!nav.ok(px + nx * (out + 1.0), pz + nz * (out + 1.0), 0)) continue;
      prop(kind, px, pz, { yaw, pr: Math.max(w, d) / 2 }); n++; stats.store++;
    }
  }
  // ---------------------------------------------------------------- landmarks (each at the nearest free spot to its square)
  const LAND = [
    ['fl_fountain', 175, 70, 6], ['fl_fountain', 70, 44, 8], ['fl_statue', 108, 15.5, 6], ['fl_statue', 150, 136, 6], ['fl_statue', 26, 96, 6],
    ['fl_stall', 62, 16.5, 6], ['fl_stall', 70, 16.5, 8], ['fl_stall', 184, 16.6, 6], ['fl_stall', 196, 88, 6], ['fl_stall', 200, 82, 8],
  ];
  for (const [kind, px, pz, rad] of LAND) {
    const [w, d] = SIZE(kind), at = find(px, pz, w, d, { m: 1.4, pd: 1.4, keep: 0.6 }, rad); if (!at) continue;
    const yaw = kind === 'fl_stall' ? (pz < 20 ? Math.PI : 0) : 0;
    prop(kind, at[0], at[1], { yaw, pr: Math.max(w, d) / 2 + 0.6 }); stats.landmarks++;
    if (kind === 'fl_stall') { steam.push([at[0], 1.6, at[1]]); const c = find(at[0] + 3, at[1], 1.6, 0.9, { m: 0.2, pd: 0.4 }, 2); if (c) prop('fl_produce', c[0], c[1], { yaw, pr: 0.9 }); }
    if (kind === 'fl_fountain' || kind === 'fl_statue') for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const off = Math.max(w, d) / 2 + 1.6, b = find(at[0] + dx * off, at[1] + dz * off, 1.8, 0.7, { m: 0.2, pd: 0.6 }, 1.5); if (b && r() < 0.7) prop(r() < 0.6 ? 'bench' : 'fl_planter', b[0], b[1], { yaw: Math.atan2(-dx, -dz), pr: 1 }); }
  }
  // ---------------------------------------------------------------- empty lots and open plazas: a vignette each
  const placed = [];
  const VIG = {
    chinatown: [['fl_stall', 'fl_produce', 'fl_flowers'], ['fl_produce', 'boxes', 'fl_rack']],
    downtown: [['fl_cafe', 'fl_cafe', 'fl_planter'], ['fl_planter', 'bench', 'fl_flowers']],
    home: [['fl_planter', 'bench', 'pot'], ['fl_planter', 'fl_planter', 'dt_bike']],
    wharf: [['fl_stall', 'fl_cafe', 'crate'], ['fl_cafe', 'fl_cafe', 'pot']],
    park: [['fl_planter', 'fl_planter', 'bench'], ['fl_flowers', 'fl_planter', 'pot']],
    avenue: [['fl_planter', 'pot']],
  };
  for (let z = 4; z < C.d - 4; z += 2) for (let x = 4; x < C.w - 4; x += 2) {
    if (stats.lots >= 34) break;
    if (placed.some(([px, pz]) => Math.hypot(px - x, pz - z) < 16)) continue;
    if (!free(x, z, 6.5, 6.5, { m: 0, pd: 2.4, keep: 1.2 })) continue;
    const dist = district(x, z), sets = VIG[dist] || VIG.avenue, set = sets[Math.floor(r() * sets.length)];
    placed.push([x, z]); stats.lots++;
    const slots = [[-1.6, -1.2], [1.6, -1.2], [0, 1.6]];
    set.forEach((kind, i) => { const [w, d] = SIZE(kind), [ox, oz] = slots[i % 3], at = find(x + ox, z + oz, w, d, { m: 0.25, pd: 0.4 }, 1.5); if (at) { prop(kind, at[0], at[1], { yaw: Math.floor(r() * 4) * Math.PI / 2, pr: Math.max(w, d) / 2 }); if (kind === 'fl_stall') steam.push([at[0], 1.6, at[1]]); } });
  }
  // ---------------------------------------------------------------- murals on blank walls
  const sides = (B) => ({ s: [B.x, B.z + B.d, B.x + B.w, B.z + B.d, 0, 1], n: [B.x + B.w, B.z, B.x, B.z, 0, -1], e: [B.x + B.w, B.z + B.d, B.x + B.w, B.z, 1, 0], w: [B.x, B.z, B.x, B.z + B.d, -1, 0] });
  for (const B of C.buildings) {
    if (!B.o || B.o.x === undefined || !B.gk) continue;
    const H = B.H || B.floors * (B.fh || 3); if (H < 4) continue;
    for (const [sd, [ax, az, bx, bz, nx, nz]] of Object.entries(sides(B))) {
      const L = Math.hypot(bx - ax, bz - az); if (L < 5.5) continue;
      if (R.windows.some((w) => w.B === B && w.sd === sd) || sideDecorated(C, B, sd, H)) continue;
      const cx = (ax + bx) / 2, cz = (az + bz) / 2;
      if (R.doors.some(([x, z]) => Math.hypot(x - cx, z - cz) < L / 2 + 0.5 && Math.abs((x - cx) * nx + (z - cz) * nz) < 0.3)) continue;
      if (!nav.ok(cx + nx * 1.2, cz + nz * 1.2, 0) || nav.buildingAt(cx + nx * 1.2, cz + nz * 1.2, 0) >= 0) continue;
      const w = Math.min(L - 1.2, 9), h = Math.min(H - 1.2, 5.5), v = Math.floor(r() * MURALS);
      const gk = B.gk(0, sd === 's' || sd === 'e' ? 'front' : 'back');
      C.decal(gk, muralTex(v, Math.round(w), Math.round(h)), cx, 0.55, cz, sd, w, h, { off: 0.025 });
      stats.murals++;
    }
  }
  // ---------------------------------------------------------------- laundry across the alleys (gaps of 1.2–5 m between buildings)
  const CLOTH = ['#e8e4dc', '#c83a3a', '#2a4a8a', '#f0c040', '#3a6a4a', '#e888aa', '#f4f0f4', '#6a3a6a', '#d8a070'];
  const line = (a, b, y, sag) => {
    const n = 6, pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push([a[0] + (b[0] - a[0]) * t, y - Math.sin(t * Math.PI) * sag, a[1] + (b[1] - a[1]) * t]); }
    const wire = TX.solid('#2a2a2e');
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[i + 1]; C.box('props', wire, Math.min(p[0], q[0]) - 0.012, Math.min(p[1], q[1]) - 0.012, Math.min(p[2], q[2]) - 0.012, Math.max(p[0], q[0]) + 0.012, Math.max(p[1], q[1]) + 0.012, Math.max(p[2], q[2]) + 0.012); }
    const along = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]);
    for (let t = 0.12; t < 0.9; t += 0.12 + r() * 0.1) {
      if (r() < 0.2) continue;
      const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, yy = y - Math.sin(t * Math.PI) * sag, cw = 0.25 + r() * 0.3, ch = 0.35 + r() * 0.45, c = TX.solid(CLOTH[Math.floor(r() * CLOTH.length)]);
      if (along) C.box('props', c, x - cw / 2, yy - ch, z - 0.015, x + cw / 2, yy, z + 0.015); else C.box('props', c, x - 0.015, yy - ch, z - cw / 2, x + 0.015, yy, z + cw / 2);
    }
    stats.laundry++;
  };
  for (const A of C.buildings) for (const B of C.buildings) {
    if (A === B || !A.o || !B.o || A.o.x === undefined || B.o.x === undefined) continue;
    const HA = A.H || A.floors * (A.fh || 3), HB = B.H || B.floors * (B.fh || 3), top = Math.min(HA, HB); if (top < 5.5) continue;
    const gx = B.x - (A.x + A.w), gz = B.z - (A.z + A.d);
    if (gx >= 1.2 && gx <= 5) { const z0 = Math.max(A.z, B.z) + 0.8, z1 = Math.min(A.z + A.d, B.z + B.d) - 0.8; for (let z = z0; z < z1; z += 3.2 + r() * 2) if (r() < 0.65) line([A.x + A.w, z], [B.x, z + (r() - 0.5) * 0.6], 3.6 + Math.floor(r() * Math.max(1, (top - 4) / 3)) * 3 + r() * 0.4, 0.25); }
    if (gz >= 1.2 && gz <= 5) { const x0 = Math.max(A.x, B.x) + 0.8, x1 = Math.min(A.x + A.w, B.x + B.w) - 0.8; for (let x = x0; x < x1; x += 3.2 + r() * 2) if (r() < 0.65) line([x, A.z + A.d], [x + (r() - 0.5) * 0.6, B.z], 3.6 + Math.floor(r() * Math.max(1, (top - 4) / 3)) * 3 + r() * 0.4, 0.25); }
  }
  // ---------------------------------------------------------------- rooftops: gardens, chairs, strings of lights
  for (const B of C.buildings) {
    if (!B.o || B.o.x === undefined || B.w < 6 || B.d < 6) continue;
    const roof = B.o.roof || { type: 'flat' }; if (roof.type && roof.type !== 'flat') continue;
    const H = B.H || B.floors * (B.fh || 3); if (H < 3 || H > 26 || r() < 0.35) continue;
    const occ = roofOccupancy(C, B, H), sb = C.solidBatches && C.solidBatches.get(`b${B.id}:roof`);
    if (sb) for (let i = 0; i < sb.P.length; i += 3) if (sb.P[i + 1] > H + 0.12) occ.add(Math.floor(sb.P[i] - B.x) + ',' + Math.floor(sb.P[i + 2] - B.z));
    const freeR = (x0, z0, x1, z1) => { for (let i = Math.floor(x0 - B.x); i <= Math.floor(x1 - B.x); i++) for (let k = Math.floor(z0 - B.z); k <= Math.floor(z1 - B.z); k++) if (i < 1 || k < 1 || i >= Math.floor(B.w) - 1 || k >= Math.floor(B.d) - 1 || occ.has(i + ',' + k)) return false; return true; };
    const take = (x0, z0, x1, z1) => { for (let i = Math.floor(x0 - B.x); i <= Math.floor(x1 - B.x); i++) for (let k = Math.floor(z0 - B.z); k <= Math.floor(z1 - B.z); k++) occ.add(i + ',' + k); };
    let did = false;
    for (let t = 0; t < 12 && !did; t++) {
      const x = B.x + 2 + r() * (B.w - 4), z = B.z + 2 + r() * (B.d - 4);
      if (!freeR(x - 1.5, z - 1.1, x + 1.5, z + 1.1)) continue;
      take(x - 1.5, z - 1.1, x + 1.5, z + 1.1); C.props.push({ kind: 'fl_roofgarden', x, y: H + 0.05, z, yaw: 0, s: 1 }); did = true;
      for (const dx of [-2.2, 2.2]) if (freeR(x + dx - 0.3, z - 0.3, x + dx + 0.3, z + 0.3)) { take(x + dx - 0.3, z - 0.3, x + dx + 0.3, z + 0.3); C.props.push({ kind: 'fl_chair', x: x + dx, y: H + 0.05, z: z + 1.6, yaw: Math.PI, s: 1 }); }
    }
    if (did) {
      // a string of lights corner to corner, sagging, a bulb every 0.7 m
      const a = [B.x + 0.4, B.z + 0.4], b = [B.x + B.w - 0.4, B.z + B.d - 0.4], y0 = H + 2.4, L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L / 0.7);
      for (let i = 1; i < n; i++) { const t = i / n; C.props.push({ kind: 'fl_bulb', x: a[0] + (b[0] - a[0]) * t, y: y0 - Math.sin(t * Math.PI) * 0.6 - 0.18, z: a[1] + (b[1] - a[1]) * t, yaw: 0, s: 1, nolight: i % 3 !== 0 }); }
      const wire = TX.solid('#2a2a2e'); for (let i = 0; i < 8; i++) { const t0 = i / 8, t1 = (i + 1) / 8, p = [a[0] + (b[0] - a[0]) * t0, y0 - Math.sin(t0 * Math.PI) * 0.6, a[1] + (b[1] - a[1]) * t0], q = [a[0] + (b[0] - a[0]) * t1, y0 - Math.sin(t1 * Math.PI) * 0.6, a[1] + (b[1] - a[1]) * t1]; C.box(`b${B.id}:roof`, wire, Math.min(p[0], q[0]) - 0.01, Math.min(p[1], q[1]) - 0.01, Math.min(p[2], q[2]) - 0.01, Math.max(p[0], q[0]) + 0.01, Math.max(p[1], q[1]) + 0.01, Math.max(p[2], q[2]) + 0.01); }
      for (const [px, pz] of [a, b]) C.box(`b${B.id}:roof`, TX.solid('#4a4a50'), px - 0.04, H, pz - 0.04, px + 0.04, y0 + 0.1, pz + 0.04);
      stats.roofs++;
    }
  }
  // ---------------------------------------------------------------- ground: weeds along wall bases, planter strips on deep pavements
  for (const B of C.buildings) {
    if (!B.o || B.o.x === undefined) continue;
    for (const [ax, az, bx, bz, nx, nz] of Object.values(sides(B))) {
      const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
      for (let s = 0.6 + r() * 2; s < L - 0.6; s += 2.2 + r() * 3.5) {
        const x = ax + ux * s + nx * 0.22, z = az + uz * s + nz * 0.22;
        if (!nav.ok(x, z, 0) || nav.buildingAt(x, z, 0) >= 0 || inStreet(x, z) || nearKeep(x, z, -0.6) || nearProp(x, z, 0.3)) continue;
        C.prop('fl_weeds', x, z, { collide: false, yaw: r() * 6.28, s: 0.7 + r() * 0.5 }); stats.ground++;
      }
      // a planter strip against the wall where the pavement is deep enough to keep a 2 m lane
      if (L > 6 && r() < 0.35) {
        const s = L * (0.25 + r() * 0.5), x = ax + ux * s + nx * 0.5, z = az + uz * s + nz * 0.5, yaw = Math.atan2(nx, nz), [w, d] = SIZE('fl_planter');
        const fw = Math.abs(nx) > 0.5 ? d : w, fd = Math.abs(nx) > 0.5 ? w : d;
        if (free(x, z, fw, fd, { m: 0.1, pd: 0.6, keep: 0 }) && nav.ok(x + nx * 2.4, z + nz * 2.4, 0) && !inStreet(x + nx * 2.4, z + nz * 2.4)) { prop('fl_planter', x, z, { yaw, pr: 1.3 }); stats.ground++; }
      }
    }
  }
  // ---------------------------------------------------------------- banners down the avenues (by the lamps)
  const BAN = { chinatown: 'fl_bannerR', downtown: 'fl_bannerB', wharf: 'fl_bannerG', home: 'fl_bannerP', park: 'fl_bannerG', avenue: 'fl_bannerB' };
  for (let x = 9.5; x < C.w; x += 28) for (const [z, dz] of [[20.6, 22], [31.4, 30], [98.6, 97], [109.4, 112]]) {
    const at = find(x, z, 0.3, 0.3, { m: 0.05, pd: 0.8, keep: 0 }, 1.5); if (!at) continue;
    prop(BAN[district(at[0], dz)], at[0], at[1], { yaw: z < 26 || (z > 98 && z < 104) ? Math.PI : 0, pr: 0.3 }); stats.banners++;
  }
  // ---------------------------------------------------------------- bare rooms: furniture against the walls
  const ROOM = ['fl_bookcase', 'fl_sideboard', 'fl_palmIn', 'fl_boxes', 'fl_bookcase', 'fl_palmIn'];
  for (const B of C.buildings) {
    if (!B.enter) continue;
    for (let k = 0; k < B.floors; k++) {
      let tot = 0, blocked = 0; nav.each(B.x + 0.3, B.z + 0.3, B.x + B.w - 0.3, B.z + B.d - 0.3, (c) => { if (nav.bid[k][c] !== B.id) return; tot++; if (!nav.walk[k][c]) blocked++; });
      if (!tot || blocked / tot > 0.24) continue;
      let n = 0;
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (let z = B.z + 0.8; z < B.z + B.d - 0.6 && n < 5; z += 0.5) for (let x = B.x + 0.8; x < B.x + B.w - 0.6 && n < 5; x += 0.5) {
        for (const [nx, nz] of dirs) {
          if (n >= 5) break;
          const kind = ROOM[(n + k + B.id) % ROOM.length], [w, d] = SIZE(kind), back = d / 2 + 0.3;
          const bxp = x - nx * back, bzp = z - nz * back; if (nav.ok(bxp, bzp, k) && nav.buildingAt(bxp, bzp, k) === B.id) continue;   // its back to a wall
          const fw = Math.abs(nx) > 0.5 ? d : w, fd = Math.abs(nx) > 0.5 ? w : d;
          if (!free(x, z, fw, fd, { L: k, bid: B.id, m: 0.08, pd: 1.6, keep: 0.2, street: true })) continue;
          if (!free(x + nx * (d / 2 + 0.75), z + nz * (d / 2 + 0.75), Math.max(fw, 0.9), 1.0, { L: k, bid: B.id, m: 0, pd: 0, keep: -1, street: true })) continue;   // walking room in front
          prop(kind, x, z, { L: k, yaw: Math.atan2(nx, nz), pr: 1.2 }); n++; stats.rooms++;
        }
      }
    }
  }
  // ---------------------------------------------------------------- steam from street vents (avenue kerbs) for the atmosphere
  for (const [x0, z0, x1, z1, dir] of R.streets) { const L = dir === 'x' ? x1 - x0 : z1 - z0; if (L < 30) continue; for (let s = 10 + r() * 20; s < L - 5; s += 40 + r() * 30) steam.push(dir === 'x' ? [x0 + s, 0.05, z0 + (z1 - z0) * (0.3 + r() * 0.4)] : [x0 + (x1 - x0) * (0.3 + r() * 0.4), 0.05, z0 + s]); }
  C.atmos = { steam };
  return stats;
}

/** does anything other than the plain wall (painted windows, signs, lobbies, doors, shop glass) already hang on this
 *  side of the building? (districts paint their own windows with decals, not only through windowAt) */
function sideDecorated(C, B, sd, H) {
  const wallKey = B.o.wall && B.o.wall.userData && B.o.wall.userData.key, plane = { s: [2, B.z + B.d, 1], n: [2, B.z, -1], e: [0, B.x + B.w, 1], w: [0, B.x, -1] }[sd];
  if (!wallKey || !/^(plaster|brick|concrete|siding)/.test(wallKey)) return true;
  for (let k = 0; k < B.floors; k++) for (const part of ['front', 'back']) {
    const G = C.groups.get(B.gk(k, part)); if (!G) continue;
    for (const A of G.values()) {
      const key = A.tex.userData.key || ''; if (key === wallKey || /^solid/.test(key)) continue;
      for (let i = 0; i < A.N.length; i += 3) { const n = A.N[i + plane[0]]; if (Math.abs(n - plane[2]) < 0.1 && Math.abs(A.P[i + plane[0]] - plane[1]) < 0.08 && A.P[i + 1] < H) return true; }
    }
  }
  return false;
}
// ---------------------------------------------------------------- murals (pixel painted; creatures, patterns and lettering only)
const MURALS = 6;
const PALS = [['#2a3a6a', '#e86a4a', '#f4c050', '#4ab0a0', '#f4ece0'], ['#1e5a4a', '#f08a3a', '#f4e070', '#e85a8a', '#f8f0e0'], ['#5a2a5a', '#4ac0e0', '#f4d040', '#e85050', '#fff4e8'], ['#c84a3a', '#2a3a5a', '#f0c060', '#58b070', '#f6eee0'], ['#2a2a3a', '#f05a8a', '#5ad0c0', '#f8e060', '#f4f4f4'], ['#3a6a9a', '#f4a040', '#f8e8c0', '#c84a5a', '#2a2a3a']];
const WORDS = ['TOKON', 'SF BAY', 'GO WILD', 'BAY CITY', 'HELLO', 'DRIP'];
function muralTex(v, w, h) {
  return TX.ptex('mural' + v + '_' + w + 'x' + h, w, h, (g, W, H, r, P) => {
    const [bg, a, b, c, lt] = PALS[v % PALS.length];
    // background: banded sky / stripes / checks, dithered at the seams
    for (let y = 0; y < H; y++) { const t = y / H, band = Math.floor(t * 5); P.rect(0, y, W, 1, band % 2 ? TX.light(bg, 0.08 + band * 0.04) : TX.dark(bg, 0.06 - band * 0.02)); }
    if (v % 3 === 1) for (let x = -H; x < W; x += 24) for (let y = 0; y < H; y++) P.rect(x + y, y, 8, 1, TX.dark(bg, 0.12));
    if (v % 3 === 2) for (let y = 0; y < H; y += 16) for (let x = (y / 16) % 2 ? 0 : 16; x < W; x += 32) P.rect(x, y, 16, 16, TX.light(bg, 0.06));
    // a sun of squares and a few stars (squares, never circles)
    for (let i = 0; i < 4; i++) { const s = 30 - i * 7, cx = W * 0.8, cy = H * 0.28; P.rect(cx - s / 2, cy - s / 2, s, s, i % 2 ? b : TX.light(b, 0.2)); }
    for (let i = 0; i < 18; i++) { const x = r() * W, y = r() * H * 0.5; P.rect(x, y, 2, 2, lt); P.rect(x - 2, y, 6, 1, lt); P.rect(x, y - 2, 1, 6, lt); }
    // the creature: a chunky round-eared Tokonmon in blocks (body, head, ears, eyes, cheeks, tail), outlined
    const k = Math.min(W / 120, H / 80), ox = W * 0.28, oy = H * 0.94;
    const blk = (x, y, ww, hh, col) => { P.rect(ox + (x - 1) * k, oy - (y + hh + 1) * k, (ww + 2) * k, (hh + 2) * k, '#1a1418'); };
    const fil = (x, y, ww, hh, col) => P.rect(ox + x * k, oy - (y + hh) * k, ww * k, hh * k, col);
    const parts = [[-22, 0, 44, 30], [-26, 26, 52, 36], [-24, 60, 10, 14], [14, 60, 10, 14], [20, 6, 22, 8], [-8, -4, 8, 6], [4, -4, 8, 6]];
    for (const p of parts) blk(...p);
    fil(-22, 0, 44, 30, a); fil(-26, 26, 52, 36, a); fil(-24, 60, 10, 14, a); fil(14, 60, 10, 14, a); fil(20, 6, 22, 8, TX.dark(a, 0.15)); fil(-8, -4, 8, 6, TX.dark(a, 0.3)); fil(4, -4, 8, 6, TX.dark(a, 0.3));
    fil(-22, 6, 44, 8, TX.light(a, 0.18)); fil(-26, 50, 52, 6, TX.light(a, 0.2)); fil(-21, 64, 4, 6, c); fil(17, 64, 4, 6, c);
    fil(-14, 36, 8, 10, '#1a1418'); fil(6, 36, 8, 10, '#1a1418'); fil(-12, 42, 3, 3, lt); fil(8, 42, 3, 3, lt);
    fil(-22, 32, 8, 4, TX.light(c, 0.3)); fil(14, 32, 8, 4, TX.light(c, 0.3)); fil(-4, 30, 8, 3, '#1a1418');
    // a second, smaller creature (a bird-ish Tokonmon) and the lettering
    const k2 = k * 0.55, o2x = W * 0.62, o2y = H * 0.9;
    for (const [x, y, ww, hh, col] of [[-12, 0, 24, 18, c], [-8, 16, 16, 14, c], [6, 22, 8, 4, b], [-16, 6, 6, 10, TX.dark(c, 0.2)], [10, 6, 6, 10, TX.dark(c, 0.2)]]) { P.rect(o2x + (x - 1) * k2, o2y - (y + hh + 1) * k2, (ww + 2) * k2, (hh + 2) * k2, '#1a1418'); P.rect(o2x + x * k2, o2y - (y + hh) * k2, ww * k2, hh * k2, col); }
    P.rect(o2x - 2 * k2, o2y - 26 * k2, 3 * k2, 3 * k2, '#1a1418');
    P.text(WORDS[v % WORDS.length], W * 0.62, H * 0.2, Math.max(10, Math.min(28, H * 0.22)), lt, { outline: '#1a1418', shadow: TX.dark(bg, 0.4) });
    // a painted border and weathering: chips, drips, a tag-free wall (no people)
    P.rect(0, 0, W, 2, '#1a1418'); P.rect(0, H - 2, W, 2, '#1a1418'); P.rect(0, 0, 2, H, '#1a1418'); P.rect(W - 2, 0, 2, H, '#1a1418');
    for (let i = 0; i < 12; i++) { const x = r() * W, y = r() * H * 0.6, L = 4 + r() * 10; P.rect(x, y, 1, L, TX.dark(bg, 0.2)); }
    P.speck(W * H * 0.004, TX.light(bg, 0.25), r); P.speck(W * H * 0.003, '#a8a49a', r);
  });
}
