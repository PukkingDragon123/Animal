# Why It Sucks To Be A… — Game Design Doc

A mobile-first low-poly 3D top-down **roguelike survival** game. You live the
entire life of a random animal — birth to death — in a 5–15 minute run, then
bank DNA and unlock new species. Inspired by funny educational nature docs.

## Profile
- **Time:** real-time. **Space:** continuous 3D, top-down ~50° camera.
- **Agency:** one hero animal. **Conflict:** vs system (predators, hunger,
  cold, currents) + vs self (managing needs against a ticking life clock).
- **Content:** procedural (random species, random mutations, seeded biome
  layout) + emergent (food-chain chases). **Outcome:** reproduce = run success
  bonus, death = run ends; endless meta-progression via DNA + unlocks.
- **Players:** solo. **Session:** minutes. **Engagement:** execution
  (dodging, timing) + discovery (each species' unique struggle, unlocks) +
  accumulation (DNA).
- **Delivery:** desktop + mobile + gamepad. Mobile-first (touch joystick +
  sprint button). Keyboard bound to physical key codes. Strings externalized.

## Experience formula
The player feels the comedic desperation of survival because the game
constantly throws an animal's specific real-life struggle at them on a ticking
life clock, so every meal and near-miss matters.

## Core loop
spawn (random animal + mutations) → survive childhood → eat the right food →
grow through life stages → dodge dangers → reach adulthood → reproduce (big
bonus) → grow old → die → earn DNA → unlock a new species → repeat.

## Verbs (few, strong)
- **MOVE** — interacts with land/water/current/predators/food (swim in ocean,
  fight current in river).
- **EAT** — only the species' correct food refills hunger + grows you + earns
  DNA; wrong food does nothing.
- **SPRINT** — burns energy, escapes predators.
- **REPRODUCE** — adult + well-fed + at the nest/mate → success.

## Life stages
Baby → Juvenile → Adult → Elder. Each changes size, speed and look. Only
Adults can reproduce. Needs drain faster as an Elder.

## Mutations (roguelike, seeded per run, shown on the birth card)
Positive: Fast, Strong, Long Life, Fertile, Keen Senses, Tough.
Negative: Small, Weak, Short Life, Clumsy, Always Hungry, Frail.
Each run rolls a mix → a different build every time.

## Species & their ONE big struggle (data-driven)
| Species | Biome | Food | Struggle |
|---|---|---|---|
| Rabbit (start) | Forest | grass | constant predators (foxes) |
| Bee | Meadow | flowers | very short lifespan (fast clock) |
| Penguin | Arctic | fish | freezing cold (warmth drains in the open) |
| Sea Turtle | Ocean | seaweed | reach the ocean as a hatchling (gull gauntlet) |
| Salmon | River | bugs | swim upstream against the current to spawn |
| Fox | Forest | rabbits | catch fast prey before starving |
| Shark | Ocean | fish | must keep swimming + eat constantly |

Unlock order escalates DNA cost. Each species introduces exactly one new
pattern (L3: one new thing at a time).

## Information map
Always visible: hunger, energy, age/life clock, current objective. Predators
telegraph with a danger ring when they aggro. Food is color-coded bright.
Mutations revealed up-front on the birth card.

## Interest curve
Hook: born tiny and immediately vulnerable. Alternating chase peaks and
grazing breathers. Maximum near the end: the reproduce rush as the life clock
runs down, then elder survival and a funny death epitaph.

## STYLE FORMULA (locked — inserted byte-identical into every asset prompt)
> Stylized low-poly 3D, flat matte surfaces with gentle vertex shading and
> almost no textures, detail from faceted geometry; rounded chunky silhouettes
> with oversized heads and big eyes, soft bevels, no hard outlines; biomes in
> soft-saturated naturals (grass green, sky teal, sand gold, arctic ice-blue),
> the hero animal a warm contrasting color that pops, food in bright candy
> hues, predators tinted danger-red; soft warm key light with cozy ambient
> daytime fill; high contrast and instantly readable silhouettes from a
> distance, consistent top-down three-quarter view.

STYLE TOKEN: low-poly 3D, flat matte no-texture, rounded chunky shapes,
soft-saturated nature palette, warm cozy light, top-down

Engine lighting is derived from the formula: warm directional key light +
sky-tinted hemisphere ambient + soft biome-colored fog. Procedural meshes use
flat matte `MeshLambert`-style shading, no textures — the formula governs all
of it.
