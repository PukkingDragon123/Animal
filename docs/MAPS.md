# Elemon map authoring guide

Maps are isometric **voxel dioramas** built from data by `src/gfx/env.js`
(see `src/world/maps/_test.js` for a tiny example). 1 tile = 1 m. Tile `(i,j)`
covers x∈[i,i+1), z∈[j,j+1). Height is y. The diorama edge is cut away and
shows soil layers, like a tabletop model.

**Camera:** isometric-ish perspective looking from the **south-east** (+x,+z)
toward the north-west, ~38° down. So walls facing **south ('s', +z)** and
**east ('e', +x)** face the camera. Put tall buildings along the north and west
edges; keep the south/east foreground low (props, low shops, water, plazas).
Buildings that end up between camera and player dither-fade automatically, but
don't rely on it everywhere.

## Map object

```js
export default {
  id: 'dotonbori', name: 'Dotonbori', area: 'Namba, Chuo Ward', size: [W, H], base: 'w',
  ops: [ ['rect', x, z, w, h, ch, rot?], ['circle', cx, cz, r, ch], ['ring', cx, cz, r0, r1, ch],
         ['line', [[x,z],…], width, ch], ['scatter', x, z, w, h, ch, density, seed] ],
  heights: [ ['rect', x, z, w, h, y], ['ramp', x, z, w, h, y0, y1, 'x'|'z'] ],
  buildings: [ { x, z, w, d, floors, style, front: 's', fronts: ['s','e'], color: '#hex', ground: 'shop'|'door'|'shutter'|…, roof: 'flat'|'tile'|'green'|'red',
                 sign: { text, color, bg, side, vertical, at: 0..1, y, scale }, signs: [ … ], clutter: true } ],
  props: [ [propId, x, z, rotDeg = 0, scale = 1, yOverride?], … ],
  points: { name: [x, z, faceDeg?], … },        // cutscene marks, NPC homes, entry spots
  npcs: [ { id, char: 'coach' | look object, x, z, face: deg, idle: 'wave'|'think'|…, wander: radius, talk: 'dialogueKey' } ],
  spawns: { start: [x, z], fromX: [x, z] },
  exits: [ { x, z, w, d, to: 'worldmap' | mapId, spawn: 'name', label: 'To Umeda' } ],
  arenas: { main: { x, z, r } },               // battle rings (clear, walkable circle r≈6–8, props around the rim get destroyed in battle)
  zones: { name: [x, z, w, d] },                // trigger areas
  lights: [ { pos: [x, y, z], color, intensity, range } ],
  ambience: { particles: 'sakura'|'fireflies'|'leaves'|'neon'|'snow'|'mist'|null, music: trackId, sound: 'park'|'city'|'canal_night'|'safari'|'farm' },
  water: { deep: '#hex', shallow: '#hex', neon: '#hex' },
  safari: { … }   // safari maps only, see below
};
```

### Tiles (`src/world/tiles.js`)
`g` grass · `G` dark grass · `f` flowers · `k` sakura petals on grass · `L` fallen maple leaves · `d` dirt · `F` crop field ·
`s` sand · `r` raked gravel · `p` stone pavers · `c` cobbles · `a` asphalt · `=` asphalt with lane line (use rot 1 for
roads running along x) · `e` asphalt edge line · `x` crosswalk (rot 1 to turn) · `w` sidewalk · `t` tactile paving ·
`P` plaza tiles · `o` wood deck/bridge · `m` tatami · `M` moss · `C` court · `K` court line · `A` arena sand ·
`T` metal grate · `S` snow · `~` pond water (sunken, not walkable) · `-` canal (deep, sunken) · `,` shallow stream
(walkable) · `R` rock (raised, blocks) · `#` blocked · `' '` void (hole in the diorama).
Water tiles automatically get stone walls; walkable bridges are just wood/stone tiles over the canal span.

### Building styles
`apartment, office, shop, brick, tile, machiya, kura, temple, concrete, dojo, tower, stone`. `floors` × 3 m.
Signs render as glowing neon boards (Japanese + English text, newline with `\n`); vertical blade signs
(`vertical: true`) stick out from corners like Dotonbori. Use lots of signs on night streets. Band-pun
names are encouraged ("Abbey Road Okonomiyaki", "Hotel Kansai-fornia", "Bohemian Rhap-Soda",
"Smells Like Teen Spirit Arcade", "Yellow Submarine Soft-Serve", "Purple Rain Café", "Highway to Shell (gas)"…).

### Props
Ids from `src/data/designs/props.js` (`DESIGNS` keys; meta in `PROP_META`). Missing ids render as a grey
placeholder box — check the keys and only use ones that exist. Footprints block navigation automatically.

## Safari maps (`safari` block)
```js
safari: {
  grass: [[x, z, w, h], …],                    // tall-grass patches (stealth cover) — also place 'tallgrass' props there
  spawns: [ { species, x, z, r, level: [a, b], weight, hours?: [h0, h1], rare?: true, sneakOnly?: true } ],
  beasts: [ { species: 'rift_boar'|'oni_bear', path: [[x,z],…], speed } ],
  boss: { species: 'alpha_lemmo', x, z, r },   // optional
  fragments: [ [x, z], … ]                      // hidden star fragments (archaeologist quest)
}
```

## Checks before you're done
1. `node tools/shot.mjs "tools/maptest.html?map=../src/world/maps/<file>.js&h=14" out.png 1400 860 ready 180000`
   (also `&h=20.5` for night, `&focus=x,z&dist=18` for close-ups) — Read the PNGs and iterate.
2. Reachability: every point, npc, exit, arena centre and safari spawn must be reachable from `spawns.start`
   (use `buildGrid` + `buildEnvironment(def, grid, { textures: false })` + `findPath` from `src/world/nav.js`
   in a Node script — buildEnvironment marks building/prop footprints as blocked).
3. Arenas: a clear walkable circle (radius `r`) with nothing solid inside except deliberately destructible props near the rim.
