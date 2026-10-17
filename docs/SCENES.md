# Tokonmon scene authoring guide — HD-2D side-scrolling stage sets

Every location is a **3D side-scrolling "stage set"**, "like a restaurant":
- **The view:** a long street strip, or a cut-away interior, seen from the front.
- **What it's made of:** a **3D, super detailed diorama** made from:
  - pixel-art tiles, buildings with pixel facades and neon signs;
  - voxel props (rendered as pixel art);
  - 2D sprite characters and 3D Tokonmon.
- **Controls:** the player **taps to walk**, **drags to pan the camera**, **pinches/wheels to zoom** and twists slightly to see the 3D.
- **Zoom-in scenes:** tapping hotspots enters them: sit and eat at a table, order **in first person** at a counter.

Read `docs/TOKONMON.md` (design bible) and `docs/MAPS.md` (the base map format — everything in it
still applies) first. Study your reference notes in `docs/refs/environments.md` and
`docs/refs/art_direction.md` before building anything, and follow them.

## Conventions

- **Camera:** `yaw 0` means the camera sits at **+z** and looks toward −z.
- **Axes:**
  - **x** runs along the strip, left → right.
  - **z** is depth: **0 = far back**, larger = closer to the camera.
  - **y** is up. 1 tile = 1 m.
- **Facing:** facades that face the camera use `front: 's'` (+z). Point and NPC facing: 0 = toward the camera (+z), 90 = right (+x), 180 = away, 270 = left.
- **Pixel scale:** the default camera shows ~10–12 m of height. Characters are ~1.5 m chibi sprites, ~48 art pixels tall.

## Scene object additions

```js
export default {
  id: 'dotonbori', name: 'Dotonbori', area: 'Namba, Chuo Ward', size: [W, D], base: 'c',
  view: 'side',                 // side-scroll stage set (required)
  interior: false,              // true → no sky, dark surround, warm ambient light; build `rooms`
  cam: { pitch: 0.28, fov: 24, dist: 24, minDist: 12, maxDist: 34, lookY: 1.4, z: 9, minX?, maxX? },
  //   pitch/fov/dist: the default framing; z: depth the camera centres on; lookY: look height above ground
  backdrop: [                   // far parallax layers behind the set (z negative)
    { kind: 'skyline', z: -45, height: 26, color: '#2a2450', color2: '#3a3060', lit: true, signs: true, seed: 3 },
    { kind: 'mountains'|'hills'|'trees', z: -80, height: 30, color: '#7a8aa8', color2: '#9aa8c0', snow: false, seed: 1 },
  ],
  rooms: [                      // cut-away interiors (dollhouse look)
    { x: 1, z: 2, w: 16, d: 7, h: 3.4, wall: 'plaster', wallColor: '#f1e2c4', side: 'wood',
      wainscot: { style: 'dark_wood', h: 1.1 }, trim: '#5a3a26', cut: '#2a1c22',
      windows: [{ x: 1.2, y: 1.4, w: 2.6, h: 1.4, view: 'city'|'night'|'sky'|'garden' }], left: true, right: true, back: true },
  ],
  //   wall styles: plaster wood dark_wood tile brick concrete shoji wallpaper stripes checker stone metal neon tatami
  panels: [                     // in-world pixel boards (menus, posters, calligraphy, TV/holo screens)
    { x, y, z, w, h, rot: 0, kind: 'menu'|'poster'|'calligraphy'|'tv'|'sign'|'chalk', title: 'MENU', lines: ['Okonomiyaki ¥900'], bg, fg, accent, glow },
  ],
  hotspots: [                   // tap targets (doors, seats, counters, boards…)
    { id: 'door_ys', x, z, y: 1, r: 0.9, kind: 'door', to: 'yellow_submarine', spawn: 'door', label: 'Yellow Submarine' },
    { id: 'counter', x, z, kind: 'order', label: 'Order', approach: [x, z], face: 180 },
    { id: 'seat1', x, z, kind: 'seat', label: 'Sit', approach: [x, z], face: 180 },
  ],
  zooms: {                      // camera presets for zoom-in scenes (absolute world coords)
    counter: { from: [x, 1.55, z], look: [x, 1.6, z - 2.5], fov: 48, kind: 'order' },   // first-person ordering
    seat1: { from: [x, 2.1, z + 2.4], look: [x, 0.9, z], fov: 34, kind: 'eat' },       // eating close-up
  },
  // …plus everything from MAPS.md: ops, heights, buildings, props, points, npcs, spawns, exits, arenas, zones, lights, ambience, water, safari
};
```

### Hotspots
- **`kind: 'door'`** with `to` + `spawn` transitions to that scene. Interiors need a door back out.
- **Other kinds** are handled by the story/systems code by `id`:
  - `order` — first-person counter
  - `seat` — eat
  - `reception`
  - `shop` / `records` / `cosmetics`
  - `bath`
  - `crane`
  - `roster` — dojo roster board
  - `train` — dojo training mat
  - `look` — inspect
- **Fields:** `approach` is where the player stands before using it; `face` is the facing there; `y` is the height of the tap target.

### Zooms
- `order` zooms are **first-person**: the camera sits at the player's eye height (~1.5 m) in front of the counter, looking at the clerk/chef and the menu board.
- `eat` zooms frame the table top so the food and the Tokonmon eating fill the screen.

## Composition rules (side view)

1. **Back row (z ≈ 0–4):** building facades facing `'s'`, packed and varied: heights, colours, signs, awnings, AC units, balconies.
   - Shops the story uses must have their door on the facade and a `door` hotspot in front.
2. **Play strip:** a walkable band ~5–9 m deep (sidewalk, street, plaza, promenade).
   - Keep it readable: props hug the edges, and lamps are every ~6 m.
3. **Foreground (largest z, 1–2 m):** sparse low props and railings that frame the shot. The depth of field blurs them, which is the HD-2D look.
   - Never block the play strip's view of characters.
4. **Background:**
   - Backdrop layers at z −30 … −90.
   - Big landmark props (`osaka_castle`, `tsutenkaku`, `umeda_sky`, `ferris_wheel`) can sit **behind the set at negative z**: props outside the grid are allowed and skip navigation.
5. **Interiors:** a `room` shell plus a floor via tiles (`o` wood, `m` tatami, `P` plaza, `T` metal…).
   - Furniture and props sit inside; warm point `lights`; `panels` for menus and posters.
   - The front is open (cut-away) and the side walls show a dark cut face.
6. **Arenas:** battles happen in place. Give each scene that hosts battles an `arenas` entry: a **clear** walkable circle with r ≥ 5.5, inside a strip at least 12 m deep, with destructible props only near the rim.
7. **Night:** signs, lamps and lit windows glow (`lights`, emissive props). Check `&h=20.5` screenshots.
8. **Budget:** ≤ 220 props, ≤ 28 buildings per scene; interiors ≤ 120 props.

## Scenes and the names the code relies on

| id | type | required points / hotspots / arenas |
|---|---|---|
| `farm` | exterior (prologue, dawn) | points `treeline` (back), `fence_jump`, `pasture`, `wolf_stop` (front-centre), `farmer`, `field`, `cam_wide`; spawns.start |
| `castle_park` | exterior | points `gate` (left, spawn), `mika_meet`, `coach`, `ground_center`, `kaito_enter` (right), `pedestals` (3 starter pedestals in a row), `bench_night`, `castle_view`; arena `main`; exit left → `worldmap` |
| `dotonbori` | exterior | points `arrive` (left), `icecream`, `vendor`, `taro`, `punks_enter` (right), `bridge`, `restaurant`, `hoshino`, `canal_view`; arena `bridge`; hotspots `door_ys` → `yellow_submarine`/`door`, `door_ar` → `abbey_road`/`door`; exit left → `worldmap` |
| `yellow_submarine` | interior (ice-cream parlour) | points `door` (spawn), `counter`, `clerk`, `table`, `table2`, `table3`; hotspots `counter` (order), `seat` (seat), `exit` (door → `dotonbori`/`icecream`); zooms `counter` (first-person), `seat` (eat) |
| `abbey_road` | interior (okonomiyaki, teppan tables) | points `door`, `chef`, `seat1`…`seat4` (around the teppan), `hoshino_seat`; hotspots `teppan` (seat), `counter` (order), `exit`; zooms `teppan` (eat), `counter` (first-person) |
| `umeda` | exterior | points `arrive`, `plaza_view`, plus NPC spots; hotspots `door_hq` → `league_lobby`/`door`, `door_food` → `food_hall`/`door`, `door_stadium` → `stadium`/`tunnel`; exit → `worldmap` |
| `league_lobby` | interior (HQ) | points `door`, `reception`, `receptionist`, `opponent`, `rank_board`; hotspots `desk` (reception), `exit`, `stadium_gate` (door → `stadium`/`tunnel`) |
| `food_hall` | interior | points `door`, `counter`, `staff`, `lunch_table`, `table2`; hotspots `counter` (order), `seat` (seat), `exit`; zooms `counter`, `seat` |
| `stadium` | high-tech sports arena | points `tunnel` (spawn), `foe_tunnel`, `center`, `reporters`, `booth`; arena `stage` (r 7, the battle floor); `arenaFloors: { rocky, grassy, water }` (see below); crowd stands, jumbotron, reporter area, camera rigs |
| `shinsekai` | exterior | points `arrive`, `alley`, `thrash_spot`, `tower_view`; arena `alley`; hotspots `door_dojo` → `dojo`, `door_onsen` → `onsen`, `door_arcade` → `arcade`, `door_grillz` → `grillz_shop`, `door_records` → `kansai_calling`; exit → `worldmap` |
| `dojo` | interior | points `door`, `dojo_master`, `mat`, `roster1`…`roster8` (where your other Tokonmon train/rest); arena `yard` (r ≥ 5); hotspots `master`, `roster` (roster board), `train` (training mat), `exit` |
| `onsen` | interior | points `door`, `attendant`, `bath`; hotspots `bath`, `exit`; zoom `bath` |
| `arcade` | interior | points `door`, `attendant`, `crane`; hotspots `crane`, `exit`; zoom `crane` (first-person into the claw machine) |
| `grillz_shop` | interior (bling & cosmetics) | points `door`, `clerk`, `counter`; hotspots `counter` (cosmetics), `exit` |
| `kansai_calling` | interior (goods + vinyl skill discs) | points `door`, `clerk`, `counter`, `records`; hotspots `counter` (shop), `records` (records), `booth` (listening booth), `exit`; zoom `booth` |
| `minoh_waterfall`, `minoh_bamboo`, `minoh_maple` | exterior safari trails | points `entrance` (spawn), `ranger`, `camp`, `trail_end`, plus `falls_view` (waterfall); `safari` block (MAPS.md); exits between trails at the strip ends and → `worldmap` |

### Stadium floor variants
```js
arenaFloors: {
  rocky:  { ops: [['circle', cx, cz, 7, 'r']], props: [['rock_m', x, z], …] },
  grassy: { ops: [['circle', cx, cz, 7, 'G']], props: [['tallgrass', x, z], ['flowerbed', …]] },
  water:  { ops: [['circle', cx, cz, 7, ',']], props: [['lilypad', x, z], …] },
}
```
The battle system rebuilds the arena floor from these at kickoff and at halftime, after the player picks one. Keep every variant clear in the centre.

## Props
- **Reuse** the shared library: `src/data/designs/props.js`.
- **Add new props** in your district's module, using the voxel prop DSL (`docs/MODELING.md`, `arch: 'static'`):
  - `src/data/designs/props_chuo.js` — farm, park, Dotonbori, interiors in Namba
  - `src/data/designs/props_umeda.js` — Umeda, HQ, food hall, stadium
  - `src/data/designs/props_shinsekai.js` — Shinsekai, interiors there, Minoh
- **Format:** export `DESIGNS` and `PROP_META` like `props.js`. Ids must be unique across modules, so prefix ambiguous ones.

## Checks before you're done
```bash
node tools/shot.mjs "tools/scene.html?map=../src/world/maps/<id>.js&h=14&chars=player_a@start&hs=1" out.png 1280 720 ready 180000
#   &h=20.5 night · &x=<focus x> to look along the strip · &zoom=<name> to preview a zoom shot
#   &mons=<species>@<point> to drop a 3D Tokonmon in · &q=medium
```
- **Visual pass:** Read the PNGs and iterate 2–3 times per scene: day, night and zoom shots, along the whole strip.
- **Reachability:** every point, hotspot `approach`, exit and arena centre must be reachable from `spawns.start`. Use `buildGrid` + `buildEnvironment(def, grid, { textures: false })` + `findPath` in a Node script.
