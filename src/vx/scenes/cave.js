// The Deep Cave under Alamo Hill: its own walkable map (128 × 104 m), built with the city engine — the
// CityBuilder's pixel-textured quads, the nav grid, interactables, zones — so the third-person controls, the
// follow camera, battles and cutscenes all work exactly as in the city. Layout and geometry:
// src/vx/city/districts/cave_build.js (+ cave_geo.js, cave_tex.js); gameplay: src/vx/game/cave.js.
// The way in is on Alamo Hill (src/vx/city/districts/cave_mouth.js); LOCATIONS.cave (game/locations.js).
import { CityBuilder } from '../city/build.js';
import { buildCave, postCave, W, D, SPOT } from '../city/districts/cave_build.js';
import * as G from '../game/cave.js';

export async function prepare() { G.registerMood(); }

export function build({ stage, app }) {
  G.registerMood();
  const C = new CityBuilder(W, D, { night: true });
  C.skirt = false; C.merge = false;          // no city skirt round the edges; nothing to merge
  const built = buildCave(C);
  const hooks = G.addInteractables(C, built, app || globalThis.__app);
  const city = C.finalize(stage);
  postCave(city, stage, built);
  city.cave = built;
  hooks.attach(city);
  const view = { target: [SPOT.start[0], 1.4, SPOT.start[1] - 3], dist: 8, yaw: 0, pitch: 18 };
  return { city, view, spots: city.spots, lamps: [], cave: built };
}
