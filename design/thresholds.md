# Frozen numbers (agency metrics + balance) — fixed BEFORE content

All live in `public/src/config.js` as data. One change at a time when tuning.

## World / camera
- Arena: circular island, radius ~34 units, soft invisible wall.
- Camera: top-down angled ~50° down, follows player smoothly, distance scales
  with animal size (12–22 units), DPR capped at 2.0.
- Fixed timestep: 60 Hz simulation; seeded RNG (mulberry32).

## Movement (base, before stage/mutation modifiers)
- Base move speed: 7.0 u/s. Sprint multiplier: 1.7×.
- Stage speed mult: baby 0.62, juvenile 0.85, adult 1.0, elder 0.8.
- Mutation speed: Fast +25%, Weak −22%, Small −8% (also smaller).
- Turn smoothing: heading lerps toward input at ~12/s.

## Needs (0..100)
- Hunger: drains 100 over ~70 s idle; +6/s extra while sprinting.
  Eating correct food: +34 hunger. Hunger 0 → starving (health drains).
- Energy: sprinting drains 100 over ~7 s; regen +18/s when not sprinting.
  Can't sprint below 6 energy.
- Health: 100. Predator hit: −45 (Frail = instant). Starving/cold: −12/s.
  Regen +3/s when hunger>55 and not in danger.

## Life clock (the "Age")
- Base lifespan: 150 s of real survival = full life (tuned to land runs in the
  5–15 min band across deaths/restarts and the menu meta-loop).
- Stage gates (fraction of life): baby 0–0.14, juvenile 0.14–0.40,
  adult 0.40–0.82, elder 0.82–1.0. Death at 1.0 (old age).
- Mutations: Long Life ×1.5 lifespan, Short Life ×0.6.
- Bee struggle: lifespan ×0.45 (the "very short life").

## Predators
- Aggro radius: 11 u (shown as danger ring). Predator speed: 6.2 u/s
  (catchable by a skilled juvenile/adult; deadly to a baby at 0.62×).
- Lose-aggro radius: 16 u; gives up after 4 s out of range.

## Reproduction
- Requires: Adult stage + hunger>45 + reach the nest/mate marker.
- Reward: +1 offspring, +120 DNA each, "run successful" flag, score ×1.5.
- Fertile mutation: nest cooldown −40%, can have twins.

## Economy (DNA)
- +2 DNA per correct food eaten.
- +35 DNA for reaching Adult (survived childhood).
- +120 DNA per offspring (the big one).
- +1 DNA per 10 s survived as Elder (longevity bonus).
- Unlock costs (escalating): Bee 60, Penguin 140, Sea Turtle 240,
  Salmon 360, Fox 520, Shark 720.

## Performance budget (weakest = low-end mobile)
- Target 60 fps; hard floor 30 fps on the worst scene.
- Grass/flowers/props use InstancedMesh (one draw call per type).
- No per-frame allocations in update/render; object pools for FX.
- Shadows: single low-res directional shadow, or off on small screens.
- Entity caps: ≤ 26 active predators/prey, ≤ 320 instanced ground props.

## Input forgiveness
- Eat radius: 1.3 u (generous). Player hurt-hitbox 0.8× visual.
- Predator contact uses the predator's honest radius.
- 0.4 s invulnerability flash after a hit.
