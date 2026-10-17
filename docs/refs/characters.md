# Characters & Trainers: Reference Study and Design Direction

Companion to `docs/TOKONMON.md` §1 (art direction) and §4 (characters & trainers). This file holds the
**reference study notes** and the **design direction** for every human sprite and portrait in Tokonmon.
Artists must read the matching section **before** drawing a character, and follow the
**Character Sprite Style Guide** at the end (§9). If this file and the design bible ever disagree,
the bible wins.

**The rule from the bible (§1):** study real references, then **transform them into original designs.
Never copy them.** Real people (The Beatles, Queen, Metallica, other artists) are **homages**: copy an era's
*clothing language, colour blocking, instrument silhouette and stage gesture*. Never copy a real face,
likeness, logo, album artwork, lyric or melody.

---------------------------------------------------------------------------------------------------

## 0. How to read this file

**Source tags on every reference:**

| Tag | Meaning |
|---|---|
| **[S]** | Surfaced by a web search in this research pass. The study note next to it repeats what the search result said. |
| **[C]** | Canonical reference page from prior knowledge (Wikipedia, Bulbapedia, and so on). It was **not** opened or re-checked in this pass. Verify it before relying on a detail marked *(verify)*. |

**Research status, stated honestly:**
- Image downloads and page fetching were blocked, so all study came from search-result text.
- The shared web-search budget for this run (200 calls across all agents) ran out partway through.
  - Topics 1 (sprite craft), 2 (portraits), 5 (The Beatles) and the Freddie Mercury half of 6 (Queen) were **searched**.
  - Brian May, Roger Taylor, John Deacon, the Queen crest, Metallica and metal fashion, the Osaka townsfolk, and the League-opponent song references come from **prior knowledge**, tagged **[C]**.
- **A follow-up search pass** on the [C] items is recommended before final art lock. The list is in §10.

**Every character section uses the same four parts:**
- **(a) References**
- **(b) Study notes:** concrete facts.
- **(c) Design direction:** an original chibi spec.
- **(d) Do / Don't**

**Shared terms used in the specs:**
- **Sizes** are measured on the standard **64×64 sprite cell**: feet on row 61, with a 3px ground-shadow band below.
- **Heights** are in pixels from the sole of the foot to the top of the hair or hat.
- **"Head"** means chin to top of skull, without a hat. Hair volume can add 2–6px.
- **Palettes** list each character's *own* colours.
  - The **globals** below are shared by everyone and not counted.
  - Skin ramps **SK1–SK4** are defined in §9.4.

**Globals:**

| Name | Hex | Use |
|---|---|---|
| Outline | `#1e1830` | universal dark outline, violet-black |
| Eye white | `#fff8ef` | |
| Pure highlight | `#ffffff` | |
| Blush | `#ff8fa3` | |
| Soul-stone glow | `#7ff6ff` | trainers' bracelets |

---------------------------------------------------------------------------------------------------

## 1. Anime pixel sprite craft (Topic 1)

### (a) References
- [S] Blake Crosley, *Pixel-Art People: Characters and a Creator on iPhone*: proportions table, including Octopath's Ophilia. https://blakecrosley.com/blog/pixel-art-characters-on-iphone
- [S] Blake Crosley, *Pixel-art world on iPhone*: FF6 sprite size. https://blakecrosley.com/ko/blog/pixel-art-world-on-iphone
- [S] Nintendo Everything, *Octopath Traveler devs on character origins, visual style…* (2D pixel artist Shizuka Morimoto). https://nintendoeverything.com/octopath-traveler-devs-on-character-origins-visual-style-initial-hd-rumble-plans-much-more/
- [S] Siliconera, *Project Octopath Traveler developers… troubles in developing HD-2D*. https://siliconera.com/?p=683405
- [S] Unreal Fest Europe 2019, *The Fusion of Nostalgia and Novelty in the Development of Octopath Traveler*. https://www.unrealengine.com/events/unreal-fest-europe-2019/the-fusion-of-nostalgia-and-novelty-in-the-development-of-octopath-traveler
- [S] Wikipedia, *HD-2D*. https://en.wikipedia.org/wiki/HD-2D
- [S] Prima Games, *Live A Live Remake: All differences from the original*. https://primagames.com/tips/live-a-live-remake-all-differences-from-the-original
- [S] Wurb, *Final Fantasy VI: Pixel Art*. https://www.wurb.com/stack/archives/785
- [S] Bulbapedia, *Pokémon sprite*. https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_sprites
- [S] Bulbapedia file, HGSS overworld sprite (32×32). https://bulbapedia.bulbagarden.net/wiki/File:Ani381OD.png
- [S] WikiDex, *HGSS sprites category* (trainer sprites 80×80). https://www.wikidex.net/wiki/Categor%C3%ADa:Sprites_de_Pok%C3%A9mon_Oro_HeartGold_y_Plata_SoulSilver
- [S] PokéCommunity, *Spriting tutorials: Pokémon and trainer* (DS overworld style). https://www.pokecommunity.com/threads/spriting-tutorials-pokemon-and-trainer.176686/page-9
- [S] PokéCommunity, *GBA/DS Trainer Overworld Tutorial* (circle-on-square bases). https://www.pokecommunity.com/goto/post?id=5265003
- [C] Bulbapedia, *Trainer class* list (Gen 4/5 class silhouettes and props). https://bulbapedia.bulbagarden.net/wiki/Trainer_class
- [S] Game Developer, *Road to the IGF: Pixpil's Eastward*. https://www.gamedeveloper.com/disciplines/road-to-the-igf-pixpil-s-i-eastward-i-
- [S] Film Stories, *Eastward preview* (Mother/EarthBound and Ghibli influences). https://filmstories.co.uk/?p=82862
- [S] Eastward Wiki (90s anime look plus 3D lighting). https://eastwardwiki.com/Eastward
- [S] Nintendo, *How the developers began making (then remaking) Eastward*. https://www.nintendo.com/us/whatsnew/how-the-developers-began-making-then-remaking-eastward
- [S] Wikipedia, *Sea of Stars*. https://en.wikipedia.org/wiki/Sea_of_Stars
- [S] MegaVisions, *The Art of Sea of Stars: a Sea of Pixels*. https://www.megavisions.net/the-art-of-sea-of-stars-a-sea-of-pixels/
- [S] Sabotage Studio press kit. https://sabotagestudio.com/presskits/sea-of-stars
- [S] Stardew Valley Wiki, *Modding: Farmer sprite* (walk loop). https://wiki.stardewvalley.net/Modding:Farmer_sprite
- [S] Stardew Valley forums (NPC sheet layout). https://forums.stardewvalley.net/goto/post?id=90169
- [S] Giant Bomb, *Persona Q: Shadow of the Labyrinth* (chibi, Etrian Odyssey-style). https://www.giantbomb.com/games/3030-44564/
- [S] Stevivor, *Persona Q review* ("simpler, caricatured versions"). https://stevivor.com/reviews/review-persona-q-shadow-labyrinth/
- [C] Wikipedia, *Persona 5* (art direction by Shigenori Soejima, red/black graphic UI). https://en.wikipedia.org/wiki/Persona_5
- [S] SLYNYRD, *Pixelblog 29: Anime Faces and Hair*. https://slynyrd.com/blog/2020/7/28/pixelblog-29-anime-faces-and-hair
- [S] Aseprite community, *Anime face based off SLYNYRD* (3-tone hair hexes). https://community.aseprite.org/t/anime-face-based-off-slyndyrd/19607
- [S] SLYNYRD, *Pixelblog 50: Human Walk Cycle*. https://www.slynyrd.com/blog/2024/5/24/pixelblog-50-human-walk-cycle
- [S] Lospec, *Pixel art outlines part 2: using color* (selout). https://lospec.com/articles/pixel-art-outlines-part-2-using-color
- [S] itch.io, *Pixel tutorial: selective outlines*. https://itch.io/t/2422252/pixel-tutorial-selective-outlines
- [S] Anime Outline, *How to shade anime hair*. https://www.animeoutline.com/?p=7753
- [S] Anime Outline, *Different ways to draw anime hair highlights*. https://www.animeoutline.com/different-ways-to-draw-anime-hair-highlights/
- [S] CLIP STUDIO TIPS, *How to draw eyes: chibi edition*. https://tips.clip-studio.com/en-us/articles/11293
- [S] ModDB, *Through the Magnifying Glass, part three* (tiny-sprite method). https://www.moddb.com/tutorials/through-the-magnifying-glass-part-three
- [S] Sprite-AI blog, *How many animation frames* (idle/walk/run counts). https://www.sprite-ai.art/blog/sprite-animation-frames

### (b) Study notes

**Octopath Traveler / HD-2D:**
- Ophilia's sprite cell is measured at about **18×32**, with the head taking about **41%** of the height.
- Pixel-art RPG sprites in general sit in a **38–54% head** band. Octopath's eyes have **no white highlight pixel**.
- *Octopath Traveler II* deliberately **reduced the head ratio** "to fit more action into events and battles" [S, third-party analysis].
- The look started from **lighting effects applied to 2D art**, with 3D added for depth. The pixel artist was Shizuka Morimoto.
- The team raised the density of tile variations and colours so sprites would not look "lonely" on large screens.
- Takeaways:
  - **Tiny sprites read inside a lit 3D diorama**, so silhouette and value contrast beat interior detail.
  - The **lighting** gives the richness, not extra pixels.

**Live A Live HD-2D:** sprites were **fully remade** for the 3D world, not upscaled. Each character kept their defining traits under a new look.

**Final Fantasy VI:**
- Party sprites are **16×24**, and the **same sprite** is used in the field, on the world map and in battle.
- About 12 colours are visible per battle sprite [S, secondary source].
- SNES 4bpp sprites have 16 palette slots, one of them transparent [C].
- Lesson: one sprite, many contexts, so **design for reuse**: the same sheet serves the street, the restaurant and the stadium sideline.

**Pokémon Gen 4/5 (DP/Pt/HGSS/BW):**
- Overworld frames are **32×32** (HGSS file example).
- Trainer battle sprites are **80×80** in HGSS. BW trainer battle sprites are **animated** intro loops [C, verify].
- DS overworld style vs. GBA, per the spriting tutorial:
  - **Cuter**, with a **higher viewing angle**.
  - **Big round heads** and a **more subdued palette**.
  - Built from **"circles sitting on top of squares"** (round head on a boxy body).
- Walk = 3 unique frames per direction (stand, left step, right step), played stand → L → stand → R [C, verify].
- Design lesson from the Gen 4/5 trainer classes [C]:
  - Each trainer reads from **one prop and one colour block**: Bug Catcher = net + straw hat; Guitarist = guitar; Interviewers = microphone + shoulder camera.
  - Outfits use **3–4 flat colour blocks**.

**Eastward:**
- References Mother/EarthBound, Ghibli (*Laputa*, *Nausicaä*) and 90s Japanese animation.
- **Rich retro pixel art** combined with a **modern 3D lighting system**. This is the closest tonal cousin to our "HD-2D diorama with 2D humans".
- *Eastward Design Works* (artbook) is the recommended print reference.

**Sea of Stars:**
- SNES-era (Chrono Trigger) look in a fixed isometric-ish view.
- Reviewers single out **hand-crafted, many-frame animation**: even push-ups get full cycles.
- Lesson: **personality lives in bespoke idles and emotes**, not in the walk.

**Stardew Valley:**
- NPC sheets are **16×32 cells, 4 columns × 13–14 rows**.
- Walk loop = **F1, F2, F1, F3** (the stand frame shared between steps).
- About 2–3 heads tall: a cartoon, not a chibi.

**Persona Q / Persona 5:**
- PQ chibis are "simpler, caricatured versions" of the P3/P4 casts, in an **Etrian Odyssey-like chibi** style.
- P5's character identity lives in **bold graphic colour pairs** (red/black/white) and **signature poses** [C].
- Lesson: our chibis are **caricatures of personality**, so each one gets one exaggerated feature (Gonda's mass, Brian's hair cloud, Lumi's twin tails).

**Anime faces in pixels (SLYNYRD #29):**
- Anime line work does not survive pixel scale, so the translation needs **"simplification through abstraction, and precise pixel placement."**
- Proportions are set first in a straight-on front view.

**Hair:**
- Build hair from **large clumps**, not strands.
- **Shadows sit along the bottom edges of clumps**. Highlights are simplified bands (the "angel ring" / 天使の輪).
- A 3-tone hair ramp example: base `#202e37`, highlight `#394a50`, shadow `#151d28` (Aseprite study).
  - That is very low contrast. We use a **wider value step** so hair reads at 1× zoom.

**Selective outline (selout):**
- Outline colour varies around the sprite: dark where the sprite is dark, lighter where it is lit.
- The aim is **"maintaining the amount of contrast between the outline and the object all the way around."**
- Selout can also soften **internal lines**.
- The light source drives the outline values, not the fill shading.

**Tiny-sprite method (ModDB):** at very small sizes, **paint shapes in colour first**, then refine. Outlining first produces unreadable blobs.

**Eyes:**
- Chibi eyes are big, with highlights.
- At 2–4px the highlight pixel does most of the "anime" work. Keep **one** clear highlight and drop all other detail.

**Walk cycles (SLYNYRD #50):**
- **8 frames** are the smoothest, **4 frames** keep only the key poses, **6 frames** are the compromise.
- Bigger sprites cost much more time.
- Typical counts: idle 2–4 frames ("breathing loop, long holds"), walk 4–8, run 6–8.
- **Hold times matter more than frame count.**

### (c) Design direction: what Tokonmon takes from this
1. **Canvas and size:**
   - **64×64 cells**, with characters **34–56px tall** (tiers in §9.2).
   - That is about 1.5× Octopath's density, because our camera **zooms in** for restaurant and counter scenes.
   - It is still small enough to read as pixel art when the camera pulls back.
2. **Head share 40–48%** (chibi end of the RPG band). Adults are about 40%, teens 43%, kids 47–50%.
   - The *Octopath II* lesson cuts both ways: we want **cute**, but keep limbs long enough to pose, point and cheer in battle.
3. **Circle-on-box construction** (Pokémon DS): a round head on a boxy torso, stubby legs 30% of height.
4. **Eyes WITH a highlight pixel.**
   - This deliberately differs from Octopath. We want Pokémon/anime warmth.
   - It is 1px, top-inner, and it never moves between frames, so the gaze stays stable.
5. **Selout, 1px**, hue-shifted, never pure black (§9.5).
6. **3 tones per material plus 1 hair/metal highlight**, hard bands, no dithering on sprites.
7. **Walk = 4 frames on twos** (12 fps beat, 2 ticks per frame) for everyone.
   - The **main cast** gets a 6-frame run and **bespoke idles and emotes**, following the Sea of Stars lesson.
8. **One-prop rule** (Gen 4 classes): every NPC is readable from a **single prop** plus **one dominant colour block**:
   - takoyaki picks
   - bug net
   - whistle
   - half mic stand
   - violin bass
   - curly hair cloud
9. **The diorama does the lighting:**
   - Sprites carry baked 3-tone shading lit from the top-left.
   - The engine adds rim light, colour grading and tilt-shift. Following Octopath and Eastward, lighting supplies the richness.
   - Optional: a hand-painted **4-direction normal map** per sheet for the main cast, so dynamic lights wrap them.

### (d) Do / Don't
- **Do** silhouette-test every sprite as a solid fill at 1×. You must be able to tell who it is.
- **Do** design for reuse in street, interior, table and stadium contexts (the FF6 lesson).
- **Don't** add interior lines that the lighting would do better.
- **Don't** let a walk cycle carry personality. Put it in idles and emotes.
- **Don't** mix pixel scales: no sprite drawn at 2× next to 1× sprites.

---------------------------------------------------------------------------------------------------

## 2. Pixel portraits for dialogue (Topic 2)

### (a) References
- [S] FEUniverse, *Basic manual splicing with CharacterCreator resources* (GBA portrait area 96×80, sheet 128×112). https://feuniverse.us/t/how-to-do-basic-manual-splicing-with-charactercreators-individual-resources/4774
- [S] FEUniverse, *Understanding ValeTheVioletMote's Character Creator* (16 colours including transparent). https://feuniverse.us/t/understanding-valethevioletmotes-character-creator/28321
- [S] FEUniverse, *UltraxBlade's FEBuilder help FAQ* (blink and mouth frames). https://feuniverse.us/t/ultraxblades-febuilder-help-faq/19565/51
- [S] LT-maker docs, *Portraits Editor*. https://lt-maker.readthedocs.io/en/latest/source/editors/resource-editors/Portraits-Editor.html
- [S] PMD Collab wiki, *Sprite Tool* (Pokémon Mystery Dungeon portrait and emotion sheets). https://wiki.pmdo.pmdcollab.org/Sprite_Tool
- [S] Pixiv Encyclopedia, *VA-11 Hall-A*. https://dic.pixiv.net/a/va-11hall-a
- [S] TouchArcade interview with Christopher "kiririn51" Ortiz (Sukeban Games). https://toucharcade.com/?p=328970
- [S] Skillshare, *How to draw facial expressions* (brows, eyes and mouth as the three levers). https://www.skillshare.com/blog/how-to-draw-facial-expressions-a-guide/
- [C] Wikipedia, *Persona 5* (portrait cut-ins, expression swaps). https://en.wikipedia.org/wiki/Persona_5
- [C] Wikipedia, *Octopath Traveler*. In-game dialogue is mostly sprites plus text boxes; character illustrations sit in menus. https://en.wikipedia.org/wiki/Octopath_Traveler

### (b) Study notes

**Fire Emblem GBA:**
- **96×80** portrait area, assembled on a 128×112 sheet with **separate blink frames, mouth frames and a mini portrait**.
- **16 colours, one of them transparent**, so 15 usable.
- Eye frames are **32×16** (open, half and closed patches pasted over the face).
- Mouth frames come in a smiling row, a neutral row and a status frame.
- This is the gold standard for "a **static bust** plus **swappable eye and mouth patches**."

**Pokémon Mystery Dungeon:**
- Small square portraits (40×40 [C]) with a large **named emotion set** [C, verify list]:
  - Normal, Happy, Pain, Angry, Worried, Sad, Crying, Shouting, Teary-Eyed, Determined, Joyous, Inspired, Surprised, Dizzy, Sigh, Stunned.
- Lesson: **standardise expression names** across the whole cast so writers can call `angry` on anyone.

**VA-11 Hall-A:**
- Large, low-res anime busts with 90s-anime flavour [C].
- Expression changes are small (brows, eyelids, mouth), and that keeps the cast feeling like real people.

**Persona:**
- Large illustrated busts slide in [C].
- **Small changes** (brow angle, eyelids) carry a lot, and a few **big "special" expressions** per character are saved for key beats.

**Octopath:**
- Mostly **no dialogue portraits**. Emotion is carried by sprite emotes and lighting [C].
- So for Tokonmon, **the sprite emote must still work when no portrait shows**: in-world speech bubbles, per the bible.

**Expression craft:**
- The levers are **brows, eyes and mouth**. Keep the features in fixed positions and change only those layers.
- Sad = inner brow corners up and mouth corners down.
- Angry = brows together and down, lips pressed.

### (c) Design direction: the Tokonmon portrait spec

**Canvas and drawing:**
- Canvas is **96×96** (bust, head plus shoulders, cropped at mid-chest).
- Head (chin to skull) is about **50px**. Eyes are **6–10px tall** (teen girl 10, teen boy 8, adult 6–7, elder 3–4 slit).
- Integer display only: **×3 = 288px** on phones, **×4 = 384px** on tablets.
- **Up to 24 colours** per portrait: the sprite's ramps plus at most one extra tone per ramp (a skin rim light and a hair second highlight).
  - Sprite and portrait share base hexes, so the two read as the same person.
- **Shading:** 3 hard tones plus a rim light on the side facing the scene light.
  - Selout outline 1px.
  - **Sparse 2×2 checker dithering allowed only** on hair gloss and cloth folds, never on skin.

**Swap layers (FE-GBA method):**

| Layer | States |
|---|---|
| Brows | neutral, raised, angry (V), worried (Λ), one-up (smirk) |
| Eyes | open, half, closed, wide (shock: small iris, 2 highlights), happy arcs (^ ^), side-glance |
| Mouth | closed, talk A (small open), talk B (wide open), smile, grin (teeth), frown, gritted, wavy "o" |
| FX | blush hatch, sweat drop, tear stream, anger cross-vein 💢, gloom lines (blue shade over eyes), sparkle |

**Animation (12 fps tick = 83ms):**
- **Blink:** open → half (1 tick) → closed (2 ticks) → half (1 tick). It fires every 2.5–5s at random, and never during "shocked".
- **Talk:** mouth cycles closed → A → B → A on 1-tick frames while text types. It rests closed on punctuation.
- **Entry:** slides 12px from the speech-bubble edge over 4 ticks with a 1px overshoot.

**Required set for every named character (7):**

| # | Expression | Build |
|---|---|---|
| 1 | **normal** | neutral brows + open eyes + closed |
| 2 | **happy** | raised + happy arcs + smile |
| 3 | **angry** | V brows + open, iris small + gritted + 💢 |
| 4 | **sad** | Λ brows + half + frown (+ tear optional) |
| 5 | **shocked** | raised + wide + wavy "o" + sweat |
| 6 | **smirk** | one-up + half + asymmetric smile |
| 7 | **thinking** | worried + side-glance + closed, mouth shifted 1px; optional hand-to-chin variant on a separate bust |

**Extras:** 1–3 per character (listed in each section), for example blush, crying, determined, laughing, sleepy, starstruck.

**Mini portrait:** a **32×32** head-only crop for phone contacts and messages (§8 of the bible). It uses the `normal` and `happy` states only.

### (d) Do / Don't
- **Do** keep eyes and mouth in fixed pixel positions across all expressions (swap layers only).
- **Do** give each character one "big" expression that only appears at story beats.
- **Don't** redraw the whole bust per emotion. It causes jitter and palette drift.
- **Don't** use pure black for pupils or outlines. Use `#1e1830` or the character's hue-shifted darkest tone.
- **Don't** make the portrait more detailed than about 2.5× the sprite's density. They must look like one person.

---------------------------------------------------------------------------------------------------

## 3. Story cast, townsfolk and staff (Topic 3)

These are the shared conventions for this whole section.

- **Every trainer** wears the **soul-stone bracelet** on the left wrist: a 2×2px stone in globals `#7ff6ff`, plus a 1px band.
- **Every trainer** carries the **custom phone**: a 3×5px slab with a 1px screen glint, shown in command poses.
- **The 2050 layer:** each human gets **one or two glowing tech accents**, and no more. Examples: an LED seam, an AR lens, a holo badge.
  - These are the pixels the engine's bloom picks up.
  - A third glow makes a sprite noisy in night scenes.
- **Trainer battle poses** apply to the player, Mika, Kaito, Gonda, Taro, all bullies, all League opponents, the Elite and the Champions:

  | Pose | Frames | Description |
  |---|---|---|
  | `ready` | 2-frame loop | |
  | `command` | 3 | Point plus phone raised |
  | `cheer` | 4 | |
  | `bond` | 4 | Wrist raised; the soul-stone beam is a separate FX layer |
  | `hurt` | 2 | Flinch |
  | `defeat` | 3 | Slump, then a hold |
  | `victory` | 4 | |

- **Seated set:** restaurant and table zoom scenes from bible §1 and §9 need these.
  - `sit` (side and front).
  - `eat` (4 frames: chopsticks up, chew 2 frames, happy).
  - `react-spicy` (3 frames: flush, sweat, steam).
  - The ice-cream gang scene and the dinners require them for the **story cast**. Townsfolk only get `sit`.

### 3.1 Player presets (3 styles)

**(a) References**
- [C] Bulbapedia, *Ethan* and *Lyra* (HGSS protagonists: cap and hoodie readability, overalls silhouette). https://bulbapedia.bulbagarden.net/wiki/Ethan · https://bulbapedia.bulbagarden.net/wiki/Lyra
- [C] Bulbapedia, *Hilbert* and *Hilda* (BW protagonists: taller teen proportions, cap and ponytail silhouettes, shoulder bag). https://bulbapedia.bulbagarden.net/wiki/Hilbert · https://bulbapedia.bulbagarden.net/wiki/Hilda
- [S] PokéCommunity DS overworld tutorial (round head on box body, higher viewing angle). https://www.pokecommunity.com/threads/spriting-tutorials-pokemon-and-trainer.176686/page-9
- [C] Wikipedia, *Japanese street fashion* (Osaka/Amemura streetwear, Harajuku layering, techwear). https://en.wikipedia.org/wiki/Japanese_street_fashion

**(b) Study notes**
- Pokémon protagonists are recognisable at 32px from **one headwear shape**: Ethan's backwards cap, Hilda's tall ponytail.
- They wear **2–3 colour blocks** (top, bottom, shoes), plus a **bag strap diagonal** that breaks up the torso.
- Osaka's street style (Amerikamura) is louder than Tokyo's [C]: oversized hoodies, caps, bright sneakers.

**(c) Design direction**
- **Shared body:**
  - Teen, **42px tall, head 18px** (43%).
  - Gender-neutral base, with 4 skin ramps (SK1–SK4), 6 hairstyles and 8 hair colours.
- **Eyes:** 2×4 (big) or 2×3 (narrow), chosen in the creator.
- **Hairstyle options:**
  - short crop
  - messy spikes
  - bob
  - high ponytail
  - twin braids
  - long straight
- **Always on:** the bracelet (left wrist), a phone holster on the right hip, and a cross-body bag strap.

| Preset | Silhouette and outfit | Palette (own colours) |
|---|---|---|
| **A · "Dotonbori Street"** | Backwards cap, oversized tangerine hoodie (hem at mid-thigh, sleeves pushed up), charcoal cargo shorts, chunky white high-tops. The hood bunches into a 2px roll behind the neck. Default hair: messy spikes. | SK2 `#eeb68e` `#c9846a` `#8a4c3c` · hair `#6b4232` `#4a2c24` `#9a6a4e` · hoodie `#ff9d42` `#e2672b` `#a8442a` · cap `#33b8b2` `#1f7d84` · shorts `#4b4a5e` · shoes `#f6f2ea` (13) |
| **B · "Umeda Techwear"** | Cropped navy shell jacket with high collar, 1px neon reflective seam, tapered joggers, strapped boots, visor shades pushed up on the head (the glow accent). Default hair: silver bob. | SK1 `#f9cfb0` `#e0a084` `#a8624e` · hair `#e8ecf6` `#b4bcd6` `#8088b0` · jacket `#2b2f45` `#1b1e30` `#444b6e` · seam `#c6ff4a` · joggers `#3a3f52` · visor `#ff5fa8` · boots `#f2f2f2` (13) |
| **C · "Castle Park Sporty"** | Cobalt track jacket with two white sleeve stripes, coral athletic shorts or skort over white knee socks, yellow runners, sweat-wristband. Default hair: high ponytail (bobs 1 frame behind the head). | SK3 `#d39566` `#a5643f` `#6a3a26` · hair `#2a2238` `#1a1426` `#5a4a7e` · jacket `#3a6ff0` `#2446b0` `#8fb2ff` · stripes and socks `#fbfbff` · shorts `#ff5a6e` `#c23a52` · runners `#ffd23a` (13) |

- **Idle quirk:** checks the phone (2-frame screen glow), then looks up.
- **Signature emote:** "bond pump". The fist goes up, the bracelet flashes, and a 3px sparkle plays.
- **Portrait:** the 7 base expressions plus **determined** and **starstruck** (sparkle eyes).
  - The portrait uses the same hairstyle and colour layers as the creator.
  - Hair is drawn as **swappable back and front layers**.

**(d) Do / Don't**
- **Do** keep all three presets inside the same pixel footprint, so hair and clothing layers swap cleanly.
- **Do** keep one strong diagonal (the bag strap) on every preset.
- **Don't** give the player a fixed expression personality. Portrait defaults are neutral and slightly hopeful.
- **Don't** use hair colours that clash with UI or cyan soul-stone glows. No pure `#00ffff` hair.

### 3.2 Mika: bubbly best friend (partner Zapanda, Volto)

**(a) References**
- [C] Bulbapedia, *Bianca (game)*: the bubbly BW friend, with an oversized beret, layered coat, clumsy run and big gestures. https://bulbapedia.bulbagarden.net/wiki/Bianca_(game)
- [C] Wikipedia, *Giant panda*: black eye-patches, ears and limbs on white. This is Zapanda's base read. https://en.wikipedia.org/wiki/Giant_panda
- [S] CLIP STUDIO, chibi eyes (big, highlight-driven). https://tips.clip-studio.com/en-us/articles/11293

**(b) Study notes**
- Bianca reads as "bubbly" through **oversized headwear**, **soft rounded shapes** and **constant motion**: bouncing and flailing arms.
- Panda read = **two round black ears** plus **white mass** plus **black limbs**.
- Volto = yellow lightning accents.

**(c) Design direction**

| Spec | |
|---|---|
| Size | 41px, head 18px (44%). Rounded everything: no sharp angles in her silhouette. |
| Silhouette | **Two round hair buns** high on the head (5×5px each), like panda ears. Puffy white hoodie, short flared yellow skirt, chunky sneakers. The width tapers at the knees, like a "bell". |
| Head / eyes | 2×4 eyes with an extra outer lash flick (1px). Amber iris. Highlight top-inner. 2px blush hatch is always faintly on. |
| Hair | Charcoal-black bob with the two buns. Bangs in 3 rounded clumps. Angel-ring highlight broken into 3 dashes. A **yellow lightning-bolt hair clip** (3×5px) on the right bun. |
| Outfit | Oversized white hoodie with **panda-ear hood** (black nubs show when the hood is down too), sleeves past the fingertips (sleeve-paws). Yellow pleated skirt with a zig-zag "lightning" hem (1px). Charcoal bike shorts. Chunky yellow-and-white sneakers. |
| Accessories | Zapanda keychain on the bag. The phone has a panda case. Bracelet on the left wrist. Glow accent: the lightning clip pulses on emotes. |
| Palette (14) | SK1 `#f9cfb0` `#e0a084` `#a8624e` · hair `#2b2838` `#45405c` `#7a7896` · hoodie `#fbf8f2` `#d8d2e6` · yellow `#ffe14d` `#f2b21c` `#b8701a` · shorts `#3b3550` · iris `#f29a2e` · blush (global) |
| Idle quirk | Bounces on her toes (1px up on frames 2 and 4: a double-time idle). Every few seconds she swings her sleeve-paws. |
| Signature emote | **"Zap-V!"** A hop with a double V-sign at her cheeks, a 1-frame lightning spark from the hair clip, and a ♪ bubble. |
| Portrait | The 7 base expressions plus **laughing** (eyes ^ ^, mouth wide), **pouty** (cheeks puffed, 1px pink outline), and **teary-happy**. Her "angry" is never scary: puffed cheeks and a 💢. |

**(d) Do / Don't**
- **Do** make her run a separate cycle (arms flailing, 6 frames). It is her signature motion, Bianca-style.
- **Do** echo Zapanda in her shapes (round buns, black and white) without putting her in a panda costume.
- **Don't** give her hard edges or a dark palette. The only dark tones are her hair and shorts.
- **Don't** put a visible glow on everything. One glow accent: the clip.

### 3.3 Coach Gonda: ex-pro, big and sporty (partner Kanizumo, Hydro/Geo crab sumo)

**(a) References**
- [C] Bulbapedia, *Chuck* (HGSS Fighting gym leader): huge mass, small head, big moustache, loud. https://bulbapedia.bulbagarden.net/wiki/Chuck
- [C] Wikipedia, *Sumo* (rikishi build; chonmage topknot; Kanizumo's theme). https://en.wikipedia.org/wiki/Sumo
- [C] Wikipedia, *Tracksuit* (Japanese school and sports-coach "jersey" culture: ジャージ). https://en.wikipedia.org/wiki/Tracksuit

**(b) Study notes**
- **"Big" in pixel art** comes from three things:
  - **Width at the shoulders**, not height.
  - A **small head relative to the body** (the inverse of chibi).
  - **Short, thick limbs**.
- Japanese coaches are archetypally in a **school jersey tracksuit with a whistle** [C].
- Kanizumo is a sumo crab, so *interpretation:* Gonda's build and **small topknot** nod to sumo as his former pro discipline.

**(c) Design direction**

| Spec | |
|---|---|
| Size | **54px tall, 32px wide** (the widest story character). Head 19px (35%). He breaks the chibi rule on purpose, and that reads as "big". |
| Silhouette | An inverted trapezoid: wide shoulders and belly, short sturdy legs, small round head with a **tiny topknot** (3px). |
| Head / eyes | 2×2 eyes under **thick 2px eyebrows** (his main acting tool). Square jaw. 1px stubble dots. A big toothy grin in emotes (4px wide). |
| Hair | Dark buzz cut (flat 2-tone), topknot tied with a 1px white cord. |
| Outfit | Red tracksuit jacket, zipped to mid-chest, with white shoulder stripes. Sleeves pushed up to show forearms. Tight charcoal tee under it. Matching red track pants with a white side stripe. Thick-soled trainers. |
| Accessories | Silver **whistle on a lanyard** (the one-prop rule). Yellow sweatband on the right wrist, bracelet on the left. A holo-clipboard tablet tucked under his arm when not battling. Glow accent: the tablet edge. |
| Palette (11) | SK3 `#d39566` `#a5643f` `#6a3a26` · hair `#26201e` · tracksuit `#e5383b` `#a8202e` `#ff7a6a` · stripe `#f4f0ea` · tee and pants shade `#2e2a36` · whistle `#c8d0dc` · sweatband `#ffd23a` |
| Idle quirk | Arms crossed, a deep 2px breathing bob (heavier than anyone else's). Every few seconds he rolls his neck. |
| Signature emote | **"Gahaha!" flex.** Double-bicep pose with a 3-frame belly laugh, then a whistle blast (a small FX ring). |
| Portrait | The 7 base expressions plus **roaring laugh** (eyes shut, mouth huge), **proud-teary** (manly tears streaming, for your wins), and **stern coach** (a narrow-eyed whistle bite). |

**(d) Do / Don't**
- **Do** let his 2px eyebrows do the acting. They move in every emote.
- **Do** show warmth: he wins at being lovable, not scary.
- **Don't** shrink him to the chibi teen tier. His scale is his joke.
- **Don't** draw a full sumo costume. He is a coach in a tracksuit with a sumo past.

### 3.4 Kaito: the cool rival

**(a) References**
- [C] Bulbapedia, *Silver (game)*: HGSS rival with long red hair, black jacket, hands in pockets and a cold stance. https://bulbapedia.bulbagarden.net/wiki/Silver_(game)
- [C] Bulbapedia, *Gladion*: SM rival with hair over one eye, ragged hoodie and a "turning away" pose. https://bulbapedia.bulbagarden.net/wiki/Gladion
- [C] Bulbapedia, *Cheren*: BW rival with glasses and the "calm logical" read. https://bulbapedia.bulbagarden.net/wiki/Cheren

**(b) Study notes**
- A cool rival reads from three things:
  - **Asymmetry**: bangs over one eye, a one-sided coat flap.
  - A **closed posture**: hands in pockets, turned away.
  - A **dark cool palette with a single hot accent**, such as a red scarf.
- The coat's tail is the movement element in his walk (Silver's jacket and Gladion's hoodie hem).

**(c) Design direction**

| Spec | |
|---|---|
| Size | 43px, head 18px (42%). Long-legged for his tier: legs are 1px longer than the player's. |
| Silhouette | Spiky swept hair (asymmetric, long on the right), a **knee-length navy coat with split tails** that flutter, and a red scarf whose end trails behind. |
| Head / eyes | 2×3 narrow eyes with a flat top lash (a "sharp" look). Teal iris. Highlight 1px. The right eye is half-hidden by bangs. |
| Hair | Blue-black spikes in 5 clumps, with **one teal streak** (it doubles as his glow accent at night: a subtle 1px emissive). |
| Outfit | Navy high-collar long coat (open), white inner tee, slim black pants, black fingerless gloves, low boots. |
| Accessories | Red scarf (2-frame flutter loop that runs even in idle). The phone is in a holster on his thigh. Bracelet on the left wrist. |
| Palette (14) | SK1 `#f9cfb0` `#e0a084` `#a8624e` · hair `#22253d` `#383f63` · streak `#5fd6d0` · coat `#2b3659` `#1a2140` `#4c5e92` · inner `#e8ecf4` · scarf `#e0384a` `#9a2236` · iris `#3fd0c9` · gloves and pants `#1a1a26` |
| Idle quirk | Hands in pockets, weight on one leg. Every few seconds he glances sideways (eyes shift 1px) and the scarf flutters. |
| Signature emote | **"Hmph."** Eyes close, a 2-frame hair flick, a quarter turn away, and a "…" bubble. |
| Portrait | The 7 base expressions plus **rare grin** (a genuine, competitive smile, saved for bond beats), **annoyed blush**, and **serious** (shadowed eyes, for League beats). His "happy" is a restrained half-smile. |

**(d) Do / Don't**
- **Do** use the scarf and coat-tail for motion. His body stays still and cool.
- **Do** keep one warm accent (the scarf) against an all-cool palette.
- **Don't** make him cruel. He is cool and competitive, and his rare grin pays off the friendship.
- **Don't** give him more than one glow (the streak).

### 3.5 Taro: bug-catcher kid (lends you Beatlet)

**(a) References**
- [C] Bulbapedia, *Bug Catcher (Trainer class)*: straw hat, net and shorts. The archetype since Gen 1. https://bulbapedia.bulbagarden.net/wiki/Bug_Catcher_(Trainer_class)
- [C] Wikipedia, *Japanese rhinoceros beetle* (kabutomushi: Japanese summer bug-catching culture; the kid's dream catch). https://en.wikipedia.org/wiki/Japanese_rhinoceros_beetle
- [C] Wikipedia, *Mushikago*-style insect cages, under *Insects in Japanese culture* (verify). https://en.wikipedia.org/wiki/Insects_in_Japanese_culture

**(b) Study notes**
- The Japanese summer kid look:
  - **wide straw hat** (mugiwara)
  - **sleeveless top**
  - **shorts**
  - **insect net**
  - **green plastic insect cage on a shoulder strap**
  - bandages on the knees
- The bug catcher is readable at any size from the net alone.

**(c) Design direction**

| Spec | |
|---|---|
| Size | **35px**, head 17px (49%). The most chibi of the cast. |
| Silhouette | A huge round straw-hat brim (wider than his shoulders: 22px) with the net pole poking above it. |
| Head / eyes | 2×3 round eyes, highlight 1px. Gap-tooth grin (1px gap) in emotes. A 1px bandage on the nose. |
| Hair | Dark brown, mostly hidden. A cowlick sticks out of the back of the hat. |
| Outfit | White tank top, olive shorts with a big pocket, sandals. A plaster on the left knee. |
| Accessories | Bug net (taller than him). Green insect cage on a strap at his hip, with **Beatlet peeking out** in story scenes. Bracelet. Glow accent: the cage has a 1px LED "habitat" light (Osaka 2050). |
| Palette (13) | SK3 `#f0c294` `#d39566` `#a5643f` · hair `#3a2a22` · hat `#f4d27a` `#d2a24a` `#9a6a2a` · ribbon `#e8443a` · tank `#f8f6ee` · shorts `#7d8c4c` `#56602f` · cage `#5cc46a` · plaster `#ffe0b8` |
| Idle quirk | Swishes the net in a little figure-8, then peers into the cage. |
| Signature emote | **"Look what I found!"** Holds the cage up over his head, eyes become sparkles, and a ★ bubble appears. |
| Portrait | The 7 base expressions plus **proud** (chest out, nose rub), **crying-loud** (a big kid wail), and **whispering** (finger to lips, for sneaking in the tall grass). |

**(d) Do / Don't**
- **Do** make the hat brim the silhouette (Pokémon's Bug Catcher lesson).
- **Do** let the cage show bugs or Beatlet as a 3×3 sprite overlay.
- **Don't** age him up. He is the youngest story character.

### 3.6 Dr. Hoshino: archaeologist and legends researcher

**(a) References**
- [C] Bulbapedia, *Cynthia*: the Champion who researches myths and ruins. Long coat, a calm scholar silhouette. https://bulbapedia.bulbagarden.net/wiki/Cynthia
- [C] Wikipedia, *Indiana Jones* (field archaeologist iconography: brimmed hat, satchel, field jacket). https://en.wikipedia.org/wiki/Indiana_Jones
- [C] Wikipedia, *Star chart* (constellation linework for the Polaris and Solaris motifs; *hoshi* = star). https://en.wikipedia.org/wiki/Star_chart

**(b) Study notes**
- A field scholar reads from:
  - a **long practical coat with pockets**
  - **satchel and scrolls**
  - **goggles or a brimmed hat**
  - **glasses or a magnifier**
- Cynthia proves a calm, tall, dark-coat silhouette reads as "wise" even in chibi.

**(c) Design direction** (*interpretation: a woman in her mid-30s; the bible does not set a gender, so the owner can swap*)

| Spec | |
|---|---|
| Size | 47px, head 18px (38%). |
| Silhouette | A long sand-coloured field coat that flares at the hem. Messy indigo hair in a high bun with **two pencils stuck through it**. Goggles on her forehead. A satchel bulging with scrolls. |
| Head / eyes | 2×3 eyes behind **oval lenses** (1px frame; lenses drawn as a 1px light tint over the eye). Thoughtful, slightly heavy lids. |
| Hair | Indigo bun plus loose strands: 2 clumps falling at the temples. |
| Outfit | Sand field coat with patch pockets and rolled sleeves, a navy turtleneck, cargo trousers tucked into lace-up boots. A **star-chart scarf** (navy with 1px yellow dots and lines: constellations). |
| Accessories | A holographic tablet that projects a 5×5 star map (her glow accent), a magnifier on a cord, a brush in her pocket (archaeology). Bracelet. |
| Palette (14) | SK1 `#f9cfb0` `#e0a084` `#a8624e` · hair `#2e2a52` `#4a4680` `#7c78b8` · coat `#d9c08a` `#b0925a` `#806236` · scarf `#23305e` · stars `#ffe27a` · holo `#8ff0ff` · boots `#5a3a2a` |
| Idle quirk | Reads her tablet, pushes up her glasses (a 1px lens glint), and sometimes scribbles with a pencil from her bun. |
| Signature emote | **"Eureka!"** The holo map flares, she spins it with one finger, a light-bulb bubble appears, and she does an excited 2-frame hop. |
| Portrait | The 7 base expressions plus **lecture mode** (finger raised, eyes closed), **awestruck** (stars reflected in her lenses, for legend reveals), and **exhausted** (bags under her eyes, a pencil in her mouth). |

**(d) Do / Don't**
- **Do** carry the star motif (Polaris and Solaris lore) in her scarf and hologram.
- **Do** make her coat-hem flare the walk-cycle secondary motion.
- **Don't** copy Indiana Jones' fedora and whip. Goggles plus pencils-in-bun are hers.

### 3.7 Takoyaki Taisho: Osaka street vendor

**(a) References**
- [C] Wikipedia, *Takoyaki*: Osaka's signature street food. Ball-shaped batter with octopus, cooked in a hemispherical iron pan, turned with picks, topped with sauce, mayo, aonori and katsuobushi. https://en.wikipedia.org/wiki/Takoyaki
- [C] Wikipedia, *Hachimaki* (twisted headband: effort and festival spirit). https://en.wikipedia.org/wiki/Hachimaki
- [C] Wikipedia, *Happi* (straight-sleeved festival coat with a crest). https://en.wikipedia.org/wiki/Happi
- [C] Wikipedia, *Kuidaore Taro* (Dotonbori's drumming clown mascot: Osaka's showman food culture). https://en.wikipedia.org/wiki/Kuidaore_Taro

**(b) Study notes**
- Street vendors in Osaka wear a **twisted hachimaki**, a **happi or apron**, and **sleeves tied back**.
- They flip takoyaki at speed with **two metal picks**.
- The stall is loud and theatrical. The Osaka food persona is a **performer** (Kuidaore Taro).

**(c) Design direction**

| Spec | |
|---|---|
| Size | 50px, head 19px. A round belly (width 28px). |
| Silhouette | A round body, **a twisted red-and-white hachimaki knot sticking up on one side**, and a pick in each hand raised like drumsticks. |
| Head / eyes | 2×2 squinty eyes (smiling arcs by default). Big open-mouth grin with 1 gold tooth pixel. Bushy 2px brows. Stubble. |
| Hair | Black short back and sides. The hachimaki hides most of it. |
| Outfit | Indigo happi with a white **octopus crest** on the back (original mark: a round octopus head with 3 curling legs). White undershirt, sleeves tied up with a cord (tasuki), a white apron with sauce splats (2–3 brown pixels). Geta or work clogs. |
| Accessories | Two takoyaki picks. A paper boat of 6 takoyaki in emotes. Glow accent: a holo menu sign floating at the stall (stall prop, not the sprite). |
| Palette (14) | SK3 `#f0c294` `#d39566` `#a5643f` · hair `#2a2224` · hachimaki `#e8443a` · white `#f4f0ea` · happi `#2c3e7a` `#1c2650` `#4f66b0` · crest `#ff7a5a` · takoyaki `#b06a30` `#6a3418` · mayo `#fff4c8` · aonori `#3f7a3f` |
| Idle quirk | **Picks flip** in a 4-frame loop over the pan: wrist rolls with a 1px steam puff. |
| Signature emote | **"Maido! Hot ones!"** A double-pick flip at blur speed (2 frames ×1 tick), a takoyaki arcs up and lands in a boat, then a thumbs-up. Steam FX. |
| Portrait | The 7 base expressions plus **hard-sell** (leaning in, eyebrows wagging), **howling laugh**, and **burned tongue** (for the spicy-food gags). |

**(d) Do / Don't**
- **Do** make the picks and steam the motion; the body stays planted.
- **Do** keep Osaka friendliness: big laugh, sales patter energy.
- **Don't** use the Japanese flag's red sun on the hachimaki. Use a plain twisted red-and-white rope.
- **Don't** copy Kuidaore Taro's clown costume (save a nod for a separate street performer).

### 3.8 Yuzu: ice-cream clerk at "Yellow Submarine Soft-Serve"

**(a) References**
- [C] Wikipedia, *Yellow Submarine (film)* (1968; Heinz Edelmann's pop-art design: yellow sub, portholes, psychedelic sea). https://en.wikipedia.org/wiki/Yellow_Submarine_(film)
- [S] Lambiek, *Heinz Edelmann* (the film's art director and character designer; psychedelic pop-art style). https://www.lambiek.net/artists/e/edelmann_heinz.htm
- [C] Wikipedia, *Soft serve* (Japanese "soft cream" culture; the swirl silhouette). https://en.wikipedia.org/wiki/Soft_serve
- [C] Wikipedia, *Sailor suit* (sailor collar and stripes: nautical uniform). https://en.wikipedia.org/wiki/Sailor_suit
- [C] Wikipedia, *Yuzu* (yellow citrus; leaf shape). https://en.wikipedia.org/wiki/Yuzu

**(b) Study notes**
- The shop's theme is a **submarine**: yellow hull, round portholes, rivets, periscope, and a nautical blue trim.
- Edelmann's film look is flat pop-art colour with wavy psychedelic lines [S].
- A soft-serve swirl is a perfect chibi hair-bun shape.
- Yuzu, the citrus, gives her **a leaf clip** and an orange-yellow hair colour.

**(c) Design direction**

| Spec | |
|---|---|
| Size | 40px, head 18px. |
| Silhouette | A **soft-serve swirl bun** (3 stacked tiers, 7px tall) on top of yuzu-orange hair, a round porthole badge on her cap, and a puffy apron. |
| Head / eyes | 2×4 eyes, leaf-green iris, highlight 1px. Freckles: 2 pixels per cheek in the skin shadow tone. |
| Hair | Orange-yellow bob plus the swirl bun. A **green yuzu-leaf clip**. |
| Outfit | Yellow shop dress with a **navy sailor collar** and 2 white stripes. A small **porthole visor cap** (a round aqua "window" badge with 4 rivet pixels). Yellow-and-white striped apron. White socks and navy Mary Janes. |
| Accessories | A soft-serve cone in her hand (vanilla or flavour swap). A periscope-shaped scoop pen on the apron. Glow accent: the porthole badge's aqua "window". |
| Palette (13) | SK1 `#f9cfb0` `#e0a084` `#a8624e` · hair `#ffcf4a` `#f2a12a` `#c46a1a` · uniform `#ffe86a` `#e8c03a` · navy `#2a4a8a` · porthole `#5fd8e8` · white `#fffaf0` · cone `#e0a35a` · leaf and iris `#5cb85c` |
| Idle quirk | Swirls an imaginary cone with her wrist; the bun sways 1px. |
| Signature emote | **"One swirl, coming up!"** Pulls the soft-serve lever (a 4-frame swirl builds on the cone), presents it with both hands, and a ♥ bubble appears. |
| Portrait | The 7 base expressions plus **customer smile** (a professional beam) and **brain-freeze** (eyes squeezed, a blue shiver line). |

**(d) Do / Don't**
- **Do** connect her to the shop with a submarine palette (yellow plus navy plus aqua portholes).
- **Don't** put Beatles faces or the film's characters anywhere on her. The theme stays nautical-pop.
- **Don't** let the swirl bun read as poop. Keep it **cream-white tiers on yellow hair** with a 1px warm shadow, and add a tiny cherry clip if needed.

### 3.9 Old Man Kubo: farmer

**(a) References**
- [C] Wikipedia, *Jika-tabi* (split-toe work boots). https://en.wikipedia.org/wiki/Jika-tabi
- [C] Wikipedia, *Tenugui* (thin cotton towel worn on the head or around the neck). https://en.wikipedia.org/wiki/Tenugui
- [C] Wikipedia, *Noragi* (Japanese indigo farm work coat). https://en.wikipedia.org/wiki/Noragi
- [C] Studio Ghibli, *My Neighbor Totoro* (Granny's countryside farm aesthetic; ties to Eastward's Ghibli influence [S]). https://en.wikipedia.org/wiki/My_Neighbor_Totoro

**(b) Study notes**
- Rural Japanese farmers wear:
  - a **wide straw hat** with a **tenugui** under it or around the neck
  - an **indigo noragi** or work jacket
  - **work pants**
  - **jika-tabi** boots
- Posture is **stooped**, with deep tan and **white stubble**.
- The farm opens the game (the dawn cinematic), so he must read warm and earthy.

**(c) Design direction**

| Spec | |
|---|---|
| Size | **40px stooped** (he would be 45 standing). Head 18px pushed forward 2px. |
| Silhouette | A wide flat straw hat, a stoop, and a hoe over the shoulder: a strong diagonal. |
| Head / eyes | Squint lines (1px horizontal arcs). His eyes open (2×2) only in "shocked". A white stubble beard. Wrinkles as 2 skin-shadow lines. |
| Hair | White, short, mostly hidden. Bushy white brows. |
| Outfit | Indigo noragi with sashiko stitch dots (1px light pixels), a white tenugui around the neck, grey work pants, dark jika-tabi boots. |
| Accessories | A hoe. A woven basket of cabbages (Cabbunny's farm) in his farm idle. A 2050 touch: a tiny **farm drone** hovers beside him (an 8×5 companion sprite) as his glow accent. |
| Palette (13) | Tan skin `#d8a070` `#b07648` `#7a4a2a` · hair and stubble `#f4f0e6` `#c8c4bc` · straw `#e8c870` `#b8903e` · noragi `#334a7a` `#22305a` · tabi `#3a3440` · cabbage `#8fd16a` · metal `#9aa2b0` · tenugui shares `#f4f0e6` |
| Idle quirk | Leans on the hoe, then pats his lower back (a 2-frame "oof"). |
| Signature emote | **"Fine harvest!"** Lifts a giant cabbage over his head with both arms and laughs with his eyes closed. |
| Portrait | The 7 base expressions plus **wise nod** and **sleepy**. His "shocked" is the only time we see his full eyes. That is the joke. |

**(d) Do / Don't**
- **Do** keep earthy, desaturated tones. He grounds the farm palette.
- **Don't** make him frail or sad. He is sturdy and humorous.

### 3.10 Ms. Aoi: League receptionist in a futuristic uniform

**(a) References**
- [C] Wikipedia, *Elevator girl* (Japanese department-store attendants: pillbox hats, gloves, precise hand gestures). https://en.wikipedia.org/wiki/Elevator_girl
- [C] Wikipedia, *Ojigi*, under *Bowing in Japan* (bow angles: 15°, 30° and 45°). https://en.wikipedia.org/wiki/Bowing_in_Japan
- [C] Wikipedia, *Ghost in the Shell* (Japanese cyber-uniform design language: high collars, clean panels, visors). https://en.wikipedia.org/wiki/Ghost_in_the_Shell

**(b) Study notes**
- Japanese service uniforms communicate through **precision**:
  - gloved **open-palm "this way" gestures**
  - **standardised bows** (15° greeting, 30° respect, 45° apology)
  - a **pillbox or pill cap**
- Futurism in uniform design means **clean colour panels**, **high collars**, **piping** and **one HUD element**.

**(c) Design direction**

| Spec | |
|---|---|
| Size | 46px, slim. Head 18px. |
| Silhouette | A sleek asymmetric bob (long on the left), a tiny pill cap tilted to the right, a **high-collar** jacket, and a narrow pencil skirt (or tapered slacks variant). |
| Head / eyes | 2×3 eyes with a calm upper lash. Blue iris. A **holo-monocle** visor floats over the right eye: a 3×3 cyan panel and her glow accent. |
| Hair | Blue-black glossy bob with a crisp 2-segment angel ring. |
| Outfit | White uniform jacket with **royal-blue side panels and gold piping**, a League emblem badge on the cap, white gloves, and blue low heels. |
| Accessories | A floating tablet (it follows her hand 1 frame late). A headset mic. |
| Palette (14) | SK1 `#f9cfb0` `#e0a084` `#a8624e` · hair `#1a2240` `#2c3a6a` `#5a7ac0` · uniform `#f6f8fc` `#c8d0e8` · blue `#2a6fdb` `#1a46a0` · gold `#f2c14e` · holo `#6ff0ff` · lips `#e86a7a` |
| Idle quirk | Hands folded at her waist with a polite 1px head tilt. She taps the floating tablet. |
| Signature emote | **"Welcome to the League."** A 30° bow (3 frames down, a 6-tick hold, 2 frames up), then the open-palm "this way" gesture. |
| Portrait | The 7 base expressions plus **professional smile** (eyes closed ^ ^) and **flustered** (holo-monocle glitches and tablet juggling). Her "angry" is an icy polite smile with a 💢. |

**(d) Do / Don't**
- **Do** animate precise, crisp motions: few frames, exact holds.
- **Don't** sexualise the uniform. Hemlines are knee-length; the cut is professional.
- **Don't** copy a real airline's uniform colours or logo.

### 3.11 Lumi★: J-pop idol (partner Idolark, Echo)

**(a) References**
- [C] Wikipedia, *Japanese idol* (frilled stage costumes, signature poses, fan culture). https://en.wikipedia.org/wiki/Japanese_idol
- [C] Wikipedia, *Wotagei* (fans' synchronized penlight dance; for her crowd). https://en.wikipedia.org/wiki/Wotagei
- [C] Wikipedia, *Hatsune Miku* (twin-tail idol silhouette; LED and digital idol design language). https://en.wikipedia.org/wiki/Hatsune_Miku
- [C] Bulbapedia, *Elesa* (BW model gym leader: stage runway lighting and fashion-pose acting). https://bulbapedia.bulbagarden.net/wiki/Elesa

**(b) Study notes**
- Idol costumes are:
  - **frilled tiered skirts**
  - **big ribbons**
  - **star and heart motifs**
  - **boots**
  - **headset mics**
- Idols use **signature poses**: the peace sign at the eye, the heart-hands, the wink.
- Fans wave **penlights** in coordinated colours.
- Very long **twin tails** are the strongest idol silhouette (Miku).

**(c) Design direction**

| Spec | |
|---|---|
| Size | 41px, head 18px. With the twin tails reaching her calves, her total visual width is 26px. |
| Silhouette | **Knee-long twin tails** with **star clips**, a tiered frilled skirt, and boots. |
| Head / eyes | 2×4 eyes with a **star-shaped highlight**: the highlight is a 1px plus-cross of 3 pixels, unique to her. Magenta iris. Long lashes. |
| Hair | A lilac-to-pink gradient twin-tail set (3 tones plus pink tips). The tails swing 1 frame behind the body. |
| Outfit | A pink-and-white idol dress with a sailor-ish collar and a big ribbon. **LED trim on the hem** (cyan dashes: her glow accent, which animates in a 3-step chase loop). White platform boots. |
| Accessories | A headset mic. A star-tipped hand mic for emotes. A ★ hair clip on each tail. Bracelet styled as a star bangle. |
| Palette (14) | SK1 `#f9cfb0` `#e0a084` `#a8624e` · hair `#c9a7ff` `#9d7aee` · tips `#ff9ad5` · dress `#ff6fb5` `#cf3f8b` · white `#fff6fb` `#e6d4f0` · LED `#5ff6ff` · star `#ffe45a` · iris `#ff4fa8` |
| Idle quirk | Practises choreography: a 4-frame step-touch with a hand wave, and the twin tails swing. |
| Signature emote | **"Lumi★Wink!"** A peace sign over one eye with a wink, a star sparkle burst (FX), and a heart bubble. |
| Portrait | The 7 base expressions plus **idol-mode** (perfect smile, sparkles), **off-stage tired** (a dull ahoge droop, which reveals the real her: a friend-bond beat), and **starstruck**. |

**(d) Do / Don't**
- **Do** make the LED hem chase loop her signature 2050 element.
- **Do** give her a visibly different "off-stage" palette, desaturated 10%, for hangout scenes. She is a Persona-style friend.
- **Don't** copy Miku's teal colours or design. Use the lilac-pink gradient and stars.
- **Don't** sexualise her. She is a teen idol; keep cute and athletic poses.

### 3.12 Mr. Tanaka: salaryman

**(a) References**
- [C] Wikipedia, *Salaryman* (dark suit, white shirt, tie, briefcase, commuter life). https://en.wikipedia.org/wiki/Salaryman
- [C] Wikipedia, *Bowing in Japan* (the 45° apology bow: *saikeirei*). https://en.wikipedia.org/wiki/Bowing_in_Japan

**(b) Study notes**
- The stock salaryman wears a **navy or charcoal suit**, a **white shirt**, a **plain tie** and carries a **black briefcase**.
- He has **thin-rimmed glasses** and a neat side part.
- Comedy beats:
  - a **sweat drop**
  - a **deep apology bow**
  - the after-work loosened tie, and the "tie on the forehead" party cliché

**(c) Design direction**

| Spec | |
|---|---|
| Size | 46px, head 18px. Slightly hunched shoulders (1px). |
| Silhouette | A boxy suit and a briefcase at his side. The tie hangs off-centre. |
| Head / eyes | 2×2 eyes behind thin **rectangular glasses** (1px rims, lens glint). A tired upper lid. |
| Hair | A neat side part, a little thin on top: 1px of skin showing through at the crown. Grey at the temples. |
| Outfit | Navy suit, white shirt, **red tie loosened** by 2px, dark shoes, an ID lanyard. |
| Accessories | A briefcase. A 2050 smartwatch (glow accent: it pings on his "late" emote). A convenience-store coffee in a variant. |
| Palette (14) | SK2 `#eeb68e` `#c9846a` `#8a4c3c` · hair `#2a2a30` `#484856` · suit `#2e3a5c` `#1e2640` `#4a5a86` · shirt `#f2f4f8` `#c6ccda` · tie `#c8323e` · briefcase `#6a4428` · glasses `#9aa6b8` |
| Idle quirk | Checks his watch, sighs (shoulders drop 1px), and wipes his forehead with a handkerchief. |
| Signature emote | **"Sumimasen!"** A 45° bow that is too deep, so his glasses slip, then a sweat drop. |
| Portrait | The 7 base expressions plus **overworked** (spiral eyes, dark circles), **relieved** (a weekend smile), and **tie-on-head party mode**. |

**(d) Do / Don't**
- **Do** play gentle comedy; he is sympathetic.
- **Don't** make every salaryman extra a Tanaka clone. Palette-swap suits for the townsfolk (§3.21).

### 3.13 Granny Fuku

**(a) References**
- [C] Wikipedia, *Maneki-neko* (the "beckoning cat" lucky charm; *fuku* = fortune). https://en.wikipedia.org/wiki/Maneki-neko
- [C] Wikipedia, *Osaka*. Use it as an entry point for the **Osaka obachan** culture: purple-tinted perms, animal prints, and handing out candy (*ame-chan*). Verify this with a follow-up search. https://en.wikipedia.org/wiki/Osaka
- [C] Wikipedia, *My Neighbor Totoro* (Granny: a short, hunched, kind, practical silhouette). https://en.wikipedia.org/wiki/My_Neighbor_Totoro

**(b) Study notes**
- Osaka grannies are famous for:
  - a **tight perm** (often purple-tinted)
  - a **cardigan** with a **kappōgi** (apron smock) over it
  - always **having candy in their pocket** to give to strangers ("ame-chan")
- Ghibli grannies read through a **tiny hunched mass** and **big hands**.

**(c) Design direction**

| Spec | |
|---|---|
| Size | **34px hunched** (the smallest adult). Head 16px. |
| Silhouette | A round lilac perm cloud, a curved back, a cane, and a small cloth bag. |
| Head / eyes | Happy closed-arc eyes by default (1px arcs). Round rosy cheeks. Small round glasses optional (her NPC variants). |
| Hair | A lilac-grey perm cloud of 6–7 round curls, each with a 1px highlight. |
| Outfit | A mauve cardigan with a white kappōgi smock over it (puffy sleeves), a floral pattern of 1px pink dots, dark slacks, and slip-on sandals. |
| Accessories | A wooden cane with a little bell. A **gold maneki-neko charm** on her bag. A candy pouch. Glow accent: a hearing-aid LED, as a 1px dot, or none. |
| Palette (14) | Pale skin `#f8dcc8` `#e0b49a` `#b08070` · hair `#eae0f6` `#c8b4e0` `#9a86b8` · cardigan `#b05a7a` `#803a58` · smock `#fbf6ee` `#d8d0c4` · cane `#7a5032` · neko `#ffd23a` · candy `#ff4a5a` · pants `#4a4058` |
| Idle quirk | Hands rest on the cane top, with a slow 1px nod. Now and then she shuffles 1px to the side. |
| Signature emote | **"Have some candy, dear."** She reaches into the pouch, holds out a red candy (2×2), the candy sparkles, and a ♥ appears. |
| Portrait | The 7 base expressions plus **cackling laugh**, **gossip** (hand cupped to her mouth), and **sharp-eyed** (her eyes open: she knows more than she says). |

**(d) Do / Don't**
- **Do** use the candy gift as a recurring mechanic visual (small item pops).
- **Don't** make her frail. She is mischievous and strong-willed.

### 3.14 Master Genryu: dojo master

**(a) References**
- [C] Wikipedia, *Keikogi* (martial arts training uniform). https://en.wikipedia.org/wiki/Keikogi
- [C] Wikipedia, *Hakama* (pleated trousers: the senior martial-artist look). https://en.wikipedia.org/wiki/Hakama
- [C] Wikipedia, *Master Roshi* (the comedic old martial-arts master archetype: bald, white beard). https://en.wikipedia.org/wiki/Master_Roshi
- [C] Bulbapedia, *Chuck* (the Pokémon dojo master: a body-language contrast to Gonda). https://bulbapedia.bulbagarden.net/wiki/Chuck

**(b) Study notes**
- The old master archetype:
  - **long white beard** and **huge brows that hide the eyes**
  - **white keikogi with black hakama**
  - small, still, and **deceptively fast**
- The bible's dojo is for training, auto-training and roster viewing, and it hosts Harrisun's "dojo meditation, then sunrise".

**(c) Design direction**

| Spec | |
|---|---|
| Size | 42px, head 18px. Small and compact. The beard reaches his belt. |
| Silhouette | A bald dome with a small white topknot, **brows like wings** (4px long, drooping past his eyes), a long wedge beard, and **wide black hakama** (a bell shape). |
| Head / eyes | Eyes hidden under the brows by default. In "shocked" or "serious", the brows lift and 2×2 sharp eyes appear, and the **wise-glint** frame flashes a 1px white star. |
| Hair | White topknot, eyebrows and beard (3 tones). |
| Outfit | White keikogi, black hakama, white tabi socks, zōri sandals. |
| Accessories | A wooden prayer-bead bracelet. A teacup in his idle. Glow accent: none on him; his glow is the **dojo's holo-scroll** prop. *He is the one character with zero tech, which is his joke.* |
| Palette (13) | SK2 `#eeb68e` `#c9846a` `#8a4c3c` · beard `#ffffff` `#dcd8e4` `#a8a4b8` · gi `#f6f2ea` `#cfc8bc` · hakama `#23232e` `#3a3a4e` · beads `#8a3a2a` · cup `#5a8a6a` · eye `#2a2020` |
| Idle quirk | Strokes his beard with one hand and sips tea. Every few seconds the beard twitches as if he is about to speak. |
| Signature emote | **"Hmm… Again."** He closes his eyes, rises 2px in a hovering meditation cross-leg pose (a 4-frame float), a subtle sunrise-orange aura plays (for Harrisun), then he drops with a "tok". |
| Portrait | The 7 base expressions plus **eyes-revealed serious**, **dozing** (Zzz), and **proud master** (beard ruffle, tiny smile). |

**(d) Do / Don't**
- **Do** make stillness his character: fewer, longer-held frames.
- **Don't** copy Master Roshi's sunglasses or Hawaiian shirt. Keep him traditional.

### 3.15 Auntie Kazu: Osaka shopkeeper

**(a) References**
- [C] Wikipedia, *Osaka* (entry point for the **Osaka obachan** look: leopard and tiger prints, perms, loud bargaining, *"Maido!"*). Verify with a follow-up search. https://en.wikipedia.org/wiki/Osaka
- [C] Wikipedia, *Kansai dialect* (*maido*, *ookini*, *nande ya nen*: tone of voice drives her emotes). https://en.wikipedia.org/wiki/Kansai_dialect
- [C] Wikipedia, *Shinsekai* (old-school Osaka shopping-street flavour). https://en.wikipedia.org/wiki/Shinsekai

**(b) Study notes**
- The Osaka auntie stereotype is famous inside Japan:
  - **animal-print tops** (leopard or tiger)
  - a **tight purple perm**
  - a **sun visor**
  - **gold jewellery**
  - **bargaining**
  - **candy in her pockets**
- *Nande ya nen!*, with a backhand slap in the air, is the iconic Kansai comic retort (the tsukkomi).

**(c) Design direction**

| Spec | |
|---|---|
| Size | 44px, stout (width 26px). Head 18px. |
| Silhouette | A tight purple perm under a **white sun visor**, a leopard top, an apron, and big gesturing hands. |
| Head / eyes | 2×2 eyes with bold lash flicks. Red lipstick (1px wider mouth line). A loud open-mouth default in talk frames. |
| Hair | A tight purple perm: a curl texture of 1px dots in 2 tones. |
| Outfit | A **leopard-print top** with chunky 2×2 spots (pixel-legible), a red shop apron with a white shop mark, dark purple slacks, and sandals. |
| Accessories | A white visor, a gold chain necklace, a **calculator** (bargaining prop), and a candy pouch. Glow accent: an e-price-tag gun that blinks red. |
| Palette (14) | SK2 `#eeb68e` `#c9846a` `#8a4c3c` · perm `#7a3a9a` `#5a2470` `#a868c8` · leopard `#f2b43a` `#c9842a` `#3a2418` · apron `#e83a5a` · visor `#ffffff` · gold `#ffd84a` · slacks `#3a3456` |
| Idle quirk | Taps on the calculator, then waves to passers-by. |
| Signature emote | **"Nande ya nen!"** A backhand comedy slap at the air, eyes wide, mouth open, then she cracks up laughing. A second emote, **"Maido!"**, is a big wave with a gold-tooth gleam. |
| Portrait | The 7 base expressions plus **bargaining** (one eye narrowed, calculator up), **cackle**, and **gossip-whisper**. |

**(d) Do / Don't**
- **Do** make the leopard spots chunky. At 1× they must read as leopard, not noise.
- **Do** keep her affectionate; she is a scary-loud but kind auntie.
- **Don't** give Granny Fuku and Auntie Kazu the same perm colour. Granny is lilac-grey, Kazu is saturated purple.

### 3.16 Ranger Sora: safari ranger (Minoh Safari)

**(a) References**
- [C] Bulbapedia, *Pokémon Ranger (Trainer class)* (field uniform, backpack, outdoorsy gear). https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Ranger_(Trainer_class)
- [C] Wikipedia, *Park ranger* (campaign hat and khaki field uniform). https://en.wikipedia.org/wiki/Park_ranger
- [C] Wikipedia, *Minoh* (Minō Park waterfall forest: setting tone). https://en.wikipedia.org/wiki/Min%C5%8D,_Osaka

**(b) Study notes**
- Rangers read through:
  - a **wide-brim campaign hat** with a chin cord
  - a **khaki shirt with shoulder patches**
  - **binoculars** on the chest
  - a **radio**
  - **boots**
- The bible's safari has sneaking through tall grass and dangerous untameable beasts, so the ranger is protective and alert.

**(c) Design direction** (*interpretation: a young man in his early 20s; Sora = "sky"*)

| Spec | |
|---|---|
| Size | 48px, head 18px. Lanky and athletic. |
| Silhouette | A wide-brim hat with a cord, a **sky-blue neckerchief** that flutters, binoculars on his chest, a radio antenna, and tall boots. |
| Head / eyes | 2×3 alert eyes, a brown iris, freckles (2 skin-line pixels per cheek). Sun-kissed. |
| Hair | Brown hair messy under the hat, with a short tail at the nape. |
| Outfit | A khaki ranger shirt (rolled sleeves, 2 patch pockets, a safari patch), olive cargo trousers, laced boots. |
| Accessories | Binoculars, a hip radio, and a **tranquil-dart flare** on his belt (for untameable beasts). Glow accent: a radio LED blink. |
| Palette (14) | SK3 `#f0c294` `#d39566` `#a5643f` · hair `#4a3324` `#2e1f16` · hat and boots `#8a7a54` `#5f5236` · shirt `#d8c99a` `#b0a070` · trousers `#5f6a3a` `#414a26` · scarf `#5fc2ff` `#2f86d6` · binoculars `#2a2a30` |
| Idle quirk | Lifts the binoculars and scans left to right (the lens glints on the 3rd frame). |
| Signature emote | **"Shh… there."** Crouches low, finger to his lips, then points (the sneaking tutorial pose). |
| Portrait | The 7 base expressions plus **alert** (eyes narrow, hand on his hat brim) and **campfire grin**. |

**(d) Do / Don't**
- **Do** give him a dedicated `sneak` walk (4 frames, crouched 6px lower), which the safari needs.
- **Don't** give him camo or a hunting rifle. He protects Tokonmon.

### 3.17 Restaurant chefs: okonomiyaki teppan chef, ramen chef, ice-cream staff

**(a) References**
- [C] Wikipedia, *Okonomiyaki* (Osaka-style; cooked on a teppan, flipped with two metal spatulas: *kote* or *hera*). https://en.wikipedia.org/wiki/Okonomiyaki
- [C] Wikipedia, *Ramen* (shop culture). https://en.wikipedia.org/wiki/Ramen
- [C] Wikipedia, *Tenugui* (the ramen chef's head towel). https://en.wikipedia.org/wiki/Tenugui
- [C] Wikipedia, *Teppanyaki* (theatrical flips and flames). https://en.wikipedia.org/wiki/Teppanyaki

**(b) Study notes**
- **Okonomiyaki chefs:**
  - wear a white jacket or tee and a headband
  - work with **two kote spatulas** at the griddle
  - finish with a **mayo zig-zag** and dancing katsuobushi flakes
- **Ramen chefs:**
  - wear a **black tee or samue**, a **tenugui tied on the head** and an apron
  - are famous for the **arms-crossed photo pose** on shop posters
  - do the **"tebo" noodle-strainer shake** (*yu-kiri*, a hard snap to drain water)

**(c) Design direction**

| Chef | Size and silhouette | Outfit and props | Palette | Idle and signature emote |
|---|---|---|---|---|
| **Okonomiyaki teppan chef** | 46px. A tall folded paper cap (2050: a white cap with a heat-resistant LED band). Spatulas held outward like twin swords. | White double-breasted jacket, black apron, red neckerchief, two kote, mayo bottle. | SK2 + `#f6f4ee` `#cfcbd8` (white) · `#2a2630` (apron) · `#e0303a` (scarf) · `#b8c0cc` `#7a8494` (steel) · `#fff2c0` (mayo) · `#8a4a22` (sauce) | Idle: taps the spatulas, clink-clink (2 frames). Emote **"Flip!"**: the okonomiyaki spins in an arc over 6 frames, lands, gets a mayo zig-zag, and flakes "dance" (FX). |
| **Ramen chef** | 48px. Arms crossed. A black tenugui knot on top of his head. | Black tee, dark navy apron, white tenugui, rubber boots. Tebo strainer. | SK3 + `#22202a` `#3a3846` (black) · `#2c3550` (apron) · `#f4f0ea` (towel) · `#c8c0b0` (strainer) · `#ffe4a0` (noodle) · `#d86a3a` (chashu) | Idle: arms crossed, one eyebrow lift. Emote **"Yu-kiri!"**: the strainer goes up and snaps down (a 4-frame whip with water droplet FX); he nods once. |
| **Ice-cream staff** (Yellow Submarine Soft-Serve crew) | 40–44px palette swaps of Yuzu's uniform frame without her swirl bun (cap only). | Same uniform. Swaps: **blue crew** `#5fa8ff`, **mint crew** `#7fe0b8`. | Yuzu ramps; replace the yellow with the swap colour. | Idle: wipes the counter. Emote: the cone hand-off. |

**(d) Do / Don't**
- **Do** give each chef one mastery motion (the flip, the strainer snap, the swirl). These carry the first-person counter zoom scenes.
- **Do** draw counter-view chefs (**waist-up, 64×64 front**) for the first-person ordering scenes. This is a separate sheet.
- **Don't** reuse the takoyaki vendor's hachimaki on all chefs. Each has their own head gear.

### 3.18 Sideline reporter and camera crew

**(a) References**
- [C] Bulbapedia, *Interviewers (Trainer class)* (a Reporter plus Cameraman pair in Gen 3–5: mic, shoulder camera). https://bulbapedia.bulbagarden.net/wiki/Interviewers_(Trainer_class)
- [C] Wikipedia, *Sideline reporter*. https://en.wikipedia.org/wiki/Sideline_reporter
- [C] Wikipedia, *Mic flag* (the branded cube on a TV microphone). https://en.wikipedia.org/wiki/Mic_flag

**(b) Study notes**
- Pokémon pairs **a reporter with a mic** and **a cameraman with a shoulder camera**: a duo silhouette.
- A sideline reporter wears **broadcast-smart clothes** (blazer), holds a **mic with a mic flag** (the branded cube), and wears an **earpiece**.
- A camera operator wears a **cap**, a **pocket vest** and **headphones**.

**(c) Design direction**

| Role | Spec | Palette |
|---|---|---|
| **Sideline reporter** | 44px, a crisp blazer, a high ponytail, an **earpiece with a cyan LED** (glow), a mic with a **cube mic-flag** carrying an original in-world network mark (placeholder "OSK-TV"). When on air she always shows her front sprite to the camera, even while sidestepping; this is a dedicated `reporting` sheet. Idle: fixes her hair. Emote **"We're live!"**: she spins to the camera with her mic out and a bright smile. | SK1 + hair `#3a2a3a` `#5a4258` · blazer `#e8344e` `#a8203a` · blouse `#f8f6f6` · skirt `#2a2a3a` · mic `#3a3a44` · flag `#ffd23a` · LED `#6ff0ff` |
| **Camera operator** | 48px stocky. Backwards cap, headphones, pocket vest, a **shoulder-mounted camera** (16×9px prop with a red tally light: the glow). Idle: pans the camera with small steps. Emote: thumbs-up from behind the camera. | SK3 + cap `#2a6fdb` · vest `#6a6a58` `#4a4a3c` · tee `#2a2a30` · camera `#3a3a44` `#1e1e26` · tally `#ff3a3a` |
| **Drone cam** (2050) | An 8×6 hovering sprite with a lens and a red tally light, and a 2-frame propeller blur. It follows the action in stadium scenes. | `#c8d0dc` `#7a8494` `#2a2a30` `#ff3a3a` |
| **Boom / audio tech** (optional) | A boom pole over the crowd and a hoodie. | Townsfolk ramps. |

**(d) Do / Don't**
- **Do** ship the reporter with a `reporting` loop (talk-bob plus mic tilt) for jumbotron cut-ins.
- **Don't** use a real network's logo or colours.

### 3.19 Stadium announcer

**(a) References**
- [C] Wikipedia, *Public address announcer*. https://en.wikipedia.org/wiki/Public_address_announcer
- [C] Wikipedia, *Ring announcer* (the theatrical "Let's get ready…" style: tux, sweeping gestures). https://en.wikipedia.org/wiki/Ring_announcer

**(b) Study notes**
- Ring and PA announcers are **showmen**:
  - formal wear (a tux or sequins)
  - a **handheld or headset mic**
  - **sweeping arm gestures**
  - a held-out final syllable

**(c) Design direction**

| Spec | |
|---|---|
| Size | 48px. Usually seen **in the booth**: a waist-up 64×48 jumbotron sheet. A full-body version is used for the halftime arena pick. |
| Silhouette | A **pompadour quiff**, a **gold sequined jacket** (glints in 1px rotation), and a bow tie. |
| Head / eyes | 2×2 eyes, a megawatt grin, a thin moustache. |
| Outfit | Gold sequined jacket (a sparkle cycle: 3 frames of shifting 1px highlights), black shirt, white bow tie, black slacks. |
| Accessories | A headset mic with a glowing boom tip (glow), and a cue card tablet. |
| Palette (12) | SK2 `#eeb68e` `#c9846a` `#8a4c3c` · hair `#2a2228` `#4a3e48` · jacket `#f6c945` `#b0802a` `#fff09a` · shirt `#1e1e28` · tie `#ffffff` · LED `#ff5fa8` |
| Idle quirk | Leans into the mic, adjusts the headset, sequins sparkle. |
| Signature emote | **"Arena… CHANGE!"** Both arms sweep wide (4 frames). Synced to the arena-select moment (rocky, grassy, water) at the start and at halftime (bible §6). |
| Portrait | The 7 base expressions plus **hype scream** (mouth huge, speed lines). |

**(d) Do / Don't**
- **Do** sync his hype emote to the music beat (bible §10 music sync).
- **Don't** let the sequins become noise. Animate only 3–4 glints at a time.

### 3.20 Stadium crowd: fans with banners, foam fingers, penlights

**(a) References**
- [C] Wikipedia, *Hanshin Tigers* (Osaka's baseball fans: yellow-and-black stripes, synchronized chants, the 7th-inning **jet-balloon release**, megaphone bats). https://en.wikipedia.org/wiki/Hanshin_Tigers
- [C] Wikipedia, *Hanshin Koshien Stadium*. https://en.wikipedia.org/wiki/Hanshin_Koshien_Stadium
- [C] Wikipedia, *Foam hand*. https://en.wikipedia.org/wiki/Foam_hand
- [C] Wikipedia, *Wotagei* (penlight waving). https://en.wikipedia.org/wiki/Wotagei
- [C] Wikipedia, *Radio Ga Ga*: the Queen crowd's **synchronized overhead double-clap** (Live Aid, 1985). It is the homage crowd move for the Champions. https://en.wikipedia.org/wiki/Radio_Ga_Ga

**(b) Study notes**
- Japanese sports crowds are **coordinated**:
  - team-colour **happi coats**
  - **towels held up or twirled**
  - **megaphone bats** clapped together
  - **choreographed chants**
- At Hanshin games, the 7th inning brings the release of **long balloons** [C].
- Idol and concert crowds use **penlights** in matched colours.
- The Queen crowd's **double clap with arms overhead** is one of the most famous crowd gestures in rock [C].

**(c) Design direction**
- **Scale:** crowd members are **mini sprites in 32×32 cells**.
  - **28px tall**, head 14px (50%).
  - 6px heads with 1×2 eyes (or a single 1px dot) and no outline on interior features.
  - **Max 8 colours each**, palette-swappable.
- **Bases:**
  - 4 body bases: kid, teen, adult, big adult.
  - 6 hair silhouettes: short, long, bun, cap, perm, mohawk.
  - 2 genders of clothing cut.
- **Clothing:** happi coat, jersey, hoodie or tee, in **team colours**.

**Props (one per fan):**

| Prop | Size |
|---|---|
| Banner | 2 fans hold a 20×8 cloth between them |
| Foam finger | 4×7 |
| Penlight | 1×4 glowing; the bloom target |
| Towel | 8×3 |
| Megaphone bats | pair |
| Paper fan | |
| Phone-light | |
| Jet balloon | 12px-long tube that flies off in the halftime FX |

**Animations, all at 12 fps:**

| Animation | Frames | Timing |
|---|---|---|
| `idle` | 2 | 4 ticks each |
| `cheer` | 4 | 1 tick each: arms up plus a jump of 2px |
| `wave` | 6 | for the stadium wave; **offset per seat column** |
| `clap-overhead` | 2 | double-clap synced to beats; the Queen homage |
| `penlight-sway` | 4 | |
| `boo` | 2 | |
| `gasp` | 1, held | |

- **Team colour sets** (swap the main and secondary):

  | Team | Main | Secondary |
  |---|---|---|
  | Pyro | `#e5383b` | `#ffd23a` |
  | Hydro | `#2a6fdb` | `#7fe0ff` |
  | Bio | `#4cbf4a` | `#f4f0ea` |
  | Geo | `#b07a3a` | `#3a2a22` |
  | Echo | `#c070ff` | `#ff6fb5` |
  | League | `#1a2240` | `#f2c14e` |

- **Rows:** fill the rows with a **randomised mix** (no two neighbours with the same base and palette).
  - Rows further back are drawn **1px darker**, with more desaturated palettes, which helps the depth of field.

**(d) Do / Don't**
- **Do** offset the animation start frames per fan, so the crowd never pulses in unison except on purpose (claps and the wave).
- **Do** keep crowd sprites **without** soul-stone bracelets, except in "superfan" variants.
- **Don't** reproduce real team logos (Hanshin's) or real chant lyrics. Use colour and gesture only.

### 3.21 Osaka 2050 townsfolk variety

**(a) References**
- [C] Wikipedia, *Japanese school uniform* (gakuran, sailor fuku, blazer). https://en.wikipedia.org/wiki/Japanese_school_uniform
- [C] Wikipedia, *Randoseru* (the hard elementary-school backpack; kids also wear **yellow safety hats**). https://en.wikipedia.org/wiki/Randoseru
- [C] Wikipedia, *Chindon'ya* (Japanese costumed street-advertising musicians: a perfect street-performer base). https://en.wikipedia.org/wiki/Chindon%27ya
- [C] Wikipedia, *Kuidaore Taro* (the Dotonbori clown drummer). https://en.wikipedia.org/wiki/Kuidaore_Taro
- [C] Wikipedia, *Mamachari* (the Japanese city bicycle with a front basket). https://en.wikipedia.org/wiki/Mamachari
- [C] Wikipedia, *Japanese street fashion* (Amemura and Harajuku layering, decora). https://en.wikipedia.org/wiki/Japanese_street_fashion

**(b) Study notes**
- Japan's schoolwear:
  - **gakuran:** black, standing collar, gold buttons
  - **sailor fuku:** navy collar, red or navy scarf, pleated skirt
  - **blazer uniforms:** plaid skirt or trousers, ribbon or tie
- Primary-school kids wear a **randoseru** and a **yellow cap** for traffic safety.
- Osaka streets have **chindon'ya**-style costumed performers, **mamachari** bikes with baskets, tourists with cameras, and salarymen.

**(c) Design direction: the townsfolk kit**
- Townsfolk are adults at 44–46px, teens at 42px and kids at 35px.
- Each uses **10 colours max**, built from shared ramps plus **one 2050 accent**.
- Design 2–3 palette swaps per type.

| Type | Silhouette and one-prop | Key colours | 2050 accent | Idle and emote |
|---|---|---|---|---|
| **Gakuran student** | Standing collar, gold buttons, a satchel slung low | `#1e1e2a` `#34344a` · buttons `#f2c14e` | LED-piped collar edge | Leans on a wall; yawns |
| **Sailor-fuku student** | Big sailor collar plus a red scarf bow | navy `#23305e` · white `#f8f6f0` · scarf `#e0384a` | Holo-hairpin | Phone selfie; peace sign |
| **Blazer student** | Blazer, plaid skirt or trousers, loafers | `#2a3a6a` · plaid `#8a2a3a` `#3a4a7a` | Earbuds glow | Bounces to music |
| **Primary-school kid** | **Yellow cap plus a red or black randoseru** | `#ffd23a` · `#c8323e`/`#22202a` | Randoseru reflector strip | Runs in place; points at Tokonmon |
| **Tourist** | Sun hat, backpack, big camera, map | khaki `#d8c99a` · shirt `#5fc2ff` | AR translation glasses | Takes a photo (flash FX); bows clumsily |
| **Office lady** | Pencil skirt, lanyard, tote bag | `#4a4a5e` · blouse `#f2f4f8` · tote `#c89a6a` | Smartwatch | Sips coffee; checks the time |
| **Salaryman extras** | Palette swaps of Tanaka's base (§3.12) | grey `#5a5a66`, brown `#5a4632` | — | Commute walk; bow |
| **Grannies** | Kappōgi, perm, shopping cart | Fuku ramps swapped | — | Shuffle; hands out candy |
| **Mamachari mom** | City bike with a child seat (bike: 32×20 prop sprite) | `#ff9ab0` · `#5fc2ff` | E-bike battery LED | Bell ring (2 frames) |
| **Street performer: drummer clown** | Original Dotonbori clown drummer: a striped tunic, a **pointed hat**, round glasses, a chest drum | `#e8443a` `#f4f0ea` stripes · drum `#d8a040` | Drumhead LED ring | 4-frame drumming loop |
| **Street performer: busker** | Acoustic guitar, an open case with coins | denim `#4a6aa8` | Holo-tip jar | Strum loop |
| **Street performer: robot dancer** | Silver face paint, mechanical "popping" moves | `#c8d0dc` `#7a8494` | Visor stripe | 6-frame popping loop |
| **Street performer: hologram juggler** | Juggles 3 holo-orbs (FX) | `#2a2a3a` · orbs `#6ff0ff` | Orbs | Juggling loop |
| **Decora kid** (Amemura) | Clips and badges all over, layered pink and pastels | `#ff9ad5` `#ffe45a` `#7fe0ff` | Light-up sneakers | Hops |
| **Delivery drone courier** | A rider in a helmet plus a hovering box drone | `#ff9d42` · `#2a2a30` | Drone lights | Hands off a parcel |

**(d) Do / Don't**
- **Do** ensure every townsfolk type is distinguishable from the named cast. They have **simpler hair (2 tones)** and **no portrait-grade face detail**.
- **Do** keep 2050 accents subtle. This is Osaka *plus* a light future layer, not cyberpunk neon everywhere.
- **Don't** use real school crests, brand logos or the Kuidaore Taro design itself.

---------------------------------------------------------------------------------------------------

## 4. Team Metallica and the metal bullies (Topic 4)

**Bible facts:**
- Team Metallica is a **punk gang that bullies people and collects money**: **Thrash** (leader), **Riff** and **Moshi**.
- There are **a lot of other bullies with metallic styles**.
- **Moshi, the softie who feeds stray cats, can be befriended.**
- The partner Tokonmon listed for Team Metallica and the metal bullies:
  - Studrat (Ferro)
  - Moshbull (Geo)
  - Thrashark (Hydro)
  - Marionoir (Ecto, "Master of Puppets")
  - Sandmare (Ecto/Geo, "Enter Sandman")
  - Ironmaw (Ferro, "Iron Man")
- *Pairings below are suggestions only. The bible does not assign partners to individual bullies.*

### (a) References
- [C] Wikipedia, *Metallica* (band history; the 1980s thrash era). https://en.wikipedia.org/wiki/Metallica
- [C] Wikipedia, *Kill 'Em All* (1983), *Ride the Lightning* (1984), *Master of Puppets* (1986): the classic thrash-era looks and photo shoots. https://en.wikipedia.org/wiki/Kill_%27Em_All · https://en.wikipedia.org/wiki/Ride_the_Lightning · https://en.wikipedia.org/wiki/Master_of_Puppets
- [C] Wikipedia, *Cliff Burton* (bell-bottom jeans, long hair, a headbanging stage presence). https://en.wikipedia.org/wiki/Cliff_Burton
- [C] Wikipedia, *Thrash metal*. https://en.wikipedia.org/wiki/Thrash_metal
- [C] Wikipedia, *Heavy metal fashion* (denim and leather, studs, bullet belts, band tees, high-tops). https://en.wikipedia.org/wiki/Heavy_metal_fashion
- [C] Wikipedia, *Battle jacket* (the "kutte": a sleeveless denim vest covered in patches with a big back patch). https://en.wikipedia.org/wiki/Battle_jacket
- [C] Wikipedia, *Sign of the horns* (the metal hand salute). https://en.wikipedia.org/wiki/Sign_of_the_horns
- [C] Wikipedia, *Corpse paint* (black-metal face paint). https://en.wikipedia.org/wiki/Corpse_paint
- [C] Wikipedia, *Glam metal* (teased hair, spandex, makeup, scarves). https://en.wikipedia.org/wiki/Glam_metal
- [C] Wikipedia, *Nu metal* (baggy jeans, tracksuits, dreadlocks, backwards caps, chain wallets). https://en.wikipedia.org/wiki/Nu_metal
- [C] Wikipedia, *Punk fashion* (mohawks, safety pins, tartan bondage trousers, painted leather jackets). https://en.wikipedia.org/wiki/Punk_fashion
- [C] Wikipedia, *Visual kei* (Japanese rock: dramatic hair, gothic and androgynous costume). https://en.wikipedia.org/wiki/Visual_kei
- [C] Wikipedia, *Cybergoth* (goggles, synthetic hair falls, PVC, UV colours). https://en.wikipedia.org/wiki/Cybergoth
- [C] Bulbapedia, *Team Skull* (Pokémon's comedic bully gang: matching gang look, exaggerated poses, gang hand-signs). https://bulbapedia.bulbagarden.net/wiki/Team_Skull
- [C] Bulbapedia, *Team Yell* (punk superfan gang: face paint, matching black-and-pink). https://bulbapedia.bulbagarden.net/wiki/Team_Yell
- [C] Bulbapedia, *Roxie* and *Piers* (Pokémon punk-rock gym leaders: stage props, rock poses kept kid-friendly). https://bulbapedia.bulbagarden.net/wiki/Roxie · https://bulbapedia.bulbagarden.net/wiki/Piers
- [C] Bulbapedia, *Roughneck (Trainer class)* and *Biker (Trainer class)*. https://bulbapedia.bulbagarden.net/wiki/Roughneck_(Trainer_class) · https://bulbapedia.bulbagarden.net/wiki/Biker_(Trainer_class)

### (b) Study notes (prior knowledge; verify in the follow-up pass)

**The 1983–86 thrash look (Kill 'Em All, Ride the Lightning, Master of Puppets):**
- **Long straight hair** down past the shoulders, worn for **headbanging**.
- **Black band tees**, tight **light stonewash jeans** (Cliff Burton's were **bell-bottoms**) and **white high-top sneakers**.
- **Sleeveless denim battle vests** or **leather biker jackets**, **studded wristbands** and **bullet belts**.
- Overall it is **street-casual**: tees, jeans and sneakers rather than costumes. "Denim and leather" is the core.

**The Master of Puppets cover:** a field of grave crosses with **puppet strings descending from a pair of hands**. Its graphic language belongs to **Marionoir** (the Tokonmon), not to the people.

**Later eras (not used):** the 1991 "Black Album" (all black, shorter hair) and Load (1996, short hair, suits, eyeliner) are noted only to **avoid**. The 80s thrash look is the iconic one for a punk gang.

**The battle vest:**
- A **back patch** (the big emblem across the back) surrounded by small rectangular patches.
- **Pyramid studs** along the seams, **pins** on the lapels, and cut-off sleeves with **frayed armholes**.

**Corpse paint:**
- A **white face base** with **black around the eyes and mouth**, and sometimes black lines down the face.
- Worn with **spiked gauntlets**, black leather and long black hair.

**Glam metal:** **huge teased hair**, headbands, **spandex** (leopard and zebra), scarves, eyeliner and lipstick, cropped jackets with fringe.

**Nu-metal:**
- **Baggy wide jeans**, **chain wallets**, tracksuits, a **backwards red cap**, dreadlocks or frosted spikes, goatees, piercings.
- Also the **jumpsuit-and-masks** gang look (Slipknot) [C].

**Punk:**
- **Mohawk / liberty spikes**, **safety pins**, tartan bondage trousers with straps.
- A **painted leather jacket** and **Dr. Martens**-style boots.

**Visual kei:** asymmetric dramatic hair, **gothic aristocrat** coats, lace, platform boots and heavy eye makeup. Visual kei is Japan's own rock look, so it suits a gang in Osaka.

**Pokémon precedent:**
- **Team Skull** and **Team Yell** prove that a **bully gang** works for all ages when the members:
  - are **comedic**
  - share a **uniform motif** (the skull bandana, the face paint)
  - strike **exaggerated poses**
  - have **one or two "softie" members**

### (c) Design direction: shared Team Metallica language

**Team look:**
- **Washed denim plus black plus silver studs plus one red accent.**
- Every member wears a **sleeveless denim battle vest with the team back patch**.

**Team emblem (original):**
- A **spiked guitar-pick shield** with **two crossed lightning bolts** and jagged custom lettering "TEAM METALLICA".
- Never use Metallica's real logo shape: no long-armed "M" and "A".

**Kid-friendly swaps:**

| Real metal item | Tokonmon version |
|---|---|
| Bullet belts | **guitar-pick belts** (rows of 2×3 picks) or **bottle-cap belts** |
| Spikes | blunt cone studs |
| Occult symbols | none; use lightning, picks, skull-*cartoons* and gears |

**Money collecting:** shown with a **spiked "dues jar"** prop (a jar with a padlock) and a **coin flip**.

**Gang emote, shared:** the **"🤘 Horns up!"** pose. It is 3 frames:
1. Crouch.
2. Both hands throw the horns.
3. Headbang hair flip.

### 4.1 Thrash: the leader

| Spec | |
|---|---|
| Size | 48px, head 18px (38%). Long-legged and lean. Shoulders squared with a stomp-forward stance. |
| Silhouette | **Waist-length straight black hair** (the silhouette is a cape of hair). Spiky bangs over the eyes. The vest is open, and a **guitar-shaped club** (a flying-V shape) is slung on his back. |
| Head / eyes | Eyes mostly hidden under the bangs. When visible: 2×2, red iris, a hard flat brow. A sneer: 1px asymmetric mouth. |
| Hair | Jet black with a blue-violet highlight band (3 tones). It **whips 2 frames late** in every motion; the headbang is his key animation. |
| Outfit | Stonewash denim battle vest with patches, the **team back patch** and seam studs. A black tee with an original "lightning skull" print. **Light acid-wash ripped jeans.** **White high-tops.** |
| Accessories | A **guitar-pick belt**, spiked wristbands, a chain wallet. A smartwatch hacked to show a "DUES" counter (glow accent, red). |
| Palette (14) | SK2 `#eeb68e` `#c9846a` `#8a4c3c` · hair `#1a1620` `#2e2836` `#4e4660` · vest `#5a7ab0` `#3e5a8a` · jeans `#9ab4dc` · tee `#22202a` · studs `#d8dee8` `#8a94a8` · red accent `#e0303a` · high-tops `#f4f2ee` |
| Idle quirk | Cracks his knuckles and taps his foot, then a single headbang every few seconds. |
| Signature emote | **"Pay up!"** He points straight at the player, then cups his palm and beckons (a 3-frame "gimme"). The second emote is the full **headbang** (6 frames, hair whipping). |
| Portrait | The 7 base expressions plus **snarl** (teeth, 💢), **gloating** (chin up, eyes half-shut), and **defeated** (hair falls over his whole face, with a single sweat drop). |
| Partners (*suggestion*) | **Thrashark** (Hydro) and **Ironmaw** (Ferro). |

### 4.2 Riff: the greedy guitarist

| Spec | |
|---|---|
| Size | 45px, wiry and hunched forward (a weasel energy). |
| Silhouette | A **big curly black hair poof** held back by a **red bandana**. A **studded leather jacket over the vest** with spiky shoulders. A battered guitar is always in hand. |
| Head / eyes | 2×2 shifty eyes (they glance left and right in idle). A snaggletooth grin (1px fang). |
| Hair | Curly mass: a round silhouette built from 1px curl highlights. |
| Outfit | A black leather jacket with silver shoulder spikes, the team vest underneath (visible at the back), a ripped white tee, black skinny jeans with knee rips, pointed boots. |
| Accessories | A purple pointy guitar (an original body shape), and the **padlocked dues jar** clipped to his belt. Glow accent: the guitar's LED fret markers. |
| Palette (14) | SK1 `#f9cfb0` `#e0a084` `#a8624e` · hair `#2a1e26` `#463440` · bandana `#c8283a` `#8a1a2a` · leather `#2a2630` `#3e3a48` `#5a5668` · spikes `#d8dee8` · tee `#e8e4ea` · guitar `#6a3ab8` `#42207a` · coins `#ffd23a` |
| Idle quirk | **Flips a coin** (a 4-frame arc with a glint), catches it, and checks it greedily. |
| Signature emote | **"Shred!"** A knee-slide air-guitar solo (6 frames) with music-note FX. |
| Portrait | The 7 base expressions plus **greedy** (coin-eyes: ¥-shaped highlights), **sly**, and **panicked** (the dues jar is stolen back). |
| Partners (*suggestion*) | **Studrat** (Ferro) and **Marionoir** (Ecto). |

### 4.3 Moshi: the softie who feeds stray cats (befriendable)

| Spec | |
|---|---|
| Size | **52px, wide (30px)**. The biggest gang member, with a round, soft shape (the opposite of Thrash's sharp lines). |
| Silhouette | A **black beanie with two knitted cat-ear bumps** (a secret soft tell), an **oversized hoodie** under the team vest, and a **slouch**. He holds his hands together near his chest. |
| Head / eyes | **Bully state:** a long fringe hides his eyes, so only a 1px nervous mouth shows. **Soft moments and befriended state:** the fringe parts to show **big gentle 2×3 eyes** with a warm brown iris and an extra highlight (the most "anime-soft" eyes in the gang). |
| Hair | Dark, soft and long at the front, sticking out under the beanie. |
| Outfit | An oversized charcoal hoodie with sleeve-paws, the team vest worn **crooked** with **one hand-sewn cat patch** among the metal patches (pink, crooked stitches: the visible soft side). Baggy jeans and scuffed high-tops. **2–3 white cat-hair pixels** on his sleeves. |
| Accessories | Fish-shaped cat treats peek out of the hoodie pocket. A **stray kitten sprite** (10×8) appears near him in alley scenes, in his hood when befriended. Glow accent: none until befriended, then a soft-pink **cat-paw charm** on his bracelet. |
| Palette (14) | SK4 `#c48a5e` `#9a6340` `#6e4128` · hair `#2a2026` `#45363e` · beanie `#2e2a36` `#48425a` · hoodie `#3a3646` `#26222e` · vest `#4a6aa0` `#34507e` · cat patch `#ff9ab0` · cat hair `#f4f0e6` · treat `#ff9d42` |
| Idle quirk | **Bully state:** fidgets with his sleeves and looks at the ground. **Alley state:** crouches, and the kitten rubs against his leg. |
| Signature emote | **"…here, kitty."** He kneels, opens a treat, the kitten eats, and a heart pops above Moshi (not the cat). He looks around nervously to check nobody saw (the comedic tell). |
| Befriended state | The hood comes down, the fringe is clipped back with a **cat-ear hair clip**, the vest is worn straight, and the kitten rides on his head or in his hood. The palette stays the same, so he is recognisable, but the posture **stands up straight**. |
| Portrait | The 7 base expressions plus **blush-flustered** (caught being nice), **gentle smile** (eyes revealed; the bond beat), and **teary** (when the cats are threatened). His "angry" is protective, never cruel. |
| Partner (*suggestion*) | **Moshbull** (Geo): big, soft-hearted, and a mosh-pit bull. |

### 4.4 Metal-bully archetypes (8): the "lots of other bullies"

**Shared rules for all eight:**
- **Size:** 44–48px (bruisers up to 54px).
- **Palette:** 10–12 own colours.
- **Variants:** each archetype gets a **male and female variant** and **2 palette swaps**.
- **Kit:** the **trainer battle poses** (§3) plus one archetype emote.
- **Membership:** none of these are Team Metallica members, so they have **no team back patch** (that marks the gang).

| # | Archetype | Silhouette and outfit | Palette | Archetype emote | Partner (*suggestion*) |
|---|---|---|---|---|---|
| 1 | **Thrash Grunt ("Denim Wolf")** | Long hair or a shaved head with a bandana. A denim battle vest with random patches (no team emblem), a black tee, stonewash jeans, high-tops. A pick belt. | `#5a7ab0` `#3e5a8a` `#9ab4dc` · `#22202a` · `#d8dee8` `#8a94a8` · `#f4f2ee` · `#e0303a` | **Air-drum blast-beat** (4 frames, 1 tick each) | Studrat |
| 2 | **Black-Metal "Corpsepaint"** | Long straight black hair. A **white face with black eye-patches and mouth paint** (original patterns: thorn and moon shapes, not copied from real musicians). A long black leather coat. **Blunt cone-spiked gauntlets** up to the elbows. Grim, but comedic: they are always cold. | `#f4f2f6` `#c8c4d4` (paint) · `#16141c` `#2a2632` `#4a4658` (leather and hair) · `#d8dee8` `#8a94a8` (spikes) · `#7ac8ff` (frost breath) | **"Grim pose"**: arms up in a stiff claw pose, then a frost-breath puff, then a shiver | Sandmare |
| 3 | **Glam "Hairspray"** | **Huge teased hair** (+8px of volume; blond or red), a headband, a cropped fringed jacket, **leopard or zebra spandex**, a scarf, eyeliner and lipstick, platform boots. Carries a hairspray can. | `#ffe08a` `#f2a83a` (hair) · `#ff5fa8` `#c83a84` (spandex) · leopard `#f2b43a` `#3a2418` · scarf `#7fe0ff` · `#f4f0f8` · eyeliner `#2a1a3a` | **Hair flip and hairspray** (the spray FX fogs the screen 1 tick) and a kissy pout | Ironmaw |
| 4 | **Nu-Metal "Wallet Chain"** | **Very baggy wide jeans** dragging over the shoes, a **long chain wallet** loop, an oversized jersey or tracksuit top, a **backwards red cap** or dreadlocks, a goatee, an eyebrow piercing. | `#3a4a7a` `#2a3458` (baggy denim) · `#e0303a` (cap) · `#f4f2ee` `#c8c4d4` (jersey) · `#2a2a30` (stripes) · `#d8dee8` (chain) · `#c6ff4a` (dread beads) | **Crossed-arms jump** (6 frames) with a "nod-nod" bounce | Moshbull (second one) |
| 5 | **Street Punk "Safety Pin"** | **Liberty-spike mohawk** (5 spikes, neon green or pink), a **painted leather jacket** with safety pins, **tartan bondage trousers** with straps, chunky boots, a studded collar. | `#a6ff3a` `#5ac81a` (mohawk) · `#2a2630` `#4a4658` (leather) · tartan `#c8283a` `#2a2a40` `#ffd23a` · `#d8dee8` (pins) · `#5a3a2a` (boots) | **Tongue out and both thumbs to the nose** (a cheeky raspberry), with a mohawk wobble | Studrat |
| 6 | **Visual-Kei "Gothika"** (Japan's own) | **Asymmetric dramatic hair** (one side to the chin, one side to the waist; silver with crimson tips), a **gothic aristocrat coat** with lace cuffs and crosses replaced by **rose and key motifs**, platform boots, heavy eyeliner. | `#e8e8f4` `#b4b4cc` (silver hair) · `#c8102e` (tips) · `#1e1a28` `#3a3046` (coat) · `#f4eef4` (lace) · `#8a1a3a` (rose) · `#ffd23a` (key) | **Dramatic hand over the face** (2 frames), then a rose-petal FX burst | Marionoir |
| 7 | **Biker Bruiser "Chains"** (54px) | A big build, a **leather biker vest over a bare chest-tee**, **chains crossed over his chest**, mutton-chop sideburns, wraparound shades, fingerless gloves, engineer boots. | SK3 + `#2a2630` `#4a4658` (leather) · `#8a94a8` `#d8dee8` (chains) · `#1e1e26` (shades) · `#ff9d42` (shade glint) · `#5a3a2a` (boots) | **Chain twirl** (a 4-frame overhead loop) and a slam on the ground (dust FX) | Ironmaw |
| 8 | **Cyber-Metal "Chrome"** (the 2050 metalhead) | **Fibre-optic glowing hair falls** (cybergoth), **LED-strip goggles**, chrome shoulder plates, a PVC long coat, cable-laced boots, and a **hacked guitar-gun-shaped synth keytar** (no weapons: it shoots notes). | `#2a2a3a` `#4a4a60` (PVC) · `#dfe6f0` `#8a96aa` (chrome) · `#ff3ab4` `#6ff0ff` (fibre-optic glow) · `#c6ff4a` (goggle LED) | **Goggle flash** (a screen-tint tick), then a keytar riff with note FX | Ironmaw or Studrat |

**Female variants:** keep the same silhouette signature (hair, vest, gauntlets), and do not change it into a "cute" version.
- Glam women get even bigger hair.
- Punk women get twin mohawk buns.
- Corpsepaint women get long braids with spiked hair-ties.

### (d) Do / Don't
- **Do** make every bully readable from **one silhouette hook**: the hair cape, the curl poof, the mohawk, the teased hair, the baggy jeans, the gauntlets, the chains, the glowing hair falls.
- **Do** keep them **comedic-menacing** (Team Skull and Team Yell energy). They lose with funny defeat poses.
- **Do** make Moshi's soft tells visible **from the first meeting** (the cat-ear beanie, the cat patch, the cat hair), so befriending him feels earned rather than random.
- **Don't** use real band logos, album art, real musicians' faces or real corpse-paint designs.
- **Don't** include bullets, real weapons, occult or religious symbols (inverted crosses, pentagrams), cigarettes or alcohol.
- **Don't** let all bullies wear black. Each archetype owns a colour family: denim blue, white/black, leopard and pink, red cap, neon mohawk, crimson-silver, leather-and-steel, and neon glow.

---------------------------------------------------------------------------------------------------

## 5. Elite Four "The Beatles" (Topic 5)

**Bible facts:**
- The Elite Four are an **in-world Beatles tribute band of master trainers** with the stage names **John, Paul, George and Ringo**.
- They are styled after the **Sgt. Pepper / Abbey Road** looks.
- The Beatles partner Tokonmon listed in the bible: **Yellowsub** (Hydro/Ferro), **Blackbyrd** (Aero) and **Lucydiamond** (Astro/Cryo).
- They have an epic Elite Four theme inspired by Beatles songs: an original melody, music-synced.

### (a) References
- [S] The Paul McCartney Project, *Cover shoot for Sgt. Pepper's Lonely Hearts Club Band* (March 1967). https://www.the-paulmccartney-project.com/1967/03/cover-shoot-for-sgt-peppers-lonely-hearts-club-band/
- [S] Amateur Photographer, *Greatest album photography: Sgt. Pepper's*. https://amateurphotographer.com/iconic-images/greatest-album-photography-sgt-peppers-lonely-hearts-club-band-by-the-beatles/
- [S] Meet the Beatles for Real, *Sgt. Pepper suits*. http://www.meetthebeatlesforreal.com/2017/06/sgt-pepper-suits.html
- [S] Costumer's Guide, *Sgt. Pepper (Beatles)*. http://www.costumersguide.com/cr_pepper.shtml
- [S] BeatleStyle, *1967 John's Sgt. Pepper suit* (green satin, red rope and details). https://www.beatlestyle.com/shop/clothing/suits/1967-johns-sgt-pepper-suit/
- [S] Carbon Costume, *Sgt. Pepper's Lonely Hearts Club Band costume guide*. https://carboncostume.com/sgt-peppers-lonely-hearts-club-band/
- [S] Wikipedia, *List of images on the cover of Sgt. Pepper's Lonely Hearts Club Band* (instruments held). https://en.wikipedia.org/wiki/List_of_images_on_the_cover_of_Sgt._Pepper%27s_Lonely_Hearts_Club_Band
- [S] Far Out, *Why is Paul McCartney barefoot on the Abbey Road cover?* https://faroutmagazine.co.uk/why-is-paul-mccartney-barefoot-abbey-road/
- [S] Sotheby's 2016 Rock & Roll lot 13 (Abbey Road: Paul barefoot in 4 of 6 frames, sandals in 2). https://www.sothebys.com/en/auctions/ecatalogue/2016/rock-roll-n09587/lot.13.html
- [S] Lelands, *Ringo Starr Abbey Road black suit jacket*. https://lelands.com/bids/ringo-starr-abbey-road-black-suit-jacket
- [S] Wikipedia, *List of the Beatles' instruments*. https://en.wikipedia.org/wiki/List_of_the_Beatles%27_instruments
- [S] Guitar World, *The Beatles: guitar by guitar*. https://www.guitarworld.com/features/the-beatles-guitar-by-guitar-a-guide-to-the-models-that-made-music-history
- [S] Beatles Bible forum (Ringo's Ludwig "Black Oyster Pearl"). https://www.beatlesbible.com/fab-forum/forum-games/the-bakers-dozen/page/25/
- [S] The Rake, *Suited and Booted: the Beatles' early style*. https://therake.com/stories/icons/beatles/
- [S] The Blue Moment, *Collarless Beatles*. https://thebluemoment.com/2020/12/30/collarless-beatles/
- [S] UNT Libraries, *The Cardin Beatle Boot*. https://omeka.library.unt.edu/s/Step-in-Time/page/west-beatle-boot
- [S] AARP, *Beatles suits*. https://www.aarp.org/entertainment/music/beatles-suits/
- [S] Far Out, *The album cover that showed The Beatles as "fully-fledged potheads"* (Rubber Soul). https://faroutmagazine.co.uk/the-album-cover-the-beatles-potheads/
- [S] NYPL, *The Beatles as fashion gurus*. https://www.nypl.org/blog/2014/05/02/beatles-fashion-gurus
- [S] Wikipedia, *Windsor glasses*. https://en.wikipedia.org/wiki/Windsor_glasses
- [S] Sotheby's 2020, *John Lennon pair of round Windsor spectacles*. https://sothebys.com/en/buy/auction/2020/the-beatles/john-lennon-pair-of-round-windsor-spectacles
- [S] Lambiek, *Heinz Edelmann* (*Yellow Submarine* 1968 film design). https://www.lambiek.net/artists/e/edelmann_heinz.htm
- [C] Wikipedia, *Abbey Road* (album cover: the zebra crossing, August 1969). https://en.wikipedia.org/wiki/Abbey_Road
- [C] Wikipedia, *Sgt. Pepper's Lonely Hearts Club Band*. https://en.wikipedia.org/wiki/Sgt._Pepper%27s_Lonely_Hearts_Club_Band

### (b) Study notes

**Sgt. Pepper uniforms (1967):**
- **Satin military-bandsman** tunics made by theatrical costumier **M. Berman Ltd.**
- The colours were self-chosen ("no specific reason behind who wore what colour"). They are described as fluorescent-sock brights: "very pink, very turquoise, very yellow".
- Per-member colours, by consensus of the sources:

  | Member | Colour | Detail | Source note |
  |---|---|---|---|
  | **John** | **green** | red rope and red details | One costume site says yellow; green is the majority |
  | **Paul** | **blue** | white details | |
  | **George** | **red-orange** | white accents | |
  | **Ringo** | **pink** | **lime-green chevrons**, gold braid and medals | |

- All four wore **moustaches** in this era [C].

**Sgt. Pepper cover instruments:**
- John: **French horn**
- Ringo: **trumpet**
- Paul: **cor anglais**
- George: **piccolo** or flute (sources differ)

**Abbey Road (1969):** they crossed in the order John, Ringo, Paul, George [C].
- **John:** an all-**white suit**.
- **Ringo:** a **black suit**.
- **Paul:** a suit, **barefoot** (sandals in 2 of 6 frames).
- **George:** **denim** top and bottom.
- The suits were by Savile Row's **Tommy Nutter**.

**1963 mop-top era:**
- A **grey collarless suit** (Cardin-inspired, made by tailor **Dougie Millings**) with **pearl buttons** and **slim trousers**, a **white shirt** and a **black tie**.
- **Beatle boots**: Chelsea boots with a **pointed toe** and a **~1-inch Cuban heel**.
- The **mop top** fringe.

**Rubber Soul / Revolver (1965–66):**
- **Suede jackets** (John's brown suede on the *Rubber Soul* cover).
- **Turtlenecks** replace white shirts; George is the turtleneck one.
- Shaggier hair, and colour starts to enter the wardrobe.
- In 1966: flowery ties, velvet and plush.

**John's glasses:** round **Windsor** ("granny") glasses, worn in public from **1966** (*How I Won the War*). Earlier he wore contact lenses.

**Instruments:**

| Member | Instrument | Details |
|---|---|---|
| **John** | **Rickenbacker 325** | Short-scale, refinished **black** in 1963 |
| **Paul** | **Höfner 500/1 "violin" bass** | **Left-handed**, sunburst |
| **George** | **Gretsch Country Gentleman** | Dark walnut hollow-body with f-holes |
| **Ringo** | **Ludwig drums** | "**Black Oyster Pearl**" finish |

**Yellow Submarine (1968 film):** designed by **Heinz Edelmann**, in flat pop-art psychedelia.

**Song ties for the bible's partners** [C]:
- **Ringo** sang lead on "Yellow Submarine": **Yellowsub**.
- **Paul** wrote and sang "Blackbird": **Blackbyrd**.
- **John** wrote "Lucy in the Sky with Diamonds": **Lucydiamond**.
- George has **no partner listed in the bible**. Flagged in §10. His song motif would be "Here Comes the Sun" (sun), which already echoes Beatlet's **Harrisun** form (Pyro, "dojo meditation, then sunrise").

### (c) Design direction: shared Elite language

**Battle outfit = a Pepper-style satin bandsman tunic** in each member's colour.
- **Gold braid frogging** across the chest (3 horizontal 1px loops).
- **Epaulettes** (3px gold fringe).
- **One medal** each.
- Slim dark trousers and **Beatle boots** (pointed toe, 1px heel).

**Entrance / League lobby outfit = "Crosswalk" (the Abbey Road homage):**

| Member | Crosswalk outfit |
|---|---|
| John | white suit |
| Ringo | black suit |
| Paul | grey suit, barefoot |
| George | double denim |

- **Entrance cutscene:** the four walk single file across a **zebra crossing** in front of the stadium (left to right, in that order), then flash into Pepper tunics.
- This is a **gesture homage only**: different street, 2050 Osaka backdrop, no recreation of the photo's framing.

**Hair:** all four wear **late-60s hair**: longer than a mop top, with distinct shapes (below).
- **Moustaches:** 2px, optional per member, all on by default as a Pepper nod.

**Instrument props:**
- These are **original shapes that echo the real silhouettes**.
- **Never trace the real guitar outlines or headstocks.**
- Each Elite has **one stage instrument** for battle and **one Pepper brass or wind prop** for a single special emote.

**Arena dressing (for the maps team):** a Pepper-bright bandstand with flowers, brass and bunting in the four tunic colours. Avoid the real cover's collage and drum-skin design.

**Scale:**
- Elites are adult masters at **44–47px**, with **head 18px**.
- Heads are slightly **less** chibi (39%) than the teens, so the masters read as older.

#### 5.1 Elite "John"

| Spec | |
|---|---|
| Size | 47px. Lean. |
| Silhouette | **Centre-parted straight hair to the jaw**, framing the face like curtains. **Big round wire glasses** (two 4×4 circles: the key read). A narrow-shouldered tunic. |
| Head / eyes | Eyes are seen **through** the lenses: 2×2, a calm half-lid, with a lens glint pixel (amber tint). Thin 2px moustache. |
| Outfit | **Green satin** tunic, **red rope frogging**, gold epaulettes and buttons, dark trousers, Beatle boots. Crosswalk outfit: **white suit** with white sneakers. |
| Instrument | A **black short-scale guitar** (an original body: compact, with 3 knobs and a single cutaway). Special emote prop: a **French horn**. |
| Accessories | Amber-tinted round glasses. A small **diamond-sparkle brooch** (the Lucydiamond tie; glow accent: cyan-white sparkle). |
| Palette (14) | SK1 `#f9cfb0` `#e0a084` `#a8624e` · hair `#6a4a2e` `#4a3220` `#9a7048` · tunic `#52c14e` `#2f8a3a` `#a6e86a` · rope `#e23a3a` · gold `#f4c542` `#b8862a` · lens `#ffcf6a` · sparkle `#bff4ff` · *Crosswalk swap:* suit `#f6f4ee` `#d0ccc4` |
| Idle quirk | Lowers his glasses with one finger, peeks over them, then pushes them back up (lens glint). |
| Signature emote | **"Peace."** A single-hand **peace sign** raised high and a glasses flash. His eyes look up to the sky, and diamond sparkles drift down (Lucydiamond cue). |
| Portrait | The 7 base expressions plus **deadpan wit** (one brow up, flat mouth), **dreamy** (looking up, sparkles in his lenses), and **sharp** (glasses pulled down, piercing eyes). |
| Partner | **Lucydiamond** (Astro/Cryo). Song tie: [C]. |

#### 5.2 Elite "Paul"

| Spec | |
|---|---|
| Size | 46px. |
| Silhouette | A **rounded mop-top dome** with full straight bangs to the eyebrows. **Big round expressive eyes and arched brows** (the "boyish charm" read). The **violin-shaped bass** is held **left-handed**. |
| Head / eyes | 2×3 eyes (the largest of the Elites) with a highlight. Arched 1px brows that rise in every emote. A neat thin moustache. |
| Outfit | **Light-blue satin** tunic, **white piping**, gold braid and epaulettes. Crosswalk outfit: a **grey suit, barefoot** (a chibi barefoot gag: he holds his sandals in one hand). |
| Instrument | A **sunburst violin-shaped bass**: an original curvy body with 2 pickups, played **left-handed**, so the neck points to *his* left. Special emote prop: a **cor anglais**. |
| Accessories | A tiny **blackbird** perches on the bass headstock in idle (a 6×5 sprite; the Blackbyrd tie). |
| Palette (14) | SK1 `#f9cfb0` `#e0a084` `#a8624e` · hair `#4a3022` `#2e1c14` `#7a5238` · tunic `#5ab0f0` `#2f78c8` `#b0e0ff` · piping `#fbfbf6` · gold `#f4c542` `#b8862a` · bass `#e0a040` `#8a3a1a` · *Crosswalk swap:* suit `#6a6a74` `#4a4a54` |
| Idle quirk | A head-bob on the beat with a little bass bounce. The blackbird hops on the headstock. |
| Signature emote | **"Thumbs up!"** A **double thumbs-up**, a wink, an eyebrow raise, and a sparkle-tooth grin. |
| Portrait | The 7 base expressions plus **charming grin**, **earnest** (soft eyes: the ballad face), and **cheeky** (tongue poke). |
| Partner | **Blackbyrd** (Aero). Song tie: [C]. |

#### 5.3 Elite "George"

| Spec | |
|---|---|
| Size | 47px. |
| Silhouette | **Thick, swept, longer hair** with **full sideburns**, and **heavier brows**. A **large hollow-body guitar** (a big rounded body: the most "mass" in the band's silhouettes). |
| Head / eyes | 2×2 eyes, heavy-lidded and calm. Strong 2px brows. A moustache. |
| Outfit | **Red-orange satin** tunic, gold braid, a white accent sash. Crosswalk outfit: **double denim** (jacket plus jeans). |
| Instrument | A **dark-walnut hollow-body guitar** (an original with f-holes, a big body and a rounded cutaway). Meditation prop: a **sitar** in a special emote [C: George's sitar, 1965–67]. Pepper prop: a **piccolo**. |
| Accessories | A **sun pendant**: a 3×3 gold disc with a glow accent (the sunrise motif). |
| Palette (13) | SK2 `#eeb68e` `#c9846a` `#8a4c3c` · hair `#3a2418` `#22140c` `#6a4630` · tunic `#ff6a3a` `#c8402a` `#ffb07a` · gold `#f4c542` `#b8862a` · guitar `#7a4a20` `#c8823a` · *Crosswalk swap:* denim `#4a6aa8` `#2e4a80` |
| Idle quirk | Eyes closed, a slow meditative sway, and fingers moving quietly on the strings. |
| Signature emote | **"Sunrise."** He brings his palms together and gives a small bow. A **sunrise glow** rises behind him (an orange-to-gold gradient halo FX) and he opens his eyes with a quiet smile. |
| Portrait | The 7 base expressions plus **serene** (eyes closed, faint smile), **quiet wry smile**, and **intense** (the guitar-solo focus). |
| Partner | **Not listed in the bible. Flag to owner (§10).** Do not invent one in art. |

#### 5.4 Elite "Ringo"

| Spec | |
|---|---|
| Size | **44px** (the shortest Elite). Stocky and cheerful. |
| Silhouette | A **side-swept mop with a fringe**, a **moustache plus short beard**, **droopy kind brows**, and **rings on his fingers** (gold pixels on both hands: the namesake). He sits on a **hovering drum riser** in battle. |
| Head / eyes | 2×2 eyes under **droopy, slightly sad-puppy brows** (warm, not sad). Friendly. |
| Outfit | **Pink satin** tunic with **lime-green chevrons** on the sleeve, gold braid and medals. Crosswalk outfit: a **black suit**. |
| Instrument | A **black-pearl drum kit** with an oyster swirl (an original 3-drum riser). The bass-drum head carries custom in-world lettering of the tribute band's name (**not** the real "drop-T" logo). Pepper prop: a **trumpet**. |
| Accessories | **Rings** on all fingers (1px gold per finger, visible in emotes). A **periscope-shaped drumstick holder** (the Yellowsub tie). |
| Palette (14) | SK1 `#f9cfb0` `#e0a084` `#a8624e` · hair `#3a281e` `#22160f` `#6a4a36` · tunic `#ff5fa8` `#d43a84` `#ffb0d6` · chevrons `#b6f03a` · gold `#f4c542` `#b8862a` · pearl `#2a2a36` `#6a6a88` · *Crosswalk swap:* suit `#22202a` `#3a3846` |
| Idle quirk | **Twirls a drumstick** (4 frames), then taps a rim-shot on the air. |
| Signature emote | **"Peace and love!"** **Both hands throw peace signs** with a bouncing, beaming grin, and the rings glint. This is different from John's single, cool peace sign. |
| Portrait | The 7 base expressions plus **beaming** (eyes ^ ^), **droll** (deadpan, droopy-browed), and **giggling**. |
| Partner | **Yellowsub** (Hydro/Ferro). Song tie: [C]. |

### (d) Do / Don't
- **Do** make the four readable as a set from **tunic colour alone**: green, blue, red-orange, pink.
- **Do** separate them by hair silhouette: the curtains plus round glasses, the dome mop, the swept thick hair with sideburns, and the side-swept mop plus beard.
- **Do** hand-draw Paul's **right-facing** sprite. **Never mirror a left-handed bassist.**
- **Don't** draw the real men's faces. No caricatured noses or likenesses.
- **Don't** reproduce the Sgt. Pepper collage, the drum-skin artwork, the Abbey Road photo framing, the Apple logo or the drop-T logo.
- **Don't** quote any lyrics in emote bubbles. Use music notes and sparkles only (bible §10: originality).

---------------------------------------------------------------------------------------------------

## 6. Champions "Queen" plus championship regalia (Topic 6)

**Bible facts:**
- The Champions are a **Queen tribute supergroup** with the stage names **Freddie, Brian, Roger and John**.
- They have an epic Champions theme inspired by Queen's songs, music-synced.
- The Queen partner Tokonmon listed in the bible:
  - **Killerqueen** (Ecto/Bio queen bee)
  - **Bohemoth** (Echo/Ecto)
  - **Dontstopmeow** (Volto speed cat)
  - **Radiogaga** (Echo/Volto radio robot)
  - **Bitesdust** (Geo)

### (a) References
- [S] ET Online, *The most unforgettable iconic looks from Freddie Mercury*. https://etonline.com/the-most-unforgettable-iconic-looks-from-freddie-mercury-pics-112880
- [S] CNN, *Queen performs at Live Aid (Neal Preston photos)*. https://cnn.com/interactive/2018/11/opinions/queen-live-aid-cnnphotos
- [S] ET Online, *How the Bohemian Rhapsody costume designer recreated the Live Aid look* (boxing boots, belt studs). https://etonline.com/how-bohemian-rhapsody-costume-designer-recreated-the-iconic-live-aid-performance-look-119779
- [S] The Hollywood Reporter, *Wrangler's Bohemian Rhapsody-inspired collection* (washed jeans). https://www.hollywoodreporter.com/gallery/wrangler-launches-bohemian-rhapsody-inspired-collection-1158408/
- [S] CNN Style, *Remember when: Freddie Mercury's yellow jacket*. https://edition.cnn.com/style/article/remember-when-freddie-mercury-jacket
- [S] uDiscover Music, *Freddie Mercury photos: a visual history*. https://www.udiscovermusic.com/stories/freddie-mercury-pictures/
- [S] The Strange Brew, *Freddie Mercury's iconic pieces* (Wembley, 12 July 1986). https://thestrangebrew.co.uk/freddie-mercury-iconic-pieces/
- [S] Smithsonian, *Freddie Mercury's boundary-pushing costumes at the V&A*. https://www.smithsonianmag.com/smart-news/freddie-mercurys-boundary-pushing-costumes-take-center-stage-at-victoria-and-albert-museum-to-mark-80th-anniversary-his-birth-180989403/
- [S] Wikipedia, *Microphone stand* (the "bottomless" mic stand). https://en.wikipedia.org/wiki/Microphone_stand
- [S] Mental Floss, *Today would have been Freddie Mercury's 65th birthday* (the stand-snapping anecdote). https://mentalfloss.com/article/28684/today-would-have-been-freddie-mercurys-65th-birthday
- [C] Wikipedia, *Red Special* (Brian May's home-built guitar). https://en.wikipedia.org/wiki/Red_Special
- [C] Wikipedia, *Brian May*. https://en.wikipedia.org/wiki/Brian_May
- [C] Wikipedia, *Roger Taylor (Queen drummer)*. https://en.wikipedia.org/wiki/Roger_Taylor_(Queen_drummer)
- [C] Wikipedia, *John Deacon*. https://en.wikipedia.org/wiki/John_Deacon
- [C] Wikipedia, *Queen (band)* (the Queen crest). https://en.wikipedia.org/wiki/Queen_(band)
- [C] Wikipedia, *Magic Tour* (1986: Wembley and Knebworth; the crown-and-robe finale). https://en.wikipedia.org/wiki/Magic_Tour
- [C] Wikipedia, *Zandra Rhodes* (the 1974 pleated "wing" stage tops). https://en.wikipedia.org/wiki/Zandra_Rhodes
- [C] Wikipedia, *Live Aid* (13 July 1985, Wembley Stadium). https://en.wikipedia.org/wiki/Live_Aid
- [C] Wikipedia, *Radio Ga Ga* (the synchronized overhead double-clap). https://en.wikipedia.org/wiki/Radio_Ga_Ga

### (b) Study notes

**Freddie, Live Aid (1985)** [S]:
- A **white tank top** and **light washed high-waisted jeans** (Wrangler, per one source).
- A **studded belt** with a **matching studded armband** on the **right bicep**.
- White **boxing boots**: Adidas reproduced them for the 2018 film.
- The **bottomless mic stand**: the top half only.
- Short dark hair and a moustache.

**Freddie, Magic Tour / Wembley, 12 July 1986** [S]:
- A **bright yellow cropped military jacket** by **Diana Moseley**, with **gold buckles, eyelets and trim**. It was one of three cropped military coats, inspired by **Spanish opera costumes**.
- **White trousers with a red stripe** down each leg, embellished with gold.
- [C] The shows ended with Freddie in a **crown and a red, ermine-trimmed robe**.

**The bottomless mic stand** [S]:
- Early in Queen's career a stand snapped or came off its base mid-show. He kept performing with the top half and **used a "bottomless" stand from then on**.
- The story is folklore-grade. Its *visual* is fact: a short chrome rod used as a baton, sceptre and pointer.

**Freddie, 1970s** [C]:
- Zandra Rhodes **white pleated "wing" tops**.
- **Harlequin and diamond catsuits**.
- **Black nail polish** on one hand.
- **Long black shag hair**.

**Brian May** [C, verify]:
- A **huge cloud of dark curly hair** (the strongest silhouette in rock).
- The **Red Special**, built by Brian and his father from **old fireplace mahogany** (about 1963–64), with three pickups and many switches, played with a **sixpence coin** as a pick.
- 1970s stage wear: Zandra Rhodes **pleated white winged tops**, and **clogs**.
- Holds a **PhD in astrophysics**: the star motif.

**Roger Taylor** [C, verify]:
- Drummer and high harmonies. **Blond feathered hair**, often **sunglasses**.
- A **large gong** behind the kit, struck at the end of the big ballad.
- Wrote **"Radio Ga Ga"**, which gave the crowd the **overhead double-clap**.

**John Deacon** [C, verify]:
- The **quiet bassist**, playing a P-bass-style bass.
- **Neat short hair** in the 80s (longer in the 70s), and minimal movement on stage.
- Wrote **"Another One Bites the Dust"**.

**The Queen crest** [C, verify]:
- Designed by Freddie, who studied graphic design. It is built around the members' **zodiac signs**:
  - **two lions** (Leo: Roger and John)
  - **a crab** (Cancer: Brian)
  - **two fairies** (Virgo: Freddie)
- A **large "Q" with a crown inside**, and a **phoenix** with spread wings above.

**Stage** [C, verify]:
- Huge truss **lighting rigs**, including the famous **crown-shaped rig** that rose at the start of shows in the late 70s.
- **Walls of PAR cans** in warm white, amber and red.
- **Call-and-response** with stadium crowds: the "Ay-Oh" vocal improvisation at Live Aid.
- **Stomp-stomp-clap** crowd rhythms.

**Song ties for the bible's partners** [C]:
- **Freddie** wrote "Killer Queen", "Bohemian Rhapsody" and "Don't Stop Me Now".
- **Roger** wrote "Radio Ga Ga".
- **John** wrote "Another One Bites the Dust".
- *Suggested split, so every Champion has one or two partners (owner to confirm):*

  | Champion | Partners |
  |---|---|
  | Freddie | **Killerqueen** + **Dontstopmeow** |
  | Brian | **Bohemoth** (the song's famous guitar-solo moment) |
  | Roger | **Radiogaga** |
  | John | **Bitesdust** |

### (c) Design direction: shared Champion language

**Champion palette:**
- **Royal gold plus crimson plus white**, with each member's own accent.
- **Gold** `#f6c945` `#b0802a` `#ffe27a`, **crimson** `#b0102a` `#78081e` `#e04050`, and **stage white** `#f8f6f0`.

**Scale:** adult masters at 46–50px, head 18–19px (38%). They are the "tallest" set in the game: champions literally loom.

**Stage dressing (for the maps and FX teams):**
- A **crown-shaped lighting rig** that descends at their entrance (original crown shape: five points topped with the five core-element jewels).
- Walls of warm PAR-style lights.
- **Laser fans** (2050).
- The jumbotron.
- At halftime the **crowd performs the overhead double-clap** (crowd anim `clap-overhead`, §3.20) and a **stomp-stomp-clap** pattern, both synced to the beat.

**Two Johns:** the Elite "John" and the Champion "John" must **never be confused**.

| | Elite John | Champion John |
|---|---|---|
| Hair | long, centre-parted | short, neat |
| Glasses | round glasses | none |
| Colour | green | navy and white |
| Instrument | guitar | bass |

- In UI and dialogue, show the group in the nameplate: "John · The Beatles" vs "John · Queen" (owner to confirm).

#### 6.1 Champion "Freddie"

| Spec | |
|---|---|
| Size | 48px. Broad-chested, with a showman's posture: the chest leads. |
| Silhouette | **Short slicked black hair**, a **bold moustache** (3px wide, the strongest facial mark in the cast), a **cropped yellow military jacket**, and the **half mic stand** raised overhead. |
| Head / eyes | 2×3 confident eyes and strong brows. A wide grin in emotes. **Do not exaggerate the teeth.** |
| Battle outfit ("Wembley") | A **yellow cropped military jacket** with **gold buckles** across the chest (3 rows of 1px buckles) and gold epaulettes. **White trousers with a red side stripe** (1px). White sneaker-boots. |
| Alt outfit ("Live Aid") | A **white tank**, **light-wash jeans**, a **studded belt** and a **studded armband on the right bicep**, white boxing-style boots. Used for training and hangout scenes. |
| Finale outfit ("Regalia") | A **red velvet robe with white ermine trim** and a **gold crown** (§6.5). Used when you challenge the Champions and at the credits. |
| Accessories | The **half mic stand**: a 2×12px chrome rod with a 3×3 mic head, and the glow accent (an LED ring on the mic). The bracelet is gold. |
| Palette (14) | SK2 `#eeb68e` `#c9846a` `#8a4c3c` · hair `#1a1418` `#3a3040` · jacket `#ffd23a` `#e0a01c` `#fff09a` · gold `#f6c945` `#b0802a` · trousers `#f8f6f0` `#cfcbd8` · stripe `#e02a3a` · chrome `#dfe6f0` `#8a96aa` |
| Idle quirk | One hand on his hip, the mic stand resting on his shoulder, a slow chin-up survey of the crowd. |
| Signature emote | **"Call and response."** The mic stand goes up and he gives a wordless call, a speech bubble with a ♪ appears, and **the crowd answers** with a crowd-wide ♪ burst one beat later. **Second emote:** a mic-stand **twirl and point** at his opponent ("You're next"). |
| Portrait | The 7 base expressions plus **showman** (chin up, eyes half-closed, a proud smile), **roaring** (an open-mouth stadium shout), and **tender** (soft eyes, for the post-battle respect beat). |
| Partners (*suggestion*) | **Killerqueen** (Ecto/Bio) and **Dontstopmeow** (Volto). |

#### 6.2 Champion "Brian"

| Spec | |
|---|---|
| Size | **50px** (the tallest Champion), slender. |
| Silhouette | A **huge cloud of dark curls**: a 24px-wide round mass, about **as wide as Gonda's shoulders**. It is *the* read. Add a **white pleated winged cape-top** that spreads like wings when he raises his arms, and a **red guitar**. |
| Head / eyes | 2×3 gentle eyes, soft brows, a kind small smile. |
| Hair | **Curls built from 1px C-shaped highlight hooks** in 3 tones. The outline is lumpy and round, never smooth. |
| Outfit | A **white pleated winged top** (the cape folds are vertical 1px pleat lines in light and shadow, like Zandra Rhodes), dark slim trousers, **wooden clogs** (2050: hover-soled clogs with a faint glow). The **cape lining shows a star map** (navy with gold dots: the astrophysics nod). |
| Instrument | A **deep red mahogany guitar** with an original body shape, 3 pickups, and a **row of small switches** (6 pixels) as the tell. A **silver coin pick** that glints. |
| Accessories | Star-map lining (glow accent: 3–4 twinkling star pixels). |
| Palette (14) | SK1 `#f9cfb0` `#e0a084` `#a8624e` · curls `#2a1e1e` `#4a3632` `#7a5e58` · cape `#fbfbf8` `#d4d0e0` `#a8a2c0` · guitar `#a8242e` `#6a1420` · coin `#e8e8f0` · lining `#2a2a5a` · stars `#ffe27a` · trousers `#2a2630` |
| Idle quirk | Tunes a string (head tilted, listening), then looks up at the stadium sky. |
| Signature emote | **"Guitar to the stars."** He raises the guitar overhead like a trophy, the coin pick flicks up and glints, the cape wings spread, and a starfield sparkle plays (FX). |
| Portrait | The 7 base expressions plus **stargazing** (eyes reflect stars), **solo focus** (eyes closed, brows up), and **gentle laugh**. |
| Partner (*suggestion*) | **Bohemoth** (Echo/Ecto). |

#### 6.3 Champion "Roger"

| Spec | |
|---|---|
| Size | 46px. Energetic and cocky. |
| Silhouette | **Blond feathered hair** (flicked wings at the sides), **aviator shades pushed up** or worn, drumsticks, and a **giant gong** prop behind his hovering drum riser. |
| Head / eyes | 2×3 lively eyes (when the shades are up), a cheeky lopsided grin. |
| Outfit | A black sleeveless tee with a crimson stripe, an open red leather jacket worn off one shoulder (or tied at the waist when drumming), black jeans, high-tops. |
| Instrument | A **crimson drum kit** riser and a **gold gong** (a 20px disc on a frame: the silhouette tell). |
| Accessories | Aviator shades with a tinted lens (glow accent: a cyan lens glint). Gold drumsticks for the Champion battle. |
| Palette (14) | SK1 `#f9cfb0` `#e0a084` `#a8624e` · hair `#ffe08a` `#e0b04a` `#a8783a` · shades `#2a3a5a` · lens `#6ac8ff` · tee `#2a2630` · jacket `#e0303a` `#a01e2e` · gong `#f0b43a` `#a8702a` · sticks `#f2e0b0` |
| Idle quirk | **Air-drums** on his knees (a fast 2-frame loop, 1 tick each), then a stick spin. |
| Signature emote | **"GONG!"** A two-handed strike on the gong with a **shockwave ring FX** and screen shake (1 tick). **Second emote:** the **overhead double-clap** that the whole crowd copies on the next beat (the Radiogaga tie). |
| Portrait | The 7 base expressions plus **cocky grin** (shades down), **falsetto shout** (mouth tall "O", eyes squeezed), and **cool** (shades on, unreadable). |
| Partner (*suggestion*) | **Radiogaga** (Echo/Volto). |

#### 6.4 Champion "John"

| Spec | |
|---|---|
| Size | 46px. Composed and still. |
| Silhouette | **Neat short brown hair** with a side part. A **simple smart jacket over a light shirt**. A **sunburst bass** held low. **Minimal motion**: his stillness is his signature among three showmen. |
| Head / eyes | 2×2 calm eyes and a small closed smile. He reveals a rare wide grin only on a win. |
| Outfit | A navy smart jacket over a white open-collar shirt, grey slacks, brown shoes. |
| Instrument | A **sunburst P-style bass** (an original body) with a tortoiseshell-coloured guard. |
| Accessories | A **rock-shaped pick** necklace (the Bitesdust tie; glow accent: a faint amber stone). |
| Palette (14) | SK1 `#f9cfb0` `#e0a084` `#a8624e` · hair `#6a4a30` `#4a3220` · shirt `#e8ecf2` `#b8c0d0` · jacket `#3a4a6a` `#26324a` · bass `#e0a040` `#8a3a1a` `#2a1a14` · guard `#a8642e` · stone `#ffb04a` |
| Idle quirk | A **steady nod on the beat** (metronome-precise: 1px every beat in music-sync mode). He barely moves otherwise. |
| Signature emote | **"Bassline drop."** A slow nod, a single **heavy bass-pluck** (dust-ring FX from the ground: Geo), and one small sidestep. Understated and devastating. |
| Portrait | The 7 base expressions plus **quiet confidence** (eyes closed, small smile), **rare wide grin** (the special beat), and **focused**. |
| Partner (*suggestion*) | **Bitesdust** (Geo). |

### 6.5 Championship regalia

This is what the Champions wear for the final challenge, and what the **player wins** on becoming League champion (bible §2 goal). The regalia items also become phone and bracelet **cosmetics** (bible §8).

| Item | Design | Palette |
|---|---|---|
| **Champion robe** | A **crimson velvet cape** with **white ermine trim** (black "tail" flecks: 1px dots every 3px), a gold clasp at the collar, and a 2-frame sway. The Magic Tour finale homage [C]. Sprite overlay: 20×22px, drawn for all 4 directions. | `#b0102a` `#78081e` `#e04050` · ermine `#f8f6f0` `#d8d4e0` · flecks `#1a1a1a` (the one near-black allowed) · gold `#f6c945` |
| **Crown** | A 5-point gold crown (9×6px on the sprite) topped with **five jewels in the core-element colours**: Pyro, Hydro, Bio, Geo, Echo. | gold `#ffe27a` `#f6c945` `#b0802a` · jewels `#ff3a3a` `#3a9aff` `#4cdf4a` `#f0a030` `#c070ff` |
| **League crest** (original) | A **crowned shield** holding a **stylised "L" (League)**. Four guardian charges sit around it, echoing the *structure* of Queen's zodiac crest without copying it: **a bee** (Killerqueen), **a cat** (Dontstopmeow), **a radio** (Radiogaga) and **a boulder** (Bitesdust). A **winged Bohemoth-silhouette** spreads above like a crest-bird. | gold, crimson, white, plus a navy field `#1a2240` |
| **Champion sceptre** | A **chrome half-stand rod** (the mic-stand homage) topped with a **Spectral soul stone** (bible §5). The player's victory prop for the credits pose. | chrome `#dfe6f0` `#8a96aa` · stone `#7ff6ff` `#c6a8ff` |
| **Champion sash** (player cosmetic) | A white sash with a gold crest, worn over any player preset. | white, gold, crimson |

### (d) Do / Don't
- **Do** make each Champion readable by **one tell**:
  - Freddie: the moustache plus the yellow jacket plus the half stand
  - Brian: the curl cloud plus the white wings
  - Roger: the blond feathers plus the gong
  - John: the stillness plus the sunburst bass
- **Do** sync their emotes and idles to the beat. They are the music-sync showcase (bible §6 and §10).
- **Do** keep the crowd call-and-response as **gesture and rhythm only**.
- **Don't** reproduce real faces, Queen's crest, album artwork or real lyrics. Freddie's call-and-response emote is a **wordless** ♪ call; never transcribe his real ad-libs.
- **Don't** mirror Brian's or John's instrument sprites. Hand-draw the right-facing views.
- **Don't** make Freddie's overbite or any physical trait a caricature. These are respectful homages.

---------------------------------------------------------------------------------------------------
