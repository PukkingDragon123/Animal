# Tokonmon modeling guide

Every Tokonmon, character and prop is **generated from code** as a list of SDF
primitives (`src/gfx/voxel.js`), turned into a rigged `THREE.Group` by
`src/gfx/model.js` and animated procedurally by `src/gfx/anim.js`.

## The 2D pixel-art anime look (read first)

The whole game renders through a **pixel-art pipeline** (`src/gfx/pixel.js`):
- **Resolution:** the 3D scene is drawn at ~320–360 "art pixels" tall, then upscaled crisply.
- **Shading:** **hard cel shading** with 2–3 bands and hue-shifted purple shadows, plus a crisp rim.
- **Outlines:** **1-pixel selective outlines** wherever depth jumps, a darkened version of the surface colour.
- **Depth:** HD-2D depth of field.
- **Animation:** poses update in steps at 12 fps ("on twos"), so 3D models move like 2D animation.

What that means for designs:
- **Tokonmon and characters use the smooth surface** (`mesh: 'smooth'` is the default for every design whose `arch` isn't `'static'`):
  - the SDF is meshed with surface nets, so you get clean anime silhouettes instead of blocks;
  - every quad still takes the **flat colour of its voxel**, so colour regions stay crisp like pixel art.
  - Props/buildings (`arch: 'static'`) stay voxel unless you set `mesh: 'smooth'`.
- **Design for readability at pixel scale.** In the overworld a 1 m Tokonmon is ~32 art pixels tall; in battle close-ups ~90–140 px.
  - **Silhouette** is king: big shapes, 2–4 main colours, one strong accent.
  - **Eyes** are pixel decals, so make them big and expressive.
- **Gaps:** shapes thinner than ~0.7 `vs` vanish. Keep the shapes that matter ≥ 1 voxel apart.
- `blend: k` (metres) on a shape **smooth-unions** it with everything before it in the part (soft organic joins: cheeks into head, tail into body). It works with `sub` too, giving soft carving.
- **2D models:**
  - Every design is also baked into **2D pixel sprites** by `src/gfx/bake.js`: an orthographic, cel-lit render with inner selective outlines, an outer ink outline and a transparent background.
  - These are used on the phone (scan, team, dex), in portraits and cut-ins, and for all human characters in the world (`src/gfx/sprite.js`).
  - Check them with `tools/sprites.html`.

## Units & conventions

* 1 world unit = **1 metre**. Ground is `y = 0`. Models face **+z**. Model's
  **left = +x** (parts ending in `L` live at +x, their mirrors `R` at −x).
* Model space coordinates are **absolute** (like modeling in MagicaVoxel): every
  shape of every part is written in the same space at rest pose. A part's `p` is
  its **pivot / joint** in that same space (shoulder, hip, neck, tail root…).
* Pick `vs` (voxel size) so the model is ~30–48 voxels tall (smooth surfaces look
  better with a bit more resolution): base forms `0.018–0.026`, mid forms `0.026–0.035`,
  finals `0.035–0.05`, chibi humans `0.03–0.036`, legendaries `0.08–0.16`, props
  whatever reads well (~0.05–0.12).
* Sizes: starters base 0.55–0.9 m tall, mid 1.0–1.5 m, final 1.6–2.6 m; humans
  ~1.55–1.8 m (chibi: head ≈ 1/3 of height); legendaries 5–12 m.
* Budgets (`tpl.faces`, printed by the viewer): base ≤ 9k, mid ≤ 14k, final ≤ 20k,
  human ≤ 8k, legendary ≤ 45k, small props ≤ 2.5k.

## Bonding overlay, trainer accessories, Elemental Form

```js
bond: {                                   // shown while the Tokonmon is BONDED with its trainer
  parts: [ { n: 'bubbleShell', parent: 'body', p: [...], s: [...] } ],   // extra parts, hidden until bonded
  grow: { hornL: 1.7, hornR: 1.7 },       // part → scale while bonded (expanding horns, puffed fur, bigger crest…)
  hat: { part: 'head', at: [x, y, z], scale: 1, tilt: 0, roll: 0 },      // where the trainer's hat/accessory sits
  aura: 'flame'|'bubbles'|'petals'|'sparks'|'notes'|'leaves', auraColor: [r,g,b,1],
},
forms: {
  elemental: {                            // final evolutions: full Elemental Form (special form)
    pal: { b: '#…' },                     // palette overrides (glowing/elemental recolour)
    parts: [ … ],                         // extra parts (flame wings, water crown, flower mantle…)
    eyes: { iris: '#…', style: 'fierce' },
    fx: [ … ], anim: { hover: 0.2 },
  },
},
```
- **Bonding** (`Actor.setBond(true)`) reveals `bond.parts`, grows `bond.grow` parts and emits the aura. The trainer's hat is attached at `bond.hat` with `Actor.wearHat(design)`.
- **Elemental Form** (`Actor.setForm('elemental')`) swaps to the derived design: palette overrides plus extra parts, with the bond overlay kept on.
- Design both so that each is unmistakable at small size.

## Design object

```js
{
  vs: 0.026,                  // voxel size
  arch: 'quad',               // animation archetype (see below)
  pal: { b: '#ff6a2b', l: '#ffd9a0', k: '#3a1408' },   // palette keys → colours
  anim: { quirk: ['shakeoff','sniff'], bounce: 1.2, gait: 1, stride: 1, tail: 1, hover: 0, flap: 1, maxSpeed: 4 },
  parts: [
    { n: 'body', p: [0, 0.3, 0], s: [ /* shapes */ ] },
    { n: 'head', parent: 'body', p: [0, 0.42, 0.2], s: [ ... ] },
    { n: 'legFL', parent: 'body', p: [0.13, 0.24, 0.17], mirror: true, s: [ ... ] }, // auto-creates legFR at −x
    { n: 'tail', parent: 'body', p: [0, 0.3, -0.26], s: [ ... ] },
    { n: 'tail2', parent: 'tail', p: [0, 0.37, -0.47], s: [ ... ], sway: { axis: 'z', amp: 0.2, freq: 2 } },
  ],
  eyes:  { part: 'head', at: [0.1, 0.56, 0.42], dir: [0.45, 0.05, 1], style: 'anime', iris: '#ffb12b', px: 0.8 },
  mouth: { part: 'head', at: [0, 0.45, 0.49], dir: [0, -0.2, 1], style: 'fang', px: 0.6 },
  decals: [ { part: 'body', at: [...], dir: [...], rows: ['.kk.', 'k..k'], cmap: { k: '#222' }, px: 1, mirror: false } ],
  fx: [ { part: 'tail2', at: [0, 0.66, -0.62], type: 'flame', rate: 1, scale: 1 } ],
}
```

### Parts
* `n` name (bone), `parent` (default: root), `p` pivot, `s` shapes.
* `mirror: true` duplicates the part at −x (name `…L` → `…R`; children of mirrored
  parents are re-parented automatically).
* Overlapping cells belong to the **first part listed** (parents first). Use
  `over: true` on a part to claim cells anyway. AO is computed from the union of
  all parts, so junctions get crevice shading.
* `sway: {axis:'x'|'y'|'z', amp, freq, phase, move}` continuous secondary motion
  (flames, hair, antennae, fins). `spin: {axis, speed}` continuous rotation
  (rings, halos, vinyl discs). `hide: true` hides a part (variants).

### Bone names the animator understands (all optional)
`body, neck, head, jaw, earL/R, tail, tail2…tail7, legFL/FR/BL/BR (quad),
legL/R (biped), legFL/ML/BL + R (insect, 6 legs), armL/R, wingL/R, finL/R,
tent1…tentN (tentacles), antL/R (antennae), seg1…segN (serpent body)`.
Arms hang down at rest; legs point down; wings spread sideways at rest.

### Archetypes (`arch`)
`quad` (4 legs trot) · `biped` (legs + arms) · `hopper` (rabbit hop) · `serpent`
(seg chain) · `flyer` (wings flap, hovers; set `anim.hover` in metres) ·
`floater` (ghosts, blobs that bob) · `swimmer` (fish/sharks, tail chain) ·
`insect` (6 legs tripod gait, wings buzz) · `octo` (tentacles) · `blob` (bouncy).

### Shapes (all coordinates in model space)
| tuple | meaning |
|---|---|
| `['sph', c, r, col, opts]` | sphere |
| `['ell', c, [rx,ry,rz], col, opts]` | ellipsoid |
| `['box', c, [hx,hy,hz], col, opts]` | box (half extents), `opts.round` corner radius |
| `['cap', a, b, r0, r1, col, opts]` | tapered capsule / round cone from a (r0) to b (r1) |
| `['cyl', a, b, r, col, opts]` | cylinder |
| `['tor', c, R, r, col, opts]` | torus, `opts.axis` `'x'|'y'|'z'` (default y) |
| `['poly', c, [[u,v]…], halfThick, col, opts]` | extruded 2D polygon; `opts.plane` `'xy'` (extrude z), `'zy'` (extrude x), `'xz'` (extrude y) |

`col` is a palette key or `'#hex'`. Shapes are applied **in order**; later shapes
overwrite earlier colours where they overlap.

Options (`opts`):
* `m: 1` mirror across x (adds the −x copy) · `rot: [x,y,z]` degrees
* `sub: 1` carve (remove voxels) · `paint: 1` recolour existing voxels only (markings,
  bellies, masks — never adds volume) · `under: 1` only fill empty cells
* `glow: 1..3` emissive (blooms; 2 is a good default for flames/neon/eyes)
* `belly: key` paint downward-facing surface (`bellyT` threshold, default .25);
  `top`, `front`, `back`, `side` likewise (thresholds `topT`, `frontT`…)
* `stripes: {axis, p: period, w: width, col, o: offset}` · `spots: {col, d: density 0..1, s: scale(m), seed}`
* `grad: {axis, to: key, a, b}` colour gradient along an axis between coords a→b
* `dither: {col, amt}` random speckle of a second colour (fur, stone, rust)
* `tip: key, tipT: .7` colour the far end of a capsule (paws, ear tips, horn tips)
* `noise: amp (m), noiseScale` organic lumpy surface (rock, fur tufts, moss)
* `fat: r` grow the shape · `jit: .07` colour jitter (0 for clean flat surfaces)

### Faces
* Eye `style`: `anime` (5×5, default), `big` (6×6), `round` (4×4), `bead` (2×2), `dot`,
  `sharp`, `fierce`, `sleepy`, `tall`, `cyclops` (8×8 single eye — use
  `mirror:false`), `visor` (glowing band), `goggle`, `star`.
  `iris` colour, `px` = decal pixel size as a multiple of `vs` (0.6–1.0),
  `mirror: false` for a single centred eye, `cmap` to override colours
  (`k` outline, `w` highlight, `i` iris, `s` sclera, `g` glowing iris, `m` goggle rim).
  Expressions (happy ^ ^, closed, hurt > <, KO x x, angry, sad) are generated
  automatically from the base pattern — make sure the eye sits on a fairly flat
  patch of the head and faces outward (`dir`). The decal is snapped to the
  surface by ray-marching back along `dir`, so `at` only needs to be near it.
* Mouth `style`: `cat` (ω), `line`, `smile`, `fang`, `grin`, `beak` (open only —
  model the beak in voxels), `tiny`, `w`, `zig` (shark teeth), `lips` (big red
  lips), `none`. Open variants are shown while talking/attacking.
* `decals` are static pixel patterns (emblems, markings, glasses lenses, numbers).

### Particle emitters (`fx`)
`flame, ember, smoke, steam, drip, bubble, spore, leaf, petal, spark, note, dust,
snow, glow, star, wisp, rift, gem, zz` — `{part, at (model space), type, rate,
scale, color?, mirror?}`.

### Animation params (`anim`)
`quirk` idle personality actions picked at random every 5–12 s from:
`headbang, spin, stretch, scratch, shakeoff, hop, sniff, flex, sway, roar, happy, nod`.
`bounce` (bob amount), `gait` (cadence), `stride` (leg swing), `tail` (tail sway),
`hover` (flyers/floaters lift, metres), `flap` (wing speed), `maxSpeed` (m/s),
`dodgeSpin` (turns during dodge), `scale`.

## Review workflow

All tools render through the same pixel pipeline as the game.

```bash
# 2D sprites: animation sheets (idle/walk/run/talk/emotes) at 4× zoom, plus a UI still
node tools/shot.mjs "tools/sprites.html?mod=../src/data/designs/starters.js&id=chilichick&anims=idle,walk,wave&still=1" out.png 1400 900 ready 150000
# Bonding / Elemental Form previews in the design sheet: &bond=1  &form=elemental  &hat=cap
# multi-angle render of one design (front ¾, side, back) → PNG
node tools/shot.mjs "tools/design.html?mod=../src/data/designs/starters.js&id=kindoru" out.png 1200 500 ready 120000
# all designs in a module side by side
node tools/shot.mjs "tools/design.html?mod=../src/data/designs/starters.js&all=1&views=1" out.png 1600 600 ready 180000
# pose checks: &act=attack&t=0.2   &mode=sleep   &speed=3 (walk cycle)   &h=21 (night)
```
The label at the bottom prints faces, height and build time per design.
Look at the PNG (Read tool) and iterate until it reads clearly at small size
**and** close up: strong silhouette, 2–4 main colours + accents, big readable
eyes, details that suggest the creature's element.
