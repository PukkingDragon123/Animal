# Art style

The look is low-poly anime with detailed painted textures, in the spirit of late PS2/PSP anime games.

## People: `src/vx/people/anime.js`
- **Body:** tall, stylized figures made of faceted lofted tubes (`tube()`) and hair locks (`lock()`), a few hundred triangles each. Proportions are anime: long legs, chunky sneakers, oversized hoodies.
- **Textures:** hand-painted with Canvas2D and smooth-filtered: soft baked shading, folds, seams, ribbing and prints.
- **Face:** a front-projected layer that repaints itself per expression:
  - eyes: open, closed, happy, angry, sad, wide, half, smug
  - gaze darts: c, l, r, u, d, ul, ur
  - brows, nine mouths, beards, glasses, freckles and a soft blush
- **Rig:** the person.js rig plus shins and forearms. The shared acting clips live in `person.js`: idle (with glances), talk, walk, run, wave, point, cheer, think, shock, angry, laugh, sad, phone, throw, sit, sitPhone, sitSad, nod, shrug, facepalm, proud, shy, jump.
- **Recipes:** `src/vx/people/cast.js`. Trainers wear their partner Tokonmon's colours.
- **Viewer:** `tools/lineup.html?people=hero,yumi&anime=1`. `?people=box` in the game brings back the old box people.

## Tokonmon: `src/vx/mons/*.js`
- Cobblemon-style box models with painted textures; see `docs/MODELS.md`.
- **Eyes:** full-resolution hand-drawn `pix` maps, unique per species and Pokémon-like.
  - Avoid "bullseye" eyes made of concentric rings.
  - 3D eyeballs are fine where they suit; Weirdfin's bulging deep-sea eyes are the example.
- **Drip:** three tiers of accessories with options per tier. The ultra-drip form is black and gold, with blue fire.

## Print art: `src/vx/posters.js`
Never pixel art: posters, ads and packaging are composited from real 3D renders of the Tokonmon.
- `monShot(stage, id, { clip, t, yaw, drip })`: an offscreen render, sticker-cut (ink line plus white border).
- `paintPoster(canvas, stage, spec)`: the layout. Portrait posters and wide banners, murals and ads, with sunburst, halftone, display type, tape and paper grain.
- `posterDecal(stage, slot)`: hangs a poster on a wall. Scenes export `posterSlots`, and the world fills them through `posterFor()`.
- `packBox(stage, { …, pack: PACKS.chiliFlakes })`: 3D product boxes with printed fronts.
- Title key art: `src/vx/game/keyart.js`.

## World
- Scenes are currently voxel dioramas (`src/vx/scenes`). Low-poly scenes are coming, starting with the apartment, built on the `src/vx/lp/` kit.
- A scene can keep its voxels only for navigation and hide them with `hideVox`.
- Text signs use real fonts at 96+ px per metre.
