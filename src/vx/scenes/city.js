// The walkable city: one seamless map you walk around (top-down survival-game style). North is the bay;
// two avenues (Bay Street along the shore, Market Street across the middle) and Van Ness (north–south)
// split the land into four districts, each built by its own module in src/vx/city/districts/.
//
//   x: 0 ───────────── 104 ┃ 116 ─────────────────────────── 230      (metres, east →)
//   z 0–12    the bay (water) ··· the pier juts into it at x 150–172
//   z 12–20   waterfront promenade                         (districts/wharf.js)
//   z 20–32   BAY STREET (avenue, sidewalks both sides)
//   z 32–98   PARK (Alamo Hill)  ┃ VAN ┃ CHINATOWN          (districts/park.js · districts/chinatown.js)
//   z 98–110  MARKET STREET (avenue)  NESS
//   z 110–180 HOME (Sunset Row)  ┃ x104–116 ┃ DOWNTOWN     (districts/home.js · districts/downtown.js)
import { CityBuilder, TX } from '../city/build.js';
import * as home from '../city/districts/home.js';
import * as park from '../city/districts/park.js';
import * as chinatown from '../city/districts/chinatown.js';
import * as downtown from '../city/districts/downtown.js';
import * as wharf from '../city/districts/wharf.js';
import * as caveMouth from '../city/districts/cave_mouth.js';   // [cave] the Deep Cave's entrance on Alamo Hill
import { record, dress } from '../city/dress.js';
import { fill } from '../city/fill.js';        // the density pass: storefronts, lots, landmarks, murals, roofs, rooms
import { Atmos } from '../render/atmos.js';    // drifting leaves and petals, steam
import { batchSolids } from '../city/districts/home/kit.js';
import { installTrees } from '../city/props_trees.js';   // detailed tree species: swaps the stock trees, LOD + wind

export const W = 230, D = 180;
export const DISTRICTS = {
  wharf: [0, 0, 230, 20],
  park: [0, 32, 104, 98],
  chinatown: [116, 32, 230, 98],
  home: [0, 110, 104, 180],
  downtown: [116, 110, 230, 180],
};

export function build({ mood, stage }) {
  const C = new CityBuilder(W, D, { night: mood === 'night' });
  const REC = record(C);   // streets, sidewalks, crossings, windows and doors, for the dressing pass at the end
  // ---- avenues: asphalt between 2 m sidewalks of scored concrete slabs, zebra crossings at the junctions, lamps and trees
  const slab = TX.slabs('#c9c4ba');
  const avenue = (x0, z0, x1, z1, dir) => {
    if (dir === 'x') { C.sidewalk(x0, z0, x1, z0 + 2, { tex: slab }); C.street(x0, z0 + 2, x1, z1 - 2, { dir: 'x' }); C.sidewalk(x0, z1 - 2, x1, z1, { tex: slab }); }
    else { C.sidewalk(x0, z0, x0 + 2, z1, { tex: slab }); C.street(x0 + 2, z0, x1 - 2, z1, { dir: 'z' }); C.sidewalk(x1 - 2, z0, x1, z1, { tex: slab }); }
  };
  avenue(0, 20, 104, 32, 'x'); avenue(116, 20, W, 32, 'x');
  avenue(0, 98, 104, 110, 'x'); avenue(116, 98, W, 110, 'x');
  avenue(104, 32, 116, 98, 'z'); avenue(104, 110, 116, D, 'z');
  // the two junctions with Van Ness: plain asphalt + crossings on all four sides
  for (const [z0, z1] of [[20, 32], [98, 110]]) {
    C.street(104, z0 + 2, 116, z1 - 2, { line: false }); C.sidewalk(104, z0, 116, z0 + 2, { tex: slab }); C.sidewalk(104, z1 - 2, 116, z1, { tex: slab });
    C.crossing(104.5, z0 + 2, 106.5, z1 - 2, 'z'); C.crossing(113.5, z0 + 2, 115.5, z1 - 2, 'z');
    C.crossing(106, z0 + 2.2, 114, z0 + 3.8, 'x'); C.crossing(106, z1 - 3.8, 114, z1 - 2.2, 'x');
  }
  C.street(104, 2, 116, 20, { line: false }); // Van Ness runs out onto the promenade (closed to cars)
  // lamps and street trees along the avenues
  for (let x = 6; x < W; x += 14) { if (x > 100 && x < 120) continue; C.prop('lamp', x, 21, { yaw: Math.PI }); C.prop('lamp', x + 7, 109); if ((x / 14) % 2 < 1) { C.prop((x / 28) % 2 < 1 ? 'tree' : 'treeB', x + 3.5, 31, { light: false, yaw: x }); C.prop((x / 28) % 2 < 1 ? 'treeB' : 'tree', x + 10.5, 99.2, { yaw: x * 0.7 }); } }
  for (let z = 38; z < D; z += 14) { if (z > 94 && z < 114) continue; C.prop('lamp', 105, z); C.prop('lamp', 115, z + 7, { yaw: Math.PI }); }
  C.prop('hydrant', 101.5, 31); C.prop('mailbox', 118.5, 33); C.prop('bin', 117.6, 97); C.prop('bench', 60, 109.2, { yaw: Math.PI }); C.prop('bench', 160, 109.2, { yaw: Math.PI });
  // ---- districts
  const ctx = { mood, night: mood === 'night', stage, W, D };
  // plain solid-colour boxes (trim, posts, little props) merge into one vertex-coloured mesh per group, so the
  // districts' fine detail costs a draw call per group instead of one per colour (Sunset Row batches its own)
  const batched = (fn) => { const finish = batchSolids(C); try { fn(); } finally { finish(null); } };
  batched(() => wharf.build(C, DISTRICTS.wharf, ctx));
  batched(() => park.build(C, DISTRICTS.park, ctx));
  batched(() => caveMouth.build(C));   // [cave] the mine portal on the hill's north flank (after the park: it clears its own footprint)
  batched(() => chinatown.build(C, DISTRICTS.chinatown, ctx));
  home.build(C, DISTRICTS.home, ctx);
  batched(() => downtown.build(C, DISTRICTS.downtown, ctx));
  // ---- the dressing pass: façade + roof detail, ground decals, kerbside clutter, wires (src/vx/city/dress.js)
  const dressed = typeof location !== 'undefined' && /[?&]nodress=1/.test(location.search) ? null : dress(C, REC, ctx);
  // ---- the density pass (src/vx/city/fill.js; ?nofill=1 skips it)
  const filled = typeof location !== 'undefined' && /[?&]nofill=1/.test(location.search) ? null : fill(C, REC);
  // ---- zones for the avenues (districts set their own)
  C.zone('Bay Street', 0, 20, W, 32, { label: 'Bay Street', sub: 'San Francisco', music: 'city', bed: 'street' });
  C.zone('Market Street', 0, 98, W, 110, { label: 'Market Street', sub: 'San Francisco', music: 'vibes', bed: 'street' });
  C.zone('Van Ness', 104, 32, 116, 98, { label: 'Van Ness Avenue', sub: 'San Francisco', music: 'city', bed: 'street' });
  C.zone('Van Ness S', 104, 110, 116, D, { label: 'Van Ness Avenue', sub: 'San Francisco', music: 'city', bed: 'street' });
  // the edges of the map
  C.nav.block(0, 0, W, 0.5); C.nav.block(0, D - 0.5, W, D); C.nav.block(0, 0, 0.5, D); C.nav.block(W - 0.5, 0, W, D);
  if (!C.spots.start) C.spot('start', 110, 104, 0);
  installTrees(C);   // the stock 'tree' / 'treeB' / 'palm' become detailed species (props_trees.js)
  const city = C.finalize(stage);
  city.dressed = dressed; city.filled = filled;
  // the air: leaves and petals drifting round the camera, steam from stalls and vents (render/atmos.js)
  if (!(typeof location !== 'undefined' && /[?&]noatmos=1/.test(location.search))) {
    const atm = new Atmos(C.atmos || {}), day = { day: 1, golden: 0.9, dusk: 0.55, night: 0.3 }[mood] ?? 1;
    city.root.add(atm.group);
    C.updaters.push((dt) => { const st = globalThis.__app && globalThis.__app.stage; if (st) atm.update(dt, st.cam, st.h || 720, day); });
  }
  // cut-out pixel decals (the dressing atlases): hard alpha edges, so stains, streaks and gratings sit on any surface
  city.root.traverse((o) => { const m = o.material; if (o.isMesh && m && m.map && m.map.userData && m.map.userData.cutout && !m.alphaTest) { m.alphaTest = 0.5; m.needsUpdate = true; } });
  const view = { target: [110, 1, 104], dist: 36, yaw: 45, pitch: 40 };
  return { city, view, spots: city.spots, lamps: city.lamps };
}
