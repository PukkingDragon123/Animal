# Art style

The look is low-poly anime with detailed painted textures, in the spirit of late PS2/PSP anime games.

## People: `src/vx/people/human.js` + `src/vx/people/gg/`
- **Base:** the low-poly humans from Gacha Garage, ported in. One skinned mesh, one painted atlas (2× density), procedural walk with planted feet, look-at, gestures, and painted expressions with blinks and talking mouths.
- **Toon look** (`face.style >= 0.5`, everyone in the cast):
  - Ink-drawn anime faces in the PSP / low-poly-anime look: round irises with an ink ring, a pupil and a catchlight. Bold upper lash lines that hook out at the corner, with spiky lashes above and scratchy lashes below. A `:3` / `w` mouth and a tiny nose tick, with no realistic relief.
  - Blockier prisms (chamfers × 0.45), chunky sneakers, flat toon hair with a few painted strands, and a part self-lit material for the painted-texture feel.
- **Anime-girl build:** `anime: 0..1` gives a bigger head, long legs, a slim frame, small hands, side locks and big eyes.
- **Springs (non-sexual jiggle):** twin tails, ribbon bows and streamers, the ahoge and skirt flutter, all driven by root acceleration, step bounce and head turns.
- **Deco:** `face.deco` adds stickers (heart, star), rhinestones, plasters, blush hatching, face paint, scars, moles, glitter and painted tears. Other decoration: `hair.ribbon` / `hair.clip` / `hair.ahoge` / `hair.ears: 'cat' | 'fox'`.
- **Cast:** `src/vx/people/humancast.js`. Trainers wear their partner's colours. Passers-by come from the Gacha Garage street cast, pushed toward the toon look.
- **Clips:** the Animator's clip names (idle, walk, talk, wave, cheer, sit, shock, …) map onto gestures, expressions and pose overrides in `human.js`.
- **Viewer:** `tools/lineup.html?human=hero,yumi,mika`. `?people=folk` or `?people=box` in the game brings back the older people.

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
