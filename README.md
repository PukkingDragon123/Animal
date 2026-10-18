# TOKONMON — San Francisco

*A creature RPG in detailed voxel dioramas, set in present-day San Francisco.*

You grow up above your grandma's bakery in Chinatown. One morning a furious little Chilichick tears
down Grant Avenue with a stolen bottle of hot sauce, Coach Gonda hands out partners, and your rival
Kaito wants a fight. From then on your TokoPhone map is the city: Alamo Square and the Painted Ladies,
Pier 39 and its sea-lion king, Golden Gate Park, the bridge in the fog, and a rooftop showdown with
the Elite Four.

Every Tokonmon is an original homage to a music artist and their album covers — Guns N' Roses
pigeons, an AC/DC trash raccoon that ends up on a scrap bike, a graduation bear, a Foo Fighters
mantis shrimp, a Biggie-inspired sea lion, the Fab Four, and many more (see `docs/ROSTER.md`).

Everything is generated in code, and there are no image or audio assets and no build step:
- the world is built from 12.5 cm voxels, with painted 2D leaves, grass, lanterns, posters and signs mixed in;
- Tokonmon are Cobblemon-style box models with pixel textures painted in code and bouncy, hand-tuned animation;
- the people are blocky chibis with painted faces, outfits and accessories;
- the look is cel shading with ink outlines, wind in the grass and HD-2D post effects;
- all music and sound effects.

## Play it

It's a static site:

```bash
npm start            # serves the repo at http://localhost:8080
# or: python3 -m http.server 8080
```

Or play it straight from the branch:

**https://raw.githack.com/PukkingDragon123/Animal/claude/bold-bardeen-ojasju/index.html**

Options: `?res=1200` renders the 3D view at a lower resolution (faster), `?shadow=2048` uses smaller
shadow maps, `?ink=0` turns the outlines off, `?loc=alamo` jumps straight to a place.

The game is told in camera shots and cutscenes; tap dialogue to advance, tap the glowing markers in
each place, and open the phone (**Tab**) to travel. In battle, choose **ATTACK** (**1**) or **SPECIAL** (**2**).

## Tools

- `tools/vx.html?scene=alamo&mood=golden|night&toon=1&live=1` — preview a voxel diorama (live: wind and lanterns move);
- `tools/mon.html?mon=chilichick&clip=cry&sheet=8` — a Tokonmon model, any clip, as a frame sheet or `atlas=1`;
- `tools/lineup.html?people=hero,coach,mika&mons=chilichick` — the cast side by side;
- `docs/MODELS.md` — how to author a Tokonmon; `docs/ROSTER.md` — the roster and its homages.

## The earlier 2D edition

The previous hand-pixeled HD-2D edition (Osaka 2050) still runs from `play.html`.

## How it's made

- **Tokonmon are pixel art** (`src/px/pixmon.js`, designs in `src/data/sprites/pix_*.js`). Each frame is painted from a few parts:
  - every part is cel-shaded in four hand-picked, hue-shifted tones, with light from the upper left;
  - parts drawn in front get contour lines;
  - the silhouette gets a selective outline;
  - eyes, mouths and markings are hand-placed pixel stamps.

  Every clip (idle, walk, run, attack, breath, dash, throw, cast, hurt, faint, buff, happy, sleep, eat) is pose-driven, in a 3/4 front view and a back view. Preview them with `tools/pix.html?mod=pix_starters&clips=idle,walk&views=front,back`.
- **Places are painted pixel scenes** (`src/data/scenes/*.js`, props in `src/px/props*.js`). In the HD-2D diorama (`src/px/stage3d.js`, three.js) they become:
  - terraced floors and walls;
  - camera-facing cards that cast real sun shadows;
  - point lights at night.

  A post pass (`src/px/hd2d.js`) adds tilt-shift depth of field, bloom, light shafts and a warm grade. Preview a scene with `tools/stage.html?scene=plaza|stadium|castle_park|dotonbori&night=1`.
- **The game shell** lives in `src/px/game/`:
  - world exploration as your partner, with tap-to-walk A*;
  - battles staged on the map, on the deterministic real-time sim in `src/battle/sim.js`;
  - the phone, the story beats and the pixel UI kit.

  The architecture is in [`docs/HD2D.md`](docs/HD2D.md) and the design bible in [`docs/TOKONMON.md`](docs/TOKONMON.md).

## Tests

```bash
npm test
```

- the battle sim;
- the game rules (progression, evolution, friendship, items, time, League, quests, saves);
- content integrity: every Tokonmon design renders every clip, front and back, and every audio id the code uses exists.

`tools/playtest.mjs` plays the game headless in Chromium from a list of steps and takes screenshots.
