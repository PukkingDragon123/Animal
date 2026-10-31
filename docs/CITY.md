# The walkable city

The city is one seamless 230 × 180 m map. You walk it in third person, Pokémon Sword/Shield style:
- **Moving:** WASD, the arrows or a gamepad's left stick, relative to the camera. Hold Shift or the pad's B (bottom) button to run. On touch screens, drag on the left half for the thumbstick (push it all the way to run), or tap the ground to walk there.
- **Camera:** it follows close behind you (about 5 m, pitch about 17°) and eases back behind you while you walk forward. To orbit it, use Q / E, a mouse drag, the right stick, L / R or a drag on the right half of a touch screen. E orbits only when no prompt is showing. C (or ZL / a stick click) recentres it. Zoom from 3.5 to 10 m with the wheel, pinch or + / -.
- **Interacting:** E, Enter, Space, the pad's A (right) button, or tap the prompt.

When a building gets between the camera and you, the camera pulls in. Whatever is still in the way fades out. Indoors, the camera frames you closer and steeper. The roof and the storeys above you vanish. So do the outer walls on the camera's side and any inner wall between the camera and you, from any angle. The building is split into per-side and per-wall pieces the first time you enter it.

Cutscenes take the camera with `world.shot()` / `setCam()` (a shot may set `fov`). The camera stays held until the story beat ends. Then the follow camera blends back in. Its framing lives in `LOCATIONS.city.follow` (`indoor` for interiors). The minimap and its compass turn with the camera.

## Files
- `src/vx/scenes/city.js`: the master plan. It holds the avenues, the district rectangles and the zones for the avenues, and it calls each district.
- `src/vx/city/districts/*.js`: one module per district. Each exports `build(C, [x0, z0, x1, z1], ctx)` and builds only inside its rectangle.
- `src/vx/city/build.js`: `CityBuilder`, the API below.
- `src/vx/city/pixtex.js`: pixel-art textures. They're nearest-filtered at 32 texels per metre and every one knows its size in metres.
- `src/vx/city/voxprops.js`: voxel-art street furniture at 16 voxels per metre, drawn as instanced meshes.
- `src/vx/city/nav.js`: the 25 cm collision and height grid per storey. It also handles stairs, zones, `move()` with wall sliding, and A* `path()`.
- `src/vx/city/control.js`: movement, the camera, the cutaway, doors, interaction prompts, the minimap and the partner following you.

### Coordinates

| Axis | Direction |
|---|---|
| x | east |
| z | south |
| y | up |

All units are metres. North (−z) is the bay. Storeys are 3 m apart: level 0 is the street and ground floors, levels 1 and 2 are upper floors.

## District map (`DISTRICTS` in scenes/city.js)

| District | Rect [x0, z0, x1, z1] | Module |
|---|---|---|
| Wharf (promenade + pier; water z 0–12) | [0, 0, 230, 20] | wharf.js |
| Alamo Hill Park | [0, 32, 104, 98] | park.js |
| Chinatown | [116, 32, 230, 98] | chinatown.js |
| Sunset Row (home) | [0, 110, 104, 180] | home.js |
| Downtown / Market | [116, 110, 230, 180] | downtown.js |

The avenues are built by city.js:

| Avenue | Runs | Rect | Sidewalks |
|---|---|---|---|
| Bay Street | east–west | z 20–32 | 2 m at z 20–22 and z 30–32 |
| Market Street | east–west | z 98–110 | — |
| Van Ness | north–south | x 104–116 | — |

The avenue sidewalks are raised 0.12 m. Junctions have zebra crossings, and lamps and trees line the avenues.

## CityBuilder API (`C`)

### Ground and surfaces
Ground is walkable unless noted, and every surface is painted on the minimap.
- `C.ground(x0, z0, x1, z1, tex, { y, walk })`: a ground patch at height `y`.
- `C.street(x0, z0, x1, z1, { dir: 'x' | 'z', line })`: asphalt with a dashed centre line.
- `C.crossing(...)`: a zebra crossing.
- `C.sidewalk(x0, z0, x1, z1, { h = 0.12, tex })`: a raised kerb block.
- `C.plinth(x0, z0, x1, z1, y, topTex, sideTex)`: raised or sunken ground, such as terraces, piers, stages or steps (`STEP` is 0.36 m).
- `C.water(x0, z0, x1, z1, { y = -0.8 })`: blocked water.

### Buildings
`C.building({ ... })` builds a whole building. Its options:
- **Footprint and size:**
  - `x, z, w, d`: the footprint.
  - `floors`: the number of storeys.
  - `fh`: the storey height, used only by non-enterable buildings. Enterable ones are always 3 m.
- **Surfaces:**
  - `wall`: a texture.
  - `trim`: a colour.
  - `base`: a colour.
  - `inner`: a texture.
- **Roof:** `roof: { type: 'flat' | 'gable' | 'hip', tex, col, h, ridge: 'x' | 'z', eave, upturn, capCol, parapet, tank }`.
- **Doors:**
  - `door: { side: 's' | 'n' | 'e' | 'w', at: 0..1, w, col, tex, kind: 'panel' | 'glass', label, act, painted }`, or several in `doors: [...]`.
  - A non-enterable building gets a painted door. If you give it `label` and `act`, it becomes an interactable (for example "Knock", or entering another map).
- **Windows:** `windows: { every, w, h, lit, frame, curtain, skip: ['n', ...] }`.
- **Façade:**
  - `bay: true`: Victorian bay windows on the south side.
  - `shop: { sign, bg, fg, awning: [colA, colB], side, frame, board }`: a shopfront with big windows, a sign board and an awning.
- **Interior:**
  - `enter: true` makes the interior walkable, with storeys at 0, 3 and 6 m. Exterior doors swing open as you approach.
  - `interior(C, B)` builds the rooms. Call the interior helpers below inside it.
  - `floorTex` / `floorTexs: [perStorey]`.
  - `step`: the footstep sound inside, e.g. `'step_carpet'`.
- `mm`: the minimap colour.

`B` has `{ id, x, z, w, d, floors, gk(k, part) }`. The `gk` group keys are `front`, `back`, `in` and `roof`.

### Interior helpers
- `C.iwall(B, k, x0, z0, x1, z1, { gaps: [{ at, w }], tex, tex2, t, h })`: an inner wall on storey k, with doorways.
- `C.stairs(B, k, x0, z0, x1, z1, dir)`: a flight from storey k to k + 1, climbing toward `dir` (`'n'` means you walk north to go up). It opens the stairwell in the floor above and adds rails.
- `C.furniture(B, k, x0, z0, x1, z1, h, tex, { top, s, n, e, w, y, collide, gk })`: a blocking furniture box. Give its faces their own textures with `s` / `n` / `e` / `w` / `top`.
- `C.box(gk, tex, x0, y0, z0, x1, y1, z1, { top, s, n, e, w, skip })`: free geometry for detailed furniture. Use `gk = B.gk(k, 'in')` for interiors, or `'ground'` / `'props'` outdoors.
- `C.quad(gk, tex, a, b, c, d, { fit })` and `C.tri(gk, tex, a, b, c)`: raw geometry.
- `C.decal(gk, tex, x, y, z, face, w, h, { off })`: a picture on a surface (poster, sign, painting, TV screen). `face` is `'s' | 'n' | 'e' | 'w'`; `fit` maps the whole texture.
- `C.nav.block(x0, z0, x1, z1, L)` / `C.nav.open(...)`: hand-tune walkability.

### Props
- `C.prop(kind, x, z, { yaw, y, L, s, collide, light })`: voxel props. The kinds are:
  - Plants: `tree`, `palm`, `bush`, `planter`
  - Lights and signs: `lamp`, `lantern` (hangs), `sign`
  - Street furniture: `bench`, `bin`, `hydrant`, `mailbox`, `bollard`, `bikeRack`, `cone`, `crate`, `parasol`
  - Machines and vehicles: `vending`, `car`, `cart`

  Add new kinds to `PROPS` in voxprops.js. Each kind needs `{ size: [X, Y, Z], r, build(F, rand) }` and is drawn with the Fine voxel API (`F.c('#hex', GLOW)`, `F.box`, `F.set`).
- `C.lanterns(x0, z0, x1, z1, y, n)`: a sagging string of lanterns.

### Gameplay hooks
- `C.interact({ x, z, L, y, r, label, icon, act: async (app, it) => {}, when: (app) => bool, mm })`: shows "[E] label" when you're near it on the same storey. Some things `act` can use:
  - `app.say(name, ...lines)`
  - `app.choose(prompt, ['A', 'B'])` → index
  - `app.toast(str, { icon })`
  - `app.audio.sfx(name)` (names in `src/audio/samples.js` `SFX_SAMPLES`)
  - `app.audio.music(id)`
  - `app.state` (the save; `app.save()`)
  - `app.world`, `app.story.*`
- `C.npc({ id, who, x, z, yaw, L, name, lines, clip })`: a resident who talks on E.
  - `who` is a cast name from `src/vx/people/humancast.js` or `'passerbyN'`.
  - `lines` is either `[...strings]`, a list of alternatives `[[...], [...]]`, or `async (app, npc) => {}`.
- `C.spot(name, x, z, yaw, L)`: named positions the story uses.
- `C.zone(name, x0, z0, x1, z1, { label, sub, music, bed, step })`: the place name and music.
  - Music ids: `lofi`, `lofi2`, `city`, `vibes`, `lemon`, `party`, `senbazuru`, `menu`
  - Ambience beds: `street`, `birds`, `cicadas`
  - Footstep sounds: `step_concrete`, `step_wood`, `step_carpet`, `step_grass`

### Textures (`TX` from build.js)
Every texture is pixel art.

| Group | Textures |
|---|---|
| Walls | `brick(base, mortar)`, `plaster(c)`, `siding(c)`, `wallpaper(base, pat)`, `concrete(c)` |
| Roofs | `roofTiles(c)`, `shingles(c)`, `metalRoof(c)` |
| Ground | `asphalt()`, `pavers(c)`, `cobble(c)`, `grass(c)`, `dirt(c)` |
| Floors | `planks(c, 'h' \| 'v')`, `tiles(a, b, size)`, `carpet(c, pat)` |
| Water | `water(c)` |
| Plain | `solid(c)`, `stripes(a, b, n)` |
| Façade pieces | `windowTex(frame, curtain, lit)`, `shopWindowTex(frame, lit, seed)`, `doorTex(col, kind)`, `garageTex(c)`, `signTex(text, bg, fg, { w, h, fs })`, `awningTex(a, b)` |

Also: `slabs(c)` (scored concrete sidewalk slabs), `roofMembrane(c)` (flat-roof bitumen), `tactile(c)` (kerb-ramp domes). Surfaces tile seamlessly; the window texture picks one of four dressings (drapes, roller blind, venetian slats, café curtain + plant) from the curtain colour.

For a custom texture, use `TX.ptex(key, wMetres, hMetres, (g, W, H, rand, P) => { ... }, { ppm })`. `P` is a pixel painter with `fill`, `rect`, `wrect` (wraps at the edges), `px`, `hline`, `vline`, `dither`, `speck`, `blob`, `crack`, `block`, `text` (crisp: thresholded, no anti-aliasing) and `tiny` (3 × 5 pixel font). For noisy surfaces use `TX.pixels(g, W, H, (x, y) => [r, g, b])` with `TX.pnoise` / `TX.fnoise` (periodic noise) and `TX.ramp` + `TX.pick` (dithered shade ramps). Use it for TV screens, posters, rugs and book spines; always paint in crisp pixel art. A texture with `userData.cutout = true` is drawn with a hard alpha test (scenes/city.js), for decals with transparent pixels.

### The dressing pass (`src/vx/city/dress.js`)
After the districts, `scenes/city.js` runs `dress(C, record)`: drainpipes, window AC units, flower boxes, grime and rain stains, meters and fire escapes on exposed façades; membrane roofs, condensers, vents, hatches, skylights, antennas, dishes, water tanks and chimneys on roofs (all in one shared atlas per building's roof group, so they fade and cut away with it); manholes, drains, patches, oil, puddles, crack sealing, arrows, gutter pans, tactile paving and tree grates on the ground (one cut-out atlas); kerbside clutter, street trees and signs, pigeons and gulls, utility poles and wires (Sunset Row) and trolley wires (Market Street). It only places things where the nav grid is open and keeps clear of doors, interactables, spots and NPCs. `?nodress=1` skips it (for A/B cost checks). Districts are built inside `batchSolids` (`districts/home/kit.js`): solid-colour boxes, quads and triangles merge into one vertex-coloured mesh per group.

New prop kinds: `treeB` (rounder canopy), `sandwich` (A-board), `bags`, `dumpster`, `boxes`, `pot`, `upole` (utility pole), `scooter`, `barrier`, `firebox`. A kind with `noShadow: true` skips the shadow pass. `canopy.cball` / `canopy.leafCol` (voxprops.js) build cheap blocky foliage in 25 cm cells coloured in chunks (~3k triangles per tree instead of ~10k).

## The look up close
The city is seen from a close third-person camera, so the stage renders it for street level:
- **Sky:** `src/vx/render/sky.js` paints a pixel sky dome per mood (gradient bands, the sun's glow, chunky clouds, stars at night). It is the background and, prefiltered, the environment that glossy surfaces reflect. It adds reflections only: diffuse sky light still comes from the hemisphere light.
- **Sun shadows:** two cascades (`src/vx/render/shadows.js`). The sun carries a tight box of about ±11 m around the player (sharp contact shadows), and a black twin carries the wide box that `followShadow` aims down the street. Materials blend between the two maps near the rim of the tight box.
- **Materials:** city surfaces are `MeshStandardMaterial`s made by `surfaceMaterial()` (`src/vx/render/surface.js`). Roughness, metalness and relief come from the texture's family, found from its key prefix (`brick`, `siding`, `rooftile`, `win`…). Relief is a per-texel normal taken from the pixel art itself, so mortar, grout, laps and grain catch the low sun. It fades out past about 30 m. Glass panes are marked in the painter with `P.glass = [[x, y, w, h], ...]` (texel rects). They and the puddles in the ground atlas get a roughness map that makes them mirror-smooth. Voxel props get a roughness and metalness per kind (`SURF` in voxprops.js).
- **Depth of field:** `src/vx/render/composite.js` focuses on the camera's look-at point. It fades in below a camera distance of about 16 m and hands over from the HD-2D tilt-shift (`cv.depthDof`). `?dof=0` turns it off.
- **Grade:** `POST` in `src/vx/render/look.js` sets the grade per mood (bloom, vignette, split toning, saturation, vibrance and contrast).

## Testing

Run:

```
node tools/citywalk.mjs "loc=city&roam=1&at=X,Z[,LEVEL]" /tmp/out '[{"wait":1500},{"shot":"a"},{"keys":["w"],"ms":2000},{"shot":"b"},{"eval":"JS"}]'
```

It writes `/tmp/out_a.png` and so on. Headless rendering is slow (a few fps), so walking covers little ground. To check another spot, teleport with `{"eval":"(()=>{const w=__app.world;w.player.place(X,Z);w.city.placed();})()"}`.
