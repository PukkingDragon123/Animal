// Sunset Row — the player's home neighbourhood: a quiet residential hill of pastel Victorian row houses south
// of Market Street. Two east–west streets (Cypress Lane and Sunset Row) run to Van Ness, Lark Lane climbs up
// to Market Street, and the family home sits on Sunset Row facing the little park.
//
//   x: 0 ──────────── 44 ┃Lark┃ 54 ──────────────────────────── 104 (Van Ness)
//   z 110–126  row A: houses facing south (Milo's house at x 55–64)
//   z 126–136  CYPRESS LANE
//   z 136–156  row B: back yards, houses (HOME at x 56–70, Mrs. Ochoa x 34–43, Corner Market x 94–104)
//   z 156–166  SUNSET ROW
//   z 166–180  pocket park, community garden, more houses
import { TX } from '../build.js';
import { buildHome } from './home/house.js';
import { buildStreet } from './home/street.js';
import * as K from './home/kit.js';

export function build(C, [x0, z0, x1, z1], ctx = {}) {
  // lawn everywhere except under the asphalt (two quads at the same height would flicker)
  const g = TX.grass('#6aa858');
  for (const [a, b, c, d] of [[x0, z0, 46, 128], [52, z0, x1, 128], [x0, 134, 46, 158], [52, 134, x1, 158], [x0, 164, x1, z1]]) C.ground(a, b, c, d, g);
  // the district zone first: houses and shops add their own zones on top
  C.zone('home', x0, z0, x1, z1, { label: 'Sunset Row', sub: 'San Francisco', music: 'lofi', bed: 'birds', step: 'step_concrete' });
  const finish = K.batchSolids(C);
  let B;
  try { buildStreet(C, [x0, z0, x1, z1], ctx); B = buildHome(C, ctx); }
  finally { finish(B || C.buildings[C.buildings.length - 1]); }
  return B;
}
