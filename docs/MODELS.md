# Tokonmon box models — authoring guide

Tokonmon are built like Cobblemon / Minecraft-mod creatures: a rig of bones holding
boxes ("cubes") and flat cut-out planes, textured with pixel art that is **painted in
code**, and animated with bouncy, hand-tuned clips. The reference model is
`src/vx/mons/chilichick.js` — read it first and match its level of detail.

| file | what it does |
|---|---|
| `src/vx/model.js` | model format, box-UV atlas painting, outline hulls, `Model` |
| `src/vx/anim.js` | `Animator`: clips, crossfades, springs, blink, look-at, expressions; motion helpers |
| `src/vx/fx.js` | pixel particles: fire, breath, ember, smoke, steam, tear, sweat, anger, note, star, spark, bubble, z, feather, ring, drop, splash, leaf, petal, heart, rock, bolt, ghostfire, dust, sparkle, shard — and `defineFx(kind, {...})` for a species' own particles |
| `src/vx/mons/kit.js` | texture painters: `shade`, `feathers`, `fluff`, `gradient`, `ramp`, `poly`, `layer`, `on` |
| `src/vx/mons/<name>.js` | one creature: `export const def` (with `def.anim`) |
| `tools/mon.html` | the viewer (single frames, frame sheets, texture atlas) |

## Units and scale
* 16 units = 1 block = 1 m at `scale: 1`. Cube origins `o` and sizes `s` are in units,
  in **model coordinates** (the same space for every bone — not relative to the bone).
* The model faces **+z** (toward the default camera). Its right side is −x.
* Feet stand on y = 0 at the origin. Pivots are where a bone rotates (shoulder, neck, hip).
* `ppu` = texels per unit (3 for Tokonmon: three times Minecraft's density).
  Sizes that are multiples of 1/3 unit map to whole texels.
* `scale` sets the world size: small mons 0.5–0.8 m tall, medium 1–1.5 m, big 2 m+,
  giants (bosses, legends) 3–4 m.

## The def
```js
export const def = {
  name: 'chilichick', ppu: 3, scale: 0.42, outline: { color: '#1c0a0e', px: 1.4 },
  bones: [
    { name: 'root', pivot: [0, 0, 0], cubes: [] },
    { name: 'body', parent: 'root', pivot: [0, 7.6, 0], cubes: [
      { o: [-6.2, 4.2, -5.5], s: [12.4, 7.6, 11], tex: bodyPainter, faces: { south: bellyPainter } },
    ] },
    { name: 'head', parent: 'body', pivot: [0, 11.6, 0.8], rot: [0, 0, 0], cubes: [ ... ] },
  ],
  anim: { ... },
};
```
Cube fields: `o`, `s`, `tex` (painter or '#hex'), `faces` (per-face painters: `south` is the
front, `north` the back, `east` = +x side, `west` = −x side, `up`, `down`), `inflate`,
`rot` + `pivot` (a cube tilted about its own pivot), `mirror` (flip U — use for the left/right
copy of a limb or eye), `plane: 'x'|'y'|'z'` (a flat double-sided cut-out: fins, ears,
flames, toes, ribbons, eyes — set that axis' size to 0), `glow` (unlit, blooms — fire,
glowing eyes, neon), `id` (a part name expressions can toggle), `hide` (start hidden),
`outline: false` (no hull — for mouth interiors and tiny inner bits), `shadow: false`.

## Painting
A painter is `(p, w, h, face, cube) => …` drawing one face into a `Pen` (`p.px`, `p.rect`,
`p.hl`, `p.vl`, `p.line`; texel (0, 0) is the top-left of the face as seen from outside).
Use the kit — it gives the house look:
* `shade(c, { top, bottom })` — lit up-faces, sides banded top → bottom, a lit rim along the
  top edge and a darker seam along the bottom. Clean bands, no noise.
* `feathers(c, { size })` — shingled feather rows; `fluff(c)` — soft down;
  `gradient([...colours])` — beaks, horns, flames; `ramp(cols, t, x, y)` for your own
  banded fills; `poly(p, pts, colour)` for shapes; `layer(...)`, `on(['south'], fn)`.
* Style: Cobblemon-like pixel art at 3× density — strong silhouettes, two or three tones per
  material with crisp bands, darker lines only where forms meet, small highlights. Never fill
  faces with salt-and-pepper noise. Use colour to separate parts (belly patch, face mask,
  markings).
* **Eyes** — the house rules (from the player, in order of importance):
  - No human eyes and no kawaii/anime eyes or blush. Every species gets its **own** Pokémon-like
    eye design (Gen 8–9 official-art language): vary the shape (round, almond, sharp, droopy,
    sleepy), whites or none, iris colour, pupil (round, slit, none) and size.
  - Faces are painted at **full resolution** (`chunk: 1`): hand-drawn eye maps of about 10–16 px
    with a darker iris top, a defined pupil, 1–2 clean highlights and a lid line.
  - Use the shared kit `src/vx/mons/eyes.js`: `eyeRig({ style: 'pix', chunk: 1, map: { open: [...] }, at, ... })`
    gives two eye bones (squash, stretch and dart them in clips) and the `eyes` face slot with
    the expression states (open closed happy shut x swirl shock wide angry sad sleepy heart star
    teary, + wink); lid states are cut from the open map. `chilichick.js` has a reference map.
  - No 3D eyebrow cubes, and no anatomy the animal doesn't have (no ears on birds or fish).
* **Hair, fur and feathers** are styled after the artist (mop-top, mohawk, braids, curls…) — homage, never a likeness.
* **Silhouettes** stay clean and Cobblemon-like: fewer, bigger, readable parts; detail goes into accessories.

## Drip tiers (appearance)
Every Tokon instance has `drip` 1 | 2 | 3 (wild spawns roll 85 / 13 / 2 %) and a `look` seed:
normal wears one accessory, dripped two, ultra dripped three — each tier offers a choice:
`def.drip = [[{ id, name }, { id, name }], [...], [...]]`, every option's cubes tagged with its
id and `hide: true`; `model.drip(level, look)` shows one option per tier. Accessories can't be
bought (buyable **gear** is a separate, invisible stat system). At drip 3 the model is built from
`dripForm(def)` (src/vx/model.js): warm colours turn to black lacquer, yellows to gold, fire burns
blue and sauces turn to truffle; tune it per species with `def.dripForm = { map(hex, glow), fx }`.
Gear can also be fitted at `def.attach = { head, face, neck, back: { bone, at, size } }`.

## Animation (`def.anim`)
```js
anim: {
  start: 'idle',
  breathe: { bone: 'body', amp: 0.02, per: 2.4 },                  // gentle squash
  blink: { slot: 'eyes', closed: 'closed', every: [2.2, 4.8], dur: 0.11 },
  look: { bone: 'head', yaw: 28, pitch: 14, speed: 5 },            // head tracks the target
  springs: [{ bone: 'tail', tip: [0, 5, -3], k: 170, d: 9, gain: 0.9, max: 22 }],
  faces: { eyes: { default: 'angry', states: { angry: ['eye-angry'], closed: ['eye-closed'] } } },
  fidget: { every: [3.5, 7], clips: ['dance', 'dance', 'sip', 'hiccup'] },   // idle variations: the dance shows often
  clips: { idle: { len: 1.2, loop: true, f(P, t, c) { ... } }, cry: { len: 2, next: 'idle', f(P, t) { ... } } },
}
```
A clip function writes **offsets from the rest pose** into `P` every frame:
`P.rot(bone, x, y, z)` degrees · `P.pos(bone, x, y, z)` units · `P.scl(bone, sx, sy, sz)` ·
`P.sq(bone, a)` volume-preserving squash (−) / stretch (+) · `P.face(slot, state)` ·
`P.stream(kind, bone, [x, y, z], { rate, dir, speed, spread })` particles every frame ·
`P.burst(time, kind, bone, [x, y, z], { n, dir, speed })` once when the clock passes `time` ·
`P.lookW` / `P.breathW` / `P.blinkOK` to switch the procedural layers off.
Particle positions are model coordinates; `dir` is in that bone's frame. A species can add its
own particle kinds at module load with `defineFx('studs', { w: 4, h: 4, paint: (p, w, h) => …, life: [0.5, 0.8],
size: [0.05, 0.05], speed: [2, 4], grav: 8, spin: 9 })` (see the presets in `fx.js` for every field).

Helpers from `anim.js`: easing `E.in/out/inout/in3/out3/back (overshoot)/anti (wind-up)/elastic/bounce`,
`seg(t, a, b, ease)` progress through a window, `bump(t, a, b)` 0→1→0, `wob(t, t0, amp, hz, k)`
damped wobble after an impact, `wave(t, hz, phase)`, `key([[t, v, ease], …], t)` keyframes
(Catmull-Rom by default), `bounce(t, per)` → `{ u, sq }` bouncing-ball cycle, `hop(t, per, height)`
→ `{ y, sq }` crouch → launch → arc → land → settle.

Springs give follow-through: the bone's `tip` (model-space offset from its pivot) is pushed
by the bone's own acceleration, so ears, tails, crests, ribbons, fins and antennae lag and
overshoot by themselves. `axes: [x, y, z]` scales each axis of the swing.

### Every Tokonmon needs these clips
`idle` (loop, bouncy, characterful — the clip players see most), `walk` (loop), `cry`
(entrance / roar, 1.4–2.2 s), `attack` (physical), `special` (its element), `hurt` (~0.6 s),
`faint` (→ `next: 'down'`), `down` (loop, knocked out), `win` (victory), `sleep` (loop), plus at
least one fidget clip. Chilichick's `peck` and `breath` are its `attack` and `special` — new
models use the names `attack` and `special`.

### Motion rules (this is what makes it feel polished)
* **Bouncy**: squash on landings and crouches, stretch on take-off, settle with a wobble.
* **Anticipation** before every big action (wind back, crouch), **overshoot** (`E.back`) on the
  way in, **follow-through** (springs + `wob`) on the way out.
* Overlapping action: head, limbs and tail move on offset phases — never all at once.
* Keep feet planted when the body bobs (shift and stretch the legs, see `plant()` in Chilichick).
* Every species has a personality in its idle (Chilichick trembles with rage and cries).
* Effects sell the hits: sparks on impact, dust on stomps, element particles on specials.

## Viewer
```
node tools/shot.mjs "tools/mon.html?mon=NAME&t=0.5&dist=2.2&yaw=20&pitch=8" out.png 960 720 ready 150000
node tools/shot.mjs "tools/mon.html?mon=NAME&clip=cry&sheet=8&dist=2.6&yaw=25&pitch=8" sheet.png 1920 720 ready 250000
node tools/shot.mjs "tools/mon.html?mon=NAME&atlas=1&zoom=3" atlas.png 1536 1024 ready 150000
```
Options: `clip`, `t` (seconds into the clip), `yaw`, `pitch`, `dist` (m), `ty` (look-at height),
`mood` (`day`, `golden`, `night`), `post=0` (no bloom/grade), `sheet=N` with `cols`, `sc`.
Look at the front, the 3/4 view and the back; read the atlas; check every clip as a sheet.

## Originality
Homages are welcome (music, San Francisco); copies are not. Never reproduce real logos, brand
mascots, or real people's likenesses — invent original designs that wink at the source.
