# TOKONMON — Osaka 2050

*A creature RPG in hand-pixeled HD-2D, set in a neon-soaked, futuristic Osaka.*

Meet your partner Tokonmon in the old plaza under Tsutenkaku, bond with it through your soul-stone
bracelet and fight real-time tactical battles. Stand up to the metal punks of Team Metallica and
climb the Osaka League to face the Beatles (the Elite Four) and Queen (the Champions). Your phone is
your whole life: team, bag, map, friends, League rank.

Everything is generated in code, and there are no image or audio assets and no build step:
- every Tokonmon is real pixel art drawn by a small painter;
- the streets are painted pixel scenes standing in a lit 3D diorama;
- the pixel UI;
- all music and sound effects.

## Play it

It's a static site:

```bash
npm start            # serves the repo at http://localhost:8080
# or: python3 -m http.server 8080
```

Or play it straight from the branch:

**https://raw.githack.com/PukkingDragon123/Animal/claude/bold-bardeen-ojasju/index.html**

Add `?flat=1` to skip the 3D diorama and draw the scenes flat (for very old GPUs).

### Controls

| | Touch / mouse | Keyboard |
|---|---|---|
| Walk | Tap the ground | WASD / arrows (hold **Shift** to run) |
| Talk / interact | Tap the bubble | **E**, **Space** or **Enter** near it |
| Phone | Phone button | **Tab** |
| Battle: skills | Skill keys | **1**–**4** |
| Battle: attack, dodge | Buttons | **Space**, **Shift** |
| Battle: bond / ultimate, emote | Buttons | **B** / **F**, **E** |
| Battle: item, catch, run | Buttons | **Q**, **C**, **R** |

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
