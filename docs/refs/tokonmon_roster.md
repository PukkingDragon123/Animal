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
