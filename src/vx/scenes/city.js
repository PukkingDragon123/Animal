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
  // ---- avenues: asphalt between 2 m sidewalks, zebra crossings at the junctions, lamps and trees
  const avenue = (x0, z0, x1, z1, dir) => {
    if (dir === 'x') { C.sidewalk(x0, z0, x1, z0 + 2); C.street(x0, z0 + 2, x1, z1 - 2, { dir: 'x' }); C.sidewalk(x0, z1 - 2, x1, z1); }
    else { C.sidewalk(x0, z0, x0 + 2, z1); C.street(x0 + 2, z0, x1 - 2, z1, { dir: 'z' }); C.sidewalk(x1 - 2, z0, x1, z1); }
  };
  avenue(0, 20, 104, 32, 'x'); avenue(116, 20, W, 32, 'x');
  avenue(0, 98, 104, 110, 'x'); avenue(116, 98, W, 110, 'x');
  avenue(104, 32, 116, 98, 'z'); avenue(104, 110, 116, D, 'z');
  // the two junctions with Van Ness: plain asphalt + crossings on all four sides
  for (const [z0, z1] of [[20, 32], [98, 110]]) {
    C.street(104, z0 + 2, 116, z1 - 2, { line: false }); C.sidewalk(104, z0, 116, z0 + 2); C.sidewalk(104, z1 - 2, 116, z1);
    C.crossing(104.5, z0 + 2, 106.5, z1 - 2, 'z'); C.crossing(113.5, z0 + 2, 115.5, z1 - 2, 'z');
    C.crossing(106, z0 + 2.2, 114, z0 + 3.8, 'x'); C.crossing(106, z1 - 3.8, 114, z1 - 2.2, 'x');
  }
  C.street(104, 2, 116, 20, { line: false }); // Van Ness runs out onto the promenade (closed to cars)
  // lamps and street trees along the avenues
  for (let x = 6; x < W; x += 14) { if (x > 100 && x < 120) continue; C.prop('lamp', x, 21, { yaw: Math.PI }); C.prop('lamp', x + 7, 109); if ((x / 14) % 2 < 1) { C.prop('tree', x + 3.5, 31, { light: false }); C.prop('tree', x + 10.5, 99.2); } }
  for (let z = 38; z < D; z += 14) { if (z > 94 && z < 114) continue; C.prop('lamp', 105, z); C.prop('lamp', 115, z + 7, { yaw: Math.PI }); }
  C.prop('hydrant', 101.5, 31); C.prop('mailbox', 118.5, 33); C.prop('bin', 117.6, 97); C.prop('bench', 60, 109.2, { yaw: Math.PI }); C.prop('bench', 160, 109.2, { yaw: Math.PI });
  // ---- districts
  const ctx = { mood, night: mood === 'night', stage, W, D };
  wharf.build(C, DISTRICTS.wharf, ctx);
  park.build(C, DISTRICTS.park, ctx);
  chinatown.build(C, DISTRICTS.chinatown, ctx);
  home.build(C, DISTRICTS.home, ctx);
  downtown.build(C, DISTRICTS.downtown, ctx);
  // ---- zones for the avenues (districts set their own)
  C.zone('Bay Street', 0, 20, W, 32, { label: 'Bay Street', sub: 'San Francisco', music: 'city', bed: 'street' });
  C.zone('Market Street', 0, 98, W, 110, { label: 'Market Street', sub: 'San Francisco', music: 'vibes', bed: 'street' });
  C.zone('Van Ness', 104, 32, 116, 98, { label: 'Van Ness Avenue', sub: 'San Francisco', music: 'city', bed: 'street' });
  C.zone('Van Ness S', 104, 110, 116, D, { label: 'Van Ness Avenue', sub: 'San Francisco', music: 'city', bed: 'street' });
  // the edges of the map
  C.nav.block(0, 0, W, 0.5); C.nav.block(0, D - 0.5, W, D); C.nav.block(0, 0, 0.5, D); C.nav.block(W - 0.5, 0, W, D);
  if (!C.spots.start) C.spot('start', 110, 104, 0);
  const city = C.finalize(stage);
  const view = { target: [110, 1, 104], dist: 36, yaw: 45, pitch: 40 };
  return { city, view, spots: city.spots, lamps: city.lamps };
}
