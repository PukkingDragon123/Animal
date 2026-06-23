# Why It Sucks To Be A…

A **mobile-first, low-poly 3D top-down roguelike survival** game. You are born
as a random animal and live its entire life — survive childhood, find food,
dodge predators, grow up, reproduce, and (inevitably) die. Each run is a short,
unique survival story; banking **DNA** unlocks new species with their own
miserable struggles. Inspired by funny nature documentaries, Animal Crossing,
and Alba.

> *"Wow, life really sucks for this animal."*

Built with **Three.js**, all art is **procedural geometry** (no textures, no
image assets) and all audio is a **procedural Web Audio engine** — so the whole
game is self-contained, tiny, and runs offline.

## Play it

It's a static site — no build step.

```bash
npm start          # serves ./public at http://localhost:8080
# or:
cd public && python3 -m http.server 8080
```

Open the URL on a phone or desktop. (ES modules need a real server — opening
`index.html` from `file://` won't work.)

Add `?dev=1` to the URL for an FPS / entity-count overlay.

## Controls

| | Move | Sprint |
|---|---|---|
| **Touch** | drag the **left half** of the screen (virtual joystick) | hold the **RUN** button / right half |
| **Keyboard** | WASD / arrow keys | Shift or Space |
| **Gamepad** | left stick / d-pad | A / bumpers |

Keyboard is bound to **physical key codes**, so it works on any layout.

## The loop

1. Spawn as a random unlocked animal with random **mutations** (a fresh build
   every run — Fast, Frail, Long Life, Always Hungry…).
2. **Survive childhood**, eat your species' food, grow Baby → Juvenile → Adult → Elder.
3. **Avoid your nemesis** (every species has one signature struggle).
4. As an **Adult**, reach a mate / nest to **reproduce** — the run's main goal.
5. **Die** (old age if you're lucky), earn **DNA**, and spend it to **unlock**
   new species.

## Species & their one big struggle

| Species | Biome | Eats | Why it sucks |
|---|---|---|---|
| Rabbit (start) | Forest | grass | everything hunts you |
| Bee | Meadow | flowers | brutally short lifespan |
| Penguin | Arctic | fish | freezing cold (warmth drains) |
| Sea Turtle | Ocean | seaweed | reach the sea as a hatchling |
| Salmon | River | bugs | swim upstream against the current |
| Fox | Forest | rabbits | catch fast prey before you starve |
| Shark | Ocean | fish | keep swimming or suffocate |

## Project layout

```
public/
  index.html          # entry: canvas + mobile-first HUD/menus + CSS
  logic.js            # platform rules-module stub (solo game)
  favicon.svg
  vendor/three.module.js
  src/
    config.js         # frozen agency metrics + balance (data only)
    rng.js            # seeded deterministic RNG (mulberry32)
    sim.js            # PURE simulation core — no Three.js, Node-testable
    species.js mutations.js biomes.js   # content
    meshes.js         # procedural low-poly creatures (animated parts)
    props.js          # instanced food + biome props (one draw call/type)
    world.js          # static biome environment (ground/sky/props)
    animator.js       # per-gait procedural animation (hop/waddle/swim…)
    fx.js             # pooled particle FX (one InstancedMesh)
    render.js         # Three.js scene/camera/lights + state→mesh sync
    input.js          # touch joystick + keyboard + gamepad
    audio.js          # procedural Web Audio SFX + cozy music loop
    hud.js            # HUD + menus
    game.js           # orchestrator / state machine (entry)
design/               # GDD, asset manifest, frozen thresholds
tests/                # headless tests (no WebGL needed)
```

Logic is fully separated from rendering: `sim.js` is deterministic
(fixed-timestep + seeded RNG) and has zero rendering dependencies.

## Tests

```bash
npm test
```

- `tests/sim.test.js` — simulation: stages, eating, reproduction, death,
  determinism, every species boots.
- `tests/build.test.js` — every creature/food/prop/biome builds and animates
  without NaNs (runs Three.js geometry in Node — no GL context needed).
- `tests/dom.test.js` — menus, screens, button wiring and input command object
  (jsdom).

## Performance

Targets low-end mobile: instanced ground props and particles (one draw call
each), capped device-pixel-ratio, low-poly meshes (~700 tris/creature), no
per-frame allocations in the sim loop, shadows scaled down / off on mobile.

## Credits / assets note

The art is procedural geometry and the audio is synthesized at runtime, so the
game needs no external asset pipeline. Optional AI-generated marketplace cover
art and a one-click shareable play URL (via the Higgsfield deploy pipeline)
require workspace credits, which were unavailable at build time.
