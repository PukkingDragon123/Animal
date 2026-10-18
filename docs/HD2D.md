# Tokonmon — HD-2D edition (how it fits together)

Open `index.html`. Add `?flat=1` to skip the 3D diorama.

## Creatures: hand-pixel art (`src/px/pixmon.js`)
- **Designs.** Each Tokonmon is a `draw(P, m)` function in `src/data/sprites/pix_*.js`. It paints the creature from parts:
  - ellipses, inflated polygons, tapered tubes and flame tongues;
  - hand-placed pixel `stamp`s for eyes, mouths, highlights and markings.

  The starters (`pix_starters.js`) are the reference examples.
- **Shading.** Every part is cel-shaded in four hand-picked, hue-shifted tones from its material ramp, with light from the upper left:
  - round parts shade like spheres;
  - any other shape is inflated from its silhouette;
  - flames and glows are shaded by distance from their edge (hot core, cooler rim).
- **Line work.** A part drawn in front of another part gets a contour line. The silhouette gets a selective outline: dark at the bottom right, softer on the lit side. Lone pixels in the shading are cleaned up.
- **Animation.** `motion(clip, frame)` turns each clip into whole-pixel pose values (bob, squash, lean, eyes, mouth, arm pose, steps, effects) that the design reads:
  - clips: idle, walk, run, attack, breath, dash, throw, cast, hurt, faint, buff, happy, sleep, eat;
  - shared effects live in `FX`: element breath, sparkles, Zzz, steam, hearts, hits, auras, dash lines.
- **Views.** A 3/4 front view and a back view are drawn facing left and mirrored for the other side.
  - Scale ≥ 0.9 doubles the pixels.
  - Small scales give a head-and-shoulders icon crop (pixel art is never shrunk).
- **Previews.** `tools/pix.html?mod=pix_starters&id=chilichick&clips=idle,walk&views=front,back&zoom=6`.
- **In game.** `src/px/game/mon.js` renders frames lazily per (clip, facing, frame), animated on twos.

## Places: painted pixel art (`src/px/paint.js`, `src/px/props.js`, `src/px/scene2d.js`)
- Scenes are painted procedurally in the Eastward style:
  - a warm master palette, with lit top/left edges and darker bottom/right edges;
  - outlines in a darker shade of the local colour (never pure black);
  - grime streaks;
  - props built as sprites (facades, signs, awnings, trees, poles…).
- Each map lives in `src/data/scenes/*.js` and returns a `Scene2D`:
  - painted ground and an overlay layer;
  - sprites anchored at their ground point;
  - glows;
  - `terrain` bands (floors and walls between levels);
  - `wires3d`.

## The diorama: 2D art on a lit 3D set (`src/px/stage3d.js`)
- **Geometry.** The painted ground becomes terraced floors with vertical walls.
- **Billboards.** Every prop and creature stands up as a camera-facing card:
  - it casts a real shadow from its silhouette;
  - it sits on a soft contact shadow.
- **Lighting.** A low golden sun lights the day. At night, glows become point lights (lantern pools, neon spill).
- **Camera.** A narrow perspective lens gives the diorama depth.
- **Exact placement.** The mapping is set up so that, from the default camera, every pixel lands where it was painted.
- **Post pass.** `src/px/hd2d.js` adds tilt-shift depth of field, bloom, light shafts, a violet/warm grade, vignette and grain. Ambient particles come from `src/px/ambient.js`.

## The game shell (`src/px/game/`)
- `app.js`: two canvases (the HD-2D stage plus a crisp pixel UI), whole-number scaling, input, loop, travel, shops, meals.
- `ui.js`: pixel UI kit:
  - chunky keys with a pressing lip, riveted panels, slanted banners, glossy bars, icons;
  - typewriter dialogue with voice babble, choices, toasts.
- `world.js`: you explore as your partner Tokonmon. The player is never shown.
  - tap-to-walk with A*, or keys;
  - hotspots and exits;
  - wandering and wild Tokonmon (bump into one to battle, and catch it with a Tamer License).
- `battle.js`: the real-time sim (`src/battle/sim.js`) staged on the current map:
  - orders with delay, bond, ultimates, switch, emotes and items;
  - allies and multiple foes;
  - wild catch and run;
  - stadium clock with halftime arena choice;
  - pixel FX and damage pops.
- `phone.js`: the main UI. Apps: Team, Bag, Map, Dex, League, Friends, Save, Settings.
- `story.js`: title, intro, starter choice, and the Chapter 1 beats (`onArrive(mapId)` adds story hotspots and NPCs per beat).
- `maps.js`: the gameplay layer of each map (walk polygons, blockers, spawns, hotspots, exits, wild areas). Optional maps load if present.
