# ELEMON — Osaka 2050

*Elemon is a creature-battle RPG in **3D pixel art**, set in a neon-soaked, futuristic Osaka.*
Bond with an elemental partner through your soul-stone bracelet, fight real-time tactical battles,
explore three districts and a safari reserve, stand up to the punks of Team Metallica, and climb the
Kansai League.

Everything is generated in code: the voxel creatures, characters, props and city dioramas, the
anime-style lighting and post-processing, the particles, and all music and sound effects. There are
no image or audio assets and no build step.

## Play it

It's a static site:

```bash
npm start            # serves the repo at http://localhost:8080
# or: python3 -m http.server 8080
```

Or play it straight from the branch:

**https://raw.githack.com/PukkingDragon123/Animal/claude/bold-bardeen-ojasju/index.html**

URL options:

| Option | Effect |
|---|---|
| `?q=high` / `medium` / `low` | Graphics quality. The default is `high` on desktop and `medium` on mobile; `low` turns off post-processing. |
| `?dev` | FPS, draw-call and triangle overlay. |
| `?auto=new` / `?auto=continue` | Skip the title screen. |
| `?skipintro` | Skip the farm prologue. |

### Controls

| | Touch | Keyboard / mouse |
|---|---|---|
| Move | Tap the ground | WASD / arrows, or click |
| Talk / interact | Tap a person or Elemon | Click, or **E** when close |
| Camera | Pinch to zoom, two-finger twist, ⟲ button | Mouse wheel, **Q** / **R** to rotate |
| Battle: move / target | Tap ground / tap enemy | Click |
| Battle: attack | ATTACK button | **Space** |
| Battle: skills | **Drag** a skill button to aim, tap to auto-aim, hold a charge skill | **1–4** (aims at the mouse) |
| Battle: dodge | Swipe | **Shift** |
| Battle: parry / grab / charge | Buttons | **E** / **Q** / hold CHG |
| Ultimate · team combo · switch · spectral | Buttons | **F** · **T** · **Tab** · **X** |

## The opening chapter — *Episode 1: Soul Link*

1. **Prologue: Kishiwada farm at dawn.** Cows, pigs and chickens share the farm with farm Elemon (Cabbunny, Moglow). A fire wolf, **Kagarou**, bursts out of the treeline and the sky whale **Polaris** crosses the sunrise.
2. **Character creator.** Choose your look; the soul-stone bracelet is always on your wrist.
3. **Osaka Castle Park.** Your best friend Mika, Coach Gonda and the bracelet ceremony. Five starters wait on their pedestals: **Kindoru** (Pyro), **Takopo** (Hydro), **Mochika** (Bio), **Clayki** (Geo) and **Komoriff** (Echo).
4. **Coach's tutorial battle**, then your rival **Kaito**, who takes the starter that beats yours. After each win you level up: allocate stat points, pick a reward card and learn new skills. Skill slots unlock as your bond grows.
5. **Dotonbori ice cream** at Yellow Submarine Soft-Serve: an animated choice scene where each flavour gives a stat boost.
6. **Team Metallica** shakes down the takoyaki stand. You borrow the kid Taro's **Beatlet** for a **3 v 3** with Mika and the coach. The tutorial covers switching, tag strikes, elemental reactions and team combos. Taro then gives you Beatlet.
7. **Dinner** at Abbey Road Okonomiyaki (pick two moments), where you meet the archaeologist **Dr. Hoshino**, who tells the legends of Polaris and Solaris.
8. **Night under the sakura**, bonding with your partner.
9. **Day 2, Umeda.** Register for the Kansai League and receive your **Tamer License** and the **keychain capture device**. Then two rank matches, lunch at the Food Hall with the rival, and the afternoon is yours.
10. **Free days.** League matches (three a day, with themed stages), the Minoh Safari, the dojo, the onsen, shops, the arcade, side quests and random street events. The deadline: reach **Rookie C** before the **Rookie Cup qualifier on Day 5**.

## Systems

- **Real-time tactical battles** on a deterministic 30 Hz simulation:
  - **Inputs:** tap-to-move, targeting, skillshots you aim by dragging (with bullet-time), dodges with perfect-dodge windows, and parries with perfect-parry reflects.
  - **Combo chains:** grab → parry → attack is a *Reversal Suplex*; charge → attack is an *Elemental Strike*; switch → attack is a *Tag Strike*.
  - **Big moves:** ultimates with QTEs, team combos with your allies, and **Spectral form** at max friendship.
  - **Elements:** auras and **elemental reactions** (Hydro + Pyro = **Steam Explosion**, Bio + Hydro = Bloom, Hydro + Volto = Electro-Charged, and more).
  - **Arenas:** battles happen right on the map, and props around the arena can be destroyed.
  - **Element roles:**

    | Element | Role |
    |---|---|
    | Pyro | Raw power, charging and heat |
    | Hydro | Precision: centre-hit crits, ricochets, traps |
    | Bio | Healing, poison, sleep |
    | Geo | Walls, armour, the best parries |
    | Echo | Rhythm: on-beat bonus, knockback |
    | Volto, Cryo, Aero, Ecto, Ferro, Astro, Nucleo | Further elements |

- **Growth:**
  - **Stats:** five upgradeable stats (Damage, Element, Defense, Speed, Health), with 3 stat points and 1 Astral point per level.
  - **Astral tree:** a constellation skill tree that unlocks moves, passives and ultimates.
  - **Loadout:** up to **4 active skills, 1 ultimate and 2 passives**, with slots unlocked through the story.
  - **Rewards:** level-up reward cards, mixtapes that teach skills, and **dojo auto-training**, which is slow but works overnight.
- **Evolutions with conditions.** The Beatles-inspired **Beatlet** branches four ways:
  - **Lenshorn:** defeat 20 Lemmo and the Alpha Lemmo.
  - **McCarapace:** deep friendship by the Dotonbori canal.
  - **Harrisun:** meditate at the dojo, then wait for sunrise.
  - **Starrab:** 25 team combos.

  The starters evolve twice each. **Pebblips** (a Rolling Stone) is never satisfied until it has eaten 8 foods.
- **Minoh Safari Reserve:** three linked trails (Waterfall, Bamboo, Maple Ridge).
  - **Stealth:** sneak through tall grass and ambush from behind for easier captures.
  - **Spawns:** some species only appear at certain hours; some are aggressive or hard to bond with.
  - **Capture:** a keychain device powered by **gems** (Quartz up to Diamond, plus elemental gems).
  - **Hazards:** untameable Rift Boars and Oni Bears that charge you.
  - **Extras:** hidden star fragments and the Alpha Lemmo boss.
- **Legends:** bring three star fragments to Dr. Hoshino for a **Star Gem**, then visit the Minoh falls on a clear night to meet **Polaris**. Solaris and the rift-born **Atomic** are foreshadowed.
- **Time:**
  - **Days:** morning, lunch, afternoon, evening and night slots; activities cost time, the clock runs during free roam, and you sleep to start a new day.
  - **Planning:** deadlines, branching dialogue and random events with choice scenes.
- **World:** five unlockable areas across three towns (Chuo, Namba, Umeda) plus Shinsekai and Minoh. Travel with the world map.
- **Style:**
  - **Bracelet & soul stone:** watches, earrings, hair clips, badges, grillz and soul-stone shapes.
  - **Ecto Elemon:** special eyeballs.
  - **Where to get them:** the Grillz & Thrillz shop and the arcade crane game.
- **Team Metallica** (Thrash, Riff and Moshi) and lots of band references: Abbey Road Okonomiyaki, Smells Like Teen Spirit Arcade, the Ride the Lightning pachinko parlour…

## Tech

| Layer | Files |
|---|---|
| Voxel modelling: SDF shape DSL → shared lattice, AO, colour jitter, glow voxels, pixel-art eye/mouth decals with expressions | `src/gfx/voxel.js`, `src/gfx/model.js` |
| Procedural animation: archetypes (biped/quad/serpent/bird/…), actions, modes, blinking, lip flap, quirks | `src/gfx/anim.js` |
| Anime toon shading (rim, flash, dissolve, spectral holo, occlusion fade) and HDR post (bloom, depth outlines, tilt-shift, ACES, grading, speed lines, letterbox) | `src/gfx/materials.js`, `src/gfx/post.js` |
| Sky & time of day, pooled point lights, particles, VFX, cinematic camera | `src/gfx/sky.js`, `renderer.js`, `particles.js`, `vfx.js` |
| Diorama environments from map data: tiles, buildings with facades and neon signs, instanced props with GPU wind sway, water | `src/gfx/env.js`, `textures.js`, `src/world/maps/*.js` |
| Overworld: A* tap-to-move, followers, NPCs, triggers, safari stealth & capture | `src/world/*.js` |
| Battle simulation + AI + presentation/HUD | `src/battle/sim.js`, `ai.js`, `scene.js`, `src/ui/battlehud.js`, `qte.js` |
| Game state, progression, saves (`localStorage`) | `src/game/*.js` |
| Story & cutscene director | `src/story/chapter1.js`, `src/game/director.js` |
| Content: species, skills, elements, items, cosmetics, quests, events, designs | `src/data/**` |
| Procedural audio: SFX, voice babble, 13 music tracks, stingers, ambiences | `src/audio/*.js` |

Design guides: [`docs/MODELING.md`](docs/MODELING.md) (voxel creature/prop DSL) and [`docs/MAPS.md`](docs/MAPS.md) (map format).

## Development

```bash
npm test             # battle sim + progression + content integrity (~2000 checks)
node tools/play.mjs out 600 "auto=new&q=low&renderEvery=1500"   # headless auto-play with screenshots
```

Dev pages: `tools/viewer.html` (models), `tools/design.html` (creature design sheets), `tools/maptest.html?map=...`
(map dioramas), `tools/gfxtest.html`, `tools/audio.html` (music & SFX browser).
`tools/scenarios/make.mjs` builds save files for jumping to specific points (`SAVE=file node tools/play.mjs …`).
