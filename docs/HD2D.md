# Tokonmon — HD-2D edition (how it fits together)

Open `index.html` (the old voxel build is kept as `legacy.html`). Add `?flat=1` to skip the 3D diorama, `?ss=2` for cheaper creature rendering on slow GPUs.

## Creatures: 3D models rendered as pixel art (`src/px/sdf.js`)
- **Models.** Each Tokonmon is a smooth 3D model built from signed-distance shapes (ellipsoids, round cones, tori, boxes) hung on named bones.
  - Files: `src/data/sprites/sdf_*.js`.
  - Format: see the header of `sdf.js`; the starters are the reference examples.
- **Rendering.** The GPU raymarches the model with 3×3 supersampling. The G-buffer is then shaded like hand-made pixel art:
  - hue-shifted bands with light from the top-left;
  - self-shadows and ambient occlusion;
  - rim light and gloss;
  - heat-ramped fire for emissive materials;
  - painted eyes and markings that wrap the surface;
  - selective outlines;
  - a transparent "glass" pass for things like Bubblion's water ball.
- **Animation.** Every facing direction and every clip comes from the same model: idle, walk, run, attack, breath, dash, throw, cast, hurt, faint, buff, happy, sleep, eat.
  - Poses animate parts by name: `body`, `head`, `leg*`, `wing*`, `tail*`, `crest/hood/tuft…`, `jaw`.
  - FX parts are switched on by show flags: `fire*`, `heart*`, `zz*`, `aura*`, `dashfire*`, `steam*`.
- **Previews:**
  - `tools/sdf.html?mod=…&id=…&dirs=1` shows the 8 facings.
  - `tools/sheet.html?id=…` shows a reference-style character sheet.
- **In game.** `src/px/game/mon.js` renders frames lazily per (clip, facing, frame) with a per-frame budget, animated on twos.

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
