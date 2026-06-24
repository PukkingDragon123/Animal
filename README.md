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

**https://raw.githack.com/PukkingDragon123/Animal/claude/inspiring-wright-5xmrsu/index.html?v=6**

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

1. Spawn as a random unlocked animal with random **mutations** (a fresh build
   every run — Fast, Frail, Long Life, Always Hungry…).
2. **Survive childhood**, eat your species' food, grow Baby → Juvenile → Adult → Elder.
3. **Avoid your nemesis** (every species has one signature struggle).
4. As an **Adult**, **reproduce** — mate species find a mate; nest species
   gather twigs and **build a nest** first.
5. **Die** (old age if you're lucky), bank **DNA**, and complete **quests** to
   **unlock** new species.

## Character select & unlocks

A Slay-the-Spire-style carousel with a live spinning 3D preview of each
animal, its diet and stat bars (Speed / Size / Longevity). New species are
earned by completing **quests** (e.g. *Reproduce as a Rabbit* → unlock the Bee;
*Reach Elder* → unlock the Salmon), shown right on each locked card.

## Forest interactions

The forest is alive and pokeable: **bump fruit trees** to shake down a snack,
**forage mushrooms** for a speed buzz, **dive into burrows** to hide from
predators, and steer clear of **beehives** (they sting anyone who is not a bee).
Footsteps kick up little puffs as you move, and a diet chip + one-time tutorial
tips keep the controls obvious.

## Real species & their one big struggle

Every animal is a **specific, real species** with its scientific name, IUCN
conservation status, and researched biology (shown on the card and birth screen).

| Species | Latin | Biome | Eats | Why it sucks |
|---|---|---|---|---|
| European Rabbit (start) | *Oryctolagus cuniculus* | Forest | grasses | foxes cause ~28% of deaths |
| Western Honey Bee | *Apis mellifera* | Meadow | nectar | a worker lives 4–8 weeks |
| Monarch Butterfly | *Danaus plexippus* | Meadow | nectar | summer adults live ~2–5 weeks |
| Meerkat | *Suricata suricatta* | Savanna | insects | hawks above, cobras below |
| Emperor Penguin | *Aptenodytes forsteri* | Arctic | fish | −40°C; leopard seals at the ice edge |
| Leatherback Turtle | *Dermochelys coriacea* | Ocean | jellyfish | ~1 in 1,000 hatchlings survives |
| Sockeye Salmon | *Oncorhynchus nerka* | River | insects | swim upstream, spawn once, die |
| Red Fox | *Vulpes vulpes* | Forest | rabbits | miss the pounce, go hungry |
| Great White Shark | *Carcharodon carcharias* | Ocean | fish & seals | stop swimming and you suffocate |

## Arcade eat-and-survive (Hungry-Shark style)

The map is now **endless** — no walls. Food, prey, predators, critters and
scenery **stream in around you** as you roam (toroidally-wrapped props + a
player-following ground = an infinite world). The moment-to-moment goal is to
**eat and survive**: every bite scores points and builds a **combo multiplier**
(★ score + combo popups on the HUD), and your run's score feeds your genes.

**Bite** (the ⚔ button / Space) is a chunky **AoE chomp**: a faint **circular
bite-area ring** sits under you, and a tap fires a forward **lunge + shockwave**
that eats *everything edible in the circle* at once and knocks back any
predators caught in it.

## A living ecosystem

- **Day/night cycle** — the sun arcs overhead, light/fog shift to dusk and a
  moonlit night, and the world calms down after dark (a 🌙/☀️ clock shows the
  time). Penguins lose warmth faster at night.
- **Freeze to hide** — predators detect you by movement: sprint and you're easy
  to spot; **hold still and they lose you**. (They also mostly ignore tiny babies.)
- **Emergent food web** — ambient critters flee not just you but nearby
  predators, who actually catch them — so the world hunts itself, not only you.

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
