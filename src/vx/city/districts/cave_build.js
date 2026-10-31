// THE DEEP CAVE under Alamo Hill — the layout and the build (scenes/cave.js calls buildCave, then post()).
// Its own 128 × 104 m map, walked with the city engine (CityBuilder quads + nav grid + interactables):
//
//   x: 0 ───────────────────────────────────────────────────────────────────────── 128
//   z 10   ┌ MIRROR LAKE (big cavern, x 30–66) ┐ gate ═ THE CHASM ═ ledge + bridge ═╗
//          │   lake, island crystal, shafts     │       (x 72–102)                   ║ OLD MINE No. 3
//   z 35   └ sun crystal · mirror crystals ─────┘                                    ║ timbered drift, rails,
//    WHISPER PASSAGE                                                                  ║ cart, lanterns ─ camp
//   z 56  GLOWCAP GROVE (giant mushrooms) ·· crack → hidden grotto                    ║
//   z 66      └─ DRIPPING TUNNEL ─┐                                      barricade ══╝
//   z 79                 ENTRANCE HALL ── (collapsed passage) ── THE GEODE (boss)
//   z 100                 └ the mouth (daylight)
//
// Floors, walls and roofs are generated from a distance field (cave_geo.js); everything that moves or
// changes (the cart, the barricade, the crystal gate, the mirror crystals, ore nodes, the rubble, the
// strongbox) is its own small mesh, handed to the gameplay (src/vx/game/cave.js) through `dyn`.
import * as THREE from '../../../../vendor/three.module.js';
import * as K from './cave_tex.js';
import { CaveField, contours, wallLoop, Emit, dripstone, crystal, crystalCluster, mushroom, boulder, obox, Piece, lightShaft, motes, mistPlane, noise2, rng, clamp, sstep } from './cave_geo.js';
import { surfaceMaterial, relief } from '../../render/surface.js';

export const W = 128, D = 104, WATER = -1.25, PIT_BOTTOM = -18;
const PI = Math.PI;
/** key places (x, z[, yaw]) shared with the gameplay */
export const SPOT = {
  start: [56, 95.2, PI], exit: [56, 98.6], hall: [54, 80], grove: [22.5, 56], grotto: [6.6, 42.6], chest: [5.4, 41.6],
  lake: [44, 31.5], island: [51, 20.2], sun: [58.2, 37.4], m1: [44.2, 35.4], m2: [62.2, 29.4], gate: [67.6, 24.85],
  ledgeIn: [72.5, 22.2], bridge: [[84.4, 15.15], [89.6, 15.25]], mineIn: [101.6, 20.9], cart: [109.35, 44.4], barricade: [101.75, 64.3],
  camp: [120.5, 43], journal: [121.6, 45.6], supply: [123.6, 41.4], geodeIn: [93, 74.2], geode: [85.5, 80.2], boss: [85.2, 80.6], rubble: [69.4, 82.3],
};
export const RAIL = [[105.6, 23.3], [108.4, 27.3], [109.35, 34], [109.35, 46], [108.05, 55], [104.4, 61.0], [101.9, 64.1]];
// the routes the player walks: big set dressing keeps clear of them
const ROUTES = [
  [[56, 99], [55.5, 88], [53, 81], [46.5, 80], [41, 83.5], [34.5, 81.5], [29, 76], [24.5, 67], [23, 58], [23, 47], [25.5, 40], [30, 34.5], [36, 32], [44, 33.6], [52, 34.4], [60, 32.5], [64, 27], [68.5, 24.5], [72.5, 22.5]],
  [[44.2, 35.4], [58.2, 37.4]], [[44.2, 35.4], [62.2, 29.4]], [[13.5, 53.5], [11, 51.5], [8.5, 48]], [[54, 79], [62, 80], [66.5, 81.5], [76.5, 81]], [[85.5, 80], [93, 74]],
];
const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1e-6, t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / L2, 0, 1); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
const polyD = (x, z, P) => { let d = 1e9; for (let i = 0; i < P.length - 1; i++) d = Math.min(d, segD(x, z, P[i], P[i + 1])); return d; };
const onRoute = (x, z, m) => ROUTES.some((R) => polyD(x, z, R) < m);
const yawAlong = (dx, dz) => Math.atan2(-dz, dx);       // obox local +x along (dx, dz)

// ==================================================================== the field
export function caveField() {
  const F = new CaveField({ k: 2.6, wob: 1.0 });
  // A. the mouth and the entrance hall
  F.tunnel([[56, 100.4, 0.3], [56.4, 93, 0.15], [55.4, 87, 0]], 4.4, { ceil: 4.6, floor: 'wet', wall: 'brown', wob: 0.3, id: 'mouth' });
  F.room(54, 79.5, 9, 7.5, { y: 0, ceil: 7.5, floor: 'wet', wall: 'brown', id: 'hall' });
  // B. the dripping tunnel, winding west and down
  F.tunnel([[46.5, 80, 0], [41, 83.5, -0.2], [34.5, 81.5, -0.45], [29, 76, -0.7], [25, 68.5, -0.9], [23.5, 63.5, -1.0]], 3.6, { ceil: 4.4, floor: 'wet', wall: 'brown', id: 'drip' });
  // C. Glowcap Grove, the crack behind the giant mushroom and the hidden grotto
  F.room(21, 56, 11.5, 10, { y: -1.0, ceil: 8.5, floor: 'moss', wall: 'moss', bump: 0.16, id: 'grove' });
  F.tunnel([[12, 52.2, -1.0], [9.2, 48.6, -1.05], [7.6, 45.4, -1.1]], 1.25, { ceil: 2.6, floor: 'moss', wall: 'moss', wob: 0.12, vault: 0.2, id: 'crack' });
  F.room(6.6, 42.4, 3.0, 2.7, { y: -1.15, ceil: 3.2, floor: 'sand', wall: 'moss', wob: 0.25, id: 'grotto' });
  // D. Whisper Passage, north to the big cavern
  F.tunnel([[23, 48, -1.0], [25.5, 40, -0.9], [30, 34.5, -0.75], [36, 31.5, -0.6]], 3.8, { ceil: 5.2, floor: 'wet', wall: 'slate', id: 'whisper' });
  // E. the big cavern and Mirror Lake
  F.room(48, 27, 17.5, 15, { y: -0.6, ceil: 15, floor: 'wet', wall: 'slate', bump: 0.14, id: 'cavern' });
  F.lake(50, 21.5, 10.5, 6.6, WATER);
  // the crystal gate's passage east
  F.tunnel([[63.5, 26.5, -0.55], [68.5, 24.5, -0.2], [72.5, 22.3, 0.2]], 3.4, { ceil: 5, floor: 'wet', wall: 'slate', wob: 0.3, id: 'gate' });
  // F. the chasm: a rift you only cross on the ledge (and the bridge over its gap)
  const LEDGE = [[72, 22.2, 0.25], [76.5, 17.4, 0.3], [83, 15.2, 0.3], [91, 15.3, 0.3], [97.5, 17.4, 0.3], [101.6, 20.9, 0.3]];
  F.tunnel(LEDGE, 2.6, { ceil: 6, floor: 'wet', wall: 'slate', wob: 0.22, id: 'ledge' });
  F.room(87, 28.5, 14.5, 12.5, { y: 0.3, ceil: 13, floor: 'wet', wall: 'slate', wob: 0.6, bump: 0.04, id: 'chasm' });
  const lp = LEDGE.map((p) => [p[0], p[1]]);
  F.pit((x, z) => {
    const e = (Math.hypot((x - 87) / 13.8, (z - 28.6) / 12.4) - 1) * 12.4, ledge = polyD(x, z, lp) - 1.05, gap = Math.hypot(x - 87, z - 15.2) - 1.95;
    return Math.min(Math.max(e, -ledge), gap);
  }, PIT_BOTTOM, { id: 'chasm' });
  // G. Old Mine No. 3: the timbered drift, the miners' camp
  F.tunnel([[101.6, 20.9, 0.3], [105.5, 22.8, 0.4], [108.4, 27.2, 0.5], [109.35, 34, 0.5], [109.35, 46, 0.05], [108.05, 55, -0.55], [104.4, 61, -0.95], [100.5, 65.8, -1.35]], 4.2, { ceil: 3.7, floor: 'dirt', wall: 'ochre', wob: 0.22, vault: 0.35, bump: 0.03, id: 'mine' });
  F.tunnel([[109.5, 40.6, 0.25], [114.5, 41.2, 0.3], [117.5, 42.2, 0.3]], 3.0, { ceil: 3.4, floor: 'dirt', wall: 'ochre', wob: 0.25, vault: 0.4, id: 'campway' });
  F.room(120.5, 43, 5, 4.4, { y: 0.3, ceil: 4.2, floor: 'dirt', wall: 'ochre', wob: 0.5, vault: 0.6, id: 'camp' });
  // H. the descent and the Geode
  F.tunnel([[100.5, 65.8, -1.35], [96.5, 70.2, -1.9], [92.5, 74.4, -2.4], [89, 77, -2.5]], 3.4, { ceil: 4.4, floor: 'geode', wall: 'geode', wob: 0.4, id: 'descent' });
  F.room(85.5, 80.2, 9.5, 8.5, { y: -2.5, ceil: 11, floor: 'geode', wall: 'geode', bump: 0.08, id: 'geode' });
  // the collapsed passage back to the hall (rubble until the Geode's guardian is calm)
  F.tunnel([[77, 81, -2.5], [71.5, 82.5, -1.6], [66.5, 81.5, -0.6], [61.5, 80, 0]], 3.2, { ceil: 4.4, floor: 'wet', wall: 'brown', wob: 0.4, id: 'shortcut' });
  return F;
}

// ==================================================================== materials
/** cave textures become single-sided (the cutaway: from outside, walls and roof are see-through) and get
 *  their roughness, metal, relief, glow and roughness maps (cave_tex.js userData) */
export function caveMat(m, tex) {
  const u = (tex && tex.userData) || {};
  m.side = THREE.FrontSide; m.shadowSide = THREE.DoubleSide;
  if (u.caveRoughness !== undefined) m.roughness = u.caveRoughness;
  if (u.caveMetal !== undefined) m.metalness = u.caveMetal;
  if (u.caveRough) m.roughnessMap = u.caveRough;
  if (u.caveRelief) relief(m, u.caveRelief);
  if (u.caveGlow) { m.emissive = new THREE.Color(0xffffff); m.emissiveMap = u.caveMask || tex; m.emissiveIntensity = u.caveGlow; }
  m.envMapIntensity = 0.35;
  m.needsUpdate = true;
  return m;
}
export const pieceMat = (tex) => caveMat(surfaceMaterial(tex, { side: THREE.FrontSide }), tex);

// ==================================================================== the build
export function buildCave(C) {
  const F = caveField(), E = new Emit(C), nav = C.nav;
  const gkAt = (x, z) => 'cv' + Math.floor(clamp(x, 0, W - 1) / 32) + '_' + Math.floor(clamp(z, 0, D - 1) / 26);
  const GEO = (x, z) => x > 74 && x < 98 && z > 68 && z < 92;      // the Geode's own groups (its glow is animated)
  const gkOf = (x, z) => (GEO(x, z) ? 'cv_geode' : gkAt(x, z));
  const FT = { wet: K.wetFloorTex('#525860', 'wet'), moss: K.mossFloorTex(), dirt: K.dirtFloorTex(), geode: K.geodeFloorTex(), sand: K.wetFloorTex('#6a6254', 'sand') };
  const MMC = { wet: '#4a4e58', moss: '#3e6040', dirt: '#6a5440', geode: '#4a3a62', sand: '#6a6254' };
  const lights = [], heroes = [], drips = [], fx = [];
  const light = (x, y, z, col, i, r, halo = 0) => { C.light(x, y, z, { color: col, intensity: i, r, halo, sh: Math.max(0.8, y - floorAt(x, z)) }); };
  // ---- heights: the floor dips to the water at the lake's edge
  const floorAt = (x, z) => { let y = F.floorY(x, z); const ld = F.lakeD(x, z); if (ld < 2.4) y += (WATER - 0.32 - y) * sstep(2.4, -0.2, ld); return y; };
  const ceilAt = (x, z) => F.ceilY(x, z);
  const holes = [{ x: 50.5, z: 75.5, r: 1.1 }, { x: 46.5, z: 24.5, r: 1.9 }, { x: 58.2, z: 37.4, r: 1.0 }, { x: 25.5, z: 51.5, r: 1.0 }, { x: 91, z: 31, r: 1.4 }, { x: 111, z: 50, r: 0.7 }];
  const inHole = (x, z) => holes.some((h) => Math.hypot(x - h.x, z - h.z) < h.r);

  // ---------------------------------------------------------------- nav: closed everywhere, opened inside the cave
  nav.block(0, 0, W, D, 0);
  const CELL = 0.25, NXc = Math.ceil(W / CELL), NZc = Math.ceil(D / CELL);
  for (let k = 0; k < NZc; k++) for (let i = 0; i < NXc; i++) {
    const x = (i + 0.5) * CELL, z = (k + 0.5) * CELL;
    if (F.d(x, z) > -0.5 || F.pitD(x, z) < 0.35 || F.lakeD(x, z) < 0.3) continue;
    const c = k * nav.NX + i; nav.walk[0][c] = 1; nav.h[0][c] = floorAt(x, z);
  }
  const blockDisc = (x, z, r) => nav.each(x - r, z - r, x + r, z + r, (c, cx, cz) => { if (Math.hypot(cx - x, cz - z) < r) nav.walk[0][c] = 0; });

  // ---------------------------------------------------------------- floors (1 m cells, corners shared)
  const YC = new Float32Array((W + 1) * (D + 1)).fill(NaN), yc = (x, z) => { const i = z * (W + 1) + x; if (Number.isNaN(YC[i])) YC[i] = floorAt(x, z); return YC[i]; };
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const cx = x + 0.5, cz = z + 0.5, d = F.d(cx, cz); if (d > 1.1) continue;
    const ld = F.lakeD(cx, cz); if (ld < -0.6) continue;               // under the lake: nothing (the reflection shows through)
    const pit = F.pitD(cx, cz) < -0.3 ? F.pitAt(cx, cz) : null, gk = gkOf(cx, cz);
    if (pit) {
      const y = pit.bottom + (noise2(cx * 0.5, cz * 0.5) - 0.5) * 1.2;
      C.quad(gk, FT.wet, [x, y, z + 1], [x + 1, y, z + 1], [x + 1, y, z], [x, y, z], { u0: x, v0: -(z + 1) });
      C.paint(x, z, x + 1, z + 1, '#141820'); continue;
    }
    const a = F.at(cx, cz), tex = FT[a.floor] || FT.wet;
    E.mirror = ld < 3 ? WATER : null;
    E.quad(gk, tex, [x, yc(x, z + 1), z + 1], [x + 1, yc(x + 1, z + 1), z + 1], [x + 1, yc(x + 1, z), z], [x, yc(x, z), z], { u0: x, v0: -(z + 1) });
    E.mirror = null;
    C.paint(x, z, x + 1, z + 1, d > -0.3 ? '#2a2632' : ld < 0.4 ? '#2a5a70' : MMC[a.floor] || '#4a4e58');
  }
  // the lake on the minimap, the pit as a dark void
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) { const ld = F.lakeD(x + 0.5, z + 0.5); if (ld < 0.2 && F.d(x + 0.5, z + 0.5) < 0) C.paint(x, z, x + 1, z + 1, '#2a6a8a'); }

  // ---------------------------------------------------------------- walls: the cave's outline, lofted
  const rock = (x, z) => K.rockTex(GEO(x, z) ? 'geode' : F.at(x, z).wall);
  const foot = (x, z) => K.wallFootTex(F.at(x, z).wall);
  const loops = contours((x, z) => F.d(x, z), 0, 0, W, D, 0.5, { step: 1.0, smooth: 2 });
  const nearPit = (x, z) => F.pitD(x, z) < 2.2;
  for (const L of loops) {
    wallLoop(E, L, { yb: (x, z) => floorAt(x, z) - 0.7, yt: (x, z) => ceilAt(x, z) + 1.4, tex: (x, z) => (GEO(x, z) ? K.geodeWallTex() : rock(x, z)), foot, gk: gkOf, amp: 0.55, lean: 1.1, under: 0.35, rowH: 1.3, vaultAt: (x, z) => F.at(x, z).vault, mirror: (x, z) => (F.lakeD(x, z) < 3.5 ? WATER : null) });
    // where the wall meets the chasm it runs on down into the dark
    wallLoop(E, L, { yb: () => PIT_BOTTOM - 1, yt: (x, z) => floorAt(x, z) - 0.7, tex: (x, z) => rock(x, z), gk: gkOf, amp: 0.55, lean: 0, under: 0, rowH: 2.4, skip: (x, z) => !nearPit(x, z) });
  }
  // the chasm's own rim: from the ledge down to the bottom
  for (const L of contours((x, z) => F.pitD(x, z), 64, 6, 106, 44, 0.5, { step: 1.0, smooth: 2 })) {
    wallLoop(E, L, { yb: () => PIT_BOTTOM - 1, yt: (x, z) => floorAt(x, z) + 0.04, tex: () => K.rockTex('slate'), gk: gkOf, amp: 0.35, lean: 0, under: 0, rowH: 2.2, skip: (x, z) => F.d(x, z) > -0.15 });
  }

  // ---------------------------------------------------------------- the roof (1.5 m cells, facing down), holes for the light shafts
  const CT = K.ceilTex();
  for (let z = 0; z < D; z += 1.5) for (let x = 0; x < W; x += 1.5) {
    const cx = x + 0.75, cz = z + 0.75; if (F.d(cx, cz) > 1.9 || inHole(cx, cz)) continue;
    const y = (px, pz) => ceilAt(px, pz);
    C.quad(gkOf(cx, cz), CT, [x, y(x, z), z], [x + 1.5, y(x + 1.5, z), z], [x + 1.5, y(x + 1.5, z + 1.5), z + 1.5], [x, y(x, z + 1.5), z + 1.5], { u0: x, v0: z });
  }

  const R = rng(4242);
  // ---------------------------------------------------------------- dripstones
  const FLOW = { brown: K.flowTex('cream'), slate: K.flowTex('grey'), moss: K.flowTex('cream'), ochre: K.flowTex('ochre'), geode: K.flowTex('violet') };
  for (let n = 0; n < 900; n++) {
    const x = 2 + R() * (W - 4), z = 2 + R() * (D - 4), d = F.d(x, z); if (d > -0.8) continue;
    if (F.pitD(x, z) < 0.5 && R() < 0.5) continue;
    const a = F.at(x, z), fy = floorAt(x, z), cy = ceilAt(x, z), room = cy - fy, tex = FLOW[a.wall] || FLOW.brown, gk = gkOf(x, z), id = a.prim.id;
    if (id === 'mine' || id === 'campway' || id === 'camp') continue;      // the miners cleared their drift
    const near = d > -3.2;
    // stalactites: hanging over most of the cave (over the lake, mirrored in it)
    if (R() < (near ? 0.5 : 0.22) && room > 3.3) {
      const L = Math.min(room * 0.42, 0.5 + R() * R() * (room > 9 ? 4.5 : 1.8)), r = 0.12 + L * (0.12 + R() * 0.08);
      E.mirror = F.lakeD(x, z) < 1 ? WATER : null;
      dripstone(E, gk, tex, x, cy + 0.4, z, L + 0.4, r, -1, n + 1);
      E.mirror = null;
      if (R() < 0.07 && drips.length < 60 && F.lakeD(x, z) > 0.5) drips.push({ x, z, top: cy - L, floor: fy, t: R() * 6, every: 2.5 + R() * 5 });
      continue;
    }
    // stalagmites: by the walls, off the paths
    if (near && R() < 0.42 && !onRoute(x, z, 2.2) && F.lakeD(x, z) > 1.2 && F.pitD(x, z) > 1.2 && !nearSpot(x, z, 2.6)) {
      const h = Math.min(room * 0.6, 0.4 + R() * R() * 2.8), r = 0.16 + h * (0.14 + R() * 0.06);
      dripstone(E, gk, tex, x, fy - 0.1, z, h + 0.1, r, 1, n + 7);
      blockDisc(x, z, r * 0.8 + 0.08);
      if (h > 1.6 && R() < 0.3 && room < 7) dripstone(E, gk, tex, x + 0.05, ceilAt(x, z) + 0.4, z + 0.05, room - h + 0.6, r * 0.7, -1, n + 9);   // nearly a column
    }
  }
  function nearSpot(x, z, m) { for (const k in SPOT) { const p = SPOT[k]; if (Array.isArray(p[0])) continue; if (Math.hypot(x - p[0], z - p[1]) < m) return true; } return false; }

  // ---------------------------------------------------------------- boulders: rockfall by the walls
  for (let n = 0; n < 140; n++) {
    const x = 2 + R() * (W - 4), z = 2 + R() * (D - 4), d = F.d(x, z); if (d > -0.6 || d < -2.4) continue;
    if (onRoute(x, z, 2.0) || F.lakeD(x, z) < 1 || F.pitD(x, z) < 1 || nearSpot(x, z, 2.4)) continue;
    const a = F.at(x, z), s = 0.3 + R() * R() * 1.2, y = floorAt(x, z);
    boulder(E, gkOf(x, z), K.rockTex(GEO(x, z) ? 'geode' : a.wall), x, y, z, s * (1 + R() * 0.5), s * (0.6 + R() * 0.4), s * (1 + R() * 0.4), n + 3, { top: a.floor === 'moss' ? FT.moss : undefined });
    blockDisc(x, z, s * 0.9);
  }

  // ---------------------------------------------------------------- crystals
  const CR = { cyan: K.crystalTex('cyan'), violet: K.crystalTex('violet'), green: K.crystalTex('green'), amber: K.crystalTex('amber'), rose: K.crystalTex('rose') };
  const CCOL = { cyan: 0x5ad8f0, violet: 0xb08af0, green: 0x6ae0a0, amber: 0xf0c45a, rose: 0xf08ab0 };
  /** move (x, z) toward the nearest wall until it stands m metres inside */
  const toWall = (x, z, m = 0.9) => {
    for (let it = 0; it < 60; it++) {
      const d = F.d(x, z); if (d > -m) return [x, z];
      const gx = F.d(x + 0.2, z) - F.d(x - 0.2, z), gz = F.d(x, z + 0.2) - F.d(x, z - 0.2), l = Math.hypot(gx, gz) || 1;
      x += (gx / l) * 0.25; z += (gz / l) * 0.25;
    }
    return [x, z];
  };
  const cluster = (x, z, size, col, o = {}) => {
    if (o.wall) [x, z] = toWall(x, z, o.wall);
    const y = o.y ?? floorAt(x, z), gk = o.gk || gkOf(x, z);
    E.mirror = o.mirror ?? (F.lakeD(x, z) < 2.6 ? WATER : null);
    crystalCluster(E, gk, CR[col], x, y, z, size, Math.round(x * 13 + z * 7), o);
    E.mirror = null;
    if (o.block !== false) blockDisc(x, z, size * 0.75);
    light(x, y + size * 0.9, z, CCOL[col], 0.45 + size * 0.35, 2.6 + size * 2.6, size > 1.1 ? 1.2 + size * 0.5 : 0);
    if (size >= 1.1) heroes.push({ x, y: y + size * 1.1, z, col: CCOL[col], i: 2 + size * 2.2 });
    return [x, y, z];
  };
  // the hall: the first faint glow
  cluster(62, 76.5, 0.7, 'cyan', { wall: 0.7 }); cluster(47.5, 73, 0.55, 'cyan', { wall: 0.7 });
  // the dripping tunnel: a few seeds of colour
  cluster(37, 85, 0.45, 'green', { wall: 0.5 }); cluster(28, 72.5, 0.5, 'cyan', { wall: 0.5 });
  // Mirror Lake: around the shores, the north wall, and the island in the middle
  for (const [x, z, s, c] of [[40.5, 30.2, 1.15, 'cyan'], [36.5, 22.5, 1.5, 'violet'], [43.5, 13.6, 1.7, 'cyan'], [56.5, 13.2, 1.4, 'violet'], [63.4, 18.5, 1.5, 'cyan'], [62.5, 38.8, 0.8, 'cyan'], [33.8, 33.6, 1.0, 'green'], [50, 41.2, 0.9, 'cyan'], [38.5, 38.2, 0.7, 'violet'], [64.5, 31.8, 0.75, 'violet']]) cluster(x, z, s, c, { wall: 1.0 });
  E.mirror = WATER; crystalCluster(E, gkAt(51, 20), CR.cyan, SPOT.island[0], WATER - 0.3, SPOT.island[1], 2.4, 77, { n: 8 }); E.mirror = null;
  boulder(E, gkAt(51, 20), K.rockTex('slate'), SPOT.island[0], WATER + 0.1, SPOT.island[1], 1.6, 0.6, 1.3, 91);
  light(SPOT.island[0], WATER + 2.6, SPOT.island[1], CCOL.cyan, 1.4, 11, 3.2); heroes.push({ x: SPOT.island[0], y: WATER + 3, z: SPOT.island[1], col: CCOL.cyan, i: 9 });
  // the chasm: crystals far down in the dark, and a few on the far wall
  for (let n = 0; n < 16; n++) { const x = 76 + R() * 22, z = 20 + R() * 18; if (F.pitD(x, z) > -1) continue; E.mirror = null; crystalCluster(E, gkAt(x, z), CR[n % 3 ? 'cyan' : 'violet'], x, PIT_BOTTOM + 0.2, z, 0.9 + R() * 1.2, n + 400); light(x, PIT_BOTTOM + 2, z, CCOL.cyan, 0.9, 7, 1.5); }
  cluster(96.5, 33, 1.1, 'violet', { wall: 0.6, y: undefined, block: false });
  // the Geode: lined with fluorite (three groups, so they can flare one after another)
  const GEODE = [];
  for (let n = 0; n < 26; n++) {
    const a = (n / 26) * PI * 2 + R() * 0.2, [x, z] = toWall(85.5 + Math.cos(a) * 6, 80.2 + Math.sin(a) * 5.5, 0.8);
    if (polyD(x, z, [[85.5, 80], [93, 74]]) < 2.4 || polyD(x, z, [[77, 81], [85.5, 80.2]]) < 2.2) continue;
    const s = 0.8 + R() * 1.3, gk = 'cv_geodeC' + (n % 3);
    GEODE.push(cluster(x, z, s, R() < 0.8 ? 'violet' : 'cyan', { gk }));
  }
  // the dais: a ring of flowstone with crystal spikes, where the guardian sleeps
  for (let n = 0; n < 9; n++) { const a = (n / 9) * PI * 2, x = SPOT.boss[0] + Math.cos(a) * 3.3, z = SPOT.boss[1] + Math.sin(a) * 3.0; if (Math.abs(a - 5.6) < 0.5) continue; crystalCluster(E, 'cv_geodeC' + (n % 3), CR.violet, x, floorAt(x, z), z, 0.45, 600 + n, { n: 3 }); }

  // ---------------------------------------------------------------- Glowcap Grove
  const SH = { teal: { cap: K.capTex('teal'), gill: K.gillTex('teal'), stem: K.stemTex('teal') }, violet: { cap: K.capTex('violet'), gill: K.gillTex('violet'), stem: K.stemTex('violet') }, blue: { cap: K.capTex('blue'), gill: K.gillTex('blue'), stem: K.stemTex('blue') } };
  const SHC = { teal: 0x62e8d0, violet: 0xc88af0, blue: 0x6ab0ff };
  const shroom = (x, z, h, r, col, seed, o = {}) => {
    const y = floorAt(x, z), c = mushroom(E, gkOf(x, z), SH[col], x, y, z, h, r, seed);
    if (o.block !== false) blockDisc(x, z, Math.max(0.22, r * 0.2));
    if (r > 0.5) { light(c[0], c[1] - 0.2, c[2], SHC[col], 0.35 + r * 0.35, 2.5 + r * 3, r > 1 ? 1.2 + r * 0.4 : 0); }
    if (r > 1.2) heroes.push({ x: c[0], y: c[1], z: c[2], col: SHC[col], i: 2.5 + r * 2 });
  };
  // giants (one hides the crack to the grotto)
  for (const [x, z, h, r, c] of [[13.6, 53.6, 3.2, 2.1, 'teal'], [27.4, 60.5, 2.8, 1.8, 'violet'], [16, 62.2, 2.5, 1.6, 'blue'], [28.6, 50.2, 3.4, 2.0, 'teal'], [18.6, 47.4, 2.2, 1.4, 'violet'], [14.2, 58.6, 1.9, 1.3, 'teal'], [30.4, 55.2, 1.6, 1.1, 'blue']]) shroom(x, z, h, r, c, Math.round(x * 10 + z));
  for (let n = 0; n < 70; n++) {
    const x = 9 + R() * 24, z = 46 + R() * 20, d = F.d(x, z); if (d > -0.6) continue;
    if (polyD(x, z, [[23.5, 66], [23, 47]]) < (n < 30 ? 2.0 : 1.4) || polyD(x, z, [[13.5, 53.5], [11, 51.5], [8.5, 48]]) < 1.2 || nearSpot(x, z, 1.4)) continue;
    const big = n < 26, col = ['teal', 'violet', 'blue'][n % 3];
    shroom(x, z, big ? 0.6 + R() * 0.9 : 0.15 + R() * 0.35, big ? 0.35 + R() * 0.5 : 0.08 + R() * 0.16, col, 900 + n, { block: big });
  }
  // the dripping tunnel and the passages get a few small ones near the walls
  for (let n = 0; n < 30; n++) {
    const x = 20 + R() * 30, z = 28 + R() * 60, d = F.d(x, z); if (d > -0.5 || d < -1.3) continue;
    const id = F.at(x, z).prim.id; if (id !== 'drip' && id !== 'whisper') continue;
    shroom(x, z, 0.12 + R() * 0.3, 0.07 + R() * 0.14, ['teal', 'blue'][n % 2], 1300 + n, { block: false });
  }

  // ---------------------------------------------------------------- Old Mine No. 3: timber sets, rails, lanterns
  const TV = K.timberTex('v'), TH = K.timberTex('h'), RUST = K.rustTex(), RAILT = K.railTex(), DECK = K.deckTex(), LANT = K.lanternTex(), ROPE = K.ropeTex();
  const MINE = [[101.6, 20.9], [105.5, 22.8], [108.4, 27.2], [109.35, 34], [109.35, 46], [108.05, 55], [104.4, 61], [100.5, 65.8]];
  const along = (P, step, fn) => { let carry = 0; for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], L = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / L, dz = (bz - az) / L; for (let s = carry; s < L; s += step) fn(ax + dx * s, az + dz * s, dx, dz, i); carry = (carry + Math.ceil((L - carry) / step) * step) - L; } };
  let setN = 0;
  along(MINE, 2.4, (x, z, dx, dz) => {
    if (Math.hypot(x - SPOT.barricade[0], z - SPOT.barricade[1]) < 1.6 || Math.hypot(x - SPOT.mineIn[0], z - SPOT.mineIn[1]) < 0.8) return;
    const n = setN++, nx = -dz, nz = dx, y = floorAt(x, z), hw = 1.62, lean = n % 7 === 3 ? 0.12 : 0;
    for (const sd of [-1, 1]) {
      const px = x + nx * hw * sd, pz = z + nz * hw * sd;
      obox(E, gkAt(px, pz), TV, [px, y + 1.42, pz], [0.24, 2.9, 0.24], yawAlong(dx, dz), { roll: sd > 0 ? lean : 0, end: TH });
      nav.each(px - 0.2, pz - 0.2, px + 0.2, pz + 0.2, (c) => { nav.walk[0][c] = 0; });
    }
    obox(E, gkAt(x, z), TH, [x, y + 2.97, z], [hw * 2 + 0.5, 0.26, 0.28], yawAlong(nx, nz), { end: TV });
    // lagging boards over the cap, some sagging
    for (let k = -2; k <= 2; k++) if ((n + k) % 4) obox(E, gkAt(x, z), DECK, [x + dx * k * 0.24 * 0 + nx * k * 0.6, y + 3.18, z + nz * k * 0.6], [1.4, 0.05, 0.22], yawAlong(dx, dz), { roll: k === 2 && n % 3 === 0 ? 0.2 : 0 });
    if (n % 3 === 1) {
      // a miner's lantern hanging off the cap (lit)
      const lx = x + nx * 0.9, lz = z + nz * 0.9, ly = y + 2.35;
      obox(E, gkAt(lx, lz), ROPE, [lx, ly + 0.42, lz], [0.03, 0.4, 0.03], 0);
      lantern(E, gkAt(lx, lz), lx, ly, lz, RUST, LANT);
      light(lx, ly, lz, 0xffb060, 0.85, 6.5, 0.9); heroes.push({ x: lx, y: ly, z: lz, col: 0xffa850, i: 4.5 });
    }
  });
  // rails: sleepers every 0.6 m, two rails
  const railFrom = 2.4;
  along(RAIL, 0.62, (x, z, dx, dz) => { const y = floorAt(x, z); obox(E, gkAt(x, z), TH, [x, y + 0.04, z], [1.3, 0.1, 0.2], yawAlong(-dz, dx)); });
  for (let i = 0; i < RAIL.length - 1; i++) {
    const [ax, az] = RAIL[i], [bx, bz] = RAIL[i + 1], L = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / L, dz = (bz - az) / L, nx = -dz, nz = dx;
    for (let s = 0; s < L; s += 1.5) {
      const e = Math.min(L, s + 1.5), mx = ax + dx * (s + e) / 2, mz = az + dz * (s + e) / 2;
      for (const sd of [-0.44, 0.44]) { const px = mx + nx * sd, pz = mz + nz * sd; obox(E, gkAt(px, pz), RAILT, [px, floorAt(px, pz) + 0.14, pz], [e - s + 0.02, 0.09, 0.07], yawAlong(dx, dz), { end: RUST }); }
    }
  }
  void railFrom;
  // the mine portal off the ledge, with its sign
  {
    const [x, z] = SPOT.mineIn, y = floorAt(x, z), dx = 0.76, dz = 0.65, nx = -0.65, nz = 0.76;
    for (const sd of [-1, 1]) { const px = x + nx * 1.7 * sd, pz = z + nz * 1.7 * sd; obox(E, gkAt(x, z), TV, [px, y + 1.5, pz], [0.3, 3.1, 0.3], yawAlong(dx, dz), { end: TH }); blockDisc(px, pz, 0.25); }
    obox(E, gkAt(x, z), TH, [x, y + 3.05, z], [4.2, 0.34, 0.34], yawAlong(nx, nz), { end: TV });
    sign(E, gkAt(x, z), K.plankSign('MINE No. 3', 'ALAMO HILL MINING CO.', 1.9, 0.6), x - dx * 0.25, y + 2.5, z - dz * 0.25, -dx, -dz, 1.9, 0.6, 1);
  }
  // the miners' camp: crates, a table, a bunk, barrels, a tool rack, a lamp on the table
  {
    const CRATE = K.crateTex('No.3'), CRATE2 = K.crateTex('FUSE'), y = floorAt(120.5, 43);
    for (const [x, z, s, t, yaw] of [[123.4, 46.2, 0.8, CRATE, 0.2], [124.2, 45.4, 0.6, CRATE2, -0.3], [123.5, 46.15, 0.55, CRATE, 0.5], [116.5, 45.6, 0.7, CRATE, 0.1]]) { const yy = x === 123.5 ? y + 0.8 : y; obox(E, gkAt(x, z), t, [x, yy + s / 2, z], [s, s, s], yaw, { capFit: true, fit: true }); blockDisc(x, z, s * 0.65); }
    // table + journal + lamp
    const tx = 121.6, tz = 45.6;
    obox(E, gkAt(tx, tz), DECK, [tx, y + 0.78, tz], [1.4, 0.07, 0.8], 0.1); for (const [ox, oz] of [[-0.6, -0.32], [0.6, -0.32], [-0.6, 0.32], [0.6, 0.32]]) obox(E, gkAt(tx, tz), TV, [tx + ox, y + 0.38, tz + oz], [0.08, 0.76, 0.08], 0.1);
    lantern(E, gkAt(tx, tz), tx + 0.45, y + 0.98, tz - 0.1, RUST, LANT); light(tx + 0.45, y + 1.1, tz - 0.1, 0xffb060, 0.9, 6, 1.0); heroes.push({ x: tx + 0.45, y: y + 1.2, z: tz - 0.1, col: 0xffa850, i: 5 });
    blockDisc(tx, tz, 0.75);
    // bunk
    obox(E, gkAt(118, 39.5), DECK, [118, y + 0.45, 39.6], [2.0, 0.08, 0.9], 0.15); obox(E, gkAt(118, 39.5), K.blanketTex(), [118, y + 0.52, 39.6], [1.8, 0.08, 0.8], 0.15, { fit: true, capFit: true });
    for (const [ox, oz] of [[-0.95, -0.4], [0.95, -0.4], [-0.95, 0.4], [0.95, 0.4]]) obox(E, gkAt(118, 39.5), TV, [118 + ox, y + 0.22, 39.6 + oz], [0.1, 0.45, 0.1], 0.15);
    blockDisc(118, 39.6, 1.0);
    // barrels (octagonal)
    for (const [x, z] of [[124.6, 42.2], [124.2, 43.4], [116.8, 47]]) { cyl(E, gkAt(x, z), K.timberTex('v'), x, y, z, 0.32, 0.86, 8); blockDisc(x, z, 0.4); }
    // a tool rack with picks
    const rx = 120, rz = 38.7; obox(E, gkAt(rx, rz), TH, [rx, y + 1.3, rz], [1.6, 0.1, 0.1], 0); for (const ox of [-0.5, 0, 0.5]) { obox(E, gkAt(rx, rz), TV, [rx + ox, y + 0.7, rz + 0.12], [0.05, 1.3, 0.05], 0, { roll: 0.15 }); obox(E, gkAt(rx, rz), RUST, [rx + ox, y + 1.33, rz + 0.18], [0.5, 0.07, 0.07], 0); }
    blockDisc(rx, rz, 0.7);
  }

  // ---------------------------------------------------------------- the ledge: rope posts over the drop, the plank bridge over the gap
  {
    const LP = [[72, 22.2], [76.5, 17.4], [83, 15.2], [91, 15.3], [97.5, 17.4], [101.6, 20.9]];
    let last = null;
    along(LP, 2.6, (x, z, dx, dz) => {
      // the post stands on the pit side of the walkable strip
      let px = x, pz = z; for (let k = 0; k < 14; k++) { const tx = px + dz * 0.15, tz = pz - dx * 0.15; if (F.pitD(tx, tz) < 0.45 || F.d(tx, tz) > -0.3) break; px = tx; pz = tz; }
      if (Math.hypot(px - 87, pz - 15.2) < 2.6) { last = null; return; }
      const y = floorAt(px, pz);
      obox(E, gkAt(px, pz), TV, [px, y + 0.5, pz], [0.12, 1.1, 0.12], 0.3, { end: TH });
      if (last) { const [lx, ly, lz] = last, mx = (lx + px) / 2, mz = (lz + pz) / 2, L = Math.hypot(px - lx, pz - lz); obox(E, gkAt(mx, mz), ROPE, [mx, (ly + y) / 2 + 0.82, mz], [L, 0.04, 0.04], yawAlong(px - lx, pz - lz), { pitch: Math.atan2(y - ly, L) }); }
      last = [px, y, pz];
    });
    // the bridge
    const [[ax, az], [bx, bz]] = SPOT.bridge, L = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / L, dz = (bz - az) / L, nx = -dz, nz = dx, y0 = floorAt(ax, az);
    const yb = (t) => y0 + 0.04 - Math.sin(t * PI) * 0.14;
    for (let s = 0; s < L; s += 0.3) { const t = s / L, x = ax + dx * s, z = az + dz * s; if (s > 0.6 && s < L - 0.6 && ((s * 10) | 0) % 11 === 4) continue; obox(E, gkAt(x, z), DECK, [x, yb(t), z], [0.22, 0.06, 1.35], yawAlong(dx, dz), { pitch: 0 }); }
    for (const sd of [-0.62, 0.62]) {
      obox(E, gkAt(ax, az), TV, [ax + nx * sd - dx * 0.2, y0 + 0.5, az + nz * sd - dz * 0.2], [0.13, 1.2, 0.13], 0); obox(E, gkAt(bx, bz), TV, [bx + nx * sd + dx * 0.2, y0 + 0.5, bz + nz * sd + dz * 0.2], [0.13, 1.2, 0.13], 0);
      for (let k = 0; k < 6; k++) { const t0 = k / 6, t1 = (k + 1) / 6, x0 = ax + dx * L * t0 + nx * sd, z0 = az + dz * L * t0 + nz * sd, x1 = ax + dx * L * t1 + nx * sd, z1 = az + dz * L * t1 + nz * sd, y0r = yb(t0) + 0.85, y1r = yb(t1) + 0.85; obox(E, gkAt(x0, z0), ROPE, [(x0 + x1) / 2, (y0r + y1r) / 2, (z0 + z1) / 2], [Math.hypot(x1 - x0, z1 - z0), 0.04, 0.04], yawAlong(dx, dz), { pitch: Math.atan2(y1r - y0r, Math.hypot(x1 - x0, z1 - z0)) }); }
      for (let s = 0.3; s < L; s += 0.9) { const t = s / L; obox(E, gkAt(ax, az), ROPE, [ax + dx * s + nx * sd, yb(t) + 0.43, az + dz * s + nz * sd], [0.025, 0.8, 0.025], 0); }
    }
    // walkable along the planks
    nav.each(Math.min(ax, bx) - 0.8, Math.min(az, bz) - 0.8, Math.max(ax, bx) + 0.8, Math.max(az, bz) + 0.8, (c, x, z) => {
      const t = clamp(((x - ax) * dx + (z - az) * dz) / L, 0, 1), off = Math.abs((x - ax) * nx + (z - az) * nz);
      if (off < 0.55 && t > 0 && t < 1) { nav.walk[0][c] = 1; nav.h[0][c] = yb(t) + 0.03; }
    });
    C.paint(Math.min(ax, bx), Math.min(az, bz) - 0.5, Math.max(ax, bx), Math.max(az, bz) + 0.5, '#7a5a3a');
  }

  // ---------------------------------------------------------------- the entrance: daylight down the mouth, an old sign
  {
    const y = floorAt(56, 100), DAY = K.daylightTex();
    C.quad(gkAt(56, 100), DAY, [58.6, y - 0.2, 101.3], [53.4, y - 0.2, 101.3], [53.4, y + 4.6, 101.3], [58.6, y + 4.6, 101.3], { fit: true });
    light(56, 2.2, 99.8, 0xd8ecff, 1.6, 9, 3.4); heroes.push({ x: 56, y: 2.6, z: 99.4, col: 0xcfe6ff, i: 9 });
    const sx = toWall(54.8, 91.4, 0.7)[0];
    obox(E, gkAt(sx, 91.4), TV, [sx - 0.1, floorAt(sx, 91.4) + 0.75, 91.4], [0.1, 1.6, 0.1], 0);
    sign(E, gkAt(sx, 91.4), K.plankSign('DANGER', 'OLD WORKINGS · KEEP OUT', 1.4, 0.55, '#e8c070'), sx, floorAt(sx, 91.4) + 1.3, 91.4, 1, 0, 1.4, 0.55, 1);
    blockDisc(sx, 91.4, 0.35);
  }

  // ---------------------------------------------------------------- daylight through the roof: a disc above each hole + a tube of rock
  for (const h of holes) {
    const y = ceilAt(h.x, h.z), DAY = K.daylightTex(), gk = gkOf(h.x, h.z);
    tube(E, gk, K.rockTex('dark'), h.x, h.z, y - 0.2, y + 2.2, h.r + 0.15);
    C.quad(gk, DAY, [h.x - h.r, y + 2.1, h.z - h.r], [h.x + h.r, y + 2.1, h.z - h.r], [h.x + h.r, y + 2.1, h.z + h.r], [h.x - h.r, y + 2.1, h.z + h.r], { fit: true });
    const fy = F.pitD(h.x, h.z) < 0 ? PIT_BOTTOM : F.lakeD(h.x, h.z) < 0 ? WATER : floorAt(h.x, h.z);
    light(h.x, Math.min(y, fy + 6), h.z, 0xcfe8ff, 0.9 + h.r * 0.4, 3 + h.r * 2.6, 0);
    fx.push({ kind: 'shaft', x: h.x, z: h.z, top: y + 2, bottom: fy, r0: h.r * 0.9, r1: h.r * 1.6 + 0.6 });
  }

  // ---------------------------------------------------------------- the dynamic pieces
  const dyn = {};
  // ore nodes (glowing veins in a lump of rock), mined into the bag
  dyn.ores = [];
  const ORE = K.oreTex('cyan'), ORE2 = K.oreTex('green');
  [[61, 75.5], [37.5, 84.5], [11.5, 60.5], [27.5, 37.5], [35, 24], [63, 15.5], [99.6, 17.6], [106.5, 44], [123.5, 40], [79.5, 75]].forEach(([sx, sz], i) => {
    // built round its own origin (it shrinks away when mined), placed at (x, y, z) in postCave
    const [x, z] = toWall(sx, sz, 0.75), y = floorAt(x, z), P = new Piece(), s = 0.42 + (i % 3) * 0.08;
    boulder(P, '', i % 4 === 3 ? ORE2 : ORE, 0, 0, 0, s * 1.2, s * 0.9, s, 70 + i, { sink: 0.25 });
    crystal(P, '', CR[i % 4 === 3 ? 'green' : 'cyan'], 0, s * 0.3, 0, s * 0.9, s * 0.16, 0.3, -0.2, i);
    crystal(P, '', CR[i % 4 === 3 ? 'green' : 'cyan'], s * 0.2, s * 0.2, -s * 0.15, s * 0.6, s * 0.12, -0.4, 0.3, i + 3);
    blockDisc(x, z, s * 0.8);
    light(x, y + 0.6, z, i % 4 === 3 ? CCOL.green : CCOL.cyan, 0.5, 2.6, 0.7);
    dyn.ores.push({ id: 'ore' + i, x, y, z, piece: P });
  });
  // the sun crystal (lit by its shaft), the two mirror crystals on their plinths, the crystal gate
  {
    const [sx, sz] = SPOT.sun, sy = floorAt(sx, sz);
    boulder(E, gkAt(sx, sz), K.rockTex('slate'), sx, sy, sz, 0.8, 0.5, 0.8, 501);
    crystal(E, gkAt(sx, sz), CR.amber, sx, sy + 0.25, sz, 1.5, 0.3, 0.05, 0.05, 0.4);
    blockDisc(sx, sz, 0.85); light(sx, sy + 1.4, sz, CCOL.amber, 1.2, 5, 1.6); heroes.push({ x: sx, y: sy + 1.5, z: sz, col: 0xffd890, i: 6 });
    dyn.sun = [sx, sy + 1.05, sz];
    dyn.mirrors = [SPOT.m1, SPOT.m2].map(([x, z], k) => {
      const y = floorAt(x, z), base = new Piece();
      boulder(E, gkAt(x, z), K.rockTex('slate'), x, y, z, 0.62, 0.55, 0.62, 520 + k, { sink: 0.1 });
      blockDisc(x, z, 0.7);
      // the turning crystal: a flat prism standing on edge, built at the origin (rotated by the gameplay)
      crystal(base, '', CR.rose, 0, 0, 0, 1.1, 0.26, 0, 0, 0, 0.25);
      crystal(base, '', CR.rose, 0.18, 0, 0.05, 0.6, 0.12, 0.3, 0.2, 1);
      crystal(base, '', CR.rose, -0.16, 0, -0.06, 0.7, 0.13, -0.3, -0.2, 2);
      light(x, y + 1.5, z, CCOL.rose, 0.6, 3.5, 0.9);
      return { x, z, y: y + 0.45, beamY: y + 1.05, piece: base };
    });
    // the gate: a wall of dark crystal across the passage
    const [gx, gz] = SPOT.gate, gy = floorAt(gx, gz), P = new Piece(), dx = 0.381, dz = 0.925;
    for (let k = -5; k <= 5; k++) {
      const t = k / 5, x = gx + dx * t * 2.1, z = gz + dz * t * 2.1, h = 2.6 + (1 - Math.abs(t)) * 1.6 + Math.sin(k * 2.1) * 0.4;
      crystal(P, '', CR.violet, x, gy, z, h, 0.36 + Math.cos(k) * 0.06, (k % 2) * 0.12, -(k % 3) * 0.07, k);
    }
    nav.each(gx - 2.6, gz - 2.6, gx + 2.6, gz + 2.6, (c, x, z) => { if (Math.abs((x - gx) * 0.925 - (z - gz) * 0.381) < 0.7 && Math.abs((x - gx) * dx + (z - gz) * dz) < 2.6) nav.walk[0][c] = 0; });
    light(gx, gy + 1.6, gz, CCOL.violet, 0.8, 5, 1.6);
    dyn.gate = { x: gx, y: gy, z: gz, piece: P, open: () => nav.each(gx - 2.6, gz - 2.6, gx + 2.6, gz + 2.6, (c, x, z) => { if (Math.abs((x - gx) * 0.925 - (z - gz) * 0.381) < 0.75 && F.d(x, z) < -0.5) { nav.walk[0][c] = 1; nav.h[0][c] = floorAt(x, z); } }) };
  }
  // the mine cart on its rails
  {
    const P = new Piece(), CART = K.cartTex(), y = 0;
    // a tub of riveted plates, flared at the top, on a frame with four wheels (built at the origin, facing +x)
    obox(P, '', CART, [0, 0.62, 0], [1.3, 0.62, 0.9], 0, { end: CART, capFit: true });
    obox(P, '', RUST, [0, 0.3, 0], [1.1, 0.12, 0.7], 0);
    for (const [ox, oz] of [[-0.4, -0.42], [0.4, -0.42], [-0.4, 0.42], [0.4, 0.42]]) cyl(P, '', RUST, ox, 0.18, oz, 0.19, 0.08, 10, 'z');
    obox(P, '', K.rockTex('dark'), [0, 0.98, 0], [1.1, 0.1, 0.7], 0);   // a heap of ore in the tub
    for (let k = 0; k < 5; k++) boulder(P, '', ORE, -0.35 + k * 0.17, 0.98, (k % 2 - 0.5) * 0.3, 0.18, 0.14, 0.16, 300 + k, { sink: 0.2 });
    void y;
    dyn.cart = { piece: P, rail: RAIL, start: SPOT.cart };
    blockDisc(SPOT.cart[0], SPOT.cart[1], 0.8);
    // the barricade: planks nailed across the drift, a sign, a heap of rubble
    const B = new Piece(), [bx, bz] = SPOT.barricade, by = floorAt(bx, bz), ndx = 0.79, ndz = 0.61;   // across the drift
    for (let k = 0; k < 6; k++) obox(B, '', DECK, [bx, by + 0.35 + k * 0.42, bz], [4.2, 0.3, 0.07], yawAlong(ndx, ndz), { roll: (k % 2 ? 0.05 : -0.04) });
    for (const sd of [-1.6, 1.6]) obox(B, '', TV, [bx + ndx * sd, by + 1.3, bz + ndz * sd], [0.2, 2.6, 0.2], 0);
    sign(B, '', K.plankSign('KEEP OUT', 'UNSAFE WORKINGS', 1.2, 0.5, '#e86a4a'), bx + ndz * 0.12, by + 1.6, bz - ndx * 0.12, ndz, -ndx, 1.2, 0.5, 1);
    for (let k = 0; k < 7; k++) boulder(B, '', K.rockTex('ochre'), bx + ndx * (k - 3) * 0.6 + 0.4, by, bz + ndz * (k - 3) * 0.6 - 0.5, 0.4 + (k % 3) * 0.12, 0.35, 0.4, 340 + k);
    nav.each(bx - 2.6, bz - 2.6, bx + 2.6, bz + 2.6, (c, x, z) => { if (Math.abs((x - bx) * ndz - (z - bz) * ndx) < 0.9) nav.walk[0][c] = 0; });
    dyn.barricade = { piece: B, x: bx, y: by, z: bz, open: () => nav.each(bx - 2.6, bz - 2.6, bx + 2.6, bz + 2.6, (c, x, z) => { if (Math.abs((x - bx) * ndz - (z - bz) * ndx) < 0.95 && F.d(x, z) < -0.5) { nav.walk[0][c] = 1; nav.h[0][c] = floorAt(x, z); } }) };
  }
  // the rubble in the collapsed passage
  {
    const P = new Piece(), [rx, rz] = SPOT.rubble, ry = floorAt(rx, rz);
    for (let k = 0; k < 11; k++) { const a = k * 2.4, d = (k % 4) * 0.45; boulder(P, '', K.rockTex('brown'), rx + Math.cos(a) * d, ry + (k > 6 ? 0.8 : 0), rz + Math.sin(a) * d * 1.6, 0.6 + (k % 3) * 0.2, 0.55 + (k % 2) * 0.3, 0.6, 360 + k); }
    nav.each(rx - 3, rz - 3, rx + 3, rz + 3, (c, x) => { if (Math.abs(x - rx) < 1.1) nav.walk[0][c] = 0; });
    dyn.rubble = { piece: P, x: rx, y: ry, z: rz, open: () => nav.each(rx - 3, rz - 3, rx + 3, rz + 3, (c, x, z) => { if (Math.abs(x - rx) < 1.2 && F.d(x, z) < -0.5) { nav.walk[0][c] = 1; nav.h[0][c] = floorAt(x, z); } }) };
  }
  // the miners' strongbox in the grotto, and the supply chest in the camp
  {
    const mk = (x, z, yaw) => { const y = floorAt(x, z), body = new Piece(), lid = new Piece(), CH = K.chestTex(); obox(body, '', CH, [0, 0.25, 0], [0.9, 0.5, 0.56], 0, { end: K.timberTex('h'), capFit: true }); obox(lid, '', CH, [0, 0.08, 0.28], [0.92, 0.16, 0.58], 0, { end: K.timberTex('h'), capFit: true }); blockDisc(x, z, 0.55); return { x, y, z, yaw, body, lid }; };
    dyn.strongbox = mk(SPOT.chest[0], SPOT.chest[1], 0.9);
    dyn.supply = mk(SPOT.supply[0], SPOT.supply[1], -1.9);
    light(SPOT.chest[0] + 0.6, floorAt(SPOT.chest[0], SPOT.chest[1]) + 0.8, SPOT.chest[1] + 0.4, 0x62e8d0, 0.5, 3.5, 0.6);
  }
  // the lake's surface
  {
    const P = new Piece(), LK = K.lakeTex();
    for (let z = 12; z < 32; z += 0.5) for (let x = 38; x < 63; x += 0.5) { const cx = x + 0.25, cz = z + 0.25; if (F.lakeD(cx, cz) > 0.9 || floorAt(cx, cz) > WATER + 0.06 || F.d(cx, cz) > 0) continue; P.quad('', LK, [x, WATER, z + 0.5], [x + 0.5, WATER, z + 0.5], [x + 0.5, WATER, z], [x, WATER, z], { u0: x, v0: -(z + 0.5) }); }
    dyn.water = P;
  }
  // spots and the arenas (open floor for battles)
  for (const [k, v] of Object.entries(SPOT)) if (!Array.isArray(v[0])) C.spot(k, v[0], v[1], v[2] || 0);
  C.spot('caveMouth', SPOT.start[0], SPOT.start[1], PI);
  // the names on the minimap's floor colours and the zones (place cards, music, footsteps)
  const Z = (n, r, label, music) => C.zone(n, r[0], r[1], r[2], r[3], { label, sub: 'The Deep Cave', music, step: 'step_stone' });
  Z('cv_mouth', [40, 68, 68, 104], 'Entrance Hall', 'safari'); Z('cv_drip', [22, 64, 47, 90], 'Dripping Tunnel', 'safari'); Z('cv_grove', [0, 38, 34, 66], 'Glowcap Grove', 'safari');
  Z('cv_whisper', [20, 28, 37, 46], 'Whisper Passage', 'safari'); Z('cv_lake', [30, 6, 66, 44], 'Mirror Lake', 'safari'); Z('cv_chasm', [66, 6, 104, 42], 'The Chasm', 'tension');
  Z('cv_mine', [98, 18, 128, 66], 'Old Mine No. 3', 'tension'); Z('cv_geode', [72, 66, 100, 92], 'The Geode', 'tension'); Z('cv_short', [64, 76, 76, 88], 'Collapsed Passage', 'safari');
  return { F, dyn, heroes, drips, fx, floorAt, ceilAt, holes };
}

// ---------------------------------------------------------------- small pieces of set dressing
/** a miner's lantern: a hood, four glass panes round a flame, a wire guard, a bail */
export function lantern(E, gk, x, y, z, frame, glass) {
  obox(E, gk, frame, [x, y + 0.2, z], [0.22, 0.05, 0.22], 0.3); obox(E, gk, frame, [x, y - 0.17, z], [0.2, 0.05, 0.2], 0.3);
  const s = 0.085; for (const [ox, oz, fx2, fz2] of [[s, 0, 1, 0], [-s, 0, -1, 0], [0, s, 0, 1], [0, -s, 0, -1]]) {
    const a = [x + ox - fz2 * s, y - 0.15, z + oz + fx2 * s], b = [x + ox + fz2 * s, y - 0.15, z + oz - fx2 * s];
    E.quadOut(gk, glass, a, b, [b[0], y + 0.18, b[2]], [a[0], y + 0.18, a[2]], [x, y, z], { fit: true });
  }
  obox(E, gk, frame, [x, y + 0.28, z], [0.03, 0.12, 0.03], 0);
}
/** an octagonal (or n-sided) cylinder, axis y (or 'z' for wheels) */
function cyl(E, gk, tex, x, y, z, r, h, n = 8, axis = 'y') {
  const P = (a, t) => (axis === 'y' ? [x + Math.cos(a) * r, y + t * h, z + Math.sin(a) * r] : [x + Math.cos(a) * r, y + Math.sin(a) * r, z + (t - 0.5) * h]);
  const c = axis === 'y' ? [x, y + h / 2, z] : [x, y, z];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
    E.quadOut(gk, tex, P(a0, 0), P(a1, 0), P(a1, 1), P(a0, 1), c, { fit: true });
    E.triOut(gk, tex, P(a0, 1), P(a1, 1), axis === 'y' ? [x, y + h, z] : [x, y, z + h / 2], c);
    if (axis !== 'y') E.triOut(gk, tex, P(a0, 0), P(a1, 0), [x, y, z - h / 2], c);
  }
}
/** a short tube of rock up through the roof (faces inward) */
function tube(E, gk, tex, x, z, y0, y1, r, n = 9) {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2, j0 = 1 + (noise2(i, 3) - 0.5) * 0.3, j1 = 1 + (noise2((i + 1) % n, 3) - 0.5) * 0.3;
    const A = [x + Math.cos(a0) * r * j0, y0, z + Math.sin(a0) * r * j0], B = [x + Math.cos(a1) * r * j1, y0, z + Math.sin(a1) * r * j1];
    const am = (a0 + a1) / 2, far = [x + Math.cos(am) * r * 10, (y0 + y1) / 2, z + Math.sin(am) * r * 10];
    E.quadOut(gk, tex, B, A, [A[0] * 0.92 + x * 0.08, y1, A[2] * 0.92 + z * 0.08], [B[0] * 0.92 + x * 0.08, y1, B[2] * 0.92 + z * 0.08], far, { u0: i * 0.4, v0: y0 });
  }
}
/** a sign board on two faces of a thin plank, facing (nx, nz) (side: 1 = toward n, -1 = away); o: no back */
export function sign(E, gk, tex, x, y, z, nx, nz, w, h, side = 1) {
  const fx = nx * side, fz = nz * side, tx = -fz, tz = fx, off = 0.04;
  const a = [x - tx * w / 2 + fx * off, y - h / 2, z - tz * w / 2 + fz * off], b = [x + tx * w / 2 + fx * off, y - h / 2, z + tz * w / 2 + fz * off];
  E.quadOut(gk, tex, a, b, [b[0], y + h / 2, b[2]], [a[0], y + h / 2, a[2]], [x - fx, y, z - fz], { fit: true });
  obox(E, gk, K.timberTex('h'), [x, y, z], [w + 0.06, h + 0.06, 0.05], Math.atan2(-tz, tx), { noCaps: false });
}

// ==================================================================== after finalize: materials, pieces, glow, water, mist, motes
export function postCave(city, stage, built) {
  const root = city.root, { dyn } = built;
  // materials of the merged cave groups
  root.traverse((o) => {
    if (!o.isMesh || !o.material || !o.material.map) return;
    const k = String(o.material.map.userData.key || '');
    if (!k.startsWith('cave_')) return;
    caveMat(o.material, o.material.map);
    o.castShadow = false; o.userData.cast = false;
  });
  root.traverse((o) => { if (o.isMesh && o.userData && o.userData.proxy) o.castShadow = false; });
  const add = (P, x = 0, y = 0, z = 0, yaw = 0) => { const g = P.build(pieceMat); g.position.set(x, y, z); g.rotation.y = yaw; root.add(g); return g; };
  for (const o of dyn.ores) o.mesh = add(o.piece, o.x, o.y, o.z);
  for (const m of dyn.mirrors) m.mesh = add(m.piece, m.x, m.y, m.z, 0);
  dyn.gate.mesh = add(dyn.gate.piece);
  dyn.cart.mesh = add(dyn.cart.piece);
  dyn.barricade.mesh = add(dyn.barricade.piece);
  dyn.rubble.mesh = add(dyn.rubble.piece);
  for (const b of [dyn.strongbox, dyn.supply]) { b.mesh = add(b.body, b.x, b.y, b.z, b.yaw); b.lidMesh = add(b.lid, 0, 0.5, -0.28); b.mesh.add(b.lidMesh); }
  // the water: smooth, dark, a little see-through (the reflection lives under it)
  const wm = new THREE.MeshStandardMaterial({ map: K.lakeTex(), color: 0xb8d8dc, roughness: 0.04, metalness: 0.15, transparent: true, opacity: 0.74, side: THREE.FrontSide, envMapIntensity: 0.6 });
  wm.map = wm.map.clone(); wm.map.needsUpdate = true;
  dyn.water.mesh = dyn.water.build(() => wm); dyn.water.mesh.renderOrder = 3; dyn.water.mat = wm; root.add(dyn.water.mesh);
  // glow pieces: light shafts, mist, motes
  const fx = [];
  const beam = K.beamTexture();
  for (const s of built.fx) if (s.kind === 'shaft') { const m = lightShaft(beam, s.x, s.top, s.z, s.bottom, s.r0, s.r1, 0xcfe8ff, s.bottom < -10 ? 0.1 : 0.14); root.add(m); fx.push(m); fx.push(addM(root, motes(60, [s.x - s.r1, s.bottom, s.z - s.r1, s.x + s.r1, Math.min(s.top, s.bottom + 9), s.z + s.r1], { colors: ['#ffffff', '#d8ecff'], size: 0.035, drift: [0.02, -0.03, 0.01], wob: 0.2, gain: 1.1, seed: Math.round(s.x) }))); }
  fx.push(addM(root, mistPlane(37, 13, 64, 31, WATER + 0.35, 0x8ab0c0, 0.16, 2)));
  fx.push(addM(root, mistPlane(72, 15, 102, 42, -3, 0x8aa0b8, 0.22, 2)), addM(root, mistPlane(72, 15, 102, 42, -7.5, 0x7a90a8, 0.28, 3)), addM(root, mistPlane(72, 15, 102, 42, -12.5, 0x6a8098, 0.35, 2)));
  fx.push(addM(root, mistPlane(9, 45, 33, 66, -0.75, 0x7ac8b0, 0.1, 3)));
  fx.push(addM(root, motes(260, [9, -1.0, 46, 33, 4.5, 66], { colors: ['#62e8d0', '#c88af0', '#6ab0ff', '#d0fff4'], size: 0.05, drift: [0, 0.12, 0], wob: 0.4, gain: 1.8, seed: 3 })));      // glow spores
  fx.push(addM(root, motes(120, [52, 0, 82, 60, 4, 100.5], { colors: ['#cfe6ff', '#ffffff'], size: 0.03, drift: [0, 0.01, -0.35], wob: 0.15, gain: 0.8, seed: 5 })));                  // cold air from the mouth
  fx.push(addM(root, motes(160, [76, -2.5, 71, 95, 6, 89], { colors: ['#c8a0ff', '#ecdcff', '#9a7ae8'], size: 0.045, drift: [0, 0.06, 0], wob: 0.35, gain: 1.6, seed: 9 })));          // the geode's sparkle
  fx.push(addM(root, motes(140, [38, WATER, 13, 62, 6, 34], { colors: ['#5ad8f0', '#b8f6ff', '#b08af0'], size: 0.04, drift: [0, 0.05, 0], wob: 0.5, gain: 1.4, seed: 11 })));       // over the lake
  built.fxMeshes = fx;
  // the geode's crystal groups, for the guardian's reveal
  built.geodeMats = [];
  for (const k of ['cv_geodeC0', 'cv_geodeC1', 'cv_geodeC2', 'cv_geode']) { const g = root.getObjectByName(k); if (g) g.traverse((o) => { if (o.isMesh && o.material && o.material.emissiveMap) { o.material.userData.glow0 = o.material.emissiveIntensity; built.geodeMats.push({ group: k, m: o.material }); } }); }
  void stage;
  return built;
}
function addM(root, m) { root.add(m); return m; }
