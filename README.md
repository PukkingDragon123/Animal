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
npm start          # serves the repo root at http://localhost:8080
# or:
python3 -m http.server 8080
```

Or play it instantly from the branch (served via raw.githack.com, which sends
the correct MIME types for ES modules):

**https://raw.githack.com/PukkingDragon123/Animal/claude/inspiring-wright-5xmrsu/index.html?v=10**

Open the URL on a phone or desktop. (ES modules need a real server — opening
`index.html` from `file://` won't work.)

Add `?dev=1` to the URL for an FPS / entity-count overlay.

## Controls

| | Move | Sprint |
|---|---|---|
| **Touch** | drag the **left half** of the screen (virtual joystick) | hold **RUN** (right) · tap **⚔** to attack |
| **Keyboard** | WASD / arrow keys | Shift to run · Space / J to attack |
| **Gamepad** | left stick / d-pad | bumpers to run · A / X to attack |

Keyboard is bound to **physical key codes**, so it works on any layout.
**Attack** lets you bonk-and-stun predators (fight back!), lunge-kill prey as a
hunter, or shake fruit from trees.

## Evolution: the mutation skill tree (Spore-style)

Every run earns **genes** and **EXP**. EXP levels up your gene pool; genes are
spent in the **Evolution Lab** — a **mutation skill tree** with prerequisites.
Many nodes don't just buff stats, they **physically mutate your 3D model**:
Big Ears, Spikes, Horns, Fangs, Bioglow and Giant all change how the creature
looks (visible live in the lab's 3D preview, on the character card, and in the
run). Upgrades stack on each run's random mutation, so a species gets stronger
and weirder the more you play it. Reach the lab from the menu, the character
card, or the death screen.

The world is also full of **ambient critters** — squirrels, ravens, butterflies
and frogs that wander and scatter as you pass — and predators are deliberately
forgiving (small aggro range, give up quickly, mostly ignore babies).

## The loop

Each run is **one complete animal life**, structured by a list of **life goals**
— the quest you must complete before your time runs out (shown as a live
checklist on the HUD).

1. Spawn as a chosen species with random **mutations** (a fresh build every run).
2. Work through your **life goals** — hatch, take flight, forage, swim upstream,
   find a mate… every goal completed pays out **live EXP** right then and there.
3. **Reproduce** — and live a real **family moment**: lay your eggs in the sand,
   mate in the dusk swarm, feed the colony, spawn over the gravel, or fuse to the
   female forever. Then **see your newborns** trail behind you.
4. **Die** (of old age, or — for a mayfly or salmon — *spent*, right after
   breeding). Bank **DNA + EXP**, and complete **quests** to unlock the next life.

Doing things — eating, killing a predator, hitting a life goal, delivering
nectar, mating — all feed **EXP** into your gene pool, so an active life levels
you up faster than a passive one. Leave young behind and you can **continue as
your offspring** (a growing dynasty across generations).

## Mini-games & quick-time events

Key moments become little skill tests instead of passive waiting:

- **Dig out** (Sea Turtle): the life opens with a **mash** QTE — tap to claw out
  of the buried nest before you can scramble for the sea.
- **Leap the rapid** (Salmon): the upstream run is a string of **timing** QTEs —
  tap when the marker sweeps through the green zone to clear a rapid (and gain
  ground + EXP); mistime it and the current sweeps you back down.

The QTE engine lives in the deterministic sim (so it's testable) and the
overlay doubles as a big tap target on mobile.

## Presentation

- **Rotating low-poly Earth** spins on the main menu, and each species' **real
  habitat** is shown on its select card and birth screen (researched: the
  turtle's tropical nesting beaches, the salmon's North-Pacific rivers, the
  anglerfish's bathypelagic "midnight zone", …).
- **Filmic shading** — ACES tone mapping + exposure and soft **contact shadows**
  under animals ground the scene and lift it out of the flat-shaded look.
- A more **serious, natural-history UI**: cinematic deep-teal screen backdrop,
  refined accents, and habitat/region framing.

## Character select & unlocks

A Slay-the-Spire-style carousel with a live spinning 3D preview of each animal,
its diet and stat bars (Speed / Size / Longevity), habitat, and signature ability.
The five lives unlock in a chain (shown on each locked card):

*Reach the sea as a hatchling Turtle* → **Mayfly** · *Mate as a Mayfly* →
**Honey Bee** · *Save the colony as a Bee* → **Salmon** · *Spawn upstream as a
Salmon* → **Anglerfish**.

## Five real species — five completely different lives

Every animal is a **specific, real species** (scientific name, IUCN status, and
true biology shown on its card and birth screen), and each plays nothing like the
others:

| # | Species | Latin | The life | Why it sucks |
|---|---|---|---|---|
| 1 | **Sea Turtle Hatchling** (start) | *Dermochelys coriacea* | Dig out, then **sprint down a predator-lined beach to the surf**, grow in the open ocean | ~1 in 1,000 hatchlings survives the crawl |
| 2 | **Mayfly** | *Ephemera danica* | **No mouth, a life of minutes** — take flight, mature, find the swarm and mate before the clock empties | adults can’t eat; they die within hours of breeding |
| 3 | **Worker Honey Bee** | *Apis mellifera* | A **working life**: sip nectar, carry it home, **feed the hive**, repeat until you drop | a summer worker lives 4–8 weeks, then works itself to death |
| 4 | **Pacific Salmon** | *Oncorhynchus nerka* | The **great migration** — fight the current **upstream**, dodge the bears, spawn once | semelparous: you spawn, then die |
| 5 | **Male Anglerfish** | *Ceratias holboelli* | **Alone in the black**, navigate by your glowing lure to find the giant female — and **fuse to her forever** | the male loses his eyes and organs, becoming a lifelong attachment |

## Handcrafted, bounded maps (no more procedural wandering)

Each species now plays in a **designed, bounded arena** — not an endless
procedurally-streamed field. Every map hand-places the things that make the run:
your **start**, your life's **goal**, **predator posts**, **hazard zones** to
weave through (ghost-crab pits on the turtle's beach, a snapping fish in the
mayfly's river, wasps in the bee's meadow, rapids rocks on the salmon's climb),
and signature **landmark scenery**. A soft wall keeps you inside the space, so
the run is a designed *course* with a real finish rather than aimless roaming.

**Bite** (the ⚔ button / Space) is a chunky **AoE chomp**: a faint **circular
bite-area ring** sits under you, and a tap fires a forward **lunge + shockwave**
that eats *everything edible in the circle* at once, knocks back predators, and
feeds the **score + combo** meter (★ popups on the HUD).

## A living ecosystem

- **Day/night cycle** — the sun arcs overhead, light/fog shift to dusk and a
  moonlit night, and the world calms down after dark (a 🌙/☀️ clock shows the
  time). Penguins lose warmth faster at night.
- **Freeze to hide** — predators detect you by movement: sprint and you're easy
  to spot; **hold still and they lose you**. (They also mostly ignore tiny babies.)
- **Emergent food web** — ambient critters flee not just you but nearby
  predators, who actually catch them — so the world hunts itself, not only you.

## Dynasty: keep the bloodline going

Death isn't the end of the run — it's a hand-off. Once you've left **offspring**
behind, the death screen offers **"Continue as your young"**: you respawn as one
of your newborns (**Generation N+1**), inheriting your evolved look with a fresh
roll of mutations and a small **bloodline bonus** that toughens the line each
generation. Your **dynasty score** accumulates across the whole lineage — *see
how long you can keep it going.* Newborns also **trail you in a little conga
line** so you can watch your young grow.

## Interactions, gimmicks & survival tricks

- **Win a mate** — wild mates behave like you and have to be impressed. Get close
  while well-fed to woo them, or tap **⚔ near a mate to offer a gift** and fill
  their heart faster. Reproduction is **gated on courtship**, then plays a brief
  **mating animation** (bouncing pair + floating hearts) before the birth.
- **Burrow home** — tap **⚔ at a burrow to dive underground** into a safe den
  that **heals you** while predators lose your trail; any movement pops you back
  out.
- **Mud wallows** — roll through a **mud puddle to mask your scent**, so
  predators can barely smell you for a few seconds (scent feeds their detection
  alongside movement and daylight).
- **Killable predators** — the AoE bite now **damages enemies and can kill them**
  outright (with a gory finish and a kill score), so you can finally fight back
  and *become* the apex.
- **Unexpected ambushes** — every so often a predator **streams in already
  hunting**, so the endless world keeps you honest.
- **Attack is contextual** — the same **⚔** dives into burrows, offers mating
  gifts, shakes fruit trees, lunges at prey, and bites predators depending on
  what's in range.

## HUD: Minecraft-style vitals

The in-play overlay reads at a glance, console-game style: a row of **❤️ hearts**
for health and a row of **🍗 drumsticks** for food (each ticking off as you take
damage or get hungry), plus a **stamina** bar for sprinting and a **warmth** bar
for cold biomes. **Enemies show their own health bars** above their heads
(camera-facing, color-shifting green→red) once they're wounded or hunting, and a
**⚭ Gen** chip shows your current dynasty generation.

## Project layout

```
index.html            # entry: canvas + mobile-first HUD/menus + CSS
logic.js              # platform rules-module stub (solo game)
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
- `tests/features.test.js` — systems: interactables, nest building, quests,
  combat/killable predators, courtship-gated mating, dynasty lineage, mud
  scent-masking, burrow denning, AoE bite, infinite-world streaming.
- `tests/build.test.js` — every creature/food/prop/biome builds and animates
  without NaNs (runs Three.js geometry in Node — no GL context needed).
- `tests/dom.test.js` — menus, screens, button wiring, the Minecraft-style
  vitals HUD and input command object (jsdom).

## Performance

Targets low-end mobile: instanced ground props and particles (one draw call
each), capped device-pixel-ratio, low-poly meshes (~700 tris/creature), no
per-frame allocations in the sim loop, shadows scaled down / off on mobile.

## Credits / assets note

The art is procedural geometry and the audio is synthesized at runtime, so the
game needs no external asset pipeline. Optional AI-generated marketplace cover
art and a one-click shareable play URL (via the Higgsfield deploy pipeline)
require workspace credits, which were unavailable at build time.
