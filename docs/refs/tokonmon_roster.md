# Tokonmon Roster (non-starters): Reference Study & Design Direction

Companion to `docs/TOKONMON.md` §1 (art direction), §3 (roster) and §5 (bonding and Elemental Forms).
This file covers **every non-starter Tokonmon, every evolution, every alternate evolution**, the farm
animals, the untameable beasts and the two lore-only gods. Artists and modelers read the entry for a
creature **before** blocking it out, and build an **original** design from the "Design direction" part.
The references are study material only: **transform them, never copy them.**

> **Owner's words are law.** Each entry starts with the owner's description copied verbatim from
> `docs/TOKONMON.md` §3. Nothing in this file changes, removes or adds to those descriptions. Everything
> under "Design direction" is a visual proposal for how to draw what the owner described.
> Where this file proposes a presentation detail (for example, a crack per kill on Heartbox), it is
> marked *(proposal)* and the bible still wins.

---------------------------------------------------------------------------------------------------

## 0. How to read this file

### 0.1 Reference verification legend

| Tag | Meaning |
|---|---|
| **[S]** | The page came up in a WebSearch during this research pass. The study notes summarise what the search result said about it. |
| **[K]** | This is a well-known canonical page (Wikipedia or Bulbapedia) cited from the researcher's own knowledge. It was **not** opened or search-verified in this pass. **Check it before final art lock.** |
| *approx.* | A hex taken from my knowledge of the artwork or animal. It is **not** sampled from an image, since image downloads were blocked. Use it as a direction only. |

**Research log.** Image downloads and page fetching were blocked in this environment. The study was done
through web-search result text and established reference knowledge. The session's shared WebSearch
budget (200 calls across all parallel agents) ran out partway through this pass.
- **Search-backed [S]:** the Rolling Stone line, Gradbear, Heartbox → Inbloom and most of the Beatlet line.
- **[K]-only:** the remaining entries.
- **Next step:** a short follow-up search pass on the [K] entries is recommended before final lock.
  The design directions themselves do not depend on it.

### 0.2 Global render & sprite rules (apply to every entry)

From bible §1:
- **3D render:** cel shading in **2–3 hard bands**, **hue-shifted shadows**, **1-pixel outlines**, low-res pixel rendering.
- **Animation:** stepped **on twos at 12 fps**.
- **2D:** a matching 2D pixel sprite is used for the phone, scan app, dex, team lists and cut-ins.

**Colour recipe for every palette below.** Each palette is listed in this order:
- **Outline:** darkest. Hue-shifted toward the shadow hue, never pure black except on black creatures.
- **Deep shadow** → **shadow** → **base** → **light** → **highlight.**
- **Signature accent:** the one saturated colour that should read from across the screen.
- **Glow / VFX:** element colour.

Shadows shift toward violet or blue; lights shift toward yellow or warm. Keep **≤ 16 colours per 64 px
sprite** including the outline family. Use selective outlining: the outline lightens to the shadow colour
where it meets a lit edge.

**Element colours already in the codebase** (`src/data/elements.js`, `src/gfx/vfx.js`). Element VFX in
this file use these exact values so the art and the game agree:

| Element | Main | Accent / core |
|---|---|---|
| Pyro | `#ff6a2b` | `#ffd23f` / core `#fff2a0` |
| Hydro | `#2fa8ff` | `#8ff0ff` / core `#e8fbff` |
| Bio | `#5fd35a` | `#ffb3d9` / core `#e8ffd0` |
| Geo | `#d39a5c` | `#8a5a3a` / core `#f0d0a0` |
| Echo | `#b26bff` | `#5ff4ff` |
| Volto | `#ffe23a` | `#ffffff` |
| Cryo | `#9fefff` | `#e6faff` |
| Aero | `#a8f5c8` | `#ffffff` |
| Ecto | `#8a5aff` | `#ff7af2` |
| Ferro | `#b8c4d0` | `#5a6470` |
| Astro | `#ffd98a` | `#6a8aff` |
| Nucleo | `#8aff3a` | `#203a10` / core `#f0ffd0` |

**64 px sprite readability checklist** (dex / team list / scan app):
1. **Silhouette test:** fill the sprite solid black. You must still name the creature, so give it one
   signature shape that breaks the outline (a horn, tongue, tassel, saw-fin, ear-leaves…).
2. **Size class in a 64×64 cell:** base forms use about 36–46 px of height, mid forms 46–56 px, finals and
   legendaries 56–62 px. Legendaries also get a 96 or 128 px battle sprite and a 64 px dex crop of the head
   and upper body.
3. **No detail under 2 px.** Patterns such as studs, rivets, speckles or pips collapse to 2–3 px clusters.
   At most 3–5 of them should read.
4. **Eyes:** 4–6 px tall for cute forms, 3–4 px for menacing ones. Always use a 1 px specular highlight.
   Eyes are the second read after the silhouette.
5. **One accent hue** per sprite at high saturation (the "signature accent"). Everything else stays
   ≤ 70 % saturation.
6. **Three-quarter front view facing left** for dex sprites (Pokémon Gen III–V convention). The 3D battle
   camera faces the side-scroll stage, so author 3D models facing +z (see `docs/MODELING.md`).

**Animation timing (12 fps, on twos).**
- **Idle:** 6–8 poses, looping.
- **Attack:** 2–3 anticipation poses, 1 smear pose, 1 contact pose held 2 frames as hit-stop, then 3
  follow-through poses.
- **Hit:** 1 white-flash pose (body filled with the palette's highlight), 2 recoil poses, settle.
- **Bonded:** bible §5 says the Tokonmon wears the trainer's accessories. **Every head needs a hat/accessory
  anchor point**; each entry names where it sits.

**Archetypes.** The archetype named in each entry (`quad`, `biped`, `hopper`, `serpent`, `flyer`,
`floater`, `swimmer`, `insect`, `octo`, `blob`) matches the animation archetypes in `docs/MODELING.md`.
Some v1 code designs already exist in `src/data/designs/*.js` (for example, `kagarou`, `beatlet`,
`polaris`, `atomic`). Their in-game lore text (`LORE.*`) is quoted where it helps, so the remake stays
consistent with the story already written.

### 0.3 Global style references (pixel/anime targets)

- [K] Pokémon Gen III–IV 64×64 battle sprites and Gen V animated 96×96 sprites: the benchmark for
  64 px readability and for idle loops of 2–8 poses. https://bulbapedia.bulbagarden.net/wiki/Sprite
- [K] *Guilty Gear Xrd*, the GDC 2015 talk "GuiltyGearXrd's Art Style: The X Factor Between 2D and 3D"
  (Junya C. Motomura, Arc System Works). It covers 3D models that look hand-drawn: edited vertex normals
  for clean cel bands, inverted-hull outlines, limited-frame stepped animation, and per-shot
  deformation. This is **the** reference for our "3D that looks super 2D" Tokonmon.
  https://www.gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The
- [K] *Octopath Traveler* (HD-2D) for how 2D sprites sit in 3D dioramas with tilt-shift and dynamic
  light. https://en.wikipedia.org/wiki/Octopath_Traveler
- [K] *Cassette Beasts*, *Sea of Stars*, *Eastward* and *Stardew Valley* for modern pixel creatures,
  limited palettes, and cute-but-expressive faces.
  https://en.wikipedia.org/wiki/Cassette_Beasts · https://en.wikipedia.org/wiki/Sea_of_Stars ·
  https://en.wikipedia.org/wiki/Eastward_(video_game) · https://en.wikipedia.org/wiki/Stardew_Valley

### 0.4 Global Do / Don't for music-based Tokonmon

**Do:**
- Turn a song or album into **one or two visual ideas**: a shape, a colour story, a motion.
- Make the reference a "wink" a fan gets at second glance.

**Don't:**
- **Logos:** never reproduce a band logo or wordmark. This covers the Rolling Stones lips, the Nirvana
  smiley, the Metallica, AC/DC and Queen logos, and the Queen crest.
- **Album art:** never redraw an album cover's composition.
- **Real people:** never draw a real musician's face or likeness on a creature.
- **Text:** never put lyrics or song titles as text on the creature.
- **Audio:** never use real melodies or lyrics in its SFX or music. Bible §10: "only original melodies,
  inspired by the style".

---------------------------------------------------------------------------------------------------

## 1. Rolling Stone line (Geo): Rollingstone → Fivestones → Fiftystone; alt Gradbear

**Owner (bible §3, verbatim):**
> **Rolling Stone line** (Geo)
> - Rollingstone (a rolling stone) → **Fivestones** (5 stones of armor) → **Fiftystone** (a 50-stone giant golem).
> - **Alternate from Rollingstone:** **Gradbear**, a Kanye *Graduation* bear Tokonmon.

*v1 lore of the old stage-1 of this line (`Pebblips`, `src/data/designs/roster.js`): "A rolling stone
gathers no moss, so Pebblips never stops rolling. It sticks its tongue out at anything that tries to make
it sit still." That direction is kept below.*

### 1a. References
- [S] Ultimate Classic Rock, "How the Rolling Stones' Tongue and Lips Logo Was Invented": https://ultimateclassicrock.com/rolling-stones-logo/
- [S] Fabrik Brands, "The story behind the Rolling Stones logo": https://fabrikbrands.com/branding-matters/logofile/rolling-stones-logo-history-lips-and-tongue-logo/
- [S] Norselands Rock, "Tongue and Lips: the story of the Rolling Stones logo": https://norselandsrock.com/tongue-and-lips-rolling-stones/
- [S] Bulbapedia, Geodude / Graveler / Golem: https://bulbapedia.bulbagarden.net/wiki/Geodude_(Pok%C3%A9mon) · https://bulbapedia.bulbagarden.net/wiki/Graveler_(Pok%C3%A9mon) · https://bulbapedia.bulbagarden.net/wiki/Golem_(Pok%C3%A9mon)
- [S] Bulbapedia, Rolycoly / Carkol: https://bulbapedia.bulbagarden.net/wiki/Rolycoly_(Pok%C3%A9mon) · https://bulbapedia.bulbagarden.net/wiki/Carkol_(Pok%C3%A9mon)
- [K] Bulbapedia, Coalossal: https://bulbapedia.bulbagarden.net/wiki/Coalossal_(Pok%C3%A9mon)
- [S] PokéJungle, "Stonjourner: Origin of Species": https://pokejungle.net/2021/06/20/stonjourner-origin-of-species/
- [S] WikiDex, Stonjourner: https://www.wikidex.net/wiki/Stonjourner
- [S] Bulbapedia, Regirock: https://bulbapedia.bulbagarden.net/wiki/Regirock_(Pok%C3%A9mon)
- [S] Bulbapedia, Golurk (sealed-golem reference, shared with Heartbox): https://bulbapedia.bulbagarden.net/wiki/Golurk_(Pok%C3%A9mon)
- [S] New World Encyclopedia, Inuksuk: https://www.newworldencyclopedia.org/entry/Inukshuk
- [S] Vancouver Biennale, "We Are Here" (inuksuk meaning): https://www.vancouverbiennale.com/artworks/we-are-here-english/
- [K] Wikipedia, Fivestones (the traditional jacks game played with five small stones; *gonggi* in Korea, *otedama* is the Japanese bean-bag cousin): https://en.wikipedia.org/wiki/Fivestones
- [K] Wikipedia, Stone (unit). One stone = 14 lb, so "fifty stone" = 700 lb ≈ 317.5 kg, a pun for writers: https://en.wikipedia.org/wiki/Stone_(unit)
- [K] Wikipedia, Osaka Castle. Its *ishigaki* dry-stone walls include the giant **Tako-ishi** ("octopus stone") at the Sakuramon gate, the largest stone in the castle. Osaka Castle Park is the game's starting area: https://en.wikipedia.org/wiki/Osaka_Castle
- [K] Wikipedia, "Rollin' Stone" (Muddy Waters, 1950), the song the band named itself after: https://en.wikipedia.org/wiki/Rollin%27_Stone

**Gradbear references**
- [S] Wikipedia, Graduation (album): https://en.wikipedia.org/wiki/Graduation_(album)
- [S] Wikipedia, Dropout Bear: https://en.wikipedia.org/wiki/Dropout_Bear
- [S] American Songwriter, "The Story Behind Kanye West's Fantastical 'Graduation' Album Cover": https://americansongwriter.com/graduation-kanye-west-album-cover-story/
- [S] Hypebeast, "Kanye West Graduation Album Artwork by Murakami": https://hypebeast.com/2007/8/kanye-west-graduation-album-artwork-murakami
- [S] Walker Art Center, "Murakami designs Kanye's cover art": https://walkerart.org/magazine/kanye-calls-murakami
- [S] Juxtapoz, "Sound + Vision: Kanye West's Graduation by Takashi Murakami": https://juxtapoz.com/news/music/sound-vision-kanye-west-s-graduation-by-takashi-murakami/
- [S] Wikipedia, Takashi Murakami (Superflat): https://en.wikipedia.org/wiki/Takashi_Murakami
- [S] Music Mascots Archive, Dropout Bear: https://musicmascotsarchive.com/mascot/dropout-bear
- [S] Hypebeast, "Kanye West UniverseCity Jacket": https://hypebeast.com/2008/6/kanye-west-universecity-jacket

### 1b. Study notes

**Tongue & Lips logo [S]**
- John Pasche, an RCA postgraduate, designed it in 1970.
- It first appeared on the *Sticky Fingers* inner sleeve in 1971 and has stayed essentially unchanged.
- Pasche cites Mick Jagger's mouth and the goddess Kali's protruding tongue.
- The V&A calls it one of the most recognisable rock symbols.
- **Visual grammar** (from knowledge):
  - Glossy, pop-art, thick black outline.
  - The tongue lolls downward and outward, tip curling.
  - Approx. colours: lips/tongue red `#d7141a`, teeth white `#ffffff`, outline `#000000` *(approx.)*.
- **What we take:** a **cheeky stuck-out red tongue** as an *expression* and a defiant attitude. **What
  we leave:** the lips shape, the teeth, and the logo silhouette.

**Geodude → Graveler → Golem [S]**
- A Rock/Ground line.
- **Geodude:** a boulder with two arms and no legs.
- **Graveler:** a lumpy rock pile with 4 arms and 2 legs.
- **Golem:** Bulbapedia calls it a *"bipedal tortoise-like boulder"*. Its head and limbs poke out of a
  round shell, and it tucks them in to roll.
- **Lesson:** rolling is sold by **retractable limbs**. The ball pose must still be the same silhouette as
  the standing pose minus limbs.
- **Avoid:** "boulder plus two arms".

**Rolycoly / Carkol [S]**
- **Rolycoly:** a coal lump with a **single glowing orange-red eye** and **a wheel-like leg** it rolls on.
- **Carkol:** a minecart with four wheel-legs.
- **Lesson:** the *locomotion* is drawn as anatomy (wheel = leg), which makes the gimmick readable at a
  glance. Coalossal [K] grows into a slag-heap giant whose cracks glow, which gives the "growing hot core"
  progression.

**Stonjourner [S]**
- A Stonehenge-based design.
- Its body is a series of connected rocks forming arms, head and legs.
- The head is like a lintel on two standing stones.
- The legs carry grey cross or Celtic-like marks, and the body has dark spots.
- **Lesson:** a golem reads as *made of separate stones* when every stone has its own silhouette and
  crevice-shadow. Fiftystone needs this badly: every one of its 50 stones should be a separate
  silhouette.

**Regirock [S]**
- A golem of beige and orange rocks.
- It has **no eyes or mouth**. Its face is **seven orange dots in an "H"**.
- The Regi trio is popularly read as Stone/Ice/Iron "ages".
- **Lesson:** an abstract dot-face signals "ancient construct". We want the *opposite* for this line (a
  cheeky anime face that grows *more* ancient-looking over evolution). Fiftystone can mix both: anime eyes
  plus carved mason marks.

**Golurk [S]**
- A clay automaton with a **brown seal strap on a glowing chest crack**. If the seal is removed, it
  rampages.
- The straps wrap its limbs.
- **Lesson:** "a seal holds the power in" reads instantly. This is used mainly for Heartbox (section 2).

**Inuksuk [S]**
- Always 2+ local stones, **stacked so they must balance**.
- The name is often glossed "in the image of man".
- A small top stone plus wide arms reads as a person with outstretched arms.
- Inuksuit are waymarkers ("point the way"), and some honour reverent places.
- **Lesson:** the **fewest, biggest stones = the strongest human silhouette**. Balance tension (a big stone
  on a small one) gives instant character.
- **Respect note:** inuksuit are culturally specific Inuit structures, so don't make Fiftystone *an
  inuksuk*. Use the general "balanced cairn" physics only.

**Fivestones game [K]**
- Five small stones (or bags); toss one up and scoop the others before catching it.
- This gives a built-in idle animation (juggling and catching its own armour stones) and a parry
  (stones snap into a wall).

**Osaka Castle *ishigaki* [K]**
- Huge dry-laid granite walls with sloped (*musha-gaeshi*) curves.
- They range from rough natural stones (*nozura-zumi*) to fitted cut stones (*kirikomi-hagi*).
- Many stones bear carved mason/daimyo marks (*kokuin*).
- **Lesson:** this is a home-grown Osaka source for Fiftystone's masonry. It is original to our setting
  and not used by any Pokémon.

**Graduation / Dropout Bear [S]**
- **The bear:** Sam Hansen designed the original, and it fronted West's first three albums. For
  *Graduation* (2007) Takashi Murakami redesigned it and art-directed the album and singles. Sources say
  the realistic bear was replaced by "a cartoon depiction surrounded by bursts of vibrant colors and
  nonsensical action."
- **Front cover:** the bear is **shot out of the mouth of a large abstract being against a sunset**.
  Animals in graduation gowns dance on top of the being, in a fictional "Universe City".
- **Back cover:** it continues with the bear fired from a cannon "into another stratosphere".
- **Style:** a pastel palette tied to Superflat, meaning flat planes of colour, surface over depth, and
  high and low culture blurred together. One low-reliability source says purples, pinks and blues.
- **Approx. palette (from knowledge, not sampled):**
  - lavender sky `#b9a2ff`
  - bubblegum pink `#ff8fcf`
  - candy cyan `#7fe6ff`
  - lemon `#fff07a`
  - mint `#9ff2c4`
  - bear brown `#8a5634`
  - cream muzzle `#f4dcc0`
- Era iconography (from knowledge): mortarboard caps with tassels, and shutter-shade sunglasses
  (Graduation-era fashion).

### 1c. Design direction

**Shared line identity**
- **Polish:** the stones are **river-polished** and smooth ("gathers no moss"). Moss appears *only* on
  Fiftystone, the first form big enough to stop rolling *(proposal)*.
- **Signature accent:** the **red tongue** carries through every form.
- **Geo style:** walls and parries. Every form's defensive move is "stones snap into a barrier".

**Shared palette (granite):**

| Role | Hex |
|---|---|
| Outline | `#2b1f2a` |
| Deep shadow | `#4a3a4c` |
| Shadow (violet-shifted) | `#7a6876` |
| Base | `#b5a38c` |
| Light | `#dccbad` |
| Highlight | `#f6ecd6` |
| Speckle | `#6e5e66` |
| Tongue | `#e0323c` / light `#ff7b80` / mouth interior `#5a1424` |
| Eye iris | amber `#f2a33a` |
| Eye white | `#fff6e8` |
| Geo VFX | `#d39a5c` / `#f0d0a0` |

#### Rollingstone (stage 1, about 0.5 m, arch `blob` with a roll mode)

- **Silhouette:**
  - A slightly egg-shaped river pebble that is head and body in one.
  - Two stubby pebble feet and two tiny pebble hands that **retract fully** when it rolls (the Golem
    lesson).
  - The rolling pose is a clean ellipse plus the tongue.
- **Face:**
  - Big anime eyes in the upper third, under a smooth stone brow ledge.
  - A wide crack-mouth that splits the pebble like a grin.
  - The **tongue sticks out** to one side as its resting expression.
  - When rolling, the eyes become `> <` and the tongue wraps around the body like a red ball seam. That
    gives the roll a visible spin cue.
- **Accessory anchor:** the top of the head (a hat sits like a cap on a pebble).
- **Animations:**
  - **Idle:** rocks heel-to-toe in 6 poses. On every 3rd loop the tongue wiggles out and in.
  - **Attack "Rolling Start":** 2 squash poses, then tuck, then a 4-pose roll loop with smear lines and
    dust puffs. It bounces off the target with a 2-frame hit-stop.
  - **Taunt (emote):** blows a raspberry.
  - **Hit:** a white flash with a hairline crack decal, then a spin backwards, then it pops upright.
- **VFX:** Geo dust puffs, skid sparks, cube "chip" particles (Geo projectiles already use cube
  particles in `vfx.js`).
- **64 px:**
  - About 38 px tall.
  - The red tongue is the only saturated pixel cluster, and it is the read.
  - Speckles: 3 clusters, 2 px each.
  - Mouth line: 1 px dark plus 1 px light lip below it.

#### Fivestones (stage 2, about 1.2 m, arch `biped`)

- **Concept:** "5 stones of armor".
- **Body:** Rollingstone's pebble body grows into a short, stocky biped. The grin mouth stays on the
  chest-head, so it is a head-body like a cairn.
- **The 5 armour stones:** five distinct, smoother, darker stones are worn as armour:
  - ① helmet stone
  - ②③ two shoulder pauldrons
  - ④⑤ two fist stones, like boxing gloves of rock
- Each stone carries **carved pips 1–5** like dice, in glowing amber `#ffb23a`. A player can count the
  "five" at a glance, and the stones become UI-free ammo readouts *(proposal: pips only, no mechanic
  implied)*.
- **Shape language:** body round and soft, armour stones flatter and harder-edged. The contrast reads as
  armour.
- **Palette addition:**
  - Armour stones: slate `#5c6478` / light `#8d97ab` / shadow `#363a52`.
  - Pips: `#ffb23a` with a `#fff2c4` core.
- **Animations:**
  - **Idle:** the Fivestones *jacks* juggle. It tosses the helmet-stone ① up, scoops a fist stone, and
    catches ① back on its head (8 poses).
  - **Parry (Geo):** all five stones fly off and lock into a pentagon wall in front of it (3 poses), hold,
    then snap back.
  - **Attack:** a stone-fist one-two (fist stones ④⑤), or a thrown fist stone that boomerangs back.
  - **Hit:** a stone wobbles loose, then it slaps it back.
- **Accessory anchor:** on top of helmet-stone ①.
- **64 px:**
  - About 50 px tall.
  - The five armour stones are each ≥ 6 px, so they read as separate shapes against the lighter body.
  - Only pips ① and ⑤ need to resolve (2–3 px).
  - The tongue stays.

#### Fiftystone (final, about 2.6 m, arch `biped`)

- **Concept:** "a 50-stone giant golem".
- **Construction:** exactly **50 separate stones** are modelled. Count them in the model.
  - Lower body: big castle-wall blocks.
  - Torso: a fitted *ishigaki* masonry chest, flared like a castle-wall *musha-gaeshi* curve.
  - Arms: stacked cairn columns.
  - Shoulders: a lintel slab across them (the inuksuk and Stonjourner "few big stones" lesson, applied to
    only the shoulders and head).
- **Face:**
  - The head is a single great stone.
  - The **grin mouth and red tongue remain** (lineage).
  - The anime eyes become deep-set and glowing amber in shadow.
- **Signature detail:**
  - Carved **mason marks (*kokuin*-style) on many stones**, using original simple glyphs (circles,
    triangles, the 1–5 pip shapes from Fivestones). Never use real clan crests.
  - The marks glow amber when it parries.
  - A tuft of **moss** on the shoulders, because it finally stopped rolling *(proposal)*.
- **Palette addition:**
  - Big blocks: warm granite as shared.
  - Ishigaki chest: cooler grey `#9a9aa2` / shadow `#5e5a72`.
  - Moss: `#5f9a3a` / `#a7d06a`.
  - Mark glow: `#ffb23a` → `#fff2c4`.
- **Animations:**
  - **Idle:** slow breathing, where stones shift a pixel against each other (a grinding wobble).
    Pebbles trickle from its joints.
  - **Attack:**
    - **"Landslide" palm:** an overhead two-hand slam. It anticipates for 3 poses, then the ground
      buckles.
    - **"Fifty-Stone Rain":** it throws a handful of its own small stones, which regrow.
  - **Parry:** it crouches and the chest masonry fans out into a castle wall.
  - **Hit:** one stone cracks and pops out a pixel, with a dust burst.
- **VFX:** heavy dust rings, ground cracks with Geo glow, falling pebbles with tiny bounces.
- **64 px:**
  - Fills about 60 px.
  - Only about 12 big stones resolve as separate blobs. The remaining stones become 1 px crevice lines.
  - Keep the head stone, the tongue and the two amber eyes as the read.
- **Elemental Form idea (Geo, final): "Ishigaki Citadel".**
  - The 50 stones re-fit into a perfect *kirikomi-hagi* fitted-stone body.
  - Every seam glows molten amber.
  - About 8 stones detach into an **orbiting ring-wall** around it (a living Geo barrier).
  - The head-stone gains a tall stepped crest, like a castle keep's silhouette, without a literal roof.

#### Gradbear (alt from Rollingstone, about 1.4 m, arch `biped`)

- **Concept:** "a Kanye *Graduation* bear Tokonmon". The alternate path turns the rolling stone into a
  **stone teddy bear that launches itself like a cannonball**. This is the Graduation cover's
  "bear fired into the sky", turned into Rollingstone's rolling move.
- **Silhouette:** big round head (about 45 % of height, superflat-cute), round ears, a pear body, short
  limbs. A **slate mortarboard cap** with a gold tassel is part of its anatomy: a flat stone slab fused to
  the head like a crest. The tassel is the outline-breaker at 64 px.
- **Material & shading:**
  - The bear is polished river stone.
  - **Superflat decals** are painted flat with no cel bands: a pastel "graduation sky" gradient band on
    the belly (lavender → pink → cyan) and a few 4-point sparkle stars.
  - This is the only creature where flat unshaded pattern areas are intended. It mixes Murakami-style
    flatness with our cel-shaded body.
- **Face:**
  - Large round anime eyes.
  - The pupils get **horizontal shutter-stripe highlights** (3 white bars), a wink at the Graduation-era
    shutter shades without drawing glasses.
  - It keeps the **red tongue** (lineage), poking out of a happy bear muzzle.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#2a1a2a` |
| Fur-stone shadow | `#5a3550` |
| Base | `#8a5a3c` |
| Light | `#c48a5a` |
| Highlight | `#f0c08a` |
| Muzzle | `#f4dcc0` |
| Cap | `#2c2a40` / `#4a4868` |
| Tassel | `#ffcf3a` |
| Belly sky | `#b9a2ff` → `#ff8fcf` → `#7fe6ff` |
| Sparkles | `#fff07a` |
| Tongue | `#e0323c` |

- **Animations:**
  - **Idle:** sways side to side to an off-screen beat, and the tassel swings on twos.
  - **Attack "Commencement Launch":**
    - It curls into a ball (Rollingstone heritage) and drops into the ground as a launch crouch.
    - It **rockets up off-screen**, then slams down as a pastel-trailed meteor.
    - The rainbow-pastel smear trail is the one place this line gets saturated colour.
  - **Hit:** the cap spins 360° on its head, then lands back.
  - **Emote:** tosses its cap; it boomerangs back.
- **VFX:** pastel confetti cubes, star sparkles, and a soft pink shockwave ring on landing, mixed with
  Geo dust.
- **64 px:**
  - The cap and tassel plus round ears form a unique triple-bump silhouette.
  - The belly gradient is 3 flat bands of 2–3 px.
  - Eyes are 6 px with 3 single-pixel shutter lines.
- **Elemental Form idea (Geo, final): "Dean's Comet".**
  - The stone shell cracks into a **pastel geode** (amethyst-pink crystals inside).
  - A ring of orbiting pastel stones forms a halo of "graduation stars".
  - The cap becomes a floating, rotating slab.

### 1d. Do / Don't
- **Do:**
  - Use the stuck-out tongue as **attitude**.
  - Use the jacks game for Fivestones and Osaka Castle masonry for Fiftystone.
  - Use pastel superflat *flatness* plus a cannonball launch for Gradbear.
- **Don't:**
  - **Rolling Stones logo:** draw lips, teeth or the logo's tongue silhouette, or red-lips-on-white.
  - **Pokémon look-alikes:** make Rollingstone "a boulder with two arms" (Geodude). Make Fiftystone a
    Stonehenge trilithon (Stonjourner), or give it a dot-face (Regirock).
  - **Gradbear and Murakami:** copy Murakami's smiling flowers, the Murakami/Hansen bear head shape, the
    "Universe City" scene, or the abstract mouth-launcher. Put no text, collegiate letters or "Graduation"
    wording on Gradbear.
  - **Real crests:** use real clan crests for the mason marks.
  - **Inuksuk:** present Fiftystone as an Inuit inuksuk.

---------------------------------------------------------------------------------------------------

## 2. Heartbox → Inbloom (Ecto)

**Owner (bible §3, verbatim):**
> **Heartbox → Inbloom** (Ecto): a gimmick Tokonmon, a heart-shaped box inspired by **Nirvana**.
> - **Starts as a giant golem:** super slow, and does almost no damage.
> - **Transformation:** when you **bond** with it and it **gets kills**, the box breaks and reveals **Inbloom**, a beautiful humanoid angel with blades.
> - *The name nods to "In Bloom"; the angel nods to the* In Utero *angel.*

And §5: "**Heartbox → Inbloom** requires bonding plus kills while bonded."

### 2a. References
- [S] Radio X, "The making of Nirvana's final video" (Heart-Shaped Box): https://www.radiox.co.uk/artists/nirvana/making-of-heart-shaped-box-video-meaning/
- [S] The Daily Beast, "How Nirvana shot the Heart-Shaped Box video": https://thedailybeast.com/how-nirvana-shot-the-heart-shaped-box-video
- [S] Elephant, "Anton Corbijn's terrifying technicolor Nirvana video": https://elephant.art/anton-corbijns-terrifying-technicolor-nirvana-video
- [S] Songfacts, Heart-Shaped Box: https://www.songfacts.com/facts/Nirvana/Heart-shaped-box
- [S] SPIN on the video: https://www.spin.com/?p=99780
- [S] Far Out, "The Cover Uncovered: In Utero": https://faroutmagazine.co.uk/behind-the-artwork-of-nirvana-album-in-utero/
- [S] People's Graphic Design Archive, *In Utero*: https://peoplesgdarchive.org/item/17486/in-uteroandnbsp
- [S] Loudwire, meaning behind the *In Utero* title: https://loudwire.com/meaning-behind-nirvana-in-utero-album-title/
- [S] Liquisearch, *In Utero*, packaging and title: https://www.liquisearch.com/in_utero_album/packaging_and_title
- [S] Far Out, "The Cover Uncovered: Nevermind": https://faroutmagazine.co.uk/nirvana-nevermind-cover-story/
- [S] Flashbak, Kirk Weddle, "How I Shot The Cover To Nirvana's Nevermind": https://flashbak.com/how-i-shot-the-cover-to-nirvanas-nevermind-419252/
- [S] People's Graphic Design Archive, Nirvana smiley-face logo: https://peoplesgdarchive.org/item/18025/nirvana-smiley-face-logo
- [S] Radio X, "The story behind Nirvana's smiley face logo": https://radiox.co.uk/artists/nirvana/what-does-the-nirvana-smiley-face-logo-mean
- [K] Wikipedia, In Bloom (the 1992 video is a black-and-white parody of an early-1960s TV variety show): https://en.wikipedia.org/wiki/In_Bloom
- [K] Wikipedia, Transparent anatomical manikin: https://en.wikipedia.org/wiki/Transparent_anatomical_manikin
- [S] Bulbapedia, Gallade: https://bulbapedia.bulbagarden.net/wiki/Gallade_(Pok%C3%A9mon)
- [K] Bulbapedia, Gardevoir: https://bulbapedia.bulbagarden.net/wiki/Gardevoir_(Pok%C3%A9mon)
- [S] Bulbapedia, Iron Valiant (blade gauntlets and petal-like dress guards), surfaced in the Gallade results: https://bulbapedia.bulbagarden.net/wiki/Iron_Valiant_(Pok%C3%A9mon)
- [S] Wikipedia, Pyra and Mythra (Xenoblade Chronicles 2): https://en.wikipedia.org/wiki/Pyra_and_Mythra
- [S] Xenoseries Wiki, Pneuma: https://xenoserieswiki.org/wiki/Pneuma
- [S] Gematsu, "NieR: Automata leads discuss main characters…" (2B's blades, Akihiko Yoshida's design brief): https://www.gematsu.com/2015/11/nier-automata-leads-discuss-main-characters-gender-skirt-destruction-more
- [S] Bulbapedia, Golurk (sealed power): https://bulbapedia.bulbagarden.net/wiki/Golurk_(Pok%C3%A9mon)

### 2b. Study notes

**Heart-Shaped Box video (Anton Corbijn, 1993) [S]**
- **Production:** every frame was **shot in colour, transferred to B&W, then hand-painted** to mimic
  Technicolor. The result is a garish, saturated, slightly wrong colour world.
- **Imagery** (Cobain's sketches plus Corbijn's additions):
  - a thin old man on a cross wearing a Santa hat
  - fake nodding crows
  - a poppy field / poppy road
  - paper butterflies and mechanical birds
  - a girl in a robe that turns from white to black
  - a large woman painted with organs to look like the *In Utero* figure
  - hospital-room bookends
- **Approx. palette** of the hand-painted look:
  - poppy red `#d6262b`
  - acid grass `#6fb83a`
  - painted sky `#4fb8d8`
  - sickly yellow `#e8d24a`
  - tree black `#1a1414`
  - hospital white `#efeee6`
- **What we take:** **hand-tinted saturated colour**, **poppies**, **mechanical birds and paper
  butterflies**, and the **heart box** as an object.
- **What we never take:** the crucifix, the robe/hood imagery, the hospital/IV material, and fetuses.

***In Utero* cover (Robert Fisher with Cobain) [S]**
- A postcard of a **Transparent Anatomical Mannequin** collaged with **cut-out wings**.
- **Back cover:** Cobain's collage of model fetuses and body parts on **orchids and lilies**.
- **Visual grammar** (from knowledge): a frontal, symmetrical, see-through body with internal organs and
  red/blue vessels visible, and angel wings behind. Warm cream ground.
- Approx: background `#e9d3b0`, vessels `#c0392b` / `#2f5fa8`, wing cream `#f4ecd8` *(approx.)*.
- **What we take:** **see-through body with visible "inner structure"** and **wings**, plus **orchids and
  lilies** from the back cover.
- **Transformation:** organs become flower and vine anatomy.

***Nevermind* [S]**
- Kirk Weddle's underwater shot. The **dollar bill on a fishhook** was stripped in during
  post-production.
- **What we take:** at most a hook-shaped curl on Heartbox's ribbon ends (lure/temptation). Optional.

**Smiley logo [S]**
- X eyes and a squiggle mouth with a tongue, yellow on black.
- Authorship is disputed (Cobain vs. Robert Fisher), and it was the subject of a lawsuit with Marc
  Jacobs.
- **Never reference it.** It is trademark-hot.

**Angel-with-blades benchmarks**
- **Gallade [S]:** elbow blades that extend and retract, tonfa-shaped forearms, a helmet-like crest. It
  is Gardevoir's skirt removed for a martial stance.
- **Gardevoir [K]:** a gown silhouette that flares from a narrow waist, and a chest spike.
- **Iron Valiant [S]:** detachable blade gauntlets, and **five petal-like guards that resemble a dress**.
  This is the closest precedent for "petal dress = armour".
- **Mythra/Pneuma [S]:** wing-mechanisms that **hover detached behind the back**, a sword with a
  ring-shaped crossguard glowing with ether, white/green crystalline ornament (designer Masatsugu Saito).
- **NieR: Automata 2B [S]:** blades plus elegant cloth; Yoshida's brief was "an outfit good for cosplay".
- **Lessons:**
  - Angels with blades read best as a **slender vertical silhouette plus wide detached wing-shapes**.
  - Blades should be **part of the anatomy** (forearms, wing feathers) rather than held props.

**Golurk [S]**
- A brown seal strap on a glowing chest crack keeps its energy in. Remove it and the golem rampages.
- **Lesson for Heartbox:** **ribbons and straps = the seal**, and the **glow leaking at the seams = the
  angel inside**. The player should *feel* something is trapped in the box from the first sighting.

### 2c. Design direction

#### Heartbox (giant golem, about 2.4 m, arch `biped`, slow)

- **Silhouette:**
  - A **giant heart-shaped gift box standing upright**.
  - The heart's two lobes are **huge rounded shoulders**, and the point is at the pelvis.
  - Two short pillar legs (box-corner feet) come out from under the point.
  - Two long, heavy, hanging arms come out of the lobes, made of folded cardboard with taped joints.
  - It looks like a sad, top-heavy toy-box golem.
- **Box anatomy:**
  - A **lid seam runs all the way around its body** at shoulder height.
  - A **satin ribbon crosses its chest** and ties in a drooping bow at its back. This is the "seal".
- **Material:**
  - Dented, slightly faded **satin-covered card** in a hand-painted Technicolor feel.
  - The cel bands are offset by 1 px from the outline in places to fake hand-tinting misregistration
    *(proposal)*.
- **Face:**
  - No mouth.
  - **Two small eye-holes punched in the lid**, through which a **soft pink Ecto light** stares out.
  - That is the angel inside looking through. Its *blinks* are the light dimming.
- **Signature details:**
  - **Pressed poppies** and **paper butterflies** stuck to the box like old decorations.
  - A **light leak** at the lid seam that brightens whenever it is near a kill *(proposal)*.
  - An optional ribbon end that curls into a hook.
- **Accessory anchor:** the top dip between the two lobes. A hat sits in the heart's notch.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#2a0f1e` |
| Satin deep | `#5a1430` |
| Satin shadow (violet-shifted) | `#8a1f45` |
| Satin base | `#b8283f` |
| Satin light | `#e05a5a` |
| Satin sheen | `#ff9a8a` |
| Ribbon | `#f2e6d0` / shadow `#b8a6a8` |
| Cardboard joints | `#a8865a` / `#d8b88a` |
| Poppies | `#ff3a2a` with `#1a1414` centres |
| Inner glow (signature) | Ecto `#ff7af2` → core `#ffe0f6` |

- **Animations:** super slow. Every pose is held 2× longer than normal, at 6 effective poses per second.
  - **Idle:** a heavy heave, where the lid lifts 1 px and the glow breathes through the gap. The ribbon
    tails sway.
  - **Walk:** a lumbering waddle, corner-to-corner.
  - **Attack "Hug":** a slow two-arm clap-hug with comic soft impact (almost no damage). The VFX is a
    puff of dust and two paper butterflies, not a spark.
  - **Hit:** the box **dents inward** and pops back out with a cardboard "boing". A poppy falls off.
  - **Bond aura while bonded (proposal):** the seam glow turns from pink to white-gold.
- **Transformation cinematic** (requires bond plus kills while bonded, per the bible):
  - *(proposal)* Each kill adds a glowing crack line to the lid, so the player can see it coming.
  1. The ribbon **snaps**.
  2. The box **opens like a flower bud**: the heart's lid and walls split into 5–6 petal panels that fold
     outward and fall. This is "In Bloom" made literal.
  3. Light pours up.
  4. Inbloom rises from the open box, and the panels shatter into falling petals.
  5. Stepped timing: hold the closed bud 6 poses, burst open over 3 poses, rise over 8.
- **64 px:**
  - Heart silhouette, about 58 px.
  - The ribbon cross is 2 px light lines.
  - The two pink eye-holes are 3×3 px with a 1 px glow halo. They are the read.
  - Poppies are 2×2 red dots, 3 of them.
- **Note:** Heartbox is not a final evolution, so it has no Elemental Form.

#### Inbloom (revealed form, about 1.9 m, arch `biped` with a low hover)

- **Silhouette:**
  - A **slender, tall humanoid angel**, floating 10–20 cm off the ground.
  - The lower body is a **flared petal skirt** made of the broken box panels re-formed as 5 armoured
    petals (the Iron Valiant lesson, made floral and ours).
  - **Two large wings** hover *detached* behind the shoulders (the Pneuma lesson). Their primary feathers
    are **blades**.
  - The forearms end in **petal-shaped blades** that unfold from the wrist (the Gallade lesson as
    flower-blades).
- **Anatomy-as-flower (the *In Utero* transformation):**
  - The torso is **translucent pearl**.
  - Inside, instead of organs, there is **a glowing orchid/lily heart** where the heart would be.
  - **Vine-like veins** spread from it in rose and cobalt, echoing the red/blue vessels of the anatomical
    figure without showing organs.
  - This is the "see-through body" read, turned into botany.
- **Head:**
  - Androgynous, serene anime face with closed or half-lidded eyes. They open fully on its ultimate
    *(proposal)*.
  - Short, wind-blown hair made of pale petals.
  - **A halo made from the broken heart-box lid**: a thin heart-shaped ring floating behind the head,
    with a cracked gap. That is the accessory anchor's backdrop, and hats sit on the hair.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#3a2450` |
| Pearl body shadow (violet) | `#9a86b8` |
| Pearl body base | `#e6def0` |
| Pearl body light | `#f8f4fc` |
| Pearl body inner glow | `#ffd6e6` |
| Flower heart | `#e04dbe` → `#ff9ae0` → core `#fff0fa` |
| Veins | rose `#ff5c8a`, cobalt `#4a6cff` |
| Blades | steel-pearl `#dfe6f2`, shadow `#8a7fb0`, edge `#ffffff` |
| Wing cream | `#fbf3e3` |
| Skirt-petal satin (box remnant) | `#b8283f` / `#e05a5a` |
| Ecto VFX | `#8a5aff` / `#ff7af2` |

- **Animations:**
  - **Idle:** a slow hover-bob of 1 px per 2 poses. The wings breathe, and blade-feathers chime by
    catching light in a 1-pose specular glint that travels feather to feather.
  - **Attack "Petal Edge":** a fast cross-slash with both forearm blades, then a pirouette that flings
    petal-blades in a spiral.
    - Ecto trickery: a phase-step, flickering to 50 % dither, before the cut.
    - Stark contrast with Heartbox's slowness: anticipation is 1 pose and contact is instant.
  - **Hit:** the translucent body flashes white, and petals shed from the skirt.
- **VFX:**
  - Rose and Ecto petals.
  - Thin vertical light shafts.
  - Hand-tinted "misregistered" colour flashes on crits (the video's Technicolor feel).
- **64 px:**
  - A vertical diamond silhouette (wings wide at the top, skirt wide at the bottom, slim waist).
  - The **flower heart** is a 3–4 px magenta glow in the centre of the chest and is the read.
  - The halo is a broken 1 px ring.
- **Elemental Form idea (Ecto, final): "Full Bloom".**
  - The two wings split into **six blade-wings** arranged behind it like the petals of an open flower or
    a rose window.
  - The body becomes almost fully transparent, with only the vines and the flower heart solid.
  - The halo closes into a complete heart.
  - Blades float around it in a slow orbit.

### 2d. Do / Don't
- **Do:**
  - Use the hand-painted Technicolor saturation, poppies, mechanical birds and paper butterflies.
  - Make the box open like a **blooming flower**.
  - Show a see-through body with **botanical** insides.
  - Treat ribbons as a seal.
- **Don't:**
  - **Smiley:** use the Nirvana smiley in any form, including X eyes or a squiggle mouth.
  - ***In Utero* cover:** reproduce the mannequin, its pose, or the typewriter cover type.
  - **Sensitive imagery:** use crosses or crucifixion, a Santa-hat old man, robes or hoods, IV drips,
    fetuses or organs. Never.
  - **Likeness:** make Inbloom resemble Kurt Cobain or any real person.
  - **Inbloom vs. Gardevoir:** copy Gardevoir's chest spike or gown silhouette. Ours is a petal skirt plus
    detached blade-wings.

---------------------------------------------------------------------------------------------------

## 3. Beatlet (Bio) and its four member forms: Lenshorn / McCarapace / Harrisun / Starrab

**Owner (bible §3, verbatim):**
> **Beatlet** (Bio), a Beatles-inspired beetle. It evolves into **four forms based on the members**:
>
> | Form | Element | Condition |
> |---|---|---|
> | **Lenshorn** | Echo | defeat 20 Lemmo + the Alpha Lemmo boss in the safari |
> | **McCarapace** | Hydro | deep friendship by the Dotonbori canal |
> | **Harrisun** | Pyro | dojo meditation, then sunrise |
> | **Starrab** | Geo | 25 team combos |

And §2: you "borrow a kid's **bug-type beetle** Tokonmon (Beatlet)" for the punk 3v3. Taro is "kid with
the beetle". *(Research brief: forms are based on the members' iconic looks: round glasses, Sgt. Pepper
uniforms, Abbey Road suits, "Here Comes the Sun", "Octopus's Garden"; mop-top hair.)*

*v1 lore (`src/data/designs/roster.js`), kept consistent:*
- **Beatlet:** "a kabutomushi grub that hatched under a Shinsekai record shop and has been headbanging
  ever since".
- **McCarapace:** "shell resonates like a hollow violin bass… plays left-handed and walks barefoot".
- **Harrisun:** "at dawn its halo ignites and spins… its sitar horn drones".
- **Starrab:** "a scarab whose body is a bass drum… wears a ring on every one of its six legs".

### 3a. References
- [S] Liverpool Museums, "The iconic fashion of The Beatles": https://www.liverpoolmuseums.org.uk/stories/iconic-fashion-of-beatles
- [S] The Blue Moment, "Collarless Beatles": https://thebluemoment.com/2020/12/30/collarless-beatles/
- [S] UNT, "The Cardin Beatle Boot": https://omeka.library.unt.edu/s/Step-in-Time/page/west-beatle-boot
- [S] Far Out, "Who inspired The Beatles' famous mop-top haircuts?": https://faroutmagazine.co.uk/?p=428006
- [S] Amateur Photographer, "Greatest album photography: Sgt. Pepper's" (Manuel Cuevas satin, day-glo military outfits): https://amateurphotographer.com/iconic-images/greatest-album-photography-sgt-peppers-lonely-hearts-club-band-by-the-beatles/
- [S] The Costumer's Guide, Sgt. Pepper costumes: http://www.costumersguide.com/cr_pepper.shtml
- [S] National Army Museum, "How to dress like Sergeant Pepper": https://www.nam.ac.uk/explore/sgt-pepper
- [S] AARP, "The story behind the Abbey Road cover": https://www.aarp.org/entertainment/music/info-2019/the-story-behind-the-abbey-road-cover
- [S] The Scotsman, Iain Macmillan obituary: https://www.scotsman.com/news/obituaries/iain-macmillan-2469215
- [S] Wikipedia, Windsor glasses: https://en.wikipedia.org/wiki/Windsor_glasses
- [S] Beatles Bible, "John Lennon begins wearing granny glasses" (6 Sep 1966): https://www.beatlesbible.com/1966/09/06/john-lennon-begins-wearing-granny-glasses/
- [S] Beatles Bible, Octopus's Garden: https://beatlesbible.com/songs/octopuss-garden
- [S] Far Out, "The bizarre event that inspired Ringo Starr to write a classic": https://faroutmagazine.co.uk/bizarre-event-inspired-ringo-starr-classic/
- [K] Wikipedia, Here Comes the Sun (George Harrison wrote it in Eric Clapton's garden in spring 1969 while skipping Apple business meetings): https://en.wikipedia.org/wiki/Here_Comes_the_Sun
- [K] Wikipedia, Höfner 500/1 (McCartney's violin-shaped bass, played left-handed): https://en.wikipedia.org/wiki/H%C3%B6fner_500/1
- [K] Wikipedia, Sitar (the gourd resonator *tumba*, long neck, sympathetic strings; Harrison studied with Ravi Shankar): https://en.wikipedia.org/wiki/Sitar
- [K] Wikipedia, With a Little Help from My Friends (sung by Ringo as "Billy Shears" on *Sgt. Pepper*, a fit for "25 team combos"): https://en.wikipedia.org/wiki/With_a_Little_Help_from_My_Friends
- [S] Wikipedia, Heracross (blue Japanese rhinoceros beetle, Hercules beetle in the Mega form; paired against Pinsir because Hercules and stag beetles are traditional rivals in Japan): https://en.wikipedia.org/wiki/Heracross
- [S] Bogleech, Heracross design notes: https://bogleech.com/pokemon/p214heracross.html
- [K] Bulbapedia, Pinsir / Volcarona / Dwebble: https://bulbapedia.bulbagarden.net/wiki/Pinsir_(Pok%C3%A9mon) · https://bulbapedia.bulbagarden.net/wiki/Volcarona_(Pok%C3%A9mon) · https://bulbapedia.bulbagarden.net/wiki/Dwebble_(Pok%C3%A9mon)
- [K] Wikipedia, Japanese rhinoceros beetle (*kabutomushi*, *Trypoxylus dichotomus*): https://en.wikipedia.org/wiki/Trypoxylus_dichotomus
- [K] Wikipedia, Scarabaeus sacer (sacred scarab): https://en.wikipedia.org/wiki/Scarabaeus_sacer

### 3b. Study notes

**Early-Beatles look (1963) [S]**
- **Hair:** the **mop-top**, a "straight cut", collar-length, fringe over the brow. Its roots are in the
  Hamburg period.
- **Suits:** **collarless suits** after a 1960 Cardin design, made by tailor Dougie Millings in pale grey
  or dark fabric, with white shirts and black ties. Credit is disputed with Astrid Kirchherr's
  round-collared jackets.
- **Boots:** **Cuban-heeled "Beatle boots"** with a slightly pointed toe and a heel of about 1 inch.
- **Design use for Beatlet:**
  - The **elytra dome falls forward over the eyes like a mop-top fringe**.
  - The pronotum is a smooth **collarless "jacket" band**.
  - The feet are tiny pointed heels.

**Sgt. Pepper (1967) [S]**
- **Costumes:** Manuel Cuevas made **satin military-style uniforms dyed day-glo**, with medals and
  insignia (MBE medals; a Royal Coat of Arms on Lennon's sleeve; an OPP flash on McCartney's).
- **Colour mapping** confirmed in search, with shade variance:
  - **Lennon:** acid/lime yellow-green.
  - **McCartney:** sky blue.
  - **Harrison:** fire red to red-orange.
  - **Starr:** hot pink / fuchsia (the jacket is displayed at the Rock and Roll Hall of Fame).
- **Design use:** each form's base colour comes from that satin, and the **gold frogging/braid** becomes
  ornamental lines on the elytra.
- **Approx. satin hues:**

| Member | Satin | Shadow |
|---|---|---|
| Lennon | `#b6d82a` | `#5e7a2a` |
| McCartney | `#6fb6ff` | `#3a5aa8` |
| Harrison | `#e8452a` | `#8a1f3a` |
| Starr | `#ff4fa3` | `#8a2a6a` |

Braid gold is `#ffd23f`.

**Abbey Road (1969) [S]**
- Iain Macmillan shot six frames in about ten minutes on 8 August 1969 and used the fifth.
- **Lennon** is in **white**, **Starr** in **black**, and **Harrison** in **blue denim**.
- **McCartney** is **barefoot**, out of step, and holds a cigarette in his right hand although he is
  left-handed.
- Macmillan said they simply wore what they came in that day.
- **Design use:** McCarapace is barefoot and left-handed (already in v1 lore). The other members'
  Abbey Road colours are secondary trims only. **No cigarettes.**

**Round "granny" Windsor glasses [S]**
- Circular thin metal rims, called "tea shades" when tinted.
- Lennon wore them on the set of *How I Won the War* in September 1966, and they quickly became his
  trademark.
- **Design use:** Lenshorn's **horn forks into two circular rings that sit in front of its eyes**. The
  horn *is* the glasses ("Lens-horn"), with a tinted lens option.

**Octopus's Garden [S]**
- Ringo wrote it in Sardinia in 1968 on Peter Sellers's yacht.
- The captain told him **octopuses gather shiny stones, tin cans and bottles and arrange them in front of
  their cave like a garden**.
- He also wanted to escape band tensions. Harrison helped with the chords, and the song was finished for
  *Abbey Road*.
- **Design use:** a perfect **Geo** link. Starrab **collects shiny pebbles and bottle caps and arranges a
  little garden on its back**.

**Here Comes the Sun [K]**
- Harrison wrote it in Clapton's garden in spring 1969, escaping business meetings, as a song of relief
  after winter.
- **Design use:** Harrisun's evolution is "dojo meditation, then sunrise", and its **sun halo** ignites
  at dawn (v1 lore).

**Beetle benchmarks**
- **Heracross [S]:** the Japanese rhinoceros/Hercules beetle. Its **one long forehead horn** is the
  whole silhouette. It is paired with stag-beetle Pinsir as cultural rivals, and Heracross shares
  Pinsir's capsule-shaped thorax.
- **Pinsir [K]:** a stag beetle with huge pincer horns; a brown, flat, wide stance.
- **Volcarona [K]:** a sun-moth with **six fiery wings**. It is the reference for a "sun" bug, and
  Harrisun must not look like it (no six wings).
- **Dwebble [K]:** a hermit crab carrying a rock-house. It is the reference for "carrying a home or
  garden on the back", so Starrab must avoid a rock-house silhouette.
- **Japanese rhinoceros beetle [K]:** a glossy mahogany/black male with a forked head horn and a smaller
  thoracic horn. *Kabutomushi* are beloved summer pets and fighting-game bugs in Japan, which suits
  Taro, the kid who owns the beetle.

### 3c. Design direction

**Shared line identity**
- Every form keeps the **mop-top fringe** (the elytra edge falling over the eyes), **Cuban-heeled tarsi**
  (pointed heel tips) and **gold braid lines** on the shell.
- Each form wears its member's satin colour as the **shell colour** and adds **one** iconic signifier.
  Never more than one: glasses, violin-bass body, sun halo plus sitar horn, or drum body plus rings.
- All four forms are **instruments + beetles**. Their attacks are music hits in the Echo style, and they
  land on the beat when music sync is active.

#### Beatlet (stage 1, about 0.55 m, arch `insect`)

- **Silhouette:**
  - A round, chubby *kabutomushi* youngster.
  - A big glossy elytra dome whose front edge **droops into a mop-top fringe** over the eyes. Only the
    lower halves of the eyes peek out, which is cute and shy.
  - A **short single stub horn** pokes through the fringe.
  - Six short legs with tiny pointed heels. The front pair can hold things.
- **Bio element:** a little **leaf sprout** grows from the horn tip and bobs while it headbangs. It is a
  healing/support read.
- **Face:** large lower-half anime eyes with a strong highlight, and a small smile.
- **Accessory anchor:** on the dome behind the horn.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#1e0f14` |
| Deep | `#2a1428` |
| Shell shadow (violet) | `#4a2a3a` |
| Shell base (chestnut) | `#6a3a22` |
| Shell light | `#a0603a` |
| Specular | `#f0c08a` |
| Underside / face | `#f2dfbf` / shadow `#c0a08a` |
| Collar band | `#3a2a2a` with a 1 px `#ffd23f` braid line |
| Sprout | Bio `#5fd35a` / `#e8ffd0` |

- **Animations:**
  - **Idle:** **headbanging** (v1 lore). A 6-pose nod; the fringe flops and the sprout whips.
  - **Attack:** a horn bump, then a little **leaf-note** projectile (Bio leaf with an Echo ring trail).
  - **Hit:** it rolls onto its back and kicks its legs for 2 poses, then flips up.
- **64 px:**
  - About 36 px.
  - The fringe edge is a strong 2 px highlight line across the face, and it is the read.
  - The sprout is a 3 px green tick.

#### Lenshorn (Echo, about 1.2 m, arch `insect` standing semi-upright)

- **Signifier:** the **round glasses horn**. The horn rises from the head, then **forks into two thin
  circular rings that rest in front of the eyes**.
  - Tinted amber "tea shade" lenses, with an option to toggle to clear on crits.
  - The rings ring like bells when struck.
- **Shell:** acid yellow-green satin with **gold braid frogging** across the elytra. The mop fringe is
  longer and straighter (late-60s long hair).
- **Story tie (no new mechanic):** it evolves by beating Lemmo, so its horn tips carry **a lemon-peel
  yellow highlight**. This is a visual nod that it "squeezed the sour out of life" (v1 lore).
- **Echo look:**
  - It holds the glasses-rings up, and soundwave rings emanate **through** the lenses.
  - The concentric rings are the attack projectile.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#1f2a1a` |
| Shadow (teal-shifted) | `#3f6a52` |
| Base | `#9ad42a` |
| Light | `#d8f06a` |
| Highlight | `#f6ffc0` |
| Braid | `#ffd23f` |
| Rings | `#c8ccd4` |
| Lens tint | `#ffb347` at 60 % |
| Echo VFX | `#b26bff` / `#5ff4ff` |

- **Animations:**
  - **Idle:** adjusts its glasses with a foreleg, then a slow peace-sign-like two-claw raise (*a gesture,
    not a symbol*).
  - **Attack:** rings hum, then 3 expanding Echo rings fire through the lenses on the beat.
  - **Hit:** the lenses crack-flash, then it pushes them back up.
- **64 px:** the two circular rings over the eyes (2 × 7 px circles) are the read, with the green shell.
- **Elemental Form idea (Echo): "Imagine Form" (name TBD).**
  - The rings grow into **giant concentric halo-lenses** in front of its face.
  - The shell becomes **white lacquer with gold braid**, a nod to the white of Abbey Road and the white
    piano era, without drawing a piano.
  - Echo rings ripple continuously.

#### McCarapace (Hydro, about 1.25 m, arch `insect` upright)

- **Signifier:** a **violin-bass carapace**.
  - The elytra shape is a **violin body**: upper and lower bouts, a waist, and two f-hole-like
    spiracles.
  - A **sunburst finish** runs from amber centre to dark edge.
  - The beetle's head and horn form the **"neck and scroll"**.
  - Four light stripes run along its back like strings. It is **left-handed**, so its strumming foreleg
    is the left one.
- **Satin:** sky-blue satin on the legs, thorax and frogging trim (Sgt. Pepper). The violin shell sits
  over it.
- **Barefoot:** this is the only form whose last leg pair has **no heel tips**, just soft pads (Abbey
  Road nod, from v1 lore).
- **Hydro look:** dewy droplets bead on the shell and canal-water reflections ripple on the sunburst.
  Hydro precision fits a melodic bass player who **aims**.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#1a1a3a` |
| Satin shadow | `#3a5aa8` |
| Satin base | `#6fb6ff` |
| Satin light | `#bfe6ff` |
| Sunburst | centre `#f0b050` → mid `#b8601e` → edge `#4a1e10` |
| Strings | `#e8f0ff` |
| Hydro VFX | `#2fa8ff` / `#8ff0ff` |

- **Animations:**
  - **Idle:** rocks side to side and plucks its own back-strings. Ripple rings pulse off the shell.
  - **Attack "Bassline Jet":** a deep pluck, then a **pressurised water stream** that wobbles like a
    sine wave and straightens on hit.
  - **Hit:** a string snaps-flash, then it re-tunes (taps its head scroll).
- **64 px:** the violin outline of the shell (the waist notch is 2 px each side) plus the sunburst
  gradient in 3 bands.
- **Elemental Form idea (Hydro): "Canal Concerto".**
  - The shell becomes **translucent water-glass** with the sunburst still visible inside, like a lantern.
  - The four strings become **flowing water strands**.
  - Dotonbori-blue light ripples orbit it.

#### Harrisun (Pyro, about 1.3 m, arch `insect` seated or upright)

- **Signifier:** the **sun halo** plus a **sitar horn**.
  - The horn is long and straight like a sitar neck, with frets as ridges.
  - The base of the horn swells into a **round gourd** (*tumba*) on the forehead.
  - Behind the head floats a **spinning ring-halo** that ignites at dawn (v1 lore). It is a sun disc
    with 12 short flame rays.
- **Volcarona contrast:** Harrisun has **no wings out**. Its power is concentrated in the halo, not in
  fiery wings.
- **Satin:** red-orange satin shell with gold braid. A meditative **cross-legged seated idle** with its
  middle legs in a mudra-like pose (dojo meditation condition).
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#2a0f1a` |
| Shadow (violet-shifted) | `#8a1f3a` |
| Base | `#e8452a` |
| Light | `#ff9a3a` |
| Highlight | `#ffe0a0` |
| Gourd / neck wood | `#a0522d` / `#d88a4a` |
| Halo | `#ffd23f` → core `#fff2a0` |
| Pyro VFX | `#ff6a2b` / `#ffd23f` |

- **Animations:**
  - **Idle:** seated meditation. The halo turns slowly, then speeds up on twos when it charges (Pyro is
    charge-based).
  - **Attack "Sunrise":**
    - Halo spin-up over 3 poses.
    - It stands and the horn droops toward the target.
    - A **beam of sunlight** fires from the gourd, leaving a lingering warm glow.
  - **Hit:** the halo flickers out for 2 poses, then relights.
- **64 px:** the halo ring (a 1–2 px gold circle around the head) plus the long horn line. It reads as
  "sun bug" instantly.
- **Elemental Form idea (Pyro): "Dawn Raga".**
  - The halo expands into a **full sunrise disc** behind the whole body.
  - Sympathetic "strings" of light run from the horn to the halo.
  - The shell turns gold-orange, and the ground under it blooms with warm light.

#### Starrab (Geo, about 1.0 m, arch `insect`, low and wide)

- **Signifier:** a **scarab whose body is a bass drum** (v1 lore).
  - The abdomen is a **round drum shell**: hoop rims, tension-rod lugs as small bumps, and a cream
    drum-head face on its rear/belly.
  - **A ring on every one of its six legs** (v1 lore).
  - It **carries an octopus-style garden on its back**: shiny pebbles, a bottle cap and a little tin can
    arranged in a neat patch. This is the true "Octopus's Garden" detail, and Geo.
- **Head:** a broad, friendly scarab head with **two drumstick-like antennae** (club tips).
- **Satin:** hot-pink satin forelegs and thorax with gold braid.
- **Story tie:** it evolves through **25 team combos**. As the drummer, it keeps everyone together (the
  "Billy Shears", "little help from my friends" spirit; reference only).
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#2a0f24` |
| Shadow | `#8a2a6a` |
| Base | `#ff4fa3` |
| Light | `#ffa0cf` |
| Drum shell | `#3a2a4a` / sparkle `#8a7aa8` |
| Hoops | chrome `#d0dae4` |
| Drum head | `#f6efe0` |
| Rings | `#ffd23f` and `#d0dae4` alternating |
| Garden pebbles | `#9fefff`, `#ffd98a`, `#a8f5c8` |
| Geo VFX | `#d39a5c` |

- **Animations:**
  - **Idle:** taps a fill on its own drum belly with the antennae on the beat, and the garden pebbles
    bounce.
  - **Attack "Drum Fill Quake":** a rapid 4-hit roll, then a big stomp. Geo shockwave rings travel along
    the ground.
  - **Parry:** it tucks its legs and **becomes the drum**. The hits bounce off its taut head.
  - **Hit:** a cymbal-crash flash, and one pebble falls off the garden.
- **64 px:** a round drum-body silhouette with the cream drum-head circle (8–10 px) and 3 bright pebble
  dots on top.
- **Elemental Form idea (Geo): "Garden Kit".**
  - The garden on its back grows into a **ring of floating stones and tin "cymbals"** around it, like a
    whole drum kit made of Geo.
  - The drum head glows with a starburst.
  - Each beat drops a stone wall segment.

### 3d. Do / Don't
- **Do:**
  - Use colour (satin), one costume signifier, and instrument-anatomy.
  - Keep the mop-top fringe as shell anatomy.
- **Don't:**
  - **Likeness:** draw faces or likenesses of John, Paul, George or Ringo, or put a moustache on a
    beetle.
  - **Real insignia:** use real medals, the Royal Coat of Arms, the police flash, or the Sgt. Pepper drum
    lettering.
  - **Instruments:** copy the Höfner body exactly. The shell is violin-*like*, with no logo or
    headstock.
  - **Props and symbols:** show cigarettes, or use a literal CND peace symbol.
  - **Pokémon look-alikes:** make Harrisun look like Volcarona (no six fiery wings). Make Starrab look like
    Dwebble (no rock house on its back).

---------------------------------------------------------------------------------------------------

## 4. Lemmo & Alpha Lemmo (Volto)

**Owner (bible §3, verbatim):**
> - **Lemmo** and **Alpha Lemmo** (Volto): the lemon Tokonmon of the beetle evolution (a "Lemon" song nod).

And the Lenshorn condition: "defeat 20 Lemmo + the Alpha Lemmo boss in the safari".

*v1 lore:*
- **Lemmo:** "A wild lemon battery common in the safari zone. Squeeze one and you get a jolt of juice and
  a sour look you will never forget."
- **Alpha Lemmo:** "The Sour King of the safari, a boss Lemmo…", 2.3 m.

### 4a. References
- [K] Wikipedia, "Lemon" (Kenshi Yonezu song, 2018; theme of the TBS drama *Unnatural*; a bittersweet song of grief and memory): https://en.wikipedia.org/wiki/Lemon_(Kenshi_Yonezu_song)
- [K] Wikipedia, Kenshi Yonezu: https://en.wikipedia.org/wiki/Kenshi_Yonezu
- [K] Wikipedia, Motojirō Kajii. In his 1925 short story *Lemon* (檸檬), the narrator leaves a lemon on a pile of art books in Kyoto's Maruzen bookshop and imagines it as a golden **bomb** about to explode. This is the classic Japanese literary lemon: https://en.wikipedia.org/wiki/Motojir%C5%8D_Kajii
- [K] Wikipedia, Lemon battery (copper and zinc electrodes in a lemon make a weak cell): https://en.wikipedia.org/wiki/Lemon_battery
- [K] Bulbapedia, Applin (an apple with a little dragon living inside): https://bulbapedia.bulbagarden.net/wiki/Applin_(Pok%C3%A9mon)
- [K] Bulbapedia, Bounsweet / Tsareena (a fruit body with leaf "crown", fruit-skin texture): https://bulbapedia.bulbagarden.net/wiki/Bounsweet_(Pok%C3%A9mon)
- [K] Bulbapedia, Pikachu (electric cheek sacs, a reference for "stored charge in a pouch"): https://bulbapedia.bulbagarden.net/wiki/Pikachu_(Pok%C3%A9mon)

### 4b. Study notes

**Kenshi Yonezu, "Lemon" [K]**
- A 2018 hit and the theme of a forensic drama.
- The lemon stands for the **bitter-sour** aftertaste of a loved memory.
- **Design use:** the line's expression range is **sour pucker ↔ sweet smile**, bittersweet rather than
  angry.

**Kajii, *Lemon* [K]**
- A lemon as a **beautiful bright bomb** placed on a stack of art books.
- **Design use:** Alpha Lemmo's boss attack can "plant" a glowing lemon that detonates (Volto
  explosion), a literary wink.

**Lemon battery [K]**
- Two dissimilar metal electrodes (copper and zinc) stuck into the fruit.
- **Design use:** Lemmo's **"antennae" are a copper prong and a zinc prong**. This explains the Volto
  type physically and is an instantly readable silhouette.

**Lemon anatomy (knowledge)**
- An ellipsoid with a **nipple-like nub** at each end.
- **Dimpled peel** (oil glands), white pith, and segments of juice vesicles in cross-section.
- Leaves are glossy dark green.
- Approx:
  - peel `#ffe23a` (identical to the game's Volto colour, a happy coincidence)
  - peel shadow `#d9a21a`
  - pith `#fff8dc`
  - pulp `#ffe98a`
  - leaf `#2f7a2a` / `#7fc04a`

**Fruit Pokémon lessons**
- **Applin [K]:** the creature lives *inside* the fruit and peeks out.
- **Bounsweet [K]:** the fruit *is* the body, with a leaf on top and tiny legs.
- No lemon Pokémon exists as far as this researcher knows, so the citrus lane is clear. Keep Lemmo away
  from the Applin "creature in a fruit" read and use **"the fruit is the creature"**.

### 4c. Design direction

#### Lemmo (wild, common, about 0.45 m, arch `hopper`)

- **Silhouette:**
  - A lemon body, slightly tilted, with the bottom nub as a little tail.
  - Two leaves at the top work as ears.
  - **Two metal prongs** (copper left, zinc right) poke out of the head like antennae, with a tiny arc of
    electricity jumping between their tips.
  - Two stubby feet; no arms.
- **Face:**
  - Big round eyes.
  - The mouth is the "sour" read: a puckered `ε`-like pout at rest, and squeezed-shut `> <` eyes when it
    fires.
- **Peel:** 3–4 dimple dots (2 px clusters) per side, no more.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#5a3a10` |
| Deep | `#a0662a` |
| Shadow | `#e0a82a` |
| Base | `#ffe23a` |
| Light | `#fff59a` |
| Highlight | `#ffffff` |
| Leaf | `#2f7a2a` / `#7fc04a` |
| Copper | `#d07a3a` / `#ffb07a` |
| Zinc | `#b8c4d0` / `#e8eef4` |
| Spark | Volto `#ffe23a` / `#ffffff` |

- **Animations:**
  - **Idle:** a little bounce, with the electrode arc crackling every 2 poses.
  - **Attack "Squeeze":** it squeezes itself (squash) and squirts a **jet of electric juice**: a yellow
    droplet stream with spark pixels.
  - **Hit:** it is squeezed flat for 1 pose, a juice drop flies out, and it pops back sour-faced.
  - **Defeat:** it rolls over, and its prongs fizzle.
- **VFX:** sour juice droplets (Volto yellow with a white core) and spark ticks.
- **64 px:**
  - About 34 px.
  - The two prongs are different colours (a 2 px copper line and a 2 px zinc line), and they are the
    read.
  - The yellow peel needs a strong dark outline (`#5a3a10`) to separate it from the safari greens.

#### Alpha Lemmo (safari boss, about 2.3 m, arch `blob` with heavy stomp)

- **Silhouette:**
  - A huge, heavy, wedge-armoured lemon.
  - The peel is split into **segment-plates** like lemon wedges, and **glowing pulp vesicles** show
    through the cracks between them.
  - **A crown of five electrode prongs** (alternating copper and zinc) sits around its top leaves. It is
    the "Sour King".
  - Stubby elephantine legs, and a squat, grumpy brow.
- **Face:**
  - Narrowed, bitter eyes; a scowling sour pout.
  - On a stagger state the face flips to a sad, bittersweet look *(proposal; the "Lemon" grief nod)*.
- **Palette:**
  - Lemmo's palette, plus pulp glow `#fff2a0` → `#ffffff`, a crack glow halo `#ffe23a`, and a crown
    copper/zinc metal set.
  - Add a deeper bruise-green shadow `#6a6a2a` for old peel.
- **Animations:**
  - **Idle:** a slow, irritable breathing. The crown arcs a ring of sparks.
  - **Attack "Sour Bomb" (Kajii nod):** it plants a glowing mini-lemon on the ground. The lemon ticks
    with a brightening flicker and explodes in a Volto burst.
  - **Attack "Crown Chain":** a chain-lightning jump between all 5 prongs and out to targets.
  - **Hit:** wedge plates flap open, revealing bright pulp, then close.
- **64 px:**
  - About 60 px.
  - The 5-prong crown is the outline-breaker.
  - Pulp cracks are 1 px bright lines.
- **Elemental Form:**
  - **Alpha Lemmo is a boss.** The bible does not say it is catchable or a final evolution, so don't
    design an Elemental Form unless the owner decides it is obtainable.
  - **If it ever is:** "Golden Bomb" form. The peel turns gold, the crown fuses into a lightning halo, and
    the body hovers, ticking.

### 4d. Do / Don't
- **Do:**
  - Use the lemon battery (copper/zinc prongs), sour ↔ bittersweet faces, and the "beautiful bomb" lemon.
- **Don't:**
  - Use Yonezu's likeness, the "Lemon" single art, or MV imagery. Make Lemmo a creature *inside* a fruit
    (Applin). Write lyrics anywhere.

---------------------------------------------------------------------------------------------------

## 5. Kagarou (Pyro): the fire wolf

**Owner (bible §3, verbatim):**
> - **Kagarou** (Pyro): the fire wolf from the cinematic.

And §2.1: "A fire wolf (Kagarou) bursts in, and the sky whale Polaris passes overhead." (the farm at
dawn).

*v1 lore: "…Its mane is a living flame, and it only bonds with trainers who do not flinch." (1.2 m)*

### 5a. References
- [K] Bulbapedia, Arcanine: https://bulbapedia.bulbagarden.net/wiki/Arcanine_(Pok%C3%A9mon)
- [K] Bulbapedia, Entei: https://bulbapedia.bulbagarden.net/wiki/Entei_(Pok%C3%A9mon)
- [K] Wikipedia, *Ōkami* (Capcom/Clover, 2006; Amaterasu, sumi-e style): https://en.wikipedia.org/wiki/%C5%8Ckami
- [K] Wikipedia, Japanese wolf (*Nihon ōkami*, extinct about 1905): https://en.wikipedia.org/wiki/Japanese_wolf
- [K] Wikipedia, Mitsumine Shrine (wolf guardians instead of komainu; wolf *ofuda* talismans): https://en.wikipedia.org/wiki/Mitsumine_Shrine
- [K] Wikipedia, Okuri-inu / okuri-ōkami ("sending dog/wolf" that follows night travellers): https://en.wikipedia.org/wiki/Okuri-inu
- [K] Wikipedia, Kitsunebi (foxfire; floating will-o'-wisps): https://en.wikipedia.org/wiki/Kitsunebi
- [K] Wikipedia, Onibi: https://en.wikipedia.org/wiki/Onibi
- [K] Wikipedia, Kagaribi (iron-basket bonfire, which the name "Kaga-rou" evokes; 狼 *rō* = wolf): https://ja.wikipedia.org/wiki/%E7%AF%9D%E7%81%AB

### 5b. Study notes

**Arcanine [K]**
- A Chinese guardian-lion-dog (*shishi*) energy.
- Orange coat with **black tiger stripes**, and a cream fluffy mane, tail and leg tufts.
- A regal, upright chest.
- **Lesson:** big fluff masses read as "fire" without drawing flames.

**Entei [K]**
- A volcano-crown mane and a smoke-cloud mane. Brown with a grey "mask".
- **Lesson:** a mane shaped like a fire's silhouette.

**Amaterasu (*Ōkami*) [K]**
- A **white wolf with red brush-stroke markings**.
- Swirling clouds of fur.
- A **flaming disc reflector (Divine Retribution)** on her back.
- **Sumi-e ink outlines** with variable line weight.
- **Lesson:** calligraphic markings are a strong Japanese-wolf read. Never white-plus-red markings plus a
  back disc, which is too close to Amaterasu.

**Japanese wolf [K]**
- Smaller than grey wolves, with **short legs**, a short coat and small ears.
- Revered as *ōkami* (punned "great god").
- **Shrine guardians** at Mitsumine and elsewhere.
- **Okuri-ōkami:** follows travellers at night and is harmless if you don't fall.
- **Lesson:** a compact, low wolf with a shrine-guardian dignity fits v1's "bonds only with those who
  don't flinch".

**Foxfire / onibi [K]**
- Floating spirit flames, pale blue-white or orange.
- **Lesson:** Kagarou's sparks can drift like *onibi* wisps.

**Kagaribi [K]**
- A wrought-iron cage basket holding burning wood on a pole. Used at night festivals, castles and
  temples.
- **Lesson:** a **black iron collar-cage motif** around the neck holds the flame mane, which is original
  to us.

### 5c. Design direction

**Kagarou (about 1.2 m at the shoulder, arch `quad`)**

- **Silhouette:**
  - A compact, low-slung, short-legged Japanese wolf.
  - Long body and a big chest.
  - A **living-flame mane** that rises off the neck and shoulders like a bonfire, plus a **flame tail**.
  - Ears pinned back when angry.
  - Proportions: legs 30 % of the height, head 25 %.
- **Signature:**
  - **A black wrought-iron *kagaribi* collar** (open cage bands) around the neck. The flame mane burns
    *inside* the cage and spills over.
  - A **shrine-rope tassel** with burned paper strips (*shide*) hangs from the collar. It nods to the
    Mitsumine wolf-guardian, and the burned edges say "wild".
- **Coat:**
  - **Soot charcoal** with ember-orange underfur that shows at fur splits.
  - Ember cracks glow on its paws and lower legs.
  - It stays dark so it **pops against the pastel dawn** of the opening cinematic. It avoids Arcanine's
    orange and Amaterasu's white.
- **Markings:** two **calligraphic ember strokes** on the cheeks (*sumi-e* brush energy), in orange, not
  red.
- **Face:** a narrow muzzle and gold eyes with a slit-sharp highlight. A small fang shows.
- **Accessory anchor:** between the ears, in front of the mane.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#140c14` |
| Deep | `#1e1622` |
| Coat shadow (violet-shifted) | `#2a2034` |
| Coat base | `#3e3440` |
| Coat light | `#6a5a64` |
| Underfur ember | `#ff6a2b` |
| Flame | `#ff6a2b` → `#ffd23f` → core `#fff2a0` |
| Iron collar | `#1a1418` / glint `#8a7a80` |
| Shide paper | `#f0e6d0` / burned `#5a3020` |
| Eyes | `#ffcf3a` |

- **Animations:**
  - **Idle:**
    - The flame mane flickers on twos with 4 shapes in a loop.
    - The wolf breathes, and ember sparks float up like *onibi*.
    - A head turn every 2nd loop.
  - **Cinematic entrance:** it **bursts through** a fence in a horizontal flame smear of 3 poses. It lands
    in a 2-pose skid with grass catching fire behind it, then raises its head to the sky as Polaris
    passes.
  - **Attack "Kagaribi Fang":** a low crouch over 3 poses with the flame mane flaring, then a lunge-bite
    with a fire arc. Pyro: charging inflates the mane.
  - **Howl:** the mane flares into a pillar.
  - **Hit:** the flame gutters out to small embers for 1 pose, then roars back.
- **VFX:** flame sprites (Pyro `#ff6a2b`), ember particles, onibi wisps, heat shimmer.
- **64 px:**
  - About 46 px tall.
  - The bonfire mane silhouette plus the dark body is the read.
  - The collar is a single 2 px black band with 3 glints.
- **Elemental Form idea (Pyro, if it is a final; v1 lists it as stage 2 with no evolution named):
  "Kagaribi Shrine Form".**
  - The flame mane turns **white-gold at the core with blue onibi edges**.
  - **Three floating iron-basket bonfires** orbit it as a guardian circle.
  - The *shide* tassel becomes a full burning shimenawa rope around its neck.
  - The coat cracks with ember lines.

### 5d. Do / Don't
- **Do:**
  - Use a short-legged Japanese wolf, the kagaribi cage collar, shrine-guardian dignity, onibi sparks,
    calligraphic ember strokes, and a dark coat against the dawn.
- **Don't:**
  - **Look-alikes:** go white-with-red-markings or put a reflector disc on its back (Amaterasu). Use an
    orange tiger-striped coat with a cream mane (Arcanine). Use a volcano crown (Entei).
  - **Real shrines:** use real shrine *ofuda* text.

---------------------------------------------------------------------------------------------------

## 6. Farm Tokonmon: Cabbunny (Bio) and Moglow (Geo)

**Owner (bible §3, verbatim):**
> - **Farm Tokonmon:** Cabbunny (Bio) and Moglow (Geo).

And §2.1: "Farm Tokonmon and normal farm animals" in the dawn cinematic. *(Brief: cabbage bunny; mole/glow.)*

*v1 lore:*
- **Cabbunny:** "Farmers find Cabbunny napping in their cabbage rows and can never tell it apart from the
  harvest. It regrows a fresh outer leaf every morning."
- **Moglow:** "Moglow tunnels under the rice paddies by lamplight, sniffing out buried geodes with its
  star-shaped nose. Farmers follow its glow to find spring water."

### 6a. References
- [K] Bulbapedia, Buneary / Bunnelby / Scorbunny (rabbit-ear silhouettes to avoid copying): https://bulbapedia.bulbagarden.net/wiki/Buneary_(Pok%C3%A9mon) · https://bulbapedia.bulbagarden.net/wiki/Bunnelby_(Pok%C3%A9mon)
- [K] Bulbapedia, Bounsweet (produce-as-body), Oddish (leaf-crown head), Skiddo (plant-on-animal): https://bulbapedia.bulbagarden.net/wiki/Oddish_(Pok%C3%A9mon)
- [K] Wikipedia, *The Tale of Peter Rabbit* (Beatrix Potter; rabbits raiding Mr McGregor's garden): https://en.wikipedia.org/wiki/The_Tale_of_Peter_Rabbit
- [K] Wikipedia, Cabbage (a tight head of overlapping leaves, waxy bloom, pale midribs): https://en.wikipedia.org/wiki/Cabbage
- [K] Wikipedia, Okonomiyaki (the Osaka-style batter is mostly shredded cabbage, an Osaka food tie): https://en.wikipedia.org/wiki/Okonomiyaki
- [K] Wikipedia, Star-nosed mole (22 pink fleshy rays on the snout; huge digging forepaws): https://en.wikipedia.org/wiki/Star-nosed_mole
- [K] Bulbapedia, Diglett / Drilbur / Excadrill: https://bulbapedia.bulbagarden.net/wiki/Drilbur_(Pok%C3%A9mon)
- [K] Mario Wiki, Monty Mole: https://www.mariowiki.com/Monty_Mole
- [K] Wikipedia, *Arachnocampa luminosa* (glowworms of the Waitomo caves; blue-green bioluminescent ceilings): https://en.wikipedia.org/wiki/Arachnocampa_luminosa
- [K] Wikipedia, Geode (dull rock shell, crystal-lined hollow): https://en.wikipedia.org/wiki/Geode
- [K] Wikipedia, Stardew Valley and Story of Seasons (cute farm pixel benchmarks): https://en.wikipedia.org/wiki/Stardew_Valley · https://en.wikipedia.org/wiki/Story_of_Seasons

### 6b. Study notes

**Cabbage [K]**
- A **sphere wrapped in overlapping leaves**, each leaf with a **pale midrib and branching veins**.
- The outer leaves are darker and looser, the inner ones paler and tight.
- There is a frosty waxy bloom on the outer leaves.
- Approx:

| Part | Hex |
|---|---|
| Inner | `#d8eca0` |
| Mid | `#a8d070` |
| Outer | `#5f9a4a` |
| Waxy bloom | `#b8d8c0` |
| Vein | `#eef6d8` |

**Peter Rabbit [K]**
- The archetypal rabbit-in-the-veg-patch, with soft watercolour farm charm.
- **Lesson:** the hiding-in-the-crop gag (v1 lore) is classic and readable.

**Rabbit Pokémon [K]**
- Buneary has curled fluffy ears, Bunnelby has shovel ears, Scorbunny is an athletic biped.
- **Lesson:** **ears are the identity**. Ours are **two big cabbage leaves**.

**Star-nosed mole [K]**
- A ring of **22 pink tentacle-rays** around the nostrils (a star).
- Velvety near-black fur, tiny eyes, and huge outward-facing spade forepaws.
- **Lesson:** the star nose is the most distinctive mole silhouette in nature, and v1 already uses it.

**Monty Mole / Diglett / Drilbur [K]**
- Mole Pokémon and enemies are mostly "head from a hole" or "drill claws".
- **Lesson:** avoid both. Ours is a **whole-body lantern mole**.

**Glowworm caves, geodes [K]**
- Blue-green pinprick glow on dark ceilings.
- Geodes are dull outside and sparkling amethyst or quartz inside.
- **Lesson:** a **plain mole that hides a glowing geode** is a reveal moment.

### 6c. Design direction

#### Cabbunny (about 0.45 m, arch `hopper`)

- **Silhouette:**
  - A **round cabbage-head body** with a rabbit face peeking from between the inner leaves.
  - **Two tall outer cabbage leaves are the ears**: broad, veined, slightly floppy at the tips.
  - Hind feet are small leaf-stubs.
  - A pom-pom tail made of a tiny tight cabbage heart.
  - Curled up, it **is a cabbage**. Ears fold over the face for the camouflage nap (v1).
- **Face:**
  - Big soft eyes, a pink twitching nose (Bio accent `#ffb3d9`), and buck teeth (2 px).
  - Leaf "cheek ruffles" frame the face.
- **Bio:**
  - Morning regrowth (v1): the outer leaf it loses in battle grows back.
  - *(Visual only)* a fresh pale leaf unfurls on idle every few loops.
- **Accessory anchor:** between the leaf ears.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#1f3a24` |
| Deep | `#2f5a3a` |
| Outer leaf | `#5f9a4a` |
| Mid | `#a8d070` |
| Inner | `#d8eca0` |
| Vein highlight | `#eef6d8` |
| Waxy bloom on outer leaves | `#b8d8c0` |
| Face fur | `#f6f0e0` / `#c8c0b0` |
| Nose | `#ffb3d9` |
| Eyes | `#3a2a20` with `#ffffff` highlight |
| Bio VFX | `#5fd35a` / `#e8ffd0` |

- **Animations:**
  - **Idle:** ear-leaves flop on twos, and the nose twitches. It hops in place.
  - **Attack "Leaf Slap / Leaf Boomerang":** it spins and an ear-leaf flicks off as a spinning boomerang
    that returns and re-attaches.
  - **Hide:** it curls into a cabbage over 2 poses, with a ✿ sparkle.
  - **Hit:** outer leaves flutter off as 2 leaf particles, and a pale new leaf peeks in.
- **64 px:**
  - About 36 px.
  - The two vertical leaf-ears with a 1 px light midrib line each are the read.
  - The pink nose is a 2 px accent.
- **Elemental Form idea (Bio, if it counts as final): "Harvest Moon".**
  - The leaves open into a **huge rosette cape**, and the ears become tall ornamental-kale frills
    (purple-white `#c8a8e0` / `#f6f0ff`).
  - Healing pollen motes drift from the frills.

#### Moglow (about 0.5 m, arch `quad`, low)

- **Silhouette:**
  - A plump, low teardrop mole.
  - **Big spade forepaws** with cream claws, held out in front.
  - A **star nose** (11 short rays per side, 22 in total; simplify to 8 rays at 64 px) that **glows like a
    lamp**.
  - On its back: **a half-buried geode** whose cracked top shows violet crystals that glow.
- **Signature:** **the glowing star nose = the lantern** "by lamplight" (v1). Its light is **warm
  amber**, like an old miner's lamp. It is Geo, so not electric.
- **Face:**
  - Tiny, squinty, happy eyes (moles see poorly), hidden in fur. A content smile.
  - The nose is the face's focal point.
- **Accessory anchor:** the top of the head, just behind the nose.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#1a1424` |
| Deep | `#2a2236` |
| Fur shadow (violet) | `#3a3046` |
| Fur base | `#4f4560` |
| Fur light | `#7a6e8a` |
| Fur sheen | `#a89ab8` |
| Nose rays | `#ff8fa8` → glow `#ffd27a` → core `#fff2c4` |
| Claws | `#f0e0c8` / `#b8a088` |
| Geode rind | `#8a7a6a` |
| Crystals | `#9a6aff` → `#d8b8ff` → `#ffffff` |
| Dirt | `#8a5a3a` / `#c0905a` |
| Geo VFX | `#d39a5c` |

- **Animations:**
  - **Idle:** sniffs, and the star-rays ripple open and closed, pulsing light. The geode twinkles.
  - **Attack "Geode Burrow":** it dives underground (a 3-pose dig with a dirt fountain), travels as a
    moving dirt mound, then pops up under the target with a crystal spike burst.
  - **Parry:** it hunkers down and the geode back faces the attack, sparking crystals.
  - **Hit:** the nose light flickers off for 1 pose.
- **64 px:**
  - About 30 px tall and wide.
  - The nose glow (a 4 px warm halo) plus the violet crystal cluster on the back form 2 readable lights.
- **Elemental Form idea (Geo, if it counts as final): "Geode Lantern".**
  - The back geode grows into a **full amethyst crystal shell**, cracked open like a lantern.
  - The nose's light shines up through it and casts crystal light-rays on the ground.

### 6d. Do / Don't
- **Do:**
  - Make the cabbage **the body** and the leaves **the ears**.
  - Make the star-nose **the lamp**, with a hidden geode.
  - Tie Cabbunny to Osaka cabbage culture (okonomiyaki stall cameo) for flavour.
- **Don't:**
  - **Cabbunny:** copy Buneary's curled ears or Bunnelby's shovel ears.
  - **Moglow:** draw it as a head-from-a-hole (Diglett / Monty Mole), or give it drill claws (Drilbur /
    Excadrill).
  - **Peter Rabbit:** draw Peter's blue jacket.

---------------------------------------------------------------------------------------------------

## 7. Farm animals (not Tokonmon): cow, chicken, pig, farm dog

**Owner (bible §3, verbatim):**
> - **Farm animals** (not Tokonmon): cow, chicken, pig, farm dog.

And §2.1: "Farm Tokonmon and normal farm animals; humans still eat normal farm animals."

### 7a. References
- [K] Wikipedia, Stardew Valley (ConcernedApe, 2016; chickens, cows, pigs, farm pets in cute 16 px-grid pixel art): https://en.wikipedia.org/wiki/Stardew_Valley
- [K] Wikipedia, Story of Seasons / Harvest Moon (chibi farm animals, happiness hearts): https://en.wikipedia.org/wiki/Story_of_Seasons
- [K] Wikipedia, Wagyu (*Kuroge Washu*, the Japanese Black cattle): https://en.wikipedia.org/wiki/Wagyu
- [K] Wikipedia, Holstein Friesian (black-and-white dairy cow): https://en.wikipedia.org/wiki/Holstein_Friesian_cattle
- [K] Wikipedia, Nagoya chicken (*Nagoya Cochin*; buff-gold plumage): https://en.wikipedia.org/wiki/Nagoya_chicken
- [K] Wikipedia, Berkshire pig (*Kurobuta* in Japan; black with white points on feet, snout and tail tip): https://en.wikipedia.org/wiki/Berkshire_pig
- [K] Wikipedia, Shiba Inu (red coat with cream *urajiro* markings, curled tail): https://en.wikipedia.org/wiki/Shiba_Inu

### 7b. Study notes
- **Stardew / Story of Seasons [K]:**
  - Farm animals use **dot or small oval eyes**, simple rounded masses, 2–3 tone shading, and very short
    idle loops (blink, chew, peck).
  - Their charm comes from **behaviour** (a hop when petted, a heart pop), not big anime eyes.
- **Japanese breeds [K]:**
  - **Kuroge Wagyu:** solid black.
  - **Holstein:** black/white patches.
  - **Nagoya Cochin:** golden-buff.
  - **Berkshire *kurobuta*:** black with six white points.
  - **Shiba:** red with cream urajiro (cheeks, chest, belly, inner legs) and a curled tail.
  - These ground the farm in Kansai and Japan.

### 7c. Design direction (visual separation rule)
- **Normal animals must never be mistaken for Tokonmon.** The rule:
  - **Eyes:** small dot or bean eyes (2–3 px at 64 px scale), **no big irises**.
  - **No element:** no element accent colour and no glow or VFX.
  - **Proportions:** realistic-cute (head about 30 %), and simpler outlines.
  - **Expression:** less facial animation, and behaviour loops instead.
  - Tokonmon in the same shot always have big anime eyes and at least one element-coloured accent.
- **Cow:** a Holstein in the dairy pen (black `#1e1a22` / white `#f4f2ee` patches, pink muzzle
  `#f0a8b0`, cowbell brass `#d8a03a`). Also a Kuroge Wagyu (black `#1a1618`, light `#4a4048`) in the
  beef pasture. Idle: chew, tail flick, ear flick.
- **Chicken:** Nagoya Cochin hens (buff `#e0a050` / shadow `#a05a2a`, red comb `#e0323c`, yellow legs
  `#f2c84a`). A white Leghorn rooster for contrast (`#f6f2ea`). Idle: peck, head-bob, scratch. **Note:**
  Chilichick is a Tokonmon chicken, so farm chickens must be clearly plainer.
- **Pig:** a Berkshire *kurobuta* (black `#2a2228` with white points `#f0e8e0` on the snout tip, feet and
  tail tip, snout pink `#e8a0a8`). Idle: snuffle, ear flop, roll in mud.
- **Farm dog:** a Shiba Inu (red `#d0782a` / shadow `#8a4a2a`, urajiro cream `#f6e6cc`, curled tail).
  Idle: sit, tail wag on twos, head tilt. It barks at the Kagarou entrance in the cinematic.
- **64 px:** sprites are 24–36 px. They are humble on purpose next to Tokonmon.

### 7d. Do / Don't
- **Do:** use real Japanese breeds and behaviour-based charm. Keep them plainer than any Tokonmon.
- **Don't:**
  - Give them element glows or big anime irises.
  - Copy Stardew Valley or Story of Seasons sprites.
  - Make a Miltank or Tauros look-alike.

---------------------------------------------------------------------------------------------------

## 8. Safari & city wilds: Kappachi, Hotarumi, Chochobake, Tengale, Yukiusa

**Owner (bible §3, verbatim):**
> | Safari & city wilds | Kappachi (Hydro), Hotarumi (Volto/Bio), Chochobake (Ecto), Tengale (Aero), Yukiusa (Cryo) |

*(Brief: kappa, firefly, chōchin-obake lantern ghost, tengu/wind, snow rabbit; yokai references.)*

**Shared yokai references**
- [K] Wikipedia, Yōkai: https://en.wikipedia.org/wiki/Y%C5%8Dkai
- [K] Wikipedia, Toriyama Sekien (*Gazu Hyakki Yagyō*, 1776, the canonical Edo-period yokai bestiary prints): https://en.wikipedia.org/wiki/Toriyama_Sekien
- [K] Wikipedia, Shigeru Mizuki / *GeGeGe no Kitarō* (the modern visual canon of yokai): https://en.wikipedia.org/wiki/Shigeru_Mizuki
- [K] Wikipedia, Tsukumogami (objects that gain a spirit at 100 years old): https://en.wikipedia.org/wiki/Tsukumogami

**Shared lesson:**
- Edo prints define yokai by **one strong object or animal feature plus one uncanny twist**: a dish on
  the head, a split lantern mouth, a long nose.
- Our versions keep that **one twist** as the silhouette, and render them cute-anime with crisp pixel
  outlines.

### 8.1 Kappachi (Hydro, about 0.8 m, arch `biped`)

*v1 lore: "A kappa imp that guards the canals of Dōtonbori. The water in its head-dish is its life force:
bow to it, and it bows back, spilling its power."*

**a. References**
- [K] Wikipedia, Kappa (folklore): https://en.wikipedia.org/wiki/Kappa_(folklore)
- [K] Bulbapedia, Lotad / Lombre / Ludicolo (the lily-pad "dish" and kappa-like Lombre): https://bulbapedia.bulbagarden.net/wiki/Lombre_(Pok%C3%A9mon)
- [K] Bulbapedia, Sobble (shy water lizard): https://bulbapedia.bulbagarden.net/wiki/Sobble_(Pok%C3%A9mon)
- [K] Wikipedia, Kappabashi (Tokyo kitchenware street with its kappa mascot statue): https://en.wikipedia.org/wiki/Kappabashi-dori
- [K] Wikipedia, Kappamaki (cucumber sushi roll named after the kappa's favourite food): https://en.wikipedia.org/wiki/Makizushi

**b. Study notes**
- **Kappa [K]:**
  - A child-sized river imp.
  - A **dish (*sara*) of water on the crown**, ringed by a fringe of hair. If the water spills, it
    weakens. The polite bow trick makes it spill (v1 lore uses this).
  - A **turtle shell** on its back, a **beak**, webbed hands and feet.
  - Green or blue-green skin.
  - It loves **cucumbers** and challenges people to **sumo**.
- **Lombre/Ludicolo [K]:** the lily pad is the "dish". **Lesson:** don't use a lily pad. Ours is a
  literal shallow water dish with a glinting meniscus.

**c. Design direction**
- **Silhouette:**
  - A small, round-bellied river imp with a big head (40 %).
  - **A shallow dish set into the crown, full of water that sloshes**, with a fringe of reed-like hair
    around it.
  - A **turtle shell on its back** whose plate pattern looks like Dotonbori canal stone paving *(Osaka
    tie)*.
  - A short duck-like beak, webbed hands and feet.
  - A cucumber held like a club or snack.
- **Face:** big shiny eyes, a cheeky beak grin, and a blush.
- **Accessory anchor:** the hat sits **around** the dish, never covering it, so the dish stays readable.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#10302e` |
| Deep | `#1f4a4a` |
| Skin shadow (blue-shifted) | `#2a6a7a` |
| Skin base | `#3fae8e` |
| Skin light | `#8fe0b8` |
| Skin highlight | `#d8fff0` |
| Shell | `#6a7a3a` / `#a0a85a` / `#d0d08a` |
| Beak | `#f2c84a` / `#c0902a` |
| Dish rim | `#e0e8d0` |
| Dish water | `#8ff0ff` / `#2fa8ff` with a `#ffffff` glint |
| Hair | `#1f4a3a` |
| Cucumber | `#3a8a3a` / `#a8e07a` |

- **Animations:**
  - **Idle:** the dish water sloshes with a 1 px meniscus shift on twos. It munches the cucumber.
  - **Attack "Canal Shot" (Hydro precision):** it tilts its head and fires an aimed water bullet *from
    the dish*, then quickly refills by dunking. Optional sumo shove.
  - **Bow emote:** a polite bow that spills a splash. It gets a ⚠ flicker and looks weak.
  - **Hit:** water slops out of the dish (droplet particles).
- **64 px:** about 40 px tall. The bright cyan dish on top (a 6–8 px ellipse with a white glint) is the
  read.
- **Elemental Form idea (Hydro, if final): "River Lord".** The dish becomes a **floating ring of water**
  over its head like a halo, the shell gains a waterfall cape, and the cucumber becomes a jade-glass
  staff.

**d. Do / Don't**
- **Do:** use the water dish as the gimmick, the bow-spill, the turtle shell, the cucumber, and
  canal-stone shell plates.
- **Don't:** copy Lombre's lily pad or Ludicolo's poncho/sombrero look, or Mizuki's kappa drawings.

### 8.2 Hotarumi (Volto/Bio, about 0.55 m, arch `flyer`, small hover)

*v1 lore: "At dusk, Hotarumi gather along the Okawa river and light their lantern abdomens so lost
children can find their way home."*

**a. References**
- [K] Wikipedia, Firefly: https://en.wikipedia.org/wiki/Firefly
- [K] Wikipedia, *Luciola cruciata* (Genji firefly; black body, **pinkish-red pronotum with a black
  cross-shaped mark**): https://en.wikipedia.org/wiki/Luciola_cruciata
- [K] Wikipedia, Aquatica lateralis (Heike firefly): https://en.wikipedia.org/wiki/Aquatica_lateralis
- [K] Bulbapedia, Volbeat / Illumise (firefly pair): https://bulbapedia.bulbagarden.net/wiki/Volbeat_(Pok%C3%A9mon)
- [K] Bulbapedia, Joltik / Vikavolt (electric bugs): https://bulbapedia.bulbagarden.net/wiki/Vikavolt_(Pok%C3%A9mon)
- [K] Wikipedia, *Grave of the Fireflies* (Ghibli, 1988; fireflies as fragile light, a tone reference only): https://en.wikipedia.org/wiki/Grave_of_the_Fireflies

**b. Study notes**
- **Genji firefly [K]:**
  - A slim black beetle.
  - A **pink/red shield (pronotum) with a black cross**.
  - The rear segments carry a **pale yellow-green light organ** (about 560 nm, approx `#c8ff6a` with a
    `#f6ffc0` core).
  - Summer *hotaru-gari* (firefly viewing) by rivers is a Japanese seasonal ritual.
  - They flash in **synchronised rhythms**.
- **Volbeat/Illumise [K]:** a humanoid firefly with a glowing tail bulb. **Lesson:** avoid the humanoid
  stance.
- **Vikavolt [K]:** a battery-beetle with jaws. **Lesson:** avoid mandible cannons.

**c. Design direction**
- **Silhouette:**
  - A chubby, round firefly with a small head.
  - The **big lantern abdomen** is a **glass-like bulb whose honeycomb cells glow** (bioluminescent
    "photocytes").
  - Small black elytra tilted open, with translucent wings buzzing.
  - Two feathery antennae.
- **Signature (the Volto twist):**
  - The red pronotum's black **cross mark is redrawn as a "+" battery terminal sign**.
  - Its tail bulb carries a subtle "–" band. It is a living battery: Volto plus Bio.
- **Face:** huge dark eyes with **two highlights** each, the softest face in the safari. A tiny smile.
- **Accessory anchor:** between the antennae.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#0e0c18` |
| Body | `#1e1a2a` / light `#3a3450` |
| Pronotum | `#ff6a7a` / shadow `#a03a5a` |
| Plus mark | `#1e1a2a` |
| Bulb glow | `#c8ff6a` → `#f6ffc0` → `#ffffff` |
| Bulb glass rim | `#8aa04a` |
| Wings | `#c8e8ff` at 50 % dither |
| Volto spark | `#ffe23a` |
| Bio motes | `#5fd35a` |

- **Animations:**
  - **Idle:** hovering bob, and the bulb pulses on a slow 8-pose breathe.
  - **Flock idle (safari):** several Hotarumi pulse **in sync** on the beat.
  - **Attack "Lantern Flash" (Volto):** a blinding flash burst that stuns, then a lightning arc to the
    target.
  - **Support "Guiding Light" (Bio):** a gentle healing glow trail.
  - **Hit:** the light blinks out for 2 poses, then flickers back.
- **64 px:**
  - About 32 px.
  - The bulb glow (8–10 px with a 1 px halo) plus the pink shield with a dark "+" (3×3 px) is the read.
  - It must read on dark night maps, so give it a **lighter outline on the bulb side**.
- **Elemental Form idea (Volto/Bio, if final): "Hotaru Matsuri".** The bulb becomes a **chain of three
  floating glow-orbs**, like a festival string of lights, linked by arcs. The wings turn to glowing
  lace, and every beat flashes rainbow-white.

**d. Do / Don't**
- **Do:** use the Genji firefly colours, the "+" terminal mark, synchronised flashing, and the river at
  dusk.
- **Don't:**
  - Use the Volbeat/Illumise humanoid stance or Vikavolt jaws.
  - Use any *Grave of the Fireflies* imagery (war, the tin of candy).
  - Make the bulb a paper lantern. That is Chochobake's territory.

### 8.3 Chochobake (Ecto, about 0.9 m, arch `floater`)

*v1 lore: "When a festival lantern turns one hundred years old it tears open a mouth and wakes up. It
haunts the night markets of Shinsekai, licking passers-by and giggling."*

**a. References**
- [K] Wikipedia, Chōchin-obake: https://en.wikipedia.org/wiki/Ch%C5%8Dchin-obake
- [K] Wikipedia, Tsukumogami: https://en.wikipedia.org/wiki/Tsukumogami
- [K] Wikipedia, Katsushika Hokusai, *Hyaku Monogatari*, "Oiwa-san" (the ghost's face in a broken lantern, about 1831): https://en.wikipedia.org/wiki/Hyakumonogatari_Kaidankai
- [K] Wikipedia, Akachōchin (red izakaya lantern): https://en.wikipedia.org/wiki/Chōchin
- [K] Bulbapedia, Litwick / Lampent / Chandelure: https://bulbapedia.bulbagarden.net/wiki/Lampent_(Pok%C3%A9mon)
- [K] Wikipedia, Shinsekai (Osaka; Tsutenkaku, kushikatsu alleys full of red lanterns): https://en.wikipedia.org/wiki/Shinsekai

**b. Study notes**
- **Chōchin-obake [K]:**
  - A paper lantern (bamboo ribs, washi paper, lacquered top and bottom caps).
  - It **splits along a rib to form a mouth**, with a **long tongue lolling out** and **one or two eyes**
    opening in the paper.
  - It is a tsukumogami, an object that woke at 100 years old.
- **Hokusai's Oiwa lantern [K]:** the lantern tear *becomes* the face, which is the canonical image.
  **Lesson:** the tear line *is* the mouth.
- **Lampent [K]:** a hanging lamp with a ghost-flame inside and yellow eyes in the glass. **Lesson:**
  avoid a glass lamp. Ours is paper, so its light **glows through the paper between ribs** (banded
  light).
- **Shinsekai [K]:** a forest of red *akachōchin* in kushikatsu alleys. An obvious home habitat, and
  red sets it apart from the other ghosts.

**c. Design direction**
- **Silhouette:**
  - A **red cylindrical akachōchin lantern** with black lacquer caps top and bottom, floating.
  - The **top cap has a little wire loop** like a hanging hook (hats go here).
  - The **mouth is a torn rib-line** across the middle that opens wide, and **a long pink tongue** flaps
    down out of it.
  - **One huge eye** opens in the paper above the mouth.
  - A paper tassel hangs from the bottom cap like a tail.
- **Light:** an Ecto spirit flame inside **shows through the paper in horizontal bands between ribs**.
  The bands brighten when it giggles.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#2a0a14` |
| Paper deep | `#6a1424` |
| Paper shadow | `#a01c30` |
| Paper base | `#d8283a` |
| Paper lit-through | `#ff6a5a` / `#ffc0a0` |
| Ribs | `#5a0a1a` |
| Lacquer caps | `#1a1418` / `#4a3a40` |
| Tongue | `#ff7aa0` / `#c03a6a` |
| Eye | `#fff6e0` sclera, `#8a5aff` iris |
| Inner flame | Ecto `#8a5aff` → `#ff7af2` → `#ffe0f6` |
| Tassel | `#ffcf3a` |

- **Animations:**
  - **Idle:** sways as if hanging in a breeze (pendulum, 6 poses). The eye blinks and the tongue lolls.
  - **Attack "Lantern Lick":** a lunge, then the tongue lashes out (a long smear), then a giggle.
  - **Attack "Onibi Spit":** it spits small ghost-flames.
  - **Hit:** the paper tears a bit more and the light flares through the tear, then the tear patches with
    a paper scrap.
  - **Emote:** the giggle flashes all the rib bands.
- **64 px:**
  - About 44 px.
  - A red cylinder plus a black cap and a pink tongue hanging out. Banded light is 1 px light lines on
    the red.
- **Elemental Form idea (Ecto, if final): "Hyakki Lantern" (the night parade).** Two smaller ghost
  lanterns orbit it on spectral strings. Its paper turns translucent violet with the flame fully
  visible, and the tongue becomes a long trailing ribbon of flame.

**d. Do / Don't**
- **Do:** use a red izakaya lantern, the torn-rib mouth, one eye, the long tongue, and banded
  through-paper light.
- **Don't:**
  - Use Oiwa's face or any human face in the paper.
  - Make a glass lamp or chandelier (Litwick line).
  - Write kanji or real shop names on the lantern.

### 8.4 Tengale (Aero, about 1.0 m, arch `flyer` / `biped`)

*v1 lore: "A crow-tengu that trains alone on the cedar slopes of Mt. Ikoma. One sweep of its leaf-fan
wings can blow a delivery drone clean out of the Osaka sky."*

**a. References**
- [K] Wikipedia, Tengu: https://en.wikipedia.org/wiki/Tengu
- [K] Wikipedia, Sōjōbō (king of the tengu, Mt. Kurama): https://en.wikipedia.org/wiki/S%C5%8Dj%C5%8Db%C5%8D
- [K] Wikipedia, Yamabushi (mountain ascetics; *tokin* cap, *yuigesa* pom-pom sash, *hora* conch): https://en.wikipedia.org/wiki/Yamabushi
- [K] Bulbapedia, Shiftry (tengu-inspired with leaf-fan hands) and Nuzleaf: https://bulbapedia.bulbagarden.net/wiki/Shiftry_(Pok%C3%A9mon)
- [K] Bulbapedia, Honchkrow, Hawlucha: https://bulbapedia.bulbagarden.net/wiki/Hawlucha_(Pok%C3%A9mon)
- [K] Wikipedia, Fatsia japonica (*yatsude*, the "tengu's fan" leaf): https://en.wikipedia.org/wiki/Fatsia_japonica

**b. Study notes**
- **Tengu [K]:**
  - **Karasu-tengu:** crow-beaked and black-winged.
  - **Daitengu:** red-faced and long-nosed.
  - Both are dressed as **yamabushi** mountain ascetics:
    - a small black **tokin** cap
    - a **yuigesa** sash with **pom-poms** down the chest
    - one-toothed **geta**
    - a **hauchiwa** feather fan that whips up gales
  - They are masters of martial arts and the wind.
- ***Yatsude* leaf [K]:** a big palmate leaf called "tengu's fan" (*tengu no hauchiwa*) in folk naming.
  It is the v1 "leaf-fan wings" source.
- **Shiftry [K]:** already a tengu with **leaf-fan hands**, a long nose and white "hair". **Lesson:**
  ours must be the **crow-tengu** (beak, no long nose) with fan-tipped **wings**, not hands.

**c. Design direction**
- **Silhouette:**
  - A compact crow-tengu, upright, in a martial stance.
  - A **small black hexagonal tokin cap** on its forehead (the accessory anchor is above or around it).
  - Wings whose **primary feathers end in big seven-lobed *yatsude* leaves**, so each wing ends in a
    "fan".
  - **Yuigesa pom-poms** down the chest: 3 fluffy mint wind-puffs.
  - One-tooth geta talons.
- **Face:** a sharp amber beak, fierce narrow eyes, and a frowning brow-feather. Proud.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#0e0e18` |
| Feather deep | `#1e2030` |
| Feather base | `#2e3248` |
| Feather sheen (blue) | `#4a5aa0` / `#8a9ae0` |
| Beak | `#f2b33a` / `#a0661a` |
| Robe | `#f2f0e6` / shadow `#b8b8c8` |
| Indigo hakama | `#2f3a6a` / `#4a5a9a` |
| Pom-poms | Aero `#a8f5c8` / `#ffffff` |
| Leaf fans | `#2f7a3a` / `#6ac05a` / vein `#c8f0a0` |
| Geta | `#8a5a3a` |
| Wind VFX | Aero `#a8f5c8` |

- **Animations:**
  - **Idle:** a one-leg balance on the geta, and the leaf-fans waft slowly. Feathers ruffle.
  - **Attack "Gale Fan":** one big **wing-fan sweep** (3-pose wind-up, then a huge smear arc). A wide
    gust wave with leaves in it pushes enemies (Aero mobility).
  - **Dash:** a blink-dash leaving a feather trail.
  - **Hit:** feathers puff out and one leaf-fan flips inside out, then snaps back.
- **64 px:**
  - About 44 px.
  - The two green leaf-fan wingtips on a black body plus the small cap are the read.
  - Pom-poms: 3 bright 2 px dots.
- **Elemental Form idea (Aero, if final): "Daitengu Gale".**
  - It gains a **second pair of leaf-fan wings**.
  - Its tokin cap emits a **vortex halo**.
  - Its robe becomes a swirling wind mantle with cedar needles.
  - A floating feather-fan (hauchiwa) made of wind orbits its hand.

**d. Do / Don't**
- **Do:** use the crow-tengu, the *yatsude* leaf-fan wings, the tokin cap, the yuigesa pom-poms and the
  one-tooth geta.
- **Don't:**
  - Give it a long red nose or a white mane (Shiftry / daitengu mask).
  - Copy temple tengu masks.
  - Give it a luchador mask (Hawlucha).

### 8.5 Yukiusa (Cryo, about 0.5 m, arch `hopper`)

*v1 lore: "Said to be a snow-rabbit sculpture that a lonely child wished to life. It only appears on
still winter nights, and melts away if you stare too long."*

**a. References**
- [K] Japanese Wikipedia, 雪うさぎ (*yuki-usagi*, a snow rabbit made on a tray with **red berry eyes** and
  **leaf ears**): https://ja.wikipedia.org/wiki/%E9%9B%AA%E3%81%86%E3%81%95%E3%81%8E
- [K] Wikipedia, Nandina domestica (*nanten*, the red berries used for the eyes): https://en.wikipedia.org/wiki/Nandina
- [K] Wikipedia, Mountain hare (white winter coat; Japan's *Ezo* variable hare): https://en.wikipedia.org/wiki/Mountain_hare
- [K] Bulbapedia, Snom / Frosmoth, Vanillite, Alolan Vulpix, Cetoddle: https://bulbapedia.bulbagarden.net/wiki/Snom_(Pok%C3%A9mon)

**b. Study notes**
- ***Yuki-usagi* [K]:**
  - A small **oval mound of packed snow** on a tray.
  - **Two red nanten berries for eyes** and **two green leaves (nanten or yuzuriha) for ears**.
  - A classic Japanese winter craft. It is beautiful *because* it is simple and temporary.
  - Approx: snow `#f4fbff` with blue shade `#b8d0f0`, berry `#d2232a`, leaf `#2f7d32`.
- **Mountain hare [K]:** a white winter coat with black ear tips. **Lesson:** a black ear-tip accent
  would conflict with the leaf ears, so skip it.
- **Ice Pokémon [K]:** Snom (a frost larva), Vanillite (an ice-cream cone), Alolan Vulpix (a snow fox).
  **Lesson:** ours is a **sculpture come alive**, with soft packed-snow texture and no ice crystals on
  the body.

**c. Design direction**
- **Silhouette:**
  - Literally the yuki-usagi: a **smooth oval snow mound** body (no visible legs at rest).
  - **Two long, glossy green leaves as ears.**
  - **Big red berry eyes** (anime-sized, glossy, with a white highlight, like real berries).
  - It sits on a **small round ice plate** (the "tray") that travels with it.
  - When it hops, two tiny snow feet appear.
- **Ephemeral read:**
  - A faint **sparkle dither** on the snow surface.
  - The lower edge is **slightly soft and melting** (1–2 px drip shapes) to show it can fade (v1 lore).
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#4a5a8a` (no dark outline, to stay soft) |
| Snow deep | `#7a90c8` |
| Snow shadow | `#b8d0f0` |
| Snow base | `#e8f4ff` |
| Snow light | `#f4fbff` |
| Snow highlight | `#ffffff` |
| Berry eyes | `#d2232a` / `#8a0a1a` / highlight `#ffd0d8` |
| Leaves | `#1f5a2a` / `#2f7d32` / `#7fd06a` |
| Ice plate | Cryo `#9fefff` / `#e6faff` |
| Snowflakes VFX | `#e6faff` |

- **Animations:**
  - **Idle:** a still, breath-like shimmer. The leaf-ears tilt one at a time, and a tiny snowflake falls
    past.
  - **Attack "Hailstone Hop":** it hops up, becomes a snowball, and drops onto the target (a freeze
    puff).
  - **Attack "Frost Gaze":** a stare that frosts the target (Cryo control).
  - **Hit:** a chunk of snow puffs off, then it **repacks itself** by patting with its ears.
  - **Stare-melt (story / v1 flavour):** it slowly sinks into a puddle-mound and vanishes in sparkle.
- **64 px:**
  - About 30 px.
  - Two red eyes (4 px each) plus two green ear-leaves on a white oval. The best silhouette in the game
    for its size.
  - Needs the blue-violet outline so it reads on snow maps.
- **Elemental Form idea (Cryo, if final): "Moon Mochi".** The snow body becomes **translucent moon-ice**
  with a pale glow. It floats on a **full-moon-shaped ice tray**, and its leaf ears become frosted
  silver leaves trailing snow. *(This is also a nod to the Japanese moon-rabbit motif.)*

**d. Do / Don't**
- **Do:** be literal about the yuki-usagi (berries, leaves, tray). Make it soft, ephemeral and melting.
- **Don't:** add ice spikes or crystals on the body (Snom, Vanillite), and don't give it a fox face or
  fur (Vulpix).

---------------------------------------------------------------------------------------------------

## 9. Friends' and other trainers' partners: Zapanda, Kanizumo, Idolark, Mechanyan

**Owner (bible §3, verbatim):**
> | Friends' and other trainers' partners | Zapanda (Volto, Mika's), Kanizumo (Hydro/Geo, Coach's), Idolark (Echo), Mechanyan (Ferro/Volto) |

### 9.1 Zapanda (Volto, Mika's partner, about 0.8 m, arch `quad`, rears up)

*v1 lore: "Mika's partner. Its cheek pouches are living battery cells that it recharges by napping in
the sun on Den-Den Town rooftops."*

**a. References**
- [K] Wikipedia, Red panda (*Ailurus fulgens*): https://en.wikipedia.org/wiki/Red_panda
- [K] Wikipedia, Futa (the red panda that stood upright at Chiba Zoological Park, 2005): https://en.wikipedia.org/wiki/Futa_(red_panda)
- [K] Bulbapedia, Pikachu / Pachirisu / Dedenne / Morpeko (electric rodents, cheek-charge grammar): https://bulbapedia.bulbagarden.net/wiki/Morpeko_(Pok%C3%A9mon)
- [K] Wikipedia, *Turning Red* (Pixar, 2022; red panda as a cute icon): https://en.wikipedia.org/wiki/Turning_Red
- [K] Wikipedia, Den Den Town / Nipponbashi (Osaka electronics district): https://en.wikipedia.org/wiki/Nipponbashi

**b. Study notes**
- **Red panda [K]:**
  - A rusty red-brown coat (`#b5501c` approx).
  - A **white face mask** with **dark "tear-track" stripes** from eye to mouth.
  - White-rimmed ears.
  - A **bushy ringed tail** with about 12 alternating light and dark rings.
  - **Black legs and belly.**
  - It famously **stands up on its hind legs** to look big (Futa).
- **Electric rodents [K]:** Pikachu-family charm lives in **cheek pouches** plus a lightning tail.
  **Lesson:** avoid a bolt-shaped tail. Use the red panda's **ring pattern as a battery gauge**
  instead.

**c. Design direction**
- **Silhouette:**
  - A plump red panda with a big round head (45 %) and big white-rimmed ears.
  - A **huge ringed tail** as long as its body.
  - Its signature pose is **the stand-up threat pose** (Futa nod), used as an intimidation emote.
- **Signatures:**
  1. **Battery-ring tail:** the rings are **charge segments** that light up yellow from base to tip as it
     charges. It is a readable charge meter on the creature, with no UI (bible §1 "almost no UI").
  2. **Cheek pouches** with tiny **terminal nubs** that spark.
  3. **Tear-tracks** drawn as **zig-zag bolt shapes**.
- **Face:** large sparkly eyes, a small smug smile, a black nose. Mika's personality is the sunny best
  friend, so it is **cheerful**.
- **Accessory anchor:** between the ears (Mika's hair-clip accessory).
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#2a1014` |
| Coat deep | `#5a2a3a` |
| Coat shadow | `#8a3a2a` |
| Coat base | `#c2511e` |
| Coat light | `#ef8a3a` |
| Coat highlight | `#ffc08a` |
| Face/ear white | `#fff4e6` / shadow `#d8c0b8` |
| Tear-bolts | `#7a2a14` |
| Legs/belly | `#2a1a1e` / `#4a3438` |
| Tail dark rings | `#7a3418` |
| Tail lit rings | Volto `#ffe23a` / `#ffffff` |
| Eyes | `#2a1410` with `#ffffff` |

- **Animations:**
  - **Idle:** the tail sways, and one ring blinks lit.
  - **Nap idle:** curls up in a sun patch and rings fill slowly (v1 recharge).
  - **Attack "Zap Swipe" (Volto speed):** a fast paw swipe with lightning claws.
  - **Attack "Full Charge Tail Whip":** all rings lit, a spin, a lightning ring burst.
  - **Stand-up emote:** rears up with arms wide, then sparks.
  - **Hit:** fur poofs out, and the rings flicker off one by one.
- **64 px:**
  - About 40 px.
  - The **ringed tail** (4–5 visible rings of 2–3 px) plus the white face mask with dark tear-bolts.
  - Lit rings are the only yellow.
- **Elemental Form idea (Volto, if final): "Overcharge".** The fur tips glow white-yellow, **the tail
  splits into three ringed tails** fully lit, the cheek pouches crackle with a constant arc between them,
  and the ears grow lightning fur tufts.

**d. Do / Don't**
- **Do:** use the ringed-tail charge meter, the stand-up pose, the cheek battery terminals and the bolt
  tear-tracks.
- **Don't:** use a bolt-shaped tail or red cheek circles (Pikachu), or a Morpeko hunger-mode look. No
  *Turning Red* character features.

### 9.2 Kanizumo (Hydro/Geo, Coach Gonda's partner, about 1.1 m, arch `insect` + arms)

*v1 lore: "Coach Gonda's partner. It once wrestled the giant mechanical crab sign off a Dotonbori
restaurant, then apologised and put it back."*

**a. References**
- [K] Wikipedia, Kani Doraku (Dotonbori crab restaurant famous for its **giant moving mechanical crab
  sign**): https://en.wikipedia.org/wiki/Kani_Doraku
- [K] Wikipedia, Sumo (mawashi, kesho-mawashi, shiko stomp, salt purification, yokozuna rope): https://en.wikipedia.org/wiki/Sumo
- [K] Wikipedia, Mawashi: https://en.wikipedia.org/wiki/Mawashi
- [K] Wikipedia, Heikegani (crab whose shell looks like an angry samurai face): https://en.wikipedia.org/wiki/Heikegani
- [K] Bulbapedia, Kingler / Crabrawler / Crabominable (boxing crab): https://bulbapedia.bulbagarden.net/wiki/Crabrawler_(Pok%C3%A9mon)
- [K] Wikipedia, Japanese spider crab (long legs; Japan's giant crab): https://en.wikipedia.org/wiki/Japanese_spider_crab

**b. Study notes**
- **Kani Doraku sign [K]:**
  - A huge red crab with articulated **legs and claws that move** above the shopfront.
  - One of Dotonbori's top landmarks.
  - It fits perfectly with v1 lore and Coach Gonda's Osaka identity.
- **Sumo [K]:**
  - **Mawashi:** a thick belt with stiffened **sagari** strands hanging in front.
  - **Kesho-mawashi:** an ornate apron for ring entry.
  - **Shiko:** a high leg-raise and stomp that drives evil from the ring.
  - **Salt throw** for purification.
  - The **ōichō-mage** topknot is ginkgo-leaf shaped.
  - The yokozuna's white **tsuna** rope carries zig-zag **shide** papers.
- **Heikegani [K]:** a shell ridged like a scowling face. **Lesson:** the crab's carapace can *be* the
  wrestler's stern face.
- **Crabrawler/Crabominable [K]:** a boxing crab with big claw-fists. **Lesson:** avoid boxing gloves.
  Ours **tsuppari** (open-palm thrusts) with flat claw-palms.

**c. Design direction**
- **Silhouette:**
  - A **squat, very wide red crab** standing on its rear legs in a sumo crouch (*shikiri*).
  - **A mawashi belt** wraps its waist (navy), with sagari strands in front.
  - The two big claws are **flattened like open palms** for tsuppari.
  - **A ginkgo-leaf topknot** sits on top of the carapace (a stalk-mounted, chonmage-like shell crest).
  - The stalk eyes sit just under it.
- **Carapace:** a **stern Heike-style face pattern** in relief, the "game face". The real eyes are cute
  stalk eyes, so the contrast is funny: stern shell, kind eyes.
- **Accessory anchor:** in front of the topknot. Coach's whistle could hang on the mawashi.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#2a0a14` |
| Shell deep | `#7a1f3a` |
| Shell shadow | `#a8302a` |
| Shell base | `#d8402a` |
| Shell light | `#ff8a5a` |
| Shell highlight | `#ffd0b0` |
| Underbelly | `#f6e3c4` / `#c8a88a` |
| Mawashi | `#1f2a5a` / `#3a4a8a` |
| Sagari | `#2f3a7a` |
| Topknot | `#1a1420` / sheen `#4a4058` |
| Salt | `#ffffff` |
| Eyes | `#1a1420` with `#ffffff` |
| Hydro VFX | `#2fa8ff` |
| Geo VFX | `#d39a5c` |

- **Animations:**
  - **Idle:** a sumo crouch with a slow weight shift side to side. Claws clack and bubbles foam at the
    mouth.
  - **Shiko stomp (Geo):** a high leg raise (3 poses), then a stomp with a ground crack ring. This is its
    Geo wall/quake.
  - **Attack "Tsuppari Barrage":** rapid alternating claw-palm thrusts with water splash impacts.
  - **Salt throw (emote):** it flings a white salt sparkle arc before battle.
  - **Hit:** it scuttles sideways 2 poses (crab!) and plants its feet again.
- **64 px:**
  - About 40 px tall, 56 px wide (wide sprite).
  - The navy belt band across the red body plus the black topknot nub are the read.
- **Elemental Form idea (Hydro/Geo, if final): "Yokozuna Tide".** It wears a **braided white rope of
  water (tsuna)** around its waist with zig-zag paper of foam. The shell turns deep crimson with gold
  ridges, and each stomp raises a tidal wall.

**d. Do / Don't**
- **Do:** use the sumo crouch, mawashi, shiko stomp, salt throw, ginkgo topknot, open-palm claws, and the
  Dotonbori crab-sign energy.
- **Don't:**
  - Copy the Kani Doraku sign or logo.
  - Use boxing gloves or fists (Crabrawler).
  - Use a real yokozuna's kesho-mawashi designs.

### 9.3 Idolark (Echo, about 0.7 m, arch `flyer`)

*v1 lore: "Idolark rehearse at dawn on the rooftops of Namba, and a flock harmonising can drown out a
stadium. They will only perform encores for trainers who clap on the beat."*

**a. References**
- [K] Wikipedia, Eurasian skylark (*hibari*; crest, streaked brown plumage, sings in a hovering
  song-flight high overhead): https://en.wikipedia.org/wiki/Eurasian_skylark
- [K] Wikipedia, Hibari Misora (the legendary singer whose stage name means "skylark"): https://en.wikipedia.org/wiki/Hibari_Misora
- [K] Wikipedia, Japanese idol (frilled stage costumes, fan penlights and *wotagei* cheering): https://en.wikipedia.org/wiki/Japanese_idol
- [K] Bulbapedia, Meloetta (Aria form), Chatot (music-note bird), Altaria (cloud-wing singer), Primarina (diva): https://bulbapedia.bulbagarden.net/wiki/Chatot_(Pok%C3%A9mon)

**b. Study notes**
- **Skylark [K]:**
  - A small brown, streaky bird with a **short erectile crest**.
  - It **rises singing until almost invisible and hovers**, pouring out song (song-flight).
  - Japanese *hibari*.
  - Approx: plumage `#c8a070` / streaks `#6a4a2a` / belly `#f2e6cc`.
- **Hibari Misora [K]:** the skylark name equals the singer-star archetype in Japan. A deep cultural
  pun.
- **Idol culture [K]:**
  - Frilly tiered skirts, ribbons, a headset mic, star motifs.
  - **Fans wave penlights in the idol's colour.**
  - Synchronised fan chants.
- **Pokémon singers [K]:** Chatot has a music-note head and metronome tail. **Lesson:** avoid music
  notes as body parts. Ours is about **idol fashion + skylark anatomy**.

**c. Design direction**
- **Silhouette:**
  - A round little skylark with a **big crest styled like idol twin-tails**: two feather plumes
    tied with ribbons.
  - **Wing coverts frilled like a layered idol skirt** (3 tiers), shown when the wings open.
  - **A tiny headset-mic feather** curls from its cheek to its beak.
  - Long tail feathers that change colour like **fan penlights**.
- **Face:**
  - Big sparkly eyes with **star-shaped highlights**, and a star blush on the cheek.
  - A small open beak that always looks like it's singing.
- **Accessory anchor:** between the twin-tail crests.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#3a1a2a` |
| Plumage shadow | `#8a5a4a` |
| Plumage base | `#c8a070` |
| Plumage light | `#f2d8a8` |
| Belly | `#fff4e0` |
| Streaks | `#6a4a2a` |
| Ribbons / frills | idol pink `#ff6fae` / `#ffc0dc` |
| Stars | `#ffe23a` |
| Mic | `#2a2a3a` |
| Penlight tail | cycles `#ff6fae` → `#5ff4ff` → `#ffe23a` → `#b26bff` |
| Echo VFX | `#b26bff` / `#5ff4ff` |

- **Animations:**
  - **Idle:** a dance-step bounce, and the crest twin-tails swing.
  - **Attack "Song-Flight":** it rises into a hover (skylark behaviour) and sings concentric Echo rings
    downward. A pose change on every beat.
  - **Encore emote:** a wing-skirt twirl with a star burst.
  - **Hit:** feathers puff, and the crest droops for 2 poses.
  - **Flock (wild):** 3–5 harmonise, each with a different tail colour.
- **64 px:**
  - About 32 px.
  - The twin-tail crest plus the bright tail feather colour.
  - The star eye highlight is a 3 px plus-shape.
- **Elemental Form idea (Echo, if final): "Centre Stage".** The crest becomes a **glowing tiara of light
  feathers**, and the frill skirt lengthens into a sweeping stage-light gown of feathers. Floating
  penlight-feathers orbit like a fan section, and each beat swaps their colour.

**d. Do / Don't**
- **Do:** use skylark anatomy (crest, hovering song-flight), idol fashion, penlight colour cycling, and
  the "hibari" pun.
- **Don't:**
  - Use music notes as body parts (Chatot).
  - Use real idols' costumes or likenesses.
  - Make it a Hatsune Miku twin-tail copy (keep the crest feathered, short and bird-like).

### 9.4 Mechanyan (Ferro/Volto, about 1.0 m, arch `biped`)

*v1 lore: "Built in a Den-Den Town workshop as a lucky shop mascot, it learned to battle by watching
League broadcasts. Its beckoning paw never stops: it is always calling in good fortune."*

**a. References**
- [K] Wikipedia, Maneki-neko (raised beckoning paw: left calls customers, right calls money; often
  calico; red collar and bell; holds a *koban* coin): https://en.wikipedia.org/wiki/Maneki-neko
- [K] Wikipedia, Doraemon (the robotic cat from the future, as an "avoid" reference): https://en.wikipedia.org/wiki/Doraemon
- [K] Wikipedia, Astro Boy (Osamu Tezuka; retro-future robot design): https://en.wikipedia.org/wiki/Astro_Boy
- [K] Bulbapedia, Galarian Meowth / Perrserker (steel-cat precedent): https://bulbapedia.bulbagarden.net/wiki/Perrserker_(Pok%C3%A9mon)
- [K] Wikipedia, Nipponbashi / Den Den Town (Osaka's electronics, parts and otaku district): https://en.wikipedia.org/wiki/Nipponbashi

**b. Study notes**
- **Maneki-neko [K]:**
  - A seated cat with an **upright beckoning paw**.
  - A **calico** pattern (white with orange and black patches).
  - A **red collar with a gold bell**, holding a gold oval *koban*.
  - Battery-powered waving versions are common, which literally supports the robot idea.
- **Doraemon [K]:** round blue-and-white robot cat, no ears, a belly pocket, a bell. **Lesson:** keep ears,
  no blue body, no belly pocket.
- **Perrserker [K]:** a Viking-ish steel cat with a dark iron fur-mane. **Lesson:** ours is **enamel and
  chrome, not dark iron fur**.
- **Astro Boy [K]:** clean round retro-future shapes, visible joint seams, simple shading. A good
  **construction style** to follow.

**c. Design direction**
- **Silhouette:**
  - An upright robot cat with a big round helmet-head and **pointed ears with antenna tips**.
  - A compact torso and chunky gauntlet forearms.
  - **One forearm is permanently raised and beckoning on a visible rotary motor joint**, its signature
    (v1).
  - **A cable tail** with a plug at the end.
- **Body panels:** **white enamel with calico-coloured panels** (orange and black panel plates) instead
  of fur patches.
- **Chest:** a **gold *koban*-shaped LED panel** that shows a battery-charge bar (Volto). It is not a
  coin with text.
- **Collar:** red, with a **bell that is actually a speaker** (it chimes when it attacks).
- **Face:** LCD-visor eyes (big anime eyes **drawn as pixel-light on a dark screen**, so they can change
  shape: `^ ^`, `> <`, hearts). A small `ω` cat mouth.
- **Accessory anchor:** between the ears on the helmet.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#1a1a24` |
| Enamel deep | `#7a8098` |
| Enamel shadow | `#a8b0c8` |
| Enamel base | `#e8e8ee` |
| Enamel light | `#f8f6f2` |
| Enamel highlight | `#ffffff` |
| Chrome joints | Ferro `#b8c4d0` / `#5a6470` |
| Calico orange | `#ff8a3a` / `#c05a1a` |
| Calico black | `#2a2430` / `#4a4458` |
| Collar | `#d8283a` |
| Bell | `#ffcf3a` |
| Koban LED | `#ffcf3a` with bar `#ffe23a` |
| Visor | `#14141e`, eye light `#5ff4ff` |
| Volto spark | `#ffe23a` |

- **Animations:**
  - **Idle:** **the beckoning paw never stops** (a 4-pose loop that runs even during other idles). The
    head tilts, and the tail plug sways.
  - **Attack "Lucky Punch" (Ferro brutal grab):** the beckoning arm **extends on a telescoping piston**,
    grabs, then yanks the target close (beckoning made literal).
  - **Attack "Fortune Spark":** a Volto discharge from the bell.
  - **Hit:** the visor shows `x x` for 2 poses, a panel pops open, and it slaps it shut.
- **64 px:**
  - About 44 px.
  - The raised beckoning paw (always up) is the outline-breaker.
  - Calico panels are 2 colour blocks of 4–6 px. Visor eyes are bright cyan 3 px.
- **Elemental Form idea (Ferro/Volto, if final): "Golden Fortune Unit".**
  - The enamel turns **gold plating** with calico panels in red lacquer.
  - **Both** arms beckon (customers *and* money).
  - A ring of floating koban-shaped magnetic plates orbits it as a shield.

**d. Do / Don't**
- **Do:** use the maneki-neko beckoning paw on a motor, calico as paint panels, the bell-speaker, the
  koban LED, Den-Den Town workshop seams, and Astro-Boy-clean construction.
- **Don't:**
  - Make it blue and round, earless, or give it a belly pocket (Doraemon).
  - Give it dark iron fur (Perrserker).
  - Write kanji on the koban.

---------------------------------------------------------------------------------------------------

## 10. Team Metallica & metal bullies: Studrat, Moshbull, Thrashark, Marionoir, Sandmare, Ironmaw

**Owner (bible §3, verbatim):**
> | Team Metallica & metal bullies | Studrat (Ferro), Moshbull (Geo), Thrashark (Hydro), Marionoir (Ecto, "Master of Puppets"), **Sandmare** (Ecto/Geo, "Enter Sandman"), **Ironmaw** (Ferro, "Iron Man") |

And §4: "**Team Metallica**, a punk gang… **Thrash** (leader), **Riff**, **Moshi**. A lot of other bullies
with metallic styles: thrash, black-metal corpse paint, glam, nu-metal, studded denim battle vests,
chains."

**Shared bully-team references**
- [K] Wikipedia, Battle jacket (denim/leather vest covered in band patches, studs, pins): https://en.wikipedia.org/wiki/Battle_jacket
- [K] Wikipedia, Punk fashion (studs, spikes, safety pins, mohawks, chains): https://en.wikipedia.org/wiki/Punk_fashion
- [K] Wikipedia, Thrash metal: https://en.wikipedia.org/wiki/Thrash_metal
- [K] Wikipedia, Moshing (mosh pit, circle pit, headbanging): https://en.wikipedia.org/wiki/Moshing

**Shared team look (all six):**
- Every bully Tokonmon has **one piece of "battle-vest" material**: a patch of denim hide, a stud row, a
  safety pin or a chain.
- Accents are **studded chrome `#d0dae4` + blood red `#c0182a` + denim `#3a5a8a`**.
- This marks them as Team Metallica at a glance, even though their elements differ.
- Patches are **blank shapes or original glyphs**, never real band logos.

### 10.1 Studrat (Ferro, about 0.55 m, arch `quad`)

*v1 lore: "The Team Metallica punks' favourite. It sharpens its mohawk on train rails and swears it was a
Master of Puppets in a past life."*

**a. References**
- [K] Bulbapedia, Rattata / Raticate (to avoid): https://bulbapedia.bulbagarden.net/wiki/Raticate_(Pok%C3%A9mon)
- [K] Wikipedia, Brown rat: https://en.wikipedia.org/wiki/Brown_rat
- [K] Wikipedia, Punk fashion: https://en.wikipedia.org/wiki/Punk_fashion

**b. Study notes**
- **Rat anatomy [K]:** a pointed snout, round thin ears, a naked scaly pink tail, and long incisors.
- **Punk [K]:** spiked studs on leather, safety pins through ears, a liberty-spike or mohawk, chains.
- **Raticate [K]:** buck teeth plus big whiskers on a round body. **Lesson:** our read is **metal
  studs**, not teeth.

**c. Design direction**
- **Silhouette:** a scrappy, lean street rat.
  - **A metal mohawk**: a ridge of 5 chrome spike-studs from forehead to shoulders, sharpened (v1).
  - **Studs grow out of its back fur** in a row.
  - **A chain tail** (the scaly pink tail ends in 3 chain links).
  - A **safety pin through one torn ear**.
  - A denim-blue patch of fur on its flank (battle-vest nod).
- **Face:** narrow, sly eyes with a red iris, a smirk, and one chipped steel incisor.
- **Accessory anchor:** in front of the mohawk.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#1a1420` |
| Fur deep | `#3a2a40` |
| Fur shadow | `#5a4a5a` |
| Fur base | `#7a6a78` |
| Fur light | `#a898a8` |
| Tail / ears | `#e0909a` / `#a05a6a` |
| Studs | Ferro `#d0dae4` / `#5a6470`, glint `#ffffff` |
| Denim patch | `#3a5a8a` / `#5a7aaa` |
| Eye | `#ff3a3a` |
| Ferro sparks | `#b8c4d0` |

- **Animations:**
  - **Idle:** a twitchy sniff. It scrapes its mohawk on the ground (sparks), and the chain tail clinks.
  - **Attack "Stud Rush":** a quick rolling ball of spikes (it curls into a spiked ball).
  - **Attack "Rail Grind":** a mohawk headbutt with sparks.
  - **Hit:** a squeak pose, and a stud pings off and regrows.
- **64 px:** about 30 px. The mohawk spike row (5 chrome triangles of 2–3 px) is the read.
- **Note:** v1 has it at stage 1. No Elemental Form unless a final is defined.

**d. Do / Don't**
- **Do:** use a chrome stud mohawk, a chain tail, a safety pin and a denim patch.
- **Don't:** go Raticate-like (giant teeth, whisker fan). No real band patches.

### 10.2 Moshbull (Geo, about 1.4 m, arch `quad`)

*v1 lore: "When the bass drops it charges, and whatever is in front of it becomes the pit. Its stone horns
are said to be meteorite fragments."*

**a. References**
- [K] Bulbapedia, Tauros / Bouffalant (bull and afro-buffalo to avoid): https://bulbapedia.bulbagarden.net/wiki/Bouffalant_(Pok%C3%A9mon)
- [K] Wikipedia, Moshing: https://en.wikipedia.org/wiki/Moshing
- [K] Wikipedia, Widmanstätten pattern (the crosshatched crystal pattern on cut iron meteorites): https://en.wikipedia.org/wiki/Widmanst%C3%A4tten_pattern
- [K] Wikipedia, Spanish Fighting Bull: https://en.wikipedia.org/wiki/Spanish_Fighting_Bull

**b. Study notes**
- **Mosh pit [K]:**
  - Shoving, circle pits (a crowd running in a loop), and **headbanging** (long hair whipping).
  - Battle vests and studded belts.
- **Bouffalant [K]:** a huge afro on the head that absorbs headbutts. **Lesson:** our hair is **long and
  straight, whipping in headbang arcs**, not a ball afro.
- **Widmanstätten [K]:** etched iron-nickel meteorites show a **crosshatch of long crystal bands**. It
  is a gorgeous, unique texture for the "meteorite horn" lore.
- **Fighting bull [K]:** black, a massive neck hump (*morrillo*), forward-curved horns.

**c. Design direction**
- **Silhouette:**
  - A massive-necked black bull with a **huge shoulder hump** and short legs.
  - **A long straight mane of black hair** falls over its face from the poll. It **whips in headbang
    arcs**, a big outline shape when it moves.
  - **Two forward-curved meteorite horns** with an etched crosshatch pattern that glints.
  - **A studded leather band** around the neck hump, and a nose ring.
- **Face:** the eyes are hidden under the mane except **two red glints**. The nostrils flare with steam.
- **Accessory anchor:** on the hump, behind the horns.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#0e0a10` |
| Hide deep | `#24182a` |
| Hide base | `#3a2420` |
| Hide light | `#7a4a30` |
| Hide highlight | `#b07050` |
| Mane | `#1a1418` / sheen `#4a4050` |
| Meteorite horns | `#5a5a66` / `#8a8a96` with Widmanstätten lines `#c8d0dc` |
| Studs | `#d0dae4` |
| Leather | `#2a1a1a` |
| Nose ring | `#d8a03a` |
| Eyes | `#ff3a3a` |
| Geo VFX | `#d39a5c` dust |

- **Animations:**
  - **Idle:** **headbanging** in a 4-pose loop. The mane whips and hooves paw the ground.
  - **Attack "Wall of Death" charge:** it lowers its horns, a 3-pose dust build-up, then a straight
    charge. The impact makes a **circle-pit dust ring** that spins.
  - **Parry (Geo):** it plants its horns in the ground and a rock slab flips up.
  - **Hit:** it shakes it off with a mane whip.
- **64 px:**
  - About 48 px.
  - The silhouette of hump plus long hanging mane plus two pale horns.
  - The horns are the brightest pixels on a dark body.
- **Elemental Form idea (Geo, if final): "Meteor Pit".** The horns glow molten at the crosshatch lines,
  and **a ring of small orbiting meteor rocks** circles it (a circle pit made literal). The mane becomes
  dark rock strands with ember tips.

**d. Do / Don't**
- **Do:** use headbanging hair, the hump, meteorite crosshatch horns, the circle-pit dust ring and the
  studded band.
- **Don't:** give it an afro (Bouffalant) or three tails (Tauros). No real band patches.

### 10.3 Thrashark (Hydro, about 0.7 m tall / 1.6 m long, arch `swimmer`)

*v1 lore: "The punk leader's ace: a land shark that swims through the air a hand's width above the
asphalt. The buzzsaw on its back never stops spinning, even when it sleeps."*

**a. References**
- [K] Bulbapedia, Sharpedo (torpedo shark with jet propulsion) / Garchomp (land shark) / Carvanha: https://bulbapedia.bulbagarden.net/wiki/Sharpedo_(Pok%C3%A9mon)
- [K] Wikipedia, Otodus megalodon: https://en.wikipedia.org/wiki/Otodus_megalodon
- [K] Wikipedia, Circular saw: https://en.wikipedia.org/wiki/Circular_saw
- [K] Wikipedia, Thrash metal: https://en.wikipedia.org/wiki/Thrash_metal

**b. Study notes**
- **Sharks [K]:** a countershaded torpedo body (dark back, white belly), gill slits, a crescent tail, a
  big dorsal fin, and rows of serrated teeth.
- **Sharpedo [K]:** red and navy with a yellow star mark and jet-fins. **Lesson:** avoid the
  red-navy-plus-star scheme.
- **Garchomp [K]:** a land-shark dragon. **Lesson:** avoid hammer-claw arms. Ours **stays a fish that
  swims in air**.
- **Thrash [K]:** speed, aggression, downpicked riffs. The visual language is **sharp, jagged, fast
  diagonals**.

**c. Design direction**
- **Silhouette:**
  - A sleek shark that **hovers a hand's width above the ground**, with a thin water-film shadow beneath
    it.
  - **Its dorsal fin is a spinning circular saw blade** (chrome, toothed), always spinning (v1).
  - **Gill slits glow cyan** and leak water jets that propel it.
  - Pectoral fins are swept back like guitar headstocks *(jagged)*.
  - A ragged denim-blue patch scar on its flank.
- **Face:** small, mean eyes (yellow), a huge toothy grin, and a scar across the snout.
- **Accessory anchor:** in front of the saw blade on the head.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#0e1424` |
| Back deep | `#1f2a4a` |
| Back base | `#3a5a7a` |
| Back light | `#6a8aaa` |
| Belly | `#e8f0f4` / `#a8b8c8` |
| Saw | `#d0dae4` / `#5a6470`, teeth `#ffffff`, rust `#a04a2a` |
| Gills / jets | Hydro `#2fa8ff` / `#8ff0ff` |
| Eyes | `#ffe23a` |
| Mouth | `#5a1424` |
| Teeth | `#ffffff` |
| Denim scar | `#3a5a8a` |

- **Animations:**
  - **Idle:** an S-curve swim-hover in place (swimmer archetype tail chain). The saw spins with 4-pose
    rotation smear.
  - **Attack "Thrash Run":** a zig-zag dash with the saw dragging sparks along the ground, then a bite.
  - **Attack "Riptide Saw":** it **fires the saw blade** like a disc (Hydro precision aiming), and the
    blade returns.
  - **Hit:** it spins sideways, and the saw sparks.
- **64 px:**
  - A 56 px wide, 30 px tall sprite.
  - The chrome saw disc on top (10–12 px circle with tooth notches) is the read, plus the grin.
- **Elemental Form idea (Hydro, if final): "Tsunami Thrash".** It grows **three saw-fins** (dorsal plus
  two pectoral saws), and its body is wrapped in a **spinning water cyclone**. It moves fully in a
  water-sphere trail above the ground.

**d. Do / Don't**
- **Do:** use the circular-saw dorsal fin, the air-swimming hover, jagged thrash diagonals and
  countershading.
- **Don't:**
  - Use Sharpedo's red/navy and star.
  - Give it Garchomp arm-fins or dragon legs.
  - Draw a guitar as a body part (save that for the starters' band).

### 10.4 Marionoir (Ecto, "Master of Puppets", about 1.6 m, arch `floater`)

*v1 lore: "Team Metallica's admin pulls its strings, or so everyone thinks. Some say the crossbar floats on
its own, and the admin is the one dancing." (v1 data typed it Ecto/Ferro; the bible says **Ecto**.)*

**a. References**
- [K] Wikipedia, *Master of Puppets* (1986). The cover painting by Don Brautigam shows **a field of white
  grave-crosses** under a red sky, with **puppet strings running from a pair of hands** in the sky down to
  the crosses: https://en.wikipedia.org/wiki/Master_of_Puppets
- [K] Wikipedia, Don Brautigam: https://en.wikipedia.org/wiki/Don_Brautigam
- [K] Wikipedia, Bunraku. Osaka is the home of bunraku: three puppeteers per puppet, the black-clad
  **kurogo** assistants, and the **gabu** head that turns from a beautiful woman into a horned demon:
  https://en.wikipedia.org/wiki/Bunraku
- [K] Wikipedia, National Bunraku Theatre (Osaka, Nipponbashi): https://en.wikipedia.org/wiki/National_Bunraku_Theatre
- [K] Wikipedia, Marionette (the **control bar / crossbar** that holds the strings): https://en.wikipedia.org/wiki/Marionette
- [K] Bulbapedia, Banette (cursed plush doll with a zipper mouth) / Mimikyu: https://bulbapedia.bulbagarden.net/wiki/Banette_(Pok%C3%A9mon)

**b. Study notes**
- ***Master of Puppets* cover [K]:**
  - Rows of **white crosses** (some with dog tags/helmets) receding to the horizon.
  - A **blood-red/orange sky**.
  - **Hands** at the top holding **strings tied to the crosses**.
  - Approx: sky `#c8402a` → `#f08a3a`, crosses `#f2efe6`, ground `#3a2a2a`, strings `#e8e0d0`
    *(approx.)*.
- **The key transform:** a **marionette's control bar is itself a cross shape**. So the cover's crosses
  become **the crossbar floating above the puppet**, and the hands-and-strings become **ghost strings
  with no hands** (v1: "the crossbar floats on its own").
- **Bunraku [K], an Osaka treasure:**
  - Life-size puppets with carved, lacquered heads (**gabu** heads split open to reveal demon horns and
    fangs).
  - Puppeteers in black hoods (**kurogo**) are the "invisible" convention.
  - This is our original, local source for the *puppet's look*: a beautiful lacquered head that splits
    into a demon.
- **Banette [K]:** a cursed plush doll with a zipper mouth. **Lesson:** avoid plush and zipper. Ours is
  **lacquered wood and silk**.

**c. Design direction**
- **Silhouette:**
  - A tall, slender **bunraku-style puppet** floating with **slack legs dangling**.
  - Long silk sleeves.
  - Above its head, a **floating wooden crossbar** (the cross-shaped control) with **8 glowing ghost
    strings** to its wrists, knees, head and back.
- **Head:**
  - A white-lacquered puppet face with a calm, beautiful expression.
  - **On its "Gabu" attack it snaps into a demon face**: the jaw splits, gold eyes, horns spring up.
  - A hinge line is visible at the jaw.
- **Costume:**
  - A **noir kimono** (black with blood-red under-layers).
  - **Kurogo shadows** behind it: 2–3 faint black hooded silhouettes that flicker in and out like ghost
    puppeteers (Ecto trickery).
- **Accessory anchor:** on the head. The crossbar floats above any hat.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#0e0a14` |
| Face lacquer | `#f4efe6` / shadow `#c8b8c8` / highlight `#ffffff` |
| Gabu demon | gold eyes `#ffcf3a`, horn ivory `#f0e0c0`, mouth `#a0182a` |
| Kimono noir | `#1e1a2a` / `#3a3450` |
| Under-layers | `#a0182a` / `#d8402a` |
| Crossbar wood | `#6a4a3a` / `#a07a5a` |
| Strings | Ecto `#c9a8ff` → `#ff7af2` glow |
| Kurogo | `#0e0a14` at 60 % dither |
| Ecto VFX | `#8a5aff` |

- **Animations:**
  - **Idle:** **jerky, string-driven motion**. Limbs lift one at a time as if pulled, with a 1-pose
    snap. The crossbar sways, and the head tilts on a hinge.
  - **Attack "String Pull":** the strings lash out and **hook the target** (a confuse or control
    effect). The target is briefly puppeted.
  - **Attack "Gabu":** the face flips to the demon over 1 pose, then a lunge-bite.
  - **Hit:** strings go slack and the body crumples, then it is **yanked back up** by the crossbar
    (2 poses).
- **64 px:**
  - About 54 px.
  - The floating crossbar above the head plus the vertical glowing strings plus the white face on a
    black body. The cross-above-figure silhouette is unique in the roster.
- **Elemental Form idea (Ecto, it is the admin's ace, if final): "Master Form".**
  - **The crossbar grows into a giant floating cross-shaped control with ghost hands** at its ends.
  - More strings connect to **floating smaller puppets** (2 helper dolls).
  - The face is permanently half-demon, half-beautiful (split down the middle).

**d. Do / Don't**
- **Do:** use the crossbar as the cross, ghost strings, bunraku lacquer and gabu transformation, and
  kurogo phantoms. A red sky backdrop is fine in its cut-in.
- **Don't:**
  - Draw a graveyard field of crosses, military dog tags or helmets.
  - Draw the Brautigam hands.
  - Use the Metallica logo.
  - Use a plush doll or zipper mouth (Banette).

### 10.5 Sandmare (Ecto/Geo, "Enter Sandman", arch `quad`, about 1.6 m at the shoulder)

**a. References**
- [K] Wikipedia, "Enter Sandman" (Metallica, 1991). The video by Wayne Isham follows a boy's nightmares
  (falling, drowning, a truck, a snake) and an old man figure: https://en.wikipedia.org/wiki/Enter_Sandman
- [K] Wikipedia, *Metallica* (the "Black Album", 1991). A black cover with the logo and a **coiled snake**
  barely visible black-on-black: https://en.wikipedia.org/wiki/Metallica_(album)
- [K] Wikipedia, Sandman (folklore figure who sprinkles sand in children's eyes to bring dreams): https://en.wikipedia.org/wiki/Sandman
- [K] Wikipedia, Mare (folklore) (a spirit that rides on sleepers' chests; the root of "night-*mare*"): https://en.wikipedia.org/wiki/Mare_(folklore)
- [K] Wikipedia, *The Nightmare* (Henry Fuseli, 1781): an incubus on a sleeper's chest, **a horse's
  head with blank pale eyes** pushing through the curtains: https://en.wikipedia.org/wiki/The_Nightmare
- [K] Bulbapedia, Spectrier (ghost horse with a flowing blue mane), Rapidash (fire/psychic horse), Sandaconda (sand-sac snake), Darkrai (nightmares): https://bulbapedia.bulbagarden.net/wiki/Spectrier_(Pok%C3%A9mon) · https://bulbapedia.bulbagarden.net/wiki/Sandaconda_(Pok%C3%A9mon)

**b. Study notes**
- **"Enter Sandman" [K]:**
  - A lullaby turned dark. **Sleep → nightmare** is the whole idea.
  - The video's images are childhood dream-fears: falling, drowning, being chased.
- **Black Album [K]:** **black-on-black**, a subtle, menacing snake you notice late. **Lesson:**
  near-black shapes revealed by **rim light only**.
- **Fuseli [K]:**
  - The **mare**: a ghostly horse head with **blank white eyes**, emerging from darkness.
  - Theatrical chiaroscuro.
- **Sandman folklore [K]:** dream-sand sprinkled in the eyes. Sand = sleep.
- **Spectrier [K]:** a black ghost horse with a flowing glowing mane. **Lesson:** avoid the blue flowing
  hair-mane. Ours is **pouring sand like an hourglass**.
- **Sandaconda [K]:** a body that holds and spouts sand. **Lesson:** sand as a moving body material
  reads well.

**c. Design direction**
- **Silhouette:**
  - A gaunt night horse made of **dark compacted sand**.
  - **Mane and tail are streams of sand pouring upward and away**, like an hourglass inverted by the
    wind.
  - **The hooves are small hourglass bulbs** (glass with sand running) that leave sand prints.
  - **A ghostly hollow** in its chest shows a swirling dream-vortex (Ecto).
- **Signature details:**
  - **Blank, pupil-less pale eyes** (the Fuseli mare).
  - A **sand-snake** loosely coiled around its neck like a scarf, black on black. You only notice it
    when it moves, like the Black Album snake read, with no Gadsden reference.
- **Rendering:** **mostly rim-lit**. The body is near-black with violet rim light, and the sand
  highlights glint gold.
- **Accessory anchor:** on the forelock in front of the mane stream.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#0a0810` |
| Body deep | `#1e1828` |
| Body shadow | `#3a3048` |
| Body base | `#6a5a6a` |
| Rim | `#a090c8` |
| Dream-sand glints | `#d8b88a` / `#ffe8a0` |
| Eyes | `#e8f0ff` glow |
| Hourglass glass | `#c8e0ff` at 50 % |
| Chest vortex | Ecto `#8a5aff` → `#ff7af2` |
| Geo VFX | sand `#d39a5c` |

- **Animations:**
  - **Idle:** sand streams endlessly from the mane and tail, and hoof-glass trickles. It breathes slowly,
    and its head lolls (sleepy-menacing).
  - **Attack "Dreamsand":** it rears and flings a **sand cloud** that puts the target to sleep (Ecto
    curse, Geo material).
  - **Attack "Night Gallop":** it charges, leaving a sand trail that becomes a slowing field.
  - **Hit:** it **bursts into sand** and re-forms over 3 poses (an Ecto phase).
- **64 px:**
  - About 50 px.
  - Dark horse, but the read is the **gold sand streams** off the mane and tail plus **two blank white
    eyes**.
  - It must have a violet rim outline so it doesn't vanish on night maps.
- **Elemental Form idea (Ecto/Geo, if final): "Hourglass Nightmare".**
  - The chest hollow becomes a **giant hourglass** set into the ribcage, running both ways.
  - The mane is a full sandstorm halo.
  - Ghostly duplicate horse heads (Fuseli mare heads) loom behind it on attacks.

**d. Do / Don't**
- **Do:** use the sand mane like an hourglass, blank mare eyes, black-on-black rim light, the
  sleep-to-nightmare theme, and a hidden sand-snake.
- **Don't:**
  - Use the Black Album snake (Gadsden flag) or the logo.
  - Recreate Fuseli's composition (an incubus on a woman's chest).
  - Use the video's child-in-danger imagery.
  - Give it a flowing blue ghost hair-mane (Spectrier).

### 10.6 Ironmaw (Ferro, "Iron Man", arch `quad`, about 1.8 m)

**a. References**
- [K] Wikipedia, "Iron Man" (Black Sabbath song, 1970). The lyrics tell of a man who travels into the
  future, **is turned to steel in a magnetic field**, returns ignored, and takes revenge:
  https://en.wikipedia.org/wiki/Iron_Man_(Black_Sabbath_song)
- [K] Wikipedia, *Paranoid* (Black Sabbath, 1970). The cover by Keef shows a blurred, helmeted figure with
  a **shield and sword** (the album was meant to be titled *War Pigs*): https://en.wikipedia.org/wiki/Paranoid_(album)
- [K] Wikipedia, *The Iron Man* (Ted Hughes novel, 1968) and *The Iron Giant* (1999 film): https://en.wikipedia.org/wiki/The_Iron_Man_(novel) · https://en.wikipedia.org/wiki/The_Iron_Giant
- [K] Bulbapedia, Steelix / Aggron / Registeel / Duraludon / Copperajah: https://bulbapedia.bulbagarden.net/wiki/Aggron_(Pok%C3%A9mon) · https://bulbapedia.bulbagarden.net/wiki/Steelix_(Pok%C3%A9mon)
- [K] Wikipedia, Magnetic field (iron filings tracing field lines): https://en.wikipedia.org/wiki/Magnetic_field

**b. Study notes**
- **"Iron Man" [K]:**
  - A slow, crushing, heavy riff.
  - The story is a man **transformed into steel by magnetism**, then vengeful.
  - **What we take:** **magnetism made visible** and **slow inevitability**.
- ***Paranoid* cover [K]:** a motion-blurred warrior with a helmet, shield and sword. **Lesson:** motion
  blur and smear on its charge are fine. Avoid a humanoid warrior.
- **Iron Giant / Hughes [K]:** a gentle-scary iron colossus with a big jaw and riveted plates. **Lesson:**
  avoid the giant humanoid robot. Ours is a **beast**.
- **Aggron/Steelix [K]:** steel plate armour on a dinosaur or on a chain-snake. **Lesson:** don't use
  plate-on-dinosaur. Ours is **iron-filing fur on a magnetised beast**.
- **Iron filings [K]:** they stand up in **spiky arcs along field lines** between poles. Spectacular,
  physically grounded and unused in Pokémon.

**c. Design direction**
- **Silhouette:**
  - A heavy, low **steel beast**, a hyena/bear hybrid build: massive front, sloping back.
  - **An enormous maw**: a riveted steel jaw that opens like a **vise or steel trap**, with gear-tooth
    edges.
  - Its **fur is iron filings** that **bristle along curved magnetic field lines** between two **pole
    nodes** (glowing red **N** shoulder node and blue **S** hip node, as plain colour, with no
    lettering).
- **Story read:** a creature turned into iron. Rust blooms at the joints, and old scars are riveted
  shut.
- **Face:** tiny, deep-set eyes glowing pale cyan, almost hidden by the jaw. The heavy brow is a plate.
- **Accessory anchor:** on the brow plate.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#14161e` |
| Steel deep | `#2a3040` |
| Steel shadow | `#3a4258` |
| Steel base | `#8a96a6` |
| Steel light | `#d0dae4` |
| Steel glint | `#ffffff` |
| Filings | `#5a6470` / `#a8b4c0` |
| Rust | `#a0522d` / `#d07a3a` |
| Rivets | `#c8d0dc` |
| Maw interior | `#1a1420` with molten glow `#ff6a2b` |
| N node | `#e8402a` |
| S node | `#2f7aff` |
| Eyes | `#5ff4ff` |
| Ferro VFX | `#b8c4d0` |

- **Animations:**
  - **Idle:** a slow, heavy breath, and the **filings ripple along field lines** (a 6-pose wave). Its
    jaw grinds.
  - **Attack "Magnet Maw":** it **pulls the target in** magnetically (filings point at the target), then
    the jaw slams shut with a vise clamp (Ferro brutal grab).
  - **Attack "Iron Charge":** slow to start (3 heavy anticipation poses), then unstoppable, with motion
    smear (the *Paranoid* blur nod).
  - **Hit:** the filings scatter outward and are pulled back in.
- **64 px:**
  - About 46 px tall, 60 px wide.
  - The giant jaw (about 40 % of the sprite) plus spiky filing fur.
  - The red and blue pole nodes are the only colour.
- **Elemental Form idea (Ferro, if final): "Iron Revenant".** The filings rise into a **huge magnetic
  mane** of spikes along the field lines. Scrap metal orbits it, and the maw grows a second, inner jaw.
  The N and S nodes become small floating magnet poles with arcing lines.

**d. Do / Don't**
- **Do:** use iron-filing fur on field lines, the vise-trap maw, red and blue poles, rust and rivets,
  and slow-heavy timing.
- **Don't:**
  - Make a humanoid iron robot (Iron Giant, the Marvel character).
  - Use the *Paranoid* warrior, or Sabbath crosses or logos.
  - Make plate-armour dinosaurs (Aggron) or chain snakes (Steelix).

---------------------------------------------------------------------------------------------------

## 11. The Beatles (Elite Four) partners: Yellowsub, Blackbyrd, Lucydiamond

**Owner (bible §3, verbatim):**
> | The Beatles (Elite Four) partners | **Yellowsub** (Hydro/Ferro, "Yellow Submarine"), **Blackbyrd** (Aero, "Blackbird"), **Lucydiamond** (Astro/Cryo, "Lucy in the Sky with Diamonds") |

And §4: "**Elite Four: The Beatles.** *In-world they are a Beatles tribute band of master trainers…
styled after Sgt. Pepper / Abbey Road looks.*"

**Shared Elite-Four look:**
- These are master-trainer aces, so they get **the most polished palettes** in the roster.
- Each carries **one gold-braid accent** (`#ffd23f`), echoing Beatlet's Sgt. Pepper braid, so the
  Elite Four's team feels like one set.

### 11.1 Yellowsub (Hydro/Ferro, about 2.2 m long, arch `swimmer` with hover)

**a. References**
- [K] Wikipedia, *Yellow Submarine* (1968 animated film; directed by George Dunning; **art direction
  by Heinz Edelmann**; Pepperland, the Blue Meanies, the Sea of Holes, the Flying Glove):
  https://en.wikipedia.org/wiki/Yellow_Submarine_(film)
- [K] Wikipedia, Heinz Edelmann: https://en.wikipedia.org/wiki/Heinz_Edelmann
- [K] Wikipedia, "Yellow Submarine" (song, 1966, sung by Ringo): https://en.wikipedia.org/wiki/Yellow_Submarine_(song)
- [K] Wikipedia, Psychedelic art: https://en.wikipedia.org/wiki/Psychedelic_art
- [K] Bulbapedia, Remoraid / Octillery (cannon fish), Wailmer, Dhelmise (ship's-anchor ghost): https://bulbapedia.bulbagarden.net/wiki/Octillery_(Pok%C3%A9mon)

**b. Study notes**
- **Edelmann's *Yellow Submarine* style [K]:**
  - **Flat, unshaded colour shapes**.
  - **Art-nouveau curves mixed with pop-art and op-art**.
  - Collage-like surreal sequences.
  - Exaggerated, rubbery character proportions.
  - Psychedelic swirl and rainbow bands.
  - A **pastel-to-acid palette** with high-contrast black linework.
- **The submarine (knowledge):**
  - A chunky, toy-like yellow sub with **round portholes**, a periscope and a propeller.
  - Decorative trim and stacked funnels/vents.
  - Approx: yellow `#ffd21f`, shadow `#e08a1a`, trim red `#e83a2a`, porthole brass `#d8a03a`.
- **Pokémon [K]:**
  - Octillery is an octopus with a cannon mouth.
  - Dhelmise is a ghost-anchor made of ship parts.
  - **Lesson:** a **vehicle-as-creature** works when the vehicle parts become anatomy: portholes as
    eyes, the propeller as a tail.

**c. Design direction**
- **Silhouette:**
  - A **round, toy-like yellow submarine-whale**, half creature and half sub.
  - **Several round portholes along its side are eyes** (one big "main" eye at the front porthole and 2
    small blinking porthole-eyes behind it).
  - **A periscope is its antenna or "crest"** and looks around independently.
  - **A propeller tail** and two fin-rudders.
  - Rivets along the hull seams (Ferro).
  - It **hovers and swims through the air** above water as well (Hydro).
- **Psychedelic signature:**
  - **Flat, unshaded swirl decals** painted on the hull: 2–3 original art-nouveau swirl bands in pink,
    sky and mint, and a small flower-power motif.
  - Like Gradbear's belly, these are deliberately flat inside a cel-shaded body (the Edelmann flatness
    nod).
- **Face:** the main porthole eye has a big anime iris behind glass (a reflection highlight across the
  glass). The mouth is a happy little hatch under it.
- **Accessory anchor:** on top, beside the periscope.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#3a2010` |
| Hull deep | `#a0501a` |
| Hull shadow | `#e08a1a` |
| Hull base | `#ffd21f` |
| Hull light | `#fff27a` |
| Hull highlight | `#fffbe0` |
| Brass | `#d8a03a` / `#8a5a1a` |
| Rivets | Ferro `#b8c4d0` |
| Porthole glass | `#8ff0ff` / reflection `#ffffff` |
| Iris | `#2fa8ff` |
| Swirls (flat) | `#ff6fae`, `#6ab8ff`, `#7fe8b0`, `#8a5aff` |
| Braid accent | `#ffd23f` |
| Hydro VFX | `#2fa8ff` bubbles |

- **Animations:**
  - **Idle:** a gentle bob. The propeller spins on twos, the periscope swivels, and the porthole-eyes
    blink in sequence.
  - **Attack "Torpedo Tune":** the front hatch opens and a **bubble-torpedo** fires on an aimed arc
    (Hydro precision).
  - **Attack "Periscope Lock":** the periscope locks on and a targeting reticle forms of rings, then a
    triple shot.
  - **Hit:** the hull rings like a bell, rivets pop, and it re-seals.
- **64 px:**
  - A 60 px wide, 36 px tall sprite.
  - The yellow hull plus 3 porthole circles plus the periscope. Swirls are 2 px flat bands, two at most.
- **Elemental Form idea (Hydro/Ferro, if final): "Pepper Fleet".** The hull's swirls **animate and
  spill off** into a flat psychedelic aura. Two **mini-subs** dock and orbit as drones, and the
  propeller becomes a rainbow-band jet.

**d. Do / Don't**
- **Do:** use a toy sub as a creature, portholes as eyes, the periscope as a crest, flat Edelmann-like
  swirls, and pastel-acid colours.
- **Don't:**
  - Copy the film's submarine design or trim layout.
  - Use Blue Meanies, the Flying Glove or Pepperland characters.
  - Draw the Beatles' cartoon likenesses.

### 11.2 Blackbyrd (Aero, about 1.0 m, arch `flyer`)

**a. References**
- [K] Wikipedia, "Blackbird" (Beatles song, 1968, *The White Album*; McCartney, solo acoustic
  finger-picking; he has linked it to the US civil-rights struggle): https://en.wikipedia.org/wiki/Blackbird_(Beatles_song)
- [K] Wikipedia, *The Beatles* ("White Album", Richard Hamilton's plain white cover): https://en.wikipedia.org/wiki/The_Beatles_(album)
- [K] Wikipedia, Common blackbird (*Turdus merula*; male glossy black with an **orange-yellow bill and
  eye-ring**; sings at dusk and dawn): https://en.wikipedia.org/wiki/Common_blackbird
- [K] Bulbapedia, Murkrow / Honchkrow / Corviknight / Talonflame / Swellow: https://bulbapedia.bulbagarden.net/wiki/Corviknight_(Pok%C3%A9mon)

**b. Study notes**
- **Common blackbird [K]:**
  - Male **all glossy black**, with a **bright orange-yellow bill** and a **yellow eye-ring**.
  - A fluting, melodic song from rooftops at dusk.
  - Approx: plumage `#14141e`, bill `#ffb21f`, eye-ring `#ffc83a`.
- **"Blackbird" [K]:**
  - A delicate acoustic piece, accompanied by a **foot-tap** and a recorded blackbird.
  - Themes of **freedom, healing, learning to fly at night**.
  - **What we take:** **night flight**, **delicacy**, **monochrome on white** (the White Album) with one
    warm accent.
- **Corvid Pokémon [K]:**
  - Murkrow is a witch-hat crow; Corviknight is an armoured raven; Talonflame is a fire falcon.
  - **Lesson:** avoid hat-feathers (Murkrow) and plate armour (Corviknight). Ours is **a slender
    songbird**, elegant rather than menacing.

**c. Design direction**
- **Silhouette:**
  - A **sleek, slender songbird** with very long elegant wings.
  - **Six long primary feathers per wing, each with a fine bright line along its shaft**, like the six
    strings of an acoustic guitar. When it flaps, the "strings" catch moonlight.
  - A long tapering tail.
- **Signature:**
  - **Monochrome black with blue iridescence**, plus the **golden bill and eye-ring** as the only warm
    accent.
  - One **white feather** at its throat (the White Album nod).
- **Face:** a gentle, determined anime eye inside the gold ring, and a small open bill (a singing pose).
- **Accessory anchor:** on the crown, behind the eye-rings.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#08080e` |
| Plumage deep | `#0e0e16` |
| Plumage base | `#14141e` |
| Plumage light | `#2a2a3a` |
| Iridescent sheen | `#3a4a7a` / `#6a8aff` |
| String lines | `#e8f0ff` |
| Bill / eye-ring | `#ffb21f` / `#ffd86a` |
| Throat feather | `#ffffff` |
| Eye | `#2a1a10` with `#ffffff` |
| Aero VFX | `#a8f5c8` / `#ffffff` |
| Braid accent | a thin `#ffd23f` band on its leg |

- **Animations:**
  - **Idle:** perched, it **taps one foot on the beat** (the song's foot-tap nod) and sings with little
    note-less breath puffs. Wings shuffle.
  - **Attack "Night Glide":** a long silent glide (minimal flaps, Aero mobility) and a slicing pass, with
    a moonlit feather trail.
  - **Attack "String Gust":** it flares its wings and the **six string-feathers vibrate**, then a sharp
    wind-wave.
  - **Hit:** it drops 3 px, flutters, and recovers. Delicate, never clumsy.
- **64 px:**
  - About 40 px wide in flight.
  - A black silhouette with **the gold bill plus eye-ring** as the only warm pixels.
  - String lines are 1 px light lines on 2–3 primaries.
  - Needs a blue-violet rim outline on dark maps.
- **Elemental Form idea (Aero, if final): "Into the Light".**
  - The plumage turns to **pearl-white with black string lines** (inverted).
  - The wings grow long luminous streamer feathers.
  - **A dawn halo** forms behind the head, the night-to-dawn arc of the song made visual.

**d. Do / Don't**
- **Do:** be a real blackbird (gold bill and eye-ring), use string-shaft feathers, the foot-tap idle,
  and a monochrome-plus-one-accent palette.
- **Don't:**
  - Use a crow or raven silhouette (Murkrow/Corviknight).
  - Draw a guitar on the bird.
  - Show lyrics. Never use civil-rights imagery as decoration.

### 11.3 Lucydiamond (Astro/Cryo, about 1.2 m, arch `floater`)

**a. References**
- [K] Wikipedia, "Lucy in the Sky with Diamonds" (1967, *Sgt. Pepper*). It was inspired by Julian
  Lennon's nursery-school drawing of his classmate Lucy O'Donnell, and its dream imagery is
  Lewis-Carroll-like: https://en.wikipedia.org/wiki/Lucy_in_the_Sky_with_Diamonds
- [K] Wikipedia, Lucy (Australopithecus) (the 1974 fossil, named after the song): https://en.wikipedia.org/wiki/Lucy_(Australopithecus)
- [K] Wikipedia, Kaleidoscope: https://en.wikipedia.org/wiki/Kaleidoscope
- [K] Wikipedia, Diamond cut (brilliant cut: table, crown, pavilion, 57–58 facets): https://en.wikipedia.org/wiki/Diamond_cut
- [K] Bulbapedia, Diancie / Carbink / Minior / Cryogonal / Clefairy: https://bulbapedia.bulbagarden.net/wiki/Diancie_(Pok%C3%A9mon) · https://bulbapedia.bulbagarden.net/wiki/Cryogonal_(Pok%C3%A9mon)

**b. Study notes**
- **The song [K]:**
  - A **child's drawing of a girl in the sky with diamond-stars**.
  - Surreal **sky colours in citrus/marmalade tones**.
  - **Kaleidoscopic** visual imagery, and a dreamy boat-and-river journey.
  - **What we take:**
    - the child's-drawing star shapes (crayon-like 5-point stars)
    - a sunset/citrus-to-blue sky gradient
    - kaleidoscope eyes as **faceted, rotating irises** (a visual idea, not lyric text)
- **Diamond brilliant cut [K]:** an octagonal-ish top **table**, a sloped **crown**, and a deep pointed
  **pavilion**. It reads as "diamond" in 2D as an **upside-down kite or pentagon with facet lines**.
- **Diancie [K]:** a pink jewel princess with a big diamond. **Lesson:** avoid "princess plus big gem
  bust". Ours is **a floating sky creature made of a diamond**, not a human girl.
- **Cryogonal [K]:** a snowflake-crystal face. **Lesson:** avoid a snowflake-shaped body.
- **Clefairy [K]:** moon-fairy charm. A tone reference for "cute cosmic".

**c. Design direction**
- **Silhouette:**
  - **A brilliant-cut diamond body (point down)**, floating.
  - **A flowing sky-gradient veil or cape** hangs from the diamond's girdle like a skirt of evening sky
    (citrus orange at the top to deep blue at the hem, with stars).
  - Two small crystal "arms" and a pair of long ribbon-like crystal antennae with **crayon-style star
    tips**.
- **Kaleidoscope eyes:** two large eyes whose **irises are faceted rosettes** (6-segment) that **slowly
  rotate** like a kaleidoscope. This is the creature's signature.
- **Child's drawing touch:** **3–5 wobbly crayon-outlined stars** orbit it. They have a hand-drawn
  jitter outline (boil animation) as the only "naive" line in the roster, a nod to Julian's drawing.
- **Accessory anchor:** on the table (flat top) of the diamond.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#2a2a6e` |
| Diamond facets | `#6a8aff` / `#9fefff` / `#e8fbff` / `#ffffff` with prism flecks `#ff8af2`, `#ffe23a` |
| Sky veil | tangerine `#ff9a3a` → marmalade `#ffb84a` → rose `#ff6fae` → violet `#8a5aff` → deep `#2a2a6e` |
| Crayon stars | `#ffe23a` with an `#ff9a3a` outline |
| Eye facets | `#5ff4ff` / `#ff8af2` / `#ffe23a` |
| Astro VFX | `#ffd98a` / `#6a8aff` |
| Cryo VFX | `#9fefff` |
| Braid accent | `#ffd23f` girdle band |

- **Animations:**
  - **Idle:** a slow float and spin of the diamond (4 facet-light poses). The veil ripples, and the
    stars orbit with a crayon boil.
  - **Attack "Diamond Sky":** it raises its arms and a **rain of small diamond shards** falls from above
    (Astro plus Cryo freeze).
  - **Attack "Kaleidoscope Gaze":** the eyes spin fast and the target is confused by prism fragments.
  - **Hit:** the facets crack-flash white, and a star drops and re-orbits.
- **64 px:**
  - About 52 px.
  - The inverted diamond plus the sky-gradient veil (4 bands of 3 px).
  - Kaleidoscope irises need 6 px eyes with 3 colours.
- **Elemental Form idea (Astro/Cryo, if final): "Sky of Diamonds".**
  - The veil expands into a **full night-sky mantle** with moving constellations.
  - The diamond splits into **three orbiting diamond segments** around a light core.
  - The crayon stars become real light-stars.

**d. Do / Don't**
- **Do:** use a diamond body, a citrus-to-violet sky veil, rotating kaleidoscope irises, and naive
  crayon stars.
- **Don't:**
  - Draw a human girl (Lucy) or a likeness of Julian's drawing.
  - Use drug-reference imagery or the "LSD" letters.
  - Make a jewel princess (Diancie) or a snowflake body (Cryogonal).
  - Write lyric phrases on it.

---------------------------------------------------------------------------------------------------

## 12. Queen (Champions) partners: Killerqueen, Bohemoth, Dontstopmeow, Radiogaga, Bitesdust

**Owner (bible §3, verbatim):**
> | Queen (Champions) partners | **Killerqueen** (Ecto/Bio queen bee, "Killer Queen"), **Bohemoth** (Echo/Ecto, "Bohemian Rhapsody"), **Dontstopmeow** (Volto speed cat, "Don't Stop Me Now"), **Radiogaga** (Echo/Volto radio robot, "Radio Ga Ga"), **Bitesdust** (Geo, "Another One Bites the Dust") |

And §4: "**Champions: Queen.** *A Queen tribute supergroup with the stage names Freddie, Brian, Roger and
John.*"

**Shared Champions look:**
- These are the final, flashiest team.
- Each has a **regal stage accent**: crown-gold `#ffcf3a` plus royal violet `#5a2a8a`.
- Each has a **"stage-light" rim light** in its cut-in.
- Never use the Queen crest or logo.

**Shared Queen references**
- [K] Wikipedia, *News of the World* (1977). The cover by **Frank Kelly Freas** adapts his 1953
  *Astounding Science Fiction* cover: **a giant, sad-eyed metal robot** holding the band's fallen bodies,
  reaching through a roof: https://en.wikipedia.org/wiki/News_of_the_World_(album)
- [K] Wikipedia, Frank Kelly Freas: https://en.wikipedia.org/wiki/Frank_Kelly_Freas
- [K] Wikipedia, Mick Rock (*Queen II* cover photo: four faces lit from above in a diamond on black): https://en.wikipedia.org/wiki/Mick_Rock
- [K] Wikipedia, *Queen II* (1974): https://en.wikipedia.org/wiki/Queen_II

**News of the World robot study [K].** The task asked for this specifically.
- A **huge grey-silver robot** with a **round dome head**, **big round, sad, glowing eyes**, and
  a simple vertical-slat mouth.
- Long tube-jointed fingers. Painted in a 1950s pulp-SF airbrush style with red blood accents.
- Approx: metal `#9aa4b0` / `#5a6470`, eye glow `#e8f0ff`, background sky `#3a2a4a` *(approx.)*.
- **What we take, for Radiogaga only:** **"sad, gentle giant robot eyes"**, meaning a melancholy face on
  a machine, plus pulp-SF chrome.
- **Never use:** the bodies, the blood, or the hand-through-roof composition.

### 12.1 Killerqueen (Ecto/Bio queen bee, about 1.7 m, arch `flyer` / upright `insect`)

**a. References**
- [K] Wikipedia, "Killer Queen" (1974, *Sheer Heart Attack*; a sophisticated, high-class femme-fatale
  character; the lyrics name-drop champagne and Marie Antoinette): https://en.wikipedia.org/wiki/Killer_Queen
- [K] Wikipedia, *Sheer Heart Attack*: https://en.wikipedia.org/wiki/Sheer_Heart_Attack
- [K] Wikipedia, Marie Antoinette (rococo fashion: towering **pouf** hairstyles, **panniers** widening
  skirts, pastel silks, ribbons): https://en.wikipedia.org/wiki/Marie_Antoinette
- [K] Wikipedia, Queen bee (larger abdomen, smooth stinger reusable, royal jelly): https://en.wikipedia.org/wiki/Queen_bee
- [K] Bulbapedia, Vespiquen (its honeycomb abdomen is a skirt and a hive) / Combee: https://bulbapedia.bulbagarden.net/wiki/Vespiquen_(Pok%C3%A9mon)

**b. Study notes**
- **"Killer Queen" [K]:**
  - Elegance with danger: a refined lady who is lethal.
  - The 1974 era look: glam, **black nail polish**, feather boas, satin, the Mick Rock photographs.
  - **What we take:**
    - a **rococo grande-dame silhouette**
    - **black-lacquered claw tips**
    - a **feather-boa collar** (as bee fuzz)
    - **champagne-bubble** VFX as Bio sleep or poison (a visual nod, no text)
- **Marie Antoinette [K]:** the pouf hairstyle (tall, decorated with ornaments) and side-panniered
  gowns. Translate them into **a royal-jelly pouf crest** and **pannier wings or hips**.
- **Queen bee [K]:** a longer abdomen than workers, a smooth curved stinger that can sting repeatedly,
  attended by workers.
- **Vespiquen [K]:** the abdomen as a honeycomb skirt-hive with grubs. **Lesson:** don't use a
  honeycomb-skirt hive. Ours puts the panniers **at the hips as translucent ghost-wings**, and the
  abdomen is a **striped satin gown**.

**c. Design direction**
- **Silhouette:**
  - A tall, slender upright queen bee.
  - A **towering "pouf" crest** of gold royal-jelly fluff with a tiny crown-pin.
  - A **fuzzy feather-boa collar** (white-violet fuzz).
  - A narrow waist, then **a wide striped gown abdomen with pannier flares** at the hips.
  - **Four translucent Ecto wings** with ghostly eye-spots, held like a fan behind her.
  - **A slender stinger like a jewelled hatpin** at the abdomen tip.
  - Four arms: two hold a **lace fan**, two rest elegantly.
- **Face:** half-lidded, lashed, confident eyes (gold iris) and a sly smile. **Black-lacquered claw
  tips.**
- **Accessory anchor:** the crown-pin on the pouf (the trainer's hat replaces the pin).
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#1a0e1e` |
| Gown black | `#1a1420` / `#3a2a40` |
| Gown gold stripes | `#ffcf3a` / `#c8902a` / `#fff0b0` |
| Body fuzz | `#f6efe0` / `#c9b8ff` |
| Pouf | `#ffe08a` / `#e8a83a` |
| Wings | Ecto `#8a5aff` at 50 % → edge `#ff7af2`, eye-spots `#ff7af2` |
| Stinger | `#d0dae4` with a `#ff3a8a` jewel |
| Lace fan | `#f4ecf8` |
| Claws | `#14121c` gloss |
| Royal violet | `#5a2a8a` |
| Bio VFX (champagne bubbles) | `#ffe8b0` / `#e8ffd0` |

- **Animations:**
  - **Idle:** a languid fan flutter, and wings hum (a 2-pose buzz). The pouf bounces slightly, and she
    inspects her claws.
  - **Attack "Champagne Sting":** a lunge with the hatpin stinger (poison), with fizzing bubbles on hit.
  - **Attack "Royal Court":** she summons **2 ghost-worker bees** that dart at the target (Ecto
    trickery plus Bio).
  - **Support:** bubbles that lull foes to sleep (Bio sleep).
  - **Hit:** a gasp pose behind the fan, then she composes herself.
- **64 px:**
  - About 56 px.
  - The tall pouf plus the wide striped gown (black and gold bands of 2 px) plus violet wings.
  - The stinger glint is the last read.
- **Elemental Form idea (Ecto/Bio, if final): "Dynamite Monarch"** (a nod to the song's "explosive
  lady"). The gown becomes **ghost-silk trailing to the floor**, and a full crown of six golden spikes
  replaces the pouf-pin. A swarm-halo of spectral bees orbits her, and the champagne bubbles turn into
  floating gold explosions.

**d. Do / Don't**
- **Do:** use the rococo pouf and panniers, the striped satin gown, the hatpin stinger, black-lacquer
  claws, champagne bubbles and ghost-worker bees.
- **Don't:**
  - Copy Vespiquen's honeycomb skirt with grubs.
  - Use Freddie Mercury's likeness.
  - Put the Queen crest or champagne-brand labels on it.
  - Copy Marie Antoinette portraits.

### 12.2 Bohemoth (Echo/Ecto, about 2.4 m, arch `floater`)

**a. References**
- [K] Wikipedia, "Bohemian Rhapsody" (1975). It has an operatic middle section, and its promo video
  (Bruce Gowers) **recreated the *Queen II* cover: four heads in a diamond formation, lit from above on
  black**, with **multiplying, echoing face effects**: https://en.wikipedia.org/wiki/Bohemian_Rhapsody
- [K] Wikipedia, *Queen II* (Mick Rock's four-faces cover): https://en.wikipedia.org/wiki/Queen_II
- [K] Wikipedia, Behemoth (the biblical colossal beast; the name source): https://en.wikipedia.org/wiki/Behemoth
- [K] Wikipedia, Commedia dell'arte masks / Scaramouche (a stock clown character): https://en.wikipedia.org/wiki/Scaramouche
- [K] Bulbapedia, Hydreigon (three heads), Dugtrio, Magneton (multi-unit), Meloetta (Aria form, opera): https://bulbapedia.bulbagarden.net/wiki/Hydreigon_(Pok%C3%A9mon)

**b. Study notes**
- **The video and the *Queen II* image [K]:**
  - **Four faces arranged in a diamond** (top, left, right, bottom).
  - **Hard top-light chiaroscuro on pure black**.
  - **Video feedback multiplying faces**: echo trails of the same face receding.
  - **What we take:**
    - **four floating heads in a diamond**
    - **top-lit chiaroscuro**
    - **echo after-images**
    - **opera** (bass, baritone, tenor, falsetto as four voices)
- **Scaramouche [K]:** a commedia character, black-masked. The song's playful operatic cast suggests
  using **theatre masks** for the heads rather than human faces, which avoids likeness.
- **Hydreigon / Dugtrio [K]:** multi-headed reads. **Lesson:** keep the heads **separate and floating**
  (no necks) so the silhouette is unique. A "behemoth" mass in the middle anchors it.

**c. Design direction**
- **Silhouette:**
  - A **dark, cloaked void-body** (a heavy behemoth mantle that drapes to the ground like a stage
    curtain).
  - **Four floating porcelain opera-mask heads** in a **diamond formation** around and above it: top,
    left, right, bottom-front.
  - **Each head is a different voice:**
    - **top** = falsetto: a tiny, high, serene mask with arched brows
    - **left** = tenor: a heroic mask with an open mouth
    - **right** = baritone: a smirking mask
    - **bottom** = bass: a heavy jowled mask with a deep-open mouth
  - The masks are **original**, not band faces.
  - Two huge cloaked arms emerge from the curtain-body.
- **Lighting signature:** **always top-lit**. Masks are bright on their brows and fall into black below
  the cheekbones. Bake this into the masks' cel bands even in neutral light.
- **Accessory anchor:** the top (falsetto) head.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#06050a` |
| Void body | `#0e0c16` / `#1e1a2a` |
| Curtain fold light | `#3a2a4a` |
| Curtain lining | theatre red `#c0182a` / `#6a0e1a` |
| Mask porcelain | `#f4ece0` / `#c8b8a8` / shadow `#6a5a8a` / black fall-off `#1e1a2a` |
| Mask gilding | `#ffcf3a` |
| Echo VFX | `#b26bff` / `#5ff4ff` |
| Ecto VFX | `#8a5aff` / `#ff7af2` |
| Royal violet | `#5a2a8a` |

- **Animations:**
  - **Idle:** the four heads orbit the diamond very slowly, and each **sings in turn** (mouth open
    1 pose, a little Echo ring). The curtain-body breathes.
  - **Attack "Rhapsody":** an **operatic multi-phase attack**:
    1. a ballad pulse from the bass head
    2. a rapid "call and response" volley between the left and right heads, with **echo after-image
       trails of each mask** (3 receding copies, dithered)
    3. a rock blast where all four sing together for a huge Echo shockwave
  - It must sync to the music's beat (bible §6).
  - **Hit:** the masks scatter outward and **reassemble into the diamond**.
- **64 px:**
  - About 60 px.
  - The four bright masks in a diamond on a black mass is a unique silhouette.
  - Each mask is about 10 px with a strong top-light band.
  - The red curtain lining shows as a 2 px edge.
- **Elemental Form idea (Echo/Ecto, if final): "Galileo Form".** The four masks **multiply into a
  ring of echoes** (8 after-image masks orbiting), the curtain-body opens to reveal a **starry
  stage-void**, and a spotlight beam shines down from above, fixed.

**d. Do / Don't**
- **Do:** use four floating masks in a diamond, top-light chiaroscuro, echo after-image trails, a
  behemoth curtain-body, and four vocal registers.
- **Don't:**
  - Use the band's faces or the *Queen II* photo composition with real people.
  - Write lyric words ("Galileo", "Bismillah" and so on) as text. A form *name* nod must be owner-approved.
  - Use Hydreigon-like necked heads.

### 12.3 Dontstopmeow (Volto speed cat, about 1.0 m, arch `quad`)

**a. References**
- [K] Wikipedia, "Don't Stop Me Now" (1978, *Jazz*; an exuberant, accelerating piano-rock song about
  unstoppable joy and speed): https://en.wikipedia.org/wiki/Don%27t_Stop_Me_Now
- [K] Wikipedia, *Jazz* (Queen album, 1978). The cover is **black-and-white concentric circles** (an
  op-art spiral): https://en.wikipedia.org/wiki/Jazz_(Queen_album)
- [K] Wikipedia, Cheetah (the fastest land animal; tear marks; a long tail rudder): https://en.wikipedia.org/wiki/Cheetah
- [K] Bulbapedia, Raikou / Luxray / Zeraora / Liepard: https://bulbapedia.bulbagarden.net/wiki/Zeraora_(Pok%C3%A9mon) · https://bulbapedia.bulbagarden.net/wiki/Raikou_(Pok%C3%A9mon)
- [K] Wikipedia, Sonic the Hedgehog (character) (the speed-icon pose and shape language): https://en.wikipedia.org/wiki/Sonic_the_Hedgehog_(character)

**b. Study notes**
- **The song [K]:**
  - A slow intro, then **acceleration to joyful full speed**.
  - The theme is being unstoppable and "having a good time".
  - **What we take:** **acceleration** as the animation arc (it gets faster the longer it runs) and a
    **joyful grin** (speed with a smile, not aggression).
- ***Jazz* cover [K]:** **concentric black and white rings**. **What we take:** a **concentric ring
  marking** on its flank, like an op-art target.
- **Cheetah [K]:**
  - A tiny head, a deep chest, a thin waist, long legs, a long tail.
  - Black **tear marks** from eye to mouth.
  - Semi-retractable claws for grip.
  - **The speed silhouette.**
- **Electric cats [K]:**
  - Raikou: a cloud-mane tiger.
  - Luxray: a blue-black lynx with a star tail.
  - Zeraora: a biped with lightning stripes.
  - **Lesson:** avoid blue-black-plus-yellow lynx (Luxray) and avoid bipeds.

**c. Design direction**
- **Silhouette:**
  - A **lean cheetah-proportioned house cat**: small head, big ears, deep chest, long legs.
  - A **very long tail that ends in a comet tuft**.
  - At full speed, the body stretches into a long low line, and the ears flatten into a streamlined
    point.
- **Markings:**
  - **Concentric ring markings** on both flanks (2–3 white rings on black fur, the *Jazz* nod).
  - **Lightning tear marks** under the eyes (the cheetah tear-line as a bolt).
  - **Whiskers that crackle** with current.
- **Colour logic:** **jet black + white rings + Volto yellow electricity**. This is a stark 3-value read
  that's unmistakable.
- **Face:** a huge happy grin with a fang, and bright cyan eyes with star highlights. It always looks
  like it's having a great time.
- **Accessory anchor:** between the ears (it must stay on at speed, so add a little cartoon hold-pose).
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#06060c` |
| Fur deep | `#14121c` |
| Fur base | `#24202e` |
| Fur light | `#3a364a` |
| Fur sheen | `#6a6680` |
| Rings | `#f4f2ee` / shadow `#a8a6b8` |
| Tear bolts | Volto `#ffe23a` |
| Comet tuft | `#ffe23a` → `#ffffff` |
| Eyes | `#5ff4ff` |
| Nose | `#ff8fa8` |
| Volto VFX | `#ffe23a` / `#ffffff` |
| Crown-gold accent | collar tag `#ffcf3a` |

- **Animations:**
  - **Idle:** an impatient bounce on its toes, tail swishing; it **can't stand still** (a 6-pose loop
    with a little hop).
  - **Run cycle that accelerates:** 8 poses at normal speed, then 6, then a 4-pose blur with afterimages
    (Volto speed). The comet tail trail lengthens.
  - **Attack "Shooting Star":** a **lightning dash** through the target in a straight line, leaving a
    bolt trail and a sonic pop.
  - **Attack "Mr. Fahrenheit" (name only if owner-approved):** a spin that throws spark rings.
  - **Hit:** it tumbles but **lands running**. It never stops (a 2-pose recovery into the run).
- **64 px:**
  - About 36 px tall, 56 px long.
  - Black body with **two white ring targets** (6–8 px each).
  - The yellow comet tail plus tear bolts are the only colour. A strong read.
- **Elemental Form idea (Volto, if final): "Don't Stop Form".** The rings on its flanks become **spinning
  lightning rings** that float off the body like speed-gears. Its fur gains white-hot edges, and it leaves
  a permanent lightning afterimage of itself one step behind.

**d. Do / Don't**
- **Do:** use cheetah proportions, *Jazz* rings as markings, bolt tear-lines, a comet tail, acceleration
  timing and a joyful grin.
- **Don't:**
  - Use Luxray's blue-black/yellow lynx scheme or Zeraora's biped stripes.
  - Copy Sonic's spines or shoes.
  - Show lyrics. A skill name using a lyric phrase needs owner sign-off; the bible allows renaming, but
    the default should be original.

### 12.4 Radiogaga (Echo/Volto radio robot, about 1.6 m, arch `biped`)

**a. References**
- [K] Wikipedia, "Radio Ga Ga" (1984, *The Works*; written by Roger Taylor). Its video by David Mallet
  uses **footage from Fritz Lang's *Metropolis***, and the crowd's **synchronised double-clap with arms
  raised** became iconic (and was huge at Live Aid 1985): https://en.wikipedia.org/wiki/Radio_Ga_Ga
- [K] Wikipedia, *Metropolis* (1927 film; Art Deco megacity): https://en.wikipedia.org/wiki/Metropolis_(1927_film)
- [K] Wikipedia, Maria (Metropolis) (the **Maschinenmensch**, the Art Deco female robot sculpted by
  Walter Schulze-Mittendorff): https://en.wikipedia.org/wiki/Maria_(Metropolis)
- [K] Wikipedia, Antique radio (1930s **cathedral/tombstone radios**: arched wooden cabinets, cloth
  speaker grilles, round tuning dials): https://en.wikipedia.org/wiki/Antique_radio
- [K] Wikipedia, Art Deco (sunbursts, stepped forms, chevrons, chrome): https://en.wikipedia.org/wiki/Art_Deco
- [K] *News of the World* robot (see the Queen shared notes above).
- [K] Bulbapedia, Rotom (appliance ghost), Magnezone, Klinklang: https://bulbapedia.bulbagarden.net/wiki/Rotom_(Pok%C3%A9mon)

**b. Study notes**
- **"Radio Ga Ga" [K]:**
  - **Nostalgia for radio** in the age of video.
  - The video mixes **Metropolis' Art Deco city, gears and the robot Maria** with a 1940s family
    listening to the radio, plus the **double-clap crowd**.
  - **What we take:**
    - **Art Deco** shape language
    - **a vintage radio as the body**
    - **the double-clap emote** (*it fits Echo rhythm perfectly*)
- **Cathedral radio [K]:**
  - A gothic-arched walnut cabinet and a **fabric grille behind wooden fretwork**.
  - A **round glowing tuning dial**, two knobs.
  - **Lesson:** it is a perfect robot head or torso. The grille is the mouth, and the dial is the eye.
- **Maschinenmensch [K]:**
  - A sleek, female, Art Deco metal body with **concentric ring details** on the head.
  - **Lesson:** avoid the female android likeness (iconic and protected). Use only **Deco ring and
    chevron detailing**.
- ***News of the World* robot [K]:** **gentle sad round eyes** on a giant machine. Radiogaga's dial-eye
  can droop sadly when the music stops *(proposal)*.
- **Rotom [K]:** an appliance possession. **Lesson:** ours is a built robot, not a plasma ghost.

**c. Design direction**
- **Silhouette:**
  - An upright robot whose **head is a cathedral-arch radio cabinet** (walnut).
  - The **fretwork grille is the mouth** and glows with sound when it "speaks".
  - **One big round tuning-dial eye** (with a needle that swings, its "pupil") and a smaller knob eye.
  - **A telescopic antenna** on top, the outline breaker.
  - A **chrome Art Deco body**: stepped shoulders, a chevron chest plate with a **sunburst motif**,
    segmented ring limbs, and big white-gloved-like chrome hands *for the clap*.
- **Face read:** the dial needle moves to show emotion: happy is right, sad is left (the NotW sad-robot
  nod).
- **Accessory anchor:** around the antenna base on the cabinet top.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#1a1014` |
| Walnut deep | `#3a1e14` |
| Walnut base | `#6a3a24` |
| Walnut light | `#a0603a` |
| Walnut highlight | `#d8985a` |
| Grille cloth | `#e8d8b0` / `#a89870` |
| Fretwork | `#4a2a1a` |
| Chrome | `#d0dae4` / `#8a96a6` / `#5a6470` / glint `#ffffff` |
| Brass trim | `#d8a03a` |
| Dial glow | `#ffe8a0` / needle `#d8283a` |
| Echo VFX | `#b26bff` / `#5ff4ff` |
| Volto VFX | `#ffe23a` |
| Crown-gold accent | `#ffcf3a` |

- **Animations:**
  - **Idle:** the antenna extends and retracts, and the dial needle drifts as if **scanning stations**.
    The grille pulses softly.
  - **Signature emote "Double Clap":** arms up over its head, **clap-clap on the beat**. It can buff
    allies' rhythm *(Echo)*. This is a straight lift of the crowd *action*, which is a gesture, not a
    copyrighted image.
  - **Attack "Broadcast":** the antenna sparks (Volto) and **radio-wave rings** blast from the grille
    (Echo), sweeping like a radar.
  - **Attack "Static":** a burst of static noise (pixel snow) that confuses.
  - **Hit:** a static flash with the dial spinning, then it re-tunes.
- **64 px:**
  - About 52 px.
  - The arched brown radio head on a chrome body, a **round yellow dial eye**, and the antenna.
- **Elemental Form idea (Echo/Volto, if final): "Metropolis Broadcast".**
  - The body grows **Art Deco skyscraper-stepped shoulders and a sunburst halo** of radio towers.
  - The antenna becomes a **broadcast tower crown** with orbiting signal rings.
  - The grille glows full white-gold.

**d. Do / Don't**
- **Do:** use a cathedral radio head, Art Deco chrome, a tuning-dial eye with an emotional needle, the
  double-clap emote, and radio-wave rings.
- **Don't:**
  - Copy the Maschinenmensch (Maria) design or the *Metropolis* poster.
  - Use the NotW robot composition.
  - Use radio brand logos or any Queen imagery.

### 12.5 Bitesdust (Geo, about 1.3 m long, arch `serpent` / low `quad`)

**a. References**
- [K] Wikipedia, "Another One Bites the Dust" (1980, *The Game*; written by John Deacon; built on a
  famous, repetitive **bassline**, funk/disco-influenced): https://en.wikipedia.org/wiki/Another_One_Bites_the_Dust
- [K] Wikipedia, *The Game* (Queen album): https://en.wikipedia.org/wiki/The_Game_(Queen_album)
- [K] Wikipedia, Bass guitar (four strings E-A-D-G; plucking and slapping): https://en.wikipedia.org/wiki/Bass_guitar
- [K] Wikipedia, Dust devil: https://en.wikipedia.org/wiki/Dust_devil
- [K] Wikipedia, Loudspeaker (woofer cone, dust cap, surround): https://en.wikipedia.org/wiki/Loudspeaker
- [K] Bulbapedia, Sandaconda / Silicobra, Hippowdon, Dugtrio: https://bulbapedia.bulbagarden.net/wiki/Silicobra_(Pok%C3%A9mon) · https://bulbapedia.bulbagarden.net/wiki/Hippowdon_(Pok%C3%A9mon)

**b. Study notes**
- **The song [K]:**
  - **A walking, repetitive, bouncing bassline** is the whole identity.
  - A dry, minimal funk groove, and "dust" means defeat.
  - **What we take:**
    - **bass strings** as anatomy
    - **thumping pulse rhythm** (each bass note kicks up dust)
    - a cool, laid-back swagger
- **Woofer [K]:**
  - A **cone with a rubber surround and a centre dust-cap** that pumps with bass.
  - It literally moves air and dust.
  - **Lesson:** a **speaker-cone mouth or chest** that **puffs dust rings** on each beat.
- **Dust devil [K]:** a spinning dust column. **Lesson:** the special attack shape.
- **Sand serpents [K]:** Silicobra/Sandaconda have a sand-filled neck sac, and Hippowdon is a sand hippo.
  **Lesson:** avoid the sand-sac snake read. Ours is a **low groovy creature with string-backed armour**.

**c. Design direction**
- **Silhouette:**
  - A **low, long, armadillo-meets-sand-lizard** made of **packed dust and sandstone plates**.
  - **Four taut metal strings** run from its snout to its tail tip along its back, stretched over the
    plates like a bass neck. The plates act as frets.
  - Its **chest/throat is a woofer cone** that thumps.
  - A long tail that ends in a **tuning-peg-like knob** (four little pegs) *(it is a bass neck)*.
  - Short, sturdy legs.
- **Attitude:** **cool and laid-back**. Half-lidded eyes, a sly smile, and it **bobs its head on the
  beat**. *(The John Deacon cool-bassist energy, with no likeness.)*
- **Accessory anchor:** on its head plate (a pair of shades would be perfect for this one).
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#2a1a1e` |
| Dust deep | `#5a3a3a` |
| Dust shadow | `#7a5a5a` |
| Dust base | `#c8a87a` |
| Dust light | `#f0d8b0` |
| Dust highlight | `#fff2d8` |
| Sandstone plates | `#a87a5a` / `#d8a87a` |
| Strings | `#d0dae4` / `#ffffff` glint |
| Woofer cone | `#2a2a36` / `#4a4a5a` |
| Dust cap | `#1a1420` |
| Surround | `#3a3a46` |
| Eyes | `#ffcf3a` |
| Geo VFX | `#d39a5c` / `#f0d0a0` dust rings |
| Crown-gold | peg tips `#ffcf3a` |

- **Animations:**
  - **Idle:** a **head-bob groove** on the beat. Each bob makes the woofer pump and puff **a small dust
    ring**, and one string vibrates (2-pose wiggle).
  - **Attack "Bassline Quake" (Geo):** it plucks its own back-strings with its tail (a 4-note walking
    pattern). Each note sends a **ground shockwave ring**, and the 4th hits hardest.
  - **Attack "Dust Devil":** it spins into a **dust tornado**.
  - **Parry (Geo):** it curls up into an armoured ball (armadillo) with the strings on the outside.
    Hits "twang".
  - **Hit:** a dust puff out of the woofer, then it shakes it off, still grooving.
  - **KO-ing a foe (emote):** a cool little dust-off of its shoulder plate.
- **64 px:**
  - About 26 px tall, 58 px long.
  - **Four bright string lines** along its back (1 px each) plus the dark round woofer at the chest are
    the read.
- **Elemental Form idea (Geo, if final): "Groove Monolith".**
  - It rears up on the tail and the back-strings become **giant glowing strings** spanning from the
    ground to its raised head.
  - A **ring of floating stone speaker-cones** pulses dust shockwaves.
  - The sandstone plates turn **polished red-gold**.

**d. Do / Don't**
- **Do:** use strings as anatomy, a woofer chest that puffs dust rings, head-bob groove timing, a
  walking 4-note attack rhythm, and laid-back cool.
- **Don't:**
  - Recreate the real bassline in SFX (bible §10: original melodies only).
  - Use the band's leather-jacket look.
  - Copy Sandaconda's sand-sac or Hippowdon's hippo body.

---------------------------------------------------------------------------------------------------

## 13. Other artists: Thrillghoul, Ziggystar

**Owner (bible §3, verbatim):**
> | Other artists | **Thrillghoul** (Ecto, "Thriller"), **Ziggystar** (Astro/Volto, "Ziggy Stardust") |

### 13.1 Thrillghoul (Ecto, about 1.5 m, arch `biped`)

**a. References**
- [K] Wikipedia, *Michael Jackson's Thriller* (1983 music video, directed by John Landis; make-up by Rick
  Baker; zombie dance choreographed by Michael Peters with Jackson; a 1950s B-movie horror parody that
  includes a **werecat transformation**): https://en.wikipedia.org/wiki/Michael_Jackson%27s_Thriller_(music_video)
- [K] Wikipedia, Deborah Nadoolman Landis. She designed the **red leather jacket with black V-shaped
  stripes** worn in the video: https://en.wikipedia.org/wiki/Deborah_Nadoolman_Landis
- [K] Wikipedia, Rick Baker (make-up): https://en.wikipedia.org/wiki/Rick_Baker
- [K] Bulbapedia, Marshadow (shadow dancer), Cofagrigus (mummy coffin), Gengar, Dhelmise: https://bulbapedia.bulbagarden.net/wiki/Marshadow_(Pok%C3%A9mon)

**b. Study notes**
- **The video [K]:**
  - A **red leather jacket with black V chevrons** across the chest and shoulders, plus red trousers.
  - **The zombie dance**:
    - claw-hands held to the side
    - shoulder shrugs and head snaps
    - a lurching side-step in formation
  - Creatures crawl out of graves, and a werecat has yellow eyes.
  - A moody blue-moonlit street palette with a red accent.
  - Approx: jacket red `#c8202a`, chevrons `#14121c`, moonlight `#3a4a7a`, zombie skin `#8aa08a`
    *(approx.)*.
- **What we take:**
  - **one red jacket-like carapace with black V-chevrons**
  - **zombie-dance claw poses as its idle and attack keys**
  - **moonlit blue palette with a single red accent**
  - **a werecat** (the video's own creature) as the animal base, not a human zombie
- **Marshadow [K]:** a small shadow-dancer martial artist. **Lesson:** avoid the hooded shadow look and
  green flame hair.

**c. Design direction**
- **Silhouette:**
  - A **lanky, undead werecat ghoul** standing upright.
  - A long-limbed, loose-jointed, slightly hunched posture (it dances).
  - Tattered cat ears, one bent. A long ragged tail.
  - **A red, glossy "jacket" carapace** over its shoulders and chest with **black V-chevron plates**,
    and slightly too-wide shoulders (80s silhouette).
  - **Forearms with long claw hands held in the zombie-dance "claw" pose.**
  - The lower body is wrapped in grave-cloth strips that float (Ecto).
- **Face:** **glowing yellow werecat eyes**, a stitched grin, and grey-green undead fur with patches.
  Spooky-cute, not gory.
- **Accessory anchor:** between the ears.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#0e0c18` |
| Fur deep | `#3a4a4a` |
| Fur shadow | `#5a6a6a` |
| Fur base | `#8aa08a` |
| Fur light | `#c0d0a8` |
| Jacket | `#6a102a` / `#c8202a` / `#ff5a4a` / gloss `#ffc0b0` |
| Chevrons | `#14121c` |
| Grave cloth | `#d8d0b8` / `#9a9080` |
| Eyes | `#ffe23a` / glow `#fff8b0` |
| Moonlight rim | `#6a8aff` |
| Ecto VFX | `#8a5aff` / `#ff7af2` |

- **Animations:**
  - **Idle:** a **zombie-dance loop**: shoulder shrug, then head snap to the side, then claws up.
    Six poses, perfectly on the beat.
  - **Attack "Graveyard Shuffle":** a **lurching side-step dash** with afterimage ghouls (2 dithered
    copies dancing in formation), then a claw swipe.
  - **Attack "Midnight Howl":** a werecat transformation flash (the eyes flare) and a curse wave.
  - **Hit:** its head snaps back (a dance move) and pops forward again. Comedic.
  - **Emote:** the full formation dance with 2 ghost-duplicates.
- **64 px:**
  - About 52 px.
  - The **red carapace with two black V chevrons** is the single read on a grey-green body.
  - Yellow eyes are 3 px with glow.
- **Elemental Form idea (Ecto, if final): "Thrill Night".** The jacket becomes **a long red
  spectral coat with glowing chevrons**, and **four ghost backup-dancers** materialise around it as part
  of its body. A full-moon halo forms behind its head.

**d. Do / Don't**
- **Do:** use the red carapace with V-chevrons, zombie-dance poses, a werecat base, a moonlit blue plus
  red accent palette, and ghost backup dancers.
- **Don't:**
  - **Likeness:** use Michael Jackson's likeness, hair, glove, or moonwalk-as-signature.
  - **Exact replicas:** copy the exact jacket design with its many zippers and the specific stripe
    layout.
  - **Tone:** use gore.
  - **Audio:** use the song's audio motifs or Vincent Price-style narration text.

### 13.2 Ziggystar (Astro/Volto, about 1.4 m, arch `biped` with float)

**a. References**
- [K] Wikipedia, *The Rise and Fall of Ziggy Stardust and the Spiders from Mars* (1972). The cover photo by
  Brian Ward in Heddon Street, London, was hand-coloured by Terry Pastor:
  https://en.wikipedia.org/wiki/The_Rise_and_Fall_of_Ziggy_Stardust_and_the_Spiders_from_Mars
- [K] Wikipedia, *Aladdin Sane* (1973). The cover by Brian Duffy shows the **red-and-blue lightning bolt
  across the face** and a **teardrop on the collarbone**: https://en.wikipedia.org/wiki/Aladdin_Sane
- [K] Wikipedia, Kansai Yamamoto. The Japanese designer created Ziggy-era stage costumes (kabuki-inspired
  striped knit bodysuits and quick-change *hikinuki* reveals): https://en.wikipedia.org/wiki/Kansai_Yamamoto
- [K] Wikipedia, Glam rock: https://en.wikipedia.org/wiki/Glam_rock
- [K] Wikipedia, Kumadori (kabuki make-up lines): https://en.wikipedia.org/wiki/Kumadori
- [K] Bulbapedia, Starmie / Jirachi / Clefable / Minior: https://bulbapedia.bulbagarden.net/wiki/Jirachi_(Pok%C3%A9mon) · https://bulbapedia.bulbagarden.net/wiki/Starmie_(Pok%C3%A9mon)

**b. Study notes**
- **Ziggy [K]:**
  - An androgynous **alien rock star from space**.
  - A **spiky red mullet**, glittery jumpsuits and platform boots.
  - The persona's arc is the star's rise and fall.
- ***Aladdin Sane* [K]:**
  - **A red-and-blue zig-zag bolt** splitting the face.
  - **A liquid teardrop** on the collarbone.
  - An airbrushed, glossy look.
  - Approx: bolt red `#e8283a`, bolt blue `#2f7aff`, skin highlight airbrush.
- **Kansai Yamamoto [K]:**
  - **A Japanese designer** whose kabuki-derived costumes were bold black/white/red stripes,
    asymmetric knit bodysuits and **hikinuki** (costumes ripped away on stage to reveal another).
  - This is a **perfect Osaka/Japan-native angle**: we take the **kabuki + stripes + quick-change
    reveal** language.
- **Kumadori [K]:** bold kabuki face lines (red = heroic, blue = villain). **Lesson:** a lightning bolt
  across the face can be read as **kumadori**, which blends the two references into something new.
- **Star Pokémon [K]:**
  - Starmie is a gem starfish; Jirachi has a star head with tag-wishes.
  - **Lesson:** don't make a five-point star body with a central gem (Starmie), or a three-point star cap
    (Jirachi).

**c. Design direction**
- **Silhouette:**
  - A **slender, androgynous alien-star creature** (a lithe biped) with **platform-boot-like hoof feet**.
  - Long legs (60 % of the height) and a narrow torso.
  - **A huge spiky red mullet that is actually a solar-flare crest**: the spikes are stylised star
    rays.
  - Shoulder pads shaped like **planetary rings**.
- **Face:**
  - Pale, glittering, pearl-white skin with mismatched eyes (one blue, one amber; an Astro "dual star"
    read).
  - **A zig-zag bolt across the face in kumadori style** (red plus blue split, original shape, extending
    into the crest). It doubles as the **Volto symbol**.
  - **A floating glitter teardrop** below one eye.
- **Costume-body:**
  - A **striped kabuki-knit pattern** on its legs and arms in black, white and red (Yamamoto nod,
    original stripes).
  - **The bodysuit can "hikinuki"**: it rips away on its ultimate to reveal a starfield body *(proposal;
    visual only)*.
- **Accessory anchor:** in front of the crest.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#1e1a3a` |
| Skin | `#fff6f0` / `#e8d0e0` / shadow `#a090c8` |
| Crest mullet | `#ff5a2a` / `#e8283a` / `#8a1028` / tips `#ffd98a` |
| Bolt | `#e8283a` + `#2f7aff`, edge `#ffffff` |
| Stripes | `#14121c` / `#f4f2ee` / `#e8283a` |
| Ring shoulders | Astro `#ffd98a` / `#6a8aff` |
| Glitter | `#ffffff` |
| Eyes | `#5ff4ff` and `#ffcf3a` |
| Volto VFX | `#ffe23a` |
| Astro VFX | `#ffd98a` / `#6a8aff` |

- **Animations:**
  - **Idle:** a **glam pose cycle**: hip-cocked stance, then a hand-to-sky "star" pose, then a hair
    flick. The crest flickers like a solar flare, and glitter dither sparkles.
  - **Attack "Starman Bolt":** it points to the sky, and **a zig-zag lightning bolt** strikes down in
    exactly the shape of its face-bolt (Volto). Stars burst on the impact (Astro).
  - **Attack "Spider Strings" (Spiders from Mars nod):** it shoots shimmering star-threads that
    entangle.
  - **Hit:** it strikes a dramatic recoil pose (it's a performer) with a glitter puff.
- **64 px:**
  - About 54 px.
  - **The red spiky crest plus the red/blue face-bolt** is the read.
  - Long thin legs with 2 px stripes. The teardrop is a single white pixel plus glow.
- **Elemental Form idea (Astro/Volto, if final): "Stardust Hikinuki".**
  - **The kabuki costume tears away** to reveal a **body made of starfield** with constellation lines.
  - The crest becomes a full **solar corona**.
  - Two orbiting ring-planets act as shields.
  - The face-bolt becomes a living lightning arc.

**d. Do / Don't**
- **Do:** use the alien glam star, a bolt as kumadori, the floating teardrop, a solar-flare mullet,
  Kansai Yamamoto–style stripes plus the hikinuki reveal, and planetary-ring shoulders.
- **Don't:**
  - Use David Bowie's face or likeness, or copy the *Aladdin Sane* bolt shape exactly (ours is original
    and continues into the crest).
  - Copy Yamamoto's actual costumes.
  - Use Starmie or Jirachi star bodies.
  - Use the K. West sign or Heddon Street scene.

---------------------------------------------------------------------------------------------------

## 14. Legendaries: Polaris, Solaris, Atomic

**Owner (bible §3, verbatim):**
> - **Legendaries**, catchable through archaeologist (Dr. Hoshino) quests:
>   - **Polaris**, the sky whale (Aero/Astro)
>   - **Solaris**, the giant lion (Pyro/Astro)
> - **Final boss: Atomic** (Nucleo), a nuclear-shard, rift-born dragon crocodile that wants to reset the world. Catchable after defeat.

And §2.1: "the sky whale Polaris passes overhead" in the opening cinematic.

**Legendary sprite rule:**
- A 128 px battle/cut-in sprite plus a 64 px dex head-and-shoulders crop.
- The 3D model gets the most cel bands allowed (3) and **always** carries a glow element. Legendaries
  are the only Tokonmon with a **permanent emissive pattern**.

### 14.1 Polaris (Aero/Astro, about 10 m long, arch `flyer`)

*v1 lore: "The great sky whale that swims the jet stream above Osaka Bay. Sailors once steered by the star
on its brow; it is said to sing the aurora into being." The v1 model already places the Little Dipper on
its back with **Polaris (the star) on the forehead** and humpback-style long pectoral fins. Keep both.*

**a. References**
- [K] Bulbapedia, Wailord / Lugia / Kyogre: https://bulbapedia.bulbagarden.net/wiki/Wailord_(Pok%C3%A9mon) · https://bulbapedia.bulbagarden.net/wiki/Lugia_(Pok%C3%A9mon) · https://bulbapedia.bulbagarden.net/wiki/Kyogre_(Pok%C3%A9mon)
- [K] Wikipedia, Humpback whale (pectoral fins up to about 1/3 of body length with knobby leading-edge
  tubercles; ventral throat pleats; breaching): https://en.wikipedia.org/wiki/Humpback_whale
- [K] Wikipedia, *Fantasia 2000*, "Pines of Rome" segment (a family of **flying humpback whales** rising
  above the clouds): https://en.wikipedia.org/wiki/Fantasia_2000
- [K] Wikipedia, *Sky: Children of the Light* (thatgamecompany; luminous sky creatures, including whales
  and manta rays gliding through clouds). *Interpretation of the brief's "Lumine whales": luminous
  light-whales, also cf. Genshin Impact, whose protagonist is Lumine.*: https://en.wikipedia.org/wiki/Sky:_Children_of_the_Light
- [K] Genshin Impact Wiki, All-Devouring Narwhal (a cosmic whale with a starry body): https://genshin-impact.fandom.com/wiki/All-Devouring_Narwhal
- [K] Wikipedia, Ghibli Museum (its exclusive short *Kujiratori* / "Whale Hunt", 2001, by Miyazaki, about
  children who catch a whale on a block-built ship. *Interpretation of "Ghibli sky whales": Miyazaki's
  soft, friendly giants and cloudscapes.*): https://en.wikipedia.org/wiki/Ghibli_Museum
- [K] Wikipedia, *Children of the Whales* (anime; an island-ship drifting on a sea of sand): https://en.wikipedia.org/wiki/Children_of_the_Whales
- [K] Wikipedia, Polaris (the North Star, the end of the Little Dipper's handle): https://en.wikipedia.org/wiki/Polaris
- [K] Wikipedia, Aurora: https://en.wikipedia.org/wiki/Aurora

**b. Study notes**
- **Wailord [K]:** a huge blimp-whale. **Lesson:** avoid the blimp oval. Ours has humpback anatomy.
- **Lugia [K]:**
  - White and silver, with blue belly plates and back fins.
  - **Wing-hands with finger-feathers**, a guardian of the sea.
  - **Lesson:** avoid fingered wing-hands. Ours uses **pectoral fins as wings**.
- **Kyogre [K]:**
  - Blue, with **red glowing circuit lines**.
  - **Lesson:** glowing body lines are a legendary staple. Ours are **constellation lines plus aurora
    pleats**, not circuitry.
- **Fantasia 2000 whales [K]:** the **sense of scale** (tiny calf next to massive adults), **light
  through cloud**, and slow majestic timing. That is the cinematic reference for the opening flyover.
- **Sky (thatgamecompany) [K]:** light creatures read via **soft glow + simple silhouettes + particle
  trails**.
- **Humpback [K]:**
  - **Long white-edged pectoral fins** with knobbed leading edges.
  - **Throat pleats**, a small dorsal hump, and broad flukes with a serrated trailing edge.
- **Approx sky palette:** night `#1e2a5a`, dawn `#ffb88a`, aurora `#a8f5c8` / `#b26bff` / `#5ff4ff`.

**c. Design direction**
- **Silhouette:**
  - A **humpback sky-whale** with **very long pectoral fins used as wings** (40 % of body length, swept,
    with tubercle bumps).
  - The **throat pleats glow as aurora bands**.
  - Flukes trail **streamers of cloud and aurora**.
  - **The Little Dipper constellation on its back**, with **Polaris on the forehead** as a 4-point star
    (v1).
- **Face:** a wise, small, kind eye (whales have small eyes, and that keeps the scale feeling huge),
  half-lidded. A long gentle mouth line.
- **Accessory anchor:** at the forehead, just behind Polaris. The trainer's hat is tiny on it, which is
  funny.
- **Palette:**

| Role | Hex |
|---|---|
| Outline | `#0e1430` |
| Back deep | `#1e2a5a` |
| Back base | `#2e4a8a` |
| Back light | `#4a6ab8` |
| Back rim | `#8aa8ff` |
| Belly | `#e8f0ff` / `#b8c8e8` |
| Fin edges | `#ffffff` |
| Pleat aurora | Aero `#a8f5c8` → Echo-ish `#b26bff` → `#5ff4ff` (flowing gradient) |
| Constellation stars | Astro `#ffd98a` / `#ffffff` |
| Lines | `#6a8aff` |
| Polaris star | `#fff6c8` / glow `#ffd98a` |
| Cloud streamers | `#f4f8ff` |

- **Animations:**
  - **Idle (flight):** a slow undulating swim with fins as wings in a long 8-pose wave, and the aurora
    pleats ripple from throat to tail.
  - **Cinematic flyover:** passes overhead at dawn, its shadow sweeping the farm. A slow breach through
    cloud with cloud wisps sliding off.
  - **Attack "Aurora Song":** it opens its mouth and **sings**. Aurora ribbons sweep across the arena
    (Aero) and a starfall comes down (Astro).
  - **Attack "Jet Stream":** a fin-sweep gale.
  - **Hit:** stars flicker and the aurora dims for 2 poses.
- **64 px dex crop:** head plus the front of a fin. **The 4-point Polaris star on the brow** (5 px) is the
  read, plus white fin edges.
- **Elemental Form idea (Aero/Astro): "North Star".**
  - The body becomes **semi-translucent night sky** with the full sky's constellations moving inside.
  - The aurora pleats extend into **giant aurora wings** above the fins.
  - Polaris on the brow flares into a beacon that casts a beam north.

**d. Do / Don't**
- **Do:** use humpback anatomy, fins as wings, aurora pleats, the Little Dipper and Polaris on the brow,
  Fantasia-scale cinematics and a slow, majestic tempo.
- **Don't:**
  - Use the Wailord blimp.
  - Use Lugia wing-hands or Kyogre circuit lines.
  - Copy the Fantasia whale designs or the Genshin narwhal.

### 14.2 Solaris (Pyro/Astro, about 4.5 m, arch `quad`)

*v1 lore: "The sun-king that rose from the first dawn over Kansai. Where it walks, frost melts and crops
ripen; when it roars, noon comes early." The v1 model has **cream-white fur, gold greaves, a two-layer
corona mane of red-to-yellow spikes, and a 12-ray crown**. Keep that.*

**a. References**
- [K] Bulbapedia, Solgaleo (white sun lion with a sun-emblem forehead): https://bulbapedia.bulbagarden.net/wiki/Solgaleo_(Pok%C3%A9mon)
- [K] Bulbapedia, Entei / Pyroar: https://bulbapedia.bulbagarden.net/wiki/Pyroar_(Pok%C3%A9mon)
- [K] Wikipedia, Shisa (Okinawan guardian lion-dogs in pairs: one open mouth, one closed): https://en.wikipedia.org/wiki/Shisa
- [K] Wikipedia, Komainu (shrine guardian lion-dogs; the *a-un* open/closed mouth pair): https://en.wikipedia.org/wiki/Komainu
- [K] Wikipedia, Lion and Sun (the Persian emblem of a **lion with the sun rising behind its back**): https://en.wikipedia.org/wiki/Lion_and_Sun
- [K] Wikipedia, Leo (constellation) (Regulus, "the little king"): https://en.wikipedia.org/wiki/Leo_(constellation)
- [K] Wikipedia, Solar corona / Solar prominence: https://en.wikipedia.org/wiki/Solar_prominence

**b. Study notes**
- **Solgaleo [K]:**
  - A **white, sleek lion** with a **sun emblem on the forehead** and a dark-blue cosmic face.
  - Its "Radiant Sun" phase glows.
  - **Lesson:** avoid the forehead sun-disc emblem and the blue cosmic face. Ours puts **the sun in the
    mane**.
- **Entei [K]:** a volcano mane with smoke. **Pyroar [K]:** a mane shaped like flames.
- **Shisa / komainu [K]:**
  - **Curly, spiral mane locks**, a squarish snout, bulging eyes.
  - **The *a-un* pair**: one mouth open (*a*, the beginning) and one closed (*un*, the end).
  - **Lesson:** our Solaris can use **spiral curls** for the corona prominences. Its **roar is the "a"**,
    and its rest is the "un".
- **Lion and Sun [K]:** the sun disc rising **behind** the lion's back. **Lesson:** a gorgeous mural and
  cut-in composition (Dr. Hoshino's murals).
- **Solar prominences [K]:** **looping arcs of plasma**. **Lesson:** spiral shisa curls plus
  prominence loops become one shape.

**c. Design direction**
- **Silhouette:**
  - A **giant regal lion**, heavy-chested and long-backed.
  - **A huge corona mane** in two layers (v1): an inner ring of **spiral shisa-curls** (prominence loops)
    and an outer ring of **long ray spikes**.
  - A floating **12-ray crown** (v1) above the head.
  - **Gold greaves** on the forelegs (v1).
  - **A tail tipped with a small sun.**
- **Astro:** **the Leo constellation** traced in faint star-points along its flank, with Regulus as a
  bright star on its chest.
- **Face:** a noble, strong muzzle and **bulging shisa-like eyes** made regal (gold iris, a fierce
  highlight). Closed mouth at rest (*un*), open roar (*a*).
- **Accessory anchor:** inside the crown ring (a hat sits *under* the floating crown).
- **Palette** (consistent with the v1 `pal`):

| Role | Hex |
|---|---|
| Fur | `#fff1d8` / `#efd2a2` / shadow `#d09a6a` → violet-shift `#a06a7a` |
| Belly | `#ffe6bd` |
| Gold | `#f7b324` / `#fff09a` / `#a8600a` |
| Mane | `#f28a22` / `#c94f12` |
| Corona | `#ff4a12` → `#ff9a1c` → `#ffd84a` → `#fff6c8` |
| Crown | `#ffd84a` |
| Leo stars | Astro `#ffd98a` / lines `#6a8aff` |
| Pyro VFX | `#ff6a2b` / `#ffd23f` |

- **Animations:**
  - **Idle:** a slow, regal breath. The **corona prominences loop and ripple** (a 6-pose cycle), and the
    crown turns slowly.
  - **Attack "First Dawn" (Pyro charge):** it sits back, the corona **swells into a full sun disc behind
    it** (the Lion and Sun composition), then it roars (*a*) and a solar beam fires.
  - **Attack "Noon Pounce":** a leap with a sunflare trail.
  - **Hit:** the corona flickers dimmer for 2 poses and reignites.
- **64 px dex crop:** head plus mane. **A ring of orange spikes plus inner spiral curls plus a crown**
  around a cream face.
- **Elemental Form idea (Pyro/Astro): "Zenith".**
  - The full **sun disc stays permanently behind its back** (Lion and Sun).
  - The fur turns white-gold with solar granulation texture.
  - The mane becomes pure plasma loops.
  - The Leo constellation detaches and orbits it as a star-ring.

**d. Do / Don't**
- **Do:** use the corona mane with shisa spirals and prominences, the *a-un* mouth logic, the floating
  crown, a sun disc *behind* it in cut-ins, and Leo stars.
- **Don't:**
  - Use Solgaleo's forehead emblem or blue cosmic face.
  - Copy a national emblem's exact Lion and Sun layout (no sword, no flag composition).
  - Copy Entei's volcano crown.

### 14.3 Atomic (Nucleo, final boss, about 6 m, arch `quad`)

*v1 lore: "Born in the reactor rift beneath the old bay… It intends to burn everything down to bedrock and
let the world begin again." The v1 model is a dark scaled crocodile-dragon with **clusters of green
nuclear crystals along the spine, glowing green rift cracks on its flanks, a long toothy snout and
tattered wings**. Keep that.*

**a. References**
- [K] Wikipedia, Godzilla (1954). The design of **dorsal plates that glow before the atomic breath** and
  **keloid-scarred skin** was inspired by radiation and by the Lucky Dragon No. 5 incident:
  https://en.wikipedia.org/wiki/Godzilla
- [K] Bulbapedia, Eternatus (alien dragon with a glowing core, Eternamax form): https://bulbapedia.bulbagarden.net/wiki/Eternatus_(Pok%C3%A9mon)
- [K] Bulbapedia, Ultra Beast (alien creatures from Ultra Wormholes, with "otherworldly" design rules): https://bulbapedia.bulbagarden.net/wiki/Ultra_Beast
- [K] Bulbapedia, Necrozma (prism crystal armour): https://bulbapedia.bulbagarden.net/wiki/Necrozma_(Pok%C3%A9mon)
- [K] Wikipedia, Uranium glass (fluoresces bright green under UV): https://en.wikipedia.org/wiki/Uranium_glass
- [K] Wikipedia, Cherenkov radiation (the **blue glow** in reactor cooling pools): https://en.wikipedia.org/wiki/Cherenkov_radiation
- [K] Wikipedia, Saltwater crocodile (osteoderm scutes, armoured back rows, long jaw, interlocking teeth): https://en.wikipedia.org/wiki/Saltwater_crocodile

**b. Study notes**
- **Godzilla [K]:**
  - **Rows of maple-leaf dorsal plates**.
  - **The glow builds up the plates from tail to head before the breath**, the most famous "charge
    tell" in film.
  - Rough keloid skin, a primal silhouette.
  - **Lesson:** Atomic's crystal spine should **light up tail-to-head as a charge tell**, using shards,
    not maple plates.
- **Eternatus [K]:** a **glowing chest core** with an alien, vertebra-like body and red-magenta energy.
  **Lesson:** use a core weak-point, but in green, not red/pink.
- **Ultra Beasts [K]:** **wrong-feeling anatomy** (glossy, alien materials). **Lesson:** the rift-born
  parts (wings, crystals) should feel *not of this world*: glassy and too-smooth next to the
  crocodile's rough scutes.
- **Uranium glass [K]:** a **vivid yellow-green glow** under UV.
  - Approx: `#8aff3a` / `#c8ff6a` (matches the game's Nucleo `#8aff3a`).
- **Cherenkov [K]:** an **eerie electric blue** (`#4fd8ff` approx). **Lesson:** use it as the
  **"critical moment"** colour (the breath's core) for a second danger read.
- **Saltwater crocodile [K]:** a long, flat, armoured silhouette, **scute rows**, a heavy tail, an
  interlocking toothy grin. The bulk sits low.

**c. Design direction**
- **Silhouette:**
  - A **massive, low crocodile-dragon** with a long jaw and a long heavy tail.
  - **Tattered wings** (v1) that look rift-torn, with glassy membrane fragments.
  - **Rows of nuclear crystal shards** erupting along the back in place of scutes (v1 clusters), the
    largest at the shoulders.
  - **Rift cracks** along the flanks (v1).
  - **A crystal reactor core in the chest** that can be seen glowing between the ribs.
- **Charge tell (Godzilla lesson):** before its breath, **the spine crystals light up one cluster at a
  time from tail to head**, shifting from green to **Cherenkov blue-white** at the head.
- **Face:** small, deep-set **green-white eyes** and an interlocking croc grin with ivory teeth. It must
  look **ancient and tired** (it "wants to reset the world"), not just angry.
- **Accessory anchor:** on the brow ridge (once caught).
- **Palette** (consistent with the v1 `pal`):

| Role | Hex |
|---|---|
| Scales | `#1a1d23` / `#262a31` / `#3a404c` / `#565e6e` |
| Belly | `#34342a` / `#4a4a3c` |
| Teeth / horns | `#e6dfc6` / `#c9c2a8` |
| Wing membrane | `#1e1420` / `#3a2238` with glass shards `#6b6372` |
| Crystals | `#1f8a2a` / `#46d92a` / `#a8ff7a` / core `#c8ff6a` |
| Rift cracks | `#58ff7a` |
| Charge peak (Cherenkov) | `#4fd8ff` → `#e8fbff` |
| Gums | `#5a1424` |
| Nucleo VFX | `#8aff3a` / `#f0ffd0` |

- **Animations:**
  - **Idle:** a slow, heavy breath. Crystals pulse in sequence, and rift cracks flicker. Its tail sweeps,
    and the wings half-open and close.
  - **Attack "Reset Breath":** the full charge tell (8 poses tail-to-head), then a jaw open, then a
    **green-to-blue atomic beam** with screen-wide light and radiation particles.
  - **Attack "Fission Shard":** it fires crystal shards that split on impact (Nucleo fission).
  - **Rift step:** it sinks into a rift crack and reappears.
  - **Hit:** crystals crack-flash white, and fragments rain down.
  - **Defeat (catchable):** crystals dim to a soft glow, and it lowers its head.
- **64 px dex crop:** head plus shoulder crystals. **A dark croc head with bright green crystal spikes**
  and green eyes.
- **Elemental Form idea (Nucleo): "Critical Mass".**
  - The crystals turn **Cherenkov blue at their core with green edges**.
  - The chest reactor core opens.
  - The wings become **full rift-portals** (holes in space with green edges).
  - A ring of orbiting crystal shards orbits it like electrons around a nucleus.

**d. Do / Don't**
- **Do:** use the croc anatomy, crystal shards as scutes, the tail-to-head charge tell, the uranium-green
  plus Cherenkov-blue two-stage danger read, a rift-glass "alien" material, and an ancient, weary face.
- **Don't:**
  - Copy Godzilla's maple-leaf plates or silhouette, or Eternatus' spine-and-core body.
  - Use real nuclear disaster imagery or real hazard symbols on the body (the in-game ☢ icon stays in
    UI only).
  - Use a radiation trefoil as a body marking.

---------------------------------------------------------------------------------------------------

## 15. Untameable wild beasts: Rift Boar, Oni Bear

**Owner (bible §3, verbatim):**
> - **Untameable wild beasts** that disrupt exploration: Rift Boar and Oni Bear.

And §9: "Untameable wild beasts disrupt exploration."

*v1 lore:*
- **Rift Boar:** "A mountain inoshishi swollen by rift radiation. It charges anything that moves and
  cannot be tamed, only driven off." (1.6 m)
- **Oni Bear:** "Once the guardian of a mountain shrine, this moon bear was twisted by the rift; its
  sacred rope now hangs in tatters." (2.4 m reared)

### 15a. References
- [K] Wikipedia, *Princess Mononoke* (1997). **Okkoto** is the ancient, blind, white boar god; **Nago**
  is the boar god turned demon, covered in writhing worm-like curse tendrils: https://en.wikipedia.org/wiki/Princess_Mononoke
- [K] Ghibli Wiki, Okkoto: https://ghibli.fandom.com/wiki/Okkoto
- [K] Wikipedia, Wild boar (Japanese *inoshishi*; striped piglets called *uribō*; a bristly dorsal
  crest; tusks): https://en.wikipedia.org/wiki/Wild_boar
- [K] Bulbapedia, Mamoswine / Piloswine (boar/mammoth): https://bulbapedia.bulbagarden.net/wiki/Mamoswine_(Pok%C3%A9mon)
- [K] Wikipedia, Asian black bear ("moon bear", *tsukinowaguma*; **white crescent on the chest**): https://en.wikipedia.org/wiki/Asian_black_bear
- [K] Bulbapedia, Ursaluna and its Bloodmoon form (scarred moon mark, peat armour): https://bulbapedia.bulbagarden.net/wiki/Ursaluna_(Pok%C3%A9mon)
- [K] Wikipedia, Oni (horns, red or blue skin, tiger-skin loincloth, iron *kanabō* club): https://en.wikipedia.org/wiki/Oni
- [K] Wikipedia, Shimenawa (sacred straw rope with zig-zag *shide* papers): https://en.wikipedia.org/wiki/Shimenawa

### 15b. Study notes
- **Okkoto / Nago [K]:**
  - Okkoto: a **massive, ancient, white-haired boar** with a dignified, sorrowful presence.
  - Nago: a demon **covered in writhing red/black worm-tendrils** that spread as a curse.
  - **Lesson:** **corruption as a living surface material** reads instantly as "can't be tamed".
  - **Ours:** **pixelated rift-crystal growths and green static**, never worms.
- **Inoshishi [K]:** a dark bristly coat, **a raised dorsal mane of bristles**, short tusks, a wedge head,
  and a fast straight-line charge (the *inoshishi musha* "charge headlong" idiom).
- **Moon bear [K]:**
  - Black, with a **white crescent (V) on the chest**, big round ears, and a ruff of longer neck fur.
  - It rears up.
- **Ursaluna [K]:** a moon mark on a huge peat-armoured bear, and the Bloodmoon form's scar.
  **Lesson:** avoid the peat-armour hump and scar-eye. Ours is **the shrine-rope and oni horns**.
- **Oni [K]:** **horns**, **red (*aka-oni*) or blue (*ao-oni*) skin**, tiger-striped loincloth, and an
  iron studded **kanabō**. Oni are tied to the northeast "demon gate" (*kimon*) in Japanese tradition.
- **Shimenawa [K]:** marks sacred boundaries. **Torn = sacred bond broken.**

### 15c. Design direction

**Shared beast rules:**
- **No anime eyes.** Use small glowing eyes, which separates them from tameable Tokonmon at a glance.
- **Rift-green corruption**, the same colours as the v1 `pal`: crystal `#46d92a` / `#a8ff7a` / rift
  `#5cff3a`.
- **No accessory anchor** (never bonded).
- **No Elemental Form.**

#### Rift Boar (1.6 m, arch `quad`)

- **Silhouette:**
  - A heavy wedge-headed *inoshishi* with a **tall dorsal bristle crest**.
  - **Every 4th bristle is a rift crystal** (v1).
  - **Tusks with glowing crystal tips.**
  - **Swollen rift tumours**: lumpy crystal clusters breaking through the hide at the shoulder and hip.
- **Eyes:** tiny, bloodshot, glowing green.
- **Palette** (v1):
  - Hide `#31251c` / `#4a382c` / `#6f5a48`
  - Bristles `#1f1712` / tips `#8a7f74`
  - Snout `#8f6c62`
  - Crystal `#1f8a2a` / `#46d92a` / `#a8ff7a`
  - Glow `#5cff3a` / `#d8ffa0`
- **Animations:**
  - **Idle:** snorting with steam, pawing the ground. The crystals pulse and the bristles twitch.
  - **Charge:** a **3-pose telegraph** (head down, a crystal flash, a hoof scrape), then a **long
    straight charge** that destroys props.
  - **Hit/driven off:** it squeals, crystals crack, and it flees into the brush.
- **VFX:** green static sparks (pixel noise), dust, and a **rift-trail** of fading green afterimages
  while charging.
- **64 px:** a low wedge plus the crest of spikes with **green crystal pixels in the crest** and green
  tusk tips.

#### Oni Bear (2.4 m reared, arch `quad`, rears to a biped stance)

- **Silhouette:**
  - A massive **moon bear** with a **white crescent chest mark** (v1).
  - **Two oni horns** (red with gold bands, v1 `hn`/`hnb`) have **broken through its skull**, so the
    rift twisted it into an oni.
  - **A tattered shimenawa rope** hangs off its neck and shoulders with torn shide papers (v1).
  - **Green rift cracks** run across its back (v1).
  - **Forearms grow rows of crystal studs**, like a kanabō club made of its own arm.
- **Eyes:** small, red-rimmed, glowing green, with a grief-stricken brow. It was a guardian.
- **Palette** (v1):
  - Fur `#121014` / `#1d1b20` / `#34303a`
  - Crescent `#f2eee4`
  - Muzzle `#6d5238` / `#a9845e`
  - Horns `#5a0f0c` / `#c42a22` with bands `#e6c76a`
  - Rope `#9a7a3a` / `#d8b56a`
  - Papers `#fbfaf4`
  - Cracks `#5cff3a`
  - Crystal studs `#46d92a` / `#a8ff7a`
- **Animations:**
  - **Idle:** a heavy sway on all fours. It sniffs and the rope tatters swing.
  - **Rear-and-roar:** it rises to 2.4 m (4 poses), the crescent glows, and a roar shockwave scatters
    leaves.
  - **Attack:** a **kanabō forearm smash** (crystal-studded arm) that leaves a crater.
  - **Hit/driven off:** it staggers and the shide papers fly off. It retreats toward the old torii.
- **64 px:** a black bulk with a **white crescent** and **two red horns**. The read is unmistakable.

### 15d. Do / Don't
- **Do:** use rift-crystal corruption as a material, an inoshishi crest and charge telegraph, a moon-bear
  crescent, broken-through oni horns, a torn shimenawa, a kanabō crystal arm, and grief-stricken
  guardian eyes.
- **Don't:**
  - Use Mononoke worm-tendrils, the white Okkoto colouring, or Ghibli's specific designs.
  - Use Ursaluna's peat hump or Bloodmoon scar.
  - Give the beasts anime Tokonmon eyes, accessories or Elemental Forms.
  - Use a real shrine's name or rope style replica.

---------------------------------------------------------------------------------------------------

## 16. Lore only: the gods of light, Dark Side of the Moon and Back in Black

**Owner (bible §3, verbatim):**
> ### Lore only (do NOT add as Tokonmon yet)
> The **gods of light** who made the world:
> - **Dark Side of the Moon**, a prism-like dragon.
> - **Back in Black**, a dark dragon.
>
> You can find them (murals, Dr. Hoshino's research, phone lore entries), but they cannot be met or caught yet.

**Scope:** these are **2D art only**: murals (pixel-art wall paintings in ruins, shrines and the
museum), Dr. Hoshino's research sketches, and phone lore-entry illustrations. **No 3D models, no battle
sprites, no stats.**

### 16a. References
- [K] Wikipedia, *The Dark Side of the Moon* (Pink Floyd, 1973). The cover by **Hipgnosis** (Storm
  Thorgerson / Aubrey Powell), illustrated by **George Hardie**, shows **a white beam entering a
  triangular prism and splitting into a spectrum on black**. The spectrum continues across the gatefold
  as a **heartbeat line**: https://en.wikipedia.org/wiki/The_Dark_Side_of_the_Moon
- [K] Wikipedia, Hipgnosis: https://en.wikipedia.org/wiki/Hipgnosis
- [K] Wikipedia, Dispersion (optics) / Prism: https://en.wikipedia.org/wiki/Dispersive_prism
- [K] Wikipedia, *Back in Black* (AC/DC, 1980), the band's tribute to Bon Scott, who died in February
  1980. The cover is **all black** with the band logo shown only as a **grey outline**. The album opens
  with "Hells Bells" and the tolling of a **large bronze bell cast for the band**:
  https://en.wikipedia.org/wiki/Back_in_Black · https://en.wikipedia.org/wiki/Hells_Bells
- [K] Bulbapedia, Necrozma (Ultra Necrozma; prism and light dragon, an "avoid" reference), Rayquaza (sky
  dragon mural precedent), Arceus (creation-god art style): https://bulbapedia.bulbagarden.net/wiki/Necrozma_(Pok%C3%A9mon) · https://bulbapedia.bulbagarden.net/wiki/Arceus_(Pok%C3%A9mon)
- [K] Wikipedia, Takamatsuzuka Tomb and Kitora Tomb murals (Japanese ancient tomb murals with the Four
  Symbols, including the **Azure Dragon**, a native mural-style reference): https://en.wikipedia.org/wiki/Takamatsuzuka_Tomb

### 16b. Study notes
- ***Dark Side of the Moon* [K]:**
  - **Pure black ground**, one **thin white beam**, a **clean white-outlined triangle**, and **a fan of
    spectral colour bands** (red, orange, yellow, green, blue, violet; *no indigo* in Hardie's
    version).
  - **What we take:**
    - **the dragon's body as a prism**: crystalline, triangular cross-sections
    - **white light entering and colour leaving**: the god that **gave the world its colours**
    - **the heartbeat line**: life created
  - Approx bands:

| Band | Hex |
|---|---|
| Red | `#e8283a` |
| Orange | `#ff8a2a` |
| Yellow | `#ffe23a` |
| Green | `#3ac85a` |
| Blue | `#2f7aff` |
| Violet | `#8a3aff` |

  Ground `#0a0a0e`, prism line `#ffffff` / `#c8d0dc`.
- ***Back in Black* [K]:**
  - **Black on black**, with the subject indicated **only by a grey outline**.
  - A **tolling bronze bell** (mourning, and a call).
  - Approx: black `#050507`, outline grey `#8a8a96`, silver `#c8ccd4`, bronze `#a8743a` / `#e0b070`.
  - **What we take:**
    - **an outline-only dragon**: drawn as **grey/silver line art on black**, the god of the **dark that
      makes light visible** (the canvas the light god paints on)
    - **a great bell** in its chest or as its voice
- **Japanese tomb murals [K]:** **flat mineral pigments on plaster**, faded with flaking edges, and the
  Four Symbols (Azure Dragon and others) drawn as **long serpentine dragons in profile**. This is the
  native style for our murals.
- **Necrozma [K]:** a prism and light dragon. **Lesson:** avoid black crystalline armour with a light
  core. Ours is **mural-flat and spectrum-fanned**.

### 16c. Design direction (2D murals and lore art only)

**Shared mural style:**
- Long **serpentine dragons in profile**, painted as **flat mineral-pigment pixel art** on cracked
  plaster.
- Limited palette per mural (≤ 12 colours), with **flaking dither** at the edges and gold-leaf
  highlights.
- The two gods are always shown **as a pair**: **Light (prism) and Dark (outline)** making the world
  together.

**Dark Side of the Moon (the prism-like dragon):**
- **Body:** the head and body are **elongated triangular prisms** (faceted, white-outlined, transparent).
- **Light:** a **beam of white light enters its open mouth** and **leaves as a six-band spectrum** that
  becomes its **wings and long tail-streamers**. Where the spectrum touches the ground in the mural,
  land, sea and forest bloom in those colours (it "made the world's colours").
- **Heartbeat:** the spectrum continues into a **heartbeat line** that runs along the mural's border,
  marking life beginning.
- **Mural palette:**
  - Black ground `#0a0a0e`
  - White `#ffffff`
  - Pale prism `#c8d0dc`
  - The six spectrum bands above
  - Gold leaf `#ffd98a`
- **Phone lore entry:** a 64 px glyph of a triangle-headed dragon with a 6-band fan, monochrome until
  "researched", then the spectrum fills in *(proposal: presentation only)*.

**Back in Black (the dark dragon):**
- **Drawing:** drawn **only in grey and silver outline on pure black**. The body has **no fill**, so it
  is the absence of light, which makes the outline glow.
- **Bell:** **a great bronze bell** hangs in its ribcage (seen through the outline), or its head is
  bell-shaped. When it "speaks" in lore cut-ins, concentric ring lines spread from the bell (sound made
  visible).
- **Composition:** in murals it **coils around the Prism dragon's light**, framing it. It is the dark
  that lets the light be seen, so they made the world together.
- **Mural palette:**
  - Black `#050507` / `#1a1a22`
  - Outline grey `#8a8a96`
  - Silver `#c8ccd4`
  - Bronze `#a8743a` / `#e0b070`
  - A single white highlight `#ffffff` on the eye
- **Phone lore entry:** a 64 px outline-only coiled dragon with a tiny bronze bell, the only colour.

### 16d. Do / Don't
- **Do:**
  - Use the prism-beam-spectrum story, the heartbeat line, outline-only black-on-black, and the bronze
    bell.
  - Use Japanese tomb-mural flatness and pair them as co-creators.
- **Don't:**
  - **Covers:** reproduce the *DSOTM* prism-on-black composition as-is (it must be a dragon), or the
    *Back in Black* cover.
  - **Logos:** use the Pink Floyd or AC/DC logos (no lightning-bolt "AC/DC" shapes).
  - **Scope:** turn them into battle sprites or 3D models. They are **lore only** (bible §3).
  - **Lookalikes:** look like Necrozma.

---------------------------------------------------------------------------------------------------

## 17. Summary: signature read per Tokonmon (64 px checklist)

| Tokonmon | Element | Arch | Signature read at 64 px | Accent hex |
|---|---|---|---|---|
| Rollingstone | Geo | blob | Pebble + stuck-out red tongue | `#e0323c` |
| Fivestones | Geo | biped | Five pip-marked armour stones | `#ffb23a` |
| Fiftystone | Geo | biped | Many-stone golem, grin + tongue, amber eyes | `#ffb23a` |
| Gradbear | Geo | biped | Stone bear + slate mortarboard + gold tassel | `#ffcf3a` |
| Heartbox | Ecto | biped | Heart-box golem, pink eye-holes, ribbon cross | `#ff7af2` |
| Inbloom | Ecto | biped | Slim angel, glowing flower heart, blade wings | `#e04dbe` |
| Beatlet | Bio | insect | Mop-top fringe shell + sprout | `#5fd35a` |
| Lenshorn | Echo | insect | Round-glasses horn rings, acid-green shell | `#9ad42a` |
| McCarapace | Hydro | insect | Violin-bass sunburst shell, sky-blue satin | `#6fb6ff` |
| Harrisun | Pyro | insect | Sun halo + sitar horn, red-orange | `#ffd23f` |
| Starrab | Geo | insect | Drum-body + octopus garden pebbles, pink | `#ff4fa3` |
| Lemmo | Volto | hopper | Lemon + copper/zinc prongs | `#ffe23a` |
| Alpha Lemmo | Volto | blob | Wedge-armoured lemon + 5-prong crown | `#fff2a0` |
| Kagarou | Pyro | quad | Charcoal wolf, bonfire mane, iron cage collar | `#ff6a2b` |
| Cabbunny | Bio | hopper | Cabbage body, leaf ears, pink nose | `#ffb3d9` |
| Moglow | Geo | quad | Glowing star-nose lamp + amethyst geode | `#ffd27a` |
| Kappachi | Hydro | biped | Water dish on head | `#8ff0ff` |
| Hotarumi | Volto/Bio | flyer | Glow bulb + pink "+" shield | `#c8ff6a` |
| Chochobake | Ecto | floater | Red lantern, torn mouth, tongue | `#d8283a` |
| Tengale | Aero | flyer | Crow-tengu with leaf-fan wingtips | `#a8f5c8` |
| Yukiusa | Cryo | hopper | Snow mound, red berry eyes, leaf ears | `#d2232a` |
| Zapanda | Volto | quad | Ringed battery tail, bolt tear-tracks | `#ffe23a` |
| Kanizumo | Hydro/Geo | insect | Wide red crab + navy mawashi + topknot | `#1f2a5a` |
| Idolark | Echo | flyer | Twin-tail crest + penlight tail | `#ff6fae` |
| Mechanyan | Ferro/Volto | biped | Always-raised beckoning paw, calico panels | `#5ff4ff` |
| Studrat | Ferro | quad | Chrome stud mohawk | `#d0dae4` |
| Moshbull | Geo | quad | Hump + headbang mane + meteorite horns | `#ff3a3a` |
| Thrashark | Hydro | swimmer | Spinning saw dorsal fin | `#d0dae4` |
| Marionoir | Ecto | floater | Floating cross-bar + glowing strings | `#c9a8ff` |
| Sandmare | Ecto/Geo | quad | Sand-stream mane, blank white eyes | `#ffe8a0` |
| Ironmaw | Ferro | quad | Vise maw + iron-filing fur, red/blue poles | `#e8402a` |
| Yellowsub | Hydro/Ferro | swimmer | Yellow sub, porthole eyes, periscope | `#ffd21f` |
| Blackbyrd | Aero | flyer | Black songbird, gold bill + eye-ring | `#ffb21f` |
| Lucydiamond | Astro/Cryo | floater | Diamond body + sky veil + kaleidoscope eyes | `#ff9a3a` |
| Killerqueen | Ecto/Bio | flyer | Pouf + black-gold striped gown + violet wings | `#ffcf3a` |
| Bohemoth | Echo/Ecto | floater | Four top-lit masks in a diamond | `#f4ece0` |
| Dontstopmeow | Volto | quad | Black cat + white ring targets + comet tail | `#ffe23a` |
| Radiogaga | Echo/Volto | biped | Cathedral-radio head + dial eye + antenna | `#ffe8a0` |
| Bitesdust | Geo | serpent | Four back-strings + woofer chest | `#d0dae4` |
| Thrillghoul | Ecto | biped | Red carapace with black V-chevrons | `#c8202a` |
| Ziggystar | Astro/Volto | biped | Red flare mullet + red/blue face bolt | `#e8283a` |
| Polaris | Aero/Astro | flyer | Humpback sky whale, brow star, aurora pleats | `#ffd98a` |
| Solaris | Pyro/Astro | quad | Corona mane + floating 12-ray crown | `#ffd84a` |
| Atomic | Nucleo | quad | Dark croc-dragon + green crystal spine | `#8aff3a` |
| Rift Boar | (beast) | quad | Bristle crest with green crystals | `#5cff3a` |
| Oni Bear | (beast) | quad | Moon crescent + red oni horns + torn rope | `#c42a22` |
| Dark Side of the Moon | lore | mural | Prism dragon, 6-band spectrum | spectrum |
| Back in Black | lore | mural | Outline-only black dragon + bronze bell | `#a8743a` |

**Follow-up for the next research pass** (web-search budget ran out):
1. Run 2–3 searches per [K] entry to confirm the facts and URLs. Priority: Kani Doraku, *Yellow
   Submarine*/Edelmann, *Master of Puppets* cover, *Jazz* cover, "Radio Ga Ga" video, *Aladdin Sane*,
   Kansai Yamamoto, yuki-usagi and Genji firefly markings.
2. Collect image boards (once downloads are allowed) into `docs/refs/img/<tokonmon>/` and sample real
   hexes to replace the *approx.* values.
3. Get owner sign-off on any skill or form name that quotes a lyric or title phrase (e.g. "Galileo",
   "Mr. Fahrenheit"). Defaults stay original.
